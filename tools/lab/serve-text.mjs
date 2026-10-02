#!/usr/bin/env node
/*
  serve-text — the copy desk, at http://localhost:8093/

    node tools/lab/serve-text.mjs            (or: make text)
    node tools/lab/serve-text.mjs --port=9000
    make lab                                 → http://localhost:8095/text/

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

  CHECKED is the second thing it writes, into lab/text-review.json: a row a
  proofreader has read and signed off turns green. The mark keeps the TEXT it
  was given on, so a string edited since — here or by hand — reads as
  unchecked again rather than carrying a sign-off for words that are gone.

  A mark is about WORDS, so it travels: the same row (same id) reading the
  same text in another game is the same decision, and checking or unchecking
  it here does it in every game at once. An edit applied from the page is
  signed off by that apply — it was read to be written.

  TO UPDATE is the third file, lab/text-todo.json: a French string applied
  here leaves an action on the English it translates (the row of the same
  pair, or for a dictionary entry every English row that writes its key),
  because a correction in one language is a question about the other. The
  action closes when that English is checked, or when it changes — edited
  here or by hand, it has been looked at.

  STATUS is every game at once — checked, total, left to update — which is
  what turns a game green in the picker. The scans behind it are cached on
  the mtimes of the files they read, so only a game that changed is re-read.

  Saving lab/game-text.html itself reloads the page: that is the loop for
  working ON the tool. A change to a game's sources is NOT watched — the page
  re-reads them after every apply, and a reload in the middle of a proofreading
  pass would throw away the edits still on screen.
*/

import { readFile, writeFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { ROOT, scanText, games, gameList, ARMY_JS } from './scan-text.mjs';
import { applyText } from './apply-text.mjs';
import { isMain, portArg, listen, json, notFound, readJson, reloadHub, MIME } from '../lib/serve.mjs';

const run = promisify(execFile);

const PAGE = path.join(ROOT, 'lab', 'game-text.html');
const REVIEW = path.join(ROOT, 'lab', 'text-review.json');

const TODO = path.join(ROOT, 'lab', 'text-todo.json');

async function readStore(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return {}; }
}
const readReview = () => readStore(REVIEW);

// Sorted and indented, so a diff of either file reads.
async function writeStore(file, store) {
  const sorted = {};
  for (const g of Object.keys(store).sort()) {
    const keys = Object.keys(store[g] || {}).sort();
    if (!keys.length) continue;
    sorted[g] = {};
    for (const k of keys) sorted[g][k] = store[g][k];
  }
  await writeFile(file, JSON.stringify(sorted, null, 2) + '\n');
  return sorted;
}

/* A scan per game, kept while none of the files it reads has moved. A check
   travels to every game and the picker wants every game's status, so without
   this a click re-parsed fifteen games (~2 s). */
const cache = new Map();
async function mtimes(slug) {
  const files = ['manifest.json', 'game.js', 'page.html'].map((f) => path.join(ROOT, 'games', slug, f));
  files.push(path.join(ROOT, ARMY_JS));
  const st = await Promise.all(files.map((f) => stat(f).then((x) => `${x.mtimeMs}:${x.size}`, () => '-')));
  return st.join('|');
}
async function scanOf(slug) {
  const key = await mtimes(slug);
  const hit = cache.get(slug);
  if (hit && hit.key === key) return hit.scan;
  const scan = await scanText(slug);
  cache.set(slug, { key, scan });
  return scan;
}

const today = () => new Date().toISOString().slice(0, 10);

/* An action is open while the English it points at still reads what it read
   when the French moved; checking that English deletes it. */
function openTodos(scan, todos) {
  const out = {};
  const byId = new Map(scan.rows.map((r) => [r.id, r]));
  for (const [id, t] of Object.entries(todos || {})) {
    const row = byId.get(id);
    if (row && row.text === t.en) out[id] = t;
  }
  return out;
}

function statusOf(scan, review, todos) {
  const rev = review || {};
  const ok = scan.rows.filter((r) => rev[r.id] && rev[r.id].text === r.text).length;
  const todo = Object.keys(openTodos(scan, todos)).length;
  const total = scan.rows.length;
  return { checked: ok, total, todo, untranslated: scan.counts.untranslated,
    done: total > 0 && ok === total && !todo && !scan.counts.untranslated };
}

async function statusAll(slugs) {
  const [review, todos] = await Promise.all([readReview(), readStore(TODO)]);
  const out = {};
  for (const slug of slugs || await games()) out[slug] = statusOf(await scanOf(slug), review[slug], todos[slug]);
  return out;
}

async function payload(slug) {
  const [scan, review, todos] = await Promise.all([scanOf(slug), readReview(), readStore(TODO)]);
  return { ...scan, review: review[slug] || {}, todo: openTodos(scan, todos[slug]) };
}

/* One mark, set (`text`) or taken back (null), on this game's row and on the
   same row of every other game that reads the same words. Checking also closes
   the row's action: checking the English IS answering "does it still say what
   the French says". Returns the games it touched. */
async function markEverywhere(review, todos, slug, row, on) {
  const touched = [];
  for (const g of await games()) {
    const r = g === slug ? row : (await scanOf(g)).rows.find((x) => x.id === row.id);
    if (!r || r.text !== row.text) continue;
    const mine = review[g] = review[g] || {};
    if (on) {
      mine[r.id] = { text: r.text, at: today() };
      if (todos[g]) delete todos[g][r.id];
    } else if (mine[r.id] && mine[r.id].text === r.text) delete mine[r.id];
    else continue;
    touched.push(g);
  }
  return touched;
}

async function check(body) {
  const { game, id, text } = body || {};
  const scan = await scanOf(game);
  const row = scan.rows.find((r) => r.id === id);
  if (!row) throw new Error(`no row ${id}`);
  if (text != null && text !== row.text) throw new Error(`${row.context}: the file now reads "${row.text}"`);
  const [review, todos] = await Promise.all([readReview(), readStore(TODO)]);
  const touched = await markEverywhere(review, todos, game, row, text != null);
  const saved = await writeStore(REVIEW, review);
  const open = await writeStore(TODO, todos);
  return { review: saved[game] || {}, todo: openTodos(scan, open[game]),
    also: touched.filter((g) => g !== game), status: await statusAll(touched.length ? touched : [game]) };
}

/* The row an applied edit became. A manifest row keeps its id (it is the
   path); a whole game.js literal carries its text in its id, so it is found
   again by where it is, what it is and what it now reads — the nearest line
   when a context holds several. */
function rowAfter(scan, before, text) {
  const same = scan.rows.find((r) => r.id === before.id && r.text === text);
  if (same) return same;
  const alike = scan.rows.filter((r) => r.where === before.where && r.group === before.group &&
    r.lang === before.lang && r.context === before.context && r.text === text);
  alike.sort((a, b) => Math.abs((a.line || 0) - (before.line || 0)) - Math.abs((b.line || 0) - (before.line || 0)));
  return alike[0] || null;
}

// The English a French row translates: its pair's, or for a dictionary entry
// every English row that writes its key.
function englishOf(scan, fr) {
  if (fr.group === 'words') {
    return scan.rows.filter((r) => r.lang === 'en' && r.text === fr.context && (r.dict || r.where === 'game.js') && !r.code);
  }
  const pair = fr.pair || fr.echo;
  if (!pair) return [];
  return scan.rows.filter((r) => r.lang === 'en' && r.pair === pair);
}

/* What an apply leaves on the desk: every string it wrote is checked, every
   French one it wrote opens an action on its English, and a removed entry
   takes its marks with it. */
async function afterApply(slug, before, out) {
  const scan = await scanOf(slug);
  const [review, todos] = await Promise.all([readReview(), readStore(TODO)]);
  const oldById = new Map(before.rows.map((r) => [r.id, r]));
  const touched = new Set([slug]);
  out.todo = [];
  for (const a of out.applied) {
    const old = oldById.get(a.id);
    const now = old && rowAfter(scan, old, a.to);
    if (!now) continue;
    for (const g of await markEverywhere(review, todos, slug, now, true)) touched.add(g);
    if (now.lang !== 'fr' || a.from === a.to) continue;
    for (const en of englishOf(scan, now)) {
      todos[slug] = todos[slug] || {};
      todos[slug][en.id] = { en: en.text, fr: a.to, was: a.from, frId: now.id, at: today() };
      out.todo.push(`${en.context}: "${en.text}"`);
    }
  }
  for (const d of out.removed || []) if (review[slug]) delete review[slug][d.id];
  // An action whose English moved or went is answered: it leaves the file.
  todos[slug] = openTodos(scan, todos[slug]);
  await writeStore(REVIEW, review);
  await writeStore(TODO, todos);
  out.status = await statusAll([...touched]);
}

const reload = reloadHub("serve-text.mjs: the page's own source changed — take it again.");

function start() {
  let timer = null;
  try {
    watch(PAGE, () => { clearTimeout(timer); timer = setTimeout(() => reload.broadcast('reload'), 120); });
  } catch { console.error('  cannot watch lab/game-text.html'); }
  console.log('apply writes manifest.json, game.js, page.html (and army.js), then rebuilds the game');
  console.log('checked marks are written to lab/text-review.json, EN actions to lab/text-todo.json');
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

export async function handle(req, res, p, url) {
  if (p === '/__reload') return reload.handle(req, res);

  if (p === '/' || p === '/index.html') {
    const html = await readFile(PAGE, 'utf8');
    res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
    return res.end(reload.inject(html));
  }

  // The manifests only: the page lists the games before it parses any of them.
  if (p === '/api/games') return json(res, 200, await gameList());

  // Every game's status, for the picker: parses what the cache does not hold.
  if (p === '/api/status') return json(res, 200, await statusAll());

  if (p === '/api/text') {
    const slug = url.searchParams.get('game');
    if (!(await games()).includes(slug)) return notFound(res, 'game ' + slug);
    return json(res, 200, await payload(slug));
  }

  if (p === '/api/check' && req.method === 'POST') {
    const body = await readJson(req, 1e6);
    if (!(await games()).includes(body && body.game)) return notFound(res, 'game ' + (body && body.game));
    try { return json(res, 200, await check(body)); }
    catch (e) { return json(res, 400, { error: String(e.message || e) }); }
  }

  if (p === '/api/apply' && req.method === 'POST') {
    const plan = await readJson(req, 1e6);
    if (!(await games()).includes(plan && plan.game)) return notFound(res, 'game ' + (plan && plan.game));
    const stamp = new Date().toTimeString().slice(0, 8);
    let out;
    const before = await scanOf(plan.game);
    try { out = await applyText(plan.game, plan); }
    catch (e) { return json(res, 200, { error: String(e.message || e) }); }
    for (const a of out.applied) console.log(`  ${stamp}  ✓ ${a.what}  "${a.from}" → "${a.to}"`);
    for (const d of out.removed) console.log(`  ${stamp}  ✗ ${d.what}  "${d.text}" removed`);
    for (const w of out.skipped) console.log(`  ${stamp}  ! ${w}`);
    if (out.written.length) {
      out.rebuilt = await rebuild(plan.game);
      console.log(`  ${stamp}  rebuilt ${out.rebuilt.join(', ')}`);
    }
    await afterApply(plan.game, before, out);
    for (const t of out.todo) console.log(`  ${stamp}  → EN to update  ${t}`);
    // The page redraws on the file as it now reads, not on what it sent.
    out.scan = await payload(plan.game);
    return json(res, 200, out);
  }

  notFound(res, p);
}

if (isMain(import.meta.url)) {
  listen(handle, {
    port: portArg(8093), label: 'copy desk', restart: 'pkill -f serve-text.mjs && make text',
    ready(url) { console.log(`copy desk  ${url}`); start(); }
  });
}
