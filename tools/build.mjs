#!/usr/bin/env node
/*
  build — assemble a game from the motor plus the game's own sources.

    node tools/build.mjs                          # every game, --target=playable
    node tools/build.mjs --game=vipera
    node tools/build.mjs --check                  # assert the output is unchanged
    node tools/build.mjs --target=playable --game=vipera

  --target=playable is the only target implemented today: it produces the single
  self-contained games/<slug>/index.html that ad networks receive. The proto, web
  and android targets are planned in docs/INDUSTRIALIZATION.md.

  --check builds in memory and compares against the committed index.html. A
  non-empty diff means the sources and the artifact disagree: that is the
  acceptance test of the extraction, and the CI gate.

  Inputs:
    packages/shell/motor.css        packages/shell/script-open.js
    packages/engine/engine.js       packages/platform/mraid.js
    packages/shell/shell.js         packages/engine/bootstrap.js
    packages/shell/script-close.js
    games/<slug>/page.html          {{MOTOR_CSS}} {{SKIN_CSS}} {{SCRIPT}}
    games/<slug>/skin.css           games/<slug>/game.js
*/

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitGameJs } from './lib/parts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const target = (argv.find((a) => a.startsWith('--target=')) || '--target=playable').split('=')[1];
const only = (argv.find((a) => a.startsWith('--game=')) || '').split('=')[1] || null;

if (target !== 'playable') {
  console.error(`--target=${target} is not implemented. See docs/INDUSTRIALIZATION.md.`);
  process.exit(1);
}

const read = (rel) => readFile(path.join(ROOT, rel), 'utf8');

/*
  A build unit is anything assembled from the motor: every game, and the template
  itself, so the template never holds a second copy of the motor.
*/
function units() {
  const all = readdirSync(path.join(ROOT, 'games'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) => existsSync(path.join(ROOT, 'games', slug, 'page.html')))
    .sort()
    .map((slug) => ({ name: slug, dir: path.join('games', slug), out: path.join('games', slug, 'index.html') }));

  if (existsSync(path.join(ROOT, 'template', 'page.html'))) {
    all.push({ name: 'template', dir: 'template', out: path.join('template', 'game-template.html') });
  }

  if (!only) return all;
  const picked = all.filter((u) => u.name === only);
  if (picked.length === 0) {
    console.error(`unknown or unextracted unit: ${only}`);
    process.exit(1);
  }
  return picked;
}

async function loadMotor() {
  const [motorCss, scriptOpen, engine, platform, shell, bootstrap, scriptClose] = await Promise.all([
    read('packages/shell/motor.css'),
    read('packages/shell/script-open.js'),
    read('packages/engine/engine.js'),
    read('packages/platform/mraid.js'),
    read('packages/shell/shell.js'),
    read('packages/engine/bootstrap.js'),
    read('packages/shell/script-close.js')
  ]);
  return { motorCss, scriptOpen, engine, platform, shell, bootstrap, scriptClose };
}

async function buildOne(unit, motor) {
  const dir = unit.dir;
  const [page, skin, gameJs] = await Promise.all([
    read(path.join(dir, 'page.html')),
    read(path.join(dir, 'skin.css')),
    read(path.join(dir, 'game.js'))
  ]);

  const { config, game } = splitGameJs(gameJs, `${dir}/game.js`);

  // The motor sits between the game's own two halves: CONFIG and ASSETS are read
  // by the engine, and section 6 calls into the shell the engine set up.
  const script = motor.scriptOpen + config + motor.engine + motor.platform +
                 motor.shell + game + motor.bootstrap + motor.scriptClose;

  for (const token of ['{{MOTOR_CSS}}', '{{SKIN_CSS}}', '{{SCRIPT}}']) {
    if (!page.includes(token)) throw new Error(`${dir}/page.html: missing ${token}`);
  }

  return page
    .replace('{{MOTOR_CSS}}', () => motor.motorCss)
    .replace('{{SKIN_CSS}}', () => skin)
    .replace('{{SCRIPT}}', () => script);
}

// Where the two texts first disagree, in human terms.
function firstDifference(a, b) {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  const line = a.slice(0, i).split('\n').length;
  return { line, expected: JSON.stringify(b.slice(i, i + 60)), got: JSON.stringify(a.slice(i, i + 60)) };
}

async function main() {
  const motor = await loadMotor();
  const list = units();
  if (list.length === 0) {
    console.error('nothing extracted yet — run tools/extract.mjs first');
    process.exit(1);
  }

  let bad = 0;
  for (const unit of list) {
    const out = unit.out;
    const html = await buildOne(unit, motor);

    if (CHECK) {
      const current = existsSync(path.join(ROOT, out)) ? await read(out) : null;
      if (current === html) {
        console.log(`OK    ${out}  (${(html.length / 1024).toFixed(0)} KB)`);
      } else if (current === null) {
        bad++;
        console.log(`MISSING ${out}`);
      } else {
        bad++;
        const d = firstDifference(html, current);
        console.log(`DIFF  ${out}  first at line ${d.line}`);
        console.log(`        committed: ${d.expected}`);
        console.log(`        rebuilt:   ${d.got}`);
      }
    } else {
      await writeFile(path.join(ROOT, out), html);
      console.log(`built ${out}  (${(html.length / 1024).toFixed(0)} KB)`);
    }
  }

  if (CHECK) {
    if (bad === 0) console.log(`\nAll ${list.length} units rebuild byte-identically.`);
    else console.log(`\n${bad} of ${list.length} units differ from their sources.`);
    process.exit(bad ? 1 : 0);
  }
}

main().catch((err) => { console.error('build failed:', err.message); process.exit(1); });
