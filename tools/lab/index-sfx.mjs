#!/usr/bin/env node
/*
  index-sfx — read assets/audio/sfx/ back into assets/audio/sfx/index.json.

    node tools/lab/index-sfx.mjs                     # rewrite index.json, print the summary
    node tools/lab/index-sfx.mjs --list              # every file, one line each
    node tools/lab/index-sfx.mjs --list metal heavy  # AND of the terms over name, category, pack
    node tools/lab/index-sfx.mjs --json impact       # the same rows, as JSON

  The library is ~870 files from two vendors, every one named
  `<category>-<descriptor>-<NN>.<ext>` (tools/lab/rename-sfx.mjs is the record
  of how). A name says what a sound is; it cannot say how long it is, whether it
  is mono, or where it came from, and a list of 870 names is not something a
  person or a model picks from. So this reads the folder once — ffprobe per
  file, ~40 s — and writes what the bench's file menu, the library page
  (`make events` → /library) and `--list` all read instead:

    { file, stem, category, name, variant, ext,
      seconds, channels, rate, bytes,
      pack, license, source }

  `category` is the first segment of the name and `variant` its two-digit
  tail; `pack`, `license` and `source` (the vendor's original name) come out of
  sources.tsv beside the files, written by rename-sfx and extended by hand when
  a pack is added — a file with no line there is indexed and REPORTED, because
  a sound whose licence nobody wrote down is a sound nobody can ship.

  index.json is committed, like assets/image/embed/: an input the tools read,
  not a build output — tools/update.mjs never runs ffprobe. Re-run this after
  adding, removing or renaming a file (`make sfx`). It is written one entry per
  line so a change reads as a diff.
*/
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SFX = path.join(ROOT, 'assets', 'audio', 'sfx');
const INDEX = path.join(SFX, 'index.json');
const AUDIO = /\.(mp3|ogg|wav|m4a)$/i;

const argv = process.argv.slice(2);
const LIST = argv.includes('--list'), JSON_OUT = argv.includes('--json');
const terms = argv.filter((a) => !a.startsWith('--')).map((t) => t.toLowerCase());

/* ── reading the folder ──────────────────────────────────────────────────── */
async function sources() {
  const map = {};
  try {
    for (const line of (await readFile(path.join(SFX, 'sources.tsv'), 'utf8')).split('\n').slice(1)) {
      if (!line.trim()) continue;
      const [file, pack, license, source] = line.split('\t');
      map[file] = { pack, license, source: source || null };
    }
  } catch {}
  return map;
}

async function probe(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries',
    'stream=channels,sample_rate:format=duration,size', '-of', 'json', path.join(SFX, file)]);
  const j = JSON.parse(stdout);
  const s = (j.streams || [])[0] || {};
  return {
    seconds: Math.round(parseFloat(j.format.duration) * 100) / 100,
    channels: +s.channels || null, rate: +s.sample_rate || null, bytes: +j.format.size
  };
}

function parseName(file) {
  const ext = path.extname(file).toLowerCase();
  const stem = file.slice(0, -ext.length);
  const m = /^(.+?)(?:-(\d\d))?$/.exec(stem);
  const family = m[1], variant = m[2] ? +m[2] : null;
  const dash = family.indexOf('-');
  return { stem, ext: ext.slice(1), category: dash < 0 ? family : family.slice(0, dash), name: dash < 0 ? '' : family.slice(dash + 1), variant };
}

async function build() {
  const files = (await readdir(SFX)).filter((f) => AUDIO.test(f)).sort();
  const src = await sources();
  const entries = new Array(files.length);
  let next = 0;
  // Eight ffprobes at a time: the work is process spawn, not CPU.
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (next < files.length) {
      const i = next++, file = files[i];
      const s = src[file] || {};
      entries[i] = { file, ...parseName(file), ...await probe(file), pack: s.pack || null, license: s.license || null, source: s.source || null };
    }
  }));
  const warnings = [];
  const stems = {};
  for (const e of entries) {
    if (!e.pack) warnings.push(`${e.file}: no line in sources.tsv — which pack, which licence?`);
    if (stems[e.stem]) warnings.push(`${e.file} and ${stems[e.stem]}: one name, two files — a provenance note cannot tell them apart`);
    stems[e.stem] = e.file;
  }
  const count = (key) => entries.reduce((m, e) => { const k = e[key] || '?'; m[k] = (m[k] || 0) + 1; return m; }, {});
  return { entries, categories: count('category'), packs: count('pack'), warnings };
}

/* ── the two outputs ─────────────────────────────────────────────────────── */
function matches(e) {
  const hay = `${e.stem} ${e.category} ${e.pack || ''} ${e.source || ''}`.toLowerCase();
  return terms.every((t) => hay.includes(t));
}

if (LIST || JSON_OUT) {
  let index;
  try { index = JSON.parse(await readFile(INDEX, 'utf8')); }
  catch { console.error('no index.json yet — run without flags first'); process.exit(1); }
  const rows = index.files.filter(matches);
  if (JSON_OUT) { console.log(JSON.stringify(rows, null, 1)); }
  else {
    const pad = (s, n) => String(s == null ? '' : s).padEnd(n);
    for (const e of rows) {
      console.log(`${pad(e.stem, 34)} ${pad(e.category, 10)} ${String(e.seconds.toFixed(2)).padStart(5)} s  ${e.channels === 1 ? 'mono  ' : 'stereo'}  ${pad(e.pack, 20)} ${e.ext}`);
    }
    console.log(`\n${rows.length} of ${index.files.length}${terms.length ? ` — ${terms.join(' ')}` : ''}`);
  }
} else {
  const t0 = Date.now();
  const { entries, categories, packs, warnings } = await build();
  const lines = ['{', `  "count": ${entries.length},`,
    `  "categories": ${JSON.stringify(categories)},`,
    `  "packs": ${JSON.stringify(packs)},`,
    '  "files": ['].concat(entries.map((e, i) => '    ' + JSON.stringify(e) + (i < entries.length - 1 ? ',' : '')), ['  ]', '}', '']);
  await writeFile(INDEX, lines.join('\n'));
  const mb = entries.reduce((s, e) => s + e.bytes, 0) / 1048576;
  console.log(`index.json: ${entries.length} files, ${Object.keys(categories).length} categories, ${Object.keys(packs).length} packs, ${mb.toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  for (const w of warnings) console.log('  ! ' + w);
}
