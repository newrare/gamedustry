#!/usr/bin/env node
/* Cut one painted SHEET of objects into one transparent PNG per object.
 *
 * WHY THIS EXISTS
 * ---------------
 * The image model does not draw one gear: asked for a gear it draws a wall of
 * them, sixteen at once, on a painted ground — `assets/image/master/radiam-object-gear.png`
 * is 1536x1024 of exactly that. Every one of them is usable, and none of them
 * is usable as it stands: a game draws ONE gear, with alpha, at the size the
 * canvas asks for, and a store screenshot lays ONE on top of a capture.
 *
 * So this tool reads a sheet and writes its objects out, one file each, cut
 * from their background. It is the missing first step of the artwork pipeline:
 *
 *   assets/image/master/<slug>-object-<name>.png   the sheet, straight from the model
 *      │  node tools/lab/cut-objects.mjs <slug>
 *      ▼
 *   assets/image/object/<slug>-<name>-NN.png      one transparent object per file
 *      │  --adopt 1,4,7   (the ones worth keeping, and only those)
 *      ▼
 *   assets/image/master/<slug>-<name>NN.png        a master like any other
 *      │  node tools/lab/encode-art.mjs
 *      ▼
 *   assets/image/embed/<slug>-<name>NN.webp   →  CONFIG.art.<name>NN  →  ArtImages
 *
 * …or `--adopt 1,4 --as decor`, which writes `<slug>-decor-NN.png` instead and
 * lands the cut in the DECOR POOL: the shell scatters those over the end
 * screen, the round's corners and the web menu's panels without a game naming
 * one of them (packages/shell/shell.js, Decor).
 *
 * The two-step is deliberate. Everything under `assets/image/embed/` is embedded in
 * every build of its game, so 383 objects nobody draws would be megabytes of
 * base64 in creatives capped at 5 MB. `assets/image/object/` is tracked material —
 * like `assets/image/master/`, because material that exists on one laptop is material
 * nobody else can build from — and it ships nowhere: cut everything, look at
 * the contact sheet, adopt the two you actually want.
 *
 * HOW THE CUT WORKS
 * -----------------
 * No image library, no model, no magic wand — the same headless Chrome the
 * rest of assets/ is built with, reading pixels out of a canvas. There are two
 * ways in, and the sheet decides which:
 *
 * ALPHA, when the sheet has one. A model asked for objects on no background
 * returns them already cut: `radiam-object-gear.png` is RGBA with 40% of its
 * pixels at alpha 0, and the purple you see in a viewer is the RGB left under
 * that transparency. Guessing a mask when the file states one would be worse
 * at it — so the mask IS the alpha, and each object keeps the model's own
 * anti-aliased edge, unretouched.
 *
 * FLOOD, when it does not — an opaque sheet, objects on a painted ground:
 *
 *   1. the median colour of the sheet's border is the background;
 *   2. every border pixel close to it seeds a flood fill that grows by LOCAL
 *      difference, one step at a time. That is what handles a painted ground:
 *      the lighting drifts across the sheet, so no single colour describes it,
 *      but the drift between two touching pixels is tiny while the step onto
 *      an object's edge is not;
 *   3. each object is then written with its alpha eroded by a pixel and
 *      feathered by one more — the eroded pixel is half object, half ground,
 *      and keeping it is what fringes a cut with the colour of the sheet it
 *      came from.
 *
 * Either way the mask is then labelled into connected objects, the specks are
 * dropped and so are the ones the sheet's own edge cuts in half.
 *
 * Two knobs matter when a flood goes wrong, and the contact sheet in
 * dist/object/ is how you see which: --step (bigger = the fill crosses more,
 * use it when an object keeps a collar of background) and --min (the speck
 * floor).
 *
 * An alpha sheet has one of its own: --solid, and it is the knob that decides
 * everything on these sheets. A painted object carries tens of pixels of halo
 * below alpha 110, and a halo that reaches the next object WELDS the two:
 * chainring's thirty-one rings came back as one single object until this
 * existed, and triverse's thirty-four arrows as seventeen pairs. --solid is
 * the alpha at which a pixel is the object rather than its glow, so it is
 * where the welds are cut — which is why the default is 110 and not 1.
 *
 * The glow is not lost, it is re-grown: each object's halo is followed OUT of
 * it, pixel by pixel, as far as --pad and never through another object's
 * label. A ring keeps its own light and none of its neighbour's, and a cut
 * ring is not a dead ring.
 *
 *   node tools/lab/cut-objects.mjs chainring --solid 40   # softer objects
 *   node tools/lab/cut-objects.mjs slipdeck  --solid 8    # everything alpha says
 *
 * Usage:
 *   node tools/lab/cut-objects.mjs radiam                  # every sheet of a game
 *   node tools/lab/cut-objects.mjs radiam-object-gear      # one sheet
 *   node tools/lab/cut-objects.mjs radiam --list           # what it would cut
 *   node tools/lab/cut-objects.mjs radiam-object-gear --adopt 1,4
 *   node tools/lab/cut-objects.mjs radiam-object-gear --adopt 1,4 --as decor
 *   node tools/lab/cut-objects.mjs radiam --step 18 --min 4000 --keep-partial
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var SRC_DIR = path.join(ROOT, "assets", "image", "master");
var OUT_DIR = path.join(ROOT, "assets", "image", "object");
var CONTACT_DIR = path.join(ROOT, "dist", "object");
var GAMES_DIR = path.join(ROOT, "games");
var CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/* A sheet is named `<slug>-object-<name>.png`. The prefix is what tells this
   tool and `encode-art.mjs` apart: `object-` means a sheet to cut, never a
   role to ship, so a 2 MB wall of gears is not encoded into every build. */
var SHEET = "object-";

// --- CLI -----------------------------------------------------------------
var argv = process.argv.slice(2);
var targets = [];
var step = 14;          // local tolerance of the flood fill, 0-255 per channel
var envelope = 90;      // how far from the border colour the fill may ever go
var minArea = 2500;     // a speck below this is paint, not an object
var solid = 110;        // alpha at which a pixel is the object rather than its glow
var pad = 20;           // px of margin, and how far an object's glow is followed
var keepPartial = false;
var listOnly = false;
var adopt = null;
var adoptAs = null;     // the role the adopted cuts take in assets/image/master/

for (var i = 0; i < argv.length; i++) {
  var a = argv[i];
  if (a === "--step") step = parseInt(argv[++i], 10);
  else if (a === "--envelope") envelope = parseInt(argv[++i], 10);
  else if (a === "--min") minArea = parseInt(argv[++i], 10);
  else if (a === "--solid") solid = parseInt(argv[++i], 10);
  else if (a === "--pad") pad = parseInt(argv[++i], 10);
  else if (a === "--keep-partial") keepPartial = true;
  else if (a === "--list") listOnly = true;
  else if (a === "--adopt") adopt = argv[++i];
  else if (a === "--as") adoptAs = argv[++i];
  else targets.push(a);
}

function knownSlugs() {
  return fs.readdirSync(GAMES_DIR).filter(function (d) {
    return fs.existsSync(path.join(GAMES_DIR, d, "manifest.json"));
  }).sort();
}

/* The sheets to work on: a game's name takes all of its sheets, a sheet's own
   name takes that one. Anything else is a typo and says so. */
function sheets() {
  var all = fs.existsSync(SRC_DIR)
    ? fs.readdirSync(SRC_DIR).filter(function (f) { return /\.png$/i.test(f); }).sort()
    : [];
  var games = knownSlugs();

  var found = all.map(function (file) {
    var stem = file.replace(/\.png$/i, "");
    var slug = games.filter(function (g) { return stem.indexOf(g + "-") === 0; })[0];
    if (!slug) return null;
    var role = stem.slice(slug.length + 1);
    if (role.indexOf(SHEET) !== 0) return null;
    return { file: file, stem: stem, slug: slug, name: role.slice(SHEET.length), src: path.join(SRC_DIR, file) };
  }).filter(Boolean);

  if (!targets.length) return found;

  var picked = [];
  targets.forEach(function (t) {
    var hits = found.filter(function (s) { return s.slug === t || s.stem === t; });
    if (!hits.length) throw new Error('nothing to cut for "' + t + '" — expected a game with an ' +
      "assets/image/master/<slug>-" + SHEET + "<name>.png sheet");
    hits.forEach(function (h) { if (picked.indexOf(h) < 0) picked.push(h); });
  });
  return picked;
}

// --- Chrome over the DevTools protocol -----------------------------------
// The same tiny client as tools/lab/encode-art.mjs and shoot-cover.mjs, kept
// local for the same reason: forty lines beat a module nothing else imports.

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

async function evaluate(client, sid, expr) {
  var r = await client.send("Runtime.evaluate", {
    expression: expr, returnByValue: true, awaitPromise: true
  }, sid);
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception
      ? r.exceptionDetails.exception.description
      : r.exceptionDetails.text);
  }
  return r.result.value;
}

/* The whole cut, as one expression evaluated in the page. It never touches the
   network or the disk: the sheet goes in as a data URI and the objects come
   back as data URIs, so Chrome stays a pixel engine and this file stays the
   only place that knows where anything lives. */
function cutJs(b64, o) {
  return `(async () => {
  const img = new Image();
  img.src = "data:image/png;base64,${b64}";
  await img.decode();
  const W = img.width, H = img.height;

  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const px = g.getImageData(0, 0, W, H).data;

  const at = (x, y) => (y * W + x) * 4;
  const dist = (i, j) => Math.max(
    Math.abs(px[i] - px[j]), Math.abs(px[i + 1] - px[j + 1]), Math.abs(px[i + 2] - px[j + 2]));

  /* Does this sheet state its own mask? A painted sheet is opaque end to end;
     one that came back cut has a real share of its pixels at alpha 0. Half a
     percent would be a stray soft edge, so the bar is a tenth of the sheet. */
  let clear = 0;
  for (let p = 0; p < W * H; p++) if (px[p * 4 + 3] < 8) clear++;
  const byAlpha = clear > W * H * 0.10;

  // 1. the border's median colour — the sheet's ground, whatever it is.
  const edge = [[], [], []];
  for (let x = 0; x < W; x++) for (const y of [0, H - 1]) {
    const i = at(x, y); edge[0].push(px[i]); edge[1].push(px[i + 1]); edge[2].push(px[i + 2]);
  }
  for (let y = 0; y < H; y++) for (const x of [0, W - 1]) {
    const i = at(x, y); edge[0].push(px[i]); edge[1].push(px[i + 1]); edge[2].push(px[i + 2]);
  }
  const med = edge.map(ch => { ch.sort((a, b) => a - b); return ch[ch.length >> 1]; });
  const fromGround = (i) => Math.max(
    Math.abs(px[i] - med[0]), Math.abs(px[i + 1] - med[1]), Math.abs(px[i + 2] - med[2]));

  // 2-3. the ground: the sheet's own transparency, or a flood from its border.
  const bg = new Uint8Array(W * H);
  const stack = new Int32Array(W * H);
  let top = 0;
  const push = (p) => { if (!bg[p]) { bg[p] = 1; stack[top++] = p; } };

  if (byAlpha) {
    for (let p = 0; p < W * H; p++) if (px[p * 4 + 3] < ${o.solid}) bg[p] = 1;
  } else {
    for (let x = 0; x < W; x++) for (const y of [0, H - 1]) {
      const p = y * W + x; if (fromGround(p * 4) <= ${o.envelope}) push(p);
    }
    for (let y = 0; y < H; y++) for (const x of [0, W - 1]) {
      const p = y * W + x; if (fromGround(p * 4) <= ${o.envelope}) push(p);
    }

    while (top > 0) {
      const p = stack[--top];
      const x = p % W, y = (p / W) | 0, i = p * 4;
      const test = (q) => {
        if (bg[q]) return;
        const j = q * 4;
        if (dist(i, j) <= ${o.step} && fromGround(j) <= ${o.envelope}) push(q);
      };
      if (x > 0) test(p - 1);
      if (x < W - 1) test(p + 1);
      if (y > 0) test(p - W);
      if (y < H - 1) test(p + W);
    }
  }

  // 4. label what the flood never reached.
  const label = new Int32Array(W * H);
  const boxes = [];
  for (let p = 0; p < W * H; p++) {
    if (bg[p] || label[p]) continue;
    const id = boxes.length + 1;
    let area = 0, x0 = W, y0 = H, x1 = 0, y1 = 0, edgeTouch = false;
    top = 0; stack[top++] = p; label[p] = id;
    while (top > 0) {
      const q = stack[--top];
      const x = q % W, y = (q / W) | 0;
      area++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) edgeTouch = true;
      const test = (r) => { if (!bg[r] && !label[r]) { label[r] = id; stack[top++] = r; } };
      if (x > 0) test(q - 1);
      if (x < W - 1) test(q + 1);
      if (y > 0) test(q - W);
      if (y < H - 1) test(q + W);
    }
    boxes.push({ id, area, x0, y0, x1, y1, partial: edgeTouch });
  }

  const kept = boxes
    .filter(b => b.area >= ${o.minArea} && (${o.keepPartial ? "true" : "!b.partial"}))
    .sort((a, b) => b.area - a.area);

  // 5. one canvas per object: alpha eroded by a pixel, then feathered by one.
  const out = [];
  const pad = ${o.pad};
  for (const b of kept) {
    const w = b.x1 - b.x0 + 1 + pad * 2;
    const h = b.y1 - b.y0 + 1 + pad * 2;
    const oc = document.createElement("canvas");
    oc.width = w; oc.height = h;
    const og = oc.getContext("2d");
    const dst = og.createImageData(w, h);

    const inside = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return 0;
      return label[y * W + x] === b.id ? 1 : 0;
    };

    /* THE HALO, and only this object's.

       Everything the labelling left unassigned is glow — below the --solid
       bar — and a ring cut without its glow is a dead ring. But the sheet
       packs objects a hundred pixels apart, so the box around one ring also
       contains the tail of its neighbour's. So the glow is grown OUT of this
       object, one pixel at a time, and never further than the padding: what
       belongs to the ring is reachable from it, what belongs to the next one
       is not. */
    const halo = new Uint8Array(w * h);
    if (byAlpha && pad > 0) {
      const q = new Int32Array(w * h);
      let head = 0, tail = 0;
      const dist = new Int16Array(w * h).fill(-1);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (inside(b.x0 - pad + x, b.y0 - pad + y)) { dist[y * w + x] = 0; q[tail++] = y * w + x; }
      }
      while (head < tail) {
        const p = q[head++];
        if (dist[p] >= pad) continue;
        const x = p % w, y = (p / w) | 0;
        const test = (nx, ny) => {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
          const np = ny * w + nx;
          if (dist[np] >= 0) return;
          const sx = b.x0 - pad + nx, sy = b.y0 - pad + ny;
          if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;
          if (label[sy * W + sx] !== 0) return;        // another object: stop
          if (px[at(sx, sy) + 3] === 0) return;        // nothing to carry
          dist[np] = dist[p] + 1;
          halo[np] = 1;
          q[tail++] = np;
        };
        test(x - 1, y); test(x + 1, y); test(x, y - 1); test(x, y + 1);
      }
    }
    /* Eroded, on a flood: an edge pixel is half object, half ground, and
       keeping it is what paints a cut with a rim of the sheet it came from.
       An alpha sheet needs none of that — the model already drew the edge. */
    const solid = (x, y) => inside(x, y) &&
      inside(x - 1, y) && inside(x + 1, y) && inside(x, y - 1) && inside(x, y + 1);

    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const sx = b.x0 - pad + x, sy = b.y0 - pad + y;
      let alpha;
      if (byAlpha) {
        const own = inside(sx, sy) || halo[y * w + x];
        alpha = own ? px[at(Math.min(W - 1, Math.max(0, sx)), Math.min(H - 1, Math.max(0, sy))) + 3] : 0;
      } else {
        let acc = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) acc += solid(sx + dx, sy + dy);
        alpha = Math.round((acc / 9) * 255);
      }
      if (!alpha) continue;
      const s = at(Math.min(W - 1, Math.max(0, sx)), Math.min(H - 1, Math.max(0, sy)));
      const d = (y * w + x) * 4;
      dst.data[d] = px[s]; dst.data[d + 1] = px[s + 1]; dst.data[d + 2] = px[s + 2];
      dst.data[d + 3] = alpha;
    }
    og.putImageData(dst, 0, 0);
    out.push({ w, h, area: b.area, x: b.x0, y: b.y0, partial: b.partial, uri: oc.toDataURL("image/png") });
  }

  return {
    sheet: { w: W, h: H, ground: med, byAlpha },
    found: boxes.length,
    dropped: boxes.length - kept.length,
    objects: out
  };
})()`;
}

/* The contact sheet: every cut on a checkerboard, numbered, at a size where a
   fringe or a missing tooth is visible. It is the only honest way to check a
   cut — a list of pixel counts says nothing about whether a gear lost a tooth. */
function contactJs(objects) {
  return `(async () => {
  const items = ${JSON.stringify(objects.map(function (o) { return { uri: o.uri, w: o.w, h: o.h }; }))};
  const cell = 260, cols = Math.min(5, Math.max(1, items.length)), pad = 14;
  const rows = Math.ceil(items.length / cols);
  const c = document.createElement("canvas");
  c.width = cols * cell; c.height = rows * cell;
  const g = c.getContext("2d");

  // the checkerboard, so transparency is visible as transparency
  for (let y = 0; y < c.height; y += 16) for (let x = 0; x < c.width; x += 16) {
    g.fillStyle = ((x / 16 + y / 16) % 2) ? "#2a2a33" : "#3a3a44";
    g.fillRect(x, y, 16, 16);
  }
  g.font = "bold 18px -apple-system, sans-serif";
  g.textBaseline = "top";

  for (let i = 0; i < items.length; i++) {
    const im = new Image();
    im.src = items[i].uri;
    await im.decode();
    const cx = (i % cols) * cell, cy = ((i / cols) | 0) * cell;
    const s = Math.min((cell - pad * 2) / im.width, (cell - pad * 2) / im.height, 1);
    const w = im.width * s, h = im.height * s;
    g.drawImage(im, cx + (cell - w) / 2, cy + (cell - h) / 2, w, h);
    g.fillStyle = "rgba(0,0,0,.6)";
    g.fillRect(cx + 6, cy + 6, 30, 24);
    g.fillStyle = "#fff";
    g.fillText(String(i + 1).padStart(2, "0"), cx + 11, cy + 9);
  }
  return c.toDataURL("image/png");
})()`;
}

function write(file, uri) {
  fs.writeFileSync(file, Buffer.from(uri.slice(uri.indexOf(",") + 1), "base64"));
  return fs.statSync(file).size;
}

/* --adopt promotes the cuts worth keeping into assets/image/master/, where they
   become masters like any other: encode-art picks them up and the builder
   injects them as CONFIG.art.<name>NN. Nothing is adopted automatically —
   everything under assets/image/embed/ is embedded in every build of its game.

   --as renames the role on the way in, and it is what fills the DECOR pool:
   `--as decor` writes `<slug>-decor-NN.png`, which reaches the motor as
   `CONFIG.art.decorNN` and is scattered over the screens by the shell's Decor
   module (packages/shell/shell.js). A game whose objects come off two sheets
   keeps them apart with a role each — `--as decor-ball`, `--as decor-brick` —
   because the numbering restarts with every sheet and two `decor-01` would be
   the same file twice. Without --as the cut keeps the sheet's own name, which
   is the shape a game draws on its canvas (ArtImages.gear01). */
function adoptCuts(sheet, picks, files) {
  var done = [];
  picks.split(",").map(function (s) { return parseInt(s.trim(), 10); }).forEach(function (n) {
    var src = files[n - 1];
    if (!src) throw new Error("--adopt " + n + ": there is no object " + n + " in this sheet");
    var stem = adoptAs
      ? adoptAs + "-" + String(n).padStart(2, "0")
      : sheet.name + String(n).padStart(2, "0");
    var dst = path.join(SRC_DIR, sheet.slug + "-" + stem + ".png");
    fs.copyFileSync(src, dst);
    done.push(path.relative(ROOT, dst));
  });
  return done;
}

// --- run -----------------------------------------------------------------
function reap(child) {
  var done = false;
  function kill() { if (done) return; done = true; try { child.kill("SIGKILL"); } catch (e) {} }
  process.on("exit", kill);
  process.on("SIGINT", function () { kill(); process.exit(130); });
  process.on("SIGTERM", function () { kill(); process.exit(143); });
  process.on("uncaughtException", function (e) { kill(); console.error(e); process.exit(1); });
  process.on("unhandledRejection", function (e) { kill(); console.error(e); process.exit(1); });
}

async function main() {
  var list = sheets();
  if (!list.length) {
    console.error("no sheet found. A sheet is assets/image/master/<slug>-" + SHEET + "<name>.png");
    process.exit(1);
  }
  if (listOnly) {
    list.forEach(function (s) {
      console.log("  " + path.relative(ROOT, s.src) + "  →  assets/image/object/" + s.slug + "-" + s.name + "-NN.png");
    });
    return;
  }
  if (adopt && list.length !== 1) {
    console.error("--adopt works on one sheet at a time; name it explicitly");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(CONTACT_DIR, { recursive: true });

  var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cut-objects-"));
  var chrome = await launchChrome(path.join(tmpDir, "profile"));
  reap(chrome.child);
  var client = await cdp(chrome.port);
  var sid = await openPage(client);

  for (var s = 0; s < list.length; s++) {
    var sheet = list[s];
    var b64 = fs.readFileSync(sheet.src).toString("base64");
    var r = await evaluate(client, sid, cutJs(b64, {
      step: step, envelope: envelope, minArea: minArea, pad: pad,
      keepPartial: keepPartial, solid: solid
    }));

    console.log("\n" + path.relative(ROOT, sheet.src) + "  " + r.sheet.w + "x" + r.sheet.h +
      (r.sheet.byAlpha
        ? "  cut on the sheet's own alpha"
        : "  flooded from rgb(" + r.sheet.ground.join(",") + ")"));
    console.log("  " + r.objects.length + " objects kept, " + r.dropped +
      " dropped (specks and the ones the sheet's edge cuts)");

    // a previous run's cuts of this sheet go, or a shorter run leaves orphans
    fs.readdirSync(OUT_DIR).forEach(function (f) {
      if (f.indexOf(sheet.slug + "-" + sheet.name + "-") === 0) fs.rmSync(path.join(OUT_DIR, f));
    });

    var files = [];
    r.objects.forEach(function (o, i) {
      var file = path.join(OUT_DIR, sheet.slug + "-" + sheet.name + "-" + String(i + 1).padStart(2, "0") + ".png");
      var bytes = write(file, o.uri);
      files.push(file);
      console.log("  " + String(i + 1).padStart(2, "0") + "  " +
        String(o.w).padStart(4) + "x" + String(o.h).padEnd(4) +
        "  " + String(Math.round(bytes / 1024)).padStart(4) + " KB" +
        (o.partial ? "  (cut by the sheet's edge)" : ""));
    });

    if (r.objects.length) {
      var contact = path.join(CONTACT_DIR, sheet.slug + "-" + sheet.name + ".png");
      write(contact, await evaluate(client, sid, contactJs(r.objects)));
      console.log("\n  look at it:  open " + path.relative(ROOT, contact));
      console.log("  keep some:   node tools/lab/cut-objects.mjs " + sheet.stem + " --adopt 1,4");
    }

    if (adopt) {
      var done = adoptCuts(sheet, adopt, files);
      console.log("\n  adopted → " + done.join("\n             "));
      console.log("  then:  node tools/lab/encode-art.mjs " + sheet.slug);
    }
  }

  client.close();
  chrome.child.kill("SIGKILL");
  await sleep(200);
  fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}

main().catch(function (e) { console.error("cut-objects failed: " + e.message); process.exit(1); });
