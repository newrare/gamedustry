  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Spinshock",
    /* One sentence, and the stage below plays it: a top spinning in a dish, an
       enemy top charging in, the finger tapping on the impact. The title and
       the demo caption are hidden in the SKIN — the picture says the rest. */
    tagline: "Blast then break the rival tops with one <b class=\"w-tap\">tap</b> right on the <b class=\"w-hit\">impact</b>",
    gameSeconds: 0,                  // endless: the round ends when the top falls
    storeUrl: {
      ios:     "https://newrare.app/#playables",
      android: "https://newrare.app/#playables",
      fallback:"https://newrare.app/#playables"
    },
    designWidth: 720, designHeight: 1280, bg: "#08081c",
    layout: { hudHeight: 160, ctaHeight: 118, sideMargin: 26 },
    intro: { logo: "logo", demo: "tap", caption: "" },
    /* No clock: the right-hand slot carries the spin percentage instead, which is
       the only number that can end the run — and the tall segmented bar drawn
       down the right edge of the play area is the same reading, in colour. */
    hud: { score: true, timer: false },
    /* The bed sits well under the metal-on-metal: a round is a stream of clanks
       and shockwaves, and those are what the player plays on. The ROUND's own
       window is the band's (CONFIG.bands, played from reset); `menu` is the
       track's own opening, which runs to 12 s before the body enters — quiet by
       construction, and a third of a tone down at half the level so it reads as
       somewhere else rather than as the round playing softly. */
    music: { volume: 0.10, fade: 1.8,
             menu: { from: 0, length: 12, rate: 0.85, gain: 0.5 } },
    copy: {
      start:"Tap to play", ctaBar:"Install now", ctaEnd:"Play the full game",
      replay:"Replay the demo", scoreLabel:"Score", timeLabel:"Spin",
      endScore:"Final score", gameOver:"Spun out!", timeUp:"Time's up!"
    },

    /* THE FIVE BANDS OF THE CLIMB — one per six levels, and the level map
       names them on its own card. Each carries the three things that make a
       band a PLACE: the painted dish it is fought in, the colour the electric
       fence burns, and the stretch of the track the round rides. They turn
       over together, on the same level, which is the whole point of putting
       them on one line.

       `scene` names a cut of assets/image/embed/ and the file name is the whole
       declaration — `spinshock-background-phone-blue.png` reaches
       `CONFIG.art.backgroundPhoneBlue` and `ArtImages` with it. BLUE IS FIRST
       ON PURPOSE: a playable is one round at level 0 and ships the first scene
       alone, alphabetically (tools/build/build.mjs, SCENE_SET).

       `wall` IS that painting, measured and not picked: the mean hue of its
       most vivid eighth, pushed to full value so it reads as a discharge
       (blue H238, green H155, yellow H44, purple H261, red H11). The fence is
       the one thing in this game the art and the code both draw, so a dish
       painted blue can only ever spark blue — see `zap`.

       `scrim` is how far that painting is knocked back under the tops, and it
       is solved rather than eyeballed. The five are not equally bright — mean
       luma 23.6 (purple) to 53.8 (green) — and what a player reads here is the
       metal, the shockwave and the gauge, so each scrim is the one that leaves
       the same residual luma the blue dish has always had at .26.

       `music` is the window of the track (docs/MUSIC.md), and the entry points
       are the track's own seams, measured: the opening runs to 12 s, the body
       enters at 13, there is a breakdown at 65-76 and a second at 119-127, and
       the track stops dead at 179.2 with no fade to keep clear of.

       A band is also the LIVERY that arrives with it, which is the other half
       of the climb: the lerped knobs (web.levels.tune in the manifest) only
       ever make the same dish faster and hungrier. A new livery is a new rule,
       because a livery IS an immunity (see foeColours) — something else to
       read before the tap, four times over by the top of the ladder. */
    bands: [
      // the dish                        scrim   the fence     the stretch of the track     the levels, and what arrives
      { scene:"backgroundPhoneBlue",   scrim:0.26, wall:"#6166ff", music:{ from:13,  length:23 } },  //  1-6   green:  nothing is immune to anything
      { scene:"backgroundPhoneGreen",  scrim:0.66, wall:"#66ffbf", music:{ from:38,  length:25 } },  //  7-12   + blue:   the fence cannot mark them
      { scene:"backgroundPhoneYellow", scrim:0.63, wall:"#ffd257", music:{ from:77,  length:25 } },  // 13-18   + yellow: no other top can — and purple, which splits
      { scene:"backgroundPhonePurple", scrim:0.04, wall:"#9f6bff", music:{ from:128, length:24 } },  // 19-24   + red:    ONLY the fence can
      { scene:"backgroundPhoneRed",    scrim:0.43, wall:"#ff7152", music:{ from:153, length:25 } }   // 25-30   + black:  it mends the others — and the boss
    ],
    /* The level each band opens on. It is the LEVEL NUMBER and not the map's
       own `d`, because the two roads out of a fork have to be the same place —
       `web.levels.bands.from` in the manifest carries the very same list, which
       is what keeps the card on the map and the dish the round builds in step
       (docs/LEVELS.md, *The name on the card*). */
    bandFrom: [1, 7, 13, 19, 25],

    /* --- the player's top --- */
    playerR: 82,
    spinStart: 0.85,       // spin left at the start of a run, 0..1
    /* Friction: the top always slows down, and faster the longer the run has
       gone on, so a player who stops landing shockwaves always spins out. */
    drainBase: 0.032,      // spin lost per second at the start...
    drainRamp: 0.042,      // ...plus this much by the end of the ramp
    rampSeconds: 60,       // seconds over which every curve reaches its peak
    /* The shockwave kicks like a cannon: the top is thrown right across the
       dish and ricochets off the wall, which is where most of the movement in
       a round comes from. */
    recoil: 650,           // px/s the top is pushed back by its own shockwave
    playerDamp: 1.15,      // how slowly that drift dies out
    playerBounce: 0.82,    // energy the top keeps when it hits the wall

    /* --- the wreck ---
       A top that runs out of spin does not tip over politely: it BLOWS UP. The
       sprite is cut into wedges that are thrown across the dish, the blast
       shoves every rival out of the way, and the whole thing plays in slow
       motion for a beat before the end screen comes up. */
    deathSeconds: 2.6,     // how long the wreck plays before the end screen
    rimShards: 8,          // pieces the toothed shell tears into...
    plateShards: 5,        // ...and pieces the plate under it cracks into
    shardSpeed: 620,       // px/s the debris is thrown out at
    shardDamp: 1.5,        // how fast a sliding shard bleeds its speed
    shardBounce: 0.55,     // energy a shard keeps when it hits the wall
    deathSlow: 0.16,       // time scale at the instant of the blast...
    deathSlowUp: 0.9,      // ...back to full speed over this many seconds

    /* --- the shockwave ---
       A tap is scored on the GAP between the two shells (px): 0 is contact, so
       the whole window sits just before the crash. Wide on purpose — a playable
       has to reward the intent, not punish the reflex. */
    reach: 122,            // gap a shockwave can still reach
    gapGreat: 68,
    gapPerfect: 32,
    boost: [0.055, 0.100, 0.155],   // spin won by an OK / GREAT / PERFECT shock
    tierMult: [1, 2, 3],            // score multiplier of the same three tiers
    tierName: ["OK", "Great", "Perfect"],
    multiBoost: 0.035,     // extra spin per extra top caught in the same wave
    whiffCost: 0.05,       // spin lost by a shockwave that hits nothing (a MISS)
    tapCooldown: 0.18,     // seconds between two taps, so mashing is not free
    comboEvery: 5,         // combo interval that pays a bonus
    comboCap: 25,          // combo past which the score multiplier stops growing
    comboSpin: 0.05,       // spin handed back on a combo milestone
    /* The alarm is relative to what the top can still hold, so it means the
       same thing at the start of a run and once the bearings are worn. */
    warnAt: 0.26,          // share of the capacity under which the alarm fires
    warnClear: 0.45,       // ...and over which it re-arms

    /* Wear: the top cannot hold as much spin as the round goes on, so even
       flawless play runs the dish down in the end. This is what bounds an
       endless run, and it reads on the gauge as a dead red band eating the top
       of the bar. */
    wear: 0.90,            // share of the gauge lost by the end of the wear...
    wearSeconds: 120,      // ...which takes this long

    /* --- the rivals --- */
    spawnEvery: 1.90, spawnEveryEnd: 0.90,
    maxFoes: 3,            // rivals in the dish at once — a level's row wins
    knockback: 1600,       // px/s a repelled top is thrown out at

    /* SHELL POINTS ---------------------------------------------------------
       Every rival carries one to four of them and blows apart on its last. It
       loses one when:

         "shock"  the player's shockwave repels it — TWO when the tap that
                  fired it was a PERFECT on that top;
         "foe"    it is thrown into another top, or another is thrown into it.
                  BOTH pay the point, which is what turns a crowded dish into
                  the player's own weapon;
         "wall"   it slams into the electric fence.

       A charge that lands on the PLAYER costs the player spin and the rival
       nothing: that is the rival's one free hit, and the reason a run ends.

       A graze under chipSpeed is free, and so is a nudge under foeHitSpeed —
       a dish full of tops jostling along the boards must never chip itself to
       death with the player doing nothing. slamBounce is deliberately lossy,
       so a top thrown at knockback speed comes back into the dish at a speed
       the player can still read. */
    chipSpeed: 620,        // impact speed from which a wall hit costs a point
    foeHitSpeed: 620,      // ...and from which a top-on-top contact costs both
    slamBounce: 0.52,      // energy kept in such a slam
    perfectDmg: 2,         // points a PERFECT tap takes instead of one
    koScore: 2,            // the type's score, times this, when it finally dies
    healEvery: 1.2,        // seconds between two repairs by the same black top

    /* Chaos: every top in the dish carries a velocity and collides with every
       other one, so a charge can be deflected, a wreck can scatter the pack,
       and nothing crosses the arena on the line it was aimed along.
       foeBounce > 1 means a contact ADDS energy — that is the point. */
    foeBounce: 1.10,       // restitution between two tops
    foeWallBounce: 0.94,   // restitution against the dish wall
    foeAccel: 2.4,         // how hard a rival steers back toward the player
    foeDrag: 1.8,          // how fast borrowed speed bleeds back to its cruise
    foeLiveMax: 900,       // speed a pile-up may push a cruising top to...
    foeMaxSpeed: 1600,     // ...and the hard ceiling for one the wave launched

    /* PATIENCE — the reason a wanderer is never scenery. The player's top does
       not go anywhere: it holds the middle of the dish and drifts on its own
       recoil, so a livery with no reason of its own to enter the strike zone
       leaves a level that fields it ALONE with nothing in reach at all — the
       gauge ran out at 15 to 30 s with a score of nothing (levels 8, 9, 16 and
       25 were 0-1 clears out of 8 on the headless pilot, back when blue orbited
       the dish and black ran).
       So a top that has been out of reach for `patience` seconds starts bending
       toward the player, and over `patienceRamp` more it is simply charging.
       Only the PURPLE needs it today: the pulser, the zigzag and the chargers
       all aim at the top by construction, the red flies a line at it, and the
       black's ring is drawn inside the reach (see `circleGap`). */
    patience: 2.0,         // seconds out of reach a top is allowed...
    patienceRamp: 2.6,     // ...and how long the pull then takes to take over
    /* An ANSWERED top — repelled, or its charge landed — flies on the speed it
       was handed for this long before its own way of moving takes it back. The
       pulser, the zigzag and the circler steer HARD (they hold a shape the
       player has to read), and without this beat a shockwave would be cancelled
       a frame after it landed and no top would ever reach a board. */
    recover: 0.55,

    /* BLUE — the PULSER. It alternates two beats and nothing else: it HOLDS,
       stopped dead, while a ring closes in on it and a line draws the run it is
       about to make, then it DASHES that line at several times its cruise. */
    pulseHold: 1.05,       // seconds stopped, charging...
    pulseDash: 0.42,       // ...seconds of the dash that follows...
    pulseBoost: 2.6,       // ...at this many times its cruise
    pulseBrake: 16,        // how hard it stops (1/s) once a dash is spent
    /* YELLOW — the SAW. A triangle wave at the top: straight runs at zigAngle
       off the line to the player, flipping side every time it is zigAmp px
       off that line, so the floor keeps a sawtooth with sharp corners. */
    zigAngle: 0.96,        // rad off the line it is heading along (55°)
    zigAmp: 64,            // px off that line before it flips (+ its radius)
    zigSteer: 40,          // how fast its velocity snaps onto the new run (1/s)
    /* RED — the BOMB. A straight line across the dish, no steering at all, and
       it blows up on the first thing it touches: a wall, a top, the player. The
       blast is a ring the player SEES, and what that ring reaches is what it
       hits — a shell point and a shove for every rival under it. */
    blastR: [150, 230],    // radius of the blast, small and large
    blastPush: 900,        // px/s a rival under the blast is thrown out at
    /* BLACK — the CIRCLER. A ring around the player at a fixed gap and never a
       step closer: it does not want the hit, it wants to be near the others it
       mends. The ring sits inside the reach so a tap always answers it. */
    circleGap: 0.78,       // the ring's gap, as a share of `reach`
    circleSteer: 7,        // how fast it settles onto the ring (1/s)

    /* SIX LIVERIES, AND A LIVERY IS AN IMMUNITY ----------------------------
       The colour of a rival is not decoration: it is the one source of damage
       that top does not answer to, so reading the dish is reading which of the
       three answers is still on the table.

         green   none. The tap, the fence and a pile-up all mark it.
         blue    the FENCE cannot. Slamming it into a board is wasted work; it
                 has to be taken apart by the tap or by another top.
         yellow  another TOP cannot. A chain reaction washes over it, so it is
                 the one colour a crowd does not solve.
         red     everything but the fence. A shockwave does not mark it, it
                 AIMS it — and it blows up on whatever it touches next, so a
                 red sent into a board is a red gone, and its blast marks
                 every rival around the spot.
         black   nothing, and it hands a shell point back to every rival it
                 touches. Answer it first or answer the dish twice.
         purple  none, and it does not die quietly: a large one leaves two
                 smalls. One top is three.

       AND A LIVERY IS ALSO A WAY OF MOVING. The immunity says how a top is
       taken apart; `move` says how it behaves before that, which is what the
       player actually watches — six colours crossing the dish six different
       ways, each of them leaving a trail of its own colour behind it (see
       `heading` and `tracks` in section 6):

         green   `chase`  straight at the top, and SLOW. The first thing the
                 game ever shows, at a speed a first tap can answer.
         blue    `pulse`  stop, charge, DASH, stop again: it holds still while
                 a ring closes on it and a line shows the run it is about to
                 make, then makes it. The floor keeps a string of straight
                 dashes, one per impulse.
         yellow  `zigzag` at the top, on a TRIANGLE wave: straight runs and
                 sharp corners, so its trail is a saw on the floor.
         red     `line`   one straight run across the dish, aimed at the top
                 when it came in, FAST, no steering — and it ends in a blast.
         black   `circle` a ring round the player at a fixed gap, never a step
                 closer: it never comes for the hit.
         purple  `drift`  a new heading every second or so, a quarter of it
                 pulled toward the top so a wanderer always comes round in the
                 end.

       `speedK` scales the build's own speed, which is how "slow" and "fast"
       are the same table entry as the colour.
       `hp` and `score` are per size, small to large.

       SCORE BARELY MOVES WITH SIZE, and that is deliberate. It is paid on every
       shockwave that lands AND again at the KO, so a four-point top already
       pays four times what a one-point top does without the number moving at
       all: paying for the build on top of that is paying for the same work
       twice. Measured on the headless pilot, a per-size ladder (8 -> 44) made
       level 30 worth twenty-one times level 1 on the clock, which no single
       objective range can span. What the number IS for is the LIVERY — how
       awkward that colour is to take apart. */
    foeColours: [
      { key:"g", hp:[1,4], score:[8,10],  move:"chase",  speedK:0.62,
        rim:["#8cff5e","#1a6b12"], plate:"#0d2408", arm:"#d2ffb8", core:"#f2fff0" },
      { key:"b", hp:[2,4], score:[11,13], move:"pulse",  speedK:0.95, wallProof:true,
        rim:["#6fb4ff","#0d3a8f"], plate:"#0a1a3c", arm:"#bcdcff", core:"#eaf5ff" },
      { key:"y", hp:[2,4], score:[11,13], move:"zigzag", speedK:1.00, foeProof:true, trail:1.7,
        rim:["#ffd21f","#6f4a00"], plate:"#241800", arm:"#ffeda0", core:"#fffbe0" },
      /* ONE shell point, whatever the build: a red does not wear down, it
         blows up on its first contact — the pip ring is whole until then. */
      { key:"r", hp:[1,1], score:[15,17], move:"line",   speedK:1.70, wallOnly:true, blasts:true,
        rim:["#ff4d5e","#780512"], plate:"#280409", arm:"#ffb3bb", core:"#ffe4e8" },
      { key:"k", hp:[2,4], score:[14,18], move:"circle", speedK:0.85, heals:true,
        rim:["#9aa3c2","#14151e"], plate:"#06060b", arm:"#5bd992", core:"#8affc0" },
      { key:"p", hp:[2,1], score:[9,9],   move:"drift",  speedK:0.85, splits:true,
        rim:["#c9a3ff","#4a1d8f"], plate:"#1c0f38", arm:"#e0c6ff", core:"#f4ecff" }
    ],

    /* TWO BUILDS — the half of a rival a player reads before its colour, and
       two is all it takes to read it: a small top is quick and cheap to be hit
       by, a large one crosses the dish slowly and costs a quarter of the gauge
       when it lands. A middle build sat between them and was told apart from
       neither at a glance. */
    foeSizes: [
      { key:"s", r:26, speed:380, cost:0.09, teeth:8,  amp:18, arms:2, sharp:true },
      { key:"l", r:52, speed:185, cost:0.23, teeth:16, amp:16, arms:4 }
    ],

    /* THE BOSS — the one top a level places itself, and nothing but a PERFECT
       tap marks it. Ten shell points at one apiece: it is not a wall of health
       to grind down, it is the one thing this game is about, asked ten times.
       Its rim carries all six liveries at once, which is the only place in the
       dish a top is painted in more than two colours. */
    boss: { key:"boss", r:66, speed:135, cost:0.32, teeth:22, amp:17, arms:5,
            hp:10, score:100, perfectOnly:true, move:"chase", speedK:1,
            rim:["#ff4d5e","#ffd21f","#8cff5e","#40ecff","#c9a3ff","#ff4d5e"],
            plate:"#160a30", arm:"#ffffff", core:"#ffffff" },

    /* THIRTY LEVELS, ONE LINE EACH ----------------------------------------
       `pool` is the roster, `key:weight` per entry, where the key is a livery
       and a build (see foeTypes below): "gs" a small green, "rl" a large red.
       `max` is how many may be in the dish at once — the one knob the level
       layer does NOT lerp, because a roster and a crowd size only mean
       anything together. `boss` puts a boss in the dish from the first second.

       THE LADDER IS A COURSE, NOT A RAMP. A level is where one thing is
       learned, so most of the first three bands field ONE TYPE, alone, in a
       nearly empty dish: level 1 is a single small green top and nothing else.
       A colour arrives in its small build, then its large one, and only then
       meets what came before. Sizes are what the early bands vary; COLOURS are
       what the last ones do — the top of the ladder is five liveries in their
       large build, all moving differently, which is a dish to read rather than
       a dish to survive.

       The crowd runs 1 -> 5, not 3 -> 8. A rival is a thing to watch, and six
       of them at once is a thing to flail at. The splitter is the one that
       breaks the cap on purpose: `max` gates SPAWNS, and nothing gates what a
       purple leaves behind, so a board of three large purples is a board of
       nine tops if it is answered badly.

       A cap of two is a level of ONE top most of the time, and the late bands
       carry the high end of the objective — measured on the headless pilot, the
       sparse levels of bands 3 to 5 (16, 19, 20, 25) could not reach three
       stars inside a round at all. They hold three, which is still the "one to
       three" the early bands are built on. */
    levels: [
      { pool:"gs:1",                             max:1 },  //  1  BLUE — one small green. That is the whole level.
      { pool:"gs:1",                             max:2 },  //  2      two of them: the dish is never empty
      { pool:"gl:1",                             max:2 },  //  3      the large: four shockwaves, not one
      { pool:"gs:3 gl:1",                        max:3 },  //  4      the two builds together
      { pool:"gs:1 gl:2",                        max:3 },  //  5
      { pool:"gs:1 gl:1",                        max:3 },  //  6
      { pool:"bs:1",                             max:2 },  //  7  GREEN — blue, alone: it pulses, and the fence cannot mark it
      { pool:"bs:1",                             max:3 },  //  8
      { pool:"bl:1",                             max:3 },  //  9
      { pool:"bs:2 bl:1",                        max:3 },  // 10
      { pool:"gs:1 gl:1 bs:2",                   max:3 },  // 11      the first meeting of two liveries
      { pool:"gl:2 bs:1 bl:2",                   max:4 },  // 12
      { pool:"ys:1",                             max:2 },  // 13  YELLOW — yellow, alone: it saws, and no other top can mark it
      { pool:"ys:1 yl:1",                        max:2 },  // 14
      { pool:"yl:1",                             max:3 },  // 15
      { pool:"pl:1",                             max:3 },  // 16      one large purple — and it is two more by the end
      { pool:"ys:1 yl:1 pl:1",                   max:3 },  // 17
      { pool:"yl:2 pl:2 bl:1",                   max:4 },  // 18
      { pool:"rs:1",                             max:3 },  // 19  PURPLE — red, alone: a line, a blast, and only the fence marks it
      { pool:"rs:1 rl:1",                        max:3 },  // 20
      { pool:"rl:1",                             max:3 },  // 21
      { pool:"rs:1 rl:2",                        max:3 },  // 22
      { pool:"rl:2 bl:2 yl:2",                   max:4 },  // 23      three liveries, one build: colours, not sizes
      { pool:"rl:2 yl:2 pl:1",                   max:4 },  // 24
      { pool:"ks:1",                             max:3 },  // 25  RED — black, alone: it circles, and it mends
      { pool:"ks:1 kl:1 gl:2",                   max:4 },  // 26      ...and now it has something to mend
      { pool:"kl:2 bl:2 rl:2",                   max:4, boss:1 },  // 27
      { pool:"ks:1 kl:1 yl:2 pl:2 bl:2",         max:5 },  // 28
      { pool:"bl:2 yl:2 rl:2 kl:2 pl:2",         max:5 },  // 29      the five liveries, large, six trails on the floor
      { pool:"bl:2 yl:2 rl:2 kl:2 pl:2",         max:5, boss:1 }   // 30
    ],

    /* THE PLAYABLE, AND THE ENDLESS RUN ABOVE LEVEL 30 — neither has a level,
       so neither has a row: the roster rides the CLOCK instead and walks the
       same course in about seventy seconds. No boss here on purpose. A creative
       is thirty seconds long and a top nothing but a perfect tap can mark would
       read, in an ad, as a top that cannot be killed. */
    endless: [
      { from: 0,  pool:"gs:5 gl:1" },
      { from: 16, pool:"gs:1 gl:4 bs:2" },
      { from: 32, pool:"gl:2 bs:1 bl:1 ys:2" },
      { from: 50, pool:"bl:2 ys:1 yl:1 pl:1" },
      { from: 70, pool:"bl:2 yl:2 rl:2 pl:2" }
    ]
  };

  /* THIRTEEN RIVALS, COMPOSED FROM THE TWO TABLES ABOVE — six liveries times
     two builds, plus the boss. None of them is written by hand: the build
     gives a top its silhouette, its speed and the spin its charge costs, the
     livery gives it its paint and its one immunity, and the pair gives it the
     shell points and the score. The key is colour + size, which is what a
     level's roster names.
     `down` is where a purple goes when it blows up: a large one leaves two
     smalls, and a small nothing. */
  CONFIG.foeTypes = (function () {
    var out = {}, i, j, c, s, t, sizes = CONFIG.foeSizes, cols = CONFIG.foeColours;
    for (i = 0; i < cols.length; i++) {
      c = cols[i];
      for (j = 0; j < sizes.length; j++) {
        s = sizes[j];
        t = { key: c.key + s.key, r: s.r, speed: s.speed, cost: s.cost,
              teeth: s.teeth, amp: s.amp, arms: s.arms, sharp: !!s.sharp,
              hp: c.hp[j], score: c.score[j],
              move: c.move, speedK: c.speedK,
              rim: c.rim, plate: c.plate, arm: c.arm, core: c.core,
              wallProof: !!c.wallProof, foeProof: !!c.foeProof,
              wallOnly: !!c.wallOnly, heals: !!c.heals, splits: !!c.splits,
              blastR: c.blasts ? CONFIG.blastR[j] : 0, trail: c.trail || 1 };
        out[t.key] = t;
      }
    }
    for (i = 0; i < cols.length; i++) {
      if (!cols[i].splits) continue;
      for (j = 1; j < sizes.length; j++)
        out[cols[i].key + sizes[j].key].down = out[cols[i].key + sizes[j - 1].key];
    }
    out[CONFIG.boss.key] = CONFIG.boss;
    return out;
  })();

  /* ===================================================================
     2. ASSETS — embedded base64 data URIs only (no network requests ever).
     Generate entries with tools/lab/embed-asset.mjs.
     =================================================================== */
  var ASSETS = {
    images: {
      // The app icon, also used as the intro logo (assets/image/icon/spinshock.png).
      logo: "data:image/jpeg;base64,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",
    },
    sounds: {
      /* The background bed, looped and crossfaded by Music (see CONFIG.music). This
         is the FIRST BAND's window of the track and nothing else — the whole of it
         ships on the web only (web.music in the manifest), where the five bands each
         loop a stretch of their own. See docs/MUSIC.md.
           ffmpeg -ss 13 -t 23 -i assets/audio/music/spinshock.mp3 \
                  -ac 1 -ar 44100 -b:a 64k music.mp3                               */
      music: "data:audio/mpeg;base64,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",
      // No sfx clip here: every key the game plays is a role of the house kit,
      // mapped by `sfx` in manifest.json and injected by the builder.
    }
  };

  /* ===================================================================
     6. GAME — SPINSHOCK. Top-down beyblade dish, one input: the tap.

     The player's top spins in the middle of the dish and loses spin every
     second. Rival tops charge in from outside the arena; tapping while one of
     them is about to touch the shell releases a shockwave that marks its shell,
     throws it back out and feeds spin back into the top. The closer to the
     actual impact the tap lands, the bigger the boost, the score — and the
     damage. A wave that hits air costs spin, a rival that lands its charge
     costs a lot of it, and the run ends the moment the spin gauge empties and
     the top blows apart.

     Six LIVERIES of rival, three builds apiece, and a livery is an immunity:
     what a colour does not answer to is what the player has to find another
     answer for (CONFIG.foeColours). Five BANDS of six levels each carry the
     painted dish, the colour the electric fence burns, the stretch of the
     track and the liveries that arrive with them (CONFIG.bands).

     Everything is drawn on canvas; the tops and the dish are pre-rendered once
     per layout (their glow needs shadowBlur, which is far too expensive to pay
     every frame) and blitted rotated.
     =================================================================== */
  var Game = (function () {
    var TAU = Math.PI * 2;

    /* ---------------------------------------------------------------- state */
    var score, combo, bestCombo, shocks, perfects, crashes, bestWave;
    var spin, spinAngle, elapsed, spawnT, cooldown, shownPct, warnArmed, lowSpin;
    var wornSaid;
    var phase, phaseT;                 // "spin" | "fall" | "done"
    var player, foes, waves, zaps, shards, wreckStep, tracks, blasts, scorches;
    var arena = { x:0, y:0, w:0, h:0, cx:0, cy:0 };
    var floorCv = null, topCvs = null, foeCv = {}, topDpr = 0;
    var bumpT = 0;                     // throttle on the metal-on-metal clank
    /* The gauge's own state: the ghost head that trails the real value, the
       punch a scored change leaves on the rail, a clock that keeps the low-spin
       flash alive through the wreck, and the jitter of the two electric arcs it
       is drawn with — rolled on a fixed step in `update`, never in `render`, so
       the crackle has a readable rhythm instead of strobing at frame rate. */
    var spinLag, gaugePunch, gaugeCol, gaugeT, sparkT;
    var arcSeg = [], boltSeg = [];

    /* THE BAND AND THE LEVEL ------------------------------------------------
       `BAND` is the six-level stretch of the climb being played (CONFIG.bands):
       the painted dish, the colour the fence burns, the window of the track.
       It is fixed by `applyLevel` before `reset()` and read everywhere, and it
       falls back to the first band — which is the whole of a playable, since a
       creative has no level and ships that scene alone.
       `ROW` is the level's own line of CONFIG.levels (its roster and its crowd
       size), and it is null outside a level: the playable and the endless run
       above level 30 ride CONFIG.endless on the clock instead. */
    var BAND = CONFIG.bands[0], ROW = null, POOL = null;

    /* ------------------------------------------------------------ pre-render */
    /* Cached canvases are authored in design px like everything else, but their
       backing store is scaled by the device ratio (capped like the engine caps
       it) so a pre-rendered top stays crisp on a retina screen. `_w` / `_h` keep
       the logical size for the blit. */
    function makeCanvas(w, h) {
      var c = document.createElement("canvas");
      var SPR = view.dpr;                        // the motor's rule, read per build
      c.width = Math.round(w * SPR); c.height = Math.round(h * SPR);
      c._w = w; c._h = h;
      c.getContext("2d").setTransform(SPR, 0, 0, SPR, 0, 0);
      return c;
    }

    /* One top drawn once into its own canvas: toothed rim, metal ring, plate,
       curved blades and the hot core. `o` is a foeTypes entry (or the player's
       own palette below). Rocks pass core:null and sharp:true, which turns the
       rim into a ring of chipped spikes. */
    function makeTop(R, o) {
      var pad = 16, size = Math.ceil((R + pad) * 2), c = makeCanvas(size, size);
      var g = c.getContext("2d"), i, k, a, rr, t, steps = o.teeth * 26;
      g.translate(size / 2, size / 2);

      // rim silhouette: a cosine wave of teeth, or a sawtooth of spikes
      g.beginPath();
      for (i = 0; i <= steps; i++) {
        a = i / steps * TAU;
        t = (a * o.teeth / TAU) % 1;
        rr = o.sharp ? R - o.amp + o.amp * (1 - Math.abs(t * 2 - 1))
                     : R - o.amp * 0.5 + o.amp * 0.5 * Math.cos(a * o.teeth);
        if (i === 0) g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.closePath();
      /* Two stops is a livery — light, dark, light again, which is what makes a
         disc look turned. More than two is the BOSS and nothing else: its six
         are spread evenly instead, so the rim carries every colour in the dish
         at once and reads as the one top that belongs to no livery. */
      var grd = g.createLinearGradient(-R, -R, R, R);
      if (o.rim.length > 2) {
        for (i = 0; i < o.rim.length; i++)
          grd.addColorStop(i / (o.rim.length - 1), o.rim[i]);
      } else {
        grd.addColorStop(0, o.rim[0]); grd.addColorStop(0.55, o.rim[1]); grd.addColorStop(1, o.rim[0]);
      }
      g.shadowColor = rgba(o.rim[0], 0.75); g.shadowBlur = 22;
      g.fillStyle = grd; g.fill();
      g.shadowBlur = 0;
      g.lineWidth = 3; g.strokeStyle = "rgba(4,4,14,.75)"; g.stroke();

      // plate
      var pr = R * 0.72;
      var pg = g.createRadialGradient(-pr * 0.3, -pr * 0.35, pr * 0.1, 0, 0, pr);
      pg.addColorStop(0, rgba(o.plate, 1)); pg.addColorStop(1, "rgba(3,3,12,.98)");
      g.fillStyle = pg;
      g.beginPath(); g.arc(0, 0, pr, 0, TAU); g.fill();
      g.lineWidth = 4; g.strokeStyle = rgba(o.rim[0], 0.5); g.stroke();

      // curved blades, so the rotation reads at a glance
      g.lineCap = "round"; g.lineWidth = R * 0.15; g.strokeStyle = o.arm;
      for (k = 0; k < (o.arms || 0); k++) {
        a = k / o.arms * TAU;
        g.beginPath(); g.arc(0, 0, pr * 0.62, a, a + 1.15); g.stroke();
      }

      // core
      if (o.core) {
        var cg = g.createRadialGradient(0, 0, 1, 0, 0, R * 0.3);
        cg.addColorStop(0, "#ffffff"); cg.addColorStop(0.45, o.core);
        cg.addColorStop(1, rgba(o.core, 0));
        g.fillStyle = cg;
        g.beginPath(); g.arc(0, 0, R * 0.3, 0, TAU); g.fill();
      } else {
        // a rock has a dead, cracked middle instead of a glowing tip
        g.lineWidth = 5; g.strokeStyle = "rgba(0,0,0,.55)";
        for (k = 0; k < 3; k++) {
          a = k * 2.1 + 0.4;
          g.beginPath();
          g.moveTo(Math.cos(a) * pr * 0.2, Math.sin(a) * pr * 0.2);
          g.lineTo(Math.cos(a + 0.5) * pr * 0.8, Math.sin(a + 0.5) * pr * 0.8);
          g.stroke();
        }
      }
      return c;
    }

    /* THE TOP'S COLOUR IS THE SPIN GAUGE ------------------------------------
       The top itself cools from ice-cyan through mint and gold to a dying red as
       the spin runs down, the way the viper in games/vipera reads its length off
       its body — and the bar on the right edge burns the very same ramp, so the
       two always agree. One sprite is pre-rendered per tier and two neighbours
       are cross-faded, so the shift is continuous rather than a set of steps.
       Ordered from a full gauge to an empty one, evenly spread: tier i covers a
       spin of about 1 - i / (N - 1). */
    var SPIN_TIERS = [
      { rim:["#dffcff","#0a6d94"], arm:"#ff4fbe", core:"#e8feff", glow:"#7ef4ff" },
      { rim:["#9dffcd","#0d7a52"], arm:"#d6ff6b", core:"#eaffef", glow:"#4dff9b" },
      { rim:["#ffe27a","#8a5200"], arm:"#fff3b0", core:"#fffbe6", glow:"#ffd43b" },
      { rim:["#ffb066","#7a2f08"], arm:"#ffd9b0", core:"#fff0dc", glow:"#ff8a3d" },
      { rim:["#ff7a96","#78001f"], arm:"#ffc2cf", core:"#ffe3e9", glow:"#ff2f6d" }
    ];

    /* The floor is the painted dish of the BAND being played (BAND.scene, out
       of ArtImages), cover-fit to the design canvas and knocked back by that
       band's own scrim so the tops keep their contrast — the five paintings are
       not equally bright, and one shared stop would leave two of them fighting
       the metal. Falls back to the first band's dish, then to the cold gradient,
       so a bare frame is impossible whatever a build ships.
       The artwork deliberately carries NO rim: the boundary is an electric fence
       that only exists at the instant something slams into it (see `zap`). */
    /* THE FLOOR IS BUILT ONCE PER DISH, not once per round. It is a full frame
       at the device ratio — megabytes of backing store — and a replay of the
       same level used to throw the old one at the collector every time, which
       a phone pays back as a major GC mid-round a few rounds later. `floorSig`
       is everything the picture is made of: the frame and its ratio, the HUD
       and CTA edges the scrim is cut to, the band's painting and its scrim —
       and whether that painting had decoded, so a dish first built on the
       fallback gradient is repainted once the art is there. */
    var floorSig = "";
    function buildFloor() {
      var img = (typeof ArtImages !== "undefined" &&
                 (ArtImages[BAND.scene] || ArtImages[CONFIG.bands[0].scene])) || null;
      var sig = [view.w, view.h, view.dpr, Layout.top, Layout.bottom, CONFIG.bg,
                 BAND.scene, BAND.scrim, img && img.width ? 1 : 0].join("|");
      if (sig === floorSig && floorCv) return;
      floorSig = sig;
      floorCv = freeCanvas(floorCv);
      floorCv = makeCanvas(view.w, view.h);
      var g = floorCv.getContext("2d"), grd;
      g.fillStyle = CONFIG.bg; g.fillRect(0, 0, view.w, view.h);

      if (img && img.width) {
        // cover-fit: crop, never stretch, whatever Layout the device hands us
        var s = Math.max(view.w / img.width, view.h / img.height);
        var w = img.width * s, h = img.height * s;
        g.drawImage(img, (view.w - w) / 2, (view.h - h) / 2, w, h);
      } else {
        // fallback, so a decode hiccup never leaves a bare frame
        grd = g.createRadialGradient(view.w / 2, view.h / 2, 24,
                                     view.w / 2, view.h / 2, view.h * 0.62);
        grd.addColorStop(0, "#2b2478"); grd.addColorStop(0.5, "#151140");
        grd.addColorStop(1, "#08061c");
        g.fillStyle = grd; g.fillRect(0, 0, view.w, view.h);
      }
      // The tops and the shockwaves are the bright things on screen: hold the
      // art one stop under them, by the band's own measured amount.
      g.fillStyle = rgba("#060614", BAND.scrim);
      g.fillRect(0, 0, view.w, view.h);
      // ...and darken the HUD and CTA bands further, so the score always reads.
      grd = g.createLinearGradient(0, 0, 0, view.h);
      grd.addColorStop(0, "rgba(4,4,18,.74)");
      grd.addColorStop(clamp(Layout.top / view.h, 0.02, 0.4), "rgba(4,4,18,0)");
      grd.addColorStop(clamp(Layout.bottom / view.h, 0.6, 0.98), "rgba(4,4,18,0)");
      grd.addColorStop(1, "rgba(4,4,18,.74)");
      g.fillStyle = grd; g.fillRect(0, 0, view.w, view.h);
    }

    /* THE SPIN BAR ----------------------------------------------------------
       The right edge of the play area is not part of the dish: it carries a tall
       segmented bar that IS the spin gauge, sitting right under the HUD's own
       "SPIN %" pill so the number and the picture read as one instrument. The
       dish is narrowed by the whole band, so no top ever plays behind it. */
    var GAUGE_W = 25;        // width of the rail
    var GAUGE_GAP = 16;      // air between the rail and the dish wall
    var GAUGE_BAND = GAUGE_W + GAUGE_GAP;
    var GAUGE_SEGS = 20;     // one cell per 5% of spin
    var GAUGE_PAD = 3;       // air between two cells
    var gauge = { x:0, y:0, w:0, h:0 };

    function build() {
      arena.x = Layout.left + 6; arena.y = Layout.top + 6;
      arena.w = Layout.w - 12 - GAUGE_BAND;
      arena.h = Layout.h - 12;
      arena.cx = arena.x + arena.w / 2; arena.cy = arena.y + arena.h / 2;
      gauge.w = GAUGE_W;     gauge.x = Layout.right - GAUGE_W;
      gauge.y = Layout.top + 8; gauge.h = Layout.h - 16;
      buildFloor();
      var i, t, k;
      /* The tops are sized in design px, so the only thing a resize can change
         about them is the device ratio their backing store is cut at: the
         player's five tiers are baked once per ratio and kept across rounds. */
      if (view.dpr !== topDpr) {
        if (topCvs) for (i = 0; i < topCvs.length; i++) freeCanvas(topCvs[i]);
        for (k in foeCv) freeCanvas(foeCv[k]);
        foeCv = {};
        topDpr = view.dpr;
        topCvs = [];
        for (i = 0; i < SPIN_TIERS.length; i++) {
          t = SPIN_TIERS[i];
          topCvs.push(makeTop(CONFIG.playerR, {
            teeth: 14, amp: 15, arms: 3, plate: "#1b1a4e",
            rim: t.rim, arm: t.arm, core: t.core
          }));
        }
      }
      /* Only what this round can actually field: nineteen liveries is nineteen
         cached canvases with a shadowBlur apiece, and `build` runs on every
         reset and every resize. A level that meets four of them must not pay
         for the other fifteen — but a livery it shares with the last round is
         handed over as it is, and only the ones leaving the dish are freed. */
      var types = rosterTypes(), next = {};
      for (i = 0; i < types.length; i++) {
        k = types[i].key;
        next[k] = foeCv[k] || makeTop(types[i].r, types[i]);
        foeCv[k] = null;
      }
      for (k in foeCv) freeCanvas(foeCv[k]);
      foeCv = next;
    }

    /* --------------------------------------------------------------- helpers */
    // 0 at the start of a run, 1 once the difficulty ramp has peaked.
    function ramp() { return clamp(elapsed / CONFIG.rampSeconds, 0, 1); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    // How fast the top looks like it is spinning, in rad/s.
    function spinRate() { return 5 + spin * 26; }
    // Gap in px between the two shells: 0 is contact.
    function gapOf(f) {
      return Math.hypot(f.x - player.x, f.y - player.y) - CONFIG.playerR - f.type.r;
    }
    function tierOf(gap) {
      return gap <= CONFIG.gapPerfect ? 2 : gap <= CONFIG.gapGreat ? 1 : 0;
    }
    /* What the top can still hold: 1 at the start, worn down over the run. */
    function spinCap() {
      return 1 - CONFIG.wear * clamp(elapsed / CONFIG.wearSeconds, 0, 1);
    }
    /* Where the top sits in the colour ramp, as a float (0 = full, N-1 = dead).
       The curve is gamma'd: a healthy top stays in the cold end of the ramp and
       the warm half is reserved for a gauge that is genuinely running down —
       otherwise a run spends its whole life looking gold. */
    function tierPos() {
      var k = Math.pow(clamp(1 - spin, 0, 1), 1.5);
      return clamp(k * (SPIN_TIERS.length - 1), 0, SPIN_TIERS.length - 1);
    }
    // The matching glow, for the aura and the strike perimeter.
    function tierGlow() { return SPIN_TIERS[Math.round(tierPos())].glow; }
    /* The same colour, but mixed between the two neighbouring tiers exactly the
       way the top's two sprites are cross-faded. The gauge burns this one: half a
       tier of disagreement between the bar and the metal is instantly visible. */
    function tierMix() {
      var pos = tierPos(), lo = Math.floor(pos), t = pos - lo;
      return mixHex(SPIN_TIERS[lo].glow,
                    SPIN_TIERS[Math.min(lo + 1, SPIN_TIERS.length - 1)].glow, t);
    }
    function mixHex(a, b, t) {
      var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), i, ch = 0;
      for (i = 0; i < 3; i++) {
        var sh = i * 8, ca = (x >> sh) & 255, cb = (y >> sh) & 255;
        ch |= Math.round(ca + (cb - ca) * t) << sh;
      }
      return "#" + ("000000" + ch.toString(16)).slice(-6);
    }
    /* Every change of spin goes through here, so this is where the gauge is told
       something happened. The friction drain is a fraction of a percent per
       frame and must never strobe the bar, hence the threshold: only a scored
       gain or a real hit punches it. */
    function pushSpin(v) {
      spin = clamp(spin + v, 0, spinCap());
      if (Math.abs(v) >= 0.02) {
        gaugePunch = 1;
        gaugeCol = v > 0 ? tierMix() : "#ff2f6d";
      }
    }

    /* The ghost head trails the real value instead of snapping to it, and the
       band between the two is painted as "just won" (white) or "just lost" (red)
       for a few tenths of a second. Both speeds are well clear of the friction
       drain, so a quiet run shows no ghost at all. */
    function trackGauge(dt) {
      if (gaugePunch > 0) gaugePunch = Math.max(0, gaugePunch - dt * 3.2);
      // The crackle is re-rolled a few times a second, faster while it is being
      // discharged by a hit or a boost.
      sparkT -= dt;
      if (sparkT <= 0) { sparkT = gaugePunch > 0 ? 0.03 : 0.07; rollSparks(); }
      if (spinLag > spin) {
        spinLag = Math.max(spin, spinLag - dt * (0.45 + (spinLag - spin) * 3));
      } else if (spinLag < spin) {
        spinLag = Math.min(spin, spinLag + dt * (0.60 + (spin - spinLag) * 6));
      }
    }

    /* Fresh jitter for the head arc and the filament. Raw (-1..1) and pinned at
       both ends: the spatial envelope is applied at draw time, like the arena's
       own zaps. */
    function rollSparks() {
      var i;
      arcSeg.length = 0;
      for (i = 0; i <= 8; i++) arcSeg.push(Rand.range(-1, 1));
      arcSeg[0] = 0; arcSeg[8] = 0;
      boltSeg.length = 0;
      for (i = 0; i <= 16; i++) boltSeg.push(Rand.range(-1, 1));
      boltSeg[0] = 0; boltSeg[16] = 0;
    }

    function setSpinPill() {
      var pct = Math.round(spin * 100);
      if (pct === shownPct) return;
      shownPct = pct;
      HUD.setRight(pct + "%", "Spin", spin <= CONFIG.warnAt * spinCap() ? "warn" : "");
    }


    /* THE TRAILS ------------------------------------------------------------
       Every rival drags a line of its own colour across the dish and the line
       fades out behind it, so the six ways of moving are DRAWN rather than
       merely performed: a pulser leaves a string of straight dashes, a zigzag
       leaves a saw, a wanderer leaves a scribble, a charger and a bomb leave a
       straight line and a circler leaves a ring round the player. It is the
       clearest thing on the floor about what a colour is, and it is read
       without taking the eye off the gap.

       A track OUTLIVES its top: a dead rival's line drains away instead of
       blinking out, which is why the pool is module-level rather than a field
       on the foe — the foe is spliced, the line it drew is not.

       The line is SAMPLED IN PX, not on a clock: a point every TRACK_STEP of
       travel, so a slow green leaves a short stub and a charging red leaves the
       whole length of its run, which is the reading that matters. What bounds
       it is TRACK_LIFE — three and a half seconds, which is most of a ring for
       a circler and the whole of a charge for anything else: the point is to
       see where a top HAS BEEN, so the line has to outlast the manoeuvre it
       describes. TRACK_MAX is the ceiling that keeps a fast top from filling
       the array; at 24 px a point it almost never binds.

       Drawn in BANDS, not per segment. One stroke per point is ~250 strokes a
       frame with five tops in the dish; four bands of falling alpha over the
       same polyline is sixteen, and at this width the eye reads a gradient
       either way. */
    var TRACK_LIFE = 3.45;     // seconds a point of the line stays on the floor
    var TRACK_STEP = 24;       // px of travel between two points
    var TRACK_MAX = 78;        // points one line may hold
    var TRACK_BANDS = 4;

    /* `corner` forces a point in whatever the spacing: the turn of a zigzag is
       the one place the line must not be sampled past, or the saw rounds off. */
    function trackPush(f, corner) {
      var pts = f.track.pts, p = pts[pts.length - 1];
      // a box test, not a distance: this runs per top per frame
      if (!corner && p && Math.abs(f.x - p.x) < TRACK_STEP && Math.abs(f.y - p.y) < TRACK_STEP) return;
      pts.push({ x: f.x, y: f.y, a: 1 });
      if (pts.length > TRACK_MAX) pts.shift();
    }

    /* Every point fades at the same rate, so the oldest is always the head of
       the array and the drain is a shift from the front. A track whose top is
       gone and whose last point has faded is dropped. */
    function updateTracks(dt) {
      var i, j, t, pts, k = dt / TRACK_LIFE;
      for (i = tracks.length - 1; i >= 0; i--) {
        t = tracks[i]; pts = t.pts;
        for (j = 0; j < pts.length; j++) pts[j].a -= k;
        while (pts.length && pts[0].a <= 0) pts.shift();
        if (!pts.length && t.done) tracks.splice(i, 1);
      }
    }

    function drawTracks() {
      var i, j, b, t, pts, n, i0, i1, a;
      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (i = 0; i < tracks.length; i++) {
        t = tracks[i]; pts = t.pts; n = pts.length;
        if (n < 2) continue;
        for (b = 0; b < TRACK_BANDS; b++) {
          i0 = Math.floor((n - 1) * b / TRACK_BANDS);
          i1 = Math.min(n - 1, Math.ceil((n - 1) * (b + 1) / TRACK_BANDS));
          if (i1 <= i0) continue;
          a = pts[i1].a;                       // the band's own head
          // Well under half: the metal and the shockwaves are what the player
          // reads, and a floor that competes with them is a floor in the way.
          // `w` is the livery's own weight — the yellow's saw IS the reading of
          // that colour, so it is drawn heavier than the others.
          ctx.strokeStyle = rgba(t.col, Math.min(0.8, a * 0.42 * t.w));
          ctx.lineWidth = (2 + 4 * (b + 1) / TRACK_BANDS) * (0.6 + 0.4 * t.w);
          ctx.beginPath();
          ctx.moveTo(pts[i0].x, pts[i0].y);
          for (j = i0 + 1; j <= i1; j++) ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    /* ------------------------------------------------------- the arena wall
       The painted dish has no rim, and neither does the game: the boundary is
       an electric fence, and a fence is only ever SEEN at the instant it is
       struck. Every contact drops a `zap` on the side it happened on, which
       lights that whole board as a crackling line — white-hot at the impact,
       dying out toward the two corners — and fades in a few tenths of a second.
       Physics is unchanged: the box is still axis-aligned, the zaps are purely
       what the player is shown of it. */
    var SIDE_L = 0, SIDE_R = 1, SIDE_T = 2, SIDE_B = 3;
    var ZAP_SEGS = 26;             // vertices of one lightning polyline
    var ZAP_MERGE = 90;            // px within which a new hit re-lights the old one
    var ZAP_MIN = 100;             // px/s into the wall under which nothing lights up

    /* Fresh jitter for the polyline. The values are raw (-1..1) and unweighted:
       the spatial envelope is applied at draw time so the arc always stays
       anchored on the impact, even as the zap spreads and dies. */
    function zapRoll(z) {
      z.seg.length = 0;
      for (var i = 0; i <= ZAP_SEGS; i++) z.seg.push(Rand.range(-1, 1));
      z.seg[0] = 0; z.seg[ZAP_SEGS] = 0;          // pinned to the two corners
    }

    /* `power` is 0..1 — how hard the board was hit. `col` defaults to the
       BAND's own fence colour, which is the hue of the dish that band is
       painted in (CONFIG.bands): the fence belongs to the arena, not to
       whatever struck it, so a blue dish can only ever spark blue. Passing a
       colour is the exception, and the wreck is the only caller that does. */
    function zap(side, x, y, power, col) {
      col = col || BAND.wall;
      var horiz = side === SIDE_T || side === SIDE_B;
      var len = horiz ? arena.w : arena.h;
      var p = clamp((horiz ? x - arena.x : y - arena.y) / len, 0, 1);
      var i, z;
      // A top skidding along the board must re-light the same arc, not stack a
      // new polyline on top of it every frame.
      for (i = 0; i < zaps.length; i++) {
        z = zaps[i];
        if (z.side === side && Math.abs(z.p - p) * len < ZAP_MERGE) {
          z.t = 0; z.p = p; z.col = col;
          z.power = Math.max(z.power, power);
          zapRoll(z);
          return;
        }
      }
      z = { side: side, p: p, t: 0, life: 0.30 + 0.34 * power, power: power,
            col: col, crackle: 0, seg: [] };
      zapRoll(z);
      zaps.push(z);
    }

    function updateZaps(dt) {
      for (var i = zaps.length - 1; i >= 0; i--) {
        var z = zaps[i];
        z.t += dt;
        if (z.t >= z.life) { zaps.splice(i, 1); continue; }
        // The arc only crackles while it is young; the tail just fades out.
        z.crackle -= dt;
        if (z.crackle <= 0 && z.t < z.life * 0.55) { zapRoll(z); z.crackle = 0.045; }
      }
    }

    // The round opens with the fence powering up once, so the player is told
    // where the boards are before the first top ever reaches one.
    function zapAll(power, col) {
      zap(SIDE_T, arena.cx, arena.y, power, col);
      zap(SIDE_B, arena.cx, arena.y + arena.h, power, col);
      zap(SIDE_L, arena.x, arena.cy, power, col);
      zap(SIDE_R, arena.x + arena.w, arena.cy, power, col);
    }

    /* ----------------------------------------------------------------- foes */

    /* THE ROSTER ------------------------------------------------------------
       One string per round: `key:weight` pairs, where the key is a livery and a
       build — "g1" a small green, "r3" a large red (CONFIG.foeTypes). A level
       names one roster for the whole round; the playable and the endless run
       above level 30 have no level, so they walk CONFIG.endless on the CLOCK
       instead, which is the same climb with seconds in place of level numbers. */
    function parsePool(str) {
      var out = [], parts = str.split(" "), i, p, t, w;
      for (i = 0; i < parts.length; i++) {
        if (!parts[i]) continue;
        p = parts[i].split(":");
        t = CONFIG.foeTypes[p[0]];
        if (!t) continue;
        for (w = 0; w < (parseInt(p[1], 10) || 1); w++) out.push(t);
      }
      return out;
    }

    // The bag this frame draws from. Parsed once per step and cached on it.
    function spawnPool() {
      if (ROW) return POOL;
      var steps = CONFIG.endless, i, step = steps[0];
      for (i = 0; i < steps.length; i++) if (elapsed >= steps[i].from) step = steps[i];
      if (!step._pool) step._pool = parsePool(step.pool);
      return step._pool;
    }

    /* The distinct types a round can put in the dish, for `build` to bake a
       sprite apiece. A purple's children are pulled in even when no roster ever
       names them — a large purple leaves two smalls whatever the level said. */
    function rosterTypes() {
      var seen = {}, out = [], src = [], bag, i, j, t;
      if (ROW) src.push(ROW.pool);
      else for (i = 0; i < CONFIG.endless.length; i++) src.push(CONFIG.endless[i].pool);
      for (i = 0; i < src.length; i++) {
        bag = parsePool(src[i]);
        for (j = 0; j < bag.length; j++) {
          t = bag[j];
          while (t && !seen[t.key]) { seen[t.key] = 1; out.push(t); t = t.down; }
        }
      }
      if (ROW && ROW.boss && !seen[CONFIG.boss.key]) out.push(CONFIG.boss);
      return out;
    }

    function pickType() {
      var pool = spawnPool();
      return pool.length ? Rand.pick(pool) : CONFIG.foeTypes.gs;
    }

    /* One rival, from just outside the wall on a random angle, charging the
       middle. The entry point rides an ellipse matching the dish rather than a
       circle, so a rival never has to cross half the frame off-screen before the
       player can read it. */
    function spawn(t) {
      t = t || pickType();
      var a = Rand.range(0, TAU);
      var f = born(t,
        arena.cx + Math.cos(a) * (arena.w / 2 + t.r + 30),
        arena.cy + Math.sin(a) * (arena.h / 2 + t.r + 30));
      /* Every top enters with a real velocity, because from here on the arena
         is a physics box: walls, other tops and shockwaves all push back. */
      var sp = cruiseOf(t) * Rand.range(0.92, 1.08);
      var jitter = Rand.range(-0.18, 0.18);
      f.cruise = sp;
      f.vx = Math.cos(a + Math.PI + jitter) * sp;
      f.vy = Math.sin(a + Math.PI + jitter) * sp;
      /* A RED is never steered again, so the line it comes in on is the whole
         of its run: dead on the player, where the dish's middle is only near
         him. */
      if (t.move === "line") {
        var dx = player.x - f.x, dy = player.y - f.y, d = Math.hypot(dx, dy) || 1;
        f.vx = dx / d * sp; f.vy = dy / d * sp;
      }
      return f;
    }

    /* A fresh top of type `t` at a point. Split off `spawn` because a purple's
       children and the boss are placed rather than flown in. */
    function born(t, x, y) {
      var f = {
        type: t, x: x, y: y,
        ang: Rand.range(0, TAU), vr: Rand.pick([-1, 1]) * Rand.range(7, 12),
        vx: 0, vy: 0, born: 0, age: 0, inside: false, cruise: cruiseOf(t),
        hp: t.hp, hpMax: t.hp, flash: 0, mend: 0, shrug: 0, healT: 0,
        dead: false, starve: 0, shot: false,
        /* the state its own way of moving needs (see `steer`): the beat of a
           pulser and the line it will dash along, the side a zigzag is running
           to and how far off its line it already is, the heading and clock of
           a wanderer, and which way round a circler turns. */
        pulse: "dash", pulseT: 0, aimX: 0, aimY: 0,
        zigSide: Rand.pick([-1, 1]), zigOff: 0, zigUx: 0, zigUy: 0, corner: false,
        wanderA: Rand.range(0, TAU), wanderT: 0, cw: Rand.pick([-1, 1])
      };
      f.track = { col: t.rim[0], pts: [], last: 0, w: t.trail || 1 };
      tracks.push(f.track);
      foes.push(f);
      return f;
    }

    // A livery's own speed on top of its build's — "slow" and "fast" are the
    // same table entry as the colour (CONFIG.foeColours, speedK).
    function cruiseOf(t) {
      return t.speed * (t.speedK == null ? 1 : t.speedK) * (1 + 0.45 * ramp());
    }

    /* The boss stands in the middle of the dish from the first second of the
       levels that ask for it, already inside the boards, so the player meets it
       before the roster has had time to crowd around it. */
    function spawnBoss() {
      var t = CONFIG.boss;
      var f = born(t, arena.cx, arena.y + arena.h * 0.28);
      f.inside = true;
      f.vx = Rand.pick([-1, 1]) * t.speed; f.vy = t.speed * 0.4;
      Sound.clip("warn", 0.8, 0.62);            // the alarm, an octave down
      Fx.ring(f.x, f.y, { from: t.r * 0.5, to: t.r * 4, color: "#ffffff",
        width: 8, life: 0.5 });
      Overlay.vignette("rgba(255,212,59,.75)", 0.9, 900);
      Pop.show("danger", { word: Lang.t("Boss top"), sub: Lang.t("Perfect taps only"),
        hold: 1400, at: farSpot() });
      return f;
    }

    /* HOW A TOP MOVES ------------------------------------------------------
       One way per livery, and it is the half of a colour the player watches
       (the immunity is the half they work out). Two families:

         STEERED  the charger and the wanderer return a unit HEADING and `steer`
                  accelerates toward it, dragging the excess off, so a knock
                  sends them off course and they have to come round again;
         DRAWN    the pulser, the zigzag and the circler hold a SHAPE the player
                  has to read — a stop and a dash, a saw, a ring — so their
                  velocity is snapped onto the shape instead of eased toward
                  it. An answered one flies `recover` seconds on what it was
                  handed first, or a shockwave would be undone a frame later.

       And one that is neither: the RED is never steered at all. */
    function heading(f, dt) {
      var dx = player.x - f.x, dy = player.y - f.y, d = Math.hypot(dx, dy) || 1;
      var ux = dx / d, uy = dy / d;
      if (f.type.move === "drift") {
        // a new heading every second or so, a quarter of it pulled toward the
        // top: a wanderer that never came round would never be answered.
        f.wanderT -= dt;
        if (f.wanderT <= 0) {
          f.wanderT = Rand.range(0.7, 1.4);
          f.wanderA = Rand.range(0, TAU);
        }
        return pullIn(f, unit(Math.cos(f.wanderA) * 0.75 + ux * 0.25,
                              Math.sin(f.wanderA) * 0.75 + uy * 0.25), ux, uy);
      }
      return { x: ux, y: uy };                   // "chase" — green, and the boss
    }

    function unit(x, y) {
      var d = Math.hypot(x, y) || 1;
      return { x: x / d, y: y / d };
    }

    /* The patience rule applied: the livery's own heading, bent toward the top
       by however long it has been unreachable. At full pull the player's
       direction is worth twice the heading, which is a charge with a memory of
       where it was going rather than a switch being thrown. */
    function pullIn(f, h, ux, uy) {
      var k = clamp((f.starve - CONFIG.patience) / CONFIG.patienceRamp, 0, 1);
      if (k <= 0) return h;
      return unit(h.x + ux * k * 2, h.y + uy * k * 2);
    }

    /* `starve` is the clock since the top was last ANSWERED — repelled, or its
       charge landed — and it runs here, for every livery, every frame. */
    function steer(f, dt) {
      var m = f.type.move, v, k;
      f.starve += dt;
      f.cruise = cruiseOf(f.type);               // the ramp moves under it
      if (m === "line") return;                  // the red: the line it was given
      if (m === "pulse") { pulse(f, dt); return; }
      if (m === "zigzag" || m === "circle") {
        if (f.starve < CONFIG.recover) { drag(f, dt); return; }
        v = m === "zigzag" ? zigzag(f, dt) : circle(f);
        k = Math.min(1, (m === "zigzag" ? CONFIG.zigSteer : CONFIG.circleSteer) * dt);
        f.vx += (v.x - f.vx) * k; f.vy += (v.y - f.vy) * k;
        return;
      }
      var h = heading(f, dt);
      f.vx += h.x * f.cruise * CONFIG.foeAccel * dt;
      f.vy += h.y * f.cruise * CONFIG.foeAccel * dt;
      drag(f, dt);
    }

    /* Not a hard clamp: speed borrowed in a collision bleeds off over a beat,
       so a top that has just been slammed keeps flying before it recovers. */
    function drag(f, dt) {
      if (Math.hypot(f.vx, f.vy) > f.cruise) {
        var k = 1 - Math.min(0.9, CONFIG.foeDrag * dt);
        f.vx *= k; f.vy *= k;
      }
    }

    /* BLUE — two beats. HOLD: stopped dead, aiming at the player the whole
       time (the line drawn in `render` is that aim, at the length of the run),
       while a ring closes on it. DASH: the aim at the instant the ring meets
       the rim, at pulseBoost times its cruise, for pulseDash seconds. It flies
       in from the wall on its first dash and starts charging once inside. */
    function pulse(f, dt) {
      if (f.pulse === "hold") {
        var dx = player.x - f.x, dy = player.y - f.y, d = Math.hypot(dx, dy) || 1;
        f.aimX = dx / d; f.aimY = dy / d;
        if (f.starve < CONFIG.recover) drag(f, dt);
        else {
          var k = Math.max(0, 1 - CONFIG.pulseBrake * dt);
          f.vx *= k; f.vy *= k;
        }
        f.pulseT -= dt;
        if (f.pulseT <= 0 && f.inside) dash(f);
        return;
      }
      f.pulseT -= dt;
      if (f.pulseT <= 0 && f.inside) holdPulse(f, CONFIG.pulseHold);
    }

    function holdPulse(f, t) { f.pulse = "hold"; f.pulseT = t; }

    function dash(f) {
      var sp = f.cruise * CONFIG.pulseBoost, r = f.type.r;
      f.pulse = "dash"; f.pulseT = CONFIG.pulseDash;
      f.vx = f.aimX * sp; f.vy = f.aimY * sp;
      f.vr = (f.vr > 0 ? 1 : -1) * 22;
      if (phase !== "spin") return;
      Fx.ring(f.x, f.y, { from: r * 0.8, to: r * 2.6, color: f.type.rim[0],
        width: 6, life: 0.26 });
      Fx.burst(f.x - f.aimX * r, f.y - f.aimY * r, { color: [f.type.rim[0], "#ffffff"],
        count: 8, speed: 300, size: 5, life: 0.3 });
      Sound.clip("bump", 0.32, 0.62);           // the release, a fifth down
    }

    /* YELLOW — a TRIANGLE wave at the player: a straight run zigAngle off the
       line to him, held until it is zigAmp (+ its radius) off that line, then
       the same run mirrored. `zigOff` is how far off the line it is, so the
       first run is half a swing and the saw is centred on the line.
       The line is taken at each CORNER and held for the whole run, never
       re-aimed on the way: re-aimed every frame, a run bends as the angle to
       the player turns, and the saw on the floor reads as a scribble. */
    function zigzag(f, dt) {
      var c = Math.cos(CONFIG.zigAngle), sn = Math.sin(CONFIG.zigAngle);
      var amp = CONFIG.zigAmp + f.type.r;
      if (!f.zigUx && !f.zigUy) zigAim(f);
      var ux = f.zigUx, uy = f.zigUy;            // forward, and (-uy, ux) its left
      f.zigOff += f.zigSide * f.cruise * sn * dt;
      if (f.zigSide * f.zigOff >= amp) {
        f.zigOff = f.zigSide * amp;
        zigAim(f);                               // before the flip: off the old line
        f.zigSide = -f.zigSide;
        f.corner = true;                         // pin the turn on the floor
      }
      return { x: (ux * c - uy * sn * f.zigSide) * f.cruise,
               y: (uy * c + ux * sn * f.zigSide) * f.cruise };
    }

    /* The new line is aimed from the saw's CENTRE, not from the corner the top
       stands on — the corner is zigOff off the old line, and a line drawn
       through it would push the whole saw off to that side. */
    function zigAim(f) {
      var cx = f.x + f.zigUy * f.zigOff, cy = f.y - f.zigUx * f.zigOff;
      var dx = player.x - cx, dy = player.y - cy, d = Math.hypot(dx, dy) || 1;
      f.zigUx = dx / d; f.zigUy = dy / d;
    }

    /* BLACK — a ring round the player at a fixed gap, inside the reach. Far
       off it spirals in; on the ring it only turns; pushed inside it backs out.
       It never takes a step toward the hit. */
    function circle(f) {
      var dx = f.x - player.x, dy = f.y - player.y, d = Math.hypot(dx, dy) || 1;
      var ox = dx / d, oy = dy / d;              // out from the player
      var want = CONFIG.playerR + f.type.r + CONFIG.reach * CONFIG.circleGap;
      var err = clamp((want - d) / 60, -1.5, 1.5);
      var h = unit(-oy * f.cw + ox * err, ox * f.cw + oy * err);
      return { x: h.x * f.cruise, y: h.y * f.cruise };
    }

    /* The dish walls. Everything bounces on them — that is where the chaos in
       the arena comes from. Corners are cosmetic, the box is axis-aligned.
       A hit above chipSpeed is a SLAM and costs a shell point; anything slower
       is a free graze, so a top cruising along the rim never chips itself to
       death on its own. A BLUE top is never marked here at all, and a RED one
       blows up here at any speed. */
    function walls(f) {
      var r = f.type.r, sp = Math.hypot(f.vx, f.vy), hit = false;
      var slam = sp > CONFIG.chipSpeed;
      var e = slam ? CONFIG.slamBounce : CONFIG.foeWallBounce;
      var vnx = Math.abs(f.vx), vny = Math.abs(f.vy);   // speed INTO the board
      var sx = -1, sy = -1;
      if (f.x < arena.x + r)           { f.x = arena.x + r;           f.vx =  vnx * e; sx = SIDE_L; }
      if (f.x > arena.x + arena.w - r) { f.x = arena.x + arena.w - r; f.vx = -vnx * e; sx = SIDE_R; }
      if (f.y < arena.y + r)           { f.y = arena.y + r;           f.vy =  vny * e; sy = SIDE_T; }
      if (f.y > arena.y + arena.h - r) { f.y = arena.y + arena.h - r; f.vy = -vny * e; sy = SIDE_B; }
      hit = sx >= 0 || sy >= 0;
      if (!hit) return;
      // A top skimming the board barely tickles it; one thrown into it at
      // knockback speed lights the whole length up. The fence burns the BAND's
      // colour whatever struck it — it is the dish, not the visitor.
      if (sx >= 0 && vnx > ZAP_MIN) zap(sx, f.x, f.y, clamp(vnx / 900, 0.1, 1));
      if (sy >= 0 && vny > ZAP_MIN) zap(sy, f.x, f.y, clamp(vny / 900, 0.1, 1));
      if (f.type.blastR) { blast(f); return; }
      if (!slam) { clank(f.x, f.y, sp, 0.7); return; }
      Sound.clip("bump", 0.5, 0.8);
      dmg(f, "wall");
    }

    /* EVERY SHELL POINT GOES THROUGH HERE, AND SO DOES EVERY IMMUNITY --------
       `src` is what dealt it: "shock" the player's shockwave, "perfect" the same
       wave fired dead on the impact, "wall" a slam into the fence, "foe" a top
       thrown into another. A livery IS an immunity (see CONFIG.foeColours), so
       this is the one place the six colours differ at all.
       A blow that lands on an immunity is NOT silence: `shrug` says so, because
       a player who cannot tell "immune" from "I missed" learns nothing. */
    function dmg(f, src) {
      if (f.dead) return false;
      var t = f.type, n = src === "perfect" ? CONFIG.perfectDmg : 1;
      if (t.perfectOnly) {
        // the boss: one point, and only for a tap landed dead on the impact
        if (src !== "perfect") { shrug(f); return false; }
        n = 1;
      } else if ((t.wallProof && src === "wall") ||
                 (t.foeProof  && src === "foe")  ||
                 (t.wallOnly  && src !== "wall")) {
        shrug(f);
        return false;
      }
      return hurt(f, n);
    }

    /* A blow a livery does not answer to. One ring in the shell's own colour,
       throttled per top, so a red top skidding along a board does not strobe. */
    function shrug(f) {
      if (f.shrug > 0 || phase !== "spin") return;
      f.shrug = 0.3;
      Fx.ring(f.x, f.y, { from: f.type.r * 0.9, to: f.type.r * 1.7,
        color: "#ffffff", width: 4, life: 0.26 });
      Fx.burst(f.x, f.y, { color: ["#ffffff", f.type.rim[0]], count: 5,
        speed: 180, size: 4, life: 0.24 });
    }

    /* `n` shell points. Above zero the top keeps flying — it ricochets, comes
       back around and has to be answered again; on its last point it blows up
       where it was hit. Returns true when it died. */
    function hurt(f, n) {
      f.hp -= (n || 1);
      f.flash = 0.16;
      Fx.burst(f.x, f.y, { color: [f.type.rim[0], "#ffffff"], count: 8,
        speed: 320, size: 5, life: 0.32 });
      if (f.hp > 0) return false;
      f.hp = 0;
      if (f.type.blastR) blast(f); else explode(f);
      return true;
    }

    function explode(f) {
      var col = f.type.rim[0];
      f.dead = true;
      Fx.burst(f.x, f.y, { color: [col, "#ffffff", f.type.arm], count: 22,
        speed: 580, size: 6, life: 0.5, grav: 120 });
      Fx.ring(f.x, f.y, { from: f.type.r * 0.6, to: f.type.r * 3.4, color: col,
        width: 6, life: 0.32 });
      Fx.shake(f.type.perfectOnly ? 16 : 6, f.type.perfectOnly ? 0.4 : 0.16);
      Sound.clip("crash", f.type.perfectOnly ? 0.8 : 0.42, f.type.perfectOnly ? 0.7 : 1.35);
      payKo(f);
      split(f);
    }

    // Killing a rival outright pays on top of the shockwaves that got it there.
    function payKo(f) {
      var col = f.type.rim[0];
      if (phase === "spin") {
        var ko = f.type.score * CONFIG.koScore;
        score += ko; HUD.setScore(score);
        Pop.text(clamp(f.x, Layout.left + 90, Layout.right - 90 - GAUGE_BAND),
          f.y - f.type.r, Lang.t("KO +") + ko, { color: col, size: 22, life: 0.6, tier: 1 });
        if (f.type.perfectOnly) {
          Sound.clip("chain", 0.9, 0.86);
          Pop.show("ultra", { word: Lang.t("Boss down!"), sub: "+" + ko, at: farSpot() });
        }
      }
    }

    /* A RED blows up on the first thing it touches, and the blast is a ring of
       blastR the player SEES (`drawBlasts`): every rival under it is thrown out
       and loses a shell point — a yellow and the boss shrug the point off as
       they shrug off any top, and another red under it goes up in turn. It only
       PAYS when the player sent it — a red that ran into a board on its own
       line, or into the player, is a red gone and nothing more; a blast it sets
       off keeps the credit of the one that set it off. */
    function blast(f) {
      if (f.dead) return;
      var R = f.type.blastR, n = foes.length, i, o, dx, dy, d, k;
      f.dead = true;
      boom(f.x, f.y, R, f.type.rim[0]);
      if (f.shot) payKo(f);
      for (i = 0; i < n; i++) {
        o = foes[i];
        if (o === f || o.dead || !o.inside) continue;
        dx = o.x - f.x; dy = o.y - f.y;
        d = Math.hypot(dx, dy) || 1;
        if (d - o.type.r > R) continue;
        k = 1 - 0.5 * clamp((d - o.type.r) / R, 0, 1);   // harder at the heart
        o.vx = dx / d * CONFIG.blastPush * k; o.vy = dy / d * CONFIG.blastPush * k;
        o.starve = 0;                    // thrown: it flies before it steers
        if (o.type.blastR) { o.shot = o.shot || f.shot; blast(o); }
        else dmg(o, "foe");
      }
    }

    /* THE BLAST, AS THE PLAYER SEES IT — the loudest thing in the game, and
       built in layers that each land on their own beat (`drawBlasts`):
       a hit-stop and a white frame on the instant, a core gone white-hot,
       a dozen rays thrown out of it, a fireball that swells and burns down
       through yellow and orange, the shock ring racing out to blastR with a
       second one behind it, sparks and embers that fall, the fence lit
       wherever the ring reaches a board — and a scorch left on the floor
       that cools for a couple of seconds after everything else has gone.
       A large red is the same blast scaled by its radius. */
    function boom(x, y, R, col) {
      var big = R / CONFIG.blastR[CONFIG.blastR.length - 1], rays = [], i;
      for (i = 0; i < 12; i++)
        rays.push({ a: i / 12 * TAU + Rand.range(-0.2, 0.2),
                    len: Rand.range(0.75, 1.25), w: Rand.range(0.05, 0.09) });
      blasts.push({ x: x, y: y, r: R, t: 0, life: 0.75, col: col, rays: rays });
      var cracks = [];
      for (i = 0; i < 7; i++) cracks.push({ a: Rand.range(0, TAU), len: Rand.range(0.4, 0.7) });
      scorches.push({ x: x, y: y, r: R, t: 0, life: 2.8, cracks: cracks });
      Fx.burst(x, y, { color: ["#ffffff", "#fff3b0", "#ffd43b", "#ff7a3d"], count: 44,
        speed: 980 * (0.7 + 0.3 * big), size: 6, life: 0.55 });
      Fx.burst(x, y, { color: ["#ff7a3d", col, "#ffb000", "#3a1208"], count: 22,
        speed: 420, size: 9, life: 1.15, grav: 320 });
      Fx.ring(x, y, { from: R * 0.9, to: R * 1.45, color: "#ffffff", width: 3, life: 0.6 });
      // the fence answers wherever the ring reaches a board
      if (x - R < arena.x)           zap(SIDE_L, x, y, 1, "#ffb000");
      if (x + R > arena.x + arena.w) zap(SIDE_R, x, y, 1, "#ffb000");
      if (y - R < arena.y)           zap(SIDE_T, x, y, 1, "#ffb000");
      if (y + R > arena.y + arena.h) zap(SIDE_B, x, y, 1, "#ffb000");
      Fx.shake(14 + 10 * big, 0.45);
      Fx.flash("#fff1c4", 0.55, 2.4);
      if (phase === "spin") {
        Fx.freeze(0.07);
        Overlay.vignette("rgba(255,110,40,.85)", 1, 460);
      }
      Sound.clip("crash", 0.95, 0.6);
      Sound.clip("shock", 0.8, 0.55);
      Sound.clip("bump", 0.6, 0.45);
    }

    /* A PURPLE does not die quietly: it leaves two of the build below it,
       thrown apart along the axis it was travelling on, so one large purple is
       two smalls — three tops out of one spawn. */
    function split(f) {
      var t = f.type, i, c, a, sp, k;
      if (!t.splits || !t.down) return;
      a = Math.atan2(f.vy, f.vx) + Math.PI / 2;
      sp = Math.max(260, Math.hypot(f.vx, f.vy) * 0.55);
      for (i = 0; i < 2; i++) {
        k = i ? 1 : -1;
        c = born(t.down,
          clamp(f.x + Math.cos(a) * k * t.down.r * 1.2, arena.x + t.down.r, arena.x + arena.w - t.down.r),
          clamp(f.y + Math.sin(a) * k * t.down.r * 1.2, arena.y + t.down.r, arena.y + arena.h - t.down.r));
        c.inside = true;
        c.cruise = t.down.speed * (1 + 0.45 * ramp());
        c.vx = Math.cos(a) * k * sp; c.vy = Math.sin(a) * k * sp;
        c.born = 0.22;                 // no fade-in: they are already in the fight
      }
      Fx.ring(f.x, f.y, { from: t.r * 0.4, to: t.r * 2.6, color: t.rim[0],
        width: 5, life: 0.3 });
      Sound.clip("chain", 0.5, 1.45);
    }

    /* A BLACK top hands a shell point back to every rival it touches, up to
       that rival's own maximum, on a cooldown of its own so a pile-up cannot be
       healed six times in a frame. It never mends another black, and never
       itself: answer it first, or answer the dish twice. */
    function mend(src, f) {
      if (src.healT > 0 || f.dead || f.type.heals) return;
      // ...and never the BOSS: ten points nothing but a perfect tap can take,
      // being handed one back, is a top with no answer at all.
      if (f.type.perfectOnly || f.hp >= f.hpMax) return;
      src.healT = CONFIG.healEvery;
      f.hp++;
      f.mend = 0.4;
      Fx.ring(f.x, f.y, { from: f.type.r * 0.6, to: f.type.r * 1.9,
        color: src.type.core, width: 4, life: 0.34 });
      Fx.burst(f.x, f.y, { color: [src.type.core, "#ffffff"], count: 7,
        speed: 220, size: 4, life: 0.4 });
      Sound.clip("perfect", 0.3, 0.58);         // the chime, low: it is not yours
      if (phase === "spin")
        Pop.text(clamp(f.x, Layout.left + 90, Layout.right - 90 - GAUGE_BAND),
          f.y - f.type.r, "+1", { color: src.type.core, size: 22, life: 0.6, tier: 1 });
    }

    function insideArena(f) {
      var r = f.type.r;
      return f.x > arena.x + r && f.x < arena.x + arena.w - r &&
             f.y > arena.y + r && f.y < arena.y + arena.h - r;
    }

    /* Metal on metal, throttled: a chaotic dish can produce half a dozen
       contacts in the same frame, and one clip per contact is noise, not juice. */
    function clank(x, y, speed, vol) {
      if (bumpT > 0) return;
      bumpT = 0.06;
      var k = clamp(speed / 900, 0.15, 1);
      Sound.clip("bump", (vol == null ? 1 : vol) * (0.16 + k * 0.32), Rand.range(0.9, 1.3));
      Fx.burst(x, y, { color: ["#ffffff", "#bff6ff"], count: 3 + Math.round(k * 4),
        speed: 150 + k * 240, size: 4, life: 0.26 });
    }

    /* A collision may never make a top faster than it already was, and never
       push a cruising one past foeLiveMax: a pile-up must not shoot a rival
       through the strike band before the player could possibly answer it. A top
       launched by a shockwave keeps the speed the wave gave it — that energy is
       the player's, not the pile-up's. `before` is its speed on impact. */
    function capSpeed(f, before) {
      var max = Math.min(Math.max(CONFIG.foeLiveMax, before), CONFIG.foeMaxSpeed);
      var sp = Math.hypot(f.vx, f.vy);
      if (sp > max) { f.vx = f.vx / sp * max; f.vy = f.vy / sp * max; }
    }

    /* Top on top: an elastic bounce with a little extra kick (foeBounce > 1),
       so rivals deflect each other into trajectories nobody aimed for and a
       wreck flying out scatters the pack it passes through.
       AND IT IS A WEAPON. A contact closing faster than foeHitSpeed costs BOTH
       tops a shell point — which is what a shockwave fired into a crowd is
       really doing, and why a yellow top, which no other top can mark, is the
       one livery a crowd does not solve. A black top mends instead: a contact
       at any speed hands the other one a point back. */
    function foeCollisions() {
      var i, j, a, b, dx, dy, d, min, nx, ny, ma, mb, tm, rv, imp, push, spa, spb;
      for (i = 0; i < foes.length; i++) {
        a = foes[i];
        if (a.dead) continue;
        for (j = i + 1; j < foes.length; j++) {
          b = foes[j];
          if (b.dead) continue;
          dx = b.x - a.x; dy = b.y - a.y;
          min = a.type.r + b.type.r;
          if (dx > min || dx < -min || dy > min || dy < -min) continue;   // cheap reject
          d = Math.hypot(dx, dy);
          if (d >= min || d < 0.001) continue;
          nx = dx / d; ny = dy / d;
          ma = a.type.r * a.type.r; mb = b.type.r * b.type.r; tm = ma + mb;
          push = min - d;                          // separate, the lighter one moving more
          a.x -= nx * push * (mb / tm); a.y -= ny * push * (mb / tm);
          b.x += nx * push * (ma / tm); b.y += ny * push * (ma / tm);
          if (a.type.heals) mend(a, b);
          if (b.type.heals) mend(b, a);
          // a red goes up on contact, at any speed: the blast does the rest
          if ((a.type.blastR && a.inside) || (b.type.blastR && b.inside)) {
            if (a.type.blastR && a.inside) blast(a);
            if (b.type.blastR && b.inside) blast(b);
            if (a.dead) break;
            continue;
          }
          rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv > 0) continue;                    // already separating
          spa = Math.hypot(a.vx, a.vy); spb = Math.hypot(b.vx, b.vy);
          imp = -(1 + CONFIG.foeBounce) * rv / (1 / ma + 1 / mb);
          a.vx -= imp * nx / ma; a.vy -= imp * ny / ma;
          b.vx += imp * nx / mb; b.vy += imp * ny / mb;
          capSpeed(a, spa); capSpeed(b, spb);
          a.vr *= 1.15; b.vr *= 1.15;              // the hit spins them up too
          clank((a.x + b.x) / 2, (a.y + b.y) / 2, -rv, 1);
          if (-rv > CONFIG.foeHitSpeed) { dmg(a, "foe"); dmg(b, "foe"); }
        }
      }
    }

    function offFrame(f) {
      return f.x < -160 || f.x > view.w + 160 || f.y < -160 || f.y > view.h + 160;
    }

    /* The dead, dropped in one pass. Every death sets `dead` rather than
       splicing where it happened: a shockwave kills several tops at once, a
       pile-up kills two, and a purple ADDS two to the same array while it dies
       — splicing mid-iteration through any of that is how an entry gets
       skipped. */
    function sweepFoes() {
      for (var i = foes.length - 1; i >= 0; i--) {
        if (!foes[i].dead) continue;
        foes[i].track.done = true;           // the line drains on its own now
        foes.splice(i, 1);
      }
    }

    /* Only the tops still in play count against the spawn cap, and the BOSS
       never does: it stands in the dish for the whole round, and letting it eat
       a slot would empty the arena around it — which is the opposite of what a
       boss round should feel like. */
    function liveFoes() {
      var n = 0, f;
      for (var i = 0; i < foes.length; i++) {
        f = foes[i];
        if (!f.dead && !f.type.perfectOnly) n++;
      }
      return n;
    }

    // How crowded this round is allowed to get: the level's own line, or the
    // base for a playable and the endless run.
    function maxFoes() { return ROW ? ROW.max : CONFIG.maxFoes; }

    /* ------------------------------------------------------------ the round */
    function reset() {
      score = 0; combo = 0; bestCombo = 0; shocks = 0; perfects = 0; crashes = 0;
      bestWave = 0;
      spin = CONFIG.spinStart; spinAngle = 0; elapsed = 0; cooldown = 0;
      spinLag = CONFIG.spinStart; gaugePunch = 0; gaugeCol = "#7ef4ff"; gaugeT = 0;
      sparkT = 0; rollSparks();
      shownPct = -1; warnArmed = true; lowSpin = false; wornSaid = false;
      phase = "spin"; phaseT = 0; wreckStep = 0;
      spawnT = 0.9;
      foes = []; waves = []; zaps = []; shards = []; tracks = []; blasts = []; scorches = [];
      /* The band comes first: buildFloor() paints the dish out of it and the
         fence burns its colour, and the scene the END SCREEN wears is the one
         just played. `applyLevel` has already fixed BAND and ROW when there is
         a level; without one they are the first band and no row at all. */
      POOL = ROW ? parsePool(ROW.pool) : null;
      Art.backdrop(BAND.scene);
      build();
      player = { x: arena.cx, y: arena.cy, vx: 0, vy: 0, wob: 0 };
      if (ROW && ROW.boss) spawnBoss();
      zapAll(0.5);                       // the fence powers up, then goes dark
      HUD.setScoreNow(0);
      HUD.setLeft(Store.get("bestScore", 0), "Best");
      setSpinPill();
      Fx.reset();
      /* THE BED. The band of the climb the level sits in names the stretch of
         the track the round rides, so replaying a level never restarts the
         music and crossing into the next band does. A playable has no level and
         only the first band's window embedded, so `null` — the whole of what
         this build ships — is the right section there (docs/MUSIC.md). */
      Music.play(CONFIG.level ? BAND.music : null);
    }

    function onResize() {
      if (!player) return;
      build();
      player.x = clamp(player.x, arena.x + CONFIG.playerR, arena.x + arena.w - CONFIG.playerR);
      player.y = clamp(player.y, arena.y + CONFIG.playerR, arena.y + arena.h - CONFIG.playerR);
    }

    /* ---------------------------------------------------------------- input */
    function onDown() {
      if (phase !== "spin" || cooldown > 0) return;
      cooldown = CONFIG.tapCooldown;

      // Everything the wave can reach, and the closest one sets the tier.
      var hit = [], best = 1e9, lead = null, i, f, gap;
      for (i = 0; i < foes.length; i++) {
        f = foes[i];
        if (f.dead) continue;
        gap = gapOf(f);
        if (gap > CONFIG.reach) continue;
        hit.push(f);
        if (gap < best) { best = gap; lead = f; }
      }
      if (!hit.length) return whiff();

      var tier = tierOf(best), mult = CONFIG.tierMult[tier];
      var gained = 0, boost = CONFIG.boost[tier];
      shocks++; combo++;
      if (tier === 2) perfects++;
      if (combo > bestCombo) bestCombo = combo;
      if (hit.length > bestWave) bestWave = hit.length;

      /* The SCORE rides the wave's own tier, which is the closest top: a chain
         is paid at what the tap was worth. The DAMAGE is per top, on its own
         gap — a wave that catches three tops is only PERFECT on the one it was
         actually aimed at, and the other two take the single point a shockwave
         takes. */
      for (i = 0; i < hit.length; i++) {
        gained += Math.round(hit[i].type.score * mult * comboMult());
        repel(hit[i], tierOf(gapOf(hit[i])));
        if (i > 0) boost += CONFIG.multiBoost;
      }
      sweepFoes();                       // a wave can empty half the dish
      score += gained;
      pushSpin(boost);
      HUD.setScore(score);
      HUD.punch(tier === 2 ? "#ffd43b" : "#7ef4ff");

      waves.push({ x: player.x, y: player.y, t: 0, life: 0.34, tier: tier });
      // The wave shoves the top back too, away from what it just repelled.
      var dx = player.x - lead.x, dy = player.y - lead.y, d = Math.hypot(dx, dy) || 1;
      player.vx += dx / d * CONFIG.recoil; player.vy += dy / d * CONFIG.recoil;

      Fx.ring(player.x, player.y, { from: CONFIG.playerR * 0.8,
        to: CONFIG.playerR + CONFIG.reach + 60,
        color: tier === 2 ? "#ffd43b" : tierGlow(), width: 9, life: 0.34 });
      Fx.shake(6 + tier * 5, 0.2);
      if (tier === 2) Fx.flash("#bff6ff", 0.22, 3.4);
      Sound.clip("shock", 0.75, 1 + tier * 0.12 + Math.min(combo, 12) * 0.02);
      if (tier === 2) Sound.clip("perfect", 0.55, 1.06);

      /* The callout is pushed OUT past the edge of the shockwave, on the line
         between the top and what it just blasted: it still reads as belonging to
         that impact, and it can never sit on top of the player's own top — which
         is the one thing on screen that must stay readable. */
      var spot = popSpot(lead);
      Pop.show("score", {
        word: "+" + gained, sub: CONFIG.tierName[tier],
        at: spot, cls: "pop-t" + tier
      });
      if (hit.length > 1) {
        Pop.show("bonus", {
          word: (hit.length > 2 ? Lang.t("Triple") : Lang.t("Double")) + Lang.t(" shock"),
          sub: "+" + Math.round(boost * 100) + Lang.t("% spin"), at: farSpot(spot.y)
        });
        Sound.clip("chain", 0.6, 1.12);
      }
      if (combo > 0 && combo % CONFIG.comboEvery === 0) comboBeat();
    }

    /* WHERE A CALLOUT MAY LAND ----------------------------------------------
       The top is the one thing on screen the player is actually reading — the
       gap to the next rival is judged on its shell, by eye — so no callout is
       ever allowed to sit on it. A callout is a wide, short block, so what
       decides overlap is the BAND it occupies, not its column: every placement
       below picks a row and keeps `POP_CLEAR` of vertical air from the top. */
    var POP_ROWS = [0.10, 0.26, 0.66, 0.85];   // the Pop grid, minus eye level
    var POP_CLEAR = 210;                       // px of vertical air the top needs

    /* The row furthest from the top, centred. `avoidY` keeps a second callout
       fired on the same frame out of the first one's band. */
    function farSpot(avoidY) {
      var bestY = Layout.cy, bestD = -1, i, y, d;
      for (i = 0; i < POP_ROWS.length; i++) {
        y = Layout.top + POP_ROWS[i] * Layout.h;
        d = Math.abs(y - player.y);
        if (avoidY != null) d = Math.min(d, Math.abs(y - avoidY) * 0.8);
        if (d > bestD) { bestD = d; bestY = y; }
      }
      // Centred on the DISH, not on the frame: the gauge owns the right band.
      return { x: arena.cx, y: bestY };
    }

    /* A point just outside the strike zone, in the direction of `f`, kept inside
       the play area so a callout never lands under the HUD or the CTA bar. */
    function popSpot(f) {
      var dx = f.x - player.x, dy = f.y - player.y, d = Math.hypot(dx, dy) || 1;
      var out = CONFIG.playerR + CONFIG.reach + 100;
      var p = {
        x: clamp(player.x + dx / d * out, Layout.left + 130,
                 Layout.right - 130 - GAUGE_BAND),
        y: clamp(player.y + dy / d * out, Layout.top + 120, Layout.bottom - 120)
      };
      // The clamp drags the callout straight back onto the top whenever the top
      // is already hugging an edge: there the direction is worth nothing, and
      // the furthest band wins instead.
      if (Math.abs(p.y - player.y) < POP_CLEAR) return farSpot();
      return p;
    }

    // The chain bonus tops out: past the cap a long chain is its own reward, and
    // the score stays a number a player can read.
    function comboMult() { return 1 + Math.min(combo, CONFIG.comboCap) * 0.12; }

    function comboBeat() {
      var bonus = Math.min(combo, CONFIG.comboCap) * 15;
      score += bonus; HUD.setScore(score);
      pushSpin(CONFIG.comboSpin);
      Pop.show(combo >= 25 ? "ultra" : "combo", {
        word: Lang.t("Combo x") + combo, sub: "+" + bonus, at: farSpot()
      });
      Sound.clip("chain", 0.85, 1 + Math.min(combo, 20) * 0.012);
      Overlay.vignette("rgba(255,79,190,.75)", 1, 420);
    }

    /* A shockwave fired at nothing. It is called out plainly — the player has to
       know the tap was wasted, not swallowed — and it costs whiffCost of spin,
       which is the whole reason mashing does not work. */
    function whiff() {
      combo = 0;
      pushSpin(-CONFIG.whiffCost);
      waves.push({ x: player.x, y: player.y, t: 0, life: 0.26, tier: -1 });
      Fx.shake(3, 0.12);
      Sound.clip("miss", 0.45, 1.15);
      Pop.show("alert", {
        word: "Miss", sub: "-" + Math.round(CONFIG.whiffCost * 100) + Lang.t("% spin"),
        at: farSpot()
      });
      if (spin <= 0) fall();
    }

    /* A shockwave BOTH marks and LAUNCHES: the rival pays a shell point where
       it stood — two if the tap landed dead on its impact — and is thrown
       across the dish at knockback speed, where the fence and whatever it
       ploughs through on the way can take the rest. That is the whole loop:
       the tap is the answer, and the arena is the follow-through.
       Two liveries bend it — a RED top takes nothing from the wave and is
       simply aimed (at a board, where it blows up), and the BOSS takes its one
       point only from a PERFECT. */
    function repel(f, tier) {
      var dx = f.x - player.x, dy = f.y - player.y, d = Math.hypot(dx, dy) || 1;
      // The wave throws a small top further than a big one, which is what makes
      // the three builds FEEL like three weights — and it keeps the boss, at
      // 66 px, from crossing the dish faster than the eye can follow it. Still
      // well over chipSpeed at its slowest, so every launch can still find a
      // board.
      var kick = CONFIG.knockback * clamp(40 / f.type.r, 0.6, 1.2);
      f.vx = dx / d * kick; f.vy = dy / d * kick;
      f.starve = 0;                    // answered: it flies its own line again
      f.shot = true;                   // a red sent from here pays its blast
      f.zigUx = f.zigUy = 0; f.zigOff = 0;   // a zigzag takes a fresh line once back
      if (f.type.move === "pulse") holdPulse(f, CONFIG.pulseHold + CONFIG.recover);
      f.vr = (f.vr > 0 ? 1 : -1) * 26;
      f.flash = 0.12;
      Fx.burst(f.x, f.y, { color: [f.type.rim[0], "#ffffff", "#ff4fbe"],
        count: 16, speed: 460, size: 6, life: 0.5 });
      Fx.ring(f.x, f.y, { from: f.type.r * 0.5, to: f.type.r * 2.4,
        color: f.type.rim[0], width: 5, life: 0.3 });
      dmg(f, tier === 2 ? "perfect" : "shock");
    }

    /* A rival that lands its charge. The top pays in spin and the rival pays
       NOTHING: a shell point is the player's to take, with the tap, the fence
       or the crowd, and a charge that gets through is the one exchange the
       rival wins. It is thrown back out all the same, so the dish keeps
       moving. */
    function crash(f) {
      crashes++; combo = 0;
      f.starve = 0;                    // it got what it came for
      if (f.type.move === "pulse") holdPulse(f, CONFIG.pulseHold + CONFIG.recover);
      pushSpin(-f.type.cost);
      var dx = f.x - player.x, dy = f.y - player.y, d = Math.hypot(dx, dy) || 1;
      f.vx = dx / d * 1000; f.vy = dy / d * 1000;
      player.vx -= dx / d * 520; player.vy -= dy / d * 520;
      Fx.burst(player.x + dx / d * CONFIG.playerR, player.y + dy / d * CONFIG.playerR,
        { color: ["#ff2f6d", "#ffffff", "#ffd43b"], count: 22, speed: 520, size: 7, life: 0.55 });
      Fx.shake(18, 0.36); Fx.flash("#ff2f6d", 0.34, 2.6); Fx.freeze(0.06);
      Sound.clip("crash", 0.85, Rand.range(0.94, 1.06));
      Pop.show("alert", { word: "Spin lost", at: farSpot(),
        sub: "-" + Math.round(f.type.cost * 100) + "%" });
      Overlay.vignette("rgba(255,47,109,.9)", 1, 520);
      if (spin <= 0) fall();
    }

    /* THE WRECK -------------------------------------------------------------
       The run ends on an explosion, not on a top lying down. The dead sprite is
       torn into debris — every piece is a jagged polygon clipped out of the
       cached canvas, so what flies is the real top, teeth and plate and all.
       The cuts are deliberately NOT a set of pie slices: the toothed rim breaks
       off in uneven arcs of shell, the plate cracks into a few blunt chunks and
       the hub goes last, which is what a shattering disc actually looks like.
       Pieces tumble, ring off the boards and burn out one by one instead of
       piling up at the edges. The blast also shoves every rival away, lights
       the whole fence, and drops the dish into slow motion; `wreckBeats` then
       stages the aftershocks until the end screen. */
    function fall() {
      if (phase !== "spin") return;
      phase = "fall"; phaseT = 0; spin = 0; wreckStep = 0;
      setSpinPill();
      Music.duck(0.25, 0.15);                  // the bed drops under the blast
      shatter();
    }

    /* One piece of debris: a polygon walked along an outer arc and back along an
       inner one, both radii jittered per vertex so no two edges line up. `rIn`
       of 0 gives a solid chunk of the middle, anything above it a curved strip
       of shell. Coordinates are in the sprite's frame, centred on its hub. */
    function makePiece(cv, a0, a1, rIn, rOut, jag) {
      var pts = [], i, a, n = Math.max(3, Math.round((a1 - a0) / 0.35) + 2);
      for (i = 0; i <= n; i++) {
        a = a0 + (a1 - a0) * (i / n);
        var r = rOut * Rand.range(1 - jag, 1);
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      if (rIn > 0) {
        for (i = n; i >= 0; i--) {
          a = a0 + (a1 - a0) * (i / n);
          var ri = rIn * Rand.range(1 - jag * 1.6, 1 + jag * 1.6);
          pts.push({ x: Math.cos(a) * ri, y: Math.sin(a) * ri });
        }
      } else {
        pts.push({ x: Rand.range(-8, 8), y: Rand.range(-8, 8) });   // a torn hub
      }
      var cx = 0, cy = 0;
      for (i = 0; i < pts.length; i++) { cx += pts[i].x; cy += pts[i].y; }
      cx /= pts.length; cy /= pts.length;
      // Rough radius of the piece, for the wall collision and the fade.
      var rr = 0;
      for (i = 0; i < pts.length; i++) {
        rr = Math.max(rr, Math.hypot(pts[i].x - cx, pts[i].y - cy));
      }
      return { cv: cv, pts: pts, ox: cx, oy: cy, rr: rr };
    }

    /* Uneven angular cuts of a ring: `n` spans whose widths are randomised and
       then normalised, so the ring is fully used but never evenly divided. */
    function cutRing(cv, n, rIn, rOut, jag, out) {
      var w = [], sum = 0, i, a = Rand.range(0, TAU), span;
      for (i = 0; i < n; i++) { w.push(Rand.range(0.45, 1.75)); sum += w[i]; }
      for (i = 0; i < n; i++) {
        span = w[i] / sum * TAU;
        out.push(makePiece(cv, a, a + span, rIn, rOut, jag));
        a += span;
      }
    }

    function shatter() {
      var cv = topCvs[topCvs.length - 1];      // the dying-red top is the wreck
      var rad = cv._w / 2, R = CONFIG.playerR, i, p, ang, dist, sp;
      var px = player.x, py = player.y;
      var pieces = [];

      // The toothed shell blows off first and fastest, the plate breaks into a
      // few heavy chunks, and one last piece carries what is left of the hub.
      cutRing(cv, CONFIG.rimShards, R * 0.62, rad, 0.18, pieces);
      cutRing(cv, CONFIG.plateShards, R * 0.22, R * 0.66, 0.3, pieces);
      pieces.push(makePiece(cv, 0, TAU, 0, R * 0.3, 0.35));

      shards = [];
      for (i = 0; i < pieces.length; i++) {
        p = pieces[i];
        // Heavier pieces (the ones nearer the hub) are thrown out slower.
        dist = Math.hypot(p.ox, p.oy);
        ang = Math.atan2(p.oy, p.ox) + spinAngle;
        sp = CONFIG.shardSpeed * Rand.range(0.4, 1.3) * (0.45 + dist / rad);
        p.x = px + Math.cos(ang) * dist;
        p.y = py + Math.sin(ang) * dist;
        p.vx = Math.cos(ang + Rand.range(-0.5, 0.5)) * sp + player.vx * 0.4;
        p.vy = Math.sin(ang + Rand.range(-0.5, 0.5)) * sp + player.vy * 0.4;
        p.rot = spinAngle;
        p.vr = Rand.range(-11, 11);
        p.sc = 1;
        // Staggered burn-out: the debris thins out through the whole wreck
        // rather than all of it vanishing on the end screen's first frame.
        p.life = Rand.range(0.6, 1.05) * CONFIG.deathSeconds;
        p.maxLife = p.life;
        shards.push(p);
      }

      // The blast itself: hit-stop, a white core, three rings and a lot of grit.
      Fx.freeze(0.13);
      Fx.flash("#ffffff", 0.72, 3.2);
      Fx.shake(30, 0.75);
      Fx.ring(px, py, { from: CONFIG.playerR * 0.4, to: CONFIG.playerR * 5.4,
        color: "#ffffff", width: 16, life: 0.34 });
      Fx.ring(px, py, { from: CONFIG.playerR * 0.6, to: CONFIG.playerR * 7.6,
        color: "#ff2f6d", width: 11, life: 0.5 });
      Fx.ring(px, py, { from: CONFIG.playerR * 0.8, to: CONFIG.playerR * 10,
        color: "#ffd43b", width: 7, life: 0.7 });
      Fx.burst(px, py, { color: ["#ffffff", "#ffd43b", "#ff2f6d"], count: 30,
        speed: 900, size: 8, life: 0.6 });
      Fx.burst(px, py, { color: ["#ff8a3d", "#ff2f6d", "#8f9ab5"], count: 26,
        speed: 420, size: 5, life: 1.1 });
      zapAll(1, "#ff2f6d");

      // Everything still in the dish is blown off the top.
      for (i = 0; i < foes.length; i++) {
        var f = foes[i];
        var dx = f.x - px, dy = f.y - py, d = Math.hypot(dx, dy) || 1;
        var k = clamp(1 - d / (Layout.h * 0.55), 0.25, 1);
        f.vx += dx / d * 1500 * k; f.vy += dy / d * 1500 * k;
        f.vr = (f.vr > 0 ? 1 : -1) * 22;
      }

      Sound.clip("crash", 0.9, 0.58);
      Sound.clip("shock", 0.7, 0.5);
      Overlay.vignette("rgba(255,47,109,.95)", 1, 1500);
      Pop.show("danger", { word: "Wrecked", sub: "Spin gone", hold: 900,
        at: farSpot() });
    }

    /* The aftershocks, on a fixed timeline so the wreck keeps unfolding while
       the debris slides: a second detonation, then the pieces ringing off the
       boards, then the last embers. */
    var WRECK_BEATS = [
      { at: 0.18, run: function () {
          Fx.burst(player.x, player.y, { color: ["#ffffff", "#ffd43b"], count: 18,
            speed: 640, size: 6, life: 0.7, grav: -40 });
          Fx.ring(player.x, player.y, { from: 40, to: CONFIG.playerR * 6,
            color: "#ff8a3d", width: 9, life: 0.45 });
          Fx.flash("#ff2f6d", 0.34, 2.2);
          Fx.shake(16, 0.4);
          Sound.clip("crash", 0.5, 0.9);
        } },
      { at: 0.5, run: function () {
          Sound.clip("bump", 0.55, 0.72);
          Fx.shake(7, 0.24);
        } },
      { at: 0.85, run: function () {
          Fx.burst(player.x, player.y, { color: ["#8f9ab5", "#ff7a96"], count: 14,
            speed: 260, size: 4, life: 1.1, grav: -20 });
          Sound.clip("bump", 0.4, 1.35);
        } },
      { at: 1.25, run: function () {
          // A last flare-up out of the wreck, once the debris has spread.
          Fx.ring(player.x, player.y, { from: 20, to: CONFIG.playerR * 4,
            color: "#ffd43b", width: 6, life: 0.5 });
          Fx.burst(player.x, player.y, { color: ["#ffd43b", "#ff8a3d"], count: 12,
            speed: 340, size: 5, life: 0.9, grav: -30 });
          Fx.shake(9, 0.3);
          Sound.clip("crash", 0.35, 1.5);
        } },
      { at: 1.75, run: function () {
          Overlay.vignette("rgba(255,47,109,.55)", 0.6, 900);
          Sound.clip("warn", 0.35, 0.66);
        } },
      { at: 2.15, run: function () {
          // The dish going quiet: embers drifting off what is left.
          Fx.burst(player.x, player.y, { color: ["#8f9ab5", "#ff7a96"], count: 9,
            speed: 130, size: 3, life: 1.2, grav: -18 });
        } }
    ];

    function wreckBeats() {
      while (wreckStep < WRECK_BEATS.length && phaseT >= WRECK_BEATS[wreckStep].at) {
        WRECK_BEATS[wreckStep].run();
        wreckStep++;
      }
    }

    function updateShards(dt) {
      var i, s, r;
      for (i = shards.length - 1; i >= 0; i--) {
        s = shards[i];
        s.life -= dt;
        if (s.life <= 0) {
          // A piece never just pops: it burns out in a puff of its own grit.
          Fx.burst(s.x, s.y, { color: ["#ff7a96", "#8f9ab5", "#ffd43b"], count: 6,
            speed: 190, size: 4, life: 0.45 });
          shards.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.rot += s.vr * dt;
        s.vx -= s.vx * CONFIG.shardDamp * dt;
        s.vy -= s.vy * CONFIG.shardDamp * dt;
        s.vr -= s.vr * 1.1 * dt;
        s.sc = Math.max(0.5, s.sc - dt * 0.2);
        // Debris rings off the boards, and lights them where it lands.
        r = s.rr * 0.7 * s.sc;
        if (s.x < arena.x + r) { s.x = arena.x + r; s.vx = Math.abs(s.vx) * CONFIG.shardBounce; shardHit(s, SIDE_L); }
        else if (s.x > arena.x + arena.w - r) { s.x = arena.x + arena.w - r; s.vx = -Math.abs(s.vx) * CONFIG.shardBounce; shardHit(s, SIDE_R); }
        if (s.y < arena.y + r) { s.y = arena.y + r; s.vy = Math.abs(s.vy) * CONFIG.shardBounce; shardHit(s, SIDE_T); }
        else if (s.y > arena.y + arena.h - r) { s.y = arena.y + arena.h - r; s.vy = -Math.abs(s.vy) * CONFIG.shardBounce; shardHit(s, SIDE_B); }
      }
    }

    function shardHit(s, side) {
      var sp = Math.hypot(s.vx, s.vy);
      if (sp < 160) return;
      zap(side, s.x, s.y, clamp(sp / 900, 0.15, 0.8));
      Fx.burst(s.x, s.y, { color: ["#ffd43b", "#ffffff"], count: 5, speed: 260,
        size: 4, life: 0.3 });
      if (bumpT <= 0) { bumpT = 0.08; Sound.clip("bump", 0.3, Rand.range(1.2, 1.7)); }
    }

    function finish() {
      phase = "done";
      var best = Store.get("bestScore", 0);
      var stars = score >= 3000 ? 3 : score >= 900 ? 2 : score > 0 ? 1 : 0;
      endRound({
        title: stars === 3 ? Lang.t("Spin master!") : CONFIG.copy.gameOver,
        variant: stars === 3 ? "perfect" : stars === 2 ? "win" : "",
        score: score,
        stars: stars,
        rows: [
          { label: "Shockwaves", value: shocks },
          { label: "Perfect hits", value: perfects, grade: perfects > 0 ? "good" : "" },
          { label: "Best combo", value: bestCombo, grade: "accent" },
          { label: "Best score", value: Math.max(score, best), grade: "gold" }
        ]
      });
    }

    /* --------------------------------------------------------------- update */
    function update(dt) {
      spinAngle += spinRate() * dt;
      gaugeT += dt;                     // the bar keeps flashing through the wreck
      trackGauge(dt);
      if (bumpT > 0) bumpT -= dt;
      updateZaps(dt);                   // the fence keeps fading in every phase
      updateTracks(dt);                 // ...and so do the trails on the floor
      for (var w = waves.length - 1; w >= 0; w--) {
        waves[w].t += dt;
        if (waves[w].t >= waves[w].life) waves.splice(w, 1);
      }
      for (w = blasts.length - 1; w >= 0; w--) {
        blasts[w].t += dt;
        if (blasts[w].t >= blasts[w].life) blasts.splice(w, 1);
      }
      for (w = scorches.length - 1; w >= 0; w--) {
        scorches[w].t += dt;
        if (scorches[w].t >= scorches[w].life) scorches.splice(w, 1);
      }

      if (phase === "fall") {
        phaseT += dt;
        wreckBeats();                   // the staged aftershocks of the blast
        /* Slow motion: the dish nearly stops on the detonation and runs back up
           to speed as the debris settles. The wreck's own clock (`phaseT`) is
           real time, so the end screen always comes up on schedule. */
        var sdt = dt * clamp(CONFIG.deathSlow +
          (1 - CONFIG.deathSlow) * (phaseT / CONFIG.deathSlowUp), CONFIG.deathSlow, 1);
        updateShards(sdt);
        moveFoes(sdt);
        if (phaseT >= CONFIG.deathSeconds) finish();
        return;
      }
      if (phase !== "spin") return;

      elapsed += dt;
      cooldown -= dt;

      // Friction always wins in the end, and the ceiling comes down with it.
      pushSpin(-(CONFIG.drainBase + CONFIG.drainRamp * ramp()) * dt);
      var cap = spinCap();
      if (spin > cap) spin = cap;
      setSpinPill();
      if (spin <= 0) { fall(); return; }
      if (!wornSaid && cap <= 0.62) {
        wornSaid = true;
        Notify.say("Bearings wearing out", { kind: "warn" });
      }

      // Spinning-out alarm, armed once per dive into the red. The edge glow is
      // a DOM write, so it is only touched when the danger state flips.
      if (warnArmed && spin <= CONFIG.warnAt * cap) {
        warnArmed = false;
        Sound.clip("warn", 0.6, 1);
        Pop.show("danger", { word: "Spinning out", sub: "Shock to recover",
          hold: 900, at: farSpot() });
      } else if (!warnArmed && spin >= CONFIG.warnClear * cap) {
        warnArmed = true;
      }
      var lowNow = spin <= CONFIG.warnAt * cap;
      if (lowNow !== lowSpin) {
        lowSpin = lowNow;
        Overlay.vignette("rgba(255,47,109,.8)", lowNow ? 0.85 : 0);
      }

      // The top drifts on its own recoil and is kept inside the dish.
      player.vx -= player.vx * CONFIG.playerDamp * dt;
      player.vy -= player.vy * CONFIG.playerDamp * dt;
      player.x += player.vx * dt; player.y += player.vy * dt;
      player.wob += dt * (2.4 + (1 - spin) * 6);
      // The wall is a trampoline, not a stop: the recoil is meant to bounce.
      var R = CONFIG.playerR, e = CONFIG.playerBounce;
      var pvx = Math.abs(player.vx), pvy = Math.abs(player.vy);
      var psx = -1, psy = -1;
      if (player.x < arena.x + R)           { player.x = arena.x + R;           player.vx =  pvx * e; psx = SIDE_L; }
      if (player.x > arena.x + arena.w - R) { player.x = arena.x + arena.w - R; player.vx = -pvx * e; psx = SIDE_R; }
      if (player.y < arena.y + R)           { player.y = arena.y + R;           player.vy =  pvy * e; psy = SIDE_T; }
      if (player.y > arena.y + arena.h - R) { player.y = arena.y + arena.h - R; player.vy = -pvy * e; psy = SIDE_B; }
      if (psx >= 0 || psy >= 0) {
        // The player's own ricochet lights the fence exactly like a rival's:
        // the board is the band's, and the spin gauge has the whole right edge
        // of the screen to say what it has to say.
        if (psx >= 0 && pvx > ZAP_MIN) zap(psx, player.x, player.y, clamp(pvx / 700, 0.2, 1));
        if (psy >= 0 && pvy > ZAP_MIN) zap(psy, player.x, player.y, clamp(pvy / 700, 0.2, 1));
        var wsp = Math.hypot(player.vx, player.vy);
        if (wsp > 140) {
          clank(player.x, player.y, wsp, 0.9);
          Fx.shake(clamp(wsp / 180, 1, 7), 0.14);
        }
      }

      /* THE DISH IS NEVER EMPTY, IT IS ONLY EVER CROWDED ON PURPOSE. The wait
         scales with how full the dish already is: at the cap it is the whole
         interval, and an empty dish refills in a quarter of it. Without that, a
         level whose cap is ONE top — which is most of the first three bands,
         where a livery is met alone — spends half its length showing nothing at
         all, because the interval is tuned for a dish that holds five. */
      spawnT -= dt;
      if (spawnT <= 0) {
        var want = maxFoes(), have = liveFoes();
        if (have < want) spawn();
        spawnT = lerp(CONFIG.spawnEvery, CONFIG.spawnEveryEnd, ramp()) *
                 (0.25 + 0.75 * clamp(have / want, 0, 1)) * Rand.range(0.85, 1.15);
      }

      moveFoes(dt);
    }

    function moveFoes(dt) {
      var i, f;
      // Forwards, because `split` appends the two children of a purple to this
      // very array and they are meant to be moved on the frame they appear.
      for (i = 0; i < foes.length; i++) {
        f = foes[i];
        if (f.dead) continue;
        f.born += dt; f.age += dt;
        f.ang += f.vr * dt;
        if (f.flash > 0) f.flash -= dt;
        if (f.mend  > 0) f.mend  -= dt;      // the green pulse of a repair
        if (f.shrug > 0) f.shrug -= dt;      // the throttle on "that did nothing"
        if (f.healT > 0) f.healT -= dt;      // a black top's own cooldown
        // A duellist always steers back toward the top, so a launched one curls
        // round and comes back on its own once its borrowed speed has bled off.
        if (phase === "spin") steer(f, dt);
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.inside) trackPush(f, f.corner); // the line it leaves on the floor
        f.corner = false;
        // A rival only starts colliding with the wall once it is really inside.
        if (!f.inside) {
          f.inside = insideArena(f);
          // ...and one that was thrown out before it ever got in is not coming
          // back: it would otherwise squat a spawn slot for the whole round.
          if (!f.inside && f.age > 5 && offFrame(f)) { f.dead = true; }
          continue;
        }
        walls(f);
        if (f.dead) continue;
        if (phase === "spin" && gapOf(f) <= 0) {
          crash(f);
          if (f.type.blastR) blast(f);
        }
      }
      foeCollisions();
      sweepFoes();
    }

    /* --------------------------------------------------------------- render */
    function render() {
      ctx.drawImage(floorCv, 0, 0, floorCv._w, floorCv._h);
      drawTracks();                     // where every rival has just been
      drawScorches();                   // ...and where a red went up
      /* The fence, each rival, the top and the spin bar are the elements of
         the round's entrance (Enter): they land in this order on the dish. */
      if (Enter.begin(arena.cx, arena.cy)) {
        drawZaps();                     // the boards, only where one was struck
        Enter.end();
      }

      var i, f, gap, tier;

      /* AREA OF EFFECT — a breath of light around the top, and nothing else.
         There is deliberately NO edge to read: the gradient peaks well inside
         the real reach and dissolves far outside it, so the player feels roughly
         how far the wave carries and has to judge the last few pixels by eye.
         That fuzziness is the difficulty. */
      var sr = CONFIG.playerR + CONFIG.reach, aura = tierGlow();
      // The breath dies with the top: once it blows up there is nothing to reach.
      var auraK = phase === "spin" ? 1 : clamp(1 - phaseT / 0.25, 0, 1);
      if (auraK > 0) {
        var grd = ctx.createRadialGradient(player.x, player.y, CONFIG.playerR * 0.9,
                                           player.x, player.y, sr + 90);
        grd.addColorStop(0, rgba(aura, 0));
        grd.addColorStop(0.42, rgba(aura, 0.016 * auraK));
        grd.addColorStop(0.66, rgba(aura, 0.026 * auraK));
        grd.addColorStop(0.82, rgba(aura, 0.014 * auraK));
        grd.addColorStop(1, rgba(aura, 0));
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(player.x, player.y, sr + 90, 0, TAU); ctx.fill();
      }

      // Rivals: shell pips, the telegraph that tells the player when to tap, and
      // a white flash on the frame a shell point goes.
      for (i = 0; i < foes.length; i++) {
        f = foes[i];
        if (f.dead) continue;
        if (!Enter.begin(f.x, f.y)) continue;
        var fade = clamp(f.born / 0.22, 0.15, 1);
        if (phase === "spin") {
          gap = gapOf(f);
          if (gap <= CONFIG.reach) {
            tier = tierOf(gap);
            var col = tier === 2 ? "#ffd43b" : tier === 1 ? "#7ef4ff" : "#ffffff";
            var k = clamp(1 - gap / CONFIG.reach, 0, 1);
            ctx.strokeStyle = rgba(col, 0.25 + k * 0.6);
            ctx.lineWidth = 4 + k * 6;
            ctx.beginPath(); ctx.arc(f.x, f.y, f.type.r + 30 - k * 8, 0, TAU); ctx.stroke();
            if (tier === 2) {                       // the "NOW" flash
              ctx.strokeStyle = rgba("#fff6bf", 0.75);
              ctx.lineWidth = 3;
              ctx.beginPath(); ctx.arc(f.x, f.y, f.type.r + 42, 0, TAU); ctx.stroke();
            }
          }
        }
        drawIntent(f, fade);
        blit(foeCv[f.type.key], f.x, f.y, f.ang, 1, fade);
        if (f.flash > 0) {
          ctx.globalAlpha = clamp(f.flash / 0.16, 0, 1) * 0.55 * fade;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath(); ctx.arc(f.x, f.y, f.type.r * 0.92, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
        // A shell point just handed back by a black top: the same flash, in the
        // healer's own green, so a repair never reads as a hit landing.
        if (f.mend > 0) {
          ctx.globalAlpha = clamp(f.mend / 0.4, 0, 1) * 0.5 * fade;
          ctx.fillStyle = "#8affc0";
          ctx.beginPath(); ctx.arc(f.x, f.y, f.type.r * 0.92, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
        drawShell(f, fade);
        Enter.end();
      }

      if (Enter.begin(player.x, player.y)) { drawPlayer(); Enter.end(); }
      drawWaves();
      drawBlasts();
      drawCombo();
      // last, so no top ever draws over it
      if (Enter.begin(gauge.x + gauge.w / 2, gauge.y + gauge.h / 2)) { drawGauge(); Enter.end(); }
    }

    /* THE SPIN BAR ----------------------------------------------------------
       One glance, one number: how much spin is left, how fast it is going, and
       how much of the rail the worn bearings have already taken away.

       - twenty cells, filled bottom-up, the whole lit column burning the colour
         the top is burning right now: the bar cools from ice-cyan to a dying red
         with the top itself, so the two readings can never disagree and a run
         going bad turns the entire right edge of the screen red;
       - the band between the value and its trailing ghost flashes white on a
         shockwave and red on a hit, which is what makes a gain or a loss
         legible at a glance instead of a silent slide;
       - the worn head of the rail is hatched dead red (see CONFIG.wear): the
         player watches the ceiling itself come down over the run;
       - the alarm threshold is a red tick on the rail, and under it the whole
         rail pulses.

       It is a piece of the dish, not a widget bolted on top of it: the rail is
       smoked glass the painted floor still shows through, every alpha is kept
       well under 1, and what marks the value is not a flat bar but an ARC — the
       same crackle the arena wall answers a slam with (see `zap`). The lit
       column carries a filament of current running up it, and a scored change
       discharges the whole rail.
       Drawn with flat fills and concentric strokes only — no shadowBlur in the
       frame loop. */
    function drawGauge() {
      var x = gauge.x, y = gauge.y, w = gauge.w, h = gauge.h;
      var cap = spinCap(), warn = CONFIG.warnAt * cap;
      var i, k, lo, cellY, cellH, f, g, a, b;
      var col = tierMix();              // one colour for the column: the top's own
      // The alarm pulse survives the wreck, where spin is pinned at zero.
      var low = phase === "fall" || (phase === "spin" && spin <= warn);
      var pulse = low ? 0.5 + 0.5 * Math.sin(gaugeT * 11) : 0;

      ctx.save();

      // the rail: smoked glass, so the painted dish reads straight through it
      barPath(x, y, w, h, w / 2);
      ctx.fillStyle = "rgba(4,4,20,.20)";
      ctx.fill();
      // a soft inner light down the left flank, which is what sells the glass
      var gl = ctx.createLinearGradient(x, 0, x + w, 0);
      gl.addColorStop(0, "rgba(255,255,255,.05)");
      gl.addColorStop(0.35, "rgba(255,255,255,.01)");
      gl.addColorStop(1, "rgba(0,0,0,.07)");
      ctx.fillStyle = gl;
      barPath(x, y, w, h, w / 2); ctx.fill();

      // worn capacity: the head of the rail the bearings can no longer reach
      if (cap < 0.999) {
        var deadH = h * (1 - cap);
        ctx.save();
        barPath(x, y, w, h, w / 2); ctx.clip();
        ctx.beginPath(); ctx.rect(x, y, w, deadH); ctx.clip();
        ctx.fillStyle = "rgba(255,47,109,.07)";
        ctx.fillRect(x, y, w, deadH);
        ctx.strokeStyle = "rgba(255,47,109,.12)"; ctx.lineWidth = 3;
        for (b = y - w; b < y + deadH; b += 13) {
          ctx.beginPath(); ctx.moveTo(x, b + w); ctx.lineTo(x + w, b); ctx.stroke();
        }
        ctx.restore();
      }

      // the cells, kept inside the rounded rail so the two ends stay clean
      ctx.save();
      barPath(x, y, w, h, w / 2); ctx.clip();
      cellH = (h - GAUGE_PAD * (GAUGE_SEGS - 1)) / GAUGE_SEGS;
      for (i = 0; i < GAUGE_SEGS; i++) {
        lo = i / GAUGE_SEGS;
        cellY = y + h - (i + 1) * cellH - i * GAUGE_PAD;
        f = clamp((spin - lo) * GAUGE_SEGS, 0, 1);       // the real value...
        g = clamp((spinLag - lo) * GAUGE_SEGS, 0, 1);    // ...and its ghost
        a = Math.min(f, g); b = Math.max(f, g);
        // the dead cell, so an empty rail still reads as a scale — skipped when
        // something covers it whole, which is the common case
        if (b < 0.999) {
          barPath(x + 3, cellY, w - 6, cellH, 3);
          ctx.fillStyle = lo >= cap ? "rgba(255,255,255,.018)" : "rgba(255,255,255,.035)";
          ctx.fill();
        }
        if (b <= 0) continue;
        /* The lit part of the cell, grown from its own bottom edge and brighter
           toward the head, so the column reads as a direction and not a block.
           A cell filled to the brim is painted as its own rounded path; only the
           one cell the head sits in pays for a clip. */
        if (f > 0) {
          k = spin > 0.001 ? clamp((lo + 0.5 / GAUGE_SEGS) / spin, 0, 1) : 0;
          ctx.fillStyle = rgba(col, 0.19 + 0.44 * k * k);
          if (f >= 0.999) {
            barPath(x + 3, cellY, w - 6, cellH, 3); ctx.fill();
          } else {
            ctx.save();
            barPath(x + 3, cellY, w - 6, cellH, 3); ctx.clip();
            ctx.fillRect(x + 3, cellY + cellH * (1 - f), w - 6, cellH * f);
            ctx.restore();
          }
        }
        // the delta band: white for spin just won, red for spin just lost
        if (b - a > 0.01) {
          ctx.fillStyle = spin > spinLag ? "rgba(255,255,255,.58)"
                                        : "rgba(255,47,109,.48)";
          if (a <= 0.001 && b >= 0.999) {
            barPath(x + 3, cellY, w - 6, cellH, 3); ctx.fill();
          } else {
            ctx.save();
            barPath(x + 3, cellY, w - 6, cellH, 3); ctx.clip();
            ctx.fillRect(x + 3, cellY + cellH * (1 - b), w - 6, cellH * (b - a));
            ctx.restore();
          }
        }
      }

      /* The current running up the lit column, inside the same clip: one thin
         crackling filament, jittered on the gauge's own clock. It is what turns
         a coloured bar into something plugged into the dish, and a scored change
         discharges it white for a beat. */
      var hy = y + h * (1 - clamp(spin, 0, 1));
      if (spin > 0.02) {
        drawFilament(x + w / 2, y + h - 6, hy, col,
                     0.13 + 0.28 * gaugePunch + 0.09 * pulse);
      }
      ctx.restore();

      /* The head: an ARC across the rail, the way the arena wall answers a slam,
         plus a chevron pointing at it. It marks the REAL value, never the ghost —
         the ghost's job is to show what was just lost above it, and a head that
         lagged behind would be lying about how much spin is left. */
      if (spin > 0.001) {
        drawHeadArc(x, w, hy, col, 0.55 + 0.45 * gaugePunch);
        ctx.fillStyle = rgba(col, 0.72);
        ctx.beginPath();
        ctx.moveTo(x - 8, hy);
        ctx.lineTo(x - 21, hy - 10);
        ctx.lineTo(x - 21, hy + 10);
        ctx.closePath(); ctx.fill();
      }

      // the alarm threshold, and the ceiling the wear has left
      var wy = y + h * (1 - warn);
      ctx.fillStyle = "rgba(255,47,109,.5)";
      ctx.fillRect(x + 3, wy - 1, w - 6, 2);
      if (cap < 0.999) {
        ctx.fillStyle = "rgba(255,212,59,.4)";
        ctx.fillRect(x + 3, y + h * (1 - cap) - 1, w - 6, 2);
      }

      // the rim: a hairline, pulsing in the red and discharged by a scored change
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      barPath(x, y, w, h, w / 2); ctx.stroke();
      if (pulse > 0) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = rgba("#ff2f6d", 0.14 + 0.4 * pulse);
        barPath(x, y, w, h, w / 2); ctx.stroke();
      }
      if (gaugePunch > 0) {
        // concentric strokes stand in for a glow, which shadowBlur cannot pay for
        for (i = 0; i < 3; i++) {
          ctx.lineWidth = 3 + i * 5;
          ctx.strokeStyle = rgba(gaugeCol, gaugePunch * (0.22 - i * 0.07));
          barPath(x - i * 2, y - i * 2, w + i * 4, h + i * 4, w / 2 + i * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    /* THE ARC AT THE HEAD ---------------------------------------------------
       Three passes on one jittered polyline — a wide dim halo down to a white
       core — pinned to both flanks of the rail and overshooting them a little,
       so the value reads as a discharge jumping the gap rather than a drawn
       line. Same recipe as the arena wall, at a tenth of the length. */
    var HEAD_PASSES = [[16, 0.08], [8, 0.19], [3.4, 0.82]];

    function drawHeadArc(x, w, hy, col, power) {
      var over = 9, n = arcSeg.length - 1, q, i, u, px, py;
      var amp = 4 + 4 * power;
      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (q = 0; q < HEAD_PASSES.length; q++) {
        ctx.strokeStyle = rgba(q === HEAD_PASSES.length - 1 ? "#ffffff" : col,
                               HEAD_PASSES[q][1] * (0.55 + 0.45 * power));
        ctx.lineWidth = HEAD_PASSES[q][0] * (0.72 + 0.28 * power);
        ctx.beginPath();
        for (i = 0; i <= n; i++) {
          u = i / n;
          px = x - over + (w + over * 2) * u;
          // sin envelope: the arc leaves the flanks flat and bellies out mid-rail
          py = hy + arcSeg[i] * amp * Math.sin(Math.PI * u);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      // the node the discharge is anchored on, mid-rail
      ctx.fillStyle = rgba(col, 0.24);
      ctx.beginPath(); ctx.arc(x + w / 2, hy, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba("#ffffff", 0.78);
      ctx.beginPath(); ctx.arc(x + w / 2, hy, 2.6, 0, TAU); ctx.fill();
      ctx.restore();
    }

    /* THE FILAMENT ----------------------------------------------------------
       The current in the column: one polyline from the foot of the rail to the
       head, wandering a few px either side of the centre line. Two passes only —
       this runs every frame, and the arc above is what the eye actually reads. */
    function drawFilament(cx, y0, y1, col, alpha) {
      var n = boltSeg.length - 1, i, u, px, py, q;
      var span = y1 - y0;                          // negative: it climbs
      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (q = 0; q < 2; q++) {
        ctx.strokeStyle = rgba(q ? "#ffffff" : col, alpha * (q ? 0.55 : 1));
        ctx.lineWidth = q ? 1.4 : 4;
        ctx.beginPath();
        for (i = 0; i <= n; i++) {
          u = i / n;
          py = y0 + span * u;
          px = cx + boltSeg[i] * 6 * Math.sin(Math.PI * u);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    /* A rounded rectangle, laid down as a path. Written out rather than left to
       ctx.roundRect, which is far too young for the WebViews a creative runs in. */
    function barPath(x, y, w, h, r) {
      var rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }

    /* ONE STRUCK BOARD ------------------------------------------------------
       The polyline runs corner to corner, but the gradient painting it is
       transparent everywhere except around the contact: the arena is never
       outlined, only the length of board the impact ran through lights up. Four
       passes fake the bloom — a wide dim halo down to a white-hot core —
       because shadowBlur is banned in the frame loop. */
    var ZAP_PASSES = [[22, 0.10], [12, 0.22], [5, 0.50], [2.2, 1]];

    function drawZaps() {
      for (var i = 0; i < zaps.length; i++) drawZap(zaps[i]);
    }

    function drawZap(z) {
      var k = clamp(1 - z.t / z.life, 0, 1);        // 1 on impact, 0 once gone
      var flash = Math.pow(k, 0.55);                // hangs on, then drops fast
      var horiz = z.side === SIDE_T || z.side === SIDE_B;
      var len = horiz ? arena.w : arena.h;
      var base = horiz ? arena.x : arena.y;         // the moving coordinate
      var edge = z.side === SIDE_L ? arena.x
               : z.side === SIDE_R ? arena.x + arena.w
               : z.side === SIDE_T ? arena.y : arena.y + arena.h;
      // The lit window widens a little as the discharge runs along the board.
      var w = (0.08 + 0.14 * z.power) * (0.85 + 0.4 * (1 - k));
      var amp = (6 + 15 * z.power) * (0.3 + 0.7 * k);
      // The arc bows into the dish: an excursion the other way would climb over
      // the HUD or the CTA bar, which sit right against the boards.
      var inward = (z.side === SIDE_L || z.side === SIDE_T) ? 1 : -1;
      var i, u, d, o, x, y, g, a, col;

      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (var q = 0; q < ZAP_PASSES.length; q++) {
        a = ZAP_PASSES[q][1] * flash;
        // The core burns white, the halo keeps the colour of whatever hit it.
        col = q === ZAP_PASSES.length - 1 ? "#ffffff" : z.col;
        g = horiz ? ctx.createLinearGradient(arena.x, 0, arena.x + arena.w, 0)
                  : ctx.createLinearGradient(0, arena.y, 0, arena.y + arena.h);
        // Fully transparent past the window: the rest of the board stays dark.
        g.addColorStop(0, rgba(col, 0));
        addStop(g, z.p - w * 1.8, rgba(col, 0));
        addStop(g, z.p - w, rgba(col, a * 0.20));
        addStop(g, z.p, rgba(col, a));
        addStop(g, z.p + w, rgba(col, a * 0.20));
        addStop(g, z.p + w * 1.8, rgba(col, 0));
        g.addColorStop(1, rgba(col, 0));
        ctx.strokeStyle = g;
        ctx.lineWidth = ZAP_PASSES[q][0] * (0.35 + 0.65 * k);
        ctx.beginPath();
        for (i = 0; i <= ZAP_SEGS; i++) {
          u = i / ZAP_SEGS;
          d = base + u * len;
          // the arc only leaves the wall inside the lit window
          o = z.seg[i] * amp * Math.max(0, 1 - Math.abs(u - z.p) / (w * 1.4));
          if (o * inward < 0) o *= 0.35;         // barely any overshoot outward
          x = horiz ? d : edge + o;
          y = horiz ? edge + o : d;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // the contact itself: a small hot node sitting on the board
      var px = horiz ? base + z.p * len : edge;
      var py = horiz ? edge : base + z.p * len;
      ctx.globalAlpha = flash;
      ctx.fillStyle = rgba(z.col, 0.5);
      ctx.beginPath(); ctx.arc(px, py, 4 + 22 * z.power * k, 0, TAU); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(px, py, 2 + 8 * z.power * k, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // createLinearGradient only accepts offsets inside 0..1, and an impact near
    // a corner pushes the window past both ends.
    function addStop(g, at, col) {
      if (at > 0 && at < 1) g.addColorStop(at, col);
    }

    /* Shell points, as a ring of pips hugging the rival: how many shockwaves it
       still owes, and the only way to tell a fresh heavy from one that has
       already been slammed twice. */
    function drawShell(f, fade) {
      var n = f.hpMax, i, a0, step = TAU / n, r = f.type.r + 13, gap = 0.3;
      // The pips thin out as there are more of them, so the boss's ten read as
      // a ring around it rather than as a second rim.
      ctx.lineWidth = n > 6 ? 4 : 5;
      for (i = 0; i < n; i++) {
        a0 = -Math.PI / 2 + i * step;
        ctx.strokeStyle = i < f.hp ? rgba(f.type.rim[0], 0.9 * fade)
                                   : "rgba(255,255,255," + (0.09 * fade).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, a0 + gap / 2, a0 + step - gap / 2);
        ctx.stroke();
      }
    }

    function blit(cv, x, y, ang, sc, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.translate(x, y);
      ctx.rotate(ang);
      if (sc && sc !== 1) ctx.scale(sc, sc);
      ctx.drawImage(cv, -cv._w / 2, -cv._h / 2, cv._w, cv._h);
      ctx.restore();
    }

    function drawPlayer() {
      if (phase !== "spin") { drawWreck(); return; }
      var wobble = Math.sin(player.wob * 6) * (1 - spin) * 7;
      var x = player.x + wobble, y = player.y;
      // Two neighbouring tiers of the colour ramp, cross-faded: the top cools
      // continuously instead of switching palette in visible steps.
      var pos = tierPos(), lo = Math.floor(pos), mix = pos - lo;
      var cvA = topCvs[lo], cvB = topCvs[Math.min(lo + 1, topCvs.length - 1)];
      // Motion blur: two ghost copies behind the top, only while it is fast.
      if (spin > 0.35) {
        blit(cvA, x, y, spinAngle - 0.16, 1, 0.22 * spin);
        blit(cvA, x, y, spinAngle - 0.32, 1, 0.12 * spin);
      }
      blit(cvA, x, y, spinAngle, 1, 1);
      if (mix > 0.02) blit(cvB, x, y, spinAngle, 1, mix);
    }

    /* THE DEBRIS ------------------------------------------------------------
       Each piece is the cached top sprite clipped to its own jagged polygon, so
       what is tumbling across the dish keeps the real teeth, plate and blades
       and is unmistakably the player's own top in bits. The clip is taken in
       the sprite's frame — that is why the polygon never has to be re-derived
       as the piece turns — and the torn outline is stroked hot, the way freshly
       broken metal glows before it cools. */
    function drawWreck() {
      var i, j, s, k, hot;
      // The core still burning where the top stood, for the first fifth of a second.
      var burn = clamp(1 - phaseT / 0.22, 0, 1);
      if (burn > 0) {
        var g = ctx.createRadialGradient(player.x, player.y, 1,
                                         player.x, player.y, CONFIG.playerR * (1 + (1 - burn) * 2.4));
        g.addColorStop(0, rgba("#ffffff", burn));
        g.addColorStop(0.4, rgba("#ffd43b", burn * 0.75));
        g.addColorStop(1, rgba("#ff2f6d", 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(player.x, player.y, CONFIG.playerR * (1 + (1 - burn) * 2.4), 0, TAU);
        ctx.fill();
      }
      for (i = 0; i < shards.length; i++) {
        s = shards[i];
        k = clamp(s.life / 0.4, 0, 1);           // every piece fades as it dies
        /* The torn edge only lights up once the pieces have pulled apart —
           stroked while they are still stacked on the hub it reads as a
           wireframe over an intact top — and cools down from there. */
        hot = clamp((phaseT - 0.1) / 0.14, 0, 1) * clamp(1 - phaseT / 0.7, 0, 1);
        ctx.save();
        ctx.globalAlpha = k;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.scale(s.sc, s.sc);
        ctx.translate(-s.ox, -s.oy);             // back to the hub of the sprite
        ctx.beginPath();
        ctx.moveTo(s.pts[0].x, s.pts[0].y);
        for (j = 1; j < s.pts.length; j++) ctx.lineTo(s.pts[j].x, s.pts[j].y);
        ctx.closePath();
        ctx.save();
        ctx.clip();
        ctx.drawImage(s.cv, -s.cv._w / 2, -s.cv._h / 2, s.cv._w, s.cv._h);
        ctx.restore();
        if (hot > 0.02) {
          ctx.strokeStyle = rgba("#ffd43b", 0.7 * hot * k);
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    /* WHAT A TOP IS ABOUT TO DO, drawn under it — the half of a livery that
       has to be read before it happens.
       BLUE holding: a dashed line along its aim, as long as the run it is
       about to make, and a ring closing in on its rim; the ring touches the
       rim on the frame it leaves, and burns white over the last beat.
       BLUE dashing, and every RED: two ghosts behind it along its velocity,
       and the red a short dashed line AHEAD of it — a straight run is read by
       where it goes, not by where it has been. */
    function drawIntent(f, fade) {
      var m = f.type.move, cv = foeCv[f.type.key], r = f.type.r, col = f.type.rim[0];
      if (m !== "pulse" && m !== "line") return;
      if (!f.inside && m === "pulse") return;
      ctx.save();
      if (m === "pulse" && f.pulse === "hold") {
        var ch = clamp(1 - f.pulseT / CONFIG.pulseHold, 0, 1);
        if (ch > 0 && phase === "spin") {
          var len = f.cruise * CONFIG.pulseBoost * CONFIG.pulseDash;
          var hot = ch > 0.82 ? "#ffffff" : col;
          ctx.lineCap = "round";
          ctx.setLineDash([16, 12]);
          ctx.lineDashOffset = -f.age * 70;
          ctx.strokeStyle = rgba(hot, (0.12 + 0.58 * ch) * fade);
          ctx.lineWidth = 3 + 3 * ch;
          var x1 = f.x + f.aimX * (r + len), y1 = f.y + f.aimY * (r + len);
          ctx.beginPath();
          ctx.moveTo(f.x + f.aimX * (r + 10), f.y + f.aimY * (r + 10));
          ctx.lineTo(x1, y1);
          ctx.stroke();
          ctx.setLineDash([]);
          // the head of the run: a chevron at its far end
          ctx.beginPath();
          ctx.moveTo(x1 - f.aimX * 18 - f.aimY * 13, y1 - f.aimY * 18 + f.aimX * 13);
          ctx.lineTo(x1, y1);
          ctx.lineTo(x1 - f.aimX * 18 + f.aimY * 13, y1 - f.aimY * 18 - f.aimX * 13);
          ctx.stroke();
          // the ring closing in: r * 2.8 at the stop, the rim at the launch
          ctx.strokeStyle = rgba(hot, (0.3 + 0.6 * ch) * fade);
          ctx.lineWidth = 3 + 5 * ch;
          ctx.beginPath();
          ctx.arc(f.x, f.y, r + 6 + r * 1.8 * (1 - ch), 0, TAU);
          ctx.stroke();
        }
      } else {
        var sp = Math.hypot(f.vx, f.vy);
        if (sp > 260) {
          blit(cv, f.x - f.vx * 0.05, f.y - f.vy * 0.05, f.ang - 0.3, 1, 0.14 * fade);
          blit(cv, f.x - f.vx * 0.025, f.y - f.vy * 0.025, f.ang - 0.15, 1, 0.26 * fade);
        }
        if (m === "line" && phase === "spin" && sp > 1) {
          var ux = f.vx / sp, uy = f.vy / sp;
          ctx.setLineDash([10, 12]);
          ctx.lineDashOffset = -f.age * 120;
          ctx.strokeStyle = rgba(col, 0.38 * fade);
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(f.x + ux * (r + 8), f.y + uy * (r + 8));
          ctx.lineTo(f.x + ux * (r + 230), f.y + uy * (r + 230));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      ctx.restore();
    }

    /* A red's blast, drawn in its layers (see `boom`). Times are seconds, so
       every layer keeps its own beat whatever the blast's total life. The
       light is added ("lighter"), which is what makes it glow over the floor
       and the metal without a shadowBlur. */
    function drawBlasts() {
      var i, j, b, s, R, k, e, r, g, ray, len, w;
      for (i = 0; i < blasts.length; i++) {
        b = blasts[i]; s = b.t; R = b.r;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        // the fireball: swells to .8R and burns down through yellow and orange
        if (s < 0.55) {
          k = s < 0.12 ? 1 : 1 - (s - 0.12) / 0.43;
          r = R * (0.35 + 0.45 * (1 - Math.pow(1 - Math.min(1, s / 0.3), 2)));
          g = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, r);
          g.addColorStop(0, rgba("#ffffff", k));
          g.addColorStop(0.3, rgba(s < 0.2 ? "#fff3b0" : "#ffd43b", 0.95 * k));
          g.addColorStop(0.65, rgba("#ff7a3d", 0.75 * k));
          g.addColorStop(1, rgba(b.col, 0));
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.fill();
        }
        // the rays: thrown out of the core and gone in a quarter of a second
        if (s < 0.26) {
          k = 1 - s / 0.26;
          e = 1 - Math.pow(1 - s / 0.26, 3);
          ctx.fillStyle = rgba("#fff6d0", 0.85 * k);
          for (j = 0; j < b.rays.length; j++) {
            ray = b.rays[j]; len = R * 1.15 * ray.len * e; w = ray.w;
            ctx.beginPath();
            ctx.moveTo(b.x + Math.cos(ray.a - w) * R * 0.12, b.y + Math.sin(ray.a - w) * R * 0.12);
            ctx.lineTo(b.x + Math.cos(ray.a) * len, b.y + Math.sin(ray.a) * len);
            ctx.lineTo(b.x + Math.cos(ray.a + w) * R * 0.12, b.y + Math.sin(ray.a + w) * R * 0.12);
            ctx.closePath(); ctx.fill();
          }
        }
        ctx.globalCompositeOperation = "source-over";
        // the shock ring, out to the radius it really hits, with a wide halo
        if (s < 0.5) {
          k = s / 0.5; e = 1 - Math.pow(1 - k, 3); r = R * e;
          ctx.globalAlpha = (1 - k) * 0.3;
          ctx.strokeStyle = "#ffb000"; ctx.lineWidth = 44 * (1 - k) + 6;
          ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.stroke();
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = b.col; ctx.lineWidth = 22 * (1 - k) + 4;
          ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.stroke();
          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 7 * (1 - k) + 2;
          ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.stroke();
        }
        // ...and the second ring a beat behind it, a little wider
        if (s > 0.1 && s < 0.7) {
          k = (s - 0.1) / 0.6; e = 1 - Math.pow(1 - k, 2); r = R * 1.2 * e;
          ctx.globalAlpha = (1 - k) * 0.8;
          ctx.strokeStyle = "#ff7a3d"; ctx.lineWidth = 10 * (1 - k) + 2;
          ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.stroke();
        }
        ctx.restore();
      }
    }

    /* The mark a blast leaves on the floor: a dark burn with an ember rim that
       cools first, and a few cracks out of its heart. Drawn under the tops. */
    function drawScorches() {
      var i, j, c, k, glow, R, g;
      for (i = 0; i < scorches.length; i++) {
        c = scorches[i]; R = c.r;
        k = 1 - c.t / c.life;
        glow = clamp(1 - c.t / 0.9, 0, 1);
        ctx.save();
        g = ctx.createRadialGradient(c.x, c.y, 1, c.x, c.y, R * 0.62);
        g.addColorStop(0, rgba("#050203", 0.62 * k));
        g.addColorStop(0.6, rgba("#140606", 0.42 * k));
        g.addColorStop(1, rgba("#140606", 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(c.x, c.y, R * 0.62, 0, TAU); ctx.fill();
        ctx.lineCap = "round";
        ctx.strokeStyle = rgba(glow > 0 ? "#ff7a3d" : "#050203", glow > 0 ? 0.25 + 0.6 * glow : 0.5 * k);
        ctx.lineWidth = 3;
        for (j = 0; j < c.cracks.length; j++) {
          var a = c.cracks[j].a, l = c.cracks[j].len * R;
          ctx.beginPath();
          ctx.moveTo(c.x + Math.cos(a) * R * 0.1, c.y + Math.sin(a) * R * 0.1);
          ctx.lineTo(c.x + Math.cos(a + 0.12) * l * 0.55, c.y + Math.sin(a + 0.12) * l * 0.55);
          ctx.lineTo(c.x + Math.cos(a - 0.05) * l, c.y + Math.sin(a - 0.05) * l);
          ctx.stroke();
        }
        if (glow > 0) {
          ctx.strokeStyle = rgba("#ffb000", 0.55 * glow);
          ctx.lineWidth = 6 * glow + 1;
          ctx.beginPath(); ctx.arc(c.x, c.y, R * 0.42, 0, TAU); ctx.stroke();
        }
        ctx.restore();
      }
    }

    function drawWaves() {
      for (var i = 0; i < waves.length; i++) {
        var w = waves[i], t = w.t / w.life, e = 1 - Math.pow(1 - t, 2);
        var r = CONFIG.playerR + (CONFIG.reach + 70) * e;
        var col = w.tier < 0 ? "#ff6b8a" : w.tier === 2 ? "#ffd43b" : "#7ef4ff";
        ctx.save();
        ctx.globalAlpha = (1 - t) * (w.tier < 0 ? 0.35 : 0.9);
        ctx.strokeStyle = col;
        ctx.lineWidth = 14 * (1 - t) + 2;
        ctx.beginPath(); ctx.arc(w.x, w.y, r, 0, TAU); ctx.stroke();
        ctx.globalAlpha = (1 - t) * 0.4;
        ctx.lineWidth = 30 * (1 - t) + 2;
        ctx.beginPath(); ctx.arc(w.x, w.y, r * 0.94, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    }

    function drawCombo() {
      if (combo < 2 || phase !== "spin") return;
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "900 54px -apple-system,Segoe UI,Roboto,sans-serif";
      ctx.lineWidth = 9; ctx.strokeStyle = "rgba(4,4,14,.8)";
      ctx.strokeText("x" + combo, player.x, player.y + CONFIG.playerR + 62);
      ctx.fillStyle = combo >= 10 ? "#ffd43b" : "#ff4fbe";
      ctx.fillText("x" + combo, player.x, player.y + CONFIG.playerR + 62);
      ctx.restore();
    }

    /* --- THE LEVEL LAYER (web target) ------------------------------------
       `applyLevel(d)` is the escape hatch a lerp cannot cover (docs/LEVELS.md):
       the level layer lerps the manifest's knobs first and then hands the game
       its own difficulty, 0 at the foot of the climb and 1 at the top. What
       arrives through here is everything that makes a level a DIFFERENT dish
       rather than a faster one — the band (its painting, its fence and its
       stretch of the track) and the roster of rivals that band is about.

       It is called BEFORE reset(), which is what lets it write both straight
       into place: reset -> build -> buildFloor repaints the dish and bakes the
       roster's sprites, with no call of its own.

       THE BAND COMES OFF THE LEVEL NUMBER, not off `d`. Two roads out of a
       fork have to be the same place — `web.levels.bands.from` in the manifest
       is the same [1, 7, 13, 19, 25], so the card on the map and the dish the
       round builds can only ever agree. `d` is still what everything else is
       lerped with, and `null` is the playable and the endless run at 90/90:
       no row, no band but the first, and CONFIG.endless on the clock. */
    function applyLevel(d) {
      var n = CONFIG.level | 0, i;
      if (!n || d == null) { BAND = CONFIG.bands[0]; ROW = null; return; }
      BAND = CONFIG.bands[0];
      for (i = 0; i < CONFIG.bandFrom.length; i++)
        if (n >= CONFIG.bandFrom[i]) BAND = CONFIG.bands[i];
      // Clamped rather than wrapped: a thirty-first level would otherwise start
      // the ladder again, where holding the last row reads as the top of it.
      ROW = CONFIG.levels[Math.min(CONFIG.levels.length - 1, n - 1)];
    }

    /* The three-star finish: the web shell has already played the slow
       motion, and the round ends through the game's own result so the end
       screen keeps these stat rows. Ignored by the playable, which has no
       levels — see docs/LEVELS.md. */
    return { reset: reset, onDown: onDown, update: update, render: render,
             onResize: onResize, applyLevel: applyLevel,
             levelWon: finish };
  })();

