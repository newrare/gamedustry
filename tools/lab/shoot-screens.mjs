#!/usr/bin/env node
/* Shoot gameplay screenshots for every game into assets/screen/.
 *
 * The shots come off the **web** build, not the playable: a playable carries
 * the install CTA bar, which is wrong everywhere these images are used (the
 * site cards, the itch pages, a store listing later). The web build is the
 * frame a player actually sees.
 *
 * A build is one self-contained HTML file with the game wrapped in an IIFE, so
 * nothing is reachable from the outside. This tool copies each game to a
 * temporary directory with three injections:
 *
 *   1. a seeded LCG over Math.random, so a run is reproducible,
 *   2. a `window.__H` handle on the motor internals (startGame, Loop,
 *      frameUpdate/frameRender, Input, Layout, Pop, Overlay, State),
 *   3. a driver that stops the motor's rAF loop and steps the simulation by
 *      hand up to one point of the run, wipes the callout layers, then plays
 *      the last frames at real speed — CSS-animated pops and toasts only look
 *      right when the simulation runs at the wall clock — and finally raises
 *      `window.__shot` to say "this frame is worth keeping".
 *
 * Each shot is aimed at a **progression**, a fraction of a full round, not at
 * a frame count: a board at 10% and a board at 90% are different pictures,
 * where ten shots a second apart are the same one. A timed game's round length
 * is its own `CONFIG.gameSeconds`, read after the round starts (radiam zeroes
 * it for its endless mode); an endless game has no such number, so SPAN below
 * carries how long a run of it is worth sampling. The last shot of a game is
 * its end screen.
 *
 * Chrome is driven over the DevTools protocol rather than with `--screenshot`:
 * the CLI shoots whenever its virtual-time budget expires, which lands on a
 * different (and for some games barely started) frame every run. Here the page
 * itself decides when it is ready and the capture happens on that signal.
 *
 * Usage:
 *   node tools/lab/shoot-screens.mjs [slug ...] [--shots 10] [--png] [--keep]
 *   node tools/lab/shoot-screens.mjs vipera --no-build     # reuse dist/itch
 *   node tools/lab/shoot-screens.mjs vipera --playable     # the old source
 *   node tools/lab/shoot-screens.mjs vipera --ctls         # keep MENU/OPTIONS
 *   node tools/lab/shoot-screens.mjs vipera --lang fr      # default: en
 *   SHOOT_DEBUG=1 node tools/lab/shoot-screens.mjs vipera  # what each shot caught
 */

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var GAMES_DIR = path.join(ROOT, "games");
var WEB_DIR = path.join(ROOT, "dist", "itch");
var OUT_DIR = path.join(ROOT, "assets", "screen");
var CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
var W = 720, H = 1280;                               // the design resolution

/* How many seconds of a round are worth sampling, per game. It is the *pilot's*
   reach, not a good player's: the scripted player below is bad at every one of
   these games, and a progression it cannot survive to just shoots the same
   board twice — ten shots of the same board is the thing this tool exists to
   stop doing.

   Measured, not guessed: `SHOOT_DEBUG=1 … --shots 2 --no-end` aims the second
   shot at 96% of the round and prints `reached`, the fraction of that the
   pilot actually lived to. The number here is that fraction times the span it
   was measured against. A game with no entry is one the pilot plays to the end
   of (chainring, orbinity, radiam, vipera), and it takes its round length from
   its own `CONFIG.gameSeconds`, or `_endless` when it has no clock.

   Re-measure a game after its difficulty changes; an entry that is too long
   shows up as `reached` well under 1 across its shots. */
var SPAN = {
  _endless: 30,     // a clockless round, for a game with no entry below
  arcider: 22,
  blight: 42,       // its own clock says 60, the pilot sees 40
  bouncetry: 15,
  echomaze: 18,
  gearball: 20,     // clock 45
  marshmelt: 13,    // with its SWEEP entry below; every seed reaches 12.9 s
  slipdeck: 15,     // clock 30
  spinshock: 27,
  triverse: 15
};

/* Games whose tap POINT is the aim, not just a trigger. The generic "tap"
   pilot taps the middle of the play band, which is right where a tap is a
   tap — but marshmelt flings the body along the line to the finger, so
   tapping the centre sends it nowhere and the round ends at score 0 (dead at
   frame 122 on every seed, which is what the old `marshmelt: 4` span above
   was recording). Tapping high in the band and sweeping across it crosses the
   falling rocks instead.

   Benched over 7 seeds, cadence x height x amplitude: this entry holds the
   round for 17.5 s at the median and 12.9 s at the worst seed, for ~600
   points. Halving the cadence loses ten seconds of it, and so does aiming at
   0.2 of the band instead of 0.1 — the pilot is aiming past the rocks.

   every - frames between taps.  y - fraction of the band, from its top.
   amp   - half-width of the sweep, in fractions of the band's width.
   w     - radians of sweep per frame. */
var SWEEP = {
  marshmelt: { every: 30, y: 0.10, amp: 0.42, w: 0.03 }
};

// --- CLI -----------------------------------------------------------------
var argv = process.argv.slice(2);
var slugs = [];
var shots = 10;
var keep = false;
var png = false;
var build = true;
var playable = false;
var withEnd = true;
var ctls = false;
var lang = "en";
for (var i = 0; i < argv.length; i++) {
  if (argv[i] === "--shots") shots = parseInt(argv[++i], 10);
  else if (argv[i] === "--keep") keep = true;
  else if (argv[i] === "--png") png = true;
  else if (argv[i] === "--no-build") build = false;
  else if (argv[i] === "--playable") playable = true;
  else if (argv[i] === "--no-end") withEnd = false;
  else if (argv[i] === "--ctls") ctls = true;
  else if (argv[i] === "--lang") lang = argv[++i];
  else slugs.push(argv[i]);
}
if (!slugs.length) {
  slugs = fs.readdirSync(GAMES_DIR).filter(function (d) {
    return fs.existsSync(path.join(GAMES_DIR, d, "manifest.json"));
  }).sort();
}

/* The shot plan. The progressions are spread across the whole round rather
   than bunched at the start, and the last shot is the end screen — the one
   frame no progression can reach, since it only exists after the round. */
function plan(n) {
  var out = [];
  var g = withEnd ? n - 1 : n;                       // gameplay shots
  for (var k = 0; k < g; k++) {
    out.push({ p: g < 2 ? 0.5 : 0.08 + 0.88 * (k / (g - 1)) });
  }
  if (withEnd) out.push({ end: true });
  return out;
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

/* The web build puts MENU and OPTIONS in the bottom-right corner of a round.
   They are chrome, not the game, and a store screenshot is about the game — so
   they are hidden here rather than cropped out later. `--ctls` keeps them. */
var CTLS_CSS = `<style>#web-ctls { display: none !important; }</style>`;

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
  var P = parseFloat(q.get("p"));                    // progression, 0..1
  var END = q.get("end") === "1";                    // shoot the end screen
  var SPAN = parseInt(q.get("span"), 10) || 0;       // measured reach, 0 = none
  var ENDLESS = parseInt(q.get("endless"), 10) || 30;
  var DT = 1 / 60;
  var PACED = 110;              // frames before the shot played at wall speed
  /* The end screen is a timed DOM cascade, not frames: title, score count-up,
     stars, then one stat row every 250 ms, and the two buttons 1.5 s after the
     last of them — about 6.2 s to the replay link (packages/shell/shell.js,
     T_TITLE…T_CTA_AFTER). So this settle is wall-clock milliseconds. */
  var SETTLE_MS = 7200;
  var frame = 0, roundFrame = 0, rounds = 0, side = 0, lastBeat = -1;
  var started = false, cleaned = false, endedAt = 0, target = 0, cap = 0;

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
    // "tap" whose point is the aim: sweep the top of the band (see SWEEP).
    var S = window.__SWEEP;
    if (S) {
      if (n % S.every === 0)
        tap(H, L.left + L.w * (0.5 + S.amp * Math.sin(n * S.w)), L.top + L.h * S.y);
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

  /* A full round, in frames. A measured span wins, because a clock the pilot
     never reaches the end of is not the round it plays. Failing that a timed
     game carries its own length, read here rather than off the manifest
     because a mode can rewrite it: radiam zeroes CONFIG.gameSeconds when its
     endless mode is the one that started. */
  function aim(H) {
    var secs = SPAN || (H.CONFIG.gameSeconds > 0 ? H.CONFIG.gameSeconds : ENDLESS);
    var span = Math.round(secs * 60);
    target = Math.max(90, Math.round(Math.min(0.97, Math.max(0.02, P || 0.5)) * span));
    // Bound the retries: a pilot that keeps dying must still hand back a frame.
    cap = END ? span * 2 + 600 : target * 3 + 240;
  }

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
    return Math.max(90, Math.round(target * (1 - lost / cap)));
  }
  function ready() { return frame >= cap || roundFrame >= need(); }

  /* ...and it must not be a frame the game is using to say something went
     wrong. A "danger" callout is the motor's one shared vocabulary for that —
     marshmelt's MELTED, its HOT!/BURNT! — and it sits in #ov-pops like every
     other Pop, so this needs no game internals and no new motor API. Death
     itself is invisible from here: a game sets its own private flag and only
     reaches endRound a beat later, so state() still says "playing" over the
     very frames that show the banner. Deferring past them is what stops a
     store gallery full of game-overs; cap is the bound, so a game that warns
     constantly still hands back a frame. */
  function dying() { return !!document.querySelector("#ov-pops .pop-danger"); }

  /* The end screen is not a frame of the simulation, it is a DOM cinematic on
     the wall clock. So the round is played out — the pilot dies, or the clock
     runs out — and then nothing is stepped at all while it plays. */
  function tickEnd(H) {
    if (H.state() === "end") {
      if (!endedAt) endedAt = Date.now();
      if (Date.now() - endedAt >= SETTLE_MS) window.__shot = 1;
      return;
    }
    if (frame >= cap) { window.__shot = 1; return; }  // never ended: keep the board
    for (var i = 0; i < 20 && frame < cap && H.state() === "playing"; i++) {
      pilot(H, frame); H.frameUpdate(DT); frame++; roundFrame++;
    }
    H.frameRender();
  }

  function tick() {
    var H = window.__H;
    requestAnimationFrame(tick);
    if (!H) return;
    if (!started) {
      if (H.state() !== "intro") return;              // still loading
      H.startGame();
      H.Loop.stop();                                  // we drive the clock
      aim(H);                                         // CONFIG is final now
      started = true;
    }
    window.__progress = frame;
    if (END) { tickEnd(H); return; }
    if (ready() && !(dying() && frame < cap)) {
      H.frameRender();                                // keep the canvas fresh
      window.__shot = 1;                              // the host may capture now
      window.__reached = roundFrame / target;
      return;
    }
    if (ready()) { step(H); H.frameRender(); return; } // wait out the warning
    var settle = need() - PACED;
    if (roundFrame < settle) {                        // fast-forward, cheaply
      for (var i = 0; i < 20 && roundFrame < settle && frame < cap; i++) step(H);
      if (roundFrame >= settle && !cleaned) {         // drop the piled-up callouts
        H.Pop.clear(); H.Overlay.clear(); cleaned = true;
      }
    } else {
      step(H);                                        // one frame per animation frame
    }
    H.frameRender();
  }
  requestAnimationFrame(tick);
})();
</script>`;

/* Where a game's build sits. The web build is one self-contained document per
   game, like a playable, which is what lets the same three injections work on
   either source. */
function sourceOf(slug) {
  return playable
    ? path.join(GAMES_DIR, slug, "index.html")
    : path.join(WEB_DIR, slug, "index.html");
}

/* ONE BUILD PER SLUG, and that is not a style choice: `build.mjs` reads its
   target with `argv.find(a => a.startsWith("--game="))`, so it honours the
   FIRST --game= and ignores every other one. Handing it a list used to build
   the first game and shoot the rest off whatever was left in dist/itch from a
   previous run — stale documents, silently, with the tool reporting success.
   Asking for every game still builds in one pass, because that is the run with
   no --game= at all. */
function buildWeb(slugs) {
  var base = ["tools/build/build.mjs", "--target=web", "--dest=itch"];
  var runs = slugs.length >= 13
    ? [base]
    : slugs.map(function (s) { return base.concat(["--game=" + s]); });
  for (var i = 0; i < runs.length; i++) {
    var r = spawnSync(process.execPath, runs[i], { cwd: ROOT, stdio: "inherit" });
    if (r.status !== 0) throw new Error("the web build failed");
  }
}

function prepare(slug, tmpDir) {
  var src = fs.readFileSync(sourceOf(slug), "utf8");

  /* The hook goes inside the *game's* IIFE, which is the first script block of
     the document: a web build appends the webshell as a second one, so the
     document's last `})();` closes the menu, not the motor. This runs before
     the head injection on purpose — SEED_JS carries a `</script>` of its own,
     and inserting it first would make "the first script block" be that one. */
  var firstScript = src.indexOf("</script>");
  if (firstScript < 0) throw new Error(slug + ": no script block");
  var close = src.lastIndexOf("})();", firstScript);
  if (close < 0) throw new Error(slug + ": no IIFE close");
  src = src.slice(0, close) + HOOK_JS + src.slice(close);

  var head = src.indexOf("<head>");
  if (head < 0) throw new Error(slug + ": no <head>");
  src = src.slice(0, head + 6) + "\n" + SEED_JS
    + (ctls ? "" : "\n" + CTLS_CSS) + src.slice(head + 6);

  var sweep = SWEEP[slug]
    ? "<script>window.__SWEEP = " + JSON.stringify(SWEEP[slug]) + ";</script>\n"
    : "";
  src = src.replace("</body>", sweep + DRIVER_JS + "\n</body>");

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

async function shoot(client, sid, file, seed, aim, span, outPath) {  // span: seconds, 0 = the game's own
  /* `lang` is the web menu's own switch, and it reaches the end screen: left
     to the browser, a headless Chrome in a French locale writes REJOUER on
     the replay button of every screenshot. */
  var url = "file://" + file + "?seed=" + seed + "&span=" + span
    + "&endless=" + SPAN._endless + "&lang=" + lang
    + (aim.end ? "&end=1" : "&p=" + aim.p.toFixed(3));
  await client.send("Page.navigate", { url: url }, sid);

  var deadline = Date.now() + 120000;
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

  // SHOOT_DEBUG=1 reports what the shot actually caught. `reached` is the
  // fraction of the aimed progression the pilot survived to: well under 1
  // across a game's shots means its SPAN is longer than the pilot's reach,
  // and the late shots are duplicates of the middle ones.
  if (process.env.SHOOT_DEBUG) {
    process.stdout.write("  " + path.basename(outPath) + " "
      + (aim.end ? "end" : "p=" + aim.p.toFixed(2)) + " " + await evaluate(client, sid,
      'JSON.stringify({ frames: window.__progress, reached: +(window.__reached || 1).toFixed(2),' +
      ' state: window.__H.state(), score: document.getElementById("hud-score").textContent })') + "\n");
  }
}

// --- Run -----------------------------------------------------------------

/* Chrome must die whatever happens next. SIGTERM is not enough — a headless
   browser survives it here — and a throw in the middle of a shoot used to skip
   the teardown at the bottom of this file entirely, leaving a browser looping
   a game at 40% CPU with nobody watching. So: SIGKILL, once, from a handler
   that runs on a normal exit, on a throw and on Ctrl-C alike. */
function reap(child) {
  var done = false;
  function kill() {
    if (done) return;
    done = true;
    try { child.kill("SIGKILL"); } catch (e) {}
  }
  process.on("exit", kill);
  process.on("SIGINT", function () { kill(); process.exit(130); });
  process.on("SIGTERM", function () { kill(); process.exit(143); });
  process.on("uncaughtException", function (e) { kill(); console.error(e); process.exit(1); });
  process.on("unhandledRejection", function (e) { kill(); console.error(e); process.exit(1); });
}

fs.mkdirSync(OUT_DIR, { recursive: true });
if (!playable && build) buildWeb(slugs);
var missing = slugs.filter(function (s) { return !fs.existsSync(sourceOf(s)); });
if (missing.length) {
  console.error("no build for: " + missing.join(" ")
    + (playable ? "" : "  (does its manifest list the web target?)"));
  slugs = slugs.filter(function (s) { return fs.existsSync(sourceOf(s)); });
}
var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shoot-screens-"));
var profileDir = path.join(tmpDir, "profile");
var failed = 0;

var chrome = await launchChrome(profileDir);
reap(chrome.child);
var client = await cdp(chrome.port);
var sid = await openPage(client);

var aims = plan(shots);

for (var s = 0; s < slugs.length; s++) {
  var slug = slugs[s];
  var file = prepare(slug, tmpDir);
  var span = SPAN[slug] || 0;
  var line = [];
  for (var n = 1; n <= aims.length; n++) {
    var name = slug + "-" + String(n).padStart(2, "0") + (png ? ".png" : ".jpg");
    var outPath = path.join(OUT_DIR, name);
    try {
      // The seed is the shot number, so two shots of one game are two
      // different runs sampled at two different points of the round.
      await shoot(client, sid, file, n, aims[n - 1], span, outPath);
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
chrome.child.kill("SIGKILL");
await sleep(500);                                    // let Chrome release its profile
if (!keep) fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
else console.log("kept: " + tmpDir);
process.exit(failed ? 1 : 0);
