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

  /* THE LAST LINE OF EVERY CARD. A card has no cross (packages/shell/
     motor.css, CARD): it says what the tap does, and when the caller has
     nothing more precise to say it is one of these two. */
  var STRINGS = {
    en: { tapClose: "Tap to close", tapOutside: "Tap outside to close" },
    fr: { tapClose: "Touche pour fermer", tapOutside: "Touche à côté pour fermer" }
  };
  var LANG = "en";
  function tapCopy(key) { return (STRINGS[LANG] || STRINGS.en)[key]; }

  /* THE SIX SLOTS (motor.css, CARD): the tag, the eyebrow, the title, the
     body the caller fills, the tap line. The first three and the last are
     written HERE, in this order, so no card can put its title under its
     content or forget the line that says how it goes away. `undefined`
     leaves a slot as it is, `null` or "" takes it off. A string is written
     as text and shouted through the motor's `upper`; a node is taken as it
     is. */
  function child(card, cls) {
    for (var c = card.firstChild; c; c = c.nextSibling) {
      if (c.classList && c.classList.contains(cls)) return c;
    }
    return null;
  }

  function slot(card, cls, tag, value, place) {
    var n = child(card, cls);
    if (value === undefined) return n;
    if (value === null || value === "") {
      if (n) card.removeChild(n);
      return null;
    }
    if (!n) {
      n = el(tag, cls);
      place(n);
    }
    if (typeof value === "string" || typeof value === "number") {
      n.textContent = cls === "mt-pin" ? String(value) : W.upper(String(value));
    } else {
      /* a copy, so one node can dress a card twice (the gift keeps its
         eyebrow through the reveal) */
      n.innerHTML = "";
      n.appendChild(value.cloneNode(true));
    }
    return n;
  }

  function setSlots(h, s) {
    var card = h.card;
    if (!card || !s) return;
    var body = h.body;
    function before(ref) { return function (n) { card.insertBefore(n, ref()); }; }
    function titleOrBody() { return child(card, "mt-h") || body; }
    slot(card, "mt-pin", "i", s.badge, function (n) { card.insertBefore(n, card.firstChild); });
    slot(card, "mt-h", "h3", s.title, before(function () { return body; }));
    slot(card, "mt-eyebrow", "div", s.eyebrow, before(titleOrBody));
    slot(card, "mt-tap", "p", s.tap, function (n) { card.appendChild(n); });
    requestAnimationFrame(function () { fitTitles(h.box); });
  }

  /* `spec`:
       kind      a class on the box — `options`, `help`, `gift`, `ad`… It is
                 what the stylesheets dress, and what `Modal.top()` reports.
       eyebrow   the line over the title                         (optional)
       title     the title
       badge     the tag on the corner, a number                 (optional)
       tap       the last line, what a tap does. Every card carries one:
                 left out, it is "Tap to close" (or "Tap outside to close"
                 for `dismiss: "outside"`); a card whose tap does something
                 else says its own ("Tap a box", "Tap to collect").
                 All four are rewritten later with `handle.set({...})`.
       fill      fill(body, close, handle) — the caller writes the card's
                 BODY, which is the one thing a card does not share with the
                 next. `handle.body` is the same node; `handle.card` is the
                 card around the slots, for a layer painted under all of it.
       height    the card's height in design px, for a card whose content
                 changes under the finger (a filter, a page) and must not
                 make the card jump. Left out — the default, and almost every
                 card — the card is the height of what it holds. With it, the
                 body takes the room the slots leave and scrolls inside it.
       card      false for a caller that wants the scrim and nothing else
                 (the gift ceremony deals its own three boxes over the frame).
       dismiss   true when a TAP ANYWHERE puts it away. "outside" when only a
                 tap AROUND the card does: a card with switches on it must not
                 close under the finger that reached for one, and since there
                 is no cross, the scrim is its way out. false for a card that
                 asks a question: a tap must never stand in for a choice.
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
    var card = null, body = null;
    if (spec.card !== false) {
      card = el("div", "wm-card mt-card" + (spec.height ? " fixed" : ""));
      if (spec.height) card.style.height = spec.height + "px";
      body = el("div", "mt-body");
      card.appendChild(body);
      box.appendChild(card);
    }

    var mode = spec.dismiss === "outside" ? "outside" : spec.dismiss !== false;
    var handle = {
      kind: spec.kind || "",
      box: box,
      card: card,
      body: body,
      dismiss: mode,
      esc: spec.esc != null ? !!spec.esc : spec.dismiss !== false,
      close: function () { shut(handle); },
      set: function (s) { setSlots(handle, s); }
    };

    setSlots(handle, {
      eyebrow: spec.eyebrow, title: spec.title, badge: spec.badge,
      tap: spec.tap !== undefined ? spec.tap
         : tapCopy(mode === "outside" ? "tapOutside" : "tapClose")
    });

    if (spec.fill) spec.fill(body || box, handle.close, handle);

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

    if (handle.dismiss === "outside") {
      box.addEventListener("click", function (e) {
        /* Only the scrim: everything on the card is something to touch — and
           so is a control standing on the scrim (the wipe under the options,
           which asks twice and would otherwise close the card on the first). */
        if (card && card.contains(e.target)) return;
        if (e.target.closest && e.target.closest("button")) return;
        handle.close();
      });
    } else if (handle.dismiss) {
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
    if (node.__sheet) arrive(node.__sheet);
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
  var ctlItems = [];                    // what buildCorner was given, in order
  var ctlLabels = {};                   // the latest cornerLabels, by name

  function buildCorner(items) {
    ctlItems = ctlItems.concat(items);
    for (var s = 0; s < sheets.length; s++) fillCtls(sheets[s]);
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
    var b = el("button", "btn btn-icon btn-sm web-ctl", API ? API.icon(item.icon) : "");
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
    var b = el("button", "btn btn-icon btn-sm web-ctl", API ? API.icon(item.icon) : "");
    b.setAttribute("aria-label", item.label || "");
    b.addEventListener("click", item.on);
    ctlExtra.appendChild(b);
  }

  /* Frame-wide, because the pair is drawn twice: once in this corner, and
     once in the bar of every sheet (section 6b). */
  function cornerLabels(map) {
    for (var k in map) if (map.hasOwnProperty(k)) ctlLabels[k] = map[k];
    var f = frame();
    if (!f) return;
    var all = f.querySelectorAll("[data-ctl]");
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
    var b = el("button", "btn btn-icon btn-sm web-home", API ? API.icon("home") : "");
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

  /* ── 6b. the sheet ────────────────────────────────────────────────────── */

  /* ONE FRAME FOR EVERY VIEW THAT IS A ROOM OF THE PLACE — the collection, the
     shop, the ranking and the barracks' four. They were seven screens with
     seven headers: a title at 38 px here and 40 there, a count where a title
     was, a segmented bar under the band on two of them and nothing on the
     rest, and three copies of the function that dresses the hub behind them.
     Chosen in lab/view-frame.html (proposal C, "sheet"), and it is five layers
     and nothing else:

       .wv-bg       the hub's own ground, under ONE veil (--wv-veil)
       .wv-sheet    a sheet risen out of the bottom edge, under the band
         .wv-head     the title, one line, measured — and one line under it
         .wv-body     the owner's content, the one region that scrolls
         .wv-bar      the TABS, and the options / help pair after a filet

     The owner fills the body and names its pages; this file owns the rest.
     A view with one page has no tab bar — a single tab is a label, not a
     choice — and keeps home, help and options on their own at the right of
     the bar.

     THE PAIR IS NOT THE CORNER. #web-ctls is still the round's (section 6);
     what a sheet carries is the same two items, drawn into its own bar,
     because a player on the collection who wants the music off should not
     have to walk back to the village for it. */
  var sheets = [];

  /* THE HUB FIRST, where the game has a village: these are rooms of that
     place, so they stand on the picture the player just walked off. Then the
     scene the menu is dressed with, then a picture the game embeds, then the
     gradient its SKIN paints the page with. `window.__VILLAGE__` is read here
     rather than captured at load: village.js is the last file of the web
     layer, and this runs on a view's first open, long after all of it. */
  function ground(bg) {
    var VG = window.__VILLAGE__;
    var hub = VG && VG.ground ? VG.ground() : null;
    if (hub) { bg.style.backgroundImage = "url(" + hub + ")"; return; }
    var art = W.Art ? W.Art.src(W.Art.sceneKey()) : null;
    if (art) { bg.style.backgroundImage = "url(" + art + ")"; return; }
    var images = (W.ASSETS && W.ASSETS.images) || {};
    var src = images.bg || images.bg1 || null;
    if (src) { bg.style.backgroundImage = "url(" + src + ")"; return; }
    var cs = window.getComputedStyle(document.body);
    if (cs.backgroundImage && cs.backgroundImage !== "none") bg.style.backgroundImage = cs.backgroundImage;
    bg.style.backgroundColor = cs.backgroundColor;
    bg.classList.add("flat");
  }

  /* `spec`:
       id, cls   the view's own id and class, which its stylesheet dresses
       tag       the element, `div` by default
       body      an element of the owner's to be the body, or nothing
       fixed     true for a body that must not scroll (the album is ONE
                 screen: the machine over twenty tiles)
       home      the label of the home button a game with no band gets
  */
  function sheet(spec) {
    spec = spec || {};
    var box = el(spec.tag || "div", "wv-screen" + (spec.cls ? " " + spec.cls : ""));
    if (spec.id) box.id = spec.id;
    var bg = el("div", "wv-bg");
    box.appendChild(bg);

    var pane = el("div", "wv-sheet");
    var head = el("header", "wv-head");
    var title = el("h2", "wv-title", "");
    var sub = el("p", "wv-sub", "");
    head.appendChild(title);
    head.appendChild(sub);
    pane.appendChild(head);

    var body = spec.body || el("div");
    body.classList.add("wv-body");
    if (spec.fixed) body.classList.add("fixed");
    pane.appendChild(body);

    var bar = el("nav", "wv-bar");
    var tabs = el("div", "wv-tabs");
    var ctls = el("div", "wv-ctls");
    /* THE ONE WAY HOME, and on a sheet it is here rather than in the band:
       the house first, then help, then options — the bottom-right corner is
       where a thumb already is, and the band's own house chip stands down
       over every sheet (packages/webshell/meta.js, `bandDoors`), so there is
       still exactly one. It is `web-home` like the button a bandless view
       wears, because it is the same door: View.home, the village where there
       is one and the title screen otherwise. */
    var hb = el("button", "wv-ctl web-home", API ? API.icon("home") : "");
    hb.setAttribute("aria-label", ctlLabels.home || spec.home || "");
    hb.setAttribute("data-ctl", "home");
    hb.addEventListener("click", home);
    ctls.appendChild(hb);
    bar.appendChild(tabs);
    bar.appendChild(ctls);
    pane.appendChild(bar);
    box.appendChild(pane);

    var S = {
      box: box, bg: bg, sheet: pane, head: head, title: title, sub: sub,
      body: body, nav: bar, tabsBox: tabs, ctls: ctls,
      btn: {}, order: [], cur: null, grounded: false,

      /* The title is shouted here, the line under it is written as it is. */
      setHead: function (t, s) {
        title.textContent = W.upper(t || "");
        sub.textContent = s || "";
        sub.hidden = !s;
        fitTitle(S);
      },

      /* `list` is [{ key, label, icon }], in the order they read; `pick`
         answers a tap with the key, and the owner repaints — which is what
         calls `light` below, so the bar never says a page the body is not on. */
      pages: function (list, pick) {
        tabs.innerHTML = "";
        S.btn = {}; S.order = [];
        if (list.length > 1) {
          for (var i = 0; i < list.length; i++) tabs.appendChild(tabButton(S, list[i], pick));
        }
        syncBar(S);
      },

      relabel: function (list) {
        for (var i = 0; i < list.length; i++) {
          var b = S.btn[list[i].key];
          if (b) b.querySelector(".wv-tl").textContent = W.upper(list[i].label);
        }
      },

      /* Lights one page, and slides the body in from the side it is on. Not
         on the first call after an open: a view arriving on another page than
         the one it was left on is an arrival, not a page change. */
      light: function (key) {
        var prev = S.cur;
        S.cur = key;
        for (var k in S.btn) if (S.btn.hasOwnProperty(k)) {
          S.btn[k].classList.toggle("on", k === key);
          S.btn[k].setAttribute("aria-pressed", k === key ? "true" : "false");
        }
        if (prev == null || prev === key) return;
        var dir = S.order.indexOf(key) > S.order.indexOf(prev) ? "l" : "r";
        body.classList.remove("wv-in-l", "wv-in-r");
        void body.offsetWidth;          // restart the animation
        body.classList.add("wv-in-" + dir);
      }
    };
    box.__sheet = S;
    sheets.push(S);
    pull(S);
    fillCtls(S);
    frame().appendChild(box);
    return S;
  }

  function tabButton(S, item, pick) {
    var b = el("button", "wv-tab",
      (API ? API.icon(item.icon, "wv-ti") : "") + '<span class="wv-tl">' + W.upper(item.label) + "</span>");
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () { pick(item.key); });
    S.btn[item.key] = b;
    S.order.push(item.key);
    return b;
  }

  /* The same items the corner was given, and the same handlers: one options
     card and one help card, whichever of the two bars opened it. */
  function fillCtls(S) {
    if (S.itemsIn || !ctlItems.length || !API) { syncBar(S); return; }
    S.itemsIn = true;
    for (var i = 0; i < ctlItems.length; i++) {
      var item = ctlItems[i], name = item.name || item.icon;
      var b = el("button", "wv-ctl", API.icon(item.icon));
      b.setAttribute("aria-label", ctlLabels[name] || item.label || "");
      b.setAttribute("data-ctl", name);
      b.addEventListener("click", item.on);
      S.ctls.appendChild(b);
    }
    syncBar(S);
  }

  function syncBar(S) {
    S.nav.classList.toggle("tabbed", S.order.length > 1);
  }

  /* Whether a view stands in a sheet — what the band asks before it drops its
     house chip, since the sheet's bar carries the house instead. */
  function sheeted(name) {
    var s = defs[name];
    var n = s && s.built !== false && s.node ? s.node() : null;
    return !!(n && n.__sheet);
  }

  var TITLE_SHEET_FLOOR = 30;
  function fitTitle(S) {
    if (!W.Fit || !S.box.classList.contains("on")) return;
    W.Fit.box(S.title, TITLE_SHEET_FLOOR);
  }

  /* What go() does to a sheet before its owner paints: the hub is read once,
     the pair is drawn if the corner came after the build, and the page the
     view is left on stops being the one a slide is measured from. */
  function arrive(S) {
    if (!S.grounded) { S.grounded = true; ground(S.bg); }
    unpull(S);
    fillCtls(S);
    S.cur = null;
    S.body.classList.remove("wv-in-l", "wv-in-r");
    requestAnimationFrame(function () { fitTitle(S); });
  }

  /* ── 6c. the pull ─────────────────────────────────────────────────────── */

  /* THE GRIP IS A PROMISE, AND THIS KEEPS IT. A sheet rises out of the bottom
     edge with a grip on its top rim, which is how a phone says "pull me down
     to put me away" — so a sheet pulled down goes, and the screen under it
     comes back: the same back() as ESCAPE, one view peeled off.

     Where the pull may start: the header always (it scrolls nothing), the
     body only while it is scrolled to its top — a finger going down a list
     that is not at its top is reading the list. An upward or a sideways move
     is never the sheet's (the list scrolls, a carousel turns), and the bar is
     left out: it is a row of buttons, and nothing under a thumb there should
     move. A control that drags on its own opts out with `data-nopull`.

     TOUCH EVENTS AND NOT POINTER EVENTS, on purpose. Inside the body the
     browser owns vertical panning, and the moment it decides a finger is a
     scroll it CANCELS the pointer — a pull that works on the header and dies
     on the list. A touchmove, prevented before the browser decides, keeps the
     gesture. The mouse gets the same gesture on a desktop, so a sheet can be
     dragged away there too. */
  var PULL_SLOP = 10;                   // design px before a move is a gesture
  var PULL_SHUT = 0.22;                 // share of the sheet's height that puts it away
  var PULL_FLICK = 1;                   // design px per ms that puts it away at any depth
  var PULL_BACK = 300, PULL_GONE = 220; // ms: the snap back, the exit

  function now() { return new Date().getTime(); }

  /* The view on top IS this sheet: a pull on anything under it never runs. */
  function onTop(S) {
    var name = stack[stack.length - 1];
    return !!name && defs[name].node() === S.box && !modals.length;
  }

  function pull(S) {
    var pane = S.sheet, g = null, swallow = false;

    function scrolled(n) {
      for (; n && n !== pane; n = n.parentNode) if (n.scrollTop > 0) return true;
      return false;
    }

    function begin(x, y, target) {
      if (g || !target || !target.closest || !onTop(S)) return;
      if (target.closest(".wv-bar, input, select, textarea, [data-nopull]")) return;
      if (!target.closest(".wv-head") && scrolled(target)) return;
      var r = pane.getBoundingClientRect();
      g = {
        x: x, y: y, k: pane.offsetHeight ? r.height / pane.offsetHeight : 1,
        on: false, dy: 0, t: now(), v: 0
      };
    }

    /* True while the move is the sheet's, so the caller prevents it. */
    function track(x, y) {
      if (!g) return false;
      var dx = (x - g.x) / g.k, dy = (y - g.y) / g.k;
      if (!g.on) {
        if (Math.abs(dx) > PULL_SLOP && Math.abs(dx) > Math.abs(dy)) { g = null; return false; }
        if (dy < -PULL_SLOP) { g = null; return false; }
        /* Claimed from the first pixel down, before the browser can make it
           an overscroll; it only MOVES the sheet past the slop. */
        if (dy <= PULL_SLOP) return dy > 0;
        g.on = true;
        S.box.classList.remove("wv-settle");
        S.box.classList.add("wv-held", "wv-pulling");
      }
      var d = Math.max(0, dy), t = now();
      if (t > g.t) g.v = g.v * 0.4 + ((d - g.dy) / (t - g.t)) * 0.6;
      g.dy = d; g.t = t;
      place(d);
      return true;
    }

    function finish() {
      if (!g) return;
      var was = g;
      g = null;
      if (!was.on) return;
      S.box.classList.remove("wv-pulling");
      swallow = true;
      setTimeout(function () { swallow = false; }, 0);
      var h = pane.offsetHeight || 1;
      /* a finger that stopped before letting go is not flicking */
      var v = now() - was.t > 90 ? 0 : was.v;
      var shut = was.dy > h * PULL_SHUT || (v > PULL_FLICK && was.dy > PULL_SLOP * 3);
      S.box.classList.add("wv-settle");
      if (!shut) {
        place(0);
        setTimeout(function () { S.box.classList.remove("wv-settle"); }, PULL_BACK);
        return;
      }
      S.box.classList.add("wv-gone");
      place(h);
      setTimeout(function () {
        if (onTop(S)) back();
        unpull(S);
      }, PULL_GONE);
    }

    /* The sheet follows the finger and the ground under it thins with the
       distance, so the screen the pull goes back to is already showing
       through by the time the finger lets go. */
    function place(d) {
      var h = pane.offsetHeight || 1;
      pane.style.transform = d ? "translate3d(0," + d + "px,0)" : "";
      var a = d ? String(Math.max(0, 1 - d / h)) : "";
      for (var n = S.box.firstChild; n; n = n.nextSibling) {
        if (n !== pane && n.style) n.style.opacity = a;
      }
    }
    S.place = place;

    pane.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { g = null; return; }
      begin(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }, { passive: true });
    pane.addEventListener("touchmove", function (e) {
      if (e.touches.length !== 1) { if (g && g.on) finish(); g = null; return; }
      if (track(e.touches[0].clientX, e.touches[0].clientY) && e.cancelable) e.preventDefault();
    }, { passive: false });
    pane.addEventListener("touchend", finish);
    pane.addEventListener("touchcancel", finish);

    function mmove(e) { if (track(e.clientX, e.clientY)) e.preventDefault(); }
    function mup() {
      window.removeEventListener("mousemove", mmove);
      window.removeEventListener("mouseup", mup);
      finish();
    }
    pane.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      begin(e.clientX, e.clientY, e.target);
      if (!g) return;
      window.addEventListener("mousemove", mmove);
      window.addEventListener("mouseup", mup);
    });

    /* The button a pull started on is not pressed by the pull letting go. */
    S.box.addEventListener("click", function (e) {
      if (!swallow) return;
      swallow = false;
      e.stopPropagation();
      e.preventDefault();
    }, true);
  }

  /* Back to rest, with no motion: what a sheet is before it rises again.
     `wv-held` is what stopped the rise from replaying under the finger, and
     taking it off here is what lets the next open rise. */
  function unpull(S) {
    S.box.classList.remove("wv-held", "wv-pulling", "wv-settle", "wv-gone");
    if (S.place) S.place(0);
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
    sheet: sheet,
    sheeted: sheeted,
    ground: ground,

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
    /* the language of the two default tap lines; menu.js calls it with the
       rest of the shell */
    setLang: function (code) { if (STRINGS[code]) LANG = code; },
    /* For a caller that rewrites a title outside the card's own children. */
    fit: function (h) { if (h && h.box) fitTitles(h.box); }
  };
})();
