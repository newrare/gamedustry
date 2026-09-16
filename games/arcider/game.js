  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "ARCIDER",
    /* One sentence, and nothing else: the stage under it shows the finger
       pressing one side and the bike carving that way, so the line only has to
       name the gesture, the machine and the fuel. */
    tagline: "Lean your ship <b class=\"w-press\">left or right</b> to <b class=\"w-pass\">take places</b> and never break your <b class=\"w-shield\">shield</b>",
    gameSeconds: 0,                  // endless: the run ends when the cells do

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
    bg: "#05041a",

    layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 30 },

    /* The gesture is a HELD side, so the stage runs the motor's "hold" variant,
       re-dressed as the road. No caption — the tagline is the sentence and the
       stage is the demonstration. */
    intro: { logo: "logo", demo: "hold", caption: "" },

    // Desktop: SPACE starts and replays. Steering is held, not tapped, so the
    // game owns the LEFT/RIGHT keys itself (see section 6).
    keyboard: true,

    // Endless run: the speedometer takes the clock's slot in the HUD.
    hud: { score: true, timer: false },

    /* ONE TRACK, SIX BEDS. The bed is three minutes long and a round plays a
       STRETCH of it rather than all of it — one per biome, named next to that
       biome's palette in `ladder.biomes[].music` and handed to Music.play by
       reset(), so the climb changes music with the weather instead of looping
       the same thirty seconds for thirty levels. `menu` is the other end of
       it: the track's own quiet opening, pitched down by its playback rate and
       at half the level, under the menu, the map and the panels (the web
       target's screens — a playable has none of them).
       See docs/ENGINE.md, `Music`. */
    music: {
      volume: 0.11, fade: 1.8,
      menu: { from: 0, length: 40, rate: 0.85, gain: 0.5 }
    },

    // All user-facing copy in one place.
    copy: {
      start:      "TAP TO RACE",
      ctaBar:     "INSTALL NOW",
      ctaEnd:     "PLAY THE FULL GAME",
      replay:     "Race again",
      scoreLabel: "SCORE",
      timeLabel:  "TIME",
      endScore:   "FINAL SCORE",
      gameOver:   "SHIELD DOWN",
      timeUp:     "TIME'S UP!"
    },

    /* ---- ARCIDER tunables -------------------------------------------------
       Read by the Game module (section 6). Positions across the road are design
       px from its centre line; distances along it are PROGRESS px — the
       coordinate the camera rides. */
    play: {
      // --- the road -------------------------------------------------------
      // The tarmac is a curve, not a corridor: its centre line is two sines of
      // the progress, so the road sweeps left and right under a craft that only
      // ever moves sideways. Nothing is clamped any more — the chase camera
      // rides behind the craft, so a bend is free to run as wide as it likes
      // and simply slides the vanishing point across the skyline.
      // `hillAmp` is the third sine, the road's ELEVATION: it is what makes the
      // horizon breathe and a crest swallow the road behind it.
      halfBase:   285,     // half width of the tarmac at the start of the run
      halfShrink:  60,     // ...how much of it the run takes back
      halfWave:    27,     // slow breathing of the width
      bendLong:   170,     // amplitude of the long sweeping bend (design px)
      bendShort:   54,     // and of the kink layered on top of it
      bendKLong:  0.00095, // radians of bend phase per progress px
      bendKShort: 0.00260,
      widthK:     0.00082,
      hillAmp:     78,     // how far the road climbs and drops (design px)
      hillK:    0.00062,   // ...and how long one of those swells is
      tyre:        26,     // half the craft's footprint: what "on the road" means
      offSpan:    100,     // px past the edge where the penalty is at its worst

      // --- the chase camera ------------------------------------------------
      // The whole picture is one pinhole projection: a point `camZ` progress px
      // ahead of the camera draws at scale 1, the horizon draws at scale 0.
      // Widening `camZ` is the only thing that changes how deep the road looks.
      horizon:   0.30,     // fraction of Layout.h under Layout.top: the skyline
      anchor:     212,     // px above Layout.bottom: the craft's row on screen
      camZ:       260,     // progress px from the camera to the craft (scale 1)
      zNear:      118,     // nearest slice of road drawn...
      zFar:      1980,     // ...and the furthest the LADDER of even rows reaches
      /* THE ROAD IS DRAWN FURTHER THAN THE LADDER IS EVEN. Past zFar a row
         every 44 progress px buys a fraction of a pixel, so the step grows by
         `roadGrow` out to `zRoad` — ten more rows, all of them SAMPLED off the
         real curve like every other row. Nothing here is extrapolated: what
         the player sees up by the city is the road they will be on. The gap
         that is left between the last row and the vanishing point is not
         filled, it is COVERED — the painting is laid on that row (see
         `skyBase`), so the tarmac meets the city instead of reaching for a
         horizon no finite amount of road can touch. */
      /* HOW FAR THE ROAD IS WORTH DRAWING, and it is not a matter of cost.
         A band's sideways travel against its height is z/3400 in this road's
         own numbers (its bend is 170 px over 1050 progress px, the projection
         gains span*camZ/z² a row) — so past ~3400 the tarmac is seen more
         edge-on than end-on, every band is wider than it is tall, and eleven
         of them stacked draw a dark slab lying across the distance rather than
         a road going into it. NO step size fixes that: the ratio is z alone.
         So the road stops where it still reads as a road, and the painting is
         laid on that row (see `skyBase`) instead of the road being stretched
         to reach the painting. `roadGrow` then only has to keep the rows
         monotone — a gap of ~400 progress px against a swell 10 000 px long
         leaves the perspective well ahead of the climb. */
      zRoad:     3600,
      roadGrow:  1.13,
      seg:         44,     // progress px per road band: the stripes that scroll
      camEase:    6.2,     // how fast the camera swings back behind the craft
      camLead:     52,     // px the craft slides across the frame at full lean
      fovKick:   0.075,    // how far the field of view opens up at full speed

      rumble:      26,     // world width of the neon kerb on each side

      // --- the painted horizon ---------------------------------------------
      // The backdrop slides on two things, because the camera hides one of
      // them: the vanishing point IS the heading, but it barely travels — the
      // chase camera eases back behind the craft, so a bend moves the road and
      // leaves the far row near the middle of the frame. `skyShift` is the
      // other half and the one the player feels: leaning right walks the whole
      // city left, at a third of the speed the road does it. The stars over it
      // ride at 0.16 and the road at 1, so the picture sitting between them is
      // what turns a lean into depth instead of a wall sliding sideways.
      skyPara:   0.62,     // share of the vanishing point's travel
      skyShift:  0.34,     // px of backdrop per px the camera moves across

      // --- the fork --------------------------------------------------------
      // Every so often the tarmac splits in two around a wedge of gravel and
      // the player has to commit to a line: one branch is paved with cells,
      // the other with boosters. Both merge back into the same road.
      forkSep:    322,     // world px each branch sits off the centre line
                           // (scaled with the tarmac, so the gravel wedge
                           // between two branches stays the same share of it)
      forkNarrow: 0.42,    // share of its width a branch gives up while split
      forkFade:   520,     // progress the split takes to open (and to close)
      forkLen:   2400,     // progress from the mouth of a fork to its merge
      forkEvery: 2600,     // progress from one merge to the next split
      forkFirst: 2400,     // ...and to the very first one of a run
      forkCells:  230,     // progress between two cells on the charge branch
      forkPads:     3,     // boosters laid down the speed branch
      forkBombs:    2,     // ...and the mines that guard them, because the
                           // fast line has to be the dangerous one too

      // --- the craft ------------------------------------------------------
      steer:      720,     // px/s sideways at full lean and full speed
      leanEase:   9.0,     // how fast the lean follows the finger
      leanMax:    0.34,    // radians the craft rolls at full lean
      deadZone:    44,     // px around the centre that steers neither way
      airSteer:   0.42,    // steering authority while airborne
      trailStep:  0.024,   // seconds between two thrust-wash samples

      // --- pace -----------------------------------------------------------
      speedMin:   470,
      speedMax:  1020,     // top speed of the ramp; a booster goes past it
      ramp:        34,     // seconds to the top speed
      offDrag:    0.73,    // share of the speed the gravel takes. Leaving the
                           // tarmac has to be the worst thing a pilot can do
                           // to their own lap: at 0.46 the shoulder was a
                           // shortcut through a wall of blockers, and now it
                           // costs three quarters of the pace
      boostGain:  0.72,    // extra speed while a booster burns. This number
                           // IS the climb: at a plain cruise the player reels
                           // the back-markers in and nobody else, and a
                           // booster is the only thing that passes the front
      /* THE SPEEDOMETER IS A FANTASY DIAL, and deliberately so. The world is
         measured in `pxPerM`, so the craft's 1020 px/s at the top of its ramp
         is 92 km/h on the game's own scale — a number that says "scooter"
         under a machine the rest of the frame draws as a blur. The readout is
         scaled to what the SCREEN says instead: a full cruise reads about
         500 km/h, a booster takes it past 850 and the gravel drops it like a
         stone, which is the whole reason it is on screen — it is the one place
         the pace is a figure and not a feeling. The distance, the objective and
         the score are still the honest metres; this dial is the only thing in
         the game that exaggerates, and it exaggerates in the direction the
         picture already goes.

         A fixed factor and not a per-level one, so the number MEANS something
         across the climb: the ladder lerps `speedMax` from 820 to 1200, and a
         dial rescaled per level would read 500 at the foot and 500 at the top
         of a road that is half as fast again. Level 1 cruises at 400 and level
         30 at 590 because that is what they do. */
      kmhPerPx:   0.49,    // km/h per progress px/s: 1020 px/s -> 500 km/h
      kmhEase:      10,    // 1/s the figure chases the real speed. Eased, or
                           // three digits flicker at 60 fps and nothing is read
      boostTime:  3.0,     // seconds a booster lasts
      crashSlow:  0.55,    // seconds of crawling out of a crash
      gripEase:   4.2,     // how fast the speed multiplier follows its target

      // --- the jump -------------------------------------------------------
      airTime:    0.95,    // seconds of air off a ramp
      airLift:     92,     // px the sprite rises at the top of the arc
      airPts:     0.55,    // score per metre flown

      /* --- the shield: the only thing that ends the run --------------------
         It is NOT fuel. Nothing takes it off for going fast, or for going at
         all — it only ever comes off on CONTACT, and the only place it goes
         back on is the charge branch of a fork. That single rule is what turns
         a fork into a decision: charge is on one branch and speed is on the
         other, and the race only asks for one of them at a time. */
      shieldMax:   100,
      shieldStart: 100,    // full: every point lost after this was a mistake
      cellPower:    11,    // % a charge cell gives back. A charge branch is
                           // still most of a repair, but it takes the whole
                           // branch to get there — one cell picked up on the
                           // way past is a top-up and not an undo
      rivalCost:    16,    // % clipping another pilot costs
      bombCost:     24,    // % a mine costs: four of them and the run is over
      crashCost:    34,    // % a barrier costs
      roughCost:    12,    // % a landing off the tarmac costs
      lowAt:        35,    // % the craft starts smoking and the frame shaking
      warnEvery:   1.7,    // seconds between two low-shield chirps
      invTime:    0.85,    // grace after any hit, so one mine is one hit

      /* --- THE BLAST. A mine does not only bill the shield: it MOVES the craft.
         The hit hands the hull a lateral velocity pointing away from the mine
         plus a roll on top of it, so the player is thrown off their line and
         has to fight back onto it. The kick bleeds off on `kickDrag` and it is
         still leashed to the road, so the worst it can do is put the craft in
         the gravel — which is exactly the cost that makes a mine frightening. */
      bombKick:    720,    // px/s sideways the blast throws the craft. With
                           // `kickDrag` that is about 240 px of travel, i.e.
                           // dead centre to the kerb on a 285 px half-road: a
                           // throw the player MUST answer, and not an automatic
                           // trip through the gravel on top of the 24% already
                           // billed for the hit
      bombRoll:    1.1,    // extra roll the blast puts through the hull
      kickDrag:    3.0,    // how fast the kick bleeds off (1/s, exponential)

      /* --- A BARRIER BREAKS. The one hit in the game that meets something
         SOLID, so the thing itself has to come apart: the blocker is deleted on
         contact and replaced by a spray of its own hazard tape. The shards live
         in world coordinates like everything else out here, so they rush the
         lens at the same rate the road does instead of floating in screen
         space. */
      shardN:       18,    // shards one barrier breaks into
      shardLife:  0.85,    // seconds one lives
      shardGrav:  2100,    // world px/s2 pulling them back onto the tarmac

      /* --- the race: twenty pilots, and the board is the real clock --------
         The rivals ARE the ranking — there is no abstract score behind them.
         Each cruises at its own share of the base speed, from `paceLow` at the
         back of the pack to `paceHigh` at the front, so a plain cruise reels
         the stragglers in slowly and only a booster really climbs the board.
         The cuts are walls across the run: be inside the rank when one lands
         or the race is over, whatever the shield says. */
      pilots:       20,    // including the player, who starts last
      /* THE GRID IS LAID OUT BY WHEN EACH PILOT IS CAUGHT, not by a gap.
         A fixed gap between craft puts the whole field inside the first
         seconds of the race — nineteen pilots at 300 progress px apart span
         140 m of a 440 m race, so the player reeled in the lot before the
         first gate and then drove alone. What a race has to deliver is an
         overtake every so often, all the way to the flag.

         So a pilot's place on the grid is DERIVED. The player closes on a
         pilot at `(1 - pace)` of the base speed, so putting it `f * R *
         (1 - pace)` metres up the road — R being the race, `f` the share of it
         that should be driven before the pass — has it caught at exactly `f`.
         All the schedule has to decide is the `f` of each of the nineteen.

         AND IT IS DEALT PER SECTION. The cuts already cut the race into
         stretches, so the field is dealt into those stretches rather than
         ramped from the line to the flag: each one gets its share of the
         pilots, spread strictly inside it and never on a gate line, where a
         place counted a metre either way would decide a run. No section can
         then be a lonely cruise, and none of them a wall of traffic — which a
         single ramp could not promise, because the gates are not the same
         distance apart at every level.

         THE LAST SECTION ALWAYS GETS `lastFoes`, and that is the point of the
         whole shape: between the last checkpoint and the flag there are two
         pilots left to take, and they are the race. A run-in with nobody in it
         is a cruise to a result that was settled several hundred metres back —
         which is what a boosted run used to arrive at, having passed the whole
         field by four fifths of the way.

         One of the two is caught halfway down it, which puts a boost-free
         drive second at the flag. The other is scheduled just PAST the flag:
         the leader is not caught by driving well, only by driving faster, and
         a single booster in the run-in is worth far more than the 4% of the
         race it stands beyond it. That is where the win — and the third star
         with it — actually lives, and reaching the finish is never what is at
         stake there, because the flag eliminates nobody (see checkCut).

         A side effect worth knowing: the fastest pilots do NOT start furthest
         up the road, because a pilot the player barely out-paces cannot be far
         ahead and still be caught. The grid order is therefore not the pace
         order, and it corrects itself over the first few seconds as the quick
         ones pull away. The rank the HUD shows counts positions, so nothing
         downstream cares. */
      passFirst:  0.10,    // share of the race driven before the FIRST overtake:
                           // a craft leaves the line at `speedMin` and traffic
                           // met before it is up to speed is a contact, not a
                           // pass
      lastFoes:      2,    // pilots left to pass in the final section...
      lastPass: [0.55, 1.04], // ...and where in it the schedule catches them.
                           // The second is OVER 1 on purpose: the schedule is
                           // worked out for a craft that never boosts, and the
                           // leader of a race is not something a clean cruise
                           // is owed
      lastSpread: 0.35,    // the share of `rivalSpread` that final pair carries.
                           // The ending of a race may not be rolled before the
                           // start: a photo finish jittered by 14% of the race
                           // is a flag crossed 400 m early or never reached
      rivalSpread:0.14,    // jitter on a pilot's place, as a share of it
      paceLow:   0.745,    // pace of the last rival, as a share of base speed
      paceHigh:  0.925,    // ...and of the leader, who very nearly matches it.
                           // Nothing here is above 1: a rival is never faster
                           // than a clean cruise, so the board always moves
                           // when the player drives and never when they do not
      rivalHalf:    64,    // half a rival's hit width...
      rivalLong:    54,    // ...and half its hit length
      /* CONTACT IS A REPULSION. Two hulls at speed cannot occupy the same lane,
         so a clip throws BOTH of them: the craft one way and the pilot it hit
         the other, along the line between them. It reads as a shoulder-charge
         instead of a number ticking down, and it also guarantees the pair are
         apart on the next frame rather than grinding along each other. */
      /* THE PACK DRIVES THE ROAD TOO. A pilot is not on rails: it reads the
         same mines and the same barriers the player does and steers around
         them. It is a repulsion field rather than a plan — every hazard within
         `seeAhead` pushes sideways, harder the nearer it is and the more
         squarely it sits on the pilot's line — and the sum of those pushes
         finds the gap in a wall on its own, without anybody having to look for
         one. What it cannot do is find a gap that is not there: a pilot boxed
         in by a solid wall drives straight through it and takes it apart. */
      seeAhead:    780,    // progress px a pilot reads up the road
      seeSide:     165,    // lateral px inside which a hazard concerns it
      dodgeMax:    210,    // px it will ever steer off its own line
      dodgeEase:   3.6,    // how fast it slides onto the line it wants
      dodgeUrge:  1.25,    // how hard a hazard dead ahead pushes, as a share of
                           // `dodgeMax`. Over 1 so a single mine is dodged
                           // outright instead of clipped
      wallKnock:    90,    // progress px smashing a barrier costs a pilot: the
                           // pack pays for its mistakes in places, like the
                           // player pays for theirs in shield
      rivalKick:   560,    // px/s sideways the contact throws the craft...
      rivalShove:  460,    // ...and the other pilot, the opposite way
      pushRelax:   1.4,    // how fast a shoved pilot drifts back onto its own
                           // line once the shove is spent (1/s, exponential)
      pushMax:     260,    // px a pilot can ever be shoved off that line

      /* --- THE FIVE TEMPERAMENTS -------------------------------------------
         A PILOT'S LIVERY IS ITS BEHAVIOUR, and that is the whole contract: the
         player reads the colour of the craft in front of them and knows what
         it is going to do about them, before it is close enough to matter.
         Nineteen identical rivals wandering on a sine were nineteen moving
         barriers; five kinds, each recognisable at a glance, turn the pack
         into something to read.

           GREEN  · SCOUT   — gets out of the way. It steers AWAY from the
                              craft, so the back of the field is a road that
                              opens as it is driven at.
           BLUE   · DRONE   — a straight line and nothing else: no wander, no
                              dodge, no reaction. It holds its lane through the
                              mines and takes the barriers apart on the way.
           YELLOW · STALKER — slow, and steering into the craft. Reeled in
                              early and awkward to pass cleanly: that is the
                              whole trade it offers.
           RED    · MARSHAL — takes the craft's own pace and boxes its line. It
                              never closes the last `foeHold` px — the contact
                              is the PLAYER's to make or to avoid — so the only
                              thing that gets past it is a booster.
           VIOLET · RAM     — comes for the craft and means it. Hardest hunter
                              in the game, and its contact costs the most.

         `hunt` is a share of `foeMax`, negative to run away; `wander` scales
         the lane the pilot drives on its own; `dodge` is whether it reads the
         road at all; `pace` multiplies its share of the base speed AT SEED
         TIME, so the grid still hands its pass over on schedule (seedRivals).
         `kick` and `cost` are what a contact with it is worth.

         WHICH of them are on the grid is the level's business and not this
         table's — see `ladder.foeMix`. */
      foes: [
        { name: "SCOUT",   art: "ship11", col: ["#5cffb0", "#0b5c3c"],
          hunt: -0.80, wander: 1.00, dodge: 1, pace: 1.00, kick: 1.00, cost: 1.00 },
        { name: "DRONE",   art: "ship15", col: ["#57d2ff", "#0e4a6e"],
          hunt:  0.00, wander: 0.00, dodge: 0, pace: 1.00, kick: 1.00, cost: 1.00 },
        { name: "STALKER", art: "ship07", col: ["#ffd43b", "#6b4a06"],
          hunt:  0.70, wander: 0.35, dodge: 1, pace: 0.70, kick: 0.85, cost: 0.85 },
        { name: "MARSHAL", art: "ship06", col: ["#ff6b6b", "#6e1414"], hold: 1, match: 1,
          hunt:  0.95, wander: 0.25, dodge: 1, pace: 1.00, kick: 1.00, cost: 1.00 },
        { name: "RAM",     art: "ship05", col: ["#8b5cf6", "#1a0b3e"],
          hunt:  1.00, wander: 0.15, dodge: 1, pace: 1.03, kick: 1.70, cost: 1.30 }
      ],
      /* THE HULLS ARE PAINTED. `assets/image/master/arcider-object-ship.png` is one
         sheet of twenty craft seen FROM BEHIND — the only angle this game ever
         shows — cut on a 5x4 grid with six of them adopted, so a livery is a
         file and not eighty lines of path (see `art` above and `playerArt`
         here, and drawShip in section 6). The drawn hulls are still in the
         file and they are still the fallback: a build with no artwork degrades
         to exactly the craft it used to draw. */
      playerArt: "ship01",
      shipW:       210,    // design px across the painted hull, fins included.
                           // Wider than the drawn one was: the painted craft is a
                           // flatter silhouette, so the same presence on screen
                           // takes more width and less height
      rivalW:      190,    // ...and for a rival, which is read at a distance
      foeSee:     1400,    // progress px inside which a pilot reacts to the
                           // craft at all. Beyond it every kind drives its own
                           // line, so the pack still spreads out on the grid
                           // and a hunt reads as a hunt when it starts
      foeMax:      240,    // px a hunter will ever steer off its own line for
                           // the craft. Its `hunt` above is a share of this
      foeEase:     2.4,    // how fast it slides onto that line. Slower than the
                           // hazard dodge on purpose: a pilot answering the
                           // PLAYER has to read as intent, and a snap reads as
                           // a magnet
      foeHold:     136,    // px the MARSHAL refuses to come closer than. Well
                           // over `rivalHalf`, so its own steering can never be
                           // what causes the contact — only the player's can
      foeMatch:   1.00,    // the pace a marshal takes up while it is ahead of
                           // the craft and inside `foeSee`, as a share of the
                           // base speed. Capped at a plain cruise: it cannot be
                           // out-driven, only out-boosted
      rivalPts:     60,    // score for taking a place
      cutWarn:      90,    // metres out the HUD starts counting a cut down
      /* metres, and the rank the run has to be inside — each one five overtakes
         on from the last. THE GATES COME FIRST and the grid follows them: they
         cut the race into the sections the field is dealt into (see
         `lastFoes`), so a gate asking for five places is always driven at with
         more than five already handed over, and that surplus is what makes a
         mistake or a bad fork survivable. The last entry is the FLAG: its
         `rank` is the place worth taking and not a wall, because nothing is
         eliminated there. These four are the twenty-pilot field the playable
         runs; the web target builds its own per level, over sections that
         shrink into the run-in (see `cutsFor`, section 6). */
      cuts: [
        { at: 420, rank: 15 },
        { at: 675, rank: 10 },
        { at: 905, rank:  5 },
        { at: 1020, rank: 1 }        // the flag: the place to take, not a cut
      ],

      /* --- the gates -------------------------------------------------------
         NOTHING STANDS ABOVE THE ROAD. Every cut is a mark on the tarmac and
         only that: a coloured line for the checkpoints, the gold chequers for
         the finish. The finish used to be a real arch — two lit pylons outside
         the kerbs and a banner slung between them — and it was furniture the
         road cannot carry: a pair of columns growing out of the horizon reads
         as a thing to AVOID rather than a line to cross, and the banner hung
         in the sky over a race the player is steering through. The chequered
         band under the craft says "finish" on its own, in the one place the
         eye already is.

         What the arch was there to say is said in the corner instead — the
         rank pill counts the gate down in metres and turns red the moment the
         place is not good enough — and again by the vignette and the chime at
         `cutWarn`. */
      gateFrom:  3600,     // progress out from the camera a gate starts drawing
      gateOut:     46,     // world px outside the kerb the finish band reaches

      // --- distance & score ------------------------------------------------
      pxPerM:      40,     // progress px per displayed metre
      mileStep:   200,     // metres between milestone callouts
      milePts:    100,
      // Places are the run. Distance pays a trickle, a booster pays a little,
      // and taking a place off another pilot pays properly.
      cellPts:      5,     // score per charge cell, plus 2 per chain step
      boostPts:    25,

      // --- what comes down the road ---------------------------------------
      ahead:     2600,     // progress generated ahead of the camera
      diffFull:   520,     // metres to full difficulty
      slotFar:    900,     // progress between two slots at the start...
      slotNear:   620,     // ...and at full difficulty
      /* A single road carries NO charge at all — boosters, mines, barriers and
         the ramps that clear them, and nothing else. Every point of shield in
         the game is on the charge branch of a fork, which is the whole reason
         a fork is a decision and not a coin toss. */
      blockMin:   0.10,    // share of slots that are a blocker row, at the
      blockMax:   0.20,    // start of the run / at full difficulty
      rampChance: 0.20,    // a ramp (always followed by the wall it clears)
      boostChance:0.30,
      /* THE FIRST BIOME OPENS ON A RUN OF BOOSTERS — the road from the line to
         the first checkpoint, on the first six levels, and nowhere else. That
         stretch is where a player meets the craft, and it was the slowest road
         in the game: the slots are at their widest down there (`slotFar` lerps
         to 1300 px at level 1) and three in ten carried a pad, so the race
         opened on a long quiet cruise and the first thing it taught was that
         the machine is slow. It is paved instead — most slots a booster, laid
         closer together — so the craft is up to speed within seconds and the
         first gate arrives at a pace worth arriving at. A later biome, a later
         section and the playable all roll the shipped `boostChance`: this is
         the game teaching itself, not a difficulty knob. */
      openBoost:  0.80,    // share of slots carrying a booster over it...
      openGap:    0.55,    // ...and the share of the usual slot gap they sit on
      bombChance: 0.17,    // a scatter of mines
      bombMin:      2,     // mines in one scatter, at the start of the run...
      bombMax:      3,     // ...and at full difficulty
      bombStep:   150,     // progress between two mines of a scatter
      /* A MINE NEVER GUARDS A BOOSTER. A pad is the only thing on an open road
         that climbs the board, so a mine sitting on the way into one turns the
         reward into a toll: the player either gives the place up or pays 24%
         for it, and neither of those is a decision worth offering. This is the
         box of clear road a pad keeps around itself — a mine laid inside it is
         moved to the far side of the ribbon and dropped outright when the road
         is too narrow to hold both (see placeBomb), and a pad laid over a mine
         already down simply lifts it off (see placePad). */
      padClear:   240,     // progress px of clear road each side of a pad...
      padClearX:  115,     // ...and the lateral px, which is a craft and a half
      blockStep:   92,     // x spacing inside a wall of blockers
      wallFrom:   0.5,     // difficulty at which rows become walls with a gate
      gateWide:   235,     // the gate through a wall, at wallFrom...
      gateTight:  160,     // ...and at full difficulty
      rampHalf:   104,     // half width of a ramp
      rampWall:   360,     // progress from a ramp to the wall it jumps. Short
                           // enough that even the slowest run in the game is
                           // still airborne when it gets there

      rampSolid: 0.55,     // share of ramp walls with NO gate at all: the jump
                           // is the only way through, which is what a ramp is for
      rampStep:    66,     // x spacing inside THAT wall. Tighter than blockStep
                           // on purpose: at 92 the hitboxes leave a pinhole
                           // between two blockers and the wall is not a wall
      rampGate:    88,     // half the escape gate, when the wall keeps one

      /* --- THE SHIELD RAIL down the left flank of the frame ----------------
         Built like the spin rail in games/spinshock — smoked glass the road
         reads straight through, cells filled from the bottom, an arc and a
         chevron at the value — because the number this game is played on is
         the one the HUD pill is too small to make felt: cyan at full, cooling
         through gold to red as the hull comes apart, so a run going bad turns
         the left edge of the frame red.

         The right flank used to carry a second rail, a ladder of the whole
         field with the player's marker sliding up it. It is gone: the place
         and the cut it has to be inside are already on the rank pill, the
         cut's own line on the tarmac is green or red under the craft, and a
         nineteen-cell ladder down the edge of a race the player is steering
         through was a second thing to read at 400 km/h and never the one they
         read. The road got its right-hand side back. */
      railW:        30,    // width of the rail
      railGap:       4,    // air between it and the frame's side margin
      railSegs:     20,    // cells in the shield rail (one per 5%)
      railPad:       3,    // air between two cells
      railInset:    10     // air under Layout.top and above Layout.bottom
    },

    /* ---- THE LADDER — what makes one level not another ------------------
       The web target's thirty levels are a LERP over the knobs above
       (`web.levels.tune` in the manifest), and a lerp can only ever say
       "harder". These two tables are the other half: what a level LOOKS like
       and what shape of road it is. Read by `applyLevel` (section 6), which
       the level layer calls before every round; the playable never calls it
       and therefore never sees any of this. */
    ladder: {
      /* FIVE BIOMES, one per stretch of the climb — six levels apiece.
         `sky` names the painted horizon out of `assets/image/master/`
         (`arcider-sky-night.png` -> `CONFIG.art.skyNight` -> `ArtImages`), and
         the rest is the palette the canvas is painted with UNDER it: the
         plain, the two tarmac tones, the kerbs and the grid. A biome is
         therefore one whole look and not a picture swapped behind the same
         road — a blue daylight sky over a violet dusk tarmac reads as a bug.

         `music` is the stretch of CONFIG.music's track this biome rides —
         seconds into the file, and how many of them loop — so the five of them
         walk up the same three-minute bed as the climb walks up the map. Only
         the levelled build reads it: the playable embeds a short cut of that
         same track and plays the whole of what it ships (see reset()).

         `grad` and `sun` only ever show in a build with no artwork; they are
         kept in step all the same, because that build is the one a designer
         opens when the art is being redone. */
      biomes: [
        {
          name: "DUSK", sky: "skySunset",
          music: { from: 12, length: 36 },
          grad:  ["#07051c", "#1d1055", "#5c1e77", "#ff5f9e"],
          plain: ["#2a1550", "#0d0a2c", "#05041a"],
          sun:   ["#fff3c4", "#ffb347", "#ff2e83"],
          road:  ["#211c59", "#2b2470", "#181442"],
          kerb:  ["#35e8ff", "#8a5cff"],
          grid:  "rgba(53,232,255,.11)",
          weld:  "rgba(255,95,158,.30)",
          stars: 1,
          dark:  [27, 16, 70]
        },
        {
          name: "DAY", sky: "skyDay",
          music: { from: 48, length: 28 },
          grad:  ["#0a4fb4", "#1d86e0", "#63c4f2", "#cdeeff"],
          plain: ["#2f5aa0", "#0d2049", "#050f26"],
          sun:   ["#ffffff", "#dff2ff", "#8fd4ff"],
          road:  ["#1e3570", "#2a478f", "#16264f"],
          kerb:  ["#ffd34d", "#ff5fa8"],
          grid:  "rgba(255,255,255,.13)",
          weld:  "rgba(205,238,255,.30)",
          stars: 0,
          dark:  [40, 70, 110]
        },
        {
          /* MORNING MIST. The one biome whose road is PALE — a warm lilac the
             mist has bleached instead of the dark tarmac every other one
             lays — because the picture is a cool sky over an apricot horizon
             with the city dissolved in white, and a near-black road under it
             reads as a different scene rather than the same weather. The
             kerbs go apricot and pale cyan for the same reason: the two
             colours the sky itself is made of. */
          name: "MIST", sky: "skyHaze",
          music: { from: 76, length: 36 },
          grad:  ["#8fa8e0", "#b6c2ea", "#e6cdc0", "#ffd9a8"],
          plain: ["#9aa2c4", "#4e5478", "#232741"],
          sun:   ["#fff6e2", "#ffd9a8", "#e8a9a0"],
          road:  ["#5a5470", "#6b6489", "#464059"],
          kerb:  ["#ff9e5c", "#7ad7ff"],
          grid:  "rgba(255,226,205,.15)",
          weld:  "rgba(255,217,168,.26)",
          stars: 0,
          dark:  [154, 162, 196]
        },
        {
          name: "OVERCAST", sky: "skyCloud",
          music: { from: 112, length: 36 },
          grad:  ["#1f7ad8", "#4fa2ea", "#9ed4f5", "#e2f2ff"],
          plain: ["#5e8ca0", "#1b3b4c", "#07141c"],
          sun:   ["#ffffff", "#eaf6ff", "#a8d8f5"],
          road:  ["#33525e", "#43697a", "#26414c"],
          kerb:  ["#ff7a2d", "#35ffd0"],
          grid:  "rgba(255,255,255,.12)",
          weld:  "rgba(226,242,255,.28)",
          stars: 0,
          dark:  [94, 140, 160]
        },
        {
          name: "NIGHT", sky: "skyNight",
          music: { from: 142, length: 36 },
          grad:  ["#030312", "#0b0836", "#1d1360", "#4a2a8c"],
          plain: ["#241452", "#0a0726", "#030210"],
          sun:   ["#e8f4ff", "#9ec8ff", "#4a6ecc"],
          road:  ["#1a1748", "#252060", "#120f33"],
          kerb:  ["#35e8ff", "#ff2df0"],
          grid:  "rgba(140,90,255,.13)",
          weld:  "rgba(122,77,255,.30)",
          stars: 1.5,
          dark:  [24, 14, 60]
        }
      ],
      // Which biome each stretch of the climb wears: six levels apiece, and a
      // new one every time the map turns a band.
      biomeFrom: [1, 7, 13, 19, 25],

      /* THIRTY TRACES, one per level, and they are FIXED: the four phases of
         the road's four sines are read off this table instead of being rolled
         at every reset, so level 12 is the same road every time it is opened
         and a different road from level 11. That is the whole point — a ladder
         of thirty randomly generated roads is one road played thirty times.

         Each row is  [phLong, phShort, phWidth, phHill, wLong, wShort, wHill, wFreq]:
         the four phases in radians, then four WEIGHTS, 0..1-ish, which say what
         KIND of road this is — a long sweeper, a slalom, a rollercoaster. The
         weights are scaled by the level's own `d` in `applyLevel`, so the
         table carries the character and the climb carries the severity: the
         slalom at level 12 and the slalom at level 30 are the same road,
         driven at different amplitudes.

         The playable, and the endless bonus run, use none of this and roll
         their phases the way they always did. */
      road: [
        [3.88, 0.41, 0.33, 4.29, 0.10, 0.06, 0.12, 0.60],  //  1  straight run
        [1.48, 5.15, 2.73, 1.43, 0.90, 0.08, 0.23, 0.58],  //  2  long sweeper
        [5.36, 3.61, 5.12, 4.84, 0.28, 0.13, 0.81, 0.74],  //  3  rolling crests
        [2.97, 2.07, 1.24, 1.98, 0.11, 0.06, 0.13, 0.64],  //  4  straight run
        [0.57, 0.53, 3.64, 5.39, 0.22, 0.79, 0.20, 1.33],  //  5  tight kinks
        [4.45, 5.27, 6.04, 2.53, 0.63, 0.29, 0.43, 0.67],  //  6  wide S
        [2.05, 3.73, 2.16, 5.94, 0.92, 0.09, 0.24, 0.59],  //  7  long sweeper
        [5.93, 2.19, 4.56, 3.07, 0.28, 0.13, 0.82, 0.74],  //  8  rolling crests
        [3.53, 0.65, 0.68, 0.21, 0.46, 0.46, 0.98, 1.23],  //  9  rollercoaster
        [1.13, 5.39, 3.08, 3.62, 0.23, 0.82, 0.21, 1.39],  // 10  tight kinks
        [5.01, 3.85, 5.47, 0.76, 0.61, 0.28, 0.42, 0.65],  // 11  wide S
        [2.62, 2.31, 1.59, 4.17, 0.38, 1.02, 0.38, 1.67],  // 12  slalom
        [0.22, 0.78, 3.99, 1.31, 0.29, 0.13, 0.85, 0.77],  // 13  rolling crests
        [4.10, 5.52, 0.11, 4.72, 0.74, 0.54, 0.69, 0.93],  // 14  big dipper
        [1.70, 3.98, 2.51, 1.85, 0.48, 0.48, 1.01, 1.28],  // 15  rollercoaster
        [5.58, 2.44, 4.91, 5.27, 0.78, 0.07, 0.20, 0.51],  // 16  long sweeper
        [3.18, 0.90, 1.03, 2.40, 0.23, 0.84, 0.21, 1.42],  // 17  tight kinks
        [0.78, 5.64, 3.43, 5.82, 0.35, 0.95, 0.35, 1.56],  // 18  slalom
        [4.66, 4.10, 5.82, 2.95, 0.62, 0.28, 0.42, 0.66],  // 19  wide S
        [2.27, 2.56, 1.94, 0.09, 0.81, 0.59, 0.76, 1.03],  // 20  big dipper
        [6.15, 1.02, 4.34, 3.50, 0.42, 0.42, 0.89, 1.13],  // 21  rollercoaster
        [3.75, 5.76, 0.46, 0.64, 0.30, 0.14, 0.89, 0.81],  // 22  rolling crests
        [1.35, 4.22, 2.86, 4.05, 0.37, 0.99, 0.37, 1.62],  // 23  slalom
        [5.23, 2.68, 5.26, 1.18, 0.20, 0.74, 0.18, 1.24],  // 24  tight kinks
        [2.83, 1.14, 1.38, 4.60, 0.80, 0.59, 0.75, 1.02],  // 25  big dipper
        [0.43, 5.88, 3.78, 1.73, 0.65, 0.29, 0.44, 0.68],  // 26  wide S
        [4.31, 4.34, 6.17, 5.15, 0.34, 0.92, 0.34, 1.50],  // 27  slalom
        [1.92, 2.80, 2.29, 2.28, 0.48, 0.48, 1.02, 1.29],  // 28  rollercoaster
        [5.80, 1.27, 4.69, 5.70, 0.69, 0.51, 0.65, 0.88],  // 29  big dipper
        [3.40, 6.01, 0.81, 2.83, 0.36, 0.98, 0.36, 1.60]   // 30  slalom
      ],

      /* WHAT THE ROAD IS ALLOWED TO THROW, and the level each thing first
         appears on. The manifest's lerp already makes every hazard denser as
         the climb goes up; this is the other half of the same idea — a player
         meets ONE new object at a time, in an order, instead of the whole
         catalogue on level 1. Below its level a knob is forced to zero, above
         it the lerp owns it again. */
      unlock: {
        wall:  3,     // a row of blockers becomes a WALL with a gate in it
        bomb:  5,     // scatters of mines
        ramp:  9,     // ramps, and the wall they are there to clear
        solid: 13     // ...and a ramp wall with no gate at all: jump or stop
      },

      /* WHO IS IN THE FIELD, per level — the same idea as `unlock` above,
         applied to the pack instead of to the road. A share per temperament
         (`play.foes`) at the foot of the climb and at the top of it, plus the
         level each one first appears on, so a player meets one new BEHAVIOUR
         at a time exactly the way they meet one new hazard at a time.

         Level 1 is a field that gets out of the way and a field that drives in
         a straight line — a road to learn the steering on. The stalker arrives
         at 6, the marshal at 12, the ram at 18, and by the top of the ladder
         two craft in three are hunting.

         `solo` is the playable and the endless run, which have no level to
         read and therefore get the whole catalogue at once. */
      foeMix: {
        //      SCOUT DRONE STALK MARSH  RAM
        from: [ 0.60, 0.40, 0.00, 0.00, 0.00 ],
        to:   [ 0.12, 0.14, 0.24, 0.20, 0.30 ],
        solo: [ 0.24, 0.24, 0.20, 0.14, 0.18 ]
      },
      foeUnlock: [1, 1, 6, 12, 18]
    }
  };

  /* ===================================================================
     2. ASSETS — embedded base64 data URIs only (no network requests ever).
     Generate entries with tools/lab/embed-asset.mjs. Every graphic in this game —
     the road, the bike, the traffic — is drawn on canvas, so the only bytes
     here are the app icon and the audio.
     =================================================================== */
  var ASSETS = {
    images: {
      // arcider.png -> the app icon shown on the intro (460x460, PNG 256c).
      logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcwAAAHMCAMAAABvBWi0AAADAFBMVEUjpN5foOxcX/GaX+/tXW2gH2TkU+JlJaUmG5ziL6SeIaKfneYaI9PqoeojaZvVMHDgKt2jL+EXkK1VGjWg3vHi1fnuXadr0exlJ+kmKmZbI19bXp9VlawhV94STXIby9f8kIwRJCkHb3D6kFonHjFGETyTV64E/v7ZRrH+Pr793kqgWTL/N/8qqKhTVm6SGzL////78I7hkjlzGHE3DDKYlaz9yjn+dP7ST8fjZjZt//9iIVacK3G3MXRdY2OoUJ+vYa7XLS4hnKqPLWzWO5ujVFdfoaIkkZxnCxy2VMsXI2K3Pbb7X64bYW4mZ40td7n/q/8ab4mkO43/AABcV6W/f/9QpK+LTpJ9O7ZpUaYAAP9GkpxbUpkspd0aM1YsuMR6QzMecnt0M5RpM4u/P/+qqv9gyNiqVVUw1N6q//92SHhiacC6hDqwZcVWucUZcuVqtP+riV2QOYXIkd0Av39/f/96HVdWs8KqqqrASqG8gswIBzEAAAATB0stCG4FFVABAxQDGWonCVRK+f0w9/0CJXFOCocCNpCM+/z1/f38V9BvC436ZtYFFDaODI8x6frQ/PsEKIv7RbPsdvf6KMxKC3Rw+Pts5/oYB2X8dNj9t1D9p08FRq3912sOhvOu+/sHOKtN6fq1V/v9xlnTZvoQl/X7J60IZs/zZ+8ERZMIJFIFVrAoWOj8mVcLePEJV83TJowY9vwX6PmqDY9xFXAwFm0DNXSN1/kPpvayE4v6NNMIZ+0sFVMS1/bvl/NQ2Pf5Wuk3CobIWPn6JpCRNvj2h/INSM9MC1AOyPaNF3D943nvR4wpCjSvSPb97IXSqPov2PkIdtJQFHIOtvX8iGsrJ+rHGY2qxvsPLKtOyPXmOI0JCY0wN/Z2JfoIZ7GJKfotFTRQE4wwRvqzZ/u1uftMJYxuFVMGGYgzd/f7qjUNdbFtFYwtZvH8tTXHtfv3Voz7ZopPFE+wJm4Jhs8KWO38k2owx/ZVAFUKVpIuh/T9zWKWyvoNZ5GQFYxLt/hsDHUv5gGqAAABAHRSTlP+/P7+//7+///+/vn//v/////+/////P7////+/v//+/8hCP//TPoBkAT//wMF//8B//8RS///A5D/AlWcBQOjBv+aYZL/BmsSkxkJBVOlAwNhlwEKBKpoC58Bam4ET5n/lKBhBAOvA44DcqD/dZwDA/9vkAQEjHYDe5H/AP////////7+///////+//7///3///7+/////v/+//////////7///7////+///////////////////+/////////v7+//////7////////////+/v////////7//v////////////7+/////////////v/////////+A/////7///7/CBZo4gAAskVJREFUeNrt/QtAVeed94tv7jdFRQQRwUQdO9O0SZpM2pMmbdP2badvpzPTuZy5vXPmvf7fc95z+5/zv///m81mb9iCxh1EI6AhXIwUgQQiEUIilGoSxAYbLrlIkxCNjVi1JkpisSr+f7/f8zxrPc9az1p7bcS0M80vBpHLvqzP+v5uz81X8pn9qzHfZ5fgM5if2WcwP7PPYH5mn8H8DObtsu9//bvf/eJ3v/rVe39vru0Pv/LII/+fR77+639NMNd/ff3/ce+99/4eK+bee//7+79+/790mJ9b/8X/9lX++Z3rv/vv/uPf/u//9W/Xrl2bsMiW9TtnSZs2bfq///++8Q9/98j9dxpKfeT++/+Fwvz6X3CMd37xz/7ff7s2Pz+/rq6utra2qra2Tmu53ux52XLjs7dUW+ViF11sqWf78Y9/DB83feN/+5//hjP9yiNf/xcGc/13/xuLk3/27/72vwJFYKglCHzzLfY8/Ed/e7drkr31Fv8rlv0ihjFsr8EfryYTVA2/tDQ19Rt/9xAj+sOvf/1fCsz1XyRJrv93f5tAGOu8mAlzgSZgEs63bg2mIsPXLsZJ88fO9srSTf/27+7nQH/3Ya7/ImY6dyJIrxxNjdbdMkvC6AmmG06LV40PpiNIMKbT1G/8zwT0h/f/TsP87r0kSVJkXXyWvzgwUZvelOkZpmdpxtKlRBTC6EOY5j5y/+8ozK//NyL5X+OTpAwTLPfWaZKrXTw3G2fQ/HEsM3gmfeN+4vk7CPO7+OFP/nZhJEXYrKt7Pvf53FuFee3WgubFi7cd5iuMaOp/93eYEd3/OwbzL1CUf7sA72oNnLlYbiyM5vPx0bxNIXOpV5bE85VUcrePfOF3ByZmr/+0Nv/WSN4azGtxS9Ozm/WIc+kCYBLPTX+3WMmQb3FQ/gmIsm4xLc4i5ZrdFkuar3lNgZYu9cbzFZul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"
    },
    sounds: {
      /* The background bed, looped and crossfaded by Music (see CONFIG.music).
         What is embedded here is a SHORT CUT of the track — the 36 s the DUSK
         biome rides — because a playable downloads its music before it can
         show anything and has one biome and no menu to spend three minutes on:
           ffmpeg -ss 12 -t 36 -i assets/audio/music/arcider.mp3 \
                  -ac 1 -ar 44100 -b:a 64k music.mp3
         The WEB build ships the whole file instead, as an asset next to the
         others: `web.music` in the manifest is the whole declaration, and the
         three minutes it names are what the five biome beds and the menu's own
         are windows of (tools/build/build.mjs, THE FULL-LENGTH BED). */
      // assets/audio/sfx/*.mp3, trimmed and re-encoded mono 32 kHz / 64 kbps
      // batt:   alert_chime_bright_airy_positive_002          (pitched by the chain)
      // boost:  ui_mobile_touch_screen_pull_down_refresh_trill_flutter_percussive_bold_002
      //         (a bass-heavy percussive surge — a booster has to sound like
      //         power, not like a thin ascending whistle)
      // ramp:   new_message_whizz_into_clicks                 (the launch)
      // land:   sfx_hit_01_sport                              (pitched down in gravel)
      // crash:  alert_negative_hit_delayed
      // scrape: sfx_hitwall_sport_01                          (contact with a rival)
      // warn:   alert_prompt_mallet_marimba_warning_or_error   (low battery)
      // mile:   alert_notification_clicks_fast_ascending_001   (chain + milestone)
      // End-screen cues, shared by every game (played through Sound.cue).
      // uiScore: alert_ping_chime_correct_answer_check_positive_009
      // uiStar:  alert_mallet_chime_ring_notification_002  (pitched per star)
      // uiRow:   alert_menu_select_item_beep_click_003
      music: "data:audio/mpeg;base64,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lUxBTUUzLjEwMFVVVVVVVVX/+1LE2oCJSFVxhiUHASuPbaTDDdBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsTtgA8VX2u09YAKVrOqbzMwAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxKGDwAABpBwAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=",
      batt: "data:audio/mpeg;base64,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",
      boost: "data:audio/mpeg;base64,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",
      ramp: "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//tYwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAPAAASAAAgICAgICAwMDAwMDAwQEBAQEBAUFBQUFBQUGBgYGBgYGBwcHBwcHCAgICAgICAkJCQkJCQkKCgoKCgoLCwsLCwsLDAwMDAwMDA0NDQ0NDQ4ODg4ODg4PDw8PDw8PD///////8AAAAATGF2ZgAAAAAAAAAAAAAAAAAAAAAAJALAAAAAAAAAEgDcIEcfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tYxAACza3XAAGMscIRNqPUcw24/Qq59HAKwAHFCCf94XoIUDBACFwnPlFgYuJ13gsgMW5+gd+nKHN/hOaEn8/3iEaK7k/+ldCleE8FxP9A4KN0Ir9GAQCFD7/6BwUU5BAUZG6uRToSpCMhGq/6uQ7kb////qdGQXf8QOlw+UBDxGH8w1x8UEIQA4QEBAWCEUzyZwRzJTIIV33SGZpgAQMT0rNMhjF5l6wIin48YyDk1WmZO5lxKHAwQzxNAArvTQnNCdETSJXSFpTRHdzABg4vSh2Tw7v13eu5cLBCCcAT/+OcV4lcnCCH3f/T/N0LuiF9Fn/A5uLorD6gXON9QIOmYnPl4IL///+zEQcoINtRMABAlZ7Hj0E2Q0hhgAyI//tYxAyD0ZHbNgMYccHuvCjAEw15LAd70dlPYkn/cGEHrLsrTHq3JmIfkGjY93vZA9b9B3u9hyYx7t09zL12dbEMKQx30LQqEEFZRCvEAERyfieACDSuETs0RK/np0+v6IWYdkF7mADQo3CDi9zrunxCJwM0os36c3Fn8EDYYQXHBjFqgI5b0L/5jNatBFIYFkE10JvyFwhEHIKMISWSNu0ctz9y30EQnx8d0QQ80imfvCqWpuiDDRTocd2Ik+uZHX7XcPfsKPXv0yDsJtk6/QCn3MqXo+hVHPIsqmZYJESU88jjvBZr/lkN0oa7uxZP2WoiFC8tyMtaH+oXsjhyJ9/P9ApVeIQzAQA0QADsiHn+pZ9zNh5RbfZHTEzsDh+U//tYxA2AUjm1U8MwcsoCLaw48w15xmtZVMwL0q+O5wcOsr41kvuNwned9/M4OIoJHgRHZ0EBw5ggh0xBo5b1I5mhe5kb47oCEe7ynCA5ZQBBCv1yFhEBuU5QZvdL/QPiEVzrjwt/l2KAb/zf2yRULruZXbnl9zQRPAj2PLCDnYcz5gYX3Pwh8f/6/urqpMxEyEoAICVV6SWRJ511mlKZ731UR9fJRuPryz/c8GcC5s0tF0p2hxkl27Cy2V73dwAsgCHh1iTemqAC8j3Myc93NwM8+eTmXRzNkfTp+/k/le72FS0pzvlzQ7JnYn4RPPSn588l8f/A/4wZ6MY5PyHU6pBecTP/wOG30g+8fBWsyZZVREgQAJa0lyVdChRKKwV9//tYxAmAULz9acwYbcHLKywQkwnw/XrtWsKWxBUWeTOUss86rQqibvSVsdcWyFz27RkZrYtw2prg9ZXw8MRhqtiMbgtOBG6ZMWT8mCZK8udDAxSeMUXzBBcBtHIARJCIDhd5FyLKhMSEoos4KvAt7J+gWAmaZJAqk41KVH01LU2NiqIihfKGk3SSStiyEldGC6iSixYlpgCwiyclpoy4pvC+ar/SyMJH5knYdeNPOORYl3O+mrw6kiWvjVXmSsjIatlZEf2aydwEpjUMcSxvfYzKUz6G9S7K20v0Ml0arZWDMDVbizywNRFEoad50RA0BtNenOyuqWt/O0KoBRAAA6IjDCcFhgUAkWJElq3ZNROSzaynnKO0SlJVGqo5LIqv//tYxBKAT0XlSQMMWsoDQGZijDABBfOZOSRaNeQqk1U4ytrOkp9DGt4R0SXcznDZ76GpBf26sWlq2pW666+ufmdbfaptlqhZdH1ombVHkoFYpesrSJal8uZ1KXto6vVF6Cv5MJO5jxv+BIsIyxNIqBgEk5GapzZciiabOAqQZqzVVWMFcSUq8DLPwwpVlAVh+rf/qprtsa/NSYywxhROx5KvP/Uj41LgZ1Lqrr0mqz//1YCb9S/qkGbYgzak1UMzf9/oUm+LGZlKqx/D/20FGpN/xm9SalnQFmNSjVfY8MKYMqwCNFF/Hcvxd43YawyIjbBaLBaLBAAOaNAoHEEuZzUyykdE7pAACkddl5mKGsAsZh3eGmmZoKaJgpW7+C/j//tYxBqAFZ0tX7mcgBIFKGg3sUACdLTXOMYOCjP8z8FNmgA1CXloWBNSChn///6g6w7T1cSywWZSFUjQO0/X/////q7F7svzchyLLDZyo7W6bn//////xSH8rEvp7djftbZ07TlRFyYzlEn+/////////tSxG43bpLGGefdVcbtbtNiCsGf9QDD8uHwwCnGwACCS3GADBAcnVFs6sZ5DVS1apYjDtLEYqQ0L+gCBQMklA0iEDMDQMYFAxEUDwKwMSAEfGZMl01QMmW6loqJogQuYusl0ukp3oyiXkjIvGzpP6nMn1skutaKL123RdaKkTMuGLo0dT0dJLq9FlIoorb/9ejpazVw2dUyIn4cJKjUx1KCAkE2sWs2se7qy269L//tYxAiDj6zfFg5lkkIYISFFti7ayLmmE7kUWCpNFkTFSbMhAQzgHTLFJOIJdC4RWhzLTnsexrbivoqWDYpPcP1vFVdaNY1GhH39Zo+OQRPGwYgRhtDkffBNvef5dfV6FAzix33K87Zh6fzdq55JBqVFttiPg1xIxVLwogj1q7VzpFUg4abWLUtN3ePKu7lBnKJamjD48AAQXMhPjSCUywvMybjbXs449CFIxMbMACBYWUujTtK6gKCqDcWlB8ldpSh9tHuPlzzNLWCURfXgSI8CNb2fNOs9zNLLSSWDUhqKZW3ylOo/7q20gmCUB0zJVJbvY74u5prXfDtUaTI/9v////////31AkAAAAAEUu068hpu95+Wt0tymvzT/wRA//tYxAwAkED5A00ldsHotx9SjUAAKHAcZi1AyrwxDM04o6CA1o42KYwBUeGJPLApEv7Eoba83s5LsjTdSTTRIi9ULu6qRpWx2gqYbWlGF6utKcWbdbNohMjKrwqWbb5e4v5h6AHj3TWbW1bm01mtXFAeA+z4k/////yf///LFQ8IiAAbiU07qtnnbLAIFQyIhQT0AcWBMEAcmABHAnNAwRQP+HNHLElJQgxBj5FnU5dYvZkdNVGyVKjRRNUyZPIF4mjcmTQ3MHSPoJHkDBE0QQMUTxw3NdRq6Km/6KMu6zpqbu6Gy1l5v6nrfrR/+Trf/////////+TrqhKKBAIBSLRsNgKBAEAP+pZN0Pg4ZEv+Lv+YuBRk0j/81FDI5HMf//tYxBMAE4U5Q7nKgAHalq43jMAGhXGgVwNOKADTh65FC6WwMtAwDJQYASC/JwqJwMnh0DKQwAUFAuf/d1QMPBoDCQMAOCgGDQGFsyJ//7wvmBgEAhY+Bg4FAYIAQYIFxBfz///D1ABgWG3jjHAibkEIoaf///5vTPF83ZblwuGh///4YPlHAgZid6SRTRFbklkvCiJEiRIkSM1W1VVW40uXkkxWklEEg5A2EIRjJda0zlvnXUxitrWtau1+ZnZ2vNW/rWtaZna7WK3zXemZaeWColEobDsoyWNg0FVgqCoKh1QiDscWHA148NCUA/9MZSKuEq3fT/iUFQVBUO/lgaBWACAACDNQ/DCCvZ+ZdZpsssa0av3IeaUwZZLK0Xi9//tYxA8BjoUPIw4k9QHEmyJBjSUw5hQMmBhCWvMtgcyBIzkyvMQgMxcG0Oy54TCQwaIiJCeimrEqSpoc8dxn1KSKRNBMLhclVavJbe7HOqS5dUrBlJEt5Sp/lK2azHgtVUvq36mrm3oVNIoehhxndprPea53WVJLq0eaS6kKVwFQhkEwANGRVG9Qg3ea5EZ5GYwukMr19qWPtgfqSvzTbm4KNZE6wQxZh0vSuIWhKjDIJCpvstfbuHjnnKBZJkUSTJfK0m23TqW/fTAwdG2RGSzqyo4XAxU69v/ucioIAAAArACMv6iv4/z/xuVbkp5BFlqsDsRMWDaw3JoyjgysQ2SwQTzQHTGG06U5WFq0kcfS6ei5MjtbPtVlZdY61lpy//tYxCGBj8TXCOxpkEIVwF/ml0AAY4mOVHzJ8vdiy1s+2Z+Pe1hWQceZvebTN6702nr1oVgFGw0wPEULmihFMGgaMgJ/+dBpB5//D////wGGAOA8mR5rL/mHcNKAdAni0iPRZQJDgSGgZgGBkEwHHOgKWgKlgLJg2UOiJMdRGm5NF4c44UjrpJMZHzyRucLxNH1qQWo2UdGVGWJIgzupNmRQ2WtNJAxLhmYoPo1FspH88aMnUYEaTpmfb9fratH+qr///////rWef///////0kv//+o3agBAO/FLwIJhiw96+kpDcJ/OKjnKhpcDQxKMokMpihC6bgaRJoBgwAWAgvR6DLpFoGKgIBmIbBYaYszm5tTD7hiQQUFKJP6qWoGx//tYxCUAFvodBjnKgBI+IikHM7AAwZ0R+JqNEPXZbnzCnUipa6ob2NgQTD7jMHScJXZRgp29SF1cZMbZDRO4YXNRmxplQifa//v/yTLpBx3rK5XQTPnjc0+1T/9tbTiv9dbsTlA8mmz2SNK+6H//X2Q//0z6HNFFwgljxfcqLUblAnDZsDagOaQxQ07BZrM4Bgzcy0gYn/gQ4BSG82aReOBrbKbWtgAvMrohAAmSFJm4Ol2uw3tcMxBHaMCXx4Uk06wxxNrDYWn4v/p4lNHEnKlJYYLYrY6iX97/1q0MRSH7f558ta+tvV/nf/Lv9/tSxb1hb1hQVcf3jj+OP//////29YW+/n38//v/v8bP/8/922pVOVkAEhFJCCJwQYTU//tYxAaADwELQ72IgDG2G+JBTSVoXtlvK3dYymTZas1pdTJGRFiDCvDFDEIADANgapFAkFPZ9IxSNkUUZkTRPM//6lJGRRNbM+pqqReNnVzI2SR1spJaq2UtE1MjYgpqkkkqp2R+yWikkbJJIF4mVErjrArQsKqLB3///////+0DjLRPRNoJtm2167M0EhvrCqhS1RxMncOSdPd3NARMJ7N6VA20HE0VWxLthiEx90oHpb0yZVdVLRdsULo301WBA01hIXMksI/1vjuSykSgmSNGkKzT/TTScY//2rbAiBIh+KnWllxFnjQUNez5KgBAIYeBQLLrPbP/hd1WuS6giTSs2csXNCyNeBCiM5TsziAMCAI+ZgGXqkS5XcBAESsV//tYxBkDjiDVBi0ZNEHVmp7AnSHYREAznpnirdVlaFxuhEKnlnTQoYf7f/rbZtVERFUms+T2SJE+8+y3q0FgNAIBPQeyzw65CUD/t//1U+9P///qAoz8S3/fPMkismZja0QcFStAi02gEzLoBljNqAwyhs7yPLiuzHoef5pLa87nSqtogsULFitdqpoYBsHwjAqPD39u4vuJqxXFg6hSnJVmKlaU39YuQaliJ0p54tMsVrPMU8t3KfWCnUkse6rFDA1Z+moj/K/CVYjO9x//yy3jzW8flPLruioDWRa6mhrkd8HED8tZbs41uUhMkS0CWvnmeyRqPrZ7VXolVEVHEq2fPrX7+aayKLbWz3yqqn/QwUT830wpHqAt/8v2/9yp//tYxCsDDYoQ5AwYVQF/LdfIB5T4+6fUBY2VW//US3/6Cn/+//////9AwpCRgz/nVpaRoN3qYQsYoQ4ZYzBMkgWI5Vw/iRtQZZrXqml/6o5UcqZhooLCIg5XERh2MVFcqWdjK5TK3///MitQ5TH1R////zKQWEUO7iokJgoeGtt2MInHf////+kJmUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      land: "data:audio/mpeg;base64,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NW7+tT/WpF60RWUVB3RbpCjQeyNGnAwcQqiQthqZpIJjHgImUVZyi5Cykr0gBsSlSoSROTll4X66Vn43sVr1lP/4pKkcsTb9JTO5pc4hijOT/716ZXv/Tz7Q4RXCeCoucLPFkO/6Nq9fb//+Ou2GEdYkqAaO4JsdWGJyaKgMkAalqcbA3pcgCSfkpASHzQURiFUeCSQyEc01kp2DVNN5mwXjGHfOn/h3fu72dScno0UwjWSKBEPAQgiYabDA8JJNlS6CcmG3JGrtrGCzL/p/9PzP//+m236lv05MjNemjIuA//tYxGqADJz9JM2Ya8GakuPJxJkYzzAiIZhUOsCdUSm0SyEwoyDx0oe59pNnwTKZTSaUZU9tPo6/Z8epM3Opf7Vs44/AMGiqVLNpC4dYEFxg4QhwAiEqMayTAtr0uLC8zMxW6q2h+S//1M+3/Z2LroQZYjPkJOKMszQFxGAgUAm+jjfK2tacayAi8cjAKgAtBRtUcRr+TVVuwuXmx5rkzAwEUtQUpR2spLrJtG/Cn/KlnVI4f3v65w/Jr2l+gEHbAm4xRDRLCQMiuE3qbmrf86r/d7CSn6n3Ggo/buUqTEFNRTMuMTAwqgCqYLDJRdRMsMh4PEaBsMgIJiojMhIVFUgIXFWGQkykBC4qK/UL6XVs4rWLP/9QvxYV1C7MWZqF//tYxIoDDJCBHi3lIMGynyOJww1o2JAQSFcYL/1C/+L9TOL5YJCv8WFdQvVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tYxKGDycwa+kSlIkAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      crash: "data:audio/mpeg;base64,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93ZLSUQ5H9P//6f/2+z/3ACfxc4ZAphQDmEDibokpwBcmwomc2c5xgxl+B+5BMqM5PPJZN0hDioNALfgdYVtbQ+RwjdDlO5MFWA6hWiRAaR8//tYxO2DEMB9BE37ggI3D58J3LGotCeUK6fqmFtiVw+hJRDU4oi/GVgvznel3r2LaCMfqDXqBqt+p/9Wt2+R7MlqPf/o+z1u+o91u/66TEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqONYMxvUjNrVM0HYwWaTHqiM4QEzfWjKmdMsbUztbjbrhNzFAIsYY4Sn42ggC2OvgQ4SLEgVBmssqVVS2R2WDZw/cogkagvBwNBrHgljoNwGgKC8zWQpF7l4NquOUJesRnp0dIaRe4/E9VmC9P76tNQgmGQEC//tYxOkDELx88i7vB0Hmj5zJzTzgoqKhkyFWUjRVkBLZ///+v////Ff//itMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tYxMAD0XymkA5ljMAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      scrape: "data:audio/mpeg;base64,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",
      warn: "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//tYwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAVYAAaGhoaGigoKCgoKDU1NTU1Q0NDQ0NDUFBQUFBeXl5eXl5ra2tra3l5eXl5eYaGhoaGlJSUlJSUoaGhoaGhr6+vr6+8vLy8vLzKysrKytfX19fX1+Xl5eXl8vLy8vLy//////8AAAAATGF2ZgAAAAAAAAAAAAAAAAAAAAAAJAPAAAAAAAAAFWCVND9VAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tYxAAADaG24hSVAAIqJGpDMTAAn6hlznSPVEESMEycQAAwCY3IBEEij8fjweDweGTzzzDB4PCRj3MH5O5hhjTzDDGQxlIxEDwxTzz5h59DP/nnmGN9TGnuhhkwxtDGmNPPzP/PP///////qefmGMePB4Z+ZU+YQGKPCRlzGUgJDP+qre8QGJ/qxllC2yGX9MAEKC9xe54sQfAAs8ZXiABJCkA+EPlD2r3EeCjikA9QZIQhIaAij/A/xAUOMmMeJTHGAWIiQio5REh0/5aJsrloi5XJxAgRPEWGdEECJjZQ/9k00yLl83Jw0ZkzqIphAi8xsl//Ug3/TUXxYsh8//h8ua9yzSwp3////qXCAAACSXKLL3WQaOSUByaVjMZ2//tYxAmAED1DWV2YgBIyqSmpt6IbpJYOgGYZlDt3AuibQ44gxJnCs6Z41NUjI2dnSIeXE1GxsUhHQCtKpesmmcSY2VSdhmTfM1PZRmb0imXUS8bGSzX9LZ+qovDHMj//5iYucLz7/dfUkkl9+ldKialI2IHVU1aypIYVNiLbJX4iAoSeBAIAAJbtGdJSBhqYTyHEgbprBMMTHRXjNd/U7E+KWTykqAahVVqY10cjJmB/8bm9jNaKUcsxCrD24VpaGiHT9eMBsJ7Ubf9yMS4HquLDkv/veBkO7zANrAGEQCS8z1V2ybx+HIiitfd1y1fxEV//60swNTQthHoucqNj9Mv46Z1awfoHf/dd//45l7mlAgIIApSYCs1UweBzBCQF//tYxAeAEJFRTU49C5n1puypkT6jJERUJuBggAzhUCqMlO5PRTB0Iq+g+T6goGuiZ1Quy3NMy6r+ia2t87eHw2ur5g2bPjTXiCh9XYhCMzMLDDsWvm6Fa//qJXCYIrhDRKC0PYk9ETYq5WClU4i8PaqpqeTbuOaj+7/mmuzsbqJJmClrkpdlhNTaXBFgCEXdsKWGmCK+CkRWTDF23BbqTlmV0cbp7ec3Xt/hhMUlPbiEOY2zvIRCNq9V2U59TnOBp4cWhCdOIUDG//95FWsCFrp49Q9njw4e7wInvemtI9KIXNff95Z4e77hv49895ql8UpSn1uSIBz38PLOkLIO//DPjiPzH/cuwEAAAAO7CraMVAywuiOCIoYGigcyg4SQ//tYxAwAEbE9VU2ldIH7J2ipxgqY9dlx12tdeCLTThOSu1pjRldOs7zjRFpSJwBHjCAkoAYysPiM+yRsnVUJKNHRTBqoFZdW2c/GmfMojaLAkki1I2d7mtZf////+ogCULd42sck30p2/ztaeVj+a67QO8Odfy6/2tls0qaSmdLDwScDTTP+dHBqlAgQAASJOJcww0AFDQQANB2wHZIgGZ/dgGJAKIxeY6ClJPyReSrpI/1E8KeLHF7Q7uEvM1paJIHjJ5L518ShGOl0bo4j/EsfMWlrfaUo4Nr0LuiYDM+9lk8IQjHLrzNWr+cjEMiG/c031DBnqT9v7oGF6KX4Rl//8pQpVP/+yioAAIUBlQwApo6BBgnAxgbCwRWwBD88//tYxAsDEDz1PG6wVMIhKGeN16qYcQcIBkkAUwwDdbr/zqOy96z7TDoBwQvlB8RkDV3keRQUqgiYqg8u9lBGHiFs4eSriV3lQUNOIRDMzPVuYx6ZgqE6Gru8mGORKc2bXoyiyl/ytfeFHCIr5SE6loeAAAg5/+NB+fHBj0jjhN84AAQrA4qugdPJmqNZlczwGscwECA5HQYGAErgxKCxm8zL1HmhU1+lTuSxv16Oka1Ydt6B0BQEHjyUtGDeG9hNlLV08MwT9pV6uSLBHjxrXn3tELzqLv6hSNTw4HC0Xb3Fi4kg8Tt9EZ9vcG4Ck7zLpd/0KCKae/ed/Zbo32qRkFT7kv2njf/7TFUABwgllBrmApitEJheqwGx4wPA038W//tYxAsDkIE5Ok69VNIeoOYJ15aY8wNAFOYwcC1mkfzfR5pfy+h4kSxGHJZMuDSylpYWAQHDQmbGtNsV4wuCRBgKiFVSC3H3GetbLI+vq9NWXlEKyn+ZYx4qY4lBnyO8WchAyT/1PT+QjwRRxpq/O/2Hznc7Vk//90JjiheecS6zrZg4EihIADuweTYZQjbOSDxkBS/R6ztBgQAgMEgy6E534zTMCf6emJYQgkoWwhutFBa8Gxw0lWFAqMKxzVucZVq9Mm+ull4FOeMZQG2ASi1IeW9jNFvbtt7yA5sjmaQaL2Iq3JclhJPouJS4eyuM9xZwiJU+iHamruJPu1Ks2/oQOhh/jCImbP9aAAJAABNwCVVTfpYMSxoEJAnD7Ize//tYxAqCES1bQU4ttRnjpigpx51q03cchAwNAt6b5Woo1EJtkS17GXLsrpKj8NVMHgRq94/73n2W1sjyGx4oNyhnV/MvVd7dpyHIW6I76M2Ghs3/Z0hzwzUgJABFgTArJVMklolZkYm9R9bzMcQtR1NHdqkVLf6rJ2+ggipNNFVFI0/7sifmeJj0AQASoPLX7N5FkyuVTKhAGwEm8a/mztFQEA4YSJGo5gOGG8tAR9ntbQNwVcLKMRx+KSRIuzsjzkFQcRMjwvMs6mKo8BQv6jc0RBHdarVjwCW/of+skEgTW9nZ/7oSN9Hnf3Y5/1ICMIoRDriWeCtZ1r1iv//////n6gGAAFN3x1bBy00GMo2YVAhzECDoHNWY1uY6DAcP//tYxA6CDfTzPO4865G6HmYF15W651jrCPprisanOpivPE2uoNVKMN5HtFi59YBxWxpmTTLJDxOzmH9EEAu9RSSLhQvu1TSwjFn/p+kagKJmspzPQ9/8SQm2o97vs//5fpqN/////1AIsMFAFOeFHM2jeA0DgM2jA0HDOPRgUHxCFQcQC/nVoIwlZGCEuXzghcivbW1jMMl4E4TWrv53Hb21Yd9sJmBzQKraWe9/NG3WaC3q/eMz7hoazqRsx8Y+YCKPf+i36M0Jgc7qW93b+IBwMav/9FUAClCSGpb/uHGqhgbsgyNhTwiC1eVjRMLYktaVjW8Fk71HPvD0sYA3J/ZyXtp/fRA1RtX7MlqitjE88mTJ+lCgQgOF7ea5h388//tYxCSCDllBRU2w65F4Gei1tB3asEo1dV2Q5P84H4tLMj0YxfNdDDCt/c5iBBSiKtS30BP/59N3/1gr/9WpxEEElubclZwSiYyImOD41xRIwqYc6Cmm2nFpnwVpd2XsWHphkYwfDhg5e4Pa7UKcoMGE3W1U8cCb6COSGgPtprpcav/v/YmEJAkJTqAD5V3/63f/+rxFcJRb////qQAABQAAAlQAyEqAQb9rAYZMaYGnqbMgsIgNM0YVGghJQAMXQIiMvuvgly+zt5Rt7J2ntzslhymjJAAQYC9x9N5Ul3PdFM2s68bIABkUu1XoubrrVrtsZfL+56UPGEtKwYt/1KhP6p9qIMGM4cjvQ6/4CwMUuR0CABQAQ0tE5Q+TKQeM//tYxEGCjsz1Ma6wWEHGI6b1x7VyvpkHaJaxqqMFAHcNATTK2zYxEhLzl6463uFDyxvD/FLS0Cld6kpeNHpVtH8tZj9/NVqXprSLiG1AxWaP08uGQ7zV/0Vq/rErAmg8TiJqtSz6Lq71HQiweRbIvdE3RSNVex9EzdIAAgAM4mUcQwUYOtwF05AVhKRNf23Hg4dkxRB6GY1SwVVpoxnZjErqSuRPpQ2GdkITwqSztF35daisZj9/XMWfceC/WoO8p69bPWTwuPB1zfezcy0OKM7v77ygqYkCQCj/6mf5ACbkGNpNRf6KaXfnW+7xUoJYKgKcaR2JK+ZfMOacgUw828WgSC8VBUEBDKnh5BT/yZ6vq3dYYTkaz4tRQQwQBOcj//tYxFMDjnD1LQ7g7cG2HuVJ1gsK9mmt5zViy61+rO0SV0mgaW0VTMpmy59/Utd7ehaIQjWjrXC//AICJFf5F/QyiRJnI32/mBOnKopSn+sBgACDDrgjoCOg2IYhZgaEmhwEzU46kx4GKKmCwZTwKyNMl9M9YssBzYaPYoWoBWdQ4niZiTSRd0kXjFu6v9qpZR7mCE2mGAUDNmFC4koof/M6vTwQgQ47+lotmHAdNTP////u//5L/0faDDXgsA5vBN5lcH5li0Zj6BhbM3QH4IBsVB0AA/LID5WtVMqsMzNifzooIak7TLoDCALtzNXCrZl0P1ebuRh8DAQBc5x+OTLrUOXvnPj0H/bXuJR04YHP/VmK6aycUX/6P5UOwcwU//tYxGgCDTzPMO48S5HJn2UF1jcIp5N1Xbr/MTEunv9a6gEAAAICeso2lmIlZIwdWsOEItwLaMGAwKAKQA5L6TGkkXI/XufDNrOCofmKssYcYHARE8vrSimnIVei+s6aiQHReIy2MTuoNts5GkgBGOrcUhGbCwSY39iaZyid//f8oJwci1+zs3/cNGOCvI///////pDiChkGTmzxzO8qjRCVTDoEBACZzoXJgWAI6EZgMGriP3FJ6X3bkDTkFujAsNuqv15HnhBAAQJBtzIJo5bVwl7j0zs5wU+6DWpLE3+lVh6NU5jLEpAWdjzXWBpBohk01XdgyiucxRJ//+igU8y0FT6xztEBAABSXzSRGBjefAMKxUxdGQhOJeHC0QnQ//tYxH8CDlD1KO6k+FHJmyQF1hcIyEwUBp9wzmPLG2iNdlco1maVFG+JaFaS+6Q8Xg7vZgFgu4NkPu+Q0NUuboecLUqySJ86SHqf6nq+6RHGAmEkbu53GhL6pUwmGKIxmpXyQ//6v/+z1J/7WFAeGk5TXGvMxFcyy5wx6JLm2E+ytn4Ey4RtS2z5CyS0Z9hhYYtz9SJ0vMVxaetPG3vE5HNsKNbY5CCavnJBeXdSNElwsSm7Ue44Ta//zf/85QgpBJ4+Uf1NC7m9Clin//////+2jyif0AAQRJINKABjGfQUMAwlwwbx4Rou0CAIGOWOcCAjeHKLQNFbMpt3aeHkOTlus1qclEWa9BjRiUQJPZ3O0B5Cgt8Q5WRzRCtAfgkC//tYxJICjgj7Ku4865GmmmVdx6E6oq3rbE/YHrZuNajWTphcssCvX1On5kcoZZ4rjGcrQoOv/8/5/pv/GMQL+PmaobWmznv/ysq6lxL/2b//3f/7vkHCAAMmjFxmQZXGVijmmwAmAwImiy3hwKsIC4CvlDVL8eHVIlUSc+mR5Gby4uS0BWCXrN3BtYYMONmVufp06wRsmrIpUJeUhRZXF9Z/R6qXqsm2pIUJ7Ax5HjxsjPHs5V/0MSkqhLILiD///+IKAgAA0pakSYDggZOxEYepmY6HmBoBEADGVKNCwHQUNBpDz3cPV4tVMM6HrL+adfdh8ibPocGj76j1jX+yMkiPCI+u9JKM/ZrVXKPnYK/lsQItfIpcc1//8/+ogrBg//tYxKqDEVjXHG9p54GzGqPB15W45f8X8Qf9oYWr/13///0aP6i6RhECpmhwppYh5kmrpu0DZgACJmk5o8KJACAkGbauFQ1b3x9ynCTCo5ihZDAl5nrGUtR4SHNfCL0sdpotUlUR+V1IqYFgWnw7kCSacHkcgbdZT/XUqT06lDZGwyfdYcU8MrSEIcIGf/oQncENZxLCRFnp+If+WgHEgETBJAGMS9SAxCSrDDrGJMsQIEVA8MOsn4SDeSKAQRKgU3agGmnZW9MTiqE1zX+j0MT9Exddp4+JdpZBIoi7MAVH2f6SSmSIdgoprK4lezMYZ1YrSfY29pFkclzeK3umwtWukaXOVRO+WXqKWawr////NYLj/mC8t8TBIInzfJP+//tYxLQCDbjXHu69C4HcGqJB1gsIKf6/9P/3X///0gChBYw8ATVG/AKKMQJU4AQRYIGRmqDjYIAcGCaGW68Ke0KBHeVYYjNBUTE2TnwNfGY3vbMFxpBiC7CYxGOZibWY0Vlbo3ECOBWAuPVGUhC5EEO3Y77fmtQiJVoBr/93////nSv9+731AALzFAhNBxw5SijPT3N8Mc0kTzH7j/yguNEIMFIVApXWyptzVmU2I1flM7TbiNI4SJydUuFSZLsaWIhUikTCINTQpEyrNRqUpfy/lqHPGMfhYmks8GdT/YHWgr////Lf///t///6vuCwA5+g0HMQajUzzhJg0efAZwoGo6ZDoXUGGRBIYbZkHGWKBjC0YBx0euiPiSPRBIJc//tYxMcDkZzTBi9h64GeGSFNx6lwK5grRR9tWq2quOS8Uy6Uk6xe5G7a1bbm03GocvTc3GoQTMhJtacVS7xUWFkf////////////ixpMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tYxNIAjPCc9k5pJdGmEpIVrLCgVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      mile: "data:audio/mpeg;base64,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/////6jlu33rjqCamuvK+lESxMOp2Sl0eRXWnMC4EKOcvtUZIg5CmOA2WUEycRzFQ8k991WrLg+mj3110jikUD6RmFyPEgPYepcS0zJTrW92OJpoXJg800WZT//70zRmWk7pqTV//q//THeNiH+zXWkr//////cVgx/QLwB4mHqVJWaMttk4nR9gKBPDnOdxbtMQOIGjUlhMmiXYUc0MA9UQIK4Abg9IWAOhEAxmSuJQCxEcAhcMtifzhNkS//tYxCCAFxoVU/gogAoXt6v/HtAADJAtbUibFgRAOcXBzCKFQZsXGRNZgUxqjw1lGpmOeMBTKHMGUIgM2NciYsgQovRJxK2zmJZJsqKRuVBzxc5JhisMVjJkELiCezuzfRZ1rZvxmzY0TL7lxC+3/////6//ppv//////+ggyaTlwuGhFyLuRcvpmiCO5r7uqu7qJtnhPEwkUAAYBdMU31QB2JD8asoTp1rehJgkSYxzEWYng4QtJKnBKyQJIDxEtJw4hJroEq82Lh0ukibF4cXJF6VQ9y1BEuj1JxLEkSJd6j/uiTkdIcJeHEBlAIkYIeyKLdYkxSb/b1Gyka///////////////dWiodwmSzVGeJIJy7UokAASQf266wXQ//tYxAaADwW/O7w2gAG0t6dwJ54oMAdQg9ajMkQWwhGqKKjYnBAFCfUmnMXJ1E1ZBZ9SzUnmrByQTwSodTYumCLIIIPeZMPAliOKw5B5HEnopHDY8pJakkFpuWokoRi8aFZqtNTv76rUFUNCt3Y6p17////nW////////+kNRKs3LNaSsAPi1jqRGcwBTASth4CWn3rcKq8EeLjJAtaJVrZJENiVrvX+IcF4yJInDU3RIUsWNaSau/ZqiTjTR5yvRHH6KaYYxZ7u5zspoQCkAIiI8sXRlY+qfm1RlnH566t////yrf////////iZ6pbdPmwQABdNMsyqwbIQtrBWcwhJhiMiNKyAJMnW1THPH04+hlCImHpohgti8XsbPPOO//tYxBkADbm/PbQ1AAL9per3H5ACZUJDHHotCqAyo/VHRDzS5GWMPSphIRGsxCSBeHGtZdk/zDn3S9TjSQ9E////4vM//v//////0GA3f/UiS3bfbX+fvZaK0xkBgD5xdyUucM6jHZNqU3i4BAgdu2SLCIyOM0Bh7dAswuIWLNsFcjys+dDEkDUyCBAIQYR4hRdONLAtIfqH0KRSREB+C8b9oqJNJEoLxl2n3l7wug6DlruFASqI5LLVos7lV5sy3aWbm7LtR2VPzKJymnK00sdDvczs29PLNuk2gWKUvdcvGvpHDP+15+loOQ1BvO9/+f///+1yIuuuuAmmMkr9//+05L0TrOnBZbWB5v//1A/VDgssZGAB5fKL4ek4ZslB//tYxAeAjtm/OZw1AAG8N6ZsN54ox6pg+E8DroyExONx+SnkJFMFUemB8WRUONZSESSxCIMCQGonIXbqYTypGPyo/CiC6YW0KFI+OOYgb7oaxYhBZOOPFg+5xunZjWZaHERzIdkQrA1A3D0w455v///NDFP////////0HTgSo5CIT6W3Q8YxuwglVQLBMVT8scsdXnSPqA1SxPHrKpor6rPuTMWN4KlfjRFlMtKtz2Lq9qvrZjwe9gN4RlSRGZz2SUHR1nmHGnFZISxJHRYQJoXOdNpqK5t1tl0erHZ56N////gr/////////l0AFKJAb71M8sVYVWHOwJGHXWoL2g7Hs3zbFfVwN6A/fahbtGofiITScAYBRM27UpV8+atP//tYxBoADmG9LoE88cG3Kaf2htACm/TKrDvN0W9TqZrWL3j6vqHJTXxim/2JdN6VKxwhWr9/Un1rdfvwUVcxVOIvHVLDpjv////EL/////////qXzbjkcLIKSi88soZlHHGBkJEIJGKIxgPAoFEnbIF06QjxSTrPmqZuipqZkzKeoumpt9N6rrmqCjhfSPHjCcSdz6NFSkFqTOonTMjjvJUqNElpWSajtqRbUpVJR9qrOnv///ZTJpg8kIT////5OHkOW26626+XSxyOSxRgD++6ZvRCFp7W2xCIsJ9K4GXQsG8TO3knEbmwhc6JqPvryb9YdOguQrhpyREOyi2ks3J+YZYiFNQMnymooeutgzZ0iEjkRhQoVoRAdmnp5qGJ//tYxC8AGn2NT7j8ABmxN6WngqAArLCjbOzixIHtp7uWEqiyjy3H17FqG5XnXDvZW/xpPr13mmn4hqKP/XgKXQ63SKRqadqenMct6qX////xYphHDxetoylkokEvsy/KXw1FnBqy25fy7/47/99/////////WF3v4YYRCHMZZdl92/Y/99/8pUSKNilfpAA7mrfNXCjhOITB6aLI1JVV1ccIyQlY9D2EZxDnsyJ5KF0QkwXANoskSMiSVyVjyhw9GwBYJ4NrEhxx97XU5FY1DCa4xESPRCsfavotNWaY8tNMMKtM////80KEQx3/9f/////80MRCSapwhMlEAAAZalKjITRPrEF7lTq33tWNkW7UWfOPnwWE6qRvq2rWfNmc//tYxBQADc2/JYC9T4GvN6Q0F6ooqItszPphxrOKSvauT11WjYQ1VPR+Sj001TTCB6Wep5EQsDaBTCjJBFHTV9GNoaa3rdDnQ65x53////Kl/////////wqglRICwASCAAEBbQDwPzYQzlYkaqt+sKeCSl77axjfmYT1cJK/1rqLDYnp8oco9bmnhUgzahb/3C2YBGEFEHTmQ7ZWkTVx6MUiKEOLyZWOOfY1lv0qp5WRmmsec8lRTP///9S/////////4khDClWR2RklQAsIC3dKic+yvsCy/1PYta2D0sRs20jtRffT5OrkEHUWrcbeHc3Dmk0kBSmWHkTKHH0Ie3iKes1R6Ehqaad///RlNdmaaaOq/////3/////////H//tYxCwAC0W9IaCs8YGpN+KUFIopQzTiAACOw6KwlQjQbXITNTlGpWlNlansrPYFU3IUm0KTZKlNZ6iMSrTZRFm2ZXjSsEKQBn/mMVSssuxdeYG5QzhSHEoQUUhgqOUKQUFI5UcysZUcub////o////////2TVHCiXY2SWpQyg1SykmgIAAAJURp/QsJFCjps9Oo5lp4qqCdD0zBc9aj6a9b5rjMvBKNBGibJsC7LbXF0LvtJVAlF1QqW5kMVpttbZtHqzI8VPjphI1WOR/qmluarUc1HX////qw8eb///////+6R4bg5CIZI/izTVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tYxE8DzYXC6WCw8YAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      uiScore: "data:audio/mpeg;base64,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SUM3rum4EcsopeBvTiHQC0RkbDGDrcW9lVuTcEJviItjEAPVbHcTOSzvd53n///rVWNO6w1KoKAOYChcYhNaeKQEdBiYMA4MWaay5bln//2v///QA1C0f//////1///V+PvRB1ii9n//7P93+3rBT0AH/x7aPEk0zCDn0s0GALhF5TAZD8MXsEsWAObCWzFgCpbax1zPDmfcKSVyiXxAv+YAwCBgTgimFYQQbGRg5heApGBeA2YBgBBaQvGkIgdb3nrB0EFp0GoV/+wm4LrP1f/////////y6W6iyE+kDQE6BTbjAAAAgAH9svYSia0Nhoa6H0P4zTpmLd6TzRttDBECRaNhoB2tqoxCrrLuPN4/lljqUu01pdr/+1jEHAAODUk3p/WxEcQpJbQu0eBbIwKBcxNSg+TScxdBIIBVizwuE+rr546y2k60aTrb//Mxa/9FkWU9GpKp///////5x9MJ6EOgo6ABxYACAwAB/9fqQWJ3UlcMMDCwDGDKhmsI6GBoCoSwUCo0DEXwz53n/r887EXhK8RgAASC5gYMhj7Sp/rrwHh3gZpABiQ4NxhY4GCwWClRba///+sX4qP//////////5KM6JDgCFAXKZRiT//////9lVCARFIAAgQWiVd8pgRHvKzjWqx54R0AACCmxi0l7Fg4AEQNkXOou31FEhwyolENuAYAKBgfAMBiSGWB2CGcBikAKCwQgscEIBTRPQyiPs6n///j+Vf/a613qb6m//6/+/7/+1jEMIAOqUsx4PLM0aMpZfQeybKv0mUmUAHgeDYDdMwV/+v//Z/k+u2iSIAEBGUAUtdFmW7lXG1ennlT6MKBnN7AMHgkVUHAGWLKquW//v//8vyF+mBIelgEhUTTAiVjNy/TAYVAqCpbhXCo2KItSfn/6v//+sVlFv///V1et0q/Vf9T/1fnWZIugCiFVPrLChbZQgAQIZBJzedC8YHzOkjbWC65h5gHmCWAg4iYAQAiPLM8E+3WWCVIELiENBwCwJBIAxQgVA70iaAGLOAoEwA4BYXTD2BIxyUPSZO39H/rGqW////r1f/9f///ztaiVBoCkZVBA+j///6tf//+oCepBtNBBBqZfMysZEaRwp4ZwEIIwikYDASOMCgEgvr/+1jERwFN0UkvoPLOkcUpZIlgT8gFAlAsFoVElzV6dukRETsGJQCABgEgUAABuBgPEwBhYgyBwKoYBhyFCBgFBgBEA4bGCIBIFgDA4Eg3km13///xnRi//9E+s0IOBsqCuyIGA+zFBSbkABALsAH//cqn26aV1pRTvPAT+PjA/d5WaZ2QCKRlyBa3o+yttrPfwxz3nrDPW6le8/bEC0ZhsNRz8WoCHgOAdYjsQ3DEi7h+/fDJfFTc7Pin2/QroZVf/+yTj7ZL4ZLH2yX2yae7e37t///1dQKAW1Z0CAEwBP/irqDZdoPyL60CYAd9MAwlE83RCwHBGj2FAFXZX1963hlzHLLGtGXKUCQxBoEGBgbmL7xH9MamN4dGBQCu8+r/+1jEXIAOfUU5rq26kcWopZxuyiLLmWqjv3su8oqUur/U6+7iuCZL//3////////zm5gBGhkEwcZ/////9RD/+hXoobJhKtX7MzEH3ZgKgBgwCowGyPTGpDmMB8B8wAwATAmAHGgXGryC3jnzH//68MOXAjMwQAMYCYE5giA+GIKaacUaaAHD0mBkwaAYjDoGCwWBgYAADAMCQdJA/qb///xICS///////////dlydANAIOCp9Mji8igAUbypaWVQyyJEEGgOGBkQeZLQaRgHACsCMBwBIMBRbaK2qXL+d/eq0ArSR5AAAZgFgFGBAA+YK4LxiZFLnNAXQYpwJ5gngCDQDCBAKAAhUAAuhFe87x0UkXUtXZf/SDqK////////+1jEbwJO7U0gAPqtQcmopBwPTbH////LLVFkClxPqskOtOEAABAUMc4aeZl3cq42pM56tBMA0YNQHpnxADAYIAEAGFgChCa8UzW3/7/v8wl7yNOSOIQDwQBgYC4SJg/H/GnwnyBpZOAYnG4GEAsAECAFAeA0AAWEQw2Vrt///UHeHj//////6vv//+YrzYUCMM4S////qBa8BgQgCCZ67EMDJWJRJJQCQSASCQIgk1CkK7SC+5gIBoGJwCWCgDFAC0SF85nzLLHWWWOG5qOw015aqBwGAxMH8IA01QiQgRooAwRHZG2RusN5f/+xyuyoqIex7H/2BgNP///////////QSib////61QChGAAAENQLIRpyyuqFWmYKbCncOA3/+1jEf4AO2UMhoPqtQcYopajPKiKYBwIZymKIwKY4GBuNCU3sispI79y0NITqFroFQFA0BWDQPwALhQMI8cAFxEgIBUAKAkLKwWAAFxwYAoeXXqv///l4VX/9////9X9b//+p+Oo0f/////rAQQIABR00IyQgkw1rtzKdizqrWAQBJgricGaiCiPAziEAcCgPgoBZ2abHLeX//53ILbI3FS0oAKEgNDBPAHMRwHo5xBhQOcBoDKYHAw0CABAIA8AggAAfEuvU3///H2MT//////////9LyPNav///+pUQPgmPG8Bl2HHfWIW3MBQBowhRjTSVDOMFUCEwDwGzAiA5MBgABncYt0lf9a/m6sPLFLtGAGAQYAAD5gEglGBAGGb/+1jEkIANqUMjoPbOgcQopBwfVagRKkRrwsSga1ZAGFiGCQODMASDQDARBYfipGl67f//1iKi2///////////21C/Pt6xqqxVKMK3AaWAmfpuDIBYgA+MBE0ExORWDAHArAQB5giABlASiroRTXv5r+c7NvAzNsDHwEAoYFoDpg3A0GMGU2eWKRgHm0GBngaAY1EoGDwqBgYGACgcA4KkEWgtl///9YdUiP//////////6epydJdCB5tCQAACA1aPcp5Ep1iDS00thpcoJAEMDAWsyIAYhIC1RowBABg4CF3qW1jll//rWUpdpiKEkEgAGAEAqYDYKBhAFDmqcVUYUAJpgNgGK5dpQVMZICQ/z/T///wMv///p/X6/////1//+1jEpoNOLUUaIPqvAc4oYwA/VeEKh7///9f1f/f/Xu5uig9miSYsAoYFYBJhwBhG1gB2YQwERgJAZGAaC4DQFWMQDQVdU+88cr0oa2sRz03DADAbMCQEQwbw0TFgR4O6BxEDwjgAz2XQMcDQDDgcAwuCwMIAgAohCfzy2ZL///x0kn///////////fMAwcNAXOfrdVgiIAACAzQJEbqQYS4Keq8QdNVQKg0w5eDxSPMIAguQBhELCeEW8D7VutSlk0OSK2D5gshACAMBgiBSBiHKYB1dMKBilA0AoEUNjE9iEQfqKXNl9////WW/+//////////8i5Lf///rD/Z/1O8nLt7msAAgR6i2ZTU7OUcIq0zEm4plCAGzB2Bjakz/+1jEuYNOVUEh4PlPQdGoYkAPVahTAMBmmmDoBiwlNrPXu8t7//zzpJG/LISQABCDZgMLhifWp5DwAHVzgY44Bgw4N3hbwG/gsFIRbWXp///zhL/X/T+mv//6TatX///6xFWp/7fp1cr7/+p3to+mACi/3n2pYr9pL8oxp9WM68xD0IedqKNQQBiYSIjBp1gagoLMEgKiEDswCwBHBiUzasYYY9uY5QSwpW0uyGALAoEEwVQFjEwEvOoQMA6gCRJbmGgEFgISgMlATcLvKfKwhh7mK5jMrt/5Qv////T///9v//7gKhGcEv/+z3/+zb/0iV+qtLZ193Cl5l3HWVekoX0VOXcMAMBEwJAQjC1MJNd0WIweQQzAfAxMEwE8wRD/+1jEy4AN/UUh4PLOkduoI7Qe0eACEr4cl8st1tZY4/hIlql8gCAUFAJxUFQkDdJFsDE5cvMR7garmEDwCHCIrKw4mSmr/XxyQStUtnUl/+WH////////9v//WcBpBPzQD/1eugEUb9fvuGeWHN653DlqWuy3ZbJCAESgMkANAMTZMKgfQhBFCAIyYNUWD5GgAnMgad7hhjjjqUtEVnVWDgAiYCwwPQAzCMAsMdMTE/azCD/ZNNJCAx6ITBobAAUC4RBwBhze+YKu3+y/+SiD///1+q3/p+q3///5gCGGgbzD/0/TX+3k//29/+QiUSIAAAYcDdY+/eIc+sFlsah1rygpgEgGGDEOeZzwPg0DqIABjAGAgAwHLXozW5n/7///+1jE3YMQJUMWT3FYAfmoYgXtxwD1GXKWKXtBoBAAAjMBEG4wXDJzQsPCA/XMDFngw4mQXtC+wLCB4dn+q/1f+pv//t3//+q2ukp///+iQMeZH/s/9rMd/0dDvRX+f/d6/uX583Yryibky10BhgBIACYA0AJGArgJJgpwRkZTsDbmBvAMRgIAC4YC+BQGAcgE5cxl8EbopdWpM8LkoWWX0X2XoMAfAFzATgEYwLsDLMJeEqjTZB786EPAzLGsxgEowsDAwfCEwQBwwpAhGuatWcztneran/7nCWdet/Xrt1q+pn///T///6imCWk66J1H/////+31Pdvq9zI9kuwNfuZk7iMvaw1tlDgNbaw47qPO9kDvw7it6AgGgGmAABX/+1jE4wARCUsOT3IYAeioYvQ/UeAYB4Qpg+LaGf8SyYMwOBgaAUGEeBsHChjwDCebaSOxG+2Kb+xlhxbEwBwBDAVAcMCIDMwPQYjCED1MadpQ/KW3T/ryNBE0w2AAoBzCIMMIA8II6/refMmf3rZ+71fZRQmqbf+39W7ft0////5MBVA+gjb/85r//7OlX8sqEAIH1rVXXf3/a+WX7rUsacJrK0hEACCQFDAQBbMJ1II1YxzzBNAoAgBZgvgkmDqAINAAuM/sak2WN/eGMbdhe7FSqAGYAAEBgRgnmDIGcYtqcp1DtSHa2yZqLBjUXmGwuYWBRgsDhBBVZUq58VdbKWkp29/4/kbq7fpNT///9XQq/t//rUKg8nX/o8596Pz/+1jE5wPUZcMGD/ZYAmwooMHuKwDP///RkmAABlP8zi9BSy3JmtGnkXEiQPARkwOhiBhBHBmAEYVIEJgMgdhQHMKgNKowBZtRnDWGu5xJpKVRakwCACTAZASMDoCcwgQcDGqM5PnQ9Qx0gaTCBAMAwJgiAOCgCIJAODAFIFrYd37VrW/+ZBUstnfQ9v6f//+2v/X//2CL//o+9f53///rUgAAgNNmT9c7jruPcst67vDPC6+jW05AaASYBwGRgzlYmeCJMYI4F5gHgLmBwBSBgdFfyy3SW9WMMf/k++TJkjioAaFgLjANCNMGA8ozqE3zZpgxszMKEAUCBweNAA8PQPnr+rZmS/uydGbBVUbT/8q3nq/o3Pf5n/mf/+p5b///+1jEzQESXUUIr3G4AhyoYTA/HbD/5PRv/LtdX/JGucyf8hxegHFHBAAiwaC8nkCGlAAA75yGFAfMpa+rclDRkAAYAZBoLxgcJZmUYOwYCQHY0AsYMgBQQHaJADNNnpbPYZ8y5yStkUNQTAYAoHASgIG4wfgFTGtFYPmME0MOuCBBDAvAPAICY4AgVAD0nY121jh+ie7bfMFJevoyP9P/R////f//+oQ/81Z3fqQvutf9UsvQiv+CCjHIleJRFrrrJWhwAxgMAAmCWBUYnxyp0AB8GGoAEYBwJRgSBJGCgBaXWXLJKGXS2/hW3qXOqlcCgDTAIAbMAMDwCA9gUTQwGnuTMmmYMFYUcYB6MA8DEwFwASIEkaA+GgcU2M+fZR3/+1jExYETkccPT2z4AhAoYRQfHbDX9Hq3nd40N1Qm3//////////FR9An////8yuU9aZu2XbdCbgRMMwAQAEMAZAHTANADgwIsCfMHqFujPBAxMwVgC4MB0AkjAuwPgwJsBFAQAoX/aI4dJPPHQRStK3wIQAMhADhEADmANAAIGAkzAkACgwS0CLMOmC5DeFhuM/2Mw09GkySGIw8FIwdEMwMDwwpBBU8Hu3anzmkp73up7E5lSc984kC2PCfYjPPfkRDyB//qee/kZP+Z///9AYL///////6Dx//////W+pGPyegkgAAAAAABP3/8/97rYWqPm7csl0SWSnYSgEiACQqhAmA0tIY1hLpgNAuGBMAQYQ4DBEJmPAAK6k1SKX/+1jEuoHP3UMCAXitgui+31X+qwKo33eEqlLTkUSyRgGgKGAcBaYC4LxgeB3mGuxgcX7k5xl3GNiiMhAiAoYJgEJSgfLWr0HclYpcmV6qr97wQcPX/O/UDWvkv/wb///+///1ntvyBQBwqfn1nVPCtDUVcphqKxgEAQmDiTMZ54V4CByKoApgKgQgYGJfr7Smm5vn733OIPvGH/QCGAaAWYHAHxhujjm7aZkfGqmbCxi4WAQMuQXfRFkNS4jU3VrYp7EHd+S///Td8l///////+r31f/5ROSuX1IxhyVxqWSu/ewpoFWuXoMA0AEwNAEDDhDZN3sKIwlwPTAjA5MBgGkwCgEk92xUtqJzGNzV+5k+qcyAUwAgBzANAUMCADP/+1jEo4GRgK8Dz3BYAbiPYXQ/beAwQwljEiQ/Oag6o5YjzJooJgqsEAACAQARBxzJHnzH1IXozk0nrOMdGXZH10P/T/6e8/o5F/nnV/HPqEXeJ/+vcioBvP2znqP/9vDHa1X/vmu75/6rTOOV6/jSt0UrEAAANAXMA4FQwZz4zPTHCMEkEUwGwGzBcAxBwXiNb2PnyXyzuO8fwjbiPM1QRgFmAYBQYGoPJhnGgG1UlmeFJGcnJjQoYMCAYLDggHDT55Xf72dFMtqmX1Z36mnaf5Ff/8///////1Ev//y7/+G1CAAX+iFBuUUooLDLpLlSOCgB5gGgnGDMiaZ7AwxghAQgUAQwTgFgEGigOc1+pTaxvWf5jMvUwFQIs0AgETD/+1jEq4PTPUECD3C4AfqoIEHtiwAfAUME4EUxFyjDnnG9MUEDoHBOhgE6DaHwiADZfamdd16t6WdPrp7SfzVYtTGf///////6hB//+gAQgUC/nlSY+5VbNHCWzqgEgIjByELNBoBcwSABDAAFBUKgIAMBTOqXl3v///SSeHWkp/DIHgARjDeJTdu7jCEUTAAFAKAKYaoFnkQAya9rpb16de26xdpL/b//W7///If////U/6OGQMgcIkGO2rYFQAzAGAWMCMFcwuDDjYWHfMHQFYwJALjBnBiMFEAlGhl8ho917NFdy5Welnytpb0OAWBwJJgvgJGKEMydfQsIu0AcvzDQGBAEKoHIAIpVA/DW0R3vthgRPjgEFIeo+c///6z/+1jEpIGOyUEAoXivQZKPYPQfdZL///8tiAgJbDNO+9LUTzjrzrVWtYjPjEcgdSWEQSmA8kGUpsmBIHMdBwhDQtNBl161UtZdzw19qWv0w5MkhAwgD0cfg0Zl8wbEIgAtVRmjUmarike//02KcTdSBxxw0qMETPSPqUTEA4482cW2aJjwo3q3///xAU///jW/5H//UPv/+off/////9QDHrf6i5CZAAAOVrq9JuQy7ZQWVLPPax4MAkxNYQHsEEDOIQDIAJBwLP7KquP91rX/nUks1Fm0RrBwFBg8gEGieLkYPoBoQBYXbWHZQ8auTDcO3rclRtbWqiiqhhphf/6reT9mVNf70PaBCXr/y4WU2mXtVjuGsZbmq2oZ2BB/Yw7/+1jEvIEOPHj6AXuPAjC+4GjOliHawhd8wIBoxrAM/DRIw3CcwLA8wuDUwEABk9JH6SvWrX/3hnSw811SkRgADATMAxQMLJ/PfIgPpHMSKWi9y1UwmOQIdfSdVbgO5qgeMERj/zawFsf//1ucp/9R5cJdrxO/9Z0t4tXAZgAAAAAACn8nOcIkINWagl6E/xwJGA5qahTBgABtCMJA8mFLzSa/j3HfP5/15i7ROOkQYHgKYxAMeQPOYnA0AgbQALka+7i9r47ke+xdd6riEq7Z//kP/2SPkLP//+of/zqhmAtFcuvy/y/UojAGAHMD8A4wykFTRCELMJwBowAgJjAdAnMEgBdI6UyizMUc5Z5T0NO/TEUTgcAMYAQCpgHgdGD/+1jEwwEOLHUBIffOgbwO3sAu6eB8DSYFqXhs9jkGHuEAYGwEJEAmpaFQAi2MsaH/cMDukIGdS0cxnUdVqCQ9HVZqiql3/oK////+pW///+Uv/8SNBUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV+qWzMUAo1TbgGBWU3FVxIDSqDpQOBiKD5pY85u4h5g6Vhh4JBkeKgoCpAAihcVaS02loYZay12ccpCchE7TBhUMDFUCgYcBxPYBwiBBr0uZk4DhgiEIBCEeE0vmAgRfhymtP1mHQCwNh5Ir/+1jE2AHMHHb3oPOughStG8BfFbGHIrRIqasFHNLM3ytcqvs3N//5SynTgkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+1jEuwPP9NrOAfULyAgAQAGQAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=",
      uiStar: "data:audio/mpeg;base64,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9bVeZf5NL7itzvIJTABwAIwA8AKMAUANzACQEYwDQC1MDdDfDTozZowmEFGMBeAMTAEQBowgTZWMpM6gGBLaZ04bTYdicmgaGrWu6tUV2GZXG8aPWL8vTlOZRHUqmr8dxy+km6Ccp8ZTzVvdWPU1HG7eOVjW7tWWUF3IWDhWJmKhYPFQcEoierHHKQF/IgKxf5n+jf6X/qFyIXoF0IahmilC49R///mMIdoLohfiUA0E0KVAJgawGh38wfn//+hASN//ypANmu3v////5Tx+kuz/+1jE7gHToiLwrxi3AZE1XqGPChJr0RgcAKYBgDpgEgbGAkDCYHocxhSH6nqxRCZMArJg5g4GAAAqDgAgMBaYEoCAcBtUa0CQNISYlLJkuFSImj6pMtsmIJKkpC6SyzuISXpN4KXlCqT6XZbuoy9kvIrdca2ISH8RMODpS/1L8O/jB/+JH1ExdqAwK///wGP////QGDwt//6Cgn8KDH//+AS///qLkoAAKWMqr3pVXlsqlcOxGIQMuVpCYSyxIBUwHwEDAjBCCgLpgLAvGASEaYeaCht5viGwCWEYHwZJghAAGBoBaYEYFxgNAjmBQAC8DfMNfRg0NROBYalaAASM8hUaVq4pE1asiKkudYlSatChQsqyWJpoWatDKW37pEv/+1jE8oOZ+hTfD+VTQnBC20HklqAQsy31506OgtElk/6c1Dl9jnN/NY6o1PBaLR4fB6UJf746RQbEh0iIxhxv///uarf/6OPAuB0/YbFCX/VvNU05///joLQclgAgq3Ldmmq1K9ymnHXW4LCMwzLYQfFODjEd1TA5pmSRnF5jYRJJMFAAEAAsRAqBKUwxgyIsMGEwtC1IlYJaa6Ght64zsvtAUFwxF5NPBIMJEiCaC0SRpxx8XlScWXDEoiVIlUGrpV/6f/ldTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1jEwgBYAhjKzyT2waqST9WNGhlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=",
      uiRow: "data:audio/mpeg;base64,SUQzBAAAAAAAW1RFTkMAAAAVAAADU291bmQgR3JpbmRlciA0LjQuMQBUQ09QAAAADwAAA0FsYW4gTWNLaW5uZXkAVFNTRQAAAA8AAANMYXZmNjIuMTIuMTAwAAAAAAAAAAAAAAD/+1jAAAAAAAAAAAAAAAAAAAAAAABJbmZvAAAADwAAAAMAAASAAICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwP///////////////////////////////////////////wAAAABMYXZjNjIuMjgAAAAAAAAAAAAAAAAkBSAAAAAAAAAEgBfTdCoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+1jEAAAOiRtP9IWAAiO4br8w0AJQhAAAAAAAACkf+vnSpLDsG4flAoAHADADAnLwSABAEB8UHYOwdg7DSthubv4Yxlf////+9jGU83Nz9m5ubm5uffcPe973v0B3m9sNDRlPZUvfDGSaGjGf/////sYykx2GlJm58+Iz/D//8uH/+Qhj////BCIdmUiMAESMiNuJAAFKQSALCd10W8q7rJOabt+3hbbN+NP0E3CrEgTSs2FYvF8kVGpYTVAtgyycPBAkXPGxedIvHnLCcUHSNlHUFpJObS4O0fEVJWpK9H/dK1iXT/1rb/9TXWdHpU36TmYvH1f9BNS/Zk66lqTSZO69T/f6///01f1fy+pxJP6FKhN/wAAFWwFX9fKqrML/+1jEBoEP4idFvIiAAg/E4qBctaDeSCkBUBUpACwLKhxHRzSdRKJAiLEWJ5J2LxtWgXkjYxNUC6i3qLyi8bGJdNTI2V9WpFFFH3rapJJJL1o/1Ja0nUkkklb6kvWiijScvECIMovkVNUVIooqMUF//////1N/1UldaWj7N////////Wj6KJ6CE4JfqXMowLehm5aUQKnM+hA48CQqW5SrCm3Zy1Tbw/GJRbaNEyUtkn9T+palJUS6g6KP1t113/rZKl6qnMR7JnC8s1qSQek5kXlqUmgPYzNVGw4RikoFuAAmBGiVCpArw8jEnFMepOHkXnUjS//////+v/////////9KkpLotzIvJFt8bv6uTYJApAKBSAUKTCRSaJ2zct//+1jECoPNWhzgAyBZCAAANIAAAATJWkXRJFwuTjS42W//8x00z/800WsXXxE1fax+sWsXPP2sWv//szmlObBxLrTSqB8CkMiIIy8wPFRo45UUEdlYysb////////////////6yocqOUNKSUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=",
    }
  };

  /* ===================================================================
     6. GAME — ARCIDER: an arc craft carves up an endless neon highway.

     THE CAMERA. This is a chase view, the way a 16-bit hover racer did it: the
     camera rides `camZ` progress px behind the craft and everything on screen is
     one pinhole projection through a single scale factor,

         k = camZ / (p - camP)          1 at the craft, 0 at the horizon

     so the road, the traffic and the exhaust all rush the lens at the same rate
     and read as one solid space. The speed lives in that rate, and it is fed by
     three things at once: the tarmac banded so it strobes past, a fan of warp
     streaks out of the vanishing point, and a lens that opens up as the craft
     winds out.

     STEERING. The craft never stops moving forward and it never steers itself:
     the side of the screen that is HELD sets the lean, and the lean is what
     moves it sideways. Release and it straightens. That is the whole input — one
     finger, two sides, no button to go straight. The camera EASES after the
     craft rather than being welded to it, which is what makes a bend feel like a
     bend: the craft slides out to the side of the frame while the camera catches
     up.

     THE ROAD IS THE OPPONENT. The tarmac is a curve, not a corridor: its centre
     line is two sines of the progress and its elevation a third, so it sweeps
     left and right and climbs and drops while the craft only ever moves
     sideways. Following it is the ride; leaving it is punished rather than fatal
     — off the tarmac the craft loses `offDrag` of its speed, kicks gravel and
     drops its chain, and losing speed in this game means losing places.

     AND IT FORKS. Every `forkEvery` the road peels open around a wedge of
     gravel and runs as two ribbons before merging back: one is paved with
     charge cells, the other with boosters and the mines that guard them. This
     is THE decision of the run, and it is a hard one because the two things
     the player needs are never on the same branch — a single road carries no
     charge at all, so the shield only ever comes back on the slow line, and
     the board only ever climbs on the fast one.

     COORDINATES. `p` is PROGRESS: world pixels travelled up the road. Items live
     at { p, br, off }: p up the road, `br` the branch they hang off (-1, 0 or
     +1) and off in design pixels from THAT ribbon's centre — so a cell dropped
     in the middle of the tarmac stays in the middle of the tarmac however hard
     the road bends, and a cell on the left branch of a fork rides that branch
     out and back in with it. Nothing in the simulation knows about the
     projection; only section RENDER does.

     TWENTY PILOTS START AND A HANDFUL FINISH. The player starts LAST, and the
     ranking is not a statistic bolted on the side: the rivals are real craft
     on the same road, each cruising at its own share of the base speed, and a
     place changes hands the moment one is physically overtaken. Clipping one
     costs shield, so the board is climbed by out-driving the pack and not by
     shouldering through it.

     THE CUTS ARE THE CLOCK. At `cuts[i].at` metres the field is trimmed to
     `cuts[i].rank` — 15th, then 10th, then 5th. Miss one and the run is over
     however healthy the shield is. The LAST entry of the table is the
     chequered flag and it is not a cut: it ends the race for whoever reaches
     it, in whatever place, and the two pilots the schedule keeps in front of
     it are what the win is fought over (see `lastFoes`).
     Between two cuts the player is asked the same question over and over: the
     charge branch and stay alive, or the fast branch and climb. Both are
     right, never at the same time, and the cut counting down in the HUD is
     what makes the wrong one hurt.

     THE SHIELD IS NOT FUEL. Nothing takes it off for going fast; it only ever
     comes off on contact — a mine, a barrier, another pilot, a bad landing —
     and only the charge branch of a fork puts it back. At zero the craft is
     out, wherever it sits on the board.
     =================================================================== */
  var Game = (function () {
    var TAU = Math.PI * 2;
    var T = CONFIG.play;
    var LAD = CONFIG.ladder;

    /* ── THE LEVEL, AND WHAT IT MAKES OF THE ROAD ────────────────────────
       `applyLevel(d)` is the web target's escape hatch (see docs/LEVELS.md):
       the level layer lerps the manifest's knobs first and then hands the
       game its own difficulty, 0 at the foot of the climb and 1 at the top.
       Everything a lerp cannot say goes here — the biome, the level's fixed
       road, the cuts the race is actually run over, and which hazards exist
       at all this early.

       `BIO` is the biome in force and `TRACE` the level's row of
       `CONFIG.ladder.road`, or null when there is no level: the playable and
       the endless bonus run both land there and keep the game exactly as it
       was designed, which is why every read of these two has a fallback. */
    var BIO = LAD.biomes[0], TRACE = null;

    /* The difficulty the level layer handed over, kept because the FIELD is
       built from it too (see foeGrid): null on the playable and on the endless
       run, which have no level and take the whole catalogue of pilots. */
    var levelD = null;

    /* The four road knobs `applyLevel` overwrites are NOT in the manifest's
       tune table — they are computed here — so nothing else would put them
       back for a run with no level. Snapshotted at load, restored on null. */
    var ROAD0 = { bendLong: T.bendLong, bendShort: T.bendShort,
                  bendKShort: T.bendKShort, hillAmp: T.hillAmp, hillK: T.hillK,
                  cuts: T.cuts, wallFrom: T.wallFrom };

    /* The objective in METRES, off the manifest's own range — the same lerp
       packages/webshell/levels.js runs, read from the same block, so the arch
       the player drives at and the number the map promises can never drift.
       The literals are the fallback for a build with no `web` block at all. */
    function goalOf(d) {
      var o = (CONFIG.web && CONFIG.web.levels && CONFIG.web.levels.objective) ||
              { from: 200, to: 1300, step: 25 };
      var step = o.step || 1;
      return Math.round((o.from + (o.to - o.from) * d) / step) * step;
    }

    /* THE RACE IS AS LONG AS ITS THIRD STAR. Three stars is 2.2x the
       objective (levels.js, starsFor) and the chequered arch ends the round
       outright, so an arch standing anywhere else is either unreachable — the
       shipped ladder asked for 1300 m on a road that stopped at 1020 — or a
       finish that pays less than driving past it would. Putting it exactly on
       the third star's distance ends the race and the level on the same metre,
       which is the only way both can be true. What that metre PAYS is then the
       place it was reached in, and nothing else — see `raceStars`.

       The cuts below it are evenly spaced up to the arch, and there are fewer
       of them low down: two gates is a sprint, four is a race. The ranks walk
       from the field size down to the podium, so a cut always asks for the same
       SHARE of the field however big it is. */
    /* WHERE THE i-TH GATE STANDS, as a share of the race. The sections shrink
       by one unit each — `S + 3 - i` — so the race tightens as it is driven
       and the run-in is the shortest stretch of it, which is what two
       overtakes wants: a sprint and not a stretch. Even sections were tried
       and they are the one shape this cannot use: they pull the first gate to
       a quarter of the race, and the six passes it asks for then land on a
       craft that has barely left `speedMin` — the field arrives as contact
       rather than as traffic, and at the top of the ladder, where a shield
       holds two crashes, that is where the run ends. */
    function cutAt(i, S) {
      var tot = 0, cum = 0, j;
      for (j = 1; j <= S; j++) tot += S + 3 - j;
      for (j = 1; j <= i; j++) cum += S + 3 - j;
      return cum / tot;
    }

    function cutsFor(d) {
      /* CEILED, and that is not cosmetic. The shell's third band is
         `value >= goal * 2.2` in floating point, and 200 * 2.2 is
         440.00000000000006 — an arch standing at 440 would be crossed with the
         band still unearned, and a race won in first place would pay two
         stars. The ceiling puts the flag on the first metre that clears the
         threshold however the double falls. */
      var finish = Math.ceil(goalOf(d) * 2.2), P = T.pilots;
      var n = d < 0.25 ? 2 : d < 0.6 ? 3 : 4, i, rank, out = [];
      /* The ladder walks the field down to the podium over the CHECKPOINTS, and
         the flag is not one of them — it asks for first place because that is
         what the run-in is for, and it eliminates nobody (see checkCut). */
      for (i = 1; i <= n; i++) {
        rank = i === n ? 1
             : Math.min(P - 1, Math.max(4, Math.round(P - (P - 3) * (i / n))));
        /* THE GATES DIVIDE THE RACE AND THE GRID FOLLOWS THEM. They used to be
           placed off the pass schedule — a gate asking for five places stood
           where the schedule had already handed five over — and that ordering
           is now the other way round: `seedRivals` deals the field into the
           sections these gates cut, so a gate is always driven at with more
           places already taken than it asks for, whatever it is spaced at.
           Even spacing is then the honest one, because the sections ARE the
           race's beats and a beat is a length of road, not an arithmetic.

           The LAST one is the exception: it stands on `finish`, which is the
           third band and is never rounded — the objective moves in steps of
           25 m so 2.2x it is a whole number of metres, and an arch rounded up
           would sit past a threshold that had already stopped the round, so the
           chequered flag would never be reached. The gates below it are
           landmarks and round to ten. */
        out.push({ at: i === n ? finish : Math.round(finish * cutAt(i, n) / 10) * 10,
                   rank: rank });
      }
      return out;
    }

    function applyLevel(d) {
      var n = CONFIG.level | 0, i, w, u, k, lim;
      levelD = (!n || d == null) ? null : d;
      if (!n || d == null) {
        // No level: the playable, or the endless run at 90/90. Put the road
        // back the way the file wrote it and let reset() roll its own phases.
        BIO = LAD.biomes[0]; TRACE = null;
        for (i in ROAD0) if (ROAD0.hasOwnProperty(i)) T[i] = ROAD0[i];
        return;
      }

      // The biome is the stretch of the climb the LEVEL NUMBER sits in, not
      // the difficulty: two roads out of a fork have to wear the same sky.
      BIO = LAD.biomes[0];
      for (i = 0; i < LAD.biomeFrom.length; i++) {
        if (n >= LAD.biomeFrom[i]) BIO = LAD.biomes[i];
      }

      /* The trace. The table's weights say what kind of road it is and `d`
         says how hard it is driven, so a level keeps its character all the way
         up the climb instead of every road converging on the same wiggle. */
      TRACE = LAD.road[(n - 1) % LAD.road.length];
      w = TRACE;
      T.bendLong   = (60 + 240 * w[4]) * (0.70 + 0.50 * d);
      T.bendShort  = (8 + 112 * w[5]) * (0.60 + 0.70 * d);
      T.hillAmp    = Math.min(170, Math.round((20 + 145 * w[6]) * (0.60 + 0.60 * d)));
      T.bendKShort = ROAD0.bendKShort * w[7];
      T.hillK      = ROAD0.hillK * (0.7 + 0.5 * w[7]);

      /* THE ROAD MAY NEVER OUT-STEER THE CRAFT. A bend's amplitude and its
         frequency multiply into one number — how fast the tarmac travels
         sideways under a craft going flat out, `sum(amp * k) * speedMax` in
         px/s — and the table moves both at once, so a slalom at the top of the
         climb worked out at 964 px/s against a craft that steers at 720. That
         is not a hard level, it is a road nobody can stay on.

         So the two amplitudes are scaled down together until the drift fits a
         share of `steer` that the climb itself decides: 0.30 at the foot and
         0.60 at the top, against the 0.42 the shipped endless road sits at.
         Scaling BOTH keeps the trace's character — the shape is the same road,
         driven shallower — and it falls on the high-frequency traces first,
         which is why a slalom comes out tight and shallow and a sweeper comes
         out long and wide. Nothing is clamped when the trace already fits. */
      k = T.bendLong * T.bendKLong + T.bendShort * T.bendKShort;
      lim = T.steer * (0.30 + 0.30 * d) / T.speedMax;
      if (k > lim) { T.bendLong *= lim / k; T.bendShort *= lim / k; }
      T.bendLong = Math.round(T.bendLong);
      T.bendShort = Math.round(T.bendShort);

      T.cuts = cutsFor(d);

      /* ONE NEW OBJECT AT A TIME. Below its unlock level a hazard is forced
         to zero whatever the lerp made of it, so the first levels are a road
         with barriers on it and nothing else, and every band after that adds
         exactly one thing the player has not met. */
      u = LAD.unlock;
      if (n < u.wall)  T.wallFrom = 2;      // over 1: a row never becomes a wall
      if (n < u.bomb)  T.bombChance = 0;
      if (n < u.ramp)  T.rampChance = 0;
      if (n < u.solid) T.rampSolid = 0;     // a ramp wall always keeps its gate
    }

    /* Hit sizes, deliberately generous on the rewards and tight on the blockers:
        a playable should bias toward the player succeeding. The cell is an
        ELLIPSE rather than a circle and it is as wide as the craft's own
        silhouette — a chase view draws the machine 90 px across, and a 42 px
        circle let cells slide visibly under it without being collected. */
    var HIT = { cellX: 62, cellY: 46, boost: 58, block: 30, ramp: 46,
                bombX: 40, bombY: 40 };

    /* WHERE A CALLOUT LANDS ------------------------------------------------
       The craft rides low and the traffic streams out of the vanishing point
       towards it, so a callout on a fixed anchor keeps landing on the very row
       the player is reading. Every Pop asks popSpot() at fire time and gets the
       candidate furthest from the craft. Fractions of the Layout band; the motor
       clamps x so the outer columns can sit closer to the frame's edges than its
       own anchors.

       Those outer columns are nevertheless held well off the edges: the shield
       gauge lives down the left one (see drawShieldRail) and a callout is the
       one thing on screen wide enough to cover the shield running out. The
       right column keeps the same inset, because a callout hanging off one
       edge of the frame and not the other reads as a layout bug. */
    var POP_SPOTS = [
      [0.22, 0.17], [0.50, 0.15], [0.78, 0.17],
      [0.21, 0.34], [0.79, 0.34],
      [0.21, 0.50], [0.79, 0.50],
      [0.22, 0.68], [0.78, 0.68]
    ];
    var lastSpot = -1;
    function popSpot() {
      var bestI = 0, bestD = -1, i, s, x, y, d, cxs = craftX(), cys = craftY();
      for (i = 0; i < POP_SPOTS.length; i++) {
        s = POP_SPOTS[i];
        x = Layout.left + s[0] * Layout.w;
        y = Layout.top + s[1] * Layout.h;
        // Vertical clearance is worth more than horizontal here: the traffic
        // streams down the middle of the frame, so a spot high up and out to a
        // side is the one the player is not currently reading.
        d = Math.abs(x - cxs) + Math.abs(y - cys) * 1.6;
        if (i === lastSpot) d *= 0.5;                 // never twice in a row
        if (d > bestD) { bestD = d; bestI = i; }
      }
      lastSpot = bestI;
      s = POP_SPOTS[bestI];
      return { x: Layout.left + s[0] * Layout.w, y: Layout.top + s[1] * Layout.h };
    }

    // --- world -------------------------------------------------------------
    // The four phases default to 0 so the road can be sampled (by fitCanvas, on
    // the very first layout) before the first reset() seeds them.
    var items = [], trail = [], phA = 0, phB = 0, phC = 0, phD = 0;
    // The other nineteen pilots, and the draw list the painter sorts them into
    // with the items so a rival can pass behind a mine.
    var rivals = [], paint = [];

    // --- run state ---------------------------------------------------------
    // Seeded from the first frame: fitCanvas() runs (and asks the game to
    // re-measure) before the first reset().
    var camP = 0, runT = 0, speed = T.speedMin, mult = 1, dist = 0, travel = 0;
    var kmhShown = 0;                 // the speedometer's own eased figure
    var bx = 0, lean = 0, side = 0, touchSide = 0, keySide = 0, held = false;
    var air = false, airT = 0, airMax = 1, airFrom = 0, airZ = 0;
    var shield = T.shieldStart, boostT = 0, crashT = 0, invT = 0;
    var warnT = 0, lowShown = false, trailT = 0, dmg = 0;
    var chain, cells, boosts, pick, passed, hits;
    var nextP, nextMile, lastPop, lastLostPop, best, forkTry;
    // --- the race ----------------------------------------------------------
    // `rank` is 1 + however many rivals are physically up the road, recomputed
    // every frame; `cutI` is the next wall in CONFIG.play.cuts.
    var rank = T.pilots, fieldSize = T.pilots, cutI = 0, cutWarned = false;
    // The chequered flag was crossed — the one thing that pays more than a
    // single star (see raceStars).
    var finished = false;
    // What the HUD pills currently read, so they are only rewritten on a change.
    var shownShield = -1, shownRank = "", shownNeed = "";

    /* --- the shield rail (see drawShieldRail) -----------------------------
       `shieldLag` is the ghost head that trails the real shield, so the band
       between the two can flash white for charge won and red for charge lost;
       `shieldSeen` is what the rail last knew, which is how a change is noticed
       without every call site having to announce itself. `railPunch` is the
       discharge a change leaves on the rail and `railT` the clock its alarm
       pulses on. */
    var shieldLag = T.shieldStart, shieldSeen = T.shieldStart;
    var railPunch = 0, railCol = "#5cffb0", railT = 0;

    // The lateral velocity a mine's blast leaves on the hull, and the roll that
    // rides with it. Both bleed off on T.kickDrag.
    var kick = 0, kickRoll = 0;

    // Barrier debris, in world coordinates: { p, x, z, vp, vx, vz, rot, vr, ... }
    var shards = [];

    /* The mines and barriers on the road, refreshed once a frame for the pack to
       steer around (see collectHazards). The array is reused between frames and
       only `hazN` moves, so nineteen pilots reading the road every frame costs
       one walk over the item list and no allocation at all. */
    var hazards = [], hazN = 0;

    /* --- the camera --------------------------------------------------------
       `camX` is where the camera sits across the road. It eases towards the
       craft instead of being welded to it, which is the whole reason a bend
       feels like a bend: the craft slides out to the side of the frame while the
       camera catches up, exactly the way an arcade chase camera behaves.
       `fov` opens the lens with speed, `fovZ` and `elevCar` are the two values
       the projection needs and are refreshed once per frame. */
    var camX = 0, fov = 0, fovZ = T.camZ, elevCar = 0;

    // --- cached per layout ---------------------------------------------------
    var horizonY = 0, anchorY = 0, span = 0, halfW = 0, skyBase = 0;
    var skyGrad = null, plainGrad = null, fogGrad = null, sunGrad = null;
    var stars = [], towers = [], rows = [], rowN = 0, farI = -1;
    /* The two tarmac tones, ramped from their own average (see metrics). A
       band that covers ONE stripe of road shows the alternation in full; past
       two and a half it is flat, because there is no single tone left to be
       right. Progress covered is the criterion and not height on screen: a
       band's height says how big it looks, and what shimmers is how much road
       it is being asked to stand for. */
    var tarmacOn = [], tarmacOff = [];
    var FADE_N = 8, FADE_FULL = 1.05, FADE_FLAT = 2.5;
    // The shield rail, in design px. Rebuilt by metrics() with everything else.
    var shieldRail = { x: 0, y: 0, w: 0, h: 0 };
    // How hot each rail is burning right now: the side the craft leaves flares,
    // so the way back onto the tarmac is never ambiguous.
    var railGlow = { l: 0, r: 0 };

    // Two "#rrggbb" mixed at t. Layout-time only — never per frame.
    function mixHex(a, b, t) {
      var out = "#", i, ca, cb, v;
      for (i = 1; i < 7; i += 2) {
        ca = parseInt(a.substr(i, 2), 16);
        cb = parseInt(b.substr(i, 2), 16);
        v = Math.round(ca + (cb - ca) * t);
        out += (v < 16 ? "0" : "") + v.toString(16);
      }
      return out;
    }
    /* Which rung of the ramps a band spanning `sp` progress px lands on, and
       the same number the kerbs, the centre line and the shoulder read to know
       whether they are still one stripe or an average of several. 0 is flat. */
    function fadeI(sp) {
      var u = (FADE_FLAT - sp / T.seg) / (FADE_FLAT - FADE_FULL);
      var i = Math.round(u * FADE_N);
      return i < 0 ? 0 : i > FADE_N ? FADE_N : i;
    }

    function diff() { return Math.min(1, dist / T.diffFull); }

    /* ====================================================================
       THE PROJECTION — the only perspective in the file

       A point in the world is (x, p): how far across the road it sits and how
       far along it. The camera rides at `camP`, `camZ` progress px behind the
       craft, and the whole picture is one scale factor:

         k = camZ / (p - camP)      1 at the craft, 0 at the horizon

       Multiply a world width by k to get a screen width; lerp from the horizon
       by k to get a screen row. That is it — the road, the roadside floats, the
       traffic and the thrust wash all go through these three functions, so they
       rush the camera at exactly the same rate and the depth reads as one solid
       space instead of a stack of parallax layers.
       ==================================================================== */

    function kAt(p) {
      var z = p - camP;
      if (z < 6) z = 6;                  // never divide straight through the lens
      return fovZ / z;
    }
    // The road climbs and drops. Only the difference against the craft's own
    // height matters: that is what tips the road up out of a dip and lets a
    // crest hide what is behind it.
    function elev(p) { return T.hillAmp * Math.sin(p * T.hillK + phD); }
    function screenY(p, k) { return horizonY + (span + elevCar - elev(p)) * k; }
    function screenX(x, k) { return halfW + (x - camX) * k; }

    /* WHERE THE CRAFT IS. The camera rides at `camP` but the craft rides `camZ`
       ahead of it, and THIS is the progress the simulation runs on: every hit
       test, the off-track test and the steering leash all read craftP(), never
       camP. Testing at the camera instead would resolve a collision a quarter of
       a second after the player watched the craft go through it. */
    function craftP() { return camP + T.camZ; }

    // Refreshed before anything reads the projection, so update() and render()
    // always agree on where the craft is.
    function lens() {
      fovZ = T.camZ * (1 + fov);
      elevCar = elev(craftP());
    }
    // Where the craft draws. The clamp is a safety rail for a violent bend: the
    // sprite the player controls may never leave the frame.
    function craftX() { return clamp(halfW + (bx - camX), 104, view.w - 104); }
    function craftY() { return horizonY + span * (1 + fov) - airZ * T.airLift; }

    /* ====================================================================
       THE ROAD
       ==================================================================== */

    function roadHalf(p) {
      return T.halfBase - T.halfShrink * diff() + T.halfWave * Math.sin(p * T.widthK + phC);
    }
    /* The centre line, in world px. Nothing clamps it: the camera follows the
       craft, so a bend simply drags the vanishing point across the skyline
       instead of pushing the tarmac off the edge of the frame. */
    function roadX(p) {
      return view.w * 0.5
           + T.bendLong  * Math.sin(p * T.bendKLong  + phA)
           + T.bendShort * Math.sin(p * T.bendKShort + phB);
    }
    /* THE FORK. A fork is one record — the progress the tarmac opens at and the
       progress it merges back at — and everything else is derived from it: how
       far apart the two ribbons are on a given row, how wide each one is, where
       an item hangs, where the gravel starts. Deriving it all from `forkAmt`
       is what stops the geometry the renderer draws and the geometry the
       collision reads from ever disagreeing. */
    var forks = [];

    // 0 on a single road, 1 with the branches fully apart. Smoothstepped at
    // both ends, so the tarmac peels open and closes instead of snapping.
    function forkAmt(p) {
      var i, f, t;
      for (i = 0; i < forks.length; i++) {
        f = forks[i];
        if (p <= f.a || p >= f.b) continue;
        t = Math.min((p - f.a) / T.forkFade, (f.b - p) / T.forkFade, 1);
        return t * t * (3 - 2 * t);
      }
      return 0;
    }
    // Half width of ONE ribbon, and how far off the centre line it runs. Both
    // collapse onto the single road at t = 0, which is why the same two
    // functions serve the whole file.
    function branchHalf(p, t) { return roadHalf(p) * (1 - T.forkNarrow * t); }
    function branchOff(t) { return T.forkSep * t; }
    // The centre of the ribbon the craft is currently closest to.
    function branchCentre(p) {
      var t = forkAmt(p), c = roadX(p);
      if (t <= 0) return c;
      return bx < c ? c - branchOff(t) : c + branchOff(t);
    }

    // 0 with both skids on the tarmac, 1 fully out in the gravel. Inside a fork
    // the wedge between the two ribbons is gravel like any other shoulder — it
    // punishes a rider who commits to neither branch.
    function offAmount() {
      var p = craftP(), t = forkAmt(p), c = roadX(p), hb = branchHalf(p, t) - T.tyre, o, d;
      if (t <= 0) d = Math.abs(bx - c) - hb;
      else {
        o = branchOff(t);
        d = Math.min(Math.abs(bx - c + o), Math.abs(bx - c - o)) - hb;
      }
      return d <= 0 ? 0 : Math.min(1, d / T.offSpan);
    }

    /* ====================================================================
       WHAT COMES DOWN THE ROAD
       ==================================================================== */

    function slotGap() { return (T.slotFar - (T.slotFar - T.slotNear) * diff()) * Rand.range(0.9, 1.15); }

    // Which step of the opening chain the next booster is (see spawnBoost).
    var openWeave = 0;

    /* THE OPENING STRETCH OF A FIRST-BIOME LEVEL: the road from the line to
       the first checkpoint, on the six levels that wear the first sky. `p` is
       progress in world px and a cut is in metres, which is the one conversion
       here. The playable and the endless run have no level and never qualify —
       both of them are the game as it was designed. */
    function openRoad(p) {
      return levelD != null && BIO === LAD.biomes[0] && T.cuts.length > 0 &&
             p < T.cuts[0].at * T.pxPerM;
    }
    function gateGap() {
      var k = clamp((diff() - T.wallFrom) / (1 - T.wallFrom), 0, 1);
      return T.gateWide - (T.gateWide - T.gateTight) * k;
    }
    /* `br` is the ribbon the item hangs off: 0 on a single road, -1 or +1 on
       one branch of a fork. The offset is clamped to THAT ribbon, so an item
       can never be laid in the wedge of gravel between two branches. */
    function place(p, off, type, br) {
      var h = branchHalf(p, forkAmt(p)) - 34;
      items.push({ p: p, off: clamp(off, -h, h), type: type, br: br || 0,
                   seed: Rand.range(0, TAU), used: false });
    }

    /* IS THERE A PAD IN THE WAY? One walk over the live item list, which is a
       few dozen entries and is only ever asked at spawn time. `p`/`x` are the
       progress and the offset the mine would be laid at, on ribbon `br`. */
    function padNear(p, x, br) {
      var i, it, base = ribbonX(p, br || 0);
      for (i = 0; i < items.length; i++) {
        it = items[i];
        if (it.type !== "boost" || (it.br || 0) !== (br || 0)) continue;
        if (Math.abs(it.p - p) > T.padClear) continue;
        if (Math.abs(itemX(it) - (base + x)) > T.padClearX) continue;
        return true;
      }
      return false;
    }

    /* LAY A MINE — but never across the way into a booster (see `padClear`).
       It is pushed to the other side of the ribbon first, and dropped
       altogether when even that is not clear: a scatter with a hole in it is
       still a road to weave through, and a pad nobody can reach is not a
       reward at all. */
    function placeBomb(p, off, br) {
      var h = branchHalf(p, forkAmt(p)) - 54;
      if (!padNear(p, off, br)) { place(p, off, "bomb", br); return; }
      off = -clamp(off, -h, h);
      if (Math.abs(off) < h * 0.6) off = (off < 0 ? -1 : 1) * h * 0.8;
      if (padNear(p, off, br)) return;
      place(p, off, "bomb", br);
    }

    /* LAY A BOOSTER, and it always wins: a mine already inside its box is
       LIFTED OFF the road rather than the pad being moved. The generator lays
       a scatter and then rolls the next slot, so a pad can perfectly well be
       rolled 150 px past the last mine of one — and when the two meet, the
       thing that has to survive is the one the player is racing towards. */
    function placePad(p, off, br) {
      var i, it, base = ribbonX(p, br || 0);
      for (i = items.length - 1; i >= 0; i--) {
        it = items[i];
        if (it.type !== "bomb" || (it.br || 0) !== (br || 0)) continue;
        if (Math.abs(it.p - p) > T.padClear) continue;
        if (Math.abs(itemX(it) - (base + off)) > T.padClearX) continue;
        items.splice(i, 1);
      }
      place(p, off, "boost", br);
    }

    /* A SCATTER OF MINES, laid in a lateral sweep so threading it is a weave
       and not a single dodge. They are the reason a shield runs down at all on
       an open road, and they get denser as the field thins out. */
    function spawnBombs(p) {
      var h = roadHalf(p) - 54, n = Rand.int(T.bombMin, Math.round(T.bombMin + (T.bombMax - T.bombMin) * diff()));
      var amp = h * Rand.range(0.45, 0.95), ph = Rand.range(0, TAU), i;
      for (i = 0; i < n; i++) placeBomb(p + i * T.bombStep, amp * Math.sin(ph + i * 1.25), 0);
      nextP = p + n * T.bombStep + slotGap() * 0.6;
    }

    /* THE FORK, laid down in one go: the record the geometry reads from, plus
       the two lines that make the choice worth making. One branch is a long
       weave of charge cells — the ONLY shield in the game — and the other is a
       run of boosters with mines laid between them, which is speed and places
       and a real chance of arriving at the merge worse off than you left.
       Whichever the player commits to, they come out on the same road, so a
       fork costs nothing but the decision itself. */
    function spawnFork(p) {
      var a = p + 240, b = a + T.forkLen, side = Rand.chance(0.5) ? -1 : 1;
      var n, i, q, run, pads = [], gaps = [], q0, lo, hi;
      forks.push({ a: a, b: b });

      // the charge branch
      run = T.forkLen - T.forkFade * 1.4;
      n = Math.max(3, Math.floor(run / T.forkCells));
      for (i = 0; i < n; i++) {
        q = a + T.forkFade * 0.7 + i * T.forkCells;
        place(q, (branchHalf(q, 1) - 60) * 0.72 * Math.sin(i * 1.15), "cell", side);
      }

      // the speed branch...
      q0 = a + T.forkFade * 0.85;
      for (i = 0; i < T.forkPads; i++) {
        q = q0 + (i + 0.5) * run / T.forkPads;
        placePad(q, Rand.range(-26, 26), -side);
        pads.push(q);
      }
      /* ...and the mines that make it cost something, laid in the GAPS between
         the pads and never on the way into one. A branch is barely 330 px wide
         while it is split, so there is no room out here to put a mine beside a
         booster — the separation has to be along the road, which is what these
         gaps are. The widest are filled first (the mouth and the run out to the
         merge are half-gaps, the pads' own intervals are the roomy ones), and a
         mine with nowhere clear to sit is simply not laid: at the top of the
         ladder the tune asks for four and the geometry hands over what fits.
         The fast line stays the dangerous one; it stops being a fenced one. */
      gaps = [];
      for (i = 0; i <= pads.length; i++) {
        lo = i ? pads[i - 1] : q0;
        hi = i < pads.length ? pads[i] : q0 + run;
        gaps.push({ mid: (lo + hi) * 0.5, w: hi - lo });
      }
      gaps.sort(function (x, y) { return y.w - x.w; });
      for (i = 0; i < T.forkBombs && i < gaps.length; i++) {
        q = gaps[i].mid;
        placeBomb(q, (branchHalf(q, 1) - 54) * (Rand.chance(0.5) ? 0.75 : -0.75), -side);
      }

      nextP = b + slotGap() * 0.9;
      forkTry = b + T.forkEvery;
    }

    /* BLOCKERS. Early on they are a scatter to weave between; past `wallFrom`
       they line the tarmac with a single gate, which is the beat the run builds
       towards. The gate often holds a reward: threading it has to pay, or the
       player only ever learns what NOT to do. */
    function spawnBlocks(p) {
      var h = roadHalf(p) - 34, half = gateGap() * 0.5, gx, x, n, i, prev;
      if (diff() < T.wallFrom) {
        n = Rand.chance(0.4) ? 2 : 1;
        prev = -1e9;
        for (i = 0; i < n; i++) {
          x = Rand.range(-h, h);
          if (Math.abs(x - prev) < 200) x = prev + (x > prev ? 200 : -200);
          place(p + Rand.range(-18, 18), x, "block", 0);
          prev = x;
        }
      } else {
        // Filled from each rail INWARD to the gate, rather than dropped on a
        // grid: the gate is then exactly `gateGap` wide wherever it sits, and
        // the blockers always reach the rails instead of leaving a hole there.
        gx = Rand.range(-h + half, h - half);
        for (x = -h; x < gx - half; x += T.blockStep) place(p + Rand.range(-14, 14), x, "block", 0);
        for (x = h; x > gx + half; x -= T.blockStep) place(p + Rand.range(-14, 14), x, "block", 0);
        // Threading the gate has to pay, or the player only ever learns what
        // NOT to do — and on an open road the only thing worth paying with is
        // speed, because charge lives in the forks.
        if (Rand.chance(0.55)) placePad(p, gx, 0);
      }
      nextP = p + slotGap();
    }

    /* A RAMP AND THE WALL IT EXISTS FOR — the only reason a ramp is on the road
       at all. Most of the time that wall runs rail to rail with no way through
       it: the jump IS the way past, the ramp sits `rampWall` ahead of it in
       plain sight, and a rider who ignores it eats the wall for a crash rather
       than for the run. The rest of the time the wall keeps an escape gate on
       the far side of the road, so the beat does not become one single note.
       Either way a booster sits in the landing zone, so flying it pays twice. */
    function spawnRamp(p) {
      var h = roadHalf(p) - T.rampHalf - 12, rx = Rand.range(-h, h);
      var pw = p + T.rampWall, hw = roadHalf(pw) - 34, g = T.rampGate, gx, x;

      place(p, rx, "ramp", 0);

      if (Rand.chance(T.rampSolid)) {
        for (x = -hw; x <= hw; x += T.rampStep) place(pw + Rand.range(-10, 10), x, "block", 0);
      } else {
        // The gate is pushed away from the ramp's own line, so threading it is a
        // decision taken instead of the jump and not on top of it.
        gx = clamp(rx + (rx > 0 ? -1 : 1) * Rand.range(150, 260), -hw + 96, hw - 96);
        for (x = -hw; x < gx - g; x += T.blockStep) place(pw + Rand.range(-12, 12), x, "block", 0);
        for (x = hw; x > gx + g; x -= T.blockStep) place(pw + Rand.range(-12, 12), x, "block", 0);
      }
      if (Rand.chance(0.6)) placePad(pw + T.rampWall * 0.55, rx, 0);
      nextP = pw + slotGap();
    }

    /* A lone pad, dropped anywhere across the tarmac — except over the first
       biome's opening stretch, where the pads are a CHAIN. A booster the craft
       has to cross the whole road for is not speed handed over quickly: down
       there the offsets walk a gentle weave instead, shallow enough to be
       ridden from one pad to the next, which is also the first thing the
       opening has to teach — that the machine is steered by leaning into a
       line and not by aiming at one object at a time. */
    function spawnBoost(p) {
      var h = roadHalf(p) - 62, open = openRoad(p);
      placePad(p, open ? Math.sin(openWeave++ * 0.9) * h * 0.55
                       : Rand.range(-h, h), 0);
      nextP = p + slotGap() * 0.8 * (open ? T.openGap : 1);
    }

    /* No cells here, ever: an open road is boosters, mines, barriers and the
       ramps that clear them. A shield only comes back inside a fork. */
    function spawnAhead(horizon) {
      var p, r, bc, bo;
      while (nextP < horizon) {
        p = nextP; r = Rand.range(0, 1);
        bc = T.blockMin + (T.blockMax - T.blockMin) * diff();
        bo = openRoad(p) ? T.openBoost : T.boostChance;
        if (p > forkTry) spawnFork(p);                            // the decision
        else if (r < T.rampChance) spawnRamp(p);
        else if (r < T.rampChance + bo) spawnBoost(p);
        else if (r < T.rampChance + bo + bc) spawnBlocks(p);
        else if (r < T.rampChance + bo + bc + T.bombChance) spawnBombs(p);
        // ...and otherwise nothing at all. An empty stretch is not wasted
        // road: it is where the player looks up, reads the board and picks
        // which branch of the next fork they are going to need.
        else nextP = p + slotGap();
      }
      // Forks the camera has already driven out of. Culled behind the lens, so
      // nothing still being drawn can lose the branch it was riding.
      while (forks.length && forks[0].b < camP - 200) forks.shift();
    }

    // The centre of the ribbon an item hangs off, at any progress along it: the
    // branch offset fades in and out with the fork, so an item near the mouth
    // sits near the centre line exactly like the tarmac under it.
    function itemBase(it, p) { return ribbonX(p, it.br); }
    function itemX(it) { return itemBase(it, it.p) + it.off; }

    function resolveItems() {
      var i, it, dx, dy, r, cp = craftP();
      for (i = items.length - 1; i >= 0; i--) {
        it = items[i];
        if (it.p < camP - 80) { items.splice(i, 1); continue; }   // past the lens
        if (it.p > cp + 260) continue;                            // still ahead
        dx = itemX(it) - bx; dy = it.p - cp;

        if (it.type === "ramp") {
          // A ramp is scenery once used: it stays on screen and under the bike.
          if (!it.used && !air && Math.abs(dy) < HIT.ramp && Math.abs(dx) < T.rampHalf) {
            it.used = true; launch();
          }
        } else if (it.type === "block") {
          // Jumped blockers pass underneath, so those are never consumed — but
          // one the craft actually MEETS is destroyed by the impact and taken
          // off the road, because a barrier that survives being rammed at
          // 400 km/h reads as a wall the player bounced off.
          if (!air && invT <= 0 && Math.abs(dy) < HIT.block && Math.abs(dx) < HIT.block + 8) {
            items.splice(i, 1); crash(it);
          }
        } else if (it.type === "boost") {
          if (Math.abs(dy) < 44 && Math.abs(dx) < HIT.boost) { items.splice(i, 1); takeBoost(); }
        } else if (it.type === "bomb") {
          // A mine hovers, so a jump clears it exactly like a barrier.
          if (!air && invT <= 0 && Math.abs(dy) < HIT.bombY && Math.abs(dx) < HIT.bombX) {
            items.splice(i, 1); takeBomb(it);
          }
        } else {
          r = (dx * dx) / (HIT.cellX * HIT.cellX) + (dy * dy) / (HIT.cellY * HIT.cellY);
          if (r <= 1) { items.splice(i, 1); takeCell(); }
        }
      }
    }

    /* ====================================================================
       THE FIELD — nineteen rivals, and the board they are

       They are not a scoreboard with sprites bolted on: each one is a craft at
       a progress on the same road, cruising at its own fixed share of the base
       speed. `rank` is literally how many of them are still up the road, so a
       place changes hands at the exact frame the player draws level — which is
       the only way an overtake feels like one.
       ==================================================================== */

    // The centre line of the ribbon a pilot (or an item) is riding.
    function ribbonX(p, br) { return roadX(p) + br * branchOff(forkAmt(p)); }

    /* Their lateral line, in four parts that answer to four different things:
       a slow wander of their own — scaled by their temperament, so a DRONE has
       none at all — plus, inside a fork, the branch their seed committed them
       to; the dodge they are steering to miss what is up the road; the HUNT,
       which is what they are doing about the player (see huntWant); and the
       shove they are recovering from. The first three are held on the ribbon —
       a pilot never drives itself into the gravel — but the SHOVE is not,
       because being thrown off the road is exactly what a contact is for. */
    function rivalOff(r, hunt) {
      var p = r.p, t = forkAmt(p);
      var h = Math.max(30, branchHalf(p, t) - 30);
      var lane = (branchHalf(p, t) - 58) * 0.72 * Math.sin(p * 0.0016 + r.seed);
      return clamp(lane * T.foes[r.kind].wander + r.dodge + hunt, -h, h) + r.push;
    }
    function rivalX(r) { return ribbonX(r.p, r.br) + rivalOff(r, r.hunt); }
    /* ...and where the same pilot would be with nobody else on the road, which
       is what the hunt is measured FROM: reading `rivalX` back into the want
       would be a feedback loop that either welds the pilot to the craft or
       walks it off on its own. */
    function rivalLine(r) { return ribbonX(r.p, r.br) + rivalOff(r, 0); }

    /* WHAT A PILOT DOES ABOUT THE PLAYER — the one thing its livery promises.
       `foes[kind].hunt` gives it a sign and a share of `foeMax`: positive comes
       for the craft, negative gets out of its way, zero does not look. The want
       is weighted by how close the craft is, so the pack drives its own line up
       the road and only wakes up once the player is in its mirrors — a hunt
       that started a kilometre out would read as a rail, not as a decision. */
    function huntWant(r) {
      var f = T.foes[r.kind], dz, w, want;
      if (!f.hunt) return 0;
      dz = r.p - craftP();
      // Behind the craft it is over: a pilot the player has passed is a pilot
      // in the mirror, and turning it into a chase would make an overtake
      // something that never quite finishes.
      if (dz < 0 || dz > T.foeSee) return 0;
      w = 1 - dz / T.foeSee;
      want = bx - rivalLine(r);
      /* THE MARSHAL NEVER ARRIVES. It steers for a point `foeHold` px to the
         side of the craft — whichever side it is already on — so it hangs on
         the line the player wants without ever being the one that closes the
         gap. Inside the hold the term goes NEGATIVE on its own and it backs
         off, which is the whole reason the contact stays the player's. */
      if (f.hold) want -= (want > 0 ? 1 : -1) * T.foeHold;
      return clamp(f.hunt * want * w, -T.foeMax, T.foeMax);
    }

    /* WHAT A PILOT IS TRYING TO MISS. Every hazard ahead of it inside the cone
       pushes it away from itself; the weight falls off with distance up the road
       and with how far off its line the thing sits, so a mine 700 px away barely
       registers and one about to be met is worth everything. Two blockers with a
       gap between them push from both sides at once and the sum steers the pilot
       into the gap — which is how a wall gets threaded without anyone writing
       code that looks for a gate. */
    function dodgeWant(r) {
      var i, it, dz, dx, ax, w, f = 0, x;
      // A DRONE does not read the road at all: it holds its lane through the
      // scatter and takes the barriers apart on the way (see rivalWall).
      if (!T.foes[r.kind].dodge) return 0;
      x = rivalX(r);
      for (i = 0; i < hazN; i++) {
        it = hazards[i];
        dz = it.p - r.p;
        if (dz < 0 || dz > T.seeAhead) continue;
        dx = x - itemX(it);
        ax = dx < 0 ? -dx : dx;
        if (ax > T.seeSide) continue;
        w = (1 - dz / T.seeAhead) * (1 - ax / T.seeSide);
        // Dead ahead there is no side to prefer, so the pilot's own seed picks
        // one — and picks the SAME one every frame, or it would dither.
        f += (ax < 6 ? (Math.sin(r.seed) < 0 ? -1 : 1) : (dx > 0 ? 1 : -1)) * w;
      }
      return clamp(f * T.dodgeUrge * T.dodgeMax, -T.dodgeMax, T.dodgeMax);
    }

    /* The hazards, collected once a frame and read by all nineteen pilots. The
       item list is walked constantly enough already; this keeps the field's
       whole awareness of the road down to one pass over it. */
    function collectHazards() {
      var i, it;
      hazN = 0;
      for (i = 0; i < items.length; i++) {
        it = items[i];
        if (it.type === "block" || it.type === "bomb") hazards[hazN++] = it;
      }
    }

    /* A PILOT THAT COULD NOT GET OUT OF THE WAY. It does not bounce and it does
       not stop: it goes through the barrier and the barrier comes apart, the
       same way the player's does — the road has one rule for everybody on it.
       The pilot pays in ground, which is the only currency it has. */
    function smashBarrier(r, it) {
      var k = kAt(r.p), x, y;
      it.gone = true;
      x = items.indexOf(it);
      if (x >= 0) items.splice(x, 1);
      breakBarrier(it);
      r.bump = 0.8;                            // it is done colliding for a beat
      r.p -= T.wallKnock;
      r.pushV = (rivalX(r) - itemX(it) > 0 ? 1 : -1) * T.rivalShove * 0.55;
      // Only what the player can actually see gets a spark and a sound: the
      // pack runs a mile up the road and most of these happen off-camera.
      if (k < 0.06 || r.p < camP) return;
      x = screenX(rivalX(r), k); y = screenY(r.p, k);
      Fx.burst(x, y, { color: ["#ff2d55", "#ffd43b", "#ffffff"], count: 12,
                       speed: 120 + 300 * k, life: 0.4, size: Math.max(2, 6 * k) });
      if (k > 0.3) Sound.clip("crash", clamp(0.42 * k, 0.1, 0.42), 1.18);
    }

    function rivalWall(r) {
      var i, it, x = rivalX(r);
      for (i = 0; i < hazN; i++) {
        it = hazards[i];
        if (it.gone || it.type !== "block") continue;
        if (Math.abs(it.p - r.p) > HIT.block) continue;
        if (Math.abs(itemX(it) - x) > T.rivalHalf * 0.8) continue;
        smashBarrier(r, it);
        return;
      }
    }

    /* WHO IS ON THE GRID. The mix is the LEVEL's — lerped between
       `ladder.foeMix.from` and `.to` on the difficulty the level layer handed
       over, and zeroed for every temperament the climb has not reached yet
       (`foeUnlock`) — so a player meets one new behaviour at a time exactly
       the way they meet one new hazard at a time. With no level at all, the
       playable and the endless run take `foeMix.solo`, which is the whole
       catalogue.

       The counts are DERIVED and never rolled: a level is the same road every
       time it is opened, and a field that was three rams on one run and none
       on the next would be a different level under the same number. Largest
       remainder, then handed out FROM THE BACK OF THE GRID FORWARD — the
       temperaments are listed easiest first, so the stragglers the player
       reels in over the opening metres are the ones that get out of the way,
       and the craft still up the road at the flag are the ones coming for
       them. One race, and it hardens as it is driven. */
    function foeGrid(n) {
      var mix = LAD.foeMix, lv = CONFIG.level | 0, i, j, v;
      var share = [], tot = 0, cnt = [], rest = [], left = n, out = [];
      for (i = 0; i < T.foes.length; i++) {
        v = levelD == null ? mix.solo[i]
                           : mix.from[i] + (mix.to[i] - mix.from[i]) * levelD;
        if (lv && lv < LAD.foeUnlock[i]) v = 0;
        share.push(v > 0 ? v : 0);
        tot += share[i];
      }
      if (tot <= 0) { share[0] = 1; tot = 1; }        // a field of scouts
      for (i = 0; i < share.length; i++) {
        v = n * share[i] / tot;
        cnt.push(Math.floor(v));
        rest.push({ i: i, r: v - Math.floor(v) });
        left -= cnt[i];
      }
      rest.sort(function (a, b) { return b.r - a.r; });
      for (i = 0; i < left; i++) cnt[rest[i % rest.length].i]++;
      for (i = 0; i < cnt.length; i++) for (j = 0; j < cnt[i]; j++) out.push(i);
      return out;
    }

    /* HOW MANY PASSES EACH SECTION GETS. The last one always gets `lastFoes`
       — the podium fight — and what is left is dealt evenly over the sections
       before it, the remainder going to the earliest of them, which are the
       cheapest to make a mistake in. Derived and never rolled, like the
       temperaments: a level is the same race every time it is opened. */
    function passPlan(n, S) {
      var last = Math.min(T.lastFoes, n), i;
      var rest, base, extra, out = [];
      if (S < 2) return [n];
      rest = n - last;
      base = Math.floor(rest / (S - 1));
      extra = rest - base * (S - 1);
      for (i = 0; i < S - 1; i++) out.push(base + (i < extra ? 1 : 0));
      out.push(last);
      return out;
    }

    /* WHEN EACH OF THEM IS CAUGHT, as a share of the whole race. A section's
       passes are spread strictly inside it — `(j + 1) / (m + 1)` leaves half a
       gap at each end, so no overtake lands on a gate line — except the final
       section, which is the finish and is placed by hand out of `lastPass`:
       one pass halfway down the run-in and one a few metres past the flag. */
    function passSchedule(n) {
      var cuts = T.cuts, S = cuts.length, R = cuts[S - 1].at;
      var plan = passPlan(n, S), out = [], i, j, m, a, b, k;
      for (i = 0; i < S; i++) {
        a = i ? cuts[i - 1].at : R * T.passFirst;
        b = cuts[i].at;
        m = plan[i];
        for (j = 0; j < m; j++) {
          k = (i === S - 1 && T.lastPass[j] != null) ? T.lastPass[j]
                                                     : (j + 1) / (m + 1);
          out.push((a + (b - a) * k) / R);
        }
      }
      return out;
    }

    function seedRivals() {
      var i, n = T.pilots - 1, cp = craftP(), q, pace, f, gap, jit;
      // The race, in metres: the last cut is the chequered arch, and every pass
      // is scheduled as a share of it (see passSchedule).
      var R = T.cuts.length ? T.cuts[T.cuts.length - 1].at : 1020;
      var grid = foeGrid(n), fo;
      var sched = passSchedule(n), lastFrom = n - Math.min(T.lastFoes, n);
      rivals = [];
      for (i = 0; i < n; i++) {
        q = n > 1 ? i / (n - 1) : 1;                  // 0 at the back, 1 in front
        fo = T.foes[grid[i]];
        /* The temperament's own pace is folded in HERE and not in the update,
           which is what keeps the schedule honest: a stalker at 0.70 of its
           share is slow, so the grid stands it further up the road and the
           player still meets it at the metre it was meant to be met at. */
        pace = (T.paceLow + (T.paceHigh - T.paceLow) * q) * fo.pace;
        f = sched[i];
        // ...and where that puts it on the grid. `1 - pace` is how fast the
        // player closes, so this is the lead that is spent exactly at `f`.
        jit = i >= lastFrom ? T.rivalSpread * T.lastSpread : T.rivalSpread;
        gap = f * R * (1 - pace) * T.pxPerM * (1 + Rand.range(-jit, jit));
        rivals.push({ p: cp + gap, pace: pace, kind: grid[i],
                      br: Rand.chance(0.5) ? -1 : 1, seed: Rand.range(0, TAU),
                      bump: 0, push: 0, pushV: 0, dodge: 0, hunt: 0 });
      }
    }

    /* One pass over the field: cruise them, count how many are still ahead, and
       test the one the craft is actually alongside. Nineteen entries, so the
       whole thing is a single linear walk every frame. */
    function updateRivals(dt) {
      var i, r, ahead = 0, cp = craftP(), base = baseSpeed(), dx, dy, was = rank;
      var fo, pace;
      collectHazards();
      for (i = 0; i < rivals.length; i++) {
        r = rivals[i];
        fo = T.foes[r.kind];
        /* THE MARSHAL TAKES THE PLAYER'S OWN PACE while it is still ahead of
           them and inside its reach, capped at a plain cruise: it cannot be
           out-driven, only out-boosted. Once it has been passed it drops back
           onto its own pace — a pilot that kept station behind the craft
           forever would turn every overtake into something that never ends. */
        pace = r.pace;
        if (fo.match) {
          dy = r.p - cp;
          if (dy > 0 && dy < T.foeSee) pace = Math.max(pace, Math.min(mult, T.foeMatch));
        }
        r.p += base * pace * dt;
        if (r.bump > 0) r.bump -= dt;
        // ...and it steers. Eased rather than snapped, so a pilot leans into
        // its line the way the player's craft does. The hunt is eased more
        // slowly still: what it has to read as is a decision, not a magnet.
        r.dodge += (dodgeWant(r) - r.dodge) * Math.min(1, dt * T.dodgeEase);
        r.hunt += (huntWant(r) - r.hunt) * Math.min(1, dt * T.foeEase);
        /* The shove: a lateral velocity like the craft's own kick, integrated
           into an offset that then relaxes back onto the pilot's line, so a
           contact throws it wide and it fights its way back rather than
           teleporting or being lost off the side of the road for good. */
        if (r.pushV !== 0 || r.push !== 0) {
          r.push = clamp(r.push + r.pushV * dt, -T.pushMax, T.pushMax);
          r.pushV *= Math.max(0, 1 - T.kickDrag * dt);
          if (Math.abs(r.pushV) < 10) {
            r.pushV = 0;
            r.push *= Math.max(0, 1 - T.pushRelax * dt);
            if (Math.abs(r.push) < 1) r.push = 0;
          }
        }
        if (r.p > cp) ahead++;
        else if (r.p < camP - 900) {
          // Dropped a long way behind: park it just off the lens so a player who
          // loses a lot of speed can still be re-passed by the pilots they took.
          r.p = camP - 900;
        }
        if (r.bump <= 0) rivalWall(r);
        if (!air && invT <= 0 && r.bump <= 0) {
          dy = r.p - cp; dx = rivalX(r) - bx;
          if (Math.abs(dy) < T.rivalLong && Math.abs(dx) < T.rivalHalf) { r.bump = 1.2; clip(r); }
        }
      }
      rank = 1 + ahead;
      if (rank < was) tookPlaces(was - rank);
      else if (rank > was) lostPlaces();
      return rank;
    }

    /* ====================================================================
       TAKING PLACES, CHARGING, BOOSTING, FLYING, CRASHING
       ==================================================================== */

    /* THE POWER TICKER ----------------------------------------------------
       Every hit and every cell moves the SAME number — the shield percentage —
       so they get the same callout: one small figure at the craft, green when
       the hull charges and red when it takes damage. Naming each event instead
       ("MINE!", "CONTACT", "ROUGH LANDING", "CRASH!") gave four stickers for
       one meaning, and the player was reading words while the number they
       actually race on moved unannounced. The event still identifies itself —
       every one of them has its own colour of flash, its own shake and its own
       sound — so the callout is free to carry the cost and nothing else. */
    function powPop(pct) {
      Pop.show("score", { word: "+" + pct + "%", at: { x: craftX(), y: craftY() } });
    }
    function dmgPop(pct) {
      Pop.show("score", { word: "-" + pct + "%", at: { x: craftX(), y: craftY() },
                          cls: "pop-dmg" });
    }

    /* An overtake. The single beat the whole game is built to produce, so it
       gets the loudest callout that is not reserved for a cut. */
    function tookPlaces(n) {
      var g = T.rivalPts * n, cut = T.cuts[cutI], need = cut ? cut.rank : 1;
      var safe = rank <= need;
      passed += n;
      pick += g;
      HUD.punch("#7cf9ff");
      Fx.burst(craftX(), craftY(), { color: ["#7cf9ff", "#ffffff"], count: 14, speed: 340, life: 0.4, size: 5 });
      /* "17/15" — the place just taken over the place the next cut asks for,
         green while that reads as qualified and red while it does not. One
         callout answers both "did I gain" and "is it enough", which is the
         only question the board is ever asking. No sound: an overtake is the
         most frequent good thing that happens in a run, and a chime on every
         one of them turned the whole race into a ringtone. */
      Pop.show("streak", { word: rank + "/" + need, sub: "+" + g, at: "top",
                           cls: safe ? "rank-in" : "rank-out" });
      if (rank === 1) {
        Pop.show("ultra", { word: "LEADER", at: popSpot() });
        Overlay.vignette("rgba(255,212,59,.85)", 1, 560);
      }
    }

    /* Losing one. Throttled, because a craft that has just been crippled gets
       re-passed by a whole group at once and nineteen callouts in a second read
       as a bug — but staying silent about it would hide the one thing the
       player most needs to feel. */
    function lostPlaces() {
      showRank();
      if (runT - lastLostPop < 1.1) return;
      lastLostPop = runT;
      // The rank pill in the HUD already moved; all this owes the player is the
      // sound that makes them look at it.
      Sound.clip("warn", 0.4, 0.78);
    }

    // Clipping another pilot. It costs shield and it costs speed, which is the
    // point: the board is climbed by out-driving the pack, not through it.
    function clip(r) {
      var fo = T.foes[r.kind], dx = rivalX(r) - bx, dir;
      // What a contact is worth is the OTHER pilot's business: a ram hits half
      // again as hard as a stalker does, and the livery said so on the way in.
      var cost = Math.round(T.rivalCost * fo.cost);
      chain = 0;
      hits++;
      shield = Math.max(0, shield - cost);
      invT = T.invTime * 0.7;
      mult = Math.min(mult, 0.72);
      boostT = 0;
      // Knocked forward, so a clip never reads as a free tow.
      r.p -= 40;
      /* BOTH HULLS ARE THROWN. `dir` points away from the pilot, so the craft
         is spat out on the far side and the pilot takes the same push mirrored:
         one collision, two bodies, opposite directions. Dead level is a coin
         toss, because two hulls in the same lane have to end up somewhere. */
      dir = Math.abs(dx) < 4 ? (Rand.chance(0.5) ? -1 : 1) : (dx > 0 ? -1 : 1);
      kick = dir * T.rivalKick * fo.kick;
      kickRoll = dir * T.bombRoll * 0.7 * fo.kick;
      // ...and the hull that hits hardest is the one that is moved least by it.
      r.pushV = -dir * T.rivalShove / fo.kick;
      Fx.shake(11 * fo.kick, 0.26); Fx.flash("#ff9c3b", 0.26);
      Fx.burst(craftX(), craftY(), { color: ["#ff9c3b", "#ffd43b", "#ffffff"], count: 18, speed: 380, life: 0.42, size: 5 });
      // The spray follows the way the craft is thrown, so the eye is pushed the
      // same direction the hull is.
      Fx.burst(craftX(), craftY() - 24,
               { color: ["#ff9c3b", "#ffffff"], count: 10, speed: 440, life: 0.38,
                 size: 4, angle: dir > 0 ? 0 : Math.PI, spread: 1.1 });
      Overlay.vignette("rgba(255,120,60,.8)", 1, 460);
      Sound.clip("scrape", 0.8, 0.8);
      if (shield <= 0) { showShield(); die("SHIELD DOWN"); return; }
      dmgPop(cost);
    }

    // A mine. Cheaper than a barrier and far more common, so it is the drip
    // that makes a charge branch necessary in the first place.
    function takeBomb(it) {
      var dir = it ? itemX(it) - bx : 0;
      chain = 0;
      hits++;
      shield = Math.max(0, shield - T.bombCost);
      invT = T.invTime;
      mult = Math.min(mult, 0.66);
      boostT = 0;
      /* THROWN OFF THE LINE. The blast pushes AWAY from the mine — clip one on
         the left and the craft is spat out to the right — so the hit is a thing
         that happens to the machine and not only to a number. Dead centre is a
         coin toss, because a blast has to send the craft somewhere. */
      dir = Math.abs(dir) < 4 ? (Rand.chance(0.5) ? -1 : 1) : (dir > 0 ? -1 : 1);
      kick = dir * T.bombKick;
      kickRoll = dir * T.bombRoll;
      Fx.shake(15, 0.34); Fx.flash("#ff5a2d", 0.36); Fx.freeze(0.05);
      Fx.burst(craftX(), craftY(), { color: ["#ff5a2d", "#ffd43b", "#ffffff"], count: 24, speed: 460, life: 0.5, size: 6 });
      Fx.ring(craftX(), craftY(), { from: 18, to: 190, color: "#ff5a2d", width: 8, life: 0.4 });
      // The spray follows the way the craft is thrown, so the eye is pushed the
      // same direction the hull is.
      Fx.burst(craftX(), craftY() - 30,
               { color: ["#ffd43b", "#ff5a2d", "#ffffff"], count: 14, speed: 520,
                 life: 0.45, size: 5, angle: dir > 0 ? 0 : Math.PI, spread: 1.1 });
      Overlay.vignette("rgba(255,90,45,.88)", 1, 560);
      Sound.clip("crash", 0.85, 0.72);
      if (shield <= 0) { showShield(); die("SHIELD DOWN"); return; }
      dmgPop(T.bombCost);
    }

    function takeCell() {
      var g = T.cellPts + Math.min(chain, 10) * 2, was = shield;
      chain++;
      cells++;
      shield = Math.min(T.shieldMax, shield + T.cellPower);
      if (boostT > 0) g *= 2;
      pick += g;
      HUD.punch("#5cffb0");
      Fx.burst(craftX(), craftY(), { color: ["#5cffb0", "#ffffff"], count: 12, speed: 300, life: 0.4, size: 5 });
      // Cells arrive faster than a callout can be read: one pop per quarter
      // second, and the burst plus the HUD punch carry the ones between.
      // The callout carries the SHIELD, not the score: a cell is a repair first
      // and a handful of points second, and the points are already climbing in
      // the HUD where the player can see them.
      if (runT - lastPop > 0.24) {
        lastPop = runT;
        powPop(T.cellPower);
      }
      Sound.clip("batt", 0.55, 1 + Math.min(chain, 12) * 0.045);
      // Coming back from the red is the single most relieving beat in the run —
      // and it is told by the whole frame stopping its shake, so the green
      // vignette is the flourish it needs and not a word on top of it.
      if (was < T.lowAt && shield >= T.lowAt) {
        Overlay.vignette("rgba(92,255,176,.75)", 1, 420);
      }
      // Every fifth cell still pays its bonus, and the chime climbing with the
      // chain is what the player hears it on. No callout: a clean rider chains
      // for a long time, so this is the pop that fired most often and least
      // meant anything — the score in the HUD carries it.
      if (chain > 0 && chain % 5 === 0) {
        g = 15 * (chain / 5);
        pick += g;
        Sound.clip("mile", 0.75, 1 + Math.min(chain, 20) * 0.01);
      }
    }

    function takeBoost() {
      boostT = T.boostTime;
      boosts++;
      pick += T.boostPts;
      HUD.punch("#ffd43b");
      Fx.ring(craftX(), craftY(), { from: 26, to: 220, color: "#ffd43b", width: 8, life: 0.45 });
      Fx.burst(craftX(), craftY(), { color: ["#ffd43b", "#ffffff"], count: 20, speed: 420, life: 0.45, size: 6 });
      Fx.flash("#ffe9a8", 0.18);
      Overlay.vignette("rgba(255,212,59,.8)", 1, 460);
      // The gold ring, the gold flash and the boost trail on the craft last as
      // long as the booster does — a sticker only says it once.
      Sound.clip("boost", 0.85);
    }

    function launch() {
      air = true;
      airMax = T.airTime;
      airT = airMax;
      airFrom = camP;
      Fx.ring(craftX(), craftY(), { from: 30, to: 210, color: "#7cf9ff", width: 7, life: 0.4 });
      Fx.burst(craftX(), craftY(), { color: ["#7cf9ff", "#8a5cff", "#ffffff"], count: 16, speed: 340, life: 0.4, size: 5 });
      Fx.shake(6, 0.16);
      Sound.clip("ramp", 0.75);
    }

    function land() {
      var flown = Math.round((camP - airFrom) / T.pxPerM), g;
      air = false; airZ = 0;
      Fx.burst(craftX(), craftY(), { color: ["#c9e8ff", "#ffffff"], count: 14, speed: 260, life: 0.34, size: 5,
                              angle: Math.PI / 2, spread: 2.4 });
      if (offAmount() > 0) {
        // Landing in the gravel is the price of steering blind in the air.
        shield = Math.max(0, shield - T.roughCost);
        chain = 0; crashT = 0.35;
        Fx.shake(13, 0.26);
        Sound.clip("land", 0.85, 0.85);
        if (shield <= 0) { showShield(); die("SHIELD DOWN"); return; }
        dmgPop(T.roughCost);
        return;
      }
      g = 20 + Math.round(flown * T.airPts);
      pick += g;
      Fx.shake(8, 0.2);
      HUD.punch("#ffd43b");
      Sound.clip("land", 0.8, 1.05);
    }

    /* THE BARRIER COMING APART ----------------------------------------------
       A blocker is a slab of hazard tape 84 world px wide standing 78 px off the
       tarmac, so it breaks into slabs of hazard tape: `shardN` chunks thrown out
       of the frame it used to occupy. Each carries the craft's own speed forward
       (it was just rammed) minus its own share, so the whole spray slides back
       towards the lens and past it over about half a second. `z` is height above
       the tarmac and `shardGrav` brings them back down to it.

       They go through the SAME projection as the road, which is what makes the
       debris belong to the world instead of being a decal on the screen. */
    function breakBarrier(it) {
      var i, a, sp, x0 = itemX(it);
      for (i = 0; i < T.shardN; i++) {
        a = Rand.range(0, TAU);
        sp = Rand.range(120, 430);
        shards.push({
          p: it.p + Rand.range(-16, 16),
          x: x0 + Rand.range(-42, 42),
          z: Rand.range(4, 76),                       // world px off the tarmac
          vp: speed * Rand.range(0.20, 0.80),         // shoved up the road
          vx: Math.cos(a) * sp,
          vz: Rand.range(240, 780),
          rot: Rand.range(0, TAU), vr: Rand.range(-11, 11),
          life: T.shardLife * Rand.range(0.7, 1.25),
          w: Rand.range(13, 34), h: Rand.range(7, 19),
          // Mostly tape, some of the frame it was painted on, a little red rim.
          col: Rand.chance(0.5) ? "#ffd43b" : (Rand.chance(0.5) ? "#ff2d55" : "#2a0a1c")
        });
      }
      // Hard cap: a run that rams three walls in a second must not pay for a
      // hundred rotated rects a frame.
      if (shards.length > T.shardN * 3) shards.splice(0, shards.length - T.shardN * 3);
    }

    // The debris in flight. Simple ballistics in world units: the tarmac stops a
    // chunk that comes down on it and kills it quickly, and anything the camera
    // has already swallowed is dropped.
    function updateShards(dt) {
      var i, s;
      for (i = shards.length - 1; i >= 0; i--) {
        s = shards[i];
        s.p += s.vp * dt;
        s.x += s.vx * dt;
        s.z += s.vz * dt;
        s.vz -= T.shardGrav * dt;
        s.vp *= Math.max(0, 1 - 1.6 * dt);
        s.vx *= Math.max(0, 1 - 2.2 * dt);
        if (s.z <= 0) {                       // landed: it skids and stops fast
          s.z = 0; s.vz *= -0.32; s.vx *= 0.55; s.vr *= 0.5; s.life -= dt * 2;
        }
        s.rot += s.vr * dt;
        s.life -= dt;
        if (s.life <= 0 || s.p < camP + 40) shards.splice(i, 1);
      }
    }

    function crash(it) {
      chain = 0;
      hits++;
      shield = Math.max(0, shield - T.crashCost);
      crashT = T.crashSlow; invT = T.invTime;
      mult = Math.min(mult, 0.55);
      boostT = 0;
      // The barrier goes first: the debris has to be in the air on the same
      // frame as the flash, or the two read as two separate events.
      if (it) breakBarrier(it);
      Fx.shake(18, 0.42); Fx.flash("#ff2d55", 0.45); Fx.freeze(0.07);
      Fx.burst(craftX(), craftY(), { color: ["#ff2d55", "#ffd43b", "#ffffff"], count: 26, speed: 470, life: 0.55, size: 6 });
      Fx.ring(craftX(), craftY(), { from: 20, to: 200, color: "#ff2d55", width: 8, life: 0.42 });
      Overlay.vignette("rgba(255,45,85,.9)", 1, 620);
      Sound.clip("crash", 0.9);
      if (shield <= 0) { showShield(); die("SHIELD DOWN"); return; }
      dmgPop(T.crashCost);
    }

    /* ====================================================================
       INPUT — a held side, and nothing else
       ==================================================================== */

    // The half of the screen a press sits in, with a dead band in the middle so
    // a thumb resting dead centre coasts straight instead of twitching.
    function pressSide(p) {
      var dx = p.x - view.w * 0.5;
      if (Math.abs(dx) < T.deadZone) return 0;
      return dx < 0 ? -1 : 1;
    }
    function apply() { side = touchSide || keySide; }
    function onDown(p) { held = true; touchSide = pressSide(p); apply(); }
    function onMove(p) { if (held) { touchSide = pressSide(p); apply(); } }
    function onUp()    { held = false; touchSide = 0; apply(); }

    /* Desktop steering. The motor fakes a tap and a flick for the keyboard, but
       this game is HELD left or right, so it owns that pair of keys itself: a
       press sets the same `side` a finger would and the release clears it.
       SPACE still starts and replays through the motor. */
    function keyDir(e) {
      if (e.code === "ArrowLeft"  || e.key === "ArrowLeft"  || e.key === "a" || e.key === "A" || e.keyCode === 37) return -1;
      if (e.code === "ArrowRight" || e.key === "ArrowRight" || e.key === "d" || e.key === "D" || e.keyCode === 39) return 1;
      return 0;
    }
    window.addEventListener("keydown", function (e) {
      var d = keyDir(e); if (!d) return;
      e.preventDefault();                                  // no page scroll
      keySide = d; apply();
    });
    window.addEventListener("keyup", function (e) {
      var d = keyDir(e); if (!d) return;
      if (keySide === d) { keySide = 0; apply(); }
    });

    /* ====================================================================
       FRAME
       ==================================================================== */

    function showShield() {
      var v = Math.ceil(shield);
      if (v === shownShield) return;
      shownShield = v;
      HUD.setLeft(v + "%", "SHIELD", v <= T.lowAt ? "warn" : "");
    }

    /* THE RANK PILL, and the cut counting down under it. This is the pill the
       player reads: the position is the number, and the label is the wall it
       has to be inside by — "TOP 10 · 84M" once a cut is close enough to be
       worth panicking about, the plain field size before that. */
    function ordinal(n) {
      var t = n % 100;
      if (t >= 11 && t <= 13) return n + "TH";
      return n + (["TH", "ST", "ND", "RD"][n % 10] || "TH");
    }
    function showRank() {
      var cut = T.cuts[cutI], need = "FINAL " + fieldSize, left, txt;
      var flag = cut && atFlag();
      if (cut) {
        left = Math.max(0, Math.round(cut.at - dist));
        // The flag is a countdown and never an ask: nothing about the place is
        // at stake there but the win itself.
        need = flag ? "FINISH · " + left + "M"
             : left <= T.cutWarn ? "TOP " + cut.rank + " IN " + left + "M"
                                 : "CUT TO " + cut.rank + " · " + left + "M";
      }
      // "3/10" — the place, and how many pilots are still in the race. One
      // glance has to answer both "where am I" and "how many are left".
      txt = rank + "/" + fieldSize;
      if (txt === shownRank && need === shownNeed) return;
      shownRank = txt; shownNeed = need;
      HUD.setRight(txt, need, cut && !flag && rank > cut.rank ? "warn" : "");
    }
    function reset() {
      best = Store.get("bestScore", 0);
      metrics();
      // The hulls' damage washes, built here so no round pays for one in flight.
      warmShips();

      /* THE ROAD. A level has a trace of its own and it never moves: the four
         phases come off CONFIG.ladder.road, so level 12 is one road the player
         can learn and level 11 is another. Without a level — the playable, and
         the endless bonus run — they are rolled fresh every run, which is what
         keeps an endless road from being learned by heart. */
      if (TRACE) {
        phA = TRACE[0]; phB = TRACE[1]; phC = TRACE[2]; phD = TRACE[3];
      } else {
        phA = Rand.range(0, TAU); phB = Rand.range(0, TAU);
        phC = Rand.range(0, TAU); phD = Rand.range(0, TAU);
      }

      /* THE BED. One stretch of the track per biome, so the music turns over
         with the weather every six levels. Asking for the section already
         playing does nothing, so a replay of the same level never restarts it.
         Without a level — the playable, and the endless bonus run — there is
         one biome and a short cut of the track to play it on, so the bed is
         the whole of what the build ships. */
      Music.play(CONFIG.level ? BIO.music : null);

      camP = 0; runT = 0; speed = T.speedMin; mult = 1; dist = 0; travel = 0;
      kmhShown = T.speedMin * T.kmhPerPx;      // it leaves the line already on
      fov = 0; lens();
      bx = roadX(T.camZ); camX = bx;      // dead centre of the road, not of the frame
      lean = 0; side = 0; touchSide = 0; keySide = 0; held = false;
      air = false; airT = 0; airMax = T.airTime; airFrom = 0; airZ = 0;
      shield = T.shieldStart; boostT = 0; crashT = 0; invT = 0;
      warnT = 0; lowShown = false; trailT = 0; dmg = 0;
      railGlow.l = 0; railGlow.r = 0;
      kick = 0; kickRoll = 0;
      chain = 0; cells = 0; boosts = 0; pick = 0;
      passed = 0; hits = 0;
      items = []; trail = []; forks = []; paint = []; shards = []; hazN = 0;
      nextP = 1150; nextMile = T.mileStep; lastPop = -1; lastSpot = -1;
      lastLostPop = -1;
      // The first fork waits until the player has ridden a straight road for a
      // few seconds: a choice only reads as a choice once the default is known.
      forkTry = T.forkFirst;
      openWeave = 0;

      // The grid: nineteen rivals stacked up the road, so the player starts on
      // the back row of a twenty-craft field.
      seedRivals();
      rank = T.pilots; fieldSize = T.pilots; cutI = 0; cutWarned = false;
      finished = false;

      shownShield = -1; shownRank = ""; shownNeed = "";
      // The rail starts settled on a full shield, so the first frame of a run
      // is not an animation of a value arriving.
      shieldLag = shield; shieldSeen = shield;
      railPunch = 0; railCol = "#5cffb0"; railT = 0;
      HUD.setScoreNow(0);
      showShield(); showRank();
      Fx.reset();
    }

    /* The thrust wash is stamped at the CRAFT's progress, not the camera's, so
       as the run advances each sample slides from the craft's row down and out
       of the bottom of the frame — the exhaust rushing past the lens. */
    function pushTrail() {
      trail.unshift({ x: bx, p: camP + T.camZ });
      // Drop the samples that have already blown past the lens, so the ribbon
      // never has to be drawn through a division by nothing.
      while (trail.length && trail[trail.length - 1].p - camP < 26) trail.pop();
      if (trail.length > 22) trail.length = 22;
    }

    /* The pace everybody in the field is measured against: the craft's own
       speed before the booster, the gravel and the crashes pull on it, and the
       exact number every rival takes its share of. Keeping the rivals on the
       same curve is what stops the board drifting on its own as the run speeds
       up — a place only ever changes hands because somebody drove for it. */
    function baseSpeed() {
      return T.speedMin + (T.speedMax - T.speedMin) * Math.min(1, runT / T.ramp);
    }

    function update(dt) {
      var offNow, tgt, sNorm, room, cp;

      runT += dt;

      // --- lean, then steer with it ---------------------------------------
      lean += ((air ? side * T.airSteer : side) - lean) * Math.min(1, dt * T.leanEase);

      // --- pace: the gravel, the booster and a crash all pull on one dial --
      offNow = air ? 0 : offAmount();
      tgt = 1 + (boostT > 0 ? T.boostGain : 0) - offNow * T.offDrag;
      if (crashT > 0) tgt *= 0.42;
      mult += (tgt - mult) * Math.min(1, dt * T.gripEase);
      speed = baseSpeed() * mult;
      kmhShown += (speed * T.kmhPerPx - kmhShown) * Math.min(1, dt * T.kmhEase);

      bx += lean * T.steer * (0.72 + 0.28 * Math.min(1, speed / T.speedMax)) * dt;

      /* --- the blast still pushing (see takeBomb) --------------------------
         Added to the steering rather than replacing it, so the player can lean
         INTO the throw and cut it short — being thrown is a thing to recover
         from, not a cutscene. Applied before the leash below, which is what
         keeps a blast on the edge of the road from firing the craft into empty
         space: the worst it can do is drop it in the gravel. */
      if (kick !== 0) {
        bx += kick * dt;
        kick *= Math.max(0, 1 - T.kickDrag * dt);
        if (Math.abs(kick) < 8) kick = 0;
      }
      if (kickRoll !== 0) {
        kickRoll *= Math.max(0, 1 - T.kickDrag * dt);
        if (Math.abs(kickRoll) < 0.02) kickRoll = 0;
      }

      // The road wanders, so the leash is on the ROAD and not on the frame: the
      // player may run wide into the gravel but never off into empty space.
      cp = craftP();
      room = roadHalf(cp) + branchOff(forkAmt(cp)) + T.offSpan + 70;
      bx = clamp(bx, roadX(cp) - room, roadX(cp) + room);
      camP += speed * dt;

      /* --- the camera. It trails the craft (so a bend slides the craft out to
         the side of the frame) and the lens opens with speed (so the road rushes
         harder the faster it goes). Both are eased: a snapping camera or a
         snapping field of view reads as a glitch, not as speed. */
      camX += ((bx - lean * T.camLead) - camX) * Math.min(1, dt * T.camEase);
      sNorm = clamp((speed - T.speedMin) / (T.speedMax - T.speedMin), 0, 1);
      fov += ((sNorm + (boostT > 0 ? 0.55 : 0)) * T.fovKick - fov) * Math.min(1, dt * 3.2);
      lens();

      if (boostT > 0) boostT -= dt;
      if (crashT > 0) crashT -= dt;
      if (invT > 0) invT -= dt;
      railGlow.l = Math.max(0, railGlow.l - dt * 2.4);
      railGlow.r = Math.max(0, railGlow.r - dt * 2.4);

      // --- the jump --------------------------------------------------------
      if (air) {
        airT -= dt;
        airZ = Math.sin(Math.PI * clamp(1 - airT / airMax, 0, 1));
        if (airT <= 0) { land(); if (State !== "playing") return; }
      }

      trailT += dt;
      if (trailT >= T.trailStep) { trailT = 0; pushTrail(); }

      // --- off the tarmac ---------------------------------------------------
      if (offNow > 0) {
        chain = 0;                                   // gravel breaks the chain
        // Measured against the ribbon the craft is actually on, not the centre
        // line: inside a fork the rail to flare is the near branch's.
        if (bx < branchCentre(craftP())) railGlow.l = 1; else railGlow.r = 1;
        Fx.shake(3 * offNow, 0.1);
        // Deliberately silent: a scrape loop out here fired on every kerb clip
        // and turned the one noise the game makes continuously into a nag. The
        // gravel is told by the rail, the spray and the tremor.
        if (Rand.chance(0.6)) {
          Fx.burst(craftX(), craftY() + 20, { color: ["#c9b98f", "#8a7a5a"], count: 2, speed: 170, life: 0.3,
                                       size: 3, angle: Math.PI / 2, spread: 2.2 });
        }
        // No callout: the rail flaring, the gravel spray, the tremor and the
        // scrape loop say it continuously, which a sticker fired once cannot.
      }

      /* --- the shield. Nothing here takes it off: it is not fuel, and this
         block only ever reads it. Everything that lowers it is a contact, and
         every contact tests for zero itself, so the run can end on the frame
         the hit lands rather than one frame later.

         `dmg` is the one dial the damage is expressed through — 0 while the
         shield is healthy, 1 with it empty. It drives the frame shaking itself
         apart, the smoke off the hull and the craft going red, so a player in
         trouble is told by the WHOLE SCREEN and not by a number in a corner. */
      showShield();
      dmg = shield < T.lowAt ? 1 - shield / T.lowAt : 0;
      if (dmg > 0) {
        // A permanent tremor, worse the closer to out it gets. Re-armed every
        // frame with a short life so it never stops and never piles up.
        Fx.shake(2 + 5 * dmg, 0.12);
        // smoke off the hull, and sparks once it is really going
        if (Rand.chance(0.35 + 0.45 * dmg)) {
          Fx.burst(craftX() + Rand.range(-30, 30), craftY() - 40,
                   { color: ["#4a4550", "#2a2730"], count: 1, speed: 90, life: 0.7,
                     size: 7, angle: -Math.PI / 2, spread: 1.2 });
        }
        if (dmg > 0.5 && Rand.chance(0.5 * dmg)) {
          Fx.burst(craftX() + Rand.range(-40, 40), craftY() - 20,
                   { color: ["#ffb347", "#ff5a2d", "#ffffff"], count: 2, speed: 260,
                     life: 0.3, size: 4 });
        }
        warnT -= dt;
        if (warnT <= 0) {
          warnT = T.warnEvery * (1 - 0.45 * dmg);       // faster as it gets worse
          Sound.clip("warn", 0.55 + 0.3 * dmg, 1 + 0.3 * dmg);
          Overlay.vignette("rgba(255,45,85,.75)", 1, 520);
        }
        if (!lowShown) {
          lowShown = true;
          Pop.show("danger", { word: "HULL CRITICAL", sub: "TAKE THE CHARGE LINE", at: popSpot() });
        }
      } else { lowShown = false; warnT = 0; }

      // --- the world -------------------------------------------------------
      updateShards(dt);
      spawnAhead(camP + T.ahead);
      resolveItems();
      if (State !== "playing") return;                // a hit may have ended us

      // --- the field, then the board it makes ------------------------------
      updateRivals(dt);
      if (State !== "playing") return;                // ...and so may a clip

      // --- score: distance is the run, and a booster doubles it ------------
      dist = camP / T.pxPerM;
      travel += (speed * dt / T.pxPerM) * (boostT > 0 ? 2 : 1);
      HUD.setScore(Math.floor(travel + pick));
      showRank();
      updateRails(dt);
      checkCut();
      if (State !== "playing") return;                // ...and so may a cut

      if (dist >= nextMile) {
        nextMile += T.mileStep;
        pick += T.milePts;
        // Kept as a vignette and a chime only: the cut warnings are this game's
        // ribbons, and a milestone wearing the same sticker stole their weight.
        Overlay.vignette("rgba(53,232,255,.7)", 1, 420);
        Sound.clip("mile", 0.7, 0.95);
      }
    }

    /* ====================================================================
       THE CUTS — where the field is trimmed

       A cut is a line across the road at `cuts[i].at` metres. Cross it inside
       `cuts[i].rank` and the race carries on with a tighter one behind it;
       cross it outside and the run is over on the spot, however healthy the
       shield is. It is announced `cutWarn` metres out — long enough to spend a
       booster on, which is the entire point of announcing it.
       ==================================================================== */

    // The chequered flag is the last entry of `cuts` and it is not a cut: it
    // ends the race for whoever reaches it (see checkCut).
    function atFlag() { return cutI === T.cuts.length - 1; }

    function checkCut() {
      var cut = T.cuts[cutI], safe, flag = atFlag();
      if (!cut) return;

      /* The warning that gives the player time to do something about it. It is
         a vignette and a chime, not a callout: the rank pill is ALREADY saying
         "TOP 10 IN 84M" in warn colours (see showRank), and a sticker repeating
         it in words covered the road at the one moment the player needs to see
         a line through the pack. The colour of the flash is the whole message —
         cyan means inside, red means pass someone. */
      if (!cutWarned && cut.at - dist <= T.cutWarn) {
        cutWarned = true;
        safe = flag || rank <= cut.rank;
        Overlay.vignette(safe ? "rgba(53,232,255,.7)" : "rgba(255,45,85,.8)", 1, 620);
        Sound.clip("warn", 0.7, safe ? 1.1 : 0.9);
      }
      if (dist < cut.at) return;

      /* THE FLAG ELIMINATES NOBODY. A checkpoint is a wall and being outside it
         ends the run; the finish is the end of the race and ends it for
         whoever gets there, in whatever place. It used to ask for the podium
         like any other cut, and that was one ending too many: a run driven to
         the very last metre was told it had been eliminated ON the line, and
         under the star rule it now scores exactly what a crash at a third of
         the distance scores. The culling belongs to the checkpoints; the flag
         belongs to the race. */
      if (!flag && rank > cut.rank) { die("ELIMINATED"); return; }

      // Through it — and the field is REALLY trimmed. Everyone the cut took is
      // deleted from the road, so the pack the player is racing gets visibly
      // shorter every time and the "3/10" in the HUD is a fact and not a label.
      if (!flag) trimField(cut.rank);
      cutI++;
      cutWarned = false;
      pick += T.milePts * 2;
      Fx.flash("#7cf9ff", 0.34);
      Fx.shake(10, 0.3);
      Confetti.burst(60);
      Overlay.vignette("rgba(92,255,176,.85)", 1, 700);
      Sound.clip("mile", 0.9, 1.2);
      if (cutI >= T.cuts.length) { win(); return; }
      /* ONE callout for the whole beat, and it is about what happens NEXT. That
         the cut was survived is already told by the confetti, the flash and the
         pack thinning out on screen; what the player cannot see is the size of
         the next wall. Carried by `combo` rather than a banner so it lands in
         the same layer as the rest of the game's shouts. */
      Pop.show("combo", { word: fieldSize + " PILOTS LEFT",
                          sub: atFlag() ? "FINISH · TAKE THE LEAD"
                                        : "NEXT CUT · TOP " + T.cuts[cutI].rank,
                          at: "center" });
      showRank();
    }

    /* Cut the field to `n` pilots, the player included, and say how many that
       took out. The survivors are simply the `n - 1` rivals furthest up the
       road: the player is inside the cut by the time this runs, so everybody
       dropped is behind them — which is exactly who a real cut takes. */
    function trimField(n) {
      var keep = n - 1, out = 0;
      rivals.sort(function (a, b) { return b.p - a.p; });
      if (rivals.length > keep) { out = rivals.length - keep; rivals.length = keep; }
      fieldSize = n;
      return out;
    }

    /* The three rows of the results table that never change, whichever way the
       run ended: what the board said, how far it got, and how it was driven. */
    function resultRows(sc) {
      return [
        { label: "FINAL POSITION", value: ordinal(rank), grade: rank <= 3 ? "gold" : "accent" },
        { label: "PLACES TAKEN", value: passed, grade: passed >= 10 ? "good" : "" },
        { label: "DISTANCE (M)", value: Math.floor(dist) },
        { label: "BEST SCORE", value: Math.max(sc, best), grade: "gold" }
      ];
    }

    /* THE STARS ARE THE RESULT OF THE RACE, and nothing else — not the score,
       not the distance, not how many cuts were survived. A race is won by
       crossing the flag in front, so:

         3 — the chequered flag taken in FIRST place. The whole field passed,
             which a boost-free drive cannot do — the schedule keeps the leader
             just past the flag (see `lastPass`), so the win is bought on the
             fast branch of the forks, which is exactly the decision the run is
             built around;
         2 — the flag in any other place. The race was finished, and the flag
             turns nobody away: the checkpoints did the culling;
         1 — the road ran out under it, the objective covered all the same;
         0 — short of the objective.

       The objective is the LEVEL's distance on the web target, where the star
       bands are the shell's and `levelStars` only caps them. The playable has
       no objective at all, so its first gate stands in for one — the only
       distance it names. */
    function raceStars() {
      if (finished) return rank === 1 ? 3 : 2;
      return cutI >= 1 ? 1 : 0;
    }

    // Clearing the last cut ends the race at the flag — the ending the whole
    // structure is built towards, and the only one that can pay three stars.
    function win() {
      finished = true;
      var st = raceStars();
      var sc = Math.floor(travel + pick) + 500;
      endRound({
        title: rank === 1 ? "RACE WON!"
             : rank <= 3 ? "ON THE PODIUM!" : "RACE FINISHED!",
        variant: st === 3 ? "perfect" : "win",
        score: sc,
        /* The METRES here too, for the same reason `die` reports them: on the
           web target the last arch stands on the level's third star, so a
           won race has to be measured on the distance that put it there.
           Reporting the score instead would hand the level layer a number in
           the wrong unit and lose the stars the drive just earned. */
        levelScore: Math.floor(dist),
        stars: st,
        rows: resultRows(sc)
      });
    }

    function die(title) {
      var sc = Math.floor(travel + pick);
      endRound({
        title: title || CONFIG.copy.gameOver,
        variant: "",
        score: sc,
        // A level's objective is a distance: the ROAD covered, and nothing
        // else (web target only — see levelProgress).
        levelScore: Math.floor(dist),
        stars: raceStars(),
        rows: resultRows(sc)
      });
    }

    /* ====================================================================
       RENDER — a chase camera behind the craft

       Draw order is one straight walk from the sky down the lens: sky, the
       plain under it, the road, the haze that welds the road into the horizon,
       the traffic, the warp streaks, then the craft. Every layer runs
       far-to-near, so nothing needs a depth buffer.
       ==================================================================== */

    var SUN_R = 118;                   // the sun on the horizon, in design px
    /* THE PAINTED HORIZON — assets/image/master/arcider-sky.jpg, cut to
       1440x498 in assets/image/embed/ and injected as CONFIG.art.sky, which
       the engine decodes into ArtImages with the rest of the artwork.

       Its bottom edge IS the horizon line: sky, stars, the setting sun, the
       mountains and the city are all in the one picture, so it stands in for
       the sun and the skyline drawn below rather than sitting behind them. It
       is the only piece of art this game draws on the CANVAS, because it
       belongs to the round and CONFIG.art.backgroundPhone never does.

       A build without the file keeps the drawn sun and towers — artwork is the
       user's, and nothing here generates a stand-in for it. */
    function skyArt() {
      // The biome names its own cut (`skyNight` -> arcider-sky-night.png). A
      // build with no artwork, or a biome whose picture is missing, falls back
      // to the drawn sky the same way it always did.
      var img = typeof ArtImages !== "undefined" && ArtImages[BIO.sky];
      return img && img.complete && img.naturalWidth ? img : null;
    }

    /* THE GROUND'S OWN COLOUR, read off the picture instead of written down a
       second time. The plain used to open on a near-black violet, which was
       right under a drawn gradient and wrong under a painting: the cut ends on
       a lit band of haze at the foot of the city, and a dark plain met it on a
       hard edge — the dark strip between the city and the road. Averaging the
       bottom rows of the picture into a single pixel is the exact answer and
       costs one drawImage per layout, not per frame. The literal is the
       fallback for a build with no artwork, where the drawn sky meets it. */
    var foot = [27, 16, 70];                  // refreshed by metrics()
    function skyFoot() {
      var img = skyArt(), c, g, d;
      if (!img) return BIO.dark;
      c = document.createElement("canvas"); c.width = 1; c.height = 1;
      g = c.getContext("2d");
      g.drawImage(img, 0, img.naturalHeight - 24, img.naturalWidth, 24, 0, 0, 1, 1);
      d = g.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    }
    function footCol(a) {
      return "rgba(" + foot[0] + "," + foot[1] + "," + foot[2] + "," + a + ")";
    }
    /* How far past the frame the sky and the plain are painted. The shake
       translates the whole canvas, and a low shield now shakes it EVERY frame —
       without this bleed the shift would expose a permanent unpainted strip
       down the edge of the screen, which reads as a rendering bug rather than
       as a craft coming apart. Wider than the largest shake in the game. */
    var BLEED = 30;
    var wash = [];                     // reused screen points for the thrust wash
    // the three layers of that wash: flare, body, core
    var WASH_COL = ["#7a4dff", "#35e8ff", "#eaffff"];
    var WASH_A   = [0.34, 0.50, 0.70];
    var WASH_W   = [2.10, 1.30, 0.26];

    /* THE FACE THE FIGURE IS SET IN. The web build embeds the game's own family
       and hands it to the page as `--web-font` (see the builder and
       packages/webshell/menu.css); a playable ships no font at all and falls
       back to the motor's system stack. Resolved here rather than per frame:
       it is a `getComputedStyle` read, and `metrics()` is where everything
       else that only changes with the frame is worked out. */
    var SYS_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';
    var speedoFont = SYS_FONT;

    function readFont() {
      var v = "";
      try {
        v = getComputedStyle(document.documentElement)
              .getPropertyValue("--web-font") || "";
      } catch (e) { v = ""; }
      v = v.replace(/^\s+|\s+$/g, "");
      speedoFont = v ? v + "," + SYS_FONT : SYS_FONT;
    }

    function metrics() {
      var i, x, w;
      readFont();
      halfW = view.w * 0.5;
      horizonY = Math.round(Layout.top + Layout.h * T.horizon);
      anchorY = Layout.bottom - T.anchor;
      span = anchorY - horizonY;

      /* WHERE THE PAINTING SITS. `horizonY` is the vanishing line — k reaches
         zero there and no finite road ever does — so the picture is laid on
         the last row the road actually draws instead, and everything below is
         clipped to it (see render). The row's own height wanders with the
         relief and the lens: the crest under the craft moves it by ±hillAmp,
         and the field of view opens by fovKick at speed. Taking the worst of
         both puts skyBase just UNDER the road's furthest row in every frame,
         so the tarmac always runs into the city and a strip of bare plain can
         never open between the two. */
      skyBase = horizonY + Math.ceil(
        (span + T.hillAmp * 2) * T.camZ * (1 + T.fovKick) / T.zRoad) + 1;

      /* The shield rail: full height of the play band, hard against the
         frame's left margin. It is an overlay on the road rather than a band
         cut out of it — the road is a perspective view whose interest is all
         in the middle, and the rail is smoked glass, so nothing the player has
         to read is lost under it. */
      shieldRail.w = T.railW;
      shieldRail.x = Layout.left + T.railGap;
      shieldRail.y = Layout.top + T.railInset;
      shieldRail.h = Layout.h - T.railInset * 2;

      // the sky, darkest overhead and hottest at the skyline. Four stops out
      // of the biome, so a build with no artwork is still the right weather.
      skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, BIO.grad[0]);
      skyGrad.addColorStop(0.46, BIO.grad[1]);
      skyGrad.addColorStop(0.84, BIO.grad[2]);
      skyGrad.addColorStop(1, BIO.grad[3]);

      /* The plain the road is laid across. It opens on the colour the sky cut
         ends with, so the ground the city stands on IS the ground the road is
         on, and drops into the dark over the first eighth of the band — which
         is aerial perspective and not a seam being covered up. */
      foot = skyFoot();
      plainGrad = ctx.createLinearGradient(0, horizonY, 0, view.h);
      plainGrad.addColorStop(0, footCol(1));
      plainGrad.addColorStop(0.11, BIO.plain[0]);
      plainGrad.addColorStop(0.40, BIO.plain[1]);
      plainGrad.addColorStop(1, BIO.plain[2]);

      /* The haze, drawn OVER the road. It used to be a screen — the road
         stopped 70 px short of the horizon and this hid the straight edge
         where it did — and it is aerial perspective now that the tail rows
         close that gap. Which is why it is the ground's own colour and not a
         pink of its own: over the plain it changes nothing, since the plain
         already opens on it, and over the tarmac it sinks the road into the
         distance the way the city behind it already fades. A haze of any
         other colour would lift the plain instead and put the band back. */
      fogGrad = ctx.createLinearGradient(0, horizonY, 0, horizonY + 170);
      fogGrad.addColorStop(0, footCol(0.72));
      fogGrad.addColorStop(0.30, footCol(0.34));
      fogGrad.addColorStop(0.64, footCol(0.12));
      fogGrad.addColorStop(1, footCol(0));

      // the sun, in its own local space so it can slide with the bend
      sunGrad = ctx.createLinearGradient(0, -SUN_R, 0, SUN_R);
      sunGrad.addColorStop(0, BIO.sun[0]);
      sunGrad.addColorStop(0.44, BIO.sun[1]);
      sunGrad.addColorStop(1, BIO.sun[2]);

      /* THE TARMAC RAMPS — the fix for a band that strobed near the horizon.
         `on` is sampled off ONE progress value per row, and a band up by the
         city spans hundreds of progress px: which side of the 44 px stripe its
         sample lands on is then pure aliasing, and the sample moves every
         frame, so the far bands flickered between the two tones on the spot.

         The answer is the one a mipmap gives: a band thinner than a few pixels
         has no alternation left to show and fades to the average of the two
         tones. Precomputed here as two ramps rather than mixed per band —
         fifty bands a frame, and a string built per band is pure garbage. */
      tarmacOn = []; tarmacOff = [];
      for (i = 0; i <= FADE_N; i++) {
        tarmacOn.push(mixHex(BIO.road[0], BIO.road[1], i / FADE_N));
        tarmacOff.push(mixHex(BIO.road[0], BIO.road[2], i / FADE_N));
      }

      stars = [];
      for (i = 0; i < 54; i++) {
        stars.push({ x: Rand.range(-90, view.w + 90), y: Rand.range(6, horizonY - 130),
                     r: Rand.range(1.1, 2.9), a: Rand.range(0.18, 0.7) });
      }
      /* The skyline. Built wider than the frame on both sides, because it is the
         layer the bend moves the most: a straight road puts it dead centre and a
         hard left drags it a good 40 px across. */
      towers = [];
      for (x = -160; x < view.w + 160; ) {
        w = Rand.range(26, 74);
        towers.push({ x: x, w: w, h: Rand.range(24, 132) });
        x += w + Rand.range(6, 26);
      }
    }

    /* THE ROWS the whole frame is built from: one sample of the road every
       `seg` progress px, from just under the lens out to the haze. Their objects
       are recycled between frames — this runs forty-odd times a frame and a
       fresh literal each time would be pure garbage for the collector. */
    // ONE sample of the road, appended to the ladder.
    function pushRow(p) {
      var k = kAt(p), t = forkAmt(p);
      var r = rows[rowN] || (rows[rowN] = {});
      r.p = p; r.k = k; r.t = t;
      r.y  = screenY(p, k);
      r.cx = screenX(roadX(p), k);
      // Half width of one ribbon and how far off the centre line it sits,
      // both already in screen px. On a single road `o` is 0 and `hw` is the
      // full road, so the two branches collapse into one.
      r.hw = branchHalf(p, t) * k;
      r.o  = branchOff(t) * k;
      // Alternating bands. This one flag drives the tarmac tone, the kerbs and
      // the shoulder stripes, which is why they all scroll in lockstep.
      r.on = (Math.floor(p / T.seg) & 1) === 0;
      rowN++;
    }

    function buildRows() {
      var p = Math.floor((camP + T.zNear) / T.seg) * T.seg, lim = camP + T.zFar, z;
      rowN = 0;
      while (p <= lim) { pushRow(p); p += T.seg; }

      /* `farI` is the last rung of the EVEN ladder, and it stays the row the
         sky's parallax hangs off: past it the rows are so far out that their
         screen x barely moves, and a backdrop hung there would sit still. */
      farI = rowN - 1;

      /* Out to zRoad on a growing step. The step stays well inside the bend's
         own wavelength (6600 progress px), so two neighbouring rows are still
         on the same stretch of curve — that is the whole reason these are
         sampled and the old tail could not be. */
      z = T.zFar;
      while (z < T.zRoad) { z = Math.min(T.zRoad, z * T.roadGrow); pushRow(camP + z); }
    }

    /* Where the road disappears. Every parallax layer in the sky hangs off this
       one number, so a bend turns the whole world and not just the tarmac — and
       it reads the last EVEN row, not the last row: the tail converges on the
       optical centre by construction, so hanging the sky off it would pin the
       backdrop dead centre and there would be no parallax left at all. */
    function vanishX() { return farI >= 0 ? rows[farI].cx : halfW; }

    function drawSky() {
      var off = vanishX() - halfW, img = skyArt(), i, s, t, y, iw, ih, dx, slack;

      ctx.fillStyle = skyGrad;
      ctx.fillRect(-BLEED, -BLEED, view.w + BLEED * 2, skyBase + 2 + BLEED);

      if (img) {
        /* Fitted by HEIGHT on the band it has to fill, so the city always
           stands exactly on the road's last row whatever that band measures on
           this device, and the surplus width — the picture is nearly 3:1
           against a 720 px frame — is the room the parallax drifts in. The
           drift is clamped to that slack: running out of picture would expose
           the gradient in a strip down one edge, which reads as a bug and not
           as a wide sky. */
        ih = skyBase + BLEED;
        iw = ih * (img.naturalWidth / img.naturalHeight);
        slack = Math.max(0, (iw - view.w) * 0.5);
        dx = clamp(off * T.skyPara - camX * T.skyShift, -slack, slack);
        ctx.drawImage(img, Math.round(halfW - iw * 0.5 + dx),
                           Math.round(skyBase - ih), Math.round(iw), Math.round(ih));
      }

      // stars, on the slowest parallax: the painted sky carries its own, and
      // these drifting over them at a quarter of the speed is the depth
      ctx.fillStyle = "#eaf6ff";
      for (i = 0; BIO.stars > 0 && i < stars.length; i++) {
        s = stars[i];
        ctx.globalAlpha = Math.min(1, s.a * BIO.stars * (img ? 0.55 : 1));
        ctx.beginPath(); ctx.arc(s.x + off * 0.16, s.y, s.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!img) {
        // the sun: a disc cut by the classic slats, clipped so it sets exactly
        // on the horizon instead of bleeding onto the plain
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, view.w, horizonY); ctx.clip();
        ctx.translate(halfW + off * 0.52, horizonY - 24);
        ctx.fillStyle = sunGrad;
        ctx.beginPath(); ctx.arc(0, 0, SUN_R, 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(24,13,72,.85)";
        for (i = 0; i < 6; i++) {
          y = -16 + i * 22;
          ctx.fillRect(-SUN_R, y, SUN_R * 2, 3 + i * 2.4);
        }
        ctx.restore();

        // the skyline, on the fastest, standing in front of the sun
        ctx.fillStyle = "#110a30";
        for (i = 0; i < towers.length; i++) {
          t = towers[i];
          ctx.fillRect(t.x + off * 0.95, horizonY - t.h, t.w, t.h + 3);
        }
      }

      /* The weld between the sky and the plain. The drawn sky needs it — its
         gradient and the plain's meet on a hard edge — but the painting ends on
         its own band of ground haze, and a second bar over that is the pale
         strip that reads as a third layer between the city and the road. */
      if (!img) {
        ctx.fillStyle = BIO.weld;
        ctx.fillRect(-BLEED, skyBase - 5, view.w + BLEED * 2, 8);
      }
    }

    function drawPlain() {
      var i, r, s, gN;
      ctx.fillStyle = plainGrad;
      ctx.fillRect(-BLEED, horizonY, view.w + BLEED * 2, view.h - horizonY + BLEED);

      /* The grid on the plain: the rows themselves, plus a family of lines that
         converge with them. Both come out of the road's own curve, so the grid
         banks into a bend WITH the tarmac instead of sliding under it. One path,
         one stroke, and the whole plain scrolls. */
      ctx.strokeStyle = BIO.grid;
      ctx.lineWidth = 2;
      ctx.beginPath();
      /* THE GRID STOPS WHERE ITS ROWS DO. Two rows closer than 2 px pile the
         horizontals onto each other, and which of them lands on a pixel then
         changes every frame — the same shimmer the tarmac had. Both families
         end on the road's furthest row, which the painting is laid on, so
         there is nothing beyond it to draw anyway. */
      for (gN = 1; gN < rowN; gN++) if (rows[gN].y - rows[gN - 1].y < 2) break;

      for (i = 0; i + 2 < gN; i += 2) {
        r = rows[i];
        ctx.moveTo(-BLEED, r.y); ctx.lineTo(view.w + BLEED, r.y);
      }
      for (s = -4; s <= 4; s++) {
        if (s === 0) continue;
        for (i = gN - 1; i >= 0; i--) {
          r = rows[i];
          if (i === gN - 1) ctx.moveTo(r.cx + s * 300 * r.k, r.y);
          else ctx.lineTo(r.cx + s * 300 * r.k, r.y);
        }
      }
      ctx.stroke();
    }

    /* ONE RIBBON of tarmac between two rows. `s` is which branch it is: -1 and
       +1 inside a fork, and 0 on a single road — where the branch offset is
       zero anyway, so the three cases are the same four corners and the same
       code. The kerbs are painted on the bright bands only, which turns them
       into dashed neon rails rushing at the camera, and they flare red on the
       side being scraped so the way back onto the tarmac is never ambiguous. */
    function ribbon(a, b, s) {
      var ax = a.cx + s * a.o, bx2 = b.cx + s * b.o, rwA, rwB, gl;
      var fi = fadeI(a.p - b.p);

      if (a.on && fi === FADE_N) {
        rwA = T.rumble * a.k; rwB = T.rumble * b.k;
        gl = railGlow.l;
        ctx.fillStyle = gl > 0.02 ? rgba("#ff2d55", 0.5 + 0.5 * gl) : BIO.kerb[0];
        ctx.beginPath();
        ctx.moveTo(ax - a.hw - rwA, a.y);  ctx.lineTo(ax - a.hw, a.y);
        ctx.lineTo(bx2 - b.hw, b.y);       ctx.lineTo(bx2 - b.hw - rwB, b.y);
        ctx.closePath(); ctx.fill();
        gl = railGlow.r;
        ctx.fillStyle = gl > 0.02 ? rgba("#ff2d55", 0.5 + 0.5 * gl) : BIO.kerb[1];
        ctx.beginPath();
        ctx.moveTo(ax + a.hw, a.y);        ctx.lineTo(ax + a.hw + rwA, a.y);
        ctx.lineTo(bx2 + b.hw + rwB, b.y); ctx.lineTo(bx2 + b.hw, b.y);
        ctx.closePath(); ctx.fill();
      }

      // the tarmac — two tones far enough apart to strobe, and both lifted well
      // clear of black, because the rows nearest the lens are enormous and a
      // near-black one reads as a hole in the frame rather than as road
      ctx.fillStyle = a.on ? tarmacOn[fi] : tarmacOff[fi];
      ctx.beginPath();
      ctx.moveTo(ax - a.hw, a.y);  ctx.lineTo(ax + a.hw, a.y);
      ctx.lineTo(bx2 + b.hw, b.y); ctx.lineTo(bx2 - b.hw, b.y);
      ctx.closePath(); ctx.fill();

      // the centre line: one band in four, so it dashes rather than strobes
      if (fi === FADE_N && (Math.floor(a.p / T.seg) & 3) === 0) {
        ctx.fillStyle = "rgba(220,240,255,.34)";
        ctx.beginPath();
        ctx.moveTo(ax - 5 * a.k, a.y);  ctx.lineTo(ax + 5 * a.k, a.y);
        ctx.lineTo(bx2 + 5 * b.k, b.y); ctx.lineTo(bx2 - 5 * b.k, b.y);
        ctx.closePath(); ctx.fill();
      }
    }

    /* THE ROAD. One band per pair of rows, drawn far to near. The bands
       alternate tone, and that alternation IS the speed: at 400 km/h the tarmac
       visibly strobes past, which no amount of particles can fake. A band
       inside a fork is simply drawn twice, once per branch — and because the
       offset fades to zero at the mouth, the pair peels apart out of a single
       road with no seam to hide. */
    function drawRoad() {
      var i, a, b;

      for (i = rowN - 2; i >= 0; i--) {
        a = rows[i + 1];                                 // the far edge...
        b = rows[i];                                     // ...and the near one
        if (a.y > view.h) continue;                      // wholly under the frame
        if (b.y < horizonY) continue;                    // wholly over a crest
        if (a.y >= b.y) continue;                        // folded: behind one

        // the shoulder: full-width stripes, so the plain scrolls with the road
        if (a.on && fadeI(a.p - b.p) === FADE_N) {
          ctx.fillStyle = "rgba(92,52,190,.20)";
          ctx.fillRect(-BLEED, a.y, view.w + BLEED * 2, b.y - a.y + 1);
        }

        if (a.t > 0.002 || b.t > 0.002) { ribbon(a, b, -1); ribbon(a, b, 1); }
        else ribbon(a, b, 0);
      }
    }

    function drawFog() {
      ctx.fillStyle = fogGrad;
      ctx.fillRect(-BLEED, horizonY, view.w + BLEED * 2, 170);
    }

    /* A soft glow under an item — a radial gradient, not stacked flat discs: a
       hard-edged disc over the dark tarmac reads as a plate rather than light.
       Only a handful of items are on screen, so building it per draw is cheaper
       than caching a sprite per colour. */
    function halo(x, y, r, col) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(col, 0.5));
      g.addColorStop(0.42, rgba(col, 0.16));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
    function bolt(x, y, s, col) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x + 0.20 * s, y - 0.95 * s);
      ctx.lineTo(x - 0.55 * s, y + 0.10 * s);
      ctx.lineTo(x - 0.05 * s, y + 0.10 * s);
      ctx.lineTo(x - 0.25 * s, y + 0.95 * s);
      ctx.lineTo(x + 0.55 * s, y - 0.20 * s);
      ctx.lineTo(x + 0.05 * s, y - 0.20 * s);
      ctx.closePath();
      ctx.fill();
    }

    /* A booster: gold chevrons painted on the track, pointing up the road, and
       nothing else. There is deliberately no panel under them — the plate read
       as an object bolted onto the tarmac, and the arrows alone are both the
       instruction and the invitation. */
    function drawPad(it, k) {
      var i, pf, pn, kf, kn;
      halo(screenX(itemX(it), k), screenY(it.p, k), 100 * k, "#ffd43b");

      ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = "#ffe9a8";
      for (i = 0; i < 3; i++) {
        pf = it.p + 34 - i * 34; pn = pf - 28;
        kf = kAt(pf); kn = kAt(pn);
        ctx.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(runT * 9 - i * 1.4 + it.seed));
        ctx.lineWidth = Math.max(1.5, 8 * kf);
        ctx.beginPath();
        ctx.moveTo(screenX(itemBase(it, pn) + it.off - 48, kn), screenY(pn, kn));
        ctx.lineTo(screenX(itemBase(it, pf) + it.off, kf),      screenY(pf, kf));
        ctx.lineTo(screenX(itemBase(it, pn) + it.off + 48, kn), screenY(pn, kn));
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.lineCap = "butt";
    }

    /* A ramp: the tarmac itself lifting away from the camera. The far lip is
       both higher and narrower than the near one, so it reads as a climb rather
       than as a wall the rider is about to hit. */
    function drawRamp(it, k) {
      var hw = T.rampHalf, pN = it.p - 74, pF = it.p + 74;
      var kN = kAt(pN), kF = kAt(pF), lift = 64 * kF, g, i, t, xl, xr, yy;
      var xNL = screenX(itemBase(it, pN) + it.off - hw, kN);
      var xNR = screenX(itemBase(it, pN) + it.off + hw, kN);
      var xFL = screenX(itemBase(it, pF) + it.off - hw * 0.76, kF);
      var xFR = screenX(itemBase(it, pF) + it.off + hw * 0.76, kF);
      var yN = screenY(pN, kN), yF = screenY(pF, kF) - lift;

      halo(screenX(itemX(it), k), screenY(it.p, k), 124 * k, "#7cf9ff");

      ctx.beginPath();
      ctx.moveTo(xFL, yF); ctx.lineTo(xFR, yF); ctx.lineTo(xNR, yN); ctx.lineTo(xNL, yN);
      ctx.closePath();
      g = ctx.createLinearGradient(0, yF, 0, yN);
      g.addColorStop(0, "rgba(124,249,255,.94)");
      g.addColorStop(1, "rgba(122,77,255,.88)");
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = Math.max(1.5, 4 * k); ctx.strokeStyle = "#eaffff"; ctx.stroke();

      // two arrows up the slope
      ctx.strokeStyle = "rgba(255,255,255,.92)"; ctx.lineJoin = "round"; ctx.lineCap = "round";
      for (i = 0; i < 2; i++) {
        t = 0.34 + i * 0.34;
        yy = yN + (yF - yN) * t;
        xl = xNL + (xFL - xNL) * t; xr = xNR + (xFR - xNR) * t;
        ctx.lineWidth = Math.max(1.5, 7 * (kN + (kF - kN) * t));
        ctx.beginPath();
        ctx.moveTo(xl + (xr - xl) * 0.2, yy + 16 * kF);
        ctx.lineTo((xl + xr) * 0.5,      yy - 10 * kF);
        ctx.lineTo(xr - (xr - xl) * 0.2, yy + 16 * kF);
        ctx.stroke();
      }
      ctx.lineCap = "butt";
    }

    /* A cell or a blocker: a sprite that STANDS UP off the tarmac. Drawn in a
       scaled local space with its foot on the origin, so one set of numbers
       serves every distance and the sprite grows exactly as fast as the road
       under it. */
    function drawStanding(it, x, y, k) {
      var pu, g, i, w, h;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(k, k);

      if (it.type === "cell") {
        // the only green thing out here, so "green = live"
        pu = 1 + Math.sin(runT * 4 + it.seed) * 0.07;
        halo(0, -54, 64 * pu, "#5cffb0");
        // the light it drops on the tarmac: what pins it to a lane
        ctx.save(); ctx.scale(1, 0.34);
        ctx.fillStyle = "rgba(92,255,176,.28)";
        ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill();
        ctx.restore();
        w = 36 * pu; h = 52 * pu;
        g = ctx.createLinearGradient(0, -54 - h / 2, 0, -54 + h / 2);
        g.addColorStop(0, "#eafff5"); g.addColorStop(0.45, "#5cffb0"); g.addColorStop(1, "#0f9d68");
        roundRect(-w / 2, -54 - h / 2, w, h, 9);
        ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = "rgba(2,26,18,.8)"; ctx.stroke();
        ctx.fillStyle = "rgba(2,26,18,.85)";
        ctx.fillRect(-w * 0.18, -54 - h / 2 - 6, w * 0.36, 6);
        bolt(0, -54, 12 * pu, "rgba(4,35,26,.9)");

      } else if (it.type === "bomb") {
        /* A MINE. It hovers, it spins and it PULSES, because a static dark
           sphere on dark tarmac is exactly the thing a player at 400 km/h does
           not see coming. The pulse drives the halo, the core and the ring at
           once, so the whole sprite breathes as one object rather than as a
           ball with decorations stuck on it. */
        pu = 0.5 + 0.5 * Math.sin(runT * 7 + it.seed);
        halo(0, -62, (74 + 22 * pu), "#ff5a2d");
        // the shadow it casts, which is what says "hovering" and not "painted"
        ctx.save(); ctx.scale(1, 0.3);
        ctx.fillStyle = "rgba(0,0,0,.42)";
        ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(0, -62);
        ctx.rotate(runT * 1.6 + it.seed);
        // the casing
        g = ctx.createRadialGradient(-10, -12, 4, 0, 0, 38);
        g.addColorStop(0, "#5a5f7a"); g.addColorStop(0.6, "#20223a"); g.addColorStop(1, "#0a0a18");
        ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU);
        ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = rgba("#ff5a2d", 0.6 + 0.4 * pu); ctx.stroke();
        // the spikes, four of them, so the silhouette reads as a mine at any size
        ctx.fillStyle = "#2a2d46";
        for (i = 0; i < 4; i++) {
          ctx.save(); ctx.rotate(i * Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(-9, -32); ctx.lineTo(0, -50); ctx.lineTo(9, -32);
          ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        // the eye: the brightest thing on it, and the part that actually blinks
        ctx.fillStyle = rgba("#ff5a2d", 0.55 + 0.45 * pu);
        ctx.beginPath(); ctx.arc(0, -62, 15 + 4 * pu, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba("#fff0d6", 0.5 + 0.5 * pu);
        ctx.beginPath(); ctx.arc(0, -62, 7, 0, TAU); ctx.fill();

      } else {
        // a blocker: hazard tape, the loudest thing on the road, because it is
        // the one item the rider MUST read in time. Drawn no wider than its own
        // hitbox, so what looks threaded IS threaded.
        w = 84; h = 78;
        halo(0, -h * 0.5, 96, "#ff2d55");
        roundRect(-w / 2, -h, w, h, 8);
        ctx.fillStyle = "#1b0512"; ctx.fill();
        ctx.save(); ctx.clip();
        ctx.strokeStyle = "rgba(255,212,59,.9)"; ctx.lineWidth = 13;
        for (i = -1; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(-w / 2 + i * 26, 0);
          ctx.lineTo(-w / 2 + i * 26 + 42, -h);
          ctx.stroke();
        }
        ctx.restore();
        roundRect(-w / 2, -h, w, h, 8);
        ctx.lineWidth = 4; ctx.strokeStyle = "#ff2d55"; ctx.stroke();
      }
      ctx.restore();
    }

    /* ── THE PAINTED HULLS ────────────────────────────────────────────────
       Every craft on this road is one file of `assets/image/embed/` now, laid on the
       canvas in the same local space the paths used to be drawn in: the sprite
       is `shipW` design px across, its keel sits on the y the caller has
       already translated to, and everything AROUND it — the roll, the wash,
       the exhaust, the halo, the damage, the boost arcs — is untouched canvas
       work. That split is the point: what a picture is good at is the hull,
       and what it cannot do is move.

       `shipTint` is the one thing a path had for free. The hull took its
       damage as a red fill clipped to its own outline, and a picture has no
       outline — so the tint is pre-rendered into an offscreen canvas once and
       cross-faded over the base. Per frame that is one more drawImage; the
       expensive half happens once, at the top of a round, which is the same
       rule as every other cached canvas in this file.

       There are TWO of them, because damage and a contact are not the same
       event. A FLASH is `source-atop`: a flat silhouette in the colour, which
       is what a rival taking a hit should read as for two frames. A WASH is a
       MULTIPLY followed by `destination-in`, which re-applies the sprite's own
       alpha — the picture keeps every bit of its modelling and goes red, so a
       dying hull is the same craft in trouble and not a red cut-out of it.
       Painting the wash as a flat fill was the first attempt and it erased the
       hull at half strength. */
    var tintCache = {};

    function shipArt(key) {
      var img = key && ArtImages[key];
      // An <img> is only safe to draw once it has decoded. The preloader waits
      // for all of them before the intro, so a miss here is the no-artwork
      // build, and the drawn hull below is the fallback.
      return img && img.complete && img.naturalWidth ? img : null;
    }

    function shipTint(key, col, wash) {
      var id = key + col + (wash ? "w" : "f"), img = shipArt(key), c, g;
      if (!img) return null;
      if (tintCache[id]) return tintCache[id];
      c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      g.globalCompositeOperation = wash ? "multiply" : "source-atop";
      g.fillStyle = col;
      g.fillRect(0, 0, c.width, c.height);
      if (wash) {
        // multiply paints the transparent margin too, so the sprite's own alpha
        // is stamped back over the result
        g.globalCompositeOperation = "destination-in";
        g.drawImage(img, 0, 0);
      }
      tintCache[id] = c;
      return c;
    }

    // Both tints for every hull on the grid, built at reset() so no round ever
    // pays for one mid-flight: the red wash is the player coming apart, the
    // white flash is the frame a rival lights up on for a contact.
    function warmShips() {
      var i;
      shipTint(T.playerArt, "#ff2d55", 1);
      for (i = 0; i < T.foes.length; i++) shipTint(T.foes[i].art, "#ffffff", 0);
    }

    /* Lay one hull, centred on the origin with its keel at y = 4 — the y the
       drawn hulls ended on, so the sprite sits exactly where the paths did.
       Returns false when there is no artwork, which is the fallback's cue. */
    function drawShip(key, w, tint, tintA, wash) {
      var img = shipArt(key), h, t;
      if (!img) return false;
      h = w * img.naturalHeight / img.naturalWidth;
      ctx.drawImage(img, -w / 2, 4 - h, w, h);
      if (tint && tintA > 0) {
        t = shipTint(key, tint, wash);
        if (t) {
          ctx.globalAlpha = tintA < 1 ? tintA : 1;
          ctx.drawImage(t, -w / 2, 4 - h, w, h);
          ctx.globalAlpha = 1;
        }
      }
      return true;
    }

    /* A RIVAL, seen from behind like everything else out here. It is the
       player's own silhouette read at a glance — same hull, same fins — but
       painted in its own livery and lit by two hot rear lamps, so the eye files
       it as "another pilot" and not as an obstacle to shoot for.

       THE LIVERY IS THE TEMPERAMENT and nothing else (`play.foes`): green gets
       out of the way, blue drives straight, yellow is slow and coming for you,
       red boxes your line and violet means to put you in the gravel. Reading
       the colour a second before the craft is in range IS the game out here,
       so the same pilot keeps the same colours all run, and no two kinds share
       a hue. */
    function drawRival(r, k) {
      var x = screenX(rivalX(r), k), y = screenY(r.p, k), sk = T.foes[r.kind].col;
      var g, i, ex, hit = r.bump > 0 && Math.floor(r.bump * 16) % 2;

      if (x < -300 * k || x > view.w + 300 * k) return;
      if (y < horizonY - 40) return;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(k * 0.78, k * 0.78);

      // the pool of light under it, so it sits ON the road at any distance
      halo(0, 0, 96, sk[0]);

      // the exhaust it is dragging, drawn short: a rival is seen from behind at
      // a closing speed, and a long plume would read as the player's own wash
      for (i = 0; i < 2; i++) {
        ex = i ? 24 : -24;
        ctx.fillStyle = rgba(sk[0], 0.34);
        ctx.beginPath(); ctx.arc(ex, 6, 15, 0, TAU); ctx.fill();
      }

      /* THE PAINTED HULL — and the whole of the drawn one below it is the
         fallback. A contact still flashes it white, which is now a wash over
         the picture instead of a gradient stop swapped inside it. */
      if (drawShip(T.foes[r.kind].art, T.rivalW, "#ffffff", hit ? 0.85 : 0, 0)) {
        ctx.restore();
        return;
      }

      // the fins
      ctx.lineWidth = 3; ctx.strokeStyle = rgba("#ffffff", 0.55);
      ctx.fillStyle = sk[1];
      for (i = 0; i < 2; i++) {
        ex = i ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(ex * 44, -46); ctx.lineTo(ex * 76, -12);
        ctx.lineTo(ex * 74, 2);   ctx.lineTo(ex * 38, 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }

      // the hull
      g = ctx.createLinearGradient(0, -92, 0, 4);
      g.addColorStop(0, hit ? "#ffffff" : sk[0]);
      g.addColorStop(1, sk[1]);
      ctx.beginPath();
      ctx.moveTo(-38, 2);  ctx.lineTo(-48, -30); ctx.lineTo(-32, -74);
      ctx.lineTo(-13, -92); ctx.lineTo(13, -92); ctx.lineTo(32, -74);
      ctx.lineTo(48, -30); ctx.lineTo(38, 2);
      ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(3,4,26,.9)"; ctx.stroke();

      // the canopy, matching the player's so the family reads
      ctx.fillStyle = "rgba(10,12,40,.85)";
      ctx.beginPath();
      ctx.moveTo(0, -84);
      ctx.quadraticCurveTo(22, -74, 20, -40);
      ctx.quadraticCurveTo(0, -33, -20, -40);
      ctx.quadraticCurveTo(-22, -74, 0, -84);
      ctx.closePath(); ctx.fill();

      // the two rear lamps: the part that says "there is somebody ahead of you"
      for (i = 0; i < 2; i++) {
        ex = i ? 24 : -24;
        ctx.fillStyle = "#0b0a26";
        ctx.beginPath(); ctx.arc(ex, -20, 16, 0, TAU); ctx.fill();
        ctx.fillStyle = sk[0];
        ctx.beginPath(); ctx.arc(ex, -20, 9, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    /* A CUT, AND IT IS ALWAYS ON THE GROUND. Both kinds used to stand up off
       the road — the checkpoints as arches, the finish as two lit pylons with a
       banner slung between them — and both were furniture the road cannot
       carry: a pair of coloured columns growing out of the horizon reads as a
       thing to AVOID rather than as a line to cross, and a sign hung in the sky
       is not where the eye of a player steering at 400 km/h ever is.

       So a checkpoint is a coloured line on the tarmac and the finish is the
       gold chequers, full width, and there is nothing above either of them.
       What the arch was there to announce is said in the corner instead — the
       rank pill counts the gate down in metres and turns red the moment the
       place is not good enough — and said again by the vignette and the chime
       at `cutWarn`. */
    function drawGate(cut, isLast) {
      var p = cut.at * T.pxPerM;
      var half = roadHalf(p) + branchOff(forkAmt(p)) + T.rumble + T.gateOut;

      /* THE FINISH is the chequered flag, full width, and nothing above it. */
      if (isLast) { groundBand(p, half); return; }
      /* A CHECKPOINT is a coloured line, and it stops at the KERBS — one
         running past the neon rails reads as a bar across the scene instead of
         a mark on the tarmac. Green while the place is good enough, red while
         it is not: the one question a gate ever asks. */
      checkLine(p, half - T.gateOut, rank <= cut.rank ? "#5cffb0" : "#ff2d55");
    }

    /* A CHECKPOINT, and it is one stripe. Laid in the road's own space like
       the finish chequers, so it banks into a bend with the tarmac; thin enough
       and pale enough that it never hides the road the player is reading for
       mines at the one moment they are threading a wall, and coloured, so
       whether it is about to end the run is still legible from the far side of
       the horizon. The brighter core is what keeps it visible once the stripe
       is a pixel tall. */
    function checkLine(p, half, col) {
      // Two stripes on the same line: a soft one 26 progress px deep and a
      // bright core inside it. The core is what survives once the whole thing
      // projects to a pixel, which is most of the way in.
      band(p, 13, half, col, 0.26);
      band(p, 4, half, col, 0.62);
    }
    // One stripe across the road, `d` progress px either side of `p`.
    function band(p, d, half, col, alpha) {
      var pF = p + d, pN = p - d, kF = kAt(pF), kN = kAt(pN);
      if (kF <= 0 || kN <= 0) return;
      ctx.beginPath();
      ctx.moveTo(screenX(roadX(pF) - half, kF), screenY(pF, kF));
      ctx.lineTo(screenX(roadX(pF) + half, kF), screenY(pF, kF));
      ctx.lineTo(screenX(roadX(pN) + half, kN), screenY(pN, kN));
      ctx.lineTo(screenX(roadX(pN) - half, kN), screenY(pN, kN));
      ctx.closePath();
      ctx.fillStyle = rgba(col, alpha);
      ctx.fill();
    }

    /* THE FINISH LINE, and it is now the WHOLE announcement — the arch that
       used to stand over it is gone (see drawGate). So it is a real chequered
       flag and not one row of squares: TWO rows, each 46 progress px deep, the
       second offset by a cell. Laid in the road's own space, so the pattern
       banks into a bend with the tarmac instead of sliding across it, and
       two rows are what still reads as "chequered" from the far side of the
       horizon where one row is a dotted line. */
    function groundBand(p, half) {
      flagRow(p - 46, p, 0, half);
      flagRow(p, p + 46, 1, half);
    }
    // One row of eight chequers, from progress `pN` to `pF`, starting on the
    // light square when `odd` is set.
    function flagRow(pN, pF, odd, half) {
      var kF = kAt(pF), kN = kAt(pN), i, n = 8, a, b;
      if (kF <= 0 || kN <= 0) return;
      for (i = 0; i < n; i++) {
        a = -half + (2 * half) * (i / n);
        b = -half + (2 * half) * ((i + 1) / n);
        ctx.beginPath();
        ctx.moveTo(screenX(roadX(pF) + a, kF), screenY(pF, kF));
        ctx.lineTo(screenX(roadX(pF) + b, kF), screenY(pF, kF));
        ctx.lineTo(screenX(roadX(pN) + b, kN), screenY(pN, kN));
        ctx.lineTo(screenX(roadX(pN) + a, kN), screenY(pN, kN));
        ctx.closePath();
        ctx.fillStyle = ((i + odd) & 1) ? "rgba(250,250,255,.92)" : "rgba(18,14,40,.92)";
        ctx.fill();
      }
    }

    /* EVERYTHING ON THE ROAD, painted far to near in ONE pass. The items are
       already in progress order but the rivals move between them, so the two
       lists are merged into `paint` and sorted by progress — otherwise a rival
       overtaking a mine would be drawn behind it one frame and in front of it
       the next. The array is reused between frames; only its length moves. */
    function drawItems() {
      var i, e, z, k, x, y, n = 0;

      for (i = 0; i < items.length; i++) {
        z = items[i].p - camP;
        // The near cut is well short of the lens: anything closer projects to
        // hundreds of px of sprite below the bottom of the frame, all of it paid
        // for and none of it seen.
        if (z > T.zFar || z < T.camZ * 0.5) continue;
        e = paint[n] || (paint[n] = {});
        e.p = items[i].p; e.it = items[i]; e.r = null; e.g = null;
        n++;
      }
      for (i = 0; i < rivals.length; i++) {
        z = rivals[i].p - camP;
        if (z > T.zFar || z < T.camZ * 0.4) continue;
        e = paint[n] || (paint[n] = {});
        e.p = rivals[i].p; e.it = null; e.r = rivals[i]; e.g = null;
        n++;
      }
      // The gates ride the same list, so a rival that has already cleared one
      // draws in front of its arch and one still short of it draws behind.
      // They start drawing well beyond `zFar`: a cut has to be seen coming.
      for (i = cutI; i < T.cuts.length; i++) {
        z = T.cuts[i].at * T.pxPerM - camP;
        if (z > T.gateFrom || z < -60) continue;
        e = paint[n] || (paint[n] = {});
        e.p = T.cuts[i].at * T.pxPerM; e.it = null; e.r = null;
        e.g = T.cuts[i]; e.last = i === T.cuts.length - 1;
        n++;
      }
      paint.length = n;
      paint.sort(function (a, b) { return b.p - a.p; });   // far first

      for (i = 0; i < n; i++) {
        e = paint[i];
        k = kAt(e.p);
        if (e.g) { drawGate(e.g, e.last); continue; }
        if (e.r) { drawRival(e.r, k); continue; }
        if (e.it.type === "boost") { drawPad(e.it, k); continue; }
        if (e.it.type === "ramp")  { drawRamp(e.it, k); continue; }
        x = screenX(itemX(e.it), k);
        if (x < -240 * k || x > view.w + 240 * k) continue;
        y = screenY(e.p, k);
        if (y < horizonY - 40) continue;
        drawStanding(e.it, x, y, k);
      }
      ctx.lineJoin = "miter";
    }

    /* THE THRUST WASH: the line the craft actually rode, blowing out of the
       bottom of the frame. Every sample is stamped at the CRAFT's progress, so
       as the run advances it slides from the craft's row down past the lens,
       widening as it comes. It is the closest thing to the camera and therefore
       the fastest thing in the frame — which is exactly what sells the speed. */
    function drawWash() {
      var i, m = 0, s, k, pass, f;
      for (i = 0; i < trail.length; i++) {
        s = trail[i];
        if (s.p - camP < 26) break;
        k = kAt(s.p);
        if (k > 9) break;                                // already past the lens
        wash[m] = wash[m] || {};
        wash[m].x = screenX(s.x, k);
        wash[m].y = screenY(s.p, k);
        wash[m].w = 13 * k;
        m++;
      }
      if (m < 2) return;
      ctx.lineCap = "round";
      // Three passes, widest and coolest first: a violet flare, a cyan body and
      // a hot core. One pass alone either reads as a stick (if it is narrow) or
      // as a smudge (if it is wide) — the taper needs the layers.
      for (pass = 0; pass < 3; pass++) {
        for (i = 1; i < m; i++) {
          // It dissipates as it drifts back, but only down to a floor: fading it
          // out completely would erase the widest, nearest, fastest part of the
          // cone, which is the only part actually doing the work.
          f = 0.55 + 0.45 * (1 - i / m);
          ctx.strokeStyle = rgba(WASH_COL[pass], WASH_A[pass] * f);
          ctx.lineWidth = WASH_W[pass] * wash[i].w + 2;
          ctx.beginPath();
          ctx.moveTo(wash[i - 1].x, wash[i - 1].y);
          ctx.lineTo(wash[i].x, wash[i].y);
          ctx.stroke();
        }
      }
      ctx.lineCap = "butt";
    }

    /* Warp streaks. On a static camera the right cue is vertical lines; behind a
       craft they have to come OUT of the point everything else converges into,
       so they are laid on a fan of golden angles around the vanishing point and
       stretch with the speed. One path, one stroke. */
    function drawStreaks() {
      var s, n, i, a, r0, len, ca, sa, xv = vanishX(), sp = 940;
      s = clamp((speed - T.speedMin) / (T.speedMax * (1 + T.boostGain) - T.speedMin), 0, 1);
      if (boostT > 0) s = Math.max(s, 0.82);
      if (s < 0.04) return;
      n = Math.round(6 + s * 20);
      ctx.strokeStyle = rgba(boostT > 0 ? "#ffe9a8" : "#cdf3ff", 0.09 + 0.26 * s);
      ctx.lineWidth = 2.5 + 2.5 * s;
      ctx.beginPath();
      for (i = 0; i < n; i++) {
        a = (i * 2.399963) % TAU;                        // golden angle: an even fan
        r0 = (i * 179 + camP * (2.1 + (i % 4) * 0.7)) % sp;
        len = 30 + 210 * s * (0.25 + 0.75 * r0 / sp);
        // Flattened, because the road is wide — and squashed harder above the
        // horizon, where a long streak reads as a scratch on the frame instead
        // of as ground rushing past.
        ca = Math.cos(a); sa = Math.sin(a);
        sa *= sa < 0 ? 0.3 : 0.9;
        ctx.moveTo(xv + ca * r0, horizonY + sa * r0);
        ctx.lineTo(xv + ca * (r0 + len), horizonY + sa * (r0 + len));
      }
      ctx.stroke();
    }

    /* THE CRAFT, seen from behind. From this camera the roll IS the read: the
       hull banks around its own axis, slides across the frame as the camera
       catches up, and the two nozzles pointing straight down the lens do the
       rest. Airborne it rises and grows and drops a shadow on the tarmac it
       left. */
    function drawCraft() {
      var x = craftX(), y = craftY(), k = 1 + fov;
      // 0.84: the sprite is authored at a comfortable size to draw and then sat
      // back down to a third of the road's width, which is where it stops
      // covering the gate it is being steered into.
      var sc = k * 0.84 * (1 + airZ * 0.12), g, i, j, ex, sg, fl, sNorm;

      drawWash();

      if (airZ > 0.02) {                                 // the shadow it left below
        ctx.fillStyle = "rgba(0,0,0,.42)";
        ctx.save();
        ctx.translate(x, horizonY + span * k);
        ctx.scale(1, 0.34);
        ctx.beginPath(); ctx.arc(0, 0, 58 * k, 0, TAU); ctx.fill();
        ctx.restore();
      }
      if (invT > 0 && Math.floor(invT * 14) % 2) return; // blink after a crash

      // the pool of light it hovers in — it goes red as the hull goes
      halo(x, y, 118 * sc, dmg > 0.35 ? "#ff2d55" : "#35e8ff");
      halo(x, y, 68 * sc, dmg > 0.35 ? "#ff5a2d" : "#8a5cff");

      // the exhaust, straight down the lens, growing with the speed
      sNorm = clamp((speed - T.speedMin) / (T.speedMax - T.speedMin), 0, 1);
      fl = (0.55 + 0.65 * sNorm + (boostT > 0 ? 0.7 : 0)) * Rand.range(0.9, 1.1);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      for (i = 0; i < 2; i++) {
        ex = i ? 27 : -27;
        for (j = 0; j < 3; j++) {
          ctx.fillStyle = rgba(boostT > 0 ? "#ffd43b" : "#7cf9ff", 0.34 - j * 0.09);
          ctx.beginPath(); ctx.arc(ex, -18 + j * 22 * fl, (13 + j * 9) * fl, 0, TAU); ctx.fill();
        }
      }
      ctx.restore();

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      // the roll, around the hull's own axis and not its contact patch. A mine's
      // blast adds its own on top (see takeBomb), which is what turns a hit into
      // the craft being thrown rather than a number changing. The picture rides
      // it exactly like the paths did — the lean is the transform, never the
      // sprite, which is the reason a painted hull costs the game nothing.
      ctx.translate(0, -52);
      ctx.rotate(lean * T.leanMax + kickRoll * T.leanMax);
      ctx.translate(0, 52);

      /* THE PAINTED HULL, and the damage laid over it as the same red wash the
         drawn one clipped to its outline: the healthy craft is the picture
         untouched and the wreck is the same silhouette gone red, which is what
         makes the change read as damage and not as a different ship. */
      if (drawShip(T.playerArt, T.shipW, "#ff2d55",
                   dmg > 0 ? 0.34 + 0.56 * dmg * (0.72 + 0.28 * Math.sin(runT * 12)) : 0, 1)) {
        // the arcs off the hull while a booster burns — the one drawn thing the
        // picture cannot carry, because it is lightning and it moves
        if (boostT > 0) {
          ctx.strokeStyle = "rgba(214,246,255,.85)"; ctx.lineWidth = 2.5;
          for (i = 0; i < 3; i++) {
            ex = (i % 2 ? 58 : -58);
            ctx.beginPath(); ctx.moveTo(ex, -30);
            ctx.lineTo(ex + Rand.range(-16, 16), -12);
            ctx.lineTo(ex + Rand.range(-22, 22), 6);
            ctx.stroke();
          }
        }
        ctx.restore();
        return;
      }

      // the two side fins: swept back and stubby, so the silhouette stays a
      // hover craft and does not turn into an aeroplane
      ctx.lineWidth = 3; ctx.strokeStyle = "rgba(200,240,255,.7)";
      ctx.fillStyle = "rgba(122,77,255,.92)";
      for (i = 0; i < 2; i++) {
        sg = i ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(sg * 50, -52); ctx.lineTo(sg * 86, -14);
        ctx.lineTo(sg * 84, 2);   ctx.lineTo(sg * 44, 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }

      // the hull
      g = ctx.createLinearGradient(0, -104, 0, 4);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.34, "#7cf9ff"); g.addColorStop(1, "#5a2fd6");
      ctx.beginPath();
      ctx.moveTo(-44, 2);   ctx.lineTo(-54, -34); ctx.lineTo(-36, -84);
      ctx.lineTo(-15, -104); ctx.lineTo(15, -104); ctx.lineTo(36, -84);
      ctx.lineTo(54, -34);  ctx.lineTo(44, 2);
      ctx.closePath();
      ctx.fillStyle = g; ctx.fill();

      /* THE DAMAGE, laid over the hull rather than mixed into its gradient:
         one red wash whose opacity IS `dmg`, pulsing once the hull is really
         going, plus scorch cracks. Painting it on top means the healthy craft
         is untouched code and the wreck is the same silhouette gone red, which
         is what makes the change read as damage and not as a different ship. */
      if (dmg > 0) {
        ctx.save();
        ctx.clip();                                   // still the hull path
        ctx.globalAlpha = 0.32 + 0.5 * dmg * (0.72 + 0.28 * Math.sin(runT * 12));
        ctx.fillStyle = "#ff2d55";
        ctx.fillRect(-60, -110, 120, 118);
        ctx.globalAlpha = 1;
        if (dmg > 0.4) {
          ctx.strokeStyle = "rgba(20,0,6,.85)"; ctx.lineWidth = 4; ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(-34, -12); ctx.lineTo(-14, -44); ctx.lineTo(-26, -58); ctx.lineTo(-8, -86);
          ctx.moveTo(30, -18);  ctx.lineTo(14, -40);  ctx.lineTo(28, -62);
          ctx.stroke();
        }
        ctx.restore();
        ctx.beginPath();                              // rebuild it for the outline
        ctx.moveTo(-44, 2);   ctx.lineTo(-54, -34); ctx.lineTo(-36, -84);
        ctx.lineTo(-15, -104); ctx.lineTo(15, -104); ctx.lineTo(36, -84);
        ctx.lineTo(54, -34);  ctx.lineTo(44, 2);
        ctx.closePath();
      }
      ctx.lineWidth = 4;
      ctx.strokeStyle = dmg > 0.4 ? rgba("#ff2d55", 0.9) : "rgba(3,4,26,.9)";
      ctx.stroke();

      // the nozzles: the two brightest points on the sprite
      for (i = 0; i < 2; i++) {
        ex = i ? 27 : -27;
        ctx.fillStyle = "#0b0a26";
        ctx.beginPath(); ctx.arc(ex, -22, 19, 0, TAU); ctx.fill();
        ctx.lineWidth = 3.5; ctx.strokeStyle = rgba("#35e8ff", 0.9); ctx.stroke();
        ctx.fillStyle = boostT > 0 ? "#fff3c4" : "#cdf7ff";
        ctx.beginPath(); ctx.arc(ex, -22, 10, 0, TAU); ctx.fill();
      }

      /* THE CANOPY — a tinted blister sunk INTO the hull, and the reason
         nothing stands above the nose any more. A head-and-shoulders on top
         read as a rider on a bike; a teardrop lying flat on the deck reads as
         a cockpit, which is what turns the same silhouette into a craft. It is
         drawn before the spoiler so the spoiler crosses its tail. */
      g = ctx.createLinearGradient(0, -96, 0, -40);
      g.addColorStop(0, "#eaffff");
      g.addColorStop(0.42, "rgba(53,232,255,.85)");
      g.addColorStop(1, "rgba(16,12,74,.95)");
      ctx.beginPath();
      ctx.moveTo(0, -96);
      ctx.quadraticCurveTo(27, -86, 25, -44);
      ctx.quadraticCurveTo(0, -36, -25, -44);
      ctx.quadraticCurveTo(-27, -86, 0, -96);
      ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 3.5; ctx.strokeStyle = "rgba(3,4,26,.85)"; ctx.stroke();
      // the glare down the glass: what stops it reading as a hole in the deck
      ctx.fillStyle = "rgba(255,255,255,.42)";
      ctx.beginPath();
      ctx.moveTo(-6, -88); ctx.quadraticCurveTo(-16, -76, -13, -54);
      ctx.quadraticCurveTo(-4, -60, -2, -86);
      ctx.closePath(); ctx.fill();

      // the spoiler across the nose, sitting flush on the hull
      ctx.fillStyle = "#dff6ff";
      roundRect(-46, -110, 92, 11, 5); ctx.fill();
      ctx.fillStyle = "rgba(3,4,26,.75)";
      ctx.fillRect(-46, -110, 10, 11); ctx.fillRect(36, -110, 10, 11);

      // electric arcs off the hull while a booster burns
      if (boostT > 0) {
        ctx.strokeStyle = "rgba(214,246,255,.85)"; ctx.lineWidth = 2.5;
        for (i = 0; i < 3; i++) {
          ex = (i % 2 ? 58 : -58);
          ctx.beginPath(); ctx.moveTo(ex, -30);
          ctx.lineTo(ex + Rand.range(-16, 16), -12);
          ctx.lineTo(ex + Rand.range(-22, 22), 6);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    /* THE DEBRIS, painted with the traffic's own projection but after it: it is
       never more than a second old and it is always between the barrier that
       broke and the lens, so there is nothing left for it to hide. Flat rotated
       rects — the cheapest thing on the road, and the right shape for lengths of
       broken tape. */
    function drawShards() {
      var i, s, k, x, y, a, w, h;
      for (i = 0; i < shards.length; i++) {
        s = shards[i];
        if (s.p - camP > T.zFar) continue;
        k = kAt(s.p);
        x = screenX(s.x, k);
        if (x < -90 || x > view.w + 90) continue;
        y = screenY(s.p, k) - s.z * k;
        if (y < horizonY) continue;
        a = clamp(s.life / 0.32, 0, 1);            // the last third of a second
        w = s.w * k; h = s.h * k;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(s.rot);
        ctx.fillStyle = rgba(s.col, 0.92 * a);
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      }
    }

    /* ====================================================================
       THE SHIELD RAIL — down the left flank of the frame

       The HUD pill says the same thing in eight point type at the top of the
       frame, where a player at 400 km/h is not looking. This says it in the
       player's peripheral vision instead, the whole height of the play band, so
       a shield running out is felt rather than read. Built like the spin rail in
       games/spinshock: smoked glass the road shows straight through, cells
       filled from the bottom, an arc and a chevron at the value, every alpha
       kept well under 1 and no shadowBlur anywhere.
       ==================================================================== */

    // The shield's colour: ice-cyan at full, cooling through gold to a dying red
    // at empty, so the rail and the hull can never disagree about the run.
    // Five stops rather than four, and the extra one is a chartreuse: the direct
    // mix of the green and the gold is an olive that reads as dirt on the glass
    // rather than as a warning, and the mid of the ramp is where a rail spends
    // most of a run.
    var SHIELD_TIERS = ["#7cf9ff", "#5cffb0", "#c6ff4f", "#ffb347", "#ff2d55"];

    function hex2(n) { var s = (n | 0).toString(16); return s.length < 2 ? "0" + s : s; }
    function mixHex(a, b, t) {
      var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
      return "#" + hex2(((x >> 16) & 255) + ((((y >> 16) & 255) - ((x >> 16) & 255)) * t))
                 + hex2(((x >> 8) & 255)  + ((((y >> 8) & 255)  - ((x >> 8) & 255))  * t))
                 + hex2((x & 255)         + (((y & 255)         - (x & 255))         * t));
    }
    /* Curved rather than linear, exactly the way the top in games/spinshock cools
       down: the warm half of the ramp is reserved for a hull that is genuinely in
       trouble, so a shield at 60% still reads green — one hit taken — and only a
       run that is actually about to end turns the flank of the frame red. */
    function shieldCol() {
      var n = SHIELD_TIERS.length - 1;
      var u = Math.pow(1 - clamp(shield / T.shieldMax, 0, 1), 1.5) * n;
      var i = Math.min(n - 1, Math.floor(u));
      return mixHex(SHIELD_TIERS[i], SHIELD_TIERS[i + 1], u - i);
    }
    /* The rail's animation, driven from update() and not from the draw call, so
       a hit-stopped frame does not quietly keep animating it: the ghost head
       chases the real value and a change discharges the rail. */
    function updateRails(dt) {
      railT += dt;
      if (shield !== shieldSeen) {
        railPunch = 1;
        railCol = shield > shieldSeen ? "#5cffb0" : "#ff2d55";
        shieldSeen = shield;
      }
      if (railPunch > 0) railPunch = Math.max(0, railPunch - dt * 3.2);
      /* The ghost falls slowly and catches up quickly: what it exists for is the
         band of red left above a shield that just took a hit, and a charge that
         lagged behind its own repair would be lying about how safe the craft is. */
      if (shieldLag > shield) {
        shieldLag = Math.max(shield, shieldLag - dt * (22 + (shieldLag - shield) * 3.4));
      } else if (shieldLag < shield) {
        shieldLag = Math.min(shield, shieldLag + dt * (60 + (shield - shieldLag) * 6));
      }
    }

    /* The glass every rail is cut from: a smoked pane with a light down one
       flank, which is the whole trick that makes it read as glass over the road.
       `tint` is optional and washes the whole pane in a colour — the board rail
       uses it to answer "am I through?" with the ENTIRE bar and not only with
       the marker sliding about on it. */
    function railGlass(r, tint) {
      var g;
      roundRect(r.x, r.y, r.w, r.h, r.w / 2);
      ctx.fillStyle = "rgba(4,4,20,.26)";
      ctx.fill();
      if (tint) {
        roundRect(r.x, r.y, r.w, r.h, r.w / 2);
        ctx.fillStyle = rgba(tint, 0.10);
        ctx.fill();
      }
      g = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
      g.addColorStop(0, "rgba(255,255,255,.06)");
      g.addColorStop(0.35, "rgba(255,255,255,.01)");
      g.addColorStop(1, "rgba(0,0,0,.08)");
      ctx.fillStyle = g;
      roundRect(r.x, r.y, r.w, r.h, r.w / 2);
      ctx.fill();
    }
    // The hairline rim, plus the concentric strokes that stand in for a glow a
    // per-frame shadowBlur could never pay for.
    function railRim(r, col, punch, pulse) {
      var i;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,.09)";
      roundRect(r.x, r.y, r.w, r.h, r.w / 2); ctx.stroke();
      if (pulse > 0) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = rgba("#ff2d55", 0.14 + 0.4 * pulse);
        roundRect(r.x, r.y, r.w, r.h, r.w / 2); ctx.stroke();
      }
      if (punch > 0) {
        for (i = 0; i < 3; i++) {
          ctx.lineWidth = 3 + i * 5;
          ctx.strokeStyle = rgba(col, punch * (0.22 - i * 0.07));
          roundRect(r.x - i * 2, r.y - i * 2, r.w + i * 4, r.h + i * 4, r.w / 2 + i * 2);
          ctx.stroke();
        }
      }
    }
    /* The chevron that marks a value, hung off the INSIDE flank of its rail so
       both of them point into the frame the player is watching. `s` is +1 for a
       rail on the left of the screen and -1 for one on the right. */
    function railHead(r, y, s, col, a, size) {
      var x = s > 0 ? r.x + r.w : r.x;
      ctx.fillStyle = rgba(col, a);
      ctx.beginPath();
      ctx.moveTo(x + s * 7, y);
      ctx.lineTo(x + s * (7 + size), y - size * 0.62);
      ctx.lineTo(x + s * (7 + size), y + size * 0.62);
      ctx.closePath(); ctx.fill();
      // and the line across the rail it is pointing at
      ctx.fillStyle = rgba(col, a * 0.9);
      ctx.fillRect(r.x + 2, y - 1.5, r.w - 4, 3);
    }

    /* THE SHIELD RAIL. Twenty cells filled bottom-up, the lit column burning the
       hull's own colour, and the band between the value and its ghost flashing
       white for charge taken on and red for charge knocked off — which is what
       makes a hit legible at a glance instead of a silent slide. Under `lowAt`
       the whole rail pulses, on the same beat the frame is already shaking. */
    function drawShieldRail() {
      var r = shieldRail, i, lo, hi, cellY, cellH, f, g, a, b, k;
      var col = shieldCol(), max = T.shieldMax;
      var low = shield <= T.lowAt;
      var pulse = low ? 0.5 + 0.5 * Math.sin(railT * 11) : 0;
      var fv = clamp(shield / max, 0, 1), fg = clamp(shieldLag / max, 0, 1);

      ctx.save();
      railGlass(r);

      // the cells, clipped to the rail so both of its ends stay clean
      ctx.save();
      roundRect(r.x, r.y, r.w, r.h, r.w / 2); ctx.clip();
      cellH = (r.h - T.railPad * (T.railSegs - 1)) / T.railSegs;
      for (i = 0; i < T.railSegs; i++) {
        lo = i / T.railSegs;
        cellY = r.y + r.h - (i + 1) * cellH - i * T.railPad;
        f = clamp((fv - lo) * T.railSegs, 0, 1);       // the real value...
        g = clamp((fg - lo) * T.railSegs, 0, 1);       // ...and its ghost
        a = Math.min(f, g); b = Math.max(f, g);
        // the dead cell, so an empty rail still reads as a scale
        if (b < 0.999) {
          roundRect(r.x + 4, cellY, r.w - 8, cellH, 4);
          ctx.fillStyle = "rgba(255,255,255,.035)";
          ctx.fill();
        }
        if (b <= 0) continue;
        // the lit part, brighter towards the head so the column reads as a
        // direction and not as a block
        if (f > 0) {
          k = fv > 0.001 ? clamp((lo + 0.5 / T.railSegs) / fv, 0, 1) : 0;
          ctx.fillStyle = rgba(col, 0.30 + 0.55 * k * k);
          ctx.save();
          roundRect(r.x + 4, cellY, r.w - 8, cellH, 4); ctx.clip();
          ctx.fillRect(r.x + 4, cellY + cellH * (1 - f), r.w - 8, cellH * f);
          ctx.restore();
        }
        // the delta band: white for charge just won, red for charge just lost
        if (b - a > 0.01) {
          ctx.fillStyle = shield > shieldLag ? "rgba(255,255,255,.58)"
                                            : "rgba(255,45,85,.5)";
          ctx.save();
          roundRect(r.x + 4, cellY, r.w - 8, cellH, 4); ctx.clip();
          ctx.fillRect(r.x + 4, cellY + cellH * (1 - b), r.w - 8, cellH * (b - a));
          ctx.restore();
        }
      }
      ctx.restore();

      // the alarm threshold, and the head at the real value (never the ghost:
      // the ghost's job is to show what was just lost above it)
      hi = r.y + r.h * (1 - clamp(T.lowAt / max, 0, 1));
      ctx.fillStyle = "rgba(255,45,85,.5)";
      ctx.fillRect(r.x + 3, hi - 1, r.w - 6, 2);
      if (fv > 0.001) railHead(r, r.y + r.h * (1 - fv), 1, col, 0.6 + 0.4 * railPunch, 13);

      railRim(r, railCol, railPunch, pulse);
      ctx.restore();
    }

    /* THE SPEEDOMETER — bottom-left of the play band, in the column the shield
       rail already owns, because that side of the frame IS the instrument side
       and the road's interest is all in the middle. It sits just clear of the
       rail and just above `Layout.bottom`, so it is over the CTA bar on the
       playable and over nothing on the web target, whose own two controls are
       in the opposite corner.

       No plate under it and no glow behind it: a box would be a second object
       to read and `shadowBlur` is banned per frame (see CLAUDE.md). What keeps
       three digits legible over a bright road is the same thing that keeps the
       HUD legible — a dark stroke around them, drawn once.

       The colour is the only thing it says beyond the figure: gold while a
       booster burns, red while the gravel is taking the pace off, white the
       rest of the time. That is the dial reading back the two things that move
       it, in the place the eye is already looking for the shield. */
    function drawSpeedo() {
      var r = shieldRail, x = r.x + r.w + 14, y = Layout.bottom - 16;
      var n = String(Math.max(0, Math.round(kmhShown))), col;
      col = boostT > 0 ? "#ffd43b" : mult < 0.9 ? "#ff2d55" : "#ffffff";

      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.lineJoin = "round";
      /* The outline is what makes it legible, and it has to be strong: the MIST
         biome lays a pale lilac road and white digits on it read as nothing. */
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(4,4,20,.72)";

      ctx.font = "900 52px " + speedoFont;
      ctx.strokeText(n, x, y);
      ctx.fillStyle = col;
      ctx.fillText(n, x, y);

      x += ctx.measureText(n).width + 10;
      ctx.font = "900 20px " + speedoFont;
      ctx.lineWidth = 5;
      ctx.strokeText("KM/H", x, y);
      ctx.fillStyle = rgba(col, 0.9);
      ctx.fillText("KM/H", x, y);
      ctx.restore();
    }

    function render() {
      buildRows();
      drawSky();
      /* EVERYTHING ON THE GROUND IS CLIPPED TO THE PAINTING'S FOOT. The road's
         furthest row sits above skyBase by design, so the tarmac, the grid and
         a gate rising out of the distance all run INTO the city and are cut
         there — which is what makes the two one picture. The craft and the
         rail are the player's own layer and stay outside it. */
      ctx.save();
      ctx.beginPath();
      ctx.rect(-BLEED, skyBase, view.w + BLEED * 2, view.h - skyBase + BLEED);
      ctx.clip();
      drawPlain();
      drawRoad();
      drawFog();
      drawItems();
      drawShards();
      drawStreaks();
      ctx.restore();
      drawCraft();
      drawShieldRail();
      drawSpeedo();
    }

    function onResize() { metrics(); lens(); }

    /* --- THE LEVEL LAYER (web target) ------------------------------------
       `levelProgress` is what a level's objective is measured against while
       the round runs, and it is the same number the result reports as
       `levelScore`: `dist`, the road actually covered — never `travel`, which
       is the SCORE's distance and counts double under a booster. A level
       asking for 900 m has to mean 900 m of tarmac, and the arch that ends the
       race stands on that same number (see `cutsFor`); measuring the objective
       on the boosted counter would fire the third star before the player ever
       reached the chequered flag.

       `levelStars` is the second, and it is what makes the board a RACE
       result rather than a distance read: the shell's three bands say whether
       the objective was covered, and this caps them — a run that stopped
       short of the flag is worth one star however far it drove, the flag
       itself is worth two, and only first place is worth three (see
       `raceStars`). It filters the live pill as well as the end screen, so
       the stars the round wears are the stars it will be paid.

       `levelWon` is the shell's own three-star finish. It cannot fire here any
       more — nothing raises the count past one before the flag, and the flag
       ends the round through `win()` on the same frame — but it stays pointed
       at the podium, which is the truthful ending if the shell ever reaches
       for it. `applyLevel` is the fourth and it is at the top of this module,
       because what it rewrites — the biome, the trace, the cuts, which hazards
       exist — is read all over the file. All of them are ignored by the
       playable, which has no levels — see docs/LEVELS.md. */
    function levelProgress() { return Math.floor(dist); }

    function levelStars(st) {
      if (finished) return rank === 1 ? 3 : 2;
      return Math.min(st, 1);
    }

    return { reset: reset, update: update, render: render,
             onDown: onDown, onMove: onMove, onUp: onUp, onResize: onResize,
             /* `levelWon` is the PODIUM and not `die`: the last arch stands on
                the level's third star, so a shell-side win could only ever
                happen at the chequered flag with every cut behind it — which
                is a race won, finish bonus included. The level layer writes
                the title over it either way. */
             levelProgress: levelProgress, levelStars: levelStars,
             levelWon: win,
             applyLevel: applyLevel };
  })();

