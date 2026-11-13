#!/usr/bin/env node
/*
  gen-guides — every game's guide, read back out of the game for the site.

    node tools/build/gen-guides.mjs               # refresh the WORDS of every stale game
    node tools/build/gen-guides.mjs vipera        # ... of these games, stale or not
    node tools/build/gen-guides.mjs --shoot       # words AND pictures, every game
    node tools/build/gen-guides.mjs --shoot vipera
    node tools/build/gen-guides.mjs --check       # exit 1 when a guide is older than its game

  WHY IT EXISTS. The site publishes each game's guide as a page of its own
  (tools/build/build-site.mjs, /guide/<slug>), in French and in English, and
  that page must never hold a word of its own: a rule is written ONCE, in
  `Game.guide` of games/<slug>/game.js and in the `web.copy.fr.strings` of its
  manifest, and proofread once, on the copy desk. So nothing here is typed.
  This runs the game's own web build in a headless Chrome, asks it for
  `Game.guide.chapters()` in each language — the very call the in-game guide
  makes (packages/webshell/guide.js) — and writes down what it answered.

  WHAT IT WRITES. assets/guide/<slug>/guide.json, GENERATED, never edited: the
  two languages, chapter by chapter, plus a STAMP — a hash of the game's
  game.js and manifest.json. A guide whose stamp no longer matches its game is
  stale, and `node tools/update.mjs` refreshes it on its own, so a word changed
  in the game is a word changed on the site with nothing else to do. It is
  committed, like assets/image/embed/: the Vercel build has no Chrome and
  reads it as an input.

  THE PICTURES are the guide's own — the `pic` and the `node` of each page,
  shot where the in-game guide draws them, on a transparent ground — as
  assets/guide/<slug>/<page-id>.webp (one file when both languages draw the
  same thing, `.en` / `.fr` otherwise). They are only made by `--shoot`: a
  refresh of the words keeps the pictures it finds, because a picture is a
  dozen seconds of Chrome per game and only changes when the game LOOKS
  different. A page with a picture nobody has shot yet is published without
  it, and reported.
*/

import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reap, sweep, reportSweep } from '../lab/chrome.mjs';
import { mimeOf, isMain } from '../lib/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'assets', 'guide');
const WEB = path.join(ROOT, 'dist', 'web');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LANGS = ['en', 'fr'];
const PREFIX = 'gd-guides-';

/* The pictures are shot at one and a half times the design space: a guide
   picture is at most ~600 design px wide, so ~900 px — enough for a phone that
   shows it 350 points wide, at half the bytes of a 2x shot (~25 KB apiece). */
const DSF = 1.5;
const QUALITY = 80;

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const SHOOT = argv.includes('--shoot');
const only = argv.filter((a) => !a.startsWith('--'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- which games, and which of them are stale ---------------------- */

function manifestOf(slug) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'games', slug, 'manifest.json'), 'utf8'));
}

const ALL = fs.readdirSync(path.join(ROOT, 'games'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(ROOT, 'games', d.name, 'manifest.json')))
  .map((d) => d.name)
  .filter((slug) => (manifestOf(slug).targets || []).includes('web'))
  .sort();

/* The stamp is the game's two text sources and nothing else. A change in
   packages/ that moved a guide's words (it never has) is what `--shoot` or a
   slug on the command line is for. */
export function stampOf(slug) {
  const h = createHash('sha1');
  for (const f of ['game.js', 'manifest.json']) {
    h.update(fs.readFileSync(path.join(ROOT, 'games', slug, f)));
    h.update('\0');
  }
  return h.digest('hex').slice(0, 16);
}

function readGuide(slug) {
  try { return JSON.parse(fs.readFileSync(path.join(OUT, slug, 'guide.json'), 'utf8')); }
  catch (e) { return null; }
}

function isStale(slug) {
  const g = readGuide(slug);
  return !g || g.stamp !== stampOf(slug);
}

/* ---------- the server and the browser ----------------------------------- */

function serve(dir) {
  const srv = createServer((req, res) => {
    let rel;
    try { rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, ''); }
    catch (e) { res.writeHead(400).end(); return; }
    let file = path.join(dir, rel);
    if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': mimeOf(file) });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ srv, port: srv.address().port })));
}

async function launch(profile) {
  const child = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--hide-scrollbars', '--mute-audio', '--no-first-run',
    '--autoplay-policy=no-user-gesture-required', '--window-size=720,1280', 'about:blank'
  ], { stdio: 'ignore' });
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100; i++) {
    if (fs.existsSync(portFile)) {
      const txt = fs.readFileSync(portFile, 'utf8').split('\n');
      if (txt[0]) return { child, port: parseInt(txt[0], 10) };
    }
    await sleep(100);
  }
  child.kill('SIGKILL');
  throw new Error('Chrome did not open a debugging port');
}

async function connect(port) {
  const info = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let nextId = 1;
  const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
    }
  };
  return {
    send(method, params, sessionId) {
      const id = nextId++;
      ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
      return new Promise((res, rej) => pending.set(id, { res, rej }));
    },
    close() { ws.close(); }
  };
}

/* ---------- what runs in the page ---------------------------------------- */

/* THE BOOK, AS DATA. The same walk guide.js makes (`book`, `paintPage`), with
   the nodes left out: a title, the rows, the paragraphs, the level that first
   deals the idea, and whether the page draws a picture or an example. */
const READ_BOOK = `
  var W = window.__WEB__, C = W.CONFIG, G = W.Game && W.Game.guide;
  if (!G || !G.chapters) return null;
  var code = W.Lang && W.Lang.code ? W.Lang.code() : "en";
  function plain(html) { var d = document.createElement("div"); d.innerHTML = html || ""; return d.textContent.replace(/\\s+/g, " ").trim(); }
  var copy = C.web && C.web.copy && C.web.copy[code];
  var out = { lang: code, title: C.title || "", howTo: plain((copy && copy.tagline) || C.tagline), chapters: [] };
  var ch = G.chapters() || [];
  for (var i = 0; i < ch.length; i++) {
    var pages = ch[i].pages || [], list = [];
    for (var j = 0; j < pages.length; j++) {
      var p = pages[j], pic = null, rows = [];
      try { pic = typeof p.pic === "function" ? p.pic() : p.pic; } catch (e) { pic = null; }
      for (var r = 0; r < (p.rows || []).length; r++) {
        var R = p.rows[r], v = R[1];
        if (v && v.nodeType) v = (v.textContent || "").replace(/\\s+/g, " ").trim();
        rows.push([String(R[0]), String(v), R[2] || null]);
      }
      list.push({
        id: String(p.id), title: String(p.title || ""),
        eyebrow: p.eyebrow ? String(p.eyebrow) : null,
        lv: p.lv || null,
        text: p.text != null ? String(p.text).split(/\\n\\s*\\n/) : (p.lines || []).map(String),
        rows: rows, hasPic: !!pic, hasNode: !!p.node
      });
    }
    if (list.length) out.chapters.push({ key: String(ch[i].key || i), label: String(ch[i].label || ""), pages: list });
  }
  return out;`;

/* ONE PAGE ON SCREEN, AND ONLY ITS PICTURE. The guide is opened on the page
   by name, as a notice would (so its level never locks it), and everything
   but the node being shot is hidden — `visibility` inherits, so the picture's
   own tree shows and the card, the plate under it and the game behind it do
   not: the shot is the picture on a transparent ground. */
const SHOT_CSS = `
  html.gg-shoot, html.gg-shoot body { background: transparent !important; }
  html.gg-shoot body { visibility: hidden !important; }
  html.gg-shoot .gg-target { visibility: visible !important; }
  html.gg-shoot .gu-pic { background: none !important; border-color: transparent !important; }`;

const OPEN_PAGE = (id) => `
  if (!document.getElementById("gg-style")) {
    var st = document.createElement("style"); st.id = "gg-style"; st.textContent = ${JSON.stringify(SHOT_CSS)};
    document.head.appendChild(st);
  }
  document.documentElement.classList.remove("gg-shoot");
  window.__GUIDE__.open(${JSON.stringify(id)});
  return 1;`;

const SETTLED = `
  var im = document.querySelectorAll(".gu-page img");
  for (var i = 0; i < im.length; i++) if (!im[i].complete) return false;
  return true;`;

/* Where the picture (kind "pic") or the example (kind "node") stands, in CSS
   px, once it alone is visible; null when the page draws none. */
const AIM = (kind) => `
  var old = document.querySelectorAll(".gg-target");
  for (var i = 0; i < old.length; i++) old[i].classList.remove("gg-target");
  var t = ${kind === 'pic' ? 'document.querySelector(".gu-page .gu-pic")' : 'document.querySelector(".gu-page .gu-node")'};
  if (!t) return null;
  var box = t;
  if (${kind === 'pic' ? 'true' : 'false'} && t.children.length === 1) box = t.children[0];
  if (box.scrollIntoView) box.scrollIntoView({ block: "center" });
  t.classList.add("gg-target");
  document.documentElement.classList.add("gg-shoot");
  var r = box.getBoundingClientRect(), o = t.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  /* A SCENE — a canvas the round's renderer painted, or a picture of the
     game's own artwork — is opaque and shot to its edge, so the site can lay
     it edge to edge and round its corners. A CUT — a card, a chart, anything
     standing on nothing — gets a breath around it for what it lets hang over
     its own box (a card's rosette, a glow), never past the plate it stands
     on, and the site centres it on the game's own light. */
  var scene = box.tagName === "CANVAS";
  var m = scene ? 0 : ${kind === 'pic' ? 16 : 6};
  var x0 = Math.max(r.left - m, Math.min(o.left, r.left)), y0 = Math.max(r.top - m, Math.min(o.top, r.top));
  var x1 = Math.min(r.right + m, Math.max(o.right, r.right)), y1 = Math.min(r.bottom + m, Math.max(o.bottom, r.bottom));
  /* The words a DOM picture carries (a card's name, a chart's lines), for the
     image's alt text: a canvas has none and falls back to the page's title. */
  var words = (t.innerText || "").replace(/\\s+/g, " ").trim();
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, alt: words.slice(0, 400), scene: scene };`;

/* ---------- one game ------------------------------------------------------ */

async function readGame(cdp, sid, base, slug, shoot) {
  const ev = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', {
      expression: '(function(){' + expr + '})()', returnByValue: true, awaitPromise: true
    }, sid);
    if (r.exceptionDetails) {
      throw new Error(slug + ': page threw: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    }
    return r.result.value;
  };

  const dir = path.join(OUT, slug);
  const before = readGuide(slug);
  const out = { generated: 'by tools/build/gen-guides.mjs from games/' + slug + ' — do not edit', slug, stamp: stampOf(slug) };
  const shots = {};                                   // lang → { "<id>": buf, "<id>--node": buf }

  for (const lang of LANGS) {
    /* `first=0`: no first-launch round. A fresh profile per run, so the
       language is the one the URL asks for and never a remembered choice. */
    await cdp.send('Page.navigate', { url: `${base}/${slug}/?first=0&lang=${lang}` }, sid);
    let up = false;
    for (let i = 0; i < 150; i++) {
      try { up = await ev('return !!(window.__WEB__ && window.__VIEW__ && document.getElementById("web-menu"));'); }
      catch (e) { up = false; }
      if (up) break;
      await sleep(100);
    }
    if (!up) throw new Error(slug + ': the web build never came up');
    await sleep(400);
    if (!(await ev('return !!window.__GUIDE__;'))) return null;      // a game with no guide

    const book = await ev(READ_BOOK);
    if (!book) return null;
    if (book.lang !== lang) throw new Error(`${slug}: asked for ${lang}, the build answered in ${book.lang}`);

    if (shoot) {
      /* The first call of each `pic()` above is what asked for its lazy art
         (CONFIG.artLazy): give the decodes a moment before the first shot. */
      await ev('return document.fonts && document.fonts.ready ? document.fonts.ready.then(function () { return 1; }) : 1;');
      await sleep(1200);
      shots[lang] = {};
      let first = true;
      for (const ch of book.chapters) {
        for (const p of ch.pages) {
          if (!p.hasPic && !p.hasNode) continue;
          await ev(OPEN_PAGE(p.id));
          await sleep(first ? 700 : 60);              // the card's own entrance, once
          first = false;
          for (let i = 0; i < 40; i++) { if (await ev(SETTLED)) break; await sleep(50); }
          for (const kind of ['pic', 'node']) {
            if (kind === 'pic' ? !p.hasPic : !p.hasNode) continue;
            const box = await ev(AIM(kind));
            if (!box) continue;
            await sleep(50);
            /* Rounded INWARD: a scene shot to its edge must not carry a
               sliver of the transparent ground on a fractional side. */
            const x = Math.ceil(box.x), y = Math.ceil(box.y);
            const w = Math.floor(box.x + box.w) - x, h = Math.floor(box.y + box.h) - y;
            const shot = await cdp.send('Page.captureScreenshot', {
              format: 'webp', quality: QUALITY, clip: { x, y, width: w, height: h, scale: 1 }
            }, sid);
            shots[lang][p.id + (kind === 'node' ? '--node' : '')] = {
              buf: Buffer.from(shot.data, 'base64'), w, h, alt: box.alt || '',
              scene: !!box.scene
            };
          }
        }
      }
    }
    out[lang] = { title: book.title, howTo: book.howTo, chapters: book.chapters };
  }

  /* THE PICTURES. Shot: written now, one file where both languages drew the
     same bytes. Not shot: whatever the last run left for this page id. */
  const files = new Set();
  const fileName = (key, lang) => key.replace(/[^A-Za-z0-9_-]+/g, '-') + (lang ? '.' + lang : '') + '.webp';
  const pageBefore = (lang, id) => {
    if (!before || !before[lang]) return null;
    for (const ch of before[lang].chapters) {
      for (const p of ch.pages) if (p.id === id) return p;
    }
    return null;
  };
  const kept = (lang, id, field) => {
    const p = pageBefore(lang, id);
    return p && p[field] && fs.existsSync(path.join(dir, p[field].file)) ? p[field] : null;
  };
  /* A page may declare an example that draws nothing outside a round
     (bridgessa's contract being played). The shoot writes that down as
     `blank`, so a refresh of the words does not report it as a picture
     somebody still has to shoot. */
  const wasBlank = (lang, id, field) => {
    const p = pageBefore(lang, id);
    return !!(p && p.blank && p.blank.includes(field));
  };

  fs.mkdirSync(dir, { recursive: true });
  let missing = 0;
  for (const lang of LANGS) {
    for (const ch of out[lang].chapters) {
      for (const p of ch.pages) {
        for (const [field, key, has] of [['pic', p.id, p.hasPic], ['node', p.id + '--node', p.hasNode]]) {
          let ref = null;
          if (shoot) {
            const mine = shots[lang][key];
            if (mine) {
              const twin = shots[LANGS.find((l) => l !== lang)][key];
              const same = twin && twin.buf.equals(mine.buf);
              const name = fileName(key, same ? null : lang);
              fs.writeFileSync(path.join(dir, name), mine.buf);
              ref = { file: name, w: mine.w, h: mine.h, kind: mine.scene ? 'scene' : 'cut' };
              if (mine.alt) ref.alt = mine.alt;
            }
          } else {
            ref = has ? kept(lang, p.id, field) : null;
          }
          if (ref) { p[field] = ref; files.add(ref.file); }
          else if (has && (shoot || wasBlank(lang, p.id, field))) p.blank = (p.blank || []).concat(field);
          else if (has) missing++;
        }
        delete p.hasPic;
        delete p.hasNode;
      }
    }
  }
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.webp') && !files.has(f)) fs.rmSync(path.join(dir, f));
  }
  fs.writeFileSync(path.join(dir, 'guide.json'), JSON.stringify(out, null, 1) + '\n');

  const pages = out.en.chapters.reduce((n, c) => n + c.pages.length, 0);
  return { pages, pictures: files.size, missing };
}

/* ---------- main ----------------------------------------------------------- */

async function main() {
  const unknown = only.filter((s) => !ALL.includes(s));
  if (unknown.length) { console.error('no such web game: ' + unknown.join(', ')); process.exit(2); }

  if (CHECK) {
    const bad = ALL.filter(needsRead);
    if (bad.length) {
      console.log('STALE guides (the game changed since its guide was read): ' + bad.join(' '));
      console.log('run: node tools/build/gen-guides.mjs');
      process.exit(1);
    }
    console.log('guides: ' + ALL.length + ' games, all current');
    return;
  }

  const targets = only.length ? only : SHOOT ? ALL : ALL.filter(needsRead);
  if (!targets.length) { console.log('guides: nothing stale'); return; }

  /* What is read is the CURRENT build: one game when one is asked for,
     everything otherwise (0.3 s a game). */
  const buildArgs = [path.join(ROOT, 'tools', 'build', 'build.mjs'), '--target=web'];
  if (targets.length === 1) buildArgs.push('--game=' + targets[0]);
  execFileSync(process.execPath, buildArgs, { cwd: ROOT, stdio: 'ignore' });

  reportSweep(sweep(PREFIX));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), PREFIX));
  const { srv, port } = await serve(WEB);
  const { child, port: dport } = await launch(profile);
  reap(child, { label: 'gen-guides', deadlineMs: 20 * 60 * 1000 });
  let code = 0;
  try {
    const cdp = await connect(dport);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId: sid } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sid);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 720, height: 1280, deviceScaleFactor: DSF, mobile: true }, sid);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } }, sid);

    for (const slug of targets) {
      const t0 = Date.now();
      const r = await readGame(cdp, sid, 'http://127.0.0.1:' + port, slug, SHOOT);
      if (!r) {
        /* No guide published: remembered with the stamp, so the game is not
           re-read on every update until it changes. */
        fs.mkdirSync(path.join(OUT, slug), { recursive: true });
        fs.writeFileSync(path.join(OUT, slug, '.none'), stampOf(slug) + '\n');
        console.log(`  ${slug.padEnd(14)} no guide`);
        continue;
      }
      fs.rmSync(path.join(OUT, slug, '.none'), { force: true });
      console.log(`  ${slug.padEnd(14)} ${String(r.pages).padStart(3)} pages, ${String(r.pictures).padStart(3)} pictures`
        + (r.missing ? `, ${r.missing} not shot yet (--shoot ${slug})` : '')
        + `  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    }
    cdp.close();
  } catch (e) {
    console.error('gen-guides failed: ' + e.message);
    code = 1;
  } finally {
    srv.close();
    child.kill('SIGKILL');
    /* A killed Chrome may still be writing into its profile: a profile that
       will not go is the next run's `sweep` to adopt, never a failed run. */
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) { /* swept next time */ }
  }
  process.exit(code);
}

/* Stale, or never read. A game known to publish no guide (`.none`, which
   holds the stamp it was found without one at) is only read again once it
   has changed. */
function needsRead(slug) {
  const none = path.join(OUT, slug, '.none');
  if (fs.existsSync(none)) return fs.readFileSync(none, 'utf8').trim() !== stampOf(slug);
  return isStale(slug);
}

/* build-site.mjs imports `stampOf` to say when a guide is older than its game. */
if (isMain(import.meta.url)) main();
