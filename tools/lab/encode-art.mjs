#!/usr/bin/env node
/* Re-encode the painted artwork into assets/image/embed/ — out of
 * assets/image/master/ for what a game owns, and out of assets/image/object/
 * for the objects its manifest declares under `art.objects`.
 *
 * WHY THIS EXISTS
 * ---------------
 * `assets/image/master/` holds the artwork as it came out of the image model:
 * PNG (or JPEG, for a panorama that came out of an editor), up to 2172px wide,
 * ~2 MB apiece, 121 MB for the thirteen games. None of it can ship. A playable is ONE self-contained HTML file with a 5 MB ceiling and
 * a < 2 MB target, and the games sit at ~1 MB today — a single raw character
 * would double one.
 *
 * So `assets/image/master/` is the master, never shipped, and this tool writes the
 * shipping cut next to it in `assets/image/embed/`: WebP, sized for the 720x1280
 * design space, alpha intact. The measured result is ~35 KB per asset, ~270 KB
 * of base64 for a whole game — which is what makes "every game gets painted
 * screens" fit inside the budget at all.
 *
 * WHY IT IS A SEPARATE STEP, AND WHY assets/image/embed/ IS COMMITTED
 * -----------------------------------------------------------
 * Encoding needs headless Chrome (see below), which costs a second or two per
 * image — 80 images is a minute and a half. `tools/update.mjs` runs on every
 * change and must stay fast, so the build never encodes: it reads the WebP that
 * is already there. `assets/image/embed/` is therefore committed, exactly like
 * `assets/motor/font/` and `assets/audio/sfx/` are: a shipping-ready input the build
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
 * TWO SOURCES, AND WHY
 * --------------------
 * The six pieces a game OWNS are named in `assets/image/master/`, and a file
 * name is the whole declaration there: `<slug>-<role>.png` becomes
 * `CONFIG.art.<camelRole>`, injected by tools/build/build.mjs. There is one
 * background, one title, three faces, and no question about which of them
 * ships.
 *
 * The objects a game CUT OUT of a sheet cannot work that way, and they are
 * declared instead in `art.objects` of `games/<slug>/manifest.json`, pointing
 * at a file of `assets/image/object/` (see `objects()` below). Same roles, same
 * `CONFIG.art.<camelRole>`, same WebP next door — only the place the choice is
 * written moves, because a folder full of cuts cannot hold one.
 *
 * THE ROLES, AND WHERE EACH ONE IS USED
 * -------------------------------------
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
 *   decor-NN           the decor pool: small painted objects the shell
 *                      scatters over the end screen, the round's corners and
 *                      the web menu's panels. They come out of a sheet with
 *                      `cut-objects.mjs --adopt 1,4 --as decor`, which writes
 *                      the role into the manifest, and no game names one —
 *                      see packages/shell/shell.js, Decor
 *
 *   sky                a painted panorama a GAME draws on the CANVAS behind
 *                      its round, out of ArtImages — games/arcider stands its
 *                      city on the horizon line and slides it with the lean.
 *                      Cut much wider than the frame: that surplus IS the
 *                      parallax's room to move.
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
 * ONE NAME IS NOT A ROLE: `<slug>-object-<name>.png` is a SHEET — sixteen
 * gears on one canvas, as the image model returns them — and it is material to
 * cut, not artwork to ship. Encoding it would put 2 MB of wall into every
 * build of that game to draw one gear out of it. It is skipped here and taken
 * apart by `tools/lab/cut-objects.mjs`, whose cuts come back through this tool
 * by way of the manifest.
 *
 * Usage:
 *   node tools/lab/encode-art.mjs                 # every game, skipping fresh
 *   node tools/lab/encode-art.mjs vipera slipdeck # named games only
 *   node tools/lab/encode-art.mjs --force         # re-encode everything
 *   node tools/lab/encode-art.mjs --list          # what would run, and why
 */

import { spawn } from "node:child_process";
import { reap, sweep, reportSweep } from "./chrome.mjs";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var SRC_DIR = path.join(ROOT, "assets", "image", "master");
var OBJ_DIR = path.join(ROOT, "assets", "image", "object");
var OUT_DIR = path.join(ROOT, "assets", "image", "embed");
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

  /* THE VILLAGE'S GROUND: the painted hub the web menu stands the houses on
     (packages/webshell, the title view). Same box as the intro backdrop for
     the same reason — it fills the 720x1280 frame and nothing past it is ever
     shown — and the same quality, because it is soft painted art with the
     houses, the halos and the type reading over it rather than in it. */
  "background-home": { w: 720, h: 1280, q: 0.72 },
  "background-desk": { w: 1600, h: 900, q: 0.70 },
  "title": { w: 640, h: 280, q: 0.86 },
  "character-sad": { w: 460, h: 560, q: 0.80 },
  "character-neutral": { w: 460, h: 560, q: 0.80 },
  "character-happy": { w: 460, h: 560, q: 0.80 },

  /* A PANORAMA, and the one cut that is deliberately wider than the frame:
     `sky` is the painted horizon a game draws on the CANVAS behind its round
     (games/arcider), and the parallax slides it sideways under a 720px window.
     A cut only 720 wide would run out of picture on the first bend. */
  "sky": { w: 1440, h: 760, q: 0.78 }
};

/* The court-card illustrations. These are the one piece of artwork a game
   draws on the CANVAS rather than handing to the DOM, and the canvas is sized
   in device pixels: slipdeck's big card is 357 design px wide and its inner
   panel 214, which on a 3x phone is 642 real pixels. Anything smaller than
   that is visibly soft on the one card the player is staring at, so these keep
   close to their master's 650px. */
var CARDS = { w: 560, h: 700, q: 0.84 };

/* ...AND IT IS NOT ONE BOX, BECAUSE "A CARD" IS NOT ONE SIZE. The rule above
   is slipdeck's, whose one big card is 357 design px wide and is what the
   player stares at. games/stratideck draws TWENTY of them — an officer per
   grade, per side — at 118 design px in the hand and never wider on the grid,
   which is 355 device pixels on a 3x phone. The slipdeck box is three times
   that, and twenty pictures at three times the size they are shown at is 2.3 MB
   of base64 in a creative with a 5 MB ceiling.

   Keyed by slug, because nothing about the ROLE can say it: `card-red-major`
   and `card-king` are the same name for a prop drawn at a third of the size. */
var CARD_BY_SLUG = {
  stratideck: { w: 380, h: 470, q: 0.82 }
};

/* The DECOR POOL: `<slug>-decor-NN.png`, adopted out of a sheet with
   `cut-objects.mjs --adopt 1,4 --as decor`. These are the small objects the
   shell scatters over the end screen, the round's corners and the web menu's
   panels (packages/shell/shell.js, Decor) — a game names none of them, so
   four or five of them ride in EVERY build of that game and the size is what
   keeps that affordable. They are shown between 120 and 220 design px and
   never carry a detail the player reads, so 360px is already generous. */
var DECOR = { w: 360, h: 360, q: 0.78 };

/* THE BEAD STYLES: `<slug>-ball-<colour>-NN.png`, adopted out of the six
   recoloured sheets with `cut-objects.mjs --grid 5x4 --adopt … --as ball-red`.
   These are the only cuts a game draws at a size it can state exactly, which
   is why this is the smallest box of the set and not a guess: games/radiam's
   biggest bead is the outer plate's, `0.125 * 330` design px of radius — 83 px
   across — so 256 covers it at a 3x device ratio with nothing spare.
   The size is also the budget. A game carries fifteen styles in six colours,
   ninety files in one build, so every kilobyte here is paid ninety times. */
var BALL = { w: 256, h: 256, q: 0.84 };

/* THE STICKER ALBUM: `<slug>-stickerNN.png`, adopted out of one 5x4 sheet with
   `cut-objects.mjs --grid 5x4`. Twenty per game, and they are WEB-ONLY art
   (tools/build/build.mjs) — a playable has no collection to fill. The album
   shows them at 128 design px in its grid and at 300 on the reveal a draw
   ends on, so 400 covers the grid at a 3x device ratio and the reveal at a
   little under 1.5x, which is where painted art stops paying for itself.
   Twenty files ride in every web build of the game, so the box is the budget
   here exactly as it is for the beads. */
var STICKER = { w: 400, h: 400, q: 0.82 };

/* THE VILLAGE'S HOUSES: `<slug>-homeNN.png`, adopted out of one
   `<slug>-object-home.png` sheet with `cut-objects.mjs --grid 3x2`. They are
   WEB-ONLY art (tools/build/build.mjs) like the stickers — a playable has one
   round and no menu to stand a village on.

   The box is the one measurement that matters here: a house is dropped on the
   720x1280 frame at between 150 and 280 design px wide, so 420 covers the
   biggest of them at a 3x device ratio with nothing spare. Six ride in every
   web build of the game, which is what keeps this under a sticker sheet. */
var HOUSE = { w: 420, h: 420, q: 0.84 };

/* THE SKY OVER THE VILLAGE: `cloud-<style>-NN`, adopted out of the SHARED
   sheets `assets/image/master/game-object-cloud-{big,flat,haze}.png` — the one
   material in this pipeline that belongs to no game and is still named by one
   (see SHELL_CUTS below for the other half of that story, the pieces the shell
   names itself). A cloud is scenery: it is dropped on the village like a house,
   it takes the `decor` door, and the z-sort by the foot of the object puts a
   cloud placed high behind every building.

   The box is WIDE and short because the material is: a haze cloud is 1060x190,
   five and a half to one, and the generic 320x400 portrait box would fit it to
   320 px across — a quarter of the width it is drawn at. It is placed between
   150 and 400 design px wide, so 600 covers the biggest of them at the same
   ~1.5x the houses and the stickers are cut at, and soft painted vapour with
   nothing to read in it takes the decor pool's quality rather than a house's. */
var CLOUD = { w: 600, h: 320, q: 0.78 };

/* THE CAST: games/stratideck's officers, one portrait per army, grade and
   tier — `cast-<blue|red|turn>-NN-<tier>`, cut four to a sheet and adopted by
   tools/lab/cast-sheets.mjs. WEB-ONLY art (tools/build/build.mjs), loaded
   lazily (`CONFIG.artLazy`). The box is the CUT, not a display size: the
   barracks opens a card at 540 design px wide, whose officer stands ~720
   design px tall — well over a thousand device pixels on a phone — and the
   cut out of a 1024x1536 sheet is ~810 px tall to begin with. At the old
   320x380 box every big card was a 2x upscale of a thumbnail, which is the
   blur the lab showed on the whole cast. So nothing is thrown away; the
   quality is what keeps a hundred and eighty of them affordable. */
var CAST = { w: 600, h: 830, q: 0.8 };

/* Everything else. Nothing uses it today; it is the floor for a role added
   later, small enough that forgetting to give it a profile is cheap. */
var GENERIC = { w: 320, h: 400, q: 0.86 };

/* A master is whatever an image tool wrote: the model returns PNG, but a
   panorama exported out of an editor arrives as a JPEG and there is no reason
   to round-trip it through PNG just to be re-encoded here. The extension is
   stripped off the stem so the role is read the same either way. */
var MASTER_RE = /\.(png|jpe?g)$/i;

function mimeOf(file) {
  return /\.png$/i.test(file) ? "image/png" : "image/jpeg";
}

function profileFor(role, slug) {
  if (PROFILE[role]) return PROFILE[role];
  if (role.indexOf("card-") === 0) return CARD_BY_SLUG[slug] || CARDS;
  if (role.indexOf("decor") === 0) return DECOR;
  if (role.indexOf("ball-") === 0) return BALL;
  if (role.indexOf("sticker") === 0) return STICKER;
  if (/^home\d+$/.test(role)) return HOUSE;
  if (role.indexOf("cloud-") === 0) return CLOUD;
  if (/^cast-(blue|red|turn)-\d\d-[a-z]$/.test(role)) return CAST;
  /* `sky-day`, `sky-night`, ... — a game with several horizons keeps one cut
     per biome and picks between them at runtime (games/arcider). They are the
     same panorama as `sky` and must not fall to the generic 320px box, which
     would squash a 3:1 picture into a portrait thumbnail. */
  if (role.indexOf("sky") === 0) return PROFILE.sky;
  /* `background-phone-blue`, `background-phone-green`, ... — the same thing
     one role up: a game whose SCENE changes per biome keeps one painting per
     band (games/echomaze, five of them over the thirty levels). A variant is
     shown exactly where the plain role is, so it is cut exactly like it. */
  if (role.indexOf("background-phone") === 0) return PROFILE["background-phone"];
  if (role.indexOf("background-desk") === 0) return PROFILE["background-desk"];
  /* `enemy-sad`, `enemy-neutral`, `enemy-happy` — the other side's face, a
     character like the end screen's and cut like one: games/stratideck stands
     its commander 260 design px wide over the camp, and the generic 320px box
     was a blur at that size on a 3x phone. */
  if (role.indexOf("enemy-") === 0) return PROFILE["character-neutral"];
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

/* Every master under assets/image/master/, split into the game it belongs to and the
   role it plays. The slug is matched against games/ rather than parsed off the
   first dash, because a slug never contains one but a role always does
   ("background-phone"), and guessing would break the day a game is called
   `foo-bar`. */
function knownSlugs() {
  return fs.readdirSync(GAMES_DIR).filter(function (d) {
    return fs.existsSync(path.join(GAMES_DIR, d, "manifest.json"));
  }).sort();
}

/* THE OBJECTS A GAME SHIPS, out of `art.objects` in its manifest.

   A picture in assets/image/master/ declares itself by its name, and that is
   right for the six pieces a game owns outright — there is one background, one
   title, three faces, and no question about which of them ships. A CUT cannot
   work that way. `assets/image/object/` holds every object every sheet was
   taken apart into, and `radiam-ball-blue-01.png` is one of the sixteen beads
   that ship while `radiam-ball-blue-09.png`, next to it, is one of the four
   that were passed over: the two names are the same shape, so no rule over
   names can tell them apart. Nor should the folder: a cut is material, and
   which material a game uses is the game's own business.

   So the game says it, in its manifest:

     "art": { "objects": { "ship01": "arcider-ship-01" } }

   The key is the ROLE — `CONFIG.art.ship01`, `assets/image/embed/<slug>-ship01.webp`,
   exactly as a master's name would have been — and the value is the file in
   `assets/image/object/`, without its extension. `cut-objects.mjs --adopt`
   writes those lines; nothing here is typed by hand. */
function objects(all) {
  var out = [];
  all.forEach(function (slug) {
    var manifest;
    try { manifest = JSON.parse(fs.readFileSync(path.join(GAMES_DIR, slug, "manifest.json"), "utf8")); }
    catch (e) { return; }
    var decl = (manifest.art && manifest.art.objects) || {};
    Object.keys(decl).sort().forEach(function (role) {
      var stem = decl[role];
      var src = null, file = null;
      [".png", ".jpg", ".jpeg"].forEach(function (ext) {
        if (src) return;
        if (fs.existsSync(path.join(OBJ_DIR, stem + ext))) { file = stem + ext; src = path.join(OBJ_DIR, file); }
      });
      if (!src) {
        console.log("?     " + slug + " art.objects." + role + " → assets/image/object/" + stem +
                    " — no such cut, left alone");
        return;
      }
      out.push({
        file: file, slug: slug, role: role, mime: mimeOf(file),
        src: src,
        out: path.join(OUT_DIR, slug + "-" + role + ".webp"),
        profile: profileFor(role, slug),
        known: knownRole(role)
      });
    });
  });
  return out;
}

function knownRole(role) {
  return !!PROFILE[role] || role.indexOf("card-") === 0 ||
         role.indexOf("decor") === 0 || role.indexOf("sky") === 0 ||
         role.indexOf("ball-") === 0 || role.indexOf("sticker") === 0 ||
         role.indexOf("background-") === 0 || /^home\d+$/.test(role) ||
         role.indexOf("cloud-") === 0 || /^cast-(blue|red|turn)-\d\d-[a-z]$/.test(role);
}

function masters(all) {
  var out = [];
  fs.readdirSync(SRC_DIR).filter(function (f) {
    return MASTER_RE.test(f);
  }).sort().forEach(function (file) {
    var stem = file.replace(MASTER_RE, "");
    var slug = null;
    for (var i = 0; i < all.length; i++) {
      if (stem === all[i] || stem.indexOf(all[i] + "-") === 0) { slug = all[i]; break; }
    }
    /* `game-object-*.png` is the SHELL's own sheet, not a game's: cut by
       cut-objects.mjs and named by shellJobs() below, so it is neither a
       master to encode nor a mistake to report. */
    if (!slug && stem.indexOf("game-") === 0) return;
    if (!slug) { console.log("?     " + file + " — no game of that name, left alone"); return; }
    var role = stem.slice(slug.length + 1);
    if (!role) { console.log("?     " + file + " — no role in the name, left alone"); return; }
    if (role.indexOf("object-") === 0) {
      console.log("sheet " + file + " — cut it with tools/lab/cut-objects.mjs, not shipped");
      return;
    }
    out.push({
      file: file, slug: slug, role: role, mime: mimeOf(file),
      src: path.join(SRC_DIR, file),
      out: path.join(OUT_DIR, slug + "-" + role + ".webp"),
      profile: profileFor(role, slug),
      known: knownRole(role)
    });
  });
  return out;
}

/* THE STUDIO MARK — the one cut in this tool that belongs to no game.
   `site/image/logo.png` is the newrare logo the site already ships, and every
   game now signs its title screen with it (packages/shell/shell.js, Brand). It
   needs exactly the treatment the artwork gets — WebP, small, alpha intact —
   so it rides the same rig, and it lands in `assets/image/brand/` rather than
   `assets/image/embed/`, which is keyed by slug and read by the builder per game.

   128px for a mark shown at 40 design px: it is drawn at 3x on a phone, and
   the master is a painted glow ring that goes to mush below that. */
var BRAND_SRC = path.join(ROOT, "site", "image", "logo.png");
var BRAND_OUT = path.join(ROOT, "assets", "image", "brand", "newrare.webp");

function brandJob() {
  if (!fs.existsSync(BRAND_SRC)) return [];
  return [{
    file: "logo.png", slug: "newrare", role: "mark",
    src: BRAND_SRC, out: BRAND_OUT,
    profile: { w: 112, h: 112, q: 0.74 }, known: true
  }];
}

/* THE SHELL'S OWN ARTWORK — the second set of cuts in this tool that belongs
   to no game, and it arrives the same way the games' objects do: a sheet in
   assets/image/master/ under the pseudo-slug `game`, taken apart by
   tools/lab/cut-objects.mjs into assets/image/object/.

   `game-object-gift-close.png` and `game-object-gift-open.png` are one wall of
   three boxes each — red, blue, green — cut on a 3x1 grid so the CELL is the
   identity: box 2 is the same blue box closed and open, which is the whole
   point of a pair of sheets. The web shell's daily strip and its three-box
   gift draw them for EVERY game that declares `web.meta`, so they cannot live
   under a slug and they cannot be adopted by a manifest: the shell names them
   here, once, exactly as a game names its own in `art.objects`.

   They land in assets/image/shell/ rather than assets/image/embed/, which is
   keyed by slug and read by the builder per game — same reason the studio mark
   lands in assets/image/brand/.

   360px for a box shown at 150 design px in the picker and 44 in the strip: it
   is drawn at 3x on a phone, and the picker's box is the one the player is
   watching open.

   `game-object-reward.png`, `game-object-trophy.png` and
   `game-object-ticket.png` are the sheets after them, and they are the shell's
   INSTRUMENTS rather than its ceremony: the coin a wallet counts, the ticket
   it spends on a pull, the bolt an xp bar fills with, the star a level is
   cleared with, the trophy a finished board earns. Those were stroked
   pictograms out of assets/motor/lucide/ and they read as a tool's chrome; the
   web shell is a game, and a game's currency is painted.

   A CUT IS RENAMED HERE, and that rename is the declaration. `reward-08` says
   nothing, `coin` is what the shell draws — and the role is deliberately the
   NAME menu.js already calls its pictogram by (`coin`, `ticket`, `xp`,
   `star`), so `icon("coin")` finds the painted piece with no table in between
   and falls back to the stroke in a build that carries no artwork. The extra
   roles (`coinPile`, `starBurst`, `trophy`) are the ones a screen asks for by
   name, where a bag of coins says "an amount" and one coin says "a coin".

   Picking is the same discipline as a game's `art.objects`: every file here is
   base64 in every web build of every game with a wallet, so the twenty-four
   rewards and the ten trophies are cut and only these are shipped. */
var SHELL_DIR = path.join(ROOT, "assets", "image", "shell");
/* EXPORTED, because the composer has to tell the shell's own sheets from the
   SHARED material beside them: `assets/image/object/` holds both, under the
   same `game-` prefix, and only the second kind may be adopted by a game
   (tools/lab/serve-village.mjs). The sheet a cut came out of is what separates
   them, and this list is where that is already written down. */
export var SHELL_CUTS = [
  "game-gift-close-01", "game-gift-close-02", "game-gift-close-03",
  "game-gift-open-01", "game-gift-open-02", "game-gift-open-03",

  /* the instruments — `<cut>: <role>`, the role being what the shell calls it */
  { cut: "game-reward-01", role: "star" },       // the level star, everywhere
  { cut: "game-reward-03", role: "star-burst" }, // the starred day, the endless node
  { cut: "game-reward-08", role: "coin" },       // money
  /* the BLUE ticket of twelve, and the colour is the whole choice: it sits
     next to the coin in every wallet, and a gold ticket beside a gold coin is
     one number read twice. It is the one piece here whose tint no longer
     follows the game's accent, which is what being painted costs. */
  { cut: "game-ticket-02", role: "ticket" },    // a pull at the machine
  /* THE SUPER TICKET — the rainbow one of the twelve, and it is the brightest
     on the sheet on purpose: it is fifteen times the price of the blue one
     beside it, and the two have to be told apart across a shop card, a bet
     pill and a draw button. A colour is what does that; a size cannot. */
  { cut: "game-ticket-08", role: "ticket-super" },
  { cut: "game-reward-18", role: "coin-pile" },  // an AMOUNT of money
  { cut: "game-reward-24", role: "xp" },         // the bolt the xp bar fills with
  { cut: "game-trophy-03", role: "trophy" },     // ninety of ninety
  /* THE COLLECTION, and it is the four-leaf clover of the twenty on
     `game-object-sticker.png` — the one piece on that sheet that says
     "a thing worth collecting" without being a star, a coin, a trophy or a
     ticket, all four of which are already a chip of their own on the same
     band. The sheet is otherwise the shell's sticker vocabulary; this cut is
     the only one of it the shell draws. */
  { cut: "game-sticker-15", role: "sticker" },   // the collection's count

  /* THE MULTIPLIER, and the shell states exactly one: the seventh day of the
     daily road pays five times over (`STAR` in packages/webshell/daily.js).
     The sheet holds x2, x10, x20, x50 and x100 beside it and they are cut and
     waiting — a line here is all any of them costs — but a badge nothing
     draws is base64 in every build of every game with a wallet, which is the
     rule this whole list exists for.

     It gets a box of its own: the others are chips of 26 to 110 design px and
     this one is a plate across a modal's header, so 360 would be upscaled
     where they are downscaled. */
  { cut: "game-multiplicator-02", role: "mult-5", w: 480, h: 480 },

  /* THE HAND the Help card acts the gesture out with — the pointing index of
     the twenty-four on `game-object-hand.png`, cuff down and fingertip up,
     which is the pose of the motor's stroked finger (assets/motor/svg/finger.svg)
     and therefore drops into every SKIN's `.demo-hand` choreography unchanged.
     A playable keeps the stroked one: it has no shellArt to paint it with. */
  { cut: "game-hand-01", role: "hand" }
];

function shellJobs() {
  return SHELL_CUTS.map(function (entry) {
    var stem = typeof entry === "string" ? entry : entry.cut;
    var role = typeof entry === "string" ? stem.replace(/^game-/, "") : entry.role;
    var src = path.join(OBJ_DIR, stem + ".png");
    if (!fs.existsSync(src)) {
      console.log("?     shell " + stem + " — no such cut in assets/image/object/, left alone");
      return null;
    }
    return {
      file: stem + ".png", slug: "shell", role: role,
      mime: "image/png", src: src,
      out: path.join(SHELL_DIR, role + ".webp"),
      profile: { w: entry.w || 360, h: entry.h || 360, q: 0.82 }, known: true
    };
  }).filter(Boolean);
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
function encodeJs(b64, box, mime) {
  return "(async () => {" +
    'const img = new Image();' +
    'img.src = "data:' + mime + ';base64,' + b64 + '";' +
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
    expression: encodeJs(b64, job.profile, job.mime || "image/png"),
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
  if (!fs.existsSync(SRC_DIR)) throw new Error("no assets/image/master/ to read");
  fs.mkdirSync(OUT_DIR, { recursive: true });

  var all = knownSlugs();
  var jobs = masters(all).concat(objects(all)).concat(brandJob()).concat(shellJobs());
  fs.mkdirSync(path.dirname(BRAND_OUT), { recursive: true });
  fs.mkdirSync(SHELL_DIR, { recursive: true });
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

  reportSweep(sweep("encode-art-"));
  var profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "encode-art-"));
  var chrome = await launchChrome(profileDir);
  /* The deadline is per job, not per run: encoding the whole of assets/image/
     is hundreds of images at ~1 s apiece and must not trip a watchdog that was
     sized for one game. 20 s an image is a hang, at any batch size. */
  var kill = reap(chrome.child, {
    label: "encode-art",
    deadlineMs: Math.max(10 * 60 * 1000, todo.length * 20 * 1000)
  });
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
    kill();
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

  console.log("\n" + count + " encoded, " + (total / 1024).toFixed(0) + " KB into assets/image/embed/" +
              (fresh ? ", " + fresh + " left alone" : ""));
  console.log("Now run:  node tools/update.mjs");
}

/* Run only when this file IS the command. It is also imported — for
   SHELL_CUTS alone — by tools/lab/serve-village.mjs, the same way
   apply-events.mjs is imported for `bumpPatch`. */
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(function (err) {
    console.error("encode-art failed: " + err.message);
    process.exit(1);
  });
}
