#!/usr/bin/env node
/*
  keep-english — a callout that stays in English on the French screen.

    node tools/lab/keep-english.mjs vipera "Combo!" "Perfect"        # keep them English
    node tools/lab/keep-english.mjs vipera --off "Combo!"            # give the French back

  Some words do not survive the trip: "Combo" is a word a French player reads
  in English anyway, and its translation reads like a manual. The motor needs
  nothing for it — `Lang.t` hands back whatever `web.copy.fr.strings` holds, so
  an entry whose French IS the English keeps the English, and the copy desk
  (tools/lab/scan-text.mjs) counts it as translated rather than missing. That
  entry is the whole declaration.

  What the French said before is not thrown away: it is parked in
  lab/events-keep-en.json, and `--off` puts it back. A word that never had a
  French entry has nothing to park, so `--off` takes the entry out and the copy
  desk lists it as untranslated again — which is the truth.

  lab/game-events-v2.html is what calls this (the EN toggle on a callout row,
  written on APPLY through tools/lab/serve-events.mjs). The version moves with
  the manifest, like every other write of the lab (CLAUDE.md).
*/

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { jsonStrings, ROOT } from './scan-text.mjs';
import { bumpPatch } from './apply-events.mjs';
import { isMain } from '../lib/serve.mjs';

const PARKED = path.join(ROOT, 'lab', 'events-keep-en.json');
const DICT = ['web', 'copy', 'fr', 'strings'];

async function readParked() {
  try { return JSON.parse(await readFile(PARKED, 'utf8')); } catch { return {}; }
}

// The entries of web.copy.fr.strings, as jsonStrings reads them (spans included).
function dictEntries(src) {
  return jsonStrings(src).filter((e) => e.path.length === 5 && DICT.every((k, i) => e.path[i] === k));
}

// One entry's value span replaced, the key and the layout around it untouched.
function setValue(src, entry, text) {
  return src.slice(0, entry.start) + JSON.stringify(text) + src.slice(entry.end);
}

/* A new entry goes after the last one, on its own line, at its indentation —
   so the manifest reads as if it had been typed there. A dictionary with no
   entry at all has no indentation to copy, and is refused rather than guessed. */
function addEntry(src, word) {
  const all = dictEntries(src);
  if (!all.length) return null;
  const last = all.reduce((a, b) => (b.end > a.end ? b : a));
  const lineStart = src.lastIndexOf('\n', last.keyStart) + 1;
  const indent = src.slice(lineStart, last.keyStart);
  return src.slice(0, last.end) + ',\n' + indent + JSON.stringify(word) + ': ' + JSON.stringify(word) + src.slice(last.end);
}

// The entry and its separator, as if it had never been written.
function removeEntry(src, entry) {
  const ws = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r';
  let before = entry.keyStart - 1;
  while (before >= 0 && ws(src[before])) before--;
  let after = entry.end;
  while (after < src.length && ws(src[after])) after++;
  if (src[after] === ',') return src.slice(0, before + 1) + src.slice(after + 1);
  if (src[before] === ',') return src.slice(0, before) + src.slice(entry.end);
  return src.slice(0, before + 1) + src.slice(after);
}

/**
 * @param {string} slug
 * @param {Array<{word:string, on:boolean}>} list
 * @param {{bump?: boolean, dry?: boolean}} opts
 */
export async function keepEnglish(slug, list, { bump = true, dry = false } = {}) {
  const applied = [], skipped = [];
  const mf = path.join(ROOT, 'games', slug, 'manifest.json');
  let src;
  try { src = await readFile(mf, 'utf8'); }
  catch { return { applied, skipped: [`${slug}: no manifest — nothing to keep in English`], written: false, version: null }; }
  const parked = await readParked();
  const mine = parked[slug] || {};
  const before = src;

  // One at a time, re-reading the spans between two: an insert moves every span after it.
  for (const { word, on } of list) {
    if (typeof word !== 'string' || !word) continue;
    const hit = dictEntries(src).find((e) => e.path[4] === word);
    if (on) {
      if (hit && hit.text === word) { skipped.push(`"${word}": already kept in English`); continue; }
      if (hit) { mine[word] = hit.text; src = setValue(src, hit, word); applied.push({ what: `"${word}" stays English`, value: `was "${hit.text}"` }); continue; }
      const out = addEntry(src, word);
      if (out == null) { skipped.push(`"${word}": web.copy.fr.strings holds no entry to write beside — add one in make text`); continue; }
      src = out;
      applied.push({ what: `"${word}" stays English`, value: 'had no French entry' });
    } else {
      if (!hit || hit.text !== word) { skipped.push(`"${word}": not kept in English — nothing to give back`); continue; }
      if (mine[word] != null) {
        src = setValue(src, hit, mine[word]);
        applied.push({ what: `"${word}" back in French`, value: mine[word] });
        delete mine[word];
      } else {
        src = removeEntry(src, hit);
        applied.push({ what: `"${word}" back in French`, value: 'no French on record — entry removed, translate it in make text' });
      }
    }
  }

  if (src === before) return { applied, skipped, written: false, version: null };
  try { JSON.parse(src); }
  catch (e) { return { applied: [], skipped: skipped.concat(`manifest.json: the edit left invalid JSON (${e.message}) — nothing written`), written: false, version: null }; }

  let version = null;
  if (bump) {
    const next = bumpPatch(JSON.parse(src).version);
    if (next) { src = src.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${next}"`); version = next; }
  }
  if (!dry) {
    await writeFile(mf, src);
    if (Object.keys(mine).length) parked[slug] = mine; else delete parked[slug];
    const sorted = {};
    for (const g of Object.keys(parked).sort()) sorted[g] = parked[g];
    await writeFile(PARKED, JSON.stringify(sorted, null, 2) + '\n');
  }
  return { applied, skipped, written: !dry, version };
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const off = args.includes('--off'), dry = args.includes('--dry');
  const [slug, ...words] = args.filter((a) => !a.startsWith('--'));
  if (!slug || !words.length) { console.error('usage: keep-english.mjs <slug> [--off] [--dry] <word>…'); process.exit(1); }
  const res = await keepEnglish(slug, words.map((word) => ({ word, on: !off })), { dry });
  for (const a of res.applied) console.log(`  ✓ ${a.what} (${a.value})`);
  for (const s of res.skipped) console.log(`  ! ${s}`);
  if (res.version) console.log(`  version → ${res.version}`);
}
