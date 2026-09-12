#!/usr/bin/env node
/*
  serve-store — the store card composer, with a disk under it.

    node tools/lab/serve-store.mjs
    node tools/lab/serve-store.mjs --port=4000

  lab/store-card.html is a lab page like any other and opens over file:// just
  fine, but two things it now has to do are impossible from there: LIST what a
  game owns (a directory cannot be read from a file:// page — the old card
  probed 40 URLs per object sheet and still saw only what it guessed), and
  WRITE the image it composed (a canvas that drew a file:// image is tainted,
  so toDataURL throws before anything can be saved).

  So this is the smallest server that fixes both, and nothing else:

    GET  /                    the composer
    GET  /assets/…            the real assets, by path
    GET  /api/catalogue       every game: copy, typeface, accent, and the
                              screens / art / decor / object cuts it owns
    PUT  /api/preset          save (or delete) one composition
    POST /api/save            write the composed image into assets/image/<store>/<lang>/

  It builds nothing and watches nothing: the pictures are already on disk, and
  what the page composes is what the page can draw. Everything it writes lands
  in assets/image/<store>/<lang>/ (the listing images) or lab/store-presets.json (the
  layouts), the same two places shoot-store.mjs reads.
*/

import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const PORT = Number((argv.find((a) => a.startsWith('--port=')) || '--port=8091').split('=')[1]);

const GAMES_DIR = path.join(ROOT, 'games');
const ART_DIR = path.join(ROOT, 'assets', 'image', 'embed');
const SCREEN_DIR = path.join(ROOT, 'assets', 'image', 'screen');
const OBJECT_DIR = path.join(ROOT, 'assets', 'image', 'object');
const STORE_DIR = path.join(ROOT, 'assets', 'image');
const PRESETS = path.join(ROOT, 'lab', 'store-presets.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

// ── what a game owns ───────────────────────────────────────────────────────
/* Everything here is read off the disk rather than declared: a listing image
   is made of the files a game already has, so the palette IS the directory. */

function ls(dir) {
  try { return fs.readdirSync(dir).sort(); } catch { return []; }
}

function manifestOf(slug) {
  try {
    return JSON.parse(fs.readFileSync(path.join(GAMES_DIR, slug, 'manifest.json'), 'utf8'));
  } catch { return null; }
}

/* The punchlines, resolved exactly the way shoot-store.mjs resolves them:
   store.copy.<lang>.lines first, the game's own tags as the fallback, English
   as the fallback for a language that has neither. One reader, one answer. */
function linesOf(m, lang) {
  const store = (m.store && m.store.copy && m.store.copy[lang]) || {};
  const raw = store.lines
    || (m.copy && m.copy[lang] && m.copy[lang].tags)
    || (m.copy && m.copy.en && m.copy.en.tags)
    || [];
  return raw.slice(0, 8)
    .map((l) => (typeof l === 'string' ? { line: l, kicker: '' } : { line: l.line || '', kicker: l.kicker || '' }))
    .filter((l) => l.line);
}

function catalogue() {
  const art = ls(ART_DIR);
  const screens = ls(SCREEN_DIR);
  const objects = ls(OBJECT_DIR);
  const games = {};

  for (const slug of ls(GAMES_DIR)) {
    const m = manifestOf(slug);
    if (!m) continue;

    /* The object cuts are grouped by the sheet they came out of
       (assets/image/object/<slug>-<sheet>-NN.png), because "a gear" and "a ball" are
       two palettes to the eye and one directory to the disk. */
    const cuts = {};
    for (const f of objects) {
      const mm = f.match(new RegExp('^' + slug + '-(.+)-(\\d+)\\.png$'));
      if (mm) (cuts[mm[1]] = cuts[mm[1]] || []).push(f);
    }

    games[slug] = {
      slug,
      title: m.title || slug,
      font: (m.web && m.web.font) || 'exo2',
      accent: (m.theme && m.theme.accent) || '#4dff9b',
      accent2: (m.theme && m.theme.accent2) || (m.theme && m.theme.accent) || '#4dff9b',
      copy: { en: linesOf(m, 'en'), fr: linesOf(m, 'fr') },
      screens: screens
        .filter((f) => f.startsWith(slug + '-') && f.endsWith('.jpg'))
        .map((f) => f.slice(slug.length + 1, -4))
        .filter((n) => /^\d+$/.test(n)),
      art: art
        .filter((f) => f.startsWith(slug + '-') && f.endsWith('.webp'))
        .map((f) => f.slice(slug.length + 1, -5)),
      cuts
    };
  }

  let fonts = {};
  try { fonts = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'motor', 'font', 'fonts.json'), 'utf8')); } catch {}
  delete fonts._;

  return { games, fonts, presets: readPresets() };
}

// ── the layouts ────────────────────────────────────────────────────────────
/* One file, `lab/store-presets.json`, keyed `<slug>/<format>` plus the
   `__template/<format>` entries the composer duplicates from. It is a lab
   file: hand-editable, committed, and read by tools/lab/shoot-store.mjs so a
   composition made here is what the batch shoot prints. */

function readPresets() {
  try { return JSON.parse(fs.readFileSync(PRESETS, 'utf8')); } catch { return { version: 1, presets: {} }; }
}

function writePreset(key, comp) {
  const db = readPresets();
  db.version = 1;
  db.presets = db.presets || {};
  if (comp === null) delete db.presets[key];
  else db.presets[key] = comp;
  fs.writeFileSync(PRESETS, JSON.stringify(db, null, 2) + '\n');
  return Object.keys(db.presets).length;
}

// ── serving ────────────────────────────────────────────────────────────────

function body(req) {
  return new Promise((res, rej) => {
    let b = '';
    req.on('data', (d) => {
      b += d;
      if (b.length > 64 * 1024 * 1024) { rej(new Error('body too large')); req.destroy(); }
    });
    req.on('end', () => res(b));
    req.on('error', rej);
  });
}

function json(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(s);
}

/* A save writes one file and only under assets/image/<store>/<lang>/: the name
   comes from a text field in a browser, so it is scrubbed to the shape the
   store images already have rather than trusted. The name is also what picks
   the destination — a `-thumb` is the itch cover, everything else is cut to
   Play's specs — which is the same rule tools/lab/shoot-store.mjs applies. */
function safeName(name) {
  return String(name || '').trim().replace(/\.(png|jpe?g)$/i, '').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80);
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = decodeURIComponent(url.pathname);

  try {
    if (p === '/api/catalogue') return json(res, 200, catalogue());

    if (p === '/api/preset' && req.method === 'PUT') {
      const b = JSON.parse(await body(req));
      if (!b.key || !/^[\w.-]+\/[\w-]+$/.test(b.key)) return json(res, 400, { error: 'bad key' });
      const n = writePreset(b.key, b.comp === null ? null : b.comp);
      console.log(`  layout  ${b.comp === null ? 'removed' : 'saved'}  ${b.key}   (${n} in lab/store-presets.json)`);
      return json(res, 200, { ok: true, count: n });
    }

    if (p === '/api/save' && req.method === 'POST') {
      const b = JSON.parse(await body(req));
      const lang = b.lang === 'fr' ? 'fr' : 'en';
      const name = safeName(b.name);
      const ext = b.ext === 'png' ? '.png' : '.jpg';
      if (!name) return json(res, 400, { error: 'no name' });
      const comma = String(b.data || '').indexOf(',');
      if (comma < 0) return json(res, 400, { error: 'no image' });

      const out = path.join(STORE_DIR, /-thumb$/.test(name) ? 'itch' : 'google', lang, name + ext);
      const existed = fs.existsSync(out);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(b.data.slice(comma + 1), 'base64'));
      const kb = Math.round(fs.statSync(out).size / 1024);
      const rel = path.relative(ROOT, out);
      console.log(`  ${existed ? 'replaced' : 'wrote   '}  ${rel}  (${kb} KB)`);
      return json(res, 200, { ok: true, path: rel, kb, existed });
    }

    // static: the page itself, and the two directories it is allowed to read.
    let file;
    if (p === '/' || p === '/store-card.html') file = path.join(ROOT, 'lab', 'store-card.html');
    else if (p.startsWith('/assets/')) file = path.join(ROOT, p.slice(1));
    else if (p.startsWith('/lab/')) file = path.join(ROOT, p.slice(1));
    else file = null;

    const inside = file && (file.startsWith(path.join(ROOT, 'assets') + path.sep)
      || file.startsWith(path.join(ROOT, 'lab') + path.sep));
    if (!inside || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': MIME['.txt'] });
      return res.end('not found: ' + p + '\n');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    json(res, 500, { error: String(e && e.message || e) });
  }
}).listen(PORT, () => {
  const n = Object.keys(catalogue().games).length;
  console.log(`\n  store composer   http://localhost:${PORT}/`);
  console.log(`  ${n} games, assets/ served live, saves land in assets/image/<store>/<lang>/`);
  console.log('  layouts in lab/store-presets.json — shoot-store.mjs reads them\n');
});
