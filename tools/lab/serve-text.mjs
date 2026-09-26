#!/usr/bin/env node
/*
  serve-text — the copy desk, at http://localhost:8093/

    node tools/lab/serve-text.mjs            (or: make text)
    node tools/lab/serve-text.mjs --port=9000
    make lab                                 → http://localhost:8095/text/

  lab/game-text.html lists every word a game shows a player — the listing, the
  title screen, the shell, the HUD, the round, the end screen and the level
  objective — with English on one side and French on the other, and an edit
  field on every row. It needs a server for the two things a file:// page
  cannot do: read the four sources back (tools/lab/scan-text.mjs) and write a
  correction into them (tools/lab/apply-text.mjs).

  APPLY is the one route that writes. After a write the game is rebuilt and the
  two catalogues are regenerated, so the tree the page leaves behind is the one
  `node tools/update.mjs` would check — a copy pass that left thirteen stale
  index.html behind would fail the build gate on somebody else's commit.

  Saving lab/game-text.html itself reloads the page: that is the loop for
  working ON the tool. A change to a game's sources is NOT watched — the page
  re-reads them after every apply, and a reload in the middle of a proofreading
  pass would throw away the edits still on screen.
*/

import { readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { ROOT, scanText, games } from './scan-text.mjs';
import { applyText } from './apply-text.mjs';
import { isMain, portArg, listen, json, notFound, readJson, reloadHub, MIME } from '../lib/serve.mjs';

const run = promisify(execFile);

const PAGE = path.join(ROOT, 'lab', 'game-text.html');

const reload = reloadHub("serve-text.mjs: the page's own source changed — take it again.");

function start() {
  let timer = null;
  try {
    watch(PAGE, () => { clearTimeout(timer); timer = setTimeout(() => reload.broadcast('reload'), 120); });
  } catch { console.error('  cannot watch lab/game-text.html'); }
  console.log('apply writes manifest.json, game.js and page.html, then rebuilds the game');
}

/* What a write leaves to do, done here rather than left for the next person:
   the game's own artifact, then the two catalogues, which carry the manifest's
   taglines and tags. Both are ~0.1 s. */
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

export async function handle(req, res, p, url) {
  if (p === '/__reload') return reload.handle(req, res);

  if (p === '/' || p === '/index.html') {
    const html = await readFile(PAGE, 'utf8');
    res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
    return res.end(reload.inject(html));
  }

  if (p === '/api/games') {
    const out = [];
    for (const slug of await games()) {
      const s = await scanText(slug);
      out.push({ slug, title: s.title, version: s.version, counts: s.counts, warnings: s.warnings.length });
    }
    return json(res, 200, out);
  }

  if (p === '/api/text') {
    const slug = url.searchParams.get('game');
    if (!(await games()).includes(slug)) return notFound(res, 'game ' + slug);
    return json(res, 200, await scanText(slug));
  }

  if (p === '/api/apply' && req.method === 'POST') {
    const plan = await readJson(req, 1e6);
    if (!(await games()).includes(plan && plan.game)) return notFound(res, 'game ' + (plan && plan.game));
    const stamp = new Date().toTimeString().slice(0, 8);
    let out;
    try { out = await applyText(plan.game, plan); }
    catch (e) { return json(res, 200, { error: String(e.message || e) }); }
    for (const a of out.applied) console.log(`  ${stamp}  ✓ ${a.what}  "${a.from}" → "${a.to}"`);
    for (const w of out.skipped) console.log(`  ${stamp}  ! ${w}`);
    if (out.written.length) {
      out.rebuilt = await rebuild(plan.game);
      console.log(`  ${stamp}  rebuilt ${out.rebuilt.join(', ')}`);
    }
    // The page redraws on the file as it now reads, not on what it sent.
    out.scan = await scanText(plan.game);
    return json(res, 200, out);
  }

  notFound(res, p);
}

if (isMain(import.meta.url)) {
  listen(handle, {
    port: portArg(8093), label: 'copy desk', restart: 'pkill -f serve-text.mjs && make text',
    ready(url) { console.log(`copy desk  ${url}`); start(); }
  });
}
