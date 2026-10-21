  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Marshmelt",
    /* One sentence, three coloured words: the gesture, the character, the
       threat — exactly what the stage below acts out. */
    tagline: "<b class=\"w-tap\">Tap</b> where you aim to fling the <b class=\"w-mallow\">marshmallow</b> from rock to rock over the <b class=\"w-lava\">lava</b>",
    gameSeconds: 0,                  // endless: the run ends in the lava
    storeUrl: {
      ios:     "https://newrare.app/#playables",
      android: "https://newrare.app/#playables",
      fallback:"https://newrare.app/#playables"
    },
    designWidth: 720, designHeight: 1280, bg: "#180a10",
    layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 26 },

    /* The painted scene goes behind the ROUND too, not just behind the intro
       and the end screen: assets/image/embed/marshmelt-background-phone-NN.webp replaces the
       pre-rendered cavern this game used to draw as its own ground. The motor puts it in
       as a CSS layer under the canvas (Art.dressFrame), and render() below asks
       Art.scene() before painting a ground of its own. */
    sceneArt: true,
    intro: { logo: "logo", demo: "tap", caption: "",
             // the fling lands where the pointer is: a mouse game on a desk
             desk: [{ mouse: ["aim", "click"] }] },
    /* No clock: the right-hand pill carries the chain instead, and the only
       thing that can end a run is the lava climbing into the marshmallow. */
    hud: { score: true, timer: false },
    /* The bed: one 177 s track (assets/audio/music/marshmelt.mp3), a window of
       it per biome (`music` on ladder.biomes) and its calm opening, slowed and
       halved, for the menus — docs/MUSIC.md. */
    /* `seam`: every window loops on the bar, two beats of crossfade ending on
       its downbeat (docs/MUSIC.md, The seam); `cut`: the playable's window,
       one seam of pre-roll into its embedded cut. */
    music: { volume: 0.11, fade: 1.6, seam: 0.8,
             cut: { from: 0.8, length: 25.575 },
             menu: { from: 0, length: 35.203, rate: 0.85, gain: 0.5 } },
    copy: {
      start:"Tap to play", ctaBar:"Install now", ctaEnd:"Play the full game",
      replay:"Replay the demo", scoreLabel:"Score", timeLabel:"Chain",
      endScore:"Final score", gameOver:"Melted!", timeUp:"Time's up!"
    },

    /* --- the marshmallow ---------------------------------------------------
       A tap is a whole shot: the marshmallow leaves along the line from itself
       to the finger, at ONE fixed speed. Nothing to drag, nothing to release in
       a direction — holding only previews the arc, it never charges it. */
    /* The body is a CUBE, the way a marshmallow out of the bag is: `mallowLen`
       is its size along the axis it plants itself on (its height, standing on a
       rock) and `mallowR` half its width. Near-square on purpose — a capsule
       read as a pill, not as something you would eat. */
    mallowLen: 62,          // body length along the planting axis (design px)
    mallowR: 29,            // half its width
    /* How the body is DRAWN, which is not the axis it is planted on. It carries
       a face, so it stays upright and only leans: planted on the underside of a
       rock, or diving, the planting axis points at the floor and a face rigidly
       bolted to it would hang upside down. */
    leanMax: 0.55,          // rad — the most it ever tips
    leanEase: 11,           // 1/s — how fast it rights itself
    gravity: 1500,          // px/s^2 while flying
    flingSpeed: 1240,       // px/s a tap launches at
    aimMinDist: 34,         // a tap closer than this to the body is ignored
    aimSlow: 0.15,          // time scale under the finger, at FULL focus

    /* --- the focus meter ----------------------------------------------------
       The slow motion is a resource, not a mode. It drains while the finger is
       down and the benefit fades WITH it — hold for a second and the world is
       already back to half speed, hold to empty and it runs at full speed under
       your finger. It comes back on its own, and faster if you land: the way to
       keep the slow motion is to keep moving, which is the whole point. The
       preview arc shortens with it too, so a long deliberation buys less
       information as well as less time. */
    focusSeconds: 0.7,      // seconds of full-strength slow motion, from full.
                            //    Short on purpose: it is a beat to read the
                            //    board with, not a pause to plan the round in —
                            //    half of it is gone by 0.35 s.
    focusDelay: 1.2,        // ...and it does not even START coming back until
                            //    the finger has been off for this long, so
                            //    dipping in and out costs the same as staying
    focusRefill: 3,         // seconds to come all the way back from empty
    focusClaim: 0.14,       // what a FRESH rock hands straight back — landing
                            //    is the way back, not waiting
    wallBounce: 0.55,       // the cave walls bounce, the ceiling too
    embed: 0.4,             // fraction of the body sunk into what it sticks to
    /* A landing does not perch on the silhouette: the body slides inward and
       holds on near the MIDDLE of the structure, which is what makes a spinning
       rock carry it around instead of flicking it off the rim. */
    gripCenter: 0.78,       // how far from the surface toward the centre it goes
    gripSpeed: 7,           // 1/s — how fast that inward slide plays out
    previewSeconds: 1.2,    // how far ahead the dotted arc is drawn
    /* One recovery shot in mid-air, recharged by every FRESH rock. Without it a
       single misread is a 600 px fall with nothing to touch on the way down —
       measured on a headless pilot, half the runs ended that way inside three
       seconds. It is also the skill: the chain pays for landings, so the shot
       is worth hoarding rather than spending on the first wobble. */
    airShots: 1,
    stickPad: 9,            // px of slack on the capture radius — it IS sticky

    /* --- the rocks ---------------------------------------------------------
       Two fall lanes, drawn per rock: most of them drift down slowly, a third
       come through fast. Reading which is which IS the timing game, so a fast
       one carries a smear behind it. They also bounce off one another, and a
       bounce decays back into the lane the rock was given — otherwise a knock
       upward would take a rock off the ceiling and never give it back. */
    rockMinR: 34, rockMaxR: 104,
    fallMin: 128, fallMax: 215,     // the slow lane, px/s, before the ramp
    fastMin: 305, fastMax: 430,     // the fast lane
    fastChance: 0.4,                // how often a rock is drawn from it
    fastRead: 265,                  // above this a rock is drawn with a smear
    driftMax: 44,                   // px/s of sideways drift
    fallSettle: 1.7,                // 1/s — how fast a bounce decays back
    rockBounce: 0.86,               // restitution between two structures
    spinMax: 0.62,                  // rad/s — the anchor rides the spin, which
                                    // is what keeps a landing from being final
    knockSpin: 0.0009,              // rad/s of spin a collision imparts, per px/s
    /* Fewer rocks than there is room for, on purpose: a crowded fall hid the
       action and handed a recovery to every miss. */
    spawnEvery: 0.9, spawnMin: 0.55,
    maxRocks: 6, minRocks: 3,
    recoil: 0.1,                    // how much a jump kicks the rock it leaves

    /* --- the fireballs -----------------------------------------------------
       Not deadly on contact — the lava already punishes a bad read. A fireball
       is a rock that gives you a beat and a half and then shrugs you off,
       toasting the marshmallow one shade on the way. */
    fireMinR: 30, fireMaxR: 56,
    fireChance0: 0.1, fireChance1: 0.32,   // a fall of six rocks has room for few
    fireFall: 1.3,                  // they fall faster than rock
    fireHold: 1.15,                 // seconds before it throws the body off
    fireEject: 470,                 // px/s it is thrown with

    /* --- the lava ----------------------------------------------------------
       Anything whose base touches the surface CATCHES FIRE: it blazes on the
       crust for a couple of seconds — a fireball now, so it will not hold the
       body for long — and only then melts away. */
    lavaStart: 0.07,                // fraction of the play band it fills at t=0
    lavaEnd: 0.3,                   // ...and once the rise is over
    riseSeconds: 78,
    burnSink: 46,                   // px/s a burning structure settles at
    burnSeconds: 1.7,               // how long it blazes before it melts
    /* The toast IS the life, four states: white (full), golden (one hit
       taken), toasted (two), charred — and a hit on a charred marshmallow is
       the end of the run. A HIT is staying on a fireball until it throws the
       body off, or the serpent's bite. The LAVA is three hits at once: a
       white marshmallow comes out of it charred, thrown back up; anything
       browner melts. Only the s'mores heal: a s'more (a biscuit and a
       chocolate) gives one state back, a super s'more makes it white. */
    lavaHits: 3,
    lavaBounce: 1500,               // px/s the lava throws the body back up at —
                                    //    into the upper half, clear of the
                                    //    burning rocks crowding the crust
    lavaGrace: 1.2,                 // seconds the lava cannot catch it again
    /* ...and it is FELT: a browner marshmallow is a heavier one, every shade
       takes this much off its jump. The HUD's left pill counts the lives. */
    toastSlow: 0.08,
    /* A falling fireball is a rock with an AURA behind it — red, yellow or
       violet, one per rock — rather than flames painted over it. */
    auras: ["#ff3b30", "#ffd166", "#b56bff"],
    /* The air over the lava shimmers: the band just above the crust is
       redrawn in thin strips, each nudged sideways on a slow wave, strongest
       at the crust. It moves what the canvas draws (the lake, the rocks, the
       body) — the painted scene is a CSS layer under it and stays still. */
    haze: { band: 230, below: 70, amp: 2.6, strip: 4 },

    /* --- the climb's other hands (web levels, a row of ladder.levels each) --
       A giant lava BUBBLE rises out of the lake: land on it and it carries
       the body up, then pops. */
    orbEvery: 4.5,          // seconds between two bubbles, +-25%
    orbRise: 120,           // px/s it climbs at
    orbLife: 5,             // seconds before it pops on its own
    orbKick: 700,           // px/s a pop throws the body up at
    orbMinR: 46, orbMaxR: 62,
    /* COLD WATER drips off the ceiling: on the lake it sets a CRUST, the one
       place the body may stand on the lava, for a few seconds; on a fireball
       or a burning rock it puts the fire out. */
    waterEvery: 3.2, waterForm: 0.5, waterR: 11,
    crustR: 100,            // half the crust's width (it is a flat plate)
    crustLife: 6,           // seconds before it cracks back into the lake
    /* ...and every crust COOLS the lake: the lava drops by coolDrop, up to
       coolMax below where it would be, and climbs back at coolBack — so the
       water buys height on the only clock the game has. */
    coolDrop: 26, coolMax: 120, coolBack: 4,
    /* MAGNET CRYSTALS hang in the cave. Their field pulls the body in flight
       toward them, the crystal CATCHES it — a perch that never falls — and
       the jump out of it is a charged one, higher than any rock gives. Then
       it holds no more than a beat, and goes dark for a while once used. */
    magnetR: 230,           // the field's radius, drawn
    magnetPull: 3400,       // px/s^2 at the centre, falling to 0 at the rim
    magnetCore: 30,         // the crystal itself, what catches
    magnetHold: 1.6,        // seconds it holds the body before throwing it up
    magnetBoost: 1.35,      // the jump out of it, against a rock's
    magnetCool: 5,          // seconds dark after a launch
    /* The LAVA SERPENT: a swirl on the lake, then a leap across it in an arc.
       It breaks the rocks it goes through and bites the body. */
    serpentEvery: 7,        // seconds between two leaps, +-25%
    serpentWarn: 1.3,       // the swirl before one
    serpentLeap: 1.6,       // the leap itself
    serpentSegs: 11,
    /* S'MORES: a biscuit and a chocolate drift down; catch one of each and
       the s'more takes a shade of toast off, or doubles the points for a
       while when there is none to take. */
    smoreEvery: 6, smoreFall: 70, smoreR: 24,
    smoreBoost: 10,         // seconds of double points
    superChance: 0.2,       // the share of treats that fall as a whole SUPER s'more

    /* --- difficulty -------------------------------------------------------- */
    rampSeconds: 65,
    fallRamp: 0.75,                 // extra fall speed at the top of the ramp

    /* --- scoring ----------------------------------------------------------- */
    baseScore: 10,
    heightBonus: 42,                // full bonus for landing at the ceiling
    chainStep: 0.25, chainMax: 4,   // multiplier per rock in the chain, capped
    milestone: 10,                  // rocks between two callouts

    /* --- the special rocks (web levels) -------------------------------------
       Four rocks that are not a resting place, each read by its own material
       before the body ever touches it. None of them is in the playable: only
       a row of `ladder.levels` puts one in the fall. */
    iceHold: 0.3,           // an ICE rock holds the body this long...
    iceKick: 1180,          // ...then throws it straight up, at this speed
    shardHold: 1.0,         // a CRACKED rock splits this long after the first touch
    shardKick: 170,         // px/s its pieces fly apart at
    dustHold: 0.85,         // a CRUMBLING rock falls to dust this long after it
    bombHold: 2,            // a BOMB blows this long after the first touch
    bombReach: 170,         // px past its rim the blast still throws the body
    bombKick: 1250,         // px/s it throws the body at, point blank
    bombShove: 520,         // px/s it gives the rocks around it

    /* --- the geysers --------------------------------------------------------
       A vent in the lava that blows a column of steam to the ceiling on a
       cycle: it rests, it bubbles (the warning), it blows. The column lifts
       the body in flight and whatever rock it holds — a free climb for the
       one who reads it, a shot thrown off course for the one who does not. */
    geyserIdle: 3.6,        // seconds between two blasts, +-25%
    geyserWarn: 0.9,        // the bubbling before one
    geyserBlast: 1.2,       // the blast itself
    geyserHalf: 54,         // half the column's width
    geyserPush: 5200,       // px/s^2 up, on the body in flight...
    geyserMax: 1150,        // ...up to this upward speed
    geyserRock: 1900,       // px/s^2 up on a rock in the column...
    geyserRockMax: 360,     // ...up to this

    /* --- the core: the lava itself turns on the player ---------------------- */
    surgeEvery: 7.5,        // seconds of calm between two surges
    surgeWarn: 1.4,         // the crust flashes red this long before one
    surgeUp: 0.6, surgeHold: 0.9, surgeDown: 1.5,
    surgeHeight: 0.17,      // fraction of the play band a surge climbs
    dropEvery: 2.4,         // seconds between two drops off the ceiling, +-25%
    dropForm: 0.8,          // a drop swells on the ceiling this long first
    dropR: 13,
    dropGravity: 1400,
    dropKnock: 260,         // px/s a drop knocks the body down at

    /* --- the climb (web target) ---------------------------------------------
       Read by `applyLevel` (section 6); the playable never calls it, so it
       keeps the caldera it shipped with. The manifest's `levels.tune` lerps
       the pressure over the thirty levels and this table says what each one
       IS. The first four biomes bring ONE mechanic per level, each over two
       levels — met weakly first, then for real — so every level is the one
       where something is new: classic rocks, claimed rocks, fireballs, the
       surges; ice, cold water, magnets; geysers, bubbles, the serpent;
       split rocks, crumbling rocks, bombs. The temple then THEMES its six
       levels, three or four of those at once.

       A biome is also a PLACE and a SOUND: `music` is its window of the bed
       (docs/MUSIC.md — the windows climb the track as the levels climb the
       map, each one cut on a change of the arrangement) and `scene` is its
       painted backdrop
       (`assets/image/master/marshmelt-background-phone-NN.png`), moved under
       the round and the end screen by `Art.backdrop` in reset(). The first
       one is the playable's and the one the intro, the menu and the map
       wear (tools/build/build.mjs, SCENE_SET).

       `from` is the first level of each biome — the same numbers as
       `web.levels.bands.from` in the manifest, which names them. `ease` eases
       the pressure (the lava's rise and the fast lane) on the first two
       levels of a biome, so a new rock is met before the squeeze comes back.

       A row: `claimed` is the share of rocks that fall already taken (dark,
       they break the chain), `water`, `orbs`, `serpent` and `surge` are
       intensities — 0.5 is the weak first meeting (half as often, a lower
       surge), 1 the full one — `intro` is what the level announces, a
       mechanic's key or a temple theme's. `goal` is the level's objective, the score its first star asks
       for (the second and third are 2x and 3x it, `web.levels.stars` —
       packages/webshell/levels.js), handed to the map by levelGoal(). It is
       MEASURED, not lerped: 0.9 x what a scripted pilot scores in 30 s of that
       biome, climbing 8 % either side of it over the biome's six levels, so
       the third star — the one that ends the round — asks for about a minute
       and a half of a pilot that never hesitates, and more of a player, with
       no more hits taken than `web.levels.faults` forgives (levelFaults). `fire` scales the
       fireball rate (0 = none), `ice` / `shard` /
       `dust` / `bomb` are the share of the rocks drawn as that special,
       `geysers` how many vents, `surge` and `drops` turn the core's two
       hazards on, `orbs`, `water` and `serpent` three more (the bubble
       to ride, the drips that set a crust, the leap), `magnets`
       how many crystals hang in the cave, `smores: 0` keeps the treats out
       (they fall on every other level), and `intro` names what the round announces on its first
       second — only on the level where it first appears. `endless` is the
       run a perfect board unlocks: all of it at once. */
    ladder: {
      from: [1, 7, 13, 19, 25],
      biomes: [
        // the lava cave: the track's gentle opening, after its first bars
        { key:"caldera", ember:"#ff9d2e", scene:"backgroundPhone01", music: { from: 12, length: 25.575 } },
        // the crystal cave: the full groove, in after the break at 40-44.5 s
        { key:"frost",   ember:"#bfefff", scene:"backgroundPhone02", music: { from: 44.75, length: 25.598 } },
        // the jungle gorge: the second half of that groove
        { key:"geysers", ember:"#ffe27a", scene:"backgroundPhone03", music: { from: 69.75, length: 25.604 } },
        // the dead forest: the thinner, nervous middle section
        { key:"faults",  ember:"#c9b8a0", scene:"backgroundPhone04", music: { from: 96.5, length: 25.604 } },
        // the serpent temple: the loudest stretch of the track
        { key:"core",    ember:"#ff5a1f", scene:"backgroundPhone05", music: { from: 121.75, length: 24.016 } }
      ],
      ease: [0.82, 0.92, 1, 1, 1, 1],
      levels: [
        // the lava cave: the rocks, the rocks already taken, the fire, the lake
        { goal:1400, fire:0, smores:0 },                         // 1  classic rocks
        { goal:1450, fire:0, claimed:0.3, intro:["claimed"] },   // 2  claimed rocks
        { goal:1500, fire:0.5, intro:["fire"] },                 // 3  fireballs, a few
        { goal:1550, fire:1.2 },                                 // 4  fireballs, often
        { goal:1600, fire:0, surge:0.5, intro:["surge"] },       // 5  surges, rare and low
        { goal:1650, fire:0, surge:1 },                          // 6  surges, often and high
        // the crystal cave: ice, cold water, magnets
        { goal:1900, fire:0, ice:0.15, intro:["ice"] },
        { goal:1950, fire:0, ice:0.35 },
        { goal:2050, fire:0, water:0.5, intro:["water"] },
        { goal:2100, fire:0, water:1 },
        { goal:2150, fire:0, magnets:1, intro:["magnets"] },
        { goal:2250, fire:0, magnets:2 },
        // the jungle gorge: geysers, bubbles, the serpent
        { goal:1850, fire:0, geysers:1, intro:["geyser"] },
        { goal:1900, fire:0, geysers:2 },
        { goal:1950, fire:0, orbs:0.5, intro:["orbs"] },
        { goal:2050, fire:0, orbs:1 },
        { goal:2100, fire:0, serpent:0.5, intro:["serpent"] },
        { goal:2150, fire:0, serpent:1 },
        // the dead forest: rocks that do not last
        { goal:2300, fire:0, shard:0.15, intro:["shard"] },
        { goal:2350, fire:0, shard:0.35 },
        { goal:2450, fire:0, dust:0.15, intro:["dust"] },
        { goal:2550, fire:0, dust:0.35 },
        { goal:2600, fire:0, bomb:0.12, intro:["bomb"] },
        { goal:2700, fire:0, bomb:0.25 },
        // the serpent temple: six themes, three or four of them at once
        { goal:2250, fire:1, surge:1, bomb:0.15, intro:["furnace"] },
        { goal:2300, fire:0, ice:0.25, water:1, magnets:1, intro:["cold"] },
        { goal:2400, fire:0, geysers:2, orbs:1, magnets:1, intro:["ascent"] },
        { goal:2500, fire:0.6, shard:0.2, dust:0.2, bomb:0.15, intro:["collapse"] },
        { goal:2550, fire:0.6, serpent:1, surge:0.5, orbs:0.5, intro:["lair"] },
        { goal:2650, fire:0, serpent:1, surge:1, bomb:0.15, geysers:1, intro:["cataclysm"] }
      ],
      endless: { fire:1, ice:0.12, shard:0.1, dust:0.1, bomb:0.1, geysers:2, surge:1,
                 orbs:1, water:1, magnets:1, serpent:1 }
    }
  };

  /* ===================================================================
     2. ASSETS — embedded base64 data URIs only (no network requests ever).
     =================================================================== */
  var ASSETS = {
    images: {
      // marshmelt.png -> the app icon shown on the intro (460x460, PNG 256c).
      logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcwAAAHMCAMAAABvBWi0AAAACXBIWXMAAAAAAAAAAQCEeRdzAAAAXGVYSWZJSSoACAAAAAMAaYcNAAEAAAAyAAAAAAEEAAEAAADMAQAAAQEEAAEAAADMAQAAAAAAAAMAAaADAAEAAAABAAAAAqADAAEAAADMAQAAA6ADAAEAAADMAQAAXAAAAASzQLUAAAABc1JHQgHZySx/AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAEZ0FNQQAAsY8L/GEFAAADAFBMVEUAAAAAAAAJAxUKBBYKBBYMBRYRBRcUBhgVCBsYBhYYCR0aDCAbDSIcCRgdDiMfCBYfECkfER8fFiQfGCcgCxohECQiChciEykjDhwkGislDRsmCxsmFCIoGiYpCxcqHzArDhwtIjIvESUwDRcwER8wJDcxGyY0Dxs1IzE2FCY3Eh04DRU4IC85FiI5Jjc6EBk8Hyc8Kjw8L0Y+Exw/GyU/N09ADhRAJC5BLT9DFSJEPFNFGR1IEhdIIClJOEtJQVpKJzFLHh9NEBROKzVOPlNOR2JQGR1SICJSS2ZVMT1VR19WExVWJCVWT2xYHRtZO0xbLDJcT2deFRVeIBtfVW5iJiViLjJjWXRlGBZlQU5mIRxnMzdqSVlqX3lsGhRsKSZvIBdyLSp0GRJ0NjV0Z4B1IRd1Ul16GhB7JBl7P0B9cYyAJxuBGw6CTFSFLB+IXmaJHA2LMyaMSESManmMgJyPHg2SKxiUW1SUf4aXHwuaMR6cIgueZFyfNyOfT0ihjqmjKQymlY+nIQanPSipamauLQ6uSTWvmrGxWkezJAW2MxG5bFa9KAW9PBe9Wha/TTXEMgTGh3/HTRvIKgTJShzJq7PKSB/KX0bLnJjNQxfQOwjTMATV3wLWViDbu7zdn5XeNQTemozfSRLgXyHgeU3km4bozc3o3ebpPAXpUhbstJ7tcRntl27umnru5OnvRSTw2drxyr7zKwH2QQH2iTP2n3P3MQH32cr45OD5JwH5y6P6Wgj6cQj7QQn7gQ77p3T7zgH7zwH76N/78en8NwH8XgL8igT8sXf8tHL8wXL8w4f8zwP8zwj81Hv82aj857P858v86Nb88uX889z89+z9RgH9UQH9ZAL9awP9cwL9eAL9egP9gAL9kwb9nQj9pgj9qi79qwT9sgT9uQX9wRT9ww39xgj9zA/9zQ39zgr9zwn90iT90xz91BP91gf93Az94gn94h795Ir96h396xD97mX98jz98xj99OP99dD99+r9+4j9+7T9+/X9+/UA/wA7742mAAABAHRSTlP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AU/cHJQAAEABJREFUeJzMvWuMJdd9J/avU++qe+f2vT3dM0N2D0fizJBNUqQliqIt2ZJsx4HzWu0CjrSJd6F8CaBvWSCA88EK8mHtDzGQAEESZJHFIvGHzcJBNhth4wUWG9le75q2LFEyJZFDzlAiOe+Znr6Pua96V/6Pc+rW7e4hZyjKdnX3fXXdepzf+b8fx6rhr/fWra3aAqdSlSpA0aOqABRApaBa7Yb71FBXZQXysdL/U/JkK09eFFX7WwqUA34K+Lf64f/Ik34jr/B39NO7z49ic/6qL2Bt69Sqsmoz2ggEQmThJxYiWNHHhVMwGOZPNsQbaFJa0HxcyecCLP0V+k6tkv8tIFc2PghghKL8yNvWo36Fv32oWlMBt+lHcNMf3fbXAczHkOwgLRgOpkO94YjrN/TkFEhziKVaH86aMCSk8JulfIR7yE7NkezmRp1cdjH/0R8LVi1K/IANr4Mfu6sP/hrg+lcI5gs2jl1ZTTOmo0r4PbNLsyEoTHJEYUhahVMVehhXm0V44r/AKhynLgnFqk21dBhV+uZ1YQnOpW2+3d4+GEv+tlMUjGfrUgqnqyH+KwT1rwTMJ8tEeV3XBx9SlGGKR8hiEJEwyxbtVSIcidkSmjiWBRzGsyYcoQhoRCsFx212EWg26xRydPtDXnqx/qA3BpauDacdESvykL8KTP+SwTxnI44Q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",
    },
    sounds: {
      // music: assets/audio/music/marshmelt.mp3 — the background bed, looped and
      // crossfaded by Music (see CONFIG.music); mono 44.1 kHz / 64 kbps.
      // The playable's cut is a seam of pre-roll then the first biome's window
      // (CONFIG.music.cut), 11.2 s -> 37.575 s of the
      // master (the caldera, ladder.biomes); the web build ships the whole
      // track (web.music) and plays one window per biome.
      "music": "data:audio/mpeg;base64,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j6SiEo70SV20AgACEVnqATCA0gx4ES4Bq2gr5jHTj5PGEFmSMgN0M1KuXXfq7CyCz7VEEdTCY9qLl+tlzfNi1abvdRUUIZZn3e4oeJhGZKmI9oTd2nIDgFsqs6UcdNL/+1LE6oANoNVEbZh0iXGhq7GHjL45RHdLe3L2W5CuvBJIuqQziSbq2jFirKAWKnDAChwCFy0rU1+xueiVJIY4x6UO/SQAYkiamNF3FAy59xYybph6kj9KpYshulmq4jj7pzXVu4iWq++Kn///mH1gsRvD2Hapfzf8QF5k9191Aokos4iEAoEIiEIDigs2OUOLCrgKQLmLuDQBACvDDOfev0LLYaB/MLL/ywDjJ2j2GE+V3/4SAQwxBby5wXqdhPv/+jzkQhwhsds1ri3//87n3//7UsTjgAsoqVssPGXxcqFsaPMWbpkKxUWzWuLW///6Fq9nMhDFQXND1XmtcWt6/////lwNBUFzOtVmghioOtD/b/4/ri3/////Z0MUDgr1fHePNR95dJBUUkFRVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxOaCDTkXUy09A/FSmmqatIAHVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LE5QATKVNlWSeAGAAANIOAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==",
      // No sfx clip here: every key the game plays is a role of the house kit,
      // mapped by `sfx` in manifest.json and injected by the builder.
    }
  };

  /* ===================================================================
     6. GAME — MARSHMELT. A sticky marshmallow over a rising lava lake.

     The whole game is one rule: the body is stuck to whatever it last hit, and
     everything it can stick to is falling. A tap flings it along the line to
     the finger; it sticks to the first rock it meets and rides that rock down.
     Rocks melt when they reach the lava, so a landing is never a resting place
     — the only way to stay alive is to keep moving up the falling ones.

     Contract: reset / update(dt) / render / onDown / onMove / onUp / onResize.
     =================================================================== */
  var Game = (function () {
    var C = CONFIG, TAU = Math.PI * 2;

    /* The marshmallow browns as it takes heat: four shades, charcoal last.
       Toasting is cosmetic — the lava is the only thing that ends a run — but
       it is the read on how badly the last minute went. */
    var TOAST = [
      { skin:"#fff3dd", lit:"#ffffff", face:"#5a3a1c" },
      { skin:"#f7d9a4", lit:"#fff0cf", face:"#4a2c12" },
      { skin:"#d99a55", lit:"#f3c187", face:"#33200c" },
      { skin:"#7d5130", lit:"#a97a4c", face:"#170d05" }
    ];

    var rocks, mallow, embers, bubbles;
    var score, combo, bestCombo, rocksHit, best, nextMile, toast, focus, focusT;
    var hitsTaken = 0;                  // hits taken, fireball, bite or lava (levelFaults)
    var elapsed, spawnT, wave, wallT, bonkT, aim, dead, deadT, sink;
    var lavaY, lavaLo, lavaHi;
    var bg = null, fire = null, steam = null;

    /* The level, as applyLevel left it: BIO is the biome (the embers' colour),
       ROW the row of CONFIG.ladder. Both null in the playable, which is the
       caldera exactly as it shipped. */
    var LAD = CONFIG.ladder, BIO = null, ROW = null;
    var geysers = [], drops = [], dropT = 0;
    var surge = { ph: 0, left: 0, off: 0 };   // 0 calm, 1 warn, 2 up, 3 hold, 4 down
    var orbT = 0, water = [], waterT = 0, magnets = [], cool = 0;
    var serpent = { st: 0, left: 0 };         // 0 idle, 1 the swirl, 2 the leap
    var treats = [], treatT = 0, held = { biscuit: false, chocolate: false }, boostT = 0;

    /* The four special rocks. Each one is a MATERIAL — its own colours over a
       silhouette of KINDS — so it is told apart before it is touched. `hold`
       names the CONFIG key of the fuse its first touch lights. */
    var SP = {
      ice:   { kind:1, rMin:44, rMax:96,  fill:"#5aa9cc", used:"#2b4f60", rim:"rgba(214,248,255,.85)",
               art:"rockIce" },
      shard: { kind:0, rMin:74, rMax:104, fill:"#887c6d", used:"#3b3631", rim:"rgba(255,224,138,.7)",
               hold:"shardHold", ring:"#ffe08a", art:"rockCracked" },
      dust:  { kind:4, rMin:44, rMax:92,  fill:"#a98b5f", used:"#4a3e2c", rim:"rgba(255,226,170,.6)",
               hold:"dustHold", ring:"#ffd9a0", art:"rockCrumbling" },
      bomb:  { kind:3, rMin:50, rMax:78,  fill:"#33202a", used:"#25171d", rim:"rgba(255,90,60,.8)",
               hold:"bombHold", ring:"#ff3b30", art:"rockBomb" },
      // a giant lava bubble and a crust of cooled lava: drawn by hand, below
      orb:   { kind:0 },
      crust: { kind:2 },
      magnet:{ kind:1 }
    };
    var SP_KEYS = ["ice", "shard", "dust", "bomb"];

    /* ---- the painted sprites ----------------------------------------------
       Five sheets cut on a 6x4 grid (art.objects in the manifest). For a rock
       `<art>NN` is one of six DESIGNS (the column) in one of four STATES (the
       row): fresh, claimed, about to go, and what it leaves — a burst of
       steam, the pieces, a puff of dust, the blast. For the body `mallowNN`
       is one of six POSES (the column) in one of four shades of TOAST (the
       row), the same four TOAST below paints.

       Every sprite is optional. The playable carries the body and none of the
       rocks (tools/build/build.mjs), a build with no artwork carries neither,
       and an image still decoding is the same case: whatever has no picture
       is drawn the vector way it always was. */
    var MALLOW_POSE = { idle:1, jump:2, land:3, hot:4, blown:5, melted:6 };
    // where a cracked rock's painted Y runs: up-left, up-right, straight down
    var Y_FAULTS = [-Math.PI * 5 / 6, -Math.PI / 6, Math.PI / 2];
    var META = {}, DARK = {};

    function cell(n) { return n < 10 ? "0" + n : "" + n; }

    function sprite(key) {
      var im = typeof ArtImages !== "undefined" && ArtImages[key];
      return im && im.complete && im.naturalWidth ? im : null;
    }

    /* What a sprite's pixels say, read once off a 64 px copy of it: the
       centre of its solid body, its mean radius, the body's box, and its
       silhouette as 24 radii — the shape the physics reads through
       radiusAt(), so a rock is held where its picture is, spikes included.
       Particles around a body (steam, chips, grains) are left out of it: the
       rays stop at the body's first edge. */
    function measure(key) {
      if (META[key] !== undefined) return META[key];
      var im = sprite(key);
      if (!im) return null;                     // not cached: it may still decode
      var m = null;
      try {
        var k = 64 / Math.max(im.naturalWidth, im.naturalHeight);
        var w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        var g = c.getContext("2d");
        g.drawImage(im, 0, 0, w, h);
        var px = g.getImageData(0, 0, w, h).data;
        var solid = function (x, y) {
          x = Math.round(x); y = Math.round(y);
          return x >= 0 && y >= 0 && x < w && y < h && px[(y * w + x) * 4 + 3] > 160;
        };
        var x, y, sx = 0, sy = 0, n = 0, x0 = w, x1 = 0, y1 = 0;
        for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
          if (!solid(x, y)) continue;
          sx += x; sy += y; n++;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y > y1) y1 = y;
        }
        if (n > 20) {
          var cx = sx / n, cy = sy / n, rays = [], R = 0, i, a, d;
          for (i = 0; i < 24; i++) {
            a = i / 24 * TAU;
            for (d = 0.5; solid(cx + Math.cos(a) * d, cy + Math.sin(a) * d); d += 0.5) {}
            rays.push(Math.max(d, 1)); R += Math.max(d, 1);
          }
          R /= 24;
          m = { cx: cx / k, cy: cy / k, R: R / k, x0: x0 / k, x1: (x1 + 1) / k, bottom: (y1 + 1) / k,
                shape: rays.map(function (v) { return v / R; }) };
        }
      } catch (e) { m = null; }
      META[key] = m;
      return m;
    }

    // A sprite darkened once into its own canvas: a piece that has been
    // claimed reads cold like every other claimed rock.
    function darkOf(key) {
      if (DARK[key]) return DARK[key];
      var im = sprite(key);
      if (!im) return null;
      var c = document.createElement("canvas");
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      var g = c.getContext("2d");
      g.drawImage(im, 0, 0);
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = "rgba(14,8,10,.55)";
      g.fillRect(0, 0, c.width, c.height);
      return (DARK[key] = c);
    }

    // Give a rock the silhouette of its picture. False when there is none.
    function shapeFrom(rk, key) {
      var m = measure(key), i;
      if (!m) return false;
      rk.shape = m.shape.slice(); rk.ux = []; rk.uy = [];
      for (i = 0; i < 24; i++) {
        rk.ux.push(Math.cos(i / 24 * TAU) * rk.shape[i]);
        rk.uy.push(Math.sin(i / 24 * TAU) * rk.shape[i]);
      }
      return true;
    }

    // A sprite drawn so its body's centre sits on (x, y) at radius R.
    function drawBody(img, m, x, y, rot, R) {
      var s = R / m.R;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot);
      ctx.drawImage(img, -m.cx * s, -m.cy * s, img.width * s, img.height * s);
      ctx.restore();
    }

    /* The picture a rock wears right now, or null for the vector look. The
       state is the row; a bomb whose fuse is lit flickers between its rest
       and its white-hot frame on the pulse that quickens with the fuse, and
       stays white-hot on its last 0.4 s. Ice goes to its melting frame as it
       nears the lava, which is where it is about to hiss away. */
    function rockKey(rk) {
      if (rk.frag != null) return "rockCracked" + cell(19 + rk.frag);
      if (!rk.sp && rk.design != null) return KIND_ART[rk.kind] + cell(rk.design + (rk.used ? 7 : 1));
      var S = rk.sp && SP[rk.sp], row;
      if (!S || rk.design == null) return null;
      row = rk.used ? 1 : 0;
      if (rk.sp === "ice" && rk.y + rk.r > surfaceAt(rk.x) - 150) row = 2;
      if (rk.armed) row = rk.sp !== "bomb" || rk.fuse < 0.4 || Math.sin(rk.ph) > 0 ? 2 : row;
      return S.art + cell(row * 6 + rk.design + 1);
    }

    /* The effects a rock leaves behind, out of the fourth row of its sheet:
       drawn where it went, growing and fading. */
    var puffs = [];
    function puff(key, x, y, size, life, rot) {
      if (!sprite(key)) return;
      puffs.push({ key: key, x: x, y: y, size: size, t: 0, life: life, rot: rot == null ? Rand.range(-0.5, 0.5) : rot });
    }

    /* What a level names on its first second, where the thing is new — once
       per player ever (Notify.learn), each key the id of the guide's page that
       explains it. Its title and line are that notice, and its title the
       page's. Only what the frame cannot say is announced: a hidden rule, a
       warning to decode, a help worth aiming for. A cracked rock splits in
       plain sight, and a band of the core only mixes what was named before:
       those are QUIET, titles of their pages and nothing more. */
    var INTRO = {
      fire:   ["Fireballs", "Fireballs throw you off after a beat"],
      ice:    ["Ice rocks", "Ice rocks throw you straight up"],
      geyser: ["Geysers", "The steam lifts whatever it touches"],
      shard:  ["Cracked rocks", "These rocks split into pieces you can land on"],
      dust:   ["Crumbling rocks", "These rocks crumble soon after you land"],
      bomb:   ["Bombs", "Bombs blow 2 s after you land"],
      surge:  ["Lava surges", "The lava will reach the red line"],
      claimed:["Dark rocks", "Dark rocks break your chain"],
      furnace:["Furnace", "Fireballs, surges and bombs"],
      cold:   ["Cold snap", "Ice, cold water and crystals"],
      ascent: ["Updraft", "Geysers, bubbles and crystals"],
      collapse:["Collapse", "Rocks that split, crumble and blow"],
      lair:   ["The lair", "The serpent, the surges and the bubbles"],
      cataclysm:["Cataclysm", "Everything the lava has"],
      smores: ["S'mores", "One of each gives a life back"],
      water:  ["Cold water", "Cold water sets a crust you can stand on"],
      magnets:["Magnet crystals", "Crystals catch you and throw you higher"],
      orbs:   ["Lava bubbles", "Ride a bubble up before it pops"],
      serpent:["Lava serpent", "The serpent leaps from the swirl"]
    };
    var QUIET = { shard: 1, furnace: 1, cold: 1, ascent: 1, collapse: 1, lair: 1, cataclysm: 1 };

    /* ---- helpers --------------------------------------------------------- */

    function makeCanvas(w, h) {
      var c = document.createElement("canvas");
      var SPR = view.dpr;                        // the motor's rule, read per build
      c.width = Math.round(w * SPR); c.height = Math.round(h * SPR);
      c._w = w; c._h = h;
      c.getContext("2d").setTransform(SPR, 0, 0, SPR, 0, 0);
      return c;
    }

    function geometry() {
      lavaLo = Layout.bottom - Layout.h * C.lavaStart;
      lavaHi = Layout.bottom - Layout.h * C.lavaEnd;
      if (lavaY == null) lavaY = lavaLo;
    }

    // The lava surface is two sine waves, so it never reads as a straight line
    // and the same function decides what has fallen in.
    function surfaceAt(x) {
      return lavaY - surge.off + cool + Math.sin(x * 0.011 + wave) * 8 + Math.sin(x * 0.029 - wave * 1.7) * 4;
    }

    function ramp() { return clamp(elapsed / C.rampSeconds, 0, 1); }

    // signed angle into (-PI, PI], so a lean eases the short way round
    function wrapAngle(a) {
      a = (a + Math.PI) % TAU;
      if (a < 0) a += TAU;
      return a - Math.PI;
    }

    /* ---- the rocks ------------------------------------------------------- */

    /* Five kinds of rock. A kind is a silhouette AND a texture, so the field
       never reads as one blob repeated: `n / lo / hi` write the radius array
       the physics already reads through radiusAt(), and `tex` only dresses the
       inside of that same outline. What a rock is worth is still carried by
       COLOUR alone — lit and veined while it is fresh, dead grey once it has
       been claimed — so a kind is read at a glance without ever being learned. */
    var KINDS = [
      // the boulder: round, lumpy, split open on molten veins
      { n:11, lo:0.90, hi:1.08, round:true,  fill:"#5f4a46", used:"#2c2422", tex:"cracks" },
      // the crystal: seven long facets that catch the light as it turns
      { n:7,  lo:0.74, hi:1.14, round:false, fill:"#484278", used:"#242142", tex:"facets" },
      // the slab: a flat plate of layered stone, wider than it is tall
      { n:12, lo:0.94, hi:1.04, round:true,  flat:0.38, fill:"#6d5334", used:"#33281a", tex:"strata" },
      // the shard: broken basalt, a few points at no regular interval
      { n:14, lo:0.58, hi:1.26, round:false, spike:true, fill:"#3d3450", used:"#1f1b2a", tex:"blades" },
      // the pumice: light, round, eaten right through with holes
      { n:13, lo:0.90, hi:1.06, round:true,  fill:"#6d6659", used:"#312f2a", tex:"holes" },
      // the obsidian: black volcanic glass — painted only, it has no vector look
      { n:9,  lo:0.80, hi:1.12, round:false, fill:"#1a1420", used:"#100c14", tex:"facets", paint:true }
    ];
    /* Each material is also PAINTED, `rock-<material>-NN` in art.objects: six
       designs fresh (01-06) and the same six claimed (07-12), the colour of a
       claimed rock already painted in. */
    var KIND_ART = ["rockBoulder", "rockCrystal", "rockSlab", "rockShard", "rockPumice", "rockObsidian"];

    /* The materials this build can paint: every one whose pictures are in —
       the web build carries all six, the playable two. With none (a build with
       no artwork, a picture still decoding) the fall is the five vector ones,
       and the obsidian, which only exists painted, stays out of it. */
    function pickKind() {
      var ok = [], i;
      for (i = 0; i < KINDS.length; i++) {
        if (sprite(KIND_ART[i] + "01") && sprite(KIND_ART[i] + "12")) ok.push(i);
      }
      if (!ok.length) for (i = 0; i < KINDS.length; i++) if (!KINDS[i].paint) ok.push(i);
      return Rand.pick(ok);
    }

    function makeRock(x, y, r, hot, sp) {
      var i, a, sc, y0, h, shape = [], marks = [], ux = [], uy = [];
      var kind = sp ? SP[sp].kind : pickKind(), K = KINDS[kind], n = K.n;
      var drift = Rand.range(-C.driftMax, C.driftMax);

      /* A spiked kind gets its points marked FIRST, four to six of them at
         irregular intervals: alternating tip and valley all the way round drew
         a symmetrical star, which is a shape nothing breaks into. Everything
         between two points is a face of random depth, so no two shards are the
         same silhouette. */
      if (K.spike) {
        var tips = [], nt = Rand.int(4, 6), at = Rand.int(0, n - 1);
        for (i = 0; i < n; i++) tips.push(0);
        for (i = 0; i < nt; i++) { tips[at % n] = 1; at += Rand.int(2, 4); }
      }

      for (i = 0; i < n; i++) {
        a = i / n * TAU;
        sc = K.spike ? (tips[i] ? Rand.range(1.0, K.hi) : Rand.range(K.lo, 0.88))
                     : Rand.range(K.lo, K.hi);
        /* a flat kind is squashed on the vertical, and the squash is baked into
           the radius array rather than applied at paint time — radiusAt(), the
           landing and the aim preview then all see the shape that is drawn. */
        if (K.flat) sc *= 1 - K.flat * Math.abs(Math.sin(a));
        shape.push(sc);
        // the unit outline, cached: no trig per rock per frame
        ux.push(Math.cos(a) * sc); uy.push(Math.sin(a) * sc);
      }

      // the texture's own random detail, drawn from the same seed every frame
      if (K.tex === "facets") {
        marks.push({ x: Rand.range(-0.28, 0.28), y: Rand.range(-0.28, 0.28), o: Rand.int(0, 4) });
      } else if (K.tex === "cracks") {
        for (i = 0; i < 3; i++) marks.push({ a: Rand.range(0, TAU), b: Rand.range(0, TAU), w: Rand.range(0.1, 0.45) });
      } else if (K.tex === "strata") {
        for (y0 = -0.8; y0 < 0.8; y0 += h) {
          h = Rand.range(0.18, 0.36);
          marks.push({ y: y0, h: h });
        }
      } else if (K.tex === "holes") {
        for (i = 0; i < 7; i++) marks.push({ a: Rand.range(0, TAU), d: Rand.range(0.08, 0.62), w: Rand.range(0.07, 0.16) });
      }

      /* A cracked rock carries the three faults it will split along, so the
         pieces are drawn on it before they come apart; a crumbling one its
         grains. */
      var cuts = null, grains = null;
      if (sp === "shard") {
        a = Rand.range(0, TAU);
        cuts = [a, a + TAU / 3 + Rand.range(-0.3, 0.3), a + TAU * 2 / 3 + Rand.range(-0.3, 0.3)];
      } else if (sp === "dust") {
        grains = [];
        for (i = 0; i < 16; i++) grains.push({ a: Rand.range(0, TAU), d: Rand.range(0.1, 0.8), w: Rand.range(0.04, 0.09), l: i % 3 === 0 });
      }

      var rk = {
        x: x, y: y, r: r, hot: !!hot, kind: kind,
        sp: sp || null, armed: false, fuse: 0, fuse0: 1, ph: 0, cuts: cuts, grains: grains,
        design: null, frag: null, aura: Rand.int(0, 2),
        /* vx/vy are what the rock is doing right now; drift/fall are the lane
           it was given and the velocity it is always pulled back toward. */
        vx: drift, vy: 0, drift: drift, fall: 0,
        rot: Rand.range(0, TAU), spin: Rand.range(-C.spinMax, C.spinMax),
        shape: shape, ux: ux, uy: uy, marks: marks, tips: K.spike ? tips : null,
        seed: Rand.range(0, TAU),
        used: false, sunk: 0, burning: false, burn: 0, glow: 3.1
      };

      /* A special rock with a painted sheet takes one of its six designs and
         that design's silhouette; a cracked one splits along the Y painted
         on it rather than along faults of its own. */
      if (sp && SP[sp].art) {
        var design = Rand.int(0, 5);
        if (shapeFrom(rk, SP[sp].art + cell(design + 1))) {
          rk.design = design;
          if (sp === "shard") rk.cuts = Y_FAULTS.slice();
        }
      } else if (!sp && sprite(KIND_ART[kind] + "01")) {
        // a plain rock takes one of its material's six designs the same way
        var dz = Rand.int(0, 5);
        if (shapeFrom(rk, KIND_ART[kind] + cell(dz + 1))) rk.design = dz;
      }
      return rk;
    }

    // The local radius of a rock at a LOCAL angle, so the body plants itself on
    // the silhouette instead of on an imaginary circle.
    function radiusAt(rk, a) {
      var n = rk.shape.length;
      var t = (((a % TAU) + TAU) % TAU) / TAU * n;
      var i = Math.floor(t), f = t - i;
      return rk.r * (rk.shape[i % n] * (1 - f) + rk.shape[(i + 1) % n] * f);
    }

    // Which special the level draws this rock as, if any: the row's shares,
    // stacked. Nothing at all in the playable.
    function pickSpecial() {
      if (!ROW) return null;
      var u = Rand.range(0, 1), i, s = 0;
      for (i = 0; i < SP_KEYS.length; i++) {
        s += ROW[SP_KEYS[i]] || 0;
        if (u < s) return SP_KEYS[i];
      }
      return null;
    }

    function spawnRock(y, k) {
      var fireK = ROW && ROW.fire != null ? ROW.fire : 1;
      var hot = Rand.chance((C.fireChance0 + (C.fireChance1 - C.fireChance0) * k) * fireK);
      var sp = hot ? null : pickSpecial();
      var r = hot ? Rand.range(C.fireMinR, C.fireMaxR)
            : sp ? Rand.range(SP[sp].rMin, SP[sp].rMax)
            : Rand.range(C.rockMinR, C.rockMaxR);
      var x = 0, i, j, ok;
      // Six tries at a lane that is not already taken, then give up and drop it
      // anyway — a crowded ceiling is a fair thing to have to read.
      for (i = 0; i < 6; i++) {
        x = Rand.range(Layout.left + r, Layout.right - r);
        ok = true;
        for (j = 0; j < rocks.length; j++) {
          if (rocks[j].y > y + 260) continue;
          if (Math.abs(rocks[j].x - x) < rocks[j].r + r + 24) { ok = false; break; }
        }
        if (ok) break;
      }
      var rk = makeRock(x, y, r, hot, sp);
      // One of the two lanes, then the ramp on top of it.
      var fast = Rand.chance(C.fastChance);
      rk.fall = (fast ? Rand.range(C.fastMin, C.fastMax) : Rand.range(C.fallMin, C.fallMax))
              * (1 + C.fallRamp * k) * (hot ? C.fireFall : 1);
      rk.vy = rk.fall;
      // a level of claimed rocks drops some already taken: dark, no points
      if (ROW && ROW.claimed && !hot && !sp && Rand.chance(ROW.claimed)) rk.used = true;
      rocks.push(rk);
      return rk;
    }

    /* Structures bounce off one another. Mass goes as the area, so a boulder
       shrugs a pebble aside and a pebble is sent flying; the settle term in
       update() then bleeds the knock away over about half a second. */
    function collideRocks(d) {
      var i, j, a, b, dx, dy, dist, min, nx, ny, ma, mb, push, rel, imp;
      for (i = 0; i < rocks.length; i++) {
        a = rocks[i];
        /* A burning structure is being eaten away: it stops pushing anything
           around, or the rocks above it pile onto it and the lower half of the
           screen turns into a raft instead of a fall. */
        if (a.sunk > 0 || a.burning || ghost(a)) continue;
        for (j = i + 1; j < rocks.length; j++) {
          b = rocks[j];
          if (b.sunk > 0 || b.burning || ghost(b)) continue;
          dx = b.x - a.x; dy = b.y - a.y;
          dist = Math.hypot(dx, dy);
          min = a.r + b.r;
          if (dist >= min || dist < 0.001) continue;
          nx = dx / dist; ny = dy / dist;
          ma = a.r * a.r; mb = b.r * b.r;

          // separate them first, each by the other's share of the mass
          push = min - dist;
          a.x -= nx * push * (mb / (ma + mb)); a.y -= ny * push * (mb / (ma + mb));
          b.x += nx * push * (ma / (ma + mb)); b.y += ny * push * (ma / (ma + mb));

          // then the impulse along the normal — only if they are still closing
          rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel >= 0) continue;
          imp = -(1 + C.rockBounce) * rel / (1 / ma + 1 / mb);
          a.vx -= imp / ma * nx; a.vy -= imp / ma * ny;
          b.vx += imp / mb * nx; b.vy += imp / mb * ny;

          // a knock also sets them turning, which is what makes it read as a hit
          a.spin = clamp(a.spin - rel * C.knockSpin, -C.spinMax * 2.4, C.spinMax * 2.4);
          b.spin = clamp(b.spin + rel * C.knockSpin, -C.spinMax * 2.4, C.spinMax * 2.4);

          if (bonkT <= 0) {
            bonkT = 0.09;
            Sound.clip("wall", clamp(-rel / 900, 0.1, 0.4), Rand.range(0.62, 0.82));
            Fx.burst(a.x + nx * a.r, a.y + ny * a.r,
                     { color:["#c9b8a0", "#ffd9a0"], count:5, speed:190, life:.26, grav:400, size:3 });
          }
        }
      }
    }

    /* ---- the body -------------------------------------------------------- */

    /* Plant the marshmallow on its host, along the anchor angle it stuck at.
       The host spins, so this is also what makes a landing expire.

       `grip` is the inward slide: 0 is the point of impact on the silhouette,
       1 is the hold near the centre. Passing dt advances it; calling ride()
       bare (from attach, from reset) only re-plants at the grip it already has. */
    function ride(d) {
      var rk = mallow.host, a = rk.rot + mallow.rel;
      if (d) mallow.grip = Math.min(1, mallow.grip + d * C.gripSpeed);
      var reach = radiusAt(rk, mallow.rel) + C.mallowLen * (0.5 - C.embed);
      // a crust is a plate on the lake: the body stands on it, never sinks in
      var dd = reach * (1 - C.gripCenter * (rk.sp === "crust" ? 0 : mallow.grip));
      mallow.x = rk.x + Math.cos(a) * dd;
      mallow.y = rk.y + Math.sin(a) * dd;
      mallow.ang = a; mallow.vx = 0; mallow.vy = 0;
    }

    /* Closest point of the capsule axis to the rock's centre, tested against
       the SILHOUETTE at that bearing rather than against the bounding circle:
       a slab is flat and a shard has valleys, and capturing on the circle would
       stick the body to empty space beside either of them. */
    function hits(rk) {
      var hx = Math.cos(mallow.ang) * C.mallowLen * 0.5;
      var hy = Math.sin(mallow.ang) * C.mallowLen * 0.5;
      var ax = mallow.x - hx, ay = mallow.y - hy;
      var dx = hx * 2, dy = hy * 2;
      var t = ((rk.x - ax) * dx + (rk.y - ay) * dy) / (dx * dx + dy * dy);
      t = clamp(t, 0, 1);
      var cx = ax + dx * t, cy = ay + dy * t;
      var d = Math.hypot(rk.x - cx, rk.y - cy);
      // cheap reject, wide enough for a spike past the mean radius
      if (d > rk.r * 1.35 + C.mallowR + C.stickPad) return false;
      return d < radiusAt(rk, Math.atan2(cy - rk.y, cx - rk.x) - rk.rot)
                 + C.mallowR + C.stickPad;
    }

    function attach(rk) {
      mallow.host = rk; mallow.flying = false; mallow.ignore = null; mallow.hold = 0;
      mallow.rel = Math.atan2(mallow.y - rk.y, mallow.x - rk.x) - rk.rot;
      mallow.grip = 0;                      // it slides inward from here
      mallow.land = 0.24; mallow.blown = 0; // the squash of a landing (the sprite's pose)
      ride();
      Fx.burst(mallow.x, mallow.y, { color:["#fff3dd", "#ffd9a0"], count:8, speed:210, life:.32, grav:420, size:4 });

      if (!rk.hot) arm(rk);

      if (rk.hot) { scorch(rk); return; }
      if (rk.used) {                                  // a rock already claimed
        if (combo >= 2) Pop.show("alert", { word:"Chain lost", at:"upper" });
        combo = 0; HUD.setRight(null);
        Sound.clip("stick", 0.4, Rand.range(1.1, 1.25));
        return;
      }
      claim(rk);
    }

    // A fresh rock: the only thing in the game that scores.
    function claim(rk) {
      rk.used = true; rocksHit++; combo++;
      mallow.air = C.airShots;      // a fresh rock is what reloads the recovery
      focus = Math.min(1, focus + C.focusClaim);   // ...and part of the focus
      if (combo > bestCombo) bestCombo = combo;
      if (rk.r > 70) Sound.clip("stick", 0.62, Rand.range(0.86, 1.02) * 0.9);
      else Sound.clip("stick", 0.45, Rand.range(0.86, 1.02) * 1.1);

      // Higher is worth more, which is the whole reason to climb rather than to
      // sit on the first thing that floats past.
      var high = clamp((Layout.bottom - mallow.y) / Layout.h, 0, 1);
      var mult = Math.min(1 + (combo - 1) * C.chainStep, C.chainMax);
      var gain = Math.round((C.baseScore + C.heightBonus * high) * mult);
      if (rk.piece) gain = Math.round(gain / 2);   // a piece is a bonus, not a full rock
      if (boostT > 0) gain *= 2;                   // a s'more's double points
      score += gain;
      HUD.setScore(score);
      HUD.punch(combo >= 5 ? "#ffd166" : "#fff3dd");
      HUD.setRight(combo >= 2 ? "x" + combo : null, "Chain", combo >= 5 ? "on" : "");
      Pop.show("score", { word:"+" + gain, at:{ x: mallow.x, y: mallow.y - 54 } });
      Fx.ring(rk.x, rk.y, { from: rk.r * 0.7, to: rk.r * 1.9, color:"#ffd9a0", width:5, life:.32 });

      if (rocksHit >= nextMile) {
        nextMile += C.milestone;
        Pop.show(rocksHit >= 40 ? "ultra" : rocksHit >= 20 ? "combo" : "streak",
                 { word: rocksHit + Lang.t(" rocks"), sub:"Keep climbing" });
        Sound.clip("climb", 0.3, 1 + Math.min(rocksHit / 60, 0.35));
      }
    }

    /* Landing on a fireball: no score, no chain, and a clock. The shade of
       toast is paid only by a body still on it when the clock runs out —
       the toast is the life now, and a fireball lends its back for a beat,
       it is staying on it that burns. */
    function scorch(rk) {
      combo = 0; HUD.setRight(null);
      mallow.hot = 0.9;
      Sound.clip("burn", 0.55, Rand.range(0.95, 1.12));
      Fx.flash("#ff7a1a", 0.22, 3);
      Fx.shake(7, 0.2);
      Fx.burst(mallow.x, mallow.y, { color:["#ffd166", "#ff7a1a"], count:16, speed:330, life:.45, grav:-120 });
    }

    /* A structure that touches the lava catches fire. It becomes a fireball —
       flames, no score, and a clock that throws the body off — and it settles
       into the crust while it blazes, so the fire is a warning with time in it
       rather than an instant death. */
    function ignite(rk) {
      rk.burning = true; rk.hot = true; rk.glow = 1.9; rk.burn = 0;
      rk.armed = false;                   // the fire is its clock now, not the fuse
      rk.fall = C.burnSink; rk.vy = Math.max(rk.vy * 0.35, C.burnSink); rk.drift *= 0.4;
      if (mallow.host === rk) mallow.hold = 0;      // the eject clock starts now
      Sound.clip("burn", 0.3, Rand.range(1.15, 1.32));
      Fx.burst(rk.x, rk.y + rk.r * 0.5,
               { color:["#ffd166", "#ff7a1a"], count:12, speed:250, life:.5, grav:-160, size:4 });
      Fx.ring(rk.x, rk.y, { from: rk.r * 0.6, to: rk.r * 1.7, color:"#ff9d2e", width:4, life:.3 });
    }

    /* ---- the special rocks ---------------------------------------------- */

    /* The first touch lights a cracked, crumbling or explosive rock's fuse,
       and it burns whether the body stays or not: a rock that only counted
       down under the body could be defused by hopping off and back on. */
    function arm(rk) {
      var S = rk.sp && SP[rk.sp];
      if (!S || !S.hold || rk.armed) return;
      rk.armed = true; rk.fuse = rk.fuse0 = C[S.hold];
      if (rk.sp === "bomb") Sound.clip("fuse", 0.5);
      else if (rk.sp === "dust") Sound.clip("crumble", 0.32, 1.5);
      else Sound.clip("crumble", 0.32, 1.15);
    }

    // A bomb set off by something other than a landing: a blast, a drop.
    function shortFuse(rk, t) {
      if (!rk.armed) { rk.armed = true; rk.fuse0 = C.bombHold; rk.fuse = t; }
      else rk.fuse = Math.min(rk.fuse, t);
    }

    // The body comes off whatever it holds, with a velocity and no shot spent.
    function loose(vx, vy, ignore) {
      mallow.host = null; mallow.flying = true; mallow.hold = 0;
      mallow.ignore = ignore || null;
      mallow.vx = vx; mallow.vy = vy;
    }

    // An ice rock throws the body straight up — keeping a little of the rock's
    // own drift, so the arc still says which rock it came off.
    function iceKick() {
      var rk = mallow.host;
      loose(rk.vx * 0.5, -C.iceKick, rk);
      Sound.clip("ice", 0.25, Rand.range(0.95, 1.1));
      Fx.burst(mallow.x, mallow.y + C.mallowLen * 0.4, { color:["#e8fbff", "#9fdcf2", "#ffffff"], count:14,
                                     speed:260, life:.4, grav:500, angle: Math.PI / 2, spread: 1.4 });
      Fx.ring(mallow.x, mallow.y, { from:16, to:90, color:"#bfefff", width:5, life:.3 });
    }

    // Ice does not burn: it hisses into steam on the crust and is gone.
    function hiss(rk) {
      rk.sunk = 0.001;
      if (rk.design != null) puff("rockIce" + cell(19 + rk.design), rk.x, rk.y, rk.r * 2.5, 0.55);
      Sound.clip("crumble", 0.3, 1.6);
      Fx.burst(rk.x, rk.y + rk.r * 0.4, { color:["#ffffff", "#e8fbff", "#c9b8a0"], count:16,
                                          speed:240, life:.6, grav:-260, size:6 });
    }

    // A fuse that ran out. The rock is taken out of the array by the caller.
    function pop(rk) {
      if (rk.sp === "shard") split(rk);
      else if (rk.sp === "dust") crumble(rk);
      else if (rk.sp === "bomb") explode(rk);
    }

    /* A cracked rock comes apart along the faults it was drawn with, into
       three plain rocks — fresh ones, which score: riding a cracked rock to
       its end is a way to land on three. */
    function split(rk) {
      var i, m, a0, a1, pr = Math.max(C.rockMinR, rk.r * 0.46), p, rd = rk.r * 0.45;
      for (i = 0; i < 3; i++) {
        a0 = rk.cuts[i]; a1 = rk.cuts[(i + 1) % 3];
        if (a1 < a0) a1 += TAU;
        m = rk.rot + (a0 + a1) / 2;
        p = makeRock(rk.x + Math.cos(m) * rd, rk.y + Math.sin(m) * rd, pr, false);
        p.vx = rk.vx + Math.cos(m) * C.shardKick;
        p.vy = rk.vy + Math.sin(m) * C.shardKick - 80;
        p.drift = rk.drift * 0.5 + Math.cos(m) * 30;
        p.fall = rk.fall; p.spin = rk.spin + Rand.range(-0.6, 0.6);
        p.piece = true;
        // each piece wears a different painted fragment of the same design row
        if (rk.design != null && shapeFrom(p, "rockCracked" + cell(19 + (rk.design + i) % 6))) p.frag = (rk.design + i) % 6;
        rocks.push(p);
      }
      if (mallow.host === rk) loose(rk.vx, -300, null);
      Sound.clip("shatter", 0.6, Rand.range(0.95, 1.1));
      Fx.shake(5, 0.18);
      Fx.burst(rk.x, rk.y, { color:["#ffe08a", "#887c6d", "#c9b8a0"], count:18, speed:320, life:.45, grav:600, size:5 });
    }

    // A crumbling rock leaves nothing to land on: whoever rode it falls.
    function crumble(rk) {
      if (mallow.host === rk) { loose(rk.vx, rk.vy * 0.5, null); mallow.blown = 0.4; }
      if (rk.design != null) puff("rockCrumbling" + cell(19 + rk.design), rk.x, rk.y, rk.r * 2.7, 0.75);
      Sound.clip("dust", 0.55, Rand.range(0.95, 1.1));
      Fx.burst(rk.x, rk.y, { color:["#a98b5f", "#d8bd8a", "#6d5a3e"], count:26, speed:200, life:.7, grav:520, size:5 });
      Fx.burst(rk.x, rk.y, { color:["rgba(216,189,138,.5)"], count:8, speed:60, life:.8, grav:-40, size:14 });
    }

    /* A bomb throws everything near it outward: the rocks, the other bombs
       (whose fuse it cuts short — a chain is a fair thing to have caused), and
       the body if it is still in reach. Being thrown is the whole cost: it
       breaks the chain, and wherever the blast sends it is the danger. */
    function explode(rk) {
      var i, o, dx, dy, dist, reach = rk.r + C.bombReach, m, kick;
      for (i = 0; i < rocks.length; i++) {
        o = rocks[i];
        if (o === rk || o.sunk > 0 || ghost(o)) continue;
        dx = o.x - rk.x; dy = o.y - rk.y; dist = Math.hypot(dx, dy) || 1;
        if (dist > reach + o.r) continue;
        if (o.sp === "bomb" && !o.hot) shortFuse(o, 0.25);
        m = clamp(60 / o.r, 0.4, 1.6);
        o.vx += dx / dist * C.bombShove * m; o.vy += dy / dist * C.bombShove * m;
        o.spin = clamp(o.spin + Rand.range(-1.5, 1.5), -C.spinMax * 2.4, C.spinMax * 2.4);
      }

      dx = mallow.x - rk.x; dy = mallow.y - rk.y; dist = Math.hypot(dx, dy);
      if (!dead && dist < reach + C.mallowR) {
        if (dist < 1) { dx = 0; dy = -1; dist = 1; }
        kick = C.bombKick * (1 - 0.4 * clamp(dist / reach, 0, 1));
        loose(dx / dist * kick, dy / dist * kick, null);
        mallow.blown = 0.7; mallow.hot = 0.6;
        combo = 0; HUD.setRight(null);
        Pop.show("alert", { word:"Boom!", at:"upper" });
      }

      puff("rockBomb" + cell(19 + (rk.design != null ? rk.design : Rand.int(0, 5))), rk.x, rk.y, reach * 1.6, 0.55);
      Sound.clip("boom", 0.8, Rand.range(0.92, 1.05));
      Fx.flash("#ff5a1f", 0.35, 3);
      Fx.shake(14, 0.4);
      Fx.burst(rk.x, rk.y, { color:["#fff1b0", "#ffd166", "#ff7a1a", "#3a2228"], count:34, speed:560, life:.6, grav:300, size:7 });
      Fx.ring(rk.x, rk.y, { from: rk.r * 0.5, to: reach, color:"#ff9d2e", width:8, life:.4 });
    }

    /* ---- the core: geysers, surges, drops --------------------------------- */

    function newGeysers(n) {
      var i, out = [];
      for (i = 0; i < n; i++) {
        out.push({
          x: Layout.left + Layout.w * (i + 1) / (n + 1) + Rand.range(-36, 36),
          st: 0, left: 1.6 + i * 1.4 + Rand.range(0, 1.2), next: idleTime()
        });
      }
      return out;
    }

    function idleTime() { return C.geyserIdle * Rand.range(0.75, 1.25); }

    function stepGeysers(d) {
      var i, g;
      for (i = 0; i < geysers.length; i++) {
        g = geysers[i];
        g.left -= d;
        while (g.left <= 0) {
          g.st = (g.st + 1) % 3;
          if (g.st === 0) { g.left += g.next; g.next = idleTime(); }
          else if (g.st === 1) g.left += C.geyserWarn;
          else {
            g.left += C.geyserBlast;
            Sound.clip("geyser", 0.4, Rand.range(0.92, 1.08));
            Fx.burst(g.x, surfaceAt(g.x), { color:["#fffbe6", "#ffe27a"], count:14, speed:380, life:.5,
                                            grav:-200, angle: -Math.PI / 2, spread: 0.6, size:6 });
          }
        }
      }
    }

    /* Is a geyser blowing at `t` seconds from now? Walked forward through its
       cycle with the rest it has already drawn, so the aim preview sees the
       column the flight will meet. */
    function blowing(g, t) {
      var st = g.st, left = g.left, i;
      for (i = 0; i < 4 && t >= left; i++) {
        t -= left; st = (st + 1) % 3;
        left = st === 0 ? g.next : st === 1 ? C.geyserWarn : C.geyserBlast;
      }
      return st === 2;
    }

    function lift(x, t) {
      for (var i = 0; i < geysers.length; i++) {
        if (Math.abs(x - geysers[i].x) < C.geyserHalf + C.mallowR * 0.5 && blowing(geysers[i], t)) return true;
      }
      return false;
    }

    // The lava's surge: a warning, a climb, a hold, the way back down.
    /* A surge's size is the row's: at 0.5 it comes a third less often and
       climbs three quarters as high. Its crest is drawn while it gathers, so
       the player sees where the lava is about to be. */
    function surgeH() {
      var v = (ROW && ROW.surge) || 1;
      return Layout.h * C.surgeHeight * (0.5 + 0.5 * v);
    }
    function stepSurge(d) {
      var v = (ROW && ROW.surge) || 1, H = surgeH(), s = surge, p;
      s.left -= d;
      while (s.left <= 0) {
        s.ph = (s.ph + 1) % 5;
        s.left += [C.surgeEvery * (v < 1 ? 1.5 : 1), C.surgeWarn, C.surgeUp, C.surgeHold, C.surgeDown][s.ph];
        if (s.ph === 1) { Sound.clip("surge", 0.8); Notify.say("Lava surge!", { kind:"warn", key:"mm-surge" }); }
        if (s.ph === 2) { Fx.shake(9, C.surgeUp); Overlay.vignette("#ff3b00", 0.4); }
      }
      if (s.ph === 2) { p = 1 - s.left / C.surgeUp; s.off = H * p * (2 - p); }
      else if (s.ph === 3) s.off = H;
      else if (s.ph === 4) { p = s.left / C.surgeDown; s.off = H * p * p; }
      else s.off = 0;
    }

    /* A drop swells on the ceiling, then falls. A rock it lands on catches
       fire — ice hisses away, a bomb goes up — and the body it lands on is
       knocked loose and its chain broken: where it falls is the danger. */
    function stepDrops(d) {
      var i, j, dr, rk, hit;
      dropT -= d;
      if (dropT <= 0) {
        dropT = C.dropEvery * Rand.range(0.75, 1.25);
        drops.push({ x: Rand.range(Layout.left + 30, Layout.right - 30), y: Layout.top + 4, vy: 0, form: 0 });
      }
      for (i = drops.length - 1; i >= 0; i--) {
        dr = drops[i];
        if (dr.form < C.dropForm) { dr.form += d; continue; }
        dr.vy += C.dropGravity * d; dr.y += dr.vy * d;

        if (!dead && Math.hypot(dr.x - mallow.x, dr.y - mallow.y) < C.mallowR + C.dropR + 6) {
          drops.splice(i, 1); drip(); continue;
        }
        hit = null;
        for (j = 0; j < rocks.length; j++) {
          rk = rocks[j];
          if (rk.sunk > 0 || rk.burning || ghost(rk)) continue;
          if (Math.hypot(dr.x - rk.x, dr.y - rk.y) < rk.r * 0.92 + C.dropR) { hit = rk; break; }
        }
        if (hit) {
          drops.splice(i, 1);
          if (hit.sp === "ice") hiss(hit);
          else if (hit.sp === "bomb") shortFuse(hit, 0.15);
          else ignite(hit);
          continue;
        }
        if (dr.y > surfaceAt(dr.x)) {
          drops.splice(i, 1);
          Fx.burst(dr.x, surfaceAt(dr.x), { color:["#ffd166", "#ff7a1a"], count:6, speed:240, life:.4, grav:900, size:4 });
        }
      }
    }

    function drip() {
      mallow.hot = 0.9; mallow.blown = 0.5;    // knocked loose: the lava below is the cost
      combo = 0; HUD.setRight(null);
      if (mallow.host) loose(mallow.host.vx, C.dropKnock, mallow.host);
      else mallow.vy = Math.max(mallow.vy, 0) + C.dropKnock;
      Sound.clip("burn", 0.55, Rand.range(1.05, 1.2));
      Fx.burst(mallow.x, mallow.y - C.mallowLen * 0.4, { color:["#ffd166", "#ff7a1a"], count:14, speed:280, life:.4, grav:300 });
    }

    /* ---- the climb's other hands ------------------------------------------
       Five more things a row of ladder.levels can put in the cave: a bubble to
       ride, water that makes ground of the lake, magnets that bend a jump, a
       serpent, and s'mores to catch. Each is off unless its row
       names it, so the playable never meets any of them. */

    // A body the rock physics leaves alone: it neither pushes nor is pushed.
    function ghost(rk) { return rk.sp === "orb" || rk.sp === "crust" || rk.sp === "magnet"; }

    function circleShape(rk) {
      var i;
      rk.shape = []; rk.ux = []; rk.uy = [];
      for (i = 0; i < 24; i++) { rk.shape.push(1); rk.ux.push(Math.cos(i / 24 * TAU)); rk.uy.push(Math.sin(i / 24 * TAU)); }
    }
    // a plate a third as tall as it is wide
    function plateShape(rk) {
      var i, a, v;
      rk.shape = []; rk.ux = []; rk.uy = [];
      for (i = 0; i < 24; i++) {
        a = i / 24 * TAU;
        v = 1 / Math.sqrt(Math.cos(a) * Math.cos(a) + Math.sin(a) * Math.sin(a) / 0.1225);
        rk.shape.push(v); rk.ux.push(Math.cos(a) * v); rk.uy.push(Math.sin(a) * v);
      }
    }

    // THE BUBBLE: it swells out of the lake and climbs, whatever rides it.
    function spawnOrb() {
      var r = Rand.range(C.orbMinR, C.orbMaxR);
      var x = Rand.range(Layout.left + r + 20, Layout.right - r - 20);
      var rk = makeRock(x, surfaceAt(x) - r * 0.3, r, false, "orb");
      circleShape(rk);
      rk.fall = -C.orbRise; rk.vy = -C.orbRise * 0.4;
      rk.drift = rk.vx = Rand.range(-20, 20); rk.spin = 0; rk.rot = 0;
      rk.life = C.orbLife;
      rocks.push(rk);
      Sound.clip("pop", 0.45, 0.75);
    }
    function burstOrb(rk) {
      if (mallow.host === rk) { loose(rk.vx, -C.orbKick, null); mallow.blown = 0.4; }
      Sound.clip("pop", 0.55, Rand.range(0.9, 1.1));
      Fx.burst(rk.x, rk.y, { color:["#ffd76a", "#ff9d2e", "#fff3dd"], count:22, speed:300, life:.45, grav:500, size:5 });
      Fx.ring(rk.x, rk.y, { from: rk.r * 0.6, to: rk.r * 1.6, color:"#ffd76a", width:5, life:.3 });
    }

    // THE WATER: drips that set a crust on the lake and put fires out.
    function stepWater(d) {
      var i, j, w, rk, hit;
      waterT -= d;
      if (waterT <= 0) {
        waterT = C.waterEvery / (ROW.water || 1) * Rand.range(0.75, 1.25);
        water.push({ x: Rand.range(Layout.left + 60, Layout.right - 60), y: Layout.top + 4, vy: 0, form: 0 });
      }
      for (i = water.length - 1; i >= 0; i--) {
        w = water[i];
        if (w.form < C.waterForm) { w.form += d; continue; }
        w.vy += C.dropGravity * d; w.y += w.vy * d;
        hit = null;
        for (j = 0; j < rocks.length; j++) {
          rk = rocks[j];
          if (rk.sunk > 0 || ghost(rk)) continue;
          if (Math.hypot(w.x - rk.x, w.y - rk.y) < rk.r * 0.9 + C.waterR) { hit = rk; break; }
        }
        if (hit) {
          water.splice(i, 1);
          if (hit.hot) quench(hit);
          else Fx.burst(w.x, w.y, { color:["#bfefff", "#ffffff"], count:8, speed:180, life:.3, grav:500, size:3 });
          continue;
        }
        if (w.y > surfaceAt(w.x)) { water.splice(i, 1); setCrust(w.x); }
      }
    }
    // a fireball or a burning rock, put out: a plain rock again, and fresh
    function quench(rk) {
      rk.hot = false; rk.burning = false; rk.burn = 0; rk.glow = 3.1; rk.armed = false;
      rk.fall = Rand.range(C.fallMin, C.fallMax); rk.drift *= 0.5;
      if (mallow.host === rk) mallow.hold = 0;
      Sound.clip("crumble", 0.4, 1.8);
      Fx.burst(rk.x, rk.y, { color:["#ffffff", "#e8fbff", "#c9b8a0"], count:14, speed:200, life:.6, grav:-220, size:6 });
    }
    function setCrust(x) {
      x = clamp(x, Layout.left + C.crustR, Layout.right - C.crustR);
      var rk = makeRock(x, surfaceAt(x), C.crustR, false, "crust");
      plateShape(rk);
      rk.vx = rk.vy = rk.drift = rk.fall = 0; rk.spin = 0; rk.rot = 0;
      rk.life = C.crustLife; rk.design = Rand.int(0, 2);
      rocks.push(rk);
      cool = Math.min(C.coolMax, cool + C.coolDrop);     // the lake goes down
      Sound.clip("crumble", 0.45, 1.6);
      Fx.burst(x, surfaceAt(x), { color:["#ffffff", "#e8fbff", "#c9b8a0"], count:18, speed:220, life:.7, grav:-200, size:7 });
    }

    /* THE MAGNETS: crystals hanging in the cave, a field each. A crystal is a
       body of the rock array (it is caught by the same test a rock is) that
       the rock physics leaves alone, bobbing where it was hung. */
    function newMagnets(n) {
      var i, rk, out = [];
      for (i = 0; i < n; i++) {
        rk = makeRock(Layout.left + Layout.w * (i + 1) / (n + 1) + Rand.range(-50, 50),
                      Layout.top + Layout.h * Rand.range(0.24, 0.46), C.magnetCore, false, "magnet");
        circleShape(rk);
        rk.vx = rk.vy = rk.drift = rk.fall = 0; rk.spin = 0; rk.rot = 0;
        rk.y0 = rk.y; rk.ph = Rand.range(0, TAU); rk.cool = 0;
        rocks.push(rk); out.push(rk);
      }
      return out;
    }
    function magnetLaunch(rk) {
      Sound.clip("ice", 0.25, 0.6);
      Fx.ring(rk.x, rk.y, { from:20, to:140, color:"#d9a6ff", width:6, life:.35 });
      Fx.burst(rk.x, rk.y, { color:["#d9a6ff", "#ffffff"], count:14, speed:320, life:.4, grav:200, size:4 });
    }
    // the pull at a point, into out.x / out.y (the flight and the preview both)
    function magnetPull(x, y, out) {
      var i, m, dx, dy, dist, f;
      out.x = 0; out.y = 0;
      for (i = 0; i < magnets.length; i++) {
        m = magnets[i];
        if (m.cool > 0) continue;                       // dark: no field
        dx = m.x - x; dy = m.y - y; dist = Math.hypot(dx, dy);
        if (dist > C.magnetR || dist < 24) continue;
        f = C.magnetPull * (1 - dist / C.magnetR);
        out.x += dx / dist * f; out.y += dy / dist * f;
      }
      return out;
    }

    // THE SERPENT: a swirl, then a leap in an arc across the lake.
    function serpentAt(q, out) {
      var sv = serpent;
      out.x = sv.x0 + (sv.x1 - sv.x0) * q;
      out.y = surfaceAt(out.x) + 40 - 4 * sv.H * q * (1 - q);
      return out;
    }
    // a segment's drawn radius; it bites and breaks within 0.8 of it
    function segR(i) { return 34 - i * 1.7; }
    function stepSerpent(d) {
      var sv = serpent, i, j, rk, p = {}, q, gone = false;
      sv.left -= d;
      while (sv.left <= 0) {
        sv.st = (sv.st + 1) % 3;
        if (sv.st === 1) {
          sv.x0 = Rand.range(Layout.left + 80, Layout.right - 80);
          sv.x1 = clamp(sv.x0 + (Rand.chance(0.5) ? 1 : -1) * Rand.range(260, 420), Layout.left + 40, Layout.right - 40);
          if (Math.abs(sv.x1 - sv.x0) < 200) sv.x1 = sv.x0 + (sv.x0 < Layout.cx ? 300 : -300);
          sv.H = Rand.range(Layout.h * 0.32, Layout.h * 0.52);
          sv.left += C.serpentWarn;
          Sound.clip("surge", 0.45, 1.35);
        } else if (sv.st === 2) {
          sv.left += C.serpentLeap; sv.bit = false;
          Sound.clip("serpent", 0.6);
          splash(sv.x0, 20);
          puff("snake23", sv.x0, surfaceAt(sv.x0) - 50, 240, 0.6, 0);
        } else {
          sv.left += C.serpentEvery / ((ROW && ROW.serpent) || 1) * Rand.range(0.75, 1.25);
          splash(sv.x1, 20);
          puff("snake24", sv.x1, surfaceAt(sv.x1) - 50, 240, 0.6, 0);
        }
      }
      if (sv.st !== 2) return;
      q = 1 - sv.left / C.serpentLeap;
      for (i = 0; i < C.serpentSegs; i++) {
        if (q - i * 0.045 < 0 || q - i * 0.045 > 1) continue;
        serpentAt(q - i * 0.045, p);
        if (p.y > surfaceAt(p.x)) continue;              // still under the crust
        if (!dead && !sv.bit && mallow.safe <= 0 &&
            Math.hypot(mallow.x - p.x, mallow.y - p.y) < segR(i) * 0.8 + C.mallowR * 0.8) bite(p);
        for (j = 0; j < rocks.length; j++) {
          rk = rocks[j];
          if (rk.sunk > 0 || rk.sp === "crust" || rk.sp === "magnet" || rk.smashed) continue;
          if (Math.hypot(rk.x - p.x, rk.y - p.y) < segR(i) * 0.8 + rk.r * 0.7) { rk.smashed = true; gone = true; }
        }
      }
      if (!gone) return;
      // what it went through breaks — a bomb goes up, a bubble pops
      for (j = rocks.length - 1; j >= 0; j--) {
        rk = rocks[j];
        if (!rk.smashed) continue;
        if (rk.sp === "bomb") { rk.smashed = false; shortFuse(rk, 0.05); continue; }
        rocks.splice(j, 1);
        if (rk.sp === "orb") { burstOrb(rk); continue; }
        if (mallow.host === rk) { loose(rk.vx, 0, null); mallow.blown = 0.5; }
        Sound.clip("shatter", 0.45, Rand.range(1.1, 1.25));
        Fx.burst(rk.x, rk.y, { color:["#5f4a46", "#c9b8a0", "#ff7a1a"], count:16, speed:320, life:.5, grav:600, size:5 });
      }
    }
    function bite(p) {
      serpent.bit = true;
      if (!hurt()) return;
      combo = 0; HUD.setRight(null);
      var dx = mallow.x - p.x, dy = mallow.y - p.y, dist = Math.hypot(dx, dy) || 1;
      loose(dx / dist * 650, Math.min(dy / dist * 650, -450), mallow.host);
      mallow.hot = 0.9; mallow.blown = 0.6; mallow.safe = 0.6;
      Sound.clip("burn", 0.7, 0.85);
      Fx.flash("#ff3b00", 0.3, 2.5);
      Fx.shake(10, 0.3);
      Pop.show("alert", { word:"Bitten!", at:"upper" });
    }

    // THE S'MORES: a biscuit and a chocolate drifting down, to be caught.
    function stepTreats(d) {
      var i, t, kind;
      treatT -= d;
      if (treatT <= 0) {
        treatT = C.smoreEvery * Rand.range(0.75, 1.25);
        kind = Rand.chance(C.superChance) ? "super"
             : !held.biscuit !== !held.chocolate && Rand.chance(0.7)
             ? (held.biscuit ? "chocolate" : "biscuit")
             : (Rand.chance(0.5) ? "biscuit" : "chocolate");
        // named once ever, the first time each one falls (the guide's page)
        if (kind === "super") Notify.learn("smores", "Super s'more", { sub:"Catch the super s'more to get every life back", mark:"super" });
        else Notify.learn("smores", INTRO.smores[0], { sub:INTRO.smores[1] });
        treats.push({ kind: kind, x: Rand.range(Layout.left + 50, Layout.right - 50), y: Layout.top - 30, ph: Rand.range(0, TAU),
                      design: Rand.int(0, 5) });
      }
      for (i = treats.length - 1; i >= 0; i--) {
        t = treats[i];
        t.ph += d * 2; t.y += C.smoreFall * d; t.x += Math.sin(t.ph) * 30 * d;
        if (!dead && Math.hypot(t.x - mallow.x, t.y - mallow.y) < C.mallowR + C.smoreR) { treats.splice(i, 1); catchTreat(t); continue; }
        if (t.y > surfaceAt(t.x)) {
          treats.splice(i, 1);
          Fx.burst(t.x, surfaceAt(t.x), { color:["#ffd166", "#ff7a1a"], count:6, speed:180, life:.4, grav:600, size:4 });
        }
      }
    }
    function catchTreat(t) {
      if (t.kind === "biscuit") Sound.clip("pickup", 0.55, 1.8);
      else Sound.clip("pickup", 0.55, 1.8);
      Fx.burst(t.x, t.y, { color:["#fff3dd", "#ffd166"], count:10, speed:200, life:.35, grav:300, size:4 });
      if (t.kind === "super") {                   // the whole thing: back to white
        Sound.clip("smore", 0.3, 0.9);
        if (toast > 0) {
          shade(-toast);
          Pop.show("bonus", { word:"Super s'more!", sub:"Every life back", at:"upper" });
        } else {
          boostT = C.smoreBoost;
          Pop.show("score", { word:"Super s'more!", sub:"Double points", at:"upper" });
        }
        Fx.ring(mallow.x, mallow.y, { from:20, to:160, color:"#fff3dd", width:8, life:.5 });
        return;
      }
      if (held[t.kind]) {                         // a second one of a kind: a few points
        score += 20; HUD.setScore(score);
        return;
      }
      held[t.kind] = t.design + 1;              // which picture it was, for the icon
      if (!held.biscuit || !held.chocolate) return;
      held.biscuit = held.chocolate = false;       // the s'more
      Sound.clip("smore", 0.7, 0.85);
      if (toast > 0) {
        shade(-1);
        Pop.show("bonus", { word:"S'more!", sub:"Life back", at:"upper" });
      } else {
        boostT = C.smoreBoost;
        Pop.show("score", { word:"S'more!", sub:"Double points", at:"upper" });
      }
      Fx.ring(mallow.x, mallow.y, { from:20, to:120, color:"#ffd166", width:6, life:.4 });
      // the s'more itself, held up for a beat over the body
      puff("smore" + cell(13 + Rand.int(0, 5)), mallow.x, mallow.y - 90, 140, 0.9, 0);
    }

    function fling(dirx, diry) {
      var rk = mallow.host, mid = !rk;
      if (mid) {                             // a recovery shot, and it is spent
        mallow.air--;
        Fx.ring(mallow.x, mallow.y, { from:14, to:82, color:"#ffd166", width:5, life:.3 });
      }
      var sp = jumpSpeed(rk);
      if (rk && rk.sp === "magnet") { rk.cool = C.magnetCool; magnetLaunch(rk); }
      mallow.vx = dirx * sp;
      mallow.vy = diry * sp;
      /* The structure it just left is out for the WHOLE flight, not only while
         they still overlap: a jump has to find a new hold, so the shot is a
         commitment instead of a way to hop in place on one safe rock. */
      mallow.ignore = rk;
      mallow.flying = true; mallow.host = null; mallow.hold = 0;
      if (rk && !ghost(rk)) {                // small rocks get kicked harder
        var m = Math.max(0.25, 60 / rk.r);
        rk.vx -= dirx * C.flingSpeed * C.recoil * m * 0.15;
        rk.vy -= diry * C.flingSpeed * C.recoil * m * 0.15;
      }
      if (mid) Sound.clip("fling", 0.3, Rand.range(1.22, 1.32));
      else Sound.clip("fling", 0.3, Rand.range(0.96, 1.08));
      Fx.burst(mallow.x, mallow.y, { color:["#fff3dd", "#ffd9a0"], count:9, speed:230,
                                     life:.3, grav:300, angle: Math.atan2(-diry, -dirx), spread: 1.5 });
    }

    /* ---- input ----------------------------------------------------------- */

    // Direction = body -> finger, at one fixed speed. A single tap is a whole
    // shot; holding it only slows time and draws the arc.
    function canShoot() { return !dead && (mallow.host !== null || mallow.air > 0); }

    function aimVec() {
      if (!aim || !canShoot()) return null;
      var dx = aim.x - mallow.x, dy = aim.y - mallow.y;
      var len = Math.hypot(dx, dy);
      if (len < C.aimMinDist) return null;
      return { x: dx / len, y: dy / len };
    }

    function onDown(p) { if (canShoot()) aim = { x: p.x, y: p.y }; }
    function onMove(p) { if (aim) { aim.x = p.x; aim.y = p.y; } }
    function onUp() {
      var v = aimVec();
      if (v) fling(v.x, v.y);
      aim = null;
    }

    /* ---- the run --------------------------------------------------------- */

    function reset() {
      score = 0; combo = 0; bestCombo = 0; rocksHit = 0; toast = 0; focus = 1; focusT = 0; hitsTaken = 0;
      elapsed = 0; wave = 0; wallT = 0; bonkT = 0; spawnT = 0.9;
      nextMile = C.milestone;
      dead = false; deadT = 0; sink = 0; aim = null;
      best = Store.get("bestScore", 0);
      lavaY = null; geometry();
      // the biome's place, under the round and the end screen
      if (BIO && BIO.scene) Art.backdrop(BIO.scene);
      /* ...and its window of the bed. The guard is not optional: without a
         level (the playable, the endless run) the build ships or plays the
         whole of what it has, and `null` asks for exactly that. */
      Music.play(CONFIG.level && BIO ? BIO.music : null);
      // the core's hazards, each only where the level's row asks for it
      surge = { ph: 0, left: C.surgeEvery * 0.6, off: 0 };
      drops = []; dropT = C.dropEvery * 1.5;
      geysers = ROW && ROW.geysers ? newGeysers(ROW.geysers) : [];
      orbT = C.orbEvery * 0.5; water = []; waterT = C.waterEvery; cool = 0;
      magnets = [];
      serpent = { st: 0, left: C.serpentEvery * 0.6 };
      treats = []; treatT = C.smoreEvery * 0.4; held = { biscuit: false, chocolate: false }; boostT = 0;

      rocks = []; bubbles = []; embers = [];
      // The rock the run starts on: dead centre, big, and already falling.
      var start = makeRock(Layout.cx, Layout.top + Layout.h * 0.34, 96, false);
      start.vx = 0; start.drift = 0; start.spin *= 0.4;
      start.fall = C.fallMin * 0.75; start.vy = start.fall;
      rocks.push(start);
      /* Four more, spread over the whole band and up past the ceiling. The
         opening is the one moment the player has no idea what the rhythm is,
         and an empty upper half reads as "there was nothing I could do". */
      spawnRock(Layout.top + Layout.h * 0.1, 0);
      spawnRock(Layout.top - 40, 0);
      spawnRock(Layout.top - 250, 0);
      spawnRock(Layout.top - 470, 0);
      if (ROW && ROW.magnets) magnets = newMagnets(ROW.magnets);

      mallow = { x:0, y:0, vx:0, vy:0, ang:-Math.PI / 2, tilt:0,
                 host: start, rel: -Math.PI / 2 - start.rot,
                 flying:false, ignore:null, hold:0, grip:1, air: C.airShots,
                 land:0, blown:0, hot:0, safe:0 };   // the sprite's pose timers, and the lava's grace
      puffs = [];
      ride();

      var i;
      for (i = 0; i < 26; i++) embers.push(newEmber(true));
      for (i = 0; i < 7; i++) bubbles.push(newBubble());

      HUD.setScoreNow(0);
      HUD.setLeft(4, "Lives");
      HUD.setRight(null);
      Fx.reset();
      buildSprites();

      /* What this level brings that the last one did not, named once per
         player (Notify.learn): its line in the "!" log opens the guide's page
         of the same key. A notice fired during the entrance waits for it. */
      if (ROW && ROW.intro) {
        for (i = 0; i < ROW.intro.length; i++) {
          var I = INTRO[ROW.intro[i]];
          if (I && !QUIET[ROW.intro[i]]) Notify.learn(ROW.intro[i], I[0], { sub: I[1] });
        }
      }
    }

    /* The body touched the lava, or rode a rock into it. Charred, it melts;
       otherwise it is thrown back up, a shade browner, with its mid-air shot
       back in hand to find a rock on the way, and the lava cannot catch it
       again until it has had the time to climb out. */
    /* Every change of toast goes through here: the shade, the HUD's lives,
       and the first life a player ever loses, the notice that names what it
       costs (the guide's "toast" page says the rest). */
    function shade(n) {
      toast = clamp(toast + n, 0, 3);
      HUD.setLeft(4 - toast, "Lives");
      if (n > 0) {
        HUD.punch("#ff6b1a");
        Notify.learn("toast", "Toasted", { sub:"A toasted marshmallow jumps shorter" });
      } else HUD.punch("#9dff8a");
    }
    // the jump, as heavy as the toast has made it
    function jumpSpeed(host) {
      return C.flingSpeed * (1 - C.toastSlow * toast) * (host && host.sp === "magnet" ? C.magnetBoost : 1);
    }

    // A hit: one state browner, or the end of a charred marshmallow.
    function hurt() {
      if (toast >= 3) { die(); return false; }
      hitsTaken++;
      shade(1);
      return true;
    }

    function lavaHit() {
      if (dead || mallow.safe > 0) return;
      if (toast + C.lavaHits > 3) { die(); return; }   // only a white one survives it
      hitsTaken++;
      shade(C.lavaHits);
      combo = 0; HUD.setRight(null);
      loose((mallow.host ? mallow.host.vx : mallow.vx) * 0.3, -C.lavaBounce, mallow.host);
      mallow.y = Math.min(mallow.y, surfaceAt(mallow.x) - C.mallowR - 2);
      mallow.air = C.airShots; mallow.safe = C.lavaGrace; mallow.hot = 1; mallow.blown = 0.6;
      splash(mallow.x, 18);
      Sound.clip("burn", 0.75, 0.9);
      Fx.flash("#ff6b1a", 0.3, 2.5);
      Fx.shake(9, 0.3);
      Pop.show("alert", { word:"Scorched!", sub:"Charred", at:"upper" });   // one hit, one callout
    }

    function die() {
      if (dead) return;
      dead = true; deadT = 0; sink = 0; aim = null;
      mallow.flying = false; mallow.host = null;
      Sound.clip("melt", 1, 0.7);
      Fx.flash("#ff6b1a", 0.5, 2.2);
      Fx.shake(13, 0.5);
      Fx.freeze(0.08);
      splash(mallow.x, 26);
      Pop.show("danger", { word:"Melted", at:"center" });
      Overlay.vignette("#ff3b00", 0.55);
    }

    function finish() {
      var stars = score >= 1100 ? 3 : score >= 500 ? 2 : score > 0 ? 1 : 0;
      endRound({
        title: stars === 3 ? Lang.t("Survivor!") : CONFIG.copy.gameOver,
        variant: stars === 3 ? "perfect" : "",
        score: score,
        stars: stars,
        rows: [
          { label:"Rocks", value: rocksHit },
          { label:"Best chain", value: bestCombo, grade:"accent" },
          { label:"Best score", value: Math.max(score, best), grade:"gold" }
        ]
      });
    }

    /* ---- ambience -------------------------------------------------------- */

    function newEmber(scatter) {
      return {
        x: Rand.range(0, view.w),
        y: scatter ? Rand.range(Layout.top, view.h) : view.h + 10,
        vy: -Rand.range(28, 90), vx: Rand.range(-16, 16),
        r: Rand.range(1.5, 3.6), a: Rand.range(0.25, 0.8), t: Rand.range(0, TAU)
      };
    }

    function newBubble() {
      return { x: Rand.range(20, view.w - 20), t: Rand.range(0, 1), life: Rand.range(1.1, 2.4), r: Rand.range(6, 16) };
    }

    function splash(x, n) {
      Fx.burst(x, surfaceAt(x), { color:["#ffd166", "#ff7a1a", "#ffe9c4"], count:n,
                                  speed:420, life:.6, grav:900, size:6 });
      Fx.ring(x, surfaceAt(x), { from:12, to:150, color:"#ffb347", width:6, life:.45 });
    }

    /* ---- update ---------------------------------------------------------- */

    function update(dt) {
      /* The finger slows time by as much focus as is left, and spends it doing
         so. Everything downstream runs on `d`, so a spent meter puts the whole
         world — rocks, lava, the clock the lava is — back to full speed while
         the finger is still down. */
      var aiming = !dead && !!aimVec();
      var d = dt * (aiming ? C.aimSlow + (1 - C.aimSlow) * (1 - focus) : 1);
      var i, j, rk, k;

      if (aiming) {
        focus = Math.max(0, focus - dt / C.focusSeconds);
        focusT = C.focusDelay;                     // the meter is locked on release
      } else if (focusT > 0) {
        focusT -= dt;
      } else {
        focus = Math.min(1, focus + dt / C.focusRefill);
      }

      elapsed += dt;
      wave += d * 1.5;
      if (wallT > 0) wallT -= dt;
      if (mallow.land > 0) mallow.land -= dt;
      if (mallow.blown > 0) mallow.blown -= dt;
      if (mallow.hot > 0) mallow.hot -= dt;
      if (mallow.safe > 0) mallow.safe -= dt;
      if (boostT > 0) boostT -= dt;
      for (i = puffs.length - 1; i >= 0; i--) {
        puffs[i].t += d;
        if (puffs[i].t >= puffs[i].life) puffs.splice(i, 1);
      }
      geometry();
      lavaY = lavaLo + (lavaHi - lavaLo) * clamp(elapsed / C.riseSeconds, 0, 1);
      k = ramp();

      // --- ambience (keeps running through the death beat) ---
      for (i = 0; i < embers.length; i++) {
        var e = embers[i];
        e.t += d * 3;
        e.y += e.vy * d; e.x += (e.vx + Math.sin(e.t) * 12) * d;
        if (e.y < Layout.top - 20) embers[i] = newEmber(false);
      }
      for (i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        b.t += d / b.life;
        if (b.t >= 1) bubbles[i] = newBubble();
      }

      // --- rocks: integrate, then let the lanes reassert themselves ---
      if (bonkT > 0) bonkT -= dt;
      for (i = 0; i < rocks.length; i++) {
        rk = rocks[i];
        if (rk.sunk > 0) continue;
        rk.x += rk.vx * d; rk.y += rk.vy * d; rk.rot += rk.spin * d;
        if (rk.hot) rk.x += Math.sin(elapsed * 2 + rk.seed) * 26 * d;
        // A bounce is a moment, not a new trajectory: both axes ease back to
        // the lane the rock was given, and the spin back toward its own.
        var s = Math.min(1, C.fallSettle * d);
        rk.vy += (rk.fall - rk.vy) * s;
        rk.vx += (rk.drift - rk.vx) * s;
      }
      collideRocks(d);

      // the core's hazards, before anything below reads the crust
      if (geysers.length) {
        stepGeysers(d);
        for (i = 0; i < geysers.length; i++) {
          if (geysers[i].st !== 2) continue;
          for (j = 0; j < rocks.length; j++) {
            rk = rocks[j];
            if (rk.sunk > 0 || rk.burning || ghost(rk) || Math.abs(rk.x - geysers[i].x) > C.geyserHalf + rk.r * 0.4) continue;
            if (rk.vy > -C.geyserRockMax) rk.vy = Math.max(rk.vy - C.geyserRock * d, -C.geyserRockMax);
          }
        }
      }
      if (ROW && ROW.surge) stepSurge(d);

      for (i = rocks.length - 1; i >= 0; i--) {
        rk = rocks[i];
        if (rk.x < Layout.left + rk.r) {
          rk.x = Layout.left + rk.r;
          rk.vx = Math.abs(rk.vx); rk.drift = Math.abs(rk.drift);
        }
        if (rk.x > Layout.right - rk.r) {
          rk.x = Layout.right - rk.r;
          rk.vx = -Math.abs(rk.vx); rk.drift = -Math.abs(rk.drift);
        }
        if (rk.y < Layout.top - 700) rk.y = Layout.top - 700;   // knocked too high

        /* A bubble climbs until it pops; a crust lies on the lake until it
           cracks back into it, and takes whoever stands on it down too. */
        if (rk.sp === "magnet") {
          rk.ph += d * 1.2; rk.y = rk.y0 + Math.sin(rk.ph) * 18; rk.vx = rk.vy = 0;
          if (rk.cool > 0) { rk.cool -= d; if (rk.cool <= 0) rk.used = false; }
          continue;
        }
        if (ghost(rk)) {
          if (rk.sunk === 0) {
            rk.life -= d;
            if (rk.sp === "orb" && (rk.life <= 0 || rk.y < Layout.top + rk.r)) { rocks.splice(i, 1); burstOrb(rk); continue; }
            if (rk.sp === "crust") {
              rk.y = surfaceAt(rk.x) - rk.r * 0.12; rk.vy = 0;
              if (rk.life <= 0) rk.sunk = 0.001;
            }
          }
          if (rk.sunk > 0) {
            if (mallow.host === rk && !dead) lavaHit();
            rk.sunk += d;
            if (rk.sunk > 0.6) rocks.splice(i, 1);
          }
          continue;
        }

        // A lit fuse runs out: the rock splits, crumbles or blows, and is gone.
        if (rk.armed && rk.sunk === 0) {
          rk.fuse -= d;
          rk.ph += d * (4 + 26 * (1 - rk.fuse / rk.fuse0));     // a bomb's pulse quickens
          if (rk.fuse <= 0) { rocks.splice(i, 1); pop(rk); continue; }
        }

        // The base kisses the crust: the structure catches fire — save ice,
        // which hisses away, and a bomb, which goes up there and then.
        if (!rk.burning && rk.sunk === 0 && rk.y + rk.r * 0.8 > surfaceAt(rk.x)) {
          if (rk.sp === "bomb") { rocks.splice(i, 1); explode(rk); continue; }
          if (rk.sp === "ice") hiss(rk); else ignite(rk);
        }
        if (rk.burning) rk.burn += d;

        // Then it melts, and it takes whoever is still riding it.
        if (rk.sunk > 0 || rk.burn > C.burnSeconds || rk.y - rk.r * 0.35 > surfaceAt(rk.x)) {
          if (mallow.host === rk && !dead) lavaHit();
          if (rk.sunk === 0) {
            // a rock that burned out up in the air leaves ash, not a splash
            if (rk.y + rk.r < surfaceAt(rk.x) - 40) {
              Fx.burst(rk.x, rk.y, { color:["#5f4a46", "#c9b8a0", "#ff7a1a"], count:14, speed:200, life:.5, grav:500, size:5 });
            } else splash(rk.x, rk.hot ? 8 : 14);
            Sound.clip("crumble", 0.24, 1.4);
          }
          rk.sunk += d;
          if (rk.sunk > 0.5) rocks.splice(i, 1);
          continue;
        }
      }

      /* The cap counts what fell from the ceiling: the pieces of a split rock
         are a bonus down where it broke, and counting them would starve the
         top of the fall for as long as they last. */
      var fell = 0;
      for (i = 0; i < rocks.length; i++) if (!rocks[i].piece && !ghost(rocks[i])) fell++;
      spawnT -= d;
      if ((spawnT <= 0 && fell < C.maxRocks) || fell < C.minRocks) {
        spawnT = (C.spawnEvery + (C.spawnMin - C.spawnEvery) * k) * Rand.range(0.75, 1.25);
        spawnRock(Layout.top - 150, k);
      }
      if (ROW && ROW.drops) stepDrops(d);
      if (ROW && ROW.orbs) {
        orbT -= d;
        if (orbT <= 0) { orbT = C.orbEvery / ROW.orbs * Rand.range(0.75, 1.25); spawnOrb(); }
      }
      if (ROW && ROW.water) stepWater(d);
      if (cool > 0) cool = Math.max(0, cool - C.coolBack * d);
      if (ROW && ROW.serpent) stepSerpent(d);
      if (ROW && ROW.smores !== 0) stepTreats(d);

      if (dead) {
        deadT += dt;
        sink += dt * 120;                        // the body slides under the crust
        if (deadT > 1.5) finish();
        return;
      }

      // --- the marshmallow ---
      if (mallow.flying) {
        mallow.vy += C.gravity * d;
        // a geyser's column takes over from gravity, up to its own speed
        if (geysers.length && mallow.vy > -C.geyserMax && lift(mallow.x, 0)) {
          mallow.vy = Math.max(mallow.vy - C.geyserPush * d, -C.geyserMax);
        }
        if (magnets.length) {
          var mp = magnetPull(mallow.x, mallow.y, {});
          mallow.vx += mp.x * d; mallow.vy += mp.y * d;
        }
        mallow.x += mallow.vx * d; mallow.y += mallow.vy * d;
        if (mallow.x < Layout.left + C.mallowR) {
          mallow.x = Layout.left + C.mallowR; mallow.vx = -mallow.vx * C.wallBounce; bump();
        }
        if (mallow.x > Layout.right - C.mallowR) {
          mallow.x = Layout.right - C.mallowR; mallow.vx = -mallow.vx * C.wallBounce; bump();
        }
        if (mallow.y < Layout.top + C.mallowR) {
          mallow.y = Layout.top + C.mallowR; mallow.vy = -mallow.vy * C.wallBounce; bump();
        }
        mallow.ang = Math.atan2(mallow.vy, mallow.vx);

        for (i = 0; i < rocks.length; i++) {
          rk = rocks[i];
          if (rk.sunk > 0) continue;
          if (rk === mallow.ignore) continue;   // no going back to what we left
          if (rk.sp === "magnet" && rk.cool > 0) continue;
          if (hits(rk)) { attach(rk); break; }
        }
      } else if (mallow.host) {
        ride(d);
        if (mallow.host.hot) {                  // a fireball only lends its back
          mallow.hold += d;
          if (mallow.hold >= C.fireHold) {
            var a = mallow.ang;
            fling(Math.cos(a), Math.sin(a) - 0.5);
            mallow.vx *= C.fireEject / C.flingSpeed;
            mallow.vy *= C.fireEject / C.flingSpeed;
            mallow.blown = 0.5; mallow.hot = 0.9;
            if (!hurt()) return;                     // it stayed too long: that burns
            Pop.show("alert", { word:"Burnt!", at:"upper" });
            Sound.clip("crumble", 0.6);
          }
        } else if (mallow.host.sp === "magnet") {   // a crystal holds a beat
          mallow.hold += d;
          if (mallow.hold >= C.magnetHold) fling(0, -1);
        } else if (mallow.host.sp === "ice") {  // ice does not hold at all
          mallow.hold += d;
          if (mallow.hold >= C.iceHold) iceKick();
        }
      }

      /* The lean, eased. The target is how far the planting axis has swung off
         vertical — clamped, so the character tips into the rock it is clinging
         to and into the arc of a jump, and never past the point where its own
         face stops reading. */
      var lean = clamp(wrapAngle(mallow.ang + Math.PI / 2), -C.leanMax, C.leanMax);
      mallow.tilt += (lean - mallow.tilt) * Math.min(1, d * C.leanEase);

      if (!(mallow.host && mallow.host.sp === "crust") && mallow.y + C.mallowR > surfaceAt(mallow.x)) lavaHit();
    }

    // The cave walls, rate-limited: a body pinballing in a corner would
    // otherwise fire the same clip every frame.
    function bump() {
      if (wallT > 0) return;
      wallT = 0.12;
      Sound.clip("wall", 0.2, Rand.range(0.95, 1.2));
      Fx.burst(mallow.x, mallow.y, { color:"#c9b8a0", count:5, speed:200, life:.25, grav:500, size:3 });
    }

    /* ---- sprites --------------------------------------------------------- */

    function buildSprites() { bg = null; buildFire(); buildSteam(); buildAuras(); }

    // The fireballs' auras, one soft disc per colour, drawn once.
    var auraCv = [];
    function buildAuras() {
      var S = 160, i, c, g, col;
      auraCv = [];
      for (i = 0; i < C.auras.length; i++) {
        auraCv[i] = makeCanvas(S, S);
        c = auraCv[i].getContext("2d"); col = C.auras[i];
        g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
        g.addColorStop(0, rgba(col, 0.95));
        g.addColorStop(0.42, rgba(col, 0.75));
        g.addColorStop(0.68, rgba(col, 0.3));
        g.addColorStop(1, rgba(col, 0));
        c.fillStyle = g;
        c.beginPath(); c.arc(S / 2, S / 2, S / 2, 0, TAU); c.fill();
      }
    }

    // A geyser's column, drawn once as a soft vertical band and stretched to
    // the height it blows each frame.
    function buildSteam() {
      steam = makeCanvas(64, 8);
      var c = steam.getContext("2d");
      var g = c.createLinearGradient(0, 0, 64, 0);
      g.addColorStop(0, "rgba(255,250,225,0)");
      g.addColorStop(0.3, "rgba(255,250,225,.35)");
      g.addColorStop(0.5, "rgba(255,255,245,.6)");
      g.addColorStop(0.7, "rgba(255,250,225,.35)");
      g.addColorStop(1, "rgba(255,250,225,0)");
      c.fillStyle = g; c.fillRect(0, 0, 64, 8);
    }

    // The fireball halo, drawn once: a per-frame shadowBlur or radial gradient
    // for every fireball on screen is the one thing that costs a frame here.
    function buildFire() {
      var S = 168, c;
      fire = makeCanvas(S, S);
      c = fire.getContext("2d");
      var g = c.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
      g.addColorStop(0, "#fffdf0");
      g.addColorStop(0.18, "#ffe08a");
      g.addColorStop(0.36, "#ff9d2e");
      g.addColorStop(0.62, "rgba(255,88,10,.45)");
      g.addColorStop(1, "rgba(255,50,0,0)");
      c.fillStyle = g;
      c.beginPath(); c.arc(S / 2, S / 2, S / 2, 0, TAU); c.fill();
    }

    function buildBackground() {
      bg = makeCanvas(view.w, view.h);
      var c = bg.getContext("2d"), i, x, h;
      var g = c.createLinearGradient(0, 0, 0, view.h);
      g.addColorStop(0, "#150912");
      g.addColorStop(0.5, "#1b0c11");
      g.addColorStop(0.84, "#2c0f0b");
      g.addColorStop(1, "#571604");
      c.fillStyle = g; c.fillRect(0, 0, view.w, view.h);

      // basalt down both edges — one jagged silhouette per side
      c.fillStyle = "rgba(9,4,8,.85)";
      wall(c, 0, 1); wall(c, view.w, -1);

      // stalactites, so the ceiling the rocks fall from is a place
      c.fillStyle = "rgba(7,3,6,.9)";
      for (i = 0; i < 9; i++) {
        x = 30 + i * (view.w - 60) / 8;
        h = 46 + ((i * 37) % 5) * 24;
        c.beginPath(); c.moveTo(x - 26, 0); c.lineTo(x + 26, 0); c.lineTo(x, h); c.closePath(); c.fill();
      }

      // the lava's bounce light on the walls
      var lg = c.createRadialGradient(view.w / 2, view.h * 1.06, 40, view.w / 2, view.h * 1.06, view.h * 0.58);
      lg.addColorStop(0, "rgba(255,120,20,.42)");
      lg.addColorStop(1, "rgba(255,60,0,0)");
      c.fillStyle = lg; c.fillRect(0, 0, view.w, view.h);
    }

    function wall(c, x0, dir) {
      var i, w;
      c.beginPath(); c.moveTo(x0, 0);
      for (i = 0; i <= 18; i++) {
        w = 14 + Math.sin(i * 1.9) * 8 + (i % 3) * 5;
        c.lineTo(x0 + dir * w, i * view.h / 18);
      }
      c.lineTo(x0, view.h); c.closePath(); c.fill();
    }

    function onResize() { geometry(); buildSprites(); }

    /* ---- render ---------------------------------------------------------- */

    function render() {
      /* The cavern is the painted scene (CONFIG.sceneArt), a CSS layer under
         the canvas the frame pipeline has already wiped — so the pre-rendered
         walls, stalactites and bounce light it replaces are never built at all.
         buildBackground() stays as the fallback for a build with no artwork on
         disk. */
      if (!Art.scene()) {
        if (!bg) buildBackground();
        ctx.drawImage(bg, 0, 0, bg._w, bg._h);
      }
      drawEmbers();
      if (geysers.length) drawColumns();       // the steam goes behind the rocks
      if (magnets.length) drawMagnets();       // and the fields

      // A rock that caught fire keeps its silhouette and wears the flames on
      // top: it reads as "that rock is burning", not as a new object.
      var i;
      for (i = 0; i < rocks.length; i++) if (!rocks[i].hot) enterRock(rocks[i], drawRock);
      // the burning ones go over the plain ones: a rock that is about to give
      // way is the read the player needs, and array order must not bury it
      for (i = 0; i < rocks.length; i++) if (rocks[i].burning) enterRock(rocks[i], drawRock);
      for (i = 0; i < rocks.length; i++) if (rocks[i].hot) enterRock(rocks[i], drawFire);
      drawFuses();
      if (puffs.length) drawPuffs();
      if (drops.length) drawDrops();
      if (water.length) drawWater();
      if (treats.length) drawTreats();
      if (serpent.st === 2) drawSerpent();     // under the lake's surface, the lake hides it

      if (dead) drawMallow();          // sinking: the crust closes over it
      if (Enter.begin(view.w / 2, (lavaY + view.h) / 2)) {
        drawLava();
        if (geysers.length) drawVents();
        if (serpent.st === 1) drawSwirl();
        Enter.end();
      }
      if (!dead && Enter.begin(mallow.x, mallow.y)) {
        drawAim(); drawMallow(); drawFocusBar(); drawHeld();
        Enter.end();
      }
      heatHaze();
    }

    /* THE HEAT HAZE. The band over the crust is copied once, cleared, and
       laid back in thin strips, each nudged sideways on a slow wave that
       grows toward the lava. In device pixels, through the transform the
       motor drew with; a WebView with no getTransform simply has no haze. */
    var hazeCv = null;
    function heatHaze() {
      var H = C.haze;
      if (!H || !ctx.getTransform) return;
      var T = ctx.getTransform(), cv = ctx.canvas;
      var crust = lavaY - surge.off + cool;
      var y0 = Math.max(0, Math.floor(T.f + T.d * (crust - H.band)));
      var y1 = Math.min(cv.height, Math.ceil(T.f + T.d * (crust + H.below)));
      var h = y1 - y0, step = Math.max(2, Math.round(H.strip * T.d)), y, k, dx, mid = T.d * H.band;
      if (h < step * 2) return;
      if (!hazeCv || hazeCv.width !== cv.width || hazeCv.height < h) {
        hazeCv = document.createElement("canvas");
        hazeCv.width = cv.width; hazeCv.height = h;
      }
      var hc = hazeCv.getContext("2d");
      hc.clearRect(0, 0, hazeCv.width, h);
      hc.drawImage(cv, 0, y0, cv.width, h, 0, 0, cv.width, h);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, y0, cv.width, h);
      for (y = 0; y < h; y += step) {
        k = Math.min(1, y / mid);                 // 0 at the top of the band, 1 at the crust
        dx = Math.sin((y0 + y) / T.d * 0.085 + wave * 4.5) * H.amp * T.a * k * k;
        ctx.drawImage(hazeCv, 0, y, cv.width, step, dx, y0 + y, cv.width, step);
      }
      ctx.restore();
    }

    /* The rocks, the lake and the body are the elements of the round's
       entrance (Enter), landing in that order. A rock still above the glass
       takes no beat of it: nothing of it would be seen landing. */
    function enterRock(rk, draw) {
      if (rk.y + rk.r * 2 < 0) { draw(rk); return; }
      if (Enter.begin(rk.x, rk.y + rk.sunk * 60)) { draw(rk); Enter.end(); }
    }

    // The embers are the one thing a biome recolours: frost, sulphur, ash.
    function drawEmbers() {
      var i, e, col = BIO ? BIO.ember : "#ff9d2e";
      for (i = 0; i < embers.length; i++) {
        e = embers[i];
        ctx.fillStyle = rgba(col, e.a * (0.5 + 0.5 * Math.sin(e.t)));
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill();
      }
    }

    /* The silhouette, built from the same radius array radiusAt() reads. A
       faceted kind is drawn straight from vertex to vertex; a weathered one is
       smoothed through the midpoints, which rounds the profile without moving
       it off the numbers the physics uses. Call it again before stroking: the
       texture below beginPath()s over it. */
    function outline(rk) {
      var K = KINDS[rk.kind], n = rk.shape.length, R = rk.r, i, j;
      ctx.beginPath();
      if (!K.round) {
        ctx.moveTo(rk.ux[0] * R, rk.uy[0] * R);
        for (i = 1; i < n; i++) ctx.lineTo(rk.ux[i] * R, rk.uy[i] * R);
      } else {
        ctx.moveTo((rk.ux[n - 1] + rk.ux[0]) * 0.5 * R, (rk.uy[n - 1] + rk.uy[0]) * 0.5 * R);
        for (i = 0; i < n; i++) {
          j = (i + 1) % n;
          ctx.quadraticCurveTo(rk.ux[i] * R, rk.uy[i] * R,
                               (rk.ux[i] + rk.ux[j]) * 0.5 * R, (rk.uy[i] + rk.uy[j]) * 0.5 * R);
        }
      }
      ctx.closePath();
    }

    /* The inside of a rock, clipped to its outline. `fresh` is the only thing
       the player has to read — a rock that still scores is lit and molten, a
       claimed one is cold — so every kind says it the same way, in its own
       material. */
    function texture(rk, K, fresh) {
      var R = rk.r, n = rk.shape.length, i, j, v, mx, my;

      if (K.tex === "cracks") {
        ctx.strokeStyle = fresh ? "rgba(255,140,44,.8)" : "rgba(120,90,90,.3)";
        ctx.lineWidth = Math.max(2.5, R * (fresh ? 0.09 : 0.05));
        for (i = 0; i < rk.marks.length; i++) {
          v = rk.marks[i];
          ctx.beginPath();
          ctx.moveTo(Math.cos(v.a) * R, Math.sin(v.a) * R);
          ctx.quadraticCurveTo(Math.cos(v.b) * R * v.w, Math.sin(v.b) * R * v.w,
                               Math.cos(v.b) * R, Math.sin(v.b) * R);
          ctx.stroke();
        }

      } else if (K.tex === "facets") {
        /* One triangle per edge, meeting at an apex the rock carries off
           centre: a fan that met dead centre and alternated a single tone read
           as a parasol. Five tones cycled by a per-rock offset instead, so no
           two crystals catch the light the same way. */
        var ax = rk.marks[0].x * R, ay = rk.marks[0].y * R, tone;
        for (i = 0; i < n; i++) {
          j = (i + 1) % n;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(rk.ux[i] * R, rk.uy[i] * R);
          ctx.lineTo(rk.ux[j] * R, rk.uy[j] * R);
          ctx.closePath();
          tone = (i * 3 + rk.marks[0].o) % 5;
          ctx.fillStyle = tone === 0 ? "rgba(0,0,0,.3)"
                        : tone === 1 ? "rgba(0,0,0,.16)"
                        : tone === 2 ? "rgba(255,255,255,.03)"
                        : fresh ? (tone === 3 ? "rgba(186,168,255,.14)" : "rgba(214,200,255,.22)")
                                : (tone === 3 ? "rgba(150,140,180,.06)" : "rgba(170,160,195,.1)");
          ctx.fill();
        }
        if (fresh) {                                  // the glint, out at the rim
          ctx.strokeStyle = "rgba(230,214,255,.75)";
          ctx.lineWidth = Math.max(2, R * 0.055);
          ctx.beginPath();
          ctx.moveTo(rk.ux[0] * R * 0.62, rk.uy[0] * R * 0.62);
          ctx.lineTo(rk.ux[0] * R * 0.96, rk.uy[0] * R * 0.96);
          ctx.stroke();
        }

      } else if (K.tex === "strata") {
        // horizontal beds: a plate of stone laid down in layers
        for (i = 0; i < rk.marks.length; i++) {
          v = rk.marks[i];
          ctx.fillStyle = i % 2 ? "rgba(0,0,0,.24)"
                                : (fresh ? "rgba(255,196,130,.13)" : "rgba(190,175,160,.05)");
          ctx.fillRect(-R, v.y * R, R * 2, v.h * R);
        }
        ctx.strokeStyle = fresh ? "rgba(255,150,60,.6)" : "rgba(120,100,90,.28)";
        ctx.lineWidth = Math.max(2, R * 0.045);
        for (i = 0; i < rk.marks.length; i += 2) {
          ctx.beginPath();
          ctx.moveTo(-R, rk.marks[i].y * R); ctx.lineTo(R, rk.marks[i].y * R);
          ctx.stroke();
        }

      } else if (K.tex === "blades") {
        // a dark core, so the spikes read as blades stuck into it
        ctx.beginPath();
        for (i = 0; i < n; i++) {
          if (i === 0) ctx.moveTo(rk.ux[i] * R * 0.5, rk.uy[i] * R * 0.5);
          else ctx.lineTo(rk.ux[i] * R * 0.5, rk.uy[i] * R * 0.5);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fill();
        ctx.strokeStyle = fresh ? "rgba(255,120,40,.7)" : "rgba(120,95,105,.3)";
        ctx.lineWidth = Math.max(2, R * 0.05);
        for (i = 0; i < n; i++) {                     // one edge up each point
          if (!rk.tips[i]) continue;
          ctx.beginPath();
          ctx.moveTo(rk.ux[i] * R * 0.36, rk.uy[i] * R * 0.36);
          ctx.lineTo(rk.ux[i] * R, rk.uy[i] * R);
          ctx.stroke();
        }

      } else if (K.tex === "holes") {
        for (i = 0; i < rk.marks.length; i++) {
          v = rk.marks[i];
          mx = Math.cos(v.a) * R * v.d; my = Math.sin(v.a) * R * v.d;
          ctx.fillStyle = "rgba(0,0,0,.45)";
          ctx.beginPath(); ctx.arc(mx, my, v.w * R, 0, TAU); ctx.fill();
          ctx.fillStyle = fresh ? "rgba(255,170,80,.26)" : "rgba(180,170,160,.09)";
          ctx.beginPath(); ctx.arc(mx, my + v.w * R * 0.36, v.w * R * 0.66, 0, TAU); ctx.fill();
        }
      }
    }

    function drawRock(rk) {
      var K = KINDS[rk.kind], fresh = !rk.used;
      if (rk.sp === "orb") { drawOrb(rk); return; }
      if (rk.sp === "crust") { drawCrust(rk); return; }
      if (rk.sp === "magnet") { drawCrystal(rk); return; }

      /* The smear behind a fast one. It is the only cue that says "this lane is
         quick" before it goes past, and it is a plain scaled arc — no
         shadowBlur, no gradient, nothing per-frame that costs a raster. */
      if (rk.vy > C.fastRead && rk.sunk === 0 && !rk.burning) {
        var tl = Math.min((rk.vy - C.fastRead) / 240, 1);
        ctx.save();
        ctx.translate(rk.x, rk.y - rk.r * 0.66);
        ctx.fillStyle = rgba("#ff8a1f", 0.13 * tl);
        ctx.scale(0.4, 1.25);
        ctx.beginPath(); ctx.arc(0, 0, rk.r, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba("#ffd9a0", 0.11 * tl);
        ctx.scale(0.45, 0.8);
        ctx.beginPath(); ctx.arc(0, 0, rk.r, 0, TAU); ctx.fill();
        ctx.restore();
      }

      /* A painted rock wears its picture, in the state it is in, and trembles
         on the last half second of a lit fuse. Ice hissing away is its puff
         now, not a rock. A piece of a cracked rock goes cold once claimed. */
      var key = rockKey(rk);
      if (key) {
        if (rk.sp === "ice" && rk.sunk > 0) return;
        var img = rk.frag != null && rk.used ? darkOf(key) : sprite(key), m = measure(key);
        if (img && m) {
          var jit = rk.armed && rk.fuse < 0.5 ? 2.5 : 0;
          drawBody(img, m, rk.x + Rand.range(-jit, jit), rk.y + rk.sunk * 60 + Rand.range(-jit, jit), rk.rot, rk.r);
          return;
        }
      }

      ctx.save();
      ctx.translate(rk.x, rk.y + rk.sunk * 60); ctx.rotate(rk.rot);

      var S = rk.sp ? SP[rk.sp] : null;
      // a crumbling rock trembles on its last half second
      if (rk.armed && rk.sp === "dust" && rk.fuse < 0.5) ctx.translate(Rand.range(-2, 2), Rand.range(-2, 2));

      outline(rk);
      ctx.fillStyle = S ? (fresh ? S.fill : S.used) : (fresh ? K.fill : K.used);
      ctx.fill();

      ctx.save(); ctx.clip();
      // lit face, from the ceiling side
      ctx.fillStyle = fresh ? "rgba(255,214,170,.17)" : "rgba(200,180,190,.06)";
      ctx.fillRect(-rk.r, -rk.r, rk.r * 2, rk.r * 0.9);
      // a rock that caught fire is heated right through
      if (rk.burning) { ctx.fillStyle = "rgba(255,104,20,.38)"; ctx.fillRect(-rk.r, -rk.r, rk.r * 2, rk.r * 2); }
      if (S) special(rk, fresh); else texture(rk, K, fresh);
      ctx.restore();

      // the silhouette, then a hot rim on top of it while the rock is unclaimed
      // (a special wears its own rim, claimed or not: what it IS never fades)
      outline(rk);
      ctx.strokeStyle = "rgba(12,6,10,.95)";
      ctx.lineWidth = 5; ctx.stroke();
      if (S || fresh) {
        ctx.strokeStyle = S ? S.rim : "rgba(255,150,50,.5)";
        ctx.lineWidth = S ? 3 : 2; ctx.stroke();
      }
      ctx.restore();
    }

    /* The inside of a special rock, in the rock's own frame and clipped to it.
       Each one shows what it will do: the facets of ice, the faults a cracked
       rock will split along (so its three pieces are seen before they come
       apart), the grains of a crumbling one, the core of a bomb. */
    function special(rk, fresh) {
      var R = rk.r, i, v, a, t, w;
      if (rk.sp === "ice") {
        texture(rk, KINDS[1], fresh);
        ctx.fillStyle = "rgba(232,251,255,.16)";
        ctx.fillRect(-R, -R, R * 2, R * 0.75);
        ctx.strokeStyle = "rgba(240,253,255,.8)";
        ctx.lineWidth = Math.max(2, R * 0.05);
        ctx.beginPath();
        ctx.moveTo(-R * 0.5, -R * 0.2); ctx.lineTo(-R * 0.2, -R * 0.52);
        ctx.moveTo(-R * 0.3, R * 0.05); ctx.lineTo(R * 0.15, -R * 0.4);
        ctx.stroke();

      } else if (rk.sp === "shard") {
        t = rk.armed ? 1 - rk.fuse / rk.fuse0 : 0;
        for (i = 0; i < 3; i++) {
          a = rk.cuts[i];
          ctx.beginPath();
          ctx.moveTo(R * 0.06, -R * 0.04);
          ctx.lineTo(Math.cos(a + 0.25) * R * 0.5, Math.sin(a + 0.25) * R * 0.5);
          ctx.lineTo(Math.cos(a) * R * 1.2, Math.sin(a) * R * 1.2);
          ctx.strokeStyle = "rgba(10,6,8,.85)";
          ctx.lineWidth = R * (0.13 + 0.1 * t); ctx.stroke();
          ctx.strokeStyle = rgba("#ffe08a", (fresh ? 0.55 : 0.3) + 0.45 * t);
          ctx.lineWidth = R * (0.04 + 0.05 * t); ctx.stroke();
        }

      } else if (rk.sp === "dust") {
        for (i = 0; i < rk.grains.length; i++) {
          v = rk.grains[i];
          ctx.fillStyle = v.l ? (fresh ? "rgba(255,232,190,.42)" : "rgba(200,180,150,.16)") : "rgba(30,20,10,.38)";
          ctx.beginPath(); ctx.arc(Math.cos(v.a) * R * v.d, Math.sin(v.a) * R * v.d, v.w * R, 0, TAU); ctx.fill();
        }

      } else if (rk.sp === "bomb") {
        // the core pulses, and a lit fuse makes it race and whiten
        t = rk.armed ? 1 - rk.fuse / rk.fuse0 : 0;
        w = 0.5 + 0.5 * Math.sin(rk.armed ? rk.ph : wave * 3 + rk.seed);
        ctx.fillStyle = "rgba(0,0,0,.4)";
        ctx.beginPath(); ctx.arc(0, 0, R * 0.48, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba("#ff3b30", 0.45 + 0.5 * w);
        ctx.beginPath(); ctx.arc(0, 0, R * (0.3 + 0.06 * w), 0, TAU); ctx.fill();
        ctx.fillStyle = rgba("#fff1b0", 0.25 + 0.7 * w * t);
        ctx.beginPath(); ctx.arc(0, 0, R * 0.14, 0, TAU); ctx.fill();
      }
    }

    /* The clocks, over every rock: a lit fuse as a ring that runs out (and a
       bomb's reach as a dashed circle, so "get away" has a distance on it),
       and the short beat an ice rock holds the body for. */
    function drawFuses() {
      var i, rk, t, y;
      ctx.lineCap = "round";
      for (i = 0; i < rocks.length; i++) {
        rk = rocks[i];
        if (rk.sunk > 0) continue;
        y = rk.y;
        if (rk.armed) {
          t = clamp(rk.fuse / rk.fuse0, 0, 1);
          ctx.strokeStyle = SP[rk.sp].ring; ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(rk.x, y, rk.r + 16, -Math.PI / 2, -Math.PI / 2 + TAU * t);
          ctx.stroke();
          if (rk.sp === "bomb") {
            ctx.setLineDash([14, 12]);
            ctx.strokeStyle = rgba("#ff5a3c", 0.25 + 0.45 * (1 - t));
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(rk.x, y, rk.r + C.bombReach, 0, TAU); ctx.stroke();
            ctx.setLineDash([]);
          }
        } else if (rk.sp === "ice" && mallow.host === rk) {
          t = 1 - clamp(mallow.hold / C.iceHold, 0, 1);
          ctx.strokeStyle = "#e8fbff"; ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(rk.x, y, rk.r + 16, -Math.PI / 2, -Math.PI / 2 + TAU * t);
          ctx.stroke();
        }
      }
      ctx.lineCap = "butt";
    }

    /* The flame a burning rock wears: the row is how far its burn has gone,
       the column a frame of the loop at ~12 fps. A build carrying the full
       blaze alone (the playable) shows that row throughout. */
    function flameKey(rk) {
      var t = rk.burn / C.burnSeconds;
      var row = rk.sunk > 0 ? 3 : t < 0.2 ? 0 : t < 0.65 ? 1 : 2;
      var frame = Math.floor(wave * 8 + rk.seed * 3) % 6, key = "flame" + cell(row * 6 + frame + 1);
      return sprite(key) ? key : "flame" + cell(6 + frame + 1);
    }

    /* Where a flame's hole is: the transparent pixels walled in on all four
       sides, read once off a 96 px copy — their centre — and how wide the
       flames are around it. */
    var HOLE = {};
    function holeOf(key) {
      if (HOLE[key] !== undefined) return HOLE[key];
      var im = sprite(key);
      if (!im) return null;
      var m = null;
      try {
        var k = 96 / Math.max(im.naturalWidth, im.naturalHeight);
        var w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        var g = c.getContext("2d"); g.drawImage(im, 0, 0, w, h);
        var px = g.getImageData(0, 0, w, h).data, x, y, n = 0, sx = 0, sy = 0;
        var rl = [], rr = [], ct = [], cb = [];
        for (y = 0; y < h; y++) { rl[y] = w; rr[y] = -1; }
        for (x = 0; x < w; x++) { ct[x] = h; cb[x] = -1; }
        for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
          if (px[(y * w + x) * 4 + 3] <= 110) continue;
          if (x < rl[y]) rl[y] = x; if (x > rr[y]) rr[y] = x;
          if (y < ct[x]) ct[x] = y; if (y > cb[x]) cb[x] = y;
        }
        for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
          if (px[(y * w + x) * 4 + 3] > 110) continue;
          if (x > rl[y] && x < rr[y] && y > ct[x] && y < cb[x]) { n++; sx += x; sy += y; }
        }
        var x0 = w, x1 = -1;
        for (y = 0; y < h; y++) { if (rl[y] < x0) x0 = rl[y]; if (rr[y] > x1) x1 = rr[y]; }
        // the hole's centre, and the width of the flames themselves
        if (n > 8) m = { cx: sx / n / k, cy: sy / n / k, w: (x1 - x0 + 1) / k };
      } catch (e) { m = null; }
      HOLE[key] = m;
      return m;
    }

    // A giant bubble of lava: a glossy skin, a bright cap, wobbling as it climbs.
    function drawOrb(rk) {
      var r = rk.r, w = 1 + Math.sin(wave * 5 + rk.seed) * 0.05, left = rk.life / C.orbLife;
      ctx.save();
      ctx.translate(rk.x, rk.y); ctx.scale(w, 2 - w);
      ctx.drawImage(auraCv[1] || fire, -r * 1.6, -r * 1.6, r * 3.2, r * 3.2);
      ctx.fillStyle = "rgba(194,48,10,.92)";
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(255,166,46,.95)";
      ctx.beginPath(); ctx.arc(0, r * 0.06, r * 0.86, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(255,232,150,.9)";
      ctx.beginPath(); ctx.ellipse(-r * 0.18, -r * 0.42, r * 0.5, r * 0.26, -0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath(); ctx.arc(-r * 0.42, -r * 0.5, r * 0.11, 0, TAU); ctx.fill();
      ctx.restore();
      // how long before it pops, around it
      ctx.strokeStyle = left < 0.3 ? "#ff3b30" : "rgba(255,243,221,.8)";
      ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(rk.x, rk.y, r + 12, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(left, 0, 1)); ctx.stroke();
      ctx.lineCap = "butt";
    }

    /* A crust of cooled lava, painted (crust01-12): three plates, four states
       — still steaming for its first second, solid, cracking on its last
       1.6 s, breaking as it sinks. The vector plate is the fallback. */
    function drawCrust(rk) {
      var left = clamp(rk.life / C.crustLife, 0, 1), y = rk.y + rk.sunk * 40, i, a;
      var row = rk.sunk > 0 ? 3 : C.crustLife - rk.life < 1 ? 0 : rk.life < 1.6 ? 2 : 1;
      var im = sprite("crust" + cell(row * 3 + (rk.design || 0) + 1));
      if (im) {
        var cs = rk.r * 2 * 1.15 / im.width;
        ctx.save();
        if (rk.sunk > 0) ctx.globalAlpha = clamp(1 - rk.sunk / 0.6, 0, 1);
        ctx.drawImage(im, rk.x - im.width * cs / 2, y - im.height * cs / 2, im.width * cs, im.height * cs);
        ctx.restore();
        return;
      }
      ctx.save();
      ctx.translate(rk.x, y);
      if (rk.sunk > 0) ctx.globalAlpha = clamp(1 - rk.sunk / 0.6, 0, 1);
      ctx.fillStyle = "#231719";
      ctx.beginPath(); ctx.ellipse(0, 0, rk.r, rk.r * 0.35, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(120,110,120,.35)";
      ctx.beginPath(); ctx.ellipse(-rk.r * 0.1, -rk.r * 0.12, rk.r * 0.7, rk.r * 0.14, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba("#ff7a1a", 0.35 + 0.6 * (1 - left));
      ctx.lineWidth = 2 + 3 * (1 - left);
      for (i = 0; i < 4; i++) {
        a = (i - 1.5) * 0.45 * rk.r;
        ctx.beginPath(); ctx.moveTo(a, -rk.r * 0.2); ctx.lineTo(a + rk.r * 0.12, 0); ctx.lineTo(a - rk.r * 0.05, rk.r * 0.22); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(10,4,6,.9)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 0, rk.r, rk.r * 0.35, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }

    // Cold water, swelling on the ceiling, then a falling blue drop.
    function drawWater() {
      var i, w, s, R = C.waterR;
      for (i = 0; i < water.length; i++) {
        w = water[i];
        s = w.form < C.waterForm ? w.form / C.waterForm : 1;
        ctx.fillStyle = "rgba(150,220,255,.35)";
        ctx.beginPath(); ctx.arc(w.x, w.y, R * 2 * s, 0, TAU); ctx.fill();
        ctx.fillStyle = "#7fd0ff";
        ctx.beginPath(); ctx.ellipse(w.x, w.y - R * 0.3 * s, R * 0.8 * s, R * 1.4 * s, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(w.x - R * 0.25, w.y - R * 0.6 * s, R * 0.25 * s, 0, TAU); ctx.fill();
      }
    }

    // A magnet crystal: bright and turning while charged, dark once used.
    function drawCrystal(rk) {
      var img = sprite("rockCrystal01"), mm = img && measure("rockCrystal01");
      ctx.save();
      if (rk.cool > 0) ctx.globalAlpha = 0.45;
      if (img && mm) drawBody(img, mm, rk.x, rk.y, rk.ph * 0.3, rk.r);
      else {
        ctx.fillStyle = "#8a5cff";
        ctx.beginPath(); ctx.moveTo(rk.x, rk.y - 34); ctx.lineTo(rk.x + 20, rk.y); ctx.lineTo(rk.x, rk.y + 34); ctx.lineTo(rk.x - 20, rk.y); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      // the beat it holds the body for
      if (mallow.host === rk && mallow.hold > 0) {
        ctx.strokeStyle = "#d9a6ff"; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(rk.x, rk.y, rk.r + 22, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - clamp(mallow.hold / C.magnetHold, 0, 1)));
        ctx.stroke(); ctx.lineCap = "butt";
      }
    }

    // The magnet crystals' fields: rings drawn in toward the core, off when dark.
    function drawMagnets() {
      var i, k, m, f;
      for (i = 0; i < magnets.length; i++) {
        m = magnets[i];
        if (m.cool > 0) continue;
        ctx.drawImage(auraCv[2] || fire, m.x - 80, m.y - 80, 160, 160);
        for (k = 0; k < 3; k++) {
          f = (wave * 0.5 + k / 3) % 1;
          ctx.strokeStyle = rgba("#d9a6ff", 0.45 * f);
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(m.x, m.y, C.magnetR * (1 - f) + 20, 0, TAU); ctx.stroke();
        }
        ctx.strokeStyle = "rgba(217,166,255,.25)"; ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.arc(m.x, m.y, C.magnetR, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // The serpent, tail first, so the head is on top; the lake hides the rest.
    /* The serpent, tail first so the head is on top; the lake hides what is
       still under it. Painted (snake01-24): the head's six frames — its jaws
       gape when the body is near — six beads of body, and the tail's pieces
       shrinking to a tip; each is turned along the arc, and flipped when the
       leap runs leftward so nothing hangs upside down. The vector serpent is
       the fallback. */
    function drawSerpent() {
      var sv = serpent, q = 1 - sv.left / C.serpentLeap, i, r, p = {}, n = {}, a, key, im, m, flip;
      var painted = !!sprite("snake07");
      for (i = C.serpentSegs - 1; i >= 0; i--) {
        if (q - i * 0.045 < 0 || q - i * 0.045 > 1) continue;
        serpentAt(q - i * 0.045, p);
        serpentAt(Math.min(1, q - i * 0.045 + 0.02), n);
        a = Math.atan2(n.y - p.y, n.x - p.x);
        r = segR(i);
        if (painted) {
          if (i === 0) {
            key = Math.hypot(mallow.x - p.x, mallow.y - p.y) < 220 ? "snake03" : "snake" + cell(1 + Math.floor(wave * 4) % 6);
          } else if (i <= 6) key = "snake" + cell(6 + i);
          else key = "snake" + cell(15 + Math.min(3, i - 7));
          im = sprite(key); m = im && measure(key);
          if (im && m) {
            flip = Math.cos(a) < 0;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(i > 6 ? a + Math.PI : a);
            if (flip) ctx.scale(1, -1);
            var sc = (i === 0 ? r * 1.35 : r) / m.R;
            ctx.drawImage(im, -m.cx * sc, -m.cy * sc, im.width * sc, im.height * sc);
            ctx.restore();
            continue;
          }
        }
        ctx.fillStyle = "#5a0f08";
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
        ctx.fillStyle = i % 2 ? "#ff6a1a" : "#ff9d2e";
        ctx.beginPath(); ctx.arc(p.x, p.y - r * 0.15, r * 0.72, 0, TAU); ctx.fill();
        if (i === 0) {
          var ex = Math.cos(a + Math.PI / 2) * r * 0.45, ey = Math.sin(a + Math.PI / 2) * r * 0.45;
          var fx = Math.cos(a) * r * 0.35, fy = Math.sin(a) * r * 0.35;
          ctx.fillStyle = "#ffe14a";
          ctx.beginPath(); ctx.arc(p.x + fx + ex, p.y + fy + ey, r * 0.24, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(p.x + fx - ex, p.y + fy - ey, r * 0.24, 0, TAU); ctx.fill();
        }
      }
    }

    // The swirl it leaps from: rings tightening on the lake, and a glow.
    /* The swirl it leaps from: a glow added to the lake and, painted, the
       whirlpool tightening over its four frames (snake19-22); the vector
       rings otherwise. */
    function drawSwirl() {
      var sv = serpent, t = 1 - sv.left / C.serpentWarn, k, f, y = surfaceAt(sv.x0);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.3 + 0.6 * t;
      ctx.translate(sv.x0, y + 4); ctx.scale(1, 0.45);
      ctx.drawImage(auraCv[0] || fire, -120, -120, 240, 240);
      ctx.restore();
      var im = sprite("snake" + cell(19 + Math.min(3, Math.floor(t * 4))));
      var sm = im && measure("snake" + cell(19 + Math.min(3, Math.floor(t * 4))));
      if (im && sm) {
        var sc = (190 + 40 * t) / (sm.x1 - sm.x0);
        ctx.drawImage(im, sv.x0 - sm.cx * sc, y - sm.cy * sc, im.width * sc, im.height * sc);
        return;
      }
      for (k = 0; k < 3; k++) {
        f = (t * 2 + k / 3) % 1;
        ctx.strokeStyle = rgba("#5a0f08", 0.7 * (1 - f));
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(sv.x0, y + 6, 90 * (1 - f) + 10, (90 * (1 - f) + 10) * 0.3, 0, 0, TAU); ctx.stroke();
      }
    }

    // A biscuit or a square of chocolate, in a soft light so it reads as a gift.
    function treat(kind, x, y, sz, rot) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot);
      if (kind === "biscuit") {
        boxPath(sz, sz, sz * 0.3); ctx.fillStyle = "#d9a35e"; ctx.fill();
        ctx.strokeStyle = "#8a5424"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = "#9a6230";
        ctx.beginPath(); ctx.arc(-sz * 0.45, -sz * 0.45, sz * 0.1, 0, TAU); ctx.arc(sz * 0.45, -sz * 0.45, sz * 0.1, 0, TAU);
        ctx.arc(-sz * 0.45, sz * 0.45, sz * 0.1, 0, TAU); ctx.arc(sz * 0.45, sz * 0.45, sz * 0.1, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#9a6230"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -sz * 0.7); ctx.lineTo(0, sz * 0.7); ctx.stroke();
      } else {
        boxPath(sz * 1.1, sz * 0.8, sz * 0.18); ctx.fillStyle = "#5a2e1a"; ctx.fill();
        ctx.strokeStyle = "#2e140a"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.strokeStyle = "#8a4e2c"; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-sz * 0.37, -sz * 0.8); ctx.lineTo(-sz * 0.37, sz * 0.8);
        ctx.moveTo(sz * 0.37, -sz * 0.8); ctx.lineTo(sz * 0.37, sz * 0.8);
        ctx.moveTo(-sz * 1.1, 0); ctx.lineTo(sz * 1.1, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
    // A biscuit (smore01-06) or a chocolate (smore07-12), painted, fitted to `w`.
    function treatArt(kind, design, x, y, w, rot) {
      var key = "smore" + cell((kind === "biscuit" ? 1 : 7) + design), im = sprite(key), m = im && measure(key);
      if (!im || !m) return false;
      // fitted on the piece itself, not on the cut's transparent margin
      var s = w / (m.x1 - m.x0);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.drawImage(im, -m.cx * s, -m.cy * s, im.width * s, im.height * s);
      ctx.restore();
      return true;
    }
    function drawTreats() {
      var i, t;
      for (i = 0; i < treats.length; i++) {
        t = treats[i];
        var sup = t.kind === "super", ar = sup ? 80 + 8 * Math.sin(wave * 6) : 52;
        ctx.globalAlpha = sup ? 0.85 : 0.55;
        ctx.drawImage(auraCv[1] || fire, t.x - ar, t.y - ar, ar * 2, ar * 2);
        ctx.globalAlpha = 1;
        if (sup) {
          var sk = "smore" + cell(13 + t.design), sim = sprite(sk), smm = sim && measure(sk);
          if (sim && smm) {
            var ss = C.smoreR * 3.6 / (smm.x1 - smm.x0);
            ctx.drawImage(sim, t.x - smm.cx * ss, t.y - smm.cy * ss, sim.width * ss, sim.height * ss);
          } else {
            treat("biscuit", t.x, t.y - 8, C.smoreR * 0.8, 0);
            treat("chocolate", t.x, t.y + 6, C.smoreR * 0.6, 0);
          }
          continue;
        }
        if (!treatArt(t.kind, t.design, t.x, t.y, C.smoreR * 2.9, Math.sin(t.ph) * 0.3)) {
          treat(t.kind, t.x, t.y, C.smoreR * 0.8, Math.sin(t.ph) * 0.3);
        }
      }
    }
    // What the body holds toward its s'more, beside it, and the double points.
    function drawHeld() {
      var y = mallow.y - C.mallowLen * 0.5 - 44;
      if (held.biscuit && !treatArt("biscuit", held.biscuit - 1, mallow.x - 24, y, 34, 0)) treat("biscuit", mallow.x - 22, y, 9, 0);
      if (held.chocolate && !treatArt("chocolate", held.chocolate - 1, mallow.x + 24, y, 34, 0)) treat("chocolate", mallow.x + 22, y, 9, 0);
      if (boostT > 0) {
        ctx.strokeStyle = rgba("#ffd166", 0.5 + 0.3 * Math.sin(wave * 8));
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(mallow.x, mallow.y, Math.max(C.mallowR, C.mallowLen * 0.5) + 18, 0, TAU); ctx.stroke();
      }
    }

    // What a rock left behind — steam, dust, a blast — swelling as it fades.
    function drawPuffs() {
      var i, p, im, k, s;
      for (i = 0; i < puffs.length; i++) {
        p = puffs[i]; im = sprite(p.key);
        if (!im) continue;
        k = p.t / p.life;
        // sized on what is painted, where the cut's margin can be measured
        var pm = measure(p.key);
        s = p.size * (0.75 + 0.45 * k) / (pm ? pm.x1 - pm.x0 : Math.max(im.width, im.height));
        ctx.save();
        ctx.globalAlpha = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s);
        ctx.restore();
      }
    }

    // The steam columns: a stretched band, and puffs racing up it.
    function drawColumns() {
      var i, k, g, sy, top = Layout.top - 30, t, a, py;
      for (i = 0; i < geysers.length; i++) {
        g = geysers[i];
        sy = surfaceAt(g.x);
        if (g.st === 2) {
          t = 1 - g.left / C.geyserBlast;
          a = Math.min(1, t * 6, (1 - t) * 4);
          ctx.globalAlpha = a * 0.8;
          ctx.drawImage(steam, g.x - C.geyserHalf * 1.3, top, C.geyserHalf * 2.6, sy - top);
          for (k = 0; k < 10; k++) {
            py = sy - ((t * 1.6 + k / 10) % 1) * (sy - top);
            ctx.fillStyle = "rgba(255,252,236,.32)";
            ctx.beginPath();
            ctx.arc(g.x + Math.sin(k * 1.7 + wave * 3) * 16, py, 18 + 12 * Math.sin(k * 2.3), 0, TAU);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else if (g.st === 1) {
          // the warning: wisps climbing off the vent, faster as it nears
          t = 1 - g.left / C.geyserWarn;
          for (k = 0; k < 4; k++) {
            py = ((t * 2 + k / 4) % 1);
            ctx.fillStyle = rgba("#fffbe6", 0.4 * (1 - py));
            ctx.beginPath();
            ctx.arc(g.x + Math.sin(k * 2.1 + wave * 4) * 10, sy - py * 120, 8 + py * 14, 0, TAU);
            ctx.fill();
          }
        }
      }
    }

    /* The vents, IN the lava: a glow under the crust where a column will come
       up, and big bubbles swelling and bursting out of it — slow and few at
       rest, fast and fat while the vent gathers, boiling while it blows. No
       outline: a vent is a place the lake is hotter, not an object on it. */
    function drawVents() {
      var i, k, g, sy, heat, s, b, ph, r, bx, by;
      for (i = 0; i < geysers.length; i++) {
        g = geysers[i];
        sy = surfaceAt(g.x);
        heat = g.st === 2 ? 1 : g.st === 1 ? 0.55 + 0.35 * Math.sin(wave * 12) : 0.3 + 0.08 * Math.sin(wave * 2 + i);
        // the aura, flattened onto the lake and ADDED to it, so it lights the
        // lava up instead of painting yellow over orange
        s = 230 + 110 * heat;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.3 + 0.6 * heat;
        ctx.translate(g.x, sy + 4); ctx.scale(1, 0.5);
        ctx.drawImage(auraCv[1] || fire, -s / 2, -s / 2, s, s);
        ctx.restore();
        // the bubbles: each one grows on its own phase, then bursts
        b = g.st === 0 ? 2 : 4;
        for (k = 0; k < b; k++) {
          ph = (wave * (g.st === 0 ? 0.35 : g.st === 1 ? 1.1 : 1.6) + k / b + i * 0.37) % 1;
          r = (g.st === 0 ? 30 : g.st === 1 ? 46 : 54) * Math.sin(ph * Math.PI / 2) * (0.75 + 0.35 * Math.sin(k * 2.3 + i));
          if (r < 3) continue;
          bx = g.x + Math.sin(k * 2.1 + i * 1.3) * 40;
          by = surfaceAt(bx) + r * 0.3;
          ctx.globalAlpha = ph > 0.88 ? (1 - ph) / 0.12 : 1;        // the burst
          // a dome of molten skin: dark rim, hot body, a bright cap
          ctx.fillStyle = "#c2300a";
          ctx.beginPath(); ctx.arc(bx, by, r, Math.PI, TAU); ctx.fill();
          ctx.fillStyle = "#ffb12e";
          ctx.beginPath(); ctx.arc(bx, by, r * 0.86, Math.PI, TAU); ctx.fill();
          ctx.fillStyle = "#fff0a8";
          ctx.beginPath(); ctx.ellipse(bx - r * 0.12, by - r * 0.48, r * 0.5, r * 0.26, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.9)";
          ctx.beginPath(); ctx.arc(bx - r * 0.38, by - r * 0.6, Math.max(2, r * 0.12), 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    // A drop swelling on the ceiling, then a falling tear of lava.
    function drawDrops() {
      var i, dr, s, R = C.dropR;
      for (i = 0; i < drops.length; i++) {
        dr = drops[i];
        if (dr.form < C.dropForm) {
          s = dr.form / C.dropForm;
          ctx.drawImage(fire, dr.x - R * 2 * s, dr.y - R * 2 * s, R * 4 * s, R * 4 * s);
          ctx.fillStyle = "#ffb347";
          ctx.beginPath(); ctx.ellipse(dr.x, dr.y + R * 0.4 * s, R * 0.8 * s, R * (0.6 + 0.6 * s), 0, 0, TAU); ctx.fill();
        } else {
          ctx.drawImage(fire, dr.x - R * 2.2, dr.y - R * 2.2, R * 4.4, R * 4.4);
          ctx.fillStyle = "#ffb347";
          ctx.beginPath(); ctx.ellipse(dr.x, dr.y - R * 0.4, R * 0.75, R * 1.5, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = "#fff1b0";
          ctx.beginPath(); ctx.arc(dr.x, dr.y, R * 0.45, 0, TAU); ctx.fill();
        }
      }
    }

    function drawFire(rk) {
      var y = rk.y + rk.sunk * 60, s;
      /* A FALLING fireball is a rock with an aura breathing behind it, in its
         own colour — no flames. Flames are for a rock the lava has caught. */
      if (!rk.burning && rockKey(rk) && auraCv[rk.aura]) {
        s = rk.r * (3.5 + 0.3 * Math.sin(wave * 4 + rk.seed));
        ctx.drawImage(auraCv[rk.aura], rk.x - s / 2, y - s / 2, s, s);
        drawRock(rk);
        fireClock(rk, y);
        return;
      }
      /* A rock the LAVA has caught wears the painted fire: the crown of
         flames stands upright BEHIND it, its hole on the rock's centre and
         its width half again the rock's, so the rock hides the base and the
         tongues rise round it — on the row its burn has reached: catching,
         full blaze, white-hot, sinking. The rock is drawn again over it. */
      if (rk.burning) {
        var fk = flameKey(rk), fim = fk && sprite(fk), fm = fim && holeOf(fk);
        if (fim && fm) {
          var fs = rk.r * 2 * 1.5 / fm.w;
          ctx.drawImage(fim, rk.x - fm.cx * fs, y - fm.cy * fs, fim.width * fs, fim.height * fs);
          drawRock(rk);
          fireClock(rk, y);
          return;
        }
      }
      s = rk.r * rk.glow + Math.sin(wave * 4 + rk.seed) * 6;
      ctx.drawImage(fire, rk.x - s / 2, y - s / 2, s, s);
      if (rk.burning) {
        /* Tongues fanned across the upper face, each one a two-curve leaf that
           breathes on its own phase — a rock on fire, not a rock with dots. */
        var f, ph, hgt, bx, by, wd;
        for (f = 0; f < 5; f++) {
          ph = wave * 5 + rk.seed + f * 1.9;
          hgt = rk.r * (0.46 + 0.3 * Math.sin(ph));
          wd = rk.r * 0.16;
          // bases fanned along the upper edge, tallest in the middle
          bx = rk.x + (f - 2) * rk.r * 0.34;
          by = y - rk.r * (0.74 - 0.14 * Math.abs(f - 2));
          ctx.fillStyle = rgba(f % 2 ? "#ffd166" : "#ff7a1a", 0.72);
          ctx.beginPath();
          ctx.moveTo(bx - wd, by);
          ctx.quadraticCurveTo(bx - wd * 0.7, by - hgt * 0.6,
                               bx + Math.sin(ph) * rk.r * 0.14, by - hgt);
          ctx.quadraticCurveTo(bx + wd * 0.7, by - hgt * 0.6, bx + wd, by);
          ctx.closePath(); ctx.fill();
        }
      } else {
        ctx.fillStyle = "#fff6cf";
        ctx.beginPath(); ctx.arc(rk.x, y, rk.r * 0.55 + Math.sin(wave * 7 + rk.seed) * 2, 0, TAU); ctx.fill();
      }

      fireClock(rk, y);
    }

    // the clock, drawn only while the body is riding it
    function fireClock(rk, y) {
      if (mallow.host === rk && mallow.hold > 0) {
        var t = 1 - clamp(mallow.hold / C.fireHold, 0, 1);
        ctx.strokeStyle = t < 0.35 ? "#ff3b30" : "#fff3dd";
        ctx.lineWidth = 7; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(rk.x, y, rk.r + 20, -Math.PI / 2, -Math.PI / 2 + TAU * t);
        ctx.stroke();
        ctx.lineCap = "butt";
      }
    }

    function drawLava() {
      var x, g;
      ctx.beginPath();
      ctx.moveTo(0, view.h);
      ctx.lineTo(0, surfaceAt(0));
      for (x = 18; x <= view.w; x += 18) ctx.lineTo(x, surfaceAt(x));
      ctx.lineTo(view.w, view.h);
      ctx.closePath();
      g = ctx.createLinearGradient(0, lavaY - surge.off + cool - 14, 0, view.h);
      g.addColorStop(0, "#ffd76a");
      g.addColorStop(0.16, "#ff8a1f");
      g.addColorStop(0.55, "#e0380a");
      g.addColorStop(1, "#7d1802");
      ctx.fillStyle = g;
      ctx.fill();

      // bubbles, clipped to the lake so they never float over a rock
      ctx.save(); ctx.clip();
      var i, b, by;
      for (i = 0; i < bubbles.length; i++) {
        b = bubbles[i];
        by = surfaceAt(b.x) + (1 - b.t) * 70;
        ctx.fillStyle = rgba("#ffe9a8", 0.5 * (1 - b.t));
        ctx.beginPath(); ctx.arc(b.x, by, b.r * (0.4 + b.t), 0, TAU); ctx.fill();
      }
      ctx.restore();

      // the crust line: the thing the player actually reads as "the floor"
      ctx.beginPath();
      ctx.moveTo(0, surfaceAt(0));
      for (x = 18; x <= view.w; x += 18) ctx.lineTo(x, surfaceAt(x));
      // ...and it flashes red while a surge is gathering under it
      ctx.strokeStyle = surge.ph === 1 ? rgba("#ff3b30", 0.6 + 0.4 * Math.sin(wave * 16))
                                       : "rgba(255,244,205,.85)";
      ctx.lineWidth = surge.ph === 1 ? 7 : 5; ctx.stroke();

      // where the surge will crest, drawn while it gathers and while it climbs
      if (ROW && ROW.surge && (surge.ph === 1 || surge.ph === 2)) {
        var cy = lavaY + cool - surgeH(), pulse = 0.55 + 0.45 * Math.sin(wave * 10);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = rgba("#ff3b00", 0.12 * pulse);
        ctx.fillRect(0, cy, view.w, lavaY + cool - cy);
        ctx.restore();
        ctx.setLineDash([22, 14]);
        ctx.strokeStyle = rgba("#ff3b30", 0.5 + 0.5 * pulse);
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(view.w, cy); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // The dotted arc, simulated with the same numbers the flight uses so the
    // preview cannot lie. Rocks are advanced too — they are all falling.
    function drawAim() {
      var v = aimVec();
      if (!v) return;
      var h = 1 / 60, n = Math.round(C.previewSeconds * (0.4 + 0.6 * focus) / h);
      var px = mallow.x, py = mallow.y;
      var vx = v.x * jumpSpeed(mallow.host), vy = v.y * jumpSpeed(mallow.host);
      // Whatever the body is on (or has just left) is out of the preview for
      // good, exactly as it is out of the flight.
      var skip = mallow.host || mallow.ignore, hit = null, pull = {};
      var i, j, rk, sx, sy, dd, t;

      for (i = 0; i < n && !hit; i++) {
        vy += C.gravity * h;
        if (geysers.length && vy > -C.geyserMax && lift(px, i * h)) vy = Math.max(vy - C.geyserPush * h, -C.geyserMax);
        if (magnets.length) { magnetPull(px, py, pull); vx += pull.x * h; vy += pull.y * h; }
        px += vx * h; py += vy * h;
        if (px < Layout.left + C.mallowR)  { px = Layout.left + C.mallowR;  vx = -vx * C.wallBounce; }
        if (px > Layout.right - C.mallowR) { px = Layout.right - C.mallowR; vx = -vx * C.wallBounce; }
        if (py < Layout.top + C.mallowR)   { py = Layout.top + C.mallowR;   vy = -vy * C.wallBounce; }
        t = i * h;
        for (j = 0; j < rocks.length; j++) {
          rk = rocks[j];
          if (rk.sunk > 0) continue;
          if (rk === skip) continue;
          if (rk.sp === "magnet" && rk.cool > 0) continue;
          sx = rk.x + rk.vx * t; sy = rk.y + rk.vy * t;
          dd = Math.hypot(px - sx, py - sy);
          if (dd > rk.r * 1.35 + C.mallowR) continue;
          // the same silhouette test hits() runs, on the rock as it will have
          // turned by then — the preview cannot promise a hold the flight
          // would miss
          if (dd < radiusAt(rk, Math.atan2(py - sy, px - sx) - (rk.rot + rk.spin * t)) + C.mallowR) {
            hit = { x: px, y: py, rk: rk }; break;
          }
        }
        if (py > surfaceAt(px)) break;
        if (i % 3 === 0) {
          ctx.fillStyle = rgba("#fff3dd", 0.62 * (1 - i / n) + 0.12);
          ctx.beginPath(); ctx.arc(px, py, 5 - 3 * (i / n), 0, TAU); ctx.fill();
        }
      }

      if (hit) {
        ctx.strokeStyle = hit.rk.hot ? "#ff7a1a" : hit.rk.sp === "bomb" ? "#ff5a3c" : "#9dff8a";
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(hit.x, hit.y, 18, 0, TAU); ctx.stroke();
      }
      // where the finger is: the body goes there
      ctx.strokeStyle = "rgba(255,243,221,.9)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(aim.x, aim.y, 26, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(aim.x, aim.y, 6, 0, TAU); ctx.stroke();

      /* The focus meter, drawn as a ring around that reticle: it is the thing
         being spent, so it is drawn on the finger spending it. Empty and the
         ring is a red line — the world under the finger is already running at
         full speed and the player can see why. */
      ctx.strokeStyle = "rgba(12,6,10,.45)"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(aim.x, aim.y, 38, 0, TAU); ctx.stroke();
      ctx.strokeStyle = focusColour();
      ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(aim.x, aim.y, 38, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(focus, 0.001));
      ctx.stroke();
      ctx.lineCap = "butt";
    }

    function focusColour() {
      return focus < 0.22 ? "#ff5a3c" : focus < 0.55 ? "#ffd166" : "#9dff8a";
    }

    /* And a bar over the body whenever the meter is not full, aiming or not:
       coming back is half of the mechanic, and a resource the player cannot see
       recharge is one they will not plan around. */
    function drawFocusBar() {
      if (dead || focus > 0.995) return;
      var w = 56, h = 6;
      var x = mallow.x - w / 2, y = mallow.y - C.mallowLen * 0.5 - 20;
      ctx.fillStyle = "rgba(10,4,8,.55)";
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      // dimmed while the lock-out runs: the player has to see the difference
      // between "recharging" and "not yet"
      ctx.globalAlpha = focusT > 0 ? 0.4 : 1;
      ctx.fillStyle = focusColour();
      ctx.fillRect(x, y, w * focus, h);
      ctx.globalAlpha = 1;
    }

    // A rounded box. ctx.roundRect is not in every mobile WebView, so the four
    // corners are drawn by hand.
    function boxPath(hw, hh, r) {
      ctx.beginPath();
      ctx.moveTo(-hw + r, -hh);
      ctx.lineTo(hw - r, -hh);  ctx.quadraticCurveTo(hw, -hh, hw, -hh + r);
      ctx.lineTo(hw, hh - r);   ctx.quadraticCurveTo(hw, hh, hw - r, hh);
      ctx.lineTo(-hw + r, hh);  ctx.quadraticCurveTo(-hw, hh, -hw, hh - r);
      ctx.lineTo(-hw, -hh + r); ctx.quadraticCurveTo(-hw, -hh, -hw, -hh + r);
      ctx.closePath();
    }

    // Which column of the body's sheet: what it is doing, and what just happened to it.
    function mallowPose() {
      if (dead) return MALLOW_POSE.melted;
      if (mallow.hot > 0 || (mallow.host && mallow.host.hot)) return MALLOW_POSE.hot;
      if (mallow.flying) return mallow.blown > 0 ? MALLOW_POSE.blown : MALLOW_POSE.jump;
      return mallow.land > 0 ? MALLOW_POSE.land : MALLOW_POSE.idle;
    }

    function drawMallow() {
      var T = TOAST[toast];
      var hw = C.mallowR, hh = C.mallowLen * 0.5, cr = hw * 0.44;
      var y = mallow.y + sink;

      // A ring around the body while a mid-air shot is still in hand: it is the
      // only resource in the game, so it is drawn on the thing that spends it.
      if (!dead && mallow.flying && mallow.air > 0) {
        ctx.strokeStyle = rgba("#ffd166", 0.5 + 0.22 * Math.sin(wave * 6));
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(mallow.x, y, Math.max(hw, hh) + 12, 0, TAU); ctx.stroke();
      }

      /* Everything below is drawn in the CHARACTER's own frame, face included:
         a smile that stayed level while the body turned read as a sticker
         floating on top of the thing. The frame is `mallow.tilt`, not the
         planting axis — see CONFIG.leanMax. */
      ctx.save();
      ctx.translate(mallow.x, y);
      ctx.rotate(mallow.tilt);
      if (dead) ctx.globalAlpha = clamp(1 - deadT / 1.4, 0, 1);

      /* The painted body, where the build has it: the pose is the column of
         the sheet and the toast its row. Every pose is scaled off the IDLE
         frame of its row, so the jump stretches and the landing squashes
         instead of each one being fitted to the same box, and each stands on
         the bottom of the body the physics plants. */
      var pk = "mallow" + cell(toast * 6 + mallowPose()), pim = sprite(pk), pm = measure(pk);
      var ref = measure("mallow" + cell(toast * 6 + MALLOW_POSE.idle));
      if (pim && pm && ref) {
        var ps = C.mallowR * 2 * 1.16 / (ref.x1 - ref.x0);
        ctx.drawImage(pim, -(pm.x0 + pm.x1) / 2 * ps, hh - pm.bottom * ps, pim.width * ps, pim.height * ps);
        ctx.restore();
        return;
      }

      // --- the body: a cube of sugar, with its cut top face catching the light
      boxPath(hw, hh, cr);
      ctx.fillStyle = T.skin; ctx.fill();
      ctx.strokeStyle = "rgba(26,9,4,.45)"; ctx.lineWidth = 4; ctx.stroke();

      ctx.save(); boxPath(hw, hh, cr); ctx.clip();
      ctx.fillStyle = T.lit;
      ctx.fillRect(-hw, -hh, hw * 2, hh * 0.3);
      ctx.fillStyle = rgba(T.face, 0.1);
      ctx.fillRect(-hw, hh * 0.52, hw * 2, hh * 0.48);
      // the rim of that top face, so the cube reads as a cut cylinder
      ctx.strokeStyle = rgba(T.face, 0.13); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-hw, -hh * 0.3); ctx.lineTo(hw, -hh * 0.3); ctx.stroke();
      ctx.restore();

      // --- the face
      var eyeR = hw * 0.23, eyeX = hw * 0.42, eyeY = -hh * 0.05;

      if (dead) {
        ctx.strokeStyle = T.face; ctx.lineWidth = 3.4; ctx.lineCap = "round";
        cross(-eyeX, eyeY); cross(eyeX, eyeY);
        ctx.beginPath(); ctx.arc(0, hh * 0.32, hw * 0.19, 0, TAU); ctx.stroke();
        ctx.restore();
        return;
      }

      // the blush that makes it look greedy rather than merely square
      ctx.fillStyle = rgba("#ff8f5e", 0.32);
      ctx.beginPath(); ctx.ellipse(-hw * 0.68, hh * 0.18, hw * 0.21, hw * 0.13, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hw * 0.68, hh * 0.18, hw * 0.21, hw * 0.13, 0, 0, TAU); ctx.fill();

      // two big eyes, each with the highlight that gives them their life
      ctx.fillStyle = T.face;
      ctx.beginPath(); ctx.arc(-eyeX, eyeY, eyeR, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX, eyeY, eyeR, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.beginPath(); ctx.arc(-eyeX - eyeR * 0.3, eyeY - eyeR * 0.34, eyeR * 0.36, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX - eyeR * 0.3, eyeY - eyeR * 0.34, eyeR * 0.36, 0, TAU); ctx.fill();

      // an open smile: the mouth is filled, so it carries at 720 px wide where
      // a stroked arc disappeared against the body
      var mw = hw * 0.42, my = hh * 0.2;
      ctx.beginPath();
      ctx.moveTo(-mw, my);
      ctx.quadraticCurveTo(0, my + hh * 0.03, mw, my);
      ctx.quadraticCurveTo(0, my + hh * 0.4, -mw, my);
      ctx.closePath();
      ctx.fillStyle = T.face; ctx.fill();
      ctx.save(); ctx.clip();                                  // the tongue, inside it
      ctx.fillStyle = "rgba(255,138,150,.9)";
      ctx.beginPath(); ctx.arc(0, my + hh * 0.28, hw * 0.17, 0, TAU); ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    function cross(x, y) {
      var s = C.mallowR * 0.2;
      ctx.beginPath();
      ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
      ctx.stroke();
    }

    /* --- the guide: every rule, as pages (packages/webshell/guide.js) -----
       Every page SHOWS before it tells: its picture is drawn by the round's
       own renderers — drawRock, drawFire, drawMallow, drawLava, drawAim… —
       on a canvas of its own, so a rock read in the guide is the rock that
       falls. A page's level is the row of ladder.levels that first names it
       (`intro`), locked until the board opens it; the INTRO notices above
       are the titles, so a mechanic is named once. */
    function paintPic(W, H, fn) {
      var cv = document.createElement("canvas"), k = view.dpr || 1, keep = ctx;
      cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx = cv.getContext("2d"); ctx.scale(k, k);
      try { fn(); } finally { ctx = keep; }
      return cv;
    }

    /* A cave of the guide's making, for the length of one synchronous call.
       The draw functions read the round's state (the body, the rocks, the
       lake, the toast…), so every piece of it is put aside and given back in
       the finally: a page opened over a paused round leaves it untouched, and
       one opened before any round (the Help card on the title screen) finds a
       stand-in instead of what reset() has not set yet. The picture's own
       pixels are mapped onto the design space, at zoom `k`, because the aim
       preview bounces off Layout like the flight does. */
    var GX = 0, GY = 0;
    function scene(W, H, k, fn) {
      if (!fire || !steam || !auraCv.length) buildSprites();   // no round yet
      var keep = [mallow, rocks, toast, dead, sink, deadT, aim, focus, focusT, lavaY, geysers, magnets,
                  wave, surge, cool, ROW, held, boostT, serpent, treats, water, bubbles];
      GX = Layout.cx - W / k / 2; GY = Layout.top + 60;
      mallow = { x:-999, y:-999, vx:0, vy:0, ang:-Math.PI / 2, tilt:0, host:null, rel:0, flying:false,
                 ignore:null, hold:0, grip:1, air:0, land:0, blown:0, hot:0, safe:0 };
      rocks = []; toast = 0; dead = false; sink = 0; deadT = 0; aim = null; focus = 1; focusT = 0;
      lavaY = GY + 1e4; geysers = []; magnets = []; wave = 0.6; surge = { ph:0, left:0, off:0 }; cool = 0;
      ROW = null; held = { biscuit:false, chocolate:false }; boostT = 0; serpent = { st:0, left:0 };
      treats = []; water = []; bubbles = [];
      try {
        return paintPic(W, H, function () { ctx.scale(k, k); ctx.translate(-GX, -GY); fn(); });
      } finally {
        mallow = keep[0]; rocks = keep[1]; toast = keep[2]; dead = keep[3]; sink = keep[4]; deadT = keep[5];
        aim = keep[6]; focus = keep[7]; focusT = keep[8]; lavaY = keep[9]; geysers = keep[10];
        magnets = keep[11]; wave = keep[12]; surge = keep[13]; cool = keep[14]; ROW = keep[15];
        held = keep[16]; boostT = keep[17]; serpent = keep[18]; treats = keep[19]; water = keep[20];
        bubbles = keep[21];
      }
    }
    // a rock of the fall, still, at (u, v) of the picture
    function stone(u, v, r, o) {
      o = o || {};
      var rk = makeRock(GX + u, GY + v, r, o.hot, o.sp);
      rk.vx = rk.vy = rk.drift = rk.fall = 0; rk.spin = 0; rk.rot = o.rot || 0;
      if (o.used) rk.used = true;
      if (o.burn != null) { rk.burning = true; rk.burn = o.burn; rk.glow = 1.9; }
      if (o.fuse != null) { rk.armed = true; rk.fuse0 = C[SP[o.sp].hold]; rk.fuse = rk.fuse0 * o.fuse; }
      rocks.push(rk);
      return rk;
    }
    function orbAt(u, v, r) {
      var rk = makeRock(GX + u, GY + v, r || 56, false, "orb");
      circleShape(rk); rk.vx = rk.vy = rk.drift = rk.fall = 0; rk.spin = 0; rk.rot = 0; rk.life = C.orbLife * 0.6;
      rocks.push(rk);
      return rk;
    }
    // drawn bigger than the core it catches with, or a crystal is a speck
    function crystalAt(u, v) {
      var rk = makeRock(GX + u, GY + v, C.magnetCore * 1.6, false, "magnet");
      circleShape(rk); rk.vx = rk.vy = rk.drift = rk.fall = 0; rk.spin = 0; rk.rot = 0;
      rk.y0 = rk.y; rk.ph = 0.8; rk.cool = 0;
      rocks.push(rk);
      return rk;
    }
    function crustAt(u) {
      var rk = makeRock(GX + u, 0, C.crustR, false, "crust");
      plateShape(rk); rk.vx = rk.vy = rk.drift = rk.fall = 0; rk.spin = 0; rk.rot = 0;
      rk.life = C.crustLife * 0.6; rk.design = 0; rk.y = surfaceAt(rk.x) - rk.r * 0.12;
      rocks.push(rk);
      return rk;
    }
    // the body planted on a rock, leaning as it does in a round
    function perch(rk, a) {
      mallow.host = rk; mallow.flying = false;
      mallow.rel = (a == null ? -Math.PI / 2 : a) - rk.rot; mallow.grip = 0.15;
      ride();
      mallow.tilt = clamp(wrapAngle(mallow.ang + Math.PI / 2), -C.leanMax, C.leanMax);
    }
    // the body in flight at (u, v), heading along (vx, vy)
    function flying(u, v, vx, vy, air) {
      mallow.x = GX + u; mallow.y = GY + v; mallow.vx = vx; mallow.vy = vy;
      mallow.flying = true; mallow.host = null; mallow.air = air || 0;
      mallow.ang = Math.atan2(vy, vx);
      mallow.tilt = clamp(wrapAngle(mallow.ang + Math.PI / 2), -C.leanMax, C.leanMax);
    }
    // the water's drops, drawn at `z` times their size around where they hang
    function dropsAt(z) {
      var all = water, i, w;
      for (i = 0; i < all.length; i++) {
        w = all[i]; water = [w];
        ctx.save(); ctx.translate(w.x, w.y); ctx.scale(z, z); ctx.translate(-w.x, -w.y);
        drawWater();
        ctx.restore();
      }
      water = all;
    }
    // what the burning rocks, the plain ones and the fireballs are drawn in, as render() does
    function drawAll() {
      var i;
      for (i = 0; i < rocks.length; i++) if (!rocks[i].hot) drawRock(rocks[i]);
      for (i = 0; i < rocks.length; i++) if (rocks[i].burning) drawRock(rocks[i]);
      for (i = 0; i < rocks.length; i++) if (rocks[i].hot) drawFire(rocks[i]);
      drawFuses();
    }

    function flingPic() {
      return scene(520, 300, 1, function () {
        var a = stone(120, 225, 66), b = stone(410, 120, 58);
        perch(a);
        aim = { x: b.x, y: b.y - 14 }; focus = 0.75;
        drawAll(); drawAim(); drawMallow();
      });
    }
    function focusPic() {
      return scene(520, 230, 1.25, function () {
        var a = stone(95, 140, 52);
        perch(a);
        aim = { x: GX + 300, y: GY + 50 }; focus = 0.38;
        drawAll(); drawAim(); drawMallow(); drawFocusBar();
      });
    }
    function airPic() {
      return scene(520, 300, 1, function () {
        stone(80, 250, 54, { used:true }); var b = stone(420, 170, 58);
        flying(170, 120, 520, -240, 1);
        aim = { x: b.x, y: b.y - 10 };
        drawAll(); drawAim(); drawMallow();
      });
    }
    function scorePic() {
      return scene(520, 220, 1, function () {
        var a = stone(140, 135, 66); stone(385, 120, 66, { used:true });
        perch(a);
        drawAll(); drawMallow();
      });
    }
    function toastPic() {
      return scene(520, 170, 1.3, function () {
        for (var i = 0; i < 4; i++) {
          toast = i; mallow.x = GX + 50 + i * 100; mallow.y = GY + 66; mallow.tilt = 0;
          drawMallow();
        }
      });
    }
    function lavaPic() {
      return scene(520, 300, 0.8, function () {
        lavaY = GY + 235;
        bubbles = [{ x: GX + 90, t: 0.5, life: 1, r: 14 }, { x: GX + 520, t: 0.3, life: 1, r: 11 }];
        stone(270, 215, 62, { hot:true, burn:0.7 }); stone(470, 90, 60);
        drawAll(); drawLava();
      });
    }
    function firePic() {
      return scene(520, 240, 1, function () {
        var a = stone(150, 150, 52, { hot:true }); stone(390, 115, 46, { hot:true });
        perch(a); mallow.hold = C.fireHold * 0.55;
        drawAll(); drawMallow();
      });
    }
    function claimedPic() {
      return scene(520, 240, 1, function () {
        stone(95, 130, 64, { used:true }); stone(260, 110, 60); stone(425, 135, 64, { used:true });
        drawAll();
      });
    }
    function smoresPic() {
      return scene(520, 190, 1.6, function () {
        treats = [{ kind:"biscuit", x: GX + 55, y: GY + 66, ph: 0.4, design: 0 },
                  { kind:"chocolate", x: GX + 160, y: GY + 66, ph: -0.4, design: 0 },
                  { kind:"super", x: GX + 270, y: GY + 62, ph: 0, design: 0 }];
        drawTreats();
      });
    }
    function surgePic() {
      return scene(520, 260, 0.8, function () {
        ROW = { surge: 1 }; surge = { ph: 1, left: C.surgeWarn * 0.5, off: 0 }; wave = 0.1;
        lavaY = GY + 290;
        var a = stone(160, 75, 58); stone(470, 205, 56);
        perch(a);
        drawAll(); drawLava(); drawMallow();
      });
    }
    function icePic() {
      return scene(520, 240, 1, function () {
        var a = stone(150, 150, 64, { sp:"ice" }); stone(390, 110, 58, { sp:"ice" });
        perch(a); mallow.hold = C.iceHold * 0.4;
        drawAll(); drawMallow();
      });
    }
    function waterPic() {
      return scene(520, 300, 0.85, function () {
        lavaY = GY + 250;
        water = [{ x: GX + 150, y: GY + 110, vy: 0, form: C.waterForm }, { x: GX + 470, y: GY + 30, vy: 0, form: C.waterForm * 0.6 }];
        var c = crustAt(300);
        perch(c);
        dropsAt(2); drawAll(); drawLava(); drawMallow();
      });
    }
    function magnetPic() {
      return scene(520, 210, 0.6, function () {
        var m = crystalAt(520, 175);
        magnets = [m];
        flying(260, 290, 600, -360, 0);
        drawMagnets(); drawAll(); drawMallow();
      });
    }
    function geyserPic() {
      return scene(520, 260, 0.75, function () {
        lavaY = GY + 290;
        geysers = [{ x: GX + 240, st: 2, left: C.geyserBlast * 0.5, next: 3 },
                   { x: GX + 540, st: 1, left: C.geyserWarn * 0.4, next: 3 }];
        stone(240, 185, 50);
        flying(250, 80, 40, -600, 0);
        drawColumns(); drawAll(); drawLava(); drawVents(); drawMallow();
      });
    }
    function orbPic() {
      return scene(520, 300, 1, function () {
        lavaY = GY + 245;
        var o = orbAt(260, 150, 58);
        perch(o);
        drawAll(); drawLava(); drawMallow();
      });
    }
    function serpentPic() {
      return scene(520, 260, 0.75, function () {
        lavaY = GY + 290;
        serpent = { st: 2, left: C.serpentLeap * 0.45, x0: GX + 130, x1: GX + 560, H: 270, bit: false };
        drawSerpent(); drawLava();
      });
    }
    function shardPic() {
      return scene(520, 250, 1, function () {
        var a = stone(140, 135, 80, { sp:"shard", fuse:0.45 }), i, p, d = a.design;
        for (i = 0; i < 3; i++) {
          p = stone(355 + (i === 1 ? 90 : 0), 55 + i * 70, 40);
          if (d != null && shapeFrom(p, "rockCracked" + cell(19 + (d + i) % 6))) p.frag = (d + i) % 6;
        }
        perch(a);
        drawAll(); drawMallow();
      });
    }
    function dustPic() {
      return scene(520, 250, 1, function () {
        var a = stone(160, 150, 66, { sp:"dust", fuse:0.35 }); stone(395, 110, 60, { sp:"dust" });
        perch(a);
        drawAll(); drawMallow();
      });
    }
    function bombPic() {
      return scene(520, 320, 0.66, function () {
        stone(330, 245, 64, { sp:"bomb", fuse:0.5 }); stone(140, 330, 60); stone(470, 120, 54);
        var a = stone(640, 380, 58);
        perch(a);
        drawAll(); drawMallow();
      });
    }
    /* A theme of the core, as a line of the things it mixes, over the lake
       when the theme has one (and its red line flashing for a surge). */
    var PUT = {
      fire:   function (u, v) { stone(u, v, 46, { hot:true }); },
      bomb:   function (u, v) { stone(u, v, 54, { sp:"bomb" }); },
      ice:    function (u, v) { stone(u, v, 54, { sp:"ice" }); },
      shard:  function (u, v) { stone(u, v, 60, { sp:"shard" }); },
      dust:   function (u, v) { stone(u, v, 54, { sp:"dust" }); },
      orb:    function (u, v) { orbAt(u, v, 50); },
      magnet: function (u, v) { crystalAt(u, v); },
      water:  function (u, v) { water.push({ x: GX + u, y: GY + v + 10, vy: 0, form: C.waterForm }); },
      geyser: function (u) { geysers.push({ x: GX + u, st: 2, left: C.geyserBlast * 0.5, next: 3 }); }
    };
    function themePic(list, lake) {
      return function () {
        var k = 1, W = 520, H = lake ? 280 : 220;
        return scene(W, H, k, function () {
          var i, n = list.length, step = W / k / n;
          if (lake) {
            lavaY = GY + H / k - 60;
            if (lake === "surge") { surge = { ph: 1, left: 0.5, off: 0 }; wave = 0.1; }
          }
          for (i = 0; i < n; i++) PUT[list[i]](step * (i + 0.5), lake ? 95 : 110);
          if (geysers.length) drawColumns();
          if (water.length) dropsAt(1.8);
          drawAll();
          if (lake) { drawLava(); if (geysers.length) drawVents(); }
        });
      };
    }
    /* A biome's own painted cave, the one its levels are played in, cut to
       the page's width: its lower half, where the lake and the rocks are. */
    function scenePic(b) {
      return function () {
        var src = CONFIG.art && CONFIG.art[LAD.biomes[b].scene], n;
        if (!src) return null;
        n = document.createElement("div");
        n.style.cssText = "width:520px;height:260px;border-radius:16px;" +
                          "background:url(\"" + src + "\") 50% 78% / cover no-repeat";
        return n;
      };
    }
    // the level whose row first names a key (ladder.levels[].intro)
    function lvOf(key) {
      for (var i = 0; i < LAD.levels.length; i++) {
        if (LAD.levels[i].intro && LAD.levels[i].intro.indexOf(key) >= 0) return i + 1;
      }
      return 0;
    }
    // the first level the treats fall on (every row but a `smores: 0` one)
    function smoresLv() {
      for (var i = 0; i < LAD.levels.length; i++) if (LAD.levels[i].smores !== 0) return i + 1;
      return 0;
    }
    // a figure in seconds, with the player's own decimal mark
    function secs(v) { return String(v).replace(".", Lang.code() === "fr" ? "," : ".") + " s"; }

    var guide = {
      chapters: function () {
        function page(key, pic, lines, rows) {
          return { id: key, title: Lang.t(INTRO[key][0]), lv: lvOf(key), pic: pic, lines: lines, rows: rows };
        }
        function biome(b, id, line, more) {
          return { id: id, title: Lang.t(BANDS[b]), lv: LAD.from[b] > 1 ? LAD.from[b] : 0, pic: scenePic(b),
                   lines: [Lang.t(line)].concat(more ? [Lang.t(more)] : []) };
        }
        // one line: the band's tip, or what it mixes when there is no tip worth giving
        function theme(key, list, lake, tip) {
          return page(key, list ? themePic(list, lake) : serpentPic, [tip ? Lang.t(tip) : Lang.t(INTRO[key][1]) + "."]);
        }
        var pct = function (v) { return "+" + Math.round(v * 100) + " %"; };
        return [
          { key: "basics", label: Lang.t("The basics"), pages: [
            { id: "fling", title: Lang.t("Tap to fling"), pic: flingPic, lines: [
              Lang.t("Tap where you aim. The marshmallow flies there and sticks to the first rock it meets.") ] },
            { id: "focus", title: Lang.t("Slow motion"), pic: focusPic, lines: [
              Lang.t("Hold your finger down to slow time. A dotted arc shows where you will land.") ] },
            { id: "air", title: Lang.t("Mid-air shot"), pic: airPic, lines: [
              Lang.t("In mid-air, a tap flings the marshmallow once more."),
              Lang.t("Every fresh rock you land on reloads the mid-air shot.") ] },
            { id: "score", title: Lang.t("Score and chain"), pic: scorePic,
              rows: [[Lang.t("Each fresh rock in a row"), pct(C.chainStep)],
                     [Lang.t("Chain at most"), "×" + C.chainMax]],
              lines: [
              Lang.t("Only fresh rocks score. The higher the rock, the more it pays."),
              Lang.t("A dark rock, a fireball or a hit breaks the chain.") ] },
            { id: "toast", title: Lang.t("Four lives"), pic: toastPic, lines: [
              Lang.t("Each hit toasts the marshmallow a shade browner. Each shade takes 8 % off its jump.") ] },
            { id: "lava", title: Lang.t("The lava"), pic: lavaPic, lines: [
              Lang.t("Falling in costs three lives. Only a white marshmallow comes back out, charred.") ] }
          ] },
          { key: "caldera", label: Lang.t(BANDS[0]), pages: [
            biome(0, "b-caldera", "Levels 1 to 6: dark rocks, fireballs and lava surges."),
            page("claimed", claimedPic, [
              Lang.t("Some rocks fall already dark. They score nothing."),
              Lang.t("Landing on one breaks your chain.") ]),
            { id: "smores", title: Lang.t(INTRO.smores[0]), lv: smoresLv(), pic: smoresPic,
              rows: [[Lang.t("A biscuit and a chocolate"), Lang.t("+1 life")],
                     [Lang.t("A super s'more"), Lang.t("All lives")],
                     [Lang.t("At full life"), "×2 · " + secs(C.smoreBoost)]],
              lines: [
              Lang.t("Biscuits and chocolates drift down. Catch one of each to make a s'more.") ] },
            page("fire", firePic, [
              Lang.t("You can land on a fireball, but it scores nothing and breaks the chain."),
              Lang.t("Jump off before a fireball's ring runs out, or it throws you off a shade browner.") ],
              [[Lang.t("Thrown off after"), secs(C.fireHold)]]),
            page("surge", surgePic, [
              Lang.t("The crust flashes red, and a dashed line shows how high the lava will climb."),
              Lang.t("Get above the line before the lava rises. It drops back soon after.") ],
              [[Lang.t("Warning"), secs(C.surgeWarn)]])
          ] },
          { key: "frost", label: Lang.t(BANDS[1]), pages: [
            biome(1, "b-frost", "Levels 7 to 12: ice rocks, cold water and magnet crystals."),
            page("ice", icePic, [
              Lang.t("Ice does not hold you. After a beat, it throws you straight up.") ],
              [[Lang.t("Holds you for"), secs(C.iceHold)]]),
            page("water", waterPic, [
              Lang.t("Water drips off the ceiling. On the lava it sets a crust you can stand on."),
              Lang.t("Get off the crust before it cracks back into the lake.") ],
              [[Lang.t("A crust lasts"), secs(C.crustLife)]]),
            page("magnets", magnetPic, [
              Lang.t("In mid-air, a crystal pulls you in and catches you."),
              Lang.t("Jump from a crystal to go higher than any rock can send you.") ],
              [[Lang.t("Thrown up after"), secs(C.magnetHold)]])
          ] },
          { key: "geysers", label: Lang.t(BANDS[2]), pages: [
            biome(2, "b-geysers", "Levels 13 to 18: geysers, lava bubbles and the lava serpent."),
            page("geyser", geyserPic, [
              Lang.t("A vent bubbles in the lava, then blows steam up to the ceiling."),
              Lang.t("The steam lifts you in mid-air, and the rocks it touches.") ]),
            page("orbs", orbPic, [
              Lang.t("A bubble rises out of the lake and carries you up with it."),
              Lang.t("The bubble pops after a while or at the ceiling, and throws you higher.") ]),
            page("serpent", serpentPic, [
              Lang.t("A swirl on the lava marks where the serpent will leap from."),
              Lang.t("The serpent breaks the rocks in its way. Its bite costs a life.") ],
              [[Lang.t("The swirl warns"), secs(C.serpentWarn)]])
          ] },
          { key: "faults", label: Lang.t(BANDS[3]), pages: [
            biome(3, "b-faults", "Levels 19 to 24: rocks that split, crumble and blow."),
            page("shard", shardPic, [
              Lang.t("A cracked rock splits soon after your first touch, whether you stay or not."),
              Lang.t("The cracked rock breaks into three fresh pieces you can land on.") ],
              [[Lang.t("Splits after"), secs(C.shardHold)]]),
            page("dust", dustPic, [
              Lang.t("A crumbling rock falls to dust soon after your first touch."),
              Lang.t("Jump before the ring runs out, or fall with the dust.") ],
              [[Lang.t("Falls to dust after"), secs(C.dustHold)]]),
            page("bomb", bombPic, [
              Lang.t("Your first touch lights the fuse. The dashed circle is the blast's reach."),
              Lang.t("The blast throws you and breaks your chain. Lava sets bombs off too.") ],
              [[Lang.t("Blows after"), secs(C.bombHold)]])
          ] },
          { key: "core", label: Lang.t(BANDS[4]), pages: [
            biome(4, "b-core", "Levels 25 to 30: three or four of these dangers at once.",
                  "Earn all 90 stars and an endless run opens, with everything at once."),
            theme("furnace", ["fire", "bomb", "fire"], "surge", "Jump off fireballs fast. A surge can catch you waiting."),
            theme("cold", ["ice", "water", "magnet"], null, "Ice throws you up and crystals catch you. Chain them to climb."),
            theme("ascent", ["orb", "geyser", "magnet"], "lake", "Steam, bubbles and crystals all send you up. Use them!"),
            theme("collapse", ["shard", "dust", "bomb", "fire"], null, null),
            theme("lair", null, null, "Watch the swirl and the red line at once."),
            theme("cataclysm", ["bomb", "geyser", "bomb"], "surge", null)
          ] }
        ];
      }
    };
    // the five biomes' names, as the map's bands write them (web.levels.bands)
    var BANDS = ["Caldera", "Frozen sulphur", "Geysers", "Fault lines", "The core"];

    /* --- THE LEVEL LAYER (web target) ------------------------------------
       `applyLevel(d)` is called after the manifest's `levels.tune` has lerped
       the pressure into CONFIG and BEFORE reset(): it picks the biome and the
       row of CONFIG.ladder that say what this level IS, and eases the
       pressure back on a biome's first two levels (`ladder.ease`), so a new
       rock is met before the squeeze comes back. Writing into CONFIG in place
       is safe: the level layer re-lerps every tuned key before each call.

       `null` is the endless run on the web — every hazard at once — and the
       playable, which never calls this and keeps the caldera it shipped
       with. `CONFIG.slug` is what tells the two apart: only the web build
       injects it. */
    function applyLevel(d) {
      var n = CONFIG.level | 0, b = 0, i;
      if (!n || d == null) {
        BIO = CONFIG.slug ? LAD.biomes[LAD.biomes.length - 1] : null;
        ROW = CONFIG.slug ? LAD.endless : null;
        return;
      }
      for (i = 0; i < LAD.from.length; i++) if (n >= LAD.from[i]) b = i;
      BIO = LAD.biomes[b];
      ROW = LAD.levels[Math.min(n, LAD.levels.length) - 1];
      var e = LAD.ease[Math.min(n - LAD.from[b], LAD.ease.length - 1)];
      C.riseSeconds = Math.round(C.riseSeconds / e);
      C.fastChance = C.fastChance * e;
    }

    // The level's own objective (ladder.levels[].goal); the copy stays the manifest's.
    function levelGoal(n) {
      var row = LAD.levels[(n | 0) - 1];
      return row && row.goal ? { goal: row.goal } : null;
    }

    /* The three-star finish: the web shell has already played the slow
       motion, and the round ends through the game's own result so the end
       screen keeps these stat rows. Ignored by the playable, which has no
       levels — see docs/LEVELS.md. */
    return { reset: reset, update: update, render: render,
             onDown: onDown, onMove: onMove, onUp: onUp, onResize: onResize,
             applyLevel: applyLevel, levelGoal: levelGoal, levelWon: finish, guide: guide,
             /* The third star is a clean climb: every hit taken counts
                against the allowance of `web.levels.faults`. */
             levelFaults: function () { return hitsTaken; } };
  })();
