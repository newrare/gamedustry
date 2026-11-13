#!/usr/bin/env node
/*
  serve-lab — every lab page on one port, behind one back office.

    node tools/lab/serve-lab.mjs            (or: make lab)
    node tools/lab/serve-lab.mjs --port=9000
    node tools/lab/serve-lab.mjs --no-watch (or: make studio)

  http://localhost:8095/ is the back office (lab/index.html): every page of
  lab/ in one list, opened beside it in a frame, one click from the next.
  Nothing new is served — the four tools that need a server are MOUNTED, each
  under its own prefix, and the pages that do not are served as files:

    /                 the back office
    /api/labs         what it lists, read off lab/*.html and prototype/*.html
    /api/labs/tags    the tags an entry may take: all, none and every game
    /api/labs/edit    POST — rename, refile or retag one entry, written
                      into the page itself (see `edit` below)
    /events/          tools/lab/serve-events.mjs   (and /events/sound, /events/library, /events/kit, /events/hole-fx)
    /text/            tools/lab/serve-text.mjs
    /store/           tools/lab/serve-store.mjs
    /village/         tools/lab/serve-village.mjs
    /stickers/        tools/lab/serve-stickers.mjs
    /lab/  /assets/  /games/  /packages/  /prototype/   read-only files,
                      which is what a file:// lab page reaches with `../`

  A mounted tool is the SAME script its own `make events` runs, started the
  first time it is asked for on a free port of 127.0.0.1 and reached through a
  proxy that takes the prefix off — which is why the four pages address their
  server with relative urls. One PROCESS per tool, not one module per
  process: a tool's scan is synchronous CPU (the copy desk's was ~18 s before
  it went per game), and in a shared process it froze every other tool for as
  long. Opening the back office starts
  none of them, so it does not run the events bench's web build either. Their
  output is printed here, each line tagged with the tool.

  --no-watch (`make studio`) hands the flag to every tool it starts, so
  none of them watches the sources: an agent editing games/ or lab/ no longer
  reloads the page under the hand. A tool's own write (an APPLY) still
  rebuilds and reloads, since that one was asked for. Restart to pick up a
  change made elsewhere.

  Localhost only, like every lab server: it binds 127.0.0.1 and answers a
  request only when its Host names this machine. Four of these tools write
  into the repo, and so does the back office itself, in one place: the ⋮ of
  an entry rewrites the three lines of its page that the list is read off.
*/

import fs from 'node:fs';
import net from 'node:net';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HOST, isMain, portArg, listen, json, notFound, sendFile, text, readJson, inside } from '../lib/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LAB = path.join(ROOT, 'lab');
const PROTO = path.join(ROOT, 'prototype');
const HOME = path.join(LAB, 'index.html');
const LIVE = !process.argv.includes('--no-watch');

/* The mounted tools, and the lab pages each one serves. A page listed here is
   never served as a bare file: without its server under it, it would open on
   an api that is not there. */
const TOOLS = [
  { mount: '/events/', script: 'serve-events.mjs', pages: { 'game-events-message.html': '', 'game-events-sound.html': 'sound', 'sound-library.html': 'library', 'sound-kit.html': 'kit', 'overlay-pop.html': 'pop', 'holepocalypse-fx.html': 'hole-fx' } },
  { mount: '/text/', script: 'serve-text.mjs', pages: { 'game-text.html': '' } },
  { mount: '/store/', script: 'serve-store.mjs', pages: { 'store-card.html': '' } },
  { mount: '/village/', script: 'serve-village.mjs', pages: { 'village.html': '' } },
  { mount: '/stickers/', script: 'serve-stickers.mjs', pages: { 'sticker-review.html': '' } }
];

const READ_ONLY = ['lab', 'assets', 'games', 'packages', 'prototype'].map((d) => path.join(ROOT, d));

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
    const child = spawn(process.execPath, [path.join(ROOT, 'tools', 'lab', t.script), `--port=${port}`, ...(LIVE ? [] : ['--no-watch'])],
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

/* Where a page is filed, written in the page itself so a new one needs no
   registry: `<meta name="lab-group" content="tools|css|tests">` and, for a
   page about one game, `<meta name="lab-game" content="radiam">`. A page that
   names no group is filed by what it is — a tool with a server, or "other".
   A tool whose page is a checklist names its tick, `<meta name="lab-done"
   content="api/done">`, relative to the page: the back office asks it for
   `{ checked, total, done }` and greens the entry once everything is checked.
   A page of prototype/ may declare the same two, plus `<meta name="lab-name">`:
   its group is the folder unless it says otherwise, and its name the file's
   unless it names itself (its <title> is not its name — three share one).
   `lab-game` may also read "all" or "none", the two tags that are no game. */
const GROUPS = ['tools', 'css', 'tests', 'prototype'];
const metaOf = (src, name) => (src.match(new RegExp(`<meta name="${name}" content="([^"]*)"`)) || [])[1] || null;

function labs() {
  const slugs = fs.readdirSync(path.join(ROOT, 'games'))
    .filter((d) => fs.existsSync(path.join(ROOT, 'games', d, 'manifest.json')));
  const out = [];
  for (const file of fs.readdirSync(LAB).sort()) {
    if (!file.endsWith('.html') || file === 'index.html' || file.startsWith('_')) continue;
    const src = fs.readFileSync(path.join(LAB, file), 'utf8');
    const title = (src.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    const served = toolOf(file);
    const declared = metaOf(src, 'lab-game');
    // A declared tag is kept even before games/<slug>/ exists (parrynormal).
    const game = NO_GAME.includes(declared) ? null : declared ||
      slugs.find((s) => file === s + '.html' || file.startsWith(s + '-')) || null;
    const g = metaOf(src, 'lab-group');
    const group = GROUPS.includes(g) ? g : served ? 'tools' : 'other';
    out.push({
      file, title, game, group,
      tag: game || (NO_GAME.includes(declared) ? declared : 'all'),
      path: 'lab/' + file,
      name: nameOf(title, file),
      summary: summaryOf(src),
      url: served ? served.url : '/lab/' + file,
      server: served ? served.tool.mount.replace(/\//g, '') : null,
      done: served && metaOf(src, 'lab-done') ? served.tool.mount + metaOf(src, 'lab-done') : null
    });
  }
  /* A prototype's header is the first comment of its script, `//` lines or a
     block: `// Compass — units that never step, they pivot.` */
  const protoSummary = (src) => {
    const m = src.match(/<script>\s*((?:\/\/.*\n\s*)+|\/\*[\s\S]*?\*\/)/);
    if (!m) return '';
    const para = m[1].replace(/^\s*(\/\/|\/\*+|\*\/|\*)/gm, ' ').replace(/[=\-]{4,}/g, ' ').replace(/\s+/g, ' ').trim();
    const line = summaryOf('/* ==\n' + para + '\n\n');
    // A file name or a section heading (`Arrow rush`, `tunables`) says nothing.
    return line.split(' ').length >= 3 ? line : '';
  };
  /* Three of them share one <title>, so the file name is what tells them
     apart: `tnt-coyote-canyon.html` → "Tnt coyote canyon". */
  for (const file of fs.readdirSync(PROTO).sort()) {
    if (!file.endsWith('.html')) continue;
    const src = fs.readFileSync(path.join(PROTO, file), 'utf8');
    const name = metaOf(src, 'lab-name') || file.replace(/\.html$/, '').replace(/-/g, ' ');
    const g = metaOf(src, 'lab-group');
    const declared = metaOf(src, 'lab-game');
    const game = NO_GAME.includes(declared) ? null :
      declared || slugs.find((s) => file === s + '.html' || file.startsWith(s + '-')) || null;
    out.push({
      file, title: '', group: GROUPS.includes(g) ? g : 'prototype',
      game, tag: game || (NO_GAME.includes(declared) ? declared : 'none'),
      path: 'prototype/' + file,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      summary: protoSummary(src),
      url: '/prototype/' + file,
      server: null
    });
  }
  return out;
}

// ── what the back office writes ───────────────────────────────────────────

const NO_GAME = ['all', 'none'];

function gameSlugs() {
  return fs.readdirSync(path.join(ROOT, 'games'))
    .filter((d) => fs.existsSync(path.join(ROOT, 'games', d, 'manifest.json'))).sort();
}

/* One `<meta name="…">` of a page set, replaced or taken out (`value` null).
   A new one goes under the page's other lab metas, or under its <title>, or
   under its charset — where every page that declares one already has it. */
function setMeta(src, name, value) {
  const line = new RegExp(`[ \\t]*<meta name="${name}" content="[^"]*">[ \\t]*\\n?`);
  const tag = `<meta name="${name}" content="${value}">`;
  if (line.test(src)) return src.replace(line, value == null ? '' : tag + '\n');
  if (value == null) return src;
  const anchors = [/(<meta name="lab-[a-z]+" content="[^"]*">[ \t]*\n)(?![\s\S]*<meta name="lab-)/,
    /(<title>[^<]*<\/title>[ \t]*\n)/, /(<meta charset="[^"]*">[ \t]*\n)/, /(<head>[ \t]*\n)/];
  for (const a of anchors) if (a.test(src)) return src.replace(a, `$1${tag}\n`);
  throw new Error('no <head> to put the meta in');
}

/* `edit` — the ⋮ of an entry. Each field is written where the list reads it:
   a lab page's name is the end of its <title> (`Lab — <name>`), a
   prototype's its `lab-name`; the section is `lab-group`, the tag `lab-game`.
   A value equal to what the page would be filed as anyway takes the meta out
   rather than writing the default down. */
function edit({ path: rel, name, group, tag }) {
  const entry = labs().find((l) => l.path === rel);
  if (!entry) throw new Error('no such page: ' + rel);
  const file = path.join(ROOT, rel);
  if (!inside(file, LAB) && !inside(file, PROTO)) throw new Error('outside lab/ and prototype/');
  const proto = rel.startsWith('prototype/');
  let src = fs.readFileSync(file, 'utf8');

  if (name != null) {
    name = String(name).replace(/\s+/g, ' ').trim();
    if (!name) throw new Error('a name cannot be empty');
    if (/[<>&"]/.test(name)) throw new Error('a name cannot hold < > & or "');
    if (proto) {
      const own = path.basename(file, '.html').replace(/-/g, ' ');
      src = setMeta(src, 'lab-name', name.toLowerCase() === own.toLowerCase() ? null : name);
    } else {
      const m = src.match(/<title>([^<]*)<\/title>/);
      const prefix = m && /\s+—\s+/.test(m[1]) ? m[1].split(/\s+—\s+/)[0] : 'Lab';
      const title = `<title>${prefix} — ${name}</title>`;
      src = m ? src.replace(m[0], title) : src.replace(/(<meta charset="[^"]*">[ \t]*\n)/, `$1${title}\n`);
      if (!src.includes(title)) throw new Error('no <title> to rename');
    }
  }
  if (group != null) {
    if (!GROUPS.includes(group)) throw new Error('no such section: ' + group);
    src = setMeta(src, 'lab-group', proto && group === 'prototype' ? null : group);
  }
  if (tag != null) {
    tag = String(tag).trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*$/.test(tag)) throw new Error('a tag is all, none or a game slug');
    src = setMeta(src, 'lab-game', tag === (proto ? 'none' : 'all') ? null : tag);
  }
  fs.writeFileSync(file, src);
  console.log(`  [lab] ${rel}: ${[name != null && 'name', group != null && 'section', tag != null && 'tag'].filter(Boolean).join(', ')} written`);
}

// ── the request ───────────────────────────────────────────────────────────

export async function handle(req, res, p, url) {
  if (p === '/' || p === '/index.html') {
    if (sendFile(res, HOME, [LAB])) return;
    return notFound(res, p);
  }
  if (p === '/api/labs') return json(res, 200, labs());
  if (p === '/api/labs/tags') return json(res, 200, NO_GAME.concat(gameSlugs()));
  if (p === '/api/labs/edit') {
    // JSON only: a cross-site form cannot send it without a preflight.
    if (req.method !== 'POST' || !/^application\/json/.test(req.headers['content-type'] || '')) return text(res, 405, 'POST json');
    try { edit(await readJson(req, 4096)); } catch (e) { return json(res, 400, { error: String(e.message || e) }); }
    return json(res, 200, labs());
  }

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
      if (!LIVE) console.log('  watching nothing (--no-watch): restart to pick up a change made elsewhere');
      console.log('  bound to 127.0.0.1 — localhost only\n');
    }
  });
}
