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
    recruit     the CAMP, two tabs: the RECRUITS (what the tent is offering
                today, and what it costs) and the MISSIONS (a squad of two to
                five cards sent away for hours or days, on odds the squad
                itself decides, and the report it comes back with)

  THE SAVE IS META'S. `save.ar`, written through MT.army/setArmy, for the same
  reason the daily road's is: it is bought with that wallet, and a second key
  would be a second thing for OPTIONS to erase and a second thing to forget.

  THE CARD MODEL IS THE MANIFEST'S. The grades, their names and their painted
  faces, the tier ladder, the deck size, the two waits, what a recruit costs
  and the fifty missions are all `web.army` — this file knows that a card is a
  grade and a tier and nothing else about what either means.

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

  /* THE MISSIONS, out of `web.army.missions`: the board's shape and the list
     of scenarios, each one a pretext, a difficulty, a length in real hours, a
     squad size, what it pays and what a failure costs — plus the two reports,
     one per outcome. A mission this file does not know (a save naming one the
     manifest has since dropped) resolves as a plain failure with no cost. */
  var MS = SPEC.missions || {};
  var MISSIONS = MS.list || [];
  var MISSION = {};
  (function () {
    for (var i = 0; i < MISSIONS.length; i++) MISSION[MISSIONS[i].id] = MISSIONS[i];
  })();
  var M_OFFERS = Math.max(1, MS.offers || 3);
  var M_RUN = Math.max(1, MS.running || 3);

  /* WHAT A SQUAD IS WORTH, and it is the same two numbers a fight is read in:
     every card brings its grade plus its tier times `tierWeight`, and the one
     grade a mission favours brings `favorBonus` more — which is what gives a
     spy, a scout and a sapper something to do off the grid, where a marshal
     would otherwise be the answer to everything. A squad worth exactly the
     difficulty's `need` reads `par` (70 %); the odds are linear around it and
     never 0 or 100, since a mission that cannot fail is a wait, and one that
     cannot succeed is a trap. */
  var M_NEED = MS.need || [10, 20, 32, 46, 64];
  var M_PAR = MS.par || 0.7;
  var M_TIER = MS.tierWeight != null ? MS.tierWeight : 2;
  var M_FAVOR = MS.favorBonus != null ? MS.favorBonus : 10;
  var M_LO = MS.floor != null ? MS.floor : 0.05, M_HI = MS.ceil != null ? MS.ceil : 0.95;

  function cardPower(c, m) {
    return c.g + M_TIER * c.t + (m && m.favor === c.g ? M_FAVOR : 0);
  }
  function needOf(m) { return M_NEED[clamp((m.d | 0) - 1, 0, M_NEED.length - 1)]; }
  function chanceOf(cards, m) {
    if (!cards.length) return 0;
    var sum = 0;
    for (var i = 0; i < cards.length; i++) sum += cardPower(cards[i], m);
    return clamp(M_PAR * sum / needOf(m), M_LO, M_HI);
  }
  function pct(p) { return Math.round(p * 100) + "%"; }
  /* A mission's text, in the player's language. */
  function loc(o) { return o ? (o[LANG] || o.en || "") : ""; }

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
  var BOARD_MS = (MS.refreshHours || 8) * HOUR;

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
       ms the missions: { t when the board was rolled, o the mission ids on
          it, r the squads away { m mission, c card ids, e when they are back,
          p the odds they left on, z the roll that decides it — drawn at the
          departure, so no reload re-rolls a report }, q the reports written
          and not yet collected, h mission → how many times it was run,
          w how many of those came back a success — the village's band }
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

  /* A CARD AWAY ON A MISSION is fit and still in the deck — the deck is the
     player's standing choice — and it is out of every battle until it is
     back, the same rule a wound follows. */
  function awayRun(id) {
    var r = save.ms ? save.ms.r : null, i;
    if (!r) return null;
    for (i = 0; i < r.length; i++) if (r[i].c.indexOf(id) >= 0) return r[i];
    return null;
  }

  /* ── 4. the deck the round is handed ──────────────────────────────────── */

  /* THE ONE THING THIS FILE SAYS TO THE GAME, and it says it by writing a
     field rather than by being called: `CONFIG.army.deck` is read fresh by
     `Game.reset()` on every round, so keeping it current on every change is
     enough and there is no start hook to keep in step with the map, the
     village and the end screen's PLAY AGAIN.

     A WOUNDED CARD IS NOT IN IT, nor one away on a mission, whatever the
     deck screen says: the deck is
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
      if (c && fit(c) && !awayRun(c.i)) out.push({ r: c.g, t: c.t, id: c.i, o: c.o || null });
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
  var offerCoins = false;               // the spoils beside it are coins only

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
    offer = (a.won && a.captives && a.captives.length) ? distinct(a.captives).slice(0, PICK) : null;
    /* TWO OF THE SAME CARD IS NOT A CHOICE. The round hands its captives over
       best first, and two sappers of one tier are one card offered twice — so
       the list keeps one of each, and where that leaves a single prisoner out
       of several the other side of the pick is the COINS the second would have
       been worth, not a roll of the spoils. */
    offerCoins = !!(offer && offer.length === 1 && a.captives.length > 1);
    if (n) persist();
  }

  function distinct(list) {
    var out = [], seen = {}, i, k;
    for (i = 0; i < list.length; i++) {
      k = list[i].r + ":" + list[i].t;
      if (!seen[k]) { seen[k] = 1; out.push(list[i]); }
    }
    return out;
  }

  function retire(c) {
    save.r.splice(save.r.indexOf(c), 1);
    var at = save.d.indexOf(c.i);
    if (at >= 0) save.d.splice(at, 1);
  }

  /* ── 6. the prisoner, offered once ────────────────────────────────────── */

  /* WHERE IT OPENS, AND WHY IT IS TWO PLACES. The choice belongs to the battle
     that won it, so it is offered on the battle itself, in the OUTRO — the
     beat between the round and the end screen (packages/shell/shell.js) —
     after the level layer's own outro, the three-star gift included, has had
     its say. The end screen then arrives with the prisoner already in a cell
     or the spoils already in the wallet, and its reveal is not interrupted by
     a card. A player who left the round while the outro played is offered it
     on the next arrival at the hub instead. One function, two doors, and the
     offer is never silently dropped. */
  /* The row's room: the card's content width (view.css, .mt-card — 668 less
     two 34 px paddings), the gap between two tiles and the "or" between a
     lone prisoner and the spoils (army.css, .ar-pick). */
  var PICK_ROOM = 600, PICK_GAP = 22, PICK_OR = 44, PICK_MAX = 240;

  /* The outro's share: the card over the frozen round, and the end screen
     once it is put away. The wallet comes up with it, because the spoils fly
     into a chip and a flight measures a VISIBLE one. */
  function outro(result, done) {
    if (!offer || W.state() !== "playing") { done(); return; }
    if (MT && MT.active && MT.active()) VW.hudShow();
    openOffer(done);
  }

  /* THE CHOICE IS ALWAYS A CHOICE. Two prisoners or more is a pick between
     them; ONE prisoner is a pick between that card and the SPOILS — coins,
     a ticket or a sticker, dealt out of the meta layer's own rewards — since
     a single card with a line under it is a yes-or-no and not a decision.
     The coins are sized on the prisoner (grade and tier), so turning down a
     marshal is worth more than turning down a sergeant. */
  function spoilsFor(c, coinsOnly) {
    if (!MT || !MT.active || !MT.active()) return null;
    var r = coinsOnly ? 0 : Math.random();
    if (r < 0.45) return MT.reward("coins", Math.round((80 + c.r * 18 + c.t * 25) / 10) * 10);
    if (r < 0.8) return MT.reward("ticket", 1);
    return MT.reward("sticker", MT.roll());
  }

  function openOffer(then) {
    then = then || function () {};
    if (!offer || !offer.length) { offer = null; then(); return; }
    if (inPrison() >= CELLS) {
      offer = null;
      say(T.prisonFull, fill(T.prisonFullSub, { n: CELLS }), "warn", "lock");
      then();
      return;
    }
    var list = offer.slice(0);
    offer = null;
    var spoils = list.length === 1 ? spoilsFor(list[0], offerCoins) : null;
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
      kind: "captive", dismiss: false, esc: false, onClose: then,
      title: T.captiveTitle, tap: T.captiveTap,
      fill: function (card, close) {
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

  /* THE SAME FRAME FOR ALL FOUR, and it is the view system's: the sheet
     every room of the place stands in (packages/webshell/view.js, section
     6b). What is left here is the body, and the pages a screen names. */
  function screen(id, key) {
    var S = VW.sheet({ id: id, cls: "ar-screen" });
    /* The clock is a second per hour on a machine that is plainly not a
       player's, and a screenshot must never be mistaken for the real thing. */
    if (DEV) S.head.appendChild(el("i", "ar-dev", "DEV"));
    S.body.classList.add("ar-body");
    S.key = key;
    return S;
  }

  function head(S, title, sub) { S.setHead(title, sub); }

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
    DK.pages(tabList(TABS), pickTab(DK, paintDeck));
    var i;

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

  /* THE PAGES ARE THE SHEET'S BAR, at the foot of the screen — the deck's
     three, the camp's two. A tap on the page already lit does nothing,
     unless the screen says it is not at the top of that page (`S.deep`: the
     camp's briefing, which its tab leaves). */
  var TAB_ICON = { deck: "deck", coll: "file", obj: "tag", tent: "recruit", mis: "compass" };

  function tabList(keys) {
    var out = [];
    for (var i = 0; i < keys.length; i++) out.push({ key: keys[i], label: T["tab_" + keys[i]], icon: TAB_ICON[keys[i]] });
    return out;
  }

  function pickTab(S, paint) {
    return function (key) {
      if (S.tab === key && !(S.deep && S.deep())) return;
      S.tab = key;
      if (S.leave) S.leave();
      S.body.scrollTop = 0;
      paint();
      W.Sound.cue("uiRow", 0.45, 1, 380, 0.08);
    };
  }

  function paintTabs(S, keys) {
    S.relabel(tabList(keys));
    S.light(S.tab);
    for (var i = 0; i < keys.length; i++) S.pane[keys[i]].style.display = S.tab === keys[i] ? "" : "none";
  }

  function paintDeck() {
    paintTabs(DK, TABS);
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
    var hurt = !fit(c), away = awayRun(c.i);
    b.appendChild(cardTile({ g: c.g, t: c.t, o: c.o }, {
      dim: hurt || !!away, tag: hurt ? untilText(c.w - now()) : away ? T.away : null,
      tagClass: hurt ? "hurt" : "away", fmt: "tiny", w: 86
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
    var on = inDeck(c.i), hurt = !fit(c), away = awayRun(c.i);
    if (on) b.className += " on";
    b.appendChild(cardTile({ g: c.g, t: c.t, o: c.o }, {
      dim: hurt || !!away,
      tag: hurt ? untilText(c.w - now()) : away ? T.away : (on ? T.inDeck : null),
      tagClass: hurt ? "hurt" : away ? "away" : "in", fmt: "full", w: 156
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

  /* ── 8d. the camp: the recruiting tent ────────────────────────────────── */

  /* THE CAMP IS ONE HOUSE WITH TWO TABS, the tent and the missions, because
     both are the same question asked two ways — what can this army get that
     it does not have — and both are paid in something the player owns: the
     tent in coins, a mission in cards sent away. A game whose manifest names
     no mission keeps the tent alone, with no bar over it. */
  var RT = null;
  var CAMP_TABS = MISSIONS.length ? ["tent", "mis"] : ["tent"];

  function buildRecruit() {
    RT = screen("ar-recruit", "recruit");
    RT.tab = "tent";
    RT.brief = null;
    RT.pane = {};
    /* The briefing is one level under the missions tab, so the tab is a way
       back to the board from it. */
    RT.deep = function () { return !!RT.brief; };
    RT.leave = function () { RT.brief = null; };
    RT.pages(tabList(CAMP_TABS), pickTab(RT, paintRecruit));
    var tent = RT.pane.tent = el("div", "ar-pane");
    RT.list = el("div", "ar-offers");
    tent.appendChild(RT.list);
    RT.acts = el("div", "ar-acts");
    tent.appendChild(RT.acts);
    RT.body.appendChild(tent);
    RT.pane.mis = el("div", "ar-pane ar-mis-pane");
    RT.body.appendChild(RT.pane.mis);
    if (CAMP_TABS.length < 2) RT.pane.mis.style.display = "none";
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
    if (CAMP_TABS.length > 1) paintTabs(RT, CAMP_TABS);
    if (RT.tab === "mis") { paintMissions(); return; }
    paintTent();
  }

  function paintTent() {
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

  /* ── 8d'. the camp: the missions ──────────────────────────────────────── */

  /* A MISSION IS A BET MADE WITH CARDS. The board offers a few scenarios —
     a pretext, a difficulty, a length in real hours — and the player answers
     one with a squad of two to five cards, read on the odds that squad earns
     (`chanceOf`). The squad is away for the whole wait, out of every battle,
     and it comes back with a REPORT written in the logic of that scenario:
     what it paid, or what it cost — wounds, cards that never came back, coins.

     THE BOARD IS ROLLED ON A CLOCK, like the tent's shelf and for the same
     reason: a board that re-rolls on every visit is a board the player
     re-rolls until the easy one turns up. It leans on the missions played the
     least, and it spreads the difficulties before it repeats one.

     THE OUTCOME IS DRAWN AT THE DEPARTURE (`z`), and the report is written
     the moment it is opened — the wounds and the losses land on the roster
     then, and are kept in the save with it — while what it pays is granted
     on the tap that collects it, so the chips count up in front of the
     player rather than behind the card. Neither step can be re-rolled by
     closing the game in between. */
  function mstate() {
    var s = save.ms;
    if (!s) s = save.ms = { t: 0, o: [], r: [], q: [], h: {} };
    if (!s.o) s.o = [];
    if (!s.r) s.r = [];
    if (!s.q) s.q = [];
    if (!s.h) s.h = {};
    if (typeof s.w !== "number") s.w = 0;
    return s;
  }

  function board() {
    var s = mstate(), i;
    if (!s.t || now() - s.t >= BOARD_MS) rollBoard();
    /* a mission the manifest has since dropped is not offered */
    for (i = s.o.length - 1; i >= 0; i--) if (!MISSION[s.o[i]]) s.o.splice(i, 1);
    return s;
  }

  /* Written and not persisted, like the tent's `roll`: the screen drawing
     the board is what rolls it, and `persist` would repaint that screen. */
  function rollBoard() {
    var s = mstate(), busy = {}, pool = [], out = [], seen = {}, i, j, tmp;
    for (i = 0; i < s.r.length; i++) busy[s.r[i].m] = 1;
    for (i = 0; i < MISSIONS.length; i++) if (!busy[MISSIONS[i].id]) pool.push(MISSIONS[i]);
    for (i = pool.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    /* The least played first — a stable sort over a shuffle, so missions run
       as often as each other stay in random order — then one per difficulty
       before a difficulty is offered twice. */
    pool = stable(pool, function (a, b) { return (s.h[a.id] || 0) - (s.h[b.id] || 0); });
    for (i = 0; i < pool.length && out.length < M_OFFERS; i++) {
      if (!seen[pool[i].d]) { seen[pool[i].d] = 1; out.push(pool[i]); }
    }
    for (i = 0; i < pool.length && out.length < M_OFFERS; i++) {
      if (out.indexOf(pool[i]) < 0) out.push(pool[i]);
    }
    out.sort(function (a, b) { return a.d - b.d || a.hours - b.hours; });
    s.t = now();
    s.o = [];
    for (i = 0; i < out.length; i++) s.o.push(out[i].id);
    MT.setArmy(save);
  }

  /* Array.prototype.sort is not stable in every WebView this shell runs in. */
  function stable(list, cmp) {
    var tagged = [], i;
    for (i = 0; i < list.length; i++) tagged.push({ v: list[i], i: i });
    tagged.sort(function (a, b) { return cmp(a.v, b.v) || a.i - b.i; });
    for (i = 0; i < tagged.length; i++) list[i] = tagged[i].v;
    return list;
  }

  /* WHO CAN BE SENT: fit, and not away already. Best first, the order every
     list of this layer reads in. */
  function available() {
    var out = [], i, c;
    for (i = 0; i < save.r.length; i++) {
      c = save.r[i];
      if (fit(c) && !awayRun(c.i)) out.push(c);
    }
    return out.sort(cmpCard);
  }

  function launch(m, ids) {
    var s = mstate(), cards = [], i, c;
    for (i = 0; i < ids.length; i++) { c = byId(ids[i]); if (c) cards.push(c); }
    var at = s.o.indexOf(m.id);
    if (at >= 0) s.o.splice(at, 1);
    s.r.push({ m: m.id, c: ids.slice(0), e: now() + m.hours * HOUR,
               p: chanceOf(cards, m), z: Math.random() });
    persist();
  }

  function isBack(run) { return run.e <= now(); }

  /* THE REPORT, written. The squad is read best first, and the first of
     them is the officer the report is about ({leader}). */
  function resolve(run) {
    var s = mstate(), m = MISSION[run.m] || null, sq = [], i, c;
    s.r.splice(s.r.indexOf(run), 1);
    for (i = 0; i < run.c.length; i++) {
      c = byId(run.c[i]);
      if (c) sq.push({ i: c.i, g: c.g, t: c.t, o: c.o || null, f: "" });
    }
    sq.sort(cmpCard);
    var ok = !!m && run.z < run.p;
    var rep = { m: run.m, ok: ok, p: run.p, sq: sq, rw: [], pen: [] };
    if (m && ok) {
      for (i = 0; i < (m.reward || []).length; i++) rep.rw.push(rollReward(m.reward[i]));
    } else if (m) {
      for (i = 0; i < (m.fail || []).length; i++) {
        var f = m.fail[i];
        if (f.kind === "coins") rep.pen.push({ kind: "coins", n: f.n | 0 });
        else strike(sq, f.kind, f.n | 0);
      }
    }
    s.h[run.m] = (s.h[run.m] || 0) + 1;
    if (ok) s.w++;
    s.q.push(rep);
    persist();
    return rep;
  }

  /* WHAT A FAILURE COSTS IN CARDS, drawn out of the squad. A wound is the
     infirmary's like every other one — and a wound it has no bed for is a
     card lost, the rule the round keeps (section 1b). */
  function strike(sq, kind, n) {
    var left = [], k, pick, c;
    for (k = 0; k < sq.length; k++) if (!sq[k].f) left.push(sq[k]);
    for (k = 0; k < n && left.length; k++) {
      pick = left.splice(Math.floor(Math.random() * left.length), 1)[0];
      c = byId(pick.i);
      if (!c) continue;
      if (kind === "wound" && inInfirmary() < BEDS) { c.w = now() + HEAL_MS; pick.f = "hurt"; }
      else { retire(c); pick.f = "lost"; }
    }
  }

  /* What a success pays, decided when the report is written so the card
     shows the very sticker and the very officer the tap will hand over. */
  function rollReward(rw) {
    if (rw.kind === "sticker") return { kind: "sticker", n: MT.roll() };
    if (rw.kind === "card") {
      var r = rw.r || [4, 6], t = rw.t || [0, 1];
      var g = r[0] + Math.floor(Math.random() * (r[1] - r[0] + 1));
      if (!GRADE[g]) g = CONSCRIPT.r;
      return { kind: "card", g: g,
               t: clamp(t[0] + Math.floor(Math.random() * (t[1] - t[0] + 1)), 0, TOP) };
    }
    return { kind: rw.kind, n: rw.n | 0 };
  }

  /* THE TAP THAT COLLECTS: the state moves first, the card goes, and then
     every piece flies into the chip that counts it (`Meta.fx`) — measured
     from the card while it is still on screen. */
  function collect(rep, card) {
    var s = mstate(), at = s.q.indexOf(rep), fly = [], i, rw, node, before, got;
    if (at < 0) return null;
    s.q.splice(at, 1);
    for (i = 0; i < rep.rw.length; i++) {
      rw = rep.rw[i];
      node = card.querySelector('[data-rw="' + i + '"]');
      if (rw.kind === "card") {
        got = enrol(save, rw.g, rw.t);
        if (save.d.length < DECK_SIZE) save.d.push(got.i);
        say(fill(T.recruited, { c: whoName("blue", rw.g, rw.t) }),
            W.Lang.t(gradeName(rw.g)) + " · " + tierName(rw.t), "gain", "user");
      } else if (rw.kind === "super") {
        MT.addSupers(rw.n);
        say(rewardText(rw), "", "rare", "super");
      } else {
        before = rw.kind === "coins" ? MT.coins() : rw.kind === "ticket" ? MT.tickets() : rw.kind === "xp" ? MT.xp() : 0;
        MT.grant(rw);
        fly.push({ rw: rw, from: node ? node.getBoundingClientRect() : null,
                   before: before, tag: rw.kind !== "sticker" });
      }
    }
    var fine = 0, had = MT.coins();
    for (i = 0; i < rep.pen.length; i++) if (rep.pen[i].kind === "coins") fine += rep.pen[i].n;
    fine = Math.min(fine, had);
    if (fine) MT.spend(fine);
    persist();
    return function () {
      for (var k = 0; k < fly.length; k++) MT.fx(fly[k]);
      if (fine) MT.spendFx(had, had - fine);
    };
  }

  /* ── the words and the chips a mission is read in ── */

  function hoursText(h) {
    if (h < 24) return h + T.uH;
    var d = Math.floor(h / 24), r = h - d * 24;
    return d + T.uD + (r ? " " + pad(r) + T.uH : "");
  }

  function rewardText(rw) {
    if (rw.kind === "super") return fill(T.rwSuper, { n: rw.n || 1 });
    if (rw.kind === "sticker") return rw.n != null ? MT.name(rw.n) : T.rwSticker;
    if (rw.kind === "card") {
      if (rw.g != null) return whoName("blue", rw.g, rw.t);
      return fill(T.rwCard, { g: span(rw.r, function (g) { return W.Lang.t(gradeName(g)); }),
                              t: span(rw.t, tierName) });
    }
    return MT.rewardLabel(rw);
  }
  function span(pair, name) {
    pair = pair || [0, 0];
    return pair[0] === pair[1] ? name(pair[0]) : name(pair[0]) + "–" + name(pair[1]);
  }
  function rewardIcon(rw) {
    return rw.kind === "coins" ? "coin" : rw.kind === "ticket" ? "ticket"
         : rw.kind === "super" ? "ticketSuper" : rw.kind === "sticker" ? "sticker"
         : rw.kind === "xp" ? "xp" : "file";
  }
  function penText(f) {
    if (f.kind === "coins") return fill(T.penCoins, { n: MT.num(f.n) });
    if (f.kind === "lose") return fill(f.n > 1 ? T.penLoseN : T.penLose1, { n: f.n });
    return fill(f.n > 1 ? T.penWoundN : T.penWound1, { n: f.n });
  }
  function penIcon(f) { return f.kind === "coins" ? "coin" : f.kind === "lose" ? "skull" : "heal"; }

  /* The words go in as text: a sticker's name or an officer's is data. */
  function mkChip(ico, txt, cls) {
    var n = el("span", "ar-chip" + (cls ? " " + cls : ""), icon(ico, "ar-ci") + "<span></span>");
    n.lastChild.textContent = txt;
    return n;
  }

  /* THE DIFFICULTY IS FIVE PIPS, the lit ones in the danger colour: a number
     out of five is read, a row of five is seen. */
  function pips(d) {
    var n = el("span", "ar-pips d" + d), i;
    n.setAttribute("aria-label", fill(T.diff, { n: d }));
    for (i = 1; i <= 5; i++) n.appendChild(el("i", i <= d ? "on" : ""));
    return n;
  }

  /* What a mission says about itself before anyone is sent: how long, how
     many, which grade it favours, what it pays, what it risks. */
  function facts(m) {
    var row = el("div", "ar-chips");
    row.appendChild(mkChip("clock", hoursText(m.hours)));
    var sq = m.squad || [2, 5];
    row.appendChild(mkChip("deck", fill(sq[0] === sq[1] ? T.squadN : T.squadRange, { a: sq[0], b: sq[1] })));
    if (m.favor && GRADE[m.favor]) {
      row.appendChild(mkChip("star", fill(T.favor, { g: W.Lang.t(gradeName(m.favor)), n: M_FAVOR }), "favor"));
    }
    return row;
  }
  function stakes(m) {
    var row = el("div", "ar-chips"), i;
    for (i = 0; i < (m.reward || []).length; i++) row.appendChild(mkChip(rewardIcon(m.reward[i]), rewardText(m.reward[i]), "gain"));
    for (i = 0; i < (m.fail || []).length; i++) row.appendChild(mkChip(penIcon(m.fail[i]), penText(m.fail[i]), "risk"));
    return row;
  }

  function oddsClass(p) {
    return p >= 0.65 ? "hi" : p >= 0.35 ? "mid" : "lo";
  }

  /* ── the tab ── */

  function paintMissions() {
    var s = board(), box = RT.pane.mis, i;
    box.innerHTML = "";
    if (RT.brief && !MISSION[RT.brief.m]) RT.brief = null;
    if (RT.brief) { paintBrief(box); return; }
    head(RT, T.misTitle, fill(T.misSub, { n: s.r.length, m: M_RUN }));

    /* WHAT IS OUT THERE: the reports written and not collected, then the
       squads away, the first back first. */
    var runs = s.r.slice().sort(function (a, b) { return a.e - b.e; });
    if (s.q.length || runs.length) {
      box.appendChild(sec(T.misAway, s.r.length + " / " + M_RUN));
      var list = el("div", "ar-list");
      for (i = 0; i < s.q.length; i++) list.appendChild(reportRow(s.q[i]));
      for (i = 0; i < runs.length; i++) list.appendChild(runRow(runs[i]));
      box.appendChild(list);
    }

    box.appendChild(sec(T.misBoard, ""));
    if (!s.o.length) box.appendChild(el("p", "ar-none", T.boardEmpty));
    for (i = 0; i < s.o.length; i++) box.appendChild(missionTile(MISSION[s.o[i]]));
    var note = el("div", "ar-note");
    note.textContent = fill(T.boardNext, { t: untilText(s.t + BOARD_MS - now()) });
    box.appendChild(note);
    var acts = el("div", "ar-acts");
    acts.appendChild(adButton(T.boardReroll, function () { rollBoard(); persist(); }));
    box.appendChild(acts);
  }

  function sec(label, count) {
    var h = el("h3", "ar-sec");
    h.innerHTML = W.upper(label) + (count !== "" ? ' <b>' + count + '</b>' : "");
    return h;
  }

  function missionTile(m) {
    var n = el("div", "ar-mis");
    var top = el("div", "ar-mis-top");
    top.appendChild(text("h4", "ar-mis-title", W.upper(loc(m.title))));
    top.appendChild(pips(m.d));
    n.appendChild(top);
    n.appendChild(text("p", "ar-mis-brief", loc(m.brief)));
    n.appendChild(facts(m));
    n.appendChild(stakes(m));
    var full = mstate().r.length >= M_RUN;
    var b = el("button", "ar-btn" + (full ? " off" : " gold"), icon("compass", "ar-ci") + "<span>" + T.prepare + "</span>");
    b.addEventListener("click", function () {
      if (mstate().r.length >= M_RUN) { say(T.runFull, fill(T.runFullSub, { n: M_RUN }), "warn", "clock"); return; }
      RT.brief = { m: m.id, pick: [] };
      RT.body.scrollTop = 0;
      paintRecruit();
      W.Sound.cue("uiRow", 0.45, 1.1, 420, 0.08);
    });
    n.appendChild(b);
    return n;
  }

  /* A squad away: its leader's token, where it went, the odds it left on and
     how long until it is back — then the report, or the ad that brings it
     home now. */
  function runRow(run) {
    var m = MISSION[run.m], back = isBack(run);
    var row = el("div", "ar-row ar-run" + (back ? " ready" : ""));
    row.appendChild(squadStack(run.c));
    var mid = el("div", "ar-mid");
    mid.appendChild(text("div", "ar-rowname", W.upper(m ? loc(m.title) : "???")));
    var sub = el("div", "ar-rowsub");
    if (m) sub.appendChild(pips(m.d));
    sub.appendChild(text("span", "ar-odds " + oddsClass(run.p), fill(T.oddsShort, { p: pct(run.p) })));
    mid.appendChild(sub);
    mid.appendChild(el("div", "ar-when" + (back ? " ok" : ""),
      icon(back ? "check" : "clock", "ar-ci") + "<span>" + (back ? T.runBack : untilText(run.e - now())) + "</span>"));
    row.appendChild(mid);
    if (back) {
      var b = el("button", "ar-btn gold small", icon("file", "ar-ci") + "<span>" + T.readReport + "</span>");
      b.addEventListener("click", function () {
        if (mstate().r.indexOf(run) < 0) return;
        openReport(resolve(run));
      });
      row.appendChild(b);
    } else {
      row.appendChild(adButton(T.runNow, function () { run.e = 0; persist(); }, "small"));
    }
    return row;
  }

  /* A report written and not yet collected — the game was closed on it. */
  function reportRow(rep) {
    var m = MISSION[rep.m];
    var row = el("div", "ar-row ar-run ready");
    var ids = [];
    for (var i = 0; i < rep.sq.length; i++) ids.push(rep.sq[i].i);
    row.appendChild(squadStack(ids, rep.sq));
    var mid = el("div", "ar-mid");
    mid.appendChild(text("div", "ar-rowname", W.upper(m ? loc(m.title) : "???")));
    mid.appendChild(el("div", "ar-when ok", icon("check", "ar-ci") + "<span>" + T.runBack + "</span>"));
    row.appendChild(mid);
    var b = el("button", "ar-btn gold small", icon("file", "ar-ci") + "<span>" + T.readReport + "</span>");
    b.addEventListener("click", function () { openReport(rep); });
    row.appendChild(b);
    return row;
  }

  /* The squad as a small stack: the leader's token and how many follow. */
  function squadStack(ids, known) {
    var box = el("div", "ar-stack"), best = null, i, c;
    for (i = 0; i < ids.length; i++) {
      c = byId(ids[i]) || (known && known[i]) || null;
      if (c && (!best || cmpCard(c, best) < 0)) best = c;
    }
    if (best) box.appendChild(cardTile({ g: best.g, t: best.t, o: best.o }, { fmt: "tiny", w: 76 }));
    else box.appendChild(el("div", "ar-free-slot"));
    if (ids.length > 1) box.appendChild(el("i", "ar-stack-n", "+" + (ids.length - 1)));
    return box;
  }

  /* ── the briefing: the squad, picked ── */

  /* ONE LEVEL UNDER THE TAB AND NOT A VIEW OF ITS OWN. It is composed, so it
     is not a card a stray tap can close; and a view of its own would have no
     way back to the board but the band's house, which leads out of the camp
     altogether. The tab is that way back, and CANCEL says it in words. */
  function paintBrief(box) {
    var m = MISSION[RT.brief.m], sq = m.squad || [2, 5], i, c;
    var pool = available(), pick = [], picked = {};
    /* a card that stopped being available since it was picked is let go */
    for (i = 0; i < RT.brief.pick.length; i++) {
      c = byId(RT.brief.pick[i]);
      if (c && fit(c) && !awayRun(c.i)) { pick.push(c); picked[c.i] = 1; }
    }
    RT.brief.pick = [];
    for (i = 0; i < pick.length; i++) RT.brief.pick.push(pick[i].i);
    head(RT, T.briefTitle, fill(sq[0] === sq[1] ? T.briefSubN : T.briefSub, { a: sq[0], b: sq[1] }));

    var card = el("div", "ar-mis brief");
    var top = el("div", "ar-mis-top");
    top.appendChild(text("h4", "ar-mis-title", W.upper(loc(m.title))));
    top.appendChild(pips(m.d));
    card.appendChild(top);
    card.appendChild(text("p", "ar-mis-brief", loc(m.brief)));
    card.appendChild(facts(m));
    card.appendChild(stakes(m));
    box.appendChild(card);

    box.appendChild(sec(T.squadSec, pick.length + " / " + sq[1]));
    var slots = el("div", "ar-slots ar-squad" + (PAINTED ? " painted" : ""));
    for (i = 0; i < sq[1]; i++) slots.appendChild(i < pick.length ? squadSlot(pick[i], m) : needSlot(i < sq[0]));
    box.appendChild(slots);

    /* THE ODDS, live: every card taken or left moves them, which is the
       whole of what the player is weighing up on this screen. */
    var p = chanceOf(pick, m);
    var g = el("div", "ar-gauge " + oddsClass(p));
    var gl = el("div", "ar-gauge-top");
    gl.appendChild(text("span", "ar-gauge-l", W.upper(T.oddsLabel)));
    gl.appendChild(text("b", "ar-gauge-p", pct(p)));
    g.appendChild(gl);
    var bar = el("div", "ar-gauge-bar");
    var fillBar = el("i");
    fillBar.style.width = Math.round(p * 100) + "%";
    bar.appendChild(fillBar);
    g.appendChild(bar);
    box.appendChild(g);

    var short = sq[0] - pick.length;
    var acts = el("div", "ar-acts");
    var go = el("button", "ar-btn" + (short > 0 ? " off" : " gold"),
                icon("compass", "ar-ci") + "<span>" + T.send + "</span>");
    go.addEventListener("click", function () {
      if (short > 0) { say(fill(short === 1 ? T.needMore1 : T.needMoreN, { n: short }), "", "warn", "info"); return; }
      if (mstate().r.length >= M_RUN) { say(T.runFull, fill(T.runFullSub, { n: M_RUN }), "warn", "clock"); return; }
      launch(m, RT.brief.pick);
      RT.brief = null;
      RT.body.scrollTop = 0;
      paintRecruit();
      say(T.sent, fill(T.sentSub, { t: hoursText(m.hours) }), "info", "clock");
      W.Sound.cue("uiWin", 0.8, 0.9, 520, 0.2, "triangle");
    });
    acts.appendChild(go);
    var no = el("button", "ar-btn", "<span>" + T.cancel + "</span>");
    no.addEventListener("click", function () {
      RT.brief = null;
      RT.body.scrollTop = 0;
      paintRecruit();
    });
    acts.appendChild(no);
    box.appendChild(acts);

    box.appendChild(sec(T.availSec, String(pool.length)));
    if (!pool.length) { box.appendChild(el("p", "ar-none", T.availNone)); return; }
    var grid = el("div", "ar-pool" + (PAINTED ? " painted" : ""));
    for (i = 0; i < pool.length; i++) grid.appendChild(pickTile(pool[i], m, !!picked[pool[i].i], pick.length >= sq[1]));
    box.appendChild(grid);
  }

  function squadSlot(c, m) {
    var b = el("button", "ar-slot");
    b.appendChild(cardTile({ g: c.g, t: c.t, o: c.o }, {
      fmt: "tiny", w: 86, tag: m.favor === c.g ? "+" + M_FAVOR : null, tagClass: "in"
    }));
    b.setAttribute("aria-label", T.deckDrop);
    b.addEventListener("click", function () { togglePick(c.i); });
    return b;
  }
  function needSlot(need) {
    var n = el("div", "ar-slot empty" + (need ? " need" : ""));
    n.appendChild(el("span", "ar-plus", "+"));
    return n;
  }

  /* A card of the pool: a toggle, like the deck's, with the one fact that
     matters here on its tag — taken, favoured by this mission, or in the
     deck (and so about to miss the battles it would have fought). */
  function pickTile(c, m, on, full) {
    var w = el("div", "ar-slot-w");
    var b = el("button", "ar-slot pool" + (on ? " on" : ""));
    var fav = m.favor === c.g;
    b.appendChild(cardTile({ g: c.g, t: c.t, o: c.o }, {
      fmt: "full", w: 156,
      tag: on ? T.inSquad : fav ? "+" + M_FAVOR : inDeck(c.i) ? T.inDeck : null,
      tagClass: on || fav ? "in" : ""
    }));
    b.addEventListener("click", function () {
      if (!on && full) { say(T.squadFull, "", "warn"); return; }
      togglePick(c.i);
    });
    w.appendChild(b);
    var f = el("button", "ar-file-btn", icon("file", "ar-ci"));
    f.setAttribute("aria-label", T.fileOpen);
    f.addEventListener("click", function () { openFile({ o: c.o || "blue", g: c.g, t: c.t }, "blue", b); });
    w.appendChild(f);
    return w;
  }

  function togglePick(id) {
    var at = RT.brief.pick.indexOf(id);
    if (at >= 0) RT.brief.pick.splice(at, 1);
    else RT.brief.pick.push(id);
    paintRecruit();
    W.Sound.cue("uiRow", 0.4, at >= 0 ? 0.9 : 1.1, 400, 0.06);
  }

  /* ── the report ── */

  /* A CARD, NOT A VIEW: it is read and put away, and the tap that puts it
     away is the tap that collects — the rule every reward card of this shell
     is dismissed under. Neither the scrim nor ESCAPE skips it without
     collecting, since what it pays is only granted on that tap. */
  function openReport(rep) {
    var m = MISSION[rep.m] || null, done = false, off = null;
    var lead = rep.sq[0] || null;
    var leader = lead ? whoName(lead.o || "blue", lead.g, lead.t) : T.theSquad;
    MD.open({
      kind: "ar-report", dismiss: false, esc: false,
      eyebrow: T.repEyebrow, title: m ? loc(m.title) : T.misTitle,
      tap: rep.rw.length ? T.repCollect : T.repClose,
      fill: function (card, close, handle) {
        card.appendChild(el("div", "ar-stamp " + (rep.ok ? "ok" : "ko"), W.upper(rep.ok ? T.repWin : T.repLose)));
        card.appendChild(text("p", "ar-rep-text",
          fill(m ? loc(rep.ok ? m.win : m.lose) : "", { leader: leader })));

        var row = el("div", "ar-rep-squad" + (PAINTED ? " painted" : ""));
        for (var i = 0; i < rep.sq.length; i++) {
          var q = rep.sq[i];
          row.appendChild(cardTile({ g: q.g, t: q.t, o: q.o }, {
            fmt: "tiny", w: 76, dim: q.f === "lost",
            tag: q.f === "hurt" ? T.fateHurt : q.f === "lost" ? T.fateLost : null,
            tagClass: q.f === "hurt" ? "hurt" : "lost"
          }));
        }
        card.appendChild(row);

        var out = el("div", "ar-rep-out");
        for (i = 0; i < rep.rw.length; i++) {
          var rw = rep.rw[i], cell = el("div", "ar-rep-rw " + rw.kind);
          cell.setAttribute("data-rw", String(i));
          if (rw.kind === "card") cell.appendChild(cardTile({ g: rw.g, t: rw.t }, { fmt: "tiny", w: 96 }));
          else if (rw.kind === "super") cell.innerHTML = '<span class="ar-rep-ico">' + icon("ticketSuper", "ar-rep-i") + "</span>";
          else cell.innerHTML = MT.rewardArt(rw);
          cell.appendChild(text("div", "ar-rep-lbl", rewardText(rw)));
          out.appendChild(cell);
        }
        for (i = 0; i < rep.pen.length; i++) {
          out.appendChild(mkChip(penIcon(rep.pen[i]), penText(rep.pen[i]), "risk"));
        }
        if (out.childNodes.length) card.appendChild(out);

        function finish() {
          if (done) return;
          done = true;
          if (off) off();
          var fly = collect(rep, card);
          close();
          if (fly) fly();
          if (rep.ok) W.Sound.cue("uiWin", 0.8, 1, 660, 0.2, "triangle");
        }
        MT.tapOut(handle.box, finish);
        off = MT.keyOut(finish);
      }
    });
    W.Sound.cue(rep.ok ? "uiStar" : "uiRow", 0.8, rep.ok ? 1.2 : 0.7, rep.ok ? 880 : 220, 0.18, "triangle");
  }

  /* WHAT THE CAMP'S BADGE COUNTS: the recruits the wallet can pay for, plus
     every squad that is back with a report to read. */
  function missionsBack() {
    var s = save.ms, n = 0, i;
    if (!s) return 0;
    n = (s.q || []).length;
    for (i = 0; i < (s.r || []).length; i++) if (isBack(s.r[i])) n++;
    return n;
  }
  function campNews() { return affordable() + missionsBack(); }

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
        var tilt = el("div", "ar-tilt");
        tilt.appendChild(inner);
        flip.appendChild(tilt);
        if (HOVER) armTilt(flip, tilt);
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

  /* THE TILT, ON A DESK: the card leans toward the mouse, as a card held in
     the hand leans toward the eye. It is its own layer between the flipper and the turn, so neither
     the flight (on `.ar-flip`) nor the half-turns (on `.ar-flip-in`) share a
     transform with it, and both faces lean the same way. A mouse only: a
     finger has no hover, and a card that tilts under a tap and then stays
     tilted reads as broken. Idle during the flight, back flat on the way out. */
  var HOVER = !!(window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var TILT_DEG = 11;
  function armTilt(flip, tilt) {
    var raf = 0, px = 0.5, py = 0.5;
    function paint() {
      raf = 0;
      var rx = (0.5 - py) * 2 * TILT_DEG, ry = (px - 0.5) * 2 * TILT_DEG;
      tilt.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
    }
    flip.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || flip.classList.contains("fly")) return;
      var r = flip.getBoundingClientRect();
      if (!r.width || !r.height) return;
      px = clamp((e.clientX - r.left) / r.width, 0, 1);
      py = clamp((e.clientY - r.top) / r.height, 0, 1);
      flip.classList.add("tilting");
      if (!raf) raf = requestAnimationFrame(paint);
    });
    flip.addEventListener("pointerleave", function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      flip.classList.remove("tilting");
      tilt.style.transform = "";
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
          skill: gradeSkill(who.g),
          lore: lore[LANG] || lore.en || "",
          army: W.upper(who.o === "red" ? T.armyRed : T.armyBlue),
          turn: who.o !== team ? W.upper(T.turncoat) : ""
        }));
      return wrap;
    }
    return plainBack(who, p, team);
  }
  /* What the grade is FOR, in the player's language — the game's words
     (`Game.gradeInfo`), since the game is what knows the rule. */
  function gradeSkill(g) {
    return W.Game && W.Game.gradeInfo ? W.Game.gradeInfo(g) : "";
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
      if (gradeSkill(who.g)) b.appendChild(text("p", "ar-fb-skill", gradeSkill(who.g)));
      return b;
    }
    b.appendChild(text("div", "ar-fb-first", W.upper(p.first)));
    b.appendChild(text("div", "ar-fb-last", W.upper(p.last)));
    var facts = el("div", "ar-fb-facts");
    facts.appendChild(text("span", "", fill(T.age, { n: p.age })));
    facts.appendChild(text("span", "", T["g_" + p.gender] || p.gender));
    b.appendChild(facts);
    var skill = gradeSkill(who.g);
    if (skill) b.appendChild(text("p", "ar-fb-skill", skill));
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
    if (MT.moreRepaint) MT.moreRepaint();
    var top = VW.top();
    if (top === "deck" && DK) paintDeck();
    else if (top === "infirmary" && IN) paintInfirmary();
    else if (top === "prison" && PR) paintPrison();
    else if (top === "recruit" && RT) paintRecruit();
  }

  function tick() {
    var top = VW.top();
    /* The briefing holds no clock, and a squad half picked must not be
       redrawn under the finger picking it. */
    if (top === "recruit" && RT && RT.brief) return;
    if (top === "deck" || top === "infirmary" || top === "prison" || top === "recruit") {
      repaint();
      return;
    }
    stopBeat();
  }
  function startBeat() { if (!beat) beat = setInterval(tick, DEV ? 1000 : 20000); }
  function stopBeat() { if (beat) { clearInterval(beat); beat = null; } }

  /* ── 10b. the army's figures, in the band's fold ──────────────────────── */

  /* WHAT THE PLAYER COMMANDS, behind the band's sword (meta.js, section
     11b): the missions brought home, how much of the war's cast has served,
     and the three kinds of card on hand — the army's own, the camp's in the
     cells, and the camp's who changed sides. Each row is a door to the room
     that prints that list at full size. The three counts wear a small card in
     the side's colour rather than a pictogram, since the colour is the one
     thing that tells those cards apart on the table. */
  function bandRows() {
    var blue = 0, turn = 0, own = 0, i, k, rows = [];
    for (i = 0; i < save.r.length; i++) { if (save.r[i].o === "red") turn++; else blue++; }
    for (k in save.c.h) if (save.c.h.hasOwnProperty(k)) own++;
    var all = 2 * GRADES.length * TIERS.length;
    if (MISSIONS.length) {
      rows.push({ pic: icon("compass", "mt-ci"), label: T.bandMissions,
                  value: MT.num((save.ms && save.ms.w) || 0),
                  go: function () { VW.go("recruit", { tab: "mis" }); } });
    }
    rows.push({ pic: icon("file", "mt-ci"), label: T.bandOwned, value: own + "/" + all,
                go: function () { VW.go("deck", { tab: "coll" }); } });
    rows.push({ pic: '<i class="ar-hc blue"></i>', label: T.bandBlue, value: MT.num(blue),
                go: function () { VW.go("deck"); } });
    rows.push({ pic: '<i class="ar-hc red"></i>', label: T.bandRed, value: MT.num(inPrison()),
                go: function () { VW.go("prison"); } });
    rows.push({ pic: '<i class="ar-hc turn"></i>', label: T.bandTurn, value: MT.num(turn),
                go: function () { VW.go("deck"); } });
    return rows;
  }

  /* ── 11. mount ────────────────────────────────────────────────────────── */

  var DECOR = { count: 2, spots: ["l", "r"], size: 130, opacity: 0.3, front: 0 };

  function mount(api) {
    API = api;
    if (api.lang) setLang(api.lang);

    VW.define("deck", {
      build: buildDeck, node: function () { return DK.box; },
      show: function (o) { DK.tab = (o && o.tab) || "deck"; DK.body.scrollTop = 0; paintDeck(); startBeat(); }, hide: stopBeat,
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
      /* A squad back with a report is the news, so the camp opens on the
         missions then; on the tent otherwise, as it always did. */
      show: function (o) {
        RT.brief = null;
        RT.tab = (o && o.tab) || (CAMP_TABS.length > 1 && missionsBack() ? "mis" : "tent");
        RT.body.scrollTop = 0;
        paintRecruit(); startBeat();
      }, hide: stopBeat,
      hud: true, decor: DECOR
    });

    /* The icons need `API`, which is why the fold is filled at mount. */
    if (MT.moreAdd) MT.moreAdd("army", { title: function () { return T.bandTitle; }, rows: bandRows });
  }

  W.onResult(absorb);
  /* After levels.js, which registered its own outro first: the world reacts,
     then the card is laid over it. */
  if (W.onOutro) W.onOutro(outro);
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
      deck: "Deck", infirmary: "Infirmary", prison: "Prison", recruit: "Camp",
      bandTitle: "Your army", bandMissions: "Missions accomplished", bandOwned: "Officers owned",
      bandBlue: "Blue cards", bandRed: "Red cards in the prison", bandTurn: "Turncoats",
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
      captiveTap: "Tap a card to take it",
      ready: "Ready", soon: "Any moment", uD: "d", uH: "h", uM: "m",
      away: "On mission",
      tab_tent: "Recruits", tab_mis: "Missions",
      misTitle: "Missions", misSub: "{n} / {m} squads away",
      misAway: "Squads away", misBoard: "Mission board",
      boardEmpty: "Every mission on the board is under way.",
      boardNext: "New missions in {t}", boardReroll: "New missions now",
      prepare: "Prepare", runFull: "Every squad is out",
      runFullSub: "{n} missions at once — wait for one to come back",
      runBack: "Back at camp", runNow: "Bring back now", readReport: "Report",
      oddsShort: "{p} success", oddsLabel: "Chance of success",
      diff: "Difficulty {n} of 5",
      squadN: "{a} cards", squadRange: "{a} to {b} cards",
      favor: "{g} +{n}",
      rwSuper: "+{n} super ticket", rwSticker: "A sticker", rwCard: "An officer · {g} · {t}",
      penCoins: "-{n} coins",
      penWound1: "1 card wounded", penWoundN: "{n} cards wounded",
      penLose1: "1 card lost", penLoseN: "{n} cards lost",
      briefTitle: "Briefing", briefSub: "Send {a} to {b} cards — the stronger the squad, the better the odds",
      briefSubN: "Send {a} cards — the stronger the squad, the better the odds",
      squadSec: "The squad", availSec: "Available",
      availNone: "No card is free: every one is wounded or already away.",
      inSquad: "In squad", squadFull: "The squad is full",
      needMore1: "1 more card to send the squad", needMoreN: "{n} more cards to send the squad",
      send: "Send the squad", cancel: "Cancel",
      sent: "Squad on its way", sentSub: "Back in {t}",
      repEyebrow: "Mission report", repWin: "Success", repLose: "Failure",
      fateHurt: "Wounded", fateLost: "Lost", theSquad: "The squad",
      repCollect: "Tap anywhere to collect", repClose: "Tap anywhere to close"
    },
    fr: {
      deck: "Deck", infirmary: "Infirmerie", prison: "Prison", recruit: "Camp",
      bandTitle: "Ton armée", bandMissions: "Missions réussies", bandOwned: "Officiers possédés",
      bandBlue: "Cartes bleues", bandRed: "Cartes rouges en prison", bandTurn: "Transfuges",
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
      captiveTap: "Touche une carte pour la prendre",
      ready: "Prêt", soon: "D'un instant à l'autre", uD: "j", uH: "h", uM: "min",
      away: "En mission",
      tab_tent: "Recrues", tab_mis: "Missions",
      misTitle: "Missions", misSub: "{n} / {m} escouades en mission",
      misAway: "Escouades en mission", misBoard: "Tableau des missions",
      boardEmpty: "Toutes les missions du tableau sont en cours.",
      boardNext: "Nouvelles missions dans {t}", boardReroll: "Nouvelles missions",
      prepare: "Préparer", runFull: "Toutes les escouades sont dehors",
      runFullSub: "{n} missions à la fois — attends qu'une rentre",
      runBack: "De retour au camp", runNow: "Rentrer maintenant", readReport: "Rapport",
      oddsShort: "{p} de réussite", oddsLabel: "Chances de réussite",
      diff: "Difficulté {n} sur 5",
      squadN: "{a} cartes", squadRange: "{a} à {b} cartes",
      favor: "{g} +{n}",
      rwSuper: "+{n} super ticket", rwSticker: "Un sticker", rwCard: "Un officier · {g} · {t}",
      penCoins: "-{n} pièces",
      penWound1: "1 carte blessée", penWoundN: "{n} cartes blessées",
      penLose1: "1 carte perdue", penLoseN: "{n} cartes perdues",
      briefTitle: "Briefing", briefSub: "Envoie {a} à {b} cartes — plus l'escouade est forte, meilleures sont les chances",
      briefSubN: "Envoie {a} cartes — plus l'escouade est forte, meilleures sont les chances",
      squadSec: "L'escouade", availSec: "Disponibles",
      availNone: "Aucune carte n'est libre : toutes sont blessées ou déjà en mission.",
      inSquad: "Dans l'escouade", squadFull: "L'escouade est complète",
      needMore1: "Encore 1 carte pour envoyer l'escouade", needMoreN: "Encore {n} cartes pour envoyer l'escouade",
      send: "Envoyer l'escouade", cancel: "Annuler",
      sent: "Escouade en route", sentSub: "De retour dans {t}",
      repEyebrow: "Rapport de mission", repWin: "Réussite", repLose: "Échec",
      fateHurt: "Blessée", fateLost: "Perdue", theSquad: "L'escouade",
      repCollect: "Touche n'importe où pour récupérer", repClose: "Touche n'importe où pour fermer"
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
    /* The camp's badge: the recruits the wallet can pay for and the squads
       back with a report. */
    camp: campNews,
    /* The missions' own state, read by tools/test/views.mjs. */
    missions: function () { return mstate(); },

    onChange: function (fn) { hooks.push(fn); },
    deck: roundDeck,
    size: function () { return DECK_SIZE; }
  };
})();
