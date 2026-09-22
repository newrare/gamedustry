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
  var VW = window.__VIEW__;
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
      level: "Level", locked: "Locked", play: "Play", replay: "Replay",
      never: "Never played", notTaken: "Not played yet",
      notTakenTag: "not played",
      gatedHere: "Locked",
      best: "Best", tries: "tries", starsOf: "stars",
      difficulty: "difficulty",
      roadL: "Left branch", roadR: "Right branch",
      gated: "Gated", opened: "Open", free: "Free",
      roadPaid: "<em>★ {n}</em> needed — you have <b>{have}</b>.",
      roadWants: "<b>★ {n}</b> to unlock — you have <b>{have}</b>, <b>{short} short</b>.",
      findHere: "The cheapest stars to go back for:",
      playOn: "The stars will come from playing on.",
      takeRoad: "Go this way",
      tutoBand: "Optional", tutoTag: "how to play",
      tutoGoal: "Start the tutorial to learn how to play.",
      tutoNote: "Level 1 is open from the start.",
      tutoNoteSeen: "Read · open it again whenever you want.",
      tutoPlay: "How to play",
      endless: "Endless", endlessSub: "Level 31 · the reward for a perfect board",
      endlessGoal: "Every level cleared with <b>three stars</b>. There is nothing " +
                   "left to unlock, so the run simply does not stop.",
      endlessNote: "No objective, no clock, no levels — <em>★ 90/90</em>.",
      endlessPlay: "Start the endless run",
      bands: ["Warm-up", "Pressure", "Squeeze", "Overdrive", "Meltdown"],
      objective: "Objective", missed: "Objective missed",
      scores: "Scores", almost: "Almost",
      threeStars: "Three stars!", cleared: "Level cleared!",
      levelsEntry: "Levels", map: "Map", next: "Next level", home: "Home"
    },
    fr: {
      level: "Niveau", locked: "Verrouillé", play: "Jouer", replay: "Rejouer",
      never: "Jamais joué", notTaken: "Pas encore joué",
      notTakenTag: "non joué",
      gatedHere: "Verrouillé",
      best: "Record", tries: "essais", starsOf: "étoiles",
      difficulty: "difficulté",
      roadL: "Branche de gauche", roadR: "Branche de droite",
      gated: "Fermée", opened: "Ouverte", free: "Libre",
      roadPaid: "<em>★ {n}</em> demandées — tu en as <b>{have}</b>.",
      roadWants: "<b>★ {n}</b> pour déverrouiller — tu en as <b>{have}</b>, <b>il en manque {short}</b>.",
      findHere: "Les étoiles les moins chères à rattraper :",
      playOn: "Les étoiles viendront en continuant.",
      takeRoad: "Passer par là",
      tutoBand: "Facultatif", tutoTag: "comment jouer",
      tutoGoal: "Lance le tutoriel pour savoir comment jouer.",
      tutoNote: "Le niveau 1 est ouvert dès le départ.",
      tutoNoteSeen: "Lu · à rouvrir quand tu veux.",
      tutoPlay: "Comment jouer",
      endless: "Sans fin", endlessSub: "Niveau 31 · la récompense d’un tableau parfait",
      endlessGoal: "Tous les niveaux finis à <b>trois étoiles</b>. Il n’y a plus " +
                   "rien à débloquer, alors la partie ne s’arrête plus.",
      endlessNote: "Pas d’objectif, pas de chrono, pas de niveaux — <em>★ 90/90</em>.",
      endlessPlay: "Lancer la partie sans fin",
      bands: ["Échauffement", "Pression", "Étau", "Surrégime", "Fusion"],
      objective: "Objectif", missed: "Objectif manqué",
      scores: "Scores", almost: "Presque",
      threeStars: "Trois étoiles !", cleared: "Niveau réussi !",
      levelsEntry: "Niveaux", map: "Carte", next: "Niveau suivant", home: "Accueil"
    }
  };

  /* Which of them the screen SHOUTS. Every string above is written in normal
     case, like the rest of the repo; the ones listed here are set in capitals
     by the motor's `upper` (packages/engine), which also takes the accents
     off — a capital carries none in this house. */
  var up = W.upper;
  var CAPS = ["title", "pick", "play", "replay", "takeRoad", "tutoPlay",
    "endlessPlay", "objective", "missed", "scores", "almost",
    "threeStars", "cleared", "levelsEntry", "map", "next", "locked", "tutoTag",
    "notTakenTag"
  ];
  (function () {
    function shout(v) {
      if (typeof v === "string") return up(v);
      if (v && v.length != null) { for (var i = 0; i < v.length; i++) v[i] = shout(v[i]); }
      return v;
    }
    for (var lang in STRINGS) if (STRINGS.hasOwnProperty(lang)) {
      for (var k = 0; k < CAPS.length; k++) {
        if (STRINGS[lang][CAPS[k]] != null) STRINGS[lang][CAPS[k]] = shout(STRINGS[lang][CAPS[k]]);
      }
    }
  })();

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

  /* THE NAME ON THE CARD. The five generic ones (Warm-up … Meltdown) describe
     a ladder and nothing else, so a game may name its own bands in
     `web.levels.bands` — its biomes, or the rule each band brings — in the two
     languages, exactly like `web.levels.copy`.

     `from` is what keeps that name honest. The map's own bands are ROWS on a
     forking road (`bandOf`), and three of the thirteen deliberately turn their
     world over on the LEVEL NUMBER instead — radiam and arcider both say so in
     as many words: two roads out of a fork have to be the same world, whatever
     they cost. A game that splits at 1/7/13/19/25 lists those numbers here and
     the card names the world the round will actually build; a game that reads
     its band off `d` (echomaze) leaves `from` out and gets the map's. */
  function bandName(n) {
    var b = (SPEC && SPEC.bands) || null, list, i = bandOf(n), j;
    if (!b) return up(T.bands[i]);
    if (b.from && b.from.length) {
      i = 0;
      for (j = 0; j < b.from.length; j++) if (n >= b.from[j]) i = j;
    }
    list = b[LANG] || b.en;
    return up((list && list[i]) || T.bands[Math.min(i, T.bands.length - 1)]);
  }

  /* The same name, asked for by BAND rather than by level — what the meta
     layer needs to write "earned by clearing <band>" on a sticker's card. It
     does not go through `from`, which only exists to map a LEVEL onto a band:
     the index into the list of names is the band either way. */
  function bandTitle(i) {
    var b = (SPEC && SPEC.bands) || null, list;
    i = Math.max(0, Math.min(T.bands.length - 1, i | 0));
    if (!b) return up(T.bands[i]);
    list = b[LANG] || b.en;
    return up((list && list[i]) || T.bands[i]);
  }

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

  /* WHAT THE THREE BANDS ACTUALLY PAY. A game whose round is not won by piling
     up a quantity may CAP them through `Game.levelStars(stars, value)`.
     arcider is the one: the objective says how far the craft drove, but the
     board is a race, so a run that stopped short of the chequered flag is
     worth one star however far it drove, the flag is worth two, and only first
     place is worth three.

     A filter, never a promotion — the measure stays the objective's, a level
     is still cleared by meeting it, and no hook may hand out a star the value
     did not reach. It runs on the live pill as well as on the result, so the
     stars a round wears are the stars it will be paid; the BAR under them
     keeps walking the raw bands, because what it counts down is the distance
     to the next threshold and that is the same distance either way. */
  function starsEarned(n, value) {
    var st = starsFor(n, value);
    if (W.Game && W.Game.levelStars) {
      st = Math.max(0, Math.min(st, W.Game.levelStars(st, value) | 0));
    }
    return st;
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

  /* ── 3c. the bands, as the meta layer collects them ───────────────────── */

  /* packages/webshell/meta.js pays a sticker for a band of the climb, and the
     bands are the MAP's — so the reading of them is here, where `bandOf` and
     the save already are, rather than in a second file that would have to
     re-derive both.

     PASSED is the climb having gone past the band: a cleared level in a higher
     band, or level 30 itself for the top one. It is deliberately not "every
     level of the band cleared" — a fork's two roads share a band and missing
     the road not taken is a choice this design protects (section 1), so a rule
     that demanded both roads would be unreachable for a player who chose.
     CLEAN is the same band with every level the player PLAYED in it standing
     at three stars: the road they walked, walked perfectly. */
  function bandsState() {
    var b, n, st = [], topBand = -1, allCleared = true;
    for (b = 0; b < 5; b++) st.push({ total: 0, played: 0, cleared: 0, three: 0, passed: false, clean: false });
    for (n = 1; n <= LEVELS; n++) {
      var s = st[bandOf(n)];
      s.total++;
      if (played(n)) s.played++;
      if (cleared(n)) {
        s.cleared++;
        if (starsOf(n) >= 3) s.three++;
        if (bandOf(n) > topBand) topBand = bandOf(n);
      } else allCleared = false;
    }
    var last = bandOf(LEVELS);
    for (b = 0; b < 5; b++) {
      st[b].passed = b < topBand || (b === last && cleared(LEVELS));
      // at least one level played, so an untouched band is never clean by vacancy
      st[b].clean = st[b].passed && st[b].played > 0 && st[b].three === st[b].played;
    }
    return { bands: st, allCleared: allCleared, allPerfect: perfect() };
  }

  /* The meta layer, when the game declares one. Resolved on every use rather
     than held: packages/webshell/meta.js is loaded AFTER this file — it reads
     the map back, not the other way round — so there is nothing to hold at
     load time. A game without it never enters any of the branches below and
     its map is exactly what it was. */
  function meta() {
    var m = window.__META__;
    return m && m.active() ? m : null;
  }

  /* ── 3b. FORCE — the map walked out of order, on this machine only ─── */

  /* A level is tuned by playing it, and reaching level 27 through the gates it
     sits behind is twenty-six rounds of warm-up. FORCE is the door round that,
     and it is three things and nothing more:

       - it only EXISTS locally. `LOCAL` is localhost, a loopback address, a
         `.local` host or a `file://` build — the switch is not built on a
         deployed site, so there is no flag in a URL that can turn it on there
         and nothing for a player to find.
       - it never touches the save, and it never lies about the board.
         `isOpen()` stays honest: the padlocks stay shut, a wall stays a wall,
         the card still reads *locked*. All the force changes is whether the
         button at the bottom is ALLOWED to start the round. A forced round
         then records its stars like any other — which is what makes it useful
         for tuning instead of a mode of its own.
       - it is OFF by default and remembered per machine (one key for the
         thirteen: it is a property of the desk, not of a game), so a session
         spent testing the gating is not fighting it.

     `?force=1` arms it for one load without writing anything, which is what a
     headless bench passes; `?force=0` disarms one load the same way. */
  var LOCAL = (function () {
    try {
      if (location.protocol === "file:") return true;
      var h = location.hostname;
      return h === "" || h === "localhost" || h === "127.0.0.1" ||
             h === "::1" || h === "[::1]" || /\.local$/.test(h);
    } catch (e) { return false; }
  })();
  var FORCE_KEY = "dev:force";
  var force = false;
  if (LOCAL) {
    var qf = null;
    try { qf = /[?&#]force=([01])\b/.exec(location.search + location.hash); } catch (e) {}
    force = qf ? qf[1] === "1" : !!W.Store.get(FORCE_KEY, 0);
  }

  /* The one thing the rest of the file asks: may this level be started even
     though the road has not reached it? */
  function canPlay(n) { return isOpen(n) || force; }

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
    var st = starsEarned(n, value);
    var goal = goalOf(dOf(n));

    result.stars = st;
    /* THE END SCREEN OF A LEVEL SAYS ONE OF TWO THINGS, and neither of them is
       the game's own flavour line. A round that met its objective is a SCORE
       being read — the stars, the coins and the stat rows are the whole
       screen, and "TORN APART" over them is a story about a viper that has
       nothing to do with a level having been cleared. A round that missed it
       is ALMOST: the same screen, one word, in red, because the only thing the
       player needs told is which side of the objective they landed on.

       The three-star round is ended by the LEVEL and not by the game losing,
       which is what made a game's own title a lie there first; the two other
       cases followed it once the screen became the doorway back to the map. */
    /* The variant is the COLOUR the motor gives the title, and a missed
       objective wants the one it paints by default: `.eo-title` with no
       variant at all is the red one (packages/shell/motor.css). */
    if (!st) { result.title = T.almost; result.variant = ""; }
    else { result.title = T.scores; result.variant = st === 3 ? "perfect" : "win"; }

    /* The objective is the first thing the end screen has to answer, and the
       column takes four rows before it overflows the frame — so it goes in at
       the top and the game's own last row makes way. */
    var rows = [{ label: T.objective, value: num(goal),
                  grade: st === 3 ? "gold" : st ? "accent" : "" }];
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
     thirteen fill it differently. It is the bottom-LEFT corner, mirroring the
     MENU and OPTIONS controls in the opposite one — the one corner eleven of
     the thirteen leave empty, and the only place it can be read at size.

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
    /* The pill's three stars are the map's, painted when the build has the
       artwork. They are written empty — the glyph is `.st s:empty::before`,
       so an <s> holding a picture drops it without a class of its own — and
       paintHud only ever toggles `on`. */
    var star = artOf("star", "lv-sti");
    hudBox.innerHTML =
      '<div class="top"><b class="n"></b><span class="st">' +
      "<s>" + star + "</s><s>" + star + "</s><s>" + star + "</s>" +
      '</span><i class="goal"></i></div>' +
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
    // The bar walks the raw bands and the stars are what they earn — the two
    // differ only for a game that caps them (see starsEarned).
    var raw = starsFor(n, value), st = starsEarned(n, value);
    var lo = raw === 0 ? 0 : raw === 1 ? g : g * 1.5;
    var hi = raw === 0 ? g : raw === 1 ? g * 1.5 : g * 2.2;
    var k = raw >= 3 ? 1 : Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
    hudFill.style.width = (k * 100).toFixed(1) + "%";
    hudGoal.textContent = num(Math.round(raw >= 3 ? value : hi));
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
     own update ease off together and the frame keeps rendering at 60. It also
     buys the time below: a game that schedules its own end (echomaze waits out
     its hero callout before calling endRound) is slowed with everything else,
     so the level layer stays the one that ends the round.

     THREE STARS IS THE LAST THING THE ROUND SAYS, and it is a `record` — the
     end-of-run peak, not one more milestone. It therefore WAITS for the game's
     own callouts to play out first: echomaze lands PERFECT READ! on the very
     frame the third star lights, and two hero callouts over one another read
     as neither. `Pop.pending()` is how long that takes; the wait is capped so
     a game that stacks several never leaves the player in slow motion. */
  var WIN_RAMP = 620, WIN_WAIT = 1600, WIN_HOLD = 1100, WIN_ENTER = 620;

  /* EASING THE WORLD OFF, one ramp shared by the three ways a round can end.
     It reads the rate it is starting from rather than assuming 1, so a second
     call lands on top of the first instead of snapping back up. */
  function slowTo(to, ms) {
    var t0 = performance.now(), from = W.Loop.rate();
    (function ramp(now) {
      var k = Math.min(1, ((now || performance.now()) - t0) / ms);
      W.Loop.rate(from + (to - from) * k * k);          // easing in
      if (k < 1) requestAnimationFrame(ramp);
    })(t0);
  }

  /* THE SHINE. Three stars is the one thing a level can pay that is worth a
     full-frame reaction, and it is gold from end to end: the frame flashes,
     two rings go out from the middle of the play area and the edges keep a
     glow for as long as the slow motion lasts. There is no confetti — that
     canvas lives inside #screen-end and is not over the round (see
     packages/webshell/meta.js on the same point). */
  function winBeat() {
    W.Fx.flash("#ffd43b", 0.5, 2.0);
    W.Fx.shake(9, 0.3);
    W.Fx.ring(W.view.w / 2, W.view.h / 2, { from: 20, to: 620, color: "#ffd43b", width: 12, life: 0.7 });
    W.Fx.ring(W.view.w / 2, W.view.h / 2, { from: 10, to: 420, color: "#ffffff", width: 6, life: 0.5 });
    W.Overlay.vignette("#ffd43b", 0.85);
    W.Music.duck(0.4, 0.35);
    W.Sound.cue("uiStar", 0.8, 1.5, 1180, 0.18, "triangle");
  }

  function winRound(value) {
    won = true;
    winBeat();

    // the world eases off straight away: that is the round stopping, not a word
    slowTo(0.12, WIN_RAMP);

    var wait = Math.min(W.Pop.pending ? W.Pop.pending() : 0, WIN_WAIT);
    setTimeout(function () {
      if (W.state() !== "playing") return;              // it died on the way down
      W.Pop.show("record", { word: T.threeStars, hold: WIN_HOLD });
      setTimeout(function () { finishWin(value); }, WIN_ENTER + WIN_HOLD);
    }, wait);
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

  /* ── 5c. the outro — the round's last word, before the end screen ─────── */

  /* A ROUND ENDS IN ONE OF THREE WAYS AND THE WORLD SAYS SO ITSELF. Until the
     motor grew `onOutro` (packages/shell/shell.js) the last frame of the round
     and the first of the end screen were the same frame, so everything a level
     had to say about how it went was said on a screen the world is no longer
     on. The outro is the beat in between: the clock is already stopped, the
     loop is still turning, and the end screen waits for `done`.

       three stars  the shine has already played (winRound) and the world is
                    held at a crawl while the BONUS is handed over — the three
                    boxes open over the round that earned them, not over a
                    score screen two beats later.
       one or two   slow motion and nothing else. The objective was met; there
                    is no ceremony owed, and a gold flash here would make a
                    scrape read like a maximum.
       none         the drama: the frame goes red, fire climbs the screen from
                    below and the world grinds down into it.

     Only a LEVEL has an outro. A free round and the endless run end the way
     they always did — there is no objective to have missed. */
  var OUT_RAMP = 480, CALM_RATE = 0.22, CALM_HOLD = 300;
  var LOSS_RATE = 0.16, LOSS_HOLD = 1150, BONUS_RATE = 0.14;

  /* The fire, spawned along the bottom edge of the frame and pulled UP by a
     negative gravity, so it accelerates away from the glass the way a flame
     does instead of arcing like a firework. Throttled to a puff every 60 ms:
     the motor caps its particle pool at 260 and a per-frame emitter would
     spend the whole budget in the first quarter of a second. */
  var FIRE = ["#ff3b1f", "#ff6b35", "#ffa62b", "#ffd43b"];
  var FIRE_GAP = 60;

  function flames(ms) {
    var t0 = performance.now(), lastPuff = -1e9;
    (function puff(now) {
      var t = (now || performance.now()) - t0;
      if (t > ms || W.state() !== "playing") return;
      if (t - lastPuff >= FIRE_GAP) {
        lastPuff = t;
        for (var i = 0; i < 4; i++) {
          W.Fx.burst(Math.random() * W.view.w, W.view.h + 18, {
            color: FIRE, count: 4, speed: 620, size: 13, life: 1.1,
            grav: -520, angle: -Math.PI / 2, spread: 0.9
          });
        }
      }
      requestAnimationFrame(puff);
    })(t0);
  }

  function lossBeat() {
    W.Fx.flash("#ff2d2d", 0.3, 2.6);
    W.Fx.shake(13, 0.45);
    W.Overlay.vignette("#ff2d2d", 0.92);
    W.Music.duck(0.3, 0.4);
    W.Sound.cue("uiScore", 0.7, 0.55, 200, 0.45, "sawtooth");
    flames(LOSS_HOLD);
  }

  /* The meta layer, when the game ships one. It is the only thing the outro
     hands the frame over to, and a game without it simply holds the beat. */
  function meta() {
    return (window.__META__ && window.__META__.active()) ? window.__META__ : null;
  }

  function outro(result, done) {
    if (!ON || !CONFIG.level) { done(); return; }
    var st = result.stars || 0;

    if (st >= 3) {
      /* The shine normally played on the frame the third star lit; a game that
         ended its own round on that same frame never went through winRound, so
         the beat is played here instead of being skipped. */
      var wait = 0;
      if (!won) { won = true; winBeat(); slowTo(BONUS_RATE, WIN_RAMP); wait = WIN_ENTER; }
      else W.Loop.rate(BONUS_RATE);
      var MT = meta();
      setTimeout(function () {
        if (MT && MT.bonus) MT.bonus(done);
        else done();
      }, wait);
      return;
    }

    if (st >= 1) {
      slowTo(CALM_RATE, OUT_RAMP);
      setTimeout(done, OUT_RAMP + CALM_HOLD);
      return;
    }

    lossBeat();
    slowTo(LOSS_RATE, OUT_RAMP);
    setTimeout(done, LOSS_HOLD);
  }

  if (ON && W.onOutro) W.onOutro(outro);

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
  var box, scroll, canvasBox, svg, card, totalBox, totalN
  var headBox, devBtn;
  /* HOW MUCH OF THE ROAD IS UNDER SOMETHING. The scroll band is the whole
     frame — the road runs beneath the header and beneath the card instead of
     being cut at their edge — so the two bands are margins on the canvas
     rather than insets on the viewport: the same gap at either end of the
     climb, with nothing clipped in between. Everything that centres a level
     measures the band from them (see scrollTo). */
  var padTop = 0, padBot = 246;
  var cTop, cName, cBand, cGoal, cNote, cChips, cDiff, cFlames, cPlay;
  var picked = 1;                 // a level number, or { road: index }

  /* A second tap on the node already selected starts it. The card's own button
     is still the only way in on a first touch — this is the shortcut for a
     player who knows where they are going, and it is counted here rather than
     read from `dblclick`, which a touch WebView does not always send.
     The SELECTION is the memory, not a stopwatch: the player reads the card
     the first tap opened, and the tap that follows starts the round however
     long that took. Every other way of moving the selection clears the arm
     (`select` below), so the node a tap starts is always the one the card is
     describing. */
  var tapOn = null;
  /* `null` is a real selection: nothing. A tap on the empty map lands here and
     the card goes away with it (`writeCard`). */
  function select(v) { tapOn = null; picked = v; writeCard(); }
  function tapped(n) {
    var again = tapOn === n && picked === n;
    tapOn = n; picked = n; writeCard();
    if (again) { tapOn = null; onPlay(); }
  }
  var built = false;

  /* What a forced button wears, so a screenshot of one is never mistaken for
     a level the board actually opened. Not player copy: it is only ever built
     on a local host. */
  var FORCED = "\u26a1 ";

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

    /* THE HEADER IS TWO ROWS. The first is navigation and what the player
       owns, and it reads the way a phone's status bar does: the way back on
       the left, the three numbers flush right. The second is the whole width,
       because the xp bar is a bar and a bar wants the room.

       There is no house. The back arrow is the only way out of this screen —
       the map IS the place a player comes back to, so a second control that
       leaves it was a control spending the one band a thumb never reaches. */
    var head = el("header"); head.id = "lv-head";
    headBox = head;
    var row = el("div"); row.id = "lv-hrow";
    head.appendChild(row);

    /* NOTHING IN THIS HEADER BUT THE COUNT, and on a game with a band not even
       that. It held the game's own name and "pick a level" under it — read on
       the title screen one tap ago — and then a home button, which the band's
       own level chip does better: it is first in the row, it is on every
       screen, and it is where the player is already looking. Where there is no
       band there is no level chip, and the button is the way home
       (packages/webshell/view.js). */
    if (!VW.banded()) row.appendChild(VW.homeButton(T.home));

    /* The counter's own star, and the TROPHY once the board is finished: at
       90/90 the number stops being a climb and becomes a result, so the piece
       in front of it changes with it. Repainted by writeTotal, which is the
       one place that knows the count.

       IT IS ONLY BUILT INTO THIS HEADER WHERE THERE IS NO BAND. With a wallet
       over the screen the stars are the band's last chip, beside the coins and
       the tickets — they are what the player owns on this game, and the map is
       where they come from, so the chip is the door back here from everywhere
       else (packages/webshell/meta.js). A game with no `web.meta` has no band
       at all, and then this is the only place the count can be. */
    totalBox = el("div"); totalBox.id = "lv-total";
    totalBox.appendChild(el("span", "g", artOf("star", "lv-tot-i") || "&#9733;"));
    totalN = el("span"); totalN.id = "lv-total-n";
    totalBox.appendChild(totalN);
    if (!meta()) row.appendChild(totalBox);

    /* NOTHING LEFT IN IT on a game with a band: no name, no home button, and
       the count is the band's last chip. The header is then the scrim under
       the band and nothing else, so it stops reserving a title's worth of
       height — `padTop` is measured off it and the road starts that much
       higher. */
    head.classList.toggle("bare", !row.firstChild);
    box.appendChild(head);

    /* The force switch (section 3b) — the one piece of this screen that is
       not the game. It is built on a local host and nowhere else, so there is
       no branch to take on a deployed site and nothing to hide. It sits over
       the foot of the map rather than in the header, which is four controls
       wide already. */
    if (LOCAL) {
      devBtn = el("button"); devBtn.id = "lv-dev";
      devBtn.addEventListener("click", function () {
        force = !force;
        W.Store.set(FORCE_KEY, force ? 1 : 0);
        writeDev();
        draw();
      });
      writeDev();
      box.appendChild(devBtn);
    }

    scroll = el("div"); scroll.id = "lv-scroll";
    canvasBox = el("div"); canvasBox.id = "lv-canvas";
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "lv-path");
    svg.setAttribute("preserveAspectRatio", "none");
    canvasBox.appendChild(svg);
    scroll.appendChild(canvasBox);
    /* A TAP IN THE EMPTY puts the card away. The card is a third of the frame
       and it is docked, so a player who wants to look at the road they are on
       — or at the scene behind it — has nowhere to put it. The target is
       tested rather than the coordinates: every node, wall and read-out is a
       child of the canvas, so "the event stopped HERE" is exactly "nothing was
       under the finger". The road itself is an svg with no pointer events, so
       tapping the line between two levels counts as empty too. */
    scroll.addEventListener("click", function (e) {
      if (e.target === scroll || e.target === canvasBox) select(null);
    });
    box.appendChild(scroll);

    /* The card is what the level SAYS on the left and how hot it is on the
       right: the words run in one column and the flames stand beside them,
       out of the way of a line that wraps. */
    card = el("section"); card.id = "lv-card";
    var body = el("div"); body.id = "lv-body";
    var main = el("div"); main.id = "lv-main";
    var top = cTop = el("div", "top");
    cName = el("div"); cName.id = "lv-name";
    cBand = el("div"); cBand.id = "lv-band";
    top.appendChild(cName); top.appendChild(cBand);
    cGoal = el("div"); cGoal.id = "lv-goal";
    cNote = el("div"); cNote.id = "lv-note";
    cChips = el("div"); cChips.id = "lv-chips";
    main.appendChild(top);
    main.appendChild(cGoal);
    main.appendChild(cNote);
    main.appendChild(cChips);
    cDiff = el("div"); cDiff.id = "lv-diff";
    cDiff.innerHTML = '<span class="lbl"></span><span class="flames"></span>';
    cFlames = cDiff.querySelector(".flames");
    body.appendChild(main);
    body.appendChild(cDiff);
    cPlay = el("button"); cPlay.id = "lv-play";
    cPlay.addEventListener("click", onPlay);
    card.appendChild(body);
    card.appendChild(cPlay);
    box.appendChild(card);

    $("frame").appendChild(box);
  }

  function writeDev() {
    if (!devBtn) return;
    devBtn.className = force ? "on" : "";
    devBtn.textContent = (force ? FORCED : "") + "FORCE " + (force ? "ON" : "OFF");
  }

  /* The same backdrop the menu is dressed with, in the same order: the painted
     screen the motor already carries, then a picture the game embeds itself,
     then the gradient its SKIN paints the page with. Copied as a background
     rather than moved — the menu is still behind this layer and keeps its own
     scene. */
  function dressBackdrop(bg) {
    /* Through Art rather than off CONFIG: a game whose scene changes per band
       has no plain `backgroundPhone` key at all, and Art is what resolves the
       default one (packages/shell/shell.js). The map keeps that default — it
       shows all thirty levels, so it belongs to no single band. */
    var art = W.Art ? W.Art.src(W.Art.sceneKey()) : (CONFIG.art && CONFIG.art.backgroundPhone);
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

  /* HOW HOT THE LEVEL IS — five flames, not a bar. Same `d` the tunables are
     lerped with, spread over 1..5 rather than 0..5: level 1 is a level, so it
     owns one flame, and only the last owns all five. A flame is FILLED up to
     the count, the one the remainder stops on is drawn as an outline in its
     own colour, and the rest are grey. The colours climb with the position
     (green, gold, red) the way the bar's gradient did, so the row reads at a
     glance from across the card. */
  var FLAMES = 5;

  function writeFlames(d) {
    var v = 1 + (d < 0 ? 0 : d > 1 ? 1 : d) * (FLAMES - 1);
    var out = "", i, cls;
    for (i = 1; i <= FLAMES; i++) {
      cls = v >= i ? "on" : v > i - 1 ? "half" : "off";
      out += '<span class="lv-fl f' + i + " " + cls + '">' +
             API.icon("flame", "fl-ico") + "</span>";
    }
    cFlames.innerHTML = out;
    cDiff.setAttribute("aria-label", T.difficulty + " " + Math.round(v) + "/" + FLAMES);
  }

  /* ONE STAR, and the only place this file draws one. A build that carries
     the shell's artwork (CONFIG.shellArt, a game with `web.meta`) paints it;
     every other build keeps the glyph, and the two are the same box either
     way, so nothing that measures a row of three has to know which it got.

     An unearned star is the SAME picture, drained — `.lv-stars s.off img`
     greys it. Drawing a second, empty piece would be a second file to ship
     and a second thing to keep in step. */
  /* The shell's own painted pieces (CONFIG.shellArt), read straight off CONFIG
     rather than through `API.art`: the round's pill is built from a state hook
     that can fire before mount() has handed the helpers over, and a pill that
     came up one frame early must not be the one screen stuck with glyphs. */
  function artOf(role, cls) {
    var src = CONFIG.shellArt && CONFIG.shellArt[role];
    if (!src) return "";
    return '<img class="' + (cls || "ico") + ' art-i" src="' + src +
           '" alt="" aria-hidden="true">';
  }

  function starArt(on) {
    return '<s class="' + (on ? "on" : "off") + '">' +
           (artOf("star", "lv-sti") || "&#9733;") + "</s>";
  }

  function starRow(s) {
    var out = '<span class="lv-stars">', i;
    for (i = 1; i <= 3; i++) out += starArt(i <= s);
    return out + "</span>";
  }

  function draw() {
    var full = perfect();
    geo = place(full);
    NEXT = frontier();

    canvasBox.style.height = geo.height + "px";
    /* The header's real height, insets included, measured rather than
       restated: it is the gap the climb starts under. */
    padTop = headBox ? headBox.offsetHeight : 0;
    canvasBox.style.marginTop = padTop + "px";
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
        return function () { select({ road: idx }); };
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
    tuto.addEventListener("click", function () { tapped(TUTO); });
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
      /* The endless node is a star, drawn by CSS as a clipped polygon. With
         the artwork it is the painted starburst instead — the one node on this
         map that is a reward rather than a level, so it wears the piece the
         daily road's starred day wears. */
      var face = '<span class="num">' + n + "</span>" + PADLOCK;
      if (n === BONUS) face = artOf("starBurst", "lv-bonus-i") || face;
      var node = API.el("button", "lv-node " + cls +
        (n === BONUS && artOf("starBurst") ? " art" : ""), face);
      node.style.left = pt.x + "px";
      node.style.top = pt.y + "px";
      node.addEventListener("click", (function (m) {
        return function () { tapped(m); };
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
    /* A finished board is not a bigger pile of stars, so the counter stops
       showing one. Nothing to swap in a build with no artwork — the glyph is
       the same glyph at 90 as at 12. */
    var piece = artOf(full ? "trophy" : "star", "lv-tot-i");
    if (piece) totalBox.firstChild.innerHTML = piece;
    writeCard();
  }

  /* ── 7b. the card, for a level or for a road ──────────────────────────── */

  function writeCard() {
    /* Nothing selected: the card is gone and the map gets the whole frame. */
    if (picked == null) {
      card.className = "off";
      padBot = 0;
      canvasBox.style.marginBottom = "0px";
      if (devBtn) devBtn.style.bottom = "16px";
      return;
    }
    if (picked && picked.road != null) roadCard(ROADS[picked.road]);
    else levelCard(picked);
    fitCard();
    padBot = card.offsetHeight;
    canvasBox.style.marginBottom = padBot + "px";
    /* The switch rides on the card's height like the scroll band does: a
       wall's card is twice a level's, and a pill over the top of it would be
       sitting on the explanation. */
    if (devBtn) devBtn.style.bottom = (card.offsetHeight + 16) + "px";
  }

  /* The card's three statements are ONE LINE EACH — a name, an objective, a
     note — and none of the three has a width anyone can write down: the
     objective is a sentence per game per language, the game's own face moves
     every width again (Orbitron's digits +24%, Bebas Neue -40%), and the room
     itself changes with the column of flames, which a wall's card hides. So
     they are `nowrap` in the stylesheet and measured here, shrunk until they
     fit the room they already have. The floors are what a line stops being
     worth reading under; nothing reaches them today. */
  function fitCard() {
    if (!W.Fit || !W.Fit.box) return;
    W.Fit.box(cTop, 24);                    // the row: the name and its band together
    W.Fit.box(cGoal, 18);
    W.Fit.box(cNote, 15);
  }

  function levelCard(n) {
    card.className = "";
    if (n === TUTO) return tutoCard();
    if (n === BONUS) return bonusCard();
    var d = dOf(n), rec = save.l[n], can = isOpen(n), go = canPlay(n);
    cName.textContent = up(T.level) + " " + n;
    cBand.textContent = bandName(n);
    cGoal.innerHTML = goalText(n);

    cNote.innerHTML = rec
      ? T.best + " <em>" + num(rec.b) + "</em> &middot; " +
        rec.s + "/3 " + T.starsOf + " &middot; " + rec.p + " " + T.tries
      : can ? (isGap(n) ? T.notTaken : T.never) : T.gatedHere;

    cChips.innerHTML = "";
    cDiff.style.display = "";
    cDiff.querySelector(".lbl").textContent = up(T.difficulty);
    writeFlames(d);

    /* A locked level the force opens keeps its note — the card says it is
       gated, and the button says it is going anyway. */
    cPlay.disabled = !go;
    cPlay.textContent = !can ? (go ? FORCED + (rec ? T.replay : T.play) : T.locked)
                       : rec ? T.replay : T.play;
  }

  /* Level 0 is not a level either: the button opens the Help panel instead of
     starting a round, and the card says out loud that skipping it costs
     nothing — a tutorial a player is made to read is a tutorial they skim. */
  function tutoCard() {
    card.className = "is-tuto";
    cName.textContent = up(T.level) + " 0";
    cBand.textContent = up(T.tutoBand);
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
    card.className = "is-endless";
    cName.textContent = up(T.endless);
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
    /* The band reads the real state and the body reads the reachable one: a
       forced wall still says *gated*, and still lists the road behind it. */
    var locked = roadShut(rd), shut = locked && !force;
    var have = totalStars(), short = rd.gate - have;
    card.className = "is-wall";
    /* `levelsEntry` is the plural — the menu entry's own word, rather than a
       second string saying the same thing. */
    cName.textContent = rd.len + " " + up(rd.len > 1 ? T.levelsEntry : T.level);
    cBand.textContent = up((rd.side < 0 ? T.roadL : T.roadR) + " · " +
      (rd.gate ? (locked ? T.gated : T.opened) : T.free));
    cDiff.style.display = "none";

    var i;

    /* A gate says one thing and nothing else: what it costs, and what the
       player is holding. The road it opens is drawn on the map already. */
    if (!shut) {
      /* A wall the force walked through still owes its stars, so it says what
         it wants rather than what it was paid. */
      cGoal.innerHTML = !rd.gate ? ""
        : locked ? fill(T.roadWants, { n: rd.gate, have: have, short: short })
        : fill(T.roadPaid, { n: rd.gate, have: have });
      cNote.innerHTML = "";
      var chips = "";
      for (i = 0; i < rd.nodes.length; i++) {
        var m = rd.nodes[i];
        chips += '<button data-lv="' + m + '">' + m +
          (played(m) ? " <s>" + starsOf(m) + "&#9733;</s>" : "") + "</button>";
      }
      cChips.innerHTML = chips;
      bindChips();
      cPlay.disabled = !canPlay(rd.entry);
      cPlay.textContent = (locked || !isOpen(rd.entry) ? FORCED : "") + T.takeRoad;
      return;
    }

    cGoal.innerHTML = fill(T.roadWants, { n: rd.gate, have: have, short: short });

    /* The cheapest stars to go back for: already cleared, short of three,
       easiest first. Naming them is the difference between a wall that
       explains itself and one that only says no. */
    var spare = [], n;
    for (n = 1; n <= LEVELS; n++)
      if (cleared(n) && save.l[n].s < 3) spare.push({ n: n, gain: 3 - save.l[n].s });
    spare.sort(function (a, b) { return dOf(a.n) - dOf(b.n); });
    var take = [], got = 0;
    for (i = 0; i < spare.length && got < short; i++) { take.push(spare[i]); got += spare[i].gain; }

    cNote.innerHTML = take.length ? T.findHere : T.playOn;
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
        return function () { select(+b.getAttribute("data-lv")); scrollTo(picked); };
      })(bs[i]));
    }
  }

  /* Centred in what the player can SEE — the frame less the header and less
     the card — and not in the scroll viewport, which is now the whole frame.
     The two are the same number they always were; only where they are
     subtracted moved. */
  function scrollTo(n) {
    var p = geo && geo.pts[n];
    if (p) scroll.scrollTop =
      Math.max(0, p.y - (scroll.clientHeight - padTop - padBot) / 2);
  }

  /* ── 7b bis. the help panel, over the map ─────────────────────────────── */

  /* THE HELP SCREEN IS THE SHELL'S ONE CARD, and this file no longer owns a
     copy of it. It used to: a panel of the title menu could not be raised over
     the map (`#screen-intro` is a stacking context of its own and the map sits
     above it), so level 0 built a second head, a second body and a second back
     arrow to say the same three things. Help is a MODAL now — over every view
     by construction — so opening it is one call into menu.js, which owns the
     wording and the motor's demo stage. */
  function openHelp() {
    if (!API.help) return;
    API.help();
    if (!tutoSeen()) { markTuto(); draw(); }     // the node stops being dashed
  }

  /* ── 7c. playing ──────────────────────────────────────────────────────── */

  function onPlay() {
    if (picked === TUTO) { openHelp(); return; }
    if (picked && picked.road != null) {
      var rd = ROADS[picked.road];
      // A shut wall's button goes to the cheapest star, not through the wall.
      // Unless the force is on, in which case it goes through the wall.
      var chip = cChips.querySelector("button");
      var stop = roadShut(rd) && !force;
      select(stop && chip ? +chip.getAttribute("data-lv") : rd.entry);
      scrollTo(picked);
      return;
    }
    play(picked);
  }

  /* startGame() unlocks the audio itself, and this runs inside the click that
     asked for the round, so the gesture is still the player's. */
  /* See `nextLevel` on the published object below for why it is `+ 1` and
     for the three ways it comes back 0. */
  function nextLevel() {
    if (!last) return 0;
    var n = last.level + 1;
    if (n > LEVELS) return 0;
    return canPlay(n) ? n : 0;
  }

  function play(n) {
    if (n !== BONUS && !canPlay(n)) return;
    arm(n);
    /* Down to the floor, and not just this screen: a round starts with nothing
       of the shell in front of it, whatever the player had opened on the way
       here. The state hook says the same thing again a beat later (menu.js),
       which is the belt to this one's braces. */
    VW.home();
    W.start();
  }

  /* ── 8. open / close ──────────────────────────────────────────────────── */

  /* WHAT THE VIEW SYSTEM CALLS, and it is the only thing this file does about
     being on screen: no class to add, no node to append, no decor to clear, no
     bed to duck and no back arrow to route. See packages/webshell/view.js. */
  function show() {
    /* On screen BEFORE anything is drawn: writeCard() insets the scroll band
       by the card's own height, and a card inside a `display:none` layer
       measures zero — which lets the map paint under it. */
    var MT = meta();
    /* Whatever the climb now owes the collection, paid on arrival as well as
       on the end screen: a milestone crossed by a run the player walked away
       from is still a milestone crossed. */
    if (MT) MT.sweep();
    /* …and whatever the last round's XP owes the player, which only this
       screen can pay: the map's header is the one wallet in the layer that
       carries a level bar. The bar runs, then the card for a level crossed.
       Called after `draw()` below would be a beat too late — it is queued on
       the frame the map appears, not on the frame it finishes painting. */
    /* A board nobody has played yet opens ON level 0 — the map scrolled to its
       foot, the card offering the lesson. It is still one tap to level 1, and
       every later arrival lands on the level the player is actually at. */
    tapOn = null;
    picked = perfect() ? BONUS
           : (!tutoSeen() && virgin()) ? TUTO
           : (frontier()[0] || LEVELS);
    draw();
    scrollTo(picked);
    if (MT) MT.arrive();
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
      /* THE MAP IS A VIEW, declared here and mounted by nobody: what this file
         hands over is the content — build it, paint it, stop it — and the view
         system owns the node's place in the stack, the class, the decor, the
         bed and the way back. */
      VW.define("map", {
        build: build,
        node: function () { return box; },
        show: show,
        /* The wallet band is up over the map, the album and the shop: the
           three screens where what the player owns is what they are looking
           at, or one tap from it. */
        hud: true,
        decor: { count: 2, spots: ["l", "r", "bl"], size: 140, opacity: 0.38, front: 0 }
      });
      dressPerfect();
    },

    setLang: function (code) {
      LANG = STRINGS[code] ? code : "en";
      T = STRINGS[LANG];
      if (VW.isOpen("map")) draw();
    },

    /* A game with several modes keeps its extra menu entries, and they start a
       FREE round rather than a level — the map belongs to the default mode.
       Clearing is what stops the level armed by the last round from following
       a mode launch: CONFIG.level is a field, not a screen. */
    clear: function () { if (ON) { CONFIG.level = 0; tune(null); } },

    open: function () { if (ON) VW.go("map"); },
    close: function () { if (VW.isOpen("map")) VW.back(); },
    isOpen: function () { return VW.isOpen("map"); },

    /* Everything the end screen needs to know about the round that just
       ended: which level it was and how many stars it paid, which is what
       decides whether the MAP or the REPLAY is the lit one (menu.js). */
    last: function () { return last; },
    replayLast: function () { if (last) play(last.level); },

    /* THE WAY ON, WITHOUT THE MAP. The end screen's third button, and it is
       the level after the one just finished — `last.level + 1` and nothing
       cleverer, because the map is where a FORK is chosen and this is the
       button for the player who is not choosing.

       It is 0 rather than a number in the three cases where there is no way
       on: no level was played at all (a free round, a mode), the round did
       not clear its objective so the next one is still shut (`canPlay`), or
       the level just finished was the LAST. Level 31 is the endless star and
       it belongs to the map — a board finished at 90/90 is a screen to be
       shown, not a round to be dropped into. menu.js hides the button on 0,
       which is also what keeps it out of the tab order. */
    nextLevel: nextLevel,
    playNext: function () { var n = nextLevel(); if (n) play(n); },

    text: function (key) { return T[key]; },
    perfect: function () { return ON && perfect(); },
    total: function () { return totalStars(); },
    /* What packages/webshell/meta.js reads the climb back through — the five
       bands and the two completions, nothing else. */
    bands: bandsState,
    bandTitle: bandTitle,
    max: function () { return MAX_STARS; },
    refreshVeil: dressPerfect,

    /* OPTIONS erases the whole save in one button — the best score, this
       climb and the meta layer's wallet — so this is the map's share of it,
       and the confirmation lives over there. */
    wipe: function () { wipe(); dressPerfect(); if (VW.isOpen("map")) draw(); }
  };
})();
