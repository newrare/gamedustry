#!/usr/bin/env node
/*
  serve-events — the feedback bench, at http://localhost:8092/

    node tools/lab/serve-events.mjs            (or: make events)
    node tools/lab/serve-events.mjs --port=9000
    make lab                                   → http://localhost:8095/events/

  lab/game-events.html lists every callout, notification and cue a game fires,
  and plays them INSIDE that game's own web build, loaded in an iframe next to
  the list: the real motor, the real SKIN, the real samples. So it needs a
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

  Two more pages ride on the same build: lab/sound-library.html (/library)
  and lab/overlay-pop.html (/pop), the motor's Pop styles fired one by one.

  `make lab` runs this same script behind its proxy, under /events/
  (tools/lab/serve-lab.mjs), which is why the page addresses it with relative
  urls.
*/

import { readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { games, units, scanGame, clearCache, sfxFiles, soundPack, fileForNote, SFX_DIR, ROOT } from './scan-events.mjs';
import { applyEdits } from './apply-events.mjs';
import { isMain, portArg, listen, json, notFound, readJson, sendFile, reloadHub, MIME } from '../lib/serve.mjs';

const BUILD = path.join(ROOT, 'dist', 'web');
const PAGE = path.join(ROOT, 'lab', 'game-events.html');
const LIBRARY = path.join(ROOT, 'lab', 'sound-library.html');
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
    if (body.on) mine[id] = { at, what: `${c.name} ${c.inherited ? c.where.split('/').pop() + ':' : 'L'}${c.line}${c.fn ? ' ' + c.fn + '()' : ''}` };
    else delete mine[id];
  }
  review[slug] = mine;
  const saved = await writeReview(review);
  return { review: saved[slug] || {}, status: statusOf(g, saved[slug]) };
}

async function page(res, file) {
  const html = await readFile(file, 'utf8');
  res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
  res.end(reload.inject(html));
}

export async function handle(req, res, p, url) {
  if (p === '/__reload') return reload.handle(req, res);

  if (p === '/' || p === '/index.html') return page(res, PAGE);

  // The library page: every file of assets/audio/sfx/, by ear, beside the bench.
  if (p === '/library') return page(res, LIBRARY);

  // The Pop catalogue: every style of the motor's table, fired in a game's build.
  if (p === '/pop') return page(res, POP);

  /* The picker: every game, and the TEMPLATE first — the one unit whose clips
     are the end screen's (uiScore, uiStar, uiRow), heard through the motor
     lines that play them. */
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
    let out;
    try { out = await applyEdits(plan.game, plan); }
    catch (e) { return json(res, 200, { error: String(e.message || e) }); }
    clearCache();
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
