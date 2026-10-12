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
    music: { volume: 0.11, fade: 1.6,
             menu: { from: 0, length: 38.75, rate: 0.85, gain: 0.5 } },
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
    spawnEvery: 0.66, spawnMin: 0.34,
    maxRocks: 9, minRocks: 4,
    recoil: 0.1,                    // how much a jump kicks the rock it leaves

    /* --- the fireballs -----------------------------------------------------
       Not deadly on contact — the lava already punishes a bad read. A fireball
       is a rock that gives you a beat and a half and then shrugs you off,
       toasting the marshmallow one shade on the way. */
    fireMinR: 30, fireMaxR: 56,
    fireChance0: 0.1, fireChance1: 0.42,
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
    /* The toast IS the life. A touch of lava does not end the run while the
       body still has a shade to lose: it is thrown back up, one shade
       browner, and only a charred marshmallow melts. Fireballs, drops and
       blasts brown it the same way, and ice gives a shade back — so every
       burn is a cost and the run lasts as long as the player keeps paying. */
    lavaBounce: 1750,               // px/s the lava throws the body back up at —
                                    //    into the upper half, clear of the
                                    //    burning rocks crowding the crust
    lavaGrace: 1.2,                 // seconds the lava cannot catch it again
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
    crustR: 78,             // half the crust's width (it is a flat plate)
    crustLife: 4.5,         // seconds before it cracks back into the lake
    /* MAGNET CRYSTALS hang in the cave: inside their field they pull the body
       in flight toward them. They hold nothing — they bend a jump. */
    magnetR: 190,           // the field's radius, drawn
    magnetPull: 2600,       // px/s^2 at the centre, falling to 0 at the rim
    /* The LAVA SERPENT: a swirl on the lake, then a leap across it in an arc.
       It breaks the rocks it goes through and bites the body. */
    serpentEvery: 7,        // seconds between two leaps, +-25%
    serpentWarn: 1.3,       // the swirl before one
    serpentLeap: 1.6,       // the leap itself
    serpentSegs: 11,
    /* ASH GUSTS sweep the forest: a warning of ash, then a wind that pushes
       the body in flight, and a little the rocks. */
    gustEvery: 7, gustWarn: 1, gustTime: 2.6,
    windPush: 900,          // px/s^2 on the body in flight, at full gust
    windRock: 80,           // px/s^2 on a rock
    /* S'MORES: a biscuit and a chocolate drift down; catch one of each and
       the s'more takes a shade of toast off, or doubles the points for a
       while when there is none to take. */
    smoreEvery: 6.5, smoreFall: 70, smoreR: 24,
    smoreBoost: 10,         // seconds of double points

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
    surgeHeight: 0.1,       // fraction of the play band a surge climbs
    dropEvery: 2.4,         // seconds between two drops off the ceiling, +-25%
    dropForm: 0.8,          // a drop swells on the ceiling this long first
    dropR: 13,
    dropGravity: 1400,
    dropKnock: 260,         // px/s a drop knocks the body down at

    /* --- the climb (web target) ---------------------------------------------
       Read by `applyLevel` (section 6); the playable never calls it, so it
       keeps the caldera it shipped with. The manifest's `levels.tune` lerps
       the pressure over the thirty levels and this table says what each one
       IS: five biomes of six, each bringing one new thing that changes how
       the fall is read, then the core mixing two of them at a time.

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

       A row: `goal` is the level's objective, the score its first star asks
       for (the second and third are 1.5x and 2.2x it — packages/webshell/
       levels.js), handed to the map by levelGoal(). It is MEASURED, not
       lerped: 0.9 x what a scripted pilot scores in 30 s of that biome,
       climbing 8 % either side of it over the biome's six levels, so the
       third star — the one that ends the round — asks for about a minute of
       a pilot that never hesitates, and more of a player. `fire` scales the
       fireball rate (0 = none), `ice` / `shard` /
       `dust` / `bomb` are the share of the rocks drawn as that special,
       `geysers` how many vents, `surge` and `drops` turn the core's two
       hazards on, `orbs`, `water`, `serpent` and `wind` four more (the bubble
       to ride, the drips that set a crust, the leap, the gusts), `magnets`
       how many crystals hang in the cave, `smores: 0` keeps the treats out
       (they fall on every other level), and `intro` names what the round announces on its first
       second — only on the level where it first appears. `endless` is the
       run a perfect board unlocks: all of it at once. */
    ladder: {
      from: [1, 7, 13, 19, 25],
      biomes: [
        // the lava cave: the track's gentle opening, after its first bars
        { key:"caldera", ember:"#ff9d2e", scene:"backgroundPhone01", music: { from: 12, length: 26.75 } },
        // the crystal cave: the full groove, in after the break at 40-44.5 s
        { key:"frost",   ember:"#bfefff", scene:"backgroundPhone02", music: { from: 44.75, length: 25 } },
        // the jungle gorge: the second half of that groove
        { key:"geysers", ember:"#ffe27a", scene:"backgroundPhone03", music: { from: 69.75, length: 26.75 } },
        // the dead forest: the thinner, nervous middle section
        { key:"faults",  ember:"#c9b8a0", scene:"backgroundPhone04", music: { from: 96.5, length: 25.25 } },
        // the serpent temple: the loudest stretch of the track
        { key:"core",    ember:"#ff5a1f", scene:"backgroundPhone05", music: { from: 121.75, length: 26 } }
      ],
      ease: [0.82, 0.92, 1, 1, 1, 1],
      levels: [
        // the lava cave: the game as it shipped; s'mores from 2, fireballs from 3
        { goal:2000, fire:0, smores:0 },
        { goal:2100, fire:0, intro:["smores"] },
        { goal:2150, fire:1, intro:["fire"] },
        { goal:2200, fire:1 },
        { goal:2300, fire:1 },
        { goal:2350, fire:1 },
        // the crystal cave: ice throws the body up; cold water, then magnets
        { goal:2150, fire:0.6, ice:0.25, intro:["ice"] },
        { goal:2200, fire:0.8, ice:0.3 },
        { goal:2300, fire:1, ice:0.3, water:1, intro:["water"] },
        { goal:2350, fire:1, ice:0.35, water:1 },
        { goal:2450, fire:1, ice:0.3, magnets:1, intro:["magnets"] },
        { goal:2500, fire:1, ice:0.35, water:1, magnets:2 },
        // the jungle gorge: the steam lifts; then the lake's own bubbles
        { goal:1450, fire:0.6, geysers:1, intro:["geyser"] },
        { goal:1500, fire:0.8, geysers:1 },
        { goal:1550, fire:1, geysers:1, orbs:1, intro:["orbs"] },
        { goal:1600, fire:1, geysers:2, orbs:1 },
        { goal:1650, fire:1, geysers:2, ice:0.15, orbs:1 },
        { goal:1700, fire:1, geysers:3, ice:0.2, orbs:1 },
        // the dead forest: rocks that do not last — split, wind, dust, bomb
        { goal:3550, fire:0.6, shard:0.3, intro:["shard"] },
        { goal:3650, fire:0.8, shard:0.3, wind:1, intro:["wind"] },
        { goal:3800, fire:0.8, shard:0.15, dust:0.25, intro:["dust"] },
        { goal:3900, fire:1, shard:0.2, dust:0.3, wind:1 },
        { goal:4000, fire:0.8, shard:0.1, dust:0.15, bomb:0.2, intro:["bomb"] },
        { goal:4150, fire:1, shard:0.15, dust:0.2, bomb:0.2, wind:1 },
        // the serpent temple: the lava surges, drips and leaps; old friends mixed in
        { goal:2450, fire:0.6, surge:1, ice:0.2, intro:["surge"] },
        { goal:2550, fire:0.8, drops:1, shard:0.25, intro:["drops"] },
        { goal:2650, fire:0.8, surge:1, serpent:1, intro:["serpent"] },
        { goal:2700, fire:1, drops:1, bomb:0.18, serpent:1, water:1 },
        { goal:2800, fire:1, surge:1, drops:1, ice:0.2, dust:0.2, orbs:1 },
        { goal:2900, fire:1, surge:1, drops:1, geysers:2, bomb:0.15, serpent:1, magnets:1 }
      ],
      endless: { fire:1, ice:0.12, shard:0.1, dust:0.1, bomb:0.1, geysers:2, surge:1, drops:1,
                 orbs:1, water:1, magnets:1, serpent:1, wind:1 }
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
      // The playable's cut is the first biome's window, 12 s -> 38.75 s of the
      // master (the caldera, ladder.biomes); the web build ships the whole
      // track (web.music) and plays one window per biome.
      "music": "data:audio/mpeg;base64,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qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//tSxOWAExD9abmXgBFIBqmrnjADqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+1LEoYPAAAGkAAAAIAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==",
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
    var elapsed, spawnT, wave, wallT, bonkT, aim, dead, deadT, sink;
    var lavaY, lavaLo, lavaHi;
    var bg = null, fire = null, steam = null;

    /* The level, as applyLevel left it: BIO is the biome (the embers' colour),
       ROW the row of CONFIG.ladder. Both null in the playable, which is the
       caldera exactly as it shipped. */
    var LAD = CONFIG.ladder, BIO = null, ROW = null;
    var geysers = [], drops = [], dropT = 0;
    var surge = { ph: 0, left: 0, off: 0 };   // 0 calm, 1 warn, 2 up, 3 hold, 4 down
    var orbT = 0, water = [], waterT = 0, magnets = [];
    var serpent = { st: 0, left: 0 };         // 0 idle, 1 the swirl, 2 the leap
    var wind = { ph: 0, left: 0, dir: 1, s: 0 }, ash = [];
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
      crust: { kind:2 }
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
    function puff(key, x, y, size, life) {
      if (!sprite(key)) return;
      puffs.push({ key: key, x: x, y: y, size: size, t: 0, life: life, rot: Rand.range(-0.5, 0.5) });
    }

    // What a level says on its first second, once, where the thing is new.
    var INTRO = {
      fire:   ["Fireballs", "They throw you off after a beat"],
      ice:    ["Ice rocks", "They throw you straight up"],
      geyser: ["Geysers", "The steam lifts whatever it touches"],
      shard:  ["Cracked rocks", "They split into pieces you can land on"],
      dust:   ["Crumbling rocks", "They fall to dust soon after you land"],
      bomb:   ["Bombs", "They blow 2 s after you land: get away"],
      surge:  ["Lava surges", "The lava swells in waves"],
      drops:  ["Lava drops", "They set rocks on fire"],
      smores: ["S'mores", "Catch a biscuit and a chocolate"],
      water:  ["Cold water", "It turns the lava to a crust you can stand on"],
      magnets:["Magnet crystals", "They pull you in mid-air"],
      orbs:   ["Lava bubbles", "Ride one up before it pops"],
      wind:   ["Ash gusts", "The wind pushes you in mid-air"],
      serpent:["Lava serpent", "Watch the swirl: it leaps from there"]
    };

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
      return lavaY - surge.off + Math.sin(x * 0.011 + wave) * 8 + Math.sin(x * 0.029 - wave * 1.7) * 4;
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
      // ice takes one shade of toast back off the body, which is what makes it
      // the answer to a run of fireballs rather than one more hazard
      if (rk.sp === "ice" && !rk.hot && toast > 0) {
        toast--;
        Fx.burst(mallow.x, mallow.y, { color:["#e8fbff", "#9fdcf2"], count:10, speed:180, life:.4, grav:-60, size:4 });
      }

      if (rk.hot) { scorch(rk); return; }
      if (rk.used) {                                  // a rock already claimed
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
      Sound.clip("stick", 0.62, Rand.range(0.86, 1.02) * (rk.r > 70 ? 0.9 : 1.1));

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
        Sound.clip("climb", 0.5, 1 + Math.min(rocksHit / 60, 0.35));
        /* ...and climbing heals: every milestone takes a shade of toast back,
           the comeback a player earns by playing well rather than by luck. */
        if (toast > 0) {
          toast--;
          Fx.burst(mallow.x, mallow.y, { color:["#fff3dd", "#ffffff"], count:12, speed:200, life:.45, grav:-80, size:4 });
        }
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
      Pop.show("danger", { word:"Hot!", sub:"Jump", at:"upper" });
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
      else Sound.clip("crumble", 0.32, rk.sp === "dust" ? 1.5 : 1.15);
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
      Sound.clip("ice", 0.55, Rand.range(0.95, 1.1));
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
        if (o === rk || o.sunk > 0) continue;
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
        Pop.show("danger", { word:"Boom!", at:"upper" });
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
            Sound.clip("geyser", 0.45, Rand.range(0.92, 1.08));
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
    function stepSurge(d) {
      var H = Layout.h * C.surgeHeight, s = surge, p;
      s.left -= d;
      while (s.left <= 0) {
        s.ph = (s.ph + 1) % 5;
        s.left += [C.surgeEvery, C.surgeWarn, C.surgeUp, C.surgeHold, C.surgeDown][s.ph];
        if (s.ph === 1) Sound.clip("surge", 0.6);
        if (s.ph === 2) Fx.shake(4, C.surgeUp);
      }
      if (s.ph === 2) { p = 1 - s.left / C.surgeUp; s.off = H * p * (2 - p); }
      else if (s.ph === 3) s.off = H;
      else if (s.ph === 4) { p = s.left / C.surgeDown; s.off = H * p * p; }
      else s.off = 0;
    }

    /* A drop swells on the ceiling, then falls. A rock it lands on catches
       fire — ice hisses away, a bomb goes up — and the body it lands on is
       knocked loose, its chain broken and one shade browner. */
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
          if (rk.sunk > 0 || rk.burning) continue;
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
      toast = Math.min(3, toast + 1); mallow.hot = 0.9; mallow.blown = 0.5;
      combo = 0; HUD.setRight(null);
      if (mallow.host) loose(mallow.host.vx, C.dropKnock, mallow.host);
      else mallow.vy = Math.max(mallow.vy, 0) + C.dropKnock;
      Sound.clip("burn", 0.55, Rand.range(1.05, 1.2));
      Fx.burst(mallow.x, mallow.y - C.mallowLen * 0.4, { color:["#ffd166", "#ff7a1a"], count:14, speed:280, life:.4, grav:300 });
      Pop.show("danger", { word: toast >= 3 ? Lang.t("Burnt!") : Lang.t("Hot!"), sub:"Jump", at:"upper" });
    }

    /* ---- the climb's other hands ------------------------------------------
       Six more things a row of ladder.levels can put in the cave: a bubble to
       ride, water that makes ground of the lake, magnets that bend a jump, a
       serpent, the wind, and s'mores to catch. Each is off unless its row
       names it, so the playable never meets any of them. */

    // A body the rock physics leaves alone: it neither pushes nor is pushed.
    function ghost(rk) { return rk.sp === "orb" || rk.sp === "crust"; }

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
      Sound.clip("pop", 0.3, 0.7);
    }
    function burstOrb(rk) {
      if (mallow.host === rk) { loose(rk.vx, -C.orbKick, null); mallow.blown = 0.4; }
      Sound.clip("pop", 0.6, Rand.range(0.9, 1.1));
      Fx.burst(rk.x, rk.y, { color:["#ffd76a", "#ff9d2e", "#fff3dd"], count:22, speed:300, life:.45, grav:500, size:5 });
      Fx.ring(rk.x, rk.y, { from: rk.r * 0.6, to: rk.r * 1.6, color:"#ffd76a", width:5, life:.3 });
    }

    // THE WATER: drips that set a crust on the lake and put fires out.
    function stepWater(d) {
      var i, j, w, rk, hit;
      waterT -= d;
      if (waterT <= 0) {
        waterT = C.waterEvery * Rand.range(0.75, 1.25);
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
      rk.life = C.crustLife;
      rocks.push(rk);
      Sound.clip("crumble", 0.45, 1.6);
      Fx.burst(x, surfaceAt(x), { color:["#ffffff", "#e8fbff", "#c9b8a0"], count:18, speed:220, life:.7, grav:-200, size:7 });
    }

    // THE MAGNETS: crystals hanging in the cave, a field each.
    function newMagnets(n) {
      var i, out = [];
      for (i = 0; i < n; i++) {
        out.push({ x: Layout.left + Layout.w * (i + 1) / (n + 1) + Rand.range(-50, 50),
                   y0: Layout.top + Layout.h * Rand.range(0.24, 0.5), y: 0, ph: Rand.range(0, TAU) });
        out[i].y = out[i].y0;
      }
      return out;
    }
    // the pull at a point, into out.x / out.y (the flight and the preview both)
    function magnetPull(x, y, out) {
      var i, m, dx, dy, dist, f;
      out.x = 0; out.y = 0;
      for (i = 0; i < magnets.length; i++) {
        m = magnets[i]; dx = m.x - x; dy = m.y - y; dist = Math.hypot(dx, dy);
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
    function segR(i) { return 26 - i * 1.3; }
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
        } else {
          sv.left += C.serpentEvery * Rand.range(0.75, 1.25);
          splash(sv.x1, 20);
        }
      }
      if (sv.st !== 2) return;
      q = 1 - sv.left / C.serpentLeap;
      for (i = 0; i < C.serpentSegs; i++) {
        if (q - i * 0.045 < 0 || q - i * 0.045 > 1) continue;
        serpentAt(q - i * 0.045, p);
        if (p.y > surfaceAt(p.x)) continue;              // still under the crust
        if (!dead && !sv.bit && mallow.safe <= 0 &&
            Math.hypot(mallow.x - p.x, mallow.y - p.y) < segR(i) + C.mallowR * 0.8) bite(p);
        for (j = 0; j < rocks.length; j++) {
          rk = rocks[j];
          if (rk.sunk > 0 || rk.sp === "crust" || rk.smashed) continue;
          if (Math.hypot(rk.x - p.x, rk.y - p.y) < segR(i) + rk.r * 0.7) { rk.smashed = true; gone = true; }
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
      toast = Math.min(3, toast + 1);
      combo = 0; HUD.setRight(null);
      var dx = mallow.x - p.x, dy = mallow.y - p.y, dist = Math.hypot(dx, dy) || 1;
      loose(dx / dist * 650, Math.min(dy / dist * 650, -450), mallow.host);
      mallow.hot = 0.9; mallow.blown = 0.6; mallow.safe = 0.6;
      Sound.clip("burn", 0.7, 0.85);
      Fx.flash("#ff3b00", 0.3, 2.5);
      Fx.shake(10, 0.3);
      Pop.show("alert", { word:"Bitten!", at:"upper" });
    }

    // THE WIND: calm, a warning of ash, a gust, calm again.
    function stepWind(d) {
      var w = wind, e;
      w.left -= d;
      while (w.left <= 0) {
        w.ph = (w.ph + 1) % 3;
        if (w.ph === 1) { w.dir = Rand.chance(0.5) ? 1 : -1; w.left += C.gustWarn; Sound.clip("wind", 0.5); }
        else if (w.ph === 2) w.left += C.gustTime;
        else w.left += C.gustEvery * Rand.range(0.75, 1.25);
      }
      if (w.ph === 1) w.s = 0.25 * (1 - w.left / C.gustWarn);
      else if (w.ph === 2) w.s = Math.min(1, (C.gustTime - w.left) / 0.3, w.left / 0.5);
      else w.s = 0;
      for (var i = 0; i < ash.length; i++) {
        e = ash[i];
        e.x += (w.dir * w.s * 560 + e.vx) * d; e.y += e.vy * d;
        if (e.x < -20) e.x = view.w + 20; if (e.x > view.w + 20) e.x = -20;
        if (e.y < Layout.top - 20) e.y = Layout.top + Layout.h;
      }
    }
    // the gust's strength `t` seconds from now, walked through its cycle
    function windAt(t) {
      var w = wind, ph = w.ph, left = w.left, i;
      for (i = 0; i < 3 && t >= left; i++) {
        t -= left; ph = (ph + 1) % 3;
        left = ph === 1 ? C.gustWarn : ph === 2 ? C.gustTime : 99;
      }
      return ph === 2 ? 1 : ph === 1 ? 0.25 : 0;
    }

    // THE S'MORES: a biscuit and a chocolate drifting down, to be caught.
    function stepTreats(d) {
      var i, t, kind;
      treatT -= d;
      if (treatT <= 0) {
        treatT = C.smoreEvery * Rand.range(0.75, 1.25);
        kind = held.biscuit !== held.chocolate && Rand.chance(0.7)
             ? (held.biscuit ? "chocolate" : "biscuit")
             : (Rand.chance(0.5) ? "biscuit" : "chocolate");
        treats.push({ kind: kind, x: Rand.range(Layout.left + 50, Layout.right - 50), y: Layout.top - 30, ph: Rand.range(0, TAU) });
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
      Sound.clip("pickup", 0.55, t.kind === "biscuit" ? 1 : 1.15);
      Fx.burst(t.x, t.y, { color:["#fff3dd", "#ffd166"], count:10, speed:200, life:.35, grav:300, size:4 });
      if (held[t.kind]) {                         // a second one of a kind: a few points
        score += 20; HUD.setScore(score);
        Pop.text(t.x, t.y - 30, "+20", { color:"#ffd166", size:22, life:0.6, tier:1 });
        return;
      }
      held[t.kind] = true;
      if (!held.biscuit || !held.chocolate) return;
      held.biscuit = held.chocolate = false;       // the s'more
      Sound.clip("smore", 0.7);
      if (toast > 0) {
        toast--;
        Pop.show("bonus", { word:"S'more!", sub:"Healed", at:"upper" });
      } else {
        boostT = C.smoreBoost;
        Pop.show("bonus", { word:"S'more!", sub:"Double points", at:"upper" });
      }
      Fx.ring(mallow.x, mallow.y, { from:20, to:120, color:"#ffd166", width:6, life:.4 });
    }

    function fling(dirx, diry) {
      var rk = mallow.host, mid = !rk;
      if (mid) {                             // a recovery shot, and it is spent
        mallow.air--;
        Fx.ring(mallow.x, mallow.y, { from:14, to:82, color:"#ffd166", width:5, life:.3 });
      }
      mallow.vx = dirx * C.flingSpeed;
      mallow.vy = diry * C.flingSpeed;
      /* The structure it just left is out for the WHOLE flight, not only while
         they still overlap: a jump has to find a new hold, so the shot is a
         commitment instead of a way to hop in place on one safe rock. */
      mallow.ignore = rk;
      mallow.flying = true; mallow.host = null; mallow.hold = 0;
      if (rk) {                              // small rocks get kicked harder
        var m = Math.max(0.25, 60 / rk.r);
        rk.vx -= dirx * C.flingSpeed * C.recoil * m * 0.15;
        rk.vy -= diry * C.flingSpeed * C.recoil * m * 0.15;
      }
      Sound.clip("fling", mid ? 0.42 : 0.5, mid ? Rand.range(1.22, 1.32) : Rand.range(0.96, 1.08));
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
      score = 0; combo = 0; bestCombo = 0; rocksHit = 0; toast = 0; focus = 1; focusT = 0;
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
      orbT = C.orbEvery * 0.5; water = []; waterT = C.waterEvery;
      magnets = ROW && ROW.magnets ? newMagnets(ROW.magnets) : [];
      serpent = { st: 0, left: C.serpentEvery * 0.6 };
      wind = { ph: 0, left: C.gustEvery * 0.5, dir: 1, s: 0 }; ash = [];
      if (ROW && ROW.wind) for (var ai = 0; ai < 36; ai++) {
        ash.push({ x: Rand.range(0, view.w), y: Rand.range(Layout.top, Layout.bottom), vx: Rand.range(-12, 12),
                   vy: -Rand.range(10, 40), l: Rand.range(4, 10) });
      }
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
      HUD.setLeft(best, "Best");
      HUD.setRight(null);
      Fx.reset();
      buildSprites();

      // what this level brings that the last one did not (after the entrance)
      if (ROW && ROW.intro) {
        for (i = 0; i < ROW.intro.length; i++) {
          Notify.say(INTRO[ROW.intro[i]][0], { sub: INTRO[ROW.intro[i]][1], kind:"info", key:"mm-" + ROW.intro[i] });
        }
      }
    }

    /* The body touched the lava, or rode a rock into it. Charred, it melts;
       otherwise it is thrown back up, a shade browner, with its mid-air shot
       back in hand to find a rock on the way, and the lava cannot catch it
       again until it has had the time to climb out. */
    function lavaHit() {
      if (dead || mallow.safe > 0) return;
      if (toast >= 3) { die(); return; }
      toast++;
      combo = 0; HUD.setRight(null);
      loose((mallow.host ? mallow.host.vx : mallow.vx) * 0.3, -C.lavaBounce, mallow.host);
      mallow.y = Math.min(mallow.y, surfaceAt(mallow.x) - C.mallowR - 2);
      mallow.air = C.airShots; mallow.safe = C.lavaGrace; mallow.hot = 1; mallow.blown = 0.6;
      splash(mallow.x, 18);
      Sound.clip("burn", 0.75, 0.9);
      Fx.flash("#ff6b1a", 0.3, 2.5);
      Fx.shake(9, 0.3);
      Pop.show("alert", { word:"Scorched!", at:"upper" });
      if (toast >= 3) Notify.say("Charred", { sub:"One more touch of lava and you melt", kind:"warn", key:"mm-charred" });
    }

    function die() {
      if (dead) return;
      dead = true; deadT = 0; sink = 0; aim = null;
      mallow.flying = false; mallow.host = null;
      Sound.clip("melt", 0.85);
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
            if (rk.sunk > 0 || rk.burning || Math.abs(rk.x - geysers[i].x) > C.geyserHalf + rk.r * 0.4) continue;
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
        if (orbT <= 0) { orbT = C.orbEvery * Rand.range(0.75, 1.25); spawnOrb(); }
      }
      if (ROW && ROW.water) stepWater(d);
      for (i = 0; i < magnets.length; i++) { magnets[i].ph += d * 1.2; magnets[i].y = magnets[i].y0 + Math.sin(magnets[i].ph) * 18; }
      if (ROW && ROW.serpent) stepSerpent(d);
      if (ROW && ROW.wind) {
        stepWind(d);
        for (i = 0; i < rocks.length; i++) if (!ghost(rocks[i])) rocks[i].vx += wind.dir * wind.s * C.windRock * d;
      }
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
        if (wind.s > 0) mallow.vx += wind.dir * wind.s * C.windPush * d;
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
            toast = Math.min(3, toast + 1);          // it stayed too long: that burns
            Pop.show("alert", { word:"Burnt!", at:"upper" });
            Sound.clip("crumble", 0.6);
          }
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
      Sound.clip("wall", 0.3, Rand.range(0.95, 1.2));
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
      if (ash.length) drawAsh();

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
      var crust = lavaY - surge.off;
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

    // A crust of cooled lava: a black plate, its cracks reddening as it goes.
    function drawCrust(rk) {
      var left = clamp(rk.life / C.crustLife, 0, 1), y = rk.y + rk.sunk * 40, i, a;
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

    // The magnet crystals and their fields: rings drawn in toward the core.
    function drawMagnets() {
      var i, k, m, f, img = sprite("rockCrystal01"), mm = img && measure("rockCrystal01");
      for (i = 0; i < magnets.length; i++) {
        m = magnets[i];
        ctx.drawImage(auraCv[2] || fire, m.x - 70, m.y - 70, 140, 140);
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
        if (img && mm) drawBody(img, mm, m.x, m.y, m.ph * 0.3, 30);
        else {
          ctx.fillStyle = "#8a5cff";
          ctx.beginPath(); ctx.moveTo(m.x, m.y - 34); ctx.lineTo(m.x + 20, m.y); ctx.lineTo(m.x, m.y + 34); ctx.lineTo(m.x - 20, m.y); ctx.closePath(); ctx.fill();
        }
      }
    }

    // The serpent, tail first, so the head is on top; the lake hides the rest.
    function drawSerpent() {
      var sv = serpent, q = 1 - sv.left / C.serpentLeap, i, r, p = {}, n = {};
      for (i = C.serpentSegs - 1; i >= 0; i--) {
        if (q - i * 0.045 < 0 || q - i * 0.045 > 1) continue;
        serpentAt(q - i * 0.045, p);
        r = segR(i);
        ctx.fillStyle = "#5a0f08";
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
        ctx.fillStyle = i % 2 ? "#ff6a1a" : "#ff9d2e";
        ctx.beginPath(); ctx.arc(p.x, p.y - r * 0.15, r * 0.72, 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(255,236,170,.6)";
        ctx.beginPath(); ctx.arc(p.x - r * 0.25, p.y - r * 0.4, r * 0.25, 0, TAU); ctx.fill();
        if (i === 0) {
          // the head: two eyes, looking the way it flies
          serpentAt(Math.min(1, q + 0.02), n);
          var a = Math.atan2(n.y - p.y, n.x - p.x), ex = Math.cos(a + Math.PI / 2) * r * 0.45, ey = Math.sin(a + Math.PI / 2) * r * 0.45;
          var fx = Math.cos(a) * r * 0.35, fy = Math.sin(a) * r * 0.35;
          ctx.fillStyle = "#ffe14a";
          ctx.beginPath(); ctx.arc(p.x + fx + ex, p.y + fy + ey, r * 0.24, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(p.x + fx - ex, p.y + fy - ey, r * 0.24, 0, TAU); ctx.fill();
          ctx.fillStyle = "#1a0503";
          ctx.beginPath(); ctx.arc(p.x + fx * 1.2 + ex, p.y + fy * 1.2 + ey, r * 0.1, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(p.x + fx * 1.2 - ex, p.y + fy * 1.2 - ey, r * 0.1, 0, TAU); ctx.fill();
        }
      }
    }

    // The swirl it leaps from: rings tightening on the lake, and a glow.
    function drawSwirl() {
      var sv = serpent, t = 1 - sv.left / C.serpentWarn, k, f, y = surfaceAt(sv.x0);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.3 + 0.6 * t;
      ctx.translate(sv.x0, y + 4); ctx.scale(1, 0.45);
      ctx.drawImage(auraCv[0] || fire, -120, -120, 240, 240);
      ctx.restore();
      for (k = 0; k < 3; k++) {
        f = (t * 2 + k / 3) % 1;
        ctx.strokeStyle = rgba("#5a0f08", 0.7 * (1 - f));
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(sv.x0, y + 6, 90 * (1 - f) + 10, (90 * (1 - f) + 10) * 0.3, 0, 0, TAU); ctx.stroke();
      }
    }

    // The ash on the wind: streaks that stretch with the gust.
    function drawAsh() {
      var i, e, len = 4 + wind.s * 22;
      ctx.strokeStyle = rgba("#c9c0b8", 0.35 + 0.35 * wind.s);
      ctx.lineWidth = 2.5; ctx.lineCap = "round";
      ctx.beginPath();
      for (i = 0; i < ash.length; i++) {
        e = ash[i];
        ctx.moveTo(e.x, e.y); ctx.lineTo(e.x - wind.dir * len * (e.l / 7), e.y + 1);
      }
      ctx.stroke();
      ctx.lineCap = "butt";
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
    function drawTreats() {
      var i, t;
      for (i = 0; i < treats.length; i++) {
        t = treats[i];
        ctx.globalAlpha = 0.55;
        ctx.drawImage(auraCv[1] || fire, t.x - 48, t.y - 48, 96, 96);
        ctx.globalAlpha = 1;
        treat(t.kind, t.x, t.y, C.smoreR * 0.8, Math.sin(t.ph) * 0.3);
      }
    }
    // What the body holds toward its s'more, beside it, and the double points.
    function drawHeld() {
      var y = mallow.y - C.mallowLen * 0.5 - 44;
      if (held.biscuit) treat("biscuit", mallow.x - 22, y, 9, 0);
      if (held.chocolate) treat("chocolate", mallow.x + 22, y, 9, 0);
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
        s = p.size * (0.75 + 0.45 * k) / Math.max(im.width, im.height);
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
      g = ctx.createLinearGradient(0, lavaY - surge.off - 14, 0, view.h);
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
    }

    // The dotted arc, simulated with the same numbers the flight uses so the
    // preview cannot lie. Rocks are advanced too — they are all falling.
    function drawAim() {
      var v = aimVec();
      if (!v) return;
      var h = 1 / 60, n = Math.round(C.previewSeconds * (0.4 + 0.6 * focus) / h);
      var px = mallow.x, py = mallow.y;
      var vx = v.x * C.flingSpeed, vy = v.y * C.flingSpeed;
      // Whatever the body is on (or has just left) is out of the preview for
      // good, exactly as it is out of the flight.
      var skip = mallow.host || mallow.ignore, hit = null, pull = {};
      var i, j, rk, sx, sy, dd, t;

      for (i = 0; i < n && !hit; i++) {
        vy += C.gravity * h;
        if (geysers.length && vy > -C.geyserMax && lift(px, i * h)) vy = Math.max(vy - C.geyserPush * h, -C.geyserMax);
        if (magnets.length) { magnetPull(px, py, pull); vx += pull.x * h; vy += pull.y * h; }
        if (ROW && ROW.wind) vx += wind.dir * windAt(i * h) * C.windPush * h;
        px += vx * h; py += vy * h;
        if (px < Layout.left + C.mallowR)  { px = Layout.left + C.mallowR;  vx = -vx * C.wallBounce; }
        if (px > Layout.right - C.mallowR) { px = Layout.right - C.mallowR; vx = -vx * C.wallBounce; }
        if (py < Layout.top + C.mallowR)   { py = Layout.top + C.mallowR;   vy = -vy * C.wallBounce; }
        t = i * h;
        for (j = 0; j < rocks.length; j++) {
          rk = rocks[j];
          if (rk.sunk > 0) continue;
          if (rk === skip) continue;
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
             applyLevel: applyLevel, levelGoal: levelGoal, levelWon: finish };
  })();
