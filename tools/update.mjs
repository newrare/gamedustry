#!/usr/bin/env node
/*
  update — the one command to run after changing anything in this repo.

    node tools/update.mjs                 # everything
    node tools/update.mjs vipera radiam   # report scoped to two games

  Why it exists: a change to a game touches four generated things — the
  playable artifact, the web build, the two catalogues — and then a handful of
  outlets that each need a different action, some of which no script may take
  on its own (pushing to itch, pasting copy into a form, uploading an image).
  Forgetting one is silent: the site keeps serving the old card, or itch keeps
  serving the old build, and nothing says so.

  So this does every step that is safe to do unattended, verifies it, and then
  prints what is left with the exact command for each — derived from what
  actually changed in git, not from a checklist to read.

  What it will NEVER do, by design:
    - push to itch, or anywhere else outward-facing. `deploy-itch.mjs` is one
      command and it is a decision.
    - reshoot screenshots or covers. Two minutes of headless Chrome per game,
      and only a human knows whether the look changed.
    - commit, or touch a branch.
*/

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const only = argv.filter((a) => !a.startsWith('--'));

const ALL = readdirSync(path.join(ROOT, 'games'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(path.join(ROOT, 'games', d.name, 'manifest.json')))
  .map((d) => d.name)
  .sort();

const unknown = only.filter((s) => !ALL.includes(s));
if (unknown.length) {
  console.error(`no such game: ${unknown.join(', ')}`);
  process.exit(2);
}

// --- the steps that run --------------------------------------------------

let failed = 0;

function step(label, args) {
  const r = spawnSync(process.execPath, args.map((a) => (a.startsWith('--') ? a : path.join(ROOT, a))), {
    cwd: ROOT, encoding: 'utf8'
  });
  const out = ((r.stdout || '') + (r.stderr || '')).trimEnd();
  if (r.status === 0) {
    console.log(`  ok    ${label}`);
    return out;
  }
  failed++;
  console.log(`  FAIL  ${label}`);
  console.log(out.split('\n').map((l) => '        ' + l).join('\n'));
  return out;
}

console.log('build');
step('playables and web sources', ['tools/build/build.mjs']);
step('site/games.js and the root gallery', ['tools/build/gen-catalogues.mjs']);

console.log('verify');
step('artifacts match their sources', ['tools/build/build.mjs', '--check']);
step('catalogues are up to date', ['tools/build/gen-catalogues.mjs', '--check']);
step('creatives are within budget', ['tools/build/check-size.mjs']);

// --- what changed, and therefore what is left ----------------------------

/* The working tree is "what you just did". Once it is committed there is
   nothing there to read, so fall back to the last commit — which is what a
   run right after `git commit` should report on. */
function changedPaths() {
  try {
    const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n').map((l) => l.slice(3).trim()).filter(Boolean);
    if (dirty.length) return { where: 'the working tree', paths: dirty };
    const last = execFileSync('git', ['diff', '--name-only', 'HEAD~1..HEAD'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n').map((l) => l.trim()).filter(Boolean);
    return { where: 'the last commit', paths: last };
  } catch (e) {
    return { where: null, paths: [] };
  }
}

const { where, paths } = changedPaths();

// Which games a change reaches. A packages/ change reaches all of them.
const motorTouched = paths.some((p) => p.startsWith('packages/'));
const touched = new Set(motorTouched ? ALL : []);
for (const p of paths) {
  const m = /^games\/([^/]+)\//.exec(p);
  if (m && ALL.includes(m[1])) touched.add(m[1]);
}
const games = [...touched].filter((s) => !only.length || only.includes(s)).sort();

// A manifest change can rewrite the itch form; a source change cannot.
const manifests = paths
  .map((p) => /^games\/([^/]+)\/manifest\.json$/.exec(p))
  .filter(Boolean).map((m) => m[1])
  .filter((s) => !only.length || only.includes(s));

const imagesTouched = paths.some((p) => /^assets\/image\/(screen|itch|google|icon)\//.test(p));
const siteTouched = paths.some((p) => p.startsWith('site/'));

/* A game is on itch only once its page exists, and the repo does not know
   which pages do. `itch.project` is the intent; the page is a human step, so
   the line is phrased as a reminder rather than an instruction. */
function itchProject(slug) {
  try {
    const m = JSON.parse(execFileSync('cat', [path.join(ROOT, 'games', slug, 'manifest.json')], { encoding: 'utf8' }));
    const i = m.itch || {};
    return `${i.user || 'newrare'}/${i.project || slug}`;
  } catch (e) {
    return slug;
  }
}

console.log('');
if (!where) {
  console.log('git said nothing, so there is no change to reason about.');
} else if (!paths.length) {
  console.log(`nothing changed in ${where}.`);
} else {
  console.log(`changed in ${where}: ${paths.length} file${paths.length > 1 ? 's' : ''}`
    + (games.length ? `, reaching ${games.join(' ')}` : '')
    + (motorTouched ? '  (packages/ — every game)' : ''));

  const left = [];

  if (games.length) {
    left.push([
      'push the new build to itch, per game — outward-facing, so never automatic:',
      ...games.map((s) => `    node tools/publish/deploy-itch.mjs --game=${s}      # → ${itchProject(s)}:html5`),
      '  Commit first: the build is stamped with the commit, and an uncommitted',
      '  tree ships as -dirty, which traces back to nothing.'
    ].join('\n'));
  }

  if (games.length) {
    left.push([
      'if the game LOOKS different, reshoot its images — nothing here can tell:',
      ...games.map((s) => `    node tools/lab/shoot-screens.mjs ${s} && node tools/lab/shoot-store.mjs ${s}`),
      '  shoot-store rebuilds the listing images out of the fresh captures — the',
      '  phone gallery, the two desk pictures and the itch cover, in both languages.',
      '  Then upload them on the itch page; there is no API for the gallery.'
    ].join('\n'));
  }

  if (manifests.length) {
    left.push([
      'a manifest changed, so the itch form may be stale. Print it and paste the',
      'fields that moved — title, tagline, description, tags, the disclosure:',
      ...manifests.map((s) => `    node tools/publish/store-meta.mjs --game=${s}`)
    ].join('\n'));
  }

  if (imagesTouched) {
    left.push('assets/ images changed: the site picks them up on its next build, itch does not — re-upload them on the page.');
  }

  if (siteTouched || games.length) {
    left.push('the site follows from git: push to main and Vercel redeploys it with every game.');
  }

  if (left.length) {
    console.log('\nleft to do:');
    left.forEach((l, i) => console.log(`  ${i + 1}. ${l}`));
  }
}

console.log('');
if (failed) {
  console.log(`${failed} step${failed > 1 ? 's' : ''} failed — fix that before anything else.`);
  process.exit(1);
}
console.log('all generated files are current.');
