#!/usr/bin/env node
/*
  itch-art — the page background of a game's itch page, cut from its master.

    node tools/lab/itch-art.mjs                 # every game, skipping what is fresh
    node tools/lab/itch-art.mjs chainring       # one game
    node tools/lab/itch-art.mjs --force         # re-cut even when fresh
    node tools/lab/itch-art.mjs --alpha 0.7     # force the veil (default: measured)

  An itch page without custom CSS is dressed from the theme editor alone, and
  the one picture that editor takes that a whole page can stand on is the PAGE
  BACKGROUND. With the main column's background alpha set to 0, the
  description is written straight over it — so the picture has to be a scene
  that text reads on, which a painted scene is not:

    <slug>-background.jpg   the desk scene (`-background-desk.png`), 2560x1440,
                            softened, veiled in black and vignetted. The veil
                            is MEASURED, not fixed: it darkens the scene until
                            its bright areas (the 90th percentile of luma) sit
                            at PEAK, so a night scene keeps its colour and a
                            sunny one is pulled down hard. Upload it
                            as the page background, fixed, no repeat, centred
                            at the top, over a near-black page colour. itch has
                            no "cover" sizing: the picture is shown at its own
                            size, which is why it is cut for a 1440p window.
  It lands in assets/image/itch/. itch keeps no language
  folder: none of its pictures carries a word.

  ffmpeg only — no browser. Committed like every shipping cut; the build never
  runs this.
*/

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MASTER = path.join(ROOT, 'assets', 'image', 'master');
const OUT = path.join(ROOT, 'assets', 'image', 'itch');

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const ai = argv.indexOf('--alpha');
const forced = ai >= 0 ? Number(argv[ai + 1]) : null;
if (forced !== null && !(forced >= 0 && forced <= 1)) { console.error('--alpha must be between 0 and 1'); process.exit(1); }

/* The bright areas of the scene, once veiled, sit at this luma (0..1): white
   text at 17 px over it keeps well past a 7:1 contrast. A floor keeps some
   veil on every scene, a ceiling keeps the scene visible at all. */
const PEAK = 0.24, FLOOR = 0.25, CEIL = 0.82;
const only = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--alpha');

/* What the background is cut to: a 1440p window shows it whole, and a smaller
   one shows its top centre, which is where `position: 50% 0` anchors it. */
const BG = { w: 2560, h: 1440, blur: 2.5, q: 3 };

const games = fs.readdirSync(path.join(ROOT, 'games'))
  .filter((s) => fs.existsSync(path.join(ROOT, 'games', s, 'manifest.json')))
  .filter((s) => !only.length || only.includes(s))
  .sort();
if (only.length && !games.length) { console.error('no such game: ' + only.join(' ')); process.exit(1); }

function fresh(src, out) {
  return !force && fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs;
}

/* The 90th percentile of the master's luma, read off a 128 px grey copy. */
function brightLuma(src) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', src,
    '-vf', 'scale=128:-1,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 24 });
  if (r.status !== 0) throw new Error(String(r.stderr || 'ffmpeg failed').trim());
  const px = Array.from(r.stdout).sort((a, b) => a - b);
  return px[Math.floor(px.length * 0.9)] / 255;
}

function veilFor(src) {
  if (forced !== null) return forced;
  const p90 = brightLuma(src);
  return Math.min(CEIL, Math.max(FLOOR, 1 - PEAK / Math.max(p90, 1e-3)));
}

function ffmpeg(args, out) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args, out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error((r.stderr || 'ffmpeg failed').trim());
  return Math.round(fs.statSync(out).size / 1024);
}

fs.mkdirSync(OUT, { recursive: true });
let made = 0, skipped = 0, missing = 0;

for (const slug of games) {
  const jobs = [
    {
      src: path.join(MASTER, slug + '-background-desk.png'),
      out: path.join(OUT, slug + '-background.jpg'),
      /* Fill the frame (crop what overflows), soften so a letter never sits
         on a hard painted edge, then the veil and a vignette that pulls the
         corners into the page colour. */
      args: (src) => ['-i', src, '-vf',
        `scale=${BG.w}:${BG.h}:force_original_aspect_ratio=increase:flags=lanczos,` +
        `crop=${BG.w}:${BG.h},gblur=sigma=${BG.blur},` +
        `drawbox=x=0:y=0:w=iw:h=ih:color=black@${veilFor(src).toFixed(2)}:t=fill,` +
        'vignette=angle=PI/7,format=yuvj420p',
        '-q:v', String(BG.q)]
    }
  ];
  for (const job of jobs) {
    const rel = path.relative(ROOT, job.out);
    if (!fs.existsSync(job.src)) { console.log(`miss  ${rel}  (no ${path.basename(job.src)})`); missing++; continue; }
    if (fresh(job.src, job.out)) { skipped++; continue; }
    const veil = /-background\.jpg$/.test(job.out) ? `, veil ${veilFor(job.src).toFixed(2)}` : '';
    const kb = ffmpeg(job.args(job.src), job.out);
    console.log(`OK    ${rel}  (${kb} KB${veil})`);
    made++;
  }
}

console.log(`${made} written, ${skipped} fresh, ${missing} missing a master`);
