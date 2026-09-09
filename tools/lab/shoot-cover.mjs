#!/usr/bin/env node
/* Shoot the itch.io cover of every game into assets/cover/.
 *
 * itch asks for one image per project (minimum 315x250, recommended 630x500)
 * and shows it wherever it links to the game. Nothing in this repo produced
 * one: an icon is square and a screenshot is portrait, so both are the wrong
 * shape. The artwork lives in lab/cover-card.html — the game's landscape
 * scene, its logotype, its character and one real frame of play, composed in
 * CSS — and this tool loads that page in headless Chrome, fills it from the
 * game's manifest, and screenshots the card.
 *
 * The card is authored at 630x500 and captured at a device pixel ratio of 2,
 * then halved inside the page: 2x supersampling, which is what keeps the type
 * and the icon's rim clean. Chrome does the resampling, so the repo still
 * needs no image library.
 *
 * A game missing any of the four pieces is skipped and reported rather than
 * shot with a dashed placeholder in the hole — a placeholder must not reach an
 * itch page by accident. The art comes out of `assets/art/`, so the usual fix
 * is `node tools/lab/encode-art.mjs`.
 *
 * Usage:
 *   node tools/lab/shoot-cover.mjs [slug ...] [--shot 6] [--face happy] [--keep]
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var CARD = path.join(ROOT, "lab", "cover-card.html");
var GAMES_DIR = path.join(ROOT, "games");
var OUT_DIR = path.join(ROOT, "assets", "cover");
var CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
var W = 630, H = 500;                                // what itch recommends
var DSF = 2;                                         // supersampling

// --- CLI -----------------------------------------------------------------
var argv = process.argv.slice(2);
var slugs = [];
var shot = 6;                    // a mid-to-late board: the run has filled up
var face = "happy";              // a cover invites; the winning face is the one
var keep = false;
var FACES = ["happy", "neutral", "sad"];
for (var i = 0; i < argv.length; i++) {
  if (argv[i] === "--shot") shot = parseInt(argv[++i], 10);
  else if (argv[i] === "--face") face = argv[++i];
  else if (argv[i] === "--keep") keep = true;
  else slugs.push(argv[i]);
}
if (FACES.indexOf(face) < 0) {
  console.error("--face must be one of " + FACES.join(" / "));
  process.exit(1);
}
if (!slugs.length) {
  slugs = fs.readdirSync(GAMES_DIR).filter(function (d) {
    return fs.existsSync(path.join(GAMES_DIR, d, "manifest.json"));
  }).sort();
}

/* Everything the card needs about a game, read once from the one file that
   describes it. The title and the typeface used to come from here too; both
   are drawn now (assets/art/<slug>-title.webp), so the only thing left the
   manifest decides is the accent the card's bottom glow is tinted with. */
function describe(slug) {
  var m = JSON.parse(fs.readFileSync(path.join(GAMES_DIR, slug, "manifest.json"), "utf8"));
  return {
    slug: slug,
    accent: (m.theme && m.theme.accent) || "#4dff9b"
  };
}

function screenOf(slug, n) {
  return path.join(ROOT, "assets", "screen", slug + "-" + String(n).padStart(2, "0") + ".jpg");
}
function artOf(slug, role) {
  return path.join(ROOT, "assets", "art", slug + "-" + role + ".webp");
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
    { width: W, height: H, deviceScaleFactor: DSF, mobile: false }, sid);
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

/* Halve the 1260x1000 capture back to 630x500 and hand it over as a PNG data
   URI. One 2:1 step is where Chrome's high-quality filter behaves. */
function resampleJS(b64) {
  return `(async () => {
    const img = new Image();
    img.src = "data:image/png;base64,${b64}";
    await img.decode();
    const c = document.createElement("canvas");
    c.width = ${W}; c.height = ${H};
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, ${W}, ${H});
    return c.toDataURL("image/png");
  })()`;
}

async function shootCover(client, sid, info, outPath) {
  var url = "file://" + CARD
    + "?shoot=1&slug=" + encodeURIComponent(info.slug)
    + "&accent=" + encodeURIComponent(info.accent)
    + "&face=" + encodeURIComponent(face)
    + "&shot=" + shot;
  await client.send("Page.navigate", { url: url }, sid);

  var deadline = Date.now() + 20000;
  for (;;) {
    if (await evaluate(client, sid, "window.__coverReady || 0")) break;
    if (Date.now() > deadline) throw new Error("the card never reported ready");
    await sleep(80);
  }

  var res = await client.send("Page.captureScreenshot",
    { format: "png", captureBeyondViewport: false }, sid);
  var dataUri = await evaluate(client, sid, resampleJS(res.data), true);
  fs.writeFileSync(outPath, Buffer.from(dataUri.split(",")[1], "base64"));
}

// --- Run -----------------------------------------------------------------

/* Chrome must die whatever happens next — a headless browser survives SIGTERM
   here, and a throw mid-shoot would otherwise leave one running for nobody. */
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

/* A cover is four pieces of artwork and it is not shot with a hole in it: the
   card would draw a dashed placeholder, and a placeholder that reaches an itch
   page by accident is exactly what this gate exists to prevent. Say which
   piece is missing — the answer is almost always "run encode-art". */
var skipped = [];
slugs = slugs.filter(function (s) {
  var why = !fs.existsSync(artOf(s, "background-desk")) ? "no art background-desk"
    : !fs.existsSync(artOf(s, "title")) ? "no art title"
    : !fs.existsSync(artOf(s, "character-" + face)) ? "no art character-" + face
    : !fs.existsSync(screenOf(s, shot)) ? "no screenshot " + String(shot).padStart(2, "0")
    : null;
  if (why) skipped.push(s + " (" + why + ")");
  return !why;
});
if (skipped.length) console.error("skipped: " + skipped.join(", "));
if (!slugs.length) process.exit(skipped.length ? 1 : 0);

fs.mkdirSync(OUT_DIR, { recursive: true });
var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shoot-cover-"));
var failed = 0;

var chrome = await launchChrome(path.join(tmpDir, "profile"));
reap(chrome.child);
var client = await cdp(chrome.port);
var sid = await openPage(client);

for (var s = 0; s < slugs.length; s++) {
  var slug = slugs[s];
  var out = path.join(OUT_DIR, slug + ".png");
  try {
    await shootCover(client, sid, describe(slug), out);
    console.log("OK    " + path.relative(ROOT, out)
      + "  (" + Math.round(fs.statSync(out).size / 1024) + " KB)");
  } catch (e) {
    failed++;
    console.error("FAIL  " + slug + ": " + e.message);
  }
}

client.close();
chrome.child.kill("SIGKILL");
await sleep(300);
if (!keep) fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
else console.log("kept: " + tmpDir);
process.exit(failed || skipped.length ? 1 : 0);
