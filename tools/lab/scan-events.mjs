#!/usr/bin/env node
/*
  scan-events — what a game says and plays, read off its sources.

    node tools/lab/scan-events.mjs vipera        # one game, as a table
    node tools/lab/scan-events.mjs --all         # every game, one block each
    node tools/lab/scan-events.mjs vipera --json # the structure the lab page eats

  A game's feedback is not declared anywhere: a callout is a `Pop.show(...)`
  and a cue is a `Sound.clip(...)`, written where the beat happens. That is the
  right place to write them and the wrong place to REVIEW them — nobody can
  tell, from 900 lines of game logic, that two beats fight for the same anchor,
  that a sample is embedded and never played, or that a cue names a clip the
  game does not ship (Sound.clip returns silently on an unknown name, so a typo
  is inaudible rather than broken).

  So this reads the sources back: every Pop / Overlay / Sound call in
  games/<slug>/game.js, grouped into BEATS — calls close enough together to be
  one moment of the game, which is how a callout and its sound end up on the
  same card — plus the sfx pack with its provenance comments and what plays it.
  It parses, it never runs: no build, no browser, no game loop.

  lab/game-events.html is the same data with the game's own motor around it
  (`make events`), where a beat can be fired into the real build and heard.
*/

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* The calls that ARE the feedback layer. `kind` is what the lab page groups
   by: a pop can be previewed, a sound can be played, the rest is noted. */
const WATCHED = {
  'Pop.show':        { kind: 'pop' },
  /* Pop's other half: the number floating in the world. Same system, same
     namespace, drawn on the canvas instead of in the DOM (packages/shell). */
  'Pop.text':        { kind: 'pop' },
  'Overlay.toast':   { kind: 'overlay' },
  'Overlay.banner':  { kind: 'overlay' },
  'Overlay.reward':  { kind: 'overlay' },
  /* Not messages, but the same beat: a callout is designed with the shake and
     the flash under it, so a card that hid them would review half a moment.
     `Overlay.vignette` sits here and not with the notifications above because
     it holds no WORD — it is a coloured glow over the frame, juice like the
     flash, and there is nothing on it to read, re-style or re-word. */
  'Overlay.vignette':{ kind: 'fx' },
  'Fx.burst':        { kind: 'fx' },
  'Fx.ring':         { kind: 'fx' },
  'Fx.shake':        { kind: 'fx' },
  'Fx.flash':        { kind: 'fx' },
  'Fx.freeze':       { kind: 'fx' },
  'HUD.punch':       { kind: 'fx' },
  'Confetti.burst':  { kind: 'fx' },
  'Sound.clip':      { kind: 'sound' },
  'Sound.cue':       { kind: 'sound' },
  'Sound.beep':      { kind: 'sound' },
  'Sound.arp':       { kind: 'sound' },
  'Music.start':     { kind: 'music' },
  'Music.stop':      { kind: 'music' },
  'Music.duck':      { kind: 'music' },
  'Music.unduck':    { kind: 'music' }
};

// Calls this far apart, inside the same function, are the same moment.
const BEAT_GAP = 4;

/* ── a mask of what is code ───────────────────────────────────────────────
   The scan must not trip over a call written inside a comment or a string —
   `// Sound.clip("wall")` in a provenance note is exactly the case. One pass
   marks every character as code or not; everything below reads that mask.
   Regex literals are not tracked: the games hold none, and a `/` here is
   always division. */
export function codeMask(src) {
  const mask = new Uint8Array(src.length);
  let i = 0;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      i++; continue;
    }
    mask[i] = 1; i++;
  }
  return mask;
}

/* The same pass, the other way round: comments blanked, strings kept. A game
   may leave an example key commented out next to the real ones, and a regex
   over the raw text would embed the example. */
export function stripComments(src) {
  const out = src.split('');
  let i = 0;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') { out[i] = ' '; i++; } continue; }
    if (c === '/' && d === '*') {
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] !== '\n') out[i] = ' '; i++; }
      out[i] = ' '; out[i + 1] = ' '; i += 2; continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      i++; continue;
    }
    i++;
  }
  return out.join('');
}

// Line number (1-based) for every offset, built once.
function lineIndex(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return (off) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (starts[m] <= off) lo = m; else hi = m - 1; }
    return lo + 1;
  };
}

// From the '(' of a call, the source of its arguments, parentheses balanced.
export function argsOf(src, mask, open) {
  let depth = 0, i = open;
  for (; i < src.length; i++) {
    if (!mask[i]) continue;
    if (src[i] === '(' || src[i] === '[' || src[i] === '{') depth++;
    else if (src[i] === ')' || src[i] === ']' || src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return { text: src.slice(open + 1, i), end: i };
}

/* One argument, trimmed, with where it sits in the FILE — `base` is the offset
   the text was sliced from. tools/lab/apply-events.mjs rewrites an argument by
   splicing that span, which is the only way to change one value and leave the
   rest of a call (an expression, a comment, the formatting) exactly as it was. */
function spanOf(text, base, from, to) {
  let s = from, e = to;
  while (s < e && /\s/.test(text[s])) s++;
  while (e > s && /\s/.test(text[e - 1])) e--;
  return { start: base + s, end: base + e, text: text.slice(s, e) };
}

// Split on the commas that are not inside something.
export function splitArgSpans(text, base) {
  const mask = codeMask(text), out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < text.length; i++) {
    if (!mask[i]) continue;
    const c = text[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ',' && depth === 0) { out.push(spanOf(text, base, start, i)); start = i + 1; }
  }
  const last = spanOf(text, base, start, text.length);
  if (last.text || out.length) out.push(last);
  return out.filter((a, n) => a.text !== '' || n < out.length - 1);
}

function splitArgs(text) {
  return splitArgSpans(text, 0).map((s) => s.text);
}

// "…" → the string; anything else → null, and the raw expression is kept.
export function literal(expr) {
  if (!expr) return null;
  const t = expr.trim();
  const m = /^"((?:[^"\\]|\\.)*)"$/.exec(t) || /^'((?:[^'\\]|\\.)*)'$/.exec(t);
  return m ? m[1] : null;
}

// The top-level keys of an object literal, as raw expressions.
function objectFields(expr) {
  const t = (expr || '').trim();
  if (t[0] !== '{') return null;
  const fields = {};
  for (const part of splitArgs(t.slice(1, -1))) {
    const m = /^([A-Za-z_$][\w$]*|"[^"]*")\s*:([\s\S]*)$/.exec(part.trim());
    if (m) fields[m[1].replace(/"/g, '')] = m[2].trim();
  }
  return fields;
}

/* The same object, with each VALUE's span in the file, plus the span of the
   whole `{ … }` so a field that is not written yet can be inserted. */
export function objectFieldSpans(text, base) {
  if (!text || text[0] !== '{') return null;
  const parts = splitArgSpans(text.slice(1, -1), base + 1);
  const out = {};
  for (const p of parts) {
    const m = /^([A-Za-z_$][\w$]*|"[^"]*")\s*:([\s\S]*)$/.exec(p.text);
    if (!m) continue;
    const from = p.text.length - m[2].length;
    const v = spanOf(p.text, p.start, from, p.text.length);
    out[m[1].replace(/"/g, '')] = { ...v, fieldStart: p.start, fieldEnd: p.end };
  }
  return out;
}

/* ── firing a beat from the lab ───────────────────────────────────────────
   A call in a game is written against the round's own state — `popSpot()`,
   `T2.halo`, `"+" + gain` — none of which exists outside a running round. So
   every argument is resolved as far as it can be: a literal is kept exactly,
   an expression falls back to the motor's own default, and `exact` says which
   happened so the lab can mark a preview as approximate rather than pretend.
   The result is a plain [fn, args] the page applies to window.__WEB__.       */
function jsonish(expr) {
  const t = (expr || '').trim();
  if (!t) return { exact: false };
  if (/^-?\d+(\.\d+)?$/.test(t)) return { value: Number(t), exact: true };
  if (t === 'true' || t === 'false') return { value: t === 'true', exact: true };
  if (t === 'null') return { value: null, exact: true };
  const str = literal(t);
  if (str != null) return { value: str, exact: true };
  if (t[0] === '[') {
    const items = splitArgs(t.slice(1, -1)).map(jsonish);
    return { value: items.map((i) => i.value), exact: items.every((i) => i.exact) };
  }
  if (t[0] === '{') {
    const fields = objectFields(t) || {}, out = {};
    let exact = true;
    for (const k of Object.keys(fields)) {
      const v = jsonish(fields[k]);
      if (v.exact) out[k] = v.value; else exact = false;
    }
    return { value: out, exact };
  }
  return { exact: false };
}

/* Positional defaults, so an approximated call still reads like the real one:
   the same anchor, a plausible colour, the motor's own durations. */
const DEFAULTS = {
  'Pop.show':         ['combo', {}],
  'Pop.text':         [360, 560, 'TEXT', {}],
  'Overlay.toast':    ['TOAST', {}],
  'Overlay.banner':   ['BANNER', '', {}],
  'Overlay.reward':   ['+100', {}],
  'Overlay.vignette': ['rgba(255,255,255,.85)', 1, 700],
  'Fx.burst':         [360, 640, { count: 22, speed: 420, life: 0.55, size: 6, color: '#ffffff' }],
  'Fx.ring':          [360, 640, { from: 24, to: 210, width: 8, life: 0.5, color: '#ffffff' }],
  'Fx.shake':         [8],
  'Fx.flash':         ['#ffffff', 0.3],
  'Fx.freeze':        [0.12],
  'HUD.punch':        ['#ffffff'],
  'Confetti.burst':   [28],
  'Sound.clip':       [null, 0.8, 1],
  'Sound.cue':        [null, 0.8, 1],
  'Sound.beep':       [440, 0.15, 'sine', 0.3],
  'Sound.arp':        [[440, 660, 880], 55, 0.12, 'triangle', 0.3]
};

/* A word the lab can actually show when the game builds one at runtime:
   `"CHAIN x" + n` reads as "CHAIN x12", `T2.name` as "NAME". It is a stand-in
   for the shape of the copy — its length, its case — which is what a callout
   has to be reviewed against; the page lets it be typed over. */
function splitPlus(expr) {
  const mask = codeMask(expr), out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < expr.length; i++) {
    if (!mask[i]) continue;
    const c = expr[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === '+' && depth === 0 && expr[i - 1] !== '+' && expr[i + 1] !== '+') {
      out.push(expr.slice(start, i)); start = i + 1;
    }
  }
  out.push(expr.slice(start));
  return out.map((p) => p.trim()).filter(Boolean);
}

function tokenStub(part) {
  const str = literal(part);
  if (str != null) return str;
  if (/Math\.|[*/]|^\s*\d/.test(part)) return '12';
  const id = (part.match(/[\w$]+/g) || ['12']).pop();
  return /^(n|i|k|x|y|g|d|v|mult|score|gain|count|len|tier|lvl|level|chain|combo|streak|total|left|lives|num|amount|pts|points)$/i.test(id)
    ? '12' : id.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
}

function stubWord(expr, fallback) {
  const t = (expr || '').trim();
  if (!t) return fallback;
  const str = literal(t);
  if (str != null) return str;
  const parts = splitPlus(t);
  if (parts.length > 1) return parts.map(tokenStub).join('') || fallback;
  // One expression — a ternary, a lookup, a call. Its first string literal is
  // the closest thing to the copy the player will read.
  const inner = /(["'])((?:[^"'\\]|\\.)*?)\1/.exec(t);
  return inner ? inner[2] : tokenStub(t);
}

function previewOf(call) {
  const base = DEFAULTS[call.name];
  if (!base) return null;
  const args = base.map((d) => (d && typeof d === 'object' && !Array.isArray(d) ? { ...d } : d));
  let exact = true;
  for (let i = 0; i < Math.max(args.length, call.args.length); i++) {
    const got = jsonish(call.args[i]);
    if (call.args[i] == null) continue;
    if (got.exact && got.value !== undefined) {
      // An options object is merged onto the default, never replaced: what the
      // game wrote wins, what it left out keeps the motor's value.
      if (args[i] && typeof args[i] === 'object' && !Array.isArray(args[i]) &&
          got.value && typeof got.value === 'object' && !Array.isArray(got.value)) {
        args[i] = { ...args[i], ...got.value };
      } else args[i] = got.value;
    } else {
      exact = false;
      if (call.args[i].trim()[0] === '{') {
        const partial = jsonish(call.args[i]);        // keep the literal fields
        if (partial.value && typeof args[i] === 'object') args[i] = { ...args[i], ...partial.value };
      }
    }
  }
  if (call.module === 'Sound') args[0] = call.sound;

  // The copy: a literal is already in place, a runtime string gets a stand-in.
  if (call.name === 'Pop.show') {
    const o = args[1] || (args[1] = {});
    if (o.word == null) o.word = stubWord(call.wordExpr, String(args[0] || 'POP').toUpperCase());
    if (o.sub == null && call.subExpr) o.sub = stubWord(call.subExpr, '');
    if (o.at == null) delete o.at;                       // let the style decide
  } else if (call.name === 'Pop.text') {
    if (literal(call.args[2]) == null) args[2] = stubWord(call.wordExpr, 'TEXT');
  } else if (call.module === 'Overlay' && call.method !== 'vignette') {
    if (typeof args[0] !== 'string' || literal(call.args[0]) == null) args[0] = stubWord(call.wordExpr, base[0]);
    if (call.name === 'Overlay.banner' && call.subExpr && literal(call.args[1]) == null) args[1] = stubWord(call.subExpr, '');
  }
  return { fn: call.name, args, exact };
}

/* The function a call sits in: the nearest one above it declared at a shallower
   indent. Approximate on purpose — it is a label on a card, not a parser. */
function enclosing(lines, line) {
  const indent = (s) => s.match(/^\s*/)[0].length;
  const own = indent(lines[line - 1] || '');
  for (let i = line - 2; i >= 0; i--) {
    const l = lines[i];
    if (!l.trim() || indent(l) >= own) continue;
    const m = /^\s*(?:function\s+([\w$]+)|([\w$]+)\s*[:=]\s*function)/.exec(l);
    if (m) return m[1] || m[2];
  }
  return null;
}

/* Every watched call in one file. `where` is the label the page shows, and it
   is also what tells a game's own beat from one the motor fires for it. */
export function scanCalls(src, where) {
  const mask = codeMask(src), lineOf = lineIndex(src), lines = src.split('\n');
  const re = /\b(Pop|Overlay|Fx|Sound|Music|HUD|Confetti)\.(\w+)\s*\(/g;
  const calls = [];
  let m;
  while ((m = re.exec(src))) {
    if (!mask[m.index]) continue;
    const name = m[1] + '.' + m[2];
    const spec = WATCHED[name];
    if (!spec) continue;
    const open = m.index + m[0].length - 1;
    const raw = argsOf(src, mask, open);
    /* The spans are the file offsets of each argument, kept so an edit made on
       the bench can be written back into this exact call (apply-events.mjs).
       `args` is the same list flattened onto one line, which is what the whole
       scan reads. */
    const spans = splitArgSpans(raw.text, open + 1);
    const args = spans.map((sp) => sp.text.replace(/\s*\n\s*/g, ' '));
    const line = lineOf(m.index);
    const call = {
      id: where + ':' + line + ':' + m[2],
      module: m[1], method: m[2], name, kind: spec.kind,
      where, line, endLine: lineOf(raw.end),
      fn: enclosing(lines, line),
      args,
      argSpans: spans.map((sp) => ({ start: sp.start, end: sp.end })),
      argsSpan: { start: open + 1, end: raw.end },
      callSpan: { start: m.index, end: raw.end + 1 },
      source: src.slice(m.index, raw.end + 1).replace(/\s*\n\s*/g, ' ')
    };

    if (name === 'Pop.text') {
      call.word = literal(args[2]);
      call.wordExpr = args[2] || null;
      call.opts = objectFields(args[3]) || {};
    } else if (name === 'Pop.show') {
      call.style = literal(args[0]) || args[0];
      const o = objectFields(args[1]) || {};
      call.opts = o;
      call.optSpans = spans[1] ? objectFieldSpans(spans[1].text, spans[1].start) : null;
      call.word = literal(o.word) ?? (o.word ? null : undefined);
      call.wordExpr = o.word || null;
      call.sub = literal(o.sub) ?? (o.sub ? null : undefined);
      call.subExpr = o.sub || null;
      call.at = literal(o.at) || o.at || null;
      call.cls = literal(o.cls) || o.cls || null;
      call.hold = o.hold || null;
    } else if (call.module === 'Sound') {
      call.sound = literal(args[0]) || args[0] || null;
      call.soundLiteral = literal(args[0]) != null;
      call.vol = args[1] || null;
      call.rate = args[2] || null;
    } else if (call.module === 'Overlay') {
      call.word = literal(args[0]);
      call.wordExpr = args[0] || null;
      call.sub = call.method === 'banner' ? literal(args[1]) : undefined;
      call.subExpr = call.method === 'banner' ? args[1] || null : null;
    }
    call.preview = previewOf(call);
    calls.push(call);
  }
  return calls;
}

/* Calls that belong to the same moment: same function, within BEAT_GAP lines.
   This is the whole point of the tool — a pop and the clip under it are two
   statements, and reviewing either one alone tells you nothing. */
function beatsOf(calls, lines) {
  const beats = [];
  for (const call of calls) {
    const last = beats[beats.length - 1];
    if (last && last.fn === call.fn && call.line - last.endLine <= BEAT_GAP) {
      last.calls.push(call);
      last.endLine = Math.max(last.endLine, call.endLine);
      continue;
    }
    beats.push({ id: call.id, fn: call.fn, line: call.line, endLine: call.endLine, calls: [call] });
  }
  return beats.map((b) => {
    const from = Math.max(1, b.line - 2), to = Math.min(lines.length, b.endLine + 1);
    const block = lines.slice(from - 1, to);
    const pad = Math.min(...block.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length));
    return {
      ...b,
      kinds: [...new Set(b.calls.map((c) => c.kind))],
      code: block.map((l) => l.slice(pad)).join('\n'),
      codeFrom: from
    };
  });
}

/* The sfx pack. Keys come out of ASSETS.sounds; the note next to each one is
   the provenance comment a game writes above the block ("orb: ui_mallet…"),
   which is the only record of which file in assets/audio/sfx/ a clip was cut
   from. */
export function soundPack(src) {
  const at = src.indexOf('sounds:');
  if (at < 0) return { keys: [], notes: {}, noteSpans: {}, block: null };
  const mask = codeMask(src);
  const open = src.indexOf('{', at);
  const block = argsOf(src, mask, open);
  const body = stripComments(src.slice(open, block.end + 1));
  const keys = [];
  // A key is written bare or quoted, depending on the game.
  const re = /(^|[\s,{])(?:"([\w$]+)"|'([\w$]+)'|([A-Za-z_$][\w$]*))\s*:\s*"data:([^;,"]+)/g;
  let m;
  while ((m = re.exec(body))) {
    /* The base64 itself, without its quotes: apply-events.mjs swaps that span
       when a clip is re-cut from another file, and a data URI holds no quote,
       so the next one closes the string. */
    const q = m.index + m[0].lastIndexOf('"data:') + 1;
    const close = body.indexOf('"', q);
    keys.push({
      key: m[2] || m[3] || m[4], mime: m[5],
      valueStart: open + q, valueEnd: open + (close < 0 ? q : close)
    });
  }

  /* Provenance comments. The only record of which file in assets/audio/sfx/ a
     clip was cut from is the comment a game writes above the block, and the
     thirteen write it two ways — "orb: name (note)" and "orb   name (note)" —
     so the key is matched first and the separator is whatever follows. */
  const notes = {}, noteSpans = {};
  const headFrom = Math.max(0, at - 4000);
  const head = src.slice(headFrom, open + body.length);
  let off = headFrom;
  for (const line of head.split('\n')) {
    const from = off;
    off += line.length + 1;
    const c = /^\s*\/\/\s*([A-Za-z_$][\w$]*)\s*[: ]\s*(\S.*)$/.exec(line);
    if (!c) continue;
    if (!keys.some((k) => k.key === c[1])) continue;
    if (notes[c[1]]) continue;
    notes[c[1]] = c[2].trim();
    /* The span of the NOTE only, so rewriting it keeps "// key:" and its
       column — plus the whole line, which is what goes when the clip does. */
    const vFrom = line.length - c[2].length;
    noteSpans[c[1]] = {
      start: from + vFrom, end: from + line.length, indent: line.match(/^\s*/)[0],
      lineStart: from, lineEnd: Math.min(src.length, from + line.length + 1)
    };
  }
  return { keys, notes, noteSpans, block: { open, end: block.end } };
}

/* ── the sfx library ──────────────────────────────────────────────────────
   assets/audio/sfx/ as it is on disk. A game's clip is a CUT of one of these
   files, and the only record of which one is the provenance comment, written
   in the stripped form below — so the same function names a file for the bench
   and resolves a note back to a file for tools/lab/apply-events.mjs.

   "zapsplat_multimedia_ui_mallet_tone_single_plink_generic_002_105003.mp3"
   becomes "ui_mallet_tone_single_plink_generic_002".                        */
export function sfxLabel(file) {
  return file.replace(/\.[^.]+$/, '')
    .replace(/^zapsplat_multimedia_/, '')
    .replace(/^zapsplat_/, '')
    .replace(/_\d{4,}$/, '');
}

export const SFX_DIR = path.join(ROOT, 'assets', 'audio', 'sfx');

let SFX = null;
export async function sfxFiles() {
  if (SFX) return SFX;
  const names = (await readdir(SFX_DIR)).filter((f) => /\.(mp3|ogg|wav|m4a)$/i.test(f)).sort();
  SFX = names.map((file) => ({ file, label: sfxLabel(file) }));
  return SFX;
}

/* The file a note was cut from. The longest label that appears in the note
   wins, because several clips share a prefix ("alert_chime_bright_airy_positive
   _002" is inside nothing, but "sfx_hit_01_sport" and "sfx_hit_01" would be). */
export function fileForNote(note, files) {
  if (!note) return null;
  let best = null;
  for (const f of files) {
    if (note.indexOf(f.label) < 0) continue;
    if (!best || f.label.length > best.label.length) best = f;
  }
  return best ? best.file : null;
}

export async function games() {
  const dirs = await readdir(path.join(ROOT, 'games'), { withFileTypes: true });
  return dirs.filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

let MOTOR = null;
// The lab server re-scans on save; the motor pass is the only thing cached.
export function clearCache() { MOTOR = null; }

/* What every game inherits: the end-screen cues, the level stars, the pause
   card. A game owns none of these and can still be surprised by them. */
async function motorCalls() {
  if (MOTOR) return MOTOR;
  const files = [
    'packages/shell/shell.js',
    'packages/engine/engine.js',
    'packages/engine/bootstrap.js',
    'packages/webshell/menu.js',
    'packages/webshell/levels.js'
  ];
  const out = [];
  for (const f of files) {
    const src = await readFile(path.join(ROOT, f), 'utf8');
    out.push(...scanCalls(src, f));
  }
  MOTOR = out;
  return out;
}

/* CONFIG.music — what the bed is set to play at. The shell starts it, so it
   appears in no call the scan can find, and a bench that lists the audio of a
   game has to list it from somewhere. */
function musicConfig(src) {
  // The block may hold a nested one of its own (`menu`, the web shell's
  // section of the track), so the body is read brace-aware rather than up to
  // the first `}`.
  const m = /\bmusic\s*:\s*\{/.exec(stripComments(src));
  if (!m) return null;
  const body = braced(stripComments(src), m.index + m[0].length - 1);
  if (body == null) return null;
  const out = {};
  for (const part of splitArgs(body)) {
    const kv = /^([\w$]+)\s*:\s*([\s\S]+)$/.exec(part.trim());
    if (kv) out[kv[1]] = kv[2].replace(/\s+/g, ' ');
  }
  return out;
}

// The contents of the {...} whose opening brace sits at `at`, braces balanced.
function braced(src, at) {
  let depth = 0;
  for (let i = at; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(at + 1, i);
  }
  return null;
}

export async function scanGame(slug) {
  const dir = path.join(ROOT, 'games', slug);
  const src = await readFile(path.join(dir, 'game.js'), 'utf8');
  let manifest = {};
  try { manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8')); } catch {}

  const where = `games/${slug}/game.js`;
  const lines = src.split('\n');
  const calls = scanCalls(src, where);
  const beats = beatsOf(calls, lines);
  const pack = soundPack(src);

  // Who plays what, and what nobody plays.
  const played = {};
  for (const c of calls) {
    if (c.module !== 'Sound' || !c.soundLiteral) continue;
    (played[c.sound] = played[c.sound] || []).push(c.line);
  }
  const motor = await motorCalls();
  for (const c of motor) {
    if (c.module !== 'Sound' || !c.soundLiteral) continue;
    if (pack.keys.some((k) => k.key === c.sound)) (played[c.sound] = played[c.sound] || []).push(c.where + ':' + c.line);
  }

  const lib = await sfxFiles();
  const sounds = pack.keys.map((k) => ({
    key: k.key, mime: k.mime,
    note: pack.notes[k.key] || null,
    // Which file in assets/audio/sfx/ this clip was cut from, when the note says.
    file: k.key === 'music' ? null : fileForNote(pack.notes[k.key], lib),
    bytes: Math.round((k.valueEnd - k.valueStart) * 3 / 4),
    plays: played[k.key] || [],
    music: k.key === 'music'
  }));

  const warnings = [];
  for (const s of sounds) {
    if (!s.plays.length && !s.music) warnings.push(`${s.key} is embedded and never played — dead bytes in every build`);
  }
  for (const c of calls) {
    if (c.module !== 'Sound' || !c.soundLiteral) continue;
    if (sounds.some((s) => s.key === c.sound)) continue;
    warnings.push(c.method === 'cue'
      ? `line ${c.line}: Sound.cue("${c.sound}") has no clip — it falls back to a beep`
      : `line ${c.line}: Sound.clip("${c.sound}") names no embedded clip — it plays nothing`);
  }
  const silentPops = beats.filter((b) => b.kinds.includes('pop') && !b.kinds.includes('sound'));
  for (const b of silentPops) warnings.push(`line ${b.line}: the callout in ${b.fn || 'the game'}() fires with no sound`);

  return {
    slug,
    title: manifest.title || slug,
    version: manifest.version || null,
    targets: manifest.targets || [],
    where,
    beats, calls, sounds, warnings,
    music: musicConfig(src),
    motor: motor.map((c) => ({ ...c, inherited: true })),
    counts: {
      pop: calls.filter((c) => c.kind === 'pop').length,
      fx: calls.filter((c) => c.kind === 'fx').length,
      sound: calls.filter((c) => c.kind === 'sound').length,
      overlay: calls.filter((c) => c.kind === 'overlay').length,
      beats: beats.length
    }
  };
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */
function print(g) {
  const pad = (s, n) => String(s == null ? '' : s).padEnd(n);
  console.log(`\n${g.title}  (${g.slug}${g.version ? ' v' + g.version : ''})   ` +
    `${g.counts.beats} beats · ${g.counts.pop} pops · ${g.counts.overlay} overlays · ${g.counts.sound} cues`);
  for (const b of g.beats) {
    const head = b.calls.map((c) => c.kind === 'pop'
      ? `${c.style || c.method}${c.word ? ' "' + c.word + '"' : ''}`
      : c.kind === 'sound' ? `${c.method}:${c.sound}` : c.name).join('  +  ');
    console.log(`  ${pad('L' + b.line, 7)} ${pad(b.fn ? b.fn + '()' : '', 20)} ${head}`);
  }
  console.log(`  sfx  ${g.sounds.map((s) => s.key + '(' + s.plays.length + ')').join(' ')}`);
  if (g.warnings.length) {
    console.log('  warnings');
    for (const w of g.warnings) console.log('    ! ' + w);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  const slugs = argv.includes('--all') ? await games() : argv.filter((a) => !a.startsWith('-'));
  if (!slugs.length) {
    console.log('usage: node tools/lab/scan-events.mjs <slug> [--json] | --all');
    console.log('       games: ' + (await games()).join(' '));
    process.exit(1);
  }
  const out = [];
  for (const s of slugs) out.push(await scanGame(s));
  if (json) console.log(JSON.stringify(out.length === 1 ? out[0] : out, null, 2));
  else out.forEach(print);
}
