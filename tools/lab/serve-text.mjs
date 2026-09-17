#!/usr/bin/env node
/*
  serve-text — the copy desk, at http://localhost:8093/

    node tools/lab/serve-text.mjs            (or: make text)
    node tools/lab/serve-text.mjs --port=9000

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

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { ROOT, scanText, games } from './scan-text.mjs';
import { applyText } from './apply-text.mjs';

const run = promisify(execFile);

const argv = process.argv.slice(2);
const PORT = Number((argv.find((a) => a.startsWith('--port=')) || '--port=8093').split('=')[1]);
const PAGE = path.join(ROOT, 'lab', 'game-text.html');

const RELOAD = `<script>
/* serve-text.mjs: the page's own source changed — take it again. */
(function () {
  var es = new EventSource("/__reload");
  es.onmessage = function (e) { if (e.data === "reload") location.reload(); };
})();
</script>
`;

const clients = new Set();
function broadcast(msg) {
  for (const res of clients) { try { res.write(`data: ${msg}\n\n`); } catch { clients.delete(res); } }
}

let timer = null;
try {
  watch(PAGE, () => { clearTimeout(timer); timer = setTimeout(() => broadcast('reload'), 120); });
} catch { console.error('  cannot watch lab/game-text.html'); }

function json(res, body) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

// The JSON of a POST, capped — an apply plan is a handful of short strings.
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (d) => {
      raw += d;
      if (raw.length > 1e6) { req.destroy(); reject(new Error('body too large')); }
    });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (e) { reject(e); } });
  });
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

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = decodeURIComponent(url.pathname);

  if (p === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  try {
    if (p === '/' || p === '/index.html') {
      const html = await readFile(PAGE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html.replace('</body>', RELOAD + '</body>'));
      return;
    }

    if (p === '/api/games') {
      const out = [];
      for (const slug of await games()) {
        const s = await scanText(slug);
        out.push({ slug, title: s.title, version: s.version, counts: s.counts, warnings: s.warnings.length });
      }
      json(res, out);
      return;
    }

    if (p === '/api/text') {
      const slug = url.searchParams.get('game');
      if (!(await games()).includes(slug)) { res.writeHead(404).end('unknown game'); return; }
      json(res, await scanText(slug));
      return;
    }

    if (p === '/api/apply' && req.method === 'POST') {
      const plan = await body(req);
      if (!(await games()).includes(plan && plan.game)) { res.writeHead(404).end('unknown game'); return; }
      const stamp = new Date().toTimeString().slice(0, 8);
      let out;
      try { out = await applyText(plan.game, plan); }
      catch (e) { json(res, { error: String(e.message || e) }); return; }
      for (const a of out.applied) console.log(`  ${stamp}  ✓ ${a.what}  "${a.from}" → "${a.to}"`);
      for (const w of out.skipped) console.log(`  ${stamp}  ! ${w}`);
      if (out.written.length) {
        out.rebuilt = await rebuild(plan.game);
        console.log(`  ${stamp}  rebuilt ${out.rebuilt.join(', ')}`);
      }
      // The page redraws on the file as it now reads, not on what it sent.
      out.scan = await scanText(plan.game);
      json(res, out);
      return;
    }
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(e.message || e));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<h1>404</h1><p>${p}</p>`);
});

/* A copy desk already on the port is worse than it looks: the older process
   holds the MODULE it started with, so it serves a scan that predates whatever
   was just changed in tools/lab/. EADDRINUSE does not say that. */
server.on('error', (e) => {
  if (e.code !== 'EADDRINUSE') throw e;
  console.error(`\n  port ${PORT} is already taken — almost always a copy desk still running.`);
  console.error('  That one serves the sources as they were when IT started, so a change');
  console.error('  made since will not show up. Take it down and start again:\n');
  console.error('    pkill -f serve-text.mjs && make text');
  console.error(`    node tools/lab/serve-text.mjs --port=${PORT + 1}   # or just use another port\n`);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`copy desk  http://localhost:${PORT}/`);
  console.log('apply writes manifest.json, game.js and page.html, then rebuilds the game');
});
