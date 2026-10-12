#!/usr/bin/env node
/* A game's PROMO VIDEO: a motion-design clip for TikTok, Shorts and Reels,
   1080×1920, written as a HyperFrames composition (promo/<slug>/index.html)
   and rendered to dist/promo/<slug>-<lang>.mp4.

   The composition is the only thing written by hand. Everything it plays is
   the game's own material, gathered here into promo/<slug>/assets/ (ignored by
   git, made again by this command):

     - the gameplay, shot by tools/lab/shoot-clip.mjs under virtual time — one
       clip per entry of `shots` in promo/<slug>/promo.json and per language,
       in assets/shots/<lang>/<id>/, kept until --reshoot asks for it again (a
       shot is minutes of Chrome); the language being rendered is copied to
       assets/shot-<id>/, which is what the composition reads;
     - stills cut out of those clips (`stills`: a clip and a second);
     - the painted artwork, resized out of assets/image/master/;
     - the game's web font, out of assets/motor/font/;
     - the music master, out of assets/audio/music/;
     - the sound effects, laid back on the timeline from the clip's sound log
       (shoot-clip's events.json): each key is the house kit variant the
       manifest maps it to, or the clip the game embeds itself. They are
       written into index.html between the `sfx:begin` / `sfx:end` markers,
       because HyperFrames reads its <audio> clips off the document.

   Usage:
     node tools/lab/promo.mjs echomaze                 # prepare + render en and fr
     node tools/lab/promo.mjs echomaze --lang fr       # one language
     node tools/lab/promo.mjs echomaze --prepare       # assets only (then: npx hyperframes preview)
     node tools/lab/promo.mjs echomaze --reshoot       # shoot the gameplay again
*/

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var HYPERFRAMES = "hyperframes@0.8.81";               // pinned: a re-render must match

var argv = process.argv.slice(2);
var slug = argv.find(function (a, i) { return !a.startsWith("--") && argv[i - 1] !== "--lang"; });
var only = argv.indexOf("--lang") >= 0 ? argv[argv.indexOf("--lang") + 1] : null;
var prepareOnly = argv.indexOf("--prepare") >= 0;
var reshoot = argv.indexOf("--reshoot") >= 0;

var dir = path.join(ROOT, "promo", slug || "");
if (!slug || !fs.existsSync(path.join(dir, "promo.json"))) {
  console.error("usage: node tools/lab/promo.mjs <slug> [--lang en|fr] [--prepare] [--reshoot]"
    + "\n  promos: " + fs.readdirSync(path.join(ROOT, "promo")).filter(function (d) {
      return fs.existsSync(path.join(ROOT, "promo", d, "promo.json"));
    }).join(" "));
  process.exit(1);
}
var cfg = JSON.parse(fs.readFileSync(path.join(dir, "promo.json"), "utf8"));
var manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "games", slug, "manifest.json"), "utf8"));
var assets = path.join(dir, "assets");
fs.mkdirSync(assets, { recursive: true });

function run(cmd, args, opts) {
  var r = spawnSync(cmd, args, Object.assign({ cwd: ROOT, stdio: "inherit" }, opts || {}));
  if (r.status !== 0) throw new Error(cmd + " " + args.slice(0, 3).join(" ") + "… failed");
}
function ffmpeg(args) { run("ffmpeg", ["-y", "-loglevel", "error"].concat(args)); }

// --- 1. the gameplay -----------------------------------------------------

/* One set of shots per language: the round writes its own HUD and callouts,
   and a French promo over an English round reads as two products. The seed
   is the same, so the two runs are the same run. */
var langs = only ? [only] : ["en", "fr"];
var built = false;
langs.forEach(function (lang) {
  cfg.shots.forEach(function (s) {
    var out = path.join(assets, "shots", lang, s.id);
    if (!reshoot && fs.existsSync(path.join(out, "gameplay.mp4"))) return;
    console.log("shooting " + s.id + " in " + lang + " (level " + s.level + ", seed " + s.seed + ", " + s.seconds + " s)");
    run(process.execPath, ["tools/lab/shoot-clip.mjs", slug, "--level", String(s.level), "--seed", String(s.seed),
      "--seconds", String(s.seconds), "--lang", lang, "--out", out].concat(built ? ["--no-build"] : []));
    built = true;
  });
});

/* The composition reads assets/shot-<id>/ and the stills: they are the
   language being rendered, swapped in before each render. */
function useLang(lang) {
  cfg.shots.forEach(function (s) {
    var from = path.join(assets, "shots", lang, s.id), to = path.join(assets, "shot-" + s.id);
    fs.mkdirSync(to, { recursive: true });
    ["gameplay.mp4", "events.json"].forEach(function (f) { fs.copyFileSync(path.join(from, f), path.join(to, f)); });
  });
  writeMarks();
  /* A clip the composition plays from a MARK is cut here rather than given a
     data-media-start: HyperFrames reads a video's timing off the document as
     written, so a start that moves with the run must move in the file. */
  (cfg.cuts || []).forEach(function (c) {
    var src = path.join(assets, "shot-" + c.shot, "gameplay.mp4");
    ffmpeg(["-ss", String(timeOf(c.from)), "-i", src, "-c:v", "libx264", "-preset", "slow", "-crf", "16",
      "-pix_fmt", "yuv420p", "-an", path.join(assets, c.id + ".mp4")]);
  });
  (cfg.stills || []).forEach(function (s) {
    ffmpeg(["-ss", String(s.t), "-i", path.join(assets, "shot-" + s.shot, "gameplay.mp4"),
      "-frames:v", "1", "-q:v", "2", path.join(assets, s.id + ".jpg")]);
  });
}

/* The MARKS: when the round did what the timeline is cut on, read off the
   shot's sound log — the first time each named key played. A played round
   is not a scripted one, and the composition places its cuts on these
   (assets/marks.js), as the sfx layer does with "from" / "to". */
var marks = {};
function writeMarks() {
  marks = {};
  if (!cfg.marks) return;
  var log = JSON.parse(fs.readFileSync(path.join(assets, "shot-" + cfg.marks.shot, "events.json"), "utf8"));
  cfg.marks.keys.forEach(function (k) {
    var e = log.events.find(function (e) { return e.name === k; });
    if (!e) throw new Error("the " + cfg.marks.shot + " shot never played " + k + ": shoot it again");
    marks[k] = e.t;
  });
  fs.writeFileSync(path.join(assets, "marks.js"), "window.PROMO_MARKS = " + JSON.stringify(marks) + ";\n");
}
// A time in promo.json: a number, or a mark plus seconds ("escape+0.9").
function timeOf(v) {
  if (typeof v === "number") return v;
  var m = /^([a-z]+)([+-][0-9.]+)?$/i.exec(v);
  if (!m || marks[m[1]] == null) throw new Error("unknown mark: " + v);
  return marks[m[1]] + (m[2] ? +m[2] : 0);
}

// --- 2. the artwork, the font, the music ---------------------------------

/* A picture with no transparency to keep goes out as a JPEG: HyperFrames
   inlines an asset under 2 MB and fetches the rest, and a full-frame PNG is
   over it. */
(cfg.art || []).forEach(function (a) {
  var src = path.join(ROOT, "assets", "image", "master", slug + "-" + a.role + ".png");
  ffmpeg(["-i", src, "-vf", "scale=" + a.width + ":-1:flags=lanczos"].concat(a.opaque ? ["-q:v", "2"] : [])
    .concat([path.join(assets, a.role + (a.opaque ? ".jpg" : ".png"))]));
});

/* The words, both languages: the composition picks one with the `lang`
   variable the render is given. A plain script and not a fetch, because a
   composition must not touch the network. */
fs.writeFileSync(path.join(assets, "copy.js"), "window.PROMO_COPY = " + JSON.stringify(cfg.copy, null, 2) + ";\n");

var font = manifest.web && manifest.web.font;
if (font) fs.copyFileSync(path.join(ROOT, "assets", "motor", "font", font + ".woff2"), path.join(assets, "font.woff2"));

ffmpeg(["-ss", String(cfg.music.from), "-t", String(cfg.music.length),
  "-i", path.join(ROOT, "assets", "audio", "music", cfg.music.file),
  "-c:a", "libmp3lame", "-b:a", "192k", path.join(assets, "music.mp3")]);

// --- 3. the sound effects ------------------------------------------------

/* Where a key's sample lives: the kit variant the manifest maps it to, a
   shell role of the kit, or the clip the game embeds in ASSETS.sounds. */
var gameSrc = fs.readFileSync(path.join(ROOT, "games", slug, "game.js"), "utf8");
function sampleOf(kind, name) {
  var file = path.join(assets, "sfx-" + name + ".mp3");
  if (fs.existsSync(file)) return file;
  var kit = kind === "ui" ? name + "-default" : (manifest.sfx || {})[name];
  if (kit) {
    var k = path.join(ROOT, "assets", "audio", "kit", kit.replace("/", "-") + "-1.mp3");
    if (!fs.existsSync(k)) return null;
    fs.copyFileSync(k, file);
    return file;
  }
  var m = new RegExp("^\\s*\"?" + name + "\"?\\s*:\\s*\"data:audio/mpeg;base64,([^\"]+)\"", "m").exec(gameSrc);
  if (!m) return null;
  fs.writeFileSync(file, Buffer.from(m[1], "base64"));
  return file;
}

function durationOf(file) {
  return +spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" }).stdout || 1;
}

/* Every sample gets a lane of its own: two hits on one beat are meant to
   sound together, and the linter reads a shared lane as an accident. */
function laySfx() {
  var tags = [], missing = {}, lane = 20;
  cfg.sfx.forEach(function (lay) {
    var log = JSON.parse(fs.readFileSync(path.join(assets, "shot-" + lay.shot, "events.json"), "utf8"));
    var last = {}, n = 0, from = timeOf(lay.from), to = timeOf(lay.to);
    log.events.forEach(function (e) {
      if (e.t < from || e.t >= to) return;
      if ((lay.skip || []).indexOf(e.name) >= 0) return;
      // A burst of the same key is one sound to the ear and forty <audio> clips
      // to the renderer: keep one per `gap` seconds.
      if (last[e.name] != null && e.t - last[e.name] < (lay.gap || 0.12)) return;
      var file = sampleOf(e.kind, e.name);
      if (!file) { missing[e.name] = 1; return; }
      last[e.name] = e.t;
      var at = +(lay.at + e.t - from).toFixed(3);
      var dur = Math.min(2.5, durationOf(file));
      var vol = Math.min(1, e.vol * (lay.gain || 1));
      tags.push('      <audio id="sfx-' + lay.shot + "-" + (n++) + '" data-start="' + at + '" data-duration="'
        + dur.toFixed(3) + '" data-track-index="' + (lane++) + '" data-volume="' + vol.toFixed(2)
        + '" src="assets/' + path.basename(file) + '"></audio>');
    });
  });
  (cfg.cues || []).forEach(function (c, i) {
    var file = sampleOf(c.kind || "ui", c.name);
    if (!file) { missing[c.name] = 1; return; }
    tags.push('      <audio id="cue-' + i + '" data-start="' + c.at + '" data-duration="'
      + Math.min(2.5, durationOf(file)).toFixed(3) + '" data-track-index="' + (lane++) + '" data-volume="'
      + (c.vol || 0.8) + '" src="assets/'
      + path.basename(file) + '"></audio>');
  });
  if (Object.keys(missing).length) console.log("no sample for: " + Object.keys(missing).join(" "));

  var html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  var a0 = html.indexOf("<!-- sfx:begin -->"), a1 = html.indexOf("<!-- sfx:end -->");
  if (a0 < 0 || a1 < 0) throw new Error("index.html has no sfx:begin / sfx:end markers");
  html = html.slice(0, a0) + "<!-- sfx:begin -->\n" + tags.join("\n") + "\n      " + html.slice(a1);
  fs.writeFileSync(path.join(dir, "index.html"), html);
  return tags.length;
}

// --- 4. the render -------------------------------------------------------

var out = path.join(ROOT, "dist", "promo");
fs.mkdirSync(out, { recursive: true });
langs.forEach(function (lang, i) {
  if (prepareOnly && i > 0) return;
  useLang(lang);
  var n = laySfx();
  console.log("prepared promo/" + slug + " in " + lang + " (" + n + " sound clips)");
  if (prepareOnly) return;
  var file = path.join(out, slug + "-" + lang + ".mp4");
  run("npx", ["-y", HYPERFRAMES, "render", "--quality", "delivery", "--quiet",
    "--variables", JSON.stringify({ lang: lang }), "-o", file], { cwd: dir });
  console.log("wrote " + path.relative(ROOT, file));
});
