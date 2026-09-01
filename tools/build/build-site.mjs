#!/usr/bin/env node
/*
  build-site — assemble the public newrare site into dist/site/.

    node tools/build/build-site.mjs

  What it does:
    1. runs `build.mjs --target=web`, so the site always ships the CURRENT web
       build of every game — menu instead of intro, no install CTA
    2. copies site/ (the hand-written pages) to dist/site/
    3. copies every game's web build to dist/site/games/<slug>/, and the motor
       it shares with the others — engine.<hash>.js and friends — once, to
       dist/site/games/
    4. copies each game's icon and screenshots out of assets/ into
       dist/site/image/games/<slug>/
    5. rewrites games.js with what it actually found on disk, so the page never
       links an image that is not there

  Games are read from site/games.js. A game marked `draft: true` is held back on
  purpose; a game with no icon in assets/icon/thumb/ is dropped and reported as a
  problem.

  This is the Vercel build command. Output is gitignored.
*/

import { readFile, writeFile, mkdir, rm, cp, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = path.join(ROOT, 'site');
const OUT = path.join(ROOT, 'dist', 'site');

// Everything under site/ is published except these.
const SKIP = new Set(['newrare-website', '.git', '.DS_Store', 'node_modules']);

async function loadGames() {
  const src = await readFile(path.join(SITE, 'games.js'), 'utf8');
  const win = {};
  // games.js is a browser script assigning window.GAMES; run it against a stub.
  new Function('window', src)(win);
  if (!Array.isArray(win.GAMES)) throw new Error('site/games.js did not define window.GAMES');
  return win.GAMES;
}

async function copySite() {
  await cp(SITE, OUT, {
    recursive: true,
    filter: (src) => !SKIP.has(path.basename(src))
  });
}

async function screensFor(slug) {
  const dir = path.join(ROOT, 'assets', 'screen');
  if (!existsSync(dir)) return [];
  const all = await readdir(dir);
  return all
    .filter((f) => f.startsWith(slug + '-') && f.endsWith('.jpg'))
    .sort();
}

async function dirSize(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? await dirSize(full) : (await stat(full)).size;
  }
  return total;
}

async function main() {
  /* The site serves the web build, never the playable one: a playable's CTA
     bar sends the player to a store, and from the site that store IS the site.
     Building it here rather than trusting dist/ is what keeps a page from
     shipping yesterday's game. */
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'build', 'build.mjs'), '--target=web'],
    { cwd: ROOT, stdio: 'inherit' });

  const games = await loadGames();

  await rm(path.join(ROOT, 'dist', 'site'), { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await copySite();

  const built = [];
  const skipped = [];
  const drafts = [];

  for (const game of games) {
    const { slug } = game;

    // Held back on purpose: still in construction, copy already written.
    if (game.draft) { drafts.push(slug); continue; }
    const icon = path.join(ROOT, 'assets', 'icon', 'thumb', slug + '.png');
    const page = path.join(ROOT, 'dist', 'web', slug, 'index.html');

    if (!existsSync(icon)) { skipped.push(`${slug} — no assets/icon/thumb/${slug}.png`); continue; }
    if (!existsSync(page)) { skipped.push(`${slug} — no web build (targets in manifest?)`); continue; }

    const imgDir = path.join(OUT, 'image', 'games', slug);
    await mkdir(imgDir, { recursive: true });
    await cp(icon, path.join(imgDir, 'icon.png'));

    // Screenshots are renumbered 01.jpg, 02.jpg… so the page can build the
    // list from a count instead of shipping filenames.
    const shots = await screensFor(slug);
    for (let i = 0; i < shots.length; i++) {
      const n = String(i + 1).padStart(2, '0');
      await cp(path.join(ROOT, 'assets', 'screen', shots[i]), path.join(imgDir, `${n}.jpg`));
    }

    /* A web build is a folder now: index.html, the game's own two scripts and
       its assets as files. The motor is NOT in there — it is the hashed pair
       at the root of dist/web, copied once below, so opening a second game
       downloads neither the engine nor the menu again. */
    await cp(path.join(ROOT, 'dist', 'web', slug), path.join(OUT, 'games', slug), { recursive: true });

    built.push({ ...game, draft: undefined, icon: true, screens: shots.length });
  }

  /* The shared half of the split build: one engine, one menu, one stylesheet
     for the whole gallery. They are content-hashed, so they are copied whole
     and never invalidated by anything but their own contents. */
  if (built.length) {
    for (const name of await readdir(path.join(ROOT, 'dist', 'web'))) {
      if (name.endsWith('.js') || name.endsWith('.css')) {
        await cp(path.join(ROOT, 'dist', 'web', name), path.join(OUT, 'games', name));
      }
    }
  }

  const header = '/* Generated by tools/build/build-site.mjs — do not edit. Source: site/games.js */\n';
  await writeFile(path.join(OUT, 'games.js'), header + 'window.GAMES = ' + JSON.stringify(built, null, 2) + ';\n');

  const bytes = await dirSize(OUT);
  console.log(`site → dist/site  (${(bytes / 1048576).toFixed(1)} MB)`);
  console.log(`  ${built.length} games: ${built.map((g) => `${g.slug}(${g.screens})`).join(' ')}`);
  if (drafts.length) console.log(`  drafts held back: ${drafts.join(' ')}`);
  if (skipped.length) {
    console.log('  skipped:');
    for (const line of skipped) console.log('    - ' + line);
  }
}

main().catch((err) => {
  console.error('build-site failed:', err.message);
  process.exit(1);
});
