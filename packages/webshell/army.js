/*
  webshell — the BARRACKS: the cards the player owns, and what a battle costs
  them.

  Loaded after meta.js (whose save it writes through and whose wallet it
  spends) and before menu.js and village.js (which list its four doors). It is
  inert unless the game declares `web.army` in its manifest — which the builder
  injects as CONFIG.web.army — so twelve of the thirteen never see any of it,
  and a playable never sees it at all.

  WHY IT EXISTS. A round that deals a fresh random deck every time is a round
  with nothing at stake: the cards are the game's, not the player's, and losing
  one costs the length of a shuffle. The barracks makes them the player's — one
  roster, kept — and then gives a fight a price:

    a card that wins against something better equipped is WOUNDED, and goes to
    the infirmary for two days once the battle is over
    an enemy beaten by something plainly better is left STANDING, and a won
    battle offers one of them as a PRISONER, who turns after five days

  Those two rules are the round's (games/stratideck/game.js, `judge`): this
  file never watches a fight. What it does is own the four lists either rule
  writes into, and hand the deck over before the round starts.

  FOUR SCREENS AND THEY ARE VIEWS, not cards. A card is something that happens
  over wherever the player is and is dismissed rather than navigated
  (docs/VIEWS.md); every one of these is a place with a list to manage, a
  purchase to make or a deck to finish, and a screen a stray tap can close is
  not a screen anything is composed on. They stack over the village like the
  album and the shop do, they carry the wallet band, and ESCAPE peels them.

    deck        the roster, and the cards taken into the next battle — and
                two more tabs on the same screen: the COLLECTION (the whole
                cast, sixty officers a side, each one turned over to read who
                they are) and the OBJECTS (the flag, the trap and the rest of what a
                camp is built of), a shadow for what was never had
    infirmary   what a battle cost, and how long until it comes back
    prison      who was taken, and how long until they turn
    recruit     what the tent is offering today, and what it costs

  THE SAVE IS META'S. `save.ar`, written through MT.army/setArmy, for the same
  reason the daily road's is: it is bought with that wallet, and a second key
  would be a second thing for OPTIONS to erase and a second thing to forget.

  THE CARD MODEL IS THE MANIFEST'S. The grades, their names and their painted
  faces, the tier ladder, the deck size, the two waits and what a recruit costs
  are all `web.army` — this file knows that a card is a grade and a tier and
  nothing else about what either means.

  AND A CARD IS A PERSON. `web.army.cast` names one officer per army, grade
  and tier — 2 × 10 × 6, so every combination is exactly one of them and the
  identity is never stored: the army a card was raised in, its grade and its
  tier ARE who it is. Their name, age, gender and story are printed on the
  back of the card, turned over from the deck and the collection (`openFile`).
  A card remembers the army it came from only when that is not the one it
  fights for (`o: "red"`, a prisoner who enlisted), because that is the one
  case where the answer is not the side of the table it stands on.

  ES5-ish on purpose, like the rest of the shell.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  if (!W) return;                       // not a web build

  var CONFIG = W.CONFIG;
  var SPEC = (CONFIG.web && CONFIG.web.army) || null;
  if (!SPEC) return;                    // a game with no barracks: nothing published

  var MT = window.__META__ || null;
  var VW = window.__VIEW__;
  var MD = window.__MODAL__;
  /* The wallet is not optional: a recruiting tent with nothing to spend is a
     shelf of prices. A game that declares `web.army` without `web.meta` is a
     manifest mistake, and going quiet is the only honest answer to it. */
  if (!MT || !MT.active() || !VW || !MD) return;

  /* menu.js hands its icon pack and its language over on mount, like it does
     to the map and the meta layer. The dom helper is local rather than
     borrowed: this file builds nodes before that call can have happened. */
  var API = null;
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function icon(name, cls) { return API ? API.icon(name, cls) : ""; }
  function frame() { return document.getElementById("frame"); }

  /* ── 1. the card model, out of the manifest ───────────────────────────── */

  var TIERS = SPEC.tiers || ["E", "D", "C", "B", "A", "S"];
  var TOP = TIERS.length - 1;
  var DECK_SIZE = Math.max(4, SPEC.deckSize || 12);
  var PICK = Math.max(1, SPEC.capturePick || 3);

  /* ONE ENTRY PER GRADE THE PLAYER CAN OWN, in the manifest's own order. The
     enemy-only cards (a trap, a flag) are simply not in it, which is why this
     file never has to know they exist. */
  var GRADES = SPEC.grades || [];
  var GRADE = {};
  (function () {
    for (var i = 0; i < GRADES.length; i++) GRADE[GRADES[i].r] = GRADES[i];
  })();

  /* THE CARDS NOBODY OWNS: the flag, the trap and the scenery of a camp,
     `web.army.objects` in the manifest, in the order the OBJECTS tab lists
     them. They carry an `r` from the game's own table (games/stratideck,
     RANKS) and no tier; this file only ever names and draws them. */
  var OBJECTS = SPEC.objects || [];
  var OBJECT = {};
  (function () {
    for (var i = 0; i < OBJECTS.length; i++) OBJECT[OBJECTS[i].r] = OBJECTS[i];
  })();

  /* THE CAST, keyed the way the collection is: "b4.2" is the blue sergeant
     at C. The name is a proper noun and is never translated, like a
     sticker's; the lore carries both languages. */
  var CAST = {};
  (function () {
    var list = SPEC.cast || [];
    for (var i = 0; i < list.length; i++) CAST[ck(list[i].side, list[i].r, list[i].t)] = list[i];
  })();
  function ck(side, g, t) { return (side === "red" ? "r" : "b") + g + "." + t; }
  function castOf(side, g, t) { return CAST[ck(side, g, t)] || null; }
  function whoName(side, g, t) {
    var p = castOf(side, g, t);
    return p ? p.first + " " + p.last : W.Lang.t(gradeName(g)) + " · " + tierName(t);
  }

  function gradeName(g) {
    return (GRADE[g] && GRADE[g].name) || (OBJECT[g] && OBJECT[g].name) || String(g);
  }
  /* THE SAME OFFICER ON BOTH SIDES OF THE SAME WAR. A grade names two painted
     faces — `art` the player's, `foe` the camp's — and the screens pick by who
     is being drawn: the roster and the deck are blue, a prisoner is red until
     the moment they turn. It is what makes the card offered on the end screen
     visibly the card that was just fighting back. */
  function gradeArt(g, foe, t, turn) {
    var tail = (g < 10 ? "0" : "") + g + TIERS[clamp(t | 0, 0, TOP)];
    var cast = t != null && CONFIG.art &&
      ((turn && CONFIG.art["castTurn" + tail]) || CONFIG.art["cast" + (foe ? "Red" : "Blue") + tail]);
    if (cast) return cast;
    var e = GRADE[g];
    var k = (foe && e && e.foe) || (e && e.art);
    return (k && CONFIG.art && CONFIG.art[k]) || null;
  }
  function tierName(t) { return TIERS[clamp(t, 0, TOP)]; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* WHAT A CARD COSTS, and it is one formula rather than a table of sixty:
     the grade lifts it gently and the tier multiplies it, so an S is a
     decision and an E is pocket change. The manifest owns all three numbers. */
  var RC = SPEC.recruit || {};
  var R_BASE = RC.base || 90, R_GRADE = RC.gradeStep || 0.22, R_TIER = RC.tierStep || 1.9;
  var R_SLOTS = Math.max(1, RC.slots || 3);

  function priceOf(g, t) {
    return Math.round(R_BASE * (1 + R_GRADE * (g - 1)) * Math.pow(R_TIER, t) / 5) * 5;
  }

  /* ── 1b. the clock ────────────────────────────────────────────────────── */

  /* THE ONE THING THIS LAYER CANNOT BE WORKED ON IS THE THING IT IS MADE OF: a
     wait of two days takes two days to watch once. Same answer as the daily
     road's (packages/webshell/daily.js) and the same fence around it — on a
     machine that is plainly not a player's, an hour is a second, and the
     screens wear a DEV pill so a screenshot can never be mistaken for the real
     thing. Nothing here reaches a deployed site, whose hostname is none of
     these. */
  var DEV = (function () {
    var h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "" ||
           h === "::1" || /^192\.168\./.test(h) || /^10\./.test(h);
  })();
  var HOUR = DEV ? 1000 : 3600000;

  var HEAL_MS = (SPEC.infirmaryHours || 48) * HOUR;
  var FREE_MS = (SPEC.prisonHours || 120) * HOUR;
  var TENT_MS = (RC.refreshHours || 6) * HOUR;

  /* SIX BEDS AND SIX CELLS. A room that holds everything is a room nobody
     empties: with a ceiling, a wound the infirmary has no bed for is a card
     LOST (the round refuses it on the spot and says so — games/stratideck,
     `wound`), and a prisoner the prison has no cell for is not taken. Both
     numbers are the manifest's (`web.army.infirmaryBeds` / `prisonCells`). */
  var BEDS = SPEC.infirmaryBeds || 6;
  var CELLS = SPEC.prisonCells || 6;

  function now() { return Date.now(); }

  /* A WAIT, WRITTEN THE WAY A WAIT IS READ: the biggest unit and the one under
     it, never three, and never a unit that is always zero. "2d 04h" and
     "03h 12m" and "12m" — and under a minute it is the word, because a number
     counting the last seconds down is a number the player watches instead of
     playing. */
  function untilText(ms) {
    if (ms <= 0) return T.ready;
    var m = Math.ceil(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d >= 1) return d + T.uD + " " + pad(h - d * 24) + T.uH;
    if (h >= 1) return pad(h) + T.uH + " " + pad(m - h * 60) + T.uM;
    if (m >= 1) return m + T.uM;
    return T.soon;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ── 2. the save ──────────────────────────────────────────────────────── */

  /* Meta's own key, one field of it (see the file header).

       n  the next id to hand out — ids are never reused, because a card in the
          deck, a card in the infirmary and a card a battle wounded are three
          lists pointing at one thing
       r  the roster: { i id, g grade, t tier, w the moment its wound heals,
          0 when it is fit, o "red" on a prisoner who enlisted — absent on
          every card raised in the player's own army }
       d  the deck: ids, in the order the player put them in
       p  the prison: { g, t, u the moment the prisoner turns }
       k  the recruiting tent: { t when the shelf was rolled, o what is on it,
          b which of those have been bought }
       c  the collection, and it only ever grows: { h officer → 1 once OWNED,
          m officer → 1 once MET in a battle or held in the prison, o object →
          1 once one was turned over }. An officer is `ck()`'s key — "b4.2",
          the blue sergeant at C — so the collection is the cast, one person
          per entry. A card sold, killed or healed away is still a card the
          player has had. */
  function blank() {
    var s = { v: 1, n: 1, r: [], d: [], p: [], k: null, c: { h: {}, m: {}, o: {} } }, i, j, e;
    var start = SPEC.start || [];
    for (i = 0; i < start.length; i++) {
      e = start[i];
      for (j = 0; j < (e.n || 1); j++) enrol(s, e.r, e.t | 0);
    }
    /* THE FIRST DECK IS FILLED FOR THEM. A player who opens a brand new game,
       walks past a hub they have never seen and presses PLAY must not lose
       their first battle to an empty deck screen they had no reason to open.
       Best first, which is also the deck they would have built. */
    var pool = s.r.slice().sort(cmpCard);
    for (i = 0; i < pool.length && s.d.length < DECK_SIZE; i++) s.d.push(pool[i].i);
    return s;
  }

  /* THE ONE WAY A CARD JOINS THE ROSTER — the first roster, a recruit, a
     prisoner who turned — so the collection cannot miss one. */
  function enrol(s, g, t, o) {
    var c = { i: String(s.n++), g: g, t: t, w: 0 };
    if (o === "red") c.o = "red";
    s.r.push(c);
    s.c.h[ck(o || "blue", g, t)] = 1;
    return c;
  }
  /* Every officer of the camp the player has looked in the face — turned
     over in a battle, or taken to the prison. */
  function meet(s, g, t) { s.c.m[ck("red", g, t | 0)] = 1; }

  /* Best first: the grade decides, the tier breaks it. The same order the
     round reads a fight in, so a roster sorted here and a fight resolved there
     cannot tell the player two different stories about which card is better. */
  function cmpCard(a, b) { return (b.g * 10 + b.t) - (a.g * 10 + a.t); }

  var fresh = false;

  var save = (function load() {
    var s = MT.army();
    if (!s || s.v !== 1 || !s.r || !s.r.length) { fresh = true; return blank(); }
    if (!s.d) s.d = [];
    if (!s.p) s.p = [];
    if (!s.c) s.c = { o: {} };
    if (!s.c.o) s.c.o = {};
    /* A SAVE FROM BEFORE THE CAST starts its collection from what it can
       prove: the roster is owned, a prisoner was met, and the older book —
       the best tier of each GRADE had or met — names one officer per grade.
       Nothing is invented for the battles fought before it was kept. */
    if (!s.c.h) {
      var q, g;
      s.c.h = {}; s.c.m = {};
      for (g in (s.c.b || {})) if (s.c.b.hasOwnProperty(g)) s.c.h[ck("blue", +g, s.c.b[g])] = 1;
      for (g in (s.c.r || {})) if (s.c.r.hasOwnProperty(g)) s.c.m[ck("red", +g, s.c.r[g])] = 1;
      for (q = 0; q < s.r.length; q++) s.c.h[ck(s.r[q].o || "blue", s.r[q].g, s.r[q].t)] = 1;
      for (q = 0; q < s.p.length; q++) s.c.m[ck("red", s.p[q].g, s.p[q].t)] = 1;
      delete s.c.b; delete s.c.r;
      fresh = true;                     // written once, below
    }
    /* Ids are never reused, so the counter has to clear every id already out
       there — a save written by an older shape of this file, or one a hand
       edited, must not hand a second card the id the deck is pointing at. */
    var i, id;
    if (typeof s.n !== "number") s.n = 1;
    for (i = 0; i < s.r.length; i++) {
      id = parseInt(s.r[i].i, 10);
      if (id >= s.n) s.n = id + 1;
    }
    return s;
  })();

  var hooks = [];
  function persist() {
    MT.setArmy(save);
    syncDeck();
    for (var i = 0; i < hooks.length; i++) hooks[i]();
    repaint();
  }

  /* ── 3. reading the roster ────────────────────────────────────────────── */

  function byId(id) {
    for (var i = 0; i < save.r.length; i++) if (save.r[i].i === id) return save.r[i];
    return null;
  }
  function fit(c) { return !c.w || c.w <= now(); }
  function hurtList() {
    var out = [], i;
    for (i = 0; i < save.r.length; i++) if (!fit(save.r[i])) out.push(save.r[i]);
    out.sort(function (a, b) { return a.w - b.w; });
    return out;
  }
  /* WHAT IS IN THE ROOM: the infirmary's and the prison's badges, which
     count the cards the player would find inside — the same list each
     screen draws. */
  function inInfirmary() { return hurtList().length; }
  function inPrison() { return save.p.length; }
  function inDeck(id) { return save.d.indexOf(id) >= 0; }
  function deckShort() { return Math.max(0, DECK_SIZE - save.d.length); }

  /* ── 4. the deck the round is handed ──────────────────────────────────── */

  /* THE ONE THING THIS FILE SAYS TO THE GAME, and it says it by writing a
     field rather than by being called: `CONFIG.army.deck` is read fresh by
     `Game.reset()` on every round, so keeping it current on every change is
     enough and there is no start hook to keep in step with the map, the
     village and the end screen's PLAY AGAIN.

     A WOUNDED CARD IS NOT IN IT, whatever the deck screen says: the deck is
     the player's standing choice and the infirmary is a fact about today, so a
     card healing is left in the deck and taken out of the battle. And what is
     missing is made up with CONSCRIPTS — the bottom of the ladder, no id, and
     therefore nothing a battle can wound or the infirmary ever sees. A battle
     the player cannot start because their cards are in bandages is a game that
     stops; a battle they start badly equipped is a game that costs them. */
  var CONSCRIPT = SPEC.conscript || { r: 4, t: 0 };

  function roundDeck() {
    var out = [], i, c;
    for (i = 0; i < save.d.length; i++) {
      c = byId(save.d[i]);
      if (c && fit(c)) out.push({ r: c.g, t: c.t, id: c.i, o: c.o || null });
    }
    while (out.length < DECK_SIZE) out.push({ r: CONSCRIPT.r, t: CONSCRIPT.t, id: null });
    return out;
  }
  /* `beds` and `cells` are the rooms left: the round refuses a wound or a
     prisoner past them rather than promising a bed that is not there. */
  function syncDeck() {
    CONFIG.army = { deck: roundDeck(), size: DECK_SIZE,
                    beds: Math.max(0, BEDS - inInfirmary()),
                    cells: Math.max(0, CELLS - inPrison()) };
  }

  /* ── 5. what a battle did ─────────────────────────────────────────────── */

  /* The result filter runs inside the motor's endRound, beside the level
     layer's and the meta layer's, and this one only READS: the wounds are
     written the moment they are known, and the prisoners are kept for a screen
     to offer them on. */
  var offer = null;                     // captives waiting to be offered

  function absorb(result) {
    var a = result && result.army;
    if (!a) return;
    var i, c, n = 0;
    for (i = 0; i < (a.hurt || []).length; i++) {
      c = byId(a.hurt[i]);
      if (!c) continue;
      /* THE WAIT STARTS WHEN THE BATTLE ENDS, not when the wound landed: a
         card hurt on the first turn of a long round would otherwise come back
         sooner than one hurt on the last, which is a rule about the length of
         a battle and not about the wound. The round already kept to the
         beds it was told of; this is the fence behind it. */
      if (inInfirmary() < BEDS) c.w = now() + HEAL_MS;
      else retire(c);
      n++;
    }
    /* A WOUND THE INFIRMARY HAD NO BED FOR. The round said so when it
       happened; here the card leaves the roster, and the deck with it. */
    for (i = 0; i < (a.dead || []).length; i++) {
      c = byId(a.dead[i]);
      if (c) { retire(c); n++; }
    }
    /* EVERY CARD THE BATTLE TURNED OVER goes into the collection, won or
       lost: an officer of the camp by the best tier met, an object once. */
    for (i = 0; i < (a.met || []).length; i++) {
      c = a.met[i];
      if (GRADE[c.r]) meet(save, c.r, c.t);
      else if (OBJECT[c.r] && !save.c.o[c.r]) save.c.o[c.r] = 1;
      n++;
    }
    offer = (a.won && a.captives && a.captives.length) ? a.captives.slice(0, PICK) : null;
    if (n) persist();
  }

  function retire(c) {
    save.r.splice(save.r.indexOf(c), 1);
    var at = save.d.indexOf(c.i);
    if (at >= 0) save.d.splice(at, 1);
  }

  /* ── 6. the prisoner, offered once ────────────────────────────────────── */

  /* WHERE IT OPENS, AND WHY IT IS TWO PLACES. The choice belongs to the battle
     that won it, so the end screen is where it is offered — but the end screen
     is a busy place: the motor is still revealing it, the meta layer is
     counting coins into a wallet on it, and a round that earned a star is
     being offered an ad. So the card waits for the install CTA to land and for
     the layer to be empty, and if the player has walked off by then it is
     offered on the next arrival at the hub instead. One function, two doors,
     and the offer is never silently dropped. */
  var watching = null;

  /* The row's room: the card's content width (view.css, .mt-card — 668 less
     two 34 px paddings), the gap between two tiles and the "or" between a
     lone prisoner and the spoils (army.css, .ar-pick). */
  var PICK_ROOM = 600, PICK_GAP = 22, PICK_OR = 44, PICK_MAX = 240;

  function armOffer() {
    if (!offer) return;
    if (watching) clearInterval(watching);
    var tries = 0;
    watching = setInterval(function () {
      var cta = document.getElementById("btn-install");
      if (++tries > 200 || W.state() !== "end") { clearInterval(watching); watching = null; return; }
      if (!cta || !cta.classList.contains("show")) return;
      if (MD.count()) return;           // a gift is being handed over: wait it out
      clearInterval(watching); watching = null;
      openOffer();
    }, 150);
  }

  /* THE CHOICE IS ALWAYS A CHOICE. Two prisoners or more is a pick between
     them; ONE prisoner is a pick between that card and the SPOILS — coins,
     a ticket or a sticker, dealt out of the meta layer's own rewards — since
     a single card with a line under it is a yes-or-no and not a decision.
     The coins are sized on the prisoner (grade and tier), so turning down a
     marshal is worth more than turning down a sergeant. */
  function spoilsFor(c) {
    if (!MT || !MT.active || !MT.active()) return null;
    var r = Math.random();
    if (r < 0.45) return MT.reward("coins", Math.round((80 + c.r * 18 + c.t * 25) / 10) * 10);
    if (r < 0.8) return MT.reward("ticket", 1);
    return MT.reward("sticker", MT.roll());
  }

  function openOffer() {
    if (!offer || !offer.length) { offer = null; return; }
    if (inPrison() >= CELLS) {
      offer = null;
      say(T.prisonFull, fill(T.prisonFullSub, { n: CELLS }), "warn", "lock");
      return;
    }
    var list = offer.slice(0);
    offer = null;
    var spoils = list.length === 1 ? spoilsFor(list[0]) : null;
    var taken = false;
    /* THE TILES TAKE THE CARD'S WIDTH. A prisoner is a card the player is
       asked to read — its grade, its tier, its face — and 118 px of it in the
       middle of a 600 px card was a thumbnail of the choice. So the width is
       what the row has divided by what stands in it, capped where a card
       would push the card off a phone's height. */
    var tiles = list.length + (spoils ? 1 : 0);
    var tileW = Math.min(PICK_MAX, Math.floor(
      (PICK_ROOM - PICK_GAP * (tiles - 1) - (spoils ? PICK_OR : 0)) / tiles));
    /* NEITHER DISMISSED NOR ESCAPED. Two or three tiles is a CHOICE, and a
       choice has no default — the same rule the three gift boxes are opened
       under (packages/webshell/meta.js). The way past it is the line under
       them.

       `close` is the one `fill` is handed, and NOT the handle `MD.open`
       returns: fill runs INSIDE open, before that handle exists, so a tile
       built with it held `undefined` — the prisoner was written, the close
       threw, and the card stayed on screen taking a prisoner per tap. */
    MD.open({
      kind: "captive", dismiss: false, esc: false,
      fill: function (card, close) {
        card.appendChild(el("h3", "mt-h", T.captiveTitle));
        card.appendChild(el("p", "mt-sub", spoils ? T.captiveSubOr : T.captiveSub));
        var row = el("div", "ar-pick" + (PAINTED ? " painted" : ""));
        row.style.setProperty("--pw", tileW + "px");
        row.style.setProperty("--pw-n", (tileW * 0.78 / 190).toFixed(3));   // the reward's 190 px disc
        for (var i = 0; i < list.length; i++) row.appendChild(pickTile(list[i], close));
        if (spoils) {
          row.appendChild(el("div", "ar-pick-or", T.or));
          row.appendChild(spoilsTile(spoils, close));
        }
        card.appendChild(row);
        var skip = el("button", "ar-skip", T.captiveSkip);
        skip.addEventListener("click", function () { if (!taken) { taken = true; close(); } });
        card.appendChild(skip);
      }
    });
    W.Sound.cue("uiStar", 0.8, 1.2, 880, 0.18, "triangle");

    function pickTile(c, close) {
      var b = el("button", "ar-pick-t");
      b.appendChild(cardTile({ g: c.r, t: c.t }, { foe: true, fmt: "full", w: tileW }));
      var f = el("div", "ar-pick-when", untilText(FREE_MS));
      b.appendChild(f);
      b.addEventListener("click", function () {
        if (taken) return;
        taken = true;
        save.p.push({ g: c.r, t: c.t, u: now() + FREE_MS });
        meet(save, c.r, c.t);
        persist();
        close();
        say(T.captiveTaken, whoName("red", c.r, c.t), "info", "lock");
        W.Sound.cue("uiWin", 0.8, 1, 660, 0.2, "triangle");
      });
      return b;
    }

    /* The spoils: granted on the tap and flown into the chip that counts
       them, like every reward of the meta layer (`Meta.fx`). */
    function spoilsTile(rw, close) {
      var b = el("button", "ar-pick-t ar-spoils");
      b.appendChild(el("div", "ar-spoils-art " + rw.kind, MT.rewardArt(rw)));
      b.appendChild(el("div", "ar-pick-when", MT.rewardLabel(rw)));
      b.addEventListener("click", function () {
        if (taken) return;
        taken = true;
        var from = b.getBoundingClientRect();
        var before = rw.kind === "coins" ? MT.coins() : rw.kind === "ticket" ? MT.tickets() : 0;
        MT.grant(rw);
        close();
        MT.fx({ rw: rw, from: from, before: before, tag: rw.kind !== "sticker" });
        W.Sound.cue("uiWin", 0.8, 1, 660, 0.2, "triangle");
      });
      return b;
    }
  }

  /* ── 7. one card, drawn ───────────────────────────────────────────────── */

  /* THE ONE TILE EVERY SCREEN OF THIS LAYER USES. A card is a grade and a
     tier, and both of them are read at a glance or neither is: the tier owns
     the EDGE and the corner plate, the grade owns the face and the number.
     Same ladder and the same six colours as the round draws
     (games/stratideck/game.js), because a card the player picked in the deck
     screen and the card that lands on the grid have to be the same object. */
  /* THE GAME'S OWN CARD, WHERE IT DRAWS ONE. A game may publish its card
     builder as `Game.cardNode(card, { fmt, w, side })` — games/stratideck
     does, the painted card composed in lab/stratideck-card.html — and every
     screen here then shows that card instead of the plain tile, at the size
     and in the format the screen asks for (`opt.fmt` / `opt.w`: the lab's
     "full" 5:7 card, "mid" or "tiny" square, `w` in design px). The tile below
     stays the fallback, and the wrapper keeps its `ar-card` class so the dim,
     the tag and the tap feedback are the same statement on both. */
  var PAINTED = !!(W.Game && W.Game.cardNode);

  /* `c.t` null is an OBJECT (no tier), `opt.obj` says so to the plain tile,
     and `opt.ghost` is a card never had: a silhouette named ???. */
  function cardTile(c, opt) {
    opt = opt || {};
    if (PAINTED) {
      var p = el("div", "ar-card painted" + (opt.dim ? " dim" : ""));
      p.appendChild(W.Game.cardNode({ rank: c.g, tier: c.t, o: c.o || null },
        { fmt: opt.fmt || "full", w: opt.w || 120, ghost: !!opt.ghost,
          side: opt.obj ? "none" : opt.foe ? "red" : "blue" }));
      if (opt.tag) p.appendChild(el("div", "ar-tag" + (opt.tagClass ? " " + opt.tagClass : ""), opt.tag));
      return p;
    }
    var tiered = c.t != null && !opt.ghost;
    var n = el("div", "ar-card " + (tiered ? "t" + c.t : "obj") + (opt.foe ? " foe" : "") +
                      (opt.dim ? " dim" : "") + (opt.ghost ? " ghost" : ""));
    var o = opt.obj ? OBJECT[c.g] : null;
    var art = o ? (o.art && CONFIG.art && CONFIG.art[o.art]) || null
                : gradeArt(c.g, opt.foe || c.o === "red", opt.ghost ? null : c.t, !opt.foe && c.o === "red");
    var face = el("div", "ar-face");
    if (art) {
      var img = el("img"); img.src = art; img.alt = ""; img.draggable = false;
      face.appendChild(img);
    } else {
      face.appendChild(el("span", "ar-num", o ? "?" : String(c.g)));
    }
    n.appendChild(face);
    if (c.t != null) n.appendChild(el("i", "ar-tier", TIERS[c.t]));
    if (art && !o) n.appendChild(el("i", "ar-grade", String(c.g)));
    n.appendChild(el("div", "ar-name", opt.ghost ? "???" : W.upper(W.Lang.t(gradeName(c.g)))));
    if (opt.tag) n.appendChild(el("div", "ar-tag" + (opt.tagClass ? " " + opt.tagClass : ""), opt.tag));
    return n;
  }

  /* ── 8. the screens ───────────────────────────────────────────────────── */

  /* THE SAME FRAME FOR ALL FOUR, and only the body differs. Each one is a
     backdrop, a header that clears the wallet band, and a scrolling body — the
     album's shape, for the same reason: they are rooms of the same place. */
  function screen(id, key) {
    var box = el("div", "ar-screen"); box.id = id;
    var bg = el("div", "ar-bg");
    dressBackdrop(bg);
    box.appendChild(bg);

    var head = el("div", "ar-head");
    head.appendChild(el("h2", "ar-title", ""));
    head.appendChild(el("p", "ar-sub", ""));
    if (DEV) head.appendChild(el("i", "ar-dev", "DEV"));
    /* THE WAY HOME, WHERE THE BAND IS NOT THERE TO BE IT. A game with a wallet
       carries the band and its house chip, and a header that added a second
       button would be two ways to one place (packages/webshell/view.js). */
    if (!VW.banded()) head.appendChild(VW.homeButton(""));
    box.appendChild(head);

    var body = el("div", "ar-body");
    box.appendChild(body);
    frame().appendChild(box);
    return { box: box, head: head, body: body, key: key };
  }

  /* The hub's own ground: these four are rooms of the village, like the album
     and the shop, so they stand on the picture the player just walked off.
     Read lazily — village.js is the last file of the web layer. */
  function dressBackdrop(bg) {
    var VG = window.__VILLAGE__;
    var hub = VG && VG.ground ? VG.ground() : null;
    if (hub) { bg.style.backgroundImage = "url(" + hub + ")"; return; }
    var art = W.Art ? W.Art.src(W.Art.sceneKey()) : null;
    if (art) { bg.style.backgroundImage = "url(" + art + ")"; return; }
    bg.className = "ar-bg flat";
  }

  function head(S, title, sub) {
    S.head.querySelector(".ar-title").textContent = W.upper(title);
    S.head.querySelector(".ar-sub").textContent = sub;
  }

  /* ── 8a. the deck ─────────────────────────────────────────────────────── */

  var DK = null;

  /* TWO GRIDS OF THE SAME TILE, AND THEY HAVE TO SAY WHICH IS WHICH. The cards
     taken into the battle and the cards owned are drawn identically — they are
     the same objects — so without a line over each the screen reads as one long
     roster where some tiles happen to be dimmer. The count rides on the
     heading rather than under it, because "14 / 14" is the whole answer to what
     that half of the screen is for. */
  /* THREE TABS ON ONE SCREEN, and not three houses: the collection and the
     objects are the same cards read another way — every card of the war
     rather than the ones owned — and a door for each would be a hub of
     reference books. The deck tab is where the screen always opens, because
     it is the one with something to do on it. */
  var TABS = ["deck", "coll", "obj"];

  function buildDeck() {
    DK = screen("ar-deck", "deck");
    DK.tab = "deck";
    DK.tabs = el("div", "ar-tabs");
    DK.tabBtn = {};
    for (var i = 0; i < TABS.length; i++) DK.tabs.appendChild(tabButton(TABS[i]));
    DK.body.appendChild(DK.tabs);

    var d = DK.pane = {};
    d.deck = el("div", "ar-pane");
    DK.deckHead = el("h3", "ar-sec");
    d.deck.appendChild(DK.deckHead);
    DK.slots = el("div", "ar-slots" + (PAINTED ? " painted" : ""));
    d.deck.appendChild(DK.slots);
    DK.bar = el("div", "ar-note");
    d.deck.appendChild(DK.bar);
    DK.poolHead = el("h3", "ar-sec");
    d.deck.appendChild(DK.poolHead);
    DK.pool = el("div", "ar-pool" + (PAINTED ? " painted" : ""));
    d.deck.appendChild(DK.pool);

    d.coll = el("div", "ar-pane");
    DK.blueHead = el("h3", "ar-sec");
    d.coll.appendChild(DK.blueHead);
    DK.blue = el("div", "ar-cast" + (PAINTED ? " painted" : ""));
    d.coll.appendChild(DK.blue);
    DK.redHead = el("h3", "ar-sec");
    d.coll.appendChild(DK.redHead);
    DK.red = el("div", "ar-cast" + (PAINTED ? " painted" : ""));
    d.coll.appendChild(DK.red);

    d.obj = el("div", "ar-pane");
    DK.objHead = el("h3", "ar-sec");
    d.obj.appendChild(DK.objHead);
    DK.objs = el("div", "ar-pool ar-book" + (PAINTED ? " painted" : ""));
    d.obj.appendChild(DK.objs);

    for (i = 0; i < TABS.length; i++) DK.body.appendChild(d[TABS[i]]);
  }

  function tabButton(key) {
    var b = el("button", "ar-tab");
    b.addEventListener("click", function () {
      if (DK.tab === key) return;
      DK.tab = key;
      DK.body.scrollTop = 0;
      paintDeck();
      W.Sound.cue("uiRow", 0.45, 1, 380, 0.08);
    });
    DK.tabBtn[key] = b;
    return b;
  }

  function paintDeck() {
    for (var i = 0; i < TABS.length; i++) {
      var k = TABS[i], on = DK.tab === k;
      DK.tabBtn[k].textContent = W.upper(T["tab_" + k]);
      DK.tabBtn[k].classList.toggle("on", on);
      DK.tabBtn[k].setAttribute("aria-pressed", on ? "true" : "false");
      DK.pane[k].style.display = on ? "" : "none";
    }
    if (DK.tab === "coll") paintCollection();
    else if (DK.tab === "obj") paintObjects();
    else paintRoster();
  }

  function paintRoster() {
    var i, c;
    head(DK, T.deckTitle, T.deckSub);
    DK.deckHead.innerHTML = W.upper(T.deckSection) +
      ' <b>' + save.d.length + " / " + DECK_SIZE + '</b>';
    DK.poolHead.innerHTML = W.upper(T.poolSection) +
      ' <b>' + save.r.length + '</b>';
    DK.slots.innerHTML = "";
    for (i = 0; i < DECK_SIZE; i++) {
      c = i < save.d.length ? byId(save.d[i]) : null;
      DK.slots.appendChild(c ? deckSlot(c) : emptySlot());
    }
    /* WHAT AN EMPTY SLOT MEANS, said once and where it is true. A deck that is
       short is not a battle that cannot start — it is a battle with a
       conscript in it — and a player who is not told that reads the empty
       boxes as a wall. */
    /* TWO STRINGS AND NOT ONE WITH A `(s)` IN IT. This shell has no plural
       machinery and does not need one for a single sentence — what it must not
       do is write "2 vide(s)", which is a line nobody would write by hand and
       the one place on this screen the player is being told something. */
    var gap = deckShort();
    DK.bar.textContent = gap
      ? fill(gap === 1 ? T.deckGap1 : T.deckGapN,
             { n: gap, c: W.Lang.t(gradeName(CONSCRIPT.r)) })
      : T.deckFull;
    DK.bar.className = "ar-note" + (gap ? " warn" : "");

    DK.pool.innerHTML = "";
    var pool = save.r.slice().sort(cmpCard);
    for (i = 0; i < pool.length; i++) DK.pool.appendChild(poolTile(pool[i]));
  }

  /* ── 8a'. the collection and the objects ─────────────────────────────── */

  /* THE WHOLE CAST, the player's army first: one line per grade, best
     first, and the six tiers along it — so a column is a rarity and a row is
     a rank, and the gap in either reads without a legend. Blue is the
     officers ever OWNED (the roster and the tent); red is the officers ever
     MET, in a battle or in the prison, since the camp is only ever faced. An
     officer never had is its shadow, which is what an unowned sticker is in
     the album and for the same reason: the shape of what is missing is the
     reason to go and get it. A face the player has had turns over (`openFile`);
     a shadow says how it is earned instead. */
  var BOOK_W = 88;

  function paintCollection() {
    head(DK, T.collTitle, T.collSub);
    var all = GRADES.length * TIERS.length;
    var nb = castBook(DK.blue, "blue", save.c.h), nr = castBook(DK.red, "red", save.c.m, save.c.h);
    DK.blueHead.innerHTML = W.upper(T.collBlue) + ' <b>' + nb + " / " + all + '</b>';
    DK.redHead.innerHTML = W.upper(T.collRed) + ' <b>' + nr + " / " + all + '</b>';
  }

  function castBook(box, side, book, also) {
    var known = 0, i, g, t, k, had, line, row;
    box.innerHTML = "";
    var list = GRADES.slice().sort(function (a, b) { return b.r - a.r; });
    for (i = 0; i < list.length; i++) {
      g = list[i].r;
      line = el("div", "ar-crow");
      line.appendChild(el("div", "ar-crow-h", W.upper(W.Lang.t(gradeName(g)))));
      row = el("div", "ar-crow-g");
      for (t = 0; t <= TOP; t++) {
        k = ck(side, g, t);
        had = !!(book[k] || (also && also[k]));
        if (had) known++;
        row.appendChild(castTile(side, g, t, had));
      }
      line.appendChild(row);
      box.appendChild(line);
    }
    return known;
  }

  function castTile(side, g, t, had) {
    var b = el("button", "ar-slot book cast" + (had ? "" : " none"));
    b.appendChild(cardTile({ g: g, t: t }, { foe: side === "red", ghost: !had, fmt: "tiny", w: BOOK_W }));
    b.setAttribute("aria-label", had ? whoName(side, g, t) : "???");
    b.addEventListener("click", function () {
      if (had) { openFile({ o: side, g: g, t: t }, side, b); return; }
      say(side === "red" ? T.ghostRed : T.ghostBlue, W.Lang.t(gradeName(g)) + " · " + tierName(t), "info", "lock");
    });
    return b;
  }

  /* THE OBJECTS: seen in a battle or not. An object has no tier and belongs
     to neither army, so it wears neither crest. */
  function paintObjects() {
    head(DK, T.objTitle, T.objSub);
    var seen = 0, i, o;
    DK.objs.innerHTML = "";
    for (i = 0; i < OBJECTS.length; i++) {
      o = OBJECTS[i];
      if (save.c.o[o.r]) seen++;
      DK.objs.appendChild(objectTile(o.r, !!save.c.o[o.r]));
    }
    DK.objHead.innerHTML = W.upper(T.objSection) + ' <b>' + seen + " / " + OBJECTS.length + '</b>';
  }

  /* An object seen turns over to its rule (`openFile`); a shadow says how
     it is earned, like an officer never had. */
  function objectTile(r, had) {
    var b = el("button", "ar-slot book" + (had ? "" : " none"));
    var tile = cardTile({ g: r, t: null }, { obj: true, ghost: !had, fmt: "full", w: 156 });
    b.appendChild(tile);
    b.setAttribute("aria-label", had ? W.Lang.t(gradeName(r)) : "???");
    b.addEventListener("click", function () {
      if (had) { openFile({ g: r, obj: true }, "none", tile); return; }
      say(T.objGhost, "", "info", "lock");
    });
    return b;
  }

  function deckSlot(c) {
    var b = el("button", "ar-slot");
    var hurt = !fit(c);
    b.appendChild(cardTile({ g: c.g, t: c.t, o: c.o }, {
      dim: hurt, tag: hurt ? untilText(c.w - now()) : null, tagClass: "hurt",
      fmt: "tiny", w: 86
    }));
    b.setAttribute("aria-label", T.deckDrop);
    b.addEventListener("click", function () {
      var at = save.d.indexOf(c.i);
      if (at >= 0) { save.d.splice(at, 1); persist(); }
    });
    return b;
  }

  function emptySlot() {
    var n = el("div", "ar-slot empty");
    n.appendChild(el("span", "ar-plus", "+"));
    return n;
  }

  /* THE CARD IS A TOGGLE AND THE CORNER IS A DOOR. A tap on a card of the
     roster has always meant "take it" or "leave it", and a screen built to
     compose a deck must not start doing something else under that tap — so
     reading who a card is gets a control of its own, hung on its corner, and
     the two can never be mistaken for each other. Siblings and not nested:
     a button inside a button is two taps the browser merges into one. */
  function poolTile(c) {
    var w = el("div", "ar-slot-w");
    var b = el("button", "ar-slot pool");
    var on = inDeck(c.i), hurt = !fit(c);
    if (on) b.className += " on";
    b.appendChild(cardTile({ g: c.g, t: c.t, o: c.o }, {
      dim: hurt, tag: hurt ? untilText(c.w - now()) : (on ? T.inDeck : null),
      tagClass: hurt ? "hurt" : "in", fmt: "full", w: 156
    }));
    b.addEventListener("click", function () {
      var at = save.d.indexOf(c.i);
      if (at >= 0) { save.d.splice(at, 1); persist(); return; }
      if (save.d.length >= DECK_SIZE) { say(T.deckFullWarn, "", "warn"); return; }
      save.d.push(c.i);
      persist();
    });
    w.appendChild(b);
    var f = el("button", "ar-file-btn", icon("file", "ar-ci"));
    f.setAttribute("aria-label", T.fileOpen);
    f.addEventListener("click", function () { openFile({ o: c.o || "blue", g: c.g, t: c.t }, "blue", b); });
    w.appendChild(f);
    return w;
  }

  /* A SMALL CARD IS A DOOR TO WHO IT IS. Where a card of a list does nothing
     else under a tap — a bed, a cell — the tap opens the officer's file, at
     full size. The roster's cards keep their own tap (take it, leave it) and
     wear the corner button instead (`poolTile`). */
  function fileDoor(tile, who, team) {
    var b = el("button", "ar-row-card");
    b.setAttribute("aria-label", T.fileOpen);
    b.appendChild(tile);
    b.addEventListener("click", function () { openFile(who, team, tile); });
    return b;
  }

  /* ── 8b. the infirmary ────────────────────────────────────────────────── */

  var IN = null;

  function buildInfirmary() {
    IN = screen("ar-inf", "infirmary");
    IN.list = el("div", "ar-list");
    IN.body.appendChild(IN.list);
    IN.acts = el("div", "ar-acts");
    IN.body.appendChild(IN.acts);
  }

  function paintInfirmary() {
    var list = hurtList(), i;
    head(IN, T.infTitle, fill(T.infSub, { n: list.length, m: BEDS }));
    IN.list.innerHTML = "";
    IN.acts.innerHTML = "";
    /* EVERY BED IS DRAWN, taken or not: the ceiling is the rule, and a
       rule that only shows once it bites is a card lost by surprise. */
    for (i = 0; i < Math.max(BEDS, list.length); i++) {
      IN.list.appendChild(i < list.length ? bedRow(list[i]) : freeRow(T.infFree));
    }
    if (!list.length) {
      IN.acts.appendChild(el("p", "ar-none", T.infNone));
      return;
    }
    /* ONE BUTTON FOR ALL OF THEM, and it is the only one worth the ad: an ad
       per bandage is four ads for one battle's worth of wounds, which is a
       price nobody pays twice. */
    IN.acts.appendChild(adButton(T.infHealAll, function () {
      for (var j = 0; j < save.r.length; j++) save.r[j].w = 0;
      persist();
      say(T.infHealed, "", "good", "heart");
    }));
  }

  function bedRow(c) {
    var row = el("div", "ar-row");
    row.appendChild(fileDoor(cardTile({ g: c.g, t: c.t, o: c.o }, { dim: true, fmt: "tiny", w: 76 }),
      { o: c.o || "blue", g: c.g, t: c.t }, "blue"));
    var mid = el("div", "ar-mid");
    mid.appendChild(el("div", "ar-rowname", W.upper(whoName(c.o || "blue", c.g, c.t))));
    mid.appendChild(el("div", "ar-rowsub", W.upper(W.Lang.t(gradeName(c.g))) + " · " + tierName(c.t)));
    var when = el("div", "ar-when", icon("clock", "ar-ci") + "<span>" + untilText(c.w - now()) + "</span>");
    mid.appendChild(when);
    row.appendChild(mid);
    var b = adButton(T.healOne, function () { c.w = 0; persist(); }, "small");
    row.appendChild(b);
    return row;
  }

  /* ── 8c. the prison ───────────────────────────────────────────────────── */

  var PR = null;

  function buildPrison() {
    PR = screen("ar-prison", "prison");
    PR.list = el("div", "ar-list");
    PR.body.appendChild(PR.list);
  }

  function paintPrison() {
    var i;
    save.p.sort(function (a, b) { return a.u - b.u; });
    head(PR, T.prisonTitle, fill(T.prisonSub, { n: save.p.length, m: CELLS }));
    PR.list.innerHTML = "";
    for (i = 0; i < Math.max(CELLS, save.p.length); i++) {
      PR.list.appendChild(i < save.p.length ? cellRow(save.p[i], i) : freeRow(T.prisonFree));
    }
    if (!save.p.length) PR.list.appendChild(el("p", "ar-none", T.prisonNone));
  }

  /* A bed or a cell nobody is in: the tile's footprint, dashed, and the
     word. */
  function freeRow(word) {
    var row = el("div", "ar-row free");
    row.appendChild(el("div", "ar-free-slot"));
    row.appendChild(el("div", "ar-rowsub", W.upper(word)));
    return row;
  }

  function cellRow(p, idx) {
    var free = p.u <= now();
    var row = el("div", "ar-row" + (free ? " ready" : ""));
    /* A prisoner who has turned is drawn as the card they are about to be:
       the player's army, in the uniform they were caught in. */
    row.appendChild(fileDoor(cardTile({ g: p.g, t: p.t, o: free ? "red" : null }, { foe: !free, dim: !free, fmt: "tiny", w: 76 }),
      { o: "red", g: p.g, t: p.t }, free ? "blue" : "red"));
    var mid = el("div", "ar-mid");
    mid.appendChild(el("div", "ar-rowname", W.upper(whoName("red", p.g, p.t))));
    mid.appendChild(el("div", "ar-rowsub", W.upper(W.Lang.t(gradeName(p.g))) + " · " + tierName(p.t)));
    if (free) {
      mid.appendChild(el("div", "ar-when ok", icon("check", "ar-ci") + "<span>" + T.turned + "</span>"));
    } else {
      mid.appendChild(el("div", "ar-when", icon("lock", "ar-ci") + "<span>" + untilText(p.u - now()) + "</span>"));
    }
    row.appendChild(mid);
    if (free) {
      /* THE ONE MOMENT A PRISONER BECOMES A CARD. It is a tap and not an
         automatic transfer, because a roster that grows while the player is
         somewhere else is a roster they never saw arrive. */
      var b = el("button", "ar-btn gold", icon("check", "ar-ci") + "<span>" + T.enlist + "</span>");
      b.addEventListener("click", function () {
        enrol(save, p.g, p.t, "red");
        save.p.splice(save.p.indexOf(p), 1);
        persist();
        say(fill(T.enlisted, { c: whoName("red", p.g, p.t) }), T.turncoat, "gain", "user");
        W.Sound.cue("uiWin", 0.8, 1, 720, 0.2, "triangle");
      });
      row.appendChild(b);
    } else {
      row.appendChild(adButton(T.freeNow, function () { p.u = 0; persist(); }, "small"));
    }
    return row;
  }

  /* ── 8d. the recruiting tent ──────────────────────────────────────────── */

  var RT = null;

  function buildRecruit() {
    RT = screen("ar-recruit", "recruit");
    RT.list = el("div", "ar-offers");
    RT.body.appendChild(RT.list);
    RT.acts = el("div", "ar-acts");
    RT.body.appendChild(RT.acts);
  }

  /* WHAT THE TENT IS OFFERING, AND IT IS ROLLED ON A CLOCK RATHER THAN ON
     ARRIVAL. A shelf that re-rolls every time the player walks in is a shelf
     they re-roll instead of buying from, and the price stops meaning anything.
     The ladder it rolls on leans low: an S on the shelf is an event. */
  function shelf() {
    var k = save.k;
    if (k && now() - k.t < TENT_MS) return k;
    return roll();
  }

  /* WRITTEN, NOT PERSISTED THROUGH `persist`. A shelf whose clock ran out is
     rolled by the screen that is drawing it, and `persist` repaints — which
     would be a paint calling itself. The save still has to be written, or the
     shelf re-rolls on the next open and the clock means nothing. */
  function roll() {
    var o = [], i;
    for (i = 0; i < R_SLOTS; i++) o.push(rollOne());
    save.k = { t: now(), o: o, b: [] };
    MT.setArmy(save);
    return save.k;
  }

  function rollOne() {
    var w = [30, 26, 18, 10, 4, 1.2], total = 0, i, x, t = 0;
    for (i = 0; i <= TOP; i++) total += w[i] || 0;
    x = Math.random() * total;
    for (i = 0; i <= TOP; i++) { x -= w[i] || 0; if (x <= 0) { t = i; break; } }
    /* The grade is flat over what the game lets a player own, minus the three
       specials, which the tent never sells: a spy, a scout and a sapper are
       ANSWERS to something, and a tent that sold them would be selling the
       solution rather than the army. */
    var pool = [];
    for (i = 0; i < GRADES.length; i++) if (GRADES[i].r >= 4) pool.push(GRADES[i].r);
    if (!pool.length) pool = [4];
    return { g: pool[Math.floor(Math.random() * pool.length)], t: t };
  }

  function paintRecruit() {
    var k = shelf(), i;
    head(RT, T.recruitTitle, fill(T.recruitSub, { t: untilText(k.t + TENT_MS - now()) }));
    RT.list.innerHTML = "";
    RT.acts.innerHTML = "";
    for (i = 0; i < k.o.length; i++) RT.list.appendChild(offerTile(k.o[i], i, k));
    RT.acts.appendChild(adButton(T.reroll, function () { roll(); persist(); }));
  }

  function offerTile(o, idx, k) {
    var sold = k.b.indexOf(idx) >= 0, price = priceOf(o.g, o.t);
    var n = el("div", "ar-offer" + (sold ? " sold" : ""));
    n.appendChild(cardTile({ g: o.g, t: o.t }, { dim: sold, fmt: "full", w: 186 }));
    if (sold) {
      n.appendChild(el("div", "ar-sold", T.sold));
      return n;
    }
    var can = MT.coins() >= price;
    var b = el("button", "ar-btn" + (can ? " gold" : " off"),
               icon("coin", "ar-ci") + "<span>" + MT.num(price) + "</span>");
    b.addEventListener("click", function () {
      if (!MT.spend(price)) { say(T.tooPoor, "", "warn", "coin"); return; }
      MT.spendFx(MT.coins() + price, MT.coins());
      k.b.push(idx);
      var got = enrol(save, o.g, o.t);
      /* STRAIGHT INTO THE DECK IF THERE IS ROOM. A card bought and then not
         taken to the next battle because a second screen had to be visited is
         a purchase the player does not feel. */
      if (save.d.length < DECK_SIZE) save.d.push(got.i);
      persist();
      say(fill(T.recruited, { c: whoName("blue", o.g, o.t) }), W.Lang.t(gradeName(o.g)) + " · " + tierName(o.t), "gain", "user");
      W.Sound.cue("uiWin", 0.8, 1, 780, 0.2, "triangle");
    });
    n.appendChild(b);
    return n;
  }

  /* HOW MANY OF THE SHELF THE WALLET COULD ACTUALLY PAY FOR — the tent's badge.
     Not "there are three cards for sale", which is true every day of the week
     and therefore says nothing. */
  function affordable() {
    var k = save.k, n = 0, i;
    if (!k || now() - k.t >= TENT_MS) return R_SLOTS;   // a fresh shelf is news on its own
    for (i = 0; i < k.o.length; i++) {
      if (k.b.indexOf(i) < 0 && MT.coins() >= priceOf(k.o[i].g, k.o[i].t)) n++;
    }
    return n;
  }

  /* ── 8e. an officer's file: the card, turned over ─────────────────────── */

  /* WHO A CARD IS, printed on its back. A card — not a view: it is read over
     the deck or the collection and put away, and nothing on it is a choice.
     It opens on the FACE, at the size of a card the player is looking AT
     rather than choosing between — the width of the frame, near enough.

     IT FLIES OUT OF THE CARD THAT WAS TAPPED. `from` is that small card (a
     node, or its client rect): the big one starts on top of it, at its size,
     and grows into the middle of the frame while it turns over and back —
     one whole turn, so the back is seen for a glance on the way and the card
     lands face up. That turn is the whole hint that there is a back at all,
     and it costs no time of its own because it happens during the opening.
     Silent: a card opened is not an event, and a sound on every file read in
     a collection of 120 is a sound the player learns to hate. Only a turn
     the player asks for makes one.

     It always turns THE SAME WAY. The angle only ever grows by half a turn,
     so a tap after the opening carries on in the direction it was going. A
     tap turns it, and a tap anywhere around it puts it away (the flipper is
     a button, which the modal's own dismiss steps over).

     `who` is the officer — the army they were raised in, their grade, their
     tier — and `team` the army they fight for, which differs only for a
     prisoner who enlisted: the front then wears the cloth of the army, and
     the back says where they came from. */
  var FILE_W = 540, FILE_H = Math.round(FILE_W * 1.4);
  var FLY_MS = 560;

  /* TWO MORE CARDS OPEN THE SAME WAY. An OBJECT (`who.obj`, `who.g` its
     rank) turns over to what it does and which grade destroys it
     (`objectBack`). A card of the camp's muster (`who.blind`) is only
     enlarged: the muster counts grades and hides the tiers, and a file would
     name the officer and say both — so it has no back, does not turn, and a
     tap on it puts it away like a tap around it. */
  function openFile(who, team, from) {
    var p = who.obj || who.blind ? null : castOf(who.o, who.g, who.t);
    var back = who.blind ? null : who.obj ? objectBack(who.g) : fileBack(who, p, team);
    var turns = 0, timer = 0, flip = null, inner = null;
    function turn() {
      turns++;
      inner.style.transform = "rotateY(" + (turns * 180) + "deg)";
      flip.classList.toggle("on", turns % 2 === 1);
    }
    var m = MD.open({
      kind: "ar-filecard",
      onHide: function () { clearTimeout(timer); },
      fill: function (card) {
        /* a card with no back is no control: the modal's dismiss takes it */
        flip = el(back ? "button" : "div", "ar-flip fly");
        if (back) flip.setAttribute("aria-label", T.fileTurn);
        flip.style.width = FILE_W + "px";
        flip.style.height = FILE_H + "px";
        flip.style.visibility = "hidden";     // until it stands on the small card
        inner = el("div", "ar-flip-in");
        var front = el("div", "ar-flip-f");
        var face = who.obj
          ? cardTile({ g: who.g, t: null }, { obj: true, fmt: "full", w: FILE_W })
          : cardTile({ g: who.g, t: who.t, o: who.o !== team ? who.o : null },
                     { foe: team === "red", fmt: "full", w: FILE_W });
        if (who.blind) {
          var node = face.querySelector(".card");
          if (node) node.classList.add("no-tier");
        }
        front.appendChild(face);
        inner.appendChild(front);
        if (back) inner.appendChild(back);
        flip.appendChild(inner);
        if (back) {
          flip.addEventListener("click", function () {
            if (flip.classList.contains("fly")) return;   // let it land first
            turn();
            W.Sound.cue("uiRow", 0.45, turns % 2 ? 1.1 : 0.9, 420, 0.08);
          });
        }
        card.appendChild(flip);
        if (back) card.appendChild(el("p", "mt-sub ar-file-hint", T.fileHint));
      }
    });
    requestAnimationFrame(function () {
      if (!flip) return;
      fly(flip, from);
      if (back) { turns = 1; turn(); }      // one whole turn, during the flight
      timer = setTimeout(function () { flip.classList.remove("fly"); }, FLY_MS);
      /* A surname is one line at the size the back asks for, shrunk to fit
         where it is long — Onnaissance, Von Kaboom — once it is in the page
         and has a width to be measured against. */
      var last = m && m.box && m.box.querySelector(".ar-fb-last, .cf-last");
      if (last && W.Fit) W.Fit.box(last, 24);
    });
  }

  /* THE FLIGHT: the big card put back on the small one it came out of, then
     let go. The frame is scaled to the screen, so the offset is measured in
     client pixels and written in design ones (`k`). A card opened from
     nowhere in particular grows out of the middle instead. */
  function fly(flip, from) {
    var dst = flip.getBoundingClientRect();
    var src = from && from.getBoundingClientRect ? from.getBoundingClientRect() : from;
    var k = dst.width / FILE_W, s = 0.4, dx = 0, dy = 0;
    if (src && src.width && dst.width) {
      s = src.width / dst.width;
      dx = (src.left + src.width / 2 - (dst.left + dst.width / 2)) / k;
      dy = (src.top + src.height / 2 - (dst.top + dst.height / 2)) / k;
    }
    flip.style.transition = "none";
    flip.style.transform = "translate(" + dx.toFixed(1) + "px, " + dy.toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
    flip.style.visibility = "";
    void flip.offsetWidth;                  // the start is laid out before the move
    flip.style.transition = "";
    flip.style.transform = "";
  }

  /* THE BACK IS THE GAME'S, WHERE IT DRAWS ONE — the same rule as the face
     (`Game.cardNode`, section 7): games/stratideck publishes
     `Game.cardBack(card, { w, side }, file)`, the painted card turned over,
     and this layer hands it the words in the player's language. The plain
     back below stays the fallback. */
  function fileBack(who, p, team) {
    if (PAINTED && W.Game.cardBack) {
      var lore = p && p.lore || {};
      var wrap = el("div", "ar-flip-b painted");
      wrap.appendChild(W.Game.cardBack(
        { rank: who.g, tier: who.t, o: who.o !== team ? who.o : null },
        { w: FILE_W, side: team === "red" ? "red" : "blue" },
        {
          grade: W.upper(W.Lang.t(gradeName(who.g))),
          first: p ? W.upper(p.first) : "",
          last: p ? W.upper(p.last) : "???",
          facts: p ? [fill(T.age, { n: p.age }), T["g_" + p.gender] || p.gender] : [],
          lore: lore[LANG] || lore.en || "",
          army: W.upper(who.o === "red" ? T.armyRed : T.armyBlue),
          turn: who.o !== team ? W.upper(T.turncoat) : ""
        }));
      return wrap;
    }
    return plainBack(who, p, team);
  }

  /* THE BACK OF AN OBJECT: its name, what it does to whoever strikes it,
     and the one grade that destroys it — the rule, written on the card, so
     it is read before a card is lost to it. The words are the game's
     (`Game.objectInfo`, which knows the rule); the breaker is named here, in
     the shell's own grade names. No back where the game says nothing. */
  function objectBack(r) {
    var info = W.Game && W.Game.objectInfo ? W.Game.objectInfo(r) : null;
    if (!info) return null;
    var by = info.by ? fill(T.objBy, { g: W.Lang.t(gradeName(info.by)) }) : T.objByAny;
    if (PAINTED && W.Game.cardBack) {
      var wrap = el("div", "ar-flip-b painted");
      wrap.appendChild(W.Game.cardBack({ rank: r, tier: null }, { w: FILE_W, side: "none" }, {
        grade: W.upper(T.objKind),
        first: "",
        last: W.upper(W.Lang.t(gradeName(r))),
        facts: [by],
        lore: info.text,
        army: ""
      }));
      return wrap;
    }
    var b = el("div", "ar-flip-b ar-fb obj");
    var top = el("div", "ar-fb-top");
    top.appendChild(text("span", "ar-fb-grade", W.upper(T.objKind)));
    b.appendChild(top);
    b.appendChild(text("div", "ar-fb-last", W.upper(W.Lang.t(gradeName(r)))));
    var facts = el("div", "ar-fb-facts");
    facts.appendChild(text("span", "", by));
    b.appendChild(facts);
    b.appendChild(text("p", "ar-fb-lore", info.text));
    return b;
  }

  /* The plain back. Every line is text written into a node rather than
     markup — a name like O'Ween and a lore with quotes in it are data, not
     HTML. */
  function plainBack(who, p, team) {
    var b = el("div", "ar-flip-b ar-fb " + (who.o === "red" ? "red" : "blue") + " t" + clamp(who.t, 0, TOP));
    var top = el("div", "ar-fb-top");
    top.appendChild(text("span", "ar-fb-grade", W.upper(W.Lang.t(gradeName(who.g)))));
    top.appendChild(text("span", "ar-fb-tier", tierName(who.t)));
    b.appendChild(top);
    if (!p) {
      b.appendChild(text("div", "ar-fb-last", "???"));
      return b;
    }
    b.appendChild(text("div", "ar-fb-first", W.upper(p.first)));
    b.appendChild(text("div", "ar-fb-last", W.upper(p.last)));
    var facts = el("div", "ar-fb-facts");
    facts.appendChild(text("span", "", fill(T.age, { n: p.age })));
    facts.appendChild(text("span", "", T["g_" + p.gender] || p.gender));
    b.appendChild(facts);
    var lore = p.lore || {};
    b.appendChild(text("p", "ar-fb-lore", lore[LANG] || lore.en || ""));
    var foot = el("div", "ar-fb-foot");
    foot.appendChild(text("span", "", W.upper(who.o === "red" ? T.armyRed : T.armyBlue)));
    if (who.o !== team) foot.appendChild(text("span", "turn", W.upper(T.turncoat)));
    b.appendChild(foot);
    return b;
  }
  function text(tag, cls, str) {
    var n = el(tag, cls);
    n.textContent = str;
    return n;
  }

  /* ── 9. the ad, and the one line this layer says ──────────────────────── */

  /* EVERY WAIT CAN BE BOUGHT OUT, AND THE PRICE IS AN AD. It is the same
     placeholder the rest of this shell offers — a card with a countdown that
     says what it is (packages/webshell/meta.js, `ad`) — so wiring a network in
     is one function body for all of it. Without this a player whose three best
     cards are in bandages has nothing to do for two days, which is not a
     mechanic, it is a closed door. */
  function adButton(label, done, cls) {
    var b = el("button", "ar-btn ad" + (cls ? " " + cls : ""),
               icon("play", "ar-ci") + "<span>" + label + "</span>");
    b.addEventListener("click", function () {
      MT.ad(function (ok) { if (ok) done(); });
    });
    return b;
  }

  /* THE ONE LINE THIS LAYER SAYS, and it is the motor's Notify — the voice
     every game and every screen informs with: a purchase, a wait bought out, a
     deck that is already full. Not a card — a card is a screen asking for
     something, and none of these do. The strings are this file's own tables,
     already in the player's language. */
  function say(word, sub, kind, icon) {
    W.Notify.say(word, { sub: sub || "", kind: kind, icon: icon });
  }
  function fill(str, vals) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return vals[k] == null ? m : vals[k];
    });
  }

  /* ── 10. repaint, and the clock that drives it ────────────────────────── */

  /* A COUNTDOWN THAT ONLY MOVES WHEN SOMETHING ELSE HAPPENS IS A BROKEN CLOCK.
     One interval, and it runs only while one of these screens is on top —
     there is nothing to tick for on a map or in a round, and a timer left
     running behind a battle is a frame budget spent on a number nobody can
     see. */
  var beat = null;

  function repaint() {
    var top = VW.top();
    if (top === "deck" && DK) paintDeck();
    else if (top === "infirmary" && IN) paintInfirmary();
    else if (top === "prison" && PR) paintPrison();
    else if (top === "recruit" && RT) paintRecruit();
  }

  function tick() {
    var top = VW.top();
    if (top === "deck" || top === "infirmary" || top === "prison" || top === "recruit") {
      repaint();
      return;
    }
    stopBeat();
  }
  function startBeat() { if (!beat) beat = setInterval(tick, DEV ? 1000 : 20000); }
  function stopBeat() { if (beat) { clearInterval(beat); beat = null; } }

  /* ── 11. mount ────────────────────────────────────────────────────────── */

  var DECOR = { count: 2, spots: ["l", "r"], size: 130, opacity: 0.3, front: 0 };

  function mount(api) {
    API = api;
    if (api.lang) setLang(api.lang);

    VW.define("deck", {
      build: buildDeck, node: function () { return DK.box; },
      show: function () { DK.tab = "deck"; DK.body.scrollTop = 0; paintDeck(); startBeat(); }, hide: stopBeat,
      hud: true, decor: DECOR
    });
    VW.define("infirmary", {
      build: buildInfirmary, node: function () { return IN.box; },
      show: function () { paintInfirmary(); startBeat(); }, hide: stopBeat,
      hud: true, decor: DECOR
    });
    VW.define("prison", {
      build: buildPrison, node: function () { return PR.box; },
      show: function () { paintPrison(); startBeat(); }, hide: stopBeat,
      hud: true, decor: DECOR
    });
    VW.define("recruit", {
      build: buildRecruit, node: function () { return RT.box; },
      show: function () { paintRecruit(); startBeat(); }, hide: stopBeat,
      hud: true, decor: DECOR
    });
  }

  W.onResult(absorb);
  W.onState(function (s) {
    if (s === "end") { armOffer(); return; }
    if (watching) { clearInterval(watching); watching = null; }
  });
  /* THE SECOND DOOR THE OFFER CAN COME THROUGH: a player who tapped past the
     end screen still gets their prisoner, on the hub, where the prison they
     are about to fill is a building they can see. */
  VW.onChange(function (top) {
    if (top === "village" && offer) openOffer();
  });
  MT.onChange(function () { syncDeck(); });
  syncDeck();
  /* A ROSTER NOBODY HAS TOUCHED IS STILL A ROSTER. `blank()` builds one in
     memory and nothing had written it until the first wound or the first
     purchase — so a player who opened the game, looked at their deck and shut
     it again had no save at all, and the next session rebuilt it. It is
     deterministic, so nothing was lost; it was simply a save that claimed not
     to exist. */
  if (fresh) MT.setArmy(save);

  /* ── 12. the strings ──────────────────────────────────────────────────── */

  var STRINGS = {
    en: {
      deck: "Deck", infirmary: "Infirmary", prison: "Prison", recruit: "Recruits",
      deckTitle: "Your deck", deckSub: "Tap a card to take it, tap it again to leave it behind",
      deckSection: "Into the battle", poolSection: "Your cards",
      deckGap1: "1 empty slot — the battle fills it with a conscript ({c} E)",
      deckGapN: "{n} empty slots — the battle fills them with conscripts ({c} E)",
      deckFull: "Ready for battle", deckFullWarn: "The deck is full",
      deckDrop: "Leave this card behind", inDeck: "In deck",
      tab_deck: "Deck", tab_coll: "Collection", tab_obj: "Objects",
      collTitle: "Collection", collSub: "Every officer of the war — tap a face to turn it over",
      ghostBlue: "Recruit this officer to read their file",
      ghostRed: "Meet this officer in battle to read their file",
      fileOpen: "Read this officer's file", fileTurn: "Turn the card over",
      fileHint: "Tap the card to turn it over", age: "Age {n}",
      g_man: "Man", g_woman: "Woman", g_male: "Male", g_female: "Female",
      armyBlue: "Blue army", armyRed: "Red camp", turncoat: "Turncoat",
      collBlue: "Your army", collRed: "Enemy camp",
      objTitle: "Objects", objSub: "What a camp is built of — turn one over in battle to add it",
      objSection: "Seen in battle",
      objKind: "Object", objBy: "Destroyed by: {g}", objByAny: "Any card captures it",
      objGhost: "Turn one over in a battle to read it",
      infTitle: "Infirmary", infSub: "{n} / {m} beds taken", infFree: "Free bed",
      infFull: "Infirmary full", prisonFree: "Free cell",
      prisonFull: "Prison full", prisonFullSub: "{n} cells, all taken: no prisoner this time",
      infNone: "Every card is fit. A card wounded in battle rests here.",
      infHealAll: "Patch everybody up", infHealed: "Back on their feet", healOne: "Patch up",
      prisonTitle: "Prison", prisonSub: "{n} / {m} cells taken",
      prisonNone: "A won battle offers one enemy you left standing.",
      turned: "Turned", enlist: "Enlist", enlisted: "{c} joins your army", freeNow: "Turn now",
      recruitTitle: "Recruiting tent", recruitSub: "New faces in {t}",
      reroll: "New faces now", sold: "Recruited", recruited: "{c} recruited",
      tooPoor: "Not enough coins",
      captiveTitle: "Take a prisoner", captiveSub: "One of the enemies you left standing",
      captiveSubOr: "The enemy you left standing, or the spoils instead", or: "or",
      captiveSkip: "Leave them", captiveTaken: "Taken to the prison",
      ready: "Ready", soon: "Any moment", uD: "d", uH: "h", uM: "m"
    },
    fr: {
      deck: "Deck", infirmary: "Infirmerie", prison: "Prison", recruit: "Recrues",
      deckTitle: "Ton deck", deckSub: "Touche une carte pour l'emmener, touche-la encore pour la laisser",
      deckSection: "Dans la bataille", poolSection: "Tes cartes",
      deckGap1: "1 emplacement vide — la bataille le remplit avec un conscrit ({c} E)",
      deckGapN: "{n} emplacements vides — la bataille les remplit avec des conscrits ({c} E)",
      deckFull: "Prêt pour la bataille", deckFullWarn: "Le deck est plein",
      deckDrop: "Laisser cette carte", inDeck: "Dans le deck",
      tab_deck: "Deck", tab_coll: "Collection", tab_obj: "Objets",
      collTitle: "Collection", collSub: "Tous les officiers de la guerre — touche un visage pour le retourner",
      ghostBlue: "Recrute cet officier pour lire sa fiche",
      ghostRed: "Affronte cet officier en bataille pour lire sa fiche",
      fileOpen: "Lire la fiche de cet officier", fileTurn: "Retourner la carte",
      fileHint: "Touche la carte pour la retourner", age: "{n} ans",
      g_man: "Homme", g_woman: "Femme", g_male: "Mâle", g_female: "Femelle",
      armyBlue: "Armée bleue", armyRed: "Camp rouge", turncoat: "Transfuge",
      collBlue: "Ton armée", collRed: "Camp ennemi",
      objTitle: "Objets", objSub: "Ce dont un camp est fait — retournes-en un en bataille pour l'ajouter",
      objSection: "Vus en bataille",
      objKind: "Objet", objBy: "Détruit par : {g}", objByAny: "Toute carte peut le prendre",
      objGhost: "Retournes-en un en bataille pour le lire",
      infTitle: "Infirmerie", infSub: "{n} / {m} lits occupés", infFree: "Lit libre",
      infFull: "Infirmerie pleine", prisonFree: "Cellule libre",
      prisonFull: "Prison pleine", prisonFullSub: "{n} cellules, toutes prises : pas de prisonnier cette fois",
      infNone: "Toutes tes cartes sont saines. Une carte blessée au combat se repose ici.",
      infHealAll: "Soigner tout le monde", infHealed: "De nouveau sur pied", healOne: "Soigner",
      prisonTitle: "Prison", prisonSub: "{n} / {m} cellules occupées",
      prisonNone: "Une bataille gagnée t'offre un ennemi laissé debout.",
      turned: "Retourné", enlist: "Enrôler", enlisted: "{c} rejoint ton armée", freeNow: "Retourner maintenant",
      recruitTitle: "Tente de recrutement", recruitSub: "De nouvelles têtes dans {t}",
      reroll: "De nouvelles têtes", sold: "Recruté", recruited: "{c} recruté",
      tooPoor: "Pas assez de pièces",
      captiveTitle: "Fais un prisonnier", captiveSub: "Un des ennemis que tu as laissés debout",
      captiveSubOr: "L'ennemi que tu as laissé debout, ou le butin à la place", or: "ou",
      captiveSkip: "Les laisser partir", captiveTaken: "Emmené en prison",
      ready: "Prêt", soon: "D'un instant à l'autre", uD: "j", uH: "h", uM: "min"
    }
  };
  var LANG = "en", T = STRINGS.en;

  function setLang(code) {
    LANG = STRINGS[code] ? code : "en";
    T = STRINGS[LANG];
    repaint();
  }

  /* ── 13. the module ───────────────────────────────────────────────────── */

  window.__ARMY__ = {
    active: function () { return true; },
    mount: mount,
    setLang: setLang,
    text: function (k) { return T[k]; },
    /* A house's word is the ROLE'S, and the village asks here for its four
       rather than carrying a second copy of them. */
    label: function (role) { return T[role] || ""; },
    open: function (name) { VW.go(name); },
    /* An officer's file, from anywhere a card is drawn small — the round's
       own lists ask for it (games/stratideck, sheetOpen). */
    file: openFile,

    /* What the village's badges count (packages/webshell/village.js, DOORS). */
    deckShort: deckShort,
    inInfirmary: inInfirmary,
    inPrison: inPrison,
    /* Who a card IS, in the player's language — "Sara Colt" — for a game
       that names a card in what it says (games/stratideck, cardName). */
    who: whoName,
    affordable: affordable,

    onChange: function (fn) { hooks.push(fn); },
    deck: roundDeck,
    size: function () { return DECK_SIZE; }
  };
})();
