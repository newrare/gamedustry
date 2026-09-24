#!/usr/bin/env node
/* games/stratideck's CAST: 180 portraits — one per army, grade and tier, plus
 * every red officer again in the blue army's uniform — and the forty-five
 * sheets they are painted on.
 *
 * WHY SHEETS, AND WHY FOUR TO A SHEET
 * -----------------------------------
 * `web.army.cast` in the manifest names 120 officers (2 armies x 10 grades x
 * 6 tiers), and every one of them needs a face. One image-model prompt per
 * face is 120 prompts and 120 subtly different styles; six figures on one
 * image are each too small to carry a detail. Four is the compromise that
 * holds both: a 2x2 grid on a 1024x1536 portrait, 512x768 per figure.
 *
 * TWO LAYOUTS, because the two armies do not need the same thing.
 *
 *   BLUE   two GRADES down, two TIERS across — 5 grade pairs x 3 tier pairs
 *          = 15 sheets, `cast-blue-01` to `-15`.
 *   RED    ONE grade and two tiers, painted TWICE: the top row in the camp's
 *          own uniform, the bottom row the same two creatures after they
 *          turned, in the blue army's. 10 grades x 3 tier pairs = 30 sheets,
 *          `cast-red-01` to `-30`. The turncoat is drawn on the same image
 *          as the officer it was, directly under them, because that is the
 *          only way an image model draws the SAME face twice — a second
 *          prompt draws a cousin.
 *
 * Roles: `cast-blue-GG-t`, `cast-red-GG-t` and `cast-turn-GG-t` (the red
 * officer GG at tier t, in blue) → CONFIG.art.castBlue04C / castRed04C /
 * castTurn04C. The game draws the turncoat face on a prisoner who enlisted,
 * and falls back on the red one, then on the grade's face (game.js, castKey).
 *
 * THE PIPELINE, and it is the one every object sheet already takes:
 *
 *   node tools/lab/cast-sheets.mjs --prompts          # → prompt-image.md
 *      (the prompts of every sheet not painted yet, written from the
 *       manifest's own `desc` lines; --prompts --all for all forty-five)
 *   assets/image/master/stratideck-object-cast-<side>-NN.png   (one per prompt)
 *      │  node tools/lab/cast-sheets.mjs cast-red-07    (or --all)
 *      │    = cut-objects.mjs --grid 2x2, then the four roles written
 *      ▼
 *   games/stratideck/manifest.json  art.objects["cast-turn-03-c"] = "stratideck-cast-red-08-03"
 *      │  node tools/lab/encode-art.mjs stratideck
 *      ▼
 *   CONFIG.art.castTurn03C  →  the card's face (game.js, castKey)
 *
 * The role is WORKED OUT, never chosen: which cell of which sheet is which
 * officer is the layout below, so adopting takes no indices and cannot pick
 * the wrong ones. A sheet the model filled badly is re-prompted and re-run;
 * the roles do not move.
 *
 * Usage:
 *   node tools/lab/cast-sheets.mjs --prompts [--all] [--side red] [--out prompt-image.md]
 *   node tools/lab/cast-sheets.mjs --list
 *   node tools/lab/cast-sheets.mjs cast-red-04 [--solid 200 ...]   # extra flags go to cut-objects
 *   node tools/lab/cast-sheets.mjs --all
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var SLUG = "stratideck";
var MANIFEST = path.join(ROOT, "games", SLUG, "manifest.json");
var MASTER = path.join(ROOT, "assets", "image", "master");
var OBJECTS = path.join(ROOT, "assets", "image", "object");

var TIERS = ["E", "D", "C", "B", "A", "S"];
var SIDES = ["blue", "red"];

function pad(n) { return (n < 10 ? "0" : "") + n; }

/* THE LAYOUT. A cell is { g grade, t tier, as }, `as` being the face it
   paints: "blue", "red", or "turn" — a red officer in the blue uniform. The
   cells are in reading order, which is cut-objects' order under --grid 2x2.

   Blue sheet NN is grade pair `gp` and tier pair `tp`, grade-major, so a
   grade's three sheets sit together (01-03 the spy and the scout). Red sheet
   NN is grade `g` and tier pair `tp`: 01-03 the spy, 28-30 the marshal. */
function sheets() {
  var out = [], gp, tp, g, n, t0;
  for (gp = 0; gp < 5; gp++) {
    for (tp = 0; tp < 3; tp++) {
      n = gp * 3 + tp + 1; g = gp * 2 + 1; t0 = tp * 2;
      out.push({ side: "blue", n: n, name: "cast-blue-" + pad(n), cells: [
        { g: g, t: t0, as: "blue" }, { g: g, t: t0 + 1, as: "blue" },
        { g: g + 1, t: t0, as: "blue" }, { g: g + 1, t: t0 + 1, as: "blue" }] });
    }
  }
  for (g = 1; g <= 10; g++) {
    for (tp = 0; tp < 3; tp++) {
      n = (g - 1) * 3 + tp + 1; t0 = tp * 2;
      out.push({ side: "red", n: n, name: "cast-red-" + pad(n), cells: [
        { g: g, t: t0, as: "red" }, { g: g, t: t0 + 1, as: "red" },
        { g: g, t: t0, as: "turn" }, { g: g, t: t0 + 1, as: "turn" }] });
    }
  }
  return out;
}
function role(c) { return "cast-" + c.as + "-" + pad(c.g) + "-" + TIERS[c.t].toLowerCase(); }
function person(cast, c) { return cast[(c.as === "blue" ? "blue" : "red") + c.g + "." + c.t]; }

function readManifest() { return JSON.parse(fs.readFileSync(MANIFEST, "utf8")); }
function castIndex(m) {
  var map = {};
  ((m.web && m.web.army && m.web.army.cast) || []).forEach(function (c) { map[c.side + c.r + "." + c.t] = c; });
  return map;
}
function gradeNames(m) {
  var map = {};
  ((m.web && m.web.army && m.web.army.grades) || []).forEach(function (g) { map[g.r] = g.name; });
  return map;
}

/* ── the prompts ─────────────────────────────────────────────────────────── */

/* WHAT EVERY SHEET SHARES, written down once. It is read off the twenty grade
   faces the game already ships (assets/image/master/stratideck-card-*.png):
   chibi proportions, a heavy clean outline, cel shading with a painted
   highlight, and two uniforms that are the two armies' whole identity. */
var STYLE =
  "Chibi fantasy military character art for a mobile strategy card game. " +
  "Polished 2D game illustration: thick clean dark outlines, cel shading with soft painterly highlights, " +
  "big expressive eyes, oversized head (about one third of the body height), stocky cute proportions, " +
  "dynamic full-body action pose, rich saturated colours, shiny gold metal trims. " +
  "Same look as a high-end gacha game character card.";

var ARMY = {
  blue:
    "THE BLUE ARMY — human soldiers. Royal blue and gold uniforms inspired by 18th-century musketeers and " +
    "Napoleonic officers: blue tricorn hats with gold edging and white-and-blue feather plumes, blue capes and " +
    "tabards embroidered with a gold rampant lion, white shirts and cuffs, brown leather belts, gloves and tall boots, brass buttons.",
  red:
    "THE RED CAMP — fantasy creatures, not humans: grey-skinned imps and dark elves with long pointed ears, " +
    "glowing red eyes and small fangs. Crimson, black and gold armour with jagged spiky shapes and red diamond gems, " +
    "capes and tabards with a gold trident-arrow emblem, spiky crests and red feather plumes."
};

/* THE TURNCOAT'S UNIFORM: the blue army's cloth over the camp's body. Said
   in full, because an image model asked to "change the uniform" also changes
   the face, and the face is the whole point of the bottom row. */
var TURN =
  "THE BOTTOM ROW — THE SAME TWO CREATURES AFTER THEY DEFECTED to the blue army. Each bottom character is the exact " +
  "same individual as the one directly above it: same face, same grey skin, same pointed ears, same red eyes and fangs, " +
  "same hair, same body, same age, same signature item and a very similar pose. Only the clothes change: they now wear " +
  "the BLUE ARMY uniform — royal blue and gold, blue tricorn hat with gold edging and a white-and-blue feather plume, " +
  "blue cape or tabard with a gold rampant lion, white cuffs, brown leather belts and boots, brass buttons. " +
  "No red cloth and no red trident-arrow emblem on them any more; a small red gem may remain as a souvenir. " +
  "The richness of the blue uniform matches the tier of its column.";

var TIER_RULE =
  "The two columns are two rarity tiers of the same army, and the right column must look one clear step richer " +
  "than the left: E = raw recruit, cheap worn gear, clumsy; D = basic kit, a little more confident; " +
  "C = proper uniform and solid weapons; B = veteran, quality gear with gold trim; A = elite, ornate gold " +
  "filigree and gems; S = legendary, the most ornate gear of the game and a subtle magical glow around the signature item.";

/* What each grade carries, from the round's own rules (games/stratideck,
   OBJECTS): the prop IS the grade's job, so a portrait that forgot it would
   be a soldier with the wrong trade. */
var PROP = {
  1: "SPY — kills the enemy Marshal when it attacks: carries a dagger or a short blade (a sword is its symbol)",
  2: "SCOUT — reveals a hidden card without fighting: carries a spyglass or telescope (an eye is its symbol)",
  3: "SAPPER — defuses traps: carries a bomb, fuses, pliers or defusing tools (a bomb is its symbol)",
  4: "SERGEANT — destroys the straw man decoy, too blunt to be fooled by it: sword and shield, straw scraps around (crossed-out wheat is its symbol)",
  5: "LIEUTENANT — chops down the wooden barrier: carries an axe (an axe is its symbol)",
  6: "CAPTAIN — breaks the rock: carries a pickaxe (a pickaxe is its symbol)",
  7: "MAJOR — crosses the forest thanks to a perfect sense of direction: carries a compass, maps (a compass is its symbol)",
  8: "COLONEL — smashes the cursed skull, afraid of nothing: bare fists or gauntlets, a fist raised (a fist is its symbol)",
  9: "GENERAL — never betrays: carries a book locked with a padlock or chains (a padlocked book is its symbol)",
  10: "MARSHAL — the highest rank, no specialty: wears a crown and carries a baton or sceptre (a crown is its symbol)"
};

var LAYOUT =
  "COMPOSITION: one portrait image, 1024 x 1536, divided into an invisible 2 x 2 grid of four equal cells " +
  "(two columns, two rows). Exactly ONE character per cell, centred in it, seen in full from head to toe, " +
  "about 85% of the cell height. Every character, weapon, effect and plume stays entirely inside its own cell " +
  "with a clear empty gap of at least 40 px to the cell borders and to the image edges: nothing may touch, " +
  "overlap or cross into a neighbouring cell. All four drawn at the same scale, in the same style and lighting. " +
  "No card frame, no border, no grid lines, no text, no letters, no numbers, no logo, no watermark, " +
  "no floor, no ground shadow, no background scenery. Small props held by a character or lying at its feet are fine.";

var ALPHA =
  "OUTPUT — MANDATORY: deliver a PNG file with a REAL TRANSPARENT BACKGROUND (alpha channel). " +
  "Every pixel around and between the four characters must be fully transparent (alpha = 0). " +
  "Do NOT paint a white, grey, black or coloured background, and do NOT paint a checkerboard pattern " +
  "to imitate transparency: the checkerboard must not be in the pixels. Only the four characters are opaque. " +
  "The file must be a PNG with alpha transparency — any other format or a solid background is unusable.";

function promptFor(sheet, cast, names) {
  var where = ["TOP-LEFT cell", "TOP-RIGHT cell", "BOTTOM-LEFT cell", "BOTTOM-RIGHT cell"];
  var lines = sheet.cells.map(function (c, i) {
    var p = person(cast, c);
    if (!p) throw new Error("no cast entry for " + c.as + " grade " + c.g + " tier " + TIERS[c.t]);
    var who = p.gender === "woman" || p.gender === "female" ? "female" : "male";
    if (c.as === "turn") {
      /* NOT the desc again: it names the red cloth ("an oversized red
         hood"), and repeating it under "now in blue" is a contradiction the
         model resolves by keeping the red. */
      return "- " + where[i] + " — the SAME " + names[c.g] + " as in the " + where[i - 2] + ", tier " + TIERS[c.t] +
        " (" + who + ", about " + p.age + " years old): identical face, hair, body, age and item, a similar pose, " +
        "now wearing the blue army's uniform at tier " + TIERS[c.t] + " richness; every piece of clothing that is red " +
        "above (hood, scarf, cape, coat, hat, gown) is royal blue and gold here.";
    }
    return "- " + where[i] + " — " + names[c.g] + ", tier " + TIERS[c.t] + " (" + who + ", about " + p.age +
      " years old): " + p.desc + ".";
  });
  var props = [];
  sheet.cells.forEach(function (c) { if (props.indexOf(PROP[c.g]) < 0) props.push(PROP[c.g]); });
  var rows = sheet.side === "blue"
    ? ["ROWS — the top row is one grade, the bottom row the next one up. What each grade carries:",
       props.map(function (x) { return "- " + x; }).join("\n")]
    : ["ROWS — all four are the same grade. What this grade carries:",
       props.map(function (x) { return "- " + x; }).join("\n"),
       "",
       "THE TOP ROW is two officers of the red camp, in the red camp's uniform.",
       "",
       TURN];
  return [
    STYLE,
    "",
    ARMY[sheet.side]
  ].concat(sheet.side === "red" ? ["", ARMY.blue] : []).concat([
    ""
  ]).concat(rows).concat([
    "",
    TIER_RULE + " Here the LEFT column is tier " + TIERS[sheet.cells[0].t] + " and the RIGHT column is tier " +
      TIERS[sheet.cells[1].t] + ".",
    "",
    "THE FOUR CHARACTERS:",
    lines.join("\n"),
    "",
    LAYOUT,
    "",
    ALPHA
  ]).join("\n");
}

function label(c, names) {
  return names[c.g] + " " + TIERS[c.t] + (c.as === "turn" ? " (turncoat, blue)" : c.as === "red" ? " (red)" : "");
}

/* THE FILE IS WHAT IS LEFT TO PAINT: a sheet whose master is on disk has
   been done, and a prompt already used is one more to scroll past. --all
   writes the forty-five anyway. */
function writePrompts(out, every, side) {
  var m = readManifest(), cast = castIndex(m), names = gradeNames(m);
  var todo = sheets().filter(function (s) {
    return (!side || s.side === side) && (every || !fs.existsSync(sheetFile(s)));
  });
  var md = [
    "# Stratideck — the cast, sheet by sheet",
    "",
    "Temporary file: one prompt per sheet, to paste into the image model. Save each result under the",
    "name given in its heading, in `assets/image/master/`, then run",
    "`node tools/lab/cast-sheets.mjs <name>` and `node tools/lab/encode-art.mjs stratideck`.",
    "",
    "Blue sheets: 2 x 2, the rows are two grades, the columns two tiers (left = lower).",
    "Red sheets: 2 x 2, one grade; the columns are two tiers, the top row the red officers,",
    "the bottom row the same two creatures in the blue army's uniform (the turncoats).",
    "",
    todo.length + " sheet" + (todo.length === 1 ? "" : "s") + (every ? "" : " left to paint") + ". " +
      "Generated from `web.army.cast` in `games/stratideck/manifest.json` by `tools/lab/cast-sheets.mjs --prompts`.",
    ""
  ];
  todo.forEach(function (s, i) {
    md.push("## " + (i + 1) + " / " + todo.length + " — `" + SLUG + "-object-" + s.name + ".png`");
    md.push("");
    md.push(s.side + " — " + s.cells.map(function (c) { return label(c, names); }).join(", "));
    md.push("");
    md.push("```text");
    md.push(promptFor(s, cast, names));
    md.push("```");
    md.push("");
  });
  fs.writeFileSync(out, md.join("\n"));
  console.log("wrote " + path.relative(ROOT, out) + " (" + todo.length + " prompts)");
}

/* ── cutting and adopting ────────────────────────────────────────────────── */

function sheetFile(s) { return path.join(MASTER, SLUG + "-object-" + s.name + ".png"); }
function cutFile(s, k) { return path.join(OBJECTS, SLUG + "-" + s.name + "-" + pad(k) + ".png"); }

function list() {
  var m = readManifest(), objs = (m.art && m.art.objects) || {}, total = 0;
  sheets().forEach(function (s) {
    var has = fs.existsSync(sheetFile(s));
    var adopted = s.cells.filter(function (c) { return objs[role(c)]; }).length;
    total += adopted;
    console.log("  " + (has ? "●" : "·") + " " + s.name + "  " + adopted + "/4 adopted  " +
      s.cells.map(role).join(" "));
  });
  console.log("  " + total + " / 180 portraits adopted");
}

/* The cut is cut-objects' own, with the grid that makes the cell the
   identity; the adoption is written here, because the role of each cell is
   the layout's and not an index a hand types. */
function adopt(s, extra) {
  if (!fs.existsSync(sheetFile(s))) {
    console.error("missing " + path.relative(ROOT, sheetFile(s)));
    return false;
  }
  var args = [path.join(ROOT, "tools", "lab", "cut-objects.mjs"), SLUG + "-object-" + s.name, "--grid", "2x2"].concat(extra);
  var r = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (r.status !== 0) { console.error("cut-objects failed on " + s.name); return false; }
  for (var k = 1; k <= 4; k++) {
    if (!fs.existsSync(cutFile(s, k))) {
      console.error(s.name + ": cell " + k + " came out empty — re-prompt or re-cut (--solid, --step)");
      return false;
    }
  }
  var m = readManifest();
  m.art = m.art || {};
  m.art.objects = m.art.objects || {};
  s.cells.forEach(function (c, i) { m.art.objects[role(c)] = SLUG + "-" + s.name + "-" + pad(i + 1); });
  var sorted = {};
  Object.keys(m.art.objects).sort().forEach(function (k) { sorted[k] = m.art.objects[k]; });
  m.art.objects = sorted;
  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + "\n");
  console.log("adopted " + s.name + ": " + s.cells.map(role).join(", "));
  return true;
}

// --- CLI -----------------------------------------------------------------
var argv = process.argv.slice(2);
if (argv[0] === "--prompts") {
  var o = argv.indexOf("--out");
  var sd = argv.indexOf("--side");
  writePrompts(o >= 0 ? path.resolve(argv[o + 1]) : path.join(ROOT, "prompt-image.md"),
               argv.indexOf("--all") >= 0, sd >= 0 ? argv[sd + 1] : null);
} else if (argv[0] === "--list" || !argv.length) {
  list();
} else {
  var all = sheets(), picked, extra = [];
  if (argv[0] === "--all") {
    picked = all.filter(function (s) { return fs.existsSync(sheetFile(s)); });
    extra = argv.slice(1);
  } else {
    picked = all.filter(function (s) { return s.name === argv[0] || SLUG + "-object-" + s.name === argv[0]; });
    extra = argv.slice(1);
    if (!picked.length) { console.error("no sheet called " + argv[0] + " — see --list"); process.exit(1); }
  }
  var ok = picked.map(function (s) { return adopt(s, extra); }).every(Boolean);
  if (picked.length) console.log("next: node tools/lab/encode-art.mjs " + SLUG + " && node tools/update.mjs");
  process.exit(ok ? 0 : 1);
}
