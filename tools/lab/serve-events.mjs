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

  APPLY is the one route that writes (POST /api/apply → tools/lab/apply-events.mjs):
  a re-styled callout and a swapped clip go back into games/<slug>/game.js, and
  the save the page just made is what triggers the rebuild above — so the next
  frame is played on the change. Everything else here reads and plays.

  `make lab` runs this same script behind its proxy, under /events/
  (tools/lab/serve-lab.mjs), which is why the page addresses it with relative
  urls.
*/

import { readFile, stat } from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { games, scanGame, clearCache, sfxFiles, soundPack, fileForNote, SFX_DIR, ROOT } from './scan-events.mjs';
import { applyEdits } from './apply-events.mjs';
import { isMain, portArg, listen, json, notFound, readJson, sendFile, reloadHub, MIME } from '../lib/serve.mjs';

const BUILD = path.join(ROOT, 'dist', 'web');
const PAGE = path.join(ROOT, 'lab', 'game-events.html');
const LIBRARY = path.join(ROOT, 'lab', 'sound-library.html');
const SFX = SFX_DIR;

const reload = reloadHub('serve-events.mjs: the build changed, take the page back to the same game.');

// ── the web build, which is what the iframes play ──
let building = false, queued = false;

function build() {
  if (building) { queued = true; return; }
  building = true;
  const child = spawn(process.execPath, [path.join('tools', 'build', 'build.mjs'), '--target=web'],
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
  for (const dir of ['games', 'packages', 'lab']) {
    const full = path.join(ROOT, dir);
    if (!existsSync(full)) continue;
    try {
      watch(full, { recursive: true }, (_e, file) => {
        if (!file || file.includes('index.html') || path.basename(file).startsWith('.')) return;
        clearTimeout(timer);
        timer = setTimeout(build, 120);
      });
    } catch { console.error(`  cannot watch ${dir}`); }
  }
  console.log('watching      games  packages  lab');
  build();
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

  if (p === '/api/games') {
    const out = [];
    for (const slug of await games()) {
      const g = await scanGame(slug);
      out.push({
        slug: g.slug, title: g.title, version: g.version, counts: g.counts,
        warnings: g.warnings.length, built: existsSync(path.join(BUILD, slug, 'index.html'))
      });
    }
    return json(res, 200, out);
  }

  if (p === '/api/events') {
    const slug = url.searchParams.get('game');
    if (!(await games()).includes(slug)) return notFound(res, 'game ' + slug);
    return json(res, 200, await scanGame(slug));
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
    if (!(await games()).includes(plan && plan.game)) return notFound(res, 'game ' + (plan && plan.game));
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
