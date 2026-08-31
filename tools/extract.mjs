#!/usr/bin/env node
/*
  extract — split the motor out of the games, once.

    node tools/extract.mjs            # write packages/ and the per-game sources
    node tools/extract.mjs --dry      # report only, touch nothing

  The motor lives today inside every games/<slug>/index.html, byte-identical.
  This script lifts it into packages/ and leaves each game with only what it
  owns:

    games/<slug>/page.html      head + markup, with {{MOTOR_CSS}} {{SKIN_CSS}}
                                {{SCRIPT}} tokens
    games/<slug>/skin.css       the SKIN block
    games/<slug>/game.js        sections 1, 2 and 6 — the game's whole code
    games/<slug>/manifest.json  per-game target config (starter, hand-completed)

  index.html stays: it becomes the build output of `--target=playable`, and
  `tools/build.mjs --check` asserts the round trip is byte-exact. Run the
  extractor once; after that, edit the extracted sources, never index.html.
*/

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitPlayable, REGIONS } from './lib/parts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');

// Where each shared region lands.
const SHARED_FILES = {
  cssMotor:    'packages/shell/motor.css',
  scriptOpen:  'packages/shell/script-open.js',
  jsEngine:    'packages/engine/engine.js',
  jsPlatform:  'packages/platform/mraid.js',
  jsShell:     'packages/shell/shell.js',
  jsBootstrap: 'packages/engine/bootstrap.js',
  scriptClose: 'packages/shell/script-close.js'
};

/*
  A build unit is anything assembled from the motor: every game, and the template
  itself. The template must be one too — otherwise it keeps its own copy of the
  motor and the drift this extraction removes comes straight back.
*/
function units() {
  const list = readdirSync(path.join(ROOT, 'games'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) => existsSync(path.join(ROOT, 'games', slug, 'index.html')))
    .sort()
    .map((slug) => ({ name: slug, dir: path.join('games', slug), out: path.join('games', slug, 'index.html'), game: true }));
  const tpl = path.join('template', 'game-template.html');
  if (existsSync(path.join(ROOT, tpl))) {
    list.push({ name: 'template', dir: 'template', out: tpl, game: false });
  }
  return list;
}

const games = units();

async function write(rel, text) {
  const full = path.join(ROOT, rel);
  await mkdir(path.dirname(full), { recursive: true });
  if (!DRY) await writeFile(full, text);
}

// The site catalogue already holds each game's accent pair and short copy.
async function siteCatalogue() {
  const src = await readFile(path.join(ROOT, 'site', 'games.js'), 'utf8');
  const win = {};
  new Function('window', src)(win);
  const byslug = {};
  for (const g of win.GAMES || []) byslug[g.slug] = g;
  return byslug;
}

// CONFIG is JS, not JSON: pull the two strings the manifest needs by pattern.
function readConfigString(jsConfig, key) {
  const m = jsConfig.match(new RegExp(`\\n\\s*${key}:\\s*("(?:[^"\\\\]|\\\\.)*")`));
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

function manifestFor(slug, jsConfig, cat) {
  const entry = cat[slug];
  // CONFIG.title is the intro's display string and is often all caps; the site
  // catalogue holds the proper name.
  const title = (entry && entry.name) || readConfigString(jsConfig, 'title') || slug;
  const tagline = readConfigString(jsConfig, 'tagline') || '';
  return {
    slug,
    title,
    // The intro tagline carries <b>, <br> and &nbsp; markup. A tag becomes a
    // space so the plain line never welds two words together, then the spaces a
    // stripped tag left in front of punctuation are closed back up.
    tagline: tagline
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .trim(),
    targets: entry && entry.draft ? ['proto'] : ['playable', 'web'],
    theme: {
      accent: entry ? entry.accent[0] : '#4bf5ff',
      accent2: entry ? entry.accent[1] : '#7a5cff'
    },
    itch: { user: 'newrare', project: slug, channel: 'html5', viewport: [450, 800], mobileFriendly: true, cta: false },
    android: { appId: `com.newrare.${slug}`, ads: { rewarded: false, interstitial: false } }
  };
}

async function main() {
  if (games.length === 0) { console.error('no games found'); process.exit(1); }

  const cat = await siteCatalogue();
  const reference = {};   // the shared regions, taken from the first game
  const problems = [];

  for (const unit of games) {
    const slug = unit.name;
    const file = unit.out;
    const html = await readFile(path.join(ROOT, file), 'utf8');
    const p = splitPlayable(html, file);

    // Games differ in the blank lines between the motor stylesheet and their own
    // SKIN block. The shared file holds no trailing whitespace and each skin.css
    // opens with its game's own separator, so the round trip stays byte-exact.
    const motorCore = p.cssMotor.replace(/\s+$/, '');
    const skin = p.cssMotor.slice(motorCore.length) + p.cssSkin;
    p.cssMotor = motorCore;
    p.cssSkin = skin;

    // Every shared region must already be identical, or the extraction would
    // silently pick one game's version for all of them.
    for (const r of REGIONS.filter((r) => r.shared)) {
      if (reference[r.key] === undefined) reference[r.key] = p[r.key];
      else if (reference[r.key] !== p[r.key]) problems.push(`${file}: ${r.key} differs from ${games[0].out}`);
    }

    // page.html — the game's own head and markup, motor CSS and script replaced
    // by tokens the builder fills in.
    const page = p.head + '{{MOTOR_CSS}}{{SKIN_CSS}}' + p.markup + '{{SCRIPT}}';
    await write(path.join(unit.dir, 'page.html'), page);
    await write(path.join(unit.dir, 'skin.css'), p.cssSkin);
    await write(path.join(unit.dir, 'game.js'), p.jsConfig + p.jsGame);

    // The template is a skeleton, not a game: it gets no manifest.
    const manifestPath = path.join(ROOT, unit.dir, 'manifest.json');
    if (unit.game && !existsSync(manifestPath)) {
      await write(path.join(unit.dir, 'manifest.json'),
        JSON.stringify(manifestFor(slug, p.jsConfig, cat), null, 2) + '\n');
    }
  }

  if (problems.length) {
    console.error('the motor is not shared yet — run tools/check-motor.mjs --fix first:');
    for (const line of problems) console.error('  - ' + line);
    process.exit(1);
  }

  // The motor stylesheet keeps no trailing whitespace: each game's skin.css
  // carries its own separator, so the round trip stays byte-exact.
  for (const [key, rel] of Object.entries(SHARED_FILES)) {
    await write(rel, reference[key]);
  }

  console.log(`${DRY ? '[dry] ' : ''}extracted the motor from ${games.length} units (${games.filter((u) => u.game).length} games + the template)`);
  for (const [key, rel] of Object.entries(SHARED_FILES)) {
    console.log(`  ${rel.padEnd(34)} ${reference[key].length} bytes`);
  }
  console.log(`  games/<slug>/{page.html, skin.css, game.js, manifest.json}`);
  console.log(`  template/{page.html, skin.css, game.js}`);
  console.log(`\nNow verify the round trip:  node tools/build.mjs --check`);
}

main().catch((err) => { console.error('extract failed:', err.message); process.exit(1); });
