  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Vipera",
    /* One sentence, and nothing else: the stage under it shows the viper
       turning right then left on two taps, so the line only has to name the
       gesture, the character and the reward. */
    tagline: "<b class=\"w-tap\">Tap</b> to change direction and grab the bonuses to <b class=\"w-eat\">grow</b>",
    gameSeconds: 0,                  // endless: the run ends on the third bite

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
    bg: "#03110c",

    layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 30 },

    // One finger, one gesture: every tap flips the steering side. No caption —
    // the tagline is the sentence and the stage is the demonstration.
    intro: { logo: "logo", demo: "tap", caption: "",
             // on a desk: SPACE or a click (shell.js, Demo)
             desk: [{ keys: ["space"], mouse: ["click"] }] },

    // Desktop: SPACE starts, taps and replays. A "tap" demo is exactly the
    // case the engine can fake, so the game owns no keyboard code.
    keyboard: true,

    // No round entrance: the banks, the walls and the viper are all on the
    // board the moment a stage starts, so the run begins at once.
    enter: false,

    // Endless run: the armour state replaces the clock in the right HUD slot.
    hud: { score: true, timer: false },

    /* The bed. On the web target the track is whole and each biome loops its
       own stretch of it (CONFIG.biomes[].music); the menus loop its calm
       opening, a little slower and at half the level. */
    /* `seam`: every window loops on the bar, two beats of crossfade ending on
       its downbeat (docs/MUSIC.md, The seam); `cut`: the playable's window,
       one seam of pre-roll into its embedded cut. */
    music: { volume: 0.11, fade: 1.6, seam: 1,
             cut: { from: 1, length: 32.008 },
             menu: { from: 0, length: 27.997, rate: 0.85, gain: 0.5 } },

    // All user-facing copy in one place.
    copy: {
      start:      "Play",
      ctaBar:     "Install now",
      ctaEnd:     "Play the full game",
      replay:     "Slither again",
      scoreLabel: "Score",
      timeLabel:  "Time",
      endScore:   "Final score",
      gameOver:   "Torn apart",
      timeUp:     "Time's up!"
    },

    /* ---- VIPERA tunables --------------------------------------------------
       Read by the Game module (section 6). Lengths are in design px, distances
       along the burrow are in PROGRESS px — the coordinate the camera rides. */
    play: {
      // --- the viper ------------------------------------------------------
      // The first block sits under the head, so the body shows one plate less
      // than it has blocks: 4 plates at the start, 20 at full length.
      startLen:  5,        // blocks at the first frame
      maxLen:    21,       // blocks the body cannot grow past
      block:     27,       // progress px between two blocks
      headR:     25,       // head radius at startLen...
      headGrow:  0.45,     // ...plus this much per block grown
      sample:    9,        // min gap between two trail samples

      // --- steering: the viper always turns, a tap only flips the side -----
      turn:      3.4,      // radians per second
      maxAngle:  0.68,     // steering cap, off straight-up (~39 deg)
      edge:      52,       // keep the head this far inside Layout
      wallHold:  0.3,      // seconds before a second wall bounce may sound
      tapLock:   0.07,     // a mashed screen is still one swerve per tap
      eyeAhead:  520,      // px ahead within which the painted head eyes a gold egg

      // --- pace -----------------------------------------------------------
      // The length bonus is read off the LONGEST body of the run, never the
      // current one: a bite tears blocks off, and the pace must not sag with
      // them. Speed only ever goes up.
      speedMin:  330,      // forward speed at the first frame (px/s)
      speedMax:  560,      // ...once the time ramp is over
      ramp:      60,       // seconds of that ramp
      lenSpeed:  4,        // extra px/s per block ever grown
      speedCap:  640,

      // --- THE SQUEEZE ----------------------------------------------------
      // The head's line on screen, as a function of the body length: it starts
      // `anchorLow` above Layout.bottom and climbs to `anchorHigh` below
      // Layout.top. Growing is the reward AND the difficulty ramp — the same
      // thorn arrives with a third less time to read it.
      anchorLow:  190,
      anchorHigh: 470,
      anchorEase: 2.4,     // how fast the line follows the length (per second)

      // --- the burrow -----------------------------------------------------
      ahead:    1500,      // progress generated ahead of the camera
      pxPerM:   40,        // progress px per displayed metre
      mileStep: 250,       // metres between milestone callouts

      /* --- ARMOUR & DAMAGE ------------------------------------------------
         A FULL-LENGTH viper is PLATED, and that is the only way to be: the next
         bite costs the armour and nothing else. There is no pickup for it — the
         armour has to be earned by eating the body all the way up to `maxLen`.
         Unarmoured, a bite costs BOTH: the whole body is stripped back to
         `minLen` and one of the three lives goes with it. So the armour is never
         a small favour — losing it means eating the entire ladder again, at the
         speed the run has already reached, to get the next one. */
      lives:     3,        // bites the viper survives unarmoured
      minLen:    4,        // what a bite leaves of the body
      invTime:   1.15,     // invulnerability after a bite

      /* --- THE DEATH -----------------------------------------------------
         The last bite does not cut to the end screen: the run stops, the world
         holds still and the viper is torn apart on camera for `deathTime`
         seconds before endRound() takes over. See THE DEATH in section 6. */
      deathTime:  2,       // seconds of cinematic before the end screen
      deathCrumb: 0.062,   // seconds between two blocks tearing off the body

      // --- spawning -------------------------------------------------------
      // Difficulty is read off the DISTANCE travelled: thorn rows come more
      // often, closer together, and their gate narrows.
      diffFull:   620,     // metres to full difficulty
      rowMin:     0.3,     // share of spawn slots that are a thorn row, at the
      rowMax:     0.72,    // start of the run / at full difficulty
      rowFar:     560,     // progress between two rows at the start...
      rowNear:    360,     // ...and at full difficulty
      wallFrom:   0.34,    // difficulty at which rows become full walls
      gapWide:    330,     // the gate through a wall, at wallFrom...
      gapTight:   200,     // ...and at full difficulty
      thornStep:  104,     // x spacing of the thorns inside a wall
      gateReward: 0.62,    // chance that a gate holds a gem

      // --- THE BIOMES' HAZARDS (web levels 7-30, see CONFIG.biomes) --------
      // Each one is dangerous only in the state it is DRAWN dangerous in: a
      // trap with its spikes up, a geyser bursting, a rock once it has landed,
      // an eagle once it dives. Everything before that is warning.
      hazardShare: 0,      // share of spawn slots given to the biome's hazards
      logLen:     180,     // a drifting log, end to end...
      logR:       24,      // ...its half-thickness...
      logSpeed:   120,     // ...and how fast it drifts across (px/s)
      trapPeriod: 3.6,     // seconds for a spike trap to rise and sink once
      trapUp:     0.45,    // share of that period its spikes are up
      firePeriod: 2.6,     // the FIRE trap: a long dark wait, then a short
      fireUp:     0.22,    // burst — its flames up for this share of it
      trapStep:   96,      // x spacing of the traps in a row
      geyserPeriod: 2.8,   // seconds from one eruption of a geyser to the next
      geyserR:    72,      // the burst's reach, drawn and bitten alike
      rockFall:   560,     // progress px ahead at which a rock starts to fall
      /* THE LIGHTNING is the temple's: a zone on the ground lights up where the
         head is HEADING, a white ring closes on it to a dot, and on the dot the
         bolt lands — a flash, gone in a tenth of a second, and whatever part of
         the viper is still inside takes a bite. See THE LIGHTNING in section 6. */
      boltWarn:   0.9,     // seconds the zone glows before the bolt lands
      boltR:      64,      // the strike's reach around the zone's centre
      boltLead:   20,      // progress px ahead of the head the bolt lands at
      boltAim:    60,      // jitter around where the head is heading
      /* THE EAGLE is not an item of the burrow: it is the sky over it, on a
         clock of its own (see THE EAGLE in section 6). Its shadow glides UP one
         half of the screen, slowly — that is the warning — then the bird turns
         at the top and stoops DOWN the same half, fast. */
      eagleGap:    7,      // seconds between two passes
      eagleShadow: 2.6,    // seconds the shadow takes to cross the screen
      eagleWait:   0.4,    // beat between the shadow leaving and the stoop
      eagleStart:  0.25,   // seconds the bird hangs at the top before it dives
      eagleDive:   0.5,    // seconds the stoop takes, top to bottom

      // --- THE BIOMES' PICKUPS ---------------------------------------------
      bonusFar:   7000,    // progress between two pickups, at least...
      bonusNear:  10000,   // ...and at most (about one every 15-20 s)
      // The fireflies (gems pulled toward the head) and the idol (gem points
      // doubled) hold until the next HIT, plated or not, rather than on a
      // clock: a bonus is kept by playing clean. Amber grows the body straight
      // to one block short of full length, so the plates — the rainbow — stay
      // the last egg's to earn.
      magnetR:    230      // fireflies: gems are pulled in from this far
    },

    /* ---- THE FIVE BIOMES -----------------------------------------------------
       One per band of the level map, by LEVEL NUMBER (`from`), never by the
       map's own difficulty: two roads out of a fork must be the same world.
       The playable and the endless run have no level and stay in the first.
       `ground` / `bank` name the painted art (CONFIG.art.ground<Key>,
       CONFIG.art.bank<Key>NN), `hazards` the weighted pool a hazard slot draws
       from, `share` the hazard share at the band's first and sixth level, and
       `bonus` the pickup it brings — the older ones still turn up, more rarely.
       The drifting log is the swamp's alone: it is a trunk sinking into the
       water at both ends, and no other biome has water to sink it in.
       `music` is the biome's stretch of the track, its seams measured off the
       master (docs/MUSIC.md): the calm opening is the menu's, then the main
       theme, the soft break, the two climbs and the peak, in the order the
       climb walks them.
       `mote` tints the motes in the air, `shade` scales the canopy shadows
       (there is little canopy over a volcano), `drift` keeps the falling
       leaves, and `eagle` sends the bird over the burrow (see THE EAGLE).
       What each biome brings is named the first time it is met (LEARN, in
       section 6) and explained in the guide. */
    biomes: [
      { key: "jungle",  music: { from: 32, length: 32.008 },
        hazards: {},                                               share: [0, 0],
        bonus: null,      mote: "#a8ff8e", shade: 1,    drift: true },
      { key: "swamp",   music: { from: 65, length: 24.002 },
        hazards: { log: 1 },                                       share: [0.22, 0.4],
        bonus: "fly",     mote: "#e9ff6e", shade: 0.9,  drift: true },
      { key: "temple",  music: { from: 92, length: 24.002 },
        hazards: { trap: 1, bolt: 1 },                             share: [0.2, 0.36],
        bonus: "idol",    mote: "#ffe7a3", shade: 0.8,  drift: true },
      { key: "volcano", music: { from: 108, length: 30.003 },
        hazards: { geyser: 2, rock: 2, fire: 1 },                  share: [0.26, 0.42],
        bonus: "amber",   mote: "#ff9a3c", shade: 0.45, drift: false },
      { key: "lair",    music: { from: 138, length: 25.996 },
        hazards: { geyser: 1, rock: 1, trap: 1, fire: 1 },         share: [0.26, 0.4],
        bonus: "rainbow", mote: "#d59bff", shade: 0.6,  drift: false, eagle: true }
    ],

    /* ---- THE CLIMB, LEVEL BY LEVEL -------------------------------------------
       A SAW, not a ramp. Each biome opens a notch EASIER than the last level of
       the one before — its new hazard is learnt with room to breathe — then
       climbs over its six levels to the hardest round so far. `e` runs from 0
       (level 1) to ~1 (level 30) along that saw, and every knob below is lerped
       on it from its easy end to its hard end. The objective (a distance) is
       the map's own and climbs straight. */
    ladder: {
      from: [1, 7, 13, 19, 25],
      perBand: 0.2,        // how much harder each biome starts...
      perLevel: 0.045,     // ...each level inside it climbs...
      dip: 0.04,           // ...and how far a new biome's first level drops back
      tune: {
        speedMin:     [280, 430],
        speedMax:     [480, 680],
        diffFull:     [900, 420],
        rowMax:       [0.55, 0.88],
        gapTight:     [240, 172],
        anchorHigh:   [400, 540],
        logSpeed:     [100, 230],
        trapPeriod:   [4, 3.2],
        firePeriod:   [2.8, 2.2],
        geyserPeriod: [3.2, 2.1],
        boltWarn:     [1.05, 0.72],
        eagleGap:     [8, 4.5],
        eagleDive:    [0.56, 0.4]
      },
      lives: [[0.3, 4], [0.62, 3], [1, 2]]   // up to e: lives
    }
  };

  /* ===================================================================
     2. ASSETS — embedded base64 data URIs only (no network requests ever).
     Generate entries with tools/lab/embed-asset.mjs. Every graphic in this game is
     drawn on canvas, so the only bytes here are audio.
     =================================================================== */
  var ASSETS = {
    images: {
      // vipera.png -> the app icon shown on the intro (460x460, PNG 256c).
      // Everything else -- the viper, the burrow, the thorns -- is canvas.
      logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcwAAAHMCAMAAABvBWi0AAADAFBMVEXf1talX46gnp1kVl1q4qIZnqImW0ycXHfUZaRlnmjmmi5l5tKR36s0IkNiYF9ZW1pnJ2VKpDpi5G8v4OmO3VQ31q0VmlBnqJP40lRqYWHbmrQ6OjvNGnNQLS2r3tCjE1zz4KQv1WY2sjzjqdD9+vqgmpfnrlAqMiflH4OLNIbnbsIbs8RXWSv2yTnUdyAoMS+WaSWNjXGMdHYaTiMvNTIgciAad3c4Qj2QjIwpeonLsLCniDBxDw9rKl17N4J1YIVfusTQRHw8SEUZGX9VqlV/fw+LhH3/AACEusL/f3+TeoQ3QT2LfYJVqqoA/wBWwj4+QkSHg4T/AH/GxrNAPz+AfoH/AP9BOjqAgn7//wB7hn5FMkd9hoEEJxoCGBYJNh0AAAANSCISViZOBEgTZisKOCILCBExBjNuB1YNQx4mdzKPCmbMF3f2+forhjWxFXHzZ7ExFDAjaC0UdS8BVmoMKSjwWKf1drj1h8b3l83tN5LuRpowh0dS9PqqDWzRJ4VPFkj4p9UuljgtNzFr9/sARlj6x+YaCCTqKIYyl0rSN4761utDBT345/EShjKTFGdLuFAAOEks5/l0B2RsF1RN6c83pk34ttmHCFsCZXhPJkhJp1MX1u4xpjrSRpf5ueNRxFOOKWkuRTUuJzDR+vUATWICd4puJlVFmFAQyeVIFjhSt2uONmoVFyW0JHftS6Jmx3FPN0nMInzxecROx2oEhpcEmKoPeEVNR0oKhkuN+Pux+fdT1mrQVaglWS9qyExL6/NMVk2JFlore0RsN1SL+LH1g7sblDOzN4o8BEMIuc+QRm8FprVOqmc5t2qR9805tFAyp2gtFBNVVVS3J4YAbIImCg9W53QOxddz00+NVnDTSqOJJVt+fn1xKGsn2+1MyJHjHHxHiE6p+NNO47JOZ1ArmGRM2KysNnVM1pDQHIE4VENqyoZn1m5KqDpMd1Bxd22zRo6N6cox1tBIJDhzFWZT8ddtRllwaGntU5ty9pJJuIcd4feuGoNw1Y084sXhT/2tAAABAHRSTlP////z///8/////////l2h/v//////////I/8G//////////8CGv/n/////////6X//xb2UgMDllf/Dv8EC/////+fAgMCKQH/AiBZTQMB/12nAhu5uwFGhwFXrG7+/v4A//////7+/v/+//////////7////+//////////////////7////+///////////////////////////////////+/v/////////////////+/////////f///////////P//////////////////////A////////////wT//////////v///////v//////////////////////////EyMibAAA8btJREFUeNrU/Qd0lFe274uWJJQaHDBt08bg2N32sXvv3WGHu8MZ95xzw3l3nHHDeOONl8arKqpUJakkoVRUKUtIAoESEiCQQEYoAMICJCOCMTkZ04ANOGKMbZyxccKmHbr72G+Gtda3vlClknDvs89nGxOFVL/6zzXnXDO45v9rPP/yxht3/0/i+z+Hf3/+87tvvfW//O3f/o14PPBkZ2d7buZxG4/tJ8zP5D6cVzwT/5EIfCX/8Dd/+7d/e+vdd7/x85+rr/7Fu19841/lZXb9xf+GN974hfje//qLX9x62988TE8ksn3yvLITQilxuW+GpsExyN+6J/F5RuB5+OG0v7ntVsAqoL744j3/ncN8443/nf7/21/c+v+7LeWWtMZI5KbUl50gTPdNS9PQ5BRgalCHGh9OAaa/YKT3vPjfKUyhyH/6xf9w2217GxsjZEhv0pQmDNN909LUSeJ3buZTBqRpSJSBvvHfG8wX36BPGUAe3ZsWmRzG7IlMaiIwAZjbfTM0BUN4pixMi0wbB0Gjd/8lBfqXgMmShPMx5WhjZAqODfyBSf+ZGNCErtT/E4bp9oV8+AT5W6/nx3jcwUFQ6P/6F+P548N8Ed3Wu0GSpMgpWabsyb0D3E4sBTgpLfUkStPn02D63D8KS/6MGkGgv4XX6O/f+DcO8w18w939/wZJbp/q8Yh/Tlrl7ARhOiuSXjoE4oAzUZi+Hw+m8dkFB/fediu6RPf8G4aJn9s/3Xrb0UbPTTk62ZOQpM3CelGTGrYgwgScukQToRn0+/x+v4++8Qd/VJZSn3eTc/FvEyai/MVNk5Q0sxN6dfTXyGt/8KeFuVREmeqEeNx+4/FN/Kkk4lBZrEdwkPyhv3vx3x5MQHn3rSno8Hh+rCd7kj6PM02vz/ogzgkNpw7Tm9DbymPo3R3DObYChYgFncUX/23BfBFRDjb+iCSn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"
    },
    sounds: {
      // The background bed, looped and crossfaded by Music (see CONFIG.music).
      // The playable plays one stretch of the track, the jungle's (32-65 s);
      // the web target ships the whole of it (web.music, docs/MUSIC.md):
      //   ffmpeg -ss 31 -t 33.008 -i assets/audio/music/vipera.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3
      music: "data:audio/mpeg;base64,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"
      // No sfx clip here: every key the game plays is a role of the house kit,
      // mapped by `sfx` in manifest.json and injected by the builder.
    }
  };

  /* ===================================================================
     6. GAME — VIPERA: a viper races up an endless burrow.

     STEERING. The viper never stops moving forward, and it never stops
     TURNING: it carves at `turn` rad/s toward whichever side `dir` points at,
     up to `maxAngle` off straight-up. A tap flips `dir` — that is the whole
     input. Left alone the head runs into the angle cap and hugs one diagonal;
     tapped on a rhythm it traces a sine, which is the line the burrow is
     designed around. There is no "go straight" button, and that is what makes
     one finger enough to play.

     COORDINATES. `p` is PROGRESS: world pixels travelled up the burrow. The
     head's progress IS the camera, so the head sits exactly on `anchorY` every
     frame and everything else is placed with

         sy(y) = anchorY - (y - camP)

     Items live at { p, x }: p up the burrow, x in design pixels across it.

     THE SQUEEZE. `anchorY` is a function of the body LENGTH, not of time: at 5
     blocks the head rides near the bottom with the whole screen to read ahead,
     at 21 it has climbed some 350 px and the same thorn arrives in half the
     time. Eating is at once the reward, the score and the difficulty curve —
     the player can see the ramp they are choosing.
     =================================================================== */
  var Game = (function () {
    var TAU = Math.PI * 2;
    var T = CONFIG.play;

    /* How the body evolves with its length: fatter, hotter, one tier at a
       time, so the reward lands on the character and not only in the HUD.
       `at` is the length the tier starts at. */
    var TIERS = [
      { at: 5,  name: "Viper",   stops: ["#f4ffd6", "#c4f04e", "#7cc423", "#3a8a16"], glow: "#4dff9b", halo: "#8dffbf" },
      { at: 10, name: "Adder",   stops: ["#f6ffe6", "#d3ff7a", "#7bc91a", "#2f6b12"], glow: "#b6ff5a", halo: "#d3ff7a" },
      { at: 15, name: "Mamba",   stops: ["#eef7ff", "#9fd4ff", "#3a9bff", "#123f8a"], glow: "#5ab4ff", halo: "#9fd4ff" },
      { at: 20, name: "Basilisk", stops: ["#ffffff", "#ffb0f2", "#ff2d95", "#6a0f66"], glow: "#ff2d95", halo: "#ff9ae6" }
    ];
    // Extra class per tier for the score pops, so "+40" burns the same colour
    // as the body that earned it (palettes live in the SKIN block).
    var POP_TIER = ["pop-t0", "pop-t1", "pop-t2", "pop-t3"];

    /* WHERE A CALLOUT LANDS ------------------------------------------------
       The head is the only thing the player is really reading, and the burrow
       is narrow: a callout dropped on a fixed anchor keeps landing on top of
       the viper and on the row of items about to reach it. So no Pop in this
       game uses a named anchor — every one asks popSpot() at fire time and
       gets the candidate that is furthest from the head right now.
       Fractions of the Layout band; the motor clamps x to keep the sticker on
       screen, so the outer columns can sit closer to the walls than the
       motor's own anchors do. */
    var POP_SPOTS = [
      [0.18, 0.10], [0.50, 0.08], [0.82, 0.10],
      [0.16, 0.30], [0.84, 0.30],
      [0.16, 0.52], [0.84, 0.52],
      [0.18, 0.72], [0.82, 0.72],
      [0.24, 0.88], [0.76, 0.88]
    ];
    var lastSpot = -1;
    function popSpot() {
      var bestI = 0, bestD = -1, i, s, x, y, d;
      for (i = 0; i < POP_SPOTS.length; i++) {
        s = POP_SPOTS[i];
        x = Layout.left + s[0] * Layout.w;
        y = Layout.top  + s[1] * Layout.h;
        // Horizontal clearance is worth more than vertical: the body trails
        // straight down from the head, and the next items travel down the same
        // column, so a spot on the other side of the burrow is the safe one.
        d = Math.abs(x - headX) * 1.8 + Math.abs(y - anchorY);
        // Two callouts in a row on the same spot stack on each other; make the
        // previous winner fight for it.
        if (i === lastSpot) d *= 0.5;
        if (d > bestD) { bestD = d; bestI = i; }
      }
      lastSpot = bestI;
      s = POP_SPOTS[bestI];
      return { x: Layout.left + s[0] * Layout.w, y: Layout.top + s[1] * Layout.h };
    }

    // Draw radius / hit radius per item type. The hit radius is deliberately
    // generous on the pickups and tight on the thorns: a playable should bias
    // toward the player succeeding.
    var ITEM_R  = { orb: 25, mega: 33, thorn: 30 };
    var ITEM_HIT = { orb: 30, mega: 38, thorn: 23,
                     trap: 28, geyser: 44, rock: 30,
                     fly: 38, idol: 38, amber: 38, rainbow: 38 };
    // what the head runs into rather than eats — everything that is not food
    var PICKUP = { orb: 1, mega: 1, fly: 1, idol: 1, amber: 1, rainbow: 1 };
    var ROCK_DROP = 0.45;        // seconds a rock takes to land once it falls

    // --- world -------------------------------------------------------------
    var items, trail, bodyPts;

    // --- run state ---------------------------------------------------------
    // len / lenF / tier carry a value from the start: fitCanvas() runs (and
    // asks the game to re-measure) before the first reset().
    var len = T.startLen, lenF = T.startLen, tier = 0;
    var camP = 0, speed = 0, runT = 0;
    var headX = 0, ang = 0, dir = 1, wallT = 0, tapT = 0;
    var score, pick, orbs, chain, bestChain, bestLen, bites;
    var lives, shield, invT, tongueT;
    var dist, nextMile;
    var nextP, lastRowP, lastPop, best;
    /* THE DEATH (see below). `dieT` is the only flag the rest of the module
       reads: -1 while the viper is alive, seconds since the fatal bite once it
       is not. */
    var dieT = -1, crumbled = 0, deathSide = 1, wilted = false, popped = false, ended = false;

    /* THE BIOME, set by applyLevel (see THE LEVEL LAYER) before the round
       resets: which world, which of its six levels, and the pickups' clocks. */
    var BIO = CONFIG.biomes[0], biomeIdx = 0, levelK = 0;
    var magnetOn = false, idolOn = false, nextBonusP = 0, eruptT = 0;
    // THE EAGLE: the pass in flight (null between two) and the clock to the next
    var eagle = null, eagleT = 0;

    // --- cached per layout ---------------------------------------------------
    var anchorY = 0, pMin = 0, pMax = 0, sparks = [], wallGlow = { l: 0, r: 0 };

    function sy(y) { return anchorY - (y - camP); }
    /* The progress at the top of the frame: the camera every SCENERY layer
       scrolls off. Not camP alone — when the length changes, anchorY eases to
       its new line and every item moves with it through sy(); a ground keyed on
       camP alone would slide against them for the second that ease lasts. */
    function scrollP() { return camP + anchorY; }
    function ease(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }

    /* ====================================================================
       THE VIPER
       ==================================================================== */

    // The head's line on screen for a given body length (see THE SQUEEZE).
    function anchorFor(l) {
      var t = clamp((l - T.startLen) / (T.maxLen - T.startLen), 0, 1);
      var lo = Layout.bottom - T.anchorLow;          // startLen: down here
      var hi = Layout.top + T.anchorHigh;            // full length: up there
      return lo + (hi - lo) * Math.pow(t, 0.85);     // most of the climb early
    }
    function headRadius() { return T.headR + (lenF - T.startLen) * T.headGrow; }
    function blockRadius(i, n) {
      // near-uniform body, tapering over the last third into the tail
      var t = i / Math.max(1, n - 1);
      return headRadius() * (0.92 - 0.42 * Math.pow(Math.max(0, t - 0.62) / 0.38, 1.4));
    }
    function tierFor(l) {
      var t = 0, i;
      for (i = 0; i < TIERS.length; i++) if (l >= TIERS[i].at) t = i;
      return t;
    }

    /* The trail is the body's spine: world-space breadcrumbs, head first, kept
       just long enough to lay every block out. A sample is only committed once
       the head is `sample` px away from the LAST COMMITTED one (trail[1]) —
       comparing against trail[0] would compare the head with itself. */
    function pushTrail() {
      var i, dx, dy, run = 0, need = (len + 1) * T.block + 60;
      dx = trail.length > 1 ? headX - trail[1].x : 0;
      dy = trail.length > 1 ? camP - trail[1].y : 0;
      if (trail.length < 2 || dx * dx + dy * dy >= T.sample * T.sample) trail.unshift({ x: 0, y: 0 });
      trail[0].x = headX; trail[0].y = camP;
      for (i = 1; i < trail.length; i++) {
        dx = trail[i].x - trail[i - 1].x; dy = trail[i].y - trail[i - 1].y;
        run += Math.sqrt(dx * dx + dy * dy);
        if (run > need) { trail.length = i + 1; break; }
      }
      if (trail.length > 220) trail.length = 220;
    }

    /* Place the blocks along the spine, one walk of the trail for all of them:
       block k sits k * block px of ARC LENGTH behind the head, so the body
       keeps its shape whatever the head is doing. */
    function layoutBody() {
      var n = Math.max(T.startLen, Math.round(lenF)), i, k, acc = 0, need = T.block, seg, dx, dy, t;
      while (bodyPts.length < n) bodyPts.push({ x: 0, y: 0 });
      bodyPts.length = n;
      bodyPts[0].x = trail[0].x; bodyPts[0].y = trail[0].y;
      k = 1;
      for (i = 1; i < trail.length && k < n; i++) {
        dx = trail[i].x - trail[i - 1].x; dy = trail[i].y - trail[i - 1].y;
        seg = Math.sqrt(dx * dx + dy * dy);
        while (k < n && acc + seg >= need) {
          t = seg > 0 ? (need - acc) / seg : 0;
          bodyPts[k].x = trail[i - 1].x + dx * t;
          bodyPts[k].y = trail[i - 1].y + dy * t;
          k++; need += T.block;
        }
        acc += seg;
      }
      // The spine is still shorter than the body (the frame it just grew):
      // stack what is left straight down the burrow behind the last sample.
      for (; k < n; k++) {
        bodyPts[k].x = trail[trail.length - 1].x;
        bodyPts[k].y = trail[trail.length - 1].y - (need - acc);
        need += T.block;
      }
    }

    /* A wall is a rail, not a trap: the head is stopped, the steering is
       turned away and the arc is straightened, so the player always comes back
       into play. It costs nothing but the tempo of the weave. */
    function bounce(away) {
      dir = away; ang = 0;
      if (away > 0) wallGlow.l = 1; else wallGlow.r = 1;
      if (wallT > 0) return;                        // one thud per approach
      wallT = T.wallHold;
      Fx.shake(4, 0.12);
      Fx.burst(headX, anchorY, { color: ["#8dffbf", "#ffffff"], count: 7, speed: 230,
                                 life: 0.28, size: 4, angle: away > 0 ? 0 : Math.PI, spread: 1.6 });
      Sound.clip("wall", 0.15, 1.15);
    }

    /* ====================================================================
       THE BURROW — what comes down at the viper
       ==================================================================== */

    function diff()    { return Math.min(1, dist / T.diffFull); }
    function rowChance() { return T.rowMin + (T.rowMax - T.rowMin) * diff(); }
    function rowGap()    { return T.rowFar - (T.rowFar - T.rowNear) * diff(); }
    function gateGap()   {
      var d = clamp((diff() - T.wallFrom) / (1 - T.wallFrom), 0, 1);
      return T.gapWide - (T.gapWide - T.gapTight) * d;
    }

    function push(p, x, type) { items.push({ p: p, x: x, type: type, seed: Rand.range(0, TAU) }); }

    /* A run of orbs laid on a sine — the very curve a tapping player draws, so
       eating the whole run is a rhythm rather than a chase. */
    function spawnWave(p) {
      var lo = Layout.left + T.edge + 16, hi = Layout.right - T.edge - 16;
      // centred near the viper's lane, like the gates: an orb run the player
      // cannot physically reach is scenery, not a reward
      var cx = clamp(headX + Rand.range(-230, 230), lo + 70, hi - 70);
      var amp = Math.min(Rand.range(80, 190), Math.min(cx - lo, hi - cx));
      var n = Rand.int(3, 6), step = Rand.range(98, 132), ph = Rand.range(0, TAU), k = Rand.range(0.5, 0.95), i;
      for (i = 0; i < n; i++) push(p + i * step, cx + amp * Math.sin(ph + i * k), "orb");
      nextP = p + n * step + Rand.range(150, 280);
    }

    /* THORNS. Early on they are a scatter the player weaves between; past
       `wallFrom` they line the whole burrow with a single gate, which is the
       beat the run builds towards. The gate is always at least `gateGap` wide
       and often holds a pickup: threading it has to pay, or the player only
       ever learns what NOT to do. */
    function spawnRow(p) {
      var lo = Layout.left + T.edge, hi = Layout.right - T.edge;
      var half = gateGap() * 0.5, gx, x, n, i, prev;
      if (diff() < T.wallFrom) {
        n = Rand.chance(0.35) ? 2 : 1;
        prev = -1e9;
        for (i = 0; i < n; i++) {
          x = Rand.range(lo, hi);
          if (Math.abs(x - prev) < 240) x = prev + (x > prev ? 240 : -240);
          x = clamp(x, lo, hi);
          push(p + Rand.range(-16, 16), x, "thorn");
          prev = x;
        }
      } else {
        // The gate is aimed near the head's current lane: a wall the viper
        // physically cannot reach in time is not a challenge, it is a tax.
        gx = clamp(headX + Rand.range(-300, 300), lo + half, hi - half);
        for (x = lo; x <= hi + 1; x += T.thornStep) {
          if (Math.abs(x - gx) < half) continue;
          push(p + Rand.range(-14, 14), x, "thorn");
        }
        if (Rand.chance(T.gateReward)) push(p, gx, "orb");
      }
      lastRowP = p;
      nextP = p + rowGap() * Rand.range(0.9, 1.3);
    }

    function spawnMega(p) {
      push(p, Rand.range(Layout.left + T.edge + 40, Layout.right - T.edge - 40), "mega");
      nextP = p + Rand.range(260, 380);
    }

    function pushAt(p, x, type, extra) {
      var it = { p: p, x: x, type: type, seed: Rand.range(0, TAU) }, k;
      for (k in extra) if (extra.hasOwnProperty(k)) it[k] = extra[k];
      items.push(it);
      return it;
    }
    function pickWeighted(pool) {
      var k, tot = 0, r, last = null;
      for (k in pool) if (pool.hasOwnProperty(k)) tot += pool[k];
      r = Rand.range(0, tot);
      for (k in pool) if (pool.hasOwnProperty(k)) { last = k; r -= pool[k]; if (r <= 0) return k; }
      return last;
    }

    /* THE BIOME'S HAZARDS take the place of a thorn row, at the same spacing,
       so a biome never piles a new danger ON TOP of the old ones — it swaps
       some of them out. Each is placed so the viper can always get past it:
       logs are short, traps rise in alternate stripes, geysers and rocks are
       aimed near the head's lane but never fill it. The eagle is not one of
       them: it comes out of the sky on its own clock (THE EAGLE). */
    function spawnHazard(p) {
      var kind = pickWeighted(BIO.hazards), lo = Layout.left + T.edge, hi = Layout.right - T.edge;
      var x, i, n, ph, c, extra = 0;
      learn(kind);
      if (kind === "log") {
        n = levelK >= 3 && Rand.chance(0.45) ? 2 : 1;
        for (i = 0; i < n; i++) {
          x = Rand.range(lo + T.logLen * 0.5, hi - T.logLen * 0.5);
          pushAt(p + i * 190, x, "log", { vx: (Rand.chance(0.5) ? 1 : -1) * T.logSpeed * Rand.range(0.85, 1.15) });
        }
        extra = (n - 1) * 190;
      } else if (kind === "trap" || kind === "fire") {
        // one row, its traps in two stripes half a period apart: whenever one
        // stripe is up the other is down, so there is always a way through.
        // A fire trap is the same row on the fast clock.
        c = kind === "fire" ? T.firePeriod : T.trapPeriod;
        ph = Rand.range(0, c); i = 0;
        for (x = lo + 20; x <= hi - 19; x += T.trapStep) {
          pushAt(p, x, "trap", { ph: ph + (i % 2) * c * 0.5, fire: kind === "fire" });
          i++;
        }
      } else if (kind === "geyser") {
        n = Rand.chance(0.3 + 0.08 * levelK) ? 2 : 1;
        x = clamp(headX + Rand.range(-170, 170), lo + 50, hi - 50);
        for (i = 0; i < n; i++) {
          pushAt(p + i * 150, x, "geyser", { ph: Rand.range(0, T.geyserPeriod), cyc: -1 });
          x = clamp(x + (x < Layout.cx ? 1 : -1) * Rand.range(170, 280), lo + 50, hi - 50);
        }
        extra = (n - 1) * 150;
      } else if (kind === "bolt") {
        // where it lands is decided when it lights up, not here (THE LIGHTNING)
        n = levelK >= 3 && Rand.chance(0.4) ? 2 : 1;
        for (i = 0; i < n; i++) {
          pushAt(p + i * 230, Layout.cx, "bolt", { st: -1, hit: false, b: Rand.int(0, 2), im: Rand.int(0, 1), sc: Rand.int(0, 1) });
        }
        extra = (n - 1) * 230;
      } else {
        n = Rand.int(1, levelK >= 3 ? 3 : 2);
        for (i = 0; i < n; i++) {
          pushAt(p + i * 170, clamp(headX + Rand.range(-210, 210), lo + 40, hi - 40), "rock", { fallT: -1 });
        }
        extra = (n - 1) * 170;
      }
      lastRowP = p + extra;
      nextP = p + extra + rowGap() * Rand.range(0.9, 1.3);
    }

    /* THE BIOME'S PICKUP, about once every two screens of burrow. A biome's own
       pickup is the usual one; the ones the climb has already introduced come
       back now and then. Laid near the head's lane: a power-up out of reach is
       a tease, not a choice. */
    function spawnBonus(p) {
      var kind = BIO.bonus, older = [], i;
      for (i = 1; i < biomeIdx; i++) if (CONFIG.biomes[i].bonus) older.push(CONFIG.biomes[i].bonus);
      if (older.length && Rand.chance(0.35)) kind = Rand.pick(older);
      learn(kind);
      pushAt(p, clamp(headX + Rand.range(-220, 220), Layout.left + T.edge + 50, Layout.right - T.edge - 50), kind);
      nextBonusP = p + Rand.range(T.bonusFar, T.bonusNear);
      nextP = p + Rand.range(260, 380);
    }

    function spawnAhead(horizon) {
      var p, r;
      while (nextP < horizon) {
        p = nextP; r = Rand.range(0, 1);
        if (BIO.bonus && p >= nextBonusP) spawnBonus(p);
        else if (T.hazardShare > 0 && p - lastRowP > rowGap() && Rand.chance(T.hazardShare)) spawnHazard(p);
        else if (r < rowChance() && p - lastRowP > rowGap()) spawnRow(p);
        else if (r > 0.95) spawnMega(p);
        else spawnWave(p);
      }
    }

    /* The hazards' clocks. A trap and a geyser run on the round clock off their
       own phase; a rock falls once the head is close enough to SEE it land. */
    function trapPeriod(it) { return it.fire ? T.firePeriod : T.trapPeriod; }
    function trapPhase(it) { return ((runT + it.ph) % trapPeriod(it)) / trapPeriod(it); }
    function trapUp(it) { return trapPhase(it) < (it.fire ? T.fireUp : T.trapUp); }
    function geyserPhase(it) { return ((runT + it.ph) % T.geyserPeriod) / T.geyserPeriod; }
    var GEYSER_WARN = 0.46, GEYSER_BURST = 0.7;       // phase the warning / the burst start at
    function geyserBursting(it) { return geyserPhase(it) >= GEYSER_BURST; }
    function onScreen(y) { return y > -60 && y < view.h + 60; }

    function updateHazards(dt) {
      var lo = Layout.left + T.edge, hi = Layout.right - T.edge, half = T.logLen * 0.5;
      var i, it, y, c, dx, dp, k;
      for (i = 0; i < items.length; i++) {
        it = items[i];
        if (it.type === "log") {
          it.x += it.vx * dt;
          if (it.x < lo + half) { it.x = lo + half; it.vx = Math.abs(it.vx); }
          else if (it.x > hi - half) { it.x = hi - half; it.vx = -Math.abs(it.vx); }
        } else if (it.type === "rock") {
          if (it.fallT < 0) {
            if (it.p - camP < T.rockFall) it.fallT = 0;
          } else if (it.fallT < ROCK_DROP) {
            it.fallT += dt;
            if (it.fallT >= ROCK_DROP && onScreen(y = sy(it.p))) {
              Sound.clip("land", 0.55, Rand.range(0.9, 1.1));
              Fx.shake(4, 0.12);
              Fx.burst(it.x, y, { color: ["#5a4a44", "#ff7a2d", "#2b2220"], count: 12, speed: 240, life: 0.4, size: 5 });
            }
          }
        } else if (it.type === "bolt") {
          updateBolt(it, dt);
        } else if (it.type === "geyser") {
          c = Math.floor((runT + it.ph) / T.geyserPeriod);
          if (geyserBursting(it) && it.cyc !== c) {
            it.cyc = c;
            y = sy(it.p);
            if (onScreen(y)) {
              Fx.burst(it.x, y, { color: ["#ffd43b", "#ff7a1a", "#ff2d2d"], count: 16, speed: 330, life: 0.5, size: 6 });
              // one roar at a time: two geysers bursting together are one sound
              if (runT - eruptT > 0.35) { eruptT = runT; Sound.clip("erupt", 0.65, Rand.range(0.9, 1.1)); }
            }
          }
        } else if (magnetOn && (it.type === "orb" || it.type === "mega")) {
          // FIREFLIES: a gem near the head drifts into its mouth
          dx = headX - it.x; dp = camP - it.p;
          if (dx * dx + dp * dp < T.magnetR * T.magnetR) {
            k = Math.min(1, dt * 7);
            it.x += dx * k; it.p += dp * k;
          }
        }
      }
    }

    /* ====================================================================
       THE LIGHTNING — the temple's storm

       An item of the burrow like a rock, but it chooses where to land late:
       nothing is drawn until the head is `boltWarn` seconds of travel away
       from it, and only then does it light up — at the x the head is HEADING
       for, so going straight on is walking into it. Three beats:

         charge   a small glowing white ring closes to a dot on the zone,
                  shimmering faster as it tightens — the whole warning
         strike   the ring reaches the dot: one of the sheet's three bolts, swapped
                  every few hundredths so it crackles, a white flash over the
                  frame, and the head or any block still inside takes a bite
         after    an impact flares out and fades, and a scorch marks the
                  ground under it, harmless, gone within a second

       The bolt bites only on the frame it lands: before that it is warning,
       after it is a burn mark that fades away. */
    var BOLT_FLASH = 0.16;       // seconds the bolt itself is on screen
    var BOLT_RING = 44;          // the warning ring's radius when it lights up
    var BOLT_FLICK = 0.045;      // seconds between two of its pictures
    var BOLT_IMPACT = 0.5;       // seconds the impact takes to flare and fade
    var BOLT_SCORCH = 0.35;      // seconds the scorch holds once the bolt lands
    var BOLT_SCORCH_FADE = 0.4;  // seconds it then takes to fade out
    var BOLT_FOOT_X = 0.48, BOLT_FOOT_Y = 0.91;   // where a bolt cut hits the ground

    function updateBolt(it, dt) {
      var lo = Layout.left + T.edge, hi = Layout.right - T.edge, aim;
      if (it.st < 0) {
        if (it.p - camP > speed * T.boltWarn + T.boltLead) return;
        // where the head will be when the bolt lands, if it keeps its heading:
        // the zone is moved there, across AND along the burrow
        aim = clamp(headX + Math.sin(ang) * speed * T.boltWarn, lo, hi);
        it.x = clamp(aim + Rand.range(-T.boltAim, T.boltAim), lo + 30, hi - 30);
        it.p = camP + Math.cos(ang) * speed * T.boltWarn + T.boltLead;
        it.st = 0; it.w = T.boltWarn;
        return;
      }
      it.st += dt;
      if (!it.hit && it.st >= it.w) { it.hit = true; boltStrike(it); }
    }

    // During the death the world is held, but a bolt that has landed still
    // burns out: its impact is the hit that killed the viper.
    function tickBolts(dt) {
      var i;
      for (i = 0; i < items.length; i++) if (items[i].type === "bolt" && items[i].hit) items[i].st += dt;
    }

    function boltStrike(it) {
      var x = it.x, y = sy(it.p), r = T.boltR, n = bodyPts.length, i, br, dx, dy, hx = -1, hy = 0;
      Sound.clip("strike", 0.8, Rand.range(0.92, 1.08));
      Fx.flash("#e6edff", 0.6, 5);                       // gone in about a tenth of a second
      Fx.shake(8, 0.18);
      Fx.burst(x, y, { color: ["#ffffff", "#bcd0ff", "#6f7dff"], count: 20, speed: 420, life: 0.4, size: 5 });
      Fx.ring(x, y, { from: 16, to: r * 2.4, color: "#a9bcff", width: 7, life: 0.32 });
      if (invT > 0) return;                              // still blinking: it misses
      dx = headX - it.x; dy = camP - it.p; br = r + headRadius() * 0.72;
      if (dx * dx + dy * dy < br * br) { hx = headX; hy = anchorY; }
      else {
        for (i = 1; i < n; i++) {
          dx = bodyPts[i].x - it.x; dy = bodyPts[i].y - it.p; br = r + blockRadius(i, n) * 0.8;
          if (dx * dx + dy * dy < br * br) { hx = bodyPts[i].x; hy = sy(bodyPts[i].y); break; }
        }
      }
      if (hx < 0) return;
      Fx.burst(hx, hy, { color: ["#ffffff", "#9fb4ff"], count: 14, speed: 360, life: 0.45, size: 5 });
      bite();
    }

    /* Does the head touch this item right now? A hazard only bites in the
       state it is drawn dangerous in; a log is a capsule, not a disc. */
    function touches(it) {
      var hr = headRadius() * 0.72, dx = headX - it.x, dy = camP - it.p, r, ex;
      if (it.type === "log") {
        ex = dx - clamp(dx, -T.logLen * 0.5, T.logLen * 0.5);
        r = hr + T.logR;
        return ex * ex + dy * dy <= r * r;
      }
      if (it.type === "bolt") return false;              // it strikes on its own clock
      if (it.type === "trap" && !trapUp(it)) return false;
      if (it.type === "geyser" && !geyserBursting(it)) return false;
      if (it.type === "rock" && it.fallT < ROCK_DROP) return false;
      // a geyser bites as wide as its burst is drawn (T.geyserR scales both)
      r = hr + (it.type === "geyser" ? T.geyserR * 1.05 : ITEM_HIT[it.type]);
      return dx * dx + dy * dy <= r * r;
    }

    function resolveItems() {
      var i, it;
      for (i = items.length - 1; i >= 0; i--) {
        it = items[i];
        // gone only once it has left the frame: pMin is the bottom edge plus
        // the margin render() culls at, wherever the head is anchored
        if (it.p < pMin) { items.splice(i, 1); continue; }
        if (it.p > camP + 220) continue;                  // still far ahead
        if (touches(it)) { items.splice(i, 1); collect(it); }
      }
    }

    /* ====================================================================
       THE EAGLE — the lair's sky

       Not an item of the burrow: it does not scroll with the world, it flies
       over the SCREEN, and always over one half of it. A pass has four beats:

         shadow  its shadow glides from the bottom edge to the top, slowly,
                 over the half it has picked — the warning, and the whole of it
         wait    a breath of empty sky
         start   the bird itself at the top of that half, wings flared
         dive    the stoop, top to bottom, fast — and whatever part of the
                 viper is still under it, head or body, takes a bite

       So the answer is the one the game already teaches: swerve to the other
       half while the shadow is crossing, and take the body with you. The half
       is usually the one the head is in when the shadow appears: an eagle
       hunts, and a pass over an empty half would teach nothing. */
    var EAGLE_K = 1024 / 1536;              // the art's height over its width

    function eagleW() { return Layout.w * 0.5; }
    function eagleX(side) { return Layout.cx + side * Layout.w * 0.25; }
    // where the bird hangs before it stoops, and where the stoop ends
    function eagleTop() { return Layout.top + eagleW() * EAGLE_K * 0.42; }
    function eagleDiveY(t) {
      var y0 = eagleTop(), y1 = view.h + eagleW() * EAGLE_K;
      return y0 + (y1 - y0) * t * (0.35 + 0.65 * t);   // it gathers speed
    }

    function updateEagle(dt) {
      var e = eagle, side, yPrev;
      if (!e) {
        eagleT -= dt;
        if (eagleT > 0) return;
        side = Rand.chance(0.75) ? (headX < Layout.cx ? -1 : 1) : (Rand.chance(0.5) ? -1 : 1);
        eagle = { side: side, ph: "shadow", t: 0, y: eagleTop(), hit: false };
        learn("eagle");
        Sound.clip("dive", 1);                 // the wind of the shadow sweeping in
        return;
      }
      e.t += dt;
      if (e.ph === "shadow" && e.t >= T.eagleShadow) { e.ph = "wait"; e.t = 0; }
      else if (e.ph === "wait" && e.t >= T.eagleWait) {
        e.ph = "start"; e.t = 0;
        Sound.clip("diveAttack", 0.5, 1.08);                  // the cry before the stoop
      } else if (e.ph === "start" && e.t >= T.eagleStart) {
        e.ph = "dive"; e.t = 0; e.y = eagleTop();
        Fx.shake(5, 0.14);
      } else if (e.ph === "dive") {
        yPrev = e.y;
        e.y = eagleDiveY(Math.min(1, e.t / T.eagleDive));
        if (!e.hit && eagleStrikes(e, yPrev)) e.hit = true;
        if (e.t >= T.eagleDive) { eagle = null; eagleT = T.eagleGap * Rand.range(0.85, 1.2); }
      }
    }

    /* The stoop's footprint is an ellipse around the bird's body — the wings'
       tips are feathers, not talons — swept from where it was last frame to
       where it is now, so a fast dive on a slow frame cannot step over the
       viper. The head and every block of the body are tested: a tail left in
       the eagle's half is caught as surely as the head. */
    function eagleStrikes(e, yPrev) {
      var w = eagleW(), cx = eagleX(e.side), rx = w * 0.3, ry = w * EAGLE_K * 0.36;
      var n = bodyPts.length, i, x, y, r;
      if (invT > 0) return false;                      // still blinking: it misses
      function hitAt(px, py, pr) {
        var dx = Math.abs(px - cx) / (rx + pr), dy;
        if (dx >= 1) return false;
        // vertical distance to the swept segment, measured in the ellipse's units
        dy = py < yPrev ? yPrev - py : py > e.y ? py - e.y : 0;
        dy /= ry + pr;
        return dx * dx + dy * dy < 1;
      }
      if (hitAt(headX, anchorY, headRadius() * 0.72)) { x = headX; y = anchorY; }
      else {
        for (i = 1; i < n; i++) {
          r = blockRadius(i, n) * 0.8;
          if (hitAt(bodyPts[i].x, sy(bodyPts[i].y), r)) { x = bodyPts[i].x; y = sy(bodyPts[i].y); break; }
        }
        if (i >= n) return false;
      }
      // the talons land where they land, then the bite does the rest
      Fx.burst(x, y, { color: ["#6b4122", "#e8c27a", "#f4f0e6"], count: 18, speed: 380, life: 0.5, size: 6 });
      bite();
      return true;
    }

    /* ====================================================================
       EATING, GROWING, GETTING BITTEN
       ==================================================================== */

    function grow(n) {
      var before = len;
      len = Math.min(T.maxLen, len + n);
      // bestLen is also the pace reference (see CONFIG.play.lenSpeed): it only
      // ever climbs, so tearing blocks off never slows the burrow down
      if (len > bestLen) bestLen = len;
      HUD.setLeft(len, "Length");
      checkTier();
      /* The armour is paid for by the LAST BLOCK OF THE CLIMB, not by standing at
         the top: it is granted on the transition into maxLen and never again
         while the body stays there. Otherwise a viper that loses its plates at
         full length buys them back with a single gem — the run's one real cost
         undone for 12 points. Once the plates are gone at full length they are
         gone: the next thorn takes a life and the body, and the whole ladder has
         to be eaten again. */
      if (before < T.maxLen && len >= T.maxLen) armour();
      return len - before;                              // 0 when already maxed
    }

    /* ARMOUR. Earned ONLY by a full-length body — there is no pickup for it — and
       it eats exactly one bite. It has to land like an event: it is the only
       thing standing between the player and losing half their viper and a life. */
    function armour() {
      shield = true;
      showLives();
      // No callout: the glyph appearing in the lives pill, the green vignette and
      // the ring already say it, and a sticker here lands mid-climb where the
      // player is reading the burrow.
      Overlay.vignette(rgba("#8dffbf", 0.85), 1, 520);
      Fx.ring(headX, anchorY, { from: 22, to: 190, color: "#d8fff0", width: 7, life: 0.45 });
      Fx.burst(headX, anchorY, { color: ["#d8fff0", "#8dffbf"], count: 18, speed: 380, life: 0.5, size: 5 });
      HUD.punch("#8dffbf");
      Sound.clip("power", 0.45, );
      learn("armour");
    }

    /* Right HUD slot: the lives left, with the armour glyph in front of them
       while the plates hold. Mechanically the armour IS a spare life, so the two
       survival resources belong in one pill — and the pill turns green the moment
       eating has paid for one. */
    function showLives() {
      var s = "", i;
      for (i = 0; i < T.lives; i++) s += i < lives ? "◆" : "·";
      HUD.setRight((shield ? "◈ " : "") + s, "Lives",
                   shield ? "on" : (lives <= 1 ? "warn" : ""));
    }

    function checkTier() {
      var t = tierFor(len), T2;
      if (t <= tier) { tier = t; return; }
      tier = t; T2 = TIERS[tier];
      Pop.show("bonus", { word: T2.name, sub: "Evolved", at: popSpot() });
      Overlay.vignette(rgba(T2.halo, 0.9), 1, 620);
      Fx.flash(T2.halo, 0.22);
      Fx.ring(headX, anchorY, { from: 24, to: 210, color: T2.halo, width: 8, life: 0.5 });
      Fx.burst(headX, anchorY, { color: [T2.halo, "#ffffff"], count: 24, speed: 420, life: 0.55, size: 6 });
      HUD.punch(T2.halo);
      Sound.clip("grow", 0.85);
    }

    function collect(it) {
      var x = headX, y = anchorY, T2 = TIERS[tier], g, added;

      if (it.type === "orb" || it.type === "mega") {
        chain++;
        if (chain > bestChain) bestChain = chain;
        orbs++;
        added = grow(it.type === "mega" ? 2 : 1);
        g = it.type === "mega" ? 140 : 12 + Math.min(chain, 12) * 4;
        if (added === 0) g += 60;                       // full length: pay instead
        if (idolOn) g *= 2;                          // the idol's blessing
        pick += g;
        HUD.punch(it.type === "mega" ? "#ffd43b" : T2.halo);
        // the burst wears the gem's colour, not the body's: it is the food
        // that just went off
        Fx.burst(x, y, { color: it.type === "mega" ? ["#ffd43b", "#ffffff"] : ["#4bf0ff", "#ffffff"],
                         count: it.type === "mega" ? 22 : 12,
                         speed: it.type === "mega" ? 430 : 290, life: 0.42, size: 5 });

        // Pickup callouts fire AT THE GEM, not on a far anchor: they are small,
        // they last a moment and they mark the thing the player just hit, so on
        // the impact point they read as feedback rather than as an interruption.
        if (it.type === "mega") {
          Fx.ring(x, y, { from: 18, to: 150, color: "#ffd43b", width: 6, life: 0.4 });
          Pop.show("score", { word: "Gold egg", sub: "+" + g, at: { x: x, y: y }, cls: "pop-egg" });
          Sound.clip("mega", 0.8);
        } else {
          // Orbs arrive faster than a callout can be read: one pop per quarter
          // second, and the burst plus the HUD punch carry the ones between.
          if (runT - lastPop > 0.24) {
            lastPop = runT;
            Pop.show("score", { word: "+" + g, at: { x: x, y: y }, cls: POP_TIER[tier] });
          }
          Sound.clip("orb", 0.6, 1 + Math.min(chain, 14) * 0.045);
        }

        /* THE CHAIN IS ONLY SHOUTED EVERY 25. The bonus is still paid every five
           — that is the reward curve — but a sticker every five gems is constant
           noise in a run that is one long chain. Twenty-five is rare enough that
           `ultra` shaking the frame still means something. */
        if (chain > 0 && chain % 5 === 0) {
          g = 40 * (chain / 5) * (idolOn ? 2 : 1);
          pick += g;
          if (chain % 25 === 0) {
            Pop.show("ultra", { word: Lang.t("Chain x") + chain, sub: "+" + g, at: popSpot() });
          }
          Sound.clip("chain", 0.4, 1 + Math.min(chain, 24) * 0.008);
        }

      } else if (PICKUP[it.type]) {
        power(it.type);
      } else {
        bite();
      }
    }

    /* LEARN — a mechanic met for the first time is NAMED, once per player
       ever (Notify.learn, packages/shell/shell.js), and its line in the "!"
       log opens its page of the guide (below), which is where the rule is
       explained. Called where the thing first turns up — a hazard or a
       pickup when it is laid ahead of the head, the eagle when its shadow
       comes in, the plates when they are earned, a bite when it costs the
       body — so the notice lands a moment before the player meets it, never
       in the middle of a round's opening. The id is the page's id, and every
       word is a literal at its call so the copy desk reads it.
       Only what the frame cannot say is named: a warning to decode (the
       tips, the ring, the embers, the shadows) and the plates' hidden rule.
       A log or a flame reads at a glance, a pickup's own callout already
       says what it does, and a bite shows what it cost. */
    function learn(id) {
      switch (id) {
        case "trap": Notify.learn("trap", "Spike traps", { sub: "Watch out for spikes" }); break;
        case "bolt": Notify.learn("bolt", "Lightning", { sub: "Watch out for lightning" }); break;
        case "geyser": Notify.learn("geyser", "Geysers", { sub: "Watch out for flames" }); break;
        case "rock": Notify.learn("rock", "Falling rocks", { sub: "A shadow marks a falling rock" }); break;
        case "eagle": Notify.learn("eagle", "The eagle", { sub: "The eagle's shadow shows the side it will strike" }); break;
        case "armour": Notify.learn("armour", "Armor", { sub: "The armor takes the next hit" }); break;
      }
    }

    /* THE BIOMES' PICKUPS. Each is a MOMENT on the head (a callout, a sound, a
       burst) and an aura on the body while it holds (see drawAura). The
       callout's sub already says what it does, so no second line follows. */
    function power(kind) {
      var x = headX, y = anchorY;
      if (kind === "fly") {
        magnetOn = true;
        Pop.show("bonus", { word: "Fireflies", sub: "Magnet", at: { x: x, y: y } });
        Fx.burst(x, y, { color: ["#f6ff9e", "#e9ff6e", "#ffffff"], count: 18, speed: 300, life: 0.5, size: 4 });
        Sound.clip("magnet", 0.7);
      } else if (kind === "idol") {
        idolOn = true;
        Pop.show("bonus", { word: "Idol", sub: "Double points", at: { x: x, y: y }, cls: "pop-egg" });
        Fx.burst(x, y, { color: ["#ffd43b", "#fff3b0", "#ffffff"], count: 20, speed: 340, life: 0.5, size: 5 });
        Sound.clip("idol", 0.75);
      } else if (kind === "amber") {
        Pop.show("bonus", { word: "Amber", sub: "Full length", at: { x: x, y: y } });
        Fx.ring(x, y, { from: 20, to: 220, color: "#ffb703", width: 6, life: 0.6 });
        // one block short of full: the last one, and the plates it pays for,
        // stay an egg's to earn (see grow)
        if (len < T.maxLen - 1) grow(T.maxLen - 1 - len);
        else { pick += 200; HUD.punch("#ffb703"); }
      } else if (kind === "rainbow") {
        Pop.show("bonus", { word: "Rainbow egg", sub: "Shield", at: { x: x, y: y } });
        Sound.clip("rainbow", 0.7);
        if (!shield) armour();
        else { pick += 200; HUD.punch("#ffffff"); }
      }
    }

    /* A BITE COSTS THE WHOLE BODY *AND* A LIFE.
       Plated, the armour takes it and neither is touched — the hit still costs
       the player the armour they spent the whole run eating for.
       Bare, the viper is stripped back to `minLen`: the score already banked is
       kept, but the length, the tier colour, the armour and the head's line on
       screen all go back to the start, and the player has to eat the entire
       ladder again to be plated once more. The pace does NOT go back (see
       CONFIG.play.lenSpeed) — the burrow keeps coming at the speed the run has
       reached, so rebuilding is the real punishment.
       On the third bite the run is over. */
    function bite() {
      var x = headX, y = anchorY, lost, tail, step;
      if (invT > 0) return;                              // still blinking
      chain = 0; bites++;
      // the fireflies and the idol hold until a hit, plated or not
      if (magnetOn) Pop.show("alert", { word: "Magnet lost" });
      if (idolOn) Pop.show("alert", { word: "Bonus lost" });
      magnetOn = false; idolOn = false;
      Fx.burst(x, y, { color: ["#ff2d55", "#ffd43b", "#ffffff"], count: 26, speed: 470, life: 0.55, size: 6 });
      Fx.ring(x, y, { from: 18, to: 190, color: "#ff2d55", width: 8, life: 0.42 });

      if (shield) {
        shield = false; invT = T.invTime * 0.7;
        showLives();
        Fx.shake(9, 0.24); Fx.flash("#8dffbf", 0.3);
        // The glyph leaving the lives pill, the green flash and the softened hit
        // sound carry it; a callout would stop a run that did NOT lose anything.
        Sound.clip("bite", 0.5, 1.45);                   // the same hit, shrugged off
        return;
      }

      lives--;
      showLives();

      /* THE LAST BITE IS NOT A BITE, IT IS A DEATH. It never strips the body:
         the cinematic tears it off block by block on camera instead, and a viper
         cut back to a stump first would have nothing left to lose. Everything the
         end screen reports is already banked, so the run can afford two seconds
         of theatre before it. */
      if (lives <= 0) {
        Fx.shake(26, 0.55); Fx.freeze(0.14);
        startDeath();
        return;
      }

      // the whole body blows off, and it blows off along its whole length: one
      // burst at the tail would undersell what the player just lost
      step = Math.max(1, Math.floor(bodyPts.length / 4));
      for (tail = bodyPts.length - 1; tail >= 1; tail -= step) {
        Fx.burst(bodyPts[tail].x, sy(bodyPts[tail].y),
                 { color: ["#ff2d55", TIERS[tier].halo, "#ffffff"],
                   count: 12, speed: 380, life: 0.6, size: 5 });
      }

      lost = len - T.minLen;                             // everything but the stump
      len = T.minLen;
      tier = tierFor(len);
      HUD.setLeft(len, "Length");
      Fx.flash("#ff2d55", 0.5);
      Overlay.vignette("rgba(255,45,85,.9)", 1, 660);

      Fx.shake(19, 0.45); Fx.freeze(0.07);
      Sound.clip("bite", 0.95);
      invT = T.invTime;
      /* Only the LAST life is shouted. Losing the body is already the loudest
         thing on screen — the flash, the shake, the freeze and the whole viper
         blowing apart — so a sticker on top of it says nothing new. What the
         player cannot read off the frame is that the next thorn ends the run,
         and that is worth stopping them for. */
      if (lives === 1) {
        Pop.show("danger", { word: "Last life", sub: lost > 0 ? Lang.t("Body lost") : Lang.t("Bitten!"),
                             cls: "pop-bite", at: popSpot() });
      }
    }

    /* ====================================================================
       INPUT — one tap, one swerve
       ==================================================================== */
    function onDown() {
      if (dieT >= 0) return;                  // the death cinematic owns the frame
      // A mashed screen is still one swerve per tap: two flips inside a frame
      // would cancel each other out and read as a dead touch.
      if (tapT > 0) return;
      tapT = T.tapLock;
      dir = -dir;
      tongueT = 0.26;
      Fx.burst(headX, anchorY, { color: [TIERS[tier].halo, "#ffffff"], count: 6, speed: 210,
                                 life: 0.26, size: 4, angle: dir > 0 ? Math.PI : 0, spread: 1.5 });
      if (dir > 0) Sound.clip("turn", 0.05, 1.07);
      else Sound.clip("turn", 0.05, 0.93);
    }

    /* ====================================================================
       FRAME
       ==================================================================== */
    function reset() {
      var i;
      best = Store.get("bestScore", 0);
      metrics();

      /* THE BED: the biome's stretch of the track. Asking for the section
         already playing does nothing, so a replay never restarts it. Without a
         level (the playable, the endless run) the bed is the whole of what the
         build ships — the playable embeds only the jungle's stretch. */
      Music.play(CONFIG.level ? BIO.music : null);

      camP = 0; runT = 0; speed = T.speedMin;
      headX = Layout.cx; ang = 0; dir = Rand.chance(0.5) ? 1 : -1; wallT = 0; tapT = 0;
      len = T.startLen; lenF = len; tier = 0;
      score = 0; pick = 0; orbs = 0; chain = 0; bestChain = 0; bestLen = len; bites = 0;
      lives = T.lives; shield = false; invT = 0; tongueT = 0;
      dist = 0; nextMile = T.mileStep;
      items = []; bodyPts = []; nextP = 700; lastRowP = 0; lastPop = -1; lastSpot = -1;
      wallGlow.l = 0; wallGlow.r = 0;
      dieT = -1; crumbled = 0; wilted = false; popped = false; ended = false;
      magnetOn = false; idolOn = false; eruptT = 0;
      nextBonusP = 1400 + Rand.range(0, 900);
      // the first pass leaves the player a few seconds to read the burrow
      eagle = null; eagleT = Math.max(3, T.eagleGap * Rand.range(0.6, 0.9));

      // Pre-lay the spine straight down the burrow so the body exists, at its
      // full length, on the very first frame.
      trail = [];
      for (i = 0; i < 90; i++) trail.push({ x: headX, y: camP - i * T.sample });

      anchorY = anchorFor(len);
      layoutBody();
      HUD.setScoreNow(0);
      HUD.setLeft(len, "Length");
      showLives();
      Fx.reset();
    }

    function update(dt) {
      var lo = Layout.left + T.edge, hi = Layout.right - T.edge;

      // the viper is dying: the cinematic owns the frame until the end screen
      if (dieT >= 0) { updateDeath(dt); tickBolts(dt); return; }

      runT += dt;
      // bestLen, not len: a bite must never hand the player a slower burrow
      speed = Math.min(T.speedCap,
        T.speedMin + (T.speedMax - T.speedMin) * Math.min(1, runT / T.ramp) + (bestLen - T.startLen) * T.lenSpeed);

      // steer: the arc always bends toward `dir`, a tap only flips the side
      ang = clamp(ang + dir * T.turn * dt, -T.maxAngle, T.maxAngle);
      headX += Math.sin(ang) * speed * dt;
      camP  += Math.cos(ang) * speed * dt;
      if (headX < lo)      { headX = lo; bounce(1); }
      else if (headX > hi) { headX = hi; bounce(-1); }

      if (wallT > 0) wallT -= dt;
      if (tapT > 0) tapT -= dt;
      if (invT > 0) invT -= dt;
      if (tongueT > 0) tongueT -= dt;
      wallGlow.l = Math.max(0, wallGlow.l - dt * 2.6);
      wallGlow.r = Math.max(0, wallGlow.r - dt * 2.6);

      // the body follows the head, and the head line follows the body length
      pushTrail();
      lenF += (len - lenF) * Math.min(1, dt * 6);
      anchorY += (anchorFor(lenF) - anchorY) * Math.min(1, dt * T.anchorEase);
      layoutBody();

      // the visible progress window
      pMin = camP - (view.h - anchorY) - 200;
      pMax = camP + anchorY + 200;

      spawnAhead(camP + T.ahead);
      updateHazards(dt);
      if (dieT >= 0) return;                    // a bolt dealt the last bite
      resolveItems();
      if (dieT >= 0) return;                    // that last item was fatal
      if (BIO.eagle) {
        updateEagle(dt);
        if (dieT >= 0) return;                  // ...or the eagle was
      }

      dist = camP / T.pxPerM;
      score = pick + Math.floor(dist);
      HUD.setScore(score);

      if (dist >= nextMile) {
        nextMile += T.mileStep;
        // the burrow's milestone: a glow and a chime, no word — the round's
        // callouts already carry the run, and a notice every 250 m is chatter
        Overlay.vignette(rgba(TIERS[tier].halo, 0.7), 1, 420);
        Sound.clip("chain", 0.3, 0.82);
      }
    }

    /* ====================================================================
       THE DEATH — two seconds of cinematic between the last bite and the end
       screen.

       A playable's whole story is its last five seconds, and cutting from a
       thorn straight to a stats panel throws that away: the player is told they
       lost without ever being shown it. So the fatal bite freezes the burrow and
       hands the frame to the viper.

       The beat, on `dieT` (seconds since the bite) read as a fraction of
       CONFIG.play.deathTime:

         0.00  IMPACT     hit-stop, red flash, the burrow's speed bleeds off in a
                          fifth of a second and the camera starts pushing in
         0.12  TEARING    the body blows off ONE BLOCK AT A TIME, tail first, one
                          every `deathCrumb` — the length the player spent the
                          whole run building, unbuilt in front of them
         0.30  LIMP       the head shudders, its eyes cross, its tongue lolls out
                          and it rolls over and sinks
         0.80  POP        what is left of it bursts, and the wisps rise
         1.00             endRound() — the end screen takes the frame

       Nothing in here touches the score: everything the end screen reports was
       banked at the moment of the bite.
       ==================================================================== */
    var D_CRUMB = 0.12, D_LIMP = 0.3, D_POP = 0.8;

    function startDeath() {
      dieT = 0; crumbled = 0; popped = false; ended = false;
      deathSide = ang >= 0 ? 1 : -1;                     // it rolls over the way it leant
      Music.duck(0.3, 0.5);                              // the bed steps back for the beat
      Fx.flash("#ff2d55", 0.62);
      Fx.ring(headX, anchorY, { from: 20, to: 340, color: "#ff2d55", width: 10, life: 0.6 });
      Overlay.vignette("rgba(255,45,85,.95)", 1, 900);
      // No callout here: the next two seconds ARE the callout. A sticker would
      // sit on top of the one thing the cinematic exists to show — the body
      // coming apart block by block.
      Sound.clip("death", 1, 0.92);
    }

    // The cinematic's own clock, 0 -> 1. Every curve below is a function of it.
    function deathT() { return clamp(dieT / T.deathTime, 0, 1); }
    // How far into going limp the head is, 0 -> 1 across the LIMP..POP window.
    function limpT() { return ease(clamp((deathT() - D_LIMP) / (D_POP - D_LIMP), 0, 1)); }
    // Where the head is drawn while it dies: it sinks as it gives up.
    function deathHeadY() { return anchorY + 54 * limpT(); }

    /* One block torn off the body. Fired from update(), so it reads bodyPts
       directly rather than the pose the renderer caches. */
    function crumbBlock(i) {
      var x = bodyPts[i].x, y = sy(bodyPts[i].y);
      Fx.burst(x, y, { color: ["#ff2d55", TIERS[tier].halo, "#ffffff"],
                       count: 10, speed: 320, life: 0.6, size: 5, grav: 240 });
      // the tearing walks DOWN in pitch as it eats the body toward the head
      if (crumbled % 2 === 0) Sound.clip("wall", 0.1, Math.max(0.6, 1.35 - crumbled * 0.055));
    }

    /* The frame while the viper dies. The world is not simulated any more — no
       spawning, no collisions, no trail: the burrow is a held frame that the
       camera coasts to a stop in, and the only thing still moving is the viper
       coming apart. */
    function updateDeath(dt) {
      var n = bodyPts.length, i;
      dieT += dt;

      // the burrow grinds to a halt, keeping just enough drift to read as a
      // world rather than a paused screenshot
      speed *= Math.pow(0.015, dt);
      camP += speed * dt;

      while (crumbled < n - 1 && deathT() > D_CRUMB + crumbled * (T.deathCrumb / T.deathTime)) {
        i = n - 1 - crumbled;
        crumbBlock(i);
        crumbled++;
      }

      // the head goes limp: one soft descending voice under the whole wilt
      if (!wilted && deathT() >= D_LIMP) {
        wilted = true;
      }

      if (!popped && deathT() >= D_POP) {
        popped = true;
        Fx.shake(16, 0.4);
        Fx.flash("#ffd9e2", 0.32);
        Fx.ring(headX, deathHeadY(), { from: 18, to: 300, color: "#ff9ec4", width: 9, life: 0.55 });
        Fx.burst(headX, deathHeadY(), { color: ["#ff2d55", "#ffffff", TIERS[tier].halo],
                                        count: 26, speed: 430, life: 0.6, size: 6 });
        // negative gravity: the wisps RISE out of the burrow, the one thing left
        // on screen while the frame goes dark
        Fx.burst(headX, deathHeadY(), { color: ["#8dffbf", "#d8fff0"],
                                        count: 16, speed: 70, life: 1.2, size: 5, grav: -150 });
        Sound.clip("bite", 0.6, 0.6);                    // the same hit, pitched into the floor
      }

      // ...and the end screen takes over. dieT is left running so the last frame
      // stays dark and empty behind it.
      if (!ended && dieT >= T.deathTime) { ended = true; die(); }
    }

    /* The darkening. A radial wash centred on the viper, so the burrow closes in
       on it rather than the whole frame dimming evenly. Only ever built while the
       game is dying, which is why the per-frame gradient is affordable. */
    function drawDeathVeil() {
      var t = ease(clamp(deathT() / 0.7, 0, 1)), hy = deathHeadY(), g;
      g = ctx.createRadialGradient(headX, hy, 30, headX, hy, view.h * 0.74);
      g.addColorStop(0, rgba("#5a0114", 0.2 * t));
      g.addColorStop(0.42, rgba("#2c000e", 0.56 * t));
      g.addColorStop(1, rgba("#0a0005", 0.9 * t));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, view.w, view.h);
    }

    function die() {
      var d = Math.floor(dist), sc = pick + d;
      var st = sc >= 1800 ? 3 : sc >= 800 ? 2 : 1;
      endRound({
        title: st === 3 ? Lang.t("Apex viper!") : st === 2 ? Lang.t("Great run!") : CONFIG.copy.gameOver,
        variant: st === 3 ? "perfect" : st === 2 ? "win" : "",
        score: sc,
        /* A level's objective is a DISTANCE, so the burrow says how far it got
           rather than letting gems inflate the measure. The playable ignores
           the field entirely; only the web target's level layer reads it, and
           the flat thresholds above are what it replaces. */
        levelScore: d,
        stars: st,
        rows: [
          { label: "Snake length", value: bestLen + Lang.t(" blocks"), grade: "accent" },
          { label: "Distance (m)", value: d },
          { label: "Best chain", value: bestChain, grade: "accent" },
          { label: "Best score", value: Math.max(sc, best), grade: "gold" }
        ]
      });
    }

    /* ====================================================================
       RENDER
       ==================================================================== */

    function metrics() {
      var sig = view.w + "x" + view.h + ":" + Layout.left + ":" + Layout.right + ":" + BIO.key;
      anchorY = anchorFor(len);
      buildSparks();
      /* metrics() runs on every reset(), and the scenery is ~10 MB of offscreen
         canvases that depend on the viewport and not on the round: rebuilding it
         per run froze the opening frames and left the collector a mountain of
         dead canvases. Once per layout is the correct cadence — and since
         fitCanvas() calls us during init(), the cost is paid behind the loading
         screen rather than on the player's first frame. */
      if (sig !== jungleSig) { jungleSig = sig; buildJungle(); }
      buildSkin();
    }

    /* Background: far spores for depth, near streaks for speed. Both scroll
       off scrollP() with their own parallax and wrap on the frame height. */
    function buildSparks() {
      var i, spore;
      sparks = [];
      for (i = 0; i < 72; i++) {
        spore = i < 50;
        sparks.push({
          x: Rand.range(0, view.w),
          y: Rand.range(0, view.h + 80),
          w: spore ? Rand.range(2, 3.6) : 2,
          h: spore ? Rand.range(2, 3.6) : Rand.range(40, 120),
          par: spore ? Rand.range(0.14, 0.4) : Rand.range(0.85, 1.3),
          a: spore ? Rand.range(0.18, 0.5) : Rand.range(0.05, 0.12)
        });
      }
    }

    function drawSparks() {
      var span = view.h + 80, i, s, y;
      ctx.fillStyle = "#b9ffdb";
      for (i = 0; i < sparks.length; i++) {
        s = sparks[i];
        y = (s.y + scrollP() * s.par) % span;               // the world scrolls DOWN
        if (y < 0) y += span;
        ctx.globalAlpha = s.a;
        ctx.fillRect(s.x, y - 40, s.w, s.h);
      }
      ctx.globalAlpha = 1;
    }

    /* ====================================================================
       THE JUNGLE — scenery, and nothing but scenery

       The burrow was an empty green tube: correct to read, but the screen had
       nothing in it. This layer fills it with overgrowth WITHOUT touching the
       simulation — no entry here is spawned, collided, scored or read by
       update(). It is drawn, and that is all.

       The one rule that keeps it honest is spatial. Items live strictly inside
       [Layout.left + edge, Layout.right - edge] (see spawnRow / spawnWave), so
       the two margins outside the wall rails are guaranteed free of gameplay —
       that is where the dense planting goes, inside a clip that stops AT the
       rail. A leaf physically cannot cover a gem or a thorn.

       Four depths, back to front:
         FAR     big canopy silhouettes across the whole width, ~0.2 parallax and
                 a tenth of an alpha — depth, not detail.
         CORNERS a static overgrown frame, pre-rendered once into one full-screen
                 sprite and blitted in a single drawImage. Behind the items, so
                 it can crowd the corners without ever hiding one.
         FLIES   pollen glints drifting on their own sine.
         BANK    the undergrowth pressed against both rails, clipped to the
                 margins, plus the leaves tumbling down them.

       Everything is a pre-rendered sprite: the per-frame cost is one drawImage
       per instance, with no path, no gradient and no shadowBlur in the loop.
       The world is seen FROM ABOVE, so every clump is anchored at its root and
       spun to a random heading — foliage fanning out on the ground, never a
       side-on plant standing up in a top-down burrow.
       ==================================================================== */

    // Leaf palettes: top of the blade, its shaded base, and the vein ink.
    var JUNGLE = {
      deep:  { top: "#1e7a52", bot: "#052a1c", vein: "rgba(180,255,214,.20)" },
      mid:   { top: "#33a066", bot: "#0a3a26", vein: "rgba(190,255,220,.24)" },
      olive: { top: "#8ab93f", bot: "#1c4a16", vein: "rgba(226,255,170,.22)" },
      /* Two dark palettes, and the difference between them is the whole trick:
         a silhouette only reads against what is BEHIND it, and the burrow floor
         is bright at the centre (#0f3d2c) and nearly black at the corners.
         `shade` crosses the lit middle, so it is darker than the floor and lands
         as shadow. `dark` frames the black corners, so it is lighter than the
         floor and lands as a leaf. Swap them and the screen either goes flat
         green or the corners swallow their own frame. */
      shade: { top: "#06231a", bot: "#010b07", vein: "rgba(120,220,175,.05)" },
      dark:  { top: "#093020", bot: "#020e09", vein: "rgba(120,220,175,.07)" }
    };

    function canvasOf(w, h) {
      var cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(w));
      cv.height = Math.max(1, Math.round(h));
      return cv;
    }
    /* Every sprite is authored root-down: the anchor is the bottom centre and
       the crown grows toward -y, so one rotation about the anchor aims the whole
       clump. */
    function rooted(cv) { return { cv: cv, px: cv.width * 0.5, py: cv.height, r: Math.max(cv.width, cv.height) }; }

    /* One leaf in the current frame: base at the origin, tip at -y. */
    function leafPath(c, w, h) {
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-w, -h * 0.24, -w * 0.72, -h * 0.78, 0, -h);
      c.bezierCurveTo(w * 0.72, -h * 0.78, w, -h * 0.24, 0, 0);
      c.closePath();
    }
    function paintLeaf(c, w, h, pal) {
      var g = c.createLinearGradient(0, 0, 0, -h);
      g.addColorStop(0, pal.bot);
      g.addColorStop(1, pal.top);
      leafPath(c, w, h);
      c.fillStyle = g; c.fill();
      c.strokeStyle = pal.vein; c.lineWidth = Math.max(1, h * 0.025);
      c.beginPath(); c.moveTo(0, -h * 0.05); c.lineTo(0, -h * 0.88); c.stroke();
    }

    // A fern frond: one arching rachis, paired leaflets closing up toward the tip.
    function spriteFrond(len, pal) {
      var w = len * 0.95, h = len * 1.02, cv = canvasOf(w, h), c = cv.getContext("2d");
      var n = 12, i, t, x, y, ll, a, bend = len * 0.22;
      c.translate(w * 0.5 - bend * 0.5, h);
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(bend * 0.25, -len * 0.55, bend, -len * 0.98);
      c.strokeStyle = pal.bot; c.lineWidth = Math.max(2, len * 0.022); c.lineCap = "round";
      c.stroke();
      for (i = 0; i < n; i++) {
        t = 0.07 + (i / (n - 1)) * 0.88;
        x = bend * t * t; y = -len * t;
        ll = len * 0.30 * (1 - Math.pow(t, 1.7)) + len * 0.035;
        a = 0.88 - t * 0.5;                       // leaflets sweep forward near the tip
        c.save(); c.translate(x, y); c.rotate(-a); paintLeaf(c, ll * 0.26, ll, pal); c.restore();
        c.save(); c.translate(x, y); c.rotate(a);  paintLeaf(c, ll * 0.26, ll, pal); c.restore();
      }
      return rooted(cv);
    }

    // A broad split leaf. The notches are cut with destination-out rather than
    // drawn, which is what makes them read as gaps in the blade.
    function spriteBigLeaf(len, pal) {
      var w = len * 1.15, h = len * 1.12, cv = canvasOf(w, h), c = cv.getContext("2d");
      var hw = len * 0.46, bl = len * 0.86, i, t, sd;
      c.translate(w * 0.5, h * 0.99);
      c.strokeStyle = pal.bot; c.lineWidth = Math.max(2, len * 0.03); c.lineCap = "round";
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -len * 0.15); c.stroke();
      c.translate(0, -len * 0.14);
      paintLeaf(c, hw, bl, pal);
      c.strokeStyle = pal.vein; c.lineWidth = Math.max(1, len * 0.014);
      for (i = 0; i < 4; i++) {
        sd = i % 2 ? 1 : -1;
        t = i < 2 ? 0.3 : 0.55;
        c.beginPath();
        c.moveTo(0, -bl * t);
        c.quadraticCurveTo(sd * hw * 0.5, -bl * (t + 0.1), sd * hw * 0.84, -bl * (t + 0.16));
        c.stroke();
      }
      c.globalCompositeOperation = "destination-out";
      c.fillStyle = "#000";
      for (i = 0; i < 6; i++) {
        sd = i % 2 ? 1 : -1;
        t = 0.26 + Math.floor(i / 2) * 0.23;
        c.beginPath();
        c.moveTo(0, -bl * t);
        c.lineTo(sd * hw * 1.4, -bl * (t - 0.035));
        c.lineTo(sd * hw * 1.4, -bl * (t + 0.085));
        c.closePath(); c.fill();
      }
      c.globalCompositeOperation = "source-over";
      return rooted(cv);
    }

    // A tuft of blades. Seen from above it is a star, not a row — the blades
    // fan through a full half-turn on each side of the root.
    function spriteTuft(len, pal) {
      var w = len * 2.0, h = len * 1.15, cv = canvasOf(w, h), c = cv.getContext("2d");
      var n = 15, i, t, bl, tipx, tipy, g, a;
      c.translate(w * 0.5, h * 0.96);
      for (i = 0; i < n; i++) {
        t = i / (n - 1);
        a = -1.35 + t * 2.7;                       // heading of the blade
        bl = len * (0.55 + 0.45 * Math.cos(a * 0.75)) * (i % 3 ? 1 : 0.72);
        tipx = Math.sin(a) * bl; tipy = -Math.cos(a) * bl;
        g = c.createLinearGradient(0, 0, tipx, tipy);
        g.addColorStop(0, pal.bot); g.addColorStop(1, pal.top);
        c.beginPath();
        c.moveTo(-len * 0.035, 0);
        c.quadraticCurveTo(tipx * 0.45, tipy * 0.7, tipx, tipy);
        c.quadraticCurveTo(tipx * 0.45 + len * 0.03, tipy * 0.68, len * 0.035, 0);
        c.closePath();
        c.fillStyle = g; c.fill();
      }
      return rooted(cv);
    }

    // A low bush: a rosette of leaves, the outer ones shorter.
    function spriteBush(len, pal) {
      var w = len * 1.9, h = len * 1.1, cv = canvasOf(w, h), c = cv.getContext("2d");
      var n = 16, i, a, ll;
      c.translate(w * 0.5, h * 0.96);
      for (i = 0; i < n; i++) {
        a = -1.42 + (i / (n - 1)) * 2.84;
        ll = len * (0.52 + 0.44 * Math.cos(a * 0.8)) * (i % 2 ? 0.82 : 1);
        c.save();
        c.translate(Math.sin(a) * len * 0.1, 0);
        c.rotate(a);
        paintLeaf(c, ll * 0.3, ll, pal);
        c.restore();
      }
      return rooted(cv);
    }

    // A creeper lying flat: a wandering stem with leaves alternating along it.
    function spriteCreeper(len, pal) {
      var w = len * 0.55, h = len * 1.02, cv = canvasOf(w, h), c = cv.getContext("2d");
      var n = 9, i, t, x, y, ll, sd, sw = len * 0.2;
      c.translate(w * 0.5, h);
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(sw, -len * 0.5, 0, -len);
      c.strokeStyle = pal.bot; c.lineWidth = Math.max(2, len * 0.018); c.lineCap = "round";
      c.stroke();
      for (i = 0; i < n; i++) {
        t = 0.1 + (i / (n - 1)) * 0.85;
        x = sw * 2 * t * (1 - t);                  // the stem's own x at t
        y = -len * t;
        ll = len * 0.15 * (0.75 + 0.25 * Math.sin(i * 2.1));
        sd = i % 2 ? 1 : -1;
        c.save(); c.translate(x, y); c.rotate(sd * 1.25); paintLeaf(c, ll * 0.34, ll, pal); c.restore();
      }
      return rooted(cv);
    }

    // A bloom. Violet on purpose: cyan is the gem, gold is the mega and red is
    // the thorn — the scenery is not allowed to borrow a gameplay colour.
    function spriteFlower(len, col, core) {
      var w = len * 1.7, h = len * 2.2, cv = canvasOf(w, h), c = cv.getContext("2d");
      var i;
      c.translate(w * 0.5, h * 0.98);
      c.strokeStyle = "#1e5a3c"; c.lineWidth = Math.max(2, len * 0.09); c.lineCap = "round";
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.14, -len * 0.6, 0, -len * 1.15); c.stroke();
      c.translate(0, -len * 1.15);
      c.fillStyle = col;
      for (i = 0; i < 5; i++) {
        c.save(); c.rotate((i / 5) * TAU);
        c.beginPath();
        if (c.ellipse) c.ellipse(0, -len * 0.34, len * 0.2, len * 0.34, 0, 0, TAU);
        else c.arc(0, -len * 0.3, len * 0.26, 0, TAU);
        c.fill();
        c.restore();
      }
      c.beginPath(); c.arc(0, 0, len * 0.16, 0, TAU);
      c.fillStyle = core; c.fill();
      return rooted(cv);
    }

    // A stone at the bank — the only thing here that is not a plant, and the
    // thing that keeps the margins from reading as one continuous hedge.
    function spriteRock(len) {
      var w = len * 1.3, h = len * 0.95, cv = canvasOf(w, h), c = cv.getContext("2d");
      var g;
      c.translate(w * 0.5, h * 0.98);
      g = c.createLinearGradient(0, -h, 0, 0);
      g.addColorStop(0, "#2c463a"); g.addColorStop(1, "#08150f");
      c.beginPath();
      c.moveTo(-len * 0.58, 0);
      c.quadraticCurveTo(-len * 0.54, -len * 0.58, -len * 0.12, -len * 0.72);
      c.quadraticCurveTo(len * 0.32, -len * 0.8, len * 0.5, -len * 0.36);
      c.quadraticCurveTo(len * 0.62, -len * 0.08, len * 0.58, 0);
      c.closePath();
      c.fillStyle = g; c.fill();
      c.strokeStyle = "rgba(150,220,190,.09)"; c.lineWidth = 2; c.stroke();
      return rooted(cv);
    }

    // The pollen glint, pre-rendered once: a per-frame radial gradient times a
    // dozen motes is exactly the cost this layer must not have.
    function spriteMote(r, col) {
      var d = Math.ceil(r * 2), cv = canvasOf(d, d), c = cv.getContext("2d"), g;
      g = c.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, rgba(col, 0.95));
      g.addColorStop(0.35, rgba(col, 0.32));
      g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g; c.fillRect(0, 0, d, d);
      return { cv: cv, px: r, py: r, r: r };
    }

    /* --- the planting ---------------------------------------------------- */

    var bankKit = [], farKit = [], leafKit = [], moteSprite = null;
    var flies = [], drift = [], bgCv = null, farCv = null, bankCv = [];
    var BANK_SPAN = 0, FAR_SPAN = 0, FLY_SPAN = 0, DRIFT_SPAN = 0;
    var FAR_PAR = 0.22;          // the far canopy is ONE depth plane, see buildFar()
    /* Over a painted ground the canopy is the leaves overhead and the shade
       they cast, so it moves almost WITH the ground — a far slower plane reads
       as the floor slipping — and a touch faster, because it is nearer the eye
       than the floor: that small difference is the depth, and it is why the
       shade is its own layer. Baked into the ground at the ground's speed it
       was tried, and the effect was gone. It is a faint layer, a darker patch
       more than a shape, scaled per biome by `shade`. */
    var SHADE_PAR    = 1.08;     // the canopy's speed over a painted ground, the ground's being 1
    var SHADE_ALPHA  = 0.45;     // the canopy's opacity over a painted ground
    // The shadowed edge of the burrow: `LIP` px of it outside the rail, `LIPIN`
    // inside. The outer half is baked into the bank strips, the inner half into
    // the backdrop, so it costs nothing per frame.
    var LIP = 58, LIPIN = 46;

    /* THE PAINTED GROUND — assets/image/master/vipera-ground-<biome>.png, a floor
       painted to repeat vertically, injected as CONFIG.art.ground<Biome>. It
       replaces the drawn floor and scrolls WITH the world, so the burrow moves
       under the viper; the canopy's silhouettes still slide over it at their
       own parallax, where they now read as the shadows of the trees above. A
       veil darkens it to the burrow's night, harder on the flanks the bright
       foliage fills, so a green viper never sinks into a green bank. A build
       without the picture keeps the drawn floor. */
    var GROUND_SEAM  = 0.06;     // share of the picture cross-faded over its own top
    var GROUND_SHADE = 0.3;      // the night veil over the whole floor...
    var GROUND_EDGE  = 0.38;     // ...plus this much more toward each flank
    /* THE BANKS' PAINTED PROPS — the cuts of vipera-object-bank-<biome>.png,
       adopted as CONFIG.art.bank<Biome>NN. They take the place of the drawn
       undergrowth in the two margins outside the rails. Both the ground and
       the props are the biome's (see CONFIG.biomes). */
    var BANK_COUNT = 20;
    function biomeKey() { return BIO.key.charAt(0).toUpperCase() + BIO.key.slice(1); }
    var groundCv = null, GROUND_SPAN = 0, dressed = false;

    /* WHAT THIS LAYER IS ALLOWED TO COST -----------------------------------
       Scenery is the last thing on screen that may take frame time, so none of
       it is drawn as loose instances. Every static picture is baked once into a
       canvas and replayed as a straight axis-aligned blit:

         ground     the painted floor with its veil and lip baked in, ONE
                    opaque scrolling strip.
         backdrop   without the painted floor: the gradient + the inner lip, in
                    ONE OPAQUE blit — no gradient fill, no alpha blend.
         far        the canopy's shade, one scrolling strip at its own speed,
                    ~1.6 alpha blits a frame.
         banks      two strips 82 px wide, ~1.4 blits each.

       Loose instances (~15 rotated, alpha-blended, 250 px sprites plus a clip
       and two gradient fills every frame) cost several screens of overdraw on
       the background alone. Only what genuinely animates — the pollen and the
       tumbling leaves — is still drawn one sprite at a time.

       The other half of the bill is WHEN this is built: these canvases are ~10 MB
       together, they depend on the viewport and not on the round, and rebuilding
       them inside reset() froze the first frames of every run and left a GC spike
       behind. `jungleSig` builds them once per layout instead. */
    var jungleSig = "";

    // Sprites are authored in design px and never change with the viewport, so
    // they are rasterized once for the life of the creative; only the placement
    // below is redone when the layout moves.
    function buildKits() {
      if (bankKit.length) return;
      var J = JUNGLE;
      bankKit = [
        spriteFrond(190, J.mid), spriteFrond(150, J.deep), spriteFrond(230, J.deep),
        spriteBigLeaf(140, J.mid), spriteBigLeaf(175, J.deep),
        spriteTuft(120, J.olive), spriteTuft(150, J.mid), spriteTuft(96, J.olive),
        spriteBush(115, J.deep), spriteBush(140, J.mid),
        spriteCreeper(200, J.deep), spriteCreeper(160, J.mid),
        spriteRock(78), spriteRock(112),
        spriteFlower(46, "#b98cff", "#ffe27a"), spriteFlower(38, "#8f7bff", "#ffd97a")
      ];
      farKit = [
        spriteFrond(330, J.shade), spriteBigLeaf(280, J.shade),
        spriteBush(240, J.shade), spriteCreeper(360, J.shade), spriteFrond(430, J.shade)
      ];
      leafKit = [
        spriteBigLeaf(34, J.olive), spriteBigLeaf(26, J.mid), spriteFrond(40, J.deep)
      ];
      moteSprite = spriteMote(13, "#a8ff8e");
    }

    /* The backdrop of a build with no painted ground: the drawn burrow floor
       and the inner half of the lip, flattened into ONE opaque full-frame
       sprite. Over a painted ground there is no backdrop at all — the veil and
       the lip are baked into the ground strip (bakeVeil) — and there is no
       corner frame on either: the fronds over the four corners were taken out
       for the frame rate. */
    function buildBackdrop() {
      var x0 = Layout.left + T.edge, x1 = Layout.right - T.edge, c, g;
      bgCv = freeCanvas(bgCv);
      if (groundCv) return;
      bgCv = canvasOf(view.w, view.h);
      c = bgCv.getContext("2d");
      g = c.createRadialGradient(view.w * 0.5, view.h * 0.26, 40, view.w * 0.5, view.h * 0.4, view.h * 0.98);
      g.addColorStop(0, "#0f3d2c");
      g.addColorStop(0.55, "#07231a");
      g.addColorStop(1, "#020c08");
      c.fillStyle = g;
      c.fillRect(0, 0, view.w, view.h);
      lipInner(c, x0, x1, view.h);
    }

    /* The two banks, one baked strip each, only as wide as the margin the
       burrow never uses. The strip IS the clip: nothing can be painted past its
       edge, so the safety argument survives the optimization intact.

       They scroll at exactly the world's rate — which is also more correct than
       the near-1 spread they had as instances: the bank is the burrow's own
       edge, at the same depth as the items sliding past it. */
    function buildBanks() {
      var x0 = Layout.left + T.edge, x1 = Layout.right - T.edge;
      var side, bw, cv, c, g, i, k, s, sc, x, y, rot, fl, a, img, art = bankArt();
      BANK_SPAN = Math.round(view.h * 2.6);
      for (i = 0; i < bankCv.length; i++) freeCanvas(bankCv[i]);
      bankCv = [];
      for (side = 0; side < 2; side++) {
        bw = Math.round(side ? view.w - x1 : x0);
        cv = canvasOf(bw, BANK_SPAN);
        c = cv.getContext("2d");
        // Strip space: the RAIL is at bw on the left strip and at 0 on the right
        // one, so plants root near the screen edge in both.
        /* The painted props, when the build has them: one of the cuts, 96 to
           150 design px across, turned any way (it is seen from above), rooted
           in the outer half of the margin so it bleeds off the screen edge. */
        for (i = 0; art.length && i < 16; i++) {
          img = art[Rand.int(0, art.length - 1)];
          sc = Rand.range(96, 150) / Math.max(img.naturalWidth, img.naturalHeight);
          x = side ? bw - Rand.range(-10, 50) : Rand.range(-10, 50);
          y = Rand.range(0, BANK_SPAN);
          rot = Rand.range(0, TAU);
          fl = Rand.chance(0.5) ? -1 : 1;
          for (k = -1; k <= 1; k++) {
            c.save();
            c.translate(x, y + k * BANK_SPAN);
            c.rotate(rot);
            c.scale(sc * fl, sc);
            c.drawImage(img, -img.naturalWidth * 0.5, -img.naturalHeight * 0.5);
            c.restore();
          }
        }
        // ...under the same night as the ground they stand on, or they would
        // be the brightest thing on screen and pull the eye off the burrow
        if (art.length) {
          c.globalCompositeOperation = "source-atop";
          c.fillStyle = "rgba(3,16,11," + (GROUND_SHADE + GROUND_EDGE * 0.5) + ")";
          c.fillRect(0, 0, bw, BANK_SPAN);
          c.globalCompositeOperation = "source-over";
        }
        for (i = 0; !art.length && i < 22; i++) {
          s = bankKit[Rand.int(0, bankKit.length - 1)];
          sc = Rand.range(0.75, 1.25);
          x = side ? bw - Rand.range(-6, 62) : Rand.range(-6, 62);
          y = Rand.range(0, BANK_SPAN);
          rot = Rand.range(0, TAU);
          fl = Rand.chance(0.5) ? -1 : 1;
          a = Rand.range(0.5, 0.95);
          for (k = -1; k <= 1; k++) {        // tile the strip against itself
            c.save();
            c.globalAlpha = a;
            c.translate(x, y + k * BANK_SPAN);
            c.rotate(rot);
            c.scale(sc * fl, sc);
            c.drawImage(s.cv, -s.px, -s.py);
            c.restore();
          }
        }
        // The lip's outer half: the undergrowth sinks into shadow before the
        // strip ends, so the cut lands where there is nothing left to cut.
        g = side ? c.createLinearGradient(LIP, 0, 0, 0)
                 : c.createLinearGradient(bw - LIP, 0, bw, 0);
        g.addColorStop(0, "rgba(2,11,8,0)");
        g.addColorStop(1, "rgba(2,11,8," + lipShade() + ")");
        c.fillStyle = g;
        c.fillRect(side ? 0 : bw - LIP, 0, LIP, BANK_SPAN);
        bankCv.push(cv);
      }
    }

    /* The far canopy, baked into one seamless strip.

       Loose instances would be the obvious way, and it is the wrong one here:
       these are the biggest sprites in the game, they are alpha-blended and
       rotated, and eight of them across the frame cost about four screens of
       overdraw every frame — on the background, before anything the player
       actually looks at has been drawn. Baked, the same picture costs two
       straight blits (the second is what covers the wrap seam) clipped to the
       frame, so it lands at roughly one screen.

       The price is that the whole layer shares one parallax, which is no loss:
       it is one plane of canopy, not a depth field. Each instance is painted
       three times, at y and at y ± FAR_SPAN, so the strip tiles against itself. */
    function buildFar() {
      FAR_SPAN = Math.round(view.h * 1.7);
      freeCanvas(farCv);
      farCv = canvasOf(view.w, FAR_SPAN);
      paintCanopy(farCv.getContext("2d"), FAR_SPAN);
    }
    function paintCanopy(c, span) {
      var i, k, s, sc, x, y, rot, fl, a;
      for (i = 0; i < 15; i++) {
        s = farKit[Rand.int(0, farKit.length - 1)];
        sc = Rand.range(1, 1.6);
        x = Rand.range(-40, view.w + 40);
        y = Rand.range(0, span);
        rot = Rand.range(0, TAU);
        fl = Rand.chance(0.5) ? -1 : 1;
        a = Rand.range(0.35, 0.65);          // the SAME for all three copies, or
        for (k = -1; k <= 1; k++) {          // the strip does not tile against itself
          c.save();
          c.globalAlpha = a;
          c.translate(x, y + k * span);
          c.rotate(rot);
          c.scale(sc * fl, sc);
          c.drawImage(s.cv, -s.px, -s.py);
          c.restore();
        }
      }
    }

    /* Two blits cover every wrap position, but only one of them is on screen
       most of the time — the strip is longer than the frame. Skipping the other
       is the difference between 2 and ~1.6 full-frame blends a frame. It is
       the one blended full-frame layer left over a painted ground, and the
       only one that moves against it. */
    function drawFar() {
      var off, a = groundCv ? SHADE_ALPHA * BIO.shade : 1;
      if (a <= 0) return;
      off = (scrollP() * (groundCv ? SHADE_PAR : FAR_PAR)) % FAR_SPAN;
      if (off < 0) off += FAR_SPAN;
      ctx.globalAlpha = a;
      if (off > 0) ctx.drawImage(farCv, 0, off - FAR_SPAN);
      if (off < view.h) ctx.drawImage(farCv, 0, off);
      ctx.globalAlpha = 1;
    }

    function groundArt() { return artImage("ground" + biomeKey()); }
    // The rail's shadow: near black against the drawn floor, which is near
    // black itself; over a painted ground that would cut a black stripe down
    // each side, so it is only a dusk there.
    function lipShade() { return groundCv ? 0.55 : 0.94; }
    function bankArt() {
      var out = [], i, img;
      for (i = 1; i <= BANK_COUNT; i++) {
        img = artImage("bank" + biomeKey() + (i < 10 ? "0" : "") + i);
        if (img) out.push(img);
      }
      return out;
    }

    /* The ground, baked into one strip that tiles against itself. A painted
       repeat is never quite seamless, so its last rows are cross-faded over its
       first: the strip's last row is followed by the picture's next one, and
       the fade carries the bottom into the top over GROUND_SEAM of the height. */
    function buildGround() {
      var img = groundArt(), w = view.w, h, f, span, c, band, b, g;
      groundCv = freeCanvas(groundCv);
      if (!img) return;
      h = Math.round(img.naturalHeight * w / img.naturalWidth);
      f = Math.round(h * GROUND_SEAM);
      span = h - f;
      groundCv = canvasOf(w, span);
      c = groundCv.getContext("2d");
      c.drawImage(img, 0, 0, w, h);
      band = canvasOf(w, f);
      b = band.getContext("2d");
      b.drawImage(img, 0, -span, w, h);
      b.globalCompositeOperation = "destination-in";
      g = b.createLinearGradient(0, 0, 0, f);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      b.fillStyle = g; b.fillRect(0, 0, w, f);
      c.drawImage(band, 0, 0);
      freeCanvas(band);
      GROUND_SPAN = span;
      bakeVeil(c, w, span);
    }

    /* Everything that lay over the painted ground as its own full-frame layer
       is baked INTO the ground strip, so a frame pays one opaque blit for the
       floor instead of three blended ones (the bench put the veil and the
       canopy at two thirds of the frame on a phone-sized backing store). It
       is baked because none of it moves against the floor: the night veil is
       uniform, the flanks and the lip vary with x alone. The canopy's shade
       does move against it, so it stays its own layer (drawFar). */
    function bakeVeil(c, w, span) {
      var x0 = Layout.left + T.edge, x1 = Layout.right - T.edge, g;
      c.fillStyle = "rgba(3,16,11," + GROUND_SHADE + ")";
      c.fillRect(0, 0, w, span);
      g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(3,16,11," + GROUND_EDGE + ")");
      g.addColorStop(0.3, "rgba(3,16,11,0)");
      g.addColorStop(0.7, "rgba(3,16,11,0)");
      g.addColorStop(1, "rgba(3,16,11," + GROUND_EDGE + ")");
      c.fillStyle = g;
      c.fillRect(0, 0, w, span);
      lipInner(c, x0, x1, span);
    }

    // The lip's inner half: the burrow floor darkening as it runs up to the
    // rail. Its outer half lives in the bank strips, which are drawn later.
    function lipInner(c, x0, x1, h) {
      var g = c.createLinearGradient(x0, 0, x0 + LIPIN, 0);
      g.addColorStop(0, "rgba(2,11,8," + lipShade() + ")");
      g.addColorStop(1, "rgba(2,11,8,0)");
      c.fillStyle = g; c.fillRect(x0, 0, LIPIN, h);
      g = c.createLinearGradient(x1, 0, x1 - LIPIN, 0);
      g.addColorStop(0, "rgba(2,11,8," + lipShade() + ")");
      g.addColorStop(1, "rgba(2,11,8,0)");
      c.fillStyle = g; c.fillRect(x1 - LIPIN, 0, LIPIN, h);
    }

    function drawGround() {
      var off = (scrollP() % GROUND_SPAN + GROUND_SPAN) % GROUND_SPAN, y;
      for (y = off - GROUND_SPAN; y < view.h; y += GROUND_SPAN) ctx.drawImage(groundCv, 0, y);
    }

    /* The painted art decodes on its own clock, and the scenery is built once
       per layout: whichever lands second rebuilds what the pictures change. */
    function dressJungle() {
      if (dressed || !groundArt()) return;
      dressed = true;
      buildGround(); buildBackdrop(); buildBanks(); logArt(); warmArt();
    }

    /* A picture is decoded the first time it is DRAWN, on the main thread, so
       the first lava burst, bolt or eagle of a run used to pay its decode in
       the middle of a frame. The hazards' frames are drawn once into a pixel
       here, with the scenery, so that cost is paid behind the round. */
    var warmCv = null, warmed = {};
    function warmArt() {
      var k, c;
      if (typeof ArtImages === "undefined") return;
      warmCv = warmCv || canvasOf(1, 1);
      c = warmCv.getContext("2d");
      for (k in ArtImages) {
        if (!ArtImages.hasOwnProperty(k) || warmed[k] || !/^(lava|trap|lightning|eagle|tree)/.test(k)) continue;
        if (!artImage(k)) continue;
        c.drawImage(ArtImages[k], 0, 0, 1, 1);
        warmed[k] = true;
      }
    }

    function buildJungle() {
      var i;
      dressed = !!groundArt();
      buildKits();
      if (moteSprite) freeCanvas(moteSprite.cv);
      moteSprite = spriteMote(13, BIO.mote);              // the air of the biome
      buildGround();
      buildBackdrop();
      buildFar();
      buildBanks();
      logArt();
      warmArt();

      // FLIES — pollen on its own sine, so the burrow is never perfectly still.
      FLY_SPAN = Math.round(view.h + 160);
      flies = [];
      for (i = 0; i < 14; i++) {
        flies.push({ x: Rand.range(0, view.w), y: Rand.range(0, FLY_SPAN),
                     par: Rand.range(0.25, 0.6), sc: Rand.range(0.5, 1.15),
                     ph: Rand.range(0, TAU), sw: Rand.range(12, 38), sp: Rand.range(0.5, 1.4) });
      }

      // DRIFT — leaves tumbling down the banks, clipped with them.
      DRIFT_SPAN = Math.round(view.h + 220);
      drift = [];
      for (i = 0; BIO.drift && i < 10; i++) {
        drift.push({ s: leafKit[Rand.int(0, leafKit.length - 1)],
                     x: Rand.chance(0.5) ? Rand.range(-10, 96) : view.w - Rand.range(-10, 96),
                     y: Rand.range(0, DRIFT_SPAN), par: Rand.range(1.05, 1.25),
                     fall: Rand.range(20, 55), spin: Rand.range(-1.5, 1.5),
                     ph: Rand.range(0, TAU), sw: Rand.range(8, 26), sp: Rand.range(0.6, 1.5),
                     a: Rand.range(0.35, 0.7), sc: Rand.range(0.8, 1.4) });
      }
    }

    function drawFlies() {
      var i, f, y, x, m = moteSprite, k;
      for (i = 0; i < flies.length; i++) {
        f = flies[i];
        y = (f.y + scrollP() * f.par) % FLY_SPAN;
        if (y < 0) y += FLY_SPAN;
        y -= 80;
        if (y < -30 || y > view.h + 30) continue;
        x = f.x + Math.sin(runT * f.sp + f.ph) * f.sw;
        k = m.r * f.sc * 2;
        ctx.globalAlpha = 0.22 + 0.4 * (0.5 + 0.5 * Math.sin(runT * 2.2 + f.ph * 1.7));
        ctx.drawImage(m.cv, x - k * 0.5, y - k * 0.5, k, k);
      }
      ctx.globalAlpha = 1;
    }

    function drawDrift() {
      var i, d, y, x, s;
      for (i = 0; i < drift.length; i++) {
        d = drift[i];
        y = (d.y + scrollP() * d.par + runT * d.fall) % DRIFT_SPAN;
        if (y < 0) y += DRIFT_SPAN;
        y -= 110;
        if (y < -60 || y > view.h + 60) continue;
        s = d.s;
        x = d.x + Math.sin(runT * d.sp + d.ph) * d.sw;
        ctx.save();
        ctx.globalAlpha = d.a;
        ctx.translate(x, y);
        ctx.rotate(d.ph + runT * d.spin);
        ctx.scale(d.sc, d.sc);
        ctx.drawImage(s.cv, -s.px, -s.py * 0.5);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    /* The undergrowth: the two baked strips, then the leaves that actually move.
       The strips cannot spill into the burrow — they are only as wide as the
       margin — so the only thing still needing a clip is the drift, and it gets
       one rect per side rather than a live layer's worth of work. */
    function drawBanks() {
      var x0 = Layout.left + T.edge, x1 = Layout.right - T.edge;
      var off = scrollP() % BANK_SPAN;
      if (off < 0) off += BANK_SPAN;
      if (off > 0) {
        ctx.drawImage(bankCv[0], 0, off - BANK_SPAN);
        ctx.drawImage(bankCv[1], x1, off - BANK_SPAN);
      }
      if (off < view.h) {
        ctx.drawImage(bankCv[0], 0, off);
        ctx.drawImage(bankCv[1], x1, off);
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, x0, view.h);
      ctx.rect(x1, 0, view.w - x1, view.h);
      ctx.clip();
      drawDrift();
      ctx.restore();
    }

    /* The burrow walls. Almost subliminal at rest, they flare on the side the
       head just brushed — a rail the player can see is never a surprise. */
    function drawWalls() {
      var x0 = Layout.left + T.edge, x1 = Layout.right - T.edge;
      var y0 = Layout.top - 40, y1 = view.h;
      var breathe = 0.06 + 0.02 * Math.sin(runT * 2), i, x, g;
      for (i = 0; i < 2; i++) {
        x = i ? x1 : x0; g = i ? wallGlow.r : wallGlow.l;
        if (g > 0) {
          ctx.strokeStyle = rgba("#4dff9b", 0.28 * g); ctx.lineWidth = 16;
          ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
        }
        ctx.strokeStyle = rgba("#8dffbf", breathe + 0.6 * g); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
      }
    }

    /* A soft glow behind an item. A radial gradient, not stacked flat discs: a
       hard-edged disc over the dark burrow reads as a plate rather than light.
       Only a handful of items are ever on screen, so building the gradient per
       draw is cheaper than caching one sprite per colour. */
    function halo(x, y, r, col) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(col, 0.5));
      g.addColorStop(0.42, rgba(col, 0.16));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    function spiked(x, y, n, ro, ri, fill, ink, rot) {
      var i, a, r;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.beginPath();
      for (i = 0; i < n * 2; i++) {
        a = (i / (n * 2)) * TAU;
        r = i % 2 ? ri : ro;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = Math.max(3.5, ro * 0.13); ctx.strokeStyle = ink; ctx.stroke();
      ctx.restore();
    }
    /* A gem. The gradient is built INSIDE the rotated frame, so the shading
       spins with the stone (a free glint) instead of being dragged out of the
       shape by the transform. */
    function gem(x, y, r, rot, top, mid, bot, ink) {
      var g;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      g = ctx.createLinearGradient(0, -r, 0, r);
      g.addColorStop(0, top);
      if (mid) g.addColorStop(0.5, mid);
      g.addColorStop(1, bot);
      ctx.beginPath();
      ctx.moveTo(0, -r); ctx.lineTo(r * 0.72, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.72, 0);
      ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = Math.max(3.5, r * 0.2); ctx.strokeStyle = ink; ctx.stroke();
      ctx.restore();
    }

    function drawItem(it, x, y) {
      var pu;
      /* Food is an EGG out of vipera-object-item.png (`item01`, `item02`),
         never a bead: the viper is itself a chain of green spheres, and an
         edible sphere would read as a piece of the body. The cyan against an
         all-green burrow is the same call. An egg rocks rather than spins —
         upside down it stops reading as an egg. The drawn gem is the fallback
         of a build with no artwork. */
      if (it.type === "orb") {
        pu = 1 + Math.sin(runT * 4 + it.seed) * 0.06;
        halo(x, y, 40 * pu, "#4bf0ff");
        drawArt("item01", x, y, ITEM_R.orb * pu * 2.5, Math.sin(runT * 2.4 + it.seed) * 0.16) ||
          gem(x, y, ITEM_R.orb * pu, runT * 1.5 + it.seed, "#ffffff", null, "#12b8d8", "rgba(2,20,26,.8)");

      } else if (it.type === "mega") {
        pu = 1 + Math.sin(runT * 5 + it.seed) * 0.08;
        halo(x, y, 58 * pu, "#ffd43b");
        drawArt("item02", x, y, ITEM_R.mega * pu * 2.5, Math.sin(runT * 2 + it.seed) * 0.16) ||
          gem(x, y, ITEM_R.mega * pu, -runT * 1.2 + it.seed, "#fffbe8", "#ffd43b", "#ff9f1c", "#2b1a00");

      } else if (it.type !== "thorn") {
        drawBiomeItem(it, x, y);

      } else {                                            // thorn
        // the hazard has to be the loudest thing in the burrow: it is the only
        // item the player MUST read in time
        pu = 1 + Math.sin(runT * 7 + it.seed) * 0.09;
        halo(x, y, 62 * pu, "#ff2d55");
        // one of the four thorn balls of vipera-object-peak.png (art
        // `peak01`..`peak04`), picked by the item's seed and turning slowly;
        // the drawn star is the fallback of a build with no artwork
        if (!drawArt("peak0" + (1 + Math.floor(it.seed / TAU * 4) % 4), x, y,
                     ITEM_R.thorn * pu * 3.1, runT * 0.5 + it.seed)) {
          spiked(x, y, 8, ITEM_R.thorn * pu * 1.35, 18, "#2a0410", "#ff2d55", runT * 1.1 + it.seed);
          ctx.fillStyle = "#ff2d55";
          ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill();
          ctx.fillStyle = "#ffe3ea";
          ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); ctx.fill();
        }
      }
    }

    /* ====================================================================
       THE BIOMES' ITEMS. Two rules hold for all of them. RED IS DANGER, and only
       danger: a hazard wears the thorn's red halo in the state that bites, and
       a calm, un-red look in every other state. And a hazard is painted where
       the biome's sheet has the piece — the lava pool, the boulder, the stone
       plate — so the danger belongs to the world it stands in; what no sheet
       has is drawn.
       ==================================================================== */
    function drawArt(key, x, y, size, rot) {
      var img = artImage(key), k;
      if (!img) return false;
      k = size / Math.max(img.naturalWidth, img.naturalHeight);
      ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
      ctx.drawImage(img, -img.naturalWidth * k * 0.5, -img.naturalHeight * k * 0.5,
                    img.naturalWidth * k, img.naturalHeight * k);
      ctx.restore();
      return true;
    }

    /* THE SWAMP'S LOG — the painted trunk of vipera-object-tree.png (art
       `tree01`), SINKING at both ends: the bark goes the colour of the water
       and fades out toward the cut faces, so the two ends read as under the
       surface rather than lying on it. Baked once into a canvas the size of
       the cut, and nothing else is drawn per frame but that one blit. */
    var LOG_WATER = "#34431a";       // the swamp's water, laid over the sunk ends
    var LOG_SINK = 0.24;             // share of the length, each side, that sinks
    var logSprite = null;
    function logArt() {
      var img = artImage("tree01"), w, h, c, g;
      if (logSprite || !img) return logSprite;
      w = img.naturalWidth; h = img.naturalHeight;
      logSprite = canvasOf(w, h);
      c = logSprite.getContext("2d");
      c.drawImage(img, 0, 0, w, h);
      // the water's colour over the ends, on the trunk's own alpha
      c.globalCompositeOperation = "source-atop";
      g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, rgba(LOG_WATER, 0.7));
      g.addColorStop(LOG_SINK, rgba(LOG_WATER, 0));
      g.addColorStop(1 - LOG_SINK, rgba(LOG_WATER, 0));
      g.addColorStop(1, rgba(LOG_WATER, 0.7));
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      // then the ends fade into it: dry wood in the middle, a ghost at the tips
      c.globalCompositeOperation = "destination-out";
      g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(0,0,0,.9)");
      g.addColorStop(0.07, "rgba(0,0,0,.62)");
      g.addColorStop(LOG_SINK, "rgba(0,0,0,0)");
      g.addColorStop(1 - LOG_SINK, "rgba(0,0,0,0)");
      g.addColorStop(0.93, "rgba(0,0,0,.62)");
      g.addColorStop(1, "rgba(0,0,0,.9)");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      return logSprite;
    }

    // A log seen from above: the painted trunk, or a capsule of bark when the
    // build has no artwork.
    function drawLog(it, x, y) {
      var L = T.logLen, R = T.logR, x0 = x - L * 0.5, x1 = x + L * 0.5, g, i, bx;
      var sp = logArt(), w, h;
      if (sp) {
        ctx.save();
        // the trunk is ~65% of the cut's height: sized so it is 2R thick, its
        // sunk ends then run a little past the capsule that bites
        h = R * 2 / 0.65; w = h * sp.width / sp.height;
        ctx.translate(x, y);
        ctx.scale(it.seed % 2 < 1 ? 1 : -1, it.seed % 4 < 2 ? 1 : -1);
        ctx.drawImage(sp, -w * 0.5, -h * 0.5, w, h);
        ctx.restore();
        return;
      }
      ctx.save();
      ctx.fillStyle = "rgba(255,45,85,.16)";             // the faint red of a thing that bites
      ctx.beginPath(); ctx.ellipse(x, y, L * 0.62, R * 2, 0, 0, TAU); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x0, y - R); ctx.lineTo(x1, y - R);
      ctx.arc(x1, y, R, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(x0, y + R);
      ctx.arc(x0, y, R, Math.PI / 2, Math.PI * 1.5);
      ctx.closePath();
      g = ctx.createLinearGradient(0, y - R, 0, y + R);
      g.addColorStop(0, "#9a6434"); g.addColorStop(0.45, "#6b4020"); g.addColorStop(1, "#331a0a");
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 3.5; ctx.strokeStyle = "#1d0f05"; ctx.stroke();
      ctx.strokeStyle = "rgba(30,14,4,.55)"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
      for (i = 0; i < 5; i++) {                          // the bark's grain
        bx = x0 + 18 + i * (L - 36) / 4;
        ctx.beginPath();
        ctx.moveTo(bx - 14, y - R * (0.5 - 0.15 * (i % 2)));
        ctx.quadraticCurveTo(bx, y - R * 0.1, bx + 16, y + R * (0.35 + 0.1 * (i % 2)));
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(122,190,58,.85)";             // moss on the top
      for (i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(x0 + 30 + i * 38 + Math.sin(it.seed + i) * 8, y - R * 0.55, 15, 6, 0, 0, TAU);
        ctx.fill();
      }
      for (i = -1; i <= 1; i += 2) {                     // the cut ends
        ctx.beginPath(); ctx.ellipse(x + i * L * 0.5, y, R * 0.42, R * 0.9, 0, 0, TAU);
        ctx.fillStyle = "#d6a66a"; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = "#1d0f05"; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x + i * L * 0.5, y, R * 0.2, R * 0.48, 0, 0, TAU);
        ctx.strokeStyle = "rgba(90,50,20,.7)"; ctx.lineWidth = 1.6; ctx.stroke();
      }
      ctx.restore();
    }

    /* THE TRAPS — three frames per sheet: 01 sunk, 02 rising, 03 up.
       vipera-object-trap-peak.png (art `trapPeak01`..`03`) is the slow spike
       trap, vipera-object-trap-fire.png (`trapFire01`..`03`) the fast fire
       one. The frames share the plate and differ by what stands above it, so
       each is drawn at the plate's WIDTH and stood on the plate's BASE: the
       spikes and the flames grow upward out of a plate that never moves. */
    var TRAP_W = 88;                 // the plate's width, design px
    function drawTrapArt(it, x, y, f, up, warn) {
      var pre = it.fire ? "trapFire0" : "trapPeak0", base = artImage(pre + "1");
      var n = up ? (f < 0.06 ? 2 : 3) : warn ? 2 : 1, img = artImage(pre + n), s, h, bot, fl;
      if (!base || !img) return false;
      bot = y + TRAP_W * base.naturalHeight / base.naturalWidth * 0.5;
      s = TRAP_W / img.naturalWidth;
      h = img.naturalHeight * s;
      // flames flicker: a quick stretch over the plate's base, never the plate
      fl = it.fire && n === 3 ? 1 + 0.05 * Math.sin(runT * 31 + it.seed * 5) : 1;
      ctx.drawImage(img, x - TRAP_W * 0.5, bot - h * fl, TRAP_W, h * fl);
      return true;
    }

    /* The drawn trap, for a build with no artwork: a round iron-bound stone
       plate, its spikes up (red, it bites), about to rise (the tips showing)
       or sunk. Neither version wears a ring or a halo: the frame IS the state. */
    function drawTrap(it, x, y) {
      var f = trapPhase(it), up = trapUp(it), warn = !up && f > 0.84, k, g;
      if (drawTrapArt(it, x, y, f, up, warn)) return;
      g = ctx.createRadialGradient(x - 10, y - 12, 4, x, y, 36);
      g.addColorStop(0, "#a89a82"); g.addColorStop(0.7, "#6e6352"); g.addColorStop(1, "#3c342a");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 36, 0, TAU); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = "#2a2f36"; ctx.stroke();        // the iron band
      ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(220,230,240,.35)";
      ctx.beginPath(); ctx.arc(x, y, 33, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
      if (up) {
        k = Math.min(1, f / 0.06);                        // they SNAP up
        spiked(x, y, 7, 34 * k, 10, "#e3e9f0", "#ff2d55", it.seed);
        spiked(x, y, 5, 16 * k, 6, "#ffffff", "#7a1028", it.seed + 0.3);
      } else if (warn) {
        spiked(x, y, 7, 14, 6, "#c9d2dc", "#ff2d55", it.seed);
      } else {
        ctx.fillStyle = "rgba(20,14,10,.6)";              // the holes they sank into
        for (k = 0; k < 7; k++) {
          ctx.beginPath();
          ctx.arc(x + Math.cos(it.seed + k * TAU / 7) * 18, y + Math.sin(it.seed + k * TAU / 7) * 18, 3.5, 0, TAU);
          ctx.fill();
        }
      }
    }

    /* THE ERUPTION — the eight frames of vipera-object-lava.png (art
       `lava01`..`lava08`): 01 is the embers gathering, 02 to 07 the burst
       swelling and falling back, 08 the smoke it leaves. The encoder sizes
       every cut to the same box, so LAVA_SIZE keeps each frame's size on the
       sheet, and the burst is drawn at one scale across all of them. */
    var LAVA_SIZE = [245, 352, 452, 494, 505, 525, 437, 429];
    var LAVA_SMOKE = 0.14;           // share of the next cycle the smoke lingers
    function drawLava(n, x, y, peak, alpha, rot) {
      var a = ctx.globalAlpha, ok;
      ctx.globalAlpha = a * alpha;
      ok = drawArt("lava0" + n, x, y, peak * LAVA_SIZE[n - 1] / 525, rot);
      ctx.globalAlpha = a;
      return ok;
    }

    // A lava geyser: the volcano's lava pool, the embers gathering in it, then
    // the burst. No ring and no red halo: the fire is the warning.
    function drawGeyser(it, x, y) {
      var f = geyserPhase(it), b, r, g, i, a, peak = T.geyserR * 3.2, n, t;
      drawArt("bankVolcano02", x, y, 92) || halo(x, y, 40, "#ff7a1a");
      if (artImage("lava01")) {
        if (f >= GEYSER_BURST) {
          // the burst: 02 to 07, the next frame faded in over the current one
          // (two half-alpha frames would wash the fire out at every seam)
          b = (f - GEYSER_BURST) / (1 - GEYSER_BURST) * 5;
          n = Math.min(4, Math.floor(b)); t = b - n;
          drawLava(n + 2, x, y, peak, 1, it.seed);
          drawLava(n + 3, x, y, peak, t, it.seed);
        } else if (f >= GEYSER_WARN) {
          // the warning: the embers gathering
          b = (f - GEYSER_WARN) / (GEYSER_BURST - GEYSER_WARN);
          drawLava(1, x, y, peak * (0.5 + 0.5 * b), 0.35 + 0.65 * b, it.seed + runT * 0.6);
        } else if (f < LAVA_SMOKE) {
          // the smoke after it, which no longer bites
          drawLava(8, x, y, peak * (1 + 0.25 * f / LAVA_SMOKE), 1 - f / LAVA_SMOKE, it.seed);
        }
        return;
      }
      if (f >= GEYSER_BURST) {
        b = (f - GEYSER_BURST) / (1 - GEYSER_BURST);
        r = T.geyserR * (0.75 + 0.35 * Math.sin(Math.min(1, b * 3) * Math.PI * 0.5)) * (1 - 0.25 * b);
        g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "#fffbe0"); g.addColorStop(0.35, "#ffd43b");
        g.addColorStop(0.75, "#ff7a1a"); g.addColorStop(1, "rgba(255,45,45,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        spiked(x, y, 9, r * 0.95, r * 0.55, "rgba(255,212,59,.55)", "rgba(255,90,30,.8)", runT * 3 + it.seed);
      } else if (f >= GEYSER_WARN) {
        ctx.fillStyle = "rgba(255,190,60,.85)";          // bubbles
        for (i = 0; i < 5; i++) {
          a = it.seed + i * 1.7;
          ctx.beginPath();
          ctx.arc(x + Math.cos(a) * 16, y + Math.sin(a) * 12, 3 + 3 * Math.abs(Math.sin(runT * 9 + i)), 0, TAU);
          ctx.fill();
        }
      }
    }

    // A falling rock: its shadow growing where it will land (a warning, not a
    // danger), the boulder dropping in, then the boulder itself, which bites.
    function drawRock(it, x, y) {
      var prox, t, sc;
      if (it.fallT < 0) {
        prox = clamp(1 - (it.p - camP - T.rockFall) / 700, 0, 1);
        ctx.fillStyle = "rgba(0,0,0," + (0.12 + 0.3 * prox) + ")";
        ctx.beginPath(); ctx.ellipse(x, y, 14 + 24 * prox, 9 + 15 * prox, 0, 0, TAU); ctx.fill();
        return;
      }
      t = Math.min(1, it.fallT / ROCK_DROP);
      ctx.fillStyle = "rgba(0,0,0," + (0.42 * t + 0.2) + ")";
      ctx.beginPath(); ctx.ellipse(x, y + 4, 40, 26, 0, 0, TAU); ctx.fill();
      sc = 1 + 0.7 * (1 - t) * (1 - t);                   // nearer the eye while it falls
      if (!drawArt("bankVolcano01", x, y - 120 * (1 - t) * (1 - t), 80 * sc, it.seed)) {
        ctx.fillStyle = "#3a2c28"; ctx.beginPath(); ctx.arc(x, y, 32 * sc, 0, TAU); ctx.fill();
      }
    }

    /* THE LIGHTNING, on the ground (vipera-object-lightning.png, art
       `lightning01`-`08`: three bolts, the charge — not adopted, the warning
       is drawn — two impacts, two scorches).
       The warning is one small glowing white ring closing to a dot — the
       strike is when it gets there. After it, the scorch, briefly. */
    function drawBoltGround(it, x, y) {
      var r = T.boltR, k, f, a;
      if (it.st < 0) return;                             // not lit yet: nothing there
      if (!it.hit) {
        // one small white ring closing to a DOT on the strike's centre: the bolt
        // lands on the dot. A dark hairline under it keeps it read on the pale
        // floor, and the glow is two wider strokes added on, never a shadowBlur.
        k = clamp(it.st / it.w, 0, 1);
        f = 0.8 + 0.2 * Math.sin(it.st * (14 + 34 * k));
        a = BOLT_RING * (1 - k) * (1 - k * 0.35) + 3;
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(10,14,30," + (0.3 * (0.4 + 0.6 * k)).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(x, y, a, 0, TAU); ctx.stroke();
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = (0.5 + 0.5 * k) * f;
        ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 14;
        ctx.beginPath(); ctx.arc(x, y, a, 0, TAU); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(x, y, a, 0, TAU); ctx.stroke();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(x, y, a, 0, TAU); ctx.stroke();
        // the dot it closes on, brighter as the ring comes in
        ctx.fillStyle = "rgba(255,255,255," + (0.35 + 0.65 * k).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(x, y, 2.5 + 2 * k, 0, TAU); ctx.fill();
        ctx.restore();
        return;
      }
      a = it.st - it.w;
      if (a >= BOLT_SCORCH + BOLT_SCORCH_FADE) return;   // burnt out: nothing left
      ctx.save();
      ctx.globalAlpha = a < 0.06 ? a / 0.06 : 1 - clamp((a - BOLT_SCORCH) / BOLT_SCORCH_FADE, 0, 1);
      drawArt(it.sc ? "lightning08" : "lightning07", x, y, r * 3, it.seed);
      ctx.restore();
    }

    /* THE LIGHTNING, in the sky: the bolt and its impact are drawn over the
       viper, added onto the frame ("lighter") so they read as light, not paint.
       The bolt is stretched from its foot up to the top of the frame. Without the art, a jagged white line. */
    function drawBolts() {
      var i, it, x, y, a, img, w, h, j, t;
      for (i = 0; i < items.length; i++) {
        it = items[i];
        if (it.type !== "bolt" || !it.hit) continue;
        a = it.st - it.w;
        if (a >= BOLT_IMPACT) continue;
        x = it.x; y = sy(it.p);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        if (a < BOLT_FLASH) {
          ctx.globalAlpha = 1 - 0.5 * (a / BOLT_FLASH);
          halo(x, y, T.boltR * 2.6, "#cfdcff");
          img = artImage("lightning0" + (1 + (it.b + Math.floor(a / BOLT_FLICK)) % 3));
          if (img) {
            // stretched so its foot is on the strike and its top on the top
            // edge of the frame, wherever the strike is
            w = 300; h = Math.max(1, y) / BOLT_FOOT_Y;
            ctx.drawImage(img, x - w * BOLT_FOOT_X, y - h * BOLT_FOOT_Y, w, h);
          } else {
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(x, y);
            for (j = 1; j <= 6; j++) ctx.lineTo(x + Math.sin(it.seed * 7 + j * 2.3) * 34, y - y * j / 6);
            ctx.stroke();
          }
        }
        t = a / BOLT_IMPACT;
        ctx.globalAlpha = Math.pow(1 - t, 1.4);
        drawArt(it.im ? "lightning06" : "lightning05", x, y, T.boltR * 2.8 * (0.7 + 0.5 * ease(t)), it.seed * 2);
        ctx.restore();
      }
    }

    /* The eagle's pictures (CONFIG.art.eagle*): `plane`, wings spread, is the
       shadow; `start`, wings flared, the beat at the top; `attack`, wings
       folded, the stoop. All three are painted head DOWN, which is the stoop's
       heading; the shadow flies the other way and is turned round. A shadow is
       the picture's own silhouette, built once, so it is exactly that bird.
       Without the art (a build that ships none) the bird is a dark ellipse:
       the hazard still reads, it just is not painted. */
    var eagleShade = null;
    function silhouette(img) {
      var c;
      if (eagleShade) return eagleShade;
      eagleShade = document.createElement("canvas");
      eagleShade.width = img.naturalWidth; eagleShade.height = img.naturalHeight;
      c = eagleShade.getContext("2d");
      c.drawImage(img, 0, 0);
      c.globalCompositeOperation = "source-in";
      c.fillStyle = "#000";
      c.fillRect(0, 0, eagleShade.width, eagleShade.height);
      return eagleShade;
    }
    function eagleSprite(pic, x, y, w, flip, alpha) {
      var h = w * EAGLE_K;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      if (flip) ctx.rotate(Math.PI);
      if (pic) ctx.drawImage(pic, -w / 2, -h / 2, w, h);
      else {
        ctx.fillStyle = "#1a0d06";
        ctx.beginPath(); ctx.ellipse(0, 0, w * 0.42, h * 0.3, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    function drawEagle() {
      var e = eagle, w = eagleW(), h = w * EAGLE_K, x, y, t, img, k, i;
      if (!e || e.ph === "wait") return;
      x = eagleX(e.side);
      if (e.ph === "shadow") {
        // bottom edge to top edge, gliding: a slow sway, the wings breathing
        t = e.t / T.eagleShadow;
        y = view.h + h * 0.6 - (view.h + h * 1.2) * t;
        img = artImage("eaglePlane");
        ctx.save();
        ctx.translate(x + Math.sin(e.t * 1.7) * 14, y);
        ctx.scale(1 + Math.sin(e.t * 3.1) * 0.035, 1);
        // the lair's floor is dark: a faint shadow is lost on it, so the shadow
        // is deep, with a wider, softer copy under it for the penumbra
        img = img ? silhouette(img) : null;
        eagleSprite(img, 0, 0, w * 1.08, true, 0.22);
        eagleSprite(img, 0, 0, w, true, 0.62);
        ctx.restore();
        return;
      }
      if (e.ph === "start") {
        // it swells into view at the top of its half, then hangs there
        k = ease(Math.min(1, e.t / (T.eagleStart * 0.6)));
        eagleSprite(artImage("eagleStart"), x, eagleTop(), w * (0.84 + 0.16 * k), false, k);
        return;
      }
      // the stoop: the bird, with two fading copies of itself above it
      img = artImage("eagleAttack");
      for (i = 2; i >= 1; i--) {
        eagleSprite(img, x, e.y - i * h * 0.32, w * (1 - i * 0.04), false, 0.16 * (3 - i));
      }
      eagleSprite(img, x, e.y, w, false, 1);
    }

    // The rainbow egg: an egg banded in the body's own rainbow — `item06` of
    // vipera-object-item.png, drawn here in a build with no artwork.
    function drawRainbowEgg(x, y, pu) {
      var g, i;
      halo(x, y, 60 * pu, "#ffffff");
      if (drawArt("item06", x, y, 78 * pu, Math.sin(runT * 2) * 0.18)) return;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(runT * 2) * 0.18); ctx.scale(pu, pu);
      ctx.beginPath(); ctx.ellipse(0, 0, 24, 31, 0, 0, TAU);
      g = ctx.createLinearGradient(0, -31, 0, 31);
      for (i = 0; i <= 6; i++) g.addColorStop(i / 6, "hsl(" + ((i * 55 + runT * 90) % 360) + ",95%,58%)");
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 3.5; ctx.strokeStyle = "#2b1a3a"; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.beginPath(); ctx.ellipse(-8, -12, 6, 10, -0.4, 0, TAU); ctx.fill();
      ctx.restore();
    }

    /* The fireflies around the swamp's pickup. They BUZZ rather than orbit:
       each one sums three sines of unrelated frequencies on each axis — a slow
       wander, a quicker swerve and a fast jitter — so its path never closes
       into a loop and no two of them move alike. Its light flickers on a
       clock of its own. Read off runT alone: nothing to store per fly. */
    function drawFireflies(x, y, seed, k) {
      var i, t, s, fx, fy, a;
      k = k || 1;                       // how wide the swarm wanders
      for (i = 0; i < 5; i++) {
        s = seed * 7.3 + i * 2.39;
        t = runT * (0.85 + 0.12 * i);
        fx = x + (Math.sin(t * 1.3 + s) * 30 + Math.sin(t * 3.7 + s * 2.1) * 14) * k + Math.sin(t * 11.3 + s * 3.7) * 3.5;
        fy = y + (Math.sin(t * 1.1 + s * 1.7) * 24 + Math.sin(t * 4.3 + s * 0.6) * 12) * k + Math.sin(t * 13.1 + s * 5.3) * 3.5;
        a = 0.55 + 0.45 * Math.sin(runT * (5 + i * 1.3) + s * 4);
        ctx.fillStyle = rgba("#f6ff9e", 0.35 * a);
        ctx.beginPath(); ctx.arc(fx, fy, 8, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba("#fbffd0", 0.4 + 0.6 * a);
        ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, TAU); ctx.fill();
      }
    }

    function drawBiomeItem(it, x, y) {
      var pu = 1 + Math.sin(runT * 4 + it.seed) * 0.07, i, a;
      if (it.type === "log") drawLog(it, x, y);
      else if (it.type === "trap") drawTrap(it, x, y);
      else if (it.type === "geyser") drawGeyser(it, x, y);
      else if (it.type === "rock") drawRock(it, x, y);
      else if (it.type === "bolt") drawBoltGround(it, x, y);
      // the three pickups are vipera-object-item.png's jar, idol and amber
      else if (it.type === "fly") {
        halo(x, y, 58 * pu, "#e9ff6e");
        drawArt("item03", x, y, 80 * pu) ||
          gem(x, y, 26 * pu, runT, "#ffffff", "#f6ff9e", "#9bd11a", "#1c2a00");
        drawFireflies(x, y, it.seed);
      } else if (it.type === "idol") {
        halo(x, y, 62 * pu, "#ffd43b");
        drawArt("item04", x, y, 82 * pu) ||
          gem(x, y, 28 * pu, runT, "#fffbe8", "#ffd43b", "#ff9f1c", "#2b1a00");
      } else if (it.type === "amber") {
        halo(x, y, 58 * pu, "#ffb703");
        drawArt("item05", x, y, 78 * pu, Math.sin(runT * 2 + it.seed) * 0.12) ||
          gem(x, y, 26 * pu, runT, "#fff6d6", "#ffd27a", "#ffb703", "#2b1a00");
      } else if (it.type === "rainbow") {
        drawRainbowEgg(x, y, pu);
      }
    }

    /* The pickups that hold, worn by the viper itself: a power the player
       cannot see running is a power they do not trust. A ring drawn round the
       head read as a HUD widget laid over the burrow, so each power is an AURA
       of its own colour breathing along the whole body (drawAura, under the
       plates), plus what it is made of, over them (drawPowers): the jar's
       fireflies buzzing round the head, the idol's gold glinting up off the
       scales. They last until the next hit rather than on a clock, so both
       hold until it lands. */
    var AURA = { fly: "#d4ff4a", idol: "#ffc21a" };
    function auraColours() {
      var list = [];
      if (magnetOn) list.push(AURA.fly);
      if (idolOn) list.push(AURA.idol);
      return list;
    }
    // the spine from the head to block `m`, as one path (bsx/bsy, see poseBody)
    function spinePath(m) {
      var i;
      ctx.beginPath();
      ctx.moveTo(bsx[0], bsy[0]);
      for (i = 1; i < m; i++) ctx.lineTo(bsx[i], bsy[i]);
    }
    /* AURA_PASSES strokes of the spine, each wider and shorter than the one
       before, so the light falls off softly across the body and thins toward
       the tail the way the body does; one stroked path each, never a disc per
       block, which would bead at every joint. Additive, so it lights the dark
       floor rather than greying it. Two powers breathe in opposition, which is
       what keeps the two colours apart rather than mixed. */
    var AURA_PASSES = 7;
    function drawAura(n) {
      var list = auraColours(), r = headRadius(), j, b, s, f;
      if (!list.length || n < 2) return;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      for (j = 0; j < list.length; j++) {
        b = 0.7 + 0.3 * Math.sin(runT * 3.4 + j * Math.PI);
        for (s = 0; s < AURA_PASSES; s++) {
          f = s / (AURA_PASSES - 1);
          spinePath(Math.max(2, Math.ceil(n * (1 - 0.6 * f))));
          ctx.strokeStyle = rgba(list[j], 0.045 * b);
          ctx.lineWidth = r * (2.4 + 3.2 * f);
          ctx.stroke();
        }
        halo(bsx[0], bsy[0], r * HEAD_K * (2.1 + 0.25 * b), list[j]);
      }
      ctx.restore();
    }
    /* The idol's gold: small four-point glints rising off the front of the
       body and fading as they go. Each one is read off runT alone — its cycle
       number picks the block it leaves from — so nothing is stored. */
    function drawGlints(n) {
      var m = Math.min(n, 12), r = headRadius(), k, t, cyc, ph, b, x, y, a, s;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (k = 0; k < 7; k++) {
        t = runT * 0.8 + k / 7;
        cyc = Math.floor(t); ph = t - cyc;
        b = (k * 5 + cyc * 3) % m;
        x = bsx[b] + Math.sin(k * 2.3 + cyc * 1.7) * r * 0.8;
        y = bsy[b] - ph * 56;
        a = Math.sin(ph * Math.PI);
        s = 4 + 5 * a;
        ctx.fillStyle = rgba(AURA.idol, 0.3 * a);
        ctx.beginPath(); ctx.arc(x, y, s * 1.3, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba("#fff3b0", 0.9 * a);
        ctx.beginPath();
        ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.28, y - s * 0.28);
        ctx.lineTo(x + s, y); ctx.lineTo(x + s * 0.28, y + s * 0.28);
        ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.28, y + s * 0.28);
        ctx.lineTo(x - s, y); ctx.lineTo(x - s * 0.28, y - s * 0.28);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    function drawPowers() {
      if (poseN < 1) return;
      if (magnetOn) drawFireflies(bsx[0], bsy[0], 0.4, 1.5);
      if (idolOn) drawGlints(poseN);
    }

    function drawItems() {
      var i, it, y;
      for (i = 0; i < items.length; i++) {
        it = items[i];
        if (it.p < pMin || it.p > pMax) continue;
        y = sy(it.p);
        // a halo, a geyser's plume or a rock still falling reaches well past
        // the item's centre: cull only once all of it is off the frame
        if (y < -160 || y > view.h + 160) continue;
        if (!Enter.begin(it.x, y)) continue;
        drawItem(it, it.x, y);
        Enter.end();
      }
    }

    /* ====================================================================
       THE SKIN — THE APP ICON'S VIPER, SEEN FROM ABOVE

       The head is the mascot the app icon paints, seen the way the camera sees
       everything in this burrow — from above: a round lime skull with the
       icon's soft dark spots, its huge amber eyes bulging out of the crown
       under two black brow marks, and the cream muzzle. It is painted art in
       three faces (neutral, turn, hurt) and a drawn sprite where the build has
       none.

       The body keeps what makes it read as a SNAKE rather than a worm,
       IMBRICATION: staggered rows of small scales, each one's free edge lapping
       over the row behind, blocks laid TAIL FIRST so every block bites over the
       one behind it, with one gloss line down the spine so the hide never
       breaks at a seam. The scales wear the tier's colour — and the
       RAINBOW once the viper is plated: a full-length body is the armour, and
       the armour is the one state worth seeing from across the screen.

       Everything is pre-rendered once — one plate per tier, per hue and per
       shade, one head — so a frame costs one drawImage per block, with no
       shadowBlur and no gradient rebuilt per block per frame.
       ==================================================================== */
    var PLATE_PX = 128;          // side of a block's sprite, in sprite px
    var PLATE_HW = 40;           // half-width of the body inside that sprite
    var PLATE_F  = 46;           // sprite px it reaches FORWARD, under its neighbour
    var PLATE_B  = 34;           // ...and BACKWARD, out to its free margin
    var PLATE_LEN = 1.78;        // on-screen length, in block spacings (see below)
    var HEAD_PX  = 224, HEAD_R = 62;   // head sprite side / the radius it draws
    var HEAD_K   = 1.4;          // sprite radius over the head's hit radius: the big head IS the cute
    /* Where an eye sits inside the head sprite, in sprite units. Shared, because
       buildHead paints the living eye there and the death cinematic crosses it
       out at the very same spot — two numbers that must never drift apart. */
    var EYE_X = HEAD_R * 0.56, EYE_Y = -HEAD_R * 0.48, EYE_R = HEAD_R * 0.3;
    var SNOUT = HEAD_R * 1.28;   // where the tongue comes out, in sprite units
    var HUES = 12;               // the rainbow, in steps of 30 degrees
    /* THE PAINTED HEAD — assets/image/master/vipera-head-{neutral,turn,hurt}.png,
       injected as CONFIG.art.head* and decoded into ArtImages. They are painted
       from above with the snout at the BOTTOM of the picture, so they are drawn
       turned half a turn. Measured on the pictures, as fractions of them: */
    var PAINT_W     = 2.9;       // the head's width on screen, in hit radii
    var PAINT_FILL  = 0.92;      // share of the picture's width the head fills
    var PAINT_PIVOT = 0.42;      // the neck pivot, down from the nape at the top
    var PAINT_SNOUT = 0.99;      // the snout's tip, same measure
    var PAINT_HUE   = 85;        // the painted hide's own hue, in degrees
    var hurtTint = null;         // the hurt head under a red filter, built once
    var headTints = {};          // "<art key>:<hue>" -> the head recoloured to that hue
    var plateSprites = [];       // [tier][shade 0 = nape, 1 = mid, 2 = tail]
    var rainbowSprites = [];     // [hue][shade]
    var headSprite = null;

    function surface(px) {
      var cv = document.createElement("canvas");
      cv.width = px; cv.height = px;
      return cv;
    }

    // A colour pushed toward the burrow's ink: the tail fades into the dark
    // instead of ending on a bright stump. Returns a hex, so it can be fed back
    // into rgba().
    function darker(hex, k) {
      var h = hex.replace("#", ""), i, v, out = "#";
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      for (i = 0; i < 3; i++) {
        v = Math.round(parseInt(h.substr(i * 2, 2), 16) * k).toString(16);
        out += v.length < 2 ? "0" + v : v;
      }
      return out;
    }
    function hsla(h, s, l, a) {
      return "hsla(" + h + "," + s + "%," + l + "%," + (a === undefined ? 1 : a) + ")";
    }
    // On a plated viper, block i wears hue step (i - 1): red at the nape,
    // through the spectrum, and round again on a long body. The colour belongs
    // to the block, so it travels with it instead of crawling along the body.
    function hueIdx(i) { return ((i - 1) % HUES + HUES) % HUES; }
    function hueOf(i) { return hueIdx(i) * (360 / HUES); }

    /* One block of the body, in sprite space: forward is -y. It is not one
       plate but TWO ROWS OF SCALES, staggered, each scale a small rounded
       shield whose free edge points back toward the tail and laps over the row
       behind it — a ring drawn across the whole width is what read as an
       earthworm. The block's own back edge is therefore SCALLOPED, scale by
       scale, and the seams between blocks vanish into the pattern.

       The rows are spaced at exactly half a block (PLATE_PERIOD, in sprite px),
       so two rows per block keep the stagger in step from one block to the
       next: the body reads as one continuous hide. */
    var PLATE_PERIOD = (PLATE_F + PLATE_B) / PLATE_LEN;   // one block, in sprite px
    var SCALE_ROW    = PLATE_PERIOD / 2;                  // two rows per block
    var SCALE_ACROSS = 4;                                 // scales across the back

    function pillPath(c, hw, y0, y1, rr) {
      c.beginPath();
      c.moveTo(-hw, y0 + rr);
      c.quadraticCurveTo(-hw, y0, -hw + rr, y0);
      c.lineTo(hw - rr, y0);
      c.quadraticCurveTo(hw, y0, hw, y0 + rr);
      c.lineTo(hw, y1 - rr);
      c.quadraticCurveTo(hw, y1, hw - rr, y1);
      c.lineTo(-hw + rr, y1);
      c.quadraticCurveTo(-hw, y1, -hw, y1 - rr);
      c.closePath();
    }
    function scalePath(c, x, y, w, h) {
      c.beginPath();
      c.moveTo(x - w * 0.5, y - h * 0.12);
      c.quadraticCurveTo(x - w * 0.5, y - h * 0.5, x, y - h * 0.5);
      c.quadraticCurveTo(x + w * 0.5, y - h * 0.5, x + w * 0.5, y - h * 0.12);
      c.quadraticCurveTo(x + w * 0.48, y + h * 0.3, x, y + h * 0.5);   // the free edge
      c.quadraticCurveTo(x - w * 0.48, y + h * 0.3, x - w * 0.5, y - h * 0.12);
      c.closePath();
    }
    // The free edge alone — the part of a scale that is never covered.
    function scaleEdge(c, x, y, w, h) {
      c.beginPath();
      c.moveTo(x - w * 0.5, y - h * 0.12);
      c.quadraticCurveTo(x - w * 0.48, y + h * 0.3, x, y + h * 0.5);
      c.quadraticCurveTo(x + w * 0.48, y + h * 0.3, x + w * 0.5, y - h * 0.12);
    }

    /* One block. `colAt(f)` is the skin colour down the block's VISIBLE band,
       f = 0 where the block in front stops covering it to 1 at its own back
       edge; `inkCol` outlines each scale's free edge. */
    function buildPlate(colAt, inkCol, shade) {
      var cv = surface(PLATE_PX), c = cv.getContext("2d");
      var hw = PLATE_HW, step = hw * 2 / SCALE_ACROSS;
      var sw = step * 1.18, sh = SCALE_ROW * 1.7;
      var back = PLATE_B + 8;                           // the scallops' tips, inside the sprite
      var y0 = back - sh * 0.5;                         // the back row's centre
      var top = back - PLATE_PERIOD;                    // where the visible band starts
      var g, k, x, y, off, col;
      c.translate(PLATE_PX * 0.5, PLATE_PX * 0.5);

      /* The block is a PILL: its flanks are straight and its four corners
         rounded, so on a bend the corners of a block never stick out of the
         body's side as a saw-tooth. Only the middle of the back edge is
         scalloped by the scales. */
      c.save();
      pillPath(c, hw, -PLATE_F, back + 1, hw * 0.75);
      c.clip();

      /* Back row first: every row in front of it is drawn over it, so each
         scale's free edge lies over the top of the scale behind — that order IS
         the imbrication. */
      for (k = 0; (y = y0 - k * SCALE_ROW) > -PLATE_F - sh * 0.5; k++) {
        off = (k % 2) ? step * 0.5 : 0;
        col = colAt(clamp((y + sh * 0.3 - top) / PLATE_PERIOD, 0, 1));
        for (x = -hw - step + off; x <= hw + step; x += step) {
          scalePath(c, x, y, sw, sh);
          c.fillStyle = col; c.fill();
          // lit toward the free edge, the way a scale catches the light
          g = c.createLinearGradient(0, y - sh * 0.5, 0, y + sh * 0.5);
          g.addColorStop(0, "rgba(0,0,0,.18)");
          g.addColorStop(0.55, "rgba(255,255,255,0)");
          g.addColorStop(0.85, "rgba(255,255,255,.2)");
          g.addColorStop(1, "rgba(255,255,255,.05)");
          c.fillStyle = g; c.fill();
          scaleEdge(c, x, y, sw, sh);
          c.lineWidth = 2.6; c.lineCap = "round"; c.strokeStyle = inkCol; c.stroke();
          c.save(); c.translate(0, -2.2);
          scaleEdge(c, x, y, sw * 0.86, sh * 0.86);
          c.lineWidth = 1.6; c.strokeStyle = "rgba(255,255,255," + (shade === 2 ? 0.1 : 0.2) + ")";
          c.stroke();
          c.restore();
        }
      }

      /* ...lit along the dorsal ridge, dark at both flanks, laid over every
         scale at once, so a row of them reads as a round back and not as a
         flat ribbon. */
      c.globalCompositeOperation = "source-atop";
      g = c.createLinearGradient(-hw, 0, hw, 0);
      g.addColorStop(0, "rgba(0,0,0,.55)");
      g.addColorStop(0.2, "rgba(0,0,0,.14)");
      g.addColorStop(0.44, "rgba(255,255,255,.16)");
      g.addColorStop(0.56, "rgba(255,255,255,.12)");
      g.addColorStop(0.8, "rgba(0,0,0,.16)");
      g.addColorStop(1, "rgba(0,0,0,.6)");
      c.fillStyle = g;
      c.fillRect(-hw, -PLATE_F - sh, hw * 2, PLATE_F + PLATE_B + sh * 2);
      c.restore();
      return cv;
    }

    // A tier block: the tier's own colour, darkening down the body.
    function buildTierPlate(tier, shade) {
      var base = darker(tier.stops[2], shade === 0 ? 1 : shade === 1 ? 0.84 : 0.66);
      return buildPlate(function () { return base; }, rgba(darker(base, 0.32), 0.7), shade);
    }

    /* A rainbow block. The hue runs DOWN the block, half a step ahead of its
       own hue where the block in front stops covering it to half a step past it
       at its back edge — which is where the next block takes over at that very
       hue. So the rainbow flows down the body as one band instead of stacking
       up as coloured rings. Yellow and green are bright at any lightness and
       blue is dark at all of them: the light hues are pulled down and the dark
       ones up so the band reads at one even weight. */
    function buildRainbowPlate(hi, shade) {
      var step = 360 / HUES, h = hi * step;
      var dl = -(shade === 0 ? 0 : shade === 1 ? 7 : 16);
      function lift(hh) {
        hh = (hh + 360) % 360;
        return (hh >= 40 && hh <= 160) ? -6 : (hh >= 200 && hh <= 280) ? 10 : 0;
      }
      return buildPlate(function (f) {
        var hh = h - step * 0.5 + step * f;
        return hsla(hh, 96, 54 + dl + lift(hh));
      }, hsla(h, 70, 18, 0.6), shade);
    }

    /* The head, from above — the FALLBACK for a build without the painted
       heads (THE PAINTED HEAD, above), drawn to the same design. Every
       coordinate is a fraction of R, forward is -y: the snout at the top, the
       neck at the bottom. */
    function buildHead() {
      var cv = surface(HEAD_PX), c = cv.getContext("2d");
      var R = HEAD_R, g, i, s, d, a0, a1;
      var INK = "#173a08";

      /* Round and chubby, widest across the eyes, a short blunt snout, and
         pinched into the neck so the head stands out of the body behind it. No
         viper wedge: the plates already say snake, and the flare is what made
         the old head read as a threat. */
      function skull() {
        c.beginPath();
        c.moveTo(0, -R * 1.32);
        c.bezierCurveTo(R * 0.5, -R * 1.32, R * 0.86, -R * 1.04, R * 0.95, -R * 0.56);
        c.bezierCurveTo(R * 1.02, -R * 0.18, R * 0.92, R * 0.3, R * 0.72, R * 0.6);
        c.bezierCurveTo(R * 0.56, R * 0.86, R * 0.34, R * 1.02, 0, R * 1.02);
        c.bezierCurveTo(-R * 0.34, R * 1.02, -R * 0.56, R * 0.86, -R * 0.72, R * 0.6);
        c.bezierCurveTo(-R * 0.92, R * 0.3, -R * 1.02, -R * 0.18, -R * 0.95, -R * 0.56);
        c.bezierCurveTo(-R * 0.86, -R * 1.04, -R * 0.5, -R * 1.32, 0, -R * 1.32);
        c.closePath();
      }
      /* The edge of the lime cap over the cream: across the snout it leaves the
         icon's cream MUZZLE in front of the eyes, and from there it runs back
         along both sides as a thin lip to the cheeks. From above, that edge IS
         the mouth line. */
      function lipEdge() {
        c.moveTo(-R * 0.97, R * 0.02);
        c.bezierCurveTo(-R * 0.94, -R * 0.36, -R * 0.84, -R * 0.82, -R * 0.56, -R * 0.98);
        c.quadraticCurveTo(0, -R * 1.12, R * 0.56, -R * 0.98);
        c.bezierCurveTo(R * 0.84, -R * 0.82, R * 0.94, -R * 0.36, R * 0.97, R * 0.02);
      }

      c.translate(HEAD_PX * 0.5, HEAD_PX * 0.5);
      c.lineJoin = "round"; c.lineCap = "round";

      // the cream lip first, the whole skull...
      skull();
      g = c.createLinearGradient(0, -R * 1.36, 0, 0);
      g.addColorStop(0, "#fff8c4");
      g.addColorStop(1, "#ecd27a");
      c.fillStyle = g; c.fill();

      c.save(); skull(); c.clip();
      // ...then the lime cap over it, lit from the top left like the icon
      c.beginPath();
      lipEdge();
      c.lineTo(R * 1.2, R * 1.2); c.lineTo(-R * 1.2, R * 1.2);
      c.closePath();
      g = c.createRadialGradient(-R * 0.3, -R * 0.6, R * 0.1, 0, -R * 0.1, R * 1.3);
      g.addColorStop(0, "#d4f763");
      g.addColorStop(0.5, "#8fd62a");
      g.addColorStop(1, "#3f9a18");
      c.fillStyle = g; c.fill();

      // the spots, on the crown and down the back of the skull
      d = [[0, -0.5, 0.07], [-0.16, -0.22, 0.06], [0.18, -0.24, 0.065],
           [0, 0.04, 0.09], [-0.34, 0.24, 0.08], [0.36, 0.2, 0.075],
           [0, 0.5, 0.075], [-0.6, 0.3, 0.06], [0.58, 0.38, 0.065],
           [-0.14, 0.82, 0.05], [0.24, 0.76, 0.055]];
      for (i = 0; i < d.length; i++) {
        c.beginPath(); c.arc(d[i][0] * R, d[i][1] * R, d[i][2] * R, 0, TAU);
        c.fillStyle = "rgba(44,128,22,.55)"; c.fill();
      }

      // a blush on each cheek, just behind the corner of the grin
      for (s = -1; s <= 1; s += 2) {
        g = c.createRadialGradient(R * 0.74 * s, R * 0.06, 2, R * 0.74 * s, R * 0.06, R * 0.2);
        g.addColorStop(0, "rgba(255,110,140,.55)");
        g.addColorStop(1, "rgba(255,110,140,0)");
        c.fillStyle = g;
        c.beginPath(); c.arc(R * 0.74 * s, R * 0.06, R * 0.2, 0, TAU); c.fill();
      }

      // the gloss on the crown: the icon's hide is lacquer, not leather
      c.save();
      c.translate(-R * 0.08, -R * 0.78); c.rotate(-0.2); c.scale(1, 0.4);
      c.beginPath(); c.arc(0, 0, R * 0.2, 0, TAU);
      c.fillStyle = "rgba(255,255,255,.4)"; c.fill();
      c.restore();

      // shaded into the neck, so the skull reads as a dome and not a cut-out
      g = c.createLinearGradient(0, -R * 0.2, 0, R);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,.32)");
      c.fillStyle = g; c.fillRect(-R * 1.2, -R * 0.2, R * 2.4, R * 1.3);
      c.restore();

      /* THE GRIN. The mouth line along the lip, and at each cheek a corner that
         curls back up into the face: from above, that curl is the whole smile. */
      c.beginPath(); lipEdge();
      c.lineWidth = 3.2; c.strokeStyle = INK; c.stroke();
      for (s = -1; s <= 1; s += 2) {
        c.beginPath();
        c.moveTo(R * 0.96 * s, -R * 0.12);
        c.quadraticCurveTo(R * 0.9 * s, R * 0.06, R * 0.76 * s, R * 0.04);
        c.lineWidth = 3; c.stroke();
      }
      // nostrils, two dots near the tip of the snout
      for (s = -1; s <= 1; s += 2) {
        c.beginPath(); c.arc(R * 0.15 * s, -R * 1.18, R * 0.045, 0, TAU);
        c.fillStyle = "rgba(40,30,8,.75)"; c.fill();
      }

      skull();
      c.lineWidth = 4.5; c.strokeStyle = INK; c.stroke();

      /* THE EYES — bulging out of the crown as on the icon, big enough to break
         the outline: a white eyeball, a big amber iris looking AHEAD, where the
         viper is going, a round pupil and two catchlights. */
      for (s = -1; s <= 1; s += 2) {
        c.save();
        c.translate(EYE_X * s, EYE_Y);
        c.save(); c.scale(0.94, 1.08);
        c.beginPath(); c.arc(0, 0, EYE_R, 0, TAU);
        c.fillStyle = "#fffdf4"; c.fill();
        c.lineWidth = 3.6; c.strokeStyle = INK; c.stroke();
        c.restore();
        c.beginPath(); c.arc(-R * 0.03 * s, -R * 0.07, R * 0.2, 0, TAU);
        g = c.createRadialGradient(-R * 0.03 * s, -R * 0.02, R * 0.02, -R * 0.03 * s, -R * 0.07, R * 0.2);
        g.addColorStop(0, "#ffd36a");
        g.addColorStop(0.55, "#e0801c");
        g.addColorStop(1, "#7a3206");
        c.fillStyle = g; c.fill();
        c.lineWidth = 2; c.strokeStyle = "rgba(60,20,0,.8)"; c.stroke();
        c.beginPath(); c.arc(-R * 0.03 * s, -R * 0.09, R * 0.11, 0, TAU);
        c.fillStyle = "#1a0b03"; c.fill();
        c.beginPath(); c.arc(-R * 0.08, -R * 0.15, R * 0.07, 0, TAU);
        c.fillStyle = "rgba(255,255,255,.95)"; c.fill();
        c.beginPath(); c.arc(R * 0.06, R * 0.0, R * 0.035, 0, TAU);
        c.fillStyle = "rgba(255,255,255,.6)"; c.fill();
        c.restore();
      }

      /* The brow marks — the two black crescents the icon wears over its eyes,
         lying on the bulge of each eye on the snout side, arched high so the
         face reads as delighted, never cross. */
      c.fillStyle = "#1a1d0e";
      for (s = -1; s <= 1; s += 2) {
        c.save();
        c.translate(EYE_X * s, EYE_Y); c.scale(s, 1);
        a0 = -Math.PI * 0.86; a1 = -Math.PI * 0.3;
        c.beginPath();
        c.arc(0, EYE_R * 0.1, EYE_R * 1.42, a0, a1);
        c.arc(0, EYE_R * 0.22, EYE_R * 1.22, a1, a0, true);
        c.closePath(); c.fill();
        c.restore();
      }
      return cv;
    }

    /* Sprites are static: built once for the life of the creative, never per
       frame and never per round. They are drawn at fixed sprite px from
       constant colours, so nothing about a layout or a level changes them —
       and metrics() runs on every reset(), where rebuilding them threw ~50
       canvases (~3 MB) at the collector on every replay. */
    function buildSkin() {
      var t, h, s;
      if (headSprite) return;
      plateSprites = []; rainbowSprites = [];
      for (t = 0; t < TIERS.length; t++) {
        plateSprites[t] = [];
        for (s = 0; s < 3; s++) plateSprites[t][s] = buildTierPlate(TIERS[t], s);
      }
      for (h = 0; h < HUES; h++) {
        rainbowSprites[h] = [];
        for (s = 0; s < 3; s++) rainbowSprites[h][s] = buildRainbowPlate(h, s);
      }
      headSprite = buildHead();
    }

    /* Per-block screen pose, rebuilt once per frame and shared by the plate
       pass, the gloss and the tail tip. Module-level arrays: three walks of
       the body must not allocate three arrays every frame. */
    var bsx = [], bsy = [], bang = [], poseN = 0;   // poseN: blocks posed this frame

    function poseBody(n) {
      var i, fx, fy, bx, by;
      for (i = 0; i < n; i++) { bsx[i] = bodyPts[i].x; bsy[i] = sy(bodyPts[i].y); }
      for (i = 0; i < n; i++) {
        fx = bsx[i > 0 ? i - 1 : 0];         fy = bsy[i > 0 ? i - 1 : 0];
        bx = bsx[i < n - 1 ? i + 1 : n - 1]; by = bsy[i < n - 1 ? i + 1 : n - 1];
        bang[i] = Math.atan2(fy - by, fx - bx);   // headward, in screen space
      }
    }

    // The tail has to END in a tail: without this the last plate reads as a body
    // sawn off mid-stack. Drawn before the plates, so the last one laps over it,
    // in the colour of the plate it leaves.
    function drawTailTip(n) {
      var i = n - 1, r = blockRadius(i, n) * 0.6, a = bang[i] + Math.PI;   // backward
      var tx = bsx[i] + Math.cos(a) * T.block * 1.15;
      var ty = bsy[i] + Math.sin(a) * T.block * 1.15;
      var nx = -Math.sin(a), ny = Math.cos(a);
      if (ty < -110 || ty > view.h + 110) return;
      ctx.beginPath();
      ctx.moveTo(bsx[i] + nx * r, bsy[i] + ny * r);
      ctx.quadraticCurveTo(tx + nx * r * 0.35, ty + ny * r * 0.35, tx, ty);
      ctx.quadraticCurveTo(tx - nx * r * 0.35, ty - ny * r * 0.35, bsx[i] - nx * r, bsy[i] - ny * r);
      ctx.closePath();
      ctx.fillStyle = shield ? hsla(hueOf(i), 85, 36) : darker(TIERS[tier].stops[2], 0.6);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = shield ? hsla(hueOf(i), 70, 14, 0.9) : rgba(darker(TIERS[tier].stops[2], 0.25), 0.9);
      ctx.stroke();
    }

    /* THE GLOSS. One white line down the spine, set toward the lit flank, over
       the plates: it is what makes the body read as one lacquered hide like the
       icon's rather than as a stack of coloured tiles. */
    function drawGloss(n) {
      var i, s, ox, oy, pass, started;
      if (n < 3) return;
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      for (pass = 0; pass < 2; pass++) {
        ctx.beginPath(); started = false;
        for (i = 1; i < n; i++) {
          s = -blockRadius(i, n) * (pass ? 0.4 : 0.34);
          ox = bsx[i] - Math.sin(bang[i]) * s;      // lateral: the spine's normal
          oy = bsy[i] + Math.cos(bang[i]) * s;
          if (started) ctx.lineTo(ox, oy);
          else { ctx.moveTo(ox, oy); started = true; }
        }
        ctx.lineWidth = headRadius() * (pass ? 0.1 : 0.26);
        ctx.strokeStyle = pass ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.16)";
        ctx.stroke();
      }
    }

    function drawBody() {
      var n = bodyPts.length, T2 = TIERS[tier], i, t, kx, shade;
      /* The plate is scaled ACROSS by the body's radius and ALONG by the block
         spacing, not by its own aspect: that is what fixes the exposed band at
         exactly one block, whatever the viper's girth, so the layers stay evenly
         stacked from the nape to the tail. */
      var ky = T.block * PLATE_LEN / (PLATE_F + PLATE_B);
      poseN = 0;
      if (invT > 0 && Math.floor(invT * 14) % 2) return;  // blink while immune
      // dying: the tail end has already been torn off, block by block, and the
      // last of it goes with the head
      if (dieT >= 0) { n -= crumbled; if (popped || n < 1) return; }
      poseBody(n);
      poseN = n;
      if (dieT < 0) drawAura(n);

      /* One soft pass for the whole body, so it glows without shadowBlur — and
         as ONE stroked spine, not one disc per block: a disc bulges out at every
         joint, and that row of bulges is exactly the bead silhouette the plates
         are here to kill. */
      ctx.beginPath();
      ctx.moveTo(bsx[0], bsy[0]);
      for (i = 1; i < n; i++) ctx.lineTo(bsx[i], bsy[i]);
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.lineWidth = headRadius() * 2.4;
      ctx.strokeStyle = rgba(T2.glow, 0.07);
      ctx.stroke();

      drawTailTip(n);

      // TAIL FIRST: every plate must overlap the one behind it — that ordering
      // IS the imbrication
      for (i = n - 1; i >= 1; i--) {
        if (bsy[i] < -100 || bsy[i] > view.h + 100) continue;
        t = i / Math.max(1, n - 1);
        shade = t < 0.42 ? 0 : t < 0.76 ? 1 : 2;
        kx = blockRadius(i, n) * 1.06 / PLATE_HW;
        ctx.save();
        ctx.translate(bsx[i], bsy[i]);
        ctx.rotate(bang[i] + Math.PI / 2);              // sprite forward is -y
        ctx.scale(kx, ky);
        ctx.drawImage(shield ? rainbowSprites[hueIdx(i)][shade] : plateSprites[tier][shade], -PLATE_PX * 0.5, -PLATE_PX * 0.5, PLATE_PX, PLATE_PX);
        ctx.restore();
      }

      drawGloss(n);
    }

    /* The head, once the run is over: a limp tongue hanging out of the snout,
       and — on the drawn fallback — eyes crossed out at the sprite's own eye
       spots. The tongue is drawn in SCREEN space, not in the head's: limp means
       "wherever down is", whatever the skull has rolled to. `sn` is how far the
       snout's tip stands ahead of the pivot, in design px. */
    function drawDeadFace(hx, hy, a, k, sn, painted) {
      var t = limpT(), s, e = EYE_R * 0.62, mx, my;
      if (!painted) {
        ctx.save();
        ctx.translate(hx, hy); ctx.rotate(a); ctx.scale(k, k);
        ctx.lineCap = "round";
        for (s = -1; s <= 1; s += 2) {
          ctx.save(); ctx.translate(EYE_X * s, EYE_Y);
          ctx.beginPath(); ctx.arc(0, 0, EYE_R, 0, TAU);
          ctx.fillStyle = "#fff4de"; ctx.fill();
          ctx.lineWidth = 3.4; ctx.strokeStyle = "rgba(3,17,12,.9)"; ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-e, -e); ctx.lineTo(e, e);
          ctx.moveTo(e, -e); ctx.lineTo(-e, e);
          ctx.lineWidth = EYE_R * 0.4; ctx.strokeStyle = "#1b0a10"; ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      mx = hx + Math.sin(a) * sn;                       // out of the snout
      my = hy - Math.cos(a) * sn;
      ctx.strokeStyle = "#ff5d8f"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.quadraticCurveTo(mx + 10 * t, my + 34 * t, mx - 8 * t, my + 58 * t);
      ctx.stroke();
      ctx.beginPath();                                    // the forked tip, drooping
      ctx.moveTo(mx - 8 * t, my + 58 * t);
      ctx.lineTo(mx - 20 * t, my + 70 * t);
      ctx.moveTo(mx - 8 * t, my + 58 * t);
      ctx.lineTo(mx + 2 * t, my + 74 * t);
      ctx.lineWidth = 4; ctx.stroke();
    }

    function artImage(key) {
      var img = typeof ArtImages !== "undefined" ? ArtImages[key] : null;
      return img && img.complete && img.naturalWidth ? img : null;
    }
    // The hurt head under a red filter: painted once, on the picture's own
    // alpha, so the red stops exactly at the silhouette.
    function hurtRed(img) {
      var c;
      if (hurtTint) return hurtTint;
      hurtTint = document.createElement("canvas");
      hurtTint.width = img.naturalWidth; hurtTint.height = img.naturalHeight;
      c = hurtTint.getContext("2d");
      c.drawImage(img, 0, 0);
      c.globalCompositeOperation = "source-atop";
      c.fillStyle = "rgba(255,0,36,.68)";
      c.fillRect(0, 0, hurtTint.width, hurtTint.height);
      return hurtTint;
    }

    function hexHue(hex) {
      var h = hex.replace("#", ""), r = parseInt(h.substr(0, 2), 16) / 255,
          g = parseInt(h.substr(2, 2), 16) / 255, b = parseInt(h.substr(4, 2), 16) / 255,
          mx = Math.max(r, g, b), d = mx - Math.min(r, g, b), x;
      if (!d) return 0;
      x = mx === r ? (g - b) / d : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return (x * 60 + 360) % 360;
    }

    /* THE HEAD WEARS THE BODY'S COLOUR. Only the HIDE is recoloured: a pixel
       counts as hide by its hue (the lime, past the cream muzzle's yellow) and
       its saturation (the eyes' whites and the dark brows have none to speak
       of), so the muzzle, the eyes and the brows keep the painter's colours.
       The hide's spread of hues is narrowed around the new one, so its teal
       shadows do not swing to a second colour on an orange head. Built once per
       face and hue, on first use; a picture the canvas cannot read back is
       left as painted. */
    function tintedHead(key, img, hue) {
      var id = key + ":" + hue, cv, c, im, d, i, r, g, b, mx, mn, dd, h, sv, v, w, nh, f, p, q, t, k;
      if (Math.abs(((hue - PAINT_HUE + 540) % 360) - 180) < 6) return img;
      if (headTints[id]) return headTints[id];
      cv = document.createElement("canvas");
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      c = cv.getContext("2d");
      c.drawImage(img, 0, 0);
      try { im = c.getImageData(0, 0, cv.width, cv.height); }
      catch (e) { headTints[id] = img; return img; }
      d = im.data;
      for (i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        r = d[i] / 255; g = d[i + 1] / 255; b = d[i + 2] / 255;
        mx = Math.max(r, g, b); mn = Math.min(r, g, b); dd = mx - mn;
        if (!dd) continue;
        h = mx === r ? (g - b) / dd : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4;
        h = (h * 60 + 360) % 360;
        sv = dd / mx; v = mx;
        w = clamp((h - 58) / 10, 0, 1) * clamp((200 - h) / 15, 0, 1) * clamp((sv - 0.3) / 0.15, 0, 1);
        if (!w) continue;
        nh = ((hue + (h - PAINT_HUE) * 0.4) % 360 + 360) % 360 / 60;
        k = Math.floor(nh); f = nh - k;
        p = v * (1 - sv); q = v * (1 - sv * f); t = v * (1 - sv * (1 - f));
        k = k % 6;
        r = k === 0 ? v : k === 1 ? q : k === 2 ? p : k === 3 ? p : k === 4 ? t : v;
        g = k === 0 ? t : k === 1 ? v : k === 2 ? v : k === 3 ? q : k === 4 ? p : p;
        b = k === 0 ? p : k === 1 ? p : k === 2 ? t : k === 3 ? v : k === 4 ? v : q;
        d[i]     = d[i]     + (r * 255 - d[i])     * w;
        d[i + 1] = d[i + 1] + (g * 255 - d[i + 1]) * w;
        d[i + 2] = d[i + 2] + (b * 255 - d[i + 2]) * w;
      }
      c.putImageData(im, 0, 0);
      headTints[id] = cv;
      return cv;
    }
    // The hue the head wears: the tier's body colour, and on a plated viper the
    // hue of the plate at the nape, so the rainbow runs on out of the head.
    function headHue() {
      if (shield) return hueOf(1);
      return Math.round(hexHue(TIERS[tier].stops[2]));
    }

    /* THE LOOK. The turn face is the head glancing aside, and the one thing in
       the burrow worth glancing at is a GOLD EGG: the nearest one ahead, within
       `eyeAhead`, and off to one side of where the viper is heading. Returns
       -1 / 1 for the side, 0 to look straight on. */
    function eggLook() {
      var i, it, dx, dy, dd, best = 0, bx = 0, by = 0, rel;
      for (i = 0; i < items.length; i++) {
        it = items[i];
        if (it.type !== "mega") continue;
        dy = anchorY - sy(it.p); dx = it.x - headX;
        if (dy < 40 || dy > T.eyeAhead) continue;
        dd = dx * dx + dy * dy;
        if (!best || dd < best) { best = dd; bx = dx; by = dy; }
      }
      if (!best) return 0;
      rel = Math.atan2(bx, by) - ang;
      return Math.abs(rel) < 0.22 ? 0 : rel > 0 ? 1 : -1;
    }

    /* The tongue, flicked out of the snout on every swerve, its fork swung
       toward the side the viper is turning. In the head's space (forward is
       -y), `sn` ahead of the pivot, `e` the size it is drawn at. */
    function drawTongue(sn, e) {
      var s = ease(tongueT / 0.26), side = dir;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(0, -sn);
      ctx.quadraticCurveTo(e * 0.08 * side, -sn - e * (0.2 + 0.2 * s),
                           e * 0.16 * side * s, -sn - e * (0.34 + 0.4 * s));
      ctx.moveTo(e * 0.16 * side * s, -sn - e * (0.34 + 0.4 * s));
      ctx.lineTo(e * (0.16 * s - 0.16) * side, -sn - e * (0.52 + 0.5 * s));
      ctx.moveTo(e * 0.16 * side * s, -sn - e * (0.34 + 0.4 * s));
      ctx.lineTo(e * (0.16 * s + 0.18) * side, -sn - e * (0.48 + 0.46 * s));
      ctx.lineWidth = e * 0.15; ctx.strokeStyle = "#173a08"; ctx.stroke();
      ctx.lineWidth = e * 0.085; ctx.strokeStyle = "#ff5d8f"; ctx.stroke();
    }

    function drawHead() {
      // HEAD_K, not 1: the face is visibly WIDER than the neck behind it — the
      // icon's big head, and most of what stops the body reading as a worm.
      var r = headRadius(), T2 = TIERS[tier], k = r * HEAD_K / HEAD_R;
      var hx = headX, hy = anchorY, a = ang, dead = dieT >= 0, lt = 0;
      var hurt = dead || invT > 0, flick = invT > 0 && Math.floor(invT * 14) % 2;
      var look = hurt ? 0 : eggLook();
      var key = hurt ? "headHurt" : look ? "headTurn" : "headNeutral", img = artImage(key);
      var w, h, sn, mirror;
      // the drawn fallback blinks out while immune; the painted head flickers
      // instead (below), because it has a hurt face to show
      if (!img && flick) return;

      /* Dying: the head shudders where it was hit, then rolls over toward the
         side it was carving and sinks as it gives up. It shrinks a little with
         it — a body going out of a creature reads as deflation. */
      if (dead) {
        if (popped) return;                               // it has burst
        lt = limpT();
        hy = deathHeadY();
        a += deathSide * 1.5 * lt
           + Math.sin(dieT * 46) * 0.07 * (1 - lt);       // the shudder, fading out
        k *= 1 - 0.08 * lt;
        r *= 1 - 0.08 * lt;
      }
      // halo — concentric discs, never shadowBlur. Kept faint: a bright disc
      // behind the skull puts the round silhouette straight back.
      ctx.fillStyle = rgba(T2.halo, 0.09);
      ctx.beginPath(); ctx.arc(hx, hy, r * 2.3, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba(T2.halo, 0.13);
      ctx.beginPath(); ctx.arc(hx, hy, r * 1.6, 0, TAU); ctx.fill();

      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(a);                                      // local -y is where it points
      if (img) {
        w = PAINT_W * r / PAINT_FILL;
        h = w * img.naturalHeight / img.naturalWidth;
        sn = h * (PAINT_SNOUT - PAINT_PIVOT);
        /* Which face: the hurt one while immune and dying, flickering between
           itself and its MIRROR under a red filter so a bite reads as a blow;
           the turn one while a gold egg is in sight off to one side, painted
           looking left and mirrored to look right; neutral the rest of the
           time, a swerve included. */
        mirror = hurt ? flick : look > 0;
        ctx.save();
        ctx.rotate(Math.PI);                              // the snout is painted at the bottom
        if (mirror) ctx.scale(-1, 1);
        ctx.drawImage(hurt && flick ? hurtRed(img) : tintedHead(key, img, headHue()),
                      -w * 0.5, -h * PAINT_PIVOT, w, h);
        ctx.restore();
      } else {
        sn = SNOUT * k;
        ctx.drawImage(headSprite,
                      -HEAD_PX * 0.5 * k, -HEAD_PX * 0.5 * k, HEAD_PX * k, HEAD_PX * k);
      }
      if (tongueT > 0 && !dead) drawTongue(sn, r * HEAD_K);
      ctx.restore();

      if (dead) drawDeadFace(hx, hy, a, k, sn, !!img);
    }

    function render() {
      var z, hy;
      // One opaque blit for the floor: the painted ground scrolling with its
      // veil baked in, or the drawn floor (buildBackdrop). The canopy's shade
      // goes over it in drawFar, at its own speed.
      dressJungle();
      if (groundCv) drawGround();
      else ctx.drawImage(bgCv, 0, 0);

      /* Dying: the whole world is pushed in on the viper. Only the world — the Fx
         layer draws outside this transform, which is why the zoom is kept small
         enough that a burst still lands where its block was. */
      if (dieT >= 0) {
        z = 1 + 0.22 * ease(clamp(deathT() / D_POP, 0, 1));
        hy = deathHeadY();
        ctx.save();
        ctx.translate(headX, hy); ctx.scale(z, z); ctx.translate(-headX, -hy);
      }

      /* Scenery, back to front, and ALL of it under the items: whatever the
         jungle does, a gem and a thorn are still painted on top of it. */
      drawFar();
      drawSparks();
      drawFlies();
      // The banks, the rails, every item and the viper are the elements of the
      // round's entrance (Enter); the canopy and the corners are the ground.
      if (Enter.begin(view.w / 2, view.h / 2)) { drawBanks(); Enter.end(); }
      if (Enter.begin(Layout.cx, view.h / 2)) { drawWalls(); Enter.end(); }
      drawItems();
      if (Enter.begin(headX, anchorY)) {
        drawBody(); drawHead();
        if (dieT < 0) drawPowers();
        Enter.end();
      }
      drawBolts();
      // the sky: over the burrow, the viper and everything on it
      if (dieT < 0) drawEagle();

      if (dieT >= 0) { ctx.restore(); drawDeathVeil(); }
    }

    function onResize() { metrics(); }

    /* ====================================================================
       THE GUIDE — every rule, as pages (packages/webshell/guide.js)

       Every page SHOWS before it tells, and its picture is painted by the
       round's own renderer: the module's `ctx` is lent to a canvas of the
       page's own for the length of one call (paintPic), and the burrow's
       pieces are drawn on it by drawItem, drawLog, drawTrapArt, drawGeyser,
       drawRock, drawBoltGround, eagleSprite — and the viper by drawBody,
       drawHead and drawPowers themselves, with the round's state lent too
       (drawViper) and handed back before the call returns. Nothing here
       reads a round that may not exist yet: the guide opens from the title
       screen's Help card, before any reset(). A page's level is the one the
       climb deals the idea on (CONFIG.ladder.from), locked until then.
       ==================================================================== */
    function paintPic(W, H, fn) {
      var cv = document.createElement("canvas"), k = view.dpr || 1, keep = ctx;
      cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx = cv.getContext("2d"); ctx.scale(k, k);
      try { fn(); } finally { ctx = keep; }
      return cv;
    }

    /* A picture on its biome's floor: the painted ground at its round size
       (a crop of its middle), under the round's night veil, in a rounded
       frame. `s` scales what is drawn on it, so a long viper fits. */
    function floorPic(W, H, biome, s, fn) {
      return paintPic(W, H, function () {
        var img = artImage("ground" + biome.charAt(0).toUpperCase() + biome.slice(1)), sw, sh;
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(0, 0, W, H, 18); else ctx.rect(0, 0, W, H);
        ctx.clip();
        ctx.fillStyle = CONFIG.bg; ctx.fillRect(0, 0, W, H);
        if (img) {
          sw = Math.min(W, img.naturalWidth); sh = Math.min(H, img.naturalHeight);
          ctx.drawImage(img, (img.naturalWidth - sw) * 0.5, (img.naturalHeight - sh) * 0.5, sw, sh, 0, 0, W, H);
        }
        ctx.fillStyle = "rgba(3,16,11," + GROUND_SHADE + ")";
        ctx.fillRect(0, 0, W, H);
        ctx.scale(s, s);
        fn();
        ctx.restore();
      });
    }
    // a piece of the burrow, as the round lays one: what drawItem reads
    function piece(type, seed, more) {
      var it = { type: type, seed: seed, p: 0, x: 0 }, k;
      for (k in more || {}) it[k] = more[k];
      return it;
    }
    function scaled(x, y, s, fn) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fn(); ctx.restore(); }

    /* A pictured viper: `n` blocks a block apart behind the head at (x, y),
       heading `a` (0 is straight up, as `ang` in the round), its spine bent
       along a sine of amplitude `amp` — the line a tapping player draws. The
       round's own state is lent for the call, and given back. */
    function drawViper(o) {
      var a = o.a || 0, amp = o.amp || 0, ph = o.ph || 0, pts = [], i, d, s;
      var keep = [bodyPts, lenF, tier, shield, invT, dieT, headX, anchorY, ang, camP, items, tongueT, dir, magnetOn, idolOn];
      for (i = 0; i < o.n; i++) {
        d = i * T.block;
        s = amp * (Math.sin(ph + d / 90) - Math.sin(ph));
        pts.push({ x: o.x - Math.sin(a) * d + Math.cos(a) * s, y: o.y + Math.cos(a) * d + Math.sin(a) * s });
      }
      buildSkin();
      try {
        camP = 0; anchorY = pts[0].y; headX = pts[0].x;
        bodyPts = [];
        for (i = 0; i < pts.length; i++) bodyPts.push({ x: pts[i].x, y: anchorY - pts[i].y });
        ang = Math.atan2(pts[0].x - pts[1].x, pts[1].y - pts[0].y);
        lenF = o.n; tier = o.tier || 0; shield = !!o.shield; dieT = -1;
        invT = o.hurt ? 0.01 : 0;            // the hurt face, on a frame it is not blinking
        items = []; tongueT = o.tongue || 0; dir = o.dir || 1;
        magnetOn = !!o.magnet; idolOn = !!o.idol;
        drawBody(); drawHead(); drawPowers();
      } finally {
        bodyPts = keep[0]; lenF = keep[1]; tier = keep[2]; shield = keep[3]; invT = keep[4];
        dieT = keep[5]; headX = keep[6]; anchorY = keep[7]; ang = keep[8]; camP = keep[9];
        items = keep[10]; tongueT = keep[11]; dir = keep[12]; magnetOn = keep[13]; idolOn = keep[14];
      }
    }

    // A pickup at 1.5 times its round size, and the viper wearing what it does.
    function pickupPic(type, biome, viper) {
      return floorPic(520, 260, biome, 1, function () {
        scaled(viper ? 140 : 260, 130, 1.6, function () { drawBiomeItem(piece(type, 0.7), 0, 0); });
        if (viper) drawViper(viper);
      });
    }
    // A row of traps, every other one up: the two stripes of THE TRAPS.
    function trapsPic(fire) {
      return floorPic(520, 220, "temple", 1.1, function () {
        var i, x;
        for (i = 0; i < 4; i++) {
          x = 85 + i * T.trapStep * 1.05;
          drawTrapArt(piece("trap", i, { fire: fire }), x, 100, 0.3, i % 2 === 0, i === 3);
        }
      });
    }
    // where a geyser stands in its cycle at `f`, whatever the round's clock reads
    function geyserAt(f, seed) { return piece("geyser", seed, { ph: f * T.geyserPeriod - runT }); }

    function guidePage(id, title, lv, pic, lines, rows) {
      var P = { id: id, title: title, lv: lv, pic: pic, lines: lines };
      if (rows) P.rows = rows;
      return P;
    }
    function lvOf(biome) {
      var i;
      for (i = 0; i < CONFIG.biomes.length; i++) if (CONFIG.biomes[i].key === biome) return CONFIG.ladder.from[i];
      return 0;
    }

    var guide = {
      chapters: function () {
        var lvS = lvOf("swamp"), lvT = lvOf("temple"), lvV = lvOf("volcano"), lvL = lvOf("lair");
        return [
          { key: "basics", label: Lang.t("The basics"), pages: [
            guidePage("swerve", Lang.t("Moving"), 0, function () {
              return floorPic(520, 300, "jungle", 1, function () {
                drawItem(piece("orb", 1), 390, 52);
                drawItem(piece("orb", 2), 150, 70);
                drawViper({ x: 300, y: 150, a: 0.45, n: 8, amp: 16, tongue: 0.2, dir: 1 });
              });
            }, [Lang.t("Vipera never stops. A tap changes her direction."),
                Lang.t("Walls push Vipera back, at no cost.")]),
            guidePage("score", Lang.t("Eggs and score"), 0, function () {
              return floorPic(420, 150, "jungle", 1.25, function () {
                drawItem(piece("orb", 1), 105, 60);
                drawItem(piece("mega", 2), 231, 60);
              });
            }, [Lang.t("Eggs make Vipera grow and score points. A stage ends after a set distance.")],
            [[Lang.t("Chain of 5, 10, 15…"), "+40, +80, +120…"]]),
            guidePage("bites", Lang.t("Damage"), 0, function () {
              return floorPic(520, 200, "jungle", 1, function () {
                drawItem(piece("thorn", 0.4), 330, 55);
                drawViper({ x: 260, y: 120, a: -0.3, n: 4, hurt: true });
              });
            }, [Lang.t("Each hit costs a life. Vipera shrinks back to her starting size and loses her bonuses."),
                Lang.t("Then Vipera blinks, and nothing can hurt her for a second.")])
          ] },
          { key: "viper", label: Lang.t("The viper"), pages: [
            guidePage("tiers", Lang.t("Evolution"), 0, function () {
              return floorPic(520, 200, "jungle", 0.34, function () {
                for (var t = 0; t < TIERS.length; t++) {
                  drawViper({ x: 191 + t * 382, y: 62, a: 0, n: TIERS[t].at, amp: 14, ph: t, tier: t });
                }
              });
            }, [Lang.t("The longer Vipera gets, the faster she goes. A hit never slows her down.")]),
            guidePage("armour", Lang.t("Armor"), 0, function () {
              return floorPic(520, 240, "jungle", 0.8, function () {
                drawViper({ x: 580, y: 150, a: Math.PI / 2, n: T.maxLen, amp: 22, ph: 0.6, shield: true, tier: TIERS.length - 1 });
              });
            }, [Lang.t("At full length, Vipera grows an armor that takes one hit for her."),
                Lang.t("To get the armor back, grow to full length again or eat a rainbow egg.")])
          ] },
          { key: "jungle", label: Lang.t("Jungle"), pages: [
            guidePage("thorns", Lang.t("Thorns"), 1, function () {
              return floorPic(520, 230, "jungle", 1, function () {
                var xs = [56, 160, 368, 472], i;
                for (i = 0; i < xs.length; i++) drawItem(piece("thorn", i * 1.7), xs[i], 100);
                drawItem(piece("orb", 3), 264, 100);
                drawViper({ x: 264, y: 205, a: 0.1, n: 6, amp: 10 });
              });
            }, [Lang.t("Red thorns are dangerous, but there is always a way through. The best players will notice you can even slip between two close thorns.")])
          ] },
          { key: "swamp", label: Lang.t("Swamp"), pages: [
            guidePage("log", Lang.t("Drifting logs"), lvS, function () {
              return floorPic(520, 240, "swamp", 1, function () {
                drawLog(piece("log", 0.5), 170, 70);
                drawLog(piece("log", 2.6), 350, 170);
              });
            }, [Lang.t("Don't bump into the logs.")]),
            guidePage("fly", Lang.t("Fireflies"), lvS, function () {
              return pickupPic("fly", "swamp", { x: 380, y: 90, n: 6, amp: 10, magnet: true });
            }, [Lang.t("Fireflies help Vipera collect eggs. They fly off at the first hit.")])
          ] },
          { key: "temple", label: Lang.t("Temple"), pages: [
            guidePage("trap", Lang.t("Spike traps"), lvT, function () { return trapsPic(false); },
              [Lang.t("Only raised spikes are dangerous."),
               Lang.t("The spikes creep out slowly, then shoot up all at once.")]),
            guidePage("bolt", Lang.t("Lightning"), lvT, function () {
              return floorPic(520, 260, "temple", 1, function () {
                var w = T.boltWarn, img = artImage("lightning01"), x = 380, y = 190, bw, bh;
                drawBoltGround(piece("bolt", 0.3, { st: w * 0.45, w: w, hit: false }), 140, 150);
                ctx.save();
                ctx.globalCompositeOperation = "lighter";
                halo(x, y, T.boltR * 2, "#cfdcff");
                if (img) {
                  bw = 240; bh = y / BOLT_FOOT_Y;
                  ctx.drawImage(img, x - bw * BOLT_FOOT_X, y - bh * BOLT_FOOT_Y, bw, bh);
                }
                drawArt("lightning05", x, y, T.boltR * 2.4, 0.4);
                ctx.restore();
              });
            }, [Lang.t("A ring warns of the next lightning strike."),
                Lang.t("Lightning can even strike twice in a row.")]),
            guidePage("idol", Lang.t("Idol"), lvT, function () {
              return pickupPic("idol", "temple", { x: 380, y: 90, n: 6, amp: 10, idol: true });
            }, [Lang.t("With this bonus, points count double. Now is the time to grab as many eggs as you can and complete full chains.")])
          ] },
          { key: "volcano", label: Lang.t("Volcano"), pages: [
            guidePage("geyser", Lang.t("Geysers"), lvV, function () {
              return floorPic(520, 300, "volcano", 1, function () {
                drawGeyser(geyserAt(0.68, 0.3), 120, 170);
                drawGeyser(geyserAt(0.86, 1.1), 360, 160);
              });
            }, [Lang.t("Embers rise just before the lava bursts. And remember, Vipera really doesn't like lava.")]),
            guidePage("rock", Lang.t("Falling rocks"), lvV, function () {
              return floorPic(520, 240, "volcano", 1, function () {
                drawRock(piece("rock", 0.2, { fallT: -1, p: camP + T.rockFall + 120 }), 100, 140);
                drawRock(piece("rock", 1.3, { fallT: ROCK_DROP * 0.45 }), 260, 140);
                drawRock(piece("rock", 2.1, { fallT: ROCK_DROP }), 420, 140);
              });
            }, [Lang.t("A shadow always shows where a rock will land. The snake would rather avoid a bump on the head."),
                Lang.t("Watch out, once landed, rocks stay hot and dangerous.")]),
            guidePage("fire", Lang.t("Fire traps"), lvV, function () { return trapsPic(true); },
              [Lang.t("Like spike traps, but the flames come out faster.")]),
            guidePage("amber", Lang.t("Amber"), lvV, function () { return pickupPic("amber", "volcano", null); },
              [Lang.t("Vipera instantly grows to just short of full length.")])
          ] },
          { key: "lair", label: Lang.t("Lair"), pages: [
            guidePage("eagle", Lang.t("The eagle"), lvL, function () {
              return floorPic(520, 320, "lair", 1, function () {
                // the shadow alone, with its penumbra, as the round draws it
                var shade = artImage("eaglePlane"), w = 300;
                shade = shade ? silhouette(shade) : null;
                eagleSprite(shade, 185, 165, w * 1.08, true, 0.22);
                eagleSprite(shade, 185, 165, w, true, 0.62);
                drawViper({ x: 430, y: 120, a: 0.2, n: 8, amp: 12 });
              });
            }, [Lang.t("The eagle's shadow tells you which side its next attack will come from."),
                Lang.t("Quickly get clear of that side before you get bitten.")]),
            guidePage("rainbow", Lang.t("Rainbow egg"), lvL, function () {
              return pickupPic("rainbow", "lair", { x: 380, y: 90, n: 7, amp: 10, shield: true });
            }, [Lang.t("This egg is so good it instantly gives Vipera a rainbow armor.")])
          ] }
        ];
      }
    };

    /* --- THE LEVEL LAYER (web target) ------------------------------------
       Two optional hooks, both ignored by the playable — the motor knows
       nothing about levels and neither does this module beyond these lines.

       `levelProgress` is what a level's objective is measured against while
       the round runs, and it is the same number `die()` reports as
       `levelScore`: the metres, never the score, so gems cannot pay for a
       distance. `levelWon` is the three-star finish — the web shell has
       already played the slow motion, and the round ends through the game's
       own result so the end screen keeps vipera's stat rows. */
    function levelProgress() { return Math.floor(dist); }

    /* `applyLevel(d)` is the web target's hook (docs/LEVELS.md): the level
       layer calls it with the level written in CONFIG.level, before the round
       resets. It picks the BIOME off the level number and sets every knob of
       CONFIG.ladder off the level's place on the saw (see CONFIG.ladder) —
       the manifest names no knob of its own, so nothing lerps them in a
       straight line behind this. With no level (the endless run, or a free
       round) everything goes back to the game as the file writes it, which
       is also all the playable ever sees. */
    var LAD = CONFIG.ladder, BASE_T = { lives: T.lives, hazardShare: T.hazardShare };
    (function () { for (var k in LAD.tune) if (LAD.tune.hasOwnProperty(k)) BASE_T[k] = T[k]; })();

    function applyLevel(d) {
      var n = CONFIG.level | 0, b = 0, i, k, e, r, sh;
      if (!n || d == null) {
        for (k in BASE_T) if (BASE_T.hasOwnProperty(k)) T[k] = BASE_T[k];
        BIO = CONFIG.biomes[0]; biomeIdx = 0; levelK = 0;
        return;
      }
      for (i = 0; i < LAD.from.length; i++) if (n >= LAD.from[i]) b = i;
      BIO = CONFIG.biomes[b]; biomeIdx = b;
      levelK = Math.min(5, n - LAD.from[b]);
      e = clamp(LAD.perBand * b + LAD.perLevel * levelK - (b > 0 ? LAD.dip : 0), 0, 1);
      for (k in LAD.tune) if (LAD.tune.hasOwnProperty(k)) {
        r = LAD.tune[k];
        T[k] = r[0] + (r[1] - r[0]) * e;
      }
      for (i = 0; i < LAD.lives.length; i++) if (e <= LAD.lives[i][0]) { T.lives = LAD.lives[i][1]; break; }
      sh = BIO.share;
      T.hazardShare = sh[0] + (sh[1] - sh[0]) * levelK / 5;
    }

    /* THE VIPER OF THE DEMO STAGE. The how-to-play stage is CSS, and a viper
       drawn in CSS is a stack of coloured discs — which read as a worm. So the
       stage's viper is painted ONCE, here, by the very sprites the round draws
       with: the painted head (or its drawn fallback) and the first tier's
       scale blocks along a gentle S, tapering into the tail. It goes into the
       stage's target node as a canvas; the SKIN sizes that node to DEMO_W x
       DEMO_H and swings it about the head (DEMO_PIVOT), so the body follows
       the head the way it does on the canvas. */
    var DEMO_W = 84, DEMO_H = 200, DEMO_PIVOT = 46, DEMO_K = 3;
    function dressDemo() {
      var host = document.querySelector("#intro-demo .demo-target");
      if (!host || host.querySelector(".vp-snake")) return;
      var cv = document.createElement("canvas"), c = cv.getContext("2d");
      cv.className = "vp-snake";
      cv.width = DEMO_W * DEMO_K; cv.height = DEMO_H * DEMO_K;
      host.appendChild(cv);

      var r = 17, sp = r * 1.08, n = 9, cx = DEMO_W * 0.5, i, t, br, kx, ky, shade, a;
      var xs = [], ys = [], ang = [], plates = [], drawnHead = null;
      for (i = 0; i < n; i++) {
        xs.push(cx + Math.sin(i * 0.62) * 9 * Math.min(1, i / 3));
        ys.push(DEMO_PIVOT + i * sp);
      }
      for (i = 0; i < n; i++) {
        a = i ? Math.atan2(ys[i - 1] - ys[i], xs[i - 1] - xs[i]) : -Math.PI / 2;
        ang.push(a);
      }
      for (i = 0; i < 3; i++) plates.push(buildTierPlate(TIERS[0], i));
      ky = sp * PLATE_LEN / (PLATE_F + PLATE_B);

      function paint(img) {
        var w, h, sn, tx, ty, nx, ny, tr, ta;
        c.setTransform(DEMO_K, 0, 0, DEMO_K, 0, 0);
        c.clearRect(0, 0, DEMO_W, DEMO_H);
        // the tail tip, as drawTailTip draws it
        i = n - 1; tr = r * (0.92 - 0.42) * 0.6; ta = ang[i] + Math.PI;
        tx = xs[i] + Math.cos(ta) * sp * 1.15; ty = ys[i] + Math.sin(ta) * sp * 1.15;
        nx = -Math.sin(ta); ny = Math.cos(ta);
        c.beginPath();
        c.moveTo(xs[i] + nx * tr, ys[i] + ny * tr);
        c.quadraticCurveTo(tx + nx * tr * 0.35, ty + ny * tr * 0.35, tx, ty);
        c.quadraticCurveTo(tx - nx * tr * 0.35, ty - ny * tr * 0.35, xs[i] - nx * tr, ys[i] - ny * tr);
        c.closePath();
        c.fillStyle = darker(TIERS[0].stops[2], 0.6); c.fill();
        c.lineWidth = 1.2; c.strokeStyle = rgba(darker(TIERS[0].stops[2], 0.25), 0.9); c.stroke();
        // the blocks, tail first: that order IS the imbrication
        for (i = n - 1; i >= 1; i--) {
          t = i / (n - 1);
          shade = t < 0.42 ? 0 : t < 0.76 ? 1 : 2;
          br = r * (0.92 - 0.42 * Math.pow(Math.max(0, t - 0.62) / 0.38, 1.4));
          kx = br * 1.06 / PLATE_HW;
          c.save();
          c.translate(xs[i], ys[i]); c.rotate(ang[i] + Math.PI / 2); c.scale(kx, ky);
          c.drawImage(plates[shade], -PLATE_PX * 0.5, -PLATE_PX * 0.5, PLATE_PX, PLATE_PX);
          c.restore();
        }
        // the head, as drawHead draws it, pointing up
        c.save();
        c.translate(xs[0], ys[0]);
        if (img) {
          w = PAINT_W * r / PAINT_FILL;
          h = w * img.naturalHeight / img.naturalWidth;
          sn = h * (PAINT_SNOUT - PAINT_PIVOT);
          c.save(); c.rotate(Math.PI); c.drawImage(img, -w * 0.5, -h * PAINT_PIVOT, w, h); c.restore();
        } else {
          // not headSprite: buildSkin reads a set one as "the skin is built"
          drawnHead = drawnHead || buildHead();
          w = r * HEAD_K / HEAD_R;
          sn = SNOUT * w;
          c.drawImage(drawnHead, -HEAD_PX * 0.5 * w, -HEAD_PX * 0.5 * w, HEAD_PX * w, HEAD_PX * w);
        }
        // the forked tongue, out of the snout
        w = r * HEAD_K;
        c.lineCap = "round"; c.lineJoin = "round";
        c.beginPath();
        c.moveTo(0, -sn); c.lineTo(0, -sn - w * 0.42);
        c.moveTo(0, -sn - w * 0.42); c.lineTo(-w * 0.16, -sn - w * 0.6);
        c.moveTo(0, -sn - w * 0.42); c.lineTo(w * 0.16, -sn - w * 0.6);
        c.lineWidth = w * 0.15; c.strokeStyle = "#173a08"; c.stroke();
        c.lineWidth = w * 0.085; c.strokeStyle = "#ff5d8f"; c.stroke();
        c.restore();
      }

      var src = CONFIG.art && CONFIG.art.headNeutral, img;
      paint(null);
      if (src) {
        img = new Image();
        img.onload = function () { paint(img); };
        img.src = src;
      }
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", dressDemo);
    else dressDemo();

    return { reset: reset, update: update, render: render, onDown: onDown, onResize: onResize,
             levelProgress: levelProgress, levelWon: die, applyLevel: applyLevel, guide: guide };
  })();

