/*
  webshell — the CODEX: a game's cards, as a collection.

  Loaded after army.js and before menu.js and village.js (which list its door
  and its word). It is inert unless the game publishes `Game.codex` — today
  games/pawko, whose fifty cards are the whole game — so every other game, and
  every playable, never sees any of it.

  WHY IT EXISTS. A deck the player meets four cards at a time, one level after
  the other, is a deck they never see whole: the hand shows five, the round
  shows what was dealt. The codex is where all of them are read, and where the
  ones still to come stand as shadows — the shape of what is missing is the
  reason to climb the map, as an unowned sticker is the reason to pull.

  IT IS THE BARRACKS' COLLECTION (packages/webshell/army.js, the codex of
  lab/stratideck-collection.html), for a game with no barracks: the books
  behind one switch, each quarter of it also its progress; one card at a
  time, at full size, turned like a carousel — a swipe, the two arrows, ←
  and → — with what it is written under it; the three filters (all, had,
  missing) riding the seam between the two. A tap on the card in the middle
  opens it in a card of its own, at the size of a card the player is looking
  AT; a shadow says how it is earned instead.

  THE CONTRACT IS THE GAME'S, and it is four functions on `Game.codex`:
    books()        [{ key, label, color }], in the order they read
    items(book)    [{ id, lv, had }] — `lv` is the level that unlocks the card;
                   `had`, when the game gives it, overrides that rule
    node(id, opt)  the card itself, as DOM — the SAME builder the round
                   draws its big card with; opt { w, ghost }
    info(id)       { name, color, text, lock, chips: [{ text, color }] },
                   already in the player's language; `text` is optional — a
                   card that prints what it does on its face leaves it out —
                   and `lock` is what a shadow says instead of "reach level n"
  A card is HAD once the board has opened its level (`__LEVELS__.topOpen()`);
  a game with no map has every card. A game whose cards are earned some
  other way says so with `had` (games/gearball: a card is had once it has
  been taken in a round) and words the shadow with `lock`.

  ES5-ish on purpose, like the rest of the shell.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  if (!W) return;                       // not a web build
  var G = W.Game && W.Game.codex;
  if (!G) return;                       // a game with no codex: nothing published

  var VW = window.__VIEW__, MD = window.__MODAL__;
  if (!VW || !MD) return;

  var API = null;
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function text(tag, cls, str) { var n = el(tag, cls); n.textContent = str; return n; }
  function icon(name, cls) { return API ? API.icon(name, cls) : ""; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function fill(str, vals) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vals[k] == null ? m : vals[k]; });
  }

  /* ── 1. the words ─────────────────────────────────────────────────────── */

  var STRINGS = {
    en: {
      cards: "Cards", title: "Cards", f_all: "All", f_had: "Unlocked", f_miss: "Locked",
      none: "No card here", prev: "Previous", next: "Next",
      lock: "Reach level {n} to unlock it", from: "Level {n}",
      ghostSay: "Locked"
    },
    fr: {
      cards: "Cartes", title: "Cartes", f_all: "Toutes", f_had: "Débloquées", f_miss: "Verrouillées",
      none: "Aucune carte ici", prev: "Précédente", next: "Suivante",
      lock: "Atteins le niveau {n} pour la débloquer", from: "Niveau {n}",
      ghostSay: "Verrouillée"
    }
  };
  var LANG = "en", T = STRINGS.en;
  function setLang(code) {
    LANG = STRINGS[code] ? code : "en";
    T = STRINGS[LANG];
    if (S && VW.isOpen("codex")) paint();
  }

  /* ── 2. what the player has ───────────────────────────────────────────── */

  function topLevel() {
    var LV = window.__LEVELS__;
    if (!LV || !LV.active() || !LV.topOpen) return 99;
    return LV.topOpen() || 1;
  }
  function book(key) {
    var list = G.items(key), top = topLevel(), out = [];
    for (var i = 0; i < list.length; i++) {
      out.push({ id: list[i].id, lv: list[i].lv, had: list[i].had != null ? !!list[i].had : list[i].lv <= top });
    }
    return out;
  }
  function hadCount(list) {
    var n = 0;
    for (var i = 0; i < list.length; i++) if (list[i].had) n++;
    return n;
  }
  /* What the village's word and a badge may read: every card had, of all. */
  function totals() {
    var books = G.books(), had = 0, all = 0;
    for (var i = 0; i < books.length; i++) { var b = book(books[i].key); had += hadCount(b); all += b.length; }
    return { had: had, all: all };
  }

  /* ── 3. the view ──────────────────────────────────────────────────────── */

  var CX_W = 300;                       // the card in the middle, at full size
  var CX_STEP = 230;                    // the carousel's pitch, in design px
  var FILTERS = [["all", "deck"], ["had", "check"], ["miss", "lock"]];
  var S = null, X = { book: null, f: "all", ix: null }, car = null;

  function build() {
    S = VW.sheet({ id: "cx-codex", cls: "cx-screen" });
    S.body.classList.add("cx-body");
    S.pages([], function () {});
  }

  function paint() {
    var books = G.books(), i, b, list, n;
    if (!X.book) X.book = books[0].key;
    var tot = totals();
    S.setHead(T.title, tot.had + " / " + tot.all);
    var box = S.body;
    box.innerHTML = "";
    car = null;

    var sw = el("div", "cx-books");
    for (i = 0; i < books.length; i++) {
      b = books[i];
      list = book(b.key);
      n = hadCount(list);
      var btn = el("button", "cx-book" + (X.book === b.key ? " on" : ""));
      btn.style.setProperty("--c", b.color || "var(--accent)");
      btn.appendChild(text("span", "", W.upper(b.label)));
      btn.appendChild(el("b", "", n + "<i> / " + list.length + "</i>"));
      btn.appendChild(el("em", "", "<u style='width:" + (list.length ? n / list.length * 100 : 0).toFixed(1) + "%'></u>"));
      btn.addEventListener("click", bookTap(b.key));
      sw.appendChild(btn);
    }
    box.appendChild(sw);

    list = book(X.book);
    n = hadCount(list);
    var counts = { all: list.length, had: n, miss: list.length - n };
    var filters = el("div", "cx-filters");
    for (i = 0; i < FILTERS.length; i++) filters.appendChild(filterBtn(FILTERS[i][0], FILTERS[i][1], counts[FILTERS[i][0]]));

    var shown = [];
    for (i = 0; i < list.length; i++) {
      if (X.f === "all" || (X.f === "had") === list[i].had) shown.push(list[i]);
    }
    if (X.ix == null) X.ix = 0;
    X.ix = clamp(X.ix, 0, Math.max(0, shown.length - 1));

    var stage = el("div", "cx-stage");
    var info = el("div", "cx-info");
    box.appendChild(stage);
    box.appendChild(filters);
    box.appendChild(info);
    if (!shown.length) {
      stage.appendChild(text("div", "cx-none", W.upper(T.none)));
      return;
    }
    car = carousel(stage, shown, X.ix, function (i) {
      if (i === X.ix) return;
      X.ix = i;
      car.go(i);
      paintInfo(info, shown[i]);
      W.Sound.ui("tap", 0.3, 1 + (i % 2) * 0.06);
    }, openCard);
    var l = el("button", "cx-arrow l", "‹"), r = el("button", "cx-arrow r", "›");
    l.setAttribute("aria-label", T.prev);
    r.setAttribute("aria-label", T.next);
    l.addEventListener("click", function () { car.step(-1); });
    r.addEventListener("click", function () { car.step(1); });
    stage.appendChild(l);
    stage.appendChild(r);
    paintInfo(info, shown[X.ix]);

    function bookTap(k) {
      return function () {
        if (X.book === k) return;
        X.book = k; X.f = "all"; X.ix = null;
        paint();
        W.Sound.ui("tap", 0.45);
      };
    }
    function filterBtn(key, ico, count) {
      var c = el("button", "cx-f" + (X.f === key ? " on" : ""), icon(ico, "cx-ci") + "<i>" + count + "</i>");
      c.setAttribute("aria-label", T["f_" + key] + " · " + count);
      c.title = T["f_" + key];
      c.addEventListener("click", function () {
        if (X.f === key) return;
        X.f = key; X.ix = null;
        paint();
        W.Sound.ui("tap", 0.35);
      });
      return c;
    }
  }

  /* WHAT THE CARD IN THE MIDDLE IS, under it. Every line is text written
     into a node rather than markup: the game's words are data. A shadow
     says how it is earned and nothing it does. */
  function paintInfo(box, o) {
    box.innerHTML = "";
    if (!o) return;
    var I = G.info(o.id);
    var name = text("div", "cx-name", o.had ? W.upper(I.name) : "???");
    if (o.had && I.color) name.style.color = I.color;
    box.appendChild(name);
    var meta = el("div", "cx-meta");
    for (var i = 0; i < (I.chips || []).length; i++) {
      if (!o.had && i > 0) break;                 // a shadow keeps its kind and nothing else
      var c = text("span", "", I.chips[i].text);
      if (I.chips[i].color) c.style.color = I.chips[i].color;
      meta.appendChild(c);
    }
    meta.appendChild(text("span", "", fill(T.from, { n: o.lv })));
    box.appendChild(meta);
    if (o.had) { if (I.text) box.appendChild(text("p", "cx-lore", I.text)); }
    else {
      var l = el("p", "cx-lock", icon("lock", "cx-ci"));
      l.appendChild(text("span", "", I.lock || fill(T.lock, { n: o.lv })));
      box.appendChild(l);
    }
  }

  /* The card in the middle, tapped: the card on its own, at the size of a
     card the player is looking at, with what it does under it. */
  function openCard(o) {
    if (!o.had) {
      W.Notify.say(T.ghostSay, { sub: G.info(o.id).lock || fill(T.lock, { n: o.lv }), kind: "info", icon: "lock" });
      return;
    }
    var I = G.info(o.id);
    MD.open({
      kind: "cx-open",
      fill: function (body) {
        var n = G.node(o.id, { w: 420 });
        n.classList.add("cx-big");
        body.appendChild(n);
        if (I.text) body.appendChild(text("p", "cx-lore cx-big-lore", I.text));
      }
    });
  }

  /* THE CAROUSEL — the barracks' (army.js, carousel), the same motion: the
     cards stand in one row and the middle one is read, the others step
     back, shrink and lean away. A finger turns it and a release snaps it;
     the pointer is captured only once it has moved, so a tap on a card is
     still a tap on that card. */
  function carousel(stage, list, ix, onPick, onOpen) {
    var nodes = [], cur = ix, x0 = null, base = 0, moved = false, k = 1, i;
    for (i = 0; i < list.length; i++) {
      var n = el("button", "cx-card nt");
      n.appendChild(G.node(list[i].id, { w: CX_W, ghost: !list[i].had }));
      n.setAttribute("aria-label", list[i].had ? G.info(list[i].id).name : "???");
      n.addEventListener("click", tapAt(i));
      stage.appendChild(n);
      nodes.push(n);
    }
    function tapAt(i) {
      return function () {
        if (moved) return;
        if (i !== cur) onPick(i);
        else onOpen(list[i]);
      };
    }
    function spread(a) { return a <= 1 ? CX_STEP * a : a <= 2 ? CX_STEP + 125 * (a - 1) : CX_STEP + 125 + 80 * (a - 2); }
    function place(pos) {
      for (var j = 0; j < nodes.length; j++) {
        var d = j - pos, a = Math.abs(d), s = d < 0 ? -1 : d > 0 ? 1 : 0;
        var sc = a <= 1 ? 1 - 0.3 * a : Math.max(0.3, 0.7 - 0.18 * (a - 1));
        var st = nodes[j].style;
        st.transform = "translateX(" + (s * spread(a)).toFixed(1) + "px) translateY(" + (a * 26).toFixed(1) + "px) scale(" +
          sc.toFixed(3) + ") rotate(" + (s * Math.min(a, 2) * 4).toFixed(2) + "deg)";
        st.opacity = a > 3.2 ? 0 : a < 0.5 ? 1 : Math.max(0, 1 - 0.28 * a);
        st.zIndex = 100 - Math.round(a * 10);
        st.pointerEvents = a > 2.5 ? "none" : "";
        st.visibility = a > 3.4 ? "hidden" : "";
      }
    }
    place(cur);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        for (var j = 0; j < nodes.length; j++) nodes[j].classList.remove("nt");
      });
    });
    stage.addEventListener("pointerdown", function (e) {
      if (e.target.closest && e.target.closest(".cx-arrow")) return;
      x0 = e.clientX; base = cur; moved = false;
      /* the frame is scaled to the screen: client px back into design px */
      k = stage.offsetWidth ? stage.getBoundingClientRect().width / stage.offsetWidth : 1;
    });
    stage.addEventListener("pointermove", function (e) {
      if (x0 == null) return;
      var dx = (e.clientX - x0) / k;
      if (!moved && Math.abs(dx) > 8) {
        moved = true;
        stage.classList.add("drag");
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* a pointer already gone */ }
      }
      if (moved) place(clamp(base - dx / CX_STEP, -0.4, list.length - 0.6));
    });
    function release(e) {
      if (x0 == null) return;
      var dx = (e.clientX - x0) / k;
      x0 = null;
      stage.classList.remove("drag");
      if (!moved) return;
      var to = clamp(Math.round(base - dx / CX_STEP), 0, list.length - 1);
      if (to === cur) place(cur);
      else onPick(to);
      setTimeout(function () { moved = false; }, 0);
    }
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);
    return {
      go: function (i) { cur = i; place(i); },
      step: function (d) { onPick(clamp(cur + d, 0, list.length - 1)); }
    };
  }

  /* ← and → turn the codex on a keyboard, while it is the screen on top and
     no card stands over it. */
  document.addEventListener("keydown", function (e) {
    if (!car || VW.top() !== "codex" || MD.any()) return;
    if (e.key === "ArrowLeft") { car.step(-1); e.preventDefault(); }
    else if (e.key === "ArrowRight") { car.step(1); e.preventDefault(); }
  });

  /* ── 4. mount ─────────────────────────────────────────────────────────── */

  function mount(api) {
    API = api;
    if (api.lang) setLang(api.lang);
    VW.define("codex", {
      build: build,
      node: function () { return S.box; },
      show: function () { X.ix = null; S.body.scrollTop = 0; paint(); },
      hud: true,
      decor: { count: 2, spots: ["l", "r"], size: 130, opacity: 0.3, front: 0 }
    });
    if (W.Dev) W.Dev.entry({ group: "Codex", label: "Cards", sub: "The collection of every card", run: function () { VW.go("codex"); } });
  }

  window.__CODEX__ = {
    active: function () { return true; },
    mount: mount,
    setLang: setLang,
    /* the house's word, the role's (packages/webshell/village.js, label) */
    label: function () { return T.cards; },
    open: function () { VW.go("codex"); },
    totals: totals
  };
})();
