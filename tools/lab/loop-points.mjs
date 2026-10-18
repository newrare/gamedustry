#!/usr/bin/env node
/*
  loop-points — which lengths of a music window loop cleanly.

    node tools/lab/loop-points.mjs <track.mp3> <from> <length>
    node tools/lab/loop-points.mjs assets/audio/music/embed/holepocalypse.mp3 40 32
    node tools/lab/loop-points.mjs <track.mp3> 40 32 --bpm 120 --span 6 --seam 1
    node tools/lab/loop-points.mjs <track.mp3> --tempo        # the BPM alone
    node tools/lab/loop-points.mjs <track.mp3> 40 32 --json   # rows for a script

  A section with a `seam` (packages/engine/engine.js, Music) loops on its own
  length: the pass that ends at `from + length` crossfades into the pass that
  starts at `from`, over the `seam` seconds that lead up to that point. It
  sounds like one piece of music only when the two moments are the SAME moment
  of the song — the same beat of the bar, the same groove, ideally the same
  chord — and the length written by ear off an RMS profile rarely is: a 34 s
  window at 120 BPM is seventeen bars, and its seam lands mid-phrase.

  This compares the music around the two points directly. Each frame of the
  track (11 025 Hz mono, 512-sample FFT, a hop of 64) is 24 log-spaced bands,
  read twice — as a spectrum (what is playing) and as its positive flux (what
  just started: the rhythm). A candidate length L is scored by the mean cosine
  similarity of `from + t` against `from + L + t` over t in [-2.5 s, +2.5 s],
  the two views weighted equally. Candidates are every whole beat within
  `--span` seconds of the length asked for (`--bpm`, measured off the track
  when it is not given: the comb of the onset flux over 80-170 BPM), each one
  refined to its best frame within ±150 ms (or a third of a beat, whichever is
  less: a generated track can jump its grid inside a window, and the loop has
  to follow the music rather than the arithmetic), and printed best first with what it is in
  bars. Scores are relative: read them against the other candidates of the
  same window, not across tracks.

  A score is a hint and the ear is the verdict — but it is the one hint that
  catches an off-bar seam, which the ear only catches after the fifth loop.
  Run it on the SHIPPING cut (assets/audio/music/embed/), since that is the
  file the seam plays in. See docs/MUSIC.md, "The seam".
*/
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
function opt(name, dflt) {
  const i = argv.indexOf("--" + name);
  if (i < 0) return dflt;
  const v = Number(argv[i + 1]);
  argv.splice(i, 2);
  return v;
}
function flag(name) { const i = argv.indexOf("--" + name); if (i >= 0) argv.splice(i, 1); return i >= 0; }
let BPM = opt("bpm", 0);
const SPAN = opt("span", 4), SEAM = opt("seam", 1), JSON_OUT = flag("json"), TEMPO = flag("tempo");
const [file, fromArg, lenArg] = argv;
if (!file || (!TEMPO && (!(Number(fromArg) >= 0) || !(Number(lenArg) > 0)))) {
  console.error("usage: loop-points.mjs <track> <from> <length> [--bpm N] [--span 4] [--seam 1] [--json] | <track> --tempo");
  process.exit(1);
}
const FROM = Number(fromArg), LEN = Number(lenArg);

// --- decode -----------------------------------------------------------------
const SR = 11025, N = 512, HOP = 64, FR = SR / HOP, BANDS = 24;
const dec = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"],
  { maxBuffer: 1 << 30 });
if (dec.status !== 0) { console.error(String(dec.stderr)); process.exit(1); }
const raw = dec.stdout, x = new Float32Array(raw.buffer, raw.byteOffset, raw.length >> 2);
const dur = x.length / SR;

// --- features: band spectrum + band flux, unit-normalised per frame ----------
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, h = len >> 1;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < h; k++) {
        const c = Math.cos(ang * k), s = Math.sin(ang * k);
        const a = i + k, b = a + h;
        const vr = re[b] * c - im[b] * s, vi = re[b] * s + im[b] * c;
        re[b] = re[a] - vr; im[b] = im[a] - vi; re[a] += vr; im[a] += vi;
      }
    }
  }
}
const win = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
const edges = [];
for (let k = 0; k <= BANDS; k++) edges.push(Math.round(2 * Math.pow(N / 4, k / BANDS)));
const spec = [];
const re = new Float64Array(N), im = new Float64Array(N);
for (let s = 0; s + N < x.length; s += HOP) {
  for (let i = 0; i < N; i++) { re[i] = x[s + i] * win[i]; im[i] = 0; }
  fft(re, im);
  const v = new Float64Array(BANDS);
  for (let k = 0; k < BANDS; k++) {
    let e = 0;
    for (let j = edges[k]; j < Math.max(edges[k + 1], edges[k] + 1); j++) e += re[j] * re[j] + im[j] * im[j];
    v[k] = Math.log(1e-6 + e);
  }
  spec.push(v);
}
function unit(v) {
  let n = 0;
  for (const a of v) n += a * a;
  n = Math.sqrt(n) + 1e-9;
  return v.map((a) => a / n);
}
const tone = spec.map((v) => { let m = 0; for (const a of v) m += a; m /= BANDS; return unit(v.map((a) => a - m)); });
const flux = spec.map((v, t) => { const p = spec[Math.max(t - 1, 0)]; return unit(v.map((a, k) => Math.max(0, a - p[k]))); });

function score(a, b, w) {
  let sum = 0, n = 0;
  for (let t = -w; t < w; t++) {
    const i = a + t, j = b + t;
    if (i < 1 || j >= spec.length) continue;
    let c1 = 0, c2 = 0;
    for (let k = 0; k < BANDS; k++) { c1 += tone[i][k] * tone[j][k]; c2 += flux[i][k] * flux[j][k]; }
    sum += 0.5 * c1 + 0.5 * c2; n++;
  }
  return n ? sum / n : 0;
}

// --- tempo: the comb of the summed flux, best phase against the mean ---------
function tempo() {
  const on = flux.map((v, t) => { const p = spec[Math.max(t - 1, 0)]; let e = 0;
    for (let k = 0; k < BANDS; k++) e += Math.max(0, spec[t][k] - p[k]); return e; });
  let best = 0, bestBpm = 120;
  for (let bpm = 80; bpm <= 170; bpm += 0.01) {
    const p = 60 / bpm * FR, bins = 48, h = new Float64Array(bins);
    let tot = 0;
    for (let i = 0; i < on.length; i++) { h[Math.floor((i % p) / p * bins)] += on[i]; tot += on[i]; }
    const sc = Math.max(...h) / (tot / bins);
    if (sc > best) { best = sc; bestBpm = bpm; }
  }
  return Math.round(bestBpm * 100) / 100;
}
if (!BPM) BPM = tempo();
if (TEMPO) { console.log(BPM); process.exit(0); }

// --- candidates: every whole beat within the span, refined to the frame ------
const beat = 60 / BPM, W = Math.round(2.5 * FR), REFINE = Math.round(Math.min(0.15, beat * 0.3) * FR);
const a = Math.round(FROM * FR), rows = [];
for (let k = Math.ceil((LEN - SPAN) / beat); k * beat <= LEN + SPAN; k++) {
  const L = k * beat;
  if (L < 4 || FROM + L + 0.5 > dur) continue;
  let best = -1, bestL = L;
  for (let d = -REFINE; d <= REFINE; d++) {
    const sc = score(a, Math.round((FROM + L) * FR) + d, W);
    if (sc > best) { best = sc; bestL = L + d / FR; }
  }
  rows.push({ L, bestL, best, beats: k });
}
rows.sort((p, q) => q.best - p.best);
if (JSON_OUT) { console.log(JSON.stringify({ file, from: FROM, length: LEN, bpm: BPM, dur, rows })); process.exit(0); }
const asked = rows.find((r) => Math.abs(r.L - LEN) < beat / 2);
console.log(`${file}  from ${FROM} s, ${dur.toFixed(1)} s long, ${BPM} BPM, seam ${SEAM} s`);
console.log(`pre-roll available: ${Math.min(SEAM, FROM).toFixed(2)} s` +
            (FROM < SEAM ? `  (the rest of the seam is taken after the loop point)` : ""));
for (const r of rows.slice(0, 8)) {
  const bars = r.beats / 4, mark = r === asked ? "  <- asked" : "";
  console.log(`  length ${r.L.toFixed(2).padStart(6)}  (${Number.isInteger(bars) ? bars + " bars" : r.beats + " beats"})` +
              `  best at ${r.bestL.toFixed(3)}  score ${r.best.toFixed(3)}${mark}`);
}
if (asked && rows.indexOf(asked) >= 8) console.log(`  asked ${LEN}: score ${asked.best.toFixed(3)}, rank ${rows.indexOf(asked) + 1}/${rows.length}`);
