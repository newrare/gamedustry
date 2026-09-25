/*
  webshell — the VILLAGE: a game's front door drawn as a place.

  Loaded last of the web layer, after menu.js, and it is inert unless the game
  declares `web.village` in its manifest — which the builder injects as
  CONFIG.web.village. A game without one keeps the stacked menu exactly as it
  is; a game with one gets the same doors as BUILDINGS standing on a painted
  hub, and the player looks at where to go instead of reading it.

  IT IS A VIEW, AND IT IS THE ONE THE PLAYER LIVES ON.

    title  ->  VILLAGE  ->  map  ->  round  ->  score  ->  VILLAGE

  The title screen is unchanged — the same stacked menu it always was — and
  PLAY opens this instead of the map. From here the map is a building, and so
  are the collection, the shop, the ranking, the daily road and the options.
  Everything downstream then points back HERE rather than at the map or at the
  title: the band's house chip (`View.home`, which this file declares its base
  view to), the end screen's first button, and the ESCAPE that walks all the
  way out. The title screen becomes the front door a player comes through once
  a session, which is what a front door is.

  It never touches `#btn-start`. The motor's start button stays on the title
  screen where the motor put it — menu.js binds it to this view's `open()` for
  a game that has one — so `startGame`, the SPACE key and the user gesture
  `Sound.unlock()` rides on are all the ones they have always been, and this
  file has no idea any of them exist.

  THE FEET ARE THE ANCHOR, and the composition is in the 720x1280 design space
  like everything else inside `#frame`. `x` and `y` are the middle of a house's
  BASE — where it touches the ground, where its halo lies, what it turns
  around — and the houses are drawn in the order the manifest lists them, which
  the composer already sorted by `layer` and then by `y`: a house on a higher
  plane is in front of one on a lower, and within a plane the lower feet win.
  `layer` is absent from almost every house and means 0 — the feet answer on
  their own for anything that stands on the ground, and the field is for what
  does not: a cloud in front of the roofs, a fence behind them.
  Nothing here sets a z-index, and `village.css` explains why it must not.

  THE MANIFEST SAYS HOW, THIS FILE SAYS WHETHER. A house's `notify` names the
  pulse the BUILDING would use, `light` the one its HALO would — two fields and
  not one, so a mill can turn over a lit pad instead of choosing — with `every`
  / `delay` and `lightEvery` / `lightDelay` for how fast and how late each one
  is, and `badge` for where a number would sit. Whether there is anything to
  say is the shell's answer at runtime, and it comes from the meta layer (DOORS
  below). A house whose manifest names no pulse never pulses however much is
  waiting behind it, and a house with nothing waiting stays quiet however it
  was composed. Neither half guesses the other.

  THE WORDS ARE THE PLAYER'S. Every door carries its role's own word under its
  feet and every one of them is HIDDEN, because a village is meant to be read
  as a place and six plates over six buildings turn it back into the list it
  replaced. A switch in OPTIONS brings them all back at once (menu.js,
  Settings.labels) — it is not a field of the composition, since a village
  where three buildings were named and three were not is the worst of both.

  WITH ONE EXCEPTION, AND IT IS DECLARED: `always` takes the question away.
  That house pulses because the composer wanted a building that moves — a
  beacon, a mill, a light that comes and goes — and it never waits on the meta
  layer for permission. Its badge still answers to what is waiting, because a
  number is about the number.

  A DOOR NOBODY BUILT MOSTLY DOES NOT MATTER. Six buildings is what an image
  model returns on one sheet, and the WALLET BAND over this view is already the
  door to four of them — the ranking, the shop, the collection and the map — so
  a village that skipped one of those skipped a second way to somewhere the
  player can already reach. HELP is the map's: level 0 opens it, on every
  board. The one hole worth plugging is OPTIONS, which nothing else carries,
  and it goes where the round's own switches go (`VW.cornerOnView`).

  ES5-ish on purpose, like the rest of the shell.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  if (!W) return;                       // not a web build

  var CONFIG = W.CONFIG;
  var SPEC = (CONFIG.web && CONFIG.web.village) || null;
  if (!SPEC || !SPEC.houses || !SPEC.houses.length) return;

  var VW = window.__VIEW__;
  var MENU = window.__MENU__;
  var LV = window.__LEVELS__ || null;
  var MT = window.__META__ || null;
  var DL = window.__DAILY__ || null;
  /* The barracks is loaded BEFORE this file (the builder's order) for exactly
     one reason: a village lists its doors and has to know which of them
     answer. A game with no `web.army` never publishes it. */
  var AR = window.__ARMY__ || null;

  function levelled() { return !!(LV && LV.active()); }
  function metaed() { return !!(MT && MT.active()); }
  function armied() { return !!(AR && AR.active()); }

  function $(id) { return document.getElementById(id); }

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  /* ── 1. what is waiting behind each door ──────────────────────────────── */

  /* One entry per door that can have something to say, and every one of them
     reads a number the shell ALREADY keeps — nothing here is a second counter
     to keep in step with the first.

     `count` returns how many, and 0 is "nothing to say": it is what the badge
     writes and what decides whether the pulse runs at all. A door with no
     entry is never loud, which is most of them — a leaderboard, a shop and an
     options card have nothing to hand over.

     The collection reads `MT.unseen()`, which is the SAME signal the wallet
     band's album chip already wears a dot for (meta.js): two places saying the
     same thing from one source rather than two rules that drift apart. */
  /* A BADGE IS ABOUT THE NUMBER, so every one of these counts the thing the
     player would walk in and USE — not the fact that something is there. The
     collection used to report `MT.unseen()`, which is a boolean, and a boolean
     written into a badge is the word "true" standing over a house. */
  var DOORS = {
    /* THE COLLECTION COUNTS WHAT PULLS THE MACHINE: ordinary tickets and
       super tickets together, because both are spent on that one screen and a
       player looking at the hub is asking "can I draw?" rather than "which
       currency do I hold?". The two are told apart inside, on the bet row that
       spends them. */
    album: function () { return metaed() ? MT.tickets() + MT.supers() : 0; },
    /* THE DAILY ROAD COUNTS TODAY'S GIFTS — one, or none once it is taken. */
    daily: function () { return (metaed() && DL && DL.active() && DL.pending()) ? 1 : 0; },
    /* THE SHOP COUNTS WHAT IS FOR SALE, which is every copy of a sticker past
       the first: the shelf of doubles is the whole of what that screen buys,
       and a shop with nothing on the shelf has nothing to announce. */
    shop: function () { return metaed() ? sellable() : 0; },
    /* The map, once, for a board nobody has opened: the one moment it is
       really true that there is something there the player has not had. After
       the first star it is the loudest building on the hub saying what the
       player already knows. */
    map: function () { return (levelled() && !LV.total()) ? 1 : 0; },
    /* THE BARRACKS' FOUR, and every one of them counts what the player would
       walk in and ACT on rather than what is merely in the room. The deck says
       how many slots are empty — a deck that is not full is the one thing on
       that screen that has to be finished before a battle; the infirmary and
       the prison count who is IN them, the cards the screen behind the door
       lists, because both rooms have six places and a full one is the news;
       the camp the recruits
       the wallet can actually pay for plus the squads back from a mission with
       a report to read. A roster of forty cards sitting quietly is not news,
       and a badge that reported it would never go out. */
    deck:      function () { return armied() ? AR.deckShort() : 0; },
    infirmary: function () { return armied() ? AR.inInfirmary() : 0; },
    prison:    function () { return armied() ? AR.inPrison() : 0; },
    recruit:   function () { return armied() ? (AR.camp ? AR.camp() : AR.affordable()) : 0; }
  };

  /* How many stickers the shop would buy back: the EXTRA copies, which is what
     `sellAll` empties and what the shelf is priced on (packages/webshell/
     meta.js, sellAll). */
  function sellable() {
    var list = MT.dupes(), n = 0;
    for (var i = 0; i < list.length; i++) n += MT.count(list[i]) - 1;
    return n;
  }

  function waiting(role) {
    var fn = DOORS[role];
    if (!fn) return 0;
    var n = 0;
    /* Coerced rather than trusted: a door that answers with a boolean is
       answering the wrong question, and `Number` is what stops the answer
       reaching the screen as a word. */
    try { n = Number(fn()) || 0; } catch (e) { n = 0; }
    return n > 0 ? n : 0;
  }

  /* ── 1b. the light, breathing ─────────────────────────────────────────── */

  /* A HUB IS PAINTED AT ONE HOUR AND IT STAYS THERE. Reading the player's real
     clock was the first answer to that and it was the wrong one: it is a
     difference nobody can SEE, because nothing moves while they are looking —
     the village at noon and the village at midnight are two pictures the
     player never holds side by side.

     So the scene BREATHES instead: it passes through its own painted light,
     out into warm, back through it and out into cold, over two minutes. All of
     it is keyframes (village.css), so there is no clock here, no interval and
     no formula — four custom properties and CSS does the rest. */
  var LIFE = SPEC.life || null;
  var CYCLE = LIFE && LIFE.cycle;
  var skyNode = null, groundNode = null;

  function lightUp(node) {
    if (!CYCLE) return;
    node.style.setProperty("--vg-cycle", (CYCLE.seconds || 120) + "s");
    /* The amount the BRIGHTNESS travels and the amount the COLOUR does are two
       numbers from one: a tint at full strength over a scene already pushed a
       third of the way is two effects stacked, and the scene goes flat. */
    node.style.setProperty("--vg-amp", (CYCLE.amount * 0.5).toFixed(3));
    node.style.setProperty("--vg-amp-c", CYCLE.amount.toFixed(3));
    node.style.setProperty("--vg-warm", CYCLE.warm || "#ffcf8f");
    node.style.setProperty("--vg-cold", CYCLE.cold || "#16234f");
  }

  /* ── 2. the composition ───────────────────────────────────────────────── */

  var DEFAULT_HALO = { w: 1.1, h: 0.34, dy: 0.04 };
  var DEFAULT_BADGE = { dx: 0.32, dy: -0.62 };

  /* HOW LONG ONE TURN TAKES when the manifest does not say. They are not one
     number because they are not one gesture: a blink that took as long as a
     breath would not read as a blink, and `random` is long on purpose so its
     beat never lines up with a glance. `every` and `lightEvery` override them.

     TWO LISTS BECAUSE THERE ARE TWO FIELDS. `notify` moves the HOUSE and
     `light` works the halo under it, and a house may wear one of each — a mill
     turning over a lit pad. They were one list picked one at a time, and that
     was the bug: a building could be alive or lit and never both. */
  /* `cloud` is forty-eight seconds and not four because it is not a beat: it is
     one crossing of the whole frame, and a cloud that crosses in four seconds
     is a bird. The breath and the haze are divided out of it in CSS. */
  var PULSE_SECONDS = { float: 3.4, breath: 2.6, alert: 3.2, fade: 4, cloud: 48 };
  var LIGHT_SECONDS = { blink: 1.5, flicker: 2.4, random: 7 };

  /* A VILLAGE WRITTEN BEFORE THE SPLIT STILL READS. `breath: true` was the
     first spelling of a pulse, and `notify: "flicker"` the second — where the
     light and the house shared one field. Both are read as what they named,
     here and nowhere else, so the rest of this file only ever sees the two
     fields it has now. */
  function pulseOf(h) {
    var k = h.notify || (h.breath ? "breath" : null);
    return PULSE_SECONDS[k] ? k : null;
  }

  function lightOf(h) {
    var k = h.light || h.notify;
    return LIGHT_SECONDS[k] ? k : null;
  }

  function art(role) {
    return (CONFIG.art && CONFIG.art[role]) || null;
  }

  var box = null;              // #web-village
  var nodes = [];              // { spec, node, badge, word }
  var labelsOn = false;        // the player's switch, off until OPTIONS says so

  function build() {
    box = el("div"); box.id = "web-village";

    /* THE GROUND IS A LAYER OF THE VILLAGE, not a swap of the motor's. The
       shell has already dressed the intro with `background-phone` and the end
       screen reads the same node, so the hub is laid OVER it and the end
       screen keeps the painting it was composed against. A village that names
       no ground simply shows what was already there. */
    var ground = SPEC.ground && art(SPEC.ground);
    if (ground) {
      groundNode = el("div"); groundNode.id = "vg-ground";
      groundNode.style.backgroundImage = "url(" + ground + ")";
      lightUp(groundNode);
      box.appendChild(groundNode);
    }

    for (var i = 0; i < SPEC.houses.length; i++) house(SPEC.houses[i], i);

    /* THE SKY GOES OVER THE HOUSES, last of all, because light that stops at
       the buildings is a filter on a picture and light that crosses them is
       weather. No z-index: the houses have none either, so DOM order is the
       whole of it. */
    if (CYCLE) {
      skyNode = el("div"); skyNode.id = "vg-sky";
      lightUp(skyNode);
      box.appendChild(skyNode);
    }
  }

  function house(h, i) {
    /* AN EMPTY HOUSE IS A LIGHT AND NOTHING ELSE — a box placed over a lamp the
       hub was painted with, carrying a halo, a badge and a door without a cut
       of its own. Everything else needs a picture the build actually ships. */
    var empty = h.art === "empty";
    var src = empty ? null : art(h.art);
    if (!src && !empty) return;         // a role the build does not carry

    var pulse = pulseOf(h), lit = lightOf(h);

    var n = el("div", "vg-house" + (h.halo ? " lit" : "") + (empty ? " empty" : ""));
    if (pulse) {
      n.className += " n-" + pulse;
      /* HOW FAST AND HOW LATE, both the manifest's. The delay is what keeps
         two houses wearing the same pulse from beating as one object. */
      var turn = h.every || PULSE_SECONDS[pulse];
      n.style.setProperty("--pulse-dur", turn + "s");
      /* A CLOUD THAT NAMES NO DELAY IS ALREADY ON ITS WAY. Every crossing
         starts fully off the right edge, so a sky of three clouds composed
         without delays opens empty and stays that way for most of a minute.
         The negative lead is the same trick `l-random` uses one field along:
         an irrational stride so no two of them share a point, and negative so
         the cycle is under way rather than starting on the first frame. */
      var lead = h.delay || (pulse === "cloud" ? -((i * 0.618) % 1) * turn : 0);
      if (lead) n.style.setProperty("--pulse-delay", lead.toFixed(2) + "s");
      /* THE CLOUD'S TWO EXTRA FIELDS, and neither exists for any other pulse:
         `drift` is which way it goes — west by default, because that is the
         way weather reads on a painted scene — and `breathEvery` is the vapour
         working on its own clock instead of the crossing's over seven. */
      if (pulse === "cloud") {
        if (h.drift === "right") n.className += " d-right";
        if (h.breathEvery) n.style.setProperty("--breath-dur", h.breathEvery + "s");
      }
    }
    /* THE LIGHT IS THE OTHER FIELD, and it has its own two numbers: a mill
       turning every four seconds over a pad flickering on its own is two
       rhythms on purpose, and one pair of properties could not say it. */
    if (lit) {
      n.className += " l-" + lit;
      n.style.setProperty("--light-dur", (h.lightEvery || LIGHT_SECONDS[lit]) + "s");
      /* RANDOM's whole trick: one deterministic cycle, entered at a different
         point per house. The stride is irrational so no two of six share one,
         and it is negative so the cycle is already under way rather than
         starting on the first frame. */
      var lag = h.lightDelay || (lit === "random" ? -(i * 1.618 % 7) : 0);
      if (lag) n.style.setProperty("--light-delay", lag.toFixed(2) + "s");
    }
    /* AND WHEN, for both of them at once. A house set to pulse ALWAYS is
       scenery that moves — a mill, a beacon, a light that comes and goes — and
       it never waits on the meta layer for permission. Everything else runs
       only while something is waiting behind its door, which is `refresh()`
       below. */
    if (h.always) n.className += " beat";
    /* WHICH DOOR THIS IS, ON THE NODE. Nothing in this file reads it back —
       the click is bound to the role directly — but a house is otherwise
       identified only by the picture it happens to wear, so a hub is
       unreadable from outside: the view contract (tools/test/views.mjs) and
       anything else that has to find one door among twelve asks here. */
    n.setAttribute("data-role", h.role);
    n.style.left = h.x + "px";
    n.style.top = h.y + "px";
    /* THE PLACEMENT, AGAIN AND AS TWO NUMBERS CSS CAN READ. `left` and `top`
       cannot be reached from a keyframe, and `vg-drift` has to cancel them to
       carry a cloud across the frame from wherever it was dropped
       (village.css). Written for every house so a pulse picked later needs no
       second pass. */
    n.style.setProperty("--vg-x", h.x + "px");
    n.style.setProperty("--vg-w", h.w + "px");

    var halo = null;
    if (h.halo) {
      var hs = h.halo === true ? DEFAULT_HALO : h.halo;
      halo = el("div", "vg-halo");
      halo.style.width = (h.w * hs.w) + "px";
      halo.style.height = (h.w * hs.h) + "px";
      halo.style.marginTop = (h.w * (hs.dy || 0)) + "px";
      /* THE HALO'S OWN COLOUR, when the composer gave it one. A hub with six
         buildings under one accent reads as six copies of one object. */
      if (hs.color) halo.style.setProperty("--vg-halo", hs.color);
      n.appendChild(halo);
    }

    var body = el("div", "vg-body");
    body.style.width = h.w + "px";
    /* With no picture there is nothing to give the box a height, so the empty
       one is square: its size IS its hit area and the composer sizes it by
       looking at the pad it covers. */
    if (empty) body.style.height = h.w + "px";

    var rot = el("div", "vg-rot");
    if (h.rot) rot.style.setProperty("--vg-rot", h.rot + "deg");

    var inner = el("div", "vg-in");
    if (src) {
      var img = el("img", h.flip ? "flip" : "");
      img.src = src;
      img.alt = "";
      img.draggable = false;
      inner.appendChild(img);
    }
    rot.appendChild(inner);
    body.appendChild(rot);

    var badge = null;
    if (h.badge) {
      var b = h.badge === true ? DEFAULT_BADGE : h.badge;
      badge = el("div", "vg-badge");
      badge.style.left = (50 + b.dx * 100) + "%";
      badge.style.top = (100 + b.dy * 100) + "%";
      badge.hidden = true;
      body.appendChild(badge);
    }
    n.appendChild(body);

    /* THE DOOR — a button of its own, stretched over the house, so every one
       of them is reached by TAB and fired by ENTER exactly as the menu entry
       it stands for is. `play` is the one role with no entry in the door list:
       on a levelled game it starts the HIGHEST LEVEL the board has opened —
       never a free round nobody picked — and on a game with no levels it
       starts the round, which is the motor's, through the shell's own start. */
    var word = null;
    if (h.role !== "decor") {
      var hit = el("button", "vg-hit");
      hit.setAttribute("aria-label", label(h.role));
      hit.addEventListener("click", doorOf(h.role));
      body.appendChild(hit);

      /* THE WORD UNDER THE FEET, and it is the PLAYER'S switch rather than the
         composer's. A village is meant to be read as a place, so the labels are
         off by default and OPTIONS is where they come back (menu.js,
         Settings.labels) — a player who cannot tell the shop from the forge
         asks for them once and keeps them. Every door carries one, which is why
         it is not a field of the composition: a village where three buildings
         were named and three were not is the worst of both. */
      word = el("div", "vg-label");
      word.hidden = !labelsOn;
      n.appendChild(word);
    }

    box.appendChild(n);
    nodes.push({ spec: h, node: n, badge: badge, word: word });
  }

  function doorOf(role) {
    if (role === "play") return function () { if (levelled()) LV.playTop(); else W.start(); };
    return MENU.doors[role] || function () {};
  }

  /* A house's word is the ROLE'S, and it comes out of the strings this shell
     already writes — nothing in a village is typed twice. */
  function label(role) {
    /* PLAY IS NAMED AFTER WHAT IT DOES and the map after where it goes. They
       shared one word while the play house WAS the map's door, and a levelled
       village then had a building labelled LEVELS / NIVEAUX where the player
       reads "play" — the verb, not the destination. The map keeps its own
       word; this one is the shell's PLAY in every language. */
    if (role === "play") return MENU.text("play");
    if (role === "map") {
      return levelled() ? LV.text("levelsEntry") : MENU.text("play");
    }
    if (role === "ranking") return MENU.text("leaderboard");
    if (role === "options") return MENU.text("options");
    if (role === "help") return MENU.text("help");
    /* The barracks names its own four, out of its own strings — a house's word
       is the ROLE'S and nothing in a village is typed twice. */
    if (armied() && AR.label(role)) return AR.label(role);
    if (!metaed()) return "";
    if (role === "album") return MT.text("stickersEntry");
    if (role === "shop") return MT.text("shop");
    if (role === "daily") return DL && DL.active() ? DL.text("title") : "";
    return "";
  }

  /* ── 3. what is loud right now ────────────────────────────────────────── */

  function refresh() {
    for (var i = 0; i < nodes.length; i++) {
      var it = nodes[i], n = waiting(it.spec.role);
      /* A house told to pulse ALWAYS keeps beating whatever is or is not
         waiting; the badge is the other half and is about the number alone, so
         it appears and goes on its own. */
      if (!it.spec.always) it.node.classList.toggle("beat", n > 0);
      if (it.badge) {
        it.badge.hidden = !n;
        it.badge.textContent = n > 99 ? "99+" : String(n);
      }
    }
  }

  function relabel() {
    for (var i = 0; i < nodes.length; i++) {
      var word = label(nodes[i].spec.role);
      var b = nodes[i].node.querySelector(".vg-hit");
      if (b) b.setAttribute("aria-label", word);
      /* Shouted by the motor's own `upper`, like every other word this shell
         writes: a capital carries no accent, so "Cadeau du jour" reads CADEAU
         DU JOUR and never CADEAÙ. */
      if (nodes[i].word) nodes[i].word.textContent = W.upper(word);
    }
  }

  /* THE PLAYER'S OWN SWITCH. menu.js calls this from OPTIONS and once on boot,
     so a village built before the card was ever opened still opens on what was
     saved — and a call that lands before `build()` is why `labelsOn` is read
     there rather than written to a node that does not exist yet. */
  function setLabels(on) {
    labelsOn = !!on;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].word) nodes[i].word.hidden = !labelsOn;
    }
  }

  /* ── 4. mount ─────────────────────────────────────────────────────────── */

  function mount() {
    if (!MENU || !VW) return;           // the shell this one stands on is absent

    /* THE VIEW. It carries the band like every other one — which is also what
       makes it reachable from everywhere, since the house chip in that band is
       `View.home` and this file is what home now means. Its own chip is
       dropped while it stands bare (packages/webshell/meta.js, `bandDoors`),
       and comes back under a card. */
    /* The player's own switch, read once on the way up: menu.js applies it too,
       but only a village that was already loaded hears that call. */
    if (MENU.setting) setLabels(MENU.setting("labels"));

    VW.define("village", {
      build: build,
      node: function () { return box; },
      show: function () {
        refresh(); relabel();
        /* WHAT THE LAST ROUNDS' XP OWES THE PLAYER — the bar runs, then the
           card for a player level crossed (packages/webshell/meta.js,
           `arrive`). Deferred a tick: the view system raises the band AFTER
           `show` returns, and a bar that is not on screen yet measures zero
           and would swallow the reading. */
        if (metaed()) setTimeout(function () { if (VW.isOpen("village")) MT.arrive(); }, 0);
      },
      hud: true
    });
    VW.base("village");

    /* THE ONE DOOR NOTHING ELSE CARRIES. The band over this view already leads
       to the ranking, the shop, the collection and the map, and level 0 of
       that map opens the help — so a village that skipped one of those skipped
       a duplicate. OPTIONS has no second way in, so where it is not a building
       it is the corner control it is on every other screen. */
    var built = {};
    for (var i = 0; i < SPEC.houses.length; i++) built[SPEC.houses[i].role] = 1;
    VW.cornerOnView("village", built.options ? [] : ["options"]);

    /* Everything that can change what is waiting happens somewhere else and
       comes back here: a gift taken on the map, a sticker drawn in the album,
       a first star. */
    if (metaed()) MT.onChange(refresh);
    /* The language is rewritten rather than reloaded (menu.js, setLang), so
       the words a village carries follow it on the same beat. */
    if (VW.onChange) VW.onChange(function () { if (box) relabel(); });
  }

  /* menu.js registered first and therefore mounts first, which is what this
     file relies on: `window.__MENU__` and every node it puts on the intro are
     already there by the time this runs. */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  window.__VILLAGE__ = {
    /* Declared, not built: menu.js asks this before the first open, to decide
       what PLAY is. */
    active: function () { return true; },
    /* THE GROUND, FOR THE SCREENS THAT STAND ON IT. The shop and the collection
       are rooms of this place — the album is a door on the hub and the shop is
       the till inside it — so they wear the hub's own picture rather than the
       game's round backdrop (packages/webshell/view.js, `ground`). It is
       a SOURCE and not the node: the ground layer here carries the breathing
       light, which belongs to the village and to nothing else. */
    ground: function () { return (SPEC.ground && art(SPEC.ground)) || null; },
    open: function () { VW.go("village"); },
    isOpen: function () { return VW.isOpen("village"); },
    refresh: refresh,
    relabel: relabel,
    setLabels: setLabels
  };
})();
