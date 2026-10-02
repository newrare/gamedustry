#!/usr/bin/env node
/*
  scan-text — every word a game shows a player, read off its own sources.

    node tools/lab/scan-text.mjs vipera         # one game, as a table
    node tools/lab/scan-text.mjs --all          # every game, one block each
    node tools/lab/scan-text.mjs vipera --json  # the structure the lab page eats

  A game's copy is written where it is USED, which is the right place to write
  it and the wrong place to PROOFREAD it: an intro sentence lives in three
  files, a HUD label is the second argument of a call 900 lines down, and the
  French half of it all is in a manifest nobody opens while writing gameplay.
  So nobody ever reads a game's copy as copy — they read it one call at a time,
  in English, next to the physics.

  This reads all of it back, in one list, split by language. Three of a game's
  four sources hold copy — `skin.css` holds none:

    manifest.json   the listing — title, taglines, tags, description, the store
                    card lines, the level objective, and every FR override the
                    web menu takes (web.copy)
    game.js         CONFIG.title / .tagline / .intro.caption and the whole of
                    CONFIG.copy, then every literal the round itself writes —
                    Pop.show word and sub, Pop.text, Notify.say word and sub,
                    the HUD slots, the end screen's title and stat rows, and
                    what a game paints with ctx.fillText
    page.html       #intro-title and #intro-tagline, which are MIRRORS: the
                    shell rewrites both from CONFIG at boot, so they are listed
                    with the CONFIG string they must match and never on their
                    own. Every other string in page.html is rewritten the same
                    way (#btn-start, #btn-cta, #eo-scorelbl…), which is why
                    none of them is offered here — editing one changes nothing.

  It parses, it never runs: no build, no browser, no game loop.

  What it does NOT list is as deliberate. `packages/webshell/menu.js` holds the
  motor's own FR/EN strings (PLAY, OPTIONS, LEAVE?) — they are the same for the
  thirteen games and belong to the motor, and a game that wants its own wording
  writes it under `web.copy`, which IS listed. The itch tags are page metadata,
  not something the player reads inside the game.

  lab/game-text.html is the same list with an edit field on every row
  (`make text`); tools/lab/apply-text.mjs writes a change back.

  ── a literal, never an expression ───────────────────────────────────────────
  A game writes `title: st === 3 ? "Apex viper!" : CONFIG.copy.gameOver` and
  `HUD.setLeft("x" + combo, "Combo")`. Those are copy too, so the unit here is
  the STRING LITERAL and not the argument: every literal inside a text position
  gets its own row and its own span, and the expression around it is printed as
  the row's context. Nothing is ever reprinted — an edit splices one literal —
  so a ternary, a concatenation and their comments come back as they were.
*/

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, argsOf, splitArgSpans, objectFieldSpans, codeMask, stripComments } from './scan-events.mjs';

export { ROOT };

/* ── the groups, in the order the page shows them ────────────────────────── */
export const GROUPS = [
  { key: 'store',    label: 'Listing',      note: 'the site, itch and the store cards — read before the game is installed' },
  { key: 'intro',    label: 'Title screen', note: 'the one sentence that explains the game' },
  { key: 'help',     label: 'Help card',    note: 'the rules the help card lists, one line each' },
  { key: 'ui',       label: 'Shell',        note: 'the buttons and labels the motor draws around the round' },
  { key: 'hud',      label: 'HUD',          note: 'the two side slots of the top band' },
  { key: 'round',    label: 'The round',    note: 'callouts, floating values and what the canvas paints' },
  { key: 'end',      label: 'End screen',   note: 'the title and the stat rows' },
  { key: 'levels',   label: 'Levels',       note: 'the objective, one sentence with {n} in it' },
  { key: 'barracks', label: 'Barracks',     note: 'the army layer\'s own screens — packages/webshell/army.js, shared by every game that declares web.army' },
  { key: 'officers', label: 'Officers',     note: 'the grades, the objects, the trades and the lore on the back of every card' },
  { key: 'missions', label: 'Missions',     note: 'title, briefing, and the report the squad brings back — {leader} is its first card' },
  { key: 'events',   label: 'Camp events',  note: 'the good and bad days the camp draws every few hours — {c} is the card it lands on' },
  { key: 'words',    label: 'Game words',   note: 'the FR side of everything the game itself writes, keyed by the English' }
];

/* Groups whose rows come in {en, fr} pairs held side by side in one source.
   A pair with no French is work left, like a dictionary entry nobody wrote. */
const PAIRED = new Set(['help', 'barracks', 'officers', 'missions', 'events']);

/* A game is written in English and translated by a DICTIONARY in its manifest
   (`web.copy.<lang>.strings`), keyed by the English string. These are the rows
   that do NOT need one: the studio title and the plain store tagline are the
   listing's own, `CONFIG.title` is replaced by the logotype, the demo caption
   is empty by house rule, and the intro sentence is translated as
   `web.copy.<lang>.tagline`. Everything else a game says has to be in there. */
const NO_DICT = new Set(['Game title', 'Intro sentence', 'Demo caption']);
const translatable = (r) => r.lang === 'en' && (r.dict || (r.where === 'game.js' && !r.code &&
  !NO_DICT.has(r.context))) && /[A-Za-z]{2,}/.test(r.text);

/* ── strings ─────────────────────────────────────────────────────────────── */

// A JS literal, quotes included, → the string a player would read.
export function decode(raw) {
  const t = (raw || '').trim();
  if (t[0] === '"') { try { return JSON.parse(t); } catch { /* fall through */ } }
  if (t[0] === "'" || t[0] === '"') {
    return t.slice(1, -1).replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (m, e) => {
      if (e[0] === 'u' || e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
      return { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }[e] ?? e;
    });
  }
  return t;
}

/* Every string literal inside a span of source, with where each one sits in
   the FILE. Comments are already blanked by the caller, so a `"…"` in a note
   above a call cannot be picked up as copy. */
function literalsIn(src, from, to) {
  const seg = src.slice(from, to);
  const out = [];
  let i = 0;
  while (i < seg.length) {
    const c = seg[i];
    if (c === '"' || c === "'") {
      const q = c, s = i;
      i++;
      while (i < seg.length && seg[i] !== q) { if (seg[i] === '\\') i++; i++; }
      i++;
      out.push({ start: from + s, end: from + i, text: decode(seg.slice(s, i)) });
      continue;
    }
    i++;
  }
  return out;
}

// Line number (1-based) for every offset, built once per file.
function lineIndex(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return (off) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (starts[m] <= off) lo = m; else hi = m - 1; }
    return lo + 1;
  };
}

const oneLine = (s) => String(s).replace(/\s*\n\s*/g, ' ').trim();

/* ── the manifest ────────────────────────────────────────────────────────────
   Every string VALUE of the file with the path it sits at and its span, so a
   rewrite splices the one literal and the manifest keeps its own formatting —
   re-serializing it would reorder nothing but reflow everything. A value
   inside an object also carries `keyStart`, where its key opens, which is what
   removing the whole entry needs. */
export function jsonStrings(src) {
  const out = [];
  let i = 0;
  const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  function str() {
    const start = i;
    i++;
    while (i < src.length && src[i] !== '"') { if (src[i] === '\\') i++; i++; }
    i++;
    return { start, end: i, text: JSON.parse(src.slice(start, i)) };
  }
  function value(where, keyStart) {
    ws();
    const c = src[i];
    if (c === '"') { const s = str(); out.push({ path: where, ...s, keyStart }); return; }
    if (c === '{') {
      i++;
      for (;;) {
        ws();
        if (src[i] === '}' || i >= src.length) { i++; return; }
        const key = str();
        ws(); i++;                                   // the ':'
        value(where.concat(key.text), key.start);
        ws();
        if (src[i] === ',') i++;
      }
    }
    if (c === '[') {
      i++;
      let n = 0;
      for (;;) {
        ws();
        if (src[i] === ']' || i >= src.length) { i++; return; }
        value(where.concat(n++));
        ws();
        if (src[i] === ',') i++;
      }
    }
    while (i < src.length && !/[,}\]\s]/.test(src[i])) i++;   // a number, a bool, null
  }
  value([]);
  return out;
}

const LANGS = ['en', 'fr'];

/* One manifest string → the row the page shows, or null when the value is not
   copy (a slug, a hex colour, a target, an appId). `pair` is what puts the two
   languages of the same sentence on the same line of the page. */
function manifestRow(entry, manifest) {
  const p = entry.path, n = p.length;
  const at = (i) => String(p[i]);

  if (p[0] === 'web' && p[1] === 'army') return armyRow(p, manifest.web.army);

  if (n === 5 && p[0] === 'web' && p[1] === 'copy' && LANGS.includes(at(2)) && p[3] === 'helpRules')
    return { lang: at(2), group: 'help', context: `Rule ${p[4] + 1}`, pair: `help-${p[4]}`, html: true };

  if (n === 1 && p[0] === 'title')   return { lang: 'en', group: 'store', context: 'Studio title', hint: 'the name on the site, on itch and in the store' };
  if (n === 1 && p[0] === 'tagline') return { lang: 'en', group: 'store', context: 'Manifest tagline', hint: 'the plain-text pitch the itch page and the store meta take' };
  if (n === 1 && p[0] === 'description') return { lang: 'en', group: 'store', context: 'Long description', hint: 'the gallery write-up on the site', big: true };

  if (n === 3 && p[0] === 'copy' && LANGS.includes(at(1)) && p[2] === 'tagline')
    return { lang: at(1), group: 'store', context: 'Site tagline', pair: 'site-tagline' };
  if (n === 4 && p[0] === 'copy' && LANGS.includes(at(1)) && p[2] === 'tags')
    return { lang: at(1), group: 'store', context: `Site tag ${p[3] + 1}`, pair: `site-tag-${p[3]}` };

  /* A store line is `{ kicker, line }` or a bare string — tools/lab/shoot-store.mjs
     takes both, so both are listed. */
  if (n === 6 && p[0] === 'store' && p[1] === 'copy' && LANGS.includes(at(2)) && p[3] === 'lines')
    return { lang: at(2), group: 'store', context: `Store card ${p[4] + 1} · ${p[5]}`, pair: `store-${p[4]}-${p[5]}`, html: p[5] === 'line' };
  if (n === 5 && p[0] === 'store' && p[1] === 'copy' && LANGS.includes(at(2)) && p[3] === 'lines')
    return { lang: at(2), group: 'store', context: `Store card ${p[4] + 1}`, pair: `store-${p[4]}-line`, html: true };

  if (n === 5 && p[0] === 'web' && p[1] === 'levels' && p[2] === 'copy' && LANGS.includes(at(3)))
    return null;                                     // levels.copy is n === 4, see below
  if (n === 4 && p[0] === 'web' && p[1] === 'levels' && p[2] === 'copy' && LANGS.includes(at(3)))
    return { lang: at(3), group: 'levels', context: 'Level objective', pair: 'level-objective', html: true };

  /* The dictionary: one entry per English string the game writes. The key is
     the English itself, so there is no key to invent and a missing entry falls
     back to the English rather than to an empty box. */
  if (n === 5 && p[0] === 'web' && p[1] === 'copy' && LANGS.includes(at(2)) && p[3] === 'strings')
    return { lang: at(2), group: 'words', context: String(p[4]), pair: 'word:' + p[4] };

  if (p[0] === 'web' && p[1] === 'copy') {
    // Two shapes: `copy: { fr: { play: … } }` per language, or `copy: { play: … }`
    // for one wording in every language.
    const perLang = LANGS.includes(at(2));
    const key = perLang ? at(3) : at(2);
    if ((perLang && n !== 4) || (!perLang && n !== 3)) return null;
    const tagline = key === 'tagline';
    return {
      lang: perLang ? at(2) : 'all',
      group: tagline ? 'intro' : 'ui',
      context: tagline ? 'Intro sentence' : `Web menu · ${key}`,
      hint: tagline ? 'the web build\'s own tagline, key words in <b class="w-…"> included' : 'overrides the motor\'s own menu string',
      pair: tagline ? 'intro-tagline' : `web-${key}`,
      html: tagline
    };
  }
  return null;
}

/* ── the army ──────────────────────────────────────────────────────────────
   `web.army` is content rather than chrome: 120 officers with a lore each, 30
   trades, 50 missions with a briefing and two reports, 40 camp events. Every
   one of them is an `{ en, fr }` object (a trade adds `frF`, the feminine), so
   both languages sit in the manifest and pair up by path. The context is built
   from the record itself — who the officer is, what the mission pays — since
   "missions.list.17.win.fr" says nothing about which story it is. */
const TEXT_LANGS = { en: 'en', fr: 'fr', frF: 'fr' };

function armyRow(p, army) {
  const n = p.length, last = String(p[n - 1]);
  const gradeName = (r) => ((army.grades || []).find((g) => g.r === r) || {}).name || `grade ${r}`;

  // Two names the player reads on every card, written in English and
  // translated by the dictionary like the game's own words.
  if (n === 5 && (p[2] === 'grades' || p[2] === 'objects') && p[4] === 'name') {
    const it = army[p[2]][p[3]] || {};
    return { lang: 'en', group: 'officers', dict: true,
      context: p[2] === 'grades' ? `Grade ${it.r} · name` : 'Object · name',
      hint: 'on the card face, the deck and every list — translated by the dictionary' };
  }

  if (!(last in TEXT_LANGS)) return null;
  const lang = TEXT_LANGS[last], fem = last === 'frF';

  if (p[2] === 'cast' && n === 6 && p[4] === 'lore') {
    const c = army.cast[p[3]] || {};
    return { lang, group: 'officers', context: `${c.first} ${c.last} · lore`, pair: `cast-${p[3]}`,
      hint: `${c.side} ${gradeName(c.r)} ${(army.tiers || [])[c.t] || ''} · ${c.gender}, ${c.age} · ${c.job} — the back of the card` };
  }
  if (p[2] === 'jobs' && n === 6 && p[4] === 'name') {
    const j = army.jobs[p[3]] || {};
    return { lang, group: 'officers', context: `Trade · ${j.k}${fem ? ' · feminine' : ''}`,
      pair: fem ? null : `job-${p[3]}`, echo: fem ? `job-${p[3]}` : null,
      hint: `printed on the back of the card · suits the ${j.post} post` };
  }
  if (p[2] === 'missions' && p[3] === 'list' && n === 7) {
    const m = army.missions.list[p[4]] || {};
    const part = { title: 'title', brief: 'briefing', win: 'success report', lose: 'failure report' }[p[5]];
    if (!part) return null;
    const list = (l) => (l || []).map((x) => `${x.kind} ${x.n}`).join(', ') || 'nothing';
    const title = (m.title && m.title.en) || m.id;
    return { lang, group: 'missions', pair: `mission-${p[4]}-${p[5]}`,
      context: p[5] === 'title' ? `${m.id} · mission title` : `${m.id} · ${title} · ${part}`,
      hint: p[5] === 'win' ? `the report when it succeeds · pays ${list(m.reward)}`
        : p[5] === 'lose' ? `the report when it fails · costs ${list(m.fail)}`
        : `${m.hours} h away · squad of ${(m.squad || []).join('–')} · difficulty ${m.d}` };
  }
  if (p[2] === 'events' && p[3] === 'list' && n === 7) {
    const e = army.events.list[p[4]] || {}, fx = e.fx || {};
    const part = { title: 'title', text: 'story' }[p[5]];
    if (!part) return null;
    return { lang, group: 'events', pair: `event-${p[4]}-${p[5]}`,
      context: `${e.id} · ${e.good ? 'good' : 'bad'} day · ${part}`,
      hint: `told at the village · ${[fx.kind, fx.n, fx.h ? fx.h + ' h' : ''].filter((x) => x != null && x !== '').join(' ')}` };
  }
  return null;
}

/* ── where a line of code sits ─────────────────────────────────────────────
   A row's context is the screen it is read on; a proofreader also wants the
   MOMENT, and the nearest thing a parser can say about that is the function
   the call is written in (`Game.onDown`, `openFile`). One pass keeps a stack
   of braces and names each one after the header in front of it — a function,
   a method, or an object literal assigned to a name. */
function scopeIndex(clean, mask) {
  const frames = [], stack = [];
  for (let i = 0; i < clean.length; i++) {
    if (!mask[i]) continue;
    const c = clean[i];
    if (c === '{') {
      const head = clean.slice(Math.max(0, i - 160), i);
      let m, name = null;
      if ((m = /([\w$]+)\s*[:=]\s*function\s*[\w$]*\s*\([^()]*\)\s*$/.exec(head))) name = m[1];
      else if ((m = /function\s+([\w$]+)\s*\([^()]*\)\s*$/.exec(head))) name = m[1];
      else if ((m = /(?:^|[\s{,;(])([\w$]+)\s*[:=]\s*$/.exec(head)) && m[1] !== 'default') name = m[1];
      const f = { start: i, end: clean.length, name, parent: stack[stack.length - 1] || null };
      stack.push(f);
      if (name) frames.push(f);
    } else if (c === '}') {
      const f = stack.pop();
      if (f) f.end = i;
    }
  }
  return (off) => {
    let best = null;
    for (const f of frames) if (f.start < off && off < f.end && (!best || f.start > best.start)) best = f;
    const chain = [];
    for (let f = best; f; f = f.parent) if (f.name) chain.unshift(f.name);
    return chain.slice(-3).join('.');
  };
}

// The line of source an offset sits on, trimmed to what fits on a row.
function lineAt(src, off) {
  const from = src.lastIndexOf('\n', off - 1) + 1;
  let to = src.indexOf('\n', off);
  if (to < 0) to = src.length;
  const t = src.slice(from, to).trim();
  return t.length > 180 ? t.slice(0, 177) + '…' : t;
}

/* ── game.js ─────────────────────────────────────────────────────────────── */

/* Where a call keeps copy. Anything not named here is not offered: `Pop.show`'s
   first argument is a STYLE, the third of a HUD slot is a CSS class, and a row's
   `grade` is a colour — none of them is a word. */
const TEXT_CALLS = {
  'Pop.show':       { opts: { word: 'Callout', sub: 'Callout sub' }, group: 'round', style: 0 },
  'Pop.text':       { args: { 2: 'Floating value' }, group: 'round' },
  'Notify.say':     { args: { 0: 'Notice' }, opts: { sub: 'Notice sub' }, group: 'round' },
  'HUD.setLeft':    { args: { 0: 'HUD left value', 1: 'HUD left label' }, group: 'hud' },
  'HUD.setRight':   { args: { 0: 'HUD right value', 1: 'HUD right label' }, group: 'hud' },
  'fillText':       { args: { 0: 'Canvas text' }, group: 'round' },
  /* What a game translates itself: a literal it concatenates, or writes into
     a sheet of its own. Inside one of the calls above it is already that
     call's fragment, and it is listed once. */
  'Lang.t':         { args: { 0: 'Translated in place' }, group: 'round' }
};

// The friendly name of a CONFIG.copy key. An unlisted one keeps its own.
const COPY_KEYS = {
  start: 'Start button', ctaBar: 'CTA bar', ctaEnd: 'End screen CTA', replay: 'Replay link',
  scoreLabel: 'HUD score label', timeLabel: 'HUD timer label', endScore: 'End screen score label',
  gameOver: 'End screen default title', timeUp: 'Time-up title'
};

// The balanced `{ … }` that starts at `open`, or null.
function braceSpan(src, mask, open) {
  if (src[open] !== '{') return null;
  const { end } = argsOf(src, mask, open);
  return { start: open, end: end + 1 };
}

// `var CONFIG = {` … the whole object.
function configSpan(clean, mask) {
  const m = /\bvar\s+CONFIG\s*=\s*\{/.exec(clean);
  if (!m || !mask[m.index]) return null;
  return braceSpan(clean, mask, m.index + m[0].length - 1);
}

function fieldsOf(clean, span) {
  return objectFieldSpans(clean.slice(span.start, span.end), span.start) || {};
}

const slugOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28);

function scanGameJs(src, out, push) {
  const merged = new Map();
  const claimed = new Set();                         // literal starts already on a row
  const clean = stripComments(src);
  const mask = codeMask(clean);
  const lineOf = lineIndex(src);
  const scopeOf = scopeIndex(clean, mask);
  out.js = { src, clean, lineOf, scopeOf };

  /* --- CONFIG: the copy a game declares rather than writes inline ---------- */
  const cfg = configSpan(clean, mask);
  if (cfg) {
    const top = fieldsOf(clean, cfg);
    const put = (span, o) => {
      if (!span) return null;
      const lit = literalsIn(clean, span.start, span.end);
      // The field has to BE a literal: a computed value, and an object holding
      // one string among other things, are both declarations and not copy.
      if (lit.length !== 1 || lit[0].start !== span.start || lit[0].end !== span.end) return null;
      return push({ ...o, where: 'game.js', line: lineOf(lit[0].start), text: lit[0].text,
        targets: [{ file: 'game.js', kind: 'js', start: lit[0].start, end: lit[0].end, line: lineOf(lit[0].start) }] });
    };

    out.configTitle = put(top.title, { id: 'config.title', lang: 'en', group: 'intro',
      context: 'Game title', hint: 'the logotype replaces it once <slug>-title.png exists' });
    out.configTagline = put(top.tagline, { id: 'config.tagline', lang: 'en', group: 'intro',
      context: 'Intro sentence', hint: 'one sentence, key words in <b class="w-…">', pair: 'intro-tagline', html: true });

    if (top.intro && clean[top.intro.start] === '{') {
      const intro = fieldsOf(clean, { start: top.intro.start, end: top.intro.end });
      put(intro.caption, { id: 'config.intro.caption', lang: 'en', group: 'intro',
        context: 'Demo caption', hint: 'the house rules keep it empty — the tagline is the sentence' });
    }

    if (top.copy && clean[top.copy.start] === '{') {
      const copy = fieldsOf(clean, { start: top.copy.start, end: top.copy.end });
      for (const key of Object.keys(copy)) {
        put(copy[key], { id: 'config.copy.' + key, lang: 'en',
          group: key === 'gameOver' || key === 'timeUp' || key === 'endScore' || key === 'ctaEnd' ? 'end' : 'ui',
          context: COPY_KEYS[key] || 'copy.' + key });
      }
    }
  }

  /* --- every literal the round itself writes ------------------------------ */
  const re = /\b(Pop|Overlay|HUD|endRound|[A-Za-z_$][\w$]*)\.?(\w*)\s*\(/g;
  let m;
  while ((m = re.exec(clean))) {
    if (!mask[m.index]) continue;
    const dotted = m[2] ? m[1] + '.' + m[2] : m[1];
    const name = m[2] === 'fillText' ? 'fillText' : dotted;
    const spec = TEXT_CALLS[name];
    const isEnd = dotted === 'endRound' || (!m[2] && m[1] === 'endRound');
    if (!spec && !isEnd) continue;

    const open = m.index + m[0].length - 1;
    const raw = argsOf(clean, mask, open);
    const spans = splitArgSpans(raw.text, open + 1);
    const line = lineOf(m.index);
    const label = m[2] ? dotted : m[1];

    /* A literal in a text position becomes a row. When it is the WHOLE argument
       the row IS the argument; when it is one branch of a ternary or one term
       of a concatenation it is a FRAGMENT, and the expression around it is what
       the page prints instead of a context.

       A whole argument written identically in the same place several times is
       ONE row with several sites: "Length" is the HUD's left label at three
       call sites, and editing one of the three would leave the label changing
       under the player. A fragment never merges — the expression around it is
       half of what it means, and two of them are rarely the same beat. */
    const take = (span, context, extra) => {
      if (!span) return;
      const expr = oneLine(clean.slice(span.start, span.end));
      const lits = literalsIn(clean, span.start, span.end);
      lits.forEach((lit, n) => {
        const whole = lits.length === 1 && lit.start === span.start && lit.end === span.end;
        if (!whole && !lit.text.trim()) return;      // "" in a concatenation is not copy
        if (claimed.has(lit.start)) return;
        claimed.add(lit.start);
        const at = lineOf(lit.start);
        const site = { file: 'game.js', kind: 'js', start: lit.start, end: lit.end, line: at };
        const use = { line: at, fn: scopeOf(lit.start), src: lineAt(src, lit.start) };
        /* A literal in a copy POSITION is not always copy: a stat row's value
           holds `Store.get("bestScore", 0)` and an end title branches on
           `reason === "jam"`. Both are code, and neither belongs in the
           dictionary — so they are marked rather than counted. */
        /* A short window on each side, never the whole file: `/\s+$/` over a
           megabyte of prefix was 95% of the scan (the base64 assets). */
        const lead = clean.slice(Math.max(0, lit.start - 200), lit.start).replace(/\s+$/, '');
        const tail = clean.slice(lit.end, lit.end + 200).replace(/^\s+/, '');
        const code = !whole && !/\bLang\.t\s*\($/.test(lead) &&
                     (((lead.slice(-1) === '(' || lead.slice(-1) === ',') &&
                       (tail[0] === ',' || tail[0] === ')')) ||
                      /[=!]==$/.test(lead) || /^[=!]==/.test(tail));
        const key = `${(extra && extra.group) || spec.group}|${context}|${lit.text}`;
        if (whole && merged.has(key)) {
          const row = merged.get(key);
          row.targets.push(site);
          row.lines.push(at);
          row.uses.push(use);
          return;
        }
        const row = push({
          id: whole ? `${label}.${slugOf(context)}.${slugOf(lit.text) || 'x'}`
                    : `${at}.${label}.${slugOf(context)}${n ? '.' + n : ''}`,
          lang: 'en', group: (extra && extra.group) || spec.group, where: 'game.js', line: at,
          context, text: lit.text, fragment: !whole, code: code, expr: whole ? null : expr,
          ...(extra || {}),
          lines: [at], targets: [site], uses: [use]
        });
        if (whole) merged.set(key, row);
      });
    };

    if (isEnd) {
      const obj = spans[0];
      if (!obj || clean[obj.start] !== '{') continue;
      const fields = fieldsOf(clean, { start: obj.start, end: obj.end });
      take(fields.title, 'End title', { group: 'end' });
      const rows = fields.rows;
      if (rows && clean[rows.start] === '[') {
        const items = splitArgSpans(clean.slice(rows.start + 1, rows.end - 1), rows.start + 1);
        items.forEach((item, n) => {
          if (clean[item.start] !== '{') return;
          const f = fieldsOf(clean, { start: item.start, end: item.end });
          take(f.label, `Stat row ${n + 1} · label`, { group: 'end' });
          take(f.value, `Stat row ${n + 1} · value`, { group: 'end' });
        });
      }
      continue;
    }

    const style = spec.style != null && spans[spec.style]
      ? decode(oneLine(clean.slice(spans[spec.style].start, spans[spec.style].end))) : null;
    for (const [i, context] of Object.entries(spec.args || {})) take(spans[i], context, { style });
    if (spec.opts && spans[1] && clean[spans[1].start] === '{') {
      const o = objectFieldSpans(clean.slice(spans[1].start, spans[1].end), spans[1].start) || {};
      for (const [key, context] of Object.entries(spec.opts)) take(o[key], context, { style });
    }
  }
}

/* ── page.html ───────────────────────────────────────────────────────────────
   Two nodes, and they are MIRRORS: packages/shell/shell.js rewrites both from
   CONFIG at boot, so the page's own copy is what a player sees for the frame
   before the script runs and what a reader of the source sees forever. It is
   never a row of its own — it rides on the CONFIG row and is written with it,
   which is the sync CLAUDE.md asks for. */
const MIRRORS = [
  { id: 'intro-title',   of: 'configTitle',   escape: true },
  { id: 'intro-tagline', of: 'configTagline', escape: false }
];

function scanPage(src, out, warn) {
  for (const mir of MIRRORS) {
    const re = new RegExp(`(<div id="${mir.id}"[^>]*>)([\\s\\S]*?)(</div>)`);
    const m = re.exec(src);
    const row = out[mir.of];
    if (!m) { if (row) warn(`page.html has no #${mir.id} — the CONFIG string is written on its own`); continue; }
    if (!row) continue;
    const start = m.index + m[1].length;
    row.targets.push({ file: 'page.html', kind: 'html', start, end: start + m[2].length, escape: mir.escape });
    if (m[2] !== (mir.escape ? htmlEscape(row.text) : row.text)) {
      warn(`page.html #${mir.id} does not match CONFIG — applying the row puts them back in sync`);
      row.desync = m[2];
    }
  }
}

export const htmlEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── packages/webshell/army.js ───────────────────────────────────────────────
   The barracks' own screens — CARDS, INFIRMARY, PRISON, COMMAND, DEFENSE — are
   written in the army layer's STRINGS table, `{ en: {…}, fr: {…} }`, and not in
   the game. It is listed for a game that declares `web.army` because that game
   is the only one that shows it; unlike menu.js, a word there is read by the
   players of one game. Applying a row writes army.js and rebuilds that game.
   The table has no fallback — `T = STRINGS[LANG]` — so a key the French side
   lacks is an empty label, and it is counted as work left. */
export const ARMY_JS = 'packages/webshell/army.js';

async function scanArmyJs(push, warn) {
  const src = await readFile(path.join(ROOT, ARMY_JS), 'utf8');
  const clean = stripComments(src);
  const mask = codeMask(clean);
  const lineOf = lineIndex(src);
  const m = /\bvar\s+STRINGS\s*=\s*\{/.exec(clean);
  if (!m || !mask[m.index]) { warn('army.js: no STRINGS table — the barracks are not listed'); return; }
  const top = fieldsOf(clean, braceSpan(clean, mask, m.index + m[0].length - 1));

  // Where each key is read: the first `T.key` of the file, and the function it sits in.
  const scopeOf = scopeIndex(clean, mask);
  const readAt = {};
  const re = /\bT\.([\w$]+)/g;
  let r;
  while ((r = re.exec(clean))) {
    if (!mask[r.index] || readAt[r[1]]) continue;
    readAt[r[1]] = { line: lineOf(r.index), fn: scopeOf(r.index), src: lineAt(src, r.index), file: 'army.js' };
  }

  for (const lang of LANGS) {
    const tbl = top[lang];
    if (!tbl || clean[tbl.start] !== '{') continue;
    const fields = fieldsOf(clean, tbl);
    for (const key of Object.keys(fields)) {
      const f = fields[key];
      const lit = literalsIn(clean, f.start, f.end);
      if (lit.length !== 1 || lit[0].start !== f.start || lit[0].end !== f.end) continue;
      const line = lineOf(f.start);
      push({ id: `${lang}.${key}`, where: 'army.js', lang, group: 'barracks', context: key, line,
        text: lit[0].text, pair: 'army:' + key, uses: readAt[key] ? [readAt[key]] : [],
        targets: [{ file: ARMY_JS, kind: 'js', start: f.start, end: f.end, line }] });
    }
  }
}

/* ── one game ────────────────────────────────────────────────────────────── */

export async function games() {
  const dirs = await readdir(path.join(ROOT, 'games'), { withFileTypes: true });
  return dirs.filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

/* The picker's list: the manifests and nothing else, so the page is up before
   a single game.js is parsed. */
export async function gameList() {
  const out = [];
  for (const slug of await games()) {
    try {
      const m = JSON.parse(await readFile(path.join(ROOT, 'games', slug, 'manifest.json'), 'utf8'));
      out.push({ slug, title: m.title || slug, version: m.version || '' });
    } catch { out.push({ slug, title: slug, version: '' }); }
  }
  return out;
}

export async function scanText(slug) {
  const dir = path.join(ROOT, 'games', slug);
  const [manifestSrc, gameSrc, pageSrc] = await Promise.all([
    readFile(path.join(dir, 'manifest.json'), 'utf8'),
    readFile(path.join(dir, 'game.js'), 'utf8'),
    readFile(path.join(dir, 'page.html'), 'utf8')
  ]);
  const manifest = JSON.parse(manifestSrc);

  const rows = [], warnings = [], seen = new Set(), out = {};
  const warn = (w) => warnings.push(w);

  /* An id has to survive a re-scan — apply-text.mjs matches on it — so it is
     built from what the source says and not from the order things were found.
     A collision would let one edit land on another row, which is why the
     second one is renamed rather than dropped. */
  const push = (row) => {
    const base = `${row.where}:${row.id}`;
    let id = base, n = 2;
    while (seen.has(id)) id = `${base}#${n++}`;
    seen.add(id);
    const full = { ...row, id };
    rows.push(full);
    return full;
  };

  const manifestLine = lineIndex(manifestSrc);
  for (const entry of jsonStrings(manifestSrc)) {
    const row = manifestRow(entry, manifest);
    if (!row) continue;
    const line = manifestLine(entry.start);
    push({ ...row, id: entry.path.join('.'), where: 'manifest.json', line, text: entry.text,
      targets: [{ file: 'manifest.json', kind: 'json', start: entry.start, end: entry.end, line }] });
  }

  scanGameJs(gameSrc, out, push);
  scanPage(pageSrc, out, warn);
  if (manifest.web && manifest.web.army) await scanArmyJs(push, warn);

  // Same sentence, two languages, one line on the page.
  const byPair = {};
  for (const r of rows) if (r.pair) (byPair[r.pair] = byPair[r.pair] || {})[r.lang] = r.text;
  for (const r of rows) if (r.pair) {
    const other = r.lang === 'fr' ? byPair[r.pair].en : byPair[r.pair].fr;
    if (other != null) r.other = other;
  }
  // A feminine form reads against the English, the one pair it has.
  for (const r of rows) if (r.echo && byPair[r.echo] && byPair[r.echo].en != null) r.other = byPair[r.echo].en;

  /* WHERE A DICTIONARY ENTRY IS READ. Its key is the English, which says what
     it means but not where it shows: every row of the game that writes that
     English is one use, printed under the French. An entry nothing writes is
     marked — the English moved and the translation stayed behind, or the game
     builds the string at runtime where a parser cannot follow it. */
  const usesOf = {};
  for (const r of rows) if (r.lang === 'en' && (r.dict || r.where === 'game.js') && !r.code) {
    (usesOf[r.text] = usesOf[r.text] || []).push(...(r.uses && r.uses.length ? r.uses.map((u) => ({ ...u, context: r.context, group: r.group }))
      : [{ context: r.context, group: r.group, file: r.where, line: r.line }]));
  }
  /* Second chance: the English sits in a table the game reads at runtime
     (`TIER_LABEL = ["Basic", "Common", …]`) and reaches Lang.t through a
     variable. The table is still where it is written, so that is its use. */
  const { clean: js, lineOf: jsLine, scopeOf: jsScope, src: jsSrc } = out.js;
  for (const r of rows) if (r.group === 'words') {
    r.uses = usesOf[r.context] || [];
    if (r.uses.length) continue;
    const at = [JSON.stringify(r.context), `'${r.context.replace(/'/g, "\\'")}'`]
      .map((q) => js.indexOf(q)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
    if (at != null) r.uses = [{ context: 'Found in game.js', group: 'data', line: jsLine(at), fn: jsScope(at), src: lineAt(jsSrc, at) }];
    else r.unused = true;
  }

  /* PARITY. Every string the game itself writes is read back against the
     dictionary, so the count at the top of the page is the work left rather
     than a number of rows: a game is done when it is 0. */
  const dict = {};
  for (const r of rows) if (r.group === 'words' && r.lang === 'fr') dict[r.context] = r.text;
  const missing = [];
  for (const r of rows) if (translatable(r)) {
    if (dict[r.text] != null) r.fr = dict[r.text];
    else if (!missing.some((m) => m.text === r.text)) missing.push(r);
  }
  for (const r of rows) if (PAIRED.has(r.group) && r.lang === 'en' && r.pair && byPair[r.pair].fr == null)
    missing.push({ text: `${r.context} (${r.where})` });

  const counts = {
    en: rows.filter((r) => r.lang !== 'fr').length,
    fr: rows.filter((r) => r.lang === 'fr').length,
    fragments: rows.filter((r) => r.fragment).length,
    untranslated: missing.length
  };
  return {
    slug, title: manifest.title || slug, version: manifest.version || '',
    groups: GROUPS, rows, counts, warnings, missing: missing.map((r) => r.text)
  };
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */
function table(scan) {
  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  console.log(`\n\x1b[1m${scan.title}\x1b[0m  v${scan.version}   ${scan.counts.en} EN · ${scan.counts.fr} FR` +
    (scan.counts.fragments ? `   (${scan.counts.fragments} fragments)` : '') +
    (scan.counts.untranslated ? `   \x1b[33m${scan.counts.untranslated} untranslated\x1b[0m` : '   \x1b[32mfully translated\x1b[0m'));
  for (const t of scan.missing) console.log(`  \x1b[33m? no FR for ${JSON.stringify(t)}\x1b[0m`);
  for (const w of scan.warnings) console.log(`  \x1b[33m! ${w}\x1b[0m`);
  for (const lang of ['en', 'fr', 'all']) {
    const mine = scan.rows.filter((r) => r.lang === lang);
    if (!mine.length) continue;
    console.log(`\n  \x1b[1m${lang.toUpperCase()}\x1b[0m`);
    for (const g of GROUPS) {
      const inGroup = mine.filter((r) => r.group === g.key);
      if (!inGroup.length) continue;
      console.log(`  \x1b[90m── ${g.label}\x1b[0m`);
      for (const r of inGroup) {
        const at = r.line ? `${r.where}:${r.line}` : r.where;
        console.log(`    ${pad(at, 16)} ${pad(r.context, 26)} ${r.fragment ? '\x1b[90m·\x1b[0m ' : '  '}${oneLine(r.text)}`);
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const all = await games();
  const wanted = argv.includes('--all') ? all : argv.filter((a) => !a.startsWith('-'));
  if (!wanted.length || wanted.some((s) => !all.includes(s))) {
    console.log('usage: node tools/lab/scan-text.mjs <slug>|--all [--json]');
    console.log('       games: ' + all.join(' '));
    process.exit(1);
  }
  const scans = [];
  for (const slug of wanted) scans.push(await scanText(slug));
  if (argv.includes('--json')) console.log(JSON.stringify(scans.length === 1 ? scans[0] : scans, null, 2));
  else { for (const s of scans) table(s); console.log(''); }
}
