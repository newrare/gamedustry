/*
  site-guide — the guide pages of the site, written from the games' own guides.

  Imported by tools/build/build-site.mjs. Every game explains itself in its
  guide (packages/webshell/guide.js): chapters of pages, one page per rule,
  enemy, power or biome, each with a picture, a table and two or three
  sentences. That is exactly what a search engine is looking for when someone
  types "how to play <game>" — and none of it was on the site, where a game was
  one card with one sentence.

  So each game gets ONE page per language, /guide/<slug> and /fr/guide/<slug>:
  the game's header, how it is played, a table of contents, then every chapter
  with every page of the guide as an entry that can be linked to by its id
  (/guide/vipera#armour). One page per game rather than one per rule: a rule is
  two sentences, and five hundred two-sentence pages are five hundred thin
  pages, where twenty-one full guides are twenty-one pages worth reading.

  NOT A WORD IS WRITTEN HERE FOR A GAME. The text and the pictures come from
  assets/guide/<slug>/, which tools/build/gen-guides.mjs reads out of the
  game's own build — `Game.guide.chapters()` in each language — so a rule is
  edited in one place, the game, and proofread in one place, the copy desk
  (`make text`). The only strings this file owns are the page's chrome
  (`T` below): "How to play", "Contents", "From level 4".

  The pages are returned as source-style markup — paths written as if the page
  sat at the root of the site — and build-site.mjs finishes them like every
  other page: language, links, the way back to the root, the <head>.
*/

import fs from 'node:fs';
import path from 'node:path';

const T = {
  en: {
    sub: 'Guide and rules',
    title: '{name} — guide, rules and tips | Newrare',
    desc: '{name}: {how}. The complete guide — {chapters}.',
    how: 'How to play',
    contents: 'Contents',
    play: 'Play now',
    playNote: 'Free, in your browser. No install, no account.',
    from: 'From level {n}',
    screens: 'Screenshots',
    shot: '{name} — screenshot {n}',
    others: 'More guides',
    home: 'Home',
    guides: 'Guides',
    indexTitle: 'Game guides and rules — every Newrare game explained | Newrare',
    indexDesc: 'The complete guide to every Newrare game: rules, enemies, powers and biomes, chapter by chapter, with pictures. Free browser games, no install.',
    indexH1: 'Game guides',
    indexLead: 'Every game explains itself: the rules, the enemies, the powers and the biomes, chapter by chapter. Pick a game, read how it works, then play it right here in your browser.',
    count: '{n} pages',
    read: 'Read the guide'
  },
  fr: {
    sub: 'Guide et règles',
    title: '{name} — guide, règles et astuces | Newrare',
    desc: '{name} : {how}. Le guide complet — {chapters}.',
    how: 'Comment jouer',
    contents: 'Sommaire',
    play: 'Jouer maintenant',
    playNote: 'Gratuit, dans le navigateur. Sans installation, sans compte.',
    from: 'Dès le stage {n}',
    screens: 'Captures',
    shot: '{name} — capture {n}',
    others: 'Autres guides',
    home: 'Accueil',
    guides: 'Guides',
    indexTitle: 'Guides et règles des jeux — tous les jeux Newrare expliqués | Newrare',
    indexDesc: 'Le guide complet de chaque jeu Newrare : règles, ennemis, pouvoirs et biomes, chapitre par chapitre, en images. Jeux gratuits sur navigateur, sans installation.',
    indexH1: 'Guides des jeux',
    indexLead: 'Chaque jeu s’explique lui-même : les règles, les ennemis, les pouvoirs et les biomes, chapitre par chapitre. Choisis un jeu, lis comment il fonctionne, puis lance-le ici même, dans le navigateur.',
    count: '{n} pages',
    read: 'Lire le guide'
  }
};

function fill(str, vals) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (vals[k] == null ? m : vals[k]));
}

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* A guide's prose is text, save one tag: <b>…</b> puts a key word forward
   (guide.js, `rich`). Same rule here, so the page reads as the card does. */
function rich(s) {
  return esc(s).replace(/&lt;(\/?)b&gt;/g, '<$1b>');
}

function plain(s) {
  return String(s).replace(/<\/?b>/g, '');
}

/* An entry is linked to by its page id (/guide/vipera#armour), so the id must
   not be one the page's own chrome already uses. */
const RESERVED = new Set(['top', 'nav', 'navLinks', 'brand', 'langToggle', 'burger', 'year', 'contents', 'how', 'screens', 'others']);
function anchor(id) {
  const a = String(id).replace(/[^A-Za-z0-9_-]+/g, '-');
  return RESERVED.has(a) || /^ch-/.test(a) ? 'p-' + a : a;
}

function clip(s, max) {
  s = String(s).replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).replace(/[\s,;:.—-]+$/, '') + '…';
}

export function readGuide(root, slug) {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'assets', 'guide', slug, 'guide.json'), 'utf8')); }
  catch (e) { return null; }
}

/* The nav and the footer are the site's, taken from a hand-written page at
   build time rather than copied into a template that would drift from it.
   privacy.html is the donor: its links already name the home page by file
   (`index.html#playables`), which is what a page that is not the home needs. */
export function chromeOf(pageHtml) {
  const nav = /<header class="nav"[\s\S]*?<\/header>/.exec(pageHtml);
  const foot = /<footer class="foot"[\s\S]*?<\/footer>/.exec(pageHtml);
  if (!nav || !foot) throw new Error('site-guide: no nav or footer found in the donor page');
  return { nav: nav[0], foot: foot[0] };
}

function crumbs(items) {
  return '<nav class="crumbs" aria-label="Breadcrumb"><ol>' +
    items.map((it, i) => (i < items.length - 1
      ? `<li><a href="${it.href}">${esc(it.label)}</a></li>`
      : `<li aria-current="page">${esc(it.label)}</li>`)).join('') +
    '</ol></nav>';
}

function picture(slug, ref, alt, eager) {
  return `<img src="image/guide/${slug}/${ref.file}" alt="${esc(alt)}" width="${ref.w}" height="${ref.h}"` +
    (eager ? '' : ' loading="lazy"') + ' decoding="async">';
}

/* HOW AN ENTRY IS LAID OUT is the picture's to say. A panorama (a row of
   four cards, a strip of traps) stands on top of the entry, the whole width
   of it, because beside the words it would be a sliver; anything else — a
   slice of the round, a monster, one card — stands beside the words on a
   wide screen, so an entry reads at a glance instead of a screen at a time.
   On a phone everything stacks. A SCENE is opaque and laid edge to edge; a
   CUT stands on nothing and is centred on the game's own light
   (gen-guides.mjs, `kind`). */
function layoutOf(ref) {
  if (!ref) return 'text';
  return ref.w / ref.h >= 2.2 ? 'wide' : 'beside';
}

function stats(rows) {
  if (!rows || !rows.length) return '';
  return '<dl class="g-stats">' + rows.map((r) =>
    `<div><dt>${rich(r[0])}</dt><dd${r[2] ? ` style="color:${esc(r[2])}"` : ''}>${esc(r[1])}</dd></div>`
  ).join('') + '</dl>';
}

function entry(slug, p, t, eager) {
  const lay = layoutOf(p.pic);
  let html = `<article class="g-entry g-${lay}" id="${anchor(p.id)}">`;
  if (p.pic) {
    html += `<figure class="g-media g-${p.pic.kind || 'cut'}">${picture(slug, p.pic, p.pic.alt || p.title, eager)}</figure>`;
  }
  html += '<div class="g-body">';
  html += '<header class="g-entry-head">' +
    `<h3><a href="#${anchor(p.id)}">${esc(p.title)}</a></h3>` +
    (p.lv && p.lv > 1 ? `<span class="g-lv">${esc(fill(t.from, { n: p.lv }))}</span>` : '') +
    '</header>';
  for (const line of p.text || []) html += `<p>${rich(line)}</p>`;
  html += stats(p.rows);
  if (p.node) {
    html += `<figure class="g-node g-${p.node.kind || 'cut'}">${picture(slug, p.node, p.node.alt || p.title, false)}</figure>`;
  }
  return html + '</div></article>';
}

function two(n) { return String(n).padStart(2, '0'); }

function shell({ lang, title, desc, bodyClass, style, chrome, main }) {
  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#05060c">
  <meta name="description" content="${esc(desc)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="style.css">
  <link rel="icon" type="image/x-icon" href="./image/favicon.ico">
  <link rel="apple-touch-icon" href="./image/logo.png">
</head>

<body class="${bodyClass}"${style ? ` style="${style}"` : ''}>
  <a class="skip" href="#top" data-fr="Aller au contenu" data-en="Skip to the content"></a>

  ${chrome.nav}

  <main id="top" class="guide">
${main}
  </main>

  ${chrome.foot}

  <script src="analytics.js"></script>
  <script src="script.js"></script>
</body>

</html>
`;
}

/* One game's guide, one language. `game` is the catalogue entry build-site
   shipped (name, accent, taglines, tags, screens); `all` is every game that
   has a guide, for the links at the foot. */
export function guidePage({ game, guide, lang, all, chrome, urlOf }) {
  const t = T[lang];
  const book = guide[lang];
  const copy = game[lang] || game.en;
  const slug = game.slug;
  const name = game.name;

  const chapters = book.chapters.filter((c) => c.pages.length);
  const title = fill(t.title, { name });
  const desc = clip(fill(t.desc, {
    name,
    how: plain(book.howTo).replace(/[.!?]+$/, ''),
    chapters: chapters.map((c) => c.label.toLowerCase()).join(', ')
  }), 160);

  /* THE HERO: the game's own desk scene behind it (its painted backdrop, the
     one a desktop sees around the frame), its happy face standing on the
     right, and over them the name, the tags, the sentence and the way in.
     Everything here is the game's own artwork; the site draws none. */
  let main = '<section class="gh">';
  if (game.backdrop) {
    main += `<div class="gh-bg" aria-hidden="true"><img src="image/games/${slug}/backdrop.webp" alt="" width="1600" height="900" fetchpriority="high" decoding="async"></div>`;
  }
  main += '<div class="wrap gh-inner">';
  main += crumbs([
    { href: 'index.html', label: t.home },
    { href: 'guide/index.html', label: t.guides },
    { label: name }
  ]);
  main += '<div class="gh-grid"><div class="gh-copy">' +
    '<div class="gh-id">' +
      `<img class="gh-icon" src="image/games/${slug}/icon.png" alt="${esc(name)}" width="88" height="88">` +
      `<div><p class="gh-eyebrow">${esc(t.sub)}</p><h1>${esc(name)}</h1></div>` +
    '</div>' +
    '<ul class="game-tags gh-tags">' + copy.tags.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul>' +
    `<p class="gh-tagline">${esc(copy.tagline)}</p>` +
    '<div class="gh-cta">' +
      `<a class="btn btn-primary" href="games/${slug}/index.html?lang=${lang}" data-track-play="${slug}">` +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
        `<span>${esc(t.play)}</span>` +
      '</a>' +
      `<span class="gh-note">${esc(t.playNote)}</span>` +
    '</div>' +
    '</div>';
  if (game.character) {
    main += `<img class="gh-char" src="image/games/${slug}/character.webp" alt="" aria-hidden="true" width="460" height="552" decoding="async">`;
  }
  main += '</div>';
  main += `<div class="gh-how" id="how"><span class="gh-how-label">${esc(t.how)}</span><p>${rich(book.howTo)}</p></div>`;
  main += '</div></section>';

  if (game.screens > 0) {
    main += `<section class="wrap g-screens" id="screens" aria-label="${esc(t.screens)}"><ul>`;
    for (let i = 1; i <= game.screens; i++) {
      main += `<li><img src="image/games/${slug}/${two(i)}.jpg" alt="${esc(fill(t.shot, { name, n: i }))}" width="720" height="1280" loading="lazy" decoding="async"></li>`;
    }
    main += '</ul></section>';
  }

  /* THE BOOK: the contents in a column of their own that follows the reader
     on a wide screen (a bar of chapters along the top on a phone), and the
     chapters, numbered, one entry per page of the in-game guide. */
  main += '<div class="wrap g-layout">';
  main += `<nav class="g-side" id="contents" aria-label="${esc(t.contents)}"><p class="g-side-title">${esc(t.contents)}</p><ol>`;
  chapters.forEach((c, i) => {
    main += `<li><a class="g-side-ch" href="#ch-${anchor(c.key)}"><span>${two(i + 1)}</span>${esc(c.label)}</a><ul>` +
      c.pages.map((p) => `<li><a href="#${anchor(p.id)}">${esc(p.title)}</a></li>`).join('') +
      '</ul></li>';
  });
  main += '</ol></nav><div class="g-main">';

  let eager = 1;                                   // the first picture is above the fold
  chapters.forEach((c, i) => {
    main += `<section class="g-chapter" id="ch-${anchor(c.key)}">` +
      `<header class="g-ch-head"><span class="g-ch-num">${two(i + 1)}</span><h2>${esc(c.label)}</h2>` +
      `<span class="g-ch-count">${esc(fill(t.count, { n: c.pages.length }))}</span></header>`;
    for (const p of c.pages) main += entry(slug, p, t, eager-- > 0);
    main += '</section>';
  });
  main += '</div></div>';

  const others = all.filter((g) => g.slug !== slug);
  if (others.length) {
    main += `<section class="wrap g-others" id="others"><h2>${esc(t.others)}</h2><ul>` +
      others.map((g) =>
        `<li style="--g1:${g.accent[0]};--g2:${g.accent[1]}"><a href="guide/${g.slug}/index.html">` +
        `<img src="image/games/${g.slug}/icon.png" alt="" width="44" height="44" loading="lazy" decoding="async">` +
        `<span>${esc(g.name)}</span></a></li>`).join('') +
      '</ul></section>';
  }

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'VideoGame',
        '@id': urlOf('guide/' + slug, lang) + '#game',
        name,
        url: urlOf('guide/' + slug, lang),
        description: copy.tagline,
        image: urlOf('image/games/' + slug + '/icon.png'),
        ...(game.screens > 0 ? {
          screenshot: Array.from({ length: Math.min(game.screens, 4) }, (_, i) =>
            urlOf('image/games/' + slug + '/' + String(i + 1).padStart(2, '0') + '.jpg'))
        } : {}),
        genre: copy.tags,
        gamePlatform: ['Web browser'],
        applicationCategory: 'Game',
        operatingSystem: 'Any',
        playMode: 'SinglePlayer',
        inLanguage: ['en', 'fr'],
        ...(game.version ? { softwareVersion: game.version } : {}),
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
        author: { '@id': urlOf('') + '#studio' },
        publisher: { '@id': urlOf('') + '#studio' }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Newrare', item: urlOf('', lang) },
          { '@type': 'ListItem', position: 2, name: t.guides, item: urlOf('guide', lang) },
          { '@type': 'ListItem', position: 3, name, item: urlOf('guide/' + slug, lang) }
        ]
      }
    ]
  };

  return {
    html: shell({
      lang, title, desc, chrome, main,
      bodyClass: 'guide-page',
      style: `--g1:${game.accent[0]};--g2:${game.accent[1]}`
    }),
    /* The share card: the game's desk scene, 16:9 — the shape a link preview
       is drawn in — where the portrait screenshot would be cropped to a strip. */
    image: game.backdrop ? 'image/games/' + slug + '/backdrop.webp'
      : game.screens > 0 ? 'image/games/' + slug + '/01.jpg' : 'image/games/' + slug + '/icon.png',
    jsonld
  };
}

/* The index of the guides: every game with one, its sentence and how many
   pages its guide holds. It is the hub the nav's "Guides" points at, and the
   one page from which a crawler reaches all of them in one step. */
export function guideIndex({ games, guides, lang, chrome, urlOf }) {
  const t = T[lang];
  let main = '<section class="gh gh-index"><div class="wrap gh-inner">';
  main += crumbs([{ href: 'index.html', label: t.home }, { label: t.guides }]);
  main += `<div class="gh-copy"><h1>${esc(t.indexH1)}</h1><p class="gh-tagline">${esc(t.indexLead)}</p></div>`;
  main += '</div></section>';
  main += '<div class="wrap"><ul class="g-index">';
  for (const g of games) {
    const copy = g[lang] || g.en;
    const book = guides[g.slug][lang];
    const n = book.chapters.reduce((s, c) => s + c.pages.length, 0);
    main += `<li style="--g1:${g.accent[0]};--g2:${g.accent[1]}">` +
      `<a href="guide/${g.slug}/index.html">` +
        '<div class="gi-art" aria-hidden="true">' +
          (g.backdrop ? `<img class="gi-bg" src="image/games/${g.slug}/backdrop.webp" alt="" width="1600" height="900" loading="lazy" decoding="async">` : '') +
          (g.character ? `<img class="gi-char" src="image/games/${g.slug}/character.webp" alt="" width="460" height="552" loading="lazy" decoding="async">` : '') +
        '</div>' +
        '<div class="gi-body">' +
          `<img class="gi-icon" src="image/games/${g.slug}/icon.png" alt="" width="64" height="64" loading="lazy" decoding="async">` +
          `<h2>${esc(g.name)}</h2>` +
          `<p>${rich(book.howTo)}</p>` +
          `<div class="gi-meta"><span>${esc(copy.tags.join(' · '))}</span><b>${esc(fill(t.count, { n }))}</b></div>` +
        '</div>' +
      '</a></li>';
  }
  main += '</ul></div>';

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: t.indexH1,
        url: urlOf('guide', lang),
        isPartOf: { '@id': urlOf('') + '#site' },
        hasPart: games.map((g) => ({ '@id': urlOf('guide/' + g.slug, lang) + '#game' }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Newrare', item: urlOf('', lang) },
          { '@type': 'ListItem', position: 2, name: t.guides, item: urlOf('guide', lang) }
        ]
      }
    ]
  };

  return {
    html: shell({ lang, title: t.indexTitle, desc: t.indexDesc, chrome, main, bodyClass: 'guide-page guide-index' }),
    image: 'image/logo.png',
    jsonld
  };
}
