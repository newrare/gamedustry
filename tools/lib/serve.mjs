/*
  serve.mjs — the HTTP plumbing every lab server shares.

  Four lab tools need a server (tools/lab/serve-{events,store,text,village}.mjs)
  and each one used to carry its own MIME table, body reader, 404 page and
  `listen`. What they share is here, and so are the three things a dev server
  must get right once rather than four times (docs/AUDIT.md, 1.1 · 1.3 · 1.4):

    - it binds 127.0.0.1, never every interface: these servers WRITE into the
      repo, and `listen(PORT)` alone put those routes on the whole LAN;
    - it answers only a request whose Host is this machine, which is what stops
      a page elsewhere from reaching them through a rebound DNS name;
    - a path that cannot be decoded is a 400 rather than a dead process, and a
      404 is plain text, so a crafted path is never echoed back as HTML.

  A lab tool is a `handle(req, res, p, url)` handed to `listen()`, on its own
  port (`make events`). The one lab server (`make lab`,
  tools/lab/serve-lab.mjs) runs the same script and proxies a prefix to it —
  `/events/api/games` reaches it as `/api/games` — which is why the pages a
  tool serves address it with RELATIVE urls (`api/games`, not `/api/games`).
*/

import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HOST = '127.0.0.1';

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf'
};

export function mimeOf(file) {
  return MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

/* True when the module at `metaUrl` is the script node was started with — how
   a lab tool tells `node tools/lab/serve-events.mjs` from an import. */
export function isMain(metaUrl) {
  return !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(metaUrl);
}

export function portArg(fallback) {
  const a = process.argv.slice(2).find((s) => s.startsWith('--port='));
  return Number(a ? a.split('=')[1] : fallback);
}

/* The Host header names this machine. Checked on EVERY request, reads
   included: a read of a lab route is a read of the repo. */
const LOCAL_NAMES = new Set(['localhost', '127.0.0.1', '[::1]']);
export function isLocal(req) {
  const host = String(req.headers.host || '').toLowerCase();
  return LOCAL_NAMES.has(host.replace(/:\d+$/, ''));
}

export function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

export function text(res, code, str) {
  res.writeHead(code, { 'Content-Type': MIME['.txt'], 'Cache-Control': 'no-store' });
  res.end(str + '\n');
}

export function notFound(res, p) { text(res, 404, 'not found: ' + p); }

// A request body as a string, refused past `cap` bytes.
export function readBody(req, cap) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (d) => {
      raw += d;
      if (raw.length > cap) { req.destroy(); reject(new Error('body too large')); }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

export async function readJson(req, cap) {
  const raw = await readBody(req, cap);
  return JSON.parse(raw || '{}');
}

/* `file` inside `root`, with the separator: `dist/web-old` is not inside
   `dist/web`. */
export function inside(file, root) {
  return file === root || file.startsWith(root + path.sep);
}

/* Serve one file if it sits inside one of `roots` and is a file. Answers
   nothing and returns false otherwise, so the caller decides what a miss is. */
export function sendFile(res, file, roots, extraHeaders) {
  if (!file || !roots.some((r) => inside(file, r))) return false;
  let st;
  try { st = fs.statSync(file); } catch { return false; }
  if (!st.isFile()) return false;
  res.writeHead(200, { 'Content-Type': mimeOf(file), 'Cache-Control': 'no-store', ...extraHeaders });
  fs.createReadStream(file).pipe(res);
  return true;
}

/* Reload on save, over server-sent events. The script is injected into the
   page the tool serves and opens `__reload` RELATIVE to it, so it reaches the
   same tool whether it is on its own port or mounted under a prefix. */
export function reloadHub(note) {
  const clients = new Set();
  return {
    broadcast(msg) {
      for (const res of clients) { try { res.write(`data: ${msg}\n\n`); } catch { clients.delete(res); } }
    },
    handle(req, res) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
    },
    inject(html) {
      const script = `<script>
/* ${note} */
(function () {
  var es = new EventSource("__reload");
  es.onmessage = function (e) { if (e.data === "reload") location.reload(); };
})();
</script>
`;
      return html.replace('</body>', script + '</body>');
    }
  };
}

/* The request loop around a handler: the Host check, the decode, and a 500
   that is a message rather than a crash. `handler(req, res, p, url)` gets the
   decoded path. */
export function guard(handler) {
  return async (req, res) => {
    if (!isLocal(req)) return text(res, 403, 'this server answers localhost only');
    let url, p;
    try {
      url = new URL(req.url, 'http://localhost');
      p = decodeURIComponent(url.pathname);
    } catch { return text(res, 400, 'bad path'); }
    try { await handler(req, res, p, url); }
    catch (e) {
      if (res.headersSent) { res.destroy(); return; }
      json(res, 500, { error: String((e && e.message) || e) });
    }
  };
}

/* One lab tool, on its own port. A tool already on the port is the one failure
   worth a sentence: the older process holds the MODULE it started with, so it
   serves code that predates whatever was just changed in tools/lab/. */
export function listen(handler, { port, label, restart, ready }) {
  const server = createServer(guard(handler));
  server.on('error', (e) => {
    if (e.code !== 'EADDRINUSE') throw e;
    console.error(`\n  port ${port} is already taken — almost always a ${label} still running.`);
    console.error('  That one serves the sources as they were when IT started, so a change');
    console.error('  made since will not show up. Take it down and start again:\n');
    if (restart) console.error(`    ${restart}`);
    console.error(`    node ${path.relative(process.cwd(), process.argv[1])} --port=${port + 1}   # or just use another port\n`);
    process.exit(1);
  });
  server.listen(port, HOST, () => ready && ready(`http://localhost:${port}/`));
  return server;
}
