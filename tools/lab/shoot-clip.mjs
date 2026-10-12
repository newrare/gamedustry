#!/usr/bin/env node
/* Shoot a vertical gameplay CLIP of one game: 1080×1920, N seconds, every
   frame on the beat of the video rather than of the wall clock.

   It is the raw material of a promo video (promo/<slug>/, rendered by
   HyperFrames): the round as a player sees it, HUD, callouts and juice
   included, with the web build's MENU / OPTIONS corner hidden.

   The web build is played in a headless Chrome under VIRTUAL TIME. Nothing is
   stepped by hand: the motor's own rAF loop, its `dt`, the CSS animations of
   the HUD and the callouts and the game's timers all read the one clock this
   tool advances by exactly 1/fps between two captures. A capture takes far
   longer than 1/fps, and it does not matter — the page never sees the wall.
   That is the difference with shoot-screens.mjs, whose driver steps the
   simulation itself and therefore lets the DOM run on its own time.

   What is played is the game's PILOT, a hook written inside its Game module
   (the same trick as shoot-screens' GAME_PILOT): it sees the board, so it
   plays the round a promo wants to show rather than a blind one.

   The sound is not recorded — WebAudio renders on the wall clock. Every
   `Sound.clip` / `Sound.ui` call is LOGGED with its frame instead, and the
   composition lays the same samples back on the timeline (events.json).

   Usage:
     node tools/lab/shoot-clip.mjs echomaze                    # → dist/clip/echomaze/
     node tools/lab/shoot-clip.mjs echomaze --seconds 24 --level 3 --seed 7
     node tools/lab/shoot-clip.mjs echomaze --out promo/echomaze/assets --no-build
*/

import { spawn, spawnSync } from "node:child_process";
import { reap, sweep, reportSweep } from "./chrome.mjs";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
var W = 720, H = 1280, DPR = 1.5;                    // 1080×1920 out of the design space

var argv = process.argv.slice(2);
function opt(name, def) {
  var i = argv.indexOf("--" + name);
  return i >= 0 && argv[i + 1] != null ? argv[i + 1] : def;
}
var VALUED = ["--seconds", "--fps", "--level", "--seed", "--lang", "--out"];
var slug = argv.find(function (a, i) {
  return !a.startsWith("--") && (i === 0 || VALUED.indexOf(argv[i - 1]) < 0);
});
var seconds = +opt("seconds", 20);
var fps = +opt("fps", 30);
var level = +opt("level", 1);
var seed = +opt("seed", 1);
var lang = opt("lang", "en");
var outDir = path.resolve(ROOT, opt("out", "dist/clip/" + slug));
var build = argv.indexOf("--no-build") < 0;

/* The pilots. `anchor` is the text the hook is written in front of, inside the
   game's script block; `js` publishes `window.__PILOT.tick(frame)`, called once
   per video frame by the driver, which plays the round through the motor's
   own Input — the same gestures a finger makes. */
var PILOT = {
  /* echomaze: one look at the maze, then pulses into two WRONG mouths — a
     dead end lights up, which is the game's whole idea in one beat — then the
     true mouth, and again until a pulse reaches the gate. Each shot is a real drag:
     the finger lands low in the bay, sweeps the sight onto the mouth, lets go. */
  echomaze: {
    anchor: "return { reset: reset, update: update, render: render,",
    js: `
    window.__PILOT = (function () {
      var shot = 0, t = 0, wait = 0;
      function target(m) {
        return { x: M.x0 + (mouthCol(m) + C.mouthW / 2) * M.cw, y: M.y1 };
      }
      function plan(i) {
        if (i === 0) return (entryMouth + 3) % MOUTHS;   // two decoys, far then near
        if (i === 1) return (entryMouth + 1) % MOUTHS;
        return entryMouth;
      }
      return { tick: function (H) {
        if (phase !== "play") return;
        if (wait > 0) { wait--; return; }
        var m = plan(shot), p = target(m);
        var from = { x: cannon.x + (p.x > cannon.x ? -160 : 160), y: cannon.y - 60 };
        var k = t / 18;
        if (t === 0) H.Input.at("down", from.x, from.y);
        else if (t <= 18) H.Input.at("move", from.x + (p.x - from.x) * k, from.y + (p.y - from.y) * k);
        else if (t === 26) {
          H.Input.at("up", p.x, p.y);
          shot++; t = -1; wait = shot <= 2 ? 50 : 30;   // let a dead end glow
        }
        t++;
      } };
    })();
    `
  }
};
if (!slug || !PILOT[slug]) {
  console.error("usage: node tools/lab/shoot-clip.mjs <slug> [--seconds 20] [--level 1] [--seed 1]"
    + "\n  slugs with a pilot: " + Object.keys(PILOT).join(" "));
  process.exit(1);
}

// --- Injected code -------------------------------------------------------

var SEED_JS = `<script>
(function () {
  var q = new URLSearchParams(location.search);
  var s = (parseInt(q.get("seed"), 10) || 1) * 2654435761 % 2147483647;
  if (s <= 0) s += 2147483646;
  Math.random = function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
})();
</script>`;

var CTLS_CSS = `<style>#web-ctls, #lv-hud, #lv-log { display: none !important; }</style>`;

/* Inside the motor's IIFE: a handle, and the sound log. */
var HOOK_JS = `
  window.__H = { startGame: startGame, Input: Input, Layout: Layout, CONFIG: CONFIG,
                 state: function () { return State; } };
  window.__SFX = [];
  (function () {
    var clip = Sound.clip, ui = Sound.ui;
    Sound.clip = function (name, vol, rate) {
      window.__SFX.push({ t: window.__T ? window.__T() : 0, kind: "clip", name: name, vol: vol == null ? 1 : vol, rate: rate || 1 });
      return clip.apply(Sound, arguments);
    };
    if (ui) Sound.ui = function (role, vol, rate) {
      window.__SFX.push({ t: window.__T ? window.__T() : 0, kind: "ui", name: role, vol: vol == null ? 1 : vol, rate: rate || 1 });
      return ui.apply(Sound, arguments);
    };
  })();
`;

var LV_HOOK_JS = `
  window.__LV = { arm: arm };
`;

/* The driver: arms the level and starts the round when told to, then hands
   the pilot one tick per animation frame. Under virtual time an animation
   frame IS a video frame. */
var DRIVER_JS = `<script>
(function () {
  var q = new URLSearchParams(location.search);
  var LEVEL = parseInt(q.get("level"), 10) || 0;
  var started = false, t0 = 0, ticks = 0;
  window.__T = function () { return (performance.now() - t0) / 1000; };
  window.__go = function () {
    var H = window.__H;
    if (LEVEL && window.__LV) window.__LV.arm(LEVEL);
    t0 = performance.now();
    H.startGame();
    started = true;
  };
  /* The pilot counts in 1/60 s steps of the page's clock, whatever the rate
     the animation frames come at under virtual time. */
  function tick() {
    requestAnimationFrame(tick);
    if (!started) return;
    var due = Math.floor(window.__T() * 60);
    while (ticks < due) {
      ticks++;
      if (window.__PILOT && window.__H.state() === "playing") window.__PILOT.tick(window.__H);
    }
  }
  requestAnimationFrame(tick);
})();
</script>`;

function prepare(tmpDir) {
  var src = fs.readFileSync(path.join(ROOT, "dist", "itch", slug, "index.html"), "utf8");
  var firstScript = src.indexOf("</script>");
  var close = src.lastIndexOf("})();", firstScript);
  if (close < 0) throw new Error(slug + ": no IIFE close");
  src = src.slice(0, close) + HOOK_JS + src.slice(close);

  var at = src.indexOf(PILOT[slug].anchor);
  if (at < 0 || at > src.indexOf("</script>")) throw new Error(slug + ": no pilot anchor");
  src = src.slice(0, at) + PILOT[slug].js + "\n    " + src.slice(at);

  var head = src.indexOf("<head>");
  src = src.slice(0, head + 6) + "\n" + SEED_JS + "\n" + CTLS_CSS + src.slice(head + 6);

  var lv = src.indexOf("window.__LEVELS__ = {");
  if (lv >= 0) src = src.slice(0, lv) + LV_HOOK_JS + "  " + src.slice(lv);
  src = src.replace("</body>", DRIVER_JS + "\n</body>");

  var out = path.join(tmpDir, slug + ".html");
  fs.writeFileSync(out, src);
  return out;
}

// --- Chrome over the DevTools protocol -----------------------------------

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function launchChrome(profileDir) {
  var child = spawn(CHROME, [
    "--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profileDir,
    "--hide-scrollbars", "--mute-audio", "--autoplay-policy=no-user-gesture-required",
    "--no-first-run", "--window-size=" + W + "," + H, "about:blank"
  ], { stdio: "ignore" });
  var portFile = path.join(profileDir, "DevToolsActivePort");
  for (var i = 0; i < 100; i++) {
    if (fs.existsSync(portFile)) {
      var txt = fs.readFileSync(portFile, "utf8").split("\n");
      if (txt[0]) return { child: child, port: parseInt(txt[0], 10) };
    }
    await sleep(100);
  }
  child.kill();
  throw new Error("Chrome did not open a debugging port");
}

async function cdp(port) {
  var info = await (await fetch("http://127.0.0.1:" + port + "/json/version")).json();
  var ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise(function (res, rej) { ws.onopen = res; ws.onerror = rej; });
  var nextId = 1, pending = new Map(), listeners = [];
  ws.onmessage = function (m) {
    var msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      var p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.rej(new Error(msg.error.message)); else p.res(msg.result);
    } else if (msg.method) listeners.forEach(function (fn) { fn(msg); });
  };
  return {
    send: function (method, params, sessionId) {
      var id = nextId++;
      ws.send(JSON.stringify({ id: id, method: method, params: params || {}, sessionId: sessionId }));
      return new Promise(function (res, rej) { pending.set(id, { res: res, rej: rej }); });
    },
    once: function (method) {
      return new Promise(function (res) {
        function fn(msg) {
          if (msg.method !== method) return;
          listeners.splice(listeners.indexOf(fn), 1); res(msg.params);
        }
        listeners.push(fn);
      });
    },
    close: function () { ws.close(); }
  };
}

async function evaluate(client, sid, expr) {
  var r = await client.send("Runtime.evaluate", { expression: expr, returnByValue: true }, sid);
  return r.result ? r.result.value : undefined;
}

// --- Run -----------------------------------------------------------------

if (build) {
  var r = spawnSync(process.execPath, ["tools/build/build.mjs", "--target=web", "--dest=itch", "--game=" + slug],
    { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) throw new Error("the web build failed");
}

reportSweep(sweep("shoot-clip-"));
var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shoot-clip-"));
var framesDir = path.join(tmpDir, "frames");
fs.mkdirSync(framesDir);
var chrome = await launchChrome(path.join(tmpDir, "profile"));
reap(chrome.child, { label: "shoot-clip" });
var client = await cdp(chrome.port);

var t = await client.send("Target.createTarget", { url: "about:blank" });
var sid = (await client.send("Target.attachToTarget", { targetId: t.targetId, flatten: true })).sessionId;
await client.send("Page.enable", {}, sid);
await client.send("Runtime.enable", {}, sid);
await client.send("Emulation.setDeviceMetricsOverride",
  { width: W, height: H, deviceScaleFactor: DPR, mobile: true }, sid);

var file = prepare(tmpDir);
await client.send("Page.navigate",
  { url: "file://" + file + "?first=0&seed=" + seed + "&level=" + level + "&lang=" + lang }, sid);

// Loading runs on the wall clock: wait for the title screen to stand.
for (var i = 0; ; i++) {
  await sleep(150);
  if (await evaluate(client, sid, "!!(window.__H && window.__H.state() === 'intro')")) break;
  if (i > 200) throw new Error("the game never reached its title screen");
}
await sleep(400);

// From here the page's clock is ours.
await client.send("Emulation.setVirtualTimePolicy", { policy: "pause" }, sid);
await evaluate(client, sid, "window.__go()");

var total = Math.round(seconds * fps);
var budget = 1000 / fps;
for (var f = 0; f < total; f++) {
  var done = client.once("Emulation.virtualTimeBudgetExpired");
  await client.send("Emulation.setVirtualTimePolicy", { policy: "advance", budget: budget }, sid);
  await done;
  var shot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, sid);
  fs.writeFileSync(path.join(framesDir, String(f).padStart(5, "0") + ".png"), Buffer.from(shot.data, "base64"));
  if (f % fps === 0) process.stdout.write("\r  " + slug + " " + (f / fps) + " / " + seconds + " s   ");
}
process.stdout.write("\n");

var state = await evaluate(client, sid, "window.__H.state()");
var sfx = await evaluate(client, sid, "JSON.stringify(window.__SFX)");
var clock = await evaluate(client, sid, "window.__T()");
client.close();
chrome.child.kill("SIGKILL");

fs.mkdirSync(outDir, { recursive: true });
var mp4 = path.join(outDir, "gameplay.mp4");
var enc = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps),
  "-i", path.join(framesDir, "%05d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "16",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], { stdio: "inherit" });
if (enc.status !== 0) throw new Error("ffmpeg failed");

// The sound log, in seconds of the page's clock since the round started.
var events = JSON.parse(sfx).map(function (e) {
  return { t: +e.t.toFixed(3), kind: e.kind, name: e.name, vol: e.vol, rate: e.rate };
});
fs.writeFileSync(path.join(outDir, "events.json"), JSON.stringify(
  { slug: slug, level: level, seed: seed, fps: fps, seconds: seconds, endState: state, clock: +clock.toFixed(3), events: events },
  null, 2) + "\n");
await sleep(300);
fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
console.log("wrote " + path.relative(ROOT, mp4) + " (" + events.length + " sound events, round " + state + ")");
