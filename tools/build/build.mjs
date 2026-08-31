#!/usr/bin/env node
/*
  build — assemble a game from the motor plus the game's own sources.

    node tools/build/build.mjs                          # every game, --target=playable
    node tools/build/build.mjs --game=vipera
    node tools/build/build.mjs --check                  # assert the output is unchanged
    node tools/build/build.mjs --target=playable --game=vipera

  Targets:
    playable   the single self-contained games/<slug>/index.html ad networks get
    proto      a stripped build for validating a concept — see --target=proto below

  A game's manifest lists the *distribution* targets it is meant for; a build for
  a target the manifest does not list is skipped and reported. `proto` is a
  development target and is always available.

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
    games/<slug>/manifest.json      slug, targets, title…

  --target=proto writes dist/proto/<slug>/index.html instead: the same motor and
  the same game, with three things added and nothing forked —

    a seeded Math.random shim in <head>, so ?seed=42 makes a run reproducible
    window.__PROTO__ in the bootstrap, the handle packages/devtools reads
    packages/devtools/{devtools.css, devtools.js} after the motor

  It never touches the committed artifacts. Serve it with
  `node tools/lab/serve.mjs <slug>` for reload on save.
*/

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitGameJs } from '../lib/parts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const target = (argv.find((a) => a.startsWith('--target=')) || '--target=playable').split('=')[1];
const only = (argv.find((a) => a.startsWith('--game=')) || '').split('=')[1] || null;

const TARGETS = ['playable', 'proto'];
if (!TARGETS.includes(target)) {
  console.error(`--target=${target} is not implemented (have: ${TARGETS.join(', ')}). See docs/INDUSTRIALIZATION.md.`);
  process.exit(1);
}

// proto is a development target: it never touches the committed artifacts.
const DEV_TARGET = target === 'proto';

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
    all.push({ name: 'template', dir: 'template', out: path.join('template', 'game-template.html'), template: true });
  }

  if (!only) return all;
  const picked = all.filter((u) => u.name === only);
  if (picked.length === 0) {
    console.error(`unknown or unextracted unit: ${only}`);
    process.exit(1);
  }
  return picked;
}

async function manifestOf(unit) {
  if (unit.template) return null;
  const file = path.join(unit.dir, 'manifest.json');
  if (!existsSync(path.join(ROOT, file))) return null;
  const m = JSON.parse(await read(file));
  if (m.slug !== unit.name) throw new Error(`${file}: slug says "${m.slug}", folder says "${unit.name}"`);
  return m;
}

/*
  `targets` in the manifest lists the outlets a game is meant for. A distribution
  build for a target it does not list is skipped. `proto` is a development target
  and is always available — every game can be prototyped.
*/
function wantsTarget(manifest) {
  if (DEV_TARGET || !manifest || !Array.isArray(manifest.targets)) return true;
  return manifest.targets.includes(target);
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

// The bootstrap ends by calling init(); the handle goes in just before that.
const INIT_CALL = '  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);';

const PROTO_HANDLE = `  /* ---- proto target: the handle packages/devtools reads. Injected by
     tools/build/build.mjs --target=proto, absent from every other target. ---- */
  window.__PROTO__ = {
    CONFIG: CONFIG, Game: Game, Loop: Loop, Round: Round, Input: Input,
    view: view, Layout: Layout, Fx: Fx, Rand: Rand, HUD: HUD, Overlay: Overlay,
    Pop: Pop, Sound: Sound, Music: Music, Beat: Beat, ctx: ctx,
    startGame: startGame, frameUpdate: frameUpdate, frameRender: frameRender,
    state: function () { return State; }
  };

`;

// Runs before any game code, so a seeded run is reproducible end to end.
const PROTO_SEED = `<script>
/* proto: ?seed=<n> replaces Math.random with a seeded LCG, so "frame N" shows
   the same world on every run. No seed in the URL leaves Math.random alone. */
(function () {
  var raw = new URLSearchParams(location.search).get("seed");
  if (raw === null) return;
  var s = (parseInt(raw, 10) || 1) >>> 0;
  Math.random = function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
})();
</script>
`;

function protoDress(html, devCss, devJs) {
  if (!html.includes(INIT_CALL)) throw new Error('bootstrap changed: cannot find the init() call');
  let out = html.replace(INIT_CALL, PROTO_HANDLE + INIT_CALL);

  const head = out.indexOf('<head>') + '<head>'.length;
  if (head < '<head>'.length) throw new Error('page.html: no <head>');
  out = out.slice(0, head) + '\n' + PROTO_SEED + out.slice(head);

  out = out.replace('</style>', '\n/* ---- proto: devtools ---- */\n' + devCss + '\n</style>');

  const close = out.lastIndexOf('</body>');
  if (close < 0) throw new Error('page.html: no </body>');
  return out.slice(0, close) + '<script>\n' + devJs + '</script>\n' + out.slice(close);
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
    console.error('nothing extracted yet — run tools/build/extract.mjs first');
    process.exit(1);
  }

  // proto ships its own layer; load it once for the whole run.
  const dev = DEV_TARGET
    ? { css: await read('packages/devtools/devtools.css'), js: await read('packages/devtools/devtools.js') }
    : null;

  let bad = 0;
  let skipped = [];
  for (const unit of list) {
    const manifest = await manifestOf(unit);
    if (!wantsTarget(manifest)) {
      skipped.push(`${unit.name} (targets: ${manifest.targets.join(' ')})`);
      continue;
    }

    let out = unit.out;
    let html = await buildOne(unit, motor);

    if (DEV_TARGET) {
      if (unit.template) continue;                 // nothing to prototype
      html = protoDress(html, dev.css, dev.js);
      out = path.join('dist', 'proto', unit.name, 'index.html');
      await mkdir(path.join(ROOT, path.dirname(out)), { recursive: true });
      await writeFile(path.join(ROOT, out), html);
      console.log(`proto ${out}  (${(html.length / 1024).toFixed(0)} KB)`);
      continue;
    }

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

  if (skipped.length) console.log(`skipped: ${skipped.join(', ')}`);

  if (DEV_TARGET) {
    console.log(`\nServe one with:  node tools/lab/serve.mjs <slug>`);
    return;
  }

  if (CHECK) {
    const built = list.length - skipped.length;
    if (bad === 0) console.log(`\nAll ${built} units rebuild byte-identically.`);
    else console.log(`\n${bad} of ${built} units differ from their sources.`);
    process.exit(bad ? 1 : 0);
  }
}

main().catch((err) => { console.error('build failed:', err.message); process.exit(1); });
