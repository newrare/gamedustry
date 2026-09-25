/*
  webshell — the front end the `web` target adds on top of the motor.

  Loaded only by `node tools/build/build.mjs --target=web`. It reads the motor
  through window.__WEB__, which the web build injects into the bootstrap; on a
  playable build neither this file nor that object exists. The motor itself
  knows nothing about it: a target adds its own layer, it never patches the
  motor. That handle is a plain list of references — every behaviour below is
  the web front end's own, so this is the one file to edit to change how a
  finished game presents itself, and all thirteen change together.

  What it turns the intro into — one shape for every game:

    the game's backdrop    the painted background the game already embeds
                           (ASSETS.images.bg, from assets/image/master/) behind the
                           menu, or — for a game that ships no picture — the
                           very gradient its SKIN paints the game view with.
                           Nothing of the world is drawn: no entity, no
                           Game.reset(), so the menu cannot break on what a
                           game does outside a round.
    the title, breathing   the SKIN's own #intro-title, wrapped in a node the
                           webshell animates so the game's look is untouched
    a menu, bottom right   PLAY / LEADERBOARD / OPTIONS / HELP, stacked, flush
                           right. PLAY is the motor's own #btn-start, so the
                           click path and the SPACE key are unchanged. A game
                           that declares `web.modes` in its manifest gets one
                           more entry per extra mode under PLAY (section 1b).
    a bed over all of it   the same track the round plays, as its own quiet,
                           slower section of the file — CONFIG.music.menu
                           (section 1b). A game that names none keeps silent
                           menus, and nothing else about it changes.
    panels in that band    LEADERBOARD / OPTIONS / HELP swap the menu out
                           without leaving the intro: same title, same scene,
                           a back arrow to come back — and one or two of the
                           game's own painted objects around the card, which
                           the motor's Decor module places (shell.js).

  And what it adds to the ROUND — the two things a playable has no use for
  (section 5b): MENU and OPTIONS, in the bottom-right corner, where the menu's
  own entries are and where a thumb already is. The HUD stays the game's, all of
  it, and nothing about the round moves for them. Either control pauses the
  round — the clock is the loop's, so freezing the loop freezes it — and opens
  one card over the frozen world: the same options rows the menu shows, or the
  one question that throws a run away. ESCAPE is that pause on a keyboard.

  Every display size is measured rather than re-tuned, by the motor's own `Fit`
  (shell.js): the intro title, the end title and the end score are scaled down
  until they fit the frame, because a game's own face and a French string are
  both wider than what the motor's px were eyeballed against. This file only
  gives it the one measurement the web layout changes (section 6b).

  The type is the game's own too: `web.font` in the manifest names a family of
  assets/motor/font/ (all OFL), which the builder embeds in front of the SKIN with two
  tokens this file reads — `--web-font` and `--web-fw`, the weight to ask a
  single-weight face for.

  OPTIONS is real, not a placeholder: music, sound effects and score callouts
  are switches the motor now carries (Sound.setMuted, Music.setMuted,
  Pop.setEnabled), the language is FR/EN, and the leaderboard can be wiped.
  Everything is persisted through Store, which is first-party localStorage on
  the site — the reason the settings belong to this target and not to the
  playable (see docs/INDUSTRIALIZATION.md).

  An online leaderboard and progression are still packages/meta (phase 5); the
  best score shown here is the one the motor has always written on endRound.

  ES5-ish on purpose, like the motor: this runs in the same mobile WebViews.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  if (!W) return;                       // not a web build

  var CONFIG = W.CONFIG;

  /* The level layer, published by packages/webshell/levels.js — which the
     builder loads immediately before this file. It is inert for a game that
     declares no `web.levels` in its manifest, and `LV.active()` is then false
     everywhere below: that game's menu is exactly what it was. */
  var LV = window.__LEVELS__ || null;
  function levelled() { return !!(LV && LV.active()); }

  /* The village, published by packages/webshell/village.js — which the builder
     loads immediately AFTER this file, so it is read lazily rather than
     captured here. A game that declares no `web.village` never has one, and
     everything below falls back to what it did before. */
  function VG() { return window.__VILLAGE__ || null; }
  function villaged() { return !!VG(); }

  /* The barracks, published by packages/webshell/army.js, which the builder
     loads after this file for the same reason the village is — so it is read
     lazily too. A game that declares no `web.army` never has one, and its four
     doors are simply never built. */
  function AR() { return window.__ARMY__ || null; }
  function armied() { var a = AR(); return !!(a && a.active()); }

  /* WHAT PLAY OPENS, IN ONE PLACE. Three answers and they are a chain, not a
     switch: a village is the place the player lives, a map is what a levelled
     game without one opens, and a round is what is left. The menu entry, the
     SPACE key and the way back from a score all ask this. */
  function front() {
    if (villaged()) { VG().open(); return; }
    if (levelled()) { LV.open(); return; }
    W.start();
  }
  /* THE ENTRY IS NAMED AFTER WHERE IT GOES, which is why it says LEVELS on a
     levelled game and PLAY everywhere else — and PLAY again where a village
     is what it opens: the map is one building of that place and naming the
     door after one room in it is worse than not naming it at all. */
  function frontLabel() {
    if (villaged()) return COPY.play;
    if (levelled()) return LV.text("levelsEntry");
    return COPY.play;
  }

  /* The view system — what a screen is, what a card is, and the stack both
     live in (packages/webshell/view.js). It is loaded first of the web layer
     and is never absent from a web build, so nothing below guards against it:
     the title screen, the map, the album, the shop, the ranking and the score
     are the six views, and options, help, leaving a round, a daily reward, an
     ad and a prize are the six cards. */
  var VW = window.__VIEW__;
  var MD = window.__MODAL__;

  /* The meta layer — what the player owns, and what brings them back
     (packages/webshell/meta.js, album.js, daily.js). Published the same way
     the map is, inert for a game with no `web.meta` block, and `metaed()` is
     then false everywhere below: that game's menu is exactly what it was. */
  var MT = window.__META__ || null;
  var AL = window.__ALBUM__ || null;
  var DL = window.__DAILY__ || null;
  function metaed() { return !!(MT && MT.active()); }

  /* ── 0. strings ───────────────────────────────────────────────────────── */

  /* Every string the web shell adds, in the languages it ships. The motor's
     own CONFIG.copy is left alone: a playable build still needs its store
     wording, and only what the web target adds is translated here. */
  var STRINGS = {
    en: {
      play: "Play", leaderboard: "Leaderboard", options: "Options", help: "Help",
      scoresTitle: "Leaderboard", optionsTitle: "Options", helpTitle: "How to play",
      best: "Best score", noScore: "No round played yet.",
      soonScores: "An online leaderboard is coming with the next update.",
      music: "Music", sfx: "Sound effects", pops: "Score callouts", language: "Language",
      labels: "Name the buildings",
      wipeData: "Erase all game data",
      wipeAsk: "Tap again — progress, stickers and scores are lost",
      wipeDone: "Game data erased",
      controls: "Controls",
      tap: "Tap", hold: "Hold", drag: "Drag", swipe: "Swipe", aim: "Aim",
      close: "Close", again: "Play again", menu: "Menu",
      toMenu: "Back to the menu", toVillage: "Back to the village", resume: "Resume",
      leaveTitle: "Leave?",
      leaveNote: "The round ends here and its score is lost.",
      leaveYes: "Leave"
    },
    fr: {
      play: "Jouer", leaderboard: "Classement", options: "Options", help: "Aide",
      scoresTitle: "Classement", optionsTitle: "Options", helpTitle: "Comment jouer",
      best: "Meilleur score", noScore: "Aucune partie jouée.",
      soonScores: "Un classement en ligne arrive avec la prochaine mise à jour.",
      music: "Musique", sfx: "Effets sonores", pops: "Messages de score", language: "Langue",
      labels: "Nommer les bâtiments",
      wipeData: "Effacer toutes les données du jeu",
      wipeAsk: "Touchez à nouveau — progression, stickers et scores sont perdus",
      wipeDone: "Données du jeu effacées",
      controls: "Contrôles",
      tap: "Taper", hold: "Maintenir", drag: "Glisser", swipe: "Balayer", aim: "Viser",
      close: "Fermer", again: "Rejouer", menu: "Menu",
      toMenu: "Retour au menu", toVillage: "Retour au village", resume: "Reprendre",
      leaveTitle: "Quitter ?",
      leaveNote: "La partie s’arrête ici et son score est perdu.",
      leaveYes: "Quitter"
    }
  };

  /* Which of them the screen SHOUTS. Every string above is written in normal
     case, like the rest of the repo; the ones listed here are set in capitals
     on their way out by the motor's `upper` (packages/engine), which also
     takes the accents off — "Contrôles" reads CONTROLES, never CONTRÔLES. A
     game's own override of one of these keys is shouted with it, and so is a
     mode label, whose key the manifest spells `mode<Key>`. */
  var CAPS = {
    play: 1, leaderboard: 1, options: 1, help: 1,
    scoresTitle: 1, optionsTitle: 1, helpTitle: 1, best: 1, controls: 1,
    tap: 1, hold: 1, drag: 1, swipe: 1, aim: 1,
    again: 1, menu: 1, resume: 1, leaveTitle: 1, leaveYes: 1
  };
  var up = W.upper;
  function shouted(key) { return CAPS[key] || key.indexOf("mode") === 0; }

  var LANG_KEY = "webLang";

  /* Which language, in order: the player's own choice in OPTIONS (persisted,
     so it survives a reload and wins over everything), then ?lang=fr in the
     URL — the site plays a game in an iframe and passes the page's own choice
     that way — then CONFIG.web.lang from the manifest, then the browser. An
     unknown code falls back to English rather than showing half a translation. */
  function pickLang() {
    var saved = W.Store.get(LANG_KEY, null);
    if (saved && STRINGS[saved]) return saved;
    var m = /[?&]lang=([A-Za-z-]{2,5})/.exec(location.search);
    var want = m ? m[1] : ((CONFIG.web && CONFIG.web.lang) || navigator.language || "en");
    want = String(want).toLowerCase().slice(0, 2);
    return STRINGS[want] ? want : "en";
  }

  /* The game has the last word through CONFIG.web.copy, which the web build
     fills from the manifest. Two shapes, both useful:
       copy: { play: "GO" }                 one wording, every language
       copy: { fr: { play: "GO" } }         one wording per language
     `tagline` is a string like any other here: it is what the Help panel
     shows, so a game translates its own one-liner with the same hook. */
  function resolveCopy(lang) {
    var out = {};
    function merge(src) {
      if (!src) return;
      for (var key in src) if (src.hasOwnProperty(key)) out[key] = src[key];
    }
    merge(STRINGS.en);                       // the complete set, always
    merge(STRINGS[lang]);
    var over = (CONFIG.web && CONFIG.web.copy) || {};
    merge(over[lang] && typeof over[lang] === "object" ? over[lang] : over);
    for (var k in out) if (out.hasOwnProperty(k) && shouted(k)) out[k] = up(out[k]);
    return out;
  }

  /* The game's own words, in the player's language: a dictionary keyed by the
     English string, written in the manifest under `web.copy.<lang>.strings`
     and handed to the motor, which applies it wherever it writes a word (see
     Lang in packages/engine). English is the source, so it has no dictionary
     and needs none. */
  function dictFor(lang) {
    var over = (CONFIG.web && CONFIG.web.copy) || {};
    var per = over[lang];
    return (per && typeof per === "object" && per.strings) || null;
  }

  /* Everything the motor wrote once and would otherwise keep in English: the
     six CONFIG.copy nodes and the two HUD pills. Callouts, the end screen and
     the rest are translated as they are written, so they need nothing. */
  function applyLang(lang) {
    W.Lang.set(lang, dictFor(lang));
    W.applyCopy();
    W.HUD.relabel();
  }

  var LANG = pickLang();
  var COPY = resolveCopy(LANG);

  /* ── 1. settings ──────────────────────────────────────────────────────── */

  /* Four switches and a language, in one Store key. The three about sound and
     callouts default to ON — a player who never opens OPTIONS gets the game as
     designed — and the stored object is only ever read through these accessors
     so an old key missing a field cannot turn a feature off by accident.

     THE FOURTH IS THE ONE THAT DEFAULTS OFF. `labels` writes the role's word
     under every building of a VILLAGE, and a village is meant to be read as a
     place: six plates over six buildings turn it back into the list it
     replaced. So it is asked for rather than given, and then it is kept. */
  var Settings = (function () {
    var KEY = "webSettings";
    var saved = W.Store.get(KEY, null) || {};
    var val = {
      music: saved.music !== false,
      sfx:   saved.sfx   !== false,
      pops:  saved.pops  !== false,
      labels: saved.labels === true
    };
    /* The motor holds the truth: these three calls are the whole integration,
       and they are no-ops on a playable because nothing there ever calls them.
       The fourth is the village's, and only a game that has one is listening. */
    function apply() {
      /* Armed before the switch, never after: a bed turned back ON from the
         menu has to come back on the menus' own section (section 1b) rather
         than on whatever the last round played. From the pause card the state
         is "playing" and the round's section is the one already armed. */
      if (menuBed() && W.state() === "intro") W.Music.arm(menuBed());
      W.Sound.setMuted(!val.sfx);
      W.Music.setMuted(!val.music);
      W.Pop.setEnabled(val.pops);
      if (window.__VILLAGE__) window.__VILLAGE__.setLabels(val.labels);
    }
    function set(key, on) {
      val[key] = !!on;
      W.Store.set(KEY, val);
      apply();
    }
    return { get: function (k) { return val[k]; }, set: set, apply: apply };
  })();

  /* ── 1b. the bed over the menus ───────────────────────────────────────── */

  /* A playable's music starts with the round: there is nothing in front of it
     but an ad's title card. A finished game has a menu, a map, three panels
     and a pause card in front of that round, and silence over all of them
     reads as a build with its audio broken.

     So the menus get a bed of their own, and it is the SAME FILE the round
     plays — one quiet, slower window of it, which the game names in
     CONFIG.music.menu and the motor plays as a section (see Music.play in
     packages/engine/engine.js):

       music: { volume: 0.11, fade: 1.8,
                menu: { from: 0, length: 40, rate: 0.85, gain: 0.5 } }

     A game that declares no `menu` section keeps exactly what it had: this
     whole part is inert, and its menus stay silent.

     Nothing may play before a gesture — a context created on load is suspended
     and resume() is refused until the player touches something — so the bed is
     armed on the first pointer or key on the page, and then follows the
     screens. */
  var bedOut = false;                      // the first gesture has happened

  function menuBed() { return (CONFIG.music || {}).menu || null; }

  /* Back to the menu's own section. Starts the bed when nothing is playing
     yet, crossfades when the round's section is; asking twice for the same
     section is a no-op, so every arrival on the menu can call it. */
  function toMenuBed() {
    var sec = menuBed();
    if (!sec || !bedOut) return;
    W.Music.play(sec);
    W.Music.unduck();
  }

  function letBedOut() {
    if (bedOut || !menuBed()) return;
    bedOut = true;
    W.Sound.unlock();                      // we are inside the gesture: iOS is happy
    if (W.state() === "intro") toMenuBed();
  }

  function bindBed() {
    if (!menuBed()) return;
    var go = function () {
      letBedOut();
      window.removeEventListener("pointerdown", go, true);
      window.removeEventListener("keydown", go, true);
    };
    window.addEventListener("pointerdown", go, true);
    window.addEventListener("keydown", go, true);
  }

  /* ── 1b. game modes ───────────────────────────────────────────────────── */

  /* Most games have one mode and never touch any of this. A game that has
     several lists them in its manifest, in the order the menu shows them:

       "web": { "modes": ["eclipse", "classic"] }        // none ships two today

     The FIRST is the default — it is what PLAY starts, and what the menu goes
     back to on every return from a round — and each of the others gets an
     entry of its own right under PLAY, labelled from `web.copy` under
     `mode<Key>` ("modeClassic") and falling back to the key in caps.

     The contract with the game is one field: the web shell writes the chosen
     key to CONFIG.mode before the round starts, and the game reads it when it
     resets (`games/radiam` picks its eclipse there). The motor knows nothing
     about modes, and a game with no `web.modes` never sees the field at all. */
  var MODES = (CONFIG.web && CONFIG.web.modes) || [];

  function modeCopyKey(name) {
    return "mode" + name.charAt(0).toUpperCase() + name.slice(1);
  }

  /* PLAY, the SPACE key and PLAY AGAIN all start whatever is armed, so the
     default is armed on arrival at the menu rather than on a click: there is
     then no path that can launch a mode the player did not pick. */
  function armMode(name) { if (MODES.length) CONFIG.mode = name; }

  /* ── 2. dom helpers ───────────────────────────────────────────────────── */

  function $(id) { return document.getElementById(id); }
  function frame() { return $("frame"); }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* Pictograms from the shared assets/motor/lucide/ pack, inlined as SVG rather than
     drawn through Icon (which is canvas-only). Stroked with currentColor, so a
     row's colour is the only thing that dresses them. */
  var ICON = {
    back:  '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    next:  '<path d="m12 5 7 7-7 7"/><path d="M5 12h14"/>',
    music: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
    sfx:   '<path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/>',
    pops:  '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
    lang:  '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
    reset: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    home:  '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    map:   '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    help:  '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    tag:   '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    gear:  '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',

    /* The meta layer's six. Same pack, same stroke: the album, the machine and
       the shop are screens of this shell and not a product of their own, so
       they are drawn with the pictograms the menu already uses. */
    coin:   '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>',
    /* The super ticket is a PAINTED piece and nothing else — a rainbow one
       where the ordinary ticket is blue (CONFIG.shellArt.ticketSuper). This
       entry is only what a build with no artwork falls back to, and it falls
       back to the same stroke: two tickets told apart by a colour cannot be
       told apart by a line, and the shop card names both. */
    ticketSuper: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>',
    sticker:'<path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/><path d="M8 13h.01"/><path d="M16 13h.01"/><path d="M9 17s1 1 3 1 3-1 3-1"/>',
    store:  '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
    gift:   '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    xp:     '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    flame:  '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    play:   '<polygon points="6 3 20 12 6 21 6 3"/>',
    check:  '<path d="M20 6 9 17l-5-5"/>',
    lock:   '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    star:   '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',

    /* THE BARRACKS' OWN FOUR (packages/webshell/army.js). Same pack and the
       same stroke as the rest of them: a roster, an infirmary, a prison and a
       recruiting tent are screens of this shell, not a product of their own. */
    deck:   '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
    heal:   '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
    clock:  '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    recruit:'<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
    /* an officer's FILE — the card turned over to read who it is */
    file:   '<path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/>',
    /* the camp's MISSIONS: where a squad goes, the odds it comes back, and
       what a failure costs */
    compass:'<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    /* the band's fold (meta.js, section 11b): what a game adds to the
       wallet, behind one chip */
    sword:  '<path d="m11 19-6-6"/><path d="m5 21-2-2"/><path d="m8 16-4 4"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"/>',
    skull:  '<path d="m12.5 17-.5-1-.5 1h1z"/><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="12" r="1"/>'
  };

  /* THE PAINTED INSTRUMENT, when the build carries one. A game with a
     `web.meta` block ships the shell's own artwork as CONFIG.shellArt (see
     tools/build/build.mjs), and four of those pieces are named after the
     pictograms above — `coin`, `xp`, `star`, `ticket`. Where the art exists it
     is drawn instead of the stroke, in the same box, so every width/height
     rule in the three stylesheets still aims at it.

     It is ONE swap, here, and not a call site each: the wallet, the shop, the
     album, the daily road and the level map all ask for their pictogram
     through this function, so they all turn painted together and a build with
     no artwork — a playable, a game with no wallet — keeps the stroke without
     a branch anywhere else.

     `art-i` is what the stylesheets hang the painted case off, because an
     <img> takes no `currentColor`: a row that USED to dress its pictogram by
     colour now has one that carries its own. */
  function icon(name, cls) {
    var art = CONFIG.shellArt && CONFIG.shellArt[name];
    if (art) {
      return '<img class="' + (cls || "ico") + ' art-i" src="' + art +
             '" alt="" aria-hidden="true">';
    }
    return '<svg class="' + (cls || "ico") + '" viewBox="0 0 24 24" fill="none" ' +
           'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
           'stroke-linejoin="round" aria-hidden="true">' + ICON[name] + "</svg>";
  }

  /* The pieces no pictogram is named after — a bag of coins, a starburst, a
     trophy. A screen asks for one of these when the stroke it would replace
     never existed: "an amount of money" is not the coin icon twice, and the
     board a player finished is not a star. Null when the build has no artwork,
     and every caller has something to fall back to. */
  function artImg(role, cls) {
    var src = CONFIG.shellArt && CONFIG.shellArt[role];
    if (!src) return null;
    return '<img class="' + (cls || "ico") + ' art-i" src="' + src +
           '" alt="" aria-hidden="true">';
  }

  /* Drop every listener a node carries by replacing it with its own clone.
     The shell looks its buttons up by id on each use, so the swap is invisible
     to it — and it is the only way to unhook Ad.openStore without the motor
     growing a web-only branch. */
  function unbind(id) {
    var old = $(id), fresh = old.cloneNode(true);
    old.parentNode.replaceChild(fresh, old);
    return fresh;
  }

  /* ── 3. the background ────────────────────────────────────────────────── */

  /* The menu is dressed with the game's own backdrop, in that order:

       0. the painted screen the MOTOR already put there. `assets/image/embed/<slug>-
          background-phone.webp` reaches every target through CONFIG.art, and
          the shell inserts it as `.screen-art` on the intro and the end screen
          (see packages/shell/shell.js, Art.dress). When it is there the menu
          has nothing to do: menu.css drops the layer's own scrim in favour of
          the one below, which is cut for this layout — a band under the title,
          a band under the menu, a gradient down the right edge — and re-anchors
          it under this file's stack. That is the case for all thirteen games;
       1. otherwise a picture the game embeds itself — `ASSETS.images.bg` (or
          `bg1`), the backdrop it draws behind its own world;
       2. otherwise the game view's own CSS background — the radial gradient the
          SKIN sets on `html, body` — read off the page and re-applied to the
          frame, which anchors it to the 720x1280 design space instead of to
          the window.

     Nothing of the world itself is drawn: no entity, no `Game.reset()`, so a
     menu cannot depend on what a game does outside a round. */
  function dressBackground() {
    var box = $("web-bg");
    if (!box) return;
    /* The motor's own painted layer wins, and it is already in the DOM: the
       bootstrap's DOMContentLoaded handler runs before this file's. */
    if ($("screen-intro").querySelector(".screen-art")) {
      box.parentNode.removeChild(box);
      return;
    }
    var images = (W.ASSETS && W.ASSETS.images) || {};
    var src = images.bg || images.bg1 || null;
    if (src) {
      box.style.backgroundImage = "url(" + src + ")";
      return;
    }
    /* No picture: take the gradient the game paints the page with. Reading it
       back off the body is what keeps this one line per game instead of a
       table the SKINs would have to stay in sync with. */
    var cs = window.getComputedStyle(document.body);
    if (cs.backgroundImage && cs.backgroundImage !== "none") box.style.backgroundImage = cs.backgroundImage;
    box.style.backgroundColor = cs.backgroundColor;
    box.className = "flat";                 // a gradient is not cover-fitted
    /* A gradient is already dark and even, so the scrim that a painted
       backdrop needs would only flatten it: the intro says so in a class. */
    $("screen-intro").classList.add("web-flat");
  }

  /* ── 4. the intro: head, menu, panel band ─────────────────────────────── */

  /* THE TITLE SCREEN IS A SPLASH WHERE THERE IS A VILLAGE. A hub already shows
     every door as a building standing on a painted scene, so the stacked menu
     in front of it was the same list twice — read once, at speed, by a player
     on their way somewhere else. What is left of the title screen is the one
     thing it was always for: the logotype on the game's own scene, the studio
     signature in the corner, and two seconds of it.

     The menu's nodes are still BUILT — hidden, never removed. `#btn-start` is
     the motor's own node and every binding this shell has ever put on it
     (startGame, the SPACE key, Sound.unlock()'s gesture) rides on it being
     where the motor put it, and a language change is still a loop over the
     entries it wrote. Nothing but the display changes.

     A game with no village keeps the menu it has: it has nowhere else to put
     the doors, and the daily road it carries is a line of that menu. */
  function splash() { return villaged(); }

  /* How long the front door stands open. Two seconds is a look at the
     logotype, not a wait: the village is where the session actually starts. */
  var SPLASH_MS = 2000;

  /* THE TWO SECONDS THEMSELVES. They are armed on the FIRST arrival on the
     title screen — which is when the motor has finished preloading, not when
     this file mounted — and never again: every later return to `intro` comes
     out of a round and lands on the village that is still standing under it
     (View.floor leaves the title screen alone, packages/webshell/view.js).

     A player quicker than the timer is left where they went: SPACE already
     opens the village from here, and the guard is the same three questions the
     key asks — still on the title screen, no view open, no card open. */
  var splashArmed = false;

  function armSplash() {
    if (!splash() || splashArmed) return;
    splashArmed = true;
    setTimeout(function () {
      if (W.state() !== "intro" || VW.depth() || MD.any()) return;
      front();
    }, SPLASH_MS);
  }

  var view, menu;
  var items = [];              // the menu entries, so a language change is a loop
  var demoHome;                // where the motor's demo stage sleeps

  /* ---- the face on the front door ----------------------------------------
     THE THREE CHARACTERS ARE THE ONE PIECE OF A GAME'S ARTWORK THE TITLE
     SCREEN NEVER SHOWED. They were painted for the end screen, where the star
     count picks which of them the player gets — and that verdict is the whole
     reason there are three. A title screen has no round behind it to judge, so
     it has no verdict either: the face is picked AT RANDOM between the happy
     and the neutral one, once per load.

     Random and not "the happy one" on purpose. A splash is two seconds long
     and a player opens the game hundreds of times; one fixed picture becomes
     part of the logotype and stops being looked at, where two that take turns
     keep the front door a place with somebody in it. The sad face stays the
     end screen's: it is the verdict on a lost round, and a door that greets a
     player with it reads as a reproach for something they have not done yet.

     It is read through the motor's own `Art`, so a game with no painted
     character puts nothing on the screen and the title is exactly what it was
     (the template, and any game whose artwork has not landed). */
  var FACES = ["characterHappy", "characterNeutral"];

  function faceNode() {
    if (!W.Art) return null;
    var pool = [], i, src;
    for (i = 0; i < FACES.length; i++) {
      src = W.Art.src(FACES[i]);
      if (src) pool.push(src);
    }
    if (!pool.length) return null;
    var img = document.createElement("img");
    img.id = "web-char";
    img.alt = "";
    img.draggable = false;
    img.src = pool[Math.floor(Math.random() * pool.length)];
    return img;
  }

  function buildIntro() {
    var intro = $("screen-intro");

    var bg = el("div"); bg.id = "web-bg";
    intro.appendChild(bg);

    /* Straight after the backdrop and before everything else: the intro paints
       its children in document order, so the logotype, the menu and the studio
       signature all land ON the face rather than under it — the same rule the
       end screen's character is placed by (packages/shell/shell.js). */
    var face = faceNode();
    if (face) intro.appendChild(face);

    /* The title keeps its own node — and therefore its SKIN — and gains a
       wrapper the stylesheet breathes. The icon rides along when a game has
       one; the motor already hid it when it does not. */
    var head = el("div"); head.id = "web-head";
    var wrap = el("div"); wrap.id = "web-title-wrap";
    wrap.appendChild($("app-icon"));
    wrap.appendChild($("intro-title"));
    head.appendChild(wrap);
    intro.appendChild(head);

    /* Where the demo stage lives while Help is closed: hidden, still inside
       the intro, so nothing has to remember its markup. */
    demoHome = el("div"); demoHome.id = "web-demo-home"; demoHome.hidden = true;
    intro.appendChild(demoHome);
    parkDemo();

    view = el("div"); view.id = "web-view";
    view.appendChild(buildMenu());
    intro.appendChild(view);

    /* The scrim is cut for a menu down the right edge, and there is none here:
       the class is what drops that band, so the scene keeps its own right
       half under a title and a signature (menu.css). */
    if (splash()) intro.classList.add("web-splash");
  }

  function buildMenu() {
    menu = el("nav"); menu.id = "web-menu";
    /* Hidden rather than absent: see splash() above — the nodes below are what
       the rest of this file, and the village, are written against. */
    menu.hidden = splash();

    /* PLAY is the motor's node, restyled: keeping it is what keeps startGame,
       the SPACE key and Sound.unlock()'s user gesture exactly as they were.

       A game with levels puts the MAP between the menu and the round instead
       (docs/LEVELS.md), so the motor's own listener comes off and the map's
       PLAY button becomes the click that starts a round — still one click, so
       the audio unlock still happens inside the gesture that asked for it. */
    var takeover = levelled() || villaged();
    var start = takeover ? unbind("btn-start") : $("btn-start");
    start.className = "web-item";
    start.textContent = frontLabel();
    if (takeover) start.addEventListener("click", front);
    items.push({ node: start, key: "play", lv: (!villaged() && levelled()) ? "levelsEntry" : null });
    menu.appendChild(start);

    /* The extra modes, one entry each, under PLAY: they arm their own key and
       then take the very same start path, so the audio unlock still happens
       inside the click that asked for a round. */
    MODES.slice(1).forEach(function (name) {
      var key = modeCopyKey(name);
      var b = el("button", "web-item web-mode", COPY[key] || up(name));
      b.addEventListener("click", function () {
        armMode(name);
        if (levelled()) LV.clear();      // a mode entry is a free run, not a level
        W.start();
      });
      items.push({ node: b, key: key, alt: up(name) });
      menu.appendChild(b);
    });

    /* The collection, under PLAY and above the rest: it is a place the player
       GOES, like the map, where the three below are panels that open over the
       menu. A game with no `web.meta` does not have it.

       THE SHOP IS NOT A TITLE ENTRY. It is a till, not a destination: it is
       opened from the coins the player is looking at — the map's wallet chip —
       and from the album, where a missing sticker is the reason to want a
       ticket. A sixth line on the title screen selling something is the one
       shape thirteen games in one voice should not take. */
    /* THE DAILY ROAD, between the map and the collection. It is a line of this
       menu and not a banner over the title: the title screen's top half is the
       game's logotype and the scene behind it, and a strip parked there was a
       second thing competing with the one thing that sells the game. Down
       here it reads as what it is — a place to go, like the two lines it sits
       between — and it is within a thumb's reach of them. */
    /* ...AND NOT ON A SPLASH. A village has a BUILDING for the daily gift, so
       the strip would be the road drawn twice, on a screen nobody stays on for
       two seconds. daily.js needs no node on screen for the door to pay out
       (DL.openToday), so it is simply never asked for one. */
    if (metaed() && DL && DL.active() && !splash()) {
      var road = DL.node();
      if (road) menu.appendChild(road);
    }

    if (metaed()) {
      var b = el("button", "web-item web-meta", MT.text("stickersEntry"));
      b.addEventListener("click", function () { AL.open(); });
      items.push({ node: b, mt: "stickersEntry" });
      menu.appendChild(b);
    }

    /* THE RANKING IS A PLACE, THE OTHER TWO ARE CARDS. It was three panels of
       this same band before, which made "where the player stands" the same
       kind of thing as a volume switch. It is not: it is a screen with a
       header, like the map and the album, and it is the only one of the three
       that has anything to show. Options and help open over whatever is on
       screen — here, and from the corner of every other surface. */
    [["rank", "leaderboard", function () { VW.go("ranking"); }],
     ["options", "options", function () { openOptions(true); }],
     ["help", "help", openHelp]]
      .forEach(function (entry) {
        var b = el("button", "web-item", COPY[entry[1]]);
        b.addEventListener("click", entry[2]);
        items.push({ node: b, key: entry[1] });
        menu.appendChild(b);
      });
    return menu;
  }

  /* ── 4b. the card every modal of this shell is drawn on ──────────────── */

  /* ONE SHAPE. Options, help and the question that throws a round away were
     three different things in two files — two panels swapped into the title
     band and a card over the frozen world — and they are one thing now: a
     head with a back arrow and a title, a body of rows, and the view system's
     own modal under both (packages/webshell/view.js).

     The body keeps `web-pbody` so every row, switch and segment already
     written against it still lands, and `plain` drops the card-inside-a-card
     the panel version needed when it stood on the scene rather than on a
     modal of its own. */
  function cardPanel(body, fill) {
    /* NO CROSS, and no head: the title is the card's own slot and the way out
       is the tap line under the rows, which says a tap beside the card closes
       it (packages/webshell/view.js, `dismiss: "outside"`). A cross was a
       second answer to a question that line already answers. */
    var rows = el("div", "web-pbody plain");
    fill(rows);
    body.appendChild(rows);
  }

  /* What is open, and how to build it again: a language change rewrites the
     screen instead of reloading it, and a card is part of the screen. */
  var openCard = null;

  /* A card that opens OVER A ROUND pauses it, and a card that opens anywhere
     else does not — same card either way, which is the point. The clock is the
     loop's, so freezing the loop freezes the round, the world and the timer in
     one call, and the game's own update never runs under an open card. */
  function panelModal(kind, title, fill, again, foot) {
    var pausing = W.state() === "playing" && !(W.ending && W.ending());
    if (pausing) pause();
    var h = MD.open({
      kind: "web-card " + kind,
      title: title,
      /* NOT dismissed by a tap ON it: every one of these cards has controls
         on it, and a switch missed by a thumb would put the card away
         instead. A tap AROUND it does, and the tap line says so; the key
         closes it too — that is what `esc` is for. */
      dismiss: "outside", esc: true,
      fill: function (body, close, handle) {
        cardPanel(body, fill);
        var card = handle.card;
        /* One of the game's own painted objects beside the card. A card is the
           plainest thing this shell draws — a list of rows — and the scene
           behind it is pushed back by the scrim precisely where the card is,
           so this is where a picture is worth the most. NOT top-left: the head
           is inside the card now and that is where the back arrow is, so a
           piece there is a picture over a control. Not bottom-right either —
           that corner is the shell's own. */
        W.Decor.dress(card, {
          count: 1, spots: ["tr", "l", "bl"], size: 140, opacity: 0.45, front: 0.4
        });
      },
      /* The demo stage is the MOTOR's node, borrowed rather than copied, and it
         has to be handed back while the card is still in the document — a
         detached node is one `getElementById` cannot find, and the stage would
         be lost for the rest of the session. */
      onHide: function () { if (kind.indexOf("help") >= 0) parkDemo(); },
      onClose: function () {
        if (openCard === h) openCard = null;
        W.Decor.clear(h.card);
        if (pausing) resume();
      }
    });
    /* THE FOOT IS THE MODAL'S, NOT THE CARD'S: a node pinned to the bottom of
       the frame, under the card and apart from it (menu.css, `.web-pfoot`). */
    if (foot) {
      var f = el("div", "web-pfoot");
      f.appendChild(foot);
      h.box.appendChild(f);
    }
    h.again = again;
    openCard = h;
    return h;
  }

  /* THE WIPE STANDS OUTSIDE THE CARD, at the bottom of the frame. Inside it,
     the one DESTRUCTIVE control read as one more row of a list of settings —
     a switch the thumb was already running down. Out of the card it is a
     separate decision, reached on purpose, and the card is only settings.
     Only where it belongs: erasing the whole save mid-round is not an option
     a player is looking for over a paused round. */
  function openOptions(withReset) {
    return panelModal("options", COPY.optionsTitle, fillOptions,
      function () { openOptions(withReset); },
      withReset ? resetButton() : null);
  }

  function openHelp() {
    return panelModal("help", COPY.helpTitle, fillHelp, openHelp);
  }

  /* ── 5. the three panels ──────────────────────────────────────────────── */

  /* The demo stage is the motor's node, moved rather than copied: a SKIN
     re-dresses `.demo-*` by id-free selectors, so the game's own artwork
     follows it into Help with no extra rule. */
  function parkDemo() {
    var demo = $("intro-demo");
    if (demo && demoHome) demoHome.appendChild(demo);
  }

  function demoKind() { return (CONFIG.intro && CONFIG.intro.demo) || "tap"; }

  /* The gesture the game is played with, then the key the bootstrap already
     binds for that same gesture — both read from CONFIG, so the panel and the
     motor can never disagree about what works. */
  function controlHints() {
    var kind = demoKind(), out = [COPY[kind] || COPY.tap];
    if (CONFIG.keyboard === false) return out;
    if (kind === "swipe") return out.concat(["←", "→"]);
    if (kind === "tap" || kind === "hold") return out.concat(["SPACE"]);
    return out;
  }

  /* A labelled row with a control on the right: every option is one of these,
     so adding one is a line rather than a layout. */
  function row(box, iconName, label, control) {
    var r = el("div", "web-row", icon(iconName));
    r.appendChild(el("span", "lbl", label));
    r.appendChild(control);
    box.appendChild(r);
    return r;
  }

  function toggle(key) {
    var b = el("button", "web-sw", '<span class="knob"></span>');
    b.setAttribute("aria-pressed", Settings.get(key) ? "true" : "false");
    b.addEventListener("click", function () {
      var on = !Settings.get(key);
      Settings.set(key, on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      // Turning the effects back on says so out loud — the switch is audible.
      if (on && key === "sfx") W.Sound.cue("uiRow", 0.5, 1.1, 660, 0.06, "triangle");
    });
    return b;
  }

  function langPair() {
    var seg = el("div", "web-seg");
    ["fr", "en"].forEach(function (code) {
      var c = el("button", "web-chip" + (code === LANG ? " on" : ""), code.toUpperCase());
      c.addEventListener("click", function () { setLang(code); });
      seg.appendChild(c);
    });
    return seg;
  }

  /* The only destructive button in the game, so it asks twice and forgets the
     question after a few seconds rather than staying armed. */
  function resetButton() {
    /* IT ERASES EVERYTHING THE PLAYER HAS, and it is one wording whatever the
       game declares: a player asking to erase their data means all of it —
       the best score, the thirty levels of stars, the wallet, the collection
       and the daily road — and a button that wiped a climb while quietly
       keeping a purse would be the one place in the shell where "erase" meant
       "some of it". The switches above are settings, not data, so the music,
       the callouts and the language survive. */
    var LBL = COPY.wipeData;
    var ASK = COPY.wipeAsk;
    var DONE = COPY.wipeDone;

    var b = el("button", "web-danger", icon("reset") + '<span class="txt"></span>');
    var txt = b.querySelector(".txt");
    var armed = 0, timer = null;
    txt.textContent = LBL;
    function rest() {
      armed = 0; b.classList.remove("armed"); txt.textContent = LBL;
    }
    b.addEventListener("click", function () {
      if (!armed) {
        armed = 1; b.classList.add("armed"); txt.textContent = ASK;
        clearTimeout(timer);
        timer = setTimeout(rest, 4000);
        return;
      }
      clearTimeout(timer);
      W.Store.set("bestScore", 0);
      if (levelled()) LV.wipe();
      if (metaed()) MT.wipe();
      /* The question was the button's own (it is the control, asking), and
         the answer is information: it is said the way every other one is,
         and the button goes back to being what it was. */
      rest();
      W.Notify.say(DONE, { kind: "loss", icon: "trash" });
    });
    return b;
  }

  /* THE STUDIO SIGNATURE, AT THE FOOT OF THE CARD. The motor already draws it
     in the bottom-left corner of the title screen out of CONFIG.brand — the
     newrare mark, the studio's name and the build's version (packages/shell/
     shell.js, Brand) — and that screen is two seconds long now. A version
     number is what a player is asked for when something is wrong with a build,
     so it has to sit where a player can go and READ it, and the options card is
     the one surface that opens from everywhere.

     Same mark, same two lines, same `brand-*` classes: only `#brand-sig` is
     pinned to a corner, so the block laid out in the flow of a card inherits
     the type, the colour and the discretion of the one on the title screen
     without a second description of what a signature looks like.

     It is FLUSH LEFT (menu.css, `.web-sig`), which is where every row of this
     card starts: a centred block in a column of left-aligned rows reads as a
     footer, and the card's foot belongs to nothing — the wipe stands under
     the card, not in it. */
  function brandSig() {
    var brand = CONFIG.brand;
    if (!brand || !brand.mark) return null;

    var sig = el("div", "web-sig");
    var img = document.createElement("img");
    img.className = "brand-mark";
    img.src = brand.mark;
    img.alt = "";
    sig.appendChild(img);

    var copy = el("div", "brand-copy");
    copy.appendChild(el("div", "brand-line", brand.label || "Newrare"));
    /* No number in the manifest is not an error, and the empty node collapses
       on its own (.brand-ver:empty, packages/shell/motor.css). */
    copy.appendChild(el("div", "brand-ver", brand.version ? "v" + brand.version : ""));
    sig.appendChild(copy);
    return sig;
  }

  /* The four switches and the signature. The same rows serve the menu's
     OPTIONS and the card that opens over a paused round (section 5b) — one
     options screen, reached from two places. The wipe is not one of them: it
     is openOptions' foot, under the card. */
  function fillOptions(box) {
    row(box, "music", COPY.music, toggle("music"));
    row(box, "sfx",   COPY.sfx,   toggle("sfx"));
    row(box, "pops",  COPY.pops,  toggle("pops"));
    /* THE ONE ROW THAT IS NOT ALWAYS THERE. It names the buildings of a
       VILLAGE, so a game that has none is not offered a switch for a screen it
       does not own — and there is nowhere else this could sit, since a village
       has no chrome of its own to hang it from. */
    if (window.__VILLAGE__) row(box, "tag", COPY.labels, toggle("labels"));
    row(box, "lang",  COPY.language, langPair());
    /* The signature closes the settings. */
    var sig = brandSig();
    if (sig) box.appendChild(sig);
  }

  /* HELP IS ONE SCREEN AND NOT TWO. The map's level 0 opens this same fill,
     which is why the demo stage is MOVED into whichever body asked for it last
     and handed back on the way out (parkDemo): a SKIN dresses `.demo-*` by
     id-free selectors, so the game's own artwork follows the stage rather than
     being copied with it. */
  function fillHelp(box) {
    box.appendChild(el("div", "web-help-line", COPY.tagline || CONFIG.tagline || ""));
    var demo = $("intro-demo");
    if (demo) box.appendChild(demo);           // moved, not cloned
    /* THE PAINTED HAND. The motor's stroked finger is the playable's; a build
       that carries the shell's artwork acts the gesture out with the painted
       one (CONFIG.shellArt.hand, same pose: cuff down, fingertip up). Only the
       picture is swapped — the box, the drop shadow and every SKIN's
       choreography stay on `.demo-hand` as they were. */
    var handArt = CONFIG.shellArt && CONFIG.shellArt.hand;
    var hand = demo && demo.querySelector(".demo-hand");
    if (hand && handArt) hand.style.backgroundImage = 'url("' + handArt + '")';
    /* THE RULES A SENTENCE CANNOT HOLD. The intro is one line and must stay one
       line — it is read by a player who has not started yet — but a game whose
       fight has a second term in it (games/stratideck's tier) has somewhere to
       say so exactly once: `web.copy.<lang>.help`, a short list, under the demo
       that has just shown the gesture. It is the manifest's like every other
       string a game writes, so there is no second place to look and no game
       named in this file. A game that declares none gets the card it has
       today, byte for byte.

       NOT `help`: that key is this menu's own word for the HELP entry, and a
       game that wrote a list into it replaced the button's label with five
       sentences. The rules have a key of their own. */
    if (COPY.helpRules && COPY.helpRules.length) {
      var rules = el("ul", "web-help-rules");
      for (var r = 0; r < COPY.helpRules.length; r++) {
        rules.appendChild(el("li", "", COPY.helpRules[r]));
      }
      box.appendChild(rules);
    }
    var keys = controlHints(), keyRow = el("div", "web-keys");
    for (var i = 0; i < keys.length; i++) keyRow.appendChild(el("span", "web-key", keys[i]));
    box.appendChild(keyRow);
    box.appendChild(el("div", "web-keys-lbl", COPY.controls));
  }

  /* ── 5a. the ranking, a view ──────────────────────────────────────────── */

  /* WHERE THE PLAYER STANDS. Two numbers today — the best score the motor has
     always written on endRound, and the level the meta layer counts — plus the
     room an online board will take (phase 5 of packages/meta). It is a VIEW
     and not a card because it is a place, and because it wears the same header
     the map, the album and the shop wear: a back arrow, an eyebrow and a
     title. The stack is what takes it away again. */
  var rankBox, rankBody, RK = null;

  function buildRanking() {
    /* THE SHEET EVERY ROOM OF THE PLACE STANDS IN (packages/webshell/
       view.js, section 6b) — the hub, the veil, the title and the bar. No
       button in its header where the band is the way home; the sheet adds
       one where there is no band (view.js). */
    rankBody = el("div"); rankBody.id = "web-rank-body";
    RK = VW.sheet({ id: "web-rank", tag: "section", body: rankBody, home: COPY.menu });
    rankBox = RK.box;
  }

  function paintRanking() {
    var best = Number(W.Store.get("bestScore", 0)) || 0;
    RK.setHead(COPY.scoresTitle, CONFIG.title || "");
    rankBody.innerHTML = "";
    rankBody.appendChild(el("div", "web-best-lbl", COPY.best));
    rankBody.appendChild(el("div", "web-best", String(best)));
    /* The player's own level, beside the score: it is what an online board
       would rank them by alongside it, and it is the one number in this shell
       that a second round of an old level still moves. */
    /* The band over this screen already shows the level and the bar; what it
       does NOT show is the figure — `120 / 350` came off the chip when the
       band became one line, because a band is read at a glance and this is the
       screen that reads it properly. */
    if (metaed()) {
      var p = MT.levelAt();
      rankBody.appendChild(el("div", "web-lvl",
        "<b>" + MT.text("level") + " " + p.level + "</b>" +
        '<span class="bar"><u style="width:' + (100 * p.into / p.need).toFixed(1) + '%"></u></span>' +
        '<i>' + MT.num(p.into) + " / " + MT.num(p.need) + "</i>"));
    }
    /* …and the climb itself, where there is one: thirty levels is a result a
       board should carry, and it is the only one of these three numbers the
       player earned a piece at a time. */
    if (levelled()) {
      rankBody.appendChild(el("div", "web-rank-stars",
        icon("star", "web-rank-star") + "<b>" + LV.total() + "</b><i>/ " + LV.max() + "</i>"));
    }
    rankBody.appendChild(el("div", "web-note", best ? COPY.soonScores : COPY.noScore));
  }

  /* ── 5b. the corner: options and help, from anywhere ─────────────────── */

  /* TWO CONTROLS IN THE BOTTOM-RIGHT CORNER OF EVERY SURFACE BUT THE TITLE
     SCREEN, and a third one while a round is running.

     They used to be the round's alone — a playable has nowhere to go and
     nothing to configure, the round IS the ad — which left a player standing
     on the map with no way to the options but the screen they had already
     left, and the rules of the game written in a panel of that same screen.
     So the pair moved into the view system (packages/webshell/view.js) and
     follows the player: help, and the switches.

     Not in the top band: that is the game's on a round and the wallet's on a
     view. The corner is where the title menu's own entries are, so leaving a
     screen and coming back stay on the same side, and nothing about a round
     has to move to make room. The other bottom corner is the level pill's.

     THE THIRD CONTROL IS THE WAY OUT, and the pictogram is the DESTINATION
     rather than the door: the house, because leaving a round goes back to
     where the player lives — the village where there is one, the title screen
     otherwise — the same place the band's home chip and ESCAPE both mean. The
     map is one building of that place, not where a way out should land. */
  var paused = false;

  function buildControls() {
    VW.corner([
      { name: "help",    icon: "help", label: COPY.help,    on: openHelp },
      { name: "options", icon: "gear", label: COPY.options, on: function () { openOptions(false); } }
    ]);
    labelControls();
  }

  function roundControl(on) {
    if (!on) { VW.cornerExtra(null); return; }
    VW.cornerExtra({
      icon: "home",
      label: villaged() ? COPY.toVillage : COPY.toMenu,
      on: openLeave
    });
  }

  function labelControls() {
    VW.cornerLabels({ help: COPY.help, options: COPY.options,
                      home: villaged() ? COPY.toVillage : COPY.toMenu });
  }

  /* A pair of wide buttons under the body — RESUME alone for the options,
     RESUME / LEAVE for the question that loses a run. */
  function actions(box, list) {
    var bar = el("div", "web-actions");
    for (var i = 0; i < list.length; i++) {
      var b = el("button", "web-btn " + list[i][1], list[i][0]);
      b.addEventListener("click", list[i][2]);
      bar.appendChild(b);
    }
    box.appendChild(bar);
  }

  /* THE ONE QUESTION THAT THROWS A RUN AWAY. Same card as the options, and it
     is the only card in this shell that asks something — which is why it is
     the only one with a pair of buttons under it. */
  function openLeave() {
    if (W.state() !== "playing") return;
    /* The state is still "playing" while the outro plays (the loop is left
       turning for the slow motion — packages/shell/shell.js), and a round that
       is already over is not one to pause or to leave. */
    if (W.ending && W.ending()) return;
    var h = panelModal("leave", COPY.leaveTitle, function (body) {
      body.appendChild(el("div", "web-note", COPY.leaveNote));
      actions(body, [
        [COPY.resume, "go", function () { h.close(); }],
        [COPY.leaveYes, "stop", function () { h.close(); leave(); }]
      ]);
    }, openLeave);
    return h;
  }

  function pause() {
    if (paused) return;
    paused = true;
    W.Loop.pause();
  }

  function resume() {
    if (!paused) return;
    paused = false;
    W.Loop.resume();
  }

  /* Leaving is the one path that throws a round away, so the score is not
     written: endRound is what records a best, and it is deliberately not
     called here. The state hook does the rest — the card, the world and the
     armed mode all reset on the way into the menu. */
  function leave() {
    paused = false;
    W.Loop.stop();
    W.Round.stop();
    W.Music.unduck();
    W.setState("intro");
    /* Home, not the map: the village where there is one — the map is one of
       its buildings — and the title screen otherwise. */
    if (villaged()) VG().open();
  }

  /* The motor pauses the loop when the tab goes away and resumes it when it
     comes back (packages/platform/web.js, and the engine itself), which would
     un-pause a round the player left frozen behind a card. This listener is
     registered last, so it has the last word. */
  function guardVisibility() {
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && paused) W.Loop.pause();
    });
  }

  /* ── 6. language, live ────────────────────────────────────────────────── */

  /* Changing the language rewrites what is on screen instead of reloading: the
     menu labels, the open panel, and the two end-screen buttons. The choice is
     stored, so it also wins on the next load — including over the ?lang= the
     site passes, which is the point of picking one here. */
  function setLang(code) {
    if (!STRINGS[code] || code === LANG) return;
    LANG = code;
    COPY = resolveCopy(code);
    W.Store.set(LANG_KEY, code);
    document.documentElement.lang = code;
    if (MD.setLang) MD.setLang(code);
    applyLang(code);

    if (levelled()) LV.setLang(code);
    if (metaed()) { MT.setLang(code); AL.setLang(code); DL.setLang(code); }
    if (armied()) AR().setLang(code);
    for (var i = 0; i < items.length; i++)
      items[i].node.textContent = (items[i].mt && metaed() ? MT.text(items[i].mt) : null) ||
                                  (items[i].lv && levelled() ? LV.text(items[i].lv) : null) ||
                                  COPY[items[i].key] || items[i].alt;
    if (COPY.tagline) $("intro-tagline").innerHTML = COPY.tagline;
    labelEnd();
    labelControls();
    if (VW.isOpen("ranking")) paintRanking();
    /* The open card is rebuilt in the new language rather than left in the old
       one: it is part of the screen, and the screen is what a language change
       rewrites. `again` is what each card handed the view system on the way
       up — the call that opens it again. */
    if (openCard && openCard.again) {
      var again = openCard.again;
      openCard.close();
      again();
    }
  }

  /* ── 6b. fitting the display type ─────────────────────────────────────── */

  /* The measuring itself is the motor's `Fit` (shell.js): the same four
     playables that wrapped their end title needed it too, so it moved down
     rather than being forked here. This file only tells it about the one piece
     of geometry the web target changes — #intro-title lives in #web-head,
     inset 44px, where the playable has it inside .screen's 48px.

     A game's own face is what makes the web case harder than the playable's:
     Orbitron's digits are 24% wider than -apple-system's, Bungee's caps 7%
     wider again, Bebas Neue's 40% narrower, so "OUT OF PULSES!" is 914px of a
     624px band at 96px in Orbitron. Nothing to re-tune per game — it is
     measured. */
  var Fit = W.Fit;
  Fit.room("intro-title", 632);

  function fitAll() { Fit.all(); }

  /* ── 7. the end screen ────────────────────────────────────────────────── */

  /* THE END SCREEN'S TWO WAYS OUT, AND THEY ARE THE SAME TWO EVERY TIME. On a
     map there is exactly one place to go — the map, which is where the next
     level, the wallet and the collection all are — and exactly one thing to do
     again, which is the level just played. Two icons say that in less room
     than two sentences did, and neither of them has to be re-read after the
     first round of the first session.

     WHAT CHANGES IS WHICH ONE SHINES, and it is the round that decides:

       three stars   the map is lit and the replay is a whisper — there is
                     nothing left to earn here, so the way on is the offer.
       one or two    both plain. Going on and going again are both reasonable
                     and the screen does not have an opinion.
       none          the replay is lit and the map is the whisper: the level
                     was not cleared, and the obvious next move is this level
                     again.

     A game with no map keeps the two words it always had — PLAY AGAIN and
     MENU — because neither of them is an icon anyone would read. */
  var btnAgain, btnMenu, btnNext, endActs;

  /* THE END SCREEN'S THREE STARS, painted. They are the motor's own nodes and
     the motor writes a glyph into them (template/page.html), which every
     playable keeps — this only swaps what is INSIDE them on a web build that
     carries the artwork. The nodes, their ids, the reveal that lights them one
     by one and the slam it plays are untouched, so shell.js needs no branch.

     Once, at mount: the end screen is rebuilt every round but these three
     spans are not. The painted case is styled off the CHILD (`.star .eo-sti`)
     and never off a class on the star itself — shell.js rewrites `className`
     on every reveal, so a marker put there would survive exactly one round. */
  function paintEndStars() {
    var img = artImg("star", "eo-sti");
    if (!img) return;
    for (var i = 1; i <= 3; i++) {
      var n = $("star-" + i);
      if (n) n.innerHTML = img;
    }
  }

  function rewireEnd() {
    paintEndStars();
    btnAgain = unbind("btn-install");     // the map, on a map; PLAY AGAIN otherwise
    btnAgain.addEventListener("click", function () {
      if (levelled()) { toMenu(); return; }
      W.start();
    });

    btnMenu = unbind("btn-replay");       // the level again, on a map; MENU otherwise
    btnMenu.addEventListener("click", function () {
      if (levelled() && LV.last()) { LV.replayLast(); return; }
      if (levelled()) { W.start(); return; }
      toMenu();
    });

    /* The two are stacked by the motor and side by side here, so they are
       moved into a row of their own — moved, never copied: they are the
       motor's own nodes and everything it does to them (the `.show` that ends
       the reveal, the blur on the way out) still lands. */
    if (levelled()) {
      endActs = el("div"); endActs.id = "web-endacts";
      btnAgain.parentNode.insertBefore(endActs, btnAgain);
      endActs.appendChild(btnAgain);
      endActs.appendChild(btnMenu);

      /* THE WAY ON — the third button, and the shell's own. The motor owns
         exactly two nodes on this screen and a NEXT LEVEL belongs to the level
         layer, not to the motor: a playable has no next level and the motor
         must not learn what one is (it still knows nothing of this front end
         but `onResult`). So it is built here, LAST in the row —
         map · replay · next — and it rides the motor's own reveal through
         CSS rather than a timer of its own: `#btn-replay.show ~ #btn-next` in
         menu.css. That also means `setState` taking `.show` off the motor's
         button on the way out of "end" takes this one with it, which is what
         keeps a dead button from sitting invisible over the next round. */
      btnNext = el("button", "eo-act"); btnNext.id = "btn-next";
      btnNext.type = "button";
      btnNext.addEventListener("click", function () { LV.playNext(); });
      endActs.appendChild(btnNext);
    }
    labelEnd();
  }

  /* THE WAY BACK FROM A SCORE, and it is the same chain PLAY is: the village
     where there is one, the map where there is not, the title screen
     otherwise. A score screen puts the player back where they live, not where
     the round happened to start. */
  /* The word for "where the player lives", out of the strings the shell
     already writes: the meta layer's `home` where there is a wallet, the level
     layer's otherwise. */
  function MT_home() {
    return metaed() ? MT.text("home") : LV.text("home");
  }

  function toMenu() {
    W.Music.unduck();            // endRound ducked the bed for the reveal
    W.setState("intro");         // the state hook repaints the scene
    if (villaged() || levelled()) front();
  }

  /* The motor owns `.show` on these two — it is what ends the reveal and what
     makes them clickable at all — so the tone is written around it rather than
     over it. */
  function dress(btn, cls, tone) {
    var shown = btn.classList.contains("show");
    btn.className = cls + " " + tone + (shown ? " show" : "");
  }

  function labelEnd() {
    if (!btnAgain) return;
    if (!levelled()) {
      btnAgain.textContent = COPY.again;
      btnMenu.textContent = COPY.menu;
      return;
    }
    var last = LV.last();
    var st = last ? last.stars : 0;
    /* THE FIRST BUTTON IS WHERE THE PLAYER LIVES. On a village that is the
       village — the map is one of its buildings — so the pictogram is the
       house, and it is the same destination the band's home chip and ESCAPE
       both mean. Without one it is still the map. */
    btnAgain.innerHTML = icon(villaged() ? "home" : "map", "eo-ico");
    btnAgain.setAttribute("aria-label", villaged() ? MT_home() : LV.text("map"));
    btnMenu.innerHTML = icon("reset", "eo-ico");
    btnMenu.setAttribute("aria-label", LV.text("replay"));
    dress(btnAgain, "eo-act", st >= 3 ? "hero" : st >= 1 ? "calm" : "dim");
    dress(btnMenu, "eo-act", st >= 3 ? "dim" : st >= 1 ? "calm" : "hero");
    /* NEXT IS NEVER DRESSED. The other two trade the lit state between them
       because what the round earned decides which of "go on" and "try again"
       is the offer; this one is the same size and the same weight whatever
       happened, so it never competes with the answer to that question.

       It is HIDDEN rather than disabled where there is no next level — after
       the last one, and after a round that did not clear its objective, where
       the level ahead is still shut. A control that cannot do anything is
       worse than one that is not there, and `hidden` also takes it out of the
       tab order. */
    if (btnNext) {
      btnNext.innerHTML = icon("next", "eo-ico");
      btnNext.setAttribute("aria-label", LV.text("next"));
      btnNext.className = "eo-act";
      btnNext.hidden = !LV.nextLevel();
    }
  }

  /* ── 8. keys ──────────────────────────────────────────────────────────── */

  /* ONE ORDER, AND THE STACK ALREADY KNOWS IT. ESCAPE used to mean five things
     in four files, each guarded against the other four; the view system answers
     it now — the top card, then the top view — and what is left here is the
     part that is not a screen at all: the round's own pause, and the SPACE the
     bootstrap reads as "start the round".

     Capture runs before the bootstrap's own window listener, which is what
     lets this file take a key the motor would otherwise act on. */
  function bindKeys() {
    window.addEventListener("keydown", function (e) {
      var esc = e.key === "Escape" || e.keyCode === 27;
      if (esc) {
        /* A card first, then a view, in the order they were opened. */
        if (VW.escape()) { e.preventDefault(); return; }
        /* ESCAPE during a round is the pause every game has: it opens the
           options over the frozen world, and a second press resumes. Not over
           a ceremony of the meta layer, though: the round is already over by
           then (the outro is still "playing" — packages/shell/shell.js) and
           pausing a finished round behind an open gift is a card over a card. */
        if (metaed() && MT.busy()) { e.preventDefault(); return; }
        if (W.state() === "playing") { e.preventDefault(); openOptions(false); return; }
        return;
      }
      /* SPACE from the title screen is "start the round" in the bootstrap, and
         with a map there is no round to start until a level is picked — so the
         key opens the map and never reaches the motor's own listener. */
      if ((e.key === " " || e.keyCode === 32) && (levelled() || villaged()) &&
          W.state() === "intro" && !VW.depth() && !MD.any()) {
        e.preventDefault(); e.stopPropagation(); front(); return;
      }
      /* Anything else, while a screen of this shell is in front of the game:
         the motor must not act on it. */
      if (!VW.depth() && !MD.any()) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);
  }

  /* ── 9. mount ─────────────────────────────────────────────────────────── */

  // The motor calls init() on DOMContentLoaded too, and registered first, so by
  // the time this runs buildIntro() has already written the copy we overwrite.
  function mount() {
    document.documentElement.lang = LANG;
    /* Before buildIntro: the six CONFIG.copy nodes it writes go through the
       dictionary, so the title screen is never in English for a frame. */
    applyLang(LANG);
    Settings.apply();
    /* The level layer gets this file's dom helpers and its language, so the
       web shell has one `el`, one icon pack and one FR/EN mechanism rather
       than two. It must be mounted before buildIntro(), which asks it for the
       PLAY entry's label. */
    /* The meta layer gets the same three things the map does — this file's
       `el`, its icon pack and the language — so the shell has one dom helper,
       one pictogram set and one FR/EN mechanism rather than four. meta.js
       first: the album, the daily strip and the map's own header all draw
       through it. */
    /* The view system first of all: it is what every layer below defines its
       screens and opens its cards through, so it gets this file's dom helpers
       before any of them runs. */
    VW.mount({ el: el, icon: icon, art: artImg, lang: LANG });
    if (MD.setLang) MD.setLang(LANG);
    if (metaed()) {
      var mapi = { el: el, icon: icon, art: artImg, lang: LANG };
      MT.mount(mapi);
      AL.mount(mapi);
      DL.mount(mapi);
      /* The barracks is a room of the meta layer like the shop is: it spends
         that wallet and it writes that save, so it is mounted with it and
         never without it. */
      if (armied()) AR().mount(mapi);
    }
    if (LV) LV.mount({
      el: el, icon: icon, art: artImg, lang: LANG,
      /* ...and the way to the Help CARD, so the map's level 0 opens the ONE
         help screen this shell has rather than a second copy of it. The map
         used to build its own panel for this, because a panel of the title
         screen could not be raised over a map; a modal is over everything by
         construction, so that whole second copy is gone. */
      help: openHelp
    });

    /* THE RANKING IS THIS FILE'S VIEW, the way the map is levels.js's and the
       album is album.js's: whoever owns the content registers it, and the view
       system owns the mounting, the stack, the back arrow and the bed. */
    VW.define("ranking", {
      build: buildRanking,
      node: function () { return rankBox; },
      show: paintRanking,
      /* It carries the band like every other view: the level chip is what
         opened it and the other three are the way on, which is the only way
         off this screen now that nothing wears a back arrow. */
      hud: true,
      decor: { count: 2, spots: ["l", "r", "bl"], size: 140, opacity: 0.35, front: 0 }
    });

    buildIntro();
    dressBackground();
    buildControls();
    rewireEnd();
    bindKeys();
    bindBed();
    guardVisibility();

    /* The tagline is the motor's, written in English in CONFIG.tagline; a game
       that ships a translated one in its manifest (web.copy.<lang>.tagline)
       gets it in the Help panel — markup included, because the key words are
       wrapped in <b class="w-…">. */
    if (COPY.tagline) $("intro-tagline").innerHTML = COPY.tagline;

    /* Every arrival on the menu — the first one, and every return from a
       round — closes whatever panel was open and wipes the last frame of the
       world off the canvas, so the background is what shows through. */
    W.onState(function (state) {
      /* THE MOTOR'S STATE IS THE FLOOR EVERY VIEW STANDS ON: a round starting
         or an end screen arriving closes every screen and every card that was
         open in front of it, in one call, whatever opened them. */
      VW.floor(state);
      paused = false;
      /* The way out belongs to a round; help and the switches belong
         everywhere but the title screen, and the view system decides that on
         its own (cornerSync). */
      roundControl(state === "playing");
      VW.cornerSync();
      /* Nothing to fit here any more: the motor sizes the end title and the
         score inside EndScreen.show, which runs after this hook. The two
         buttons are dressed though: on a map they are the MAP and THE LEVEL
         AGAIN, and which of the two shines depends on the round that just
         ended (see rewireEnd). */
      if (state === "end") { labelEnd(); return; }
      if (state !== "intro") return;
      armSplash();               // ...once, on the first one (section 4)
      toMenuBed();               // the menus' own quiet section of the track
      armMode(MODES[0]);         // ...and PLAY is the default mode again
      /* Ninety of ninety is reached on an end screen, so the golden veil is
         re-read on the way back rather than only at boot. */
      if (levelled()) LV.refreshVeil();
      W.clearWorld();
    });
    armMode(MODES[0]);
    if (W.state() === "intro") { armSplash(); W.clearWorld(); }

    /* The title is sized off the game's own face, so it can only be measured
       once that face is really there: a data-URI @font-face is decoded
       asynchronously like any other. Fit now for the fallback metrics, and
       again when the real one lands. */
    fitAll();
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(fitAll);
    }
  }

  /* ── 10. the doors, for a front door that is not this one ─────────────── */

  /* WHAT EVERY TITLE ENTRY DOES, NAMED. The list in section 4 is one way to
     draw this screen and `packages/webshell/village.js` is the other — the
     same doors as buildings on a painted hub — so the ACTIONS come out of the
     markup that happens to hold them today.

     `play` is not in here on purpose, and it is the whole reason this shell
     still works: PLAY is the motor's own `#btn-start`, which is what keeps
     `startGame`, the SPACE key and Sound.unlock()'s user gesture exactly as
     they were. A village does not call a play function — it MOVES that node
     into the house that opens the round, so the click path is unchanged.

     It is published outside mount() because village.js reads it while it
     mounts, and the two run in load order: menu.js first, always. */
  window.__MENU__ = {
    levelled: levelled,
    doors: {
      map: function () { if (levelled()) LV.open(); },
      ranking: function () { VW.go("ranking"); },
      shop: function () { if (metaed()) AL.openShop(); },
      album: function () { if (metaed()) AL.open(); },
      /* THE ROAD, over wherever the door was. A village has no menu for the
         strip to be a line of, so the building opens it as a card and the
         player picks their day on it — which is the week, where they are
         inside it and what tomorrow pays, none of which a door straight to
         today's reward ever showed (packages/webshell/daily.js, section 2b). */
      daily: function () { if (metaed() && DL && DL.active()) DL.openRoad(); },
      /* THE BARRACKS' FOUR. Every one of them is a place with a list to manage,
         so every one of them is a VIEW and not a card — and they are reached
         only from the hub, because the wallet band is the navigation and a
         roster is not a number the band carries. */
      deck: function () { if (armied()) AR().open("deck"); },
      infirmary: function () { if (armied()) AR().open("infirmary"); },
      prison: function () { if (armied()) AR().open("prison"); },
      recruit: function () { if (armied()) AR().open("recruit"); },
      options: function () { openOptions(true); },
      help: openHelp
    },
    /* The menu's own node and the head above it, so a village can put both
       away rather than build a second intro of its own: everything the shell
       does to this screen — the language, the bed, the end screen, the
       keys — keeps working on nodes that are still there. */
    node: function () { return menu; },
    text: function (k) { return COPY[k]; },
    /* One switch is read by a layer below rather than applied to the motor —
       the village's labels — and it asks here rather than opening the Store key
       a second time: there is one settings object and one place it is read. */
    setting: function (k) { return Settings.get(k); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
