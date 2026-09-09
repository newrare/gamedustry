#!/usr/bin/env node
/*
  build — assemble a game from the motor plus the game's own sources.

    node tools/build/build.mjs                          # every game, --target=playable
    node tools/build/build.mjs --game=vipera
    node tools/build/build.mjs --check                  # assert the output is unchanged
    node tools/build/build.mjs --target=playable --game=vipera

  Targets:
    playable   the single self-contained games/<slug>/index.html ad networks get
    web        the same game for the newrare site and itch — see --target=web below

  A game's manifest lists the targets it is meant for; a build for a target the
  manifest does not list is skipped and reported.

  --check builds in memory and compares against the committed index.html. A
  non-empty diff means the sources and the artifact disagree: that is the
  acceptance test of the extraction, and the CI gate.

  Inputs:
    packages/shell/motor.css        packages/shell/script-open.js
    packages/engine/engine.js       packages/platform/<mraid|web>.js
    packages/shell/shell.js         packages/engine/bootstrap.js
    packages/shell/script-close.js
    games/<slug>/page.html          {{MOTOR_CSS}} {{SKIN_CSS}} {{SCRIPT}}
    games/<slug>/skin.css           games/<slug>/game.js
    games/<slug>/manifest.json      slug, targets, title…

  --target=web builds the same motor and the same game with the ad glue swapped
  and a menu added, and nothing forked —

    packages/platform/web.js replaces packages/platform/mraid.js as section 4,
      so there is no MRAID, no store link, and the CTA bar's band goes back to
      the play area
    packages/frame-web/frame.css after the motor stylesheet: the dressing that
      fills the empty bands around a portrait game on a desktop screen
    window.__WEB__ in the bootstrap, the handle packages/webshell reads
    packages/webshell/{menu.css, menu.js} after the motor: the intro becomes a
      menu (PLAY / LEADERBOARD / OPTIONS / HELP) and the how-to-play demo moves
      into the Help panel
    CONFIG.web from the manifest's own `web` block, which is where a game
      translates the menu (see packages/webshell/menu.js)

  …and it has two destinations, because the two outlets want opposite things:

    --dest=site (default)  dist/web/ — the motor is ONE hashed file shared by
      every game, and the assets are files instead of base64. The second game a
      visitor opens re-downloads neither. This is what tools/build/build-site.mjs
      ships.
    --dest=itch            dist/itch/<slug>/index.html — one self-contained file
      again: an itch project is uploaded on its own, so it has nobody to share a
      cache with, and a single file is the least that can go wrong in their
      sandbox. Push it with tools/publish/deploy-itch.mjs.

  Iterate on a game with `node tools/lab/serve-site.mjs`: it runs the site build
  and serves it with reload on save, so what you play locally is the web build
  the site ships.
*/

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitGameJs } from '../lib/parts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const target = (argv.find((a) => a.startsWith('--target=')) || '--target=playable').split('=')[1];
const dest = (argv.find((a) => a.startsWith('--dest=')) || '--dest=site').split('=')[1];
const only = (argv.find((a) => a.startsWith('--game=')) || '').split('=')[1] || null;

const TARGETS = ['playable', 'web'];
if (!TARGETS.includes(target)) {
  console.error(`--target=${target} is not implemented (have: ${TARGETS.join(', ')}). See docs/INDUSTRIALIZATION.md.`);
  process.exit(1);
}

const DESTS = ['site', 'itch'];
if (!DESTS.includes(dest)) {
  console.error(`--dest=${dest} is not implemented (have: ${DESTS.join(', ')}).`);
  process.exit(1);
}
if (dest !== 'site' && target !== 'web') {
  console.error(`--dest is only meaningful with --target=web.`);
  process.exit(1);
}

// The web build writes under dist/, never over the committed artifacts.
const DIST_TARGET = target === 'web';

/* The site gets the split build (one shared motor, assets as files); every
   other output is one self-contained document. */
const SPLIT = target === 'web' && dest === 'site';
const OUT_DIR = dest === 'itch' ? 'dist/itch' : 'dist/web';

const read = (rel) => readFile(path.join(ROOT, rel), 'utf8');
const readBin = (rel) => readFile(path.join(ROOT, rel));
const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);

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
  `targets` in the manifest lists the outlets a game is meant for. A build for a
  target it does not list is skipped and reported.
*/
function wantsTarget(manifest) {
  if (!manifest || !Array.isArray(manifest.targets)) return true;
  return manifest.targets.includes(target);
}

/*
  Section 4 is the one region that is chosen by the target rather than shared:
  a playable talks to MRAID, a web build talks to the page. Same interface, so
  the shell and the bootstrap above and below it never change.
*/
const PLATFORM = target === 'web' ? 'packages/platform/web.js' : 'packages/platform/mraid.js';

async function loadMotor() {
  const [motorCss, scriptOpen, engine, platform, shell, bootstrap, scriptClose] = await Promise.all([
    read('packages/shell/motor.css'),
    read('packages/shell/script-open.js'),
    read('packages/engine/engine.js'),
    read(PLATFORM),
    read('packages/shell/shell.js'),
    read('packages/engine/bootstrap.js'),
    read('packages/shell/script-close.js')
  ]);

  /* Delta 1 — the desktop dressing rides with the motor stylesheet, before the
     SKIN, so a game can still override any of it. Web target only: a playable
     always fills its ad container, so it has no empty band to dress. */
  const frame = target === 'web' ? await read('packages/frame-web/frame.css') : '';

  return {
    motorCss: frame ? motorCss + '\n' + frame : motorCss,
    scriptOpen, engine, platform, shell, bootstrap, scriptClose
  };
}

// The bootstrap ends by calling init(); the handle goes in just before that.
const INIT_CALL = '  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);';

const WEB_HANDLE = `  /* ---- web target: the handle packages/webshell reads. Injected by
     tools/build/build.mjs --target=web, absent from every other target.

     It is a plain list of references, never behaviour: the menu, the panels
     and the settings live in packages/webshell, so what the web front end
     does can change without touching the motor or this builder. ---- */
  window.__WEB__ = {
    CONFIG: CONFIG, ASSETS: ASSETS,
    Store: Store, Sound: Sound, Music: Music, Pop: Pop,
    Fx: Fx, Overlay: Overlay, Beat: Beat, Game: Game, Round: Round, Loop: Loop,
    start: startGame, setState: setState, onState: onState,
    state: function () { return State; },
    render: frameRender,
    clearWorld: function () { ctx.clearRect(0, 0, view.w, view.h); }
  };

`;

function withWebHandle(bootstrap) {
  if (!bootstrap.includes(INIT_CALL)) throw new Error('bootstrap changed: cannot find the init() call');
  return bootstrap.replace(INIT_CALL, WEB_HANDLE + INIT_CALL);
}

/*
  THE GAME'S TYPEFACE — web target only.

  A game names one family of assets/font/ in its manifest (`web.font`), and the
  builder puts the face in front of its SKIN, so what follows can override any
  of it. Every family in the pack is OFL 1.1 and is EMBEDDED, never fetched:
  base64 in the single-file build, a file next to the other assets in the split
  one. A playable ships no font at all — the pack belongs to the web front end.

  Two tokens travel with the face, and packages/webshell/menu.css reads them:

    --web-font   the family, with its system fallback stack
    --web-fw     the weight to use where the design wants a heavy face. A
                 single-weight family keeps 400: asking a 400-only face for 900
                 makes the browser synthesize the bold, which smears a face
                 that is already fat.
*/
let FONT_PACK = null;

async function fontPack() {
  if (!FONT_PACK) FONT_PACK = JSON.parse(await read('assets/font/fonts.json'));
  return FONT_PACK;
}

function fontFaceCss(f, src) {
  return `  /* ---- web target: the game's typeface, from assets/font/${f.file}.
     SIL Open Font License 1.1 — the licence travels in
     assets/font/${f.licence}. Embedded, never fetched: a game still works
     over file:// and inside a sandboxed iframe.
     These are DEFAULTS — they sit before the SKIN, which can override them. ---- */
  @font-face {
    font-family:"${f.family}";
    src:url(${src}) format("woff2");
    font-weight:${f.variable ? '400 900' : '400'};
    font-style:normal;
    font-display:block;
  }
  :root { --web-font:"${f.family}", ${f.stack}; --web-fw:${f.heavy}; }
  #frame { font-family:var(--web-font); }
  /* the places the motor asks for the heaviest weight it can get */
  #intro-title, #hud-score, .hud-pill, .eo-title, .eo-score, .btn {
    font-weight:var(--web-fw);
  }

`;
}

/*
  Returns the CSS to prepend to the SKIN and, for the split build, the woff2 to
  write next to the game's other assets. `mode` is "file" there and "inline"
  for every self-contained document.
*/
async function gameFont(manifest, mode) {
  const key = manifest && manifest.web && manifest.web.font;
  if (!key) return { css: '', file: null };
  const pack = await fontPack();
  const f = pack[key];
  if (!f) throw new Error(`${manifest.slug}: web.font "${key}" is not in assets/font/fonts.json`);
  const buf = await readBin('assets/font/' + f.file);
  if (mode === 'file') {
    const name = `${key}.${hash(buf)}.woff2`;
    return { css: fontFaceCss(f, `assets/${name}`), file: { name, buf } };
  }
  return { css: fontFaceCss(f, `data:font/woff2;base64,${buf.toString('base64')}`), file: null };
}

/*
  THE GAME'S PAINTED ARTWORK — CONFIG.art.

  `assets/art/` holds the shipping cut of the artwork: WebP, sized for the
  720x1280 design space, written by `tools/lab/encode-art.mjs` out of the
  masters in `assets/image/` (which are 2 MB PNGs and ship nowhere). The build
  reads what is there and embeds it; it never encodes, so it stays fast.

  A FILE NAME IS THE WHOLE DECLARATION. `assets/art/<slug>-<role>.webp` becomes
  `CONFIG.art.<camelRole>`, so adding a picture to a game is adding a file and
  nothing else — no manifest key, no ASSETS edit, no list to keep in sync
  thirteen times. The roles the motor knows are documented in encode-art.mjs;
  anything else rides along for the game itself to use, which is how slipdeck's
  three court-card illustrations arrive without a special case.

  It is CONFIG rather than ASSETS for one concrete reason: the split site build
  externalizes data URIs out of the config region into hashed files
  (see externalizeAssets), so the same source gets base64 in a playable and a
  cacheable .webp on the site, with nothing target-aware in the art itself.

  `background-desk` is the one exception, and it is skipped outside the web
  target: it dresses the empty bands around the frame on a desktop window,
  which only exist on the web (packages/frame-web/frame.css). A playable runs
  in a fixed ad iframe and would carry 30 KB it can never show — the same
  reason a playable ships no font.
*/
const ART_DIR = 'assets/art';
const WEB_ONLY_ART = ['background-desk'];

function camel(role) {
  return role.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
}

async function gameArt(slug, forWeb) {
  const dir = path.join(ROOT, ART_DIR);
  if (!slug || !existsSync(dir)) return '';

  const prefix = slug + '-';
  const roles = readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.webp'))
    .map((f) => f.slice(prefix.length, -'.webp'.length))
    .filter((role) => forWeb || !WEB_ONLY_ART.includes(role))
    .sort();
  if (!roles.length) return '';

  const entries = [];
  for (const role of roles) {
    const buf = await readBin(path.join(ART_DIR, prefix + role + '.webp'));
    entries.push(`    ${camel(role)}: "data:image/webp;base64,${buf.toString('base64')}"`);
  }

  return `
  /* ---- the game's painted artwork, from assets/art/${prefix}*.webp.
     Injected by tools/build/build.mjs; re-encode it with
     tools/lab/encode-art.mjs. The shell reads background-phone, title and the
     three character faces; packages/platform/web.js reads background-desk. ---- */
  CONFIG.art = (function (into, from) {
    into = into || {};
    for (var k in from) if (from.hasOwnProperty(k)) into[k] = from[k];
    return into;
  })(CONFIG.art, {
${entries.join(',\n')}
  });

`;
}

/*
  The manifest's `web` block, handed to the page as CONFIG.web. It is what
  packages/webshell reads for its wording (`copy`, one flat set or one per
  language) and its default language (`lang`) — so a game is translated in the
  manifest, next to the site copy, and never in a second place.
*/
function webConfigJs(manifest) {
  const web = manifest && manifest.web;
  if (!web || typeof web !== 'object') return '';
  return `
  /* ---- web target: the manifest's own web block. Injected by
     tools/build/build.mjs --target=web; packages/webshell reads it. ---- */
  CONFIG.web = (function (into, from) {
    into = into || {};
    for (var k in from) if (from.hasOwnProperty(k)) into[k] = from[k];
    return into;
  })(CONFIG.web, ${JSON.stringify(web, null, 2).split('\n').join('\n  ')});

`;
}

function webDress(html, menuCss, menuJs) {
  let out = withWebHandle(html);
  out = out.replace('</style>', '\n/* ---- web: menu ---- */\n' + menuCss + '\n</style>');

  const close = out.lastIndexOf('</body>');
  if (close < 0) throw new Error('page.html: no </body>');
  return out.slice(0, close) + '<script>\n' + menuJs + '</script>\n' + out.slice(close);
}

async function sourcesOf(unit) {
  const dir = unit.dir;
  const [page, skin, gameJs] = await Promise.all([
    read(path.join(dir, 'page.html')),
    read(path.join(dir, 'skin.css')),
    read(path.join(dir, 'game.js'))
  ]);
  for (const token of ['{{MOTOR_CSS}}', '{{SKIN_CSS}}', '{{SCRIPT}}']) {
    if (!page.includes(token)) throw new Error(`${dir}/page.html: missing ${token}`);
  }
  const { config, game } = splitGameJs(gameJs, `${dir}/game.js`);
  return { page, skin, config, game };
}

function assemble(src, motor, webCfg) {
  // The motor sits between the game's own two halves: CONFIG and ASSETS are read
  // by the engine, and section 6 calls into the shell the engine set up.
  const script = motor.scriptOpen + src.config + webCfg + motor.engine + motor.platform +
                 motor.shell + src.game + motor.bootstrap + motor.scriptClose;

  return src.page
    .replace('{{MOTOR_CSS}}', () => motor.motorCss)
    .replace('{{SKIN_CSS}}', () => src.skin)
    .replace('{{SCRIPT}}', () => script);
}

/* ── the split web build ──────────────────────────────────────────────────

   Everything above ships one document. The site ships a folder, for one
   reason: the motor is the same ~110 KB in every game, and a visitor who
   opens a second game should not download it twice.

   The four scripts are the very sections the single file concatenates, in the
   very same order — they simply run at global scope instead of inside one
   IIFE, which is the only difference between the two builds and the reason a
   game needs no change to be split:

     <slug>/config.<h>.js   sections 1 + 2 — CONFIG and ASSETS
     engine.<h>.js          sections 3 + 4 + 5 — the motor            (shared)
     <slug>/game.<h>.js     section 6 — the game
     boot.<h>.js            section 7 + the web handle + the menu     (shared)

   The stylesheets keep the single file's cascade exactly: motor + frame-web
   first, then the game's SKIN inline, then the menu.
   ------------------------------------------------------------------------- */

const STRICT = '"use strict";\n';

// The file extension for an embedded asset's MIME type. An unknown type is a
// build error, not a guess: a wrong extension is served with a wrong header.
const ASSET_EXT = {
  'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/ogg': 'ogg',
  'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/webm': 'weba',
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/svg+xml': 'svg', 'font/woff2': 'woff2'
};

// `key: "data:<mime>;base64,<data>"` — the shape every ASSETS entry has. The
// key is captured only to name the file readably; the hash is what makes the
// name unique and immutably cacheable.
const DATA_URI = /((?:"?([A-Za-z0-9_$-]+)"?\s*:\s*)?)"data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/=]+)"/g;

function externalizeAssets(js, where) {
  const files = new Map();
  const out = js.replace(DATA_URI, (m, pre, key, mime, b64) => {
    const ext = ASSET_EXT[mime];
    if (!ext) throw new Error(`${where}: no file extension known for "${mime}" — add it to ASSET_EXT`);
    const buf = Buffer.from(b64, 'base64');
    const name = `${key || 'asset'}.${hash(buf)}.${ext}`;
    files.set(name, buf);
    return `${pre}"assets/${name}"`;
  });

  /* A `"data:` left in the text is either an asset the pattern above missed —
     which would ship a base64 blob inside the JS and defeat the whole split —
     or a placeholder in a comment: a game documents a clip it does not embed
     with `// pop: "data:audio/mpeg;base64,SUQz…"`. The payload length tells
     them apart, an asset being thousands of characters long. */
  const left = /"data:[^"]{200,}"/.exec(out);
  if (left) throw new Error(`${where}: a data URI survived the split — ${left[0].slice(0, 60)}…`);
  return { js: out, files };
}

function splitPage(page, skin, refs) {
  if (page.split('<style>').length !== 2) throw new Error('page.html: expected exactly one <style> block');

  let html = page
    .replace('{{MOTOR_CSS}}', '')
    .replace('{{SKIN_CSS}}', () => skin)
    .replace('<style>', `<link rel="stylesheet" href="${refs.engineCss}">\n<style>`)
    .replace('</style>', `</style>\n<link rel="stylesheet" href="${refs.menuCss}">`);

  const tags = [refs.configJs, refs.engineJs, refs.gameJs, refs.bootJs]
    .map((src) => `<script src="${src}"></script>`)
    .join('\n');

  // script-close.js closes the document in the single-file build; here the
  // tail is ours, so it has to close it too.
  return html.replace('{{SCRIPT}}', () => tags + '\n</body>\n</html>\n');
}

/*
  The shared half of the split build, hashed by content: the same bytes for
  every game in the run, written once, cached forever by the visitor.
*/
function sharedFiles(motor, web) {
  const engineCss = motor.motorCss;
  const menuCss = web.css;
  const engineJs = STRICT + motor.engine + motor.platform + motor.shell;
  const bootJs = STRICT + withWebHandle(motor.bootstrap) + '\n' + web.js;

  return {
    'engine.css': { body: engineCss, name: `engine.${hash(engineCss)}.css` },
    'menu.css':   { body: menuCss,   name: `menu.${hash(menuCss)}.css` },
    'engine.js':  { body: engineJs,  name: `engine.${hash(engineJs)}.js` },
    'boot.js':    { body: bootJs,    name: `boot.${hash(bootJs)}.js` }
  };
}

async function writeSplit(unit, src, webCfg, shared, font) {
  const dir = path.join(OUT_DIR, unit.name);
  const abs = path.join(ROOT, dir);

  const { js: configJs, files } = externalizeAssets(src.config + webCfg, `${unit.dir}/game.js`);
  const configBody = STRICT + configJs;
  const gameBody = STRICT + src.game;
  const configName = `config.${hash(configBody)}.js`;
  const gameName = `game.${hash(gameBody)}.js`;

  const html = splitPage(src.page, src.skin, {
    engineCss: '../' + shared['engine.css'].name,
    menuCss: '../' + shared['menu.css'].name,
    engineJs: '../' + shared['engine.js'].name,
    bootJs: '../' + shared['boot.js'].name,
    configJs: configName,
    gameJs: gameName
  });

  await mkdir(path.join(abs, 'assets'), { recursive: true });
  await writeFile(path.join(abs, 'index.html'), html);
  await writeFile(path.join(abs, configName), configBody);
  await writeFile(path.join(abs, gameName), gameBody);
  for (const [name, buf] of files) await writeFile(path.join(abs, 'assets', name), buf);
  if (font && font.file) await writeFile(path.join(abs, 'assets', font.file.name), font.file.buf);

  const bytes = html.length + configBody.length + gameBody.length +
                [...files.values()].reduce((n, b) => n + b.length, 0) +
                (font && font.file ? font.file.buf.length : 0);
  return { dir, bytes, assets: files.size + (font && font.file ? 1 : 0) };
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

  // the web target ships a layer of its own; load it once for the run.
  const web = target === 'web'
    ? { css: await read('packages/webshell/menu.css'), js: await read('packages/webshell/menu.js') }
    : null;

  // The split build shares its motor between games, so the folder is rebuilt
  // whole: a stale engine.<hash>.js nobody links is worse than a slow build.
  const shared = SPLIT ? sharedFiles(motor, web) : null;
  if (SPLIT && !only) await rm(path.join(ROOT, OUT_DIR), { recursive: true, force: true, maxRetries: 5 });
  if (SPLIT) {
    await mkdir(path.join(ROOT, OUT_DIR), { recursive: true });
    for (const part of Object.values(shared)) {
      await writeFile(path.join(ROOT, OUT_DIR, part.name), part.body);
    }
  }

  let bad = 0;
  let skipped = [];
  for (const unit of list) {
    const manifest = await manifestOf(unit);
    if (!wantsTarget(manifest)) {
      skipped.push(`${unit.name} (targets: ${manifest.targets.join(' ')})`);
      continue;
    }
    if (DIST_TARGET && unit.template) continue;      // the template ships nowhere

    const src = await sourcesOf(unit);

    /* Both of these are appended to the game's own CONFIG/ASSETS half, so they
       are read by the engine on the same pass as the rest of it, and the split
       build externalizes their assets along with the game's own. The artwork
       goes to every target (minus the desk background, which is web-only); the
       manifest's web block only to the web. The template is a build unit with
       no slug, so it gets neither. */
    const artCfg = await gameArt(unit.template ? null : unit.name, target === 'web');
    const webCfg = artCfg + (target === 'web' ? webConfigJs(manifest) : '');

    /* The typeface is a web-target default, so it goes in front of the SKIN
       rather than into the shared stylesheet: one family per game, and the
       game keeps the last word on every rule it brings. */
    const font = target === 'web'
      ? await gameFont(manifest, SPLIT ? 'file' : 'inline')
      : { css: '', file: null };
    if (font.css) src.skin = font.css + src.skin;

    if (SPLIT) {
      const w = await writeSplit(unit, src, webCfg, shared, font);
      console.log(`web   ${w.dir}/  (${(w.bytes / 1024).toFixed(0)} KB, ${w.assets} assets)`);
      continue;
    }

    let out = unit.out;
    let html = assemble(src, motor, webCfg);

    // The web build is dressed with the menu and written under dist/.
    if (DIST_TARGET) {
      html = webDress(html, web.css, web.js);
      out = path.join(OUT_DIR, unit.name, 'index.html');
      await mkdir(path.join(ROOT, path.dirname(out)), { recursive: true });
      await writeFile(path.join(ROOT, out), html);
      console.log(`${target} ${out}  (${(html.length / 1024).toFixed(0)} KB)`);
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

  if (SPLIT) {
    const names = Object.values(shared).map((p) => p.name).join(' ');
    console.log(`shared: ${names}`);
    console.log(`\nServe the site with:  node tools/lab/serve-site.mjs`);
    return;
  }
  if (DIST_TARGET) {
    if (dest === 'itch') console.log(`\nPush one with:  node tools/publish/deploy-itch.mjs --game=<slug>`);
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
