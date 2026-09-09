#!/usr/bin/env node
/* Re-encode the painted artwork of assets/image/ into assets/art/.
 *
 * WHY THIS EXISTS
 * ---------------
 * `assets/image/` holds the artwork as it came out of the image model: PNG,
 * up to 2172px wide, ~2 MB apiece, 121 MB for the thirteen games. None of it
 * can ship. A playable is ONE self-contained HTML file with a 5 MB ceiling and
 * a < 2 MB target, and the games sit at ~1 MB today — a single raw character
 * would double one.
 *
 * So `assets/image/` is the master, never shipped, and this tool writes the
 * shipping cut next to it in `assets/art/`: WebP, sized for the 720x1280
 * design space, alpha intact. The measured result is ~35 KB per asset, ~270 KB
 * of base64 for a whole game — which is what makes "every game gets painted
 * screens" fit inside the budget at all.
 *
 * WHY IT IS A SEPARATE STEP, AND WHY assets/art/ IS COMMITTED
 * -----------------------------------------------------------
 * Encoding needs headless Chrome (see below), which costs a second or two per
 * image — 80 images is a minute and a half. `tools/update.mjs` runs on every
 * change and must stay fast, so the build never encodes: it reads the WebP that
 * is already there. `assets/art/` is therefore committed, exactly like
 * `assets/font/` and `assets/sfx/` are: a shipping-ready input the build
 * embeds, not a build output.
 *
 * Run this when the artwork itself changes. Files whose master has not moved
 * since the last run are skipped, so re-running after adding one game costs
 * that one game.
 *
 * WHY CHROME AND NOT AN IMAGE LIBRARY
 * -----------------------------------
 * The repo has no dependencies and no image library, and it is not going to
 * grow one to resize a PNG. What it does have is the trick `shoot-cover.mjs`
 * already relies on: headless Chrome resamples with a high-quality filter and
 * encodes WebP through `canvas.toDataURL`, alpha included. macOS `sips` was the
 * other candidate and cannot write WebP (read-only in its format list); its
 * AVIF is smaller still, but AVIF needs Safari 16.4 / Chrome 85 and a playable
 * runs in whatever WebView an ad network hands it. WebP has been in every
 * mobile browser since 2020, so WebP it is.
 *
 * THE ROLES, AND WHERE EACH ONE IS USED
 * -------------------------------------
 * A file name is the whole declaration — there is no manifest key to write and
 * no per-game list to keep in sync. `<slug>-<role>.png` becomes
 * `CONFIG.art.<camelRole>`, injected by tools/build/build.mjs:
 *
 *   background-phone   the portrait painting behind the intro and end screens
 *   background-desk    the same scene in landscape, for the empty bands around
 *                      the frame on a desktop window — WEB TARGET ONLY, so a
 *                      playable never carries a picture it cannot show
 *   title              the game's logotype, which replaces the app icon and the
 *                      CSS #intro-title on the intro
 *   character-sad      the three faces of the end screen, picked by the star
 *   character-neutral  count the round scored (0-1 / 2 / 3)
 *   character-happy
 *
 *   card-*             a court-card illustration a GAME draws itself, out of
 *                      ArtImages — slipdeck's jack, queen and king. Kept near
 *                      the master's resolution because the canvas is sized in
 *                      device pixels, unlike everything above it.
 *
 * Anything else under `<slug>-<name>.png` is encoded too, with the generic
 * profile, and lands on `CONFIG.art.<camelName>`, ready for whatever asks for
 * it — one more file, no code anywhere.
 *
 * Usage:
 *   node tools/lab/encode-art.mjs                 # every game, skipping fresh
 *   node tools/lab/encode-art.mjs vipera slipdeck # named games only
 *   node tools/lab/encode-art.mjs --force         # re-encode everything
 *   node tools/lab/encode-art.mjs --list          # what would run, and why
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var SRC_DIR = path.join(ROOT, "assets", "image");
var OUT_DIR = path.join(ROOT, "assets", "art");
var GAMES_DIR = path.join(ROOT, "games");
var CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/* The encoding profile per role: the box the image is fitted inside (aspect
   ratio preserved, never upscaled) and the WebP quality.

   The sizes are the design space, not guesses. The frame is 720x1280, so a
   portrait background at 720 wide is exactly 1:1 with its largest possible
   display and anything beyond it is waste. The title is the loudest thing on
   the intro and gets the highest quality of the set; a background is soft
   painted art that hides a low quality well, which is why the two differ.

   `background-desk` is bigger than the frame on purpose: it is stretched
   across a whole desktop window, not across 720 design px. */
var PROFILE = {
  "background-phone": { w: 720, h: 1280, q: 0.72 },
  "background-desk": { w: 1600, h: 900, q: 0.70 },
  "title": { w: 640, h: 280, q: 0.86 },
  "character-sad": { w: 460, h: 560, q: 0.80 },
  "character-neutral": { w: 460, h: 560, q: 0.80 },
  "character-happy": { w: 460, h: 560, q: 0.80 }
};

/* The court-card illustrations. These are the one piece of artwork a game
   draws on the CANVAS rather than handing to the DOM, and the canvas is sized
   in device pixels: slipdeck's big card is 357 design px wide and its inner
   panel 214, which on a 3x phone is 642 real pixels. Anything smaller than
   that is visibly soft on the one card the player is staring at, so these keep
   close to their master's 650px. */
var CARDS = { w: 560, h: 700, q: 0.84 };

/* Everything else. Nothing uses it today; it is the floor for a role added
   later, small enough that forgetting to give it a profile is cheap. */
var GENERIC = { w: 320, h: 400, q: 0.86 };

function profileFor(role) {
  if (PROFILE[role]) return PROFILE[role];
  if (role.indexOf("card-") === 0) return CARDS;
  return GENERIC;
}

// --- CLI -----------------------------------------------------------------
var argv = process.argv.slice(2);
var slugs = [];
var force = false, listOnly = false;
for (var i = 0; i < argv.length; i++) {
  if (argv[i] === "--force") force = true;
  else if (argv[i] === "--list") listOnly = true;
  else slugs.push(argv[i]);
}

/* Every master under assets/image/, split into the game it belongs to and the
   role it plays. The slug is matched against games/ rather than parsed off the
   first dash, because a slug never contains one but a role always does
   ("background-phone"), and guessing would break the day a game is called
   `foo-bar`. */
function knownSlugs() {
  return fs.readdirSync(GAMES_DIR).filter(function (d) {
    return fs.existsSync(path.join(GAMES_DIR, d, "manifest.json"));
  }).sort();
}

function masters(all) {
  var out = [];
  fs.readdirSync(SRC_DIR).filter(function (f) {
    return /\.png$/i.test(f);
  }).sort().forEach(function (file) {
    var stem = file.replace(/\.png$/i, "");
    var slug = null;
    for (var i = 0; i < all.length; i++) {
      if (stem === all[i] || stem.indexOf(all[i] + "-") === 0) { slug = all[i]; break; }
    }
    if (!slug) { console.log("?     " + file + " — no game of that name, left alone"); return; }
    var role = stem.slice(slug.length + 1);
    if (!role) { console.log("?     " + file + " — no role in the name, left alone"); return; }
    out.push({
      file: file, slug: slug, role: role,
      src: path.join(SRC_DIR, file),
      out: path.join(OUT_DIR, slug + "-" + role + ".webp"),
      profile: profileFor(role),
      known: !!PROFILE[role] || role.indexOf("card-") === 0
    });
  });
  return out;
}

/* A cut is stale when its master is newer than it, which is the only question
   worth asking: the profile above is the same for every run, and a change to
   it is what --force is for. */
function isStale(job) {
  if (force || !fs.existsSync(job.out)) return true;
  return fs.statSync(job.src).mtimeMs > fs.statSync(job.out).mtimeMs;
}

// --- Chrome over the DevTools protocol -----------------------------------
// Same tiny CDP client as tools/lab/shoot-cover.mjs, kept local: two copies of
// forty lines beat a shared module nothing else would import.

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function launchChrome(profileDir) {
  var child = spawn(CHROME, [
    "--headless=new",
    "--remote-debugging-port=0",
    "--user-data-dir=" + profileDir,
    "--disable-gpu",
    "--mute-audio",
    "--no-first-run",
    "--force-device-scale-factor=1",
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
  throw new Error("Chrome did not open a debugging port — is it installed at " + CHROME + "?");
}

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
  await client.send("Runtime.enable", {}, a.sessionId);
  return a.sessionId;
}

/* Decode the master in the page, fit it inside the profile's box, and hand
   back a WebP data URI.

   `imageSmoothingQuality:"high"` is the whole reason this runs in a browser:
   it is a proper multi-step downscale, so a 2172px logotype landing on 640px
   keeps its edges instead of aliasing into fringe. The image is never
   upscaled — `Math.min(1, …)` — because inventing pixels only costs bytes.

   The master is handed over as a data URI in the expression itself rather than
   loaded off disk: Chrome is headless with no file access to this repo, and a
   2 MB PNG through the CDP is still faster than serving it. */
function encodeJs(b64, box) {
  return "(async () => {" +
    'const img = new Image();' +
    'img.src = "data:image/png;base64,' + b64 + '";' +
    "await img.decode();" +
    "const s = Math.min(1, " + box.w + " / img.width, " + box.h + " / img.height);" +
    "const w = Math.max(1, Math.round(img.width * s));" +
    "const h = Math.max(1, Math.round(img.height * s));" +
    'const c = document.createElement("canvas"); c.width = w; c.height = h;' +
    'const g = c.getContext("2d");' +
    'g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";' +
    "g.drawImage(img, 0, 0, w, h);" +
    'const u = c.toDataURL("image/webp", ' + box.q + ");" +
    'if (u.indexOf("data:image/webp") !== 0) throw new Error("this Chrome did not encode WebP");' +
    "return { uri: u, w: w, h: h };" +
    "})()";
}

async function encode(client, sid, job) {
  var b64 = fs.readFileSync(job.src).toString("base64");
  var r = await client.send("Runtime.evaluate", {
    expression: encodeJs(b64, job.profile),
    returnByValue: true, awaitPromise: true
  }, sid);
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception
      ? r.exceptionDetails.exception.description
      : r.exceptionDetails.text);
  }
  var v = r.result.value;
  var buf = Buffer.from(v.uri.slice(v.uri.indexOf(",") + 1), "base64");
  fs.writeFileSync(job.out, buf);
  return { bytes: buf.length, w: v.w, h: v.h };
}

// --- run -----------------------------------------------------------------
async function main() {
  if (!fs.existsSync(SRC_DIR)) throw new Error("no assets/image/ to read");
  fs.mkdirSync(OUT_DIR, { recursive: true });

  var all = knownSlugs();
  var jobs = masters(all);
  if (slugs.length) {
    var want = {};
    slugs.forEach(function (s) {
      if (all.indexOf(s) === -1) throw new Error('no game called "' + s + '"');
      want[s] = true;
    });
    jobs = jobs.filter(function (j) { return want[j.slug]; });
  }

  var todo = jobs.filter(isStale);
  var fresh = jobs.length - todo.length;

  if (listOnly || !todo.length) {
    todo.forEach(function (j) {
      console.log("stale " + j.slug + "-" + j.role + (j.known ? "" : "  (generic profile)"));
    });
    if (fresh) console.log("fresh " + fresh + " cut" + (fresh === 1 ? "" : "s") + " already up to date");
    if (!todo.length) console.log("\nNothing to encode.");
    else if (listOnly) console.log("\n" + todo.length + " to encode. Drop --list to do it.");
    return;
  }

  var profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "encode-art-"));
  var chrome = await launchChrome(profileDir);
  var client, total = 0, count = 0;
  try {
    client = await cdp(chrome.port);
    var sid = await openPage(client);
    for (var i = 0; i < todo.length; i++) {
      var job = todo[i];
      var r = await encode(client, sid, job);
      total += r.bytes; count++;
      console.log(
        String(i + 1).padStart(3) + "/" + todo.length + "  " +
        (job.slug + "-" + job.role).padEnd(34) +
        String(r.w + "x" + r.h).padEnd(11) +
        (r.bytes / 1024).toFixed(0).padStart(5) + " KB" +
        (job.known ? "" : "   (generic profile)")
      );
    }
  } finally {
    if (client) client.close();
    chrome.child.kill();
    /* Chrome is still flushing its profile when the kill lands, so the first
       rm can hit a directory that grew a file back. `maxRetries` is what makes
       that a non-event; and a leftover temp dir must never fail a run that
       already wrote every cut it was asked for. */
    try {
      fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    } catch (e) {
      console.error("(left " + profileDir + " behind: " + e.code + ")");
    }
  }

  console.log("\n" + count + " encoded, " + (total / 1024).toFixed(0) + " KB into assets/art/" +
              (fresh ? ", " + fresh + " left alone" : ""));
  console.log("Now run:  node tools/update.mjs");
}

main().catch(function (err) {
  console.error("encode-art failed: " + err.message);
  process.exit(1);
});
