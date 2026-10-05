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

  So this reads the sources back: every Pop / Notify / Sound call in
  games/<slug>/game.js, grouped into BEATS — calls close enough together to be
  one moment of the game, which is how a callout and its sound end up on the
  same card — plus the sfx pack with its provenance comments and what plays it.
  It parses, it never runs: no build, no browser, no game loop.

  lab/game-events.html is the same data with the game's own motor around it
  (`make events`), where a beat can be fired into the real build and heard.
*/

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* The calls that ARE the feedback layer. `kind` is what the lab page groups
   by: a pop can be previewed, a sound can be played, the rest is noted. */
const WATCHED = {
  'Pop.show':        { kind: 'pop' },
  /* Pop's other half: the number floating in the world. Same system, same
     namespace, drawn on the canvas instead of in the DOM (packages/shell). */
  'Pop.text':        { kind: 'pop' },
  /* The other voice: information rather than a moment — a state, a refusal,
     a lesson (packages/shell, Notify). One look, so the bench offers its word
     and its sub, never a style. */
  'Notify.say':      { kind: 'notify' },
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
  'Notify.say':       ['Notice', {}],
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
    // No word in the source is the style's own word: the motor supplies it.
    if (o.word == null && call.wordExpr) o.word = stubWord(call.wordExpr, '');
    if (o.sub == null && call.subExpr) o.sub = stubWord(call.subExpr, '');
    if (o.at == null) delete o.at;                       // let the style decide
  } else if (call.name === 'Pop.text') {
    if (literal(call.args[2]) == null) args[2] = stubWord(call.wordExpr, 'TEXT');
  } else if (call.name === 'Notify.say') {
    if (typeof args[0] !== 'string' || literal(call.args[0]) == null) args[0] = stubWord(call.wordExpr, base[0]);
    const o = args[1] && typeof args[1] === 'object' ? args[1] : (args[1] = {});
    if (o.sub == null && call.subExpr) o.sub = stubWord(call.subExpr, '');
  }
  return { fn: call.name, args, exact };
}

/* ── a built word, with real values in it ─────────────────────────────────
   `"x" + mult + Lang.t(" streak")` is copy with HOLES in it, and a stand-in
   that reads "X12 STREAK" says nothing about either language: the French half
   comes out of the `Lang.t` the game wrapped around its own literal, which only
   running the expression can apply. So the bench runs it — the game's own
   expression, inside each language's build — and the holes become SLOTS: the
   locals of the round (`mult`, `T2.name`, `cardName(c)`) the bench cannot read,
   offered as inputs with a plausible value already in them.

   Not everything is a hole. A root the build can resolve stays live:
     live     Lang, CONFIG, upper, Math… — the frame's own
     alias    `var T = CONFIG.play` → T.cuts reads the game's real tuning
     table    `var TIER_WORD = ["", "Great!", …]` → embedded, so
              TIER_WORD[tier] is a real word and `tier` is a pick of its keys
     row      `T2 = TIERS[tier]` → T2.name is TIERS[tier].name, same pick
   Everything else is a slot, and a slot's first value is a guess from its
   name and from where it sits (a ternary's condition is a boolean, an index
   is the table's first key, a `.name` is one of the names the source writes). */
const LIVE_ROOTS = new Set(['Lang', 'CONFIG', 'upper', 'Math', 'String', 'Number', 'JSON',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite']);
const KEYWORDS = new Set(['true', 'false', 'null', 'undefined', 'typeof', 'new', 'in',
  'instanceof', 'void', 'NaN', 'Infinity', 'return']);
const ID0 = /[A-Za-z_$]/, IDC = /[\w$]/;

/* What a game's source declares that the bench can stand on: its literal
   tables and constants, its aliases of CONFIG, the locals bound to a row of a
   table, and every string it writes under a property name (the suggestions a
   `.name` slot offers). Read once per game, comments blanked. */
export function textEnv(src) {
  const clean = stripComments(src), mask = codeMask(clean);
  const tables = {}, aliases = {}, rows = {}, props = {};
  let m;
  const decl = /(?:\bvar\s+|,\s*)([A-Za-z_$][\w$]*)\s*=\s*/g;
  while ((m = decl.exec(clean))) {
    const name = m[1], at = m.index + m[0].length, c = clean[at];
    if (!mask[at] && c !== '"') continue;
    if (LIVE_ROOTS.has(name)) continue;               // the frame's own, never a copy
    /* A table is a CONSTANT, and the games write those in capitals (TIERS,
       CARDS, TIER_WORD). A lowercase literal is a local that happens to start
       as one — `var foe = {…}` in one function is not the foe of another. */
    if (c === '[' || c === '{') {
      if (tables[name] || !/^[A-Z][A-Z0-9_]*$/.test(name)) continue;
      const lit = c + argsOf(clean, mask, at).text + (c === '[' ? ']' : '}');
      const v = jsonish(lit).value;
      if (v && typeof v === 'object' && Object.keys(v).length) tables[name] = v;
      continue;
    }
    const rest = clean.slice(at, at + 160);
    let a;
    /* An alias is a NAME FOR THE TUNING (`C`, `T`, `P`), written with a capital.
       `var gain = CONFIG.cureScore` is a local that starts there and moves. */
    if ((a = /^(CONFIG(?:\.[\w$]+)*)\s*[,;)]/.exec(rest))) { if (!aliases[name] && /^[A-Z]/.test(name)) aliases[name] = a[1]; continue; }
    if ((a = /^(-?\d+(?:\.\d+)?)\s*[,;]/.exec(rest)) && /^[A-Z][A-Z0-9_]*$/.test(name)) { if (!(name in tables)) tables[name] = Number(a[1]); continue; }
  }
  // `T2 = TIERS[tier]`, with or without the var — a local that is one row.
  const row = /(?:^|[\s,;(])([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*\[\s*([A-Za-z_$][\w$.]*)\s*\]\s*[,;)]/gm;
  while ((m = row.exec(clean))) {
    if (!rows[m[1]] && !tables[m[1]] && !aliases[m[1]]) rows[m[1]] = { table: m[2], index: m[3] };
  }
  const prop = /\b([A-Za-z_$][\w$]*)\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  while ((m = prop.exec(src))) {
    const list = props[m[1]] || (props[m[1]] = []);
    if (m[2] && list.length < 40 && !list.includes(m[2])) list.push(m[2]);
  }
  // A row only resolves when its table was read whole enough to embed.
  for (const k of Object.keys(rows)) if (!tables[rows[k].table] || typeof tables[rows[k].table] !== 'object') delete rows[k];
  return { tables, aliases, rows, props, clean, mask };
}

/* A bare local is often written a few lines above the call that uses it —
   `var streakSub = mult > 1 ? "x" + mult + Lang.t(" streak") : …` — and then
   the honest preview is THAT expression with its own holes, not a free field.
   The nearest assignment above the call, inside a short window, so a name
   reused by another function far away is never picked up. */
const LOCAL_WINDOW = 60;
function localExpr(name, env, at) {
  if (at == null) return null;
  const { clean, mask } = env;
  let from = at, lines = 0;
  while (from > 0 && lines < LOCAL_WINDOW) { from--; if (clean[from] === '\n') lines++; }
  const id = name.replace(/\$/g, '\\$');
  const re = new RegExp('(?:\\bvar\\s+|[,;{(]\\s*|^\\s*)' + id + '\\s*=(?!=)\\s*', 'gm');
  re.lastIndex = from;
  let m, best = null;
  while ((m = re.exec(clean)) && m.index < at) if (mask[m.index + m[0].indexOf(name)]) best = m;
  if (!best) return null;
  // Up to the comma or semicolon that closes it, brackets balanced.
  let i = best.index + best[0].length, depth = 0;
  const start = i;
  for (; i < at; i++) {
    if (!mask[i]) continue;
    const c = clean[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { if (depth === 0) break; depth--; }
    else if ((c === ',' || c === ';') && depth === 0) break;
  }
  const expr = clean.slice(start, i).trim();
  /* `x = x || "…"`, a function, or an INITIALISER — `var combo = 0` is where
     the value starts, not what it is when the callout fires: nothing a
     preview can stand on, so the name stays a slot. */
  if (!expr || /^(-?\d+(\.\d+)?|true|false|null|""|''|\[\]|\{\})$/.test(expr) || new RegExp('(^|[^\\w$.])' + id + '(?![\\w$])').test(expr) || /^function\b/.test(expr)) return null;
  return expr;
}

/* Every reference chain at the top level of an expression: a root identifier
   and what hangs off it — `.prop`, `[…]`, `(…)` — with each piece's span, so
   a chain can be kept and only its insides rewritten. */
function chainsOf(expr) {
  const mask = codeMask(expr), out = [];
  let i = 0;
  const skipWs = (j) => { while (j < expr.length && /\s/.test(expr[j])) j++; return j; };
  while (i < expr.length) {
    if (!mask[i] || !ID0.test(expr[i]) || (i > 0 && IDC.test(expr[i - 1]))) { i++; continue; }
    let back = i - 1;
    while (back >= 0 && /\s/.test(expr[back])) back--;
    const start = i;
    while (i < expr.length && IDC.test(expr[i])) i++;
    const root = expr.slice(start, i);
    if (back >= 0 && expr[back] === '.' || /^\d/.test(root)) continue;
    const acc = [];
    for (;;) {
      const j = skipWs(i);
      if (expr[j] === '.' && ID0.test(expr[skipWs(j + 1)] || '')) {
        let k = skipWs(j + 1); const s = k;
        while (k < expr.length && IDC.test(expr[k])) k++;
        acc.push({ type: '.', name: expr.slice(s, k), start: j, end: k });
        i = k; continue;
      }
      if ((expr[j] === '[' || expr[j] === '(') && mask[j]) {
        const inner = argsOf(expr, mask, j);
        acc.push({ type: expr[j], start: j, end: inner.end + 1, innerStart: j + 1, innerEnd: inner.end });
        i = inner.end + 1; continue;
      }
      break;
    }
    out.push({ root, start, end: i, acc, next: expr[skipWs(i)] || '' });
  }
  return out;
}

const NUM_GUESS = [
  [/^(g|gain|gained|pts|points|score|bonus|ko|value|amount)$|gain$|score$/i, 150],
  [/^(boost|cost)$/i, 0.25],
  [/^pct$|percent/i, 15],
  [/^lives?$/i, 2],
  [/^need$/i, 5],
  [/^(level|lvl)$/i, 4],
  [/^dist/i, 128],
  [/^w$/i, 1.2]
];
const STR_NAME = /(name|names|word|sub|title|tag|desc|label|hit|lesson|broken|reason|str|fell|line)$/i;
function numGuess(id) {
  for (const [re, v] of NUM_GUESS) if (re.test(id)) return v;
  return null;
}
function guessSlot(text, ctx) {
  if (ctx.choices && ctx.choices.length) return { kind: 'pick', value: ctx.choices[0], choices: ctx.choices };
  if (ctx.index) return { kind: 'num', value: 0 };
  const ids = text.match(/[A-Za-z_$][\w$]*/g) || ['n'];
  /* The name that says what the value IS. `cardName(c)` is a name, not a c;
     `fmtNum(pts)` is the pts it formats; `names.join(", ")` is the names. */
  const call = /([A-Za-z_$][\w$]*)\s*\(([^()]*)\)\s*$/.exec(text);
  let last = ids[ids.length - 1];
  if (call) {
    const argIds = call[2].match(/[A-Za-z_$][\w$]*/g) || [];
    const before = ids[ids.indexOf(call[1]) - 1];
    if (/^(join|trim|toLowerCase|toUpperCase)$/.test(call[1]) && before) last = before;
    else if (/^(fmt|format)/i.test(call[1]) && argIds.length) last = argIds[argIds.length - 1];
    else last = call[1];
    if (/^(is|has|at|can|should|was|perfect)/i.test(last)) return { kind: 'bool', value: true };
  }
  // A ternary's condition — unless the name says it is a number that is truthy.
  if (ctx.bool && numGuess(last) == null) return { kind: 'bool', value: true };
  if (STR_NAME.test(last)) {
    const key = (last.match(/[A-Z]?[a-z]+$/) || [last])[0].toLowerCase();
    const pool = ctx.props[last] || ctx.props[key] || ctx.props.name || [];
    // A word, not a fragment: "+" is a sub too, and no slot means that.
    const choices = pool.filter((v) => /[A-Za-z\u00C0-\u024F]{2}/.test(v)).slice(0, 40);
    const plain = last.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/^./, (c) => c.toUpperCase());
    return { kind: 'str', value: choices[0] || plain, choices };
  }
  const v = numGuess(last);
  return { kind: 'num', value: v == null ? 3 : v };
}

/* One expression → JavaScript the page can run: every slot written `$[i]`,
   into a list of slots SHARED by the whole call, so `lives` in the word and
   `lives` in the sub are one input. */
function holes(expr, env, slots, at, depth = 0) {
  const chains = chainsOf(expr);
  const edits = [];
  const slotFor = (text, ctx) => {
    const key = text.replace(/\s+/g, '');
    let i = slots.findIndex((s) => s.key === key);
    if (i < 0) {
      slots.push({ key, text: text.replace(/\s+/g, ' '), ...guessSlot(text, { ...ctx, props: env.props }) });
      i = slots.length - 1;
    }
    return '$[' + i + ']';
  };
  const keysOf = (t) => {
    const v = env.tables[t];
    if (!v || typeof v !== 'object') return null;
    return Object.keys(v).filter((k) => v[k] != null && v[k] !== '').map((k) => (Array.isArray(v) ? Number(k) : k));
  };
  for (const ch of chains) {
    if (KEYWORDS.has(ch.root)) continue;
    const live = LIVE_ROOTS.has(ch.root) || env.aliases[ch.root] || (env.tables[ch.root] !== undefined);
    const row = env.rows[ch.root];
    if (live || row) {
      // Kept: the root resolves in the frame. Only its brackets and calls are
      // expressions of their own, rewritten in place.
      if (row) edits.push({ start: ch.start, end: ch.start + ch.root.length,
        text: '(' + row.table + '[' + slotFor(row.index, { choices: keysOf(row.table), index: true }) + '])' });
      ch.acc.forEach((a, n) => {
        if (a.type === '.') return;
        const inner = expr.slice(a.innerStart, a.innerEnd);
        // A bare name in brackets is an INDEX: the table's first key, or 0.
        const root = inner.trim().split('.')[0];
        const isIndex = a.type === '[' && /^\s*[A-Za-z_$][\w$.]*\s*$/.test(inner) &&
          !LIVE_ROOTS.has(root) && !env.aliases[root] && env.tables[root] === undefined;
        const sub = isIndex
          ? slotFor(inner.trim(), { choices: n === 0 ? keysOf(ch.root) : null, index: true })
          : holes(inner, env, slots, at, depth);
        edits.push({ start: a.innerStart, end: a.innerEnd, text: sub });
      });
      continue;
    }
    // A hole. `w.toFixed(1)` keeps its formatting live: the hole is `w`.
    let end = ch.end, acc = ch.acc;
    const tail = acc.length >= 2 && acc[acc.length - 2].type === '.' && /^to(Fixed|String)$/.test(acc[acc.length - 2].name) && acc[acc.length - 1].type === '(';
    if (tail) end = acc[acc.length - 2].start;
    const text = expr.slice(ch.start, end);
    // A bare local assigned just above: its own expression, two levels deep.
    const local = !acc.length && depth < 2 && localExpr(ch.root, env, at);
    if (local) {
      edits.push({ start: ch.start, end, text: '(' + holes(local, env, slots, at, depth + 1) + ')' });
      continue;
    }
    const bool = !tail && ch.next === '?';
    edits.push({ start: ch.start, end, text: slotFor(text, { bool }) });
  }
  let out = expr;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
}

/* The words of one callout or notice, each either a literal (the motor
   translates it whole) or code with slots (the game's own Lang.t calls
   translate its pieces, the motor the rest). */
export function textsOf(call, env) {
  const exprs = {};
  if (call.name === 'Pop.show') { exprs.word = call.wordExpr; exprs.sub = call.subExpr; }
  else if (call.name === 'Pop.text') exprs.word = call.wordExpr;
  else if (call.name === 'Notify.say') { exprs.word = call.wordExpr; exprs.sub = call.subExpr; }
  const slots = [], fields = {};
  for (const [k, e] of Object.entries(exprs)) {
    if (!e) continue;
    const lit = literal(e);
    if (lit != null) { fields[k] = { lit }; continue; }
    try { fields[k] = { code: holes(e, env, slots, call.callSpan && call.callSpan.start), expr: e }; }
    catch { fields[k] = { lit: stubWord(e, '') }; }
  }
  return { fields, slots: slots.map(({ key, ...s }) => s) };
}

// Only what some word's code names — a game's tables run to kilobytes.
function usedEnv(env, calls) {
  const code = calls.map((c) => c.texts ? Object.values(c.texts.fields).map((f) => f.code || '').join(' ') : '').join(' ');
  const pick = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => new RegExp('(^|[^\\w$.])' + k.replace(/\$/g, '\\$') + '(?![\\w$])').test(code)));
  return { aliases: pick(env.aliases), tables: pick(env.tables) };
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
  const re = /\b(Pop|Notify|Overlay|Fx|Sound|Music|HUD|Confetti)\.(\w+)\s*\(/g;
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
    } else if (name === 'Notify.say') {
      const o = objectFields(args[1]) || {};
      call.opts = o;
      call.optSpans = spans[1] ? objectFieldSpans(spans[1].text, spans[1].start) : null;
      call.word = literal(args[0]);
      call.wordExpr = args[0] || null;
      call.sub = literal(o.sub) ?? (o.sub ? null : undefined);
      call.subExpr = o.sub || null;
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
   assets/audio/sfx/ as it is on disk: one flat folder, every file named
   `<category>-<descriptor>-<NN>.<ext>` (tools/lab/rename-sfx.mjs is the
   record of how), plus index.json beside them — durations, channels, packs,
   licences — written by tools/lab/index-sfx.mjs. A game's clip is a CUT of
   one of these files, and the only record of which one is the provenance
   comment, which writes the file's name without its extension:

       // hit: mallet-plink-01   (pitched by tier + combo)

   So the label IS the stem, and the same function names a file for the bench
   and resolves a note back to a file for tools/lab/apply-events.mjs.        */
export function sfxLabel(file) {
  return file.replace(/\.[^.]+$/, '');
}

export const SFX_DIR = path.join(ROOT, 'assets', 'audio', 'sfx');
export const SFX_INDEX = path.join(SFX_DIR, 'index.json');

let SFX = null;
export async function sfxFiles() {
  if (SFX) return SFX;
  const names = (await readdir(SFX_DIR)).filter((f) => /\.(mp3|ogg|wav|m4a)$/i.test(f)).sort();
  // What the index knows about each file, when there is one; the folder alone otherwise.
  const index = {};
  try { for (const e of JSON.parse(await readFile(SFX_INDEX, 'utf8')).files) index[e.file] = e; } catch {}
  SFX = names.map((file) => {
    const e = index[file] || {};
    const label = sfxLabel(file);
    return {
      file, label, stem: label, ext: e.ext || file.slice(file.lastIndexOf('.') + 1).toLowerCase(),
      category: e.category || label.split('-')[0], name: e.name || null, variant: e.variant || null,
      seconds: e.seconds != null ? e.seconds : null, channels: e.channels || null,
      pack: e.pack || null, license: e.license || null, source: e.source || null
    };
  });
  return SFX;
}

/* The file a note was cut from: its stem, whole, on a token boundary — a
   hyphen counts as part of the token, so `click-01` is not found inside
   `ui-click-01`. Longest wins where one stem happens to sit inside another,
   which the naming scheme should never produce but nothing forbids. */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function fileForNote(note, files) {
  if (!note) return null;
  let best = null;
  for (const f of files) {
    if (!f.re) f.re = new RegExp('(^|[^\\w-])' + esc(f.label) + '(?![\\w-])');
    if (!f.re.test(note)) continue;
    if (!best || f.label.length > best.label.length) best = f;
  }
  return best ? best.file : null;
}

export async function games() {
  const dirs = await readdir(path.join(ROOT, 'games'), { withFileTypes: true });
  return dirs.filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

/* What the bench can open: the TEMPLATE, then every game. The template is the
   source every game's end-screen cues were copied from, and a unit like the
   others as far as the bench is concerned — a game.js with an ASSETS.sounds
   block — except that it has no manifest and lives at template/. */
export const TEMPLATE = 'template';
export async function units() { return [TEMPLATE, ...(await games())]; }
export function unitDir(slug) {
  return slug === TEMPLATE ? path.join(ROOT, 'template') : path.join(ROOT, 'games', slug);
}
export function unitWhere(slug) {
  return slug === TEMPLATE ? 'template/game.js' : `games/${slug}/game.js`;
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
  const dir = unitDir(slug);
  const src = await readFile(path.join(dir, 'game.js'), 'utf8');
  let manifest = {};
  try { manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8')); } catch {}
  if (slug === TEMPLATE) manifest = { title: 'Template — the end screen', targets: [] };

  const where = unitWhere(slug);
  const lines = src.split('\n');
  const calls = scanCalls(src, where);
  const env = textEnv(src);
  for (const c of calls) if (c.kind === 'pop' || c.kind === 'notify') c.texts = textsOf(c, env);
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

  /* A key the manifest hands to the house kit (`sfx`, assets/audio/kit/) has
     no clip in game.js and plays all the same: it is listed as the role it
     plays, which the bench links to the kit page rather than offering a file. */
  for (const [key, role] of Object.entries(manifest.sfx || {})) {
    if (sounds.some((x) => x.key === key)) continue;
    sounds.push({ key, mime: 'audio/mpeg', note: 'kit: ' + role, kit: role, file: null,
                  bytes: 0, plays: played[key] || [], music: false });
  }

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

  /* A clip of the template played by NO line of its own but by a motor line
     (packages/shell/shell.js) — the end screen's three were, before they moved
     into the house kit (Sound.ui, assets/audio/kit/), and a motor Sound.cue on
     a key the template embeds would be again. So its SOUND
     side lists those motor lines under the clip they play — marked
     `inherited`, auditioned like any line and never written back, since
     apply-events splices template/game.js and a motor line is not in it. The
     beats are left alone: they are read off this file's own lines. */
  if (slug === TEMPLATE) {
    for (const c of motor) {
      if (c.module !== 'Sound' || !c.soundLiteral) continue;
      if (!pack.keys.some((k) => k.key === c.sound)) continue;
      calls.push({ ...c, inherited: true });
    }
  }

  /* What a CHECKED mark is given on (lab/game-events.html, lab/events-review.json).
     Not the line — a line moves whenever anything above it is written — but
     the call itself, in its function: its source as it reads now, and for a cue
     the clip it plays too (the note naming its file, and its size), because a
     clip re-cut from another file is a sound nobody has listened to yet. Change
     any of it and the id is a new one: the old mark no longer matches anything,
     which is what "unchecked again" means. Two identical calls in one function
     are told apart by their order. */
  const seen = {};
  for (const c of calls) {
    if (c.kind !== 'pop' && c.kind !== 'notify' && c.kind !== 'sound') continue;
    const snd = c.kind === 'sound' ? sounds.find((x) => x.key === c.sound) : null;
    const base = createHash('sha1').update([c.where, c.fn || '', c.source,
      snd ? (snd.note || '') + '|' + snd.bytes : ''].join('\n')).digest('hex').slice(0, 12);
    seen[base] = (seen[base] || 0) + 1;
    c.checkId = base + (seen[base] > 1 ? '#' + seen[base] : '');
  }

  return {
    slug,
    title: manifest.title || slug,
    version: manifest.version || null,
    targets: manifest.targets || [],
    where,
    beats, calls, sounds, warnings,
    music: musicConfig(src),
    // What a built word stands on in the frame: the aliases and the tables
    // its slots were cut around (textsOf), embedded once for every call.
    textEnv: usedEnv(env, calls),
    motor: motor.map((c) => ({ ...c, inherited: true })),
    counts: {
      pop: calls.filter((c) => c.kind === 'pop').length,
      fx: calls.filter((c) => c.kind === 'fx').length,
      sound: calls.filter((c) => c.kind === 'sound').length,
      notify: calls.filter((c) => c.kind === 'notify').length,
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
