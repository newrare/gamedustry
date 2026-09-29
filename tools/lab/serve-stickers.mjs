#!/usr/bin/env node
/*
  serve-stickers — the sticker review desk, at http://localhost:8096/

    node tools/lab/serve-stickers.mjs            (or: make stickers)
    node tools/lab/serve-stickers.mjs --port=9000
    make lab                                     → http://localhost:8095/stickers/

  lab/sticker-review.html puts every adopted sticker of every game on one page
  — the cut in assets/image/object/, the webp that ships beside it, and the
  sheet it came from with the place it was taken out of — so the twenty per
  game can be checked by eye, one at a time, and the bad ones marked.

  A verdict is written to lab/sticker-review.json, which is the one thing this
  server writes, and it is what the re-cut reads: a sticker marked REDO with a
  note is the work order, and the fix is `cut-objects.mjs --only`, which
  rewrites that one cut and leaves the other nineteen — and their hand
  repairs — alone.

  Every verdict carries the HASH of the cut it was given on. A cut that no
  longer matches it has been re-done since, and the page asks for it to be
  looked at again rather than trusting a verdict on a picture that is gone.

  Saving lab/sticker-review.html reloads the page: that is the loop for working
  ON the tool. The verdict file is not watched — the page is what writes it.
*/

import fs from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain, portArg, listen, json, notFound, readJson, reloadHub, sendFile, MIME } from '../lib/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAGE = path.join(ROOT, 'lab', 'sticker-review.html');
const STORE = path.join(ROOT, 'lab', 'sticker-review.json');
const GAMES = path.join(ROOT, 'games');
const DIRS = {
  object: path.join(ROOT, 'assets', 'image', 'object'),
  embed: path.join(ROOT, 'assets', 'image', 'embed'),
  master: path.join(ROOT, 'assets', 'image', 'master')
};

const reload = reloadHub("serve-stickers.mjs: the page's own source changed — take it again.");

function hashOf(file) {
  try { return createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 12); }
  catch { return null; }
}

function mtimeOf(file) {
  try { return fs.statSync(file).mtimeMs; } catch { return 0; }
}

function readStore() {
  try { return JSON.parse(fs.readFileSync(STORE, 'utf8')); } catch { return {}; }
}

/* The album of every game that has one: the roles `sticker01`…`stickerNN` in
   art.objects, in order, each with the name and rarity the meta layer gives
   it. The role is the key because it is what SHIPS; the cut beside it is the
   file a re-cut rewrites. */
function albums() {
  const out = [];
  for (const slug of fs.readdirSync(GAMES).sort()) {
    const file = path.join(GAMES, slug, 'manifest.json');
    if (!fs.existsSync(file)) continue;
    const m = JSON.parse(fs.readFileSync(file, 'utf8'));
    const objects = (m.art && m.art.objects) || {};
    const meta = (m.web && m.web.meta && m.web.meta.stickers) || [];
    const roles = Object.keys(objects).filter((k) => /^sticker\d+$/.test(k)).sort();
    if (!roles.length) continue;
    const sheet = `${slug}-object-sticker.png`;
    out.push({
      slug,
      title: m.title || slug,
      version: m.version,
      sheet: fs.existsSync(path.join(DIRS.master, sheet)) ? sheet : null,
      stickers: roles.map((role) => {
        const n = parseInt(role.slice(7), 10);
        const info = meta[n - 1] || null;
        const cutFile = path.join(DIRS.object, objects[role] + '.png');
        const embed = `${slug}-${role}.webp`;
        const embedFile = path.join(DIRS.embed, embed);
        return {
          role,
          cut: objects[role],
          name: info ? info.name : null,
          rarity: info ? info.rarity : null,
          hash: hashOf(cutFile),
          embed: fs.existsSync(embedFile) ? embed : null,
          // the webp predates the cut: encode-art has not run since a re-cut
          stale: fs.existsSync(embedFile) && mtimeOf(cutFile) > mtimeOf(embedFile)
        };
      })
    });
  }
  return out;
}

/* One verdict in, the whole file out: `ok`, `redo` with a note, or null to
   take the verdict back. Written sorted and indented so a diff of it reads. */
async function review(body) {
  const { slug, role, verdict } = body || {};
  const game = albums().find((g) => g.slug === slug);
  const st = game && game.stickers.find((s) => s.role === role);
  if (!st) throw new Error(`no sticker ${slug} ${role}`);
  if (verdict !== null && verdict !== 'ok' && verdict !== 'redo') throw new Error('verdict is ok, redo or null');

  const store = readStore();
  store[slug] = store[slug] || {};
  if (verdict === null) delete store[slug][role];
  else {
    store[slug][role] = {
      verdict,
      note: String(body.note || '').trim(),
      cut: st.cut,
      hash: st.hash,
      at: new Date().toISOString().slice(0, 10)
    };
  }
  if (!Object.keys(store[slug]).length) delete store[slug];

  const sorted = {};
  for (const g of Object.keys(store).sort()) {
    sorted[g] = {};
    for (const r of Object.keys(store[g]).sort()) sorted[g][r] = store[g][r];
  }
  await writeFile(STORE, JSON.stringify(sorted, null, 2) + '\n');
  return sorted;
}

function start() {
  let timer = null;
  try {
    watch(PAGE, () => { clearTimeout(timer); timer = setTimeout(() => reload.broadcast('reload'), 120); });
  } catch { console.error('  cannot watch lab/sticker-review.html'); }
  console.log('verdicts are written to lab/sticker-review.json');
}

export async function handle(req, res, p) {
  if (p === '/__reload') return reload.handle(req, res);

  if (p === '/' || p === '/index.html') {
    const html = await readFile(PAGE, 'utf8');
    res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
    return res.end(reload.inject(html));
  }

  if (p === '/api/stickers') return json(res, 200, { games: albums(), review: readStore() });

  if (p === '/api/review' && req.method === 'POST') {
    try { return json(res, 200, { review: await review(await readJson(req, 1e5)) }); }
    catch (e) { return json(res, 400, { error: String(e.message || e) }); }
  }

  // /img/<object|embed|master>/<file> — the three folders a sticker lives in
  const m = /^\/img\/(object|embed|master)\/([^/]+)$/.exec(p);
  if (m) {
    const dir = DIRS[m[1]];
    if (sendFile(res, path.join(dir, m[2]), [dir])) return;
  }

  notFound(res, p);
}

if (isMain(import.meta.url)) {
  listen(handle, {
    port: portArg(8096), label: 'sticker review desk', restart: 'pkill -f serve-stickers.mjs && make stickers',
    ready(url) { console.log(`sticker review  ${url}`); start(); }
  });
}
