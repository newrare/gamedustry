  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Vipera",
    /* One sentence, and nothing else: the stage under it shows the viper
       turning right then left on two taps, so the line only has to name the
       gesture, the character and the reward. */
    tagline: "<b class=\"w-tap\">Tap</b> to swerve the <b class=\"w-viper\">viper</b><br>and <b class=\"w-eat\">grow</b> for maximum bonus",
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
    intro: { logo: "logo", demo: "tap", caption: "" },

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
    music: { volume: 0.11, fade: 1.6,
             menu: { from: 0, length: 32, rate: 0.85, gain: 0.5 } },

    // All user-facing copy in one place.
    copy: {
      start:      "Tap to play",
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
       leaves, `eagle` sends the bird over the burrow (see THE EAGLE), and
       `intro` is what the first round of the biome says — a title and the one
       line under it. */
    biomes: [
      { key: "jungle",  music: { from: 32, length: 33 },
        hazards: {},                                               share: [0, 0],
        bonus: null,      mote: "#a8ff8e", shade: 1,    drift: true,  intro: null },
      { key: "swamp",   music: { from: 65, length: 27 },
        hazards: { log: 1 },                                       share: [0.22, 0.4],
        bonus: "fly",     mote: "#e9ff6e", shade: 0.9,  drift: true,
        intro: ["Drifting logs", "Swerve around them"] },
      { key: "temple",  music: { from: 92, length: 24 },
        hazards: { trap: 1, bolt: 1 },                             share: [0.2, 0.36],
        bonus: "idol",    mote: "#ffe7a3", shade: 0.8,  drift: true,
        intro: ["Traps and lightning", "Leave the glowing ground"] },
      { key: "volcano", music: { from: 108, length: 30 },
        hazards: { geyser: 2, rock: 2, fire: 1 },                  share: [0.26, 0.42],
        bonus: "amber",   mote: "#ff9a3c", shade: 0.45, drift: false,
        intro: ["Geysers and rocks", "Rocks land where shadows grow"] },
      { key: "lair",    music: { from: 138, length: 30 },
        hazards: { geyser: 1, rock: 1, trap: 1, fire: 1 },         share: [0.26, 0.4],
        bonus: "rainbow", mote: "#d59bff", shade: 0.6,  drift: false, eagle: true,
        intro: ["The eagle", "Its shadow shows the side it strikes"] }
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
      //   ffmpeg -ss 32 -t 33 -i assets/audio/music/vipera.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3
      music: "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAATxAAQJdwADBQgKDQ8SFRcaHB4iJCcpKy4xMzY4Oz1AQ0VISk1PUlVXWVxeYmRmaWtucXN2eHt9gIOFiIqMj5KVl5mcnqGkpqmrrrGztri7vcDDxcfKzM/S1NfZ3N7h5Obp6+7x8/b4+v0AAAAATGF2YzYyLjI4AAAAAAAAAAAAAAAAJAV8AAAAAAAECXf4/nh2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAA8AAAaQAAAAgAAA0goAABPAwgLwMQm7wNlHADfBI8DL5JAwsHvE4ifvwtgBJBC/+ZEyQIR5/4bCIuFsA5oY2//ALACcBy4fIKiM1//h6gW8CE5JlMhwuD//8QwbYsgVAgweoGmC3BdR///4YUImQQZQWkMZhhcXIZlovf////jgG8SQuAWwmhcAgAOsd4sZDCoTA+f////////8UuKOOwg/6+n9/n9/Xw+Pw2G4GFO8DgBRW59kgYAVaBuyiaocFAoZjUPs4hIDYMRT/+1LEXYASHhDYGVkAAmgvb/cxIkJmixokUDVCJpeo0JwkiIByeqVHLlQEbADsOXHNEp/NCc0IucG4xS44xKZE6voLTbQGcDVBOEAGYIh/6G2QAiIsskSBk+LAQA7/0Ot0/GYHSO8X4j8cgOeQAtDvHX////k+Wky+QQh58g5fUeMicMC4kAAhECJYACU0zvVS+uWoqSLNlUH65OU9YcWSCw2k2S++UIFkIHNlXsIm729N+vE0UAlrW2l3p7K7oymjNI2+gS1SslWNsNoOjWpdBP/7UsQmABNBo2P89IABhZCtvPYMOFVR60ch9nWoEzcae5zSXdbDUpLWjOA+sbbcgmSFxOhpyyTKpul4R1ZcvLKdUcueSvchD+fnCd6krrU5zpqWLr18Rwjvn2vBTEqvbqSlabcTV4NDOIEgJEEGIQDpw2Qx2KgcHg6jE0HcJzgqsryRc/ACyUJsrnSG14FM2tBinY/fd45zUBQMJwsIBgBD0MqkltXIzQpYN8KiooXDqiywVNvJE3rZY5tTkKdt9ez03mHVPw4EmdQpCjRySIgg//tSxAYAC8UlcAekZYFwjS79rDAQurSAVuOYJ3EDZJclLAIAFyxUtw4oYSIVV1MvhiBdRzUzT+PgAfDFTahgf1Hss8yP6ZkcPL//WKOUlyOLLy8qdihAhlALUrItjA2WMmTL/oEJpavCGqoSnYgCQUKmgrPA0yWapHVXi7opSnBNFDZCZMVS78bUiU6uXJmeXDgHK0Nh6KRVclS7FWp7vb1GDKSDDs2ZagodWp5Y0ZerQ1z7XJjNv9G5ltnh/Zyjrft6FQ5vNq11srBnibCBkPb/+1LEBoALIJl5h6RnwYqP73z2FTgzlCqNIZICMRBweZ0hISZRe1K2dpsxtZo6hyQaZqTGLPLz/4LKQ0Sl6PZcUS9FxTeQYW3IEA0HBVzDirKDVV9BSuqhPcrIZRxovieVA2KVZleLHEkUhkoUSwtiqOI9pkwW1BTFkq9fCmrh6BVzjS0mB613SygezmX53fw2S96nDoPNGSwoPUgEzpahjBQNtKnIMjA61xI7AqPkKboiwpEs8mZmyp3Y6pQ8ipZUZO9KBZcbckgggEkJOnyRnv/7UsQGgAvMmW+HjFSBgBVuNYeguIhME2lGp1E2N6RV075Pxo0WRc3gXhh/zb2qW1IVMVkoXJStPMcK/XdngDlymAXLJjhc4NVAM+OH1BVCjDGrsUPefJDFivWydjLUWO1dd2d/TeAU4nrICUSUSCkcfdsWcdLrFmU6IeuSIgbfrstbMbki30WI0Fu2/7DECn97XVLToHeOK8YyLdVd8NqPNmtYHw13t2cUbJFTx54SFc2hqbzJR0eh+wgkNIreOOGmi4v6/ZUCNQqKaLA4OYXA//tSxAUACmCZcYekaUFcEy1k9g0onShPJD0a3MTCGxDo0xi50TSJYINvIhXygDFmhykkP9w5WW6d8m7/eEU/oq80RWHWCMEwieq/WlF//k5D6HdDzIZDNGoqofjFEQmTpgABg6AVJMS5JY5T0R6NT513iuNgkmJH8+oVoqfqr69Bh6mD7TPh9cnjB7vsn+/y1VUgQwBJWKelFs97nxmkzEu5D2rIBiB1DJhqK7I94uCBaz6brAp0/AcHKIuLKVhJBZN30xd46jLCD1EMXw3hHOv/+1LEDgAKUHNrDDEDwVATLnWHiLixwGlYiOY/HjCF/Y8ftRdiIrDzQqkKBhYiqDAqMq7Sc2tovNF9amgiuu6HVtLgFxd7aP/R+b7gHLdHKgCSk4VGyB6YXDcNmGoGFSj8etxUIVdqRaPgJrK5jyVqq+xQR+1d2vKimKg5ksX9n5/ihBxq3pzw180LEhYSL4cUpYt/kT5xjMw9C/Wn7NKVAbhxcSAAASinM9IGKnkLR6GPUa0TKsuya3ltK+yjsBDl7hlWYD7OX0fpi6NhnSTocP/7UsQYgIoYZ2+nmHBBQIvt9PYMePTQC7J1PxO/1bup8Pixso95pcmohl+/7y5MAIICzdBAlGppMAKMBdL2kUPMUQhsnVCgdPhq7TU4z048altuMXh4BnT5M9ZuBUYE1hc++AwYBBxggRr5XWjy9+qdFCYBJr7UHD1SxQifGGBSKLz//9QGqJpoEAAhOEkoMPAIDkUxW8QcUIStDfnVo31fwT1xCa5F/7Oo+q1NCYleGVooFjgBnp5D0uDi20Br/qe+tz0DcudiNwpQeetxFNdV//tSxCYACihdb6wxAcFAEG1xhg0guiHHu/rCtyiMEAAUSoUYaKw9kdtnlt9ViBghVBA3vpyRpYkcVcV5kCxNzOBEOEqUUHZVfeZQURyELIQCYiG041KrWU8mlBtiQDZPf5FTj8nkkft/auoGpJZIZTzSTUvLkQ1rLYHEchmKBXCTGLDoZmGqCd5X+zwJDucd2TEVbo5uY9fuhiigUcSSfOyuongqwBEA4Z8mrVNZ71KUavEJCLLf9XFrX2R67FA1VRqIgEAFQsLTVht0WGMDvsX/+1LEMwAKdGN3570HAUAU7bWGDPB4UHmuB+MH6l8b8h+uRT8mW1c/TcOVOn5uwm0gRwTPJCaJ/2lwmX/xp0wf/D5rk93YVt0I5+3dY3J19/tdTQWYyiQAACTICzIU4F+kR6dSj43lCHUTdvc5N+Y07tTNrsFjsThbI5Hzu6Ua7CoVNAtCcxl9ZwiYDRS9CNoFLHnnV1tcqgQVpVLxiXUO7VqbE+kCVWyFVBSDRSwE9IPOcrScZP2VSkCAlBO3YPEm+ISRK/LneK025ay5i4MUFf/7UsQ/AApAcW2nsKlBSA6ufPEOULq9uPe8QAFuNIQfNirgWRNn3VKv8DNfCCv57ELtEoG4s0IMHIcVDKmejRQJKUpIJTZ4WHPUuTg8D/DgDkLqzlFmeQmaCjzMiQfY1Q3FPvwQBHAGBCscPYBD6jZOPUbH5R9CXQ/qBgnFN9PYoftONuWgdb4nNmr1MH3Ug2a3bNoEAlxems4vU4JYhKvSK5QmNLqXERiaXD6hOzXZHJCzKhSK/ql3c6uno//72yJ7//uSiNXdCJ7b/rTSk/c8//tSxEsACoRPcaw8Y8FKpzA09Ikk9J3JnQOHwgTAeX+KrSovya0gWVYRFeKR6nlOLEqtOmDLM8Tr8QvR6YM4S86UVMs9WZ+Yxn4c4xyTQK6mIc8klKQbDSHKZdqtuCfyIswSyR6rtQmOo9UYeTFbtwsCErS2tAVMM8XjSjFOPVOb6g0NHxIeAMCGUPshmg8Jmt1wBns4DSOVLyw4rBBtSCCIo64nC7FA2p80QSsnYRFWb+CnvUj0fq+u8EhcNme4NalqGRd7ulSaJJgOqwpBmKT/+1LEVYAJZGNvB5hMwUUM7jD0jOjRUDo7sEeS0DQRgP3YR1D72vzpv65DVZ3dAYVW3yVej1gNzw0+sRh48pYbZDu5xASS0gWJRgryox37ssuz3dizDEans/1iEJkABAAgBQ9xtmmUSvF7HDYHkrzjdxVMuSy7YvQzhDvGtgbctM1s8hyg/m9z59FAqGQULAMY1RZdg8KFTgkMeaAeT9qf71U56313QKpLO7X91TUBVpJ1SJKM3cQckyEpmiVlLkrDcF9OrA40YA2rBlj7Sofbc//7UsRlAApsbXmmBHYhSA+tdPMNwKxKjVszzG8zM0UZ6yJZhq9DwgHYRJB4uLFDIoA191H416CrGdVOwdY4jdb/b/7AMBQoAiPEgku8CYWkIPtIOMxRjrqr3B1fG/4lY7mp67FYkYLl2c2JaBQsDzg+58LLcwXIsGIQSUKhJpHP0OHknaLDiTrGnoojgeN7q9Vz+c3OT9wEGyko8gAAugppZUCfB9noQgl6LOOC2HcIqCHF56pFnj7LWdmxW0zXnxXWytPjJr5DUpIII6PiIaCI//tSxHAAClCPd+ewTIFNiW489hjYuUEwsom5QOrGmU1rtET9Uw4kvrDmraJX79tWip+uZW/oABjpScIAITYwx15NPzTU5pkTHY+51umquwzn61vKLYAiDTActQWEMQMu+/19a63Sm0ZWbZtqJrfIb0yLZb4ymIQJCOTUGdoiS1wUyqRYECRpIGJbB6bFDN/QnTUoKRHxNElNTD1qNzPCGgtCRl5ZTGYZVzGUW2olyEoavp9kia4Z9RmcnHe8FO+Fv5jwNUvSM5Ztm/ENC5h7+w7/+1LEewALYH9pp7BtAW2UrTWDDiBd/Y8O2GPGt0txahVQutpgYxVQRbd2iyqWom49ogXIM7bS6NjLEiBRAAADg4heXLeUJlHQXhbSbG3UQxHBDIjMQxEXEnoBlhCoUypswoJ2+vvIFjJEHoruzSBUu6ZZ/193qI5BBiVHOGFr5yFeImlf+Su1E26DP9u76P/V3w72hvz3z+DbO72Hmarx38sO+dUCNHdUhTqbJJUHecJhqI70REJ0ZBytqCfGY2KezUzqFjenw+pP0tokoyUmb//7UsR9gAyc1W2nmHLBpZMsZPWZgeLp6KU7fRR8thtcmpJU4hF5H/5beiESXg/ASQ33NBMO6Rrkhdz3OtxhNIEHkWB1xaeSgnt0RE/XeWAghYUABsM0LSDsVbYTUcIgZZB8/09IZYEihS1YTVLwtpSJYgXP2l7Rukq+VOzunBf/zKdrfDphDvB2nRAp7ztiAMFXzxUNHZDeSFpoIR4IjykZSwJILUDUlqkEUKFp4gd2HV3VKhEDFAGCAAAGHcryfl04AaADwXvBaEBZZGl8C+F4//tSxHQADJS9deeYcuGWEiyw9hjolkEQzEa4p+HDIQWh0xBtfYaxyCDFmW7lJAIYU5/H+WkZDOeDQXKqexOaLkm0gN+8keMWoRqcpeS7O7/s6QwXEayQQSm8WxBvylQyyQLsrCQiIZvmhbJWpLH41YSY6/GRasohODEH4US71Hc7apJeV6IdmdSgpqT2Z2o6yb6aqhEZRIKlleddCUQtX/r19utWpVk96eqKQ+jIPOs/WSn1ujp/pgBQxAAGxk5EIJlYyCPRXUhooaDVQIdE5FH/+1LEbIALQKtlzDBlgZct7TT2CSEQWAxH2PkUr5z7z7S+UeJH3IjLFxZl+cPKNtI2ruzkpJgenV3c/3Lf/8UUij7W9PqGWu1HMOwaEiAltY8XG0V+9YQRqCiIABCgECpc/sGODcSyxEU2j5QWh8P9QjzmOKynbZDxexxathJtGVByqOyqc7KoooTJbSt21yi9Z0TdqN09lyXT+yalQ6Dntwm4zDig60QiFw8VlN8gIaAAAAXA+A6C4Kk9U2pWailZINT5gsXXnHKrui665AOnjf/7UsRqgAtE2WMsMQHBXyAs9YYUeBSZm+HmDAxKq5PblVAG26DJTCxzxAG1rHsrRaIQXPtQmseWh/3uZay2V7lLemqsykmyKCAQAlAqRcMrc4Ba0lCG6VUCaBygqZgQONLnL+UcGZxIzXkCz+7KRh0TKnPUUgGHGGCBJ8Fx4aS/Fa0yxM8rS6DCRNIuLtRWizsp2cSUqcZpCAgADA4SOBQCShdm0iFQDdSc3eojVRLmDCM4MD8eBY2v07XIjAqgTD+tRKbIOnJMzKggWFlp6gEP//tSxG+ACmiNZUeEcoFLD+zphgx4pisUemjdYgllraDycJ2z62xhhAsL/7k4w+3+Xc7nZD3wdPtEEIzcvf/e23/PqIJrBFJmOuLZDmIZDvr3dtJMIcmmIGHlYeTPTMkmshUNB6bYnn7OTYhAP4fDrpyQAXLuJ8KSTk5zEeqSyXbW+LJh5JCe6tWaLrFs4tbx48l75z5Mff+ZCdUTk4EiIpN8jX+6KH+kvK/tsyEfVXRri5ZPMg8rJxbIZqORqgYFyLWMYqlKJJK1AjvgEQGC0Az/+1LEeoASSZ9mx7DHwWks7qTwjzDzhJEB4DgKlEG2kAmPQYDaiTUIorimkl1G3aw1aGKGnj59gGYlCQCDUuooKLEqVjCa4uCFYuizWUu//CzhohtQQU4k82zira7mZJKlAgiQVllBCJJJJL6DZCyNNvFdWEJhAEmbWIGuAmhKbZsps5QZgcgVeB3CIMk1i5phFShgwhJb5OaQiWaHXnkvOos/brO/otklojXEuDSA6pUAAJABCuiFD/MhizApWy5AhUVw4nRhRZ4VQI5TD87s6f/7UsRiAAqER3MnsSJBPIiuMYeYIJdJ/kIH+dEq4nJSMmpZ4weCQCuvhIkDIqQa9FE4SQhT9uxc6l7rRYRXbl/2K3Qyr2AEip+NIpIqUWsHjHPx2TpWHWC5whUaBzROWRI2jtlbkzJBcXPYDJvMebrw5AQAJ7hE5IqbhZwvWRXQmQ6dY3q5az6krDtoVNnbYspVaJk3WlXqrQgA3GAUCSCoS1s5DgQiSBYAR9AWE2pIJLJksKzXHXkeMHySDkMIZ1McNq6MJ8LNGUaeVi1IpxBC//tSxG4AChSNawyYaIFMjS509IjwyFoLqzdShG/s6dFynVNTvuiLit32jktr1spE2pRphp/thWQiAsMnU2DGmliq9GzcmW1nLVxMYhjpWqN4COkgfAOIuYLqWTdCGpZTaor1JFcyODiKiuvnodlOIvW4urW4kRZJnzwjQACLmHnR3k0E4eUAgAAUbMIkmsSBJSvxrEApowwbhYwPkQeCLk1pF4R5sSzvDkkx65K+35FAgHVAdREuP5sbU23TQbZIuosKGhCUPQrBqqXreyyArZT/+1LEegAKSI9rrLChwVkVLAGGIZhv4iaok24I3LrspCLCRhCAJLUoHIZoZjRUbAxDYToDb3wWcUkAzUx3YJiSjamV1JU7HMWZgiX3zcjbn2Gseimfh5U2ihE0sWQAogCDyBG6hJvL/sFnypjvyCmJvkUGRWKEogEgKErG+D0SzoNgIl4S4Bnbgfp6EMlForgpkxcwAo5U4YbLsxY75LMBMIQsIQg9EcsMm2FB7w5DiO1OWlKy+pZCyZOk0YFbxqT8+BDH9oh4DqEfh4F7nTcx2//7UsSDgAq4j2LMpQlBSBHtdQYMOIy7AmVFZ57C4AjyCEJqMMjQtuo6wmOm4qVWohVkSkC9toj+m31ZY5CudKOaZTgkXFiwhNBQXJtu0NeQY5wQ6rr6jtIzr9xhCIAAPiyxuDdltDZEYwwTDwVjcmuhV+tiQTOfgrNRXeTR2ltvc+C4wvMfEu6WtW5iu8ukfIBZY4WKGysXArkutz6g/KdCxzfT2ywLSVWc0qrSACqIiQ5spppvhTpVdpEbbMSBOM6+PImAWSRKCVZCprpNrxEz//tSxI2ACmRjcawwYeFKkuwBlJkoDEQ88yH1Ghc6JpVTjwRBlWs0GayIjKdbVODxcXSkg7V71IN1pj/9dYjAsz7ZL9QBEJAABgQworuowEiYqNxT5astkRSMiIwVGAZFJoLQFG1jgbEYL5cu8Zpjtn5Y7YYtzsdio/9yXRYiB4KPE4DSNEoMFggqloWJKCJl/9n/sLO+LAABIxAtTiAZFJLncIemj9RhzJNw3BIzVG0Eb6409/cYLE2gAsPe4XUJD4y8EiEQE51VSpY0kuZLP2r/+1LEmIAKHIFkzDDFAUwILrz0iSRaITgSPYz1auy1VfqbH1G1SpxjXtbuqgAZgAACBF4GbKavMlorSovWSVes1cVD6TzA7A004ZsnKHfwS40CrobzZg6ZhgxQqLzBwOG0oRqCPja+fdqFVlDDox8gqsVERG5Jvq/F/eK626ZQAAJCC6F/PI4UCspcxu8LAAqOfQclcQjFymqbj1kfbwf2tLQrXg8gtaG/lUN28pF9+e/O1QRQo65jaGHz4jMfrtdu+3c1G6i9y1rECjif6hkhTP/7UsSkgIpch2EspMjBQ4as9YewKESQCQnUlB5iq7Wl5U7IvD9o16ErGkcBjD6fwXsEE659pQYO+h6e/UGtlnD073NxUUe61UioVY5ecFBQecp3cIFkC5ftZ2E96wsLlAkg2Ay6GB041ysL58AgxAEgClYCeL1mSJ1nErFUCIkJWS5schR+ejGX3aAvHKlo6fKAIoVrCxAa4u4IFHpe4bUFighAlZOxEwoaUO+UB5gHi7QOZI0UWvOCcCLqGUpoFN/qUcIHXVoAIBEABYUbTxJd//tSxLCAilijXyywaQFAlOxphIzw6sysSmE84TvHjJXJ9dqbJXkraxmL8cZpGegHKIsa5U6u3JYXs4QPBQ0ejRwAdcO6Sk3Odnoa3IUe8M08jVHMJllTLOc0yPebXMzG+pq1nn63r6Gz9gJRawziZaqxUM/hn8cO+kTjr/kJSFKRIgqkXxHUh4PYNgSQAfTAZPSC5KZe9HHBHnfTPfYggFRpQhmrt2/yNVhvS3yUj+kxfxrKI0DdDWCGQHubt1jUTbnb701+RHXuyE6hlSqOqkj/+1LEvQALKI1lTDBlQWmJrTD0mOAe9ARUy2FiSwqi3oSYawaGEZCRLY7jLtko8ISlIcmCWhKJD75V1qfwuuoPVFHJGtjNMuTpWw5oR2rnhDAosjU+LsS4t2+6vxFZXv+4smEQWRQ1iABFcCUoZCAF3XlfefZu6SajwMMwJG0FD1ggJJxxI4/LLIz3oaiPI0xxFf0MjksDyirZpIPCwlPjmA0IzRBy6k51YFrHRVwr9f19Orr9NyUMLQFKkIBCTmVA3WoesLo1SFosDKwN1orMEP/7UsTBAA5JQWksMGnJSRStsMQOGKi6So4s1t3UcxJtyDL9zNRXNJcRBCHeVJVRrsnWj2T+U2ildW2tu8y2IKr9dRlardOmKm4AnPSBcUbb36AAG8IBSU2McfijIIFyWgkaHE+jJalUTdRQVvE6vlioK8X2MEIJ34XcrF6/wX9cmz70uXe5yNumS9shWvTSzb553O3T012au9ZUJ8EaSfJSeaW5bkpvZr96RG21EpJOUDq5gph8OpVQRrSCeTiN7K61ciyA6amcYLhTEMRse9I2//tSxLyACoC1ZyegbsFDj6vFhJkI7gzLMjPOShocsdBlnnD7m/0uTvX/5JDIrNRH1CpwjP5m6h6G7t4hORgdEQeuSDyzxVIplmKAAWQAAAGUoxH0+CeIEdJ2DPIIfhD5jgsBAZQwGRLMq0zIdBj0C7KdtliHpmwq5XQFtewu9ps3kWJG9soRIjUZZFy34/l9fs1H7LtHZ2E9ltUCAAAATo0m80AEUujSLstHWzCrw5pBu6yjlUHz1W3yaZZulKKypVarfYafjgwdCiAyJQEeOGD/+1LEyAAKmN9nR6SnwV+kbOjximhRV5F4el6+NCLXha5i3gRz7aUlBXdvq6AgA63vZeLalOFbD66xLAu0QglzsJUXQri5OChUpjZonrzVW4sN0noNIMYmiI9F9pVfU6FAqGYyyNLKxPhiM5FTnCMpkRvIrvufP/5OQqw4llRUtGhda5/Lb8Dmn5x3WOBWTohI+q/H08b+MmzuTc/a3DCFz4CZLCSLuotJ52kMHPxc7msJ5nKVtPz1oe5yZbz3GgAA60k0kSS4aSXVgtDga66Lgv/7UsTPgAuI3W9GJGkRP5IsKPMNeBjanNohOHafzihgO5A00KXfiWcemV3/mZ8262Y1mgkPcdspV33/qUocOGEKz61f/yfr0/7JsvQ5QFjNrXLHKbEUfkjKlpY2SlGMOSsSDcUZsjbimDvOtDAFcBFXslGeUqEuifJVlTkd3yXNtYtNb//bHciq1ahsJgVBTpmJMlfNLNodbjo9V+cI6RYhEBMqmEGtUlQeLPP0yhH8GumyxqOF1/JR7jTzWoPjPYpoBNpV5lAEmElOxXIwf0RO//tSxNcAi1BpYOe9AYIWM+yc8bJ5nSZaTOPEQ5niXnfWEtpnaeUxokOWAXWz5OZ7hT87EqapWo9n/0zjqSUsGyEgFEutZyKElmEN2D7JxmQy66acAIbA22ElgOOuwoAChGAAMrG70FplgqVsydxDEqtH3appZJ3pWtJ7NHncM2emiH0icN3HqOO9v68+h9ELer1ShAeCAwAvQ0JrHPFT5YF7WnHoSWUL206e75ZyjAwySSIuolnEp22I0aYAAAhQsgkpSl1UrmbwTR4qAesyYKP/+1LExQALvRdtp5hPAX4V7nTxptg8I7UWbWKjLCmF7pnOeKIxQxVVVf7HBB2y/72iYmpARWe6sT5W1uyu6b5L3ojTF0StXfp1ZSov/rwHeA0cGwsx6s6xiIuAv/6QAGaI00yCC6XCHOSUvD3Q3UwwoHKQkk47tqm5p1PjrrvyythtFDerXsTS8A1COzD9PgagdOgNFTO67U6qgtLxEScFcku96yRii681qSwVYbMjhyjZ71MZS0ZoFWtXAIJLjRBQILxpHQ4FMNtHvB2IU1o29P/7UsTEAAssr3GnmE8hdY4sJZYZ2FxdRR38UfBKg/xdaiscN0Hnv1oCRQ7jsi9IqoDg+1QdK5yJqJNKdTzc65jMfOjuNXqiRMLF12KN0Cgke5IuMIKr1MdvAABADCvCApUJkFQKM0CLFxL6WB5tXqk6QdiRGwak+xCqJf9LsOQmv30GGHYXEwxGdKMO6B9yvLn2LVZiXlO3qm6eXrq/W53bvs2jujp+RVFkISdzsL0Uj7qci1dDEIIoIDxS7et1laoKAAhDU0jCFhfnU9GCinRS//tSxMaAC7ExZ6eYT0F1lK109gl8askVIgL1d2CCRU6W5fxBZsIXSI5AyACK2QiXOfES+iAZxNc/ml5C0idMv+J/f3eu7yfJxPRLv/l25fEvxP7Sd9yRCRIRH9NwM/kNuIMTgAJPAgBKIL8DTH4exxMJRFp8smJ0em4m7YvnEK+KkiQciDWmYWcrZf1ffflqB1TUfEMS6+PIR3/v4pvb6/6f71mFvlm9atj3faXe7wUVzfL+84JcxNUkXeMNv92zv/s+7ZUEmMAhdSIY7AAIP5T/+1LExwALZH1rp5kOoZgtq9TzCbLko4CAuTChCKVhqwFsptLRkd5f6HMEQaekzEhEmGhGTHjwOETpm8iJind9wHDAuGStCbUf9en28ztLmCwPJfIrMwYVnpgR2aqWbVsoplEKw8zCS8R+hN4DNO8Vyys/rYCo6Z803gKtMbN8KCoiU/IPFPaKnqa0AQeCAHdYokhjhYcbHte3R+Z7MVYUHEhR0el5nRfNZZSqDSERuOeVEFCWPdflpMGXYAeoZIB2PEahvzF8J2Qd/CLgoCgVpv/7UsTEAAvFZWanvGGBhglt5PYY4Wbjby9m6m9cYvzdj/X6br0EOfF5VEym8USJV07VkXo7WkiIwtOntVaP/essRmclrEkmtu3fS2d+R9Jc6MtSJYEwmlBtDY69uiX7RpSuVt1MN7t5NPjkul9dkoCCi5F1JgXpe6B2VSJWWIocWtjeLR6vIPFVGZE4pYqpLy1avQ62hQSACdoh41MXA20N/2KDuFxP6ATFwi/gRM1OS5kC1LQ/jjiHFhFvX70W1k65i/Hrg+lZ6hgu56jCxM/H//tSxMIACiBBc4ekwwFPDS808w3YPIFgGNeFGG0bNKRbMe/NOt06HkhmncDnk3HvPMZwyRhGITAtXKIWJhMqzIm716/bFVpZ6XTV3nZMDO9070YahReD2Ol5FIPHAVUNYLTc4EkjuywenjnvrkbUjuPSUkt7aZatKf6lAMAAFDvya4G1ZO1NnSFrOpFFdXQ+XSoiKo8u2WDzOjD4fZAyHScbDhOvM8knDz0WRgxyrvhpZoUlAhISgwqFBww8YQTCSRZsGQcfa5ye5qFofKZIifX/+1LEzYAKWJ1tLCRnAUMN8PDwjo4QvfEryVb7kUdICDEDaLDKSdMCZNluFOymYGpwrpkcryUrX6dG9Eeh2svCnCu3wfRk251hKECtHpFDuZaWe7GDFtBkNCJlRE2LjgKhRXcpeEr3qb6Vf47oQKX0FHCFKyB96kaepQRUZpVoTXSSOYcyMJ3ARZLD8TBKeCOyM8eOLl4O5tgFFWFko9xt8j0Z8jWmmYwoRN7aJFY5hNAheUn2gRsYB1vKT5w04aDhxq3Q//s0aE4UjJVVoqVeGf/7UsTZgInYfWKsMQbBRw5rxZeYePRreC1k1bPqVMYZElsRgchLDdPUmKJLWd4knjD2BB7V3RU0TLg6PjWyeli4FDd2EPGkrt3hZ39lUVTBgEThIYoOhk6hxyGBiHpEiRCB2MMBBpJjR5axUq1Fz10bFVB3CBu/focNCkVc0tWoOOrgk4zWAvHgeaIeHaTomFChfmszHcTdti0MHIUYBBYGcMPvtlc35fqTTYsBRCCJ4KuAp8EgXPiKkVYD8JBIu08UUfcbLLarqLPY7elUSjWM//tSxOcAC/SLXMw9AcFrkKy1liC47Kd40gFRQd1IUAADAAAEIJxbtKBORbTjI4dTKUYdj3Y3E2alD4QcSLhqQl66eoXvVi3HcLrq198KACu14rYM4rGkOLmJRj4uZqRlSIxcgpZekF1X91De4nGIFd2j+TtMdUgqDb0b//rabd7ATZHF1oglWeqRMEGVIDVCvnAkSm7REEdOGnzEOKJ2vTD8F9raDTuHFUHm0dyOVpkf/+dohJcNhpC9DZwCPuVssaSEtSXdghFm6VjFD1kZ4wH/+1LE54ALNG9357DG4YmSLbDzDlTFfK3agUnIY4kSSSoJwtIahSuNtcopMJN6hVFpOtmYSiWXTH3Gm4xS3tQ+3eoZQ+ewOInXOrs31QEHY65rU0Z6ER2G/0WUcxmBFAM1yrb1iz1Kks8Ijvak3snBbLCiiRY8GgF0m0LqAb6YebIKTu47hQh1lPPi0KCFxLAqGkSngvxjVCPp1sQIrYjtgRHWNqtZv/wZr+Oev2lhBIQOjHtE7yg9R48ymQMPFxx6SyzzKDbxaQemt/VW3/btE//7UsTngAwUZWuMPQHhYhbrZZeMuL7f6QGIELEwyA4mo7LLwLnpcK5YII2lcaH5a04QWR+SCo/pNMjV6oGCj2BQ3OviBRa+rOi5t6SZ/XMg3HryDrKfe7PL4xzduVQ0yT/xTB36z8+9/Ydbi3X+bp2qmF/ImO3/7gCU5JAADdEc4sawJuBLDEvAUEY+HU6aHKEi4UsfEFtg3nWE3BzSA1a3sWZgnYWMBSVjDAOqWoVH0EAbOmBArkfX1EQJF7z41VDGkTou0CUwIF2PJgEAAULA//tSxOiAC6incaekaaGIGy508YqWuZCDEP5rKCAaAU1C7AAACVR1cTiMdyhKYNhVgSQbtA3ZaYoQE6IVUQMhGDHQhEkJOtEIeQimTbZtG9XRvqp+elf/71P/Qm/U7/RP/1fZG0Jznapz5yV6IQhzvuSXIU4h0h863t/EABhVBASRBIhQw+z6IETOcVEGMQEF7Uc4dRzYBSUT/Mwg9isOFhWjNFUa6NksaHRCCbyqDKSRCc2cEyJNla1ccxAfUY2RCQlESGaTbbmlIJqzklFzAv3/+1DE5oBLAINlrDBpAX8MrHGGDHnMNVuQlXx1EFmG616BIaYZcqwHTRJjTAMlmBZX0n1lGhYDopRSoFZU9Pxdy943Z26it3539thb8r8qVE510bjH0vlOvFwXPZEEgaICKQGsiTlUZ5FjWDeUijMWYg7McxsS6H8Lhv0HnHfJSsetwdzkPLplL8/8QNB1FVlhULjgSNDFPahriWSvx4oqnHkl2Fquid/2URRfphQZIwpUiBjIckgcS+XAsSyr0xRVMSSVYCkEdgjlLnqADGmF//tSxOgADDxpX0ywY8F0r601hIi5oulW+dVbPw7fSbVx/FCEGRxDfp01jQy9i6VjIMi12ksG+V4tIoQ3iUUrr2baBEJEAGYsZez0gDASACjDImIQO3itrYRg6YL6P0PwwSB15o0cFl4D9Vl8pQVbVgsx5WcoSB1K7KN1elsuV4fFGVfMMKNK9YvMkQ8OfIFcRvnd/X/o+5X0oQAZ5V66DAbbscKKOh5aHQLWxFqCjRwzbGZ4XiUWBewdEU9OkvI32mh5q8hJghX1jENDnFZ+KdX/+1LE5oATzZNjLCTRyT2Q7WD2DZhLzjmLBc6iTBwxdctTWuMnS6wCsNZVEY1WzTwMBKQEBrtEXRO7NuoQQXgQAUnSEKkYs7AwATmDKpRnBYBnvAvUmVXKHxJvVVn+OUFm6iTl3sWAoTH897cr9XT1xrRW1wXRtxjYs1iEkD7OPiiywHIvfqVVGXqQ3XrMbjFP0+4ABsCxWXv4zlEITsEEF7OhaV/flycsuHFeXCgwCVkk/eBnaU7EsvWqhQEJRHW/sIMZ7ss2XTbOdmI+Nj97aP/7UsTNgAskm3GHmQyhTZOsZYYVKEwCocZuO80MVNSFrqVLD6SoWxmLsbqO2IxQ9QKKpJJRcplh6VYVxvl6DYOMvq7ONT6SE6iu4DlDNNcLDX/AlFppFNtYneayIZR0Ua0+rTOyXRk/KSShVM6o+1v7//SjihL2u3VHQXEzjoq97+9YlBGMCbG2JKqsOMpKVaBABAASYvMiqFxVEEC4kVBZvVE1Z1YUHhQ5Qiskuy/PYr3MkLcnOgr/dJSctbQU8y+nQUPJA0VcGnRGVpJiwk3g//tSxNUACyCDaYewZ6FcEGwphiDwKVf//hWGsg/tF3pEAYCyj7r5S1CMWAHAAgAFqUFMSRXEnN0FYUAcjCe6rS90PaGfGHWXLlHoqCqbKZdLuB36Mf1udd2VOxUV601fkL5DNtzH5WyVy/ctC/r//opz34l5ckv6XPrmXu/TgBxHCACRQ5omc4XlhxaV3A7D8BE/FTQESDVFaRNNF0MBstApCUDsbCQ6NDGiHVOozxTQIyjD21PU4EClQL4Rd89f2v8/MoRodn/e1364swkFjT3/+1LE2wALFJlaTDDNQX4frOj0CeK4hX+cXJWKe5rt3//f37pTMoVOFmx1PElM8ovPADsVF+GEhGj5CBBXFCNZwDEtoKgilBuvy7lkJUHeXFJsNEpInIyporw0A2WtWUJs8yocqD5lEr90ZiIirU/z0zp7+T/5fWujGfGjSc5/5bGFyV1PfQ0r/vZ2u2TvTI8SqgCmclGWUShpJA4iRs4DKQY4C/oyV4f0zc3PJnynleFyZ1bCKmOC1aFJ9kwZr8zo4OGREe7RQFWvlpUEg1HBEf/7UsTcgArYjWFMMGlBojFsKPKOOQmRT1563sN+d52PAtLuMpfI+6wgAgQQJoptSKRAwkST4O0/RLsqJQm1EncOEC7ug2DIChFIu0J8orZ88YUKnAmzhgaeKpDSGBJTzxE2HA6ioXqSESxb/v96HgzKRV5Lss0Sw9iaAIJQARXWqtygSjTJHrBTA9tDjoQ2zOP0rl9ufpXUKtGS8A73MJKLxNxLYjkNdwlTra47y358NCEqTxr/0tnLAjBAXpiC21anBSieRLmGXFbrCNOhPirR//tSxNqADQWDc+YkZylEG+yk8w3YqFhI87qfASa1wjn+AiBBXK14fh3nEIMeifXCIV/PizjCc0rYU92+VTVCbEOpBh+kB6xqX8Oq1P4VBLDGWOMSgF3rcnZyGY9HJJWNgxapKVGwLmHlkymKDTdySKn+ilJVIgfRJFtFALt0FFHLgcMcg4Z5iD1EQ4GcPyj8kyAH1A/khA0CFLQSpa/jmxNkNnZTG1PNzw8GzlDqw7GpF82HiigItInMjKkg4xzjtAxymc/MYgBAjvUIHjpxN1H/+1LE24AKQGVlJ5hyQUYMrLT0jYiXNIACiBgAAgp5SbMaV6oMKEjoy6M+2JiMmup+3YllD9jKJ34Cpcaf8+90/teQqUzzBF25Qi76OwGZGflkdMkLIs0z8G5MiZKRk9aFCf2RKWQdiI4kSeiVkl3/5pMKRbi3peUyhUT7I6GF8H3DCbchAoTjRKaIUZElFU3C0rTRsb2anLJ5OH+oHQR0KmwFHEUKgHngsA+iBoHorPLFY31eYFuG53XzidvlfV/TXGBAOBUb0EbAA4GBDHRAGf/7UsTngAwEm1csPMcBchis5PGWnnAgKoyBIyi0J6bZ6//S/kJOfJ///BOotgMIIZRaohx5aj1uh2bUXl1cMYONhBYYEVIqmQActGxLkKoQ0VBUjTOHQfuJ15dMySDXYsW8qG5m/zuz1E/0Nv5EJaxBm7ZrKGRMFUS8Ws2StmnzMsFSi5gyURKvIYIl7Rau1ixkyoRLoQ6gIEKPU8ybvYIj5GxbB2qscwzUBGM2U29dF1QjpozyuUUIBK6uOhLnDVLhHiMWGkSzRzrF5i8GSpKy//tSxOcACvyFXyekbGIlNGt1gaa4KKNuUH0ssuwNMaoYocsiGZktg8JJyP5y4PlPnsdpHW5Z4NySnj5tzaGDxGcFi5lKqZI8D5Giwp72DiaUpcKrFgk/p7algVQqFCup/t1CyO310qKHqx0wx1hjD8NI4y9OwoeKa1WHJ+ndV7CeePO7qJJqCB4goAIC4aKGywH1n1vE7AwCDBVuOPAhE5JRQ4TSite/X31pcPDQW6XnBfW+1rXpqgg84AEqxd+GGRRh/mNO8MrFaItksX2XhnT/+1LE1AAL4WdrhgRVAjMqbWWEjthYwdfjD5IUjhUf75jucTgMopF/5Fsrfk33okkW1GnFlMDuAluIkXyPW8VVWSlRMeIrYv7nMysN5GpAAdWIujKLLcFDOUuEpVHZJL4/O0goKUTCmkEUwFfTsrm+8LR75PQ08PDBU2IWBlFCl0LWKAOsWDinmIYXT1+/jr12frr0KddhlhoOsQJom/VVACAgARLEXIeSYhhhl0J8lUPXxr5eErmmSI2o2lxF5BZ5ZBLWnsOyi82783u3uyclYf/7UsS8AApQWXmHsQMBQQiuYPYM4JMreTJgy94sEyi6aaZA2aF9g11D1P+tH0hL2q2rYkW0soQEWxLaAh2FLY+nQ7TeMMj6n6TJfGFmIL1zQfrb/s8kclz3nXMaM1CgUSI9hqLVyvUlNfaOJLGxOl9ZxylsN1lQyVWpyNiCzBPC3imS6WfxdyL1KgAEgAJqDAEufeIlSBOBebTXGi8DVpcsHIM2wS+9fZhP2mfkcCGN1dqPemP0bNWU2ygx7EvsxZmSfFQ+17RdRw1NREEzBJQP//tSxMiAilSbbQwwZ0FCCq1lh6GAH51K2FWrobFOjROOnVdYi00hJJtuDSWU+hLYlChmRL2qRJh1+DROzg/V60TlMpLzn2rQyGkWk8I1ZGhRcdD/QidDX/vmDixOJUGXgio6yR1B1Ks5X3K6d38tRR0bWITVIerhItJJ1Hk8kF4ZjKdKCRitMWHoYTLtvR3OBf8okyVP9kHQ5GGdIa6Pbnt27fAaUM1pncjsxnszXLbiP1CVp/7Fy8XqaFefJp/yeXOFzO5r+CM+Lx7b6z9gjif/+1LE1IAKUGlrLDzBwUqRbMmGDdiytfmK0AAAlFKMhUVa4s5O5j6RjH3niDBZulCw7Lonh4vaOsud1+AmMLkeaV1DTOHUGTnVw5nVcxxtfH9blJdfs8pQwPUqYwGOi4lCD1XB6xs86AlXF7a1T6WdFhShBypqiS6H3lGwUzQSgQDDdAukLBtn8KsqlpKpBYvgTqw4cA/phfTibppifZsT1NPZ1liFL1ToHDPV4ULaxlnK+Fazz67EDHCaVTpkA90aIkUjbKOK/A0q1rFSztaXh//7UsTfgAq0l2csJLCBQhUuqPSNYmXWxZAzNrLdJAAAQhCYUktANQTLJpidIcNYqmElyvC0oFr0NaJDII/YvNCjjggaU7nIWOVmwBlvXs5GwXFBCLwgQvAjoUP3JHoXH1ZFm4tzjxnT4v6/knJtRYbaaSYj1QASDEASSUU9c0l0BSOXBgOB4J4vfhLztHKufMy08xGTCgVTIoWZGk52jzrh4bPGPlMVyvhbWoQczcxckiVe5Eb1f7peZD2X/7v/7HTJO9UKFDgoLpPEhRdBbg7S//tSxOoADAklb0eYb6GGFmxdhg2gFgyu24gk+wgJSbbiIICiSSHujF0YpjKIClSUGDCgFmP14avqlm86Qy42VqancOtGX/Icx6WjZKDMF+3/+ERJHl4xmkB6SxYSlVYoee8usQsNr2sFltSFXWEtHFWnUqaeVMeOLgACAABScuftBRpRAOOoWM9W6qnADX7EdWlIIx5MOcFEX9yVEcRW0yDRoTYEM/qtHXY3pu3zOaYtTiH6dgOBlN/M+G1r8rTvX09ZOj0g17/P8/X6muySgd//+1LE5wALzKlpR6RNYVuMa82HmLjdILrVknEL1pVnsKaTTcuZCVOBflCagyYJ7JgUcJzE9aEhjC/JuSct6PrRDQC2NQ7uRB0yOFobPvvA1GAcTBxiDxFBuwwPRCrI0XjVnh3agICqhA1ahsrp4oEbQAp0/pEC7PVVGIAQApuSUowQ8QtprIYO04ydvxrYJxo8qYC+zBRu59IUP849Uyl3A2PINmsDjHou7GcjdP9/Xj8rTnelfM3Ktl45zpR4JIJIcOYNhcwp2yiIlWOOGULA6//7UsTqAgxVLWmnmFEhdRhtKPSNKqgTDJS4Yr6XoUYbTccvIPBI4/yLS5dFJHBiJ5kVE4F7tXCJx0R8MkXxF4ZMXayGYeG+Q4JzsP9/gcJlMCRF8lHiIQkWEXu1cgTT+z7JBrinCM+USkYscJy9oYTKQ+H4DevkDJyo4gdpwp5KALpHlK2KqNOeJCW/d2LvKw+Bn5m1AFiLVTXYhF2CJDgokTjbZGAjmgwAcGg4EwdBoMCMieTggXftrCgVDoGxgy2cHR8+IUU4a5o9j0Ie5iUd//tSxOgADBijX0wwbMlpkW1o842cpJjCM4HzhK5G/DTjFLEPwu6sDpMw0EJ43UQkzsjq8mAoDb0NWTft+SUp3hNPzmmYgUGOLdjeymaH+tlYZLNiWUaVI8EQp9u9OR8dvyoJDrhAWu9xhqup/KpNoLSeZ0cysqmZ2ZTMxZIkaVtV7/KB1Ymr+BNcv+qVlB0wRHOuEa1H8O2JEu9QpNsDVWoiVMFiqjWduZ9376wwfDR8cWc/ogABQAAAABiiS7bWIy/6ul1P4wBOUeDkQFIVBuD/+1LE6AAMGNFhR6RrAXOTLTD2DLwWYD/bW8TmNxAJAs+u/cjqxixRpsBiwmxWo4+uhgnopQsaut/7/221M1I/lhMD4bLDAYMZFAiWRGBHOC1gzYOYwVdjaqbK8lGoTHLcm1NoQyZ2JVVuRxgnk7giQgoSj+gKPAspHiy8KoOhUJxgSKrDafe4qgiIxc/SLCvbUmzI/v63r1nKBUxJf5sABCBGb8RRBwzFVUAUERMLTfJN9dIseLMBtdoOxHRm04+u7HqViyldxM+WuR2QIzvKkv/7UsTnABRdj14sJNOJS47ucPQN2Jsc7EZwXe8ksuFRuh0sFTx6SL2qohwu1N9XZbsUyokW2lga/1gA+SGGko6iEmLbdlfQc0H2D00G2sEKNUvPxdLOkxPgGb7irVToQPmQbmsMg2KQsVPOEQRbcSdsfExclMIUjFLzBQOOTGLlmsHBkbU/YkWhUeVETVu2O+sEIekWlFNpvoWGQrznOQWEuSqJ+qy4ug0iQMc4EHLdNVDkV0DpkVTw16LuESiyVYWapLbSpGwygPObQfYLABaK//tSxMoBinhZZ4wkyMFJDmvBhI4Q5iXONUxf390QObaxqIJ5podYbBM5BxaWLXWEkVI4lZlso2QgSGAmBNyDQxynGgKnsgIBf6Ow/9nfaTUR+DBqWxkhiQM0GhErldPJfZ5nZG21B2tVLdm7ucY5QjloiFxpD7lHTu1ftKLFkwu8hFjzEOPjZHnv9FUAQCjeQZmCami+yIxEun08lQaubSKQqN2rWcOF+tvpSKolGDqJK1rlucDxwEg5W01K54KDVb63BO+DgZeJyTnfcwslpdb/+1LE1QAK1H1jLLBJgV2KbWmGDKyK45C0cwLoU1VyO4WU5vE501IMWEUEoAASY3Ji+k3M5BJsSxrtq7IUfVHZ/ZiTMwEKitMUMP9Zca8w/JlfBM7vfxdvcFh2LnkVShyMoDBO7nct3M51+7XS6V3P7oUz9/KLmb/n9dzTS/+ifoif869Oflf+m72+73DpLCHYI8z7R+9VDbU8ZRJRQJhQGkfqtOUxkfKfiuWpmHDjPZXgtKJO2FjhsDaWpuulnilravrvZaowOwGiIMd1v58rKv/7UsTcAAtEW2unpKshcBhucPGKVtL8MrPI4UdZ7Ty6XC3UynC/bnl5nfLTqnf9/MvyLMr5FnT3pF4smCkLHNBJrxHN0T6QOShFlwWARsQRqXKjI+7jfPy7Tv6Z9AkH/M9vXJudfunl2x7nQz/vf7HoqV9xfPL/fsHxYCI5evMVLfayMqU1J3ojv2UqmdZEOmVVX+1d+/rmT/f7VIu2oOBYCHS/b27/qep/FQnhbQ3DWkSYCwMQ7BoKSYqHegiLSoJ4Nlrumqy7nEptQDMIOLcO//tSxN6ACxSLWsykcIG2rm009A3xOLW8LlLsgwEbiU9WHfPt6NOvNUKnXqbr0uMbXZIz2TtPnfcpJRPaw7222CAewfDKqbHCR+AUkkW6MMCwfhBzKPBHmW3HAmnyrV7pnbGdwsuZm1WLqCh0jtOO2BH7ddFBRZLr3D5v6I6P8hR9f3X+yDX29DJ99Ty7edKvdf5uhGyt0770Ow5MkGywd1kvpQAVoq/cFnq8kQHlbqyYdCIgiQMXxNuwmEcG68SrcyiautrYgD5sGv2dSigdpUf/+1LE2QAOKZNxp6BvqXgrbOWECilDjI4MrHZnqOpya3j31shRK9EWwdnd3fhwIvZWqDSn12p2I9/7UtbjiZG+3eCwOlj2ur+hIUNgpu7hLS7vC2kaVZuHk2oMuNanO/cWeyCgEso2dbj2vYXBm8RKLKXYfQVXtyj9dZQ37Ys1PoCOb+pd/oEL29E/waolirez3/FwQ5r1nHbK5ZAcHti6CdrvmUSgKhi5bLHOagGLQfCQMxVsm439SOpaf0pWkE/UJWGJ8cH9XKa4ADmPQrkwPP/7UsTPAAsM43GmDFFhbaws6PQWGFB6Tmd4UE4tRe7qPFjKvPqF2m2bnVp6jYOZkV9jxujofEFTvPAg4YskN3az7gUFiZtTo4wUvHm2S4Iqew4d1VanFBaPSIrNl4+sGZS58lK3apEXA0lus3nJm8c7XWspwqimktx7fUpq5nLIpBgaVyq3Vv+FGd/mCRzWY+U466t93/31IQjK9ianu/JeBAAkM0CKYcWZ19z0EAZmHEBBmBkJrScxad/ePIIE6gE0bA6520SWDx1YCyoaEOSM//tSxNMCDDk5WkwwS0FtJKy09IoYCXwINuZePBPKv3dMdAbf2NYnGiW6nAEBMzvBcciToE+IzuxAOCyFHLMki5JIfcsPoWhQvQ+Z3G5T4koTwxIpp70nNHQlMyRGXisXu48IZAyHFMg+bkn7cdKP+baEOjoxxIBNExSCA+mBiZn61GkUk9kztE1ySbRBGSZcTpm216X85fz3YYTCQThh/TUVVqOwmovuKXFYLrKpKIxQ9VptA2HQoTwAoS7to4B4Oz0UjvWQmFsUQWd4vkxOuXf/+1LE0oAMxONtphTyocUtbjTCj2W3sJmWVDCoWidBQyhbAi9zmDoAwBgAQgAJGgCgV5Gg44TS0VMISoiBmGr1lJT2uUtFNhSKLHrfE7UP3pYuCgiIYCvIqUqxxiadt5UcsUuvHkllTrEpHsMgOeC1zVFiQaoXquJXO1ANAwFpMRBcsrGwJ6qB74k+joS5vbN+JTMCY2FjB9iiznUKhKzIfb9ziEUhZ0NYAPbYyUZsO1tFIo6I1DeygOL7kPE/KGHBxdyRqFpZb0p1jV9nRQ4Tsv/7UsTEgA2dW3GkhHqpx52uKMSN+FS5JEwWfg8uhBwBog8E9CSZLxNLNTsWLQQdl0Vr0taj/XqeEmxpj+XqcZEpYc4RLY4awydCgePF7osSmywFAQlON/T1X2xabuV1nKVtLfpNAsiQBApVsgsY82zltMeR7pBTPBIYKeHKDpdqKtRF0N9h9S7KO8MVtgPJZbn4T8KaPTN02KmuDPpEUT/RQw5q5Db8XRZ/1+ur/9w+REv9JW8CQMAEcJglYieoKT1YaFYB4wH1M4f9QPxxTRj5//tSxLMACnRHcYewwoFMDS4xg6Wo9bG1NIRwgR9foO6665GA/dFGWaiqt38f6N/Kf36jDHKadS63YdM+rY/T4h1vU1z2dalXtpCcUicZiZJJYnbae86wrxQiMVA+l/BAd2x8i56d6NBNV32ar1vQ3LBylkJBR68MEGRhGzyUSL/ErbKk17DsALYoRQVIgOVMKFd1eIySU/uSpV1aAhRAINFpQ6SErLAu4K314wHY6RlyhGmgNUBTdHsW5tiLqJR3R1bXgPFES77qI65KR6mb8uv/+1LEvYAKZGl3p7EDQT+WLfWDjdhibQeQaD65oqu/31hZlpZf39F4yLMMqX7s4l3so5a1Jk0bqs1YCZxiqk3Nh1mc4wmRFsz4EXtADN44CL/QvWbZzYemUtd4YUT9Ugv1dBIvs9BNjdGQ72fPWj+YgMaa4Hk6FWBNVfxfWpVJYepP78iKd3S2A4AQglFt0E8qqvEzYlj6B0SzkXhm1YlWhLIePRC6XdcOOWwoSvDpAkEWiZR7FXOn7R70Ket+ARuorULa24azwce3dfGfrVULA//7UsTKAAoQr2TMsQOBSItv9PYsvmeAIhWo+WK0u2QOAUAACAGDFLEmFW2IQno6SR7NL1zuqVVtQz3OkKmpru7GC91fV9aKh7Le3bWy+xbF1mxmczlcxAnNSSDbHJ5y7yNiSdH6YNSRiLb+4MzI0xEfG47ahft2rGz7D34/a1xneLzXOGEAMKEnKb9iDIXB9TniaiHpM87HMmAMBmgVpRRIIHnZlGpA+kAZs9sqDh4FI3iMM4Wj6c/nYmV3RB7kdhJled5splC6M7H73fVSzkVr//tSxNaACoyNZ0wxA4FNliyZlg0wme1Yr/lSbaz4isk5gmnIlpuXb711sRxTZvV3iIqFcHnpFGiQgxS1k/EYXI8kIL8pKqueYx52YgaAESDrP7M4mM6e3qUbRkb2wYUyBDeeoQMWJCCCMSKZ9xOy+BESrl+8KGhUVv4o/+72voIoWzUPIx8CR05WuKhnm/bJgoi5JxTXHy7sGCAqIx4bMe9Jqr7H/FpbEezayzVmWaW5s+pQFA6co45Ufird3roMLYWA1DflR8FeU7l/TjvVpr//+1LE4IAKfDllTLDDgeyzbSTzmfXsiEFcogtKqRtOhZSvnhex0Z53rTkw6Pj8jxMjIxhgEr7Wi+pUrN1My7+swXIQUo+vdGHXPQ7WdxpdKhYlNZiP0KPWjxrt29XV+yRcf85i3ZrDpJoKsLbGzjCpZhoKGSVH2gJkqlUq7JZeCmIYYd1GgS/H8f3WXuyd1yXBnlQI6gTxWwz/8upZSrokYMXUdEyuQGKc1p36xBHU3X1M+lxW06ux4GeFTALAHdsUOeKPiwmPMU9bTzcV3VhoK//7UsTXAApk4WcssEkBTw3uNPSJrHEsboWEoZE5Gk20lA228T/R9HgeSGqezWc2SSLcAtrMsuQ9qPczromhpfR2rEHdyzKTvd/RxbZxRnsudL+9AR51X6qNfNV34fLd5F/5Sy8sLvoF1FClh0bF2pazUSvJdHCVYRDU40X1gsyNrgBICiwDcNNBO8FNxdRhfMrUg/7uS3T9ckY8dVgfBpc6o3J5JAwt1oKj1uWYEJQ99ipOrmv2/I8jyG0kK6XwRpVNdue8gMYa8Cdb70SBSs1j//tSxOGACailXA08qcF+m601hhU8QgPWPQtTgAQGK2ggBBe5aroLedaMxmRv1PRW1t9bF5aky5VZUNvIX1rIeose3Fhcn+DmfyrNfk8/fkOkv85f231O5Xz8yr9rnPh/uaHWNxZ03LTOPwiY/ZJmiJymnnmgYsBHx8GQ+AAH4v/7P8x/+kY1Nv0SCUEsXYwwuBE071eDHNBUdvZjPL2Sw6HIfYmargMD1Kse49oqvVavrQIQ4OPfmIE78FEM22ISm3eJ0xB2IIQWTpB2QjWN0pD/+1LE6QALxLdrp6RPIZ6b7nT1jm56BFxdRnZ0HPXE39TtbJ60OWT87lxng9MzL6DTsJ6ZhPIspCwRG4KmSdTTH1hPCzs4Cd7dr8jeEfovJhX+oEQEBfG4pooSINQGADwHibBJwThbX0ZHGxIoELqpVJTL67MurLeNpMAJ01svoSzZQ17GSpdb/+oW4y0R1fqDst9jisXoSMBkwBpGp9n7/7UAgBBRIEPNBDeQGxtvV9joChXJpJTLjADACU/HDBed99ajAjQHKZIRbDmnpGa/t//7UsTkAArIs1bMrFCBrqgsMZYODRbW0L52+feeaQUZcNbd2LsVR8/cxOoctxie729h7ajTvesoCChMlRJAhjMoPCkboZdB0cdL9lXJnTMfoqL7ufTdxzVHsDysHjuPMVZmX9l/70/RnEa7k44lxjJgsBGhU9S6LsR6EM2S6Yxqgs3Zr2dnDniVCgABGWhkyjicwVOsCgaMFQO13RHrCJllwiROltSBQpmTAweJEnNNJrGF2NeiNipYqbcFSbhK5945oCQxDXDZrWfRsFVsIqfp//tSxOEC0OlPXgw8yYk+FS1Q8wogoSp2ZS1GVCf1P6a1gAIwOCFIohQVw8j5wSFWSEweqDU+eWGRuak1cj6YzRfnkSgkzMkQKpdQjBxcTtTRL9VUj1NdQYRqDpdaHGEEr1M9/rs/vMtmhwUS0ktGpbWJ2/oqAAZYjSBRaTqlTivSpIWtSNVIRqshIb0aKQ8lQohmWkEh+DiOsTTm6WEG713ZEt0qcBhVUoqCbXKbFmrJWncwkz5lhHdbKLow1HpT7mRrsiy3zI5TL+jrVp9tvvH/+1LE04AKIKtnDDBnQUmW7nTAjkRTgTvA7mtIm5Fx3Ybc/cgDHiCIGQjgGSOC1iM0jyOtdwcEZ0FCGCwDuRyA4dEqv384gTtuPSEvyOXQztZyKlkpoDbh+f/+q/3wUCi4PQVkRu7n21uc8FEdTb8r/zLHAIMKARId7kh3FoAE6N7XHpJuLSZS4aStisRsH6sISsYUqFQlbtSwSQXBYZ7U3IeFwZaTbvDk9qO7MsDUt2MIeJPQJtsBjWPqVlfwYTU0kLyhtr1bg4OCzsU4A6YYSf/7UsTfgApkX22HsGchTI+tdPYgrKQH7XFmioXPjdrVz7PXsABz/FNpJ0NMLgiC9GZiaPDKUinB9jI3uWguUEh0vvFiCuSQaRFXHMqDwRxC9/HnUK11lDq+6QJ2po6z0hSSaKZbnsmkiIdFQyn7Et7P7ZOaqAhiePuYR+f/wAIBd6P/plk6s774KDpohSiSQlshKBslB4hFQTGxSF0xKmgNpvFHVVSsPXsDIjnFNY2nklAq7dlo2yveywomssc+Xn2Pf3/v/+nOr3kyjye1nk2e//tSxOoADU05ZawwqaFmlW0lhI0+mZV7+a2JSJ6Rv73LCHG4Ha+G1Layufnw7D+fxYgDsgo4okgFClQ+OgUnZYC4fWyw3ZwpkgdXzOa9R28zYsTpGwAUscJSgpH6kJyBtqN8XAlYoJtXpW/V9NwucItco+edLswIwIlBcgOG7kmlISzogVSeJEEgI/FWdp+EhW1FdSF7GGj51k1CNhI48tgq8dj4OolQrT5egJjl2l2cfyHWNgdaNBLvedbuqhNgqtL5E92JOp7P3dv53X4Gf1P/+1LE5gAMWKttp6RRIZwmLSjECe0i7jU8ugByqutJtomG8zExUwM14WikRx9Gy8qmDB+YVLS0/XoBDl0K4AChDo9Xm8PNBvngythwTl9LwwJoBQx5VZkrC4864ODYucISKptLOp7nGHE0UH2JdYsCUHw6oETZ3nSXpoAIqgVhfqyVby4DO1wFUzEGmrNmYKpJmNLNkKUCnYPWGPjnKYlR7R0ZomDkazMDCBjUwkYxEedQXMDXJUYCtazum61o+hilJjVpHKrdIuN3iyVxCdmzpP/7UsTfAAxJW22kiHMpSwhs9MMl0HK1iz7CKQigRJGSnEopVELjaR1IwqyapnrmXUFrs3C6A8QJYllZBfSaIuzuSit01CkYmSKqh6bWTE6VDAMo+ULUkkQqrVIjRxZ/l1LF3MmpJ6wMVMfLC73IYktClbq9ZmoBVKZXDyaBogGaSnMnMYGIELA7FYPfqMPgnAYADTpNArwVFUdxkwemzr9J+1EIOs9L9d04+yzqYFhjEzYGBo3CqlOVPomTagbe6wCEgSALH250A2i6R6SwPzAJ//tSxOKACjBlZUeliEGBEi109gx0CQVlu0290hiqoEBMcbbMFrE6F4KVQc4CoJMljx05MR/M4Q0hCtBWBB3iEn5WPzC+84WMh9zC8Yu8aUO71VfLu9rNd6tUeEjS4WAZrb1SwPpze+0f1h8+uPEakO0oQ27/3RPVsLxoExNJtkQs7oZNUYrSNKlcOL667X1EWqtLzqMPuYblq4kze5RO4uV+f+Ey7RDOHm7fv/0uc0Z+jrNXo9X8xUS9s/dZmrVLaJmQlpMi4jwNP/exkp4pQNj/+1LE54NLoH1YzBhOwWkMakTMGDApI+SGQXILpw/PtFGDKKxEF5HnxCi4vVuyIk9//9N3M4/okEMr0+lsWDM1ioIBANDa5U9yAjXSbpcaY0CX0AgkDNiOYI5UDgBBy8MWLB2B4H42JiUS0sN1XiAL3XaNH6bnD5ocJTrM/p77OH5faZ5A6lZrURDpc9xpU1nja6Ycb/N8exjGM3vfUkuok8cUrue/qae+/zlcQqo5Plxq+L7m6rv//Z16b6qn/W3i7WOC0Ms//3f/rWFJsYA0AP/7UsTpggyIb05M4ScBY5WrKPMJ8BPwRt6Q0IpgYSEpO6O0eUZWWewwQ5HqEFWGOQIU8KBnYUvq5sMzhVuNg0ORkF1CyZEu2K2OUVbsbsWj01FSPp1031PPNGJjHa/pCDc0pDSoCdgYMQepNIgsCmRN4KQVVZYijZqqhLj+RpQyCGQjrgvpBpPBakouLJCQQFwKWC6dbDRUDpNDErAUx9S0/0r3opvK6Lji0iub530KBDZXqrdXco21DYwzmGoUylULZMTqdVqpXuY+E0srD6Q+//tQxOiAD3GbY1T0ACpNMO53HrAAZIOnYQ7kTyUiEKIKaCv7HEuuE3miTnpS4pGsWQKmhUZt5pd3e2l1n/00e6r0AgNaxjgwuQiLFHUYe7Mjksagu08jjRG1ZUi6utUXvTGKmqS7dK5LPF+mRln3nV5bbI2vrpsfrq37/GuT1I2kNrPiyBxVq2OorWhXSp9v0wAOwWEzc0UV0J7KZJUBhLyTRL4k0Q7sWG3Sdqe+Vo946jhfLESW8wA2dy/5rQgU/KNYLDUURWfejFDEGC9Nt//7UsS+gAoAZXec8YABQYzvMPMNwE/YKmNKdsR09NT9GjSlitn77mCGaVZepWhAiHCCOCDHSYY+MiSRvROpXZBdtHvNtBgSC/PkPURfARLKa1Z3hQYjSoaWRKnta1dlOv/Td05WLa5Pl1+n/Ztmr7Ka4tZ3M6taB4T+lQwEKbAnWiiYVdRZ2WWQ22zZoBhuZvutNzjwlgysojIk3ZCaRnN85Is243YUvITRNq4lC2nniXM37eW1uqUXdD2srxdpvb0cz1sm56jQ1j0axH9dGr+j//tSxMwACcSFgeeEUsE7Ge2tgYpgN7dqPsRv5UX9EUyyxNIoyX7eoAHAiMlNFFGmMcARew3yi4goqiDYYukGOhH78KEjbYoM6oedRJAoQV+x08Lf013YXTsyumOE2faZ9XYxetutiF3b9XRDNzVbQn/tN//Rk8t1GxESAdR879T10DVQx4OgPTfL0AwCjmlU0aIxwaF0yaDfOmnpCZME+2xBEfAUN51JYHmoRikNGIQy+k7PdpIgCT0oyUErLbexUG03VU9BP13buExvxkYUEOT/+1LE24IKIINlDLxlwU4mLBWUFeAddrK5je8OLXtPhAJIJFWgiCVjpGukglKytstLYXRhPyegZLPIHnPg3WMAjb2ggyTEY4Il9/ZAkKNjibQO5wRfC4khCPSpLFXw9f64QwuQKvSL+nslyjsohdvWs/l2LgIXQkSIV1xtM46jxNM9jHURBD7UDLMae0jvRN2YNpiRg8tFcaCBz5dVCGrzVJ7UhR9qvEldmy1y/Oh0YKseuXccVJGxXFZpmtCRxI8KllBqtLPUtfE5jDDhYUAxVf/7UsTnAA0Ra2usJK3haaztdYYUrB2FyYGMKYMxgAkensjcTaeIGn2ETc3i6uJClWdClUiXZcq9dMira1G/xZRZ1sZNvaXyEJlbSfIuyGLq9QPlc4kxbBO0oL3KPPw/a43ecLEaUdJUlDX9SlrvbFRDbHUiGu4+wYSF9tUAyB02YgQMEAD7Gxos0FWh+3DKkFKVjOtlEGg0gRIXbWIpjQnVlWrTS8fCi4vktDUiacan7H8adEqBWowplXaRTPfolnET7IpeKtSRr9/XHXsml/Jd//tSxOOCCyTdWA0kr0FSjmwlkxXQlFyFxpa36gAUkY01KBjmoXQtXY0j1UpRNpJSTKZPPX55zjakiZBKdFCAt82d/yZ2CAOxm6UrZnm7aT9FMxVRUBBS39nQz0226L/+jL7U7qn3/b/fajf/3VsSTd6yW1DLN93qD//kAICUm06CdqUEGEBzE1EWSMifuC3VUQDwpuSKD2DVbCFX5jJKfK2HB19WJl91ZVbMUbp1Yi85Hh5HN7VqSIPZ56fMR/1zZA68NGdn4NP6DrKh1dJtWTb/+1LE6oAMrI9x56RvIXcQrnTzDiQOKkAnu88+wAVqGoOXSOPEJdhLitnEFG4AwGRSeDcbEt1wPYly+B8Wq+So/tjXGHIWgJW9d98wigoF03uROPEZqgsUf/7v3zixQOit1rN15F+wPgNzkaUBkPXd93atU4oHWUAYq2DdRb36/pXBCIUczIeCEnO2ndO0LpVN2TgTurLgSIuWIrVFKrdpDgMOv5ki/jcGww79nNUyaY1f8xQ1W9WdtlPb/rOf9c5lR/7trXvvat2Z6pmNoTGYq//7UsTmgAuAt17MJG8Be6st8PSV74ndDLT4h6BVG4ITpFK5C9R+DLtC2RZ6BEA7wPKw13oP27KVFBeaSi4ix5kyHpjgw8fT/WZ64hz5/xi2sf7xmZjN60raFhywTPua3ZsVi/+ix1idbGEZMzcEwoWS3MuqizGXe9UoNGExCIxmwtBspBEtEiILUFcA04XbkTeKaESrmp0U6kgQzGHaeu+KAYyrUqFwhJEOYGBNWgnizmdcmFGWC+07MtD4z6irYXSPQ9D3J5HgRXBd6zrH3vW9//tSxOcAC7DdXOww6wF8lOz09iCsbzHV89H/kmvn29Zt2ea2yGXGiTqxk+8b+aU3vGtU/+GffvfcNnvvX/98/4xT59L7+fEiazI8gU8TGKR9//Hx//4lp861///9feKRCysgCnWgA7Hk1W8fVXrQHtTUecHRVXjcYiVHDr90YoJg9shMvXk4fVIkE6AvPEoRaXP05yvq0fpzctNgZ3mF1k8bR1StD8cpkp5Fy1pqP93baXDqN5s5ez92Xe+XprUrILspozErE9ytL9T3rZk90///+1LE5oALyU1xJ6DtsWgOKoay8ACIkd/Pp5us9Os2m2/mTszOTOz+771ctViPZ+fn/3J20vSrRiDRCr//3f/qi4nABFnE+H6uyGo0noC8artcI6GGkbbNZ0xABw4VHNchQMu0iiXkDkRLBhCLo/o7+f6AgAY8cpyCja1v7b5J7SbWO4vas36emrRHtBQQ0r7+lAACkAAKws9DNLwa0VTqh8pFthJQwkIkLzFxq0p1x9lC/M91V77bjkqOSo+v69XOP6zgjZHbX1r+1jd/Mc3t/P/7UsToABS1g2u5l4AaZa3tlzDAANkQeQujZAU2v+t26s6HLvoVAACwAghlQfs4bImJLkPBY12pltiOFOMj9Ldja2TUVlzeEy6XtrqG7q9GzVgYEIyuv+tS0urPQDDj6DtiuOawKLIukgAWy4m39XeRU/UP3Z02kBJaq51aQDSYTCSRUIE+FPWRUGGGa3qRxFbKMF9oUHNTQ74v9FKlmyUV7/KkgjfvKX/KW96vMQrzB4BjGfQqP1EnSieUFRq11mNyBQO+xahAIhokZaxWz7mm//tSxKaACkSZcTzxAAE8nu2k9Klw1QAAYZJKadXe+Q6llg0yeBmg6mpDU+bZXD0LdVC5KCVYyKG0CwLz7idFNEgQZtiWPPonbsUODLRZSQ6IEMsVSRQGmLc+KXuj3N6zbHMOh1h33u2gEGirAm6p6QCAtJTSSmJi/MFRi1EySBrJBUrcGhPnUxPMlUPVTl64ixn1Oyb2aYVypFAh+dfoSRoI7urPfpoWcbj8/Iv/EqHiA6McygFbqm/hA+8PHgypTe5DvREtFVIAgBAAUm/wgCX/+1LEs4AK6JdnR4y0gVAWraj0lTzVoaYdCvGQgjkbUc3H6EvWX5kMt2bzsNRSA2wt5Au6GOW+z7P5n31NM9RhuNUw15EDTT94CKCYeeHOZ8URpii+KtQKTaa5/VpZf1gBA8y2XHeT54diqNE/QcRoWSLpWv0JcnyphopgkmIFOBAG8mrLEP1I73MjqD/HoQ8GwuVEu3nAukCVOgddKHS6Vo+ub9mk4hpRmXKOJkyFZ+xP1xBVIAkJlSLwSLo1xCcWijRURbklYuYCosEzjxZIc//7UsS7gAtAYWFMPMNBX5gtKPSNpDSK7srS8I/KdOtEKerFNtb+2u9qu6ZP11KRUV58p9U6uvnf2dX/kZckx9GMmR/RTqwJnCAAizvWc+h23D8/QsEPO/xtxopQuKjLJ8Wx8Oc+mpEYa5iDqhXi4JUjHofqwPIUxgRhLr1uRtipJZwZRHkZ55AyGIqYvC4zS56xqNWjbYpbXt/97nJXsjYrTSEoqYtb0hBAZAAAjsVR1LweDpA1zoMjLB4cHE6iHVSSAkEhQJ5XV/rzhweHCw4c//tSxMCACnSXYUekroFSD2yo8wnY+hbgZ6ILOBE67iOucQv0Lvz8Yidbf3e3kqlVrb/b/NjK3Kipd7d6sFe6AScTWkbakIR5rES4u6PkPdGzHcJ82bQtjUx5x1cLgNVJ9vZhX9CiQq7cpmwZrxKoVxWVBQRA1TQq+qjq6Hevfyc3I/WnpFVQWBc66wvPtMNjKoEpJbG24kAGRtDz5ejGq4H24NJqndICbVB/hJHNgOQNNAbzXX3h8foXtJFKK4oDZgOoUEIVIB4c1JUjYxUVsrb/+1LEygALXWVvpiBK6VAJ7XT2IcBT72f/0/9mDzxCQWYFljD9pp9RpYAgJAJ3YbHOZcDmEZCFZS6C1kQmPwpQGFRhEWkOCMzq6ElhoQz2RtmD4wIVteLc9SDIKQRfaVUiYLfeSeWfy37UoVVyQK7r2P01ozFL6eq+AACEAAGZg/YEGkTcYBoThBATUeBThisNPoVRE9Eg43TmPAoddDP3D+Bpcgr5RLuKFS0E4o8jNg5uWxl5VUFAQ8Rci2A1tMqlrlKqtW7QK2ULcgose9jRrP/7UsTQgAoIm2MnsGfBUA2taYeMcKCtpuuwZbqwoSRuqckYJhfwrglgdoDUdA5jac0KSireFzdNZuX2sEtc1Ih9KoAQXx9Z+NeogV7fnEU522RTy1qkUnrmkp1HpudUs4/C8FbD/dU61B7YpK7m0K7gtP1c1zlT/6LEoF1Zl+Q0xYdIXleNgbQW05IafB1/ApcI4+O9AM/dmpzX1rRKpdqWb//qfUxNCEIzqO+fbvT2/9p3P13nT2Ax3gxbiHJO5BLDqHAyFomHeRXVwgNO06A6//tSxNwACoRXeaewzjE+jmrZlI3Q/Pn606O+BhDGSlWlIWEzIwC5QWUMUuFRcVnBKMSkwgQIBGEzwsAGIXsNFkBCF/0AEEhdy3PiIRPoIQII/aIhXCAYsyhQMJD9YOILgSCBwoJ/i8MAP73KFEGQUvMOxGHHkg+5o+R8nVVBNJBSRJEgBI8kCTZl3SWZzTatbHA57jP+yZD2HuujuU2CnE02RF5Npas31JCh0dQRxoPSNzKlxLS8jONs+wIBD41ZWFt/5eV6lFpJiyDWKqH/n8f/+1LE6AAL6ItRLTBugXIX7HT0DlwQFcvixm+9ydsfMSr0Qk/jXZmsFqILld1VYKCYb6dAmfm7PNn92mnsud3rs1gT2XMsgThqEcps65mFK2V6DpVOAd4AJbVitTnxcSqaSS3oPJxckPqNrBl3tH+AVEmmxP7g9f2KBT+h0MUZJAQhBDCWXyFpLgQ8KpBpKmQwFiIHQKBA1NkTp2k3h8RKb7OHiOhahM3GbY1d9mY0yHPK+fWhNlSocSMhsyJCVRuw1ucT033YTcuRY1yfo4RjUP/7UsToAAvVZ2EsMEbJgxUuNMMNMCJp4lxUCVHZShXl2jTeKFUnqqtIg9gqzEMwvMKpyR1HTxjiW7HZp4QXZDpB3itClOAytM54IKCLN7EeT4d6f1n9eqv84RkKIckoXfppsNNWWtw6sdxeSJGFEmxwjCsRE3tcPbuKtVdVHBCALXfIVrHTShpijEHdLkt/WpYrWj0dXZGbIGkdt/CLYbDlAUGV/rl5ndC5feeXeoS6P5nvdXX8xEcdR888OuS0NJWGDxGGv94sG7rxE0o6kcTl//tSxOYAC2yldaewacFwEO4xhgzwux6xixxAkABJRdLiBggS9wkvHuX8QQJcvnitjDNNlE7ZozaNS9+VpqUwh8LXIzlE8e/bva+/7ifqAAUPUtrAaUdc8E33gA1HlCWQJ1XdDOnAO4QAecPHDB463WketoNGItk6UPUJcAAQkoZRWC8BFEkaheD6HGTRQKAlpfYLmMJQTsh1s0wXeAjsclDAVS/edt/y0K773+6vBSdTC6wOQMNcTMC4eDgNHmtCkuHrAcEp8bV1c7pyrajr9yb/+1LE6AALmKlvrKRpAYmXr3zzDhRJN1Dxx9lUImuJkUGvdllaAwViBMxuCpHLqNOaSGQrmXVto9V5hQPpC5ITTa0r2AfbAu2B1Vl50e3PaB+tHpFyKLXv5Yn0reud07O06bt01uPBIOOedZ4ubNoEzl8TbHMc7Vp/6CUZWCwEmonMcBzFoxpExXIoDiM9cqFIoXVRT8FUrrUgTzvUqDy04VNvm6wk7WQZM0xilRnrbs2/oUXAx3HgqdLonaFwAhthPdZ5JDMDF0CdjjrUKLlpQP/7UsTmAAsAq2ksGE9Bgg5sqYeY4BIeA9+j2lQAA6EyE3ZLMH0aQpSwYJeTpH8jXFCmo8X6hK2l10XmDqUBJVEClnqCB/FDJTtnPO7m46Umn62i5ioIY8g340eakszhI45p0woyKyN5JGlKdDzjU+9x9HjNaxAMqYPa/aulBDAgJtuXccZJBgqA51anhl1TDirWNajGPFrDZeI7ubo47F720NaWZ0pIzzFTzfMsMf+uX9qTqpCKl5fD/R+meuUh3L/0L/hO5LczSlpO6czEvpU7//tSxOeBC9xzaUw8wcF0lSuBh64Q3wj2KyYQEzoi9Nbtme6A73/sAABiEk23BAm8zJ5m5Q+pUoRB7vy2OS1s9KnJb8YEZ1HSIpGIg8hc1dVoH8YCEyXM9zLuD0zMn+l/YXGCiPpDhR0lDI0AMYB9NpCutD5kxUfD0sr1aCwjTsc3sjEJpZGa1OyxzkAjJNHl8OI/T0opVYjmh+g/ngdlOmbVT+dGhdW7ua683Usuf7ojrFLeoUt8/zt/oguGI58VFRznoornlk4rIL9CC5NI9/r/+1LE54ALuK1xp5ivIYQVLXTzIggZWKB0i/I43ECtoYCSGmpTfFORVSG2uP26LP4y2CXXH1da6gmjPzBLNlCRXUOaHyo5VZzHV4ser/VoCs75z344YYHEloNC+YfKXUmLzVlpnvNLzlqRNB4EjK2NIEgLIiKpChnYs7Em5QRBSCBjJt22TceLAog0RtoSn0izmGfreiFrCNz7KGW5NQc98EnBoy6ukOtuxgP9gSGsVh0GkNLuNWxyEYgUYM3S7UP30omrdz8lNtLFWfWxnStASv/7UsTmAAy5MWtHnG7JcBYsqYMN2JWJArjzXJMp3Mq9VDPZUAlMQwSTHJLwFJPEkSqfLwqTeVRiIWkD2g5KamUAEYwfCmG0HFwz90VKq3ZVpcFsrPVrym5Vu8Y4Wk4uG7Gi6lhZqh4pYhTtErG0AFc4dGtN1n8kixT2bZ7dYgAgQAVrArBS6LvKPRFaidiJ06h5LIddppklHiDLbY5AXJp4S7cKEE5ccsHO+V3Wsq3iw88LleWCZ5dCLVxpIkl19SwoJ3a/Kx5BOxG+RcoAopJ4//tSxOMACwyndaeka6F0kWwdhI3Y4WpTk0DCT4WK6pc+HHHby02OHKwCG98zfRqlWjCcRMsLRVtYCfi+dCL1/7FfnVRVzata4jeqNV50or2QpT386r+Tq+lu+qEQjfpe95EbqhCSfpnsrNI1rFFud1h0OhzrSxw5vhOaYxaqEZHr6jsrZKplKEuVFJo5lTtrbVOUanem5ax3o5hjZ321hq4QjbhIEZJdD6nD0z9+lURP7MT+iIRshzyBAAAAATB8HwuD4QBCD4OAgEP/ic/f6E//+1LE5gAMVS9v56BQ4WgUrXTzCcSwDh/XFT6ROD6YfeIEgABANIVIIWVpKpgvAosUEL/ogMmCcZh4sOAImB4SxZCd0nuLIBGrNAye5dkjJTyyaF6mWT0r65gQg1ngMIACCndO7+93x4zWQ73/MaHDlL29974v7qqw821YbKZo8ZJotyoMzMy9PTYzAdOkNpbd32CdQ93zMQQtO3Z9/aIy6Y/wg97GR7szDERxPFIABIFoAodjkZjDYcxdnMRU5qB64e+I1oyeWDUvrauTFbbQmP/7UsTlgAngVVstMM6BsTGrTYSKIaAqWbDDa9EqEHAtS8hNNyHYRT1YSWc6n4sDpF2tc8VEq0t/rax5CZQ4k5bjxYSWEAXCk65jeNABhICI3VWAGajmDM5BUWQkE6MySJBEhH0+rI1PnGanLZBcBCMJ3rNh46YYfEZGYj/yQWIvIg2bGS0uFVBRFtG3ZztP8y/ZWsWclGp9KCDNUEYpbWrcDFOaDsSghRiggIAxYDCWF1tCQ8Slkksa1M6fJnNtezWmZnu6gKIMrTaUVJNSZyLr//tSxOWADATFc6eMUyIusWzlhhkYJql3t/pKsaKtb+3lRKd7v92Xey2o9vVk1b0GLHau/bpQAQCABA2FXZBhxZgWMNtHizG7AWFiEnXgiDlAeuct4W6H5HCEKFi5xzI5R66uZpbTRLoTbVFqpWiS7df5ir+vePCQG/2cS0UMDRMabuQoeQcViY7u+nXVCCAwLkrMcBSCA0QSBFC0036j4KI5u3OxpAPOWbNpJU1TgnD7HlOa9exyVRrudj6HhOyD2u9F2IiZlZkOn/yBFVvNq1j/+1LEzYALMHtvJ7BnwTYH7fDGGDCjf8lFpJHoOLhSs8Kq1AVOr+kCwFq0o1HgjicBNFzE2JKdhuGMsoe7RLlMMBZxbUPrUsWH9Z0Lx+LBzSp4YfPKtkhxb7vTy7/Ddxqbrws4X/+vTwNK1nxinniun1Til6KIsL0s0jXLxNexSF/+OWpAKFmyOORl3EWjS+psjCrORXKNIiTywrmQS3xaXEJ+vuh117cclF7ZuixbF37Xi6IhN1CikPWYjWMJnmM9Kn7fW4A4Te/VrDjf9Ky/6//7UsTYAAsdZXOmIKuBWRvsJYeUsNux+U2UiJBRQlQoih9bfR/tWCCkQrE25CpjhqnCWHYRSjL6wHQcsLbRcynOkNGIU9BE80+KAJOn8jVUEjvKRiIwt+70ZLzoZYMie3mlme89Ap59JRggf85+tOhwCFBr3oTb0CcIZdCfdxsfAXyVAtEJ0gTCNMmjYE0rlZHXS7cG9SRThia3CRe8azat/97tE1T2yXA4cPNMwzQL9+xv469uHRLcE8/QJYBLtTKP/jG5jTAeYAEqKZq5H3eA//tSxN4ACsDfXMywTsFxm+xo9g3Yid6EE7ojeb2gDw8/Z+wIkkTabTcClJlYajdtJID5k4PA/Ikp3IvZpoDltw9X8Unbz2RKX3AxdW8bHvL33zuMM4ve5tae7T6eXTplutN7t7+0WIuSFZHGKswl62nHHJf78tRs3V6z/xot4267ixu70UliI7TKcqsZaS5EYjbtggVt4WlOsBi/P0t5TgFPxyOSsajZ9Kv4wY7nLuMMORJESIiTu/u/7UIIAE0Fnz6xOGKq2OoCxFofOFxBw/L/+1LE4oAL1Tdrp7BJ4WUX7TT0idyGZMht5Cl71HluX7fsa0telJBTDB5OSAQBIQSAWim03QvTLOlnmLwXiiYASwChPK1CoQOFE6PZKtlqo1C+BE4gucg02nMWjXL2pOEDOwVx4iYFTY5cqAVMbFKOVBWj52hI4r/cm6n9F8BXEVH5ihEVs/ZJrs3MRrJJjFQlGD92DSYjw0PRiQmPYjPWRGGQQq9Esonqg1S37RKQ/yoMBgUWyBzQCXEooMQ0DHiSwklbWX95F7v3adr+1CR0DP/7UsTkgAvZb2lHhHfpw6zs6YYgof2WVuZoRBrhy9ssjUwJaw3j5OtSiuEGhXCN0nh24DWLWFp41u3Pz03efbB/cPBngx3M6n1sqKMhWSArRVUcfeVJVIKw002FK59Rgi/q/zbRiiIPQkfHVIXNMRaHwE0Bd9tSKgAoWIu3I0kqBYQQXyhLghZNUed6LDfqEE/CpHdQ4jmt5IovXr6JUztk7SgnS6//0tv6qouEmikLsLgSLgA8tgIOpS8mJT7ypt4HVeUoApAXHsbaMt1r7dU0//tSxNqACnhvc4ewY+FbD6388w2oLGSFxgo+ce1XqAIANVRGN2AuQWbHlBxyYxVJQSZuLQpXp0LRMGUVnOJbjigFLE+KFYZvZxJ49LGg+Mc8Vk0kGMIAMHEg+1cgxKkxyizC7dSl9A/6tY99ZqMoFwJC5fG1ORtqBMmos7mTRJoPU/GBDoC01HjdVMjY3KaIt69Iz75pl7nFbP2YzEczylvna7jnP/Och3ki8TEQHMVNhAxHyVTiaNbViISxO/f6f+7TnXuunc0Sd9HOvELcfd//+1LE4wAKYHd1p7BlYXUPbbWGDLwDFElgeKI2Q9AAQnEIDjhBYeAD9h4adtV0drjbVAodDmIhVdHNQtUHbziGyefKJezlX6MY6yNjJHAYlKMjkAXN6C2pdBZCXCAIGJNgWKqQA4OMYXi5khoqIH0F7nuvu/0rClxYQFmAoEWiBjBAA7QJbZUABwhO2wgABFPpMEkgrCxGLyXF8rpYbyC+UJkt14SJjeiHn+nEQ9dQSbC0jqQolBP1Afyhep5vku5aRKsicJ3IxLPKqZlZSLHKm//7UsTogAxYdWensMlhYgnrZZwkMFEjGhRW96kfN3LTa58MveX/I3zx1PzViXNOIhYT+UxgYRPylCPn8hF/oEfybKuiuHCFAZhlzz2wCzWMZuAAJ0DeT4r1l05NKWqkBcgafhYgCxlef91YyOBtuIESkUBHdEes9ATkEEG7gfWLpNLuNpq6S5+RsRsWVrjieqp1WaMDaO+d6fMIZ/0KCJagcAIAkaYA0eoyYCdKKKR6JZyUYMpmWCwVy0U7wljFwq1ZDEqRXLPZiK26fwoud/1E//tSxOiADb2Pb6eUdelyE+70wI5gQOAEYXQ7Q6WPCgUQ4j4beLb+SoGKAw4kr/3k1TBpL0dIVe2qrUiCZcFnNZWE8YHqFLCefNiGMTM4Hk+n+mLJQY6OUBNvnggHZf517J2X/QritJASgkFF4oca4e3WsTBGtJxn/xaTQpQSazXXsHikz/s01QCFiUAiBJF2CgwxKJ4LoQYKFy0l8VbFTLS8DWIhF4AXDCKPGKMU+5hJV7/+fXJyDMZUvgah03KzVFgsSaMaSBNcLkD1x47q/6v/+1LE4QAQMYlxp6R4CUONbrD0jPj9KSL4skGqv9AAAEAAAwJmLNjwhStRakVALISShJh9kHJBM3cs8I0AcOu0gX7xWDWOPmUG0QfdwMJ2SIamSv5NGu1pQuaocLkhEPELlJmtx51ZKKFbF/wT6DA4/DjRvJRQw8QXCr3Xq61KAAiYLCIq0Z6pqw+MBYfGU3a79wxK4Coch9BTTmya4iBouvC3aytUjPr1C/uYLt99Hyl/wvq1QNMx7Ubx760omVrUSNnDUVfXjBbJBzJHzxYY1//7UsTVgAp0lXOHpGeBRhEvNPGKIHT6EN2/2VIJZzpdVMaISgEqdbcOwPRwhyLhBOohx0CQgBTWf4yuOQQvvwhOkxA/xTGc3VZFDY8nB68knbnu7U+KplH63C4vSmzm3XIQwd1CRaqBYPeFhNZFPvyTywODzYF1VlkNndkFqJqJdTM4FqPCwbAiNg6yBHuR3PFGAldKGo2sVv4nzAQNmyj3IN562kXrmeFJfzaYbN0TxLMxDBF2C2VmTriAhlmfIwJjzqj0kYrpd9CP29FT/RvI//tSxOCACjyZbYwwYcGCEeylpiDwlWSOoDJcpnYSLJ1QAIwNtcxwlFhIh8lFnoqhRhLhcK4QYrasa3KptntZ9hrPWV96umJDiWwEXSSpnq5mZc9nv7JuowICZ1GkBJNVFBjv/Vr2iudsy6V4onb/WtUBCBoCEAgpKGQS0n/QRl6IEYQ2WJN9aX86Bcqh2ys14tVcVfEYrD2EnAbUhQSsDGaUEK1fKEK/MOy1zlZEaIB0mRZfR1q+xVCqRgIo9Q9E4GJwg9KX2EkmG00vxXgcJiT/+1LE5QALKI9rjC0LgX6RrnT2LLRQSUWZAF9jaABMFwAQQyZZC8R2lUTQmDDRhlMfKVWm+7PyHEnnVtV3GiVb47ycUB5Q2eDDjIO4UXlAJPy0EPw6dbiv4MSFWjxCoADlUuJjC4MlptYgij6WxRqzt/fram/bwxdKNyJbtWowZLPNyOBRMShQq1JRUJVEF+FfOtdMLIrlGq0hlkka3kO2IQmzFQVBagyjEsZy3ZEvGYCQ8/co22qtdm6Eln2tHvQeNUtFVINYu62Herd65af/7f/7UsTmgAwNY3+FhFrxP5RsiZYI+AENEZU1Im3ONhsaCoH3DKFjPwIELDR2qrpveACiQsBZibV9QGyXD+mQbz4hlm3XTNcw0IrxCpoMi/Dpnko1boUQBhCeOSr1xi3LxHFwfdHB9K0T8Mnz5IgCjHrAYRURaZSpB4o+wAVzNjSZTEMmiDFaFUR5OfVVHhVQtBbWEEA2PnrxX5PWPmHCVEPI3zMHmFoJKyh3WQIsQ11L86xZdjt0bIWiKPLGuDRvrYgMjTrktPHhY82jxS8xI9sC//tSxOwADQDNZawwSwGBkWwll4z4VEam2Mapb3FxttrKJuAAJJwiylegBUCIwrUL6JJNzmhJ5ZQ1mD/d3VsSUIJZkG7ocWnlke8z6zd2baWrNMUPCRo8MDWHGKIkQEwoLgMO47QhIecK0efXV2hn3q5gif+nt+gAkCAUimngC5Q+GCoMiFkJYQqRFwFZIYT4jUC75GuLmZ5TE8IDEblnifnmbkWAaucZ1eVWX8i0GnmCbh1kqAA4o4+808mYQ4JmLOzCG/1rxVTns1NKOIAQ4eX/+1LE5YAKYJFeDDzHgZMSrjTzDdwB2TZQglpvIgVSQ2OtxxucbK/Uup0NJ7PUxuAnsF0hD+6Bmis8hW+JodxliEYqi7Bn/srJ0au9isla7qm6pWx0dGM1d+e5ll/b36Oj2/71vDvkS+fV1pRmMrniHqLEssLJa//sv1CaAApIQFaSSJYUIvF5lDUzp8lDA2BitMPJCsCX/Sp9jH/e2AIKNYHjhFWIHTkuf2uWh0qtBYCOB55QuKiiz6IxaYvzD0bV4n6UfRbLrqSihYSNqFSkq//7UsTngwyIk1pMvQsBUwvrzYek2NiVBtVRxCgDodnr9yEAOIuVmTjvOC60fiPGWbFQqAx28LCmN8bQpCYd5RjdyFX65emFkwx+zTtGJ7/D7fxiGHv4yX9K2M0mecrThqbWQmMtrgnH3ag2y9pSbfw+du5IIekE2RWY4fZgEt/MBFOHtcadn/dABHMPpie/fHZk/poBHAqBFYoNTsWOy6efyRVlCcimRNiowCBO09NyqwqFzZ9iFN/JrSsho2JSYBgZvh04Mf3rjTOpLJ5qCC+Z//tSxOkADDx9X0w9I0F6rK409Ij9Uo6nHSEho35HOZz/7n2MNLNlb8sylT9mVPTqFHL8/LdP6T9JhhyqdUmUt1tIqA1U2ySo0kiwx0MLGeiWTJEJSsW1Vr1tA4ixNZvu/4CfsXX6qaWNmWi55swjVJ+DhwmuTSDwcYvvvijxlTbLEDXq/2H1am1rqzlRZgrtVEBTJR7BKoQSFjgCRloTU0U+dLWdysB1rAfecNjylsIK6h9kYyM71GLt1ZtaTqYM9ZYdEoRtW0S6JkseoYL5bJP/+1LE5oALeINjrDClgd8hrOWGGLm/8Gj1WW3gqCrmFgMsnlSWpVDUrBTrikjcaRIZSjEpOrNQIhuvH5a3pqfA38phrMe5AbM55+3x2O0lyra1hIyYqfKPHmC7EB2ilCURYXIt7Fjzqr0k56gb//oVoYo6qWSGuNLPpIoAgOlagca4P0JaPoXY/B2HEViWX0UJUgCl33uLei1hiZd+UGxYJNuJHx/zIBv9gnaO5GJHd976wEUFLr//bG487Rq2+/927CFBd98C/Y5f8/9D/2yq3v/7UMTagA1VaWisJGnJRQ9uNPYMuNn8b3/JfX1v7kAxKxG0020lQQpbwjB+LwHADNOjArI1q9EN5/fNXDmlKqW/lgy3DE8qVzPz4h6L4KfmVJegnEQ3m2JKuEadHGqhL7kFqUdx6oze9uiS3vfcd39VAApARLDZZSpgQgGQnjonuXWsNArwwDUgiXwzdUhzQAKBsPVSSX7mYbUJF8Z33ac1HXqkaBWRhR6OvCY9k9e1b1ScRdRP5sLJaRXcVJIITS0RhaBlKZEqKmC1vZaAaWX/+1LE2gAKGINmx6BLAUeN7/TDDZ71J5WGmKeRAKcZbcbaRJhKnEtFeUjO5oQgJCXl1bAYRBfbjAUqxfjf8esBMWSiJOSP3WylMzv+VludaQxrK2CHSbOlmkVhASMIDKXqOj3rdS3Q5/3bLqOz/HTqRqHjgwNlk0iiBJiYTl0ouDLRQaRvltjk9bRYCfMLt+pW1q/xOwYbfp6ysd36edT/OYEqezDpPjTZSv1n5lmJU7+jlOH230PQKQBEUXoWRG8T1c6/M+9yPTA001Ks8m9t4P/7UsTmgAvsT2UnsGcpSRJtNPYMfIEJLVM0jRk+oPghqLRjY0Z8d+en+zKUF3KaCQJiabS3e25RCIVDMzlRH2FAA4orq1oqCxAUGJu+/DA7ogIULmTZkFYxegQyWdLGNSMWXttMqNrWiIQOCIR0dA/Z4NiVRHRFO4mjJSy5EV9PadVXXY7MzOU7LJESq+RPBmoD6Id/eCJ3sUfqTxtXX/nhrp1RnADYu/lRTfsOSZxK2rOWIzSTjoVCw9iklh9suc+vJe48S02EIaG5lhCThzHW//tSxOuADMDBX6wYb2FylW409Il+HQbzwFU+AbgAePPHE0rHRZx6oLsUoOtb3ZBntOJQ3/b3iydQAAEhIRIxFFQKWoEEIeSUrxY0kTudCD/USgLSWG6T63ddse4TPcK/0tMgCEHTTu9NhuTKBcUGiFrlvjBqBMLNV7SKVuS7UByQCJ/mvWKTJhDL0U/VAwyxo4oZJQLqjSC0wgUGct8BEJRL40SG7iWSS1mbSwh7ID0pldOSnsEVD5cZMiRnlldSsVRJdlKW+i10d0QqpJevpXf/+1LE6AAQbZVth4za+ZKr7GWEiOn9TIf04N6ib8Ti2moABAhqRNlFKlSR2191XgZsHCiR8F2Ce54kKbKBZRkjelkG2cVsltNrf7+wGYYTFVspGFVMF1NdtXdQw0y5l4atlsPgSWTWpjX/jF9Jii0vUlq1mQC5LJJttI5OCaAsGqYYSlhQ5NHypEOlSCKaids0YQNHScPuazuXUklJwNCrlbC2dj3vMhRYzjGnQ27kIpZEVt0zpou9rt1fVRWvbdcyWVistPetehmtv0ulz6eknf/7UsTSAAn0Y2MsMGdBUQzsJaeYeFtuNYiqklUAAWAICmmkVDK2QMhFjQ6TBwOjLus5Vl6o6FUhwgWbeWRrdZNoLvMkch73qJmWFEHHSsRnzpjobcjo0oM4JjsrFbCLSrF1Psodi8136r7XPJmhAk+56ChR1rAIUW9y5l+pCgQEI+gQaSyYkdQmxF3Uw3+Yjt0zzMjYLDNvTNA276RfBAX28FEExIQa1DVMJXThKbX96jlUhWyH7AiOCDXKYXafJlzSVWCjDCUFO4pQAE2Q3G5F//tSxN4ACgDhWi0wUIFMC6z1lhisEVC2gDCRCYYuOWCEPQYHB4IrxcwIsveIt/KEUWQdyWczoO/a/b7ZyMWk5Wkz0uSIdmlO3/uMefdkya4SdXIRAAhjRAHDadDZ+9G23r3/dSZzGx3jb6f//5m5G/T7hIhhM/McxFncxk83Ktnp4OB30ePIKhI2YppSyNQYzGfful7bPrAe1Qk02nbZLY0mND6I3Jihwvr1jJP07lZF4lm7JPW47aTAkjHtOODgxoeXNDzgY54GoycUCshamkb/+1LE6oAMhXVrp5iu4YUSq3WmDOhNn4jMR2c/Doi+DCgR2BFrpKUpDXB5C4FGP8tilaVOXOM0mKQZuMyYDZQ6WFpvQIXmy8GAXKFz61HMvUcKJRAkQJi44W5soIHBB6BfJhgvpLgpKqu0PW/0bThCAQCBkYxDgyyqfbSHqGtqdInUqx0fYSchCk3HJGyTi3zsT0pNUl1q0Py1UJxSKGSEiP39krKofPtfEg0PDI5j1pJnRR7+p9q0N6/55Lqj6fjkvSkZ6fUqAs9t1jjsjLZKGv/7UsTlgAmcT1sNPGcCKTSsNZYYqPxPJ5QMx8D4SV2HUFSRdvHjveyHJc6fqqKj3cz9Nzsl7oneMeetZ6HsQBunf7K5IxZxb/SYccmv2aIoKmg6AlvP1Iun/2t69dQCGkVaFqgk4D3QCAoYg6ZEYTXV6TXD2XFljzCmqiy0ol57U5Jumx5If3R9zz9nboOBMfvEzEJBk6BF1MqWGnFf1ld6NHV/1md9oF5sjVoqA00J+Tq62IhKbTzA35Ys4qYYGtW0sV6qqcZHROWvsuLsY/KP//tSxNeAEPTHgaY9MZGCEvA8x6aAEi0YaisRQmHts36J9R63gTqUjVFVTAV1eiq699j5W37tK1pXIAZoaK/0gEAgAgDG+DZmWIYQwxJHROo5uOtHAQMh8p3UKt+Q95sqxyUqWSrpsNxr3dnOJNoQCdikYrnLVu0XaZFRz5HWe1qmEOCfCE6v0vXCg58P41IdPRQ8oOnSBix1NQJQh0RlX10xt4ZL9zM0upcj4jSn2Sd7ImWYlvR0qZf0KD/AO/U4+l5aRHea3x7zOpoDtmiZTEb/+1LEwQAKXLN7pgVYQTmS7jDBniBUY6o5v0I3yi/3N8Ur1MdldSezrbdQ8q+a16sm76Wanpbr2d+53Y6xFi3TVZVb5FACowgEplDKynMCIHgf9CUl+3ZYJqL9sHaVKfbt8GSmelNK/HdSt8/vrh/5SfYhiabnwlX1SBZlr1CETvCsg+IcqkNqeBgRDr6ZAX7fv76/f0TqihUSl9GSXIE7PXNyCToNCjbqSFTSqHuVAQwCiBxQSTgDrJoWXAp1LlqLR28ftyEBnjncCCsLOuFwXf/7UsTOAAnEl2+MMEeBaRMsZYYU+GNOdqWiyjP1aS2pT61tnQ5SCylcxQ2eqVtUCTmjRZ41Z0dDifoOm62Hi37+aQNT2mVoT0++xS5s2tXQikdXRFkaQmgigey7ZWxSQBFh2RlT7ZSS4gXBOLbwt+GuzcoiU3QWnkl4FSz0AbfM/MoGI5IcegEPmW2YD7WV7ZZrIyWKGa1L41Vw3VT0Dt9hv39gxCtXXKxUm31Q6wRHvT+uy22ORwbKRXLuy6HCaT/0dSoKOh/zOjYGdCKEArpi//tSxNeADN1ldeewrWGlnu09lAqgaWJqJ9EInx73UNsVR+U8Ehd8+VIIBm2FegNC1Knd3XaDxwoNW0rXga6hrSIwntWiK3/FFIz0kOBsCpE1kUYeh9SL3WWPF0FOoiWHX824507er3ar7NE6nLNvSOlPwf9bkPVNToOfSJdLq1+5ZKeYImR8nM6Bb8qkUusbLg7AnkoSMbjkJCItD8TLGDhofvx/xlyENEhaPaxoyrE7OQJ9xrQk7mOoNzeZ4ul3Hdy+/nZw6/lLnOVDhEQHp4r/+1LEzQANiPdhrLzpwY+lrn2Eibz7/Zi8KPsWSs65GdPMpehNYb0VBdqluzl6SJYdyDRQnR2IN2fTuZY8VMOKGKWm9K33kdWXn1OvM0tkOG/5W0+gLQvUp5bk2SOx9xzlD8h6JNhOSU148DES+9sz5pR++2Pmq3bqhRQqhZGeACks3m9qiLoJBUQS2oF+ds8NMIbLBUqwIZXq5hyos1Qafg7CRU5yTINwkfk7UJ1z7yAB26OtSopn3MJfp1V3VWTE9V/6e/X2Ty5ej/33ZvbXJf/7UsTCgBApl1gMvQXJaJNttPYgcFJ9bxWMCkyGGtYQWedSCjaTkn26uhyAJEoixlMJq0vjYQe9BewBLwpobulGJWLusupRR2SE/42LRc7VvUw+rdbYn1N7zEolS5USGHYGyXzsXYdUPKr6N926ubsBU7eijO50EQCAGQknjDyQE5R3L4uTOoEHGswU42/e2XqcWZDy5/VBAmtILx6lxSfvQexuP2bSkS+HH++tI/sO32EPz2z9zF9YSd4bzg+Lv6k5G53CQQe0XIDUiqcBobUA//tSxLKACuCZcaedFGF/q6309ZW0gEAAR8L+0LhCAMaNV3FFlPL8pczHTMoeV3y6iIQIpsag2sGpcHtum9obgQVq3+xnf2+osmzgO6OMYpw9+5qblsNu9Txtzg0YfpTchv3/mgIo0Ui2mWm4IqDqUoOQI8X1CjwRSkBErxUJRR8hRfICIxFZrPnouGoeUoBurxfvvgdHpFpRtvq3wzSAX1i/29Os1klrbeusD1JSpir8XeQCDnkxsfpdoGoMkogTQjLEAAya+UgYDbsxCg37P9H/+1LEtQAKeMF1h6RLsWKU6ymkieANJu1itA0oeTBrfjv6rYqYRoRHVfUm9Cjzw0kg4KHpcPFHAYk5TmLf9Ff/Qoi+82B5B6FAhcH6A/DBRNkn/regZ2Zw74XKcQvYjg0+KPABgpqhIOwiXLGGTtokEg0WGBSgrtmz8zfbM/HARNftN5Yu1egdhHyLuiVFFnypAoZMGVNraHg3H8wRTjQ/ivIIpBrGOW1OtzJ7vfy5FcTFoO7iWBoIQLKDuYGDoLPinunuJcXH7jFou0osfX9Tb//7UsS8gAoAl1UtJK7BXpTtNPSJOtTb3/pXpXyf4gfvVQSZW0AAIGiE3J1J1/WUJdJcJAGergsPBYAHEAzSkpUWmVjYDVJgiSFt3Ncyy6dP+YCBCjYKI2Uw4dp0YoJxZIxDFMEgdCfKTo92PARYk4DB4UTJiMs9D9aPeG7hY6IH7uoEApJOKJEElF3MWc42YNMbQmYHqAOEAlGRqSEircWrFtXc8Q3IGhDmHS6yXUIU6ovSb+ZC7brJu25BAgbCfFhv62O7dvUwVmW3lLe9ZJba//tSxMaACphxWKywrQIesWuBliE5mUoS5iUAAqsJ9QV4fatqeDaQ5Th0pZTjiNjELTsO6sWxHW96TpzunSB3fThIzIicOFq/7mbqxW3969VMVAjb97W9JH0OqTcuZUODcUMYFe2uoCkisd91IAEqAAAQgHVqeJI+DYeWSYczaUjWYffp2ZGFWUsSo0892kQ0gYS83KoPN4OzTHmop1lZGVt7s8/TRzh+ioD59R1VVOhAv+//R3f6AiAALe67GgCAocRH1yIlOiqkz8MYVtMWt6b/+1LEtgAMIIVvrDBqgU8VrbT2CPA01rIwHAyDMpjlUDXPMYuIQIxbZsYKD2S5g7uV+d/uL39vy9YQUEH67ZXmkHv2/TmwmHVjVUnRz3hoVQM4s/9qAgAWJS22ik6UE5sF9NkRFICABHYiIOoKALK93OctUy148IHNd2OHXrxLAuOSbqd8wYPboms1P5ETP05SUWKhF1TmehvrOtDOOeaOnX3C1+lX0/xeAADhKRkq1ZUUgNQaZVpY0AdG4wH9GjlmkgM05HacCN1ektoLhGNy///7UsS5gApMrWuHsKmBRhXr5ZMdmAenSXvAMBtzLP3lP/X5QbMwqIWJNirq28929urrTt53KHzYTKLW5CBt0q//SAClPutxaiUIwEqWJhW9LmVEQVueZYupUUSndTGWyFFnqWadMe5VJCJa1QWgPn6WrTlHNvgu7JuGgRyYwYCMSWw6YW4l0/qHj5BwihwyLej/FEX3BVjQzRmQvXWGhV+8bB3cok2o661jXIPDQmOR6Cs7j2r5gbTj/Q0Az398VpKgSci0x7gQMBU3KvxwEa64//tSxMWACmivXyygS4FOFW009ijsEELhcOPQA7LYQS8+BU6Ua/3AEBJEKFHbZDTsUhN5AGYUDIoDMWxKHPdWhtI/GCgmgh3I/12YMERaN6aouQAh1DF6UnzqSmrco/yf3fKNUZE7hCKj5thFzkNW0e3+2pNgCIRIRJAAFGQJkbArqjItfE7L6Xw2lxZEtRo7e7ozVbkFN7EsLYEDxhTrky/2iN9XtpZs121xWQTugEpqQWomByG0uA4Kg8oowd2vWkkkQFGmoul54UdLj2rGxVz/+1LE0AIKlH9hTD0mgUWPqsmUqdguJRl6H0sa40ZBJgZmJsMUOoGaolMcENDjMzLgQWAMziM8EEnnC9h267rByaKH82/NsLUevcAXMRbNK8I3I0zMgRE5H3smZO5K29/hwv/HUVG3SHT73sWMhJhBN9YwVWxpXX1P9C12KgBFjNNovgWQtMaYmg0ZUUDASV6BQ3VspYYDrVp/triAwGoYdcgVwwrijKqGsGIa17mm6hNOUrTHSFcq1qCrJdBZSyzCL6hyhi33PzSTvx0a8qkdTP/7UsTbAAnsjVYMIK9BNgusJPSI6FUa9CRTeHQIxVAqdfiPYlMWUF5WVg4CUJTrcyqB4mjtSO9T/kNhU5py7pIF57p8zGxFkPzg7FPdRIlOPjbc7r2ih2WKOL2qZYxy4taYKPXK27DFuNfq+4kqQ41BogIXvQpRNaxlgACRZlrZjG1YELC3AOqKFR+AwCo1rjgH1o2yPXxY6huPdi3gcF6YcMvBu5Q/5EoUpuJkUDpuZ5qfnxjiKWtAs52yNwWQqplUTyw+Alsawgt0mF7QVs7a//tSxOqADMh/X6eg0oF3mitU9g04Z6HSLMtpFiAAo7ZXVHjAVIVYhWmAZelhN0/lTBN0sY425be0SL4eyq7YC/iGTj8Kq2olnb/REu1kXC5px0u6ACys1a4MOoSVl4NqSrcR4HWjs9W4gVu9wSAIYgM4BheGUDoGcoQIwZH040AWpTqNEwD+FGUSMVSLDY40eIRK96tzLRNZr0CkuMjhYgFDk6M+bGZpTFnhIaQDxASAmOMtQgAhIThYup111J8oi+1CSAQGmny71et6jjmUz9X/+1LE5gILWL1WrDBJAXeR6mWWIWifRgG5aUKGql5mgQaLYp+h/2XEpIpNSGJUjvOKljZ7z7OUF0vealFj6u8Z+9rAZiJeUGCy3ZEpSnpS5pfnMo72sHA3j2TroMHj8u0GSDpzYEhjVzz9k4040ECCj6tceacmtWoQWtBy0zi+fzIJh0AcUac+kD0ykLnkLABZyD7lze34bCl+M24h3Jvm36MfCPEZPEarwhAZDtPnu/uzp9nvpvj+oWKxWuRisVkjJGKwL2GTYh120kEIeFo0aP/7UsTnggvAjVUsMQdBco2p2Yes4MnFYrJM9o0c57ewYtHIgYRkZOuuCZOpAUHOf+90lS76RMlv25bvCu/V7wOJc+e6gggUSHdbSnF7SiCAcBZIC4jilDpFzxduSzIeuIQyHpLc8s+h772QZPNvcECg2XNCdWuwWxzRuTVkJBaxsugCWc+tmTSkQmXBSfJYjxCdJRtFF2mJytPmmoapSatdr4wkdKG7k7TAw86SJiRtFHpYZvkMv7HayWLEgFvVPNZmVF9FrlK+NR/f44SCMkUE//tSxOgADBhhX6exKSIUsmpBgZrhND3kWsQJtXVa7e5JJTGUDiISAoNEYmmjKXFdiHF7zFmInAhxclksGdHbQ6YSICv6sdg/ywtFFBzOSss0DWkUWIqVMKudQhUYq2y/Va5MUf/NsOEHNP1RSKqLupasCNRd1lTlsaadZxmkgVGwkiQJIkojszgJDqZ0vMcT1icBQi4UB3Lo0GQIvIIOE+0JKrDZkS04o967+PIwMGljTyPK7fzaJbausYPOnaCigcH0oZCqBAEIbXMoECcoGv3/+1LE0wAR4Ytkp6UPwZgYL3WGGPi8ceZ6rHwBScuUcVus4PrqMOsgYsh3xEvgKIlVPIxymJE6CR2G1iylPHKQl5aND7gCYp7VV+jHbt1eixVU7v4EU08ATdD/QBIhy7yzebWxuinptQPKQOxx5B89PWR1fVHC9BNy30UUPVRL2KC00j9lRfxHMEAy1z1MAEQQa3UgWJiUMuABUB51iiYoSElPReM+hvrXv6Erw7R02+4FgCAMAtB+ZoRIA6iR6H7V0vaQ/jdMsU6x9UVa5NvJuf/7UsS2gAo4a3WMmGrBT4rvvPYMOEtG1CE3T0+ZK/fzQmH2cBATAg6Dwdv+YUiLKfpatLmW9q/s4xS62fxVIuoJBVgoSluwNtWWyNGNJKEasZKrSajVaWXsrbJdGsjW7VbchqntrT08RJoDK0dkv/bQF3lEqzqUjvmqzaX3T/Xo+Qpd2e30e6kej8v7f3dzoiq9x0RS96RpoEWjx3wMZoW6BIA4a8HmFokJKObRQqEq8M9gSsJ8RTQzR3KDphg5tPCmVcXeK2hFO60Y0AyMLjXl//tSxMGACjRXbYwxBQFVje/89iw0FVEAHaAJX81XZosLHbubxrkNasoGEfAz+iQPKHV+jbi5FWIkUo+sAgRTsZiRtuiAaSLKWyP69qq1iE2VTSUWW7pkHgjsztN7z2iOH+taXzANq62AhBg8f+FNHmJe9q7O6jGW17qMFHA1Ja1tIltBc8z2hf1UfZf0v4aUxiMMHsN0IgABU8w2YUUWCTr1VufeItogkwQsOzOooNkYmAZovCxndfaSp5zj0NDIrHwHwEGl54+RczBIESBQKi//+1LEzAAKOHFizLCpwWgnsHT1ld7qwOG0WD3x9Gic1g+oTjmszJsRtczX+g4y5wqfnEMekoC73isgBmqUzOqaXRoqDTcjZP3CMOuY9Yp+V0nugBJ5onf7ua1qq6J/OIlOR1pKoAkM1ktGlSlYK33fMsoW5YwwrqPKNa+r1eMa6G0PJqK6pa6l9RnVAKdU9bdtcSqhGeiC6HqwqOGWyZvZyMeYXeIhEYAQQg2xM5G51BAxsdn8m/3sKQQ38eedPVzKuhe36E4zjw+A/bQjFDVnW//7UsTUAArYpVysvKfBbBUs9YeVMD1f//Z8yvrcUYkOUBnSCBhVCEGRMkoeqIwWkL0OMKYuqsO/KwPrV5zTonl1yxShR1JUiD5u2cBodvScMzHJy7f8z/KyUZaeKFLoGWuDZbseA3SI/u69nsZTzp7v0UdS3O+tDDX221u3skwbSsRA3SUu1g20SuEGzrN3NWNri6ya9srWiG99t3Vf+LB+lkI1j8wQR0pasSCGBlRy1QuCepDspfUTR0rT5JFZF1TVGytpr/rXZSGJOgVZZMN5//tSxNkAC9xtZawxBcFED6788xWkmSrIoMk2dIAAoCjKFZJDWMPNa20hH5SSBTzKyQYTkaEFqO4OxsVQanEpAAEIs+8IPCNUIoKuv5p3NwnP7dFrnWxwYuPX/b/7cfjrnKDMowihAsVat9CfjTvqIMjD2joJEz8vAz4v56gQb/3JkiCxZzhTiFHLATFEurnVj/VawuHjjjK7mpSNvLfTHvZJIfSsaXI7FTBo59aEl1xQYwh4Q1l6PXLx/1x10YFGr26Ids5FZuxUVu3ShRjuZ/7/+1LE3wAKfJVxp6RrwU+RbBmWIRivYoqEx6A57blQVDLyk/+0OgBBwVKymmK/tsrGlSHBqQaI1BEGMUVqfjvCEsJ2ZoGmUmMTAjPku//L+kRvx+ZlR5MZLgCJMnfh4ass0gFt9ertdrf279qbCv99na62vrJ0t9k/d/+aszsCiOkEbk/Qkgm8HSFDCjaQAwZTEyfKyBo6AJ0Ssd+DAJYps3VTx/nrlA8rf/xot05Fee18PlAwpzLj6r7yCYgdUxKxObEPZ3KKMMKOnB4oEXm8PP/7UsTpAAwlPXOnrE8hg5TsdYStPMMolP+oBAQRChW6bjaMD8CfUR/kvQg6XA62xhYlQ5NjqiwaClRDkwOEFXt4uTO/fosyy7v2oy4RxqX/COOPEKF5dMncGd6Ww7EIFHh9Cz+Wnk+rr+3/tWmrxMTSQQ0RpKDHLIGlJQAAQHFFG0gEVHPs6AUSoE4yZd1iLd5ZInbo7VLWvOO/FqAo3Dst4+EAwdflc6+jdlhJp8KaIyixTR+alfI3Zf5wY1AcocBgAdkgd1C9YJa0TxyIMFSe//tSxOYADJzfcUewuHFsrCuplIm4sq+dxwHJ8aroV7h3bll3IVc3WHa7rsLVj8CHazP09x+l+mW96Wwv2pv+dmWnzJyyizR6CJciltP6JFPnolQcQ4MNQlyyxKdw5uHBBrTm2tkbYBYLMSCosDQGxOWeJWRGs8KKAMQ6kYkzUcbESzTfyb1MsLX+FgTfmzHaS/V8pLA4CDkE3DR7FHvR9lv+mqBeaZb1dh8UKufNNarvQsWku8krZKZmDHByMwagcLYn3bMxJOOAzLPRKx8spnj/+1LE5AAKmHFWDKVpAYQTrTzxitC4rRKOstuMv+T1PczJqM0k88SuPqMmSyVLKDndVC/xo06R2+mLCESmYq9nRYVEef9NhAiP6WLhBYJftboUFBCxGskjIZFJgiKjx/AMEelqh375UHc6c2F9n+RuYnh8wmGyTBRo9yA29q0KUDWOFuPdEuSetU9m/klDvd3qNSRdneSVAAALdYKaQJgG0sT0FeI4fR8HAj7iyCw86lKaiuk7FrbbrhhMtmT/CPt8/2draDV7ww0BBZCDg5Bem//7UsTnABQhd2esMHrJRBOvNJMNpNUvZ/6kh0Z41ZbItO29nkGvSsWPOcxbjydCAQdpCKURWVIx5AFQfxuOYQhSemMCo0VNURU09ZB2NaxMsx3IRRSN69YhdLnO3gnWLCkSBsTrDcVDg4xMBQJuY9liF2/ovRX/x4coDYo9UfA1elUAAZiSk07hgjnTYKesATLKpVQpfPSA7WhooiSXU880tX7SojZRsUxoYx+49V40zQQ4SPPFLgOalEMYKkngQSIND/3+lWSerGdbLnGRp2fr//tSxMwACix5daYYbSE/jWuFhJkQ6UUJ6EAL5VlVwpjMhD4U5rHq4JOUxKztKUPOIzl0DA5D8phtLBw+R20ejQ0N96X0KiblnumX7tNap01Pby/mfMqa5ykO58QQ8J0AQ2fBxIESJyqUQCoSN09ygwFR5+ZHz/2GrKWFFYEEjNY264nOQZAxShTp1LmigYENvddxYWWg6QTOg4lIJbHxyrratKxfzX3dOTUXacNMrX1NzxH72/CU/1X18383+s3/V3f/PxSXzdvCS4oiN8hfDzP/+1LE2QAKiHFlp7BpYUgRbKj2CHT8DD/D1lv6SdSMiGO+SwjQ/Xf/TYAKLhrl1meKkUaqUA0aNGOrx6n6NVZ9sVES5tEJPN7iqCeSxGLAQjJBQmCAJhoSRtOLaOobgPDQd43D0QJw+2Ig0WuDYcjpdL4pG2VvacqDE6icXY3mIo6cTPvfaJUB0nScRc+F28tccY+fYyjstUtr7+a63Tzc/+ybJlcL3WijQ8ms59lzc8vh3vZvNGMf73dvqztIuqeYSWpBFVlNsmIoFieUj8Ngov/7UsTjgApgaV1MMGlBiRntJPQN9oOAiDjJwmZHIvJrkUWYSoYBdkMS0hUPaxllQIBvqbXo74JlS+/T+gZQV72/7KzfRN3//6AxD//d/CgT0P+LdlmpztcIBBhmFsxDTg17bEyD/ZDnJOvJ0y15sSxeTNL8ucEwhzuizg62wx5v59eOE3D2hf/70ZmtKsa9i/d7Ftm4W7Ig6QQZXcOADmNpd1dB8qIjbx+9YTTxvso3oqCpLJ3XIik61JGU8R8RbCSMxWEWlp7yuuWsiTkwlBYt//tSxOaADSUTa7T0ACplMm23HrAA7HBgTBh2av5n6jmpIfzq/mkdpv6n87qpkGgNH+WSR/Jn9ts2a+uee2/0UKubSn9b1TUkRqBMb2IJQIsvk9Qpjck3QkEkLS1LLQ100PFA7GQyxT7TN6hOFHh1j5qP2FKi+Glv+fbS6iJUkFUSyIDRDsy0rDa4ealFldHMa103JtAEQBxa3qXVm8AWE/DA041NJh86WctabnniNJOezFeDoLH9U/NkbTUUWYtSnzvzFlgNf0ij7/yOqAlG6UL/+1LEwwAKHTdtvMEAAWOV7JWHmKgQxBM9rs6/afckXiOKaazX5K6qACJCAiiFJhr7+Jyio3yTlJGkLfiry0OR7jifyaldSrzfPW2vRk2c6+Wp19egDHMNiZ76rKScv9fC9tF3rBZwuealIhEVGaY90Z/7ORALPWYa9qaJGi4zxAK4yDDYjc5sHTHBPBnUXJZSIlyyV50oaUkWLPCkY2pVU82MB0KWivo+AwAs0k6ys9/AVj/WQC1CCMgs/tbzpKl+mZpXdW5e5whXXQGT40HBNP/7UsTMAAn0r3ensGWhPJXrgZeg4B2YRuW7FWAA0KRrQDx5u0AkUQUmRKUFyn0p6KWw9YjymcroxGlhwkGy8xU0fLd9ueib92vGKvfzMJb+EBbRKLbKavVre/yL/1/32qldSEZ21o0n+QjNOhF5zi6EJbUgkIMNGAgcFW0Ecw+r/kh/q3OKgFATCUCa0+1EvHUjguCkm5Jw4sqNFauVv5c9tf+/0K3ITMzaICNbX20Qx0Ip59AN9CXyEa/WqNQrvqff6My+c51N1151vq7H0YiE//tSxNqACfirYSwgT4Fckevph6zou312e6n0bMQIUUF2w2wlHz+wIwBEoy6pRoEFY5q8ySCakKMTwxjPmrMOHLakUtwD0ViCNiobCKLk5YMIij7vKd7go9s/d+25R9QmWh4A3SNj2Sql3Ux935Pn/3dHMhbovY+lYwLCVZsueAMUJC0BsfKP+4EdNohk/vUvrkyZWpFm0QACIbhy0VGng2TCIaRBxsQoRCmtFNp5VVAOO/p2Aw2FXiUNr1MysfaNrGGHugGKCUeArpucLsQepaL/+1LE5QALAH9np5USgams6/GFlenCiI4r1UUJpY3RF/o7WO172b22AEzZ7Ltoggshiyl6YMGTyAHQAuF7IhImLdq5FHgo6NsuVBY0iQKIsfIcdCI9Q8i0cajyTWbuxk6lIUWkNpcXV+9v37jMB3U3mP3ET9SCYUByiKUCRld2qW+siJMEHclIdqHISnTxU1jdB7EhXbCcSPrCV1YgyGKLRmxkgrno19TVIhuyKXVEPEhZDRqDaEFnqU2LFvErlsDr6f7qJXS2RZUFHJSeLkg4qP/7UsThgAu9Z2knsEXBo5hudYYYuBULtXQABKnFLuVcIIJqdFSTHJSVQFE8RzAetEJkemTSlCZFz9pOw/tQ/blTntL0reXtbczrMF7l/zrbzAoGITQtRYKKYIqzQwfGvL3M7WrIfqY5xBdkJ7E7Rc6NapDUmLtiVQAh9JVBgtIDQWmYNEDLIuuktO7MpGK/hBqOLinOCf9QXl0QlTKzZatPOvUIdvq5nDnAZOJGQzly3MWGLKGR/5sxQvK/YMHs82Ai9gTHnYYvnltr5kJNvdpK//tSxNwACmRdc6wkw8FKC651hJx45gokHD904clYUfR42LF2nq1DgBurAom3tTJYOBwShV5rW15+SsB+tr3uhH85ecDUmWtdnmI79tMEUXa5LVqwgOPku/oKt7eiKwDjl938X650MuRip0kqp0N1/aIlKkb3vRq///QqADBQFAWC1cFOEfFbFOVnIzDgRndK6tPmtijAZMT0WZVky8oIkub1CXcdkVVu2+l7q9Maz31P3uUV29SmK//kUQv1ub7hXaxiAy75NT/6WjCgVdQLD7j/+1DE5wALRJN756SpYXiQrPGGGLhYNdHSSlAUAQkk5PSesx/NJqPTud0U/R0NkgPY/1EztqN2nup2wwi53ePYVSjRTJm6y6S71eHBcq3s/3MyDm1t9BYX/pdEPbv+l0/fSbW/kXfdfpoen//9VLYaNW9ru7oqCIcIlLSkJKYFytVNRl0ThFSCl+UaaeWUkyxpZjb1VSP4L1sK768oSNPUdkQPDf9/FK956FSLEoQz92fURKnmMd4Lh9wHotgMVVW2IAA6oMLKv+VTkJ0+YKbv//tSxOgAC/S/Xy2wacF6JitBphWwYMGh9Ev3ar2JCSma2kirJBg4geF6hSiMxwIeFn8M5P8raW5zeZTGv7h1W1xiBcq9PyFkbJOUaygZGspB9ncaX012y77WSXVcYvV///t0ttazrfr9HtZB13pHmqJ+fmqqx7VqqgJSaVZ2Tf6NFQXRBlZUyzRYzLL4qz2WZUY/FR8+3ceNZq4s4j229ebUUyCN4cFFNl5zV/9dyEnuEmM0KnTow0FGA8WMCS0RijXWcvNCUVRR/ajcicyvoUz/+1LE5oIK2MFdLSxNgX4s6+jzFwgyK27I1ShV1+oAABgRQQccbZcFaJ8vnMNdg5toJhUAHeKsulaI9qZPI07s2t9F01x7dXQnTaloHr9Z5Zpu9zQGiOKqkHio7+1JFb3gAqbfrxcUYWN0Mv0//UVF5r8p7oom//SqGTmj1umtrc6PJInSVo6VODmgncek90W4puXVQhnVuFAKWcDA240tDb+ho4ggugAK9ZzJbjC5xdKe+IAgZTqCQWwA0YLPl/KLNi+QUfYJnPYpbnHZte2Jp//7UsTpAAxglWGsPSXBaSst9MUWjY+Oa8ODSLJ96gBAoAARjA2wgSw5gD8LiHRCr2QPEvXmbOZetSgkLek5pcf5+AjM41qq6Rlt83UPV8sH7f9/f0PDSDI0PODgadWhIwN2Hxp0JiJhQsZQLONKaomi/GMYeLWOo7/DvuydAYMR0dcRRSpLlIelhl4XGepyYbzkWUCp49pH1ly9Gja2vGRnw3tx2bbZF46s9zOoYAb9lswUxl0p+xW+6VZA7/9Fe5en3qGQYQLAYD3BO0UVfFvi//tSxOgADCCLceewbaFrEWz9hiFwhFh5A48c13PWYBgcptTjiRJqPIk5ylfOfGJEsSMggcl0HxJIF2neKGnHnUSACvtGkqoqoBrdTC0sX8uJwpXMQbxGhIVGoJPvAhsXJJaEwsy6hpR73R5AXc0WLdn0/fxdQcxmi5f2IQAAAHHIGS2oCPgWUiilgxF5U/45ENJStEbEOmC4Oe0L3APOzUwnXFvmsLoDF2PcjWIBu75+j0UGwg/WDI8yvXv2U7t7qSlXRGbV0s7D34DWDzqERhn/+1LE6AAMIKNxp5huoXqRauWmIdCb8uiXnwTUysTtl3HCbDZzS7mwi4qiEJAdHaHJjTbyuBWEtFg24vMsTNh3WWLS2G1E6b84QXUHW19qyMcvYkvJpf/OcqyfkVyK62oyuS30///oynRlPcn1fb0ZAYdBh4SyuHCQaIoMXQOSzBzEBPqJdBryhjRE6EAEAPgPAF0gd8g1Atxfb9rrUoMCjdY1ATXvugsI0ybkFPg/+VX37fiXQCTSYJNTiPh82ZS0hfeLF2WSMsuhbbTYpP0xff/7UsTmAAu4/WWsLEuhdBGsNYYg5LUQEgockypNHFpdkmocCiAVoJ6R49Gkvi2Wm0VggYYWdGbUl6oKEJEoyWQoitLljjh40rdhGnOPwm9PHVVvdE/jYh7frsCiW8QBYV7pHyC2Bnw1FZPk4Um3G3GlEQAVO0Q19NFhNWEI+TYXIX4DDQCEIi5hkoqymvpKm0jUYE6FgD5zjcHdnHxjlx3Pad2y5OiQzENR6KxZRQ7TWn3WrZHjxoypTlgeAXPj2AklC3////6F2/0exRQJI403//tSxOaADPDdWay8ScGtMWwplIk5Gmk4VcVnLlYnRsMpwqmBkRkJmZYnZO2S5Lqwdm01rLkWZc7B2m20u3+R9BC1B1a0qHPY46mecKkVehLu7VneokVRHWopIdqfeSUf31ggRiizqQHGSj5TgU58ookgnpBHOrEjnWTN50mzq53agzgox+rXd7UJj6lSMLUgGnjgMFGttSoHWmdpYihjmvsPGVpq0ziGEbGEQeHFRHQ09aSu6zrGh4k/npIAYDWgVcWwDloeYLEGILOG7ZJohcr/+1LE2wASlUderCTTyX+Ub/T0sX7o8mhVQ4VWAOaZdItWYAgcrUZky3N3kwf8pWNQsNy3n8+wKTSz/3HQRWjC2etbUGkeK2Iak8SFH23hrYyz+8TUO+4shNNR9zK4yFpOgzCqKU9WGMziUskUVRgdbTQHuqqcmQJ0JltWW3feShzxsUWqzMr6aMV2pT5B3u8p6s6ket69baMzF2UpfuWtZbJtotJHOYw97Oy/Zsu3spcmDVixKHs6TqoVAArcX1JjjcpAmiEeod1Q21E3plXsGP/7UsS+gAo0hXOnpGfBaYxtcPYU/DoVyGvN75fsKeNAiqgmDqPRELAIMS8QE1/5b03KqGstq3EYJ0M9bqV7NhQoWWgkzfJpa0JrCe0ofJsS4ki8x0VVWj5i8kiMtStltEqR0BdRHsebagycI9RS2SUR82Vxo3f2aXnMDZQD14694coS70ujsELVKf8OIVLmGZLmhBAaB0GTYSPIOKYPWEB04dGSk3sUkWFlXfY3r1MnGSNjUCLfaz3KAJIYAEElUdKoxSIisqJ3IAB7/IvFn7ql//tSxMaACuCZYSescMGNLW6w9Yk+13lwknKTrRvbdCQJCa3dHCK2Nuw5CjQu5SWZLL0W3VS5Vk6sCbe+ksQTtoiey3//1/clQPIYQLoLlzk/nyeRAKAkEAbIBxOZUKfEasQ2U2hrGjtWkMYHGTSLLD3EzSi3Qa9dt6CFVY5gVNJT2rRv3vxllIxGav/OdXI2x1JPS2+QmqJiYu0Y+fMM4r0MMH5p+Mlp38qVB37tIk5IAOEO+N9n8NRlqgwAA+sH4K4SlRGHTM0szcEU2kXJ6Kb/+1LExwALUMFrp6BUIXuRrnT2Co64dCj1mcoCDkpYv30RqupftVPmL0ePSP+kvOP03UM/3ovinCzaPLYr2d2AY0Sl2pcnzdDnLUMvlN1gM0bhTlLTrYAYq3eTqu6xyCEbM7MbRAKRCb0c4i7EH4tNyWdPND8HinvdjA8/C8ZrigLjhOI9xhIkLYk8QkwUNC6QqDw9GamzaFIAttPq2UOCuv6kfhO33I76yi8sUAuM3QAROSQAEwegWsQwVoDSK+QxpP6dufGbDAo6SYzaEaEJ8v/7UsTIAArgpVtMIFDBmR6rpYYVmSZOAWSgMXYbFk9i8t2dsTUSAzE5WSeNNp8pKQre0mdQ80PSwmlyOmYNGnlIZxlDGV/d/2QF+hQAYAADJIAhTMS6A9UYq4sNOJBlZBNDyHYoVjQwi+2h4iP/xUOLTpEjcsFg4GvaFXRkjWTUxB5FglajXQIhRqJGzhfHPO7V/8+SS3UDQ9BEq06uxCoAwANhZrJUHjDBcpAcv29j1S2NxgQubQD/Lmi4ORZJ4xzAFa3VMEZw6XYe5oeDR6RO//tSxMcAC+1lXqwUb4FGCq009iCwvdGMOjlivQRqnQMOIQzOigGShTW6rrGpqnfr3MS10S01e9AACQGl9sL+xkOKi8NLsFZ/YBJfshcragLEp4DRoWILigVHjSR2jELFYZOfYqo++jbGd+iDi0KIJrsKa2116+Nd9trXop2i15JRJ+qvtA1AB0FEAKJuPJFeVQP+0UKHBMWpYxF3DupyxcPavOYOEDmNEZ8NJBVjQfNqCABTB1Jy5J0MVPTFA8+8hku4W5FxiomPSiUALurej/T/+1LEzIAK/INlJ6TNAU0KK2GHpNC1wWeKE2W331qgKEAAAKpZW6YOAhxDrFTkOciLLKeshwh4Ezh7yC9j1vYTXEUyPdBGYSlLan9Vr7atKvv66Z/1HaRPXs3/pI219CM5+n+s97ucEAFnlEj7AgGBWLHmJdEEzidepWQJAiSwLcf2BCxIz+E6IgR0gMFegkaD5qzfLDaSfsCQeS5t1CiklBxc2IRRa3BECaaLhpA+LFyhMgbMERVb+XYtZdQRKC46hFNqYEJ0ill4PicQAceJwP/7UsTUgApoVVSsMMxBOpGq5YQJqIG7WfafWbB/g8uu/QdWiTg2yqCFlzY2RKFsP0XOA2w4D+ymQJYhYGp0uDtQSqRkzEXhQBxlUcK/CeSKxYnibfyQWJ61Rc3o4HsXlCm1udOc7hZdu8Q4Gm9su4ochrAdaEAsLiMsYXuMzLppj/p0e4TSootilt7q1Hj6ZLrmL4r0drpRs68ufQQ7EnV7lbbDcE0l8EoTMNkBCIiF7m1GNi3/OoKOyk2n/M7TtqTCqSMDMCTjAASWxwALeABM//tSxOGACogxW6fhgwFtJyrlhAmgaZLDta/IqZ4Q2UaCTdA7vRrTbZp5KnOFfcKpl/skuKRTWGg7FLqmP4uNoMQubG44PjtDEYaIeltg2eYh3MresipQvXTZL50DPhFrzCFudm1zpJh0cgcbZKTcgym4woSGlhokp1p9EXuwpLrAHdvfvvIMerTJlnUiG+1DvBltzK1N0OUW0KmNlo5lwpa+y0hRVaedyxhhF9rXbDvZZCfPLSAq3QiB21bGCQAE8BHp0faGIlUzlGzPlVEVcRn/+1LE54AL2E1dZ7EHApO0bWT0J9BRTn+t6t55bN0emY/sccazHDsYb3l2UKcyx4sVGtKmV7kJUeFckRdTuoWVY6eSlWqRYunsyVYB286gBJUhCSFzLBAMBQHFFRKeN86TTRrKLTjRryP0GtQRjUv8mgpe8vNNklB9fg8F7ShsyASTVIjfXIE1hqhJN9Xydn/+ipZ1x8hN0Eho48BYlOL3OLSKAGesMuabQJYGsbVjAhIeolepo7u0RWO4i7ZvAqqqUKMnaYUGwbWq4HVN//YgWv/7UsTDgAwMoXWsmQtBRhLvdPMJoA+1v/4dqOcbyM7Pmxws5ywQa2ulNCL6hZeTvt2bLbtMJofKOWdoADASQQKMPJQpiCu2els0yqRqtR1JMc3fpkvD56MNlj17ZDWMavqO3k1jWzbSki4eb/AZjCYMvtnnExUHylXWz/LXTm/78wpV7Z3bJa01EnoUR3PUmlCO6S6qADAQIAtNwI4uOlYiwNebSm0Hip1TjBE04Hv3DZ9soMWHu6GBTNqgPBoMj204kkh48e/f5AhFTp7HEuzV//tSxMiAClhzcaeMVgFPiu689g00c85ENb/c6iCUPRWnWFDW+VbwCLvckaW98Sg2sw77WdYIYSIahz0rieUMbirlkLmu9bSW8K1CVCd+wASyGZtCsydrVCXzLfcW3WkT+i0Ihw+KKKHSR7JEgcrL3RXmG93372/+jDR3/3EiOW5V5L+xv98Slkkmtehj2UY5dQYzSFYjXyeV68q4tUG9PE9YKlqeNdF9uzNSPwh8qTCR2nrDRfx0W/7GJDFZhzIrZKCv+WxGfpr+v8hzGFN/3OD/+1LE0wAKgMFzp6BvYWYcLCWnlTjBBgobWREB4obR3pP+NpcsqkJuYi/kfWAEpMAaRbZCSnuJ6bhJTBTZ2bY/IkNurI6uB2Tq1MybK+/LA+ClOV4JlJ6NVIcNLqljnIcE6792I7yLfUtudP6skd//IYScOpcC8k8okMsPgUdvfbthDoSy/QnHKgAZDIiAhgzrRFUy+oLIQZE95XmCUoP4TzoCcjOc4VDcLEWLTom/X65bMu9m+W8GhLSHjqWlqKVrDwjOxOSU8NehH4V+1H0Os//7UsTaAQt832NMMUcBbh9sHYYVOFehFqV7mnZKVAAFBBQBSRKjNpyAQYhLlPtolHAM2/Spy4LK5YsP+IN5flMiJt73iEM/EiiMfpuYdnFOKbK79TeEFGsJk5QfMhFtaG7JEN6a2up99FKGW7s9YXkCKwqnQ6i15ysIEIwBJKSJPsp62Rh51Ip9INxQGyglyynLGinshUvMLG0ikiI3S5RtxGwDndedafi8kdCbrLVrUDZYRCrhKCrHKB8iwLHnaITOs6/2faDwh6rDmwFUvkDN//tSxNwACuz3d+ecTyFvH2xo9IoQoDCDGJQs7AJlNst9uXJpWY5LXEl87qM8Ewrr+xWekWDZ97WDxh3TRC6/bDjdik6B6MiI6bBhDA2/TCO7/YqoW1d/yOv09Q6/62RDN/6yrrTXyv/fKF/6TDrdDA3NH2l5/sfFgEEXGnM8NjFHsi84y7GoIWOy81ylZl8hlbncwVxJ5PSIpwQmx1Kp6tt4HHqn76PONQmNVU1Ga1JoPShxt89JMeIFr9H+nWk/XCQOfDASqzITGdrwf8Sw++v/+1LE4AAKGHNfLDFlAW0RbHWGDWAWQKiomLXvQOe5+fnQCYaAMbaGhwFl+F5pMGKM084mJCxY1QozZPzTAAFNDffbexL8kfE2WtX13muCip8a6OqrRlHl6+oEjWaiac4t9fPOV0qYqXYwfKCWQUCbfo6SHlWGHe0B08Crf/TV5ADIDTYQIJiKLlzjGugS/vSY+Bedf+KpreSh3S+GGFJr03trUUWmb5Z8z6v/yJh/8P/z/5SAR+jecdL39oEaAZZszGQThEajAkXtEAB8AgOfGv/7UsToAAvUi2WsPQVBcanr3YMKEcAPjZpXP/h4tsjIZ3KfUNAmAAAAAemW8coDgX0oXIRR7NXbW5vWxW4jA+IU8lBBDGuHPKzdbIuj2z/8pQam/7juf/fz8rFe1z8/mh8poyeSYMzp7E/RjKvWV8IT/oHECGWTvQbCPhlYNzKgmQW3o8WBo/WBHZ+9Uzcv99xtuULsJtMxV2gQNPOl16l6O/I5DTV5ufsU9aG3nmKOksRekkD7wPQIHpmEHP3NBybSe2Xt0hmuT2Cz0yiD75e2//tSxOiADLDdWuws8MFym+qJl504Ml9e52J0yPhGu6Tu+lGs3vXko1XV8l/9Pd5Gv/6W0v15JClvEEyr5cLqoQH0B+nMFyVV/3SwBxBS4djWExgWNL6I2hEoXlNKzHHGe1cnG5dsW2AboweFHlRIIyJoFipIi48SWxYWPiOJSSoiGjenF1nZxitSnqu9q1sV9Ny66gFrUZ5UiYkmRCFL6OEZMtAytTlk2Rnx3alB5kckgLpEbQq9YlUIbxiRKWL1h5W4iA9CGOBwGvlVnF4hkJP/+1LE5QAMVY1lp4TZobgpa6D1jhEAuBS6NY3jEe2ukgsBVGEDGPKh6mlYBIuZaeScJLJgXpFmieztFSEzIW/NU+JhMwmZUwr5R35te97qsPIn7Do4U+iqZ2RzLTzVMrUs2aSdUVZVKQGdLee+yr8ZdKvSS7d3ALFXLt1/qgAFMVEsPM9WonmylEd5HZEA5OEBR4Gkbm4ASF9ARpyicWZLzh4sIisxKKohraUozfbGTWI+tE7XYhHKh22R9MiMsrXob8a8q4a+ctOsw2zvWxfki//7UsTagA2BZW+MmFNBPQlvMZYgOLVgFQiJX9/qALEsWrjbabo5ikS5cDrUR+rLYRUqkYULi4UkFmutadQKmrApqpUWPYvSw46JbqiZcqsaTMmzUoaafS6b3XQy010+WgR4JLWLpqSKkL3MLhKy77jbhcwwiG0V2+wBCBBCQAAS/4chbqYaaK9Wd23Ql0rkJsuueLCYxEAM9TSvTexl/U9QbOBAfQVpTcTv/5gUmakhwZjvzuR+WS1xU5eH0s+7f8PqZZymYdJGLlu8J1vaXe+1//tSxNqAClQzcSexBQFIly509JVw2inhpYxO7WE8ta9rYyQAknBVx2NxYTDCrKBoGej24cymU8JTwcIrxKuC4Vw/txWWseEooY6oCYmTnJtEFyXsb5QpR1KUEz5Ncr8LKoeLXU/ZU9qHRXkQ5YwjyZHtIrQKANlhR5fV9FUAMeQM3qgJJNc7AUvVCGCrMlTDkoAvlcBt0ywtoOivkSRlCInzb+OMmpuNQq6LOr0TbPgQa8qsNVkw2UaFUnwns6rYp7+5l6lkugapPQk6XklIIln/+1LE5gALgO9lDKSpAXAd7jTxihgc/QAANQwLUAJswOkocWuSbjdFPURMx5G50DIYnj8w/nFqT7wQQMwBcDHQEYsSiBnhUNu18hEFiGUMAMgiutb23PNGADSb1HpccwXC5sXfWUdbDGRoVADXpS+2u2fCbywZeSRfr9yFABGjbP0KuB0GsX0Yp3SoV3MaorQaIG21sZUA0qwFmA4uPEOahWpA1IuVK5m6a6aNpoi1MASBWDIqCqd1sFndxKdKiIqGgRCCBFUlZTWprfkO7f4wef/7UsToAAvs72VMJGvBfw5wNPek/vqes460/QBrB1Tq7f6yNujU6XgjCHgULAXskiNWPxZPLG2FUo0bSI6tyrqdIdnPQIO/qvfdq8z8fuwYbYdAABUEEjUOjqVlgVAzePaKUjkKqaqUTCJ4k0Cq2aaQsuWUmns6VQng5jnG2iQWcw6DfFwFsLYbadSLMJmvnMf8isez764mcCcWjJQNhIGADACQxZx8hzbpsitReJr1KFJNJVWNJ9NRD7ikd0OZKHMcpwXnu9OYtq5Xu1NMZduu//tSxOYACsxvZ4wxCMGQlWyxgYoYvOxKROXX13qcs+Qh8yy2NEqkzSiaRxNkPPhxa0cjsoxt27E9JVOD/CHrmNosW0NewKB+08tJxk+khv+R+e+ZbsudB0LwmBMebcpd5noXoQhHqN+ls/7ggJEvY8UcI9JhN6oNdOJV1JsgqhTpNdmgbhHjXExYSbEPeMK4c8Hld9U7NwSSbVdl3JeUj84NefsvQYnVnNE3PcHoA1KWiuXfT0R5V8lf3aiV1lqxmRP+n0p0S5XZOqk+tVKVHyr/+1LE5oALbINth6UJQW+QL7zDmcQqr1K6oPSzoAACbGESAWMZJtM8UNQnrOZnYYQlEic3I1nJoHOZhbmVgIAmjLOi5dO7/RIjwMYkqZUFD2O+q8MB2OUhlrkp5i07mCm6r7rTuzSsyq1iakP9vaBYoHnyLd2T5MVUHZF8tQGAGBUBKrARgP80cSM80uZTCmxRQoDi79PUemBbsKvkIcyNESo3KVygv/PLjdD5+M6MrWYC8rDswzmRZrYFm/55tsdLPIOpxezJDzw9Fp1C5zQ27P/7UsTogAxRJ3GnjFEhXpRu9PQN5CvWdY5/OZfXHAAKdCiAjHBdtihQYX1XpAEKZ8hQ6OUDy2kfuW0zyWBAJflNA8gi54gO8tYzlUBQv7bzMJuHaZpTFwmTLOUHKpMWEwarZQ0u6s26Kzhpns8MZRO99Dn2MJyep93qCUb+F1jzZSgPGhbD9CIhcYeIpG1Ca2Bae7Kea469jO/iDm7P9/LNz9nb7stTOH5jQFpTnPuB/gQ3Z5v83/WfwHOSblEmNogyJFoVE22ejPkrPiHdjZXW//tSxOkADDmDcaeYUOF/kivxh6Fgtd3++iHs2kBKCRC0JkSAQJgYEIBDxKAhkjEowKIrEjDDDWKQYGycoZIRwvJjkEfXeMdlfamY8e+/rHvvH/7ylb2pFeKOESgTQyGSbDylFe7hq+SJuEiEHAwRSsIppe/oVPTd3A3A3B/PlHQw5wfWfh+GLGuz5ikMDBO+2XNPiiaCigLbjVaAijbzVYzqbj+YbExKmK6JlzQiVgyzG0yIGkBs8ha2To2iO8yeqt/dNZQUOqqGFhIGkhoDGjz/+1LE5gALnLtfjCRwwXCNa+WTLggAAs61xGnsae6qGXg068Vc2z8krdK1VuxZgECAEAMtND31kYeNGMJmTh9x5vUnx5yuzTvYARVZz7JBFD4ytDJNZm1ZEkUw1FXyP5mOrbb2JVyym1XQ+XVpn/9VLrT2VTD3ISSjVCHBoVc+2/C1BCAVAIKkMAOKmZ1NsDlTS4Fqts9LCHMi+i6Ai2Ak7Mb727u9WnIYoCJ5VfzWPBjN1DEX1j72GtQzEM1nhUeEnhj/PLdYih2QshNEuuRQZf/7UsTngAvRXXemBFsp551uNJeOaAnG6JEGUzBKV3ajcjdFuShCUOQCqRcZJI7xSaJMHlDhygvs4Bi1CAf5dcmEXpMzaBEDzVtMinPZ5xQ2JNn8z1cyUPRBgxXwl+acu8lk5mlX91T7Xx2xO3+rn3+bxclnzOxJH6btkK/jpf8cJwIIgFaHL2I1HVR7jCRDfM+VbFRGZgg9V33kXBqyogjq1bCGM8HeVEEgnCyyC1khKGYtOb3RmKiSXnNZeQFtC3bIJLvmTyMWnvX/Wqt3269J//tSxNkACmyTdyekp8FNI+2hhhR4V7ejstqZ0sYD1Bh87Kvi52tKQDWiupsn2rhljVK1oiJVaIj45DUfSOyI+MdU64LzROyCNKzbJPJU/V0iRdDgIVlYJgyI9DHGngQftUX4QtMr5h0s3SthN9qrsKnxirTyFHy1CxPfsDu5nvydAFIBAAYJSLgBgQpSIQYZ0sZeEWhLWKckAZ6DmQxEj7FQ6AIL99VE5goFMYwppBQ67c6MBnkjSM3I6w4ZtiJHfyQGW35HwU7T45HbS3jgONz/+1LE44AKYJVtjCRMwZuXb3z2FS0KsDP2JAtQECABAEAuBqznJ4rbQmL9XvFWyq1qSEYsabrvLIZ6GxCSRlMeEVmimszWZNdmPGQi3qnpZV70ixaMVx8a/g56GRf9akib2YHJSjpZ7PReVBEUVf3/xURmG1SVfkTf0oI2lysPSy/rKU6ocbciWCIiVxziDzGD5aKmXeojJ0OQDvZsbhlrad4QlRm+mCbtxKd0POxyMRyV7AfF5E35i7swvW3tP7rlgHy9AePOz5TWdNBBHnyUp//7UsTkgAxpKWUsvUsBZZdsAZeVaLVnCZXPL2ZqpZEVXIdCe0n+5VQ/116f7KZ991SVrpuxd8SRqsj4O5pQVhdSHbZHIACoJkgEEkp0QeX9F4ZYY87uQqPNnkyY7IjYIQzW2CswUJV24h3fO8uFpK0UIiqB/tiSOJT0ZEZZk0JVyUY2QtjoLDFr/JExjHzykaQ9Ca9qM5G1W0kg/9XU6Z0R5UHHse7HGEKfEwDQQoUwoICiEU5xg5jw98klBMQaKJcSRSYz148TiMtVkRgYWcAC//tSxOQACtR1aaekS0H5Mevpl5W4gFfeHD3GOTGLkqSfy0BqBENOR5iKux0ILHvt7Z2sVvWp6G6g131FYTS8Xa7Dan0d2+NqUsRlY219yRTcussKuS4jUIYjIEwy44kxmuZoqwWFDjOZEUnHxHSjw+nYHKKV/EMWfysl5B2oKD4gqVGX+QQ/1I7UEBQR2LFKXFiKXjTjQyHIhAQmYUOez8Xs61PIbcWSp5B6rMjqBCQsRIRcaTgTzKPUlkGyGAjFIXlVJRcm8yHUBozQ5YHiW03/+1LE14AM3V91p6St4dsx7TWElWmhNO5etJeoKwIRlcf9HGEaEJSFU0WHTr2x7ESN3Qjs6v+aNlq2X1VqSStrxf1Ga1hpoyJNnprP3RIEMOU8TuQCnX4D6oD4mqj/JsD+fkyCVxzDuOjyH4J/XbOXNBFJinopK0aGVV0i+5SqFhl/SJhHPg4BzA0UmUtWRFPh6U1NAMt1fIoADgiCE0rQbRnysL8pfOZJYqQEVZwgeF5urFZ3sSpy5Nmf7VY4Xt5PRfOqjHoFC1IGFE1JhxKt7v/7UsTGgAr0tW+npEXBWZFttPYJKN2HtDbY1YzlxCJ01qwbcryX6ufUVSwFitmk8behJV66q6YAcI4YNEmJDxJrLwoEaKHUDm+FjRODLvSEdrDYU5mDFNuKwqdHNUF3fFjEbC4NZIVC+SOFwj//HbnCRjPu1jVbcn8eSj6Oh37JdSWjdP2NfRUAkisIAlNS3iCUvc6Ig8fh3GPFowpeIpRSKztBubyWG3V6BpFV41atsPxgQHfzLF181pSDkSQFud0ep+qQouPL+JXyMo7/3jmU//tSxM2AClRxa6ekTQFQFK9w9Iku8Y0ou3oNAEoQgAEluS01pVMhY1N5nmLAzKwQIAJIh6eKUbCbgh4vH9ymrHzZlDwBnaQ/MQv3MDdBHXbdAba2NbQr2q9RVG8isjaNZ5kJrRm6pk7Udv6JP3dSHdCb2PuyBxY4nPhZk4GeNwQdchXGu2UXIVEqHh+WR/Hw/TFJkKITl1fAxLEOKtTx+nP3abtzb9IibcU99JBAoji9v6CgoH4uLg3F3d/ik/9BQyk/+Z+uE4QYKCgoZSIHAKD/+1LE2AILOI1hTDynwUKR6tWnpWgFAaGIKC8Eb/b9K6Mj9/+iEIeqnOezpU50IQ7zneQgt4AIzELjyqwQAvBrwB/HaP4zQhACeAwHqlB9E2EtaeL4WmWxSxCIvbVT6BwFGLPZvGZzr8P2MINFVJFTVlWdV7raIq4tpVt6uVmo5hZ7aaDkRVS2uU7Qs0i1UOr/R6otrAw/jjXX4fI+2eSS19S2tX5GL//jW6YAAgCFBIOV82H5BEiDfWicjMASHp4To2EcBRrKGJ1Z0Y+BEBUm4P/7UsTggAnkjWWsMKPBmiusNYYIuKiBJXe/hnNpK0lVZleUHyru81P9OulbgxTisXOsdU/T/7DNX9KhIDdpqSW7S4IgAsEiVqEm65B8DsZpkPXkKgMNWkKvYN4HjVqvuT6yclN+0ubU/kcheIp9gVgqGRn4r+TX/0P5DlOJYcy5/b2tpQY0z5Ne/668m8CMLLrqCgKmRZSKRSocxEsKgVMhfYpaWCbKYscFO+hEnb+nRvXLKvK4AjmyrZUQyL1x5zNVVmWz/e3/dZf2HCpv07P0//tSxOOADr19daYgVam8nW0U9iFhpp6omX0t91/v769nZ0aLRosZJ3k6gCCDiAEmmo6FI3KsNwkDSICtWecSko11MWOVcUlJV8peRJuucc6PxYMW//3tvT++c0/mJjwML5qlIAM6KekwPf7SNa/HPcSTQr3X8RKicrasmrJ1HWwSX8ObU6i8AJK/z+O4lemS4LHYLo78Yu4kjYfIdvDQomduJHXixlW1iYHQQaPIt5oPorhPY8Osgg8VFV0VGaTSkn2tgQU5P7NX3/2gCGPkUSX/+1LEzwIKVNlrJ6RHwT6a7OT0iXA6GZOSUAILiaYJBWI48TsWLHZdX6T1msFlZLSSAR0HWwFiIPoLPpwMbL5LFvV1bmXmHOnMpXOTjXV7IuztUfqkXmIc8+w5ll2ogYNAosSv5kp1+9x9coqNpxXAvYkyWbDeW+bvFuPr1NtyoV81r4nZKgAJBYJRTuXfWU+QjaNAIoWceGKKtk+5PLLW49hUL68gcoJwZHv+FKuGjKcrmoILeEVHZRk00SceXQjnQ37zG/3072PlB9dbvs2+of/7UsTbgAqJbXGmGK0hTI+s9PYYcGIRWf6NtdvPsrQBaSD9uMFVLLaUOqj6nKpJlZcoWGFNCmbAB0tNjRc+DiUD/BAokKPSj49DsVzgZStpzTEBFOOQiaVVKz9Tsf92/4hAwgEWFGw+H/sd6LV++Q/t4+oIAAAACUXGh0aOAPLMP0gRxgN4mTOtjOT89FZROAnWpSHAuzzAxiunnpMxW+7uPWtpXPMT/UmP/GyxjLFrFsexqy2n1jOGXxr9WaibSR0mNxnCbDaCcF/jUVistWLv//tQxOWACayBWAwxEIHXGqwo9g4tcSRIg4KDBQPjEzI8YQ6xXhmwn9vYyxuTtz5t0lCa5OQBckNqHVk0ZQw0YQLFV52Qb0lURkmQhZIhEps0ZTKTGTVjRhhqYgTKNUy/roKUSwkuAEASk4OqTwqBupH5WAIWqnvlqqWh91UcdHP71j3RIdjZOav+tSgyov377Lk6W/001I7HQp0RvuVUO7X/Wu2b/IdEmPerWI7JImt95YVwkUSvyl2rDv/tZBEkKEsIEntGkWiwlDIT52I9Bv/7UsThAgqQ119MMFCBTxmrFYeI+OxUMoWOVR8a6MzKYkzlJsqNDhT+n087uMXkQXIpJx1tgdkkl3kysu5wVWWezRS/LeqAvd282nILRfoc0QJZREZG2wFCciusggZzqhN1DuYEuI4AAshqZCmNx5/wz/zePoOVrl8osBIGBANttJyKQ4ERbrYmwBP2iItV//6lt0BwbiTzKRGsCnXuvlWKIEBXisJglwFyTTTZgVhAromw69LB9Wtdghh8+vfQs3JHAPzSL9J6oYjzOjeZB0Ca//tSxOqAFZ2fW0w9LcljLG1owIqJdfDFh9ad7eR/7TJ5ypYbbWk/pU61runXahvqHoJBrQ5Wooj+hrHolqIKgIAEGCESZALxSNnrbprs7qDICfja3ikAVduYAgSAZSlTBoPVxfbtEPRnSZV2rJBmfcV+gK+h8t/aC/1Rf3OP+qFKO0SdB754pL0JQdl+zbJWm9WmUHCgNuHpHo5LpoKwIgAoWbda2KhlzXljs7TBdJkZGFodqEcj76Iwh4P+gp2RGsz9Py7Q6/OQMftBQM/aOmP/+1LExYAJqH9th6Rq4USL7jzzDWwZ8oY/5hz/sub7Elf1EwaOMVV48/96z8xyaBsqFHCv7Soq1n6SxdPDScAIAEFX6WOp4FZUgZQmNKirKWlTCgF85TS26jG2k31eYjBNBQOr8t2Tg8f0l6YfBvKiEPO7fZC7qU/6v/c37MICw4Zu1fu6nYfBEaQSfIuSUw+HzLv99YQMACIAKkoIlAaTcPxhwKQgWGXhEkhdS7h2lURppX3+Y6q4/+8TOoFmQYeOihz9TN0fbaf87//8jf321P/7UsTUAAsYlVpNLRCBfBvstYWVfO/9N9bqfWcynczKHzna0VUTbtvXyYRtUDhJE2kxsV1o9pc10CbcEwWKDWUELHiAnDcAABl04/SgDyv/LfVRKNAwZQOXRoywBGRU7xIycnFaNubaYXE9NQqc68IzRAg1AAZxBCF55T0CAYGP+nNNEREVEU3c+lKZTktfrwIIFnEIYz730IzJEKIm4hIgIIIR0Jw+chE7u/h3CwgBAve6nLg+f62psREFKpokFgSS9WuAlKwb0RuI8c7kYpd8//tSxNYAC6EBZaww64FZmWtllBYYUWmzjr7MUANKpIF4IR04LtEw6aKSPMvjGP/6Z5Uw1e3FDUGbV9npwUdfLaJ70lgMKpCdbkR0rc4xrOox9Kla0/tLL8/vg/NnXKkX+WZzPJlM0qhfyMxpCndZs5w2BsxIkFCAQOaBvEYfB7FxQ58eyOaYlgbEyyb6SrM+vmIQC4gMSRBAo0ccIetY5Qs5hwfgFke8Yj8u1ej92GZi17opWKpttFX5i5GNsMqVCNWzlRkaSKhQktbzSL4/Qhb/+1LE2gANnWNhTBU1wceq7JWEjTCJhg+pBpHPiNok4iGhI/5jHHgXC4KNImYUHt3SMCBS7WMh1c6TEWm8ksDKeRf/9cSyI1KrNzeuuHqGvcPrATEoC9TIAAajKSEZ6jTamhJ9GOsKZSM/lZEobsmgWBu9RPQEBe7KjuzEK7OgT/JtMlHu3rteyvb0c/tX/g3f/UylpXSgy+yVc5ZJanGlJr/mFQAAiAaAIj1Z2rxdidCv3yuGIDVQ183xqakA8st1N5JuekREJNhckoBKWS0hLv/7UsTIgA65ZXWsJG3JNgfusZeYIFdlRyId/uagfOZ02wlW6oJau99FLHIHOo+N0W6G5Qlp5IjXWsAMVgvzVAwD4POGcRvqtkUh/LKiXxph/UJK+8czSLBOCEQR+Qo73aInRd4wVYqUxhTBxnJqVneylcq2SoWOs7lol6tx07eR/7PnqsZF4t5FKKR6PUoQABnScRAKSsIar+YjIyE1psOVGww99aXJ5+8B7/dxw1gepDa6Y3d7O9QkEexae42HbmPXaPPfPI+f+1EFxG2Rdw+i//tSxMSACcA/e6ekykFFHG709Anc0ovW9jvUQXq4pxuMnn2o1qAAFMEFWMFXQSQWFVjUiTSIQk00DPFNuZ0ixSvU3Yn1gogRFSiz3hhAV+kszEak2rwybSVfLL89eTX9x5AiFHzA3Fb6+sO6vffuoo5T/cKXbf6KACHq2bEjjbw+leyocoWhCKJ9LGjlFHHFnb0ISEU3pWUoKDbTxqVTe0fNs6Bx1Doq5KDzpVtRSupoD6oZqEVLK6o7lo+y9KiOvo33zF+iO/XRv/7aelBXDPr/+1LE0oAKKK9pbLxFwVCYbnD2FWzmtyJbd720t/0gABEoylAYIIaZLSDJpONAVJTOcBeKe8BsDJZcsElcdFg40q82DSSPa2aDw+tskPPTlUx+m2iu6qEB58DiAXNVJNaCmExjkMq0e/aTdqz73XKEZN9P1LFzi5gR1fKyuOREmEKgHMYxeWUw0YZjkQhSmYU0bLUr1e7dPVaeahOX/qBS0d0McGeqcbZypaV3djszE2KtBOyN0fsmxjX7uvb8t/X/7N/p/fbtej71asVLNf3snf/7UsTdgApwn2KssQ7BSBOspYegsJ/SRxYrABCGVACC0q91CWOJfP0z+22zpPK/kofr9TzFlSsPo2/oCgyZcVsuLWFcmfPKLIiXf7Zyi6RSUpPPO4z/P2Ft1OaM1XoeouybfFczJ3UJUf9f+6e1tegi17rVnELilQAkAQF5yCalkSh5bVPJ/XPeRpCwNSm3qkliNtyTMOuwEen12l9WLeqzD0bkffUFml2NougPDFizdQAe9gsoPg0sQigoJhAeSkea1tc+yuRldkwh6EzcKg2L//tSxOiADE1dc6eYsGlmk6yk8xZQzTUFp0zHdQAICEJGGFjX8uwNCc8SMt9Dk14lU+hD7BAyHvp12SQylCVqFfHXBjq2SmalVqZmuhZtmVLQD1Hr/0OjS/px9bf0IXdy1drDTa0UUH+3o2FijpVk85OhNTe23ounTNusJggGY7epVQMUMkVSMilhbtLhpThsxv39UA8Gpx1sMsetUBm3elJ3RH2+R5y+n+3l55CHk/q+raH0nsfZOoNiRaImOGrM03uTfx7myzELSK3sKY6130L/+1LE6IALwWF1p6ywaXWSLKWWGeDXZFFISIkABqPEUGDl3VhhpsIQa1FBYQiRU8/DKVXWpa1RQebvu7P1sbiBQbma+ZTDwHhilo0w+qXsiIZpCJOgOzVFKqM+4yaci2fmO34M2uqMtDl4IXd37UOexVBZq30+MqpPLZpqAzRNgEt2YW44SZ7KFeIwL0ZopdCILcOWs2tvLwbKpKk2/R6Dd5/KR6wJb9azOF630GoZnYojV0w7J+bWtCCxrHm7JE+Wxdvh1SA6byClsAr0795YwP/7UsTogAwEk2MssEnBfxfr8YehKMmSt6EuSZd+5wBJbbp/ciMwhlbxJwr5pRAmlCRoYAa4KRiWLDfnrx5Dat9c4/MYkgVwbfmrblobZkt9Hmq9kekZfc0FU7rnf/9+H3lw4qY4grRQm6TFAy+tnWKVQWADLY4gvuY2xJ8AAQgAUoCPVOkwucv9TC1cDlF6MuD/AeOWQF5xDe1Dg+O4Zf9wCGEJzMGhFuLCDLKXlu3+iEbu/uLHUlFw+Fr/WH1f8T0KDAgDBNynMEbGh+XeH/1i//tSxOaACzSfWkwwUsGGnGrZlYpYejTye8AEB07+8RigCG1BWXBcDOaUZCDQsknycHIjnFhL+mcIWjFt25H4plc3TxHbzCnXlWm0012hf3Z2RMgwAT6NYVPFWGTc1TiBNcytTIfD59CFpgeYIHie1JNrCUNuWRnhFhMQvm+17nGScyNy9U0dewx0tbucdfsPFiKh+LVxLWe1PDqpIYbewvT2GGDSqTCCkbcWSIc9Q+1DMm3CCiUZqU8PYRlLUCH+ipoDubieN5DjSMtyUIw0mrX/+1LE5oALxK9fTDBNAXecK02FjTD8QGWGUMej2VDzEH36zDOjB+Ki12nPrvtk0EoZ/X5s+dJhWQLCs40p9+zncEB/ZNVeq+xRd327zsMRudq6HGF8TF25+guPEqb/878+SPe/X+bJ6T3MIlhACqBF9M5Cy1VNt3GIENAa/G7tC8NmJ244GRHy0Fu7ZlMSvKal/w/mWKgPOWV0NP3ybVMvkq6oaILVJXQdltOrnX+zo0PfYhNFr0ySvDALkjoDSJT0ExGOUg6ElcP42IKkELCAtv/7UsTmgAsomWEsMGXCoS5spYeleUyET1Fh45pS+11DVimVQaIZ9ha2RzXQM/89QgpoK/t8xb8GU78VyYCEU6fOf0eMuXYWFqCo8FWKeePiXtWRIkqgBAeWsf1ahRBDqq1tTFNcy0XDoGlz7PAVW91CdMWNEqq0qYgwbR2n7OEgbu6qhwGwZaVasxTsv3f51tSFdx1U7GS2/crX6721PZK3d2nvISTadWdPMFSLU6ag/AwhgzmxetMxOVESreZojWv3JZ+bE4L2sxv2az0DhUMA//tSxMOADISvaAewa8lPla1lgwnooDZobA4qIpNIQeWU46G7EMFzBc1dULkhn/d2e9VllvLNR62PA4OirWNXAmFXsqcwCkIoloIcljaOU8IOo/sRXRunq5yqOi63CtFFMQF5I560fYZunyUBnZ5Vury9fdQHRemfW5UceuTKrqF/F+1+rt7p5X0VAMg1EkpN4nUcugkJCDXyH2rVAmu5OaYNHLx1Vs6RVVnXm31s+oLqFuY6bCLAhoPf/gLLTQVp27lA0nVTo9Rp1VaBK6lI+HX/+1LExYAKcK1vR7BHQToVrBWEidhm49RYecOobqSaYAYHHRQYDAAgpuZDGYRYAok11nQpWFK935ukkcdp1fT9klC4EMySkGy4CKqsrjTVWo3Q59UdtV5mp57H/73rbiSZuTKLkvUt/33V/eX7Q41YrDCmX85mq0UKABwAAAFuZn0BK7DAsBZFDRIZlS6mVyLYG8Xloo8WWKClLERkJ3Se9TTdM/9//27z17u5YuLnon98yiEdp8kUKGIiIh9yLvd+73LuWLjx7lvwnXFSW7lvT//7UsTSgwogYWRsJU7BQY+rRYel0Glcv1fp08f6R1FlvQ1+KPxQyDCBzoPl3LDsXPGl24vAohgvze3GRTCZtFYWMydwJIgDFgvxs/J+BPlkIOyhVJkuaHkX3Sq59IO0S76o0VmbiYaL24Y9xIAkLLSI9xD1KrxG6kgnaDln//pFZOPHCGL0FhQg46LiA4IxzDYrACeutKHY9pVb/xlTHk3LUkERgN0E2KFDgUpln+cCuOlUvzmi+Ar91hOMLSGYzuKSUrk7ABRxQ6sU65tsRpXS//tSxN+ACty9Z0eIduFOF2wdhAngMWIwIYL5fnb9dPyBAwcd/+35rmljAdEmZi8N3GkL6blsl3elAAANDiUtbbQmP9DNGsfzgL9ENSRFphE/LBDQ2DMmFQVzuIqmJdDZd7sCp62//8YLnseqb92arVaaisfqNQRKIlTjdChGEzrQ70x0TBgCu//uprO/0W6yvK1kamEAQ3VFI6peoFYl0QX1GmgqoByqmGVZtYC3aoTmpKflTEPazzbsroo4L22yu6O728KRrsGGRO5alStkczP/+1LE6ACP5aNjTD0GwZOdrAGGINhan/X+GBWV5N7n9Y+qhC+O0ypqrrvZtgAA6B8fizSWcJktUyEK0n6Fls/BKH6LNMW5WOqXNOL3Oxg7le895utEPEVDeXdfTr6vUdnGDwThIUNOVNzWd2MVOalv/R/y6M9QrjfjDSPLov91NaCJA8slGYW8cjxGocvrY3JhzTk8khqp0KooWVQi9+E4enOaEmdcXwam/wZV1WVW3W3FdI1/LmvqqYZmyGn6FQCWFHMDL+2sil0W9HQmBkwm2v/7UsTUAAp462QHjPVBahJuPPYeGL0QEAHW4aZ8PPHwMYRSMbyEEdRylrXy/rB6UoBSv31VW/ZKZMKi6G/FGqxGOJMAHga9czFvf47860czieYAMNckxnytq26LKqp+9SJ2ZShAaLC4kgX/efH1CelhKOvLBcWef07vuQRsNLLtD71A1Mgo5Fdmil0PQ43Jb8aX3Xi2TVK/ElOBpEs00P9OljBAA7d+KIZ9yNoRmRir1yc7xnKufUsV6jC6qjA5QIIc+0oTCdhdRxWvB8Wn0EHB//tSxNqACnjlbaekTQFOnOwlhh2g+D+P5NxzBCQpuIqJlODgEnJwHIlDsJmnSsZHi5ob3HJmNsczz8ZfhfX78+1C/J2Bi7+xYP/Io5iCivfFhhsr514lfjABOW8QpFAzQvLk3RPm5/8Sb1L6JeF9OUEiOFDodCjhKRO8Ozo9CCYXqfcQILFYU7ErOlr2XDmQcfDVgSSAKdDQRSrGaKWQslSlLyqjVVRY29jRJyDgiBfY1pxppdJeRIHDYKSPE0NlGsZhKlW+knFqEb2/eY1Nisr/+1LE5IAKTJFtp7EHIZGdKxmEiiD8Ln1FyBWW6PDVbwBH+1EYSuM1DNm2Sz/nxUtt2wzQjSfhjpzlZWv9hqFqRLfuhs+XnflbEUevsWzvmuzsj83/xU1r92ruc/GsHTMYQRJDcEGBBmOpJl0AzTyy5QUBMXIm2jdvlALbl5BtDak6TGb+GT5lk5XberUsNp6ws6wl1JIEq8U3vSNWdEoLxnAaCKGtIOe8oRNoxf6fk2vVAEIA8VazeAByATSITgrUicW6JiVrEBzNAR6vIYHjYv/7UsTnAAt4nVgsGFDB3jItdPYM+SEBV697aaw6RvDf1zKXOl33r0IIiSRImAl58ZY2+wsxoxDEC9/1FAKtyZ5pO9jtl9jiRCsAZRAAgId2X6T5jtA+SRndAYGqLH2RKpDKBqa+WlQzDJQkvm6h6urMUs/btvRhMFe1NBEMc9g6fuJ0tbZOsjTaLbF6xKtWR4vV/CDNQ9gVatWhKgBoEACWwBIJkenN5bCYRGTo0MysU2CN1O8s21/m8Y1dE44O9BDu9DRD/0pd2lurJVTFGeXp//tSxNsAER2NaKekz8FFkq4tpJT4YEMOtFqHYrlVxiH279zUzdzm+wipe15Imraev9wINdiIjVCxGaItjk7hM3eCBSA2JCREFBGBEYXQa261TP6OMLW3ToHPH6YIOlulgxznJnvdeeAoV/gSnWvLt0iumq+RRV8JNg1Dynu0t5go7/ZQSgBlAAAVwDlgIQBVSqNCCoWCj4JmDawWcIZMQoMxgJZA8Qu3BT/VbmgLZbu3J4VHPQ8MFTseXCbhaBb0KbZDXXscqKuCLDSBfo/d6Mj/+1LEy4AKYJdvDDEBgUmS7aWElPjFWuPG/4v1AQgAAg8KjoKO2FZKBwO8oEPdqNOxkysIq7BuhpP3OTe2RcVwMCCEvObZ0U2m+XTmPSh/07Tnf32RmYN7soyyrZXYWgLhxz3mZNoVATFKY9GQ31frq37/2yK97LTqu7F6AIr8TFSZabosyGn0nzBhGe7MmRLQlSfy2O/S8m507uqfJwWIeTZE8DCQY/V6eFFCg7yBRKV7vqocvZhy2+4YZ6Dp3ATmqRa0ABQzLOdQPtLxPtl/uP/7UsTWgAo8q20nsEXBS5SucYSM/CxV6rlOrUuWQaEBE4ZTQe2003ALiaBomiWRROLY4caENEDY5D46v+m0lKm0nJkqkFE6friSdwoIusMbeRgHk79A1zIiQsmccpXOFZv4gS9Hj66e4g4STZJDnyt1Lhy3107wDUo9/VUAAGKg3mMExWEGhkUqEupRCW8bLXdudSAs40eb231hLqWeniA8zdb6OwiNdv87/FwOSR5StiTwwCSHgYGNV5LKXPuQnM3zuqYHrI3oMfi8olPq57kZ//tSxOIACmRfaSwkx0F9k6xZh6S49jqfX0EYWWSNtxNKc7ToLciDoKUzvVKMp3Itcp49WzM8q3tdz4gZ2YtI9DYnBnlUXBaM4/9FvOt2d71vZ0BhzOMzbCXQxqtSyLWNUJm99pzCwuOW2fEAu9x8GnDxKFQ42ccfZA7FOSoEEAhaaMiFNFMtoJD4JmL7f+NPdJWASImGns1h+AyiIN7mcnmNIaoyM4jB3FBR/G0zRwwgDK96e+a7LrbgksSalg9BtC4UBtzQiy5KWJp2W5bdvTr/+1LE5oAL0Ltzp6xNIXOZLnzBityYj6v20IKRTlHjorEoEX3bSyVGuCPtfaBLDpEGQCRK5MLoEZNqDk86Wjede0ybzPevG9YIctksIKrK5gh7odjhr2Vdetf62fNuWkzvqzLMqetNWvvsMBHKbaURTGfTDSz141MtOroCyBaSbgDyXYT8oXMeQ2WCZySt35uxVz5UNNsiuL8XItGC9NHjWKNbu30HhQZcjEUZdzOInpExJ3qzlSj+6n/dtdu1f8pT0EcUAbgitEUU3M9p2SmEDP/7UsTmgAs0vV5MGHEBixLudPMKXHqM79m6kMiBRbU4g4XECGEIiy7By86Y54Ox2TC+RODi1zWtrwU13G34SqP7DONIyIfRuRd0d8alyC7uXSuqIdQqc33Oci+u0qJghzwQg24T6bv8cpPgZTItSZYLFlsH1JVrDtiqIABSdP8XdSqAiC8qBIWIzaGmkt/L2etwjgAKyDX1MxrefokjSh0dKlEiwYDgc1fEhuOZfB6k/1R5u+VmuC3E64UshfJjGsFyLByVKe+VvL2zXSrr407Q//tSxOYCCwSXWqyxDoGFpKwdhIlwSttQVrH3uIAUITKZiabwApDeDRS52kMIEW5YVqENC5Se03u1cVJ6jZ/zT0c65gCLUn3jX7/MhaRTImMitrQu42v//fLjckIowyA0ixDUYEV3SbnARHdLxTe9yHuELSBkYEbMy0X1VQAH8QySotUsUsocAjpmemW/TfHgAgkkMKxAqfmBYHONPvlTgAFJAsJkxQw6qIrJpg4dAhEEEIjk9PZ99Wg/3xnzD0H7tvj+8bO/7GR/H8a2w2Z/f8P/+1LE5wALcP9m55iu0XwVa92GHPhN37M9gSEht1ChgoFC38dWvadSUjcWY2zjIQnEdM6HSO2b2RbsAiN/is5j/tshwYZBUmX8uxIwFI0gmKCMNHBo+TJCsIhGqQpsprj2ham0aiLiUs4sQhJ5IABNQf1uv2AHINWrb6lANZkgZHtIBMLDSM40UKOZE4u6PVgNk/E6/vUNAAk1SZfF0xD7JYbj0AWxka5Ro0gkWEwXmdDodm2XvVU6P/xTdHpyn3e7N0Qow1E9jnfXvFcW2hAcXP/7UsTngAu4lVhsMQzBfZks9PMN5MZiQX3seY4u4GwS/v/M/X9b6wlGcFK39yx0Bdb36AIBASAUS+SslrEJuSFIqgCEozMLsBPyWD6JyYifnUgqlxKOdakBPNiE8V1j0AXnmEr3I6oiP0wMjFhxHmkrikOirthXqArDaQA4ss6uecoFOSuwxxpEBmHRDDmYUEO1jRlxsQD8UnyDPPaeXhd67G1E0QrA2plqXS8NnRRsiqLkaReo9DtvW8JRRG7PoW7uzz2UuZCnQsExh+ogLF8y//tSxOaDEEFJXEywyQlOCizE9JjQ21BcACAppLzgQsCQNtNGGO4gZPglGA/mZ6D3g0Yh2JBbL6jmMPe9G6IrnBi6HYsOECl2K5X9WadEKXaoJD7NFMHq2zQl6/UeZJQh6AMFZTOj4feSiJgulxBNkRA8KHpLQtJJqKpkCtvV62utOiHIgtqnN06EQeRBXoELrgUSCmHITpeAOmKfJ28ykbCxaRoCO2u0084+LijkDvM7b98SJp37Zwf4za9BgtidFbb9u7l+/Or98V/4+es4yKf/+1LE2YBLGLNop6SmyTqILKT0mNC473uzfrfMgGC7rjTZVHK7G8hLmPFPHeKSMRXMDupR9dBhY05ilmhm/g8n7bMCWgUIQOzpUGRBVSnffY6LPo5HhxDET9euZqXcpBQoIpAioyt6VuF3dJNFl1c0GmrQS5Z7gw3yKNznpgAQSnAsiYMWS+bxDaC41A+6m0Pq6Ko0ybmpp45TG3SAlMqR4TRahMTTEhUpqBDpLrOHo0DJ1lGarUjIRzV6CNzNX3ReurSHKNjEx6QvlgUEKyWba//7UsTjgAo4bW+nsEdhiBpscPYI9BSIuXY5Y9o5pfehCjQFirBf/fQEAAhaoCFNDmBWgY1TQlFKIehTR2RBdU0C6wlNzDK8R3vLQ958UBkw9ueYF1XpvTYNLu6nUFXxd5tQKuHmzSZfdLh0w57q31xbVV9v/6YMECgenucc50qiFFd0aCyCrGcTHYapGLPYDkidUfkFwnIu1BBiAYNNIEyrCycGJp+zpvMhCXne78pGpgiTDiyZAfn3PhPpT0Ipzsmc/oinuf+WiIVPdz9PRP03//tSxOeAC8hra6ekySmCGWyo9gj8czR3j/uLIGxEgvEK77uHFwoQYa0/jmj8T+AHTDxCFrkAlNSCM8EWEoRKQpsmcxNUsGRqBIhMx2lo5nGdpsJQGAUYwSZ4r3iMzEpG59z/6mCFmXgTT/MwosGCcwNnN0SwxQxAwTstseSaBRkVoFmdYQkKpZkUWfjqS7yhKfZTrI1tTJ76k4pW/HNoV7xB+YE8C5a0ZYuNJqE+2wu3BMOHEeCcwWZPGROTiDBIti541F0FSIhrchTZj7Dp1QD/+1LE5gEM5MtSbDyrgTaNqhWErZAmVlAC4iHyt1SMh1Wpt4pejlBheikZotaxu/e5l3mqv57VEZPgCRB/baL19996XgnykLkWLX5yqHV7hn5kfvkLK9JMHS/KFr2uwVSgddrTRj87kPTVBwWLUAAQYyGlRJBoylbxby/XzXL2Fu8AoXDABhMyKyRVQgg577Vodpb1kHMr3p53WBxTyiBFI7hFCp1qXmgk1g48izyTrKj+1fXoZUn+kBgDQq00YQAEVo3I5G2o5YTZkzcQKox3Vv/7UsTpgQ9Vm1TMpG2KajRsDZGmMCCsTGzwzW8WfYaK/giwo4WmCGQNGzJV173KwyBoFWCrKAm4XWWSevJYUHtqVEp9CgK3m67r2Z57ryNX1ICaJYDIoDQOIwhPQsNDyxlG9qIUI97S5Y8DtQMqvL1EqKkyD9LawTINU+3tKns8d9/x4feWgiKKlBHtWWmxq0Wqr+PY182vdF0bknPZU9891CK7quUUy0wsSmj4JSGBIwt+hQ5LwKy1oy1t6mGT554cB4WWL39xOWLovs0nB9+f//tSxLyACzWLZyyEdclEjezxhI0gxhlb20pI8oWKEyjyblMdUoNmT2VJN8u1HcxLTiVjr9bqP9mnAOS8qAmSEMKpvXXRzNKDNhOBRwbB9ckrkaA0SnTBkrmIAkH3zMp+UhuvbGmTSmfbQXiVK3BN6QELEGJmUlgfNl7DrqiDIwYsV+2vduonKmKuiwqKu3+tAAKBGqLFUZzUwiADQYXggJwn6wOlQPN4JG0K9jiQlG9qvTUtYTivJ0vdeixCnLCDrHHDzBk5DCArMFDjSDi9vQH/+1LExQAKeG1prDBjgTsN6tWsGCjnWt//kk7GGcubOT6lo2p5D7gxCwecIGIdS+KjEjhVJB8sgVpl5ZMXtfhP4V+18uY7l+/sEE3vGMZKbxYr3rN7Pv6bTI51jaaDuxEXfM/e98O2N3abYyLhoh7t0HTdMxC3k8LKVZNcE09zX32g9p39IZBhfTMVeNfdnad/KwBnLycAAC3/ghpAA0fgZ6GMWY7Oaarjqy5pm8DkJYxOEBrQ9mUEuIDg/gQz8SjPdkLpBkGQBwMkgzk2gtDAdP/7UsTRgApUbVbNYMFBTIvtfYYYNI0LMNWtC71AnrqPKVZmEzAJT7kYT0nuBe4xqZhqaZCU2IMWVLPFsYh4ZARNASk2lzIUEFlcosmYgazOx+AQxC2+/9kkCcTyoZiRTgVuwP2sRmhlTR4f6KLUQlwfq6bkjRKgHJkhDJwQXD0+N9s8iQ6JGB5BI+p3nG8t1Uc6xHTC4hJzDKbiZkiUTmFxQMAgy4ybUHiWxV3H7ELChBFhEsuqqJcYKSlWL41FhvwZkHBgdKLw7/72ESTpO6vr//tSxNyCClhfWS09A4HPsGsFsJqp85nne///b/ZXPqBDoyLFyaDouQO7rAg4VgAaSASIKYcxaC56Oo6xjxd+gHO8UeIGRdu2nA5AcrU1a5axrIuytc9ENUCx9aI35/7LXMY9aIX1Z+uvXf9+tVPJGJh/HDBY36hUzWSqRcy+GTLXOv1zLvWCEbS6CaKXxNJigsIxBTDqTbviWR10Y6VU8a4qfiXV9sNNllTzo4nRsu0RUL5aagsk6cg6w8UJE1QEsxrvO5VXp5GqJRd3t3naN9r/+1LE1wASGZtoB5h3wegpcCjEjjqdqGjXZi3pXx0EwuUk1dw5UNHbLPBEGQIHrLhJSQgWTFOrItiylbrC6iM6RFCCXv5GElaCAnWczIdnK1jem7BhDMf3cz2W+vZf9S/d0OMp/9dmI3bd74bdXf+9WZBDZohiMk60kCgiVhUIY6ByHhWYHsdi+floknBTfUaRiLes1vif++rQcobsYamTQCgkwfOOWX2ddU/aVqBbn0Mx5agnjatIubN/Z2p9y7Gb1AGIAwBRhFHBEyh6whsMSf/7UsSvgAsFB3VmGUfBTw9vvMGaUOp5KISFICVQ9WsGD/w/ytfOMXNSJ1RHh2rB4lXHQtV9LOjaPfezGIEHBILGVPHqYl8+/TxaGVs8VzH2bKMS7/+VrVtCEBYgkRVUIf1IZYN0nDfy1Gad6IhPdi1CkaUSL3C01pxRsOobmu/z551jESaplbpS9WMUyLcZt0PR3HZEZu9yM3/Vmy/6Lsgwo39iPtdvF9UXMSDDtKZhVCD7prFkeWU2/b8WZdAk3JM2eRkqSuIFYfAEJklVxVH5//tSxLeACnD/dYwkQ8FBlS98wwnswVqGMw3IRTMXcZryvOh2R1MdsyTlMIerGGpbP/TdU/df0upDuLr47bVZV6gDQFEcYmRWWqsIr6jkawxGNSgO5NOVZfv2Pit1ft1UUazI6b1WNKiBM9mGM6iLhnfW9y9SLM352GHpScJUOUhC/8XeJm2+j/6LV6wI91C18VSqBKIBGSLVI9AmQyjcRMZMmBSqLHSBsVFNvRi1UrZaajzruk+9I8GZdhWYYP0MUDhEwlRLpFNLgu14sAB5gQr/+1LEw4AKSKdrLKRJgUKf7RWDCeiTOe1TP9zjJ1jS5+HLRkksDtIwx34sgA3SQBT+Gol1XaAZ0ATE9BP2xNXRkyFbVQrFdnUpU3ypt9TGayKZWWdIPZ4mIw44CMYEVkH2S5Wpa2ooYRQn8AUIM/Rp9Ahtt1tGGaHX77NFABzKAECAs5SzxGhu6mFPEHTK46kxIXS8WGjouI33nXunNRX9kX1XIdKec0f0JMvcz7mw+3bEPd1Gsp4y9QbBsLEUjGPTUnR2r1vjKiocQLuyynUb+P/7UMTQAQp5B2IMJFEBRZStJYYU+LsGuE1HfygAAZiLRBV5Ss4kGn6zpoUNP5behVkNkYBXHywBaRodhkYSciwFH9aabCKYE9zR1KjvTRK9WbSVy7blsDAJRkS1hJjiyWCWFYwXLizVhCBq84WqyW87ZAyXqCwfXxTX4ooABwACnE1msmgDwHCKkZx3y8kSNux4jtFJUIZ1CaXKh2tEREVShzZxet0W6DVaeuiTi7Uc5yisFwRIlQRDQlDQQTI96V9onCblVTH6n+ncg+MGHRn/+1LE2oEKkGdtJ6RnwUCLbSWGJGBzlAWLGoaMXtICUEjAScmu8Q0Rvogf55GS/fLk6GdtgaVJ/UVDe5wrkL8tCgqh9RAo2W6H3p0uASZn0jPV6Fe/PBBUFGjLxdxR7w6syPdJHXMgYem8lU1GRErzzzG6SUo3k1+8tloAAkACQmpY8jWaEIJmUMeZhVvyZcMoB0BjBOZIHNgksozFmKL0RRmzMMR1uJ19+YbI4cAYKxRC3U572T5voLD5BJREifHYkQqd7MPOZWvwpsbcWi8XY//7UsTmAAt8i2mMMMfBfhTtsYSJbLfWeX9wAEASBACTkueuPEy1vKKzSwVC4CgxfqX3XIz1eckKDa0WMe9h4PjTAdho9ij3yN45KxR3Sy/pv2V6gK1FOVLhJnal3RivRnTn8q6ztGzzruhlEXcPKOQtcoYUAWg3VY33rmoANgAAJt4XcMCWNt7LYcleb4G2XhF5tCe+jkYu1dmKmGiboKPHuqHOJPQjYTWmeSeh/9PnomSYkEj9bN5v3w2rPN1oRVmXnt9RtG/47/Mkf0/5C+DT//tSxOYAC5CpaUeM7oF1FO208ZYoGYR0fm/8P4g1/657vh7AYN0OUWoNA/0wbSUSEwvGzmgOBb+wG789vJ1GY6ujuskXcXaru7nFQDFu4t6e7m7+4snd6b12rlEK+7knT0nv83/8rv7nIX6f/5f/2Ii0OLRDpoEBMewa/TZrljiuyigB9VAAAKXK9elxHGg+AJ1uAwgKhGYRUO1pvAFDkrzXCnQExoBJBIbDYsDKxca5g9wKpFgaDuSQtq+r1uZSqtFlaGDIqoVXu32p0Fg4lAP/+1LE5wALVKVhTCRLgYigLHWGFLiLmkII9NQGyNaqaGpIkCm1m0QdQEu0e7pViKAYleEpjdO2VTc8WyDx8yYnyBGZsTy5A3HBDFpF9yXmnkfS7qvw/cw4ZqoQlzviVN7vIBZ6hLWBFB0mGHDFOAoeXGEUPa9xgSsav6YChJIAi6s4i4KwW8vq5MA2Y7cUQTYD442UgKbBU/bBjxC/V2x1OH0o/SztE7rymSwbMr/Wzs5JKfwGIMUIMLbWdqkMGkZ42KCJRIys7chL9axaL4DDx//7UsTmgIxopWEsJGmJfyetFPSM+INTXZHHrtAgliiSK5LMII0lvkQ5+JP3NRxT94yIUQ6uurIybAChZ87IO6UfQhZGmotqwd3MmGrOETBJbVoUBD4LgubHBmLH/7aBYimJWsywTDTk6N2jJvrMJKPErXlSJJos4laPAUoANiG8FQIYpSO63yikAR2A0U6hVLCItOROrl5fCJIvX/nymarDo6utTwMGaA6zEocpOlfY54gp9/9Yo8lyzkIh/Q3dFKs6KPniVj5YydVMVkIpXQpi//tSxOMACnw/cSwwaIF/lS889g1UHnlqJvLDnupQEo06202yilAfwDIJABgGhdAB4KQQiM6fDAfzSg4D577Kf2TtvmvoYQWRKFHKHjlCQnfsb2f/ryBMUHPS+os9Gj+vOnn0vGuaqhE2KHhHrdqQYniiUFbzm+oO1QAgIwAEkjbeVarrXZDbiN4+sN13hb6xCc3jvZR7POtOtLz/C4xg0loxrI106KuysDhRv6gfU4WuSc6XkLVok9B1AVDzEzUsQAwxZ2jLNJOcWSWSS/rLMWn/+1LE5wALnLNrh6RpAXiNLKWGDVhS0jDvnQ7YVGpuIpIApQe5xqwz281DORFEyo1QciIipt/Fmz0RcN22eZ+1JNrWIt95ZK3Xtd2sdKvPXv/sUOJeLYa8ht5OoYJyrt48uToQd7HtEixUfGrPwsL2kgOF3NQmQMIaqxiYFce468n6SJ6dziyr7QmFcGmcCrz8VydwIKMu5sywNquDoaeJcDh3Gi7GUcQaPz0r7PYgSyv0iC/eVHVDCzWHoZ5KUO6rv62P/1sS/12PVXLZk1MQzP/7UsTngAv8u17MsGtBaRdvtJGW1nLDmGRacQSLj8+cEgQBAKpD0BbcNYRx1rrBtdlMtjeFCqWdlEuxyrPrHJmm7xBIxRMfmAyFuIMishulvtX+ttXukzmHEJbzMjah8rlEFiZwOzxNFEx5MqkSVEN2c5U3Pmp50+FuSJo96VMoXuROHPCIJ08yxG//mHpCI6oACJAAAIV1wV85PjiQbRR28ZpcJ5kgMETby8Vqeb/hIEZj6CwGD/2A2Bb5I9ZHw0t5r5sWUgEpHZ3psZ6Pq390//tSxOgAC/inZawM00FrlO5o8wnul2M1tjEdTBRkQ7BJ3g3cBNiOsiqH8z3v/fb/fYSAQADAMwHkoeMkQfASzKtPbMctG5kS7U1NaCLcQHwF77mMMfZaXj0unhaVPVaPzELjMfTGKy49cPmYoctCtaeZ7p/eXL3YImhKyRMGmCIcBgKNPGkvlp7QqyV8MxaY5+MlvyH6qgF0AASKbcHsFdCEFGM+ONVRCjBEwLhO5o/vcyswBNYbkoCsPC0vUGJZl6sWVR8yUEpAOFsxXAw09Nr/+1LE6IAMpW9vJ4xRcbysLBmCjnlUqDYKAQ/pq0uGLlWKQiKNpsRd+Hbt9FeqvQAGIDES2QMLtNwERzoGAmGx/ito2PioZxlIMmmaPsOWj3cww6nUBqlcHdkX/K6FM+a4j9n/uNCmuVcsRikl/Y16fucmmVKav1q2ROlnYmpASx0Z4Dzo4g/5wgSDG4bYaq15ZSxCHngd6nOAqHBG0QD0tGI0VRe4ATy0TjSezq7KViId49kdXdOrKp1TIjQAC3eNFAWAQCoHrsfTRZQ32mev9f/7UsTcAAulR2uHhFOJkJKsoZewqC6N3RZcsILBFFKphJGFRjlJqrQSYflIhlUPvcRbGwoUlpz1cGuvNPTrc09j8fDKh+rgEmA4WRGdqGOZ6CQqw0jml9/oto8BAHCgZPKWF0NYrVa9iiC10pHtA6zKU1dwp+p1B5iLNQkqFPQGGg4CDUwqNJgwNNQtkKyTULJkSJcSwKlecXzOQJkli0liUukotNrxNNRFDuKkU3VbVLPJOc5jnKU223/e67+LpllYp0P01Wgw8kCJG72sr0k0//tSxNkACoxxaUewaME6lKwlhhUgrSOdWtQDX63Jur/0AKhQzwRQCRhao0gE18HFKZASQC8gryifllpiY67zuxZRDv1EMSzAfeakcfTRaRtc8ctzcJ9d7SQnoOCpZhw0NIf+6+oIP/KShALEAG8LE4YidZ8Tkwi8v6OfrfUQAICthKAoKPoDVN71LK2AR7KVU7/M4hycabxlZOfh0KhSHWz0at3qx0ajkQjTVmPI8Z8MCsiUzjUClM5hq+em2xOMjymvvJPwkZjn4aCxlnFCBTn/+1LE5YALEKdWLKSvAYcU7HWGFTwaOUI1CxW2kKEGZOer7UMUz+kCiCEMkKAwGEEM+Vs5rk7fnsFGKQIG5710aNecMfKoXObE5pIEDEIN1OaMnfDIIHeWwdPAMkAADxP3WG1mAJiJGZ601ynYbjg7za3Z2JYP7OQ81uMqitaNBtDcpYFWyaF4KO3au7VgM0z7EkLUmWuG2uFYbI2Tvfv4hybh5KFCKxbZtGB6Np0KKDdnYqqpDFqlAUC5iNxTMaOjrrQrG0JCobQwxYU42hZVb//7UsTmAwwEtVANPWmBbRSrCZYg+Hy5RZ5FwzC3DGbB/zUlfkhkKZh7LIi/LbUDRmlYRVUqcaUfCMEqV4rPCaPh6eKB0MTiJfQmq3Pqx3+KhLMqRrMGZaqgAq8h1NEKtqtf6QmYtCqyp5j3OT5Qn9U5/jl/8t8jY3qjGiN636aWRpFIhAwFSkIyYX0R8Syw44JbZadbLe3rD9eeEn/aWqSoycarVKBMTc+T+53uRWt6rGgsVHDgoA5IOOSsPCwfiKMJtxCu1msV2rcefYaPRUc3//tSxOYDFBltXKw9L8ofMa1Fh43536460VUBIXRWeCUsSJDLsLShDC1Khf7OwuoU50qOaCX1aftsQNFztKk7/O/eYUm2a8fDOUJt9uYvyGl7mo6jT1Fx0BALTQeo2drXelVf/+iphaLDA60BZ1vQAM2hAAGUgHWs4QHC4BUXmK9akwHj6LymLugsk7tMd1mbspVlInvguuPGFl2Np5nRkUobhklTSPZQVDKrxEIr3AAoN0CiiQw3SQIzt6F9+pimtKJXexQAwmYAAUIihObqsyH/+1LEr4AJnJV957CjwWqS73TDlpDHWclqUKrk+8A0HCVeKRvRFQ+U5tDjaTjvxM8rtjkXzQMEXZVrPrra9kNpWgsPYRXimrsV72SKcTcX6anlANtq9YSV3/aAREwAUAUcCwAUaCFJqvbZxFnNq2V1q8PMvbR+AeP0T2D8fCq3bb2mPESehXG60QlrV8+xqH7rc7XKCQ2qZJKLBlWiEq9WFje+5dlDEuewPaLa7GGHC0pVpry76gRGVABqwTOCD2yssxh5sKeFCSurlTCp0yfdkP/7UsS5gAqcmXXnrFEBWBLs4ZYceMhp2P8SLG/tRSEYgckAKaCI3K84t6old3ptgisqsy7N86/UZJvVunTVICvWfFnlRLSaqb9nGnToK6gCQACbmIjoLMbStsmqIndEFhjaRiXYOvlrRD5Co3vwysfehofhY9Yb58nHL1A8y1h2nPhJ3dJb7v517jygdoEagAMigsTAEuhVDYUga8MvV9JP3fq+ygCK1EyQEGkKIzDIIddJfShPDGjH8sweUTzcBJm3tw6idbsEw148THu5YEuO//tSxMIACiSXZSww6cFslOxxlJ2o6GF9OiI2ifb8YKXRq1wIhIiGe1FXBiQ/bd//GGBKcbaB2Frj/eAQAJApLDiWzNZcNmgw7DbYUke5Y0Z8pMtZp6i1G9pKbsPvi10gT2ZdcNgfCdHzVQf7qnNhvfEzzWYFVCrTr1hIeYXVjLVrAU7Fdt7b/VM9C7lLXYm2tH0VEOF4CYTQbDCzbOjKJqMImjOihe74d7G8mTI154POBN7jkxJScfsRHSjRo2oLjudtoVV60m5BT7lAjW9jmOr/+1LEyYCKmPVjLLxFwVcS66GHrLhrYswez6vyI59Whez//jpY4ko93qakBl5ElIBlJukZN4vygF0LCLqmnx2IhW0IKbetJki7t1j2pvyIOP8XqLCCcM24zadnAYLGPFcZKVXigjbUJcNqcvfu1q0Qj9hhFbuKeMXySitIdpel0modKRXYS2JlDju6/ucAMcosiBUDWuOyTGuxuZf+Tdxmlca37lMcPLh9/Dy7+JCU51/+ZaPV0nSS2RxXlhhQ8+LTY+3BEKjb71jLTL+pVi9SUv/7UsTSAAosl2msPKPBYBMr4Yes4FgU1DCWAGZLeFYEPKhZQoh4t7A+LIVKKwW5oZ1cdo1qrEopjt68C9OcUqRNgXGulARqRNtKDXkWS9e9A98QnHMk6hXt81rZt1zbukKQVCoBaNI2JHxQde6pueciF5gSAtaS+vdVCSWUcZJRKKg5jkUZJ3NBrlLYTAM9WZGW9VTcfoq7MdhcEvmh0VRFaRAwbo9EF96tq7G53030ofrd2L8Z/sWZNUq7VVirI7jWas3f6/oZF6Jd+1u/qgkJ//tSxNsACni3YSw848FWkqy08Q6QTjWI7X7aXrAGIUAElNwOAk4xDMUq0XRpjCwN2rgJI46riGG8sSBZz6NknvXQflkroQWRayE68Y9EeTrZstCOnKOnZt0o339e/T+d2HvHigLBZw1KDZ+t34bRaJwRJuhxwGh1oupr55oFGRRtDTK6OMlbYVy4Kbs4uhHxpBIHyry3h21Y4oCw50HRu6Ne5RBXzOB5zFmX6NoX6SHNhPQIdGkYp3HREItm0anu9/8EHRRDhAKSl/Q3DEEGVHD/+1LE5AAKGLdYDDB0gY2fLDT2Fgigtt0h8lou5kFktVEgtNtuDZRzBKOSqcKUaMQh00Rh8KJbNAZn7Z+E9p7X/Wk4ybqneih/Cd/M3COPiRSiBSt6tLW57thHve956eWq+6QgwsfCV6JLsREHlK9pCur3XcMWiVcwp9lslfUUijyE7aiFPqE3iSEV9H3Pv6mKp/oafeYNPd61FSoSnmbMuwOQLfLapDM2U+pneYzMDAnsG7y1SSVUEb8OWrWyZT8sJkEagec5eg6v9mH8MOKLU//7UsTngAvRW3GnrLIxgZ7sKPYU+mms269rqbG1ud22QWywTHVSdMkSOfnlLVCWc04rVr+nySnTk6bm0NZaaYgVY9Cyyyc4Vh0Guax8j7Sd+dEW64W52HLeG4JHfqfz6UwXGzI0mk0oeJezpQagKBRELLVIFMnh8qfIEaA1l8Ya8WZbvWNXUodb/j5fFzKsDJ2rKnKCOO3a38yBZC3HZVnch8M0rQR7aiQSHkVJExh5X5IJCIlVpNotOFknuap3KlEEEPN+p8sCkV0qoTxpObqM//tSxOYAC4j1cYecUTHxsq409iA7YQgVUKdA9mSO5UZC3e+lUQjtzjf99PuzQ5D1rqc1vplL6U0r98yM9WruJzh1xvbSIAigmBpusKALwvIt5hCxrwgw8EQ3PGBGspe62Qb9zjp9Az96J8sKcD8V21PIGLHC1iN0lesYpJkc9ijUUWSW8MqV9gkVTLGq3ntz/27F1u1iFQgMgChDihrBRiQOBMEw1gyF651MAjafGkvg0vQ2uxcU1tkv9KfcyMyogJUIKXJcj5qtuCFozy+3nLn/+1LE14AQQX1iDDENCUgPrnT0jViOJWEdtrCiRwgrfcy48u3qtVo/8tcn2oSKAQguYE0gnZSlJKTlfEsPcpCnby30lknE3oEGWfHsI2umnQl0bsVw9+WjvQxmZdXIjeKE8/YwKtZaPElqK//dPRfAAfEqgmpBHY2QNHtWii3tAABAEBASbcrY250jvLLW9CQTKghl3qeorJWW9lHIP+VejY2+W+R+Qw27eivFspXfQ8XZ0vazWWCWKjebNcft3OSmRamgTbce3hwOXC+Lr3Onf//7UsTLgAncrXGnmFCBRoytMPCOQGOjKyQm25KeojBMwdBUmQpB6z6SKqTuDyRqouiE3muRhHnu9CloGDPYVjG8/wMEe5Xf1h4tSCcetTN8DuZckRiqlg5EPaDen1zravR5H8roU5DRALFhEVmUdugjQgYaLIBpFTibtR/OaAQE08iQUkksfhHKRVwTaSBKWdJpt9kabX7IgS7kjoJUe36vV67cg1qmex6jCtzv79RUG2z71uCA0RrzrHZXRn230vDOAH/+MsT5uIEMD6RYMJ/u//tSxNkACkSnaYwwSaFHj6209gk0IL6QAotOYJGLab6GH8KgoAKiKMNLruOTkizxyext0iS6eXyQXsU8ripiBj35T3ZmSU99RBp309cndHEFSuRFVb/3zzmWlvWpl1LpMn/9M/75A+nW68e7nxQWMOYoIh4GrgCm50wyom4JXNyCfhkKOginVGmFECQERRmTCCHBiPD5QK5lSgOQJtjBqmVFnZ1EnZr98UeJyiHxNUYcUUKRIo46k6hRk3B/W8VHiic4B0bP76GZ1s7Q5rMaubb/+1LE5QAKVJ1jrCSygaGhLWj0Cmrd7lxQAJIABSGEttTTqUSS7riBZ2D4fEhQB4WlF8TFTJaZPjp+ubbmrTPHsjiN/Sw/PSpU/2fhxiIrWa0jbl7qzcv5bL5KoCCwi1TtTxQbbWRnu3Tiins3WBYU6mrooJEU1QABAKiffLoqOerlzWvjx1lpqPM2Nt4lio/tJpAulB05GnZ3ItxDTmPhAEx9cMjLqCcuw/5nD+MjlOfakB2Mfvy+CyU0ZJUxovXVKSqlDXMPVD+oJ2FcnxIVSv/7UsTlgApgm2unpFChvrJsaPKOeTSGRfCrkgABARgmVBBJFVrrjtzKBJoiFDqKPsFKABIvHnQuKLhomFI7M2/Y7t9sxqNueV1n5bHfO4vz1kKaZSlQyv7lzA0xc9ehVg+QfQIXm6KOBRZu17G3DScO9x6irMNXQkaqBABIyITljSg6AmEPJwFpVikEPQKTSlGoSBHPuunJNncxgg6Ld5eOLqDrqXSPHwYo+Q4fLFL4ja9JSqGQMQRa38Gg0E60U48JnTePT2OUqqtaFm2zvUix//tSxOIACfhPb6YkTOF1mivhhgz4zCQDap63dIQAIGiBESRLHWICiEid4oFwIq7N88awCBLD3pJC2KqtAmYsSK3KVhFChufbj0pf8lNMp8kqe/9LBgWWVWSaqoGD6zpcsKhUKPSletTGL2mmwIdPvZUlHFtAM1/RLQwAQKmmkkSoIyypsG0mw3TsEUaTNKWeKMNGoV0gaiMlZQ7P5Fz0PNbigHpAQxa+sHqjvMfvpod1Vtp9URCGDGVlwuqyZ1qL8uUWzXYffYk8MMiUGSOpa7X/+1LE6QAL/MFhjDBswXkUq3GGCTi/F9tvpQWVWFbJbXG3gPh+8JJULJgEw2EEidI8+achGnTYqf3b9Zm/d5UmGOd60PUf3e53b89X3X3V85333MCClLPJ0aTiZddzROucLRERO/9d3P85P/SIXpzd9ETpfd/68REECcMnLxGx1eUABRUEBtyRtdTYsLnyY4ukH1So57jwH6txccvecDwcn+LI1ixlevfyK7u775Rzy0Qj0Qny4lFjy4HeD6AgIHPiQHwQoWIFBBrH4YACWcEHfP/7UsTngAvEuWGniHCBcxTsNPGWLA4PgQ5CDV5cugfOA/UxRz0VLPgM9FVA3MEoF824OXMPlC7cIv2IlSR6GZQ6kKpJHBMUvy75qtMvi/jvvAyaQSA2q4mipKbbLTVORZa1vtV0+ei8hS8L7UfCPLKL4i1VPKg4wmSiI0z0c7zryOxHs+GXTTtvAvEFn/n3VJWbHv3laXuIP6OSL1zD3L3Hp4xTPJ1kuY3BUW1pbHzcmM+PXyT/G7aFSgW3KownWUSYSNDlYJCZBuoIho0WaIBd//tSxOgAC6ynX6egsSGjrK20wo9UMLVSNWVPUlTiUK4oSTwoVSmJo3w3Alok2B4lr0MmBWCccUJ9fBVH+p2l6aOrLaZEVDjzylvZe+YOANwDZtVwWsRh1bDWQ4Bc2JYERqVExEeiPFtVatkxTGKKWWgYCVELeXzGN51bZ9Uo/B1W7sVXB982fx5I+YQfIoK7KvN8VUWUdeSSnyNbk6zSX2r21QEAqc39qjkMXHiDpN3dBkdK4cqJFWUInxChRIRU5e/7JqiibnBWWZRCu6om7kb/+1LE4oAL9IdvhLBrQkczbRWEmuBIma7zUZqv+KQOv4iQWpK4UFuzb9fuwhVUqV0tdVRKCVzkclqACSx7RBRpEvPGvMxAEBcJiaJA+/ADZY88gJsRYAEts8J23p2KSd7Y1gP1/ivS1JLAQUPvLqOBWVv0qPE0kAyBUvILkhbffVnUaO/m+zFM01jXKgTQGBNSETKEiH4R8WGX8Sgnimb3jnX6l61TKWnOW6qltno2xux/dZs0q+/+73+n2Jsey+rGnGGzSw4PWhzLhQehfPPK7//7UsTHgAo8a3mnsGOBSRQusYYIOBEm+9r2M0sQ9dV3btr/6gEBpI0RIUQWYyIku+6TgNceqUu3NGRFMFROJFwk5wEsl969Cu6/TR5bfWki2NeZjYGpDHUjbZpSc5a+WnXrSWVF2sICNNZ6kjSKhxFcVToDXduWpM8C5hPbg7fE39EAAyQtAAolOiPUeMfRYNuzjKoMEdV9FJBXaMIc4p9VxOzbcIVWFjIdiSRahKv4+KljX+RExqp6v0U4cG3IxcMpDUu0ed8qXdbrXR894vuU//tSxNMACkidcYwkSYFHjW0lhhhobRXrBYFASImCpbrkkXmwABRGCQIUk4CdH+rzFTAoizH4LMii5NTaRjDC1ikWqes5WTmTQq6yIGYrXoHIz39pQJUCnZBJJ0YgV2Tv1mY1z/TeX9eUZ02vLOvXetKI/U1t5FWmla0RTVUqAcAADGl46F8mzxlOMcaslWduwzsRQJx9H7JrkjDL2rGKob9IqvSBGL/iRDNoc1KIls77VX7CmE3NqDpQKza29diH93Y/nbsqHCgyFPoUyA9nxz3/+1LE3oAKgI1irTBLwXeRrbWErSymgkGirOgmSAYQkFsaRdzZR5PVeci8g9QS+zxJFclcMbadsuX7aIVhyQ6PSZoxSdBEMV6UVzB0qM70kZ9DjCFzOiOrEeZ0lazzKz29OqiVdb3/TL7tMu7qaf0uNfn385SkJlDiDhMrGhyZcM0yuwQ1ytUJNt2fy3WNvEAVShLhFRj1RJ5eNwIApqkhEu3ChQBvlBgu6Mb6U0/6oHHruquW0uYN7iuil0qjgVjpZPqdOSQlTtUOUQrMEdlNN//7UsTjgAuwjWWsvUlBZpvsdPSJ2E2igslIq6z0+hy3GKKjEsXmaABXyZdbSOKqGSkIAInh4aFseWVQ5RDhvQm4Qt6Z/JHaepXRFjdfitj//tVazYvIyo7drk0GVP798+fnTS9YEYdQRNrKpTqTK1UUVC9/vyXQTTeeA83QNZRVUgCAGTZj+CYZI2DpFYFFGLsgTnVpjYAYICItCDDceqr0sewD85at91xHP18UO/1nup04a1s0rYVnZb1+iblr84IZUlixz7N/8Yy0+NPCkzOv//tSxOWACoiNXMwsScG/saz08o71errWUAKaSb4X5FhGwNADA5ovtKEl072KbtlgOwT0AgeTEeSmbqxKqe39qFFTeH5k1V0+V3VTh6Mv6k1e596ih2d1kVlVnO1CVW3YUQ9+7ci2T3mVavOivaiGdmXKqbe6b/wyzNnZSFOgxGVQr9RT3xfx4pflBAAcgQZack5JtBeKv8uR836ex1GEtm5aWo32EubrJMEJmL8WA7KovwrPsWMDV8f9/bFm/Xc8Xqo90W5U9Zmy9wCSgXY1YpT/+1LE4QALgKVzp6UJ4WaUrWmGGDTVf1HUYTtacvmkF+ygDSs3v+YIAOAEWNhVaJFs5FCRtNjDPouR/oCkIqtx50OAhisIClBoctnh9ncpRRUP7vIiibkaVDP0cOA0v5JBLmRmZ8iPfdfPard//////t9v1/IMKxCe7f6VERScmd3SmUCOM1zQpnTOUS2uvQyQF5DMzS3yP6I2shh/lcQxwAPYNFiAiO2uDPAgK28oFzbLEtD55yxMx0gJrzF540Lr17SiD3GJ9nEdwgchAQGCx//7UsTkAgpcwVissEnBxy5raZWJuRYfNMxcjixgMAEvskmONKjNq7XJUSXZurScgrO8nfFhSl4FDpXRVz6XYDT3WzdVLPb51MsUV6ItqTvXr6CaezvOrvb0ZNH3nVF32JdH3///f850b1mauw3yoIlfesY1/9fUfvvVEAp1JSRIsbwgDArE4dByIW7V5K0fVJucBWPaw379ntE0wZv4wyvP0a9zNosWU1eYHjlzszM18cINwTM1ZwYEgRD+xwJAkLOXmZ5x2E4BwrfSEwzMz+xU//tSxN+ACyiNYawZDsFRK6vph5QwEAmQn9MMCxV9e/i+7fwHB442scltffKT2BECCC2OJ7npp3iIjxE7T4i03py0///0Cbu6E5/UADlAxczbeZcArJoEIs6scC6n6T48NLgW00aAR0zWJGkSwlF+828mwUDJV2mn7L+VpwdWMiUNQVUIjwJCIKjTu5QcQIngq9qBgV90slQoHec/DWhX22TSabENWKattOtlKnqk3EYiOSg+NjQFA3wwJLGiZh6asjI0cD5EFiiCXLo5HmvSaIT/+1LE5oALmG91h7BLMXMrbLWHlHmg86Te40JxYRh5yImepDb4rf/NSC/ncit9KQpUxK6CosIajbH1EEACAFN0mUzJrKUjKC+9WGVUSI1RvoRPhpJwqtuCKC8lqZVtVs7SD0ZKLEl3cjvtjngss6FAux9inuKoRzphAKdcIaWfr4rRZEvLVy0g8Ffr7QJAAAABJUG4sqAGkMJjQs1lwOULJjWknqrElSBIgaXJANwlzm1kU8yEDpPqg7yxcUExc446gqp4Op2EZNDnkXYw3+6Nb//7UsTngBLZh2lHsHPJPAxt1PSZCPivesxp1oJFQ1V6mO7VAjdgPQlTSQUdh5jKS6dXYvoMM/UdEXkYLE7RxR7PQt4gYdQggZ3gkKSKztSuWdyn5c9lb7daRaAi581LBYXiyGSQHsIsciu3tTsUnt2UKkvq2VmWz2WZTqYCFha2YnAnZaxZzYdkYDIbMAU2/ZVZcgyGNLL4r0hYiVTpb8Q4GO/nDKwlXmxqWZ0KRniUzYRZQSp9lqt2MeVX7f+Lcmn+0w2YGV1OsnKIhZ8D/u83//tSxNKACnSFd6ekZWFBjiwVhI2ge3f/5P//0lbKoKovDPq5qneK0XcvSPVgB1FBsbaKFE0zCkmbUgQLbqkjJglRFPgK55hduGRn2ZRXYYGqwioWvG4s06rpcQ8uaJtc+owlbcZN6zTrnQK90kdOL51yGG6hegCEIQAAQ5JuJ2oTBAaxb3oYyXQ0KsZ6+cihYi5IEh0+jtXsisqXWbhuaJTlJnekz6zqEX83qNP1kDBoPNC4lc9tZHFMy68MNT1UOU+MSoYTAAHD6KbpSJWxPUn/+1LE3oEKZF9lR5huwTgXbIj0jdBLXc2oQCcidBAABPkAUeGsHgzgo0rSbMH4OnYgPRFp5Igj5ZY/AfDom9a3e5zGvOrsigEGghnQUvFznDzbo1cy0LQqX9P8zRCy3+Z3VAiu4cX9P65+neV/JELQk7/ImYunu9hoiK53jvPRK5QIZXDG5OXfWKlCNYYCkhR6qtYAHbwmqnViMPlYSFFJI4SxwsApQgwohvse6Nk5SEsu72Gf9zjRmP2IlCtT1d6JTT1p/s3ohun/IRDGlSZ9Jf/7UsTrgAy0uXUnpG05Z5IuJPSNLsS0Jmg1baZIuUFRG5bf9ywrjDI7JUMmQp5XCj7Q4ZBgSOO2j5YoJ5LK8L0La0Z3whBEA9e0Hu+xkcO3M2ZOw7TPvdPL4lRCoGBhYE25fH31KnT2KhhJkA0MsaS7EwEiBM/rAAA2jOKzoLVG7kSmsB0Vnv6r2E0zSn6VskU7AAonVOX4mkNa41MM4Nkokr7sXaVWufhhUOdWl8bQ9UWLWUwqlByDwTmbbVNuLW763DVM0uknrThRvQkAhwIe//tSxOmADFiZZaekbMG6q6wZhgz4CYCHQxF0iQURHoTcvhFkIUapEBLBwyEMCUkJAFyXUNSwulx1uTLWkg4aooGyxiYMYS+fCJmnPMbWF3/LpEVwaPHqEh1SjahUs+ULoEZa7ZKx6k27NfY91EUhUFRNeBjKSQrNHKVQASRDkxcaTSeO4k7wao62IwyFmIiE4+VKEr4Dm7LlS1htfXiG9jHxA9pcXsBQu0LI/+epdPBfzkqF8ia40YPqPrc2x1ZKlVUtp96WjQINnVNW2xR4MJL/+1DE3oAKmStox4xPgUkV7MWGDSCGSjUvQBth1YAAQAkElKNVEAr9DzYcqjQMKiCNacaDwvsqTawsWFkRki/dWO9N9YeO9MCMdsKVao4wpURnqn6N6WodqRWVEQFga999VC/itLUem17S1xpKbb2rYsqj1ZMABSAXE3L2ysgn0eEv1aZYQoXNBaZs3YwcACWdUkrJQnWrLrhReen3Jj11VpAn371Pvn4nOrbPBJazsqFBeNSNKuhO90sVjLRYWyHQXQfJtatuTWcxDJxCwUnV//tSxOiDC/C3YkwwboF9FOxNhgzwm5iiy+AKSSU0FonP4VRomNWdAOMyWdkMfv01I99any5S8lVvne2N7ulyToUPONd2XMDT52rKnntp120K3MzUv3q93pQ1zK2a7+0/P9fMoY1dPsqbj2/yJuPZ9Jth9waFlAP2D0EFkz71CajYuWzYdOECtOtACgCUASUF6q75lTJTOLr4LA5fH5B3UN0sUuTy4vQ31pvEA5Vd6lsZ/ISCPCfUUlKTm1Jqyu7OgN/t/oRfRUJddU77tVK/p1P/+1LE5wAL5K9v57BsoV+Tq+mXlSidEQrrnds1MuQZnsdVHKocogNF2E2Xgu/Citiv/DwCXAjwG8ToDCcYL8KYOgv8FGvmFJ6Ub9eP5UxGeZpYIeKPXfhXnXnU1vBmusuDE8jcOFnt7KuUjy81D9M04keYtEwmGHnY+7B4aGMf4xOyP3JHpujsog0vYXY8OUwiOR1Bcp+rC0eNpmhaBzGi5Obk5kLdcPNIdIGn3nJmZjvk0mlbQAbUqhrq5bVbOYBYKAyKmhhAlJUXUOoThE8aqP/7UsTpggvof2NMJWpBxLFsXYOaucgUgxXjTuJGiokAATnxda5gcwKoGMToUKFHolxfenfdRT2P3vp/U8mYkxABjo1or6apAFkxN4uNkgAvEJWhxzRHHYSQvPTpCbWFqi+itXzGOlDnnVanzrVdWvd/fMs5HsY1l6Pd++rWOyEqYouMWxjttr/8Vi9G2pSV93W9UgM2910AMFgzVk8iQALNwp3arfnIcDIAkBCRaNkpBdBKT8EMCM1aaKeR2SeLrJKNkmA2rAJYs1FGHwL7qVuk//tSxN8ADHlVZSwgT0nwLGzU8w7YU//oKu6KXnhQaMcpO3gzSdJElCIlSMQeCloABpLk9bJRSFNMKYCux1XMzaQr0k1m9tEuRw1gpbcOsNd/MAUqfD9YdRXNlhIMU4Mo2mr0Rp5GYWabKVseNc9irrDbLkMGNS+UfLCD0elrGLH9KfinK/oVAAJAdTqJJKgG8RNVWaPB72Mxtw5BhGtIoeG96DOMsNDxMXMDB3GVFymR7t/GkEhuLKe8zkGO8tpbcj1X/djtt2ZrKbZXvdNVT6X/+1LEzQAKkF19p6RnIT2X7nWGCHg9N/1rX1B34qij4UOm0ITKY4AACkNRcwOcsim2mEmk3rkpv6Gg/3ktOhBdYg49Rrn5XxxbDzFHs0rIBAXd0+DCEFOQpt1Bkw4VYtLhcM31uEn6VrRKOOWuiVbvKwoet9mAAIDQaV2s6xTAFkkuB4IRkooGEomKbwc9kPvE8+VtmPiHBUE3nGkuN5wOVbnnVKRjvk3ntenxVPeYj+UL1Dqu6/BijsxaK/cZnyoRvdCV3svU6trVL7sl/veR+//7UsTZAAp8S3XnpQVBXY9ttYeU+Gv1GdSI6pqWu5TRxCoxAxgXFBkhWK+6kABQBECSgwVySuXys6WpRuAkc4EBRKbDhGTqQDfE/RWe7IfnMycgzKzQj3/Kr8cDB57UMitcTHHR2Kl9Bo1mStfVR3uVyOzRoCWRrbhddERnCtT4gGqSwDQ/ySoUXL/vCALIDGuZgGociYGHItDIiQsOz4v6MPlok4kI7zHFL7eXiRFWGZplbVtVeLvjvsnWywFUS+I7mKtwoff8JKxTjP+rr+Y3//tSxOEAC2klaawwScFbEKxlpgj4i4/7+NTdJn+pEUQrQ1VNgqOVP1HI2gUWvIfrAADrhZXUwEkJVtVjcLWmtWXvG1OtQ0kjXOg3l+J5ZXC4PPb3T5na+zLoZOd3+hzf1kadzdXuzIGEqi1CTEKqoT7XZFa6uyef2d9jaLur09Ffudrb7GQ1O5LHyhLVRpiHiLD37QA6vbfaRTQsYgcHAIkUkgtAJoVawDRKJFxgXinzrUNKB2WJ3vNF7herCbZbvr1dZFYmY1rahjW96hSHcBz/+1LE5gANcWde7KxNwX4bbHGWFTz6yKxkgxSzC2uTed1rbzT/S6gjU9b16e6xQpf1BgllW5SaIhwP8/S7mj5qKC0pLppvkH0PUw35j4lUUJED1T0edzNa2CsmS//+54Y+r/J9GirEzAgVIPv6NirReBpJakxirRct/vm7eoiyTbK6irqoKhrZ3MUBB4naCSyy2gbTXSB5MxkqY7U6uU+wbNydXXXjGjvYwPHMQUDCaf1W0sBYaqYavrAMe3dnXUXnpy9pXRkkMy5nkrtTT9y99v/7UsTegAwA31rMMQnBjy0sJYYJcV0xzEIWiG1DiUql38liwAIckxBJWiAQO8vNirPIDX2vyHoNfrlplUHNB48DfcrVgcR1lh31UZ5Kd+VlR37cmGH3niQkIH9K1OyP/6y2pVzP71fIWvR/p/2Xt6e/ViHYcKDQ0txl6Ikv2Snub1oAgAAwIJwOVhwAMDsAZOnaDQjLWiu5UoSEPAim+S2iM+TLEusetC3aN12jS7Mtzqu21sbSqgYf2ttiSG/bVYsfUp+s/vyeqWrR7bF1MuR2//tSxNqACySRZ0exIQFhky209ix811gEMoaFJ2RqUdwlCvd2EeU7aN80D3TWuoVeuOkjWVbHFKHVYdha8vogUW7enI3ladUhLIAgG+L6i7/YNh70OxjQr0h5qMtJbcKhBIw5Bq54Im2RpGlyNQqFhc25rwwKGB7xg1ptQkOAgUKGFrhtVLbelVUMZHCMF+REJUVIgywimqV7ppw1cFZIPYbmi8P0DDxgbVxMASJo4fqXhfHRo0D/neqvR8SA8dX/M9xECtf9pNRFjTAfLlWpYdL/+1LE34AKrQNpp6CwwXkl66mEiiCueA1h5vafXopeuvV9yR+yj9Bg44KKrGLxKpsGKgAdCOL0rJdHpMqrEAcNxsHpWun5Nc+FHxQQ+GHAMzHznyMHt/8//k/KEbn9pkRu5n/73FxJH3eaFckM+v/CSZ/n9+fc/sKnGkRyYKyBw6wIERrzLbRxSf8ng+4AHeXNZWjApX7gThQoezsBcELNNRzySvHikJWcdj/UceA8bWSHPAbVGpEZAV7O/hGgsLtRxk4ss8AfZ5t5znocZAgIGP/7UsTjgAoUp1TNMK8BxhjsNYegfILpAgPrtCh1cjNyYijEBl6CCN5IrNIMRKURrRXeKIZEWSVuJt8fzp4tPgbY5bjE+ebXFB//ng7//Yh/f5sD2PPMYB2mY/NVGf0BFJFugJWkuXBvp4lIL4JMOcsR7IIm6EqurCy6Yk7JRjkldL5BVgEjGXuTHJJHOjTm6RatSkZ6KOJmy8NBImjEtSTOiyc/KN++kgGGwVOkWsOiIkFDzaPfTaYW4KgFNv4SKKY4FWQM3bFVEAZFaNQKOQBH//tSxOADyzynUA0xDsGYqWrBp4zwIwuTIN08UzVQLKLRAYeTiMcHlkZ/aFa1cnXmxyirEzYlLl8TDyuAwQE9wuH3JvcQjyaxS6pYvddUvu6daNluhuWNoAZR3XarUBkCQRoqWxNNSpjWkmok6iltXoo4yU4FecAnJYI5N7NwtMAspUSvlizrF259h/PnlfBSbk5Z0WNAqV8y99RlzWGSQ9y0b939BqMrGPeuyswgkbiqKAAiAyMZGi27mYtDXOxwK47jgSymS++NOCxVYAg6YY//+1LE3gARoO1tR6TaiaYYLaTxmlA1IKvmmfVXVggyPc7p5ml/MQU59QX1pMvO2dbou0ttZLdGuuBo2YDrhK5/QKJUK9ZV6kmEgISLPko1POcxBlZGZP6JNhlSkr0QLwPmXmOCWBZJpndJgDZ26mrmmh4JjVnzezr0SpxC/1uUJzdwXM1Hrm2LVWx6RyOmpiPW5zQyFSSRWpDlIggBEOdfdroQJOoMkzg0Texr6EVMtU0yVgYGIuiEQ38FdxY+sBVT02kOjWZqHQbmYjmX0JGGxP/7UsTAgAo0Z22HsGsBTBNufPSNmC1VGVbPtJdvzh5hcYkmbLOxGZpW1vuE0qKbnO/a0wAIhVoQmotzyOIiHGmBwEHEMeftvo88ZUzd9Tvj2Rkc/bzTz7hDhpGrH/dZ1JmOwNMB9Ga5JcoIPeXFr3m34acYS8oy8EmT4ASOrXxdoyRK7Le3TQABHRabUuJAeUUm4+QRIjo40NX0c9ZwEgphjCI885MhLlABnz54HKlVlCNc2sV61TlmqzjWGCiRIMbqGAG4eh03r+aij99NFc4C//tSxMwAClSFbeegTsFMkuvlhKmQP1HCmSXwQIWzYCBnICakSmCSoVD6GXB4Q0N0WNlKNzELhBVMit74cU840rYmkGtfoORjUKDsqMiXozjGBMSgURhY9Pzy54dyhagm8c/nmsKG6KF7HKLHBh1IfvYWBA4XNBUdNKBA5YQSUoSwHGpVBAA7tQ7SLbQ+fUQMd7sEya9ZLCYFA0XIj110tj3Ca4wIzKKPICM9534e8/p/5Ef5Pk984RU3SizhgFefx4mxZeWZdz2RBCwyIOc+OYv/+1LE1wAKjJtUrD0MwU0P6tmXlag0thglxZe1SI45QptpjcKGy8qJYLuAH9c6DIX/xO/WAGJoSQBPWzOTIYBXicFwyp0pPslDsZtGae+mNTDZf3Kl1l5vp3/8zXOPluqHqUQOMLOEw8tZoRkgSRgXKAIJCK6aQxYy0sWKlTQynIyJKZaxZ0PNEzjTe2g4QAdCTlUwkmWIvhWDHEbHINoKxpTLHCc4dvlc9RnDi9Zz8BmTjCN+emWe07BNDENBQTlEjCYgrJu67yomBY8hiiIc+v/7UsThAApsb19HpQxBk43sfPWV1D80oUbaeR/79OlNjvoG6IAAAAFAoEm4SpczlAG2Qog6i8VYJq0mXXBabjKgjwSrdm8rD4OSLnCSWIYwcgXFntLMLNWw+T7PHBAf+8Rb3e4OvinZ88t1m5Jq/RkXMWS4vQlCzFbRmhP8jA0tnAB6hS3zsp4y3YME9w2IiMdsSYA2BIGLjxhaSBIEDi5+ciHDBnbtxYt9G2p2+kaQjVfqdEtOqoctosrSagARuWHXEhqWl2XgIvcpQSud4T62//tSxOKADYFrWqwkbMlnkywk8w2YEoaW5KAJwAluJKPBWfxcaYqhAg+w3Nuioa0cLbPYAxwbCC4AyYsvnqNu8s2BHwCZnSN+HpHwQ8yKgoVj48ddjzb91isZEZ5LsFHOljJkgHXrGE7iUw59+2hPrtqgUkhuPR8kyhXkA0ORFONJOhiDgbTAOIiXpLmwwBKsHGTV1CJa1cCEAGMlIC8GUcSFIFI4rEIsAmHAyHFtXe4EmoCRbotQxIJF0RR54WlXCIFkOCVtL2NSVBGAr4qLyR7/+1LE3YAKQFFnh7HnQUKKa6WEmYhYhKA5OTnr/EKAQAAUIcEOy2JB0ACIgEDEu5xO547ceYg+YmbIzDInZOp5e5fKsUmOHOKc0bNGhbUZ8MoeMOFqEoF36Aw5iKPmL7Grck4+uyQOlw+7MCeJwQLhYbHBlomS/qFz/LzKoACIIAESuecdwE2CSMYkz3wsKMbQfn5p0Lj8XoOd3+DccOZcN+3u/q/teEHA4p/5Z9/d3yJxzczzTMYxyyJ909L5lCEISy3lwc6ZqftIUJ99W4tOmv/7UsTqAAwEvVbMJGxBgJjq6YSNoIMJuHHtBkDAxhAYDAgMDdyFnkXfw5Er2R+f4eFtghbCs0gvYYhBAG/d9/JZQO+/8vxp7dZrDj5bh+tLJuXwGYN1R4ykAECh107eODA4WQn9GKtGCGrOHNvlN/b0ty9+nSdvRsVfWIl7RgfscvOKv0nn7mDm638ObZZsES9zc2Pm2jBUTCJz/CfuM0grTJPSw/chVlrMPHxEF4fpUIOUjZUNO89qy6aM/uzEOz0h1bnFL+AYPknqpScbTbcM//tSxOeAC/xXYaewbGF3DSqlhI2gZAWQVgwxKuI36WWhafFYluLlEEEzFZbDLS906tCKCcqPiUfUQ6AlSUVGA/qhhXJ+Rae6KWmHrsH0rlqdvQYAGCgxGpONtf+won3ISt/X5I4NsaTFyde8Y0hJ7XRNRpEFpAL1SPgjjUD+mFkx62emjShQ6/6w9KnKUkHqMOHKaaPiyVSxZiRKAgKIwVcI0hM+bH1mSawbjx4/dX6ur/i9insUryqrX2KJrcmmAmI5dmY/c22XBoaeCYjkYUr/+1LE5oAORX1bh7BnCmCvbFWGGnmxpdCeCgMKJAIntRCXqtR3yKBgYIOZNEMOV6MyMRPVf0z31BCQLuUbWCVrWRgZUJHF9v7v0LcDKrDK+1CYF1uSTAIGYkCqCEK0VBK2jv6yV5WpK2Rk45ECj+mPNohTc08SkRrJDv5md9H3Do0x0vYkrNKlZlEoHX7yqrFuHlEGFKkmN8RauukGh+N/VlSxUXExigABCExrACml6LMWc2XN6lRFldU4pG6GvLDhzJdjwx2B/uJPglOd/2LXf//7UsS/AAvIuXesMGfBSglvdPYgODX/VpSdBlRdAmDByotveUSmxSn13zH5uiw87izi+KxFxgpeuk3FwCBWoUgrFhT6/6RrT6OyolcXLNiSyyEWQFUa8SyXvEiRid6iIGHyxIa/pi5pUn+b3lxg327mS2xDlEyN4BUKi71DhCKdH7UksRkB+7rKxUNve36F1QVCNzeFOJRxuYNh3DHypjTSTgmJSK+CcQmxzkE4e3pIfv2qwLx33LL9AQhaN79HBu6/dOrNUE5KhyuRFacdMOCi//tSxMSACjiZf+YYS0FDE21xhIkg29jGpWWPisDEXop2GhQQvFv3uawYTzbLosutPcXzbsiyueG2mYWy7rfsjQvHYsVdFARET4+OwDCXB3ABYdW87wOzJdTqz14AgCexv/E1pYcAPh0rwEiJ+RsHucx3dq9SaaK/1gAWQ8CUmkQYFEufQ9m8yxltChULR8FFGZWMx5oDtv2HBJJyE9mCdmrDxsNmvXcfHo8dMvSlJgLSObT1oWRiDNTVUertdLtydr0WHk2ZMXfZUwyhY6i4+or/+1LE0QAKCHFnjCTIQU+VLPGEqSiHD5QVDIiCAu+5YFtfSCAABAABIMC0m9TnIBs3FEvOp1WGOVBueLxpEonnKdmuamLIjTFfZhrbdzSC120fZVMs3LtZaRQF9mvuM2LXo42WGi69TmN/TZMk1pRr/8/u0V0AAMABGYNrLS+gwNrKlJEsmaQQ3EMXV/IiWh9BeMUtJYQh6/EuYA4dXNmVcj2pE0RsdW60k7cISIEVrfSXq5VpMDBcqhpaB5JR0B1viG0DOYWKOJBWMASt25KmZf/7UsTcgAqgr3XnpEmhP5WrRZSNoJ76jNSdNH+0lhGV5JWCTl908QoxOLFnETghI9kUXfyJuy8sDRWT7JcoI+sYb9iAZMQ8ZK6qpMdWVDhlq10uQ1bEGd+7qTYxs/2fGBVHmTyLSpQkKyfDIMMkse/aYW1iAAKgFpxuZitRrSyEASpQaKtAUShdA87gaCMk4WBtdIuUHYb+1VbTrksIHpWZH3OIi3Ks538IcWVS10qRuszKlLq7V/VZhZ97s/Fa7xMLuUhxwmTEx98gidgcXCSz//tSxOgADLTdZ6w84eFIFetthgk4KhBkSqcVNYwOAAmi3SdN7AY4Okg4M4kot6gIcpoyGqluorVa3xMFXkxHPR56qNBi+aMFWT8yg3F85yjo9KHCOGqofVV6n9urZnf+3DJr90yK3vvsc9Kd5WOrW7W1Zk0sSVSDgEkHIjISHeoXAACAAxEpxlNmPp6hilN7iULLXESytmTsSWQ/tGfm6roES/nYsMzf9E5835f9YUIW9aqSneZ8l71PE4PLZa9RH4NHrtSvyjy3PBZDvJe+pl7/+1LE6gKMeK9ZDD0HAVuYK1WEihia9UAAZgJyJPEaT2AkgPY4wXJWAsi/E21okOqjtIkYNq2n6th312f3Et/7p0Gf/SyTtI6ZuKfRqoQg8EeKX7hvcwHL3+PlHeTnInolBf5X6IV62MOyCKqrgcLjztEyAFPtqRgOAIwiBtjgnhfIylGjASLExS6wC37LsfcVYbSk3M45a8TsGgyK7s2UlMJg9dUhiwNzlbf//8fKrGnd6iOc+EgfbrRihAMZCs5aJU5ivrLrd1dGf/P9fohP2//7UsTqggyg32FMIE1BkCyraPOKMNJq51p5CkslDHjJT7cfwBk/f6k+0AcgAAlSDEykVDg80aSIKhJNwUaCOyEWY2VgxX6ZddwygNs7iBrD92xaw/YSY4NGWuNEvUzFigf6Q2cnDNgf/ZV/L1GXNAZukk1MCnyphI4PINirxlQYJJODqiQWV8i5YykoT0IsCsllstMNlto4UDBRIDcV7nRFmmTJp6YPu7+aA08iJsmmnfzp70DECfZ7h7YHCyZ9kwO4uD4Ph5f9AfKQ/E5+kpDA//tSxOQACkSNWUwkywGGmGso9iFoYg/CBmspZBAuDlAIfrS9go5Eo6xK1WADQA9FTHUxfdVVpckiEDV5uIufQTFmOuo5bdl4N+3N3iUnYZSabvNJAwOSUFtFYz+c/JQwEZsOFGqsOcPy4akaqS6DqRf6GXqYUi76t5fcuHq1J/4zbc/K3IlSoY5NclBi26b6Xf3jPE/Zuf/xiKv1v9VsaNUyT8gQUcHDeJZmTmQKzRCEIjOnhGs0WIf84l3ateqp+1LwCZq8fmfGTXmTqOXxgp3/+1LE6AANxV9QzDyryWCLa/TBMhAUO6EqDWlhtR5sKDrrk9in/5EWSxn0e9xccVAN7sZYlYCKjBsMuu5Y2qH0kEW1phXGiwpMxFwaEBmlJoNRi+MpabRlqAirS+3h5FH4l7CiXa+1b7IAtXtN6iBjU2p7I6L/L+/T/+Wm2tdf+b+qqRx5Og7OszpK25UAJiSjCkEgGYWgthbk+ImftRoktMhuXSemHACZ4I+RBQsZ+/sLYr8kFLSjav4r3KB9asWBy7LMzebUZ1AGtzkLRKNYev/7UsTigAyYiW+mPMqBw6WtYZSOEbs//vKulXlmExCcSRBpLrurWMAAESFQZSUboNKBuqnDApViwmWv8MnHnsEiA0Ga2JIW7QE/DiFqgamN957XFYbPZamqSfObUmSfnZi23yx2/33YKjGJdBdFt/za/wnTZ+7zCO+LbgAhFVY45I5eKxY4+itTRYEYg26ipWdxsUQBdNkRt9gRkElEZCe+TZ8dwBhNUu6PkJPc7Z3AtVfpwpWCuCTRNiHO5T4IztYnQtfMn9ma7Hu66yyuv9Q2//tSxNWACmR7c4wwZ+Fcq6789BWsrmN3vqOnS670X5MOO9YZ/qfXvgAdkhJpNuFRKoouqxlrVnYvOgPGcOzHWuS6LUMuH2EfLu4wX++LjNS6Wi5LEzeQbPkX40zot5/0WO7Kq2NyABrKJ6iSLhN9en/U/UTcxwpOh71dygAgmhmq645O6ok9iik35Va4DqL6Xs9u6RuU5WIiEj5uOHpJRduhzJOmI6w0apLjVhSCcb/9VZwviLY9kJrO7FacXv0d6qUjIr3La7q6c7p2bzM2pkr/+1LE3gAK0IdrR5kNEU4SbLWGHWA6f9vVXffWi//6nUdRxz9/7l3UEyBgdCmaTcSx4l1Mk7EoQ22HbqtFI16Qud3cgoWyPvYDG/gI23d3wL/fwrOj2+PRRDZh4gSe2yZXAnpfKUF1v//5Pok1IFRGksXKFwcbBAy1ZMuI6gQAUsQ7cMAORJGC4VGIaiIHGRCSDGDoyjas9LTfKpJXgSijcelsXicPzF2alsN27leHc5y3jSavcw3XqXe4U9SxJ6LCmkMPNHFAAiLAwGl87ovrM//7UsTnAA0lJ2usJEupTRJtaYQN6sVVgonJlK4CBC1l5JjEqyfgXk2qgT8ay47DG/JVNxrDWsJpX+g9ygnJGjhvrL1cl6NV/sS33oKQ+RXRxQUqeQ7UbDkCbn24TIAAJYUCi5sJMG6liFF8bVK0qcVCb2wIBBLEkwVgidjhbkR5lTuyjdoo3Jo/1QNFdveTeYMUqNb3voWR65XToayGb//t/+u2337fTKhyAVcrLEMHXvrXAiu4ElNx4T8UloGaSi7IeSlK0XrSiID7TC9Vh3Zh//tSxOaCDNVfaawsTeFWky3k8SIeK9ZR8p6eRbjxPRXNJudPk9mBHv1BIUMoS7Vp1uPOTffrMlXLtt/01qVe2lUmbAwutdlASaTrjvmV0nQ6ibHPEPh8p1Ka9yoowqLUi6D3rutLptarNbPattU5dgGRTdUpT1g+tVnmq3XNZf6Tr3ziX/MxXKh2RDFA3irqwfLEXf64zf/+gtmXIZRbHkhFsQXKPI+oWtMY6o1LRgpZdOzz0nRNI6DaQm7/7LvdQv352ZU986cbs93c7g/PQZ//+1LE5gATjY1azSS8yVYsbXDxieAwejt637ZjmT/pp5gQouToGkVfZX03aO6+RvPACc7Kn+54JYBi7slJTlJ4LWhxpoaapfk7BLGWGmVz6RmN7ldzMd38dkXkCMoReoXOjQDWLl569pWWoOidznlIIl3f+j/1DW/6foUC9tVIUq/1KjJ9uj8oyoUTFq/rLjXKT/ZVAzQiZUhJZpG5ULDkekxqnRSqN5ccH99paR2gMxxGLI63XjB8TKLEiAEmyIt99CnMM1OglAXMKX1VYmzbLf/7UsTLAAoUgW9HsGkBYRnwMPYJflAKLN/la/xMYvqZ00te32t8PjPuY1P9mWCjTnFe0urlonRkIoyUghp70EAFg9cBhoUqDUuBXdlYq2GAhAchdmAMOVRGo5jjqvtESpXWgmcROry2GhAHb9SaP2eOONdr8/WoheMMZA29jCFZsXruQgFYOmeB6qKrWbsut4ZGqhBCUN7sSwr8pp28RFnT1+mSwmCjymrXAT0chC3U7b/Eu38pFu63ubzN8lCNkaxPfbfQm6iz5CYMerhHcRGX//tSxNSAClTPYEwwS8FyJC209YpkDOi3WYgdDOWWfAd7v0p3/+3/hsVw2Yt+OAIu6MMaPMY6raW5gP1geVZHTOqY90LuTqJoLJkx4gQiS/sLd7zd3P/nP49+gYpFogQECDWk/z6x0cfy0ixynq/rMAlra1J+LT+4O4IUD0g56MrxzGb/YzP/+vM//u/4/9pqIQ8qpgCE7DrBzizD1sLCqqOlW1OjvZjxREa0dk21O6wWp+1KlLJIWdM/zlw1zglH7XL/6a1KUw5EUpSiRwxi+eX/+1LE2oAKsNGH5iCzMViZ7jT0lOx1yOuV9vo2mq9bNVL/Na2tlRdjJ+u7qXVtzklGPKA6xHe0k1Cxd5V2sKo2yMR2NIBlsCEAGDwJgCmhubnhwO5gcfRSwmuVeqIvtxTeGP1Nv3na3vDFbYBR5tTRjK1MER0oqDaLErirmLt1Wf9tNP11dijgPtTkvClyJPNuSSRIFoVCzVKcKgPA+KElRqhYWZPRdOSrv1F33DIvQcJK3Zik4eFa1o8iC7FqSHwwlc+pJQmZuCIWDCCljVBHQv/7UsTigAwJD16sIFCJnBPucPMODWXT/R1W166q300ULSUbr2rCgiymQBBsY0AWZtKTRfywBxP3c/XMWtEu8mMWaKlRCQjM4wrLkUWZWYzP1ZCIsqGfSrb7EeZ680owGbq0qzqWmRLfFa22ln5P+OUxmCsl/x5l6gEA2Dg91LhTaYayWpO887oy1bb9t0faibnLVgClMkBdjCEQMQlqT/nN/dTXRg11pZCKZ0wQrdNemhn9LUzk+/nSgzTj8PHSZ4mKvvdkeZqTbFyG9WWsHaDa//tSxNyADTFjcyeYVIE9jO709hg4wK59ll4AqpMZmNCESrj8Wb9Tu0DADN1aHpxXjIr6sSMNHZZRj+yWoGO9NbS4GI5bMVhfN1K0lt8NkslW5ndmgLMnO16Hd4potbXXwBscRHhAxKb06zOtJEOGoxoW+p2dK/tqAAAlChXO9ASlTGX84rjna5lOfyEqTJRM0o3CD+xh/L/T9017g3jhwEUDbUQGsjcLos5CWC3LC5ZAhDyuXb5UH9XMQdKta2mRbcYreWKLkd1VBBR2KuTK8KL/+1LE3gAKiGF5rDzBwUiWbaWXlDiHwez9u+xkXAtUYW7TcSahYmy9slhh8LdiB1hwON/U95cSnlXa48TM0UU5gnV0lc1as7J7HpYCRPHABQJg38pn/aSGe9L2WhMYHNDaHUBqhYRF17BUPCVimSLqkLYP/Yp5gxtCdQAQOZ12jORlBi1kMNVgRhEoWCb15pqkbhqsyeAFzgY1bbD+Chk1A/slH5h5JHUb3zu+GMIItRNWsp5o9n7jfZq+cqQsTdUTT9DEVKpYeRh/QxKV1EuYZP/7UsTogAu8r2uMJG1BdZZsFaSKIFAk5Jn+xL30gaKKMSQctraaghTiOosaBiZIBXUkxm47u6iRdAq6PGEtL0mir17DJvreqreRCDDDixGBBjVrB8P3HjAIHXVAgAxO02HxQMCc/4PnCY4xTqB97fR84CAIOQ9JtFTGoLoGElossyAQ6l2BSYlAGgk1QGDW0ZZvRKLPAc1SBmPP1W+cBF3LPXhQOt5f+HSpd/sbYsz5uFEz4TeCb8iq58q8yaT86zxGqqX87qnlD8iM1I5LWlyp//tSxOiADBi1Yyy8ZcFylK41h4z8UjZnPATaoKajfGBNcoslwALAkyUo1D3pbkx56pqB2XT9v5VnXd6TJdNsz2ZLtDuTBmtbe8v0enphBA087eTN/rnO3QWfBAxcQUIyS2vSgaTIONexNH9nptyw/uPOd+7NVQYY6CgGxHpsi55VbbdhcYC8XGS1klo5CgKz8xg3G2YSpHRc/M4BLY6ixrmWUiKSAWkQCYAjSVbKMsSEqpckSIiBpbg2Wa4lAOuEg6R6dLlj/5JJJB1bntEUwmv/+1LE54AL5N9hLSyvgXoNrvz2IDRxlxY6AV6NGkAgBg1RlttOGnIclf614S5701VsQMlPYnCbgFWZWrKncObDyEUtKeB4q2+kn1CO6LjWMEo3QEjZtioZFEB0K3IWxQMih2KMNFTKZbRr/azi7ixaQDv0HdpaEv1P6gAAOQAISUNjUDns+LPKLtDGCV5JhyBKWF4PVMrweQiGmUVt2FvtChj/fPM9sqFGdjnObVwVxao5V9cycl8THhHJ4PPVZql7tyFN5VVSFS0UAbxroas5Ff/7UsTmgAyRb2+MMGGpQpJslYMN6N72BprkPqQAqZGgHD6v22bjiLjgRtgdizCpyBDjhVQ2bKocfpAdgvZiYBjb3p3Bme5+P0g54vj4IOr4PJUyRoVB0GmV8j+0zLBEWHPF34pobRxL6N87kja0zMTz83nS1XQqAAYgAoklQF6DklqF9NNaAzCs3ZtW2r4PtpsDI4HXXE9nbZKBvU7yj5lwHFu0TIZjPEB5Ufel2kGzaH6lcXSKih57Nzs8GWhM935xyT7kVOUNIHCkPqj5SIAh//tQxOmADGiJZywwx4FzEWx1h4k4NoHx2b8PsYASDQnI3IknyrOVOwyWbfIVIh7dLEskGdHZ5HQ0mZlkuAy3cZVAKcBHkahzasqIcrrO82oNFW22iza6SLb56f2rom5L0/kYqs5KbsjNU715BG5znRaOjCzqB3o0DyJQii4fyiggQL00MXcw2XPP1HhGhxX3e3lJLP2qzqBMC0beLth4ZfCCRCJE3DhFYR9iKedenwtxAQudz8p6TosyN4pxCSW3Pz0TJ3Mjzu5nfQQTmbgbkP/7UsTnAAvEcVlMvSXBaBXtvYeNPHCoPn2zkusHx6hQ3pnmWJ/nNOuVVICFxRhlbLWQDiJtWVqjlP/DzJgLXh5VmjsOPltAgeYVXYQ2onjmWy60YGwwQkNvbJm86WI6TCBVUBwtEbEzHJTLoNwg4dGO/kZnz6X/+X/5/qX3kdRJaqBa0jNSjUiOwzBgFpU6HX6bRaKVrRnr9CoAGEAVZIFGgCzMZCQ2ivAznzHYFafzi46WkpLzSTZ3ENdW5l83azfANrm2HYa1dCSPupvZy2t+//tSxOiADCynXUwsrqGZL+01hgi89kIHchbRlZ0zv4v8Hqn0pZHM7O/r2HSXn8XYBKKK92qu8THbZTUbAEKkK9ESSuUwNh4FJm8+iYyclFfdtl56bxrL0MkDQ6hDcTvfmfJe7670epECgW8WoKAkVgZVCFsbtc+S8cx7/+iolGi3ZVUEh2CNsppomEAhSHWcjYxB9Na88Rb5mYS4R1s0mIVo3y+tRWRdRVpjA3MowTZbJbuRKOiF9e7PICIDH5WYSax1jGmitHdJD9lV7f+8aNf/+1LE4oIMAQleDCRugcSm7RmGDXgj789SlMBWHeRSvOTi8fQ0DoPVlQNhQeCU2w8QhTG0cHEKxIatWlVSDBn9lv1NHKrlGxbMvu29Cg4jWzv/dqGEDiIgLtXGbixRQ7crq0PGk0JpgxYowCzxdbXV2ZoHUBo8c1MFYrU8UQAHMJY0lJG8LrOekQWt44BmkUpRepODYtAaPSKkTm5yQEef8XOL0VmJ7oXpzrs/B0dH5fxV/kzMtDkshCsRl1tsr/2Qq/nF7F+SoLIWoJpiWlTKH//7UsTXgAo8q2snrE9BShVsRYYJOMHkbjmlrumtQ/PSEgiVBXGk2ESX6C1CeCPnCPBsllRKMcsquAjIuHUkf8pL+DyXJzjayh7EFTWz5u7JVAIen+uJtzvD5Wzzg5G6+/cnFU7eZY3uT++8kNgwouR1/FCtfrKe7pW3cK4yzG9Pyupm6lXSECi6WYbP6lxekRBazqRmlRPM1vj/XUaPMo8JkpqinTSQHdya1T1w+ZJogPvqqa6LsYeGuj9LQH0gYAatl2amn839rf7aI/bX5wxG//tSxOMAClCvcaeYTuGNGG50wxZcVkQZHFxHcwMT1rCK/p+hAAFNwdJc1MuHER2XK3hSFkbQ4vK4zJJWOgJqyIl0MUmS3K/vB4TQi6HTF/rU/EmEt3/Okov7hL/0Wpv5S69Z/T8pO1ZCJ7sirZGuza3z71VEa997aUqjRl1Iq+5415PuEFWBFqJqgw+5AYw2y5k8XJzud5YzgGCHtLR+r6nFIMorDOUxUcHbQ85V+mcQ1l/Tdm7a8esgzFa3/vc1NEeseb0qzmEILDwNVzax4ob/+1LE5gALeOltp7Cp4aOXbej1lie21SkzMIVwtEdqBGgAXz828+yT/4B7IABrDZ6TKRLPiiTQ8pULbCRLjZ0Vsx3RzBrEASi8aPL8rttiQkIBOiFmthAALPvIpbUUYXbww0EjCzMubQUUfuFHi4o763nwh/dygIEFHRYo4/PZSwvpSoEAkUjo6iAUQc9V2X4wWdMj7OXDDTw9cKAUsp1Te3YxuY+1cVTocQ+BicuOiYUhJMFhShbTLHVNgNlRAIxI3lI1kTCzH3+5RZcxL45bkP/7UsThgAs5NW0nrFExhatrTZSV6LO5YrU32L+LEt/i/AT0SoqyWoDqCUJRVEbAJZVUmKtGwDqDDVKLGKOpDTFfMyPO4Z5N7g6YWzG/ktcmDDjKh6oKG3DDYCFBou5pHVXOrkkIWh+RJs7nX9xt6u6qy+wlTbvVCkj6qomG6pZG2kAEdBciqdoWcFEknk6moUBFxVAoK7gHp2BnpduMqmEEUZfVJYw7v/NStSrT8/vnbKhkXlb5Q/Hsk/+n6//9P/778p67bW2v3BRcMOvn4t7H//tSxOGADCz7XEeIccldCW008yXQUYoBsSSuSMAsJjUTApAYFIOBWHrYslwaCASR1lyMc+xHrGvbye1XTdVWZAyKGCOhj4FVmu2gyTRr3Y+zbXZDspWFFsVkpR3/3+ZlT/y2v+qUqrbqUrHLc1k67KVu9FEmcYqarQhdghtVVPTIm/aU01lKzjI2NMreytD8/OBlhscPGaFWsn/7Q/h98S5fvSV8cdmCkp6PAYV8/NlnlmMo6BxRtDQUDsI3kWLoDSRoiMIeuZvUOpzEXW48c23/+1LE4wAMsJdpp7EnwTcJLCT3oDDSBKPVEn/ZQAAAQijGiAhbD1CnBqFcjxTQVBb1ObV8nbDB0hqGiRgB3r5pAx766slL3GgcEe+IprhObjgD4N/Fn9dJ16L1tMDVg0OGDyqGhBe3UFRTYLH98XQq+m9TvJo2pqZ/mshIMCbibdUx/kZLmplMvi3HQ8NXVTcPZRiax6E4faAzjMdWM4zVrEeiRQfcjFJuGP32a6ma9+Fm95b65eHe/0jjj/+e7/n//hPf0qv/+OPhK5veKxRK///7UsTnAArdW3WnjFOxky3stMGK1J5tE0l7l93xrGOlOLv9p9xRFf3y8tTwp/MAAAQLbKWjWqykECAGAiWc/zyouznepxaY2Q/wlSJQK7PsL8JgCXJIKkSReNi6WD8Pyy1I2MTBZUcdBNBFyXN1LNzUtZ0TcwN0ndOs3UyEzNEXdaz663WifscTZ60UGeuylrVU9Du1bmboGSk0l3TUpejbZJ9bstBaepmsi7GxgzOfQZBVTKWmpI6ZGOVE5dzNyf///+H1ZGX6VctfRzkShLAZ//tSxOcAC5yNVMwkbwF4k6s08w3kNSNwyD+VJvLTQIHuET9YPoNCilnyQcp255GkHAeShUaGG+n4sUY6gcH6egRZMVvpjc0MjPMVe7gzRJfPe7YoLN+6x6fUlK2/Z3kGefcDG841v1mtm3vJrzSRIn191v6Z1e9IuNf/4iXzv1j5mvb61TN6a///rL6/fn3Vn1il75rf3+catqsbAtp7eT7v3sGSvSsF1A5dwx0qYB1OEkadqsxOLJOoorwo5RrCYdA2zi62d7O2s0uyllNtqqD/+1LE54AOBZ1dVPQAClmtLLce0ACSIZ7bVkJeiZOm7VtaNQJ3fXdR0e5HR6YZ1GWuRJnVqaUQX0IFRrrIFsAId5FnASsgjcPxXlhqJWAJGTx+Jil/LBi7izTYG1Xa5XbM9t931Mf1eqBKHkXXN53jLRRk7Joy548iUelf1lCzVlrKZlq2Ka2R0o3LZDENrqPPz/CgCEGjChD0KrmeRZeCcwRzo8eBXIFRQZltxew+qEwVhaxMHRKCobjFkkij0A67eCoKlp1gdCpbrQZTGS5hNf/7UsTCABNJbX+494AJRZmvc55QAKzFVRQ77wZO4CQAkIcglInb6LiAbct8iV2OVdUAEtGMXsy6pFiKUgDMFpH+wMB7iaIZs4GaMSWwPtuxQA9dsPy2Ud1H+5lwwOn+eyEcMH6lRXc2hCCSxEPU1pURICeoV/6bayr9lMRNJKcItFG21IACQCQAIgkQ7HajzdA2Al1tPG9o0YaqjIaU8UQYmxKjMGRc02ft6GQqFhxoR8xdVOD4j3MTREC7ETjmCasEXIU1LVGs8gOmnOWOEB8y//tSxKoAC1SjdYelBwFjBm549gzYFCHGkEpfIpxL6fVGFi21AIEADALRFQOWW5S6ELFMWZhrh0JNVGWQZsNrKTIgqEskh7Do1IZC12JQhaxqQiyt2IQev8/aKSupQ64A2C7rT4Cg0imHomxrGw+3cHSoNu1pkhZtj1V2h17+pPr0AAgAVp7kXDhZSHmweCLVB2LjUxu2FnEgM6BOpRB9zm+nKd57Z/p+AKZ3ycz10cQDS9TqRCOYRUr/Npan3WqEReqm8o68Kah7NpkXaFcti4T/+1LErgAKZI1th6RnQW6QrCWXoDDn6VeARYlQ+4Z0qik4UYzcqDhMIIM1YpBUKh2CuDh609RXLfv2qajSgPPQfPslnpdZwDAuMIjq2yCT/6lwa1dtHQLW3RN6Serl0xT9nyXdQylD6HlmDblj3FCx9cWoFiCJVAFCGQIQkWcLFbCKE8PIlKtYahSwTyZWZELOJm2c+XTy7xcPI0l1IbSgPg203SvHiryfkYI0kZr5sSa1UN/eUjuec/9P9oN/+hNf/y/HyirfKQS2U5I7HG4qNP/7UsS0gAukjV7MPQUBaBvtMPSVdOFi5gPDoCBY7mGUvLQ1OyuUQLTu4lCLTj/MtvfvIIZvPw7BqWUxP6L1BvHCxZRoO13fZY53vzhA8UkxVl//XxCARQkE22vUZM2ISAUATPlIQ0GVwMhAQ5K67pvu19mMZv0cKYvPqQnAZe1cQKtl6Tl7mzL4WU77V2ezkIW0nVsgUUdkzxyIr0Z6dXpZl37JbIbE8wxFnE1euR+uEPrVBDZihGG0eyY1yjq3NYXkVY8vhcDIyBALDsVkr46o//tSxLaACuTddYYgsrFDG6vY846QiRPZPI3IhTIuCWLK2IGYrNru/S0sMMhZrYJHwaJ6lhh/c4ZuR5H2/0+vFla3f+kgIGHbuy2STiyK5pPpLJBHIzRg+diJmFzPMSyzRzIWBp9y2iu5sqcGtYX+v2+5+Ggla5BqE0WtQplL+tlMQCJD7koezsU1Cqipt+mpCm7WNtAU9/WqAAAwYUHOaC9JjmJVGkBciaLJnREYoeWVG3rlqwyNdY2y4QUOqQw6QrtcV24chXrYxT/ABP9KHDz/+1LEwIAKdIt7pKxJ0UqRa9WEieCP/tGOpFtBrFtf6f09VdzeKkgLzLU33sAAYg8ZdYhBozF6SUdG5bAxsCY4EpSVal+hNKWiOejghpYepcRc7aEG5UqGVspDmdGYPh3VimectR3/8TR4qsSRYltyLVen/6yJ36vSeES1qdJ3VwACWIjaG2kKBkJeA8jWOoTkvzUheFJWfPGlYe/LymCGc6VV59xgTE78XQ8Ux91zf+Ju+9XIXizb9s6sDviDuqWaQZZ6bPV3f/dym0k2G0tOSf/7UsTLAAmgZ1wMsSpBUJFudPSg5IDe/P9IYWp4W0rz6UhlJA+orw/dJCC8POzHAniuXkAAP+ShnxWAqCA+qZGZ0RyBwj0On4cQhSKNNWJ+od15hrdUU7s9D6qYUMUzuU7O61Qnd7+3//+36fKdreuQQiaa7ZEYT1+H/wPVAABYiN1dWYcokAmALHJflzouzlsWdNKqV95Q9cAUR4yBMaYn258Dq/05A9bmteO9zLl3T5mf15/+9s9zP3uZf3nHPdbUCaR6noKgkkuIbz+scnt+//tSxNgACfClWywgrwFNlSy1hhS8L5X6nKWqBBIDESIrAYEGEaQyCAwElol9KxEyZZONLVpvOmkgSlHA1ZttH+rvOQQKB+wrcCgrF1XJEskMT/B5LaAqRl49hXpTgGhYHQ7xOU2XVj/Q0fPJ/6PHp6+dR7W97dz/zNOtkcf3RN27czNfpPXM176l6+VabeWb85NpQ7OdPUpTpmauu1VKe2lJqtgW1ttZ+WLvzTfp0zv7f6zLdX7701pmbP7WDW2SyiAAmIIwKYUtDBsp9Vr5ZGv/+1LE5IAKJKdlp7Cp4ZysbaT0Ff8hZDlAzvVWpk8S0/tbYp2mffVbkXABCYyO1U+RlfvFX+2/PvfRCEphQ4dfFnmZht/Ri4KKe3pFISv2Wt9CPaintvSsERDEQUYuapJES5CUybxN06iEsmQsMTZPQWrFP6QT68DkJ9JFwd9KJotdRit/3//f1D/X4FAapI5zeh64OH61CwiNxRODuvmLd+yvczxGGd1UOVyVFEtCZkUCRT6SEVc+kFNvKluJ3YwFArX1TYsa57NEC50+z4bC0P/7UsTmAAtgsV2VlYACkbFuPzDAANegY8OhdSN1XtnlnHVvrtvG5clEjti5M3ay6G4jFVrarfWYSLIr0eBchjADgJRSCbdDMaSUFjCuP8GA5mZoLkI/Ed1s3LVrKbYutOjp8LxLMQWqFgFldUGMju03SuZL/DAY3ufTrS1Q9ycZa4iHj/sUzrK1ChVVnUOapPdUBoGkZoWBQeT9LymBzyJ7zcocp/kZYtDz8KcKHCiqWNRahgbpBC5fL91GObNXNrIMIScqiiujsi3s0uyJd2o9//tSxMQAClibbLzzAAFPk62k9iFYbbgkU5KIZ7u5lYt7f/MDTX/0XLECRBG1mhVEm0ITpGMOKMPu0lobPZYgxFgpNSm3GVHcxnUIOHWmt+qDdmUwTBeQYaBZxYcePnwKXLBaXewtGMf40tJLW6u/BpPXd//R6XVb6igECHpE4ZZccK0hx0DqSQ3ysRKPD7HSMpfNkFo4JfbB6RoLZ7xOHAFiRmEHDWXPhoHFBxWWx7uvfyrnb8p6MIXlL/UlJAMSLsMm7DCnBwiHxE9p2624idf/+1LEzoAJ+JliDC3vgUiSrSj2CPDY0tllU3le//rAAWxiqCkMzKBCKFFxB6JCxhZ7Gn0nQo2Jw0lY0iQRUtrCmdJOc0/KN0qBnUNt4SBCntCY8txdQKueprgUi8DHXj5pE2RYdDpdj0sUh8TvsFKe5iz69RfxjwfaxP/6KggBEklulzPENtQE5GyCxJOsHoPGFgujNFQ04YcxhT5tnUKJv/2s473vUFVuO8wT3Tc8MaVW/zA4XIn/+bG9sbG/P5JEQg78dz0i9f0uTPpy5P5dc//7UsTbgopQ91wsME8BPwvrnYYVoChX4mZhCQEUzjB5Yu8mcy6Z9PCEejAEAaZMvKpXySjpGANXTC0dU+gOPIAPG/crqRa1MdWtRHCcg7R4nci17BLUlCS76cRzbSGAKrzVzUqEDz4Isnx76CgDNDiA8ZaEFrEJcqACarlveUdcBDyZlBBFVFWvr9TCSQYrQYEoEj4/Ka9USzlY6gR4eTLMftoV/t84T70zJXexJoRXvS52Q9rdTQpmrRYCIMkAog6kq5OvFhhL2/fR/+Veea6S//tSxOgADCjPa6ewaWF4C2qJnCTg31lqqiKAaTBe1bhS4AGD1pUJpI9XsGFrceY/KywnDzUOxUcJUS+i9ItgrWTFKqOgU+8qSQGCDEcqHTCB4+kNnT+HVLLbVWdWEBU+wkpIRMk2w+VhRNwsdWpq2LOiCwyOEYbC8y0AwCriVRO7S6yJKgkxdBOimB9k9M0bXiChJE5B2Ru+LIthMDUbMbUPTnt62hTVu1ZnsluMZvDJkCvUseBRebKiRZAUX+orezxUan7hyjjWqi61mHn04gD/+1LE5gANMZte54R5CWyKq9WGIOAAEOlFxj+l4y9AAQAsxpttKOrFyWElRylJmGA0mZoNKwmK6iJRyAH1jfylS9JbQA6GfLTv5b033f9QEhuKFVHhrS6wV7TqWRyRgsoCBpEkpZ2v2yLl+GpJqdFAVInTIStKv66SVdUU1Un4FZyeBOwYAF8qwuKWAP8sxzQuCotAvLOthoAiZDdSoL28zjCQlYYnmoR6c4XuQ3dj8j3ycWNdRVZ0MOIIQK3hJZKOOo7WMS041mliwyFjbPPVif/7UsThgAn8l2kmGE8Big/sZYYNYJ5YBJQu+n/cnAACAGk2lXbXYtcWIrHCxg8y8S+oFhVMvvWaZ0jeAF3YbU46KaWPeD9RB6sArh/3cfFCQJpUiCqzKVki7Qk1ttpMDBJZNvOUS6fp3LTpk2V0EBRxXlDje3SlgHR2ZFhbf9apUS3lGeIsRMyCjPZyfGShq09IfgeEbUCB4MQQh101+TIdJs3VU/QSPnPheyJ4GxUCJreXMvHvct8oTqOg6WO5ooJF3BhinLYpL5Np90pHILgR//tSxOYAC6BvcaewxuFwjiw1hhigMi6OBDif8/ECohLfffcdu9bdLCTjF9WMbVhuk/KHxsY5z/blTmKNndBBpFXBEkf0q6EO+v0bRjo2ckinyNyUIx4m5lcjHdSkY+fLZ6MzVmtGJIY8D8az6m877StKU2SY+Wzk3jTKUYLgj4i4nD2zv/75CJNqUlKY4tpKhGEPOo+FyrWmDCwpKpZjU7c4LomZzKhkYu6so5uIrzrz8VxWcAt66O20C+sXWTrN9MagTlnnDG4L1NAjL1f3tMT/+1LE5wAL0HVQLWEjQWUOK2mEFdju5R2/ZmU6e7u3vOsL+14SDocUyQQhpo6EHUyOQQ+61DieTj/EJ8z8ITDdJA1XCw8c7Tq5HHHHdG2EzNT83qMQYpXAjY0SEZUi1YKtYesFnsLNs/mW00961rWlcnW4Vx1JILAoOx8enSM99+nf1sn9+FW2Td1qw6mvle8///0Nf1fzyHejogkE4sDrMBH0F2ZHQxTuQtiBUAJkp0yuSoVtXI0+GFEn8Stf59YqFP//4vnH7LPn70ts81NLNP/7UsTpAAxobW3noM4hsqnr1YKaeVcAUM6Xdu1qqedQhEzADGDQC/76fQdWI4EWfsWoAApis1xEEFDrFvLal4BUSoGhJQ03Q1Ye2mRWczAzuXW4U6ZkZek5tzcsUH/8xEv67a289z2JW6libowse7n7gDZ+1R7vfUvoeoj8iUoVfSBWpXUQ1KVZEdZSbkPNbX+6TslU44ldOcNFM9AFIn3Xt091+gVUhC8vufBdIcMKnM+SK/igmhxax3DpsinhR7R6HHmqaln/4t2Votirbnkp//tSxN8ADw1laAekc4FNkHE1tLCygXc99AeqfSGFEjCRKJhBIPApiW2uvZFEZHmqvLE7Mod9X1PgIuFbaoZxPKlheCnkanefHbBflP3PGMxSlG21Wr9tD1FHHDFhtBdxpJ14QDgpnatFaiqFqoQl9VtfSLmTo0vbPLcpAERyAkolQ480NBoJpjaPy0gv82lK/kawiMyq2NZV5HPqqNuX+5VCpkuHce2e6F/pwSDflMGjiVdQctOIV/ShSi6v30SNYd72EqeIjK8PSIT1LYJBcaP/+1LE1wAKWL9zh6RowUqQLjWEmHBueSOMrOuLPsDrd1NGsgkhnNuHFmQmhk9bDZ0kRh2PtmjN17oqGHtmoHLsadrNERqfXNura2B+zh9W7ECH9fcFqxFwNV7q8g4ThsZEDRaSVQb66t10/I9Vu6oZnf5L23oJq5DXdy62bgdo5MmAuTkoTIKeU8CWgq2CE6QtF4RPZAKSZ4iCaVpyapnSj6/D5bu+cxZkjRA3hQuMZ2MY7GHmGiIKyWZi24kXKykUytKdvRybOzETtpdhEtHrmv/7UsTiAApse2ksMGdBeZTs6ZQJ6M7oLOWVHGO7THtTW1hpr0L2Ya2+j+89QAiRDVoLyWTgFa7SULlvJA8pZ8OhILD/jQ8FrVhmpbtAgROvjHPeeiWpGPxAm/gKFnZHHgdEKxYMtyvdXUqh0XZTiYwnw1+1D9BIftUwwxiv0MLCcIBtwulpEJHa0qoCOejexytxPC4oWVDsoSHrkc6abD8VcRPuALqwSLRwcA2hpIn5o6XT3vKN65MiPqVOHo/dd0grJ1q7Izt0/yy7o1KxctTE//tSxOcADHC/Y0ywrwFIkSvVlKHg7pa29eqVYj6+azW9Xa2yrVJ52ONSMwltbo+Cf+7pf5oAlMAKEML9NYCD1jt3nUEaDLzv/K4pSzNIXp7wVYT0obqw+J2YOQyX6MtE3gcYl/Qwh7lwe36EHN34qea4zv0zc08NeynQ/305FDKc3UgSIWaJovpalVkJH/vV2zWtzDfZB8KM+zUencdRPQJF05LJkMnqiGpiLS9QfqLx3cfdcbadUF8geYt3LxvdaEGmX3F0Za8hs2SmQ9I2qZr/+1LE6gAOcWVzp6Sp6XgUrXWGFPD9HW//GKJaiTfvarFZLyriiAFZmFOQhwwVvTFCOsIlSGVpuJElo2xJjJOGIdiiSjYWyY0TgmIkUmS4narcX9oyvLjsz1sRtuA67PsFnk9/ixYMIzM12T5A1x91PaxPqw6Wmvv60PwC9SMo5V5BdTbWPuLS58r7p2oewIP72zKr6QACINHkm21MBbNgVy3iscAqrF9YdeJ5s7DSFMkw43dQFac+YK3YwSGcTB4dMMt+cY4XTME5c66rUaj/of/7UsTfAAzBYXGnoK2pW5Sr5ZSN0GZnzQkOV39+xDSYZ1RVe3/lq27Vt+Bk0SwWEj+wSix3hoiSrsdCRHEiwktDMasgYz+qkcp5QaGXHThhVqBpfSxdy03H+mRWB4RNsBdhyZXLRgz5pNqwdaGf3TS7X8idr0P+gKjlU0y7ruKg0PdtNdShy6lSR7E8WSgqgRSMxOLupyS/VEu9adM7clUABoCoQluJPIBI2QDuDoYirOhVKZWNnYIQ+VmV3hDqFCDPJ3oKudQvUH9iNVXDVz/I//tSxN6ADEjBdaexCaGLGC709iE+u8acCnM8uFb46/9WA4SkVFTF9xoMMd6xVz+k+7mXs0ahd3QVKYTeUQOy9VThZ1dIYACkWnRpyaKCRL5hq4hgMKeyAHliuD7Yl4nXr+hOFFJcWCzy3kbOaDBsjA2UnkIdn2fTgXf/OP/+Zv9OM6G3J3+X8qkoPWpTBo4QUNkCe4ElU/a8woDMlxGU1tSHRbLfl9QKenoIvD1t65YHZgyhx1HO3JrnXxZNl9Cd3cVrIoFpvGVf2Op0yfVdfrr/+1LE2gIM4N9hrDDuwX0YK7GEqeRHVOiXansV4n9JRG7csNkxckNBkE0EwsdG3mkn1v6+OSWgiVljLgcY6QHcBPBzhzpU05yQTFgZmBMMyWf5TbtlciQmaO68/o5+iDKhEPFxd/llGg3FgUGJ9Xz8fwiInPy4uf3u4oiIRWQZeKCn3IuDQUoaDe5sUeJ3pEZ9/GxOPoo785oVSJAQ+TB9YWcQBiohXCWVQCwlRcBCDDILLVbAux+FLppQGW5n+rJEis2s4xYT6M5VrjGq0+bxaf/7UsTUgAwUw2OsPQOhVBvrXYMJ0D4pjOtSUr4ayFc6iTe27XxvJqVa5i62uSaSO7MFRDgeaItnz2IQqrO0lAwEoBQFA+WGe5VrkZapfssx2NSBo6hhkyzUlu9XUz1MJc+3ESNgbDy5xFJRsJF+yOYQyyoBQciKIAG6locUpXZKjJtUzXVj53mLdFWEUC+KinSzc1/lhkYAS3/tOm7e9/Xc11nfOLDpzmJAcNCIjEkFf/y30KV6gNefTqowV3UBeViwCClCTnsNIXpgFxTTgu0m//tSxNeDCtipViwgVEG+HWzI9iFotH9HUS5RF9P4rDVSjiiItYCObCGupF+cfYiAuf/X+vfWpqp3u/9W3u4SSMIXf8I9O1e1shQoDFV1QrKOeklUAE6yxXG0FFRJUYgR1k8Rx8HecrCumeRcgFp2+CU3sSfZMlj6dD5v2deJqe1NKZheCglRX79/+rJbOp0f9lKpNP3DwnAT+BWsYhzRNNC3f+JeGxorhU5aeXYxCMRvIgpgESxhgEZZ5mgwIaj1vCqnHluQ48KRk0BgfjaJBRb/+1LE0gAQdV9mDD0NwUQcrqjBniC0qGa4775HfsYteDqw3F+sZP88p81CG/xbOtfDb/ZJHHFCGLiIBTy//1gMMBwUtEFX/eIIBmCuASRydPhNEnLXXBSdjY1nQfAjzShOCKVtWFtrO8SrMZoaRZf157VzKqkKfp7hB0Mf5CJZjq0taBQvK6R0ilM42j3ERRnqxQR3HP/R/yuz28qTokG3fq0KAAzVgEgJ0aQgungVsCiUhmHuTMqOskl1M6bRFL5u44ZgibvWiKr/P+dKaZpVef/7UsTFgAo8329HjVDBZ5vttPQpeNJTVYYZeP8Ispp7YkjVsz5l0Bi/orU+qu3iADGD37/YzoW5Tq6D7tLgi5rGKJ/ZWJb3/WoOhyEmNKp3BCnaKJmgdrzfcuj6lXIznjVZLTtLcNXfQ/z2rbkjTelcBqqKYtDiE/9+1CMmr12NY5PlSDopwjmo7r/////Wv2/oj/Zy5c8E7P/RCgkIBlSEval4RXw4USdhTt07E5E+FNKE9aKpXk0ByAbtikRK9E7M2WlecjvYPytOszAvX9el//tSxM2DCqzdXiy9BQFsHGuJlhXYU5EINJq+SyFXq1LecQNF3+gx+zT/UnnFeyhYX6lly4AmNQLRA7ZK5Yg1Y2SnjL1sukcxP5orRfkrD73zoYWOeDJlVlMqLa0c2n3H7te1re5M58bkQiNuCY6KU8U6JsGLT8Flt+xXPU6ZwwXFH58++nn5rdLOZAwi9gBF5D0bQjw8MdA0AYRBAQg6ThgigBZDpVDqAwnhuzjISWFZhAEkeGTkYc58EQKNDr2s7WVVY884i9uGkHkXLDJJIHv/+1LE0wALtN1fTDCuwVkrbmTzKh6LEntlVOtNXrFVnGc7Q2sU4sIY8GB7bs9qA5z+O5ItQgpbDePEoHICBgKAbI+WZWH4885QILODJgCAsINECzjTij2cy6/qTsSwkrbcLJHDR6B+ym6lbJCkVvdc30sn6xq213syv+rf/aPMoZf01QLECMxLCDIbxIuC0QVLUUhpuqMX0E1RJgTdETUfuZVkMmQKjokhyabi+8n3WIulB4PB0a9qMS11POGBEbR0zx4ygq0WEr4Co06K9t6fy//7UsTXAAqk3VrMmLCBkxvrRZSJ0c9ddyugMtSH+St1tPD7TZ4o9fMpqU7pMmUqdH63AJlYnJKg01nWrxhnZJJi0aTU33pnokLfT6ke/o1kvYtlfSl5ddrIwZnRzFXb9u335+ZmPYn3+yrdnbLtUfwKXWbobtZbf6EAcNSRBYX4hsMXbKlyzhRD7jH6Ts/GNGIeApFhisSq7huXxH0n7FUjhxphIN3ciDPyGYkUnb5LFq9EZLK6USTI2yqyfrOUN7kPAcmGWBNxGQMJOin0bWmo//tSxNgACiBBYww8YYFQkK3o9Jigh+b1gBFsWWxMoFQGEKE4CWEJMRFHQ/XQz7UGiAKX5jYAuOe7xCHZv+HB3zxw4icBrFWIEWvJ+CUs5qioMXtC7iJIAqeEGDl7l2h82jepYdzrqLr6D1jheUaB3LC8D0KIp1YxAmgJYtC4IhCcFJsOggWtYfBi2V6RXiIKSXdwEYlrlD9OdcsvBX1vlx6pX/39ma9+MD1HXUpEkesUo5V55eV4CBAaoIvUuGLtr/esaUxQMG3UvC4gLg68auz/+1LE4wAKWHNcrJkOgX0s7bT0Ca1wXFZ9XNAAxItCJAFAwDUNZlK4kReYzC3woGNK3JqKnO9q+THzC/v5Y9NSx453ZGprzonL7Km6bEDMpiKyKoJJGn3Ui8hCJRrDyEm2T1r+vWv+hCEeSghKpBCDtYXcKLR3AK4QRTe3Xnc7G2M2r51GQNbIKgKd+vQATzWTLQpDLwFgW8dComRqUaNYeE8S06QEBIRJHDBYsc+nJyWOh5137LFlKONmcBg6dxtvEQvQOZb+ToLFjhBLugd+nP/7UMToAAtk31csPEXBfo5stPYNbEvvEKmESewSbIcT5vuf8CboT/E3Kvf/5eTRByRU64ITk6B3S4Br1cEYj4Bn4/sl77v0eivrwBM7VV2ZpLEhJrw3ZDky+y86D5WtllRayC+PpyiiATJTDaVBRUXLSRZUoTBIOsPWKKjOz3VKZ+14u+2d4ZLVZJrlCK/vd1VjxkO6qgQDSmwEAApAHjUfND3P+sNtVbDQt9DXHIUaSYq29weBKgfeg0+7LYyvaok35hoWHmVuRxyDTD4LUZX/+1LE6AAL1L1YrJhvgbYx7LTxGvkQwYbI6ERaWFrSz/0aWwp/9nY5IarAWFIMkRIyQiGyqJIo1Q2qo/Y0qJYEm2ADSbqRgRN1t9UK5ilURpVNDjK70/om/ezuVF0CFaO69aXJCYTDnUPos//6RFiB5H1CibxLFlBw2LUCVohVmFdzKaUMgxHwOiKHgzCJeCJNVcOykfYooHU7776/dQcmMuieSGIHNneRy6fVKa3cpfQ5MR+0211ruqaXtRJnel9SUNZ9PXdsv7jZEQCNW+fOoP/7UsTfgE7BN20nsGvJSQ2u5PYY+PxyEnGq9iKS4BFgNjJApwDKkivcvOmotRgIzgmkNzQvqL4d54kPMvaxYPdQ8qbHOzh6hWWj9WO7Zaxp2adzAM0+0+xA1Faj4ZBgONRDwMllNGCoCkZ1hdnWSfQno8yblQo5I31tcp5FANCQADZEmeNFC02+VAKKbYcxUUV0BQQQMWp2xwVnbwjhv1JR0nJFAdXQjI31Q71q5WK0Uel3JJZ0pSaYyKvLkm6WR0axBB/mw+OEAPOIQ8KOE6r6//tSxNkACeifdYeYrMFBky789IloSPF6l06Nf6XAKFMEczFdiaSpAoy02Eugk+cEW+NyDZFUU+fCgj6Wf2hiD4UjreuwGnLjDX1Mt7qH1rUuyGM4kldu3OSyr9Yg45YofCYsfdSYln/F1tIiruzXYW7SRWSQyAcwo0o0SUoCr4B+JREgBgPtlSpnH8XpVioP0vw6GzAXiIpb+CLKz5PGRKTS2Xgz/seDl76xVjKqp2XF1/M5HCqprJsLIMj27T7TIQi+tTRxSlar7/6PXloWY6z/+1LE5wALzTd95gxUoX2SbTGWFLim2KrkaVuZ3gANkCAAQVkrGjkrcyxpxfdfs68Tb283FiydO6TrA3ph85CCAo1RHBtOrZ1NE/vPUQHQ7/+3iCWE71V1KTWU9RNJ/pe8klx4gFZ8WzimzmqMW2j2rwWap+6DK1J/a13RAABRADglRBcVk1dQGOstfsHC/UxMz7xIWVCbYizUMiOqUPfJw9yW51gqFHbJCLFm03V0FWr9HdJKLKx1V2OQlf/U6Zduyr7//oxP5dff+7vT+/7ONv/7UsTmAAuM62MMMKeBfBhvPPYWDLKN/egxQbgwaFsbSSNNI+juRZwkLPdLhgDZS9MJ9xcP5cMdLKyJ0jG3m/jXzS0CWzjSn0ZlQ2iAa9GIY9Ex4HmRkc/b6JgoZxiJuIvn89oojYZf/NznvJ//VuuRn0f11ynBnpSlAAqAJCKCsCHcTpBkg58IgVR6BgGNB4B14R7MNFjWqiWrcZanDgsLEpuseAydpDJ2DBY8gJWQUUmXINcTShaUGSLWNNPe8qFhaaDet3bF2ITr72H7bXOt//tSxOYAC3zdbaekS+F8GCvthKHI7DqP23CInUgSCANO2PxVBjD2E0OUCoNZfHrSqjQwRppRGoQCw6LLIvI3ZyYOW+tckUPhyW7UqpHaTr8p2jr2wyMgT+W5Zf57SggryyYKvWbJKrn1pRXsdK2P9b3xddXuoHKAIOy0i03ixQFecgI81QcTVFJmmtzI18B2UkZJ9rN5Oh1rl54vp84jjS1rJjIXze9ZVXBSbMpDz0EGvYzOtphhgwrrIv5AAPelCRp57xkw4lYbVqpmx4YYbDX/+1LE5oALIV9jzDylwYMx7jzwizRYlErh7pJIsQgDDAkbLQcl5CXioPgcjKlhK6JicFoSFTnle28wvJ9YcErdZe4lurQLFeaUvoIX+9xzIPkPKOcaVho2XRrAQTEWSUixh4cg4119ZY4RULRZlREuKOEB3OiNy0DbDaH1kkRlUGYjE02ng+llLCcD7IelRWMAfKB0JgyZHf1zKFNh6uDFsvHZw4YByXVq/kHl3mqMIZRHWxH3S52fX7FERLmdjq1Sj3YMVzdgjW8Amn15xD3qm//7UsTngAvMb2OHsMfBaRjsZPMN4KpZgDteXZTV+5cAAEYACkwECkYSFhMEJOGoMY6zVfGCq30Q4oApfqzEspFkAYE/IvipyeFbP37wMieVVCLcJiB5FbUIaghqWJwGH6kL7qUMG1sPub5jswHmVBAohwoIBcD2qKLfcqACyHDgghOi6TGBgpKOHBkcV1Bqrsoy0WSqku6v32j7tTFqEudJFZJGrbM1Tkp9AoZ36KolT3aKLBk0xrSbVsRQwaugQ2vvte1V1OnjH2FOukCDW3Ja//tSxOkADFDDY0esrUF3kWy09JXY5MXzHQEAAYRPC+iOEyLQV1C5EPdw368oyfqSZWMicqT0xAsIkHTbI7U0v1WcEC9IhfpoiF+hsmVr/xHIzjIW4tzz3d/mfeROSu/ll/fzRM/8vhZfGK3OCJ1jv5Gidnk3M6cl4ETtUGDA885iKlAgFABITfFAAkhrXK2qdOGj5DdNBjftxfann6J/pHOqbO609IkhMDjo7RFNSCndaA14cGplgkz8c8GDSJNuTZKQPZfaW2bMOsataV4seHj/+1LE5oAL3N9p56Sq4W8SK7zzCdjkIZGtUAyyePdBAMOUherBM+eXs0m1+PB9qLEdMJcPECZ6s5fWPPdTAGRAIHbFIgaJFSWxSBZNfWHESYW7RlvZ9xilCsWLhF+oiYLjLVyoa5ugE4dcu2m+1Dg7VsqCrmlYU29bsgWSnvpqLFYEBAgIo4w5C+H4dZgTPG1R5q16UV9JJDt8GAlQJFsz1p9yGBUjI7c7Kr95UVuv9m/t2pbR1/Vn12SyZUX7/+tqstf03oPOmlkcup7tqEI+oP/7UsTnAAtMkVuMJFCBn65r1PMOGASEEQVYwaEMUtV0pWrfSMVpZKo3uJKU+BgP2l2A4n73Woc5au4ohQlUgoysnH6zKS/xVaiSIr95/LDHM2JjbdcYY7v8tuC99t/dA+mlzS3b3Z7+ghxXet/c3n74fFd/zDf/pvNVAiSVc2VbNtZJyZrkECeGZ0gD4SUhOKhaHg6J/+kRJy2LkOUwG4GfFzgABY8wXKvUkJOCBIwPDJo+y1LElFxy59Qnc0YVr9FJYvehCRdsqInv26S4ffUM//tSxOOADWyHa8zgyUE9i22hhIi4NjLSyFCksCIrnA0YYpkgryYKvBjbmsabpDUilz4Uq8LN7TY1K764lgtfdcEGUQ8CK1UWoeGMUzeSefOkRjpDWFhZWqYGYZmK28687TWoWV6BEWJomGX0RW0KDnpEYrK1awABCEACASQYdyKApWIhMLZognkwaBYSqHhLSBzrhgUjOioLDATZmkNoNAhVNJ2SGRqWxuUYYueJWLkU+HsW69y8svJBVHvzTw1J3PF1uFUnCL9VjRR4Ta3Q4lP/+1LE5AAJ8Udop4xRAZOQrCWWDPGKYWuda1uhILU1VSrYwWIrOpgIHofvnYJKC7EQ3wZPuqKAiadu7qx3klvkop5xE1rzvmNrbQHmP7j67t6b80coYaUSI0ZhYmKPofEsArbCbFJIH3PUy0ys0YGGEpNRDRqZU6+1VSr1DkriljbiaTh2XC0j5LM7zgL2mmRZkfKCiVx43uyXevnxmdJzc85wMvb04XzxMTOIRxS0y/8uQpE98jtc4RxE01kPak72z7V3+slPQOibIEMICwQKPP/7UsTngAu0OXfnsMGhaZGrSZSN0D7cmsgNQTU6LXQwrQBFJAG75FsLttABxdRFhbzgRzMpTxa14wHiXmzhYWZtGY3Xzl6H01uXubSr5855bv6IRRTM3c+efp//oWjxClSJE0ONtgiIyCK/TKV6cJc+h2MOFhLy598nppuiwmnQM4Yygiygk7mnH14OkQC5YZpbICCECTVAY79RtJdHwGCh2wHNAH6hQybKh6nftyjG69bs9WTTc4hZYSHRXS8C9LVNRNIj0nQyhz3LMAxSaFm3//tSxOmADEzLX6wwZyF8km1lhhhuOGMeyQ5vk7XBNbYUp255VIBMCkyIZiwJDHRCgnIFwPwxEIU5IFQ3p9iSJ+KhgZPwPQoyQ9EDi0AAih4E3KmECFv8P9CvP7dQcHznvWV2Sylf+r6//WjYpMQGtIZXSYEJJrVqADHgcrUjjTpD3hfxpFQrx/IDplFos9Gd+Hl4ogJiqJY8wbbSRXtYBCca1GY3Im2YVkf0uyHcszVxwtPCgpKjDpUq0EDITDeFHlwWL/EyEZFb561KR4206jb/+1LE5oAMLTF7p4xTsa2s7PDxDcXHEcURIkhdNFoABLVsVkcTeBWhzEcd4rsgms8KQyuI4cQA1XxjUTXqqGKPunKV2fDAfowVCm12dZ/nzJpNqtYdxfBaUtLwQlaKmBE0eDoitNAYaeNFyRhO6lXGPU61UdeSCQe5hZIxAAhlIkopwBlDIK9yFcYAeFE+Ly1PRcVW+4UtUlD3Uwvus1ZGyHfjBRyB5xbhKxKibHnBYLlhcos0MbQg4XiojFSLHfsqeAkIWAwkHVpdatRetcUoaf/7UsTeAAqEcW2nmEfhSRJsJYeMcJqdVpcGqk6AU5Yo43GkQWQlFI1MivrJBEs9FqMBzYiDuIMVwMil59TwKDDCbqCnogpHrMJDkMMTm8Lk5UGLBIAyzjQE5G4TC5qyDpgwIK1IH/f+YNsQvwYwsEElDgUfF94nrObFACEYLSSLKBhzUARrDMgLtSp73/zet5YnK2cxpneOiFhjgQE70aoSq5Js6QczZkJ9ye0xnWCsuplc5qfpf6vcnIx0Z3XdmL////f+QjWRNJ/rsdWRloqC//tSxOiADDyVb6ekbOF4Eu009gy0weEaqkPXIJACVpUFVZZYgChQ7mt1bE6vwl5qrBFnTjYLHSm9ouh7rzMI6lsmH9zHEm5eDOKmpRZpCyz8qYehAaEriiNN37/2/b+XpdJC7/meSekKIX/XEXAxhShjxBz3maCN9HiKgBWkf/CHP/92/N/FAqtiMrcpKCYfySMJTHWhR6dDzCJw4Q1XZUvJiBAhlkwcms9bxD/nkCwGmll3cZrY7v6QPAdYQUTk89P/QDFoM7m/oifXOvl/OeT/+1LE5oALkEFbTLBuQXQRLnT1jZboWR2ueaJ+/9pf/+X99jJYUp2l8r1Jeu7n6dfBEg/WDAZ3VyAIKAk+rdvlrRATI3EW7F0SGnr2WFXkEMei2l5J2VSCYi+qrCyiV9Qp1dbVMNjcHYuKPSZbDsFtjwnrgyuEMrUYPuWHccb/CCquog0qRHK1n9pC9hCDdbV5+qpqabkz9uxq+daDYuxJAslb6Ch8vIXlhsmf9Qqiga8axg0iCT3lPKqUmeGqBSuqjNSRIAJKAB0NpFlwcj3VJv/7UsTngAvRbV2sDE8BqCJtfYSNZevmZSWQl6s5pLnBT4VXpvxSwR5JBKZVnUtVN1dp9kchS89V2KCdVPvqXhBYae+rqj7TzLk7xZQjYmy5GNWihea06xXV9gE0lXx8iBILASwTp/rsvqOLacUddWkUTtiJ4jZIIC6Nw35n4UnrQCg+SnTEvuiVeb513RX/i4bd1RmpXsZc5RZa/VDxb0WKcxCqKWD7gxWWPrY5opDhZgtVARZnM2ldrEkSxh9puUqhd9PR/Zt0APoN2rpJry5m//tSxOEADfllb6eYb4IKmO51h7E40b65bCXYt3LLTOaiwZr1p/R6Cwm6Gjxomdzd6Ps7vUJB9UpalNDhUNKCoopFN20s7vuIz3e9n/iFW0KPq43WgBClGMgQAJKcIsgkHiRZpiSkhaCYSKJ3FRJg55l99nOomBCWd4/CgY4h+v4wq2ZyolTIjWEgo4+3uzezUxjKXemf9S/RRYyprRlaW4qj1Vx6bknQ2zIpDSoAZFSDqH9kKRVCAGWcI4jrNQV4dBYz4DbOCReWvkxoHEEuRp3/+1LExYALBLFzp5lOwWAS7nTzKaA4D7wQ3jhOv5c9YLh/3smr3FO7+bN33YFNrRXvwRH9LmbMVm2ev97EEMrSNou3DixTrx21C3j2h++moBgSI1ucU1myib4QJNGseB9OlKaikGwjRuQEJcVnWY1jrvAw5wIpIs+aWk3kMn4FBv6r1a7aAcBIj1C3oW2zAjD/U3I2hloCV7fb/1+UOZWBtWdFrUdtiK3kgo1ZBoicCh1wlaIjICNMmA68fQICkHFPF1gHtXSc5bMYCX7MvLTvE//7UsTLAAuwmXHsMKnBXp7ssYYU4G9eQ6oirk1JDOjxlPpsbhp07+JiDjEisnoio2/8GhqQQsKvQRxjx80EQVoa6Xv2bYxbU3WtUTXVzJYOLUEE4+eO3/r0w7Qk8POjqcxp31AMU0pqN0NSU1MES16xePvNE5DInSb7d99a4KBimjA1MhOJ0cAI9Co2GLtgba5V7391/gND8+JyFdKVJNaCCfUEj3p6Mwzdv9/6EcoUUHYOBZABGmBSvF4ba0fusqBc8DpQ6Lte63upAIvqKJ6J//tSxM4AC/T5c+ewSeGsIG689AqUEL7CTqQ6lLV3zbrYgiCTOL++5cknHVdNu9bUrllMjjj5n3/b91HyXRA4vvbarABp+ZtTmPtMEEMydr89Tnei/nP6873JugkySJaftXQjcjWb/+/9WBELpKaXzmXw+Bs91D1T+7OyTAicCcJRGgJZGOxNJqWELIjKFH1B8d1CKKVkQo+ce5F2ChaFi/1bW7v3/I105zKQbLyzL7V5DZm2MjPSQ5SM6JYBr86a0oZ/xryeblKQNcsj9o2ueVv/+1LExoAMdPtjjLxLgZ2frLWUCbjs6AKpFCxjZTON8n9hinz9d1UBFRCVaRhElADRdSQBWHup0kjnUyozc/5lmWesJP7oZmNYQzFcxssR5WgizsuDMUkb7evoeAIDOtFRWJS3V0HXw0pZ5caXPDWVHI1BpFcZdYRSlJ4jZosTRmCg6bFqiT9kqABAAaY3CiAgZVE1hjNnFhAwKxBStj2fwqaH168ynZDokloJuvG8kXpEBIuwQkZl2yb4qFQRiRTa7rqE61woDILmSxoSvuaCEP/7UsS/AAx1YWGMvEnBvrFvfMOOlVRJeiILz3j8l0dFH6vqaE3PaXFnnVj71QBDlyNkT2cxt0TpdI9CC8owhRWCZjcR7BgneYVrkl+kofXgHaucvXrCki0Dzvps6sXP9hSGWqah1XpMbSrN9kZPOZmkXC1q3fLUiplipOOnmb2KWV1Za2EzS6dbdIDESUqgdLJVAezjJyQM+laWaa0fANVANDojk6cxFTZXwWDmfTwgCzgLUD07fYSVp6OZTXh87Rm2hxYBGvGAEK/FdC+g2Ru///tSxLMADDSbZaecuAF+kWw1hK1o1pYl1FNZVKhapK3NtNKUPQCQBYBDScMywAjoovBHoZIBX/m3ig+Zuod5WLlD/ZA+9fN128UbIFTHDdxLvdo/zvb6VxWtAR9cMJK2hGoVzHKhatu1n3o9SULFsJCWm26m0j/i/onQgEOdF6FCwNGakr+dZdqJcM1IHsUxfxtlNeyKVh4upPQNgOaiWbk7wpPUYj/tupdH9Qar/xun4ijlyxtl6SjKnqDNVbb3YrxG4IuFYzc9BjszH6JxAND/+1LEsAALpMFv57DroVqS7PT0iSxSFMIkQbFLVFzgcVAz/rIeaSUxvuASRBk290r5xNstAx/oa5Cw9AOGbVHvzVXTaFCwm15eRLvQyW+JPdJteEXaPbc1K/VjK/+qmsTgYoaatA9KdFUTFwCLASk1UCAYEUPlOj0TM6SkWVh+zUGXDxd4MkXPRFC98igoNdJD9bgwXGJAZgCWbj3PLZLCDnP7/xH0NKaEcif+n/n//uffvC4WWm5elhGhVvnQmTP5C1h2U3zVGpJQ4QI8ocGHhf/7UsS0AAqw91lMrE1BURMqVawsMKGQWVw/8CytGaoA4BQ5UEwFUYV4pNgpraKEQfPSGaP+1tRrJllzcZNOScUrpPQms/HamcWSFdWs3ewYEac3xyP4q6u4tL2l8VRg4ehRJJ7GFBkPSphUoonTF3NBSAGBrlIpElDeLpNL96v+5djBcii1HuO90s+x1HGlKYQWHDE3EwywZ0o6+XH/MMyo3116XJAeI4gqzELNiV4LCD9f/AQkmDDEygzkUp1IiQUpOGG50nKSg/15iIYSIzFS//tSxL0ACwClW0ywqcG8re009A11SvMRllomm3DFM1oBfe/3pog6/qdOxc7b7ysolTuzb3vE0DfZqUrXurp7Osq5cff/fSgrW7pnamioKb+J/B6K1Dicu3gJxyQXp+VfDjmx23XM2MP6s5ZJuZxpX1nEKrduVv7Kr/TteDZaKUKOv9Hd9t2tQuHV+1wkBw6Cz7bCOWFAQAEKTTsOCp1+qZKPM1kCwzFJrcdpH/iK5s91RjmRNkDBLMNvkaoesoxhg4mnCNZ4VXHOMNfFZIYtZZD/+1LEtwBSoWNjLD0LyTaU7bTzCbASeAvzJlos5rSSypEBjnbvTtCj7w6JVQLBNU6rpfEYkzmHxDNrNWmeCG1bax8HLLmeDv2wfDZrAMoYDOjBSuoERFYGGMhMr9FHjAEYAJ0XdDyYaAR5DoGiFTHA0JGInuHaf5955rcUT/aSBGAi0TCiWA0ELPIsQOwRtHEsQbWeMfCYsFnPhlCCg7vKs8jBnPJTo4Z1b369a7/8c3LqbhEhoG3W3mKxiJNiHfvoG2WoR7siRPA0FUCObWqsmv/7UsSjgAnQyXemDFEhSwws8YSJyCD4kJATTcSviLWUDE0ijUaVqZs8DaS2uxJyS9Fn7cEGH54Yj3AwtsxnASKyeESSn8I7+Do/T+lY1rBVVF0Q2PCRH+95x6nL96Ry1TbVT3//7TQf0LE3c7JehLYEcLevoJjQDEbipVeUnEEH0FV1JWojqKgW7MqFC3fgoOkS8nOzLGAnuQteuUiVe6p+dHSj1/k92MHqjsqfqmrZHR3VyqCOmh/Ro7kZGgAA4QSqEE0qL5pbErWVQ+EKir7O//tSxLCACkR9WiwcsIFKECz086XMResuLF0PrfJVJ1li8dr3QLFDaUSl61uZTLKAt7/9roa8C7Nq1zcuStzKr9R9/29LckokXTPdrp4PumiTWM63JKAUA1dKRZKhfWGponyeMQaLPZymhSC3PNLEwOZERsQgUqupW7JcTAqMnq6dTdk9GkYzcjOdiOICmutvd/0O8h8AzB3q/6Sc/ggA+S4jcn5v0qWcZv6FcXzvEV2ZP++tB/JtCaHbZSNkpjU4YD8tDDgkLVjzdEosgS+XYsL/+1LEvAAKIJtfTBhuwVok7fT1CbRHanGMo0D7zv0ZofFGoRpCtro0ujo7zihMKtNGhRIEF7b7cAJ7OiXe/OkY0bIQ5QnVUQPDKX9aFurbYNAjlckbTZ8tRdUJVgpKRPs1ODkd9Iehh0wr2/12OrzjmVKO22VwVvLCltmeqnpQexElPuGQStESUj0tMWLXNKS9aav9mrvrPWL//o/rEFkD7gECw6gUuQ6jq3MaqzWS0zOX/By7lxIiJuTM3LWoKlDTOIVtGD+Ko4Q0Md88jdIKFf/7UsTGAAp46VksLK9BhBZtNPOVZfOqTnYdcRXNStzoqncul7Q7r3mfnPmPj63u2kU/9FadhH7cukTkAuPKkTAoCMBDouK5PTWExsFP1tFLgfq45Yk6zYkGPc+qFJ6oKosxPPpYa8APUk3OqHhqLNcKFhRdfCbnLp0UXoDS3JTs7PW7VUAgZArmmuQVIEEqK5NIhIKGUKJTykqeRwAA1w3tmbuvnjnUWgPSDSrGW6Kg1/aNetmSkyyiFiFs+8WDLWjh4IHs8BQy84dE3d97Uzta//tSxMmACoiXcaYgrKE7Eq109gj4iH+9+/4otAcMAFhtYehULDvARJF5dZA90JffjMySrpwkV3JjweMADNARbSvKKbrvX17oIWvSYsyk1V6XEnyXN+lh/eaIa5lSzHGsQ41a+XNpeOu1lEUUyuLCU6pg8laVe5G1yImY31v9sk5wL7iUpb3hhqlD2NM6wmloceyi2RcBnXszYKDwz9gku3Qj8mEzreaLSj+2dBRlACSNBVRSxCjICys2UOHLa0BdQjfZRcnRbM1ofdeUAQw+JVj/+1LE1gAKRHVYLCRvAUISLXTElZS5BA8H4HU/uOxAAOR3neDllwSLIoMCqciWyuhmB00eDj3L2t0fip7njd2FBLMSFiDofaayfb9T7557NdbXSt1VGpn1tnY/26wzPfjN+fl2eT6nPTn3vy4Qb2fbMg5gGlxh0tfJ0CBBAs7H3YIEED61DE72CCkMZB35qyERgYg8R4/kCRi/SNAghjZpCFKDigrmTki80R5B/moIonVGRAgXWuTEdb106zfo2ChkCtlGS2DI2PzfAb5zGCLLWP/7UsTigApwkVcsPEdBcRWqJYMV4NwBQFMbUBmhjIzkdxiM+5o8amMSNAQCLgNpaUHeGiXplmHOsogzZ17UdgBQG222xABFGAbmWQcNXRXKkxkcYazPDo20hxTvLccpsG+nj9PYojhL4hhwD8H+IAHPkE2j0f4T8wXrTZa0dqCsektbMxEodUxLaMiCDxivJDxNOkzL1T8xeLZMDB1HcIMQvEMJdyb5T/f/LRXK5AilTP0MqCUty7LPzyQMVi0/82X0yoUffwlQxj6CEDo4yTpn//tSxOiADDR9aaeszKHhrmqVg5o58q5p6DSUm9lyIAQjaNLNZye0BYQBKgvSVGozFTeol4yaZbdYBBWCiwlIxqM2/DM9Qiz4kpB09Lo4hDGXoaSYEYkT6XlHrQ6eF1Lv+j/0/d/2+7er6ARBWGNlEyRpJ1PkuZh9vDXdNBvsqkZAmRwSefcQLgOLt1YplfQeazlPyLuQXQ4kaH/kSFRYEJ7Z96Q/2URfufxT9DKHMbsmBfMxVJNOPpPzsXUEBUlkRsAIhpoRtNHDdTF9VJpdWYv/+1LE2YAMkXlvpIR5qlUvbjT2Dtmupk2voM3GXHSZ/zLBKHjVbdG3diuVSp/2qnwxh+rW/9Va/zKWjCioKsui6amcSt9n5FbU3EXUAqJSqhSHQAwpDQAiRiXbYEnH3cpMmQsZqp0VR7PREE8aPUIc1nk1BIya0ty3Lcr2n5hEKNGG7OmZCtVHmQ9Kaa0FvPEUuW621LNlsnslhbOUNiqN5g9fYJStu8iqBQEQessTTTZBRujzONXeBW2ROBXi0/8R1NzLQZ/GXdtSqKuHYVjoaf/7UsS6gApAh3uspMfBRhMv/PMNSP2tKBJvNdhiR6OJ1L77Cz7NCFb+5jFS6UY0vWyNPdLKCucKrpGJ9z8xQnoatCZud6up88WrEDyO4NJuUBTZqzl05bCHVcdr9o9cqhn5WgW2jWZMzDIx2/sQRgBn0lp/hDDxQtPtXdAljAVEWut3MMOptw6ZTPCJbCMYjP13LLh3972X1qHzdybN0PwLCalK603VABCBoIlFQ1I1pxZRLJzE0F7KwyGKz9xhFhpsk+NkdVWKnzSm7pxIDH7P//tSxMaACkjdc6egTsFXmC0lhhUwwQi0Yx/ht0XQysZ/d2icKhnldKrOCd+yPd1j+VCqhpVHenfb+R5Wh08z2awUB0OrytIAAhDY0gFwrE1R0p93PSWf5gVarMe5dE99qLo6Q7ZLktz/EiwFzG/BzTK+mgxDq9H03eFOt21e7sG1Js3y3+lWcG3b92Z6/n6N0699VqVr7KXrsliIF7DVFnVaChPItRi0bbwM+i8mTgKxyJpVsgrtKunkJGU0d6pBhhxfOK+oAg5B5u1HWJGZTvf/+1LE0AALoMNtrCxUgXGRbWmGFThjlnMBWY8zmy0jtbKWZ6JXO/zKO5nSAE71BVXsSt9vRLgobWZcudHlJWbKagCC0KUUWiSoWhvrmJAPNdoxsuzY8V2xwVAzOLPtcY4jo6ufYkIC9PqhWqf13KzFD085lojLdtNaX/JynCNnVbnn58ai0m9/0sI1cjvEfb3mb/Z6XoOWKQsvA7nC/Iyf/lM0CWx0IlqcSZypEv0J5eyeQZjEjduB6aWR6rHphWFB+KIsYMUTbDI4qtNswVhfR//7UsTRAAt83WNMpE9BbCys8ZMJ5L7mWAH6MtyZBJ9iRdEiRGOMLVDq94qzyyQvtTJ6KL6aw0Em2StH9EmI9IAAqDCTmFywrgvpAAB2ymaxn6nVctLtKdloq6KETLgR2MhQ2ukpS56y9QqFEp2fDakaxS2qybb6Axg4ssRLJvp/IHRfuT+BUsEd449dq+xxUF2sRTJRYymQmshrmpUdWFTzVSUbqyilZDF17PupyZQkMY/ljiDPaufPt6uAyDVlc/+5MnnGQnaGoyctgvSScpTd//tSxNOAC2Ddcaewo6GaMe208o492pakVMZp7UefSkcZOT93MIYS0uVtUAAIgpVFGkUA/WRaLeJOYpoHkb7WI05niccGUHc1t+ygiAzXjeckdGWLkIkx99PMQerFV6PoLNptSyBnohbE16nPWIEJKsxVsX3irKLDAYw6ZPNYMDS5tQkAEKI/hkCGFk4EYc00woVG2urP8pV9WHLjN1dhCtb3nxChexaTUKExYG3f9P/i0ikBrlyrVbaRJRs3+rOIBacmcat3zb85VeqGEXU896n/+1LE0IAKZItgLCROwU4WLbDxifRAduqLB9DkfTsYzpECi1uVtpwA/JWapCFC4HslEOfslLOcV9AVJ5dBSLlWKrk9Mi58LOaC5CPuOIPo8uUAsBjnvJaZpbXwKLfR0R5h62VCaUmTv2aYYLn01f7f/l/+1/0f1Z5NR00BHCrxIX9H2wQBGXVHcUkYDkcz/UZbk2xoww6mGpiPkpxtt/25RKFATaj1Ai1casrqjJaiRSCNGS97Kh37fOLj6mbNSVpIn0aXgKp3evsVco4H5NKz4//7UsTbAAp0i15MJG8BTRStNPSJPATrOJDDwCxv5RZMAIBWpQE/jJSLijiPqr0l3NHA2tz3omObdy9Ce1W1gsJknr0CbaJs8TDeaUZ+rqajiJtQEUvoof7RrnFNDtm2spd/qphZCgLSpYRYdYVVHx/ty6oAIFUXESQRJrvu4kOl1MUrKV1Fv1Tq7qYRsxMyoTyWqJB6ftjmgmDJ8sL6NzSYfn97dWduvucHhwnLw+ADkkGQGDNo4RK4hEiO7WnbEAu1gBV89NjQs9Z64uPdRHhy//tSxOWAC9Dda0eY+jGJqy0o9ZXyBCDC0iGe3J3sf2rWzSHuzM5+t3TbPkeGQ3/Nf53TMhBydx//nfe+ueWwiyVCx8cfwg6jv/QG2Mkkf/pI6mWp7kDQgOc/T9LMWE5wZmXm8KxGytnWre3lYbLUoVq2bkKUtkQyg5Fx0CmHhoeAA6888RCunpTelAVUZ1Gv/yPd/9FbDq1X50h31Rk1sAaUhHWR4YoqIwhKqDWSyqaHwklJ5IMnyppDU6/W75gmKLV8/md7DcDJWFKjj1hQ6MX/+1DE4wALGKdpp6TpIUmOK6WHoNiDwwKHRKCJhbaEOQxKq6KkHUK5XR3Osjfw4qLgtHrxwAIRhZCTTadD6akmgjxlRjM3rtZcTJgzCwRQVaciEaqQUq4llVkoZ2kKtDG8sysp1sy2Vf36tpnMu/ov12M3p////bdl5W+9//HMpLAqRtdyXQwAQACJSgqdgavkbF/vosJAzqsJsiGxCbFVgWvMnmRwdOyPdrlVgWfVKA3G2Ej5RQQNLScSOMA6w1W7ywUS3Uz2UX3Ed/vZlRS9//tSxOqAEmVfY0wwzclIDG5w9g1oY+8gKAqdiUynrBAACko6FASNIAcG1B/iED5P0yMWFwmIHDqapugDYab2mWE8LdB7B+orKZs9SfaTGvjE1IjI/bJsv3nwxwfOVwILIaRWMX2hEQqxxTc3zwr7IUPEjYKiusRW7uwEXEESmipydrylJ0Xp8Q42l83yY3cEjU3w9VWW2qyOBYAD4UjmGAAqTyu8GSt6KMgcvbbdRBUVaHnnBRosE4owvAZR5jY+oaoRPf1osguSrVchaLSzg0z/+1LE1YAKbF9rJ7DDwUqrLbTzCZAu0BpWNYb/sBKASSk4uCRqMoosFe0VK9p2MJ2qiIf7K1SK+Z8xU+k8XsmhrxozzMTw6QiofQylHQQlrhDehQRTAcwlYjaFmNlrEHY4KtRXLWrQNarTugEJCtArxddabHpWSTaZNJ4AgFvYpptN4YydUhJkKgoTDdmAcc0Uvtx1cJrNKunHtsIG0kbtdiWDvICeQIFkIYWhBftMRbXOzlS5HtyyNVLZES92ojfqz+yUza/P81GoT77/+jVoLP/7UsTggApYW2LsJGlBbRXsHYSNKHAhrP/KWaAQEgAKSQlFtbiEiAJpDRsRFKuEdgJESMVo1CqFtSKi0XQzpRySWwxfakwXIyUfzf6/pW97UKek8jHdAhRYi3z6n9536/T7kq//9zi0I3IzndV6/neCEdTquw3ZGo09kQhJwMWIDySANJo2CqpREMSFYOoBcOnoYip6Rn/aMrcUqnXrFx9WqwwCYEA+BqmMiKShf+pn3aNLtRROqv3NNtb4njqRlo80oqt1mTsggLirGf69DowW//tSxOeAC9iNaUewSSF9Dqxdh4zyHgCExXUzFczmpWdkWQegDCBdY1tDnTUqLUj3epSjGIHWoq/hmq0k6HqZeD9PM08ljZ1Q8ZEW3uChZe9cKIWnvhjLydsmn6AAhPaeIiPLZ3s+tT13iBCWnf0ZntZmU5/V76r0un9aeroxlmUgkDqKilwYu6K4uoCAAWiQAUi4zDT8wILXh0KBrM2Qz9McryufLTMQHF9XI3JsKCHVBhsJFgMFQpiUFoTUIhg48Ezoa7zoGWBwL86od0G+gjX/+1LE5oALeVlpR6RNIZUxrGj0iXmYJR41QvR9d3716Szz2ACAAQh7huE+7Ux7r1IIhwVI9TFrL7MSgEuhKp40alMI/Dt7p7DHK4kpRy6L6IhWNWYB36Ue39rkGi07usvq89R1f30CJ9pvp/D9pMLosXM5aUpcDXdmqKNxawbb0zBnR04ahoE5xHQxE8pbBGfr2MygNgeDa0o/yreidUsvI1TI6xFMsNC9M/f/6IJgMd2veV1ZqMq5ZaOSm31ZLsjo3og8q0P2IcyiDR73uSxCIP/7UsTkAA51k2bmILHJSCOsQPMV8DeJiZ50vb9NeRLmFdredjvOtTshxk0hrknKnMIrqUQcATT12opF2/RCxFGIn3BxTVOTVopLps6XS6S4JHXnNR96aqcjjUbJTy/XaitPRrFlpejefbr9VVl6vc1mHSZQMydjmywaAJXS57LfKMAk1VWBzJPZUlgBjuR+iRKpPMy1tEtZiQcbkfShKezsfjUCltf67UvIuH/PU09XfQZ/out26sVTCxtKke7R+PZ7lCZAMkWkEJFLB+s5SnVd//tSxN8ACmxHbawwZYEpFaylgxXQPPf98AAAAAGqRmvw2pNHszCmmuJBOZZiktbjuO46YsWNRvmXLlh5EgZqvrOdPPnNo2fmlirMbf1nXp7ZwRHer3urFWIShldFadGvZXunrc/a1u/SuhPdD+3OCEGQGjrNDtYsGxdYOBFYf4f9bC/MCyv1RyOEFkIOsAsC9HBuhS56gbOBvZTbSXA98Efz9U3BK1o7D1e3hgTwh5y9fXZzLzv86WXCQuxMrvIsBCR6KuaedM//8z+e98jyp3j/+1LE7gANjTFtp6SvoY4l7jT0naR8LTznNLOq9M+QYgi/JazNIBDcfESnZONtSLjALTwVABAgAuZE+w0k4G4j+ePvlbV8S/9OzA8Oz+6+xUh6Mz+MftDgi7+t/DZ4m2dqQPTPrLIJKtsTbL/szxO5AOFlPZ/QZ00C/sYfulIH0hrk3A5ELRNwT5X9z8jiRBIvmloHBChIzWmg/8/PX0PuP8/zEZ7V/+dlByOppOMkBJ9hQitEPBMEihx4qJ1HA/Elu2nLNrAx0qUh7Nn/V2hqVP/7UsTkAApsq2UnoFEhqiTrsYeJeL8lY0UwzuENiWlTXnF9YnAx5KedOvdi139ouy9fW+96oajjpXfyhpVQKRckbjaRJKVJAQ9ZEZkVnLpSLSVgfAmMH3pQNlzsxwuBIVOCZSA6NDT0DdolPHVPcsCKRuxibbqbE06Cvd6+JTaBcVM7UrrSkefIIUWgRMh6lQET1e3TKBFSaBgfBA0QQKp4xQUE0jlAIfuvuQQBTkoDVDcnmiNEa/dWGM1IuJCVaQKiYNjYaSxK25SW0J30ru9C//tSxOMADTFvcaSMu2HeKC0Uww6xiM8kvT+W32saolYLLMlXNQABCBUoySAAACwHIX3cjcvXxBAaDwRfZL7pG+VsssaprKsOKTrvJFO/XNnVWyzy8ILkVuBWsJFUW2taozQp8WY7equM2bd8gs8PDz0BJCa77vLIBBT9IRIAkoGLYXSpsy+cJUsG8TNAZbTvZykw57spq5lmkPcmNduMQULQw26AoqG+k79YDoXRHQ4fdGix1vW/I5IX7T7uZ51i5OCVjXjwtk2XsY12szLUjDz/+1LE0IAKNIN3rCRjgUaHb3T2GDLTo9JJKiCn1WbEpYoAMNLNEYE1QaBWlBDWaJF9rslbqesIeoI5+8/jLOvVjSmX9n9xvWbd4KOfW/b0CAdKl1fyoCt9W6GLf/U7CuFVgmgIyN9Zp/oD3qQDySJ5r/h1IxSGFXOoUgCBgIQm20koc1gKGRmYdNNq0llU7AMBw9pfGbxd9ZjnOMX5WRvs/yQ0bVGgLF1yksipV8sNzc5cT933DSJR3tuzvcxEe8tN1OigRRbqz77o/78o4xfrZf/7UsTcgAosc22MsEHBSo3s9YYM+KR//7M3L/VH83QkP0lS6M81SEGL2BFQSLrUbacJIKB1KxmHQgToSCnTq5OhO7PNGgTHCfCJORbcGyyUv9Oi/ytiAhJkeg843fshF0loSxVa8h1AVmp93BjP6dGc4LV18kgR9FL/c79/0X/X1Z/f+tP6MO1f+qoAAUAopDAlFmgrp6rAw9DUdcdkr9xuIz2LPdt93sOb5t5k+a3MtHfj8GIthXb//4wkgYc8yimm7FRBfT6lS37nrt/Wn31t//tSxOiADKDBYUw9BcFimGwlphU42BNHyd7ldTi3/UtNKiGmoDU4tlt11/ktvB7xPXFgrryESBLPmckPxNWuKHMVpAU/I938KBPYhG8e2S+6Hci/deRS+lXom3PRdyLYiuoujWrWhpEVnZnldTqrrvPTqn85yfOruw+UFHacYKcXBA9h19qiRSgn6kgHknzyX0mjHRWUsCcP5/PUixdjNbHQluSVb/0E5a9Fot7fSrfUW56jAEebSvpc5E2xqvTRUq/HKQptlVL67al9KKyHNrX/+1LE54ANtYthrKyvwXqsrnT0ib7SWAjFht2p/yxxslQTxXlQjC+tJ8lovpwD6agnNoVjw+ue40pXu6MO2r2ZCxs9hmWO3XY/1YIg40zlqbqQEIw0JHPCZFYQFyR4xsrJjUFcste5O1htSw8DDEbj3PEWRq2GxTeo8FEa2wUThUJlbWRxF0QthI1dJwDrRBoHcbzbAJnhLV1R+WK2kB4bYwtL0xS6qckAZh6ESv7uEQU+8BOe4AlrzrhE4cJUhwVcrzzn1p9m5XiVkwKxsEWobv/7UsTfAAqw+V+tGE+BcixvfMQVZISgARQvPAmYqEoAEBEQaLCRcNQE2j3KCCmhlqdOJw+sXRL4+5KMWUwx0uATXRWFBnH4YBO6pmSb/UXMbjaZqxgqOcp0cWMl3kUNfc4QqHCwfjUXKcXXxjk3loxQLiJHQRp4M65bagAGCXRzS3i85C3dS1craJuvuKxCNcaHBWHiw/ist9KZXgwGHT8Vi4UO+x0BMFuNYdL/0PuZWk4+ZAddSxzkmo18Du+GohyxpQ83hO0smp4DFAMIkITE//tSxOQACoRxa6ewScGPEW209h08RsNBt8Zjd/3qAARSm0LAAKhsCjrQo12m8bC04cmkD8JzhVaXbAu+pSXxB2BMiHZLddDoT10rYLF1zTBydyoFy/1e9R0s6/tzl/pqYhdSyWLmcqps646hDgCGZq1YEIlTrTwCnfYpjCsRbKO6BRiTsf/KuN5WRUYyGKiEcdK8NPZFxuy+RsHxuWNcYiWoavCQJ1dYCx8bvSFBb1QCAbbzs+hEmzaWSw+RvaOcoJCjFAA2qdpDvOuCKFOzP1X/+1LE5gALvHFt56SroW8Qq/WHoDAJ+7ZJgGArQClmB+XOTkAIapm8IFFzxmKmrLlORkbK5fw/L5JC7qqtpJM3zn1tZQlNtw0t2SdyBDfddJgv1X5Ffu9TmQ6E8/kVldLoRa3WzadG1/1RjmrdzkEFOEIRmuruSyjkIHPIigYuBsSI/+uspyoqeR7pmRdaCgu3RAI5xMUS8fmzdzgmOiWT9K4ltgTJ9jA807bXmAihxbRAgHEQIAE49d3ibvnE3dzd3ZCd9ghBx4hPTOFbyvER3P/7UsTnAAvgqV2MMQfBixhr9YYc/MvRBGm6fMi/3Fu7u6efEEAmlKgRGmyAnfl7xUHwfC5NS29joYBQkrhPN1WyvVNHX4BoX5TGOeTCpooMEKJFrETBKxUC+iVrKhFNQ+SNEqWUdRcOMZaWquKhUr04YQ2G8VMoXLlyJiwdAQ7NmyjQZoRdVSddQ0sVGiespIC8mNY9EjlEhsbYvJseZNYlmJLbSrUqmCkLknUMN4uBus8VPP1HCOuqZ4Sk41kcbTl3kNehtcMe/ONZHyGqvdsK//tSxOQACoSNb4es6bG0riqll4k5Oj6PgjA2ZJTD10xUI0I9Dz0piiGrZYhy0FAN+tIT0VLdfV6ijS+ZRAQMGO/mOlUltNhVIpWCwVAApACCJmGJkjqlE+q7pmXu1qdt1r16qrKziwoDX/IdjFdfuz+t9VHA4aEJALrycypbP+3/5208BmiRPBUZ6F0EBJUTViqtkSdH3j8IoxeBIQgSLhlG6QOE7Ik9JEg42dm+0sAzVtqPnr+druerqepnFnme61gB0RCQpYmVDXO2cZNYwTP/+1LE4QAN0R9cDDBpgZ4TrfGDIYiFh4iT2rs0HfZki2xc3Zo9gBoAAAEomA4TOJtZhUGT+WWtNyXrfKPWl3vy732jKCYQdu4BxyoeiPfNo8PT2i0+d+ucfudogUIpGIZQIdou0WU1eure/hz/9/2ESOTa7K8YMVaBlilajdywsZlqVb0kRm1l0KfU1g8OXzXcYaIGssupYY4LbNNR/8b3l0ZdTpX6mptO54h4XSW99pFQ0/+VdU0avVx5lR6R9zxNfFX/7JEjkaq0DDVpfMhRCP/7UsTUAApwl3WHmE0hTJltaPMVMFoXQVegyIqyqF1IvWISVqTRKUokUV6kA20gMg7k6p1+LoTx2DbLKKY3RxO4Ul9yLjr5Yr/EfjLNfBO7yGN5t00Rhq9DBQrr/zL8bvnfuqszp7bKPZ5nTcwQXsFgxK1Q0l/Sn/9VJBJbmKh3aizPUpSciizWad2X/eSkLvNWGxIjluAoQqXpQi+zB6CKkTxAfBk2YOibbqOZFQx1d208okGVlMhF8RM3YSujMbrZCtWtG7sLXft0oXVrLyqr//tSxN6ACqylc+YZDGFCEyvpgx3g29rPPt9Cku0RZRYV2Tjt7AOAMBACJJTqekD0zXooRJUXZrE5XSyvZIGQy3dHcCOZZo80oQPmtF5eMDBP8y7K1cSunvWyU2hBP7dGCGMky7wx1Og/cXf/f1HKhQvaUMgwSE8+QGh9oEGHDm4AUDiQCE1B9yyGSniGiKo5grGc8IYzuUuPWHV6FCg3LK7x4udacERK/X9H/7tDsky8G8INiZn+XmEr3/Pd3MRpFNx7LKCg7UsIggFByoYQRLz/+1LE6YAM7P1rrDEJ4WEfLKj0lbSKHd5brBE279XN/L4wyJdJihiDpu+5PLgZQ4gm26c4bZiKLwOPUeNYt5GdAAOAhLVASRltFjIwxsi9kktvYJ3BoVeI/771bvHcCZTN2O3/f/crani7Wr9+KmNu5/fry/5Y71dmLc5RIKEWpkRZ393XO+39V5F0MAbT9fihJouasmbQA2cSL7u60Gs+NIAEoI0S8PCiEQSWOBDM4EidAEs/O2FlGB0PKdqJO4BCBBZdiAKHj7kqCKggwDhhJf/7UsTngA0Fa1hsLK1BZ5Zr6YQJ6A4sX8Uoubs5RiHUDzq9XqPMtfuQVqrqFTKu+17z6EIgWtFCpInCkUhMdhiFQWOGBqcO0QVRSYclnrTqoxfVEUx8tSrT4xzhhgNEolJC4oPDUWBqwseasAkoFb51tq5ZLCAme9OiYjH9v7NLBphj1G52rIoDWAjCLaeKNAAYBEKUgHZqKZxEiU8FrcaiS+lyaAWyrQaaGiDWrdKDLLwq56G68aZ2QlGcaOky0kLnb1pp5nOEuRcs6oDkpCz9//tSxOSAD4WXYUedEUlzimyw9hiZjX4UrO12EmGf61AAATAZe4TKQjqLJV2TV0o091JKF5U8Kxg6n5IuxVaRAV4hWGjK2zjlw/1qmPlgilTUlkOzrZLiG1wudMQpcu5hIXLCsI6SyxolwCpiTyN3fp3WJFBGto+FKmKVDEAglJ+PPRFAZimj0pUvdmC1UA/65HRBQ4czGDDVrFswW9K//lFam5cru/9VmvmcOzg3KxzVlmtoyt6tZclfFCoMA8AlyseLpcqSq0JRoe1hvLnpzcj/+1LE1gAKVEdpRjDDwVANbPDDDZBFFHq+jIDZtTyuNpKGyllaYpBClKFByIpGOcM5Y6jtSczmEvJZuxSXMz+6WIhgTVZX1S3KzJ6HcioU76IjbSiLUFJ9yWoapcoYuxO2cSgoj3h/TA49IHB/E4nUXE+MJs6q1WAEQzRMrrQw40WS6eJLmJlEoBgh+ccI5tuGc3hnHb4sBQZLd/z+UfM64vL9em/VwxdKVDfPoNNDEIt/kL9CfdEEOaslkmVRoC9aainuIjzc4Zz8jggqXT9jif/7UsTgggpgl1anmGsBb5TqGYMKGCuR4vz2eEetKihZENRc+dNbjLX9OAaij9AANIqJUwG5/p4FQJpMWwpmzBKfx4YOrKiQTCQVBZpcBCIkHmksLOkHCyaUQ5MmT2DI54DTMAAX+2a2EAGFkydkyZMeYzkzDHPJx/esQQxkI8Zz1ve/Xvb+do7GIXd3fKiE9vt/tx/EREYg5NjMJnp4CK0mTTxiiBgRe6ZADOxp4IAMMCM56fYy7bIjlBF7nhCOgCpthtW6t1NtKQGX3SOOp1ab//tSxOcAC1DBTsywScFzFOx09YnkVyGYZnqShPXuMmhHMx9dLQEg6A6B0Ao9CSbEnzkSR0Mr/k0e1rmbmrr55AfR8bPL7z5fJtFyrnN8AcohNhUFvr2iv4X/kNFPFO1s+0UuLXPxInnjczxVfMaf+7NtvbRai5Mbbxn/rHn5kzBGOvpGxkXd+CT6nG5Tc2dF4oE0kidC2B0AK8BHJNI8iOEQcEgSm10KERyZjPZLOt2y+spZBRolPlIDB0AAiDAIDKkmk2LHiNzVllJSp7B6n93/+1LE6QAOVWVXjBhwykozbLD2GPGhwUxe7RI4rt7pZ3Iyh9r1mUFWOa6uAEEqdWYnIi0S2orU8fB1olIo043IeooEN8ckNg0ii0VhVEKvDJrn4k21+34q5zyh+efD14JH/s+lZDS3zGV2lyaCQZ6rvz2v/Ty9qz7DrDD6ACBdG03RNhHwyThVaEpwq5TRlWGSwgVUk3sJIqFDqDyK6i1/847XlUxiNM78/Itn4UIWx485Kr9SwUUUTSLyK6VpZ330FW397mP6YKxV21lSiVUBIf/7UsTEABG9i3WsMMvJT4husYYkSAeGRUasJJNA7w0cbpmaCuMVPFVawPVGeNMfdhw1whbJEVVeNVlWtYKU5qV0Y1Ur6Gfr8i19SDGsbePcnb1OaMR32/104kFB5dovuYNaQELngkBIADgSK1RaAVIUGai0dKMhTkheYpGzKyAIvtDNZ5tREBfhcVqA8nnufCiN0Y5arA4xDhNX3EXbexNVN7jrduY+pS82a+hg62KJLTFEfBpiCcnta///6QAtqQQlzNqrKvka7IfR0U+qSKwf//tSxLEACijBeeeYbIFHky4w9I0QuNCgr5zLMGFiTbVkPjuFY++yATzW2SqTN1OiSZ6VGKWq69tZ6xTtllClHjFTnLs6f236VuTTbu5BxlP0gKCcozEkp8sk4ncp9JNQH2fFFdY5GGhsTvIDWcg62xUmG3WwE6TFhnAGT8pZxVTGdKodFC7e/oJ3JVNTOEfWmPQu/lDv/VZEBZep2jZe7oUqBIIALHjQ94aU1ZTdA4LoHiJ/6nKbbhQgvMO53e9wZEwSv1sFwOnrOTLDwekpXrf/+1LEvQAKbMN357CjYVqYq9WUoTrATMZEMaj26SmP5qld3GB5LD9ue3/8Q3X31e2ifbVNGt7d6/0/qo2OqbbiOoFIAYw6KJCS3Zia5nLRgdirD1ZaBcWnWg0rh8700WHW9lbsSIu/MyXB/s9Xets3DV6K53kM5UNTUN7tROMRrma/psq52pNP/56i/Z+EHEkVoRXetjTRSwm1pLub7AW2Cl+r1DJjTdVuEJ2uw9bptZwD0uAnXvHfAJJVtTaUDR31jkn17xvmhNqhG7UI5KAj3P/7UsTGAAoEjWMspayBQBguvPUJ3IsJTNyJNNzM8dqygo30pwtt1cn0U++19FW4AQ0ACVYJbHElAFgBAHSD7drJzg5MBhTKoOeT2IhyYGspDtBis/MGT16c8PkVX/xSJ8hEOF4e4TLHyL18gG3qUHUkj3ficv3yzqlqs/J9F9jNaadFABmQAEGWAhSGQSoK5Qtbxs7Xm4vPEXcR+qqgEAUsTE0yEUkp8G5KwDV9DUbqSNIdPERKJFSMmVFTOtySgOQWxYLpaUNfdvZ+z18UJUSv//tSxNOCC1FfWswkrYF2HyullhV4xV1bv6YQCAjhlR13RF0FLVtair1D69YXg6VUGA1EepKT0gicaz9hfFVO2R0iF/cBAiLC/81eNNath98jr6BTbHStKqqudPN/9x05mwW2UHbv7WO2iUKDw3qAySjowVnDZMoyk5p2RqpAAAF4khFJOK8mmlLSBl1nw0pyIFPSG9KgRRmJdDxqByB5aaIzcCNKV21Tvt2vltm0//HuHBRjeqbQqv/KURZnZt3aQPGo+703CY06eQ51jNrBz7j/+1LE1YAJmIterBhNgU+ULCTzITBuqgXrdPSAs5C08ir3rwACgAuJGWF1pMquKuSjKor6C7vFuy8aHnrE1u5vOv/UVg60XIax9w9G0po7zat0mLVNrPzihSMVVvz326WahkgjX/1//q6/q/r3bV+U22ojHbCmt3NVwACbJESZIBh0owvwE4FSY4wk0EhVKO25opKSrhn3rfNqJrfNOTAKiIZI+B02nfqgJlAXzsWxD6AJf+kx0g/lqp7by3oQyMc+3VGqr/RUazUyI9yzEe7WJ//7UsTjAApYVWEsDSwBiZgtfYYgvNT0XIBpaBICRw/uozvj//yB+cBgAfMZfQIRClp2KABSc26sgNMVQ+uxZKmGDsF9c/JNO/2I8/v85MEf8TtZC35wv60h5//UK3QnnEItzf7XP0F8RW/fI+pX3iFCIqLofBgEC5AMFEAcuJkLPixwoIMc5GI/bWqAAYXCEAAU5mqFYemg4mIL05uNZlNvVfdjp07Pza97qFhZC8cmtxSrJxD3d37w8nRCIy4iIEOSes8jNonRaEITvZCESqH9//tSxOYADDjfWawwqcFWqWtphh0gMjc5UZ1ZL0aRvnkf1T/2pn0YrQjM5wDND1sP4z/84oqiJKbtCz2NgkgSYA/J4X8ncjbE6wQtGMTarjBJa/TK4JBGUqkISOgHh1rGwmwAiGjAhSLE6qFn2hQsxSwjaLikYAqSFlUFmtaSjkpvcoBjUFDtH/7UutTFGej7+qogJytpekgYki75oIYnzdqd6rCrDgzNRQwsugctL45uMoBo1guwmhiojcIyrekiWD6oVpQCInAy7fT1WbrP7UL/+1LE6AANRVtfp6xPKY0k61T0DXA/VS4sJgMIiakJcGnTzhwcJ1CiojS6MrzjQAZ5KRVkjL2nEyzvTwR9gwGyyIhUX0ZsBVrRk1qhoSFcwhan+ZeZghZEIVuBlguVsH67XEbf7GiFiNv7Huw1q/cxWEh9TGrhpdUAMXJanFNgpheqs/RlQC8KU8sB4WVC4H9DthdOUY3thKREaLDR7ekfsk5wihpSJcq5nZkVk2eywVFTtuxjnZmZ4Jcec/vlJTsts4dO2OWkzJOK0BsjUwszNv/7UsTfAAytYWlGGFTJc4+vPPYmQMwdGgABwGwYFABMRoVVvJvrQQgblImxlGR906KTjtkhMcHG/uTEO4dx0mZd2q555ltfHeMW+dOU6ur8G+Zbks1UScp2Xv5OuvvPTKmumvb2663fz3sd66qFtc87NBp8u+61+L9CBJNiNljTRTZnsC4LcxI1DtHqQ04DAuevZ84cdN3hWgLhQD6hZ2nEPjTOAy1ewW8vBBpClg92KvWVHOAmm3u9UfM108Hff/YNLNhBpN4uoi5A0UKEBi1y//tSxNuAChRJdYelCMFCDm+89I1UKxrxRloWoHIdLUgFiQiGZokgsGYaS8PEmSCJEfhA1GcTLiGzikaWF7FYYHW0t1VAAxiDLq0tZ9yXBk0LMPwQjLA9gG5j9vSMffGS30dtc0m5hQmx+25q99zFdDK76gE3ClUWS6SRpwTc71WYyiGsSYRg+TXFscbJyEuYDW67Z8uOBT+LYgWDAQ7ok9A6/VRLRTay13aIs0qyy3kmexSoj1KylPf79VU516r+iaXpt+vb3yr0bLKRbK7ERvf/+1LE6IALfL9vp5hQwYcoLTWGCThpxAfmb0WuU1AAJhCmZnd0rhKHTaMQzyxCvqE7RWi8CKYo+qhKpncc/2BuIaRt4secxGIoLzstsoYrkhlIZXarL2e06KRER0W8lqa7bJ2/3+6ovv6tVmTv0/b77M4cjsliAyWetvXVAEIKhTRf6q8hx8K06zTMg92eQ20efsqpVrJRrVV4E8CJdjJ2fT+0UtE+DvpX5mv0iRfPYUUFYfxQzv/Ip6MvrJ0rZbqrhBCnzgIF9b3ScY1jfWVGvv/7UsTngAw0vXenmFYRSovttPKlmAOKPua8ACs5eHAEzKKczO1GNR0CJXRjQIoshI48BEFZcLI3OlhToPwynKRPI7PZT7VQi0T7+5dooMrW0fRNFkVtOvva6OpyjczRyPvdQx4FNGl0Ab0k5Y2ttzS7/9rlAT9LZACBpmIvEtlWxIBVKFqJVQHk8PzJl8hh4lQD3CrEmk1OYiEQQMVs+8h+x+ePjMhdpZt7R3ZXh4IphlU4y9riZZfsXa/eytiNt9SEIIuRIC11ZHbuYADoCAq2//tSxOsADN1zceegUUF1Le149gkYQNWQ4gjMaypwq2X1Gk8FGYNOgnhYHRKOr4oUUTVfZiJzpY557dzBjs9Z6bfe7TMduAvLXdncuCjYKQICOgTCY1QQ5lWyFnnmv5O+NZy+vJwcZXBUu0MmN7u2QJ1cOp8/9xM3/1UEYIgMIsMnio8UsUkSCKBei3JBEXVfm3cYPGmmTTHYoI0Qg19lPX+eJGBVO3KVcZwz14cu8QoVKKKEyXnmprefS4sZN7Y1oomdaFUCVN9+5CMXRBiLlWj/+1LE5oAL2NFxx6BUwVMZrrzDCdjbIoFBzE31oUBCpM6la6xyNzF/gptBGG7PMZjeXgnSqBkQNjSI0J4gb1QuyGGDXkgHpQidanukwtUuNpxYk/XMno8EOyyc8fOihmAAtcpKi7kvGKuMIMs9X1UMdf1EcxoV7tQEECgkeqICn5MwBSyBMZC+QhXBT508Lt4ymGI3GrgG5f+4iWdfGijMlHw24hWf+j9LoG+eXVUAGauJWOyxxSq2jFz6TeSpLpKvj0JEEuKRuQ08UemguPUtb//7UsTqgAr0gWcsMMiBpo8spYYZUS7jOxesAARkIX9S4R+BmOJplg88UavEhEaLGaMdDbt6ts/oCvmXmGSd4JAc1H0ep7SguidPbFY+EPV37JUNzK/qLuza+9r/0PQxxWJSJUksUGLEI5q16U9ybN3u4wFBSU0NKV/HVQAwdRF99NgMJ2rZAi6ODCQ7I1i96MRgVbf1J9k01Cz4IpRgOEHLRDm3mD5n7qp9eWMnuoKebKh429zwo7mGvzHvaVSmUP1VvXKHjQEcHjkANKDMuwaD//tSxOeAC+yTYMwgcMFqEm689Il06ll0mSL6gAgvCxYzEkoN5QIcnT5aD8VVEeY3iSKSJDfTXVdDCz7/xBBawkgaWMRTiKNHu9pXsa39p36bjxSQ7PHKPLiKLZ45eEW+pPvV7+RnVVf7+50ZyO+6MyanO5LtfEJBFs6rc7hGXuYTcW0hKnqfj/v0PPd3QYoBEnZx6SaMmFyAMFFiVouW5iZMeBIIMhgl1p6MlRNJsVzsyB8ELsbZ6jCFZrwbjlLQ2UcWnl+c2bfHGLx6xJ147cH/+1LE6IALuIFazCRwwYGUrDGHrKiZXxXFXRN3dY3mvhMcW2380TUkyrqw5XCEK6pWn/sm/dXd10ftb5ZraV2YENWlR02JMBY82CpYGgRMxlZrIK8XKSkuHBNYHAoj0H9mqee5Ss6x/sL1Wp1NUZKNXrpo6HUNVIhFpuR6GCyFqFWMo4YVOtWxa6Th6RFCJ/RbPLDsJK78jRYasvSmxkryP7BEPQfEoAjjsQPXAQmXBpdNzQSk8xJfP7c/cnP3LsRyWpOzPiVK9U9j72gqMU76xP/7UsTnAAuIfWeHmXBBzKxt9PQKOaPcWIHV2MWxChEk9V6jeWkb5VCywraalMVK3mB2zXrAYAhiWSRjbhK2fhqMPxbmarpZPnBRKkbUqr48drX9zrYXm2CyrXVkGO7I9PmbddrQNGPwgOaHmihJ5712D2qaXqnHC7ISAzfk/rdHLfqToNY1lCoCABAAgYswLKHB8Z+8jwuzBcMwiGrD8YrX5hF426+RY+z519Jszq5ghPMntxQ3dXZb9CLubVQNDtlpfqeeVOFBYsYIjtlanNZ6//tQxN0ADtVle6S8XEE4Ea4hhhy4t9zea03L/2o5ZBmWkKMaNeEaaCtFNiEEMOQ8sy441mxFNYx1OROtrycDkobW0cPP08Qa43A3J10QRhrN8cJzb47omEIZlzh95UQgkw0vvFl8JxqchwAtS9ehSxZn+i/UR/z0xQBMNUIwM2d+E6igEticMsbYsZC2YWiCEpZFEsx0nU+GOCqkLHyebUOZE7eTorcPjifr5EOA+cxSYbq4Mlv9ldrfzuF8YWy9qMwffNdtqUcMghWlqqSMiv/7UsTYAAsIj3EsJOvBS5HudYYc+J6lgJwgDnspkdI5321oIn0NTba0870w3Xw1MLgYLo4aIpyQguLIVEYkUElpBjiNcSXMSlfS3lkP24PBGsQbnk73MxjAk2r58mRsV2oMfP1dXyrMMZf+DUu3KUHcXZQYMrcfalyRyhwnDN5l0WURel4c2JKlwiB4u6AegqoDhYCEpHLh9GMCfuTLJYjlZTHUCfNAiuHXnSfB6So4i5AhHayVUzdr3NfApns/y9S1rlpjGM3O4SAa1T92k2qw//tSxOAACvytaSwY8MFTEe1Zhhz4MPteLyoPi1irSprdmSBOQ6G5OKPeQakzF1MqQgUOnVtJKB4AARavbimoPUVnZ/KjURSG8Bk4eHjh8WuKoHe9v2X/pyMziRh40UnMboFL/XUy8e3Z8W2nhaK+ru5pGJWo/uBhMLDCiBofCI6l4nkFvN0fg4J2uXWhBQ2cxp85OC8GoACAQCpUsKgCMhI4kPZjCmVzFnDPVwmbo0smqPvAkWd5giCcoMeScyY9u3y/7OgwnfH6xkpHwv/M6Zn/+1LE54ANrKtgLL2FwZQXb6TDIiaVb7VMVSCQ9mIuZMRwnUgzlJ9v//ymdRHa1pW2u8nOx/uyrmWg3QzD1ZlpBJpW612tCN6jKRulnDRgIsADOC6UqY5kGooP47jm6JKM2LbwcnwnbB2ldRGHlS/DVf7UPSvN8UQZMdLGLSxap38O2tnoVoPZaOdqXremlJx7ysA1L2kQyHnMs+JvPd8rS8NCAUBwNIhuLVMHBNUC22XOqOxpPDwUQWKwSBUJolFUdlBIiL0JWZh1cRvKXqJko//7UsTcAAw4u21HrQvBeJctJYYguNdd+6PrDJjcLG/tu/6rshuEsln1pKHkasoTdBYWai9i0PutvV7V9Oy9FtuqzesuctHPLlwbmCCgCAAlEqExksRi8FpiulLV/qQDJxSck90NmSmfXUMXVakfXxMrH6qWcw077Q0v+q1JrfWuHfqcMn4/CRkjBKeKviK+llOjKfzrrLeK+WnSqkurBkYeEsFKlQSAAABKSkFHiQRE4ZOcKXJ4iXa5K8nz5E2JfIwiTDWHc8nGs3k05ytXEdxz//tSxNoADrWNa0eM1cl6lG0lhixg5hSU6979lLzh7r93+IRA+2feBBtiVd5/WyLgn6Gkdl61AENB5bGNvTenqR/uCar1aZbHYqzncBZ0NXCSZDpeIUREdGND4AVZocK4dzKm4rt5kRkeaizubjWhi9bdC0QP45BGvvjv1c8c3ZYLrPEb8pdKijalPQRIseAl3qUtHcxX+lUAVsONUDFCUCXyWgsC/y93JWFbTCYYpEFc4MZN1AMXhQbWygMYoyy/na6dVMepG/aQhFCJs4/msVT/+1LEzYALUI15phmRYV8RrF2GIPDaGphwiBYbMLFTqYttZ1afMsPXuc1ytHaY6sAAJKSGSZdgWUp0+ahJ2FAmlkivrNSQPLT59ByO3wPtvPLkaqCmA3RjIwZvWLFOrm332CiiOmhl5fv0u/t2/9NGZFTI9URlNFgNyOJwx9TtLnXKSgABgABSSUIeM1TpetQSKOWvpKxysCgIKmx6jkTpakJj4oJK6MnjsAqBNKZHnDzhgzWZ+XnvgwFzjBRUPKZv706Pb3ZfpdYA9eqQqmRQBv/7UsTSAAsgj2FMPSNBVRTuZPShJn/uX3y5pMAAUqvkqnSfoKvNA1lq2P6IAdMF8+CYpNlLDJGUMnROSMAmRliogdrGsJqTYeSL3LYXDNY0jNrpO1dKrknI7lUvUFWmSxKsiixd7NYxBy7161zd6n/fqG29Gsq06jeN4j2cPlo+j1dZjJ6pkk6xTwRsI8UivkiAUErRGtq5RAvmoLGTRG0UPPMTUOyXURihvFXumQJzk5zWT6VQXR4IcbN6DdNQ325tSjiUoGGSa4vaR9pt6V6q//tSxNiCCmCNWkywbwFOoiwdhgi4W03pa79wStfHsr6Oy53ICdFcr/17Mvebm2YrnBkk3k+u8OAFCw65Q10Ks9hQ+UAJkZcprcXojnv9dAFIRSgAEaRLJ8mnR7j+OUyIinfQ1UwzpAIAhXQhTJTutT48nK4Uua9HvtMrBQhzW8+LPurVM3mokM69FqbFvnR9PG2/VW2HVf5km3kUVgEQSA6q7/rFRTZ6/cFqhlsXgWleWYdl8VY9UGb2tWcOZaZikwCue4wilO9wKf+2rQlsYnz/+1LE4wLKhI9jTCRpQm4zLGGGJRHbtDG5Cvc4Qw02WnJp4v087b+phhpogv+cErk7EeQBAhp6oApJPoLBp1qFi0FxaVOhOaYMk+qguPClVDpGvdX/BWssgerdN2vPJ1Ws/OzxX/dOZpbunsDsJ7LL+cgWOFy/8q9a0HUer1HtBnB1tkcqvQoQBOEOutzWJDqoEbxy32HlzTqzMonbMghki4ROJ8O/XYp89+gA320ti2dY1J8b8g4/4csVKVFZWwg0nyfxgiTf4zdSk83//Huiof/7UsTJAAqEvWgHsEnBO5at9PMJaKp9CXXXdbYYcEVbTLcnDpJyI6PUYj5uOcnMzayzJx49XjJPk6qJe7WMjaXKs2kAJ85x2LSY54b/+CW+9Rls5l4YXftL+4Uz9X/4IBZ92s3tV2/o7V/+SzuxuLL97WoeYFlh0kfkJkSLHH2/+JoGCFBYk07hOtjeC1lIYaAVgj0Q239VArTyMIIu8FuxBi7w9fXxnPwctsttpG2ycI7TVC+M6FdS8r59pI9nzSQCw+/vv0DIi0XL/cd//+3///tSxNWDCiiPYCwkbwFMleuBhhXoRv/8rg0NQjkPf1/sOjUy9caiEWk0nKd6DO8gKab3eD5qmEMTra2rFyHF50k6q3Gt9X4gn5ItREyMJmVr7UFS7q6exi02/95BgM3P/W7/UDL0f/2r+/5Wf+jL9z/1KazLYqP6jX1CxwI4Qi5pRuUoA1QAglEpzRICwORedDi4SFqwrl1faxIof6YsmnTpve3tidBzkJ3sIIoGcdlft6nO6CAx3ZeRk5EZTvojftJkb/zvXt+xCUCCBBkBXNr/+1LE4QAKBK1gzCSvQZqrrbT0ie0xpqn8+h9rAAfgoAOwEQAAPGdgAf3vh0ZODxAhLEE+32gGdgmB4DponclrKn9XrYmbcAq2wK4zXpdIN1t37OcqfaMrQafKZ29Zv27oFQJciXlHyZdbsVWu8WRLRdkY1Vbso+idGMmVEpVkWc89vMpNf9t4wFWZrIfDQrMYKBCqyQJb4mq9dEx9Qd7lXn6LuZz++TUq9tUAJABJGFL+clGRl2LsJULhvQn+PKjp09tCT333JZndox19gxgLDf/7UsTjgQwFW2NHqFpBd6ktaPWV+q809HosEHaHPl7vAtkThj5wLBi5sqkzYn7fPbRiEeebpue7oQt8j7oAAAUjGdnD6ouNdZvoeOjhjDEPQMtRnyiEelKpUSG0PxPUod/2aZxAxHmsN1bntmXG/LN81I5//LSWMot1Xcx+hJRoqisYKxzEadX+zVrd8qoAGAAACCvo1yPuy0J0wJdXbqw++V2QxIM/GoWI0CKhp2NoyuQEjfktYYiwi09nXcqiz9Kl4HbCqe7CH2/nRjikBtLY//tSxOKADIkXbUYYTRn5oqvBhI8ZGWuTd6X/q0I34MLZQYNwDJKGwz9pL8eQEXm2Ij9zJkYD9ie0J+RM0hgL72kMdq52p/HemQDDs+/qsn4+QVgTIIEBwUfTzKVmIPPFM5SbGMS2Kw4UeHxg4Hx9FDjqKiDogARSkkAZ2dAGmTcvD0vaQN1UKhrUNR+5cBQJzmwYlMtCNrN4ldnunHM/XQAOyjf/jiM+8ugc/6VzFWZWslW+n0GXSmShj4X+FpGmbp8uRAyD2LIh0wVdLTbim2j/+1LEzwIJuH1pDDBpwUKV7OWEjdimQY7nqSSC4UiUGk24LAxtZ6Iwxdnaf92Ev/L0ojGtMRSTVZDiSrzwvvjpuf/OYRHi/9BeVRWKHnhKezUbFDv6Go1LdTvu6kTFnO+PXXCr4UJhGls9UwM+d5fkCCjjw2QJvn9i7q4EgYCTjoGYkr8ez48VYSBJM7Sro52uYkk81FBKDvJQSfVmPl8168kbZXRln79l5rFV9DOG+lSEXTcM9/pevoZWf4kUVXIBKaC0nMSJws9y0sYz1VDWt//7UsTdgon0p2UMJE9BQo3tXYek2DptzVZR2kMKUFoJFpomBrnOlzvHo0tlyHGqk8iZV6wvhQbXY5+exu+AmMcpDS7hi34RkrLIKZ2u5HDiGRXZFD5aq5iGIx9aHejeRPU6TJY9mNX6usn0+7XM7L6UV9u/tICO4poI93pqAGFkJkjiZhanPCpY3eE3UKQoBebeijtKQUbbVFyBRUmEAEBcmMBh0UzakZ2YNZNKiTXF4GstzqLxKDEMYXcYpxo8RDAbiQSuLig0XFRYKWaI4p/T//tSxOsADGD9bUekb0GDG+708x3ipotwXe7yL+QZZbKLjFrP3Tq97LPuXFyT8UEEfMUZNkFtwNM0IM4qHsc4xXF7IM04SnrSKv3rirRboyBdlCQgMpjgVZbYSPQ2ADXQwGS47EUGtTV3c5imFtRyMXkRy5UEn/v3zW0vV5KmdVdnXdg0qk9/8pFM6bp//3d8pdPptt7Z658rIgskuG7SmfSMDNwyADVBZCqgEXWG3EyJ2yoYcyJ6y+s5dxpWC7X8RYaBQBRYlEJnL4Wdj9eTfkr/+1LE5wALiN1q56RNgYQrrjTzCazcLjkQq0zz2r/qqMdNXT/XSxKQT/+LVvAPcLimy62LIH67J7LJMPGQF61bCWHMlg/y4CYm1KbkxQELCUGihl4F1fM4+jEjSkDG2kI29Fr1+jmBTPqJwS3VNWGXJ1uaFDW7+vCcNMXa5gQedKytckddKytHTtoEBQtktszZC0QqScnmS0bbpNvFScQsDegmkuSUybzWrBI7SQqLoqsjKhYuZJXwoilUy8QkQ+Wof7jQmERXQuw7f/Xs/GC6Qf/7UsTmABHJoWpMJQnBVizu5PMU2B2V5lSw+fHOap57uACHCkqEtQfqSbBIEQX0UiApYjplNh9wYvkIkMbf52aGHSBkl1C2htnkSfLyHJ7qUhJinEAY05wdet6WtaZN/anikTP4wDu9f7PSo+bIWNO1AyoAE0EBVsQumU+WnOhIyy8NvFEYu+yqTsTAD0qOEYmns38cT8o3WrFZYg+HQQM7Bei5w/61L+sYKtwSATyn6+drU/6IBkyHA+10NKGopesspAYqTZeyGiAdQImKrkrA//tSxNIACgzpdYeM74FAku6w9IkYUYSMm1N7WAAAxh+ifABUS3YmEh2fVVeHJPBsLQt6O2tLgYd0KOhSVH3y1A/E1iFSF6i/PoECemNZdUxIauYSLPQ2IQuahcSnbvP3ouEhIxpT0ZZ0XBw6GtrtQQCD3FlT6jbHeqoIB1NFIIpFKB0IeSlTNprG63Hg4sqiGmMzaN3uEp585turt7m2Ai2kDjrHWmVOrKVZvyVvKcjLvsk4vXMRRCsrNpNX9tO9nRn1a21d/1t60YqAwzvtYuv/+1LE34AKWG9vh6xrAUkRraj0iaBSFiJIoAEKQCSaTgAKBSp4cyLVYGJXl+iJ9GEBZdINjdkKrds0IRuWts3Ax9UDDtftGkzlakI7+VM43IJqXzR9Q4g81LwYd4IFMPxZeuy9Ynsuuvecc1hhBiWhU+UvQlDXAmf1SaoNF5ONJyttug6nMxpHtEHtR5ojP0N3EVWA4gRugZCty8kYx25zecJnhXnWhicjyzEGXW5yp3mSXcj30BkZK3fMs80wYYql+6+lPWFsljKdzJzOnTiH8f/7UsTrAAycuWMsMG0BdZGryYYVqNq/Lmj0AoRzKQvf4UQjBmiqPnADWAaFXBmKI7hXADgXhXLx+PAgIRBGAdKZQ2vjyenCh3OVpYHcVHljB5TSoicpwocfW4yWOXWopi9y2dCFxSprxT/brYKrCofBfFCsiJSg4w9Y2gIggARVkr2cKrl4jPVM0R2EnzKBEI+IcNToamRSSp+RrgFd42QgjMdvS42Xu5x3yq9xUmyhQsxwQSBp0qiKqoDob1wFKpYlGl7RV491ZVaXXFKR9FCR//tSxOeAC3U9a6eMVKGElyxo9g2YQWStCw0qHc7UQESDI6m0iFSWwG0doSBnMqcipRjqQ0wv3aTRmDbD1IGn8+w+w0Yp7nFmu27oXn9C+sswzxtvqzE67tRGfb9imkPm/9O39fkSjO/Z27UaUbPo7FuwJbBcne8squpGFnFUSJj5WA+pRGYJIRCAKjLRDV8tI4hynRMjO9+P6xlifvLslrPZlCC4GL7ol6V8f5GrGWb11Zv/h81b7Wcu9L2b//GBoW9ZsOEywCPWrTe8xuLv+5P/+1LE5wANEY11pghvKUwLrSTzDRhodzMtMN7VgRIiUmkS4LvQ0SAB+KJSoomahZVMbMepi1mwE+3nEDyaftZTNjBiigaNym6scIWmr3U5CgAp7fqp9y2cy2Rter82y3s3Wt2SXVq73M3o7PHYlKMMWNPIug2ehFdBE8vJVUAB2YEgmoncPxVHoX4aOS5SAgNAyJgPpYnkfWEJXY50noqmvJDCNMTnOz43a2rdjK83CiDt/oglnZKnOFN0ZKhJIxiq0XD5h5ZC6WiwwJiUGYyRBv/7UsTnAAvceWMsPMVBba1ttPYI/GofJxW5DV/sAMAm5JMu6IrnY8jJMBiaUpyXLCzRB0YJWbu7bRVHQQlggmjvBCHSZRbXaZgRC3mgnKnVr73iXYExddIZzu+ktWIUtRDMQp7ybxz3k/pbE2ajHDzhydB4o5UgXIyN+eIqAACQBuNuYcrCcJKQBbHAtPB8vE0zJxLPES/iHkQq9fTebPKoZvudL+Zf5tN3cudyM+12/8v0VlGHIsMBuqLq6yY0mh+xP20+HxyCI8uORqJjEJET//tSxOeAC8TdWkw8aYGAJixo8wncTwJCB4mJOcP0MeNfggJx7zhpphp6ptEVMFCULy/UGTMItNbKJRaLyCD2cpzmJkA3BhAPMSgum48yQQJEeo5hOTE2px5m6RkbF4diS6FNBRLl8vDiPjmHktBuXzU3l8vj3JYyTmSvu7JpmhgaGKnQkqZ61asmD0KBcLjF9zQyRPM51bl2v73m9zRaaze7rnlGR9SaC9X/3oJ71JIJpuhdNBbz6sjNzSICAAQ7TbMKFMO9DG2KvHU9UzRKqXv/+1LE5gALgLlnp6RH4X2b652HiOAUUYhZE3mkMqHxvtIzcleMY7xWw+eXuqzFYnelRN+QQl4XTQrcQlr3pf6Zggqt297F9Y6cXApR7zLV4qEQjpCAEKEGiWxVqsS4+WEVMBI+BpywmqCyxCRY/lR/Mbo2qH8qiBgKzojrWLm0EBthUOOFyKUnGlUOR65hKz5lO3dp9+yO6BWhMwotbMsvsYkAAgRBBq1mhwk3mQp5j0FhgdFuokmuQnFlrQVLo48K65GvjjBZECFdzgg6FO+kzP/7UsTmAAv8jV9U8wACaDEtZzDQAQzkd3o7g3rohWpYkbwrNwdNiG3cZTXNa0fX1uV63btLbKEZ2x+3iiEACcE4E8GOH0ElDcMMt7gX8pqKinYX2KVOHNPVSCXpJcJslRa4MGwORlweHBQhcKtefHXOWmcbcK9l4YMbtBNgqLILGVJX0RQGi/qTTXPpW+9wt1IBfp0UUSjCdJBJH+jB4HcX26GqhPqttfpveVJEmmXFHIw4vpIuxV68xmYD2nkQiv0b3VptpnrZF2U/ZutXZlRo//tSxMcASpB/cNzzAAE6Di3U9JTwymFgiWRZPwU4ddWS0VO0iXShjyaRaMbL/SwBAAAkOVR8UDHXw+hQowrY4z+BAJYXmxBFUBZXpDvFfXhgVccl5W1tDg0s7x3S9LiIalVYpXHEfEkw1kpKqP16NaQe6Q9elQFQESDPve3sttr1W9nJtMrQ0Bo+vpoQAAlWFhPEnJF2HR1BGgrNDYNkQ/LQ8dP1TsHM7iyxpWpyIaxxnAwsQaQDOlnYxDJZMS53o+lenOjaBn+UY9RwJNd9hKr/+1LE04IKxM9pDDBFwVIKbRjzCki33yI+13Z0kFJqoAShSSIKKRKobnwlhcHwJieIZ0I4yMikquU6tLoF0VLU6o9s2UXcOqxXwKTZ0u9zvmcRIKWNc7AyybJS4c1406wtV56//Fnvevv8tew9Qr9Lkwv/xZaSTeEVVxEGYgRnEvQKeOs4komPg/JlZo0ct/p54X7RTi2lWr3feYkNzttwRMQ8+O7FkazFOspGsznRmctqc/gn3Id2o29NEotFftbp9lfMzdv98mlnMMYiUYEq4f/7UsTcAAtA3XNHmE8hchZsmYYVOBzv8lT8w/sMLAAC2IpL9Ve/KXq+OJDQ5Aw2Nis5YVuJmF5KqJs1UsJr3IyO+fCjcOP3q0wItKVty6M6FjK62fqsjPpqjbFRUTRlGhCZrgdx96m9yOq8GTdgDaNaEVLCI8DmmWnxmboA8EDKAAYtAAKKSSgxztDJHKoReMB6vkPVDo43F6NrmoaS9mdtpK+4D9mEGE2W+FrRmshq03ervKlBNJEJSVcV7uNYtailGr7f+hS/QsUSGDldLiyS//tSxN6ACfivaMwwRcFEkC50wxXUSsJIK332RS2RyYnJCzyN8vZWEsQidGMZfZU3a71Mqmqrxa75SUMvZaefIJhzZmAzLsSUx2fIR0olHR0b91XsZurHch7eqG6PMlUmC3HmDaHmliFhRisYGnhY6F3LxcJFgNrC0BSfbQADIWg1MlxtJ4mU5CXhdkCa79jPQVGjgAiVgMgkpoMWdHtL0eYlpcPerAZX4tKKJm3MyJF075JhzgCpWZvLAJTKDKVDg64cqW09jH5ekitCSJ3bVLv/+1LE7AAM+W9xR5hPaYuZ7JmGFTiWQEQlEZJYjMWVApNqNurpHHs0CoVB8oLBcSgDGrgnKqB6eISBhbC1qLAw0cyL+wYeSicaNK84q7MalnSYR0+MeIlIaGOIOickw3oCoiFzZ5Ps/fu1Pvp8dmUSsyzQAwCACU6bGLnEcxnAiMjkLwPDiD4sEMNCaVAzuekw5l8ULZy+8sqBpYHB+o8481TFSaKLiYU4rogy+r34+VfWeFsCH7+jhytazT38spbJqG78dv9v9Hc/SDluXz9S0v/7UsTkgApsk22npKzBkR5vNPMKHPk5vz//4+//rVAAEypQMoukFlKtUFZ0xKNvqu2BIErv5KwFlyGBoYGHkfYQXiiVRxBZVPm1FnP1NcPmS9zJsFN630dStVJmVWQ17rXTrLvlT/9HX/7f2aVUFFLKx57Wb4bXOjFVAQyQBNxO4UuvBVNJUYE4QU8OhCNL2TNXMpwUdOfOWYC1iNG+Qbu6AFNVprPvRHb2h89KaGvkgO1IBLn2peGDg28SLBVVrVnX6ObXlHd8H0pYRLqEinm0//tSxOaAC+STc+ekaWFPEu9www3mRPYo2GUqu/SEAEwowvgGMT5TflMNxPGALLBAXF4Au1jUiajjHmvC1WMhiayBxplbQ5+c6mkvyJ0r1d0Id21XRj9JGP7e3yX3U58/JfsujZLHOLOQkxAGLj4vEChgxwJ3f3dSFgBNLGMwhvs5cmhGSRIGJ5YUR9l+8cGF+/rb99Q/uaiBNHJBn/gjqGT33OkCmI/BRA2QElzvroyQUAgGLnBBMgdPYrtChiaPUGI9IGN39G3uWmjliN8Lm2j/+1LE6wIM5GNc7DEFiW0ma92ECbjMQEABIs9zvoT7yUDevQ4vgGden59NBwCgZ9ZHbvELpnadd0+nKBj5uHFyg8GXVAFQJUDnPqIpllrbBJQdK7NGuiTLeHhnjzX4OmtXJjls70U2iN0Ss5UKn7rVzgHBUskDZKVQIm+YrMIcL2PNr90NJ9P3yeVT0uVA63nKAR81kbkIRRYUgFFFSH88SEzWhjS+VD58z6WJ22NrILmjFW5AaPZFBpVvskFxV2MNXm9LTf6YLhI5lMs1p2/3SP/7UsTngAvkfWFMPMOBaiVr1YSJaFphC0Kozc80qh+n1ITVWZ9/FVAEhKMgWFFEaEIINhDSHZfFzQ80PLPBIytIZi0Sw/g+7jdQVQS/EGzZhlD1sh/q10ulreaSgpOVD1oK2jO3YPY1USrTdxZ7Vm3UpXeFHkq3Gdll9QQ9QAihgg4tF9mzvg/6U9DH9y+7EnbpRqygVCKLY5nTyG9u+RpxYP8fUO0ORdyZFOnrSdPozgYEKYnPf1MU1iIHTAn0BOZSeM3Nusagbe56E6+pm9y0//tSxOiAEKmXasekc8E9Eq6k8yj4VNA1odzJ6y5YkVljgtpRxld5nMQbenfVv3lfGIjLDBAKimXbirKCn9cClMSPqGUQwMl+o+uV/G1MXr+kONp3IASBilmYGUndV998xX/dPHbeban6fe9dLhVY9q+eYOQ5Tb+jSgN3dWhlSt6xuY0UGxHqhpJC3Gufz6ZIyR2dFRlsQMBP2Y9b84kGe8y17zsVx91Uv6dnX9Qa1quz2s2MUxorzrFXmUqMrNF3KU/ETxM+mmNXUrXPRIGRi0n/+1LE3AAKVJd3p6DxAUsS7fGEqPiHMVSG0WxF9HoSAWknISmQ3Jyo5k7svO1p5X0eYczgfGlRZpiCiuuDswWuXLDzc0XKZo7aQE6IoI9SVKUMZRU18df34VvxP3dKZyatd3f93+2gey1e6V/TLo3u+9m92S6RUmKW74FW+Zje6aN9zbpWr0EUAImxoE6BaFU4CzULgdiy1vzYYzyhnXiVbn/UiPVLZcgbWk60+fk869QON7hrH76u5iLv+BHXazjaKz/+sELvO5rO09P14/TqUP/7UsTnAAvUuWssGU1BbBuusYShJBo6pOhcgOi4alrDlDZk8cdLIOG3CtzDClrBUqAgplJ4SRsQkIOSBPq88GlsQbApayOoLu7eKRAtJiLkT8U2WHam9qvN80/kWCWbpWuVXNiObsqasBAPoqUNJX+O/lhw9dBOvI+Cq1VJ3qqOPLdqXQNYweDQpcHwQvHCleeYqkHqY4BY4mk6QosLETxqGuPtKmImT7sbqH4Wtu3sN3fpyTGPxDebO1XvntPHlRB25e80Gpu+7W2dWfazaP27//tSxOgADDylfeeZbuGSq241hgj59vUVU7Z3KmOmqu1BpXel+avUEXPdKIKfNi3xYWYpEyhp1zni9JhugbcEJVftAVVVhoQ7XrZbzvm0dpgFcRuK5n6qpVno5k2llGHlVRp2K+ITTIVmhimAPNky+/4I+ISZlT5e09zGhjgz5eRRHcxu1oyygHIul0IewrMAg8Sv+g+TsoIl34TezTizARZ5nReuhAChmkMaZ0ZYTAkrlKNZhPldrxAAtTxSt6ivdPsr98yqC7S64M0eWFYmKi//+1LE4oAMyPl1J6xxsZEXbWj1oiB6zQfL5ek2DarKg1YueZ/GxtXMeu1tlZkBS8DzMTBpdyicRRZXq8W02FySFLdDInDAwNirVU6/bqABcChAaSklw/AI5JQnXAxk6m0ynWApQioiMEOu0JB9t4rf1bNPTrk8WK4CovivxsiuavdWjCL6FkwutnMd2U62mO62d881PeZmv0sgyEb2iybkIUh7Y4ss85XKmJPa1SRb1Rl24llBxpQkOFU7ECSSFIqGn0dIH8J4jw4wDxJUGGdr2v/7UsTbAA1g93OnsE/hixdvfPQZ9FiNArPLdQgHv6yrz2T/8u1IBIZyQMcCmF1iQtCL7r5/wv6DXQsu/rEti/Uip4eZqYtxyqD4CcjzJpx3vFhm36qhGxsMClHQwkKPjBfT3Hg43NEZI8sM1D8dbwok3vv8sGDOHXsMdheGUs9Nkl9K4RTMnU9Iq53+Zletdy0L9nyp/+lWptyOV6o1WT2t1cxkFqE6kFjoug8j00IIAQEGknLgMwNFcAJ52moSI8DeUpq9+VVTapPKApvCUyd7//tSxNIADJCXXky9ZcGJn2009gk4W4Jx2ewaQPvrSv+utlAuMRp1WoY52Ru5wdzNkoDtT8EkHW1tN7Fg2pLdX2AmDSUqcrSh7/Jekwss0A0KiTDJGzIDVU1WunQChgFGP8iUIfvMLw9LpC2WZlWk/ZtGDcR8SSTMra41Jc3KY2pCKGGPtKT82Oz/vLtOsWaGFGnrlrAz4s9/Z///o/N1ACEACqfKt1xOEkfedt8XJgeJyipTsjnLN2r+bn5lo2mtpsCu33mNlpbt3qd295CJbTX/+1LEzIALuM1zJ6Rr8XOlbmT2CX5GkhR4XSl1Y+5QQImM+vSlt2Qrejh/o6r+UieD/Bzc7pBCMvqJLcERsQIl9Brwd1CpIEOBHHQRhLqwdliEGEOLL0woLYjvXjBQ7Ec0bQslW10UjAlZWK9IiM2TkLOhHAxNtL4xTWjjlrXheQChBaHh4gTLgAcCBcw4q1kNqIOuizMD6/s1aU3GruimC+oUGX9nRWnME6wrKmiswtul+KzCStrWHlxgwu24W1rLnDG7UodkVOyyozrTS5mV9//7UsTNAAsQp2NHpE2BS5LqwaelKKvbdvoz7WWSlivO6WdBrA2/KKE9E3h52UQgaDGfbthjUCS25ZNLkmmw05QG8I8jrGYOFi7o5YSBh7ULI45Wwc+CQTFCyDjh/a3sVZNVL/0p0HoEKQe1MedvF/m34bUEQpbBpnf80u9i53WeeVsMn531X0XPAAGT6AGJEPE6wjCuaRZrktIgL1QhuqUTFGSt78eNUin8G+NR34SzQUr3qdTQxQqPQm3hE87kat79M6ulvySv11qqsWjzxRuK//tSxNUBClCVYywYsMGWEuwVhg042POkvfYCSy4mY9ZG1BzlIrCbnMSZLrDIdzmtLolK2rYTbL1mckio9BNmYdBTVcL4pv/PUY5IXVFoRGWqtMbNc6BitdpPoiN1o8rJuipWtT2l9zae1d1/md/L//S8o1xax700XRwAKAIEMRqAJhChRQCBllg30YE50ATsEJGRIckDTkhUwq0YigASNlnuRMtQOJaXdD2OmMw0Gq5G5r8t6swUGOtrU6BUY3Ew+moihD8Hf7EDwQ0SpG32zsn/+1LE1wAK1QdmDDBHgU2O7nTDIZhzrPQCAIQYsznCErDkKUwxhrlsLUGX28Tdkem0A7DdzyUsSHZNYDmqSDZYsMdRG1EBx0tOXiOBdOvK/31/js9dnawz0jG97UCwyG0rAQo8a2kCT6Vt2GSV1VjG6Ol1LHf/7V1ty0WWzTWybkgZg2AeIIMRKL5BKgZGeFOqqxRpI43VH+w2RZi6LZUz77b4mP3ykwdQg3Vtli5rZeSNDHFP1GwwVqUKULcegZ5Fis00nBR5Y4FygMgqeDk6VP/7UMTgAAmkb2cnsGfBfyttNPMWIDTbt8K+RTyQDxiwhFlPEANg6SCuJqHMiC/M54SNgFH0ArNbAPbk6UWZrlQ5ipKXYUhRyshboRGie/WE0+iwZfabnyDEuVWzL9F9W33tKikbzoimq1EPXUK55Xv0xGKmw8pHpX+tTJsFLLMibUpGmg0Cxmsyk7jHKik6p7m5PAUrx9B9MSolj5y7qiYuFU5mRGpBacK8931Dq5n/4pg5cFAyVY8w000VYbugi1DGI2LVfG8WD8uEbC7rAAv/+1LE5wALRJlYzKStQX4S6pWGGZA4HxAUCG31MpCAAAAUo/GmPsE4IEbgKUTdLzEPSaHk+IQ0N7JhkOTJNIyIP8AodqOxiqxO+j7z0MuOr9Klv8vd33Ld30V5yA8nghDIp/3PRS47gwsRPf5irinFBeEebFDKxc9CjHPPebcyUr5v4mCBROIhESvc2w4MFCxHWCjH0Sg7HsKBwZJbAslDBiNrWyQQgUYAUAQ4Xzw2ShwMiE/EHTBk+V5rEphuqme2MKMQmdiugF5m/qUhjXuP+//7UsToAAwUmW2mDLghdKVsKPSJPJTemhPml9RvKtE9azU98a1VdfdfNxxPP30NoaTqSMiCpGdRMrBJUecYa40PSwW2XRKzini9EapELCRU3E5Fw0YEjUwsgApF8tiSLoQ4VNFM9Fpy8HKtfGoUaNrH1GWbvCHLlcOSKgIa6GGBYymVdKsqVYsWA9NwhGoQ77prXjWMksFHLIZUXnmm6VqlloVrdX71SdtDTXf0tUJwCl1OApoJSQdC1dcqRhBRO5HdlXalVUCOPFNt4c1IjjBd//tSxOcAC9CXZaeYbyIaMmtc8yIRCWT4f94Vtv64ZRJNxBZnK8eCDx7xcj7UJ7LiNt35KdvFiLLe7F459qlsQAUIgNgZYBQcHxEfE0wWcI7JnU52VqcLtI6EKqppsWHy8jygurksl5xp8Nm0HZXNHKFtuup23Nf1NVre1g0JhrCW9RLPNM2182o81yqI85Wk1EpEwOZDwloVRiG+8L6IojqlFejglfcle1+0Y/rYdove6nCTsHXZdS1os822yOslYJ+BLxtYBh3dyK0Nb/0sUdn/+1LE0oANgZ9npgUTiUoJrLD2CLBWrQRAp5CI87tUlEBdYaFl4IfUcWFTDXaDBq7aRYam3z0pWtndG1FEnAgJiPTyI7sGwdZ2rhinTGX74UacDnr6KzsDYkdceGCMPsxz3UGIUphIcE2h2ySpNXMV6MzV//0VAAhCABaSibi8QFyEkDmL+bijUB3Ik/YoQqIWLw4qBekyPszN9Wvcn+JusIB77BgRVnd6vU72uRzORirTI2dcjIqsh9tO7JQja2336kpVjLRX9oxM+fQwEFvfev/7UsTRAAnQn2eGGGzBRpLsJJEOwHN2lB6f9iYWAQj0gIhWFwBREAJOFAUD9Hq9yikHSrqirltGjCVMEu+EMgY8MjzOXREUg53naRppaVy7XnHIrO03fzvac79UZ2yLXZPOr/U7v6EneroEOCAooECCGGrgTB9YP//puUOwEEaazcLYcjAJhQk5uwDrHWzvz5keUViHzuLGOAAAYvL/YsnVkCD2en3ommxAsnsZEe/dk0gGtyZPSAGFzSie8wYTBAEBQSOSIGFyRhdG3NcLk7lB//tSxN6ACnCVX0ewR8FHj+oFhI3gQwmbqGIFPBAgYhijEE0CgIChQV7HYo96MUMIOoSISfYtm2zorNpHlURBBmoqOI0b5EEEaS4YZfRIZE5vWEEIKYuujYvfNHNRhuUOu3RGUSAyIJMAk03vRwh1yn2ai7TeRqVOg/sjgyLP1IG2kUsm7Gy0E1gycaMKA+murKmSyNIYgDJOtpWLdy/UMCLk8YvSwZSFIqHU9UqIsUxfcxbmuXIRrOB0MK0WbR2kSs7YXlYSmbSBEkXrUs371Rn/+1LE6YAMYR9Zp6SvAXclKxjxijiIS6MUaMunwoGE0dc08fT4HVEms/R+8tGXIgnDAbWk2FJ1/S4CASZhKoDErCDnw1txOFMvtGwyWTNaBGMoNjFRvvxddfGK79bqqR25lW88b9vTaktT/ZqsOhIVrWkfDpKtLxkCy1JprmINGwC34jpIi6Xk9qpVg9ThQ93LFqK3u1AGqIwDOBhZiwlzOE+2iY72GAlrsri2J3e0fpOe6xuUdUo5nj1DVFMYiq2qHJTLud60qBOLLqPDWLMQaf/7UsTnABSBmWUnmTGKSCytQYSaaFHP7Ki2OSTX6GPFRUSUiMy9F1pLuTQozXJKBAbqUnSIESMyHAuhblak3sU7VVDUSXaLtSrnu0RoMF/5UPhv2d4Gxvcw5t8KF113ssxTO2irUCUb/ampxpchPdCuqpz0ZYbvX4vPrVU08devT9FhZyeVpDCksklUKORtLtheycJUmLmq1e0vYKyn7QyxdqXVILySBGcLStmM9brrsA7REkqEznVXVZv9dwUF1zDJ60FyguuEBamZWbbq/37k//tSxKoAC5Sjcwelq8FTEy4g8yoYqQ96mmtfAQ46tm/pAOADM5QwQUQHkrRRqhYBEZUBQVmyrGnBXi6byizdrtmEw+1rPSUQMnYu8lZbpur35V5b8+/cjH2mCTDqiOhAEQPqF1Wv6dYNlqj6+NrYz0fRGepMHm1pCONEtj+Pg/j2OZ+iLD+YDj7Kh8GEpXGYD5AIo55xlQbHKwK+Ii1Racio2fWeOkqIaoWQODX+0c/HRZeeNm1s3cXzrGKau1DcUYXDYWXGMawD99kBQMABAIT/+1LErwAK+L13h41UoVkTLzDxnswFVc/L6OIVhbtLHRgtFK2+LZp6H8Lh5IaP9lkUwRPBo02U2QGN3yDX2nwvHqbiVJdtZSOeAYYLihJr5Bj3dL9FXAP/Xx6NGv2M2OVu1c4AgUAkVQKUSHuJouqt4eR9MRNHW7JScSPLs4+Knv0pc7zzMlBLNOHBdX1Urx+qszoZjNQrVLQBfWcWLoCBLCBF5CNEl1TCzQ5UioWixu9zeqneQEEsBxFM0vi67vLTwIVwMRjQJCI5WqGrDnH7fP/7UsS2AApgm2gHpSlBW5ZvNPEh3LWTiNKdT4qzTKgUFppvNu1E7/fHW33XDqlWNbviWmo5ty9xNUDli7xBOVvrZ9j19fNpVcjCKBOK+EoOQIKrBUGyl0jgM4KBlhRd3Olp2i0ojKpcb+21dw+B58t7s0yiKF78t7I9yw7nBLZ9JlVjM825gwdKk3BK58jOhPXX2RghnopNODtd6FentT21Er9GFKFgQNsnqqPJZLQ0UsIEQu5YdWRlyHLJd9ZWSpUpia9w0tjv1vQRLL8jKdZK//tSxL8ACoSXaSwYr0FHFK1lhhS4nJFDhwNiqDQdp8SwEVS7pkU///7vsJkYYY6cVQEHtAAkQFFaKpY/BY64uK+SPDNlgUBghIwSbI2QuhSEV0laqLBYO0xJMQda0PVWIHirOOMv9dslBbh1jq/EjEuqSAgKPXANJb5HR78W957pYLdedDV3pRAHdThkypFicESBCfgoyyJxFSkEswoRT6fLeCwBXdoRGTuVboJvzDq2whKfIUI3Wz/vimYsrEo0sssPNFDBFp0CgEsHJ1rdSp7/+1LEygMKZLVmLDEHgVEY7QD0iThbfd/lYroez1hhOXNrSXRucOBecgBoBHCw8KxSNWzMXk81iH2lFD8ZppsSPRweSh0ONiL8ur0NR/WXo6Orrq6irAoo/ew2DYqlp0UmUb2p0vmHpQNjFG2NeVRH1X3yL5tgsU3jphQAUwCqnE5h3SzYIQcTPT6cJtHu5Al1CCT34TGOhg7u0TVP/yCOvu5u9a/Tfn16VdcgGZxd2ffHf6DxNgHFnJjA8ZJGBdBu0QTchqMdwADNjF60WyB8ff/7UsTUAAnYn3FHpKfBUBKtJYSg6KxSxRg51qehKwAGjgACo3HcEKAiI8Yw8Vo9zxComJDoYBJygjYdgnhZyyBA86uDE7lBBWfpouCAS+x2o3cbxERHcogAtPiIlpUcUejBYJjy54hmr9Cl1NsQkGwbzW87i41fvbRVAAbMBBTbJKoC+Iy6EXGHKUdTeUSpg0PXv2tKZwR8vc2ewgM5hGJbsSmJmVEFyE4bT/i+T34qiERcoBJaWr4r+fW8p2xaZdF5Cta2dTtq1vahWGLmPkq1//tSxOCACjSVbyewZWF1FC60xC30z5xQ0fBizoCwA7iAyNtzEi3/a+uYfTkUoJ2VDQ4SIo01oZgHI6uSZUI1B/fZDUK9Qsech3RXWKJsrL1C11sf7o6zF++XJyW5rdep2v9z/d5NiJbIQhGOdloTdGKDq5BouyCAgKDpBMYR3LmICK05cioEBwo2qrkoDAIv66joqjkrJFh4lAKFh7yw7uVtukxjkXWji3G97/xnWlK8PuoMHJJxWr13Sx7kUCThMo+Dc79hf5l3m7f0s9TzJ73/+1LE5wAL4JllTDDrwW+S7PT0oNgytevDR4iJmSHTBg471yYs8xnkZegUe9Vs7i9ROn6fcIa7z+f8gSSrzTjkjaUBMVE4PkwlEoSQgMGiI+/HIR0dlBUMai8hxmFPplUEaMHhULR6kUETRuWDjEi4wJb2pQWHnq5Wtd/ekzXmXket3rcVWONZVzoxi3eqFEF6KEU260gAiEpdkPU4HxsQlGH4aCFvGfZEWhptu5MVQrHVCj9Sz/OpTHBw8StEyLGnRJEgNrmL5YchjOr30pH19P/7UsTngAv0uWmnmQ7hny9taYYUack42cfrcnzSj6iOda68OS2WRuNtkBIqxxR25Cgqhmtg3i4P3FQOV0FeUJW5r9/NvUri3o8sPisvyzmrem1v+Pfe3fqwuYz2dNZsgiPaCpp4Jh9exuWEP0/o//sRdoq11QAERSQJDVmPaEhuLCkHnOYW9gvFQtqagtRe+XOMG0biu15udBKcKcIQXTuofckd7WT+ChhK/1qW7wfwR5zVVt/v72mObxClPeYs4pp2PBXNatOd9Bi+N5N2samd//tSxOGADg0/Zqwwa4lNiu80kYnI4f7v9u///xiYSOZjSFWVw3DQNwtFSU4FXAQJ5mhIYhulpgzTNSExd2objpdTz2gs8Cb5HdB9ZHPme9/hy6b5+zaHUVLIBFZgiYMQwg8z20CrcmOlpOQpT46NO9hoiOfceLEW7XdZpQCxAAACKdNPGiKWslbVmzAY1HIDWGpp9kMvpspFOhJUiUkbnugxcv6fuZEUX4q9gY1NU91NUw23IDI+9qw8gMh4VCj56ryEpe2JwqX2XdL1EeVyVSn/+1LE3YAKGGl356Sq4UWVMHTzIbYqFDFNbNlg0Aw0EyAEpgvqoWW4eIEOpCvV5+QSliMRVTiVsjhBFK9et2vpR5pZvLOn5gcjwl2epJC+ud9/zfcpNI1E1lg3rRIqnSI3BN58oKocXa0DNEIxSn3exW38qt0eh5Nos/CrLrVKAIIAABfNKBpyJqcbrKsdGRx+cfumljWpBLq8UaBnXq/BdNQrvRbTNJB9fOwIcHPHob8LH13znZUA6Xql2OedVZ68/PdGW6b3V0bR9lW2wPmi+//7UsTqAAyUc2OMMQbJd5LtMPYYpMmNW1t+DP9X3e4mAEoE7iggUnAOQpKMcykNVOJZ5KIGVL7p1ii9EE81dBVgKHqyXvlVoUVwEyEE6Ze0CUjxDdEy4YKNQoyU0FDK2CNTAjS84Nj3tUMILxi28CcQcQOevL6ZdVUADN0uIAgpOBRq+3xnWLw6zzSYrgTqyKVZMMDpLFFJ2rjquN6Z4NP1T92y3j47sx6Ef/TW7NGPJ/d37w/9b8j4X2iKYn8Kf5h83whfMIRc46t1t0wm1zQj//tSxOaAC5CXX0wYT0GHkGvpl6RgS6h275nh/paSOW+30dQvZHn4d+gQFC81+9j46p0XB/k4YVs6zdKYYzx0EqJYSABE2IgBJBQOygswWcfguD4pQ4GCWfkYOCyDgljuqoJSHzsv4IBCB95708mfbXbS59Q5CLTPl0B9AbKCOpHQfPRsihRtfShO5/9Gw8kXvp/etf9aBETTRBIJSbgJnpkKxX4JL0NYEybUWQ0uwI9QhyGpgWOv11oeqmq1+ryap5lwMtEsCkSmG0HbmqVB4Kn/+1LE5QALnQFfLJhPgWEOrTT2DSiF/TW4UOERRLLKakqraeQ4x2dNVjPShyBhHW9LWkU3WdMMV5SFlgCmyHJFQliCi0tO8ZQfBtULQEAPEO3MGKyYdjFsDUAgCUckeUAA3oeETd3Mlg8eQliBUPVKYww/cxSTriFCDBxjpvo//6YIK4uy1kAkyjuhLgeB+hgpPAdBguuX9MDskLIsxe/CVS5Or3Pkeglu2fEZZTXzdySdp5djBgrEUV1ildOq3/7xzQgJysKOb1NPkHL8ZzF5eP/7UsToABC1k2esMMeJTA6tbYYYqMYCGzHpICUCmwtbYnzDJRGNJAIeiDTR+CQfhAjhXuGScPHPYTiAgehtPKCv0UAFYKfaRDzlIJaEJgYwYDxJp8nW4cl4ghs0h5ZKGECHKjkismhyBA9S4pJvQXZbH7UCrqEJiEouedmaIiOEEiQdAZoEAooAuIZuRFXSsJ0NStj+eKf0D4YZR7F9RgDu4unRxS74xWM5N7C2iGgMbPi7aodBJQwGXOqBSG1Ggu+I2tdQx62LHL1n1J16+/6M//tSxNmAClhbcaY9A0FQDa509gio6ruNpGXuRJgGfDiRi+XIOpxGmo08choryYbMonsVQcXO3yBHkcfrmB/00UZss7nbNIFFfl5c++iZx/rnMs921NTslIJvaFgejc+0kj9exP4lzga/l7jmecb3GF6Wzz2WBP//3Vxw6glZFPZgSqmecheFAG5BOkY+TcJu+ufN1TBV7DHRjayYr1HQgZzWi7Pc2tDq7fg/0/ugo8dj1UcahhCsrI29XLvT3X0n1rV5GuE1uERnbeLVX8n/V/X/+1LE5AAKJGlvp7DBQZmSLTT2DRh22qAEiaemgKKiA/iiqlRMBp6ektAQ3QXZH70keFf7iTkMq7m00BV4jMgaknAafEkXY8g4FgEBFH4lHrS19uqo1QHGW2Y9yvFECYg8HhJ7SP12QhMgWQJKgho9B7kkNrIMA2T0Y2aYexp1xUblxz42UkJSLKfeXUtvi+2ELeMgxPEFz3aNMn1j1vrDD8+pQprhn1atrp5sCqBqvM3taiAYVCzACphFNd8IBtR8MRWJ55Kw6KjCk+eeekUskP/7UsTmAArkhWnHmK5BjZutsPSNSRVGcPuQpF8JrbXSBUNCFC3ChkRCJISAws8BAgXSsQte1TTAuxTkwQmFAR3lZPRloojdvfvWEVo3IFEkSSyRoUcqmOe5/PEWxMKmCmQX0x2NBxHzKqLoSmogRRLnK7wiE/5Of0/LyhufXGJR5ewhN+x+gatKe/19F2725CtARU05oid9VQ3bJ3FV0pCCqowGwtzMeaMUUioSVUSrkGpm9Z0XE0D/KQTaghGQ8aIfUK/MyhDCSUoCEStJ07v1//tSxOaACvD5bYeMU0JsLe2xhhqRNBUCxpruedtXI0vYtM65X9zPslci9p4sk2mwsC27IkpZVUGARDyIwbk0EVAmLxKPkxINh6wwc8ILOraKCsJYvVy7X8tFwo7KZRgal1zIk8Nc5TvLueeFY4s86+0LqUVK1yrbhLXbrtez7f/7oqSVBZkrEiRzZmQRSXQa4fOFxSmhB5Q/xG3c+jyaaQI/pUox2l785FBpsUBN37MzpxX/5Z0yeKGJAteIdK1uY/snUSW2fqFzp0f2Ib/+zeD/+1LEywAKXE1zbDWCAToTb3TzDVAS1EYhAAoQIlBYxxuBcS+o5dF9MTxELNRyho9ajzYiqPOV0FCcX0HGW0KKw5po+HPG6uBQqRKgNYVxUo9IKMDaHnY2tVzdcCwwotI1yrnsWCRA9aVAcihkOjEC7azbc9ktyOop59ZEEsGEVTZYpQ1F1XQfMu8Ot0ZDl7BLN0MjJk2tRtBfK3Ub/0+iqCJe6VjzHbgdB2St/pVhE9ECXWZdJMjUx4uaI2iOWMCM35vw4WWARxaQYlw5BtLwMf/7UsTYAAp0d3mHmG6BSpWucMMNmEktSFrtTTqHAR5x2FIEkuUWsHQaaErlKJg6y8Zllc+TCXkl0ZxVQzO7naOEwQHcj4dAzJacCMqMITDGJ9/vclnrdWv30V179fR7+urDzqPGVj1mEPuGqJiokn2XsHF861aUUrTcVeoE0rcARssdatEGpunFgsSGxfJiuxUTDv6UbwLbkH6tXAfy+gcOsnu6HRmKPEQopCvUqY5Wejoy4wcYhN30RDI5ZziSjmMX3woxoTYc6r0lDGXQNHhF//tSxOKACYyrbwwkZ4GOjS1w8RqA+jCmIeHk+ioFDottQgklKCdp9Bsp2HEKlBuallZ5WWHzBJDP2tTPvZgDMdgcyHMzdBEps6hayDsd+zYXCf0f9210P+ZJv25xCI9eXPyLmVkWMyoGLFW8QOaNUGUdH+JA0Xcl4+i/A1Ud0QEAAsNEYZkHgUReiDoF8xODLIpk2YKwlq5EO8JidlmiOOzt9Ja284qEtDFr+mu31D50taMjDEAx2ZjtTX/8q+aIsohCpYOFy6wRbNsTpLwBIEv/+1LE6IAMJJtrLDBnwXkeLjT2CPBulq+LNOodOCmUuqkgUq0lHgANjqmMe5EWjRV47SFR2M5Lc6SRl/WDtl1foi2WnRvqr2Yv9xgwMN0tJFToCReMDj72IFlL+o6tsXUpss7YwacMXpQhb2v7E17v6ugF+qaWMkAFTAbBtE5ONOoWmTkcTCRjFY7Es/VAs41nloZ2tbFnZBp4T6PmTdovB0/RwWhRe/fTdpptpDVonQpbIjMnX/hfOPfc8mpPfn4z2+uF/f+XZS19NjP/3IcbU//7UsTmgAugv2ssMKXBfJ7t9PYMuOqCbI1tMcuJspyoBSEkM4ADaOQkknCwMFY5IBWKyBsAWU/TNBvbBCZ12J2i22tyc3IHv584QgTOYNHhpY4FQ1HINxKcNzyEcXcNNlIhr/dC5G9KH6k9l+v9SgfvUQABBdJFv7XZ20KjqLVnpINCZQEhIXFIZh3OtKqi8gtFrebfqdFTfsNwTaAVuUX6qZ+XuvmpyIcCCTVtDNyMs8viU2DEk7875H5bEXXPy/l/Tyg9YqPXQ9bmDy2Qi62o//tSxOYADBC1ZyesywFCC62xhgy4FRLWhag65S0gwCCSomWoFKAoJiLFleMyEZxSuNyzgzt65KbdYCvpCjdD9woA4wCd7dOq/xs5r+ce2NWcuiwr7rzOT+7fWx9UdHLc4KVvaGA4DoDeoOvDDyk0nCLzWIntCgF9HS4ZbWZUET36qgNzeHhXNpIxO8mIubCQEuyjMOZqLo4IqGMUx30ZMkfLGyAU6LT8ANP7SwV7QiqX16JFmSvoOBT5AhNvahrpsJ4gIy4rYkd7XXidpJ58r1D/+1LE64ANOM9tp5hUiTqMrXGGGDixGae/3odVHOuIKbT1aAkFF2lAgFhCBcm0jSfQZoLDZgPojxhY2Cbw8hHtKBj2dDLJ+u2gcVdYbHNGFMgkMLUKJvz/Qbi+6yujZZRl6Dkm37F+kpD637umXuUbAi+drLQABUpCR5JprqcoiALWL+thIdqZtGd57o22R9naURcJw6Z456Zyrx38fv26aHaCkpsdT8ZtVbFr4pUHj/O9ZqfyHsUbJzoi/tOldemHCFblxD9WEdOaTaVXc37Sg//7UsTtAAzZKWlMLGnBnhRtNYeYuFPMl8rUkE3qxIWihPbMkm7nOi6IvbakqLwlFaqQNYSkbnrkqJtBEmLMYYNEBCvRKs2oOzWNkBKTNH1CwX9JJEUkgmJQ6JQWXiML4ojo7LRqhi7Gjo3Xj16lrrcCV3kjQrzTxcFVOEAowcIjdqlOE0KKA8XIDUW9RzFtCT39+9CarUp4dt4kcpQ15Ck1troIItSI4CFrF4gyWlGeipZKLoyjjRIK+4oDNQDFwhKoN8Obr2kci/8mov48vArs//tSxOOAC6Bxc+ewcEE0Ce3w9iDgXjtj/f1DHwAhkKGJxCjIbenACUrBtT1upy/s6F//xE4sScpE91ICAlk0HEo2IKq5zGN0xYYfJC1ETdXsRAFE8kMASxvEvYiWNGCrgDXpsVkM4j2HwMba/YorengYZCFRYOhVw2SuIvSenqxXumkxbpR+t/LHvzsmpSWUU2qqMLlCAAaICLWYo4HMZsYWQpmMy1fBJE8R6DgvMgVL38oH3YSGdLPm3LY04ytIZwvI869S661diI6tI60DD0n/+1LE7IATcaNvrA05AUwIrvTGCLhjIucc+sykoYsxsk0SFzCGiIUYZvHvIt1fEQ7V6ywJrY2wAAAqeprG0f6kOGhpIx4CCWsFHKzNpRBKhtJk/5QAxrHM7dQnIhtgwxHY5TbM53yDF7PJVPV02kROBlrqjoiZHikLHalLeTdFiBbzxG0M1b98FizridwCCZI+QJ11CApyrTIAATgSQ4jJRRmPdCRlhSLTMpheF7cMnYQ/RfmohZf+DNYm5q5b1axGFFDDI67MLc6vU1VMtps7O//7UsTTAAqIfW1nsMlBXBBt8PMOENW8jWCjFMw8ZCiG1UDrk7nV4qvS0RltFlk9Jd4otqWAgKoNiAAABQM4y1eWEwi1TA4CvSY/8TFE8z0wa3L7AHBAfWCKHuGrGJ8l7X7GGrnSYlxNVMGOPCPnXdMc69RNiRpk4avW+4WY8RdBCxjf1Pzrv5dnMcXFVQQJIISQAACoLIHtRn2ui1XQkRDJSuVUMR88WuDgT0Bl247VAahkQxSNLK5WecRsEncB1uqHZFCSGurj5TFs+8hrWZaD//tSxNsAC2CFaSekzMGFm6409IncCFmMGkgsrDk4vMFBRO1bakL9Vn99mkIhIioAAx+FkpR4F9FqjlWDFkMq2FJ/FxAQnAq0so8+44zdkbO9naf1hOVxCcOhCOHEM6V86bJbwx5tguDQaauwDEB5d2xUVvKCn+j2a+LCGx2tH9rlDILyZKAAeJAhpxG+xvm86VXDS0SdECNTSntBQGV0RO+EwGU2QdvhGz5mVSoG7k8WhXg2IpB6ATmVKUypplNSgG9HRahv/qcGEAqHD40VMWj/+1LE2oALjLlrp7BQQV+S7PT0DiD4jAlX/l6Qmttm3WiSk6MMvJZG4dpwMZ2RC+o5YPEF0dw4xeAznrMhbiqkISyAdmmstyvMg8jxHkUp0kRcQNGE0jORguwXWO1koZ9M7lKmnzbsfvAohtZsfYa+RhQp6Uz+61tWm+9QyX/zEKP3Ywb+In/lWC2+ReHjvZp9F3T/l/QAEuDIEAhEqG6BOk8V7EhLKXPtapDwD5rmJjwXaKUjFrNHm14fwZKXQpVcm5g43k2zyYShjLFRAPPHeP/7UsTeAItIt2enpKzBVRSs9PYM8AgXFmDWu5G1KuNp9Nzrq3C/LYp1Lj2a9IGSLKo7IiSESqD6QKVpgTDIkpxrCM+qDr+JjSqFkmRu/gEs8paNKRw4fDPriWKGGXj1PKqeW1hgZeh9Lx4jSftIrPHxmLqcv2pTQy30oIi1Gr3UC2oACZrFIgIlztB+o9WnI0ryKThQi2NumRLZquMM79kVv0hjTGtbTF1VwVFQiXuCItLnzv8ypaxKopFUsi5snp9PU3/begS9mrpkhUZxkixl//tSxOQACtB1a4ekboHpme409I7JbDqhCMAZyHD56sVRSAgZkJy5hAkh3HeJYth/OabSQy6nqTHsEyc0eIR1AyBEDA7d2C6jNTI2H1jzPhvUBmxHZAb92DHHgxauHwM00cQx1Gp0f9AYW8xfPpbQKFnH0zSA1e3c/qyNCBLhzJQARUwMwRstpy3RzmgLJlhluaxW1w1MKeSaFJ6LTdjl1G1esOmRAyyJHhimQY6t+Ihzvbn3NykSiurkPIY+Cf4M2YUynakDnbeEetDjJS5Zdb3/+1LE2YAKZIFtp7BpQVOM7rzEjZxGBcxRR9zXsoQAAAoJQQkAAAKjIOAzkucqiSZ7RD1OJmuNOrlZFIaf5BTQY3WNWAlVrvLtc+qxHaQeH4zWlm/3UQZluynZbCODk4niwUzyVuGi6JSlaUPaixdlPo9lQ2uB2IDJbThjMJUAAQiIACX+HoMJjDYbBdCd0pgcT4STfJTCwwUYNK+Zwq/rDPN40YQX0OyBWBkcpQriDzdsjPcmKmxvbaPDAeNk1Ez4QLDUgg2LBRYfP7H0V41/k//7UsTjgAt0/22nrFCBZBAtvPYNKLx0PvB/mAAWTLEQACE6XUN1gL+dbgyK1nZVh67bHM6DQTgrheFGXQvCvclY8Ytv7QABh4W+t973b/w077/7ZtxH7mW3f293sX8TaMZmnDEAc4YTovfBd7v/+umxmXj6QIHAdapVIeNiMY9bZrOIjbTiGRyQcqlClBLBbOOTtLF5hqQ7lx+iGVnYFJkPozcJ69Y/RIeV+TtceWMNOzo3ct2r2JYeixUFLWOQIkEIKM5uDxUMFGUUiuWWWWrd//tSxOcAC+TRaaeMVIF9lKy89A5YE3CYnuoVYEatMf7wYhE38Gi+Qv/kSSkAz1f/coZYzqvIEIyMcuL///zsKKxTVGFIdyjSd8lkYMca5RudvmnVx8F5vxAKdftLQgEqAZahLshx+Gir0gxCRpx1CH1DC6mNA3C3ISooTBaZQla10+7Hlfv8IsEHRxYPkEr0E4qHiNy1jLSFLt+j8AxVoXp3ZH3Ek2FT149zbN4AARyMMiAJYUgcnEdQExLTgrAHr9SrG9ji+x9VCU9CayAiOsb/+1LE5YALIKtlbDBlwn00rfTzMrhwYmh8Lz/ztMy+ODC8bzHSUsvn/dAZciiMWVdyVfpteIcOypWwONFW3P8lzrkekAAIWEEFjCneXbOqVXmdL6oAJx4e2yxRvN0H51Ripcra714WXC7SP01hqZgwlJnvwvy+Zi7SQBINHNIilJZFblNUKrxlqwrW0PQGTMzarvUyz3UAAI3sSAA4cZC2hYxQrmZQ87R44pYjC6I1sViJp6pOIJ6Cd2crOaxlR1vPY0jpQs2yzlmYz0pzXb7K2//7UsTHAAsxj3unhHXJUZBu8PSNGLx0Vf37P6PqUHjcnnYr5ooPIrCbawUDROwmSkU4QJb0hEorgKBQ5JB4TT/EsT0K5A5JEGdwkYj0SzGSOAgm6qa6nVL1dejsxDdKPRd+9FTYHf2Op41rHf+haggWEoB0oFT0kbMOHGWDg7E0U004AUCGJE9y3lsL4pDKXRxqSh8z5bVxSAT16XSg2IyrTPnXY2P8mzENlLeTNqg8iazIpVIfCOdY9qTkeZ/E+nnJgxoueNNSkbaAltTwmvvm//tSxM4AClC5cYwwYcFIlW1RlI0YkLAAF/xNFNzIY86grZyrq7ZY+V1tYdhDXaB5qao9En7qKQRhqIhfuoRJlRpSotXeUVd/sFlU+1KVta0+tH4UAqKevp9+t0AwZJHBfe8U55vnfq7nXHNP9+v8Cei6Al7cOdJ/8IO/x1UGSsAA86CxDieQ6hOOOXFhQsdddizsMWdtJKOsBusSbIckpQNdiYnElVEGciYHyqB4flbCwGJ2cOgSqfSJUbVzowSwg57xjyK3pnmbu+/A2oYOzxb/+1DE2YAKAMFtjDBJAUOX7fWGCDhmM5a/Ttux+r7zS1+CdnV1L/sXuT+72vNMZX+nWYnt/Jm1oZrTf3u6m0pWfvasxsPGBVKkcaCTQ+jKhwUhTf////7hEDATJYEmEVEqbOpsMRLTdSJjIGcpvrkbO/sph+GYNpp62yNpyrc6OmqOLoXRDV1qPAvPROE9OOS8aFZhg4eVjMlNRqSY071FzrOvN4dGB7WNneoH889NeFnG8SWj28Les+sT33/mSJ86xj6xuus2tfGdzR6YeSwZ//tSxOaAC7zNbaekcMF9DmzmspAB6b//+MetcU//xT/H/n1eWMyNU15tgg0APOt54YzRT//WhQ1tJ5H921lA7sWFyPM4ybnKfmESq0vVigodRAx5oQI8uDImOEFhlciF3MUQGFA2TSSWKXGhZDWREWDr/dcyoXTUHrEF08g3XEaMgVaO//q7QFT0UABgaJNh9lgkWEzoebcUIyeSGT4tGRdWPPnD2C+aBF3To90PjUl4xeevjlvgMKorcBCzhzzxUZttIWOtoY8vJVHvsddsgKr/+1LE5YAS0T1euaYAAmgq7nsw8AA+pdMyV+q7bnb2JQGgACyjYYx01Eysb/ICoIcvsud7F0OUH2bKWpT6QJlwSpew3Zh8OUp/3HUJyrxYgHVLBAhAIOHRMZDKrB8MTrM5AdGGdGppZbuasZcAUJV7BRu2z/dqECW5ABLCrVMWUPClA6oBh1GBdaFKknExtMzLRxkBjW7RXepRaM7Q05LVc4x0Mhy3Sx/SKtRXYeoKDVCYTNaL1ohpLAo4MCbf//IonyTDTGV2rrL9j8WVAILUof/7UsSrAAoIU3uc8QAhUgztJYYY4FrHX0XbV6nqs1YJ95+bhljdDTXoP3QvT3rSrWJXUzeSam55r6lGhIUxNl/ugorXuCjMJomMZdKm9W3IyCGEDw6KueRHnlvSv/2HT1S8lvQGgdb5U000pkgMh8XihSM0H1UAlRiUfQDepJhwNrTrgkBW7+tFRkO+w4sfiQcfFSwNPNBQs6PQpYMiy1cjljNxpK/5LXeAX12MaXaaUU1pM//3qiQS1AABKeFEIE4Ph1ybA4i8QFpFaeID1l5o//tSxLaACsBjZswsywFZEuzlhhS49x1ZrNppz31KdqFoh8NmG6JfhsqpnUQaudvARmvUBmND12UfS6F2tV83GMkHxduD6lgMOtiHyltbQitSBstcJIaRL4fsnIzV1sFlD+mPQtwOkeCoxRd6gZa1fU85ZBRkCB26RzW8OXn3HF3PzXMzwmg6MqRQVIAkLC5h7dhvRLjLZtdn1uXqVQfQET4NBSIaZ7MvMyZiKu8rHMpC4aZFOfDIsT15gD77dAC9xEBJKBx2mh+e/CREEGErizX/+1LEvgAKZLVgLJhvQUgMLrTEjKwKlC72G4gcNvAYPgMPjSZRl3p//Pk+VAMc54MYfZMjqBCFgnUaeLMBSXWgEoHhUkESAzYFiBKRrttskaSPw+Lyu1upIFkhsOA8G2tiiCoMgEuZRe5xQKBQ/fTfcZahqB79bBVdyjQFEZUfsakYUTRvqQoAkMsCAIAQUEmot4SgWtPHUsoe+VLikbxzjBR/SCgrziQDsSiXRf8I5SM9b9X1AqXOnTLV5QKipxAjGTLs8yrkp1J2LeTq0arPTv/7UsTJAIpoZ2dMMGXBOZXsBZYg4KgGK/uPUggsoAADsZL/AHSBzOG0U3cQWpiIcJxwedSn062eLrbH5T9JiI4qsdBBQXyFoHErKzibDI+DllzPEtRDZQjWiczGFGGMlLJAKpUsrbuf3b3OWMU0rTtDkfQJR4iCrWE5FuKVABKQQFrHCCE7P0SC0r5CGrMikH8HjwoqUzwwsSVyvkgCn8kVfu6Uyafuu2MiWm9pAooqIwNFgws8E3DHMaMDDiC3Cc5Mh9yCjbmlTknJps11PIKv//tSxNYACViLaqeYckFqjm3E9hiIodSKEUte9zdq1gAFsAAEU6g0LeYw18IMtVw4ZY3NBnaoXunr6Zh2O7u1o8I+++VJLym0vOdTDlK6TsredNzqy1m9bN51emVO73fQb6hdqqszfJiwEtYelUXyqsGxA1inN1qVZDad9kJSSb7UdjGRgxUaD7Q4OlHmxBNhmYrCwuKqWJd1ohIr/AbKT+e3PubTfNkzhZcMswZCppNQst8jk7e/4exuAGJS8pr+e3fD19R79e9yL9b/n2t235b/+1LE4QAJ/HVth5hswYYWrKWGDPA/bsybxq+e/7boApcpAEl7APamJQJCqi8mSq0tIl32jYjRcRBCaJz3Fd4NOQ7BXkVZBYxvxM6IZS/2Ptp+zBCBMLNKLU+TEI9+wg16bMouAQOwXzKsFQaFEuYEUKzqXJQlZNFNKgAFWAAALnAFoXIfIJokTiTBRmi2C+FkGxEw8PiI26kg6Ky4PcTLKwyP3zp/9zyhOrlc5b+Gfm2ECA0SiBKwePaY0UGZ5yAgJgovi4SCYqKDSzVj34jK0P/7UsTmAAu8b2MsMMUBYZusqYYJKIt+5Yx9z9jeukAAFxEwCAY7kALoHSuGkqHi6uffYzZaGp6rwhfyX9QHGUts6yvdTfykorwX7MlKmRHvRMqonZ93clLb/5Pr/9G//5//b//5J8jHFuRHljA9oT48z/f/iUQCXL2CuPxLOSUXcNa/D9VXVky2efFLQ+mshIooK70JaMZrKwIxhvoD5LKEOGjoY5pUDwnQ3jXMmS1qCUy7Fb/h7LnS8pu/x4allDY0sj7uEMJSlUzZ1N/h07Jm//tSxOiADFSRb6ewZelrEayo9I2YmKcBQVbVh4MCha+XdkQ7vbd4eVMyWBSf1kjbSTUywT4Q0G2wIAhOzagAJHGCBeCknRvMU2eq3KnPjLhxZguiLLN3K9ySoWe5Ort9jvp3s6FqUsw4IOcp5oSDodDTX3FobFUx4dCTC1UAFOMkxFgIpnujk4HsG6+XY9ZwNZwwBXkYuEk5P2o8vcJG76P1iSsHmW5px/Nqcnz3qsx5+NllbrTn/vVkDiTxBXljYuxdQSHqZ8yMizbu1sOuJVX/+1LE54AMCH9hR7DJQVssLPD0Cek+hO1CPRchoCS62xtJJOAVHwrgMD7jkORzFJbqwIR4OQfQJmkrdK/o3bicd+54YhLP3Q9DyGsqrSVp6S3uyK4R9S3UuaY5qUXLJq5qJfo+vsZ659wx5sctAstBNZJD9dHoURoqtUbVBEABfdSDhFzzwFFlowW8rc+MR0wFZ6Si1i1UxyZ6PajtV0wdzqzpXWk9xvYfWsCAMwMpIo9NhJkIqH0qRJAR8cnV88uO5/TXCmSqUBH1vuStdr4nQP/7UsTqAA45ZWYHpGvJRYvvNJCOgEC4bp9nW//+gAIGAbLmsteNgwcpqLCCY4vXodFbExZ2B91iM51KAyFsAcopBOX1wOhmJ9+x0bteX3YedyLbqaGBPGjGjVm48uUap+hRZ6rtl/fXJOWtwrXUp9bFyQVV6XUrQhB0RFg2kkk5yVpXApJwXaArUHQ2bYMCOP+eWJpVl1dTk21gLCNUKNZrYMgQadPNeDqzQPrCBMCJLB2fhEaodc5jgKXQXDBi4i0wlHnBaWGlve59AoGXiUBM//tSxOYAC1ipb6eYUUF+Iq60wwnkPgw9oYIB3Ul6gAD1ABKSlYCPAh8oMjEqOGy5gyKYbfENWkRYvHxZXzdyMC6mb5qJg0bzLRuLVT51OXV/lWYUYRK0Z40SMg8TNLaGEvEBjcVk8yl91mttTFaB6coeEKmOKSKVsUAU5LF90tjYDdYCAPBmOIVDY9CDOMygnstLFnE6NYdYpqMqqjpFqAr2tV0rpu0xB4nDQiAw8VGFT4OBo4LhVxoTuKkdjYwfeLq0VXvkH7wI4aXFggZeUdz/+1LE5oCLsM1erDBpwWYQrCWHmOC4ftWf/8QYEBAhFPi9DNFjAzgE5XosqR8K9NQHi5TgUYTQyIBQghSkF8m0xaNHKcXVuzXn7qDvmQUAIJE0beRRsIBQSZ+0XEZBAgh32iCDk1wmmx62iItoxPmAiBMHqOeT9xbREOfeXu3fbN7Rn/8Y5+sqSZinb1BRCmbe0ZibXBRAgZjY/vwQgPD9czL2PDxC0HVkAGXLNHCaFcBl9GvIyUJenI1LC6OwkmL4raKrK1ZUlrVjbsWnYoMiGf/7UsTpAAxoZXHnsEXhahAsaYYg4Ek5KJrZmw8gcBI2pUTkDh5isegjhDiVVjiUh9jSinDtTmrkrYQOEYTQwb2UzNcoRuS8cisDts2TIZtmqenicsKpCg2BVAEzwZdIMbH/kWBN7rKLURrVUAFKLmYxepbI3NNDIkLCqQ7EApqHon3knaMKNyFNCfhAyKll8syca3ola13KnlgR6ECdjVqFy5ktWCN5gEM6Ve1B4gx5owmom4VqvtejSSOJY5FVj5IENKMEDIAJbwFVIohOI0Jg//tSxOgAC8xxa4ewweIpL2zk9Jm59OxRc9H4JigepSzbTvRVinEQvCMz5Ufk2YjDMeOPBcItE8vPPAYbrLqKB03D4XBJxdB9sqh40HpfLGKSrFHwcGr2xkaJD8T7XiPz4DaACU6ARABIZGnywpgoqSlQaFRoUjDYByyRC29IxiW/OcQtSBg40YZCEqXOg0FxEtJIXuYVJLY4WLVigUePGpqF3a7hw5NlEE0Cw9qjLut3z1YlCy8rwmGpKgAjKgAAALiGUWaXyrUJEYqC0wLgzPD/+1LE0YAP0Z9tLDBlwWIOriWGDHCSARxZ7r+E6h5qOwG8CKJoql++Yqu/p3uKhlKiZIgKO0nkkkXyuQRE490qbZTFF2lhh1A4e5Zn/L8Y8pEKcOXK+wEZwBFRc0qCtNlidEucdkbLYPjxKFbg9IQf0KqDcebP212j0Wr475TILNt+a3/rWDjUM6uRDTKjHbqsNRS9nToQtnyv5Hp49V9uyKerUOqsvvVvR/Tlzffozre1ijJdxSoKv7+V1yWJ3BnLKvO8nSFnqpmRMLVHxb6pf//7UsTEAAukZW+HsGVBYYftsYYkSAo+k530VhHk5EqjcqidevEPm4N358nTcjPK2z7MlGbTTp66/EMT3teQ3Vc0o+WOOClLLq3tYTVY9YJCAAACxh4ZEoXQk87EiclK8wLg3OrAZXvLDod5APaHdhcCRW27UjDzh4wRVcofBQyXV3Otr/7mlWlN2mPuUt52+q1av/15rvnphdb0IQNmDzzlaWv0/6LxDoFE0+sFnx1VplppKiOoJXnKgFQuJTvakfLAiRE6MRGuJXwPN4gft02x//tSxMcACuhxZ4yww4GALeyllgk4DGCigYm+8zslmteoiW25s6N9XQn7l2X3/eELIVZFm9Onv1/x5d7RixOnd0AFMAAADMXBU4opdOvwwh4GmwzT1UPYtXR4E0wv2rp9TLzFnXQgyojmYG6HMiO6My7KW3t+9lM+d+vnf/e6d/5+r/b69eTRORqnrVyN7Uqec5CEO8iuhG5CUYOLUOH4VQAY4QAmLAEaQZDC+M7mibHqcT6QnywscGWEMEnh6cnXHbzFgVIyTJTMMaQRSJpn/tv/+1LEyQAKZN15p4xRYXebq+WmIOD9yPlQzGFMSRKpDBRUywSa2X+99Fbbta6+L6JJqYo/ep5ZIBLCgGEIXOozZdT/NbnYu8cvlGDP8zTgOOwcssczgWeWxFar0q03NXrFCx2FgYDJos9CkglKqlirzodxUMm7br9W3NZmxLP20zeiiMMI3oUrXqUABGIAHfdk7aQE15919WL6t6wsHfpLy9wXxGIJGFga5pW4hTuXuZWnttDdgtJe9uzs7f7rmDhUApCjGbo8k4OCz6FF/WiTnv/7UsTOgAoU3XGnpEshejMspYYI8bUeyrV2bv/bfUAEjSURybFC0eOr+fZibkvS4lLLl9c24nK7gV1VFH0IojsYq+pTiopEzTZgzsoqrSKNzNBbbjB5d9bRYgabfOIJhgKZbbK7vWtqD9HxerSx+RQRNRxzShEMAhAQzjzjSkioUzZmTkvE9LHa0PO+t2/p6r2DPsVWcfMKxhd5JqozyRx+MUngAvFyApKZBQSwSEIfa+Z3cnyU93dKXTs7//l+oklXUFSPed5uxx543ktxuapT//tSxNSASmypaWecbEFIjOyhhBmoHmVyOLRWQBiQQCDKKSro7VkcRVapa4yKM4/4LRnlTLvS9+i6qSL7ysmM4xzNLhDMwpZyzyPp0FMUwhlOWxLELXV0rVaaF9v+Qwj1Fs+4JgpFvI6W+Ve9rAsTKmxwx4xChaRBeFGVAnWEdVQ6k03bzBQTUa4uZkPTBNxctEOhwGPNY9n9S4RgL2DsXjQ4gTNAU7c5XdszaayERHRtKb109KK51/R+0pDjiC33CriaiYsMWpLSwfG4oUj7zqz/+1LE34CKDIthDDDHAVkRLCGGDZhEtzl0jiW9tmaCbjjkdMwufiFQS4MZiJMthrs6V1c5lFi6KjaDmWQlC8Koa6Vul9lNOFao6175/NdjJ6+RXpfsZTaCBTouzE61FCEImbn/ljBPo00HQTUBHL4+LBIbWiL5287ZR9u65QEYYksikU3KWEQucguGHlB8PhBA4gaWwtN5hKU0DnWM+ikfqqIjnORiUHBv7KAnYjbHF1QjMXuRrWb6vRp7c//PuRxREI3V6+mjZK786NpPRrAhAP/7UsTqAAxY4V0MpHDBepwstYeIuNGUkih6XvSJ585lwQJwwHseD4AQBAAgQ65LGJNiZQKnARyoQM4gkBh1ap1y2kQ3OQE1SIwZDBQhJzbAVUJiXS7yeIXbNGAQNlyMVyKxPilaLBTdZkXTPzivCMHQNW7Epq3u117IsVOotjCEnNWx7FchBoEU4lMvKtCc/OI2R6uvpkkI8zeOLWmFRC1BqRk1/+uHcMA6RYHMOvCAYHYEAoNWfc1RL2OhVk9OMmwGx1GowA2EKRqO5fWLkAQ6//tSxOcAC+jjceeMUOF5G66w9A4etlXUjAUMnqRmFTjomv2OIyi+vM7DFJawFQmFCbyCRRIGxFQkRCgGFnPGPm4vvSesu8UdLVtsV0cb6t6QiZFTlzRfKs3wvCTIQtry85nAyHYUB6GWu2qErhHYSI4Rjl41tMy+43p83HbfnEmErI+qlcsuY3f3808abaLb6mTmSlEC0iIjw8UPwqGytICJWqfYsYSZs6XXFjqot60ApAAARcZ+kkkq1B/VwIytJSAYSiiRG5HyhiwGdrr2Erz/+1LE5gAMxUtprDBFwkax7GWEjjnUrne4IJEXlTiKpyqznFliIQFhcxSsq5v+PIwYUrX54r66zvpv3N/3t50m1O32OWAg1GCkjGiVAXJSGAoy2o8zVOlmJN45uw4VGbXbdRySDGxEzz0pqdb/tOf6UmdtQULCA+gOPBcFjU6Sgyw2PRIxWBXE7KVey/6kcYL/NbbFQAL0dXNL3o2DCgOcQHAwph/F7x+qyC2KS5QSSNkxE6WYlMiy7g8+cbl5vi2jd1I/bQ/uXpwUJOIa4DPa4P/7UsTIAIpwd2gHsMWBfRqtFYeYIJDku3te+flntU+xiaSj8S6+/anpaY3aVBgVeS1pxRy9sIklhpsRXFwXoiwb3JxHJiOqQoQHFtX2s6IKTbaF7cBEp5FbZn0OrJnmCCI5UvjaXLi+DoGJzA+k6HFXuSlSElXtZcqxor+m4nXYCAAA2KPCTF3rYdEMMK0c8RxPBmT3AIlNC9QUKDXow7HOBs2nG+nS8kmWV535xjFVw4QiM3CwEeIFFyzsYASi5UceWIiKkx40RXZcxIXX94fj//tSxMyACgyrZSwkp8E8kG208ZokfS+4AyyyQCnNy7i8LkXEkbcBuFwRBhoJ0jDpcLUxUioNFXsWMwiw+xxvbElVCUX8IgQTaXOqGkSsxAgVQ6eOEidlKwwBaZssbxCMSRrDkDP1BkXadYckQyaJge841ryrxhbkynqqDkAAAjKjqEwWookvlWz2KvY3Wmi8P37FNyavYtz+V9s9wo6/co8LEA3YEMVMOHFi0CfzRTtTU070/mxc6hQgYvI0EZ+gRd4bVCOptrTOu83fQ6f/miH/+1LE2oAKnINcTCTMQUwP7fT2DLw/omQQms/Z4fbiyoJuz6z22VE6CK/59k209Nqe3Ee0Z4gAHMKta+mIWC2GsqRKJ2TTCBCIyN7WCwrdsHsmEDUkdqRshCE4q7kuhxSnQsIxYgMoy0odBiJa7jcUSu4u4p76EA6rnarRE4qf6rSqfe7jISt9I++KinSXI+ZzagfqucwH4Xh04xF9d+0l5/24+9rj7L0kCVUoKIrZUBQJhJLhQB1wT1j6GVKHJwZj3TVyoxNzit8lBKPFcYn0/v/7UsTkgAp4ZVrMMScBigxsKPYNKIYuVmTRnSS+5n90bZuymGhRbsm2uncn/hruEeLVEcZViwdQWNkble0q4hr7RFBElpjLxokrdHy9Pl2Swb5tJxvZVM/iKXNm3BijsPcoasZ0Qa/8fRlVr+t07XL3sjr0gg4ZasCpow8KoApG9KIxy3V///W9wot/6ZYABGMEAAlpKjUvIjI/BvEO6Mhj6vUE0toUL8gS2JGIFncswu99dyKK/56Un5lNZL55Wz7kTwcEDBgoBygQ7j3igH3E//tSxOcAjwF3XuwM1cnCpKxFhKD5ltZ/d3/gSIiCg7ZfjTIoALIAAA0n4PBUEjVkWGOCXUAiESIDxIab0jQRHnCkU0McmhaWGEuli7m5uzJyt3hapFsyEgVh8idYehKTvTUx7Ebf7sdzxYqORf92V/mlAAAFAAABBTkWBoAVVOBmaQRLaXCaKCo9GBbj0Tj9adAJVD1ohiAwvLWIbottxOrtsOclkm5ymh5+RPPS3C6lLUCZghoCDyZS8uKOeykVMLVOvP6c6LUnXPHmjiWWuMT/+1LE0IAKUK1vhgxSwT4VrrTxiiAipZE3sNGK1eggJWcNJIkpTHaLAPNzM94jhQznYaigaVtwY1Ip6c7tECWVYVEcxCqpCBUSHhYxkWfC53bY6jhGBkVWac9sc/RALQmsifdmXeqGNTmxkN01vYtRBi8o9pt5i360KgAhAAABmxnkpUhx/0ISoNAlA7Cp+Aslt2aWtPQjqT+C5jsoENXayMXunA3IqDZlIGhEjWT4SZDOV3BJVEGss10L5/PzdLmhFcs/nNPmc/rf9P9+59f4Tf/7UsTdgAo8q2mmGGxBNpAr5YSg4F0zd2G9QvJwTwIzj/bCdtJgYDvl9yMir8gA2hEOATFI/hQNgfc0PG02nE92j/CiCgcxAFxJR5w9ETpp2xK7lnC//kpl/xOwqiV/RMAJ3ju/v9eEbnoVP3ie5xOIhJ2p/6fm5hE/CE4+hZTpzd8DPhUXJQ4t7gQsjQ8UnH10k7B5IXMkgqxKLjA4JxG9EQog+FDDYnGxK0TI2C5+ShgQioE4VHWnTVJN7oUtkYxdFqpugx9ZNNsE70FpJLWr//tSxOuADQCTW6wwxwFskSz08w4UkiuUmeWhTTzInKhwfRuTmi2VmyFREh1l8EjLMJqIB5ChXitJNFT4xir0MYo5yWbZ9wgs05goqWB/CxBmQjls1K3aph+LSsVn5ed8p1U5XX2Vxx3/p7K7WmgAXLcz0oBt4gatKkK8LmypiApJR8yyMvUTEZse5LDDh6KAHg5yN3lv9N85/yH4qUUoRKDuXVDiGWbqRR49DWf+PkDhqpDrFPQVaBj9zZIdh3HrBVNIVmUlI2UnBW6HYSI84jn/+1LE54BN/TtZLCRwiYst7WDEjOCWj4VRyuDtS9d3gz6Kp6KDmUh1TBmZ4WJjDZSRQbU1jAxNlZv86xVopFWHgAb3K++5DVMHBwNgF6H3zt2uHt6cUWBQY60QRAYhLCqzRIAnXSrJiYTpPJ3niBvxG0xdnqDLqVH6zP0+jMJX9jesyMn+1KXKUycz9E5qoPHW8193dLCUSk50KL9bsV1uWdqyKgB2sEARh6RrNAw1acxbtKJ8qYkAYDq+0Be7hKKmsNGvghy38Z0l3d0btu0/Jv/7UsTcABMZm2gMMSRBSRCvMPSMcN/7Xk3WjJMhf67OgEChZ1tNvQtHaSCo0EQpf0qW0JR61DiP6QQXDJBCikwqVDRarB02+DWp2AcVX9xYfZ7MSmf+L8wQwXEHYTJA620hZ2PQtv1wc1Wlrewm3dvRVUtnpexok+raVugHOIpPf/9egqEFcdIjQDUiJ0hjNJtqEEOkBSbDlpqwM4ldyGvMkbBipzKMlSVYbzc67XXzljqzM0MIr27vGF5nxxV1mp+BugUdj1tPGdaT6E+Z8pFL//tSxMSACkxDf+Y8Y4E0G65xhJTgf/oVpG7ntTUxgyZFW9v/269tPnpRHKgUeM6ntUkTbw1Rz/rAAN0gABNQDRTjMTapkF3PExm4eU7wmbzZ3Qbyj2njMSxOJCC9GbhG7tfZCvGa1OzkmkdN3kUWzUOQ/b3MRte9Xx33uukeAaYaR/8262R21Vv/VGVUU1I76syLMeOJHnUSFQMAAABuDOmkRhmuDQUpZW2tWFUMPvVF0agagyH6cudiWZbrc0inBdmoFmZMXnn1Ouxrty7OnP3/+1LE0oAKIN1vJ4ywwWEcLnWBliA/3t1VDrao//RITN+qWein6GxcYOm4qqsRigyulOwgtxkAgUEASQ1ELO1OEyNApDtTaegrFY6S1p9N51mAg5Vkw5O6mpS3veiiGzsl/nSJ62/+kQRC030KHUT/97k8OU00L/1EH/PggkQBhiDhlGihy0em5BMhYLs6F+9CAAAFAAAAAJiJFoFLUJ9jUHAMhNYElCeDnmHluQ4JhfQolwo7IbMoSlkZJDhZFTpTPL4dPFAYQmgZc5QGEoqCwv/7UsTbgAxJNWksDVVBhKetKPMeWKew7wk5/atJ3Z1diSSPpxWkjuR61gAkAN5UCuLouZuHCTx2iICtUlFNt5VNr0A2IJJSeHS6SKD/e4LjotTjO16ZH7wvJKeDMKSLSIbY2i5xHit/WaXvTZ2KtSZ1Ztjf/6IgBB1IJJlqXkIG7ZMAHwmUGZkjOpHE+cKqPX00GRL4bD00XNDI4BkGLSqhuj5ycBhi0QumYI/zydGAK7simVea5Et39C/sr6FMp9NLjkFoSzy0cZBkdnapC2uQ//tSxNeACwDdZuwk7UFqm62o8w4Y6WyhgqL0nAOZWIqxSzQAgAlwHCKwG4CoOM2DRJ6nDKSxAGkKFvfMnZgdyLgJNREqsbqOtvmcFXySqpIaydvGAlSFzSOGBVhWPBoVDTXlJc6hmI0h5qirlbezqPBR9QhGVyIiXUgUkknMuCEM5nj7NPBgCxcF0JVKgkjAOa9xYeotjDm3NxW+C0kGBk2bzWbprV8Kp3d2llFcLvMpU1229/JRzkktiqKRT7iPMb91gO+oC7ncdCbAGgn8uX//+1LE3ACKnIttp7BlAS+SLaTzDdD9f/b6RHKtyP/oEAAOuPLyXM0xTBWcgWlyMjWCW/Ho/JJqzGpdSRxdUVRLeADBDJlWIwZkdguSoMfGXFySly5V1x7D6u5zUem057qtu4u6mGn6qZ1h9e2IAWMNd5Zz2ooJpjk0nx4udb+T/V6VAEACk5aVYg6oJkYLaEtZ2A+Cvs0l9+V2wKoGjRRRfQ2FHPLjLJNg3MuLRCNd9zVt9aDHvor0Rb51Mqv/p38oCnDLWNkpjNVF6dAYWQoB9//7UsTpgA0lXXOmDFOBSxIslPSNcEdFfv0rAAJLcVVCENmL6ts9igLN4vDStfvc4V+23WU26NolttWkiAekms1KCunDGttn079jNZ0chSuujT5Ywa1u13Uz5cQlqOqK39A1nVMkt04c6BMSpKtE6R0XD5IF1PXY5infpRQSfFdu1cMJ0bK7PFMJtNQUsuHZnvlwPCUYgnIgPoy5EWp5waugsSODH79C6LMqXDrkqw4cYF0sfeUgJTK3otMhtaBUm0uUtQkiPvAg8LEAfRJqeXEH//tSxOmADJSFb6ewxWmLnGuZhKIYGjk2y4/7tRwAADgEmQnBUZFJZhkIIwrGZw7T0OPCY1KYCfeL2XfnMIOjj8yF/mGsWh+V0kPtkgfD9yMsGeWmZcdMiKI7EWXKkBJGZqW9uZnBmhJ17CRSfQrFlCQeicUDtdtwzGSZKrJ6/+79ds/8eMfX123df+DN2Cp3LhO7hvGgnhAEC0glECTKisKIQ5WM3VZl+IMMtSROEYyjyFjqakdnb1CXJnT+d1wqAQAY6Vq8kmV7MSYtUE7AM8j/+1LE44IKgN9k56CvAYMb682EihhRMsnHzcGshaaNDmViYPB8mlYjLEhU5wjv1oUMaWnlTAlFUNiIPazFL60NHjdhbV3NZYNDQVOjhlN1vyUJLV7osEAN4k01EU6WnEALAGAFi/HQlciTHLcIKs9hy3S+ssTQJkFuu19DpHeG1ym+xztorhYBlcFQ6dfC3hoAouIKGjiu1KG6fsGiWne6/11Ltkujp+kDBAgEQwBIUX8cVLlqEVcVxmaD4wZJR5VAeqxg+i+q0i8VokJAKHyeWf/7UsTnAAvAjWUnpEzCiLRs6YYaoIoCmxgoAhVYpC4saKEgKJANUt+AtE68Cwomv9OjjLupjaj3WpLrHdrbHgJqLvCMrs1rb5RKlHIMbwzD5VLWyqleXTctLKH5yeN4Jsk07/L5ta5oTbQ736VGFGmlwgtbiBcw4sefQWZPPT/1JF3ct//qqzIaH1KsUHS/YuoBwE/K5AiIgZoIlwK6od2HICGSqelp8Jx1UGsaEInhiqZMq2szcstJVDOdAUozK6sSEw8CKIfNNAg8Fp3I43kV//tSxMSCijR7bKwkZ8FJjyyBhhj43vyHVMCJF/H9y/7PpABIAAApuUQ7jwCIQqKjsDmY02ywbkiUjNAqRE8CTaEUFGIFIJJ2fUVbw95gZgmgZJlgzeJ5tR0o/qMi+I1ng2MDJmLk07BddlO/4pJocqUP+5a9NQUi422kmkU6NNPok7igPcwIyJfoxhPpFKM1RI02NldLNwSQTpZ3iT8aNA5BLszpokaru5RhjDHOLIjrZUy77p75zDzbvD6+9BtkQ6OTUKB0wacSRESXnypAVSX/+1LE0IAKXFdizSTIwUWObzzzCaxEL+epzK1tAm/q5ZXTpFthkuDSP6ZJINZycZYVGeZIGFgwbfjNrMvymWXt41sEwqIMqLGu6mcy7r7ScGt07dDUTVQ6FOOIlyAO7Z6KKZA8mqaKOg4KKuqdLtl+5QJ5R0CF0FO1CgRFb4pZLI5sMgyn5xNLs5okNRMsJpP6jjHZbYVcfN/uBCtqkX6Ys5FmQMPXOQjrj1w5qgQtf3fdJuxfYm759dxdppTb93Iqf5xCd3fN0/J969GQZDRFhf/7UsTcAAmYb1otJGuBTorsKZSZGKexn/zIwgQQjGrLPYwEGay377rvdngMmTTuSZMndv2T3btou/4bIQyD7KuDat6UGtqv9150KHHnLAeMvW2SvKPgwL3eiZ3wtOjwbpy9YgDGVy6VYR7JsidyXIjJDQ7wRp/qtM+5utKFF9JEzWkSRVX8axjObTMv2bWqvDlYkZHN8phc8yqHe9NtnjdDKbtfKgCQFAAeIXITUZuXzX7Kw78HiYqgOSGZnVB1c4ldg4ezJnAXtmzlavC6FZXN//tQxOmADEDDd6ekrPF1l+4k9ImuVUj/zSZ9n//zUG9guRdcXR1Db5mr6ddhqhZVty91A9L7Z6rnv1LARsSGQmC5RoixREZFGKOTL33TUbBAbB6UlRKd5DFWA9TOsDQQNUTVBGfFgqURbFNLFji7IqAp5O5Gj2Fh/QVNNANZJ6iWQjftyyAn8JLTGQQENkk1ON1IlQKeVHF/LclUIRy8fhCCKITIF1hrpA2spcZm+qekbAgFmiEYJDKBJAZ8WPqVcWe4ih6NznQUvcKM7v/qzv/7UsTnABAZo3WnjNdhlzHsQZSM6Vrvqlpela2M0UNcgHWAK0Iox5OVIImisVYVfZmvGMV4JgOzRy+aIcModUWovcyyKcqzPhFOyXVnZ7V84yKUNapcOIYsgpxRrcXUPSi4VWy7FoVDGAydzOebQZyRvkEAAgADM5A9RGtGASZbiUYyE/KUqYbo17LG5G8lPeDikKPS0yKDiE/Fg+xLnDggoYy05Cy9w8LUOpqf8y6qRUTCpY09EuLB3Cw5CRzzVEa0NRYiIDLyLxRKnhN9BwTu//tSxNGACkipZ2wwZUE+jWzlhI0Yi2at62dd6iqQBCrY3I7Ik6QIcay3zyQp1oxaecbvvkwPiTCfX8lZl7Zc87O+zdvY9bdMLXH2uWMXcm39Ih6LQRUAygQW1IB1A+SIvqQTrZ/ZjdlShexbFPmXmJUndJJuBNde5kBqAAAECBLyMF9BpWjFmF7lYrZ4RAEDutMXGRZI3CiWA6usv10yuRnv8+l0sGieMYklWet37VJC/zrqOKtFbx3KCyQhSZYw6k4gohd3W+qpC0xGUBBxE+//+1LE3oAKEEdz56TIoUkP69mUCeCTLn78f2/sQgAQUcbjkLLYiyZudFQNNY7U511to4JAptgw2BVzoZXbQIgwFmeZnPyr+fyP9afk/13LIGOXC6lJX6LpF6FpDQv5k/S0IyshLCRBEbyclFsTy0X5rBg57BH5zCZs5CKLgDJqKC1hiKUisZqqEdWuvcxwxpaE+MvnrD2vpVl/xiG5qLPxJH5IyLDtXRujBMbM2E6j1jJnCfv2vBr+Ozy/oFid9pZN6ON7IlvrojlHW0rPULzuK//7UsTrAAzQk1cMmQ7Bc5JtdYYNPEmBdAeICJWydHr932zN1Vp+2z89iZXNpIYuDKIkiy4Pu6fg58eLdcplGK/LTMwjCOvXwxYOYfvrKBOUQFiEPoTxmly0CMK1U7QIUkaJ23QRIxOB/MByK5wFCoOFChUGQXEjJW1llozla6rdgcjBM3FYdS9nTWYyWhzGW2yWgcbiBuUdR31tf/v1UaL4wBJ53Bk1KY/Ch9xtLv9AraOf7MJeWlY3ZtoBDoACAGEFE4VLGbWaXj+RpTkw5AMi//tSxOcCC7SRXYykbUGqrOuVhI1QGOLyHY33uAqLVNP8n/duFR3+fZtdEorOfOqc3ZKIOjoTCokYzQV0IH30b7kfUMMBxb3Jbh2SMdKxWyvS4EQqpp3aS4ghTmRVQKhRqQ54yxZ82rgxajuLZ/CMlISRQyMjM4ZRa1mrV8zImS//r+rDM9D2TROEpj7HJ1lnnqOlVfTsWNEVRvdX2QjgcrSbIy28MpuUR7LtkWFc2TOp1lQPdKy7IIRmL2ht+z4a5hX2qHkUIACmdt9ZdbVLLZj/+1LE4IASPWdkDDDRyXKX7rD0mKCv6sD2/9f821vu1H/y/9f/9tXvu3JHqYCMVMLVAS6DuoCQVuEEpMNOkuDJPo4T3sdxOGdkWVRlXsVF99BjL8W0weMdI47lLsrK1nktswOVLM3dM5ioxTKubxo4OBr9SiQqz64S/ocJAI5zWRcWY2oNvKkBVCuaJmdjjdfCuYcFO8/hVDfHiSFAKk6bJpjqqottKSp+EwDS2KN+uQgjOVyZPMEKFvlsbUv+pxnpSt6se//35WcE43kp10YHWv/7UsTHAApQtXEsGOnBLZYu8PGJqMkaEUtZF0T5vtRPevQKrIcTRsRabEjoViGFGycx0WoD+kfn5RC2aZKUiYP2ZCS4IugZu/y+ZtljIVraWhrazwNVfvqRETRF5/KMx/00inaFEpfLjEgqZW44LuHlEL/Xir1XS31KDxl5BxEgsBjGNQp3Am4y4Z7q5VruKYqPiHXi8Hagsm6JrJtacIFdqwSvId7uvyWwTLo6+kVF4Sm0cvfbHtPaTXuYGoqx1efXN2mM0ocr6K612u2vtNpu//tSxNYAColhd6eMr0FXFi308ZYQup1rS84wYtStIskNyl6a3BOSdMVqa/mL3HZedoELVqiB4AEoJIARTgqXl13W4i+I3r/yzH2x9f9RlFn7G9InALbmKNtZ9eT+Oe6//hbEgMA8QPmBY7ujhWsCn1nhMBLKvWsgQbY/vXpIgyVW49d/H0VFsQ2TBbO/buO4zyXiUbnSfQvVshDBW6X/lqCSz2dvxFS6j6fsfvmBAjKFwimaQnRLKGGyKi+gidD/BDGm+YMWUdLdzgxok+uZZab/+1LE3wAKmN2Bh4xRsVaV7bTzCiCE+feEamWKL85T0ezbctHuYQggMUoRTJ4I0qOy8QoplDcIDGWWABBLjKkCACUqgQ+f5nTXIk/Lw1exCjaR2JJX4LDsJlDixrIDzN1UqSQQ4NHn7bYCK3KjWxNbXz6tSrGZghuYxkl1fRnQ4yxO3firXP2gH08sK17KrK6X8WUBACJIBCIlBpiiSy8DixeBWFyhwKWB7ddY1FK25S2UA3oe8Y6qeNK3hYEEKbP9n50EJh5PBkcwTGWdI7Y2f//7UsTngAzJM2lHmU/hgparRZYhcOhMCdqHKHFViEboqeeWKsHP2s//97ADVRHqeuPBkTakdXauVDO2OBBjKPlzQpUpaLkwX0BNeTgBJd254H63GZu7Ty0Zeci0Soiy0o2diQVl95eOUsHZg0isNKXb7alo2svXsXirL6bDEdwD+Pgs6tp+IVOfVKSCQEGhcMuQ1kmIXi05vpaXBL4tpA+lDI1HEB8uPG20842caBk01li9RxbNEjdxnBieefqj8qwaS1Uum/GcZMV8X166Q82l//tSxOIADiGTZEwwZ4liG+yxhgnQUlYR4sfuTsfd2ZZEAOEUOEFZKQpcJJtDiDKhUCZKUAL2Q4nXIH1SOefr+ODqMTFWpASKNjV24g9E4TO6MPlLuf32nkgMkp1yr0d0EFH3Op1WgE2KEzjqt+8RjEoxduioUHRZO3++BTMZkd1TWI4XoWeMeKURyHm/skpJniEJnhb3nBSLEUY/tyRLUtenX/2UmlUMYaVkEXZ0kD5GVsZZ1oIivSlryNMV4W3R7/X0Yr9raIIkRltoqq8a70D/+1LE2wALSLNlrCBvAWmgrzDzFeZAYqFfjWSmzRRt1gSAAWjd8DjQaCZYqIKiDR42xRY8YpcHLjNMhHfJpsG2kxSqBwci7lqk72OMVnsrIdugUruzKrqn6dqrVleHEqFd8c3ONNzc73T5fF9QmJwwo4s10n1n/toCCCiAiCVADil+0hIpyn5kEWcZj4YPRjy0XwWh7lOUbbuhklFDdxlCriGMkpO7yZnI6EgnY7tRHuRve3KLO7e/8lN3op6uR3Nuffrf3/n7H1XZy2ZFYrtq5v/7UsTeggoUrVhMrE8BaJZqVbMekCKDMm1ObmISY916NUiAAv0TaAJYeoJIMykTBIuXzg7Yc5evNV6dCJBDAO9Jw7E3sn5UJpaPFGGDjdHMXur8qftr74ZsoNx6sYjyfTKLhgAji57KL7Cl/NonxTt31n6JNoiEcEn5iTXhacHtrQCEQuycE33tDvzE4lNnMEraQvGQJ7eMWHCLMRWenphikyGEzgiduHMMQMQ3sgA5og4IBr8UhQbHAIM9OxINA9RNB4CsHpJ4KMWHKXCOGgYF//tSxOcADB0Vb4ewrXFelmrZlYnggKbfXRpfw6r80YqihC+bl42xc45cpErBCDKweAoiAyBxI84Fs61hXKSlxZdkedpZ0qYhj0ocbOnrjqNq2WDWpaawaUuoAkHE9RAcaVRB0FvKsrYgqAQVwlHGC1RAAKZtsISzEcZnEhS7lQImFDavvOtCKC1MwYNEEDhc/U6f385GWFRkMG7+2edGY6+yTfYldOlVP7H63XIIiFBJRJpIoj5lVaTFEe6TF3JysH/aLp3CYTyQTAz0chrRO+n/+1LE6IAMxWVdTLBJSlI0bejEG1yKLqrczT9XWbZFuVcQf/IdhLll8Mlbo5D0Iucw/efeLAWio+z9Hx8kfpkv/UABAAxijGPJPpQE6HVPcVwg0dhVbOpnjwpzodgSbhhDbMll+VM0waaqs+v87P/JqjbIJgtNKeoShJQ9am2/Ym+rZZ9WK1Tzbl21NKrMp7Oj3SAEqYml7NlyVB8sxRxGwLCk8ND58cz5smGN7wqxSq7rDdoxXcSan5bpfPxqFIuMOpFCTQdtPUOemkyZQErzyP/7UsTJAAvYdWynsMpBS5atJPYM6HOpi1nr7RKlZO8C6hdzuv+vlQQAIETC8jp25s9ZMJSoIigjcy823lQRTSEI8kbg+PrmtWoGF3C/au7UEfRz/y+rlpnzVYNPPYo8H5l/kaiBRrXuUsZ/Z9179UL0VVptRf9HZaiAtOr2t2S1zB0H22Isfj1OFIXpnbVnphigmNGpEj0HYxg6jroD6BSoTQ3OIgMIYPKycJ7nYf2lKXl7oCJAyMUJQqDCEoLtPoGDjH2KdeygWQLx6s7nqlrj//tSxM4ACgyrbaeYbwFCDmwhh5igmPPIULZkaKEjAIAML2ScjSeM7Z3GkPFtXQ5j9ohs3ReLk0cUkSNHIoE0SRwhNCy2zQUWBfM/7iEooYiWRTVJ5ITHmOf/3d2ocOre5Kutja3VXKtt9MbYpizXk3mYWCwYD4SYf270KkQU6741a2y6OZYGgfAjsuGsJFpLNOLrJwQ9P1dmBwV39x+MltpY2c/Gd1gRTuJKCszYH/3Pv8thfCzi3zn/yci9R4iCEE1rbrb+Zuiq2qZy58wlwW3/+1LE24AKIHFrh7BlYUgYrLGEjVRIdOJZRKCAhIAyNkpPM7jfE2MY5xYR/t7A35SESGP61pmDOFXma8CmMPoxXK5QtiO5+7roRGlferFQwIhQQ4C7qtzsYIJIRF376Ne7V67K5wSHUFM3RO+p+M3HukJh7bXyL18ajdrsL6eo/WzwgLXSI6ejHbbVArYKkOM4wyREEY9HcxsbIzxo7okAwUjmNzyJeW1+vkxwQB0EMjEUDZI9e/2WzfQoqHChfQkHl+SIlyl+sbUTDZGSJoToiP/7UsToAAwsq22nlHChcxZtNPMN3BwSYcEHSDHv8I7+TsI7mMaGbz7LLT4X5o6cz1a504W1jaeZc/7CYhnYuR8d9XE7MkFcEgH4ywQRYSDsBpqtIJ+DBesr16kWCUhx1ESKjkiQEFLExMsxwCwKbERAhUrGkWdXUSRYGhEYeNYAhKdJHRSS5pIc/yRaj19L52o97PvFzvVVADlQAEXUTCBBZN1CuAWxs9AmcDunJCVavEyF9nz9HAtq1phEkzSoKNQqksUpQtDbRySQbuFaQ9pS//tSxOaAC1TjbaYwY+HBrGvk8Rq5QLGy1S/Yso7xbbQfFjLRfrb8nWVUYHx6/rAoIIBAEqEwEmQ5kDJyfqcGUCEBKVD03KAZdLoXLeE1dgxrIKhREASrSJFwsZFAcmXIRXaXSQShlpF2zWtR1+AvUvfu6f7mlkFXuQz6VQGLs9G3I2iqKBeMRmHC3ohCi/GIqWBaSDjcZ7muQFKO8vaqiLXiMLc9MuetiR5IqCx0DlB5ly4nLMLwZTPVXvbUeG8gCuK/RkmvaWKx6U+JXA0gOjj/+1LE3wBO+Vtkp7BtyUGQrNTzDdgq5JXUxaDtIUCuUTKccceTBJiRoQWwmTAqDpiEC0lD3mhRGytPYGgkAHAcHHQigQoFhWHlGxOgTAqQMkBkNKBuGgTcWAgo8aGC7zal9RUOwaoQMWsYI7eYGiY4y6oeEzM6dpamn6EBhKgqxJpIqsY1jyVh6RNlwCxGSoUYAWkgCseRpNrO9n43kUaIQrw3MdF5npltCzOH4qfkNFUiJr5c7+9aLk5Q1QGNHpQf4J9Pva7EA1K5ROvQG3gm8P/7UsTYgApQW2MsMGcBMwgscYekEBtiqL7mWl3gQCAAAsFKMQECX0K1Kl1DGN9TTQKKTUcJ6VRhOgXbFgYYSoLFtTCuyFaocz6Z/E+eTO6ZlSZCLtvk8c50ERHUp6oiKiFPru89zcPEQjBJzRHiB0rhzSpEzOxKLDO/0DCmR4d3cAVztFzSjwATCPrNtEvBqbi4ugTFOhAGALSAAwGM3EIP1+oHrcrJvFVlXkRscDnVbGz+WPCeZywtk/hPZukGITZyhaQQtntkH2LaD0ggtZAO//tSxOaAC4xZa6Y8waF5he0097AEYEFlBEkzAtn0hDECCZ9BCGQQy7owhGc9C1mIFr3xGcpEBpAiUHk6e6AYyWLAegBDLmubOIItzEYbP4jIye9XbkwgYY2aNvV77l53O57CH/nKHnSiAPyEMoKTWVtOKNktsDKAcA1EbQzKGmxIZSkhpAVCpBqOk1TajSgLpsJU9iJBRsY0z6f9+RdnQwFgouwiVrEdTdBRVEBphI4aZDMxWNerSGVLu///3L6pK051LFjlEHXavkhYOvGigbX/+1LE5wAL0Mtlp6Rn4dSzq1j3jDEFQbIsspoCNXx3RCsjabU0BqgQhwDQGAlAqfDWdHstxD887c0FXL+bmkYBs3s5MhSMZKaF/RCqHRnC90sn9tKPs7lb/65d0ffyI7Lrv+vYNY06Sf/csBYuu24tSAgCQaKh1AgIwatArCSwE4wfGxxES6pmtJn0iVHAYj7UVC8eoir9CFp1ik1nq0/5yCWPTHrsz1veiseqUYncqQdGxqHtCj7q9zf2z5FIica+2sqqigAXDGisoghcwsR5Y//7UsTbABK9jWinmTXBpqfvtJGWoA+awM+7MujstdBoRxOBl289pUczwO9SIt0RZjXvH0vozlmsZQmhdJaNutPNsIhwUU60rgVZw+/T13X8sBaAXFntyVG0r0qBVV4d5ePbY2XBP2VwN43koaS4RdWh3SKI6hnOyJdeG1fOAQs/jN6658qhNGcrGrZSFfLZWYayDZLo8n51OdWUqLT5OzfdN///ve38vq5wwKMLYaVrRUVdyVUAMpPM2kA5iqgdbaW0xR4DguECNgmJF6CvAEdf//tSxLkACrUpgeYYTsFPl255hihwiBomKR7bBhP2/cikqNhgufKvf9XNDE+O59Z4ZZn67yktLOSJhwHciMe1f/7UO6BLi4Oh8z/aupjf6gAGoIjTJFlSI4zNnIbG9zQHBa3SWYXqAIHmH9yprbjTpwf/OBB8c2KLHPx0LF5xzUu9yBS3IjjsULw1X6/n71ZDVkzzl66vdf/72/bX6FL2sw6mFiSFbBfYlC2rBBW5Vql7rK4lRx1GMq3JFn6hhcyGxjUqYMacVTkYmItWqwjZdfL/+1LEwgAKSLVvjCSqwWOnL/z2CTTEUXbLzDlsmw8LrbO3ao4q30bupBWjMy3bZLJKk6k3nVSO7kXLtT//b//TddgUUCbm/7zhAABUrxGEokpmFC89Ay1ljgu/DT1aPAHwAUeQwCFgQA9Mz5KH1oV5Zp97V11yUlWB+g+vvfvYjbNV9aKhmp7mIm0tHsjO/7L7///tT/t/lZEh2cwJFCuRmUAjs/0qDCdc+btrKaonC2oUUdCkc1Or8NiERmf2Ira8rlsJDM4otxVMznNJ7ZCZwP/7UsTKAArAn2uMMQWBcCgs8aSKGHJMJdP+J87adQkr5LIWpZa2wgtxRu0+3Zkp+JTd9/+s29/+9Im6UitDy0Q+u2f78bgAnKVPCQRfJvKRrbhyib97ZC/teEHun0ovU3i31r+JkC1uTLJTD7NFZlKWgm+OUimZMMmYA8AYUF3leN1gImXUj1+OSn2XwJXoVC0l3iQZUlMOMWrkcdTtaNTPOVducWbnKVFe9NlVLs6jGapf+yGTuls3sXyJqtbOb9W//b1ZcoW6z9af6vRVAASU//tSxM8AC1E7eeewTyFvp6z1lgk4AACEN2I1TCFrSAkSBosIAyDojHRTAAiHkUcqEKhrCWa9+q6ZSdV/sahqPLSGSzgEGyQNFqeys2w6GKHvyP7a/uuigWpDyTLf8UZSeVZfQACjJEeWf8pRalwI0GCVhbm87Y5tOYuSiTikISyLJR5hcpDLJg+gcCK91KTpkj6sO97JwtJAiIorW7MKbW4QFBj7kgEpSAkK10WsvvJJIJvt/T0qAEzgEqcGaOYm8lFNJlA1PSAVR1dHhULoAZ7/+1LE0YAR/aN3p7DL4U0n7WGECbCX2V5nVHFBAinq46GWVymMloT7vp8tHBugKUrllM5nOnRP1V7BkrchwuLAX/oK5faeEh4VTujADK81t/wA+hoG5TKMv5eD4F5XRJhIVFM5A42+pqos/brX/e7BJM73KMC3yOBew+FOwnhU64ah081MtrbPWYHQSeuaR0PipX1oDltCa1/1diOj1RAAcAK2pDixQAkkMEuFNtdeGTR2Dn/lssYLRxeHMPV6BFlfwmZJ0gpKzZi0W6rMm+X1fP/7UsS9gAo0bWksJMTBSw0tsPQN2FkoczgIp7xpxJgTqWoXLJfFE13+lS37JHpY02AFEhABBTgMoV2ggDgFqMsYe7pKbNC8fFmA+DOW4XmmFHI9BI+HEDkgQLOWCK2CR4fckElC54Boi3eIxcIa7f/Yt0mhk2KvDlyQ4OMG2sQkZlLGSioAFzSxLdRYaRkNgqH5GFInDnesr5HPmJaCGvnLjPvWq8TvhmagkLz5mxmieLt6Cxo3YIFheggkPhJ63m0vVNKks/a//yZMIBxm9YqV//tSxMkAChDLZywwRcFJkWzk9gz4UYSPum2Yr/pAAaiKACC2SvcFPkShyqcXJ6yn4WFEIocERAsB1qOPVAJQNxggQAQw4HX0Q+Ij5c09C7QMHx5QEJAu9xcHDiXmFn94Pg+9QfrukIAD5/QXmMPygJrRrHpWhwIBAQXrANCDA+j5A4Ehc1Sb4EiB+O1iQTCp1o3iYkiiKMiOgKSkJswXHSFA2Fhd6jReVjB0suUTCzLSrKFQ/ViUJUTEnX2LqiL+7Nh1cPP5hw6n2OlD8paMyUn/+1LE1YAJzItcrJkOgU8I7CmWDOAk3SPjc37W0/rkcn/c/7aaPLSV7GnmDIufU7Ky9rR/2JMYlQYwaoBonNR6HMsNZPkGvmkjnJwQAhBFQwl0G0hjINHWnpwWAiSMlsJSIqTe5di+d3OshDxUdzjyjXP67aAmeYdd57N67Wrec1LSSAoCaYoBEzIpNNFpuDnJaTeAEboPrDpMrQGBoUrjk+chfiabZQjNE3KFMnx3I7Xppqojtrpt/n+eP6D4KXI3jUPpSW2Wb2xY8ejNBI7VBv/7UsTiAAqIdWuHsGzhdw8tMYeMOIw1ey73Ld/W1SgB8+JJCbdFdBEhBBMTqQsDVU7eilcpkbNEjJeI/iNdrYxGkQOZaSENUBipi28scBLQZyv8IgW6089T9NcYRaINkhZKjF3GNPtVZLVqHB1cxolTodQ49ZWTiIO4igCZIn222kkqJAhwO8UkZpnjlNcEKl0RQrefjHQ9XIRxpUTn6XB2vfkaXiaqHEmU8RxkBKsTIiyFFSLFK4mljohRXcZYJksYJksfe8VnX7lKANOtU93O//tSxOcAjtEPZAek0QFEE62Y8w2YK7Fkg97HpPbakEXcn9JLI5OK8YhO0of5uPimDpIYoIvLY5+tRuNJat0YrwUvX3MKq4MxOa1IcfP0jKxeZxITrbqbtf1/1Wg6kVPc2+mNuB00s9DGiYAI0PFvSic4lHpQ5Qey/3UACSBVyOyR3nuQsutDGPgqmk9Vwo0ibUJkjLcmGDKTfWWK/+4yMGvg6Mf+QMzF/FYXVmzqqM1UeOapSt/WSuvGzkwQz1FgsSWl601IbG2GhzE2uxrql6b/+1LE4QAKeJtxp7EDgXAZLSjwlpjAdGBpCCqN4JOLIIkFOsFQHMphtrlcgNNmANieHRiwKGwOC1yBRve41X3bfiH81/NEaEQ1aVkQ8m88tbc4eynwuvc7nl5L7H7GVSH+RZoSc5VhgjLSCa/EIoFDBhde+NMRQj2sg/WFlQIEAgBSptDVEZGhK5WilsppA0lppXLpmXRptb9FPXr/L/4odlskM7sryJVEBgnPMdKbma7L/nZ+T3ap2a2tf//fvT65U8y08t37Cn9imTmM/NCQ4v/7UsTnAAvol22nsGehbZZt9PYM9BU+ukWOgU8Ob6i8O4ixIHRXehxfBnh4BMClJ2MP0aCXVbiW9NMsVyYpIrbY+3K9LYvu2vjFcwKaj7xfP4nw4Rl3//5O/zp/n5FFfu6Vy4VRPK793lR/Surl/701MnhFCbbQyeuanZwvT0lLpwRyIGUTGZq5dFGcF9jPpEk0gfCwIiY5AMTkkwnSRRIwVpVUSNSNNNAJgUsMCIB6oUBQfGwwIgUOggOW4xLEbkdjoUJ28jkeMcPOXmzUyFjE//tSxOeAC8zJbaeYbuF/n2wphgz8n84tFGg3ELcEfZ2QpTEz9rRZZViP9nbgQcR8nBmwFqqgAG6ighVLMBUtHoTRJm+zHy1TJBMG4p0hoBIAiN9Hb9s3IAiBaeP2iDCBALCBwXfehSRcLAgIXgUuJVwpJAdd28qLNW52793o27H2/XeNrmHlMqrC2zW6Mu2RzJwCJMxXxJieL+JJZhPkEykj60bLrL4DTiA0RHsShowWLG8SrAShaeTQNcda9ii1Z2lhNTyMGfULr12by05eLjT/+1LE5gCNVZte7Ahzycuz7SjxpvliRFc3vWKwrVeABSBByYelJaTINJmlQLISjpXXd2xHYHlVhTSYOi0D51TZ3dlZHXNCyDqFG4odSSGXY3IZF5g83LYpZ7dv85/nz8hmEc1caonkW3rFUvUl9SRgEmCg1qhNQhBL3JpBC7xuTSgxQD0iDswaAug0Fovoymcv5+mghzcN1wxGcdUdfVLDB3u8r1FnN7f8tQQ5IRNT+nUiNYpa5ayvbL1trmV36//PZkfrumzfJpZ1Hp6rDH31Cv/7UsTVAApQl3PlpGVBS4ttcMeYKLElER8OTatbFMMcR0uZ2uxkKgwjEVCsaTka8JbZ5SJYMgSE5pwFrQm1s8tr7cOzfMemphz3H3GfseDKGMLlnUVfxoCZDKsTFhkOOFpZHQoZGEkuLCwBYXARYSwcsciOfO9dSzzavMUAlvJpXeoz1LPXwPLPJDTjLRVnGcC0kVUpW8mjg0BULvErKdsxjr7Fmv8RtHIn/szUTONO/zM3t9fdAkRCKrZVoLIsALxjEHnoVcNFN/FtpH0xPhBs//tSxOAACiQxe6Y9gGFxmWthlI3QVGaamFmH+i0QQpZkdldtccdUhxmczENS4XutgufxJ1V2CnmK4IIXnnOqBopv6MUHBKXcizYn2uV9UKVJ5siWzzn8pP06cQnI715pmf+foiAIpccX0d3Z6gIQrIZMQAjgAHsVLuxdIv9ebHQQd0yAwgGAHT+oGRKLH72qAJVAWpBWzKD6HcFYqyZsyIgw34WicYAk8IKBEIYgQuns+0+YnbR7iCyE6hzEGQte/eBzNXuOLKLFjjZ2sg5mPtT/+1LE5wAK7TVnh4xTYZUZLLDzDfSOAmI/4eIawSIav8YOcYeDpNtuePqIOH9tQAfHsLAGCIG/x+/Pj/b/+bP43E7u////TPgCV/c/UlLDsOc1XQ6OneSVQ2/b60lG/0ght+YFjUjiUaewFlATWQF0EIkTRNodIG0KMHCFoFT5AKxRDMai+GIopuUiszEhS6G3wW8LSjeDUYnnRj4rMxnOUMkVoZ+fq35wqhZf//y8OoUwEbcZxzFwkomCZOUcxdBivFlAHrd/m1PB9Wx/dSFvgP/7UsTmgAuglWOMPMNhyK3t/PYMtZElICUZzgTBxV6cUFF0zzwUwtNuHj2C9+Za2A1nUzkajdOiEMzH3kz/6ypRZoBHmx38tUWU1KOrYJQiwHLZtxVKnIfODPuqep6QQG6rCtLAnMC9LNWHOjGwnw1FIeJCw+W1E+U2zKms2p9o5odgJ611UGe2t/5Qz0jf7yF/mfKRAhNDHEUVCZbohLaLf5JisJjK2M/LOZVmXLsYEgm9bbckEIyslay4r0PzYHyYUmhLOhLJAjmGa119ftCr//tSxNyADozBZyeZi8oUKW4lhI45nZtAiyfSZCOKKLUzVZmaRnLPLQ5z9jNugZ1PbloJqYDRNaiPtW2k/7WVfeiwXrF+FfcABCAZmx6g7dncc2H2IBCVn4ExkLn0A8nMuvCcdUilDFERUucS26Ecc6O/6VvRRkrTXdT0/MDViraPjQ5gKH3UpXNOPYYqUokhr/s2rLq7LyMjwp7N4lfVBGqAEtyO4lUtduc/SQND6dxojPEwDtsExttMSIdf5rqokePusp69Lf7vvIbGcTL0/8X/+1LEvYAJkKdzB4RzQUWVLnD0jSB3fUUu9TFA+cApQ9CUeXUI0R9v3V7CWusYouZos4wpYTJzAjbvM2ORCCCU3eEjjGAq1CqjQH2lFY4KEvtbNik3EQ99QLviEqKTwMCW1xTLalz3drkdHcUqHrT6pfv2sGE4oaDRfpkFG1Xah6a2pnNFyjzA21xsLhsXKAEGA5kJ4a79dKoFAAABKgQQHEBw5lrcmLzlyXzrPV0/fMLqPETI5pYDyB0OZGStoaEF/iSxMgAkWUuioxHuzMD6///7UsTMgApkp3WMMGXhXBesoYShMJpQdSlwvuf2gI7zRpNZmtv19KppvpOCJWiJrbhZg5Qkag5vrRZUYOnQaAVIIxOhMPiGdk2IqnOqsKqJ2y6rq/v3mUUdd6QSHzLBLmdWc+w2MakmjtS0OeuTAYtUZF0VMgcSo1CYcUQs+/syzSJ13Pdtg/r0VQAC1AAAAU3awjiFqdL7QjUKWWVyowQprwK4Zaa/rA39aliKiPTXBKS/Op9mn++vvU+ntxldtuhz3xZD0PX1e5Dsq8YhLSq9//tSxNUACyinb0wlBwFvlW1c8woYx2aMfcfc/+uTbAdak7j3Z9dmfEzPH6BNuqhiyDrVsnGrl2ghOX9smBDD9IQgQcBBNwkE2BEQAVkdAPJODMmiIw3H4e11EWSX3Fz3/qsXdPkj+I5YSchM/ykU7Uldy+T96eHr9COclf/8/7tnCczARBQcRMCPWam8OKBw6t6k3gSuCqoDAECPoKwKgYsfyHkiGYq1Gsc3DGhGsSopG1sIhkNgpD0oteZNH3XLFkw44uGHAWYWXcKuG2Tq2pr/+1LE2AALKKdi7DxpgUuY7yTBlt5pppqQPQe/8cgXFPcXOpoo32rxX9NBEmICPwAK8LdoGUFT04JVB0WgZprlhZhtGoY6Z50FA7I/GnRRL1nL29bz3LTdn5eeDybGBxaij97B9R2u2LVWdWhWN5hVT6OAvOLd/z29euoBBQAgaN84HolgQBO6L0XM3zhc3JEmglbBXsHlk/sNMvgaBoICp9248warcE3d2YqVKiMqMVo/b+zsIUh3KJCodE9rbMoIofKG0N/TERwXa7/p4CPDlv/7UMTfgI6po2+niNdBT61uMLCK+OhqkLVkCEhqRAABmYgYBnbcWP13RBg8HrJgeMLYV9hhDtBdm7nvLdmnHopd9ZjIjDSjMG04xttppY2w/bnWKGHKMT1zJ7l9623XRg0Huao9de1DpL2cvcDQdUSUdtTa1P//itUE8oJIUMcg+qNENN3ahFGxN9ZHc7C6+my91aBCK0EWHNK7JfGSVTyWzCZlY/A/5S22U2Qws10ItkTft7sFibnA6NuSGnJYoJz6CusbUvjtlHrfJ1Qi4ev/+1LE2AKJ1F1mrD0DAT6QLFWGGNixJdow6RjbHABNJCEmq6BSqWrPbplAkSeJQFh8SA6LDZVz0gcxML3Wl1bzxdPhjC8oiHdzGctWs154eoeBRoUS196DRsBgQaww+/Op+oieEKBK4DonUpiyHp65jaMhrKzpGlUE9gEEVMeZAiZMQbxyY2vMWkcwEsguMj+WUuBVaCu4SppuF8UNPdaiEt782cHIRPEXAAcElvfctU0ExrA8NGIUEEj6mnHmMUWt0sTQxUnYrlxdG1inhoeULv/7UsTmgAvA12eHoEuBbJVrVZSOkOOE1Lii9jrgV2gRa+whykKKhPHh+EFVCuImkNt0uvRHY36f30PLN3QxQ9tEDQi+nHDvZIjmeegAh9N3d6U+nXcE0gCBiGAQEAJg+oMCcTlx4fWTPpHuBDxjIHe/1Ib8Dm/4n7YgYcNgCxEiU0CAR6AAljiEfm5tSVI+7xMVfSDq7EIq47vy2OUOMw6kcZjCnDp7GU+46PBhUaBAECzBk5TCFLdmKB14NipM3wXRnaMtox9dWzBCeA9hDXDH//tSxOeAC9ypZSwwqeFpjmyphgj4gdz3iLog9rLkfZxC70xMyLtBGEUjMBFOXfj6/iC7m/4c+ouikHvtFtHP3/cy719e/4x3TaL8Y97ER92Mgu+eOdDwIhKACiwLskCEJ5SF+TDGhqvUKHL7j0xhujA1hvGN95emE0NwzeXEztvSz17VNjz/4an4Y1XtToJJQtTbnb53daw7sHkNZ0l9HcIlNcw6lQkgCBEOirCyd9VD2C1RWRB8MiQSTKIiVCJGqRQ82Jx65tZdminHuMtqPEL/+1LE6IAMEF1jLDDHoXYUrOT2DPA8v4RH6TP6d0CFTL7vocNP7pD65+dMxwTbN8qQxSgQ7+1mP6HPa7pAzRpVVRU2kUlBkIoFQSJwxD4UGYrJZZGoxMLkljHVtGKhRE3Bjum9BLEpZYOKPGQCilKg4aYZSsbaWnl6EDHseDJ1pkfcaxyKaHSuLfdbcRd+d6UTABDWBIwKqCh0DEABE6/8shHkmMEoPaFYnrIFf1Yg+1Ps9U/5nHdEhs9V9/q6tYGaADBCJgcNiVDR3c0tpEkMmP/7UsTngBMVkWAMJNbBO5NuJPMNoLWCWqR6It0BJncjYYchSjH/uWKeCw4qGmABCgkhaqQsRXwCqGC5ot8f6NqHqLlcwuvL68GceWa/wK4Y4TBWtBAqg5hhRJVj2hkiFClJy869CCL0JSnp7H///Ph1KgABTIBIRVPvSbBtMj2KkL8sTZAjoiLQouuZEymGl6xvcRXK1LMMdlbxnJiBGl3ubEVBaNQVZH5scvFOjihFVbERDJpMjA4UGniC1XmXMjhVwpTbvtpeFDSEp948Owe2//tSxNGACkjdaKwkZ8FOCe88xgzkN/vAExEAApOU7HXQpIxhFQI/s4Z1weiOTQoA+eujriGYHrz1fsiQk2PC47n8ibctYRBiRR3sCkffzSF1L2TP+6v7yQ7cKoPgsZmpx6TLWwoQJ3AygSFfELoGBYlp6Ejy9K0AgQQCCE7jDwAIILhNqhKHgSmbGVgNAVWBNtxyW7Qp5aKfcilvh4Fz+XtzQ2ZTJAANCYADBzXBoNKHj3lUOxhsVihhizB0fPpJX2IucGk1u0Eyzo8TRoEWXFL/+1LE3IAKbHNizLBnwSqOq4GWDTBKSeUNpm+77wCcAIAQU2MW0qBCoKACqjUDw4CFgxLJQKEJIfJ7NaQY3Ms6/A4TUwgIA2lBOaiC5rtwQIEHhDa9IGFyMnQZBAYXbQdRiiMLoiRM/c9QQpBaOH2H/9X6urn12P1GL1LKQIA+KwoeWQJRbhi6kUaba9MLyQMLzChKCerrQRtOhOM4dgvJelOnTaNtvzI2mIZ72Ft4KgAAj2I8jpUJOWtpyoi5IIgQAh4aEo0SihAZmMoTcYI7af/7UsTrgAwoh11MPGfBfhfrqYYM+FxWFIVpQpulV4ZMtQzITFqc88T9kXJLnoT4VYZN933+f+UyLy+K4UUZNThISYKmSCLXqe9Ir2J0/cq7xxyR0CCg4UV7llKdFpHc03eixclM5AAFRtAaAAwVAwcqtss0mbcAoxwHCcKk5pyQ7AWTN/22tuySCWOmvrXf3jfqdpW/FhDsvwjnnmra0yhwUkRCX3NRYSfalKuXv37bvyuVyq8M1PueCBajpTRLJBgpoSolAscApC8QHxLz1BV6//tSxOkADEBfXU0wZ8JlLywpliSR50iLgMuhLJeWf44IFHgh/kprmizw5wmQKGVmBU/sJCYVBgQ3lfVWy8Bryyf/9VlqWP6gEpzaiLhQyK1pAABgACAImYMF1wu5airVaUB0cjC+WTIfyOxc4jXLs52GuPd9xQW3KbW5DgllVMi2w9lQfcFfgVxS+RSG55xxi+jbrueqW1dvbt9j86LjGkp3bVUABgEAAIj2rCkSlAWSzEZUdUgOkcsm5+crDMdYjmr11ne6YxURx9arMQ9RIS3/+1LEyQANaZN/hIR2+UqV7XGEjPh3pWDxUMCYPOQLIaIz6RdxgkhB0sw8xmTR6fels41DyxxH/3jlLrSECAAAAMxIwYaSAF7QcAtdkkWLhQJsnBN2RleUiyzcdWZv9RMJT506eN1iPCAQrFg+SLh0gAhKDKpoTBcUzrKxakWFDSNb7I45o/9n1fuOQSZSW1oAGQMQBEqXFrDwEMkmORCJSLDWHM/HNYn6ixcsPX9rtYO29hMSkmYGRMHTLQw0eVjhxxaWQ+cQLO2MlAifIPNDMf/7UsTIAAqAV3GnpMjhSY1sMYYNMP9SITf8SsKbhWX6ki6S85smVegAzEQCMuSLiHK9Km2gaASsD8EKFG0hbSaht519T9h6mpQx7rSiPdJbItNs6kIrjOCBoKAzB1VwQwx/0kwghlTamzfvIqq7vRrHdX3P/0a7NR7Md1OcinAwN0Bjgbu4JhZGIpBF6gBIjphx7NT7AQpaREbBBAZEM7S0HK8TPmUL/azAuZDhCabZd1F3zDViBhaB/bxdRpWe6PZBt7ZyGc8iWUBjijHOPa2i//tSxNKACoRTWywxZ0FOCetdlLDQukmLkPSSp7z4xmonRrUSRXf0P/7V8jIrd3UjO9ZyIRCoUUSOO4nLSUhDCTGb1wEpo5La0CSEBZkdh0LY6ERMFIDRyK1hLOR6MAMgFgWKzsRTpoXEI5EIsDYFBoDwbCSEh+Xh0PS+WuMt6PhwLjsU0ZuH2Q6LXB5X7vVGNZwgw1MSC1oYbycNo8Q7x4piD0KiiodGLpGEjVIZAhtP0eKog0TOosyM+d6fGLqEbJeGZlAbCzGZKnuhsVaRCBT/+1LE3IEKgElbLOGAgbQubCWEiPmnEjP4poyytocvKuVIFhnLg4nQBJU7tTF5I44ibn7FaYkAKXAHNnmDAiKsD9pNDY52slIFTh60Jyu/mv/acMPNArN9FKHalx7kAiHDOZqMQClkNJcnaTonouipPFEsKfhOkc1WVMW6iwgo6QleLXKQEZ/e+rHRF+juGzVzhgQFltsRNsFkek2gVY6py1ptbttFDqK/s5tQXUwMzTPLVQJDhGQ1FkCJGGaycHYFDYFiwMT1cgNlsfDFCjqyTP/7UsTaAA1Ba22nmK2KGDFutMMPCK+85dAa3ZWdIojo/TZZ1L9vdyrdBoHOnFaVTZV1KQUWVXQxUOxX+oqdDgeFw6oyh5Le35sEnWIoDACIlBnpVHk0W0WTlWKMUANgcYCzD7aJc7l6UU9IBCs2FJ9mEXMlwfpiUiecphRAcC01hFrR7Gs+/O4t5U6EluVwnd/bXaqllfv1KgCJGURuKjDNpZSCpZW6zR6o/npUEl8nOkze3FUsRRe1fvOhj2twS4M2M3IELekvoI//ctnoIELw//tSxMAACiRRfaeZKwFQEm848YoQtGLHnYnPECwqTXH6e3Z2fy90iPo0L41W+rZkQEM4WzGU2ymBfPpPiQj/jkxURUEo5TOJ3TzJg5TRM563N+VgxYa2KN41Haljnl316RzBn+awTA2fPXsYWDhZNYk55rNH/X5XYGXr2fduts9VAJggozQNqVIvQme5K7R4w+RWIMJaKQ9+zj8cYPOwofJPu+HIcS5p5WrOKQmmNqK+PHiiyCAECg8KSLqTDS9QSpTrUed0TUs2jmDMGVLWCpr/+1LEywAKQJN3x7BDwTySbfD0iSiiLVuTLgJeWRmJIggsZFOYKoMmc1WxdbDIqyHQ4gieBVAcNqmffQaWzdwcBtkEDtSBHatOgnHo19obZKV7qzPWw2qeL5OeYE/vUg0hDgboLu60CyBz6/Sqoe2YX0L6VvNVMbP6FUEbrLXE20goJ+lICSS0qQgEZscA5RDwhk1aqbUc2FqNqmv+0P5pW97cDFIEQrlyaZjlztfPpGHZ8pPW2BP2hdOMWfmRG76OHdIEOK+D4Hf0YfECyajbC//7UsTYAApoj22MMGfBQZHuNPYM+AIFI+6Jf3a3A++7VC2iiqBVdgVhgjEBEHZOOh2Ng/SBLxXaJphVZt0X2mhvIroUjWMmwEfe6JZmO1nZ0oFvFCKSpV17QlaqVF6EHZQHw++Ep11tTFoah54qm+lKEqBuHi916xBJksqqwO0RFAHR4exnIyUlZ5sZSJCVwQlPqPtGI6bluSOyavIGLu9VXTPX23JS2W37p77DvYYCjw93zw4ovVcVUb3pvVrvsbfx2BzybCwLKY+UjjQIgutK//tSxOQACpx1ZQww54F9k631hiE0kEBQBuUc7oEvb7HG20gaHQ2jBUGxqNaw8EgwJQCzBYbHC8esy0aXOVpoC7IWsgEQlXLL8yqB40IpG02yBmGzYGCim0OFmRgSZMHRWsMG//Y3FR9W8dRaYOgPKqPXTIyKSa6AZkBFFeoxy+hJAJ8uAQsu6oJ2M0gqFyvEHIxLtI2C2K/wbVZPUls6RD5QvsoJikuapEXBDiMOsPlgOReIVBY57tAsC73CiwRNTqKm1LstKMiEJrWmTsf7jK3/+1LE54AL0Nl3p7Bn4X6RbvTEiaQGRRr0MPU1QBFMxBAIEAxnL03Baj0iC2nHowTaVbwJIxrZJDqAhG/dwjtis9uwfYPQy6yDX88+iqCPdT/PL1vU5L1bDsIh/Xu4YPnXHp2N9rt107XJIYHVGtNISYkoiSDAgTSkl0UAQHAAASVA735cRzAxSWiyC1IQrU60NCM4BWek2ZsQOggSbmH0J7wtbjvhgqO0SbmFu58vKSxYU7UMurwi/p+2uajMhwa5lP2fOrSL1Fq5Zn63MQSUk//7UsTmAAtgfWksPMNBaxFvNMMN3GmmZ9AGgbayx0gEhxLmTo6J768GFsalqNI0iiojfqcG1qxv08aDXn/ncfq73XukxyMKYIEBZKald0Dmg3ZVO7GOi55LPa2iI1Ot9//op1q9qdkdfRhAfSZcLFouRUMOOQUQlc5k+1VhKvOtxqJEOpg7sNJZEoND18+SC7kIUTbPp8kqn5uN5ao5jmGOlHKyMdT3IM+dnuiO/owixvd0mWrJclp53ZX7cvr/9///ulD1eQ/lczP1I+rgiv1Q//tSxOkADCR1ZyekbwF6GS209I1s7ZBnrS6gnWgFnHYs00mnFKgzfP8OqCuDURxiMqIMBBGFo9nj9Wfbagp4jIM4oJ1RI4tRMUEIgt6aAMRDd8sxxYBKjx4jOLh4WMwkNICpRxyHcdKK3jb0asQOcQiyDbu5bTHPqu+rJgAYEmpG2ik3AJALKMIATjzVqpL+RtHywlQvtLIrC3sxsoW2OFVI1KtCR/tZlsl4XIwwm5G8k6pLFEQkXJBOhISZDpOyfMrNIFUQlAMQwqhA6HTYdWf/+1LE5wCLPMFjR6RtAYmlK5mGCTgorJrMJSNbxKlpo6HQRYRztHrFG0isTw6cT839TBp0cD3+XeD07B52GF2Kne8zl3dAVSWAwnAYIaYGoNz9YFQeHx2vbPTFqIfBFaqQYmFBjgUmNh6GvMZeQSBiQMkCwWgIkC6AOcaeHmmxCl0kij3dtSFJV0jGuIiGwty3FozAj3+xdQKVABQEwcYI2/JIcDMay+ZrOPGyyqw+VRn2/TNORZMlQ6V6jNRirFS1+zf/IjwQO+sudaJQd/WrY//7UsTmgAuNeW+mJEnhfg/tNPSNaLVzTV+j/v3o4UcfDFE6gCsUkkEpo63Sm201FQTcsJgG5AK0tyfMMTCIyWgjaMoZuQJesEDLEjpZRmQ55oKq2HhycqvSsZFLy15H1IhoykGioySuy0d51tswV/K+rSpKUqfGuzNFagCtLIiIiLhHwe4DMpThaB+muTQFvnrYrUDqYNr059CzEwyj7h1wKPrUZDxlu89xsS5SEU/vuvWrRX9Ltba6k57mrdV+qzcrLvh+6ndta+vrPQlkHFGb//tSxOaAEKkta6ekdMlIi64gww4Q6/xjKj5Vu/63AAGK0BAADivWShY6OiTV4JDMUmKCU1CQvG6mCLBwvkTs7YUXDgp1WlAk4kbdy6VZq0rv+Q+zmu3p//eva2bvYNi99TrtthHN79l3G0tyV9LY+Zv8df13i3/D2l7f/7UEnEYBAdSlVEHlex3GdLKnnAkACIDRkExEji9eDCsGpOnchGyuNrihgklFqxocUNjU3Nmzw59JQxMuQORCLmXJ9TP2zIPR1rFyroo4ViqR7lKP/kL/+1LE2IAJbIVvJ7BjwUwUbnT0jSgMwmGVsVVOzrmtJQnflMAFgEZBCRhzsgcKATBAfJOKiGdJ0uhAglt05O/aPTi9824O08okeAv6qVatLPKKYKLPNojRw4uV3NJLgJqaEgCsnHsY9qs1ZuSu6dOqAEgSABFSYE8A3AK4mWkQzuZeQgwKB5TNmAhlrHFjzyHXnaL76KxcsLmIIpBwEV/BqUZ2VHyL82f4aK6sEdV6Z56relv/zYYzLhN2d+2dSw8GXKGp908qvFzba3LrnS/hzv/7UsTnAAvoW2uHsGdpeIjs8YYYpfJwVDBsWi8rrDavaASIEIRBMwQMdov1SSw0Dh0z9WRVer469W7ysa9Hmr+PjTe7lf4o/vC/3d/sbIAAMMBTHMS5Z4xs2RAAPM3JTfx5jyBn/kAC//MCABYxiiJL2We/pJ7vfCCiECiJQNDFe92MDsFYf2QKGdi7wiJLvBANDKLcXPR1CCAADCPIcMRBHCgvYkRnrd3ehqG20lLEppm+MRfWo0yUT0XeGy20exZ+/bbsRQUURkbJKvxpGcOI//tSxOYADEDLYywkaaExjeuJlgz4jRVCygxz5Yr7J8lXpenbOsyV9qSq70pZ0XNLnbTaT9OO1L6/3fG43p5n3/leXaTEaxnRecUX3dI9GvU9wzxv2kLrbTkqXMSJcKYjlN1GiRXljblHSCBLVWrTYBYDZMRn1EFZUJaugMBYx61QmkegGaIyXCgJCIZK2mDSI05ix9lxyilvT5RlMtJAFwcFBjVWAVkVxpe4NpMVE1BkepQsysvzakE7GCx78WXM1X0zvx+eWgKhkAFqgopdYjD/+1LE7IANlVtdTDBnwdsz7SjwoymuFe/u67wbNiggBuDjxK5CK8a8ptj+iq0oyHHsgG2LErwABnLoDUWAs8xA8KvWfZoaFnXrqm1E6R4o541yL/l0Dwkeuuar30P3esEIOtRlNJoxhtI0mBlITY/n9FRM8XQljYDMxMJfFk/9DnGvRLDWlQ6XFxSxc2DQcEp4TqAzDxBBPdYsvsWAjh25CrxS9aNyagCeAbhRQsRin+S/pgGIEQ2ogLjqDsPU0i3KlENZyKVplZWW9ErTojcLIP/7UsTYgBLpn2LMJNSBTYttpPSNIEGGT0SKbmrr0OQ9O5F2FeWWl9HWecOJjUNM0dN0gth0HWFRZlLGEAs9iYrUL9o0y6L+LmLXdAadlskv6WxXgxjdJzU61gxRxKpOpREqYJiV7i0/z1uQLeeetHhkcBzrUF3FzKBQLEZE04yZiiQaRNcyGa4pV+HRcs/oT3KSkTdnzieXd/rqAHJQglEpwLVBy3sRBVe/zXZaEkeCgkshGoLMExBODSfag9lMUzEF0berNDVqdbeiITUFUtc4//tSxMEACohRaywkxwFOCe709IzkEy4cXewu91aGWpUST1uH2adKdztyFWgE2pzuXRrAvyASBDAFhnhCRrBwJXEMSASGuhbIhkeF28BqsO4VFkfGa2Nid0G8o0uVjtEQaGGJkkMYeS9JRfv2MMIiiG16PpLvTacD//xGTMOeTQIaxc1dpEEG+1GZQsQ4dVEpKZr0sj7sQiKWZnGWT+HZ5wMEWjTzlOJS2Jb9M0f7LI7FFl3l/rra13v2d6L8n8n/+u/kbtdqc2hK8iNdqC3Tx7f/+1LEywAKhH9th5hu4TyIb/DHsC4gITgsDPMwtu4QpxXP+gJLJKxNKxJMlZNTwalAeCjU6nYCWgZ2rK4ORkjKdp0xpJAEHZnT9CSq1jb+OOGdDt/239if5h1/b+v/G//fv2bZEwnY8KxIDsSzIYlYIB3OETRpkTSVHq9ZdplfOamX51TJCgimanUBnTfJ/dls6bF49eJ36Z8QnkL/T6E8qdjZ+/v+hPWGuKsHKhF4ICEJeA+EKXQk6NeKesdeONYqHhTDdm8UnRxs9qkpFtKidP/7UsTXAApodWNMJGeBTo8sJZYMcM5lK57V/glRhRnWLM6hK+kdD4LFFjwsDo5ohBUB1r5KcFLVlUjgmAu084i2ujNWlkXbB7+/PkApLZW41MtxBJywsZA5F5HCs4DRKFhcmC1Fk20Ek4rxgJttczEz1ew2yYuch06ZZllIKrhQLlkpKsCYqh1XVfV26ep1+TIuoNtTR+2x6Yaua3qqCt1tkpcaRAYkA8juVAR5kHpglGJLLmHyQiNoVLQtPPRfELYVOGpzwb5GSmq0p8/+1jBE//tSxOGACx1HZywMT4olMe509g5wwXbBpLkk0AFddxVAthYNVoX/sfzp3Un/iqtZJGLAKgAOKxFJNlNKDOGENzYe1qtMND0BJRAFmhUTSUkQImN7agGqxy2LIU21Tp/mLIFRQiwwIhUa5gg4urK96A20yzXVQz6qTyZn+mwkoyeeCNMUO4TcSgAW3GAAqlhlx9LYhAB1qAyGa0fBBJJ6jFIlJFPLDM5rdlcdDzt+RUH+GYM8v/PhEKh6l2KtWBjIhEbGqSdQrhIfPKPdD8UZ9fT/+1LEzgALWJlzB6RrQUYQrzD0jPCeFlfU9il1CpKKW8qBFI44XVC0XSWaXLgN3jb9PBFpiAnrpM3jriVAmw83SWzy9Cg7cMUWF78oOrDtEnSr+L4q4IpeeqeXzfTrdsb0u7UmP1gnP65aETLzN3OVX/8prc7qZKI1b9Z0YI7StuJBx1brWLRVcioACAIAFFkkygEorx1gGRKVwK8iXyfLkx5IA8OKJfqxr7b/PCPOoZZhldzzdaB2OsLV7dL3Z0eIaOz3587/Na/pUT8zr/7H///7UsTVgApIgXunsGXhTg1uNYSMuPv9H9QrN/9La/nKn/3QHubQpLFBHxtA1CkR72kVAAwAkgNMJqQwzCJqYA4rexSo7EzAChTcFzgbQn8dEOssqtqIlNz5htXcg45NpmLh2ZXgAuylUFIQCJInivwTH/vsMqWs1vkI1jXMt7uJHlgBawVncUrHpvizvkYCmR5MtulFqiuiNqspymLYp91YEC1WWZG5ncqsXZxIdEAvv+Rrc6YYPf714qaw6Pe44m4eUjPpGT6N7X7MORm/2r67//tSxOCACqSLaYwwZcGgq641hYm8b1Gc+4retzmbBWE/7xCSSCSyG6HEZQL3T2N9SJuzC6HUqS4HkfxoPZ1tX20q9unn3DeZ1At6n1b5chRYzbBx/udtrCH7LWh0boV99p58Vv9KlS/1DKKrzJ90kWUKwzqbmii9MGhnRxHA4QOQ6oVNLFfIjT9xGLEsHbeE6HmifPsyFgHRdA4Ou4FsgMVkSQbEoe1dyhuPh+nHo8WkFs7TL3nTqmMjUGapbtLm07Dk79oqZhaQRlHxc80SCT7/+1LE34AMhWVlp7BNwW6YbLWGCTili9Yuy+ZW4hZ0rdY7Z6tbb/7daGzwIoPXiZxUw9biI9GeQKt4BYVWU/AccWkkGBTqIB2dMWrhJmzB5zAGel6L7WzSjyIG6YlRbDAUGN5OsjuzKJhw+LIZkVXDgrZFRrhRly20IKLpJgYZU/VXoZHCvPIcLuueyqoAuLWMuJpghg7QyDuE1WVWSg06LoWurwAnNqM58rWrKLNHrvzZbX76/aEA2rs8nuEHaqQfLKGeaqCyKXQuxjqp0Lh/yf/7UsTdgAso+2+noE+hvjKu9PEOpX5oDjhVVCUwn/7eeWExhjXKrYPFME7hBbymiJKWPodqsDN2a3D0vUfpJfA812/OY5dg7t0YP3hT+0ZqdoJaCyV+F3SGcK2ywtrPZVNRQHswkdpNRymtKnb8n9xAdqeQOEV+DT3J1aFPT0UMwFBAp8wLDTrgBAWIt+3J0Ii6BJm3KGWSjLFlhqOBPCrR6G05Ss+bwWS+Xu7NTrNbLQVe8V9UapsV8H5xqU4PaaZtS276ETNHpDbTSo7v1f1a//tSxNcACqyBZyyxBUFfkuuBlhT4wvQhBaTkuCkIWbMXLNrHh2HkHRFkGCzx+XjmYbKcDizStzR0GcVDEHWBaDUKcMfOsBB+yhwUVD4dS0hVpcgiX3IKpLijTR8kIhKBY942ZHuDQqFkRAmARQCqcYPLDV4AdtF3uNjzotqQloU/WgHDdVRDJTaWPcsAjUVSMBsQfmJxSXTFLS7g+lRg+rRiUqp4x/Oc37vlsw+5s19j2lwnW4+5Ck0kdC65mk3Zl0YG7TOx/vRUbo/ff/0b70b/+1LE3gAK6MFrp7BJ4VmTKsWUipCcQrznOKKhTnIFeeHRxZUkYixgy37dHFkgM21qAoRyNwVI4suT1ZJIQ1vxAOmqlVhbBXMXTbYmmQipLYZQUPKsJ6ET/UqMU7F+hhS9yva+pLU3se1HSWM7Jr+qvXLJQjUaio3op1W1+RTEVzudCEnRGLY6JQaceUGu/L0AI6VEJCCc1rUcOEXYaqOw8l9CwAMdSDQ8Jjn997Jn45QT/E3d/t9cmTT+2fbREECZ7/BFHiiIp4oCw0XFEMLPGP/7UsTlAApImVksPEnBsZTrKaYU8A0FDDxc95Ui3kXeEoggUvQODKvlPkPxc8uBcO3bqPivrhNHLtPctBHWx9qDI/5th/EhAAdEAP7h4B/gY/wB0AJr7torNaSndJi5LKCIMjgliaWCla6gQkAQJHGGjsARImMPIxKPFZ+jsL8ZawVDpNfMM7CjakdIzOORm9z1G/4zutXmvPk1bufm37eIAaulKgKJZp7yp1TIb8C60DjC7zBGtA5FbjIm7DCHfJ3pHC0mKT9KEZkB8fCeH1Q+//tSxOOADO1tbewsS+GJLey1hhS4JAuPBAYOl14Htdsd1wh9MAS0mvjsRVSn0g4xHGNziIspY9xxRAEOvFq9tk8teXrV4C7rifS56kSJeu1r9KuKhAExpuWdVCQtKQaIYuXgxH5OXVJdOYn3DC0SG43RC+QIL20wz7VoCPSmWTSHnO8xmh0FTesv61Oa4RGgENmyLRRvmNn51ffkaNrlyvq3/7n8sgMQAQsgR1nrVOv9uINsHkRBk4xapafiegW3vXrgTXXopLKgNBRhP0ZyrU//+1LE3IAQCSNz7BkLyaMdbnGjDaBkNS7UeYjIqm01RIIW1E3rovp8XNZLW7eNoRlm9a7U01Kq0X07PQALVDKusvqchlmDVUBjwgl46tDwdqXXE6G1BOM/bodCi9GiQUdokAHEFT6XVvky/mtkzpFe8pf85sOfug6WNGSpwNj7v/T/dJQ7vrXbzta6S3IgVAlAREOJstGEsR4eRMsmdNykTDi9Z38sGBLCkwLU0S7pfW/M9jLUaf41dXUt2K7S3OUxE8y95aSlQ4/6/6fxmZ6b///7UsTGAApkaXemGHQBRhXt8MGWmP9KP9Pzd6frUOB2aKqiwaARZincY+UipGBbj7fJNdnTR+zO25yvLGUqqBuwtTOYi2heKxKE10WwjLE5f9aetbW1VrQV2nh4eRQ+PEwWARoTqUHgUc5Ee7xsgzpwM3lMjJ/2t76f+upIiOW0oyNtKJ0y1IWE7FDDD/FY7CqhsPiclI4F3J7cfvVqDbuwZYWqghSt9seNzo81zhnDRi4apSI/kK4EdJqQ1oBSUMlUnBjAu+RVMyUgh1mqiV+9//tSxNGACizfYqwwR4E8leylhgzwD44CrMufuqCJRcTAcoEpDzPckZRCNvwgoVp6lhEIQ6lgyXtPLnOSH3eKYphU326Jrbz/tbCH7/ZCHCEKAcukgHwE4cgc1lYEgiwbhgeNFUoHrCKEOXs9GMQ6hVOJDjgG2deyrdiryNVsjhOQ7TvIE2xBci9MiFTFYZn+rw93hxqR37gLpExkaMDQmD9iBTGDPfI1o2fyFEyBD80Mj9yjWdicP9/PzIyemWU+AgGECxYBBgzlx9QINBF58Bz/+1LE3wPJ1N9aDLxLgXaRKsGnpShlzBjSkSCcgRZ6LN1tyhU0KsgUiOI2WqPPLCTOVChZAWV6x0t1JALpwZg0BcZHBLbxQOZ8digoHijyjb8OhkhYgivL0yCIDMi4qVoainBZFaF7EpmRZhFJFJRMuD/sJ1CYymHHqwiaRzQkoakEnUN0ufq6IXdRcNqMXgAGoSAAKttQMxCxjJlyaHVymjxEuVisgZnRtlmbMB22Gh0ypLKacGrvCkjwdBYKueMlQk0MnqQoLGkmVbLGP2i7yv/7UsTmgAuQq2mnsGlhfo4scPYY9NFdTfs9rFPs++PT6tQCbuqRATbblUodYaRlgLFh4CFxWSSeVhJP3Tk+tZ4yxixYEjZGvGMaBizJ8LkDxgSAqWx7n2jhIGFxoBYi55XPHijkY/7dxel9rvK9t4qNy9f1VSApvrUlHElMpSMLB7tBSnqlKHulnzGaydb0Mk7biBQogYWDMpLsrt+GGcroTO3opeWWej/9xyKvBDFbDvvut+Vy3m9663y0KfrzduZ1Lz3aZJvMnOQmW5+/eaO1//tSxOYADCznXAw8Z4GyGG0k9hj4y2/y5cb5nPlBwAANoyGw6abZk+B5KGilHCbJvvFAwN2GNjhs7k4wGBYicV6kNtQCAHCMoPdzp8oQGXAILjQUFcAnCUBNCYfHCPx9RsYb/PCEXciX7OsArQsQNYvcErlL0n679KK1AO4gAENFQlQvpG5EpZT/nQFXk0bK1gM9uPVgV0saaOxRmC2CA7xdjGEUu7QrpIbsyHMY53Z6lKpWRO9OxxUKMEZcDLOhtAUyK3Mr/12SOV3pu62GRqb/+1DE3QAJ3F9rh6TFwUkI7TT2IHA5qg45B7mrgHeUBa9ifAvhek0PQO03iSHlMgaREy5q5znh0fOc2pouiYRqXcHAuu8QyOlRDP75GnZ125TckUyrFReWRadizT7TumQNQwcYDAYHDJkpLvEh0/qUcP+A7cMIk9I7PgAcpYyQSCCYe5CiPYYJrxj+WFJHdTJLcVkjZ1EgQ4+t9P/EpLZVL+v+Tk2XJc8oJMQmW7PuHh+fuw0KmyuphIUT8zuDzosPcIuZ+QI3wW1aGeC7YrqE//tSxOmADIiXbaekbSl1DGsZh4y4drKz03KZ5AlbHtZQSIjzj+MSgnCUFUYkhISH50QMEaA4v91C2xODt1HtzegY4wkwCV3JCdIRMey40HA6K16ej/nZ/aF9hZ8EnYt3fAEJwrh6LQpwtKm7uf/Z2u2ciEffQkr95dEngxD4kXDsG9wlwk389S/CVygoYg24MyBSqdKU+kRCEq+dxouW8lgKA0HPxVNCQPSiKUUM5t2M2hx8xz46UvUCbzH/AgBC4o1OAAnyPsuRxF9in8jI0tT/+1LE5oALqKlbTDylwXaaK6T3jLjtNI/7NzFdRMzOrOlMWFhpBXNQI/GdDUa4yohVQL9G2ZneXeu6ZjIyakDIYM4J1bs1vqq7nWi/optWdzoe+kiIkrGFAk11jE12Ntf1qoJbf9bDaqEe4DAb5uoQdJoH0GigDkOERGQxYrFUyomGNYhmRa5nICcUONSwKgmMUdLhMIzRqrFkNeVMOPU9DGGQ59fqxYkEwDgbmu6l15FjVlnEFwERra5WQAn4Up+ECZicn7MdsWMvmhgDAIACk//7UsTnABC9l2enjTWp465usMGiNZBEsfkR9YK8zes/CiDFkQrt0+q1wY3W6zX+++DCoBYlytDCJ71t/1qFhzxdzeL+LuzVoVcgEExG11AKwsxYUmeamN1IrCsewk7t3XcCr2HAzFgWvlCfqta5ifcdmTRq+oS/dI1Wfl+5PYSFGH6OnOpZHlv/7wV/QYKpQ4UTr+0shDCzzW2tKgAAauhUKgiEsUbI0mIMZZTaba1f1ZQAy5ew68RsKz3IWFnf/dN7B5RiGPXofRDaaMwY9Bun//tSxMWADBE3d4eYUIFNi28w9IzgYqWMqo1eisBlr55dn20d/r/p99P6G6xJBn15K9jAA5kQAQhpjLmTqdPwpW0V81kyx1GpAlBYv+ulflmLH+hPleyrcH3495N3pRBBn6kZnTBNRzeh6kKzEdK0OeEPuqavR/66//2zfreyccFF/Yp6UuYoAt+qAADbcTpTLJYAOKVKG+nzLYksYGULpEELjCUix05etvqx0HL5b3myxP5zgkGx5Xr5f8Fof3U661QY3My3znIX5ztjrkRFAQv/+1LEyYAJ+Ll1h5hLQUalrnDwivAah46v/1u6CQkQIgVGO/mh7EgbEmuysn1sbRoQu5tni5F7N7ZO7HYp6A5lQViJZzL09OC/BP7JZo4hbfFuB5dhyr4nnlQym72om0/VKWElkDxUJBhOEAdE9hBLjIeMXr0df9aEli4u3/Vc0h/rBJWPlpfKuWELI2nI6Y4hOiKyaFDSDJ0sRtcXq4l7DgELUTtmeSQJCqNdyaIqCbb5WqUyC5FSdyUREdkusjEq078q2fszJ/5Nf/pT8qs8kP/7UsTWgApROW2MJE0BXSas5YYJMOkDiOHNDnUgA2qrT1ksk2WbSNDrI4+uxmVZEOA6CQgocB/OrV/0bQuBFHDjI457og0O5keWiEPu7nhOWI4pCnw47IoSGloQfzAoWW5Zh8wZIj5cblbZZQ9AcMUeOZUSbLikh2rsOFgkcUaH8UfBjvR6ORVILwZuxpZ0VF3HZYwloFHexcZUjxRQ/eSFP+pF1LdjC2U93RFdxRGqBBLNCAYiDIYnT1EUYBWeh24wJYnly5ZM/TYSJFlkCwa///tSxN+ACxTPa6ewa4FtkW789K2kx9xKUcg+MWQLiY2EnhGeQFXFY+TWwq4s8nX/1jCP/9OS7dnbrFSLJV0UTQAoFRhDMJkIoJImgHPRA1Hz4yUC1nm3zfhRlJyXlMZl1KBiHMKjvyjDP8opggDRwWcbW0oiLoroNJIO9/dJpZXr9r2aWHW/1qsYBHiVV1GuBALXkIuquh5knatDmVYm3MlxucRk+B4tpm6FdqB7OgVGz5D8SQeXaLhNoACxY2fKhoWGkSQGW1qjbMjTJG2MySb/+1LE44AKzTVvh7Cl4kyz7OWGISniOlS6PGxYsaCI3/0Lk30gJfcxqDBTqBTH6FS5MJ9mako7EmozOKOFFUgaLsuxSqlrsvyC2bv6KGCYSzKZ6kQTmV12SZX/tSp0y/Tfk7I3/0+v/WZmdBJoHX/s3NCY/r7rqgAReAVphENFprLGi1zfJuMeGAPE6VxJQlhVcH15OQXy1GwkuBWrt7fCi3Ld11XOXlYqqqjY/XripnB0R227OZErRTyI7CNaeq0Yg/IiwjGsPIlljBxoV0uWBv/7UsTMgAmMV29nsGUBPY4tFPYYYCJdv+MLb49NvqCAFLdRLaRCpdCxtSFi2vCghB0VBk4Ttsjo1HZCBdVCo9MFPada9iGEZzvYiPDufUAtkuQ+4somlP5BTF5p7kQ1tfyM/////Nb20sGeSL/e/v5aYnY8fQ/Zu1vvLysVQECMMUMgaW8JMUvxgC/C8sC3H6yj8rqN2i5RqYEsmbh4kN7TL92/pkDF7C1StYEhlrQEjHQpfX6sZ81UL21f6abs+//+3df+/wz2BU8144fagWrV//tSxNyACgxRc4ewZaFHpu2k9AmktT8T0pAAAZEAKkiCeAIjZHEEqIwMxXCVCS9EJosFq1c8PS3DHVzrrB2Lfm7mbKyNhiRcamR3bFIJ/33TZAhtegQQC4DsInASNjxjRYgWEpytjS+7OrHo2LgbOlUJqqNPIU7RuS9dEABZSQAwEBrgaJ6iRANaILrKLerGFMAQOKHb4wOFovO1dDymjJtuPNTn79EdwYt3P0zLNwBETn9fR3fU/c67uIBE2fIlKBsEEz9339pc+o5vg/jkSFn/+1LE6QAMcOFhLDCpwXYl7XT0iP3IbsH3l+GL6UAGPkhehPTGLBzAhQpJ2FNNUVnHaXO7cTZrFITA8CvXF5I+zkPKwBlVttkQhHoh4lVYjBdGsXWFY4MLkYiISojAQlKmkNiCQYLDaFGGEaarSd0O4VvF7dsEC6+NoCNFFtAyUkODMmjK5/VoRbxTuzYqH8I1c8PYToD4joXVhGTFA7hBAiuwKtTBpxgvFghVHGevl/qejCcT+diaJCUxMhgnSVxLz7UyvVLKn97TWAiOEJIqz//7UsTmgAsxL1zMmE8BhJGrcYYNKIKJUVlHK18yf/qNNlfYGJGiJQxkUua1SBAF7BIwtIzIUlpSHh0sUcbS6NwlVqSdrcWf7abmGUi6AYL4MITUMRkhunUwh9wfTJgFBRBj6UFqEG0dQDfNS0HDOyzFOnQsGpkedn/u9EW20xlI0z1DJp6u79Ks2v9tlyuhntg1GUqcmRJpsPI56+hNyQABW42kiBooIwQZMnmsm48ECoBGBCSO1UNL/EH3TuAYlFkEQWcZEUEDSjj2SMAqa3Mr//tSxOcAC9SlY4ewa0JoMexVhI55YBXGlUInhq9IkyK7kzSwlUp7Ux1S1sLL5GpsRnr1u6AABoAFX0ni4rqlbUcB4JGVQMdrKR4zIuq5GYTkgFZzMdEXtFNqEm5CN4dKsCAkLJa88LgtFj5ZRorgrUycLMW2RJDu36FWb64MjBCHXV3o+Is3GRGYmAQCyHnIjUyHVStfkAE7Oiugl5YLKRwslNyBiARVUSzWPXsbrX6jxlplNd1LBn7ygbgMscZIgB8KhnUXtDUUmiIDAz1V1qv/+1LEyIFKKHNoB5htAUciLJWDCTCQ5Pi7ACCSpWVj4gaEB7QELPUuZogKeNX0lhpulaMySO3aO/8R72asKVaic2inwp8ic1KTy/2aSTzFpM9TN5SKqSTUQzqRkV7tTm9H9URP9Ov979ayvRZU1NejijLTZaSJW07ra/1qAAz0pElJ05QshjApEEScZL8z8lJV8jnjZw2hNji6BtOMgV1LHmJM0NXT4bf8hB+29Ef/nsVUOmzNf93jN/mVETB9k7f37R0eu3zcr3/9QjWcMRhe6f/7UsTVAAo4QW2HpAehSIksJYekmAyfnyeP/9P/kAAKAApJ2uCuFwyFrmtTZS3z+ZQbhbfHdNYhV7KX9mv5jx6MPz9Tvy9ZkcMmIe3iPLO+edLv/uABlQxAgqlC1x8LpDt1w0VetnqO2Nm3r9nvf//e+8ZozGadwnkRHjnh0YwoYFDK8T9tCMNidyb6BQUGDxc0TsF0L4EFihQbNr9RjOu3ptAgyc0FoG8n/Nj6/AIAG4BExkgBI0eYdCBn+phlrB5GcGEVMKiJ9h1erIdNtz+3//tSxOEDCch9VgywacGIp6sNgwqQOFzt3ma1Ox4GY7D7u5YYsP8vXi1Ha6D0mKGp0hyhttupfa088bq+2N47l1VM/c1Hvrp/H1r91DEO5uoVXOG6C7n1Lljc840OFiyDok8aEGAmQ5vaKefppPSMieYRD3wxsMfEm7EKfdbJuXNh5vBys2kJRE0g0OpIuEMQYwWYUkghwyKxh7jSIzNQVQkYeBaGKBOQVxCZMdCF+koUTA6emSq1SqQtbyUOJe+oAwydFyXKiQuHtW+XZqT/0ib/+1LE5oALrH1jR6Rs6kK0a+mDJrjPFhwd55cXJCwXXIrDtYEm3W7JI3GmewgeSnCHsw9GQ6Jy3ApJ9kyMMCqXhLXtR51EevxGfMk0Yslfs4xoiX/r4MnKllJfPNC4DDOEEELsSqz1r38lFE//oxrvr/oqhALsVadJJIWxEoYxR8OqHa5r6OepdRMa4oy4CnLmRiPCW6ZpGdARgMBR9jl5g1L9dbA3NBm0yJB4oAhOekfsHIJCjP9HR+7Rfv3FrrW2/epgBNeUZFIlBFGOKKZQVf/7UsTNgBJ5qWCsMWnJYorufPeMMLghotihOU+jPvwaNnIBb5axdB1ndMG3aIE6wZV6dd+P8lXZK9/cqMiGFMKSbraXKsAE8oy8yYTkWaqUa2u6MNJ70/39RgEwOFMpJs9Xu8K1BEKHGRsfUonhvppp+lVUMSy061ivBAttYOsUb+aFg/F0Qi04p7RR4JrAqRUSQ5UIC9eWTfM20D+z5aOI7I4el7HOYrbGGrf/qiQAIbFlsjDZR8QP0U/RIQXIC3w3kinx2uufGVG4F52mfoNH//tSxLUACgC1d6ewZcE9kO508wnUSUj7V8FOoZ15FIHfR2DEThn1p7u308OLGOCo8RjmKTK72ZndRQ6gKln2Iqs2Wkuz+gCuKqOVCqVPcZTGOC3oSSuEcM0tYSqjKBC6qmFvUbsMYrUYudoxjT2lpEeZcFy6gsifN5dyUrPdi4qSuZaqtzKv/W527qUF7hK04sXY8+T9+eI1YAcdzFccSbgWkiWUOUOFHHwXo43Y0VBpDNzAIhFlTMPwcpbAxR4UMc5ivbRXWt/m/YgN1dlfufr/+1LEwwAKTK9tp6RJoVGLrGmGLRh/6Myppkb+um9F0ZpCL9Gaf1Onf9TmVnyI3sBjyKBqH0nIWJ99ZMWChgL8eCHglwhxyHsLqcqcO0jkQEAobDDKNtLrk80U+USIkd2rvkj+9f34gAAFXqbnufu7n7i6U7u5v8vNzd6b+fpP0QvOFu5u73+mhb9+kD1J+OmepUd0sTpJBd6wcxsDVbg26PzWwdJ+lSSEnvFvrWyWTAIIeJ+E4SsVgRb1gkesCcPUu4OUJaPAupAjRgUn3qzWg//7UsTNgAqIrWWHsEfhSIkrWYewyGwKyAlMhYF0RIaBIRtYT6uzTR1kdJubkBJ5hWLMSZUpUyZ6FRubOLIjIT+ZtUuj0QC5f1HNmKcDkCojEkC13NUhgfnWSvaZWOlyweIws0O5ggZKgO0qdCd9tbSjaRJZ/FvHAoynRiYVB2Pq4l3WjQfNILECa9GeYrOatoW1Al3nmXqdzqhQidFGuvTSx70b03AHxqtu/8W30ez76g6A7VTzee8sBDOXdlVvbGSCyGgAuVBFoyXQqLGsmawy//tSxNgAC+lrZ6ekSQGoLSyU9I0pDvBGgElGWawvDyhAYMYqAsSZAZ0EFuBUaxYAix4HQ2AH9VJ5sVrva31ob6yXReapImt/V3IF2LiIoABC2UJEAILyuATBRlr12rE89pOjpZijTCrBaQK7RL57wWmcLDGpoAqmSQcIKqGz7XOU2gULTIVGiJ7hdDyXktm1HrI6a3M2TSpYaAgoWLTpLPbKAIMAADEzBwasb9rgichZ01Y6TpiA1uuuYNFKtuKqR16CtnLfxDZ0eY1rGMgmc6n/+1LE0QAQGOd3p6RxgTSOb3T2DLCZzMc2gvreqTLNerGMhvZ/tQ0kGOHTw0xTQpbr39MGLkdIwJOJmazGaOzRSxHuM4xFsKw2yPpx+AHVgsWTSPpWhXydY7dcjqUucUYrWursrIi3aqCmp123I4+ns9nIfbunRABAaNMmsdzpKW8z6GGtfoO9KewG5SABycyua8nnRw/DpYUiorkkhxDjxo336TF7ZjDhcXR7CVw8vK4RLq9SvZ73avol3X+uaHhBUzWYlDW/rmF/lT4UPvUVkf/7UsTIAAo0TYHmGQxhS4ktsZeYKPyzP9VlgBkf5LYQBTTQ+acUGutHYFehmUlwik3ZZFZOX6qJAkeV66kejJ/nKW+O96bxXereAzlvc6hRw12lyVUr/uVTlU7N+/Pv3tJCmHmt049+y383/bqlSWsFkQGgyi3DGzAdxTZdV6Xsn2xu5yGHiqNl5PRurVyUNzfC2kSu03sPk5y6JsaBiSGaV3x9+SB+Y082jzDzJif875lPt+nDI+7bZ1ECLW9x8pIhCU8UCnSyfipicV7V/6JX//tSxNOAihTdZQywp8FNm6wFpJVw89rVD3rsFPrOKV//B4CzGYYpZjKU5ZJL8IdtPyf1ENaQeCFqUgEahPGuBe1azGZKXO9avf0QGWZHI22zdX99/75+SzfXD//r//9T//+vO6X6HetX2eEbwuD8TyYgLwmElXDBsrBXt5VvOJCWatxgKGIeOHBC4KogJd7QazqadKuG0RPbrtDBHdS5G52yQphBb2wUSgeHkqLEJo1c+YPCQULRwLx1bKonCspQrMtPPKX+EUTznZn8MyI0zO7/+1LE34AKJN1lLDClwUObq9WWCahNyRUGsJotZ8fEN5m/90EPq8IdLWBqiwzKytyNgBjlJuXlnK9rZj3BRYkIDoQXJ2pXMAOuFykmTYgX86OxDagLBN5sPEQfPqW+kTApUgcVoWJSM9bs3/+/v93d0ZEWvPvfqF54UYq1CgUo7VW240kGYAoy3MRKXEvaEnWiDLgOzeTgkQIvoLQxpJ/J92ErYhqz50NT9c9S+x0BThUq7vf1imzRJ2GzbP0l/Us+f5fQzqS4bND0F3n4hLI93v/7UsTsgA3E32FNLFFJQy5s5YSI+Bqnvw470v2PpBRStUa87WSGRqbjPNSmR9AUaj0Sm6D2cFsqGEVQX1jD+fJEz5cXNjCBx1LOGRRYgDZPnzuCLmWZz/AwQQUaDoKC7DCHLVAD2b1njkJoIJ+GA+5TCQ/m6RtUVpPM5XXVAEsUBkWEeigLSmwNBl6jSw8ARIIfPRYT3bGZbqBBVF582dld3a59vmrrjbCquefGyydTiw+ZyGGBngTIhd4gCYqoc1qrLW3nXeFiz8cWVTyjhQi///tSxOsADk1pZYy8ZclMCm689Jjk/fRiragmFmyzElIpcj+NEgl6QJrhUPo5xluNWPXROD9BwVOtxMaFleY5YtIscKmUY70a7qxDXZ5WdcoGOquUyerIS9Fa5ULtt+uc/+qtFSbeqzFyxoNNOIvxEoghoOWVmFDuPqYD6gi0eGlHT3fV28Nt0J8CmCvO1UEg6JQOQ2INR9OV7ugVjotieCgX9u2dQDAvp50Ft4FAiLDTpGqQGCSgCKxyO6lo6rcF2r0DiOfuVb3eruofc0fHjf//+1LE5gALmN9xp6RtYXmU7XGGDLyYBXOnpzdrb9Jrw13MhJLR6VSe67OpdGtVgkfSE6tgmZC4txkznq/C1gUMFPLMw79PMBIRmZ0O9qBiDzhwu86F9BNAAADo5UEQaMURzAT1MWBDhBF2ux58T3BhwuSLiAGCKhf/hGoAKiAECYBBErtyTjl8hYC6MT87bU2apRaihAXq5aliiEy+MfkFJ+8nsMc5JOXluYsociWOf//OFf8q5Qt/5P9c0OFdYf+Z1ODHv/XQ+U7mEIMJFmDH1v/7UsTmAAsYi10ssGnBhp9stYYUePvHzJzCCMRnWI3zR4iCDcmhJ9//vCyeBBDjnzY5EmMp3m36lBhEGMcAhGT2nYAAw+bcgLRhBcCyBlEhFI5tRWya5UtHoEyi8yMoy3fu4Jj6mxDCqLd3DLQgtGBwhyUasCw8Ul3FuXnu/ESP03LhGhMIT8tEMRY8ZENEClIbIlc0NHoMcOgg1MAFlTM6RyEuVMvllP5zFvpsM2/q/t0AGBIABlKFfMNKCwvUOJmhQmwsbTgn0MHRYBIihaaW//tSxOaACsCLc+ewZaGRES589g0sbfswtIABAUFDjB1LbWqGUEJxICFpcUYxgMrEYkQ25ImqTbI19d7sJooUtC4tywuLv//+oIiuQJgMlNOKwoDZcvACFB6Io1jIlRkIsyWE9yO0ol1M3bzVdmb/kCCxJhYo2p96gcCk0dc1tBVldwmipEyZHsjQDFwGEiIi/3ErFa9eutj6D2hOhQA3ABAEwQ4MddGoaZsjQAw/Vph648o+fMqogcxVGNh4M12OmDopSsDhZDsU+GfqWocAWGT/+1LE5wAOPZtdLDBpwgMx7AGUjXlcEUNfoPXAWZMrIlWFWV408Z1kc63//kSoqqu7dYQAwAAnkAoP2CwrJi9Jbx01NFgToRPWplouYiiPATigNjGYPNEJqKYtThX2iFV9Y9u2lOPUPSxx8wLuYp2cj1pdTbmnUtZr+xQdQIFJVc/fUaGKAAEYgAlGSBSOSdi2iFwlUlKpqtHsfIya6fFhiseBS1Y+m7qqHbczpdFcUbKAVypUsHVBkQnSaxryjGmKHeFSSdrdzzG97rKhypJoof/7UsTLgApQZWsHmQ0BUA2utMSNGJQSGFbd5roSEBJMrGnG274RJjPXYgzsgb46kNDSpIAkyELRXgA1sIs6IbXnB1rC+MxEdLJ9c9WQcKU30OW2svXydz7OpjuoB/df9W/t7bR65ttBJ30/PUNIul3Rz7n+9spllRp9uf9+1QyM1TYi0kncQMyR6jKHcVzCbbIih1VumVCU0eZCNPxu77EUb0CUJiRAwRDZI0LjkpRmc0CR5wsheoBpYROWaRdzUTVQQqESF7d/Sw2wxTsUQZqA//tSxNYACkiDaSewZUFEkGvZliDgNAABFJycqVZ2nS0GUFdU3ES32a9K33svHVkOr1mypRkolKJQF8uxdIlHAqlg7ZW4QjyPqtUUss02EOEAVNIex7nKWVC2xDgEtDwRKEz5JZhrAvealRvOm9zJYFRMKBJ7GXuHU8IrIOoEkklNwU0VRKxGkWKIez46qmkioyVtGlb91W/8Wxge3/bIwgR3+ufwkN/z+P1znE/fSuaFM0RTP/zedDuiSvTQrECUAKDFo3toxIq3DwmtBAghCvX/+1LE4gAKfFdfTDBHgYEOrXT0jS1Zc5+E6xHCFkZuGKIEc10fUY/nNdHOdJk8Z1SaOWL4jkQOIw22gRisNo55TBYJEBpkhhXTEACQY8IlA8tp96aficDZSqEPxqWK2xpAKWDL4mXzonyMlggcRydvknk2eUzpAyk53n7sw549m0vCkLsm/d9fsYR5ICeNt+hCnTdtzJy57OcYm8xOmu7vq7divqas8s9abWwa1mtBF5hR/v3pp2LltV23En1jFCFTFFjXKhuHWOJAqQEBTJ2i8P/7UsTlgApIQWmnsClhmxLraYMOCPcEReZlmAnsHcY66Nm/iwelJbdjeMVHMIAIo6pp5hsowgMPimmgswJvS/E7wMBlMKz4V5Akwcs7yKZUVYbFTrgNa7p1JlCO8RdaNEE/AG0q5mqAWRUHkOkCYxRE4+fP1hVVcVLUe0gZGmeX+LKNvQjEfRMrFUzPUJ5r48O2TmmH0gHyhMIlBMOCxkVStkudjQIF0Dg2A246kBsHGvr/6JoieijvmDUA/iQkSiVD5HCF6ynIWgurKaCiAqkk//tSxOcAEGGdZ0eNM9oarevVhJoZ7MNiOdjPPSUHhHItIKbWRJ2ZKFe/FRYKNSq5KFrYCz2CUOCUbX66bcZI1nfvaRX3K8JgiRFA2ZMwi0WpGDgMAAAQXoFQByFqBGiSoaXtEIB6hvEU7Q9QHiwEyk+DMkVHW6NMAjtvlPM6zdcC1h2EwqSFXTJwIpih61QkJNRuiIdX+z6Kv/02N3LOZFo9AAwAAAbgYxPAIGIrCIxlsG3QgjO1Mjmss0ORJMY0YwIi/i0tUdToj143Rkybdr7/+1LEwAAKZFtpB7BjwWsRbeT2GKBtyBKaMlHvWTQwTlVtcHmsoQqjTWofStn3UJQr8bOqu1iYgB5oJlJkEqm6jhQM6bG2GkZdTh8O8bJ05ZC7xosAwTHCidtwvDglov6z55L4lCPqgLnn1nXpHsRvKNJTs20oM+9hDd3YoVhthczTvXVCKxb+lQgAgAawA9kAHkzdSJyLjyUY2TcZgrF7jDgiv0iO4tszYI6hTCsrH7a5Ll393Dgu0ZLDKDFr54LlHex3soJRRxPoi9OIHaw+cP/7UsTHAAp4ZWlHsGcBPAyrmPYY4DBwo5AooHkIJjRDg+8H3lwANMwknCSiYQBIC+c0i+bGhXqRUwoCfjx4cRyASKKRRdXZSuRneSzknPsc7k/+/ayka36f3yNvsnqeftV2JI23Tayb6+yp7Hfa+qLV0qIibiSjAG7l/mXty3eKbvQqVDVVqKlWdldz2tckVijGidtarKIZYsqnir0rsnKjb1kuAboVhANXQiOyv547U4tj2ExQXkOx/sDQnldP8z71ikVTSMTDTD61dU1TOPDm//tSxNOAChiFWyw8ZUFHECy09gyszR/rxb4v/neNd5XbIuHsS2fJvO8Z+4GvjWrRITnLHklx86rXePT///4zvOtW9MSaiwv///8W3mH7e+b3+v94iRGd5EiTgE2fEWPvtadqySWV/ygTcVjkjUBlWs6jc4r1wrvMBdnFAZyqYFVWMc5znFPxhLlQxao9fR+iNkT11/ftVlMdpF+3dooPS//+pKIRKkeS54sLoLmChkWrek9XBTPrVH5DO+DKYh9UOkuLsQTE8hwQPSOIoagtWHX/+1LE4AAK+INazDynQXWsbTaeUAH8/sSwys/EyPQGxzuJ3N30/Qjij2RqG7f9XR5LslPW8zBn6f/29XXautBILTM3/svro124Jwk3Q47984BIiO7vMV6RFqPCvqe6sO1GrYmJsOGB5yFJ7oiel9wbUBBHy5YUMXso/MisUh5Ua1qKwQGRhGjKtat/5WY5xF/38SK9Gi4il/fKkYiYaZtZDJJpY89CALMg0o+tCCEbVVogCINJJW2guUwmHGvvTYgWgNBupzh8zg1uzxWGPZ6+i//7UsTjABNha4P494AJR5xyM54gBoprQH0Vxq7WZHQe6e8WZRhc1W6tfMjqzGcggQW7uqaIiBwMaW///d+kz+nHHpEn9ChgseFXMV6LyoCVv0zrkBxCjFweyIJ+NHiBx/biI07VFeSFke5co493qr9RAEZbO701Qn0xg/7U9ETvf20LN1ZyqaQTFZP/66suty19JFn2MJCpAcxsajMJZMJuvJxc9uUAARUyyqSwhraBKGZy1MNkUHBpoTUuCTIucuFgvc18YTFZYo14YgP67RsG//tSxMqACw1zeYekR8ltm+989Ijw6JS788fIv/MNeak7ROa37oa7DhyoiHv5qqc4oCcqw2zq+356+tvo511poWCQ/trVq35sUyQIAAgRAEAjkBbzUFLWRprvutwQTlZBoBIjhcvvYfIItXOpyRLW3Hx5r0HACDWd7p2HRIO+izJpsrPWeeyUMo8xZ7NZjSxj9NaXAUXp//vmdenTrR8w2Yxhv+rbmnmoVo22LU9g9QIQWTYmZOxIFMQ5KSGwvrs9ZiAPxAD6wfxVcLVpPu/3njP/+1LEzoALxStrjCCrgV2nLrD2FLRAgWv0I1ZrQyD5J0xzaGGFSEkv7ubVTh86n155hzkX+YaRFB4v/saE9t////+vsiHnbDQuQGz0QI1sDte2WABAPpCGGeoWwqszVtWjsvhunSn7A+pDBxxhweV84xRDQ4qsPQOnVVDtKkIK3v46kuELF2CyKXCVHcJ0Ot974uKm+f/3vd8yqS0rQgxz0AIME4IOKS/S+3ZiEGCInOnPtJkzCUdOGFBS6ZcgVGkenC6kDPp7xuoy+GorE7LW/v/7UsTRgAv9OWeMpOfBkqysMYYc8BEAlL11YU59ddhxjaKE7YOEqQXNvXuv5Jl0P0xzGtgyWMp8Gua066dX42cvGysWUWdMtIqxhI8pTHpyh63pRKhyDwlnuf5X87S2r2rKxUgKuJB4cQaOEdwVSbVI+QTxcA1KYB8qhaPJ9LDWiRAEDn4ngXgNKZlDKMQ34RMIORgtJk0NdtjZ66bSTWOTrZo1XUu5GVY92FGbrlFb/kcGVAsk0gNViZ7hv+r+tSCnXiWyS2jKnCEvHJZGZWfK//tSxM0AC/k9b+exSWGZG+xlhiE4ZyCCQsIIAhhEnRuxdvbkCi2s9cslC3f3Oc9ZEoTP7iGBlW4CAMiMWcPi6kONviz8j/hnP3C0pWOMqUcsUXrepxPT6MxXP7G22ki8iG5PBwD0ZpxQqjICUwwByRK1ILWqolEWqJdSXUKQDblgs81SImawEVMZERCgULKeriz2Y1ZUJtd+yKZbYuwcehrpAKxVaqEpT1p/5yJNVPS2Ll1oYXO6cjXMGKyxkdrL1DtLE2sujHvPQjo+hJuS5tP/+1LEyAPOsRFgDDEPwTQbbMDzDXDN9YlBU9EOOnSizOahqB1i0nVKPQqMnLpXUlWayKRwGZA2bT4bek7eR9ZMUJDQ5P1rq4VEA0U+sI0Far6vnKny1LSwXzSAsCfcV1AYXVR2mRepYbnJeL5OjQhM1HP1og4X5qK3dHPas5U96qrdrLA8JhPu9D2f3jTQaM0gAJIaAlkMqJFXTpgmrIIRwRNETRO0URjNZ0UXo1daDMrgyWZHY5STzGezNfI1dkY/tKGVTNfr//ok9zWNWfHWDP/7UsTEgAqAjXWmGEmBRonvtMSM5I3ubf/2+///syzXaVkOlX3vAGBZyh6JebIOspAL7CRuEacRsgcLr9oQtq/1sYJXRZb9c77vFq6O1L3lZVvTkwZ6+mzevNqyIupz5FScCCr9QgdPryL68hIgUlOIqCA+wm1/9P0KQBogI3ZLTeI2HInRSPiCDYgRJsTZN/gpAdi0E3VdUHVVFit7Mtk109krcYknTSv+yFNZu1HImaXZCbtRq3atejnV6up2dnOgMOt7VUbRTx+FYRVPH+c///tQxM+CCnTfXgwwq4E4G6vVhB2w/1ef/9tdgguKpRu11IpowLWAAIwb6J5G2UKvAcn3X2iCIOHfSkOx5JCfpk6TSQSIUVKwRVviUN3f+5tnC48Ho0ZKYhW/39610s7f6f3/t7dvtpdOm7J+8WdDSxmf7dGjdXUoZ6eRVxxpKH4uTIgF+Xh4GKQ2z4mnwyTksyKVC0Yw4thpafny/AO46UOQ1DKkFjBVQKboSpPR4a1WI7nlmvmh/HIy6o4yQ2crqTQipKa5M0+Xq3im3w8rcP/7UsTcAApBPWunpOXhTZur1PYJMMdvmlOStVRoBHtimQEdNCGLL/ZC3BdUNGpBMSCB0PnuL7Bwy4dE4garjCVwZ5DmqCYUJ2crsYsk27yvCOtnPmZsZ5jlS4qDx5it2L8QAVBpMOmbSUoOHNLovJ2xq07gavh5zAKVhZQAEtNxCMqRLxeHCNQwE6T5yDPAM6E4otuTLBXCIrH8Fto+IWdJaGzBCjMxyv3yh2qDErLyHLytyl/MFGq1FK1vp7vgqh0VWbSXcArYqbFnMBFs9Lep//tSxOcAC7ExZQekRUlrqe70kwn4m8kItAWCXF6uoAIOZuNNE5KGIsqZ3tv6V+WYlC3ahAnLriEppVRREhZhBg02slM1YWHU1ZyZo80OPDy2Lbh1T//L/9ojcMovhGdjaq3jgtEjSqOS4a9xJXypoPFTBIOoCedVMRIkBodWfuRIp0LT8cR4Hc+FaJgowkgmjdxYYnZTFBLZUiQcmstJjsMCDSwYHh9YTlwwtuQRI0Icghf7UojXr4HNvcZt0jUQE9IAGIM10gZjYOlJU4fJMxf/+1LE6IAMGLt7p7BnwXyVbaWGDOBv2gBh+vNqWRqY8CIVDSIpqHaMaHiuehuTzgcWRvgB8RoLWDuAtJyw08b8zrkeCPgPYgrLUKbxGBzt38+echT6DViufxThr3pQEZKLkVu1AI3cIzwkJyl2GZekWNmxfPkB4qidNdAAMRUk2qIQ4pXQ7RPlOPE/X4UhWIejn6KVydhK6eRe3/FYq9W3vWPeq0WKGw+4BEc81aXsImQdXapndQRDmk0ADAsKi927Fjr3rad6UNzrEzKz9y0xlP/7UsTmgAvQ2W2HjFNBaZftsYSNYKEzWsBJhp5en1sbQMC5SJhNQB1DwjphgHJI4fyySjseGJBdIoNzpp9b9aQXjt7VqucWq0rNttHBpzI0MpJHCjqG8n0qwk2dWDhvf///Z/o1D/5kuc8pwUYZIoGrYxAeyJtGmgECC4k1jWRogJRGIXcxjbcS8WybSmCqV4faJcVSuNdxtNA1WILE8YrqOVZwVzJiGj4NtLm3JBXSBmInRQcD6RUw94boINFIgKyijraXZFil7EugOccGUx0l//tSxOgACzxLeeYwwaGQHW40xI2Ic+wgOUep3VLpASMnq1ZfLG0DDvdIhGkodIZRvQJ5pJYG4HEkFGtSoRWmjaDBA+86CaaicZf0Fz9sh9R7T9JsBkMCMcNU4uKit4SRetKyqhdCh9QgSQXZv39eI6hX3Z8sZbSvh8pfqTUAAVIIjCVKsPS/RLgmGmu20C4i67jZP9GQku12BySoqjzvKJVdqwz9xza3M+XeQxLHyLmThSdYso0XuGrtPSpVVGGQ8bXGi5dbq5kXeJ7mGYeGRKH/+1LE5wALKFVnjDzBwX0rrvzAjzQIHp1H8yvwySEEAABJop5qCGhhfRWx/4eTbT7Z2+4LDM2hR8oKXae1tbH75RBdRGDIztpZsH7BExtEyhooNHJnwgATCLzR10+KiqCA5qEhoRmEoEGuhi0KFL3nvSXlQo6yLoqF1QACJBhWxyC1KYUodRCTOZW8GkGU1nRLy7IlbZdKt6icDXekiXPY7tAok6Sn7bkqigoEBWHBqTCsY8KGSM9GlR7rGyyBbufYartrseI0sUFgnedXYqGFD//7UsTogAxAf3HnrFRheY5u/PSZzDZImx6CUsFKZk45pGgTCo2fp6CKCWFzMVsMobcRAlya9nlHTLGEtlCnT+dON2zpxgUIvadXl85HUlEViuUpHKRnUqLL01uhbIZGp+7dF/bKyI9bbd/p+6eyp/+iXvvjugKtT0oIw2p1uRJAqECMRDicnWlxO2UslcSB8LU/nP+E9VVF1MetU5K3HL3VytHIcty0x6IqHOzbPfZYMroXXa7auz10dVNb9NVppT7KZGrevy+0k+hn6onts13U//tSxOYAC5B3Y2wYbUFvDCxZhJlQSJeGuyxV7mXAIaS4WkSoPsDwdohxyF7HpSxRFaR0VgcGxJunuB6KLwsvdn3ruym2QYThAJIAB1wScACrAVkSLxZkiMaLGgGTkIptm7qaJ/2qysa26pDIqkaKpErw1tWo0htBjfUCJBRZSWtmaSUGWqWAZpd4B7JZuOAhM6jpANFaf0wKGFSxQlTMfDO0zG9YJMk0rYib05EHjOYwUWYLEGsQjmLww61AZIudFkKRfSpOITIRJGl4gk0vn0D/+1LE54ALrG9nJ5hwQXUtrjTzCeScK4OaT+3aoEAEHEYQASCrK3jHnvsrx9JdL1uqM04aV0kIkMtN9RN/uEIQva7v8mqBDrrQjK5na9XdrNuiaEO7b6XZPqd3kvJ+d3aQry7Izr2xaE3Y9lTnHOa9wCq6upiHVKuJADoMdbTHHVe35q8rLKoCF17egI5BxKAOhsNQ/FYk1SxPJXyEK1TOMqvvH5UEw2CZcLhcAZPIoYjBAKE5Kro9nOcspRAxNJjNkQChAbmRitYkyfmRgmfFDv/7UsToAAwNW2unrFDhcAssKPOZwIECZAxhdtZkjJ2ILk8/6qKd7hHdEIRxe+BeKua6970pz5FCQFw/oXPjc+x1aUkRX/U0WLpTumVWii56cvfpCTp1u9o+nllgSavibIIBaiugF6Ti8fkqHsbRK5uCeMCo2ojQEzYmEqY5A6wMPZWZkWdBm243ktISa2NkrqT/ZiXtqkKGrKxLalKWnpUyGfyms2rJQqukqS7q25q/cIAgoVaNtn33AIijaSe2x5ItFUkmrKcbbNrYLCLQMAmy//tSxOeAC/iDb+egbyGhqyvlhIlxFItj6PPKJCFkkDojXIpslmlPnuHvIhPnoHi4kGFgVc61ImCum+dYp0xeqtNnhp3quUkLora4OqeoSh0esyeLWgUHElg+2xvZHlzS7612yVi0NDgSrng7HRjJaQwIRHqValVxxH6/4uZfmudf5h7PetW7uTk0gf2ZS1TqhHVkZoWdhN1P85RIY4cv/+/MK+VLZtwQDp2XoqSahHXHW/yWlQAIFUACynjiBqC6MBuqE7UwvMqiF3kJ82HwwHj/+1LE4QASEZlrJ6URyZmibqj0ibhH0c04QSSxwBNePXZkNbqEhopE18kbzUWnIclIZjPzPtKbz5w7+X5k9HTb//5kCZ3QXXDSziyTmydyIqxwrf6bqSnEZXErMnj7ZTRVC7MpTGm2IGZIKiCnVetiVjWVuVElXsl6wM7M40dE2abuMJv6hjtsyFd0oXaqd8RFyWVmGlPo4jSvKVlVkcqEdf6/8sO/moo7OcoBIvJGOnnaO0LOBga41AQrVUhtKE1qABBS8EEbdGhP/AbyNinJlf/7UsTDgAr8U32npMhBWabwdMCPLThvSQFoVlK2FhRQDVxpZYKZ+hvHMJCoGkNE9jzFQ6RAHdv20FF0cdVPF68R//f/SdpfP0sf36b/P6u6xD811/6/yV1csNAN//qesCw88dM0NUTnY63FxhgkCcFQeSthsynb7ayeL1DSTb0CEIoHCejxEPzIW3+0hIp5bpxIrDpXqgDKwDTU043euZszr6OoCDbKWZ6Ao0musbPyXHc3z+023a8tTVP118LP9/EtcRqrRNfzU/XPVSC2a/zg//tSxMoAC6EVbYeMscGpqjAw8pq+bVYgxZ03WLM/dOSecMEA5ZMiLuQU0roAAAHM950nS1aGbvoMsbhkkBXEuICgx0Cko202WOpCKn6r2ITtHp1ExWZF1eJ+yffWxFc7z5KtU+81/r1dCiL2Uy39YrHa/NV2lxx35lN9/UR/3xf7f71fXzvafafIC1x/MMHloZZoxvSbHFMRdQSITjRrgUIvn6VgtouIkqUPE1NMmxLiICYIW2lsOPCGZHYhhel2+ZqPLIL5WR7dsq5KOlddNrX/+1LExAAOeU9mbLELAbsqrujzIiIisYH5zro2QlirR6C+33S5bxN73EDLK44q1pPf9ePn46uCa/Xv75X+rvmiQdv/0qCzie55lHHywq4kHHIeYevixAvY9RqbY9IyAgMAAEFKUKySST+a6xJI544szJ85M47Zdswy49A7y0E1R4yFUKRTqKxw5kZwuFgXl1zkUwT3L8vKe/5lzTX68JBFP3IvI/T2BI4JDlLXsSw4W4/TmGPyrlT+X9JuwAHY0Az0ppmBsILQswhII+GivugMXP/7UsSwgA8NV2BsvQvB1auu8PWiJhBZG0JAAoAA0/XVDsQO3qAdpkngtyLyliMjAvCxCLSD0OZtUJp5vH1SCgswowxW2z1kIUf+Rr8OUoIFB1a1jWiiQg8YimMlBERi3VjwSo5agDJKFxDfdrv5lxqJQVRVQTAkiCRbjTjEYh+k0bx8luwiDUWy9sa5QuVuhZfKeDYb2nseCLWvJWQSrWXTW7u5WrofajXka+zkdp6llsZ6rf3R51imV9nvI6KZbs9Iw8PcKwAfKFdiROAglEuD//tSxJeADumRaUwka4lnkqyhhI1gI09C9bwtbUUblLGnr9lSkD4hHELIfrNH30N3YUEl3i0Z2Kw/UHhA5MMn+s8D7s28CRQXOxRpMXIhy0Wk6HKYG9GrcBd+LVevntiT7TzVI7eRtQUHAAJKSlAdKA808djw8VkDasE0GsaD44ZDajCoWsH2K0eEG+QtpIRnOwQ57iXStz30+/BgAKXSp9LiVFxhelQ6O35jhuedm0aO/sKrpbv/PACSACSklIIGVJJVbs3UT5STSmLPEJ89c1n/+1LEjIAK6ONtp5hQgV4OLJ2GIWBbkepSFjxc/LwEQuGZiLSZPncuFf2L/ZILKpagTHnUIMKu3ojBA+e/NCSHeToJMkh9WdFC6u49S7XQEQQC01sPRfhHdWK8/sNwe3NTl5lYn2zNQ+RTeg+NEJ1lsZnV+lQxN/ioSakWF9Us5giNoh0odHcyUexiEb27Mn1RXf5sY5/kDc7qAh/RTtu+sGDUCi1Edwc0irVBvMSDc3ibsqZWFH1hQE4ERm7ig673GhAIHAYJKqw4hzFjQJEzm//7UsSTAAoci2NHpEsBTBHtKPMN0pJJlTgoKNY3Uokbf7fPw7rEoUscAD1bBSm5XTacaQW+AgAKHgTqe4CwXzglYZar9v9TNWZ1WqQvI0xpwtqU3sDtIoB8o/4ZlpVhNbTInctpN+mCx91T6hVM0OaPWurSs7/9FMCDHqaoHiZY+ZPz5ANl7LigZq9AAkNI0sVuTsMvj77Qw6lDCQ0+A4RJhwgIDnucHmyYXBx55AhEdJ7uDIfsQBCFv6AAhXJ3f+leIiIEABcAAiIEQohO/T4h//tSxJ8ACjDjYOwwS0FBCW1o8YmUfn1EiYd907/xD/z5DiInNM/4V+vXc/9w4GaITiwMDHQg4uhwMXCd4LNEL0I9MOBmZAM/OgIIASxI0OLEfq2NM9CDj0ISxJZZh0s66mac3SQ+aLRKCyAaVcFHwmMrPHadqqSkdtuXIXz/zXL8ueZ8NkYlpcOqmDGgsZQVXrcgODfy21o+eDqQVISx5woBj8JPEpUs4YAhGSZlnAGFWmPPigNi+XYcz4qha3NyOVfSjAwvWJ25xYLRuiciAu3/+1LErAMK1FVczDDKweOzbEWDDXkkHdEjLY7R7f5V+XcID1CHKXR6srXdi3T6L721sidgmcEwudKKdd/+i/iH/kDDt//XQyGAYahF6GiuwpmQuTifoNg8liILIFzyMqTQ7HDw9N+2he1C7LDohkjOuyGVF0fWVNlCM6ha/20baZq9QFwKDe3rNV93kjh3seN2f/9+5tQQDAgExIpjNYCVi+UBpEOfHcqTdQk6tRMwm1Q7GEYnB/YQoy0X8FONnV8H1GQZqfoFyqg4LD4mf2K0w//7UsSiAAyo7W7HmG0BTpmuMPMWIIoVCTTRZ7/+l2eMWqTVr42UUAa693sUAAIABViQHQ2kmLEd5R1iGb3SZojWmQVVolKEywgwRZYNCMta/2EMC00HIOQ6I/VGCrRGdhI2uKBxyNputHfe77muGWvfvF5rb6v1K37akPsXuiAESkYXBZeiwbRzjTC3/BzJABRJWlRRWTC9TiYO8NCOdbapCSs2yd28aoNl4SOhN9Z1XpuVuvq5pzL4rp3IQ//q+54LF34uoYsRMcaUigAHCBra//tSxKOACfzNZqekS0FICyzo9JlgxkT9KAkjmtMfUochh0wklIKEI+iKiakj39z2RMF6mjtFpc+AFFlqHS2CfghcuKCguAHsrYmCpWEUpCUx+m+/33ne/vR6XJo8RutXR7hRlJ403ARe9b8hfFsJc+HEMGltZP4yJfxiaJgJJiXOASCXMt5N1zNEzAZWDrtKNTrdDNn9zzlAPpEBWhWIhYHoQ3sHnxnWaPyTFoQSXV0f9X+mzAMMglpOUFBcgQGYri5g5ceDAYOaJ7Iii+MiP3//+1LEsIIKOGdfLDBrATcL692GDPBA5EFJkKYSFxMETAbe6XB/dU0uFSosx0ZoTtyDt9ytYeCL7yd13S2cxV4RbQmHjmZecyBdJPOE6AgC6bBUHBsRzZAmn0uakNNHP9pt0w5j7N1alUFx2RVbV/uS+MdWUSBiIMLgvLvj1f0EaUYXYrXqVNZ/1veV0n/+5lnnSwgjGEiIfOCos4gA2O6bB/DDERZD1Ww2z0O+PlYsBxiNtiUN5Lqd45RU+qp3T1vnykqYFhoQugixOIZbUDmrfP/7UsS+ggo4dV0sMEsBSBEqAZeNcOyfab9sB/Zxt9Z1/YWUMIjtfA5A5LBHOB7TTd2dzBELBKfC9XQipwOeLHjhQmIGICwDtixxJwoOOHJA+90/QlS9v+1AvwAFnwJwG4AgB4EIQrgUVH52yctaZHNWF6Ger9JUFJCQmCJE0iyWN3Vl7ZVR0sOymNLHA61SxEMYsqAQC06HGxF2HZDQzv1/x1bVXCXR0f+WIAEbAAAKJKkAKxjRlltHj0ujpApiA6Axk7A48YfGg4Khhmq0ZCBi//tSxMqACog/YUexJMGCG6uVl4z42pmDUo07P5IFgYLjJJYHFmlxxt/be89197/t/V9xJz7/hLFWUHTySyCIbo21lUsbSe0RjQnDUbjAqhcDAMQ/YHJemxJkRSnnBQ1ucypbUh50z8gsBUUDhsOgyMJEze4i67g/IrKWokEIdr2/XptcAlvUvU+Qe2xmflR7ki1iAQhEh5aWUMnS3fQQlCM4uGKwJ4UhEZVApSsFxoIi2wWD5DKVUKASmCEdzMgq4KYMjszVZFUSc7laq0L7Iqb/+1LEzgKNFNdkB7BtwUGOrST2GHjGpUjXyXs//rL/7Oj/6fgxw79YBYWkKKbaSdfBmjhNtNwY+UPQ2UNbeGp9pNInIBHnhZ7/Cho5vcbc4Y3bDpyxTJ5VPv3LjhBRI8XWj3H10jo8ytUWIul2/7KVziSzl9cq5NQx8koBAgACat0lxgkMBSUDXlyzo7CBsUKnhVsDsfryYuokjLq2ErDAw9miRwgsDHoRTzyqZo7zyhHPflBtKh5p1xumifDZxsvmYXuQ6cRNKfReIL2xYukO9v/7UsTPgAoUdWesJGiBTQxutMMNnPIYuKO+m39NHGgkkpOPWTORGV3D8FsCkhUmXrUsgjVyd1hXF7Ms8coxh9p1zB5bgq03OZe9P/k/v/PN7W//Jz92ppd9MvhG5mQiF6d4hV3QrRGaISJNOf06HHJNTQyfrIVhfhXMEEBKCEB9IfMYvXlFCecqQeBkcpczSJaVGalQ9PzHko3UOKMhM497sYi1evPSRy9+7a9//F3rmRPOABPAAdESneJLPFAUGVCIW54wGgopYuKGFi4vcJJl//tSxNuACjUzWg0kSwFLES01gw2cVvcfbyg7eT3d5t4k8xE5F7ikRDN70eEqXPsgXeiBQyXupyxe3d0qYrREPD064A1rBGGfh4fP/OtL4QJDoArFfcmfaR0qFy+gxlahLjl5CZRranOiSsbfXSBQBAINSMLUi9QXP6Kth/nWW8lIY5+JUbJJ2SRw3kauayubAvHDPXAzYYpbvN1jSa83rCKrVLf6bFff9npTeIyr5KG81GXaBctwPnkmKupj9Bk3r/a6dCtnuFvnyQHnf5lvSrv/+1LE5wILzMtZLLBrAausK+mGDWBIylo/CsJJkEq4ZlrUok5UrNbocuu66wIkQJWFjmpnkZnwyk2NZ//7uJqnEkIa6vaWvlRlMQFhSuR2Fubqi7jYc2Bo7e/VlRFeaqc+gEUe4oHKIRPSSpgeowo57qMmE5OIz55JGhKrHas8jm2wZm2px7YPitdqFXzW+t+NkYylZr//foaoNlbn1Nrc//SzirrBQcgqv9yCU9r9CgDAnWkyDBgpwLKRGmwl7MC2LiYLERtjk4WG2h5aylkj8P/7UsTgABANWXemDRZp8imtQYYZKVusrxQdqo5cw1GtMM29ecUN51/rbqztnKcpyhy7jrle3/ktxY+JioUCydPGTowscLOYPc9gxy1ABBuAHAGSJK3Bbq6E4q5/a72qhdOHgEJDwrIBliQW9bZFF1d08kD83U48WuYtUHk0Q7bNdne38c755i84/UEE9Lc41qOpxq0n9v1+rJ9GOp6Dwm0vZUk7YiRlaghgnWnK0pgVCbGmMIxzzOU/j+cVu68fXtGffomWGkVFHnjWAUdU1bWs//tSxL+ACnCHe4ewY8E3l+7w8Yoo+k+XPDX9O17rfpcyt8h3TRLdfVauo5wh+130fSvTXSKeKODNx+gvMkFPdyQT1FRcrfyoi4r7NqbbKVAklEAIwY4TjMh8Fjg26EYlbwRVX6gcdHpr08jjpge4LZz6sXmWxLMnBtJbiLP2gdijqZYy+v+iM35mrXRv9v5h7YMjl5bsVQy6ASAhFiJbmpwOYj20BCOS1RnjDLrfMeq1rC5j61cqFmNPBaXUXEkeRLjB87MZ4UzzO1xXU3Vru6X/+1LEzIALDMNvh7DlwWunLXGUnWh2StlFpRizJYVUGhUotLHPX7/6ACHxQJhYKXfvqO9uoBCQZGEEZTZbcD6HMrDKNo+iDirZzbL+yHqU8J8pTmrRJQ/+ZxaYZ2uJeLDQWLzqoUMnt4Cyx8y3c7SyMzKrOvAVyIq3X34ivyIJpIuVbRUq/s4sdy4e8NXjiX+z00FAUgEgUSm4aCjV6MCoFCQpvM1bWtNTtgZIjhneXlKajONd1+9N9X/M4mDc0ouIVSiNkU0NIWX+Wn0Ua3/ysv/7UsTQgAt0+3OHoFHhRKUvNMSJNJe8ibkdnPLzy6br5rX65lkZQhDzcMh0gjftNp27jM8PzEVoMhbM2WTMNSlMmIV7Mlf8czDMtr1oIEFLhyoFSkAQBbh+mMbgcbCp4I7E2TJGzQnFOVdmLu9Ej4tuq0jTONZggxVUucPT1aSyXC51xNYW+tMto9vZ+FJFCQ4/rii1iKp7sRIdrzuuiGiNSgBAUiGirNBQUgoTXEeNdbQ1BIUsPIqWeADxspl+gTB8WxAa26nGG02L3u7XFGpL//tSxNgACvCvZsw8pcF1mm1885bIBdp9R9o0mHKq9983lTCkOSZb2fQ9bpTyDGuudqf9/K4trABJMIQSzUSGh4cQChyG44m46pDXz0ovlDq6surfrxB03rD9f0CN9IvjmqzYIzfnfz23lpChkqYUblGFHrAoTI0vRKd1Ferqb1JHLakqePP/lglAlGkgy3HIEPSZeydMiFLbEPbB55Ty22sySlLSWpLToTuprOB53Bq1Q3KxnBMSZ+S1Xua06tZRCWxWuPbFSr3iu7/uvK1Mw0X/+1LE24APiaVvp4zXgTyNbaD0lSheP1nXr/6qOgQMVxmoNy7XgALhUZCtgfMM0AmCOcnySyYfr2dWzPIRRaqmSogJNGlgjSzGiRiNhejs01vUB1Mm6InQ8uFFmTcOrb6zzGBuqqLmXn1EgKVLGBnlcBpxdz1pmp5MY+oA4NZBkFEtKAWz+DxOIQQCEZFgWi09Xlo6MR2alpOZTyJAjJ4lVGhyfR0fC3U69F11iBrDDMFAiAD8mgcKtz/Iw2FR5RZdB6LKnHpqfui5Vh1KjrWaqv/7UsTTgAoYaW2HmQxBRRAtcYYYMIie7atsjPdgaAQAJVgMVCfGngGhSgSDIwt5bojnx2M8PCmpaaDhDbvyCRj1chwTdefXwuwbNG28RBZaAOuhHAfwwc2CHb+dAqBnyb+8keGhnaC6EFE39nsiGrjb7lYjT23fv1UR5fWuJuy23kKWBfISOpNFtQk2bliU5MEurY4EElV826clVxNF4yRqWoUcpTzNvxS9MReupkieCjeFX/bqdy5wdIXBl8yL3vkljyHrJWhAg2OZeQAD0gBS//tSxOCACiidb6eYTsF0GS40wIqQEhA52s9naaBKAAJGCLInRkStkugOVMlvJSsFjlE8aAxpFs12EoYrFlvpSx86wkBnkegjgjCma0VZ+9cWZO5mYQQCBAuUBAYQpUESgnIfTrRsKEBOCCSCgyoMQxE/8HzSA+L7Cf0s3BKgCy4qaLsFbunUpet1iTA2lwy70fSEicZizvtPir7Ug0EHCMdNrDsnuyaqGJeEeRtOm2VEQMGYL07tw2UMggYpTVVtn1maVVch2QUFiAwEY0FjvFD/+1LE5wAL2H1rp7EB4WuT65mWDTjA0HAvc8zB+uAIDBRqwKtyklOkhvhDJzKGzdNOaIxFat3Qg8JI0SvN4Wm/dE0d2Hmp18w7ywgx1EaNUbFklcXwk3CCJxqJ1aBJJEG5ITI2al/Ruwxs+CwXKZ3OfEtKmAAOEREVYKnBgOHBGwDukL23sO2MQUakaQsWg3GLS6+o1s+5ib2v1QkAIARAAWEQGVAwOfZqOAgp0jR/QFk2aQdEgWYXkTfpImppG2dszOzY71ji8MUx4+kiq8NAlf/7UsToAAvwwXOnpGzhfZLsGYYNMJchLWnrhl7Fwn63sxExWx1THGXvx4l2WovH8rTWoAIYAg06dhUWiPG2WQ4WjLAoOEBIcJlxkytdjg1Hao1grjMLUzfgNTsZtovzszcrDY9OQv9goWFDwq6VdlWGYCJWuK0Uto+Q2ZeP0da3CunLKgAEy4gLADr8QkqpKtjzFIsKDAMHANxB4pYqWFFKniqZmtNeCUYEOmblI6tSKze+ppvfJiSf+Rz8HPWUVXFZ9DVKV6W7rdSiRaQDNWjS//tSxOaAEP2NZswkcYlMD23A95gQ+VLySgKvQkEP9yYm23jzeFKQc9lQngRgxmUzJaQUjoW3Ss0sOIu74Fb8WOkxoxnmsx+kOEM0rVVXyI9Z26+StygxahOo5NHxQ+ISg51iSwsWLnzbncAC7mgUw2BVP/UMDgpfIV7jzdcEp4SWiiniWkEGGK4rkFBEmFJVAeLEwIozURCs0jhN+LAayIDqMSAKwUjBs3VmIy0o+nS/5Gyh8P4Y93Fg26fUhTeUI2JrliDzM0hoxbkg49zmq83/+1LE1wBKcHNozCRpgUKT7KGGDOgQIrUzd+mxaAEHJrYnY3Jenh/k6MMgiDZxpjYyH1wrFwuEE6MX3Dore9c8NtxzitzOx9oJLBRKHaiWMpVFGj7V0F6scpuE2rLC5AXUOkRMTeLmGVbQCgYholKKRqQuTGCjxqnaf9QAAgAAQSXEjRpYt0LiRXSao0kEK3mgHjxT/36lDN8ilzGd1HJPcwptssrvK5Hdnpd2EsOdhlO+1Ue/ehuki9UZiuVN73Zuzd1+5yIfamjLvIje+aQmKv/7UsTigAqIoWmMJGdhgpRtaPYNLFeMhb7d/we1yl318rAghr2+ftG529/mQe5BCv7dOQAGUAJJu4QCKKSynNcXZonVXgMNtWj+BLn5zPGpR567zKwAvnv2u8TIOCTIoVPJKelzyRH4iFzv6X/zp55xPxkKtD6feF13n5k5oIDi6Z6cf9v7/ybfWpA+shmhO+6ZyHivuWuMJq3wxZMBpn1NGFgQRnBJaQR6AI2tiMlagpS0SxXGnJYQw4HctNFZ0zTJz2jyEoUVMLZWSLK7pcce//tSxOYAC4CrZ0ekaSF3j2209gz0Qcje4e95TtZ8+Sp/O85RCuOKLDDChb9grAO9jFxjBoiXvp6KidvZT+O3PJAD+qoqBHwh6IF40G0IAFE9DjBwUPLLK5TP1rSE/G4R1xX2+cImp3/a38t4yP9UWIgAcoG0nBz5BwcJFFCTKA+0CfxZTv+9HXgrW9N8veLEG2U1ABkAECWgNizmhy3KT5AW2iCgwhFTQIGVKUubO/LYPvjcjXrsXHbqzszbHOtZ2i/sIoMK7aMarrREf3Rdmur/+1LE5wAOiZ9dTAjVydk0rOTxmrlpuYrMoVDRUk7NqVS67tTPOizX6WrrQE3ij0VbmNqwQm+zsUZiSZPTqR6QQjiSMyoQhmUpzKXqC7+DK7imwYVpVoAPQE79Sm7RhTv7bo5nxOGfd26bv2Sa5zIb20Wl1HTzA55dghaJmOHdC5v+l9ibsdpVUY3tusmtskq5PEvhnp5Di7r5ZmjIhYkA2JJlHSe4EnZ49f9TY9wNS6zZCptizK/nOd22DgQ8Uc4vEUk1gB2HxIDKZZHDR4NnSP/7UsTPgApUp22HsEVBRxJtZPSMuJxrSfYerT/6lTHpDUEHNuARRDkpjRZe4U4vwtC9KalcwfHozHzVRlj0bJyCY73qBVOTDH5sxi3FAxmio4dEoASzQFWPPOAyhFsultp7ejodsURa8dkLe0URCvIjtT0AASAFmdHQmKkWEVbkqYK/JTNFYMaCQPiLQJFBPzBelDXBQJI8hT4OnOU8FFwmngvfvGs0wZsb0yPhIKWwbY96w2IxVJhX00sCobPBAg9jlAx4z75utRq1RZjltrAB//tSxNsAC4jhZSwk54FQHC408R4slEBqRJEJwC3hLSwbNwroLhVJEhcOlhSYn5ybvXXvsqLJh3TvtOWigJ2CKHEQ001+iUhzzey/mugNScxZDAiIUGFvQWeCDS7VCso1zLxofyLhIDDGID7xO9bvrulCkycFHvZdZl1qCzZStxmNqJBSTB8CcPgarTJQeYkKElhKf7iyr/Zi68DFd7X59ijFHM69br73pvTnuBI2v42AHYQoG4QAQZ6HA3Pl0JzDi9C5vEQIBnzQaEWotzyttTH/+1LE4IAKgItzp5hrIUsLK5mGIOhhEoxzQQ7F6K8eou6QjhHvhEIkZXXnPt8mxCQj7QABizbRcaACKApFMzurpt8n4pYzxu3uwk8UOQ4FWtp04FEKSxyXTUQk7CxyHSzYugmhE4o5OuuK6Ki+Qc3QjXJUQ+EFiUXuwDrg4iAwGQ82BA71TGqTSNLS9EN+Mb03MXnjvtz3PDyvEkdfPLfXIPs6Ti2UpGWmi8r19Veqa03qNUVj1P9TaFHJ6i6zVQMDP/YCNSkW7WmyWkgYSYCqWP/7UMTrAAuQkVksJGnBmROrJYYNKI9Bc1QeEhBgnseOkJcuKmEIWa1hqkUM90dSNLOR+1bqyUtKNYx2nj2KyTqEwsPGYUDr3qIID7BjSbaK9v/VB6lPbkx76BS8g2h3DFmNvAjWGaUZY5I2DCmgrjUaVA7CWJBBD54+VsnqxTDppMD1vaOqTkkQ5g0M0UMiIJFe5tZnpKxOBrM9HPXvXmzKzqR9HjCqIlUDX/7lOeva6HfVn9BK8bWqBAduDM1WuoAJdLEoNx4PigreGiYBy4r/+1LE5wAOhWNzpgR6akqtLrT0mjVHlCSqE3pjUoEcM8Ui5iVNOS8qGbrqsy/z4VZEiGQUYgSRyo0ik3St25r1Oq6Ee/9xZ9foSo6RiXWryQAPACgAxXlkXQXIL5vCRDEeL44Cxs5HFYYMRuBTzUf5QcE8wM41t0LRVax0PVie6K7h8CvqWVFVpS7qlLpi/G+qR9LOyh9yRpWdaL9yeAow9s1KAMwrA4hGtWpYYvmzJLm01uGF7okY5n+OVjAGc5VcqLScTLM9voFHmYu28+23T//7UsTBgAs4lXmnpKfBVZnwfMCenHsrW9cbmY0hV1e7KGNs7bUy46jg5RWK+9aJB2SbijG2PP9s/us0wACtVi2krHVbksVH4RhYYTRWUDBtDJI+Vs9QRca2Vy8T5owOgMqVe4PSgqVGyCpXRUejP1OvczNvYxxCH1qtdGNL3YgTWFlnet6xn8ZFPT2sQmoACAAAEYwEOH3IYinKr5h7JlYdDKacCGpGGM9jMZsMK80670fEdtVaViM0DUss7kaAtlVRjuiegkCnNynV5hARZDSU//tSxMeACkSXc4ekZ8FLl20k9hUoBmw/S4mVxztSbL93tr/9F6KaFJRMGRKtT5YGqrUT1XOUyEMy5CPyEP/21weffzklyfX1p1WZEDsrWRWS24t393281uP8rOm/ik+xbWvVlUnENU8DuC7TS7f+uhKPV++uXgAmowBisrA8xDR2HbBPowEUJSoospFpdFVYtday8Ww4afp0bPsI75R5Vfd1z86xObd3SF8UvuHFV/ZyRW/0omSuafwyKPtPzszRMvLyPOn/y6K4h/KwrwiMjrn/+1LE0wIKhLliLLCrwUiVrSWGFPAou5IEyi8/yc96jnyI0FL9gAAaSZiENfWD5LeObKoWiQZHq08aLKaAfcmPFvFLRQ1oiKHy1c5J8aR2uWZympVyEIqURk3qmd0Veux3MzH6Fs6/R///7/0VF/f28yKwuVP5ZLn+3fp/weDqQKoABPBIQIIQ4AmMqReENSFRZ6zxkhEoPioBloNmHI5oN1aAE7yBBdRmSNnI/rN+/N9taMB4eF2+B8p2sQssFRY/3+nZ39uoqnMUpSZelBImvv/7UsTdg4q8mWMtPKfBN5dtDZYI8DbtSABIAAA5nKECQyzjCC68YL0tvIXI7HTVEL/A33c3UznqROkC1EsIHQLDjmAEd0ipMQOAiwOndzhQ5tcgYIeArwFOEwqbChxzj189Np8gWUO1xRI7SJQM46WaVmiwqzIr22fM5KoATLMFZcBxBvKkpiSiXFLEkLtToVtmZyQsqjw6tAR9Vn4XxahqKUEu/IH22MUU89vpRwQpA5sLGg/YDZmG8iVKtsVsa2mVauwmz/eV/xiYq1qURmpD//tSxOmADWVNb4ewZ+lsqe549hQ5KH2uAA1CABVAtl1oVJbr1QWHIxZ5JXBzMJE1io4O8rF+7Vgp768q2wDd19R5Bg4KwtzQPXajq86wGxTO8jK2akMejQJxlZU+3g3TY5jGjRIPUZO7jIr5YXlUCromzaFB35nuln8dCQAZgY4sIAwFDmnaXmHRIhE5xBa67+PvTyqR2I66kTpnie7s51MerbmBkIWYZiG4YO08vYfRCjUAl6Whkq/Bm8gh5ZPjN5Xsvez5L8LbEyaaiR+tQ2j/+1LE5AAKYHVrjCTHgY0S7CGHjShB1Mf/d/UATCBCRTkoKQshnjaNfdxljhOVBx0RDchJAx+VS5MyXDay8xFv7Cr889CVKzf+wXGxNAarU+tnLtDVlVCawRLJFBaOhMTFkuSWJAK9TFoOB1+ulpxnnb8+pKhistELtfTFlSwYaWSiWmm6DGJaXU+k+YqYOJCHjxzfKXg9UwwPJ0cvANVibfpT5TCgw4iBxoDOqUoHhOk+LuOvOyZAMiVMiAAMoo8KJIfe1i0g+pZ4LkN92170HP/7UsTmgAsAbWcnsMeBi5cr5YMKkEuWoeUQcKnP+gAAigEAACwpGXdVqQWZchaB0ChnfI8KA4brtEU1NM61AmrdwHb8LA9oG9QObKZaC/zbdMFqcsGHOlSab0JOE2mcROic0hsgSUNEDXusEazeMtZrxgY2oOPevX3dyVIEUJRArjVlMpQyJert3CgF7cnBJjufQN1Lx/dhaGka8z8qD2SDwQMJL0qJfTgh5RMwNZZBzFmiC8kmWdaBVi9805SKVT0TsA6AkTyibYCELL2g75XQ//tSxOcAC4TfWq0gdIGEj+xphhkohI9pysvcVMLxByf97qo+fptEEnfQGTlI0YNLoRICCCAXegdY2xheXSvDBCRmEPozuNOhLrc87g9KYaYaLIWW4QUxojucVDRVtMjJUDV4szStTUxulGYOJ21IN3PsaOTSkRxCokMOsZjDMpcDT+NSJScijtsc1Kc5tZUl/+5F56H4Ieli7wzJyhouDrvWEO4AhQQAAIC6OsA/FoLga6TRKkteNSqqcttH26EmDinwQOKNMQ0XJaE4mqSacWv/+1LE5gALqE9rp5ksoXWOq/GXjLjJQgDpdCIlc0stJ+MSMMPKMLopShCmj9r7vfT7kf9yid6l0oTa9NIAETAAEQAwcRNjVKYkpxEDSa0/cTiMkoyPJNnYF36vimg15wZpXaVQFHud6VndqhmrFxk075cp4OuFEbO4dS5rW4t9GxSotS93d/Cr0AYfAp/KpRUEGuoAEFJFODLNA4hbTpVyfNJHNbaPlVqM/1uM9onnPjDnAK+axhszOe5dziaKWR2Jl3HGjhJEoeLLPvAOh12kU//7UsTmg8+ZEWAMMMnBnSatQYSNeLX0e9eiks2db0HHL1lAKLnO5IBABTABVRUIylMlZiNDeVlefC2yp1Hv5orbarDDx1WSJ71YFQUhjwrHIhqJzzc2Mf65LSJZDRWzUS8a2TCCQVLFUMPTYBqnW6lbO9CWx1H0Ptf7tSoMCRtIoqA6ONk6i4KMjhzI9HtQilyA+BwOFp86D615LHX0YW0tcDKRiWSxD0CmpI5FVBmTGdM1DUIhosWKh4siqKoPGzDTKCy7HTPOqxvyrCKS7UKk//tSxNKACnxraSexBsFOE+zw9I1oq1kkpW56zjd2sEuuBoFFJJTFmxEtuojwHwyhkTQC58UhoS3K3IoFYWroKV7dpkFSkRbKY7vssHehL7hkzmvnosr71o5UU11db0WiyWLv3VrE2dU69bJdMiMExndX+rPrU5bdFpjKNUr/uZlByzN5QIosmUV5OHVlUKh3o+Vra0/X2Ss61dufD7iSSPgZwsLAYpkt3m7loeNkzI+dNq73v651s9qcVzxQXLo4OJKJsL2fVuHCxc1UZFKNjkT/+1LE3IAKZINpp5hugVATK5WHjLi0F1KvpV6rwBZAAAAKcUIohEkUHA3oajV52fGmSdYG2GFxWZdBJzcQYfsuURQCjoiIeCvpFKqPa7mYcAEACCEQFnO+A0AH+RPn/j8yjOHyfeOHnKQpGuM2cYHtr3cZQba6t8z3r/wR3snq//gH/+0QAAA/Dp3ODwKXKgQjjbqNntA2gaiiMtI0i6hCydMDkzSXtggjqVqokVa+E6gtiTqoiSbyGyxW2Sl1lF6hZKKY66FTJBvcC2L98RC9Lf/7UsTmgAvQi2WHsGlhdaWtNPSI9cRRDyn0m0yL2LQcOuIVq2qoSoktIggmg7OFyEsSUikGt7xMSz3b3ZguEhiGDKhqhFISWpNias/j4IkSGqQAKbEHgMiQ1DAvB3qwpI1u4U8SLI4RThIpkAWuxHpHMiLqIIcGwBATVPKpG4uoSwksVGHrdqvxanr/uQSLFj5cQrfLG1LDjkbiWR9GlQCjnQASKhjKjEkKNUVZ+2jkxseLEEBtMohMCdVxp6uWkKwSmHyJYYskEQOlYbedc1CW//tSxOaAC4i/bye8ZfGeEWwo9I0pXlQnQsVHrWLT7q2TKWqLKShO/+xvuR/BgHFsTc0yOoWWAQAJhRADhBBAOItbW4sE3NFgqhik0nneovb5rQo2rrQ7/GlRziizbyPbOGjAtFn5Pbrvvn2Ylpap8SOIsao0pRYRSKVs8TG1U0g1qV/0MTX1u+gBgqRsiwA46kgItZLZIt1GqUxbssJaCoP1TSRfJ5LUa+B8OM3C7VNrl6QgTnkM2CwEWE0OEcekqx1orbG1oU91Gi7exBZmpBf/+1LE4oAQ/Z9izCUJyTqJbVmWGGA6YtbVK5EiV10HsjUAAS4CAkm05V4j9pfgLgNpSs8jwgsHg4Fcrl8nGGXib6B++WA+7v+eRQWlIwyjk5tW8u/FjZepECcKChdMledfYUZUhLk9pHI9bumPRTK8U/EvlUoFKSlpPdLc8gPHjvqvy2zp2XwgiMcyqQBOUTJy6PzcD7rTAYx7WvbM+uP6Pdf4SPqnO+FGSnbrAUnpciRYvVgZ5dCxdajoFSQjzY3ODKHtupuUXHihyOTaxoeAJ//7UsTVAApgO2eMYSCBTBMrlaeMuAbHP1stR7HBR222uSRtpRDD4MQXhEoxIgHy4GcJCeLw5+jZPR9ZOHoXR4AaN7yaqDDhV7S0FM8pm9kBg73UMQazKmt7uiUbtZlsw7ghgByEjhzoOAiD4OGGhicFddQuFzjQjeQ480vDBOI0FxxyDwYLgTQcNwm67a3G2mkWyDBMWR/aENcYLrJIh9K5azISf+Wz+eHnpqqre76kpCDzwid4cdPLOO/+SPkhoR082tiB77BA7wiDwWTKTrxh//tSxOAACoRfZYwwZ6FOEiv1lgzw9EGuN3WlkJIAfomUeexAwbTre8IXiyAvbiR5AsmT1k09xN6x4/bx48MaxM5ToGPT7utuPE6/e31s1kMEMIDKsxZvKJfCJW+kWs38LMNtwTEeyMY3LKPxRqDTkdWUMk6hQkQQUTWjqOdMdeWNqOJ2yg4jQQSMiuUEC4wVEJ9jzSi2gSyE6jbcFgohJ5t9HWuzIdoQgsx4myZS4d361anD//wYU9Q0kxCE2U7HwyEHlIbHdqQuJsrG2I9sWcT/+1LE6gAMbKtvjDBp8bYbL3TEClbhw+RkkkZGJ/CPx+uqA0jkbUiZRAK6LkLgMgeotE7EWHA6dW2REsrLlLZ6fLuf7dxnI3iMvO0wdrGVvQXdqXdjYGFcBY6VDQuvX7dB5kZgookDhq7GlHtiFy9H2rev1laBQ31eaX/yHuECeodBM3EWWUoRN0jOWxVpBNq5CVakBWOlShGRawXb3Y9ZYugXUTTS9Izq13fTuerg4en8utJk1v965rkXqQfgYaLqjRqP/f7zSBCBzG1HqF6P9v/7UsTfgBBlnX2mDNb6MSztQYSaOdsBL7IIGvRJUEIO4t5fnjA2o0wz+NFjOnMFlaiwDgsUOs8l3v02VbKelS6W3SiqQAWl/1HmeZSlTmaudnEx0oXHCB9K00//GU88ICZISjWPOtZc6t394AMdYAV0USSDBQTPBHDagjEpeRTwklA6LTSxp8zojDDR52qYtbriWHqqv/db7rmcVUcRWh9ucksWxqDWAWCocYX7laNe6gbS4KI7QI+pGvrquF29yQCNAAkMuoOQCkEfW6PAKn4a//tSxLWAC3C5eaewScFRly989J1oj+2uJJG5g8YK4tLxA8nQWE2Jb4GLEmSIbjKl7tHlJ2sFqx9floCXeGsNyjSKEMHBIqR3JTS1bL7uxSk71f7TbvXft7QXJ7aVImy04HywJFFG4ythKNIk0qv1BHC0AI8QSXm+dnGk7nYajquEDucyt1SgNxZ23OlHl9Day+mtG0MSXo9jmPTfcl6TJprZOqW+QLJKFXIWCNd1uzrmVQGNEBFa0xA1ClCnbsOuJR8UFBQka1lDBcjX6nVNVw7/+1LEu4AKrLt1h6DvAVKRLfGGLDg1CvqsMYo4ZLcKzu6SCrotlDzUdqmZSne/Ja9bPRDXmxqd+Z2+lK5HXZdLCiiX8qx/a/uW0ECloEApINyhqgyXM91EV6nRKgTyjofqnaGFiXaZIdZ+szH05GWWmr1Ei0yy+6zfbIFDZrOsDHiFWtbeVOjKqUDed6EbP2PZhUAA5PaaaFxrSi/CW9AADAEAABEEmFUIStmMgU3akvCwuCULlh4jaJ8KVRQCmG17ByY4KDphLakoqv5/ue4U4P/7UsTEgAqYhWkMMQVBYiTvNPMJrG68Sv0MpbmkdieRc9+Q0Mv5FSP9KH/dv5MrY4sZrPXs59IBoAACVZMQLRnBQBNDgH4VbXOwOaccrpcDMEH4bFumc/Bm0tPXbww2Wy3vX36P1utX+n3SIj3r/+f/n6UjrKcI6xpnodM9T1Zy1o/eX1b0podENcy03aKn+ZXO4cLB5MjII1VKtTUQxQBGEFlB4Gm1IsahczIclaVqtUT24Sz4sImgzCsPl8zttxu1I19pUdrEWdQVFlnctbbW//tSxMuACnDBaywwpcFVj+208yHQuyxJqzroqWiMOpcqdUq3/T+306cYtft8sKoASz4eJwHeMQRk3TKkHCuQh7MXkFv1qY718PJcgHLFjJPpB1kKTVs0sAlS5Ae8klBKD46P0JkjS5os+MniQRKIl6DproQi7vObXvZJBpV0DbB+pSWYDChCSiirgTE4bFIlFIfiFiZcQrzYEQ5qLaud66ib2DzJikqfF1njSm1bBZI4eBWo3Ul3rP6pNlZizV6kLqqOdm4LLph1d8vYLovN6kD/+1LE1QAKfIdprDEFAZYrbWTzDajLgYBacufnkhBbSiS6XUyvTBWzLlC0chrYrKQGdy3SrdSbzrz3bHl7CCJGrBaVI0TkSpG6i04S73dZTvJfz4ok639mXwzhW5fffLK+Xmcvoehw5m0XhlPYdhwcJVHrg0qRYiRua7tVFKWQgpJuRgkA+FICwyPCMoCYKbNI0ZbhWWMSzSrTQCInEGFib3Cl+ScTL+Ay5YEc86bOdhF9/us799JZ0zbO3bRK1Jf//TKH5/NbCPLece0+SDxB0v/7UsTWAAm0o2snmK1BS4rsyPYY4Fanz6FK55HKgEAAAKcUWDDhQSWi8komxKKn4rHdpYOZbJlitVWmPFt0NjAVrQQVZBfSGHudmsUYhU63/lNJayDQYCITzm9USB9ore1a1KEmGpfSLsQMpNXXmy56wzoxhxqaP/SqAKZAAApJ5TgvixgFQWliH0Loo1QHTJAHM3Hto6geeUNx1i0UUjMP1qm7DbS5ObrCfhL2OIP0ayORxV60f08ue2hggCVLhl7kxy18hSnu6rXDdc4N8shT//tSxOOACcBrc6SYbSGdKG0o8I7QDamknrSLxXJoAuoEAFIl0+Q0CAnsVg2gCp0pgTfTOkZAaWfC9W8/jA91uqq5VQiUJS7H7SXEuRUkn76rK8713rTtq3+3Tv+etP/0/03ZX766P0ZGVTooGgdxEd/GAgQRSCe/yAWqAkAQ1FWIWnwcqTSJhso3A6ziiQ47mn0WthcBNYpjWBLNJargnc0LSQ7O84iV3cz76UIAe4TFhBBm+hafh0r+WaHTJLOuEK0/jhzIDFFrWgMeVwjkWAX/+1LE5oALpT1vRbBh0XAOq52GGPAiAwBHFqLABnDihAuLYh2E5F6uLtMQkLUhB57pJ+W1gbAd/AhY9RBjddF/cG8zhlFMzBIWK6OJSOIla48CLSKVLyYexnMpyjyna6lm3aLmsSLSNq3UtgQHgoLVQlSWMjmgCwPNsXSyF6jOhzFCdYZDI1yFWvUpLCeLdFNvZSO4EKJIJUChnIUUFBL5oJiObBxSCRluXBUTnjHQPATkNyM9BCQy9ojYJUkySgqwW7T+khMOSSziFsv9aVJ3+v/7UsTngAwAt2FHsGnBcSzsqPYIuY8syza17GKmXiolY9xtRUiMD3bQAJIs8gEYUckgoPBgS4hqDOg39k4NjGhySiwe9SrCak47nUkTW6Us6O5nMyvlJb979DuwIHQaCR4GhAwmPd7LxizT8VdqF3sbqJC92K27cDAJNDqVABgKABME2vsbdFEipWzZxHleBzGbVy1VQVi0fxl5uGox6+l3pYHMzNWNoArefLhDCY6HQUVbS+UEURCdkO6QWJMekQlVTOpCPGDit/uULEH6hK4c//tSxOcCDyFlZseYbolmkG3A9hlIZW1W1hoe5a6wIVZnoaaVgR6Z0xJebuOzAMdhIbactziftKt8pM045tUyQ1WMsx9+SqO8FSGwAiWA74UIz0wSO8CGRT+fF6L4dX/cYEQlUmu29Z6hfqULsTelW+j90VvG5GjtAwAxXpHj6ZdBXTgwYoz5SAdwWhKGjOpUniuWxSNBRrHXNFPTw7UckNdj2DqIStG7Q5xn5v8GbqFdgrQRpCmZAvgdN54k91bxgVcgY6gfoODL9NPOdHQv3gr/+1LE24AKXEtzR6RqgU6ULMWGCLhExoqFJEkrQgZMkflAkvSTEpkGoDyQp6txmS8z5Qm//Sik9F3ZPsrQyq2a/piqDGMjqjGJvpYr7Ixk4W+m1tyv9mdrnWFh7YVBwER1CzJsC2mTh8bcdiUGkpfWCw5u/4HCdbEfsjrFCvY3Qvbskv68KWPShZPUalkcmL5bNBcmhOkxtHD5wlynWJ8WpXKYrmtIVmUYOJqz88M5SxUB/IX+XuUz65U8vDG2LvcgQGiSAxcL7jC3lbth8gsS2f/7UsTmAQuQa2eMMGsBahdsCaeM+HjJQ4bX6Wf+kmKQqmagqR3Wy3jIGuTZDUCSs3pYidlVoIOVioW29BY4zbNGIVA2nX16idtM7BSA9FJshRLiQcFEGJIhoJYOACyjugvgbyRe7kqoKhQk3KEkIW/ynfJyTeGVdzQuBBnRFT6/C9Ip1NCfiLXP3fz4hcEWuZzyKFN4APeVzpk4ggCHAAABTkKjCI0TfmG5FJKmct3La0ps/N0trr6yyw+aoOrFK8ckQLBADcyBtIQ9MsWZvNPO//tSxOiACvybYMy8ZcGely408ZrWmxPq/Hz99zE63/d+WidriF6Ws2n3L+dsv+MQTyEGjmPek7uYtKThpTyWICGPQyjg2lmQ7ZeJl3D6cPk4goHH4ih+Y58dSOw55wDDJmp9lti8YYCu8w0oitOVpJjUrLgfDmfjTpEIhmX3RKXj563OgWhgR8SNtpV2AjVvN1XOUfzY0zomlWCU07NtmTK3sqajrdar1axsWHHrhe30pqsdIiw0XnfmVQZ7F5VAiohRFQNYZEOYDCSsDsLExin/+1LE5oALzLtxp7Bn4fa0bnz0jXzMUuFr9ZPCFH2odLpb02aABYQzh/HEy13kHrMvMfY+ShWhhZihYk4ZSWHf26vq//+ToqPnGB1Q9iW56wGhVAFGIlMhQsSkfmRvLKH2lre3h8VJCgyvmtrMHGmZJx8N2ELoelW/Nsil5GHwxrzc2qs76Wetip+iWk6+r/3zG1t8I5gOCyGfRts+rgJ1l01vqQRYAACWiRwn1dalLut490aIA2MEo6PKyOtMuTJESB6miCslONNcaeSwY8qZWf/7UsTWgBDto2lMINHBS5FvvMEOJEQCvYwxsJC0SLepaxuzfkU2LUYRdv2tkLB0OF9lK6H0t9jsg6kCE3Uog1A7IhaMag2beQknaQup1gtLKGsNspSBurHW1X2tVEI0HRfL5CLrcJSdPpZQ6nFyOqtBKi8dSPFzv1a//vk0r3rOs9jqsOrSlG1NQooAGAAJasLEAWMLtLiYNIFjOpWgOGL7QmuWxiJTT4OHjpVCswU9RpgoNRZkoWpXRr6ecvosLOUXApFQKKnmvWq16U136adn//tSxMcACiiBaSwxA4FOIOylhIlwbVuQ3GEnb/rdTmG/WsAFJJxCUNhFF0ZmtUIDhY6DoEIgQ0mEjD7K9Z2QZkCTuhVlOaGBCPVr+CIIH1HRdjUGZVrHlGptvPsS8gKHwI67SSn8k3vr0W95HKHEugzS2i30ogIAiISJzAghCAYg7Cg7KJ6MtYiIY9RK7c3KVyui3e2VshzDZj4oWwl3YG7A6hqJciHaIOGv+QjTcy1pVVH0MEgoeD5wm4oZNPAFvFjluoACrnvuxO0WAC3iRu//+1LE0oAKQFNhLCTHgUGUbPGGDLyULoebctn9G28uYXoJTCNSt1Uc550WHqAORIaDKMOBAlJGHYhiUHC1g4EgKwNxlwmMnd1/rF78r7HBh/USHmr217kwGFSXAsWQCQeds3k4J4hgTH84JkR2JYNBIPOv+r36UYPFnewQohjPp977s9ZhCHwxVhZQRhavd34MCE9ghJOyaZDD02CEMg99mndsYwhp5+zpBC9wxDLZo/j/xntoIR/bMQQES/HLKxDGb5qWloAHhgzRXTdymbq7cf/7UsTfAApocVstJQyBTg0rTaSMuNlUMPXIH+lcIcdrxPSph9Oy6Zmzw/FkSEMhD666jdhQmrP0TrHxyXHn1PGyUeyJTyvn6l67UVFVw5LLrqZ95/HWumkfLulCZtM6IFGzMKaokcGNSAVQCDAIwYExs+fw6HcxnuhYo56ZPkZl2ICZHnstlWrPM/MShvQdKE71N3vZSol9qKEPkdJlHKVCOZ2omISCRUTkAmL4ffnJULOWcxXUCJc9KAanNZW6MV/5sXTTl/+UHKyI2swkQoLS//tSxOmCjJyVVK09CUKAMyvBhho5SJpbFgzb1o4z91HS8gzzw1di6EpSKhrfURQAiAUWIAggKiIqt85gQjoa3l/q2BNAJr0OTg2ioaTXf4Q2cbPq+qW+3+uuDEmOagjPl4ZCT3UqSreToZtuzSwj6KdBplOu94sZIohNk2G7pfbE5ZGnSieJdCjtenY5DaMbx5ALj8Ty8l2UeTemAS6xefCpm/THUym/Cozp2rQuVsPMGMxKFSRKxhYTbxrvUr/6tP2Xdbx1dRUUsUae1tMEAxT/+1LExQCSZXdmDLBxyUMSrmT0jPgEBIBDMRSjoPc4SWNaNX15ioVErBwqQVu8e7zqcVzaJH8zK7r+A+ehrt44lIz7IfnSJRBlr1NomN3I6WpQmLCDsW9wHY8Wt/+WeJGR16bfWAKRCEyWCDoqRdk8bdmH3sXLhFCc0FSeggal6RMHzKYAG/rholR+F1UAy4f3goPSe72lL7MVEHqhpEkFRE1BhuhS9XWnb26HES4GAoz6JEcNcHdnSgCAAAAEheYmBK1sEGLlSNmAOwKqWB7nof/7UsSxAAosmXMsMGGBRhLvtPSM8APF9CKIjivBlqc4IpQZ2Z84J24ES6vbQ1GZnZ9XSz3eLEk+49IUa1N9Q1JnXXJFL3bf/uQxF9IGpQzwirbJK5OGuvrCGnQ9Xe5XSca4aGsTEwsbna1yskqgVspNEmaKEBFOOf2otb59jKym0GUBRBAKmHWvzMXX3irFT+3Fs+lyG/2dZpXad6bt1QSAAAMzJg+5fIck8bcRgkPck4PFkuUCqWaJk+4sfSSu9keEivJdEIPWTJw5jixwMsgm//tSxL2AClSZaSewbMFQEu0lhIzwvteOU+PSFjv4x1YVIXPHpCI8v71d2tv08au737e/939gBIqAEgpGGDEGTSJrjlVQUFykcAMn5wNR5FAlCOznGSxvFYO1f83gTsivi0buPC8zTTERfVL8bd//ObkExRGiSYKSll08SO9ZADUav11fsYecEsWUxhMEMQAGVIARJJQGhPelowFZJWPip0TkOPFymSZa1h0SN8zvRlQWSCrMdZRrSYb8mBbjmuKM+bdFqahaq+CAQr7sgcBpoVf/+1LEyAAJ3JljLCTnwUoS73zzihwdu32nkBdh61NnivqV/9TC07rBbTMcCCrskoEkIjY3iuRsdQwkREUUUvseacu4z30SQWvLUfh319FqkflV8J+Dx3/MW0nK0M7LG8134kExoYgFCRKdNl06SimNcoX06rs8anG70en6q3ICAIaJSg6UO71jsQclOHhlMICrMbB5xapEi5LQkVuX6E0jYybzdsHjYfAxC2ICf31YgkFOU6q6koqpH4kBZ8b1qgDcpyjFXc5zPxu7V3+7oYKoGv/7UsTVAApUl18MvQXBWZMsqZYguMwyZW6kRFRN0AGJlzCF5WVR5vj4OlVupD0HiwQB2TQ9GaKqcub9Xpy81gTqtMlNTIyRN+ExlX/5A+q+irWLmTZvylieJUaLSQCU+6wt5PYgNg1flASOoSRCAWHqbox1RAJqeKARcyglXipg+coIMAAAim3DREpUw18k6IfB3v50wch1aJsmo10SRejkse8P5gElvvnzYmhx1MWFeMMCaYuZ2La1S6m6/TiloSJeLG48iQZaMkCUVFtaVjCj//tSxN6ACuijYSy9BcFZku109iII9+HWt+z/0awAgDQ25QKtv2lpNxRk5wH3ZJC0rnIsqpn67FHoueGBy1E0I9iaCj4UVxFqDQYmGOEz/NeFRGogoqCi1uDovaMYd/9DQwcWkJIWPvFHyDEho65YuFXO7pFFTaVeMbM29tH+mgEDSQASWWm4DOLWhD4ZLjfDW5IsK3t98Z92lRfu0tH+grk8LEBWrJOC8TaldRIDsMF3iLmet/Qe7MDqFuuR89TQXKmRpxoM58vfX/dpNl841az/+1LE5YAK+JVg7D0FwZ8UrTWHoHxYAp5MIABFlLH0Aa1hjc3YawlU3sjW0jE30oQQP1XyCEWo5EtRNVoJWigShh0qbOoa+i7JaQiKOBEMjUvhnoKEDz0kLf9myN4EpnJj8ocP4YEAAKJOCDbQQJh4uXfRAj+abCbczSpKXEdwe/w0gAawicyHjhISltOGzKTTduPufDEHTwVegRqTueapjS7sXFDzAAGZwZbSMTnqBybalQgphGT+dxkupKl/c8QQJ2SBVpVEMo+dC4bXOtzRC//7UsTjgQrYl19MPQXBhxSrqYeguKfuZ+gRQM7ok7zKQnP3JEn145lE3Fm7uRdc3c/Qz4Uu45u4JFd6cDi4EIOb4ADh7nKEB2QTkUlJIRLNTMQDwuCioL+sP0RHRKaY50wHmY2ol1hDVg4oCYMvGalGFp9zCRs7dbn//8o1aqv8Pi/kazq/7ULDl50oVdGBke6Id11Zo1nrG+Z+cKgjKq2gkk4hTx5YSw4SsbRWlRBzYUAAiZitmOKxCDkCrUbxjOhGSGjAjEQNvR0YlV8HvXXk//tSxOUACliXaawkrNF0i+w1hiGYa1+WtEqso9ww04HQZMHnW+wmQoc5e5Tchl6bDr/dpdv/6UEVmYqfcMYds0CEJEpuarXEcJMepwJg6cA4O+HbMJKgRQJgqgdxIqnnRYudfFOZ3I5Hhkc6FJmVncz5aN7foW87QQGLKOhxzxYOrcERgU537N9P/0v1FXoWpzG5tRBgEB8LuXK+rxvEmvLCEl6IQ9EfdykZPfyBpo0kPseMw1JEwOe1N1ZkArLHSFzMpferzXn7lV7URRWNhRX/+1DE6wAR7ZNrrKRxyZyprQGGDPAgRnVL8/bb6WFd/8z9LIqdW2lYYCAoBJIAIJTgEweyIXEIGuf4PUYLgtV4rOhZ+BLU9Kuz4FX2jM5FLPS2KT32eGZq0JK2h19U6St6OJb1+qvN29f9u0Ep2dGbFMNFhZjCAmRTfL9oU5FwLBRytaoAgKQC3HLg4iGHSsmeDWGmIyNdFm/YWOFnwDPjDYX/Z4VZyUtS5lYGnp9UISjqYLpgyuMFlDINrJAc6ham08/5ZZtmjTTQcQc/y6Jc//tSxM0ACdRVbSekyoFLlO3w9gi4rJDFNKlZKjIGGAwEY3bcvGB3lbZsb9OyIUQw7sXuwGRoH+0Alr4fCGtyQv7OOlNfmTU4H8aYhtw4sv/QLI+omIihWExphl/9vOZWc5ibXXtXiep1x2/iU95r0Zpm8LojbGKfFf7v/5fFnN6uKkS5u/S1MAAAEABJwRrEiLOXwghUg/hrONVhHk4Pw71gS2UgWtDwiHM8+tCaTxUwRtEt2mtm4rOW1N9IlsR26b/uDvd/K6anqhPX2JFTKTz/+1LE2gAKGKllDCSuwWmfLXT0iXRC2RVSl3UOX1HjzrlffQ6QSIHPkUAPDgC8EjnBZ6PUUcCz23bmLWooJIFKWyVIFdCH++M+tMq8k7hiMIrjTKJIk4DQ83Uk4HzOvmHSX2Fp7rQt8XbOMyj5po3ZzZ1mFnx9Uz6u/0/SU9AQndFKoqRtvHO2oYw2SiQOxBlWl2Gqvod1DOCZKvLygSnUUeWEatfCDcrnb5F1pi+l1s6IFE3m00paEZRM3f+TyLp8I37/sWSBKi8OTXyv+X0+n//7UsTiAAqMi2lHsElBpRgsqYWNedzS55/95esvdECCHwL/cIE7Ro8ABj9qmvAAAtLD8IWr1OfjeijuJBC2fiJdHoHGkCgoECBiFk05kYXR6Rk7BJYNEAB03c0Kom4IQhOhOdTc3c0nuYgIgMDFhBEKmngYuP6mgApoNcycXEAjCxxjXVn7Sj2qS83L+GCgBa4mT7mS7ySqAJmiYIBJKcpPhxm61SIOGbtF8QMNDSEohIJITdQM1FDQVe8bZsEMxtk1/3NhUJlpWzU2ZDpXqiVg//tSxOEBC8CLXUw9Z4FTkWtVh6EolAP8BDyphi0p6BZ09FWvT8NLa11i1Jh1B2KBBONWEtRlFUChNCERVRGJZZN0MzWshPyHllViSyuvxUzuR/8bjqOAwhqqWGfIfU0jAqoZUsaBRUgKIZ6YcijXcPu2d/kVbqt6bFqdAR8naK1bWQCACa3DRry24BYs8ZYFEHxgearM5i0D2niv3J6tcnrfyVPPVPXDQYQiaS057mnWJtPYQ1cjbMzUd9sxUR/3XuIJDPrM1b003SKls7/qQ3P/+1LE5YANRWVzp6xtKa2dLWT0jPja9QIBiGaACBBEWaTIed2GQw4yG4xIICKQA2P2pK0JTHVIUjSOA4Dh6BJORcN0wHX3NpC1/TCnE9fUS0n0zv6f7ENdkVgyZ3OSSeTO88MpmUKSRusUWi9IuNXUfEKnKDc2uRXZIiiVACCAAJpqUHmDFFAczOMwugbdT1OGShMHBA1XQ8wJ5Y38oj4O3BFo6CEu+jaPMcWUqOW7MIoUq9bGVqfX5Hsusukxb3f+v7fv/2d0uolHnL0aCUK5t//7UsTYgApsc3OnpGjBSg9udMSNrLBnf0JQIMPQSbsk4IyOUhapYDVM45FpJrMapK4iOYwHXhbDq+RkXfl5dxvvjAPByXgYoNGrKYWiXu79gr9CNaaYiNUyKjTIplpZuhJ76r+v7vrVF/z/6r3fbJ7mQjLY10CEDdtaPMIIlxKRFTI45n7BfSLS4hRCeGBd0KVZt6Q+RJGCodNVus/b93izGAcRoLO7diKRznHue3mEGS+qv0EFL7IyK/kl+uBmeHrwjKE9P3P7///CT+5Ig2f3//tSxOOACiTBXqwYVEGRlKz1hiC8rgghGEGat7i0Em4gWZdceu55anUiFpusR3BDQSJBQqqKARqAU2k/GpL9E4QiSEgtqDlkel8kjbhADcsy021EkYG7g2AydLEyiIBihid6i0OBvX5UOJEToj0TROuaZ7vwuFZ/+5+fPLnISIXxzM4hfN3vXN3Mi7l8K8SHvq4G6gxxAGIgOFyi6g1QCbwQAF4A7n8r6siFuaanwwiSNJDaC5EjQZNrORPCAUGJFet0SJQsmZDgsUBMZWQlEiL/+1LE5oALPTdjR5iugYcubOj0iaizWdFkKrN0SJGYZUwdEwMB1LWVw4AZExRQdqluMO7gtorGOAWZBjPFnhSM0kgtwoEFQM/S3rd9rhno6sJYFZgyUnljgf/Nx0EnI40a5AJjG2PA3TiONcoYlFYlKRFHMysL5MTVDozSKY2rZLdS+ZuUdZn6zYVGVsaDRttbSqieVme/3UGUM3ebKMZdp8ts01NTm00BAMiMRIIJslxfFUwnEc7WmKtEGKdt6Aw60HTM9Q7zjHGho+dWrKQU7P/7UsTmgA49m3eGFHU5qaztZPSM+HI26JdGS9SGqzXvTpVfBiwNsHCzLC76n7afoRmSJoy5vkVVMvdLy7aqhSkukUUhzoxIl/OV4O9XlzZhLkRA9gPiRaLWnJe1Td3J3MfrcFrSZ+15UsiEkWU75TUWi/tGPO7iPRaotUNuUg7fV2YgFBEoYPs9HPBuNaUuuQ2psJ5IiiSEKT8UAqnCg+Fw+YLYakiVn6VjyslGZ45x3BAa2aTXRYgCUxzd09Wb65zyoIYjccGj+HyhV74dfUFY//tSxNYAD21fbqeYa0ktEK8w8YnomSW/bFXMxRw4SBgL/iq2l6UGgCA0BFaIqjEqV014Q8zhQ5vgWPhjWwPuRiYJPyvmFFWi8C/UUOYjP2AkHGsl0IpNqN19Va04fcjuPStCVGAqFxB6ExrbJpte2pfmRoLuDKuGkVoAECDUEI4UwcQncx9sjABCNDKi7pQipU9Z1gwg32t8hECj7HgFu19Ythz3i1Xq7Ibq2vqHExjVsJoNdjyDhUwiVDgL3qX63a0YUjihjobpp1m3W3/v25P/+1LE0IAKSLd1h5hNAUYX7iT0lShv9Ssl0uVR5hPx5Llq2ZDuQBqR2wrC12xMPCcrZ2pFIFiTzQpICbcsjdS3XCU6CVmqssNE7o1stDWbw6zbQmx2ZwsPpTIw4z2DtSiS00IBcNopnlrFa93/8xcbFAET6a7Yogc46ioAAICMFBEEGAixeNfDVLrJn7bRxolCrvsao9NVfS1RNpAsKNzKBR23Bhf5WwoH4ZTpFKxXIEB0/YXGnAuosX2Bu5Zc6FWVpLoMN7/8DfJOiICkXuKdrf/7UsTcgApoiXmmPUrhSZHtcYYc8AcBMcdloo6i9CZMFpZBMhGAkBjmTifVyEHMe7KpZFVSAw+FDR93BFcwD79pUzuyUJRdy3n3d+4KSEqN/l7Vm//Q+qqyO+zMoQFyDgf6hg19UEBRZdoqT9z9Uo68vUGDgqH/orB8H1WoMopIgKix2F8JIboXysMQ9DpCVFI/EtVpUJp/Xmz6ux1FH1esDayq4UW2cGDA+MFAOp7wVjSY9pIBGBdLgIWaDxEeSqt9ahXUtjF2726W11Q8zQL9//tSxOeADPU9Yyy8q8FSkC889JWkNbkMQ3DSCycCu1RfgVJxl0ExCIVBkItyuVxkoNvTEda2ZH0d9ZXiHzLwx4D+tQAoiBQQ5w20MiQ8sqRs4ECDxE2VVYlYcKzZFhFZlSTGkRA2LXCl6BxQWTRc4m9gTqFlNsR6qEUt5ZUIV4tRk9C5A2RCCDI84A1AIDUyAiSfCSMsNh8zEha2euNwik2azsAvIxYGA6PGDjGbNkTLE+yHDBlhVPL/JBFronWHGZGg/rnSpUTtcIVrRtF03IH/+1LE5wAMGH9lrCRwwW+ZLrT0Cby2yvc7V/MNWAAcAAC2FOCuOoMUrRYB3C2nMtravZSDPUCpSwNtFfWJN47WQKeWtcm1FxIHgEd4YKwXSHBDvnQGeEpFjRxvqdWkBKXvzZm28bVaaZu7IDFy4YIohlUYG1L3Ct6b1dUsEafKlSaSaTqRJeS0uxDzwBIWBOOZ4Bi4m1RMGt/FsFoqpCwlW51NDbbzAQAB7dPg7qLhhGj4u2+a4We++v5RzGw8QKoZLcVOISbSl355Siaw0EQOeP/7UsTmgAtUX2+HsEXBhpGtZPYNKCUfx2Ub9zk+hQBIyZQIJbjuEQnCcbN2IyI5MMBNNSUZDoWjsgIc+ZUbdvmjCZxjkCM6rFhvjH9Q5u0c73QCFCaO6GbnYrURYpNTZN9QYdY/u9RGi480XGiMBDbCHqMQiC0Q/Y4VVWAAQUnBlCYjEX1XLFGRuTImj4YLhC9c0Mp8putvXUoZfpt+lpzP3DhfmT0cNbtdPZv/YgxvdLVWnp91fr6+frVknpt13mUo4stafCvDcliDWp9olbH1//tSxOYAC3SncYewZeF9Eeyk9AqI3/f3/N+IjVqjkMkTTWO4UkfEMvTSd8py0ifRDteYmzlJOqDQOiZ956GJbsKABjXX7x03csKD6eqv954ptK4X/kOhyi6LWhDuZPWoUk0DLJwABFYIO71M+hesQRvuYXaTL2VuBASENIARKBiKYeENU4ERcBdcORUfMaAk6OCAMHKiPwwUNNJAAGunJQnM76CUfvfV3XEQGxFiFtFc/jfuO5l3iuzxxNQCea1AQRguiybaiT3rzGraZmlQ+TT/+1LE5oALxKlxp7EFoWuWrTWGCLhoGCMCjHIJiqxDEEKJe0TgDAAdiXsnQuNl6sczLH/bm3aKyRkMlgJuu34ch5HXhxuDmSN6Ym0ycq09d24PpbeWrNSmmYpfIEar2F0EPhiMgSEIBiRAs+9eqNoSteFnQUGKzTbizIQjT6Mx1u7EuadsEEVBLLFdfyhPovE6cPhR8+OgcWWpMt7R1KGbg/u91QCA0TEArFnaPJeNFaUS+7SLUKg83ElXkuYTYBECQVJEQV5qJwX5QjeZQznTlP/7UsToAAu1L2lMMKmZdZTt9PShLElShYS1nY5obVp0EWNGW5JQlYz/R1VD0KWI0/qZCdFMOTtwA9ACICyhFyAjhqAqQOH4yMCQkNjOqHGnlgz85LcJm70mNT+d21Wvmlyl2asLs173CU8ZPoiVhAlkfb2kg1vhld2RVni0rMPkrdCluTSj1mUNLV22FptkKHsU5BVeWBkKxsyajq9UgWVoTzGmrjPZNghXb9cneqeG75qymuNIT/r12m2PFYjcdTcSWFHhEOi7OkN2lv/8WnhE//tSxOiADQynY6wxAcH8J6yVgw8a9pNi0MULIGHrOI44IBcuIkiJyTJABoQ5ECxspvKtWLytZbF3vdicnVEObWR3C7M5etKf95oEbvtoRvgxmYh5WZbqFHpsv1C3LvYzUFHSRFrrlFOyj/QGm1nCuguZBperWlUAAAQgEIlOXJlBlWQpWpGQ+/T2w29ELrFgYCQJCAnMUSzg6tnBiMZddFu7n5NtXPkQj+ZqjrdBX6BpZ+Z9nIcf8u/VkkaitQ7Eetr51sx6kMXu5kqyksQRRHH/+1LE0oAJ9HNzh6RnQUCOrWT2GGDOTZTBU9XD8NHb1zqCLuIlAEoRRAkAMqY7xwGcLUoTrOdDmRMNPRCuYoqki2mTjVGtklFcPimwxr+hJdTiBuWe3s6ef9+ylBTdGFdwe7Iqey2UAkeBZZpWRyWLGzYsVNN4qDq/oSylagTNZYDTjuThKwgoLwvZJyQlzTxnFfc0ByFbU6LSiFwwbbusfADpVdbxUfWbvmnY6//U0p//uYuIhRkgUgQXEaD4eqSfYostQZDjwgTsD1qHWyVGhP/7UsTggAqYi3WnsQXhVhTtdPMKGGQpAAQfJi4qwn9odZ9/qKkwAClMh/L2VA46r4UnJG264tnx0ovLYSHkOpo2daqADZHBcgKiaPywWh3t5dDt+aTvw9McH5QcunEYgrQ6XC7hyMTdDngDdz+ojnclrY5OtKpQbXZMebOKAFdgkApS9Qj4I2JgWF4NhQIprd+MqVpsY4kTvot96vOx3x79J4tLHz9n3fPRSf7SECvLyT/hEmcKdfcITshP2F8hwjlfiJ+X/dE5fhUqvs/mzM3o//tSxOkADUUxY6wkq8Fflu009ZXksV0hP3219qTdfZY7f2H73+mZSW17zcJ/alLMVnl5+wsJYJgPeWhOI7ULhmrKhYTn7EKhtXnNEhQcE8/AKUQBELLuCsNwfZ0ow34qvU7NuiQnkgutYe7b40d9BMjcCs304fGf5I3myRBEpuxCGg0j8UyZ722ZPEciJEDl//uchM+F/SyE8Ww84VAbMBPMLbhGVhiYFI0jG+sMoxIn3q+FFQEQA1goTKy+juMEVKxtk8EpFhINW2zs4HMPyej/+1LE5gAMWIFjR7DNQWKPrB2EmZhKY6xFcl26q2UIq/PDz3eQWKjK6BMWd1szdjnMjempCCzyY8XU72uRUxqkNSuxDgMde+ef7HI3K2egMQECMqlH2HKKh1mVOkgapc8Z2dNgo2dH5iUzGBvo52S21AVnNKQRf3wGU+FyU4uUKEeU1gVr05r24l/+Ch5rCQZWWZr6CSRK5Pp3GEKU+WcxaE1/H3K0430KQPBARlLbsv591Yh4s84w4yUMhdqNTblxVam+CUQQ4rsCPqGTg1KOEP/7UsTmABHpo2dHjZkBkrMtJPCPMVVHOpE9Gd/RdomU0sUZEpFqy20Bv2d//yPQhzxQA6X/Q++mm935lEAsKMlJJoui6GU4mKa0bJ5oCCoNSDpQAW1ExxKEFX2/ububH3iAG7r5YReZmJP8evKGO336KGrdE+qb2ZelSPNs30+239K2Jq5RU8gsKVC4TdeRFBV5H97GGq6EC5i1GSuNKl2YZzjPrvyYmmZ4MXWgUTEe0qfZgXn+3VKG5xfsXEABy3SYQnuw4VD9HNMLqaqqc9v6//tSxMoACrinZqwwqYFmlSzZhiEwlSit2Rusk4sh9odGf/YjXZO9G/kq46ur9oBQaAmJJvD2Mt6NwOdxOwJIYxmmLuZLNp7SQzLB7xF/OhO/z31K/SKREJ45fuJM5YJFspx4PYVoIy/3L6QIPX1gV6DG0b2y7qaDn+P387mEjD4nHCwZGLbVAuWjzm5EiS5DQaAtMWBcnhLoJKtAgaKtxorqvEvXKkCQQLw9cpHXmSYs6mxtv57L0YmyrKHKhEclAbFrSCwfUhb3PIDV6/TCPhH/+1LE0AAJ0ItnLAyugW0mLjT0CXwMohaQQBDJo6TEDhPyjv2XBBEFyLEiQujfHAZALlWn+sZwSBXIXHc63nHnvNwXW0b4M4zPABnTK7dbqCjoOHY4RkCai7D4zzV5wvy65Mh1ORnDEa9CiouMNnUET7l3lKAnJ/7ulQDUUTTjRKRZSIsK0A6NRRn4j1IhqYdOTWt2iTM8RnMWgToi/gthBqI0XQNgcGUWF3QVJgXs0ZkaVaL4Ca8gTbMHwYegsGA0GjQZGCYhEgWEuM0q9eoSOP/7UsTZAApkwXOnsOkhYxTs6PSN4LsdBWcEKBjoEIEFhOTEopTWViJhiJkvTXP75ubxyiEz9c8pYXCnLlpScJZNvQQGBo+sCKUA3QACIEEPEYS5ehZ6Mh/PjkGB8UkbQFpprES7G5KND/j+09ofEUqTw1nHtmdz6rjFQ1F/EQ+IJ1yzDF9a1pQy9eS91H+wIQ4CA5TGtPZgSOIbySoEM1RYRkrLQACPUWolyyikLExOsJXl3R0Hoanz0chbDODwQh0NIYJgUOwWNcVO4MDhCIxC//tSxOEAC0RxXiw8x4FRjiyU9Y3YdhqdKitUe6zrYIBq/qQ407RlBlsV5Qf1L2z4vWQ1hx2X2yaVtlV6U5oqNjPJIKGdMIDxOKjh3U96CS78xdP7u+h29dOyM1votf+2RaCKrwxj+xAnYRtPbjx2t216v6uo9xrOwjyQBU9wdKwWDq5Zt1EASAMeTckaWEYedFRGIFhU2LaJl4BTJyaanZYMzF7qZ93hTym+brMvszGlprhQNrLAW464KKKuIjxNQYAAaj7ETzN1iVjMpGMMwrL/+1LE54ARZWdtR6RxwUwQ7iT0jSjXTunx7WBsAQCzF2BJgoaqFmLNGNy6MPg58TxYVAphAZNsEdStm40zSUqoVedJSkHW6+wLNX6haZqMpVKEvlVUt3z1SgsbQ2RuqUu7ml2o/qn27p5b1Z29bVmuRoX9e2XtRR0uU7PWySoQ4qSE1CpQCkXCSJaQ4+nAwWhsRzhDJnwhkcPgnuA/NyKz5lZ73qDv91M0q6D4TTSKkaT+OM8QlhUKvLuAo4BsrZjPqX8x7Y9CuNRYppYkhTLDGv/7UsTWAApEVX3nsGUhSxDvtPSNOAAAgGYAhFpWhTJWRbcVQ42hzE0POS66wXlLoLDwh7AWTtSQlc9YPcZT1j578H2WenSf4sPRRKbxe+vkU+e+er4a9KnppekxdzkpSorEXYIEL7w91lTp4EQOdWEhEeFmj0C7SymPevbqBasG1hlTbVgr852Py+OTs7FM2Myr0mMsTCpDybl+ERuOxsUmobcO/6nFMbH7alGK1TXXiXQlry/R9UnXsik00S1IJmoqa9QiN73sZXbU/aYU82LC//tSxOGAChRzZA0kxsGKLSxZpIm4QsZyYpqI9gRoIGcpnQ4FAwBBaokjxwCn5CHqVrGseCNiwEcys6vPl9SJcWZ7LC29U7U3R2iwgwjCmNHJ5ELPJHKff23vvo8uzogfU0aQa4PrHOK2Q2MfdPjDCqiFWt6qWUcgT5P+jWP66gBAeUFCTJySW+0N03lkUEvdZzT1qu3KipskXcyOPAEv49krUBq18YHiGhnd1hmOZtejSp3vlrrV2nROUmB07E0JUDtZmMYh16iVKl8zlzTvNTX/+1LE5YAKaItrTD0BQZ8YLLWHoHgeu7gAdidDJNsYUIBwJ7xQV3RidnS0IHIV8LMs1Mt0+nouYwsg7BQi5VhLGoABgRwQQRiBuwEz4OVcIqTF0tsYGnv5x+iNlbP4h6VVDrF+7prA8Tbd3adl1jT4jMgo1xIVL3vkgigZWRenOSamG4bfsZQ6xKvq5Sv/dI5tzUUEIAgmQm0QgonreQgCjVLCxMzUuXHGGre1i0P1yuBrV3niIjqzASNSJfifNd5f4vf6bka1/dR/1JBPCDtrH//7UsTmAAtk3XGnpFEhiJHrlaeY+LtZi70X3kk+rkaWoxyM5eBobS0ZK2XTRzR0CfblDQKuQ1nXaDe5POC587DNThTKdht47Und+lkKz6OUI62HX3dSQFvVSV9CHjeqfIxi5qXZd9AQk9Yz/vqtYqr7KFs0NebsSwar9KoAAQBEOeCawyRUCzWQLFTfSIfposBQunSFp4V8ch7TBbes87FAyq/zo3EcU7QtQUZFtWH5pmZJYEF5+BqCr+UF0vXnv9E+ku1RT69U3DDOba4koWXT//tSxOUAD9mbYKwwbclDjGzlliQoFw6DATNtZUzisqCv+69f/WHHK5Y3pldMs5xHmZkU/UUlEmWCDAE6iOGz0YF0kISJGMB7YMbOIkgJEnalhe9XVC/1MpqOv+BzfippiraznrKJoHCGLuZ67rVaWRiIYawzShzG3rGLNwAAYACpwoQnmrl0E8j1IZrKvrO4Au7ReqQgvmmZEQ66YNZqsVIu8oxxOirMFF88MNtkj16GW6t6DYobeMQXKuignwMfc3UDQA+aU9HV0+9LFJOrJmn/+1LE2wAJrKdirL0FwVsYL3zzjpx0P5wWtCQKjxDNDttrvbeRhHGkd8NLHWPSjkWjJKF18Kp2RNGGzK/PtKUmdzkOREVE1YWi+qDBPf2Ix//kN3WwZGfvr/JYoxWNWaq8+e0EjjE1hY2S0OuWv2XHVLP/sbuj4uTvbd6VBhUAhAAABsRNhLVynTYssGnZKZaGN3TqSzULCLdp49r8AXvrN57i8b/PU4OXdpVYaMNJUEd/jp0dQEtyW7h8QO9YnhwidQHHPJhU41hsa4LgBSbl1f/7UsTmgAys311soFUBWhFvcPEeFmlIVLtuWXLjxQAIid8nY7/UIotYRCeLAbqFn+egmBCyVrZyIyB3h+DmI6sQyejYlsb4scjr5vS7P1BBbeIFmpwQeliIiMuIC9IIGQO+DxishOAQuflBzAIAx8MAgC8PhwMMWxKyZxQjecE31EqCaqhlJn3H/GqPqgQ5NNH+Qou4tQhQ7xjMRYioE9kKnjqnWFGoEKaFBLWSEgWeTK4sknLbFLEP6G9VjA0o5E8xtxWuOJQchLEox8vOMpQ2//tSxOaAC1ynXyw848GJmG789BqcWFigoxpKpQeNho/xgjGmQ0OiIk8rGNcVQnb/6ADuQCcZIRsucSEJqfSTPVTKFQMKxSWzxliOd2oVTFpUepKBY1Mqy3u1cWE4fcuV49TzNDpFc8qPPic0+Lv7fki4ciYEx3R+QPsRsahIYHmAxX11LIdfucUJTdoSVBw2LRdGqo/plhKOR+ZLRycUZx67bVcH20F1aRJ5aM3SDtYdje1tj6KjMPFkptpK0uMiQBZIWfW67es8qZFSuKkkRGX/+1LE5YAMfKlbDTCpwZkQ7MT2GdgeL72yQtUEC4GmwkAQDCVC71YoA9i7vLdaez5Ub65rC0YwZWGvLOYj2B8VMnmdlz5tZQFxR5szXz291UNDc1Sosk4IniLT8qTJCOhCUrE/ljy2vWlCWLdsFCTyM1+cMB5b3mdSDBK9KhA8w3Y4qW28TJRFxXL01hHy4nHIMpYKrJaJQZMJcKLH+QxNH38nrtR1qCa7gzxdb0FVaBFgiCgiftrK7HkiKEKNCMalTwq+KOJoChuQqY3JKrcRp//7UsTeAIwA2WoHpGuBSZQtpPQOGHaWybgs476QAIUQACEm3cbwYZXH83oMRWqcwZSchliULU2qY1AcgbXkBZ0fkk/i2KoCcS/d3H9izwtVlJKrTgjsugg2lBRWSdRbykRGVtlunJ0za/mM9f3/NrZ2lawLpJdqddL66xaSoVVW12WI1FSqytHKeaFPnP1TPRsFqaJF37UilFo/yKbc7EzcTVPcOOvYCCHoH92h0GFtGdu6n6sok+0YJlvKV0ZXMZTLZbNqo0HZmVbrq6lWi3RR//tSxOKACmSXdaYMVIGFEe11hiGcl4jHngSdhnUOazSwXAQCCSpuMEJo0zbOULk0DGUMNbixSeMzuA1NFI96Qq9IGPma3kzLSLMDoRL3mI6SIPDL0MjfFfRetBpmLZiprv7l/j8c0rT7/7Qy2914aILdmmroRooAgQKQCEnV4EY14L8fhjjAFd0sRRF+xGLBUqmUtidzayvhYByKfQ1w7gsqnqspUd9vkEXMQxfxmbnAGY7uR2pcGumSRkhzdWZFORYc2ErbtXETe77ek/lw/9j/+1LE5gALcHtxp6xJ4XonrHT0CfDOYGb/l0/Nb/7SegnIwEjNbpbmagOeDTNJVuCiFaBgjmn5dK91QsNHCwhJERdEMlrTskNAi3R1dEkMTgrDkMFxyKLkK+OMF9Qc607HPI060ECK5emlCiWc8e6u56h2PFCYnH8K8zf3pV/dTXL3C/2/VaP6JUTUc2g2yMWSrAjJ8cepzckj/Zv72Ha18/yyVQwIABS7P4E2lgMUDgBmldr3x/oC6lW2tAIeuGzGQQIbDMq8d0Yf2QLb94xRIf/7UsTnAAxZMW8nrLDxUxusHPQWiORHTBju9BT/uIkbch/7//3dru7/7rqZc99NALZXP9ItY5Jvu/vqSw3XdqICNxFpElJulSErJgvjHcpEUzKqa0QIk8+gIKHBBhiJO4nGKLLs/3tW0ZEeWgwIg/CFb5dxAPkNSkkgwToqpoA+pAA7TYMbL7U+N8vrGHlCBtH51QEAAC5s2BVHkoTBRZW3SKo08KqONKosheaKXJFN4queiR9GW2m3cmAhQNArSeHlniwlAoCAwGPAR5IqbOqZ//tSxOkADbjdXUwwScnppavFhiD5N2reVCan3FTqDdW/lj3+iV2fpksCJQlywMF3VfQWIXpqvM4sCzMMq/kzUiqiFggEbnpOBbVISKq2Ui3iwVbxmMFVZMtKmjTMHQ0MaYOFY8QqYGjwu4rGGBbGO4a/5lJGV+0cAAECAAAq2u0qiNBGZJmqtETWHTjCFIuhmiDbpqeCWoySV9PytlfCXbs5mXOqegMURuyh4rEZgd4fkuxGQMUFSwGPHwq18NpJBMSPiopKlXo2xCvGyVxd15L/+1LE0oAK6E9ox7DDCU0MrnT2GDDenX0Voc+1V4ARCAgAIuDARQBapzXB0mQFusDIPE+GwMRaZLmzKkW+C2QHlTQBnxIKs5wwtSULLZV1I/iToYtSGNawQ9a297/bW3oCQODJVFHRMJ2aKLn2qyTzFZcVCyd1fd5yIAWSSFLAMwhOwmf1pDeqJPvbbszV11gLJCeQfOEQ8jbWMXAakZA3E+qi1AhJ7VxViE4LR1+018YDCIAdYeBxmomk4YNhG0zrehTL9SrFRUEEPOoQxJAIxf/7UsTbAoo4aWjHmG0BPJBrlYSNqPWH+//6QEJ67EkiQArGFtOiiQQlFOkuuHNRsZussSIwt0k6EuT6kuHD/T2nmpr+9q5v4N8f4zvUqx702fAxjcs4yReBWey8guyWY9zYx6UCvGanMz+lipu787koqjk5sudJiRjP8mnxa2tijbQOtqfo79jJivreThKEZvAwCm8LgKwAeCGPlGbhkOU7G/Z3l3yoTbIsN9YCLOtcHHbbHeAnHnhtGZmeDlLQegA4DxMohKcEMtscmkQiYvTC//tSxOiADCSLW4wwcIFumSto9ApQCrcxNCyi2QAZOXJgiD0gTPoNp5dMEJQTWYrfwAiPMEh0CbD0J8a3IaZ/BOjMy4KRm8gFA0GF34mjufpBd9IxGJOujfSD/YbC5z3Kys86Uti5yxkrk8kERuaBtZAVyKcYg0S4qplVKTfH8X9XQ0JKHQXNa+1eTqLWRTOJFY1zcZt+popWsn6bBWKJKdz3JepL7isKDQfQTN43h88SVDFvMrxdQCIgRIohqn0hUcr44iSbO2ufAINrpBSACkD/+1LE6AALqI1jjCRq4eEzbXTwp2U4YgQL4qFb6j05rFKV9ITGrLFIIylYEpTEIZWtrKjHJbCkZJ+nM7HV8fFulv6Vol2K39f1VzOay/7/m7fxAMzw2wr1KqZIdllYlk/e6mkbSUIxAsWJkTBIUGR1gvx0TV0aQY/GtUhmEJiPUxTNxaZNkfcvSzn96LKobH/2seX/rD2qIjIOAe2Zw10fcr51wBOu68opZJqJ2QolKQCBaFVeopAMxaZPlhQlGII6YqX8AvjlFTDahxeOINWgtf/7UsTbABJ9kWQHmTeJeBeu8PMJqK9Kv5yQtltOU2fv/lkGosPc1B0krzwFJPTXNsF9DwnfuSKTDGYkD0279WwmLP5VO3qBnM4cnePtI2lRDRNBQPQ6iQ8VvVwwCZT4EE0kZBdPRwQnjVCMLZMEI7vZLHIVNNyvK5nauvT7tSxFYwNr7nWPod+t2nyWEg//qW7W5DEprQ4noZGokiQEKX1AJCICoooF74yOmjss6pDOaS9Re5gh7rpvfvdi4QJxsaJ7E+pdElAy5Haamt/KQqWf//tQxMAAChUvd4ewQcFJmC+09gzgSjM2ywrH0zf/2+r/7aauClf89FKdiuVADAwQBSIaGm2MvszNrTeQ7KZVR7Z/jKmitcQkhaSGcCOfWcji27AYpEXsxMgY7rqZEdmcrdp33p9c6Z0r023QS3b+v/T/+lt0DAhRn7thPZ0qEzNIQHVXHGSTAj7nCL5YlZvn0dj8EBRoIi/wOEApE5RP7EsT7CefH3/ugq1VburKxIKnjTzo1U9HZ6afq82v3Y/ujv////t/9Es4fEAc/sy0Hf/7UsTMAApIg3GHoG6BPhfwPMMJ3Ip9hRMaFclbaLdAfI18EGQk8ztqikulIGCqfdeQ16zJFnk1PlcKatHvNZDxOwALY/dus/bCx+jbS30bPsqvmZeykJuZ23/zmp/93aXW3nt/11EEBhNDU+BhGdcUEiyD2Nr2C9UAJAPZFEhErp+WXig0olVWXwxTvTD8TjUsrwExfHLDweOXiKx+eLzNZeARyQuMTI9BsJCcOBLo1IXiZZBAEBzsPgw3SlE7Y+gMkShz07hPNfF+NxNPU8r3//tSxNkACkk5gaYsTXFEpyxhkwnQjNZXwpyyS/9zGiO3+42GubVqKAIVlA5YZe9D9wznXs7n+kACEAAAIBaHixDqmKgxgmJxUTGiU9K8MTYyVFikE/2IaWPeHamrJyTzQUlAeRIkniwwUBvCSSIRc6+9npc3QxlqP1eiXdvoQsyb6frY5KogJbjoMw0cHAgmFSH0kxC4fRiMkUMJ1v2E09GVlcKEsygQBAhcpfiKZECG+EFGikUsQnNpCKaByQdUXykgNHtAfe4S0VdzxO8go5X/+1LE5QAKjTlz56Sp4YMnLXTzCpBbSOMJgAZQTBaKSTpbS2mwrBvQyfWQxmQ9Sq84GytFtVDyyolIkcGv9Q7B+Wfpg0SkNUzJIqGka8NIvfXjZGZ5kJilZqQIzZ6sNiU6HUmXSVEXh3WNc0s+eOgJVYysFdIGW3h0rqpJJhp5JpglKsZ5HiXMpFadCygmBHTqDoUyQj07OW7xN+zRm2ZSfjyYT3qDY99wzlZBo3+ytkwpqFZMw8FkFlMjFjyR5oZFmIYRm3gyInsdNt6WjFqBoP/7UsToAA9JB2UsMM8BN4rtcPYYoO7P2kCMlJfqAEAAnvypsvdsA8a5I3tdmWqS2UAdPUq4j946HcORfEJ1893YbbO7j4w7bRq0K4cmyMmE9/YQsmEAKIiQBJYAIIImGiJF7oq7X/2qGUDjiyykomk6+wrVAESUklKUBYy7CvAUFs+UoO5dFrh3Kh0vuDLcQSocudnmNM9+unuNt6wci3v07LDJKc7uVKjotmBHFuMOZu60VO5lNYsEpW9ad5bv9pdPrev8mtUGWdrP0szJqgYc//tSxOGACeCnZgekawGGFq409I2oC61UDhRKMVQASAQSYSAflXLHhGVca2Zeqi2IZwj8qufEk+j8kr7NP1cBoziQZ2abrNOuPanMkmpSCsqXS4v7hVg5wgGYVPjUiXtNWE44+Chmnf13Ofl1bynIvwYGsOJHXIkwBUTdGgAAABFIAhnMA5DNJydRjHuhZfNIJ4sImqwqqPoIFzlMw0dgNrU/I3YxXerpAfnmy6UB2VkpxZr1gsWXVXpY5RH61IRTv93+7frVljpAOVrLIHUvch//+1LE5wALwINvp7BroViRa9mGDXBcABPVAlJKHQxjjnRplpedpUaIPwRCYw2jOa+WzsS4XiQoQqQIieAOHR4tKkS9edZdvIhekffI88nJ3Ol+ldwMW7uI9K7AAh8GL/o/wviJ5ITws/OoW4j83ZBEjtme+3n9wYQEOdtZcqkdhB9P7u0QKBABWtNVRacScfbIJBYr6aP8epFLKCbiyp0iERIVYM7wPC7iMVixGeqSnHQSkHcCtJQcTDFiNtNwq7jxSr1v/CvNDX////vDNzDSuP/7UsTqgAyRWV7nsEnBfZLrXYYJOE+aNSBEbOlgAhs+r5csN/f/rckipAwXUqyYvlU3Ibn6wIYDcpM/MAkBBCAYIyihI8Kl4NJgUbIbd0QndIkLh7hjJIdr1Utk0BMccIjbzI8SAbJEQVM0CVzdbLWWce/RPU3ej/ycmwwga7TUWCpBhYBTuywBODlGqsU0hRPgh5Bk+fKNIybR1KQN9POdFtAP0KFSbHZuLIesrD3LavyM9Dtb3fR/VDKJCIslJtRFIqNOmqFCVV3q/hVxpA8F//tSxOaACrR9X4ewrUHSIezo9g1xCTm7TAqN3v3NAAFYDJhLTapBAV4+TsRwPc06idnKSRTM5doWNHe9wcmZpCsK/SW/3ItEwHMbPbs+LO9Hs3s5WKyIlVIVyabF31fVTMxy9kq1e////a/t6iZS//fVfyxSwlkF0pUFQ7l5/2uu7llKfxcRwhlFGjjPR4VmooVmsylN5J/c/scs9qUjqTGh0odgsHIw5+9pWO+rtRwSPZ/I7P+hw5PXkWXaV0v9H/8+So1br9qKyyQTzGFhC3//+1LE3wANkF95p6XnqTIJbaUnpCDJMeR5SjRKmet5EgAIMq7v5HW5iiLYvl6O9Ck4WNEkWIS9o551eSVzhYr8csrRvCwCg4PPpj+1YKLRYsZqhWyDTO+qAgaX7zK/+DDDthGMiU37Hcn0K8k4+6Kt9XXf9aoAASM+aqqSTo8vJ+BEDtUhQTnYD3HpmjlsT23yJj3R9FOxrDYun26E9Ri5iWYFCkWuBcNTWoff1rP131UtIg8rovvUrGOCO1upg4y/7uvlAyUREe6pVdbxTN+xJP/7UsTggApApW0npErBbi3tdPMKGPfQSZzPspSrb+ZvsQw6pCMiwosXCc9WtYAQAIALYXvMRFYM3TUjxqgsALoEaAQcXJpel+dPmxDCPlDkrreGLbfqUyqxbZwwXpyjn+sKToCyFOi5g8Ls7z9yrb41p/9wsJaGiAY/SDpjinbeY5tmJ19dwFFyXELlKOAhJU4ly3FLkYIKDEcO4P9DlS1DDgUqKdOuo7HQlLKjE/VKdw7xx4hmd5n5lQjHOgNwYYUKJcQ6Qrozu7mIHHtV9UIy//tSxOeADE1fd6ewSeFPFK509gk8TvZXun9v9TxsARVRRxBPpA8mQOdaBwtQsip0WmwAUI4XW0JCKVAMklSGnq6JkNQNTmL5aSSDlGNamdGpycpIRkUEDTydNiIoJDrf2fzapTUIgbMPOuNER2pKomE26h4f7WMCBU5ib+yJEuGF0eigj0zBdS/j8hDGt8pttQECbn33eiS+kxNvNEcoEaXy/9zV5HdrKtGcHUR5vxvcpHJNaOt5SWT6aOWdvkcmLbg9HJza6NeTEBUHAAAuAbf/+1LE6gAOhV9rp6xWoWIUq2WXlTggF4jD8tqFxwdBC5oBcFoUERcWwpJpG52zzCGb5wgzfiXDnl2WVJUZ2Obc5psrPdv1qLUa9bgIeAUi9SlReWHjH5iYWEEpXK3+FPMpbUttWx9iVACpVxq7ajNiZeKQkjOACEyGGI/wjcFNXQldRCT3Cjpd7/Sf4Zms/E5mIG0qYcBAXk26Q91iiUklDn1JXpLmg+h0KLuIhkQmV2s/1eLK9xX4C6UEEEpRbTAHqDtC06Zu0qWm7ILHZEChdv/7UsThgAz4/VpMsFDCYjPtJPWlDZQHsmqROgu71qZN0zDR8dPVtFgKU6eVbYVSma94cZn6PLf+YTf1WF+mgfZy62jv0eqntnZVcSl3zMNoK/6TIiLmW1wsKCEFBIQCBCYukkQXFOX3SNLR0mLpFHkXXS4ogVG/ePe8/s+vmWCi0Yk0zamdFSB3bbwyKm3GEoTKkyJ9Xdx3uwEbbrCXYCXFe4o3rFySlxbWtuLtJzkiewEmm/SlDUOcPckrqcx8wTyNMW9KHU4wzzLnja/mIhTd//tSxL8ACxypZKekTVFHi26w9hisVAgZVTmQbcOLvpkS9guOc/ru0z93JypVWLWmzaEm/qC0kPe1xqOpT8i39Sy+OS1bWWvhgGQJZ31p4BFW40zcpjDN6LAACAzAJApNkuUSEQ5Wl0NArXZ0toqjsqpkIUaugJWC2AP864MZRJ7mfRESb7r7HAu+G1Ur8brE4ewnDiJzaO63q3j42f+n/lU/7f8krPfDucYplMSlxu8kaOSTmIItjCHm1Si5IxSs7Y08yFO1Hak0qacQ7EOMWJP/+1LEx4AL7Q9mbDBJwWGU7fT2CTyipXsJjxc3ts6GnWxVbZWbiwhcs2SQ2RFU1luzIOgEl7voo4VRvc9g0SMM//rc9RlHqiq5E31i24W+53cvPvPbRA3J1rqpGPchIQYUAq6SVLcEgTJ3g2ioOk70sejAJfqx7c3ErlQG8g7akHTGMTJeXzdRDPSKi1t5mU5B1olvw2/XS3+gqjsqUcReRnJ5pP6P+iFyaE7Lt2T0b705Gt06LF3V1fW3QgBQiMofCrP3o3SjYmhVMDqbdoDIx//7UsTJgAvY43OnrO9hhh7svPSeWDm3sECEOx9uAmjDECdvsBGX+9/lRltGWnt74iM96YqiCDf3/RRCIwHTa39d4PcnA99P506776e7u6eX04ZnhAQcF0k+oTjww0H2lDgfNv+J3/C6nI8DdMoNIcJys0Q4XCr1cq7TyDh+VkjdlZe0SSILhy039MwEJEwdM4dSezPvorSVpHU1GoScSytNl506shzKmgZcVYVjcjApQv9z1XK/s6uW2ex3rGZ2ZLZcpI8NyycGmeDQqouVkBX9//tSxMcAC+zjcafA8OF1LC009hU4vyls0frvP7/3+aoAEqEEYC9Ayhb0ZUNhkJEYpBiej3AQB4PmnM0f6wflKu2Hr9HW3BnBeMGgO8CmktErIxE+dUAjWKKDzLizWO0npNretVz3maRSEc+L7/xRL3XZEG1PVoN9LbOEyXuwM5qEcQgYtYyyWS9AeBMZxaSKFET8Kt8c+TgsuBTUZAsQWNBw4xxm1OdhwaUBc6jWrvvTQmn+oyXU4CVDkFF5uiQLtIHSldFaKhHTaYXd0ph/oaz/+1LExoNM9Rlop5hxwc6pLcTzDnGLQpPBzHAdny2YNuFKUhbowXXKGcI0GY9SOpTGHclsxk7bzlaxmJqvt92VWyhDBK96REqtxuSUmqhLF39l7j30dSbyud0aRFlhLV+57LNHG8CqsBJXDojDSpKbw0UYHvsORdgyihQxBgL/dBSRKoR+w0oPim50VQiExwOFh3iyIoC4ST0EQMVDgjMGXof3IRZZjtOhaU956saipdUPZvN1uzSSXkwcht5TFwpRkjFLL40vSdnmcozOJQbKzv/7UsS2gApQWXFsMGXBTwyu8PYNGKg0rOQDZEntvcEFbBTq72lZrPt/mBoF/zyRY8OO+6lbFJj0uB5JExnZBjt4uGSKQN9XIB74MAGiSoAJkMMH0M2Tm5OQjFCkHotMBj8q/GkEhBbfmaiO8CHO/bbeGOEgsZetIdBkc+vUOIq9aC41btUbeSefZdQTvMm4xbBRKLSqxQDa/9gG8Uxi7ymUdrO4/bTWWLfrS1RerKmsKnnoWrZWPIUDyRbcUeyXRZSJ8AUJrr2FUvAw0P+9ypqS//tSxMEAClC1e4ewQeFKjq/0wo3E+/UMnv+ZIICosjQk0hJJVCnrfRjSHo/UsASaNqQMeQeeV03sKCQaSBNbdDA0ylcCXq1E9jVxZzgTTWsrFAj2NIjvyXSZgw6VqUy9SI1EZe/aYaBb9aSomNoXZoZpvtT/gdX2rUn6ajKwC7IkOajL1aWwQ6ke1Z1M7rvy2ncldU7ZUymedakAm0gTbclu60FDG2DsVSUyUfuf/+R+td3d/KnEGQMDEongg6fA4feULg+Hzipc/E9y1Zd/qYT/+1LEzAAKXLF/p7BB4UgOLij2DDwo6jgYDHoATcgSTiiLdos6fc2hSMBkxSwKw8azoTFw2rEfTLX4zPu3+M2oqPrEPUGLLqm1IGJpsphqfE19Mw8phXr+/s1ud/dnJhDX8Kls/1DpVr1yI6XyMwok1Yrcv70iN8DS/uopQuiN1pplGA1DMBLI5FoUDwWz4twNCE7bQs3ATovUkPVh2ydMFDGJQvI8T4f4KNpeTx9z0AF6gvQYrZK7YKIOlx2ycKMcJbsOvWUnHguupm2RsT4q0P/7UsTXgwnwsV4NJHDBNxXsSZeUuOGCVALOuCbFmBcBwRhpMkgkmCCK8tvWzzY0YbrtPMTYXJqCiMIYglf6VE2330sHRyWxhE8ttrUEYqGNbdmmYxlcrIKQVK3mRSvI99/rqmj3q4zPpSv4lXJKaVWWzOPeQlrAFAZVmxcGUOiFKuuRvCbsDClkIQRhsiYjpSmDwS2JjwlRAO1/0tM192uWHeczRFFA+bIXBQ46hd7YOJK0NS4ed//+MdQSKPWnWs/HuodRbdkKOyVcGpa2z20P//tSxOaAC2izYA0YcMF8K6508I8pPLih3rFghkFUCAUUukCxFGjgvMk6EWW3gJW8XsV4Er5SIvcN/nLawETYuuhHn9ZHD0z4n0mBs/aHsODnZ/jIeLhaQJAfN11jm+P2oSD5/mafmb/GB9r5Q3rM5XinJ2aVkcBPHM7VKgCgIBSwW3LuKYRqUyftw5h2YU8EUfutDsCwna1HlfYC822eaEAor3K+GHR6CA4vOtZx7v2JdWVUAEof0/QMAn//qpzEf0n+AAzTJgdqUBnQck1sUE7/+1LE5wAMALNzpiRtIXOcrfT0iXSfSOXS6Rgk+sAICNhIkxKbhx0SS90GPy1F0MjmZUdVxEmTRgB3oW5KMgz6m9J9uUf3S28DFi4fFBonErNMxwUOp53OIXWuE7MhJLqRZ/VCJ31/qPFfsg2HG1mU1mcrcqJwIg3MNW9IBMDLwObaLN3ajiICMyWFcWrvkUvGmr0UeLWgUlFRcVURH5h2nDmVm4qAcfxoEhbo26GA3eZ9h5A/+H4AXh7d+4JMgu+g53o/X+cKR2L8mU1eDbxju//7UsTmgAswsXGnpG1hhp5tJPYgvnk5AVN48Hx5c/qeTqn5xGr2CwQ0QQFTY6GI8YxdjkHwTRKVWFfO8bIh4ShBAWD20EFkkIcEIKKXE3OXj95D45+kn8/heehb5ZcIEKKx/tfLeFnf3Pf0LrvNChcrn+jv/0/8+uLfnDMDGgAy7yFihF8B3QCjOBgAMniJKhCyG3BaAnoIqUqb6mDWmt1FeIRqOaceKr2x6A94lGJ0retfKD6hqprCTnSAHipC+ubOy5hnJQdsF1CdUPhqlztC//tSxOaAC6jxY6wkTsGmGew1h5z4mL/5inX2kgZSY24sWkBPSATAgTHVzxMamxqxkxSC6SmlqMaiWpShSDCjW5GbH3eezetKuT24rVzUgZHGxd92Eg7Aom7pYu9jNVShEiV5BydxVBdGhS9LxhHRxtkb/Xutek5zV5xuOr5LGFSFG3h2IVCJDZp+vFCMhP75faPGpLfVUXNHlCZ/9238Tct9MSr8uSrqEDxQKRVLijzNYh5qI8RQFymcmBiepDR0KkPgsZK9Txt9Y+Eflo75MBb/+1LE4QALhK9z56BRYaCmbSTzDdkDansYuA71jR9G+/zyhxSn6jBt6vYKoTOI1JWmorqrMtLG6SP68i7UURZUk4U0QAhIE9AJ2elI4uwTjgUi0Qh+4zPwjWe4zfNZfrLJVbZZA9acFv0VeQiBCBwWUDcOkUCxCqKJeEwYf9SwrdZdKevpuWNZ3+jeExtFACgAAVXYOhao0uYSq4jXQyaODkRaZcW63NSTzP1SBiQWtAJEmT4Gy6oYt5RbT1eHnRkBlap8xH04dB7u2jIt6sJJtf/7UsTcgA/9mWQMMGvJTZWucPYNOPS3yiSS34/LPdXddSzD8BW9J1Z15RijzA99RYN3t2tv1lvPWpnKBH0eF1H8xkdYnjC0BgMTnOXLefwlFD3Eh9FLApR6cSd3gfRiUCJCVFXKMHJ7zAYiXeMFjGs2MGt9aN7WHcl0C3LKjyjmjFItnxR9KLFM2ZmtzvhtcIjpsyc0bdg3EuTIwRvRXxBCFsKM8JRJxlV8Wt2tz/si0Dhwygouskyn6DKlsQLhYpzwHjZOtw+NyUmKSlNNX75k//tSxNCAChytayeYbwFDDW309gz8WTj1Ct/RtLyE/V2+6GHKu/+snayGDTSRHCqHjymS+4kA5BmGJEgrEihJMeIiLLUV4tlTwfH5CUiPVzhiaM4Yv065allROtwBi02PqbBYFgHfU7nUSEOwt3Z1GCpdWVCMnVU6UdlEfe/Wjg0+mkJt78gT5x9Aci6jYm3nRguHwdLXCwjHJnVGBGgABgiCMlotSp3vyovkzeeaOWFrJa3D175LtwGKM1PT8fF+fhSH5FqZtdIWADLLU+b+kan/+1LE3YALrNFhLCyvAX2abvT2FTSbXpjSRVNFQjSmc6KsQOy9nf98T9v1hxAxKPvpfcSMr9T+GXOUB2h5oHFOOnIkodvrFXyAAUAAYnK4DZJsI0XtJl5O9Fr8JXsCkH6OsEtBJvkvpBMFiZZArj9MCLmdTWL1fGQjgMUbPPDb/fcj2eIRIy/mkGY3/MEJMjyCH8LQ/95N1res7Uhjt/2mOXMABBdf/nsAMmOeW+Dl3/foznNKACBIAACOxkUo/zFUbEOZRR8VzJOVzcai+VES9//7UsTdAAwpKW+noFbhpxps9PSKzLGxYfn9GMXpi4ePwAERApv/Xc+iAiQqHFn/0DpwDFhxbjkEzYtaIIHE4wVqLh9KUjhiyb1g+D4n1OdrC4YRbltpMCVggIHE3C+mQgGQzwVYrTHocqncaFCdgVoUgZRtEiJhJERCFlEjW0uSmG2JGt+Nz1RgJ4bBCu8QGJRnyY9+zbWHeF0gq7pGOCjG04dlixZvV/Z/rc/Vpg6AC3QaYAiFY1JxmXspAkKzNlhbwkj8GEbdoXcjHE9e92a1//tSxNWADNT1YawwT0GvFWuY9iHZdWNQqJsCg47cJlBlZrrqcLuFYISjxmsstQkslVA9uW1dfQ7823ZZ9Tx+wNU/0AEFwFBBFGSkXeSipmvTsBJ2M6kUNP3SQFjRvQ0/VxBFTyxcytmVbCOhq3Ori9WpYTfzCTyJtQUa5utNTMpgAV1mtATaFzSVqKtzHZ56Hfd6GU0oAJLQhKabhUrEIcdyGoZBUlFnsjW9y2u1aohhpx1eAJD5rbh4WvXreaDg37N5oSttvQ9GRZ2IDzR79mf/+1LEygKM2JtnJ7BuwTgV7VT0jTg90KEhal3Vererf/93Ov/+ar7bN/NcgTqkrCpKFTDDjVN577AMvILNYo4ncQSgA1oPWlQciEeIDJ2cobB+ijdOXmHHztArZ7p9N4rplrf/piY4aVo0DDzlXMUxtjmHBGMe/YdullQKErHJWqfWTu/MuxQGUYu/tOtceB0OqPHIVcbuWIKVLgSgIBSeosRGJz3PhSnaRDMcXVldvOPJ0sMdmRUVbO5O2XJi9rPC9axjqup6uYousCGHJ/TJZP/7UsTNgAociWKsMGfBTJYscYQV4AEggZq+3du3TKFSyI/69UEAw3rv9SgsPa/P/yP//dHft3f5gsAZurVF1e8nOWiPFFyq7oRJOhmSjsujsvRGiexWQkZ649HtZdsXCjWkMGoKVr0MKJ9A+O/lzdFazvzM7EIofEgFU+vt9zv//yup0se2qnZRnqyoQqK/cUkpkIhTzu+PkJHdPECIFhH/I+/aCWyQQFHfFecjYoXzxFsm0DEEZWhdC9Kl9QOb2e5HzoX308F32ia/dPkShVfV//tSxNmAC9k5aaeY70GIGm30x56M/so0eSS7pPnPVCKnIjOhFPOy02ttOd971yEfS5FdxBXU93B7RDRCPggMIv8+RulPTb5JBZqCaApioBRnk8lcFUrj/XmW8dUvozU2MrIzR1y9UmXdG9gZU8Yb6xM4iBOWyESlMaJYq98mLnLNJaLOPN+s6mvKRgjCKTN1JClFtcQQq61TdTSxcbKHP7SU5CvrcSSbeYzPcG5T9xuSMcSjBQLhyIBh5sXc06XOi3PNlC6vYxZuuzISfgsWpiL/+1LE1wAMITlazCD2gY4r7fTFFoErAEhWhFMWWVIt40VYfDYmmNdLtXMBvMigTlBhWuFbSU5PtM9Y6KdXVZY71tK/9dzh0l6/u9d+incBcKAUquqLmJRXe/27p1yEBoO/8T01ElJsYgFR1aklScraSdKOcnBllscjaT6MrtvhrpXePDfM2HoU7MjXhms6s0gs6Oib/Wqx0Fouc9b1oK6YtUKppT7gptu/2JDQNOgR/e4XrOsEKYqL5poEWTLNSMkokiylMhBKWEz2IyTzZo6GKf/7UsTSgAwJN20npKfKJrHtlPMi6NdvMedSCkzVF9NzDiCC61nSWdlsZEhxTDX1aoZPf7aO1eizDO6zTdraZq7N/Vv7fdP2RQtoiLdLP3XKAhJEQoMrM241Q4H5kUE4Um6ETS5QncY3siROxH7Et0bX+LhEHM3v4ipcrFVePBckz/BgKWO/Xr68mqGubZNGT3qv9KJ//p3/f0KMxv1ZFJpYxaqaDST06N8iuH0pC7v0odibjJKFVDVarlc8VbIcejjV0s2vqFBy+LpyxKLQr3jA//tSxLuACki/e8eYTMFGkLA88Z4Yk7temRu5VL/r93EP7u1KMt9MzpPZ9P//b7rrtPYwo8p5HdLAY7+gAAMABNtRoKg7R3lTujb6vXdlrtSBBhGAwOxkVVXfyMTidLyXeo7ftRXqbMHFO8wp0Iz85VtYEDK/s3+yNej0l9ynZa//63RP/Bdp0ragPM7XcU1VAkFham1NpTH4WzVuT0Utl0fb+xk5rnGbdW5oNwDWN1YQhaWl1JQQJr+qgOpO5nh9rbeATHFMzbfoRQN00drPqSH/+1LEx4AKQS11p6BNQU4nLzzFiiAO4DRUrYoJ9PKeb1IPm/7fWERADLuHhWRNDL0Kos8jUPU8UepWA2GAPziKzuJosO1zrMOZtxlnUijXvCO7RO8wMR3syI5qpGC4h/T+LAn3nKrZ7i5hWb7R9yeb7G6gmYf/6QCAgSMC1tJUwdhW+BWtNdcOn3EyMGo8QIeY6qN0FT4s5Try0AmQQZSyMZ2//CFKjk3JVXP+cUBNTv512iG9PYhCOrqx/0T+bIRs9fPfoRp3QiMmQcEiAIHzif/7UsTSgAp5PXWHoK8hTqKsoYSJcLJQMQf/J75cIAAakAlisCZJVIjF5v7A0FTiNCKEvEUt7NZtulzO1wX+K15WWhS1zigk496ufuZ2fpu+dnTpxxSPatpMnKQkaHn+TWJSmX+ver5S5ZM5lUk9iOYyD89DgW2FsgvOQ7wRbT7bz/68pv/qA1HRQASEZoYU0YAu5X7+SwNvNoyFMagJ1TTLar8kpcvDFYRBIxKW6WkVX0AnNy/18juwMe9TbikmLgx2p99kcBUt6r06PoR9icEu//tSxNyACjTRYiwgT4FFmiwVlhVwvc6499QQsklbEURIUZXBDAhIraT7zvDKX0fOKCYGm0hAXOrpEUPBFOu26/bnUctZJPGNTGeUA+Pob73ce6qooCuI5i08bES3IY8TudzOb/24RQGFhYebCj7ZgSKQIUlENnMeaF0aagEs1ZJaSUFdV6Hl4Jskke6sfBoVoQBl1jITjMlnDOmxC18iw2UEsI/Vxi65EQVc//nNBzxIGTNJxLMusQh5hwcYyEwOxghSklhh3q+dcWSP0/Lspcn/+1LE6QBMOTllDKSrwaOnbNT0jTmGVuKXudSLZBWXGKOsX3S5ShWCd1m0ReK5Bl+Ao9TNPgjabFLptAmLXtinCidq93sX+EYp6Rly0n1VKl0cHb/w/p/XnYUIszkkNYbCcKLB6/U+N7DJ00MpxZQ/6AZqdemPChAncioAfIAACSXALYboI2nxxmmZCHnQ7cYyMW2dU0JUbLKTW9YddqXqkRPHxrJYmvO9huRMOzp4N9y1BAZnro52pBpDjP+sJBxX0ob37QwS2NeoRrql4lRgQP/7UsThgAn8jWssJGfBhZGutYShdFXmBKEI2KUIIARqzwcI9llbk4WrxpPj4aSEYC+9H00IKxJUihDZEnnOiUXba928GX3OM750Les9ZQ1fvNjPcihYQ06UZm5R7v1CRn5Yu+5WVJMR+HUzl2tKaw1VmjFqaiAl6K2lq1gwzrMRbO8ssdaGHs1CJQtNBI9Wauq3mWemkTn1+YEMJopzpnaInMt3TpecvpD0YOBwuzHGlZX92Va0cV96KTWpGUXTf/aowPzmbqVvz5L2V9tgopBm//tSxOaAC2SvbUekaYF8myyZhY3o02pWPDG232+kBWIQVusCoUsT4SSTY0DdQ05p7paRZYnp/XPQgnTKWGxmUoNTYnp4xt8TPBgau/uIRZR/eI65uKL/55GGzcV39J275AVefAl8g88aecBEm1dWoJMxF7Zerm3yKtFHJQfC/2lo5hx1pKptJUdLLqGlo25pZQLL0wzSJsQhcvDtevOD+I9aVGp06eHpYREBaEhYBctGDnuvRRkM8i9PBTWkhMZS/jcB8oxO43jyhzb0WMOK1hP/+1LE5wAL3LFlR6RNgVmV7zzElXzY9j26fSI3q88iM1jJ8zBSzd5lZtnMYbGgSS0erufit39eBRRiG8DLzk/PzOcxEMaHT+WLpqrDrVOU85jlGVktHYOk3zVTp5qsvonxDkPS6UpIo2ISRDTRZcLNMFqnnFw2frIIzVJ5tUkh64lCQZROjknD4uIAkyoDVrTeIVjGhuyFwuBA+YRdo9dbGH22enhxJEMrCw9sFeMpAfE9MPwcjUSYTlMDE+ZWNh6dpASGFpHnfTsHIih9cUK7XP/7UsTqAAyZP2uMMKvheJospYegaJhnD+1yWrTGrVVSA0BIlRU2KiIjSoNHgbIuWRYWySCqETuXucWVrZeAQFCICWErDVixEnHmpxuI4mGxRbIgP+uRDNTiRVySzJA/hbtnl2SXs9qae8sYrJX8wP++FSu7B0HTW8TsO0lRy2NFCriX8t/ayw8AVr2fZ0996gUO6787a1JeiVMcKvKaCrMu0mfICchHsJ0qsx11ZbYKPpubk2O6+ImXmbigdZfiLjOpgANlgMBb+S+hQFikdQl4//tSxOaDkmEzYiw9ioFLEy3E8xXoTsEottRTY/gQeSI+Slo/W3WgASCognI3NzcMsJEfY1FKZCoSbC5HNGPaM/gIGBUHbFvRIiHDoFyZurr7Ww0sC2nAqIyp1yA8KSbHAFaF3zy6eLDdPndnG0BZDHo5Yp+O8jVAAIACkmppO9RApF5HdjD0owXXqc5IWLZSC1Dr7yuVwZspoMGh2r7sND+nl3Z3c+5l4FwifjQ9zI5aqjlkeXH68br6d+FpH0yWHzFgtCjWJaoUWQ+yLqTLutT/+1LE0YAKZJ9qDDEFQUkTLST2INg59LDspbZY9AASLl8Fj0WAQwGGghJd5NOhB60p1R+Izb3vNrgvZLMEmritoTics/yXTbLrOeCv+1I1Q/zgKi07YlIECT3N1D3l1AUKIQ9z3w2SMB0LllnfSpQKM6nXadjjd6t30gAAW5kGFL2LJgpcQ2SPi8OqVxksjCBQtrgoFigxWNQvejlBjpWW5Da0YhDQiGcI6SqhsduRH/cwRuWJ0kRc0wSXEwabaJFmDJpsTUBMDvs3yCLmgdhB3v/7UMTcgApEf3unpQlhQQ1ttPGl4HSdlyRZ/q3aCiQBJRzH8E8NlUGiX89UGwH+hJBnZ/aDERtuIw1L7COfEDQgJgy2wopDj/zSX9SPv2w7/UyLu1Lql/P532rvM9Tf3f/p5FEOve/m975aF/2/02T0dyd6bnHggjBE9CJ5f/rhBHf+wRQyEHG4FBZBWk8EgHk1mShJCWMqa4DI39Hphg/gu9ymggF7rRNYS2ZOHmw2JTxLQHHH2llAgB1BHKLWw8EEBFpVtEa0Q1AB+hguERb/+1LE6IAMRNthTCBxAXMT7E2DDehiHUOOHRHLpqeJD7FkMpSLrAr12zagAEGowCsSuI2nZPkoc43rqU+VehU7gl3qafVevWxEI6JTq7Nt0D3v6FWsdJ0EEHC6y5QzUNaKBF5MFo8JkjIp+jMRo95Fqmmiz/u1KuVOejVSt1GABbgFasLjhWwOOyCaACUPibYRTkrMpkrJfJia6Zcvcdh46hPate8dCh0RDgqdSVKz0SmNRljgqG3UWMW7+4BRR0ytirVuRjqLikB6qXVAyX13/f/7UsTnAAvoi15sMGtBojOs3PMNoQgSSClElEgQ08KsCaCKJGnV4tSjBoJpE+tTZv0JVzT7LJ1hLZqBHlUZ3JGAVLE8qDYcVkZGX4MN+1yNTSNV3L1h+tn3/v25ccKUDKoAyCow6yJO9kK7kln0GmsSDTFLNgIVsE6VAIArDLZJnEvmooLPunKxyLPRDaqMJZLD8tVxQLLOL41b8q5dLS0H+YilWQqH0Sc1yEqzz6+WHhgSvHAnZ2jhUnBk2aIi4SBgn8SszCd02O2upcuWdClE//tSxOEAC/BfYAewzAFNjS0w8w5I/vFiOYvNIEBwgm0W4n6/w6hqIqUwJ2ypk7Fs6IoizVQ+XF9GYXAUCt05tH9UQK2O+s7VRUFH+8PdFIV3/fsUII6VqlrHElHf0M/li0dJ31HaMOHRi8GXlhV4eWMcN4RaLwXjZ7F1kp09vqUAUCNeoalw+40RkzxEAYHfBZFtjUIYHAlOwavcCfrEmvVit43awSVklZkScBfuRGQPDqnv4kP/9nWqU1i/T6jR3WHfpRfiLcwX+13Sz0DNtn7/+1LE5YAKbElrJmGAQZCdbXT2DLTQCAQQ5rm7kwR3I9ldVxqLU596KclDxN2fssc1yvEK6Yx+aPaPdSEOl7aRkO6h3/9dtSgnj7pUvpiAwD3PmZmAu/Tp8iff/4Rn07/o/n3tPQ/KzJyCDC68zcyjm7980qCAYhNuBC7nHD4jB+H/ktYEQYAJVdnralQc3Go+timlHadmFRpFpEejp2Imk9woffz/qx9u6yIZJvv+9tzQo/T0ti2gQFKmjVWz30bqWRn+6Fz/++ZiPIYk/seq3f/7UsTngAukjVzMGO7BkZdr6YegcB0V3qkmhKK4dwS5NZ0h2luhAmuv7p3clPW2Up2kKysSARHdZdKLEcJgTsNYPYlEx8wuOAnucsYH+x5yxm3NqPpJxEvfSA30GnE3wg0XQm6PR7kQDXhOqLvW4cHxHEOHg8UM1yFjVooYnE/+Xf7+8TN13BYzot4uNtXH0lRGRXa+kEKDCFw+o4LAM+cT6YDy5egRay1q2Nu1SkscA2dHaU6IlHryTYSSPjtHYaN23Vsal3atNfboVs/uz1jo//tSxOSACjDRXMwkrsG5qmulgw4oiEzXRMXLe7lm5sNQLS0atcQgwl4OAypCrvr8nSSHkguG6PWZkevJbCwaEVVJq2VzRQZeYpDEtHOQkkWY/YLCe4SsGNk4EpMHC8smEdF0lvY5NwR3oZ23yuXn+Sn7oR0KM6RG1ZZuH7Hv2Ve7yrHWAV4VRZR60eYxc/RqAEuAQSCi/1lUYG1YWgPFrTQ1LC8sAisGOfUTgsbuO9YVrvNN7bNMCAloW9jnANvigsLsED3PD1pUsHaFneyvdAz/+1LE4oAM+W9lLBhNydkoLQGGITg8cBQ6WqCoxGpd2Ovusmpq2vcCRASQAkUkLqdN+ItBUgXyVEpfw+2PZigjwCZ6eNa9ZJLzCFS6G/RBOoig7YsK4VkGcOc50Vpmo7UZU9rSBWnK03Fxicm+vX/p9ESAe0ylMqeV8tUAZNUQygDTnElJpBRKwhgLgb1SmKQplsG2/SNM6xF3+/9z19p8/1pEqZkQBAuzIQUZxLIUTU7qoITrQp1SCUZ0E7kUOKVdrat7M/W31Wv/WT2fagS1G//7UsTRgAp8qYGmBHiBSJUu8PMNiKUdFl9jkkhoBOzLxhO9r1LoBilYzMKqZUw7znOJUlwPA9CXBRQyCYakTIY/ZtyW11c+j04hILS9N9677B8XL5AocwkNJGK6uZVTfxhFturLTEQnMfLZPt18tmjMtbZzjYCMOCjhWLhoKq0Pc4tZ9abskd5cSFjJawj5k3RLXdgO26mYFfj1bnN5EuWU/ydVr+MvvWAnM/73VENoEaXW+1RbtU9EN7qDdqYeFYhdZyf6dIvAJqXzwhFKci8+//tSxNyACmRdbQwwwwFNF60xhgko0so7/2pIEAUkA5KW8TY7FUhwcTarxwG3DbEwxma1GxFo2SoFTj07Wfn034P31PnZ56ChA7+7+2mlOc8Hx2Eoczv6lLsUSBFG18/u6WnylQ9L102UY7EL2Y+8Rf8shg8zJUnrqzu1bMxHIo8XeasePWCO/nUqBMiQhNtqUc4oQJNLKBVNpMkYwSK95AVZouc9uc5FqQ7eOH7/W2Rp2JwhW27me6aA22zDIKBowYWoVaQWEnG6HVP/nGNZq+j/+1LE5wAM4WdrR7BH4WgXLnT2FPytZVhOMqlJ82OAbOoajWEVHjAbluxmoIslUxo5rP91jbIxRsKqmZ5oPblXvBVxgbawmjX8QH/XWTRSJIWpUPo/XdqpyVbgjmnkrzZwdU8pi68stSO1baCmIbFZG6CtLTzH5FacPGTbp5NjtuRpPmtDGuhahu2pcHxwQOpC9NtLURClU8hs5J9aLjieseC8JJqU+gEZSIlPX1hmLabV5XPhSXw/fKNPhSGtdfjx9sjfcg9EH2LQXJmUDL0q1//7UsTkgAq0uXmnoFEhvy7s9PSV8LPBCBrc/9+7OUoiAAqVe6btNVRrlgLX5Da30OlEeo9CrC1LokKCEIEAmMhUkZBNLackw8qApQMKXjsbAdwv1u5t0qTF12bP9YRmouX2dFOHo1dkpJ/n9kejBRRKLKeocFnzw8XKGr1u9K6XrkWafycztbSmJMo+90yzSWpqBIUxrPUymBUcxGNA9HQgFtAWLx8QSuZD45Jk+zZThkZXIgD0kWaChup98gOL/+yV1wbjq3V/uvRWKbphxegN//tSxN+ACqyNa0egT0IMtG4o8qZorvWQYx32fokv7kPbuJYrcsT3tzIAkYQAAtJjBiYSDrXHOhl8GYlRo+J6BgnBdVyCRE1Efnyqv4eCMSEooUPvV/8sltBCG1hnVy+ZWeuE1SibKFvZaqK68almuhTfkEK1PXXTRQpNa940223MAGUQbD4CRdFQUBGHSsYEotl9IRtU1RMLANOUWm1pIAcZH0CooL8VFWbUoyqdRO/VPmQJn5CJ+sUexgnTOJ0GsXJ9Lll2LrAGNy6iMukaLIH/+1LE0QAKEK9vh7BDwVoN7FWHpNiuj04XWxamqEqABIAAAajkss2FvvsJAX84agFI3aVNOjT8Uzowiq6B/rBBe0m2rRhGpJJ0kC6AmF9/Pv/vync/73bDG3n6uP84cVocYzv8i+9dPQS/3+xBw4sDoc0aYMo0qHm13SDXqxj7L/S+hQDACYNCUYoskkjak0A/h9qleOApcp5FjqU9pobdpIL7p5Ma1rtRPtqMxTA0zlf4hQRqqjSUPnqoG3Hlh3BtsSEQ5297Zo/+Vs9z122Ld//7UsTbgApcuW+GIFEhPwvsqYSY8G/qf1/qAAgYZAGlWK9aKYyqZrHZuKahqHvIKqbT/UIXEKz2A4xkQM9kfsHVFSFuVpcQdTLmRghJFf21uIj9RXM+p2mgckUEjrwR4muQyJ7oGOMDXQohQhIuXYadRvlA/LjFWLaf/xUBm7JRohoOK3s1BKTOcBLL1vCpu4cWdiHGtxR/Hfjc/G3oh9x58jEYN4Ptkc44ujCS040gYoVsTvbnMgDDFoiTrw2C8mPBA6GsaCAJjBUPIsR2jijy//tSxOgADDC7b6YotCGQHytlhInwf8MnWJOTbYRyzZ1PPApF/JGEbi7ECCcq2onMPMF4F0pRiuL3qe+D50ny9pE3Uo8xLvTy/CDKdEeKm9LRzGUZSOpYyUihg4sJ4LgnI1y/Np+gYhSiXISnDoRhYn0znHU8SO6EDrOL1GgMaKp5NWJqsl6ZHPMKJZoBSRQin33zy6XHRjNmIuMsOftUfgdQVrMsPFCKEcp0jEnkdJunCBzPkqaBOimhFbBKtbn6ksWTt+sFOFFMggFAqDcCAsD/+1LE4wAKYH1YrL0lwYgR6/GHoLAwLhxB48B0cVJIWm8o6LU6Zxlxa5e0lq5WGsHr52q39jgUl/0oi58kLTIqSNAf0iPna63kms7JG13qXl2FBY2Ltd7zQFwoFgkAuCKpszka2FtWDhN1fVTEmFcKIueovKHv++EK8izii4b8v+6gwqG3GL3vc8yqtpEiQa01a0MmTim9++wp0WT7S2PMD5N0jWaLTyCA2R0qAZQAERBAEJO6kmuxkxOHEJTFCbQ19QGxwScIZJnKQto4uRZbCv/7UsTmgxOFn2JMJRPJo6UthPMOKPp2+XjWqCvPeeE0QWbRf33IapBWEZ4yI5IFA1W4XKunTsxuTyWnFbuJf/f3EC7axORqNycKyphGfKKMcDQmElSlVwFqKzIEzZuj+WcMtXKC+n2hhR+fUaG31//JNyPYEI6rlr5iNVU5NDJ4Kh8DVoTEKbrbFCGh70VPFwpKNaquA7iCJAJOxCTFxw8UbulG+b5uBT4xuMyKaBDZnB+kpRbnkFgTqNcUFHGWrbuEgberl5e0bqz//wz/p1oV//tSxMIACexzc6YNUoFMDe4o8w1YtLMzf//zVbe5eldv/nYIdeei4KuFGK9KQABoWBAA5ZcSwZ2pYjSXVfaXt1kgjqXQ4ZCYJ8y8ZZX+5y2c2QWJGX9xyWnPxsH0fmUZsqe/qzWbt9W0PaUB+MaImaZ9Wo7LRUfY066eiW5j/Nak9o1Gi9PLoIII7AAdBAARRlNNUJaeTohcKsDvRCLSV1Y06D9O2mFfuHViCpAhNSnORHeFukkmQNUps/Kz09/uVM64MQPbu0i1cDp8xfYONbH/+1LEzoAKJH9lDLElAU6TLzTEDdSuPIRVMEtnZu4gEgmQoVfRj3NQt70f/MhAAUJyLK+0VCstYmJGmBQDEANNtIzEIY0LjwpuAoay/b73E0GHRJhDFU2aoUEdKm5tfluyBXS0+nvmMugwD6Vh8gXa6qmX8MYMsrw+J4oKn+z/zjhP2uIVABpYCCBbblwJoXoTZ1OjUakmsvmqdqlbGR5fOX7UxPdPIpBggrRxIwizan7yxjL8XNOh5gtQJunYqVNWQNYkkWF5NiotYME+aY/fdf/7UsTaAAqJM2lMIE2Bdyas9YYc+GjX2yOEWZJDpq6ODlQhm65CQwWPua04Jsdo4iB5k6avVfQyqihnOCeCyMpXnXfx1v7oD2hAABchSmcpo4jIJ0lCiNc9NIwNAj0Pme5EDckEZfk45aWPVIr0i58Q+fkFggMLFT2XOKOA2A4GN/P0Mqoe7NLFRVrnNHTTH8XlwjahKFpFXu5e3mUBR/yR5MppLHg6ADGoNHiYmOC2udaNeI66CNYvyhGSNqyIDDISLKKCEVWawycrKuUaPSta//tSxN8AC7S9YUwsT0FfE2wZhiEoiLjwox7cVUSVaL+6sVwqtun4ulWuqdteSKzbW3pMqNABQhIqjhPArQDsA1FsGcJ2lGZfbHyKsiQIRN+5l56yb/xMI42rz2MwHurXft5QK7q+zNo6N5k7rlDwpQ99ZlrWKb3skien/2sCfd9VRYPrGqZcKVIGSNCAWXJQZpwj5DmM841k/3TC0xrrMY2faeCzWgTeFtCuHPSNmTw7vTc23QC/S+zh0CsmSzfv+l/YE83B+5NzhFWwmG3i41X/+1LE4gAPuWVtp6BziVgP7WWEjLhr94djZiQa87YWNq6grfeviXa41MTBbPlHoUkkco5DtIt+ysiLOp9uPtlokmPULRAFBfwVj9gBDI+5Kj1ZMqE4l2/5pCTVLNRxU5WBDdMPImuz7UcgCSVw8lenptS3fYxqKgHMSgBWzWVQI7OJgIapmMYXQry6HlEuojgFpfYl5z3bAi7V7XLgsQ2pqx5bDAEqEF+JDIELr+CLVv5KtH/+ufLlK4hoOjad4JADha5MtzrpFy1wvo0Bl7jgZ//7UsTWAAp0TXmmGBJhUBOspPYVqFL7gOVAMfEDnW/3FKKxxuJIkAIvKFEHfxiGHYdVF5kgxlCVRN631pQOWhfazu1qmGTl31hqzDT8XVv6JAkuc6+8QL3TKhMxnrIyOZqnnfs7agqvrV/3/f+rk+yu//67687/+tRFFd2J5w9NAAQmQACENEfoGVqUyaadimMgPwMOQCFv5+UC/PvlQUgTuCxbkUUe1QPFhU/l6ga3/0IpqGff9iACwvGTCdRwlq/BlolaaWnvpUu/8fO99X8f//tSxOAACpDnZ0eoUoFTE6508qpc1X7J/Hz8In70lGVonM3IwcOsauxNvBdl4aQEKrChrcaADAicegAiOeYubSZk0RGmmoEh4IiU/uYOrE520Ag2O10VGDhQuOzOOThahQrUaZIn05ziCB5TM/cEKcDdQ4eOZV2J9IEACeBEPDu7HuhOcTdzzu5oQRLm5nQiV4EQp9c0QAEC4IAy+8x79b8PiOdh5jyzjI5l8x4uRPRyRNAEhOhzleC6F+fxaSNHJpYCBiSCtQJS1/+VjK1tVHH/+1LE6QAMpLtdLD0HwX4urvTzi0Zi5cUhgiJiEhq/6lSomDoecSPCMOBRbE0KtMalC7jRd4UU9I6toSDoqI21ZakBCigYhEOC4nZUR4aaQyDmIJn2P6QnJ07C2zNtBtUcbh2S6tpSgc0JbELJtb4YIP+2Wm6wYh2ZGwY2hjLN3+Nm5XkMIyCy/9ANjOfM1+arRX06f//ezizV5Ma5Lx3z9TrgFU9uilPZHJFUirBiCoOsrFoMsUh9YqrmVxI8yP8iAQ4ZqjB1JBXXUmFXN9QxnP/7UsTkgA4pbWMsMQTB3qct8PYNMZslzb+/S3W/aJb/n/M+Tg4BPWd06Bj2+Y+ylSBEYQWSn9qVhp8V2fzQOVheYqAlhchmrBPgjIjhOBagVRiqh5wlgzGCFElDZSNHhsq9mLkVRyh4CrU9IhUqXCweCpnQXSoaFKrKRoJlYlRtI6XTBHqB90FhRaP3reSFOz+iBi2CcPak2I0wLTsjZqnQ3CBjhwgA/Q/YTVzZI9Tb2VkeUyP/oJp3W9YABl5nCltd+7ozFfKWX295N7ztkd7t//tSxM4ADLhfe6exJYE/JW/wwIqw1/m//1+v9WkdeQWZHrrgZ70p6wAhhSJGINFFNQXEx2UuqDJqDjwipT0eJECMw/soVOKrXPQxSAQ+1FdgQu1BVHrhXq/ebcIGmQr0pz763ta5PQyHbKYye1pOMQoLts+h4o//t10EQABfha0HqUJ1N6jc6t+ii8X4oE/jh9zYou4uYrIhGMCJa1PLpEsEnZcQh+c+MPx61HlCqAwGeEISaJKRwqEwqRFlhdYUYDJfYu0bFyCFKDvQEggdHgr/+1LE0QAKVLt5h7BlAVCMLnD0lLATKu9O3//94ADQBgKFFwKeKxhjDvVICbStRxyZ9bNkBvKljDjPUlElhQyfBmQhzhwtzh9n7MDi1X6u7tQU3MZni6PUis9dBOcTMpqf5r85T+KgJJUGWn3+g+InjsHCOsGFHn2NE+jhEolx0mqOUxgE4cxvmSuVAsWjHJOqe4JlBWRGQUP1i65c5qIwSTofzKI3X3ddlTruzaUslU2aX3o6WKjN1/ia0Kqpq6/1fqt+jvRLrefyCloEaGYwNv/7UsTbgApBOXOMJEfBRpFufPYIsMuIuRpYoBwRpRGI2nWOkPldvoRupih8M51UV9vWiuzNR4qcoHv7HfuJsJPeFkHCmGQ/zz87BLE/JEkSLk4zXOuuylAZ/YMaw/2I6fn9/c1YKGPysOFwScHgIJAUFUi6VNOoc/xVnoVkK1GIlRIgmChEwKy8tA91VZMKVV4UrCmtRyLr0u3s2at4+a1UTvIxtAzTWigRcbr9vqah7xMBXFnxhFmBHQCwBi2gA61hYEGzW/aF3SCaH2k99YeI//tSxOeAC8yNYqykbwFyl+zxhJWYhRi9QZUbC7iVUZCBZG8bgtFBT5AxBi9LNvv4HBZYVqCjaMSVetBGwxAFKYiByBLINSddrKTn9icbrKdNNMnMytZqj41CDFUZbcQxVBJUwaax66KtSFTWJ9wOtrE9iWuW/4iogQAAARXISdh7GACcJIMIrl430avm4LU5g4xYWTuioylZjGntuOADpmJ+MP3RFIShDZINHGIQJohNBiOJdiFoBIRCN7hGg2xZsK2ZAkgUfcssRZEDCC3uclb/+1LE6AALsVttR5iuwYQg7IT0jdhM6/Ho5sPW1qglQIAJOGcYquHgCnPoQQ0ohM0owoYnU8nYsgoKH4z4UQjyWOfjYx0RmVVO2sGMiFZVm9SGKjoUtPIhev+62RyWstrKR37ej6Wo9d19L/LY5ZYViqRD2rR0jaSqkZDQgFJOU9ESiBTg1EEmTLBGiqG6iO2eVp2+CnZjk/cy1DryFq802OqOOmcVQrWsy9lQIkYWQJgKBjZEuxQKiM69gBUbpFyKm1tSojF5cWJaqpI6bbQTZf/7UsTmgAvMfXOmPMNhZpOs1YSNeNLB58s4wEJMwQEQSCVDscDjMwt62S8JSiUonmxvSsrRh7dmHdw1befeZwkJWcr5Q/qahQvt5kWlVGj2oYix2fqJm15UMu2wihx4VOyDCPEzmyhWi97kgiGmE7J0Vdc0wiaK9dcAmIASQUlDmc0SGeDkRws5qHcqEc2Lh3SD+mX1Qx7rP2VGptrbSrJV52WtnkB7Pen5qKM90zFqZmaqqE5m5+iULel6jttRjv75vpRv5q2Vt0/p9Zu1frdN//tSxOiAjBxxZyekbMFvKG008wnYAZAe55koV7lb0ALIWc0ki27BMZgKkfMxVwkvARyvq0sKs6Onf+P7ynqAQqIVFjSbYmbZ3c9lkf7S0QFZN33e60vTOjm/fy8VX/dn8o4oxx5dFnbqpwxqW2g0EOhxqXBc1L7Lkc5iikBlAgApzLP4xTrAlzzN1nPB/AZOkwXFbEGGCAMChAY66CHm2KxWYQNwUh7IzSg6aACoff6/Zyixzp/m+hbhAAA64t/Px+II4EJABE0mbuLPy67xCcz/+1LE6AALtJFnR5iwgXkaLTT1ldw+BKgQggGYLwQd924m8woTlGRm32B6HUBwIuOIw6FCMWGZaTB+Z0Tq0Q/G6hHdUjdM0ijSe8ngl4PODpynftPWnU9yNT3DGBE+YjTpWLjkuClTFms+250jNSFwZfpcGFVhbTdrNre15Av+f9NaSWxkIqK4SxBGIXQg7QdTEYNlA+odQJl0KZMknlFBm3axDmpWVWR0MZ3/uhnUrM2/MaGNOYk2r33XDktNvPB47ndCUoW/9VNkRCO0OvyW8f/7UsToAAwpXWFHsEvBdJXs9PSiUO2m0KS7WtSNppGi8RQ4A8IQ0ihw6CUc14jMPGyGYrkbecWNNr6epCvCJCuHB2VlWCVuqXJtayNc2kKYyVmGFJkY8tCSBVITEgqYQkkm5qEbdt2xMwtr0OHlFGmPSBlA4ges6goEOPdWoM5aInTD6jysIjEkM2V5IqGwli49k6ayy05b5rFjPQBV69GJOd56IEICarETxfUbrwyTLRcYtI6gG1PYGhcIwo3MCRZGKu6yJ59a7LZB5gWgZQFq//tSxOaADVkFZyekacFYjm3Vhhi4qHP9cBDw7ffPdLbG5OJE9Jxyvam8xCwqYmCg+UGg2WRkC1o4taRomIIl/ixlq2k8tZbehFkGIZoaa3szTKCQdWkSuZIuRYAskIFPW18VQlvHZF2uusIEVX3KQxyS8BKHHjmORdYeEWjUKNqS8CtkUBMueSUNJhD/SSWP9ECdCigoVgOM9rVanmKeNEX6ibOU8y+TtdicmJRcqGMBEm6AmiWbOFMnrBfZK9TIGRGSR3Rn11eazZ7Nq6k/cgX/+1LE5AAKUJ19h6RHIYCV73TEChwp5EqyMU/gHCgNB1JEVNHoxZFxEIMIACEE7gOBCcsAqsu+KMPlr1TD6vqcGxQUSUHkqPk8kHi+VFudeqUAhbvnvKTb3y7kh73NfMO7ygYEms9DmJ7DRNvr/dYp6O5fy3dfl9NyOlZUMj3ZYuHUol6GFQ+5UUnTDhJ8ZQEnIUWKoDB6JKEauTJPkjcz1R6OZjzOxUKLFJYrZaLxIoeljA18Efv+E5NXSW40B9u8XPYfmf1nYBQfww5WTyn20f/7UsTogAvQn2KsMQeBghGvNPSNPFP0IKDl3Wpj7cG6pT/5b32IGGQ8rQoka42xMGVKc7int9rwVL4rW2nEm8CMnmLCiTVybCWSijPpUOaT00Uhk0gGLuqJJ3tL4UEx3h/dY4qd1PSJJds+NVV/P8pDXaKz5l6DiNQKFMCHIYUxOY5Q86oDB8AFCWpVkvdiMPoaAKwsAi/vYfL+hQDGUEQEEnbuNJLGUyk9IWnWNPq+RJp41ULc8rWdvKRM4+/7yZ+a16+NwU+r/uKNtrbHt9u8//tSxOcADTEpaUwkS8GYpuxphZV4qP39rt/Hu2gwgiT1Agbqb7Xy2COanuJ/Ut62s+u1XdlafrsYan8BEDCkaR1qLCyralCheoRMW0jI1l5ddYyRgmaEaTBQwbtsgMg3+XOOXbZI3zQJQ0PidBCTBHs72/qMAxUJMEZGxouU5b4YjaNUEzgXLIECEc1kSgNEie0OYDwkPEPSMG1wU5Uh0TSToO9U7VdO/ffUsvCXf6wThWBNGd+9nfLZ+hzbkbvfqE+l38zxZzE7/sc03KL1L4X/+1LE3QAMkTdvh6BRcZAT7jTzLdRqXze09Wr+3ChACTbiM4CcD82ThSLA4OjGiYiRWMKKKLNGq2MLio1GSNArj7Eco05EOhGL77u+9gTgOAM+SQEFetBiE0Gxo1P7qOqssaY6ATzHrotCvPCAONIDKhTY9S2dBcyzIAe0hd2GMmdOaucUyKYNYs1/PJM1ZGd5fwyXzQv0wys45SkUqsZ9I7DBAzkViwjGq2BNWTeaoQ1HkZMVW6RM9CwCWav0LdZY0j96BGSqspSSSKgJCMDQc//7UsTWgBKZo2+nmTXBkRKtBYSY4STRcUXSyqSnis4PV/lMnNKXyjPSVrbejrwaZjOFJ6tQS+b3pVcIA0bdwRsLHofTlkDDBAGSwGQVGK/PFU9dki1tLfp6CMlvcAWY1HmkiiVA4U+cZdy2OzieQD8ck6eLyRpjOcGzXPSJASHSj1nX+YGRObvmohL/vsPl2+kpB2zsSBf5ya0YE75eQz0sgIvvUIaiV4wFlD1GePDS2V10dawEr+67XQS5oKZ1UtiBF0QwoTfyfsdDI60f712i//tSxLgACjCNbMekR8FUke6w8w2szx1GpWIVZ3Ejje2Q6S+HHPd1twvGtq7+/wh52o37F50pRJ536y08tohZHvjghFAIs46/QWVgI9fZWfLOFNJ9lFXIDQAQbeCGjQpFi01kxA4qXMInXbh3N636wiF9FrqM9X63g1SSNT08R3n5Djf5fRncaEqlxHn9pJsox/rqXUe7FbhZF+p/vCg6TREjV/i9Ru7UdWQSfg9U6QNNDi5VY8XuSkBqct+v6yCAABygQeBARwyU2nnkD+u7Mfj/+1LEwoAKlJ11phhQ4XQcbfT1ipTlEMdFHuaskzNbdfBlpHlzvrkot3olvDN/xT0GW+bvxEb590v1/krieWgh6TIYEQfNlxEMPgBYRYBBmhZRDShRohPzkOUKF1NdvuUh//yAciswwQQDqRgmBgDVblQ88qCQsy6V0xFiEeHlDhlexR+/x2q2Ht2Fd/rmI65wCiGifsoGqOfP0EIiSvnNz/pfd3o+8HgOfnChAy+Qh8Dorbw/79/ehRw/Uh2vJ1oKWJtpossRcBEDqCcH+kC4tf/7UsTHgAtAv22HsG2hmBosJZeVeDdHUKtQ9657UIAjoydgBnkRh+wgPDIwyKkAVqq7quWZERLk0UmpRttjFYXG5VG8TpQMZaGNUOYkE0cOawGNyBASlZqVSLm0RLISQ4TLnn8LzmUzYinfldiIsoSGTnTTBEOJTiN8LLPy81rcEdyuIC3SyjSRykCYGEjW1K4oz5GGSpkfOISJlxxEKtrwum83EBPNQYSa7VKqKIjq6KtLW23ZRgYcOueVMizzI91PPDyObhdbfvc90fY/q9ed//tSxMWADDStXqy9CYFwGS2k9gz4G9z6V099AVpkEUCc8OKseItf3QTsf5WmIlQaFln8iq0WrJzIWzHL+H7b/rlUZrEP0nJsnTQLCxxpxaD0kh1m8XfTquPM4YZFrQs97kNahP6GOn3G3wUTJBsy6NtJptl0dHKYEfuB4AWPFSqwqKHwPRHXbr4M5eryV8xjVeIo741FqzWnfLPZLEnIj0ChM5lbKyyz8yk9EiiN61txT/zTTjP3WLERmUcSCtXllQQCEAAABMDdCFo4MAFzB8b/+1LExIAP7ZVzJ6RvyU0S7uT0lPgiZpo1pUYcSt15EyR4QUcdk2F+AGeMtvw/7hvqS90x+i6rgga1VybK3nLUfclgcUue1Y95k7+qrickFXIttbYgIFFMEGslYgGWKzaBItALmMjsRKJ2YbvSexRactCKu+E3DM8LpMc+tPKXVG0mM9RuiEDJ7oCl7UN99OljWmt/9OisMAUnsrZov/1tqWFlvafSBto0k6GEUE0hxb1XEtX9Ul7ObQYqnNFpT+IJpQSSJ2aTfgK+gUiuolM5Lv/7UsS5AAo8lXEsGO1BTZMu9YSUuGIQMHOlilal53nOEiui3dXupd3RN2vSnuv/M4nRFbHf/bQIoFVbSfGgpvio3QnHZcUOvHC8QtQnVuqQpokaFFRfyTrxlsM4KHWh64lmtaGBNE61ZlpaqrU6uUrppH3/9LNdY1O3Kdyhiau6zXbanVqyXW69m2oCNT1oEMhsqgPAxMGYEyYC54VbKjBanjHCggoD6rlE7s401PqkfNerdZzvSSEK65uvbfIfZBw0u9AsERFW0iElicNytkN0//tSxMQACfiVa0ewY4FEny0lgwngN7fue2n/NnHvjq3dFAMU0bjiTSKVCPDMRKGoN2YMcTFRbX6Uk7Njt9/e1Lvl8V/+v23XYQlwi2J+uYUlES1dG2oJQQRVGSQ1L/lOubMm8gUr+cv/vLg+oEIfC49pdoXWgH4Ylwdd/7nE4248VLCvKJRsyhPOE1ox5s/kYrlLHHuMabXhoVvpL6QxAbBeZz/Uov31qimo6glV29vlyt/mqro7HIpkdWREa7amdX65yHuxwzmd0+iJ7oyStUH/+1DE0YAJpPtgDCRNQUyYLJmEoPAZwwuyxkeZHSuxmB2dj0IYEARlskQ7a20EiGNgeHZwPCaxUa/LMxMPr5cSqUAhbYrq40BszJmYvodBbb1I2/QSPfaXMdLrcfJRSd+zkHqAcdY01fKONyNj00pKithaZglJ7I0jI4lKOc6jeNMxXAkDgujwUZ4c8Uc0zyC3Ib9jNO3H/xF8B/RSv2CLJ67oI/PNoWc5IGAAYu64QkDzWtJmqw7U/60EornzLnoWfNRMSHAZiypZDD8BrCQd//tSxN6ACmSpcaew4eFbky509gj8DIkJhOB1OkKR7L3fMk9ZZePg4znJQSlZG4QksDpafkTrGFHhwvWvw8uoO1M/uwkEHo1Har/EhempIxRxh49mGhJGTAxZkF3qAtp6IgVIQyx+eS9Os0RTcefzRboKjaZMMKPJyyghxSoHl9kMAlhJTBB39ZyqqylVjVYOfVvRYJJD0IFOC4mbOFaRQG79nQOBluyFMxm+4hy08EMd/Rjvb6t/EJ7W/pBf60lIdqv+ZzP1pVHqqeWciu2v9aH/+1LE54AMyYl5p5hO6UIS7KWGFHDc5lU1mvBcwHE6nWggiQlB4Io7w6xMi4jtVaJQRTGNcgcM3tGmPBiHHFc1hKQBB7ttOsxQ89a0/cQ9nMrPuutGUxG9EX6lT//0Rf9DkDhHKahpjplV5W25GlkzG+Sift7FBmvC7bmuPP1zdQo1Em20qtkOYRWFgDSUaNL2vuZY1LZDIzL2EA+LLUuc4Afgj0mzauhAbkHBivyqgQEP6u+TkHqX/66lf7Jr6scQRtaFBej2Mw2FjiC08xL8/f/7UsTqAAyQl3GnmG8hexGutPYUvNl6dAQwEABlpynjIkUtsoNB7brInuPNCstO9Ye65Ottu7+Ve3W22a/u/08ZRrS1yxQg3XwnZACZxNZKwJWgqK/IZ7ub8sQbl3pIs+20d9PpgylP/sp8O/PIjnSrvZ53Ic9mdmdXtmLdFPID4ADcG7Az/0IMAAAEZMyAxIdTCBadYJ2KSF6j0LbmErulZy8nq8qGVudWOUvJTjffgpR1eBLtuVB4GZdUIqNWjXTk5BA4cVIus2lESdzqt58I//tSxOYAC3WBaawsSSGLLa409Qov3tvKDDiHijKhjRAyICQoh7Yqb2ukziWpHKusvVKtzTSkUAmOXQoielJ5MC4UnQSPpF6cRS4dFpyOzx5Vkxl5LxdNi9VcQSoKsQziK1CwCCC4mFskpyqG9MeqDChLxasNk43ieNFaJ1tdOYoZdLvaPUy98+kKOd6OlROhECpx60eYYeKTMDUu+VaUPy1OHRLTP29XT97V3Uuk7po8DJTp6P8aerBCEEekVKUSjJRgPy6sVScmqkW5Uj5BYCv/+1LE5IAKhN9zh6CvMb4tq+mECqgEiw0aJBzoMUuEKHY5dmsEclzBh2MMYdT0YOStq2to9n3vo0dA4VJuE5lKFLsdfFdn0Nu/M+j6PQzoUE7ilgSgJBIw1MpyhwcIdugSJcKc3PzUmLljrSOB+9sfG9ut5bCxZr4K2npnB+KdHOtsmPWsNoRBkGmdkUAS5ZDFq8g3UjNLQlpnFXipzX129P+iEEAcCRBAWDXJchYpyVYC9n+t1UsBJwy9WXRSZXqZtS5YJWo9W52QQMaY5bB5/v/7UsTggYwgp2DMsKnCMzRsQYYhOJGBw0RAQNgM5QH2zxCMGLDy8oSOmjabH3/d+zZTo6Kf+W+sJ26ASCFlJqIPSpTQUI0UJLY5Jt6dyAcRBytHen1l3akBr86+sAcZHFHEnFi+3pf0CCu+qI2maVWS88SXTLWj9kMWT99TaB3JgoAAvZWhxCpa/50XgpfW5Uj01SMVbDAXR6ayW4uLIhSqPRC4Q3oh5IBFyQUF/JfxuJVLQMWbV5fDyCJh7QPemNyVLPQbDHQ5SiGm7XUHwOy7//tSxMeACiCtdaekSwFPEO609gy8epqJXoVR+LeHAxalUUFwcEFbAldNs45Pj2kgdth3Yyry4AaGhhJNuLGlkFwQ0oodAKM8tfpXKl2o3Aeh7U+931l+9h4HnL4Ub+mlO+ivrx41oIZ+2GBlsq6FBSoyzGK+mTu7FlRn/f+jmX6ehOsP9CYzwL1W1hlIrTBH/tUA8PCyzI7B6VKXxSokS0c6C3HEsPtHbGGnZeA0hnHuFuKzAHO+keW9IB43tdiPpOCi7o/IGFTRHVRp/xwp/KP/+1LE0wAKGHFnJ6ywgWmgbjT0iWTVmmRSgcFdtJqF9BSofb1Lf86u30X+osXttUcLqrNIdYnEogQCAarYnyaJW7GWnm4I8eiGJxnohiFgJUdIFJWs/jx5OGriXjNbVERJn8/VJFkW7e/yD4AaKZlKpBZnZ6PJBNqVkhtMHB1hQkqgyHP2AL+oyG9Qndr6xU68Vrti3uUEQNsxwgx1WjtQvLbrSa1YxgqkFi0lcHLCVeqxGBCWhtUzVJIIkBdKjD5QyxCuffJghOdeEgob9En13P/7UsTbAAvsuXfnrOuhbKBsaYeJOP0IhxoEvWUxEaQUxRsAGbfZYXuFmC/WTtez/bAigACEMXQlCEHIwE0eHQ5OqbpeQj+10gVI0elEGjMd8UaMje0BosQkUUAO8TIqjEhZmUQkNkyEIReRHTJEkWrv17DOiztzw+IahQQMoyHeZLx64p+5xQxc/7C6kMwAC3AOguoSh8S04V1HqpWaEuthQe2N3zk9LhkgulkdWHnxFdssJx2mvTmq5SyvF398MEhIx1V86qq37LDXlNIx+twT//tSxNuADC09ZUewrwF4kmvk9JqQeKCgFQsSuAOJXCI1Ur+nkl6Pk+sAGAAEFpkAJENDbV1oLhDM4jB5ainBmC7DAwWexpz8ZVbMnKJAlo3kPOJEsn//kNBBjgqLB06pKiyMBikDuxQVoYoCpUpWipHrc3scHXRtuqxX2sXVEk1kvqqijs8A+jkKyQRzAsH5ERl6AvXMoPHWtOg52Wht22vk56+b1h3a2CvybCrzYiP4EX7RTUhkyvOldeqgvq0vTkFAZKnb13fKm9LEeEDSyRz/+1LE2YAKzLlgrCxuwXIZ7ST0jdhkOihbL8DzbMLTmYxRG0Iad4ll47niNPY0aJdULPlQcatSqDxTMQxzUaedBpZ8bf+Uahmf36MEzsnPK5AzlexjKvsCGZ/YKUt9db9JwtvayVLR0EEOR2Lk9MiTdW2KKXaXWmREOq+GcbSIpxblOrUBB2CVqJEkmlSkEGij1Tdz3OdYhvnMU9jPvcEA2Pgs8WeQD16PRqgLG08pwJB5N330WoEL+Zit8UAEWHtUJJuLh3WSPZURO704Mv/rd//7UsTeAAsAwWinsGvBUI4spYWZKBT+wD8BMAj3e7tJRUgnaIQKKochwHhiIZ4VyYfoZdcoalsdO0sZaS6WTFZoAEXU5zBF1LggrfRRavbyMv1Gb+//Vv5L99hxPAE/UKf1kF5Ql2cg44ycE7hAlyoEBQB1KpIuOnYDcOcv5on0xjeOVpkYcGxALvttFBFj1Y13KrGsW+bbu8fcJuS1p1++8UUbDe2ta16qgY5XbjEq6XDhwSvTqd0b1d3q93BL7uYACyNj05hkfZ4+MYuoapZM//tSxOWACr0Bd6YEuOGura209IoszP20gWT3+/uOZnxobLdmz5hiAjHjE37/EkLvIicfXT8CcRHEDRAwBCIAK4arFCQEh36duD+7c4p7UpKES5FWocc/8wA0R7i3PQcISwncQ7W/OxFPJhmXIq3oyummm5GZnaq6MZloRG7OffV2JdL2nshp3QhFIouTN8//nnERwMYy3Zv3r9uP8/d5xJ7f3y1cFHxQGZOGtg/Hs8Fq9UG6xpaIkgyaRkYY8y8BWpRzfK/0RhCOPRqykX6GKPP/+1LE4oAK6Jdrp6CvYT+cLXTGCLxd50usd6Z+NyaXIEJEh2CClJWxBoy2RyOHlhxREz3JYvFrtTSlNmW6zCal7FLZQ6+NS69Um1HVYms76HBUy8PwSIShPOd1cUrYnBdlKGyYt82UoE7jnaI9U4WvtYBNVqNMqyRdChA0AoHC8DzTY6WJA1a7aa9al5wW1JhdHD61UnFRcRWprM9YQCY8kE/c9KhGQAgUOmWvlXuX/EydNhhp96NP/9bHwfuq1gnF6blezLELFuQRP3pahkCgGv/7UsTsgBCJj2OniNrJlqctJPQJ6RS4kMS2RjyFWloU2Yuc/MbClUKmskhMSl9+5Kn/PxzAyi4bA/JYkPiQUHFLGkWpFX31oDTvaLMzFDYAVevZb7BdPUHU6ytY40Skw9CJ0PQbgkAkshO6Tj/FBZcPtH+l1maZkhaEhc0Ql0A+ADyR4HeHQisgRYPQZkXUoEINigdM/U6rjXLK/8RglC5J9tPcKkl3jmrQRXUAgVAwKyIw6pg8paJCSglwg1VHlTNa0JoiJop4GNWrJ1ThQO+5//tSxNWAEelnaAwxJUk2iW8w9iQQzOKX5eQNRdDi4PMSZEh0tafZMuDROKv91ov//0TYLHw5kk7bGJS7DoRD7AjtchjdIA6ZzTZVInXI3GdTMOVLuLU2hyv3oNpqfRmNIAUO4JiFUaldUAxASd2sFHg0KZsKiUMn/wf52p6oUE+LiHf0a/KNoB0PN+p62xzXUjGnqNH8tHhpIYp06hpoJVVqNyLg4AJLAgkmmBX32mZU5XcPM8axEQXf6wKI2/bFSaOn2o1PQRBGeZkS/KVjMkn/+1LExQAKjId5h7BnQVAHLzTFpUA6L/9X//9WZzIoic5I8Bj72uZ9rhGX0WlRpDjh58QBUwBwGh8FKs/R4QucKQ/orN9eUHBJWboeeJz8dWqW/QVB/sbHEd2XQgbM7bNr2HJ3zqp6mDrD/Vk/8keXHlG/1rc1qk0AgUgwTIhIhhTZfL4NCydRMiGl9Qq/FM2lztDPEw6dtCpPuC3tiGa1qLlIYUpMCTLhuSTM9jLpUU9cVzWQ7w9W7x8xzT/KGfSPjp2chyCYITD5dD5p197Ic//7UsTOgAmkcXGMMGOBTxuutPQJ4F6f6GOt2//0lDjcuKgV+jQw1UJEyav6AVCSUM2XfRJksg7gpCcjcuiGVEtkByoYr2i/Ajnu+92cK7f37oDhQSxLVwA4OhYPFhLUOfs2gWEpDt9ciETO3+zr7x5GzwZ8mJy5JSvLiez/rN2/fXmP/b0KDBEQVjohKKgvXalO0YcFdpRI6fFdHuxVQILWbGC572jgel6q9qQul1IGpZGVvb5O/+hJGEmnHQaDllcv3lbXpwEMHTzJzFa+dudY//tSxNwACoE9d4eYqWE6m+5xhhw8luAnoYqkkoclyg6ULHVlVGS5sg+hxIkiAeQQRokrUBWGmCpMXDGM4KwgQRphgYfRtd4Oe4eZFvBTTd3UKa91PHAi3GOrucdTZLoMh3EJpS6CBF4Qem4YxhDUo9rd/8udT3VZrvputZleuggAWny5EpSWALYiSlFhCQMrN1hTqlDEVk1ZWaZJ0itc03YxAauyJK+nizTxp15pk4aU0u0tVGk1qBcjtcEIoAg45SNDaBQsv/Va+Qrale8g7/n/+1LE6IAOCSllrLzvQWSZL3z2CXxbFEV30DGESaN7DAYJLIJ4o5PouVWPUNZ1KploGhz2q6WOpVqL5IHPFjl8g7hGV1AYDV2t7iTS4npCW/YDZm2dAYpWyszESv2/obvpo+3ob8697jEAIz9k0pgUFgAHDwQIBxwhA9EGQAwsMHaK/zxl14EVscZR1/z8elzg3J3m4IYQ20GVAsYqItWodDskaT8iI8u26Vhx9TPi0I7RO2K1H8XlMj23KQNBJW3gkZ6UqYJGO/gu4eBgr5zvjv/7UsThgAxEh3OnsMfBSZGtFPYgqLeFFjOwQgIgAAAlJujhJIxBliqUUZ9SwmJy6J00FToESQqEeH0p7IHhl/PCiVa6/GnBdW/8XAvVaMHmLLniDa+i/M6Ca6db+7IYhv0L2qcyf0Sf1qy63iLcdzBJBsgFjtwUJG4eahUAKBDAGcy1YxgqosLCI0xV1ouwRFUZZ4I+qdOayhkhUpBSBN5tVmzJqQnyfxBZ2iLEbyonKU9B6Cj9UHrI68ue38x/sxxF+rq31U41v3M25V/p99bn//tSxOUACnyDZqw8xUGQJy4o9An0EoSpYCvE5Xgw1i3dfvEAAjdRPdG+B0TnnaW0x3XynZVk3W+CEQ6G6D1NQ6QPBlmszzuQVb2NGbmoihte4VxtOs/9SLuy6cQW3wxH/CNdifoDnRJ2H/61csniA9gCY0HhZSApM8VVwOtQFPpNNJG6xvF4odoNLoiD8U16AMtZovpHlyR1uVUvRwPDbII44Vr4BJtPYuLGN6TVNRFSo3LV71Rj+6SW/ocY30JkdPf6PNL/638+xr+hFA/vAvT/+1LE5wALWLtkzDEIgYYnrPWEFbCzkaAwajAAVOUMWWNQtF1KsS+W81mRKGmkB5mYLxPoVBPnGFeMV8cFqENI0r1cS9omONvTRt+ZhX0v9u386KzqOnfy/p9in/OUX/APsos0dEGcOCU7TBUGLDsNcj7aaB4giQv/n056Efm9cjDjpaBi0RDJhYQgbBBBlKLlhBCbowv5w5Uz1u8AEioBMyGAAYlxgkHQ1JoRtXPSMokvwJokWoVVGklUnmW5LRYekdAGZeuyiXS3NJFskqtTC//7UsTmggxRKWEsPUnBTBbryYSJuAGXCxJNkBBY8iuRtzomLP20Fa2/9T++4kFTJ5le80i4z7ayACGDBL+EcFpXCDHqdGCZp1sqwzWUUrANIk2pqpi42FLEyu5/MyZaRtVT/0aG6b3OYeHAsfJigiXSww08ouGpfKtodcvyPT3k4hsH2xKm7yX31QBIGFTIYvox9gsNjBYGoBw+8DJLuoopHOzXMaxLB5cjEGDtAI37iLTQMRrVphgfCKKha7SL+ovgV5/9bX44iyB0YP8u9pYr//tSxOmADBk5YSww6cINrO789g29SvJf1AmWeePN/pLraK5O6H5L4IlKZQ5CHBUHhUBQPAsXleTtrqrP7kcgxjikCSdwfxYQlZR6kcgHjW0sfKGArhYuuT70+6zhJET1yr+n8kuu6cpGqR6tqBf9wWUJcCBCCmzmcMDX8Otcx21dNo2BXbzxOLOFWjXxoIoL3ZosuqUyxS5fKIIQwLCeVlpquQROl9WzqRwNTvv9rPlQEJEgyn/IRy0gxwEk3oR0YyyooUWmif9xLGovRT5qpDr/+1LE1QAKkHNxJ6RrgUaPrRTzLdD///8KkEVhSFygssbQ9U9UACIQBCYhgBBupHiwSiiAJwJ9Nd8pW3Fo6ddgOqG2QKIcUtlAumVAy+jtfMUA90poMikuYh7rLzCYV/m+0A/0Ql6S1Dr//qgJ/9+jSimf/fVajAQ3az9SEdLcnT1qACAEQAXTABxBsQCiKDUigDeWWpguRDspYFO3LucVdHGsCI8isIjzYwLjdovajOiOvbW7QJGSuN33iyOPdeokCK5CPceHP5l2XlGmx2yLCP/7UsTfggp0uWSsMQVBO5csAYMiGF/vQKE/dwkHtadTe+nrf1v6QASWDEEIm08qi+pIeSiQ03aJlzP/aDpl3XF1H9u6/ZgOEXv82mXNu6ypRC/xFYZFhGkfelDFl2ia2HIviy2QcPmnOCCqwH/VV/U5eLLfe8gqUaH4FB+UKN1PkDEFtRQFdtoJu4laxLsHKMgkK3oy8DfSK7DF29tYL5f4kQUmXAgAIdL+5+KXzc3CGVudMId22VKGIdDArJtRJ/j+kDhd9r6SB05WIBS8EDAu//tSxOwADf1ZYUwsT4FyJSx9hIl484+qt9ShlZsEJXUAlMSwZFMGaItk1DaNz7yzRY0tcgdjQwpPmXCk3X6t/by2stIORDNnn7Pmre70PS9Ga2sQCPKQKBKDIOp2sX0rN9+T/alkCupXR9x3VftldnbmdQBWZXAnYOVhVBKOyBMrMYzhRZCo5Vq5UYcEMQAUQMJRYJbuG6GTzpCCtWwsiM20Zgw3e2XmCf3/2ZxUGRm8YiW0ZD1zDf5/3gKvZ1v/9f/yuv18/ufzPzmK9QowDB7/+1LE44AMCLtdLDyrwW6SrTT2ISiNedsQlK4oaid+4QAF1lCFercGzxGEwOI0Ay0QiulQ2yGoHtAPiup7Uy/Y2P+csbDMgTLgAa8vcBdsv3DHAzIgnegkCLgdgEM9OeEZnyvtV+ae5BsiKCjglTxN0p6el5EAHXCxA43HhwI4lwHluPgthAEgorASEYqiJsRl9fq3WmGn6Uvzt0cSBw4xmlYXtfAwIrOyGizFBfQxv1SWrMryBtpDMYsz8IJFCh9L35o8dxjaQdrcgJbCQ1TWXf/7UsTjgArgk2snpGXBvDRtZMMKWHCUnxKi8MyLYRXt0NKSTdM46XJAl7dFtOOGcjTtkHgXwTWZJIx9aoXJEsmKPhFl74gc0waXZZyZA1PUYS1doQZ6OsIMq3ToFL8qkBs7Bs1UZPsLZ1JycDshxYQXahbRSHkgyQY+i3569i1kAqBoIgJJKhaBqIEpwQCVSIcJRthrMCIIMsDXtXaHQDpm91WqLnp+mkjzd//yXTyv7tVG2P1cBg4+ZMA3w8GaTypFDQ+7rbWnlvDvm+h0sSGP//tSxN6ACfFZbSYEV8FWECzVhgz4hcISbKvbECIhIRAiUTAdxJGshBY4SGlFHPJBG/hFqUPGqMET9C1KWqDofMn6rTHkpBIu+HlBrH835kNltn4tlV9VHADfsbtwjCeinwxWV7iFM4zZ3Pq6WIdeAOQ8lxAFnVkmMbZgQWpVIBEhjS7jScoaRtDWAh4qGzpaLJZODwrDrRaGNVWhDZG0P7JHorytB4wDuw1v6mqSXMpOzfyfCCCxoVBTFAfCVzWYqIT3657pXaOr3dS+v76A++X/+1LE6gAMdN9rR7BHwYiXrjT0ihzDDVNrSAMZlJ8hSTimFWf5pFG1OZ8ryWeKdsX1cM305POyLydEtWy/sn0U5lh7A6Bqo8JGGBJEI/rOWZchBAlMVmabS/S9f2Qv/I7pPbofvDPzJC7kVXK+cNO83dUQvdT5qp+ai3BQpThRqvqHPOJf+cAAcDqHFGU5xEf5kwQlpSpAHPBGiSAkgdxBDxC7ONWNyIfP8QpHuIJ/lJDXmhD9KRkURg9UYMpM2CuuWk8cwOvrC+jiXzJHu28wsv/7UsTlAAr8cWenmS4BiZytdPWJvB/L5sdN+cs79L39y/deJ+zc2AO287QRrPXGfPERz9e77/+rH5qd47+8kf/O9j6gcJOs7nSxFG7/5CGsUEjkygQ0UC4Hgoi4u3qKYlknJj+gV3KHHPp57j002//aNWjYTJQ60x+zXhCB0GSqz1qXHz9BCQIxpF/uRWxqJRunte3/VTyI29VNbmtOJbN1AjeGZ0Ir+gOwdj6cADKjAP4yIwOa42E+uFYCSJFHJVW3u1+ZGBs+mxA1fp83kpk5//tSxOWACuBxa6YdkAHxsm009g24zX+a+YxmrPHlnRoal+z0seLFvTW+qm11dh7ThtVLFMh0a71BpJKlEEVHCSC3DfZx+qhPHCjFjPNnQ+PLkAJ0YujsmKf61IukHWoAgEtIk2c8bj1gJTda4DdJqp4ajAvs006+6rONniWu6wBQZDQlGtHue14NJu1RNqVtOkJIqOMtyOcHqcX1h8vR04whaiwqk0qnGsfbDVzx6w9apTFUv/vpXd6RA1OWQ9Pk3DoiaZvKXrDS0z2z9a/0S6b/+1LE2YAOdK1vR4mSSUsN7zTzDXCY1br9865ha9T35JZ9+NcVQUBUxajhIwPG4jyEJsDmA6G0W2paDafDY3I56EYwqCCq0BzO3VwGFyG2Sguz6SjV+1CvTWou+YA6pGtis93E3updlWJHwSf9+uoEBgAxCGUzA3Yu2GH3KeVuLSW7q/kTsxVjb7lWxJDf9q1GdUyzvsUq9WARNXXOz12zkMdK5kzI4GR7P6piyV/uIOe4MMdtiSUk1UwFb4u9EI9ncJOiKhkInpoJma3mZekmPf/7UsTUAApslX/GGG7hQgluMPSY2Mqc7Lf2u6bMpRoNlo0K2O+91RgaNALjMclDuw4xqWkR1HF3kXIzMuUUid6r0JG96wMbPRmluc8n9OOdr3xNVvl+m4/lmScps9zHREcw05utEde1BAJyu/6fm6t0V/pLHdrufP6yXVS5VaYIIOBMJUBjDisaCbleXzbYUz4/docnSsmjDBVSoeBIFzMw+KVG7QUPaR9XThoye/1CYCM721VIrdzXeMfliXBt/aShcSVqQOtLlvd0psR/0qAJ//tSxOAACnyZdaw9AUE1lyxBhJT4ARBBmAk4dWxyPM+gf3FdCmtwxbeGwAsJiY0dsQC8qSttRCztR0Za6SDckmNGf9uMoDItDw/8Zq50tDCzWXqYCbrWw72+zrR1eOjbV5nIyEMVCuyGQqeiYIVXTsKL1jJDubzMoA7r6gE0gAABhFYfk8MZciFSGHIMisogiiAiCXSaIkT5SvpCStXTu7iClbpPvnM6zn+VspHN9t3RyvQn3srr7X/0a/yOn/9qsid9ibVajpPej6dIh2JRg4r/+1LE7QAOhV9jTLCtwV6ga4GWHbAtziFm87antJ3ZeN2M2AEtDkIUpIuQRS2jzTOYL05WGAsHQ9ZYi+AqNkluxATN7vubBRiMz9IMZZWkDPLMKYCrXBWq4WLDxQmvSK2LLK5jMxdFx+i77/a16FF0/0MLVQAxOFEjIG5HRflb2KhWi4DZJiXuoMBBypdYac+jgM41RZi1FkVapu/2TxayW/0Uz+q2ODAgmaF0EJFMbLasWjGUWABdAGDhgy9D0aK0d0aj3JvtrQgrEgeN4KAXAv/7UsTlAAoQlWMsPQHBnyTsJZSJuNROipIKPJPSBJAAvQuCkFrBRoQMJCMEuOZcvCYs9lUFata+7rF8JezbK7NQkRFj2Xs06B02jHGIYHLU3cfNSjrNMX7qch2tGQmydUNb73pSujvbMNUbOJE0n9bmuqJWHbw1a/ei96/xXrUAVBwEBML8UJexoMR9HuqVIvKyWRR3abrtFT/eLX0fwIw2Q9raMUAc22IrkQAlnefsgJQ1F/XkNyt8dG+zf5Bybvov+Kd9IlD/+l/EX+hxsiLW//tSxOaADFVlYywkS8lCDe1w9gyoWLSk9ShJEQCICCRakMoIRMiSJDvRJ6C8LCsaQlTtlzNAeGJnzzHXAM6oxTnEaBWdd7G6MIDck4/xOCtnyhn9vpMKES76QQ5QC8QdKKtAGGKNd5ukoJHf+6YQMRU97QDSkYoOZ+qxTJmSTHcMwNEvRqGqQk4rA8B0l+oW58y9ci+3G9aVrDzF3jL2NESAYRxPYLqD7KYCg1HXCmKyJ4gzfjN+sAmV8zBAX6Ll1kZiqq2kqrsmpv9b6qlHf6P/+1LE6oAMnJ1nzCRtgYaga5T2HXD/Ry/rDuZwZ03bugAs+koBApJqIYB9mOVKMgph1GeTVEliZzpstWbxOefVHHQgQ//e5QaTNbKu5NQj19RxVl7nIzr1Bs6+0Gv7nT/VW9kK36uZkSqlf+1X12BO6OjrEiVOVO/TASAYZDMCiS23RBj7LsQcg0AzGUq2sfiGtIZzpOVZRarQ9l60MAJHH1cj2rG8wQDp0188i5p09hWj9TizfQUER59SEMKr+TX8KKVU87rMQmwsT56pInzft//7UsTlAAr03WEnoFTBbxBrpYekMOySkkZ1F1dVF2oE7jYfdrepxCoHSBswiaydDksFvgEsEuFDDY283AgaIEGLoxXqAJ5COzXRt87jTSEOFKsk6UIp1QlBc2d+Wp33SMJoSdlOShPVT0qtCEkU7Ke3b7fsTIQeKCwIE4QnC4WFHTbAfiQ5WH26NzxqAYLrQLA0TnTGDom0bTUti5ZdZSstQVanMwPQ5cPNwWT4MSuS4h6umKa4PD1WYemAVD0W7CtRlhqQseh9psIBOm1TFDEG//tSxOkADKlhaaeUWAFipOx09YngBzwSVoVasWhjeLIcm11V8uhTNl2ljzV3Q7QWQW4kSyASVEIfBALAFgQE1tSIx8RzESx9iKax1teepNdemxTjpCcNQSbHPRwKzg2ttThRmKGAQVeBapRjNRzG1/r/QnOR9+S1izwr1/ToBLZkAAJOwfBKYq+aK8XCp8uk1aADGShgQFyOgZWUp1JXZDjxUkCo02DT3kGlgoBCR4NHRw5TV0ZUbrNkXnQWIsoWsbjXdvSDN9djr0q1ADAaDaX/+1LE6AANYWNl56CxAY6kbJT0lTDxHwjgrErUiOnYt94lvRxmdpDyNkdI2euJVq9Rli4EyO78s1ZxYlv1czmSi7siPh0zXUr1CxxnZUcZIanspGysUV48uZit4pUdhI4Lj506TYg4BoBCB81S29c67WdkUT26eWgEEWZIRULcbaesUpCykLqKMzskqTioV049ahZD6guTc8hTwaxHwtt81rSNAAXnLo5/UIoB5MS5eJuWZ7BSzP6lTyWyWr3kDRK3rYPXBRhk3MLDQV7OIDriK//7UsTegAvkb21sGS8BO4tutMCaQDDrNcgc2s2sWUUsGWCwiCXRlFIHmKYYPMPgbjkUomBvSl9cgIlsbidCzeZKP5R3klTLdb3Rv2OJAConMw5n+gb/Wno7/SaUjn5gSFo50q71msq53109IYGDSXipdmgMJUYJr3CXf6IkycWWGuSJrGAZZjocfMAqA8FGUgchcudlALyZvSFtC5q0AcJrnueuRKziSG0rUECjUfioClks5jnJ5zkbqT505SdHV/ZXO71VV+ytfRKT7sxzOTN0//tSxOWAicRLbSexBMGfl2wllhWod3T0digu3I/yoHDKKA0QFz36awUAACxUs/zEEwUBJRkkSXdXzClntOmE83NJSQgCNEUpS6z+AJbxQ9b3bHoJIQhnldWR0cyiRB1Qzo4k1W1AxDvyGR2T8n9zOv0Q/9r3sWZ3+QE+/47NKPu79FUQgigBCSpA7hQL6CXhGRsvDTGcRn9CXWXi8p1+ass0oPVp/Q8czSNw33ZwAQM0MDDBtNcXbIqyk/DBJnWLoxA7fU0sTy4C0qGsrqG/m6f/+1LE6IAMNN9x55R0YXik7TT0Caxb/scAotgdgNchQVg9AtIMkURqE3GWYNCo4k7Jr5FYOIoKWSr4ImKU25YjDCf5iA9Lyn4h12RvLzH/Lo+EpIOHWgoww+knaJmsRKgghd0TRJ+S23dPM6E2wOQS026xr5c5rQ1m0fUMeXdsBQXC1WnrRdEzkJy0uUYpPGWQtPGIQh7Od7Yrx8leqeLwCbCpdUwI2LgVwJJzsGZQjenQL8LukIVhEssORZ575Eq7NpasotSDxWTmff+fg0P9if/7UsTmgA0BJW2npU1haKUrWYYJoJv/z84wl8/bFP3aTyceXVTz77Zp5iHgfD3SvLP8GXtJ9//vb/+olpRFlRkkuSNxSuMxRAYJT1cVkIwOmmF3PLV1Dt4QwjNngLUo6XKk07bMFRonUDgYIExAJ1K0AYEBUVrLmyL4wgsfD/pfGWWbfZ7cVFE3/60BG9ogglEEuNRrC07PFHJJkHsgVUzg22igHk0J0KJ/UtI0FgxTOWjHW/zjGZqq5HQWJQVBaWItFiQwO+gt4LPbLWdxY9/c//tQxOMACiRzZUewSUItsmvI9hkwtr7LbcYBiLAZdyXOrSQEq6WA2XHHWotxTLJP2I6jFeoEKErxkqQ2NtLHtWc/Yxqk32Q5rOBJymyJPMNbQonMnnQUHrB2MQNJBQpf3p8ORKkPWx2QtRF6L/1904KrLbUADUxgxlotzKQH+LmzpQvBfSJRyGlE98aFqxeNSyyu2xW7SV1WBkw0cGRQvbR5OenU43cmBq7XwD8m14YMKVmBo+mFYxYGQSqGCOy5kR0F+HLzq1nHKOL/Bp2tdv/7UsTSAApQS2YHsSJJQQ5tpPYMeC0HmdYIgDdNCFLZd6aJQAsHdSKxY2fdAOTD6oobKrT0MSyfHFbcaB+Zs4dn4tpAfXGd3XJjBMSU1a9zn1DVPR46mT0kQ1qr6mmEp8Rh8YuhsWYKXcJpGihI0FnMULMrcMc3zKpAKaRQqgIYyxJw8SHwjBpp+EcZ52fiEq6LJMLzK2oo5ROvUiTY3KH+g5P57tep26yyZW9L9LqZQ7/QLP6HYIZXsqOMCp4RoOrIaVjWMsYCqnaVSPZwfAg4//tSxN6ACmyDcaeYaoFFje109JUoJ8QF1dX0gAThpBIEkkQKGFCHrXSEtxgubw5xnEFwZ0YBaBDUQpsl+WRznoLPJHE1u1Z9dPQdMIOrfUkhUoziCfjR1HbOdTsRq/ztt9b1RNpNUZEfS9G87v/+nkZzhR2U5xciDNn1hPAn7zxpZyU9ZDBGW0koJ/jdCDjzg+MBLOz995RxfAmYd2YESTv/uF1JNcvx3P/4iRE93d39/0r/vpn/2mn8dw4txZxPSu7/6IiF6F83d0L+f/+Z/xH/+1LE6gAL/JNlp7BpwX0XKxWGITARERAMDA3OvmiIp9zDm4At7/wUjpAAAE4QDJ1zMCvl3FjBbGLJAe3YWVThAnSrBUSJb0RAIxcnpZeDVJl1kostL7jF0cSKPq0v7q6jKv42KY3EVWHUyQ2NOArOla6+edy0urqRPOOpnKf8JIR7Tm1ZzlwXKqelIKRKRwVBUV2O4Xt7v/pJ8FNVALNrjFcKlUcjMesRbFkSihu0AhONiSenHgCXjd7ItiZyNE2KBBy0qBAkH1UAYPol7d9rGP/7UsToAAvEy2eHpE2hm6zsdPMVqUXT0O0xUVgIWCxuo1x9SGtOhieYnt/MS5JLfsSCkLE4GZUKMIzQ/AnoBR0RtFjhIhVgMiRiK93N9qZIkDIdGyIvdDaxt1fvVzoVjI+5TFa/WXp6jSIW5SRaKkSX9f3rWG4CmX3p12FRXCSR4q5tz9QAkOiQFKUYVYoefz1ME/mRt7OPU8GXRWaiYlaResqGrv5zX34H7PmRfxIWOXlxAxoGsJKR2vLB8kjkYs44KuW5RG1ZKti3VufANdCu//tSxOOADTlbdaYYcImyq65U8w15txLnw0ZRQkCQyhydmcrZRUE7jwzPV6aNOyHTsR1c5VrtSErTOwRXTuyJFOyfza7Q/ZDNZGYzbBabSbGdlDR51LrQyf12vOznE1NdEhpB9/8VtO7zCzAZLJETBC3uz9BZ+tzXM6IyMzB1uuRVTBqDyVJqlyNRD1WpcKhO2L4tYcH3PFeqzy8NZFlv4h317oI5DUvZwmCGaZ4Z1JKUGuyPff97KktSmmRlVuxLa9l///b972dmVo77ZTg9Pjr/+1LE1gAKBEd7h6TGgU8YLvD0lHgJPTXZo3CW3U7R2SqJ0b1tD6LsrQOBmCiQcR2uPHZcjHtiRdD3LnB1bcOsQ3dQUFoV2OWYPTseZ3tIyGMwMjqaqXN9WfdjlYzEd2c1mU0SUidb+6k27iw8TTQUDyrk5YqwiptVfzFNMMzQMKJpQlbTypw3QdtmEWe+aF56dj+aUE1NEen1H/6iT9xdafp9l9aFdAXTzfLUXo3NdSscPKrKrirIpao1J0OoKPkJZ/70FSKt6f/TrpSn7GVSqv/7UsTiAApoaXOHvMGBdhgvfPMKJMgoU9/CR1wGvHmN6AAApBBSbUAJAebmph+EmI0sHq6YFFdI+MuRERxEjIKFcmICOorO68quwWGZ3O+PZQshzaIrLlTr/8qyqzmnIpwTVf7Iyc8mErre3JKu4ohy7ep+VAbiYuxA3WoS+PUS4kliRQ2NLwEskD6REzIst69E3Iy4mUA0jPkYYh755A1S4sXnjMz20f8u4QnXjGaMZAWPIEiBA9NsuC0V7e0LMiarmKFEy+pFzhHBQEEzCV8c//tSxOeAC5U5d6ekTUGEG+809hS8dollnpUzL//pT9vcF3ynEabVNFtweccEQeEQALVKVGGVrkAhYQAAF2MvozC4jiNYo3ENtNCkRYZYOCuWoUJ3KzUNwktCLjDmsutk2FpRI42TzNYRvr5UnlpSfKDIttzJfhn9srNlizshmU9zPLb3UMtaXfSWzX5jdqoETJAAAc7AiydivjIL6b+U51Uh6SQtQuMc+zKYHLDFEbxEnaSGJZJGyNUZgbSFG1jFZtPM/Igaf95l4x+k8y0lAKL/+1LE5oAMITtpTDCpwWmbrOjzHeBz1U3ssc/FPurHq5lrC6eeREcFOU8q5CFKzV00YlBqLgkMR28UJ2CY411EwRqmwIkiWR+jbrEt/TMJl0bm+WmugadlxF8nUX8/9xRYkCo5o40KNUhsGUUYhCjgWw9IFSMYH4zUdUNIUbqAABAogAAlOt6NLEbYSYxFpHDkxI2siEugdNLJ3V1FrkBWgxlkjxqwRJCOHXqLCscRW6NYe9h52qhc3TZF96hZzaj3Fa3yBEw2vpuUWWW37CRlgP/7UsTmgA75S3NHmQ/hWxutZPSM+AClpIEopyhAAz2UhJOT1qgyeNbOaSfMNtumJVzZqTaDXyDJDqQnATme4IZ1xVSaQ0MAuwqgETYYlnoOlaZO+GzQ5t17yxKeUjQ0sLMUZAVSILPXNJRQGiS36H8tKAAqcZKRKSxnKBGmcK8h4SKiXSMDpbFCrisg4vT6VyLDyctLvtZujkpBuYPOEbGbgwRO6kUyfhtzyX/bymefr58vX8z8kBmnTP8+T60hbkR2Y5Rj/uZTsPZ//Owv84aE//tSxN0AinyraSeYbsFblG0BhhjQdUPFs0iOnQ4JIAoAADsYRUiCYwYlE4dNUb15KQHGFxSY0+BmwyYYnG2OGmPTh4eyNqRLA3rPW+s97gVzoZ9p/+7J8T1xQEjtyLiqVu5b/r96rCYPgBISTJkkMtF0XFCSCCVD29Q1AKAABHwA9mWMFsCqajUJ9IdYH00MuEQXCx9mToi0JkZPk7N7VB0cOBCHtBiomieHqKbk7cLIk7/wndtCO+nhtuU4l9COepE5oVK5lz/CW4HQ+1iyZA//+1LE5YAKOElrp7BFwXSN7PT0idCUMVlwGqjIg4J0hFiw4SRz8+Cg1ASIAiUI4yUh6UFBqZr3gLGCLqQlArQRE9s3O2/N3re6ABRN3cJuOpxF+D1QZe4P7Uq3Kroec9NmskygoT51JA6t1AsNHh0uK8u7sjDAYDwAFGON8MAJKBbEUdgDexESoUQPQtmQbZDRHjJYUiPtcEINs9DRRBzjAbHj/Dm0DR1OLz9QSobVzHDrlqQ4VwEEKzdeFRlRDVVejMakQMvBCTN3LLPmHohNlf/7UsTsAA05a2unsGXhcBGrmYYZWLxttY8i6lCZxqHqXUGZPS/L9eyTKBhlTSZaTZguUylLwhl0NpMOMhcThiS462su9qrh73PsaJVbkL1Hq6JeZaRp2B3pGMFn7+Ew2g1qAIeEgE5jfgRr+6SQtm36bVsPugmGKluxqcdVBA4AMQYNOVv31aW5jsyeOtMlrwO07MjuSeOAJCsOqV82a+wFTpMjkFEWgVUjkt25dsqP5OlSFc0uOgJItFRFPoFGlnXpO41ohSeymgFUEawM7ksS//tSxOcATTEFXsekawE9jq1gxgxolFcqmpwmTjtjwQQaimd/TgjSKVwtzAUpxqqwPF6UZeF1/pULvMmu54q7meRjykM5Gd9hisbRwpezM8rkU2zVdt2ScTT72pNVrad+yHyYJbQ7GXk20L7dNFkGVpLDzImdu6GUKggQek24m2i4BNtI6BJVk8D7jHeIhgPCI8BI8YOidkPtG1LS7L2e9WraUiB0Uw/BfNUk075hINcHaXA6cGj2WUHEny1uoogepSNHjRlTyV4FniQUixHLGnP/+1LE6IANoJ1vh7BygUyObzT0iPhF6FwNy25JaoWqtbbaRdEkOVjHqMxiHY7SKNuKTwtjidnCCi5iXy3u0DDnId4Yrqc8OAfw35mNOuRVSwxohGf8oLpn/Okan05npO+eXAQhO+s77X5vuxjdmHZRkPmRc/JrO1rTKiqtOm/T/5yylQVEO3W49IlKP9gW0CxFzJQ8KNjyqlMqWfcBXtvl4Hha1zZH+7sXV0lJ2cVG9m+pUCwcURJSIhcbtOhFT0CFbU45nUedU/60asiVpW0WYv/7UsTmAAuoo2sMGG7BZ57t8PGKYC5r5Jt/9HSAIBkG03E2nBAEOYTbbjTOs2izLWIbSNL9Rl1Dad/ZEc9ykYv55I8jRcWe+YeAnh/v+MaYNvI8T+Rhun1c5mZpmsDK95v7PV3ZXRrfZE/rZ7okyovVE6vJaeistndjsPWKLMs84sPRGgkQcjYYU204I0Z6VOhEzn/FekVY8gsG1HzFSDKobFEE9ZRSjfpva2Giqn+ir65KCPnd0OEWj19RkezfK+n9P0dSa6f+n69av8n7Xuxn//tSxOgAC9R/b6ewaYGbHO609g0lpdi2QMxw9rpllTqwEIEQEBNeIUS9zFcPlXtQTUYjnKZ/a6ylYETMNUMLPl41z4LMEZyhVSpEbPhO5zgeQk5YAAkSQQ/tt6BxdRMHxZYfF8atDXAMafU39DLEe3+pHFVVHe5VE0T9jjiCZKhPk8iBZEIIASVLoh9lBqSZGyvlKFxjWiZhUV1ZOKLZC7nMXC/pdSSrAIBzzAoMcb/lRIOfYZfkuk/4RnBxz1SyN6lm4GU+90sJI43FECBjkh//+1LE4wAKpHV1p6DwwZ4sLfTzCiiNUiI4qlivpFDD8RLrIGKauycoE5DhNw+0wyLLggz2dAgoFD6aksbb4nf+5o2ojMGpy5Su7NVmRZ27GbsEGs97Md7oivJu/dU8/Jbui0XrNNvVlZv+v++8iKu9eM4g0gwZt0UhuaUCgAAkIlL1fgAkA4y2MFPdIy/DQnqFjxqgQEiCIqYUDmJ/Tyb1WoD+1maQ89pDxjXWMZXI37FJTUE3BORRXaSYFmkl3hq8wE8UO2XV73SKrZDGPDDSIP/7UsTigAsRX3GnpEuBXJGtIPGmkHQOsIe+1mQENJpuibqBrG6DYIICWMgED8NUBaP0BtiwuORA4LXXVMMOTWAx3+qX7hj12b7M/3DH/GWXItvDUgKh2QEEBBW58jgIeso9KiLKnJm1LLuXUxtld49wMrEzA7C86nIqAE5MXHIi34FWBXOq2ZaasKZwEASsMKgDDq6lCvRVOTejf3prZcV9uQt2pd0JhMjakkZRcGz7LiSIXRPI/+gwpstnuo1tDekYmuWkRCDltQ+jsY53Fh+t//tSxOiADBjZd6eYbqF3Ky5w8wms6xoIuSOH7JnRggBBZKg9JU8cT4LyJpstlqd7W5YoiBBEiHVgNn0YleMQY24S2/cQIfTVIpJ1D20pKLHN5W1UGHO+bVDh5EejKY6ndJBmlOPihK6sartbfkA05X8AEw6toRYwANB97bXFDElVAwoIdKXBxWhRRuYqNSlw4CgFZ0IYKOkZGJe8fwHtWP/GHTJLA1WqU7pCQROqxMcPRmA79W/X18rsl1ZJxgs4YbMxSrIRZTNvXb06+1bs8bP/+1LE5wILcHVmzCTLQXuUrbT2DLCvcUjBVq3pBBArLUiZSSQGkSosZIhdDAOO7UPJVoNCTtU5gThg1ZeJGEsjly8GFkILRbYjbp2lIHGs8Ix3KtIIvdVdPfRVv9L/DS5bH1AQmJfY9Iu2snLpvQlVb7Cc4D4lfONQmQz5wQNJkLqFqgQgG1USDBAoW9MIFQnoGFEjZslSIDLPQW2zISiaIXRkia9vTG4ru+EJgz2JTidceFf/eCFFkUOZa82EQIt4160IE6SxwWabdZN+583Wb//7UsTnggv8/14sMKuRiRjsaYSVaKP0LuPD7mZb1gIEAlMmYhIpzaFpkQaq0RpMOrmuPo3OJUjqPzAVHDBmRCCJZNA6+J5dXODQJbq52y1oqJkpgaPrrxmrh0ssSSeXjov8jb4kFVCMgnHVpCdQl9XpiiXHFSkhyhVWvw1dy6+qy75mLxsaPUE1bJ6K+9RmKLjd+6oyqfPiyIVBKZdlwnuxve/7RXqAPB0kAzeq0BmYf+1Bup4377KB1QjLHs3VsBJ8qzlYDl0zHq8UyVU4VfMA//tSxOQACuC9ZSwkqsGYl6z09I24SRAUASjI83GUZfOisNN0fMp3N3NjqOjoz4hX0e2iIPHQUA80RQe1Ri12e+qoLFlFhVz/pVbyR3f97e0wmpFq4sDeYRdj/Oq7ShBuVT6QTG25hgt0unLY90C3Ui0mPep+QeKTmFE5oSo9m04MjRQJOSJRMJQ2DrVRQOuqFw0RjUJb/2RxKDPG+nyLLucFLQzG6DSMET8xW9DzTSBok2QsoGSIhamUF9uEPz3Y3Q4LBBCc3TlIwXT+HyFoSGf/+1LE4wAK3I9th6Rlwm0p7NWGGjmlhJIpNXfABOFBQjRJtCQta6okhbfTYWSz2jacWtk3XD5z6ctomKlMBJyp0HS0PhBhAcdiKZnKwoGFqqvz6HdkLvZcDoRyI5mcbtNkDl91R6dMjCGZR4MiZSDODQEWtI8quWFhKNBRAFiqhT18i71GvX1NJERRpcpCrmWN9qUIrFskqCo4WhrNJIF+ZmsvxblSqFerOi3BTs8KzVsNUDMGNgrDQHLL1/fFcfmCZFeyDvaaFQ52QiZfVUdmb//7UsTHgApAqX+HmOthTBGuZPGqILF3zIhET6W1H5KrT20qZUyhkKUo6xQ0fq1JY0qCYkqi6imWlAzRCCUhW6HJHKaof2iFe5BcyJiGsD34jGOYkCieDgRDTjbAv5urlaZE7FLaorBjozoiGn6H1/l9LJ1J9psPw9FlFZNZ1w4cvpsIf50uSzIqNdvKKgEACIN3gGQGlFpCIV0mBrsr0KRhnLCltBsoH8a0nqvH+M/LYo2CaHroSJQ6IPDgu2U9pxuMND1O/xVWxaMJwQi9l/3k//tSxNMACmCRaieNkwFjEe5owapg2Ib6r4H8XXGpNsk7osxK/b97Pb1WZGhCTAwXqlqkXD6OLMFoHoyDYD49HrAtlMaR0kqPafXFEtFk++r1YFQcOyKo8R/WbH0KSkKkKdVVyIIQ/3/U9SrNV9VFDxadUTe2ZWCXRm7Z8lrpO+v9IaR9tQLHtExHQVTXlBbDmtwbBDyuYoDSQnObr5YclqkjsWxVKF8ovislpxyxDL3kFXYXFERKPefBjhwbJxWLOWiHxApc+5uPTd6Eq7LaMvr/+1LE2wALRLtzh4zxIWwXrvTBnpy911TP0LBCYcSJAQABgbKPNZlQpXKJGopyclWk0vdgUzeoqwX7ZLh5pz1Xc2c+0cQKsyLO/q1KpGK62tzcRg/lX4XlG/czVUYyXKMoQEZYrEGhDMD0/XNUn97/5MvDBcPnDIpCbY+luJiBDmlaRfWjEdontJYj9PQBgPxdHxaKKKgriQzIGPhRCkeBIBIlkRYSaFlQIo8FluypxW0aYMNdBJf4yFA55GYiMaJbPvzl/QOXI3LIwANpdfYMHv/7UsTeAot0vWSsvQfBXxdshZYg+MUE7Fw7p9jHFvu6/ytSxZZ8WNpUEEhpRaMJooshQfmw6E80Eokj0OvIC4ploxsUBkAMCr/yYhkElcpPQtiptzdmVrr32o6Mcs4qEkYd7hIHFgqSsyywySFf7evvss9vbceWcNHRVUWZTRUA6zAim27BJTyP874SOoS9Wm8nWeCtPSTA8LBcIqlJhv8oVvdByYq0ag9WWmR9rom6oFgcUOge9sjEChrDSkG7WlLdGhCN7L+ZfY+n3IKqH1+u//tSxOIACjCNZiwkS8Hks6408Zr8t9ABhMFAuSSjpoEgp6aBz4g5IVnwzZTG/kVxt2BUvL9JW4v2Q8xIUG2gvjBDP3fp/nkp6HeiCBTOXva77OROZu3+UUih/oFe1iBpBwTIvW8OpZvMEKk2q49bwVKhdsobSUKFCqFqCUwUmnKBav867+N3aHJF5MhcGgWB5BpPqqkZKh9HmpCirGSV7K5OeLUPLzEd3sSJXLUsqOYarTgoWM9Pqzqxdkmz34psyEo1LrDh7au1yVoZVUBQkRf/+1LE2oAKVIt1h7Bh4U8RrvTDHaRUgCPDabTqwIPVdEKoMUpyD9fJpWLg3zdfSIlTMGWo9zh1hE2iILxKnOWfSIs0e24Xf/xcNBYiNp3/k15u9oBiBuzdrcW9cSc6TclO6AXRTS0JNPCmkDLoKstM4YJywajwnCrqhBbC9bgvqgBVoBmJqJbPCxMmC/KlmVaHqJlVsz57Amch3PJFraQwrJpE4zXQFBVliD93lfX5bZc7dl973td/SPM7N5B2uwgixAX2MR7O5uqN+pb+b/+REv/7UsTlAAp8kW1HmK0BjhvtKYYM6C9iSYTFErVYj7kQK/7KnYi0aeyES+66NaALsrhvlrpODfI/f1HjtMZJi4tUNuGx3U7AimL3W+bK55zvfahYu4Rc1Vu7XJ9War3ZWtW2+7/a90K8mer+mm6Ub2equ2odmgWJz77wfXUAAGJGMLaI58qMKTYFuMQpHIco8ISQuHVSeuKvp35GkdSZoyqCLz5KUkQGge5TxNvGFQQFgWY9VZj993Lb0/+djys/3NjD033mY+v79dvsA5xq3a4v//tSxOcAC8yvZuwk58GJle4k8yJeLhlNsOz2+5/sX9yMqfiaJxZZacFDEiymWaSNvXwmgPR0hcQkqlRsJqIr2SpJmIqT8UZnpd4N7YIxNIn8RcwYqrLCr2jmiYDCg4s45iXx2Jeca9xmPYIkj1Tecjq1DamzH7p0Qu4WFFPK9aiDT/TzSNLVf2q1uKkXM3u1oQm+kjda1SPSKSJawSnVUTTrg2UcU4SNiIfGRSOyhCkSoaJwUw7bGfec+AlAIpxMsY70/IqkmA1owiT95TTs6/n/+1LE5IAKAI9gTDzFwZ2trWWDCiw9GEDiFSOeKCt2YsutkkRqr6iynnRbf6ttavfoJDCLhQj+2TqAcbiacNNnqvzVcMuNC+j3J43dDo2MTQSp5eLTCsgZzOJ7o8so0d+3REqq3SvmXQoSHKVJanHTLRbp1b3XUyu/930+5jOeqkXTcHGWHE0YBVWcCgTQpXEwTqi9kQliF7I2JcYpgnSzExeoZbWV0sjc75WMMPVu9wE0pGadVt+61Un9alUmFI00da7q9HuVV+ojY1AAUcnp1P/7UsTmgBGRo2RMMMrJMZIt1PMdMFDrnKzLRbaVAmCbOzCLgUpOz+POZULg6mVZ7Yja0LiR5NGDe5X89WGOwIm+68vtnxheZnoT3QEWZXJzI2UxBTZJFXU2qgmXUr35Z8y+1rJ//29NPf9buZ3otyXupikUXBWVPvrmVWAgKCQGCm44EDAlDFMsN1WFiUZKYhZw5B9MyPQvx44f3pYXqpxx/pb+yFTBUovM31GrlzleNSXCAkPm0olDaB9gGeMMUawO5Wpp5jSQTk23U1tv279x//tSxNgACoC5cYewpcE7F63w8ZYYGZHwA1yBiXIQba51dlbrbrQjWYe54tLe2phVHn2VDn9rn2dYRwXuC6F1UWJnSNlz3zFk5ZNJKtmMiJQ/J4xHUz+MGgRXDyUsck0hQPuWRQRsuqHNFd0wZu2Eif0fophVY1ru+puYIDCohEiyubxezRHKQ6yea0WthYJjKIKsgecZMiOd306nnOJe00aMbYQ9/hgESr1M9GvuYgUzr53kMuqaGV3r/NbOGeRVWQqUmo287rFvwL6FNiwPApP/+1LE5IAKJNt1phhOYZUwLjTzCe2i04RL2lDBlpEjIMChlNINynQehPB1HEYigRDo0cOBBYjbGx+Zx+cFgwc5jqOAItQyjIhRLXxCCBBJixjcwReUQrcAQzrB8EInD9+XCAgBAEOIAxUYXvMCcEAQic+Xw+o5EDkILh9QIHGb/oEaqxwAGKGTIAYCYZL0ShZ52Vy0wR8rZyqQfrMaScP5mhQU6JOEBYONwLBwCKKtGlBAIkQ1KsIlyjbTSy0HNp3ua+ZltVU7vEPrqIMNPVnUhf/7UsTnAAvIj2ensKnBdxHudPSV7MYUPNnxq2uBVy7xIIhxkktKlJUKuHK0Tjym38DAImogAoiHEAngWDKa0qxD4PCYHB3ECSBgdoJlJqN6JxcAwGjpGofCqyVGug+YMlnr1I19/p+GCT1it1RIc+6pvolvkf//HKPOV6E1qgorbE0EkSCoNMMhRi7Hso3Y/wCJBGJJSHdcY2I2vwXDRQM60cXue7wEOOWebQuZmn4yaK6RhQGnvZ7+mjmn1CHF0760w5U5hlCGLQAxRho6W68C//tSxOcAC8TdaYekSaGXke549gy8JBkJWpXZs5ZZb4RaB0XgNGVw5ENAVFJW+Wjd2hms1xx3/dZehhF1vYoqbxxUnjfYIKN5x4hXPo2z6bOdwyfmM7tqjd9K9tVm7XVJ6s6Ah7aXOBh5KNw0LQ8KBS4WKy5/UafmnGIMyWAAXI3QTuJzDRY2yabVkb2fHF1AwXJkKGOollkOzii9vNTvKc8IGWWISez+6Dean9KFeJDQ/mQdk3JSyBnxxxAoGMSnlhVTNQqNqkMVevLf7XaCy3n/+1LE4wCNTLNorDzDwS8UrnTzCTgSmgyZShpsHwf0aUoalqz2KSlOuKvpILdRvMVEKkCGWRDRYu0SNkd64TZPhcjo/Cj27AYBE1+Fu3Z4nyrk7Tqc0YS1BhYNB2pJkkKAeeVL7pB0KQqWe5VjLIWu0IQ2xdvvu9NVKgES1E4DeM4iD0JZscxYy2N8x9AkBSAG0sM61st6VEWW1ufePqNBIcJHBAfR4C2bnejntlfNgdJ9eaXhX/hJ+ZwLQ6NcdFVXj77FEE/QhuKpGUqqoMWOz//7UsTlgAp4gXensEchkCIv/MGK1DCj145jRUFkAACUklAa944bSmXCzWSMAkjOYHm6rw3hAk0OEg71By3KkeYmx/GUKbm1HPNJL/pCXNaitJiWXWxREGK93WdNEpyldtJjkb/b7U1on1/ZNrfJ5un6+RDO1FVs4iXUdw92GQijLlmKHCAEdrMqnnzZJSIwUUDMGxxfZFg5TZAAzEHWZHSP1W+63WLtmFDo47KW3O933r3sRaTzERMQGA8s2NCzb2rlK5qECirjlG1TcwKI9Zta//tSxOeAC7i5b0wkaYFzkmyFhKHYv0EA1RRFMlIF0CQwjkzSLm9P8yTSZJDAJuF12dLNm0DLRltXbWYCiEiHBImxBGlqBuv/mXWRne3tV78/IkOEmyR6x5RnCUDpOk2pHdIBQjIxPFHXuc5wuoSzYe0hQqYnu7DYQn785zud/r6xaTDa4DiYSI4NnCYzJhaDqguRvVE7BdeY2TpMk4oX/oUJo2Do+xNRBGaTC7TIoQk8+gZaUR0qYMbaaB4iuBUkwkkrB+RSwSmz9COXD0ApqAz/+1LE6AALyM1s7CRpgYsubWmElbByWy8JBoxmZlObR84fsl/0YlXCmfvVWXV9diiLLsRu1qq+KHiBlzKepSHXNaXtaG5QkR4hY5Jo2xpRKkGrRGssHoxAiwAIyDzJ0dR2nOoE8cDpUManfzPbrrFjWLh0CIoMYg/ssvfqsf7r6wuzIMonaQNwW7RWPUIFORbKrYoKAYs/7qFDHjwqlblve5ZZn1dNddEAiERELCAxptzefKUNEaq5QhXJRgVqF7kX+UQ9pOWa+FdoZzBZU9gbmv/7UsTlgAqUl2YMJMsCfjRvNMekHGCj5/06hbFui9mh/l/jdv6UoEfr0RF/QrpkbAGYPChcyE5F1j6F4dtpHov0gCk4FZkoQezQc5DRLREunmFzKAysrddIGh9NW4nnbZDCobZmZyWJ+tt2mIYyig2fa6Pu3rb3Mzi6rp8ico03/vSMdQFxVyjRwI0pV/Wd26kqANGiABJJMMZgTxBiUEtHg2IarFqQjCOiNHg3xDMtE233QYJHlcidRgrJq95yGW1sxGRy7ta1slGSKM1tRV+R//tSxMkACyDje4YMrYFPka6w8Znw3JIxlCnY1rDoK0KKqjAKJEndNTxQsyd3lUkEzXYPsyi2p4xGEQ9Pm4rHejYc+hfxO/VutpJG01iiJFjHGzg+d7yTleEySIgR48FmMrdcJBJgdgUYdhelmSkrCb3LdZ5kM6Ajfq4C2M2fVsoAQBgQDqMQMUToW8MaUW+Ca8YojwhntiJkiLw7nKuxJBCcnTSTljIEPWeKqRlCHOxdxoS7Fu89SfWtiW0Bk49FGbt9Mt/1pa4UCpUhRZp9Xf//+1LE0IAKpMFxh5hsgUEcraDzCdjWQQgkodFSsnR0p0nLAQ49W5lSaXq5F4yhOp5RBcLWYHnLwetLUxZGY4GN7aCXqNqzozEKtzwrkVWZ9zIy1E2s7mUhCbJs6m+lttFVn3dLKy7yP9Hlo7hyoVDQJME9ym+90XkrVTiqCAcJJSDPCTEu4shKH5ehXmdOCnk6XRAxK5F8vHx/Pr/16DXmB8G4WOioIK8g5xMSe7sdchcDBARnTqjKRIEIoXretIXF3gpUzGwwsGKHY0Hwu7/WD//7UsTbgAsArW1HmE7BRg9tWPQOGLeUBBwgOFEfUGIa7s2wG8gwH1lN05RYEiNEdD1kjvO3KSexypOqKCnbYpyAGsojOkY2lrQDUjKQHlXCOz4z5efqrO5hRrka7mXZY6nT2k+ea+RUtYDW/v9IWzMt2dAFGGlWxeXY+qrthjhHaGP1rHbDKoh0nKHwylcSTmUHJ8TgAkCIAdzwjHsBcLwOJgTCcLRkNE4aAMpMDRo803knU6JVq7qM+xa4auwyC3P/qGCDoXQ42NJC6Swp2FcG//tSxOSACjy3ZKekTwGWpq3w8wnkyQYQcOqmjv9Ps+lI2zs/r1JRQty0eQAgzuz8vQ5BccCMt6KwsGZmirYiLMIqghjtwq8oPHkPgkuwqHfdKWBgkIrWrYSLPWJD4afSlZlzQk1o2iv/+v02Zq1DqJWDVKHIxdZrOnjViCUfkiRRSTodJIhzCS4Nkp4XyOkOhd4QaRsrE3l1TuPqAjFoi3UVC9VZ9xiL7ykoyMqOgRv2o/ukm9WZnqlGauhNv6or/9a9Lr6I6LKOdStyJl8Pqhb/+1LE5oALtH1rh7Bswdm1LIDzDil5Oobek8YQgAIUoWiUoiyzVqvN0caPITEVx7syZMBb4aVIlYgrOSFIcfv4kExlNZdLc3GMzJ/akkSw2MPyFHy8XNxkJvzoJb8+SQrym5xhnnSIjWCwVJt6KOlX7P/9bFI0GQprgRBBUJrLou0oRoNY+w+HcUiS4VCEfNnt3MgHjV0Bu90MYXNY/lDGA4EEfJNZKDsgft3f0XdH1XGNWq/teBShokGlhABXUtMed9rrGrt38TKQz8oprmra1v/7UMTagAowfWsHmGyBRI/tWYSI+LGuuTEa8ANQwBlnfa87ztCg2hOLWU6iarKEqlRpWfrf8J+gv5jHtWiEuoqWFZCOD9IN95e5raG279fIp1aROrMaTFf/f2pinG5QCOFw+A2B8VpGbqLjlrDy8qhNQv9K7En/X/fGrYALAwBQESaaUhg+IxdlMc6uHjAHosOkQ/N4Hzj2ttBE1WodHkDDOEr+owrgxke3UjggIdDKH1UmmPa15ch0fvxzwZPVdbUkn7yEUZsuvsahnt9iorT/+1LE5oALnT13piRM4XSZ7XT0jbB/Ur/5TMRy524rVZPEWryrKN0O832VUKtnTKBkPad8sEflECAORs/AtCeU+/chJ/33tzAuYZTgmRhVHq6uUo7Uo2xtdNF03MVWrLfLVbJ4cOra8cywwNA5oloVSsbudpxSP06ismovms8GOHQouYRhrDOip9kbOnkkkohynlLE3EWETtTDpq9p+IRT3KinYG4brzQwqsskPKpziBeePlIe21TeSsX0P2sSGzC+9lk4to7CJdPiOz9EjpDATP/7UsTngAuoqWcnsQVBghTsZYYZaIjt+mLKwOr6RuFpRF13J74dPcgHYWsghlw6excPVZFx7PX8sourVtjHGX4AKOqzs94gs7+n4Otb/5DBpCAC0QlCqlNW2diBxK4qHTSYWSER+JCU0VLEJVaRKmzjOTl3g0QGBYebQFq1iz3CI2WYFczMHYlrNjjOZbW1LHKJr1FTrQq3e0hhmoWWt5XL1o+hAZcCEEAAELAAhVMINfd6GzQFDONqeawiBiMSWCHUz2x7F6cPp6hOGvPAOdCt//tSxOaACzC/YSexC4GGHu3w8wnsuG15u8tJEN9BdJC+7VUTjqqQPQDlqS2yRFllXj2NXam2ki6yzR2PJvclHFWPdWAFoCDDic2LkhjUH6V/GiSKREFputYMmrllerjg1Bg6VUBxDM1rCSNNhrqbrJrlCwUVplp1w9TBzhNUUsWk8QSt9GMTUQYK7utrXiv8jMssrktHorUAqAEDDoWyMjtGiGgYRdUazlwsKQYWHdpVUleTvuaKDNrAFJcQHAKCk6CRSyzgZw5uVoma5sVgY/b/+1LE5wAR7S1gDLDVSVWK7mWEjLCfcLAMfCqVh5Moa1WIQv8cv1oTza/f9noASkkistLWEKQDozz9MlAH4pS/BAlPnZhNldnBZpebhAWN9N40zUBMtBv4v8DZoDL6THGSwpqLhoQICB0VW7k0XONhBVNk83isZNKY+B6Mh/s7aEIIPHAABAFJOAGL8uS2WFtgcWG4bbxvK81biYxo7JfJUmgVWBGZnwy82kb9F+JzK3eyj1XIYqZFgGFGVMs0GZL/3Kb05Nf3xeKs9lq1aWawBP/7UsTSgEtslW9MJavBUJJtIZYg4PwRcRbBhyCwQJkLqtjfR45inoZiMdjUuzdnHUjqxGw1aZqNTCB2HjsGNV/l1XalYB/v+MFjn33U9xIGNNGe6edafXlou6O/1A2XGgyUqQBBcCng5sfde4Sv6Grk21xVt3gwila4eqVmFMJ1AouAIlOJMLmijps8l7Z3LiVBaY/XvRLUNzFaCEFBAZXk2M1bqJcwfufEWBjd8E1PrcsktZyQ6s/fLwQ2e0tvknDUjwwVBcBuE7W6v/v3//md//tSxNiACiipaQekaUFNkq7w9I0sX/0AFAwkBEq/C+12r0YAzliQN1DJBA8eFsFzkhLnEklPD9Fd1Pvcdj7hJMq8JFqMWE0ewoZd0ke8joH3p8rN9jn7sQGpZbY5Sj44PNmuaPzIWFwiHwswybUBBUQNtFGOVoYZKOFf8/iiFQAwIgCirXikEea7mcqGNiOqvoC8ZONStpRTAiKkCo9tblouXMvotNO3KRfWxbkdrVVkK7c9PsvfW6u6o33p89Fdqo63K7G9kno6kepazu2hZiH/+1LE5AAJ0INvrBhNQa+V7EWGGpDR9nKERbECva8/508MZ5E1/QA0KgAghSgGyIIKaxiDMDqMwUD7x6JMCCrpODrVN/NkfQgu57ZZj8pl+sWQHBK5Ahgq5Yu1Va+t9ahgsiJMxUZWEQ4KuWiq1bUf17OHf6/epQCjAx8cynQjUr9raJDyPG80ND+ioR2wPAcToRWF1Vuy1SK9zAnfeYM5ho7H6PaF8tGILYMK2jEDG9Soc/cnbz8/WYQjOcMcWUNg/ioOrOhEVBxg9Oh5wuFsgv/7UsTkgApsz29MIG9Bm5StcYYguAchgNiupVSks+lBBbcbaraSIKDixyy4MS2avCpE+QCwzya1gNGaqfXzfZxhGKlwo7cihF2qqbp/xEzmYF2/CMvI6hBaoIkuhz0y6g0RbS1aYjE93/q2yqUAeGkbkfd1rREDSkUjNootFwGSoHpQRsOglHANhWhCcjhQCbU0Jhi9hhRJmUjDrOJk0CNnHL0oV6WVTO9I3pkwZvcv5B4c0+grO+fEM7etqWRmGePvUXhzUuLEw4aJR5tV49z9//tSxOUADGFjcYeMT4lCD62w9gywjxCTl8bp2gpz6xtNxpF03VtIoobCuenytLqMp4xtPFHK/Hlhe98uDdix983aE04pSwbSdoCy+4LOZ2UvMOqlpJQfhWQPFBBrYljgTWaFEC/9gpyyTYxQ0kd2cEBouKkFeybnUVjVAMOqdVbYRCguli+Njw2xxG41pgy4IqPW03b9BZKqPVl+2RqJTZsfrYscVjWgdTaX/fGgm2jylsmiAMpH2r70j9o76Zfx/ydL1D/9XxgHd13Npv6UTrH/+1LE6QAMlMVnDDBpwVSXcHTEjX6LedoOCVhp41j6r+tsmsgSaWNJpJtSDfL+Ts3T2S5oIUYKWPQ6mhqisJiPsYOPRG5FbrSXb+FPEOBq2ZPLphQKFzL4VC7iqAZvD4FCx8hQFButfWZe/833cf1Ufa8w/qUBToFAWZAATLRQXim+06LuS9coHw9QwRSgYHo8iWBd1j+96uTo4LvacWIvWyy5DZ0BR/AgMHUeOr7yj/CyIlFV7oy3RDPzFS//wsynn5/zLmHGpipBo10Ky/RWrf/7UsTqAAxc63XmGG7hepRutPQN7ChFBbQLp/etbGMGJuJggktuMI8JYnaHmkdA8A8OAlEkuFVGYGKNi0JBMzyw5CFxEOYQhwMLXE5EPkk02Ian73d8RDbCGbvezAQIugSHudPu7J7GshDZetvPJth4Ov2eTSIEEHjE95+kCGuenCEp3GZZOyiGRj8ww0Lvs91F3r65MBj2kmg+/xCEa4IDxw+A7jeZZkcqAEaSZUqVVFO9D7DJoiUtZzc3fcW5wu2vXq6qSiULBjD7UnMApcpK//tSxOcADIjjb6ewa+FFDO208x4YBjCXJvc+hN10fVEChXW6IqVSzaztR8vN1KWrbZhFmFwCKFlHmk2CxBJY8xM4smla5FRH+WZSqgQWaCLF0FSVgSKkipQamRYUPMFYy5HlFGdLmM/tapD6pPqb36N6r4q9++e4m5qq+eoFAseElvWXHODNARoY05Y0mBZcIX0I8wXPAYuscEhhxM15a5OuigUYWmlUrBHcLxWLJzpQ9VhUPGFlgQ10NErBceo5ftC1d81etM+4ZzRIrZHrylv/+1LE6gAMtPVjLDBpwiotLjT2GKn2toYwfICovfW8dIw+8DMQepvNf6Nuxa9LPmVxxa1ij17KhjNYqQvy5iYkpOsdzEfLCxKRp0xqxcAiCkOFe0aK/qCE3sNyJCYLdRga53QY21W0XNPdCiYSHMq+rvpGlR3H8kghIptex73Cpg3FWihVhh71PvpJ5b6aAlKGVlI2yiklRd1yhyULcg1ytl5U6eZGRXNi/BZjXlH+Ye9MMGdp/YrUSLX0017un8nvRBuca40twDKnkKCmteb1hf/7UsTPgAvI+3mHjLEBWRLuYRYsKNlD1EVlRan7vWHhZIUWcar6KhqmgAIBRUDcAtGieaSV6eL2hUdZfOaLgTUSlZoapYRhT6Dhm63k5mORmm5IFkPP42y/n52ICEvvFgWUwmlp9zwwYdQWHX2qX++oorZZf0x5GeNit/1zNQgWUgArxXjFmUN2VbGllXIButlhhg1MPLWuE3VFUXijdEpGraZaTv2HalI/uIs1zWytR0JuLCQDWtTXoWzpM2j2cWuCaBZHSbAorzVD0ONUvks1//tSxNMACgiXdYeYrUFZEy5k8xWgEt7Lv/9oIEACpPsKPfdDFWxiTMmrAgnAoJR0J0K+5F4qgdgWtthS4TqYPY94Fs1JKw2sW0xVDAg5ulHTFRY57hFRZkSGcXvC8z1XFzK/URxa8/PfV0v9flH4AoeqVAx2IyTuehQhOgUOhz++u6at0gBfAhArhlg2CBHlhRo81UPhHDDZAcQihJH+QSjNsiWBiPQG1YI0a63mqb+2TMcKCxLfI51zEJpo450ItlJbq5Wv7sPDaVkDiyggZLL/+1LE3YAKoJd955hPIVmS7ejzDdh76zGsMI6Zu5jSgUKM/v6gCLwARbxpnwXs+kE7L+qWjC2+eqFdMr9as0W+l7Fgu2lxhcMyYGKOPC7AgFkorMstsz5mToYnKjCusxukXLtW6xaKl2tQhmMC9Q06cY00GFpNHxrO3WkgAVKceTUEgYAFNINsXc+kEZDMdt2A5REViKljapOjsFN+Tlb/E8548XrBR7Z8KVk+F+SQtWvN3DzbRwJpSAVpYsAEQRQ4CAZMa3RQ25bVN/olXWQ1v//7UsTlgAsUz20sJKnBqR7smYYg8PojWp9Q3hiII1Y+BaeBYpCYUg3K6geLp4f+2BjSzqC9crEyD+HnLO2foaVqs1d0SbvYZHh48xQbEx/SBgERABQY5wVLD4zO3vscUgmFVObd9kkOJscVMizQMGCEhtEqIhqQKkFKAHikwjIDrO9FlOnz7Qw/CTrx2XWkZBdzSmr5lBHQdDie5GggVodI2+5qmRRoiX1Mw/kCNqSP1jbHWyLLyND++5n0Q+r4aqaKf+e9jUAOvHO12125/7GB//tSxOIAC3DLayekq4Fvku3k8w3QNBahVx3/xc221MySW3R0zsrla1KnWiDnSJ2pJdlTcL4jViyojglfV7/xlL4AcbFTjMUAThVdQwaDl0+dpfkeallKQNDUhhvFqmCx8kyJBCOdra52tW926K7EdKkB4PkklQ7EINRx0NNFyN4MqKwRtyFy7B0FIaNllcJkZopQIWR+PTqE/oB2QDgJhfNNw0WmTCv6kUqBX5pSdRyQYxqJ1ICZFlGZ7O2uF2dyqrVYs4gTNi7F1bryRf//foD/+1LE5AAKlJVtJ6RpQXyNbWTHoRCEIAQAbBoyUDM2ZNbcVRZ+Heg8IGj8CuiDp59QaOsLejaWbxbr0JxW+XtVA2cJWXIjkXJdYJK9OKVoU3UcY2FhQZZ2g0MOBYFSgWshg47T6zkmL2VKLGim+giWS8MseNEtbCOhymKD9QKhUUBFyWqFbNICfqxUCA5lZAPk4nXXYUGmCDFFtjiEx5sHwT1F6sY2EYMXC9QNqwguW2ukzB0fzcUQL11FGtmni6hCcMFjzr3cuKNrvMw+i3+Gyf/7UsToAAvo5WSsvQHBjpStqYSNqP9q3pMNUfYK3Fs4UQsoE/aItiKiJJYxiaHGpUioFALWGWzzySeUTvlVrxatcYDtTtLNdwVH+3v1lqGzTiR0s4oLBVZNhMPk0mxARzq+KPJsZuqJyaucicv7r+i6oo/QDTKjlNSAOXQ8jaV6fJ8M2ZD1hC3N8b7Gn3JVqiYlDi0Ts1aF9EgN5hHX/aTMZUkc1mEMy2o/iMEhy2JNZnqh3BToRNVCcoEgwTFFNMWtGImNz1qiGeaylh5epC2j//tSxOSAChB/daYUbgGfluxlhg0433Gm7iHvQxUIeJwNxsyThrJJHlhaVMX1hXAwQZguxciOGDRkFXCN0EgUGgqNMMBkUkEnenw0EIGGrPUDEH/9Y+NcHTqlzLbkdvaB5Ldmu+etrM/+kIqEd8SPC0E9IxqpR3504drwzN/1mQ3vrP6i7+xl+Hfs7O//dsv8wmWlgRdDwRzHWikg9lSnQsGLcw+6AHoNwFklIyPY9C0QR/BEDArD48C8MlwkvKV0BYDUaZ7zJ8JC2peabjueVDb/+1LE5gCMPKdlLDEFwUQNLST0mPgZNpBwTvWSLNGaEQvGgq2tyblhoz+sSBd5ok4yukJH3J/Yrj8r07azZAUWhoitn+YhjqVFiAD4UVhpH67BBW14nwQEtxh/4O3eOgxXAbu5AtNb6mdclnQ4sEiTJMUucKGBHCZomoydaqdYN5RnZprewYyyq97mdK3u6bh9EKBCREygUMtoT5mJtCC7ItZbUfVAZnAhcgOvIORN0uqGoMQkKMFWOke3IqHCARhQ8TEyiqiD5sJiRRkDqYgjp//7UsTqgAyIrXGHpFDiKTJutPSZUXV378j/tpknlWD5ilSrol5ERhwEEEYkIXZbDiSDIhxwvkQE1icFhgRrhVvdxU/GFtMLNAtFScaw0dSj7oBEKct8gvKdFL/KdintQ3S6tU6nucbr0mAb93/306PptXTt1BkRkABJkwFrMdCB+RkLWHquNaGHy5w3eWNec4mVv/TvqVT99K/ND95aQXMebyvQ4mH3+bKkqgg0eGXJPO5XXvwE8dTBYuJUJIqeqjA4oTQLsWEBrHtSPpsxR/sA//tSxNEACjBTc4YczgFQj+4w9gjwwxgsYTFk/0iKTW1qRMgJQ9ISwSt+eYuayrHgEjEdHxxOnyP9ytG0Yg+1ESQNNTIZQEUTh5qTWHfF+ttdXTf3IsGx5YWAppCoInAYOxgq/QMsiE0RHUzepmYZX+GWuPkCrdP1VQgTHUVIkAnIRpDDqQ08z7MNaXakBjrYrE0dzNhXyXdzUK1dYP33sqhUtWFGL8+w47WEgs26u7CaDpb9hFpKPqh1Y6vq9645gAo0XFG2VAqlnISDJlgHadL/+1LE3AAKGG1th6RsgTyZ7ST0lShjhRRzTYfACnoR/ZqgJmQwlpiynPUp04zlzT7OpV2LUUyAMSEMLqYcVOhD3dfQLcH2kpkB9FS8GTUdfPlMYD2121ZBZ3zw6zoY4mF3h2NhEMXs29rKPuco49SkV2f71QdJKkARwx3zAmGMlpbDHVaEBvvWBELsQNfQGB7seHbgUvLlvuRr+ZWj4V4zg1R1+iEdONoOPkaUcrYYH1tSQGHBBBCcPUDPMpTTlDOtewAU7ZAmoGrr7/57fn/wCP/7UsTqAAx0u2bnsGvBbhIudPYg5A/+n+erwDd4W8MrPIh87PY8PXzmRy56MOT4NEFY7ShE5ckYZJ+J6iQBuzB8UjrbieYUd/JbzrqdONkyR0gw505VmYqhEagUqPokEMzagidXlgurcBWLYpbpqN3hmXhogue3fYPEI+TxQ1+lAJjdINUA2vgxhHC9mgqUxtQPEKe9MvaDJgNCdd9L37z0IfX/zRFYv489yxijVHxUs68XS/KEBcOn0spVqH/aVVWy3+ZuffEVyazIantzLBSV//tSxOgADIjJa6ewqcFIFyxE9Bm4UkAKlYQAAAQQ5LAYAKomlioZDcuCweToKDepcUfd9/7vPVdp4oM5XHjhwEsBhMli2CKF2BCgJs6q/RKnkbUrC1OCDCCg6ICVk9BwWKYhZJSPEaJU7YqANpbbLdq9nDQMlRj9F5LFFQFHU2yiSAW4bqiQsyTQPM8yGJ49g1RIAzAd2O0DzEUoq272UQXrylJQUMSyneikokbkLRG5EX61mQmHEVq3VxsleqaJrOzbmZ9DIzVzuRqfbtYU2pj/+1LE6oAOkOVnJ7BtSU0NbeT0jTBMeMDy7UYiHReeS9IuQTMkiRqDgij2B7AiE0snQ8FU/PSWysQq54804QQHSCsMdIJaVCEa6jXqBy4q2Zdnf99C4QcTVRMDknFHvLjI1JuqYKVO9Lr//2I1ryWhGQQgIBIAEm5JAqKJuC3y2bQpZGUJaEkejSDu4nW+zqdmPNHlbRRCtZuDi4lR26CUFV978tIN74dXYpEqeyZWsgRux5VXFu7XZCXVH3cZBXPI2Fntta/ccirXM10I5HNWRf/7UsTkgApIbW+HpMwBlBosqPYM+ARBpB1ApXJGFyOSNOIAlJJxWE+0bo+tI8L5wI9LlZy59pcBZAgYKttsQRmcRK6JAn7mo1NTG1q9Ef63B88rFP+46mONf7THDdJwrwz19PPci3hcMHD675njZihSHhL9B6L2ySjr1MX6LkK/6AEcImRygDAsOI9gxSBsPCCPoGg2qZDX4/XreAPHPyIpcDAsr9XVuSc95XeoWKrd2QlgekvxCaYNLBsqKicFk4uJKh2eim1tq2JPvZk/7Xy1//tSxOaAjD05a6ekSYE3lm1wwYoYaXv2+fa33mFxq6l52JVkOOAXggR0F8Eua6GKBlUZ1QWkcaIFnhhaBBP3+cfwcOj/blEz09Du+5lP2RKaufa57vv98qiZXRD+uLPz0ACaCZwMC7yWIGRjDligQcUOBcLlxAYTE7wfTJy5/ZV+JwkalUwgApPAhow0LAf55X4kqHYz2bo60UilEFSGJZOcaeoKRUL4hqE51SbBNvBkndGVA2Q5y0gzuMHUCEg6NQzlBoy4LBqRskzqClUA5oL/+1LE7IANDOVjjDEHgZKcbTWEjbiBbhUPJDjrSOm5Jui5Co3ZsrTRtQsCUWpEiWNFOkR1BVQ4cCoxEqz1MdHyLEzpTaFTUhTIY5ZLihhQME0zSG0XMegthYEQUaWFAmHV+FR4Uaggsg+p9TOuLPuu9fvmj9LeuDcDDnnGHSghHPnmIZBpowUCll+q2WR2d9MXNi800lNWqR0a0oxe5NAEtFowKKMlUtel6XjagnnAhWJZRsWy0uoVjF5MLrnF6QzfdWrVMvTLWq0VdVUxPcQPSP/7UsTkAIrckWmGILDBmJmuLPMOGGjXqfiZAbmEE40osFgEkyOTqkYuyKbZLbiYu4mbVP++rvu+5UcG1JJPa2iUQyr2pkQX5ZTLpSsKWq0u4W8KuFuCxDKMCWwgLIIjNZmP3WfKZMxl3hFLO7McoQpnvb9alz561NPtMWczqa13qk+2s3/3p1bQq18p/Xa9nTcaru7aBBzRBBIDMzkeUOYjgAP0H5gSEhXwqJl75KTAZzZlQVyT+f6wgTtaprKxMNpPCXby1Twj/IOqnfzxafzf//tSxOOAEJ2dc4wkbsFQDm7s9I0oG3F9+45SAux63Emi7CUPViI0FEliILB2hz/UzHK9bkn6wlTDIs01un2kRSUF0WkCbrWVzYY71TFtSpQXDJDNWaAqc32hSiLC5WKUCZiX9OOjTZqKHQn8ZfLn0o8I+0jcORVJ7nBQwRLvC4ac0fIvCtJKnp3xYBL3Nf7azxD06XTS6gL7aIAgwKpJld7RFnJRO9NW30Uk6sSbM0Sv97V000sVC3rni7DrOHKnrLUoY2J6zZJUs1y1TWVKogP/+1LE1QAK5Jd1bDEHQWmlMDTxniwKi9tX7qz9queYEU0MeMWExU9tuR1xSWf/8SmdqIs1avZYgCyx3ESSmxOxeIwm5PR/F2UR0IxZ0pkMcluA+fjHeHCTyCEDg0kJZKTYEUEj9tZtXSpbip5ukuOW9VEF4+sSoSAiq5WLDHCNN7+7sEDd0VPpEc22j6Va91UARZzpcitBwjIVTItKhP4gIRlgiUx0KZLyUU1YPye6cUux6XOMbf2t20o2m7PeeVlP8Uudx4A192z9KbXcCebMhf/7UsTaAAwMz3GMMQGBc5Kv9PYNPDtjE5dFARB/qHq+qgWt9Gn9yZVPkgK7IplaxdzTOVRItAFCnUNutJeFZDDgU5c4sJs9KRML2QId3DOnhYWPIEPpwkubmimSeu76zPNHH/y9zfJ9nTKZ+mCBc+NaLOTaxrS/5eHl8fVOH1RIso213vpWtTpJOjj/So1ETGfthiaiMsI3kc+nwm85kuUizkDLNLt82ACblVJE2q3Zhms5Naq1fMKEDAELpVCYVIkygWFA+sVMxWFiF7vvexM0//tSxNkAC5DPbyw8ScFekq4o8yHYz5V7q9vZqEcc9bX2AuQAvxylxgHSbrtgUByJDw2Hs6L9YW3EfMUh+Ocuga2uzoSVFRQYUhTaffJYCRD43MuyLlnrlMsy72w2yGjuRENO+f3oN0Yf8AVD1sbr5LrMlmkVvXwdcVsepQIGAlgAyWTLmsIZMwmoUzao+AvpclLhlCjWXEWxSZaWXzRHVF57l/S1/yoUERcrHEO3OscXPY5oh/FRknKWzW+4CwsTYweEImH3K/Clhh9vWx/hs7P/+1LE3IAKwNloJ5h1AXIZrmTzDeBEQ5se4VVfdGAAmKImqhvOIcLGDlAxHkTh/VEGiuQfEVi+pRIQwpdsL7C6JNgMvVTTzqQ+17rMmS1n61uLLD3ImtinVgcTcVcpagiJmj2iRIQLOYNzz3sXRdesIAqonXsebAp1Fm4IDx1gJFEhqCRiMEGLETUpyqiCMJcac7FJXMCWf6kUqeXkWjrBSOick7PBwYJXpBBwuWpYwFB5wGxZxZZJag6hpIy0vQbIlAutyTbDzDqpHGm0e7IvOP/7UsThAAoYl2wHmFEBfx4u8PYM/NDcpQeIWHrFN8iEBSiiGhBYhHQQDLmRttBUJicDSDhyAjN3OkQMGcVzbb2yGftjx2+ImYMu1nN1Zmo0ld3JY22dkRJXKk+vVG9D6HUj7WWpmdk9f5Uv/6/qv//4WRdSBBcwAACBQgEZ4GiZZwEzNTiaLUIvHJmOB+cXRF9y52qO5Ve0498C3qqCWImDxj5ise+mqpbbw9ntZD71e0/gztqheXWv+OxWkAETq2sJQJEMyzFHb/a/cFlLYiHl//tSxOaAC7THaywkacF1k+3w9I14eMvS0khtxw2FtFui6GMeaiQ02j5mYkgDbBOCAuICFVIrFdEVSWmOXRYk8Ams6t4UE8qmajYpaMFREOJMpq2OUK5SkQ1rpCslmbu7q66fst1Um1ptWkbZKtv5Lbf/319CD0h4jX8Rx+0ICYtI6rG4RBah0FjwbCavNmwmebFUrcPqHw+/wmFi6kDQUfECGsiD2WjmLONdL2eczd6Klz2RbzqUgoLwecqCoCaKtbTS0bJDhgeGmCA6pFjVOT//+1LE5wAMBFVvp7DHAVMrbbGEiXi/tS73diWPtSIVfGUIkiCnFsQDBTX5fIYo1sUEyoBHZ3EL10cBp5hJ0zFNJkdxs4jJcMm+29HefEAhDEIohmu92fyEu6s/d60vnt5dVcr1RqU92fTS+dWndGQ5SpwaopVk1dz590Y8PDLwdySD/fmlnp+dTdUEJKMh8KAR5DVQAsAoiFS9SUjho6E3Tu1isM6zVgKTsx5nUYM1JpWKT2aWqbEAdWMXGCKneKZUwqQvK3OYe40nSxf9aEX/jv/7UsTqgAwQ5WcnsGfBkiuuNPSJOOVd7F87nusAp2ZY/6A5KtyIqmsoC/brXqZ6FI7sN+AQ6/3kN8IJHew/+ouq/X2BSOv8+NhQSzrC5AQkzR3Cq6heaPOilBOeSwWSlpKl7CNv3LYyrYUN3UjwQa4WYeA19YTXyQVVAEJbUlkoEHQdRXhUjCQSpNxiczj/ACaI4Hkrk2pCkgUCUNPRpJ8vXkBxL1r58MW55nnGEPSPzydIufw3pmsmrHnnn0VrDznm7HkQS4W0QL+y+m1A7rUI//tSxOYAC4y9b4gwocGvK661gwmpoKniyxpXS/1EiyTaxy1IOUZ4sEhCTd51HhEV5YpY6KjOUBWuc8WGpx42Agpmvp+vkDEq8s5pFSQEL8axHU23NTVdrrOm5HP/7g1qJtkLHF0grJY1jktdY2xLt4nyoTJItARYYg6nUnBdAC67aUQRAJYM0pFaW4m0RFrLKnUZU5GdY5hNKySffDHAeQeHroA5MFhmBTojIHy1JEPnkIVFvtQEQ02KLVQOA7B5rY+k+1et3/wE8bFh7yrz3Vj/+1LE34AJwF11h7EhQXUN7jGGGVCwIDfqIgAChy1G/bjI4w42HrdHYa7EZVDrhxucj9WsZKt3UO6NZd+MO57Hgs9hrVRBj/K5MSOxFi7z2P9DDv0f0Q1fBGpDiGwibvs1hmMg1WVGzgfGCoK6MtEJQiAFqcwLhsqnJFjCmn9/lAQSa0BQAAAQBjT5PFOP5oUqDV9FXtWkjhPX0ZYMP05g2sMAyNIEG21gJKlpBOzkBJpROpAGqqTl07McVw8KAZ4s8+lz0kz7gwDFRIOGU3396P/7UsTngAvs7W2HpGuBgZiutPQKKEN27aAWtHCh4IFhITlNqCnCkLocSHm4aSxII46RKCbbHmHGUj305ppLUtqgCR09OtkflJfigz3xoW6pCEz/9hN8fXPceADA7IWpdXmHcuf/+zqS8T/r/f/vap9Tna969637/1+q84oVystoeqC4UKVuNYmy0TxSpNgUKHWOeisVjnBgMFx0X1yW56FWLuQNDHRnmVZFO0u8WjK/TpkZTdlnf7dunjioPAqUQFmNPi0beJja1ES5tnrl96aj//tSxOWACnRHb6e8wUGpna0xhY3ghd5A4UW2oSprmQkoCygIIccQ1y/h+H4+OtPKzszUrDtYVyQuJi+JskvYBGCiw6OEamqO/vDQjMIppmqUvIG8Lrz2Z1xjhSnHtKvYYiZeZML01cg0RxZUEBOKtYtg04OC62uXppn0joRJmWqVtZeAKu/nEYQBxwk6C1wTrG+Q1KYHApEpKWU45L+tEUxx9YWH1j0f2rUvBg/zvx4fr8PAM6wyF1/AZ2XKLSgXRtYKquPOZsGIRevGdrOpXIL/+1LE5IAKmKdtp6BPAYqK7bD0oYkwQZRcu9TKAFLZa4220k4MhXFErjjQ845SwTjNIejUuNHi0pPQlZUXWxgTXZSvyQzIwkiL75SzzgfGAgRi46InBgBhMF1jFTxACA6JwiLMw7AyxOB1yCpMqFIoKwPxlIEYkMlEuPxVQ71ULdVVAPrmSFsoKAYdxc6Iw1gWBcqD+grDQS1JyhfwxtPLG8JtDv1NBijIj6fVKt02dSsVpfjgiSSaeVaKBZpQkdZJXpNx5RDECiwHYpvJpqmJa//7UsTmgAvg13GHoE8BlRyt7PYMeH7qQEVVVmjHRJklNYMZAXcUycM7gTAvdlUbr9ZUR0qBoUZ/XNEbzjDix4By1M5B5LhooOQiXq/sZ1LfYgQY+AYoWAYJUqLCIZY4NJLAuTY1bAk4/C9yFNrNFChU+MmAduyNRTybtCrVZaSm6cQSIAIYRexDbEULxWH5eEcdkg6Fx58/UOvltPxAUBnhwTq/9Omafw3Zf7CNDB4uhZKAfDKFAmloZlCg46ZtyPNPSpIfIUf//9vFSCawgAAA//tSxOIACmhrcyewxQGTjS709iDgZpzkGNJXk5RhTH+iS2ObKW5Up9tfT1LzbS1Oxy2wZeFE7nyfrX1cKucPfFlmcVLejvtpRnNHlKIj62KctNTrd5qnYjnmRjGKJDnIJhIWFnMLnDx5YjE+E6agBctCgBOZYPpuM9/CG9UUR2MAAEQHwMoRUGQcF9EAAYWDqUgGxwrsDWhMFNDlkZ2rchwWcpr6vV6Lspu+p0RLWK9WI+7bnN/U+TdFdUQdHSn/t2dV3f//+fowO2xlhn31JBL/+1DE44AKKJNzhiBNgZUTbrz0DhiAMBMAAAXA+ypVZ8H6unNcaCbkYj9jnscsF+nvSs21x2Ump2bYWUXyF/Y0s8RmPNbN0oxzEsvV1dWzZmtr2DS+FX06mfqEOXMlbzaUY2AiuJRIIn2CRSzp6ZK01uRfVAJ2z/N3tmHqIZZiSiZGIENCuIQu0mwF/OA3KtSGNLMPxVo3pIiQLqMNrt0XUYTX3n69zn+lCr6rPtnQoIcyd5dVw3bmaFVlnnLGiGRLlC7t/nFxbdsipJFzBC19//tSxOWACciDc6ewYcG0H+1k8xYYyztE6t1ht2/GdX99aRIRhQBFqibDqLicJb0cwm8fhygQjcYJUAMhQKSJqdI995qKJFg7fMjt7/wRLTiAm1MOuAgncZJTldylQ9BRLa2SrhKbTY+KBWY6P/o3fq1/Y6oECVQIFTl6C4M4td13MptDgC4/ioOgoJq24uRsInlstvv0X50sxJvEPg8O9Ft0jFTO7Qr9IhAbIHyAMwEBzKpQyPxgEIDAYvWspFopBABufk7RjmVvEi/WOGRSU+v/+1LE5YAKWWNxJJhKgZ6dbTD0jehSnTRxoEJBRIfBUpMRqD7s7f54IGjjDwZWRDWcLzpKRrXZ3aw6r2aJ1GAUbEp6kLshvZWhGLMmjxA8LmxC4LAM0s7FlkU0uUCTiBdqDEkhSoA5kW6+QfStVyHYuCiNdsUtaqoENrIgirIDDyKEFNKaZADhM6ZQrp5J2OrFobVeBwa9UjhAW9pbFszByN8Wc4ovYOLcP2G73JCJPyY4EXDMnFHS7A0GkkGiEZGvFHIPLc8fGcxWs2SJ1/sR3v/7UsTmAAwM7W8HpG8BR40ucPSZEI2Xb0owfWoSSXdVtuONNK0XE0X6bMU92irKs1WzcYk+9ZZ6bpDjQXPCt17Sua6v3CQOLlpMdES+Sk+re3dKMzKjPb3rVaXVSUVrpczNkXVC2/df3USUYCy45K3Zx9Y26112yFK0JignbWp7XKoUTgWw80VczFS4HkzLm6XbWyiHB7IuZ5lY52ktNCpSmlVfVZw3P9Y6kkH8/p+k6b7wjQwYYKLBARBEToHCQSAcwKttujShboUkc0Ju0xR2//tSxOqADCyHbQwwZ8F3jy3thg0ocWSoLOTvHZDixABchRcAOAlgub0YrGVDCtF4oJdyq26eFd6XrLnKr0GJdRMI9pu27TCGWvpl9RYqGU/6R27FDy/v+bX7Dw6uJimeflVz6ZITiQ4KjY9KZLFCw1QRgUc/6WPbutppDiasjqjTaJYvJA9gDH4Xg4ejwmGJ0HzatM86EUEs5SsWLmq7Dxqe0DwaY+KFIMIRfL0/oxzqzCBKAVkSUXMux6wkae0WapYdkTiKVv5YK3J0LoFE75L/+1LE6IAMAKVxjBRuAXsk77TximCulm16qKQGjIwAgiBDhOUlzkKskRfDwgGUTgepHE0Vb16qg3YTYtzOjgdpnHd0W4yi8ypH8xki+S0++RnMvMyzkOQmJ4EJaT789qWqYrIqvQ1+ZSh8k4DnWxqLkHWsuFHmEuA0MzeuIjiWbUrOsOICwd6dFpNRUhWhY6W0h0HTo8KDYZ1ivC+25puiOgWSHWJ7cNNYsI3hEhd+bwUS6dUTD/1+/3yZCwYILAhNO3RdQZKF3Lil80LwJjlD9v/7UsTnAAvsqXeHmG8BcpnuLPYM6FZu1bP1mVK9IJTqpSSCRRcaAiB6FEcCECyl0lLyqjhhmC9UKGqlVeHtSO6YwnmeaqccLNdEtNcmKhe3lTYik6uRg46uTopI55ZH/27VUOUKdJBsVlpe0JxDqUVYbbSQS8wdQKb51bWDE7X21T0VIwQQc1hBOEokmQuxBTyShJ4hfUe4NpoMjWf5Ny9I4wQkcadTj1Erpc2MKTamILOnEATlJnKSMJMUQN0e2hSjwKmiupNIUtpa22rWh2v+//tSxOcAC3iTeaYgboGEGG4w8o3gbkgK1pNbZa0W9/0UFISvuJElFOx8Q0y0WSxxCgXhKAxGRWAQXJzgiC5ZXxzKGt2LFl2KbOBZDaO9ptCri8mRATBUAmgElh4MDlDwKPYDaIZYpLnW6XuoQiRjsm+MP7kM2Vfs/qUgAAQAAAFFHgHBYJ9HAnhAZ9HbigSI6hNEjwiEdOdOnK3dOx9fvAS8mlSFyC7OOWzTiKJlHK4VmLSznFa9jgYJHLRGwfh0a1obPA41542tqoqarYBnKVb/+1LE5oALrOlzh7BnQZoZbnTzDlAcEikBwY+iXIaxpE8CZlbtLDLVWrUQcqAG2vGzthcfdRtHxmm0X9E6gSC0gk8r5P2hdlBJoH+7kAAhNVXpryjHqLQbWadJIuJFDw0SuEgIAUaI2iUyD8k5jUIQOGTsNGjIqeOqO97KDn/qQwAANkKIyYkpCnILSqXI3EyjyIF1yMnDQTeKlLtVpCJ2GuJ3amSyMtMZNoz98z2zsaXd1Gd8WIVKDYVEB0EB6io1CiriUSi9KMyMZnX/UKkoT//7UsTigAski3XnrG7BYY0udPYMuH/vTVxb9AUEjqAKBAAcSIch9qAhT8kL87VAk1ZKhDtXOaSW8oTVJfN5LsQL8vRQPOM2vbVtztXGfcB7m82GefouSKKVnMobPckv3hzqEeyef+35T9+36c58LYssUFYhuCQdct7wmGnAcPt2EUVrTmY+GigQlRwgBglJTRAaYqFaTSduI/UZeh/XEXBpdMw81Zqu18kevbT++myl7rdww1nkfs5UwY0y95ARITFwQIH5YDFAE+UEi1ZC3sMV//tSxOeAjXCNZ0wxCUFWD+0VhJlQlvKkzpTZcoNaJ1zEAEgkmg/5NQxXoBEAlOiREjKI7iCK0YDOzGkp1nCEvhclBWDGNb24va0jLQeDNizhporvJYWOUBMi4g5LE3A0k5Y+EaxdowYzbqUgdM097za0f/cyKulq3b+6BAAMIQQAKTpdELOMyy9FxF0Ikz2w5lnmE4J98r0HlpfNrJrdT+fbigbZBgAWIFQc2CMPEaiSVUgVBZEc9szNER+V+PVsr3M7p6SGSgtVq79tKp2DNlz/+1LE5QALBItox6TLAbMmrjTzDiyKmdfd1dvRlvz/bBqpUdTWg+Ll1izWNNAAEQAAAE4TICgTwek1SSqU+g6AkSirYF3TRMfFrJ8ezWrMlBzH3H/5paiz7Sw52gl97uOMs+nzJBBi1lWDYog/stHONuX6MVBJdG6TKj7pVDEdimRFbbRt364SBBJJoolN7DIKUIGQckZiGasJZFCY1MALzS4iFzHkR5UbBuMEJDk9CPp5VzUgww6ABQ+DqSzjt7YbWgRiFzxYWKqUwbYcZerMv//7UsTggAuEeXGsJGuBSo6t6PMNmGUaUnhy4LOeEGh18R0GY56U9P3JDYicaZIJJTo5jrLa9CVKNExlA5tK1Y9ozM2sCX9/TMDTxi3iPzOup/KFnSMjmV37bNTvY9FzvmeWnvqex7NhTJ6L67wTrOkpp9iFYiurJnl32o6bO8ncp1DQ+5Jt7RGQbyXODDUrgTJSadRYPAJU+LoolSS+dsJ2xN6n1FquEtDVjVcsuw3198zlXpr68ZskjvZG2ZlZ1NmDeaZHKzuZi1oe6d21dnvZ//tSxOcADbVba6eMVQFokq1o9gz4Xdr6ZG/n7y/X09unVGRvwfTK1vzbLP186kBHlIAQMAAAsnoUlWS+zKXGLgTF0lhkHnjg9G8kDI/R13mFy8d/+AeYwJxHPd0fcoYst1slMDCQSUBgq06kiCDGjGPWLLnlPYmDxE5AwHWu56U9als9BTmH6f0o7iUAgBjOJGNw71Ojg1nTw60OMWY44hAoiHlwi3GHFZYFk4uRTSVsUG9Vltu4lKO0fmyhAwQ008H7n8wYACwxZSoIrcl7iIH/+1LE4QALwGNxp6RpQZArbrTxiqTPHiRK+KB1N8p72oJ29n//0EMAstpMTnPUmimEeQDKciHTzkpcq0Uw5x7mGTpgBeRWyw9FJx3daSS6oZDUIJ1Yh02VO8UmZLrr2Qrf0J2T0f+a1dHv692qnVrXo3evs0FU3tkS731s1CkgEAFBAEktx10A0iSaebivY+75VnjlUH32wdv6mnvs53zCA8gj/SyZGMbSyoYz2imfm117Wf/T5/lJRmO9QyPtRc7tVWccrM9v6IouGBOWA6XnNf/7UsTeAAwNW29HmFDJag+tJYYMuJvp/3vCrwtYeJocWIT4kQHAkAAOgAjegKEmuHLH3tMzv1pLVgbcinZbYgKXTFFQBYDIWFRPSbweZPkTj8JcSvJLm+inqpZFa/K879KtdEybM2Kyb/8BFDDu+rpq8HARpL+RSA3rj2rY0TINOK0q9mk7ZJiCSSricC9MVdqpUG6haMRIlsLw5ftx1HUy5yjrPD9MWyGdD3fU0rqVECa2zWov2c9HIrvqq9NXvR/9d/7M7TDonUtf7XZ2orPB//tSxN6AiryZZqekbUFcKy0Y8wnYVVcpWl66xblYGrcJGGYwBPrNhC4AAAADGVakoWsPe6EUdCFP4+stnXneq1GBZpQZz453DmMQqshTrjK3Qhd1mVltupnU1nJSWau0jkWy79l3Vj6ef/pa9tDOb7L2RbfR6yIDBIwLBVSaBb//6gAMAAACBniSNpercWvDrpM7MRc2HRUGhS2mMNzLNS7FLita5wKQTuL2m921Bxd0fI4nD7i3NCNY5abEzKZs57VbN9NqVcQaYkSzyYQW0Sj/+1LE5gAMtPtv7AyxwXmjLWWBijCx/tqVRvH2366xWXPpam20lOF0QUhEoAsDxYOi6Ii0dimuoUx4PNC31BGqESl4amgcczRimKU8cyvkbn+b3zkVq6XIjK3v+Xw7CMQO0XJNBFcVpcFlpemiSWZQLtY70rdZDBxT/fsVCVMzZDQy0mknzmPFuLwGwMA6jFRLEqIzOrEq/foi7ADIm43Ppr75uGslGpQo+a7z+atbs9EGFGKVt0mdnoqFs12MEc+h3Ujo25GGxA4SResdKVrzRv/7UsTiAAvFW29HsElBa6atKZSJsMjej/ploH1NU9GByYNAAAsASlbcXZcl9Et1Iv43GXdquHS4Xo4NDhSreDWBLZ9aKZgy9NrfuRMPISf56h1nEBg2ZEgTFWhGQFCidSq6EyY1KNeeU7bNShtvr//6KdIGQAAWa8y7HqlbK26FVV1mJvOsJKjoBJ9UqFxxsr6eOu4uFM+tMWCBAICuZlpG1BXOPH2jrJS10kG1thmYguYlu2t6KbW1vOeoZ6EYFbjokHgmYNubUKSaEuLTy0DW//tSxOOACxDBZSwka8F1mO80ww3UXHn3n1v0K3jq37C8kNi1HNASkgFSYDoAzmKAuA7gVIyAJIY2SCh+NpM5hIaA8e3XVHhbzBsVEYhAaJkwjhw0Ch0qCQKlhDScCwNrWG4ofDuMdtu4gDCVXcdOijmOM7vRpSvVuhwAgqskgAAkzEEGOtRlRe10HUYvTM6eGXhVoqJXBbntiXi+qD8elFHsYE7g0rOGlNeMcrIgI2bfVej5UU9Uk0MTdqqW2p1kWjpX8PGiydWPkouWiIN2rIX/+1LE5oAMJO1355ivIUcRLNmDDeC6lM3SRQqIIwWuWIxFpYyQiSXRhO1EaSbO4HEZNbKND0kGGp1zKhKpMfe6pcX0gyhAKtVrorX+MpDKdr87ER3lKxkm0bRbM9r7Foj+j9WRrliBCnXY/uPucAgl712VJVLJvYrRDYrqIABJSbq8FeoJYbDDLDEgGuInLxTodSXP06rhkohUSUhLsWV7oAJNzJSikagwGSKp8IMh/fRCiWIcyK5sWSwnK55emeLu6mM5953PzNhQx5Wl5AjW1//7UsTrAA1Uw2DMsMsBYYfudPYwnGRMO/efW5DVpJjqV5EeIIQAAC2KqkzSFzpytwbgqwC5OG1IxWtguk9snxttTahK3o8hIG92kXar+wm2P0f3dNjSu2R1NQNdxmRrF7iB73tnBgesLopQoXjRUX92uRxRsp+7pQAiQAIBKmCSBZk5dE0Qge4cqKNw4voCmyMTDlKhjVnUvYIyyMCHHMjEwlJ3UGWXe9TL2iFyehfCLOzMtz3cJwE6VSY1G77L+Z93B9AGh60XtpuChBJYAgMO//tSxOeADDT9aawkSwFlHu509gi8ONUhRD+D72u9YgK1GVDBkqCQiU+GcYA8DzFEhAwVQ7Rxbn/Nz7bHB1CKXlSJBJFglpIdIEa+zOog5ApJnF/t3yFKsfLDigBDT7CNjRPv+pI9NVrlX5Siev/nRQ0KvF36qEIVBYFKABIAKU4UQmbALkM/dhI2LiICAERDoHxQUlRyGpN84zV0jbNwYLDGgAwVgnCpCUtuR0zMiOE/4kSARjIiA7ySUKCAqRIhB62ywjGvcbBg2b7SJBA8JIb/+1LE6AAMvPdprCRswVOT7KWGGPCDVfLCbNpGjJxazmfRUogEQAAAwIcPSe6ILsiTFFL4lAED1r7CdmSF8LQlLGbP10P1VrRXlYlvMgXd6zmhXdzQEDeQyshmUZTzdzO2Q+W++QIEF5vPYwyoUbful9Fl3n2rAE4BEAgp0OAJiVc2Jm8WR4aG1l5he8ZiKZnERtS412L8D6R8RLYhsPO1L62/WYXM7A5IZprowzjKY46zalI73Sqbvp92Y0BdGSz3DVMAbRK5iniI6VMFhQkoWP/7UsTogAzU92dHpGsBUpNtaPQN0Dk1FwwqWV6wQatloJgrf6yBnBIAJKuEsHg90+W86g/EgolSWJoXFiBNMC6HizQS3m4f3NmUsLOpO5JS1NK2bUS5JNj63yWT8rpP+04fRUU//1GJ+vqFHA7MW5IBHCLiAGRNEeXn65autQALAAAASmAFgVI+k+LQvIQWhDfD5m47qVSNf9E8RpSUwCS/Og+apudasWYUMAQAlySRcVNsWgYYZdhiTnwEalhW8FhXvXq/rFiNCXWPsD2sArsY//tSxOiADOiLZ6wwZ4FLF+ylhg2ge2IpWAQSBKmLjEYmEwmMrsSNThJSkXG9RNvY/OmsRK6ISKzwe8rgOBgF79B0sGCjujBVVULBgWIpa4BFUmxQi8GzhkNnrDFKMw2BBW53Ylp0tAiBARDjYAFnUDyiHAg9pBbhvW/EagACLACCASlcGoD0ch9kHWAXKySwvI745CwXrS2cS6m5+D70G+R/qxmICGVUb0BEQESt4PEcBuLuqeJGJE40yIMgx5hppIAdhwWC9zFGUszwhArwUGn/+1LE6YANWNllTDBJwWMbLSj1jWBUudzVyG1CNVzyxuRNu9mSpO2woGAT08woK5PXJgcdD92zdR7iSr/dqaRfeKY6DBIGBlf1qGuRuKwQ1VHKd82M8pwzmzKczr/tIkOs1dQ8XZXaZn+U/TUu59JN+/EQ9DrTueKVd8i1eioAgAwAAADUTYfB7vsyeV5SY8bdGJurSw2xUpANKr9SY9zai2CPX+vf1EJYGGdSaxhEFOcrr6YJxSEHRNDMmhbwpIeKmdguHGHhw5UerMFy7OzdoP/7UsTlgIrUX2dHsQcBiw1sqYYM8JmwLfu/UAgkIiQSSlLlgRYz5ukzGWp2LiZa3d/3kjqy8JSvWApZMRacvonjELj+XWga9EX9ECgRgh7sSdJcRkxu4ofMt4ZjF6w/pEycSMQ5vcjM/LZPPLK4Md8s+eX2Qh6yMR3wyCqCMN5m2oOuersqdDewIBNOdREHG6XVqOsZEaRfJRo0OJuaKWc8aW4IF6fj/ep3+7BGbluNQchzSHmcbLfvsqD/TTyz3wTFDk2gDa1yaUb2JbV75aMH//tSxOaAC2xhaaewZ4GHqC609gz0enxa4g2jVFub0AAEgAAvo4AZ74N8pkusUErxyW4uRIpUQgh4DxWujNBgTJSfbIGGDJM78jFUxJOrfcOgwIjfcl9HjuV1GgYU9M/tspEkPz6anJmX08zbd5Fv5eeCARSlbzR6tCGJcQS02ds9VRKFYAJSTlR6ElO29rYZ9WxOB5JU2mJACQcJjq8KBZQP/JYvl0x5vUSI7nxgYQZ+L8MmI83kNEkW3nahbfz96ikQf2yI8uf86R/2ODMFncD/+1LE5YALFKtjjDBtAaqmbPWDDhCyVoup4QPZ7b1fYAARoAABKgcgkhqHmEg5BRET/bHTPGKuIdobEGDXRqC8NCpS0Mwe5MG17LTQ7kSO7z9+u+GnGgvcJMLCRJ9I0fmJ4k1suQSG5BbLmZR1PWly1vQz/L7aE/WqfYkudiKTZc4VEeRpLhgGHO6J6JDEJALY/hsSztcEMKI08rtuQLDvN1WUBGT/yoCoFeNObYYEzTUmOkOw+UUBoWs+uyHJRkZ3zzfa2mJq6PvjNZ26z/ld8//7UsThgAqcqWtHsGmBih7sJYSNqGE0VT3vd7v9EMNpxVl2AgAFPfk/wHZZGjWzMRDtTGgEAxPh/IR7EtPW2BGUIr1T8VGPXpHsjx0Ocakl+5+u/KzGo3FLKKAEyUBkQO1yT1TYcJS2Fz8Svb79P86wBvv9BXfVBIAMAAIBJLj1FZ4EWMmpJVFWTkIOBVgThcdEoGj+WB+kdxyg7rHlegS4cM5U8jNsj9lZuGfSMNk+MQAtlz2nzyniqF3NZYnA6lqti6sVXIieXQPcIlqnw3jp//tSxOOACzT3aUwka0FiDqyo9hmY/z2wIAgwgAAEpToChL6cKfDiMpaQx+VsiAOoVj3onFVI68HB+tjlMyTH+YRaPqJ3D6wcM2/cs3aak6d6xETMaIetpz0LKRrphCIjMhcjFlYXcvvgwwffvcxLjigiMRFRejsHW0haaclP0jnf6KKSTllA5pcH8fw/woRvEESiUekIroJZw/loEitB8dlRX21isQczM2hbupWY6tqwdrS03cyOU9/3Ul81OunZf/n95Q60on1oMpWacXDxd5v/+1LE6AAMvI9zrDBl6U0PbFmWGPBSRCR68RHkHPQKREokSkSZLy54ZpcyuF7u2nMp5209g8NRyBD7lM+YuJLiRBa4ABWMv85Cnx+rm37UX2bTnhgiBQLAxAqqpVuvipATggehgVeBRRAPCIQAsRPHDCLkBy5JQGBv+zVX96YIw0AACk7xWBlMJbxDCfibiVlEUI92xFUsH+7gJQCykrkuH67/gwWRFV6RS+YJj7mUWZ5RRxBd7yXoNw4Kg6TKlknG7mrk5uKDLpH5gUBVp8IsKv/7UsTpAAuYlWmsJGdRnJ8sdYYNKC6CGZPzKjjrnEFF08OtvDgIShphxBvK8MpyYypWVTZo5UGr8P9L4GI5pOvEpuVEvhHXLP8+Zm+WWMAOHUnnmj9EEnn5741QrLS+Ui/6SFSI1eJKWR8zprf9QpKNARzrSKfYTqO69VUQkhQACU76MJO57wuXAKS7nM5guFVplhNtYwRWbA91F7lHw/2HP/322bZAgW9iiiaqoctmriSyhQew84dMnuU583/VfOIDMvCBilupQeBpwompDQRK//tSxOUAC2T5c0ewR5F+ja01hhkYyNs+mkglcpWpP0it3USUklKrx9KBRF+lTgbDgVgfx0wGRisMUNsQ1LXqYbB59LfpJsTEesOn3mkWo44tQQjeEq7cZ5QomMekl18hajrpexJfFgAbGJR/5AO71QASEAAIJmQMH5t6XdYqw8hIjEz1mMXeaDEXqQxNT8svkM/bPakmEP1OZWxIqmpCnd6s2VcYlVR3b8nUGGQ957wpMzirb3/cAv3DsOZx9vfl9n2zMx+rvDSvQJLdyIzV+vf/+1LE5YALIKVnR6BugYOkrmT2DZ5//bzf1jQkZYe/gKDbjSVVB1EGmXE4jVV5hQjkBcosxk4OYiTFci96yDMmln3A6Jd0pjPhUGQkLoSmTzhU2IGPCj89DeH0t6ZFDDp79wrFRMpzOq+6s+utOcQKk63Uqky9oq1N/TqxfeQVABBDOHhkSiQXiwEUeSgNN+XaKi7EnZm8gaMLA6U7gvAphwL7MaZc4QpjJaB/thtimP/rdc5x9ent95vj4nfOgukaKrFQKcYG4s0BIbKU+rhUYv/7UsTmgAv012VMMG0BPpAuKPYMunQ+5QrIQqXo+pHpYgAAAACqkBECKY24GgqCmADNTwGTToMdh331qoKysZAZvelRMSEE5RuLLY6XxOy9JJhgzLq9LJ5YwX9ixGg1jwlOZT9VKB8qPXHtJajlFeKfMtJ3mf657HavhW3DpfMOJXf9c6trOM+tZYEl77xWFWv+f//8XzWDuYMnwGRCAJpOFWhQCkhEhzeoEQuUIA6BAIwehn//4DVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVV//tSxOyADWx9X0wxLMl7n25w8YquVVVVVVVVVVVVC1J4zMx1RJqAhoRB1QNPKnRKGoNQ74K+DX6zvVkoK1Pv//8q6DUO1uKu/3JMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+1LE5QALyH1v9PeAIlkha6cy8ACqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7UsS3g8V0GRRcMYAgAAA0gAAABKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq"
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
    // What has already been explained this session: a hint is said once.
    var told = {};

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
        Sound.clip("dive", 0.32, 0.62);                 // the wingbeat passing over
        return;
      }
      e.t += dt;
      if (e.ph === "shadow" && e.t >= T.eagleShadow) { e.ph = "wait"; e.t = 0; }
      else if (e.ph === "wait" && e.t >= T.eagleWait) {
        e.ph = "start"; e.t = 0;
        Sound.clip("dive", 0.7, 1.08);                  // the cry before the stoop
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
      Sound.clip("power", 0.8, 1.1);
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
          Sound.clip("chain", 0.85, 1 + Math.min(chain, 24) * 0.008);
        }

      } else if (PICKUP[it.type]) {
        power(it.type);
      } else {
        bite();
      }
    }

    // Say something once per session — a hint that repeats is noise.
    function tell(key, word, sub, kind, icon) {
      if (told[key]) return;
      told[key] = true;
      Notify.say(word, { sub: sub, kind: kind || "info", icon: icon || "sparkles" });
    }

    /* THE BIOMES' PICKUPS. Each is a MOMENT on the head (a callout, a sound, a
       burst), a ring around the head while it holds (see drawPowers), and —
       the first time — one line saying what it does. */
    function power(kind) {
      var x = headX, y = anchorY;
      if (kind === "fly") {
        magnetOn = true;
        Pop.show("bonus", { word: "Fireflies", sub: "Magnet", at: { x: x, y: y } });
        Fx.burst(x, y, { color: ["#f6ff9e", "#e9ff6e", "#ffffff"], count: 18, speed: 300, life: 0.5, size: 4 });
        Sound.clip("magnet", 0.7);
        tell("fly", "Magnet", "Fireflies pull gems to you until you are hit");
      } else if (kind === "idol") {
        idolOn = true;
        Pop.show("bonus", { word: "Idol", sub: "Double points", at: { x: x, y: y }, cls: "pop-egg" });
        Fx.burst(x, y, { color: ["#ffd43b", "#fff3b0", "#ffffff"], count: 20, speed: 340, life: 0.5, size: 5 });
        Sound.clip("idol", 0.75);
        tell("idol", "Double points", "The idol doubles every gem until you are hit", "gain", "star");
      } else if (kind === "amber") {
        Pop.show("bonus", { word: "Amber", sub: "Full length", at: { x: x, y: y } });
        Fx.ring(x, y, { from: 20, to: 220, color: "#ffb703", width: 6, life: 0.6 });
        // one block short of full: the last one, and the plates it pays for,
        // stay an egg's to earn (see grow)
        if (len < T.maxLen - 1) grow(T.maxLen - 1 - len);
        else { pick += 200; HUD.punch("#ffb703"); }
        tell("amber", "Full length", "Amber grows you back to full length, one egg from the shield", "gain", "sparkles");
      } else if (kind === "rainbow") {
        Pop.show("bonus", { word: "Rainbow egg", sub: "Shield", at: { x: x, y: y } });
        Sound.clip("rainbow", 0.7);
        if (!shield) armour();
        else { pick += 200; HUD.punch("#ffffff"); }
        tell("rainbow", "Shield", "A rainbow egg plates your scales at once", "gain", "check");
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
      if (magnetOn) Notify.say("Magnet lost", { kind: "loss", icon: "x" });
      if (idolOn) Notify.say("Double points lost", { kind: "loss", icon: "x" });
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
      Sound.clip("turn", 0.05, dir > 0 ? 1.07 : 0.93);
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
      // A biome's first round of the session says what its new danger is.
      if (BIO.intro) tell("biome-" + BIO.key, BIO.intro[0], BIO.intro[1], "warn", "warn");
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
        Pop.show("ribbon", { word: Math.round(dist) + " m", sub: "Deeper", at: popSpot() });
        Overlay.vignette(rgba(TIERS[tier].halo, 0.7), 1, 420);
        Sound.clip("chain", 0.6, 0.82);
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
      Sound.clip("death", 0.95, 0.92);
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
        Sound.clip("wilt", 0.55, 1.05);
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
          { label: "Longest body", value: bestLen + Lang.t(" blocks"), grade: "accent" },
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
    function drawFireflies(x, y, seed) {
      var i, t, s, fx, fy, a;
      for (i = 0; i < 5; i++) {
        s = seed * 7.3 + i * 2.39;
        t = runT * (0.85 + 0.12 * i);
        fx = x + Math.sin(t * 1.3 + s) * 30 + Math.sin(t * 3.7 + s * 2.1) * 14 + Math.sin(t * 11.3 + s * 3.7) * 3.5;
        fy = y + Math.sin(t * 1.1 + s * 1.7) * 24 + Math.sin(t * 4.3 + s * 0.6) * 12 + Math.sin(t * 13.1 + s * 5.3) * 3.5;
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

    /* The pickups that hold, as rings around the head: a power the player
       cannot see running is a power they do not trust. They last until the
       next hit rather than on a clock, so a ring is whole until it goes. */
    function drawPowers() {
      var r = headRadius() * HEAD_K * 1.25, list = [], i, w;
      if (magnetOn) list.push([1, "#e9ff6e"]);
      if (idolOn) list.push([1, "#ffd43b"]);
      ctx.lineCap = "round";
      for (i = 0; i < list.length; i++) {
        w = list[i];
        ctx.strokeStyle = rgba(w[1], 0.22); ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(headX, anchorY, r + i * 10, 0, TAU); ctx.stroke();
        ctx.strokeStyle = w[1];
        ctx.beginPath(); ctx.arc(headX, anchorY, r + i * 10, -Math.PI / 2, -Math.PI / 2 + TAU * w[0]); ctx.stroke();
      }
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
    var bsx = [], bsy = [], bang = [];

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
      if (invT > 0 && Math.floor(invT * 14) % 2) return;  // blink while immune
      // dying: the tail end has already been torn off, block by block, and the
      // last of it goes with the head
      if (dieT >= 0) { n -= crumbled; if (popped || n < 1) return; }
      poseBody(n);

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
      if (Enter.begin(headX, anchorY)) { drawBody(); drawHead(); Enter.end(); }
      if (dieT < 0) drawPowers();
      drawBolts();
      // the sky: over the burrow, the viper and everything on it
      if (dieT < 0) drawEagle();

      if (dieT >= 0) { ctx.restore(); drawDeathVeil(); }
    }

    function onResize() { metrics(); }

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

    return { reset: reset, update: update, render: render, onDown: onDown, onResize: onResize,
             levelProgress: levelProgress, levelWon: die, applyLevel: applyLevel };
  })();

