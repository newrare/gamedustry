#!/usr/bin/env node
/*
  deploy-itch — push a game to itch.io with butler.

    node tools/publish/deploy-itch.mjs --game=vipera                # → html5-dev
    node tools/publish/deploy-itch.mjs --game=vipera --channel=html5
    node tools/publish/deploy-itch.mjs --all --dry-run

  butler is itch.io's own CLI: it talks straight to itch over HTTPS, diffs the
  upload against the previous build of the channel, zips the folder itself and
  is idempotent. This script is the thin wrapper that makes it repeatable —
  it builds the game first, reads the target from the manifest instead of a
  command line nobody remembers, and refuses to push what it has not built.

  What it will NOT do: create or edit the itch page. Title, description, tags,
  screenshots and the embed size have no public API — generate them with
  `node tools/publish/store-meta.mjs --game=<slug>` and paste them in once.

  Auth, in butler's own order of preference:
    `butler login` once locally (credentials land in ~/.config/itch), or
    BUTLER_API_KEY in the environment, which is what CI uses.

  Channels are independent, and a channel whose name contains "html" is what
  marks the build playable in the browser:
    html5-dev   every merge, the one you look at yourself
    html5       the public build, on a tag

  Flags:
    --game=<slug>   one game            --all         every game targeting web
    --channel=<c>   override the channel (default: html5-dev)
    --no-build      push what is already in dist/itch/<slug>
    --dry-run       print the butler command and stop
*/

import { readFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const only = (argv.find((a) => a.startsWith('--game=')) || '').split('=')[1] || null;
const channelArg = (argv.find((a) => a.startsWith('--channel=')) || '').split('=')[1] || null;
const all = argv.includes('--all');
const dryRun = argv.includes('--dry-run');
const noBuild = argv.includes('--no-build');

// The default is the development channel on purpose: pushing the public one is
// a decision, so it has to be typed.
const DEFAULT_CHANNEL = 'html5-dev';

if (!only && !all) {
  console.error('usage: deploy-itch.mjs --game=<slug> | --all   [--channel=html5] [--no-build] [--dry-run]');
  process.exit(1);
}

async function manifestOf(slug) {
  const file = path.join(ROOT, 'games', slug, 'manifest.json');
  if (!existsSync(file)) throw new Error(`${slug}: no manifest.json`);
  return JSON.parse(await readFile(file, 'utf8'));
}

function candidates() {
  if (only) return [only];
  return readdirSync(path.join(ROOT, 'games'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((s) => existsSync(path.join(ROOT, 'games', s, 'manifest.json')))
    .sort();
}

function butlerVersion() {
  const r = spawnSync('butler', ['version'], { encoding: 'utf8' });
  if (r.error) return null;
  return (r.stdout || r.stderr || '').trim().split('\n')[0];
}

/* itch shows this string next to the build. The commit is the only version
   number this repo has, and it is the one that lets a report be traced back to
   a build; a working tree with changes in it is marked, so a build pushed from
   an uncommitted state cannot be mistaken for the commit it says it is. */
function userVersion() {
  try {
    const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim();
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${day}-${sha}${dirty ? '-dirty' : ''}`;
  } catch (e) {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }
}

function buildOne(slug) {
  execFileSync(process.execPath,
    [path.join(ROOT, 'tools', 'build', 'build.mjs'), '--target=web', '--dest=itch', `--game=${slug}`],
    { cwd: ROOT, stdio: 'inherit' });
}

async function main() {
  const version = userVersion();
  const butler = butlerVersion();

  if (!butler && !dryRun) {
    console.error('butler is not on PATH. Install it from https://itch.io/docs/butler/ and run `butler login`,');
    console.error('or re-run with --dry-run to see the command this would have run.');
    process.exit(1);
  }
  if (butler) console.log(`${butler}   userversion ${version}`);

  const pushed = [];
  const skipped = [];

  for (const slug of candidates()) {
    const m = await manifestOf(slug);

    // Same rule as the builder: a game ships to an outlet its manifest claims.
    if (Array.isArray(m.targets) && !m.targets.includes('web')) {
      skipped.push(`${slug} (targets: ${m.targets.join(' ')})`);
      continue;
    }
    const itch = m.itch || {};
    if (!itch.user || !itch.project) {
      skipped.push(`${slug} (no itch.user / itch.project in the manifest)`);
      continue;
    }

    const dir = path.join('dist', 'itch', slug);
    if (!noBuild) buildOne(slug);
    if (!existsSync(path.join(ROOT, dir, 'index.html'))) {
      skipped.push(`${slug} (nothing built in ${dir})`);
      continue;
    }

    const channel = channelArg || DEFAULT_CHANNEL;
    const spec = `${itch.user}/${itch.project}:${channel}`;
    const args = [dir, spec, '--userversion', version];

    if (dryRun) {
      console.log(`dry-run  butler push ${args.join(' ')}`);
      pushed.push(slug);
      continue;
    }

    console.log(`push     ${dir} → ${spec}`);
    const r = spawnSync('butler', ['push', ...args], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) {
      console.error(`butler push failed for ${slug} (exit ${r.status})`);
      process.exit(r.status || 1);
    }
    pushed.push(slug);
  }

  console.log(`\n${dryRun ? 'would push' : 'pushed'}: ${pushed.join(' ') || 'nothing'}`);
  if (skipped.length) console.log(`skipped: ${skipped.join(', ')}`);
  if (!dryRun && pushed.length) {
    console.log('\nThe page itself is not touched by butler:');
    console.log('  node tools/publish/store-meta.mjs --game=<slug>');
  }
}

main().catch((err) => { console.error('deploy-itch failed:', err.message); process.exit(1); });
