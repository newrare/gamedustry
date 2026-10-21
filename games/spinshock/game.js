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
    intro: { logo: "logo", demo: "tap", caption: "",
             // on a desk: SPACE or a click (shell.js, Demo)
             desk: [{ keys: ["space"], mouse: ["click"] }] },
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
    /* `seam`: every window loops on the bar, two beats of crossfade ending on
       its downbeat (docs/MUSIC.md, The seam); `cut`: the playable's window,
       one seam of pre-roll into its embedded cut. */
    music: { volume: 0.10, fade: 1.8, seam: 0.8,
             cut: { from: 0.8, length: 19.194 },
             menu: { from: 0, length: 11.142, rate: 0.85, gain: 0.5 } },
    copy: {
      start:"Play", ctaBar:"Install now", ctaEnd:"Play the full game",
      replay:"Replay the demo", scoreLabel:"Score", timeLabel:"Spin",
      endScore:"Final score", gameOver:"Tops destroyed", timeUp:"Time's up!"
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
      { scene:"backgroundPhoneBlue",   scrim:0.26, wall:"#6166ff", music:{ from:13,  length:19.194 } },  //  1-6   green:  nothing is immune to anything
      { scene:"backgroundPhoneGreen",  scrim:0.66, wall:"#66ffbf", music:{ from:38,  length:22.4 } },  //  7-12   + blue:   the fence cannot mark them
      { scene:"backgroundPhoneYellow", scrim:0.63, wall:"#ffd257", music:{ from:77,  length:25.629 } },  // 13-18   + yellow: no other top can — and purple, which splits
      { scene:"backgroundPhonePurple", scrim:0.04, wall:"#9f6bff", music:{ from:128, length:19.2 } },  // 19-24   + red:    ONLY the fence can
      { scene:"backgroundPhoneRed",    scrim:0.43, wall:"#ff7152", music:{ from:153, length:25.6 } }   // 25-30   + black:  it mends the others — and the boss
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
           ffmpeg -ss 12.2 -t 19.994 -i assets/audio/music/spinshock.mp3 \
                  -ac 1 -ar 44100 -b:a 64k music.mp3                               */
      music: "data:audio/mpeg;base64,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ayVuvPSU+Ot2bUp5DW6ULad6JYMrWOjppUr5pb9ikoiGB8hsg+SSfEeNFjUNk63risD8b8xUWPZh9N8jIi8wJ1/MIdM7AIfFwwExhZIoLuesRP2C6x7nqkJJokqKzkG9MBNcH1JP1q3xzWEH3r0KBTXjRAKKMZJwIFlHyly2Gs1knSRCLni1jRGHx+yBakt2Ymvb6VbBjbmm+svGosQ8NsZXuV0ch6HTsiyJIMVbLVvV2Myu7TknUznVSpf/27U/7K0K//tSxOeADHircYwwxwFhEW7xhgyowUUHLK+luf74vo1UCEGAAAASRBMnYcb4sZmXaF5aPHBFiR85tidZNh/oxG6t/N0m9a8agilFqzqKGL8nJxZ5qClOAsiVSgS7vWBzlodYBHBM/02NVZakK2k55F/6L23L0Vo1oyWCQ3i2DdCdG4PkcRpGRkcDchExztCcgtgR0DQ+SGcB4KSShalGwrPWjUfVO5L1Vxc/tPOzaFxwcTuPVZGVP//XzxtX/Hx9f+n1MRTcs/3/9/dpfw+JLDb/+1LE54AL4Ld1hhhPgX2RbvGGDLi3EFOFU8k+dF5lXoosVgBQEAeH/YwhwcMKBYq5rOWzskcq7DsNMSXw7LVAdBA3DgDkhBFNiYQY7xuIMdzyIZEoeD5uTymoNrGvgJHDjxEDwclo9Itakmw2SYmTXjvOxpX9b5caMm/ZBj/w525aonYhUur3Nr3br5ahXEU09vu/ejMRM7ad3onWQoFkgss+eWLgUuOBRLraVrPSH/6RT/+tRbshKJQJgACKFuNJRHEpTRVLKbyHO06aKphMSv/7UsTmAAwFLXWHpE2BUxSuLPSNcOROJEknIgFEeCowGng08FTvLHgaPRFInhKGxK7PZY9/UeU9YKxK4sHPLPEpYGf6j3BX/9Z3iJVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxOmADRUtdZT0AAJIpy2XMLAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEygPKSDdRvPMAMAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==",
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
      var i, k;
      /* The tops are sized in design px, so the only thing a resize can change
         about them is the device ratio their backing store is cut at: the
         player's five tiers are baked once per ratio and kept across rounds. */
      if (view.dpr !== topDpr) {
        if (topCvs) for (i = 0; i < topCvs.length; i++) freeCanvas(topCvs[i]);
        for (k in foeCv) freeCanvas(foeCv[k]);
        foeCv = {};
        topDpr = view.dpr;
        topCvs = [];
        for (i = 0; i < SPIN_TIERS.length; i++) topCvs.push(playerTop(SPIN_TIERS[i]));
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

    // The player's top in one tier of its colour ramp (SPIN_TIERS).
    function playerTop(t) {
      return makeTop(CONFIG.playerR, { teeth: 14, amp: 15, arms: 3, plate: "#1b1a4e",
                                       rim: t.rim, arm: t.arm, core: t.core });
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
      if (!t.perfectOnly) meet(t);
      return f;
    }

    /* A LIVERY MET FOR THE FIRST TIME is a notice, once per player ever
       (Notify.learn), and its line in the log opens that colour's page of the
       guide. The boss is told by spawnBoss. Keyed by the livery's letter,
       the first of a type's key ("bl" a large blue). Green, the baseline with
       no immunity, has nothing to decode and is not named. */
    var MEET = {
      b: ["blue",   "Blue top",   "The fence can't damage a blue top"],
      y: ["yellow", "Yellow top", "Other tops can't damage a yellow top"],
      r: ["red",    "Red top",    "Only the fence damages a red top"],
      k: ["black",  "Black top",  "A black top mends the tops it touches"],
      p: ["purple", "Purple top", "A large one splits in two"]
    };
    function meet(t) {
      var m = MEET[t.key.charAt(0)];
      if (m && phase === "spin") Notify.learn(m[0], m[1], { sub: m[2] });
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
      /* The first boss ever is the lesson, and its line in the log opens the
         boss's page. Later arrivals say nothing: the alarm and the glow do. */
      Notify.learn("boss", "Boss top", { sub: "Perfect taps only" });
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
      if (f.type.perfectOnly) Sound.clip("crash", 0.8, 0.7);
      else Sound.clip("crash", 0.42, 1.35);
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
      Pop.show("danger", { word: "Wrecked", hold: 900,
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
      /* The wear, met once per player (Notify.learn keeps the memory); the
         flag only spares this frame loop a Store read once it has asked. */
      if (!wornSaid && cap <= 0.62) {
        wornSaid = true;
        Notify.learn("wear", "Worn bearings", { sub: "Max spin drops over time" });
      }

      // Spinning-out alarm, armed once per dive into the red. The edge glow is
      // a DOM write, so it is only touched when the danger state flips.
      if (warnArmed && spin <= CONFIG.warnAt * cap) {
        warnArmed = false;
        Sound.clip("warn", 0.6, 1);
        Notify.say("Spinning out", { sub: "Shock to recover", kind: "warn" });
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

      var i, f;

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
        if (phase === "spin") drawTell(f, gapOf(f));
        drawIntent(f, fade);
        blit(foeCv[f.type.key], f.x, f.y, f.ang, 1, fade);
        drawMarks(f, fade);
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

    /* The telegraph that tells the player when to tap: a ring round a rival
       inside the reach, white, then cyan for a GREAT, then gold with a second
       ring for a PERFECT. */
    function drawTell(f, gap) {
      if (gap > CONFIG.reach) return;
      var tier = tierOf(gap);
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

    /* A white flash on the frame a shell point goes — and a shell point just
       handed back by a black top: the same flash, in the healer's own green,
       so a repair never reads as a hit landing. */
    function drawMarks(f, fade) {
      if (f.flash > 0) {
        ctx.globalAlpha = clamp(f.flash / 0.16, 0, 1) * 0.55 * fade;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(f.x, f.y, f.type.r * 0.92, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (f.mend > 0) {
        ctx.globalAlpha = clamp(f.mend / 0.4, 0, 1) * 0.5 * fade;
        ctx.fillStyle = "#8affc0";
        ctx.beginPath(); ctx.arc(f.x, f.y, f.type.r * 0.92, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
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

    /* --- the guide: every rule, as pages (packages/webshell/guide.js) -----
       Every page SHOWS before it tells, and what it shows is drawn by the
       round's own renderers — the same sprites (makeTop), the same pips
       (drawShell), the same telegraphs (drawTell, drawIntent), trails
       (drawTracks), blast (drawBlasts) and spin bar (drawGauge) — on a canvas
       of the page's own. `stage` lends them that canvas as `ctx` and a
       staged copy of the few globals they read, for the length of one
       synchronous call, and puts the round's back in `finally`: the guide
       can open before any round (from the Help card), and over one, without
       reading or touching its state. Every figure in a row is read off
       CONFIG, so the guide cannot drift from the tables the round plays. */
    var guideCv = {}, guideDpr = 0;
    function jitter(n) {
      var a = [], i;
      for (i = 0; i <= n; i++) a.push(i && i < n ? Rand.range(-1, 1) : 0);
      return a;
    }
    function stage(W, H, zoom, fn) {
      var k = view.dpr || 1, cv = document.createElement("canvas"), kk;
      if (guideDpr !== k) { for (kk in guideCv) freeCanvas(guideCv[kk]); guideCv = {}; guideDpr = k; }
      var keep = [ctx, phase, spin, spinLag, elapsed, gauge, gaugeT, gaugePunch,
                  foeCv, tracks, blasts, arcSeg, boltSeg];
      cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx = cv.getContext("2d"); ctx.scale(k * zoom, k * zoom);
      phase = "spin"; spin = spinLag = 0.8; elapsed = 0; gaugeT = 0; gaugePunch = 0;
      foeCv = guideCv; tracks = []; blasts = []; arcSeg = jitter(8); boltSeg = jitter(16);
      try { fn(); } finally {
        ctx = keep[0]; phase = keep[1]; spin = keep[2]; spinLag = keep[3]; elapsed = keep[4];
        gauge = keep[5]; gaugeT = keep[6]; gaugePunch = keep[7]; foeCv = keep[8];
        tracks = keep[9]; blasts = keep[10]; arcSeg = keep[11]; boltSeg = keep[12];
      }
      return cv;
    }
    // A rival as the round draws it: its telegraph, its sprite, its pips.
    function gFoe(key, x, y, o) {
      var t = CONFIG.foeTypes[key];
      o = o || {};
      if (!guideCv[key]) guideCv[key] = makeTop(t.r, t);
      var f = { type: t, x: x, y: y, ang: o.ang || 0.6, hp: o.hp == null ? t.hp : o.hp, hpMax: t.hp,
                vx: o.vx || 0, vy: o.vy || 0, age: 0, inside: true, cruise: cruiseOf(t),
                pulse: o.hold ? "hold" : "dash", pulseT: CONFIG.pulseHold * (1 - (o.hold || 0)),
                aimX: o.aimX || 0, aimY: o.aimY || 0, flash: o.flash || 0, mend: o.mend || 0 };
      if (o.gap != null) drawTell(f, o.gap);
      drawIntent(f, 1);
      blit(guideCv[key], x, y, f.ang, 1, 1);
      drawMarks(f, 1);
      drawShell(f, 1);
    }
    // The player's top at a given spin, its two tiers cross-faded as in a round.
    function gPlayer(x, y, s, sc) {
      spin = s;
      var pos = tierPos(), lo = Math.floor(pos), hi = Math.min(lo + 1, SPIN_TIERS.length - 1);
      if (!guideCv["top" + lo]) guideCv["top" + lo] = playerTop(SPIN_TIERS[lo]);
      if (!guideCv["top" + hi]) guideCv["top" + hi] = playerTop(SPIN_TIERS[hi]);
      blit(guideCv["top" + lo], x, y, 0.4, sc || 1, 1);
      if (pos - lo > 0.02) blit(guideCv["top" + hi], x, y, 0.4, sc || 1, pos - lo);
    }
    // The spin bar, at a spin and a point of the wear.
    function gGauge(x, y, h, s, at) {
      spin = spinLag = s; elapsed = at;
      gauge = { x: x, y: y, w: GAUGE_W, h: h };
      drawGauge();
    }
    // A trail on the floor, fading from its tail to its head.
    function gTrail(col, w, pts) {
      var out = [], i, n = pts.length;
      for (i = 0; i < n; i++) out.push({ x: pts[i][0], y: pts[i][1], a: 0.2 + 0.8 * i / (n - 1) });
      tracks = [{ col: col, w: w, pts: out }];
      drawTracks();
      tracks = [];
    }
    function line(x0, y0, x1, y1, n) {
      var p = [], i;
      for (i = 0; i <= n; i++) p.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
      return p;
    }
    // A yellow's saw: straight runs off the line, flipping side at `amp`.
    function saw(x0, y0, x1, y1, amp, per) {
      var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, p = [], d, q;
      for (d = 0; d <= L; d += per / 4) {
        q = (d / per) % 1; q = q < 0.5 ? q * 4 - 1 : 3 - q * 4;
        p.push([x0 + ux * d - uy * q * amp, y0 + uy * d + ux * q * amp]);
      }
      return p;
    }
    function livery(c) { return CONFIG.foeColours[c]; }
    function pct(v) { return "-" + Math.round(v * 100) + "%"; }

    var guide = {
      chapters: function () {
        var S = CONFIG.foeSizes, B = CONFIG.boss;
        return [
          { key: "basics", label: Lang.t("The basics"), pages: [
            { id: "tap", title: Lang.t("Tap on the impact"), pic: function () {
                return stage(500, 300, 0.85, function () {
                  gPlayer(294, 215, 0.85);
                  gFoe("gs", 294 - 208 * 0.906, 215 - 208 * 0.423, { gap: 100 });
                  gFoe("gs", 294, 215 - 158, { gap: 50 });
                  gFoe("gs", 294 + 123 * 0.906, 215 - 123 * 0.423, { gap: 15 });
                });
              },
              lines: [Lang.t("Tap just before a rival hits you. Your shockwave throws it back and wins you spin."),
                      Lang.t("The closer to the impact you tap, the more it pays. A gold ring means a perfect.")] },
            { id: "spin", title: Lang.t("The spin gauge"), pic: function () {
                return stage(500, 290, 1, function () {
                  gPlayer(115, 145, 0.9, 0.8); gGauge(220, 20, 250, 0.9, 0);
                  gPlayer(345, 145, 0.2, 0.8); gGauge(450, 20, 250, 0.2, 0);
                });
              },
              rows: [[Lang.t("A miss"), pct(CONFIG.whiffCost)]],
              lines: [Lang.t("Your top keeps slowing down. Every rival that hits you costs spin."),
                      Lang.t("At zero your top blows apart and the round ends.")] },
            { id: "shell", title: Lang.t("Shell points"), pic: function () {
                return stage(480, 220, 1, function () {
                  gFoe("gl", 95, 110, { hp: 4 });
                  gFoe("gl", 245, 110, { hp: 2, flash: 0.1 });
                  gFoe("gs", 385, 110, { hp: 1 });
                });
              },
              rows: [[Lang.t("A perfect"), "-" + CONFIG.perfectDmg]],
              lines: [Lang.t("The notches around a rival are its shell points. It blows apart when it loses the last one."),
                      Lang.t("Your shockwave, the fence and a crash into another top each take one point.")] },
            { id: "combo", title: Lang.t("Combos and chains"), pic: function () {
                return stage(500, 300, 0.85, function () {
                  gPlayer(294, 230, 0.7);
                  gFoe("gs", 294 - 148 * 0.866, 230 - 148 * 0.5, { gap: 40 });
                  gFoe("gl", 294 + 152 * 0.819, 230 - 152 * 0.574, { gap: 18 });
                });
              },
              rows: [[Lang.t("Spin every 5 hits"), "+" + Math.round(CONFIG.comboSpin * 100) + "%"],
                     [Lang.t("A KO pays the rival's score"), "×" + CONFIG.koScore]],
              lines: [Lang.t("Every shockwave that hits adds one to the combo. A miss, or a rival hitting you, breaks it."),
                      Lang.t("One wave can hit several tops. A double or triple shock wins extra spin.")] },
            { id: "wear", title: Lang.t("Worn bearings"), pic: function () {
                return stage(510, 290, 1, function () {
                  gPlayer(60, 145, 0.8, 0.55);  gGauge(130, 20, 250, 0.8, 0);
                  gPlayer(230, 145, 0.4, 0.55); gGauge(300, 20, 250, 0.4, 60);
                  gPlayer(400, 145, 0.12, 0.55); gGauge(470, 20, 250, 0.12, 110);
                });
              },
              lines: [Lang.t("As the round goes on, your top holds less and less spin."),
                      Lang.t("Even a flawless run ends, so score while the bearings last.")] }
          ] },
          { key: "spark", label: Lang.t("Spark"), pages: [
            { id: "green", title: Lang.t("Green top"), lv: 1, pic: function () {
                return stage(480, 260, 1, function () {
                  gTrail(livery(0).rim[0], 1, line(20, 20, 220, 70, 8));
                  gTrail(livery(0).rim[0], 1, line(30, 250, 250, 190, 6));
                  gPlayer(410, 130, 0.85, 0.8);
                  gFoe("gs", 220, 70); gFoe("gl", 250, 190);
                });
              },
              lines: [Lang.t("Green tops have no protection. Your tap, the fence and other tops all damage them.")] },
            { id: "builds", title: Lang.t("Small and large"), lv: 3, pic: function () {
                return stage(420, 200, 1, function () { gFoe("gs", 130, 100); gFoe("gl", 290, 100); });
              },
              rows: [[Lang.t("A small rival hits you"), pct(S[0].cost)], [Lang.t("A large rival hits you"), pct(S[1].cost)]],
              lines: [Lang.t("A large top is slow, but costs far more spin when it hits you.")] }
          ] },
          { key: "insulated", label: Lang.t("Insulated"), pages: [
            { id: "blue", title: Lang.t("Blue top"), lv: 7, pic: function () {
                return stage(500, 300, 1, function () {
                  gTrail(livery(1).rim[0], 1, line(10, 280, 120, 150, 6));
                  gPlayer(420, 150, 0.85, 0.8);
                  gFoe("bl", 120, 150, { hold: 0.65, aimX: 1, aimY: 0 });
                });
              },
              lines: [Lang.t("Blue tops stop, charge, then dash along the dashed line."),
                      Lang.t("The fence can't damage blue tops. Use your tap, or throw other tops into them.")] }
          ] },
          { key: "split", label: Lang.t("Split"), pages: [
            { id: "yellow", title: Lang.t("Yellow top"), lv: 13, pic: function () {
                return stage(500, 280, 1, function () {
                  gTrail(livery(2).rim[0], livery(2).trail, saw(10, 250, 290, 150, 40, 110));
                  gPlayer(420, 140, 0.85, 0.8);
                  gFoe("yl", 290, 150);
                });
              },
              lines: [Lang.t("Other tops can't damage yellow tops. Use your tap and the fence instead.")] },
            { id: "purple", title: Lang.t("Purple top"), lv: 16, pic: function () {
                return stage(480, 260, 1, function () {
                  var c = livery(5).rim[0];
                  gTrail(c, 1, [[150, 125], [200, 105], [250, 70], [300, 75], [330, 70]]);
                  gTrail(c, 1, [[150, 140], [210, 170], [260, 160], [320, 190], [380, 200]]);
                  gFoe("pl", 110, 130); gFoe("ps", 330, 70); gFoe("ps", 380, 200);
                });
              },
              lines: [Lang.t("A large purple top blows apart into two small ones. One top becomes three.")] }
          ] },
          { key: "grounded", label: Lang.t("Grounded"), pages: [
            { id: "red", title: Lang.t("Red top"), lv: 19, pic: function () {
                return stage(520, 280, 1.25, function () {
                  gTrail(livery(3).rim[0], 1, line(-20, 112, 60, 112, 4));
                  blasts = [{ x: 330, y: 112, r: CONFIG.blastR[0], t: 0.08, col: livery(3).rim[0],
                              rays: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) {
                                return { a: i / 12 * TAU + 0.15, len: i % 2 ? 0.8 : 1.1, w: 0.07 };
                              }) }];
                  drawBlasts();
                  gFoe("rs", 60, 112, { vx: 650, vy: 0 });
                });
              },
              lines: [Lang.t("Red tops blow up on the first thing they touch. Only the fence damages them."),
                      Lang.t("Send a red top into the fence with your shockwave. Its blast hits every rival around it.")] }
          ] },
          { key: "overcharge", label: Lang.t("Overcharge"), pages: [
            { id: "black", title: Lang.t("Black top"), lv: 25, pic: function () {
                return stage(480, 280, 1, function () {
                  var pts = [], a, R = CONFIG.playerR + 52 + CONFIG.reach * CONFIG.circleGap;
                  for (a = -2.4; a <= -Math.PI / 2 + 0.001; a += 0.08) pts.push([170 + R * Math.cos(a), 140 + R + R * Math.sin(a)]);
                  gTrail(livery(4).rim[0], 1, pts);
                  gFoe("kl", 170, 140);
                  gFoe("gl", 270, 165, { hp: 3, mend: 0.3 });
                });
              },
              lines: [Lang.t("Black tops give a shell point back to every rival they touch. Take them out first.")] },
            { id: "boss", title: Lang.t("Boss top"), lv: 27, pic: function () {
                return stage(420, 280, 1, function () { gFoe("boss", 210, 140, { gap: 15 }); });
              },
              rows: [[Lang.t("Shell points"), String(B.hp)], [Lang.t("The boss hits you"), pct(B.cost)]],
              lines: [Lang.t("Only a perfect tap damages the boss, one point at a time. Everything else glances off.")] }
          ] }
        ];
      }
    };

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
             levelWon: finish, guide: guide };
  })();

