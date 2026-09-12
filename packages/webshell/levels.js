/*
  webshell — the level layer the `web` and `android` targets add.

  Loaded only by `node tools/build/build.mjs --target=web`, immediately before
  menu.js, which mounts it. It publishes `window.__LEVELS__` and nothing else;
  the motor knows about none of it, and a playable ships neither this file nor
  the object. A game opts in with ONE block in its manifest — `web.levels` —
  and a game that declares none gets today's menu unchanged, because
  `active()` is then false and menu.js takes every other branch.

  What it is, and why (the long form is docs/LEVELS.md):

    thirty levels, nothing authored
                    every level is derived from where it sits on the climb.
                    `d` — 0 at the foot, 1 at the top — is the only thing a
                    game is handed, and it is lerped into the knobs the
                    manifest names. There is no boss and there will not be
                    one: what separates level 29 from level 3 is `d`, not a
                    different shape of round.
    a road with forks
                    the ladder is not a line. At a junction the player picks a
                    side and SEES what each costs — one level this way, three
                    that way — and the two roads rejoin. Missing the levels on
                    the road not taken is fine; the map marks them quietly.
    an invisible grid
                    six columns, a level every OTHER row, roads that walk from
                    cell to cell: across, and up. Nothing curves, nothing
                    crosses, every corner is a right angle. The placement is
                    random and seeded by the game's slug, so a map is the same
                    map tomorrow and a different one per game.
    stars off the objective
                    one number on the same lerp, rounded to a step a player
                    can read (600 m, not 617 m). ★ meets it, ★★ is 1.5x, ★★★
                    is 2.2x. This is what replaces the flat thresholds the
                    games carry in their own `endRound` call — through the
                    motor's result filter, so section 6 never changes.
    ninety of ninety
                    a perfect board turns every road gold, opens one more node
                    above level 30 — a star, not a circle, and it starts an
                    endless run — and puts a golden veil over the title screen
                    (levels.css), because a player who finished the game must
                    not come back to the screen they left.

  ES5-ish on purpose, like the motor: this runs in the same mobile WebViews.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  if (!W) return;                       // not a web build

  var CONFIG = W.CONFIG;

  /* The manifest's own block, delivered by the existing `web` injection:
     tools/build/build.mjs hands `manifest.web` to the page as CONFIG.web, so
     `web.levels` needs no second mechanism next to `web.modes`. */
  var SPEC = (CONFIG.web && CONFIG.web.levels) || null;
  var ON = !!(SPEC && SPEC.objective);

  /* ── 0. strings ───────────────────────────────────────────────────────── */

  var STRINGS = {
    en: {
      title: "LEVELS", pick: "SELECT A LEVEL",
      level: "Level", locked: "Locked", play: "PLAY", replay: "REPLAY",
      never: "Never played", notTaken: "On the road you did not take",
      notTakenTag: "not taken",
      gatedHere: "Locked · the road here is gated",
      best: "Best", tries: "tries", starsOf: "stars",
      difficulty: "difficulty",
      forks: "the road forks: {a} or {b} levels",
      roadL: "Left road", roadR: "Right road",
      gated: "Gated", opened: "Open", free: "Free",
      roadSpan: "Levels {a}–{b}, then both roads meet again.",
      roadOne: "Level {a}, then both roads meet again.",
      roadOther: "The other way is <b>{n}</b>.",
      roadShort: "The short way — fewer levels, and each one is the harder end of the band.",
      roadLong: "The long way — more levels, more stars to collect.",
      roadPaid: "The gate wanted <em>★ {n}</em> and you have {have}.",
      roadWants: "{span} This road wants <b>★ {n}</b> — you have {have}, <b>{short} short</b>.",
      roadOpenOther: "The other way is <em>{n} levels</em> and it is open — ",
      findHere: "or find the stars here:",
      playOn: "the stars will come from playing on.",
      takeRoad: "TAKE THIS ROAD",
      tutoBand: "Optional", tutoTag: "how to play",
      tutoGoal: "Not a level — the <b>one gesture</b> this game is played with, " +
                "acted out by the hand, and the key that does the same thing.",
      tutoNote: "The road skips it: level 1 is open from the start.",
      tutoNoteSeen: "Read · open it again whenever you want.",
      tutoPlay: "HOW TO PLAY",
      endless: "Endless", endlessSub: "Level 31 · the reward for a perfect board",
      endlessGoal: "Every level cleared with <b>three stars</b>. There is nothing " +
                   "left to unlock, so the run simply does not stop.",
      endlessNote: "No objective, no clock, no levels — <em>★ 90/90</em>.",
      endlessPlay: "START THE ENDLESS RUN",
      bands: ["Warm-up", "Pressure", "Squeeze", "Overdrive", "Meltdown"],
      objective: "OBJECTIVE", missed: "OBJECTIVE MISSED",
      threeStars: "THREE STARS!", cleared: "LEVEL CLEARED!",
      levelsEntry: "LEVELS", next: "NEXT LEVEL", retry: "RETRY", map: "MAP",
      resetProgress: "Erase the thirty levels",
      resetProgressAsk: "Tap again — thirty levels of stars are lost",
      resetProgressDone: "Progression erased"
    },
    fr: {
      title: "NIVEAUX", pick: "CHOISIS UN NIVEAU",
      level: "Niveau", locked: "Verrouillé", play: "JOUER", replay: "REJOUER",
      never: "Jamais joué", notTaken: "Sur la route que tu n’as pas prise",
      notTakenTag: "non prise",
      gatedHere: "Verrouillé · la route est fermée ici",
      best: "Record", tries: "essais", starsOf: "étoiles",
      difficulty: "difficulté",
      forks: "la route bifurque : {a} ou {b} niveaux",
      roadL: "Route de gauche", roadR: "Route de droite",
      gated: "Fermée", opened: "Ouverte", free: "Libre",
      roadSpan: "Niveaux {a}–{b}, puis les deux routes se rejoignent.",
      roadOne: "Niveau {a}, puis les deux routes se rejoignent.",
      roadOther: "L’autre voie en compte <b>{n}</b>.",
      roadShort: "La voie courte — moins de niveaux, et chacun est le bout le plus dur de la tranche.",
      roadLong: "La voie longue — plus de niveaux, plus d’étoiles à ramasser.",
      roadPaid: "La porte demandait <em>★ {n}</em>, tu en as {have}.",
      roadWants: "{span} Cette route demande <b>★ {n}</b> — tu en as {have}, <b>il en manque {short}</b>.",
      roadOpenOther: "L’autre voie fait <em>{n} niveaux</em> et elle est ouverte — ",
      findHere: "ou trouve les étoiles ici :",
      playOn: "les étoiles viendront en continuant.",
      takeRoad: "PRENDRE CETTE ROUTE",
      tutoBand: "Facultatif", tutoTag: "comment jouer",
      tutoGoal: "Pas un niveau — le <b>geste unique</b> avec lequel ce jeu se joue, " +
                "mimé par la main, et la touche qui fait la même chose.",
      tutoNote: "La route l’ignore : le niveau 1 est ouvert dès le départ.",
      tutoNoteSeen: "Lu · à rouvrir quand tu veux.",
      tutoPlay: "COMMENT JOUER",
      endless: "Sans fin", endlessSub: "Niveau 31 · la récompense d’un tableau parfait",
      endlessGoal: "Tous les niveaux finis à <b>trois étoiles</b>. Il n’y a plus " +
                   "rien à débloquer, alors la partie ne s’arrête plus.",
      endlessNote: "Pas d’objectif, pas de chrono, pas de niveaux — <em>★ 90/90</em>.",
      endlessPlay: "LANCER LA PARTIE SANS FIN",
      bands: ["Échauffement", "Pression", "Étau", "Surrégime", "Fusion"],
      objective: "OBJECTIF", missed: "OBJECTIF MANQUÉ",
      threeStars: "TROIS ÉTOILES !", cleared: "NIVEAU RÉUSSI !",
      levelsEntry: "NIVEAUX", next: "NIVEAU SUIVANT", retry: "RECOMMENCER", map: "CARTE",
      resetProgress: "Effacer les trente niveaux",
      resetProgressAsk: "Touchez à nouveau — trente niveaux d’étoiles sont perdus",
      resetProgressDone: "Progression effacée"
    }
  };

  var LANG = "en", T = STRINGS.en;

  /* Grouped the way the player reads them: 1 350 in French, 1,350 in English.
     The objective and every best score go through this. */
  function num(v) { return Number(v).toLocaleString(LANG === "fr" ? "fr-FR" : "en-US"); }

  function fill(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return vars.hasOwnProperty(k) ? vars[k] : m;
    });
  }

  /* ── 1. the graph ─────────────────────────────────────────────────────── */

  /* The whole climb, in order. A `line` is that many levels in a row; a `fork`
     is two roads that split and rejoin, the first one on the LEFT. A road may
     ask for a total star count before it opens — and it is always the SHORT
     road that asks, because the short road is the favour.

     This is the studio's shape, not a game's: thirteen games, one graph. */
  var SECTIONS = [
    { line: 3 },                                          // 1 2 3
    { fork: [{ len: 1 },           { len: 3 }] },         // 4       | 5 6 7
    { line: 2 },                                          // 8 9
    { fork: [{ len: 2, gate: 14 }, { len: 4 }] },         // 10 11   | 12 13 14 15
    { line: 2 },                                          // 16 17
    { fork: [{ len: 1, gate: 30 }, { len: 3 }] },         // 18      | 19 20 21
    { line: 2 },                                          // 22 23
    { fork: [{ len: 2 },           { len: 3 }] },         // 24 25   | 26 27 28
    { line: 2 }                                           // 29 30
  ];

  var NODE = {}, EDGES = [], ROADS = [], PLAN = [], LEVELS = 0, ROWS = 0;

  /* A fork's two roads share one band of the climb, and the band is as long as
     the LONGER road: a short road spreads its levels across the whole band and
     lands its last one at the top of it, so one level standing in for three is
     the hardest of the three. Taking the short road buys time, never an easier
     game. */
  (function build() {
    var n = 1, pos = 1, prev = [];
    for (var s = 0; s < SECTIONS.length; s++) {
      var sec = SECTIONS[s];
      if (sec.line) {
        var ids = [];
        for (var i = 0; i < sec.line; i++) {
          NODE[n] = { n: n, pos: pos + i, lane: 0 };
          ids.push(n++);
        }
        for (var p = 0; p < prev.length; p++) EDGES.push({ from: prev[p], to: ids[0] });
        for (i = 0; i < ids.length - 1; i++) EDGES.push({ from: ids[i], to: ids[i + 1] });
        PLAN.push({ line: ids });
        pos += sec.line;
        prev = [ids[ids.length - 1]];
      } else {
        var L = 0, ri;
        for (ri = 0; ri < sec.fork.length; ri++) L = Math.max(L, sec.fork[ri].len);
        var exits = [], plan = { fork: [] };
        for (ri = 0; ri < sec.fork.length; ri++) {
          var r = sec.fork[ri], side = ri === 0 ? -1 : 1, rid = [];
          for (i = 0; i < r.len; i++) {
            NODE[n] = { n: n, pos: pos + Math.round((i + 1) * L / r.len) - 1, lane: side };
            rid.push(n++);
          }
          for (p = 0; p < prev.length; p++) EDGES.push({ from: prev[p], to: rid[0] });
          for (i = 0; i < rid.length - 1; i++) EDGES.push({ from: rid[i], to: rid[i + 1] });
          ROADS.push({ side: side, nodes: rid, gate: r.gate || 0, entry: rid[0],
                       from: prev[0], len: r.len, other: L });
          exits.push(rid[rid.length - 1]);
          plan.fork.push(rid);
        }
        PLAN.push(plan);
        pos += L;
        prev = exits;
      }
    }
    LEVELS = n - 1;
    for (var k in NODE) if (NODE.hasOwnProperty(k)) ROWS = Math.max(ROWS, NODE[k].pos);
  })();

  var BONUS = LEVELS + 1;                    // level 31: only on a perfect board
  var MAX_STARS = LEVELS * 3;

  /* LEVEL 0 — the one node that starts no round. It stands under level 1, off
     the climb, and it opens the Help panel: the game's own sentence, the hand
     acting the gesture out, the keys that do the same thing. It is OPTIONAL —
     nothing is gated on it, the road to level 1 goes past it and its dotted
     spur says so — because a player who already knows how to tap must not be
     made to read. It is merely the first thing under the thumb on a map that
     has never been played, which is where a player who does NOT know looks.

     It is not in the graph: no edge, no star, no place in MAX_STARS. The map
     is the only screen it exists on. */
  var TUTO = 0;

  /* Difficulty is read off the node's ROW, not off the number it wears: at a
     fork the short road's single level sits at the top of the band. The
     exponent front-loads the curve a little, so the early levels separate from
     each other instead of all feeling like level 1. */
  function dOf(n) { return Math.pow((NODE[n].pos - 1) / (ROWS - 1), 0.9); }
  function bandOf(n) { return Math.min(4, Math.floor(dOf(n) * 5)); }

  function preds(n) {
    var out = [];
    for (var i = 0; i < EDGES.length; i++) if (EDGES[i].to === n) out.push(EDGES[i].from);
    return out;
  }
  function succs(n) {
    var out = [];
    for (var i = 0; i < EDGES.length; i++) if (EDGES[i].from === n) out.push(EDGES[i].to);
    return out;
  }
  function roadOf(n) {
    for (var i = 0; i < ROADS.length; i++) if (ROADS[i].nodes.indexOf(n) >= 0) return ROADS[i];
    return null;
  }
  function roadEntering(n) {
    for (var i = 0; i < ROADS.length; i++) if (ROADS[i].entry === n) return ROADS[i];
    return null;
  }
  function roadsAt(n) {
    var out = [];
    for (var i = 0; i < ROADS.length; i++) if (ROADS[i].from === n) out.push(ROADS[i]);
    return out;
  }

  /* ── 2. the objective ─────────────────────────────────────────────────── */

  /* One number on the same lerp, rounded to a step the player can read. The
     game owns the sentence around it (`web.levels.copy.<lang>`, with {n}) and
     nothing else — the thresholds are the studio's. */
  function goalOf(d) {
    var o = SPEC.objective, step = o.step || 1;
    var v = o.from + (o.to - o.from) * d;
    return Math.round(v / step) * step;
  }
  function goalText(n) {
    var copy = (SPEC.copy && (SPEC.copy[LANG] || SPEC.copy.en)) || "Score <b>{n}</b>";
    return fill(copy, { n: num(goalOf(dOf(n))) });
  }
  function starsFor(n, value) {
    var g = goalOf(dOf(n));
    return value >= g * 2.2 ? 3 : value >= g * 1.5 ? 2 : value >= g ? 1 : 0;
  }

  /* ── 3. the saved progression ─────────────────────────────────────────── */

  /* One key per game, through Store — localStorage with an in-memory map
     behind it, which is why itch (a sandboxed iframe that may make
     localStorage throw) climbs the map and then forgets it when the tab
     closes. That is a property of the destination, not a bug to fix.

     There is no "highest level unlocked" field, and that is deliberate: with a
     forking road one number cannot describe where a player is. What is open is
     derived from what was cleared and from the graph, and so are the total
     stars, the completion and the roads not taken — a stored total is a total
     that can disagree with the levels it sums. */
  var KEY = "prog:" + (CONFIG.slug || "game");
  var save = (function load() {
    var s = W.Store.get(KEY, null);
    // An unknown schema version is reset, never guessed.
    if (!s || s.v !== 1 || !s.l || typeof s.l !== "object") return { v: 1, l: {} };
    return s;
  })();

  function persist() {
    save.t = Math.round(Date.now() / 1000);
    W.Store.set(KEY, save);
  }

  /* Cleared means the objective was MET, not merely attempted: a level you can
     fail is what makes the objective mean anything. The play is still recorded
     either way, so `p` counts the tries. */
  function cleared(n) { return !!save.l[n] && save.l[n].s > 0; }
  function starsOf(n) { return save.l[n] ? save.l[n].s : 0; }
  function played(n) { return !!save.l[n]; }
  function totalStars() {
    var t = 0;
    for (var k in save.l) if (save.l.hasOwnProperty(k)) t += save.l[k].s;
    return t;
  }
  function perfect() { return totalStars() >= MAX_STARS; }
  function roadShut(rd) { return !!rd.gate && totalStars() < rd.gate; }

  /* Open: a predecessor is cleared, and the road this level starts is not
     gated shut. Nothing else. */
  function isOpen(n) {
    if (n === 1) return true;
    if (n === BONUS) return perfect();
    var rd = roadEntering(n);
    if (rd && roadShut(rd)) return false;
    var ps = preds(n);
    for (var i = 0; i < ps.length; i++) if (cleared(ps[i])) return true;
    return false;
  }

  /* Where the player is: the successors of the furthest level they finished.
     At a fork that is TWO nodes and both are lit — the choice is the state,
     and picking one for them would be a lie. */
  var NEXT = [];
  function frontier() {
    var top = 0, topPos = -1, n;
    for (n = 1; n <= LEVELS; n++)
      if (cleared(n) && NODE[n].pos > topPos) { topPos = NODE[n].pos; top = n; }
    if (!top) return [1];
    var out = [], ss = succs(top);
    for (var i = 0; i < ss.length; i++)
      if (isOpen(ss[i]) && !cleared(ss[i])) out.push(ss[i]);
    return out;
  }
  function isNext(n) { return NEXT.indexOf(n) >= 0; }

  // a level on the road not taken: open, uncleared, and behind the frontier
  function isGap(n) {
    if (!isOpen(n) || cleared(n) || isNext(n)) return false;
    for (var k in save.l) if (save.l.hasOwnProperty(k) && NODE[+k] && NODE[+k].pos > NODE[n].pos) return true;
    return false;
  }

  /* One write, on endRound, merge-max: a bad replay never takes a star away.
     Nothing records what got unlocked — clearing the level is what unlocks its
     successors, and isOpen() reads it back. */
  function record(n, stars, value) {
    var rec = save.l[n] || { s: 0, b: 0, p: 0 };
    rec.s = Math.max(rec.s, stars);
    rec.b = Math.max(rec.b, value);
    rec.p++;
    save.l[n] = rec;
    persist();
  }

  /* Level 0 is one flag beside the levels — it earns nothing, so there is
     nothing to merge. Erasing the progression forgets it too: a board back at
     zero is a player starting over, and the tutorial is where they start. */
  function tutoSeen() { return !!save.h; }
  function markTuto() { if (!save.h) { save.h = 1; persist(); } }
  function virgin() {
    for (var k in save.l) if (save.l.hasOwnProperty(k)) return false;
    return true;
  }

  function wipe() { save = { v: 1, l: {} }; persist(); }

  /* ── 4. handing the level to the game ─────────────────────────────────── */

  /* `d` is the only thing a game is handed. The manifest names the knobs and
     their two ends — `"play.speedMin": [280, 430]` — and they are lerped into
     CONFIG in place, which is why a game reading `var T = CONFIG.play` at load
     sees the change without a line of its own. A pair of whole numbers stays
     whole: `lives: [4, 2]` must never become 3.4.

     Anything a lerp cannot express — a maze seed, a brick blueprint, a win
     condition — is the optional `Game.applyLevel(d)` hook, called last. It is
     handed `null` for the endless run, which is the game exactly as designed. */
  var BASE = null;

  function pathGet(path) {
    var parts = path.split("."), o = CONFIG;
    for (var i = 0; i < parts.length && o != null; i++) o = o[parts[i]];
    return o;
  }
  function pathSet(path, v) {
    var parts = path.split("."), o = CONFIG;
    for (var i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null) o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = v;
  }

  function tune(d) {
    var tab = (SPEC && SPEC.tune) || {}, k;
    if (!BASE) {
      BASE = {};
      for (k in tab) if (tab.hasOwnProperty(k)) BASE[k] = pathGet(k);
    }
    if (d == null) {
      for (k in BASE) if (BASE.hasOwnProperty(k)) pathSet(k, BASE[k]);
    } else {
      for (k in tab) if (tab.hasOwnProperty(k)) {
        var r = tab[k], v = r[0] + (r[1] - r[0]) * d;
        if (r[0] % 1 === 0 && r[1] % 1 === 0) v = Math.round(v);
        pathSet(k, v);
      }
    }
    if (W.Game && W.Game.applyLevel) W.Game.applyLevel(d);
  }

  /* The contract with the shell is one field, exactly the way CONFIG.mode
     already works: the level is written before startGame() and the game reads
     it when it resets. A game that never looks at it still gets its tuned
     knobs. */
  function arm(n) {
    CONFIG.level = n === BONUS ? 0 : n;
    tune(n === BONUS ? null : dOf(n));
  }

  /* ── 5. the result filter ─────────────────────────────────────────────── */

  /* The stars a level awards come off its objective, not off the flat
     thresholds a game carries in its own endRound call — those become the
     level-15 row of the same formula. The filter runs inside the motor's
     endRound (packages/shell/shell.js), so section 6 of the thirteen games
     never changes.

     A game whose objective is not its score says so by putting the measure in
     `result.levelScore`; everything else is measured on the score. */
  var last = null;

  function onResult(result) {
    var n = CONFIG.level;
    last = null;
    if (!ON || !n) return;                      // the endless run scores nothing
    var value = result.levelScore == null ? result.score : result.levelScore;
    var st = starsFor(n, value);
    var goal = goalOf(dOf(n));

    result.stars = st;
    /* A three-star round is ENDED BY THE LEVEL, not by the game losing, so the
       game's own title ("TORN APART") would be a lie; a missed objective needs
       saying out loud. One and two stars keep the game's flavour — the viper
       really did die. */
    if (!st) { result.title = T.missed; result.variant = ""; }
    else if (st === 3) { result.title = T.threeStars; result.variant = "perfect"; }
    else if (!result.variant) result.variant = "win";

    /* The objective is the first thing the end screen has to answer, and the
       column takes four rows before it overflows the frame — so it goes in at
       the top and the game's own last row makes way. */
    var rows = [{ label: T.objective, value: num(goal),
                  grade: st ? "accent" : "" }];
    result.rows = rows.concat(result.rows || []).slice(0, 4);

    record(n, st, value);
    last = { level: n, stars: st, cleared: st > 0 };
  }

  if (ON) W.onResult(onResult);

  /* ── 5b. the round: the stars as they are earned ──────────────────────── */

  /* A level is three thresholds on one number, and a player who cannot see
     where they are against them is playing an endless run with a score they
     have to remember. So the round carries the three stars, live, and they
     light as they are crossed.

     It is NOT in the HUD: the top band is the game's, all of it, and the
     thirteen fill it differently. This is one small pill under it, centred
     under the score it is measured against — the same reasoning that put the
     MENU and OPTIONS controls in the bottom-right corner.

     The measure is the game's `levelProgress()` when it has one, and the HUD
     score otherwise — the same rule as `levelScore` at the end of the round,
     so a level can never be scored on one number and shown against another. */
  var hudBox, hudNum, hudStars, hudFill, hudGoal;
  var watching = false, litStars = -1, won = false;

  function measure() {
    if (W.Game && W.Game.levelProgress) return W.Game.levelProgress();
    return Math.round(W.HUD.score());
  }

  function buildHud() {
    if (hudBox) return;
    /* Built with plain DOM rather than menu.js's `el`: the state hook that
       calls this is registered when the file loads, and a round can in
       principle start before mount() has handed the helpers over. */
    hudBox = document.createElement("div");
    hudBox.id = "lv-hud"; hudBox.hidden = true;
    hudBox.innerHTML =
      '<div class="top"><b class="n"></b><span class="st">' +
      '<s></s><s></s><s></s></span><i class="goal"></i></div>' +
      '<span class="bar"><u></u></span>';
    hudNum = hudBox.querySelector(".n");
    hudStars = hudBox.querySelectorAll(".st s");
    hudGoal = hudBox.querySelector(".goal");
    hudFill = hudBox.querySelector(".bar u");
    $("frame").appendChild(hudBox);
  }

  /* The bar fills toward the NEXT star, not toward the last one: at two stars
     it is the run from 1.5x to 2.2x that is left to walk, and that is the only
     distance the player still cares about. */
  function paintHud(value) {
    var n = CONFIG.level, g = goalOf(dOf(n));
    var st = starsFor(n, value);
    var lo = st === 0 ? 0 : st === 1 ? g : g * 1.5;
    var hi = st === 0 ? g : st === 1 ? g * 1.5 : g * 2.2;
    var k = st >= 3 ? 1 : Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
    hudFill.style.width = (k * 100).toFixed(1) + "%";
    hudGoal.textContent = num(Math.round(st >= 3 ? value : hi));
    if (st === litStars) return;
    /* A star landing is a beat of its own: the pill punches, the star burns in
       and the chime goes up a step. */
    for (var i = 0; i < 3; i++) {
      var on = i < st;
      hudStars[i].className = on ? "on" : "";
    }
    if (st > litStars && litStars >= 0) {
      hudBox.classList.remove("hit");
      void hudBox.offsetWidth;                 // once a star, not once a frame
      hudBox.classList.add("hit");
      W.Sound.cue("uiStar", 0.55, 1 + st * 0.14, 720 + st * 180, 0.09, "triangle");
    }
    litStars = st;
    if (st >= 3 && !won) winRound(value);
  }

  /* THE THREE-STAR FINISH. There is nothing left to earn, so the round stops
     asking: the world goes into slow motion over half a second, holds, and the
     end screen takes the frame. Arriving there fast is the point — a player who
     has already maxed a level should not have to die to be told so.

     The slow-down is `Loop.rate`, so the world, the round clock and the game's
     own update ease off together and the frame keeps rendering at 60. */
  var WIN_RAMP = 620, WIN_HOLD = 420;

  function winRound(value) {
    won = true;
    W.Fx.flash("#ffd43b", 0.45, 2.2);
    W.Fx.shake(9, 0.3);
    W.Music.duck(0.4, 0.35);
    W.Pop.show("perfect", { word: T.threeStars, at: "upper", hold: 1.1 });
    W.Sound.cue("uiStar", 0.8, 1.5, 1180, 0.18, "triangle");

    var t0 = performance.now();
    (function ramp(now) {
      var k = Math.min(1, ((now || performance.now()) - t0) / WIN_RAMP);
      W.Loop.rate(1 - 0.88 * k * k);                    // 1 -> 0.12, easing in
      if (k < 1) { requestAnimationFrame(ramp); return; }
      setTimeout(function () { finishWin(value); }, WIN_HOLD);
    })(t0);
  }

  /* The game gets to end its own round when it can (`Game.levelWon`), because
     the stat rows on the end screen are its own and a result built out here
     would have none of them. Without the hook the level layer ends it with what
     it knows, which is the score and the measure. */
  function finishWin(value) {
    if (W.state() !== "playing") return;             // it died on the way down
    W.Loop.rate(1);
    if (W.Game && W.Game.levelWon) W.Game.levelWon();
    else W.endRound({ score: Math.round(W.HUD.score()), levelScore: value });
  }

  function watch() {
    if (!watching) return;
    if (W.state() !== "playing") { watching = false; return; }
    paintHud(measure());
    requestAnimationFrame(watch);
  }

  /* The pill belongs to a LEVEL, so the endless run of a perfect board never
     sees it — there is no objective to be against. */
  function roundStarted() {
    buildHud();
    won = false;
    litStars = -1;
    W.Loop.rate(1);
    if (!ON || !CONFIG.level) { hudBox.hidden = true; return; }
    hudNum.textContent = CONFIG.level;
    hudBox.hidden = false;
    hudBox.classList.remove("hit");
    paintHud(measure());
    if (!watching) { watching = true; requestAnimationFrame(watch); }
  }

  function roundEnded() {
    watching = false;
    if (hudBox) hudBox.hidden = true;
    W.Loop.rate(1);
  }

  if (ON) W.onState(function (state) {
    if (state === "playing") roundStarted(); else roundEnded();
  });

  /* Where PLAY AGAIN goes after a level: on to the next one when there is a
     single way out and it was cleared, back to the same level otherwise. A
     fork has two ways out and neither is ours to pick. */
  function nextAfter(n) {
    if (!n || !cleared(n)) return 0;
    var ss = succs(n);
    if (ss.length !== 1) return 0;
    return isOpen(ss[0]) ? ss[0] : 0;
  }

  /* ── 6. geometry — an invisible grid, and roads that walk it ──────────── */

  var COLS = 6, COL_W = 120, ROW_H = 64, CORNER = 22;
  var PAD_BOT = 120, PAD_TOP = 130;
  var GRID_ROWS = (ROWS - 1) * 2;             // even rows hold levels
  function colX(c) { return COL_W / 2 + c * COL_W; }

  /* Deterministic noise: a map has to be the same map tomorrow, and a
     different one per game, so the seed is the slug. */
  function hashSeed(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function lcg(seed) {
    var s = seed || 1;
    return function () {
      s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  /* ZIGZAG is the studio's path style, settled by looking at all thirteen in
     lab/level-map.html: the common road crosses the board every time, so the
     climb never reads as a straight column and the forks have room either
     side. The three others the lab offers stay in the lab. */
  function zigPool(c) { return c <= 2 ? [3, 4, 5] : [0, 1, 2]; }

  /* Drop the thirty on the grid. Four rules keep a random map drawable, and
     they are the only constraints — everything else is the dice:
       - a level never takes its predecessor's column, or the road between them
         would be a straight line with nothing to read;
       - a fork node sits in column 2 or 3, and its two roads take the columns
         to its LEFT and to its RIGHT — measured from the fork, never from the
         board, or a fork landing on column 1 sends both roads rightwards and
         draws them on top of each other;
       - a fork's roads start at least two columns off it, so the horizontal
         run has room for a wall with clearance either side;
       - a merge takes NEITHER of its two incoming columns, or one road's final
         climb would pass straight through the other road's last level. */
  function assignColumns(seed) {
    var rnd = lcg(seed), col = {};
    function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
    function away(from, pool) {
      var ok = [], i;
      for (i = 0; i < pool.length; i++) if (pool[i] !== from) ok.push(pool[i]);
      return pick(ok.length ? ok : pool);
    }
    function all() {
      var a = [], i;
      for (i = 0; i < COLS; i++) a.push(i);
      return a;
    }
    function without(pool, taken) {
      var out = [], i;
      for (i = 0; i < pool.length; i++) if (taken.indexOf(pool[i]) < 0) out.push(pool[i]);
      return out;
    }
    function only(pool, keep) {
      var out = [], i;
      for (i = 0; i < pool.length; i++) if (keep.indexOf(pool[i]) >= 0) out.push(pool[i]);
      return out;
    }

    var prevCol = pick([1, 2, 3, 4]);
    var prevExits = null;                   // the two columns a fork left behind

    for (var si = 0; si < PLAN.length; si++) {
      var sec = PLAN[si];
      if (sec.line) {
        for (var i = 0; i < sec.line.length; i++) {
          var id = sec.line[i];
          var beforeFork = (i === sec.line.length - 1) && PLAN[si + 1] && PLAN[si + 1].fork;
          if (i === 0 && prevExits) {
            var pool = without(all(), prevExits);
            if (beforeFork) pool = only(pool, [2, 3]);
            col[id] = pick(pool.length ? pool : [2, 3]);
          } else if (beforeFork) {
            col[id] = pick([2, 3]);
          } else {
            col[id] = away(prevCol, zigPool(prevCol));
          }
          prevCol = col[id];
        }
        prevExits = null;
      } else {
        var halves = [[], []], c;
        for (c = 0; c < COLS; c++) {
          if (c < prevCol) halves[0].push(c);
          else if (c > prevCol) halves[1].push(c);
        }
        var exits = [];
        for (var ri = 0; ri < sec.fork.length; ri++) {
          var ids = sec.fork[ri], half = halves[ri], far = [], j;
          for (j = 0; j < half.length; j++)
            if (Math.abs(half[j] - prevCol) >= 2) far.push(half[j]);
          var lastCol = pick(far.length ? far : (half.length ? half : [prevCol]));
          col[ids[0]] = lastCol;
          for (j = 1; j < ids.length; j++) {
            var rest = without(half, [lastCol]);
            lastCol = pick(rest.length ? rest : half);
            col[ids[j]] = lastCol;
          }
          exits.push(lastCol);
        }
        prevExits = exits;
        prevCol = exits[0];
      }
    }
    /* Level 0 last, and by the same rule as everyone else: never its
       neighbour's column, so the spur up to level 1 is an L the eye can read
       rather than a straight line with nothing in it. */
    col[TUTO] = away(col[1], zigPool(col[1]));
    return col;
  }

  /* The walk from one level to the next: up into the free row, across it, then
     up into the level. Right angles, rounded just enough not to look like a
     circuit diagram.

     It comes back in TWO pieces, cut where a wall would stand. A gated road
     paints the first piece and stops there; nothing else needs to know a wall
     exists. */
  function roadPath(a, b) {
    var turnY = a.y - ROW_H;                  // the free row above `a`
    if (a.x === b.x) {
      var cutY = (turnY + b.y) / 2;
      return { head: "M " + a.x + " " + a.y + " L " + a.x + " " + cutY,
               tail: "M " + a.x + " " + cutY + " L " + b.x + " " + b.y,
               cut: { x: b.x, y: cutY } };
    }
    var dir = b.x > a.x ? 1 : -1, r = CORNER;
    /* A wall stands on the horizontal RUN, a little past its middle — not on
       the final climb, which is one row tall and mostly covered by the level
       sitting on top of it. The run is 240 px or more by construction. */
    var cutX = a.x + (b.x - a.x) * 0.55;
    return {
      head: "M " + a.x + " " + a.y + " L " + a.x + " " + (turnY + r) +
            " Q " + a.x + " " + turnY + " " + (a.x + dir * r) + " " + turnY +
            " L " + cutX + " " + turnY,
      tail: "M " + cutX + " " + turnY + " L " + (b.x - dir * r) + " " + turnY +
            " Q " + b.x + " " + turnY + " " + b.x + " " + (turnY - r) +
            " L " + b.x + " " + b.y,
      cut: { x: cutX, y: turnY }
    };
  }

  var geo = null;
  function place(withBonus) {
    var col = assignColumns(hashSeed(CONFIG.slug || "game"));
    var rows = GRID_ROWS + (withBonus ? 2 : 0);
    /* Level 0 is one level-row BELOW level 1, on the same grid as everything
       else: the foot of the climb moves up by two rows and nothing else in
       the geometry changes. */
    var foot = PAD_BOT + 2 * ROW_H;
    var height = foot + rows * ROW_H + PAD_TOP;
    var pts = {}, n;
    for (n = 1; n <= LEVELS; n++)
      pts[n] = { n: n, x: colX(col[n]), y: height - (foot + (NODE[n].pos - 1) * 2 * ROW_H) };
    pts[TUTO] = { n: TUTO, x: colX(col[TUTO]), y: height - PAD_BOT };
    if (withBonus)
      pts[BONUS] = { n: BONUS, x: colX(col[LEVELS]), y: height - (foot + ROWS * 2 * ROW_H) };
    return { pts: pts, height: height };
  }

  /* ── 7. the screen ────────────────────────────────────────────────────── */

  var API = null;                 // { el, icon, start } — handed in by menu.js
  var box, scroll, canvasBox, svg, card, headTitle, headEyebrow, totalBox, totalN;
  var cName, cBand, cGoal, cNote, cChips, cDiff, cDiffN, cPlay;
  var picked = 1;                 // a level number, or { road: index }
  var built = false, shown = false;

  var PADLOCK = '<svg class="padlock" viewBox="0 0 24 24" fill="none" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="4" y="10" width="16" height="11" rx="2.5"/>' +
    '<path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';

  function $(id) { return document.getElementById(id); }

  function build() {
    if (built) return;
    built = true;
    var el = API.el;

    box = el("div"); box.id = "lv-screen";

    var bg = el("div"); bg.id = "lv-bg";
    dressBackdrop(bg);
    box.appendChild(bg);

    var head = el("header"); head.id = "lv-head";
    var back = el("button", "web-back", API.icon("back", "back-ico"));
    back.addEventListener("click", close);
    head.appendChild(back);
    var titles = el("div"); titles.id = "lv-titles";
    headEyebrow = el("div"); headEyebrow.id = "lv-eyebrow";
    headTitle = el("div"); headTitle.id = "lv-title";
    titles.appendChild(headEyebrow);
    titles.appendChild(headTitle);
    head.appendChild(titles);
    totalBox = el("div"); totalBox.id = "lv-total";
    totalBox.appendChild(el("span", "g", "&#9733;"));
    totalN = el("span"); totalN.id = "lv-total-n";
    totalBox.appendChild(totalN);
    head.appendChild(totalBox);
    box.appendChild(head);

    scroll = el("div"); scroll.id = "lv-scroll";
    canvasBox = el("div"); canvasBox.id = "lv-canvas";
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "lv-path");
    svg.setAttribute("preserveAspectRatio", "none");
    canvasBox.appendChild(svg);
    scroll.appendChild(canvasBox);
    box.appendChild(scroll);

    card = el("section"); card.id = "lv-card";
    var top = el("div", "top");
    cName = el("div"); cName.id = "lv-name";
    cBand = el("div"); cBand.id = "lv-band";
    top.appendChild(cName); top.appendChild(cBand);
    cGoal = el("div"); cGoal.id = "lv-goal";
    cNote = el("div"); cNote.id = "lv-note";
    cChips = el("div"); cChips.id = "lv-chips";
    cDiff = el("div"); cDiff.id = "lv-diff";
    cDiff.innerHTML = '<span class="lbl"></span><span class="bar"><i></i></span><b></b>';
    cDiffN = cDiff.querySelector("b");
    cPlay = el("button"); cPlay.id = "lv-play";
    cPlay.addEventListener("click", onPlay);
    card.appendChild(top);
    card.appendChild(cGoal);
    card.appendChild(cNote);
    card.appendChild(cChips);
    card.appendChild(cDiff);
    card.appendChild(cPlay);
    box.appendChild(card);

    $("frame").appendChild(box);
    W.Fit.room("lv-title", 400);
  }

  /* The same backdrop the menu is dressed with, in the same order: the painted
     screen the motor already carries, then a picture the game embeds itself,
     then the gradient its SKIN paints the page with. Copied as a background
     rather than moved — the menu is still behind this layer and keeps its own
     scene. */
  function dressBackdrop(bg) {
    var art = CONFIG.art && CONFIG.art.backgroundPhone;
    if (art) { bg.style.backgroundImage = "url(" + art + ")"; return; }
    var images = (W.ASSETS && W.ASSETS.images) || {};
    var src = images.bg || images.bg1 || null;
    if (src) { bg.style.backgroundImage = "url(" + src + ")"; return; }
    var cs = window.getComputedStyle(document.body);
    if (cs.backgroundImage && cs.backgroundImage !== "none") bg.style.backgroundImage = cs.backgroundImage;
    bg.style.backgroundColor = cs.backgroundColor;
    bg.className = "flat";
  }

  /* The read-out goes on whichever side of the FRAME has room for it —
     measured, not guessed from the column, because the stars are the one thing
     on this screen that must never be clipped. */
  function tagAt(pt, html) {
    var toLeft = pt.x + 46 + 150 > 720 - 16;
    var tag = API.el("div", "lv-tag", html);
    tag.style.left = (pt.x + (toLeft ? -50 : 50)) + "px";
    tag.style.top = pt.y + "px";
    if (toLeft) tag.style.transform = "translate(-100%, -50%)";
    canvasBox.appendChild(tag);
  }

  function starRow(s) {
    var out = '<span class="lv-stars">', i;
    for (i = 1; i <= 3; i++) out += '<s class="' + (i <= s ? "on" : "") + '">&#9733;</s>';
    return out + "</span>";
  }

  function draw() {
    var full = perfect();
    geo = place(full);
    NEXT = frontier();

    canvasBox.style.height = geo.height + "px";
    if (full) canvasBox.className = "allstars"; else canvasBox.className = "";
    svg.setAttribute("viewBox", "0 0 720 " + geo.height);
    svg.style.height = geo.height + "px";

    /* One road per edge, walked cell to cell. WALKED means both ends are done
       (or the far end is where the player stands) — that is the road behind
       them, and the only thing painted in the accent. A gated road is painted
       the same way up to its wall and no further: the colour arrives, the wall
       stops it. */
    var ink = "", cuts = {}, i;
    var DIM = "rgba(255,255,255,.15)";
    function paint(d, on) {
      return '<path d="' + d + '" fill="none" stroke-linecap="round" ' +
             'stroke-linejoin="round" stroke="' + (on ? "var(--accent)" : DIM) +
             '" stroke-width="13"/>';
    }
    for (i = 0; i < EDGES.length; i++) {
      var e = EDGES[i], a = geo.pts[e.from], b = geo.pts[e.to];
      var rd = roadEntering(e.to), shut = rd && roadShut(rd);
      var p = roadPath(a, b);
      if (rd) cuts[ROADS.indexOf(rd)] = p.cut;
      if (shut) {
        ink += paint(p.head, cleared(e.from)) + paint(p.tail, false);
      } else {
        var live = cleared(e.from) && (cleared(e.to) || isNext(e.to));
        ink += paint(p.head, live) + paint(p.tail, live);
      }
    }
    /* The spur up to level 0 is DOTTED, and it is never lit: the climb does
       not go through it, and a road painted in the accent is a road the player
       has walked. Nothing is gated on it, so it has no wall either. */
    var p0 = roadPath(geo.pts[TUTO], geo.pts[1]);
    ink += '<path d="' + p0.head + " " + p0.tail + '" fill="none" ' +
           'stroke-linecap="round" stroke-linejoin="round" stroke="' + DIM +
           '" stroke-width="9" stroke-dasharray="0.1 26"/>';

    if (full) {
      var pb = roadPath(geo.pts[LEVELS], geo.pts[BONUS]);
      ink += '<path d="' + pb.head + " " + pb.tail + '" fill="none" ' +
             'stroke-linecap="round" stroke-linejoin="round" ' +
             'stroke="var(--gold)" stroke-width="13"/>';
    }
    svg.innerHTML = ink;

    var old = canvasBox.querySelectorAll(".lv-node,.lv-wall,.lv-tag");
    for (i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);

    /* The only furniture on a road is its wall, and only a gated road has one.
       Tapping it is how the player learns what it wants. */
    for (i = 0; i < ROADS.length; i++) {
      var road = ROADS[i];
      if (!road.gate || !cuts[i]) continue;
      var w = API.el("div", "lv-wall " + (roadShut(road) ? "shut" : "broken"));
      w.style.left = cuts[i].x + "px";
      w.style.top = cuts[i].y + "px";
      w.innerHTML = '<span class="half l"></span><span class="half r"></span>' +
        '<svg class="lock" viewBox="0 0 24 24"><rect x="4" y="10" width="16" ' +
        'height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
      w.addEventListener("click", (function (idx) {
        return function () { picked = { road: idx }; writeCard(); };
      })(i));
      canvasBox.appendChild(w);
    }

    /* Level 0 first, at the bottom of the scroll: it is the first thing under
       the thumb on a map that has never been played, and the last thing in the
       way of a player who knows the game — one node, off the road. */
    var tuto = API.el("button", "lv-node tuto" + (tutoSeen() ? " seen" : ""),
                      '<span class="num">?</span>');
    tuto.style.left = geo.pts[TUTO].x + "px";
    tuto.style.top = geo.pts[TUTO].y + "px";
    tuto.addEventListener("click", function () { picked = TUTO; writeCard(); });
    canvasBox.appendChild(tuto);
    tagAt(geo.pts[TUTO], "<em>" + T.tutoTag + "</em>");

    var top = full ? BONUS : LEVELS;
    for (var n = 1; n <= top; n++) {
      var pt = geo.pts[n];
      var cls = n === BONUS ? "bonus"
              : starsOf(n) === 3 ? "done perfect"
              : cleared(n) ? "done"
              : isNext(n) ? "next"
              : isGap(n) ? "gap"
              : isOpen(n) ? "open" : "lock";
      var node = API.el("button", "lv-node " + cls,
        '<span class="num">' + n + "</span>" + PADLOCK);
      node.style.left = pt.x + "px";
      node.style.top = pt.y + "px";
      node.addEventListener("click", (function (m) {
        return function () { picked = m; writeCard(); };
      })(n));
      canvasBox.appendChild(node);

      if (n === BONUS) continue;

      var bits = played(n)
        ? starRow(starsOf(n)) + '<span class="best">' + num(save.l[n].b) + "</span>"
        : isGap(n) ? "<em>" + T.notTakenTag + "</em>" : "";
      if (bits) tagAt(pt, bits);
    }

    totalN.textContent = totalStars() + "/" + MAX_STARS;
    if (full) totalBox.className = "full"; else totalBox.className = "";
    writeCard();
  }

  /* ── 7b. the card, for a level or for a road ──────────────────────────── */

  function writeCard() {
    if (picked && picked.road != null) roadCard(ROADS[picked.road]);
    else levelCard(picked);
    scroll.style.bottom = card.offsetHeight + "px";
  }

  function levelCard(n) {
    card.className = "";
    if (n === TUTO) return tutoCard();
    if (n === BONUS) return bonusCard();
    var d = dOf(n), rec = save.l[n], can = isOpen(n);
    cName.textContent = T.level + " " + n;
    cBand.textContent = T.bands[bandOf(n)];
    cGoal.innerHTML = goalText(n);

    var forks = roadsAt(n), ahead = "";
    if (forks.length === 2)
      ahead = " &middot; <em>" + fill(T.forks, { a: forks[0].len, b: forks[1].len }) + "</em>";

    cNote.innerHTML = (rec
      ? T.best + " <em>" + num(rec.b) + "</em> &middot; " +
        rec.s + "/3 " + T.starsOf + " &middot; " + rec.p + " " + T.tries
      : can ? (isGap(n) ? T.notTaken : T.never) : T.gatedHere) + ahead;

    cChips.innerHTML = "";
    cDiff.style.display = "";
    cDiff.querySelector(".lbl").textContent = T.difficulty;
    cDiff.querySelector(".bar i").style.width = Math.round(d * 100) + "%";
    cDiffN.textContent = d.toFixed(2);

    cPlay.disabled = !can;
    cPlay.textContent = !can ? T.locked : rec ? T.replay : T.play;
  }

  /* Level 0 is not a level either: the button opens the Help panel instead of
     starting a round, and the card says out loud that skipping it costs
     nothing — a tutorial a player is made to read is a tutorial they skim. */
  function tutoCard() {
    card.className = "is-tuto";
    cName.textContent = T.level + " 0";
    cBand.textContent = T.tutoBand;
    cGoal.innerHTML = T.tutoGoal;
    cNote.innerHTML = tutoSeen() ? T.tutoNoteSeen : T.tutoNote;
    cChips.innerHTML = "";
    cDiff.style.display = "none";
    cPlay.disabled = false;
    cPlay.textContent = T.tutoPlay;
  }

  /* Ninety of ninety opens one more node, and it is not a level: it is the
     game with the levels taken off. No objective, no stars, no end. */
  function bonusCard() {
    cName.textContent = T.endless;
    cBand.textContent = "";
    cGoal.innerHTML = T.endlessSub + " &mdash; " + T.endlessGoal;
    cNote.innerHTML = T.endlessNote;
    cChips.innerHTML = "";
    cDiff.style.display = "none";
    cPlay.disabled = false;
    cPlay.textContent = T.endlessPlay;
  }

  /* A road's card answers the two questions the fork asks: what is down there,
     and — if it is gated — where the missing stars are. */
  function roadCard(rd) {
    var shut = roadShut(rd), have = totalStars(), short = rd.gate - have;
    card.className = "is-wall";
    cName.textContent = rd.len + " " + (rd.len > 1 ? T.title.toLowerCase() : T.level.toLowerCase());
    cBand.textContent = (rd.side < 0 ? T.roadL : T.roadR) + " · " +
      (rd.gate ? (shut ? T.gated : T.opened) : T.free);
    cDiff.style.display = "none";

    var first = rd.nodes[0], lastN = rd.nodes[rd.nodes.length - 1];
    var span = rd.len > 1 ? fill(T.roadSpan, { a: first, b: lastN }) : fill(T.roadOne, { a: first });
    var other = null, i;
    for (i = 0; i < ROADS.length; i++)
      if (ROADS[i].from === rd.from && ROADS[i] !== rd) other = ROADS[i];

    if (!shut) {
      cGoal.innerHTML = span + (other ? " " + fill(T.roadOther, { n: other.len }) : "");
      cNote.innerHTML = rd.gate
        ? fill(T.roadPaid, { n: rd.gate, have: have })
        : (rd.len < rd.other ? T.roadShort : T.roadLong);
      var chips = "";
      for (i = 0; i < rd.nodes.length; i++) {
        var m = rd.nodes[i];
        chips += '<button data-lv="' + m + '">' + m +
          (played(m) ? " <s>" + starsOf(m) + "&#9733;</s>" : "") + "</button>";
      }
      cChips.innerHTML = chips;
      bindChips();
      cPlay.disabled = !isOpen(rd.entry);
      cPlay.textContent = T.takeRoad;
      return;
    }

    cGoal.innerHTML = fill(T.roadWants, { span: span, n: rd.gate, have: have, short: short });

    /* The cheapest stars to go back for: already cleared, short of three,
       easiest first. Naming them is the difference between a wall that
       explains itself and one that only says no. */
    var spare = [], n;
    for (n = 1; n <= LEVELS; n++)
      if (cleared(n) && save.l[n].s < 3) spare.push({ n: n, gain: 3 - save.l[n].s });
    spare.sort(function (a, b) { return dOf(a.n) - dOf(b.n); });
    var take = [], got = 0;
    for (i = 0; i < spare.length && got < short; i++) { take.push(spare[i]); got += spare[i].gain; }

    cNote.innerHTML = other
      ? fill(T.roadOpenOther, { n: other.len }) + (take.length && got >= short ? T.findHere : T.playOn)
      : "";
    var out = "";
    for (i = 0; i < take.length && i < 4; i++)
      out += '<button data-lv="' + take[i].n + '">' + take[i].n +
             ' <s>+' + take[i].gain + "&#9733;</s></button>";
    cChips.innerHTML = out;
    bindChips();

    cPlay.disabled = !take.length;
    cPlay.textContent = take.length ? T.replay + " " + take[0].n : T.locked;
  }

  function bindChips() {
    var bs = cChips.querySelectorAll("button");
    for (var i = 0; i < bs.length; i++) {
      bs[i].addEventListener("click", (function (b) {
        return function () { picked = +b.getAttribute("data-lv"); writeCard(); scrollTo(picked); };
      })(bs[i]));
    }
  }

  function scrollTo(n) {
    var p = geo && geo.pts[n];
    if (p) scroll.scrollTop = Math.max(0, p.y - scroll.clientHeight / 2);
  }

  /* ── 7b bis. the help panel, over the map ─────────────────────────────── */

  /* The Help panel is menu.js's, handed over on mount: one help screen in this
     shell, not two — the same title, the same sentence in the player's own
     language and the motor's own demo stage, MOVED here and given back on the
     way out.

     It opens over the map rather than under it: `#screen-intro` is a stacking
     context of its own (z-index 30 in the motor stylesheet) and the map sits
     at 34, so the menu's panel cannot be raised above it — and sending the
     player back to the menu to read two lines would lose the map they were
     standing on. */
  var helpBox, helpBody, helpTitle, helpOn = false;

  function buildHelp() {
    if (helpBox) return;
    helpBox = API.el("section"); helpBox.id = "lv-help";
    var head = API.el("div", "web-phead");
    var back = API.el("button", "web-back", API.icon("back", "back-ico"));
    back.addEventListener("click", closeHelp);
    helpTitle = API.el("h2", "web-ptitle");
    head.appendChild(back);
    head.appendChild(helpTitle);
    helpBody = API.el("div", "web-pbody");
    helpBox.appendChild(head);
    helpBox.appendChild(helpBody);
    box.appendChild(helpBox);
  }

  function fillHelp() {
    helpTitle.textContent = API.help.title();
    helpBody.innerHTML = "";
    API.help.fill(helpBody);
  }

  function openHelp() {
    if (!API.help) return;
    buildHelp();
    fillHelp();
    helpBox.className = "on";
    helpOn = true;
    // one object beside the card, like the menu's own panels
    W.Decor.dress(helpBox, {
      count: 1, spots: ["tl", "l", "bl"], size: 140, opacity: 0.45, front: 0.4
    });
    if (!tutoSeen()) { markTuto(); draw(); }     // the node stops being dashed
  }

  function closeHelp() {
    if (!helpOn) return;
    helpOn = false;
    helpBox.className = "";
    W.Decor.clear(helpBox);
    // the demo stage belongs to the menu's Help panel; give it back
    if (API.help.park) API.help.park();
  }

  /* ── 7c. playing ──────────────────────────────────────────────────────── */

  function onPlay() {
    if (picked === TUTO) { openHelp(); return; }
    if (picked && picked.road != null) {
      var rd = ROADS[picked.road];
      // A shut wall's button goes to the cheapest star, not through the wall.
      var chip = cChips.querySelector("button");
      picked = roadShut(rd) && chip ? +chip.getAttribute("data-lv") : rd.entry;
      writeCard();
      scrollTo(picked);
      return;
    }
    play(picked);
  }

  /* startGame() unlocks the audio itself, and this runs inside the click that
     asked for the round, so the gesture is still the player's. */
  function play(n) {
    if (n !== BONUS && !isOpen(n)) return;
    arm(n);
    hide();
    W.start();
  }

  /* ── 8. open / close ──────────────────────────────────────────────────── */

  function show() {
    build();
    /* On screen BEFORE anything is drawn: writeCard() insets the scroll band
       by the card's own height, and a card inside a `display:none` layer
       measures zero — which lets the map paint under it. */
    box.className = "on";
    shown = true;
    headEyebrow.textContent = T.pick;
    headTitle.textContent = CONFIG.title || T.title;
    W.Fit.one("lv-title");
    /* A board nobody has played yet opens ON level 0 — the map scrolled to its
       foot, the card offering the lesson. It is still one tap to level 1, and
       every later arrival lands on the level the player is actually at. */
    picked = perfect() ? BONUS
           : (!tutoSeen() && virgin()) ? TUTO
           : (frontier()[0] || LEVELS);
    draw();
    scrollTo(picked);
    /* Two of the game's own objects down the empty sides of the map, behind
       the road and the card (levels.css gives the layer its depth). The map is
       a long scroll of nodes on a backdrop, and the margins either side of the
       six-column grid are exactly the room this has been waiting for. */
    W.Decor.dress(box, {
      count: 2, spots: ["l", "r", "bl"], size: 140, opacity: 0.38, front: 0
    });
  }

  function hide() {
    if (!box) return;
    closeHelp();
    box.className = "";
    shown = false;
    W.Decor.clear(box);
  }

  // The back arrow — and ESCAPE, which menu.js routes here: the help panel is
  // what closes first when it is the thing on screen.
  function close() {
    if (helpOn) { closeHelp(); return; }
    hide();
  }

  /* ── 9. the golden title screen ───────────────────────────────────────── */

  /* Thirty levels, three stars each. The map turns gold on its own; the MENU
     has to say it too, or a player who finished the game comes back to exactly
     the screen they left. The sheen is one node, added once. */
  function dressPerfect() {
    var intro = $("screen-intro");
    if (!intro) return;
    var on = ON && perfect();
    if (on && !intro.querySelector(".lv-sheen")) {
      var sheen = API ? API.el("div", "lv-sheen") : null;
      if (sheen) intro.appendChild(sheen);
    }
    intro.classList.toggle("lv-perfect", on);
  }

  /* ── 10. the module ───────────────────────────────────────────────────── */

  window.__LEVELS__ = {
    active: function () { return ON; },

    /* menu.js hands in its own dom helpers and its language, once, on mount —
       so there is one `el`, one icon pack and one FR/EN mechanism in the web
       shell rather than two. */
    mount: function (api) {
      API = api;
      LANG = STRINGS[api.lang] ? api.lang : "en";
      T = STRINGS[LANG];
      if (!ON) return;
      dressPerfect();
    },

    setLang: function (code) {
      LANG = STRINGS[code] ? code : "en";
      T = STRINGS[LANG];
      if (shown) { headEyebrow.textContent = T.pick; draw(); }
      if (helpOn) fillHelp();
    },

    /* A game with several modes keeps its extra menu entries, and they start a
       FREE round rather than a level — the map belongs to the default mode.
       Clearing is what stops the level armed by the last round from following
       a mode launch: CONFIG.level is a field, not a screen. */
    clear: function () { if (ON) { CONFIG.level = 0; tune(null); } },

    open: function () { if (ON) show(); },
    close: close,
    isOpen: function () { return shown; },

    /* Everything the menu needs to know about a finished round, so that PLAY
       AGAIN can be NEXT LEVEL and MENU can be MAP. */
    last: function () { return last; },
    nextOf: function () { return last ? nextAfter(last.level) : 0; },
    playNext: function () {
      var n = last ? nextAfter(last.level) : 0;
      if (n) play(n); else if (last) play(last.level);
    },
    replayLast: function () { if (last) play(last.level); },

    text: function (key) { return T[key]; },
    perfect: function () { return ON && perfect(); },
    total: function () { return totalStars(); },
    max: function () { return MAX_STARS; },
    refreshVeil: dressPerfect,

    /* OPTIONS wipes more than it used to: "erase the best score" now throws
       away thirty levels of stars, so it gets its own row and its own
       confirmation over there. */
    wipe: function () { wipe(); dressPerfect(); if (shown) draw(); }
  };
})();
