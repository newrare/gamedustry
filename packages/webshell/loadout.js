/*
  webshell — the LOADOUT: what the player takes into a round, picked on a
  card before it starts.

  Loaded after codex.js and before guide.js. It is inert unless the game
  publishes `Game.loadout` — today games/holepocalypse, whose two super
  buttons are chosen among the twenty — so every other game, and every
  playable, never sees any of it.

  WHY IT EXISTS. A level that fixes what the player fires teaches the
  arsenal and then keeps them from using it: the twenty supers were dealt
  two by two by the level table, and a player who loved the Meteor met it on
  level 25 and lost it on level 26. The card puts the choice in their hands,
  and the locks on it are the climb's promise: every item still to come is
  on the grid from the first level, behind a padlock and the level that
  opens it, as an unowned sticker is the reason to pull.

  WHEN IT OPENS. On every level started from the map, the village's PLAY,
  the end screen's NEXT or the ranking's table — `play(n)` in levels.js asks
  it before arming the round. Never on a REPLAY (the end screen's, the leave
  card's): the same level again is the same hand again, one tap away. Never
  on the very first launch, which drops the player straight into level 1
  under the Help card (menu.js, 4c). Never on a load a tool drives
  (`?first=0` or `?force=1`): a bench that starts a level must get a round,
  not a question.

  WHAT IT OFFERS. Every slot is ALWAYS filled, so PLAY is always live: the
  card opens on the player's LAST pick (remembered per game), with whatever
  THIS level brings in first — a level that introduces an item hands it
  over, tagged NEW, so it is met where the level table meant it to be met —
  then the level's own suggestion fills what is left.

  HOW A SLOT CHANGES — two taps, and neither is a drag. The first round of
  this card took and dropped tiles and left a dashed slot behind, and it read
  as tiles to be dragged into slots. So nothing is ever taken out: a tap on
  a free tile HOLDS it (lifted, in the accent), the slots on top start to
  sway, wear the swap glyph and their caption says to tap the one it
  replaces; that tap swaps them. Another free tile holds that one instead,
  the same tile again lets go. A level with one slot swaps on the first tap,
  since there is nothing to choose. ESCAPE puts the card away and starts
  nothing.

  THE CONTRACT IS THE GAME'S, and it is six functions on `Game.loadout`:
    title()        the card's title, already in the player's language
    slots(n)       how many items level n takes (n is the endless star's
                   number, the climb's length + 1, for the endless run)
    items()        [{ id, lv }], in the order the grid reads; `lv` is the
                   level that unlocks the item
    info(id)       { name, text, src } — already in the player's language;
                   `src` is a picture (CONFIG.art)
    suggest(n)     the ids level n was designed around
    set(ids)       arms them for the next round; null hands the round back
                   to the level's own
  An item is UNLOCKED once the board has opened its level
  (`__LEVELS__.topOpen()`, the codex's rule), or the level being started is
  past it (the dev force).

  ES5-ish on purpose, like the rest of the shell.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  if (!W) return;                       // not a web build
  var G = W.Game && W.Game.loadout;
  var MD = window.__MODAL__;
  if (!G || !MD) { window.__LOADOUT__ = { active: function () { return false; } }; return; }

  var API = null;
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function text(tag, cls, str) { var n = el(tag, cls); n.textContent = str; return n; }
  function icon(name, cls) { return API ? API.icon(name, cls) : ""; }
  var SWAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/>' +
    '<path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>';
  function fill(str, vals) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vals[k] == null ? m : vals[k]; });
  }

  /* ── 1. the words ─────────────────────────────────────────────────────── */

  var STRINGS = {
    en: {
      level: "Level {n}", endless: "Endless run", tap: "Tap an icon to swap it in",
      play: "Play", fresh: "New", taken: "Equipped", swap: "Tap the one it replaces",
      lock: "Reach level {n} to unlock it", from: "Lv {n}"
    },
    fr: {
      level: "Stage {n}", endless: "Partie sans fin", tap: "Touche une icône pour l'échanger",
      play: "Jouer", fresh: "Nouveau", taken: "Équipés", swap: "Touche celui qu'il remplace",
      lock: "Atteins le stage {n} pour le débloquer", from: "St {n}"
    }
  };
  W.Desk.table(STRINGS);       // a desk says "click" where a finger says "tap" (engine, Desk)
  var T = STRINGS.en;
  function setLang(code) { T = STRINGS[code] || STRINGS.en; }

  /* ── 2. what the player has ───────────────────────────────────────────── */

  var KEY = "loadout:" + (CONFIG.slug || "game");

  function LV() { var l = window.__LEVELS__; return l && l.active() ? l : null; }
  /* How far up the climb an item may sit and still be had. The level being
     started counts too, which only matters under the dev force. */
  function reach(n) {
    var l = LV();
    if (!l) return 999;
    return Math.max(l.topOpen ? l.topOpen() || 1 : 1, n);
  }
  function lastPick() {
    var v = W.Store.get(KEY, null);
    return v && v.length ? v : [];
  }

  /* A load a tool drives — the views test, the events bench, the stage probe,
     the recorder — never stops on a question. */
  var TOOL = (function () {
    try { return /[?&#](first=0|force=1)\b/.test(location.search + location.hash); }
    catch (e) { return false; }
  })();

  /* ── 3. the card ──────────────────────────────────────────────────────── */

  /* `ask(n, go, opt)` — levels.js, before it arms level `n`. Answers false
     when the round should start straight away (it then hands the round back
     to the level's own pick), true when the card is up and `go` will run on
     PLAY. `opt.first` is the very first launch. */
  function ask(n, go, opt) {
    if (TOOL || (opt && opt.first)) { G.set(null); return false; }

    var items = G.items(), top = reach(n), had = {}, owned = [], i;
    for (i = 0; i < items.length; i++) {
      had[items[i].id] = items[i].lv <= top;
      if (had[items[i].id]) owned.push(items[i].id);
    }
    var want = Math.min(G.slots(n) | 0, owned.length);
    if (want < 1) { G.set(null); return false; }

    // the start: what this level brings in, then the last pick, then the level's own
    var sel = [], seed = [];
    for (i = 0; i < items.length; i++) if (items[i].lv === n) seed.push(items[i].id);
    seed = seed.concat(lastPick(), G.suggest(n) || [], owned);
    for (i = 0; i < seed.length && sel.length < want; i++) {
      if (had[seed[i]] && sel.indexOf(seed[i]) < 0) sel.push(seed[i]);
    }
    var focus = sel[0], held = null, landed = -1;
    var endless = LV() && n > LV().count();

    var cap, plates, detail, grid, tiles = {};

    // a free tile: held for the swap, or swapped straight in where there is one slot
    function tapTile(id) {
      focus = id;
      if (!had[id] || sel.indexOf(id) >= 0) { held = null; return; }
      if (want === 1) { sel[0] = id; landed = 0; held = null; return; }
      held = held === id ? null : id;
    }
    function tapPlate(i) {
      if (held) { sel[i] = held; focus = held; held = null; landed = i; return; }
      focus = sel[i];
    }
    function paintPlates() {
      cap.textContent = W.upper(held ? T.swap : T.taken);
      cap.classList.toggle("swap", !!held);
      plates.innerHTML = "";
      plates.classList.toggle("swap", !!held);
      for (var s = 0; s < want; s++) {
        var id = sel[s], inf = G.info(id);
        var p = el("button", "lo-plate" + (id === focus && !held ? " on" : "") + (s === landed ? " in" : ""));
        p.type = "button";
        var img = el("img", "lo-pic");
        img.src = inf.src || ""; img.alt = "";
        p.appendChild(img);
        p.appendChild(text("span", "lo-pname", inf.name));
        p.appendChild(el("span", "lo-swap", SWAP));
        p.setAttribute("aria-label", inf.name);
        p.addEventListener("click", (function (i) { return function () { tapPlate(i); paint(); }; })(s));
        plates.appendChild(p);
      }
      landed = -1;
    }
    function paintDetail() {
      detail.innerHTML = "";
      var item = null;
      for (var j = 0; j < items.length; j++) if (items[j].id === focus) item = items[j];
      if (!item) return;
      if (had[focus]) {
        var inf = G.info(focus);
        detail.appendChild(text("b", "lo-dname", inf.name));
        if (inf.text) detail.appendChild(text("p", "lo-dtext", inf.text));
      } else {
        detail.appendChild(text("b", "lo-dname", "???"));
        var l = el("p", "lo-dtext lo-dlock", icon("lock", "lo-ci"));
        l.appendChild(document.createTextNode(fill(T.lock, { n: item.lv })));
        detail.appendChild(l);
      }
    }
    function paintGrid() {
      for (var id in tiles) {
        if (!tiles.hasOwnProperty(id)) continue;
        tiles[id].classList.toggle("sel", sel.indexOf(id) >= 0);
        tiles[id].classList.toggle("held", id === held);
        tiles[id].classList.toggle("on", id === focus && id !== held);
      }
    }
    function paint() { paintPlates(); paintDetail(); paintGrid(); }

    var handle = MD.open({
      kind: "loadout",
      eyebrow: endless ? T.endless : fill(T.level, { n: n }),
      title: G.title(),
      tap: T.tap,
      dismiss: false,
      esc: true,
      fill: function (body) {
        cap = el("div", "lo-cap");
        plates = el("div", "lo-plates");
        detail = el("div", "lo-detail");
        grid = el("div", "lo-grid");
        for (var k = 0; k < items.length; k++) {
          var it = items[k], on = had[it.id];
          var t = el("button", "lo-tile" + (on ? "" : " lock"));
          t.type = "button";
          var img = el("img", "lo-pic");
          img.src = G.info(it.id).src || ""; img.alt = "";
          t.appendChild(img);
          t.appendChild(el("i", "lo-ok", icon("check", "lo-ci")));
          if (!on) {
            t.appendChild(el("span", "lo-lock", icon("lock", "lo-ci")));
            t.appendChild(text("em", "lo-lv", fill(T.from, { n: it.lv })));
            t.setAttribute("aria-label", "??? — " + fill(T.lock, { n: it.lv }));
          } else {
            if (it.lv === n) t.appendChild(text("em", "lo-new", T.fresh));
            t.setAttribute("aria-label", G.info(it.id).name);
          }
          t.addEventListener("click", (function (id) {
            return function () { tapTile(id); paint(); };
          })(it.id));
          tiles[it.id] = t;
          grid.appendChild(t);
        }
        var playBtn = el("button", "btn btn-lg btn-wide btn-shiny lo-play");
        playBtn.type = "button";
        playBtn.textContent = T.play;
        playBtn.addEventListener("click", function () {
          W.Store.set(KEY, sel.slice());
          G.set(sel.slice());
          handle.close();
          go();
        });
        body.appendChild(cap);
        body.appendChild(plates);
        body.appendChild(detail);
        body.appendChild(grid);
        body.appendChild(playBtn);
      }
    });
    paint();
    return true;
  }

  /* ── 4. mount ─────────────────────────────────────────────────────────── */

  function mount(api) {
    API = api;
    if (api.lang) setLang(api.lang);
    if (W.Dev) W.Dev.entry({ group: "Loadout", label: "Pick", sub: "The loadout card of the level the map has selected", run: function () {
      var l = LV(), n = l && typeof l.picked() === "number" ? l.picked() : 1;
      ask(n < 1 ? 1 : n, function () {}, null);
    } });
  }

  window.__LOADOUT__ = {
    active: function () { return true; },
    mount: mount,
    setLang: setLang,
    ask: ask
  };
})();
