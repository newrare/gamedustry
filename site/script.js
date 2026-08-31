/* ==========================================================================
   Newrare — site behaviour
   Vanilla JS, no dependency. Four concerns:
     1. language     FR / EN, remembered in localStorage
     2. navigation   sticky state and the mobile sheet
     3. playables    the grid, and the portrait player
     4. screenshots  the lightbox, shared by games and store apps
   ========================================================================== */
'use strict';

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
}

/* ──────────────────────────── 2. navigation ─────────────────────────── */

function initNav() {
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');

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
            '<ul class="game-tags">' + tags + '</ul>' +
          '</div>' +
        '</div>' +
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
  opener: null
};

function initPlayer() {
  player.root = document.getElementById('player');
  player.frame = document.getElementById('playerFrame');
  player.title = document.getElementById('playerTitle');
  player.open = document.getElementById('playerOpen');
}

function openPlayer(slug, trigger) {
  var g = gameBySlug(slug);
  if (!g) return;

  var url = 'games/' + slug + '/index.html';
  player.title.textContent = g.name;
  player.open.href = url;
  player.frame.src = url;
  player.frame.title = g.name;
  player.opener = trigger || null;

  showModal(player.root);
}

function closePlayer() {
  hideModal(player.root);
  player.frame.removeAttribute('src'); // stops the loop and the audio
  if (player.opener) player.opener.focus();
  player.opener = null;
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

/* ───────────────────────────── modal plumbing ───────────────────────── */

function showModal(root) {
  root.hidden = false;
  document.body.classList.add('locked');
  var close = root.querySelector('[data-close]');
  if (close && close.focus) close.focus();
}

function hideModal(root) {
  root.hidden = true;
  if (player.root.hidden && shots.root.hidden) {
    document.body.classList.remove('locked');
  }
}

function closeTopModal() {
  if (!shots.root.hidden) closeShots();
  else if (!player.root.hidden) closePlayer();
}

/* ──────────────────────────────── wiring ────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  lang = readLang();

  initNav();
  initPlayer();
  initShots();
  applyLang();

  document.getElementById('langToggle').addEventListener('click', toggleLang);

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // One delegated listener covers the generated cards and the static app cards.
  document.addEventListener('click', function (e) {
    var play = e.target.closest ? e.target.closest('[data-play]') : null;
    if (play) { openPlayer(play.getAttribute('data-play'), play); return; }

    var shot = e.target.closest ? e.target.closest('[data-shots]') : null;
    if (shot) { openShots(shot.getAttribute('data-shots'), shot); return; }

    if (e.target.closest && e.target.closest('[data-close]')) { closeTopModal(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeTopModal(); return; }
    if (!shots.root.hidden) {
      if (e.key === 'ArrowLeft') stepShot(-1);
      if (e.key === 'ArrowRight') stepShot(1);
    }
  });
});
