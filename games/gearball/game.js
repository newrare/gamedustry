  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Gearball",
    /* One sentence, and the stage below plays it: marbles queue behind a
       locked gate, the finger taps the padlock, the queue runs on and the
       electric marble drops into its socket. */
    tagline: "<b class=\"w-lock\">Unlock</b> the gates in time and move the <b class=\"w-sock\">socket</b> under the <b class=\"w-volt\">electric marble</b>",
    gameSeconds: 60,                 // one shift; losing every heart ends it sooner

    // Store links used by every CTA. The right one is picked at runtime from the
    // user agent. Until this game has a real listing all three point at the
    // newrare site, where the game can actually be played — never leave a
    // placeholder store URL here, it ships as a 404 on the device.
    storeUrl: {
      ios:     "https://newrare.app/#playables",
      android: "https://newrare.app/#playables",
      fallback:"https://newrare.app/#playables"
    },

    // Design resolution — all game logic and all DOM overlays use these units.
    designWidth: 720,
    designHeight: 1280,
    bg: "#0a0718",

    // The machine is fitted into the Layout whole, with one uniform scale.
    layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 26 },

    /* The painted gear hall stands behind the ROUND too: the machine's rails
       are drawn on their own dark bed, so they read over the picture, and the
       return circuits behind it are kept faint. render() asks Art.scene()
       before painting a ground of its own. */
    sceneArt: true,

    // A tap goes to the nearest locked gate or arrival: a gate opens, an
    // arrival becomes the socket. The switches are the machine's own. SPACE
    // opens the gate that is closest to overflowing; 1-6 move the socket to
    // the arrivals left to right, Q W E R T Y open the gates.
    intro: { logo: null, demo: "tap", caption: "",
             // on a desk: the mouse — a lock, then an arrival (shell.js, Demo)
             desk: [{ mouse: ["click"] }] },
    keyboard: true,

    /* The round's notices stay at the top, under the HUD: the foot of the
       frame is the arrivals, and nothing may stand over the socket the
       player is reading. The notice layer is pointer-transparent in a round,
       so a padlock under a notice still takes its tap. */

    hud: { score: true, timer: true },

    /* THE BED. One track, six windows of it, kept low under the machine's own
       clatter. Five are the round's, one per machine of the climb (the LAYOUTS
       of the GAME, in the same order), and the sixth is the slower one the
       menus sit on. The entry points are the track's own seams, measured and
       not guessed (see docs/MUSIC.md): 109 bpm, a bar of 2.202 s, a sixteen-bar
       intro, the body dropping at 35.25 s, breaks at 66 and 88, the climax
       from 118.9 to 145.3, the fade from 156.75. Every window is a whole
       number of bars. The intro sits 11 dB under the body already, so the
       menu keeps its full gain (as radiam's does). The last two overlap: the
       track has one climax, DEPTHS climbs into it and CLOCKWORK loops it.
       A playable has no level and no menu, so it ships the first window alone,
       a seam of pre-roll in front of it (CONFIG.music.cut). */
    /* `seam`: every window loops on the bar, two beats of crossfade ending on
       its downbeat (docs/MUSIC.md, The seam); `cut`: the playable's window,
       one seam of pre-roll into its embedded cut. */
    music: {
      volume: 0.10, fade: 1.8, seam: 1.1,
      cut: { from: 1.1, length: 30.82 },
      menu: { from: 0, length: 30.831, rate: 0.85, gain: 1 },
      biomes: [
        { from: 35.25,  length: 30.82 },   //  1-6   Workshop   bars  0-14
        { from: 66.08,  length: 17.609 },  //  7-12  Glassworks bars 14-22
        { from: 88.09,  length: 22.018 },  // 13-18  Maelstrom  bars 24-34
        { from: 110.11, length: 22.013 },  // 19-24  Depths     bars 34-44
        { from: 118.92, length: 26.428 }   // 25-30  Clockwork  bars 38-50
      ]
    },

    /* THE FIVE BIOMES, one per six levels, in the order of LAYOUTS and of
       music.biomes. Each is a PLACE, like echomaze's bands: `metal` is the
       colour the machine is made of there — rails, cogs, wheel, feed gear,
       chimes, tubes, gate posts, the return circuits — and every metal tone
       of section 6 is turned to its hue (tc), keeping its lightness. What
       is a RULE never moves: the marbles and the arrivals (violet, and the
       electric blue), the cyan of the current, the red of the sink and of a
       full queue, the amber lock and the green open gate. Every metal is
       picked off those hues. `scene` is the painted hall the round stands
       in — assets/image/master/gearball-background-phone-<biome>.png. They are
       web-only (tools/build/build.mjs, SCENE_SET): the game keeps a plain
       background-phone, which is what the playable, the intro and the end
       screen wear. */
    biomes: [
      { name: "Workshop",   metal: "#6f63ad", scene: "backgroundPhoneWorkshop" },   // violet steel, the game's own
      { name: "Glassworks", metal: "#5c86bc", scene: "backgroundPhoneGlassworks" },   // ice blue
      { name: "Maelstrom",  metal: "#6f9d58", scene: "backgroundPhoneMaelstrom" },   // moss green
      { name: "Depths",     metal: "#b56a4a", scene: "backgroundPhoneDepths" },   // copper
      { name: "Clockwork",  metal: "#ac5da5", scene: "backgroundPhoneClockwork" }    // orchid
    ],

    // All user-facing copy in one place.
    copy: {
      start:      "Tap to play",
      ctaBar:     "Install now",
      ctaEnd:     "Play the full game",
      replay:     "Replay the demo",
      scoreLabel: "Score",
      timeLabel:  "Time",
      endScore:   "Final score",
      gameOver:   "Out of hearts",
      timeUp:     "Shift over",
      perfect:    "Full power!",
      hintLock:   "Tap a lock to open its gate",
      hintVolt:   "Tap an arrival to move the socket under it",
      hintSpill:  "It rolls behind the machine to the red socket, and costs a heart",
      hintFuse:   "Open gates and catch the electric marble to keep the combo"
    },

    /* --- the marble machine -----------------------------------------------
       A feed gear pours marbles onto rails with real slope physics; four
       flip-flop switches, a notched wheel that merges the two inner lines,
       four gates and four receptacles. Every number here came off the
       prototype (prototype/marble-mix.html) and then a headless bench of the
       built game: see the tuning notes beside each group.

       THE PACE. Everything that makes the shift harder rises together over
       `rampSeconds`, linearly, and then holds: the rails' tempo, the pour, the
       lock rate and how many gates may be locked at once. The ramp is the
       shift — 60 s here, 3 to 10 minutes on the level map (web.levels.tune) —
       so the end of the shift is the hardest, whatever its length. */
    mix: {
      /* THE MACHINE. Each level of the map is its own layout (section 6,
         LAYOUTS), from one switch to six; a round with no level — the
         playable, a free round — plays the first machine of this biome
         (0 = the first biome). */
      playableBiome: 0,
      hearts: 5,                     // marbles the shift may shatter
      rampSeconds: 60,
      tempoStart: 0.9, tempoEnd: 1.6,     // time scale of the rails
      pourStart: 0.9, pourEnd: 0.24,      // seconds between two marbles
      gravity: 780,                  // px/s² along a slope
      friction: 55,                  // px/s² of rolling drag
      vMin: 110, vMax: 400,          // a marble never stalls and never flies off
      preview: 3,                    // marbles shown on their way down the feed gear

      /* THE ELECTRIC MARBLE. There is always one in play: the moment none
         is on the machine or on its way down the feed gear, the next marble
         of the pour is one — the first round's is the fourth marble. It must
         reach the SOCKET, the arrival the player last tapped. A card may add
         more on top, one every `eEvery` marbles (0: none). */
      electricEvery: 0, electricJitter: 3,
      classicScore: 10,              // x the combo multiplier
      electricScore: 150,            // x the combo multiplier
      electricJump: 5,               // what an electric on target adds to the combo

      /* THE COMBO lives on the wheel hub, and only the PLAYER feeds it: a
         gate opened is +1 per marble it releases (+1 for an empty one), an
         electric on target is `electricJump`. A delivered marble pays points
         and nothing else. The multiplier is its tier + 1.
         THE FUSE keeps it: a ring round the hub, refilled whole by every
         action that feeds the combo, burning down in `fuse[tier]` seconds —
         but only while there is something to do (a gate locked, the
         electric marble on its way to another arrival than the socket).
         Burnt out, the combo drops to the start of the tier below; a
         shatter, an overflow or a wasted electric still break it to 0. */
      /* Benched with a human-paced pilot against the old +1-per-marble
         combo: a player who answers within a second keeps ~95% of the old
         points a second (the stage objectives are unchanged), one who takes
         two seconds lets the fuse go out three to five times a shift. */
      tiers: [8, 25, 60],
      fuse: [4, 3, 2.2, 1.6],        // seconds the fuse burns, per tier

      /* THE LOCKS — the main verb. Gates are open; at random moments one
         locks, more often as the shift goes on, and more of them at once.
         `minOpen` is how long an unlocked gate is left alone. */
      lockFirst: 4.5,                // seconds before the first lock
      lockRate: 0.15,                // locks per second at the start...
      lockGain: 1.8,                 // ...plus this much by the end of the ramp
      lockMoreEvery: 0.4,            // one more gate may lock at once every this share of the ramp
      lockShare: 0.7,                // of the gates, how many may be locked at once, at most
      minOpenStart: 2.5, minOpenEnd: 0.5,
      flushGap: 0.14,                // seconds between two marbles of an unlock burst
      flushV: 230,                   // px/s a released marble leaves at
      waitCap: 5,                    // marbles a wheel entry holds
      tapReach: 200,                 // machine px: a tap farther from every target does nothing

      // Where a shift lands on the end screen (the web levels grade on their
      // own objective instead — see web.levels in the manifest).
      star2: 3800, star3: 6800
    },

    /* --- the upgrade cards (section 6, THE UPGRADE CARDS) -----------------
       An electric marble that reaches the socket while the socket is CHARGED
       stops the machine and deals two cards; the player takes one and the
       machine runs on. Then the socket recharges for `cooldown` seconds of
       the shift, and an electric delivered meanwhile is an ordinary payoff.
       A legendary card shortens the recharge, never under `minCooldown`. */
    cards: {
      cooldown: 30,                  // seconds of the shift between two picks
      minCooldown: 20,               // what the legendary cards can bring it down to
      pickDelay: 0.7,                // the payoff arc reaches the hub before the cards come
      heartsCap: 8,                  // spare hearts stop here (the HUD pill holds eight)
      weights: [0, 6, 3, 1, 0.6],    // common, rare, epic, legendary: how often each is dealt
      riskWeight: 3                  // a risk card, against those
    }
  };
  /* ===================================================================
     2. ASSETS — embedded base64 data URIs only (no network requests ever).
     Generate entries with tools/lab/embed-asset.mjs. Draw the graphics on canvas:
     every embedded byte counts against the 5 MB budget.

     SOUND EFFECTS ALWAYS COME FROM assets/audio/sfx/ — that shared library is the
     palette for every game, so the whole catalogue sounds like one product.
     Pick a clip per event, trim it to the useful part and re-encode it small,
     then embed it under a short game-side key:

       ffmpeg -i assets/audio/sfx/<clip>.mp3 -t 0.4 -ac 1 -ar 32000 -b:a 64k gem.mp3
       node tools/lab/embed-asset.mjs gem.mp3 --key gem

     Keep a comment naming the source clip next to every key (below), and pitch
     a single sample with Sound.clip(name, vol, rate) instead of embedding
     variations. Sound.beep / Sound.arp stay available, but only as a fallback
     for an event with no clip.
     =================================================================== */
  var ASSETS = {
    images: {
      // no logo: the painted logotype (gearball-title) hides the intro's app icon
      // The painted gear hall behind the machine
      // (assets/image/master/gearball-background.png), re-encoded 768x1280 JPEG:
      // the ground render() falls back to in a build without the painted scene.
      "bg": "data:image/jpeg;base64,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"
    },
    sounds: {
      // pop: "data:audio/mpeg;base64,SUQzBAAAAAA…"
      // assets/audio/music/gearball.mp3 — the playable's bed: one seam of
      // pre-roll, then the first biome's window (CONFIG.music.cut), looped on the bar by Music. The web
      // target swaps it for the whole track (web.music). Re-encoded mono 44.1 kHz / 64 kbps:
      //   ffmpeg -ss 34.15 -t 31.92 -i assets/audio/music/gearball.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3
      //   node tools/lab/embed-asset.mjs music.mp3 --key music
      "music": "data:audio/mpeg;base64,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",
      // No sfx clip here: every key the game plays is a role of the house kit,
      // mapped by `sfx` in manifest.json and injected by the builder.
    }
  };

  /* ===================================================================
     6. GAME — GEARBALL: the marble machine.

     A FEED GEAR POURS MARBLES INTO A MACHINE, and the player keeps it running.
     The marbles roll on rails with real slope physics — they pick up speed
     downhill, slow on the flat and crawl over the top of a loop — through
     FLIP-FLOP switches, a notched WHEEL that merges lines (its hub carries the
     combo), locking GATES, into coloured ARRIVALS at the bottom. What they
     drop into falls to a gutter and goes home up the screw tower in the back,
     into the feed gear, which is why the pour never runs dry.

     THE PLAYER DOES TWO THINGS, both with a tap on the nearest target:
       - a GATE is open until it LOCKS, at random moments and more and more
         often. A locked gate holds its marbles in visible slots that fill
         green to red, and shows a big pulsing padlock: a tap opens it and the
         queue runs out. A marble that reaches a FULL locked gate (or a full
         wheel entry) breaks the combo and drops through the TRAPDOOR past the
         last slot, onto the SPILL NETWORK behind the machine — back rails,
         loops, coils and cogs, decor all of it — which carries it to the red
         SINK, where it costs a HEART.
       - an ARRIVAL is a tap target too: the one tapped becomes the SOCKET.
         There is always one ELECTRIC marble in play, cyan and crackling, and
         only the socket takes it. The SWITCHES are the machine's own — each
         flips at every marble that passes it, its open way lit and its shut
         way barred — so the player reads where the electric marble is going
         and moves the socket under it. Caught, it pays big, an arc runs up
         the rails to the hub and the combo jumps; anywhere else it fizzles,
         the combo breaks and the lights go out for half a second.

     THE COMBO IS THE PLAYER'S TEMPO. Those two taps are the only things
     that feed it — a gate opened sends one spark per released marble flying
     to the hub, the electric's arc a jump — and the FUSE round the hub is
     what keeps it: every feed relights it, and it burns while the machine
     is waiting on the player. A player who answers fast holds the top tier;
     one who lets the fuse go out drops a tier. The bigger the combo, the
     louder the machine says so: the hub swells, the marbles leave trails,
     then sparks, then arcs between them, the rails light up, the frame
     glows in the tier's colour — and a big combo breaks in slow motion.

     THE MACHINE CHANGES WITH EVERY LEVEL. Each of the thirty levels is its
     own machine on its OWN SKELETON, built out of a library of track
     modules — zigzags, loops, corkscrews, coils, whirlpools that drain
     through their centre, glass tubes, dives that take a line behind the
     others and bring it back through a pipe mouth, ferry gears that carry a
     marble round their rim from one line to the next, and the moving ones:
     striped ZEBRA tubes a marble flickers through, accordion HOSES that join
     two modules that do not line up, JUMPS that throw it into a catcher,
     STAIRCASES that ring a note at every ledge, WAVES and copper BOOSTERS.
     The biome of the level map (six levels) sets the counts, which the pace
     is tuned on, and the metal:

       biome   levels   switches  gates  arrivals
       1       1-6      1         2      2
       2       7-12     2         3      3
       3       13-18    4         4      4
       4       19-24    5         5      5
       5       25-30    6         6      6

     A layout is a GRAPH — the feed gear, the switches, the wheel, the ferries, the arrivals,
     the channels between them — and every rule reads the graph, never a
     count: the route lighting, the payoff arc, the lock scheduler, the tap
     search and the pilots work the same on all thirty.

     Every machine is authored in its own 720 x 1280 space ("machine px") and
     fitted into the Layout by one uniform scale, so it never reaches under the
     HUD, the CTA bar or the web target's corner controls. Text painted on the
     machine is sized in DESIGN px through that scale, so the house floors
     hold whatever the scale is.
     =================================================================== */
  var Game = (function () {

    var M = CONFIG.mix;
    var PI2 = Math.PI * 2;

    /* ---------------- constants, in machine px ----------------------- */
    var MW = 720;
    var TOPY = 68, BOTY = 1170;     // the band that must stay inside the Layout
    var R = 14;                     // marble radius
    var DS = 5;                     // rails are resampled every DS px
    var RIM_Y = 1072, RAIL_END = 1076, CORE_Y = 1146;   // an arrival's mouth, and its core
    var TIERS_COL = ["#a99cc6", "#ffd43b", "#ff6fd8", "#fff3b0"];
    var ORBIT_SPARKS = [0, 4, 8, 14];
    var TIER_SPIN = 0.12;
    var FLIP_TIME = 0.09;
    var WHEEL_R = 70, RIM = WHEEL_R + 14, WHEEL_OMEGA = 1.8;
    var ARC_SPEED = 1700;
    // THE SURGE: when an electric marble's arc reaches the hub, the wheel
    // spins up to (1 + ZAP_SPIN) times its speed for ZAP_TIME seconds, lit
    // with lightning; the last ZAP_EASE seconds bring it back down.
    var ZAP_TIME = 3.2, ZAP_SPIN = 5, ZAP_EASE = 1.2;
    // A BOOSTER shoots a marble on at BOOST_K times the top speed and lets
    // no drag touch it for BOOST_TIME seconds of the machine's own time.
    var BOOST_K = 1.5, BOOST_TIME = 0.7;
    var GUTTER_SPEED = 220;
    var BG_ALPHA = 0.34;
    var SPILL_ALPHA = 0.2;         // the spill network's lines and cogs: depth, never a route
    // The arrivals wear the classic marble's violet, all of them; the one
    // the shift picks for the electric marble wears its electric blue. The
    // red is the sink's alone.
    var CLASSIC = "#b389ff";

    var C = {
      steel: "#6f63ad", steelD: "#2c2360", steelL: "#bdb3ee", chrome: "#ece8ff",
      text: "#f0f4ff", dim: "#a99cc6", ink: "#0b0720",
      volt: "#7ef9ff", voltHi: "#e8fdff", voltDeep: "#1a6f9e",
      amber: "#ffb44f", calm: "#6dffb0", full: "#ff3d6e", heart: "#ff5d86", gold2: "#ffe066"
    };
    var C0 = { steel: C.steel, steelD: C.steelD, steelL: C.steelL };

    /* THE BIOME'S METAL. Every metal tone below is written in the first
       biome's violet and passed through tc(), which turns it by the hue the
       biome's `metal` sits at against that violet and scales its saturation
       the same way, keeping its lightness — so a dark outline stays dark and
       a highlight stays a highlight, in copper as in ice. setBiome() moves
       it, in reset(); the cached rails, cogs and wheel are rebuilt for it. */
    var TINT = { dh: 0, ks: 1, key: "0" }, tintMemo = {};
    function hexHsl(hex) {
      var n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
      if (d) {
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h *= 60;
      }
      return [h, s, l];
    }
    function hslHex(h, s, l) {
      function f(n) {
        var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
        var v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return ("0" + Math.round(v * 255).toString(16)).slice(-2);
      }
      h = ((h % 360) + 360) % 360;
      return "#" + f(0) + f(8) + f(4);
    }
    function tc(hex) {
      var v = tintMemo[hex], c;
      if (v) return v;
      c = hexHsl(hex);
      return (tintMemo[hex] = TINT.dh || TINT.ks !== 1 ? hslHex(c[0] + TINT.dh, Math.min(1, c[1] * TINT.ks), c[2]) : hex);
    }
    function tca(hex, a) { return rgba(tc(hex), a); }
    function setBiome(b) {
      var base = hexHsl(CONFIG.biomes[0].metal), m = hexHsl(CONFIG.biomes[b].metal);
      TINT.dh = m[0] - base[0]; TINT.ks = m[1] / base[1]; TINT.key = String(b); tintMemo = {};
      C.steel = tc(C0.steel); C.steelD = tc(C0.steelD); C.steelL = tc(C0.steelL);
    }

    /* ===============================================================
       THE MODULE LIBRARY — a track is a list of points [x, y, depth,
       skin, mouth]. Depth 1 is the front plane, below 0 the rail runs behind
       the machine (smaller, dimmer, under every front rail); `skin` is what
       the segment ending at a point is made of (SK below); `mouth` marks a
       pipe mouth, where a line dives or resurfaces.

       A skin other than the plain rail is never where a queue may stand: a
       gate, its trapdoor and a wheel entry's queue sit on plain front rail.
       =============================================================== */
    var SK_RAIL = 0,                // two chrome rails on their sleepers
        SK_GLASS = 1,               // a glass tube: the marble is seen all the way
        SK_ZEBRA = 2,               // a striped tube: seen through every other band
        SK_HOSE = 3,                // a dark ribbed hose: hidden, the tube swells round it
        SK_AIR = 4;                 // nothing under it: a jump's flight, a stair's ledges
    function Track(x, y) {
      this.p = [[x, y, 1, 0, 0]];
      this.z = 1; this.g = 0; this.m = 0; this.bowls = [];
      this.mods = [];     // the loops and spirals (module prizes, CARD_FX), the landings, the notes, the boosters
      this.props = [];    // what is drawn beside the line: catchers, ledges, booster coils
    }
    Track.prototype.last = function () { return this.p[this.p.length - 1]; };
    Track.prototype.put = function (x, y, z) {
      var l, dx, dy, L;
      if (this.m) {
        // a pending mouth: the depth steps right past it, so the collar hides the step
        l = this.last(); dx = x - l[0]; dy = y - l[1]; L = Math.sqrt(dx * dx + dy * dy) || 1;
        l[4] = 1;
        this.p.push([l[0] + dx / L * 9, l[1] + dy / L * 9, this.z, this.g, 0]);
        this.m = 0;
      }
      this.p.push([x, y, z === undefined ? this.z : z, this.g, 0]);
      return this;
    };
    Track.prototype.to = function (x, y) { return this.put(x, y); };
    Track.prototype.glass = function (on) { this.g = on ? 1 : 0; return this; };
    // A dive: the line goes into a pipe mouth and runs on behind the machine...
    Track.prototype.under = function () { this.z = -1; this.m = 1; return this; };
    // ...and comes back to the front through another.
    Track.prototype.over = function () { this.z = 1; this.m = 1; return this; };
    // A zigzag to (x, y): n teeth either side of the straight line.
    Track.prototype.zig = function (x, y, n, amp) {
      var l = this.last(), x0 = l[0], y0 = l[1], dx = x - x0, dy = y - y0, L = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / L, ny = dx / L, i, k, s;
      for (i = 1; i < 2 * n; i++) {
        k = i / (2 * n); s = (i % 2 ? 1 : -1) * amp;
        this.put(x0 + dx * k + nx * s, y0 + dy * k + ny * s);
      }
      return this.put(x, y);
    };
    // A vertical loop: up, over and out where it went in. `dir` is +1 when
    // the marble travels rightward at the bottom of the loop, -1 leftward.
    Track.prototype.loop = function (r, dir) {
      var l = this.last(), cx = l[0], cy = l[1] - r, i, a;
      for (i = 1; i <= 60; i++) { a = Math.PI / 2 - dir * i / 60 * PI2; this.put(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
      this.mods.push({ kind: "loop", x: cx, y: cy - r });       // the top of the loop
      return this;
    };
    // A corkscrew (vrille) to (x, y): the rail winds round the line of travel,
    // `turns` whole times, `r` either side of it; the far half runs behind.
    Track.prototype.cork = function (x, y, turns, r) {
      var l = this.last(), x0 = l[0], y0 = l[1], dx = x - x0, dy = y - y0, L = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / L, ny = dx / L, n = Math.round(turns * 28), i, k, a;
      for (i = 1; i <= n; i++) {
        k = i / n; a = k * turns * PI2;
        this.put(x0 + dx * k + nx * r * Math.sin(a), y0 + dy * k + ny * r * Math.sin(a), Math.cos(a));
      }
      this.z = 1;
      this.mods.push({ kind: "spiral", x: x, y: y });
      return this;
    };
    // A coil down to y1: a helix seen from slightly above, the far half behind.
    Track.prototype.coil = function (y1, r, turns) {
      var l = this.last(), cx = l[0], y0 = l[1], n = Math.round(turns * 48), i, a;
      for (i = 1; i <= n; i++) {
        a = i / n * turns * PI2;
        this.put(cx + r * Math.sin(a), y0 + (y1 - y0) * i / n + r * 0.35 * (Math.cos(a) - 1), Math.cos(a));
      }
      this.z = 1;
      l = this.last(); this.mods.push({ kind: "spiral", x: l[0], y: l[1] });
      return this;
    };
    /* A whirlpool (tourbillon): a funnel seen from slightly above. The marble
       comes in on its rim, spirals in `turns` times down to r1, then drops
       through the drain in the centre and runs on BEHIND the machine — the
       caller brings it back with .over(). The bowl is drawn with the front
       rails, so the drop is hidden by it. */
    Track.prototype.whirl = function (cx, cy, r0, r1, turns, dir) {
      var l = this.last(), a0 = Math.atan2((l[1] - cy) / 0.5, l[0] - cx), n = Math.round(turns * 44), i, k, a, r;
      for (i = 1; i <= n; i++) {
        k = i / n; a = a0 + dir * k * turns * PI2; r = r0 + (r1 - r0) * k;
        this.put(cx + r * Math.cos(a), cy + r * 0.5 * Math.sin(a) + k * 12);
      }
      this.bowls.push({ cx: cx, cy: cy, r: r0 });
      l = this.last(); this.mods.push({ kind: "spiral", x: l[0], y: l[1] });
      this.put(cx, cy + 14);
      return this.under();
    };
    // A striped tube (zebra): opaque bands and glass windows by turns, so a
    // marble flickers in and out of sight; an electric one glows through.
    Track.prototype.zebra = function (on) { this.g = on ? SK_ZEBRA : SK_RAIL; return this; };
    // The line's heading at its last point, as a unit vector (down when unknown).
    Track.prototype.heading = function () {
      var n = this.p.length, a = this.p[Math.max(0, n - 2)], b = this.p[n - 1], dx = b[0] - a[0], dy = b[1] - a[1];
      var L = Math.sqrt(dx * dx + dy * dy);
      return L ? [dx / L, dy / L] : [0, 1];
    };
    /* A HOSE (soufflet) to (x, y): a dark ribbed rubber hose that leaves along
       the line's own heading and arrives heading `deg` (the way the marble
       travels, 90 = straight down), a smooth curve between. It is the joint
       between two modules that do not line up: the marble is hidden inside
       and the hose swells where it passes. */
    Track.prototype.hose = function (x, y, deg) {
      var l = this.last(), x0 = l[0], y0 = l[1], h = this.heading(), a = (deg == null ? 90 : deg) * Math.PI / 180;
      var D = Math.sqrt((x - x0) * (x - x0) + (y - y0) * (y - y0)), k = D * 0.42;
      var c1x = x0 + h[0] * k, c1y = y0 + h[1] * k, c2x = x - Math.cos(a) * k, c2y = y - Math.sin(a) * k;
      var n = Math.max(6, Math.round(D / 10)), g0 = this.g, i, s, u;
      this.g = SK_HOSE;
      for (i = 1; i <= n; i++) {
        s = i / n; u = 1 - s;
        this.put(u * u * u * x0 + 3 * u * u * s * c1x + 3 * u * s * s * c2x + s * s * s * x,
                 u * u * u * y0 + 3 * u * u * s * c1y + 3 * u * s * s * c2y + s * s * s * y);
      }
      this.g = g0;
      return this;
    };
    /* A JUMP (tremplin) to (x, y): the rail curls up into a kicker and stops;
       the marble flies a parabola that leaves the lip at `deg` degrees above
       the horizontal (35 unless told) and lands in a CATCHER at (x, y) — a
       scoop with a high back wall — where the line goes on. Nothing is drawn
       under the flight. Write the run before it downhill, so the marble
       arrives with speed. */
    Track.prototype.jump = function (x, y, deg) {
      var l = this.last(), x0 = l[0], y0 = l[1], dir = x >= x0 ? 1 : -1, RK = 64, i, f;
      var lip = (deg || 35) * Math.PI / 180;
      for (i = 1; i <= 6; i++) {
        f = lip * i / 6;
        this.put(x0 + dir * RK * Math.sin(f), y0 - RK * (1 - Math.cos(f)));
      }
      l = this.last();
      this.props.push({ k: "kick", x: x0, y: y0, dir: dir, rk: RK, lip: lip });
      var xl = l[0], yl = l[1], span = Math.abs(x - xl), n = Math.max(8, Math.round(span / 9)), s, g0 = this.g;
      // the sag that makes the flight leave the lip along it
      var h = ((y - yl) + Math.tan(lip) * span) / 4;
      this.g = SK_AIR;
      for (i = 1; i <= n; i++) { s = i / n; this.put(xl + (x - xl) * s, yl + (y - yl) * s - 4 * h * s * (1 - s)); }
      this.g = g0;
      this.props.push({ k: "catch", x: x, y: y, dir: dir });
      this.mods.push({ kind: "land", x: x, y: y });
      return this;
    };
    /* A STAIRCASE (escalier) to (x, y): `n` ledges, the marble rolls along
       each and hops down onto the next, and every landing rings a note, a
       scale down the stairs. The stairs need some width: a ledge is about
       half a step across. */
    Track.prototype.steps = function (x, y, n) {
      var l = this.last(), x0 = l[0], y0 = l[1], dx = (x - x0) / n, dy = (y - y0) / n, dir = dx >= 0 ? 1 : -1;
      var i, j, s, ax, ay, ex, ey, g0 = this.g, run = 0.5, HOP = 12;
      this.g = SK_AIR;
      for (i = 0; i < n; i++) {
        ax = x0 + dx * i; ay = y0 + dy * i;
        ex = ax + dx * run; ey = ay + 3;
        this.put(ex, ey);
        this.props.push({ k: "ledge", x0: ax - dir * (R + 6), x1: ex + dir * 6, y: ay + R + 1 });
        for (j = 1; j <= 6; j++) {
          s = j / 6;
          this.put(ex + (ax + dx - ex) * s, ey + (ay + dy - ey) * s - 4 * HOP * s * (1 - s));
        }
        this.mods.push({ kind: "note", x: ax + dx, y: ay + dy, n: i });
      }
      this.props.push({ k: "ledge", x0: x - dir * (R + 6), x1: x + dir * (R + 10), y: y + R + 1 });
      this.g = g0;
      return this;
    };
    // A WAVE (bosses) to (x, y): `n` smooth humps `amp` high over the straight
    // line, which the marble crawls up and runs down.
    Track.prototype.wave = function (x, y, n, amp) {
      var l = this.last(), x0 = l[0], y0 = l[1], m = n * 16, i, k;
      for (i = 1; i <= m; i++) {
        k = i / m;
        this.put(x0 + (x - x0) * k, y0 + (y - y0) * k - amp * (1 - Math.cos(k * n * PI2)) / 2);
      }
      return this;
    };
    /* A BOOSTER to (x, y): a straight run through three copper coils. A
       marble through the middle one is shot on at full speed, faster than
       any slope gives it, and keeps it a moment. */
    Track.prototype.boost = function (x, y) {
      var l = this.last(), x0 = l[0], y0 = l[1], i;
      for (i = 1; i <= 3; i++) this.props.push({ k: "coil", x: x0 + (x - x0) * i / 4, y: y0 + (y - y0) * i / 4,
                                                  a: Math.atan2(y - y0, x - x0) });
      this.put(x, y);
      this.mods.push({ kind: "boost", x: (x0 + x) / 2, y: (y0 + y) / 2 });
      return this;
    };
    /* Everything from point `from` on runs BEHIND the machine, whatever
       depth the modules gave it — a coil's near half included. This is the
       spill network's plane: a line a lost marble rides, never one the
       player reads. The point before `from` keeps its depth, so a drain
       still starts on the front rail it falls out of. */
    Track.prototype.behind = function (from) {
      for (var i = from || 0; i < this.p.length; i++) this.p[i][2] = -1;
      this.z = -1;
      return this;
    };
    // The mirror image of a track about x = 330 (the machines' axis).
    function mirrorPts(tr) {
      var o = [], i, q;
      for (i = 0; i < tr.p.length; i++) { q = tr.p[i]; o.push([660 - q[0], q[1], q[2], q[3], q[4]]); }
      var t2 = new Track(0, 0); t2.p = o;
      for (i = 0; i < tr.bowls.length; i++) t2.bowls.push({ cx: 660 - tr.bowls[i].cx, cy: tr.bowls[i].cy, r: tr.bowls[i].r });
      for (i = 0; i < tr.mods.length; i++) t2.mods.push({ kind: tr.mods[i].kind, x: 660 - tr.mods[i].x, y: tr.mods[i].y, n: tr.mods[i].n });
      for (i = 0; i < tr.props.length; i++) {
        q = tr.props[i];
        t2.props.push({ k: q.k, x: 660 - q.x, y: q.y, dir: -q.dir, x0: 660 - q.x0, x1: 660 - q.x1, a: Math.PI - q.a });
      }
      return t2;
    }
    function T(x, y) { return new Track(x, y); }

    /* ===============================================================
       THE THIRTY MACHINES, one per level. BASE5 holds the first machine of
       each biome (levels 1, 7, 13, 19, 25, the playable plays the first);
       LAYOUTS lists all thirty in level order. Coordinates are machine px. `sw` are the switches
       (with the way each lies at the start), `wheel` the merge with its
       entries (incoming channel -> the angle it boards at) and its way out,
       `arr` the arrivals (their x), `ch` the channels —
       `to` is a switch, "wheel" or an arrival, and `out` names each switch's
       two branches, left first. A gate is placed at the channel point nearest
       `at`, its queue running back up the line, and its padlock hangs at `p`.

       Behind the front plane, the SPILL NETWORK (see buildSpill): `drains`
       (one per queue, gate or wheel entry — D below), `back` lines they run
       into, the `sink` they all end in, and the `cogs` turning behind them.
       It is decor that costs a heart, so it may loop, coil and wander, and
       it passes under the front lines as it pleases.

       EVERY MACHINE IS ITS OWN SKELETON — where the wheel stands, which way
       the marbles flow, how the switches chain — so a new level is a new
       place and not the last one with more floors; a biome sets only the
       counts (switches / gates / arrivals) and the metal. Every layout is checked
       by the bench (lab/gearball-modules.html, Machines): tap targets 165
       machine px apart, padlocks clear of the rails, queues and trapdoors
       on plain front rail, every queue drained to the sink, every switch a
       real choice.
       =============================================================== */
    var H0 = [650, 152];            // where the feed gear lays a marble, the same on every machine
    /* A drain: from the trapdoor (x, y) of queue `q` ("gate:<n>" or
       "wheel:<entry>"), it dives at once, runs through `pts`, and `more`
       may add modules after them; it ends in `into` (a back line, or the
       sink, whose mouth is then its last point). */
    function D(q, into, pts, more) {
      return { q: q, into: into, tr: function (x, y) {
        var t = T(x, y).under(), i;
        for (i = 0; i < pts.length; i++) t.to(pts[i][0], pts[i][1]);
        return more ? more(t) : t;
      } };
    }
    /* A FERRY GEAR (`fer`): a cog standing between two lines. The line whose
       `to` is "fer:<k>" ends on its rim at the angle `from` (degrees); a
       marble waits there for the next free pocket, rides the rim to the
       angle `to` — clockwise on screen when `to` is the larger, the other way
       when it is the smaller — and is laid on the line `out`, which starts
       there. It holds a marble back for the length of the ride and fills a
       stretch of the machine no line crosses. ferPt(f, deg) is a point of
       its rim, which is how both lines are written to meet it. */
    function ferPt(f, deg) { var a = deg * Math.PI / 180; return [f.cx + f.r * Math.cos(a), f.cy + f.r * Math.sin(a)]; }
    var BASE5 = [
      /* 1 · WORKSHOP — THE TRAVERSE. One long line crosses the machine from
         the feed gear to a wheel standing high on the LEFT, boarding it from
         above; one switch under it sends a marble left, round a loop, or all
         the way right, where a big ferry gear lifts it over the middle of the
         machine and lays it on a coil. One decision at a time. */
      function () {
        var f0 = { cx: 420, cy: 640, r: 90, n: 12, from: 110, to: 380, out: "S0R2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [200, 680, 0] },
          wheel: { cx: 200, cy: 420, notches: 10, entries: { top: -Math.PI / 2 }, out: "wout" },
          arr: [{ id: "a0", x: 95 }, { id: "a1", x: 530 }],
          out: { S0: ["S0L", "S0R"] },
          ch: {
            top:  { to: "wheel", tr: T(H0[0], H0[1]).to(600, 185).to(300, 270).to(240, 300).to(205, 330).to(200, 350) },
            wout: { to: "S0", tr: T(200, 490).to(200, 680) },
            S0L:  { to: "a0", tr: T(200, 680).to(225, 780).to(245, 880).to(230, 895).to(170, 895).loop(38, -1)
                                   .to(105, 895).to(95, 960).to(95, RAIL_END) },
            S0R:  { to: "fer:0", tr: T(200, 680).to(300, 722).to(i0[0], i0[1]) },
            S0R2: { to: "a1", tr: T(o0[0], o0[1]).to(518, 740).to(520, 800).coil(985, 40, 2).to(530, RAIL_END) }
          },
          gates: [{ ch: "top", at: [420, 236], cap: 5, p: [470, 330] },
                  { ch: "wout", at: [200, 660], cap: 3, p: [330, 500] }],
          chimes: [["top", 470, 222], ["top", 255, 292], ["S0R2", 516, 730], ["S0L", 238, 830]],
          sink: [330, 985],
          back: {
            trunk: { to: "sink", tr: T(560, 300).to(630, 360).to(660, 470).coil(720, 36, 2).to(600, 790).to(430, 900).to(330, 985) }
          },
          drains: [D("gate:0", "trunk", [[585, 240], [560, 300]]),
                   D("wheel:top", "trunk", [[400, 320], [500, 330], [560, 300]]),
                   D("gate:1", "sink", [[240, 610], [290, 720], [270, 840], [330, 985]])],
          cogs: [[640, 590, 52, 1], [585, 650, 26, -1], [420, 840, 30, 1]]
        };
      },
      /* 2 · GLASSWORKS — THE CASCADE. The first switch splits high: left, a
         tall glass tube falls down the machine to a second switch; right, a
         short run boards a wheel standing LOW on the right, whose way out is
         an arrival of its own. Two switches, three arrivals. The left line
         reaches its glass through a ferry gear in the middle of the machine. */
      function () {
        var f0 = { cx: 370, cy: 430, r: 70, n: 10, from: 300, to: 135, out: "S0L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [430, 270, 0], S1: [180, 740, 0] },
          wheel: { cx: 520, cy: 600, notches: 12, entries: { S0R: -Math.PI / 2 }, out: "wout" },
          arr: [{ id: "a0", x: 80 }, { id: "a1", x: 300 }, { id: "a2", x: 570 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 180).to(430, 270) },
            S0L:  { to: "fer:0", tr: T(430, 270).to(414, 320).to(i0[0], i0[1]) },
            S0L2: { to: "S1", tr: T(o0[0], o0[1]).glass(1).zig(262, 570, 2, 18).glass(0).to(225, 630).to(198, 690).to(180, 740) },
            S0R:  { to: "wheel", tr: T(430, 270).to(510, 320).to(550, 400).to(520, 530) },
            wout: { to: "a2", tr: T(520, 670).to(532, 800).to(560, 880).cork(570, 1000, 1, 12).to(570, RAIL_END) },
            S1L:  { to: "a0", tr: T(180, 740).to(120, 800).glass(1).zig(80, 1000, 2, 18).glass(0).to(80, RAIL_END) },
            S1R:  { to: "a1", tr: T(180, 740).to(250, 800).to(300, 860).glass(1).zig(300, 1000, 2, 20).glass(0).to(300, RAIL_END) }
          },
          gates: [{ ch: "top", at: [500, 233], cap: 4, p: [620, 330] },
                  { ch: "S0L2", at: [198, 690], cap: 3, p: [70, 520] },
                  { ch: "wout", at: [531, 790], cap: 3, p: [380, 820] }],
          chimes: [["top", 520, 222], ["S0R", 545, 380], ["wout", 548, 850], ["S1R", 270, 830]],
          sink: [430, 985],
          back: {
            trunk: { to: "sink", tr: T(630, 230).to(670, 330).coil(560, 30, 2).to(650, 700).to(600, 800).to(500, 900).to(430, 985) }
          },
          drains: [D("gate:0", "trunk", [[630, 230]]),
                   D("wheel:S0R", "trunk", [[600, 450], [660, 520]]),
                   D("gate:1", "sink", [[260, 640], [300, 760]], function (t) { return t.to(330, 860).loop(28, 1).to(380, 900).to(430, 985); }),
                   D("gate:2", "sink", [[490, 760], [450, 880], [430, 985]])],
          cogs: [[620, 760, 40, 1], [665, 812, 22, -1], [350, 950, 28, 1]]
        };
      },
      /* 3 · MAELSTROM — THE STAIRCASE. Switches step down the machine from
         right to left and back: the wheel stands right of centre and takes a
         line from each side, the far left falls into a WHIRLPOOL, the far
         right down a coil, and the last switch splits at the bottom left,
         reached through a ferry gear that carries the marble over its top. */
      function () {
        var f0 = { cx: 300, cy: 800, r: 60, n: 8, from: 20, to: -200, out: "S2L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [470, 330, 0], S1: [250, 420, 1], S2: [420, 830, 0], S3: [260, 930, 0] },
          wheel: { cx: 420, cy: 610, notches: 8, entries: { S1R: Math.PI, S0R: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 60 }, { id: "a1", x: 150 }, { id: "a2", x: 340 }, { id: "a3", x: 600 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(610, 195).to(560, 240).to(470, 330) },
            S0L:  { to: "S1", tr: T(470, 330).to(390, 350).to(310, 380).to(250, 420) },
            S0R:  { to: "wheel", tr: T(470, 330).to(560, 400).to(575, 500).to(540, 570).to(490, 610) },
            S1L:  { to: "a0", tr: T(250, 420).to(160, 460).to(100, 520).to(80, 600).to(58, 700)
                                   .whirl(110, 700, 52, 14, 1.75, -1).to(105, 810).over().to(95, 840).to(60, RAIL_END) },
            S1R:  { to: "wheel", tr: T(250, 420).to(300, 480).to(290, 560).to(350, 610) },
            wout: { to: "S2", tr: T(420, 680).to(420, 830) },
            S2L:  { to: "fer:0", tr: T(420, 830).to(i0[0], i0[1]) },
            S2L2: { to: "S3", tr: T(o0[0], o0[1]).to(250, 880).to(260, 930) },
            S2R:  { to: "a3", tr: T(420, 830).to(500, 870).to(580, 900).coil(1040, 34, 2).to(600, RAIL_END) },
            S3L:  { to: "a1", tr: T(260, 930).to(200, 985).to(150, 1030).to(150, RAIL_END) },
            S3R:  { to: "a2", tr: T(260, 930).to(320, 985).to(340, RAIL_END) }
          },
          gates: [{ ch: "top", at: [530, 270], cap: 4, p: [640, 330] },
                  { ch: "S0L", at: [330, 372], cap: 4, p: [300, 250] },
                  { ch: "S1L", at: [82, 595], cap: 4, p: [210, 600] },
                  { ch: "wout", at: [420, 810], cap: 3, p: [580, 720] }],
          chimes: [["top", 590, 212], ["S0R", 570, 450], ["S1R", 295, 520], ["S2L2", 248, 872], ["S0L", 390, 350]],
          sink: [470, 990],
          back: {
            trunk: { to: "sink", tr: T(640, 260).to(665, 340).coil(560, 28, 3).to(640, 640).to(620, 760).to(520, 900).to(470, 990) },
            spine: { to: "sink", tr: T(300, 640).to(330, 760).to(360, 860).loop(30, 1).to(420, 930).to(470, 990) }
          },
          drains: [D("gate:0", "trunk", [[640, 260]]),
                   D("wheel:S0R", "trunk", [[610, 560], [640, 640]]),
                   D("gate:1", "spine", [[420, 420], [340, 520], [300, 640]]),
                   D("wheel:S1R", "spine", [[260, 560], [300, 640]]),
                   D("gate:2", "spine", [[170, 560], [230, 610], [300, 640]]),
                   D("gate:3", "spine", [[380, 760], [335, 770]])],
          cogs: [[650, 450, 46, 1], [600, 485, 22, -1], [160, 880, 36, 1]]
        };
      },
      /* 4 · DEPTHS — THE BRAID. A tree that crosses itself: the two inner
         lines swap sides on their way to the wheel, one DIVING under the
         other, and the far left runs through a tunnel behind the machine to
         a switch of its own. The wheel stands low, the right side zigzags
         down alone, and the far left's second way rides a ferry gear. */
      function () {
        var f0 = { cx: 215, cy: 850, r: 55, n: 8, from: 200, to: 470, out: "S4R2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [370, 240, 0], S1: [180, 400, 1], S2: [560, 400, 0], S3: [370, 950, 0], S4: [110, 780, 0] },
          wheel: { cx: 370, cy: 700, notches: 12, entries: { S2L: Math.PI, S1R: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 50 }, { id: "a1", x: 180 }, { id: "a2", x: 300 },
                { id: "a3", x: 450 }, { id: "a4", x: 615 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 185).to(370, 240) },
            S0L:  { to: "S1", tr: T(370, 240).to(280, 300).to(180, 400) },
            S0R:  { to: "S2", tr: T(370, 240).to(460, 300).to(560, 400) },
            S1L:  { to: "S4", tr: T(180, 400).to(110, 470).under().to(60, 560).to(45, 660).over().to(60, 710).to(110, 780) },
            S1R:  { to: "wheel", tr: T(180, 400).to(260, 450).to(400, 520).to(470, 580).to(470, 650).to(440, 700) },
            S2L:  { to: "wheel", tr: T(560, 400).to(480, 450).under().to(340, 530).over().to(300, 555).to(250, 610).to(255, 670).to(300, 700) },
            S2R:  { to: "a4", tr: T(560, 400).to(640, 480).to(645, 580).zig(640, 860, 2, 20).to(615, 960).to(615, RAIL_END) },
            wout: { to: "S3", tr: T(370, 770).to(370, 950) },
            S3L:  { to: "a2", tr: T(370, 950).to(310, 1000).to(300, RAIL_END) },
            S3R:  { to: "a3", tr: T(370, 950).to(440, 1000).to(450, RAIL_END) },
            S4L:  { to: "a0", tr: T(110, 780).to(60, 850).to(50, RAIL_END) },
            S4R:  { to: "fer:0", tr: T(110, 780).to(i0[0], i0[1]) },
            S4R2: { to: "a1", tr: T(o0[0], o0[1]).to(185, 960).to(180, RAIL_END) }
          },
          gates: [{ ch: "top", at: [450, 221], cap: 4, p: [500, 100] },
                  { ch: "S0L", at: [215, 365], cap: 4, p: [80, 250] },
                  { ch: "S0R", at: [525, 365], cap: 4, p: [650, 250] },
                  { ch: "wout", at: [370, 920], cap: 3, p: [520, 820] },
                  { ch: "S2R", at: [645, 570], cap: 4, p: [560, 610] }],
          chimes: [["top", 520, 203], ["S1R", 330, 485], ["S2R", 643, 520], ["S0L", 280, 300], ["S3R", 410, 978]],
          sink: [532, 990],
          back: {
            east: { to: "sink", tr: T(620, 300).to(680, 380).coil(700, 26, 3).to(680, 800).to(600, 900).to(532, 990) },
            west: { to: "sink", tr: T(260, 330).to(240, 480).to(200, 560).loop(30, -1).to(150, 640).to(200, 820)
                                   .to(280, 900).to(420, 940).to(532, 990) }
          },
          drains: [D("gate:0", "east", [[600, 250], [620, 300]]),
                   D("gate:1", "west", [[280, 320], [260, 330]]),
                   D("gate:2", "east", [[520, 300], [620, 300]]),
                   D("gate:3", "sink", [[400, 880], [470, 930], [532, 990]]),
                   D("gate:4", "east", [[660, 420], [680, 450]]),
                   D("wheel:S1R", "east", [[520, 600], [600, 700], [680, 800]]),
                   D("wheel:S2L", "west", [[230, 600]])],
          cogs: [[660, 900, 36, 1], [440, 1010, 30, -1]]
        };
      },
      /* 5 · CLOCKWORK — THE CHAIN. Three switches chained along the top,
         right to left: each lets a marble off to the side — a whirlpool and
         a corkscrew down the right, a glass tube down the left — or hands it
         on, and the two inner ones feed a wheel in the middle, under which a
         tree of three switches fans out to four arrivals. The far left goes
         round a ferry gear before its glass tube. */
      function () {
        var f0 = { cx: 150, cy: 640, r: 55, n: 8, from: 200, to: 480, out: "S2L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [560, 280, 0], S1: [390, 360, 1], S2: [210, 440, 1], S3: [360, 860, 0], S4: [220, 970, 0], S5: [500, 970, 1] },
          wheel: { cx: 360, cy: 620, notches: 8, entries: { S2R: Math.PI, S1R: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 50 }, { id: "a1", x: 160 }, { id: "a2", x: 270 },
                { id: "a3", x: 440 }, { id: "a4", x: 550 }, { id: "a5", x: 650 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"], S5: ["S5L", "S5R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(630, 200).to(560, 280) },
            S0L:  { to: "S1", tr: T(560, 280).to(470, 320).to(390, 360) },
            S0R:  { to: "a5", tr: T(560, 280).to(640, 350).to(670, 450).to(670, 540).whirl(620, 540, 50, 12, 1.5, 1)
                                   .to(625, 650).over().to(630, 680).cork(645, 880, 2, 14).to(650, 960).to(650, RAIL_END) },
            S1L:  { to: "S2", tr: T(390, 360).to(300, 400).to(210, 440) },
            S1R:  { to: "wheel", tr: T(390, 360).to(430, 440).to(440, 530).to(430, 620) },
            S2L:  { to: "fer:0", tr: T(210, 440).to(130, 490).to(70, 560).to(i0[0], i0[1]) },
            S2L2: { to: "a0", tr: T(o0[0], o0[1]).to(80, 760).glass(1).to(50, 840).to(50, 1000).glass(0).to(50, RAIL_END) },
            S2R:  { to: "wheel", tr: T(210, 440).to(240, 510).to(240, 570).to(290, 620) },
            wout: { to: "S3", tr: T(360, 690).glass(1).to(360, 715).glass(0).to(360, 860) },
            S3L:  { to: "S4", tr: T(360, 860).to(290, 915).to(220, 970) },
            S3R:  { to: "S5", tr: T(360, 860).to(430, 915).to(500, 970) },
            S4L:  { to: "a1", tr: T(220, 970).to(170, 1020).to(160, RAIL_END) },
            S4R:  { to: "a2", tr: T(220, 970).to(260, 1020).to(270, RAIL_END) },
            S5L:  { to: "a3", tr: T(500, 970).to(450, 1020).to(440, RAIL_END) },
            S5R:  { to: "a4", tr: T(500, 970).to(540, 1020).to(550, RAIL_END) }
          },
          gates: [{ ch: "top", at: [585, 255], cap: 3, p: [430, 150] },
                  { ch: "S0L", at: [430, 340], cap: 4, p: [520, 470] },
                  { ch: "S1L", at: [250, 422], cap: 4, p: [250, 240] },
                  { ch: "S2L", at: [85, 560], cap: 4, p: [80, 330] },
                  { ch: "wout", at: [360, 840], cap: 3, p: [520, 780] },
                  { ch: "S3L", at: [250, 946], cap: 3, p: [140, 795] }],
          chimes: [["top", 600, 245], ["S1R", 435, 500], ["S0R", 655, 400], ["S3R", 430, 915], ["S2R", 240, 540]],
          sink: [340, 990],
          back: {
            east: { to: "sink", tr: T(600, 330).to(700, 430).to(700, 760).to(560, 900).to(340, 990) },
            west: { to: "sink", tr: T(170, 520).to(150, 640).loop(28, 1).to(220, 760).to(260, 880).to(340, 990) }
          },
          drains: [D("gate:0", "east", [[650, 260], [600, 330]]),
                   D("gate:1", "east", [[560, 330], [600, 330]]),
                   D("gate:2", "west", [[330, 450], [250, 500], [170, 520]]),
                   D("gate:3", "west", [[170, 520]]),
                   D("gate:4", "west", [[320, 800], [270, 860]]),
                   D("gate:5", "sink", [[340, 940], [340, 990]]),
                   D("wheel:S1R", "east", [[500, 500], [600, 560], [700, 600]]),
                   D("wheel:S2R", "west", [[190, 520], [170, 520]])],
          cogs: [[660, 760, 44, 1], [610, 820, 22, -1], [255, 770, 24, 1], [420, 950, 30, 1]]
        };
      }
    ];
    var LAYOUTS = [
      BASE5[0],                    // 1 · WORKSHOP — THE TRAVERSE
      function () {
        /* 2 · WORKSHOP — THE SWITCHBACK. The line runs the whole top of the
           machine to the LEFT, where a ferry gear turns it round and lays it on a
           coil; a wave carries it back right to a wheel standing on the RIGHT,
           boarded from its left. The one switch is under the wheel: left, a
           booster and the first jump; right, a corkscrew. */
        var f0 = { cx: 115, cy: 260, r: 70, n: 10, from: -20, to: -250, out: "fo" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [560, 820, 0] },
          wheel: { cx: 560, cy: 600, notches: 10, entries: { fo: Math.PI }, out: "wout" },
          arr: [{ id: "a0", x: 170 }, { id: "a1", x: 625 }],
          out: { S0: ["S0L", "S0R"] },
          ch: {
            top:  { to: "fer:0", tr: T(H0[0], H0[1]).to(600, 180).to(400, 205).to(i0[0], i0[1]) },
            fo:   { to: "wheel", tr: T(o0[0], o0[1]).to(130, 380).coil(560, 36, 2).to(160, 585).wave(310, 590, 3, 20).to(490, 600) },
            wout: { to: "S0", tr: T(560, 670).to(560, 820) },
            S0L:  { to: "a0", tr: T(560, 820).to(470, 855).boost(330, 880).jump(190, 905, 30).to(175, 970).to(170, RAIL_END) },
            S0R:  { to: "a1", tr: T(560, 820).to(610, 870).cork(625, 1010, 1.5, 14).to(625, RAIL_END) }
          },
          gates: [{ ch: "top", at: [420, 203], cap: 4, p: [420, 300] },
                  { ch: "wout", at: [560, 800], cap: 3, p: [410, 720] }],
          chimes: [["top", 520, 190], ["fo", 240, 585], ["S0L", 520, 836], ["S0R", 600, 860]],
          sink: [360, 985],
          back: {
            trunk: { to: "sink", tr: T(600, 250).to(665, 330).to(670, 450).coil(650, 30, 2).to(640, 720).to(470, 900).to(360, 985) }
          },
          drains: [D("gate:0", "trunk", [[600, 250]]),
                   D("wheel:fo", "sink", [[300, 650], [270, 760]], function (t) { return t.to(290, 860).loop(26, 1).to(360, 985); }),
                   D("gate:1", "trunk", [[620, 700], [640, 720]])],
          cogs: [[300, 420, 40, 1], [350, 460, 22, -1], [60, 760, 34, 1]]
        };
      },
      function () {
        /* 3 · WORKSHOP — THE FORK. The switch splits at once, high in the middle.
           Left, a staircase rings down to the edge and a striped tube drops to a
           wheel standing LOW on the left, whose way out loops into its arrival;
           right, the line falls down the middle onto a ferry gear that carries it
           over its top and down the right side to a corkscrew. */
        var f0 = { cx: 440, cy: 680, r: 80, n: 10, from: -150, to: 30, out: "S0R2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [380, 290, 0] },
          wheel: { cx: 230, cy: 760, notches: 10, entries: { S0L: Math.PI }, out: "wout" },
          arr: [{ id: "a0", x: 120 }, { id: "a1", x: 560 }],
          out: { S0: ["S0L", "S0R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 185).to(470, 240).to(380, 290) },
            S0L:  { to: "wheel", tr: T(380, 290).to(300, 315).steps(120, 420, 4).to(80, 470)
                                       .zebra(1).to(70, 530).to(70, 600).zebra(0).to(90, 680).to(160, 760) },
            wout: { to: "a0", tr: T(230, 830).to(240, 900).to(200, 960).loop(30, -1).to(130, 985).to(120, RAIL_END) },
            S0R:  { to: "fer:0", tr: T(380, 290).to(440, 360).to(430, 480).to(390, 590).to(i0[0], i0[1]) },
            S0R2: { to: "a1", tr: T(o0[0], o0[1]).to(540, 800).cork(560, 1000, 1.5, 14).to(560, RAIL_END) }
          },
          gates: [{ ch: "top", at: [540, 212], cap: 3, p: [560, 330] },
                  { ch: "S0R", at: [430, 470], cap: 3, p: [300, 500] }],
          chimes: [["top", 520, 222], ["S0R", 435, 420], ["S0R2", 530, 780], ["wout", 236, 880], ["S0L", 85, 660]],
          sink: [400, 985],
          back: {
            east: { to: "sink", tr: T(630, 260).to(670, 380).coil(600, 28, 2).to(650, 760).to(560, 880).to(400, 985) }
          },
          drains: [D("gate:0", "east", [[630, 260]]),
                   D("gate:1", "east", [[520, 380], [640, 420]]),
                   D("wheel:S0L", "sink", [[40, 700], [50, 850]], function (t) { return t.to(150, 920).to(300, 940).to(400, 985); })],
          cogs: [[620, 520, 44, 1], [575, 575, 22, -1], [330, 960, 30, 1]]
        };
      },
      function () {
        /* 4 · WORKSHOP — THE LEAP. The first thing a marble does here is fly:
           the top line kicks it off a ski jump over the top left, a hose swings
           it back right to a wheel standing in the middle. Under it the switch
           sends it left onto a ferry gear that lifts it over to a loop down the
           left edge, or right through a booster that shoots it into a hose. */
        var f0 = { cx: 220, cy: 760, r: 75, n: 10, from: 20, to: -160, out: "S0L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [500, 730, 0] },
          wheel: { cx: 500, cy: 490, notches: 10, entries: { top: Math.PI }, out: "wout" },
          arr: [{ id: "a0", x: 75 }, { id: "a1", x: 625 }],
          out: { S0: ["S0L", "S0R"] },
          ch: {
            top:  { to: "wheel", tr: T(H0[0], H0[1]).to(600, 180).to(480, 205).to(380, 225).jump(150, 260, 30)
                                       .to(140, 330).hose(230, 440, 20).to(430, 490) },
            wout: { to: "S0", tr: T(500, 560).to(500, 730) },
            S0L:  { to: "fer:0", tr: T(500, 730).to(400, 760).to(i0[0], i0[1]) },
            S0L2: { to: "a0", tr: T(o0[0], o0[1]).to(110, 790).to(95, 900).loop(32, -1).to(78, 950).to(75, RAIL_END) },
            S0R:  { to: "a1", tr: T(500, 730).to(540, 790).boost(640, 830).hose(625, 960, 90).to(625, RAIL_END) }
          },
          gates: [{ ch: "top", at: [540, 193], cap: 3, p: [540, 300] },
                  { ch: "wout", at: [500, 710], cap: 3, p: [350, 630] }],
          chimes: [["top", 430, 215], ["top", 330, 465], ["S0L", 440, 748], ["S0L2", 102, 845]],
          sink: [370, 985],
          back: {
            east: { to: "sink", tr: T(630, 240).to(670, 350).coil(600, 28, 2).to(560, 640).to(420, 700).to(330, 880).to(370, 985) }
          },
          drains: [D("gate:0", "east", [[630, 240]]),
                   D("wheel:top", "sink", [[300, 560], [260, 620]], function (t) { return t.to(250, 870).loop(26, 1).to(310, 930).to(370, 985); }),
                   D("gate:1", "east", [[540, 640], [560, 640]])],
          cogs: [[80, 520, 40, 1], [130, 575, 20, -1], [470, 950, 30, 1]]
        };
      },
      function () {
        /* 5 · WORKSHOP — THE HAIRPIN. A striped tube runs the top to the left,
           a hose turns the line back on itself and the switch splits it on the
           left. Right, a wave carries it across to a wheel standing LOW on the
           right, boarded from its right; left, a ferry gear lifts it over its top
           and drops it down a corkscrew on the left edge. */
        var f0 = { cx: 150, cy: 790, r: 70, n: 10, from: -10, to: -185, out: "S0L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [300, 450, 0] },
          wheel: { cx: 540, cy: 790, notches: 10, entries: { S0R: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 80 }, { id: "a1", x: 560 }],
          out: { S0: ["S0L", "S0R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 180).to(430, 212).zebra(1).to(200, 250).zebra(0).to(120, 280).to(95, 330)
                                       .hose(200, 430, 0).to(300, 450) },
            S0L:  { to: "fer:0", tr: T(300, 450).to(240, 520).to(225, 690).to(i0[0], i0[1]) },
            S0L2: { to: "a0", tr: T(o0[0], o0[1]).cork(80, 1000, 1.5, 14).to(80, RAIL_END) },
            S0R:  { to: "wheel", tr: T(300, 450).to(400, 480).wave(560, 515, 2, 20).to(615, 560).to(645, 650).to(645, 730).to(624, 790) },
            wout: { to: "a1", tr: T(540, 860).to(555, 960).to(560, RAIL_END) }
          },
          gates: [{ ch: "top", at: [500, 199], cap: 3, p: [480, 320] },
                  { ch: "S0L", at: [230, 600], cap: 3, p: [360, 640] }],
          chimes: [["top", 560, 187], ["S0R", 345, 465], ["S0R", 645, 690], ["wout", 550, 920], ["S0L", 227, 650]],
          sink: [330, 985],
          back: {
            east: { to: "sink", tr: T(630, 240).to(670, 340).coil(560, 26, 2).to(560, 640).to(450, 760).to(400, 900).to(330, 985) }
          },
          drains: [D("gate:0", "east", [[630, 240]]),
                   D("gate:1", "sink", [[180, 600], [170, 700]], function (t) { return t.to(250, 880).loop(26, 1).to(300, 930).to(330, 985); }),
                   D("wheel:S0R", "east", [[640, 500], [670, 520]])],
          cogs: [[420, 330, 36, 1], [380, 365, 18, -1], [300, 1000, 32, 1]]
        };
      },
      function () {
        /* 6 · WORKSHOP — THE ROUNDABOUT. The whole frame in one round: a
           staircase rings down the top, a hose turns the line back on itself and
           a loop carries it right onto a ferry gear that takes it round like a
           roundabout and lays it back LEFT, into a wheel standing on the left.
           The switch under it: left down to the edge, or right through a booster
           and off a jump across the bottom. */
        var f0 = { cx: 590, cy: 560, r: 60, n: 9, from: -140, to: 90, out: "fo" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [170, 870, 0] },
          wheel: { cx: 170, cy: 660, notches: 10, entries: { fo: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 85 }, { id: "a1", x: 520 }],
          out: { S0: ["S0L", "S0R"] },
          ch: {
            top:  { to: "fer:0", tr: T(H0[0], H0[1]).to(600, 180).to(480, 205).steps(260, 285, 4).to(120, 310)
                                       .hose(170, 430, 0).to(330, 450).loop(36, 1).to(500, 470).to(i0[0], i0[1]) },
            fo:   { to: "wheel", tr: T(o0[0], o0[1]).to(450, 640).to(240, 660) },
            wout: { to: "S0", tr: T(170, 730).to(170, 870) },
            S0L:  { to: "a0", tr: T(170, 870).to(100, 925).to(85, 980).to(85, RAIL_END) },
            S0R:  { to: "a1", tr: T(170, 870).to(260, 905).boost(390, 935).jump(510, 965, 30).to(520, RAIL_END) }
          },
          gates: [{ ch: "top", at: [540, 193], cap: 3, p: [520, 320] },
                  { ch: "fo", at: [470, 638], cap: 3, p: [400, 760] }],
          chimes: [["top", 570, 186], ["top", 250, 446], ["fo", 330, 652], ["S0R", 220, 890], ["S0L", 88, 960]],
          sink: [300, 1000],
          back: {
            east: { to: "sink", tr: T(660, 230).to(680, 360).coil(500, 24, 2).to(670, 700).to(600, 800).to(420, 880).to(300, 1000) }
          },
          drains: [D("gate:0", "east", [[660, 230]]),
                   D("gate:1", "east", [[630, 700], [670, 700]]),
                   D("wheel:fo", "sink", [[380, 720], [330, 800]], function (t) { return t.to(300, 1000); })],
          cogs: [[380, 570, 34, 1], [420, 545, 18, -1], [60, 400, 30, 1]]
        };
      },
      BASE5[1],                    // 7 · GLASSWORKS — THE CASCADE
      function () {
        /* 8 · GLASSWORKS — THE SHUTTLE. The line runs left along a striped tube to
           a switch high on the LEFT, then swings back right over a row of humps
           and a booster to a second switch on the right, which sends it back left
           into a wheel standing low in the middle, or down through a ferry gear. */
        var f0 = { cx: 590, cy: 780, r: 60, n: 8, from: 140, to: -40, out: "S1R2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [150, 330, 0], S1: [540, 590, 1] },
          wheel: { cx: 330, cy: 790, notches: 10, entries: { S1L: -Math.PI / 2 }, out: "wout" },
          arr: [{ id: "a0", x: 70 }, { id: "a1", x: 330 }, { id: "a2", x: 630 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 180).to(480, 222).zebra(1).to(260, 262).zebra(0).to(195, 292).to(150, 330) },
            S0L:  { to: "a0", tr: T(150, 330).to(100, 390).to(70, 470).to(62, 640).glass(1).to(60, 760).loop(34, 1).to(110, 790)
                                   .to(90, 880).to(70, 960).glass(0).to(70, RAIL_END) },
            S0R:  { to: "S1", tr: T(150, 330).to(205, 395).to(250, 425).wave(430, 470, 3, 20).boost(520, 540).to(540, 590) },
            S1L:  { to: "wheel", tr: T(540, 590).to(470, 620).to(400, 650).to(350, 680).to(330, 720) },
            S1R:  { to: "fer:0", tr: T(540, 590).to(560, 650).to(520, 740).to(i0[0], i0[1]) },
            S1R2: { to: "a2", tr: T(o0[0], o0[1]).to(650, 700).to(640, 760).coil(990, 26, 2).to(630, RAIL_END) },
            wout: { to: "a1", tr: T(330, 860).to(330, RAIL_END) }
          },
          gates: [{ ch: "top", at: [520, 208], cap: 3, p: [540, 330] },
                  { ch: "S0L", at: [64, 600], cap: 4, p: [190, 620] },
                  { ch: "wout", at: [330, 1010], cap: 3, p: [200, 900] }],
          chimes: [["top", 560, 194], ["S0R", 230, 412], ["S1L", 430, 638], ["S1R2", 646, 730], ["S0L", 85, 420]],
          sink: [460, 985],
          back: {
            trunk: { to: "sink", tr: T(600, 250).to(660, 330).coil(520, 26, 2).to(620, 600).to(480, 700).to(470, 860).to(460, 985) }
          },
          drains: [D("gate:0", "trunk", [[560, 240], [600, 250]]),
                   D("wheel:S1L", "trunk", [[400, 700], [470, 780]]),
                   D("gate:1", "sink", [[150, 700], [230, 860]], function (t) { return t.to(300, 940).to(380, 960).to(460, 985); }),
                   D("gate:2", "sink", [[380, 1020], [460, 985]])],
          cogs: [[620, 470, 40, 1], [665, 520, 22, -1], [230, 960, 30, 1]]
        };
      },
      function () {
        /* 9 · GLASSWORKS — THE HOOK. The top line runs left past the wheel and
           hooks back into it from the left, high on the right; a striped tube
           drops out of it to the first switch. Left, a ferry gear lifts the marble
           over to the far side, a hose turns it round and it JUMPS the gap to the
           second switch; right, a corkscrew falls alone down the edge. */
        var f0 = { cx: 220, cy: 600, r: 62, n: 8, from: 15, to: -195, out: "S0L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [470, 640, 0], S1: [340, 930, 1] },
          wheel: { cx: 470, cy: 400, notches: 10, entries: { top: Math.PI }, out: "wout" },
          arr: [{ id: "a0", x: 90 }, { id: "a1", x: 450 }, { id: "a2", x: 620 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"] },
          ch: {
            top:  { to: "wheel", tr: T(H0[0], H0[1]).to(600, 182).to(420, 225).to(330, 250).to(290, 290).to(300, 350).to(340, 385).to(400, 400) },
            wout: { to: "S0", tr: T(470, 470).zebra(1).to(472, 590).zebra(0).to(470, 640) },
            S0L:  { to: "fer:0", tr: T(470, 640).to(400, 625).to(i0[0], i0[1]) },
            S0L2: { to: "S1", tr: T(o0[0], o0[1]).to(135, 675).hose(110, 765, 30).to(200, 812).jump(330, 862).to(332, 900).to(340, 930) },
            S0R:  { to: "a2", tr: T(470, 640).to(560, 670).to(610, 720).to(620, 790).cork(620, 1000, 2, 14).to(620, RAIL_END) },
            S1L:  { to: "a0", tr: T(340, 930).to(250, 975).to(150, 1010).to(105, 1035).to(90, RAIL_END) },
            S1R:  { to: "a1", tr: T(340, 930).to(400, 970).glass(1).to(440, 1020).glass(0).to(450, RAIL_END) }
          },
          gates: [{ ch: "top", at: [500, 206], cap: 3, p: [560, 300] },
                  { ch: "S0L", at: [340, 622], cap: 3, p: [330, 500] },
                  { ch: "S0R", at: [618, 770], cap: 3, p: [520, 830] }],
          chimes: [["top", 560, 192], ["top", 292, 320], ["S0R", 590, 690], ["S0L2", 170, 800], ["S1R", 380, 958]],
          sink: [535, 985],
          back: {
            east: { to: "sink", tr: T(640, 250).to(680, 330).coil(560, 26, 2).to(680, 700).to(660, 860).to(600, 940).to(535, 985) },
            west: { to: "sink", tr: T(230, 420).to(160, 470).loop(28, -1).to(110, 560).to(80, 700).to(200, 880).to(400, 940).to(535, 985) }
          },
          drains: [D("gate:0", "east", [[600, 240], [640, 250]]),
                   D("wheel:top", "west", [[260, 380], [230, 420]]),
                   D("gate:1", "west", [[230, 520], [190, 470]]),
                   D("gate:2", "east", [[650, 720], [670, 760]])],
          cogs: [[180, 300, 40, 1], [130, 340, 22, -1], [560, 880, 30, 1]]
        };
      },
      function () {
        /* 10 · GLASSWORKS — THE STAIRWELL. The first switch stands high in the
           middle: right, a STAIRCASE rings down to a striped tube along the edge;
           left, a wheel on the left flank hands the marble through a glass drop to
           a ferry gear, which carries it over to the second switch. From there the
           long way home crawls back left over a row of humps. */
        var f0 = { cx: 330, cy: 780, r: 60, n: 8, from: 180, to: 360, out: "S0L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [330, 330, 1], S1: [430, 880, 0] },
          wheel: { cx: 190, cy: 620, notches: 10, entries: { S0L: -Math.PI / 2 }, out: "wout" },
          arr: [{ id: "a0", x: 100 }, { id: "a1", x: 460 }, { id: "a2", x: 625 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 182).to(470, 224).to(380, 262).to(345, 300).to(330, 330) },
            S0L:  { to: "wheel", tr: T(330, 330).to(250, 390).to(200, 450).to(190, 550) },
            S0R:  { to: "a2", tr: T(330, 330).to(400, 380).steps(600, 500, 4).to(630, 540).to(645, 660).zebra(1).to(645, 880).zebra(0)
                                   .coil(1020, 22, 2).to(625, RAIL_END) },
            wout: { to: "fer:0", tr: T(190, 690).glass(1).to(205, 745).glass(0).to(i0[0], i0[1]) },
            S0L2: { to: "S1", tr: T(o0[0], o0[1]).to(420, 830).to(430, 880) },
            S1L:  { to: "a0", tr: T(430, 880).to(360, 920).to(310, 940).wave(150, 985, 3, 16).to(110, 1010).to(100, RAIL_END) },
            S1R:  { to: "a1", tr: T(430, 880).to(470, 950).to(460, RAIL_END) }
          },
          gates: [{ ch: "top", at: [480, 221], cap: 4, p: [470, 110] },
                  { ch: "S1L", at: [320, 936], cap: 3, p: [255, 852] },
                  { ch: "S0R", at: [645, 650], cap: 3, p: [540, 700] }],
          chimes: [["top", 560, 195], ["S0L", 215, 425], ["S0L2", 410, 815], ["S0R", 640, 600], ["S1R", 466, 1000]],
          sink: [545, 985],
          back: {
            east: { to: "sink", tr: T(560, 260).to(680, 330).to(690, 450).coil(720, 24, 3).to(600, 860).to(545, 985) },
            west: { to: "sink", tr: T(80, 420).to(60, 560).loop(26, 1).to(110, 760).to(200, 900).to(380, 1010).to(545, 985) }
          },
          drains: [D("gate:0", "east", [[520, 250], [560, 260]]),
                   D("wheel:S0L", "west", [[160, 380], [80, 420]]),
                   D("gate:1", "sink", [[380, 1000], [460, 1010], [545, 985]]),
                   D("gate:2", "east", [[680, 700], [690, 760]])],
          cogs: [[130, 230, 44, 1], [80, 280, 22, -1], [560, 400, 30, 1]]
        };
      },
      function () {
        /* 11 · GLASSWORKS — THE LONG WAY. One long run before any choice: a
           striped tube along the top, a loop, a hose that turns the marble round
           on the far left, a booster, and a JUMP across the machine to the first
           switch. The right falls down a striped tube; the left splits again, into
           a wheel low in the middle or a ferry gear that carries it round the
           bottom left. */
        var f0 = { cx: 120, cy: 830, r: 55, n: 8, from: -60, to: -240, out: "S1L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [510, 595, 0], S1: [230, 700, 1] },
          wheel: { cx: 380, cy: 880, notches: 10, entries: { S1R: -Math.PI / 2 }, out: "wout" },
          arr: [{ id: "a0", x: 70 }, { id: "a1", x: 380 }, { id: "a2", x: 630 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 182).to(470, 222).zebra(1).to(250, 262).zebra(0).to(210, 272).loop(36, -1)
                                   .to(150, 290).hose(110, 400, 0).to(150, 410).boost(280, 445).to(330, 460).jump(510, 520).to(512, 565).to(510, 595) },
            S0L:  { to: "S1", tr: T(510, 595).to(420, 630).to(320, 670).to(230, 700) },
            S0R:  { to: "a2", tr: T(510, 595).to(580, 625).to(625, 690).to(632, 745).zebra(1).to(635, 960).zebra(0).to(630, RAIL_END) },
            S1L:  { to: "fer:0", tr: T(230, 700).to(190, 730).to(i0[0], i0[1]) },
            S1L2: { to: "a0", tr: T(o0[0], o0[1]).to(75, 940).to(70, RAIL_END) },
            S1R:  { to: "wheel", tr: T(230, 700).to(290, 730).to(340, 760).to(375, 790).to(380, 810) },
            wout: { to: "a1", tr: T(380, 950).to(380, RAIL_END) }
          },
          gates: [{ ch: "top", at: [500, 213], cap: 4, p: [430, 120] },
                  { ch: "S1L2", at: [72, 1000], cap: 3, p: [180, 960] },
                  { ch: "S0R", at: [618, 680], cap: 3, p: [520, 780] }],
          chimes: [["top", 560, 195], ["top", 140, 410], ["S0L", 380, 646], ["S0R", 615, 700], ["S1R", 300, 736]],
          sink: [510, 985],
          back: {
            east: { to: "sink", tr: T(560, 260).to(670, 320).coil(600, 24, 3).to(680, 760).to(580, 880).to(510, 985) },
            west: { to: "sink", tr: T(250, 520).to(180, 600).loop(26, -1).to(120, 640).to(40, 720).to(160, 920).to(300, 1010).to(510, 985) }
          },
          drains: [D("gate:0", "east", [[530, 250], [560, 260]]),
                   D("wheel:S1R", "west", [[260, 640], [250, 520]], function (t) { return t; }),
                   D("gate:1", "sink", [[140, 1030], [300, 1040], [510, 985]]),
                   D("gate:2", "east", [[660, 640], [670, 600]])],
          cogs: [[560, 360, 46, 1], [610, 410, 22, -1], [260, 900, 30, 1]]
        };
      },
      function () {
        /* 12 · GLASSWORKS — THE WEAVE. The longest crossing: a striped tube runs
           the whole top to a switch on the far LEFT, which drops the marble into
           a whirlpool down the edge or sends it back right over a row of humps to
           a wheel on the right flank. Out of it a staircase rings back left to the
           second switch, which JUMPS left or rides a ferry gear over to the right. */
        var f0 = { cx: 530, cy: 930, r: 55, n: 8, from: 180, to: 360, out: "S1R2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [100, 380, 1], S1: [370, 830, 0] },
          wheel: { cx: 560, cy: 620, notches: 12, entries: { S0R: Math.PI }, out: "wout" },
          arr: [{ id: "a0", x: 60 }, { id: "a1", x: 155 }, { id: "a2", x: 610 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 182).to(500, 212).zebra(1).to(260, 250).zebra(0).to(160, 270).to(110, 310).to(100, 380) },
            S0L:  { to: "a0", tr: T(100, 380).to(70, 440).to(55, 560).to(58, 640).whirl(110, 640, 52, 14, 1.75, -1).to(105, 750).over()
                                   .to(92, 780).glass(1).to(64, 1000).glass(0).to(60, RAIL_END) },
            S0R:  { to: "wheel", tr: T(100, 380).to(160, 420).to(200, 440).wave(370, 480, 3, 18).to(420, 500).to(465, 535).to(485, 580).to(490, 620) },
            wout: { to: "S1", tr: T(560, 690).to(555, 730).steps(420, 800, 3).to(390, 815).to(370, 830) },
            S1L:  { to: "a1", tr: T(370, 830).to(320, 855).to(280, 872).jump(155, 945).to(153, 995).to(155, RAIL_END) },
            S1R:  { to: "fer:0", tr: T(370, 830).to(420, 870).to(i0[0], i0[1]) },
            S1R2: { to: "a2", tr: T(o0[0], o0[1]).to(605, 990).to(610, RAIL_END) }
          },
          gates: [{ ch: "top", at: [530, 203], cap: 3, p: [520, 320] },
                  { ch: "S0L", at: [58, 520], cap: 3, p: [200, 560] },
                  { ch: "S1R", at: [460, 915], cap: 3, p: [420, 1000] }],
          chimes: [["top", 570, 190], ["S0R", 180, 430], ["S0R", 450, 520], ["wout", 562, 730], ["S0L", 64, 480]],
          sink: [290, 985],
          back: {
            east: { to: "sink", tr: T(600, 260).to(680, 330).coil(560, 24, 2).to(690, 760).to(660, 860).to(500, 1000).to(380, 1030).to(290, 985) },
            west: { to: "sink", tr: T(250, 560).to(300, 640).loop(28, 1).to(360, 700).to(300, 780).to(250, 900).to(290, 985) }
          },
          drains: [D("gate:0", "east", [[560, 250], [600, 260]]),
                   D("wheel:S0R", "west", [[360, 540], [250, 560]]),
                   D("gate:1", "west", [[140, 470], [250, 560]]),
                   D("gate:2", "sink", [[400, 960], [340, 1010], [290, 985]])],
          cogs: [[400, 360, 44, 1], [350, 330, 22, -1], [480, 1040, 26, 1]]
        };
      },
      BASE5[2],                    // 13 · MAELSTROM — THE STAIRCASE
      function () {
        /* 14 · MAELSTROM — THE EDDY. The top line runs leftward over a wave, and
           the switches TURN BACK: each left-hand switch sends a marble back right
           into a wheel standing high on the right, fed from above and from the
           left. The far left coils down the edge, the bottom left rides a ferry
           gear over to the middle, the far right drops through a hose. */
        var f0 = { cx: 290, cy: 880, r: 55, n: 8, from: 180, to: 360, out: "S2R2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [300, 300, 0], S1: [150, 440, 1], S2: [150, 830, 0], S3: [520, 860, 0] },
          wheel: { cx: 520, cy: 570, notches: 10, entries: { S0R: -Math.PI / 2, S1R: Math.PI }, out: "wout" },
          arr: [{ id: "a0", x: 70 }, { id: "a1", x: 330 }, { id: "a2", x: 480 }, { id: "a3", x: 620 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(560, 186).to(470, 216).wave(340, 276, 2, 18).to(300, 300) },
            S0L:  { to: "S1", tr: T(300, 300).to(230, 360).to(150, 440) },
            S0R:  { to: "wheel", tr: T(300, 300).to(390, 340).to(470, 350).to(520, 370).to(520, 500) },
            S1L:  { to: "S2", tr: T(150, 440).to(90, 500).to(70, 580).coil(780, 28, 2).to(110, 800).to(150, 830) },
            S1R:  { to: "wheel", tr: T(150, 440).to(240, 500).to(330, 545).to(450, 570) },
            wout: { to: "S3", tr: T(520, 640).to(520, 860) },
            S2L:  { to: "a0", tr: T(150, 830).to(90, 900).to(70, 980).to(70, RAIL_END) },
            S2R:  { to: "fer:0", tr: T(150, 830).to(200, 870).to(i0[0], i0[1]) },
            S2R2: { to: "a1", tr: T(o0[0], o0[1]).to(340, 960).to(330, RAIL_END) },
            S3L:  { to: "a2", tr: T(520, 860).to(480, 940).to(480, RAIL_END) },
            S3R:  { to: "a3", tr: T(520, 860).to(570, 900).hose(620, 990, 90).to(620, RAIL_END) }
          },
          gates: [{ ch: "top", at: [480, 213], cap: 4, p: [430, 108] },
                  { ch: "S0L", at: [170, 420], cap: 3, p: [50, 280] },
                  { ch: "S1L", at: [73, 570], cap: 4, p: [260, 650] },
                  { ch: "wout", at: [520, 840], cap: 3, p: [640, 740] }],
          chimes: [["top", 560, 186], ["S0R", 470, 350], ["S1R", 330, 545], ["S2L", 85, 920], ["S3L", 490, 920]],
          sink: [405, 990],
          back: {
            trunk: { to: "sink", tr: T(600, 260).to(665, 330).coil(600, 28, 3).to(640, 700).to(600, 820).to(480, 920).to(405, 990) },
            spine: { to: "sink", tr: T(220, 560).to(240, 680).loop(30, 1).to(330, 780).to(380, 900).to(405, 990) }
          },
          drains: [D("gate:0", "trunk", [[600, 260]]),
                   D("wheel:S0R", "trunk", [[560, 380], [640, 420]]),
                   D("gate:1", "spine", [[260, 400], [220, 560]]),
                   D("wheel:S1R", "spine", [[230, 540], [220, 560]]),
                   D("gate:2", "spine", [[170, 540], [220, 560]]),
                   D("gate:3", "trunk", [[580, 760], [620, 780]])],
          cogs: [[650, 470, 44, 1], [600, 505, 22, -1], [230, 960, 30, 1], [400, 760, 26, -1]]
        };
      },
      function () {
        /* 15 · MAELSTROM — THE UNDERTOW. The feed drops straight down the right
           edge and the machine is read right to left: a wave carries the marbles
           across to a WHIRLPOOL in the middle, whose drain runs UNDER the line to
           the wheel, standing low on the left. The right column coils down to a
           ferry gear that lifts the far right over its own top. */
        var f0 = { cx: 590, cy: 800, r: 55, n: 8, from: 180, to: 360, out: "S2R2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [555, 345, 0], S1: [330, 390, 1], S2: [540, 570, 0], S3: [380, 870, 0] },
          wheel: { cx: 230, cy: 720, notches: 8, entries: { S1L: Math.PI, S2L: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 110 }, { id: "a1", x: 300 }, { id: "a2", x: 470 }, { id: "a3", x: 640 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(610, 200).to(555, 345) },
            S0L:  { to: "S1", tr: T(555, 345).to(500, 350).wave(360, 380, 2, 16).to(330, 390) },
            S0R:  { to: "S2", tr: T(555, 345).to(625, 380).coil(510, 28, 2).to(605, 535).to(540, 570) },
            S1L:  { to: "wheel", tr: T(330, 390).to(290, 405).boost(180, 450).to(150, 460).loop(36, -1).to(90, 490).to(60, 570).to(60, 650)
                                    .to(90, 700).to(160, 720) },
            S1R:  { to: "S3", tr: T(330, 390).to(380, 440).to(390, 523).whirl(390, 550, 55, 14, 1.75, 1)
                                    .to(392, 770).over().to(392, 810).to(380, 870) },
            S2L:  { to: "wheel", tr: T(540, 570).to(500, 640).to(470, 720).to(300, 720) },
            S2R:  { to: "fer:0", tr: T(540, 570).to(560, 650).to(540, 730).to(i0[0], i0[1]) },
            S2R2: { to: "a3", tr: T(o0[0], o0[1]).to(645, 900).to(640, RAIL_END) },
            wout: { to: "a0", tr: T(230, 790).to(230, 880).to(130, 930).coil(1040, 26, 2).to(110, RAIL_END) },
            S3L:  { to: "a1", tr: T(380, 870).to(315, 940).zebra(1).to(300, 1050).zebra(0).to(300, RAIL_END) },
            S3R:  { to: "a2", tr: T(380, 870).to(455, 940).zebra(1).to(470, 1050).zebra(0).to(470, RAIL_END) }
          },
          gates: [{ ch: "top", at: [582, 270], cap: 4, p: [420, 200] },
                  { ch: "S1R", at: [388, 508], cap: 3, p: [250, 545] },
                  { ch: "wout", at: [190, 900], cap: 3, p: [70, 800] },
                  { ch: "S2R2", at: [643, 950], cap: 3, p: [550, 930] }],
          chimes: [["top", 600, 210], ["S1L", 300, 401], ["S2L", 400, 720], ["S3R", 455, 935], ["S2R2", 645, 880]],
          sink: [380, 990],
          back: {
            trunk: { to: "sink", tr: T(640, 250).to(680, 400).to(680, 600).loop(26, -1).to(560, 900).to(380, 990) },
            spine: { to: "sink", tr: T(300, 450).to(330, 600).to(300, 780).loop(28, 1).to(360, 900).to(380, 990) }
          },
          drains: [D("gate:0", "trunk", [[640, 250]]),
                   D("gate:1", "spine", [[330, 440], [300, 450]]),
                   D("wheel:S1L", "spine", [[200, 420], [280, 420], [300, 450]]),
                   D("wheel:S2L", "trunk", [[560, 620], [650, 640], [680, 600]]),
                   D("gate:2", "sink", [[260, 900], [330, 960], [380, 990]]),
                   D("gate:3", "trunk", [[600, 650], [680, 600]])],
          cogs: [[160, 230, 40, 1], [110, 270, 22, -1], [520, 1000, 30, 1], [300, 820, 24, -1]]
        };
      },
      function () {
        /* 16 · MAELSTROM — THE SPRINGBOARD. The top line ends on a ski JUMP that throws
           every marble into the middle of the machine. The left half rides a
           ferry gear over its top to the far left, where one way corkscrews down
           the edge and the other swings through a hose; the right half waves down
           to a wheel standing low on the right, fed from above and from the left. */
        var f0 = { cx: 200, cy: 380, r: 60, n: 8, from: 10, to: -200, out: "S0L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [350, 340, 0], S1: [110, 500, 1], S2: [560, 480, 0], S3: [160, 900, 0] },
          wheel: { cx: 460, cy: 760, notches: 10, entries: { S2L: -Math.PI / 2, S1R: Math.PI }, out: "wout" },
          arr: [{ id: "a0", x: 70 }, { id: "a1", x: 270 }, { id: "a2", x: 470 }, { id: "a3", x: 640 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(560, 186).to(470, 215).jump(350, 262, 30).to(350, 340) },
            S0L:  { to: "fer:0", tr: T(350, 340).to(300, 365).to(i0[0], i0[1]) },
            S0L2: { to: "S1", tr: T(o0[0], o0[1]).to(110, 500) },
            S0R:  { to: "S2", tr: T(350, 340).to(390, 360).wave(530, 460, 2, 16).to(560, 480) },
            S1L:  { to: "S3", tr: T(110, 500).to(70, 560).to(65, 650).cork(70, 830, 2, 16).to(160, 900) },
            S1R:  { to: "wheel", tr: T(110, 500).to(180, 535).hose(260, 630, 60).to(300, 700).to(390, 760) },
            S2L:  { to: "wheel", tr: T(560, 480).to(480, 540).to(460, 600).to(460, 690) },
            S2R:  { to: "a3", tr: T(560, 480).to(635, 550).to(640, 640).coil(800, 26, 2).to(640, 880).to(640, RAIL_END) },
            wout: { to: "a2", tr: T(460, 830).to(470, 900).to(470, RAIL_END) },
            S3L:  { to: "a0", tr: T(160, 900).to(80, 970).to(70, RAIL_END) },
            S3R:  { to: "a1", tr: T(160, 900).to(250, 960).to(270, RAIL_END) }
          },
          gates: [{ ch: "top", at: [500, 205], cap: 4, p: [520, 100] },
                  { ch: "S1L", at: [66, 625], cap: 3, p: [240, 740] },
                  { ch: "S2R", at: [639, 620], cap: 3, p: [560, 650] },
                  { ch: "wout", at: [470, 950], cap: 3, p: [350, 880] }],
          chimes: [["top", 560, 186], ["S0R", 395, 362], ["S1R", 340, 727], ["S2R", 640, 920], ["S3R", 250, 960]],
          sink: [370, 995],
          back: {
            trunk: { to: "sink", tr: T(610, 230).to(680, 330).coil(560, 26, 3).to(600, 640).to(560, 880).to(370, 995) },
            spine: { to: "sink", tr: T(200, 560).to(250, 700).loop(28, 1).to(300, 860).to(370, 995) }
          },
          drains: [D("gate:0", "trunk", [[610, 230]]),
                   D("gate:1", "spine", [[130, 540], [200, 560]]),
                   D("wheel:S1R", "spine", [[240, 600], [200, 560]]),
                   D("wheel:S2L", "trunk", [[560, 560], [620, 600]]),
                   D("gate:2", "trunk", [[660, 560], [620, 600]]),
                   D("gate:3", "sink", [[420, 900], [370, 995]])],
          cogs: [[120, 230, 36, 1], [80, 260, 18, -1], [560, 1000, 28, 1], [330, 470, 30, -1]]
        };
      },
      function () {
        /* 17 · MAELSTROM — THE RIPTIDE. A chain: the four switches zigzag down
           the machine and each lets ONE way off — the far right coils down a
           striped tube, the far left down a corkscrew — or hands the marble on
           across the frame. The marble steps down a staircase to a ferry gear in
           the top corner, is shot back right by a booster, and the last two
           switches meet in a wheel standing low on the left. */
        var f0 = { cx: 160, cy: 320, r: 60, n: 8, from: 15, to: -200, out: "S0L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [520, 260, 1], S1: [120, 440, 0], S2: [420, 580, 1], S3: [540, 800, 0] },
          wheel: { cx: 260, cy: 820, notches: 8, entries: { S2L: -Math.PI / 2, S3L: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 60 }, { id: "a1", x: 250 }, { id: "a2", x: 450 }, { id: "a3", x: 640 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(520, 260) },
            S0L:  { to: "fer:0", tr: T(520, 260).to(480, 268).steps(250, 328, 3).to(i0[0], i0[1]) },
            S0L2: { to: "S1", tr: T(o0[0], o0[1]).to(120, 440) },
            S0R:  { to: "a3", tr: T(520, 260).to(610, 320).to(640, 400).coil(560, 26, 2).to(640, 600)
                                    .zebra(1).to(640, 960).zebra(0).to(640, RAIL_END) },
            S1L:  { to: "a0", tr: T(120, 440).to(70, 500).to(65, 640).cork(62, 900, 2, 14).to(60, RAIL_END) },
            S1R:  { to: "S2", tr: T(120, 440).to(240, 505).boost(380, 570).to(420, 580) },
            S2L:  { to: "wheel", tr: T(420, 580).to(330, 620).to(275, 660).to(260, 750) },
            S2R:  { to: "S3", tr: T(420, 580).to(510, 640).to(560, 720).to(540, 800) },
            S3L:  { to: "wheel", tr: T(540, 800).to(450, 830).to(330, 820) },
            S3R:  { to: "a2", tr: T(540, 800).to(590, 870).hose(470, 970, 120).to(452, 1010).to(450, RAIL_END) },
            wout: { to: "a1", tr: T(260, 890).to(250, RAIL_END) }
          },
          gates: [{ ch: "top", at: [562, 225], cap: 3, p: [400, 130] },
                  { ch: "S0R", at: [638, 395], cap: 4, p: [550, 440] },
                  { ch: "S1L", at: [66, 610], cap: 4, p: [170, 640] },
                  { ch: "S1R", at: [236, 503], cap: 3, p: [300, 380] }],
          chimes: [["top", 590, 200], ["S1R", 170, 467], ["S2R", 540, 690], ["S3L", 420, 830], ["S0R", 640, 700]],
          sink: [360, 990],
          back: {
            trunk: { to: "sink", tr: T(600, 300).to(680, 380).to(690, 600).loop(26, -1).to(560, 900).to(360, 990) },
            spine: { to: "sink", tr: T(200, 560).to(150, 700).coil(900, 24, 2).to(250, 960).to(360, 990) }
          },
          drains: [D("gate:0", "trunk", [[600, 230], [600, 300]]),
                   D("gate:1", "trunk", [[670, 330], [680, 380]]),
                   D("gate:2", "spine", [[110, 500], [200, 560]]),
                   D("gate:3", "spine", [[170, 470], [200, 560]]),
                   D("wheel:S2L", "spine", [[380, 560], [300, 560], [200, 560]]),
                   D("wheel:S3L", "trunk", [[620, 840], [600, 860]])],
          cogs: [[120, 160, 30, 1], [400, 900, 30, -1], [470, 380, 34, 1], [500, 410, 16, -1]]
        };
      },
      function () {
        /* 18 · MAELSTROM — THE VORTEX. The first switch splits the machine in
           two halves that never meet. The left falls through a whirlpool to a
           switch that throws one way over a ski JUMP and lowers the other down a
           hose; the right is a chain — a wave, a booster — whose two switches
           both feed a wheel standing in the middle, whose way out rides a ferry
           gear over its top. The top line loops before anything else. */
        var f0 = { cx: 500, cy: 880, r: 55, n: 8, from: 180, to: 360, out: "wout2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [330, 265, 0], S1: [140, 660, 1], S2: [470, 400, 0], S3: [620, 500, 1] },
          wheel: { cx: 440, cy: 670, notches: 10, entries: { S2L: -Math.PI / 2, S3L: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 100 }, { id: "a1", x: 330 }, { id: "a2", x: 555 }, { id: "a3", x: 655 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(560, 186).to(470, 216).loop(40, -1).to(400, 240).to(330, 265) },
            S0L:  { to: "S1", tr: T(330, 265).to(240, 300).to(150, 350).to(90, 410).to(70, 470).whirl(120, 470, 50, 14, 1.75, -1)
                                    .to(120, 580).over().to(125, 610).to(140, 660) },
            S0R:  { to: "S2", tr: T(330, 265).to(360, 285).wave(445, 380, 2, 14).to(470, 400) },
            S1L:  { to: "a0", tr: T(140, 660).to(75, 730).to(65, 800).hose(100, 960, 90).to(100, RAIL_END) },
            S1R:  { to: "a1", tr: T(140, 660).to(210, 705).to(270, 730).jump(360, 775, 30).to(350, 860).to(330, RAIL_END) },
            S2L:  { to: "wheel", tr: T(470, 400).to(445, 450).to(440, 600) },
            S2R:  { to: "S3", tr: T(470, 400).to(510, 420).boost(600, 470).to(620, 500) },
            S3L:  { to: "wheel", tr: T(620, 500).to(580, 560).to(575, 630).to(510, 670) },
            S3R:  { to: "a3", tr: T(620, 500).to(655, 560).to(652, 640).coil(820, 20, 2).to(655, RAIL_END) },
            wout: { to: "fer:0", tr: T(440, 740).to(i0[0], i0[1]) },
            wout2: { to: "a2", tr: T(o0[0], o0[1]).to(555, 960).to(555, RAIL_END) }
          },
          gates: [{ ch: "top", at: [500, 206], cap: 4, p: [600, 280] },
                  { ch: "S0L", at: [85, 430], cap: 4, p: [240, 450] },
                  { ch: "S1R", at: [265, 728], cap: 3, p: [330, 620] },
                  { ch: "S1L", at: [66, 790], cap: 3, p: [190, 840] }],
          chimes: [["top", 560, 186], ["S0L", 240, 300], ["S2L", 443, 520], ["S1R", 350, 900], ["S3L", 577, 600]],
          sink: [200, 1000],
          back: {
            east: { to: "sink", tr: T(620, 230).to(690, 330).coil(560, 26, 3).to(690, 700).to(620, 760).to(400, 960).to(200, 1000) },
            west: { to: "sink", tr: T(220, 520).to(250, 640).loop(28, 1).to(260, 800).to(230, 920).to(200, 1000) }
          },
          drains: [D("gate:0", "east", [[620, 230]]),
                   D("gate:1", "west", [[160, 420], [220, 520]]),
                   D("gate:2", "west", [[240, 690], [255, 700]]),
                   D("gate:3", "sink", [[110, 800], [150, 920], [200, 1000]]),
                   D("wheel:S2L", "west", [[380, 500], [300, 520], [220, 520]]),
                   D("wheel:S3L", "east", [[640, 620], [690, 660]])],
          cogs: [[130, 180, 34, 1], [90, 220, 18, -1], [270, 1010, 26, 1], [600, 380, 22, -1]]
        };
      },
      BASE5[3],                    // 19 · DEPTHS — THE BRAID
      function () {
        /* 20 · DEPTHS — THE SIPHON. The wheel sinks to the bottom of the machine
           and its way out falls straight into the middle arrival: two halves feed
           it, a left one that drops switch by switch and a right one that dives
           behind the machine and comes back through a hose. The far left rides a
           ferry gear over its top. */
        var f0 = { cx: 95, cy: 520, r: 55, n: 8, from: -50, to: -205, out: "S1L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [420, 250, 0], S1: [200, 400, 1], S2: [570, 420, 0], S3: [210, 640, 0], S4: [560, 830, 1] },
          wheel: { cx: 340, cy: 820, notches: 10, entries: { S3R: Math.PI, S2L: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 48 }, { id: "a1", x: 175 }, { id: "a2", x: 340 }, { id: "a3", x: 480 }, { id: "a4", x: 620 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 185).to(420, 250) },
            S0L:  { to: "S1", tr: T(420, 250).to(330, 300).to(200, 400) },
            S0R:  { to: "S2", tr: T(420, 250).to(480, 290).zebra(1).to(545, 360).zebra(0).to(570, 420) },
            S1L:  { to: "fer:0", tr: T(200, 400).to(i0[0], i0[1]) },
            S1L2: { to: "a0", tr: T(o0[0], o0[1]).to(48, 660).coil(880, 24, 2).to(48, RAIL_END) },
            S1R:  { to: "S3", tr: T(200, 400).to(250, 460).to(250, 560).to(210, 640) },
            S2L:  { to: "wheel", tr: T(570, 420).to(510, 470).under().to(440, 540).over().to(430, 570).boost(470, 680)
                                     .to(470, 750).to(445, 795).to(410, 820) },
            S2R:  { to: "S4", tr: T(570, 420).to(640, 490).to(650, 600).hose(560, 760, 100).to(560, 830) },
            S3L:  { to: "a1", tr: T(210, 640).to(160, 700).to(150, 900).to(175, RAIL_END) },
            S3R:  { to: "wheel", tr: T(210, 640).to(240, 720).to(260, 790).to(270, 820) },
            wout: { to: "a2", tr: T(340, 890).to(340, RAIL_END) },
            S4L:  { to: "a3", tr: T(560, 830).to(495, 900).to(480, RAIL_END) },
            S4R:  { to: "a4", tr: T(560, 830).to(620, 900).to(620, RAIL_END) }
          },
          gates: [{ ch: "top", at: [520, 214], cap: 4, p: [500, 100] },
                  { ch: "S0L", at: [275, 342], cap: 4, p: [240, 225] },
                  { ch: "S2R", at: [648, 580], cap: 4, p: [560, 610] },
                  { ch: "wout", at: [340, 1040], cap: 3, p: [410, 960] },
                  { ch: "S1R", at: [250, 540], cap: 3, p: [360, 480] }],
          chimes: [["top", 560, 200], ["S0L", 330, 300], ["S1R", 250, 520], ["S2R", 645, 530], ["S4R", 620, 960]],
          sink: [255, 990],
          back: {
            east: { to: "sink", tr: T(600, 300).to(690, 380).coil(700, 26, 3).to(660, 900).to(500, 1000).to(255, 990) },
            west: { to: "sink", tr: T(300, 330).to(300, 500).loop(30, 1).to(330, 600).to(290, 900).to(255, 990) }
          },
          drains: [D("gate:0", "east", [[600, 250], [600, 300]]),
                   D("gate:1", "west", [[300, 330]]),
                   D("gate:2", "east", [[690, 560]]),
                   D("gate:3", "sink", [[300, 1000], [255, 990]]),
                   D("gate:4", "west", [[300, 560]]),
                   D("wheel:S3R", "west", [[290, 700]]),
                   D("wheel:S2L", "east", [[560, 700], [660, 800]])],
          cogs: [[660, 1000, 36, 1], [130, 980, 30, -1], [120, 700, 40, 1]]
        };
      },
      function () {
        /* 21 · DEPTHS — THE HIGH WHEEL. The wheel hangs HIGH on the right, under
           the feed gear, and both its lines come from the left: one straight off
           the first switch, one back across the machine over humps and a booster.
           Under it the left drops down a hose to a pair of switches whose far
           branch tunnels behind the middle of the machine to the right. */
        var f0 = { cx: 390, cy: 700, r: 58, n: 8, from: 10, to: -250, out: "S3L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [350, 250, 1], S1: [130, 420, 0], S2: [90, 650, 1], S3: [530, 680, 0], S4: [215, 840, 0] },
          wheel: { cx: 530, cy: 470, notches: 10, entries: { S0R: -Math.PI / 2, S1R: Math.PI }, out: "wout" },
          arr: [{ id: "a0", x: 45 }, { id: "a1", x: 165 }, { id: "a2", x: 340 }, { id: "a3", x: 475 }, { id: "a4", x: 625 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 185).to(350, 250) },
            S0L:  { to: "S1", tr: T(350, 250).to(250, 310).to(130, 420) },
            S0R:  { to: "wheel", tr: T(350, 250).to(440, 285).to(510, 320).to(530, 400) },
            S1L:  { to: "S2", tr: T(130, 420).to(75, 470).hose(50, 580, 95).to(90, 650) },
            S1R:  { to: "wheel", tr: T(130, 420).to(170, 440).wave(270, 452, 2, 16).boost(370, 462).to(460, 470) },
            wout: { to: "S3", tr: T(530, 540).to(530, 680) },
            S2L:  { to: "a0", tr: T(90, 650).to(45, 720).to(45, RAIL_END) },
            S2R:  { to: "S4", tr: T(90, 650).to(150, 720).to(200, 790).to(215, 840) },
            S3L:  { to: "fer:0", tr: T(530, 680).to(i0[0], i0[1]) },
            S3L2: { to: "a2", tr: T(o0[0], o0[1]).to(355, 780).cork(345, 880, 1, 16).to(340, RAIL_END) },
            S3R:  { to: "a4", tr: T(530, 680).to(615, 740).zebra(1).to(645, 840).zebra(0).to(645, 980).to(625, RAIL_END) },
            S4L:  { to: "a1", tr: T(215, 840).to(170, 900).to(165, RAIL_END) },
            S4R:  { to: "a3", tr: T(215, 840).to(265, 890).under().to(330, 960).to(420, 985).over().to(462, 1015).to(475, RAIL_END) }
          },
          gates: [{ ch: "top", at: [470, 219], cap: 4, p: [470, 110] },
                  { ch: "S0L", at: [230, 330], cap: 4, p: [170, 245] },
                  { ch: "S2R", at: [195, 785], cap: 3, p: [280, 680] },
                  { ch: "S3R", at: [645, 960], cap: 3, p: [580, 950] },
                  { ch: "S3L2", at: [341, 1040], cap: 3, p: [260, 1000] }],
          chimes: [["top", 530, 203], ["S0L", 300, 280], ["S0R", 470, 300], ["S2R", 150, 720], ["S3R", 645, 900]],
          sink: [560, 1000],
          back: {
            east: { to: "sink", tr: T(600, 300).to(690, 380).coil(620, 26, 3).to(690, 760).to(600, 900).to(560, 1000) },
            west: { to: "sink", tr: T(260, 330).to(250, 560).loop(30, 1).to(300, 640).to(280, 800).to(400, 900).to(560, 1000) }
          },
          drains: [D("gate:0", "east", [[600, 250], [600, 300]]),
                   D("gate:1", "west", [[260, 330]]),
                   D("gate:2", "west", [[250, 790], [280, 800]]),
                   D("gate:3", "sink", [[600, 1000], [560, 1000]]),
                   D("gate:4", "sink", [[420, 1040], [560, 1000]]),
                   D("wheel:S0R", "east", [[620, 380], [690, 400]]),
                   D("wheel:S1R", "west", [[330, 520], [250, 560]])],
          cogs: [[300, 560, 40, 1], [660, 1000, 30, -1], [120, 300, 26, 1]]
        };
      },
      function () {
        /* 22 · DEPTHS — THE ANCHOR. The wheel hangs high in the middle and the
           whole machine is slung under it: the first switch boards it from above
           or walks a marble down a staircase to a second that boards it from the
           right or drops it down the far side. Under the wheel, a jump to the
           right and a ferry gear to the left open on four arrivals. */
        var f0 = { cx: 125, cy: 600, r: 60, n: 8, from: 40, to: -200, out: "S2L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [440, 235, 0], S1: [640, 380, 1], S2: [320, 650, 0], S3: [120, 820, 1], S4: [420, 820, 0] },
          wheel: { cx: 320, cy: 440, notches: 10, entries: { S0L: Math.PI, S1L: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 45 }, { id: "a1", x: 185 }, { id: "a2", x: 335 }, { id: "a3", x: 485 }, { id: "a4", x: 640 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 185).to(440, 235) },
            S0L:  { to: "wheel", tr: T(440, 235).to(380, 252).hose(200, 320, 150).to(150, 370).to(170, 420).to(250, 440) },
            S0R:  { to: "S1", tr: T(440, 235).to(470, 250).steps(620, 340, 3).to(640, 380) },
            S1L:  { to: "wheel", tr: T(640, 380).to(560, 410).to(480, 435).to(390, 440) },
            S1R:  { to: "a4", tr: T(640, 380).to(648, 450).to(648, 620).coil(760, 20, 2).zebra(1).to(645, 960).zebra(0).to(640, RAIL_END) },
            wout: { to: "S2", tr: T(320, 510).to(320, 650) },
            S2L:  { to: "fer:0", tr: T(320, 650).to(i0[0], i0[1]) },
            S2L2: { to: "S3", tr: T(o0[0], o0[1]).to(55, 690).to(70, 760).to(120, 820) },
            S2R:  { to: "S4", tr: T(320, 650).to(350, 670).jump(470, 710).to(462, 770).to(420, 820) },
            S3L:  { to: "a0", tr: T(120, 820).to(55, 890).to(45, RAIL_END) },
            S3R:  { to: "a1", tr: T(120, 820).to(185, 890).to(185, RAIL_END) },
            S4L:  { to: "a2", tr: T(420, 820).to(350, 890).to(335, RAIL_END) },
            S4R:  { to: "a3", tr: T(420, 820).to(485, 890).to(485, RAIL_END) }
          },
          gates: [{ ch: "top", at: [520, 210], cap: 4, p: [550, 100] },
                  { ch: "S1R", at: [648, 600], cap: 3, p: [575, 590] },
                  { ch: "wout", at: [320, 640], cap: 2, p: [200, 520] },
                  { ch: "S4R", at: [485, 1000], cap: 3, p: [555, 985] },
                  { ch: "S3R", at: [185, 1000], cap: 3, p: [270, 930] }],
          chimes: [["top", 560, 198], ["S0L", 160, 395], ["S1L", 520, 422], ["S4L", 350, 900], ["S3L", 55, 940]],
          sink: [410, 1000],
          back: {
            east: { to: "sink", tr: T(560, 290).to(690, 360).coil(700, 24, 3).to(690, 860).to(600, 940).to(410, 1000) },
            west: { to: "sink", tr: T(250, 540).to(240, 640).loop(28, 1).to(260, 760).to(300, 900).to(410, 1000) }
          },
          drains: [D("gate:0", "east", [[560, 260], [560, 290]]),
                   D("gate:1", "east", [[690, 560]]),
                   D("gate:2", "west", [[280, 600], [245, 620]]),
                   D("gate:3", "sink", [[450, 1030], [410, 1000]]),
                   D("gate:4", "sink", [[260, 1030], [410, 1000]]),
                   D("wheel:S0L", "west", [[230, 480], [250, 540]]),
                   D("wheel:S1L", "east", [[500, 470], [600, 520], [690, 560]])],
          cogs: [[90, 260, 34, 1], [440, 580, 30, -1], [470, 620, 16, 1]]
        };
      },
      function () {
        /* 23 · DEPTHS — THE MINE SHAFT. A mine shaft in floors: the top runs
           left over humps, the first floor back right through a booster to a
           ferry gear that turns the marble round, the next left again over a jump,
           the last right into a wheel low on the right. The far left falls the
           whole height down a hose, and a whirlpool swallows the middle left. */
        var f0 = { cx: 600, cy: 400, r: 55, n: 8, from: 200, to: 450, out: "S0R2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [130, 280, 1], S1: [430, 500, 0], S2: [170, 650, 1], S3: [240, 860, 0], S4: [530, 900, 1] },
          wheel: { cx: 530, cy: 720, notches: 10, entries: { S1R: -Math.PI / 2, S2R: Math.PI }, out: "wout" },
          arr: [{ id: "a0", x: 45 }, { id: "a1", x: 180 }, { id: "a2", x: 315 }, { id: "a3", x: 450 }, { id: "a4", x: 620 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 185).to(480, 212).wave(220, 255, 3, 16).to(130, 280) },
            S0L:  { to: "a0", tr: T(130, 280).to(75, 330).hose(45, 480, 90).to(45, RAIL_END) },
            S0R:  { to: "fer:0", tr: T(130, 280).to(220, 322).boost(380, 352).to(i0[0], i0[1]) },
            S0R2: { to: "S1", tr: T(o0[0], o0[1]).to(430, 500) },
            S1L:  { to: "S2", tr: T(430, 500).to(330, 540).jump(210, 570).to(200, 620).to(170, 650) },
            S1R:  { to: "wheel", tr: T(430, 500).to(490, 560).to(525, 600).to(530, 650) },
            S2L:  { to: "S3", tr: T(170, 650).to(120, 700).whirl(150, 760, 46, 12, 1.5, -1).to(160, 820).over().to(200, 830).to(240, 860) },
            S2R:  { to: "wheel", tr: T(170, 650).to(260, 690).to(460, 720) },
            wout: { to: "S4", tr: T(530, 790).to(530, 900) },
            S3L:  { to: "a1", tr: T(240, 860).to(180, 930).to(180, RAIL_END) },
            S3R:  { to: "a2", tr: T(240, 860).to(310, 930).to(315, RAIL_END) },
            S4L:  { to: "a3", tr: T(530, 900).to(460, 960).to(450, RAIL_END) },
            S4R:  { to: "a4", tr: T(530, 900).to(610, 960).to(620, RAIL_END) }
          },
          gates: [{ ch: "top", at: [540, 200], cap: 3, p: [500, 100] },
                  { ch: "S0L", at: [45, 900], cap: 4, p: [110, 980] },
                  { ch: "S0R2", at: [460, 492], cap: 3, p: [600, 530] },
                  { ch: "S3R", at: [315, 1000], cap: 3, p: [380, 990] },
                  { ch: "S2R", at: [260, 690], cap: 2, p: [390, 780] }],
          chimes: [["top", 560, 194], ["S0R", 180, 302], ["S2R", 300, 696], ["S1R", 505, 575], ["S3L", 180, 980]],
          sink: [248, 1000],
          back: {
            east: { to: "sink", tr: T(560, 260).to(690, 300).coil(560, 24, 3).to(690, 860).to(560, 1030).to(400, 1050).to(248, 1000) },
            west: { to: "sink", tr: T(300, 400).to(260, 460).loop(28, -1).to(300, 600).to(340, 800).to(250, 900).to(248, 1000) }
          },
          drains: [D("gate:0", "east", [[560, 240], [560, 260]]),
                   D("gate:1", "west", [[90, 760], [200, 760], [340, 800]]),
                   D("gate:2", "west", [[400, 470], [300, 400]]),
                   D("gate:3", "sink", [[280, 1040], [248, 1000]]),
                   D("gate:4", "west", [[300, 760], [340, 800]]),
                   D("wheel:S1R", "east", [[620, 560], [690, 520]]),
                   D("wheel:S2R", "west", [[330, 760], [340, 800]])],
          cogs: [[300, 470, 30, 1], [640, 620, 34, -1], [100, 560, 22, 1]]
        };
      },
      function () {
        /* 24 · DEPTHS — THE CROSSCURRENT. A staircase brings the top down to a
           wheel hanging on the left, boarded round a loop from the left and from
           the right; under it a ferry gear carries the right half over, and the
           last two switches throw their marbles ACROSS each other, a hose sweeping
           over a tunnel. The far right winds down a corkscrew and a booster. */
        var f0 = { cx: 470, cy: 700, r: 60, n: 8, from: 200, to: 400, out: "S2R2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [340, 320, 0], S1: [560, 470, 1], S2: [230, 690, 0], S3: [100, 820, 1], S4: [470, 820, 0] },
          wheel: { cx: 230, cy: 520, notches: 12, entries: { S0L: Math.PI, S1L: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 45 }, { id: "a1", x: 175 }, { id: "a2", x: 315 }, { id: "a3", x: 495 }, { id: "a4", x: 630 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 185).to(490, 218).steps(355, 300, 3).to(340, 320) },
            S0L:  { to: "wheel", tr: T(340, 320).to(250, 326).to(170, 336).loop(30, -1).to(120, 352).to(95, 410).to(110, 480).to(160, 520) },
            S0R:  { to: "S1", tr: T(340, 320).to(420, 350).zebra(1).to(520, 420).zebra(0).to(560, 470) },
            S1L:  { to: "wheel", tr: T(560, 470).to(470, 500).to(300, 520) },
            S1R:  { to: "a4", tr: T(560, 470).to(635, 530).to(648, 650).cork(650, 790, 1.5, 14).boost(640, 930).to(630, RAIL_END) },
            wout: { to: "S2", tr: T(230, 590).to(230, 690) },
            S2L:  { to: "S3", tr: T(230, 690).to(100, 820) },
            S2R:  { to: "fer:0", tr: T(230, 690).to(330, 700).to(i0[0], i0[1]) },
            S2R2: { to: "S4", tr: T(o0[0], o0[1]).to(490, 780).to(470, 820) },
            S3L:  { to: "a0", tr: T(100, 820).to(50, 880).to(45, RAIL_END) },
            S3R:  { to: "a2", tr: T(100, 820).to(160, 850).hose(305, 950, 75).to(315, 990).to(315, RAIL_END) },
            S4L:  { to: "a1", tr: T(470, 820).to(400, 860).under().to(220, 950).over().to(185, 990).to(175, RAIL_END) },
            S4R:  { to: "a3", tr: T(470, 820).to(495, 880).to(495, RAIL_END) }
          },
          gates: [{ ch: "top", at: [530, 206], cap: 3, p: [500, 100] },
                  { ch: "S1R", at: [648, 640], cap: 3, p: [570, 650] },
                  { ch: "S2L", at: [130, 790], cap: 3, p: [60, 650] },
                  { ch: "S4R", at: [495, 1000], cap: 3, p: [560, 990] },
                  { ch: "S3L", at: [45, 1000], cap: 4, p: [110, 1000] }],
          chimes: [["top", 560, 196], ["S0R", 390, 340], ["S1L", 400, 510], ["S3L", 50, 900], ["S4R", 495, 940]],
          sink: [405, 1000],
          back: {
            east: { to: "sink", tr: T(600, 280).to(690, 340).coil(600, 24, 3).to(690, 860).to(560, 1040).to(405, 1000) },
            west: { to: "sink", tr: T(60, 380).to(50, 450).loop(28, 1).to(120, 600).to(330, 780).to(380, 900).to(405, 1000) }
          },
          drains: [D("gate:0", "east", [[580, 240], [600, 280]]),
                   D("gate:1", "east", [[690, 660]]),
                   D("gate:2", "west", [[160, 720], [200, 690]]),
                   D("gate:3", "sink", [[450, 1040], [405, 1000]]),
                   D("gate:4", "west", [[60, 760], [120, 600]]),
                   D("wheel:S0L", "west", [[60, 440]]),
                   D("wheel:S1L", "east", [[420, 560], [600, 600], [690, 620]])],
          cogs: [[420, 600, 30, 1], [600, 330, 24, -1], [330, 1020, 26, 1], [300, 420, 36, -1]]
        };
      },
      BASE5[4],                    // 25 · CLOCKWORK — THE CHAIN
      function () {
        /* 26 · CLOCKWORK — THE LANDINGS. The line comes down the machine in
           flights, left, right, left: a staircase from the feed gear, a booster
           that throws the marble over a ski jump onto the second landing, a second
           staircase back. Every landing is a switch that lets a marble off down the
           side — a ferry gear and a zebra tube on the left, a corkscrew on the
           right — and the wheel low in the middle catches the third flight. */
        var f0 = { cx: 90, cy: 470, r: 52, n: 8, from: -40, to: -190, out: "S0L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [200, 330, 0], S1: [600, 505, 1], S2: [200, 640, 0], S3: [625, 690, 0], S4: [330, 900, 0], S5: [610, 990, 1] },
          wheel: { cx: 400, cy: 740, notches: 8, entries: { S2R: Math.PI, S3L: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 55 }, { id: "a1", x: 165 }, { id: "a2", x: 275 },
                { id: "a3", x: 390 }, { id: "a4", x: 505 }, { id: "a5", x: 620 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"], S5: ["S5L", "S5R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(590, 180).to(500, 208).steps(260, 300, 4).to(200, 330) },
            S0L:  { to: "fer:0", tr: T(200, 330).to(150, 390).to(i0[0], i0[1]) },
            S0L2: { to: "a0", tr: T(o0[0], o0[1]).to(30, 560).to(28, 720).zebra(1).to(30, 990).zebra(0).to(55, RAIL_END) },
            S0R:  { to: "S1", tr: T(200, 330).to(280, 370).to(350, 390).boost(465, 422).jump(592, 458).to(600, 505) },
            S1L:  { to: "S2", tr: T(600, 505).to(510, 515).to(430, 530).steps(260, 610, 3).to(200, 640) },
            S1R:  { to: "S3", tr: T(600, 505).to(640, 565).to(640, 640).to(625, 690) },
            S2L:  { to: "a1", tr: T(200, 640).to(185, 700).to(185, 1000).to(165, RAIL_END) },
            S2R:  { to: "wheel", tr: T(200, 640).to(250, 710).to(290, 740).to(330, 740) },
            S3L:  { to: "wheel", tr: T(625, 690).to(560, 735).to(470, 740) },
            S3R:  { to: "S5", tr: T(625, 690).to(655, 740).to(660, 800).cork(655, 920, 1, 14).to(610, 990) },
            wout: { to: "S4", tr: T(400, 810).to(390, 850).to(330, 900) },
            S4L:  { to: "a2", tr: T(330, 900).to(285, 970).to(275, RAIL_END) },
            S4R:  { to: "a3", tr: T(330, 900).to(380, 970).to(390, RAIL_END) },
            S5L:  { to: "a4", tr: T(610, 990).to(530, 1030).to(505, RAIL_END) },
            S5R:  { to: "a5", tr: T(610, 990).to(620, RAIL_END) }
          },
          gates: [{ ch: "top", at: [530, 200], cap: 3, p: [430, 310] },
                  { ch: "S0R", at: [350, 390], cap: 3, p: [300, 480] },
                  { ch: "S0L2", at: [28, 700], cap: 4, p: [100, 780] },
                  { ch: "S1R", at: [625, 620], cap: 3, p: [470, 610] },
                  { ch: "S2L", at: [185, 900], cap: 3, p: [100, 980] },
                  { ch: "S3R", at: [660, 800], cap: 3, p: [530, 840] }],
          chimes: [["top", 560, 190], ["S0R", 300, 376], ["S1R", 605, 515], ["S2R", 270, 728], ["S4L", 305, 940]],
          sink: [330, 990],
          back: {
            east: { to: "sink", tr: T(640, 240).to(670, 320).coil(600, 18, 3).to(662, 760).to(560, 880).to(330, 990) },
            west: { to: "sink", tr: T(250, 440).to(240, 520).loop(24, -1).to(225, 640).to(240, 780).to(280, 900).to(330, 990) }
          },
          drains: [D("gate:0", "east", [[640, 240]]),
                   D("gate:1", "west", [[250, 440]]),
                   D("gate:2", "west", [[110, 600], [225, 640]]),
                   D("gate:3", "east", [[668, 560]]),
                   D("gate:4", "west", [[240, 780]]),
                   D("gate:5", "east", [[662, 760]]),
                   D("wheel:S2R", "west", [[235, 720]]),
                   D("wheel:S3L", "east", [[662, 720]])],
          cogs: [[95, 235, 38, 1], [148, 286, 18, -1], [610, 380, 24, 1]]
        };
      },
      function () {
        /* 27 · CLOCKWORK — THE GANTRY. The wheel hangs HIGH in the middle,
           boarded from both sides right under the feed: from the left after a wave
           and a ski jump, from the right across from a second switch. Everything
           else hangs beneath it — a tree of three switches down the middle, a ferry
           gear and a hose down the right — so a marble that boards the wheel still
           has two decisions to fall through. */
        var f0 = { cx: 590, cy: 650, r: 55, n: 8, from: -20, to: 200, out: "S1R2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [420, 220, 1], S1: [610, 420, 0], S2: [330, 620, 0], S3: [150, 760, 1], S4: [460, 780, 0], S5: [590, 960, 1] },
          wheel: { cx: 330, cy: 420, notches: 10, entries: { S0L: Math.PI, S1L: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 55 }, { id: "a1", x: 165 }, { id: "a2", x: 275 },
                { id: "a3", x: 390 }, { id: "a4", x: 505 }, { id: "a5", x: 620 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"], S5: ["S5L", "S5R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 180).to(545, 194).wave(440, 216, 2, 16).to(420, 220) },
            S0L:  { to: "wheel", tr: T(420, 220).to(330, 245).to(260, 262).jump(112, 330).to(104, 380).to(150, 414).to(260, 420) },
            S0R:  { to: "S1", tr: T(420, 220).to(480, 280).to(545, 345).to(610, 420) },
            S1L:  { to: "wheel", tr: T(610, 420).to(480, 425).to(400, 420) },
            S1R:  { to: "fer:0", tr: T(610, 420).to(650, 480).to(660, 560).to(i0[0], i0[1]) },
            S1R2: { to: "S5", tr: T(o0[0], o0[1]).to(528, 730).hose(615, 870, 70).to(590, 960) },
            wout: { to: "S2", tr: T(330, 490).to(330, 620) },
            S2L:  { to: "S3", tr: T(330, 620).to(300, 640).steps(180, 720, 2).to(150, 760) },
            S2R:  { to: "S4", tr: T(330, 620).to(400, 690).to(460, 780) },
            S3L:  { to: "a0", tr: T(150, 760).to(90, 800).to(36, 870).cork(34, 1000, 1.5, 12).to(55, RAIL_END) },
            S3R:  { to: "a1", tr: T(150, 760).to(190, 830).to(190, 990).to(165, RAIL_END) },
            S4L:  { to: "a2", tr: T(460, 780).to(400, 860).to(310, 950).to(275, RAIL_END) },
            S4R:  { to: "a3", tr: T(460, 780).to(465, 880).to(400, 980).to(390, RAIL_END) },
            S5L:  { to: "a4", tr: T(590, 960).to(525, 1010).to(505, RAIL_END) },
            S5R:  { to: "a5", tr: T(590, 960).to(620, 1010).to(620, RAIL_END) }
          },
          gates: [{ ch: "top", at: [548, 193], cap: 3, p: [590, 250] },
                  { ch: "S0L", at: [300, 253], cap: 3, p: [250, 170] },
                  { ch: "S1R", at: [655, 560], cap: 3, p: [500, 580] },
                  { ch: "wout", at: [330, 610], cap: 3, p: [140, 520] },
                  { ch: "S2R", at: [450, 765], cap: 3, p: [303, 836] },
                  { ch: "S3R", at: [190, 960], cap: 3, p: [110, 930] }],
          chimes: [["top", 560, 190], ["S0R", 510, 310], ["S1L", 450, 424], ["S4L", 360, 900], ["S2R", 365, 655]],
          sink: [240, 1000],
          back: {
            east: { to: "sink", tr: T(660, 230).to(676, 320).coil(620, 18, 3).to(660, 740).loop(22, 1).to(560, 900).to(400, 960).to(240, 1000) },
            west: { to: "sink", tr: T(120, 460).to(80, 560).to(95, 680).coil(820, 18, 2).to(150, 920).to(240, 1000) },
            spine: { to: "sink", tr: T(330, 540).to(290, 620).to(250, 740).to(240, 880).to(240, 1000) }
          },
          drains: [D("gate:0", "east", [[660, 230]]),
                   D("gate:1", "west", [[300, 300], [180, 380], [120, 460]]),
                   D("gate:2", "east", [[676, 500]]),
                   D("gate:3", "spine", [[330, 540]]),
                   D("gate:4", "spine", [[275, 690]]),
                   D("gate:5", "west", [[150, 920]]),
                   D("wheel:S0L", "west", [[120, 460]]),
                   D("wheel:S1L", "east", [[620, 470], [676, 520]])],
          cogs: [[230, 640, 30, 1], [262, 604, 14, -1], [640, 860, 24, -1]]
        };
      },
      function () {
        /* 28 · CLOCKWORK — THE LIFT. The first switch stands on the right, and
           its left way runs back across the whole machine down a staircase to the
           far left. The wheel takes one line from each side; under it a big ferry
           gear low on the left LIFTS the marble over its top and lays it on a hose
           to the last switch, while the right edge drops through a booster. */
        var f0 = { cx: 210, cy: 830, r: 66, n: 9, from: 20, to: -150, out: "S3L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [540, 300, 0], S1: [170, 430, 1], S2: [620, 470, 0], S3: [440, 800, 0], S4: [115, 965, 1], S5: [575, 970, 0] },
          wheel: { cx: 420, cy: 620, notches: 10, entries: { S1R: Math.PI, S2L: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 55 }, { id: "a1", x: 165 }, { id: "a2", x: 275 },
                { id: "a3", x: 390 }, { id: "a4", x: 505 }, { id: "a5", x: 620 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"], S5: ["S5L", "S5R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(605, 195).to(575, 250).to(540, 300) },
            S0L:  { to: "S1", tr: T(540, 300).to(330, 360).steps(220, 415, 2).to(170, 430) },
            S0R:  { to: "S2", tr: T(540, 300).to(590, 360).to(620, 470) },
            S1L:  { to: "a0", tr: T(170, 430).to(110, 480).to(40, 560).to(38, 1000).to(55, RAIL_END) },
            S1R:  { to: "wheel", tr: T(170, 430).to(250, 520).to(300, 590).to(350, 620) },
            S2L:  { to: "wheel", tr: T(620, 470).to(560, 560).to(490, 620) },
            S2R:  { to: "S5", tr: T(620, 470).to(660, 540).to(662, 640).boost(662, 780).to(650, 880).to(575, 970) },
            wout: { to: "S3", tr: T(420, 690).to(440, 800) },
            S3L:  { to: "fer:0", tr: T(440, 800).to(340, 845).to(i0[0], i0[1]) },
            S3L2: { to: "S4", tr: T(o0[0], o0[1]).hose(105, 890, 90).to(115, 965) },
            S3R:  { to: "a3", tr: T(440, 800).to(420, 870).coil(1000, 22, 2).to(390, RAIL_END) },
            S4L:  { to: "a1", tr: T(115, 965).to(150, 1010).to(165, RAIL_END) },
            S4R:  { to: "a2", tr: T(115, 965).to(260, 1000).to(275, RAIL_END) },
            S5L:  { to: "a4", tr: T(575, 970).to(515, 1010).to(505, RAIL_END) },
            S5R:  { to: "a5", tr: T(575, 970).to(615, 1010).to(620, RAIL_END) }
          },
          gates: [{ ch: "top", at: [578, 245], cap: 3, p: [420, 175] },
                  { ch: "S0L", at: [340, 357], cap: 3, p: [250, 240] },
                  { ch: "S1L", at: [40, 620], cap: 4, p: [100, 640] },
                  { ch: "S2R", at: [662, 640], cap: 3, p: [590, 730] },
                  { ch: "S3L", at: [330, 850], cap: 3, p: [300, 690] },
                  { ch: "S0R", at: [605, 420], cap: 3, p: [420, 450] }],
          chimes: [["top", 590, 222], ["S1R", 270, 550], ["S2L", 540, 575], ["S3R", 425, 870], ["S0R", 580, 345]],
          sink: [330, 990],
          back: {
            east: { to: "sink", tr: T(620, 240).to(676, 320).to(676, 560).coil(760, 18, 2).to(620, 880).to(330, 990) },
            west: { to: "sink", tr: T(250, 580).to(200, 640).loop(24, -1).to(150, 700).to(300, 900).to(330, 990) }
          },
          drains: [D("gate:0", "east", [[620, 240]]),
                   D("gate:1", "west", [[360, 420], [290, 520], [250, 580]]),
                   D("gate:2", "west", [[150, 560], [200, 640]]),
                   D("gate:3", "east", [[676, 560]]),
                   D("gate:4", "sink", [[380, 900], [330, 990]]),
                   D("gate:5", "east", [[640, 300], [676, 330]]),
                   D("wheel:S1R", "west", [[250, 580]]),
                   D("wheel:S2L", "east", [[650, 520], [676, 540]])],
          cogs: [[90, 250, 36, 1], [140, 300, 16, -1], [500, 880, 24, 1]]
        };
      },
      function () {
        /* 29 · CLOCKWORK — THE CROSSWORK. Two lines cross the machine in an X:
           from the top-left switch one dives under the other's zebra tube and comes
           up through a hose to a switch low on the right; from the top-right, the
           other runs down to a switch low on the left. The wheel takes one from each
           of them, so a marble seldom ends on the side it started; the outer edges
           fall through a ferry gear and a whirlpool. */
        var f0 = { cx: 85, cy: 500, r: 50, n: 8, from: -40, to: -190, out: "S1L2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [380, 260, 0], S1: [180, 360, 1], S2: [600, 460, 0], S3: [130, 700, 1], S4: [600, 740, 0], S5: [360, 975, 1] },
          wheel: { cx: 360, cy: 800, notches: 10, entries: { S3R: Math.PI, S4L: 0 }, out: "wout" },
          arr: [{ id: "a0", x: 55 }, { id: "a1", x: 165 }, { id: "a2", x: 275 },
                { id: "a3", x: 390 }, { id: "a4", x: 505 }, { id: "a5", x: 620 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"], S5: ["S5L", "S5R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 180).to(520, 200).steps(410, 252, 2).to(380, 260) },
            S0L:  { to: "S1", tr: T(380, 260).to(280, 300).to(180, 360) },
            S0R:  { to: "S2", tr: T(380, 260).wave(510, 320, 2, 16).to(600, 460) },
            S1L:  { to: "fer:0", tr: T(180, 360).to(140, 410).to(i0[0], i0[1]) },
            S1L2: { to: "a0", tr: T(o0[0], o0[1]).to(36, 580).to(36, 1000).to(55, RAIL_END) },
            S1R:  { to: "S4", tr: T(180, 360).to(260, 440).to(320, 500).under().to(360, 620).over().to(380, 660).hose(520, 728, 10).to(600, 740) },
            S2L:  { to: "S3", tr: T(600, 460).to(490, 480).to(430, 512).zebra(1).to(360, 560).to(250, 650).zebra(0).to(130, 700) },
            S2R:  { to: "a5", tr: T(600, 460).to(650, 520).to(662, 585).whirl(615, 585, 47, 12, 1.5, 1).to(625, 650).over().to(660, 700).to(662, 1000).to(620, RAIL_END) },
            S3L:  { to: "a1", tr: T(130, 700).to(105, 780).to(110, 1000).to(165, RAIL_END) },
            S3R:  { to: "wheel", tr: T(130, 700).to(200, 760).to(290, 800) },
            S4L:  { to: "wheel", tr: T(600, 740).to(530, 785).to(430, 800) },
            S4R:  { to: "a4", tr: T(600, 740).to(615, 820).to(600, 1000).to(505, RAIL_END) },
            wout: { to: "S5", tr: T(360, 870).to(360, 975) },
            S5L:  { to: "a2", tr: T(360, 975).to(290, 1020).to(275, RAIL_END) },
            S5R:  { to: "a3", tr: T(360, 975).to(385, 1020).to(390, RAIL_END) }
          },
          gates: [{ ch: "top", at: [535, 197], cap: 3, p: [580, 290] },
                  { ch: "S0L", at: [240, 325], cap: 3, p: [150, 190] },
                  { ch: "S1R", at: [260, 440], cap: 3, p: [220, 550] },
                  { ch: "S2L", at: [490, 480], cap: 3, p: [480, 600] },
                  { ch: "S3L", at: [108, 900], cap: 3, p: [210, 890] },
                  { ch: "S4R", at: [612, 880], cap: 3, p: [510, 890] }],
          chimes: [["top", 560, 190], ["S0R", 450, 295], ["S1R", 300, 480], ["S2L", 420, 520], ["S5L", 300, 1015]],
          sink: [455, 990],
          back: {
            east: { to: "sink", tr: T(640, 240).to(676, 330).to(676, 640).coil(820, 18, 2).to(600, 920).to(455, 990) },
            west: { to: "sink", tr: T(240, 420).to(200, 500).to(190, 620).loop(22, -1).to(200, 760).to(300, 900).to(455, 990) }
          },
          drains: [D("gate:0", "east", [[640, 240]]),
                   D("gate:1", "west", [[280, 350], [240, 420]]),
                   D("gate:2", "west", [[240, 420]]),
                   D("gate:3", "east", [[676, 500]]),
                   D("gate:4", "west", [[200, 760]]),
                   D("gate:5", "east", [[676, 830]]),
                   D("wheel:S3R", "west", [[195, 745]]),
                   D("wheel:S4L", "east", [[650, 760], [676, 700]])],
          cogs: [[380, 430, 34, 1], [416, 396, 16, -1], [60, 250, 28, 1]]
        };
      },
      function () {
        /* 30 · CLOCKWORK — THE GRAND CLOCK. The last machine. The first switch
           stands at twelve and sends a marble round the dial either way: clockwise,
           over a ski jump, down the booster on the right edge and over a ferry gear
           onto a hose; counter-clockwise, down a staircase to a chain of three
           switches on the left, two of which may drop it into the wheel — from above,
           or through a loop. The wheel's way out falls straight through a coil to
           an arrival of its own, and the chain ends on a second staircase. */
        var f0 = { cx: 580, cy: 770, r: 55, n: 8, from: 20, to: -200, out: "S0R2" }, i0 = ferPt(f0, f0.from), o0 = ferPt(f0, f0.to);
        return {
          fer: [f0],
          sw: { S0: [400, 240, 0], S1: [160, 380, 1], S2: [90, 600, 0], S3: [100, 790, 1], S4: [280, 940, 0], S5: [560, 960, 1] },
          wheel: { cx: 400, cy: 680, notches: 12, entries: { S1R: -Math.PI / 2, S2R: Math.PI }, out: "wout" },
          arr: [{ id: "a0", x: 55 }, { id: "a1", x: 165 }, { id: "a2", x: 275 },
                { id: "a3", x: 390 }, { id: "a4", x: 505 }, { id: "a5", x: 620 }],
          out: { S0: ["S0L", "S0R"], S1: ["S1L", "S1R"], S2: ["S2L", "S2R"], S3: ["S3L", "S3R"], S4: ["S4L", "S4R"], S5: ["S5L", "S5R"] },
          ch: {
            top:  { to: "S0", tr: T(H0[0], H0[1]).to(600, 178).to(530, 195).to(460, 215).to(400, 240) },
            S0L:  { to: "S1", tr: T(400, 240).to(290, 280).steps(200, 340, 2).to(160, 380) },
            S0R:  { to: "fer:0", tr: T(400, 240).to(450, 330).to(515, 395).jump(640, 465).to(650, 520).to(652, 600).boost(650, 720).to(i0[0], i0[1]) },
            S0R2: { to: "S5", tr: T(o0[0], o0[1]).to(515, 820).hose(545, 900, 80).to(560, 960) },
            S1L:  { to: "S2", tr: T(160, 380).to(105, 430).to(64, 480).cork(56, 560, 1, 12).to(90, 600) },
            S1R:  { to: "wheel", tr: T(160, 380).to(260, 430).to(360, 460).to(400, 500).to(400, 610) },
            S2L:  { to: "S3", tr: T(90, 600).to(55, 680).to(60, 750).to(100, 790) },
            S2R:  { to: "wheel", tr: T(90, 600).to(165, 635).loop(28, 1).to(250, 668).to(330, 680) },
            S3L:  { to: "a0", tr: T(100, 790).to(45, 850).to(30, 920).to(30, 1000).to(55, RAIL_END) },
            S3R:  { to: "S4", tr: T(100, 790).steps(280, 940, 4) },
            S4L:  { to: "a1", tr: T(280, 940).to(195, 1000).to(165, RAIL_END) },
            S4R:  { to: "a2", tr: T(280, 940).to(292, 1010).to(275, RAIL_END) },
            wout: { to: "a3", tr: T(400, 750).to(400, 880).coil(1000, 20, 2).to(390, RAIL_END) },
            S5L:  { to: "a4", tr: T(560, 960).to(515, 1010).to(505, RAIL_END) },
            S5R:  { to: "a5", tr: T(560, 960).to(610, 1010).to(620, RAIL_END) }
          },
          gates: [{ ch: "top", at: [530, 195], cap: 3, p: [590, 270] },
                  { ch: "S0L", at: [295, 278], cap: 3, p: [220, 200] },
                  { ch: "S0R", at: [652, 600], cap: 3, p: [520, 540] },
                  { ch: "S1R", at: [310, 445], cap: 3, p: [250, 530] },
                  { ch: "wout", at: [400, 860], cap: 3, p: [310, 772] },
                  { ch: "S3L", at: [30, 940], cap: 3, p: [90, 975] }],
          chimes: [["top", 560, 188], ["S1R", 220, 410], ["S2R", 200, 655], ["S0R2", 515, 815], ["S4L", 220, 980]],
          sink: [340, 995],
          back: {
            east: { to: "sink", tr: T(640, 240).to(676, 330).to(676, 560).coil(800, 16, 2).to(600, 900).to(340, 995) },
            west: { to: "sink", tr: T(330, 300).to(285, 410).to(250, 560).to(235, 700).loop(22, -1).to(240, 840).to(340, 995) }
          },
          drains: [D("gate:0", "east", [[640, 240]]),
                   D("gate:1", "west", [[330, 300]]),
                   D("gate:2", "east", [[676, 530]]),
                   D("gate:3", "west", [[285, 420]]),
                   D("gate:4", "sink", [[360, 880], [340, 995]]),
                   D("gate:5", "west", [[130, 880], [240, 840]]),
                   D("wheel:S1R", "west", [[275, 480]]),
                   D("wheel:S2R", "west", [[240, 690]])],
          cogs: [[110, 250, 30, 1], [148, 296, 14, -1], [545, 665, 22, 1]]
        };
      }
    ];

    /* ---------------- building a layout ------------------------------- */
    // Resample every channel to one point every DS px, keeping depth, glass
    // and the pipe mouths.
    function makeChannel(id, to, raw) {
      var xs = [], ys = [], zs = [], gs = [], mouths = [], i, a, b, dx, dy, L, s, q, carry = 0;
      xs.push(raw[0][0]); ys.push(raw[0][1]); zs.push(raw[0][2]); gs.push(0);
      for (i = 1; i < raw.length; i++) {
        a = raw[i - 1]; b = raw[i];
        dx = b[0] - a[0]; dy = b[1] - a[1]; L = Math.sqrt(dx * dx + dy * dy); s = DS - carry;
        while (s <= L) {
          q = s / L;
          xs.push(a[0] + dx * q); ys.push(a[1] + dy * q); zs.push(a[2] + (b[2] - a[2]) * q); gs.push(b[3]);
          s += DS;
        }
        carry = L - (s - DS);
        if (b[4]) mouths.push(xs.length - 1);
      }
      var last = raw[raw.length - 1];
      xs.push(last[0]); ys.push(last[1]); zs.push(last[2]); gs.push(last[3]);
      return { id: id, to: to, xs: xs, ys: ys, zs: zs, gs: gs, n: xs.length, len: (xs.length - 1) * DS,
               mouths: mouths, gate: null };
    }
    function nearestD(ch, x, y) {
      var bi = 0, bd = 1e18, i, d;
      for (i = 0; i < ch.n; i++) { d = (ch.xs[i] - x) * (ch.xs[i] - x) + (ch.ys[i] - y) * (ch.ys[i] - y); if (d < bd) { bd = d; bi = i; } }
      return bi * DS;
    }
    var LAY = [];                   // the built layouts, one per level, made on first use
    function layout(b) {
      if (LAY[b]) return LAY[b];
      var src = LAYOUTS[b](), L = { n: b, b: Math.floor(b / 6), CH: {}, sw: src.sw, wheel: src.wheel, arr: src.arr, out: src.out,
                                     gates: src.gates, chimes: src.chimes, bowls: [], props: [], order: [] }, k, c, i;
      for (k in src.ch) if (src.ch.hasOwnProperty(k)) {
        c = src.ch[k];
        L.CH[k] = makeChannel(k, c.to, c.tr.p);
        for (i = 0; i < c.tr.bowls.length; i++) L.bowls.push(c.tr.bowls[i]);
        L.CH[k].mods = [];
        for (i = 0; i < c.tr.mods.length; i++)
          L.CH[k].mods.push({ kind: c.tr.mods[i].kind, n: c.tr.mods[i].n || 0,
                              d: nearestD(L.CH[k], c.tr.mods[i].x, c.tr.mods[i].y) });
        for (i = 0; i < c.tr.props.length; i++) L.props.push(c.tr.props[i]);
      }
      for (k in src.sw) if (src.sw.hasOwnProperty(k)) L.order.push(k);
      // the ferry gears, in radians, and the line that ends on each one
      L.fer = [];
      for (i = 0; i < (src.fer || []).length; i++) {
        c = src.fer[i];
        L.fer.push({ cx: c.cx, cy: c.cy, r: c.r, n: c.n, out: c.out, a0: c.from * Math.PI / 180,
                     dir: c.to > c.from ? 1 : -1, travel: Math.abs(c.to - c.from) * Math.PI / 180 });
      }
      for (k in L.CH) if (L.CH.hasOwnProperty(k) && typeof L.CH[k].to === "string" && L.CH[k].to.indexOf("fer:") === 0)
        L.CH[k].ferK = +L.CH[k].to.slice(4);
      buildSpill(L, src);
      // Arrivals: the half-width of a mouth is what the tightest pair leaves.
      var gap = 1e9;
      for (i = 1; i < L.arr.length; i++) gap = Math.min(gap, L.arr[i].x - L.arr[i - 1].x);
      L.mouthW = Math.min(52, gap / 2 - 6);
      L.reach = reachTable(L);
      L.pay = {};
      for (i = 0; i < L.arr.length; i++) L.pay[L.arr[i].id] = payPath(L, L.arr[i].id);
      LAY[b] = L;
      return L;
    }
    /* THE SPILL NETWORK. Every queue (a gate's, a wheel entry's) ends on a
       trapdoor one slot past its last one: a marble that finds the queue full
       drops through it onto a DRAIN, which dives behind the machine and joins
       the BACK lines, which run into the SINK — the red socket at the back
       that costs a heart. All of it is decor except that heart: no switch, no
       gate, no tap behind. A drain is written as a function of the trapdoor's
       point, since that point depends on the queue's capacity and on the
       resampling; `into` is a back line or "sink". A line that runs into
       another lands on it where it ends (`join`, its distance along it). */
    function queueTail(L, q) {
      var ch, g, i;
      if (q.indexOf("gate:") === 0) {
        g = L.gates[+q.slice(5)]; ch = L.CH[g.ch];
        return { ch: ch, d: nearestD(ch, g.at[0], g.at[1]) - g.cap * 2.2 * R };
      }
      ch = L.CH[q.slice(6)];
      return { ch: ch, d: ch.len - M.waitCap * 2.2 * R };
    }
    function buildSpill(L, src) {
      var k, c, i, d, tl, p, id, ch, to;
      L.sink = src.sink || null; L.cogs = src.cogs || []; L.drainOf = {};
      for (k in src.back || {}) if (src.back.hasOwnProperty(k)) {
        c = src.back[k];
        L.CH[k] = makeChannel(k, c.to, c.tr.behind(0).p);
        L.CH[k].spill = true;
      }
      for (i = 0; i < (src.drains || []).length; i++) {
        d = src.drains[i]; tl = queueTail(L, d.q); p = at(tl.ch, tl.d, {});
        id = "spill:" + d.q;
        L.CH[id] = makeChannel(id, d.into, d.tr(p.x, p.y).behind(1).p);
        L.CH[id].spill = true;
        L.drainOf[d.q] = id;
      }
      for (k in L.CH) if (L.CH.hasOwnProperty(k)) {
        ch = L.CH[k];
        if (!ch.spill || ch.to === "sink") continue;
        to = L.CH[ch.to];
        ch.join = nearestD(to, ch.xs[ch.n - 1], ch.ys[ch.n - 1]);
      }
    }

    /* Which channels can still lead to an arrival: a channel reaches `a`
       when it ends in it, in a switch one of whose branches does, or in the
       wheel whose way out does. */
    function reachTable(L) {
      var tab = {}, i, a;
      function reaches(id, a, seen) {
        var ch = L.CH[id], o;
        if (!ch || seen[id]) return false;
        seen[id] = 1;
        if (ch.to === a) return true;
        if (ch.to === "wheel") return reaches(L.wheel.out, a, seen);
        if (ch.ferK != null) return reaches(L.fer[ch.ferK].out, a, seen);
        o = L.out[ch.to];
        return !!o && (reaches(o[0], a, seen) || reaches(o[1], a, seen));
      }
      for (i = 0; i < L.arr.length; i++) {
        a = L.arr[i].id; tab[a] = {};
        for (var id in L.CH) if (L.CH.hasOwnProperty(id)) tab[a][id] = reaches(id, a, {});
      }
      return tab;
    }
    /* The payoff arc's path for an arrival: the shortest walk along the
       channels, either way, from the arrival back to the wheel, then the hub. */
    function payPath(L, arrId) {
      var from = {}, id, ch, q = [arrId], seen = {}, prev = {}, node, i, k, nb;
      // a channel joins its start node and its end node
      function startOf(id) {
        if (id === L.wheel.out) return "wheel";
        for (var f = 0; f < L.fer.length; f++) if (L.fer[f].out === id) return "fer:" + f;
        for (var s in L.out) if (L.out.hasOwnProperty(s) && (L.out[s][0] === id || L.out[s][1] === id)) return s;
        return "feed";
      }
      for (id in L.CH) if (L.CH.hasOwnProperty(id)) from[id] = startOf(id);
      seen[arrId] = 1;
      while (q.length) {
        node = q.shift();
        if (node === "wheel") break;
        for (id in L.CH) if (L.CH.hasOwnProperty(id)) {
          ch = L.CH[id];
          nb = ch.to === node ? from[id] : from[id] === node ? ch.to : null;
          if (!nb || seen[nb] || nb === "feed") continue;
          seen[nb] = 1; prev[nb] = { node: node, ch: id, rev: ch.to === node }; q.push(nb);
        }
      }
      var steps = [];
      node = "wheel";
      while (prev[node]) { steps.unshift(prev[node]); node = prev[node].node; }
      // steps run from the arrival to the wheel; each walks its channel
      var xs = [], ys = [];
      for (k = 0; k < steps.length; k++) {
        ch = L.CH[steps[k].ch];
        for (i = 0; i < ch.n; i += 2) {
          var j = steps[k].rev ? ch.n - 1 - i : i;
          xs.push(ch.xs[j]); ys.push(ch.ys[j]);
        }
      }
      xs.push(L.wheel.cx); ys.push(L.wheel.cy);
      var ls = [0];
      for (i = 1; i < xs.length; i++) {
        ls.push(ls[i - 1] + Math.sqrt((xs[i] - xs[i - 1]) * (xs[i] - xs[i - 1]) + (ys[i] - ys[i - 1]) * (ys[i] - ys[i - 1])));
      }
      return { xs: xs, ys: ys, ls: ls, len: ls[ls.length - 1] };
    }

    var tmpP = { x: 0, y: 0, z: 1, slope: 0, sk: 0 };
    function at(ch, d, o) {
      o = o || tmpP;
      var f = Math.max(0, Math.min(ch.n - 1.001, d / DS)), i = Math.floor(f), q = f - i;
      o.x = ch.xs[i] + (ch.xs[i + 1] - ch.xs[i]) * q;
      o.y = ch.ys[i] + (ch.ys[i + 1] - ch.ys[i]) * q;
      o.z = ch.zs[i] + (ch.zs[i + 1] - ch.zs[i]) * q;
      o.slope = (ch.ys[i + 1] - ch.ys[i]) / DS;
      o.sk = ch.gs[i + 1];
      return o;
    }
    function normalAt(ch, i) {
      var a = Math.max(0, i - 1), b = Math.min(ch.n - 1, i + 1);
      var dx = ch.xs[b] - ch.xs[a], dy = ch.ys[b] - ch.ys[a], L = Math.sqrt(dx * dx + dy * dy) || 1;
      return [-dy / L, dx / L];
    }
    // How much smaller a line is behind the machine.
    function dsc(z) { return z < 0 ? 1 - 0.24 * Math.min(1, -z) : 1; }

    /* THE RETURN, the same on every machine. What an arrival swallows falls
       to the GUTTER, which slopes right, to the foot of the SCREW TOWER: a
       glass column standing on the right edge, an Archimedes screw turning
       in it. A marble waits at its foot for the next turn of the thread,
       rides up in front of the blade and goes in behind the FEED GEAR at the
       top — where it is loaded, off the screen. The screw has `starts`
       threads, so one marble boards every 1 / (starts x turns) s: five a
       second, about the fastest pour, and the gutter queues the rest. */
    var GUTTER_L = 12, GUTTER_Y = 1218;
    var TOWER = { x: 690, bot: 1236, top: 236, hw: 17, wall: 26, starts: 2, pitch: 84, turns: 2.5 };
    var TOWER_V = TOWER.pitch * TOWER.turns;          // px/s a marble climbs at
    function gutterY(x) { return GUTTER_Y + (x - GUTTER_L) * 0.022; }
    /* THE FEED GEAR, where the pour starts: a big cog standing half off the
       right edge, a marble in every pocket. It turns one pocket per pour,
       so it turns faster as the shift speeds up; the pockets come round from
       off the screen full, and the one that reaches `rel` lays its marble on
       the start of the rail (H0). The three pockets on their way down are
       the next marbles of the pour, an electric one included. */
    var FEED = { r: 92, pockets: 10, rel: Math.PI * 160 / 180 };
    FEED.cx = H0[0] - FEED.r * Math.cos(FEED.rel);
    FEED.cy = H0[1] - FEED.r * Math.sin(FEED.rel);
    // THE FERRY GEARS (LAYOUTS, `fer`) all turn at one angular speed, with the tempo.
    var FERRY_OMEGA = 2.4;

    /* ---------------- the fit: machine px -> design px --------------- */
    /* One uniform scale S and an offset. The machine's readable band (TOPY
       to BOTY) is fitted into the Layout; on the web and android builds the
       CTA bar is gone and the two bottom corners carry the shell's controls,
       so the machine also stays above them. What bleeds out of the band is
       only the return circuits in the back, which are ground. */
    var S = 1, OX = 0, OY = 0;
    var CORNER_ROOM = 66;
    function fit() {
      var bottom = Layout.bottom - (CONFIG.layout.ctaHeight > 0 ? 0 : CORNER_ROOM);
      var h = Math.max(200, bottom - Layout.top);
      S = Math.min(view.w / MW, h / (BOTY - TOPY));
      OX = view.w / 2 - (MW / 2) * S;
      OY = Layout.top + (h - (BOTY - TOPY) * S) / 2 - TOPY * S;
    }
    function toDX(x) { return OX + x * S; }
    function toDY(y) { return OY + y * S; }
    var SYS_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';
    var face = SYS_FONT;
    function readFont() {
      var v = "";
      try { v = getComputedStyle(document.documentElement).getPropertyValue("--web-font") || ""; } catch (e) { v = ""; }
      v = v.replace(/^\s+|\s+$/g, "");
      face = v ? v + "," + SYS_FONT : SYS_FONT;
    }
    // A font sized in DESIGN px, set inside the machine transform.
    function font(px, weight) { return (weight || 800) + " " + (px / S).toFixed(1) + "px " + face; }

    /* ---------------- which machine ---------------------------------- */
    /* One machine a level, six levels a biome, five biomes: the stretches the
       level map names on its own card (web.levels.bands). A round with no
       level — the playable, a free round, the endless run — plays the first
       machine of `mix.playableBiome`. */
    function machine() {
      if (!CONFIG.level) return clamp(M.playableBiome | 0, 0, LAYOUTS.length / 6 - 1) * 6;
      return clamp(CONFIG.level - 1, 0, LAYOUTS.length - 1);
    }

    /* ---------------- state ------------------------------------------ */
    var L = null, CH = null;        // the machine this round is played on
    var marbles = [], queue = [], boxes = {}, sw = {}, parts = [], shards = [], rings = [], arcs = [], puffs = [];
    var wheel = null, chimes = [], gates = [], fers = [], sink = null;
    var state = "play", t = 0, feedK = 0, feedTurn = 0, lockT = 0, electricIn = 0, arrival = "a0", path = null;
    var score = 0, combo = 0, bestCombo = 0, hearts = 5, heartsMax = 5, best = 0;
    var heartHit = 0, hubPop = 0, hubBreak = 0, hubZap = 0, zap = 0, overT = 0, ended = false;
    // THE BLACKOUT: a broken combo cuts the machine's lights, longer the bigger it was.
    var BLACKOUT = 0.5, blackT = 0, blackLen = BLACKOUT;
    /* THE FUSE (1 = lit whole), whether it burns this frame, the sparks
       flying from a gate to the hub with the combo they carry, and the slow
       motion a big break plays (seconds left of it). */
    var fuse = 1, fuseBurn = false, fuseOutT = 0, comets = [], slowT = 0;
    var SLOW_TIME = 0.6, SLOW_K = 0.22, COMET_TIME = 0.42;
    var flow = 0, screwSlot = 0, towerQ = [], revealT = -1;
    var stats = null, taught = null, chimeGap = 0, clickGap = 0, lastTick = 0, spaceTap = false;
    var landGap = 0, noteGap = 0, boostGap = 0;      // the moving modules' sounds, never piled up
    var hints = [], hintT = 0;      // the lessons, one on screen at a time

    function lerp(a, b, k) { return a + (b - a) * k; }
    function zapK() { return Math.min(1, zap / ZAP_EASE); }
    function mod(a, m) { return ((a % m) + m) % m; }
    function progress() { return Math.min(1, t / Math.max(1, M.rampSeconds)); }
    function tempo() { return lerp(M.tempoStart, M.tempoEnd, progress()) * MOD.tempo; }
    function pourGap() { return lerp(M.pourStart, M.pourEnd, progress()) * MOD.pour; }
    /* Locks scale with the machine: more gates lock more often, and more of
       them may be locked at once — a share of the gates, rising with the
       clock, so a two-gate tutorial never has both shut. */
    function lockGap() { return 1 / ((M.lockRate + M.lockGain * progress()) * Math.sqrt(gates.length / 4)); }
    function minOpen() { return lerp(M.minOpenStart, M.minOpenEnd, progress()); }
    function lockMax() { return Math.max(1, rawLockMax() - MOD.lockLess); }
    function nextElectric() {
      var ev = MOD.eEvery, jit = Math.min(M.electricJitter, Math.floor(ev / 3));
      return ev - jit + Math.floor(Math.random() * (2 * jit + 1));
    }
    // An electric marble on the machine or on its way down the feed gear.
    function electricAround() {
      var i, m;
      for (i = 0; i < queue.length; i++) if (queue[i] === "e") return true;
      for (i = 0; i < marbles.length; i++) {
        m = marbles[i];
        if (m.e && !m.clone && m.st !== "drop" && m.st !== "dead") return true;
      }
      return false;
    }
    function rollKind() {
      if (!electricAround()) return "e";
      if (MOD.eEvery) { electricIn--; if (electricIn <= 0) { electricIn = nextElectric(); return "e"; } }
      return plainKind();
    }
    function plainKind() {
      if (MOD.goldEvery) { goldIn--; if (goldIn <= 0) { goldIn = MOD.goldEvery; return "g"; } }
      return Math.random() < 0.42 ? "k" : "c";          // chrome, or violet glass
    }
    // The combo's tiers, brought closer by a short-fuse card (tierAt).
    function tier(c) { var n = 0, i; for (i = 0; i < M.tiers.length; i++) if (c >= tierAt(i)) n = i + 1; return n; }
    function mult() { return tier(combo) + 1 + MOD.multAdd; }
    function lockedCount() { var n = 0, i; for (i = 0; i < gates.length; i++) if (gates[i].locked) n++; return n; }
    function gaugeColor(k) { return k >= 0.8 ? C.full : k >= 0.5 ? C.amber : C.calm; }
    function branchAngle(id, dir) {
      var p = at(CH[L.out[id][dir]], 30);
      return Math.atan2(p.y - sw[id].y, p.x - sw[id].x);
    }
    function leads(chId) { return !!L.reach[arrival][chId]; }
    // The way a switch should lie for an electric marble to reach the
    // arrival, or null when either way is as good (or neither is).
    function routeWant(id) {
      var a = leads(L.out[id][0]), b = leads(L.out[id][1]);
      return a && !b ? 0 : b && !a ? 1 : null;
    }
    function newMarble(kind, x, y) {
      var m = { e: kind === "e", k: kind === "k", gold: kind === "g", st: "track", ch: null, d: 0, v: M.vMin, x: x, y: y, z: 1,
                rot: Math.random() * 6, gateOk: false, spent: false };
      marbles.push(m);
      return m;
    }
    function hint(word, opt) { hints.push([word, opt]); }
    function spawn(kind) {
      var m = newMarble(kind, CH.top.xs[0], CH.top.ys[0]);
      m.ch = CH.top;
      if (m.e && splits > 0) { splits--; m.splitter = true; }
      if (m.e) {
        spark(H0[0], H0[1] - 10, C.volt, 10, 220);
        if (!taught.volt) {
          taught.volt = true;
          hint("Electric marble", { sub: CONFIG.copy.hintVolt, kind: "info", icon: "sparkles", hold: 3400 });
        }
      }
    }
    function gateLoad(g) {
      var n = g.q.length, i, m;
      for (i = 0; i < marbles.length; i++) {
        m = marbles[i];
        if (m.st === "track" && m.ch === g.ch && !m.gateOk) n++;
      }
      return n;
    }

    /* ---------------- effects in machine space ----------------------- */
    var PART_MAX = 420;
    function spark(x, y, color, n, speed, up) {
      var i, a, v;
      for (i = 0; i < n && parts.length < PART_MAX; i++) {
        a = Math.random() * PI2; v = (speed || 260) * (0.35 + Math.random() * 0.8);
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (up == null ? 150 : up),
                     life: 0.45 + Math.random() * 0.4, t: 0, color: color, s: 2 + Math.random() * 2.6 });
      }
    }
    function ring(x, y, color, r0, grow, life, width) {
      rings.push({ x: x, y: y, t: 0, color: color, r0: r0 || 20, grow: grow || 160, life: life || 0.7, w: width || 4 });
    }
    function shatterAt(x, y, col, n) {
      var i, a, v;
      for (i = 0; i < n; i++) {
        a = Math.random() * PI2; v = 120 + Math.random() * 300;
        shards.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, a: a, va: (Math.random() - 0.5) * 22,
                      s: 5 + Math.random() * 7, t: 0, life: 0.7 + Math.random() * 0.35, color: col });
      }
    }
    function puff(x, y, n) {
      var i;
      for (i = 0; i < n; i++) {
        puffs.push({ x: x + (Math.random() - 0.5) * 60, y: y + Math.random() * 20, vy: -40 - Math.random() * 50,
                     r: 8 + Math.random() * 10, t: -Math.random() * 0.25, life: 1.1 });
      }
    }
    function popText(mx, my, str, color) {
    }

    /* ---------------- events ----------------------------------------- */
    /* The arrivals that take an electric marble: the socket, and the two
       beside it under a wide-socket card. */
    function isSocket(id) {
      if (id === arrival) return true;
      if (!MOD.wide) return false;
      var a = -1, b = -1, i;
      for (i = 0; i < L.arr.length; i++) { if (L.arr[i].id === arrival) a = i; if (L.arr[i].id === id) b = i; }
      return Math.abs(a - b) === 1;
    }
    /* The player moves the socket: the arrival tapped turns electric blue
       and the one it leaves goes back to violet. */
    function moveSocket(id) {
      if (state !== "play" || !boxes[id] || id === arrival) return false;
      boxes[arrival].col = CLASSIC; boxes[arrival].charge = 0;
      arrival = id; path = L.pay[id];
      var mc = boxes[id];
      mc.col = C.volt; mc.kick = 0.5; mc.charge = 1;
      spark(mc.x, RIM_Y + 20, C.volt, 16, 240);
      ring(mc.x, RIM_Y + 40, C.volt, 16, 170, 0.5, 4);
      stats.moves++;
      return true;
    }
    function inMachine() {
      var n = 0, i, st;
      for (i = 0; i < marbles.length; i++) { st = marbles[i].st; if (st === "track" || st === "wait" || st === "wheel" || st === "gate" || st === "fwait" || st === "ferry") n++; }
      return n;
    }
    // What a delivery is worth on top of its base: the multiplier and every
    // running card that scales a delivered marble.
    function payK(m) {
      var k = mult() * MOD.score * (1 + MOD.packed * inMachine()) * (m.tag || 1);
      if (chargeT > 0) k *= 3;
      return k;
    }
    function deliver(m, id) {
      var mc = boxes[id], e = m.e, pts;
      // Whatever an arrival swallows falls through it to the gutter and goes home.
      m.st = "drop"; m.vy = 0;
      m.e = false; m.spent = true;
      mc.led = (mc.led + 1) % 5; mc.sweep = 0.4;
      if (e && isSocket(id)) {
        stats.eOn++; stats.delivered++;
        // the catch is an action: it relights the fuse now, and its arc
        // brings the combo jump when it reaches the hub
        feedFuse();
        pts = Math.round(M.electricScore * MOD.eScore * payK(m));
        score += pts;
        if (dnFlag && !m.clone) { dnFlag = false; score *= 2; Pop.show("record", { word: "Double!", sub: "x2" }); }
        HUD.setScore(score); HUD.punch(C.volt);
        arcs.push({ t: 0, jump: M.electricJump * MOD.comboStep, rev: false, path: L.pay[id], id: Math.random() });
        mc.kick = 0.7; mc.charge = 1;
        Fx.shake(7, 0.22); Fx.flash(C.volt, 0.16);
        spark(mc.x, RIM_Y + 20, C.volt, 30, 320);
        ring(mc.x, RIM_Y + 40, C.volt, 20, 180, 0.8, 5);
        ring(mc.x, RIM_Y + 40, C.voltHi, 10, 240, 0.6, 3);
        Pop.show("bonus", { word: "Charged!", sub: "+" + pts, at: "top" });
        if (MOD.over) chargeT = MOD.over;
        // a charged socket deals the cards, once the arc has reached the hub
        if (!m.clone && !pendingPick && !held && charge() >= 1) { pendingPick = true; pickT = KC.pickDelay; }
        return;
      }
      if (e) {
        mc.fizz = 0.9;
        puff(mc.x, RIM_Y + 10, 7);
        spark(mc.x, RIM_Y + 10, C.volt, 8, 120, 60);
        if (m.clone) return;                           // a clone that misses just goes out
        if (seconds > 0) {
          seconds--; queue.unshift("e");
          Pop.show("bonus", { word: "Second chance", at: "top" });
          paintRun();
          return;
        }
        stats.eWasted++;
        Pop.show("alert", { word: "Fizzle", sub: combo >= 2 ? "Combo lost" : "" });
        if (dnFlag) { dnFlag = false; score = Math.floor(score / 2); HUD.setScore(score); Pop.show("alert", { word: "Halved" }); }
        breakCombo(true);
        if (MOD.fizzleHurts) loseHeart();
        return;
      }
      stats.delivered++;
      pts = Math.round(M.classicScore * MOD.classicK * (m.gold ? 5 : 1) * payK(m));
      // a train: marbles landing in one arrival back to back
      if (MOD.train && rt - (mc.lastT || -9) < 0.5) mc.train = (mc.train || 0) + 1; else mc.train = 0;
      mc.lastT = rt;
      if (MOD.train && mc.train) pts += Math.round(MOD.train * mc.train * mult());
      score += pts;
      HUD.setScore(score);
      popText(mc.x, RIM_Y - 14, (MOD.train && mc.train ? Lang.t("Train x") + (mc.train + 1) + " +" : "+") + pts, m.gold ? C.gold2 : mc.col);
      mc.kick = 0.3; hubPop = Math.max(hubPop, 0.2);
      spark(mc.x, RIM_Y + 4, m.gold ? C.gold2 : mc.col, m.gold ? 14 : 4, 180);
      Sound.clip("deliver", 0.26, mc.pitch * Rand.range(0.97, 1.04));
    }
    // `quiet` when another callout already speaks on this frame: two Pops
    // fired together land on top of each other.
    function tierUp(quiet) {
      var tr = tier(combo), tc = TIERS_COL[tr];
      hubPop = 0.6;
      HUD.punch(tc);
      Fx.shake(5, 0.2);
      spark(L.wheel.cx, L.wheel.cy, tc, 26, 320);
      ring(L.wheel.cx, L.wheel.cy, tc, RIM, 200, 0.8, 5);
      Sound.clip("chain", 0.42, 0.94 + tr * 0.08);
      Overlay.vignette(tc, 0.5, 500);
      if (quiet) return;
      if (tr >= 3) Pop.show("ultra", { word: "Overdrive", sub: Lang.t("Combo x") + combo });
      else Pop.show(tr === 2 ? "perfect" : "combo", { word: Lang.t("Combo x") + combo, sub: "x" + mult() });
    }
    // The ring on the hub shatters and the glow goes out.
    function breakCombo(quiet) {
      var i, a, v, tc, floor;
      // a combo shield takes the break, a combo anchor holds the last tier
      if (combo >= 2 && shields > 0) {
        shields--;
        ring(L.wheel.cx, L.wheel.cy, C.calm, RIM, 200, 0.7, 5);
        Pop.show("bonus", { word: "Shielded", at: "top" });
        paintRun();
        return;
      }
      floor = MOD.floor && tier(combo) ? tierAt(tier(combo) - 1) : 0;
      if (floor) {
        if (combo > floor) { hubBreak = 0.3; ring(L.wheel.cx, L.wheel.cy, C.amber, RIM, 160, 0.6, 4); }
        combo = floor;
        return;
      }
      if (combo >= 2) {
        shatterHub(heat(), TIERS_COL[tier(combo)], true);
        if (!quiet && combo >= tierAt(0)) Pop.show("alert", { word: "Combo lost" });
      }
      combo = 0; fuse = 1;
    }
    /* The ring on the hub flies apart, as hard as the combo was big (k is
       heat(), 0..1): more shards, a longer shake and — for an error, not
       for a fuse burnt out — a blackout that lasts longer, and from the
       second tier up the machine drops into slow motion for a beat. */
    function shatterHub(k, tc, error) {
      var i, a, v, n = Math.round(10 + 30 * k);
      for (i = 0; i < n; i++) {
        a = i / n * PI2 + Math.random() * 0.3; v = 160 + Math.random() * (160 + 260 * k);
        shards.push({ x: L.wheel.cx + Math.cos(a) * 44, y: L.wheel.cy + Math.sin(a) * 44, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
                      a: a + Math.PI / 2, va: (Math.random() - 0.5) * 18, s: 5 + 4 * k, t: 0, life: 0.7 + 0.5 * k, color: tc });
      }
      ring(L.wheel.cx, L.wheel.cy, tc, RIM, 220 + 380 * k, 0.6 + 0.5 * k, 4 + 6 * k);
      hubBreak = 0.6;
      if (error) {
        blackLen = BLACKOUT * (0.7 + 1.1 * k); blackT = blackLen;
        Sound.clip("blackout", 0.4 + 0.3 * k, 1 - 0.18 * k);
      } else {
        Sound.clip("blackout", 0.3, 1.25);
      }
      Fx.shake(5 + 13 * k, 0.2 + 0.3 * k);
      if (k >= 0.4) { slowT = SLOW_TIME; Fx.flash(tc, 0.12 + 0.18 * k); }
    }

    /* ---------------- THE COMBO: what feeds it, the fuse that keeps it -- */
    // How big the combo is, 0 at nothing and 1 at the top tier: what every
    // effect that grows with the combo reads.
    function heat() { return Math.min(1, combo / tierAt(M.tiers.length - 1)); }
    function fuseSecs() { return M.fuse[Math.min(M.fuse.length - 1, tier(combo))]; }
    // Every action that feeds the combo relights the fuse whole.
    function feedFuse() { fuse = 1; fuseOutT = 0; }
    /* A spark carrying `n` of combo from (x, y) on the machine to the hub;
       the combo grows when it lands, so the hub counts up in step with what
       the player sees fly in. The fuse is relit at once, on the action. */
    function comboSpark(x, y, n) {
      feedFuse();
      comets.push({ x: x, y: y, t: 0, n: n, dl: comets.length ? 0.03 : 0 });
    }
    // A spark lands: the combo grows by what it carried, on a rising note
    // that climbs the scale toward the next tier.
    var SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14];
    function landSpark(c) {
      var b = tier(combo), tr, lo, hi, step;
      combo += c.n; if (combo > bestCombo) bestCombo = combo;
      tr = tier(combo);
      lo = tr ? tierAt(tr - 1) : 0; hi = tr < M.tiers.length ? tierAt(tr) : 0;
      step = hi ? Math.floor((combo - lo) / (hi - lo) * (SCALE.length - 1)) : SCALE.length - 1;
      hubPop = Math.max(hubPop, 0.25 + 0.2 * heat());
      spark(L.wheel.cx, L.wheel.cy, TIERS_COL[tr], 6 + Math.round(10 * heat()), 200 + 120 * heat());
      Sound.clip("chime", 0.22 + 0.14 * heat(), Math.pow(2, SCALE[step] / 12) * (tr >= 2 ? 1.25 : 1));
      if (tr > b) tierUp();
    }
    // Is the machine waiting on the player? A gate locked, or the electric
    // marble on a line that can no longer reach the socket.
    function needsPlayer() {
      var i, m, id, a, ok;
      for (i = 0; i < gates.length; i++) if (gates[i].locked) return true;
      for (i = 0; i < marbles.length; i++) {
        m = marbles[i];
        if (!m.e || m.clone || m.spent) continue;
        id = m.st === "wheel" ? L.wheel.out : m.st === "ferry" ? m.fer.f.out
           : (m.st === "track" || m.st === "wait" || m.st === "gate" || m.st === "fwait") && m.ch ? m.ch.id : null;
        if (!id) continue;
        ok = false;
        for (a in boxes) if (boxes.hasOwnProperty(a) && isSocket(a) && L.reach[a][id]) ok = true;
        if (!ok) return true;
      }
      return false;
    }
    /* The fuse burnt out: the combo drops to the start of the tier below
       (a combo anchor holds the tier it is on), and the fuse is relit for
       what is left. Below the first tier it simply goes out. */
    function fuseOut() {
      var tr = tier(combo), to = MOD.floor ? (tr ? tierAt(tr - 1) : 0) : (tr >= 2 ? tierAt(tr - 2) : 0), k = heat();
      fuse = 1;
      if (to >= combo) return;
      shatterHub(k * 0.6, TIERS_COL[tr], false);
      combo = to;
      stats.fuseOuts++;
      fuseOutT = 0.8;
    }
    function tickCombo(dt) {
      var i, c;
      for (i = comets.length - 1; i >= 0; i--) {
        c = comets[i];
        if (c.dl > 0) { c.dl -= dt; continue; }
        c.t += dt / COMET_TIME;
        if (c.t >= 1) { comets.splice(i, 1); landSpark(c); }
      }
      fuseOutT = Math.max(0, fuseOutT - dt);
      fuseBurn = state === "play" && combo > 0 && !comets.length && needsPlayer();
      if (fuseBurn) {
        fuse -= dt / fuseSecs();
        if (fuse <= 0) fuseOut();
      }
      if (combo > 0 && !taught.fuse) {
        taught.fuse = true;
        hint("Keep the fuse lit", { sub: CONFIG.copy.hintFuse, kind: "info", icon: "hourglass", hold: 3600 });
      }
    }
    // A heart goes: the HUD, the cue, and the end of the shift on the last one.
    function loseHeart(n) {
      heartHit = 0.7;
      if (state !== "play") return;
      hearts = Math.max(0, hearts - (n || 1));
      stats.heartsLost += n || 1;           // the third star's allowance (levelFaults)
      showHearts();
      Sound.clip("heart", 0.5, 1);
      if (hearts <= 0) {
        state = "over"; overT = 1.0;
        Overlay.vignette(C.full, 0.9);
      } else if (hearts === 1) {
        Overlay.vignette(C.full, 0.55);
        Notify.say("Last heart", { kind: "loss", icon: "heart" });
      }
    }
    // A full queue with no drain (none of the five machines has one) shatters
    // the marble on the spot, and that costs the heart at once.
    function destroy(m, flashOn) {
      var col = m.e ? C.volt : m.gold ? C.gold2 : m.k ? C.chrome : "#b48cff";
      m.st = "dead";
      if (m.clone) { shatterAt(m.x, m.y, col, 8); return; }
      stats.destroyed++;
      if (flashOn) flashOn.broke = 0.6;
      shatterAt(m.x, m.y, col, 14);
      spark(m.x, m.y, "#ffffff", 8, 260);
      ring(m.x, m.y, C.full, R, 170, 0.6, 5);
      Sound.clip("shatter", 0.6, Rand.range(0.92, 1.06));
      Fx.shake(12, 0.3); Fx.flash(C.full, 0.22); Fx.freeze(0.05);
      var hadCombo = combo >= 2;
      breakCombo(true);
      if (state !== "play") return;
      if (catchLost(m)) return;
      Pop.show("alert", { word: "Shattered", sub: hadCombo ? "Combo lost" : "" });
      loseHeart(heavy ? 3 : 1); heavy = false; paintRun();
    }
    // A safety net: a lost marble rolls back to the feed gear instead of a heart.
    function catchLost(m) {
      if (nets <= 0) return false;
      nets--; queue.unshift(m.e ? "e" : m.gold ? "g" : m.k ? "k" : "c");
      Pop.show("bonus", { word: "Caught", at: "top" });
      spark(H0[0], H0[1] - 10, C.calm, 12, 200);
      paintRun();
      return true;
    }
    /* A marble that finds a full queue drops through the trapdoor at its
       tail and rides the spill network behind the machine to the red sink.
       The combo breaks NOW, at the mistake; the heart goes when the marble
       lands, seconds later and in view, so the player sees it coming. */
    function spill(m, sp, g) {
      if (!sp || m.clone) { destroy(m, g); return; }
      m.ch = sp; m.d = 0; m.v = M.vMin; m.lost = true; m.gateOk = true;
      stats.spilled++;
      if (g) g.broke = 0.6;
      ring(m.x, m.y, C.full, R, 120, 0.5, 4);
      spark(m.x, m.y, C.full, 6, 150);
      Sound.clip("lock", 0.5, 0.72);
      Fx.shake(5, 0.18);
      var hadCombo = combo >= 2;
      breakCombo(true);
      if (state !== "play") return;
      Pop.show("alert", { word: "Overflow", sub: hadCombo ? "Combo lost" : "" });
      if (!taught.spill) {
        taught.spill = true;
        hint("Lost marble", { sub: CONFIG.copy.hintSpill, kind: "warn", icon: "heart", hold: 3200 });
      }
    }
    // A lost marble reaches the red sink: it is gone, and so is a heart.
    function sinkHit(m) {
      var x = L.sink[0], y = L.sink[1];
      m.st = "dead";
      sink.kick = 0.7;
      spark(x, y + 10, C.full, 16, 220);
      ring(x, y + 10, C.full, 12, 150, 0.6, 4);
      Sound.clip("shatter", 0.4, 0.8);
      if (state !== "play") { loseHeart(); return; }
      // the red jackpot pays for it; the net sends it back; otherwise, a heart
      if (MOD.redPays) {
        var pts = Math.round(MOD.redPays * mult() * MOD.score);
        score += pts; HUD.setScore(score);
        popText(x, y - 26, "+" + pts, C.gold2);
        spark(x, y + 10, C.gold2, 14, 220);
        return;
      }
      if (catchLost(m)) return;
      Fx.shake(8, 0.24); Fx.flash(C.full, 0.16);
      popText(x, y - 26, heavy ? "-3" : "-1", C.heart);
      loseHeart(heavy ? 3 : 1); heavy = false; paintRun();
    }
    function lockOne() {
      var pool = [], i, g;
      for (i = 0; i < gates.length; i++) { g = gates[i]; if (!g.locked && !g.flush && g.open >= minOpen()) pool.push(g); }
      if (!pool.length) return;
      g = pool[Math.floor(Math.random() * pool.length)];
      g.locked = true; g.lockAge = 0; stats.locks++; g.locks = (g.locks || 0) + 1;
      ring(g.px, g.py, C.amber, 30, 140, 0.6, 4);
      Sound.clip("lock", 0.46, Rand.range(0.95, 1.05));
      if (!taught.lock) {
        taught.lock = true;
        hint(CONFIG.copy.hintLock, { kind: "warn", icon: "lock", hold: 3200 });
      }
    }
    function unlock(g) {
      if (state !== "play" || !g || !g.locked) return false;
      g.locked = false; g.open = 0; g.pop = 0.4; stats.unlocks++;
      // the combo: one spark per marble the burst releases, one for an empty gate
      if (g.q.length) { g.flush = true; g.flushT = 0; feedFuse(); }
      else comboSpark(g.px, g.py, MOD.comboStep);
      spark(g.px, g.py, C.calm, 14, 260);
      ring(g.px, g.py, C.calm, 30, 180, 0.5, 4);
      Sound.clip("unlock", 0.42, 1 + g.q.length * 0.03);
      if (MOD.unlockPay) {
        var pts = Math.round(MOD.unlockPay * mult());
        score += pts; HUD.setScore(score);
        popText(g.px, g.py - 46, "+" + pts, C.gold2);
      }
      return true;
    }
    function flip(id, byMarble) {
      var s = sw[id];
      s.dir = 1 - s.dir; s.flash = FLIP_TIME * 2;
      if (!byMarble) {
        s.spin += 0.6; s.snap = 0.22;
        Sound.clip("flip", 0.5, s.dir ? 1.08 : 0.94);
        var a = branchAngle(id, s.dir);
        spark(s.x + Math.cos(a) * 58, s.y + Math.sin(a) * 58, C.steelL, 5, 150);
      } else if (clickGap <= 0) {
        clickGap = 0.09;
        Sound.clip("flip", 0.4, 1.3);
      }
    }
    function releaseGate(g, v) {
      var gm = g.q.shift();
      gm.st = "track"; gm.gateOk = true; gm.v = v; gm.d = Math.max(gm.d, g.d - R) + 1;
      if (MOD.releaseTag) gm.tag = MOD.releaseTag;
      return gm;
    }

    /* ===============================================================
       THE UPGRADE CARDS — the catalogue. Pure data, copied as it stands
       into lab/gearball-cards.html, where the look of a card is chosen.

       A FAMILY is one effect and each of its tiers one card:
         biome  the first biome whose levels deal it (1 Workshop ... 5
                Clockwork); a round deals every family of its biome and the
                ones before, the playable and a free round the first biome's
         kind   help, score, risk or legend — what the DEAL reads (one help
                card against one of the others). It is never drawn: the two
                cards look alike and come in either order, and which kind a
                card was is for the player to work out
         icon   a pictogram of assets/motor/lucide/, inlined in CARD_SVG
         color  the card's own colour, picked so it says nothing of the kind
         text   what it does; {n} is the tier's value, `one` the wording
                for 1, `all` the wording for a value of 99 (everything)
         cost   a risk card's price, printed under what it pays
         tiers  [rarity, value, duration]: rarity 1 common, 2 rare, 3 epic,
                4 legendary; duration in seconds, "next" (until the next
                pick), "shift" (the whole shift) or 0 (spent at once)
       What each family DOES is CARD_FX, below.
       =============================================================== */
    var CARD_FAMS = [
      // 1 · Workshop — the basics: hearts, locks, the first prizes
      { key: "spareHeart", biome: 1, kind: "help", icon: "heart", color: "#ff5d86", name: "Spare heart",
        text: "+{n} max hearts, filled", one: "+1 max heart, filled", tiers: [[1, 1, 0], [2, 2, 0], [3, 3, 0]] },
      { key: "repair", biome: 1, kind: "help", icon: "circle-plus", color: "#6dffb0", name: "Repair",
        text: "{n} lost hearts come back", one: "A lost heart comes back", all: "Every lost heart comes back",
        tiers: [[1, 1, 0], [2, 2, 0], [3, 99, 0]] },
      { key: "slowRails", biome: 1, kind: "help", icon: "gauge", color: "#9fb3ff", name: "Slow rails",
        text: "The marbles roll 30% slower", tiers: [[1, 0, 20], [2, 0, "next"], [3, 0, "shift"]] },
      { key: "lockFreeze", biome: 1, kind: "help", icon: "snowflake", color: "#bff4ff", name: "Lock freeze",
        text: "No gate locks", tiers: [[1, 0, 10], [2, 0, 20], [3, 0, 30]] },
      { key: "masterKey", biome: 1, kind: "help", icon: "unlock", color: "#ffd43b", name: "Master key",
        text: "{n} keys: tap one to open every locked gate", one: "A key: tap it to open every locked gate",
        tiers: [[1, 1, 0], [2, 2, 0], [3, 3, 0]] },
      { key: "widerGate", biome: 1, kind: "help", icon: "layers", color: "#b389ff", name: "Wider gate",
        text: "Your busiest gate holds {n} more marbles", one: "Your busiest gate holds 1 more marble",
        tiers: [[1, 1, 0], [2, 2, 0], [3, 3, 0]] },
      { key: "net", biome: 1, kind: "help", icon: "hand", color: "#7fe0c0", name: "Safety net",
        text: "The next {n} lost marbles roll back to the feeder", tiers: [[1, 2, 0], [2, 4, 0], [3, 6, 0]] },
      { key: "loopPrize", biome: 1, kind: "score", icon: "rotate-cw", color: "#ffb44f", name: "Loop prize",
        text: "A marble through a loop pays +{n}", tiers: [[1, 20, "shift"], [2, 50, "shift"], [3, 100, "shift"]] },
      { key: "jumpstart", biome: 1, kind: "score", icon: "trending-up", color: "#ff9a44", name: "Jumpstart",
        text: "+{n} combo now", tiers: [[1, 10, 0], [2, 20, 0], [3, 35, 0]] },
      { key: "turbo", biome: 1, kind: "score", icon: "rocket", color: "#ff6fd8", name: "Turbo",
        text: "+1 multiplier", tiers: [[1, 1, 20], [2, 1, "next"], [3, 1, "shift"]] },
      { key: "gold", biome: 1, kind: "score", icon: "gem", color: "#ffe066", name: "Gold marbles",
        text: "One marble in {n} is gold and pays x5", tiers: [[1, 12, "shift"], [2, 8, "shift"], [3, 5, "shift"]] },
      { key: "glass", biome: 1, kind: "risk", icon: "sword", color: "#e8fdff", name: "Glass cannon",
        text: "Score x2 for the shift", cost: "-2 max hearts", tiers: [[3, 0, "shift"]] },
      { key: "bloodPact", biome: 1, kind: "risk", icon: "skull", color: "#ff3d6e", name: "Blood pact",
        text: "Every lost heart comes back", cost: "The combo drops to 0", tiers: [[3, 0, 0]] },

      // 2 · Glassworks — steering, the combo, the prizes that are watched
      { key: "autoSwitch", biome: 2, kind: "help", icon: "arrow-left-right", color: "#7ef9ff", name: "Auto switch",
        text: "The switches steer every electric marble to the socket", tiers: [[1, 0, 20], [2, 0, "next"], [3, 0, "shift"]] },
      { key: "slowmo", biome: 2, kind: "help", icon: "hourglass", color: "#c9b8ff", name: "Slow motion",
        text: "The machine runs at half speed", tiers: [[1, 0, 10], [2, 0, 20], [3, 0, 30]] },
      { key: "shield", biome: 2, kind: "help", icon: "shield", color: "#6dffb0", name: "Combo shield",
        text: "The next {n} combo breaks are absorbed", one: "The next combo break is absorbed",
        tiers: [[1, 1, 0], [2, 2, 0], [3, 3, 0]] },
      { key: "rustyLocks", biome: 2, kind: "help", icon: "lock", color: "#d39a6a", name: "Rusty locks",
        text: "Gates lock 40% less often", tiers: [[1, 0, 20], [2, 0, "next"], [3, 0, "shift"]] },
      { key: "spiralPrize", biome: 2, kind: "score", icon: "refresh-cw", color: "#5ab0ff", name: "Spiral prize",
        text: "A marble down a spiral pays +{n}", tiers: [[1, 20, "shift"], [2, 50, "shift"], [3, 100, "shift"]] },
      { key: "train", biome: 2, kind: "score", icon: "chevrons-right", color: "#ffe6a8", name: "Marble train",
        text: "Marbles landing back to back pay +{n} per wagon", tiers: [[1, 10, "shift"], [2, 20, "shift"], [3, 40, "shift"]] },
      { key: "chain", biome: 2, kind: "score", icon: "zap", color: "#e8fdff", name: "Chain lightning",
        text: "The payoff arc zaps every marble it passes: +{n} each", tiers: [[1, 10, "shift"], [2, 25, "shift"], [3, 50, "shift"]] },
      { key: "packed", biome: 2, kind: "score", icon: "circle-dot", color: "#d9a8ff", name: "Packed machine",
        text: "Every marble delivered pays +5% per marble in the machine", tiers: [[1, 0, 20], [2, 0, "next"], [3, 0, "shift"]] },
      { key: "overclock", biome: 2, kind: "risk", icon: "flame", color: "#ff9a44", name: "Overclock",
        text: "Score x1.5 for the shift", cost: "The rails run 30% faster", tiers: [[3, 0, "shift"]] },
      { key: "allIn", biome: 2, kind: "risk", icon: "hand-fist", color: "#ff5d86", name: "All in",
        text: "+25 combo now", cost: "The next lost marble costs 3 hearts", tiers: [[3, 0, 0]] },
      { key: "doubleOr", biome: 2, kind: "risk", icon: "dices", color: "#ffd43b", name: "Double or nothing",
        text: "The next electric on target doubles your score", cost: "A wasted one halves it", tiers: [[3, 0, 0]] },
      { key: "capacitor", biome: 2, kind: "legend", icon: "medal", color: "#ffd43b", name: "Capacitor",
        text: "The socket recharges {n}% faster", tiers: [[4, 10, "shift"]] },

      // 3 · Maelstrom — the machine plays itself a little, the sparks split
      { key: "autoGate", biome: 3, kind: "help", icon: "mouse-pointer-click", color: "#6dffb0", name: "Self-opening gate",
        text: "Your busiest gate unlocks itself", tiers: [[1, 0, 20], [2, 0, "next"], [3, 0, "shift"]] },
      { key: "stiff", biome: 3, kind: "help", icon: "pause", color: "#bdb3ee", name: "Stiff switches",
        text: "Marbles no longer flip the switches", tiers: [[1, 0, 20], [2, 0, "next"], [3, 0, "shift"]] },
      { key: "second", biome: 3, kind: "help", icon: "arrow-up", color: "#7ef9ff", name: "Second chance",
        text: "The next {n} wasted electric marbles go back to the feeder", one: "The next wasted electric marble goes back to the feeder",
        tiers: [[1, 1, 0], [2, 2, 0], [3, 3, 0]] },
      { key: "quickRelease", biome: 3, kind: "help", icon: "download", color: "#9fe8ff", name: "Quick release",
        text: "An unlocked queue runs out {n} times faster", tiers: [[1, 2, "shift"], [2, 3, "shift"], [3, 4, "shift"]] },
      { key: "split", biome: 3, kind: "score", icon: "share-2", color: "#7ef9ff", name: "Splitting spark",
        text: "The next {n} electric marbles split in two at every switch", one: "The next electric marble splits in two at every switch",
        tiers: [[1, 1, 0], [2, 2, 0], [3, 3, 0]] },
      { key: "staticCharge", biome: 3, kind: "score", icon: "magnet", color: "#a8f0ff", name: "Static charge",
        text: "An electric marble every {n} marbles", tiers: [[1, 8, "shift"], [2, 7, "shift"], [3, 6, "shift"]] },
      { key: "anchor", biome: 3, kind: "score", icon: "flag", color: "#ffb44f", name: "Combo anchor",
        text: "The combo never falls below its last tier", tiers: [[1, 0, 20], [2, 0, "next"], [3, 0, "shift"]] },
      { key: "greedy", biome: 3, kind: "risk", icon: "pickaxe", color: "#ffd43b", name: "Greedy locks",
        text: "Every unlock pays 100", cost: "Gates lock 50% more often", tiers: [[3, 100, "shift"]] },
      { key: "torrent", biome: 3, kind: "risk", icon: "droplet", color: "#5ab0ff", name: "Torrent",
        text: "Every marble pays x3", cost: "The feeder pours twice as fast", tiers: [[3, 0, 15]] },
      { key: "sacrifice", biome: 3, kind: "risk", icon: "axe", color: "#ff3d6e", name: "Sacrifice",
        text: "+1 multiplier for the shift", cost: "-1 heart now", tiers: [[3, 0, "shift"]] },

      // 4 · Depths — the lost marbles pay, the current runs everywhere
      { key: "oneLockLess", biome: 4, kind: "help", icon: "minus", color: "#bff4ff", name: "One lock less",
        text: "One gate fewer can be locked at once", tiers: [[1, 0, 20], [2, 0, "next"], [3, 0, "shift"]] },
      { key: "slowPour", biome: 4, kind: "help", icon: "timer", color: "#c9b8ff", name: "Slow feeder",
        text: "The feeder pours 40% fewer marbles", tiers: [[1, 0, 20], [2, 0, "next"], [3, 0, "shift"]] },
      { key: "overcharge", biome: 4, kind: "score", icon: "sparkles", color: "#7ef9ff", name: "Overcharge",
        text: "An electric on target charges the machine for {n} s: every marble pays x3",
        tiers: [[1, 3, "shift"], [2, 6, "shift"], [3, 10, "shift"]] },
      { key: "redJackpot", biome: 4, kind: "score", icon: "target", color: "#ff5d86", name: "Red jackpot",
        text: "A marble in the red socket pays 50 instead of a heart", tiers: [[1, 50, 20], [2, 50, "next"], [3, 50, "shift"]] },
      { key: "narrow", biome: 4, kind: "risk", icon: "arrow-up-down", color: "#d9a8ff", name: "Narrow gates",
        text: "Electric marbles pay x2 for the shift", cost: "Every gate holds one marble less", tiers: [[3, 0, "shift"]] },
      { key: "blackout", biome: 4, kind: "risk", icon: "eye", color: "#9fb3ff", name: "Blackout",
        text: "Electric marbles pay x2 for the shift", cost: "The routes no longer light up", tiers: [[3, 0, "shift"]] },
      { key: "liveWire", biome: 4, kind: "risk", icon: "circle-x", color: "#a8f0ff", name: "Live wire",
        text: "An electric marble every 5 marbles", cost: "A wasted electric marble costs a heart", tiers: [[3, 5, "shift"]] },
      { key: "dynamo", biome: 4, kind: "legend", icon: "trophy", color: "#ffd43b", name: "Dynamo",
        text: "The socket recharges {n}% faster", tiers: [[4, 20, "shift"]] },

      // 5 · Clockwork — the big wagers
      { key: "wide", biome: 5, kind: "help", icon: "move", color: "#7fe0c0", name: "Wide socket",
        text: "The arrivals beside the socket take electric marbles too", tiers: [[1, 0, 20], [2, 0, "next"], [3, 0, "shift"]] },
      { key: "shortFuse", biome: 5, kind: "score", icon: "bomb", color: "#ff9a44", name: "Short fuse",
        text: "The combo tiers come {n}% sooner", tiers: [[1, 20, "shift"], [2, 35, "shift"], [3, 50, "shift"]] },
      { key: "lockdown", biome: 5, kind: "risk", icon: "book-lock", color: "#ffb44f", name: "Lockdown",
        text: "Marbles leaving a gate pay x5", cost: "Every gate locks now", tiers: [[3, 5, 15]] },
      { key: "jam", biome: 5, kind: "risk", icon: "arrow-down", color: "#bdb3ee", name: "Jam session",
        text: "The combo climbs twice as fast for the shift", cost: "The wheel entries hold 2 marbles less", tiers: [[3, 0, "shift"]] },
      { key: "tempt", biome: 5, kind: "risk", icon: "wand-sparkles", color: "#ff6fd8", name: "Tempt fate",
        text: "The next pick deals two epic cards", cost: "-1 heart now", tiers: [[3, 0, 0]] },
      { key: "tesla", biome: 5, kind: "legend", icon: "crown", color: "#ffd43b", name: "Tesla coil",
        text: "The socket recharges in 20 s", tiers: [[4, 34, "shift"]] }
    ];
    /* The pictograms, inlined from assets/motor/lucide/ (ISC, see its LICENSE)
       so the DOM card can stroke them in its own colour (currentColor). */
    var CARD_SVG = {
      "heart": '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
      "circle-plus": '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
      "gauge": '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
      "snowflake": '<path d="m10 20-1.25-2.5L6 18"/><path d="M10 4 8.75 6.5 6 6"/><path d="m14 20 1.25-2.5L18 18"/><path d="m14 4 1.25 2.5L18 6"/><path d="m17 21-3-6h-4"/><path d="m17 3-3 6 1.5 3"/><path d="M2 12h6.5L10 9"/><path d="m20 10-1.5 2 1.5 2"/><path d="M22 12h-6.5L14 15"/><path d="m4 10 1.5 2L4 14"/><path d="m7 21 3-6-1.5-3"/><path d="m7 3 3 6h4"/>',
      "unlock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
      "layers": '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
      "hand": '<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
      "rotate-cw": '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
      "trending-up": '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
      "rocket": '<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/><path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/>',
      "gem": '<path d="M10.5 3 8 9l4 13 4-13-2.5-6"/><path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"/><path d="M2 9h20"/>',
      "sword": '<path d="m11 19-6-6"/><path d="m5 21-2-2"/><path d="m8 16-4 4"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"/>',
      "skull": '<path d="m12.5 17-.5-1-.5 1h1z"/><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="12" r="1"/>',
      "arrow-left-right": '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
      "hourglass": '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
      "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
      "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      "refresh-cw": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
      "chevrons-right": '<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>',
      "zap": '<path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/>',
      "circle-dot": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>',
      "flame": '<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>',
      "hand-fist": '<path d="M12.035 17.012a3 3 0 0 0-3-3l-.311-.002a.72.72 0 0 1-.505-1.229l1.195-1.195A2 2 0 0 1 10.828 11H12a2 2 0 0 0 0-4H9.243a3 3 0 0 0-2.122.879l-2.707 2.707A4.83 4.83 0 0 0 3 14a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v2a2 2 0 1 0 4 0"/><path d="M13.888 9.662A2 2 0 0 0 17 8V5A2 2 0 1 0 13 5"/><path d="M9 5A2 2 0 1 0 5 5V10"/><path d="M9 7V4A2 2 0 1 1 13 4V7.268"/>',
      "dices": '<rect width="12" height="12" x="2" y="10" rx="2" ry="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/>',
      "medal": '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/>',
      "mouse-pointer-click": '<path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/>',
      "pause": '<rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/>',
      "arrow-up": '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
      "download": '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
      "share-2": '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
      "magnet": '<path d="m12 15 4 4"/><path d="M2.352 10.648a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l6.029-6.029a1 1 0 1 1 3 3l-6.029 6.029a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l6.365-6.367A1 1 0 0 0 8.716 4.282z"/><path d="m5 8 4 4"/>',
      "flag": '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
      "pickaxe": '<path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999"/><path d="M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024"/><path d="M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069"/><path d="M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z"/>',
      "droplet": '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
      "axe": '<path d="m14 12-8.381 8.38a1 1 0 0 1-3.001-3L11 9"/><path d="M15 15.5a.5.5 0 0 0 .5.5A6.5 6.5 0 0 0 22 9.5a.5.5 0 0 0-.5-.5h-1.672a2 2 0 0 1-1.414-.586l-5.062-5.062a1.205 1.205 0 0 0-1.704 0L9.352 5.648a1.205 1.205 0 0 0 0 1.704l5.062 5.062A2 2 0 0 1 15 13.828z"/>',
      "minus": '<path d="M5 12h14"/>',
      "timer": '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
      "sparkles": '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
      "target": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
      "arrow-up-down": '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
      "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
      "circle-x": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
      "trophy": '<path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2"/><path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2"/><path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"/>',
      "move": '<path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/>',
      "bomb": '<circle cx="11" cy="13" r="9"/><path d="M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95"/><path d="m22 2-1.5 1.5"/>',
      "book-lock": '<path d="M18 6V4a2 2 0 1 0-4 0v2"/><path d="M20 15v6a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H10"/><rect x="12" y="6" width="8" height="5" rx="1"/>',
      "arrow-down": '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
      "wand-sparkles": '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
      "crown": '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>'
    };

    /* ===============================================================
       THE UPGRADE CARDS — the rules.

       THE CHARGE. The socket starts the shift charged. An electric marble
       delivered on a charged socket deals two cards once the payoff arc has
       reached the hub (`cards.pickDelay`); the machine stops (Game.held, the
       motor holds the world and the clock) until one is taken, then the
       socket recharges over `cooldown()` seconds of the shift. An electric
       delivered while it recharges is an ordinary payoff.

       THE DEAL is one help card against one score, risk or legendary card,
       drawn by rarity out of every family the machine's biome has opened,
       and laid down in either order: the two piles are never shown.

       A running card writes into MOD, which is every running card folded
       into one set of numbers, rebuilt every frame; the machine reads MOD.
       =============================================================== */
    var KC = CONFIG.cards;
    var CARDS = [], CARD_BY = {}, FAM_BY = {};
    (function () {
      var i, j, f, tr, id;
      for (i = 0; i < CARD_FAMS.length; i++) {
        f = CARD_FAMS[i]; FAM_BY[f.key] = f;
        for (j = 0; j < f.tiers.length; j++) {
          tr = f.tiers[j]; id = f.tiers.length > 1 ? f.key + "-" + (j + 1) : f.key;
          CARD_BY[id] = { id: id, fam: f.key, kind: f.kind, biome: f.biome, r: tr[0], v: tr[1], dur: tr[2] };
          CARDS.push(CARD_BY[id]);
        }
      }
    })();
    var RARITY = [null,
      { name: "Common", color: "#b8b2dd" }, { name: "Rare", color: "#3fa0ff" },
      { name: "Epic", color: "#d64dff" }, { name: "Legendary", color: "#ffd43b" }];
    var CARD_STYLE = "plate";       // the look picked in lab/gearball-cards.html (the SKIN's .gb-card.s-<key>)
    var LEGEND_BG = "linear-gradient(90deg, #ffd43b 0%, #fff3b0 18%, #7ef9ff 36%, #3fa8ff 50%, #7ef9ff 64%, #fff3b0 82%, #ffd43b 100%)";

    var MOD = null, effects = [], held = null, pendingPick = false, pickT = 0, lastPick = -1e9, rt = 0, wasReady = true;
    var keys = 0, nets = 0, shields = 0, seconds = 0, splits = 0, heavy = false, dnFlag = false, nextEpic = false;
    var waitCap = 5, goldIn = 0, chargeT = 0, pickedIds = [];

    function recompute() {
      var O = { tempo: 1, pour: 1, sim: 1, lockRate: 1, lockLess: 0, score: 1, eScore: 1, classicK: 1, multAdd: 0, comboStep: 1,
                autoSwitch: false, autoGate: {}, frozen: false, wide: false, blind: false, floor: false, fizzleHurts: false,
                redPays: 0, packed: 0, loop: 0, spiral: 0, train: 0, chain: 0, over: 0, unlockPay: 0, releaseTag: 0,
                flush: 1, goldEvery: 0, eEvery: M.electricEvery, tierCut: 0, cd: 0 };
      for (var i = 0; i < effects.length; i++) { var fx = CARD_FX[effects[i].c.fam]; if (fx.mod) fx.mod(O, effects[i].c); }
      MOD = O;
    }
    recompute();
    function cooldown() { return Math.max(KC.minCooldown, KC.cooldown * (1 - MOD.cd)); }
    function charge() { return Math.min(1, (rt - lastPick) / cooldown()); }
    function tierAt(i) { return Math.max(1, Math.round(M.tiers[i] * (1 - MOD.tierCut))); }
    function addCombo(n) {
      var b = tier(combo);
      feedFuse();
      combo += n; if (combo > bestCombo) bestCombo = combo;
      if (tier(combo) > b) tierUp();
    }
    // The gate locked most often this shift: the one a gate card is about.
    function busiest() {
      var bi = 0, i;
      for (i = 1; i < gates.length; i++) if ((gates[i].locks || 0) > (gates[bi].locks || 0)) bi = i;
      return bi;
    }
    function gateRoom(g) { return Math.floor((g.d - 24) / (2.2 * R)) - g.cap; }
    function hasMod(kind) {
      for (var id in CH) if (CH.hasOwnProperty(id) && CH[id].mods)
        for (var i = 0; i < CH[id].mods.length; i++) if (CH[id].mods[i].kind === kind) return true;
      return false;
    }
    function rawLockMax() {
      var cap = Math.max(1, Math.round(gates.length * M.lockShare));
      return Math.min(cap, 1 + Math.floor(progress() / Math.max(0.05, M.lockMoreEvery)));
    }

    /* WHAT EACH FAMILY DOES: `mod` while it runs, `now` once when taken,
       `can` keeps a card that would do nothing out of the deal. `stack` lets
       a family be taken again while it runs (its values add or the best one
       wins); `auto` marks the two that play the machine for the player, of
       which only one may run for the whole shift. */
    var CARD_FX = {
      spareHeart: { now: function (c) { var n = Math.min(c.v, KC.heartsCap - heartsMax); heartsMax += n; hearts += n; showHearts(); },
                    can: function () { return heartsMax < KC.heartsCap; } },
      repair:     { now: function (c) { hearts = Math.min(heartsMax, hearts + c.v); showHearts(); },
                    can: function () { return hearts < heartsMax; } },
      slowRails:  { mod: function (O) { O.tempo *= 0.7; } },
      lockFreeze: { mod: function (O) { O.lockRate = 0; } },
      masterKey:  { now: function (c) { keys += c.v; } },
      widerGate:  { now: function (c) { var g = gates[busiest()]; g.cap += Math.max(0, Math.min(c.v, gateRoom(g))); },
                    can: function () { return gates.length > 0 && gateRoom(gates[busiest()]) > 0; } },
      net:        { now: function (c) { nets += c.v; } },
      loopPrize:  { stack: true, mod: function (O, c) { O.loop += c.v; }, can: function () { return hasMod("loop"); } },
      jumpstart:  { now: function (c) { addCombo(c.v); } },
      turbo:      { mod: function (O) { O.multAdd += 1; } },
      gold:       { stack: true, mod: function (O, c) { O.goldEvery = O.goldEvery ? Math.min(O.goldEvery, c.v) : c.v; },
                    can: function (c) { return !MOD.goldEvery || MOD.goldEvery > c.v; } },
      glass:      { now: function () { heartsMax -= 2; hearts = Math.max(1, Math.min(hearts, heartsMax)); showHearts(); },
                    mod: function (O) { O.score *= 2; }, can: function () { return heartsMax >= 4; } },
      bloodPact:  { now: function () { hearts = heartsMax; showHearts(); if (combo >= 2) hubBreak = 0.6; combo = 0; },
                    can: function () { return hearts < heartsMax && combo > 0; } },
      autoSwitch: { auto: true, mod: function (O) { O.autoSwitch = true; } },
      slowmo:     { mod: function (O) { O.sim *= 0.5; } },
      shield:     { now: function (c) { shields += c.v; } },
      rustyLocks: { mod: function (O) { O.lockRate *= 0.6; } },
      spiralPrize:{ stack: true, mod: function (O, c) { O.spiral += c.v; }, can: function () { return hasMod("spiral"); } },
      train:      { stack: true, mod: function (O, c) { O.train += c.v; } },
      chain:      { stack: true, mod: function (O, c) { O.chain += c.v; } },
      packed:     { mod: function (O) { O.packed += 0.05; } },
      overclock:  { mod: function (O) { O.score *= 1.5; O.tempo *= 1.3; } },
      allIn:      { now: function () { addCombo(25); heavy = true; }, can: function () { return !heavy; } },
      doubleOr:   { now: function () { dnFlag = true; }, can: function () { return !dnFlag && score > 0; } },
      capacitor:  { stack: true, mod: function (O, c) { O.cd += c.v / 100; }, can: function () { return cooldown() > KC.minCooldown; } },
      autoGate:   { auto: true, mod: function (O, c) { O.autoGate[c.g] = true; } },
      stiff:      { mod: function (O) { O.frozen = true; } },
      second:     { now: function (c) { seconds += c.v; } },
      quickRelease: { stack: true, mod: function (O, c) { O.flush = Math.max(O.flush, c.v); }, can: function (c) { return MOD.flush < c.v; } },
      split:      { now: function (c) { splits += c.v; } },
      staticCharge: { stack: true, mod: function (O, c) { O.eEvery = Math.min(O.eEvery || c.v, c.v); }, can: function (c) { return !MOD.eEvery || MOD.eEvery > c.v; } },
      anchor:     { mod: function (O) { O.floor = true; } },
      greedy:     { mod: function (O, c) { O.unlockPay += c.v; O.lockRate *= 1.5; } },
      torrent:    { mod: function (O) { O.pour *= 0.5; O.classicK *= 3; } },
      sacrifice:  { now: function () { hearts--; showHearts(); }, mod: function (O) { O.multAdd += 1; }, can: function () { return hearts > 1; } },
      oneLockLess:{ mod: function (O) { O.lockLess += 1; }, can: function () { return Math.round(gates.length * M.lockShare) > 1; } },
      slowPour:   { mod: function (O) { O.pour *= 1.6; } },
      overcharge: { stack: true, mod: function (O, c) { O.over = Math.max(O.over, c.v); }, can: function (c) { return MOD.over < c.v; } },
      redJackpot: { mod: function (O, c) { O.redPays = c.v; }, can: function () { return !!L.sink; } },
      narrow:     { now: function () { for (var i = 0; i < gates.length; i++) gates[i].cap = Math.max(2, gates[i].cap - 1); },
                    mod: function (O) { O.eScore *= 2; },
                    can: function () { for (var i = 0; i < gates.length; i++) if (gates[i].cap > 2) return true; return false; } },
      blackout:   { mod: function (O) { O.eScore *= 2; O.blind = true; } },
      liveWire:   { mod: function (O, c) { O.eEvery = Math.min(O.eEvery || c.v, c.v); O.fizzleHurts = true; } },
      dynamo:     { stack: true, mod: function (O, c) { O.cd += c.v / 100; }, can: function () { return cooldown() > KC.minCooldown; } },
      wide:       { mod: function (O) { O.wide = true; }, can: function () { return L.arr.length > 1; } },
      shortFuse:  { stack: true, mod: function (O, c) { O.tierCut = Math.max(O.tierCut, c.v / 100); }, can: function (c) { return MOD.tierCut < c.v / 100; } },
      lockdown:   { now: function () {
                      for (var i = 0; i < gates.length; i++) {
                        var g = gates[i];
                        if (!g.locked && !g.flush) { g.locked = true; g.lockAge = 0; g.locks = (g.locks || 0) + 1; ring(g.px, g.py, C.amber, 30, 140, 0.6, 4); }
                      }
                      Sound.clip("lock", 0.5, 0.9);
                    },
                    mod: function (O, c) { O.releaseTag = c.v; } },
      jam:        { now: function () { waitCap = Math.max(2, waitCap - 2); }, mod: function (O) { O.comboStep = 2; },
                    can: function () { return waitCap > 3; } },
      tempt:      { now: function () { hearts--; showHearts(); nextEpic = true; }, can: function () { return hearts > 1 && !nextEpic; } },
      tesla:      { stack: true, mod: function (O, c) { O.cd += c.v / 100; }, can: function () { return cooldown() > KC.minCooldown; } }
    };

    /* A card as the player reads it, in their language. */
    function cardText(c) {
      var f = FAM_BY[c.fam];
      var s = c.v === 1 && f.one ? f.one : c.v >= 99 && f.all ? f.all : f.text;
      return nbsp(Lang.t(s).replace("{n}", c.v));
    }
    // French sets a space before % : ; ! ? — a no-break one, so "20 %" never splits.
    function nbsp(str) { return String(str).replace(/ ([%:;!?»])/g, "\u00a0$1").replace(/« /g, "«\u00a0"); }
    function durText(c) {
      if (typeof c.dur === "number") return c.dur ? c.dur + " s" : Lang.t("Now");
      return Lang.t(c.dur === "next" ? "Until the next pick" : "Whole shift");
    }

    /* THE CARD, as DOM — the one builder of the round's two cards and of the
       collection (packages/webshell/codex.js asks for it through codex.node).
       Authored at 300 x 420 design px and scaled as a whole to the width
       asked for; the look is the SKIN's .gb-card.s-<CARD_STYLE>, chosen in
       lab/gearball-cards.html. A `ghost` is a card never taken yet: a grey
       silhouette named ???. Nothing on it says which pile it came from. */
    var FACE_W = 300;
    /* The family's painted illustration, `card-<family>` of art.objects (cut
       out of assets/image/master/gearball-object-card-{one,two}.png); the
       lucide pictogram stands in for a family that has none. */
    function cardArt(key) {
      var a = CONFIG.art || {};
      return a["card" + key.charAt(0).toUpperCase() + key.slice(1)] || "";
    }
    // Which corner a family's gear sits on: fixed per family, so two cards side by side differ.
    function gearCorner(key) { var h = 0, i; for (i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0; return (h >>> 0) % 4; }
    function cardNode(id, opt) {
      opt = opt || {};
      var c = CARD_BY[id], f = FAM_BY[c.fam], R = RARITY[c.r], w = opt.w || FACE_W, ghost = !!opt.ghost, art = cardArt(f.key);
      var box = document.createElement("div");
      box.className = "gb-cbox";
      box.style.width = w + "px"; box.style.height = Math.round(w * 1.4) + "px";
      var n = document.createElement("div");
      n.className = "gb-card s-" + CARD_STYLE + " r-" + (ghost ? 1 : c.r) + (f.cost && !ghost ? " has-cost" : "") + (ghost ? " ghost" : "");
      n.style.setProperty("--sk", w / FACE_W);
      n.style.setProperty("--c", ghost ? "#5d567a" : f.color);
      n.style.setProperty("--r", ghost ? "#6d6690" : R.color);
      n.style.setProperty("--rbg", ghost ? "#6d6690" : c.r === 4 ? LEGEND_BG : R.color);
      // the plate's big gear (the SKIN): the decor pool's spoked one, on the family's own corner
      if (CONFIG.art && CONFIG.art.decor02) n.style.setProperty("--gear", 'url("' + CONFIG.art.decor02 + '")');
      n.style.setProperty("--gx", gearCorner(f.key) & 1); n.style.setProperty("--gy", gearCorner(f.key) >> 1);
      n.innerHTML =
        '<div class="gb-back"><div class="gb-bg"></div><div class="gb-glow"></div><div class="gb-shine"></div></div>' +
        '<div class="gb-frame"></div><div class="gb-deco"></div>' +
        '<div class="gb-art' + (art ? " pic" : "") + '">' + (art ? '<img alt="" draggable="false" src="' + art + '">' :
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        (CARD_SVG[f.icon] || "") + "</svg>") + "</div>" +
        '<div class="gb-rar"><span></span></div><div class="gb-name"></div><div class="gb-desc"></div>' +
        (f.cost && !ghost ? '<div class="gb-cost"></div>' : "") + '<div class="gb-dur"></div>' +
        (opt.fresh && !ghost ? '<div class="gb-new"><span></span></div>' : "");
      n.querySelector(".gb-name").textContent = ghost ? "???" : upper(Lang.t(f.name));
      n.querySelector(".gb-rar span").textContent = ghost ? "???" : upper(Lang.t(R.name));
      n.querySelector(".gb-desc").textContent = ghost ? "" : cardText(c);
      if (f.cost && !ghost) n.querySelector(".gb-cost").textContent = nbsp(Lang.t(f.cost));
      n.querySelector(".gb-dur").textContent = ghost ? "" : upper(durText(c));
      // a card the player has never taken wears a corner ribbon; the word stays English in every language
      if (opt.fresh && !ghost) n.querySelector(".gb-new span").textContent = upper("New");
      box.appendChild(n);
      return box;
    }

    /* --- the deal ------------------------------------------------------ */
    function running(fam, dur) {
      for (var i = 0; i < effects.length; i++) if (effects[i].c.fam === fam && (dur === undefined || effects[i].c.dur === dur)) return true;
      return false;
    }
    function autoForShift() {
      for (var i = 0; i < effects.length; i++) if (CARD_FX[effects[i].c.fam].auto && effects[i].c.dur === "shift") return true;
      return false;
    }
    function offerable(c) {
      var fx = CARD_FX[c.fam];
      if (c.biome > L.b + 1) return false;
      if (fx.can && !fx.can(c)) return false;
      // a running effect is not dealt again on top of itself, unless its family stacks
      if (!fx.stack && c.dur !== 0 && running(c.fam)) return false;
      if (fx.auto && c.dur === "shift" && autoForShift()) return false;
      return true;
    }
    function drawOne(kinds, epic) {
      var list = [], sum = 0, i, c, w, roll;
      for (i = 0; i < CARDS.length; i++) {
        c = CARDS[i];
        if (kinds.indexOf(c.kind) < 0 || (epic && c.r < 3) || !offerable(c)) continue;
        w = c.kind === "risk" ? KC.riskWeight : KC.weights[c.r];
        list.push([c, w]); sum += w;
      }
      if (!list.length) return null;
      roll = Math.random() * sum;
      for (i = 0; i < list.length; i++) { roll -= list[i][1]; if (roll <= 0) return list[i][0]; }
      return list[list.length - 1][0];
    }
    function openPick() {
      var epic = nextEpic, i, a, b, deal;
      nextEpic = false;
      // "until the next pick" ends here, as the next pick opens
      for (i = effects.length - 1; i >= 0; i--) if (effects[i].c.dur === "next") effects.splice(i, 1);
      recompute();
      a = drawOne(["help"], epic) || drawOne(["help"], false);
      b = drawOne(["score", "risk", "legend"], epic) || drawOne(["score", "risk", "legend"], false);
      deal = [];
      if (a) deal.push(a);
      if (b) deal.push(b);
      if (deal.length === 2 && Math.random() < 0.5) deal.reverse();
      if (!deal.length) { pendingPick = false; return; }
      showPick(deal);
    }
    function take(k) {
      if (!held || !held.deal[k]) return;
      var c = held.deal[k], fx = CARD_FX[c.fam], rec = { fam: c.fam, id: c.id, dur: c.dur, v: c.v, g: fx.auto && c.fam === "autoGate" ? busiest() : -1 };
      closePick(k);
      pendingPick = false; lastPick = rt; wasReady = false;
      if (fx.now) fx.now(rec);
      if (c.dur !== 0) effects.push({ c: rec, left: typeof c.dur === "number" ? c.dur : null });
      recompute();
      remember(c.id); pickedIds.push(c.id);
      Fx.flash(RARITY[c.r].color, 0.12);
      if (hearts <= 0 && state === "play") { state = "over"; overT = 1.0; }
      paintRun();
    }

    /* --- the two cards, over the stopped machine ------------------------
       The motor's CARD (motor.css) with no plate behind it, on a veil: the
       eyebrow says why, the title what to do, the two cards ARE the
       controls, and the tap line says so. It is the one place of the round
       that takes a pointer, so the canvas under it never sees the tap. */
    function showPick(deal) {
      var frame = document.getElementById("frame"), lay, mc, row, i, btn;
      if (!frame) return;
      lay = document.createElement("div"); lay.id = "gb-pick";
      mc = document.createElement("div"); mc.className = "mt-card gb-pc";
      mc.innerHTML = '<p class="mt-eyebrow"></p><h2 class="mt-h"></h2><div class="mt-body"><div class="gb-deal"></div></div><p class="mt-tap"></p>';
      mc.querySelector(".mt-eyebrow").textContent = upper(Lang.t("Socket charged"));
      mc.querySelector(".mt-h").textContent = upper(Lang.t("Pick one"));
      mc.querySelector(".mt-tap").textContent = upper(Lang.t("Tap a card to take it"));
      row = mc.querySelector(".gb-deal");
      var had = seen();
      for (i = 0; i < deal.length; i++) {
        btn = document.createElement("button");
        btn.className = "gb-take"; btn.type = "button";
        btn.setAttribute("aria-label", Lang.t(FAM_BY[deal[i].fam].name));
        btn.appendChild(cardNode(deal[i].id, { w: 290, fresh: !had[deal[i].id] }));
        (function (k) { btn.addEventListener("click", function (e) { e.stopPropagation(); take(k); }); })(i);
        row.appendChild(btn);
      }
      lay.appendChild(mc);
      frame.appendChild(lay);
      held = { node: lay, deal: deal };
      requestAnimationFrame(function () { lay.classList.add("on"); });
      Sound.clip("chain", 0.4, 1.1);
      Music.duck(0.45, 0.3);
    }
    function closePick(k) {
      if (!held) return;
      var n = held.node;
      if (k != null && n.querySelectorAll(".gb-take")[k]) n.querySelectorAll(".gb-take")[k].classList.add("took");
      held = null;
      n.classList.add("off");
      Music.unduck();
      setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 320);
    }

    /* --- what is running, under the HUD's left corner -------------------
       One disc per card at work, its pictogram in the card's colour and a
       ring that empties with its time (none for a whole-shift card), plus
       the socket's own charge first and the master key when there is one —
       the one disc that takes a tap. Pictograms and figures only: the words
       are on the cards. Lives in #hud, so it is hidden whenever the HUD is. */
    var runNode = null;
    function runRoot() {
      if (runNode && runNode.parentNode) return runNode;
      var hud = document.getElementById("hud");
      if (!hud) return null;
      runNode = document.createElement("div"); runNode.id = "gb-run";
      runNode.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".gb-key")) useKey(); });
      hud.appendChild(runNode);
      return runNode;
    }
    function disc(cls, icon, color, k, count) {
      return '<i class="gb-rd ' + cls + '" style="--c:' + color + ";--k:" + Math.round(k * 100) + '%">' +
             '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
             (CARD_SVG[icon] || "") + "</svg>" + (count > 1 ? "<b>" + count + "</b>" : "") + "</i>";
    }
    var runKey = "";
    function paintRun() {
      var root = runRoot(), h = "", i, ef, f, k, key, ch;
      if (!root) return;
      ch = charge();
      h += disc("gb-charge" + (ch >= 1 ? " ready" : ""), "zap", C.volt, ch, 0);
      if (keys > 0) h += disc("gb-key", "unlock", C.gold || "#ffd43b", 1, keys);
      for (i = 0; i < effects.length; i++) {
        ef = effects[i]; f = FAM_BY[ef.c.fam];
        k = ef.left === null ? 1 : ef.left / ef.c.dur;
        h += disc(ef.c.dur === "next" ? "next" : "", f.icon, f.color, k, 0);
      }
      if (nets) h += disc("", "hand", FAM_BY.net.color, 1, nets);
      if (shields) h += disc("", "shield", FAM_BY.shield.color, 1, shields);
      if (seconds) h += disc("", "arrow-up", FAM_BY.second.color, 1, seconds);
      if (splits) h += disc("", "share-2", FAM_BY.split.color, 1, splits);
      if (heavy) h += disc("warn", "hand-fist", FAM_BY.allIn.color, 1, 0);
      if (dnFlag) h += disc("warn", "dices", FAM_BY.doubleOr.color, 1, 0);
      if (nextEpic) h += disc("", "wand-sparkles", FAM_BY.tempt.color, 1, 0);
      if (chargeT > 0) h += disc("", "sparkles", C.volt, chargeT / Math.max(1, MOD.over), 0);
      // rewritten only when something a disc shows has moved by a step
      key = h.replace(/--k:(\d+)%/g, function (m, p) { return "--k:" + (Math.round(p / 5) * 5) + "%"; });
      if (key === runKey) return;
      runKey = key;
      root.innerHTML = key;
    }
    function useKey() {
      if (state !== "play" || held || keys <= 0) return;
      var any = false, i;
      for (i = 0; i < gates.length; i++) if (gates[i].locked) { unlock(gates[i]); any = true; }
      if (!any) { Pop.show("score", { word: "No gate is locked" }); return; }
      keys--;
      Pop.show("bonus", { word: "Master key", at: "top" });
      paintRun();
    }

    /* --- the card clocks, once a frame of the shift, on real time ------- */
    function tickCards(dt) {
      var i, ef, ready;
      rt += dt;
      for (i = effects.length - 1; i >= 0; i--) {
        ef = effects[i];
        if (ef.left === null) continue;
        ef.left -= dt;
        if (ef.left <= 0) effects.splice(i, 1);
      }
      chargeT = Math.max(0, chargeT - dt);
      recompute();
      ready = charge() >= 1;
      if (ready && !wasReady) {
        Notify.say("Upgrade ready", { sub: "The next electric on target deals two cards", kind: "rare", icon: "sparkles", key: "gb-ready" });
        boxes[arrival].charge = 1; boxes[arrival].kick = 0.5;
      }
      wasReady = ready;
      if (pendingPick) { pickT -= dt; if (pickT <= 0 && state === "play") openPick(); }
      paintRun();
    }
    function resetCards() {
      if (held) { var n = held.node; held = null; if (n.parentNode) n.parentNode.removeChild(n); Music.unduck(); }
      effects = []; pendingPick = false; pickT = 0; lastPick = -1e9; rt = 0; wasReady = true;
      keys = 0; nets = 0; shields = 0; seconds = 0; splits = 0; heavy = false; dnFlag = false; nextEpic = false;
      waitCap = M.waitCap; goldIn = 0; chargeT = 0; runKey = ""; pickedIds = [];
      recompute();
    }

    /* --- the collection: every card ever taken --------------------------
       Kept per game in Store, and wiped with the rest of the game's data
       (OPTIONS calls Game.wipe). The codex lists the biomes as its books and
       shows a card once it has been taken in a round. */
    function seenKey() { return "cards:" + (CONFIG.slug || "gearball"); }
    function seen() { var s = Store.get(seenKey(), null); return s && typeof s === "object" ? s : {}; }
    function remember(id) { var s = seen(); if (!s[id]) { s[id] = 1; Store.set(seenKey(), s); } }
    var codex = {
      books: function () {
        var out = [], b;
        for (b = 0; b < CONFIG.biomes.length; b++) out.push({ key: String(b + 1), label: Lang.t(CONFIG.biomes[b].name), color: tcBiome(b) });
        return out;
      },
      items: function (book) {
        var out = [], s = seen(), i, c;
        for (i = 0; i < CARDS.length; i++) {
          c = CARDS[i];
          if (String(c.biome) === book) out.push({ id: c.id, lv: (c.biome - 1) * 6 + 1, had: !!s[c.id] });
        }
        return out;
      },
      node: cardNode,
      info: function (id) {
        var c = CARD_BY[id], f = FAM_BY[c.fam], R = RARITY[c.r];
        return { name: Lang.t(f.name), color: f.color, lock: Lang.t("Pick it in a round to add it to the collection"),
                 chips: [{ text: Lang.t(R.name), color: R.color }, { text: durText(c) }] };
      }
    };
    function tcBiome(b) { return CONFIG.biomes[b].metal; }
    // The arc that opens the round has the shift's own socket path.
    function roundPath() { return path; }
    function wipe() { Store.del(seenKey()); }

    /* ---------------- the motor contract: reset ---------------------- */
    function reset() {
      var i, k, d, gc, gd, gp, ga, tl, g, ch, cd, p, nv;
      L = layout(machine()); CH = L.CH;
      setBiome(L.b);
      fit(); readFont(); build();
      marbles = []; queue = []; parts = []; shards = []; rings = []; arcs = []; puffs = []; hints = []; hintT = 0;
      boxes = {};
      arrival = L.arr[Math.floor(Math.random() * L.arr.length)].id;
      for (i = 0; i < L.arr.length; i++) {
        d = L.arr[i];
        boxes[d.id] = { id: d.id, x: d.x, col: d.id === arrival ? C.volt : CLASSIC, kick: 0, fizz: 0, charge: 0, led: -1, sweep: 0,
                        pitch: 0.9 + i * 0.06 };
      }
      path = L.pay[arrival];
      sw = {};
      for (k in L.sw) if (L.sw.hasOwnProperty(k)) {
        sw[k] = { x: L.sw[k][0], y: L.sw[k][1], dir: L.sw[k][2], ang: 0, spin: 0, flash: 0, snap: 0, kb: L.sw[k][2] };
        sw[k].ang = branchAngle(k, sw[k].dir);
      }
      var W = L.wheel;
      wheel = { phase: 0, notch: [], q: {}, flashT: {}, omega: WHEEL_OMEGA, n: W.notches };
      wheel.spill = {};
      for (k in W.entries) if (W.entries.hasOwnProperty(k)) {
        wheel.q[k] = []; wheel.flashT[k] = 0; wheel.spill[k] = CH[L.drainOf["wheel:" + k]] || null;
      }
      sink = L.sink ? { kick: 0 } : null;
      for (i = 0; i < W.notches; i++) wheel.notch.push(null);
      gates = [];
      for (k in CH) if (CH.hasOwnProperty(k)) CH[k].gate = null;
      for (i = 0; i < L.gates.length; i++) {
        gc = CH[L.gates[i].ch]; gd = nearestD(gc, L.gates[i].at[0], L.gates[i].at[1]);
        gp = at(gc, gd, {}); ga = at(gc, gd + 5, {});
        tl = Math.sqrt((ga.x - gp.x) * (ga.x - gp.x) + (ga.y - gp.y) * (ga.y - gp.y)) || 1;
        g = { id: gc.id, n: i, ch: gc, d: gd, cap: L.gates[i].cap, q: [], locked: false, lockAge: 0, flush: false,
              flushT: 0, open: 9, broke: 0, pop: 0, x: gp.x, y: gp.y, tx: (ga.x - gp.x) / tl, ty: (ga.y - gp.y) / tl };
        g.fx = g.x + g.tx * (R + 4); g.fy = g.y + g.ty * (R + 4);
        g.px = L.gates[i].p[0]; g.py = L.gates[i].p[1];
        g.spill = CH[L.drainOf["gate:" + i]] || null;
        gc.gate = g; gates.push(g);
      }
      fers = [];
      for (i = 0; i < L.fer.length; i++) {
        fers.push({ f: L.fer[i], phase: 0, notch: [], q: [] });
        for (k = 0; k < L.fer[i].n; k++) fers[i].notch.push(null);
      }
      chimes = [];
      for (i = 0; i < L.chimes.length; i++) {
        ch = CH[L.chimes[i][0]]; cd = nearestD(ch, L.chimes[i][1], L.chimes[i][2]); p = at(ch, cd, {});
        nv = normalAt(ch, Math.round(cd / DS));
        if (nv[1] > 0) nv = [-nv[0], -nv[1]];      // hang it on the upper side of the rail
        chimes.push({ ch: ch, d: cd, x: p.x + nv[0] * 34, y: p.y + nv[1] * 34, rx: p.x + nv[0] * (R + 4), ry: p.y + nv[1] * (R + 4), hit: 9, n: i });
      }
      resetCards();
      electricIn = 0;
      // one more than the preview: the pocket about to come into view is
      // filled too, and it carries the round's first electric marble
      for (i = 0; i <= M.preview; i++) queue.push(i < M.preview ? plainKind() : "e");
      state = "play"; t = 0; feedK = 0.3; feedTurn = 0; lockT = M.lockFirst;
      score = 0; combo = 0; bestCombo = 0; heartsMax = M.hearts | 0; hearts = heartsMax; ended = false;
      heartHit = 0; hubPop = 0; hubBreak = 0; hubZap = 0; zap = 0; overT = 0; blackT = 0; blackLen = BLACKOUT;
      fuse = 1; fuseBurn = false; fuseOutT = 0; comets = []; slowT = 0;
      flow = 0; screwSlot = 0; towerQ = []; revealT = 0.25; chimeGap = 0; clickGap = 0;
      stats = { delivered: 0, eOn: 0, eWasted: 0, destroyed: 0, spilled: 0, unlocks: 0, locks: 0, moves: 0, fuseOuts: 0, heartsLost: 0 };
      taught = { lock: false, volt: false, spill: false, fuse: false };
      best = Store.get("bestScore", 0) || 0;
      HUD.setScoreNow(0);
      showHearts();
      paintRun();
      /* THE BED. The machine names the stretch of the track the round rides,
         so replaying a level never restarts the music and crossing into the
         next biome does. A round with no level ships a short cut of the track
         and plays all of it, which is what `null` means. */
      Music.play(CONFIG.level ? CONFIG.music.biomes[L.b] : null);
      // ...and the painted hall with it: ignored while the biome's file does not exist
      Art.backdrop(CONFIG.biomes[L.b].scene);
    }

    /* The hearts: filled for what is left, cracked and dark for what is gone,
       as many as the level deals. Drawn by the SKIN (.gb-h), because a glyph
       reads differently in every face the web build may ship. */
    function showHearts() {
      var s = "", i;
      for (i = 0; i < heartsMax; i++) s += i < hearts ? '<i class="gb-h"></i>' : '<i class="gb-h gb-x"></i>';
      HUD.setLeft(s, "Hearts", hearts <= 1 ? "warn" : "");
    }
    /* ---------------- update ----------------------------------------- */
    function update(dt) {
      var i, k, p, s, m, g, q, e, j, bm, ar, was, b3, a;
      lastTick = Date.now();
      if (state === "play") tickCards(dt);
      if (held) return;                            // the cards were dealt this frame
      dt *= MOD.sim;                               // slow motion: the machine, not the clock
      // a big break: the machine drops to SLOW_K of its pace and eases back
      if (slowT > 0) { var sk = Math.min(1, slowT / SLOW_TIME * 1.6); slowT -= dt; dt *= 1 - (1 - SLOW_K) * sk; }
      heartHit = Math.max(0, heartHit - dt);
      hubPop = Math.max(0, hubPop - dt); hubBreak = Math.max(0, hubBreak - dt); hubZap = Math.max(0, hubZap - dt);
      blackT = Math.max(0, blackT - dt);
      zap = Math.max(0, zap - dt);
      chimeGap -= dt; clickGap -= dt; landGap -= dt; noteGap -= dt; boostGap -= dt;
      for (i = 0; i < L.props.length; i++) if (L.props[i].hit > 0) L.props[i].hit -= dt;
      // the lessons, one at a time: a notice never stacks on another hint
      hintT -= dt;
      if (hintT <= 0 && hints.length && state === "play") {
        var h = hints.shift();
        hintT = (h[1].hold || 2200) / 1000 + 0.5;
      }
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i]; p.t += dt;
        p.vy += 700 * dt; p.vx *= 0.985;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.t > p.life) parts.splice(i, 1);
      }
      for (i = shards.length - 1; i >= 0; i--) {
        s = shards[i]; s.t += dt; s.vy += 900 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.a += s.va * dt;
        if (s.t > s.life) shards.splice(i, 1);
      }
      for (i = puffs.length - 1; i >= 0; i--) {
        p = puffs[i]; p.t += dt; if (p.t > 0) { p.y += p.vy * dt; p.r += 26 * dt; }
        if (p.t > p.life) puffs.splice(i, 1);
      }
      for (i = rings.length - 1; i >= 0; i--) { rings[i].t += dt; if (rings[i].t > rings[i].life) rings.splice(i, 1); }
      for (i = arcs.length - 1; i >= 0; i--) {
        ar = arcs[i]; var P = ar.path || path; was = ar.t * ARC_SPEED < P.len;
        ar.t += dt;
        if (MOD.chain && !ar.rev && was) zapAlong(ar, P);
        if (!ar.rev && was && ar.t * ARC_SPEED >= P.len) {
          // The arc reaches the hub: the combo jumps.
          b3 = tier(combo);
          combo += ar.jump; if (combo > bestCombo) bestCombo = combo;
          feedFuse();
          hubZap = 1.2; hubPop = 0.7; zap = ZAP_TIME;
          spark(L.wheel.cx, L.wheel.cy, C.volt, 50, 420);
          spark(L.wheel.cx, L.wheel.cy, C.voltHi, 24, 260);
          ring(L.wheel.cx, L.wheel.cy, C.volt, 40, 200, 0.7, 5);
          ring(L.wheel.cx, L.wheel.cy, C.voltHi, RIM, 460, 0.9, 7);
          ring(L.wheel.cx, L.wheel.cy, C.volt, RIM, 700, 1.2, 3);
          Fx.shake(9, 0.3); Fx.flash(C.volt, 0.22);
          Overlay.vignette(C.volt, 0.6, 900);
          HUD.punch(C.volt);
          popText(L.wheel.cx, L.wheel.cy - RIM - 20, "+" + ar.jump, C.volt);
          if (tier(combo) > b3) tierUp();
        }
        if (ar.rev && was && ar.t * ARC_SPEED >= P.len) {
          // The round-start arc lands on the arrival.
          boxes[arrival].kick = 0.7; boxes[arrival].charge = 1;
          spark(boxes[arrival].x, RIM_Y + 20, C.volt, 24, 280);
          ring(boxes[arrival].x, RIM_Y + 40, C.volt, 20, 200, 0.8, 5);
        }
        if (ar.t * ARC_SPEED > P.len + 700) arcs.splice(i, 1);
      }
      tickCombo(dt);
      for (k in sw) if (sw.hasOwnProperty(k)) {
        s = sw[k];
        var target = branchAngle(k, s.dir), da = mod(target - s.ang + Math.PI, PI2) - Math.PI;
        s.ang += da * Math.min(1, dt / FLIP_TIME * 1.5);
        s.kb += (s.dir - s.kb) * Math.min(1, dt / FLIP_TIME * 1.5);
        s.flash = Math.max(0, s.flash - dt); s.snap = Math.max(0, s.snap - dt);
      }
      for (i = 0; i < chimes.length; i++) chimes[i].hit += dt;
      for (k in boxes) if (boxes.hasOwnProperty(k)) {
        boxes[k].kick = Math.max(0, boxes[k].kick - dt); boxes[k].fizz = Math.max(0, boxes[k].fizz - dt);
        boxes[k].sweep = Math.max(0, boxes[k].sweep - dt); boxes[k].charge = Math.max(0, boxes[k].charge - dt * 0.8);
      }
      for (i = 0; i < gates.length; i++) { gates[i].broke = Math.max(0, gates[i].broke - dt); gates[i].pop = Math.max(0, gates[i].pop - dt); }
      if (sink) sink.kick = Math.max(0, sink.kick - dt);
      for (k in wheel.flashT) if (wheel.flashT.hasOwnProperty(k)) wheel.flashT[k] = Math.max(0, wheel.flashT[k] - dt);
      /* The screw turns on, a round lost or not; each turn of a thread past
         its foot takes the marble waiting there. */
      var slot0 = Math.floor(screwSlot);
      screwSlot += TOWER.starts * TOWER.turns * dt;
      if (Math.floor(screwSlot) !== slot0 && towerQ.length) {
        bm = towerQ.shift(); bm.st = "screw"; bm.y = TOWER.bot; bm.x = TOWER.x;
      }
      // the arrival crackles now and then along its edges
      if (Math.random() < 0.12 && parts.length < PART_MAX) {
        parts.push({ x: boxes[arrival].x + (Math.random() - 0.5) * L.mouthW * 2, y: RIM_Y + Math.random() * 60,
                     vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 120, life: 0.4, t: 0, color: C.voltHi, s: 2 });
      }
      if (state !== "play") {
        // The last heart went: the machine grinds on for a beat, then the end.
        for (i = marbles.length - 1; i >= 0; i--) if (marbles[i].st === "dead") marbles.splice(i, 1);
        overT -= dt;
        if (overT <= 0) finish("hearts");
        return;
      }

      t += dt;
      var mdt = dt * tempo();

      // The round opens on the electric arrival: an arc runs from the hub
      // down to the receptacle that is the target this shift.
      if (revealT > 0) {
        revealT -= dt;
        if (revealT <= 0) {
          arcs.push({ t: 0, jump: 0, rev: true });
        }
      }

      // The pour: the feed gear turns one pocket every pourGap(), and the
      // pocket reaching the release lays its marble on the rail.
      feedK += dt / pourGap();
      if (feedK >= 1) { feedK -= 1; feedTurn = (feedTurn + 1) % FEED.pockets; spawn(queue.shift()); queue.push(rollKind()); }
      if (MOD.autoSwitch) autoSteer();

      // Locks come at random, more and more often.
      lockT -= dt * MOD.lockRate;
      if (lockT <= 0) {
        if (lockedCount() < lockMax()) lockOne();
        lockT = lockGap() * (0.6 + 0.8 * Math.random());
      }
      // Gates: an open gate lets everything through; an unlocked gate first
      // runs its queue out in a burst.
      for (i = 0; i < gates.length; i++) {
        g = gates[i];
        if (g.locked) g.lockAge += dt; else g.open += dt;
        if (g.locked && MOD.autoGate[i] && g.lockAge > 0.35) unlock(g);
        if (g.flush) {
          g.flushT -= dt;
          if (g.flushT <= 0 && g.q.length) {
            m = releaseGate(g, M.flushV); g.flushT = M.flushGap / MOD.flush;
            comboSpark(m.x, m.y, MOD.comboStep);
          }
          if (!g.q.length) g.flush = false;
        }
      }

      // The wheel turns, faster with the combo tier; a waiting marble boards
      // the first free notch that sweeps past its entry.
      var surge = zapK();
      wheel.omega += (WHEEL_OMEGA * (1 + TIER_SPIN * tier(combo)) * (1 + ZAP_SPIN * surge) - wheel.omega) * Math.min(1, dt * (zap > 0 ? 5 : 2));
      // the surge crackles off the rim
      for (j = 0; surge > 0 && j < 4 && parts.length < PART_MAX; j++) {
        if (Math.random() > 0.3 + 0.6 * surge) continue;
        a = Math.random() * PI2;
        parts.push({ x: L.wheel.cx + Math.cos(a) * RIM, y: L.wheel.cy + Math.sin(a) * RIM,
                     vx: Math.cos(a) * 220 + (Math.random() - 0.5) * 80, vy: Math.sin(a) * 220 - 40,
                     life: 0.35, t: 0, color: Math.random() < 0.5 ? C.volt : C.voltHi, s: 1.8 + Math.random() * 1.6 });
      }
      var step = PI2 / wheel.n, prev = wheel.phase, dA = wheel.omega * mdt;
      wheel.phase += dA;
      var ENTRY = L.wheel.entries;
      for (e in wheel.q) if (wheel.q.hasOwnProperty(e)) {
        q = wheel.q[e];
        if (!q.length) continue;
        for (j = 0; j < wheel.n && q.length; j++) {
          if (wheel.notch[j]) continue;
          if (mod(ENTRY[e] - (prev + j * step), PI2) < dA) {
            bm = q.shift();
            bm.st = "wheel"; bm.notch = j; bm.left = mod(Math.PI / 2 - ENTRY[e], PI2);
            wheel.notch[j] = bm;
          }
        }
      }

      for (j = 0; j < fers.length; j++) stepFerry(fers[j], mdt);

      var onTrack = 0, wg = CH[L.wheel.out].gate;
      for (i = 0; i < marbles.length; i++) {
        m = marbles[i];
        if (m.e && (m.st === "track" || m.st === "wheel" || m.st === "ferry") && Math.random() < 0.45 && parts.length < PART_MAX) {
          parts.push({ x: m.x + (Math.random() - 0.5) * 10, y: m.y + (Math.random() - 0.5) * 10,
                       vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40 - 20,
                       life: 0.3, t: 0, color: Math.random() < 0.5 ? C.volt : C.voltHi, s: 1.6 + Math.random() * 1.4 });
        }
        if (m.st === "track") { onTrack++; roll(m, mdt); }
        else if (m.st === "wait") {
          var qq = wheel.q[m.ch.id], spot = m.ch.len - qq.indexOf(m) * 2.2 * R;
          m.d = Math.min(spot, m.d + 260 * mdt); place(m);
        } else if (m.st === "wheel") {
          onTrack++;
          m.left -= dA; m.rot += dA * WHEEL_R / R;
          var ang = wheel.phase + m.notch * step;
          m.x = L.wheel.cx + Math.cos(ang) * WHEEL_R; m.y = L.wheel.cy + Math.sin(ang) * WHEEL_R; m.z = 1;
          if (m.left <= 0) {
            // The gate under the wheel is locked and full: the marble stays aboard for a lap.
            if (wg && (wg.locked || wg.flush) && gateLoad(wg) >= wg.cap) m.left += PI2;
            else { wheel.notch[m.notch] = null; m.st = "track"; m.ch = CH[L.wheel.out]; m.d = 0; m.v = M.vMin + 40; m.gateOk = false; }
          }
        } else if (m.st === "fwait") {
          var fq = m.fer.q, fspot = Math.max(0, m.ch.len - fq.indexOf(m) * 2.2 * R);
          m.d = Math.min(fspot, m.d + 260 * mdt); place(m);
        } else if (m.st === "ferry") {
          onTrack++;
          var fr = m.fer, fa = fr.phase + m.notch * PI2 / fr.f.n;
          m.left -= FERRY_OMEGA * mdt; m.rot += FERRY_OMEGA * mdt * fr.f.dir * fr.f.r / R;
          m.x = fr.f.cx + Math.cos(fa) * fr.f.r; m.y = fr.f.cy + Math.sin(fa) * fr.f.r; m.z = 1;
          if (m.left <= 0) {
            fr.notch[m.notch] = null; m.fer = null;
            m.st = "track"; m.ch = CH[fr.f.out]; m.d = 0; m.v = M.vMin + 40; m.gateOk = false; place(m);
          }
        } else if (m.st === "gate") {
          var gq = m.gate, gspot = Math.max(0, gq.d - gq.q.indexOf(m) * 2.2 * R);
          m.d = Math.min(gspot, m.d + (gq.flush ? 520 : 220) * mdt); place(m);
        } else if (m.st === "drop") {
          m.vy += 1800 * dt; m.y += m.vy * dt; m.z = 1;
          if (m.y >= gutterY(m.x) - R) { m.y = gutterY(m.x) - R; m.st = "gutter"; }
        } else if (m.st === "gutter") {
          // down the gutter to the foot of the tower, queued behind whoever waits there
          m.x += GUTTER_SPEED * dt; m.y = gutterY(m.x) - R; m.rot += GUTTER_SPEED * dt / R;
          if (m.x >= TOWER.x - towerQ.length * 2.2 * R) { m.st = "towait"; towerQ.push(m); }
        } else if (m.st === "towait") {
          m.x = Math.min(TOWER.x - towerQ.indexOf(m) * 2.2 * R, m.x + GUTTER_SPEED * dt); m.y = gutterY(m.x) - R;
        } else if (m.st === "screw") {
          // straight up in front of the blade, which is what pushes it
          m.y -= TOWER_V * dt; m.x = TOWER.x; m.z = 1;
          if (m.y <= TOWER.top) m.st = "dead";
        }
      }
      for (i = marbles.length - 1; i >= 0; i--) if (marbles[i].st === "dead") marbles.splice(i, 1);
      flow += (onTrack * 0.05 - flow) * Math.min(1, dt * 2);
    }

    /* A marble on the rails: gravity along the slope, rolling drag, clamped
       so it never stalls at the top of a loop. It queues at a gate that is
       locked (or still running out its burst), meets a switch (which it flips
       on its way through), the wheel, or a receptacle. */
    function roll(m, mdt) {
      var p = at(m.ch, m.d), i, c, gt, gstop, stop, s, rest;
      // in flight nothing drags; a boosted marble keeps its shot a moment
      var fr = p.sk === SK_AIR || m.vb > 0 ? 0 : M.friction, top = m.vb > 0 ? M.vMax * BOOST_K : M.vMax;
      if (m.vb > 0) m.vb -= mdt;
      m.v = Math.max(M.vMin, Math.min(top, m.v + (M.gravity * p.slope - fr) * mdt));
      var d0 = m.d;
      m.d += m.v * mdt; m.rot += m.v * mdt / R;
      for (i = 0; i < chimes.length; i++) {
        c = chimes[i];
        if (c.ch === m.ch && d0 < c.d && m.d >= c.d) {
          c.hit = 0;
          if (chimeGap <= 0) { chimeGap = 0.32; Sound.clip("chime", 0.05, 0.85 + c.n * 0.09); }
        }
      }
      if (m.ch.mods && m.ch.mods.length) moduleFx(m, d0);
      if ((MOD.loop || MOD.spiral) && m.ch.mods) modulePrize(m, d0);
      var ch = m.ch;
      gt = ch.gate;
      if (gt && !m.gateOk && (gt.locked || gt.flush)) {
        gstop = Math.max(0, gt.d - gt.q.length * 2.2 * R);
        if (m.d >= gstop) {
          if (gt.q.length >= gt.cap) { place(m); spill(m, gt.spill, gt); return; }
          m.d = gstop; m.st = "gate"; m.gate = gt; gt.q.push(m); place(m); return;
        }
      } else if (gt && m.d >= gt.d) m.gateOk = true;
      if (ch.ferK != null) {
        // a ferry gear: wait at the rim for the next free pocket
        var fq = fers[ch.ferK].q;
        stop = ch.len - fq.length * 2.2 * R;
        if (m.d >= stop) { m.d = Math.max(0, stop); m.st = "fwait"; m.fer = fers[ch.ferK]; fq.push(m); place(m); return; }
      } else if (ch.to === "wheel") {
        var wq = wheel.q[ch.id];
        stop = ch.len - wq.length * 2.2 * R;
        if (m.d >= stop) {
          if (wq.length >= waitCap) { place(m); wheel.flashT[ch.id] = 0.6; spill(m, wheel.spill[ch.id], null); place(m); return; }
          m.d = stop; m.st = "wait"; wq.push(m);
        }
      } else if (m.d >= ch.len) {
        if (ch.join != null) { rest = m.d - ch.len; m.ch = CH[ch.to]; m.d = ch.join + rest; }
        else if (ch.to === "sink") { sinkHit(m); return; }
        else if (L.out[ch.to]) {
          s = sw[ch.to]; rest = m.d - ch.len;
          // a splitting spark sends a clone down the other branch
          if (m.splitter) {
            var cl = newMarble("e", m.x, m.y);
            cl.clone = true; cl.ch = CH[L.out[ch.to][1 - s.dir]]; cl.d = rest; cl.v = m.v; place(cl);
            spark(m.x, m.y, C.voltHi, 14, 260);
          }
          m.ch = CH[L.out[ch.to][s.dir]]; m.d = rest; m.gateOk = false; s.spin += 0.3;
          if (!MOD.frozen) flip(ch.to, true);
        } else { deliver(m, ch.to); return; }
      }
      place(m);
    }
    function place(m) { var p = at(m.ch, m.d); m.x = p.x; m.y = p.y; m.z = p.z; }

    /* The cards that play on the rails. */
    // A module prize: a marble over the top of a loop, or out of a spiral.
    function modulePrize(m, d0) {
      var i, md, v, pts, mods = m.ch.mods;
      for (i = 0; i < mods.length; i++) {
        md = mods[i]; v = md.kind === "loop" ? MOD.loop : md.kind === "spiral" ? MOD.spiral : 0;
        if (!v || d0 >= md.d || m.d < md.d) continue;
        pts = Math.round(v * mult() * MOD.score);
        score += pts; HUD.setScore(score);
        popText(m.x, m.y - 30, Lang.t(md.kind === "loop" ? "Loop +" : "Spiral +") + pts, C.amber);
        spark(m.x, m.y, C.amber, 8, 200);
        if (chimeGap <= 0) { chimeGap = 0.2; Sound.clip("chime", 0.05, 1.2); }
      }
    }
    /* What the moving modules do as a marble crosses their mark: a jump's
       catcher takes the landing (a knock, the speed it loses), a stair rings
       its note, a booster fires. */
    function moduleFx(m, d0) {
      var i, md, mods = m.ch.mods;
      for (i = 0; i < mods.length; i++) {
        md = mods[i];
        if (d0 >= md.d || m.d < md.d) continue;
        if (md.kind === "land") {
          m.v *= 0.72;
          spark(m.x, m.y + R, C.steelL, m.clone ? 2 : 5, 150, 90);
          ring(m.x, m.y, C.steelL, R, 50, 0.3, 3);
          if (landGap <= 0) { landGap = 0.08; Sound.clip("land", 0.32, Rand.range(0.92, 1.08)); }
        } else if (md.kind === "note") {
          spark(m.x, m.y + R, C.steelL, 2, 90, 60);
          if (noteGap <= 0) { noteGap = 0.06; Sound.clip("chime", 0.07, 1.5 - md.n * 0.1); }
        } else if (md.kind === "boost") {
          m.vb = BOOST_TIME; m.v = M.vMax * BOOST_K;
          fireCoils(m.ch, md.d);
          spark(m.x, m.y, C.amber, 6, 220);
          if (boostGap <= 0) { boostGap = 0.2; Sound.clip("boost", 0.22, Rand.range(0.95, 1.05)); }
        }
      }
    }
    // A booster's coils light up round the marble they shoot.
    function fireCoils(ch, d) {
      var p = at(ch, d, {}), i, q;
      for (i = 0; i < L.props.length; i++) {
        q = L.props[i];
        if (q.k === "coil" && (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y) < 90 * 90) q.hit = 0.45;
      }
    }
    // Chain lightning: the head of a payoff arc zaps every marble it passes.
    function zapAlong(ar, P) {
      var head = ar.t * ARC_SPEED, i = 0, j, m, hx, hy, pts;
      while (i < P.ls.length - 1 && P.ls[i] < head) i++;
      hx = P.xs[i]; hy = P.ys[i];
      for (j = 0; j < marbles.length; j++) {
        m = marbles[j];
        if (m.zap === ar.id || (m.st !== "track" && m.st !== "gate" && m.st !== "wait" && m.st !== "wheel" && m.st !== "fwait" && m.st !== "ferry")) continue;
        if ((m.x - hx) * (m.x - hx) + (m.y - hy) * (m.y - hy) > 56 * 56) continue;
        m.zap = ar.id;
        pts = Math.round(MOD.chain * mult() * MOD.score);
        score += pts; HUD.setScore(score);
        popText(m.x, m.y - 24, "+" + pts, C.voltHi);
        spark(m.x, m.y, C.voltHi, 6, 200);
      }
    }
    // Auto switch: every switch an electric marble is about to reach lies its way.
    function autoSteer() {
      var i, m, id, want, rem;
      for (i = 0; i < marbles.length; i++) {
        m = marbles[i];
        if (!m.e || m.st !== "track" || !L.out[m.ch.to]) continue;
        rem = m.ch.len - m.d;
        if (rem > 150) continue;
        id = m.ch.to; want = routeWant(id);
        if (want !== null && sw[id].dir !== want) flip(id, false);
      }
    }

    /* A ferry gear turns; a free pocket sweeping past where its line ends
       takes the marble waiting there, for the length of the ride. */
    function stepFerry(fr, mdt) {
      var f = fr.f, step = PI2 / f.n, prev = fr.phase, dA = FERRY_OMEGA * mdt, i, m;
      fr.phase += f.dir * dA;
      for (i = 0; i < f.n && fr.q.length; i++) {
        if (fr.notch[i] || mod(f.dir * (f.a0 - (prev + i * step)), PI2) >= dA) continue;
        m = fr.q.shift();
        m.st = "ferry"; m.notch = i; m.left = f.travel; fr.notch[i] = m;
      }
    }

    /* ---------------- the end ---------------------------------------- */
    function finish(reason) {
      if (ended) return;                          // the clock and a heart can race
      ended = true;
      if (held) { var hn = held.node; held = null; if (hn.parentNode) hn.parentNode.removeChild(hn); Music.unduck(); }
      var st = score >= M.star3 ? 3 : score >= M.star2 ? 2 : score > 0 ? 1 : 0;
      endRound({
        title: reason === "hearts" ? CONFIG.copy.gameOver : st === 3 ? CONFIG.copy.perfect : CONFIG.copy.timeUp,
        variant: st === 3 ? "perfect" : st === 2 ? "win" : "",
        score: score,
        stars: st,
        rows: [
          { label: "Marbles delivered", value: stats.delivered },
          { label: "Electric on target", value: stats.eOn, grade: "accent" },
          { label: "Best combo", value: bestCombo, grade: "good" },
          { label: "Best score", value: Math.max(score, best), grade: "gold" }
        ]
      });
    }

    /* ===============================================================
       INPUT — a tap goes to the nearest target within reach.
       =============================================================== */
    function nearest(mx, my) {
      var best_ = null, bd = M.tapReach, d, k, i, g;
      for (k in boxes) if (boxes.hasOwnProperty(k)) {
        d = Math.sqrt((boxes[k].x - mx) * (boxes[k].x - mx) + (RIM_Y + 50 - my) * (RIM_Y + 50 - my));
        if (d < bd) { bd = d; best_ = { box: k }; }
      }
      for (i = 0; i < gates.length; i++) {
        g = gates[i];
        if (!g.locked) continue;
        d = Math.sqrt((g.px - mx) * (g.px - mx) + (g.py - my) * (g.py - my));
        if (d < bd) { bd = d; best_ = { gate: g }; }
      }
      return best_;
    }
    // The gate closest to overflowing, for SPACE: the one a player would reach for.
    function urgent() {
      var best_ = null, bk = -1, i, g, k;
      for (i = 0; i < gates.length; i++) {
        g = gates[i];
        if (!g.locked) continue;
        k = g.q.length / g.cap + (g.q.length ? 0.01 : 0);
        if (k > bk) { bk = k; best_ = g; }
      }
      return best_;
    }
    function onDown(p) {
      if (state !== "play" || held) return;
      if (spaceTap) { spaceTap = false; unlock(urgent()); return; }
      var hit = nearest((p.x - OX) / S, (p.y - OY) / S);
      if (!hit) return;
      if (hit.gate) unlock(hit.gate);
      else moveSocket(hit.box);
    }
    /* The keyboard. The motor turns SPACE into a tap at the middle of the
       play band, and this listener runs first (section 6 binds before the
       bootstrap), so it marks that tap as SPACE's: it opens the most urgent
       lock instead of whatever sits nearest the middle. 1-6 move the socket
       to the arrivals, left to right, and Q W E R T Y open the gates, as
       many as the machine has.
       Only while a round is really running: a card over the round pauses
       the loop, and `lastTick` stops. */
    var GATE_KEYS = "qwerty";
    window.addEventListener("keydown", function (e) {
      if (State !== "playing" || Enter.active()) return;
      // the two cards: 1 / 2 or left / right, and nothing else reaches the machine
      if (held) {
        if (e.repeat) return;
        if (e.key === "1" || e.key === "ArrowLeft") { e.preventDefault(); take(0); }
        else if (e.key === "2" || e.key === "ArrowRight") { e.preventDefault(); take(1); }
        return;
      }
      if (Date.now() - lastTick > 250 || state !== "play") return;
      if ((e.key || "").toLowerCase() === "k" && !e.repeat) { e.preventDefault(); useKey(); return; }
      if (e.code === "Space" || e.key === " ") { spaceTap = !e.repeat; return; }
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      var k = (e.key || "").toLowerCase(), n = k >= "1" && k <= "6" ? k.charCodeAt(0) - 49 : -1, g = GATE_KEYS.indexOf(k);
      if (n >= 0 && n < L.arr.length) { e.preventDefault(); moveSocket(L.arr[n].id); }
      else if (g >= 0 && k.length === 1 && g < gates.length) { e.preventDefault(); unlock(gates[g]); }
    });

    /* ===============================================================
       SPRITES — everything that never changes shape is drawn once.
       Sized in device pixels through view.dpr and the machine's scale, and
       rebuilt by onResize, so a resize is followed and nothing over-renders.
       =============================================================== */
    var layers = null, wheelCv = null, wheelN = 0, cogCv = null, feedCv = null, ferryCvs = {}, sprites = {}, glows = {};
    var built = "", builtRails = "";
    function canvasOf(w, h) {
      var cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h));
      return cv;
    }
    function build() {
      var k = S * view.dpr, key = k.toFixed(3) + "/" + TINT.key;
      if (built !== key) { built = key; buildCog(k); buildMarbles(k); feedCv = gearSprite(k, FEED.r, FEED.pockets); ferryCvs = {}; wheelN = 0; }
      if (!L) return;
      if (wheelN !== L.wheel.notches) { wheelN = L.wheel.notches; buildWheel(k, wheelN); }
      if (builtRails !== key + "/" + L.n) { builtRails = key + "/" + L.n; buildRails(k); }
    }
    // A radial glow, one per colour, drawn at any size with drawImage.
    function glow(col) {
      var g = glows[col];
      if (g) return g;
      g = canvasOf(64, 64);
      var c = g.getContext("2d"), gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, rgba(col, 0.9)); gr.addColorStop(0.35, rgba(col, 0.42));
      gr.addColorStop(0.7, rgba(col, 0.12)); gr.addColorStop(1, rgba(col, 0));
      c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
      glows[col] = g;
      return g;
    }
    function drawGlow(col, x, y, r, a) {
      if (a <= 0.003) return;
      var ga = ctx.globalAlpha;
      ctx.globalAlpha = ga * a;
      ctx.drawImage(glow(col), x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = ga;
    }

    /* THE RAILS, three cached layers per machine (and per scale), each cut to
       the box its points need:
         back   the lines that run BEHIND the machine — smaller, dimmer —
                under every marble that is in front;
         front  the whirlpool bowls, the front rails on their dark bed, the
                glass tubes' walls and the pipe mouths;
         glass  the tubes' sheen, laid OVER the marbles so a marble inside a
                tube is seen through glass.
       The marbles that are behind are drawn between back and front, which is
       the whole depth system: a dive, the far half of a coil or a corkscrew. */
    function boxOf(test, pad) {
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, id, ch, i, any = false;
      for (id in CH) if (CH.hasOwnProperty(id)) {
        ch = CH[id];
        for (i = 0; i < ch.n; i++) if (test(ch, i)) {
          any = true;
          if (ch.xs[i] < x0) x0 = ch.xs[i]; if (ch.xs[i] > x1) x1 = ch.xs[i];
          if (ch.ys[i] < y0) y0 = ch.ys[i]; if (ch.ys[i] > y1) y1 = ch.ys[i];
        }
      }
      if (!any) return null;
      return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
    }
    function layer(box, k, paint) {
      if (!box) return null;
      var cv = canvasOf(box.w * k, box.h * k), c = cv.getContext("2d");
      c.setTransform(k, 0, 0, k, -box.x * k, -box.y * k);
      paint(c);
      return { cv: cv, x: box.x, y: box.y, w: box.w, h: box.h };
    }
    function isBack(ch, i) { return ch.zs[i] < 0; }
    function isFront(ch, i) { return ch.zs[i] >= 0 && !ch.gs[i]; }
    function isGlass(ch, i) { return ch.zs[i] >= 0 && ch.gs[i] === SK_GLASS; }
    function isZebra(ch, i) { return ch.zs[i] >= 0 && ch.gs[i] === SK_ZEBRA; }
    function isHose(ch, i) { return ch.zs[i] >= 0 && ch.gs[i] === SK_HOSE; }
    // what is laid OVER the marbles: the glass sheen, the zebra's bands, the hose
    function isOver(ch, i) { return ch.zs[i] >= 0 && ch.gs[i] >= SK_GLASS && ch.gs[i] <= SK_HOSE; }
    /* A ZEBRA tube's opaque bands: ZEBRA_BAND px of paint every ZEBRA_P px
       along the line, so each window between is wider than a marble. */
    var ZEBRA_P = 58, ZEBRA_BAND = 24;
    function zebraBand(ch, i) { return isZebra(ch, i) && (i * DS) % ZEBRA_P < ZEBRA_BAND; }
    // A box grown to take in a point and its radius.
    function grow(box, x, y, r) {
      if (!box) return { x: x - r, y: y - r, w: r * 2, h: r * 2 };
      var x1 = Math.max(box.x + box.w, x + r), y1 = Math.max(box.y + box.h, y + r);
      box.x = Math.min(box.x, x - r); box.y = Math.min(box.y, y - r);
      box.w = x1 - box.x; box.h = y1 - box.y;
      return box;
    }
    function eachCh(fn) { for (var id in CH) if (CH.hasOwnProperty(id)) fn(CH[id]); }
    /* THE LIT RAILS, from the second tier of the combo: the front rails
       drawn again in the tier's colour, at half resolution (it is a glow),
       one cached layer per colour and per machine — `layers` is rebuilt
       with the rails, so the cache goes with it. */
    function isLit(ch, i) { return !ch.spill && ch.zs[i] >= 0; }
    function litLayer(col) {
      var lit = layers.lit || (layers.lit = {});
      if (lit[col] !== undefined) return lit[col];
      lit[col] = layer(boxOf(isLit, 30), S * view.dpr * 0.5, function (c) {
        c.lineCap = "round"; c.lineJoin = "round";
        c.strokeStyle = rgba(col, 0.16); c.lineWidth = 2 * R + 14;
        eachCh(function (ch) { runs(c, ch, isLit, 0); });
        c.strokeStyle = col; c.lineWidth = 4;
        eachCh(function (ch) { runs(c, ch, isLit, -(R + 2)); runs(c, ch, isLit, R + 2); });
      });
      return lit[col];
    }
    function drawLitRails() {
      var tr = tier(combo), Ll;
      if (tr < 2 || state !== "play" || blackT > 0) return;
      Ll = litLayer(TIERS_COL[tr]);
      if (!Ll) return;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = (0.22 + 0.2 * heat()) * (0.75 + 0.25 * Math.sin(t * 5));
      ctx.drawImage(Ll.cv, Ll.x, Ll.y, Ll.w, Ll.h);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    /* THE FRAME GLOW: the edges of the screen take the tier's colour, more
       of it as the combo grows, breathing. One small cached picture per
       colour, stretched over the frame: a single blit a frame. */
    var edgeCvs = {};
    function edgeGlow(col) {
      if (edgeCvs[col]) return edgeCvs[col];
      // a circle in a square, stretched over the frame: an ellipse that
      // reaches every edge, not only the corners
      var cv = canvasOf(64, 64), c = cv.getContext("2d"), g = c.createRadialGradient(32, 32, 18, 32, 32, 46);
      g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.4, rgba(col, 0.28)); g.addColorStop(1, rgba(col, 0.9));
      c.fillStyle = g; c.fillRect(0, 0, 64, 64);
      edgeCvs[col] = cv;
      return cv;
    }
    function drawFrameGlow() {
      var tr = tier(combo), k = heat();
      if (!tr || state !== "play") return;
      ctx.globalAlpha = (0.12 + 0.38 * k) * (0.8 + 0.2 * Math.sin(t * 3.2));
      ctx.drawImage(edgeGlow(TIERS_COL[tr]), 0, 0, view.w, view.h);
      ctx.globalAlpha = 1;
    }
    function buildRails(k) {
      var fb = boxOf(function (ch, i) { return ch.zs[i] >= 0; }, 40);
      var j, bw;
      for (j = 0; j < L.bowls.length; j++) {
        bw = L.bowls[j];
        fb.x = Math.min(fb.x, bw.cx - bw.r - 30); fb.w = Math.max(fb.x + fb.w, bw.cx + bw.r + 30) - fb.x;
      }
      var ob = boxOf(isOver, 34);
      for (j = 0; j < L.props.length; j++) {
        bw = L.props[j];
        if (bw.k === "coil") ob = grow(ob, bw.x, bw.y, R + 16);
        else if (bw.k === "catch") fb = grow(fb, bw.x, bw.y, R + 60);
        else if (bw.k === "kick") fb = grow(fb, bw.x, bw.y, bw.rk + 30);
        else if (bw.k === "ledge") { fb = grow(fb, bw.x0, bw.y, 30); fb = grow(fb, bw.x1, bw.y, 30); }
      }
      layers = {
        // the spill network first and faint, so a dive of the front lines reads over it
        back: layer(boxOf(isBack, 34), k, function (c) {
          eachCh(function (ch) { if (ch.spill) { c.globalAlpha = SPILL_ALPHA; railBed(c, ch, isBack); c.globalAlpha = 1; } });
          eachCh(function (ch) { if (ch.spill) railPass(c, ch, isBack, SPILL_ALPHA); });
          eachCh(function (ch) { if (!ch.spill) railBed(c, ch, isBack); });
          eachCh(function (ch) { if (!ch.spill) railPass(c, ch, isBack, 0.8); });
        }),
        front: layer(fb, k, function (c) {
          for (var b = 0; b < L.bowls.length; b++) paintBowl(c, L.bowls[b]);
          eachCh(function (ch) { railBed(c, ch, isFront); });
          eachCh(function (ch) { railPass(c, ch, isFront, 1); });
          eachCh(function (ch) { tubeWalls(c, ch, isGlass, 14); tubeWalls(c, ch, isZebra, 0); });
          eachCh(function (ch) { for (var i = 0; i < ch.mouths.length; i++) paintMouth(c, ch, ch.mouths[i]); });
          for (var q = 0; q < L.props.length; q++) paintProp(c, L.props[q]);
        }),
        glass: layer(ob, k, function (c) {
          eachCh(function (ch) { tubeSheen(c, ch, isGlass); });
          eachCh(function (ch) { zebraBands(c, ch); });
          eachCh(function (ch) { hoseBody(c, ch); });
          for (var q = 0; q < L.props.length; q++) if (L.props[q].k === "coil") paintCoil(c, L.props[q]);
        })
      };
      // the spill network's cogs, one sprite each at its own size
      layers.cogs = [];
      for (j = 0; j < L.cogs.length; j++) {
        bw = L.cogs[j][2];
        layers.cogs.push(layer({ x: -bw - 2, y: -bw - 2, w: bw * 2 + 4, h: bw * 2 + 4 }, k, function (c) {
          paintCog(c, bw, Math.max(8, Math.round(bw / 4)), bw > 40 ? 6 : 4, bw * 0.16);
        }));
      }
      // the lit rails of the two top tiers, built now rather than mid-round
      for (j = 2; j < TIERS_COL.length; j++) litLayer(TIERS_COL[j]);
    }
    // Stroke the runs of a channel that pass `keep`, each shifted along the
    // normal by `off` (scaled with the depth).
    function runs(c, ch, keep, off, dx, dy) {
      var i, nv, open = false, sc, x, y;
      c.beginPath();
      for (i = 0; i < ch.n; i++) {
        if (!keep(ch, i)) { open = false; continue; }
        nv = normalAt(ch, i); sc = dsc(ch.zs[i]);
        x = ch.xs[i] + nv[0] * off * sc + (dx || 0); y = ch.ys[i] + nv[1] * off * sc + (dy || 0);
        if (!open) { c.moveTo(x, y); open = true; } else c.lineTo(x, y);
      }
      c.stroke();
    }
    function railBed(c, ch, keep) {
      c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = tca("#0a051c", .55); c.lineWidth = 2 * R + 22;
      runs(c, ch, keep, 0);
      c.strokeStyle = tca("#6046be", .10); c.lineWidth = 2 * R + 8;
      runs(c, ch, keep, 0);
    }
    function railPass(c, ch, keep, alpha) {
      var i, nv, sc, hw, pass;
      c.globalAlpha = alpha; c.lineCap = "round"; c.lineJoin = "round";
      for (i = 0; i < ch.n; i += 5) {
        if (!keep(ch, i)) continue;
        nv = normalAt(ch, i); sc = dsc(ch.zs[i]); hw = (R + 8) * sc;
        c.strokeStyle = tc("#140c33"); c.lineWidth = 7 * sc;
        c.beginPath(); c.moveTo(ch.xs[i] - nv[0] * hw, ch.ys[i] - nv[1] * hw);
        c.lineTo(ch.xs[i] + nv[0] * hw, ch.ys[i] + nv[1] * hw); c.stroke();
        c.strokeStyle = tc("#4a3b8e"); c.lineWidth = 4 * sc;
        c.beginPath(); c.moveTo(ch.xs[i] - nv[0] * (hw - 1), ch.ys[i] - nv[1] * (hw - 1));
        c.lineTo(ch.xs[i] + nv[0] * (hw - 1), ch.ys[i] + nv[1] * (hw - 1)); c.stroke();
      }
      var PASS = [["rgba(0,0,0,.5)", 6.5, 1.5, 2.5], [tc("#3d3079"), 5, 0, 0], [tc("#b7abf0"), 2.6, -0.6, -0.8], [tc("#f4f0ff"), 1, -0.9, -1.2]];
      for (pass = 0; pass < PASS.length; pass++) {
        c.strokeStyle = PASS[pass][0]; c.lineWidth = PASS[pass][1];
        runs(c, ch, keep, -(R + 2), PASS[pass][2], PASS[pass][3]);
        runs(c, ch, keep, R + 2, PASS[pass][2], PASS[pass][3]);
      }
      c.globalAlpha = 1;
    }
    // A glass tube (a zebra's too): two walls and a joint every `joint`
    // steps (none at 0), on the front layer...
    function tubeWalls(c, ch, keep, joint) {
      var i, nv;
      c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = tca("#0a051c", .5); c.lineWidth = 2 * R + 16; runs(c, ch, keep, 0);
      c.strokeStyle = tca("#9678ff", .10); c.lineWidth = 2 * R + 8; runs(c, ch, keep, 0);
      c.strokeStyle = tc("#0b0720"); c.lineWidth = 5;
      runs(c, ch, keep, -(R + 5)); runs(c, ch, keep, R + 5);
      c.strokeStyle = tc("#cfc6f5"); c.lineWidth = 2;
      runs(c, ch, keep, -(R + 5)); runs(c, ch, keep, R + 5);
      for (i = 0; joint && i < ch.n; i += joint) {
        if (!keep(ch, i)) continue;
        nv = normalAt(ch, i);
        c.strokeStyle = tc("#0b0720"); c.lineWidth = 7;
        c.beginPath(); c.moveTo(ch.xs[i] - nv[0] * (R + 8), ch.ys[i] - nv[1] * (R + 8));
        c.lineTo(ch.xs[i] + nv[0] * (R + 8), ch.ys[i] + nv[1] * (R + 8)); c.stroke();
        c.strokeStyle = tc("#e6e0ff"); c.lineWidth = 3; c.stroke();
      }
    }
    // ...and its sheen, over the marbles.
    function tubeSheen(c, ch, keep) {
      c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = tca("#c8b4ff", .14); c.lineWidth = 2 * R + 6; runs(c, ch, keep, 0);
      c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 2.4; runs(c, ch, keep, -(R - 3));
      c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 1.5; runs(c, ch, keep, R - 5);
    }
    /* A zebra tube over the marbles: the windows get the glass sheen, the
       bands are painted metal, wider than the walls, so a marble is cut off
       at every one of them. */
    function zebraBands(c, ch) {
      tubeSheen(c, ch, isZebra);
      c.lineCap = "butt"; c.lineJoin = "round";
      c.strokeStyle = tc("#0b0720"); c.lineWidth = 2 * R + 16; runs(c, ch, zebraBand, 0);
      c.strokeStyle = tc("#cfc6f5"); c.lineWidth = 2 * R + 10; runs(c, ch, zebraBand, 0);
      c.strokeStyle = tca("#4a3b8e", .7); c.lineWidth = 5; runs(c, ch, zebraBand, R + 1);
      c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 2.5; runs(c, ch, zebraBand, -(R - 1));
    }
    /* A hose over the marbles: dark rubber, a rib every step (a lit fold
       every other one), a dull sheen along its top and a clamp collar at
       each end, where it meets the module it joins. */
    function hoseBody(c, ch) {
      var i, nv, w = R + 9;
      c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 2 * R + 18; runs(c, ch, isHose, 0, 3, 5);
      c.strokeStyle = tc("#140f2a"); c.lineWidth = 2 * R + 14; runs(c, ch, isHose, 0);
      c.lineCap = "butt";
      for (i = 0; i < ch.n; i++) {
        if (!isHose(ch, i)) continue;
        nv = normalAt(ch, i);
        c.strokeStyle = i % 2 ? tc("#3b3268") : tc("#07050f"); c.lineWidth = i % 2 ? 2.6 : 1.6;
        c.beginPath(); c.moveTo(ch.xs[i] - nv[0] * w, ch.ys[i] - nv[1] * w);
        c.lineTo(ch.xs[i] + nv[0] * w, ch.ys[i] + nv[1] * w); c.stroke();
      }
      c.lineCap = "round";
      c.strokeStyle = "rgba(255,255,255,.09)"; c.lineWidth = 4; runs(c, ch, isHose, -(R - 2));
      for (i = 0; i < ch.n; i++) {
        if (isHose(ch, i) && (i === 0 || !isHose(ch, i - 1) || i === ch.n - 1 || !isHose(ch, i + 1))) collar(c, ch, i);
      }
    }
    // A clamp collar across a line at its point i.
    function collar(c, ch, i) {
      var nv = normalAt(ch, i), w = R + 12, x = ch.xs[i], y = ch.ys[i];
      c.lineCap = "round";
      c.strokeStyle = tc("#0b0720"); c.lineWidth = 11;
      c.beginPath(); c.moveTo(x - nv[0] * w, y - nv[1] * w); c.lineTo(x + nv[0] * w, y + nv[1] * w); c.stroke();
      c.strokeStyle = tc("#8b7fd0"); c.lineWidth = 7; c.stroke();
      c.strokeStyle = tc("#ece8ff"); c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - nv[0] * (w - 2) - 1, y - nv[1] * (w - 2) - 1.5);
      c.lineTo(x + nv[0] * (w - 2) - 1, y + nv[1] * (w - 2) - 1.5); c.stroke();
    }
    /* What stands beside a line on the front layer: a jump's CATCHER — a
       scoop whose high back wall the marble lands against, open on the side
       it comes from and at the bottom, where it leaves — and a stair's
       LEDGE, a plate on a bracket. */
    function paintProp(c, q) {
      var x0, x1, a0 = -1.3, a1 = 0.7;
      if (q.k === "catch") {
        a0 = -1.75; a1 = 0.75;
        c.save(); c.translate(q.x, q.y); c.scale(q.dir, 1);
        c.lineCap = "round";
        // the post it stands on, then the scoop's dark inside
        c.beginPath(); c.moveTo(R + 10, 10); c.lineTo(R + 18, 52);
        c.strokeStyle = tca("#140c33", .9); c.lineWidth = 8; c.stroke();
        c.strokeStyle = tc("#4a3b8e"); c.lineWidth = 4; c.stroke();
        c.fillStyle = tca("#0a051c", .6);
        c.beginPath(); c.arc(0, 0, R + 17, a0, a1); c.arc(0, 0, R + 1, a1, a0, true); c.closePath(); c.fill();
        c.beginPath(); c.arc(0, 0, R + 9, a0, a1);
        c.strokeStyle = "rgba(0,0,0,.55)"; c.lineWidth = 15; c.stroke();
        c.strokeStyle = tc("#3d3079"); c.lineWidth = 11; c.stroke();
        c.strokeStyle = tc("#b7abf0"); c.lineWidth = 5; c.stroke();
        c.beginPath(); c.arc(0, 0, R + 5, a0 + 0.12, a1 - 0.12);
        c.strokeStyle = tc("#f4f0ff"); c.lineWidth = 1.6; c.stroke();
        // the lip flares out at the top, to take a marble that comes in high
        c.beginPath(); c.moveTo(Math.cos(a0) * (R + 9), Math.sin(a0) * (R + 9));
        c.quadraticCurveTo(Math.cos(a0) * (R + 14), Math.sin(a0) * (R + 14) - 6, Math.cos(a0) * (R + 9) - 12, Math.sin(a0) * (R + 9) - 14);
        c.strokeStyle = "rgba(0,0,0,.55)"; c.lineWidth = 9; c.stroke();
        c.strokeStyle = tc("#b7abf0"); c.lineWidth = 5; c.stroke();
        c.restore();
      } else if (q.k === "kick") {
        // a jump's ramp: a steel wedge under the kicker's curl, the lip plated
        c.save(); c.translate(q.x, q.y); c.scale(q.dir, 1);
        var ex = q.rk * Math.sin(q.lip), ey = -q.rk * (1 - Math.cos(q.lip)), f;
        c.beginPath(); c.moveTo(-10, R + 4);
        for (f = 0; f <= 6; f++) c.lineTo(q.rk * Math.sin(q.lip * f / 6), -q.rk * (1 - Math.cos(q.lip * f / 6)) + R + 4);
        c.lineTo(ex + 4, ey + R + 4); c.lineTo(ex + 4, R + 22); c.lineTo(-10, R + 22); c.closePath();
        c.fillStyle = "rgba(0,0,0,.45)"; c.fill();
        c.fillStyle = tca("#3d3079", .95); c.fill();
        c.lineWidth = 2; c.strokeStyle = tc("#140c33"); c.stroke();
        c.beginPath(); c.moveTo(ex + 4, ey + R + 4); c.lineTo(ex + 4, R + 22);
        c.strokeStyle = tc("#b7abf0"); c.lineWidth = 3; c.stroke();
        c.restore();
      } else if (q.k === "ledge") {
        x0 = Math.min(q.x0, q.x1); x1 = Math.max(q.x0, q.x1);
        c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(x0 + 3, q.y + 4, x1 - x0, 12);
        c.beginPath(); c.moveTo((x0 + x1) / 2, q.y + 10); c.lineTo((x0 + x1) / 2 - 10, q.y + 34);
        c.strokeStyle = tc("#140c33"); c.lineWidth = 7; c.lineCap = "round"; c.stroke();
        c.strokeStyle = tc("#4a3b8e"); c.lineWidth = 3.5; c.stroke();
        c.fillStyle = tc("#140c33"); c.fillRect(x0 - 1, q.y - 1, x1 - x0 + 2, 13);
        c.fillStyle = tc("#3d3079"); c.fillRect(x0, q.y, x1 - x0, 11);
        c.fillStyle = tc("#b7abf0"); c.fillRect(x0, q.y, x1 - x0, 3);
        c.fillStyle = tc("#f4f0ff"); c.fillRect(x0 + 2, q.y, x1 - x0 - 4, 1);
      }
    }
    // A booster's coil: three turns of copper wire wound round the rail.
    function paintCoil(c, q) {
      var j, o;
      c.save(); c.translate(q.x, q.y); c.rotate(q.a);
      for (j = -1; j <= 1; j++) {
        o = j * 6;
        c.beginPath(); c.ellipse(o, 0, 4.5, R + 10, 0, 0, PI2);
        c.strokeStyle = "rgba(20,8,0,.85)"; c.lineWidth = 5.5; c.stroke();
        c.strokeStyle = "#c4733a"; c.lineWidth = 3.4; c.stroke();
        c.beginPath(); c.ellipse(o, 0, 4.5, R + 10, 0, Math.PI * 1.05, Math.PI * 1.6);
        c.strokeStyle = "#ffd6a0"; c.lineWidth = 1.2; c.stroke();
      }
      c.restore();
    }
    // A pipe mouth, where a line dives behind the machine or comes back.
    function paintMouth(c, ch, i) {
      var nv = normalAt(ch, i), a = Math.atan2(nv[1], nv[0]), x = ch.xs[i], y = ch.ys[i];
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = "rgba(0,0,0,.45)"; c.beginPath(); c.ellipse(2, 3, R + 13, 10, 0, 0, PI2); c.fill();
      var g = c.createLinearGradient(-R - 12, 0, R + 12, 0);
      g.addColorStop(0, tc("#3a2f78")); g.addColorStop(0.4, tc("#e6e1ff")); g.addColorStop(1, tc("#2a2058"));
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, R + 12, 9, 0, 0, PI2); c.fill();
      c.fillStyle = "#05030f"; c.beginPath(); c.ellipse(0, 0, R + 5, 5, 0, 0, PI2); c.fill();
      c.lineWidth = 1.5; c.strokeStyle = tca("#0a061e", .9); c.beginPath(); c.ellipse(0, 0, R + 12, 9, 0, 0, PI2); c.stroke();
      c.restore();
    }
    // A whirlpool's bowl: a funnel seen from above, its drain in the middle.
    function paintBowl(c, b) {
      var i, rr, g;
      c.save(); c.translate(b.cx, b.cy); c.scale(1, 0.5);
      c.beginPath(); c.arc(0, 8, b.r + 18, 0, PI2); c.fillStyle = "rgba(0,0,0,.45)"; c.fill();
      g = c.createRadialGradient(0, 18, 4, 0, 0, b.r + 16);
      g.addColorStop(0, tc("#030110")); g.addColorStop(0.35, tc("#1a1240")); g.addColorStop(0.85, tc("#3b2f7c")); g.addColorStop(1, tc("#6f63ad"));
      c.beginPath(); c.arc(0, 0, b.r + 16, 0, PI2); c.fillStyle = g; c.fill();
      for (i = 1; i <= 3; i++) {
        rr = (b.r + 16) * (1 - i * 0.22);
        c.beginPath(); c.arc(0, i * 4, rr, 0, PI2);
        c.lineWidth = 2; c.strokeStyle = "rgba(190,176,255," + (0.3 - i * 0.06) + ")"; c.stroke();
      }
      c.beginPath(); c.arc(0, 0, b.r + 16, 0, PI2);
      c.lineWidth = 6; c.strokeStyle = tc("#0b0720"); c.stroke();
      c.lineWidth = 3; c.strokeStyle = tc("#cfc6f5"); c.stroke();
      c.restore();
    }
    function cogPath(c, x, y, r, teeth, a) {
      var i, an, an2, rr;
      c.beginPath();
      for (i = 0; i < teeth * 2; i++) {
        an = a + i * Math.PI / teeth; an2 = a + (i + 1) * Math.PI / teeth; rr = i % 2 ? r : r * 0.84;
        c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
        c.lineTo(x + Math.cos(an2) * rr, y + Math.sin(an2) * rr);
      }
      c.closePath();
    }
    // A violet steel cog, lit from the top left.
    function paintCog(c, r, teeth, spokes, holeR) {
      var g = c.createLinearGradient(-r, -r, r, r), i, a;
      g.addColorStop(0, tc("#9d8fe0")); g.addColorStop(0.45, tc("#5b4ea3")); g.addColorStop(1, tc("#231b52"));
      cogPath(c, 0, 0, r, teeth, 0);
      c.fillStyle = g; c.fill();
      c.lineWidth = 2; c.strokeStyle = tca("#0a061e", .8); c.stroke();
      c.beginPath(); c.arc(0, 0, r * 0.8, 0, PI2);
      c.lineWidth = 1.5; c.strokeStyle = tca("#e6dcff", .35); c.stroke();
      c.beginPath(); c.arc(0, 0, r * 0.7, 0, PI2);
      var g2 = c.createRadialGradient(-r * 0.2, -r * 0.3, 0, 0, 0, r * 0.7);
      g2.addColorStop(0, tc("#3a2f78")); g2.addColorStop(1, tc("#150e34"));
      c.fillStyle = g2; c.fill();
      c.strokeStyle = tc("#8b7fd0"); c.lineCap = "round";
      for (i = 0; i < spokes; i++) {
        a = i / spokes * PI2;
        c.lineWidth = r * 0.12;
        c.beginPath(); c.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
        c.lineTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66); c.stroke();
      }
      if (holeR) {
        c.beginPath(); c.arc(0, 0, holeR, 0, PI2);
        c.fillStyle = tc("#b3a6ee"); c.fill();
        c.beginPath(); c.arc(0, 0, holeR * 0.5, 0, PI2);
        c.fillStyle = tc("#1b1440"); c.fill();
      }
    }
    // The wheel: a big cog with its eight notches cut into the rim.
    function buildWheel(k, notches) {
      var half = RIM + 6, i, a;
      wheelCv = canvasOf(half * 2 * k, half * 2 * k);
      var c = wheelCv.getContext("2d");
      c.setTransform(k, 0, 0, k, half * k, half * k);
      paintCog(c, RIM, 28, 0, 0);
      c.beginPath(); c.arc(0, 0, WHEEL_R - 4, 0, PI2);
      c.fillStyle = tc("#1a1240"); c.fill();
      c.strokeStyle = tc("#6f63ad"); c.lineCap = "round";
      for (i = 0; i < notches; i++) {
        a = i / notches * PI2 + Math.PI / notches;
        c.lineWidth = 7;
        c.beginPath(); c.moveTo(Math.cos(a) * 30, Math.sin(a) * 30);
        c.lineTo(Math.cos(a) * (WHEEL_R - 6), Math.sin(a) * (WHEEL_R - 6)); c.stroke();
      }
      for (i = 0; i < notches; i++) {
        a = i / notches * PI2;
        c.beginPath(); c.arc(Math.cos(a) * WHEEL_R, Math.sin(a) * WHEEL_R, R + 3, 0, PI2);
        c.fillStyle = tc("#07041a"); c.fill();
        c.lineWidth = 2; c.strokeStyle = tca("#beb0ff", .55); c.stroke();
      }
    }
    /* A pocket gear — the feed gear and the ferry gears: a cog with a dark
       disc, spokes, and one pocket a marble sits in every 1 / n of the rim
       at radius r. Cached by size; the ferries' are built on first draw. */
    function gearSprite(k, r, n) {
      var half = r + 18, cv = canvasOf(half * 2 * k, half * 2 * k), c = cv.getContext("2d"), i, a;
      c.setTransform(k, 0, 0, k, half * k, half * k);
      paintCog(c, r + 16, Math.round(r / 3.4), 0, 0);
      c.beginPath(); c.arc(0, 0, r - 6, 0, PI2);
      c.fillStyle = tc("#1a1240"); c.fill();
      c.strokeStyle = tc("#6f63ad"); c.lineCap = "round";
      for (i = 0; i < n; i++) {
        a = i / n * PI2 + Math.PI / n;
        c.lineWidth = 6;
        c.beginPath(); c.moveTo(Math.cos(a) * 22, Math.sin(a) * 22);
        c.lineTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8)); c.stroke();
      }
      for (i = 0; i < n; i++) {
        a = i / n * PI2;
        c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r, R + 3, 0, PI2);
        c.fillStyle = tc("#07041a"); c.fill();
        c.lineWidth = 2; c.strokeStyle = tca("#beb0ff", .55); c.stroke();
      }
      return cv;
    }
    function ferrySprite(f) {
      var key = f.r + "/" + f.n;
      return ferryCvs[key] || (ferryCvs[key] = gearSprite(S * view.dpr, f.r, f.n));
    }
    // A switch: a small cog the lever turns on.
    function buildCog(k) {
      var half = 34;
      cogCv = canvasOf(half * 2 * k, half * 2 * k);
      var c = cogCv.getContext("2d");
      c.setTransform(k, 0, 0, k, half * k, half * k);
      paintCog(c, 30, 10, 5, 7);
    }
    /* THE MARBLES. Violet glass and chrome, both classic; the electric one is
       a cyan core in a dark shell. A shadow is baked under each; the swirl of
       a glass marble and the arcs of an electric one are drawn live, because
       they are what shows the roll. */
    function buildMarbles(k) {
      var box = R * 2 + 12;
      function sprite(paint) {
        var cv = canvasOf(box * k, box * k), c = cv.getContext("2d");
        c.setTransform(k, 0, 0, k, box / 2 * k, box / 2 * k);
        c.fillStyle = "rgba(0,0,0,.34)";
        c.beginPath(); c.ellipse(2.5, R * 0.8, R * 0.95, R * 0.36, 0, 0, PI2); c.fill();
        paint(c);
        return cv;
      }
      function body(c, stops, rim) {
        var g = c.createRadialGradient(-R * 0.38, -R * 0.42, R * 0.1, 0, 0, R), i;
        for (i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
        c.beginPath(); c.arc(0, 0, R, 0, PI2); c.fillStyle = g; c.fill();
        c.lineWidth = 1.2; c.strokeStyle = rim; c.stroke();
      }
      function shine(c, a) {
        c.fillStyle = "rgba(255,255,255," + a + ")";
        c.beginPath(); c.ellipse(-R * 0.36, -R * 0.44, R * 0.3, R * 0.2, -0.6, 0, PI2); c.fill();
        c.fillStyle = "rgba(255,255,255," + (a * 0.35) + ")";
        c.beginPath(); c.arc(R * 0.42, R * 0.4, R * 0.14, 0, PI2); c.fill();
      }
      sprites.glass = sprite(function (c) {
        body(c, [[0, "#f1e4ff"], [0.3, "#b389ff"], [0.72, "#5a28c4"], [1, "#240b5c"]], "rgba(20,6,50,.8)");
        shine(c, 0.85);
      });
      sprites.chrome = sprite(function (c) {
        body(c, [[0, "#ffffff"], [0.28, "#dcd8f0"], [0.55, "#8b84ad"], [0.8, "#35304f"], [1, "#b9b2dc"]], "rgba(20,16,40,.8)");
        // the horizon a chrome ball reflects
        c.save(); c.beginPath(); c.arc(0, 0, R - 0.8, 0, PI2); c.clip();
        c.fillStyle = "rgba(40,30,80,.45)"; c.fillRect(-R, R * 0.1, R * 2, R * 0.22);
        c.restore();
        shine(c, 0.95);
      });
      sprites.spent = sprite(function (c) {
        body(c, [[0, "#b9b1d6"], [0.5, "#6a6290"], [1, "#2c2648"]], "rgba(10,6,30,.6)");
        shine(c, 0.4);
      });
      sprites.gold = sprite(function (c) {
        body(c, [[0, "#fffbe0"], [0.3, "#ffe066"], [0.7, "#c98a12"], [1, "#5a3500"]], "rgba(60,30,0,.85)");
        shine(c, 0.95);
      });
      sprites.volt = sprite(function (c) {
        body(c, [[0, "#ffffff"], [0.25, "#c8fdff"], [0.55, "#3fd6ff"], [0.85, "#135a8c"], [1, "#07243f"]], "rgba(2,20,40,.9)");
        shine(c, 0.9);
      });
    }

    /* ===============================================================
       RENDER
       =============================================================== */
    // A jagged lightning line from (x0, y0) to (x1, y1).
    function bolt(x0, y0, x1, y1, jag, segs) {
      ctx.beginPath(); ctx.moveTo(x0, y0);
      var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L, i, q, o;
      for (i = 1; i < segs; i++) {
        q = i / segs; o = (Math.random() - 0.5) * 2 * jag;
        ctx.lineTo(x0 + dx * q + nx * o, y0 + dy * q + ny * o);
      }
      ctx.lineTo(x1, y1); ctx.stroke();
    }
    function boltIcon(x, y, s, col) {
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(x + 0.2 * s, y - s); ctx.lineTo(x - 0.45 * s, y + 0.1 * s); ctx.lineTo(x - 0.02 * s, y + 0.1 * s);
      ctx.lineTo(x - 0.25 * s, y + s); ctx.lineTo(x + 0.45 * s, y - 0.15 * s); ctx.lineTo(x + 0.05 * s, y - 0.15 * s);
      ctx.closePath(); ctx.fill();
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    /* Over the hoses and the zebra's bands: a marble in a hose swells it, an
       electric one glows through whatever covers it — it is the one the
       player must never lose sight of — and a booster's coils flare as they
       fire. */
    function drawCovered() {
      var i, m, sk, nv, q, a;
      for (i = 0; i < marbles.length; i++) {
        m = marbles[i];
        if (m.st !== "track" && m.st !== "gate") continue;
        sk = m.ch.gs[Math.min(m.ch.n - 1, Math.round(m.d / DS))];
        if (sk !== SK_HOSE && sk !== SK_ZEBRA) continue;
        if (sk === SK_HOSE) {
          nv = normalAt(m.ch, Math.min(m.ch.n - 1, Math.round(m.d / DS))); a = Math.atan2(nv[1], nv[0]);
          ctx.fillStyle = tc("#1d1638"); ctx.strokeStyle = tc("#3b3268"); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(m.x, m.y, R + 11, R + 3, a, 0, PI2); ctx.fill(); ctx.stroke();
        }
        if (m.e) drawGlow(C.volt, m.x, m.y, R + 20, 0.75 + 0.2 * Math.sin(t * 20 + m.rot));
        else if (m.gold) drawGlow(C.gold2, m.x, m.y, R + 12, 0.45);
      }
      for (i = 0; i < L.props.length; i++) {
        q = L.props[i];
        if (q.k === "coil" && q.hit > 0) drawGlow(C.amber, q.x, q.y, R + 26, Math.min(1, q.hit * 2.4));
      }
    }
    function drawMarble(m) {
      var sc = dsc(m.z) * (m.e ? 1.12 : 1), r = R * sc, x = m.x, y = m.y, box = (R * 2 + 12) * sc;
      var ga = ctx.globalAlpha, sp, hum, i, a0, a1;
      if (m.z < 0) ctx.globalAlpha = ga * (1 - 0.42 * Math.min(1, -m.z));
      if (m.clone) ctx.globalAlpha *= 0.72;
      if (m.lost) drawGlow(C.full, x, y, r + 14, 0.5);
      if (!m.spent && !m.e && (chargeT > 0 || m.tag)) drawGlow(m.tag ? C.calm : C.volt, x, y, r + 12, 0.55);
      if (m.gold && !m.spent) drawGlow(C.gold2, x, y, r + 12, 0.5);
      if (m.e) {
        // Electric: a halo, a hum ring, the core, arcs crackling round it.
        hum = mod(t * 2 + m.rot * 0.2, 1);
        drawGlow(C.volt, x, y, r + 22, 0.55 + 0.25 * Math.sin(t * 20 + m.rot));
        ctx.strokeStyle = rgba(C.volt, 0.55 * (1 - hum)); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, r + 4 + hum * 16, 0, PI2); ctx.stroke();
        ctx.drawImage(sprites.volt, x - box / 2, y - box / 2, box, box);
        ctx.strokeStyle = C.voltHi; ctx.lineWidth = 1.8;
        for (i = 0; i < 3; i++) {
          a0 = Math.random() * PI2; a1 = a0 + 0.8 + Math.random();
          bolt(x + Math.cos(a0) * r * 0.8, y + Math.sin(a0) * r * 0.8, x + Math.cos(a1) * (r + 9), y + Math.sin(a1) * (r + 9), 4, 3);
        }
      } else {
        sp = m.spent ? sprites.spent : m.gold ? sprites.gold : m.k ? sprites.chrome : sprites.glass;
        ctx.drawImage(sp, x - box / 2, y - box / 2, box, box);
        if (!m.spent && !m.k && !m.gold) {
          // the swirl turns with the roll, the highlight stays with the light
          ctx.strokeStyle = "rgba(236,220,255,.5)"; ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.arc(x, y, r * 0.55, m.rot, m.rot + 2.2); ctx.stroke();
        } else if (!m.spent) {
          ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(x, y, r * 0.72, m.rot, m.rot + 0.7); ctx.stroke();
        }
      }
      ctx.globalAlpha = ga;
    }

    /* Everything behind the machine: the gutter and the SCREW TOWER, faded
       back so they read as depth and never as a route. The tower is a glass
       column with a two-start screw turning in it: the far half of each
       blade is drawn first and dim, then the shaft, the marbles riding up in
       front of it, and the near half of each blade over them. */
    function drawBackground() {
      var i, m, s, y, ph, x, front, open, X = TOWER.x, top = TOWER.top - 30, bot = TOWER.bot + 14;
      var rot = screwSlot / TOWER.starts * PI2, k = PI2 / TOWER.pitch;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      // the gutter, down to the foot of the tower
      ctx.globalAlpha = BG_ALPHA * 1.6;
      ctx.strokeStyle = C.steelL; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(GUTTER_L, gutterY(GUTTER_L) + 2); ctx.lineTo(X, gutterY(X) + 2); ctx.stroke();
      // the column
      ctx.globalAlpha = BG_ALPHA;
      ctx.fillStyle = tc("#1a1238"); ctx.fillRect(X - TOWER.wall, top, TOWER.wall * 2, bot - top);
      // the far half of the blades
      for (front = 0; front < 2; front++) {
        if (front) {
          // the shaft, then the marbles in front of it
          ctx.globalAlpha = BG_ALPHA;
          ctx.fillStyle = tc("#3b2f7c"); ctx.fillRect(X - 3, top, 6, bot - top);
          ctx.globalAlpha = BG_ALPHA * 1.6;
          for (i = 0; i < marbles.length; i++) {
            m = marbles[i];
            if (m.st === "screw") drawMarble({ spent: true, x: m.x, y: m.y - 8, z: 1, rot: m.rot });
          }
        }
        ctx.globalAlpha = front ? BG_ALPHA * 1.5 : BG_ALPHA * 0.7;
        ctx.strokeStyle = front ? C.steelL : C.steel; ctx.lineWidth = front ? 3.5 : 2.5;
        for (s = 0; s < TOWER.starts; s++) {
          ctx.beginPath(); open = false;
          for (y = bot; y >= top; y -= 5) {
            ph = (TOWER.bot - y) * k - rot + s * PI2 / TOWER.starts;
            if ((Math.cos(ph) >= 0) !== !!front) { open = false; continue; }
            x = X + Math.sin(ph) * TOWER.hw;
            if (open) ctx.lineTo(x, y); else { ctx.moveTo(x, y); open = true; }
          }
          ctx.stroke();
        }
      }
      // the walls, with a glint down the glass
      ctx.globalAlpha = BG_ALPHA * 1.4;
      ctx.strokeStyle = C.steel; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X - TOWER.wall, bot); ctx.lineTo(X - TOWER.wall, top);
      ctx.moveTo(X + TOWER.wall, top); ctx.lineTo(X + TOWER.wall, bot); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X - TOWER.wall + 7, bot - 10); ctx.lineTo(X - TOWER.wall + 7, top + 10); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* THE SPILL NETWORK'S DECOR. Cogs turning behind the back lines, each at
       the speed its size gives it (a big one slow), faded like the lines. */
    function drawCogs() {
      var i, cg, sp, a;
      ctx.globalAlpha = SPILL_ALPHA * 0.8;
      for (i = 0; i < L.cogs.length; i++) {
        cg = L.cogs[i]; sp = layers.cogs[i];
        a = t * 0.9 * (cg[3] || 1) * 30 / cg[2];
        ctx.save(); ctx.translate(cg[0], cg[1]); ctx.rotate(a);
        ctx.drawImage(sp.cv, sp.x, sp.y, sp.w, sp.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    function heartPath(x, y, s) {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.9);
      ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s * 1.0, x, y - s * 0.35);
      ctx.bezierCurveTo(x + s * 0.7, y - s * 1.0, x + s * 1.3, y, x, y + s * 0.9);
      ctx.closePath();
    }
    /* THE SINK: the red socket at the back where a lost marble ends. Smaller
       and dimmer than an arrival — it is behind the machine — with a heart
       in its core, because a heart is what it takes. */
    var SINK_SCALE = 0.7;
    function drawSink() {
      var x = 0, y = 0, w = 30, k = sink.kick, pl = 0.5 + 0.5 * Math.sin(t * 3), g;
      ctx.save(); ctx.translate(L.sink[0], L.sink[1]); ctx.scale(SINK_SCALE, SINK_SCALE);
      drawGlow(C.full, x, y + 26, 54, 0.22 + 0.12 * pl + k * 0.9);
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(x - w, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w * 0.4, y + 34); ctx.lineTo(x + w * 0.3, y + 48);
      ctx.lineTo(x - w * 0.3, y + 48); ctx.lineTo(x - w * 0.4, y + 34); ctx.closePath();
      g = ctx.createLinearGradient(0, y, 0, y + 50);
      g.addColorStop(0, rgba(C.full, 0.45)); g.addColorStop(0.45, "#2a0716"); g.addColorStop(1, "#0c0208");
      ctx.fillStyle = g; ctx.fill();
      ctx.lineJoin = "round"; ctx.lineWidth = 5; ctx.strokeStyle = tc("#0b0720"); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = rgba(C.full, 0.85); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y, w, 6, 0, 0, PI2);
      ctx.fillStyle = "#05030f"; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = C.full; ctx.stroke();
      drawGlow(C.full, x, y + 58, 24, 0.5 + k);
      ctx.beginPath(); ctx.arc(x, y + 58, 14, 0, PI2);
      ctx.fillStyle = k > 0.1 ? "#ff8aa5" : "#3a0a1c"; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = tc("#0b0720"); ctx.stroke();
      ctx.fillStyle = k > 0.1 ? "#ffffff" : C.heart; heartPath(x, y + 58, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    /* The feed gear, half off the right edge, turned by the pour: the pocket
       at `rel` has just laid its marble on the rail, and the ones coming
       down to it carry the next marbles of the pour. */
    function drawFeed() {
      var step = PI2 / FEED.pockets, half = FEED.r + 18, i, a, kd;
      ctx.save(); ctx.translate(FEED.cx, FEED.cy); ctx.rotate(FEED.rel - (feedTurn + feedK) * step);
      ctx.drawImage(feedCv, -half, -half, half * 2, half * 2);
      ctx.restore();
      for (i = 0; i < queue.length && i <= M.preview; i++) {
        a = FEED.rel + (i + 1 - feedK) * step; kd = queue[i];
        drawMarble({ e: kd === "e", k: kd === "k", gold: kd === "g", x: FEED.cx + Math.cos(a) * FEED.r, y: FEED.cy + Math.sin(a) * FEED.r,
                     z: 1, rot: a * 3 });
      }
    }
    // The ferry gears, each with its marbles riding in its pockets.
    function drawFerries() {
      var i, j, fr, f, half, m;
      for (i = 0; i < fers.length; i++) {
        fr = fers[i]; f = fr.f; half = f.r + 18;
        if (!Enter.begin(f.cx, f.cy)) continue;
        ctx.save(); ctx.translate(f.cx, f.cy); ctx.rotate(fr.phase);
        ctx.drawImage(ferrySprite(f), -half, -half, half * 2, half * 2);
        ctx.restore();
        ctx.save(); ctx.translate(f.cx, f.cy); ctx.rotate(-fr.phase * 0.5);
        ctx.drawImage(cogCv, -24, -24, 48, 48);
        ctx.restore();
        for (j = 0; j < f.n; j++) { m = fr.notch[j]; if (m) drawMarble(m); }
        Enter.end();
      }
    }

    // The glow behind the wheel: it grows and changes colour with the tier,
    // and goes dark for a moment when the combo breaks.
    function drawTierGlow() {
      var tr = tier(combo), cx = L.wheel.cx, cy = L.wheel.cy, col, beat;
      if (hubBreak > 0) drawGlow("#000000", cx, cy, RIM + 60, 0.6 * hubBreak / 0.6);
      if (hubZap > 0) drawGlow(C.volt, cx, cy, RIM + 90, 0.8 * hubZap / 0.7);
      if (!tr) return;
      col = TIERS_COL[tr]; beat = 0.5 + 0.5 * Math.sin(t * (4 + tr * 2));
      drawGlow(col, cx, cy, RIM + 40 + tr * 26, (0.28 + 0.12 * tr) * (0.7 + 0.3 * beat));
    }
    /* THE SURGE, drawn over the wheel while it spins up: lightning chained
       from marble to marble round the notches, bolts thrown off the rim, a
       jagged ring of current round it and sparks orbiting fast. Every bolt
       is redrawn at random each frame, which is what makes it flicker. */
    function drawSurge() {
      var k = zapK(), cx = L.wheel.cx, cy = L.wheel.cy, i, a, a1, r1, prev = null, m, n;
      if (k <= 0) return;
      drawGlow(C.volt, cx, cy, RIM + 70 + 40 * k, 0.35 * k + 0.15 * Math.sin(t * 30));
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      // the ring of current
      ctx.strokeStyle = rgba(C.volt, 0.5 * k); ctx.lineWidth = 6;
      for (i = 0; i < 2; i++) {
        ctx.beginPath();
        for (n = 0; n <= 36; n++) {
          a = n / 36 * PI2; r1 = RIM + 6 + (Math.random() - 0.5) * 10 * k;
          if (n) ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); else ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        }
        ctx.stroke();
        ctx.strokeStyle = rgba(C.voltHi, 0.8 * k); ctx.lineWidth = 1.6;
      }
      // chain lightning between the marbles aboard
      ctx.strokeStyle = C.voltHi; ctx.lineWidth = 2.2;
      for (i = 0; i <= wheel.n; i++) {
        m = wheel.notch[i % wheel.n];
        if (!m) { prev = null; continue; }
        if (prev && Math.random() < 0.85) bolt(prev.x, prev.y, m.x, m.y, 7, 4);
        prev = m;
      }
      // bolts thrown off the rim
      n = 2 + Math.round(5 * k);
      for (i = 0; i < n; i++) {
        a = Math.random() * PI2; a1 = a + (Math.random() - 0.5) * 0.6; r1 = RIM + 40 + Math.random() * 110 * k;
        ctx.strokeStyle = i % 2 ? C.volt : C.voltHi; ctx.lineWidth = i % 2 ? 3 : 1.6;
        bolt(cx + Math.cos(a) * RIM, cy + Math.sin(a) * RIM, cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1, 12, 5);
      }
      // the current jumps the gap to the switches now and then
      for (var key in sw) if (sw.hasOwnProperty(key) && Math.random() < 0.18 * k) {
        a = Math.atan2(sw[key].y - cy, sw[key].x - cx);
        ctx.strokeStyle = C.volt; ctx.lineWidth = 3;
        bolt(cx + Math.cos(a) * RIM, cy + Math.sin(a) * RIM, sw[key].x, sw[key].y, 16, 7);
        ctx.strokeStyle = C.voltHi; ctx.lineWidth = 1.2;
        bolt(cx + Math.cos(a) * RIM, cy + Math.sin(a) * RIM, sw[key].x, sw[key].y, 10, 7);
        drawGlow(C.volt, sw[key].x, sw[key].y, 46, 0.7);
      }
      // sparks orbiting fast
      for (i = 0; i < 16; i++) {
        a = t * 9 + i * PI2 / 16; r1 = RIM + 22 + 8 * Math.sin(t * 14 + i);
        ctx.globalAlpha = k; ctx.fillStyle = i % 2 ? C.volt : "#ffffff";
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, 3.5, 0, PI2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function drawWheel() {
      var cx = L.wheel.cx, cy = L.wheel.cy, half = RIM + 6;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(wheel.phase);
      ctx.drawImage(wheelCv, -half, -half, half * 2, half * 2);
      ctx.restore();
      drawFuse(cx, cy, RIM + 9);
      drawHub(cx, cy);
    }
    // The combo on the hub: the count, and a ring filling toward the next tier.
    function drawHub(cx, cy) {
      var tr = tier(combo), col = hubZap > 0.3 ? C.voltHi : TIERS_COL[tr], rr = 44, i, a;
      ctx.beginPath(); ctx.arc(cx, cy, rr + 7, 0, PI2);
      ctx.fillStyle = hubZap > 0 ? "rgba(10,50,80," + (0.7 + 0.25 * hubZap) + ")" : tca("#09051a", .94); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = tca("#beb0ff", .4); ctx.stroke();
      /* Idle until the first marble lands: a calm hub — a cog turning slowly
         under a soft breath — rather than a combo of zero. */
      if (!stats || (!stats.delivered && combo === 0 && hubBreak <= 0 && hubZap <= 0)) {
        drawGlow("#b389ff", cx, cy, rr + 10, 0.25 + 0.12 * Math.sin(t * 2.2));
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.6); ctx.globalAlpha = 0.55;
        ctx.drawImage(cogCv, -30, -30, 60, 60);
        ctx.restore();
        return;
      }
      var lo = tr ? tierAt(tr - 1) : 0, hi = tr < M.tiers.length ? tierAt(tr) : 0;
      var k = hi ? (combo - lo) / (hi - lo) : 1;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, PI2); ctx.stroke();
      if (hubBreak > 0) {
        ctx.strokeStyle = rgba(C.full, hubBreak / 0.6); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, PI2); ctx.stroke();
      } else if (combo > 0) {
        ctx.strokeStyle = rgba(col, 0.3); ctx.lineWidth = 11;
        ctx.beginPath(); ctx.arc(cx, cy, rr, -Math.PI / 2, -Math.PI / 2 + PI2 * Math.max(0.04, Math.min(1, k))); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = 5;
        ctx.stroke();
      }
      if (hubZap > 0) {
        ctx.strokeStyle = C.voltHi; ctx.lineWidth = 2;
        for (i = 0; i < 4; i++) { a = Math.random() * PI2; bolt(cx, cy, cx + Math.cos(a) * (rr + 30), cy + Math.sin(a) * (rr + 30), 7, 5); }
      }
      var pop = (1 + hubPop * 0.7) * (1 + 0.25 * heat());
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = font(combo >= 100 ? 30 : 36, 900);
      ctx.lineJoin = "round"; ctx.lineWidth = 6 / S; ctx.strokeStyle = tca("#060314", .9);
      ctx.strokeText("x" + combo, 0, 2);
      ctx.fillStyle = combo > 0 ? col : tc("#6e6390");
      ctx.fillText("x" + combo, 0, 2);
      ctx.restore();
    }
    /* THE FUSE, round the rim of the wheel: the share of it still lit, a
       flame going from gold to orange to red as it burns down, with the burning tip spitting
       sparks while the machine waits on the player. Still and dim when
       nothing waits; blinking in its last third; gone at a combo of 0. */
    function drawFuse(cx, cy, r) {
      if (combo <= 0 || state !== "play") return;
      var k = Math.max(0, Math.min(1, fuse)), a0 = -Math.PI / 2, a1 = a0 + PI2 * k;
      var col = k > 0.6 ? "#ffc23d" : k > 0.3 ? "#ff7a1f" : C.full;
      var blink = fuseBurn && k < 0.34 ? 0.45 + 0.55 * (Math.sin(t * 22) > 0 ? 1 : 0) : 1;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, PI2); ctx.stroke();
      if (k <= 0.005) return;
      ctx.globalAlpha = (fuseBurn ? 1 : 0.6) * blink;
      ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
      ctx.globalAlpha = 1;
      if (!fuseBurn) return;
      var tx = cx + Math.cos(a1) * r, ty = cy + Math.sin(a1) * r;
      drawGlow(col, tx, ty, 14 + 4 * Math.sin(t * 40), 0.9);
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(tx, ty, 2.6, 0, PI2); ctx.fill();
      if (Math.random() < 0.5 && parts.length < PART_MAX) {
        parts.push({ x: tx, y: ty, vx: (Math.random() - 0.5) * 140, vy: -40 - Math.random() * 90,
                     life: 0.28, t: 0, color: Math.random() < 0.5 ? col : "#ffffff", s: 1.4 + Math.random() * 1.4 });
      }
    }
    /* The sparks a gate sends to the hub, each carrying its share of the
       combo: a bright head on an arc bowed up toward the hub, with a tail. */
    function cometAt(c, u) {
      var x1 = L.wheel.cx, y1 = L.wheel.cy, mx = (c.x + x1) / 2, my = Math.min(c.y, y1) - 90, v = 1 - u;
      return [v * v * c.x + 2 * v * u * mx + u * u * x1, v * v * c.y + 2 * v * u * my + u * u * y1];
    }
    function drawComets() {
      var i, j, c, u, p, col = TIERS_COL[Math.max(1, tier(combo))];
      for (i = 0; i < comets.length; i++) {
        c = comets[i];
        if (c.dl > 0) continue;
        u = c.t * c.t * (3 - 2 * c.t);
        for (j = 5; j >= 0; j--) {
          p = cometAt(c, Math.max(0, u - j * 0.045));
          drawGlow(j ? col : "#ffffff", p[0], p[1], j ? 16 - j * 2 : 12, j ? 0.55 - j * 0.08 : 1);
        }
      }
    }
    /* What grows with the combo on the marbles themselves: a trail from the
       first tier, sparks shed from the second, and from the third the
       current jumping between marbles that roll close together. */
    function drawHeat() {
      var tr = tier(combo), col, i, j, m, n, g, p, a, b, dx, dy, bolts = 0;
      if (!tr || state !== "play") return;
      col = TIERS_COL[tr]; n = 2 + tr; g = 9 + 3 * tr;
      for (i = 0; i < marbles.length; i++) {
        m = marbles[i];
        if (m.st !== "track" || m.z < 0 || !m.ch) continue;
        for (j = 1; j <= n; j++) {
          if (m.d - j * g < 0) break;
          p = at(m.ch, m.d - j * g);
          if (p.z < 0) break;
          drawGlow(col, p.x, p.y, R * (1.25 - j * 0.12), 0.42 * (1 - j / (n + 1)));
        }
        if (tr >= 2 && Math.random() < 0.06 * tr && parts.length < PART_MAX) {
          parts.push({ x: m.x, y: m.y, vx: (Math.random() - 0.5) * 120, vy: -30 - Math.random() * 110,
                       life: 0.35, t: 0, color: Math.random() < 0.5 ? col : "#ffffff", s: 1.5 + Math.random() * 1.5 });
        }
      }
      if (tr < 3) return;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (i = 0; i < marbles.length && bolts < 5; i++) {
        a = marbles[i];
        if (a.st !== "track" || a.z < 0) continue;
        for (j = i + 1; j < marbles.length && bolts < 5; j++) {
          b = marbles[j];
          if (b.st !== "track" || b.z < 0) continue;
          dx = a.x - b.x; dy = a.y - b.y;
          if (dx * dx + dy * dy > 95 * 95 || Math.random() > 0.35) continue;
          ctx.strokeStyle = col; ctx.lineWidth = 3; bolt(a.x, a.y, b.x, b.y, 8, 5);
          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.2; bolt(a.x, a.y, b.x, b.y, 6, 4);
          bolts++;
        }
      }
    }
    // Sparks orbiting the wheel, more and faster as the combo grows.
    function drawOrbit() {
      var tr = tier(combo), n = Math.max(ORBIT_SPARKS[tr], Math.round(20 * heat())), col, i, j, a, rr, aj;
      if (!n || state !== "play") return;
      col = TIERS_COL[tr];
      for (i = 0; i < n; i++) {
        a = t * (1.4 + tr * 0.5) + i * PI2 / n; rr = RIM + 26 + 5 * Math.sin(t * 3 + i * 1.7);
        for (j = 0; j < 3; j++) {
          aj = a - j * 0.09;
          ctx.globalAlpha = 1 - j * 0.33; ctx.fillStyle = j ? col : "#ffffff";
          ctx.beginPath(); ctx.arc(L.wheel.cx + Math.cos(aj) * rr, L.wheel.cy + Math.sin(aj) * rr, 4 - j, 0, PI2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    /* The payoff: a bolt running up the rails from the arrival to the hub,
       and the whole route glowing behind it. The round-start arc runs the
       same path the other way, from the hub down to the arrival. */
    function drawArcs() {
      var a, ar, run, head, fade, i, pass, px, py, lo, hi, L, path;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (a = 0; a < arcs.length; a++) {
        ar = arcs[a]; run = ar.t * ARC_SPEED; path = ar.path || roundPath(); L = path.len;
        head = Math.min(L, run);
        fade = run > L ? 1 - (run - L) / 700 : 1;
        if (fade <= 0) continue;
        // the lit range, along the path from the arrival (0) to the hub (L)
        if (ar.rev) { lo = L - head; hi = Math.min(L, lo + 260); }
        else { hi = head; lo = Math.max(0, head - 260); }
        ctx.globalAlpha = 0.3 * fade; ctx.strokeStyle = C.volt; ctx.lineWidth = 2 * R + 6;
        ctx.beginPath();
        var first = true;
        for (i = 0; i < path.xs.length; i++) {
          if (ar.rev ? path.ls[i] < lo : path.ls[i] > hi) continue;
          if (first) { ctx.moveTo(path.xs[i], path.ys[i]); first = false; } else ctx.lineTo(path.xs[i], path.ys[i]);
        }
        ctx.stroke();
        ctx.globalAlpha = fade;
        for (pass = 0; pass < 3; pass++) {
          ctx.strokeStyle = pass === 2 ? "#ffffff" : pass ? C.voltHi : C.volt;
          ctx.lineWidth = pass === 2 ? 1.2 : pass ? 2.4 : 6;
          if (!pass) ctx.globalAlpha = 0.5 * fade; else ctx.globalAlpha = fade;
          px = -1; py = -1;
          for (i = 0; i < path.xs.length; i += 2) {
            if (path.ls[i] < lo || path.ls[i] > hi) { px = -1; continue; }
            if (px >= 0) bolt(px, py, path.xs[i], path.ys[i], 8, 2);
            px = path.xs[i]; py = path.ys[i];
          }
        }
        // the head of the bolt, white hot
        var hx = -1, hy = -1, target = ar.rev ? lo : hi;
        for (i = 0; i < path.xs.length; i++) if (path.ls[i] >= target) { hx = path.xs[i]; hy = path.ys[i]; break; }
        if (hx >= 0 && run < L) drawGlow(C.voltHi, hx, hy, 40, 0.9);
        ctx.globalAlpha = 1;
      }
    }

    /* A SWITCH is the machine's own: it flips at every marble that passes
       it, and the player only reads it. So it says ONE thing, where the next
       marble goes: the open way is lit, with chevrons running down it and
       the tongue of the switch laid along it; the shut way is darkened and
       barred by a red stop across its mouth. Both cross-fade as it flips.
       The open way is cyan when it still leads to the socket. */
    var SW_BAR = 34;                // how far down the shut way its stop stands
    function drawSwitches() {
      var eNext = {}, i, j, m, k, s, b, ch, live, toArr, pl, ex, ey, snap, op, p, nv, d, hw, a;
      for (i = 0; i < marbles.length; i++) {
        m = marbles[i];
        if (m.e && m.st === "track" && L.out[m.ch.to]) eNext[m.ch.to] = true;
      }
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (k in sw) if (sw.hasOwnProperty(k)) {
        s = sw[k]; live = CH[L.out[k][s.dir]];
        toArr = leads(live.id) && !MOD.blind;
        // the two ways belong to the track, and land with it (Enter rank 1)
        if (Enter.begin(s.x, s.y, { rank: 1 })) {
        for (b = 0; b < 2; b++) {
          ch = CH[L.out[k][b]];
          op = b === 1 ? s.kb : 1 - s.kb;              // 1: this way is open
          // the mouth of the way: lit when open, dark when shut
          ctx.lineWidth = 2 * R + 8;
          ctx.strokeStyle = op > 0.5 ? (leads(ch.id) && !MOD.blind ? C.volt : tc("#d9ccff")) : "#05030f";
          ctx.globalAlpha = op > 0.5 ? 0.3 * op : 0.55 * (1 - op);
          ctx.beginPath(); ctx.moveTo(ch.xs[0], ch.ys[0]);
          for (i = 1; i < Math.min(ch.n, 18); i++) ctx.lineTo(ch.xs[i], ch.ys[i]);
          ctx.stroke();
          // the open way: three chevrons running down it
          if (op > 0.05) {
            ctx.globalAlpha = op;
            ctx.strokeStyle = leads(ch.id) && !MOD.blind ? C.voltHi : "#ffffff"; ctx.lineWidth = 5;
            for (j = 0; j < 3; j++) {
              d = 22 + mod(t * 60 + j * 22, 66);
              i = Math.min(ch.n - 2, Math.round(d / DS)); p = at(ch, d, {}); nv = normalAt(ch, i);
              a = Math.atan2(-nv[0], nv[1]);           // the way's own heading
              hw = 12 * Math.min(1, 1.6 * (1 - Math.abs(d - 55) / 36));
              if (hw <= 0) continue;
              ctx.beginPath();
              ctx.moveTo(p.x - Math.cos(a) * hw + nv[0] * hw, p.y - Math.sin(a) * hw + nv[1] * hw);
              ctx.lineTo(p.x, p.y);
              ctx.lineTo(p.x - Math.cos(a) * hw - nv[0] * hw, p.y - Math.sin(a) * hw - nv[1] * hw);
              ctx.stroke();
            }
          }
          // the shut way: a red stop across its mouth
          if (op < 0.95) {
            p = at(ch, SW_BAR, {}); nv = normalAt(ch, Math.round(SW_BAR / DS)); hw = R + 10;
            ctx.globalAlpha = 1 - op;
            drawGlow(C.full, p.x, p.y, 30, 0.45);
            ctx.lineCap = "butt";
            ctx.strokeStyle = tc("#0b0720"); ctx.lineWidth = 13;
            ctx.beginPath(); ctx.moveTo(p.x - nv[0] * (hw + 2), p.y - nv[1] * (hw + 2)); ctx.lineTo(p.x + nv[0] * (hw + 2), p.y + nv[1] * (hw + 2)); ctx.stroke();
            ctx.strokeStyle = C.full; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.moveTo(p.x - nv[0] * hw, p.y - nv[1] * hw); ctx.lineTo(p.x + nv[0] * hw, p.y + nv[1] * hw); ctx.stroke();
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(p.x - nv[0] * (hw - 4), p.y - nv[1] * (hw - 4)); ctx.lineTo(p.x + nv[0] * (hw - 4), p.y + nv[1] * (hw - 4)); ctx.stroke();
            ctx.lineCap = "round";
          }
        }
        Enter.end();
        }
        ctx.globalAlpha = 1;
        // the switch itself is a gear, and lands with the gears
        if (!Enter.begin(s.x, s.y)) continue;
        // An electric marble is heading here: a cyan ring says watch this switch.
        if (eNext[k] && !MOD.blind) {
          pl = 0.5 + 0.5 * Math.sin(t * 12);
          drawGlow(C.volt, s.x, s.y, 64, 0.35 + 0.3 * pl);
          ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.globalAlpha = 0.55 + 0.45 * pl;
          ctx.beginPath(); ctx.arc(s.x, s.y, 36 + pl * 4, 0, PI2); ctx.stroke(); ctx.globalAlpha = 1;
        }
        snap = s.snap > 0 ? 1 + 0.18 * Math.sin(s.snap / 0.22 * Math.PI) : 1;
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.spin); ctx.scale(snap, snap);
        ctx.drawImage(cogCv, -26, -26, 52, 52);
        ctx.restore();
        if (s.flash > 0) drawGlow("#ffffff", s.x, s.y, 40, s.flash / (FLIP_TIME * 2) * 0.6);
        // the tongue, laid along the open way, a lamp on its tip
        ex = s.x + Math.cos(s.ang) * 40 * snap; ey = s.y + Math.sin(s.ang) * 40 * snap;
        ctx.strokeStyle = tc("#0b0720"); ctx.lineWidth = 13;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = tc("#cfc6f5"); ctx.lineWidth = 7; ctx.stroke();
        drawGlow(toArr ? C.volt : tc("#d9ccff"), ex, ey, 20, 0.8);
        ctx.fillStyle = toArr ? C.volt : tc("#e9e2ff");
        ctx.beginPath(); ctx.arc(ex, ey, 6.5, 0, PI2); ctx.fill();
        ctx.fillStyle = tc("#1b1440");
        ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, PI2); ctx.fill();
        Enter.end();
      }
    }


    /* A queue's slots, drawn along the rail behind its head: the rim of every
       slot in use takes the gauge's colour, and a red bar across the rail past
       the last one marks where a marble no longer fits. */
    function drawSockets(ch, dHead, cap, n, broke, drain) {
      var col = gaugeColor(n / cap), full = n >= cap, blink = full && Math.sin(t * 18) > 0, j, sp, q;
      if (broke > 0) {
        ctx.strokeStyle = rgba(C.full, broke / 0.6 * 0.55); ctx.lineWidth = 2 * R + 14; ctx.lineCap = "round";
        ctx.beginPath();
        for (q = 0; q <= 10; q++) { sp = at(ch, dHead - (cap - 1) * 2.2 * R * q / 10); if (q) ctx.lineTo(sp.x, sp.y); else ctx.moveTo(sp.x, sp.y); }
        ctx.stroke();
      }
      for (j = 0; j < cap; j++) {
        sp = at(ch, dHead - j * 2.2 * R);
        if (j < n) drawGlow(col, sp.x, sp.y, R + 16, 0.5);
        ctx.fillStyle = tca("#060314", .55); ctx.beginPath(); ctx.arc(sp.x, sp.y, R + 4, 0, PI2); ctx.fill();
        ctx.strokeStyle = j < n ? (blink ? "#ffffff" : col) : tca("#c8beff", .35); ctx.lineWidth = j < n ? 4 : 2;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, R + 4, 0, PI2); ctx.stroke();
      }
      var dl, lp, nv;
      if (drain) {
        // the trapdoor one slot past the last: a full queue drops the next marble through it
        dl = dHead - cap * 2.2 * R; lp = at(ch, dl); nv = normalAt(ch, Math.max(0, Math.round(dl / DS)));
        ctx.save(); ctx.translate(lp.x, lp.y); ctx.rotate(Math.atan2(nv[1], nv[0]));
        if (full) drawGlow(C.full, 0, 0, R + 18, 0.5);
        ctx.fillStyle = "#05030f"; ctx.beginPath(); ctx.ellipse(0, 0, R + 7, 8, 0, 0, PI2); ctx.fill();
        ctx.lineWidth = full ? 4 : 2.5; ctx.strokeStyle = full ? (blink ? "#ffffff" : C.full) : rgba(C.full, 0.6);
        ctx.stroke();
        ctx.restore();
        return;
      }
      dl = dHead - (cap - 1) * 2.2 * R - R - 8; lp = at(ch, dl); nv = normalAt(ch, Math.max(0, Math.round(dl / DS)));
      ctx.strokeStyle = full ? C.full : rgba(C.full, 0.55); ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(lp.x - nv[0] * (R + 10), lp.y - nv[1] * (R + 10));
      ctx.lineTo(lp.x + nv[0] * (R + 10), lp.y + nv[1] * (R + 10)); ctx.stroke();
    }
    // A padlock; `open` lifts and swings the shackle.
    function padlock(x, y, s, col, open) {
      var lift = open * s * 0.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = col; ctx.lineWidth = s * 0.22;
      ctx.save(); ctx.translate(x + s * 0.42, y - s * 0.1 - lift); ctx.rotate(-open * 0.7);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.25);
      ctx.arc(-s * 0.42, -s * 0.25, s * 0.42, 0, Math.PI, true); ctx.lineTo(-s * 0.84, 0);
      ctx.stroke(); ctx.restore();
      ctx.fillStyle = col;
      roundRect(x - s * 0.64, y - s * 0.15, s * 1.28, s * 0.98, s * 0.18); ctx.fill();
      ctx.fillStyle = "#1b0f2e"; ctx.beginPath(); ctx.arc(x, y + s * 0.26, s * 0.14, 0, PI2); ctx.fill();
      ctx.fillRect(x - s * 0.05, y + s * 0.3, s * 0.1, s * 0.22);
    }
    /* A gate: a pallet on the rail, linked to its padlock. Open, the pallet is
       lifted and the padlock is a small steel disc with a lamp. Locked, the
       pallet is down, the slots show, and the padlock is a big pulsing button
       with the count under it. Just unlocked, the shackle springs open. */
    function drawGates() {
      var i, g, shut, n, k, col, pl, rr, grow, op;
      for (i = 0; i < gates.length; i++) {
        g = gates[i];
        if (g.locked || g.flush || g.broke > 0) drawSockets(g.ch, g.d, g.cap, g.q.length, g.broke, !!g.spill);
      }
      for (var e in wheel.q) if (wheel.q.hasOwnProperty(e)) {
        if (wheel.q[e].length || wheel.flashT[e] > 0) drawSockets(CH[e], CH[e].len, waitCap, wheel.q[e].length, wheel.flashT[e], !!wheel.spill[e]);
      }
      for (i = 0; i < gates.length; i++) {
        g = gates[i];
        if (!Enter.begin(g.px, g.py, { rank: 1 })) continue;
        shut = g.locked;
        // a self-opening gate wears a turning green ring round its padlock
        if (MOD.autoGate[i]) {
          ctx.strokeStyle = rgba(C.calm, 0.8); ctx.lineWidth = 3; ctx.setLineDash([7, 7]); ctx.lineDashOffset = -t * 30;
          ctx.beginPath(); ctx.arc(g.px, g.py, 50, 0, PI2); ctx.stroke();
          ctx.setLineDash([]); ctx.lineDashOffset = 0;
        }
        /* The gate itself: two posts either side of the rail and, locked, an
           amber bar across it. The bar slides back into the near post as the
           gate opens. A dashed cable runs from the near post to the padlock. */
        var nx = -g.ty, ny = g.tx, pw = R + 9, sgn, ax, ay, bx2, by2, bar;
        sgn = (nx * (g.px - g.fx) + ny * (g.py - g.fy)) >= 0 ? 1 : -1;
        ax = g.fx + nx * pw * sgn; ay = g.fy + ny * pw * sgn;          // the post on the padlock's side
        bx2 = g.fx - nx * pw * sgn; by2 = g.fy - ny * pw * sgn;
        ctx.lineCap = "round";
        ctx.strokeStyle = shut ? rgba(C.amber, 0.6) : tca("#c8beff", .26); ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.moveTo(g.px, g.py); ctx.lineTo(ax, ay); ctx.stroke();
        ctx.setLineDash([]);
        bar = shut ? 1 : g.pop > 0 ? g.pop / 0.4 : 0;
        if (bar > 0) {
          if (shut) drawGlow(C.amber, g.fx, g.fy, R + 22, 0.55);
          ctx.strokeStyle = tc("#0b0720"); ctx.lineWidth = 11;
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx2 - ax) * bar, ay + (by2 - ay) * bar); ctx.stroke();
          ctx.strokeStyle = shut ? C.amber : C.calm; ctx.lineWidth = 6; ctx.stroke();
          ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.6; ctx.stroke();
        }
        for (var pj = 0; pj < 2; pj++) {
          var qx = pj ? bx2 : ax, qy = pj ? by2 : ay;
          ctx.fillStyle = tc("#0b0720"); ctx.beginPath(); ctx.arc(qx, qy, 7.5, 0, PI2); ctx.fill();
          ctx.fillStyle = shut ? C.amber : tc("#8f84c8"); ctx.beginPath(); ctx.arc(qx, qy, 5, 0, PI2); ctx.fill();
        }
        if (!shut) {
          op = g.pop > 0 ? g.pop / 0.4 : 0;
          if (op > 0) {
            // just unlocked: the button shrinks back with its shackle open
            rr = 14 + 24 * op;
            drawGlow(C.calm, g.px, g.py, rr + 30, 0.7 * op);
            ctx.fillStyle = "#12241e"; ctx.beginPath(); ctx.arc(g.px, g.py, rr, 0, PI2); ctx.fill();
            ctx.lineWidth = 5; ctx.strokeStyle = C.calm; ctx.stroke();
            ctx.globalAlpha = op; padlock(g.px, g.py - 2, 22 * (0.6 + 0.4 * op), "#eafff4", 1 - op * 0.2); ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = tc("#1b1440"); ctx.beginPath(); ctx.arc(g.px, g.py, 14, 0, PI2); ctx.fill();
            ctx.lineWidth = 3; ctx.strokeStyle = tc("#8f84c8"); ctx.stroke();
            drawGlow(C.calm, g.px, g.py, 14, 0.7);
            ctx.fillStyle = C.calm; ctx.beginPath(); ctx.arc(g.px, g.py, 4, 0, PI2); ctx.fill();
          }
          Enter.end();
          continue;
        }
        n = g.q.length; k = n / g.cap; col = gaugeColor(k); pl = 0.5 + 0.5 * Math.sin(t * (7 + 10 * k));
        grow = g.lockAge < 0.3 ? 1 + 0.35 * Math.sin(g.lockAge / 0.3 * Math.PI) : 1;
        rr = (34 + pl * 3) * grow;
        drawGlow(C.amber, g.px, g.py, rr + 40, 0.35 + 0.3 * pl);
        drawGlow(col, g.px, g.py, rr + 18, 0.4);
        var bg = ctx.createRadialGradient(g.px - rr * 0.3, g.py - rr * 0.35, 2, g.px, g.py, rr);
        bg.addColorStop(0, "#5a3a1c"); bg.addColorStop(1, "#1d0f14");
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(g.px, g.py, rr, 0, PI2); ctx.fill();
        ctx.lineWidth = 6; ctx.strokeStyle = n >= g.cap && Math.sin(t * 18) > 0 ? "#ffffff" : col;
        ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = rgba(C.amber, 0.8);
        ctx.beginPath(); ctx.arc(g.px, g.py, rr - 7, 0, PI2); ctx.stroke();
        padlock(g.px, g.py - 2, 22 * grow, "#ffe3b0", 0);
        // the count, under the button
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = font(22, 900);
        ctx.lineJoin = "round"; ctx.lineWidth = 6 / S; ctx.strokeStyle = tca("#060314", .92);
        ctx.strokeText(n + "/" + g.cap, g.px, g.py + rr + 18);
        ctx.fillStyle = col; ctx.fillText(n + "/" + g.cap, g.px, g.py + rr + 18);
        Enter.end();
      }
    }

    /* The chimes: a tube hung off the rail on a bracket; a marble passing
       under strikes it, and it swings and glows. */
    function drawChimes() {
      var i, c, lit, wob, g;
      ctx.lineCap = "round";
      for (i = 0; i < chimes.length; i++) {
        c = chimes[i];
        if (!Enter.begin(c.x, c.y, { rank: 1 })) continue;
        lit = Math.max(0, 1 - c.hit / 0.35); wob = lit * Math.sin(c.hit * 60) * 0.45;
        ctx.strokeStyle = tc("#0b0720"); ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(c.rx, c.ry); ctx.lineTo(c.x, c.y - 12); ctx.stroke();
        ctx.strokeStyle = tc("#8f84c8"); ctx.lineWidth = 2; ctx.stroke();
        if (lit > 0) drawGlow(tc("#e7d9ff"), c.x, c.y, 24 + lit * 16, lit * 0.85);
        ctx.save(); ctx.translate(c.x, c.y - 12); ctx.rotate(wob);
        ctx.fillStyle = tc("#0b0720"); roundRect(-6, -2, 12, 28, 5); ctx.fill();
        g = ctx.createLinearGradient(-4, 0, 4, 0);
        g.addColorStop(0, lit > 0 ? "#ffffff" : tc("#8b7fd0")); g.addColorStop(0.45, lit > 0 ? "#fff6d8" : tc("#e3dcff"));
        g.addColorStop(1, lit > 0 ? tc("#d9c8ff") : tc("#4a3f8a"));
        ctx.fillStyle = g; roundRect(-4, 0, 8, 24, 3.5); ctx.fill();
        ctx.fillStyle = tc("#cfc6f5"); ctx.beginPath(); ctx.arc(0, 0, 3, 0, PI2); ctx.fill();
        ctx.restore();
        Enter.end();
      }
    }

    /* THE ARRIVALS. Each is a glowing mouth where its rail ends — a funnel
       with a coloured rim and a core lamp — and its COLOUR is its name. A
       marble dropping in sends a light up the funnel and one lamp of the
       chaser along its rim. The electric arrival keeps its colour and adds
       the cyan: a charge glow, a lightning mark over it, arcs crackling from
       the rim to the core. */
    function funnel(x, w) {
      ctx.beginPath();
      ctx.moveTo(x - w, RIM_Y); ctx.lineTo(x + w, RIM_Y);
      ctx.lineTo(x + w * 0.42, RIM_Y + 50); ctx.lineTo(x + w * 0.3, CORE_Y - 8);
      ctx.lineTo(x - w * 0.3, CORE_Y - 8); ctx.lineTo(x - w * 0.42, RIM_Y + 50); ctx.closePath();
    }
    function drawReceivers() {
      var k, mc, arr, pl, i, lx, on, w = L.mouthW, cr = Math.min(18, w * 0.42), g, yb, by, col;
      pl = 0.5 + 0.5 * Math.sin(t * 5);
      for (k in boxes) if (boxes.hasOwnProperty(k)) {
        mc = boxes[k]; arr = k === arrival; col = mc.col;
        if (!Enter.begin(mc.x, RIM_Y + 40, { rank: 1 })) continue;
        if (arr) drawGlow(C.volt, mc.x, RIM_Y + 40, w * 2.1, 0.32 + 0.14 * pl + mc.charge * 0.5);
        drawGlow(col, mc.x, RIM_Y + 38, w * 1.5, 0.22 + mc.kick * 1.2);
        // the funnel
        ctx.lineJoin = "round";
        funnel(mc.x, w);
        g = ctx.createLinearGradient(0, RIM_Y, 0, CORE_Y);
        g.addColorStop(0, rgba(col, 0.42)); g.addColorStop(0.35, "#1c1344"); g.addColorStop(1, "#07041a");
        ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 6; ctx.strokeStyle = "#0b0720"; ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(col, 0.9); ctx.stroke();
        // a light rising up the funnel on every marble
        if (mc.sweep > 0) {
          ctx.save(); funnel(mc.x, w); ctx.clip();
          yb = CORE_Y - (1 - mc.sweep / 0.4) * (CORE_Y - RIM_Y + 20);
          var sg = ctx.createLinearGradient(0, yb - 16, 0, yb + 16);
          sg.addColorStop(0, rgba(col, 0)); sg.addColorStop(0.5, rgba(arr ? C.volt : col, 0.7)); sg.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = sg; ctx.fillRect(mc.x - w, yb - 16, w * 2, 32);
          ctx.restore();
        }
        if (mc.fizz > 0) { funnel(mc.x, w); ctx.fillStyle = "rgba(70,80,100," + (mc.fizz * 0.55) + ")"; ctx.fill(); }
        // the mouth: a dark hole ringed in the arrival's colour
        ctx.beginPath(); ctx.ellipse(mc.x, RIM_Y, w, 8, 0, 0, PI2);
        ctx.fillStyle = "#05030f"; ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = "#0b0720"; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
        if (arr) { ctx.lineWidth = 1.5; ctx.strokeStyle = C.voltHi; ctx.beginPath(); ctx.ellipse(mc.x, RIM_Y, w - 5, 5, 0, 0, PI2); ctx.stroke(); }
        // the lamp chaser along the rim
        for (i = 0; i < 5; i++) {
          lx = mc.x + (i - 2) * w * 0.36; on = i === mc.led && mc.sweep > 0;
          if (on) drawGlow(col, lx, RIM_Y + 8, 14, 0.9);
          ctx.fillStyle = on ? "#ffffff" : rgba(col, 0.45);
          ctx.beginPath(); ctx.arc(lx, RIM_Y + 8, 2.6, 0, PI2); ctx.fill();
        }
        // the core lamp at the bottom
        drawGlow(arr ? C.volt : col, mc.x, CORE_Y, cr * 2.4, 0.5 + mc.kick * 1.4 + (arr ? 0.2 * pl : 0));
        g = ctx.createRadialGradient(mc.x - cr * 0.3, CORE_Y - cr * 0.35, 1, mc.x, CORE_Y, cr);
        g.addColorStop(0, mc.kick > 0.1 ? "#ffffff" : arr ? C.voltHi : rgba(col, 0.95));
        g.addColorStop(0.6, col); g.addColorStop(1, "#140c33");
        ctx.beginPath(); ctx.arc(mc.x, CORE_Y, cr, 0, PI2); ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = "#0b0720"; ctx.stroke();
        if (arr) {
          // arcs from the rim to the core, and the sign over the mouth
          ctx.strokeStyle = C.volt; ctx.lineWidth = 2;
          var nb = mc.kick > 0 ? 5 : mc.charge > 0.2 ? 3 : 1;
          for (i = 0; i < nb; i++) if (mc.kick > 0 || mc.charge > 0.2 || Math.random() < 0.35) {
            bolt(mc.x + (Math.random() - 0.5) * w * 1.6, RIM_Y + 4, mc.x + (Math.random() - 0.5) * cr, CORE_Y - cr * 0.6, 6, 4);
          }
          by = RIM_Y - 40 + Math.sin(t * 3) * 4;
          drawGlow(C.volt, mc.x, by, 40, 0.6 + 0.3 * pl);
          ctx.fillStyle = "#07243f"; ctx.beginPath(); ctx.arc(mc.x, by, 19, 0, PI2); ctx.fill();
          ctx.strokeStyle = C.volt; ctx.lineWidth = 3; ctx.stroke();
          boltIcon(mc.x, by, 12, C.voltHi);
        }
        Enter.end();
      }
    }

    function drawEffects() {
      var i, p, s, rg, c, cs, sn, a, k;
      for (i = 0; i < puffs.length; i++) {
        p = puffs[i]; if (p.t < 0) continue;
        k = p.t / p.life;
        ctx.globalAlpha = 0.45 * (1 - k); ctx.fillStyle = "#8a93a8";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, PI2); ctx.fill();
      }
      for (i = 0; i < rings.length; i++) {
        rg = rings[i];
        ctx.globalAlpha = 1 - rg.t / rg.life; ctx.strokeStyle = rg.color; ctx.lineWidth = rg.w;
        ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r0 + rg.t * rg.grow, 0, PI2); ctx.stroke();
      }
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      }
      for (i = 0; i < shards.length; i++) {
        s = shards[i];
        ctx.globalAlpha = 1 - s.t / s.life;
        c = Math.cos(s.a); sn = Math.sin(s.a); cs = s.s;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(s.x + c * cs, s.y + sn * cs);
        a = s.a + 2.3; ctx.lineTo(s.x + Math.cos(a) * cs * 0.7, s.y + Math.sin(a) * cs * 0.7);
        a = s.a + 3.9; ctx.lineTo(s.x + Math.cos(a) * cs * 0.55, s.y + Math.sin(a) * cs * 0.55);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function render() {
      var i, m;
      /* No ground of our own when the painted hall is behind the canvas
         (CONFIG.sceneArt): the frame pipeline has already wiped it. Without
         the artwork the game paints the picture it embeds, and a gradient
         without that. */
      if (!Art.scene()) {
        var img = Images.bg, gg = ctx.createLinearGradient(0, 0, 0, view.h);
        gg.addColorStop(0, tc("#1d1542")); gg.addColorStop(1, tc("#07051a"));
        ctx.fillStyle = gg; ctx.fillRect(0, 0, view.w, view.h);
        if (img && img.width) {
          var sc = Math.max(view.w / img.width, view.h / img.height);
          ctx.globalAlpha = 0.5;
          ctx.drawImage(img, (view.w - img.width * sc) / 2, (view.h - img.height * sc) / 2, img.width * sc, img.height * sc);
          ctx.globalAlpha = 1;
        }
      }
      if (!wheel || !layers) return;               // nothing to draw before the first reset
      ctx.save();
      ctx.translate(OX, OY); ctx.scale(S, S);

      /* THE ENTRANCE lands the machine in three waves, whatever order it is
         painted in (Enter's `rank`): the GEARS first — the feed gear, the
         wheel, the ferries, the switches, the cogs behind — then the TRACK
         (rank 1: the rails, the glass, the gates, the chimes, the arrivals),
         then the return behind it all, the gutter and the screw tower (2).
         Only the painted hall is ground. */
      if (Enter.begin(TOWER.x, (TOWER.top + TOWER.bot) / 2, { rank: 2 })) { drawBackground(); Enter.end(); }

      // THE ELEMENTS, in the order they are PAINTED: the cogs and lines
      // behind, the front rails, the ferries, the wheel, the chimes, the
      // switches, the gates, the glass, the arrivals, the feed gear. They
      // land by rank (above), in this order inside one rank.
      var Lb = layers.back, Lf = layers.front, Lg = layers.glass;
      // the back plane lands as one piece: the spill network's cogs, its lines, the sink
      if (L.cogs.length && Enter.begin(MW / 2, 640)) { drawCogs(); Enter.end(); }
      if ((Lb || L.sink) && Enter.begin(Lb ? Lb.x + Lb.w / 2 : MW / 2, Lb ? Lb.y + Lb.h / 2 : 640, { rank: 1 })) {
        if (Lb) ctx.drawImage(Lb.cv, Lb.x, Lb.y, Lb.w, Lb.h);
        if (L.sink) drawSink();
        Enter.end();
      }
      for (i = 0; i < marbles.length; i++) {
        m = marbles[i];
        if (m.z < 0 && (m.st === "track" || m.st === "gate")) drawMarble(m);
      }
      if (Enter.begin(MW / 2, 600, { rank: 1 })) { ctx.drawImage(Lf.cv, Lf.x, Lf.y, Lf.w, Lf.h); Enter.end(); }
      drawLitRails();
      drawFerries();
      drawTierGlow();
      if (Enter.begin(L.wheel.cx, L.wheel.cy)) { drawWheel(); drawSurge(); Enter.end(); }
      drawChimes();
      drawSwitches();
      drawGates();
      drawArcs();
      drawHeat();
      for (i = 0; i < marbles.length; i++) {
        m = marbles[i];
        if (m.z >= 0 && (m.st === "track" || m.st === "gate" || m.st === "wait" || m.st === "fwait" || m.st === "wheel" || m.st === "drop")) drawMarble(m);
      }
      if (Lg && Enter.begin(Lg.x + Lg.w / 2, Lg.y + Lg.h / 2, { rank: 1 })) { ctx.drawImage(Lg.cv, Lg.x, Lg.y, Lg.w, Lg.h); Enter.end(); }
      if (Lg) drawCovered();
      drawReceivers();
      for (i = 0; i < marbles.length; i++) if (marbles[i].st === "gutter" || marbles[i].st === "towait") drawMarble(marbles[i]);
      if (Enter.begin(H0[0] + 40, H0[1] - 50)) { drawFeed(); Enter.end(); }
      drawOrbit();
      drawComets();
      drawEffects();
      ctx.restore();
      drawFrameGlow();
      /* The lights go out: dark at once, held, back in the last fifth — the
         HUD and the shell stay lit, the machine does not. */
      if (blackT > 0) {
        var bk = blackT > blackLen * 0.2 ? 1 : blackT / (blackLen * 0.2);
        ctx.fillStyle = "rgba(2,1,8," + (0.86 * bk).toFixed(3) + ")";
        ctx.fillRect(0, 0, view.w, view.h);
      }
    }

    /* ===============================================================
       THE MOTOR CONTRACT
       =============================================================== */
    function onTimeUp() { if (state === "play") finish("time"); }
    // The motor calls this before the first reset(), at boot: it only fits
    // the machine and rebuilds the sprites, never touches round state.
    function onResize() { fit(); readFont(); build(); }

    /* THE PACE PER LEVEL. The level layer lerps the clock, the hearts and
       the electric rate across the climb (web.levels.tune); the pace knobs
       are set here instead, because they must EASE at the start of every
       biome: a new machine has more switches and gates, so its first level
       drops the pace back and its sixth brings it up past where the last
       biome ended. `p` runs 0.10 -> 0.45 in biome 1 ... 0.82 -> 1 in biome 5. */
    var PACE = { tempoEnd: [1.3, 1.9], pourEnd: [0.46, 0.2], lockRate: [0.08, 0.22], lockGain: [0.6, 2.95],
                 lockMoreEvery: [0.8, 0.23], minOpenEnd: [1.3, 0.35] };
    var PACE_BASE = {};
    (function () { for (var k in PACE) if (PACE.hasOwnProperty(k)) PACE_BASE[k] = M[k]; })();
    function applyLevel(d) {
      var k, n = CONFIG.level, b, w, p;
      if (d == null || !n) { for (k in PACE_BASE) if (PACE_BASE.hasOwnProperty(k)) M[k] = PACE_BASE[k]; return; }
      b = clamp(Math.floor((n - 1) / 6), 0, 4); w = ((n - 1) % 6) / 5;
      p = clamp(0.1 + 0.18 * b + 0.35 * w, 0, 1);
      for (k in PACE) if (PACE.hasOwnProperty(k)) M[k] = PACE[k][0] + (PACE[k][1] - PACE[k][0]) * p;
    }

    /* --- THE LEVEL LAYER (web target) ------------------------------------
       The three-star finish: the web shell has already played the slow
       motion, and the round ends through the game's own result so the end
       screen keeps these stat rows. Ignored by the playable, which has no
       levels — see docs/LEVELS.md. */
    return { reset: reset, update: update, render: render,
             onDown: onDown, onTimeUp: onTimeUp, onResize: onResize,
             levelWon: function () { finish("time"); }, applyLevel: applyLevel,
             /* The third star is a clean shift: every heart lost counts
                against the allowance of `web.levels.faults`. */
             levelFaults: function () { return stats ? stats.heartsLost : 0; },
             held: function () { return !!held; }, codex: codex, wipe: wipe };
  })();
