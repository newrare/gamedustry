#!/usr/bin/env node
/* Shoot gameplay screenshots for every game into assets/image/screen/.
 *
 * The shots come off the **web** build, not the playable: a playable carries
 * the install CTA bar, which is wrong everywhere these images are used (the
 * site cards, the itch pages, a store listing later). The web build is the
 * frame a player actually sees.
 *
 * A build is one self-contained HTML file with the game wrapped in an IIFE, so
 * nothing is reachable from the outside. This tool copies each game to a
 * temporary directory with three injections:
 *
 *   1. a seeded LCG over Math.random, so a run is reproducible,
 *   2. a `window.__H` handle on the motor internals (startGame, Loop,
 *      frameUpdate/frameRender, Input, Layout, Pop, Overlay, State),
 *   3. a driver that stops the motor's rAF loop and steps the simulation by
 *      hand up to one point of the run, wipes the callout layers, then plays
 *      the last frames at real speed — CSS-animated pops and toasts only look
 *      right when the simulation runs at the wall clock — and finally raises
 *      `window.__shot` to say "this frame is worth keeping".
 *
 * Each shot is aimed at a **progression**, a fraction of a full round, not at
 * a frame count: a board at 10% and a board at 90% are different pictures,
 * where ten shots a second apart are the same one. A timed game's round length
 * is its own `CONFIG.gameSeconds`, read after the round starts (radiam zeroes
 * it for its endless mode); an endless game has no such number, so SPAN below
 * carries how long a run of it is worth sampling.
 *
 * **One capture per level, every level of the first two biomes.** A game
 * with a level climb (`web.levels`) is shot once on each level of its first
 * two bands of `web.levels.bands` (levels 1 to 12 on the map's default
 * 1 7 13 19 25), each at the MIDDLE of its round: the gallery is then twelve
 * different boards, two worlds and whatever enemies, objects and specials
 * those levels deal, rather than one board at several moments. `--biomes N`
 * takes more bands. `--level` pins every shot to one level, which breaks
 * the rule, so it is a bench flag: it refuses to write more than one gameplay
 * shot into assets/image/screen/. A game with no climb shoots `--shots` free
 * rounds spread over its progression.
 *
 * After the gameplay shots come the screens no progression can reach, in
 * this order: the end screen (only with `--end`), the LEVEL MAP, the village
 * with its buildings' words turned off (the OPTIONS switch a player who knows
 * the place uses), then EVERY DOOR of the village — the collection, the shop,
 * the ranking, the codex, the daily road, the options, the barracks' rooms —
 * once per TAB of the sheet it opens (a card has one picture). The doors are
 * found off the manifest's `web.village.houses` and the tabs off the sheet's
 * own bar, so a new tab is shot with nothing to declare here.
 *
 * Every page load starts on a wiped storage, then the driver writes the
 * history a player a few sessions in would have — the climb's first band and
 * a half, a wallet, half the stickers with a few doubles, some gallery pieces
 * — through the shell's own functions, so the map, the band, the album and
 * the shop are a place someone plays rather than thirty grey circles and an
 * empty collection.
 *
 * A full run of a game DELETES its old `<slug>-NN` pictures first: the plan's
 * length changes with the game (its bands, its doors, its tabs), and a shot
 * left over from a longer plan would sit in the gallery as a stranger.
 *
 * The map is not a frame of a round either — it is the web shell's own screen,
 * and an empty board is a picture of nothing: thirty grey circles, no stars, a
 * card offering level 1. So a fourth injection hands the tool a handle on the
 * level layer (`window.__LV`) and the driver plays a climb in before opening
 * it, through the layer's OWN `record()` — the stars, the best scores and the
 * frontier are then whatever this game's objective says they are, with none of
 * the map's arithmetic copied out here. It then clicks the menu's own PLAY
 * entry, which is the click a player makes.
 *
 * Chrome is driven over the DevTools protocol rather than with `--screenshot`:
 * the CLI shoots whenever its virtual-time budget expires, which lands on a
 * different (and for some games barely started) frame every run. Here the page
 * itself decides when it is ready and the capture happens on that signal.
 *
 * Usage:
 *   node tools/lab/shoot-screens.mjs [slug ...] [--png] [--keep]
 *     -01..-12 one level each (two biomes), then the map, the village,
 *     every door x tab, and stratideck's officers last
 *   node tools/lab/shoot-screens.mjs vipera --biomes 3     # levels 1-18
 *   node tools/lab/shoot-screens.mjs vipera --end          # + the end screen after the levels
 *   node tools/lab/shoot-screens.mjs vipera --no-build     # reuse dist/itch
 *   node tools/lab/shoot-screens.mjs vipera --playable     # the old source, free rounds only
 *   node tools/lab/shoot-screens.mjs vipera --ctls         # keep MENU/OPTIONS
 *   node tools/lab/shoot-screens.mjs vipera --lang fr      # default: en
 *   node tools/lab/shoot-screens.mjs vipera --out /tmp/x   # anywhere but assets/image/screen/
 *   node tools/lab/shoot-screens.mjs vipera --level 19 --out /tmp/x   # that level's round (web levels)
 *   GEARBALL_BIOME=3 node tools/lab/shoot-screens.mjs gearball --out /tmp/x   # one biome's machine
 *   node tools/lab/shoot-screens.mjs --map-only            # just the map
 *   node tools/lab/shoot-screens.mjs --village-only        # just the village
 *   node tools/lab/shoot-screens.mjs --doors-only          # just the doors and their tabs
 *   node tools/lab/shoot-screens.mjs vipera --no-doors     # everything but the doors
 *   node tools/lab/shoot-screens.mjs stratideck --cards-only   # the officers
 *   SHOOT_DEBUG=1 node tools/lab/shoot-screens.mjs vipera  # what each shot caught
 *
 * An -only flag rewrites its own pictures under the numbers a full run gives
 * them and deletes nothing.
 */

import { spawn, spawnSync } from "node:child_process";
import { reap, sweep, reportSweep } from "./chrome.mjs";
import { pageScripts, injectGamePilot } from "./pilots.mjs";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

var ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
var GAMES_DIR = path.join(ROOT, "games");
var WEB_DIR = path.join(ROOT, "dist", "itch");
var OUT_DIR = path.join(ROOT, "assets", "image", "screen");
var CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
var W = 720, H = 1280;                               // the design resolution

/* How many seconds of a round are worth sampling, per game. It is the *pilot's*
   reach, not a good player's: the scripted player below is bad at every one of
   these games, and a progression it cannot survive to just shoots the same
   board twice — ten shots of the same board is the thing this tool exists to
   stop doing.

   Measured, not guessed: `SHOOT_DEBUG=1 … --shots 2 --no-end` aims the second
   shot at 96% of the round and prints `reached`, the fraction of that the
   pilot actually lived to. The number here is that fraction times the span it
   was measured against. A game with no entry is one the pilot plays to the end
   of (chainring, orbinity, radiam, vipera), and it takes its round length from
   its own `CONFIG.gameSeconds`, or `_endless` when it has no clock.

   Re-measure a game after its difficulty changes; an entry that is too long
   shows up as `reached` well under 1 across its shots. */
var SPAN = {
  _endless: 30,     // a clockless round, for a game with no entry below
  arcider: 22,
  blight: 42,       // its own clock says 60, the pilot sees 40
  bouncetry: 15,
  echomaze: 18,
  marshmelt: 13,    // with its SWEEP entry (pilots.mjs); every seed reaches 12.9 s
  pawko: 50,        // five waves, clockless; the RACK pilot (pilots.mjs) plays them all in ~55 s
  slipdeck: 15,     // clock 30
  spinshock: 27,
  stratideck: 24,   // clockless; the GAME_PILOT (pilots.mjs) takes the flag at ~27 s
  grudgeon: 60,     // clockless; the GAME_PILOT (pilots.mjs) explores the whole dungeon in ~70 s
  bridgessa: 45,    // clockless; a tournée of deals, the GAME_PILOT (pilots.mjs) plays two or three
  triverse: 15,
  holepocalypse: 40, // clockless; the GAME_PILOT (pilots.mjs) clears the free round's three waves in ~45-75 s
  gelatile: 14,     // clockless; the GAME_PILOT (pilots.mjs) makes the free round's 256 in ~25-55 moves
  parrynormal: 40   // clockless; the GAME_PILOT (pilots.mjs) clears a stage in ~25-70 s
};

/* The scripted players (SWEEP, RACK, GAME_PILOT and the generic pilot by
   demo type) live in tools/lab/pilots.mjs, shared with shoot-clip.mjs. */


/* Officers shot at full size, a picture per FACE. A game that declares
   `web.army` draws every card as a person — a portrait on the front, a name,
   an age and a story on the back — and that file is the one screen of the
   game a store gallery cannot show off a round, where the cards are a hand
   wide. Each entry is shot twice, face then back, through the army layer's own
   `file()`: the same card the deck and the round's lists open.

   The five are chosen to read as a range rather than a sample: both armies,
   the top of the ladder and the bottom of it, one of each special, and five
   different tiers, so no two badges on the page match.

   o - the army the officer was raised in.  g - the grade (1 spy … 10 marshal).
   t - the tier, 0 (E) to 5 (S). */
var CARDS = {
  stratideck: [
    { o: "blue", g: 10, t: 5 },     // Rex Maximus, the blue marshal
    { o: "red",  g: 9,  t: 4 },     // Fidelia Chains, a red general
    { o: "blue", g: 1,  t: 3 },     // Nova Trace, a spy
    { o: "red",  g: 3,  t: 2 },     // Tick Tockley, a sapper
    { o: "blue", g: 6,  t: 1 }      // Gemma Stone, a captain
  ]
};

// --- CLI -----------------------------------------------------------------
var argv = process.argv.slice(2);
var slugs = [];
var shots = 8;                       // free-round shots, for a game with no climb
var biomes = 2;                      // --biomes N: every level of the first N bands
var keep = false;
var png = false;
var build = true;
var playable = false;
var withEnd = false;                 // --end: add the end screen after the gameplay shots
var withMap = true;
var mapOnly = false;
var withVillage = true;
var villageOnly = false;
var withCards = true;
var cardsOnly = false;
var withDoors = true;
var doorsOnly = false;
var ctls = false;
var lang = "en";
var level = 0;                       // --level N: the round is that level's (web levels)
var outDir = OUT_DIR;
for (var i = 0; i < argv.length; i++) {
  if (argv[i] === "--shots") shots = parseInt(argv[++i], 10);
  else if (argv[i] === "--biomes") biomes = Math.max(1, parseInt(argv[++i], 10) || 2);
  else if (argv[i] === "--keep") keep = true;
  else if (argv[i] === "--png") png = true;
  else if (argv[i] === "--no-build") build = false;
  else if (argv[i] === "--playable") playable = true;
  else if (argv[i] === "--no-end") withEnd = false;
  else if (argv[i] === "--end") withEnd = true;
  else if (argv[i] === "--no-map") withMap = false;
  else if (argv[i] === "--map-only") mapOnly = true;
  else if (argv[i] === "--no-village") withVillage = false;
  else if (argv[i] === "--village-only") villageOnly = true;
  else if (argv[i] === "--no-cards") withCards = false;
  else if (argv[i] === "--cards-only") cardsOnly = true;
  else if (argv[i] === "--no-doors") withDoors = false;
  else if (argv[i] === "--doors-only") doorsOnly = true;
  else if (argv[i] === "--ctls") ctls = true;
  else if (argv[i] === "--lang") lang = argv[++i];
  else if (argv[i] === "--level") level = parseInt(argv[++i], 10) || 0;
  else if (argv[i] === "--out") outDir = path.resolve(argv[++i]);
  else slugs.push(argv[i]);
}
/* --level pins every shot to one stage: a bench, never a gallery. */
if (level && shots > 1 && outDir === OUT_DIR && !(mapOnly || villageOnly || cardsOnly || doorsOnly)) {
  console.error("--level puts every shot on one stage: one capture per stage is the rule"
    + " for assets/image/screen/. Pass --out, or --shots 1.");
  process.exit(1);
}
/* The map lives in the web shell, which a playable does not ship. */
if (playable) { withMap = false; withVillage = false; withCards = false; withDoors = false; }
/* An -only flag keeps its own screens and drops everything else; the plan is
   still numbered in full, so it renumbers nothing already on disk. */
var only = mapOnly || villageOnly || cardsOnly || doorsOnly;
if (only) {
  withEnd = false;
  withMap = withMap && mapOnly;
  withVillage = withVillage && villageOnly;
  withCards = withCards && cardsOnly;
  withDoors = withDoors && doorsOnly;
}
/* A full run into the gallery is a fresh set: the game's old pictures go
   first (see the header). A bench into --out, a partial run or a run with
   a whole section switched off leaves them alone. */
var fresh = !only && outDir === OUT_DIR && !level
  && withMap && withVillage && withDoors && withCards;
if (!slugs.length) {
  slugs = fs.readdirSync(GAMES_DIR).filter(function (d) {
    return fs.existsSync(path.join(GAMES_DIR, d, "manifest.json"));
  }).sort();
}

function manifestOf(slug) {
  return JSON.parse(fs.readFileSync(path.join(GAMES_DIR, slug, "manifest.json"), "utf8"));
}

/* The levels the gameplay shots are taken on: EVERY level of the first
   `biomes` bands, one shot each. The bands are the manifest's own
   (`web.levels.bands.from`, the map's 1 7 13 19 25 when a game leaves it
   out). A game with no climb (or a playable) gets `shots` free rounds,
   level 0, and --level pins `shots` of them to one level (a bench). */
var BANDS = [1, 7, 13, 19, 25];                      // levels.js: the map's default bands
var CLIMB_LEVELS = 30;                               // levels.js: thirty on every board
function stagesOf(slug) {
  if (level) return Array(shots).fill(level);
  var L = manifestOf(slug).web && manifestOf(slug).web.levels;
  if (!L || playable) return Array(shots).fill(0);
  var from = (L.bands && L.bands.from) || BANDS;
  var last = biomes < from.length ? from[biomes] - 1 : CLIMB_LEVELS;
  var out = [];
  for (var lv = from[0] || 1; lv <= last; lv++) out.push(lv);
  return out;
}

/* The village's doors, in the order the gallery shows them: the meta
   layer's rooms first, then the cards, the road and the options, then the
   barracks. Only the ones the game's village actually builds are shot; `play`,
   `map`, a `mode` house and the decor open no room of their own. */
var DOOR_ORDER = ["album", "shop", "ranking", "cards", "daily", "options",
                  "deck", "recruit", "defense", "infirmary", "prison"];
function doorsOf(slug) {
  var v = manifestOf(slug).web && manifestOf(slug).web.village;
  if (!v || !v.houses) return [];
  var built = {};
  v.houses.forEach(function (h) { built[h.role] = 1; });
  return DOOR_ORDER.filter(function (r) { return built[r]; });
}

/* The shot plan. The gameplay shots, one level each (stagesOf), each at the
   middle of its round — a level shot at its middle is the board in full
   swing, neither the empty opening nor the end — then the end screen when
   asked for, the level map, the village and the officers, which are not
   frames of a round at all. The doors come last because their count is only
   known once their sheets are open (a tab is found on the sheet's bar), so
   `doorsFrom` is the number the first of them is written under.

   Every aim carries the NUMBER it is written under whether or not it is shot
   this run: `--map-only` must not renumber the pictures already on disk. */
function plan(slug) {
  var out = [];
  var lv = stagesOf(slug), n = lv.length;
  var free = lv[0] === 0 && !level;                  // free rounds: spread the progression
  var shoot = !only;
  for (var k = 0; k < n; k++) {
    out.push({ n: k + 1, seed: lv[k] || k + 1, level: lv[k], shoot: shoot,
               p: free && n > 1 ? 0.08 + 0.88 * (k / (n - 1)) : 0.5 });
  }
  var at = n + 1;
  if (withEnd) out.push({ n: at++, seed: n + 1, level: lv[n - 1], end: true, shoot: true });
  out.push({ n: at++, seed: 1, map: true, shoot: withMap });
  out.push({ n: at++, seed: 1, village: true, shoot: withVillage });
  /* The officers, front then back, so two consecutive numbers are one card's
     two faces. */
  var cards = CARDS[slug] || [];
  for (var c = 0; c < cards.length; c++) {
    out.push({ n: at++, seed: 1, card: c, back: false, shoot: withCards });
    out.push({ n: at++, seed: 1, card: c, back: true, shoot: withCards });
  }
  return { aims: out, doorsFrom: at };
}

// --- Injected code -------------------------------------------------------

// Seeded PRNG, installed before any game code runs.
var SEED_JS = `<script>
(function () {
  var q = new URLSearchParams(location.search);
  var s = (parseInt(q.get("seed"), 10) || 1) * 2654435761 % 2147483647;
  if (s <= 0) s += 2147483646;
  Math.random = function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
  /* Every file:// page of this profile shares one storage: wiped, so a shot
     never inherits the climb, the wallet or a switch of the shot before it. */
  try { localStorage.clear(); } catch (e) {}
})();
</script>`;

/* The web build puts MENU and OPTIONS in the bottom-right corner of a round.
   They are chrome, not the game, and a store screenshot is about the game — so
   they are hidden here rather than cropped out later. `--ctls` keeps them. */
var CTLS_CSS = `<style>#web-ctls { display: none !important; }</style>`;

// Handle on the motor internals, injected inside the IIFE.
var HOOK_JS = `
  window.__H = {
    startGame: startGame, frameUpdate: frameUpdate, frameRender: frameRender,
    Loop: Loop, Input: Input, Layout: Layout, CONFIG: CONFIG, Beat: Beat,
    Pop: Pop, Overlay: Overlay, Notify: Notify, Enter: Enter, state: function () { return State; },
    ScreenFx: typeof ScreenFx !== "undefined" ? ScreenFx : null
  };
`;

/* Handle on the level layer, injected inside packages/webshell/levels.js —
   the same trick as HOOK_JS, at the one line that closes that module. The map
   shot needs a board with a history on it, and `record` is how the shell
   itself writes one: stars, best scores and the frontier then come out of this
   game's own objective instead of being invented here. */
var LV_HOOK_JS = `
  window.__LV = {
    record: record, save: save, goalOf: goalOf, dOf: dOf, levels: LEVELS, arm: arm
  };
`;

// The pilot + stepper. Runs after the game script.
var DRIVER_JS = `<script>
(function () {
  var q = new URLSearchParams(location.search);
  var P = parseFloat(q.get("p"));                    // progression, 0..1
  var END = q.get("end") === "1";                    // shoot the end screen
  var MAP = q.get("map") === "1";                    // shoot the level map
  var VILLAGE = q.get("village") === "1";            // shoot the village
  var CARD = q.has("card") ? parseInt(q.get("card"), 10) : -1;   // an officer, by CARDS index
  var BACK = q.get("back") === "1";                  // ...turned over
  var DOOR = q.get("door") || "";                    // a village door, by role
  var TAB = parseInt(q.get("tab"), 10) || 0;         // ...and the tab of its sheet
  var SPAN = parseInt(q.get("span"), 10) || 0;       // measured reach, 0 = none
  var ENDLESS = parseInt(q.get("endless"), 10) || 30;
  var LEVEL = parseInt(q.get("level"), 10) || 0;     // --level: play that level's round
  var DT = 1 / 60;
  var PACED = 110;              // frames before the shot played at wall speed
  /* The end screen is a timed DOM cascade, not frames: title, score count-up,
     stars, then one stat row every 250 ms, and the two buttons 1.5 s after the
     last of them — about 6.2 s to the replay link (packages/shell/shell.js,
     T_TITLE…T_CTA_AFTER). So this settle is wall-clock milliseconds. */
  var SETTLE_MS = 7200;
  var frame = 0, roundFrame = 0, rounds = 0;
  var started = false, cleaned = false, endedAt = 0, target = 0, cap = 0;

  /* The climb played in before the map is opened: one level per entry,
     [level, stars]. It walks the first fork's long road (5 6 7) and stops
     under the second, which puts a road taken and a road not taken on the
     same screen, lights BOTH frontier nodes — 21 stars clears the gate of 14
     on the short road — and leaves the card on a level that has never been
     played. Anything further up and the map is a wall of gold; anything
     shorter and it is a wall of grey. */
  var CLIMB = [[1, 3], [2, 3], [3, 2], [5, 3], [6, 2], [7, 3], [8, 3], [9, 2]];
  /* What a run worth that many stars scored, as a multiple of the level's own
     objective: the layer's thresholds are 1x, 1.5x and 2.2x (levels.js,
     starsFor), so these land inside each band rather than on its edge. */
  var WORTH = { 3: 2.35, 2: 1.62, 1: 1.15 };
  var MAP_MS = 2000;            // the open, the scroll and the decor, settling

    /* The scripted player is window.__pilot (tools/lab/pilots.mjs). */

  /* A full round, in frames. A measured span wins, because a clock the pilot
     never reaches the end of is not the round it plays. Failing that a timed
     game carries its own length, read here rather than off the manifest
     because a mode can rewrite it: radiam zeroes CONFIG.gameSeconds when its
     endless mode is the one that started. */
  function aim(H) {
    var secs = SPAN || (H.CONFIG.gameSeconds > 0 ? H.CONFIG.gameSeconds : ENDLESS);
    var span = Math.round(secs * 60);
    target = Math.max(90, Math.round(Math.min(0.97, Math.max(0.02, P || 0.5)) * span));
    // Bound the retries: a pilot that keeps dying must still hand back a frame.
    cap = END ? span * 2 + 600 : target * 3 + 240;
  }

  function step(H) {
    if (H.state() !== "playing") {                   // the pilot died: play again
      H.startGame(); H.Loop.stop(); H.Enter.skip();   // a capture is of play, not of the entrance
      roundFrame = 0; rounds++; cleaned = false;
    }
    window.__pilot(H, frame);
    H.frameUpdate(DT);
    frame++; roundFrame++;
  }

  /* The frame we keep must belong to a round that has been running for a while:
     the first second of a round is an empty board. The bar drops as the pilot's
     retries eat into the cap — a short round beats a screenshot of a respawn. */
  function need() {
    var lost = frame - roundFrame;                   // frames spent in dead rounds
    return Math.max(90, Math.round(target * (1 - lost / cap)));
  }
  function ready() { return frame >= cap || roundFrame >= need(); }

  /* ...and it must not be a frame the game is using to say something went
     wrong. A "danger" callout is the motor's one shared vocabulary for that —
     marshmelt's MELTED, its HOT!/BURNT! — and it sits in #ov-pops like every
     other Pop, so this needs no game internals and no new motor API. Death
     itself is invisible from here: a game sets its own private flag and only
     reaches endRound a beat later, so state() still says "playing" over the
     very frames that show the banner. Deferring past them is what stops a
     store gallery full of game-overs; cap is the bound, so a game that warns
     constantly still hands back a frame. */
  /* A game's own red vignette (Overlay.vignette, vipera's life lost) is a
     free colour rather than a named preset, so it is read off the glow node
     the motor draws it in: up, and red. */
  function redGlow() {
    var g = document.querySelector(".sfx-glow");
    if (!g || +getComputedStyle(g).opacity < 0.08) return false;
    var m = g.innerHTML.match(/rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/);
    return !!m && +m[1] > 170 && +m[2] < 110 && +m[3] < 150;
  }
  function dying() {
    var H = window.__H, F = H && H.ScreenFx;
    /* ...and the same goes for the frame turning red around a hit, a mistake
       callout (\`alert\`: MAGNET LOST) and a round already over, whose outro
       burns the frame: a gallery of the game going wrong sells nothing. */
    if (H && H.state() !== "playing") return true;
    var W = window.__WEB__;
    if (W && W.ending && W.ending()) return true;     // the outro: a missed level burns red
    if (F && (F.active("hit") || F.active("danger") || F.active("fire"))) return true;
    if (redGlow()) return true;
    var MD = window.__MODAL__;
    if (MD && MD.any && MD.any()) return true;        // a card over the round
    return !!document.querySelector("#ov-pops .pop-danger, #ov-pops .pop-alert");
  }

  /* The end screen is not a frame of the simulation, it is a DOM cinematic on
     the wall clock. So the round is played out — the pilot dies, or the clock
     runs out — and then nothing is stepped at all while it plays. */
  function tickEnd(H) {
    if (H.state() === "end") {
      if (!endedAt) endedAt = Date.now();
      if (Date.now() - endedAt >= SETTLE_MS) window.__shot = 1;
      return;
    }
    if (frame >= cap) { window.__shot = 1; return; }  // never ended: keep the board
    for (var i = 0; i < 20 && frame < cap && H.state() === "playing"; i++) {
      window.__pilot(H, frame); H.frameUpdate(DT); frame++; roundFrame++;
    }
    H.frameRender();
  }

  /* The map is a DOM screen, like the end screen: nothing is stepped, the
     board is written, the menu's own PLAY entry is clicked and the wall clock
     does the rest. A game with no web.levels block has no map to shoot and says
     so — the host skips it rather than writing a picture of the menu. */
  function tickMap(H) {
    if (!started) {
      if (H.state() !== "intro" || !window.__LV) return;
      if (!window.__LEVELS__ || !window.__LEVELS__.active()) { window.__skip = 1; return; }
      history();
      document.getElementById("btn-start").click();   // the player's own click
      started = true;
      endedAt = Date.now();
    }
    window.__progress = (window.__progress || 0) + 1;  // the host watches this
    /* A game with a VILLAGE opens the hub on PLAY, and the map is one of its
       buildings: the player's second click, through the house's own door. */
    if (!window.__viaVillage) {
      var door = document.querySelector('[data-role="map"] .vg-hit');
      if (door) { door.click(); window.__viaVillage = 1; endedAt = Date.now(); }
    }
    if (Date.now() - endedAt >= MAP_MS) { H.Notify.clear(); window.__shot = 1; }
  }

  /* The board with a history on it, through the layer's own record() — the
     map needs it to be worth a picture, and the village wears it in its band. */
  function climb() {
    var LV = window.__LV;
    LV.save.h = 1;                                    // the tutorial is read
    for (var i = 0; i < CLIMB.length; i++) {
      var n = CLIMB[i][0], stars = CLIMB[i][1];
      LV.record(n, stars, Math.round(LV.goalOf(LV.dOf(n)) * WORTH[stars]));
    }
  }

  /* ...and a player's pockets to go with it, through the meta layer's own
     functions: a wallet, a level of xp (about six), half the album with
     three doubles to sell, a super ticket and a few gallery pieces. An empty
     album is twenty white silhouettes, a picture of nothing. */
  var OWNED = [1, 2, 3, 4, 6, 7, 9, 10, 12, 15], DOUBLES = [2, 6, 9];
  function pockets() {
    var MT = window.__META__;
    if (!MT || !MT.active()) return;
    MT.addCoins(1240);
    MT.addXp(15000);
    MT.addTickets(2);
    if (MT.addSupers) MT.addSupers(1);
    if (MT.addPieces) MT.addPieces(7);
    var total = MT.total(), i;
    for (i = 0; i < OWNED.length; i++) if (OWNED[i] <= total) MT.give(OWNED[i]);
    for (i = 0; i < DOUBLES.length; i++) if (DOUBLES[i] <= total) MT.give(DOUBLES[i]);
  }
  function history() {
    if (window.__LV && window.__LEVELS__ && window.__LEVELS__.active()) climb();
    pockets();
  }

  /* The village is a DOM view, like the map: the history is written, PLAY is
     clicked — which is what opens the hub — and the wall clock settles its
     houses in. Its buildings' words are turned off first, the switch a
     player who knows the place flips in OPTIONS: the picture is the place,
     not a legend. A game with no village has none to shoot and says so. */
  var VILLAGE_MS = 2600;
  function openVillage(H) {
    if (H.state() !== "intro") return false;
    if (!(H.CONFIG.web && H.CONFIG.web.village)) { window.__skip = 1; return false; }
    history();
    if (window.__VILLAGE__ && window.__VILLAGE__.setLabels) window.__VILLAGE__.setLabels(false);
    document.getElementById("btn-start").click();
    started = true;
    endedAt = Date.now();
    return true;
  }
  /* The hub may greet the player with a card of its own — the objects a band
     handed over, a camp's day, a promotion (army.js) — which is a moment,
     not the place. Each is put away by its own tap line's way (closeTop),
     and the hub is given a beat to settle under it; \`calm\` says whether
     the place is bare now. Bounded: a card that keeps coming back is shot. */
  var calmTries = 0;
  function calm() {
    var MD = window.__MODAL__;
    if (!MD || !MD.any || !MD.any() || calmTries >= 8) return true;
    MD.closeTop(); calmTries++;                       // one a beat: a card leaves animated
    return false;
  }
  var CALM_MS = 700;
  function tickVillage(H) {
    if (!started && !openVillage(H)) return;
    window.__progress = (window.__progress || 0) + 1;
    var t = Date.now() - endedAt;
    if (phase === 0 && t >= VILLAGE_MS) { calm(); phase = 1; endedAt = Date.now(); }
    else if (phase === 1 && t >= CALM_MS) {
      if (!calm()) { endedAt = Date.now(); return; }
      H.Notify.clear(); window.__shot = 1;
    }
  }

  /* A DOOR of the village, through the house's own hit box — the player's
     tap — and one TAB of the sheet it opens, through the tab's own button.
     The host learns how many tabs there are from \`__tabs\` on the first
     tab's shot, and asks for the others one page load each. A door that
     opens nothing (a role this build does not carry) is skipped, and so is a
     tab past the last. */
  var DOOR_MS = 1800, TAB_MS = 1300;
  function tickDoor(H) {
    if (!started && !openVillage(H)) return;
    window.__progress = (window.__progress || 0) + 1;
    var t = Date.now() - endedAt;
    if (phase === 0 && t >= VILLAGE_MS) { calm(); phase = 1; endedAt = Date.now(); }
    else if (phase === 1 && t >= CALM_MS) {
      if (!calm()) { endedAt = Date.now(); return; }
      var hit = document.querySelector('[data-role="' + DOOR + '"] .vg-hit');
      var M = window.__MENU__;
      if (hit) hit.click();
      else if (M && M.doors && M.doors[DOOR]) M.doors[DOOR]();
      else { window.__skip = 1; return; }
      phase = 2; endedAt = Date.now();
    } else if (phase === 2 && t >= DOOR_MS) {
      var VW = window.__VIEW__, MD = window.__MODAL__;
      if (!((VW && VW.top() && VW.top() !== "village") || (MD && MD.any && MD.any()))) {
        window.__skip = 1; return;
      }
      var tabs = document.querySelectorAll(".wv-screen.on .wv-tab");
      window.__tabs = tabs.length;
      if (TAB >= Math.max(1, tabs.length)) { window.__skip = 1; return; }
      if (tabs.length) tabs[TAB].click();
      phase = 3; endedAt = Date.now();
    } else if (phase === 3 && t >= TAB_MS) {
      H.Notify.clear();
      window.__shot = 1;
    }
  }

  /* An officer's file opens over the village, which is where the deck it is
     read from stands; it flies in and lands face up (army.js, openFile), and
     the back is one tap on the card after that — the player's own tap. */
  var FILE_MS = 1500, TURN_MS = 1100;
  var phase = 0;
  function tickCard(H) {
    var C = (window.__CARDS || [])[CARD];
    if (!started) {
      if (H.state() !== "intro") return;
      if (!C || !window.__ARMY__) { window.__skip = 1; return; }
      document.getElementById("btn-start").click();
      started = true;
      endedAt = Date.now();
    }
    window.__progress = (window.__progress || 0) + 1;
    var t = Date.now() - endedAt;
    if (phase === 0 && t >= 1200) {
      window.__ARMY__.file({ o: C.o, g: C.g, t: C.t }, C.o, null);
      phase = 1; endedAt = Date.now();
    } else if (phase === 1 && t >= FILE_MS) {
      var flip = document.querySelector(".ar-flip");
      if (BACK && flip) { flip.click(); phase = 2; endedAt = Date.now(); }
      else window.__shot = 1;
    } else if (phase === 2 && t >= TURN_MS) window.__shot = 1;
  }

  function tick() {
    var H = window.__H;
    requestAnimationFrame(tick);
    if (!H) return;
    if (MAP) { tickMap(H); return; }
    if (VILLAGE) { tickVillage(H); return; }
    if (DOOR) { tickDoor(H); return; }
    if (CARD >= 0) { tickCard(H); return; }
    if (!started) {
      if (H.state() !== "intro") return;              // still loading
      // a level is armed exactly as the map arms it, before the round starts
      if (LEVEL && window.__LV && window.__LV.arm) window.__LV.arm(LEVEL);
      H.startGame();
      H.Loop.stop();                                  // we drive the clock
      H.Enter.skip();                                 // ...from a landed world
      aim(H);                                         // CONFIG is final now
      started = true;
    }
    window.__progress = frame;
    if (END) { tickEnd(H); return; }
    /* A card pressed while pawko's wave falls opens its zoom, which the next
       press shuts: a frame under it shows a card, not the board. */
    if (ready() && !((dying() || document.getElementById("pk-zoom")) && frame < cap)) {
      H.frameRender();                                // keep the canvas fresh
      window.__shot = 1;                              // the host may capture now
      window.__reached = roundFrame / target;
      return;
    }
    if (ready()) { step(H); H.frameRender(); return; } // wait out the warning
    var settle = need() - PACED;
    if (roundFrame < settle) {                        // fast-forward, cheaply
      for (var i = 0; i < 20 && roundFrame < settle && frame < cap; i++) step(H);
      if (roundFrame >= settle && !cleaned) {         // drop the piled-up callouts and notices
        H.Pop.clear(); H.Overlay.clear(); H.Notify.clear(); cleaned = true;
      }
    } else {
      step(H);                                        // one frame per animation frame
    }
    H.frameRender();
  }
  requestAnimationFrame(tick);
})();
</script>`;

/* Where a game's build sits. The web build is one self-contained document per
   game, like a playable, which is what lets the same three injections work on
   either source. */
function sourceOf(slug) {
  return playable
    ? path.join(GAMES_DIR, slug, "index.html")
    : path.join(WEB_DIR, slug, "index.html");
}

/* ONE BUILD PER SLUG, and that is not a style choice: `build.mjs` reads its
   target with `argv.find(a => a.startsWith("--game="))`, so it honours the
   FIRST --game= and ignores every other one. Handing it a list used to build
   the first game and shoot the rest off whatever was left in dist/itch from a
   previous run — stale documents, silently, with the tool reporting success.
   Asking for every game still builds in one pass, because that is the run with
   no --game= at all. */
function buildWeb(slugs) {
  var base = ["tools/build/build.mjs", "--target=web", "--dest=itch"];
  var runs = slugs.length >= 13
    ? [base]
    : slugs.map(function (s) { return base.concat(["--game=" + s]); });
  for (var i = 0; i < runs.length; i++) {
    var r = spawnSync(process.execPath, runs[i], { cwd: ROOT, stdio: "inherit" });
    if (r.status !== 0) throw new Error("the web build failed");
  }
}

function prepare(slug, tmpDir) {
  var src = fs.readFileSync(sourceOf(slug), "utf8");

  /* The hook goes inside the *game's* IIFE, which is the first script block of
     the document: a web build appends the webshell as a second one, so the
     document's last `})();` closes the menu, not the motor. This runs before
     the head injection on purpose — SEED_JS carries a `</script>` of its own,
     and inserting it first would make "the first script block" be that one. */
  var firstScript = src.indexOf("</script>");
  if (firstScript < 0) throw new Error(slug + ": no script block");
  var close = src.lastIndexOf("})();", firstScript);
  if (close < 0) throw new Error(slug + ": no IIFE close");
  src = src.slice(0, close) + HOOK_JS + src.slice(close);

  src = injectGamePilot(src, slug);

  var head = src.indexOf("<head>");
  if (head < 0) throw new Error(slug + ": no <head>");
  src = src.slice(0, head + 6) + "\n" + SEED_JS
    + (ctls ? "" : "\n" + CTLS_CSS) + src.slice(head + 6);

  /* The level layer is a second IIFE in the same document, and it publishes
     exactly one name — which is the anchor the handle is written in front of.
     Absent on a playable, which ships no web shell. */
  var lv = src.indexOf("window.__LEVELS__ = {");
  if (lv >= 0) src = src.slice(0, lv) + LV_HOOK_JS + "  " + src.slice(lv);

  var cards = CARDS[slug]
    ? "<script>window.__CARDS = " + JSON.stringify(CARDS[slug]) + ";</script>\n"
    : "";
  src = src.replace("</body>", pageScripts(slug) + cards + DRIVER_JS + "\n</body>");

  var out = path.join(tmpDir, slug + ".html");
  fs.writeFileSync(out, src);
  return out;
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
    // A game on the musical clock (Beat) waits for its bed to actually play, and
    // there is no user gesture here to unblock it.
    "--autoplay-policy=no-user-gesture-required",
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

// A very small CDP client: send(method, params) and one event listener.
async function cdp(port) {
  var info = await (await fetch("http://127.0.0.1:" + port + "/json/version")).json();
  var ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise(function (res, rej) { ws.onopen = res; ws.onerror = rej; });

  var nextId = 1, pending = new Map(), onEvent = null;
  ws.onmessage = function (m) {
    var msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      var p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.rej(new Error(msg.method + ": " + msg.error.message));
      else p.res(msg.result);
    } else if (msg.method && onEvent) onEvent(msg);
  };
  function send(method, params, sessionId) {
    var id = nextId++;
    ws.send(JSON.stringify({ id: id, method: method, params: params || {}, sessionId: sessionId }));
    return new Promise(function (res, rej) { pending.set(id, { res: res, rej: rej }); });
  }
  return {
    send: send,
    set on(fn) { onEvent = fn; },
    close: function () { ws.close(); }
  };
}

async function openPage(client) {
  var t = await client.send("Target.createTarget", { url: "about:blank" });
  var a = await client.send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
  var sid = a.sessionId;
  await client.send("Page.enable", {}, sid);
  await client.send("Runtime.enable", {}, sid);
  await client.send("Emulation.setDeviceMetricsOverride",
    { width: W, height: H, deviceScaleFactor: 1, mobile: true }, sid);
  // Headless Chrome only animates while something consumes frames: the
  // screencast is what keeps requestAnimationFrame and the CSS clock running.
  client.on = function (msg) {
    if (msg.method === "Page.screencastFrame") {
      client.send("Page.screencastFrameAck", { sessionId: msg.params.sessionId }, sid).catch(function () {});
    }
  };
  await client.send("Page.startScreencast",
    { format: "jpeg", quality: 5, maxWidth: 120, maxHeight: 220, everyNthFrame: 1 }, sid);
  return sid;
}

async function evaluate(client, sid, expr) {
  var r = await client.send("Runtime.evaluate", { expression: expr, returnByValue: true }, sid);
  return r.result ? r.result.value : undefined;
}

async function shoot(client, sid, file, seed, aim, span, outPath) {  // span: seconds, 0 = the game's own
  /* `lang` is the web menu's own switch, and it reaches the end screen: left
     to the browser, a headless Chrome in a French locale writes REJOUER on
     the replay button of every screenshot. */
  var url = "file://" + file + "?first=0&seed=" + seed + "&span=" + span
    + "&endless=" + SPAN._endless + "&lang=" + lang + (aim.level ? "&level=" + aim.level : "")
    + (aim.map ? "&map=1" : aim.village ? "&village=1"
      : aim.door ? "&door=" + aim.door + "&tab=" + (aim.tab || 0)
      : aim.card != null ? "&card=" + aim.card + (aim.back ? "&back=1" : "")
      : aim.end ? "&end=1" : "&p=" + aim.p.toFixed(3));
  await client.send("Page.navigate", { url: url }, sid);

  var deadline = Date.now() + 120000;
  var stall = 0, last = -1;
  for (;;) {
    await sleep(120);
    if (await evaluate(client, sid, "window.__shot || 0")) break;
    if (await evaluate(client, sid, "window.__skip || 0")) return false;
    var p = await evaluate(client, sid, "window.__progress || 0");
    if (p === last) stall++; else { stall = 0; last = p; }
    if (stall > 60) throw new Error("the driver stopped advancing at frame " + p);
    if (Date.now() > deadline) throw new Error("timed out at frame " + p);
  }

  var opts = png ? { format: "png" } : { format: "jpeg", quality: 82 };
  opts.captureBeyondViewport = false;
  var res = await client.send("Page.captureScreenshot", opts, sid);
  fs.writeFileSync(outPath, Buffer.from(res.data, "base64"));

  // SHOOT_DEBUG=1 reports what the shot actually caught. `reached` is the
  // fraction of the aimed progression the pilot survived to: well under 1
  // across a game's shots means its SPAN is longer than the pilot's reach,
  // and the late shots are duplicates of the middle ones.
  if (process.env.SHOOT_DEBUG) {
    process.stdout.write("  " + path.basename(outPath) + " "
      + (aim.map ? "map" : aim.village ? "village" : aim.door ? aim.door + "/" + (aim.tab || 0) : aim.card != null ? "card" + aim.card + (aim.back ? "b" : "f")
        : aim.end ? "end" : "p=" + aim.p.toFixed(2)) + " "
      + await evaluate(client, sid,
      'JSON.stringify({ frames: window.__progress, reached: +(window.__reached || 1).toFixed(2),' +
      ' endAt: window.__endAt || 0, state: window.__H.state(), score: document.getElementById("hud-score").textContent })') + "\n");
  }
  return true;
}

// --- Run -----------------------------------------------------------------


fs.mkdirSync(outDir, { recursive: true });
if (!playable && build) buildWeb(slugs);
var missing = slugs.filter(function (s) { return !fs.existsSync(sourceOf(s)); });
if (missing.length) {
  console.error("no build for: " + missing.join(" ")
    + (playable ? "" : "  (does its manifest list the web target?)"));
  slugs = slugs.filter(function (s) { return fs.existsSync(sourceOf(s)); });
}
reportSweep(sweep("shoot-screens-"));
var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shoot-screens-"));
var profileDir = path.join(tmpDir, "profile");
var failed = 0;

var chrome = await launchChrome(profileDir);
reap(chrome.child, { label: "shoot-screens" });
var client = await cdp(chrome.port);
var sid = await openPage(client);


/* One picture: written under its number, reported as NN (shot), -NN (nothing
   to shoot there) or !NN (failed). */
async function take(slug, file, aim, span, line) {
  var tag = String(aim.n).padStart(2, "0");
  var name = slug + "-" + tag + (png ? ".png" : ".jpg");
  try {
    var shot = await shoot(client, sid, file, aim.seed, aim, span, path.join(outDir, name));
    line.push(shot ? tag : "-" + tag);
    return shot;
  } catch (e) {
    failed++;
    line.push("!" + tag);
    process.stderr.write("\n" + name + ": " + e.message + "\n");
    return false;
  }
}

for (var s = 0; s < slugs.length; s++) {
  var slug = slugs[s];
  var file = prepare(slug, tmpDir);
  var span = SPAN[slug] || 0;
  var p = plan(slug);
  var line = [];
  if (fresh) {
    fs.readdirSync(outDir).filter(function (f) {
      return new RegExp("^" + slug + "-\\d+\\.(jpg|png)$").test(f);
    }).forEach(function (f) { fs.unlinkSync(path.join(outDir, f)); });
  }
  for (var a = 0; a < p.aims.length; a++) {
    if (p.aims[a].shoot) await take(slug, file, p.aims[a], span, line);
  }
  /* The doors, numbered on from the plan: the first tab of a door says how
     many its sheet has, and each of the others is one more page load. */
  var at = p.doorsFrom;
  var doors = withDoors ? doorsOf(slug) : [];
  for (var d = 0; d < doors.length; d++) {
    var first = { n: at, seed: 1, door: doors[d], tab: 0 };
    if (!(await take(slug, file, first, span, line))) continue;
    at++;
    var count = (await evaluate(client, sid, "window.__tabs || 0")) || 1;
    for (var k = 1; k < count; k++) {
      if (await take(slug, file, { n: at, seed: 1, door: doors[d], tab: k }, span, line)) at++;
    }
  }
  console.log(slug + "  " + line.join(" "));
}

client.close();
chrome.child.kill("SIGKILL");
await sleep(500);                                    // let Chrome release its profile
if (!keep) fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
else console.log("kept: " + tmpDir);
process.exit(failed ? 1 : 0);
