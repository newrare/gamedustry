#!/usr/bin/env node
/*
  shape-sfx — what each file of assets/audio/sfx/ LOOKS like as a wave, and
  which files look like a given cut.

    node tools/lab/shape-sfx.mjs                          # (re)build the cache, print a summary
    node tools/lab/shape-sfx.mjs ui-click-01 0 0.1        # the ten files most alike that cut

  A name says what a sound is, and the library names ~1300 of them: a sound
  that is "a bit like this one, but…" is not found by its name. So the events
  bench (`make events` → /sound, a kit card's editor) proposes alternatives by
  the SHAPE of the signal instead — read here once per file, ~10 ms at a time
  over its first six seconds, as three numbers a frame:

    loudness   the RMS of the frame, in dB — the envelope: a click, a swell,
               a hit and its ring
    centroid   where the spectrum's weight sits, in octaves — dark or bright
    spread     how wide the spectrum is around it, in octaves — a beep is a
               line, a boom or a hiss a band

  Two shapes are compared from their ONSETS (the first frame within 30 dB of
  the loudest), over the length of the cut, each relative to its own loudest
  frame — the kit levels every take anyway — and the envelope as the root of
  the amplitude, so a quiet tail weighs what it sounds. It counts on every frame,
  the spectrum only where something sounds, weighted by how loud it is there.
  A candidate shorter than the cut is compared to silence past its end.

  The cache is dist/lab/sfx-shapes.json, keyed by file and size: a build input
  of nobody, made again in ~20 s by the first bench that asks (serve-events
  starts it on launch). Never committed.
*/
import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SFX_DIR = path.join(ROOT, 'assets', 'audio', 'sfx');
export const SHAPES = path.join(ROOT, 'dist', 'lab', 'sfx-shapes.json');
const AUDIO = /\.(mp3|ogg|wav|m4a)$/i;
const VERSION = 3;                // moves when what a frame holds moves: the cache is read again

const SR = 16000;
const HOP = 160;                  // 10 ms a frame
const WIN = 512;                  // 32 ms of signal under it, Hann-windowed
const MAX_FRAMES = 600;           // six seconds: a take is three at most
const DB_FLOOR = -90;
const OCT_LO = 5, OCT_HI = 13;    // 32 Hz to 8 kHz, the centroid's range
const ONSET = 30;                 // dB under the loudest frame where a sound starts
const SILENT = -60;               // dB under it where a frame is silence
const SPREAD = 3;                 // octaves: the widest spread a byte holds

function decode(file) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-t', String(MAX_FRAMES / 100 + 0.1),
      '-i', path.join(SFX_DIR, file), '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-']);
    const out = [];
    let err = '';
    p.stdout.on('data', (b) => out.push(b));
    p.stderr.on('data', (b) => { err += b; });
    p.on('error', reject);
    p.on('close', (code) => {
      if (code) return reject(new Error(err.trim() || 'ffmpeg ' + code));
      const b = Buffer.concat(out);
      resolve(new Float32Array(b.buffer, b.byteOffset, b.byteLength >> 2));
    });
  });
}

// A radix-2 FFT in place, for the one size used here.
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

const HANN = Float32Array.from({ length: WIN }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (WIN - 1)));
const byte = (v, lo, hi) => Math.max(0, Math.min(255, Math.round((v - lo) / (hi - lo) * 255)));

// Three bytes a frame — loudness, centroid, spread — interleaved.
function framesOf(pcm) {
  const n = Math.min(MAX_FRAMES, Math.max(1, Math.ceil(pcm.length / HOP)));
  const out = new Uint8Array(n * 3), re = new Float64Array(WIN), im = new Float64Array(WIN);
  for (let k = 0; k < n; k++) {
    const s = k * HOP;
    let sum = 0;
    for (let i = 0; i < WIN; i++) {
      const v = pcm[s + i] || 0;
      sum += v * v;
      re[i] = v * HANN[i]; im[i] = 0;
    }
    const db = Math.max(DB_FLOOR, 10 * Math.log10(sum / WIN + 1e-12));
    let c = 0, f = 0;
    if (db > DB_FLOOR + 10) {
      fft(re, im);
      /* Both in octaves, over the power spectrum: where its weight sits, and
         how wide it is spread around that — a beep is a line, a boom or a
         hiss a band. (Flatness was the first try at "tone or noise", and the
         roll-off of every real recording made a boom read as tonal as a beep.) */
      let ps = 0, pl = 0, pl2 = 0;
      for (let b = 1; b < WIN / 2; b++) {
        const pw = re[b] * re[b] + im[b] * im[b] + 1e-12, l = Math.log2(b * SR / WIN);
        ps += pw; pl += pw * l; pl2 += pw * l * l;
      }
      c = Math.max(OCT_LO, pl / ps);
      f = Math.sqrt(Math.max(0, pl2 / ps - (pl / ps) * (pl / ps)));
    }
    out[k * 3] = byte(db, DB_FLOOR, 0);
    out[k * 3 + 1] = c ? byte(c, OCT_LO, OCT_HI) : 0;
    out[k * 3 + 2] = byte(f, 0, SPREAD);
  }
  return out;
}

function unpack(entry) {
  const b = Buffer.from(entry.d, 'base64'), n = b.length / 3;
  const e = new Float32Array(n), c = new Float32Array(n), f = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    e[k] = b[k * 3] / 255 * -DB_FLOOR + DB_FLOOR;
    c[k] = OCT_LO + b[k * 3 + 1] / 255 * (OCT_HI - OCT_LO);
    f[k] = b[k * 3 + 2] / 255 * SPREAD;
  }
  return { n, e, c, f };
}

/* Every file's shape, read from the cache and completed from the folder: a
   file not in it, or whose size moved, is decoded again. One promise for the
   whole process, so the bench's first two questions do not run it twice. */
let loading = null;
export function shapes({ log = () => {} } = {}) {
  if (!loading) loading = build(log).catch((e) => { loading = null; throw e; });
  return loading;
}
async function build(log) {
  let cache = {};
  try { cache = JSON.parse(await readFile(SHAPES, 'utf8')); } catch {}
  const files = (await readdir(SFX_DIR)).filter((f) => AUDIO.test(f)).sort();
  const next = {}, todo = [];
  for (const file of files) {
    const size = (await stat(path.join(SFX_DIR, file))).size;
    if (cache[file] && cache[file].z === size && cache[file].v === VERSION) next[file] = cache[file];
    else todo.push({ file, size });
  }
  if (todo.length) {
    log(`shape-sfx: reading ${todo.length} file${todo.length > 1 ? 's' : ''}…`);
    let at = 0;
    const worker = async () => {
      while (at < todo.length) {
        const { file, size } = todo[at++];
        try { next[file] = { v: VERSION, z: size, d: Buffer.from(framesOf(await decode(file))).toString('base64') }; }
        catch (e) { log(`shape-sfx: ${file} — ${e.message}`); }
      }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
  }
  if (todo.length || Object.keys(cache).length !== Object.keys(next).length) {
    await mkdir(path.dirname(SHAPES), { recursive: true });
    await writeFile(SHAPES, JSON.stringify(next));
  }
  const map = new Map();
  for (const [file, entry] of Object.entries(next)) map.set(file, unpack(entry));
  return map;
}

/* The envelope is compared as the square root of the amplitude (dB / 40), not
   in dB: in dB a hiss 30 dB down weighs as much as the hit itself, and a
   click with a quiet tail of room noise was told apart from every clean click.
   Under SILENT it is nothing. ENV is how much the envelope counts against the
   spectrum. */
const ENV = 4;
const gain = (rel) => rel <= SILENT ? 0 : Math.pow(10, rel / 40);
const onsetOf = (e, from, to, top) => {
  for (let k = from; k < to; k++) if (e[k] >= top - ONSET) return k;
  return from;
};
function maxOf(e, from, to) {
  let m = DB_FLOOR;
  for (let k = from; k < to; k++) m = Math.max(m, e[k]);
  return m;
}

/* The files most alike the cut [start, start + length] of `file`, nearest
   first: [{ file, score }], score 0–100. `not` leaves files out (the takes
   already in the variant). */
export function alike(map, file, start, length, { n = 10, not = [] } = {}) {
  const A = map.get(file);
  if (!A) return [];
  const a0 = Math.min(A.n - 1, Math.max(0, Math.floor(start * 100)));
  const a1 = Math.min(A.n, a0 + Math.max(1, Math.ceil(length * 100)));
  const topA = maxOf(A.e, a0, a1), oA = onsetOf(A.e, a0, a1, topA), m = Math.max(1, a1 - oA);
  const skip = new Set([file, ...not]);
  const out = [];
  for (const [other, B] of map) {
    if (skip.has(other)) continue;
    const topB = maxOf(B.e, 0, B.n), oB = onsetOf(B.e, 0, B.n, topB);
    let env = 0, spec = 0, wsum = 0;
    for (let i = 0; i < m; i++) {
      const ka = oA + i, kb = oB + i;
      const ga = gain(A.e[ka] - topA), gb = kb < B.n ? gain(B.e[kb] - topB) : 0;
      const de = ga - gb;
      env += de * de;
      if (ga > 0 && gb > 0) {
        const w = Math.max(ga, gb) * Math.max(ga, gb);
        const dc = (A.c[ka] - B.c[kb]) / 1.5, df = (A.f[ka] - B.f[kb]) / 0.75;
        spec += w * (dc * dc + df * df);
        wsum += w;
      }
    }
    // A sound where the cut has silence (or the reverse) is already paid for by the envelope.
    const d = ENV * env / m + (wsum ? spec / wsum : 1);
    out.push({ file: other, d });
  }
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, n).map((x) => ({ file: x.file, score: Math.round(100 / (1 + x.d)) }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const t0 = Date.now();
  const map = await shapes({ log: console.log });
  console.log(`shape-sfx  ${map.size} files in ${((Date.now() - t0) / 1000).toFixed(1)} s → ${path.relative(ROOT, SHAPES)}`);
  const [stem, start = '0', length = '0.3'] = process.argv.slice(2);
  if (stem) {
    const file = [...map.keys()].find((f) => f.slice(0, f.lastIndexOf('.')) === stem);
    if (!file) { console.error(`no file "${stem}"`); process.exit(1); }
    for (const r of alike(map, file, Number(start), Number(length))) console.log(`  ${String(r.score).padStart(3)}  ${r.file}`);
  }
}
