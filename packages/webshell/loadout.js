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

  WHAT IT OFFERS. The card opens with every slot already filled, so PLAY
  straight away plays a sensible hand: the player's LAST pick (remembered per game), with whatever
  THIS level brings in first — a level that introduces an item hands it
  over, tagged NEW, so it is met where the level table meant it to be met —
  then the level's own suggestion fills what is left.

  HOW A PICK CHANGES — one tap, on the grid, and nothing else. Two earlier
  rounds put the slots on top and asked for a tile to be dropped or swapped
  into one, and both read as a puzzle about the card rather than a choice
  of powers. So the card is the grid alone: a tap on a free tile EQUIPS it,
  and when every slot is already taken the one equipped FIRST goes (a
  queue, oldest out); a tap on an equipped tile takes it off. A bar of
  one segment a slot counts the slots taken. PLAY is live with any number equipped: a slot left
  empty is filled with the level's own suggestion. ESCAPE puts the card away
  and starts nothing.

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
  function fill(str, vals) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vals[k] == null ? m : vals[k]; });
  }

  /* ── 1. the words ─────────────────────────────────────────────────────── */

  var STRINGS = {
    en: {
      level: "Level {n}", endless: "Endless run", tap: "Tap an icon to equip it",
      play: "Play", fresh: "New", taken: "Equipped {n} / {max}",
      lock: "Reach level {n} to unlock it", from: "Lv {n}"
    },
    fr: {
      level: "Stage {n}", endless: "Partie sans fin", tap: "Touche une icône pour l'équiper",
      play: "Jouer", fresh: "Nouveau", taken: "Équipés {n} / {max}",
      lock: "Atteins le stage {n} pour le débloquer", from: "St {n}"
    }
  };
  W.Desk.table(STRINGS);       // a desk says "click" where a finger says "tap" (engine, Desk)
  var T = STRINGS.en;
  function setLang(code) { T = STRINGS[code] || STRINGS.en; }

  /* ── 2. what the player has ───────────────────────────────────────────── */

  var CONFIG = W.CONFIG;                // the single-file build has no global CONFIG
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
    /* The pick is a QUEUE, oldest first: what this level brings in goes to
       the back, so it is the last one a new tap pushes out. */
    var fresh = [];
    for (i = 0; i < sel.length; i++) if (lvOf(sel[i]) === n) fresh.push(sel[i]);
    sel = sel.filter(function (id) { return fresh.indexOf(id) < 0; }).concat(fresh);
    function lvOf(id) { for (var j = 0; j < items.length; j++) if (items[j].id === id) return items[j].lv; return 0; }

    var focus = sel[sel.length - 1], gone = null, landed = null;
    var endless = LV() && n > LV().count();

    var cap, detail, grid, tiles = {};

    function tapTile(id) {
      focus = id;
      if (!had[id]) return;
      var at = sel.indexOf(id);
      if (at >= 0) { sel.splice(at, 1); return; }
      if (sel.length >= want) gone = sel.shift();
      sel.push(id);
      landed = id;
    }
    // what PLAY takes: the pick, topped up with the level's own where it is short
    function final() {
      var out = sel.slice(), pool = (G.suggest(n) || []).concat(owned);
      for (var j = 0; j < pool.length && out.length < want; j++) {
        if (had[pool[j]] && out.indexOf(pool[j]) < 0) out.push(pool[j]);
      }
      return out;
    }
    /* How many slots are taken, as a bar of one segment a slot rather than
       a line of words: read at a glance, and it fills as the player taps. */
    function paintCap() {
      if (cap.children.length !== want) {
        cap.innerHTML = "";
        for (var s = 0; s < want; s++) cap.appendChild(el("i", "lo-seg"));
      }
      for (var k = 0; k < want; k++) cap.children[k].classList.toggle("on", k < sel.length);
      cap.classList.toggle("full", sel.length >= want);
      cap.setAttribute("aria-label", fill(T.taken, { n: sel.length, max: want }));
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
        var t = tiles[id];
        t.classList.toggle("sel", sel.indexOf(id) >= 0);
        t.classList.toggle("on", id === focus);
        t.classList.remove("in", "out");
        if (id === landed || id === gone) {
          void t.offsetWidth;            // restart the animation on a second tap
          t.classList.add(id === landed ? "in" : "out");
        }
      }
      landed = gone = null;
    }
    function paint() { paintCap(); paintDetail(); paintGrid(); }

    var handle = MD.open({
      kind: "loadout",
      eyebrow: endless ? T.endless : fill(T.level, { n: n }),
      title: G.title(),
      tap: T.tap,
      dismiss: false,
      esc: true,
      fill: function (body) {
        cap = el("div", "lo-cap");
        cap.setAttribute("role", "img");
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
          var pick = final();
          W.Store.set(KEY, pick.slice());
          G.set(pick);
          handle.close();
          go();
        });
        body.appendChild(cap);
        body.appendChild(grid);
        body.appendChild(detail);
        body.appendChild(playBtn);
      }
    });
    /* The description box keeps ONE height, the tallest any tile of the grid
       asks for — measured once the card is laid out, in the player's language
       — so the card never grows or shrinks as the focus moves. */
    var keep = focus, tall = 0;
    for (i = 0; i < items.length; i++) {
      focus = items[i].id; paintDetail();
      tall = Math.max(tall, detail.offsetHeight);
    }
    if (tall) detail.style.height = tall + "px";
    focus = keep;
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
