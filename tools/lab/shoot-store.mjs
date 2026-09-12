#!/usr/bin/env node
/* Shoot the store listing images of every game into assets/image/<store>/<lang>/.
 *
 * Three formats, one composition (lab/store-card.html), one punchline written
 * over each of them in the player's language:
 *
 *   phone   1080x1920  the Google Play phone slot and the itch.io screenshots.
 *                      The capture is the ground; the punchline takes the top
 *                      band and the character the bottom corner, so the middle
 *                      — where the game is — is never covered.
 *   desk    1920x1080  the Play tablet slot and the desktop picture: the
 *                      game's landscape scene with the phone standing in it,
 *                      which is what the web build already looks like on a
 *                      wide window.
 *   thumb    630x500   the itch.io cover, shown down to 315x250 in a grid.
 *
 * Every piece is one the game already owns — the captures out of
 * assets/image/screen/, the character, the logotype, the landscape scene and the
 * adopted objects out of assets/image/embed/, the typeface out of assets/motor/font/ (the
 * one its own web build embeds). Nothing is drawn for a store.
 *
 * THE PUNCHLINE comes from the manifest and nowhere else:
 *
 *   "store": { "copy": { "en": { "lines": [
 *       { "kicker": "PUZZLE", "line": "Turn <b>one</b> ring" },
 *       "Three on a <b>ray</b>" ] } } }
 *
 * A line is a string or a { kicker, line } pair, and one word may be wrapped
 * in <b>: it takes the game's accent. A game that has written none falls back
 * to `copy.<lang>.tags`, which every manifest already carries and which are
 * already short — so the thirteen games all shoot today, and writing the block
 * is how a game gets better copy, not how it gets any.
 *
 * The number of screenshots IS the number of lines (2 to 8, what Play
 * accepts): a gallery says as many things as the copy has to say, and the
 * shots are spread across a run so it shows a game going somewhere rather than
 * one frozen board.
 *
 * Usage:
 *   node tools/lab/shoot-store.mjs                      # 13 games, en + fr, all three
 *   node tools/lab/shoot-store.mjs radiam
 *   node tools/lab/shoot-store.mjs radiam --format phone --lang fr
 *   node tools/lab/shoot-store.mjs --lines              # print the copy, shoot nothing
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var CARD = path.join(ROOT, "lab", "store-card.html");
var PRESETS = path.join(ROOT, "lab", "store-presets.json");
var GAMES_DIR = path.join(ROOT, "games");
/* The two destinations: `phone` and `desk` are cut to what Play asks for and
   land in assets/image/google/<lang>/ — itch reuses the phone gallery rather
   than having its own size — and the 630x500 `thumb` is the itch cover, so it
   lands in assets/image/itch/<lang>/. */
var OUT_DIR = path.join(ROOT, "assets", "image");
function storeOf(format) { return format === "thumb" ? "itch" : "google"; }
var CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
var DSF = 2;                                  // supersampling; Chrome resamples

/* Authored size → shipped size. The card is composed in the design space the
   repo already thinks in (720x1280 for a phone) and shipped at the size a
   store wants, which is a clean 1.5x of a 2x capture. */
var FORMATS = {
  phone: { w: 720,  h: 1280, out: [1080, 1920] },
  desk:  { w: 1280, h: 720,  out: [1920, 1080] },
  thumb: { w: 630,  h: 500,  out: [630, 500] }
};

/* The faces, in the order a gallery uses them. `sad` is deliberately never
   first: the first two images are what a store card shows, and a listing does
   not open on a character who is losing. */
var FACE_CYCLE = ["happy", "neutral", "happy", "sad"];

// --- CLI -----------------------------------------------------------------
var argv = process.argv.slice(2);
var slugs = [];
var formats = ["phone", "desk", "thumb"];
var langs = ["en", "fr"];
var keep = false, listOnly = false, png = false;
for (var i = 0; i < argv.length; i++) {
  if (argv[i] === "--format") formats = argv[++i].split(",");
  else if (argv[i] === "--lang") langs = argv[++i].split(",");
  else if (argv[i] === "--keep") keep = true;
  else if (argv[i] === "--lines") listOnly = true;
  else if (argv[i] === "--png") png = true;
  else if (argv[i][0] === "-") { console.error("unknown flag " + argv[i]); process.exit(1); }
  else slugs.push(argv[i]);
}
formats.forEach(function (f) {
  if (!FORMATS[f]) { console.error("--format must be phone / desk / thumb"); process.exit(1); }
});
langs.forEach(function (l) {
  if (l !== "en" && l !== "fr") { console.error("--lang must be en / fr"); process.exit(1); }
});
/* JPEG by default, like assets/image/screen/: a gallery is 156 pictures of painted
   artwork over a photograph-like capture, and the PNG of one of them is 2.5 MB
   against 250 KB — 390 MB in a repo that ships 5 MB creatives. Play and itch
   both take JPEG; `--png` is there for a piece that needs to stay lossless. */
var EXT = png ? ".png" : ".jpg";

if (!slugs.length) {
  slugs = fs.readdirSync(GAMES_DIR).filter(function (d) {
    return fs.existsSync(path.join(GAMES_DIR, d, "manifest.json"));
  }).sort();
}

// --- what a game says about itself ---------------------------------------

function manifestOf(slug) {
  return JSON.parse(fs.readFileSync(path.join(GAMES_DIR, slug, "manifest.json"), "utf8"));
}

/* The punchlines, resolved. `store.copy.<lang>.lines` is where a game writes
   them; its own `copy.<lang>.tags` is the fallback, and the English tags are
   the fallback for a language that has neither — a missing translation shows
   as English copy on a French card, which is visible, rather than as an empty
   band, which is not. */
function linesOf(m, lang) {
  var store = (m.store && m.store.copy && m.store.copy[lang]) || {};
  var raw = store.lines
    || (m.copy && m.copy[lang] && m.copy[lang].tags)
    || (m.copy && m.copy.en && m.copy.en.tags)
    || [];
  return raw.slice(0, 8).map(function (l) {
    return typeof l === "string" ? { line: l, kicker: "" } : { line: l.line || "", kicker: l.kicker || "" };
  }).filter(function (l) { return l.line; });
}

/* The objects the shell already scatters over a game's own screens, reused
   here. The pool is whatever was adopted (docs/ASSETS.md) — a game names none
   of them — and the pick is rotated per shot so two images of one gallery are
   never dressed with the same pair. */
function objectsOf(slug) {
  var dir = path.join(ROOT, "assets", "image", "embed");
  return fs.readdirSync(dir)
    .filter(function (f) { return f.indexOf(slug + "-decor-") === 0 && f.endsWith(".webp"); })
    .sort()
    .map(function (f) { return "../assets/image/embed/" + f; });
}

/* The layouts composed by hand in lab/store-card.html, over the little server
   that serves it (tools/lab/serve-store.mjs). A game that has one is shot with
   it — `<slug>/<format>`, else the `__template/<format>` one, else the card's
   own built-in layout, which is what the job below describes. The composition
   travels on the query string because a file:// page can read no file. */
var LAYOUTS = (function () {
  try { return (JSON.parse(fs.readFileSync(PRESETS, "utf8")).presets) || {}; }
  catch (e) { return {}; }
})();

function layoutFor(slug, format) {
  return LAYOUTS[slug + "/" + format] || LAYOUTS["__template/" + format] || null;
}

function screenOf(slug, n) {
  return path.join(ROOT, "assets", "image", "screen", slug + "-" + String(n).padStart(2, "0") + ".jpg");
}
function artOf(slug, role) {
  return path.join(ROOT, "assets", "image", "embed", slug + "-" + role + ".webp");
}
function shotCount(slug) {
  var dir = path.join(ROOT, "assets", "image", "screen");
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(function (f) {
    return f.indexOf(slug + "-") === 0 && f.endsWith(".jpg");
  }).length;
}

/* The gallery plan for one game and one language. The shots are spread from
   early to late across what was captured, and the punchline alternates between
   the top and the bottom band every third image so a gallery does not read as
   one layout printed four times. */
function planOf(m, lang) {
  var slug = m.slug;
  var lines = linesOf(m, lang);
  var have = shotCount(slug);
  var jobs = [];
  if (!lines.length || !have) return jobs;

  var n = Math.max(2, Math.min(lines.length, 8));
  var first = Math.min(2, have), last = Math.max(first, have - 1);
  for (var i = 0; i < n; i++) {
    var shot = n === 1 ? last : Math.round(first + (i * (last - first)) / (n - 1));
    jobs.push({
      format: "phone",
      shot: shot,
      line: lines[i % lines.length],
      face: FACE_CYCLE[i % FACE_CYCLE.length],
      side: i % 2 ? "left" : "right",
      pos: i % 3 === 2 ? "bottom" : "top",
      logo: i === 0 ? 1 : 0,
      objn: i === n - 1 ? 3 : 2,
      objOff: i,
      out: slug + "-" + String(i + 1).padStart(2, "0")
    });
  }
  /* Two desk pictures: a Play tablet slot wants at least one and a pair is
     what makes the two look like a game rather than a wallpaper. The character
     always stands on the left here — the phone is on the right. */
  [0, 1].forEach(function (k) {
    jobs.push({
      format: "desk",
      shot: Math.round(first + (k * (last - first)) / 1.6),
      line: lines[k % lines.length],
      face: k ? "neutral" : "happy",
      side: "left",
      pos: "top",
      logo: 1,
      objn: 2,
      objOff: k + 1,
      out: slug + "-desk-" + String(k + 1).padStart(2, "0")
    });
  });
  jobs.push({
    format: "thumb",
    shot: Math.round((first + last) / 2),
    line: lines[0],
    face: "happy",
    side: "left",
    pos: "top",
    logo: 1,
    objn: 2,
    objOff: 0,
    out: slug + "-thumb"
  });
  return jobs.filter(function (j) { return formats.indexOf(j.format) >= 0; });
}

// --- --lines: read the copy of the thirteen, side by side ----------------

if (listOnly) {
  slugs.forEach(function (slug) {
    var m = manifestOf(slug);
    var written = !!(m.store && m.store.copy);
    console.log("\n" + slug + (written ? "" : "   (no store.copy — falling back to copy.<lang>.tags)"));
    langs.forEach(function (lang) {
      linesOf(m, lang).forEach(function (l, i) {
        console.log("  " + lang + " " + (i + 1) + "  "
          + (l.kicker ? "[" + l.kicker + "] " : "")
          + l.line.replace(/<\/?b>/g, "*"));
      });
    });
  });
  process.exit(0);
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
    "--window-size=1280,1280",
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

/* Resample the 2x capture down to what the store is handed. One step, done by
   Chrome's own high-quality filter, so the repo still needs no image library. */
function resampleJS(b64, w, h) {
  var type = png ? '"image/png"' : '"image/jpeg", 0.92';
  return `(async () => {
    const img = new Image();
    img.src = "data:image/png;base64,${b64}";
    await img.decode();
    const c = document.createElement("canvas");
    c.width = ${w}; c.height = ${h};
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, ${w}, ${h});
    return c.toDataURL(${type});
  })()`;
}

async function shoot(client, sid, info, job, lang, outPath) {
  var fmt = FORMATS[job.format];
  await client.send("Emulation.setDeviceMetricsOverride",
    { width: fmt.w, height: fmt.h, deviceScaleFactor: DSF, mobile: false }, sid);

  var pool = info.objects.length
    ? info.objects.slice(job.objOff % info.objects.length)
        .concat(info.objects.slice(0, job.objOff % info.objects.length))
    : [];

  var url = "file://" + CARD
    + "?shoot=1"
    + "&slug=" + encodeURIComponent(info.slug)
    + "&format=" + job.format
    + "&lang=" + lang
    + "&shot=" + job.shot
    + "&face=" + job.face
    + "&side=" + job.side
    + "&pos=" + job.pos
    + "&logo=" + job.logo
    + "&objn=" + job.objn
    + "&font=" + encodeURIComponent(info.font)
    + "&accent=" + encodeURIComponent(info.accent)
    + "&accent2=" + encodeURIComponent(info.accent2)
    + "&line=" + encodeURIComponent(job.line.line)
    + "&kicker=" + encodeURIComponent(job.line.kicker)
    + "&objects=" + encodeURIComponent(pool.join(","));

  /* A hand-made layout wins over the built-in one. Its taglines refer to a
     line of the manifest by index, so the copy of this job is handed over with
     it and the card resolves the two itself. */
  var layout = layoutFor(info.slug, job.format);
  if (layout) {
    var comp = JSON.parse(JSON.stringify(layout));
    (comp.items || []).forEach(function (it) {
      if (it.kind === "text" && it.src !== "free") {
        it.src = "free";
        it.line = job.line.line;
        it.kicker = job.line.kicker;
      }
      /* The pool the shoot handed over is already rotated for this image, and
         the ground is the capture this job aimed at. */
      if (it.kind === "screen") it.ref = 0;
    });
    if (comp.ground && comp.ground.kind === "screen") comp.ground.ref = 0;
    url += "&comp=" + encodeURIComponent(Buffer.from(JSON.stringify(comp), "utf8").toString("base64"));
  }

  await client.send("Page.navigate", { url: url }, sid);

  var deadline = Date.now() + 25000;
  for (;;) {
    if (await evaluate(client, sid, "window.__cardReady || 0")) break;
    if (Date.now() > deadline) throw new Error("the card never reported ready");
    await sleep(80);
  }

  var res = await client.send("Page.captureScreenshot",
    { format: "png", captureBeyondViewport: false }, sid);
  var dataUri = await evaluate(client, sid, resampleJS(res.data, fmt.out[0], fmt.out[1]), true);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
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

/* A listing image is not shot with a hole in it: the card would draw a dashed
   placeholder, and a placeholder that reaches a store page by accident is
   exactly what this gate exists to prevent. Say which piece is missing — the
   answer is almost always "run encode-art" or "run shoot-screens". */
function whyNot(slug, job) {
  if (!fs.existsSync(screenOf(slug, job.shot))) {
    return "no screenshot " + String(job.shot).padStart(2, "0");
  }
  if (!fs.existsSync(artOf(slug, "character-" + job.face))) {
    return "no art character-" + job.face;
  }
  if (job.format !== "phone" || job.logo) {
    if (!fs.existsSync(artOf(slug, "title"))) return "no art title";
  }
  if (job.format !== "phone") {
    if (!fs.existsSync(artOf(slug, "background-desk"))) return "no art background-desk";
  }
  return null;
}

var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shoot-store-"));
var chrome = await launchChrome(path.join(tmpDir, "profile"));
reap(chrome.child);
var client = await cdp(chrome.port);
var sid = await openPage(client);

var failed = 0, skipped = 0, made = 0;

for (var s = 0; s < slugs.length; s++) {
  var slug = slugs[s];
  var m = manifestOf(slug);
  var info = {
    slug: slug,
    font: (m.web && m.web.font) || "exo2",
    accent: (m.theme && m.theme.accent) || "#4dff9b",
    accent2: (m.theme && m.theme.accent2) || (m.theme && m.theme.accent) || "#4dff9b",
    objects: objectsOf(slug)
  };

  for (var li = 0; li < langs.length; li++) {
    var lang = langs[li];
    var jobs = planOf(m, lang);
    if (!jobs.length) {
      console.error("skip  " + slug + " " + lang + ": no copy or no screenshots");
      skipped++;
      continue;
    }
    for (var j = 0; j < jobs.length; j++) {
      var job = jobs[j];
      var why = whyNot(slug, job);
      var out = path.join(OUT_DIR, storeOf(job.format), lang, job.out + EXT);
      if (why) {
        console.error("skip  " + path.relative(ROOT, out) + ": " + why);
        skipped++;
        continue;
      }
      try {
        await shoot(client, sid, info, job, lang, out);
        made++;
        console.log("OK    " + path.relative(ROOT, out)
          + "  (" + Math.round(fs.statSync(out).size / 1024) + " KB)");
      } catch (e) {
        failed++;
        console.error("FAIL  " + path.relative(ROOT, out) + ": " + e.message);
      }
    }
  }
}

client.close();
chrome.child.kill("SIGKILL");
await sleep(300);
if (!keep) fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
else console.log("kept: " + tmpDir);

console.log(made + " image" + (made === 1 ? "" : "s")
  + (skipped ? ", " + skipped + " skipped" : "")
  + (failed ? ", " + failed + " failed" : ""));
process.exit(failed || skipped ? 1 : 0);
