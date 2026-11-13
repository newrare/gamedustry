#!/usr/bin/env node
/* A game's PROMO VIDEO: a motion-design clip for TikTok, Shorts and Reels,
   1080×1920, written as a HyperFrames composition (promo/<slug>/index.html)
   and rendered to dist/promo/<slug>-<lang>.mp4.

   Two kinds of composition. echomaze's is written by hand for its game. Every
   other game says "template": "generic" in its promo.json and plays the
   shared one, promo/_template/index.html, copied to promo/<slug>/index.html
   on every run (never edit that copy). A generic promo.json only overrides
   the defaults below (genericDefaults): the levels and seeds of the shots,
   where the round is cut, which part of the music plays. Its WORDS are not in
   it: the captions are the game's store lines (store.copy in the manifest),
   the end card's sentence its intro tagline, the band names its web.levels —
   one source, so the copy desk's checks hold for the video too.

   Everything a composition plays is the game's own material, gathered here
   into promo/<slug>/assets/ (ignored by git, made again by this command):

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
     node tools/lab/promo.mjs --all                    # every promo, one after the other
*/

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var HYPERFRAMES = "hyperframes@0.8.81";               // pinned: a re-render must match

var argv = process.argv.slice(2);
var slug = argv.find(function (a, i) { return !a.startsWith("--") && argv[i - 1] !== "--lang"; });

/* --all renders every promo, one process each, one after the other: a shot
   and a render both own the machine while they run. */
if (argv.indexOf("--all") >= 0) {
  var rest = argv.filter(function (a) { return a !== "--all"; });
  var failed = [];
  fs.readdirSync(path.join(ROOT, "promo")).filter(function (d) {
    return fs.existsSync(path.join(ROOT, "promo", d, "promo.json"));
  }).forEach(function (d) {
    var r = spawnSync(process.execPath, [new URL(import.meta.url).pathname, d].concat(rest), { cwd: ROOT, stdio: "inherit" });
    if (r.status !== 0) failed.push(d);
  });
  if (failed.length) { console.error("failed: " + failed.join(" ")); process.exit(1); }
  process.exit(0);
}
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
var generic = cfg.template === "generic";
if (generic) cfg = genericDefaults(cfg);

/* The generic promo, filled in. Its timeline is fixed (the template's beat
   sheet): the round plays 0.5 → 7.4 s, so the run is cut `runFrom` seconds
   into its shot and 6.9 s of it are heard. The four band shots only give a
   still each — the flashes of the hook and the bands card. */
function genericDefaults(c) {
  var LEVELS = [9, 15, 21, 27];
  var runFrom = c.runFrom != null ? c.runFrom : 0.8;
  var seed = c.seed || 1;
  /* The run is a FREE round (level 0) unless promo.json names a level: a
     level's objective, met by the pilot, ends the round on its outro in the
     middle of the video. */
  var shots = c.shots || [{ id: "run", level: c.level || 0, seed: seed, seconds: +(runFrom + 7).toFixed(2) }]
    .concat(LEVELS.map(function (lv, i) {
      return { id: "b" + (i + 2), level: lv, seed: seed, seconds: 2 };
    }));
  var stillAt = c.stillAt != null ? c.stillAt : 1.5;
  return Object.assign({}, c, {
    shots: shots,
    stills: c.stills || [{ id: "band-1", shot: "run", t: +(runFrom + stillAt).toFixed(2) }]
      .concat([2, 3, 4, 5].map(function (k) { return { id: "band-" + k, shot: "b" + k, t: stillAt }; })),
    art: c.art || [
      { role: "title", width: 1400 },
      { role: "character-happy", width: 900 },
      { role: backgroundRole(), width: 1080, opaque: true, as: "background" }
    ],
    cuts: c.cuts || [{ id: "run", shot: "run", from: runFrom }],
    music: Object.assign({ file: slug + ".mp3", length: 13 }, c.music || {}),
    sfx: c.sfx || [{ shot: "run", at: 0.5, from: runFrom, to: +(runFrom + 6.9).toFixed(2), gap: 0.12, gain: 0.9, skipUi: true }],
    cues: c.cues || [
      { name: "draw", at: 0.0, vol: 0.55 },
      { name: "star", at: 5.85, vol: 0.7 },
      { name: "gain", at: 7.4, vol: 0.6 },
      { name: "win", at: 9.25, vol: 0.7 }
    ]
  });
}
// The phone scene: the plain one, or the first band's.
function backgroundRole() {
  var master = path.join(ROOT, "assets", "image", "master");
  if (fs.existsSync(path.join(master, slug + "-background-phone.png"))) return "background-phone";
  var f = fs.readdirSync(master).filter(function (n) { return n.indexOf(slug + "-background-phone-") === 0; }).sort()[0];
  if (!f) throw new Error(slug + ": no background-phone artwork");
  return f.slice(slug.length + 1, -4);
}

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
/* A generic promo's run must still be PLAYING when the video leaves it: a
   round the pilot loses, or wins, puts its outro under the captions. So the
   run is shot again on the next seed until one lasts (`tries` seeds), and
   the seed that held is kept for the other language — same seed, same run. */
var RUN_NEED = (cfg.runFrom != null ? cfg.runFrom : 0.8) + 6.9;
function endedAt(out) {
  var f = path.join(out, "events.json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).endedAt : null;
}
langs.forEach(function (lang) {
  cfg.shots.forEach(function (s) {
    var out = path.join(assets, "shots", lang, s.id);
    if (!reshoot && fs.existsSync(path.join(out, "gameplay.mp4"))) return;
    var check = generic && s.id === "run", tries = check ? (cfg.tries || 8) : 1;
    for (var k = 0; k < tries; k++) {
      console.log("shooting " + s.id + " in " + lang + " (level " + s.level + ", seed " + s.seed + ", " + s.seconds + " s)");
      run(process.execPath, ["tools/lab/shoot-clip.mjs", slug, "--level", String(s.level), "--seed", String(s.seed),
        "--seconds", String(s.seconds), "--lang", lang, "--out", out].concat(built ? ["--no-build"] : []));
      built = true;
      var e = check ? endedAt(out) : null;
      if (e == null || e >= RUN_NEED) break;
      console.log("  the round ended at " + e + " s, under " + RUN_NEED.toFixed(1) + " s: next seed");
      s.seed++;
    }
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
  /* A round that stops being played inside the window the video shows (the
     pilot died, an objective was met) puts its outro and end screen under the
     captions: refused, with what to change. */
  if (generic) {
    var ev = JSON.parse(fs.readFileSync(path.join(assets, "shot-run", "events.json"), "utf8"));
    var need = (cfg.runFrom != null ? cfg.runFrom : 0.8) + 6.9;
    if (ev.endedAt != null && ev.endedAt < need)
      throw new Error(slug + " (" + lang + "): the run's round ended at " + ev.endedAt + " s, before " + need.toFixed(1)
        + " s. Give promo.json another \"seed\" or \"level\", then --reshoot.");
  }
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
    .concat([path.join(assets, (a.as || a.role) + (a.opaque ? ".jpg" : ".png"))]));
});

/* The words, both languages: the composition picks one with the `lang`
   variable the render is given. A plain script and not a fetch, because a
   composition must not touch the network. */
if (generic) {
  fs.writeFileSync(path.join(assets, "promo.js"), "window.PROMO = " + JSON.stringify(genericData(), null, 2) + ";\n");
  /* The composition is the template's, every run; HyperFrames wants its
     project files beside it. */
  fs.copyFileSync(path.join(ROOT, "promo", "_template", "index.html"), path.join(dir, "index.html"));
  ["hyperframes.json", "package.json", "meta.json"].forEach(function (f) {
    var txt = fs.readFileSync(path.join(ROOT, "promo", "echomaze", f), "utf8")
      .replace(/promo-echomaze/g, "promo-" + slug).replace(/Echomaze promo/g, manifest.title + " promo");
    fs.writeFileSync(path.join(dir, f), txt);
  });
} else {
  fs.writeFileSync(path.join(assets, "copy.js"), "window.PROMO_COPY = " + JSON.stringify(cfg.copy, null, 2) + ";\n");
}

/* The words of a generic promo, read off the game: the five store lines
   (hook, two captions, the levels card, the payoff), the intro sentence for
   the end card, the band names. A promo.json `copy.<lang>` may override one
   of those keys, never needs to. */
function genericData() {
  var src = fs.readFileSync(path.join(ROOT, "games", slug, "game.js"), "utf8");
  var m = /\btagline:\s*("(?:[^"\\]|\\.)*")/.exec(src);
  var taglineEn = m ? JSON.parse(m[1]) : "";
  var bands = (manifest.web && manifest.web.levels && manifest.web.levels.bands) || {};
  var fonts = JSON.parse(fs.readFileSync(path.join(ROOT, "assets", "motor", "font", "fonts.json"), "utf8"));
  var face = fonts[(manifest.web && manifest.web.font) || ""] || { heavy: 800 };
  function bare(s) { return String(s || "").replace(/<b\b[^>]*>/g, "<b>"); }
  var copy = {};
  ["en", "fr"].forEach(function (lang) {
    var lines = ((manifest.store || {}).copy || {})[lang];
    lines = lines && lines.lines;
    if (!lines || lines.length < 5) throw new Error(slug + ": store.copy." + lang + " needs five lines");
    function L(i) { return { kicker: lines[i].kicker, line: bare(lines[i].line) }; }
    var tagline = lang === "en" ? taglineEn
      : (((manifest.web || {}).copy || {}).fr || {}).tagline || taglineEn;
    copy[lang] = Object.assign({
      hook: L(0), cap1: L(1), cap2: L(2), levels: L(3), payoff: L(4),
      tagline: bare(tagline),
      bands: (bands[lang] || []).slice(1, 5),
      cta: lang === "fr" ? "Joue gratuitement" : "Play free",
      url: "newrare.app"
    }, ((cfg.copy || {})[lang]) || {});
  });
  var theme = manifest.theme || {};
  return { copy: copy, theme: { accent: theme.accent || "#ffffff", accent2: theme.accent2 || theme.accent || "#ffffff" },
    font: { heavy: face.heavy } };
}

var font = manifest.web && manifest.web.font;
if (font) fs.copyFileSync(path.join(ROOT, "assets", "motor", "font", font + ".woff2"), path.join(assets, "font.woff2"));

var musicFile = path.join(ROOT, "assets", "audio", "music", cfg.music.file);
if (cfg.music.from == null) cfg.music.from = loudest(musicFile, cfg.music.length);
console.log("music: " + cfg.music.file + " from " + cfg.music.from + " s");
ffmpeg(["-ss", String(cfg.music.from), "-t", String(cfg.music.length),
  "-i", musicFile].concat(generic ? ["-af", "afade=t=in:d=0.25"] : []).concat([
  "-c:a", "libmp3lame", "-b:a", "192k", path.join(assets, "music.mp3")]));

/* Where the track is at its fullest for `length` seconds: the RMS of every
   half second, the window with the highest mean, started on a half second.
   A promo opens on the drop, not on an intro. */
function loudest(file, length) {
  var r = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af",
    "aresample=16000,asetnsamples=8000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level",
    "-f", "null", "-"], { encoding: "utf8" });
  var rms = [];
  (r.stderr + r.stdout).split("\n").forEach(function (l) {
    var mm = /RMS_level=(-?[0-9.]+|-inf)/.exec(l);
    if (mm) rms.push(mm[1] === "-inf" ? -120 : +mm[1]);
  });
  var n = Math.round(length * 2);
  if (rms.length <= n) return 0;
  var best = 0, bestV = -1e9;
  for (var i = 0; i + n <= rms.length; i++) {
    var v = 0;
    for (var j = i; j < i + n; j++) v += rms[j];
    if (v > bestV) { bestV = v; best = i; }
  }
  return best / 2;
}

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
      if (lay.skipUi && e.kind === "ui") return;            // the shell's voice, not the round's
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
