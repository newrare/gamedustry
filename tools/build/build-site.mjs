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
    6. writes every page TWICE, once per language, at an address of its own:
       /… in English and /fr/… in French. Every data-fr / data-en node gets
       its text and #gamesGrid gets its cards, written by the page's own
       gameCard() — so a crawler that runs no script reads the whole site in
       both languages, and script.js simply rewrites the same nodes on load
    7. writes each game's GUIDE as a page — /guide/<slug>, /fr/guide/<slug> —
       from assets/guide/<slug>/, which tools/build/gen-guides.mjs reads out of
       the game itself (tools/build/site-guide.mjs): not a word of it is
       written for the site
    8. gives every page its <head> — canonical, hreflang, the share card, the
       structured data — and writes sitemap.xml and robots.txt

  Games are read from site/games.js. A game marked `draft: true` is held back on
  purpose; a game with no icon in assets/image/icon/thumb/ is dropped and reported as a
  problem.

  This is the Vercel build command. Output is gitignored.
*/

import { readFile, writeFile, mkdir, rm, cp, readdir, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromeOf, guidePage, guideIndex, readGuide } from './site-guide.mjs';
import { stampOf } from './gen-guides.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = path.join(ROOT, 'site');
const OUT = path.join(ROOT, 'dist', 'site');

/* Where the site lives. Every canonical, every hreflang and the sitemap are
   absolute, so they name the production address whatever is building — a
   Vercel preview must not claim to be the canonical copy of anything. */
const SITE_URL = (process.env.SITE_URL || 'https://newrare.app').replace(/\/+$/, '');
const LANGS = ['en', 'fr'];

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
  const dir = path.join(ROOT, 'assets', 'image', 'screen');
  if (!existsSync(dir)) return [];
  const all = await readdir(dir);
  return all
    .filter((f) => f.startsWith(slug + '-') && f.endsWith('.jpg'))
    .sort();
}

/* ── pages, routes and addresses ─────────────────────────────────────────

   A page is named by its ROUTE — '' the home, 'privacy', 'guide',
   'guide/<slug>' — and exists once per language. English is the default and
   sits at the root; French is the same tree under /fr:

     route            en                      fr
     ''               /                       /fr
     'privacy'        /privacy                /fr/privacy
     'guide/vipera'   /guide/vipera           /fr/guide/vipera

   No trailing slash and no .html: that is what vercel.json serves
   (`trailingSlash: false`, and a rewrite per standing page), so it is what a
   canonical, a link and the sitemap must say — a link to /fr/ would be a
   redirect on every click. */
function pathOf(route, lang) {
  return ((lang === 'fr' ? '/fr' : '') + (route ? '/' + route : '')) || '/';
}

/* Absolute. With no language it is a plain file of the site (an image). */
function urlOf(route, lang) {
  return SITE_URL + pathOf(route, lang);
}

function fileOf(route, lang) {
  const file = route === '' ? 'index.html' : /^guide(\/|$)/.test(route) ? route + '/index.html' : route + '.html';
  return (lang === 'fr' ? 'fr/' : '') + file;
}

/* The way back to the root from a file, for everything a page loads. */
function rootOf(file) {
  return '../'.repeat(file.split('/').length - 1);
}

/* The text of one language, written into the markup. `data-fr` / `data-en`
   stay the one source: an EMPTY node is filled with its text, a <meta> gets
   it as `content`, and <title> — the one node a hand-written page fills in
   English so the raw file has a name — is replaced. script.js rewrites the
   same nodes on load. */
function fillLang(html, lang) {
  const attr = new RegExp('\\bdata-' + lang + '="([^"]*)"');
  html = html.replace(/(<([a-z0-9]+)\b[^>]*\bdata-(?:fr|en)="[^"]*"[^>]*>)(<\/\2>)/gi,
    (all, open, tag, close) => { const m = attr.exec(open); return m ? open + m[1] + close : all; });
  html = html.replace(/(<title\b[^>]*\bdata-(?:fr|en)="[^"]*"[^>]*>)[^<]*(<\/title>)/i,
    (all, open, close) => { const m = attr.exec(open); return m ? open + m[1] + close : all; });
  html = html.replace(/<meta\b[^>]*\bdata-(?:fr|en)="[^"]*"[^>]*>/gi, (tag) => {
    const m = attr.exec(tag);
    if (!m) return tag;
    return /\bcontent="/.test(tag)
      ? tag.replace(/\bcontent="[^"]*"/, 'content="' + m[1] + '"')
      : tag.replace(/>$/, ' content="' + m[1] + '">');
  });
  return html;
}

/* A hand-written page links another by FILE (`index.html#studio`,
   `privacy.html`), which is what lets site/ be opened as a folder. The built
   page links it by its address in this page's language. */
function relink(html, lang) {
  return html.replace(/\bhref="(index\.html|privacy\.html|guide\/index\.html|guide\/([a-z0-9-]+)\/index\.html)(#[^"]*)?"/g,
    (all, file, slug, hash) => {
      const route = file === 'index.html' ? '' : file === 'privacy.html' ? 'privacy' : slug ? 'guide/' + slug : 'guide';
      return 'href="' + pathOf(route, lang) + (hash || '') + '"';
    });
}

/* Everything else a page names — its stylesheet, its scripts, its images, a
   game's build — is relative to the root of the site, and a page that is not
   at the root is given the way back. Relative on purpose: /guide/vipera and
   /guide/vipera/ then load the same files, and so does a file:// copy. */
function reroot(html, root) {
  if (!root) return html;
  return html.replace(/(\s)(href|src)="(?!#|\/|[a-z][a-z0-9+.-]*:)(?:\.\/)?([^"]+)"/gi,
    (all, sp, attr, value) => sp + attr + '="' + root + value + '"');
}

/* A VISITOR IS SENT TO THEIR LANGUAGE BEFORE THE PAGE PAINTS, by this one
   line in the <head>: someone who chose French with the toggle (script.js
   remembers it), or whose browser asks for French and who chose nothing, is
   moved from the English page to its French twin; someone who chose English
   is moved off a French one. A crawler has no saved choice and asks for
   English, so it is never moved and reads each address as it is — which is
   the whole point of giving French an address. */
function redirectScript(route, lang) {
  const other = lang === 'fr' ? 'en' : 'fr';
  const cond = lang === 'fr' ? 's==="en"' : 's==="fr"||(!s&&b)';
  return '<script>(function(){try{var s=localStorage.getItem("newrare.lang"),' +
    'b=(navigator.language||"").toLowerCase().indexOf("fr")===0;' +
    'if(' + cond + ')location.replace(' + JSON.stringify(pathOf(route, other)) + '+location.search+location.hash)}catch(e){}})();</script>';
}

function headBlock({ route, lang, image, jsonld }) {
  const other = lang === 'fr' ? 'en' : 'fr';
  const lines = [
    `<link rel="canonical" href="${urlOf(route, lang)}">`,
    `<link rel="alternate" hreflang="en" href="${urlOf(route, 'en')}">`,
    `<link rel="alternate" hreflang="fr" href="${urlOf(route, 'fr')}">`,
    `<link rel="alternate" hreflang="x-default" href="${urlOf(route, 'en')}">`,
    `<meta property="og:url" content="${urlOf(route, lang)}">`,
    '<meta property="og:site_name" content="Newrare">',
    `<meta property="og:locale" content="${lang === 'fr' ? 'fr_FR' : 'en_US'}">`,
    `<meta property="og:locale:alternate" content="${other === 'fr' ? 'fr_FR' : 'en_US'}">`,
    `<meta property="og:image" content="${SITE_URL}/${image}">`,
    `<meta name="twitter:card" content="${/backdrop\.webp$/.test(image) ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:image" content="${SITE_URL}/${image}">`
  ];
  if (jsonld) {
    lines.push('<script type="application/ld+json">' + JSON.stringify(jsonld).replace(/</g, '\\u003c') + '</script>');
  }
  return lines.map((l) => '  ' + l).join('\n') + '\n';
}

/* The cards come from site/script.js itself — gameCard() — run against a stub
   window, the same way loadGames() reads games.js: one writer of a card, so the
   baked markup and the live one cannot drift. */
async function sitePage(games, root) {
  const src = await readFile(path.join(SITE, 'script.js'), 'utf8');
  const stub = { addEventListener() {}, documentElement: { getAttribute: (k) => (k === 'data-root' ? root : null) } };
  const run = new Function('window', 'document', src + '\nreturn { gameCard, games, LEVELS_PER_GAME, STICKERS_PER_GAME };');
  return run({ GAMES: games }, stub);
}

/* ONE PAGE, FINISHED: its language, its links, its way back to the root, its
   <head>, and — on the page that has the grid — its cards. Every page of the
   site goes through here, the hand-written ones and the generated ones. */
async function finish(source, { route, lang, image, jsonld, games }) {
  const file = fileOf(route, lang);
  const root = rootOf(file);
  let html = fillLang(source, lang);

  if (html.includes('id="gamesGrid"')) {
    const page = await sitePage(games, root);
    const n = page.games.length;
    const cards = page.games.map((g) => page.gameCard(g, lang)).join('');
    html = html.replace(/(<div class="games" id="gamesGrid">)(<\/div>)/, (all, a, b) => a + cards + b);
    html = html.replace(/(<b id="statGames">)\d*(<\/b>)/, `$1${n}$2`)
      .replace(/(<b id="statLevels">)\d*(<\/b>)/, `$1${n * page.LEVELS_PER_GAME}$2`)
      .replace(/(<b id="statStickers">)\d*(<\/b>)/, `$1${n * page.STICKERS_PER_GAME}$2`);
  }

  html = reroot(relink(html, lang), root);
  html = html.replace(/<html lang="[a-z-]*"/i, `<html lang="${lang}"` + (root ? ` data-root="${root}"` : ''));
  html = html.replace(/(<meta charset="[^"]*">\n?)/i, (all) => all + '  ' + redirectScript(route, lang) + '\n');
  html = html.replace(/<\/head>/i, headBlock({ route, lang, image, jsonld }) + '</head>');

  await mkdir(path.dirname(path.join(OUT, file)), { recursive: true });
  await writeFile(path.join(OUT, file), html);
  return route;
}

/* What the home page says about itself to a machine: the studio, the site,
   and the list of its games, each one pointing at the page that describes it. */
function homeJsonLd(games, lang, withGuide) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': urlOf('') + '#studio',
        name: 'Newrare',
        url: urlOf(''),
        logo: SITE_URL + '/image/logo.png',
        email: 'contact@newrare.app',
        sameAs: ['https://play.google.com/store/apps/developer?id=Newrare']
      },
      {
        '@type': 'WebSite',
        '@id': urlOf('') + '#site',
        name: 'Newrare',
        url: urlOf(''),
        inLanguage: LANGS,
        publisher: { '@id': urlOf('') + '#studio' }
      },
      {
        '@type': 'ItemList',
        name: lang === 'fr' ? 'Jeux jouables dans le navigateur' : 'Games playable in the browser',
        numberOfItems: games.length,
        itemListElement: games.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g.name,
          url: withGuide.has(g.slug) ? urlOf('guide/' + g.slug, lang) : urlOf('', lang) + '#game-' + g.slug
        }))
      }
    ]
  };
}

function sitemap(routes) {
  const body = [];
  for (const route of routes) {
    for (const lang of LANGS) {
      body.push('  <url>\n' +
        `    <loc>${urlOf(route, lang)}</loc>\n` +
        LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlOf(route, l)}"/>\n`).join('') +
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlOf(route, 'en')}"/>\n` +
        '  </url>');
    }
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    body.join('\n') + '\n</urlset>\n';
}

/* Every page of the site, in both languages. Returns the routes it wrote
   (for the sitemap) and what it has to say about the guides. */
async function writePages(built) {
  const routes = [];
  const notes = [];

  /* The guides first: the home page's cards link the ones that exist. */
  const guides = {};
  for (const g of built) {
    const guide = readGuide(ROOT, g.slug);
    if (!guide || !guide.en || !guide.fr) continue;
    guides[g.slug] = guide;
    if (guide.stamp !== stampOf(g.slug)) notes.push(`${g.slug} — its guide is older than the game (node tools/build/gen-guides.mjs)`);
    await cp(path.join(ROOT, 'assets', 'guide', g.slug), path.join(OUT, 'image', 'guide', g.slug), {
      recursive: true, filter: (src) => !src.endsWith('.json') && path.basename(src) !== '.none'
    });
  }
  const withGuide = new Set(Object.keys(guides));
  const guided = built.filter((g) => withGuide.has(g.slug));
  for (const g of built) if (withGuide.has(g.slug)) g.guide = true;

  /* The hand-written pages: index.html is the home, any other is a standing
     page named by its file (privacy.html → /privacy). */
  for (const name of (await readdir(SITE)).filter((f) => f.endsWith('.html')).sort()) {
    const source = await readFile(path.join(SITE, name), 'utf8');
    const route = name === 'index.html' ? '' : name.replace(/\.html$/, '');
    for (const lang of LANGS) {
      await finish(source, {
        route, lang, games: built, image: 'image/logo.png',
        jsonld: route === '' ? homeJsonLd(built, lang, withGuide) : null
      });
    }
    routes.push(route);
  }

  if (guided.length) {
    const chrome = chromeOf(await readFile(path.join(SITE, 'privacy.html'), 'utf8'));
    for (const lang of LANGS) {
      const page = guideIndex({ games: guided, guides, lang, chrome, urlOf });
      await finish(page.html, { route: 'guide', lang, image: page.image, jsonld: page.jsonld });
    }
    routes.push('guide');
    for (const g of guided) {
      const version = JSON.parse(readFileSync(path.join(ROOT, 'games', g.slug, 'manifest.json'), 'utf8')).version;
      for (const lang of LANGS) {
        const page = guidePage({ game: { ...g, version }, guide: guides[g.slug], lang, all: guided, chrome, urlOf });
        await finish(page.html, { route: 'guide/' + g.slug, lang, image: page.image, jsonld: page.jsonld });
      }
      routes.push('guide/' + g.slug);
    }
  }

  await writeFile(path.join(OUT, 'sitemap.xml'), sitemap(routes));
  await writeFile(path.join(OUT, 'robots.txt'),
    'User-agent: *\nAllow: /\n\nSitemap: ' + SITE_URL + '/sitemap.xml\n');

  const missing = built.filter((g) => !withGuide.has(g.slug)).map((g) => g.slug);
  if (missing.length) notes.push(`no guide page for: ${missing.join(' ')} (node tools/build/gen-guides.mjs --shoot <slug>)`);
  return { routes, guided, notes };
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
    const icon = path.join(ROOT, 'assets', 'image', 'icon', 'thumb', slug + '.png');
    const page = path.join(ROOT, 'dist', 'web', slug, 'index.html');

    if (!existsSync(icon)) { skipped.push(`${slug} — no assets/image/icon/thumb/${slug}.png`); continue; }
    if (!existsSync(page)) { skipped.push(`${slug} — no web build (targets in manifest?)`); continue; }

    const imgDir = path.join(OUT, 'image', 'games', slug);
    await mkdir(imgDir, { recursive: true });
    await cp(icon, path.join(imgDir, 'icon.png'));

    /* The game's happy face, for the hero's cast (site/script.js,
       initHeroCast). It is the shipping cut the games already embed —
       assets/image/embed/, written by tools/lab/encode-art.mjs — so the studio page
       and the end screen of every game show the same drawing, and the site
       gains no artwork of its own to keep in sync. A game without one is not
       an error: the hero simply draws from the ones that are there. */
    const face = path.join(ROOT, 'assets', 'image', 'embed', slug + '-character-happy.webp');
    const hasFace = existsSync(face);
    if (hasFace) await cp(face, path.join(imgDir, 'character.webp'));

    /* The game's desk scene, for the hero of its guide page — the painted
       backdrop a desktop already sees around the frame, same file. */
    const scene = path.join(ROOT, 'assets', 'image', 'embed', slug + '-background-desk.webp');
    const hasScene = existsSync(scene);
    if (hasScene) await cp(scene, path.join(imgDir, 'backdrop.webp'));

    /* The banners of the game's itch description (tools/lab/itch-banners.mjs):
       itch takes an image by URL, and this is the public place they live —
       image/games/<slug>/itch-showcase.webp, itch-section-<key>.webp. */
    const itchDir = path.join(ROOT, 'assets', 'image', 'itch');
    if (existsSync(itchDir)) {
      for (const f of await readdir(itchDir)) {
        if (f.startsWith(slug + '-') && /-(showcase|section-[\w-]+)\.webp$/.test(f)) {
          await cp(path.join(itchDir, f), path.join(imgDir, 'itch-' + f.slice(slug.length + 1)));
        }
      }
    }

    // Screenshots are renumbered 01.jpg, 02.jpg… so the page can build the
    // list from a count instead of shipping filenames.
    const shots = await screensFor(slug);
    for (let i = 0; i < shots.length; i++) {
      const n = String(i + 1).padStart(2, '0');
      await cp(path.join(ROOT, 'assets', 'image', 'screen', shots[i]), path.join(imgDir, `${n}.jpg`));
    }

    /* A web build is a folder now: index.html, the game's own two scripts and
       its assets as files. The motor is NOT in there — it is the hashed pair
       at the root of dist/web, copied once below, so opening a second game
       downloads neither the engine nor the menu again. */
    await cp(path.join(ROOT, 'dist', 'web', slug), path.join(OUT, 'games', slug), { recursive: true });

    built.push({ ...game, draft: undefined, icon: true, screens: shots.length, character: hasFace, backdrop: hasScene });
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

  /* The pages before games.js: writing them is what finds out which games
     have a guide, and the catalogue the browser loads has to say so too. */
  const pages = await writePages(built);

  const header = '/* Generated by tools/build/build-site.mjs — do not edit. Source: site/games.js */\n';
  await writeFile(path.join(OUT, 'games.js'), header + 'window.GAMES = ' + JSON.stringify(built, null, 2) + ';\n');

  const bytes = await dirSize(OUT);
  console.log(`site → dist/site  (${(bytes / 1048576).toFixed(1)} MB)`);
  console.log(`  ${built.length} games: ${built.map((g) => `${g.slug}(${g.screens})`).join(' ')}`);
  console.log(`  ${pages.routes.length} pages x ${LANGS.length} languages, ${pages.guided.length} guides, sitemap.xml, robots.txt`);
  for (const note of pages.notes) console.log('  guide: ' + note);
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
