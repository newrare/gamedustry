#!/usr/bin/env node
/* Shoot gameplay screenshots for every game into assets/screen/.
 *
 * A playable is a single self-contained HTML file with everything wrapped in an
 * IIFE, so nothing is reachable from the outside. This tool copies each game to
 * a temporary directory with three injections:
 *
 *   1. a seeded LCG over Math.random, so a run is reproducible,
 *   2. a `window.__H` handle on the motor internals (startGame, Loop,
 *      frameUpdate/frameRender, Input, Layout, Pop, Overlay, State),
 *   3. a driver that stops the motor's rAF loop and steps the simulation by
 *      hand: it fast-forwards to the middle of a round, wipes the callout
 *      layers, then plays the last frames at real speed — CSS-animated pops and
 *      toasts only look right when the simulation runs at the wall clock — and
 *      finally raises `window.__shot` to say "this frame is worth keeping".
 *
 * Chrome is driven over the DevTools protocol rather than with `--screenshot`:
 * the CLI shoots whenever its virtual-time budget expires, which lands on a
 * different (and for some games barely started) frame every run. Here the page
 * itself decides when it is ready and the capture happens on that signal.
 *
 * Usage:
 *   node tools/shoot-screens.mjs [slug ...] [--shots 10] [--png] [--keep]
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

var ROOT = path.resolve(new URL("..", import.meta.url).pathname);
var GAMES_DIR = path.join(ROOT, "games");
var OUT_DIR = path.join(ROOT, "assets", "screen");
var CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
var W = 720, H = 1280;                               // the design resolution

// --- CLI -----------------------------------------------------------------
var argv = process.argv.slice(2);
var slugs = [];
var shots = 10;
var keep = false;
var png = false;
for (var i = 0; i < argv.length; i++) {
  if (argv[i] === "--shots") shots = parseInt(argv[++i], 10);
  else if (argv[i] === "--keep") keep = true;
  else if (argv[i] === "--png") png = true;
  else slugs.push(argv[i]);
}
if (!slugs.length) {
  slugs = fs.readdirSync(GAMES_DIR).filter(function (d) {
    return fs.existsSync(path.join(GAMES_DIR, d, "index.html"));
  }).sort();
}

// --- Injected code -------------------------------------------------------

// Seeded PRNG, installed before any game code runs.
var SEED_JS = `<script>
(function () {
  var q = new URLSearchParams(location.search);
  var s = (parseInt(q.get("seed"), 10) || 1) * 2654435761 % 2147483647;
  if (s <= 0) s += 2147483646;
  Math.random = function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
})();
</script>`;

// Handle on the motor internals, injected inside the IIFE.
var HOOK_JS = `
  window.__H = {
    startGame: startGame, frameUpdate: frameUpdate, frameRender: frameRender,
    Loop: Loop, Input: Input, Layout: Layout, CONFIG: CONFIG, Beat: Beat,
    Pop: Pop, Overlay: Overlay, state: function () { return State; }
  };
`;

// The pilot + stepper. Runs after the game script.
var DRIVER_JS = `<script>
(function () {
  var q = new URLSearchParams(location.search);
  var target = parseInt(q.get("frames"), 10) || 240;  // sim frames to play
  var DT = 1 / 60;
  var PACED = 110;              // frames before the shot played at wall speed
  var HARD_CAP = target * 3 + 240;                   // bound the pilot's retries
  var frame = 0, roundFrame = 0, rounds = 0, side = 0, lastBeat = -1;
  var started = false, cleaned = false;

  /* A scripted player, one per demo type. It is not good at any of these games —
     it only has to keep a round alive and busy long enough to be worth a shot. */
  function pilot(H, n) {
    var L = H.Layout, demo = (H.CONFIG.intro && H.CONFIG.intro.demo) || "tap";
    if (demo === "swipe") {                          // one flick every ~0.6 s
      if (n % 36 === 0) H.Input.swipe(n % 72 === 0 ? 1 : -1);
      return;
    }
    if (demo === "hold") {                           // lean one way, then the other
      if (n % 48 === 0) H.Input.at("down", (side++ % 2) ? L.left + L.w * 0.25 : L.right - L.w * 0.25, L.cy);
      else if (n % 48 === 30) H.Input.at("up", L.cx, L.cy);
      return;
    }
    if (demo === "drag" || demo === "aim") {         // aim across the arc, release
      var k = n % 42;
      var ax = L.cx, ay = L.bottom - L.h * 0.12;
      var tx = L.left + L.w * (0.2 + 0.6 * Math.abs(Math.sin(n * 0.07)));
      var ty = L.top + L.h * 0.25;
      if (k === 0) H.Input.at("down", ax, ay);
      else if (k < 20) H.Input.at("move", ax + (tx - ax) * (k / 20), ay + (ty - ay) * (k / 20));
      else if (k === 20) H.Input.at("up", tx, ty);
      return;
    }
    // "tap". A game played on the beat is scored on timing, so tap the grid
    // instead of a cadence of our own — that is the difference between a board
    // full of combos and a board full of MISS.
    var m = H.CONFIG.music;
    if (m && m.bpm > 0 && H.Beat) {
      var b = Math.floor(H.Beat.beats());
      if (b !== lastBeat) { lastBeat = b; tap(H, L.cx, L.cy); }
      return;
    }
    if (n % 30 === 0) tap(H, L.cx, L.cy);            // otherwise every 0.5 s
  }
  function tap(H, x, y) { H.Input.at("down", x, y); H.Input.at("up", x, y); }

  function step(H) {
    if (H.state() !== "playing") {                   // the pilot died: play again
      H.startGame(); H.Loop.stop();
      roundFrame = 0; rounds++; cleaned = false;
    }
    pilot(H, frame);
    H.frameUpdate(DT);
    frame++; roundFrame++;
  }

  /* The frame we keep must belong to a round that has been running for a while:
     the first second of a round is an empty board. The bar drops as the pilot's
     retries eat into the cap — a short round beats a screenshot of a respawn. */
  function need() {
    var lost = frame - roundFrame;                   // frames spent in dead rounds
    return Math.max(120, Math.round(target * (1 - lost / HARD_CAP)));
  }
  function ready() { return frame >= HARD_CAP || roundFrame >= need(); }

  function tick() {
    var H = window.__H;
    requestAnimationFrame(tick);
    if (!H) return;
    if (!started) {
      if (H.state() !== "intro") return;              // still loading
      H.startGame();
      H.Loop.stop();                                  // we drive the clock
      started = true;
    }
    if (ready()) {
      H.frameRender();                                // keep the canvas fresh
      window.__shot = 1;                              // the host may capture now
      return;
    }
    var settle = need() - PACED;
    if (roundFrame < settle) {                        // fast-forward, cheaply
      for (var i = 0; i < 20 && roundFrame < settle && frame < HARD_CAP; i++) step(H);
      if (roundFrame >= settle && !cleaned) {         // drop the piled-up callouts
        H.Pop.clear(); H.Overlay.clear(); cleaned = true;
      }
    } else {
      step(H);                                        // one frame per animation frame
    }
    H.frameRender();
    window.__progress = frame;
  }
  requestAnimationFrame(tick);
})();
</script>`;

function prepare(slug, tmpDir) {
  var src = fs.readFileSync(path.join(GAMES_DIR, slug, "index.html"), "utf8");
  var head = src.indexOf("<head>");
  if (head < 0) throw new Error(slug + ": no <head>");
  src = src.slice(0, head + 6) + "\n" + SEED_JS + src.slice(head + 6);

  var close = src.lastIndexOf("})();");               // the game IIFE
  if (close < 0) throw new Error(slug + ": no IIFE close");
  src = src.slice(0, close) + HOOK_JS + src.slice(close);

  src = src.replace("</body>", DRIVER_JS + "\n</body>");

  var out = path.join(tmpDir, slug + ".html");
  fs.writeFileSync(out, src);
  return out;
}

// --- Chrome over the DevTools protocol -----------------------------------

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function launchChrome(profileDir) {
  var child = spawn(CHROME, [
    "--headless=new",
    "--remote-debugging-port=0",
    "--user-data-dir=" + profileDir,
    "--disable-gpu",
    "--hide-scrollbars",
    "--mute-audio",
    // A game on the musical clock (Beat) waits for its bed to actually play, and
    // there is no user gesture here to unblock it.
    "--autoplay-policy=no-user-gesture-required",
    "--no-first-run",
    "--force-device-scale-factor=1",
    "--window-size=" + W + "," + H,
    "about:blank"
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

// A very small CDP client: send(method, params) and one event listener.
async function cdp(port) {
  var info = await (await fetch("http://127.0.0.1:" + port + "/json/version")).json();
  var ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise(function (res, rej) { ws.onopen = res; ws.onerror = rej; });

  var nextId = 1, pending = new Map(), onEvent = null;
  ws.onmessage = function (m) {
    var msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      var p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.rej(new Error(msg.method + ": " + msg.error.message));
      else p.res(msg.result);
    } else if (msg.method && onEvent) onEvent(msg);
  };
  function send(method, params, sessionId) {
    var id = nextId++;
    ws.send(JSON.stringify({ id: id, method: method, params: params || {}, sessionId: sessionId }));
    return new Promise(function (res, rej) { pending.set(id, { res: res, rej: rej }); });
  }
  return {
    send: send,
    set on(fn) { onEvent = fn; },
    close: function () { ws.close(); }
  };
}

async function openPage(client) {
  var t = await client.send("Target.createTarget", { url: "about:blank" });
  var a = await client.send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
  var sid = a.sessionId;
  await client.send("Page.enable", {}, sid);
  await client.send("Runtime.enable", {}, sid);
  await client.send("Emulation.setDeviceMetricsOverride",
    { width: W, height: H, deviceScaleFactor: 1, mobile: true }, sid);
  // Headless Chrome only animates while something consumes frames: the
  // screencast is what keeps requestAnimationFrame and the CSS clock running.
  client.on = function (msg) {
    if (msg.method === "Page.screencastFrame") {
      client.send("Page.screencastFrameAck", { sessionId: msg.params.sessionId }, sid).catch(function () {});
    }
  };
  await client.send("Page.startScreencast",
    { format: "jpeg", quality: 5, maxWidth: 120, maxHeight: 220, everyNthFrame: 1 }, sid);
  return sid;
}

async function evaluate(client, sid, expr) {
  var r = await client.send("Runtime.evaluate", { expression: expr, returnByValue: true }, sid);
  return r.result ? r.result.value : undefined;
}

async function shoot(client, sid, file, seed, frames, outPath) {
  var url = "file://" + file + "?seed=" + seed + "&frames=" + frames;
  await client.send("Page.navigate", { url: url }, sid);

  var deadline = Date.now() + 90000;
  var stall = 0, last = -1;
  for (;;) {
    await sleep(120);
    if (await evaluate(client, sid, "window.__shot || 0")) break;
    var p = await evaluate(client, sid, "window.__progress || 0");
    if (p === last) stall++; else { stall = 0; last = p; }
    if (stall > 60) throw new Error("the driver stopped advancing at frame " + p);
    if (Date.now() > deadline) throw new Error("timed out at frame " + p);
  }

  var opts = png ? { format: "png" } : { format: "jpeg", quality: 82 };
  opts.captureBeyondViewport = false;
  var res = await client.send("Page.captureScreenshot", opts, sid);
  fs.writeFileSync(outPath, Buffer.from(res.data, "base64"));

  // SHOOT_DEBUG=1 reports what the shot actually caught — the pilot's mileage
  // varies a lot from game to game.
  if (process.env.SHOOT_DEBUG) {
    process.stdout.write("  " + path.basename(outPath) + " " + await evaluate(client, sid,
      'JSON.stringify({ frames: window.__progress, beats: Math.round(window.__H.Beat.beats()),' +
      ' state: window.__H.state(), score: document.getElementById("hud-score").textContent,' +
      ' right: (document.getElementById("hud-right").textContent || "").replace(/\\s+/g, "") })') + "\n");
  }
}

// --- Run -----------------------------------------------------------------

fs.mkdirSync(OUT_DIR, { recursive: true });
var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shoot-screens-"));
var profileDir = path.join(tmpDir, "profile");
var failed = 0;

var chrome = await launchChrome(profileDir);
var client = await cdp(chrome.port);
var sid = await openPage(client);

for (var s = 0; s < slugs.length; s++) {
  var slug = slugs[s];
  var file = prepare(slug, tmpDir);
  var line = [];
  for (var n = 1; n <= shots; n++) {
    var name = slug + "-" + String(n).padStart(2, "0") + (png ? ".png" : ".jpg");
    var outPath = path.join(OUT_DIR, name);
    try {
      // 6 s → 14 s of play, so the ten shots of a game sample the whole curve.
      // The floor matters: a game with a musical lead-in (chainring) has not
      // launched its first ball before ~5 s.
      await shoot(client, sid, file, n, 330 + n * 48, outPath);
      line.push(String(n).padStart(2, "0"));
    } catch (e) {
      failed++;
      line.push("!" + n);
      process.stderr.write("\n" + name + ": " + e.message + "\n");
    }
  }
  console.log(slug + "  " + line.join(" "));
}

client.close();
chrome.child.kill();
await sleep(500);                                    // let Chrome release its profile
if (!keep) fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
else console.log("kept: " + tmpDir);
process.exit(failed ? 1 : 0);
