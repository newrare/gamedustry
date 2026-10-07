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
        variants: { <name>: { jitter, takes: [{ file, start, length, tail?, tailLength? }] } } } } }

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
  one, is how the take ends (THE TAIL, below). `jitter` is the random
  pitch spread put on every shot (0 for a variant pitched as a LADDER — the
  stars, the coins, a chain of pickups — where a wobble would blur the steps).
  `playable` lists the shell roles a playable carries, the end screen's.

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
   which lab/sound-kit.html carries a copy of, so the page hears what is cut. */
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

const NAME = /^[a-z][a-z0-9]{0,23}$/;

/* What the kit page may write, checked against the kit on disk. The ROLES are
   not the page's to invent or drop — each is a name the engine and the shell
   call (UI_FALLBACK in packages/engine/engine.js) — so a role keeps its group
   and its words, and the page rewrites its variants: a shell role keeps its one
   `default`, a gameplay role may add, rename and drop them — except a variant
   a game plays, which stays until that game is mapped elsewhere. */
export async function writeKit(next) {
  const kit = await readKit();
  const users = await kitUsers();
  const stems = new Set((await readdir(SFX_DIR)).map((f) => f.slice(0, f.lastIndexOf('.'))));
  for (const [role, r] of Object.entries(kit.roles)) {
    const n = next && next.roles && next.roles[role];
    if (!n || !n.variants) throw new Error(`role "${role}" is missing`);
    const names = Object.keys(n.variants);
    if (r.group === 'shell' && (names.length !== 1 || names[0] !== 'default')) {
      throw new Error(`${role}: a shell role has one variant, "default"`);
    }
    if (!names.length) throw new Error(`${role}: at least one variant`);
    for (const name of Object.keys(r.variants)) {
      const id = idOf(kit, role, name);
      if (!n.variants[name] && users[id]) throw new Error(`${id} is played by ${users[id].join(', ')} — map it elsewhere first`);
    }
    const variants = {};
    for (const name of names) {
      if (!NAME.test(name)) throw new Error(`${role}: "${name}" — a variant is named in lowercase letters and digits`);
      const v = n.variants[name], takes = v.takes || [];
      const where = idOf(kit, role, name);
      if (takes.length < 1 || takes.length > 3) throw new Error(`${where}: one to three takes`);
      variants[name] = {
        jitter: Math.min(0.1, Math.max(0, Math.round(Number(v.jitter) * 100) / 100 || 0)),
        takes: takes.map((t, i) => {
          if (!stems.has(t.file)) throw new Error(`${where} #${i + 1}: no file "${t.file}" in assets/audio/sfx/`);
          const start = Math.max(0, Math.round(Number(t.start) * 1000) / 1000 || 0);
          const length = Math.round(Number(t.length) * 1000) / 1000;
          if (!(length >= 0.02 && length <= 3)) throw new Error(`${where} #${i + 1}: a length of 0.02 to 3 s`);
          const out = { file: t.file, start, length };
          if (t.tail) {
            if (!TAILS.includes(t.tail)) throw new Error(`${where} #${i + 1}: a tail is ${TAILS.join(' or ')}`);
            out.tail = t.tail;
            out.tailLength = Math.min(length, Math.max(0.02, Math.round(Number(t.tailLength) * 1000) / 1000 || defaultTail(length)));
          }
          return out;
        })
      };
    }
    r.variants = variants;
  }
  await writeFile(KIT_JSON, formatKit(kit));
  return kit;
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
  for (const { key, id } of list || []) {
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
    } else if (!sfx[key]) {
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
  if (take.tail) {
    // Levelled on the cut as it reads, then the tail rendered here and handed back as raw PCM.
    const tailed = tailPcm(pcm, RATE, take.tail, take.tailLength || defaultTail(take.length));
    await run(['-y', '-f', 'f32le', '-ar', String(RATE), '-ac', '1', '-i', 'pipe:0',
      '-af', `volume=${gain.toFixed(2)}dB`, ...encode],
    { input: Buffer.from(tailed.buffer, tailed.byteOffset, tailed.byteLength) });
    return { level, gain };
  }
  const fade = Math.min(FADE, take.length * 0.3);
  const st = Math.max(0, take.length - fade);
  await run(['-y', ...seek,
    '-af', [...mix, `volume=${gain.toFixed(2)}dB`, `afade=t=out:st=${st.toFixed(3)}:d=${fade.toFixed(3)}`].join(','),
    ...encode]);
  return { level, gain };
}

export async function cutKit({ log = console.log } = {}) {
  const kit = await readKit();
  await mkdir(KIT_DIR, { recursive: true });
  const keep = new Set();
  for (const { role, variant, v } of variantsOf(kit)) {
    for (let i = 0; i < (v.takes || []).length; i++) {
      const name = `${role}-${variant}-${i + 1}.mp3`;
      keep.add(name);
      const t = v.takes[i];
      const { level, gain } = await cutTake(kit, t, path.join(KIT_DIR, name));
      log(`  ${name.padEnd(26)} ${t.file} ${t.start || 0}+${t.length}s${t.tail ? ' ' + t.tail + ' ' + t.tailLength + 's' : ''}  ` +
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
