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
      resetScores: "Reset the leaderboard",
      resetAsk: "Tap again to erase your best score",
      resetDone: "Leaderboard cleared",
      controls: "Controls",
      tap: "Tap", hold: "Hold", drag: "Drag", swipe: "Swipe", aim: "Aim",
      back: "Back", again: "Play again", menu: "Menu",
      toMenu: "Back to the menu", toMap: "Back to the map", resume: "Resume",
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
      resetScores: "Effacer le classement",
      resetAsk: "Touchez à nouveau pour effacer votre meilleur score",
      resetDone: "Classement effacé",
      controls: "Contrôles",
      tap: "Taper", hold: "Maintenir", drag: "Glisser", swipe: "Balayer", aim: "Viser",
      back: "Retour", again: "Rejouer", menu: "Menu",
      toMenu: "Retour au menu", toMap: "Retour à la carte", resume: "Reprendre",
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
    back: 1, again: 1, menu: 1, resume: 1, leaveTitle: 1, leaveYes: 1
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

  /* Three switches and a language, in one Store key. Everything defaults to
     ON: a player who never opens OPTIONS gets the game as designed, and the
     stored object is only ever read through these accessors so an old key
     missing a field cannot turn a feature off by accident. */
  var Settings = (function () {
    var KEY = "webSettings";
    var saved = W.Store.get(KEY, null) || {};
    var val = {
      music: saved.music !== false,
      sfx:   saved.sfx   !== false,
      pops:  saved.pops  !== false
    };
    /* The motor holds the truth: these three calls are the whole integration,
       and they are no-ops on a playable because nothing there ever calls them. */
    function apply() {
      /* Armed before the switch, never after: a bed turned back ON from the
         menu has to come back on the menus' own section (section 1b) rather
         than on whatever the last round played. From the pause card the state
         is "playing" and the round's section is the one already armed. */
      if (menuBed() && W.state() === "intro") W.Music.arm(menuBed());
      W.Sound.setMuted(!val.sfx);
      W.Music.setMuted(!val.music);
      W.Pop.setEnabled(val.pops);
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
    star:   '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>'
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

  var view, menu, panel, panelTitle, panelBody, open = null;
  var items = [];              // the menu entries, so a language change is a loop
  var demoHome;                // where the motor's demo stage sleeps

  function buildIntro() {
    var intro = $("screen-intro");

    var bg = el("div"); bg.id = "web-bg";
    intro.appendChild(bg);

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
    view.appendChild(buildPanel());
    intro.appendChild(view);
  }

  function buildMenu() {
    menu = el("nav"); menu.id = "web-menu";

    /* PLAY is the motor's node, restyled: keeping it is what keeps startGame,
       the SPACE key and Sound.unlock()'s user gesture exactly as they were.

       A game with levels puts the MAP between the menu and the round instead
       (docs/LEVELS.md), so the motor's own listener comes off and the map's
       PLAY button becomes the click that starts a round — still one click, so
       the audio unlock still happens inside the gesture that asked for it. */
    var start = levelled() ? unbind("btn-start") : $("btn-start");
    start.className = "web-item";
    start.textContent = levelled() ? LV.text("levelsEntry") : COPY.play;
    if (levelled()) start.addEventListener("click", function () { LV.open(); });
    items.push({ node: start, key: "play", lv: "levelsEntry" });
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
    if (metaed() && DL && DL.active()) {
      var road = DL.node();
      if (road) menu.appendChild(road);
    }

    if (metaed()) {
      var b = el("button", "web-item web-meta", MT.text("stickersEntry"));
      b.addEventListener("click", function () { AL.open(); });
      items.push({ node: b, mt: "stickersEntry" });
      menu.appendChild(b);
    }

    [["scores", "leaderboard"], ["options", "options"], ["help", "help"]]
      .forEach(function (entry) {
        var b = el("button", "web-item", COPY[entry[1]]);
        b.addEventListener("click", function () { openPanel(entry[0]); });
        items.push({ node: b, key: entry[1] });
        menu.appendChild(b);
      });
    return menu;
  }

  function buildPanel() {
    panel = el("section"); panel.id = "web-panel";

    var headRow = el("div", "web-phead");
    var back = el("button", "web-back", icon("back", "back-ico"));
    back.setAttribute("aria-label", COPY.back);
    back.addEventListener("click", closePanel);
    panelTitle = el("h2", "web-ptitle");
    headRow.appendChild(back);
    headRow.appendChild(panelTitle);

    panelBody = el("div", "web-pbody");
    panel.appendChild(headRow);
    panel.appendChild(panelBody);
    return panel;
  }

  function openPanel(name) {
    open = name;
    panelTitle.textContent = PANELS[name].title();
    panelBody.innerHTML = "";
    PANELS[name].fill(panelBody);
    menu.style.display = "none";
    panel.classList.add("on");
    $("screen-intro").classList.add("web-open");     // the scrim goes darker
    /* Two of the game's own painted objects around the card. A panel is the
       plainest thing this shell draws — a list of rows on a black card — and
       the scene behind it is pushed back by the scrim precisely where the card
       is, so this is where a picture is worth the most. Never bottom-right:
       that corner is the back arrow's and the menu's. The motor draws them
       (packages/shell/shell.js, Decor) and re-rolls on every opening, so the
       game is dressed differently each time it is asked for. */
    W.Decor.dress(panel, {
      count: 2, spots: ["tl", "tr", "l", "bl"], size: 145, opacity: 0.5, front: 0.4
    });
  }

  function closePanel() {
    if (!open) return;
    // The Help panel borrows the motor's demo stage; give it back so a second
    // opening finds it where it was left.
    if (open === "help") parkDemo();
    open = null;
    panel.classList.remove("on");
    W.Decor.clear(panel);
    $("screen-intro").classList.remove("web-open");
    menu.style.display = "";
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
    /* With a map, this throws away thirty levels of stars and not just a
       number, so it says so: its own wording, and the same two taps. */
    var lv = levelled();
    var LBL = lv ? LV.text("resetProgress") : COPY.resetScores;
    var ASK = lv ? LV.text("resetProgressAsk") : COPY.resetAsk;
    var DONE = lv ? LV.text("resetProgressDone") : COPY.resetDone;

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
      if (lv) LV.wipe();
      armed = 0; b.classList.remove("armed"); txt.textContent = DONE;
      timer = setTimeout(rest, 1600);
    });
    return b;
  }

  /* The four switches, and the wipe only where it belongs. The same rows serve
     the menu's OPTIONS and the card that opens over a paused round (section
     5b) — one options screen, reached from two places — but erasing the
     leaderboard mid-round is not an option a player is looking for there. */
  function fillOptions(box, withReset) {
    row(box, "music", COPY.music, toggle("music"));
    row(box, "sfx",   COPY.sfx,   toggle("sfx"));
    row(box, "pops",  COPY.pops,  toggle("pops"));
    row(box, "lang",  COPY.language, langPair());
    if (withReset) box.appendChild(resetButton());
  }

  var PANELS = {
    scores: {
      title: function () { return COPY.scoresTitle; },
      fill: function (box) {
        var best = Number(W.Store.get("bestScore", 0)) || 0;
        box.appendChild(el("div", "web-best-lbl", COPY.best));
        box.appendChild(el("div", "web-best", String(best)));
        /* The player's own level, beside the score: it is what an online board
           would rank them by alongside it, and it is the one number in this
           shell that a second round of an old level still moves. */
        if (metaed()) {
          var p = MT.levelAt();
          box.appendChild(el("div", "web-lvl",
            '<b>' + MT.text("level") + " " + p.level + "</b>" +
            '<span class="bar"><u style="width:' + (100 * p.into / p.need).toFixed(1) + '%"></u></span>'));
        }
        box.appendChild(el("div", "web-note", best ? COPY.soonScores : COPY.noScore));
      }
    },
    options: {
      title: function () { return COPY.optionsTitle; },
      fill: function (box) { fillOptions(box, true); }
    },
    help: {
      title: function () { return COPY.helpTitle; },
      fill: function (box) {
        box.appendChild(el("div", "web-help-line", COPY.tagline || CONFIG.tagline || ""));
        var demo = $("intro-demo");
        if (demo) box.appendChild(demo);           // moved, not cloned
        var keys = controlHints(), keyRow = el("div", "web-keys");
        for (var i = 0; i < keys.length; i++) keyRow.appendChild(el("span", "web-key", keys[i]));
        box.appendChild(keyRow);
        box.appendChild(el("div", "web-keys-lbl", COPY.controls));
      }
    }
  };

  /* ── 5b. the game view: leave, and the options ────────────────────────── */

  /* Two controls in the bottom-right corner of a round, and they are the whole
     difference between a playable and a finished game: a playable has nowhere
     to go and nothing to configure — the round IS the ad — while a game the
     player owns must let them out and let them turn the music off without
     finishing first.

     Not in the top band: the HUD is the game's, all of it, and the thirteen
     fill it differently. The corner is where the menu's own entries are, so
     leaving a round and coming back stay on the same side of the screen, and
     nothing about the round has to move to make room.

     Either control PAUSES the round first. The clock is the loop's — Round.tick
     is called from frameUpdate — so freezing the loop freezes the round, the
     world and the timer in one call, and the game's own update never runs
     underneath an open card. */
  var ctlBar, ctlMenu, ctlOptions;
  var pauseBox, pauseCard, pauseTitle, pauseBody, pauseKind = null, paused = false;

  function buildControls() {
    ctlBar = el("div"); ctlBar.id = "web-ctls";
    ctlBar.hidden = true;                        // a round is the only time it shows

    /* The pictogram is the DESTINATION, not the door: `leave` drops a levelled
       game on its map and a level-less one on the title screen, so the corner
       says map or house accordingly. */
    ctlMenu = el("button", "web-ctl", icon(levelled() ? "map" : "home"));
    ctlMenu.addEventListener("click", function () { openPause("leave"); });

    ctlOptions = el("button", "web-ctl", icon("gear"));
    ctlOptions.addEventListener("click", function () { openPause("options"); });

    ctlBar.appendChild(ctlMenu);
    ctlBar.appendChild(ctlOptions);
    labelControls();
    $("frame").appendChild(ctlBar);
  }

  function labelControls() {
    if (ctlMenu) ctlMenu.setAttribute("aria-label", levelled() ? COPY.toMap : COPY.toMenu);
    if (ctlOptions) ctlOptions.setAttribute("aria-label", COPY.options);
  }

  /* One card over the frozen world, in the head + body the intro's panels
     already define: there is one panel design in this shell, not two. */
  function buildPause() {
    pauseBox = el("div"); pauseBox.id = "web-pause";
    pauseCard = el("div", "web-pcard");
    var card = pauseCard;
    var headRow = el("div", "web-phead");
    var back = el("button", "web-back", icon("back", "back-ico"));
    back.setAttribute("aria-label", COPY.resume);
    back.addEventListener("click", closePause);
    pauseTitle = el("h2", "web-ptitle");
    headRow.appendChild(back);
    headRow.appendChild(pauseTitle);
    pauseBody = el("div", "web-pbody");
    card.appendChild(headRow);
    card.appendChild(pauseBody);
    pauseBox.appendChild(card);
    $("frame").appendChild(pauseBox);
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

  function openPause(kind) {
    if (W.state() !== "playing") return;
    /* The state is still "playing" while the outro plays (the loop is left
       turning for the slow motion — packages/shell/shell.js), and a round that
       is already over is not one to pause or to leave. */
    if (W.ending && W.ending()) return;
    pause();
    pauseKind = kind;
    pauseTitle.textContent = kind === "leave" ? COPY.leaveTitle : COPY.optionsTitle;
    pauseBody.innerHTML = "";
    if (kind === "leave") {
      pauseBody.appendChild(el("div", "web-note", COPY.leaveNote));
      actions(pauseBody, [[COPY.resume, "go", closePause], [COPY.leaveYes, "stop", leave]]);
    } else {
      fillOptions(pauseBody, false);
      actions(pauseBody, [[COPY.resume, "go", closePause]]);
    }
    pauseBox.classList.add("on");
    /* One piece only, and never at the bottom: the card opens over a frozen
       round with the two controls still in the corner under it. */
    W.Decor.dress(pauseCard, {
      count: 1, spots: ["tl", "tr", "l"], size: 140, opacity: 0.45, front: 0
    });
  }

  function closePause() {
    if (!pauseKind) return;
    pauseKind = null;
    pauseBox.classList.remove("on");
    W.Decor.clear(pauseCard);
    resume();
  }

  /* The card goes with the round: time up, game over or a leave all land on a
     state change, and by then the loop is already stopped — so this clears the
     flags and the card without resuming anything. */
  function dropPause() {
    pauseKind = null;
    paused = false;
    if (pauseBox) pauseBox.classList.remove("on");
    if (pauseCard) W.Decor.clear(pauseCard);
  }

  function pause() {
    if (paused) return;
    paused = true;
    W.Loop.pause();
    W.Music.duck(0.35, 0.25);      // the bed stays, quietly: coming back is not a restart
  }

  function resume() {
    if (!paused) return;
    paused = false;
    W.Loop.resume();
    W.Music.unduck();
  }

  /* Leaving is the one path that throws a round away, so the score is not
     written: endRound is what records a best, and it is deliberately not
     called here. The state hook does the rest — the card, the world and the
     armed mode all reset on the way into the menu. */
  function leave() {
    W.Loop.stop();
    W.Round.stop();
    W.Music.unduck();
    W.setState("intro");
    /* With a map, the screen a round came from is the map — the menu is one
       back arrow further. */
    if (levelled()) LV.open();
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
    applyLang(code);

    if (levelled()) LV.setLang(code);
    if (metaed()) { MT.setLang(code); AL.setLang(code); DL.setLang(code); }
    for (var i = 0; i < items.length; i++)
      items[i].node.textContent = (items[i].mt && metaed() ? MT.text(items[i].mt) : null) ||
                                  (items[i].lv && levelled() ? LV.text(items[i].lv) : null) ||
                                  COPY[items[i].key] || items[i].alt;
    if (COPY.tagline) $("intro-tagline").innerHTML = COPY.tagline;
    labelEnd();
    labelControls();
    if (open) openPanel(open);                 // rebuild it in the new language
    if (pauseKind) openPause(pauseKind);       // ...the paused card included
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

  function toMenu() {
    W.Music.unduck();            // endRound ducked the bed for the reveal
    W.setState("intro");         // the state hook repaints the scene
    if (levelled()) LV.open();
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
    btnAgain.innerHTML = icon("map", "eo-ico");
    btnAgain.setAttribute("aria-label", LV.text("map"));
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

  /* The bootstrap reads SPACE from the intro as "start the round". With a panel
     open that would launch a game the player cannot see, so the web shell takes
     the key first (capture runs before the bootstrap's own window listener) and
     lets ESCAPE close the panel. */
  function bindKeys() {
    window.addEventListener("keydown", function (e) {
      var esc = e.key === "Escape" || e.keyCode === 27;
      if (esc && pauseKind) { e.preventDefault(); closePause(); return; }
      /* The album and the shop sit over the map, which sits over the menu:
         ESCAPE walks that stack from the top down, one layer a press. */
      if (esc && metaed() && AL.anyOpen()) { e.preventDefault(); AL.closeTop(); return; }
      if (esc && open) { e.preventDefault(); closePanel(); return; }
      /* ESCAPE during a round is the pause every game has: it opens the
         options over the frozen world, and a second press resumes. Not over a
         ceremony of the meta layer, though: the round is already over by then
         (the outro is still "playing" — packages/shell/shell.js) and pausing a
         finished round behind an open gift is a card over a card. */
      if (esc && metaed() && MT.busy()) { e.preventDefault(); return; }
      if (esc && W.state() === "playing") { e.preventDefault(); openPause("options"); return; }
      if (esc && levelled() && LV.isOpen()) { e.preventDefault(); LV.close(); return; }
      /* SPACE from the intro is "start the round" in the bootstrap, and with a
         map there is no round to start until a level is picked — so the key
         opens the map and never reaches the motor's own listener. */
      if ((e.key === " " || e.keyCode === 32) && levelled() &&
          W.state() === "intro" && !open && !LV.isOpen()) {
        e.preventDefault(); e.stopPropagation(); LV.open(); return;
      }
      if (!open && !pauseKind && !(levelled() && LV.isOpen()) &&
          !(metaed() && AL.anyOpen())) return;
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
    if (metaed()) {
      var mapi = { el: el, icon: icon, art: artImg, lang: LANG };
      MT.mount(mapi);
      AL.mount(mapi);
      DL.mount(mapi);
    }
    if (LV) LV.mount({
      el: el, icon: icon, art: artImg, lang: LANG,
      /* ...and the Help panel itself, so the map's level 0 opens the ONE help
         screen this shell has rather than a second copy of it: the same title,
         the same sentence, the same motor demo stage moved into whichever
         body asked for it last, and `park` to hand the stage back. */
      help: {
        title: function () { return COPY.helpTitle; },
        fill: function (body) { PANELS.help.fill(body); },
        park: parkDemo
      }
    });
    buildIntro();
    dressBackground();
    buildControls();
    buildPause();
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
      /* The controls belong to a round, and so does the card over it: both go
         away on any other screen, whatever ended the round. */
      ctlBar.hidden = state !== "playing";
      if (state !== "playing") dropPause();
      /* Nothing to fit here any more: the motor sizes the end title and the
         score inside EndScreen.show, which runs after this hook. The two
         buttons are dressed though: on a map they are the MAP and THE LEVEL
         AGAIN, and which of the two shines depends on the round that just
         ended (see rewireEnd). */
      if (state === "end") { labelEnd(); return; }
      if (state !== "intro") return;
      closePanel();
      toMenuBed();               // the menus' own quiet section of the track
      armMode(MODES[0]);         // ...and PLAY is the default mode again
      /* Ninety of ninety is reached on an end screen, so the golden veil is
         re-read on the way back rather than only at boot. */
      if (levelled()) LV.refreshVeil();
      W.clearWorld();
    });
    armMode(MODES[0]);
    if (W.state() === "intro") W.clearWorld();

    /* The title is sized off the game's own face, so it can only be measured
       once that face is really there: a data-URI @font-face is decoded
       asynchronously like any other. Fit now for the fallback metrics, and
       again when the real one lands. */
    fitAll();
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(fitAll);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
