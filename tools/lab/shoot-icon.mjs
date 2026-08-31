#!/usr/bin/env node
/* Shoot the app icon of every game into assets/icon/auto/.
 *
 * The artwork lives in lab/icon-card.html: one shared shell (silhouette, rim,
 * gloss) plus one recipe per game, all in CSS. This tool loads that page in
 * headless Chrome with `?slug=<game>&shoot=1` and screenshots the card.
 *
 * The one thing that makes transparent corners work: a headless viewport paints
 * an opaque white backdrop unless `Emulation.setDefaultBackgroundColorOverride`
 * clears it, and the PNG then carries alpha 0 wherever the rounded silhouette
 * does not cover the frame. (The `--default-background-color` command-line flag
 * is NOT the way — it makes Target.attachToTarget lose the session.)
 *
 * The card is authored at 1024 px and captured at 1024, then downscaled inside
 * the page — 3.2x supersampling for a 320 px icon, which is what keeps the thin
 * neon strokes and the corner arc clean. Chrome does the resampling, so the
 * repo still needs no image library.
 *
 * Usage:
 *   node tools/lab/shoot-icon.mjs [slug ...] [--size 320] [--keep]
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var CARD = path.join(ROOT, "lab", "icon-card.html");
var GAMES_DIR = path.join(ROOT, "games");
var OUT_DIR = path.join(ROOT, "assets", "icon", "auto");
var CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
var DESIGN = 1024;                                   // the card's design space

// --- CLI -----------------------------------------------------------------
var argv = process.argv.slice(2);
var slugs = [];
var size = 320;                                      // matches assets/icon/thumb
var keep = false;
for (var i = 0; i < argv.length; i++) {
  if (argv[i] === "--size") size = parseInt(argv[++i], 10);
  else if (argv[i] === "--keep") keep = true;
  else slugs.push(argv[i]);
}
if (!(size > 0 && size <= DESIGN)) {
  console.error("--size must be between 1 and " + DESIGN);
  process.exit(2);
}

// The lab file is the source of truth for which icons exist.
var cardSrc = fs.readFileSync(CARD, "utf8");
var recipes = [];
var re = /<template data-slug="([^"]+)">/g;
var m;
while ((m = re.exec(cardSrc))) recipes.push(m[1]);
if (!recipes.length) {
  console.error("no <template data-slug> recipe found in " + path.relative(ROOT, CARD));
  process.exit(2);
}

if (!slugs.length) slugs = recipes.slice();
var unknown = slugs.filter(function (s) { return recipes.indexOf(s) < 0; });
if (unknown.length) {
  console.error("no recipe for: " + unknown.join(", ") +
    "\nadd a <style> block and a <template data-slug> to " + path.relative(ROOT, CARD));
  process.exit(2);
}

// A game with no recipe would silently keep an empty auto/ slot: say so.
var games = fs.readdirSync(GAMES_DIR).filter(function (d) {
  return fs.existsSync(path.join(GAMES_DIR, d, "index.html"));
});
var missing = games.filter(function (g) { return recipes.indexOf(g) < 0; });

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

// A very small CDP client: send(method, params, sessionId).
async function cdp(port) {
  var info = await (await fetch("http://127.0.0.1:" + port + "/json/version")).json();
  var ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise(function (res, rej) { ws.onopen = res; ws.onerror = rej; });

  var nextId = 1, pending = new Map();
  ws.onmessage = function (m) {
    var msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      var p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.rej(new Error(msg.error.message));
      else p.res(msg.result);
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

/* Resample the shot down to `size` and hand it back as a PNG data URI. The
   halving loop keeps every step at most 2:1, where Chrome's high-quality
   filter behaves; one 1024 -> 320 jump would alias the thin strokes. It also
   reports the four corner alphas, so a broken silhouette fails the run instead
   of shipping an opaque square. */
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
    const A = (x, y) => g.getImageData(x, y, 1, 1).data[3];
    return JSON.stringify({
      png: cur.toDataURL("image/png"),
      size: cur.width,
      corners: [A(0, 0), A(w - 1, 0), A(0, w - 1), A(w - 1, w - 1)],
      centre: A(w >> 1, w >> 1)
    });
  })()`;
}

async function shoot(client, sid, slug, outPath) {
  var url = "file://" + CARD + "?slug=" + encodeURIComponent(slug) + "&shoot=1";
  await client.send("Page.navigate", { url: url }, sid);

  // Wait for the card to be built, then for one painted frame.
  var deadline = Date.now() + 20000;
  for (;;) {
    var ready = await evaluate(client, sid, "window.__iconReady || 0");
    if (ready) break;
    if (Date.now() > deadline) throw new Error("the card never reported ready");
    await sleep(80);
  }
  await evaluate(client, sid,
    "new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))", true);

  var res = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: DESIGN, height: DESIGN, scale: 1 }
  }, sid);

  var out = JSON.parse(await evaluate(client, sid, resampleJS(res.data, size), true));
  if (out.corners.some(function (a) { return a !== 0; })) {
    throw new Error("corners are not transparent: alpha " + out.corners.join("/"));
  }
  if (out.centre === 0) throw new Error("the card is empty (centre alpha 0)");

  var b64 = out.png.slice(out.png.indexOf(",") + 1);
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  return out.size;
}

// --- Run -----------------------------------------------------------------

fs.mkdirSync(OUT_DIR, { recursive: true });
var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shoot-icon-"));
var failed = 0;

var chrome = await launchChrome(path.join(tmpDir, "profile"));
var client = await cdp(chrome.port);
var sid = await openPage(client);

for (var s = 0; s < slugs.length; s++) {
  var slug = slugs[s];
  var outPath = path.join(OUT_DIR, slug + ".png");
  try {
    var px = await shoot(client, sid, slug, outPath);
    var kb = Math.round(fs.statSync(outPath).size / 1024);
    console.log(slug.padEnd(12) + px + "x" + px + "  " + kb + " kB  " +
      path.relative(ROOT, outPath));
  } catch (e) {
    failed++;
    console.error(slug.padEnd(12) + "FAILED  " + e.message);
  }
}

if (missing.length) {
  console.error("\nno recipe yet for: " + missing.join(", "));
}

client.close();
chrome.child.kill();
await sleep(400);                                    // let Chrome release its profile
if (!keep) fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
else console.log("kept: " + tmpDir);
process.exit(failed ? 1 : 0);
