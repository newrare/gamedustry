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
                           (ASSETS.images.bg, from assets/image/) behind the
                           menu, or — for a game that ships no picture — the
                           very gradient its SKIN paints the game view with.
                           Nothing of the world is drawn: no entity, no
                           Game.reset(), so the menu cannot break on what a
                           game does outside a round.
    the title, breathing   the SKIN's own #intro-title, wrapped in a node the
                           webshell animates so the game's look is untouched
    a menu, bottom right   PLAY / LEADERBOARD / OPTIONS / HELP, stacked, flush
                           right. PLAY is the motor's own #btn-start, so the
                           click path and the SPACE key are unchanged.
    panels in that band    LEADERBOARD / OPTIONS / HELP swap the menu out
                           without leaving the intro: same title, same scene,
                           a back arrow to come back.

  The type is the game's own too: `web.font` in the manifest names a family of
  assets/font/ (all OFL), which the builder embeds in front of the SKIN with two
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

  /* ── 0. strings ───────────────────────────────────────────────────────── */

  /* Every string the web shell adds, in the languages it ships. The motor's
     own CONFIG.copy is left alone: a playable build still needs its store
     wording, and only what the web target adds is translated here. */
  var STRINGS = {
    en: {
      play: "PLAY", leaderboard: "LEADERBOARD", options: "OPTIONS", help: "HELP",
      scoresTitle: "LEADERBOARD", optionsTitle: "OPTIONS", helpTitle: "HOW TO PLAY",
      best: "BEST SCORE", noScore: "No round played yet.",
      soonScores: "An online leaderboard is coming with the next update.",
      music: "Music", sfx: "Sound effects", pops: "Score callouts", language: "Language",
      resetScores: "Reset the leaderboard",
      resetAsk: "Tap again to erase your best score",
      resetDone: "Leaderboard cleared",
      controls: "CONTROLS",
      tap: "TAP", hold: "HOLD", drag: "DRAG", swipe: "SWIPE", aim: "AIM",
      back: "BACK", again: "PLAY AGAIN", menu: "MENU"
    },
    fr: {
      play: "JOUER", leaderboard: "CLASSEMENT", options: "OPTIONS", help: "AIDE",
      scoresTitle: "CLASSEMENT", optionsTitle: "OPTIONS", helpTitle: "COMMENT JOUER",
      best: "MEILLEUR SCORE", noScore: "Aucune partie jouée.",
      soonScores: "Un classement en ligne arrive avec la prochaine mise à jour.",
      music: "Musique", sfx: "Effets sonores", pops: "Messages de score", language: "Langue",
      resetScores: "Effacer le classement",
      resetAsk: "Touchez à nouveau pour effacer votre meilleur score",
      resetDone: "Classement effacé",
      controls: "CONTRÔLES",
      tap: "TAPER", hold: "MAINTENIR", drag: "GLISSER", swipe: "BALAYER", aim: "VISER",
      back: "RETOUR", again: "REJOUER", menu: "MENU"
    }
  };

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
    return out;
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

  /* ── 2. dom helpers ───────────────────────────────────────────────────── */

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* Pictograms from the shared assets/lucide/ pack, inlined as SVG rather than
     drawn through Icon (which is canvas-only). Stroked with currentColor, so a
     row's colour is the only thing that dresses them. */
  var ICON = {
    back:  '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    music: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
    sfx:   '<path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/>',
    pops:  '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
    lang:  '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
    reset: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || "ico") + '" viewBox="0 0 24 24" fill="none" ' +
           'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
           'stroke-linejoin="round" aria-hidden="true">' + ICON[name] + "</svg>";
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

       1. the painted background the game already embeds — `ASSETS.images.bg`
          (or `bg1`), the re-encoded `assets/image/<slug>-background.png` it
          draws behind its world. Same picture, so the menu and the round share
          one place;
       2. otherwise the game view's own CSS background — the radial gradient the
          SKIN sets on `html, body` — read off the page and re-applied to the
          frame, which anchors it to the 720x1280 design space instead of to
          the window.

     Nothing of the world itself is drawn: no entity, no `Game.reset()`, so a
     menu cannot depend on what a game does outside a round. */
  function dressBackground() {
    var box = $("web-bg");
    if (!box) return;
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
       the SPACE key and Sound.unlock()'s user gesture exactly as they were. */
    var start = $("btn-start");
    start.className = "web-item";
    start.textContent = COPY.play;
    items.push({ node: start, key: "play" });
    menu.appendChild(start);

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
  }

  function closePanel() {
    if (!open) return;
    // The Help panel borrows the motor's demo stage; give it back so a second
    // opening finds it where it was left.
    if (open === "help") parkDemo();
    open = null;
    panel.classList.remove("on");
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
    var b = el("button", "web-danger", icon("reset") + '<span class="txt"></span>');
    var txt = b.querySelector(".txt");
    var armed = 0, timer = null;
    txt.textContent = COPY.resetScores;
    function rest() {
      armed = 0; b.classList.remove("armed"); txt.textContent = COPY.resetScores;
    }
    b.addEventListener("click", function () {
      if (!armed) {
        armed = 1; b.classList.add("armed"); txt.textContent = COPY.resetAsk;
        clearTimeout(timer);
        timer = setTimeout(rest, 4000);
        return;
      }
      clearTimeout(timer);
      W.Store.set("bestScore", 0);
      armed = 0; b.classList.remove("armed"); txt.textContent = COPY.resetDone;
      timer = setTimeout(rest, 1600);
    });
    return b;
  }

  var PANELS = {
    scores: {
      title: function () { return COPY.scoresTitle; },
      fill: function (box) {
        var best = Number(W.Store.get("bestScore", 0)) || 0;
        box.appendChild(el("div", "web-best-lbl", COPY.best));
        box.appendChild(el("div", "web-best", String(best)));
        box.appendChild(el("div", "web-note", best ? COPY.soonScores : COPY.noScore));
      }
    },
    options: {
      title: function () { return COPY.optionsTitle; },
      fill: function (box) {
        row(box, "music", COPY.music, toggle("music"));
        row(box, "sfx",   COPY.sfx,   toggle("sfx"));
        row(box, "pops",  COPY.pops,  toggle("pops"));
        row(box, "lang",  COPY.language, langPair());
        box.appendChild(resetButton());
      }
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

    for (var i = 0; i < items.length; i++) items[i].node.textContent = COPY[items[i].key];
    if (COPY.tagline) $("intro-tagline").innerHTML = COPY.tagline;
    labelEnd();
    if (open) openPanel(open);                 // rebuild it in the new language
  }

  /* ── 7. the end screen ────────────────────────────────────────────────── */

  var btnAgain, btnMenu;

  function rewireEnd() {
    btnAgain = unbind("btn-install");
    btnAgain.addEventListener("click", function () { W.start(); });

    btnMenu = unbind("btn-replay");
    btnMenu.addEventListener("click", function () {
      W.Music.unduck();          // endRound ducked the bed for the reveal
      W.setState("intro");       // the state hook repaints the scene
    });
    labelEnd();
  }

  function labelEnd() {
    if (btnAgain) btnAgain.textContent = COPY.again;
    if (btnMenu) btnMenu.textContent = COPY.menu;
  }

  /* ── 8. keys ──────────────────────────────────────────────────────────── */

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

  /* ── 9. mount ─────────────────────────────────────────────────────────── */

  // The motor calls init() on DOMContentLoaded too, and registered first, so by
  // the time this runs buildIntro() has already written the copy we overwrite.
  function mount() {
    document.documentElement.lang = LANG;
    Settings.apply();
    buildIntro();
    dressBackground();
    rewireEnd();
    bindKeys();

    /* The tagline is the motor's, written in English in CONFIG.tagline; a game
       that ships a translated one in its manifest (web.copy.<lang>.tagline)
       gets it in the Help panel — markup included, because the key words are
       wrapped in <b class="w-…">. */
    if (COPY.tagline) $("intro-tagline").innerHTML = COPY.tagline;

    /* Every arrival on the menu — the first one, and every return from a
       round — closes whatever panel was open and wipes the last frame of the
       world off the canvas, so the background is what shows through. */
    W.onState(function (state) {
      if (state !== "intro") return;
      closePanel();
      W.clearWorld();
    });
    if (W.state() === "intro") W.clearWorld();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
