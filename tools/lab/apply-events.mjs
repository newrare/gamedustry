#!/usr/bin/env node
/*
  apply-events — write a change made on the bench back into the game's source.

    node tools/lab/apply-events.mjs vipera --pop 551:style=ultra
    node tools/lab/apply-events.mjs vipera --sfx orb=zapsplat_..._105003.mp3 --len 0.5
    node tools/lab/apply-events.mjs vipera --sfx orb=... --dry

  lab/game-events.html is where a callout is re-styled and a clip is swapped by
  ear; this is the half that makes the choice stick. Two kinds of change, and
  they are the two the bench can offer honestly:

    a call    the style of a Pop, its word, its anchor, the clip a cue names,
              its volume and its pitch — rewritten IN PLACE in
              games/<slug>/game.js, one argument at a time.

    a clip    ASSETS.sounds.<key> re-cut from another file of
              assets/audio/sfx/ (ffmpeg, mono 32 kHz / 64 kbps, a 70 ms fade —
              docs/ASSETS.md), with the provenance comment moved with it.

  Two rules hold the thing together:

    - **Only a literal is ever overwritten.** A game writes `Pop.show(style,
      { word: "+" + gain })`, and the bench previews that with a stand-in. A
      tool that pasted the stand-in back would break the game. So an argument
      built from the round's own state is REFUSED, by name, and the rest of the
      call still applies.
    - **Only the argument changes.** Everything is a span splice, never a
      re-print of the call, so a multi-line `Pop.show`, its comments and its
      indentation come back exactly as they were.

  The version moves with the source (CLAUDE.md: touching a game's sources means
  moving its version in the same change), which is what `--no-bump` turns off.
*/

import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  ROOT, SFX_DIR, scanCalls, soundPack, sfxFiles, sfxLabel, literal, games
} from './scan-events.mjs';

const run = promisify(execFile);

/* The encoding every sfx in the repo is cut with: mono, 32 kHz, 64 kbps, and a
   short fade so the cut does not click (~8 KB per second). docs/ASSETS.md. */
const RATE = 32000, KBPS = '64k', FADE = 0.07;

const q = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

/* ── the calls ────────────────────────────────────────────────────────────
   Which argument a name is, per call. `opt` means it lives inside the options
   object instead of a position. */
const FIELDS = {
  'Pop.show':        { style: { arg: 0, str: 1 }, word: { opt: 1 }, sub: { opt: 1 }, at: { opt: 1 }, cls: { opt: 1 } },
  'Pop.text':        { word: { arg: 2, str: 1 } },
  'Overlay.toast':   { word: { arg: 0, str: 1 } },
  'Overlay.banner':  { word: { arg: 0, str: 1 }, sub: { arg: 1, str: 1 } },
  'Overlay.reward':  { word: { arg: 0, str: 1 } },
  'Sound.clip':      { clip: { arg: 0, str: 1 }, vol: { arg: 1, fill: '0.8' }, rate: { arg: 2, fill: '1' } },
  'Sound.cue':       { clip: { arg: 0, str: 1 }, vol: { arg: 1, fill: '0.8' }, rate: { arg: 2, fill: '1' } }
};

/* One positional argument. An argument that is not there yet is appended, and
   the ones it skips over take the motor's own default rather than a hole. */
function setArg(src, call, spec, value, edits, skip, label) {
  const i = spec.arg;
  const spans = call.argSpans;
  const text = spec.str ? q(value) : String(value);
  if (i < spans.length) {
    if (spec.str && literal(call.args[i]) == null) {
      skip.push(`${label}: the source writes an expression (${call.args[i]}) — not overwritten`);
      return;
    }
    if (!spec.str && !/^-?\d+(\.\d+)?$/.test(call.args[i])) {
      skip.push(`${label}: the source writes an expression (${call.args[i]}) — not overwritten`);
      return;
    }
    edits.push({ start: spans[i].start, end: spans[i].end, text, what: label });
    return;
  }
  // Past the last argument: everything up to it has to be written too.
  const add = [];
  for (let n = spans.length; n < i; n++) {
    const fill = Object.values(FIELDS[call.name]).find((f) => f.arg === n && f.fill);
    if (!fill) { skip.push(`${label}: argument ${n} has no default — not written`); return; }
    add.push(fill.fill);
  }
  add.push(text);
  edits.push({ start: call.argsSpan.end, end: call.argsSpan.end, text: ', ' + add.join(', '), what: label });
}

/* One field of the options object: rewritten where it is, appended after the
   last field, or taken out when the bench cleared it. */
function setOpt(src, call, name, value, edits, skip, label) {
  const spans = call.optSpans;
  const obj = call.argSpans[1];
  const has = spans && spans[name];

  if (has) {
    if (value === '') {                                  // cleared — take it out
      const keys = Object.keys(spans);
      const n = keys.indexOf(name);
      const prev = n > 0 ? spans[keys[n - 1]] : null;
      const next = n < keys.length - 1 ? spans[keys[n + 1]] : null;
      if (prev) edits.push({ start: prev.fieldEnd, end: has.fieldEnd, text: '', what: label });
      else if (next) edits.push({ start: has.fieldStart, end: next.fieldStart, text: '', what: label });
      // The only field: the whole object goes, and so does the comma before it.
      else edits.push({ start: call.argSpans[0].end, end: obj.end, text: '', what: label });
      return;
    }
    if (literal(spans[name].text) == null) {
      skip.push(`${label}: the source writes an expression (${spans[name].text}) — not overwritten`);
      return;
    }
    edits.push({ start: has.start, end: has.end, text: q(value), what: label });
    return;
  }

  if (value === '') return;                              // nothing to add
  if (!obj) {                                            // no options object at all
    edits.push({ start: call.argsSpan.end, end: call.argsSpan.end, text: `, { ${name}: ${q(value)} }`, what: label });
    return;
  }
  if (obj.text ? obj.text[0] !== '{' : src[obj.start] !== '{') {
    skip.push(`${label}: the options are an expression — not written`);
    return;
  }
  const keys = spans ? Object.keys(spans) : [];
  if (!keys.length) {
    edits.push({ start: obj.end - 1, end: obj.end - 1, text: ` ${name}: ${q(value)} `, what: label });
    return;
  }
  const last = spans[keys[keys.length - 1]];
  edits.push({ start: last.fieldEnd, end: last.fieldEnd, text: `, ${name}: ${q(value)}`, what: label });
}

/* ── the clips ────────────────────────────────────────────────────────────
   One file of assets/audio/sfx/, cut to `len` and re-encoded the way the whole
   repo's sfx are, then handed back as the data URI ASSETS.sounds holds. */
async function encodeClip(file, len) {
  const src = path.join(SFX_DIR, path.basename(file));
  const dir = await mkdtemp(path.join(tmpdir(), 'events-'));
  const out = path.join(dir, 'clip.mp3');
  const fade = Math.max(0, len - FADE);
  try {
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', src,
      '-t', String(len), '-af', `afade=t=out:st=${fade}:d=${FADE}`,
      '-ac', '1', '-ar', String(RATE), '-b:a', KBPS, out]);
    const buf = await readFile(out);
    if (!buf.length) throw new Error('ffmpeg wrote nothing');
    return { uri: 'data:audio/mpeg;base64,' + buf.toString('base64'), bytes: buf.length };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/* The provenance comment, which is the only record of where a clip came from.
   The label is swapped in place and the note in brackets after it is kept —
   "(pitched by chain)" is about the BEAT, not about the file. */
function noteEdit(src, pack, key, file, edits) {
  const label = sfxLabel(file);
  const span = pack.noteSpans[key];
  if (span) {
    const old = src.slice(span.start, span.end);
    const tail = /\((.*)\)\s*$/.exec(old);
    const pad = tail ? Math.max(old.indexOf('(') - label.length, 1) : 0;
    edits.push({
      start: span.start, end: span.end,
      text: label + (tail ? ' '.repeat(pad) + '(' + tail[1] + ')' : ''),
      what: `note for ${key}`
    });
    return;
  }
  // No comment for this key: write one above the block's first entry.
  const first = pack.keys[0];
  if (!first) return;
  const lineStart = src.lastIndexOf('\n', first.valueStart) + 1;
  const indent = (src.slice(lineStart).match(/^[ \t]*/) || [''])[0];
  edits.push({
    start: lineStart, end: lineStart,
    text: `${indent}// ${key}: ${label}\n`, what: `note for ${key}`
  });
}

/* ── deleting ─────────────────────────────────────────────────────────────
   A beat is taken out by removing the STATEMENT, not the call: leaving
   `if (!rotCount) ;` behind would parse and would be a trap for the next
   reader. So the span runs from the start of the call's own line to the end of
   the line holding its semicolon, and it is refused unless what sits in front
   of the call on that line is nothing at all, or an `if (…)` whose whole body
   is this call — in which case the guard was only ever there for it and goes
   with it. 261 of the catalogue's 277 calls are alone on their statement; the
   16 that are not are all that kind of guard.

   Anything else — a call sharing its line, an `else` hanging off the next one,
   a guard that closes a brace — is named and left alone. A tool that writes
   into a game's source may refuse; it may not guess.                          */
function balancedParens(text) {
  let d = 0;
  for (const ch of text) {
    if (ch === '(') d++;
    else if (ch === ')') { d--; if (d < 0) return false; }
  }
  return d === 0;
}

function statementSpan(src, call, skip, label) {
  const lineStart = src.lastIndexOf('\n', call.callSpan.start) + 1;
  const before = src.slice(lineStart, call.callSpan.start);

  let i = call.callSpan.end;
  while (i < src.length && /\s/.test(src[i])) i++;
  if (src[i] !== ';') {
    skip.push(`${label}: the call is not a statement of its own — remove it by hand`);
    return null;
  }
  let lineEnd = src.indexOf('\n', i);
  if (lineEnd < 0) lineEnd = src.length;
  // A trailing `// …` belongs to the call and goes with it; code does not.
  const after = src.slice(i + 1, lineEnd);
  if (!/^\s*(\/\/.*)?$/.test(after)) {
    skip.push(`${label}: something else shares its line — remove it by hand`);
    return null;
  }

  const guard = before.trim();
  if (guard && !(/^if\s*\(/.test(guard) && guard.endsWith(')') && balancedParens(guard))) {
    skip.push(`${label}: it hangs off \`${guard}\` — remove it by hand`);
    return null;
  }

  const nextEnd = src.indexOf('\n', lineEnd + 1);
  const next = src.slice(lineEnd + 1, nextEnd < 0 ? src.length : nextEnd);
  if (/^\s*(\}\s*)?else\b/.test(next)) {
    skip.push(`${label}: an \`else\` follows it and would lose its \`if\` — remove it by hand`);
    return null;
  }
  /* A `//` line sitting right above it, at the same indent, was almost
     certainly written about this beat — and almost certainly not only about it.
     Guessing either way is worse than saying so, so the comment stays and the
     report names it. */
  const prevEnd = lineStart - 1;
  const prevStart = src.lastIndexOf('\n', prevEnd - 1) + 1;
  const prev = src.slice(prevStart, prevEnd);
  if (/^\s*\/\//.test(prev) && prev.match(/^\s*/)[0] === before.match(/^\s*/)[0]) {
    skip.push(`${label}: removed, but the comment above it was left — "${prev.trim().slice(0, 60)}"`);
  }
  return { start: lineStart, end: Math.min(src.length, lineEnd + 1) };
}

/* The whole `key: "data:…",` property, from the key to the comma that ends it,
   taken with the line it sits on. */
function soundEntrySpan(src, entry) {
  let a = entry.valueStart - 1;                       // the opening quote
  while (a > 0 && /\s/.test(src[a - 1])) a--;
  if (src[a - 1] !== ':') return null;
  a--;
  while (a > 0 && /\s/.test(src[a - 1])) a--;
  if (src[a - 1] === '"' || src[a - 1] === "'") {     // a quoted key
    const q = src[a - 1];
    a--;
    while (a > 0 && src[a - 1] !== q) a--;
    a--;
  } else {
    while (a > 0 && /[\w$]/.test(src[a - 1])) a--;
  }
  let b = entry.valueEnd + 1;                          // past the closing quote
  while (b < src.length && /\s/.test(src[b]) && src[b] !== '\n') b++;
  if (src[b] === ',') b++;
  const lineStart = src.lastIndexOf('\n', a) + 1;
  let lineEnd = src.indexOf('\n', b);
  if (lineEnd < 0) lineEnd = src.length;
  // Only swallow the line when the property had it to itself.
  if (/^\s*$/.test(src.slice(lineStart, a)) && /^\s*$/.test(src.slice(b, lineEnd))) {
    return { start: lineStart, end: Math.min(src.length, lineEnd + 1) };
  }
  return { start: a, end: b };
}

/* ── applying ─────────────────────────────────────────────────────────────
   Every change is a span splice, applied back to front so an offset never
   moves under the next one. Two edits that touch the same characters are a
   bug, not a merge: the second is refused and named.                        */
function splice(src, edits, skip) {
  const sorted = [...edits].sort((a, b) => b.start - a.start || b.end - a.end);
  const kept = [];
  let out = src, last = Infinity;
  for (const e of sorted) {
    if (e.end > last) { skip.push(`${e.what}: overlaps another change — not applied`); continue; }
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    last = e.start;
    kept.push(e);
  }
  /* Where each change ENDED UP, so the result can show the line as it is now
     written — the one confirmation that beats re-opening the file. */
  let delta = 0;
  for (const e of kept.sort((a, b) => a.start - b.start)) {
    const at = e.start + delta;
    delta += e.text.length - (e.end - e.start);
    const from = out.lastIndexOf('\n', Math.max(0, at - 1)) + 1;
    let to = out.indexOf('\n', at + e.text.length);
    if (to < 0) to = out.length;
    e.at = at;
    e.after = out.slice(from, Math.min(to, from + 400)).trim();
    e.newLine = out.slice(0, from).split('\n').length;
  }
  return out;
}

function bumpPatch(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || ''));
  return m ? `${m[1]}.${m[2]}.${Number(m[3]) + 1}` : null;
}

/**
 * @param {string} slug
 * @param {{calls?: Array, sfx?: Array, bump?: boolean, dry?: boolean}} plan
 *   calls: [{ line, name, set: { style?, word?, sub?, at?, clip?, vol?, rate? } }]
 *   sfx:   [{ key, file, len? }]
 */
export async function applyEdits(slug, plan) {
  const { calls = [], sfx = [], kill = {}, bump = true, dry = false } = plan || {};
  const killCalls = kill.calls || [], killClips = kill.clips || [];
  const dir = path.join(ROOT, 'games', slug);
  const file = path.join(dir, 'game.js');
  const src = await readFile(file, 'utf8');
  const where = `games/${slug}/game.js`;

  const scanned = scanCalls(src, where);
  const pack = soundPack(src);
  const lib = await sfxFiles();

  const edits = [], applied = [], skipped = [];
  // `applied` is filled after the splice, from where each change landed.

  /* Deletions first, so an edit to something that is on its way out is dropped
     rather than spliced into a span that will not exist. */
  const gone = new Set();
  for (const key of killClips) {
    const entry = pack.keys.find((k) => k.key === key);
    const label = `sounds.${key}`;
    if (!entry) { skipped.push(`${label}: no such clip in ASSETS.sounds`); continue; }
    if (key === 'music') { skipped.push(`${label}: the bed is not an sfx — remove it by hand`); continue; }

    // Every line that plays it has to go with it, or the game calls a clip it
    // no longer ships — which Sound.clip answers with silence, not an error.
    const players = scanned.filter((c) => c.module === 'Sound' && c.soundLiteral && c.sound === key);
    const spans = [];
    let stuck = false;
    for (const c of players) {
      const sp = statementSpan(src, c, skipped, `${c.name}:${c.line}`);
      if (!sp) { stuck = true; break; }
      spans.push({ span: sp, call: c });
    }
    if (stuck) { skipped.push(`${label}: left in place — one of the lines that play it cannot be removed on its own`); continue; }

    const prop = soundEntrySpan(src, entry);
    if (!prop) { skipped.push(`${label}: cannot read the ASSETS.sounds entry — remove it by hand`); continue; }
    edits.push({ start: prop.start, end: prop.end, text: '', what: label, applied: { what: label, value: 'removed from ASSETS.sounds', line: null, quiet: true } });
    const note = pack.noteSpans[key];
    if (note) edits.push({ start: note.lineStart, end: note.lineEnd, text: '', what: `note for ${key}` });
    for (const p of spans) {
      edits.push({ start: p.span.start, end: p.span.end, text: '', what: `${p.call.name}:${p.call.line}`,
        applied: { what: `${p.call.name}:${p.call.line}`, value: `removed — it played ${key}`, line: p.call.line, quiet: true } });
      gone.add(p.call.line + '|' + p.call.name);
    }
  }

  for (const k of killCalls) {
    const id = Number(k.line) + '|' + k.name;
    if (gone.has(id)) continue;
    const hits = scanned.filter((c) => c.line === Number(k.line) && c.name === k.name);
    if (hits.length !== 1) {
      skipped.push(`${k.name} at line ${k.line}: ${hits.length ? 'several calls match' : 'not found — the file moved under the bench'}`);
      continue;
    }
    const sp = statementSpan(src, hits[0], skipped, `${k.name}:${k.line}`);
    if (!sp) continue;
    edits.push({ start: sp.start, end: sp.end, text: '', what: `${k.name}:${k.line}`,
      applied: { what: `${k.name}:${k.line}`, value: 'removed', line: Number(k.line), quiet: true } });
    gone.add(id);
  }

  for (const edit of calls) {
    if (gone.has(Number(edit.line) + '|' + edit.name)) continue;
    const hits = scanned.filter((c) => c.line === Number(edit.line) && c.name === edit.name);
    if (hits.length !== 1) {
      skipped.push(`${edit.name} at line ${edit.line}: ${hits.length ? 'several calls match' : 'not found — the file moved under the bench'}`);
      continue;
    }
    const call = hits[0];
    const spec = FIELDS[call.name];
    if (!spec) { skipped.push(`${call.name}: not an editable call`); continue; }
    for (const [name, value] of Object.entries(edit.set || {})) {
      const f = spec[name];
      const label = `${call.name}:${call.line} ${name}`;
      if (!f) { skipped.push(`${label}: not an editable argument`); continue; }
      const before = edits.length;
      if (f.opt) setOpt(src, call, name, String(value), edits, skipped, label);
      else setArg(src, call, f, value, edits, skipped, label);
      for (let i = before; i < edits.length; i++) {
        edits[i].applied = { what: label, value: value === '' ? '(removed)' : String(value), line: call.line };
      }
    }
  }

  for (const edit of sfx) {
    const key = edit.key;
    if (killClips.includes(key)) continue;             // on its way out anyway
    const entry = pack.keys.find((k) => k.key === key);
    const label = `sounds.${key}`;
    if (!entry) { skipped.push(`${label}: no such clip in ASSETS.sounds`); continue; }
    if (key === 'music') { skipped.push(`${label}: the bed is not cut like an sfx — re-encode it by hand`); continue; }
    if (!lib.some((f) => f.file === edit.file)) { skipped.push(`${label}: ${edit.file} is not in assets/audio/sfx/`); continue; }
    const len = Math.min(6, Math.max(0.05, Number(edit.len) || 0.6));
    let clip;
    try { clip = await encodeClip(edit.file, len); }
    catch (e) { skipped.push(`${label}: ffmpeg failed — ${String(e.message || e).split('\n')[0]}`); continue; }
    edits.push({
      start: entry.valueStart, end: entry.valueEnd, text: clip.uri, what: label,
      applied: { what: label, value: `${sfxLabel(edit.file)}  ${len}s · ${(clip.bytes / 1024).toFixed(1)} KB`, line: null, quiet: true }
    });
    noteEdit(src, pack, key, edit.file, edits);
  }

  if (!edits.length) return { slug, applied, skipped, written: false, version: null };

  const out = splice(src, edits, skipped);
  for (const e of edits) {
    if (!e.applied || e.after === undefined) continue;
    applied.push({ ...e.applied, after: e.applied.quiet ? null : e.after, at: e.newLine });
  }
  let version = null;
  if (!dry) {
    await writeFile(file, out);
    if (bump) {
      const mf = path.join(dir, 'manifest.json');
      try {
        const raw = await readFile(mf, 'utf8');
        const json = JSON.parse(raw);
        const next = bumpPatch(json.version);
        if (next) {
          await writeFile(mf, raw.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${next}"`));
          version = next;
        }
      } catch { skipped.push('manifest.json: version not moved'); }
    }
  }
  return { slug, applied, skipped, written: !dry, version, diff: out.length - src.length };
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const slug = argv.find((a) => !a.startsWith('-'));
  const flag = (name) => {
    const i = argv.indexOf('--' + name);
    return i < 0 ? null : argv[i + 1];
  };
  const all = (name) => argv.map((a, i) => (a === '--' + name ? argv[i + 1] : null)).filter(Boolean);

  if (!slug || !(await games()).includes(slug)) {
    console.log('usage: node tools/lab/apply-events.mjs <slug> [--pop <line>:<field>=<value>] [--sfx <key>=<file>] [--len 0.6] [--no-bump] [--dry]');
    console.log('       games: ' + (await games()).join(' '));
    process.exit(1);
  }

  const len = Number(flag('len')) || 0.6;
  const calls = [];
  for (const spec of [...all('pop'), ...all('call')]) {
    const m = /^(\d+):([\w]+)=(.*)$/.exec(spec);
    if (!m) { console.error(`  ? cannot read "${spec}" — expected <line>:<field>=<value>`); continue; }
    const name = flag('name') || (m[2] === 'clip' || m[2] === 'vol' || m[2] === 'rate' ? 'Sound.clip' : 'Pop.show');
    calls.push({ line: Number(m[1]), name, set: { [m[2]]: m[3] } });
  }
  const sfx = all('sfx').map((spec) => {
    const m = /^([\w$]+)=(.+)$/.exec(spec);
    return m ? { key: m[1], file: m[2], len } : null;
  }).filter(Boolean);

  const res = await applyEdits(slug, { calls, sfx, bump: !argv.includes('--no-bump'), dry: argv.includes('--dry') });
  for (const a of res.applied) console.log(`  ✓ ${a.what} → ${a.value}` + (a.after ? `\n      ${a.at}: ${a.after}` : ''));
  for (const s of res.skipped) console.log('  ! ' + s);
  if (res.version) console.log(`  version → ${res.version}`);
  if (!res.applied.length) console.log('  nothing to apply');
  else if (res.written) console.log(`  written ${slug}/game.js — rebuild with: node tools/build/build.mjs --game=${slug}`);
}
