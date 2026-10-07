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
  template/game.js, the picker's first entry — the end screen's cues), and
  the save the page just made is what triggers the rebuild above — so the next
  frame is played on the change. Everything else here reads and plays.

  More pages ride on the same build: lab/sound-kit.html (/kit), the house
  sound kit the shell plays in every game; lab/sound-library.html (/library)
  and lab/overlay-pop.html (/pop), the motor's Pop styles fired one by one.

  Both pages add what a flat ground cannot show: the MOMENT of the game an
  event belongs to. They record the game being played (the canvas, a second on
  each side of every event of their kind), keep each capture in
  lab/events-clips/<slug>/ (ignored by git — playing again makes them again),
  and loop it under the row being judged. Their routes are /api/offset,
  /api/clips, /api/clip, /api/clip-drop and /clips/…; /icons/<slug>.png is the
  game's thumb, which the sound page puts on a kit variant several games play.
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
import { games, units, scanGame, clearCache, sfxFiles, soundPack, fileForNote, SFX_DIR, ROOT } from './scan-events.mjs';
import { applyEdits } from './apply-events.mjs';
import { keepEnglish } from './keep-english.mjs';
import { readKit, writeKit, cutKit, kitUsers, mapKeys, KIT_DIR } from './cut-kit.mjs';
import { createHash } from 'node:crypto';
import { isMain, portArg, listen, json, notFound, readJson, sendFile, reloadHub, MIME } from '../lib/serve.mjs';

const BUILD = path.join(ROOT, 'dist', 'web');
const PAGE = path.join(ROOT, 'lab', 'game-events-message.html');
const PAGE_SOUND = path.join(ROOT, 'lab', 'game-events-sound.html');
const ICONS = path.join(ROOT, 'assets', 'image', 'icon', 'thumb');
const CLIPS = path.join(ROOT, 'lab', 'events-clips');
const LIBRARY = path.join(ROOT, 'lab', 'sound-library.html');
const KIT_PAGE = path.join(ROOT, 'lab', 'sound-kit.html');
const POP = path.join(ROOT, 'lab', 'overlay-pop.html');
const REVIEW = path.join(ROOT, 'lab', 'events-review.json');
const SFX = SFX_DIR;

const reload = reloadHub('serve-events.mjs: the build changed, take the page back to the same game.');

// ── the web build, which is what the iframes play ──
let building = false, queued = false;

function build() {
  if (building) { queued = true; return; }
  building = true;
  // --lab: the template too (dist/web/template/), which is where the end screen's cues live.
  const child = spawn(process.execPath, [path.join('tools', 'build', 'build.mjs'), '--target=web', '--lab'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let err = '';
  child.stderr.on('data', (d) => { err += d; });
  child.stdout.on('data', () => {});
  child.on('close', (code) => {
    building = false;
    clearCache();
    const stamp = new Date().toTimeString().slice(0, 8);
    if (code === 0) { console.log(`  ${stamp}  rebuilt`); reload.broadcast('reload'); }
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
  const at = new Date().toISOString().slice(0, 10);
  for (const id of ids) {
    const c = byId.get(id);
    if (body.on) mine[id] = { at, what: markLabel(c) };
    else delete mine[id];
  }
  review[slug] = mine;
  const saved = await writeReview(review);
  return { review: saved[slug] || {}, status: statusOf(g, saved[slug]) };
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
  return { file: m[0], offset: src.slice(0, at).split('\n').length - 2 };
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
    idx.clips[file] = { dur: Number(body.dur) || 0, at: Number(body.at) || 0, when: new Date().toISOString().slice(0, 16), events };
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
    if (!(await units()).includes(slug)) return notFound(res, 'game ' + slug);
    return json(res, 200, await sourceOffset(slug));
  }

  if (p === '/api/clips') {
    const slug = url.searchParams.get('game');
    if (!(await units()).includes(slug)) return notFound(res, 'game ' + slug);
    return json(res, 200, await readClips(slug));
  }

  /* One capture: the webm, base64 in a JSON body, and what fired in it. The
     file is named by its content, and every event of the window that had no
     clip yet points at it — or every one of them, on a re-record. */
  if (p === '/api/clip' && req.method === 'POST') {
    const body = await readJson(req, 3e7);
    const slug = body && body.game;
    if (!(await units()).includes(slug)) return notFound(res, 'game ' + slug);
    return json(res, 200, await saveClip(slug, body));
  }

  if (p === '/api/clip-drop' && req.method === 'POST') {
    const body = await readJson(req, 1e5);
    const slug = body && body.game;
    if (!(await units()).includes(slug)) return notFound(res, 'game ' + slug);
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

  /* The house sound kit: what the shell sounds like in every game, one role at
     a time (lab/sound-kit.html, tools/lab/cut-kit.mjs). A save writes kit.json,
     re-cuts and levels every take, and rebuilds, so the games the bench plays
     are wearing the kit that was just picked. */
  if (p === '/kit') return page(res, KIT_PAGE);
  /* With the kit, who plays each variant: the games whose manifest maps a key
     to it (`sfx`), so a take is never changed without knowing who hears it. */
  if (p === '/api/kit' && req.method === 'GET') return json(res, 200, { ...(await readKit()), users: await kitUsers() });
  if (p === '/api/kit' && req.method === 'POST') {
    const body = await readJson(req, 1e5);
    const log = [];
    try {
      await writeKit(body);
      await cutKit({ log: (l) => log.push(l.trim()) });
    } catch (e) { return json(res, 200, { error: String(e.message || e) }); }
    const stamp = new Date().toTimeString().slice(0, 8);
    console.log(`  ${stamp}  kit re-cut (${log.length} takes)`);
    build();
    return json(res, 200, { kit: { ...(await readKit()), users: await kitUsers() }, log });
  }
  if (p.startsWith('/kit/')) {
    const file = path.join(KIT_DIR, path.basename(p.slice('/kit/'.length)));
    if (sendFile(res, file, [KIT_DIR], { 'Cache-Control': 'no-store' })) return;
    return notFound(res, p);
  }

  /* The picker: every game, and the TEMPLATE first. The end screen's own
     sounds are no longer its clips but the house kit's (/kit). */
  if (p === '/api/games') {
    const out = [], review = await readReview();
    for (const slug of await units()) {
      const g = await scanGame(slug);
      out.push({
        slug: g.slug, title: g.title, version: g.version, counts: g.counts,
        warnings: g.warnings.length, built: existsSync(path.join(BUILD, slug, 'index.html')),
        status: statusOf(g, review[slug])
      });
    }
    return json(res, 200, out);
  }

  if (p === '/api/events') {
    const slug = url.searchParams.get('game');
    if (!(await units()).includes(slug)) return notFound(res, 'game ' + slug);
    const g = await scanGame(slug), review = (await readReview())[slug] || {};
    return json(res, 200, { ...g, review, status: statusOf(g, review) });
  }

  /* One mark, set or taken back — or several at once, which is what a clip's
     card does for every line under it. A mark is only ever given on an id the
     source has NOW; whatever this game held for ids it no longer has is
     dropped on the way, since nothing can ever match it again. */
  if (p === '/api/check' && req.method === 'POST') {
    const body = await readJson(req, 1e5);
    const slug = body && body.game;
    if (!(await units()).includes(slug)) return notFound(res, 'game ' + slug);
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
    if (!(await units()).includes(plan && plan.game)) return notFound(res, 'game ' + (plan && plan.game));
    const stamp = new Date().toTimeString().slice(0, 8);
    let out, before;
    try {
      clearCache();
      before = await scanGame(plan.game);
      out = await applyEdits(plan.game, plan);
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
