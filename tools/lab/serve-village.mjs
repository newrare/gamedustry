#!/usr/bin/env node
/*
  serve-village — the village composer, with a disk under it.

    node tools/lab/serve-village.mjs
    node tools/lab/serve-village.mjs --port=4000
    make lab                             → http://localhost:8095/village/

  lab/village.html is where a game's TITLE SCREEN is laid out as a place
  rather than as a list: a painted hub, and the game's own houses standing on
  it, each one the door to a screen the web shell already has — the map, the
  ranking, the shop, the collection, the daily road, the options, the help.

  It needs a server for the same two reasons the store composer does, plus the
  one that matters: a file:// page cannot LIST what a game owns, and APPLY
  WRITES. What it writes is the composition, in two places and on purpose:

    lab/village-presets.json      the DRAFT. A lab file, hand-editable and
                                  committed, keyed by slug. Saving here ships
                                  nothing and rebuilds nothing, so a village
                                  can be left half-placed between two sessions.

    games/<slug>/manifest.json    `web.village`, the DECLARATION — the same
                                  place `web.levels` and `web.meta` are
                                  written, because the village is what the
                                  game's front door IS and the builder injects
                                  it as CONFIG.web. Pushing there moves the
                                  game's patch version and rebuilds the
                                  artifact, so the tree still passes
                                  `node tools/update.mjs`.

  The draft is not a second source of truth: it is the sketch, and the push is
  the decision. `/api/catalogue` hands both back and the page says which of the
  two it is showing, so there is never a question about which one is on screen.

    GET  /                    the composer
    GET  /assets/…            the real assets, by path
    GET  /api/catalogue       every game: theme, what it declares, the art it
                              has adopted, the cuts it has NOT, and its draft
                              and declared villages
    PUT  /api/adopt           name one spare cut in the manifest, and encode it
    PUT  /api/draft           save (or delete) one draft
    PUT  /api/manifest        write web.village, bump the patch, rebuild

  It builds nothing on boot and watches nothing: the pictures are already on
  disk, written by tools/lab/cut-objects.mjs and tools/lab/encode-art.mjs.
*/

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bumpPatch } from './apply-events.mjs';
import { SHELL_CUTS } from './encode-art.mjs';
import { isMain, portArg, listen, json, notFound, readBody, sendFile } from '../lib/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const run = promisify(execFile);

const GAMES_DIR = path.join(ROOT, 'games');
const ART_DIR = path.join(ROOT, 'assets', 'image', 'embed');
const OBJECT_DIR = path.join(ROOT, 'assets', 'image', 'object');
const DRAFTS = path.join(ROOT, 'lab', 'village-presets.json');

/* The doors a house can be. They are the web shell's own screens and cards
   (packages/webshell/view.js, docs/VIEWS.md) and not a list this tool
   invented: a village is the TITLE VIEW, so what a house opens is what a menu
   entry opened. `decor` is the one that opens nothing — a house placed for the
   picture. The last four are the BARRACKS' (packages/webshell/army.js), and
   only a game that declares `web.army` owes them. */
const ROLES = ['play', 'map', 'ranking', 'shop', 'album', 'daily', 'options', 'help',
  'deck', 'infirmary', 'prison', 'recruit', 'decor'];

/* SHARED MATERIAL — `game-<sheet>-NN.png`, the cuts that belong to no game.
   `assets/image/object/` holds two kinds of them under that one prefix and
   they are not interchangeable:

     the SHELL'S OWN pieces — the coin, the ticket, the gift boxes, the star —
     which the shell names in SHELL_CUTS, encodes into assets/image/shell/ and
     draws for every game that has a wallet. A game may not adopt one: the
     shell already ships it, and a second copy under a slug would be the same
     picture twice in one build.

     everything else, which is SCENERY — the three cloud sheets are the first
     of it. A cloud is not the shell's: it is placed on ONE game's village, at
     a position that game chose, so it is adopted exactly like a cut of the
     game's own sheets (`art.objects` → assets/image/embed/<slug>-<role>.webp →
     CONFIG.art.<camelRole>) and only the villages that place one carry the
     bytes. The role is the cut's own name with the prefix taken off, so
     `game-cloud-haze-03` is `cloud-haze-03` in every one of the thirteen and
     there is no name to invent.

   The two are told apart by the SHEET a cut came out of, read off SHELL_CUTS
   rather than listed again here — a list would go out of step the first time
   the shell adopted a piece. */
const SHARED_PREFIX = 'game-';
const SHELL_SHEETS = new Set(SHELL_CUTS.map((e) => {
  const stem = typeof e === 'string' ? e : e.cut;
  return stem.replace(/^game-/, '').replace(/-\d+$/, '');
}));

// ── what a game owns ───────────────────────────────────────────────────────

function ls(dir) {
  try { return fs.readdirSync(dir).sort(); } catch { return []; }
}

function manifestOf(slug) {
  try {
    return JSON.parse(fs.readFileSync(path.join(GAMES_DIR, slug, 'manifest.json'), 'utf8'));
  } catch { return null; }
}

/* `background-phone` → backgroundPhone, exactly as tools/build/build.mjs
   camel-cases a role on its way into CONFIG.art. The composer stores the role
   the shell will read, so there is no second spelling anywhere. */
function camel(role) {
  return role.replace(/-([a-z0-9])/g, (m, c) => c.toUpperCase());
}

function catalogue() {
  const art = ls(ART_DIR);
  const cutFiles = ls(OBJECT_DIR);
  const games = {};

  for (const slug of ls(GAMES_DIR)) {
    const m = manifestOf(slug);
    if (!m) continue;

    /* THE PALETTE IS WHAT THE GAME HAS ADOPTED, and nothing else. Everything
       under assets/image/embed/ is embedded in every build of its game, so it
       is the one folder that answers "what can this village draw" without a
       second rule: a cut in assets/image/object/ that no manifest names ships
       nowhere and cannot be placed. */
    const roles = art
      .filter((f) => f.startsWith(slug + '-') && f.endsWith('.webp'))
      .map((f) => f.slice(slug.length + 1, -5));

    /* THE FILE TRAVELS WITH THE ROLE, because the role cannot be spelled back
       into it. A role is camel-cased on its way into CONFIG.art, and that
       throws away where the dashes were: `decor05` came from
       `<slug>-decor-05.webp` and `home01` from `<slug>-home01.webp`, two files
       whose names are the same shape. The composer stores the ROLE, which is
       what the shell will read, and draws the FILE, which is what the disk
       has — so neither of them is ever guessed. */
    const pack = (list) => list.map((r) => ({ role: camel(r), file: slug + '-' + r + '.webp' }));

    /* ...and what it has NOT, so the page can print the one command that
       adopts it rather than leaving the user to find this file. Grouped by the
       sheet the cut came out of, the way the store composer groups them. */
    const declared = new Set(Object.values((m.art && m.art.objects) || {}));
    const spare = {};
    for (const f of cutFiles) {
      const mm = f.match(new RegExp('^' + slug + '-(.+)-(\\d+)\\.png$'));
      if (!mm) continue;
      const stem = f.slice(0, -4);
      if (declared.has(stem)) continue;
      (spare[mm[1]] = spare[mm[1]] || []).push({ file: f, n: Number(mm[2]) });
    }

    /* ...and the SHARED cuts beside them, which are the same offer made from a
       sheet no game owns: the clouds every village draws the same three sheets
       of. Grouped and dimmed the same way, adopted by the same click, and the
       shell's own sheets are held back — see SHARED_PREFIX above. */
    const shared = {};
    for (const f of cutFiles) {
      const mm = f.match(/^game-(.+)-(\d+)\.png$/);
      if (!mm || SHELL_SHEETS.has(mm[1])) continue;
      if (declared.has(f.slice(0, -4))) continue;
      (shared[mm[1]] = shared[mm[1]] || []).push({ file: f, n: Number(mm[2]) });
    }

    games[slug] = {
      slug,
      title: m.title || slug,
      order: m.order == null ? 99 : m.order,
      font: (m.web && m.web.font) || 'exo2',
      accent: (m.theme && m.theme.accent) || '#4dff9b',
      accent2: (m.theme && m.theme.accent2) || (m.theme && m.theme.accent) || '#4dff9b',
      /* What the game DECLARES is what decides which doors its village owes
         the player: a game with no `web.meta` has no shop, no collection and
         no daily road to stand a house in front of. */
      levels: !!(m.web && m.web.levels),
      meta: !!(m.web && m.web.meta),
      army: !!(m.web && m.web.army),
      /* The grounds and the houses, split out of the roles because they are
         the two palettes the page shows first — everything else is in the
         "anything else it owns" reel. */
      grounds: pack(roles.filter((r) => r.indexOf('background-') === 0)),
      houses: pack(roles.filter((r) => /^home\d+$/.test(r))),
      other: pack(roles.filter((r) => r.indexOf('background-') !== 0 && !/^home\d+$/.test(r))),
      spare,
      shared,
      village: (m.web && m.web.village) || null
    };
  }

  return { games, roles: ROLES, drafts: readDrafts().drafts || {} };
}

// ── the drafts ─────────────────────────────────────────────────────────────

function readDrafts() {
  try { return JSON.parse(fs.readFileSync(DRAFTS, 'utf8')); } catch { return { version: 1, drafts: {} }; }
}

function writeDraft(slug, comp) {
  const db = readDrafts();
  db.version = 1;
  db.drafts = db.drafts || {};
  if (comp === null) delete db.drafts[slug];
  else db.drafts[slug] = comp;
  fs.writeFileSync(DRAFTS, JSON.stringify(db, null, 2) + '\n');
  return Object.keys(db.drafts).length;
}

// ── the declaration ────────────────────────────────────────────────────────

/* Everything that arrives over HTTP is rebuilt field by field rather than
   spread into the manifest: this writes a file the build reads, so a key the
   page invented would reach thirteen artifacts before anybody saw it. A house
   with no art or no known role is dropped and named in the answer. */
/* HOW A HOUSE SAYS IT HAS SOMETHING TO GIVE, in TWO fields rather than one.
   `notify` moves the HOUSE — `float` hangs it, `breath` swells it, `alert`
   hops it, `fade` takes it away and brings it back, `cloud` carries it across
   the frame while it breathes and hazes — and `light` works the
   HALO under it — `blink` a hard beat, `flicker` a failing tube, `random` one
   long uneven cycle. A building that is alive and a sign that is lit are two
   statements, and a house may make both at once; they were one list picked one
   at a time, and that was the bug. A house with neither is quiet. */
const PULSES = ['float', 'breath', 'alert', 'fade', 'cloud'];
const LIGHTS = ['blink', 'flicker', 'random'];

/* THE LONGEST TURN EACH PULSE MAY NAME, and it is not one number because they
   are not one gesture. Four of them are a beat and a minute of one would be a
   building that never moves; `cloud` is a CROSSING of the whole frame, and ten
   minutes of it is the slow drift a painted sky asks for — a house that hopped
   once every ten minutes would simply be broken. */
const PULSE_MAX = { cloud: 600 };

/* ONE FILE THAT NAMES NO CUT. An empty house is a box placed over a lamp the
   hub was already painted with: it carries a halo, a badge and a door and
   draws nothing of its own, which makes it the cheapest building in the
   village. It is the one `art` that is not a role the game adopted, so it is
   named once here and checked for by name. */
const EMPTY_ART = 'empty';

/* A COLOUR, AND NOTHING ELSE IS TRUSTED. Both ends of the light cycle arrive
   over HTTP and are written into a file thirteen artifacts are built from. */
const HEX = /^#[0-9a-fA-F]{6}$/;

function cleanVillage(raw, game) {
  const out = { ground: null, houses: [] };
  const dropped = [];

  const roleOf = (list) => list.map((i) => i.role);
  const owns = new Set([].concat(roleOf(game.houses), roleOf(game.other)));
  if (raw && typeof raw.ground === 'string' && roleOf(game.grounds).includes(raw.ground)) {
    out.ground = raw.ground;
  }

  const n = (v, lo, hi, dflt) => {
    const x = Number(v);
    if (!isFinite(x)) return dflt;
    return Math.min(hi, Math.max(lo, Math.round(x * 1000) / 1000));
  };

  /* WHAT MAKES THE SCENE MOVE, and it is one thing: the light BREATHES. The
     scene passes through its own painted light, out into warm, back through it
     and out into cold, over `seconds`. Absent means a hub lit exactly as it
     was drawn.

     Reading the player's real clock was the first answer here and it was the
     wrong one — a difference nobody can see, because nothing moves while they
     are looking at it. A slow Ken Burns on the ground was the second, and it
     went for the opposite reason: the houses do not move, so a drifting
     backdrop under fixed buildings reads as the picture sliding. Whatever
     moves here has to move all of it, and a breath does. */
  if (raw && raw.life && raw.life.cycle && Number(raw.life.cycle.amount) > 0) {
    const c = raw.life.cycle;
    out.life = { cycle: {
      warm: HEX.test(String(c.warm || '')) ? c.warm : '#ffcf8f',
      cold: HEX.test(String(c.cold || '')) ? c.cold : '#16234f',
      amount: n(c.amount, 0.02, 1, 0.35),
      seconds: n(c.seconds, 10, 900, 120)
    } };
  }

  for (const h of (raw && raw.houses) || []) {
    if (!h || typeof h.art !== 'string' || (h.art !== EMPTY_ART && !owns.has(h.art))) {
      dropped.push('a house whose art the game has not adopted: ' + (h && h.art));
      continue;
    }
    if (ROLES.indexOf(h.role) < 0) {
      dropped.push(h.art + ': unknown role ' + h.role);
      continue;
    }
    const one = {
      art: h.art,
      role: h.role,
      x: n(h.x, -400, 1120, 360),
      y: n(h.y, -400, 1680, 640),
      w: n(h.w, 40, 720, 200)
    };
    /* THE PLANE IT STANDS ON, and it is absent from almost every house. The
       feet answer the painter's order on their own for anything standing on
       the ground, which is what a village mostly is; `layer` is for what does
       not — a cloud in FRONT of the roofs although its own feet are up in the
       sky, a fence behind a building it overlaps. A whole number, because it
       is a plane and not a distance, and written only when it is not 0 so the
       declaration stays as short as the village is plain. */
    if (h.layer) one.layer = Math.max(-9, Math.min(9, Math.round(Number(h.layer) || 0)));
    if (h.flip) one.flip = true;
    /* Whole degrees: a village is a painting in perspective and a house is
       stood on a pad, not free-floating type — a tenth of a degree is noise in
       the declaration and invisible on the frame. */
    if (h.rot) one.rot = Math.max(-180, Math.min(180, Math.round(Number(h.rot) || 0)));
    /* An absent `halo` is no halo and an absent `badge` is no badge, so the
       declaration stays as short as the village is plain — and a game that
       wants the default shape writes `true` rather than four numbers. */
    if (h.halo) {
      one.halo = h.halo === true ? true : {
        w: n(h.halo.w, 0.2, 3, 1.05),
        h: n(h.halo.h, 0.05, 1.5, 0.32),
        dy: n(h.halo.dy, -1, 1, 0)
      };
      /* The halo's own colour, written only where the composer chose one: a
         house that says nothing keeps inheriting the game's accent, which is
         what every village shipped before this and what most of them want. */
      if (one.halo !== true && HEX.test(String(h.halo.color || ''))) {
        one.halo.color = h.halo.color;
      }
    }
    if (h.badge) {
      one.badge = h.badge === true ? true : {
        dx: n(h.badge.dx, -1.5, 1.5, 0.32),
        dy: n(h.badge.dy, -2.5, 0.5, -0.62)
      };
    }
    /* TWO OLD SPELLINGS STILL READ. `breath: true` is what the first villages
       were written with, before there was anything to choose between, and
       `notify: "flicker"` is the second — where the house and its light shared
       one field. Each is read as what it named, and written back into the field
       it belongs in now. */
    const pulse = h.notify || (h.breath ? 'breath' : null);
    if (PULSES.indexOf(pulse) >= 0) {
      one.notify = pulse;
      /* Absent unless it was set, so a house that took the pulse as it comes
         says so by carrying nothing: `every` is how long one turn takes and
         `delay` how late the first one starts — the one that keeps two houses
         wearing the same pulse from beating as one object. */
      if (Number(h.every) > 0) one.every = n(h.every, 0.2, PULSE_MAX[pulse] || 60, 2.6);
      if (Number(h.delay) > 0) one.delay = n(h.delay, 0, PULSE_MAX[pulse] || 30, 0);
      /* TWO FIELDS ONLY `cloud` HAS, checked against the pulse and not merely
         against themselves: a `drift` on a house that hops means nothing, and
         writing it would leave a key in the manifest for the next reader to
         wonder about. */
      if (pulse === 'cloud') {
        if (h.drift === 'right') one.drift = 'right';
        if (Number(h.breathEvery) > 0) one.breathEvery = n(h.breathEvery, 0.5, 120, 6.9);
      }
    }
    const lit = h.light || h.notify;
    if (LIGHTS.indexOf(lit) >= 0) {
      one.light = lit;
      /* The two numbers travel with the field they belonged to: a house written
         as `notify: "flicker", every: 3` was naming the LIGHT's beat, so it is
         read as the light's here rather than dropped with the pulse the house
         turns out not to have. */
      const every = h.lightEvery || (one.notify ? 0 : h.every);
      const late = h.lightDelay || (one.notify ? 0 : h.delay);
      if (Number(every) > 0) one.lightEvery = n(every, 0.2, 60, 2.4);
      if (Number(late) > 0) one.lightDelay = n(late, 0, 30, 0);
    }
    /* `always` is the house that runs whether or not anything is waiting behind
       its door, and it governs BOTH fields — a beacon is a beacon whether what
       moves is the tower or the lamp. Outside the two blocks above for exactly
       that reason: a house with only a light is the most common one to want it,
       an empty box laid over a painted lamp. */
    if (h.always && (one.notify || one.light)) one.always = true;
    out.houses.push(one);
  }

  /* THE PAINTER'S ORDER IS THE GROUND'S, not the list's. A village is drawn in
     perspective, so a house whose feet are lower is in front of one whose feet
     are higher — sorting here means the declaration reads in the order it is
     drawn and the shell needs no second opinion about z. `layer` comes FIRST
     and the feet break the tie inside it: it is the composer's hand on the
     order for the objects the ground cannot place, and it stays a sort key
     rather than a `z-index` because a z-index would make every house its own
     stacking context and take the halo out of the ground's light. */
  out.houses.sort((a, b) => ((a.layer || 0) - (b.layer || 0)) || (a.y - b.y));
  return { village: out, dropped };
}

/* ADOPTING FROM THE PAGE, which is the same decision `cut-objects.mjs --adopt`
   writes and the same three lines it writes it with: the role is the sheet's
   own name plus the cut's number (`home07`, `race31`), the value is the file
   in assets/image/object/ without its extension, and `art` sits right after
   `theme` in the manifest. It is here rather than left to the terminal because
   the choice is made while LOOKING at the cut — the composer is where a spare
   object stops being spare — and because the encode has to follow it or the
   village would place a picture no build has.

   It moves no file and copies none, exactly as the CLI does: a cut exists once
   and what a game ships is a line in that game's manifest. The version is NOT
   bumped: adopting adds a role nothing draws yet, and the change that is worth
   a version is the village that draws it. */
function adoptCut(slug, file) {
  if (!fs.existsSync(path.join(OBJECT_DIR, file))) return { error: 'no such cut: ' + file };

  /* TWO CUTS, ONE CLICK, AND THE ROLE IS READ OFF THE NAME EITHER WAY.

     A cut of the game's own sheet drops the slug and the dashes —
     `chainring-home-07` is `home07`, the spelling the houses have always had.
     A SHARED cut drops the `game-` prefix and KEEPS them: `game-cloud-haze-03`
     is `cloud-haze-03`, which camel-cases to CONFIG.art.cloudHaze03 the way
     `ball-blue-01` already does, tells the encoder which box to fit a cloud
     inside (tools/lab/encode-art.mjs) and tells the builder it is village
     material and therefore web-only (tools/build/build.mjs). Stripping the
     dashes there would throw all three away to save two characters. */
  let role = null;
  const own = file.match(new RegExp('^' + slug + '-(.+)-(\\d+)\\.png$'));
  if (own) role = own[1].replace(/-/g, '') + own[2];
  else {
    const sh = file.match(/^game-(.+)-(\d+)\.png$/);
    if (sh && SHELL_SHEETS.has(sh[1])) {
      return { error: 'game-' + sh[1] + ' is the shell\'s own sheet — it ships from ' +
                      'assets/image/shell/ and cannot be adopted by a game' };
    }
    if (sh) role = file.slice(SHARED_PREFIX.length, -4);
  }
  if (!role) return { error: 'not a cut this game can adopt: ' + file };

  const stem = file.slice(0, -4);
  const mf = path.join(GAMES_DIR, slug, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(mf, 'utf8'));
  manifest.art = manifest.art || {};
  manifest.art.objects = manifest.art.objects || {};
  const had = manifest.art.objects[role];
  if (had && had !== stem) return { error: 'the role ' + role + ' already points at ' + had };
  manifest.art.objects[role] = stem;

  const sorted = {};
  Object.keys(manifest.art.objects).sort().forEach((k) => { sorted[k] = manifest.art.objects[k]; });
  manifest.art.objects = sorted;

  const ordered = {};
  Object.keys(manifest).forEach((k) => {
    if (k === 'art') return;
    ordered[k] = manifest[k];
    if (k === 'theme') ordered.art = manifest.art;
  });
  if (!ordered.art) ordered.art = manifest.art;

  fs.writeFileSync(mf, JSON.stringify(ordered, null, 2) + '\n');
  return { role, stem };
}

/* `web.village` goes into the manifest where the rest of `web` already is, and
   the file is rewritten rather than re-serialized wholesale: JSON.stringify
   with two spaces is exactly the shape cut-objects.mjs already writes back, so
   a push leaves a diff of the village and nothing else. */
function pushVillage(slug, village, bump) {
  const file = path.join(GAMES_DIR, slug, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.web = manifest.web || {};
  if (village === null) delete manifest.web.village;
  else manifest.web.village = village;

  let version = null;
  if (bump) {
    const next = bumpPatch(manifest.version);
    if (next) { manifest.version = next; version = next; }
  }
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
  return version;
}

/* What a write leaves to do, done here rather than left for the next person —
   the same two steps serve-text.mjs runs, and for the same reason: the tree
   has to still pass `node tools/update.mjs` when the page is closed. */
async function rebuild(slug) {
  const done = [];
  for (const [label, args] of [
    [`${slug}/index.html`, ['tools/build/build.mjs', `--game=${slug}`]],
    ['catalogues', ['tools/build/gen-catalogues.mjs']]
  ]) {
    try { await run(process.execPath, args, { cwd: ROOT }); done.push(label); }
    catch (e) { done.push(`${label} FAILED — ${String(e.stderr || e.message).trim().split('\n')[0]}`); }
  }
  return done;
}

// ── serving ────────────────────────────────────────────────────────────────

function safeSlug(slug) {
  return /^[a-z0-9-]{1,40}$/.test(String(slug || '')) ? String(slug) : '';
}

/* THE ONE COPY IN THIS TOOL, CHECKED ON EVERY BOOT.

   `lab/village.html` composes in the DOM rather than on a canvas so that what
   is tuned is what ships, and that only holds while its `THE VILLAGE ITSELF`
   block really is `packages/webshell/village.css` verbatim. Nothing enforces
   it — a lab page cannot `@import` a file the builder inlines — so an edit to
   one and not the other is silent, and the page then lies about the thing it
   exists to show. It has happened: a block deleted from the page left every
   house drawn at its natural size, which looks like a bug in the composition
   rather than a missing stylesheet.

   So: compare them, and say so. Not fail — the page is still usable and a
   half-finished village is not worth refusing to open — but say so where it
   will be read, which is the line the tool prints when it starts. */
function checkStyleCopy() {
  const cut = (src, from, to) => {
    const a = src.indexOf(from), b = src.indexOf(to);
    return (a < 0 || b < 0) ? null : src.slice(a, b).replace(/\s+/g, ' ').trim();
  };
  try {
    const css = fs.readFileSync(path.join(ROOT, 'packages/webshell/village.css'), 'utf8');
    const page = fs.readFileSync(path.join(ROOT, 'lab/village.html'), 'utf8');
    const a = cut(css, '/* NO Z-INDEX ON A HOUSE', '@media (prefers-reduced-motion');
    const b = cut(page, '/* NO Z-INDEX ON A HOUSE', '/* END OF THE BLOCK THAT SHIPS');
    if (a && b && a === b) return null;
    if (!a || !b) return 'the shared block could not be found in one of the two files';
    return 'lab/village.html and packages/webshell/village.css have DRIFTED — ' +
           'what you tune here is not what ships';
  } catch (e) { return 'could not compare the stylesheets: ' + e.message; }
}


export async function handle(req, res, p, url) {
  if (p === '/api/catalogue') return json(res, 200, catalogue());

  if (p === '/api/draft' && req.method === 'PUT') {
    const b = JSON.parse(await readBody(req, 4 * 1024 * 1024));
    const slug = safeSlug(b.slug);
    if (!slug) return json(res, 400, { error: 'bad slug' });
    const n = writeDraft(slug, b.comp === null ? null : b.comp);
    console.log(`  draft   ${b.comp === null ? 'removed' : 'saved'}  ${slug}   (${n} in lab/village-presets.json)`);
    return json(res, 200, { ok: true, count: n });
  }

  if (p === '/api/adopt' && req.method === 'PUT') {
    const b = JSON.parse(await readBody(req, 4 * 1024 * 1024));
    const slug = safeSlug(b.slug);
    if (!slug || !catalogue().games[slug]) return json(res, 400, { error: 'unknown game' });
    const file = String(b.file || '');
    if (!/^[a-z0-9.-]+\.png$/.test(file)) return json(res, 400, { error: 'bad file' });
    const r = adoptCut(slug, file);
    if (r.error) return json(res, 400, r);
    /* The encode is what makes the role real: the build reads
       assets/image/embed/ and never encodes, so a role with no WebP beside it
       is a house the village can place and no build can draw. */
    try { await run(process.execPath, ['tools/lab/encode-art.mjs', slug], { cwd: ROOT }); }
    catch (e) { return json(res, 500, { error: 'encode-art failed — ' + String(e.stderr || e.message).trim().split('\n')[0] }); }
    console.log(`  adopted ${r.role}  ←  ${file}   (games/${slug}/manifest.json, encoded)`);
    /* TWO SPELLINGS OF ONE THING, and the page needs both: `key` is what the
       manifest and the WebP are named, `role` is what CONFIG.art will call it
       and therefore what a house in the village is placed under. They are the
       same word for `home07` and differ the moment a role carries a dash
       (`cloud-haze-03` → cloudHaze03), which is why neither is derived twice. */
    return json(res, 200, { ok: true, key: r.role, role: camel(r.role), file: slug + '-' + r.role + '.webp' });
  }

  if (p === '/api/manifest' && req.method === 'PUT') {
    const b = JSON.parse(await readBody(req, 4 * 1024 * 1024));
    const slug = safeSlug(b.slug);
    const game = catalogue().games[slug];
    if (!game) return json(res, 400, { error: 'unknown game' });

    let village = null, dropped = [];
    if (b.comp !== null) ({ village, dropped } = cleanVillage(b.comp, game));
    if (village && !village.houses.length) {
      return json(res, 400, { error: 'no house survived the check', dropped });
    }

    const version = pushVillage(slug, village, b.bump !== false);
    const rebuilt = await rebuild(slug);
    console.log(`  pushed  games/${slug}/manifest.json  web.village` +
                (village ? ` — ${village.houses.length} houses` : ' removed') +
                (version ? `, v${version}` : ''));
    if (dropped.length) dropped.forEach((d) => console.log('    dropped: ' + d));
    return json(res, 200, { ok: true, version, dropped, rebuilt, village });
  }

  // static: the page itself, and the two directories it is allowed to read.
  let file = null;
  if (p === '/' || p === '/village.html') file = path.join(ROOT, 'lab', 'village.html');
  else if (p.startsWith('/assets/') || p.startsWith('/lab/')) file = path.join(ROOT, p.slice(1));
  if (sendFile(res, file, [path.join(ROOT, 'assets'), path.join(ROOT, 'lab')])) return;
  notFound(res, p);
}

function start() {
  const cat = catalogue();
  const withArt = Object.values(cat.games).filter((g) => g.houses.length).length;
  console.log(`  ${Object.keys(cat.games).length} games, ${withArt} with a house sheet already cut`);
  console.log('  drafts in lab/village-presets.json — push writes web.village and rebuilds');
  const drift = checkStyleCopy();
  if (drift) console.log('\n  !! ' + drift + '\n');
}

if (isMain(import.meta.url)) {
  listen(handle, {
    port: portArg(8094), label: 'village composer', restart: 'pkill -f serve-village.mjs && make village',
    ready(url) { console.log(`\n  village composer   ${url}`); start(); console.log(''); }
  });
}
