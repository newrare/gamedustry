#!/usr/bin/env node
/*
  serve — the prototyping loop: a proto build, served, rebuilt on save.

    node tools/lab/serve.mjs                 # every game, listing at /
    node tools/lab/serve.mjs vipera          # straight to that one
    node tools/lab/serve.mjs vipera --port=4000

  Save any file under packages/, tools/lib/ or games/<slug>/ and the page
  reloads. Nothing is bundled and nothing is watched by a dependency: one Node
  process, fs.watch, and a Server-Sent Events channel injected at serve time so
  the built artifact stays clean.

  The URL is where a proto is steered — see packages/devtools/devtools.js:
    ?seed=42        reproducible run
    ?speed=2        time scale
    ?loop=0         keep the end screen instead of restarting
    ?dev=0          hide the panel
    ?<path>=<n>     override any number in CONFIG, e.g. ?gravity=1800
*/

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readdirSync, watch } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const only = argv.find((a) => !a.startsWith('--')) || null;
const PORT = Number((argv.find((a) => a.startsWith('--port=')) || '--port=8080').split('=')[1]);
const OUT = path.join(ROOT, 'dist', 'proto');

const RELOAD_CLIENT = `<script>
/* serve.mjs: reload when the build says something changed. */
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
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2'
};

function slugs() {
  return readdirSync(path.join(ROOT, 'games'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((s) => existsSync(path.join(ROOT, 'games', s, 'page.html')))
    .sort();
}

// ── the build, as a child process, so a syntax error cannot kill the server ──
let building = false;
let queued = false;

function build() {
  if (building) { queued = true; return; }
  building = true;
  const args = [path.join('tools', 'build', 'build.mjs'), '--target=proto'];
  if (only) args.push(`--game=${only}`);

  const child = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let err = '';
  child.stdout.on('data', () => {});
  child.stderr.on('data', (d) => { err += d; });
  child.on('close', (code) => {
    building = false;
    const stamp = new Date().toTimeString().slice(0, 8);
    if (code === 0) {
      console.log(`  ${stamp}  rebuilt`);
      broadcast('reload');
    } else {
      console.error(`  ${stamp}  BUILD FAILED\n${err.trim()}`);
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
const WATCH = ['packages', 'tools/lib', only ? `games/${only}` : 'games'];
let timer = null;

function onChange(file) {
  if (!file) return;
  if (file.includes('index.html')) return;      // that is our own output
  if (file.endsWith('~') || file.startsWith('.')) return;
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
function listing() {
  const rows = slugs().map((s) =>
    `<li><a href="/${s}/">${s}</a> <span>?seed=1 · ?speed=2 · ?dev=0</span></li>`).join('\n');
  return `<!DOCTYPE html><meta charset="utf-8"><title>protos</title>
<style>
  body{margin:0;padding:40px;background:#07080f;color:#e6ebff;
       font:15px/1.6 ui-monospace,Menlo,monospace}
  h1{font-size:14px;letter-spacing:2px;color:#6ee7ff;margin:0 0 20px}
  ul{list-style:none;padding:0;max-width:520px}
  li{padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08);display:flex;gap:12px}
  a{color:#e6ebff;text-decoration:none;font-weight:700;flex:1}
  a:hover{color:#6ee7ff}
  span{color:#5f6a8d;font-size:12px}
</style>
<h1>PROTO SERVER</h1>
<ul>${rows}</ul>
${RELOAD_CLIENT}`;
}

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

  if (pathname === '/' && !only) {
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(listing());
    return;
  }

  // /vipera/ → dist/proto/vipera/index.html, with the reload channel injected.
  let rel = pathname === '/' ? `/${only}/` : pathname;
  if (rel.endsWith('/')) rel += 'index.html';
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
    res.end(`<h1>404</h1><p>${rel} is not built. <a href="/">back</a></p>`);
  }
}).listen(PORT, () => {
  const where = only ? `/${only}/` : '/';
  console.log(`proto server  http://localhost:${PORT}${where}`);
  console.log(`watching      ${WATCH.join('  ')}`);
  build();
});
