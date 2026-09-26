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

    deck        the cards taken into the next battle, slot by slot, a `+`
                opening the picker over the reserve — and a second tab on
                the same screen: the COLLECTION, a codex of four books (the
                blue army, the red camp, the turncoats — sixty officers each
                — and the objects a camp is built of), one card at a time
                with who they are under it, a shadow for what was never had
    infirmary   what a battle cost, and how long until it comes back
    prison      who was taken, and how long until they turn
    recruit     the CAMP, four tabs: the RECRUITS (what the tent is offering
                today, and what it costs), the MISSIONS (a squad of two to
                five cards sent away for hours or days, on odds the squad
                itself decides, and the report it comes back with), the CAMP
                (five posts an officer is assigned to, and every card the
                camp holds with what it is doing) and the REGISTER (every
                card lost, and where)

  THE SAVE IS META'S. `save.ar`, written through MT.army/setArmy, for the same
  reason the daily road's is: it is bought with that wallet, and a second key
  would be a second thing for OPTIONS to erase and a second thing to forget.

  THE CARD MODEL IS THE MANIFEST'S. The grades, their names and their painted
  faces, the tier ladder, the deck size, the two waits, what a recruit costs
  and the fifty missions are all `web.army` — this file knows that a card is a
  grade and a tier and nothing else about what either means.

  AND A CARD IS A PERSON. `web.army.cast` names one officer per army, grade
  and tier — 2 × 10 × 6, so every combination is exactly one of them and the
  identity is never stored: the army a card was raised in, its grade and the
  tier it was raised at ARE who it is — and the camp never holds one twice.
  A card that serves and wins CLIMBS the ladder (`promote`), and its face
  climbs with it while the person, the portrait and the back of the card
  stay at that first tier. Their name, age, gender and story are printed on the
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

  /* A CARD CLIMBS, THE PERSON DOES NOT CHANGE. A promotion moves `t`, the
     tier every rule and every face reads, and keeps the tier the officer was
     raised at in `b` — written the first time the card climbs, absent until
     then — because the cast is keyed on THAT one: Sara Colt raised at D and
     promoted to C is still Sara Colt, and never the officer the cast names
     at C. So the identity is the army, the grade and the BASE tier. */
  function baseOf(c) { return c.b != null ? c.b : c.t; }
  function idKey(c) { return ck(c.o === "red" ? "red" : "blue", c.g, baseOf(c)); }
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
  /* THE DEAD CAN COME BACK, and it is the tent that finds them: a shelf
     rolled while the register holds an officer the camp no longer has puts
     one of them on it this often. */
  var R_FALLEN = RC.fallen != null ? RC.fallen : 0.4;

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
  var M_LOG = 20;                           // reports kept in the history

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

  /* A CARD THAT SERVES CLIMBS. Every battle a card is played in, every
     mission it is sent on and every battle fought while it holds a post is a
     SERVICE (`s`, counted since its last promotion), and a victory — a battle
     won, a mission brought home — rolls each card that served it for one step
     up the ladder: `base` on the first service, `step` more per service
     after, never past `max`. The manifest's `web.army.promotion` owns the
     three numbers; the defaults put a card near one chance in five after a
     handful of wins. An S has nowhere left to go. */
  var UPS = SPEC.promotion || {};
  var UP_BASE = UPS.base != null ? UPS.base : 0.15;
  var UP_STEP = UPS.step != null ? UPS.step : 0.01;
  var UP_MAX = UPS.max != null ? UPS.max : 0.3;
  function upChance(c) {
    return c.t >= TOP ? 0 : clamp(UP_BASE + UP_STEP * Math.max(0, (c.s || 0) - 1), 0, UP_MAX);
  }
  /* A mission's text, in the player's language. */
  function loc(o) { return o ? (o[LANG] || o.en || "") : ""; }

  /* ── 1b. the clock ────────────────────────────────────────────────────── */

  /* THE ONE THING THIS LAYER CANNOT BE WORKED ON IS THE THING IT IS MADE OF: a
     wait of two days takes two days to watch once. Same answer as the daily
     road's (packages/webshell/daily.js) and the same fence around it — on a
     machine that is plainly not a player's, an hour is a second, and the
     band's DEV pill (packages/webshell/meta.js) says so, so a screenshot can
     never be mistaken for the real thing. Nothing here reaches a deployed site, whose hostname is none of
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

  /* THE CAMP'S FIVE POSTS, one officer each: the infirmary, the prison, the
     formation, the missions and the camp itself. An officer at a post has a
     job, and a job is a card taken out of everything else — no battle, no
     squad, no deck — which is the whole price of it. The order is the one
     the tab draws them in; `k` is what the save writes. */
  var POSTS = [
    { k: "inf", icon: "heal" },
    { k: "pri", icon: "lock" },
    { k: "drill", icon: "deck" },
    { k: "ops", icon: "compass" },
    { k: "cmd", icon: "crown" }
  ];
  var POST = {};
  (function () {
    for (var i = 0; i < POSTS.length; i++) POST[POSTS[i].k] = POSTS[i];
  })();

  /* THE REGISTER KEEPS THE DEAD, and a ceiling keeps it from outgrowing the
     save: past it the oldest name goes first. */
  var X_MAX = 200;

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
          every card raised in the player's own army, b the tier it was
          raised at once it has been promoted, s its services since the last
          promotion }. No two cards of the roster and the prison are the same
          officer (`idKey`): every officer is one person.
       up the promotions not yet shown: { i, g, o, b, f from, t to, why }
       nw on a register entry: the death has not been announced yet
       d  the deck: ids, in the order the player put them in
       p  the prison: { g, t, u the moment the prisoner turns }
       k  the recruiting tent: { t when the shelf was rolled, o what is on it,
          b which of those have been bought }
       ms the missions: { t when the board was rolled, o the mission ids on
          it, r the squads away { m mission, c card ids, e when they are back,
          p the odds they left on, z the roll that decides it — drawn at the
          departure, so no reload re-rolls a report }, q the reports written
          and not yet collected, l the reports collected, newest first and
          at most `M_LOG` of them — the tab's history, re-read on a tap —
          h mission → how many times it was run, w how many of those came
          back a success — the village's band }
       po the camp's posts: { post key → card id }, one officer a post, and
          that card is out of the deck, the squads and every battle
       x  the register: every card lost, newest first and at most `X_MAX`
          { g, t, b, o, why "battle" | "mission" | "wounds", m the mission
          id, at when, back when the tent found them alive again }
       c  the collection, and it only ever grows: { h officer → 1 once OWNED,
          m officer → 1 once MET in a battle or held in the prison, o object →
          1 once one was turned over }. An officer is `ck()`'s key — "b4.2",
          the blue sergeant at C — so the collection is the cast, one person
          per entry. A card sold, killed or healed away is still a card the
          player has had. */
  function blank() {
    var s = { v: 1, n: 1, r: [], d: [], p: [], po: {}, x: [], up: [], k: null, c: { h: {}, m: {}, o: {} } }, i, j, e, t;
    var start = SPEC.start || [];
    /* EVERY OFFICER IS ONE PERSON, the first roster included: a second copy
       asked of the manifest takes the nearest tier of that grade nobody
       holds yet. */
    for (i = 0; i < start.length; i++) {
      e = start[i];
      for (j = 0; j < (e.n || 1); j++) {
        t = freeTier(s, "blue", e.r, e.t | 0);
        if (t >= 0) enrol(s, e.r, t);
      }
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
     prisoner who turned, a mission's reward — so the collection cannot miss
     one, and so the one rule of the cast is kept in one place: an officer
     the camp already holds is not enrolled a second time, and the answer is
     null. Every caller says what happens then. */
  function enrol(s, g, t, o) {
    if (held(s, o || "blue", g, t)) return null;
    var c = { i: String(s.n++), g: g, t: t, w: 0 };
    if (o === "red") c.o = "red";
    s.r.push(c);
    s.c.h[ck(o || "blue", g, t)] = 1;
    return c;
  }

  /* WHO THE CAMP HOLDS, by identity: every card of the roster (a turncoat
     under the camp's key, a promoted card under the tier it was raised at)
     and every prisoner. A dead officer is not in it, which is what lets the
     tent find them again. */
  function heldKeys(s) {
    var out = {}, i;
    for (i = 0; i < s.r.length; i++) out[idKey(s.r[i])] = 1;
    for (i = 0; i < (s.p || []).length; i++) out[ck("red", s.p[i].g, s.p[i].t)] = 1;
    return out;
  }
  function held(s, side, g, t) { return !!heldKeys(s)[ck(side, g, t)]; }

  /* The nearest tier of a grade nobody holds, looked for DOWN first — a
     copy moved under its tier reads as a card already promoted, never as
     one demoted — then up. -1 when all six are held. */
  function freeTier(s, side, g, t) {
    var h = heldKeys(s), d;
    for (d = t; d >= 0; d--) if (!h[ck(side, g, d)]) return d;
    for (d = t + 1; d <= TOP; d++) if (!h[ck(side, g, d)]) return d;
    return -1;
  }

  /* A SAVE WRITTEN BEFORE THE CAST WAS UNIQUE held three sergeants at E. The
     first keeps who they are; each copy after it becomes the nearest officer
     of that grade nobody holds UNDER its tier, so it reads as a card already
     promoted and keeps its strength exactly. A copy with no such officer
     left is bought back at the tent's price — never lifted to a free tier
     above, which would hand a migration a rank nobody earned — and a
     prisoner who is already held is let go. Nobody dies of it: none of this
     is written in the register. Returns whether anything moved. */
  function dedupe(s) {
    var seen = {}, keep = [], moved = false, refund = 0, i, c, k, d, h;
    for (i = 0; i < s.r.length; i++) {
      c = s.r[i];
      k = idKey(c);
      if (!seen[k]) { seen[k] = 1; keep.push(c); continue; }
      moved = true;
      h = seen;
      d = -1;
      for (var x = baseOf(c); x >= 0 && d < 0; x--) if (!h[ck(c.o || "blue", c.g, x)]) d = x;
      if (d < 0) {
        refund += priceOf(c.g, c.t);
        dropRefs(s, c.i);
        continue;
      }
      if (d === c.t) delete c.b; else c.b = d;
      seen[idKey(c)] = 1;
      s.c.h[idKey(c)] = 1;
      keep.push(c);
    }
    s.r = keep;
    var jail = [];
    for (i = 0; i < s.p.length; i++) {
      k = ck("red", s.p[i].g, s.p[i].t);
      if (seen[k]) { moved = true; continue; }
      seen[k] = 1;
      jail.push(s.p[i]);
    }
    s.p = jail;
    if (refund) MT.grant(MT.reward("coins", refund));
    return moved;
  }
  /* A card gone from the roster is gone from every list pointing at it. */
  function dropRefs(s, id) {
    var at = s.d.indexOf(id);
    if (at >= 0) s.d.splice(at, 1);
    for (var k in s.po) if (s.po.hasOwnProperty(k) && s.po[k] === id) delete s.po[k];
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
    if (!s.po) s.po = {};
    if (!s.x) s.x = [];
    if (!s.up) s.up = [];
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
    if (dedupe(s)) fresh = true;          // written once, below
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

  /* THE POST A CARD HOLDS, or null. A post pointing at a card the roster no
     longer has is simply empty. */
  function postOf(id) {
    for (var k in save.po) if (save.po.hasOwnProperty(k) && save.po[k] === id) return k;
    return null;
  }
  function postCard(k) {
    var c = save.po[k] ? byId(save.po[k]) : null;
    if (!c) delete save.po[k];
    return c;
  }
  /* WHAT CAN BE SENT ANYWHERE: fit, not away, and not at a post. The one
     question the deck, the picker and a squad all ask of a card. */
  function free(c) { return fit(c) && !awayRun(c.i) && !postOf(c.i); }

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
      if (c && free(c)) out.push({ r: c.g, t: c.t, id: c.i, o: c.o || null, b: baseOf(c) });
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
      else retire(c, "battle");
      n++;
    }
    /* A WOUND THE INFIRMARY HAD NO BED FOR. The round said so when it
       happened; here the card leaves the roster, and the deck with it. */
    for (i = 0; i < (a.dead || []).length; i++) {
      c = byId(a.dead[i]);
      if (c) { retire(c, "battle"); n++; }
    }
    /* EVERY CARD THE BATTLE TURNED OVER goes into the collection, won or
       lost: an officer of the camp by the best tier met, an object once. */
    for (i = 0; i < (a.met || []).length; i++) {
      c = a.met[i];
      if (GRADE[c.r]) meet(save, c.r, c.t);
      else if (OBJECT[c.r] && !save.c.o[c.r]) save.c.o[c.r] = 1;
      n++;
    }
    /* WHO SERVED IT: every card the battle played (`used`, the round's own
       list; the deck handed over where a game keeps none) and every officer
       at a post. Each counts a service, and a won battle rolls each of them
       for a promotion — the dead excepted, they are already gone. */
    var used = a.used || idsOf(CONFIG.army ? CONFIG.army.deck : []), seen = {};
    for (i = 0; i < used.length; i++) serve(byId(used[i]), a.won, "battle", seen);
    for (var k in save.po) if (save.po.hasOwnProperty(k)) serve(byId(save.po[k]), a.won, "post", seen);
    n++;
    /* A PRISONER WHO IS ALREADY OURS IS NOT ONE. The camp may field an
       officer who sits in a cell or who enlisted: every officer is one person,
       so that one is not offered. */
    var loose = [];
    for (i = 0; i < (a.captives || []).length; i++) {
      if (!held(save, "red", a.captives[i].r, a.captives[i].t | 0)) loose.push(a.captives[i]);
    }
    offer = (a.won && loose.length) ? distinct(loose).slice(0, PICK) : null;
    /* TWO OF THE SAME CARD IS NOT A CHOICE. The round hands its captives over
       best first, and two sappers of one tier are one card offered twice — so
       the list keeps one of each, and where that leaves a single prisoner out
       of several the other side of the pick is the COINS the second would have
       been worth, not a roll of the spoils. */
    offerCoins = !!(offer && offer.length === 1 && a.captives.length > 1);
    if (n) persist();
  }

  function idsOf(deck) {
    var out = [];
    for (var i = 0; i < (deck || []).length; i++) if (deck[i].id) out.push(deck[i].id);
    return out;
  }

  /* ONE SERVICE, and the roll a victory owes it. `seen` keeps a card from
     serving twice in one battle (played, and then posted since). */
  function serve(c, won, why, seen) {
    if (!c || (seen && seen[c.i])) return false;
    if (seen) seen[c.i] = 1;
    c.s = (c.s || 0) + 1;
    return won && Math.random() < upChance(c) ? promote(c, why) : false;
  }

  /* ONE STEP UP THE LADDER. The face moves, the person stays: `b` keeps the
     tier the officer was raised at, the one their name, their portrait and
     the back of their card are read at. The step is queued for the card
     that says so (`announce`), since a promotion nobody saw is a letter
     changed behind the player's back. */
  function promote(c, why) {
    if (c.t >= TOP) return false;
    if (c.b == null) c.b = c.t;
    var from = c.t;
    c.t++;
    c.s = 0;
    var e = { i: c.i, g: c.g, b: c.b, f: from, t: c.t, why: why };
    if (c.o) e.o = c.o;
    save.up.push(e);
    return true;
  }

  function distinct(list) {
    var out = [], seen = {}, i, k;
    for (i = 0; i < list.length; i++) {
      k = list[i].r + ":" + list[i].t;
      if (!seen[k]) { seen[k] = 1; out.push(list[i]); }
    }
    return out;
  }

  /* THE ONE WAY A CARD LEAVES THE ROSTER, and every one of them is a death
     — a wound with no bed, a squad that did not come back — so every one of
     them is written in the register, with where it happened. */
  function retire(c, why, m) {
    save.r.splice(save.r.indexOf(c), 1);
    var at = save.d.indexOf(c.i);
    if (at >= 0) save.d.splice(at, 1);
    var k = postOf(c.i);
    if (k) delete save.po[k];
    /* `nw` until the player has been told (`announce`): a card struck off a
       list while they were looking at the end screen is a card they would
       otherwise find missing without a word. */
    var e = { g: c.g, t: c.t, why: why || "battle", at: now(), nw: 1 };
    if (c.b != null && c.b !== c.t) e.b = c.b;
    if (c.o) e.o = c.o;
    if (m) e.m = m;
    save.x.unshift(e);
    if (save.x.length > X_MAX) save.x.length = X_MAX;
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
        if (held(save, "red", c.r, c.t)) { close(); return; }
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

  /* A card of the roster as the two doors ask for it: the tile, and the
     file — both carrying the tier it was raised at (`b`), which is who it is. */
  function face(c) { return { g: c.g, t: c.t, o: c.o, b: c.b }; }
  function whoOf(c) { return { o: c.o || "blue", g: c.g, t: c.t, b: c.b }; }

  /* `c.t` null is an OBJECT (no tier), `opt.obj` says so to the plain tile,
     and `opt.ghost` is a card never had: a silhouette named ???. */
  function cardTile(c, opt) {
    opt = opt || {};
    if (PAINTED) {
      var p = el("div", "ar-card painted" + (opt.dim ? " dim" : ""));
      /* `base` is the tier the officer was raised at: the portrait is read
         there, the frame, the badge and the pips at `tier` */
      p.appendChild(W.Game.cardNode({ rank: c.g, tier: c.t, base: c.b != null ? c.b : null, o: c.o || null },
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
                : gradeArt(c.g, opt.foe || c.o === "red", opt.ghost ? null : (c.b != null ? c.b : c.t), !opt.foe && c.o === "red");
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
    S.body.classList.add("ar-body");
    S.key = key;
    return S;
  }

  function head(S, title, sub) { S.setHead(title, sub); }

  /* ── 8a. the deck ─────────────────────────────────────────────────────── */

  var DK = null;

  /* TWO TABS ON ONE SCREEN, and not two houses: the collection is the same
     cards read another way — every card of the war rather than the ones
     owned — and a door for it would be a hub of reference books. The deck
     tab is where the screen always opens, because it is the one with
     something to do on it.

     THE DECK TAB IS THE FORMATION AND NOTHING ELSE (lab/stratideck-deck.html,
     "two lists"): every slot the battle has, as medium cards four a row, the
     empty ones included, on one page with nothing to scroll. The reserve is not a second grid under it — it is
     the PICKER a `+` opens, a card over the screen with its own filters,
     since the question an empty slot asks is "which card goes here", and a
     roster of thirty scrolled under the slots was that question asked of
     the whole screen. The collection tab is the CODEX of
     lab/stratideck-collection.html: one card at a time, at full size, and
     the whole of who they are under it — the objects are its third book,
     so there is no third tab. */
  var TABS = ["deck", "coll"];

  function buildDeck() {
    DK = screen("ar-deck", "deck");
    DK.tab = "deck";
    DK.pages(tabList(TABS), pickTab(DK, paintDeck));
    DK.pick = { g: 0 };                     // the picker's grade, kept between two openings
    DK.cx = { side: "blue", f: "all", ix: null };
    DK.car = null;
    DK.justIn = null;

    var d = DK.pane = {};
    d.deck = el("div", "ar-pane");
    var top = el("div", "ar-dtop");
    DK.deckHead = el("h3", "ar-sec");
    top.appendChild(DK.deckHead);
    DK.fill = el("button", "btn btn-sm");
    DK.fill.addEventListener("click", fillBest);
    top.appendChild(DK.fill);
    d.deck.appendChild(top);
    DK.slots = el("div", "ar-line" + (PAINTED ? " painted" : ""));
    d.deck.appendChild(DK.slots);

    d.coll = el("div", "ar-pane ar-cx");

    for (var i = 0; i < TABS.length; i++) DK.body.appendChild(d[TABS[i]]);
  }

  /* THE PAGES ARE THE SHEET'S BAR, at the foot of the screen — the deck's
     two, the camp's four. A tap on the page already lit does nothing,
     unless the screen says it is not at the top of that page (`S.deep`: the
     camp's briefing, which its tab leaves). */
  var TAB_ICON = { deck: "deck", coll: "file", tent: "recruit", mis: "compass", camp: "crown", reg: "skull" };

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
    else paintRoster();
  }

  /* The cards the picker offers: every card owned and not in the deck, best
     first — `ready` keeps only the ones a battle would actually field. */
  function reserveList(ready) {
    var out = [], i, c;
    for (i = 0; i < save.r.length; i++) {
      c = save.r[i];
      if (inDeck(c.i) || postOf(c.i)) continue;
      if (ready && !free(c)) continue;
      out.push(c);
    }
    return out.sort(cmpCard);
  }

  /* THE MEDIUM CARD, four a row: fourteen slots are four rows, and the whole
     formation stands on one page of the sheet with nothing to scroll. */
  var LINE_W = 150;

  function paintRoster() {
    var i, c;
    head(DK, T.deckTitle, "");
    DK.deckHead.innerHTML = W.upper(T.deckSection) +
      ' <b>' + save.d.length + " / " + DECK_SIZE + '</b>';
    /* NO LINE ABOUT THE GAPS: an empty slot says it is empty, and the room
       that sentence took is the room that lets the formation fit on one
       page. The short way to a full deck is always on that line, so the
       line never changes shape, and it is OFF where it would do nothing:
       no gap, or no fit card in reserve to put in it. */
    var gap = deckShort();
    DK.fill.innerHTML = "<span>" + W.upper(T.fillBest) + "</span>";
    DK.fill.disabled = !(gap && reserveList(true).length);

    DK.slots.innerHTML = "";
    for (i = 0; i < DECK_SIZE; i++) {
      c = i < save.d.length ? byId(save.d[i]) : null;
      DK.slots.appendChild(c ? deckSlot(c) : emptySlot(i));
    }
    DK.justIn = null;
  }

  function fillBest() {
    var pool = reserveList(true), k = 0;
    while (save.d.length < DECK_SIZE && k < pool.length) save.d.push(pool[k++].i);
    if (!k) return;
    persist();
    say(fill(k === 1 ? T.filled1 : T.filledN, { n: k }), "", "good", "check");
    W.Sound.cue("uiWin", 0.6, 1.1, 660, 0.14, "triangle");
  }

  /* A CARD OF THE FORMATION IS A DOOR TO WHO IT IS, like every small card:
     the tap opens its file at full size. Leaving the deck is the `−` on its
     corner and nothing else — a button of its own, so a player reading a
     card never drops it by accident — and the card goes back to the
     reserve, where the picker offers it again. */
  function deckSlot(c) {
    var w = el("div", "ar-slot-w");
    var b = el("button", "ar-slot" + (DK.justIn === c.i ? " arrive" : ""));
    var hurt = !fit(c), away = awayRun(c.i);
    b.appendChild(cardTile(face(c), {
      dim: hurt || !!away, tag: hurt ? untilText(c.w - now()) : away ? T.away : null,
      tagClass: hurt ? "hurt" : "away", fmt: "mid", w: LINE_W
    }));
    b.setAttribute("aria-label", T.fileOpen);
    b.addEventListener("click", function () { openFile(whoOf(c), "blue", b); });
    w.appendChild(b);
    var del = el("button", "ar-act del", "−");
    del.setAttribute("aria-label", T.deckDrop);
    del.addEventListener("click", function () {
      var at = save.d.indexOf(c.i);
      if (at < 0) return;
      save.d.splice(at, 1);
      persist();
      W.Sound.cue("uiRow", 0.4, 0.9, 400, 0.06);
    });
    w.appendChild(del);
    return w;
  }

  /* An empty slot is the door to the picker. The deck is an ordered list
     with its gaps at the end, so every `+` fills the first gap — which is
     why the picker counts the deck rather than naming the slot tapped. */
  function emptySlot(i) {
    var b = el("button", "ar-slot empty");
    b.appendChild(el("span", "ar-plus", "+"));
    b.appendChild(el("small", "ar-slot-n", W.upper(fill(T.slotN, { n: i + 1 }))));
    b.setAttribute("aria-label", T.pickTitle);
    b.addEventListener("click", openPicker);
    return b;
  }

  /* ── 8a'. the picker ──────────────────────────────────────────────────── */

  /* A CARD OVER THE DECK, NOT A VIEW: it asks one question — which card goes
     in this slot — and is put away the moment it is answered, or by a tap
     around it. It offers only what can fight today: a wounded card or one
     away on a mission is not an answer to an empty slot, and a filter to
     hide them was a question the player never had to ask. The one filter
     left is the GRADE, because a spy, a scout or a sapper is an answer to
     something and is looked for by name; a grade with no card ready is
     shown and off, so a tap never lands on an empty page, and the grade
     picked is kept for the next `+` — filling three sapper slots in a row
     is one choice made three times.

     THE TOKENS, FIVE A ROW, on a card of one fixed height (the modal's
     `height`): the card never changes size between two grades, so the strip
     under the finger never moves, and the grid is what scrolls. A token's tap reads who it is at full size; the `+` on its
     corner is the one control that takes it. */
  var PICK_W = 100;
  var PICK_H = 880;                         // the picker card, design px

  function openPicker() {
    if (save.d.length >= DECK_SIZE) { say(T.deckFullWarn, "", "warn"); return; }
    pickCard({
      grade: DK.pick, take: T.deckTake,
      eyebrow: T.deckSection + " · " + save.d.length + " / " + DECK_SIZE,
      title: T.pickTitle,
      choose: function (c) {
        if (save.d.length >= DECK_SIZE) { say(T.deckFullWarn, "", "warn"); return; }
        if (inDeck(c.i)) return;
        save.d.push(c.i);
        DK.justIn = c.i;
        persist();
        W.Sound.cue("uiRow", 0.45, 1.15, 420, 0.07);
      }
    });
  }

  /* THE PICKER ITSELF, and the camp's posts and a mission's squad open the
     same one: the question is the same — which free card goes here. `o.grade`
     is the filter kept between two openings, `o.choose` what the `+` does once
     the card is put away; `o.list` the cards offered (the deck's reserve by
     default), `o.tag` the one fact a token wears, `o.empty` the line when
     nothing is left to offer. */
  function pickCard(o) {
    var P = o.grade, strip = null, grid = null;
    MD.open({
      kind: "ar-picker", dismiss: "outside", height: PICK_H,
      eyebrow: o.eyebrow,
      title: o.title,
      fill: function (body, close) {
        strip = el("div", "ar-gstrip");
        grid = el("div", "ar-pick-grid" + (PAINTED ? " painted" : ""));
        body.appendChild(strip);
        body.appendChild(grid);
        paint();

        function paint() {
          var all = o.list ? o.list() : reserveList(true), i, c, g, n, list = [], has = {};
          for (i = 0; i < all.length; i++) has[all[i].g] = (has[all[i].g] || 0) + 1;
          if (P.g && !has[P.g]) P.g = 0;
          for (i = 0; i < all.length; i++) {
            c = all[i];
            if (!P.g || c.g === P.g) list.push(c);
          }
          strip.innerHTML = "";
          var grades = GRADES.slice().sort(function (a, b) { return a.r - b.r; });
          for (i = 0; i < grades.length; i++) {
            g = grades[i].r;
            n = el("button", "ar-g" + (P.g === g ? " on" : "") + (has[g] ? "" : " none"), String(g));
            n.setAttribute("aria-label", W.Lang.t(gradeName(g)));
            if (!has[g]) n.setAttribute("aria-disabled", "true");
            n.title = W.Lang.t(gradeName(g));
            n.addEventListener("click", gradeTap(g, !!has[g]));
            strip.appendChild(n);
          }
          grid.innerHTML = "";
          grid.scrollTop = 0;
          grid.classList.toggle("empty", !list.length);
          for (i = 0; i < list.length; i++) grid.appendChild(pickerTile(list[i], close, o));
          if (!list.length) grid.appendChild(el("p", "ar-none", o.empty || T.pickEmpty));
        }
        /* A GRADE REPAINTS THE CARD UNDER THE FINGER, so its click stops
           here: the button it landed on is gone from the page by the time
           the scrim's own listener asks whether the tap was on the card
           (view.js, `dismiss: "outside"`), and a tap that is on nothing
           reads as a tap outside. A grade tapped again is every grade
           again; a grade with nothing ready answers nothing. */
        function gradeTap(g, any) {
          return function (e) {
            e.stopPropagation();
            if (!any) return;
            P.g = P.g === g ? 0 : g;
            paint();
            W.Sound.cue("uiRow", 0.35, 1.05, 380, 0.06);
          };
        }
      }
    });
  }

  /* A token of the reserve: the tap reads who it is, and the `+` hung on its
     corner takes it — into the first gap of the deck, the deck's own `−` the
     other way, or onto the post that opened the picker. */
  function pickerTile(c, close, o) {
    var w = el("div", "ar-slot-w");
    var b = el("button", "ar-slot pool");
    var tag = o.tag ? o.tag(c) : null;
    b.appendChild(cardTile(face(c), {
      fmt: "tiny", w: PICK_W, tag: tag ? tag.word : null, tagClass: tag ? tag.cls : ""
    }));
    b.setAttribute("aria-label", T.fileOpen);
    b.addEventListener("click", function () { openFile(whoOf(c), "blue", b); });
    w.appendChild(b);
    var add = el("button", "ar-act add", "+");
    add.setAttribute("aria-label", o.take);
    add.addEventListener("click", function () {
      close();
      o.choose(c);
    });
    w.appendChild(add);
    return w;
  }

  /* ── 8a''. the collection — the codex ─────────────────────────────────── */

  /* FOUR BOOKS BEHIND ONE SWITCH, and each quarter of the switch is also its
     progress: the BLUE army (every officer ever OWNED — the roster, the
     tent), the RED camp (every officer ever MET, in a battle or in the
     prison), the TURNCOATS (the red officers who changed sides — the same
     sixty faces in the blue cloth, lit once one enlisted) and the OBJECTS
     (the flag, the trap and the rest of what a camp is built of, once turned
     over in a battle). An officer never had is
     their shadow, which is what an unowned sticker is in the album and for
     the same reason: the shape of what is missing is the reason to go and
     get it.

     ONE CARD AT A TIME, AT FULL SIZE, turned like a carousel — a swipe, the
     two arrows, ← and → on a keyboard — and who they are written under it,
     where a grid of 120 tokens left room for a name at most. The screen
     carries no line under its title: the room it took is the card's. The
     three filters are pictograms riding the seam between the card and what
     is written about it, since they choose between the two. The card in the
     middle turns over to its file on a tap
     (`openFile`); a card on either side is brought to the middle; a shadow
     says how it is earned. */
  var CX_W = 300;
  var CX_SIDES = ["blue", "red", "turn", "obj"];
  var CX_FILTERS = [["all", "deck"], ["had", "check"], ["miss", "lock"]];
  var CX_STEP = 230;                        // the carousel's pitch, in design px

  function cxBook(side) {
    var out = [], i, g, t, k, list;
    if (side === "obj") {
      for (i = 0; i < OBJECTS.length; i++) out.push({ side: side, g: OBJECTS[i].r, t: null, had: !!save.c.o[OBJECTS[i].r] });
      return out;
    }
    list = GRADES.slice().sort(function (a, b) { return b.r - a.r; });
    for (i = 0; i < list.length; i++) {
      g = list[i].r;
      for (t = TOP; t >= 0; t--) {
        /* a turncoat is a red officer the player OWNS: the camp's key, read
           in the roster's book */
        k = ck(side === "blue" ? "blue" : "red", g, t);
        out.push({ side: side, g: g, t: t,
                   had: side === "red" ? !!(save.c.m[k] || save.c.h[k]) : !!save.c.h[k] });
      }
    }
    return out;
  }
  function hadCount(book) {
    var n = 0;
    for (var i = 0; i < book.length; i++) if (book[i].had) n++;
    return n;
  }

  function paintCollection() {
    head(DK, T.collTitle, "");
    var X = DK.cx, box = DK.pane.coll, i, side, book, n, b;
    box.innerHTML = "";
    DK.car = null;

    var sw = el("div", "ar-army");
    for (i = 0; i < CX_SIDES.length; i++) {
      side = CX_SIDES[i];
      book = cxBook(side);
      n = hadCount(book);
      b = el("button", "ar-army-b " + side + (X.side === side ? " on" : ""),
        "<span>" + W.upper(T["cx_" + side]) + "</span><b>" + n + "<i> / " + book.length + "</i></b>" +
        "<em><u style='width:" + (book.length ? n / book.length * 100 : 0).toFixed(1) + "%'></u></em>");
      b.addEventListener("click", sideTap(side));
      sw.appendChild(b);
    }
    box.appendChild(sw);

    book = cxBook(X.side);
    n = hadCount(book);
    var counts = { all: book.length, had: n, miss: book.length - n };
    var filters = el("div", "ar-cx-filters");
    for (i = 0; i < CX_FILTERS.length; i++) filters.appendChild(filterBtn(CX_FILTERS[i][0], CX_FILTERS[i][1], counts[CX_FILTERS[i][0]]));

    var list = [];
    for (i = 0; i < book.length; i++) {
      if (X.f === "all" || (X.f === "had") === book[i].had) list.push(book[i]);
    }
    /* it opens on the best card HAD, not on a shadow */
    if (X.ix == null) {
      X.ix = 0;
      for (i = 0; i < list.length; i++) if (list[i].had) { X.ix = i; break; }
    }
    X.ix = clamp(X.ix, 0, Math.max(0, list.length - 1));

    var stage = el("div", "ar-cx-stage");
    var info = el("div", "ar-cx-info");
    box.appendChild(stage);
    box.appendChild(filters);
    box.appendChild(info);
    if (!list.length) {
      stage.appendChild(el("div", "ar-cx-none", W.upper(T.cxNone)));
      return;
    }
    var car = DK.car = carousel(stage, list, X.ix, function (i) {
      if (i === X.ix) return;
      X.ix = i;
      car.go(i);
      cxInfo(info, list[i]);
      W.Sound.cue("uiRow", 0.3, 1 + (i % 2) * 0.06, 400, 0.05);
    }, cxOpen);
    var l = el("button", "ar-cx-arrow l", "‹"), r = el("button", "ar-cx-arrow r", "›");
    l.setAttribute("aria-label", T.prev);
    r.setAttribute("aria-label", T.next);
    l.addEventListener("click", function () { car.step(-1); });
    r.addEventListener("click", function () { car.step(1); });
    stage.appendChild(l);
    stage.appendChild(r);
    cxInfo(info, list[X.ix]);

    function sideTap(s) {
      return function () {
        if (X.side === s) return;
        X.side = s; X.f = "all"; X.ix = null;
        paintCollection();
        W.Sound.cue("uiRow", 0.45, 1, 380, 0.08);
      };
    }
    function filterBtn(key, ico, count) {
      var c = el("button", "ar-cx-f" + (X.f === key ? " on" : ""), icon(ico, "ar-ci") + "<i>" + count + "</i>");
      c.setAttribute("aria-label", filterLabel(key) + " · " + count);
      c.title = filterLabel(key);
      c.addEventListener("click", function () {
        if (X.f === key) return;
        X.f = key; X.ix = null;
        paintCollection();
        W.Sound.cue("uiRow", 0.35, 1, 380, 0.06);
      });
      return c;
    }
  }

  function filterLabel(key) {
    var X = DK.cx;
    if (key !== "had") return T["f_" + key];
    return T[X.side === "red" ? "f_met" : X.side === "obj" ? "f_seen" : "f_had"];
  }

  /* A turncoat is drawn as the army draws it: the red officer in the blue
     cloth (`o: "red"` on a blue card, the roster's own shape). */
  function cxTile(o) {
    if (o.side === "obj") return cardTile({ g: o.g, t: null }, { obj: true, ghost: !o.had, fmt: "full", w: CX_W });
    return cardTile({ g: o.g, t: o.t, o: o.side === "turn" ? "red" : null },
                    { foe: o.side === "red", ghost: !o.had, fmt: "full", w: CX_W });
  }

  /* The card in the middle, tapped: its file, or how a shadow is earned. */
  function cxOpen(o, node) {
    var from = node.querySelector(".ar-card") || node;
    if (!o.had) {
      if (o.side === "obj") say(T.objGhost, "", "info", "lock");
      else say(o.side === "blue" ? T.ghostBlue : o.side === "turn" ? T.ghostTurn : T.ghostRed, W.Lang.t(gradeName(o.g)) + " · " + tierName(o.t), "info", "lock");
      return;
    }
    if (o.side === "obj") openFile({ g: o.g, obj: true }, "none", from);
    else if (o.side === "turn") openFile({ o: "red", g: o.g, t: o.t }, "blue", from);
    else openFile({ o: o.side, g: o.g, t: o.t }, o.side, from);
  }

  /* WHO THE CARD IN THE MIDDLE IS, under it. Every line is text written into
     a node rather than markup: a name and a story are data, not HTML. */
  function cxInfo(box, o) {
    box.innerHTML = "";
    if (!o) return;
    var meta = el("div", "ar-cx-meta"), p = null, lock;
    if (o.side === "obj") {
      var info = o.had && W.Game && W.Game.objectInfo ? W.Game.objectInfo(o.g) : null;
      box.appendChild(text("div", "ar-cx-name", o.had ? W.upper(W.Lang.t(gradeName(o.g))) : "???"));
      meta.appendChild(text("span", "", T.objKind));
      if (info) meta.appendChild(text("span", "", info.by ? fill(T.objBy, { g: W.Lang.t(gradeName(info.by)) }) : T.objByAny));
      box.appendChild(meta);
      if (info && info.text) box.appendChild(text("p", "ar-cx-lore", info.text));
      lock = o.had ? null : T.objGhost;
    } else {
      p = o.had ? castOf(o.side === "blue" ? "blue" : "red", o.g, o.t) : null;
      var name = text("div", "ar-cx-name", p ? W.upper(p.first + " " + p.last) : "???");
      name.style.setProperty("--ar", "var(--ar-t" + clamp(o.t, 0, 5) + ")");
      box.appendChild(name);
      meta.appendChild(text("span", "", W.Lang.t(gradeName(o.g))));
      var tier = text("span", "ar-cx-tier", tierName(o.t));
      tier.style.color = "var(--ar-t" + clamp(o.t, 0, 5) + ")";
      meta.appendChild(tier);
      if (p) {
        meta.appendChild(text("span", "", fill(T.age, { n: p.age })));
        meta.appendChild(text("span", "", T["g_" + p.gender] || p.gender));
      }
      box.appendChild(meta);
      /* no line for what the grade breaks: the card wears it as a
         pictogram, and the file's back says it in words */
      if (p) {
        var lore = p.lore || {};
        box.appendChild(text("p", "ar-cx-lore", lore[LANG] || lore.en || ""));
      }
      lock = o.had ? null : (o.side === "blue" ? T.ghostBlue : o.side === "turn" ? T.ghostTurn : T.ghostRed);
    }
    if (lock) {
      var l = el("p", "ar-cx-lock", icon("lock", "ar-ci"));
      l.appendChild(text("span", "", lock));
      box.appendChild(l);
    }
  }

  /* THE CAROUSEL (the showcase of lab/stratideck-deck.html, the codex of
     lab/stratideck-collection.html): the cards stand in one row and the
     middle one is read, the others step back, shrink and lean away. A finger
     turns it and a release snaps it; the pointer is captured only once it
     has moved, so a tap on a card is still a tap on that card. */
  function carousel(stage, list, ix, onPick, onOpen) {
    var nodes = [], cur = ix, x0 = null, base = 0, moved = false, k = 1, i;
    for (i = 0; i < list.length; i++) {
      var n = el("button", "ar-cx-card nt");
      n.appendChild(cxTile(list[i]));
      n.setAttribute("aria-label", list[i].had ? cxName(list[i]) : "???");
      n.addEventListener("click", tapAt(i, n));
      stage.appendChild(n);
      nodes.push(n);
    }
    function tapAt(i, n) {
      return function () {
        if (moved) return;
        if (i !== cur) onPick(i);
        else onOpen(list[i], n);
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
      if (e.target.closest && e.target.closest(".ar-cx-arrow")) return;
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
  function cxName(o) {
    return o.side === "obj" ? W.Lang.t(gradeName(o.g)) : whoName(o.side, o.g, o.t);
  }

  /* ← and → turn the codex on a keyboard, while it is the screen on top and
     no card stands over it. */
  document.addEventListener("keydown", function (e) {
    if (!DK || !DK.car || DK.tab !== "coll" || VW.top() !== "deck" || MD.any()) return;
    if (e.key === "ArrowLeft") { DK.car.step(-1); e.preventDefault(); }
    else if (e.key === "ArrowRight") { DK.car.step(1); e.preventDefault(); }
  });

  /* A SMALL CARD IS A DOOR TO WHO IT IS. Where a card of a list does nothing
     else under a tap — a bed, a cell — the tap opens the officer's file, at
     full size. The picker's tokens do the same, and wear a `+` on their
     corner to take them (`pickerTile`). */
  function fileDoor(tile, who, team) {
    var b = el("button", "ar-row-card");
    b.setAttribute("aria-label", T.fileOpen);
    b.appendChild(tile);
    b.addEventListener("click", function () { openFile(who, team, tile); });
    return b;
  }

  /* ── 8b. the infirmary ────────────────────────────────────────────────── */

  /* THE INFIRMARY AND THE PRISON ARE ROOMS, NOT LISTS: every bed and every
     cell drawn as the deck draws a slot — the medium card, three a row — so
     the ceiling is the grid itself, and a gauge under each card says how far
     along the wait is, which a countdown alone never did. */
  var IN = null;
  var WARD_W = LINE_W;

  function buildInfirmary() {
    IN = screen("ar-inf", "infirmary");
    IN.list = el("div", "ar-ward" + (PAINTED ? " painted" : ""));
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
      IN.list.appendChild(i < list.length ? bedCell(list[i]) : freeCell(T.infFree));
    }
    if (!list.length) {
      IN.acts.appendChild(el("p", "ar-none", T.infNone));
      return;
    }
    /* ONE BUTTON FOR ALL OF THEM, and the only ad in the room: an ad per
       bandage is four ads for one battle's worth of wounds, which is a price
       nobody pays twice. It stays because a wound BLOCKS play — a player
       whose best cards are in bandages has nothing to field. */
    IN.acts.appendChild(adButton(T.infHealAll, function () {
      for (var j = 0; j < save.r.length; j++) save.r[j].w = 0;
      persist();
      say(T.infHealed, "", "good", "heart");
    }, "", "heal"));
  }

  /* How far along a wait is, 0 to 1, from its end and its length. */
  function doneOf(end, span) { return clamp(1 - (end - now()) / span, 0, 1); }

  /* One place of a room: the card (a door to its file), then the gauge and
     the line under it. */
  function wardCell(cls, tile, who, team, prog, line) {
    var n = el("div", "ar-cell " + cls);
    var w = el("div", "ar-slot-w");
    w.appendChild(fileDoor(tile, who, team));
    n.appendChild(w);
    var g = el("div", "ar-wgauge");
    var f = el("i");
    f.style.width = Math.round(prog * 100) + "%";
    g.appendChild(f);
    n.appendChild(g);
    n.appendChild(line);
    return n;
  }

  function bedCell(c) {
    return wardCell("bed",
      cardTile(face(c), { dim: true, fmt: "mid", w: WARD_W }),
      whoOf(c), "blue", doneOf(c.w, HEAL_MS),
      el("div", "ar-when", icon("heal", "ar-ci") + "<span>" + untilText(c.w - now()) + "</span>"));
  }

  /* A bed or a cell nobody is in: the card's footprint, dashed, and the word. */
  function freeCell(word) {
    var n = el("div", "ar-cell free");
    n.appendChild(el("div", "ar-free-slot"));
    n.appendChild(el("div", "ar-rowsub", W.upper(word)));
    return n;
  }

  /* ── 8c. the prison ───────────────────────────────────────────────────── */

  var PR = null;

  function buildPrison() {
    PR = screen("ar-prison", "prison");
    PR.list = el("div", "ar-ward" + (PAINTED ? " painted" : ""));
    PR.body.appendChild(PR.list);
    PR.acts = el("div", "ar-acts");
    PR.body.appendChild(PR.acts);
  }

  function paintPrison() {
    var i;
    save.p.sort(function (a, b) { return a.u - b.u; });
    head(PR, T.prisonTitle, fill(T.prisonSub, { n: save.p.length, m: CELLS }));
    PR.list.innerHTML = "";
    PR.acts.innerHTML = "";
    for (i = 0; i < Math.max(CELLS, save.p.length); i++) {
      PR.list.appendChild(i < save.p.length ? prisonCell(save.p[i]) : freeCell(T.prisonFree));
    }
    if (!save.p.length) PR.acts.appendChild(el("p", "ar-none", T.prisonNone));
  }

  /* A PRISONER IS BEHIND BARS, in red, and the gauge under the card turns
     from red to blue as they do. NO AD BUYS THE TURN: a prisoner is a bonus
     that blocks nothing, so the five days are a reason to come back rather
     than a wall — the infirmary keeps its ad because a wound is one. Once
     turned the bars are gone, the card stands in the blue cloth, and the
     tap on ENLIST turns it over into the army. */
  function prisonCell(p) {
    var turned = p.u <= now();
    var line;
    if (turned) {
      /* THE ONE MOMENT A PRISONER BECOMES A CARD. It is a tap and not an
         automatic transfer, because a roster that grows while the player is
         somewhere else is a roster they never saw arrive. */
      line = el("button", "btn btn-sm", icon("check", "ar-ci") + "<span>" + W.upper(T.enlist) + "</span>");
    } else {
      line = el("div", "ar-when", icon("lock", "ar-ci") + "<span>" + untilText(p.u - now()) + "</span>");
    }
    /* A prisoner who has turned is drawn as the card they are about to be:
       the player's army, in the uniform they were caught in. */
    var n = wardCell("cell" + (turned ? " turned" : ""),
      cardTile({ g: p.g, t: p.t, o: turned ? "red" : null }, { foe: !turned, fmt: "mid", w: WARD_W }),
      { o: "red", g: p.g, t: p.t }, turned ? "blue" : "red", doneOf(p.u, FREE_MS), line);
    if (turned) {
      var busy = false;
      line.addEventListener("click", function () {
        if (busy) return;
        busy = true;
        n.classList.add("enlist");
        W.Sound.cue("uiWin", 0.8, 1, 720, 0.2, "triangle");
        setTimeout(function () {
          if (save.p.indexOf(p) < 0) return;
          /* out of the cell first: the prisoner IS the officer being
             enrolled, and `enrol` refuses anyone the camp still holds */
          save.p.splice(save.p.indexOf(p), 1);
          enrol(save, p.g, p.t, "red");
          persist();
          say(fill(T.enlisted, { c: whoName("red", p.g, p.t) }), T.turncoat, "gain", "user");
        }, ENLIST_MS);
      });
    }
    return n;
  }
  var ENLIST_MS = 560;                      // the turn, army.css `ar-enlist`

  /* ── 8d. the camp: the recruiting tent ────────────────────────────────── */

  /* THE CAMP IS ONE HOUSE WITH FOUR TABS. The tent and the missions are the
     same question asked two ways — what can this army get that it does not
     have — and both are paid in something the player owns: the tent in
     coins, a mission in cards sent away. The camp and the register are the
     army read as a whole: who holds a post and what every card is doing, and
     who is gone. A game whose manifest names no mission has no missions tab. */
  var RT = null;
  var CAMP_TABS = ["tent"].concat(MISSIONS.length ? ["mis"] : [], ["camp", "reg"]);

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
    RT.pick = { g: 0 };                     // the post picker's grade
    RT.justIn = null;
    var tent = RT.pane.tent = el("div", "ar-pane");
    RT.list = el("div", "ar-offers");
    tent.appendChild(RT.list);
    RT.body.appendChild(tent);
    RT.pane.mis = el("div", "ar-pane ar-mis-pane");
    RT.body.appendChild(RT.pane.mis);
    if (CAMP_TABS.indexOf("mis") < 0) RT.pane.mis.style.display = "none";
    RT.pane.camp = el("div", "ar-pane ar-camp-pane");
    RT.body.appendChild(RT.pane.camp);
    RT.pane.reg = el("div", "ar-pane ar-reg-pane");
    RT.body.appendChild(RT.pane.reg);
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
    var o = [], taken = heldKeys(save), i, one, back = fallenPool();
    /* NOBODY THE CAMP HOLDS IS FOR SALE, and nobody twice on one shelf: every
       officer is one person. One place is sometimes kept for a FALLEN one —
       an officer of the register the camp no longer has, found alive — at
       the tier they were raised at, since the rank they had earned died with
       the file. */
    if (back.length && Math.random() < R_FALLEN) {
      one = back[Math.floor(Math.random() * back.length)];
      taken[idKey(one)] = 1;
      o.push(one);
    }
    for (i = 0; o.length < R_SLOTS && i < R_SLOTS * 12; i++) {
      one = rollOne();
      if (taken[idKey(one)]) continue;
      taken[idKey(one)] = 1;
      o.push(one);
    }
    /* the fallen one is not always the first place of the shelf */
    if (o.length > 1 && o[0].f) o.splice(Math.floor(Math.random() * o.length), 0, o.shift());
    save.k = { t: now(), o: o, b: [] };
    MT.setArmy(save);
    return save.k;
  }

  /* Every officer of the register the camp does not hold, once each, as an
     offer of the tent: { g, t the tier they were raised at, o, f: 1 }. */
  function fallenPool() {
    var out = [], seen = heldKeys(save), i, e, one;
    for (i = 0; i < save.x.length; i++) {
      e = save.x[i];
      if (!GRADE[e.g]) continue;
      one = { g: e.g, t: e.b != null ? e.b : e.t, f: 1 };
      if (e.o) one.o = e.o;
      if (seen[idKey(one)]) continue;
      seen[idKey(one)] = 1;
      out.push(one);
    }
    return out;
  }

  function rollOne() {
    var w = [30, 26, 18, 10, 4, 1.2], total = 0, i, x, t = 0;
    for (i = 0; i <= TOP; i++) total += w[i] || 0;
    x = Math.random() * total;
    for (i = 0; i <= TOP; i++) { x -= w[i] || 0; if (x <= 0) { t = i; break; } }
    /* The grade is flat over what the game lets a player own, minus the three
       specials, which the tent never sells: a spy, a scout and a sapper are
       ANSWERS to something, and a tent that sold them would be selling the
       solution rather than the army. (One of them lost in the war is the
       exception, found by `fallenPool`: that is buying back what the army
       had, not the answer to a question.) */
    var pool = [];
    for (i = 0; i < GRADES.length; i++) if (GRADES[i].r >= 4) pool.push(GRADES[i].r);
    if (!pool.length) pool = [4];
    return { g: pool[Math.floor(Math.random() * pool.length)], t: t };
  }

  function paintRecruit() {
    paintTabs(RT, CAMP_TABS);
    if (RT.tab === "mis") paintMissions();
    else if (RT.tab === "camp") paintCamp();
    else if (RT.tab === "reg") paintRegister();
    else paintTent();
  }

  function paintTent() {
    var k = shelf(), i;
    head(RT, T.recruitTitle, fill(T.recruitSub, { t: untilText(k.t + TENT_MS - now()) }));
    RT.list.innerHTML = "";
    for (i = 0; i < k.o.length; i++) RT.list.appendChild(offerTile(k.o[i], i, k));
  }

  function offerTile(o, idx, k) {
    var sold = k.b.indexOf(idx) >= 0, price = priceOf(o.g, o.t);
    /* a shelf rolled before the camp took this officer in by another door
       (a mission, a prisoner who turned) cannot sell them a second time */
    var dup = !sold && held(save, o.o || "blue", o.g, o.t);
    var n = el("div", "ar-offer" + (sold || dup ? " sold" : "") + (o.f ? " fallen" : ""));
    n.appendChild(cardTile({ g: o.g, t: o.t, o: o.o }, {
      dim: sold || dup, fmt: "full", w: 186,
      tag: o.f && !sold ? W.upper(T.backAlive) : null, tagClass: "back"
    }));
    if (sold || dup) {
      n.appendChild(el("div", "ar-sold", sold ? T.sold : T.inCamp));
      return n;
    }
    var can = MT.coins() >= price;
    /* a purchase: the word, and the price on its macaron. It stays tappable
       when the wallet is short — the refusal is said, not greyed silent. */
    var b = el("button", "btn btn-buy btn-sm btn-wide" + (can ? "" : " is-off"),
               "<span>" + W.upper(T.hire) + '</span><span class="btn-badge">' + icon("coin") + MT.num(price) + "</span>");
    b.addEventListener("click", function () {
      if (held(save, o.o || "blue", o.g, o.t)) { say(T.inCamp, whoName(o.o || "blue", o.g, o.t), "warn", "user"); return; }
      if (!MT.spend(price)) { say(T.tooPoor, "", "warn", "coin"); return; }
      MT.spendFx(MT.coins() + price, MT.coins());
      k.b.push(idx);
      var got = enrol(save, o.g, o.t, o.o);
      /* THE REGISTER REMEMBERS THEY CAME BACK: the line stays — it is still
         where they fell — and says they are in service again. */
      if (o.f) {
        for (var j = 0; j < save.x.length; j++) {
          var e = save.x[j];
          if (!e.back && e.g === o.g && (e.o || null) === (o.o || null) && (e.b != null ? e.b : e.t) === o.t) e.back = now();
        }
      }
      /* STRAIGHT INTO THE DECK IF THERE IS ROOM. A card bought and then not
         taken to the next battle because a second screen had to be visited is
         a purchase the player does not feel. */
      if (got && save.d.length < DECK_SIZE) save.d.push(got.i);
      persist();
      say(fill(o.f ? T.returned : T.recruited, { c: whoName(o.o || "blue", o.g, o.t) }),
          W.Lang.t(gradeName(o.g)) + " · " + tierName(o.t), "gain", "user");
      W.Sound.cue("uiWin", 0.8, 1, 780, 0.2, "triangle");
    });
    n.appendChild(b);
    return n;
  }

  /* HOW MANY OF THE SHELF THE WALLET COULD ACTUALLY PAY FOR — the tent's badge.
     Not "there are three cards for sale", which is true every day of the week
     and therefore says nothing. */
  function affordable() {
    var k = save.k, n = 0, i, o;
    if (!k || now() - k.t >= TENT_MS) return R_SLOTS;   // a fresh shelf is news on its own
    for (i = 0; i < k.o.length; i++) {
      o = k.o[i];
      if (k.b.indexOf(i) < 0 && !held(save, o.o || "blue", o.g, o.t) && MT.coins() >= priceOf(o.g, o.t)) n++;
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
    if (!s.l) s.l = [];
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
      if (free(c)) out.push(c);
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
      if (c) sq.push({ i: c.i, g: c.g, t: c.t, b: c.b != null ? c.b : null, o: c.o || null, f: "" });
    }
    sq.sort(cmpCard);
    var ok = !!m && run.z < run.p;
    var rep = { m: run.m, ok: ok, p: run.p, sq: sq, rw: [], pen: [] };
    if (m && ok) {
      for (i = 0; i < (m.reward || []).length; i++) rep.rw.push(rollReward(m.reward[i]));
    }
    /* EVERY CARD SENT SERVED, and a squad brought home rolls each of them
       for a promotion. The report shows who climbed (`u`) as it was written
       — the squad as it LEFT, which is the card the player sent — and the
       card that congratulates them follows it (`announce`). */
    for (i = 0; i < sq.length; i++) {
      if (serve(byId(sq[i].i), ok, "mission")) sq[i].u = byId(sq[i].i).t;
    }
    if (m && !ok) {
      for (i = 0; i < (m.fail || []).length; i++) {
        var f = m.fail[i];
        if (f.kind === "coins") rep.pen.push({ kind: "coins", n: f.n | 0 });
        else strike(sq, f.kind, f.n | 0, run.m);
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
  function strike(sq, kind, n, mid) {
    var left = [], k, pick, c;
    for (k = 0; k < sq.length; k++) if (!sq[k].f) left.push(sq[k]);
    for (k = 0; k < n && left.length; k++) {
      pick = left.splice(Math.floor(Math.random() * left.length), 1)[0];
      c = byId(pick.i);
      if (!c) continue;
      if (kind === "wound" && inInfirmary() < BEDS) { c.w = now() + HEAL_MS; pick.f = "hurt"; }
      else { retire(c, kind === "wound" ? "wounds" : "mission", mid); pick.f = "lost"; }
    }
  }

  /* What a success pays, decided when the report is written so the card
     shows the very sticker and the very officer the tap will hand over. */
  function rollReward(rw) {
    if (rw.kind === "sticker") return { kind: "sticker", n: MT.roll() };
    if (rw.kind === "card") {
      /* AN OFFICER NOBODY IN THE CAMP ALREADY IS: drawn among the ranges'
         free faces, then among the grades' free tiers; a range whose every
         officer is held pays what the one it would have been costs at the
         tent. */
      var r = rw.r || [4, 6], t = rw.t || [0, 1], h = heldKeys(save), pool = [], g, d, k;
      for (g = r[0]; g <= r[1]; g++) {
        if (!GRADE[g]) continue;
        for (d = clamp(t[0], 0, TOP); d <= clamp(t[1], 0, TOP); d++) if (!h[ck("blue", g, d)]) pool.push({ g: g, t: d });
      }
      if (!pool.length) {
        for (g = r[0]; g <= r[1]; g++) {
          if (!GRADE[g]) continue;
          d = freeTier(save, "blue", g, clamp(t[0], 0, TOP));
          if (d >= 0) pool.push({ g: g, t: d });
        }
      }
      if (!pool.length) {
        g = GRADE[r[1]] ? r[1] : CONSCRIPT.r;
        return { kind: "coins", n: priceOf(g, clamp(t[1], 0, TOP)) };
      }
      k = pool[Math.floor(Math.random() * pool.length)];
      return { kind: "card", g: k.g, t: k.t };
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
    /* INTO THE HISTORY, whole: a report read once is still the record of what
       that squad did, and the tab re-opens it as it was written. */
    rep.at = now();
    s.l.unshift(rep);
    if (s.l.length > M_LOG) s.l.length = M_LOG;
    for (i = 0; i < rep.rw.length; i++) {
      rw = rep.rw[i];
      node = card.querySelector('[data-rw="' + i + '"]');
      if (rw.kind === "card") {
        got = enrol(save, rw.g, rw.t);
        if (got) {
          if (save.d.length < DECK_SIZE) save.d.push(got.i);
          say(fill(T.recruited, { c: whoName("blue", rw.g, rw.t) }),
              W.Lang.t(gradeName(rw.g)) + " · " + tierName(rw.t), "gain", "user");
        } else {
          /* the officer joined by another door since the report was
             written: every officer is one person, so this one is paid in
             what they would have cost at the tent */
          var paid = MT.reward("coins", priceOf(rw.g, rw.t));
          before = MT.coins();
          MT.grant(paid);
          fly.push({ rw: paid, from: node ? node.getBoundingClientRect() : null, before: before, tag: true });
          say(T.inCamp, whoName("blue", rw.g, rw.t), "info", "user");
        }
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
    /* THREE SECTIONS AND NO SUBTITLE: the count the subtitle carried is the
       squads' section's own, and a screen does not say one number twice. */
    head(RT, T.misTitle, "");

    /* 1. THE BOARD FIRST, as SLOTS — it is what the tab is opened to pick
       from. A mission sent leaves its slot empty until the board is rolled
       again, which is when the note under it says. NO AD ROLLS IT EARLY: a
       board bought again is a board shopped for the easy mission, which is
       what the clock is there to prevent. */
    box.appendChild(sec(T.misBoard, s.o.length + " / " + M_OFFERS));
    for (i = 0; i < s.o.length; i++) box.appendChild(missionTile(MISSION[s.o[i]]));
    for (i = s.o.length; i < M_OFFERS; i++) box.appendChild(freeRow(T.boardFree));
    var note = el("div", "ar-note");
    note.textContent = fill(T.boardNext, { t: untilText(s.t + BOARD_MS - now()) });
    box.appendChild(note);

    /* 2. UNDER WAY, as slots too: the reports written and not collected, the
       squads away (the first back first), then one free slot per squad the
       camp could still send — so the limit is seen, not learned on a refusal. */
    var runs = s.r.slice().sort(function (a, b) { return a.e - b.e; });
    box.appendChild(sec(T.misAway, s.r.length + " / " + M_RUN));
    var list = el("div", "ar-list");
    for (i = 0; i < s.q.length; i++) list.appendChild(reportRow(s.q[i]));
    for (i = 0; i < runs.length; i++) list.appendChild(runRow(runs[i]));
    for (i = s.r.length; i < M_RUN; i++) list.appendChild(freeRow(T.runFree));
    box.appendChild(list);

    /* 3. THE REPORTS ALREADY READ, newest first: what each squad did, a
       success or a failure at a glance, and the report itself on a tap. */
    box.appendChild(sec(T.misLog, s.l.length ? String(s.l.length) : ""));
    if (!s.l.length) { box.appendChild(el("p", "ar-none", T.logEmpty)); return; }
    var log = el("div", "ar-list");
    for (i = 0; i < s.l.length; i++) log.appendChild(logRow(s.l[i]));
    box.appendChild(log);
  }

  /* A slot nobody is in: the token's footprint, dashed, and the word. */
  function freeRow(word) {
    var row = el("div", "ar-row ar-run free");
    row.appendChild(el("div", "ar-free-slot"));
    row.appendChild(text("div", "ar-rowsub", W.upper(word)));
    return row;
  }

  /* A report of the history: the squad's leader, the mission, the outcome
     on a stamp — the one thing the row is read for — and a door back into
     the report as it was written. */
  function logRow(rep) {
    var m = MISSION[rep.m], ids = [], i;
    for (i = 0; i < rep.sq.length; i++) ids.push(rep.sq[i].i);
    var row = el("button", "ar-row ar-log " + (rep.ok ? "ok" : "ko"));
    row.appendChild(squadStack(ids, rep.sq));
    var mid = el("div", "ar-mid");
    mid.appendChild(text("div", "ar-rowname", W.upper(m ? loc(m.title) : "???")));
    var sub = el("div", "ar-rowsub");
    if (m) sub.appendChild(pips(m.d));
    sub.appendChild(text("span", "ar-odds " + oddsClass(rep.p), fill(T.oddsShort, { p: pct(rep.p) })));
    mid.appendChild(sub);
    row.appendChild(mid);
    row.appendChild(el("span", "ar-log-stamp",
      icon(rep.ok ? "check" : "skull", "ar-ci") + "<span>" + W.upper(rep.ok ? T.repWin : T.repLose) + "</span>"));
    row.setAttribute("aria-label", (m ? loc(m.title) : "") + " — " + (rep.ok ? T.repWin : T.repLose));
    row.addEventListener("click", function () {
      openReport(rep, true);
      W.Sound.cue("uiRow", 0.45, 1.1, 420, 0.08);
    });
    return row;
  }

  function sec(label, count) {
    var h = el("h3", "ar-sec");
    h.innerHTML = W.upper(label) + (count !== "" ? ' <b>' + count + '</b>' : "");
    return h;
  }

  /* A MISSION ON THE BOARD IS ONE LINE, and the whole of it is the door to
     its briefing: the token of the grade it favours (a spy for a spy's job,
     the "+10" on it), the title and the five pips, then how long, how many
     and the first thing it pays. The pretext and the full stakes are the
     briefing's, where the choice is made — a board of five panels of prose
     showed one mission and a half, and a board is read to pick one. */
  function missionTile(m) {
    var full = mstate().r.length >= M_RUN;
    var n = el("button", "ar-mis row" + (full ? " off" : ""));
    var lead = el("div", "ar-mis-lead");
    if (m.favor && GRADE[m.favor]) {
      lead.appendChild(cardTile({ g: m.favor, t: 0 }, { fmt: "tiny", w: 72, tag: "+" + M_FAVOR, tagClass: "in" }));
    } else {
      lead.classList.add("plain");
      lead.innerHTML = icon("compass", "ar-ci");
    }
    n.appendChild(lead);
    var mid = el("div", "ar-mid");
    var top = el("div", "ar-mis-top");
    top.appendChild(text("h4", "ar-mis-title", W.upper(loc(m.title))));
    top.appendChild(pips(m.d));
    mid.appendChild(top);
    var row = el("div", "ar-chips line");
    var sq = m.squad || [2, 5];
    row.appendChild(mkChip("clock", hoursText(m.hours)));
    row.appendChild(mkChip("deck", fill(sq[0] === sq[1] ? T.squadN : T.squadRange, { a: sq[0], b: sq[1] })));
    if (m.reward && m.reward.length) row.appendChild(mkChip(rewardIcon(m.reward[0]), rewardText(m.reward[0]), "gain"));
    mid.appendChild(row);
    n.appendChild(mid);
    n.appendChild(el("i", "ar-mis-go", icon("next", "ar-ci")));
    n.setAttribute("aria-label", loc(m.title) + " — " + T.prepare);
    n.addEventListener("click", function () {
      if (mstate().r.length >= M_RUN) { say(T.runFull, fill(T.runFullSub, { n: M_RUN }), "warn", "clock"); return; }
      RT.brief = { m: m.id, pick: [] };
      RT.body.scrollTop = 0;
      paintRecruit();
      W.Sound.cue("uiRow", 0.45, 1.1, 420, 0.08);
    });
    return n;
  }

  /* A squad away: its leader's token, where it went, the odds it left on and
     how long until it is back — then the report. NO AD BRINGS IT HOME: the
     wait is the reason to come back to the game later, and a squad that
     could be bought back the moment it left would be no reason at all. */
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
      var b = el("button", "btn btn-sm", icon("file", "ar-ci") + "<span>" + W.upper(T.readReport) + "</span>");
      b.addEventListener("click", function () {
        if (mstate().r.indexOf(run) < 0) return;
        openReport(resolve(run));
      });
      row.appendChild(b);
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
    var b = el("button", "btn btn-sm", icon("file", "ar-ci") + "<span>" + W.upper(T.readReport) + "</span>");
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
    if (best) box.appendChild(cardTile(face(best), { fmt: "tiny", w: 76 }));
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
    var pick = [];
    /* a card that stopped being available since it was picked is let go */
    for (i = 0; i < RT.brief.pick.length; i++) {
      c = byId(RT.brief.pick[i]);
      if (c && free(c)) pick.push(c);
    }
    RT.brief.pick = [];
    for (i = 0; i < pick.length; i++) RT.brief.pick.push(pick[i].i);
    head(RT, T.briefTitle, "");

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
    for (i = 0; i < sq[1]; i++) slots.appendChild(i < pick.length ? squadSlot(pick[i], m) : needSlot(i < sq[0], m));
    box.appendChild(slots);
    RT.justIn = null;

    box.appendChild(oddsGauge(pick, m));

    var short = sq[0] - pick.length;
    var acts = el("div", "ar-acts");
    var go = el("button", "btn" + (short > 0 ? " is-off" : ""),
                icon("compass", "ar-ci") + "<span>" + W.upper(T.send) + "</span>");
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
    var no = el("button", "btn btn-plate", "<span>" + W.upper(T.cancel) + "</span>");
    no.addEventListener("click", function () {
      RT.brief = null;
      RT.body.scrollTop = 0;
      paintRecruit();
    });
    acts.appendChild(no);
    box.appendChild(acts);
  }

  /* THE ODDS, live: every card taken or left moves them, which is the whole
     of what the player is weighing up on this screen. Drawn as the album's
     shelves draw theirs (meta.css, VERSUS ONE) — a track and the chance in a
     pill — with the same reading of the notch and the hatch: the notch is the
     squad on its own merits, the hatch what the grade this mission favours
     adds past it. The screen is rebuilt on every change, so the track starts
     from the last odds drawn and slides to the new ones. */
  function oddsGauge(pick, m) {
    /* the same squad, read against the same mission with no grade favoured */
    var p = chanceOf(pick, m), base = m.favor ? chanceOf(pick, { d: m.d }) : p;
    var last = RT.brief.last != null ? RT.brief.last : p;
    var g = el("div", "ar-gauge " + oddsClass(p));
    g.appendChild(text("div", "ar-gauge-l", W.upper(T.oddsLabel)));
    var vs = el("div", "al-vs");
    var tk = el("div", "al-tk");
    var bar = el("i", "b"), gain = el("i", "g"), notch = el("s");
    tk.appendChild(bar); tk.appendChild(gain); tk.appendChild(notch);
    vs.appendChild(tk);
    var ch = el("div", "al-ch" + (p ? "" : " nil")), wash = el("u");
    ch.appendChild(wash);
    ch.appendChild(text("b", "", pct(p)));
    vs.appendChild(ch);
    g.appendChild(vs);
    function at(lo, hi) {
      bar.style.width = (lo * 100).toFixed(1) + "%";
      gain.style.left = (lo * 100).toFixed(1) + "%";
      gain.style.width = ((hi - lo) * 100).toFixed(1) + "%";
      notch.style.left = (lo * 100).toFixed(1) + "%";
      notch.style.display = hi > lo ? "" : "none";
      wash.style.width = (hi * 100).toFixed(1) + "%";
    }
    at(Math.min(base, last), last);
    requestAnimationFrame(function () {
      void g.offsetWidth;
      at(base, p);
      if (Math.abs(p - last) > 1e-9) ch.className += p > last ? " up" : " down";
    });
    RT.brief.last = p;
    return g;
  }

  /* A SQUAD SLOT IS A DECK SLOT: a card taken is a door to its file with the
     `−` on its corner, a gap is the `+` that opens the picker — the deck's own
     card over the briefing, asking the same question of the cards free to go.
     A token wears the one fact that matters here: favoured by this mission —
     IN DECK was a word too small to read at a token's size, on nearly every
     token of the picker. */
  function squadSlot(c, m) {
    var w = el("div", "ar-slot-w");
    var b = el("button", "ar-slot" + (RT.justIn === c.i ? " arrive" : ""));
    b.appendChild(cardTile(face(c), {
      fmt: "tiny", w: 86, tag: m.favor === c.g ? "+" + M_FAVOR : null, tagClass: "in"
    }));
    b.setAttribute("aria-label", T.fileOpen);
    b.addEventListener("click", function () { openFile(whoOf(c), "blue", b); });
    w.appendChild(b);
    var del = el("button", "ar-act del", "−");
    del.setAttribute("aria-label", T.squadDrop);
    del.addEventListener("click", function () { togglePick(c.i); });
    w.appendChild(del);
    return w;
  }
  function needSlot(need, m) {
    var b = el("button", "ar-slot empty" + (need ? " need" : ""));
    b.appendChild(el("span", "ar-plus", "+"));
    b.setAttribute("aria-label", T.pickTitle);
    b.addEventListener("click", function () { openSquadPicker(m); });
    return b;
  }

  function openSquadPicker(m) {
    var sq = m.squad || [2, 5];
    if (RT.brief.pick.length >= sq[1]) { say(T.squadFull, "", "warn"); return; }
    pickCard({
      grade: RT.pick, take: T.squadTake,
      eyebrow: T.squadSec + " · " + RT.brief.pick.length + " / " + sq[1],
      title: T.pickTitle, empty: T.availNone,
      list: function () {
        var all = available(), out = [];
        for (var i = 0; i < all.length; i++) if (RT.brief.pick.indexOf(all[i].i) < 0) out.push(all[i]);
        return out;
      },
      tag: function (c) {
        return m.favor === c.g ? { word: "+" + M_FAVOR, cls: "in" } : null;
      },
      choose: function (c) {
        if (!RT.brief || RT.brief.pick.length >= sq[1] || RT.brief.pick.indexOf(c.i) >= 0 || !free(c)) return;
        RT.justIn = c.i;
        togglePick(c.i);
      }
    });
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
     collecting, since what it pays is only granted on that tap.

     `past` is the same report RE-READ out of the history: it was collected
     already, so it is put away like any card and pays nothing. */
  function openReport(rep, past) {
    var m = MISSION[rep.m] || null, done = false, off = null;
    var lead = rep.sq[0] || null;
    var leader = lead ? whoName(lead.o || "blue", lead.g, baseOf(lead)) : T.theSquad;
    MD.open({
      kind: "ar-report", dismiss: !!past, esc: !!past,
      /* what the mission cost and who it promoted are told once the report
         is put away, on the cards that say it (`announce`) */
      onClose: function () { if (!past && done) announce(); },
      eyebrow: T.repEyebrow, title: m ? loc(m.title) : T.misTitle,
      tap: rep.rw.length && !past ? T.repCollect : T.repClose,
      fill: function (card, close, handle) {
        /* THE BRIEF THE SQUAD LEFT ON, then how it went: a report is read
           hours after the mission was picked, and an outcome with no pretext
           in front of it is the end of a story whose start was forgotten. */
        if (m && m.brief) card.appendChild(text("p", "ar-rep-brief", loc(m.brief)));
        card.appendChild(el("div", "ar-stamp " + (rep.ok ? "ok" : "ko"), W.upper(rep.ok ? T.repWin : T.repLose)));
        card.appendChild(text("p", "ar-rep-text",
          fill(m ? loc(rep.ok ? m.win : m.lose) : "", { leader: leader })));

        var row = el("div", "ar-rep-squad" + (PAINTED ? " painted" : ""));
        for (var i = 0; i < rep.sq.length; i++) {
          var q = rep.sq[i];
          row.appendChild(cardTile(face(q), {
            fmt: "tiny", w: 76, dim: q.f === "lost",
            tag: q.f === "hurt" ? T.fateHurt : q.f === "lost" ? T.fateLost : q.u != null ? T.fateUp : null,
            tagClass: q.f === "hurt" ? "hurt" : q.f === "lost" ? "lost" : "up"
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
        if (past) { MT.tapOut(handle.box, close); return; }

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

  /* ── 8d''. the camp: the posts, and every card it holds ───────────────── */

  /* TWO HALVES ON ONE PAGE. The POSTS first — five slots, one officer each,
     filled with the deck's own picker and emptied with the same `−` — since
     they are the one thing on the page with something to do. Then the ROLL:
     every card the camp holds, the prisoners included, each with what it is
     doing today, because a card nobody can find is a card nobody plays.

     A POST IS A JOB AND A JOB IS EXCLUSIVE: the picker offers only a free
     card out of the reserve (`free`, and not in the deck), and a card at a
     post is out of the deck picker, the squads and the round's deck until
     the `−` gives it back. */
  var POST_W = 112;
  var ROLL_W = 150;

  function paintCamp() {
    var box = RT.pane.camp, i, n = 0, row, all, grid;
    head(RT, T.campTitle, T.campSub);
    box.innerHTML = "";
    for (i = 0; i < POSTS.length; i++) if (postCard(POSTS[i].k)) n++;
    box.appendChild(sec(T.campPosts, n + " / " + POSTS.length));
    row = el("div", "ar-posts" + (PAINTED ? " painted" : ""));
    for (i = 0; i < POSTS.length; i++) row.appendChild(postSlot(POSTS[i]));
    box.appendChild(row);
    RT.justIn = null;

    all = rollList();
    box.appendChild(sec(T.campRoll, String(all.length)));
    if (!all.length) { box.appendChild(el("p", "ar-none", T.campNone)); return; }
    grid = el("div", "ar-roll" + (PAINTED ? " painted" : ""));
    for (i = 0; i < all.length; i++) grid.appendChild(rollCell(all[i]));
    box.appendChild(grid);
  }

  /* A post: its officer (a door to their file, the `−` on its corner) or
     the `+` that opens the picker — and the name of the post under it. */
  function postSlot(p) {
    var cell = el("div", "ar-post"), c = postCard(p.k), b;
    if (c) {
      var w = el("div", "ar-slot-w");
      b = el("button", "ar-slot" + (RT.justIn === c.i ? " arrive" : ""));
      b.appendChild(cardTile(face(c), { fmt: "mid", w: POST_W }));
      b.setAttribute("aria-label", T.fileOpen);
      b.addEventListener("click", function () { openFile(whoOf(c), "blue", b); });
      w.appendChild(b);
      var del = el("button", "ar-act del", "−");
      del.setAttribute("aria-label", T.postDrop);
      del.addEventListener("click", function () {
        if (save.po[p.k] !== c.i) return;
        delete save.po[p.k];
        persist();
        W.Sound.cue("uiRow", 0.4, 0.9, 400, 0.06);
      });
      w.appendChild(del);
      cell.appendChild(w);
    } else {
      b = el("button", "ar-slot empty");
      b.appendChild(el("span", "ar-plus", "+"));
      b.setAttribute("aria-label", T.postPick);
      b.addEventListener("click", function () { openPostPicker(p.k); });
      cell.appendChild(b);
    }
    cell.appendChild(el("div", "ar-post-l", icon(p.icon, "ar-ci") + "<span>" + W.upper(T["post_" + p.k]) + "</span>"));
    return cell;
  }

  function openPostPicker(k) {
    if (postCard(k)) return;
    pickCard({
      grade: RT.pick, take: T.postTake,
      eyebrow: T["post_" + k], title: T.postPick,
      choose: function (c) {
        if (postCard(k) || inDeck(c.i) || !free(c)) return;
        save.po[k] = c.i;
        RT.justIn = c.i;
        persist();
        say(fill(T.posted, { c: whoName(c.o || "blue", c.g, baseOf(c)) }), T["role_" + k], "good", "check");
        W.Sound.cue("uiRow", 0.45, 1.15, 420, 0.07);
      }
    });
  }

  /* WHAT A CARD IS DOING, one answer: a post first (the one the clock never
     ends), then a wound, a mission, the deck, and the reserve for a card
     doing nothing. The rank is the roll's order. */
  var ROLL_RANK = { post: 0, deck: 1, away: 2, hurt: 3, idle: 4, jail: 5 };

  function statusOf(c) {
    var k = postOf(c.i), run;
    if (k) return { s: "post", word: T["role_" + k], ico: POST[k].icon, k: k };
    if (!fit(c)) return { s: "hurt", word: T.stHurt, ico: "heal", when: untilText(c.w - now()) };
    run = awayRun(c.i);
    if (run) return { s: "away", word: T.stAway, ico: "compass", when: untilText(run.e - now()) };
    if (inDeck(c.i)) return { s: "deck", word: T.stDeck, ico: "deck" };
    return { s: "idle", word: T.stIdle, ico: "check" };
  }

  function rollList() {
    var out = [], i, c, p, st;
    for (i = 0; i < save.r.length; i++) {
      c = save.r[i];
      out.push({ c: c, st: statusOf(c) });
    }
    for (i = 0; i < save.p.length; i++) {
      p = save.p[i];
      st = p.u <= now() ? { s: "jail", word: T.stTurned, ico: "check" }
                        : { s: "jail", word: T.stJail, ico: "lock", when: untilText(p.u - now()) };
      out.push({ c: { g: p.g, t: p.t }, st: st, jail: p });
    }
    return stable(out, function (a, b) {
      var d = ROLL_RANK[a.st.s] - ROLL_RANK[b.st.s];
      if (d) return d;
      if (a.st.k && b.st.k) return postIndex(a.st.k) - postIndex(b.st.k);
      return cmpCard(a.c, b.c);
    });
  }
  function postIndex(k) {
    for (var i = 0; i < POSTS.length; i++) if (POSTS[i].k === k) return i;
    return 0;
  }

  /* One card of the roll: the card (a door to its file), then what it is
     doing — the word, and how long it lasts where it has an end. A prisoner
     who has turned is drawn in the blue cloth, as the prison draws them. */
  function rollCell(e) {
    var st = e.st, c = e.c, jail = !!e.jail;
    var turned = jail && e.jail.u <= now();
    var n = el("div", "ar-cell roll " + st.s);
    var w = el("div", "ar-slot-w");
    w.appendChild(fileDoor(
      cardTile({ g: c.g, t: c.t, b: c.b, o: jail ? (turned ? "red" : null) : c.o },
               { foe: jail && !turned, dim: st.s === "hurt" || st.s === "away", fmt: "mid", w: ROLL_W }),
      { o: jail ? "red" : (c.o || "blue"), g: c.g, t: c.t, b: c.b }, jail && !turned ? "red" : "blue"));
    n.appendChild(w);
    var line = el("div", "ar-st " + st.s, icon(st.ico, "ar-ci") + "<span></span>");
    line.lastChild.textContent = W.upper(st.word);
    n.appendChild(line);
    if (st.when) n.appendChild(text("div", "ar-st-t", st.when));
    return n;
  }

  /* ── 8d'''. the camp: the register ────────────────────────────────────── */

  /* EVERY CARD LOST, newest first: a wound the infirmary had no bed for, a
     squad that did not come back. A card leaves the roster through `retire`
     and nowhere else, and `retire` writes here, so the list cannot miss one.
     It pays nothing and asks nothing — it is the price of the war — so every
     row is only a door to who they were. */
  function paintRegister() {
    var box = RT.pane.reg, i, list;
    head(RT, T.regTitle, "");
    box.innerHTML = "";
    box.appendChild(sec(T.regSec, String(save.x.length)));
    if (!save.x.length) { box.appendChild(el("p", "ar-none", T.regNone)); return; }
    list = el("div", "ar-list");
    for (i = 0; i < save.x.length; i++) list.appendChild(regRow(save.x[i]));
    box.appendChild(list);
  }

  /* HOW A CARD WAS LOST, and each cause wears its own pictogram — on the
     card's corner and in front of the line that says it: a sword for a
     battle (the wound the infirmary had no bed for), a compass for a squad
     that did not come back, a heart for a wound brought home from a
     mission with no bed to lay it in. */
  var CAUSE = { battle: "sword", mission: "compass", wounds: "heal" };
  function causeText(e) {
    var m = e.m ? MISSION[e.m] : null;
    if (e.why === "mission") return m ? fill(T.lostMission, { m: loc(m.title) }) : T.lostMissionAny;
    if (e.why === "wounds") return m ? fill(T.lostWounds, { m: loc(m.title) }) : T.lostWoundsAny;
    return T.lostBattle;
  }
  function causeIcon(e) { return CAUSE[e.why] || "skull"; }
  /* the card a register entry draws: the tier it died at on the face, the
     one it was raised at for who it is */
  function lostFace(e) { return { g: e.g, t: e.t, b: e.b, o: e.o }; }
  function lostWho(e) { return { o: e.o || "blue", g: e.g, t: e.t, b: e.b }; }
  function lostCard(e, fmt, w) {
    var tile = cardTile(lostFace(e), { fmt: fmt, w: w });
    tile.appendChild(el("i", "ar-cause " + (e.why || "battle"), icon(causeIcon(e), "ar-ci")));
    return tile;
  }

  function regRow(e) {
    var row = el("div", "ar-row ar-reg" + (e.back ? " back" : ""));
    var side = e.o || "blue";
    row.appendChild(fileDoor(lostCard(e, "tiny", 76), lostWho(e), "blue"));
    var mid = el("div", "ar-mid");
    mid.appendChild(text("div", "ar-rowname", W.upper(whoName(side, e.g, e.b != null ? e.b : e.t))));
    mid.appendChild(text("div", "ar-rowsub", W.upper(W.Lang.t(gradeName(e.g))) + " · " + tierName(e.t)));
    var when = el("div", "ar-when ko " + (e.why || "battle"), icon(causeIcon(e), "ar-ci") + "<span></span>");
    when.lastChild.textContent = causeText(e);
    mid.appendChild(when);
    /* the tent found them alive: the line stays, and says so */
    if (e.back) mid.appendChild(el("div", "ar-when ok", icon("check", "ar-ci") + "<span>" + T.regBack + "</span>"));
    row.appendChild(mid);
    row.appendChild(text("span", "ar-reg-date", dateText(e.at)));
    return row;
  }

  /* The day a card was lost, the way a calendar reads it. */
  function dateText(at) {
    try {
      return new Date(at).toLocaleDateString(LANG === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short" });
    } catch (err) {
      return "";
    }
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
    var p = who.obj || who.blind ? null : castOf(who.o, who.g, who.b != null ? who.b : who.t);
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
          : cardTile({ g: who.g, t: who.t, b: who.b, o: who.o !== team ? who.o : null },
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
  /* THE BACK KEEPS THE TIER THEY WERE RAISED AT. The face climbs with every
     promotion — its frame, its badge and its pips are the rank the card
     fights at — and the back does not: it is the file opened the day they
     joined, so the player can always turn a card over and see where it
     started. One fact says where it stands now. */
  function fileBack(who, p, team) {
    var base = who.b != null ? who.b : who.t;
    var facts = p ? [fill(T.age, { n: p.age }), T["g_" + p.gender] || p.gender] : [];
    if (base !== who.t) facts.push(fill(T.fileUp, { t: tierName(who.t) }));
    if (PAINTED && W.Game.cardBack) {
      var lore = p && p.lore || {};
      var wrap = el("div", "ar-flip-b painted");
      wrap.appendChild(W.Game.cardBack(
        { rank: who.g, tier: base, o: who.o !== team ? who.o : null },
        { w: FILE_W, side: team === "red" ? "red" : "blue" },
        {
          grade: W.upper(W.Lang.t(gradeName(who.g))),
          first: p ? W.upper(p.first) : "",
          last: p ? W.upper(p.last) : "???",
          facts: facts,
          skill: gradeSkill(who.g),
          lore: lore[LANG] || lore.en || "",
          army: W.upper(who.o === "red" ? T.armyRed : T.armyBlue),
          turn: who.o !== team ? W.upper(T.turncoat) : ""
        }));
      return wrap;
    }
    return plainBack(who, p, team, base, facts);
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
  function plainBack(who, p, team, base, facts) {
    var b = el("div", "ar-flip-b ar-fb " + (who.o === "red" ? "red" : "blue") + " t" + clamp(base, 0, TOP));
    var top = el("div", "ar-fb-top");
    top.appendChild(text("span", "ar-fb-grade", W.upper(W.Lang.t(gradeName(who.g)))));
    top.appendChild(text("span", "ar-fb-tier", tierName(base)));
    b.appendChild(top);
    if (!p) {
      b.appendChild(text("div", "ar-fb-last", "???"));
      if (gradeSkill(who.g)) b.appendChild(text("p", "ar-fb-skill", gradeSkill(who.g)));
      return b;
    }
    b.appendChild(text("div", "ar-fb-first", W.upper(p.first)));
    b.appendChild(text("div", "ar-fb-last", W.upper(p.last)));
    var fl = el("div", "ar-fb-facts");
    for (var i = 0; i < facts.length; i++) fl.appendChild(text("span", "", facts[i]));
    b.appendChild(fl);
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

  /* ── 8f. the news: who fell, and who climbed ───────────────────────── */

  /* TWO THINGS HAPPEN TO A CARD WHILE THE PLAYER IS LOOKING ELSEWHERE — at
     an end screen, at a mission report — and both are told on a card of
     their own the next time they stand in the village: the dead first,
     since a loss read after a celebration reads as an afterthought, then
     the promotions. A mission's report says the same thing the moment it
     is put away (`openReport`). One call, and it is a no-op when there is
     nothing to tell, so every door into the village can make it. */
  var announcing = false;

  function announce(then) {
    then = then || function () {};
    var dead = [], i;
    for (i = 0; i < save.x.length; i++) if (save.x[i].nw) dead.push(save.x[i]);
    if (announcing || (!dead.length && !save.up.length)) { then(); return; }
    announcing = true;
    openFallen(dead.reverse(), function () {
      openPromos(function () { announcing = false; then(); });
    });
  }

  /* After a view change, once the screen has settled: a card opened on the
     same beat as the village is opened under it, or over a card the village
     itself opens (the prisoner offer) — which then keeps the news for the
     next arrival rather than stacking two cards. */
  function announceSoon() {
    setTimeout(function () {
      if (VW.top() === "village" && !MD.any()) announce();
    }, ANNOUNCE_MS);
  }
  var ANNOUNCE_MS = 420;

  /* IN MEMORIAM. ONE card for every death since the last time, however many
     there were — a card per loss is a funeral the player taps through — and
     it says how each of them died, then who: the card itself when it is one
     (the medium card), the tokens when it is several. Every card on it is
     a door to the register, where the line stays; a tap anywhere else puts
     it away. Marked told the moment it opens, so a reload never holds the
     same funeral twice. */
  var FALLEN_W = 190, FALLEN_TINY = 86;

  function openFallen(list, then) {
    if (!list.length) { then(); return; }
    var i, e, one = list.length === 1;
    for (i = 0; i < list.length; i++) delete list[i].nw;
    MT.setArmy(save);
    MD.open({
      kind: "ar-fallen", dismiss: true, esc: true, onClose: then,
      eyebrow: one ? T.fallenEyebrow1 : fill(T.fallenEyebrowN, { n: list.length }),
      title: T.fallenTitle,
      tap: T.fallenTap,
      fill: function (card, close) {
        /* HOW, before who: one line per cause, with its pictogram — the
           register's own words, so the two say it the same way */
        var why = el("div", "ar-fallen-why"), by = {}, order = [], k;
        for (i = 0; i < list.length; i++) {
          k = list[i].why || "battle";
          if (!by[k]) { by[k] = []; order.push(k); }
          by[k].push(list[i]);
        }
        for (i = 0; i < order.length; i++) {
          k = order[i];
          e = by[k][0];
          var line = el("p", "ar-fallen-l " + k, icon(causeIcon(e), "ar-ci") + "<span></span>");
          line.lastChild.textContent = one
            ? fill(T["fallen1_" + k] || T.fallen1_battle, { c: whoName(e.o || "blue", e.g, e.b != null ? e.b : e.t), m: missionTitle(e) })
            : fill(T[(by[k].length === 1 ? "fallenS_" : "fallenN_") + k] || T.fallenN_battle, { n: by[k].length });
          why.appendChild(line);
        }
        card.appendChild(why);

        var row = el("div", "ar-fallen-list" + (one ? " one" : "") + (PAINTED ? " painted" : ""));
        for (i = 0; i < list.length; i++) row.appendChild(fallenDoor(list[i], one, close));
        card.appendChild(row);
        card.appendChild(text("p", "ar-fallen-foot", one ? T.fallenFoot1 : T.fallenFootN));
      }
    });
    W.Sound.cue("defeat", 0.55, 0.8, 110, 0.6, "sine");
  }

  function missionTitle(e) {
    var m = e.m ? MISSION[e.m] : null;
    return m ? loc(m.title) : "";
  }

  /* One of the fallen: the card, greyed, the cause on its corner, the name
     under it where there is room for one — and the way to the register. */
  function fallenDoor(e, one, close) {
    var b = el("button", "ar-fallen-c");
    b.appendChild(lostCard(e, one ? "mid" : "tiny", one ? FALLEN_W : FALLEN_TINY));
    if (!one) b.appendChild(text("span", "ar-fallen-n", W.upper(whoName(e.o || "blue", e.g, e.b != null ? e.b : e.t))));
    b.setAttribute("aria-label", T.fallenOpen);
    b.addEventListener("click", function () {
      close();
      openRegister();
    });
    return b;
  }

  /* The camp's REGISTER tab, from wherever the player is: the camp redrawn
     on it when it is already the screen on top, the camp opened on it
     otherwise. */
  function openRegister() {
    if (VW.top() === "recruit" && RT) {
      RT.brief = null;
      RT.tab = "reg";
      RT.body.scrollTop = 0;
      paintRecruit();
    } else {
      VW.go("recruit", { tab: "reg" });
    }
  }

  /* PROMOTED. One card for every promotion since the last time, turned
     like the pages of a letter: each page is the officer before and after,
     side by side at the medium size — the face climbs, the person does not,
     so the two cards are the same portrait in two frames — with the name,
     the step and what earned it under them. A tap turns the page and the
     last tap puts it away; neither the scrim nor a stray key skips a page
     nobody read. */
  var UP_W = 200;

  function openPromos(then) {
    var list = save.up.splice(0, save.up.length);
    if (!list.length) { then(); return; }
    MT.setArmy(save);
    var ix = 0, off = null, done = false;
    MD.open({
      kind: "ar-promo", dismiss: false, esc: false, onClose: then,
      onHide: function () { if (off) off(); },
      title: T.upTitle,
      fill: function (card, close, handle) {
        var stage = el("div", "ar-up-stage");
        card.appendChild(stage);
        page();
        handle.box.addEventListener("click", function (ev) {
          if (ev.target.closest && ev.target.closest("button")) return;
          next();
        });
        off = keysOut(next);

        function page() {
          var e = list[ix];
          handle.set({
            eyebrow: list.length > 1 ? fill(T.upEyebrowN, { i: ix + 1, n: list.length }) : T.upEyebrow,
            tap: ix < list.length - 1 ? T.upNext : T.upClose
          });
          stage.innerHTML = "";
          var row = el("div", "ar-up" + (PAINTED ? " painted" : ""));
          row.appendChild(upCard(e, e.f, "before"));
          row.appendChild(el("div", "ar-up-arrow", icon("next", "ar-ci")));
          row.appendChild(upCard(e, e.t, "after"));
          stage.appendChild(row);
          stage.appendChild(text("div", "ar-up-name", W.upper(whoName(e.o || "blue", e.g, e.b))));
          stage.appendChild(text("p", "ar-up-line",
            fill(T.upLine, { g: W.Lang.t(gradeName(e.g)), a: tierName(e.f), b: tierName(e.t) })));
          stage.appendChild(text("p", "ar-up-why", T["upWhy_" + e.why] || T.upWhy_battle));
          W.Sound.cue("victory", 0.6, 1 + ix * 0.04, 880, 0.2, "triangle");
        }
        function next() {
          if (done) return;
          if (ix < list.length - 1) { ix++; page(); return; }
          done = true;
          close();
        }
      }
    });
  }

  /* One side of the step: the card at that tier — the portrait is the
     tier the officer was raised at on both — and the letter under it in
     the tier's own colour. */
  function upCard(e, t, cls) {
    var n = el("div", "ar-up-c " + cls);
    n.style.setProperty("--ar", "var(--ar-t" + clamp(t, 0, 5) + ")");
    n.appendChild(cardTile({ g: e.g, t: t, b: e.b, o: e.o }, { fmt: "mid", w: UP_W }));
    n.appendChild(text("span", "ar-up-t", tierName(t)));
    return n;
  }

  /* ENTER, SPACE and ESCAPE turn the page, the one thing the card does.
     On the window in capture, so the shell's own ESCAPE never sees the
     press and peels the view under the card; unbound when the card goes. */
  function keysOut(fn) {
    function go(ev) {
      if (ev.key !== "Enter" && ev.key !== "Escape" && ev.key !== " ") return;
      ev.preventDefault(); ev.stopPropagation();
      fn();
    }
    window.addEventListener("keydown", go, true);
    return function () { window.removeEventListener("keydown", go, true); };
  }

  /* ── 9. the ad, and the one line this layer says ──────────────────────── */

  /* EVERY WAIT CAN BE BOUGHT OUT, AND THE PRICE IS AN AD. It is the same
     placeholder the rest of this shell offers — a card with a countdown that
     says what it is (packages/webshell/meta.js, `ad`) — so wiring a network in
     is one function body for all of it. Without this a player whose three best
     cards are in bandages has nothing to do for two days, which is not a
     mechanic, it is a closed door. */
  /* THE SHELL'S AD BUTTON (motor.css, .btn-pub): the play glyph, the line,
     "watch an ad" under it, and what the wait bought out pays — `reward` is
     the pictogram of it (a heart for the infirmary, a clock for a wait). */
  function adButton(label, done, cls, reward) {
    var b = el("button", "btn btn-pub" + (cls === "small" ? " btn-sm" : ""),
               icon("play") + '<span class="btn-txt"><b>' + W.upper(label) + "</b><i>" +
               MT.text("boostCost") + "</i></span>" + icon(reward || "clock", "btn-reward"));
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
    /* The codex holds no clock either, and a carousel rebuilt under the
       finger turning it would snap back to where it was. */
    if (top === "deck" && DK && DK.tab === "coll") return;
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
      show: function (o) {
        DK.tab = (o && o.tab) || "deck";
        DK.cx.ix = null;                  // the codex opens on the best card had
        DK.body.scrollTop = 0;
        paintDeck(); startBeat();
      }, hide: stopBeat,
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
        RT.tab = (o && o.tab) || (CAMP_TABS.indexOf("mis") >= 0 && missionsBack() ? "mis" : "tent");
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
    if (top !== "village") return;
    /* ...and the news after it: who fell, who climbed (`announce`) */
    if (offer) openOffer(announceSoon);
    else announceSoon();
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
      deckTitle: "Deck",
      deckSection: "Formation", slotN: "Slot {n}", fillBest: "Auto-fill",
      filled1: "1 card added", filledN: "{n} cards added",
      pickTitle: "Choose a card", pickEmpty: "No card is free to join the deck",
      deckTake: "Put this card in the deck",
      f_all: "All",
      f_had: "Owned", f_met: "Met", f_seen: "Seen", f_miss: "Missing",
      deckFullWarn: "The deck is full",
      deckDrop: "Leave this card behind", inDeck: "In deck",
      tab_deck: "Deck", tab_coll: "Collection",
      collTitle: "Collection",
      cx_blue: "Blue", cx_red: "Red", cx_turn: "Turncoats", cx_obj: "Objects",
      ghostTurn: "Enlist this officer from the prison to read their file",
      cxNone: "Nobody here", prev: "Previous", next: "Next",
      ghostBlue: "Recruit this officer to read their file",
      ghostRed: "Meet this officer in battle to read their file",
      fileOpen: "Read this officer's file", fileTurn: "Turn the card over",
      fileHint: "Tap the card to turn it over", age: "Age {n}",
      g_man: "Man", g_woman: "Woman", g_male: "Male", g_female: "Female",
      armyBlue: "Blue army", armyRed: "Red camp", turncoat: "Turncoat",
      objKind: "Object", objBy: "Destroyed by: {g}", objByAny: "Any card captures it",
      objGhost: "Turn one over in a battle to read it",
      infTitle: "Infirmary", infSub: "{n} / {m} beds taken", infFree: "Free bed",
      infFull: "Infirmary full", prisonFree: "Free cell",
      prisonFull: "Prison full", prisonFullSub: "{n} cells, all taken: no prisoner this time",
      infNone: "Every card is fit. A card wounded in battle rests here.",
      infHealAll: "Patch everybody up", infHealed: "Back on their feet",
      prisonTitle: "Prison", prisonSub: "{n} / {m} cells taken",
      prisonNone: "A won battle offers one enemy you left standing.",
      enlist: "Enlist", hire: "Recruit", enlisted: "{c} joins your army",
      recruitTitle: "Recruiting tent", recruitSub: "New faces in {t}",
      sold: "Recruited", recruited: "{c} recruited",
      tooPoor: "Not enough coins",
      captiveTitle: "Take a prisoner", captiveSub: "One of the enemies you left standing",
      captiveSubOr: "The enemy you left standing, or the spoils instead", or: "or",
      captiveSkip: "Leave them", captiveTaken: "Taken to the prison",
      captiveTap: "Tap a card to take it",
      ready: "Ready", soon: "Any moment", uD: "d", uH: "h", uM: "m",
      away: "On mission",
      tab_tent: "Recruits", tab_mis: "Missions",
      misTitle: "Missions",
      misAway: "Squads away", misBoard: "Mission board",
      runFree: "Squad free", boardFree: "Mission under way",
      boardNext: "New missions in {t}",
      misLog: "Reports", logEmpty: "No squad has come back yet.",
      prepare: "Prepare", runFull: "Every squad is out",
      runFullSub: "{n} missions at once — wait for one to come back",
      runBack: "Back at camp", readReport: "Report",
      oddsShort: "{p} success", oddsLabel: "Chance of success",
      diff: "Difficulty {n} of 5",
      squadN: "{a} cards", squadRange: "{a} to {b} cards",
      favor: "{g} +{n}",
      rwSuper: "+{n} super ticket", rwSticker: "A sticker", rwCard: "An officer · {g} · {t}",
      penCoins: "-{n} coins",
      penWound1: "1 card wounded", penWoundN: "{n} cards wounded",
      penLose1: "1 card lost", penLoseN: "{n} cards lost",
      briefTitle: "Briefing",
      squadSec: "The squad", squadTake: "Add this card to the squad", squadDrop: "Take this card out of the squad",
      availNone: "No card is free: every one is wounded or already away.",
      squadFull: "The squad is full",
      needMore1: "1 more card to send the squad", needMoreN: "{n} more cards to send the squad",
      send: "Send the squad", cancel: "Cancel",
      sent: "Squad on its way", sentSub: "Back in {t}",
      repEyebrow: "Mission report", repWin: "Success", repLose: "Failure",
      fateHurt: "Wounded", fateLost: "Lost", theSquad: "The squad",
      repCollect: "Tap anywhere to collect", repClose: "Tap anywhere to close",
      tab_camp: "Camp", tab_reg: "Register",
      campTitle: "Camp", campSub: "An officer at a post fights no battle and joins no squad",
      campPosts: "Posts", campRoll: "In the camp", campNone: "The camp is empty.",
      post_inf: "Infirmary", post_pri: "Prison", post_drill: "Formation", post_ops: "Missions", post_cmd: "Camp",
      role_inf: "Infirmary manager", role_pri: "Prison warden", role_drill: "Drill instructor",
      role_ops: "Mission officer", role_cmd: "In command",
      postPick: "Choose an officer", postTake: "Assign this card to the post",
      postDrop: "Relieve this officer", posted: "{c} takes up the post",
      stHurt: "Wounded", stAway: "On mission", stDeck: "In formation", stIdle: "In reserve",
      stJail: "In prison", stTurned: "Ready to enlist",
      regTitle: "Register", regSec: "Cards lost",
      regNone: "No card lost yet. A card that dies in battle or on a mission is written here.",
      lostBattle: "Fell in battle", lostMission: "Lost on a mission · {m}", lostMissionAny: "Lost on a mission",
      lostWounds: "Died of wounds · {m}", lostWoundsAny: "Died of wounds after a mission",
      regBack: "Found alive, back in service",
      backAlive: "Back alive", inCamp: "Already in the camp", returned: "{c} is back in service",
      fateUp: "Promoted", fileUp: "Promoted: {t}",
      fallenTitle: "In memoriam", fallenEyebrow1: "A card is lost", fallenEyebrowN: "{n} cards lost",
      fallenTap: "Tap a card for the register, anywhere else to close",
      fallenOpen: "Open the register",
      fallen1_battle: "{c}: wounded in battle, with no bed left in the infirmary",
      fallen1_mission: "{c}: never came back from the mission {m}",
      fallen1_wounds: "{c}: wounded on the mission {m}, with no bed left in the infirmary",
      fallenS_battle: "1 card wounded in battle, with no bed left in the infirmary",
      fallenS_mission: "1 card that never came back from a mission",
      fallenS_wounds: "1 card wounded on a mission, with no bed left in the infirmary",
      fallenN_battle: "{n} cards wounded in battle, with no bed left in the infirmary",
      fallenN_mission: "{n} cards that never came back from a mission",
      fallenN_wounds: "{n} cards wounded on a mission, with no bed left in the infirmary",
      fallenFoot1: "Their name is written in the register. Who knows: the recruiting tent may find them alive one day.",
      fallenFootN: "Their names are written in the register. Who knows: the recruiting tent may find one of them alive one day.",
      upTitle: "Promotion!", upEyebrow: "A card climbs", upEyebrowN: "Promotion {i} / {n}",
      upNext: "Tap for the next one", upClose: "Tap to close",
      upLine: "{g} · from {a} to {b}",
      upWhy_battle: "Earned in a won battle", upWhy_mission: "Earned on a successful mission",
      upWhy_post: "Earned at their post, over the battles won"
    },
    fr: {
      deck: "Deck", infirmary: "Infirmerie", prison: "Prison", recruit: "Camp",
      bandTitle: "Ton armée", bandMissions: "Missions réussies", bandOwned: "Officiers possédés",
      bandBlue: "Cartes bleues", bandRed: "Cartes rouges en prison", bandTurn: "Transfuges",
      deckTitle: "Deck",
      deckSection: "Formation", slotN: "Emplacement {n}", fillBest: "Auto-complétion",
      filled1: "1 carte ajoutée", filledN: "{n} cartes ajoutées",
      pickTitle: "Choisis une carte", pickEmpty: "Aucune carte n'est libre pour le deck",
      deckTake: "Mettre cette carte dans le deck",
      f_all: "Toutes",
      f_had: "Possédés", f_met: "Rencontrés", f_seen: "Vus", f_miss: "Manquants",
      deckFullWarn: "Le deck est plein",
      deckDrop: "Laisser cette carte", inDeck: "Dans le deck",
      tab_deck: "Deck", tab_coll: "Collection",
      collTitle: "Collection",
      cx_blue: "Bleu", cx_red: "Rouge", cx_turn: "Transfuges", cx_obj: "Objets",
      ghostTurn: "Enrôle cet officier depuis la prison pour lire sa fiche",
      cxNone: "Personne ici", prev: "Précédent", next: "Suivant",
      ghostBlue: "Recrute cet officier pour lire sa fiche",
      ghostRed: "Affronte cet officier en bataille pour lire sa fiche",
      fileOpen: "Lire la fiche de cet officier", fileTurn: "Retourner la carte",
      fileHint: "Touche la carte pour la retourner", age: "{n} ans",
      g_man: "Homme", g_woman: "Femme", g_male: "Mâle", g_female: "Femelle",
      armyBlue: "Armée bleue", armyRed: "Camp rouge", turncoat: "Transfuge",
      objKind: "Objet", objBy: "Détruit par : {g}", objByAny: "Toute carte peut le prendre",
      objGhost: "Retournes-en un en bataille pour le lire",
      infTitle: "Infirmerie", infSub: "{n} / {m} lits occupés", infFree: "Lit libre",
      infFull: "Infirmerie pleine", prisonFree: "Cellule libre",
      prisonFull: "Prison pleine", prisonFullSub: "{n} cellules, toutes prises : pas de prisonnier cette fois",
      infNone: "Toutes tes cartes sont saines. Une carte blessée au combat se repose ici.",
      infHealAll: "Soigner tout le monde", infHealed: "De nouveau sur pied",
      prisonTitle: "Prison", prisonSub: "{n} / {m} cellules occupées",
      prisonNone: "Une bataille gagnée t'offre un ennemi laissé debout.",
      enlist: "Enrôler", hire: "Recruter", enlisted: "{c} rejoint ton armée",
      recruitTitle: "Tente de recrutement", recruitSub: "De nouvelles têtes dans {t}",
      sold: "Recruté", recruited: "{c} recruté",
      tooPoor: "Pas assez de pièces",
      captiveTitle: "Fais un prisonnier", captiveSub: "Un des ennemis que tu as laissés debout",
      captiveSubOr: "L'ennemi que tu as laissé debout, ou le butin à la place", or: "ou",
      captiveSkip: "Les laisser partir", captiveTaken: "Emmené en prison",
      captiveTap: "Touche une carte pour la prendre",
      ready: "Prêt", soon: "D'un instant à l'autre", uD: "j", uH: "h", uM: "min",
      away: "En mission",
      tab_tent: "Recrues", tab_mis: "Missions",
      misTitle: "Missions",
      misAway: "Escouades en mission", misBoard: "Tableau des missions",
      runFree: "Escouade disponible", boardFree: "Mission en cours",
      boardNext: "Nouvelles missions dans {t}",
      misLog: "Rapports", logEmpty: "Aucune escouade n'est encore rentrée.",
      prepare: "Préparer", runFull: "Toutes les escouades sont dehors",
      runFullSub: "{n} missions à la fois — attends qu'une rentre",
      runBack: "De retour au camp", readReport: "Rapport",
      oddsShort: "{p} de réussite", oddsLabel: "Chances de réussite",
      diff: "Difficulté {n} sur 5",
      squadN: "{a} cartes", squadRange: "{a} à {b} cartes",
      favor: "{g} +{n}",
      rwSuper: "+{n} super ticket", rwSticker: "Un sticker", rwCard: "Un officier · {g} · {t}",
      penCoins: "-{n} pièces",
      penWound1: "1 carte blessée", penWoundN: "{n} cartes blessées",
      penLose1: "1 carte perdue", penLoseN: "{n} cartes perdues",
      briefTitle: "Briefing",
      squadSec: "L'escouade", squadTake: "Ajouter cette carte à l'escouade", squadDrop: "Retirer cette carte de l'escouade",
      availNone: "Aucune carte n'est libre : toutes sont blessées ou déjà en mission.",
      squadFull: "L'escouade est complète",
      needMore1: "Encore 1 carte pour envoyer l'escouade", needMoreN: "Encore {n} cartes pour envoyer l'escouade",
      send: "Envoyer l'escouade", cancel: "Annuler",
      sent: "Escouade en route", sentSub: "De retour dans {t}",
      repEyebrow: "Rapport de mission", repWin: "Réussite", repLose: "Échec",
      fateHurt: "Blessée", fateLost: "Perdue", theSquad: "L'escouade",
      repCollect: "Touche n'importe où pour récupérer", repClose: "Touche n'importe où pour fermer",
      tab_camp: "Camp", tab_reg: "Registre",
      campTitle: "Camp", campSub: "Un officier affecté à un poste ne combat plus et ne part plus en mission",
      campPosts: "Postes", campRoll: "Au camp", campNone: "Le camp est vide.",
      post_inf: "Infirmerie", post_pri: "Prison", post_drill: "Formation", post_ops: "Missions", post_cmd: "Camp",
      role_inf: "Gestionnaire d'infirmerie", role_pri: "Gestionnaire de prison", role_drill: "Instructeur de formation",
      role_ops: "Officier des missions", role_cmd: "Au commandement",
      postPick: "Choisis un officier", postTake: "Affecter cette carte au poste",
      postDrop: "Relever cet officier", posted: "{c} prend son poste",
      stHurt: "Blessée", stAway: "En mission", stDeck: "En formation", stIdle: "En réserve",
      stJail: "En prison", stTurned: "Prête à s'enrôler",
      regTitle: "Registre", regSec: "Cartes perdues",
      regNone: "Aucune carte perdue pour l'instant. Une carte tombée au combat ou en mission est inscrite ici.",
      lostBattle: "Tombée au combat", lostMission: "Perdue en mission · {m}", lostMissionAny: "Perdue en mission",
      lostWounds: "Morte de ses blessures · {m}", lostWoundsAny: "Morte de ses blessures après une mission",
      regBack: "Retrouvée vivante, de retour en service",
      backAlive: "Rescapée", inCamp: "Déjà au camp", returned: "{c} reprend du service",
      fateUp: "Promue", fileUp: "Promotion : {t}",
      fallenTitle: "In memoriam", fallenEyebrow1: "Une carte est perdue", fallenEyebrowN: "{n} cartes perdues",
      fallenTap: "Touche une carte pour le registre, ailleurs pour fermer",
      fallenOpen: "Ouvrir le registre",
      fallen1_battle: "{c} : blessure au combat, plus aucun lit libre à l'infirmerie",
      fallen1_mission: "{c} : disparition pendant la mission {m}",
      fallen1_wounds: "{c} : blessure pendant la mission {m}, plus aucun lit libre à l'infirmerie",
      fallenS_battle: "1 carte blessée au combat, sans lit libre à l'infirmerie",
      fallenS_mission: "1 carte jamais revenue de mission",
      fallenS_wounds: "1 carte blessée en mission, sans lit libre à l'infirmerie",
      fallenN_battle: "{n} cartes blessées au combat, sans lit libre à l'infirmerie",
      fallenN_mission: "{n} cartes jamais revenues de mission",
      fallenN_wounds: "{n} cartes blessées en mission, sans lit libre à l'infirmerie",
      fallenFoot1: "Son nom est inscrit au registre. Qui sait : la tente de recrutement retrouvera peut-être cette carte en vie.",
      fallenFootN: "Leurs noms sont inscrits au registre. Qui sait : la tente de recrutement en retrouvera peut-être une en vie.",
      upTitle: "Promotion !", upEyebrow: "Une carte monte en grade", upEyebrowN: "Promotion {i} / {n}",
      upNext: "Touche pour la suivante", upClose: "Touche pour fermer",
      upLine: "{g} · de {a} à {b}",
      upWhy_battle: "Gagnée lors d'une bataille remportée", upWhy_mission: "Gagnée lors d'une mission réussie",
      upWhy_post: "Gagnée à son poste, au fil des batailles remportées"
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
    /* The camp's posts and the register, read by tools/test/views.mjs. */
    posts: function () { return save.po; },
    register: function () { return save.x; },
    /* The roster, the promotions waiting to be told and the one call that
       tells them, read and driven by tools/test/views.mjs. */
    roster: function () { return save.r; },
    promotions: function () { return save.up; },
    announce: announce,

    onChange: function (fn) { hooks.push(fn); },
    deck: roundDeck,
    size: function () { return DECK_SIZE; }
  };
})();
