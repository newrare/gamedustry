#!/usr/bin/env node
/*
  serve-site — the newrare site, locally, rebuilt on save.

    node tools/lab/serve-site.mjs
    node tools/lab/serve-site.mjs --port=4000

  It serves dist/site, and it gets there by running tools/build/build-site.mjs —
  the very command Vercel runs. That is deliberate: a dev server that assembled
  the site its own way would happily serve a link the real build cannot produce.
  A full rebuild takes about a third of a second, so there is nothing to gain by
  being cleverer than the build.

  Save any file under site/, packages/, games/ or tools/ and the page reloads:
  one Node process, fs.watch, and a Server-Sent Events channel injected at serve
  time, so the built artifact stays clean.

  What you are looking at is the WEB build of each game (menu, no install CTA),
  because that is what the site ships — see tools/build/build.mjs --target=web.
*/

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const PORT = Number((argv.find((a) => a.startsWith('--port=')) || '--port=8090').split('=')[1]);
const OUT = path.join(ROOT, 'dist', 'site');

const RELOAD_CLIENT = `<script>
/* serve-site.mjs: reload when the build says something changed. */
(function () {
  var es = new EventSource("/__reload");
  es.onmessage = function (e) { if (e.data === "reload") location.reload(); };
  es.onerror = function () { /* the server went away; the browser retries */ };
})();
</script>
`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2'
};

// ── the build, as a child process, so a syntax error cannot kill the server ──
let building = false;
let queued = false;

function build() {
  if (building) { queued = true; return; }
  building = true;

  const child = spawn(process.execPath, [path.join('tools', 'build', 'build-site.mjs')],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '', err = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { err += d; });
  child.on('close', (code) => {
    building = false;
    const stamp = new Date().toTimeString().slice(0, 8);
    if (code === 0) {
      // The last two lines are the interesting ones: the size and the games.
      const tail = out.trim().split('\n').filter((l) => !l.startsWith('web dist/')).slice(-3);
      console.log(`  ${stamp}  rebuilt\n${tail.map((l) => '    ' + l.trim()).join('\n')}`);
      broadcast('reload');
    } else {
      console.error(`  ${stamp}  BUILD FAILED\n${(err || out).trim()}`);
      broadcast('failed');
    }
    if (queued) { queued = false; build(); }
  });
}

// ── SSE clients ──
const clients = new Set();

function broadcast(msg) {
  for (const res of clients) {
    try { res.write(`data: ${msg}\n\n`); } catch { clients.delete(res); }
  }
}

// ── watching ──
// Not assets/: 52 MB of artwork that changes when a human adds a file, not
// while they are editing. Restart the server after adding an icon.
const WATCH = ['site', 'packages', 'games', 'tools'];
let timer = null;

function onChange(file) {
  if (!file) return;
  if (file.includes('index.html')) return;      // that is our own output
  if (file.endsWith('~') || path.basename(file).startsWith('.')) return;
  clearTimeout(timer);
  timer = setTimeout(build, 120);               // coalesce editor write bursts
}

for (const dir of WATCH) {
  const full = path.join(ROOT, dir);
  if (!existsSync(full)) continue;
  try {
    watch(full, { recursive: true }, (_evt, file) => onChange(file));
  } catch {
    console.error(`  cannot watch ${dir} (recursive watch unsupported here)`);
  }
}

// ── the server ──
createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  let rel = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
  const file = path.join(OUT, rel);
  if (!file.startsWith(OUT)) { res.writeHead(403).end('no'); return; }

  try {
    await stat(file);
    let body = await readFile(file);
    const ext = path.extname(file);
    if (ext === '.html') {
      body = Buffer.from(body.toString('utf8').replace('</body>', RELOAD_CLIENT + '</body>'));
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': MIME['.html'] });
    res.end(`<h1>404</h1><p>${rel} is not in the build. <a href="/">back</a></p>`);
  }
}).listen(PORT, () => {
  console.log(`site server   http://localhost:${PORT}/`);
  console.log(`watching      ${WATCH.join('  ')}`);
  build();
});
