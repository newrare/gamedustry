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
    the infirmary once the battle is over, for 1 to 24 hours by the tier gap
    an enemy beaten by something plainly better is left STANDING, and a won
    battle offers one of them as a PRISONER, who turns after 4 to 48 hours
    by their grade

  Those two rules are the round's (games/stratideck/game.js, `judge`): this
  file never watches a fight. What it does is own the four lists either rule
  writes into, and hand the deck over before the round starts.

  FOUR SCREENS AND THEY ARE VIEWS, not cards. A card is something that happens
  over wherever the player is and is dismissed rather than navigated
  (docs/VIEWS.md); every one of these is a place with a list to manage, a
  purchase to make or a deck to finish, and a screen a stray tap can close is
  not a screen anything is composed on. They stack over the village like the
  album and the shop do, they carry the wallet band, and ESCAPE peels them.

    deck        the CARDS, three tabs: the CAMP (every card the camp holds,
                with what it is doing), the DECK (the cards taken into the
                next battle, slot by slot, a `+` opening the picker over the
                reserve) and the COLLECTION, a codex of four books (the
                blue army, the red camp, the turncoats — sixty officers each
                — and the objects a camp is built of), one card at a time
                with who they are under it, a shadow for what was never had
    infirmary   what a battle cost, and how long until it comes back
    prison      who was taken, and how long until they turn
    recruit     the COMMAND, four tabs: the MANAGEMENT (six posts an
                officer is assigned to), the RECRUITS (what the tent is
                offering today, and what it costs), the MISSIONS (a squad of
                two to five cards sent away for hours or days, on odds the
                squad itself decides, and the report it comes back with) and
                the REGISTER (every card lost, and where)

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

  /* WHAT A POST IS WORTH IS A RANGE, and the officer holding it decides
     where in it the camp stands (`postVal`, section 1b): `[12, 20]` is a deck
     of twelve with nobody at the formation and of twenty with the best
     officer there is. A plain number is a range of one — a manifest written
     before the posts did anything keeps its figure. */
  function span2(v, lo) {
    if (v && v.length) return [v[0], v[v.length - 1]];
    return [v != null ? v : lo, v != null ? v : lo];
  }
  var DECK_R = span2(SPEC.deckSize, 12);
  DECK_R[0] = Math.max(4, DECK_R[0]);
  DECK_R[1] = Math.max(DECK_R[0], DECK_R[1]);
  var PICK_R = span2(SPEC.capturePick, 3);

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

  /* EVERY OFFICER HAS A TRADE, printed on the back of the card: thirty of
     them, `web.army.jobs`, five per post of the command, and each suits ONE
     post and no other — a cook is the kitchen's, a jailer the prison's. The
     cast names the trade (`job`); an officer at the post their trade suits
     fills its gauge further (`postPct`). */
  var JOBS = SPEC.jobs || [];
  var JOB = {};
  (function () {
    for (var i = 0; i < JOBS.length; i++) JOB[JOBS[i].k] = JOBS[i];
  })();
  function jobOf(side, g, t) {
    var p = castOf(side, g, t);
    return p && p.job ? JOB[p.job] || null : null;
  }
  /* A card's trade is the person's, so it is read at the tier they were
     raised at, like their name. */
  function cardJob(c) { return jobOf(c.o === "red" ? "red" : "blue", c.g, c.b != null ? c.b : c.t); }
  /* The trade in the player's language — in French, in the officer's own
     gender where the word has one (Cuisinière). */
  function jobName(j, p) {
    if (!j) return "";
    var n = j.name || {};
    if (LANG === "fr" && n.frF && p && (p.gender === "woman" || p.gender === "female")) return n.frF;
    return n[LANG] || n.en || j.k;
  }
  function jobsOf(post) {
    var out = [];
    for (var i = 0; i < JOBS.length; i++) if (JOBS[i].post === post) out.push(jobName(JOBS[i]));
    return out;
  }

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
  /* A GRADE THE CAMP HAS NONE OF IS NEVER OUT OF REACH: the tent keeps one
     place for it, at the lowest tier nobody holds, for this many coins. */
  var R_NEED = RC.needPrice != null ? RC.needPrice : 20;

  function priceOf(g, t) {
    return Math.round(R_BASE * (1 + R_GRADE * (g - 1)) * Math.pow(R_TIER, t) / 5) * 5;
  }
  function offerPrice(o) { return o.m ? R_NEED : priceOf(o.g, o.t); }

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
  /* THE MISSION SLOTS, and one slot is one place on the board whatever it
     holds: a mission offered, the squad sent on it, then the report it came
     back with — so the board is also the ceiling on the squads away. The
     missions' post opens them across `slots` (2 to 6). */
  var BOARD_R = span2(MS.slots || MS.offers, 2);
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
     wait of two days takes two days to watch once. The answer is the shell's
     own, and it is the same for every layer: an hour is an hour, and on a
     machine that is plainly not a player's the clock is MOVED by hand from
     the DEV view (W.Dev, packages/webshell/meta.js) — `now()` below reads it.
     Nothing of it reaches a deployed site, whose hostname is none of these. */
  function hour() { return 3600000; }

  /* A WAIT WRITTEN AS A RANGE, [shortest, longest] in hours, is read along
     a scale from 0 to 1 and rounded to the hour; a single number is the same
     wait for everyone, which is how a manifest used to write it. */
  function spanMs(v, k) {
    if (typeof v === "number") return v * hour();
    return Math.round(v[0] + (v[1] - v[0]) * clamp(k, 0, 1)) * hour();
  }
  /* A wound lasts as long as the TIER GAP that caused it: 1 (a card that
     beat something one letter better) is the shortest stay, the whole
     ladder the longest. A failed mission hands its difficulty in instead. */
  function healMs(gap) {
    return spanMs(SPEC.infirmaryHours || [1, 24], ((gap || 1) - 1) / Math.max(1, TOP - 1));
  }
  /* A prisoner turns after a wait read off their GRADE: a spy is quick to
     talk round, a marshal takes the longest. */
  function freeMs(g) {
    var lo = GRADES.length ? GRADES[0].r : 1, hi = GRADES.length ? GRADES[GRADES.length - 1].r : 10;
    return spanMs(SPEC.prisonHours || [4, 48], ((g || lo) - lo) / Math.max(1, hi - lo));
  }
  /* The card goes to the infirmary for `ms`, and keeps how long its stay
     is (`ws`) so its gauge fills over that stay and not over another. */
  function hurtFor(c, ms) { c.w = now() + ms; c.ws = ms; }
  function stayOf(c) { return c.ws || healMs(); }
  /* The tent's shelf turns over in minutes (`refreshMinutes`), and a
     manifest still written in hours (`refreshHours`) keeps working. */
  function tentMs() {
    return RC.refreshMinutes ? RC.refreshMinutes * 60000 : (RC.refreshHours || 6) * hour();
  }
  function boardMs() { return (MS.refreshHours || 8) * hour(); }

  /* BEDS AND CELLS HAVE A CEILING. A room that holds everything is a room
     nobody empties: with a ceiling, a wound the infirmary has no bed for is a
     card LOST (the round refuses it on the spot and says so —
     games/stratideck, `wound`), and a prisoner the prison has no cell for is
     not taken. How high the ceiling is belongs to the officer running the
     room (`beds`, `cells`); the two ranges are the manifest's
     (`web.army.infirmaryBeds` / `prisonCells`). */
  var BEDS_R = span2(SPEC.infirmaryBeds, 6);
  var CELLS_R = span2(SPEC.prisonCells, 6);

  /* THE CAMP'S SIX POSTS, one officer each: the camp itself, the formation,
     the missions, the infirmary, the prison and the kitchen. An officer at a
     post has a job, and a job is a card taken out of everything else — no
     battle, no squad, no deck — which is the whole price of it. The order is
     the one the tab draws them in; `k` is what the save writes. */
  var POSTS = [
    { k: "cmd", icon: "crown" },
    { k: "drill", icon: "deck" },
    { k: "ops", icon: "compass" },
    { k: "inf", icon: "heal" },
    { k: "pri", icon: "lock" },
    { k: "cook", icon: "cook" }
  ];
  var POST = {};
  (function () {
    for (var i = 0; i < POSTS.length; i++) POST[POSTS[i].k] = POSTS[i];
  })();

  /* EVERY POST IS A GAUGE, 0 to 100 %, and the officer holding it fills it:
     their TIER sets the figure (`tier`, E low and S high) and a trade that
     suits the post adds `match` on top — so a full gauge is an S doing the
     job they were born for, and an empty post is 0 %. What the gauge buys is
     each post's own range: */
  var PP = SPEC.posts || {};
  var PP_TIER = PP.tier || [10, 26, 42, 58, 74, 90];
  var PP_MATCH = PP.match != null ? PP.match : 10;
  /* ...the camp's (how many captives the end of a battle offers, and past
     `spare` %, a chance that it offers one even when the battle took none),
     the formation's (the deck's slots), the missions' (the board's), the
     infirmary's (the beds), the prison's (the cells) and the kitchen's (how
     often the camp's day is a good one, section 5c). */
  var PP_SPARE = PP.spare != null ? PP.spare : 50;
  var RANGE = { cmd: PICK_R, drill: DECK_R, ops: BOARD_R, inf: BEDS_R, pri: CELLS_R };

  /* THE CAMP'S DEFENSE (`web.army.defense`, section 8c'): a grid the player
     fills with a flag, their own cards and the objects the climb gave them,
     which the red army may storm while they are away. `unlock[b]` lists the
     objects that clearing band `b` of the map hands over; the flag is
     theirs from the start. `attack` is when a raid is rolled and how it is
     played (`turns`: how many cards a raid sends before it has to be gone),
     `win` and `loss` what the report pays or takes, both scaled on the
     player's level across `levelSpan` levels. */
  var DEF = SPEC.defense || {};
  var DF_COLS = DEF.cols || 5, DF_ROWS = DEF.rows || 4, DF_N = DF_COLS * DF_ROWS;
  var DF_PER = DEF.perObject || 2;
  var DF_ATT = DEF.attack || {};
  var DF_UNLOCK = DEF.unlock || [];
  var FLAG_R = 12;

  /* The gauge a card WOULD give at a post — the picker shows it on every
     token before the choice is made. */
  function pctFor(c, k) {
    if (!c) return 0;
    var j = cardJob(c);
    return clamp((PP_TIER[clamp(c.t, 0, TOP)] || 0) + (j && j.post === k ? PP_MATCH : 0), 0, 100);
  }
  function postPct(k) { return pctFor(postCard(k), k); }
  function suits(c, k) { var j = cardJob(c); return !!(j && j.post === k); }
  /* Where the gauge stands in the post's range, rounded to the nearest. */
  function postVal(k) {
    var r = RANGE[k];
    return r ? r[0] + Math.round(postPct(k) / 100 * (r[1] - r[0])) : 0;
  }
  function deckCap() { return postVal("drill"); }
  function beds() { return postVal("inf"); }
  function cells() { return postVal("pri"); }
  function boardCap() { return postVal("ops"); }
  function pickCap() { return Math.max(1, postVal("cmd")); }
  /* The chance that a won battle with no captive left standing still offers
     one: 0 up to `spare` %, 1 at a full gauge. */
  function spareChance() {
    var p = postPct("cmd");
    return PP_SPARE >= 100 ? 0 : clamp((p - PP_SPARE) / (100 - PP_SPARE), 0, 1);
  }

  /* THE REGISTER KEEPS THE DEAD, and a ceiling keeps it from outgrowing the
     save: past it the oldest name goes first. */
  var X_MAX = 200;

  function now() { return W.Dev ? W.Dev.now() : Date.now(); }

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
  /* ...and a wait told in a SENTENCE, in words: "2 days", "1 day 4 hours",
     "5 hours" — a countdown's "2d 00h" is a readout, not something said. */
  function waitWords(ms) {
    var h = Math.max(0, Math.round(ms / 3600000)), d = Math.floor(h / 24), out = [];
    h -= d * 24;
    if (d) out.push(d + " " + (d > 1 ? T.wDays : T.wDay));
    if (h || !d) out.push(h + " " + (h > 1 ? T.wHours : T.wHour));
    return out.join(" ");
  }

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
       ms the missions: { v 2, t when the board was rolled, n the slots it
          was rolled with, o the mission offered in each slot, by slot, null
          where there is none, r the squads away { k slot, m mission, c card
          ids, e when they are back, p the odds they left on, z the roll that
          decides it — drawn at the departure, so no reload re-rolls a
          report }, q the reports written and not yet collected (each one
          keeps its slot `k`), l the reports collected, newest first and
          at most `M_LOG` of them — the tab's history, re-read on a tap —
          h mission → how many times it was run, w how many of those came
          back a success — the village's band }
       po the camp's posts: { post key → card id }, one officer a post, and
          that card is out of the deck, the squads and every battle
       ev the camp's days (section 6b): { t the hour the last one was due,
          q the days drawn and not yet told, h the last few drawn }
       df the defense (section 8c'): { g the grid being composed, `DF_N`
          cells of null, { i card id } or { r object }, v the grid last
          VALIDATED — the one a raid storms — or null, vt when, seen the last
          moment the player was here, pend a raid to roll at the village,
          q the report written and not yet read, last the last one read,
          an object → 1 once its unlock was announced }
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
    var s = { v: 1, n: 1, r: [], d: [], p: [], po: {}, x: [], up: [], k: null, c: { h: {}, m: {}, o: {} },
              ev: { t: now(), q: [], h: [] }, df: dfBlank() }, i, j, e, t;
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
    for (i = 0; i < pool.length && s.d.length < DECK_R[0]; i++) s.d.push(pool[i].i);
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
    if (s.df) { dfDrop(s.df.g, id); if (s.df.v) dfDrop(s.df.v, id); }
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
    /* the camp's day starts counting the first time a save meets it */
    if (!s.ev) s.ev = { t: now(), q: [], h: [] };
    if (!s.df) s.df = dfBlank();
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

  /* A SESSION THAT STARTS AFTER AN ABSENCE may be raided (section 8c'),
     and so may a tab that comes back from the background after one. */
  dfArrive();
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { dfSeen(); MT.setArmy(save); }
    else dfArrive();
  });
  /* THE DEV CLOCK (W.Dev, meta.js). Hours passed with the player here are
     not an absence: "last seen" follows the clock, and every wait the jump
     ended is repainted. A player sent away writes when they left, and the
     reload that brings them back is the arrival above. */
  if (W.Dev) {
    W.Dev.onChange(function () { persist(); });
    W.Dev.onLeave(function () { dfSeen(); MT.setArmy(save); });
  }

  var hooks = [];
  function persist() {
    dfSeen();
    fitDeck();
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
  function deckShort() { return Math.max(0, deckCap() - save.d.length); }

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
    for (i = 0; i < save.d.length && i < deckCap(); i++) {
      c = byId(save.d[i]);
      if (c && free(c)) out.push({ r: c.g, t: c.t, id: c.i, o: c.o || null, b: baseOf(c) });
    }
    while (out.length < deckCap()) out.push({ r: CONSCRIPT.r, t: CONSCRIPT.t, id: null });
    return out;
  }
  /* A DECK WIDER THAN THE FORMATION ALLOWS IS CUT BACK to it, from the end:
     the officer who ran the drill has been relieved (or lost), the slots the
     gauge opened are locked again, and the cards that stood in them go back
     to the reserve — said once, so a card missing from the line was not
     taken without a word. */
  function fitDeck() {
    var cap = deckCap(), n = save.d.length - cap;
    if (n <= 0) return;
    save.d.length = cap;
    say(fill(n === 1 ? T.deckCut1 : T.deckCutN, { n: n }), T.deckCutSub, "warn", "deck");
  }

  /* `beds` and `cells` are the rooms left: the round refuses a wound or a
     prisoner past them rather than promising a bed that is not there. */
  function syncDeck() {
    CONFIG.army = { deck: roundDeck(), size: deckCap(),
                    beds: Math.max(0, beds() - inInfirmary()),
                    cells: Math.max(0, cells() - inPrison()) };
  }

  /* ── 5. what a battle did ─────────────────────────────────────────────── */

  /* The result filter runs inside the motor's endRound, beside the level
     layer's and the meta layer's, and this one only READS: the wounds are
     written the moment they are known, and the prisoners are kept for a screen
     to offer them on. */
  var offer = null;                     // captives waiting to be offered
  var offerCoins = false;               // the spoils beside it are coins only

  /* The cards this battle sent to the infirmary, for the card that says so
     before the end screen (`outro`). */
  var battleHurt = [];

  function absorb(result) {
    var a = result && result.army;
    if (!a) return;
    battleHurt = [];
    var i, c, n = 0;
    for (i = 0; i < (a.hurt || []).length; i++) {
      c = byId(a.hurt[i]);
      if (!c) continue;
      /* THE WAIT STARTS WHEN THE BATTLE ENDS, not when the wound landed: a
         card hurt on the first turn of a long round would otherwise come back
         sooner than one hurt on the last, which is a rule about the length of
         a battle and not about the wound. The round already kept to the
         beds it was told of; this is the fence behind it. */
      if (inInfirmary() < beds()) { hurtFor(c, healMs((a.gaps || {})[a.hurt[i]])); battleHurt.push(c); }
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
    offer = (a.won && loose.length) ? distinct(loose).slice(0, pickCap()) : null;
    /* A CAMP WELL RUN FINDS ONE MORE. Past `spare` % on the camp's gauge, a
       won battle may offer a STRAGGLER on top of what it left standing — or
       instead of nothing at all: an officer of the camp the battle turned
       over, found hiding in the woods once the fighting stopped. */
    if (a.won && (!offer || offer.length < pickCap()) && Math.random() < spareChance()) {
      var sp = straggler(a.met || [], offer || []);
      if (sp) (offer = offer || []).push(sp);
    }
    /* TWO OF THE SAME CARD IS NOT A CHOICE. The round hands its captives over
       best first, and two sappers of one tier are one card offered twice — so
       the list keeps one of each, and where that leaves a single prisoner out
       of several the other side of the pick is the COINS the second would have
       been worth, not a roll of the spoils. */
    offerCoins = !!(offer && offer.length === 1 && (a.captives || []).length > 1);
    if (n) persist();
  }

  /* The straggler: an officer the battle turned over, then any officer of
     the camp's lower tiers, never one the camp already holds or already
     offered. `sp` marks it for the card that offers it. */
  function straggler(met, taken) {
    var pool = [], seen = {}, i, c, k, g;
    for (i = 0; i < taken.length; i++) seen[taken[i].r + ":" + taken[i].t] = 1;
    for (i = 0; i < met.length; i++) {
      c = met[i];
      k = c.r + ":" + (c.t | 0);
      if (!GRADE[c.r] || seen[k] || held(save, "red", c.r, c.t | 0)) continue;
      seen[k] = 1;
      pool.push({ r: c.r, t: c.t | 0, sp: 1 });
    }
    if (!pool.length) {
      for (i = 0; i < GRADES.length; i++) {
        g = GRADES[i].r;
        for (var t = 0; t <= Math.min(2, TOP); t++) {
          if (!seen[g + ":" + t] && !held(save, "red", g, t)) pool.push({ r: g, t: t, sp: 1 });
        }
      }
    }
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
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

  /* THE OUTRO'S SHARE: WHAT THE BATTLE COST AND WHAT IT WON, told on the
     battle itself — over the frozen round, after the level layer's own
     outro, and before the end screen and its scores. The dead first, then
     the wounded, then the prisoner to pick, then the promotions: the losses
     before the gains, since a loss read after a celebration reads as an
     afterthought, and the choice before the congratulations so the last
     card before the scores is good news. Each card is one card however many
     cards it tells of. The wallet comes up with them, because the spoils
     fly into a chip and a flight measures a VISIBLE one.

     A player who left the round while it played gets the dead and the
     promotions at the village instead (`announce`); the wounded are in the
     infirmary, which says it on its own. */
  function outro(result, done) {
    var hurt = battleHurt;
    battleHurt = [];
    if (!result || !result.army || W.state() !== "playing" || announcing) { done(); return; }
    var dead = untold();
    if (!dead.length && !hurt.length && !offer && !save.up.length) { done(); return; }
    if (MT && MT.active && MT.active()) VW.hudShow();
    announcing = true;
    openFallen(dead, function () {
      openWounded(hurt, function () {
        openOffer(function () {
          openPromos(function () { announcing = false; done(); });
        });
      });
    }, true);
  }

  /* Every register entry not yet told, oldest first. */
  function untold() {
    var out = [];
    for (var i = save.x.length - 1; i >= 0; i--) if (save.x[i].nw) out.push(save.x[i]);
    return out;
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
    if (inPrison() >= cells()) {
      offer = null;
      say(T.prisonFull, fill(T.prisonFullSub, { n: cells() }), "warn", "lock");
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
    /* NEITHER DISMISSED NOR ESCAPED, AND NO WAY PAST IT. Two or three tiles
       is a CHOICE, and a choice has no default — the same rule the three gift
       boxes are opened under (packages/webshell/meta.js). A victory pays, so
       the player picks what it pays in: there is no line under the tiles to
       walk away with nothing, and no sentence over them either — the title
       says what the card is and the tiles say the rest.

       `close` is the one `fill` is handed, and NOT the handle `MD.open`
       returns: fill runs INSIDE open, before that handle exists, so a tile
       built with it held `undefined` — the prisoner was written, the close
       threw, and the card stayed on screen taking a prisoner per tap. */
    MD.open({
      kind: "captive", dismiss: false, esc: false, onClose: then,
      title: T.captiveTitle, tap: T.captiveTap,
      fill: function (card, close) {
        var row = el("div", "ar-pick" + (PAINTED ? " painted" : ""));
        row.style.setProperty("--pw", tileW + "px");
        row.style.setProperty("--pw-n", (tileW * 0.78 / 190).toFixed(3));   // the reward's 190 px disc
        for (var i = 0; i < list.length; i++) row.appendChild(pickTile(list[i], close));
        if (spoils) {
          row.appendChild(el("div", "ar-pick-or", T.or));
          row.appendChild(spoilsTile(spoils, close));
        }
        card.appendChild(row);
      }
    });
    W.Sound.ui("reward", 0.8);

    function pickTile(c, close) {
      var b = el("button", "ar-pick-t");
      b.appendChild(cardTile({ g: c.r, t: c.t }, { foe: true, fmt: "full", w: tileW }));
      var f = el("div", "ar-pick-when", untilText(freeMs(c.r)));
      b.appendChild(f);
      b.addEventListener("click", function () {
        if (taken) return;
        taken = true;
        if (held(save, "red", c.r, c.t)) { close(); return; }
        save.p.push({ g: c.r, t: c.t, u: now() + freeMs(c.r) });
        meet(save, c.r, c.t);
        persist();
        close();
        say(T.captiveTaken, whoName("red", c.r, c.t), "info", "lock");
        W.Sound.ui("win", 0.8);
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
        W.Sound.ui("win", 0.8);
      });
      return b;
    }
  }

  /* ── 6a. the surrender: a battle that can no longer be won ─────────────── */

  /* THE COMMANDER SAYS IT BEFORE THE PLAYER HAS TO FIND OUT. The round
     (games/stratideck, HOPELESS) asks once a battle, the first turn the army
     left can neither take the flag nor beat the whole camp, and `why` is
     what walls the flag in: "trap", "object" or "soldier". Surrendering is
     the round's way out (menu.js, `leave`): back to the village, no end
     screen, no score — and nothing of the battle written to the barracks,
     the same as leaving it from the corner. Anything else — a tap, ESCAPE,
     FIGHT ON — plays the battle out, to the end screen it was heading for.
     The card holds the round while it stands, like every card over one. */
  function surrender(why) {
    var MN = window.__MENU__;
    if (!MN || !MN.leave) return;
    var give = false;
    MD.open({
      kind: "ar-surrender",
      eyebrow: T.surEyebrow, title: T.surTitle, tap: T.surTap,
      onClose: function () { if (give) MN.leave(); },
      fill: function (card, close) {
        var face = CONFIG.art && (CONFIG.art.enemyHappy || CONFIG.art.enemyNeutral);
        if (face) {
          var img = el("img", "ar-sur-foe");
          img.src = face; img.alt = "";
          card.appendChild(img);
        }
        card.appendChild(el("p", "ar-sur-quote", T["surWhy_" + why] || T.surWhy_soldier));
        card.appendChild(el("p", "mt-sub ar-sur-note", T.surNote));
        var bar = el("div", "web-actions");
        var no = el("button", "btn", T.surNo);
        var yes = el("button", "btn btn-danger", T.surYes);
        no.addEventListener("click", function () { close(); });
        yes.addEventListener("click", function () { give = true; close(); });
        bar.appendChild(no);
        bar.appendChild(yes);
        card.appendChild(bar);
      }
    });
    W.Sound.cue("warn", 0.5, 0.8, 330, 0.18, "triangle");
  }

  /* ── 6b. the camp's day: the kitchen ──────────────────────────────────── */

  /* EVERY FEW REAL HOURS SOMETHING HAPPENS IN THE CAMP, and the kitchen
     decides how often it is good news. `web.army.events` lists the days — a
     brawl, a thief, a deserter; a volunteer, a feast, a merchant — each a
     title, two lines and one effect, and every `everyHours` of real time the
     camp draws one: a good one at the kitchen's odds (`goodChance`, the
     `good` range read at the kitchen's gauge), a bad one otherwise, never
     one of the last few again, and never one with nothing to act on (no
     fever with nobody in the infirmary).

     DRAWN WHEN IT IS DUE, TOLD AT THE VILLAGE. A day is rolled — who it is
     about included — the first time the camp is looked at after its hour,
     kept in the save so no reload re-rolls it, and told on a card of its own
     the next time the player stands in the village: arriving in the game,
     or back from a battle (`announce`). What it does lands on the tap that
     puts the card away, so the chips count up in front of the player.
     A player away for a day finds at most `stack` of them waiting — a camp
     left alone for a week is not a week of cards to tap through. */
  var EVS = SPEC.events || {};
  var EV_LIST = EVS.list || [];
  var EV_BY = {};
  (function () {
    for (var i = 0; i < EV_LIST.length; i++) EV_BY[EV_LIST[i].id] = EV_LIST[i];
  })();
  function evMs() { return (EVS.everyHours || 4) * hour(); }
  var EV_STACK = Math.max(1, EVS.stack || 3);
  var EV_GOOD = span2(EVS.good, 0.5);
  var EV_RECENT = 6;                        // days that cannot come back straight away

  function goodChance() {
    return clamp(EV_GOOD[0] + postPct("cook") / 100 * (EV_GOOD[1] - EV_GOOD[0]), 0, 1);
  }
  function evState() {
    if (!save.ev) save.ev = { t: now(), q: [], h: [] };
    if (!save.ev.q) save.ev.q = [];
    if (!save.ev.h) save.ev.h = [];
    return save.ev;
  }

  /* Written, not persisted: it runs as the village opens, and `persist`
     repaints. */
  var evQuiet = false;                      // tools/test/views.mjs holds the days back
  function tickEvents() {
    if (!EV_LIST.length || evQuiet) return;
    var e = evState(), n = Math.floor((now() - e.t) / evMs()), i, ev;
    if (n <= 0) return;
    e.t += n * evMs();
    n = Math.min(n, EV_STACK - e.q.length);
    for (i = 0; i < n; i++) {
      ev = rollEvent();
      if (ev) e.q.push(ev);
    }
    MT.setArmy(save);
  }

  function rollEvent() {
    var e = evState(), good = Math.random() < goodChance(), pool = [], ws = [], total = 0, i, d, r, x;
    for (i = 0; i < EV_LIST.length; i++) {
      d = EV_LIST[i];
      if (!!d.good !== good || e.h.indexOf(d.id) >= 0) continue;
      r = prepare(d);
      if (!r) continue;
      pool.push(r);
      ws.push(d.w != null ? d.w : 1);
      total += ws[ws.length - 1];
    }
    if (!pool.length) return null;
    x = Math.random() * total;
    for (i = 0; i < pool.length - 1; i++) { x -= ws[i]; if (x <= 0) break; }
    r = pool[i];
    e.h.push(r.id);
    if (e.h.length > EV_RECENT) e.h.shift();
    return r;
  }

  function snap(c) {
    var s = { i: c.i, g: c.g, t: c.t };
    if (c.b != null) s.b = c.b;
    if (c.o) s.o = c.o;
    return s;
  }
  function pickOne(list) { return list[Math.floor(Math.random() * list.length)]; }
  /* Cards the camp can spare for a day's trouble: fit, home, and holding no
     post — an officer running the kitchen is not the one poisoned by it. */
  function idleCards() {
    var out = [];
    for (var i = 0; i < save.r.length; i++) if (free(save.r[i])) out.push(save.r[i]);
    return out;
  }
  function unturned() {
    var out = [];
    for (var i = 0; i < save.p.length; i++) if (save.p[i].u > now()) out.push(save.p[i]);
    return out;
  }
  function awayRuns() {
    var r = save.ms ? save.ms.r : [], out = [];
    for (var i = 0; i < (r || []).length; i++) if (!isBack(r[i])) out.push(r[i]);
    return out;
  }
  /* An officer nobody in the camp already is, of a grade from `minG` up and
     a tier in `tr`. */
  function freshOfficer(side, tr, minG) {
    var pool = [], i, g, t;
    for (i = 0; i < GRADES.length; i++) {
      g = GRADES[i].r;
      if (g < minG) continue;
      for (t = clamp(tr[0], 0, TOP); t <= clamp(tr[1], 0, TOP); t++) if (!held(save, side, g, t)) pool.push({ g: g, t: t });
    }
    return pool.length ? pickOne(pool) : null;
  }

  /* THE DAY, DECIDED: which card, which prisoner, which squad — or null
     when the camp holds nothing for it to act on. */
  function prepare(d) {
    var f = d.fx || {}, ev = { id: d.id, good: !!d.good }, list, o, i, n, room;
    switch (f.kind) {
      case "coins":
        if (f.n < 0 && MT.coins() <= 0) return null;
        ev.n = f.n; return ev;
      case "ticket":
        if (f.n < 0 && MT.tickets() < -f.n) return null;
        ev.n = f.n; return ev;
      case "super": case "xp":
        ev.n = f.n || 1; return ev;
      case "sticker":
        ev.n = MT.roll(); return ev;
      case "recruit":
        o = freshOfficer("blue", f.t || [0, 1], 4);
        if (!o) return null;
        ev.c = o; return ev;
      case "defector":
        if (inPrison() >= cells()) return null;
        o = freshOfficer("red", f.t || [0, 2], 1);
        if (!o) return null;
        ev.c = o; ev.red = 1; return ev;
      case "desert":
        /* the weakest card of the reserve walks, and never below the
           smallest deck a formation takes */
        if (save.r.length <= DECK_R[0]) return null;
        list = [];
        for (i = 0; i < save.r.length; i++) if (free(save.r[i]) && !inDeck(save.r[i].i)) list.push(save.r[i]);
        if (!list.length) return null;
        list.sort(cmpCard);
        ev.c = snap(pickOne(list.slice(-3))); return ev;
      case "wound":
        list = idleCards();
        room = beds() - inInfirmary();
        n = Math.min(f.n || 1, room, list.length);
        if (n <= 0) return null;
        ev.cs = [];
        for (i = 0; i < n; i++) ev.cs.push(snap(list.splice(Math.floor(Math.random() * list.length), 1)[0]));
        ev.h = f.h || 12; return ev;
      case "heal":
        list = hurtList();
        if (!list.length) return null;
        ev.c = snap(pickOne(list)); return ev;
      case "healAll":
        if (!hurtList().length) return null;
        return ev;
      case "healDelay":
        if (!hurtList().length) return null;
        ev.h = f.h || 12; return ev;
      case "promote":
        list = [];
        for (i = 0; i < save.r.length; i++) if (save.r[i].t < TOP) list.push(save.r[i]);
        if (!list.length) return null;
        ev.c = snap(pickOne(list)); return ev;
      case "escape":
        if (!save.p.length) return null;
        o = pickOne(save.p);
        ev.c = { g: o.g, t: o.t }; ev.red = 1; return ev;
      case "jailDelay":
        if (!unturned().length) return null;
        ev.h = f.h || 24; return ev;
      case "turn":
        list = unturned();
        if (!list.length) return null;
        o = pickOne(list);
        ev.c = { g: o.g, t: o.t }; ev.red = 1; return ev;
      case "tent":
        return ev;
      case "tentBurn":
        o = save.k;
        if (!o || now() - o.t >= tentMs() || !o.o.length) return null;
        return ev;
      case "board":
        return MISSIONS.length ? ev : null;
      case "squadHome": case "squadDelay":
        list = awayRuns();
        if (!list.length) return null;
        ev.m = pickOne(list).m;
        if (f.h) ev.h = f.h;
        return ev;
    }
    return null;
  }

  /* THE DAY, DONE — on the tap that puts its card away. Every target is
     looked up again, since the camp may have moved since the day was drawn:
     a card gone, a prisoner turned, a squad home. The flights are handed
     back to run once the card has gone. */
  function applyEvent(ev) {
    var d = EV_BY[ev.id], f = (d && d.fx) || {}, fly = [], fine = 0, had = MT.coins(), c, i, p, rw, before;
    function gain(r) {
      before = r.kind === "coins" ? MT.coins() : r.kind === "ticket" ? MT.tickets()
             : r.kind === "super" ? MT.supers() : r.kind === "xp" ? MT.xp() : 0;
      MT.grant(r);
      fly.push({ rw: r, from: null, before: before, tag: r.kind !== "sticker" });
    }
    switch (f.kind) {
      case "coins":
        if (ev.n > 0) gain(MT.reward("coins", ev.n));
        else { fine = Math.min(-ev.n, had); if (fine) MT.spend(fine); }
        break;
      case "ticket":
        if (ev.n > 0) gain(MT.reward("ticket", ev.n));
        else MT.useTicket(Math.min(-ev.n, MT.tickets()) || 1);
        break;
      case "super": gain(MT.reward("super", ev.n)); break;
      case "xp": gain(MT.reward("xp", ev.n)); break;
      case "sticker": gain(MT.reward("sticker", ev.n)); break;
      case "recruit":
        c = enrol(save, ev.c.g, ev.c.t);
        if (c && save.d.length < deckCap()) save.d.push(c.i);
        break;
      case "defector":
        if (inPrison() < cells() && !held(save, "red", ev.c.g, ev.c.t)) {
          save.p.push({ g: ev.c.g, t: ev.c.t, u: now() + freeMs(ev.c.g) });
          meet(save, ev.c.g, ev.c.t);
        }
        break;
      case "desert":
        c = byId(ev.c.i);
        if (c && !postOf(c.i)) {
          retire(c, "desert");
          delete save.x[0].nw;              // this card already said it: no funeral for a deserter
        }
        break;
      case "wound":
        for (i = 0; i < ev.cs.length; i++) {
          c = byId(ev.cs[i].i);
          if (c && free(c) && inInfirmary() < beds()) hurtFor(c, ev.h * hour());
        }
        break;
      case "heal":
        c = byId(ev.c.i);
        if (c) c.w = 0;
        break;
      case "healAll":
        for (i = 0; i < save.r.length; i++) save.r[i].w = 0;
        break;
      case "healDelay":
        for (i = 0; i < save.r.length; i++) {
          c = save.r[i];
          if (!fit(c)) { c.ws = stayOf(c) + ev.h * hour(); c.w += ev.h * hour(); }
        }
        break;
      case "promote":
        c = byId(ev.c.i);
        /* this card is the congratulations: the letter a promotion queues
           is taken back rather than read a second time */
        if (c && promote(c, "event")) save.up.pop();
        break;
      case "escape": case "turn": case "jailDelay":
        for (i = save.p.length - 1; i >= 0; i--) {
          p = save.p[i];
          if (f.kind === "jailDelay") { if (p.u > now()) p.u += ev.h * hour(); continue; }
          if (p.g !== ev.c.g || p.t !== ev.c.t) continue;
          if (f.kind === "escape") save.p.splice(i, 1);
          else p.u = Math.min(p.u, now());
        }
        break;
      case "tent":
        save.k = null;                      // a new shelf the next time the tent is opened
        break;
      case "tentBurn":
        if (save.k) { save.k.o = []; save.k.b = []; }
        break;
      case "board":
        mstate().t = 0;                     // rolled again the next time the board is read
        break;
      case "squadHome": case "squadDelay":
        p = awayRuns();
        for (i = 0; i < p.length; i++) {
          if (p[i].m !== ev.m) continue;
          if (f.kind === "squadHome") p[i].e = now();
          else p[i].e += ev.h * hour();
          break;
        }
        break;
    }
    persist();
    return function () {
      for (var k = 0; k < fly.length; k++) MT.fx(fly[k]);
      if (fine) MT.spendFx(had, had - fine);
    };
  }

  /* Who a day is about, by name. */
  function evWho(ev) {
    var c = ev.c || (ev.cs && ev.cs[0]);
    if (!c) return "";
    return whoName(ev.red ? "red" : (c.o || "blue"), c.g, c.b != null ? c.b : c.t);
  }

  /* What the day did, as the chips a mission report is read in. */
  function evChips(ev) {
    var d = EV_BY[ev.id], f = (d && d.fx) || {}, out = [];
    function chip(ico, txt, cls) { out.push(mkChip(ico, txt, cls)); }
    switch (f.kind) {
      case "coins":
        if (ev.n > 0) chip("coin", MT.rewardLabel(MT.reward("coins", ev.n)), "gain");
        else chip("coin", fill(T.penCoins, { n: MT.num(Math.min(-ev.n, MT.coins()) || -ev.n) }), "risk");
        break;
      case "ticket":
        if (ev.n > 0) chip("ticket", MT.rewardLabel(MT.reward("ticket", ev.n)), "gain");
        else chip("ticket", fill(T.evTicketLost, { n: -ev.n }), "risk");
        break;
      case "super": chip("ticketSuper", fill(T.rwSuper, { n: ev.n }), "gain"); break;
      case "xp": chip("xp", MT.rewardLabel(MT.reward("xp", ev.n)), "gain"); break;
      case "sticker": chip("sticker", MT.name(ev.n), "gain"); break;
      case "recruit": chip("users", T.evJoins, "gain"); break;
      case "defector": chip("lock", T.captiveTaken, "gain"); break;
      case "desert": chip("users", T.evLeaves, "risk"); break;
      case "wound": chip("heal", fill(ev.cs.length > 1 ? T.penWoundN : T.penWound1, { n: ev.cs.length }), "risk"); break;
      case "heal": chip("heal", T.evHealed, "gain"); break;
      case "healAll": chip("heal", T.infHealed, "gain"); break;
      case "healDelay": chip("heal", fill(T.evHealLater, { h: hoursText(ev.h) }), "risk"); break;
      case "promote": chip("star", fill(T.fileUp, { t: tierName(ev.c.t + 1) }), "gain"); break;
      case "escape": chip("lock", T.evEscaped, "risk"); break;
      case "jailDelay": chip("lock", fill(T.evJailLater, { h: hoursText(ev.h) }), "risk"); break;
      case "turn": chip("check", T.stTurned, "gain"); break;
      case "tent": chip("recruit", T.evTent, "gain"); break;
      case "tentBurn": chip("recruit", T.evTentBurn, "risk"); break;
      case "board": chip("compass", T.evBoard, ev.good ? "gain" : "risk"); break;
      case "squadHome": chip("compass", T.runBack, "gain"); break;
      case "squadDelay": chip("clock", fill(T.evLate, { h: hoursText(ev.h) }), "risk"); break;
    }
    return out;
  }

  /* THE CARDS OF A DAY, one after another: each is read and put away with a
     tap anywhere, and that tap is what applies it — neither the scrim nor
     ESCAPE walks past one without it, since a bad day skipped would be a bad
     day that never happened. */
  var EV_W = 190, EV_TINY = 96;

  function openEvents(then) {
    var q = evState().q;
    if (!q.length) { then(); return; }
    openEvent(q[0], q.length, function () { openEvents(then); });
  }

  function openEvent(ev, left, then) {
    var d = EV_BY[ev.id], done = false, off = null;
    if (!d) {
      var q0 = evState().q;
      q0.splice(q0.indexOf(ev), 1);
      MT.setArmy(save);
      then();
      return;
    }
    var gains = ev.good && /^(coins|ticket|super|xp|sticker)$/.test((d.fx || {}).kind || "");
    MD.open({
      kind: "ar-event", dismiss: false, esc: false, onClose: then,
      eyebrow: left > 1 ? fill(T.evEyebrowN, { n: left }) : T.evEyebrow,
      title: loc(d.title),
      tap: gains ? T.repCollect : T.tapContinue,
      fill: function (card, close, handle) {
        card.appendChild(el("div", "ar-stamp " + (ev.good ? "ok" : "ko"), W.upper(ev.good ? T.evGood : T.evBad)));
        var run = ev.m ? MISSION[ev.m] : null;
        card.appendChild(text("p", "ar-ev-text", fill(loc(d.text), { c: evWho(ev), m: run ? loc(run.title) : "" })));
        var cs = ev.cs || (ev.c ? [ev.c] : []);
        if (cs.length) {
          var row = el("div", "ar-fallen-list" + (cs.length === 1 ? " one" : "") + (PAINTED ? " painted" : ""));
          for (var i = 0; i < cs.length; i++) row.appendChild(evCard(ev, cs[i], cs.length === 1));
          card.appendChild(row);
        }
        var chips = evChips(ev);
        if (chips.length) {
          var out = el("div", "ar-rep-out");
          for (var k = 0; k < chips.length; k++) out.appendChild(chips[k]);
          card.appendChild(out);
        }

        function finish() {
          if (done) return;
          done = true;
          if (off) off();
          var q = evState().q, at = q.indexOf(ev);
          if (at >= 0) q.splice(at, 1);
          var fly = applyEvent(ev);
          close();
          fly();
          if (ev.good) W.Sound.ui("win", 0.7);
        }
        MT.tapOut(handle.box, finish);
        off = MT.keyOut(finish);
      }
    });
    W.Sound.ui(ev.good ? "win" : "fail", ev.good ? 0.75 : 0.6);
  }

  /* The card a day is about: a prisoner in red (or already in the blue cloth
     when the day turned them), a promoted card at the tier it climbs to. */
  function evCard(ev, c, one) {
    var kind = ((EV_BY[ev.id] || {}).fx || {}).kind;
    var tile = ev.red
      ? cardTile({ g: c.g, t: c.t, o: kind === "turn" ? "red" : null },
                 { foe: kind !== "turn", fmt: one ? "mid" : "tiny", w: one ? EV_W : EV_TINY })
      : cardTile({ g: c.g, t: kind === "promote" ? Math.min(TOP, c.t + 1) : c.t, b: kind === "promote" && c.b == null ? c.t : c.b, o: c.o },
                 { fmt: one ? "mid" : "tiny", w: one ? EV_W : EV_TINY,
                   dim: kind === "desert", tag: kind === "wound" ? T.fateHurt : kind === "promote" ? T.fateUp : null,
                   tagClass: kind === "wound" ? "hurt" : "up" });
    var b = el("div", "ar-fallen-c");
    b.appendChild(tile);
    if (!one) b.appendChild(text("span", "ar-fallen-n", W.upper(whoName(c.o || "blue", c.g, c.b != null ? c.b : c.t))));
    return b;
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

  /* THE CARDS HOUSE, three tabs on one screen and not three houses: the camp
     is every card the army holds and what each is doing, the deck the ones
     taken into battle, the collection every card of the war rather than the
     ones owned — the same cards read three ways, and a door for each would
     be a hub of reference books. The deck tab is where the screen always
     opens, because it is the one with something to do on it.

     THE DECK TAB IS THE FORMATION AND NOTHING ELSE (lab/stratideck-deck.html,
     "two lists"): every slot the battle has, as medium cards four a row, the
     empty ones included, on one page with nothing to scroll. The reserve is not a second grid under it — it is
     the PICKER a `+` opens, a card over the screen with its own filters,
     since the question an empty slot asks is "which card goes here", and a
     roster of thirty scrolled under the slots was that question asked of
     the whole screen. The collection tab is the CODEX of
     lab/stratideck-collection.html: one card at a time, at full size, and
     the whole of who they are under it — the objects are its third book,
     so there is no fourth tab. */
  var TABS = ["roll", "deck", "coll"];

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
    d.roll = el("div", "ar-pane ar-roll-pane");

    for (var i = 0; i < TABS.length; i++) DK.body.appendChild(d[TABS[i]]);
  }

  /* THE PAGES ARE THE SHEET'S BAR, at the foot of the screen — the cards'
     three, the command's four. A tap on the page already lit does nothing,
     unless the screen says it is not at the top of that page (`S.deep`: the
     camp's briefing, which its tab leaves). */
  var TAB_ICON = { roll: "users", deck: "deck", coll: "file", posts: "crown", tent: "recruit", mis: "compass", reg: "skull",
                   strat: "shield", rep: "sword" };

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
      W.Sound.ui("tap", 0.45);
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
    else if (DK.tab === "roll") paintRoll();
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

  /* THE MEDIUM CARD, four a row: the twenty slots are five rows, and the whole
     formation stands on one page of the sheet with nothing to scroll. */
  var LINE_W = 150;

  function paintRoster() {
    var i, c;
    head(DK, T.deckTitle, "");
    DK.deckHead.innerHTML = W.upper(T.deckSection) +
      ' <b>' + save.d.length + " / " + deckCap() + '</b>';
    /* NO LINE ABOUT THE GAPS: an empty slot says it is empty, and the room
       that sentence took is the room that lets the formation fit on one
       page. The short way to a full deck is always on that line, so the
       line never changes shape, and it is OFF where it would do nothing:
       no gap, or no fit card in reserve to put in it. */
    var gap = deckShort();
    DK.fill.innerHTML = "<span>" + W.upper(T.fillBest) + "</span>";
    DK.fill.disabled = !(gap && reserveList(true).length);

    DK.slots.innerHTML = "";
    var cap = deckCap();
    for (i = 0; i < cap; i++) {
      c = i < save.d.length ? byId(save.d[i]) : null;
      DK.slots.appendChild(c ? deckSlot(c) : emptySlot());
    }
    /* THE SLOTS THE FORMATION HAS NOT OPENED YET: every one the deck could
       ever hold is drawn, the ones past the gauge locked, each with the
       gauge it waits for. */
    for (i = cap; i < DECK_R[1]; i++) DK.slots.appendChild(lockedSlot("drill"));
    DK.justIn = null;
  }

  /* ── the slots a post has not opened yet ── */

  /* A LOCKED SLOT, wherever a post sets a ceiling — the deck, the beds, the
     cells, the mission board: the padlock and the gauge that opens it. A tap
     says which post that is and which trades suit it, since that is the
     whole of what the player can do about it. */
  function lockTap(k) {
    return function (e) {
      if (e) e.stopPropagation();
      say(fill(T.lockSay, { post: T["post_" + k] }), jobsOf(k).join(" · "), "info", "lock");
      W.Sound.ui("deny", 0.35);
    };
  }

  /* The deck's slot is the padlock alone: twenty slots on one page leave no
     room for a line under each, and the tap says which post opens it. */
  function lockedSlot(k) {
    var b = el("button", "ar-slot empty locked");
    b.appendChild(el("span", "ar-lock", icon("lock", "ar-ci")));
    b.setAttribute("aria-label", fill(T.lockSay, { post: T["post_" + k] }));
    b.addEventListener("click", lockTap(k));
    return b;
  }
  /* A bed or a cell the room does not have yet: the free place's footprint
     with the padlock in it, and under it the word that says so — the tap
     names the post that opens it. */
  function lockedCell(k) {
    var c = el("button", "ar-cell free locked");
    c.appendChild(el("div", "ar-free-slot", icon("lock", "ar-ci")));
    c.appendChild(text("div", "ar-rowsub", W.upper(T.locked)));
    c.setAttribute("aria-label", fill(T.lockSay, { post: T["post_" + k] }));
    c.addEventListener("click", lockTap(k));
    return c;
  }
  /* A mission slot the missions' post has not opened yet: the footprint
     with the padlock in it and the word, and the tap says which post opens
     it. */
  function lockedRow(k) {
    var row = el("button", "ar-row free locked");
    row.appendChild(el("div", "ar-free-slot", icon("lock", "ar-ci")));
    row.appendChild(text("div", "ar-rowsub", W.upper(T.locked)));
    row.setAttribute("aria-label", fill(T.lockSay, { post: T["post_" + k] }));
    row.addEventListener("click", lockTap(k));
    return row;
  }

  function fillBest() {
    var pool = reserveList(true), k = 0;
    while (save.d.length < deckCap() && k < pool.length) save.d.push(pool[k++].i);
    if (!k) return;
    persist();
    say(fill(k === 1 ? T.filled1 : T.filledN, { n: k }), "", "good", "check");
    W.Sound.ui("win", 0.6, 1.1);
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
      W.Sound.ui("tap", 0.4, 0.9);
    });
    w.appendChild(del);
    return w;
  }

  /* An empty slot is the door to the picker. The deck is an ordered list
     with its gaps at the end, so every `+` fills the first gap — which is
     why the picker counts the deck rather than naming the slot tapped. */
  function emptySlot() {
    var b = el("button", "ar-slot empty");
    b.appendChild(el("span", "ar-plus", "+"));
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
    if (save.d.length >= deckCap()) { say(T.deckFullWarn, "", "warn"); return; }
    pickCard({
      grade: DK.pick, take: T.deckTake,
      eyebrow: T.deckSection + " · " + save.d.length + " / " + deckCap(),
      title: T.pickTitle,
      choose: function (c) {
        if (save.d.length >= deckCap()) { say(T.deckFullWarn, "", "warn"); return; }
        if (inDeck(c.i)) return;
        save.d.push(c.i);
        DK.justIn = c.i;
        persist();
        W.Sound.ui("tap", 0.45, 1.1);
      }
    });
  }

  /* THE PICKER ITSELF, and the camp's posts and a mission's squad open the
     same one: the question is the same — which free card goes here. `o.grade`
     is the filter kept between two openings, `o.choose` what the `+` does once
     the card is put away; `o.list` the cards offered (the deck's reserve by
     default), `o.tag` the one fact a token wears, `o.empty` the line when
     nothing is left to offer. `o.objects` lists object tokens (`{ g, obj }`)
     laid in front of the cards whenever no grade is filtered — the
     defense's flag and scenery (section 8c'). */
  function pickCard(o) {
    var P = o.grade, strip = null, grid = null;
    MD.open({
      kind: "ar-picker", height: PICK_H,
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
          /* the `*` in front is every grade at once, the strip's way back
             from a filter — lit whenever no grade is */
          n = el("button", "ar-g all" + (P.g ? "" : " on"), "*");
          n.setAttribute("aria-label", T.pickAll);
          n.title = T.pickAll;
          n.addEventListener("click", gradeTap(0, true));
          strip.appendChild(n);
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
          var objs = !P.g && o.objects ? o.objects() : [];
          grid.innerHTML = "";
          grid.scrollTop = 0;
          grid.classList.toggle("empty", !list.length && !objs.length);
          for (i = 0; i < objs.length; i++) grid.appendChild(pickerTile(objs[i], close, o));
          for (i = 0; i < list.length; i++) grid.appendChild(pickerTile(list[i], close, o));
          if (!list.length && !objs.length) grid.appendChild(el("p", "ar-none", o.empty || T.pickEmpty));
        }
        /* A GRADE REPAINTS THE CARD UNDER THE FINGER, so its click stops
           here rather than reaching the modal's own listener, which closes
           the card on any tap that is not on a control (view.js,
           `dismiss`). A grade tapped again is every grade again, and so is
           the `*`; a grade with nothing ready answers nothing. */
        function gradeTap(g, any) {
          return function (e) {
            e.stopPropagation();
            if (!any) return;
            P.g = !g || P.g === g ? 0 : g;
            paint();
            W.Sound.ui("tap", 0.35, 1.05);
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
    b.appendChild(cardTile(c.obj ? { g: c.g, t: null } : face(c), {
      obj: !!c.obj, fmt: "tiny", w: PICK_W, tag: tag ? tag.word : null, tagClass: tag ? tag.cls : ""
    }));
    b.setAttribute("aria-label", T.fileOpen);
    b.addEventListener("click", function () {
      if (c.obj) openFile({ g: c.g, obj: true }, "none", b);
      else openFile(whoOf(c), "blue", b);
    });
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
      /* an object is the player's once the climb handed it over — the
         defense's unlock (section 8c'), the flag from the start */
      var own = unlocked();
      for (i = 0; i < OBJECTS.length; i++) out.push({ side: side, g: OBJECTS[i].r, t: null, had: own[OBJECTS[i].r] != null });
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
      W.Sound.ui("tap", 0.3, 1 + (i % 2) * 0.06);
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
        W.Sound.ui("tap", 0.45);
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
        W.Sound.ui("tap", 0.35);
      });
      return c;
    }
  }

  function filterLabel(key) {
    var X = DK.cx;
    if (key !== "had") return T["f_" + key];
    return T[X.side === "red" ? "f_met" : "f_had"];
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
      if (o.side === "obj") say(objGhost(o.g), "", "info", "lock");
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
      lock = o.had ? null : objGhost(o.g);
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
        if (p.job && JOB[p.job]) meta.appendChild(text("span", "ar-cx-job", jobName(JOB[p.job], p)));
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
  }

  function paintInfirmary() {
    var list = hurtList(), i;
    var cap = beds();
    head(IN, T.infTitle, fill(T.infSub, { n: list.length, m: cap }));
    IN.list.innerHTML = "";
    /* EVERY BED IS DRAWN, taken or not: the ceiling is the rule, and a
       rule that only shows once it bites is a card lost by surprise. */
    for (i = 0; i < Math.max(cap, list.length); i++) {
      IN.list.appendChild(i < list.length ? bedCell(list[i]) : freeCell(T.infFree));
    }
    for (i = Math.max(cap, list.length); i < BEDS_R[1]; i++) IN.list.appendChild(lockedCell("inf"));
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
      whoOf(c), "blue", doneOf(c.w, stayOf(c)),
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
  }

  /* ── 8c'. the defense ─────────────────────────────────────────────────── */

  /* THE CAMP THE PLAYER BUILDS. A grid of `DF_COLS` by `DF_ROWS`, filled from
     the same picker as the deck: the FLAG first — nothing else can be placed
     until it stands, since a defense is what protects it — then the
     player's own cards and the objects the climb has handed over, each
     object at most `DF_PER` times and the flag once. The bottom row is the
     FRONT, the side a raid comes from, as a camp's bottom row is in a
     battle.

     A CARD ON GUARD IS STILL IN THE DECK. The defense takes it out of the
     posts and the squads only (`onGuard`), because a roster of seventeen
     cannot man a grid of twenty and a deck of twelve at once. A card
     wounded, away or at a post since it was placed stays drawn, dimmed, and
     is simply not there when the camp is stormed.

     VALIDATING is what arms it: the grid a raid storms is the one last
     validated (`df.v`), so a layout half rearranged is never what the
     attacker finds. How well it holds is played, not computed — the game's
     own battle rules, many times over (games/stratideck, `defense`) — and
     the figure is read in the REPORT only: a gauge beside the grid would
     turn the composing into reading a number up and down. */
  var DF = null;
  var DF_W = 112;

  function dfBlank() { return { g: [], v: null, vt: 0, seen: now(), pend: 0, q: null, last: null, an: {} }; }
  function dfState() {
    if (!save.df) save.df = dfBlank();
    var d = save.df;
    if (!d.g) d.g = [];
    if (!d.an) d.an = {};
    while (d.g.length < DF_N) d.g.push(null);
    return d;
  }
  function dfDrop(g, id) {
    for (var i = 0; g && i < g.length; i++) if (g[i] && g[i].i === id) g[i] = null;
  }
  function dfHas(g, id) {
    for (var i = 0; g && i < g.length; i++) if (g[i] && g[i].i === id) return true;
    return false;
  }
  function dfCount(g, r) {
    var n = 0;
    for (var i = 0; g && i < g.length; i++) if (g[i] && g[i].r === r) n++;
    return n;
  }
  function dfFlag(g) { return dfCount(g, FLAG_R) > 0; }
  function dfSame(a, b) { return JSON.stringify(a || null) === JSON.stringify(b || null); }
  function dfDirty() { var d = dfState(); return !dfSame(d.g, d.v); }
  /* On guard in the grid being composed or in the one standing: either way
     it is a card the player has put on the wall. */
  function onGuard(id) {
    var d = save.df;
    return !!d && (dfHas(d.g, id) || dfHas(d.v, id));
  }
  function objCap(r) { return r === FLAG_R ? 1 : DF_PER; }

  /* WHAT THE CLIMB HAS HANDED OVER: object → the band whose clearing gave it
     (-1 for the flag, which is the player's from the start). A band counts
     once the map calls it PASSED (packages/webshell/levels.js, bandsState) —
     the same milestone the collection's stickers are paid on. */
  function unlocked() {
    var u = {}, lv = window.__LEVELS__, st = null, b, i;
    u[FLAG_R] = -1;
    if (lv && lv.active() && lv.bands) st = lv.bands().bands;
    for (b = 0; st && b < DF_UNLOCK.length; b++) {
      if (!st[b] || !st[b].passed) continue;
      for (i = 0; i < DF_UNLOCK[b].length; i++) u[DF_UNLOCK[b][i]] = b;
    }
    return u;
  }
  function unlockBand(r) {
    for (var b = 0; b < DF_UNLOCK.length; b++) if (DF_UNLOCK[b].indexOf(r) >= 0) return b;
    return -1;
  }
  function bandName(b) {
    var L = CONFIG.web && CONFIG.web.levels && CONFIG.web.levels.bands, list = L && (L[LANG] || L.en);
    return (list && list[b]) || String(b + 1);
  }
  function objGhost(r) {
    var b = unlockBand(r);
    return b >= 0 ? fill(T.objGhostBand, { b: bandName(b) }) : T.objGhostNone;
  }

  /* TWO TABS, and the grid is where the house opens: the STRATEGY is the
     layout being composed, the REPORT the last raid read back duel by duel.
     They are one house because they are one question asked twice — how to
     hold the flag, and how it was held — and the report is what tells the
     player which cell of the strategy to change. */
  var DF_TABS = ["strat", "rep"];

  function buildDefense() {
    DF = screen("ar-defense", "defense");
    DF.tab = "strat";
    DF.pane = {};
    DF.pages(tabList(DF_TABS), pickTab(DF, paintDefense));
    var st = DF.pane.strat = el("div", "ar-pane");
    DF.grid = el("div", "ar-def" + (PAINTED ? " painted" : ""));
    DF.grid.style.setProperty("--df-cols", DF_COLS);
    st.appendChild(DF.grid);
    DF.front = el("div", "ar-def-front");
    st.appendChild(DF.front);
    DF.note = el("p", "ar-note ar-def-note");
    st.appendChild(DF.note);
    DF.acts = el("div", "ar-acts ar-def-acts");
    st.appendChild(DF.acts);
    DF.body.appendChild(st);
    DF.pane.rep = el("div", "ar-pane ar-drep-pane");
    DF.body.appendChild(DF.pane.rep);
    DF.justIn = -1;
  }

  function paintDefense() {
    paintTabs(DF, DF_TABS);
    if (DF.tab === "rep") paintDfReport();
    else paintDfStrat();
  }

  function paintDfStrat() {
    var d = dfState(), i, flag = dfFlag(d.g), dirty = dfDirty();
    /* a validated grid says nothing: the button gone is the sign */
    head(DF, T.defenseTitle, !flag ? T.dfSubFlag : dirty ? (d.v ? T.dfSubDirty : T.dfSubNew) : "");
    DF.grid.innerHTML = "";
    for (i = 0; i < DF_N; i++) DF.grid.appendChild(dfSlot(i));
    DF.justIn = -1;
    DF.front.innerHTML = icon("arrowUp", "ar-ci") + "<span>" + W.upper(T.dfFront) + "</span>" + icon("arrowUp", "ar-ci");
    DF.note.textContent = T.dfNote;
    DF.acts.innerHTML = "";
    if (dirty || !d.v) {
      var go = el("button", "btn" + (flag ? "" : " is-off"), icon("shield", "ar-ci") + "<span>" + W.upper(T.dfValidate) + "</span>");
      go.addEventListener("click", function () {
        if (!dfFlag(dfState().g)) { say(T.dfNeedFlag, "", "warn", "info"); return; }
        var s = dfState();
        s.v = JSON.parse(JSON.stringify(s.g));
        s.vt = now();
        persist();
        say(T.dfValidated, T.dfValidatedSub, "good", "check");
        W.Sound.ui("win", 0.8, 0.94);
      });
      DF.acts.appendChild(go);
      if (d.v && dirty) {
        var undo = el("button", "btn btn-plate", "<span>" + W.upper(T.dfUndo) + "</span>");
        undo.addEventListener("click", function () {
          var s = dfState();
          s.g = JSON.parse(JSON.stringify(s.v));
          persist();
        });
        DF.acts.appendChild(undo);
      }
    }
  }

  /* THE REPORT TAB: the last raid, as the list of duels it was — every card
     the red army sent, in the order it was sent, against what it struck
     and how it went. The report the village showed says WHETHER the camp
     held; this says WHERE, which is what the strategy tab is changed on. A
     report still waiting at the village is not read here first: the village
     is where it pays. */
  function paintDfReport() {
    var d = dfState(), rep = d.last, P = DF.pane.rep, i;
    P.innerHTML = "";
    head(DF, T.defenseTitle, rep ? fill(T.dfRepSub, { d: whenText(rep.at) }) : T.dfRepNoneSub);
    if (!rep) {
      P.appendChild(text("p", "ar-note ar-drep-note", fill(T.dfRepNone, { n: DF_ATT.awayHours || 4 })));
      return;
    }
    /* THE VERDICT FIRST, as the village's card stamped it, then the solidity
       and the tally of the duels: how many the camp won, how many the raid */
    var top = el("div", "ar-drep-top " + (rep.ok ? "ok" : "ko"));
    top.appendChild(el("div", "ar-stamp " + (rep.ok ? "ok" : "ko"), W.upper(rep.ok ? T.dfStampHeld : T.dfStampLost)));
    top.appendChild(text("div", "ar-drep-verdict", rep.ok ? T.dfRepHeld : T.dfRepLost));
    var g = el("div", "ar-pgauge ar-df-sol" + (rep.sol >= 70 ? " full" : ""));
    var bar = el("div", "ar-pgauge-t"), f = el("i");
    f.style.width = rep.sol + "%";
    bar.appendChild(f);
    g.appendChild(text("span", "ar-df-sol-l", W.upper(T.dfSolid)));
    g.appendChild(bar);
    g.appendChild(el("b", "", rep.sol + "%"));
    top.appendChild(g);
    if (rep.log) {
      var nc = 0, nf = 0;
      for (i = 0; i < rep.log.length; i++) {
        var sd = duelSide(rep.log[i].k);
        if (sd === "camp") nc++; else if (sd === "foe") nf++;
      }
      var tally = el("div", "ar-chips ar-drep-tally");
      tally.appendChild(mkChip("shield", fill(T.dfRepCamp, { n: nc }), "camp"));
      tally.appendChild(mkChip("sword", fill(T.dfRepFoe, { n: nf }), "foe"));
      top.appendChild(tally);
    }
    P.appendChild(top);
    if (!rep.log) {
      P.appendChild(text("p", "ar-note ar-drep-note", T.dfRepNoLog));
      return;
    }
    P.appendChild(el("h3", "ar-sec ar-drep-sec", W.upper(T.dfRepOrder) + " <b>" + rep.log.length + "</b>"));
    var list = el("div", "ar-bouts" + (PAINTED ? " painted" : ""));
    for (i = 0; i < rep.log.length; i++) list.appendChild(duelRow(rep.log[i], i + 1));
    P.appendChild(list);
  }

  /* WHO FOUGHT, BY NAME, as every screen of the barracks names an officer:
     the cast's first and last name — the camp's card by the tier it was
     raised at, since that is who it is — and an object by what it is. It is
     what the outcome line under the two cards is written with. */
  function duelName(p, foe) {
    if (OBJECT[p[0]]) return W.Lang.t(gradeName(p[0]));
    var c = !foe && p[2] != null ? byId(p[2]) : null;
    if (c) return whoName(c.o === "red" ? "red" : "blue", p[0], baseOf(c));
    return whoName(foe ? "red" : "blue", p[0], p[1] | 0);
  }

  /* Which side came out of a duel on top: the raid took the cell, turned it
     over or walked past it; the camp stopped the card; a draw is nobody's. */
  var DUEL_RED = { win: 1, clear: 1, smash: 1, flag: 1, scout: 1 };
  function duelSide(k) { return k === "tie" ? "even" : DUEL_RED[k] ? "foe" : "camp"; }
  /* ...and who is left DIMMED for it: the card that lost, both on a draw,
     nobody on a scout's look */
  var DUEL_DIM = { win: "d", clear: "d", smash: "d", flag: "d", lose: "a", trap: "a", stray: "a",
                   stun: "a", spell: "a", decoy: "a", block: "a", tie: "ad" };

  /* THE TWO CARDS OF A DUEL, face to face at the deck's medium size: the red
     attacker on the left, the camp's card on the right — the very officer
     who stood guard, when the report kept who it was. The winner stands in
     its army's glow, the loser dimmed, and a wound on a winner is a badge
     on the card's corner — a tag over a medium card hides its name — and a
     line under the outcome. */
  var BOUT_W = 132;

  function duelCard(p, foe, dim, hurt) {
    var obj = !!OBJECT[p[0]], c = !foe && p[2] != null ? byId(p[2]) : null, tile, who;
    if (obj) {
      tile = cardTile({ g: p[0], t: null }, { obj: true, fmt: "mid", w: BOUT_W, dim: dim });
      who = { g: p[0], obj: true };
    } else {
      var f = c ? { g: p[0], t: p[1] | 0, b: c.b, o: c.o } : { g: p[0], t: p[1] | 0 };
      tile = cardTile(f, { foe: foe, fmt: "mid", w: BOUT_W, dim: dim });
      who = foe ? { o: "red", g: p[0], t: p[1] | 0 } : c ? whoOf(c) : { o: "blue", g: p[0], t: p[1] | 0 };
    }
    var w = el("div", "ar-bout-card " + (foe ? "foe" : "camp") + (dim ? " lost" : " up"));
    w.appendChild(fileDoor(tile, who, obj ? "none" : foe ? "red" : "blue"));
    if (hurt) {
      var h = el("i", "ar-bout-hurt", icon("heal", "ar-ci"));
      h.setAttribute("aria-label", T.fateHurt);
      w.appendChild(h);
    }
    return w;
  }

  function duelRow(L, n) {
    var a = duelName(L.a, true), d = duelName(L.d, false), res, side = duelSide(L.k), dim = DUEL_DIM[L.k] || "";
    switch (L.k) {
      case "win":   res = fill(T.duWin, { w: a }); break;
      case "lose":  res = fill(T.duWin, { w: d }); break;
      case "tie":   res = T.duTie; break;
      case "flag":  res = T.duFlag; break;
      case "trap":  res = fill(T.duTrap, { a: a }); break;
      case "clear": res = fill(T.duClear, { a: a }); break;
      case "smash": res = fill(T.duSmash, { a: a }); break;
      case "stray": res = fill(T.duStray, { a: a }); break;
      case "stun":  res = fill(T.duStun, { a: a }); break;
      case "spell": res = fill(T.duSpell, { a: a }); break;
      case "scout": res = fill(T.duScout, { a: a }); break;
      default:      res = fill(T.duBlock, { a: a });
    }
    var row = el("div", "ar-bout " + side + (L.k === "flag" ? " flag" : ""));
    row.appendChild(duelCard(L.a, true, dim.indexOf("a") >= 0, !!L.h));
    var mid = el("div", "ar-bout-mid");
    mid.appendChild(el("b", "ar-bout-n", String(n)));
    mid.appendChild(text("span", "ar-bout-vs", W.upper(T.duVs)));
    mid.appendChild(text("span", "ar-bout-res", res));
    if (L.h) mid.appendChild(el("span", "ar-bout-wound", icon("heal", "ar-ci") + "<span>" + T.fateHurt + "</span>"));
    row.appendChild(mid);
    row.appendChild(duelCard(L.d, false, dim.indexOf("d") >= 0, false));
    return row;
  }

  /* The day and the hour a raid came: a report is read the day after as
     often as the minute after. */
  function whenText(at) {
    try {
      return new Date(at).toLocaleString(LANG === "fr" ? "fr-FR" : "en-GB",
        { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (err) {
      return "";
    }
  }

  /* One cell: its card or object (a door to its file, the `−` on its
     corner), or the `+` that opens the picker. */
  function dfSlot(i) {
    var d = dfState(), e = d.g[i], w, b;
    if (e) {
      var c = e.r ? null : byId(e.i);
      if (!e.r && !c) { d.g[i] = null; return dfSlot(i); }
      w = el("div", "ar-slot-w");
      b = el("button", "ar-slot" + (DF.justIn === i ? " arrive" : ""));
      if (e.r) {
        b.appendChild(cardTile({ g: e.r, t: null }, { obj: true, fmt: "tiny", w: DF_W }));
        b.addEventListener("click", function () { openFile({ g: e.r, obj: true }, "none", b); });
      } else {
        var off = !free(c);
        b.appendChild(cardTile(face(c), { fmt: "tiny", w: DF_W, dim: off,
          tag: off ? (!fit(c) ? T.fateHurt : T.dfOff) : null, tagClass: off ? "hurt" : "" }));
        b.addEventListener("click", function () { openFile(whoOf(c), "blue", b); });
      }
      b.setAttribute("aria-label", T.fileOpen);
      w.appendChild(b);
      var del = el("button", "ar-act del", "−");
      del.setAttribute("aria-label", T.dfDrop);
      del.addEventListener("click", function () {
        var s = dfState();
        if (s.g[i] !== e) return;
        s.g[i] = null;
        persist();
        W.Sound.ui("tap", 0.4, 0.9);
      });
      w.appendChild(del);
      return w;
    }
    b = el("button", "ar-slot empty");
    b.appendChild(el("span", "ar-plus", "+"));
    b.setAttribute("aria-label", T.dfPick);
    b.addEventListener("click", function () { openDfPicker(i); });
    return b;
  }

  /* THE DECK'S PICKER, with the objects in front of the cards. Until the
     flag stands it offers the flag and nothing else. */
  function openDfPicker(at) {
    var d = dfState(), flag = dfFlag(d.g);
    pickCard({
      grade: { g: 0 }, take: T.dfTake,
      eyebrow: flag ? T.defenseTitle : T.dfFlagFirst,
      title: T.dfPick, empty: T.availNone,
      objects: function () {
        var own = unlocked(), out = [], i, r;
        if (!flag) return [{ g: FLAG_R, obj: true, left: 1 }];
        for (i = 0; i < OBJECTS.length; i++) {
          r = OBJECTS[i].r;
          if (own[r] == null) continue;
          var left = objCap(r) - dfCount(dfState().g, r);
          if (left > 0) out.push({ g: r, obj: true, left: left });
        }
        return out;
      },
      list: function () {
        if (!flag) return [];
        var out = [], i, c, s = dfState();
        for (i = 0; i < save.r.length; i++) {
          c = save.r[i];
          if (fit(c) && !awayRun(c.i) && !postOf(c.i) && !dfHas(s.g, c.i)) out.push(c);
        }
        return out.sort(cmpCard);
      },
      tag: function (c) { return c.obj && objCap(c.g) > 1 ? { word: "x" + c.left, cls: "in" } : null; },
      choose: function (c) {
        var s = dfState();
        if (s.g[at]) return;
        if (c.obj) {
          if (dfCount(s.g, c.g) >= objCap(c.g)) return;
          if (c.g !== FLAG_R && !dfFlag(s.g)) return;
          s.g[at] = { r: c.g };
        } else {
          if (!dfFlag(s.g) || dfHas(s.g, c.i)) return;
          s.g[at] = { i: c.i };
        }
        DF.justIn = at;
        persist();
        W.Sound.ui("tap", 0.45, 1.1);
      }
    });
  }

  /* ── the raid ── */

  /* A RAID COMES WITH EVERY RETURN. `seen` is the last moment the player was
     here — every write moves it, and so does the tab going to the
     background — and a session that starts, or a tab that comes back, after
     `awayHours` of absence arms ONE raid, which the village plays out the
     next time it is on screen (`announce`). No dice: the player left, and
     the camp was stormed while they were gone. A reload is not an absence,
     so a prisoner cannot be farmed by refreshing the page. */
  function awayMs() { return (DF_ATT.awayHours || 4) * hour(); }
  function dfSeen() { if (save && save.df) save.df.seen = now(); }
  function dfArrive() {
    var d = dfState();
    if (d.v && dfFlag(d.v) && now() - (d.seen || 0) >= awayMs()) d.pend = 1;
    d.seen = now();
  }

  /* The grid as the attacker finds it: the objects, and the cards that are
     here today — a card wounded, away or at a post is not on the wall. */
  function dfCells(g) {
    var out = [], i, e, c;
    for (i = 0; i < DF_N; i++) {
      e = g[i];
      if (!e) { out.push(null); continue; }
      if (e.r) { out.push({ r: e.r }); continue; }
      c = byId(e.i);
      out.push(c && free(c) ? { r: c.g, t: c.t, id: c.i } : null);
    }
    return out;
  }

  /* THE ATTACKER IS THE PLAYER'S OWN ARMY, SEEN IN A MIRROR: one red card
     for every card the roster holds, its grade and its tier each a step up,
     a step down or the same. A raid is therefore as strong as the camp it
     storms, at every point of the climb, and a roster that grows grows the
     threat with it. */
  function redArmy() {
    var out = [], i, c, top = 1, steps = [-1, 0, 0, 1];
    for (i = 0; i < GRADES.length; i++) if (GRADES[i].r > top) top = GRADES[i].r;
    for (i = 0; i < save.r.length; i++) {
      c = save.r[i];
      out.push({ r: clamp(c.g + steps[Math.floor(Math.random() * 4)], 1, top),
                 t: clamp(c.t + steps[Math.floor(Math.random() * 4)], 0, TOP) });
    }
    return out;
  }

  function lerp2(pair, f) { return pair[0] + (pair[1] - pair[0]) * f; }
  /* 0 at level 1, 1 at `levelSpan`: what the report pays and takes grows
     with the player, so a beginner is nudged and a rich camp feels it. */
  function levelF() {
    var span = Math.max(2, DEF.levelSpan || 20);
    return clamp(((MT.level ? MT.level() : 1) - 1) / (span - 1), 0, 1);
  }

  function dfRoll() {
    var d = dfState();
    if (!d.pend) return;
    d.pend = 0;
    if (!d.v || !dfFlag(d.v) || !W.Game || !W.Game.defense) return;
    var army = redArmy();
    if (!army.length) return;
    var sim = W.Game.defense(dfCells(d.v), DF_COLS, DF_ROWS, army,
                             { runs: DF_ATT.runs || 200, turns: DF_ATT.turns || 12 });
    d.q = dfReport(sim);
  }

  /* THE REPORT IS WRITTEN WHEN THE RAID IS ROLLED, and applied when it is
     read: the assault that happened is the simulation's extra run, and the
     solidity is the share of the others the layout held. */
  function dfReport(sim) {
    var run = sim.run, lf = levelF(), rep = { at: now(), ok: !!run.held, sol: Math.round(sim.held * 100) }, i, c;
    var WIN = DEF.win || {}, LOSS = DEF.loss || {};
    /* THE DUELS, in the order they were fought, for the report tab: the
       attacker and the cell it struck as `[grade, tier]` (an object has no
       tier, the camp's card adds its id), `judge`'s kind, and `h` when the
       winner was wounded */
    rep.log = [];
    for (i = 0; run.log && i < run.log.length; i++) {
      c = run.log[i];
      rep.log.push({ a: [c.a.r, c.a.t], d: OBJECT[c.d.r] ? [c.d.r] : c.d.id != null ? [c.d.r, c.d.t, c.d.id] : [c.d.r, c.d.t],
                     k: c.k, h: c.hurt === "a" ? 1 : 0 });
    }
    if (rep.ok) {
      /* one or two of the attackers who fell, one officer each and a cell
         for each — a prison with no room takes nobody */
      var pr = WIN.prisoners || [1, 2];
      var want = pr[0] + Math.floor(Math.random() * (pr[1] - pr[0] + 1));
      var room = Math.max(0, cells() - inPrison()), n = Math.min(want, room), pool = run.fallen.slice(), got = [], taken = {}, k, x;
      while (got.length < n && pool.length) {
        x = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        k = ck("red", x.rank, x.tier);
        if (!GRADE[x.rank] || taken[k] || held(save, "red", x.rank, x.tier)) continue;
        taken[k] = 1;
        got.push({ g: x.rank, t: x.tier });
      }
      while (got.length < n) {
        x = freshOfficer("red", [0, TOP], 1);
        if (!x || taken[ck("red", x.g, x.t)]) break;
        taken[ck("red", x.g, x.t)] = 1;
        got.push({ g: x.g, t: x.t });
      }
      rep.pr = got;
      rep.full = want > room;
      rep.coins = Math.round(lerp2(WIN.coins || [40, 400], lf));
      rep.xp = Math.round(lerp2(WIN.xp || [30, 300], lf));
    } else {
      /* THE MALUS IS A NUDGE: coins out of the wallet, or one or two of the
         cards the raid beat sent to the infirmary — never a card lost, and
         never a wound the infirmary has no bed for. */
      var hurt = [], seen = {};
      for (i = 0; i < run.beaten.length; i++) {
        c = byId(run.beaten[i]);
        if (c && free(c) && !seen[c.i]) { seen[c.i] = 1; hurt.push(c.i); }
      }
      var nW = (LOSS.wounds || [1, 2])[lf < 0.5 ? 0 : 1];
      var bedsLeft = beds() - inInfirmary();
      var canWound = hurt.length > 0 && bedsLeft > 0, coinsOk = MT.coins() > 0;
      if (canWound && (!coinsOk || Math.random() < 0.5)) {
        rep.hurt = [];
        while (rep.hurt.length < Math.min(nW, bedsLeft) && hurt.length) rep.hurt.push(hurt.splice(Math.floor(Math.random() * hurt.length), 1)[0]);
        rep.h = Math.round(lerp2(LOSS.woundHours || [6, 24], lf));
      } else if (coinsOk) {
        rep.fine = Math.max(1, Math.round(Math.min(MT.coins() * lerp2(LOSS.coinShare || [0.03, 0.12], lf), LOSS.coinCap || 500)));
      }
    }
    return rep;
  }

  function dfCollect(rep, card) {
    var d = dfState(), fly = [], i, c, p, before, node, fine = 0, had = MT.coins();
    d.q = null;
    d.last = rep;
    if (rep.ok) {
      for (i = 0; i < (rep.pr || []).length; i++) {
        p = rep.pr[i];
        if (inPrison() < cells() && !held(save, "red", p.g, p.t)) {
          save.p.push({ g: p.g, t: p.t, u: now() + freeMs(p.g) });
          meet(save, p.g, p.t);
        }
      }
      var gains = [["coins", rep.coins], ["xp", rep.xp]];
      for (i = 0; i < gains.length; i++) {
        if (!gains[i][1]) continue;
        var rw = MT.reward(gains[i][0], gains[i][1]);
        node = card.querySelector('[data-rw="' + gains[i][0] + '"]');
        before = gains[i][0] === "coins" ? MT.coins() : MT.xp();
        MT.grant(rw);
        fly.push({ rw: rw, from: node ? node.getBoundingClientRect() : null, before: before, tag: true });
      }
    } else {
      for (i = 0; i < (rep.hurt || []).length; i++) {
        c = byId(rep.hurt[i]);
        if (c && free(c) && inInfirmary() < beds()) hurtFor(c, rep.h * hour());
      }
      fine = Math.min(rep.fine || 0, had);
      if (fine) MT.spend(fine);
    }
    persist();
    return function () {
      for (var k = 0; k < fly.length; k++) MT.fx(fly[k]);
      if (fine) MT.spendFx(had, had - fine);
    };
  }

  /* THE DEFENSE REPORT, at the village: held, with what it paid, or taken,
     with what it cost — and the solidity, which is the one place the
     player reads how good the layout was. A raid that never came says
     nothing at all. A TAP pays it and opens the defense on its REPORT tab,
     where the raid is read duel by duel; a key only pays it, since ESCAPE
     and ENTER put a card away rather than walk somewhere. */
  function openDefenseReport(then) {
    var d = dfState(), rep = d.q, done = false, off = null;
    if (!rep) { then(); return; }
    MD.open({
      kind: "ar-event ar-dfrep", dismiss: false, esc: false, onClose: then,
      eyebrow: T.dfRepEyebrow,
      title: rep.ok ? T.dfRepHeld : T.dfRepLost,
      tap: rep.ok ? T.dfRepTapHeld : T.dfRepTapLost,
      fill: function (card, close, handle) {
        card.appendChild(el("div", "ar-stamp " + (rep.ok ? "ok" : "ko"), W.upper(rep.ok ? T.dfStampHeld : T.dfStampLost)));
        card.appendChild(text("p", "ar-ev-text", rep.ok ? T.dfTextHeld : T.dfTextLost));
        var tiles = [], i, c;
        if (rep.ok) for (i = 0; i < (rep.pr || []).length; i++) tiles.push(cardTile({ g: rep.pr[i].g, t: rep.pr[i].t }, { foe: true, fmt: "tiny", w: EV_TINY }));
        else for (i = 0; i < (rep.hurt || []).length; i++) {
          c = byId(rep.hurt[i]);
          if (c) tiles.push(cardTile(face(c), { fmt: "tiny", w: EV_TINY, tag: T.fateHurt, tagClass: "hurt" }));
        }
        if (tiles.length) {
          var row = el("div", "ar-fallen-list" + (PAINTED ? " painted" : ""));
          for (i = 0; i < tiles.length; i++) { var b = el("div", "ar-fallen-c live"); b.appendChild(tiles[i]); row.appendChild(b); }
          card.appendChild(row);
        }
        var out = el("div", "ar-rep-out"), chip;
        if (rep.ok) {
          if ((rep.pr || []).length) out.appendChild(mkChip("lock", fill(rep.pr.length > 1 ? T.dfPrisonersN : T.dfPrisoners1, { n: rep.pr.length }), "gain"));
          else if (rep.full) out.appendChild(mkChip("lock", T.dfPrisonFull, "risk"));
          if (rep.coins) { chip = mkChip("coin", MT.rewardLabel(MT.reward("coins", rep.coins)), "gain"); chip.setAttribute("data-rw", "coins"); out.appendChild(chip); }
          if (rep.xp) { chip = mkChip("xp", MT.rewardLabel(MT.reward("xp", rep.xp)), "gain"); chip.setAttribute("data-rw", "xp"); out.appendChild(chip); }
        } else {
          if ((rep.hurt || []).length) out.appendChild(mkChip("heal", fill(rep.hurt.length > 1 ? T.penWoundN : T.penWound1, { n: rep.hurt.length }), "risk"));
          if (rep.fine) out.appendChild(mkChip("coin", fill(T.penCoins, { n: MT.num(Math.min(rep.fine, MT.coins()) || rep.fine) }), "risk"));
        }
        if (out.childNodes.length) card.appendChild(out);
        /* THE SOLIDITY, a gauge and the figure, and one line on how to raise
           it when it is low */
        var g = el("div", "ar-pgauge ar-df-sol" + (rep.sol >= 70 ? " full" : ""));
        var bar = el("div", "ar-pgauge-t"), f = el("i");
        f.style.width = rep.sol + "%";
        bar.appendChild(f);
        g.appendChild(text("span", "ar-df-sol-l", W.upper(T.dfSolid)));
        g.appendChild(bar);
        g.appendChild(el("b", "", rep.sol + "%"));
        card.appendChild(g);
        card.appendChild(text("p", "ar-ev-foot", rep.sol < 50 ? T.dfTipLow : rep.sol < 80 ? T.dfTipMid : T.dfTipHigh));

        function finish(open) {
          if (done) return;
          done = true;
          if (off) off();
          var fly = dfCollect(rep, card);
          close();
          fly();
          if (rep.ok) W.Sound.ui("win", 0.8);
          if (open) openDfReportTab();
        }
        MT.tapOut(handle.box, function () { finish(true); });
        off = MT.keyOut(function () { finish(false); });
      }
    });
    W.Sound.ui(rep.ok ? "win" : "fail", 0.8);
  }

  /* The defense's REPORT tab, from wherever the player is: redrawn on it
     when the defense is already the screen on top, opened on it otherwise. */
  function openDfReportTab() {
    if (VW.top() === "defense" && DF) {
      DF.tab = "rep";
      DF.body.scrollTop = 0;
      paintDefense();
    } else {
      VW.go("defense", { tab: "rep" });
    }
  }

  /* A NEW OBJECT CARD, told once, when the band that hands it over is
     passed: what it is, that it is in the collection, and that it now
     guards the camp. One card for all of them — a save that passed three
     bands before the defense existed is told in one tap, not three. */
  function newUnlocks() {
    var u = unlocked(), d = dfState(), out = [], r;
    for (r in u) if (u.hasOwnProperty(r) && +r !== FLAG_R && !d.an[r]) out.push(+r);
    return out;
  }
  function openUnlocks(list, then) {
    if (!list.length) { then(); return; }
    var d = dfState(), u = unlocked(), one = list.length === 1, i, bands = {}, nb = 0;
    for (i = 0; i < list.length; i++) {
      d.an[list[i]] = 1;
      if (!bands[u[list[i]]]) { bands[u[list[i]]] = 1; nb++; }
    }
    MT.setArmy(save);
    MD.open({
      kind: "ar-event ar-unlock", dismiss: false, esc: false, onClose: then,
      eyebrow: nb === 1 ? fill(T.dfUnlockEyebrow, { b: bandName(u[list[0]]) }) : T.dfUnlockEyebrowN,
      title: one ? W.Lang.t(gradeName(list[0])) : T.dfUnlockTitleN,
      tap: T.tapContinue,
      fill: function (card, close, handle) {
        var row = el("div", "ar-fallen-list" + (one ? " one" : "") + (PAINTED ? " painted" : ""));
        for (var k = 0; k < list.length; k++) {
          var b = el("div", "ar-fallen-c live");
          b.appendChild(cardTile({ g: list[k], t: null }, { obj: true, fmt: "mid", w: one ? EV_W : 130 }));
          /* the medium card wears its name on its own plate */
          row.appendChild(b);
        }
        card.appendChild(row);
        card.appendChild(text("p", "ar-ev-text", fill(one ? T.dfUnlockText1 : T.dfUnlockTextN, { n: DF_PER })));
        var off = null, done = false;
        function finish() { if (done) return; done = true; if (off) off(); close(); }
        MT.tapOut(handle.box, finish);
        off = MT.keyOut(finish);
      }
    });
    W.Sound.ui("reward", 0.8);
  }

  function paintPrison() {
    var i;
    save.p.sort(function (a, b) { return a.u - b.u; });
    var cap = cells();
    head(PR, T.prisonTitle, fill(T.prisonSub, { n: save.p.length, m: cap }));
    PR.list.innerHTML = "";
    for (i = 0; i < Math.max(cap, save.p.length); i++) {
      PR.list.appendChild(i < save.p.length ? prisonCell(save.p[i]) : freeCell(T.prisonFree));
    }
    for (i = Math.max(cap, save.p.length); i < CELLS_R[1]; i++) PR.list.appendChild(lockedCell("pri"));
  }

  /* A PRISONER IS BEHIND BARS, in red, and the gauge under the card turns
     from red to blue as they do. NO AD BUYS THE TURN: a prisoner is a bonus
     that blocks nothing, so the wait is a reason to come back rather
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
      { o: "red", g: p.g, t: p.t }, turned ? "blue" : "red", doneOf(p.u, freeMs(p.g)), line);
    if (turned) {
      var busy = false;
      line.addEventListener("click", function () {
        if (busy) return;
        busy = true;
        n.classList.add("enlist");
        W.Sound.ui("win", 0.8, 1.09);
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

  /* THE COMMAND IS ONE HOUSE WITH FOUR TABS, and the posts come first: who
     runs the camp is what a command is. The tent and the missions are the
     same question asked two ways — what can this army get that it does not
     have — and both are paid in something the player owns: the tent in
     coins, a mission in cards sent away. The register is who is gone. What
     every card is doing is the CARDS house's camp tab, beside the deck.
     A game whose manifest names no mission has no missions tab. */
  var RT = null;
  var CAMP_TABS = ["posts", "tent"].concat(MISSIONS.length ? ["mis"] : [], ["reg"]);

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
    RT.pane.posts = el("div", "ar-pane ar-camp-pane");
    RT.body.appendChild(RT.pane.posts);
    RT.pane.reg = el("div", "ar-pane ar-reg-pane");
    RT.body.appendChild(RT.pane.reg);
  }

  /* WHAT THE TENT IS OFFERING, AND IT IS ROLLED ON A CLOCK RATHER THAN ON
     ARRIVAL. A shelf that re-rolls every time the player walks in is a shelf
     they re-roll instead of buying from, and the price stops meaning anything.
     The ladder it rolls on leans low: an S on the shelf is an event. */
  function shelf() {
    var k = save.k;
    if (!k || now() - k.t >= tentMs()) k = roll();
    if (cover(k)) MT.setArmy(save);
    return k;
  }

  /* THE GRADES THE CAMP HAS NONE OF — not in the roster at all, whatever the
     roster's cards are doing (a card wounded, away or at a post is still the
     camp's, and comes back). The first roster holds all ten; a grade goes
     missing only when the last card of it is lost. */
  function missingGrades() {
    var have = {}, out = [], i;
    for (i = 0; i < save.r.length; i++) have[save.r[i].g] = 1;
    for (i = 0; i < GRADES.length; i++) if (!have[GRADES[i].r]) out.push(GRADES[i].r);
    return out;
  }

  /* A PLAYER IS NEVER STUCK FOR A GRADE. Every grade the camp has none of gets
     a place on the shelf, flagged `m`, at the lowest tier nobody holds and for
     `R_NEED` coins — the specials included, since a camp without a spy has no
     answer to a marshal and one without a sapper none to a trap: that is not
     the tent selling the solution, it is the tent handing back a piece the
     army cannot play without. Checked every time the shelf is read and not
     only when it is rolled, so a grade lost mid-shelf (or a tent that burned)
     is answered at once rather than in six hours. The place is taken from an
     offer nobody bought and nobody needs, a fallen one last; with none left
     the shelf grows by one rather than keep the grade back. */
  function cover(k) {
    var miss = missingGrades(), changed = false, i, j, g, t, at;
    for (i = 0; i < miss.length; i++) {
      g = miss[i];
      t = freeTier(save, "blue", g, 0);
      if (t < 0) continue;
      at = -1;
      for (j = 0; j < k.o.length; j++) {
        if (k.b.indexOf(j) >= 0 || k.o[j].g !== g) continue;
        if (k.o[j].m) { at = -2; break; }
        if (!k.o[j].f && k.o[j].t === t) { k.o[j].m = 1; changed = true; at = -2; break; }
      }
      if (at === -2) continue;
      for (j = k.o.length - 1; j >= 0 && at < 0; j--) if (k.b.indexOf(j) < 0 && !k.o[j].m && !k.o[j].f) at = j;
      for (j = k.o.length - 1; j >= 0 && at < 0; j--) if (k.b.indexOf(j) < 0 && !k.o[j].m) at = j;
      if (at >= 0) k.o[at] = { g: g, t: t, m: 1 };
      else k.o.push({ g: g, t: t, m: 1 });
      changed = true;
    }
    return changed;
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
    else if (RT.tab === "posts") paintPosts();
    else if (RT.tab === "reg") paintRegister();
    else paintTent();
  }

  function paintTent() {
    var k = shelf(), i;
    head(RT, T.recruitTitle, fill(T.recruitSub, { t: untilText(k.t + tentMs() - now()) }));
    RT.list.innerHTML = "";
    for (i = 0; i < k.o.length; i++) RT.list.appendChild(offerTile(k.o[i], i, k));
  }

  function offerTile(o, idx, k) {
    var sold = k.b.indexOf(idx) >= 0, price = offerPrice(o);
    /* a shelf rolled before the camp took this officer in by another door
       (a mission, a prisoner who turned) cannot sell them a second time */
    var dup = !sold && held(save, o.o || "blue", o.g, o.t);
    var n = el("div", "ar-offer" + (sold || dup ? " sold" : "") + (o.f ? " fallen" : ""));
    var tile = cardTile({ g: o.g, t: o.t, o: o.o }, {
      dim: sold || dup, fmt: "full", w: 250
    });
    n.appendChild(tile);
    if (sold || dup) {
      n.appendChild(el("div", "ar-sold", sold ? T.sold : T.inCamp));
      return n;
    }
    /* AN OFFICER THE COLLECTION HAS NEVER HELD wears a NEW ribbon across the
       card's own corner: the shelf is also where the codex fills, and a face
       never owned is the one worth the coins. A fallen one was owned already,
       and wears the same ribbon in its own colour: RESCUE. */
    if (o.f || !save.c.h[ck(o.o || "blue", o.g, o.t)]) {
      var rb = el("div", "ar-new" + (o.f ? " back" : ""));
      rb.appendChild(el("span", "", W.upper(o.f ? T.backAlive : T.fresh)));
      tile.appendChild(rb);
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
      if (got && save.d.length < deckCap()) save.d.push(got.i);
      persist();
      say(fill(o.f ? T.returned : T.recruited, { c: whoName(o.o || "blue", o.g, o.t) }),
          W.Lang.t(gradeName(o.g)) + " · " + tierName(o.t), "gain", "user");
      W.Sound.ui("win", 0.8, 1.18);
    });
    n.appendChild(b);
    return n;
  }

  /* HOW MANY OF THE SHELF THE WALLET COULD ACTUALLY PAY FOR — the tent's badge.
     Not "there are three cards for sale", which is true every day of the week
     and therefore says nothing. */
  function affordable() {
    var k = save.k, n = 0, i, o;
    if (!k || now() - k.t >= tentMs()) return R_SLOTS;   // a fresh shelf is news on its own
    if (cover(k)) MT.setArmy(save);
    for (i = 0; i < k.o.length; i++) {
      o = k.o[i];
      if (k.b.indexOf(i) < 0 && !held(save, o.o || "blue", o.g, o.t) && MT.coins() >= offerPrice(o)) n++;
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
    if (!s) s = save.ms = { v: 2, t: 0, n: 0, o: [], r: [], q: [], h: {} };
    if (!s.o) s.o = [];
    if (!s.r) s.r = [];
    if (!s.q) s.q = [];
    if (!s.l) s.l = [];
    if (!s.h) s.h = {};
    if (typeof s.w !== "number") s.w = 0;
    if (s.v !== 2) toSlots(s);
    return s;
  }

  /* A SAVE WRITTEN BEFORE THE SLOTS kept the board, the squads and the
     reports as three lists: each is given a slot, the reports first, then
     the squads, then the offers — every one kept, even past the gauge, since
     a squad away cannot be locked out of its own board. */
  function toSlots(s) {
    var k = 0, o = [], i;
    for (i = 0; i < s.q.length; i++) s.q[i].k = k++;
    for (i = 0; i < s.r.length; i++) s.r[i].k = k++;
    for (i = 0; i < s.o.length; i++) { o[k] = s.o[i]; k++; }
    for (i = 0; i < k; i++) if (o[i] == null) o[i] = null;
    s.o = o;
    s.n = k;
    s.v = 2;
  }

  /* What slot `k` holds: "rep" (a report to read), "run" (a squad away),
     "offer" (a mission to pick) or "" (nothing until the board is rolled). */
  function slotRun(s, k) {
    for (var i = 0; i < s.r.length; i++) if (s.r[i].k === k) return s.r[i];
    return null;
  }
  function slotRep(s, k) {
    for (var i = 0; i < s.q.length; i++) if (s.q[i].k === k) return s.q[i];
    return null;
  }
  function slotBusy(s, k) { return !!(slotRun(s, k) || slotRep(s, k)); }
  /* How many slots the tab draws open: the gauge's, and every slot past it
     that still holds something — a squad sent before the post was relieved
     comes home to the slot it left from. */
  function slotsShown(s) {
    var n = boardCap(), i;
    for (i = 0; i < s.r.length; i++) n = Math.max(n, s.r[i].k + 1);
    for (i = 0; i < s.q.length; i++) n = Math.max(n, s.q[i].k + 1);
    for (i = 0; i < s.o.length; i++) if (s.o[i]) n = Math.max(n, i + 1);
    return n;
  }

  function board() {
    var s = mstate(), i, cap = boardCap();
    if (!s.t || now() - s.t >= boardMs()) rollBoard();
    /* A GAUGE THAT ROSE SINCE THE BOARD WAS ROLLED opens its new slots now,
       filled on the spot rather than at the next roll: an officer posted to
       the missions is felt the moment they take the post. A gauge that fell
       keeps what is already pinned until the board is rolled again. `n` is
       how many slots the board was rolled with. */
    if (cap > s.n) rollBoard(true);
    /* a mission the manifest has since dropped is not offered */
    for (i = 0; i < s.o.length; i++) if (s.o[i] && !MISSION[s.o[i]]) s.o[i] = null;
    return s;
  }

  /* Written and not persisted, like the tent's `roll`: the screen drawing
     the board is what rolls it, and `persist` would repaint that screen.

     A ROLL FILLS EVERY SLOT UNDER THE GAUGE THAT HOLDS NO SQUAD AND NO
     REPORT, the missions left unpicked there included; a slot past the gauge
     is emptied. `more` fills only the slots the gauge opened since the last
     roll, keeping the board's clock and what is already pinned on it. */
  function rollBoard(more) {
    var s = mstate(), busy = {}, pool = [], out = [], seen = {}, gaps = [], i, j, tmp;
    var cap = boardCap(), from = more ? s.n : 0;
    for (i = 0; i < s.r.length; i++) busy[s.r[i].m] = 1;
    for (i = 0; i < s.q.length; i++) busy[s.q[i].m] = 1;
    if (more) for (i = 0; i < s.o.length; i++) if (s.o[i]) busy[s.o[i]] = 1;
    if (!more) for (i = cap; i < s.o.length; i++) s.o[i] = null;
    for (i = from; i < cap; i++) {
      if (slotBusy(s, i) || (more && s.o[i])) continue;
      s.o[i] = null;
      gaps.push(i);
    }
    for (i = 0; i < MISSIONS.length; i++) if (!busy[MISSIONS[i].id]) pool.push(MISSIONS[i]);
    for (i = pool.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    /* The least played first — a stable sort over a shuffle, so missions run
       as often as each other stay in random order — then one per difficulty
       before a difficulty is offered twice. */
    pool = stable(pool, function (a, b) { return (s.h[a.id] || 0) - (s.h[b.id] || 0); });
    for (i = 0; i < pool.length && out.length < gaps.length; i++) {
      if (!seen[pool[i].d]) { seen[pool[i].d] = 1; out.push(pool[i]); }
    }
    for (i = 0; i < pool.length && out.length < gaps.length; i++) {
      if (out.indexOf(pool[i]) < 0) out.push(pool[i]);
    }
    /* easiest first, down the slots this roll fills */
    out.sort(function (a, b) { return a.d - b.d || minsOf(a) - minsOf(b); });
    for (i = 0; i < out.length; i++) s.o[gaps[i]] = out[i].id;
    while (s.o.length && s.o[s.o.length - 1] == null) s.o.length--;
    if (!more) s.t = now();
    s.n = cap;
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
      if (free(c) && !onGuard(c.i)) out.push(c);
    }
    return out.sort(cmpCard);
  }

  function launch(m, ids) {
    var s = mstate(), cards = [], i, c;
    for (i = 0; i < ids.length; i++) { c = byId(ids[i]); if (c) cards.push(c); }
    /* THE SQUAD LEAVES FROM THE MISSION'S OWN SLOT, which it holds until its
       report is read */
    var at = s.o.indexOf(m.id);
    if (at >= 0) s.o[at] = null;
    else for (at = 0; slotBusy(s, at) || s.o[at]; at++) {}
    s.r.push({ k: at, m: m.id, c: ids.slice(0), e: now() + minsOf(m) * 60000,
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
    var rep = { k: run.k, m: run.m, ok: ok, p: run.p, sq: sq, rw: [], pen: [] };
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
      if (kind === "wound" && inInfirmary() < beds()) { hurtFor(c, healMs((MISSION[mid] || {}).d)); pick.f = "hurt"; }
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
          if (save.d.length < deckCap()) save.d.push(got.i);
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
      } else {
        /* A super ticket flies like a ticket, into the collection's chip of
           the band, and writes its own figure there (meta.js, `fx`). */
        before = rw.kind === "coins" ? MT.coins() : rw.kind === "ticket" ? MT.tickets()
               : rw.kind === "super" ? MT.supers() : rw.kind === "xp" ? MT.xp() : 0;
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
  /* A mission's length is written in `minutes` (`hours` still reads). */
  function minsOf(m) { return m.minutes != null ? m.minutes : (m.hours || 0) * 60; }
  function minsText(n) {
    var h = Math.floor(n / 60), r = n - h * 60;
    if (!h) return r + T.uM;
    return h + T.uH + (r ? " " + pad(r) + T.uM : "");
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
    row.appendChild(mkChip("clock", minsText(minsOf(m))));
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
    /* TWO SECTIONS AND NO SUBTITLE: the slots, then the history. */
    head(RT, T.misTitle, "");

    /* 1. THE SLOTS, every one the missions' post could ever open, and each
       drawn in the one state it is in — a report to read, a squad away, a
       mission to pick, or empty until the board is rolled again — then a
       padlock for each the gauge has not opened: six rows, so the ceiling
       is seen and not learned on a refusal. A slot is a place, not a list:
       the squad sent on a mission leaves from that mission's row and its
       report comes back to it. NO AD ROLLS THE BOARD EARLY: a board bought
       again is a board shopped for the easy mission, which is what the
       clock is there to prevent. */
    var shown = slotsShown(s), next = untilText(s.t + boardMs() - now()), gap = false, k, rep, run;
    box.appendChild(sec(T.misBoard, shown + " / " + Math.max(shown, BOARD_R[1])));
    var list = el("div", "ar-list ar-mslots");
    for (k = 0; k < Math.max(shown, BOARD_R[1]); k++) {
      rep = slotRep(s, k);
      run = rep ? null : slotRun(s, k);
      if (rep) list.appendChild(reportRow(rep));
      else if (run) list.appendChild(runRow(run));
      else if (s.o[k] && MISSION[s.o[k]]) list.appendChild(missionTile(MISSION[s.o[k]]));
      else if (k < shown) { list.appendChild(freeRow(fill(T.slotNext, { t: next }))); gap = true; }
      else list.appendChild(lockedRow("ops"));
    }
    box.appendChild(list);
    /* the roll replaces the missions nobody picked too, which a board with
       no empty slot has nowhere else to say */
    if (!gap) {
      var note = el("div", "ar-note");
      note.textContent = fill(T.boardNext, { t: next });
      box.appendChild(note);
    }

    /* 2. THE REPORTS ALREADY READ, newest first: what each squad did, a
       success or a failure at a glance, and the report itself on a tap. */
    box.appendChild(sec(T.misLog, s.l.length ? String(s.l.length) : ""));
    if (!s.l.length) { box.appendChild(el("p", "ar-none", T.logEmpty)); return; }
    var log = el("div", "ar-list");
    for (i = 0; i < s.l.length; i++) log.appendChild(logRow(s.l[i]));
    box.appendChild(log);
  }

  /* A slot with nothing in it until the board is rolled: the token's
     footprint, dashed, and when the next mission comes. */
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
      W.Sound.ui("tap", 0.45, 1.05);
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
    var n = el("button", "ar-mis row");
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
    row.appendChild(mkChip("clock", minsText(minsOf(m))));
    row.appendChild(mkChip("deck", fill(sq[0] === sq[1] ? T.squadN : T.squadRange, { a: sq[0], b: sq[1] })));
    if (m.reward && m.reward.length) row.appendChild(mkChip(rewardIcon(m.reward[0]), rewardText(m.reward[0]), "gain"));
    mid.appendChild(row);
    n.appendChild(mid);
    n.appendChild(el("i", "ar-mis-go", icon("next", "ar-ci")));
    n.setAttribute("aria-label", loc(m.title) + " — " + T.prepare);
    n.addEventListener("click", function () {
      RT.brief = { m: m.id, pick: [] };
      RT.body.scrollTop = 0;
      paintRecruit();
      W.Sound.ui("tap", 0.45, 1.05);
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
      if (mstate().o.indexOf(m.id) < 0) { RT.brief = null; paintRecruit(); return; }
      launch(m, RT.brief.pick);
      RT.brief = null;
      RT.body.scrollTop = 0;
      paintRecruit();
      say(T.sent, fill(T.sentSub, { t: minsText(minsOf(m)) }), "info", "clock");
      W.Sound.ui("win", 0.8, 0.8);
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
        if (!RT.brief || RT.brief.pick.length >= sq[1] || RT.brief.pick.indexOf(c.i) >= 0 || !free(c) || onGuard(c.i)) return;
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
    W.Sound.ui("tap", 0.4, at >= 0 ? 0.9 : 1.1);
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
          if (rep.ok) W.Sound.ui("win", 0.8);
        }
        MT.tapOut(handle.box, finish);
        off = MT.keyOut(finish);
      }
    });
    W.Sound.ui(rep.ok ? "win" : "fail", 0.8);
  }

  /* ── 8d''. the command's posts, and the cards' camp ───────────────────── */

  /* TWO PAGES IN TWO HOUSES. The POSTS are the command's first tab — six
     slots, one officer each, filled with the deck's own picker and emptied
     with the same `−` — since running the camp is what a command does. The
     ROLL is the cards house's first tab: every card the camp holds, the
     prisoners included, each with what it is doing today, because a card
     nobody can find is a card nobody plays, and the place it is looked for
     is beside the deck.

     A POST IS A JOB AND A JOB IS EXCLUSIVE: the picker offers only a free
     card out of the reserve (`free`, and not in the deck), and a card at a
     post is out of the deck picker, the squads and the round's deck until
     the `−` gives it back. */
  var POST_W = 150;
  var ROLL_W = 150;

  function paintPosts() {
    var box = RT.pane.posts, i, n = 0, row;
    head(RT, T.postsTitle, T.campSub);
    box.innerHTML = "";
    for (i = 0; i < POSTS.length; i++) if (postCard(POSTS[i].k)) n++;
    box.appendChild(sec(T.campPosts, n + " / " + POSTS.length));
    row = el("div", "ar-posts" + (PAINTED ? " painted" : ""));
    for (i = 0; i < POSTS.length; i++) row.appendChild(postSlot(POSTS[i]));
    box.appendChild(row);
    /* the bonus is the one figure of the note, so it is the one in colour */
    var note = el("p", "ar-note ar-posts-note");
    note.innerHTML = fill(T.postsNote, { b: '<b class="ar-note-b">+' + PP_MATCH + "%</b>" });
    box.appendChild(note);
    RT.justIn = null;
  }

  /* WHAT A POST'S GAUGE BUYS, in the words of the screen it changes, and
     out of the most it could: the range's top, or for the kitchen a morale
     out of ten read straight off the gauge. */
  function postEffect(k) {
    if (k === "cook") return fill(T.fx_cook, { n: Math.round(postPct(k) / 10), m: 10 });
    return fill(T["fx_" + k], { n: postVal(k), m: RANGE[k][1] });
  }

  function paintRoll() {
    var box = DK.pane.roll, i, all, grid;
    head(DK, T.campTitle, "");
    box.innerHTML = "";
    all = rollList();
    box.appendChild(sec(T.campRoll, String(all.length)));
    if (!all.length) { box.appendChild(el("p", "ar-none", T.campNone)); return; }
    grid = el("div", "ar-roll" + (PAINTED ? " painted" : ""));
    for (i = 0; i < all.length; i++) grid.appendChild(rollCell(all[i]));
    box.appendChild(grid);
  }

  /* A post: the name of the post over it, then its officer (a door to
     their file, the `−` on its corner) or the `+` that opens the picker. */
  function postSlot(p) {
    var cell = el("div", "ar-post"), c = postCard(p.k), b;
    /* THE POST'S NAME IS A DOOR TO WHAT IT DOES: what its gauge buys, and
       the five trades that suit it. */
    var name = el("button", "ar-post-l", icon(p.icon, "ar-ci") + "<span>" + W.upper(T["post_" + p.k]) + "</span>");
    name.setAttribute("aria-label", fill(T.postJobs, { post: T["post_" + p.k] }));
    name.addEventListener("click", function () {
      say(T["post_" + p.k], T["pd_" + p.k] + ". " + fill(T.postJobsLine, { j: jobsOf(p.k).join(" · ") }), "info", p.icon);
    });
    cell.appendChild(name);
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
        W.Sound.ui("tap", 0.4, 0.9);
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
    /* the officer's trade, lit where it suits the post, and the bonus on a
       line of its own. The block is drawn on an empty post too, at the same
       height, so the six gauges stand on two straight lines. */
    var job = el("div", "ar-post-job");
    if (c) {
      var fit1 = suits(c, p.k);
      if (fit1) job.className += " match";
      job.appendChild(text("span", "", W.upper(jobName(cardJob(c), castOf(c.o === "red" ? "red" : "blue", c.g, baseOf(c))) || "—")));
      if (fit1) job.appendChild(text("b", "", "+" + PP_MATCH + "%"));
    }
    cell.appendChild(job);
    /* THE GAUGE, and what it buys */
    var pc = postPct(p.k);
    var g = el("div", "ar-pgauge" + (pc >= 100 ? " full" : ""));
    var bar = el("div", "ar-pgauge-t"), f = el("i");
    f.style.width = pc + "%";
    bar.appendChild(f);
    g.appendChild(bar);
    g.appendChild(el("b", "", pc + "%"));
    cell.appendChild(g);
    cell.appendChild(text("div", "ar-post-fx", W.upper(postEffect(p.k))));
    return cell;
  }

  function openPostPicker(k) {
    if (postCard(k)) return;
    pickCard({
      grade: RT.pick, take: T.postTake,
      eyebrow: T["post_" + k], title: T.postPick,
      /* a card guarding the camp is on a job already (section 8c') */
      list: function () {
        var all = reserveList(true), out = [];
        for (var i = 0; i < all.length; i++) if (!onGuard(all[i].i)) out.push(all[i]);
        return out;
      },
      /* a token wears the gauge it would give here only when its trade
         suits the post: the tier alone is already read on the card, and a
         band on every token said nothing the bonus did not */
      tag: function (c) {
        return suits(c, k) ? { word: pctFor(c, k) + "%", cls: "in match" } : null;
      },
      choose: function (c) {
        if (postCard(k) || inDeck(c.i) || !free(c) || onGuard(c.i)) return;
        save.po[k] = c.i;
        RT.justIn = c.i;
        persist();
        say(fill(T.posted, { c: whoName(c.o || "blue", c.g, baseOf(c)) }),
            T["post_" + k] + " " + postPct(k) + "% · " + postEffect(k), "good", "check");
        W.Sound.ui("tap", 0.45, 1.1);
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
  var CAUSE = { battle: "sword", mission: "compass", wounds: "heal", desert: "users" };
  function causeText(e) {
    var m = e.m ? MISSION[e.m] : null;
    if (e.why === "desert") return T.lostDesert;
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
            W.Sound.ui("tap", 0.45, turns % 2 ? 1.1 : 0.9);
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
    /* THE TRADE, and the post it suits — the one line of the file that is
       also a rule of the camp (section 1b, `postPct`) */
    var job = p && p.job ? JOB[p.job] || null : null;
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
          job: job ? W.upper(jobName(job, p)) : "",
          jobPost: job ? W.upper(fill(T.jobFor, { post: T["post_" + job.post] })) : "",
          skill: gradeSkill(who.g),
          lore: lore[LANG] || lore.en || "",
          army: W.upper(who.o === "red" ? T.armyRed : T.armyBlue),
          turn: who.o !== team ? W.upper(T.turncoat) : ""
        }));
      return wrap;
    }
    return plainBack(who, p, team, base, facts, job);
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
  function plainBack(who, p, team, base, facts, job) {
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
    if (job) {
      b.appendChild(text("div", "ar-fb-job",
        W.upper(jobName(job, p)) + " · " + W.upper(fill(T.jobFor, { post: T["post_" + job.post] }))));
    }
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
    /* the camp's days are told at the village and nowhere else: a mission
       report put away in the command tells its own news only */
    var home = VW.top() === "village";
    if (!announcing && home) { tickEvents(); dfRoll(); }
    var dead = untold(), days = home && evState().q.length;
    var gifts = home ? newUnlocks() : [], raid = home && !!dfState().q;
    if (announcing || (!dead.length && !save.up.length && !days && !gifts.length && !raid)) { then(); return; }
    announcing = true;
    /* what the climb handed over first — it is news about the map the
       player just walked off — then the camp's own */
    openUnlocks(gifts, function () {
      openFallen(dead, function () {
        openPromos(function () {
          /* ...then what happened in the camp meanwhile (section 6b), and
             last the raid on the defense (section 8c') */
          var tail = function () {
            if (raid) openDefenseReport(function () { announcing = false; then(); });
            else { announcing = false; then(); }
          };
          if (days) openEvents(tail);
          else tail();
        });
      });
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

  /* `round`: told over the battle, where a door out to the camp would walk
     out of a round that has not ended yet — so a card there opens its file,
     and the register is named in the line under them instead. */
  function openFallen(list, then, round) {
    if (!list.length) { then(); return; }
    var i, e, one = list.length === 1;
    for (i = 0; i < list.length; i++) delete list[i].nw;
    MT.setArmy(save);
    MD.open({
      kind: "ar-fallen", dismiss: true, esc: true, onClose: then,
      eyebrow: one ? T.fallenEyebrow1 : fill(T.fallenEyebrowN, { n: list.length }),
      title: T.fallenTitle,
      tap: round ? T.tapContinue : T.fallenTap,
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
        for (i = 0; i < list.length; i++) row.appendChild(fallenDoor(list[i], one, close, round));
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
  function fallenDoor(e, one, close, round) {
    var b = el("button", "ar-fallen-c");
    var tile = lostCard(e, one ? "mid" : "tiny", one ? FALLEN_W : FALLEN_TINY);
    b.appendChild(tile);
    if (!one) b.appendChild(text("span", "ar-fallen-n", W.upper(whoName(e.o || "blue", e.g, e.b != null ? e.b : e.t))));
    b.setAttribute("aria-label", round ? T.fileOpen : T.fallenOpen);
    b.addEventListener("click", function () {
      if (round) { openFile(lostWho(e), "blue", tile); return; }
      close();
      openRegister();
    });
    return b;
  }

  /* TO THE INFIRMARY. The cards this battle wounded that found a bed: one
     card, the tokens with the wait on each, and a tap on one reads its
     file. Not a funeral — they come back — so it wears the card's own rim
     and the infirmary's green, and says when. */
  function openWounded(list, then) {
    if (!list.length) { then(); return; }
    var one = list.length === 1, i;
    MD.open({
      kind: "ar-wounded", dismiss: true, esc: true, onClose: then,
      eyebrow: one ? T.hurtEyebrow1 : fill(T.hurtEyebrowN, { n: list.length }),
      title: T.hurtTitle,
      tap: T.tapContinue,
      fill: function (card) {
        var line = el("p", "ar-fallen-l hurt", icon("heal", "ar-ci") + "<span></span>");
        line.lastChild.textContent = one
          ? fill(T.hurt1, { c: whoName(list[0].o || "blue", list[0].g, baseOf(list[0])) })
          : fill(T.hurtN, { n: list.length });
        var why = el("div", "ar-fallen-why");
        why.appendChild(line);
        card.appendChild(why);
        var row = el("div", "ar-fallen-list" + (one ? " one" : "") + (PAINTED ? " painted" : ""));
        for (i = 0; i < list.length; i++) row.appendChild(hurtDoor(list[i], one));
        card.appendChild(row);
        /* ONE SENTENCE: who goes, and for how long — the wait in the
           card's own colour, since it is the one thing to remember. */
        var c0 = list[0], foot = el("p", "ar-fallen-foot hurt"), longest = 0;
        /* each wound has its own stay; a sentence about several says the longest */
        for (i = 0; i < list.length; i++) longest = Math.max(longest, stayOf(list[i]));
        var parts = fill(one ? T.hurtGo1 : T.hurtGoN, {
          g: W.Lang.t(gradeName(c0.g)), c: whoName(c0.o || "blue", c0.g, baseOf(c0)),
          r: tierName(c0.t), n: list.length
        }).split("{t}");
        for (i = 0; i < parts.length; i++) {
          if (i) foot.appendChild(text("b", "ar-hurt-t", waitWords(longest)));
          foot.appendChild(document.createTextNode(parts[i]));
        }
        card.appendChild(foot);
      }
    });
    W.Sound.ui("fail", 0.6);
  }

  function hurtDoor(c, one) {
    var b = el("button", "ar-fallen-c hurt");
    var tile = cardTile(face(c), { fmt: one ? "mid" : "tiny", w: one ? FALLEN_W : FALLEN_TINY });
    b.appendChild(tile);
    if (!one) b.appendChild(text("span", "ar-fallen-n", W.upper(whoName(c.o || "blue", c.g, baseOf(c)))));
    b.setAttribute("aria-label", T.fileOpen);
    b.addEventListener("click", function () { openFile(whoOf(c), "blue", tile); });
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

  /* ── 9. the one line this layer says ─────────────────────────────────── */

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
    else if (top === "defense" && DF) paintDefense();
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
  function startBeat() { if (!beat) beat = setInterval(tick, 20000); }
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
    VW.define("defense", {
      build: buildDefense, node: function () { return DF.box; },
      show: function (o) {
        DF.tab = (o && o.tab) || "strat";
        DF.body.scrollTop = 0;
        paintDefense();
      },
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
    devEntries();
  }

  /* ── 11b. what the DEV view can fire ──────────────────────────────────── */

  /* EVERY CARD THIS LAYER OPENS, one tap each, from the DEV view
     (packages/webshell/dev.js). Each one is the real thing — it reads the
     save and writes it the way the game would — so a card that needs the camp
     to hold something (a wounded card, a validated defense) says so rather
     than opening on nothing. The surrender is not here: it is an offer made
     inside a round. */
  function devNo(word) { say(word, "", "warn", "info"); }
  function devEntries() {
    if (!W.Dev || !W.Dev.local) return;
    var noop = function () {};
    function add(label, sub, run) { W.Dev.entry({ group: "Army", label: label, sub: sub, run: run }); }

    add("Defense raid", "The report of a raid on the validated defense", function () {
      var d = dfState();
      if (!d.v || !dfFlag(d.v) || !W.Game || !W.Game.defense) { devNo("Validate a defense first"); return; }
      d.q = dfReport(W.Game.defense(dfCells(d.v), DF_COLS, DF_ROWS, redArmy(),
                                    { runs: DF_ATT.runs || 200, turns: DF_ATT.turns || 12 }));
      MT.setArmy(save);
      openDefenseReport(noop);
    });
    add("Prisoner offer", "Two officers of the camp's mirror, as a won battle offers them", function () {
      var pool = distinct(redArmy()), list = [], i;
      for (i = 0; i < pool.length && list.length < 2; i++) {
        if (!held(save, "red", pool[i].r, pool[i].t)) list.push(pool[i]);
      }
      if (!list.length) { devNo("No officer left to take"); return; }
      offer = list;
      offerCoins = false;
      openOffer(noop);
    });
    add("Promotion", "One card of the roster climbs a tier", function () {
      var list = [], i;
      for (i = 0; i < save.r.length; i++) if (save.r[i].t < TOP) list.push(save.r[i]);
      if (!list.length) { devNo("Every card is at the top tier"); return; }
      promote(pickOne(list), "battle");
      persist();
      openPromos(noop);
    });
    add("Wounded", "The cards in the infirmary, or one idle card wounded for real", function () {
      var list = hurtList(), c;
      if (!list.length) {
        var idle = idleCards();
        if (!idle.length || inInfirmary() >= beds()) { devNo("No idle card and no free bed"); return; }
        c = pickOne(idle);
        hurtFor(c, healMs(1 + Math.floor(Math.random() * TOP)));
        persist();
        list = [c];
      }
      openWounded(list, noop);
    });
    add("In memoriam", "The last name of the register, told again", function () {
      if (!save.x.length) { devNo("Nobody has fallen yet"); return; }
      var e = JSON.parse(JSON.stringify(save.x[0]));
      openFallen([e], noop);
    });
    add("New object", "The objects the climb has handed over, told again", function () {
      var u = unlocked(), list = [], r;
      for (r in u) if (u.hasOwnProperty(r) && +r !== FLAG_R) list.push(+r);
      if (!list.length) { devNo("Pass a band of the map first"); return; }
      openUnlocks(list.slice(0, 3), noop);
    });
    add("Squads home", "Every squad on a mission is back now", function () {
      var runs = awayRuns(), i;
      if (!runs.length) { devNo("No squad is away"); return; }
      for (i = 0; i < runs.length; i++) runs[i].e = now();
      persist();
      VW.go("recruit", { tab: "mis" });
    });
    add("Officer's file", "The back of the best card of the roster", function () {
      if (!save.r.length) return;
      var best = save.r.slice(0).sort(cmpCard)[0];
      openFile(whoOf(best), "blue");
    });

    /* THE CAMP'S DAYS, one row each, in the manifest's order: the day is
       decided on the tap (`prepare`), so one the camp holds nothing for says
       so, and applied on the card's own tap like every other day. */
    for (var i = 0; i < EV_LIST.length; i++) (function (d) {
      W.Dev.entry({
        group: "Camp days",
        label: function () { return loc(d.title); },
        sub: (d.good ? "Good" : "Bad") + " · " + ((d.fx || {}).kind || "none"),
        tone: d.good ? "good" : "bad",
        run: function () {
          var ev = prepare(d);
          if (!ev) { devNo("The camp holds nothing for this day"); return; }
          openEvent(ev, 1, noop);
        }
      });
    })(EV_LIST[i]);
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
      deck: "Cards", infirmary: "Infirmary", prison: "Prison", recruit: "Command", defense: "Defense",
      bandTitle: "Your army", bandMissions: "Missions accomplished", bandOwned: "Collection",
      bandBlue: "Blue", bandRed: "Red", bandTurn: "Turncoat",
      deckTitle: "Deck",
      deckSection: "Formation", fillBest: "Auto-fill",
      filled1: "1 card added", filledN: "{n} cards added",
      pickTitle: "Choose a card", pickAll: "Every grade", pickEmpty: "No card is free to join the deck",
      deckTake: "Put this card in the deck",
      f_all: "All",
      f_had: "Owned", f_met: "Met", f_miss: "Missing",
      deckFullWarn: "The deck is full",
      deckDrop: "Leave this card behind", inDeck: "In deck",
      tab_roll: "Camp", tab_deck: "Deck", tab_coll: "Collection",
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
      objGhostBand: "Clear the {b} biome to get it", objGhostNone: "Not available yet",
      infTitle: "Infirmary", infSub: "{n} / {m} beds taken", infFree: "Free bed",
      infFull: "Infirmary full", prisonFree: "Free cell",
      prisonFull: "Prison full", prisonFullSub: "{n} cells, all taken: no prisoner this time",
      infHealed: "Back on their feet", locked: "Locked",
      prisonTitle: "Prison", prisonSub: "{n} / {m} cells taken",
      defenseTitle: "Defense",
      dfSubFlag: "Place your flag first", dfSubNew: "Protect the flag, then validate",
      dfSubDirty: "Changed: validate to defend with it",
      dfFront: "The enemy attacks from here",
      dfNote: "Place your flag, then protect it with your cards and your objects.",
      dfValidate: "Validate", dfUndo: "Undo changes",
      dfNeedFlag: "Place your flag first",
      dfValidated: "Defense validated", dfValidatedSub: "It guards the camp while you are away",
      dfOff: "Absent", dfDrop: "Remove from the defense", dfPick: "Place a card", dfTake: "Place",
      dfFlagFirst: "Your flag comes first",
      dfRepEyebrow: "While you were away", dfRepHeld: "The camp held", dfRepLost: "The flag was taken",
      dfStampHeld: "Defended", dfStampLost: "Captured",
      dfTextHeld: "The red army attacked your camp and never reached the flag. Some of its soldiers stayed behind.",
      dfTextLost: "The red army broke through your defense and took the flag.",
      dfPrisoners1: "1 prisoner", dfPrisonersN: "{n} prisoners", dfPrisonFull: "Prison full: no prisoner",
      dfSolid: "Solidity",
      dfTipLow: "Keep the flag away from the front and fill the cells around it: a gap is a way in.",
      dfTipMid: "Objects buy time: a raid that stalls on a fence or a straw man is a raid that runs out of night.",
      dfTipHigh: "A layout that holds almost every assault.",
      tab_strat: "Strategy", tab_rep: "Report",
      dfRepSub: "Last raid: {d}", dfRepNoneSub: "No raid yet",
      dfRepNone: "No raid yet. Validate a defense: the red army storms your camp when you come back after {n} hours away.",
      dfRepNoLog: "This raid came before the report kept its duels.",
      dfRepTapHeld: "Tap anywhere to collect and see the report", dfRepTapLost: "Tap anywhere to see the report",
      dfRepOrder: "Order of attack", dfRepCamp: "Pushed back: {n}", dfRepFoe: "Broken through: {n}",
      duVs: "vs", duWin: "{w} wins", duTie: "Both fall", duFlag: "Flag taken",
      duTrap: "{a} falls in the trap", duClear: "{a} clears the trap", duSmash: "{a} clears the way",
      duBlock: "{a} is held back", duStray: "{a} gets lost", duStun: "{a} is stunned",
      duSpell: "{a} is bewitched", duScout: "{a} reveals the card",
      dfUnlockEyebrow: "{b} cleared", dfUnlockEyebrowN: "Biomes cleared",
      dfUnlockTitleN: "New object cards",
      dfUnlockText1: "It is now in your collection and can guard your camp in the defense, up to {n} times.",
      dfUnlockTextN: "They are now in your collection and can guard your camp in the defense, each up to {n} times.",
      enlist: "Enlist", hire: "Recruit", enlisted: "{c} joins your army",
      recruitTitle: "Recruiting tent", recruitSub: "New faces in {t}",
      sold: "Recruited", recruited: "{c} recruited",
      tooPoor: "Not enough coins",
      captiveTitle: "Victory reward", or: "or",
      captiveTaken: "Taken to the prison",
      captiveTap: "Tap a card to take it",
      ready: "Ready", soon: "Any moment", uD: "d", uH: "h", uM: "m",
      wDay: "day", wDays: "days", wHour: "hour", wHours: "hours",
      away: "On mission",
      tab_tent: "Recruits", tab_mis: "Missions",
      misTitle: "Missions",
      misBoard: "Mission board", slotNext: "New mission in {t}",
      boardNext: "New missions in {t}",
      misLog: "Reports", logEmpty: "No squad has come back yet.",
      prepare: "Prepare",
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
      tab_posts: "Management", tab_reg: "Register",
      postsTitle: "Management", campTitle: "Camp",
      campSub: "An officer at a post fights no battle and joins no squad",
      campPosts: "Posts", campRoll: "In the camp", campNone: "The camp is empty.",
      post_inf: "Infirmary", post_pri: "Prison", post_drill: "Formation", post_ops: "Missions", post_cmd: "Camp",
      post_cook: "Kitchen",
      role_inf: "Infirmary manager", role_pri: "Prison warden", role_drill: "Drill instructor",
      role_ops: "Mission officer", role_cmd: "In command", role_cook: "Camp cook",
      postPick: "Choose an officer", postTake: "Assign this card to the post",
      postDrop: "Relieve this officer", posted: "{c} takes up the post",
      stHurt: "Wounded", stAway: "On mission", stDeck: "In formation", stIdle: "Available",
      stJail: "In prison", stTurned: "Ready to enlist",
      regTitle: "Register", regSec: "Cards lost",
      regNone: "No card lost yet. A card that dies in battle or on a mission is written here.",
      lostBattle: "Fell in battle", lostMission: "Lost on a mission · {m}", lostMissionAny: "Lost on a mission",
      lostWounds: "Died of wounds · {m}", lostWoundsAny: "Died of wounds after a mission",
      regBack: "Found alive, back in service",
      fresh: "New", backAlive: "Rescue", inCamp: "Already in the camp", returned: "{c} is back in service",
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
      tapContinue: "Tap anywhere to continue",
      surEyebrow: "The enemy commander", surTitle: "Surrender?",
      surWhy_trap: "Mines guard my flag, and you have no sapper left to clear them.",
      surWhy_object: "What guards my flag, none of your cards can break.",
      surWhy_soldier: "What guards my flag, none of your cards can beat.",
      surNote: "This battle can no longer be won. Surrender, and it ends here with no score.",
      surNo: "Fight on", surYes: "Surrender", surTap: "Tap to fight on",
      hurtTitle: "Wounded", hurtEyebrow1: "To the infirmary", hurtEyebrowN: "{n} cards to the infirmary",
      hurt1: "{c}: wounded in battle", hurtN: "{n} cards wounded in battle",
      hurtGo1: "{g} {c}, rank {r}, must go to the infirmary for {t}.",
      hurtGoN: "{n} cards must go to the infirmary for {t}.",
      upTitle: "Promotion!", upEyebrow: "A card climbs", upEyebrowN: "Promotion {i} / {n}",
      upNext: "Tap for the next one", upClose: "Tap to close",
      deckCut1: "1 card back in reserve", deckCutN: "{n} cards back in reserve",
      deckCutSub: "The formation holds fewer slots now",
      lockSay: "Post an officer to {post} to open it",
      postsNote: "A card's tier sets a post's percentage. Give the post an officer whose trade relates to it for a {b} bonus. Tap a post's name to learn more.",
      fx_cmd: "Captives: {n}/{m}", fx_drill: "Deck: {n}/{m}", fx_ops: "Missions: {n}/{m}",
      fx_inf: "Beds: {n}/{m}", fx_pri: "Cells: {n}/{m}", fx_cook: "Morale: {n}/{m}",
      pd_cmd: "Captives offered after a won battle", pd_drill: "Slots in your deck",
      pd_ops: "Mission slots", pd_inf: "Beds in the infirmary",
      pd_pri: "Cells in the prison", pd_cook: "The camp's morale: the higher it is, the more good days",
      postJobsLine: "Suited trades: {j}",
      postJobs: "Trades suited to {post}", jobFor: "Suits {post}",
      lostDesert: "Deserted the camp",
      evEyebrow: "Life in the camp", evEyebrowN: "Life in the camp · {n} news",
      evGood: "Good news", evBad: "Bad news",
      evTicketLost: "-{n} ticket", evJoins: "Joins your army", evLeaves: "Leaves the camp",
      evHealed: "Back on their feet", evHealLater: "+{h} in the infirmary",
      evEscaped: "Escaped", evJailLater: "+{h} in prison",
      evTent: "New recruits at the tent", evTentBurn: "No recruits until the next shelf",
      evBoard: "New missions on the board", evLate: "+{h} away"
    },
    fr: {
      deck: "Cartes", infirmary: "Infirmerie", prison: "Prison", recruit: "Commandement", defense: "Défense",
      bandTitle: "Ton armée", bandMissions: "Missions réussies", bandOwned: "Collection",
      bandBlue: "Bleu", bandRed: "Rouge", bandTurn: "Transfuge",
      deckTitle: "Deck",
      deckSection: "Formation", fillBest: "Auto-complétion",
      filled1: "1 carte ajoutée", filledN: "{n} cartes ajoutées",
      pickTitle: "Choisis une carte", pickAll: "Tous les grades", pickEmpty: "Aucune carte n'est libre pour le deck",
      deckTake: "Mettre cette carte dans le deck",
      f_all: "Toutes",
      f_had: "Possédés", f_met: "Rencontrés", f_miss: "Manquants",
      deckFullWarn: "Le deck est plein",
      deckDrop: "Laisser cette carte", inDeck: "Dans le deck",
      tab_roll: "Camp", tab_deck: "Deck", tab_coll: "Collection",
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
      objGhostBand: "Termine le biome {b} pour l'obtenir", objGhostNone: "Pas encore disponible",
      infTitle: "Infirmerie", infSub: "{n} / {m} lits occupés", infFree: "Lit libre",
      infFull: "Infirmerie pleine", prisonFree: "Cellule libre",
      prisonFull: "Prison pleine", prisonFullSub: "{n} cellules, toutes prises : pas de prisonnier cette fois",
      infHealed: "De nouveau sur pied", locked: "Verrouillé",
      prisonTitle: "Prison", prisonSub: "{n} / {m} cellules occupées",
      defenseTitle: "Défense",
      dfSubFlag: "Place d'abord ton drapeau", dfSubNew: "Protège le drapeau, puis valide",
      dfSubDirty: "Modifiée : valide pour défendre avec",
      dfFront: "L'ennemi attaque par ici",
      dfNote: "Place ton drapeau, puis protège-le avec tes cartes et tes objets.",
      dfValidate: "Valider", dfUndo: "Annuler les changements",
      dfNeedFlag: "Place d'abord ton drapeau",
      dfValidated: "Défense validée", dfValidatedSub: "Elle garde le camp pendant ton absence",
      dfOff: "Absent", dfDrop: "Retirer de la défense", dfPick: "Placer une carte", dfTake: "Placer",
      dfFlagFirst: "Ton drapeau d'abord",
      dfRepEyebrow: "Pendant ton absence", dfRepHeld: "Le camp a tenu", dfRepLost: "Le drapeau est tombé",
      dfStampHeld: "Défendu", dfStampLost: "Capturé",
      dfTextHeld: "L'armée rouge a attaqué ton camp sans jamais atteindre le drapeau. Certains de ses soldats sont restés derrière.",
      dfTextLost: "L'armée rouge a percé ta défense et pris le drapeau.",
      dfPrisoners1: "1 prisonnier", dfPrisonersN: "{n} prisonniers", dfPrisonFull: "Prison pleine : aucun prisonnier",
      dfSolid: "Solidité",
      dfTipLow: "Éloigne le drapeau du front et remplis les cases autour : un trou est un passage.",
      dfTipMid: "Les objets font gagner du temps : un assaut bloqué sur une barrière ou un homme de paille finit par manquer de nuit.",
      dfTipHigh: "Une défense qui résiste à presque tous les assauts.",
      tab_strat: "Stratégie", tab_rep: "Rapport",
      dfRepSub: "Dernier assaut : {d}", dfRepNoneSub: "Aucun assaut pour l'instant",
      dfRepNone: "Aucun assaut pour l'instant. Valide une défense : l'armée rouge attaque ton camp quand tu reviens après {n} heures d'absence.",
      dfRepNoLog: "Cet assaut date d'avant que le rapport garde ses duels.",
      dfRepTapHeld: "Touche n'importe où pour récupérer et voir le rapport", dfRepTapLost: "Touche n'importe où pour voir le rapport",
      dfRepOrder: "Ordre d'attaque", dfRepCamp: "Repoussés : {n}", dfRepFoe: "Percées : {n}",
      duVs: "vs", duWin: "{w} gagne", duTie: "Les deux tombent", duFlag: "Drapeau pris",
      duTrap: "{a} tombe dans le piège", duClear: "{a} désamorce le piège", duSmash: "{a} ouvre le passage",
      duBlock: "{a} est bloquée", duStray: "{a} se perd", duStun: "{a} est étourdie",
      duSpell: "{a} est ensorcelée", duScout: "{a} révèle la carte",
      dfUnlockEyebrow: "{b} terminé", dfUnlockEyebrowN: "Biomes terminés",
      dfUnlockTitleN: "Nouvelles cartes objets",
      dfUnlockText1: "Elle rejoint ta collection et peut maintenant garder ton camp en défense, {n} fois au plus.",
      dfUnlockTextN: "Elles rejoignent ta collection et peuvent maintenant garder ton camp en défense, {n} fois au plus chacune.",
      enlist: "Enrôler", hire: "Recruter", enlisted: "{c} rejoint ton armée",
      recruitTitle: "Tente de recrutement", recruitSub: "De nouvelles têtes dans {t}",
      sold: "Recruté", recruited: "{c} recruté",
      tooPoor: "Pas assez de pièces",
      captiveTitle: "Récompense de victoire", or: "ou",
      captiveTaken: "Emmené en prison",
      captiveTap: "Touche une carte pour la prendre",
      ready: "Prêt", soon: "D'un instant à l'autre", uD: "j", uH: "h", uM: "min",
      wDay: "jour", wDays: "jours", wHour: "heure", wHours: "heures",
      away: "En mission",
      tab_tent: "Recrues", tab_mis: "Missions",
      misTitle: "Missions",
      misBoard: "Tableau des missions", slotNext: "Nouvelle mission dans {t}",
      boardNext: "Nouvelles missions dans {t}",
      misLog: "Rapports", logEmpty: "Aucune escouade n'est encore rentrée.",
      prepare: "Préparer",
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
      tab_posts: "Gestion", tab_reg: "Registre",
      postsTitle: "Gestion", campTitle: "Camp",
      campSub: "Un officier affecté à un poste ne combat plus et ne part plus en mission",
      campPosts: "Postes", campRoll: "Au camp", campNone: "Le camp est vide.",
      post_inf: "Infirmerie", post_pri: "Prison", post_drill: "Formation", post_ops: "Missions", post_cmd: "Camp",
      post_cook: "Cuisine",
      role_inf: "Gestionnaire d'infirmerie", role_pri: "Gestionnaire de prison", role_drill: "Instructeur de formation",
      role_ops: "Officier des missions", role_cmd: "Au commandement", role_cook: "Cuisinier du camp",
      postPick: "Choisis un officier", postTake: "Affecter cette carte au poste",
      postDrop: "Relever cet officier", posted: "{c} prend son poste",
      stHurt: "Blessée", stAway: "En mission", stDeck: "En formation", stIdle: "Disponible",
      stJail: "En prison", stTurned: "Prête à s'enrôler",
      regTitle: "Registre", regSec: "Cartes perdues",
      regNone: "Aucune carte perdue pour l'instant. Une carte tombée au combat ou en mission est inscrite ici.",
      lostBattle: "Tombée au combat", lostMission: "Perdue en mission · {m}", lostMissionAny: "Perdue en mission",
      lostWounds: "Morte de ses blessures · {m}", lostWoundsAny: "Morte de ses blessures après une mission",
      regBack: "Retrouvée vivante, de retour en service",
      fresh: "New", backAlive: "Rescue", inCamp: "Déjà au camp", returned: "{c} reprend du service",
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
      tapContinue: "Touche n'importe où pour continuer",
      surEyebrow: "Le commandant ennemi", surTitle: "Te rendre ?",
      surWhy_trap: "Des mines gardent mon drapeau, et il ne te reste aucun sapeur pour les lever.",
      surWhy_object: "Ce qui garde mon drapeau, aucune de tes cartes ne peut le briser.",
      surWhy_soldier: "Ce qui garde mon drapeau, aucune de tes cartes ne peut le battre.",
      surNote: "Cette bataille ne peut plus être gagnée. Rends-toi, et elle s'arrête ici, sans score.",
      surNo: "Continuer", surYes: "Se rendre", surTap: "Touche pour continuer",
      hurtTitle: "Blessés", hurtEyebrow1: "Direction l'infirmerie", hurtEyebrowN: "{n} cartes à l'infirmerie",
      hurt1: "{c} : blessure au combat", hurtN: "{n} cartes blessées au combat",
      hurtGo1: "Le {g} {c} de rang {r} doit partir à l'infirmerie pendant {t}.",
      hurtGoN: "{n} cartes doivent partir à l'infirmerie pendant {t}.",
      upTitle: "Promotion !", upEyebrow: "Une carte monte en grade", upEyebrowN: "Promotion {i} / {n}",
      upNext: "Touche pour la suivante", upClose: "Touche pour fermer",
      deckCut1: "1 carte retourne en réserve", deckCutN: "{n} cartes retournent en réserve",
      deckCutSub: "La formation compte moins d'emplacements",
      lockSay: "Affecte un officier au poste {post} pour l'ouvrir",
      postsNote: "Le rang d'une carte influence le pourcentage d'un poste. Utilise un métier en relation avec le poste pour bénéficier d'un bonus de {b}. Touche le nom d'un poste pour en savoir plus.",
      fx_cmd: "Captifs : {n}/{m}", fx_drill: "Deck : {n}/{m}", fx_ops: "Missions : {n}/{m}",
      fx_inf: "Lits : {n}/{m}", fx_pri: "Cellules : {n}/{m}", fx_cook: "Moral : {n}/{m}",
      pd_cmd: "Prisonniers proposés après une victoire", pd_drill: "Places dans ton deck",
      pd_ops: "Emplacements de mission", pd_inf: "Lits à l'infirmerie",
      pd_pri: "Cellules à la prison", pd_cook: "Le moral du camp : plus il est haut, plus les bons jours sont fréquents",
      postJobsLine: "Métiers adaptés : {j}",
      postJobs: "Métiers adaptés au poste {post}", jobFor: "Poste : {post}",
      lostDesert: "A déserté le camp",
      evEyebrow: "Vie du camp", evEyebrowN: "Vie du camp · {n} nouvelles",
      evGood: "Bonne nouvelle", evBad: "Mauvaise nouvelle",
      evTicketLost: "-{n} ticket", evJoins: "Rejoint ton armée", evLeaves: "Quitte le camp",
      evHealed: "De retour sur pied", evHealLater: "+{h} à l'infirmerie",
      evEscaped: "Évasion", evJailLater: "+{h} en prison",
      evTent: "Nouvelles recrues à la tente", evTentBurn: "Plus de recrues jusqu'au prochain renouvellement",
      evBoard: "Nouvelles missions au tableau", evLate: "+{h} de retard"
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
    /* The commander's offer, when the round knows it is lost (section 6a). */
    surrender: surrender,

    /* What the village's badges count (packages/webshell/village.js, DOORS). */
    deckShort: deckShort,
    /* 1 while the camp has no defense standing: the flag is waiting */
    defenseTodo: function () { return save.df && save.df.v ? 0 : 1; },
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
    /* The register, read by tools/test/views.mjs. */
    register: function () { return save.x; },
    /* The roster, the promotions waiting to be told and the one call that
       tells them, read and driven by tools/test/views.mjs. */
    roster: function () { return save.r; },
    /* The camp's days (section 6b): the queue, a switch that holds them
       back — a contract test cannot have a card open itself between two of
       its steps — and the one call that draws a day now. */
    days: function () { return evState(); },
    quietDays: function (on) { evQuiet = !!on; },
    /* ...and a raid on demand, whatever the dice and the clock say: the
       report is written from the validated defense and told at the village.
       Returns false when no defense stands. */
    raid: function () {
      var d = dfState();
      if (!d.v || !dfFlag(d.v) || !W.Game || !W.Game.defense) return false;
      d.q = dfReport(W.Game.defense(dfCells(d.v), DF_COLS, DF_ROWS, redArmy(),
                                    { runs: DF_ATT.runs || 200, turns: DF_ATT.turns || 12 }));
      MT.setArmy(save);
      announceSoon();
      return true;
    },
    drawDay: function () { var ev = rollEvent(); if (ev) { evState().q.push(ev); MT.setArmy(save); } return ev; },
    posts: function () { return save.po; },
    promotions: function () { return save.up; },
    announce: announce,

    onChange: function (fn) { hooks.push(fn); },
    deck: roundDeck,
    size: deckCap,
    deckMax: function () { return DECK_R[1]; }
  };
})();
