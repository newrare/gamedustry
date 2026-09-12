#!/usr/bin/env node
/* Shoot the decorative gears of lab/gear-decor.html into assets/image/gear/.
 *
 * They are furniture, not artwork: grey cogs with an alpha background, meant
 * to be laid over a screenshot (a store gallery shot, a cover, a site header)
 * in whatever tool does the composing. Grey on purpose — a decoration tinted
 * for one game cannot be dropped on another's shot, and any colour comes back
 * from a blend mode over a neutral plate.
 *
 * Same rig as shoot-icon.mjs, and the same one thing that makes transparency
 * work: a headless viewport paints an opaque white backdrop unless
 * Emulation.setDefaultBackgroundColorOverride clears it, and the PNG then
 * carries alpha 0 wherever the silhouette does not cover the frame. (The
 * `--default-background-color` command-line flag is NOT the way — it makes
 * Target.attachToTarget lose the session.)
 *
 * The gear is authored at 1024 px and captured at 1024, then halved inside the
 * page down to --size: supersampling is what keeps a 36-tooth sprocket's
 * valleys from aliasing into mush. Chrome does the resampling, so the repo
 * still needs no image library.
 *
 * assets/image/gear/ is a committed input like assets/image/embed/ and
 * assets/audio/sfx/, not a build output: nothing in tools/update.mjs
 * regenerates it, and no target reads it. Re-run this only when a shape or a
 * finish changes. The name is `gear` and not `decor` because the painted
 * decor pool is a different thing — per game, and it lives in
 * assets/image/embed/ as <slug>-decor-NN.webp.
 *
 * Usage:
 *   node tools/lab/shoot-gears.mjs                      # 6 shapes x 3 finishes
 *   node tools/lab/shoot-gears.mjs spur-24 stack        # only these shapes
 *   node tools/lab/shoot-gears.mjs --finish steel       # only this finish
 *   node tools/lab/shoot-gears.mjs --size 1024          # no downscale
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var CARD = path.join(ROOT, "lab", "gear-decor.html");
var OUT_DIR = path.join(ROOT, "assets", "image", "gear");
var CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
var DESIGN = 1024;                                   // the page's design space
var FINISHES = ["steel", "light", "outline"];

// --- CLI -----------------------------------------------------------------
var argv = process.argv.slice(2);
var names = [], finishes = [], size = 512, keep = false;
for (var i = 0; i < argv.length; i++) {
  if (argv[i] === "--size") size = parseInt(argv[++i], 10);
  else if (argv[i] === "--finish") finishes.push(argv[++i]);
  else if (argv[i] === "--keep") keep = true;
  else names.push(argv[i]);
}
if (!(size > 0 && size <= DESIGN)) {
  console.error("--size must be between 1 and " + DESIGN);
  process.exit(2);
}
var badFinish = finishes.filter(function (f) { return FINISHES.indexOf(f) < 0; });
if (badFinish.length) {
  console.error("unknown finish: " + badFinish.join(", ") + " (have " + FINISHES.join(", ") + ")");
  process.exit(2);
}
if (!finishes.length) finishes = FINISHES.slice();

/* The lab page is the source of truth for which gears exist: read the keys of
   its GEARS table rather than keeping a second list here that can drift. */
var cardSrc = fs.readFileSync(CARD, "utf8");
var block = cardSrc.slice(cardSrc.indexOf("const GEARS = {"));
block = block.slice(0, block.indexOf("\n  };"));
var shapes = [];
var re = /^\s*"([a-z0-9-]+)":\s*\{/gm;
var m;
while ((m = re.exec(block))) shapes.push(m[1]);
if (!shapes.length) {
  console.error("no gear found in the GEARS table of " + path.relative(ROOT, CARD));
  process.exit(2);
}
if (!names.length) names = shapes.slice();
var unknown = names.filter(function (n) { return shapes.indexOf(n) < 0; });
if (unknown.length) {
  console.error("no such gear: " + unknown.join(", ") +
    "\nadd it to the GEARS table in " + path.relative(ROOT, CARD) +
    "\nhave: " + shapes.join(", "));
  process.exit(2);
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
    "--no-first-run",
    "--force-device-scale-factor=1",
    "--window-size=" + DESIGN + "," + DESIGN,
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

async function cdp(port) {
  var info = await (await fetch("http://127.0.0.1:" + port + "/json/version")).json();
  var ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise(function (res, rej) { ws.onopen = res; ws.onerror = rej; });

  var nextId = 1, pending = new Map();
  ws.onmessage = function (msg) {
    var d = JSON.parse(msg.data);
    if (d.id && pending.has(d.id)) {
      var p = pending.get(d.id); pending.delete(d.id);
      if (d.error) p.rej(new Error(d.error.message));
      else p.res(d.result);
    }
  };
  function send(method, params, sessionId) {
    var id = nextId++;
    ws.send(JSON.stringify({ id: id, method: method, params: params || {}, sessionId: sessionId }));
    return new Promise(function (res, rej) { pending.set(id, { res: res, rej: rej }); });
  }
  return { send: send, close: function () { ws.close(); } };
}

async function openPage(client) {
  var t = await client.send("Target.createTarget", { url: "about:blank" });
  var a = await client.send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
  var sid = a.sessionId;
  await client.send("Page.enable", {}, sid);
  await client.send("Runtime.enable", {}, sid);
  await client.send("Emulation.setDeviceMetricsOverride",
    { width: DESIGN, height: DESIGN, deviceScaleFactor: 1, mobile: false }, sid);
  // Drop the viewport's opaque backdrop — this is what buys the alpha.
  await client.send("Emulation.setDefaultBackgroundColorOverride",
    { color: { r: 0, g: 0, b: 0, a: 0 } }, sid);
  return sid;
}

async function evaluate(client, sid, expr, awaitPromise) {
  var r = await client.send("Runtime.evaluate",
    { expression: expr, returnByValue: true, awaitPromise: !!awaitPromise }, sid);
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception
      ? r.exceptionDetails.exception.description
      : r.exceptionDetails.text);
  }
  return r.result ? r.result.value : undefined;
}

/* Halve until the target, never in one jump: Chrome's high-quality filter is
   only well behaved at 2:1, and a 1024 -> 512 sprocket taken in one step loses
   every other tooth. It also reports the corner alphas and the ink coverage,
   so an opaque square or an empty frame fails the run instead of being
   written out. */
function resampleJS(b64, target) {
  return `(async () => {
    const img = new Image();
    img.src = "data:image/png;base64,${b64}";
    await img.decode();
    let cur = document.createElement("canvas");
    cur.width = img.width; cur.height = img.height;
    cur.getContext("2d").drawImage(img, 0, 0);
    let w = img.width;
    while (w > ${target}) {
      const next = Math.max(${target}, Math.round(w / 2));
      const c = document.createElement("canvas");
      c.width = next; c.height = next;
      const g = c.getContext("2d");
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      g.drawImage(cur, 0, 0, next, next);
      cur = c; w = next;
    }
    const g = cur.getContext("2d", { willReadFrequently: true });
    const px = g.getImageData(0, 0, w, w).data;
    let ink = 0;
    for (let i = 3; i < px.length; i += 4) if (px[i] > 8) ink++;
    const A = (x, y) => px[((y * w + x) << 2) + 3];
    return JSON.stringify({
      png: cur.toDataURL("image/png"),
      size: w,
      corners: [A(0, 0), A(w - 1, 0), A(0, w - 1), A(w - 1, w - 1)],
      ink: ink / (w * w)
    });
  })()`;
}

async function shoot(client, sid, name, finish, outPath) {
  var url = "file://" + CARD +
    "?gear=" + encodeURIComponent(name) +
    "&finish=" + encodeURIComponent(finish) + "&shoot=1";
  await client.send("Page.navigate", { url: url }, sid);

  var deadline = Date.now() + 20000;
  for (;;) {
    if (await evaluate(client, sid, "window.__gearReady || 0")) break;
    if (Date.now() > deadline) throw new Error("the page never reported ready");
    await sleep(60);
  }

  var res = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: DESIGN, height: DESIGN, scale: 1 }
  }, sid);

  var out = JSON.parse(await evaluate(client, sid, resampleJS(res.data, size), true));
  if (out.corners.some(function (a) { return a !== 0; })) {
    throw new Error("corners are not transparent: alpha " + out.corners.join("/"));
  }
  // A gear covers roughly a third of its frame; 2% means nothing was drawn.
  if (out.ink < 0.02) throw new Error("the frame is empty (" + (out.ink * 100).toFixed(1) + "% ink)");

  var b64 = out.png.slice(out.png.indexOf(",") + 1);
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  return out;
}

// --- Run -----------------------------------------------------------------

fs.mkdirSync(OUT_DIR, { recursive: true });
var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shoot-gears-"));
var failed = 0, made = 0;

var chrome = await launchChrome(path.join(tmpDir, "profile"));
var client = await cdp(chrome.port);
var sid = await openPage(client);

for (var f = 0; f < finishes.length; f++) {
  for (var g = 0; g < names.length; g++) {
    var name = names[g], finish = finishes[f];
    var file = "gear-" + name + "-" + finish + ".png";
    var outPath = path.join(OUT_DIR, file);
    try {
      var out = await shoot(client, sid, name, finish, outPath);
      var kb = Math.round(fs.statSync(outPath).size / 1024);
      made++;
      console.log(file.padEnd(30) + out.size + "x" + out.size +
        "  " + String(kb).padStart(4) + " kB  " +
        (out.ink * 100).toFixed(0).padStart(3) + "% ink");
    } catch (e) {
      failed++;
      console.error(file.padEnd(30) + "FAILED  " + e.message);
    }
  }
}

client.close();
chrome.child.kill();
await sleep(400);                                    // let Chrome release its profile
if (!keep) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* it will age out */ }
}

console.log("\n" + made + " written to " + path.relative(ROOT, OUT_DIR) +
  (failed ? "  (" + failed + " failed)" : ""));
process.exit(failed ? 1 : 0);
