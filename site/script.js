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

function readLang() {
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

function applyLang() {
  var nodes = document.querySelectorAll('[data-fr][data-en]');
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].textContent = nodes[i].getAttribute('data-' + lang);
  }
  document.documentElement.lang = lang;

  // The toggle advertises the language it switches to, not the current one.
  var toggle = document.getElementById('langToggle');
  if (toggle) toggle.textContent = lang === 'fr' ? 'EN' : 'FR';

  renderGames();
}

function toggleLang() {
  lang = lang === 'fr' ? 'en' : 'fr';
  saveLang(lang);
  applyLang();
  track('lang', { lang: lang });
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

/* ──────────────────────────── 3. playables ──────────────────────────── */

var games = (window.GAMES || []).filter(function (g) {
  // The builder marks which games actually have artwork on disk. Outside the
  // build (opening site/index.html raw) nothing is marked, so show them all.
  return g.icon !== false;
});

function renderGames() {
  var grid = document.getElementById('gamesGrid');
  if (!grid) return;

  var html = '';
  for (var i = 0; i < games.length; i++) {
    var g = games[i];
    var copy = g[lang] || g.en;
    var tags = '';
    for (var t = 0; t < copy.tags.length; t++) {
      tags += '<li>' + escapeHtml(copy.tags[t]) + '</li>';
    }

    var shots = g.screens > 0
      ? '<button class="btn btn-ghost btn-sm" type="button" data-shots="' + g.slug + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v9l4-4 3 3 4-5 3 4V7H5z"/></svg>' +
        (lang === 'fr' ? 'Captures' : 'Screens') +
        '</button>'
      : '';

    html +=
      '<article class="game" style="--g1:' + g.accent[0] + ';--g2:' + g.accent[1] + '">' +
        '<div class="game-top">' +
          '<img class="game-icon" src="image/games/' + g.slug + '/icon.png" alt="" width="66" height="66" loading="lazy">' +
          '<div class="game-id">' +
            '<h3>' + escapeHtml(g.name) + '</h3>' +
          '</div>' +
        '</div>' +
        '<ul class="game-tags">' + tags + '</ul>' +
        '<p class="game-desc">' + escapeHtml(copy.tagline) + '</p>' +
        '<div class="game-actions">' +
          '<button class="btn btn-primary btn-sm" type="button" data-play="' + g.slug + '">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            (lang === 'fr' ? 'Jouer' : 'Play') +
          '</button>' +
          shots +
        '</div>' +
      '</article>';
  }

  grid.innerHTML = html;

  var count = document.getElementById('statGames');
  if (count) count.textContent = String(games.length);
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
  var url = 'games/' + slug + '/index.html?lang=' + lang;
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
    dir = set.dir;
    count = set.count;
    label = set.label;
  } else {
    var g = gameBySlug(key);
    if (!g || !g.screens) return;
    dir = 'image/games/' + g.slug + '/';
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
  applyLang();

  var toggle = document.getElementById('langToggle');
  if (toggle) toggle.addEventListener('click', toggleLang);

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // One delegated listener covers the generated cards and the static app cards.
  document.addEventListener('click', function (e) {
    var play = e.target.closest ? e.target.closest('[data-play]') : null;
    if (play) { openPlayer(play.getAttribute('data-play'), play); return; }

    var shot = e.target.closest ? e.target.closest('[data-shots]') : null;
    if (shot) { openShots(shot.getAttribute('data-shots'), shot); return; }

    if (e.target.closest && e.target.closest('[data-close]')) { closeTopModal(); return; }

    // Where the site sends people: the two stores and the mailbox.
    var link = e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;
    var href = link.getAttribute('href') || '';
    if (href.indexOf('play.google.com') > -1) track('store', { store: 'play', href: href });
    else if (href.indexOf('mailto:') === 0) track('contact', {});
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeTopModal(); return; }
    if (shots.root && !shots.root.hidden) {
      if (e.key === 'ArrowLeft') stepShot(-1);
      if (e.key === 'ArrowRight') stepShot(1);
    }
  });
});
