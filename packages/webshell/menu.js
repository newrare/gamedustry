/*
  webshell — the front end the `web` target adds on top of the motor.

  Loaded only by `node tools/build/build.mjs --target=web`. It reads the motor
  through window.__WEB__, which the web build injects into the bootstrap; on a
  playable build neither this file nor that object exists. The motor itself
  knows nothing about it: a target adds its own layer, it never patches the motor.

  What it changes, and nothing else:
    - the intro becomes a menu:  PLAY · LEADERBOARD · OPTIONS · HELP
    - the how-to-play demo moves out of the menu and into the Help panel, so
      the shared finger keeps playing the mechanic where a player looks for it
    - the end screen's install button becomes PLAY AGAIN, and the replay link
      becomes MENU: a web build has no store to send anyone to

  Leaderboard and Options are deliberately thin: the real ones belong to
  packages/meta (phase 5). The best score shown here is the one the motor has
  always written to Store on endRound, so it is a real number, not a mock.

  ES5-ish on purpose, like the motor: this runs in the same mobile WebViews.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  if (!W) return;                       // not a web build

  var CONFIG = W.CONFIG;

  /* Every string the web shell adds, in the languages it ships. The motor's
     own CONFIG.copy is left alone: a playable build still needs its store
     wording, and only the menu the web target adds is translated here. */
  var STRINGS = {
    en: {
      play: "PLAY",
      leaderboard: "LEADERBOARD",
      options: "OPTIONS",
      help: "HELP",
      helpTitle: "HOW TO PLAY",
      optionsTitle: "OPTIONS",
      scoresTitle: "LEADERBOARD",
      best: "BEST SCORE",
      back: "BACK",
      again: "PLAY AGAIN",
      menu: "MENU",
      controls: "CONTROLS",
      tap: "TAP",
      hold: "HOLD",
      drag: "DRAG",
      swipe: "SWIPE",
      aim: "AIM",
      soonScores: "An online leaderboard is coming with the next update.",
      soonOptions: "Sound and controls are coming with the next update."
    },
    fr: {
      play: "JOUER",
      leaderboard: "CLASSEMENT",
      options: "OPTIONS",
      help: "AIDE",
      helpTitle: "COMMENT JOUER",
      optionsTitle: "OPTIONS",
      scoresTitle: "CLASSEMENT",
      best: "MEILLEUR SCORE",
      back: "RETOUR",
      again: "REJOUER",
      menu: "MENU",
      controls: "CONTRÔLES",
      tap: "TAPER",
      hold: "MAINTENIR",
      drag: "GLISSER",
      swipe: "BALAYER",
      aim: "VISER",
      soonScores: "Un classement en ligne arrive avec la prochaine mise à jour.",
      soonOptions: "Le son et les commandes arrivent avec la prochaine mise à jour."
    }
  };

  /* Which language, in order: ?lang=fr in the URL — the site plays a game in
     an iframe and passes the page's own choice that way — then CONFIG.web.lang
     from the manifest, then the browser. An unknown code falls back to English
     rather than showing half a translation. */
  function pickLang() {
    var m = /[?&]lang=([A-Za-z-]{2,5})/.exec(location.search);
    var want = m ? m[1] : ((CONFIG.web && CONFIG.web.lang) || navigator.language || "en");
    want = String(want).toLowerCase().slice(0, 2);
    return STRINGS[want] ? want : "en";
  }

  var LANG = pickLang();

  /* The game has the last word through CONFIG.web.copy, which the web build
     fills from the manifest. Two shapes, both useful:
       copy: { play: "GO" }                 one wording, every language
       copy: { fr: { play: "GO" } }         one wording per language
     `tagline` is a string like any other here: it is what the Help panel
     shows, so a game translates its own one-liner with the same hook. */
  var COPY = (function () {
    var out = {};
    function merge(src) {
      if (!src) return;
      for (var key in src) if (src.hasOwnProperty(key)) out[key] = src[key];
    }
    merge(STRINGS.en);                       // the complete set, always
    merge(STRINGS[LANG]);
    var over = (CONFIG.web && CONFIG.web.copy) || {};
    merge(over[LANG] && typeof over[LANG] === "object" ? over[LANG] : over);
    return out;
  })();

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
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

  /* ── 1. the panel ─────────────────────────────────────────────────────── */

  var panel, panelTitle, panelBody, open = null;

  function buildPanel() {
    panel = el("div", "hidden");
    panel.id = "web-panel";
    panelTitle = el("div"); panelTitle.id = "web-panel-title";
    panelBody = el("div"); panelBody.id = "web-panel-body";
    var close = el("button", "link", COPY.back);
    close.id = "web-panel-close";
    close.addEventListener("click", function () { closePanel(); });
    panel.appendChild(panelTitle);
    panel.appendChild(panelBody);
    panel.appendChild(close);
    $("frame").appendChild(panel);
  }

  function openPanel(name) {
    open = name;
    panelTitle.textContent = PANELS[name].title();
    panelBody.innerHTML = "";
    PANELS[name].fill(panelBody);
    panel.classList.remove("hidden");
  }

  function closePanel() {
    if (!open) return;
    // The Help panel borrows the motor's demo stage; give it back so a second
    // opening finds it where it was left.
    if (open === "help") parkDemo();
    open = null;
    panel.classList.add("hidden");
  }

  /* ── 2. the three panels ──────────────────────────────────────────────── */

  /* The demo stage is the motor's node, moved rather than copied: a SKIN
     re-dresses `.demo-*` by id-free selectors, so the game's own artwork
     follows it into Help with no extra rule. `demoHome` is where it sleeps
     while Help is closed. */
  var demoHome;
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

  var PANELS = {
    help: {
      title: function () { return COPY.helpTitle; },
      fill: function (box) {
        var line = el("div", "web-help-line", COPY.tagline || CONFIG.tagline || "");
        box.appendChild(line);
        var demo = $("intro-demo");
        if (demo) box.appendChild(demo);           // moved, not cloned
        var keys = controlHints(), row = el("div", "web-keys");
        for (var i = 0; i < keys.length; i++) row.appendChild(el("span", "web-key", keys[i]));
        box.appendChild(row);
        box.appendChild(el("div", "web-keys-lbl", COPY.controls));
      }
    },
    scores: {
      title: function () { return COPY.scoresTitle; },
      fill: function (box) {
        box.appendChild(el("div", "web-best-lbl", COPY.best));
        box.appendChild(el("div", "web-best", String(W.Store.get("bestScore", 0))));
        box.appendChild(el("div", "web-soon", COPY.soonScores));
      }
    },
    options: {
      title: function () { return COPY.optionsTitle; },
      fill: function (box) { box.appendChild(el("div", "web-soon", COPY.soonOptions)); }
    }
  };

  /* ── 3. the menu ──────────────────────────────────────────────────────── */

  function buildMenu() {
    var intro = $("screen-intro");
    var start = $("btn-start");
    start.textContent = COPY.play;

    /* The one line that explains the game is the motor's, written in English
       in CONFIG.tagline. A game that ships a translated one in its manifest
       (web.copy.<lang>.tagline) gets it here as well as in the Help panel —
       markup included, because the key words are wrapped in <b class="w-…">. */
    if (COPY.tagline) $("intro-tagline").innerHTML = COPY.tagline;

    // Where the demo stage lives while Help is closed: hidden, still inside the
    // intro, so nothing has to remember its markup.
    demoHome = el("div");
    demoHome.id = "web-demo-home";
    demoHome.hidden = true;
    intro.appendChild(demoHome);
    parkDemo();

    var nav = el("div");
    nav.id = "web-menu";
    [["scores", COPY.leaderboard], ["options", COPY.options], ["help", COPY.help]]
      .forEach(function (entry) {
        var b = el("button", "web-menu-btn", entry[1]);
        b.addEventListener("click", function () { openPanel(entry[0]); });
        nav.appendChild(b);
      });
    intro.appendChild(nav);
  }

  /* ── 4. the end screen ────────────────────────────────────────────────── */

  function rewireEnd() {
    var again = unbind("btn-install");
    again.textContent = COPY.again;
    again.addEventListener("click", function () { W.start(); });

    var menu = unbind("btn-replay");
    menu.textContent = COPY.menu;
    menu.addEventListener("click", function () {
      W.Music.unduck();          // endRound ducked the bed for the reveal
      W.clearWorld();            // the intro is transparent: wipe the last frame
      W.setState("intro");
    });
  }

  /* ── 5. keys ──────────────────────────────────────────────────────────── */

  /* The bootstrap reads SPACE from the intro as "start the round". With a panel
     open that would launch a game the player cannot see, so the web shell takes
     the key first (capture runs before the bootstrap's own window listener) and
     lets ESCAPE close the panel. */
  function bindKeys() {
    window.addEventListener("keydown", function (e) {
      var esc = e.key === "Escape" || e.keyCode === 27;
      if (esc && open) { e.preventDefault(); closePanel(); return; }
      if (!open) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);
  }

  /* ── 6. mount ─────────────────────────────────────────────────────────── */

  // The motor calls init() on DOMContentLoaded too, and registered first, so by
  // the time this runs buildIntro() has already written the copy we overwrite.
  function mount() {
    document.documentElement.lang = LANG;
    buildMenu();
    buildPanel();
    rewireEnd();
    bindKeys();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
