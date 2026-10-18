#!/usr/bin/env node
/*
  serve-events — the feedback bench, at http://localhost:8092/

    node tools/lab/serve-events.mjs            (or: make events)
    node tools/lab/serve-events.mjs --port=9000
    make lab                                   → http://localhost:8095/events/

  The bench is two pages over the same scan. lab/game-events-message.html (/)
  lists every callout and notification a game fires; lab/game-events-sound.html
  (/sound) every cue it plays, one card per clip. Both fire them INSIDE that
  game's own web build, loaded in an iframe next to the list: the real motor,
  the real SKIN, the real samples. So it needs a
  server for the two things a file:// page cannot do — read the sources back
  (tools/lab/scan-events.mjs) and serve a built game from an origin the page
  can script.

  Save a game.js or anything in packages/ and it rebuilds (~0.3 s) and reloads,
  like tools/lab/serve-site.mjs.

  CHECKED is the other thing it writes, into lab/events-review.json: a callout,
  a notice or a cue line seen and heard and signed off (POST /api/check), keyed
  by the call's checkId (scan-events.mjs), so an edit to the call — or a re-cut
  of the clip it plays — reads as unchecked again. A game every line of which is
  checked is green in the picker.

  APPLY is the one route that writes the GAME (POST /api/apply → tools/lab/apply-events.mjs):
  a re-styled callout and a swapped clip go back into games/<slug>/game.js (or
  template/game.js, the picker's first entry — the starter game every new game copies), and
  the save the page just made is what triggers the rebuild above — so the next
  frame is played on the change. Everything else here reads and plays.

  More pages ride on the same build: lab/sound-kit.html (/kit), the house
  sound kit the shell plays in every game; lab/sound-library.html (/library)
  and lab/overlay-pop.html (/pop), the motor's Pop styles fired one by one;
  lab/holepocalypse-fx.html (/hole-fx), every sprite and effect of that game's
  round played on demand through its Game.lab handle.

  Both pages add what a flat ground cannot show: the MOMENT of the game an
  event belongs to. They record the game being played (the canvas, a second on
  each side of every event of their kind), keep each capture in
  lab/events-clips/<slug>/ (ignored by git — playing again makes them again),
  and loop it under the row being judged. Their routes are /api/offset,
  /api/clips, /api/clip, /api/clip-drop and /clips/…; /icons/<slug>.png is the
  game's thumb, which the sound page puts on a kit variant several games play;
  /api/sfx-like is the library's files whose wave looks like a cut, which the
  kit card's editor offers as alternatives (tools/lab/shape-sfx.mjs). A kit
  variant edited on its card rides on /api/apply as `roles`.
  The message page also hands /api/apply a `keepEn` list — a callout kept in
  English on the French screen (tools/lab/keep-english.mjs).

  `make lab` runs this same script behind its proxy, under /events/
  (tools/lab/serve-lab.mjs), which is why the page addresses it with relative
  urls.
*/

import { readFile, writeFile, stat, readdir, mkdir, unlink } from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { games, units, scanGame as scanUnit, clearCache, sfxFiles, soundPack, fileForNote, shellCues, SFX_DIR, ROOT, SHELL_FILES } from './scan-events.mjs';
import { shootShell } from './shoot-shell.mjs';
import { applyEdits } from './apply-events.mjs';
import { keepEnglish } from './keep-english.mjs';
import { readKit, writeKit, cutKit, kitUsers, mapKeys, editVariants, normalTake, KIT_DIR } from './cut-kit.mjs';
import { shapes, alike } from './shape-sfx.mjs';
import { createHash } from 'node:crypto';
import { isMain, portArg, listen, json, notFound, readJson, sendFile, reloadHub, MIME } from '../lib/serve.mjs';

const BUILD = path.join(ROOT, 'dist', 'web');

/* ── THE SHELL, as a unit of its own ──────────────────────────────────────
   What the motor and the web shell play in every game — the end screen, the
   round's live stars, the meta layer (scan-events.mjs, shellCues) — is no
   game's, so it is the picker's own entry, `shell`, after the template: its
   lines are checked once, under review.shell, and filmed once, under
   lab/events-clips/shell/ (POST /api/shoot-shell). It has no source to apply
   to: only its roles' takes are written, into kit.json. */
const SHELL_UNIT = 'shell';
async function scanGame(slug) {
  if (slug !== SHELL_UNIT) return scanUnit(slug);
  const calls = await shellCues();
  return {
    slug: SHELL_UNIT, title: 'Shell — every game', version: null, targets: [], where: 'packages/',
    beats: [], calls, sounds: [], warnings: [], shell: [], music: null, textEnv: {}, motor: [],
    counts: { pop: 0, fx: 0, sound: calls.length, notify: 0, beats: 0 }
  };
}
const isUnit = async (slug) => slug === SHELL_UNIT || (await units()).includes(slug);
const PAGE = path.join(ROOT, 'lab', 'game-events-message.html');
const PAGE_SOUND = path.join(ROOT, 'lab', 'game-events-sound.html');
const ICONS = path.join(ROOT, 'assets', 'image', 'icon', 'thumb');
const CLIPS = path.join(ROOT, 'lab', 'events-clips');
const LIBRARY = path.join(ROOT, 'lab', 'sound-library.html');
const KIT_PAGE = path.join(ROOT, 'lab', 'sound-kit.html');
const POP = path.join(ROOT, 'lab', 'overlay-pop.html');
const HOLE_FX = path.join(ROOT, 'lab', 'holepocalypse-fx.html');
const REVIEW = path.join(ROOT, 'lab', 'events-review.json');
const SFX = SFX_DIR;

const reload = reloadHub('serve-events.mjs: the build changed, take the page back to the same game.');

// ── the web build, which is what the iframes play ──
let building = false, queued = false;

function build() {
  if (building) { queued = true; return; }
  building = true;
  // --lab: the template too (dist/web/template/), the picker's first entry.
  const child = spawn(process.execPath, [path.join('tools', 'build', 'build.mjs'), '--target=web', '--lab'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let err = '';
  child.stderr.on('data', (d) => { err += d; });
  child.stdout.on('data', () => {});
  child.on('close', (code) => {
    building = false;
    clearCache();
    const stamp = new Date().toTimeString().slice(0, 8);
    if (code === 0) {
      console.log(`  ${stamp}  rebuilt`);
      reload.broadcast('reload');
      // The scans were just dropped: read every game again now, not under the page's first question.
      units().then((all) => all.reduce((p, slug) => p.then(() => scanGame(slug)).catch(() => {}), Promise.resolve())).catch(() => {});
    }
    else console.error(`  ${stamp}  BUILD FAILED\n${err.trim()}`);
    if (queued) { queued = false; build(); }
  });
}

function start() {
  let timer = null;
  for (const dir of ['games', 'packages', 'lab', 'template']) {
    const full = path.join(ROOT, dir);
    if (!existsSync(full)) continue;
    try {
      watch(full, { recursive: true }, (_e, file) => {
        if (!file || file.includes('index.html') || path.basename(file).startsWith('.')) return;
        // A check is not a change to the build: it would reload the page under the click.
        if (path.basename(file) === path.basename(REVIEW)) return;
        // Nor is a recorded clip, nor the parked French of a word kept in English.
        if (file.includes('events-clips') || path.basename(file) === 'events-keep-en.json') return;
        clearTimeout(timer);
        timer = setTimeout(build, 120);
      });
    } catch { console.error(`  cannot watch ${dir}`); }
  }
  console.log('watching      games  packages  lab  template');
  build();
  // The shapes the kit card's alternatives are read from: ~10 s the first time, cached after.
  shapes({ log: (l) => console.log('  ' + l) }).catch((e) => console.error('  shape-sfx: ' + e.message));
}

/* ── checked marks ───────────────────────────────────────────────────────
   { <slug>: { <checkId>: { at, what } } }. `what` is a label for a human
   reading the file — "Pop.show L564 collect()" — never what a mark is matched
   on: the id is. */
async function readReview() {
  try { return JSON.parse(await readFile(REVIEW, 'utf8')); } catch { return {}; }
}
// Sorted and indented, so a diff of the file reads.
async function writeReview(store) {
  const out = {};
  for (const g of Object.keys(store).sort()) {
    const ids = Object.keys(store[g] || {}).sort();
    if (!ids.length) continue;
    out[g] = {};
    for (const id of ids) out[g][id] = store[g][id];
  }
  await writeFile(REVIEW, JSON.stringify(out, null, 2) + '\n');
  return out;
}
const checkable = (g) => g.calls.filter((c) => c.checkId);
function statusOf(g, marks) {
  const m = marks || {};
  const all = checkable(g);
  const side = (kinds) => {
    const pool = all.filter((c) => kinds.includes(c.kind));
    return { checked: pool.filter((c) => m[c.checkId]).length, total: pool.length };
  };
  const view = side(['pop', 'notify']), sound = side(['sound']);
  const checked = view.checked + sound.checked, total = view.total + sound.total;
  return { checked, total, view, sound, done: total > 0 && checked === total };
}

const markLabel = (c) => `${c.name} ${c.inherited ? c.where.split('/').pop() + ':' : 'L'}${c.line}${c.fn ? ' ' + c.fn + '()' : ''}`;

/* ── a kit line is checked on ONE cut of its variant ─────────────────────
   A line that plays a kit variant (`sfx` in the manifest) is heard on the
   takes that variant has at the time: change them — on /kit, or on a card of
   any game playing it — and every game's check on it is a check of a sound
   nobody has heard yet. So the mark keeps the variant's fingerprint (`kit`),
   and a mark whose fingerprint is not the variant's any more is STALE: it
   reads unchecked, and the sound page says why. A mark written before this
   existed is stamped with the cut it stands on the first time the kit is
   written (stampKitMarks), so the next change does undo it. */
// The fingerprint of a cut: its takes as kit.json writes them, so a draft and the same takes saved are one.
function takesHash(takes) {
  return createHash('sha1').update(JSON.stringify((takes || []).map(normalTake))).digest('hex').slice(0, 10);
}
function variantHash(kit, id) {
  const [role, name = 'default'] = String(id).split('/');
  const v = kit.roles[role] && kit.roles[role].variants[name];
  return v ? takesHash(v.takes) : null;
}
function kitOf(g, call) {
  if (!call || call.kind !== 'sound' || !call.soundLiteral) return null;
  if (call.method === 'ui') return call.sound;              // a shell role, played by its name
  const s = g.sounds.find((x) => x.key === call.sound);
  return (s && s.kit) || null;
}
// A game's marks split in two: those that still stand, and the ids of the stale ones.
function liveMarks(g, marks, kit) {
  const byId = new Map(checkable(g).map((c) => [c.checkId, c]));
  const live = {}, stale = [], staleKit = {};
  for (const [id, m] of Object.entries(marks || {})) {
    const k = kitOf(g, byId.get(id));
    if (k && m.kit && m.kit !== variantHash(kit, k)) { stale.push(id); staleKit[id] = m.kit; }
    else live[id] = m;
  }
  return { live, stale, staleKit };
}
// Every legacy mark on a kit line, stamped with the cut it stands on — before the kit is written.
async function stampKitMarks() {
  const kit = await readKit(), review = await readReview();
  let n = 0;
  const all = [...(await units()), SHELL_UNIT];
  for (const slug of Object.keys(review)) {
    if (!all.includes(slug)) continue;
    const g = await scanGame(slug);
    const byId = new Map(checkable(g).map((c) => [c.checkId, c]));
    for (const [id, m] of Object.entries(review[slug])) {
      const k = kitOf(g, byId.get(id));
      if (k && !m.kit) { m.kit = variantHash(kit, k); n++; }
    }
  }
  if (n) await writeReview(review);
  return n;
}
/* Who has signed off on each variant: { "<id>": { "<slug>": "ok" | "stale" | "part" } }
   — ok, every line of that game playing it checked on its current cut; stale,
   all of them checked but some on an older cut; part, some checked. */
async function kitChecked(kit) {
  const users = await kitUsers(), review = await readReview(), out = {}, all = await units();
  // Each game read once, however many of its keys play the kit.
  const seen = new Map();
  const read = async (slug) => {
    if (!seen.has(slug)) {
      const g = await scanGame(slug);
      seen.set(slug, { g, ...liveMarks(g, review[slug], kit) });
    }
    return seen.get(slug);
  };
  for (const [id, list] of Object.entries(users)) {
    const tally = {};
    for (const u of list) {
      const [slug, key] = u.split('.');
      if (!all.includes(slug)) continue;
      const { g, live, stale } = await read(slug);
      const t = tally[slug] || (tally[slug] = { total: 0, ok: 0, stale: 0 });
      for (const c of g.calls) {
        if (c.kind !== 'sound' || c.inherited || !c.soundLiteral || c.sound !== key || !c.checkId) continue;
        t.total++;
        if (live[c.checkId]) t.ok++;
        else if (stale.includes(c.checkId)) t.stale++;
      }
    }
    for (const [slug, t] of Object.entries(tally)) {
      if (!t.total) continue;
      const state = t.ok === t.total ? 'ok' : t.ok + t.stale === t.total && t.stale ? 'stale' : t.ok ? 'part' : null;
      if (state) (out[id] = out[id] || {})[slug] = state;
    }
  }
  return out;
}
/* The kit and who plays it is instant; who signed it off reads games, so it
   is its own route (/api/kit-checked) and the pages paint it when it lands. */
async function kitPayload() {
  return { ...(await readKit()), users: await kitUsers() };
}

let checking = Promise.resolve();
async function check(slug, body) {
  const g = await scanGame(slug);
  const byId = new Map(checkable(g).map((c) => [c.checkId, c]));
  const ids = [].concat(body.ids || []);
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) return { error: 'the source moved under the page — reload it (' + missing.length + ' stale)' };
  const review = await readReview();
  const mine = {};
  for (const [id, m] of Object.entries(review[slug] || {})) if (byId.has(id)) mine[id] = m;
  const at = new Date().toISOString().slice(0, 10), kit = await readKit();
  for (const id of ids) {
    const c = byId.get(id), k = kitOf(g, c);
    /* A kit line is checked on the cut it was HEARD on: the page says which
       when that is not the shipped one — a draft of the variant, or another
       variant the key is being moved to (`heard`, the takes) — so the check
       still stands once apply has written that cut. */
    const heard = body.heard && body.heard[id];
    if (body.on) mine[id] = k || heard ? { at, what: markLabel(c), kit: heard ? takesHash(heard) : variantHash(kit, k) } : { at, what: markLabel(c) };
    else delete mine[id];
  }
  review[slug] = mine;
  const saved = await writeReview(review);
  const { live, stale, staleKit } = liveMarks(g, saved[slug], kit);
  return { review: live, stale, staleKit, status: statusOf(g, live) };
}

/* ── the clips of the second version ─────────────────────────────────────
   lab/events-clips/<slug>/index.json:
     { clips: { <file>: { dur, at, when, events: [{ id, name, line, fn, t }] } },
       byId:  { <checkId>: <file> } }
   `byId` is what a row asks; `events` is everything that fired inside the
   window, at its own time, so a loop replays the whole moment and not only
   the line being judged. */
async function sourceOffset(slug) {
  const src = await readFile(path.join(ROOT, slug === 'template' ? 'template' : path.join('games', slug), 'game.js'), 'utf8');
  const html = await readFile(path.join(BUILD, slug, 'index.html'), 'utf8').catch(() => '');
  const m = /game\.[0-9a-f]+\.js/.exec(html);
  if (!m) return { error: 'no web build of ' + slug };
  const built = (await readFile(path.join(BUILD, slug, m[0]), 'utf8')).replace(/^"use strict";\n/, '');
  const at = src.indexOf(built.slice(0, 2000));
  if (at < 0) return { file: m[0], error: 'the built game no longer matches its source — wait for the rebuild' };
  // Built line 1 is "use strict", so built line n is source line n - 1 + (lines before section 6).
  return { file: m[0], offset: src.slice(0, at).split('\n').length - 2, shell: await shellOffsets() };
}

/* Where the shell's own files sit in the shared scripts of the split build
   (engine.<hash>.js, boot.<hash>.js): each is copied whole, so one line number
   per file maps a frame of the built script back to its source line — which is
   how the recorder catches a Sound.ui the shell plays (scan-events.mjs,
   shellCues). [{ file, where, from, lines }], `from` the built line of source
   line 1. */
async function shellOffsets() {
  const out = [];
  const built = (await readdir(BUILD).catch(() => [])).filter((f) => /\.[0-9a-f]+\.js$/.test(f));
  for (const where of SHELL_FILES) {
    const src = await readFile(path.join(ROOT, where), 'utf8');
    for (const file of built) {
      const text = await readFile(path.join(BUILD, file), 'utf8');
      const at = text.indexOf(src);
      if (at < 0) continue;
      out.push({ file, where, from: text.slice(0, at).split('\n').length, lines: src.split('\n').length });
      break;
    }
  }
  return out;
}

async function readClips(slug) {
  try { return JSON.parse(await readFile(path.join(CLIPS, slug, 'index.json'), 'utf8')); }
  catch { return { clips: {}, byId: {} }; }
}

async function writeClips(slug, idx) {
  await mkdir(path.join(CLIPS, slug), { recursive: true });
  await writeFile(path.join(CLIPS, slug, 'index.json'), JSON.stringify(idx, null, 1) + '\n');
}

let clipping = Promise.resolve();
function saveClip(slug, body) {
  const run = clipping.then(async () => {
    const buf = Buffer.from(String(body.webm || ''), 'base64');
    if (buf.length < 100) return { error: 'empty clip' };
    const file = createHash('sha1').update(buf).digest('hex').slice(0, 12) + '.webm';
    await mkdir(path.join(CLIPS, slug), { recursive: true });
    await writeFile(path.join(CLIPS, slug, file), buf);
    const idx = await readClips(slug);
    const events = [].concat(body.events || []).filter((e) => e && e.id);
    // `screen`: the frame as the player saw it, the DOM included — its callouts are in the picture.
    idx.clips[file] = { dur: Number(body.dur) || 0, at: Number(body.at) || 0, when: new Date().toISOString().slice(0, 16), events,
      ...(body.screen ? { screen: true } : {}) };
    const claim = new Set([].concat(body.claim || []));
    for (const e of events) if (claim.has(e.id) || !idx.byId[e.id]) idx.byId[e.id] = file;
    await pruneClips(slug, idx);
    await writeClips(slug, idx);
    const stamp = new Date().toTimeString().slice(0, 8);
    console.log(`  ${stamp}  clip ${slug}/${file} — ${events.length} event${events.length > 1 ? 's' : ''}, ${(buf.length / 1024).toFixed(0)} KB`);
    return { file, index: idx };
  });
  clipping = run.catch(() => {});
  return run.catch((e) => ({ error: String(e.message || e) }));
}

// A clip no row points at any more is only bytes.
async function pruneClips(slug, idx) {
  const used = new Set(Object.values(idx.byId));
  for (const f of Object.keys(idx.clips)) {
    if (used.has(f)) continue;
    delete idx.clips[f];
    await unlink(path.join(CLIPS, slug, f)).catch(() => {});
  }
  // And a file the index never heard of (a crash between two writes).
  for (const f of await readdir(path.join(CLIPS, slug)).catch(() => [])) {
    if (f.endsWith('.webm') && !idx.clips[f]) await unlink(path.join(CLIPS, slug, f)).catch(() => {});
  }
}

function dropClip(slug, file) {
  const run = clipping.then(async () => {
    const idx = await readClips(slug);
    for (const [id, f] of Object.entries(idx.byId)) if (f === file) delete idx.byId[id];
    await pruneClips(slug, idx);
    await writeClips(slug, idx);
    return { index: idx };
  });
  clipping = run.catch(() => {});
  return run.catch((e) => ({ error: String(e.message || e) }));
}

/* An apply rewrites calls, and a call's id is its source: every line it
   touched — a volume, a style, the kit variant its key plays — would come
   back with a new id and its mark and its clip left behind, so the lines
   that were checked before the apply would read unchecked after it. The
   apply is the bench's own write, made by someone who heard the line, so
   what it changes keeps its mark: each call of the source as it was is
   paired with the call that replaced it — by file, function and name, in
   order, the lines it removed left out — and the mark and the recorded clip
   move to the new id. A removed line takes its mark and its clip with it. */
async function carryMarks(slug, before, after, goneList) {
  const gone = new Set(goneList || []);
  const isGone = (c) => gone.has(c.line + '|' + c.name);
  const groups = (calls, skip) => {
    const m = new Map();
    for (const c of calls) {
      if (!c.checkId || c.inherited || (skip && skip(c))) continue;
      const k = c.where + '\n' + c.name + '\n' + (c.fn || '');
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(c);
    }
    return m;
  };
  const olds = groups(before.calls, isGone), news = groups(after.calls);
  const moved = new Map();
  for (const [k, list] of olds) {
    const now = news.get(k) || [];
    if (list.length === now.length) { list.forEach((o, i) => moved.set(o.checkId, now[i])); continue; }
    // A count that moved some other way: only the calls whose source is unchanged pair up.
    const used = new Set();
    for (const o of list) {
      const n = now.find((x) => !used.has(x) && x.source === o.source);
      if (n) { used.add(n); moved.set(o.checkId, n); }
    }
  }
  const dropped = new Set(before.calls.filter((c) => c.checkId && isGone(c)).map((c) => c.checkId));

  const review = await readReview();
  const mine = review[slug] || {}, next = {};
  let carried = 0, cleared = 0;
  for (const [id, m] of Object.entries(mine)) {
    if (dropped.has(id)) { cleared++; continue; }
    const n = moved.get(id);
    if (n && n.checkId !== id) { next[n.checkId] = { ...m, what: markLabel(n) }; carried++; }
    else next[id] = m;
  }
  review[slug] = next;
  await writeReview(review);

  await (clipping = clipping.then(async () => {
    const idx = await readClips(slug);
    let touched = false;
    for (const [id, f] of Object.entries(idx.byId)) {
      if (dropped.has(id)) { delete idx.byId[id]; touched = true; continue; }
      const n = moved.get(id);
      if (n && n.checkId !== id && !idx.byId[n.checkId]) { idx.byId[n.checkId] = f; delete idx.byId[id]; touched = true; }
    }
    if (touched) { await pruneClips(slug, idx); await writeClips(slug, idx); }
  }).catch(() => {}));
  return { carried, cleared };
}

async function page(res, file) {
  const html = await readFile(file, 'utf8');
  res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
  res.end(reload.inject(html));
}

export async function handle(req, res, p, url) {
  if (p === '/__reload') return reload.handle(req, res);

  if (p === '/' || p === '/index.html') return page(res, PAGE);

  // The sound side: one card per clip, and the game's own moment looped under it.
  if (p === '/sound') return page(res, PAGE_SOUND);

  // A game's thumb, for the kit variants several games play.
  if (p.startsWith('/icons/')) {
    if (sendFile(res, path.join(ICONS, path.basename(p.slice('/icons/'.length))), [ICONS])) return;
    return notFound(res, p);
  }

  /* Where a line of the built game.<hash>.js sits in the SOURCE: the split
     build writes section 6 verbatim behind a "use strict" line, so one offset
     maps every line — and a call caught in the running game is named by the
     line scan-events gives it. */
  if (p === '/api/offset') {
    const slug = url.searchParams.get('game');
    if (!(await isUnit(slug))) return notFound(res, 'game ' + slug);
    // The shell unit plays a game it does not own: only the shared scripts are its.
    if (slug === SHELL_UNIT) return json(res, 200, { file: null, offset: 0, shell: await shellOffsets() });
    return json(res, 200, await sourceOffset(slug));
  }

  /* Film the shell's sounds in a game's build — a headless Chrome playing a
     scenario, the DOM included (tools/lab/shoot-shell.mjs) — and file each
     clip under the shell unit, as a REC capture would be. */
  if (p === '/api/shoot-shell' && req.method === 'POST') {
    const body = await readJson(req, 1e4);
    const game = body && body.game;
    if (!(await units()).includes(game) || game === 'template') return notFound(res, 'game ' + game);
    const stamp = new Date().toTimeString().slice(0, 8);
    try {
      const shot = await shootShell({
        base: 'http://127.0.0.1:' + req.socket.localPort, game,
        shell: await shellCues(), shellMap: await shellOffsets(),
        log: (l) => console.log(`  ${stamp} ${l}`)
      });
      let index = null;
      for (const c of shot.clips) {
        const r = await saveClip(SHELL_UNIT, { webm: c.webm.toString('base64'), dur: c.dur, at: c.at, events: c.events, claim: c.claim, screen: true });
        if (r.error) throw new Error(r.error);
        index = r.index;
      }
      console.log(`  ${stamp}  shell shot in ${game}: ${shot.clips.length} clips, ${shot.heard.length} lines`);
      return json(res, 200, { clips: shot.clips.length, heard: shot.heard, steps: shot.steps, frames: shot.frames, index: index || await readClips(SHELL_UNIT) });
    } catch (e) { return json(res, 200, { error: String(e.message || e) }); }
  }

  if (p === '/api/clips') {
    const slug = url.searchParams.get('game');
    if (!(await isUnit(slug))) return notFound(res, 'game ' + slug);
    return json(res, 200, await readClips(slug));
  }

  /* One capture: the webm, base64 in a JSON body, and what fired in it. The
     file is named by its content, and every event of the window that had no
     clip yet points at it — or every one of them, on a re-record. */
  if (p === '/api/clip' && req.method === 'POST') {
    const body = await readJson(req, 3e7);
    const slug = body && body.game;
    if (!(await isUnit(slug))) return notFound(res, 'game ' + slug);
    return json(res, 200, await saveClip(slug, body));
  }

  if (p === '/api/clip-drop' && req.method === 'POST') {
    const body = await readJson(req, 1e5);
    const slug = body && body.game;
    if (!(await isUnit(slug))) return notFound(res, 'game ' + slug);
    return json(res, 200, await dropClip(slug, body.file));
  }

  if (p.startsWith('/clips/')) {
    const [slug, file] = p.slice('/clips/'.length).split('/');
    const dir = path.join(CLIPS, path.basename(slug || ''));
    if (file && sendFile(res, path.join(dir, path.basename(file)), [CLIPS], { 'Cache-Control': 'no-store' })) return;
    return notFound(res, p);
  }

  // The library page: every file of assets/audio/sfx/, by ear, beside the bench.
  if (p === '/library') return page(res, LIBRARY);

  // The Pop catalogue: every style of the motor's table, fired in a game's build.
  if (p === '/pop') return page(res, POP);

  // Holepocalypse's sprite and effect bench: the round driven through Game.lab.
  if (p === '/hole-fx') return page(res, HOLE_FX);

  /* The house sound kit: what the shell sounds like in every game, one role at
     a time (lab/sound-kit.html, tools/lab/cut-kit.mjs). A save writes kit.json,
     re-cuts and levels every take, and rebuilds, so the games the bench plays
     are wearing the kit that was just picked. */
  if (p === '/kit') return page(res, KIT_PAGE);
  /* With the kit, who plays each variant: the games whose manifest maps a key
     to it (`sfx`), so a take is never changed without knowing who hears it. */
  if (p === '/api/kit' && req.method === 'GET') return json(res, 200, await kitPayload());
  if (p === '/api/kit-checked') return json(res, 200, await kitChecked(await readKit()));
  /* The fingerprint of cuts the page holds — a draft, a variant a key is being
     moved to — so it can tell a check given on what a line plays NOW from one
     given on what it played before: { list: [takes, …] } → [hash, …]. */
  if (p === '/api/kit-hash' && req.method === 'POST') {
    const body = await readJson(req, 1e5);
    return json(res, 200, [].concat((body && body.list) || []).map((t) => takesHash(t)));
  }
  if (p === '/api/kit' && req.method === 'POST') {
    const body = await readJson(req, 1e5);
    const log = [];
    try {
      await (checking = checking.then(stampKitMarks).catch(() => {}));
      await writeKit(body);
      await cutKit({ log: (l) => log.push(l.trim()) });
    } catch (e) { return json(res, 200, { error: String(e.message || e) }); }
    const stamp = new Date().toTimeString().slice(0, 8);
    console.log(`  ${stamp}  kit re-cut (${log.length} takes)`);
    build();
    return json(res, 200, { kit: await kitPayload(), log });
  }
  if (p.startsWith('/kit/')) {
    const file = path.join(KIT_DIR, path.basename(p.slice('/kit/'.length)));
    if (sendFile(res, file, [KIT_DIR], { 'Cache-Control': 'no-store' })) return;
    return notFound(res, p);
  }

  /* The picker: every game, and the TEMPLATE first. The end screen's own
     sounds are no longer its clips but the house kit's (/kit). */
  if (p === '/api/games') {
    const out = [], review = await readReview(), kit = await readKit();
    const all = await units();
    all.splice(all.indexOf('template') + 1, 0, SHELL_UNIT);
    for (const slug of all) {
      const g = await scanGame(slug);
      out.push({
        slug: g.slug, title: g.title, version: g.version, counts: g.counts,
        warnings: g.warnings.length, built: slug === SHELL_UNIT || existsSync(path.join(BUILD, slug, 'index.html')),
        status: statusOf(g, liveMarks(g, review[slug], kit).live)
      });
    }
    return json(res, 200, out);
  }

  if (p === '/api/events') {
    const slug = url.searchParams.get('game');
    if (!(await isUnit(slug))) return notFound(res, 'game ' + slug);
    const g = await scanGame(slug);
    const { live, stale, staleKit } = liveMarks(g, (await readReview())[slug] || {}, await readKit());
    return json(res, 200, { ...g, review: live, stale, staleKit, status: statusOf(g, live) });
  }

  /* One mark, set or taken back — or several at once, which is what a clip's
     card does for every line under it. A mark is only ever given on an id the
     source has NOW; whatever this game held for ids it no longer has is
     dropped on the way, since nothing can ever match it again. */
  if (p === '/api/check' && req.method === 'POST') {
    const body = await readJson(req, 1e5);
    const slug = body && body.game;
    if (!(await isUnit(slug))) return notFound(res, 'game ' + slug);
    // One at a time: each click is a read-modify-write, and clicks come in bursts.
    const run = checking.then(() => check(slug, body));
    checking = run.catch(() => {});
    return json(res, 200, await run.catch((e) => ({ error: String(e.message || e) })));
  }

  /* The sfx library — every file in assets/audio/sfx/, whether a game uses
     it or not, with what index.json knows about each (category, seconds,
     pack — tools/lab/index-sfx.mjs). The label is the file's name without
     its extension, which is exactly how a game writes its provenance
     comment, so a card can be pasted straight into an ASSETS block, and it
     is also how a clip is matched back to the file it was cut from. */
  if (p === '/api/sfx') {
    const out = [];
    for (const f of await sfxFiles()) {
      const st = await stat(path.join(SFX, f.file));
      const { re, ...rest } = f;
      out.push({ ...rest, size: st.size });
    }
    return json(res, 200, out);
  }

  /* The files whose WAVE looks like a cut — a kit card's alternatives
     (tools/lab/shape-sfx.mjs): ?file=<stem>&start=&length=&not=<stem>,<stem>.
     The first call waits for the shapes to be read. */
  if (p === '/api/sfx-like') {
    const lib = await sfxFiles();
    const byStem = new Map(lib.map((f) => [f.stem, f]));
    const f = byStem.get(url.searchParams.get('file') || '');
    if (!f) return notFound(res, 'sfx ' + url.searchParams.get('file'));
    const not = (url.searchParams.get('not') || '').split(',').map((x) => byStem.get(x)).filter(Boolean).map((x) => x.file);
    const near = alike(await shapes(), f.file, Number(url.searchParams.get('start')) || 0,
      Number(url.searchParams.get('length')) || 0.3, { n: Number(url.searchParams.get('n')) || 10, not });
    const byFile = new Map(lib.map((x) => [x.file, x]));
    return json(res, 200, near.map((x) => ({ ...x, stem: byFile.get(x.file).stem })));
  }

  /* Which game cuts a clip from which file — "chainring.hit" — read off the
     provenance notes alone, so the library page can say who already uses a
     sound without scanning every call of every game. */
  if (p === '/api/sfx-usage') {
    const lib = await sfxFiles();
    const out = {};
    for (const slug of await games()) {
      let src;
      try { src = await readFile(path.join(ROOT, 'games', slug, 'game.js'), 'utf8'); } catch { continue; }
      const pack = soundPack(src);
      for (const k of pack.keys) {
        if (k.key === 'music') continue;
        const file = fileForNote(pack.notes[k.key], lib);
        if (file) (out[file] = out[file] || []).push(`${slug}.${k.key}`);
      }
    }
    return json(res, 200, out);
  }

  /* The one route that writes. The page hands over what it changed — a call
     argument, a clip re-cut from another file — and gets back what landed and
     what was refused, line by line. The write trips the watcher above, so the
     rebuild and the reload are the same ones a hand edit gets. */
  if (p === '/api/apply' && req.method === 'POST') {
    const plan = await readJson(req, 1e6);
    if (!(await isUnit(plan && plan.game))) return notFound(res, 'game ' + (plan && plan.game));
    const stamp = new Date().toTimeString().slice(0, 8);
    let out, before, roles = [];
    try {
      /* A kit variant tuned on its card (the kit card's own editor), or forked
         into a new one: kit.json first — a key below may be mapped to the new
         variant — then only those takes re-cut. The kit is every game's, so it
         moves no game's version; the cut files are under assets/, which the
         watcher does not see, hence the build called here. */
      if (plan.roles && plan.roles.length) {
        await (checking = checking.then(stampKitMarks).catch(() => {}));
        roles = await editVariants(plan.roles);
        const log = [];
        await cutKit({ log: (l) => log.push(l.trim()), only: roles });
        console.log(`  ${stamp}  kit ${roles.join(', ')} re-cut (${log.length} takes)`);
      }
      clearCache();
      before = await scanGame(plan.game);
      out = plan.game === SHELL_UNIT
        ? { slug: SHELL_UNIT, applied: [], skipped: [], written: false, version: null, gone: [] }
        : await applyEdits(plan.game, plan);
      for (const id of roles) out.applied.unshift({ what: 'kit ' + id, value: 'written to kit.json and re-cut, for every game that plays it' });
      if (roles.length) build();
      /* A key handed to the kit (the clip card's kit selector): the manifest
         maps it, its clip leaves game.js — after the edits above, which read
         the source as it was, and with the version moved once for both. */
      if (plan.kit && plan.kit.length) {
        if (plan.game === 'template') throw new Error('the template has no manifest to map a key in');
        const km = await mapKeys(plan.game, plan.kit, { bump: plan.bump !== false && !out.version });
        out.applied = out.applied.concat(km.applied);
        out.skipped = out.skipped.concat(km.skipped);
        out.written = out.written || km.written;
        out.version = out.version || km.version;
      }
      /* A callout kept in English is a manifest entry, not a call argument —
         and the version moves ONCE for the whole apply, whichever wrote first. */
      if (plan.keepEn && plan.keepEn.length) {
        const ke = await keepEnglish(plan.game, plan.keepEn, { bump: plan.bump !== false && !out.version });
        out.applied = out.applied.concat(ke.applied);
        out.skipped = out.skipped.concat(ke.skipped);
        out.written = out.written || ke.written;
        out.version = out.version || ke.version;
      }
    }
    catch (e) { return json(res, 200, { error: String(e.message || e) }); }
    clearCache();
    if (out.written) {
      const run = checking.then(async () => carryMarks(plan.game, before, await scanGame(plan.game), out.gone));
      checking = run.catch(() => {});
      try {
        const kept = await run;
        if (kept.carried) out.applied.push({ what: 'checked', value: `${kept.carried} mark${kept.carried > 1 ? 's' : ''} kept on the lines this apply rewrote` });
        if (kept.cleared) out.applied.push({ what: 'checked', value: `${kept.cleared} mark${kept.cleared > 1 ? 's' : ''} gone with the lines removed` });
      } catch (e) { out.skipped.push('checked marks not carried — ' + String(e.message || e)); }
    }
    for (const a of out.applied) console.log(`  ${stamp}  ✓ ${a.what} → ${a.value}`);
    for (const w of out.skipped) console.log(`  ${stamp}  ! ${w}`);
    return json(res, 200, out);
  }

  if (p.startsWith('/sfx/')) {
    const file = path.join(SFX, path.basename(p.slice('/sfx/'.length)));
    if (sendFile(res, file, [SFX], { 'Cache-Control': 'max-age=3600' })) return;
    return notFound(res, p);
  }

  // The built games, served from one origin so the page can script them.
  if (p.startsWith('/build/')) {
    let rel = p.slice('/build/'.length);
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    if (sendFile(res, path.join(BUILD, rel), [BUILD])) return;
    return notFound(res, p);
  }

  notFound(res, p);
}

if (isMain(import.meta.url)) {
  const port = portArg(8092);
  listen(handle, {
    port, label: 'events bench', restart: 'pkill -f serve-events.mjs && make events',
    ready(url) { console.log(`events bench  ${url}`); start(); }
  });
}
