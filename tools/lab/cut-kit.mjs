#!/usr/bin/env node
/*
  cut-kit — cut the house sound kit out of the sfx library.

    node tools/lab/cut-kit.mjs            # cut every take of assets/audio/kit/kit.json
    node tools/lab/cut-kit.mjs --list     # what each variant holds, and who plays it

  THE KIT IS WHAT THE SHELL SOUNDS LIKE. Every game used to carry its own copy
  of the end screen's three clips (uiScore, uiStar, uiRow), and the whole web
  shell — the menu, the map, the album, the shop, the daily road, the barracks
  — played those three, pitched every which way, for some seventy different
  moments. The kit names the moments instead: a ROLE (`tap`, `open`, `coin`,
  `star`, `reward`, `fail`…) is what an event MEANS, and each role holds one to
  three TAKES cut out of assets/audio/sfx/. `Sound.ui(role, vol, rate)` plays
  one of them (packages/engine/engine.js); the builder injects the kit into
  every build (tools/build/build.mjs, THE HOUSE SOUND KIT).

  kit.json is the source, written by hand or by the kit page (`make events` →
  /kit, lab/sound-kit.html):

    { target, peak, playable: [role…],
      roles: { <role>: { group, what,
        variants: { <name>: { takes: [{ file, start, length, rate?, tail?, tailLength? }] } } } } }

  A role says what a moment MEANS; a VARIANT is one way of saying it. Two groups:

    shell  the menus and the end screen, the same in every game, so a shell
           role has ONE variant, `default`, and its id is the role's name
           (`tap`, `star`) — Sound.ui("tap") plays it.
    game   a game's own events, reached from its manifest. A crash in one game
           is not a crash in another, so a gameplay role holds as many named
           variants as it needs (`crash/explosion`, `crash/glass`) and a game
           maps each key it plays to ONE of them: `"sfx": { "crash":
           "crash/explosion" }`. The id is `role/variant`.

  Inside a variant, the TAKES are interchangeable: Sound.ui alternates between
  them so a sound heard twenty times a round does not repeat — they are never
  a choice. `file` is a library stem, the same name a provenance comment
  writes; `start` and `length` are seconds into it; `tail`, when there is
  one, is how the take ends (THE TAIL, below); `rate`, when it is not 1, is
  the take's pitch, baked into the file (THE PITCH, below).
  `playable` lists the shell roles a playable carries, the end screen's.

  THE ROLE IS THE ONE PLACE A SOUND IS SHAPED. The file, the cut, the tail and
  the pitch are all written here, and a game that maps a key to a variant only
  says how LOUD a line plays it — so one variant sounds the same in every game
  that plays it, and a sound that should sound different is another variant.
  There is no random detune on a shot any more (it was `jitter`): a wobble put
  on top of a line's own `rate` made a pitch impossible to judge on the bench.
  A game still pitches a line from its code where the pitch IS the meaning — a
  ladder of stars, a combo climbing — and that multiplies what is cut here.

  EVERY TAKE LEAVES AT ONE LOUDNESS. Two vendors, ~870 files, and no two
  mastered alike: a volume written per call was correcting the FILE, and every
  call correcting it differently. So each take is measured and levelled here —
  its loudest 50 ms window brought to `target` dBFS RMS, capped so its peak
  stays under `peak` dBFS — and a volume at a call site is MIX again: how loud
  this moment is against the others. lab/sound-kit.html previews a candidate
  with the same measure, so what is picked there is what is cut here.

  Every take is re-encoded like a game's clip (mono 32 kHz / 64 kbps, a short
  fade out, or the tail it names) into assets/audio/kit/<role>-<variant>-<n>.mp3, n from 1, bit-exact
  so a re-cut of an unchanged take changes no byte. Those files are COMMITTED, like
  assets/image/shell/: the build reads them and never runs ffmpeg. A file whose
  role, variant or take is gone from kit.json is removed.
*/
import { readFile, writeFile, readdir, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const KIT_DIR = path.join(ROOT, 'assets', 'audio', 'kit');
export const KIT_JSON = path.join(KIT_DIR, 'kit.json');
const SFX_DIR = path.join(ROOT, 'assets', 'audio', 'sfx');
const GAMES_DIR = path.join(ROOT, 'games');
const RATE = 32000;
const WINDOW = 0.05;              // the loudness window, seconds
const FADE = 0.07;                // the fade out, at most

/* THE TAIL. A take cut in the middle of its sound ends on a 70 ms fade, which
   is an anti-click and nothing more: the ear still hears the sound stopped.
   A take may instead END — `tail: "fade"` lets it die out over its last
   `tailLength` seconds, `tail: "drop"` does the same while its pitch falls an
   octave, a tape stopping. Both are rendered sample by sample by tailPcm,
   which lab/sound-kit.html and lab/game-events-sound.html carry a copy of, so
   the pages hear what is cut — keep the three identical. */
export const TAILS = ['fade', 'drop'];
export const DROP_TO = 0.5;       // the rate a drop ends on: an octave down
export function defaultTail(length) { return Math.round(Math.min(0.3, length * 0.4) * 1000) / 1000; }

/* The cut with its tail, from mono PCM at `rate`. Before the tail the samples
   are copied; across it the read head slows from 1 to DROP_TO (a drop only)
   and the gain falls to silence on (1 - u)², which reads as a natural decay
   where a straight line sounds like a fader. u is the progress through the
   tail in SOURCE time, so a drop's tail lasts longer than it reads in the cut. */
export function tailPcm(pcm, rate, tail, tailLength) {
  const n = pcm.length, t0 = Math.max(0, n - Math.round(tailLength * rate)), span = Math.max(1, n - t0);
  const out = [];
  let p = 0;
  while (p < n - 1) {
    const i = Math.floor(p), f = p - i;
    const s = pcm[i] * (1 - f) + pcm[i + 1] * f;
    const u = p < t0 ? 0 : (p - t0) / span;
    out.push(s * (1 - u) * (1 - u));
    p += tail === 'drop' ? 1 - (1 - DROP_TO) * u : 1;
  }
  return Float32Array.from(out);
}

/* THE PITCH. `rate` plays the take faster and higher (2 is an octave up) or
   slower and lower (0.5, an octave down), the way a playbackRate does — so the
   pages preview it with one, and the cutter resamples the PCM with the same
   straight-line read. It is applied LAST, to the cut with its tail, and the
   level is measured before it: pitch moves a take's length, not its loudness. */
export const RATE_MIN = 0.5, RATE_MAX = 2;
export function pitchPcm(pcm, rate) {
  if (!rate || rate === 1) return pcm;
  const n = pcm.length, out = new Float32Array(Math.max(1, Math.floor((n - 1) / rate)));
  for (let k = 0; k < out.length; k++) {
    const p = k * rate, i = Math.floor(p), f = p - i;
    out[k] = pcm[i] * (1 - f) + (pcm[i + 1] || 0) * f;
  }
  return out;
}
// The 70 ms anti-click at the end of a take with no tail, on PCM (ffmpeg's afade is the same straight line).
function fadePcm(pcm, rate, seconds) {
  const out = Float32Array.from(pcm), n = Math.max(1, Math.round(seconds * rate)), a = Math.max(0, out.length - n);
  for (let i = a; i < out.length; i++) out[i] *= 1 - (i - a) / n;
  return out;
}

/* A take as kit.json writes it: the keys in this order, the numbers rounded
   (ms, and the pitch to the hundredth), `rate` only off 1, `tailLength` only
   with a tail. writeKit writes nothing else, and the events bench fingerprints
   what a line was HEARD on through it, so a draft and the same take saved
   read as one. */
export function normalTake(t) {
  const start = Math.max(0, Math.round(Number(t.start) * 1000) / 1000 || 0);
  const length = Math.round(Number(t.length) * 1000) / 1000;
  const out = { file: t.file, start, length };
  const rate = Math.round(Number(t.rate) * 100) / 100;
  if (rate && rate !== 1) out.rate = rate;
  if (t.tail) {
    out.tail = t.tail;
    out.tailLength = Math.min(length, Math.max(0.02, Math.round(Number(t.tailLength) * 1000) / 1000 || defaultTail(length)));
  }
  return out;
}

export async function readKit() {
  return JSON.parse(await readFile(KIT_JSON, 'utf8'));
}

// The id a game's manifest and Sound.ui name a variant by.
export function idOf(kit, role, variant) {
  return kit.roles[role].group === 'shell' ? role : `${role}/${variant}`;
}

// Every variant of the kit, flat: { id, role, variant, group, v }.
export function variantsOf(kit) {
  const out = [];
  for (const [role, r] of Object.entries(kit.roles || {})) {
    for (const [variant, v] of Object.entries(r.variants || {})) {
      out.push({ id: idOf(kit, role, variant), role, variant, group: r.group, v });
    }
  }
  return out;
}

/* Who plays each variant: every game's manifest `sfx`, read back as
   { "crash/explosion": ["triverse.crash"] } — so a take is never changed, nor a
   variant renamed, without knowing who hears it. */
export async function kitUsers() {
  const out = {};
  for (const slug of (await readdir(GAMES_DIR)).sort()) {
    let m;
    try { m = JSON.parse(await readFile(path.join(GAMES_DIR, slug, 'manifest.json'), 'utf8')); } catch { continue; }
    for (const [key, id] of Object.entries(m.sfx || {})) (out[id] = out[id] || []).push(`${slug}.${key}`);
  }
  return out;
}

/* Who CALLS each role: every `Sound.ui("tap")` of the motor, the web shell and
   the games — and the view system's `door("open")`, which plays it for every
   card and view. A shell role has no manifest to say where it is heard, so
   this is the one way the kit page can tell `tap` is the album's, the
   barracks' and grudgeon's. Read off the source as text: a call whose role is
   a variable (`ui(role)`) names nothing and is skipped, and a ternary names
   both of its literals (`ui(ok ? "win" : "fail")`).
   { tap: [{ where: "album", game: false, file, line }, …] } */
const CALL_DIRS = ['packages'];
async function jsUnder(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await jsUnder(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
// The first argument of a call opened at `i`, up to its first comma at depth 0.
function firstArg(src, i) {
  let depth = 0, q = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { if (!depth--) return src.slice(i, j); }
    else if (c === ',' && !depth) return src.slice(i, j);
  }
  return '';
}
export async function roleCalls(kit) {
  const files = [];
  for (const d of CALL_DIRS) files.push(...(await jsUnder(path.join(ROOT, d))).map((f) => ({ f, game: false })));
  for (const slug of (await readdir(GAMES_DIR)).sort()) {
    const f = path.join(GAMES_DIR, slug, 'game.js');
    if (existsSync(f)) files.push({ f, game: true, slug });
  }
  const ids = new Set(variantsOf(kit).map((v) => v.id)), out = {};
  for (const { f, game, slug } of files) {
    const src = await readFile(f, 'utf8'), rel = path.relative(ROOT, f);
    const where = game ? slug : path.basename(f, '.js');
    const re = /\b(?:ui|door)\(/g;
    let m;
    while ((m = re.exec(src))) {
      const lineStart = src.lastIndexOf('\n', m.index) + 1;
      const head = src.slice(lineStart, m.index).trim();
      if (head.startsWith('//') || head.startsWith('*') || /\bfunction\s*$/.test(head)) continue;
      const line = src.slice(0, m.index).split('\n').length;
      for (const lit of firstArg(src, re.lastIndex).matchAll(/["']([a-z0-9/]+)["']/g)) {
        if (ids.has(lit[1])) (out[lit[1]] = out[lit[1]] || []).push({ where, game, file: rel, line });
      }
    }
  }
  return out;
}

const NAME = /^[a-z][a-z0-9]{0,23}$/;
const GROUPS = ['shell', 'game'];
/* The SILENT mapping: `"sfx": { "crash": "empty" }` is a key that plays
   nothing (packages/engine/engine.js, clip). It is where a game's key lands
   when the variant it played is deleted before anyone validated it, so the
   game keeps building and the key waits, silent, for a sound to be picked on
   the events bench. It is no role and no role may take its name. */
export const EMPTY = 'empty';

/* What the kit page may write, checked against the kit on disk. A role on disk
   is never DROPPED — each is a name the engine, the shell or a game calls — and
   keeps its group and its words; the page rewrites its variants: a shell role
   keeps its one `default`, a gameplay role may add, rename and drop them —
   except a variant a game plays, which stays until that game is mapped
   elsewhere. The page may ADD a role (its + button): a name, a group and a
   line saying what it means, written in the page's order so it lands in its
   group. A new role nobody calls yet plays nowhere until a manifest maps a key
   to it or the shell calls it; the engine's synth stand-in (UI_FALLBACK) is a
   generic beep for a name it does not list.

   `remap` is the page's record of what moved: { "<id on disk>": "<new id>" }
   for a role or a variant RENAMED, and EMPTY for one deleted while games
   still map a key to it. A variant named there may leave the kit although a
   manifest plays it — remapManifests() moves those keys right after; a source
   that CALLS it by name still holds it, since a rename cannot reach a call. */
export async function writeKit(next, { remap = {} } = {}) {
  const kit = await readKit();
  const users = await kitUsers();
  const stems = new Set((await readdir(SFX_DIR)).map((f) => f.slice(0, f.lastIndexOf('.'))));
  const order = Object.keys((next && next.roles) || {});
  /* A role left out is DROPPED — only when nothing plays it: no manifest maps
     a key to one of its variants and no source calls it by name, since a
     call to a role gone is a beep where a sound was. */
  const gone = Object.keys(kit.roles).filter((role) => !order.includes(role));
  const calls = await roleCalls(kit);
  if (gone.length) {
    for (const role of gone) {
      for (const name of Object.keys(kit.roles[role].variants)) {
        const id = idOf(kit, role, name);
        if (users[id] && !remap[id]) throw new Error(`${id} is played by ${users[id].join(', ')} — map it elsewhere first`);
        if (calls[id]) throw new Error(`${id} is called in ${calls[id].map((c) => c.file + ':' + c.line).join(', ')} — remove the call first`);
      }
      delete kit.roles[role];
    }
    // A shell role renamed keeps its place in the playables.
    kit.playable = (kit.playable || []).map((role) => gone.includes(role) && remap[role] && remap[role] !== EMPTY ? remap[role] : role)
      .filter((role) => !gone.includes(role));
  }
  for (const role of order) {
    if (kit.roles[role]) continue;
    const n = next.roles[role] || {};
    if (!NAME.test(role)) throw new Error(`"${role}" — a role is named in lowercase letters and digits`);
    if (role === EMPTY) throw new Error(`"${EMPTY}" is the silent mapping — a role takes another name`);
    if (!GROUPS.includes(n.group)) throw new Error(`${role}: a role is in the group ${GROUPS.join(' or ')}`);
    const what = String(n.what || '').trim();
    if (!what) throw new Error(`${role}: say in one line what the role means`);
    kit.roles[role] = { group: n.group, what, variants: {} };
  }
  for (const [role, r] of Object.entries(kit.roles)) {
    const n = next.roles[role];
    if (!n || !n.variants) throw new Error(`role "${role}" is missing`);
    const names = Object.keys(n.variants);
    if (r.group === 'shell' && (names.length !== 1 || names[0] !== 'default')) {
      throw new Error(`${role}: a shell role has one variant, "default"`);
    }
    if (!names.length) throw new Error(`${role}: at least one variant`);
    for (const name of Object.keys(r.variants)) {
      const id = idOf(kit, role, name);
      if (!n.variants[name] && users[id] && !remap[id]) throw new Error(`${id} is played by ${users[id].join(', ')} — map it elsewhere first`);
      if (!n.variants[name] && calls[id]) throw new Error(`${id} is called in ${calls[id].map((c) => c.file + ':' + c.line).join(', ')} — remove the call first`);
    }
    const variants = {};
    for (const name of names) {
      if (!NAME.test(name)) throw new Error(`${role}: "${name}" — a variant is named in lowercase letters and digits`);
      const v = n.variants[name], takes = v.takes || [];
      const where = idOf(kit, role, name);
      if (takes.length < 1 || takes.length > 3) throw new Error(`${where}: one to three takes`);
      variants[name] = {
        takes: takes.map((t, i) => {
          if (!stems.has(t.file)) throw new Error(`${where} #${i + 1}: no file "${t.file}" in assets/audio/sfx/`);
          const start = Math.max(0, Math.round(Number(t.start) * 1000) / 1000 || 0);
          const length = Math.round(Number(t.length) * 1000) / 1000;
          if (!(length >= 0.02 && length <= 3)) throw new Error(`${where} #${i + 1}: a length of 0.02 to 3 s`);
          const rate = Math.round(Number(t.rate) * 100) / 100;
          if (rate && rate !== 1 && !(rate >= RATE_MIN && rate <= RATE_MAX)) throw new Error(`${where} #${i + 1}: a pitch of ${RATE_MIN} to ${RATE_MAX}`);
          if (t.tail && !TAILS.includes(t.tail)) throw new Error(`${where} #${i + 1}: a tail is ${TAILS.join(' or ')}`);
          return normalTake(t);
        })
      };
    }
    r.variants = variants;
  }
  // In the page's order, so a role added lands at the end of its own group.
  const roles = {};
  for (const role of order) roles[role] = kit.roles[role];
  kit.roles = roles;
  await writeFile(KIT_JSON, formatKit(kit));
  return kit;
}

/* Variants rewritten from the events bench — the kit card's own editor, which
   tunes the one variant a game's key plays, or forks it into a new one. Only
   the variants named change: the rest of kit.json is read fresh from disk, so
   a save made on /kit in the meantime is not written over. A new name is a new
   gameplay variant; a shell role keeps its one `default`. Returns the ids. */
export async function editVariants(list) {
  const kit = await readKit();
  const ids = [];
  for (const { id, takes } of list || []) {
    const [role, name = 'default'] = String(id || '').split('/');
    const r = kit.roles[role];
    if (!r) throw new Error(`${id}: no role "${role}" in the kit`);
    if (r.group === 'shell' && name !== 'default') throw new Error(`${id}: a shell role has one variant, "default"`);
    r.variants[name] = { takes: takes || [] };
    ids.push(idOf(kit, role, name));
  }
  await writeKit(kit);
  return ids;
}

// One take per line, so a diff of kit.json reads as the decisions it holds.
export function formatKit(kit) {
  return JSON.stringify(kit, null, 2)
    .replace(/\{\n\s+"file": [^{}]*?\n\s+\}/g, (m) => m.replace(/\n\s*/g, ' '))
    .replace(/"playable": \[\n([^\]]+)\]/, (m, list) => `"playable": [${list.trim().split(/,\s*/).join(', ')}]`) + '\n';
}

/* A game's key handed to a variant of the kit — what the events bench's kit
   selector applies. The manifest gains `sfx.<key>`, the clip under that key
   leaves ASSETS.sounds with its provenance comment (the builder refuses a
   mapped key that is still embedded), and the version moves unless the same
   apply already moved it. Re-mapping a key already in the kit only rewrites
   the manifest. The lines that PLAY the key are not touched: Sound.clip("gem")
   is the game's, and the engine sends it to the variant. */
export async function mapKeys(slug, list, { bump = true } = {}) {
  const kit = await readKit();
  const ids = new Set(variantsOf(kit).map((x) => x.id));
  const dir = path.join(GAMES_DIR, slug);
  const mf = path.join(dir, 'manifest.json'), gf = path.join(dir, 'game.js');
  const manifest = JSON.parse(await readFile(mf, 'utf8'));
  let src = await readFile(gf, 'utf8');
  const applied = [], skipped = [];
  const sfx = { ...(manifest.sfx || {}) };
  // `split`: a key a line was just moved to (the events bench's scissors) — it has no clip to find.
  for (const { key, id, split } of list || []) {
    if (!/^[A-Za-z_$][\w$]*$/.test(key || '')) { skipped.push(`"${key}": not a sound key`); continue; }
    if (!ids.has(id)) { skipped.push(`${key}: no variant "${id}" in the kit`); continue; }
    const lines = src.split('\n');
    const data = new RegExp(`^\\s*"?${key}"?\\s*:\\s*"data:audio`);
    const note = new RegExp(`^\\s*//\\s*${key}:\\s`);
    const at = lines.findIndex((l) => data.test(l));
    if (at >= 0) {
      const kept = lines.filter((l, i) => i !== at && !note.test(l));
      // The entry that closed the block keeps no trailing comma.
      const close = kept.findIndex((l, i) => i >= at - 1 && /^\s*\}/.test(l));
      if (close > 0 && /,\s*$/.test(kept[close - 1]) && !/^\s*\/\//.test(kept[close - 1])) {
        kept[close - 1] = kept[close - 1].replace(/,\s*$/, '');
      }
      src = kept.join('\n');
      applied.push({ what: `ASSETS.sounds.${key}`, value: 'removed — the kit plays it' });
    } else if (!sfx[key] && !split) {
      skipped.push(`${key}: no clip embedded under that name, mapped all the same`);
    }
    sfx[key] = id;
    applied.push({ what: `sfx.${key}`, value: id });
  }
  if (!applied.length) return { slug, applied, skipped, written: false, version: null };
  // Inserted after `art` the first time, where the other asset declarations are.
  const out = {};
  if (!manifest.sfx) {
    for (const [k, v] of Object.entries(manifest)) { out[k] = v; if (k === 'art') out.sfx = sfx; }
    if (!out.sfx) out.sfx = sfx;
  } else Object.assign(out, manifest, { sfx });
  let version = null;
  if (bump) {
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(out.version || ''));
    if (m) out.version = version = `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
  }
  await writeFile(gf, src);
  await writeFile(mf, JSON.stringify(out, null, 2) + '\n');
  return { slug, applied, skipped, written: true, version };
}

/* The keys of every game that played a variant the kit page renamed or
   deleted, moved to where it went — the new id, or EMPTY — with the patch
   version moved, since the game now sounds different (or the same under
   another name, which its manifest says all the same). Returns
   [{ slug, keys: ["crash → crash/metal"], version }]. */
export async function remapManifests(remap) {
  const out = [];
  if (!remap || !Object.keys(remap).length) return out;
  for (const slug of (await readdir(GAMES_DIR)).sort()) {
    const mf = path.join(GAMES_DIR, slug, 'manifest.json');
    let m;
    try { m = JSON.parse(await readFile(mf, 'utf8')); } catch { continue; }
    const keys = [];
    for (const [key, id] of Object.entries(m.sfx || {})) {
      if (!remap[id]) continue;
      m.sfx[key] = remap[id];
      keys.push(`${key} → ${remap[id]}`);
    }
    if (!keys.length) continue;
    let version = null;
    const v = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(m.version || ''));
    if (v) m.version = version = `${v[1]}.${v[2]}.${Number(v[3]) + 1}`;
    await writeFile(mf, JSON.stringify(m, null, 2) + '\n');
    out.push({ slug, keys, version });
  }
  return out;
}

function run(args, { capture = false, input = null } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args]);
    if (input) p.stdin.end(input); else p.stdin.end();
    const out = [];
    let err = '';
    p.stdout.on('data', (b) => { if (capture) out.push(b); });
    p.stderr.on('data', (b) => { err += b; });
    p.on('error', reject);
    p.on('close', (code) => code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(err.trim() || 'ffmpeg ' + code)));
  });
}

// assets/audio/sfx/<stem>.<ext> — the library is half mp3, half ogg.
async function sourceOf(stem) {
  const files = await readdir(SFX_DIR);
  const f = files.find((x) => x.slice(0, x.lastIndexOf('.')) === stem);
  if (!f) throw new Error(`no file "${stem}" in assets/audio/sfx/`);
  return path.join(SFX_DIR, f);
}

/* The level of one take, the measure lab/sound-kit.html applies too: the
   loudest WINDOW of the cut, in dBFS RMS, and its peak. The loudest window
   rather than the whole clip, because a kit clip is a hit and a tail, and the
   tail is not what the ear judges a click's loudness by. */
export function levelOf(pcm, rate = RATE) {
  const win = Math.max(1, Math.round(WINDOW * rate)), hop = Math.max(1, win >> 2);
  let peak = 0, best = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  for (let s = 0; s === 0 || s + win <= pcm.length; s += hop) {
    let sum = 0, n = 0;
    for (let i = s; i < Math.min(s + win, pcm.length); i++, n++) sum += pcm[i] * pcm[i];
    if (n) best = Math.max(best, Math.sqrt(sum / n));
    if (s + win >= pcm.length) break;
  }
  const db = (v) => v > 0 ? 20 * Math.log10(v) : -Infinity;
  return { rms: db(best), peak: db(peak) };
}

export function gainFor(level, kit) {
  return Math.min(kit.target - level.rms, kit.peak - level.peak);
}

/* Mono is the AVERAGE of the channels, spelled out: ffmpeg's own `-ac 1` on a
   stereo file adds them at a gain that can push a cut 2 dB over full scale,
   and the kit page — which hears a candidate before it is cut — averages. One
   downmix on both sides, or the page levels one sound and the cutter another. */
function channelsOf(src) {
  return new Promise((resolve) => {
    const p = spawn('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'csv=p=0', src]);
    let out = '';
    p.stdout.on('data', (b) => { out += b; });
    p.on('error', () => resolve(1));
    p.on('close', () => resolve(parseInt(out, 10) || 1));
  });
}
function downmix(n) {
  if (n <= 1) return [];
  const terms = Array.from({ length: n }, (_, i) => `${(1 / n).toFixed(6)}*c${i}`).join('+');
  return [`pan=mono|c0=${terms}`];
}

async function cutTake(kit, take, out) {
  const src = await sourceOf(take.file);
  const seek = ['-ss', String(take.start || 0), '-t', String(take.length), '-i', src];
  const mix = downmix(await channelsOf(src));
  const raw = await run([...seek, ...(mix.length ? ['-af', mix[0]] : []), '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-'], { capture: true });
  const pcm = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength >> 2);
  const level = levelOf(pcm);
  const gain = gainFor(level, kit);
  const encode = ['-ac', '1', '-ar', String(RATE), '-b:a', '64k',
    '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', '-id3v2_version', '0', out];
  const fade = Math.min(FADE, take.length * 0.3);
  if (take.tail || (take.rate && take.rate !== 1)) {
    // Levelled on the cut as it reads, then the tail (or the anti-click) and the
    // pitch rendered here and handed back as raw PCM.
    const ended = take.tail ? tailPcm(pcm, RATE, take.tail, take.tailLength || defaultTail(take.length)) : fadePcm(pcm, RATE, fade);
    const out = pitchPcm(ended, take.rate);
    await run(['-y', '-f', 'f32le', '-ar', String(RATE), '-ac', '1', '-i', 'pipe:0',
      '-af', `volume=${gain.toFixed(2)}dB`, ...encode],
    { input: Buffer.from(out.buffer, out.byteOffset, out.byteLength) });
    return { level, gain };
  }
  const st = Math.max(0, take.length - fade);
  await run(['-y', ...seek,
    '-af', [...mix, `volume=${gain.toFixed(2)}dB`, `afade=t=out:st=${st.toFixed(3)}:d=${fade.toFixed(3)}`].join(','),
    ...encode]);
  return { level, gain };
}

/* `only` names the variants to re-cut (their ids) — the events bench changes
   one at a time and should not wait for the whole kit; every other take is
   left as it is on disk. Without it, everything is cut. Stale files go either way. */
export async function cutKit({ log = console.log, only = null } = {}) {
  const kit = await readKit();
  await mkdir(KIT_DIR, { recursive: true });
  const keep = new Set();
  for (const { id, role, variant, v } of variantsOf(kit)) {
    for (let i = 0; i < (v.takes || []).length; i++) {
      const name = `${role}-${variant}-${i + 1}.mp3`;
      keep.add(name);
      if (only && !only.includes(id)) continue;
      const t = v.takes[i];
      const { level, gain } = await cutTake(kit, t, path.join(KIT_DIR, name));
      log(`  ${name.padEnd(26)} ${t.file} ${t.start || 0}+${t.length}s${t.rate ? ' x' + t.rate : ''}${t.tail ? ' ' + t.tail + ' ' + t.tailLength + 's' : ''}  ` +
          `${level.rms.toFixed(1)} dB → ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB`);
    }
  }
  for (const f of await readdir(KIT_DIR)) {
    if (f.endsWith('.mp3') && !keep.has(f)) { await unlink(path.join(KIT_DIR, f)); log(`  removed ${f}`); }
  }
  return kit;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const kit = await readKit();
  if (process.argv.includes('--list')) {
    const users = await kitUsers();
    for (const { id, role, group, v } of variantsOf(kit)) {
      const ships = group === 'shell' ? (kit.playable.includes(role) ? 'playable + web' : 'web') : (users[id] || []).join(', ') || 'no game';
      console.log(`${id.padEnd(18)} ${v.takes.length} take(s)  ${ships.padEnd(22)} ${v.takes.map((t) => t.file).join(', ')}`);
    }
  } else {
    console.log('cut-kit  assets/audio/kit/');
    await cutKit();
  }
}
