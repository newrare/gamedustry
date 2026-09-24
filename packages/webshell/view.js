/*
  webshell — the view system: what a screen IS, and what a modal is.

  Loaded FIRST of the web layer, before levels.js / meta.js / album.js /
  daily.js / menu.js, and it publishes the two handles they all read:
  window.__VIEW__ and window.__MODAL__. Like the rest of packages/webshell it
  is inert without window.__WEB__, so a playable never sees any of it.

  WHY IT EXISTS. This front end grew a screen at a time, and each one brought
  its own mount, its own backdrop, its own back arrow, its own idea of who is
  on top and its own music duck. Six screens meant six answers to the same six
  questions, and a seventh screen meant re-deciding all of them: the album and
  the shop had to be re-appended to the end of the frame because DOM ORDER was
  what decided which of two equal z-indexes won, ESCAPE meant a different thing
  in each file, and the bed was ducked to 0.4 by the map, to 0.35 by a panel
  and not at all by the end screen.

  So there are two kinds of thing in this shell and exactly two:

    A VIEW is a place the player goes — title, map, sticker, shop, ranking,
    score. One at a time is what they are looking at, they stack (the shop
    opens over the album, which opened over the map), and BACK peels one off.

    A MODAL is something that happens over wherever they are — options, help,
    leaving a round, a daily reward, an ad, a prize. It never replaces the
    screen under it, it is always on top of every view, and it is dismissed
    rather than navigated.

  Everything else in the web shell asks this file for both. What a view owns is
  its own CONTENT — what it paints and what it says. What it no longer owns:

    mounting          define(name, spec) once; this file appends, re-appends
                      on every open (which is what makes DOM order the stack
                      order and retires the re-append comment album.js carried)
                      and never has to be given a z-index per screen.
    the back arrow    one stack, one back(): it peels the top view, and the
                      view under it is whatever was under it.
    ESCAPE            one capture listener, in one order — the top modal, then
                      the top view, then whatever the round wants.
    the bed           ONE factor for everything this layer opens (DUCK below),
                      counted rather than toggled, so a card closing over the
                      end screen cannot raise a bed the motor ducked.
    the wallet band   the HUD is the view system's, not the map's: a view says
                      `hud: true` and the band is over it. See section 5.

  ES5-ish on purpose, like the motor and the rest of the shell: this runs in
  the same mobile WebViews.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  if (!W) return;                       // not a web build

  /* menu.js hands its dom helpers and its language over on mount, the way the
     map and the meta layer already get them — one `el` and one icon pack in
     this shell, not six. Until then this file uses its own three-line `el`,
     because it is loaded before menu.js exists. */
  var API = null;

  function $(id) { return document.getElementById(id); }
  function frame() { return $("frame"); }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ── 1. the bed, counted ──────────────────────────────────────────────── */

  /* ONE FACTOR, and it is counted rather than toggled. Music.duck/unduck is a
     single global level with no stack of its own (packages/engine/engine.js),
     so two screens that both duck and both unduck raise the bed the moment the
     FIRST of them closes — and the end screen is worse than that: the motor
     ducks it there itself (shell.js, endRound), so a gift card closing over it
     used to hand the player a bed at full volume under a screen that is still
     being read.

     So: every view above the floor and every modal asks for the duck, the
     count is what decides, and what "no more askers" means is read off the
     motor's own state rather than assumed — on the end screen the floor is the
     motor's duck, everywhere else it is silence removed. */
  var DUCK = 0.4;                       // the one factor this layer applies
  var END_DUCK = 0.3;                   // what the motor applies on endRound
  var asking = 0;

  function bedDown() {
    asking++;
    if (asking === 1) W.Music.duck(DUCK, 0.25);
  }

  function bedUp() {
    if (asking === 0) return;
    asking--;
    if (asking > 0) return;
    if (W.state() === "end") W.Music.duck(END_DUCK, 0.4);
    else W.Music.unduck();
  }

  /* ── 2. the modal ─────────────────────────────────────────────────────── */

  /* One implementation for every card this shell opens. It was five before —
     the note, the gift, the prize, the ad and the sticker reveal each built
     their own box, added their own `.on` on the next frame and removed
     themselves on their own timer (200 ms here, 220 ms there) — and the two
     panels of the menu were a sixth shape that was not even a card.

     THE CLASS NAMES ARE KEPT. A modal is `wm-modal` AND `mt-modal`, its card
     is `wm-card` AND `mt-card`: the first pair is what this file styles
     (view.css), the second is what every rule already written against the meta
     layer's cards still finds. Renaming them would have been a hundred
     selectors of churn in meta.css for no change on screen. */
  var modals = [];                      // the stack, bottom first

  var FADE = 220;                       // the one teardown delay

  /* `spec`:
       kind      a class on the box — `options`, `help`, `gift`, `ad`… It is
                 what the stylesheets dress, and what `Modal.top()` reports.
       fill      fill(card, close) — the caller writes its own content, which
                 is the one thing a card does not share with the next.
       card      false for a caller that wants the scrim and nothing else
                 (the gift ceremony deals its own three boxes over the frame).
       dismiss   true when a TAP ANYWHERE puts it away. A card that asks a
                 question sets it false: a tap must never stand in for a
                 choice, and a card with switches on it must not close under
                 the finger that reached for one.
       esc       whether ESCAPE closes it. It defaults to `dismiss` and is
                 named apart because the two are not the same question: the
                 options card is not dismissed by a tap and IS closed by the
                 key, while the three gift boxes answer to neither.
       onHide    the moment it starts to go, while its node is still in the
                 document. A caller that has to take something BACK out of the
                 card uses this one: the help card borrows the motor's demo
                 stage, and `getElementById` cannot find a node inside a card
                 that has already been detached.
       onClose   after the node is gone.
       bed       false for a card that must not touch the music (the ad).
  */
  function open(spec) {
    spec = spec || {};
    var box = el("div", "wm-modal mt-modal " + (spec.kind || ""));
    var card = null;
    if (spec.card !== false) {
      card = el("div", "wm-card mt-card");
      box.appendChild(card);
    }

    var handle = {
      kind: spec.kind || "",
      box: box,
      card: card,
      dismiss: spec.dismiss !== false,
      esc: spec.esc != null ? !!spec.esc : spec.dismiss !== false,
      close: function () { shut(handle); }
    };

    if (spec.fill) spec.fill(card || box, handle.close);

    frame().appendChild(box);
    modals.push(handle);
    if (spec.bed !== false) { handle.bed = true; bedDown(); }
    /* One frame on screen at opacity 0, so the transition has a start state to
       run from: a node appended and classed in the same frame animates from
       nothing at all in every engine this shell runs in. */
    requestAnimationFrame(function () { fitTitles(box); box.classList.add("on"); });
    /* A card is rewritten in place more than once — the gift's boxes become
       the reveal, a reward card changes its title — so the fit follows the
       card's children rather than running once. */
    if (card && window.MutationObserver) {
      handle.watch = new MutationObserver(function () {
        requestAnimationFrame(function () { fitTitles(box); });
      });
      handle.watch.observe(card, { childList: true });
    }

    if (handle.dismiss) {
      box.addEventListener("click", function (e) {
        /* A control inside the card answers for itself; the rest of the card,
           and the scrim around it, is the way out. */
        if (e.target.closest && e.target.closest("button")) return;
        handle.close();
      });
    }

    handle.onHide = spec.onHide || null;
    handle.onClose = spec.onClose || null;
    notify();
    return handle;
  }

  /* THE TITLE IS ONE LINE, AT THE SIZE THE CARD LEAVES IT. The motor's own
     `Fit.box` — measure and scale DOWN, never up — against the width the card
     gives the heading, so the stylesheet can ask for a title's size and not
     for the size the longest title in the longest language happens to fit at.
     Under the floor a title wraps instead: two lines read, a clipped one does
     not. */
  var TITLE_FLOOR = 32;
  function fitTitles(box) {
    if (!W.Fit || !box.parentNode) return;
    var hs = box.querySelectorAll(".mt-h");
    for (var i = 0; i < hs.length; i++) {
      var n = hs[i];
      n.classList.remove("wrap");
      W.Fit.box(n, TITLE_FLOOR);
      if (n.scrollWidth > n.clientWidth + 1) n.classList.add("wrap");
    }
  }

  function shut(handle) {
    var i = modals.indexOf(handle);
    if (i < 0) return;                  // already closed: closing twice is a no-op
    modals.splice(i, 1);
    if (handle.watch) { handle.watch.disconnect(); handle.watch = null; }
    if (handle.bed) bedUp();
    /* While it is still in the document: see `onHide` above. */
    if (handle.onHide) handle.onHide();
    handle.box.classList.remove("on");
    setTimeout(function () {
      if (handle.box.parentNode) handle.box.parentNode.removeChild(handle.box);
      if (handle.onClose) handle.onClose();
    }, FADE);
    notify();
  }

  /* CLOSES, AND SAYS WHETHER IT DID. It is the force: the stack shutting
     itself down uses it, and so does anything that has to empty the layer. It
     is NOT what a key calls — `escape` below is — because the two answer
     different questions, and a `closeTop` that reported "handled" without
     closing anything is a loop waiting to happen for any caller that drains
     the stack with it. */
  function closeTopModal() {
    var m = modals[modals.length - 1];
    if (!m) return false;
    m.close();
    return true;
  }

  function anyModal() { return modals.length > 0; }

  function topModal() {
    var m = modals[modals.length - 1];
    return m ? m.kind : null;
  }

  /* ── 3. the view stack ────────────────────────────────────────────────── */

  /* A view is registered once and opened as often as it likes. The owner keeps
     its own DOM — this file never writes a screen's content — and hands over
     the five things that used to be answered per screen.

     `spec`:
       node()    the view's own element. Built on the first open through
                 `build`, then reused; it belongs to the owner.
       build()   optional, called once before the first `node()`.
       show()    the owner paints. Called AFTER the node is on screen, so
                 anything it measures measures.
       hide()    the owner stops. Called before the class comes off.
       hud       true, false or "auto" — see section 5.
       decor     what Decor.dress puts around it, or nothing.
       bed       false for a view that must not duck (the title screen: its
                 own bed IS the screen).
  */
  var defs = {};                        // name → spec
  var stack = [];                       // names, bottom first
  var Z_BASE = 34;                      // the first view; the rest climb from it
  var watchers = [];

  function notify() {
    for (var i = 0; i < watchers.length; i++) watchers[i](stack[stack.length - 1] || null);
  }

  function define(name, spec) { defs[name] = spec; }

  function nodeOf(name) {
    var s = defs[name];
    if (!s) return null;
    if (s.build && !s.built) { s.built = true; s.build(); }
    return s.node();
  }

  function isOpen(name) { return stack.indexOf(name) >= 0; }

  /* Opening a view that is already in the stack does not stack it twice: it
     peels whatever is over it instead, which is what a door back to a screen
     the player is already standing under has to mean (the wallet's chips are
     doors both ways — album → shop → album). */
  function go(name, opts) {
    var spec = defs[name];
    if (!spec) return;
    var at = stack.indexOf(name);
    if (at >= 0) {
      while (stack.length > at + 1) back();
      return;
    }
    var node = nodeOf(name);
    if (!node) return;
    /* THE STACK OWNS THE Z-ORDER, and it has to: DOM order alone only settles
       a tie, and these four screens were written with three different
       z-indexes (the map 34, the ranking 35, the album and the shop 36). Every
       one of them is a door to the others, so the map opened from the album
       arrived UNDERNEATH it — appended last, and still 34 against 36. The
       depth is what decides now, written on the node as it goes up and taken
       off as it comes down; the stylesheets keep their own value, which is
       what makes each screen a stacking context of its own.

       Re-appended as well, so the DOM says the same thing the z-index does. */
    frame().appendChild(node);
    node.style.zIndex = String(Z_BASE + stack.length);
    node.classList.add("on");
    stack.push(name);
    if (spec.bed !== false) bedDown();
    if (spec.show) spec.show(opts || {});
    if (spec.decor) W.Decor.dress(node, spec.decor);
    syncHud();
    notify();
  }

  function back() {
    var name = stack.pop();
    if (!name) return false;
    var spec = defs[name];
    if (spec.hide) spec.hide();
    var node = spec.node();
    if (node) {
      node.classList.remove("on");
      node.style.zIndex = "";
      W.Decor.clear(node);
    }
    if (spec.bed !== false) bedUp();
    syncHud();
    notify();
    return true;
  }

  /* Down to the floor — what a round starting, or a state change, does to
     every screen that was open in front of it. */
  /* HOME IS NOT ALWAYS THE TITLE SCREEN. A game with a VILLAGE
     (packages/webshell/village.js) puts a place between the title and the map,
     and that place is where the player lives: the band's house chip, the end
     screen's first button and the ESCAPE that walks all the way out all mean
     "the village" there, and the title screen becomes the front door you come
     through once. `base` is that view's name, declared by whoever owns it, and
     null everywhere else — where home still means peeling the stack to
     nothing. */
  var base = null;

  function setBase(name) { base = name || null; }

  function home() {
    if (!base) { clear(); return; }
    var at = stack.indexOf(base);
    if (at >= 0) { while (stack.length > at + 1) back(); return; }
    clear();
    go(base);
  }

  function clear() { while (stack.length) back(); }

  /* The floor is the motor's own state, and this layer never fights it: a
     round starting or an end screen arriving closes every view and every card
     that was open over the screen they replace — ALL of them, the base view
     included: a round is not played under a village. */
  function floor(state) {
    if (state === "intro") return;      // the title screen is the floor itself
    clear();
    while (closeTopModal());
  }

  /* ── 4. keys, in one order ────────────────────────────────────────────── */

  /* ESCAPE used to mean five things in four files, each one guarding against
     the other four (`if (esc && metaed() && AL.anyOpen())`, `if (esc && open)`,
     `if (esc && levelled() && LV.isOpen())`). The stack already knows the
     answer: whatever is on top is what a press closes. menu.js calls this
     first and only handles what it comes back false for — the round's own
     pause, which is not a screen at all. */
  function escape() {
    var m = modals[modals.length - 1];
    if (m) {
      /* A card that answers to no key still SWALLOWS it: the three gift boxes
         are a choice, and a choice has no default — least of all one the
         screen underneath would act on. */
      if (m.esc) m.close();
      return true;
    }
    if (stack.length) return back();
    return false;
  }

  /* ── 5. the HUD band ──────────────────────────────────────────────────── */

  /* WHAT THE PLAYER CARRIES, DRAWN ONCE. The wallet component was already one
     (MT.wallet, packages/webshell/meta.js) but it was mounted by whoever
     wanted it: the map's header, the album's header, the shop's header and a
     transient layer on the end screen — four hosts, four positions, four
     opinions about which chips are doors, and nothing at all on the two
     screens in between.

     So the band belongs to the view system: one node, filled once by whoever
     knows what a wallet is (`hudMount`), and shown over a view that says it
     carries one. A view declares:

       hud: true     the band is up for as long as the view is
       hud: "auto"   the band is DOWN, and comes up only when something flies
                     into it — the end screen, where a chip that appears is
                     part of what the screen is saying and a chip standing
                     there through the reveal is furniture. Meta calls
                     hudShow() when it pays and hudHide() when it is done.
       nothing       no band. The title screen and the ranking carry none: one
                     is the game's front door and the other writes its own
                     figures at full size.

     The ROUND is not a view and never shows it: the top band is the game's,
     all of it, and the thirteen fill it differently (CLAUDE.md). */
  var hudBox = null, hudFill = null, hudAuto = false;
  var BAND_H = 56;                      // what a header under it has to clear

  function buildHud() {
    if (hudBox) return;
    hudBox = el("div"); hudBox.id = "web-hud";
    hudBox.hidden = true;
    frame().appendChild(hudBox);
    if (hudFill) hudFill(hudBox);
  }

  function hudMount(fn) {
    hudFill = fn;
    if (hudBox) fn(hudBox);
  }

  function hudMode() {
    var name = stack[stack.length - 1];
    return (name ? defs[name].hud : floorHud()) || false;
  }

  /* The floor has a band of its own only on the end screen, and only while
     something is being paid into it. */
  function floorHud() { return W.state() === "end" ? "auto" : false; }

  function syncHud() {
    if (!hudFill) return;               // a game with no wallet has no band
    buildHud();
    var mode = hudMode();
    var want = mode === "auto" ? hudAuto : !!mode;
    /* WHICH INSTRUMENT, not just whether. The band holds both — the standing
       wallet and the transient one the end screen is paid into — and the class
       is what says which of the two this screen carries, so neither has to be
       built and thrown away between screens. */
    hudBox.className = want ? ("on hud-" + (mode === "auto" ? "auto" : "full")) : "";
    hudBox.hidden = !want;
    /* THE BAND TAKES NO ROOM AND HAS TO BE GIVEN SOME. It is a layer over the
       frame, so a header under it would be read through it — one number over
       another. `--wh-band` is what every view's header and scroll band start
       below, and it is 0 on a game with no wallet, where there is no band to
       clear. One declaration, four screens. */
    var f = frame();
    if (f) f.style.setProperty("--wh-band", want ? BAND_H + "px" : "0px");
  }

  function hudShow() { hudAuto = true; syncHud(); }
  function hudHide() { hudAuto = false; syncHud(); }

  /* ── 6. the corner controls ───────────────────────────────────────────── */

  /* OPTIONS AND HELP, FROM ANYWHERE. They were two entries of the title menu
     and nothing else, so a player standing on the map who wanted the music off
     had to go back to the title screen for it, and the one place the rules are
     written was a panel of a screen they had already left. They are modals
     now, and the pair of buttons that opens them is in the bottom-right corner
     of every surface but the title screen — which has them as menu entries,
     because a front door lists what is behind it.

     The round adds one more, in front of the pair: the way out. That is the
     corner a playable has nothing to put in, and the whole difference between
     the round being an ad and the round being a game the player owns. */
  var ctlBar = null, ctlExtra = null;

  function buildCorner(items) {
    if (!ctlBar) {
      ctlBar = el("div"); ctlBar.id = "web-ctls";
      frame().appendChild(ctlBar);
      ctlExtra = el("div", "web-ctl-extra");
      ctlBar.appendChild(ctlExtra);
    }
    for (var i = 0; i < items.length; i++) addCtl(items[i]);
    syncCorner();
  }

  function addCtl(item) {
    var b = el("button", "web-ctl", API ? API.icon(item.icon) : "");
    b.setAttribute("aria-label", item.label || "");
    b.addEventListener("click", item.on);
    b.setAttribute("data-ctl", item.name || item.icon);
    ctlBar.appendChild(b);
    return b;
  }

  /* The round's own control, put in front of the pair and taken away again:
     it is the one button on this bar whose meaning depends on where the
     player is. */
  function cornerExtra(item) {
    if (!ctlBar) return;
    ctlExtra.innerHTML = "";
    if (!item) return;
    var b = el("button", "web-ctl", API ? API.icon(item.icon) : "");
    b.setAttribute("aria-label", item.label || "");
    b.addEventListener("click", item.on);
    ctlExtra.appendChild(b);
  }

  function cornerLabels(map) {
    if (!ctlBar) return;
    var all = ctlBar.querySelectorAll("[data-ctl]");
    for (var i = 0; i < all.length; i++) {
      var k = all[i].getAttribute("data-ctl");
      if (map[k]) all[i].setAttribute("aria-label", map[k]);
    }
  }

  /* THE ONE WAY HOME, WHERE THE BAND IS NOT THERE TO BE IT. A view's way out
     is the band's LEVEL CHIP — first in the row, on every screen, where the
     player is already looking — and a header carries no button at all. But a
     game with no `web.meta` has no band, and then a view with no button is a
     screen with no way off it: twelve of the thirteen reach their map from
     PLAY and would never reach the title screen again.

     So the rule is one sentence with one branch in it: there is always exactly
     one way home, and it is the level chip where there is a band and this
     button where there is not. `banded()` is what a view asks. */
  function banded() { return !!hudFill; }

  function homeButton(label) {
    var b = el("button", "web-home", API ? API.icon("home", "home-ico") : "");
    b.setAttribute("aria-label", label || "");
    b.addEventListener("click", home);
    return b;
  }

  /* THE CORNER IS THE ROUND'S, AND ONLY THE ROUND'S. Every other surface has
     somewhere of its own to say the same things: the title screen lists
     OPTIONS and HELP as menu entries, the map's level 0 opens the help card,
     and a view already carries four doors in the band over it. Two more
     controls on top of those is a fifth and a sixth thing in a corner the
     player is not looking at — while in a ROUND there is nothing else at all,
     which is the whole difference between a playable, where the round IS the
     ad, and a game the player owns. */
  /* ...WITH ONE BRANCH, AND THE VILLAGE IS WHY IT EXISTS. A village is a view
     whose content is six buildings, and there are more doors than an image
     model puts on one sheet — so a village that did not build OPTIONS has
     nowhere to put the switches, while every other door it skipped is already
     a chip in the band over it. `cornerOnView` is that hole plugged: the bar
     comes up on ONE named view, carrying only what it is given.

     It is still not a second corner bar: it is this one, showing a subset. */
  var ctlView = null, ctlNames = null;

  function cornerOnView(name, names) {
    ctlView = (names && names.length) ? name : null;
    ctlNames = ctlView ? names : null;
    syncCorner();
  }

  function syncCorner() {
    if (!ctlBar) return;
    /* The motor's state stays "intro" under every view this shell stacks — it
       knows nothing about them — so what a view's corner is gated on is the
       TOP of the stack, not the state. */
    var onView = !!ctlView && stack[stack.length - 1] === ctlView;
    ctlBar.hidden = !(W.state() === "playing" || onView);
    var all = ctlBar.querySelectorAll("[data-ctl]");
    for (var i = 0; i < all.length; i++) {
      all[i].hidden = onView && ctlNames.indexOf(all[i].getAttribute("data-ctl")) < 0;
    }
  }

  /* ── 7. the module ────────────────────────────────────────────────────── */

  watchers.push(syncCorner);

  window.__VIEW__ = {
    /* menu.js hands the dom helpers and the icon pack over before anything
       defines a view, so the corner controls can be drawn with the same
       pictograms every other screen uses. */
    mount: function (api) { API = api; },

    define: define,
    go: go,
    back: back,
    home: home,
    base: setBase,
    clear: clear,
    floor: floor,
    escape: escape,
    top: function () { return stack[stack.length - 1] || null; },
    depth: function () { return stack.length; },
    isOpen: isOpen,
    onChange: function (fn) { watchers.push(fn); },

    banded: banded,
    homeButton: homeButton,

    hudMount: hudMount,
    hudShow: hudShow,
    hudHide: hudHide,

    corner: buildCorner,
    cornerExtra: cornerExtra,
    cornerLabels: cornerLabels,
    cornerOnView: cornerOnView,
    cornerSync: syncCorner
  };

  window.__MODAL__ = {
    open: open,
    closeTop: closeTopModal,
    any: anyModal,
    top: topModal,
    count: function () { return modals.length; },
    /* For a caller that rewrites a title outside the card's own children. */
    fit: function (h) { if (h && h.box) fitTitles(h.box); }
  };
})();
