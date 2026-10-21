/*
  webshell — the GUIDE: every rule of a game, as a book of pages.

  Loaded after codex.js and before menu.js, whose Help card opens it. It is
  inert unless the game publishes `Game.guide`, so a game with none, and
  every playable, never sees any of it.

  WHY IT EXISTS. The Help card says what the game IS — one sentence, the
  gesture acted out — and must stay that short, because it is read by a
  player who has not started yet. Everything else a game has to say about its
  rules used to be scattered: a card opened on the way into a round, a
  sentence on a notice that lived 2.2 s, a lesson queue told once a session,
  a comment nobody reads. A player who wanted to know what a fragile ring
  does had nowhere to look. The guide is that place, and the only one:

    - the Help card ends on ALL THE RULES, which opens it on its contents;
    - a game whose table explains itself on a tap (games/slipdeck,
      games/bridgessa) opens it ON THE PAGE of what was tapped;
    - a mechanic met for the first time is named by a notice
      (`Notify.learn`, packages/shell/shell.js) whose line in the "!" log
      opens its page (packages/webshell/meta.js).

  IT IS A CARD, NOT A VIEW. It is opened over a round as often as over a
  menu — a tap on the table is mid-round by definition — and a card is what
  stands over a round and pauses it (view.js, section 1b). It is still
  navigated: the contents, then a page, then the next one, all inside one
  card of a fixed height so turning a page never makes the card jump. A tap
  anywhere but on a control closes it, like every card; ← and → turn the
  pages on a keyboard.

  THE CONTRACT IS THE GAME'S, and it is one function on `Game.guide`:
    chapters()   [{ key, label, pages: [page] }], in reading order, and every
                 string already in the player's language (Lang.t)
    page         { id, title, eyebrow, pic, lines: [str], rows, lv, node }
                   id       unique across the whole guide: what `open(id)`
                            and `Notify.learn(id)` name
                   eyebrow  the line over the title; default the chapter
                   pic      THE EXAMPLE, drawn first: function () → a node
                            (a canvas the game paints with the round's own
                            renderer, one of its cards, a cut of its
                            artwork) or an image src. A page SHOWS before it
                            tells — one picture says what three sentences
                            describe, so every page that can have one has one
                   lines    the rule, a paragraph each, as text (never markup:
                            the game's words are data) — short: two or three
                            lines under the picture, not an essay
                   rows     what a thing pays or costs, as a table rather than
                            a sentence: [[label, value, colour?]]
                   lv       the level that first uses it: a page whose level
                            the board has not opened is LOCKED in the contents,
                            titled ??? with the level that opens it — the
                            codex's rule, so a biome is still a discovery.
                            A page opened BY NAME (a tap, a notice) opens
                            whatever its level: the player has just met it
                   node     optional, function () → a DOM node drawn under the
                            lines (a chart, a card, an example): the SAME
                            builder the round uses, as the codex does it

  ES5-ish on purpose, like the rest of the shell.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  if (!W) return;                       // not a web build
  var G = W.Game && W.Game.guide;
  if (!G || !G.chapters) return;        // a game with no guide: nothing published

  var MD = window.__MODAL__;
  if (!MD) return;

  var API = null;
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function text(tag, cls, str) { var n = el(tag, cls); n.textContent = str; return n; }
  function icon(name, cls) { return API ? API.icon(name, cls) : ""; }
  function fill(str, vals) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vals[k] == null ? m : vals[k]; });
  }

  /* ── 1. the words ─────────────────────────────────────────────────────── */

  var STRINGS = {
    en: {
      button: "All the rules", title: "All the rules", contents: "Contents",
      prev: "Previous", next: "Next", locked: "Reach level {n}", lockedSay: "Locked",
      noteTip: "Anytime, tap {book} for more help"
    },
    fr: {
      button: "Toutes les règles", title: "Toutes les règles", contents: "Sommaire",
      prev: "Précédente", next: "Suivante", locked: "Atteins le stage {n}", lockedSay: "Verrouillée",
      noteTip: "À n'importe quel moment, appuie sur {book} pour obtenir plus d'aide"
    }
  };
  W.Desk.table(STRINGS);       // a desk says "click" where a finger says "tap" (engine, Desk)
  var LANG = "en", T = STRINGS.en;
  function setLang(code) {
    LANG = STRINGS[code] ? code : "en";
    T = STRINGS[LANG];
    /* The game's own words are re-read from it, in the new language. */
    if (card) paint();
  }

  /* ── 2. the book ──────────────────────────────────────────────────────── */

  function topLevel() {
    var LV = window.__LEVELS__;
    if (!LV || !LV.active() || !LV.topOpen) return 99;
    return LV.topOpen() || 1;
  }

  /* The book is read off the game every time it is painted: it is in the
     player's language, and a page may say something the round has changed
     (slipdeck's pair floor). Flattened once per paint, so the arrows walk
     the pages in reading order across the chapters. */
  /* THE DEV KEY: every page readable whatever the board, a switch of the DEV
     view kept per game on this machine (section 4). A dev machine only —
     W.Dev is never local on a deployed site. */
  var UNLOCK_KEY = "dev:guide:" + (CONFIG.slug || "game");
  var unlocked = false;                // read at mount, once W.Dev is there

  function book() {
    var ch = G.chapters() || [], flat = [], top = unlocked ? 999 : topLevel();
    for (var i = 0; i < ch.length; i++) {
      var pages = ch[i].pages || [];
      for (var j = 0; j < pages.length; j++) {
        var p = pages[j];
        flat.push({ page: p, chapter: ch[i], locked: !!(p.lv && p.lv > top) });
      }
    }
    return { chapters: ch, flat: flat };
  }
  function indexOf(B, id) {
    for (var i = 0; i < B.flat.length; i++) if (B.flat[i].page.id === id) return i;
    return -1;
  }
  function has(id) { return indexOf(book(), id) >= 0; }

  /* THE PAGE OF WHERE THE PLAYER STANDS. A layer whose rooms are explained
     in the guide registers a function that names the page of the room on top
     (packages/webshell/army.js: the barracks), and the Help card opened over
     that room opens the guide ON that page instead of the Help card (menu.js,
     openHelp): a player asking for help in a room is asking about the room. */
  var hereFns = [];
  function here(fn) { hereFns.push(fn); }
  function current() {
    for (var i = 0; i < hereFns.length; i++) {
      var id = hereFns[i]();
      if (id && has(id)) return id;
    }
    return null;
  }

  /* ── 3. the card ──────────────────────────────────────────────────────── */

  var HEIGHT = 1000;                   // one height, so a page turn never jumps
  var card = null, at = null;          // the open card; the page id on it (null: contents)
  var forced = {};                     // pages opened BY NAME this session: never locked
  var last = null;                     // the page read last this session (the contents land on it)

  function paint() {
    var B = book(), i = at == null ? -1 : indexOf(B, at);
    if (at != null && i < 0) at = null;
    card.body.innerHTML = "";
    card.body.scrollTop = 0;
    if (at == null) paintContents(B); else paintPage(B, i);
  }

  function paintContents(B) {
    card.set({ eyebrow: CONFIG.title || "", title: T.title });
    var box = el("div", "gu-toc");
    /* THE AURA, NAMED. A game whose rules are read on the table — a tap on
       anything its idle hint lights opens that thing's page (games/bridgessa,
       games/slipdeck) — says so here, once, at the top of the book rather
       than on the Help card, which stays the game in one look:
       `web.copy.<lang>.helpAura`, one sentence, beside one of the game's own
       objects wearing the aura (`Game.helpAura()`, a node; a plain pill
       without it). The round breathes its aura once every few idle seconds;
       this one loops, faster, because here it is the thing being shown. */
    var auraText = API && API.text ? API.text("helpAura") : null;
    if (auraText) {
      var aura = el("div", "gu-aura");
      var ex = W.Game.helpAura ? W.Game.helpAura() : null;
      if (!ex) ex = el("span", "gu-aura-pill", "?");
      ex.classList.add("gu-aura-ex");
      aura.appendChild(ex);
      aura.appendChild(el("p", "", auraText));
      box.appendChild(aura);
    }
    for (var c = 0; c < B.chapters.length; c++) {
      var C = B.chapters[c], pages = C.pages || [];
      if (!pages.length) continue;
      box.appendChild(text("div", "gu-ch", W.upper(C.label)));
      var list = el("div", "gu-list");
      for (var j = 0; j < pages.length; j++) list.appendChild(row(B, indexOf(B, pages[j].id)));
      box.appendChild(list);
    }
    card.body.appendChild(box);
    /* BACK TO THE CONTENTS IS BACK TO WHERE YOU WERE. A player who read the
       defense and asks for the contents wants the page next to it, not the
       top of a list of fifty: the contents land with the page read last in
       the middle of the body, its row dashed so it is found at a glance. */
    var mark = box.querySelector(".gu-row.last");
    if (mark) requestAnimationFrame(function () { centre(card.body, mark); });
  }

  /* `node` in the middle of the scrolling `body`, measured on screen and
     divided back into the card's px: the card is scaled into the frame, and
     still scaling in while it opens. */
  function centre(body, node) {
    var br = body.getBoundingClientRect(), nr = node.getBoundingClientRect();
    var k = body.offsetHeight ? br.height / body.offsetHeight : 1;
    body.scrollTop = Math.max(0, Math.round((nr.top - br.top) / k + body.scrollTop -
                                            (body.clientHeight - node.offsetHeight) / 2));
  }

  function row(B, i) {
    var f = B.flat[i], locked = f.locked && !forced[f.page.id];
    var b = el("button", "gu-row" + (locked ? " locked" : "") + (!locked && f.page.id === last ? " last" : ""));
    if (locked) {
      b.innerHTML = icon("lock", "gu-ic");
      b.appendChild(text("span", "gu-rt", "???"));
      b.appendChild(text("span", "gu-rl", W.upper(fill(T.locked, { n: f.page.lv }))));
      b.addEventListener("click", function () {
        W.Notify.say(T.lockedSay, { sub: fill(T.locked, { n: f.page.lv }), kind: "info", icon: "lock" });
      });
    } else {
      b.appendChild(text("span", "gu-rt", W.upper(f.page.title)));
      b.appendChild(el("span", "gu-chev", "›"));
      b.addEventListener("click", function () { go(f.page.id); });
    }
    return b;
  }

  function paintPage(B, i) {
    var f = B.flat[i], P = f.page;
    last = P.id;
    card.set({ eyebrow: P.eyebrow || f.chapter.label, title: P.title });
    var box = el("div", "gu-page");
    var pic = typeof P.pic === "function" ? P.pic() : P.pic;
    if (typeof pic === "string") { var im = el("img"); im.src = pic; im.alt = ""; pic = im; }
    if (pic) { var fig = el("div", "gu-pic"); fig.appendChild(pic); box.appendChild(fig); }
    /* the figures before the words: a table is an example too */
    if (P.rows && P.rows.length) {
      var tb = el("div", "gu-rows");
      for (var q = 0; q < P.rows.length; q++) {
        var R = P.rows[q], tr = el("div", "gu-tr");
        tr.appendChild(text("span", "gu-tl", R[0]));
        var v = text("b", "gu-tv", String(R[1]));
        if (R[2]) v.style.color = R[2];
        tr.appendChild(v);
        tb.appendChild(tr);
      }
      box.appendChild(tb);
    }
    var lines = P.lines || [];
    for (var k = 0; k < lines.length; k++) box.appendChild(text("p", "", lines[k]));
    if (P.node) {
      var n = P.node();
      if (n) { n.classList.add("gu-node"); box.appendChild(n); }
    }
    card.body.appendChild(box);

    /* THE WAY THROUGH. Previous and next walk the pages a player may read —
       a locked one is stepped over — and the middle one goes back to the
       contents. A control, so a tap on it is never the tap that closes. */
    var nav = el("div", "gu-nav");
    nav.setAttribute("data-foot", "");      // pinned to the body's foot: the "more" cue stands above it
    var prev = step(B, i, -1), next = step(B, i, 1);
    nav.appendChild(navBtn("‹", T.prev, prev));
    var toc = el("button", "btn btn-sm btn-plate gu-toc-btn", icon("list", "ico"));
    toc.appendChild(text("span", "", W.upper(T.contents)));
    toc.addEventListener("click", function () { go(null); });
    nav.appendChild(toc);
    nav.appendChild(navBtn("›", T.next, next));
    card.body.appendChild(nav);
  }

  function step(B, i, d) {
    for (var j = i + d; j >= 0 && j < B.flat.length; j += d) {
      if (!B.flat[j].locked || forced[B.flat[j].page.id]) return B.flat[j].page.id;
    }
    return null;
  }

  function navBtn(glyph, label, id) {
    var b = el("button", "btn btn-sm btn-icon gu-arrow", glyph);
    b.setAttribute("aria-label", label);
    if (id == null) { b.disabled = true; return b; }
    b.addEventListener("click", function () { go(id); });
    return b;
  }

  function go(id) {
    at = id;
    paint();
    W.Sound.ui("tap", 0.35);
  }

  /* OPEN — on the contents, or on one page by its id. A page named is a page
     the player has met, so it opens whatever its level (`forced`). A guide
     already open turns to it instead of stacking a second card. */
  function open(id) {
    if (id != null) {
      if (!has(id)) id = null;
      else forced[id] = true;
    }
    at = id == null ? null : id;
    if (card) { paint(); return card; }
    card = MD.open({
      kind: "gu-book",
      height: HEIGHT,
      title: T.title,
      fill: function (body, close, handle) { card = handle; paint(); },
      onClose: function () { card = null; at = null; }
    });
    return card;
  }

  /* ← and → turn the pages on a keyboard, while the guide is the card on top. */
  document.addEventListener("keydown", function (e) {
    if (!card || at == null || MD.top() !== "gu-book") return;
    var B = book(), i = indexOf(B, at), to = null;
    if (e.key === "ArrowLeft") to = step(B, i, -1);
    else if (e.key === "ArrowRight") to = step(B, i, 1);
    else return;
    e.preventDefault();
    if (to != null) go(to);
  });

  /* ── 4. mount ─────────────────────────────────────────────────────────── */

  function mount(api) {
    API = api;
    if (api.lang) setLang(api.lang);
    if (W.Dev) {
      unlocked = !!(W.Dev.local && W.Store.get(UNLOCK_KEY, false));
      W.Dev.entry({ group: "Guide", label: "All the rules", sub: "The game's guide, on its contents", run: function () { open(); } });
      W.Dev.entry({ group: "Guide",
        label: function () { return unlocked ? "Lock the pages again" : "Unlock every page"; },
        sub: "Pages a level has not opened yet, readable now; kept on this machine",
        run: function () {
          unlocked = !unlocked;
          if (unlocked) W.Store.set(UNLOCK_KEY, true); else W.Store.del(UNLOCK_KEY);
          if (card) paint();
          W.Notify.say(unlocked ? "Guide unlocked" : "Guide locked",
                       { kind: "info", icon: unlocked ? "unlock" : "lock", key: "dev" });
        } });
    }
  }

  window.__GUIDE__ = {
    active: function () { return true; },
    mount: mount,
    setLang: setLang,
    /* the Help card's button (packages/webshell/menu.js, fillHelp) */
    label: function () { return T.button; },
    /* the Help card's line on the notices that open a page, and its way
       into the guide (menu.js, fillHelp); `{book}` is where it draws the
       book they wear */
    tip: function () { return T.noteTip; },
    open: open,
    has: has,
    here: here,
    current: current
  };
})();
