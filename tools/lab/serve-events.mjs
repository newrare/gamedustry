#!/usr/bin/env node
/*
  serve-events — the feedback bench, at http://localhost:8092/

    node tools/lab/serve-events.mjs            (or: make events)
    node tools/lab/serve-events.mjs --port=9000

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
*/

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { games, scanGame, clearCache, sfxFiles, SFX_DIR, ROOT } from './scan-events.mjs';
import { applyEdits } from './apply-events.mjs';

const argv = process.argv.slice(2);
const PORT = Number((argv.find((a) => a.startsWith('--port=')) || '--port=8092').split('=')[1]);
const BUILD = path.join(ROOT, 'dist', 'web');
const PAGE = path.join(ROOT, 'lab', 'game-events.html');
const SFX = SFX_DIR;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.ttf': 'font/ttf'
};

const RELOAD = `<script>
/* serve-events.mjs: the build changed, take the page back to the same game. */
(function () {
  var es = new EventSource("/__reload");
  es.onmessage = function (e) { if (e.data === "reload") location.reload(); };
})();
</script>
`;

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
    if (code === 0) { console.log(`  ${stamp}  rebuilt`); broadcast('reload'); }
    else console.error(`  ${stamp}  BUILD FAILED\n${err.trim()}`);
    if (queued) { queued = false; build(); }
  });
}

// The JSON of a POST, capped — the apply plan is a handful of small objects.
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

const clients = new Set();
function broadcast(msg) {
  for (const res of clients) { try { res.write(`data: ${msg}\n\n`); } catch { clients.delete(res); } }
}

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

function json(res, body) {
  res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
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
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
      res.end(html.replace('</body>', RELOAD + '</body>'));
      return;
    }

    if (p === '/api/games') {
      const out = [];
      for (const slug of await games()) {
        const g = await scanGame(slug);
        out.push({
          slug: g.slug, title: g.title, version: g.version, counts: g.counts,
          warnings: g.warnings.length, built: existsSync(path.join(BUILD, slug, 'index.html'))
        });
      }
      json(res, out);
      return;
    }

    if (p === '/api/events') {
      const slug = url.searchParams.get('game');
      if (!(await games()).includes(slug)) { res.writeHead(404).end('unknown game'); return; }
      json(res, await scanGame(slug));
      return;
    }

    /* The sfx library — every file in assets/audio/sfx/, whether a game uses
       it or not. The label is the name stripped of the vendor prefix and of
       the trailing id, which is exactly how a game writes its provenance
       comment, so a card can be pasted straight into an ASSETS block, and it
       is also how a clip is matched back to the file it was cut from. */
    if (p === '/api/sfx') {
      const out = [];
      for (const f of await sfxFiles()) {
        const st = await stat(path.join(SFX, f.file));
        out.push({ ...f, size: st.size });
      }
      json(res, out);
      return;
    }

    /* The one route that writes. The page hands over what it changed — a call
       argument, a clip re-cut from another file — and gets back what landed and
       what was refused, line by line. The write trips the watcher above, so the
       rebuild and the reload are the same ones a hand edit gets. */
    if (p === '/api/apply' && req.method === 'POST') {
      const plan = await body(req);
      if (!(await games()).includes(plan && plan.game)) { res.writeHead(404).end('unknown game'); return; }
      const stamp = new Date().toTimeString().slice(0, 8);
      let out;
      try { out = await applyEdits(plan.game, plan); }
      catch (e) { json(res, { error: String(e.message || e) }); return; }
      clearCache();
      for (const a of out.applied) console.log(`  ${stamp}  ✓ ${a.what} → ${a.value}`);
      for (const w of out.skipped) console.log(`  ${stamp}  ! ${w}`);
      json(res, out);
      return;
    }

    if (p.startsWith('/sfx/')) {
      const file = path.join(SFX, path.basename(decodeURIComponent(p.slice('/sfx/'.length))));
      if (!file.startsWith(SFX)) { res.writeHead(403).end('no'); return; }
      await stat(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(await readFile(file));
      return;
    }

    // The built games, served from one origin so the page can script them.
    if (p.startsWith('/build/')) {
      let rel = p.slice('/build/'.length);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.join(BUILD, rel);
      if (!file.startsWith(BUILD)) { res.writeHead(403).end('no'); return; }
      await stat(file);
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      res.end(await readFile(file));
      return;
    }
  } catch {
    res.writeHead(404, { 'Content-Type': MIME['.html'] });
    res.end(`<h1>404</h1><p>${p}</p>`);
    return;
  }

  res.writeHead(404, { 'Content-Type': MIME['.html'] });
  res.end(`<h1>404</h1><p>${p}</p>`);
});

/* A bench already on the port is the one failure that matters here, and it is
   worse than it looks: the older process holds the MODULE it started with, so
   it serves a scan that predates whatever was just changed in tools/lab/. A
   stack trace ending in EADDRINUSE does not say that, and the answer is always
   the same two commands. */
server.on('error', (e) => {
  if (e.code !== 'EADDRINUSE') throw e;
  console.error(`\n  port ${PORT} is already taken — almost always an events bench still running.`);
  console.error('  That one serves the sources as they were when IT started, so a change');
  console.error('  made since will not show up. Take it down and start again:\n');
  console.error(`    pkill -f serve-events.mjs && make events`);
  console.error(`    node tools/lab/serve-events.mjs --port=${PORT + 1}   # or just use another port\n`);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`events bench  http://localhost:${PORT}/`);
  console.log('watching      games  packages  lab');
  build();
});
