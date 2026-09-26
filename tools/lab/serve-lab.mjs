#!/usr/bin/env node
/*
  serve-lab — every lab page on one port, behind one back office.

    node tools/lab/serve-lab.mjs            (or: make lab)
    node tools/lab/serve-lab.mjs --port=9000

  http://localhost:8095/ is the back office (lab/index.html): every page of
  lab/ in one list, opened beside it in a frame, one click from the next.
  Nothing new is served — the four tools that need a server are MOUNTED, each
  under its own prefix, and the pages that do not are served as files:

    /                 the back office
    /api/labs         what it lists, read off lab/*.html
    /events/          tools/lab/serve-events.mjs   (and /events/library)
    /text/            tools/lab/serve-text.mjs
    /store/           tools/lab/serve-store.mjs
    /village/         tools/lab/serve-village.mjs
    /lab/  /assets/  /games/  /packages/          read-only files, which is
                      what a file:// lab page reaches with `../`

  A mounted tool is the SAME script its own `make events` runs, started the
  first time it is asked for on a free port of 127.0.0.1 and reached through a
  proxy that takes the prefix off — which is why the four pages address their
  server with relative urls. One PROCESS per tool, not one module per
  process: the copy desk's scan is ~18 s of synchronous CPU, and in a shared
  process it froze every other tool for as long. Opening the back office starts
  none of them, so it does not run the events bench's web build either. Their
  output is printed here, each line tagged with the tool.

  Localhost only, like every lab server: it binds 127.0.0.1 and answers a
  request only when its Host names this machine. Four of these tools write
  into the repo.
*/

import fs from 'node:fs';
import net from 'node:net';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HOST, isMain, portArg, listen, json, notFound, sendFile, text } from '../lib/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LAB = path.join(ROOT, 'lab');
const HOME = path.join(LAB, 'index.html');

/* The mounted tools, and the lab pages each one serves. A page listed here is
   never served as a bare file: without its server under it, it would open on
   an api that is not there. */
const TOOLS = [
  { mount: '/events/', script: 'serve-events.mjs', pages: { 'game-events.html': '', 'sound-library.html': 'library' } },
  { mount: '/text/', script: 'serve-text.mjs', pages: { 'game-text.html': '' } },
  { mount: '/store/', script: 'serve-store.mjs', pages: { 'store-card.html': '' } },
  { mount: '/village/', script: 'serve-village.mjs', pages: { 'village.html': '' } }
];

const READ_ONLY = ['lab', 'assets', 'games', 'packages'].map((d) => path.join(ROOT, d));

function toolOf(file) {
  for (const t of TOOLS) if (file in t.pages) return { tool: t, url: t.mount + t.pages[file] };
  return null;
}

// ── the tools, one process each ───────────────────────────────────────────

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer().once('error', reject);
    s.listen(0, HOST, () => { const { port } = s.address(); s.close(() => resolve(port)); });
  });
}

function tagged(stream, tag, out) {
  let rest = '';
  stream.on('data', (d) => {
    const lines = (rest + d).split('\n');
    rest = lines.pop();
    for (const l of lines) out.write(l.trim() ? `  [${tag}] ${l.replace(/^\s+/, '')}\n` : '\n');
  });
}

/* The port a tool answers on, starting it if it is not running. A tool that
   dies (a throw, a Ctrl-C of its own) is started again on the next request. */
function ensure(t) {
  if (t.port) return t.port;
  const tag = t.mount.replace(/\//g, '');
  t.port = (async () => {
    const port = await freePort();
    const child = spawn(process.execPath, [path.join(ROOT, 'tools', 'lab', t.script), `--port=${port}`],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    t.child = child;
    tagged(child.stdout, tag, process.stdout);
    tagged(child.stderr, tag, process.stderr);
    let dead = false;
    child.on('exit', (code, sig) => {
      dead = true; t.port = null; t.child = null;
      console.log(`  [${tag}] stopped (${sig || code})`);
    });
    for (let i = 0; i < 150; i++) {
      if (dead) throw new Error(`${t.script} exited on start`);
      const up = await new Promise((ok) => {
        const c = net.connect(port, HOST, () => { c.end(); ok(true); }).on('error', () => ok(false));
      });
      if (up) return port;
      await new Promise((r) => setTimeout(r, 100));
    }
    child.kill('SIGKILL');
    throw new Error(`${t.script} did not open its port`);
  })();
  t.port.catch(() => { t.port = null; });
  return t.port;
}

/* Forward one request, the prefix taken off the RAW url so the query and the
   encoding reach the tool as the browser sent them. A server-sent stream
   (a tool's reload-on-save) is a response like any other here. */
async function proxy(t, req, res) {
  const bare = t.mount.slice(0, -1);
  if (!req.url.startsWith(t.mount)) return text(res, 400, 'bad path');
  let port;
  try { port = await ensure(t); } catch (e) { return text(res, 502, String(e.message || e)); }
  const up = http.request({
    host: HOST, port, method: req.method, path: req.url.slice(bare.length),
    headers: { ...req.headers, host: `localhost:${port}` }
  }, (r) => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });
  up.on('error', (e) => {
    if (!res.headersSent) text(res, 502, `${t.script}: ${e.message}`);
    else res.destroy();
  });
  res.on('close', () => up.destroy());
  req.pipe(up);
}

function stopAll() { for (const t of TOOLS) if (t.child) t.child.kill('SIGKILL'); }
process.on('exit', stopAll);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => process.exit(0));

// ── what the back office lists ────────────────────────────────────────────

/* `Lab — game events` → "Game events"; `Brick Lab — brick materials` →
   "Brick materials". The title is the one line every page already has. */
function nameOf(title, file) {
  const t = String(title || '').split(/\s+—\s+/).slice(1).join(' — ').trim();
  const s = t || file.replace(/\.html$/, '').replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* The headline of the page's own header comment: the first sentence after
   the dash of `BUTTON LAB — one button for the motor and every game.` */
function summaryOf(src) {
  const m = src.match(/\/\*\s*=+\s*\n([\s\S]*?)\n\s*\n/);
  if (!m) return '';
  const para = m[1].replace(/\s+/g, ' ').trim();
  const dash = para.indexOf('— ');
  const body = (dash >= 0 ? para.slice(dash + 2) : para).replace(/`/g, '');
  /* A headline that is only a name in capitals (`LAB — LEVEL MAP. The
     screen…`) says less than the sentence after it. */
  const s = body.split(/[.:](?:\s|$)/).map((x) => x.trim()).find((x) => /[a-z]/.test(x)) || '';
  return s.length > 160 ? s.slice(0, 157) + '…' : s;
}

function labs() {
  const slugs = fs.readdirSync(path.join(ROOT, 'games'))
    .filter((d) => fs.existsSync(path.join(ROOT, 'games', d, 'manifest.json')));
  const out = [];
  for (const file of fs.readdirSync(LAB).sort()) {
    if (!file.endsWith('.html') || file === 'index.html' || file.startsWith('_')) continue;
    const src = fs.readFileSync(path.join(LAB, file), 'utf8');
    const title = (src.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    const served = toolOf(file);
    const game = slugs.find((s) => file === s + '.html' || file.startsWith(s + '-')) || null;
    out.push({
      file, title, game,
      name: nameOf(title, file),
      summary: summaryOf(src),
      url: served ? served.url : '/lab/' + file,
      server: served ? served.tool.mount.replace(/\//g, '') : null
    });
  }
  return out;
}

// ── the request ───────────────────────────────────────────────────────────

export async function handle(req, res, p, url) {
  if (p === '/' || p === '/index.html') {
    if (sendFile(res, HOME, [LAB])) return;
    return notFound(res, p);
  }
  if (p === '/api/labs') return json(res, 200, labs());

  for (const t of TOOLS) {
    const bare = t.mount.slice(0, -1);
    if (p === bare) {
      res.writeHead(301, { Location: t.mount + url.search });
      return res.end();
    }
    if (p.startsWith(t.mount)) return proxy(t, req, res);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return text(res, 405, 'read-only');

  // A tool's page asked for as a bare file goes to the tool that serves it.
  if (p.startsWith('/lab/')) {
    const served = toolOf(p.slice('/lab/'.length));
    if (served) {
      res.writeHead(302, { Location: served.url + url.search });
      return res.end();
    }
  }

  if (sendFile(res, path.join(ROOT, p), READ_ONLY)) return;
  notFound(res, p);
}

if (isMain(import.meta.url)) {
  listen(handle, {
    port: portArg(8095), label: 'lab server', restart: 'pkill -f serve-lab.mjs && make lab',
    ready(u) {
      const list = labs();
      console.log(`\n  lab back office   ${u}`);
      console.log(`  ${list.length} pages, ${list.filter((l) => l.server).length} on a server` +
                  ` (${TOOLS.map((t) => t.mount).join(' ')}), each started on first use`);
      console.log('  bound to 127.0.0.1 — localhost only\n');
    }
  });
}
