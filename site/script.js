/* ==========================================================================
   Newrare — site behaviour
   Vanilla JS, no dependency. Six concerns:
     1. language     FR / EN, remembered in localStorage
     2. navigation   sticky state, the mobile sheet, the scroll spy
     3. playables    the grid, and the portrait player
     4. screenshots  the lightbox, shared by games and store apps
     5. legal        the <details> panels of the legal section
     6. analytics    what a page reports, when analytics.js is loaded

   Every page of the site loads this one file, so each init() returns quietly
   when its markup is absent — privacy.html has the nav and the footer, and
   neither the grid nor the modals.
   ========================================================================== */
'use strict';

/* ───────────────────────────── 0. analytics ──────────────────────────── */

/* analytics.js is optional and inert off the deployed site, so callers never
   check anything: this is the whole interface the page uses. */
function track(name, data) {
  if (window.Analytics) window.Analytics.track(name, data);
}

/* Scrolling this page is decoration too: a visitor who asked for no motion
   gets the jump, exactly as the stylesheet gives them no transition. */
function prefersMotion() {
  return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/* ───────────────────────────── 1. language ───────────────────────────── */

var LANG_KEY = 'newrare.lang';
var lang = 'en';

/* WHERE THE SITE'S ROOT IS, from this page. The built site has pages at
   several depths — /, /fr, /guide/<slug>, /fr/guide/<slug> — and every one of
   them loads this file, so a path this file builds (a game's icon, its build,
   its screenshots) is prefixed with the way back to the root, which the
   builder writes on <html data-root>. The hand-written pages carry none: they
   sit at the root and the prefix is empty. */
var ROOT = (document.documentElement && document.documentElement.getAttribute('data-root')) || '';

/* THE LANGUAGE IS THE URL'S, on the built site. tools/build/build-site.mjs
   writes every page twice — /… in English, /fr/… in French — so that a
   crawler reads each language at an address of its own, and names the pair in
   <link rel="alternate" hreflang>. A page that carries those links IS its
   language: the toggle is then a navigation to the other address, and the
   visitor's choice is remembered so the tiny script the builder puts in the
   <head> can send them straight to it next time.

   A page with no alternates is the raw site/ folder opened as files, where
   one page holds both languages and the switch is made in place, as it
   always was. */
function alternates() {
  var links = document.querySelectorAll('link[rel="alternate"][hreflang]');
  var out = null;
  for (var i = 0; i < links.length; i++) {
    var code = links[i].getAttribute('hreflang');
    if (code !== 'fr' && code !== 'en') continue;
    out = out || {};
    // The path only: a preview deployment and localhost stay on themselves.
    out[code] = links[i].getAttribute('href').replace(/^https?:\/\/[^/]+/, '') || '/';
  }
  return out && out.fr && out.en ? out : null;
}

function readLang() {
  if (alternates()) return document.documentElement.lang === 'fr' ? 'fr' : 'en';
  try {
    var saved = localStorage.getItem(LANG_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch (e) { /* private mode: fall through to the browser hint */ }
  var hint = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return hint.indexOf('fr') === 0 ? 'fr' : 'en';
}

function saveLang(value) {
  try { localStorage.setItem(LANG_KEY, value); } catch (e) { /* not fatal */ }
}

/* CAPITALS ARE A LOOK, NOT A SPELLING — the same rule the games play by
   (`upper`, packages/engine). Every string on this site is written in normal
   case, in `data-fr` / `data-en` and in games.js, and a line that reads in
   capitals is a line the stylesheet SHOUTS. All this does is take the accents
   off on the way, because `text-transform: uppercase` cannot: the eyebrow
   would otherwise read STUDIO DE JEUX INDÉPENDANT, and a capital carries no
   accent in this house.

   What shouts is declared in style.css and nowhere else — the computed
   `text-transform` is read here, so a new uppercase rule needs no second list
   to be kept in step with. */
var UP_FROM = '\u00C0\u00C1\u00C2\u00C3\u00C4\u00C5\u00C7\u00C8\u00C9\u00CA\u00CB\u00CC\u00CD\u00CE\u00CF\u00D1\u00D2\u00D3\u00D4\u00D5\u00D6\u00D8\u00D9\u00DA\u00DB\u00DC\u00DD\u0178';
var UP_TO   = 'AAAAAACEEEEIIIINOOOOOOUUUUYY';
var UP_PAIR = { '\u00C6': 'AE', '\u0152': 'OE', '\u00DF': 'SS' };

function upper(text) {
  var out = '', up = String(text).toUpperCase(), i, c, k;
  for (i = 0; i < up.length; i++) {
    c = up.charAt(i);
    if (UP_PAIR[c]) { out += UP_PAIR[c]; continue; }
    k = UP_FROM.indexOf(c);
    out += k < 0 ? c : UP_TO.charAt(k);
  }
  return out;
}

function shouts(node) {
  var cs = window.getComputedStyle ? window.getComputedStyle(node) : null;
  return !!cs && cs.textTransform === 'uppercase';
}

function applyLang() {
  var nodes = document.querySelectorAll('[data-fr][data-en]');
  for (var i = 0; i < nodes.length; i++) {
    var text = nodes[i].getAttribute('data-' + lang);
    // A <meta> says its text in `content`: the description, the share card.
    if (nodes[i].tagName === 'META') { nodes[i].setAttribute('content', text); continue; }
    nodes[i].textContent = shouts(nodes[i]) ? upper(text) : text;
  }
  document.documentElement.lang = lang;

  // The toggle advertises the language it switches to, not the current one.
  var toggle = document.getElementById('langToggle');
  if (toggle) toggle.textContent = lang === 'fr' ? 'EN' : 'FR';

  renderGames();
}

function toggleLang() {
  var next = lang === 'fr' ? 'en' : 'fr';
  saveLang(next);
  track('lang', { lang: next });

  // The built site: the other language is the other address (see alternates).
  var alt = alternates();
  if (alt) { location.href = alt[next] + location.hash; return; }

  lang = next;
  applyLang();
}

/* ──────────────────────────── 2. navigation ─────────────────────────── */

function initNav() {
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');
  if (!nav || !burger || !links) return;

  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.pageYOffset > 8);
  }, { passive: true });

  function closeSheet() {
    links.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }

  burger.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') closeSheet();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 780) closeSheet();
  });

  /* The logo goes back to the top of the page, not to the #top anchor: the
     anchor lands under the sticky bar and leaves a hash behind that makes the
     next reload skip the hero. */
  var brand = document.getElementById('brand');
  if (brand) {
    brand.addEventListener('click', function (e) {
      e.preventDefault();
      closeSheet();
      window.scrollTo({ top: 0, behavior: prefersMotion() ? 'smooth' : 'auto' });
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    });
  }

  initSpy(links.querySelectorAll('a[href^="#"]'));
}

/* Which section the reader is in, marked in the bar. The band is the middle of
   the viewport, so the mark changes when the eye has actually moved on. */
function initSpy(anchors) {
  if (!anchors.length || !window.IntersectionObserver) return;

  var byId = {};
  var sections = [];
  for (var i = 0; i < anchors.length; i++) {
    var id = (anchors[i].getAttribute('href') || '').slice(1);
    var section = id && document.getElementById(id);
    if (!section) continue;
    byId[id] = anchors[i];
    sections.push(section);
  }
  if (!sections.length) return;

  var visible = {};
  var spy = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      visible[entries[i].target.id] = entries[i].isIntersecting;
    }
    var active = '';
    for (var j = 0; j < sections.length; j++) {
      if (visible[sections[j].id]) { active = sections[j].id; break; }
    }
    for (var id in byId) {
      if (byId.hasOwnProperty(id)) byId[id].classList.toggle('active', id === active);
    }
  }, { rootMargin: '-45% 0px -50% 0px' });

  for (var s = 0; s < sections.length; s++) spy.observe(sections[s]);
}

/* THE GUIDE'S CONTENTS FOLLOW THE READER (a guide page, tools/build/
   site-guide.mjs). The chapter being read is lit and unfolds its pages, the
   entry being read is lit inside it; on a phone, where the contents are a bar
   of chapters, the lit one is slid into view. The band is a strip a third of
   the way down the screen, where the eye reads. */
function initGuideSpy() {
  var side = document.querySelector('.g-side');
  if (!side || !window.IntersectionObserver) return;

  var chLinks = {}, pageLinks = {};
  var a = side.querySelectorAll('a[href^="#"]');
  for (var i = 0; i < a.length; i++) {
    var id = a[i].getAttribute('href').slice(1);
    (a[i].classList.contains('g-side-ch') ? chLinks : pageLinks)[id] = a[i];
  }
  var bar = side.querySelector('ol');
  var current = { ch: null, page: null };

  function light(map, id, key) {
    if (current[key] === id) return;
    if (current[key] && map[current[key]]) {
      map[current[key]].classList.remove('is-active');
      if (key === 'ch') map[current[key]].parentNode.classList.remove('is-open');
    }
    current[key] = id;
    var link = map[id];
    if (!link) return;
    link.classList.add('is-active');
    if (key !== 'ch') return;
    link.parentNode.classList.add('is-open');
    // The phone's bar slides sideways only: scrollIntoView would move the page too.
    if (bar && bar.scrollWidth > bar.clientWidth + 1) {
      bar.scrollTo({ left: link.offsetLeft - 16, behavior: prefersMotion() ? 'smooth' : 'auto' });
    }
  }

  var seen = {};
  var spy = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) seen[entries[i].target.id] = entries[i].isIntersecting;
    var nodes = document.querySelectorAll('.g-chapter, .g-entry');
    for (var j = 0; j < nodes.length; j++) {
      if (!seen[nodes[j].id]) continue;
      if (nodes[j].classList.contains('g-chapter')) light(chLinks, nodes[j].id, 'ch');
      else {
        light(pageLinks, nodes[j].id, 'page');
        var ch = nodes[j].closest('.g-chapter');
        if (ch) light(chLinks, ch.id, 'ch');
      }
    }
  }, { rootMargin: '-30% 0px -60% 0px' });

  var all = document.querySelectorAll('.g-chapter, .g-entry');
  for (var k = 0; k < all.length; k++) spy.observe(all[k]);
  var first = document.querySelector('.g-chapter');
  if (first) light(chLinks, first.id, 'ch');
}

/* ──────────────────────────── 3. playables ──────────────────────────── */

var games = (window.GAMES || []).filter(function (g) {
  // The builder marks which games actually have artwork on disk. Outside the
  // build (opening site/index.html raw) nothing is marked, so show them all.
  return g.icon !== false;
});

/* The hero's cast: two of the games' own characters, standing on the arcade
   floor either side of the headline.

   They are the happy faces the games show on a winning end screen
   (assets/image/embed/<slug>-character-happy.webp, copied into
   image/games/<slug>/character.webp by tools/build/build-site.mjs), so the
   studio page is dressed with the games' own artwork and owns none of its own.

   The pair is drawn at random on every load, which is the point: thirteen
   characters over two slots is a different pair almost every visit, and the
   page reads as a studio with a roster rather than as a poster. `initGames()`
   has already filtered the catalogue down to what shipped, so a game whose
   artwork is missing simply is not in the draw.

   The layer is decorative and `aria-hidden` in the markup; it collapses under
   1080px, where the headline needs the full width. */
function initHeroCast() {
  var box = document.getElementById('heroCast');
  if (!box) return;

  var cast = games.filter(function (g) { return g.character !== false; });
  if (cast.length < 2) return;              // one character is not a cast

  // Fisher-Yates over a copy: the two slots must never draw the same game.
  var pool = cast.slice();
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }

  var sides = ['left', 'right'];
  var html = '';
  for (var s = 0; s < sides.length; s++) {
    var g = pool[s];
    html += '<img class="hero-face hero-face-' + sides[s] + '"' +
            ' src="' + ROOT + 'image/games/' + g.slug + '/character.webp"' +
            ' alt="" aria-hidden="true" loading="lazy" decoding="async"' +
            ' style="animation-delay:' + (s * -2.4).toFixed(1) + 's">';
  }
  box.innerHTML = html;
}

/* One card, as markup. It is the ONE writer of a card: renderGames() uses it
   in the browser, and tools/build/build-site.mjs runs this file under a stub
   to bake the same cards into dist/site/index.html, so a crawler that runs no
   script still reads every game, its tags and its whole description.

   The description is written once and in full: the clamp to four lines is
   the stylesheet's, and "Read more" lifts that same node over the card
   (.game.is-open) rather than copying its text into a second one. */
function gameCard(g, l) {
  var copy = g[l] || g.en;
  var fr = l === 'fr';
  var tags = '';
  for (var t = 0; t < copy.tags.length; t++) {
    tags += '<li>' + escapeHtml(copy.tags[t]) + '</li>';
  }

  var shots = g.screens > 0
    ? '<button class="btn btn-ghost btn-sm" type="button" data-shots="' + g.slug + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v9l4-4 3 3 4-5 3 4V7H5z"/></svg>' +
      (fr ? 'Captures' : 'Screens') +
      '</button>'
    : '';

  /* The way to the game's guide page — its rules, chapter by chapter, which
     the builder writes from the game's own guide (tools/build/site-guide.mjs)
     and marks with `guide: true`. A real link, in the baked markup too: it is
     how a crawler walks from the front page to every guide. */
  var guide = g.guide
    ? '<a class="game-guide" href="' + (fr ? '/fr' : '') + '/guide/' + g.slug + '"' +
      ' aria-label="' + escapeHtml(g.name) + ' — ' + (fr ? 'guide et règles' : 'guide and rules') + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h11a2 2 0 0 1 2 2v15.5a.5.5 0 0 1-.5.5H7a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zm0 13.2c.3-.1.7-.2 1-.2h10V5H6v11.2zM7 18a1 1 0 0 0 0 2h10v-2H7zm2-10h6v2H9V8z"/></svg>' +
      'Guide' +
      '</a>'
    : '';

  var desc = 'desc-' + g.slug;
  return '<article class="game" id="game-' + g.slug + '" style="--g1:' + g.accent[0] + ';--g2:' + g.accent[1] + '">' +
      '<div class="game-top">' +
        '<img class="game-icon" src="' + ROOT + 'image/games/' + g.slug + '/icon.png" alt="' + escapeHtml(g.name) + '" width="66" height="66" loading="lazy">' +
        '<div class="game-id">' +
          '<h3>' + escapeHtml(g.name) + '</h3>' +
        '</div>' +
        guide +
      '</div>' +
      '<ul class="game-tags">' + tags + '</ul>' +
      '<div class="game-full" aria-hidden="true">' +
        '<span class="game-full-name">' + escapeHtml(g.name) + '</span>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-less tabindex="-1">' +
          (fr ? 'Fermer' : 'Close') +
        '</button>' +
      '</div>' +
      '<p class="game-desc" id="' + desc + '">' + escapeHtml(copy.tagline) + '</p>' +
      '<button class="game-more" type="button" data-more aria-controls="' + desc + '" aria-expanded="false">' +
        (fr ? 'Lire la suite' : 'Read more') +
      '</button>' +
      '<div class="game-actions">' +
        '<button class="btn btn-primary btn-sm" type="button" data-play="' + g.slug + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
          (fr ? 'Jouer' : 'Play') +
        '</button>' +
        shots +
      '</div>' +
    '</article>';
}

function renderGames() {
  var grid = document.getElementById('gamesGrid');
  if (!grid) return;

  var html = '';
  for (var i = 0; i < games.length; i++) html += gameCard(games[i], lang);
  grid.innerHTML = html;
  fitDescs();

  setStat('statGames', games.length);
  setStat('statLevels', games.length * LEVELS_PER_GAME);
  setStat('statStickers', games.length * STICKERS_PER_GAME);
}

/* Which blurbs overflow their four lines depends on the card's width, the
   language and the text, so it is measured, never guessed from a length. The
   test is made on the unclamped four-line box: a clamped one already fits. */
function fitDescs() {
  closeFull();
  var descs = document.querySelectorAll('.game-desc');
  for (var i = 0; i < descs.length; i++) {
    descs[i].classList.remove('is-clamped');
  }
  for (var j = 0; j < descs.length; j++) {
    var d = descs[j];
    if (d.scrollHeight > d.clientHeight + 1) d.classList.add('is-clamped');
  }
}

function openFull(btn) {
  var card = btn.closest('.game');
  if (!card) return;
  closeFull();
  card.classList.add('is-open');
  btn.setAttribute('aria-expanded', 'true');
  var head = card.querySelector('.game-full');
  if (head) head.setAttribute('aria-hidden', 'false');
  var close = card.querySelector('[data-less]');
  if (close) { close.removeAttribute('tabindex'); close.focus(); }
  var desc = card.querySelector('.game-desc');
  if (desc) { desc.scrollTop = 0; desc.setAttribute('tabindex', '0'); }
}

// Returns true when a card was open, so ESCAPE closes one thing at a time.
function closeFull() {
  var open = document.querySelectorAll('.game.is-open');
  for (var i = 0; i < open.length; i++) {
    var card = open[i];
    card.classList.remove('is-open');
    var more = card.querySelector('[data-more]');
    if (more) more.setAttribute('aria-expanded', 'false');
    var head = card.querySelector('.game-full');
    if (head) head.setAttribute('aria-hidden', 'true');
    var close = card.querySelector('[data-less]');
    if (close) close.setAttribute('tabindex', '-1');
    var desc = card.querySelector('.game-desc');
    if (desc) { desc.removeAttribute('tabindex'); desc.scrollTop = 0; }
  }
  return open.length > 0;
}

/* The web shell gives every game the same board and the same sheet: 30 levels
   on the map, 20 stickers in the album. They are the shell's contract, not a
   per-game figure, so the hero multiplies them by what the catalogue shipped
   rather than carrying three numbers nobody would remember to update. */
var LEVELS_PER_GAME = 30;
var STICKERS_PER_GAME = 20;

function setStat(id, value) {
  var node = document.getElementById(id);
  if (node) node.textContent = String(value);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function gameBySlug(slug) {
  for (var i = 0; i < games.length; i++) {
    if (games[i].slug === slug) return games[i];
  }
  return null;
}

/* ── the portrait player ── */

var player = {
  root: null,
  frame: null,
  title: null,
  open: null,
  opener: null,
  slug: '',
  since: 0
};

function initPlayer() {
  player.root = document.getElementById('player');
  if (!player.root) return;
  player.frame = document.getElementById('playerFrame');
  player.title = document.getElementById('playerTitle');
  player.open = document.getElementById('playerOpen');

  player.open.addEventListener('click', function () {
    track('play_tab', { game: player.slug });
  });
}

function openPlayer(slug, trigger) {
  if (!player.root) return;
  var g = gameBySlug(slug);
  if (!g) return;

  /* The game reads ?lang= and dresses its own menu with it (see
     packages/webshell/menu.js), so the page and the game it embeds are never
     in two different languages. */
  var url = ROOT + 'games/' + slug + '/index.html?lang=' + lang;
  /* ?perf=1 on the page is forwarded to the game. The probe that reports the
     frame cost lives in the motor (docs/ENGINE.md), so the flag has to reach
     the iframe: on the page itself it would do nothing, which is exactly the
     mistake it is worth saving. Nothing else is forwarded. */
  if (/(^|[?&])perf=1\b/.test(location.search)) url += '&perf=1';
  player.title.textContent = g.name;
  player.open.href = url;
  player.frame.src = url;
  player.frame.title = g.name;
  player.opener = trigger || null;
  player.slug = slug;
  player.since = Date.now();

  showModal(player.root);
  track('play', { game: slug });
}

function closePlayer() {
  hideModal(player.root);
  player.frame.removeAttribute('src'); // stops the loop and the audio
  if (player.opener) player.opener.focus();
  player.opener = null;

  // How long a game held someone is the number phase 6 reads.
  track('play_end', { game: player.slug, seconds: Math.round((Date.now() - player.since) / 1000) });
  player.slug = '';
}

/* ─────────────────────────── 4. screenshots ─────────────────────────── */

/* Store apps carry their own shot list; games get theirs from the builder,
   which numbers the files it copied. */
var SHOT_SETS = {
  msb: {
    dir: 'image/magic-shield-brick/',
    count: 7,
    label: 'Magic Shield Brick'
  }
};

var shots = {
  root: null,
  img: null,
  count: null,
  list: [],
  index: 0,
  label: '',
  opener: null
};

function initShots() {
  shots.root = document.getElementById('shots');
  if (!shots.root) return;
  shots.img = document.getElementById('shotsImg');
  shots.count = document.getElementById('shotsCount');

  document.getElementById('shotsPrev').addEventListener('click', function () { stepShot(-1); });
  document.getElementById('shotsNext').addEventListener('click', function () { stepShot(1); });

  // Swipe, for the phone.
  var startX = 0;
  shots.img.addEventListener('touchstart', function (e) {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });
  shots.img.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) stepShot(dx < 0 ? 1 : -1);
  }, { passive: true });
}

function openShots(key, trigger) {
  if (!shots.root) return;
  var set = SHOT_SETS[key];
  var dir, count, label;

  if (set) {
    dir = ROOT + set.dir;
    count = set.count;
    label = set.label;
  } else {
    var g = gameBySlug(key);
    if (!g || !g.screens) return;
    dir = ROOT + 'image/games/' + g.slug + '/';
    count = g.screens;
    label = g.name;
  }

  shots.list = [];
  for (var i = 1; i <= count; i++) {
    shots.list.push(dir + pad2(i) + '.jpg');
  }
  shots.label = label;
  shots.index = 0;
  shots.opener = trigger || null;

  paintShot();
  showModal(shots.root);
  track('screens', { game: key });
}

function stepShot(delta) {
  if (!shots.list.length) return;
  shots.index = (shots.index + delta + shots.list.length) % shots.list.length;
  paintShot();
}

function paintShot() {
  shots.img.src = shots.list[shots.index];
  shots.img.alt = shots.label + ' — ' + (shots.index + 1);
  shots.count.textContent = (shots.index + 1) + ' / ' + shots.list.length;
}

function closeShots() {
  hideModal(shots.root);
  shots.img.removeAttribute('src');
  if (shots.opener) shots.opener.focus();
  shots.opener = null;
}

function pad2(n) { return (n < 10 ? '0' : '') + n; }

/* ─────────────────────────────── 5. legal ───────────────────────────── */

/* The legal texts are <details> panels on the home page. A link to one — from
   the footer, or a URL someone pasted — has to open it, otherwise the reader
   lands on a closed summary and reads nothing. */
function legalPanel(hash) {
  var id = String(hash || '').replace(/^#/, '');
  if (!id) return null;
  var el = document.getElementById(id);
  if (!el) return null;

  // Only the legal block answers to this: #top must not open a panel.
  if (el.tagName === 'DETAILS') return el;
  if (el.classList.contains('legal')) return el.querySelector('details');
  return null;
}

/* Every same-page link is scrolled by this handler rather than by the browser,
   because the browser gets two cases wrong and both read as "the menu needs
   several clicks":

     - a link whose hash is already in the URL does nothing at all, so a
       visitor who clicked Studio, scrolled away with the wheel and clicked
       Studio again stayed exactly where they were;
     - a click that lands while a previous smooth scroll is still running
       updates the hash without moving, so the page ends on the previous
       section while the URL claims the new one — and the next click on that
       link is then the no-op above.

   Scrolling ourselves also lets a legal panel open before we measure where it
   starts, which is what this handler was originally written for. */
function initLegal() {
  document.addEventListener('click', function (e) {
    // The brand link handles #top itself, and clears the hash on purpose.
    if (e.defaultPrevented) return;
    if (e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var link = e.target.closest ? e.target.closest('a[href*="#"]') : null;
    if (!link || link.target === '_blank') return;

    var href = link.getAttribute('href') || '';
    var cut = href.indexOf('#');
    var path = href.slice(0, cut);
    // A link that names another file is that browser's business, not ours.
    if (path && path !== location.pathname.split('/').pop()) return;

    var hash = href.slice(cut);
    var target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (!target) return;

    e.preventDefault();

    // A legal panel has to be open before we can know where it starts.
    var panel = legalPanel(hash);
    if (panel) panel.open = true;

    var to = panel || target;
    requestAnimationFrame(function () {
      to.scrollIntoView({ behavior: prefersMotion() ? 'smooth' : 'auto', block: 'start' });
    });

    // The hash is written once the move is over, never before it. A browser
    // that restores the scroll position saved on a history entry replays it
    // when the entry changes, on top of the scroll we have just started: the
    // page sets off toward the section, then snaps straight back where it
    // was. replaceState, not a real fragment navigation, so the section stays
    // linkable by URL without filling the back button with menu clicks.
    setTimeout(function () { history.replaceState(null, '', hash); }, 800);
  });

  // Same reason: the page places itself, so the browser must not place it.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var landed = legalPanel(location.hash);
  if (landed) {
    landed.open = true;
    requestAnimationFrame(function () { landed.scrollIntoView({ block: 'start' }); });
  }
}

/* ───────────────────────────── modal plumbing ───────────────────────── */

function showModal(root) {
  root.hidden = false;
  document.body.classList.add('locked');
  var close = root.querySelector('[data-close]');
  if (close && close.focus) close.focus();
}

function hideModal(root) {
  root.hidden = true;
  if ((!player.root || player.root.hidden) && (!shots.root || shots.root.hidden)) {
    document.body.classList.remove('locked');
  }
}

function closeTopModal() {
  if (shots.root && !shots.root.hidden) closeShots();
  else if (player.root && !player.root.hidden) closePlayer();
}

/* ──────────────────────────────── wiring ────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  lang = readLang();

  initNav();
  initPlayer();
  initShots();
  initLegal();
  initGuideSpy();
  applyLang();
  /* Once, and deliberately not from applyLang(): the cast carries no text, so
     a language toggle has nothing to rewrite there — and re-drawing it would
     swap both characters for no reason the reader can see. */
  initHeroCast();

  var toggle = document.getElementById('langToggle');
  if (toggle) toggle.addEventListener('click', toggleLang);

  /* A guide page starts its game with a plain link (tools/build/site-guide.mjs):
     it is counted like the player's "open in a new tab". */
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('[data-track-play]') : null;
    if (link) track('play_tab', { game: link.getAttribute('data-track-play'), from: 'guide' });
  });

  // A card's width moves with the window, and with it what overflows.
  var fitTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitDescs, 120);
  });

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // One delegated listener covers the generated cards and the static app cards.
  document.addEventListener('click', function (e) {
    var play = e.target.closest ? e.target.closest('[data-play]') : null;
    if (play) { openPlayer(play.getAttribute('data-play'), play); return; }

    var shot = e.target.closest ? e.target.closest('[data-shots]') : null;
    if (shot) { openShots(shot.getAttribute('data-shots'), shot); return; }

    var more = e.target.closest ? e.target.closest('[data-more]') : null;
    if (more) { openFull(more); return; }

    var less = e.target.closest ? e.target.closest('[data-less]') : null;
    if (less) {
      var back = less.closest('.game').querySelector('[data-more]');
      closeFull();
      if (back) back.focus();
      return;
    }

    if (e.target.closest && e.target.closest('[data-close]')) { closeTopModal(); return; }

    // Where the site sends people: the two stores and the mailbox.
    var link = e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;
    var href = link.getAttribute('href') || '';
    if (href.indexOf('play.google.com') > -1) track('store', { store: 'play', href: href });
    else if (href.indexOf('mailto:') === 0) track('contact', {});
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (player.root && !player.root.hidden) { closeTopModal(); return; }
      if (shots.root && !shots.root.hidden) { closeTopModal(); return; }
      if (closeFull()) return;
      closeTopModal();
      return;
    }
    if (shots.root && !shots.root.hidden) {
      if (e.key === 'ArrowLeft') stepShot(-1);
      if (e.key === 'ArrowRight') stepShot(1);
    }
  });
});
