#!/usr/bin/env node
/*
  itch-page — the HTML to paste into the description field of a game's itch page.

    node tools/publish/itch-page.mjs --game=chainring
    node tools/publish/itch-page.mjs --all
    node tools/publish/itch-page.mjs --game=chainring --no-check   # skip the URL probe

  The studio's itch account has no custom CSS, so the page is dressed with the
  theme editor alone: the page background is the game's own scene, veiled
  (`assets/image/itch/<slug>-background.jpg`, tools/lab/itch-art.mjs), the
  main column's background alpha is set to 0 so the description stands on it.

  The description SELLS the game, it does not teach it — the rules are the
  guide's, and the page ends on a link to it. It reads as picture, a few
  lines, picture, a few lines:

    the hook and the pitch       itch.page.en.hook / pitch
    the showcase                 <slug>-showcase.webp, no word on it
    one block per section        its banner <slug>-section-<key>.webp, then its
                                 text and its list
    the way out                  itch.page.en.outro, the guide, the studio

  Every word is in games/<slug>/manifest.json under `itch.page`, and every
  picture is composed by tools/lab/itch-banners.mjs out of the game's own
  pieces. The pictures are served by newrare.app (image/games/<slug>/itch-*,
  copied by tools/build/build-site.mjs), because itch's description takes an
  image by URL: the run probes each one and names any the deployed site does
  not answer yet — push the site first.

  Output: dist/itch-page/<slug>.en.html, plus the theme settings to type into
  the editor, printed.
*/

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = 'https://newrare.app';
const LANG = 'en';   // the itch page is written in English, one language

const argv = process.argv.slice(2);
const only = (argv.find((a) => a.startsWith('--game=')) || '').split('=')[1] || null;
const all = argv.includes('--all');
const check = !argv.includes('--no-check');
if (!only && !all) {
  console.error('usage: itch-page.mjs --game=<slug> | --all   [--no-check]');
  process.exit(1);
}

/* The only words this tool writes: the line every page ends on. */
const T = {
  free: 'Free, in your browser. No install, no account.',
  guide: 'Every rule, with pictures:',
  more: 'More free games from the same studio:'
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* Game copy may carry <b>…</b> around a key word, the one tag let through. */
const rich = (s) => esc(s).replace(/&lt;b&gt;/g, '<strong>').replace(/&lt;\/b&gt;/g, '</strong>');
const center = (inner) => `<p style="text-align: center;">${inner}</p>`;

const urls = [];
function img(url, alt, w, h) {
  urls.push(url);
  return `<img src="${url}" alt="${esc(alt)}" width="${w}" height="${h}">`;
}

/* A banner's height is read off the file itself (a WebP's VP8X header), so a
   layout change in itch-banners.mjs needs no second edit here. */
function sizeOf(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
    '-of', 'csv=p=0', file], { encoding: 'utf8' });
  const [w, h] = String(r.stdout || '').trim().split(',').map(Number);
  return w && h ? { w, h } : null;
}

function banner(slug, name, alt) {
  const file = path.join(ROOT, 'assets', 'image', 'itch', `${slug}-${name}.webp`);
  if (!existsSync(file)) {
    console.error(`  no ${path.relative(ROOT, file)} — run node tools/lab/itch-banners.mjs ${slug}`);
    return '';
  }
  /* Shot at twice the size it is meant to be seen at (itch-banners.mjs,
     DSF): showing it bigger is what makes a low-resolution piece blur. */
  const s = sizeOf(file) || { w: 1600, h: 600 };
  return center(img(`${SITE}/image/games/${slug}/itch-${name}.webp`, alt, Math.round(s.w / 2), Math.round(s.h / 2)));
}

async function build(slug) {
  const m = JSON.parse(await readFile(path.join(ROOT, 'games', slug, 'manifest.json'), 'utf8'));
  const page = m.itch && m.itch.page;
  if (!page || !page[LANG]) throw new Error(`${slug}: no itch.page.${LANG} in games/${slug}/manifest.json`);
  const c = page[LANG];
  const name = m.title || slug;
  const html = [];

  if (c.hook) html.push(`<h2 style="text-align: center;">${rich(c.hook)}</h2>`);
  for (const p of c.pitch || []) html.push(center(rich(p)));
  if (page.art && page.art.showcase) html.push(banner(slug, 'showcase', name));

  for (const s of c.sections || []) {
    html.push(banner(slug, 'section-' + s.key, s.title));
    for (const p of s.text || []) html.push(center(rich(p)));
    if (s.list && s.list.length) {
      /* Centred lines rather than a <ul>: the whole page is centred on its
         banners, and a bullet list is the one block that would sit left. */
      html.push(center(s.list.map((l) => `<strong>${rich(l[0])}</strong> — ${rich(l[1])}`).join('<br>')));
    }
  }

  html.push('<hr>');
  if (c.outro) html.push(`<h3 style="text-align: center;">${rich(c.outro)}</h3>`);
  html.push(center(`<em>${esc(T.free)}</em>`));
  html.push(center(`${esc(T.guide)} <a href="${SITE}/guide/${slug}">newrare.app/guide/${slug}</a><br>` +
    `${esc(T.more)} <a href="${SITE}">newrare.app</a>`));

  return { m, html: html.filter(Boolean).join('\n\n') + '\n' };
}

/* The page colour under the background: the bottom of the picture, averaged,
   so a window taller than 1440 px shows no seam. */
function pageColour(slug) {
  const bg = path.join(ROOT, 'assets', 'image', 'itch', slug + '-background.jpg');
  if (!existsSync(bg)) return null;
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', bg,
    '-vf', 'crop=iw:ih/6:0:ih*5/6,scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  if (r.status !== 0 || r.stdout.length < 3) return null;
  return '#' + Array.from(r.stdout.subarray(0, 3)).map((v) => v.toString(16).padStart(2, '0')).join('');
}

async function probe(list) {
  const bad = [];
  await Promise.all([...new Set(list)].map(async (u) => {
    try {
      const r = await fetch(u, { method: 'HEAD' });
      if (!r.ok) bad.push(`${r.status} ${u}`);
    } catch (e) { bad.push(`ERR ${u}`); }
  }));
  return bad;
}

const slugs = all
  ? readdirSync(path.join(ROOT, 'games')).filter((s) => {
    const f = path.join(ROOT, 'games', s, 'manifest.json');
    return existsSync(f) && JSON.parse(readFileSync(f, 'utf8')).itch?.page;
  }).sort()
  : [only];

const OUT = path.join(ROOT, 'dist', 'itch-page');
await mkdir(OUT, { recursive: true });

for (const slug of slugs) {
  urls.length = 0;
  const { m, html } = await build(slug);
  const out = path.join(OUT, `${slug}.${LANG}.html`);
  await writeFile(out, html);
  const theme = m.theme || {};
  console.log(`\n${slug}  →  ${path.relative(ROOT, out)}  (${Math.round(html.length / 1024)} KB)`);
  console.log('  theme editor:');
  console.log(`    background image  assets/image/itch/${slug}-background.jpg — fixed, no repeat, top centre`);
  console.log(`    background colour ${pageColour(slug) || '#05050c'}`);
  console.log('    column bg alpha   0  (More options)');
  console.log('    text colour       #eef0ff');
  console.log(`    link colour       ${theme.accent || '#4bf5ff'}`);
  console.log(`    button colour     ${theme.accent2 || theme.accent || '#4263eb'}`);
  console.log(`    cover             assets/image/itch/${slug}-itch.jpg`);
  if (check) {
    const bad = await probe(urls);
    console.log(bad.length ? '  NOT SERVED YET (push the site first):\n    ' + bad.join('\n    ') : `  ${new Set(urls).size} images, all served by ${SITE}`);
  }
}
