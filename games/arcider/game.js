  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Arcider",
    /* One sentence, and nothing else: the stage under it shows the finger
       pressing one side and the bike carving that way, so the line only has to
       name the gesture, the machine and the fuel. */
    tagline: "Lean your ship <b class=\"w-press\">left or right</b> to <b class=\"w-pass\">overtake</b> and never break your <b class=\"w-shield\">shield</b>",
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
    intro: { logo: "logo", demo: "hold", caption: "",
             // on a desk: the arrows, held (shell.js, Demo)
             desk: [{ keys: ["left", "right"], does: "Tilt" }] },

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
    /* `seam`: every window loops on the bar, two beats of crossfade ending on
       its downbeat (docs/MUSIC.md, The seam); `cut`: the playable's window,
       one seam of pre-roll into its embedded cut. */
    music: {
      volume: 0.11, fade: 1.8, seam: 0.8,
      cut: { from: 0.8, length: 36.747 },
      menu: { from: 0, length: 35.155, rate: 0.85, gain: 0.5 }
    },

    // All user-facing copy in one place.
    copy: {
      start:      "Start",
      ctaBar:     "Install now",
      ctaEnd:     "Play the full game",
      replay:     "Race again",
      scoreLabel: "Score",
      timeLabel:  "Time",
      endScore:   "Final score",
      gameOver:   "Shield down",
      timeUp:     "Time's up!"
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
         `kick` and `cost` are what a contact with it is worth, and `learn`
         the page of the guide a hunter is named on the first time one is met.

         WHICH of them are on the grid is the level's business and not this
         table's — see `ladder.foeMix`. */
      foes: [
        { name: "SCOUT",   art: "ship11", col: ["#5cffb0", "#0b5c3c"],
          hunt: -0.80, wander: 1.00, dodge: 1, pace: 1.00, kick: 1.00, cost: 1.00 },
        { name: "DRONE",   art: "ship15", col: ["#57d2ff", "#0e4a6e"],
          hunt:  0.00, wander: 0.00, dodge: 0, pace: 1.00, kick: 1.00, cost: 1.00 },
        { name: "STALKER", art: "ship07", col: ["#ffd43b", "#6b4a06"],
          hunt:  0.70, wander: 0.35, dodge: 1, pace: 0.70, kick: 0.85, cost: 0.85 },
        { name: "MARSHAL", art: "ship06", col: ["#ff6b6b", "#6e1414"], hold: 1, match: 1, learn: "marshal",
          hunt:  0.95, wander: 0.25, dodge: 1, pace: 1.00, kick: 1.00, cost: 1.00 },
        { name: "RAM",     art: "ship05", col: ["#8b5cf6", "#1a0b3e"], learn: "ram",
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

      /* --- THE SHIELD RAIL down the right flank of the frame ---------------
         Built like the spin rail in games/spinshock — smoked glass the road
         reads straight through, cells filled from the bottom, an arc and a
         chevron at the value — because the number this game is played on is
         the one the HUD pill is too small to make felt: cyan at full, cooling
         through gold to red as the hull comes apart, so a run going bad turns
         the right edge of the frame red.

         That flank used to carry a second rail, a ladder of the whole field
         with the player's marker sliding up it. It is gone: the place and the
         cut it has to be inside are already on the rank pill, the cut's own
         line on the tarmac is green or red under the craft, and a nineteen-cell
         ladder down the edge of a race the player is steering through was a
         second thing to read at 400 km/h and never the one they read. This
         rail then took the side it left, because the left flank is the level
         pill's in all thirteen games. */
      railW:        30,    // width of the rail
      railGap:       4,    // air between it and the frame's side margin
      railSegs:     20,    // cells in the shield rail (one per 5%)
      railPad:       3,    // air between two cells
      railInset:    10,    // air under Layout.top
      railFoot:    142     // air under the rail: the speedo and, on the web
                           // target, the round's two controls stack in it
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
          music: { from: 12, length: 36.747 },
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
          music: { from: 48, length: 28.748 },
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
          music: { from: 76, length: 32.048 },
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
          music: { from: 112, length: 36.834 },
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
          music: { from: 142, length: 31.955 },
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
           ffmpeg -ss 11.2 -t 37.547 -i assets/audio/music/arcider.mp3 \
                  -ac 1 -ar 44100 -b:a 64k music.mp3
         The WEB build ships the whole file instead, as an asset next to the
         others: `web.music` in the manifest is the whole declaration, and the
         three minutes it names are what the five biome beds and the menu's own
         are windows of (tools/build/build.mjs, THE FULL-LENGTH BED). */
      music: "data:audio/mpeg;base64,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"
      // No sfx clip here: every key the game plays is a role of the house kit,
      // mapped by `sfx` in manifest.json and injected by the builder.
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
      /* THE ROAD IS DRIVEN ON A FLATTER CURVE THAN THE CLIMB. The first
         biomes were a cruise and the last stages next to impossible, so the
         road's own lerps walk 0.15 -> 0.70 of their old span — the same
         squeeze as the manifest's `tune` ranges, which were cut to that share
         of what they spanned. `d` itself stays the climb's: the cuts are laid
         on the shell's objective, which reads it raw. */
      var e = 0.15 + 0.55 * d;
      T.bendLong   = (60 + 240 * w[4]) * (0.70 + 0.50 * e);
      T.bendShort  = (8 + 112 * w[5]) * (0.60 + 0.70 * e);
      T.hillAmp    = Math.min(170, Math.round((20 + 145 * w[6]) * (0.60 + 0.60 * e)));
      T.bendKShort = ROAD0.bendKShort * w[7];
      T.hillK      = ROAD0.hillK * (0.7 + 0.5 * w[7]);

      /* THE ROAD MAY NEVER OUT-STEER THE CRAFT. A bend's amplitude and its
         frequency multiply into one number — how fast the tarmac travels
         sideways under a craft going flat out, `sum(amp * k) * speedMax` in
         px/s — and the table moves both at once, so a slalom at the top of the
         climb worked out at 964 px/s against a craft that steers at 720. That
         is not a hard level, it is a road nobody can stay on.

         So the two amplitudes are scaled down together until the drift fits a
         share of `steer` that the climb itself decides: 0.345 at the foot and
         0.51 at the top (the flattened `e` above), against the 0.42 the shipped endless road sits at.
         Scaling BOTH keeps the trace's character — the shape is the same road,
         driven shallower — and it falls on the high-frequency traces first,
         which is why a slalom comes out tight and shallow and a sweeper comes
         out long and wide. Nothing is clamped when the trace already fits. */
      k = T.bendLong * T.bendKLong + T.bendShort * T.bendKShort;
      lim = T.steer * (0.30 + 0.30 * e) / T.speedMax;
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
       gauge lives down the right one (see drawShieldRail) and a callout is the
       one thing on screen wide enough to cover the shield running out. The
       left column keeps the same inset, because a callout hanging off one
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
      if (type === "bomb") meet("mines", Lang.t("Mines"), Lang.t("Watch out for blasts"));
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
      meet("fork", Lang.t("Fork"), Lang.t("Choose your path"));

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
        meet("solid", Lang.t("Watch out for walls"), Lang.t("Use the ramp"));
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
        if (r.p > cp) {
          ahead++;
          // A hunter met for the first time: the moment it starts to react.
          if (fo.learn && !asked[fo.learn] && r.p - cp < T.foeSee) meetFoe(fo);
        } else if (r.p < camP - 900) {
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
         only question the board is ever asking. Its sound is a pluck kept
         barely over the engine: an overtake is the most frequent good thing
         that happens in a run, and a chime at full voice on every one of them
         turned the whole race into a ringtone. Pitched up while qualified and
         down while not, so the ear reads the colour too. */
      Pop.show("streak", { word: rank + "/" + need, sub: "+" + g, at: "top",
                           cls: safe ? "rank-in" : "rank-out" });
      if (safe) Sound.clip("rank", 0.12, 1.15);
      else Sound.clip("rank", 0.12, 0.8);
      if (rank === 1) {
        Pop.show("ultra", { word: "First", at: popSpot() });
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
      if (shield <= 0) { showShield(); die("Shield down"); return; }
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
      if (shield <= 0) { showShield(); die("Shield down"); return; }
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
      Sound.clip("ramp", 0.2, 0.8);
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
        if (shield <= 0) { showShield(); die("Shield down"); return; }
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
      if (shield <= 0) { showShield(); die("Shield down"); return; }
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
      HUD.setLeft(v + "%", "Shield", v <= T.lowAt ? "warn" : "");
    }

    /* THE RANK PILL, and the cut counting down under it. This is the pill the
       player reads: the position is the number, and the label is the wall it
       has to be inside by — "TOP 10 · 84m" once a cut is close enough to be
       worth panicking about, the plain field size before that. */
    function ordinal(n) {
      var t = n % 100;
      if (t >= 11 && t <= 13) return n + Lang.t("th");
      return n + Lang.t(["th", "st", "nd", "rd"][n % 10] || "th");
    }
    function showRank() {
      var cut = T.cuts[cutI], need = Lang.t("Final ") + fieldSize, left, txt;
      var flag = cut && atFlag();
      if (cut) {
        left = Math.max(0, Math.round(cut.at - dist));
        // The flag is a countdown and never an ask: nothing about the place is
        // at stake there but the win itself.
        need = flag ? Lang.t("Finished · ") + left + "m"
             : left <= T.cutWarn ? Lang.t("Top ") + cut.rank + Lang.t(" in ") + left + "m"
                                 : Lang.t("Be top ") + cut.rank + " · " + left + "m";
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
      asked = {};
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
          Pop.show("danger", { word: "Hull critical", sub: "Recharge your shield", at: popSpot() });
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
        if (flag) meet("finish", Lang.t("The finish line"), Lang.t("First place guarantees three stars"));
        else meet("cuts", Lang.t("Checkpoint ahead"), Lang.t("Reach the required rank before the next checkpoint"));
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
      if (!flag && rank > cut.rank) { die("Eliminated"); return; }

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
      if (cutI >= T.cuts.length) { win(); return; }
      /* ONE callout for the whole beat, and it is about what happens NEXT. That
         the cut was survived is already told by the confetti, the flash and the
         pack thinning out on screen; what the player cannot see is the size of
         the next wall. A NOTICE and not a callout: the field being cut is
         something that happens TO the player, and the callouts are kept for
         what they did themselves (an overtake, a hit, first place). */
      Notify.say(fieldSize + Lang.t(" pilots left"),
                 { sub: atFlag() ? Lang.t("Win the race")
                                 : Lang.t("Goal: top ") + T.cuts[cutI].rank,
                   kind: "info", icon: "user" });
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
        { label: "Final position", value: ordinal(rank), grade: rank <= 3 ? "gold" : "accent" },
        { label: "Places taken", value: passed, grade: passed >= 10 ? "good" : "" },
        { label: "Distance (m)", value: Math.floor(dist) },
        { label: "Best score", value: Math.max(sc, best), grade: "gold" }
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
        title: rank === 1 ? Lang.t("Race won!")
             : rank <= 3 ? Lang.t("On the podium!") : Lang.t("Race finished!"),
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

      /* The shield rail, hard against the frame's RIGHT margin. It is an
         overlay on the road rather than a band cut out of it — the road is a
         perspective view whose interest is all in the middle, and the rail is
         smoked glass, so nothing the player has to read is lost under it.

         It is on the right because the bottom-LEFT corner is the level pill's
         (packages/webshell/levels.css): the three stars of a run are read in
         the same corner in all thirteen games, and arcider is the one that had
         an instrument there. So this side of the frame is now the whole
         instrument column, and it reads top to bottom — the rail, the
         speedometer under its foot, and the round's MENU / OPTIONS controls
         under that. `railFoot` is the air those two need. */
      shieldRail.w = T.railW;
      shieldRail.x = Layout.right - T.railGap - T.railW;
      shieldRail.y = Layout.top + T.railInset;
      shieldRail.h = Layout.h - T.railInset - T.railFoot;

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

      // Every gate, rival and item is an element of the round's entrance
      // (Enter), far first like the painter's order; the road is the ground.
      for (i = 0; i < n; i++) {
        e = paint[i];
        k = kAt(e.p);
        y = screenY(e.p, k);
        if (e.g) x = screenX(roadX(e.p), k);
        else if (e.r) x = screenX(rivalX(e.r), k);
        else {
          x = screenX(itemX(e.it), k);
          if (e.it.type !== "boost" && e.it.type !== "ramp" &&
              (x < -240 * k || x > view.w + 240 * k || y < horizonY - 40)) continue;
        }
        if (!Enter.begin(x, y)) continue;
        if (e.g) drawGate(e.g, e.last);
        else if (e.r) drawRival(e.r, k);
        else if (e.it.type === "boost") drawPad(e.it, k);
        else if (e.it.type === "ramp") drawRamp(e.it, k);
        else drawStanding(e.it, x, y, k);
        Enter.end();
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
       THE SHIELD RAIL — down the right flank of the frame

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

    /* THE SPEEDOMETER — right-hand column, under the shield rail's foot,
       because that side of the frame IS the instrument side and the road's
       interest is all in the middle. It is right-aligned on the rail's own
       outer edge, so the two read as one column, and it clears the bottom of
       the frame by `railFoot` — which is where the web target's MENU and
       OPTIONS controls sit, and where the playable's CTA bar starts.

       No plate under it and no glow behind it: a box would be a second object
       to read and `shadowBlur` is banned per frame (see CLAUDE.md). What keeps
       three digits legible over a bright road is the same thing that keeps the
       HUD legible — a dark stroke around them, drawn once.

       The colour is the only thing it says beyond the figure: gold while a
       booster burns, red while the gravel is taking the pace off, white the
       rest of the time. That is the dial reading back the two things that move
       it, in the place the eye is already looking for the shield. */
    function drawSpeedo() {
      var r = shieldRail, right = r.x + r.w, y = r.y + r.h + 54;
      var n = String(Math.max(0, Math.round(kmhShown))), col, unit = upper(Lang.t("km/h"));
      col = boostT > 0 ? "#ffd43b" : mult < 0.9 ? "#ff2d55" : "#ffffff";

      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.lineJoin = "round";
      /* The outline is what makes it legible, and it has to be strong: the MIST
         biome lays a pale lilac road and white digits on it read as nothing. */
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(4,4,20,.72)";

      /* Measured, then laid out from the right: the figure runs 1 to 3 digits
         and the unit changes width with the language, so the pair is placed by
         its own width rather than by a guessed x — otherwise the column's edge
         moves every time the speed crosses 100. */
      ctx.font = "900 20px " + speedoFont;
      var unitW = ctx.measureText(unit).width;
      ctx.font = "900 52px " + speedoFont;
      var x = right - unitW - 10 - ctx.measureText(n).width;

      ctx.strokeText(n, x, y);
      ctx.fillStyle = col;
      ctx.fillText(n, x, y);

      x = right - unitW;
      ctx.font = "900 20px " + speedoFont;
      ctx.lineWidth = 5;
      ctx.strokeText(unit, x, y);
      ctx.fillStyle = rgba(col, 0.9);
      ctx.fillText(unit, x, y);
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
      if (Enter.begin(craftX(), craftY())) { drawCraft(); Enter.end(); }
      if (Enter.begin(shieldRail.x + shieldRail.w * 0.5, shieldRail.y + shieldRail.h * 0.5)) {
        drawShieldRail();
        Enter.end();
      }
      if (Enter.begin(shieldRail.x + shieldRail.w - 60, shieldRail.y + shieldRail.h + 40)) {
        drawSpeedo();
        Enter.end();
      }
    }

    function onResize() { metrics(); lens(); }

    /* ====================================================================
       FIRST MEETINGS, AND THE GUIDE (web target)

       A mechanic met for the first time is NAMED, once per player and ever,
       by the motor's own memory — Notify.learn (packages/shell/shell.js),
       whose line in the "!" log opens the guide on the page of the same id.
       Only where there is a guide to open: a playable has none and says
       nothing. `asked` is not a memory but a cache in front of that one, so
       an id this round has already handed over is not asked again on every
       frame; reset() empties it with the round.
       Only what the road cannot say at a glance is named: a checkpoint's
       rank, the flag's stars, a mine's blast, the fork's choice, a wall with
       no gate and the two hunters worth reading by colour. A plain wall, a
       ramp and the slow stalker explain themselves on sight.
       ==================================================================== */
    var asked = {};
    function meet(id, word, sub) {
      if (asked[id]) return;
      asked[id] = 1;
      if (window.__GUIDE__) Notify.learn(id, word, { sub: sub });
    }
    function meetFoe(fo) {
      if (fo.learn === "marshal") meet("marshal", Lang.t("Marshal"), Lang.t("Only a booster gets you past some craft"));
      else if (fo.learn === "ram") meet("ram", Lang.t("Ram"), Lang.t("The violet craft hits harder"));
    }

    /* --- the pictures ------------------------------------------------------
       Every page SHOWS before it tells, and what it shows is drawn by the
       round's own renderer: the motor's `ctx` is lent to a canvas of the
       page's own for the length of one synchronous call (slipdeck's
       cardsPic, bridgessa's trickPic). */
    function paintPic(W, H, fn) {
      var cv = document.createElement("canvas"), k = view.dpr || 1, keep = ctx;
      cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx = cv.getContext("2d"); ctx.scale(k, k);
      try { fn(); } finally { ctx = keep; }
      return cv;
    }

    /* THE ROAD, STAGED. A fork, a ramp or a checkpoint is shown the way the
       round draws it — buildRows, drawSky, drawPlain, drawRoad, drawFog and
       the item renderers, through the one projection — and that projection
       reads the round's camera, its phases, its layout caches and the forks
       in force. So every one of those values is LENT too: saved, set to a
       still frame (the camera at the start line, the road at a crest of its
       bend, a dip under the craft so the road ahead climbs into view), and
       handed back in `finally`. The guide can open before any round and over
       a paused one, and neither may notice it was drawn.

       `o` is { bio, cw, focus, at, fork, cam, things, ship }: the biome's index,
       the width of design space the picture crops (the frame's 720 by
       default), the progress ahead of the craft the crop is centred on and
       at which height of it, a fork as [mouth, merge] ahead of the craft,
       how far the camera sits off the centre line (`cam`, to look down one
       branch), what stands on the road — { type, z, off, br, kind } with `type` one
       of cell bomb block boost ramp rival gate flag, or a function returning
       that list once the road is staged — and the craft
       itself, { off, lean }. */
    function stagePic(o, W, H) {
      W = W || 520; H = H || 300;
      return paintPic(W, H, function () { stage(o, W, H); });
    }
    function stage(o, W, H) {
      var K = { BIO: BIO, camP: camP, camX: camX, fov: fov, fovZ: fovZ, elevCar: elevCar,
                phA: phA, phB: phB, phC: phC, phD: phD, dist: dist, runT: runT,
                forks: forks, rows: rows, rowN: rowN, farI: farI, halfW: halfW,
                horizonY: horizonY, anchorY: anchorY, span: span, skyBase: skyBase,
                skyGrad: skyGrad, plainGrad: plainGrad, fogGrad: fogGrad, sunGrad: sunGrad,
                foot: foot, tarmacOn: tarmacOn, tarmacOff: tarmacOff, stars: stars,
                towers: towers, speedoFont: speedoFont,
                rx: shieldRail.x, ry: shieldRail.y, rw: shieldRail.w, rh: shieldRail.h,
                gl: railGlow.l, gr: railGlow.r };
      try { stageDraw(o, W, H); }
      finally {
        BIO = K.BIO; camP = K.camP; camX = K.camX; fov = K.fov; fovZ = K.fovZ;
        elevCar = K.elevCar; phA = K.phA; phB = K.phB; phC = K.phC; phD = K.phD;
        dist = K.dist; runT = K.runT; forks = K.forks; rows = K.rows; rowN = K.rowN;
        farI = K.farI; halfW = K.halfW; horizonY = K.horizonY; anchorY = K.anchorY;
        span = K.span; skyBase = K.skyBase; skyGrad = K.skyGrad; plainGrad = K.plainGrad;
        fogGrad = K.fogGrad; sunGrad = K.sunGrad; foot = K.foot; tarmacOn = K.tarmacOn;
        tarmacOff = K.tarmacOff; stars = K.stars; towers = K.towers; speedoFont = K.speedoFont;
        shieldRail.x = K.rx; shieldRail.y = K.ry; shieldRail.w = K.rw; shieldRail.h = K.rh;
        railGlow.l = K.gl; railGlow.r = K.gr;
      }
    }
    function stageDraw(o, W, H) {
      var cp = T.camZ, list = [], things, i, e, k, cw, s, fy;
      BIO = LAD.biomes[o.bio || 0];
      camP = 0; dist = 0; fov = 0; runT = 0.4;
      phA = Math.PI / 2 - cp * T.bendKLong;
      phB = Math.PI / 2 - cp * T.bendKShort;
      phC = 0;
      phD = Math.PI * 1.5 - cp * T.hillK;
      forks = o.fork ? [{ a: cp + o.fork[0], b: cp + o.fork[1] }] : [];
      rows = []; rowN = 0; farI = -1;
      railGlow.l = 0; railGlow.r = 0;
      metrics();
      camX = roadX(cp) + (o.cam || 0);
      lens();

      cw = o.cw || view.w; s = W / cw;
      fy = screenY(cp + (o.focus || 0), kAt(cp + (o.focus || 0)));
      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-(halfW - cw / 2), -(fy - (H / s) * (o.at != null ? o.at : 0.96)));
      buildRows();
      drawSky();
      ctx.save();
      ctx.beginPath();
      ctx.rect(-BLEED, skyBase, view.w + BLEED * 2, view.h - skyBase + BLEED);
      ctx.clip();
      drawPlain();
      drawRoad();
      drawFog();
      // a list, or a function of the staged road (a wall reads its width)
      things = typeof o.things === "function" ? o.things() : (o.things || []);
      for (i = 0; i < things.length; i++) list.push(stageThing(things[i], cp));
      list.sort(function (a, b) { return b.p - a.p; });        // far first
      for (i = 0; i < list.length; i++) {
        e = list[i]; k = kAt(e.p);
        if (e.g) drawGate(e.g, e.last);
        else if (e.r) drawRival(e.r, k);
        else if (e.it.type === "boost") drawPad(e.it, k);
        else if (e.it.type === "ramp") drawRamp(e.it, k);
        else drawStanding(e.it, screenX(itemX(e.it), k), screenY(e.it.p, k), k);
      }
      ctx.restore();
      if (o.ship) stageShip(o.ship, cp);
      ctx.restore();
    }
    // One thing on the staged road, in the shape the round's own lists hold.
    function stageThing(t, cp) {
      var p = cp + t.z;
      if (t.type === "gate" || t.type === "flag") {
        // a checkpoint's line is green while the place is good enough
        return { p: p, last: t.type === "flag",
                 g: { at: p / T.pxPerM, rank: t.type === "flag" || t.ok === false ? 0 : 999 } };
      }
      if (t.type === "rival") {
        // `seed` zeroes the pilot's own weave, so `off` is where it drives
        return { p: p, r: { p: p, br: t.br || 0, kind: t.kind, seed: -p * 0.0016,
                            dodge: t.off || 0, hunt: 0, push: 0, pushV: 0, bump: 0 } };
      }
      return { p: p, it: { p: p, off: t.off || 0, type: t.type, br: t.br || 0,
                           seed: t.seed || 0, used: false } };
    }
    // The player's craft, as drawCraft lays it: its two pools of light, then
    // the hull on its roll.
    function stageShip(sh, cp) {
      var x = halfW + (roadX(cp) + (sh.off || 0) - camX), y = horizonY + span, sc = 0.84;
      halo(x, y, 118 * sc, "#35e8ff");
      halo(x, y, 68 * sc, "#8a5cff");
      ctx.save();
      ctx.translate(x, y); ctx.scale(sc, sc);
      ctx.translate(0, -52); ctx.rotate((sh.lean || 0) * T.leanMax); ctx.translate(0, 52);
      drawShip(T.playerArt, T.shipW, null, 0, 0);
      ctx.restore();
    }
    /* Hulls side by side, each in its pool of light: `list` is
       [{ art, col, w, tint }], `tint` the red wash of a hull coming apart. */
    function hullsPic(list, gap) {
      var W, H = 0, i, h, x, y;
      gap = gap || 20; W = gap;
      for (i = 0; i < list.length; i++) { W += list[i].w + gap; H = Math.max(H, list[i].w * 0.62 + 56); }
      return paintPic(W, H, function () {
        for (x = gap, i = 0; i < list.length; i++) {
          h = list[i].w; y = H - 26;
          halo(x + h / 2, y, h * 0.5, list[i].col);
          ctx.save();
          ctx.translate(x + h / 2, y);
          drawShip(list[i].art, h, list[i].tint ? "#ff2d55" : null, list[i].tint || 0, 1);
          ctx.restore();
          x += h + gap;
        }
      });
    }
    function foeHull(i, w) { return { art: T.foes[i].art, col: T.foes[i].col[0], w: w }; }

    /* --- the pages ---------------------------------------------------------
       Every figure is the round's own: what the code bills and pays, and the
       stage each idea first reaches the road on (`ladder.unlock`, the field's
       mix and `cutsFor` read over the shipped climb). Ranges are the climb's,
       foot to top, because the level layer lerps them. */
    var guide = {
      chapters: function () {
        var gold = "#ffd43b", red = "#ff5a6e", green = "#5cffb0";
        function foePage(i, id, title, lv, lines) {
          return { id: id, title: title, lv: lv, lines: lines,
                   pic: function () { return hullsPic([foeHull(i, 300)]); } };
        }
        function bandPage(i, id, from, title, lines, things) {
          return { id: id, title: title, lv: from,
                   eyebrow: Lang.t("Stages {a} to {b}").replace("{a}", from).replace("{b}", from + 5),
                   lines: lines,
                   pic: function () { return stagePic({ bio: i, focus: 900, at: 0.62, things: things }); } };
        }
        return [
          { key: "basics", label: Lang.t("The basics"), pages: [
            { id: "steer", title: Lang.t("Lean to steer"),
              pic: function () { return stagePic({ ship: { off: -40, lean: -1 },
                                                   things: [{ type: "boost", z: 170, off: -110 }] }); },
              lines: [Lang.t("Hold a side of the screen, or an arrow key, to lean that way.")] },
            { id: "race", title: Lang.t("The race"),
              pic: function () { return stagePic({ ship: { off: 30 },
                                                   things: [{ type: "rival", kind: 0, z: 150, off: -130 },
                                                            { type: "rival", kind: 1, z: 250, off: 110 },
                                                            { type: "rival", kind: 0, z: 360, off: -20 }] }); },
              lines: [Lang.t("You start last. To pass the leaders, you will need a booster.")] },
            { id: "cuts", title: Lang.t("Checkpoints"),
              pic: function () { return stagePic({ ship: { off: 0 },
                                                   things: [{ type: "gate", z: 170 },
                                                            { type: "rival", kind: 1, z: 300, off: 90 }] }); },
              lines: [Lang.t("Each checkpoint asks for a rank. This battle royale is merciless: fall short and you are out."),
                      Lang.t("A green rank means your place is good enough for the next checkpoint. Red means you still have rivals to pass.")] },
            { id: "finish", title: Lang.t("The finish line"),
              pic: function () { return stagePic({ ship: { off: 0 },
                                                   things: [{ type: "flag", z: 170 },
                                                            { type: "rival", kind: 0, z: 310, off: -80 }] }); },
              rows: [[Lang.t("Reach the stage's distance"), "★", gold],
                     [Lang.t("Cross the finish line"), "★★", gold],
                     [Lang.t("Cross it in first place"), "★★★", gold]],
              lines: [Lang.t("Your place as you cross the finish line is your final result.")] },
            { id: "shield", title: Lang.t("The shield"),
              pic: function () { return hullsPic([{ art: T.playerArt, col: "#35e8ff", w: 140 },
                                                  { art: T.playerArt, col: "#ff2d55", w: 140, tint: 0.75 }]); },
              rows: [[Lang.t("A mine"), "-" + T.bombCost + " %", red],
                     [Lang.t("A barrier"), Lang.t("-29 to -39 %"), red],
                     [Lang.t("Clipping a pilot"), Lang.t("-14 to -21 %"), red]],
              lines: [Lang.t("Going fast never drains your shield, only hits damage it. Careful: an empty shield ends the race at once.")] },
            { id: "score", title: Lang.t("The score"),
              pic: function () { return stagePic({ ship: { off: 20 },
                                                   things: [{ type: "boost", z: 130, off: 20 },
                                                            { type: "boost", z: 330, off: -70 }] }, 520, 170); },
              lines: [Lang.t("While a booster lasts, metres and cells count double.")] }
          ] },
          { key: "road", label: Lang.t("On the road"), pages: [
            { id: "boost", title: Lang.t("Boosters"),
              pic: function () { return stagePic({ ship: { off: 0 },
                                                   things: [{ type: "boost", z: 120, off: 0 },
                                                            { type: "boost", z: 290, off: 90 }] }); },
              rows: [[Lang.t("Lasts"), T.boostTime + " s", gold]],
              lines: [Lang.t("Any hit puts the booster out at once.")] },
            { id: "barrier", title: Lang.t("Barriers"),
              pic: function () { return stagePic({ ship: { off: -60 },
                                                   things: [{ type: "block", z: 150, off: 70 },
                                                            { type: "block", z: 300, off: -150 }] }); },
              lines: [Lang.t("Barriers block your way. Hit one and it breaks, and your speed drops with it.")] },
            { id: "fork", title: Lang.t("Fork"),
              pic: function () { return stagePic({ fork: [-900, 2600], cw: 760, focus: 160, at: 0.8,
                                                   things: [{ type: "cell", z: 60, br: -1, off: 0 },
                                                            { type: "cell", z: 190, br: -1, off: 40 },
                                                            { type: "cell", z: 320, br: -1, off: -20 },
                                                            { type: "boost", z: 90, br: 1, off: 0 },
                                                            { type: "bomb", z: 230, br: 1, off: 40 },
                                                            { type: "boost", z: 360, br: 1, off: -20 }] }); },
              lines: [Lang.t("One branch has the charge cells. The other has boosters, often guarded by mines.")] },
            { id: "cells", title: Lang.t("Charge cells"),
              pic: function () { return stagePic({ fork: [-900, 2600], ship: { off: -322 }, cam: -322,
                                                   things: [{ type: "cell", z: 150, br: -1, off: 0 },
                                                            { type: "cell", z: 260, br: -1, off: 40 },
                                                            { type: "cell", z: 370, br: -1, off: -20 }] }); },
              rows: [[Lang.t("A cell"), Lang.t("+10 to +15 % shield"), green]],
              lines: [Lang.t("Only cells refill your shield. They line the track on some forks."),
                      Lang.t("Take them in a row for a combo bonus. Gravel or a hit breaks the combo.")] },
            { id: "wall", title: Lang.t("Walls"), lv: 3,
              pic: function () { return stagePic({ ship: { off: 90 },
                                                   things: function () { return wallThings(240, 110, true); } }); },
              lines: [Lang.t("A wall often leaves a way through, with a booster in it.")] },
            { id: "mines", title: Lang.t("Mines"), lv: 4,
              pic: function () { return stagePic({ ship: { off: 0 },
                                                   things: [{ type: "bomb", z: 130, off: -120 },
                                                            { type: "bomb", z: 230, off: 40 },
                                                            { type: "bomb", z: 340, off: 150 }] }); },
              lines: [Lang.t("A mine's blast throws you sideways. Lean the other way to stay on the tarmac."),
                      Lang.t("A mine never blocks the way to a booster.")] },
            { id: "ramp", title: Lang.t("Ramps"), lv: 9,
              pic: function () { return stagePic({ ship: { off: -40 }, at: 0.98,
                                                   things: function () { return [{ type: "ramp", z: 90, off: -40 }].concat(wallThings(90 + T.rampWall, 170, false)); } }); },
              rows: [[Lang.t("Landing in the gravel"), "-" + T.roughCost + " %", red]],
              lines: [Lang.t("Line up before you take off. You can barely steer in the air.")] },
            { id: "solid", title: Lang.t("Solid walls"), lv: 13,
              pic: function () { return stagePic({ ship: { off: 30 }, at: 0.98,
                                                   things: function () { return [{ type: "ramp", z: 90, off: 30 }].concat(wallThings(90 + T.rampWall, null, false)); } }); },
              lines: [Lang.t("The wall after a ramp may have no way through. Jump over it to avoid a crash.")] }
          ] },
          { key: "pilots", label: Lang.t("The pilots"), pages: [
            { id: "pilots", title: Lang.t("Liveries"),
              pic: function () { return hullsPic([foeHull(0, 88), foeHull(1, 88), foeHull(2, 88), foeHull(3, 88), foeHull(4, 88)], 10); },
              lines: [Lang.t("A craft's colour tells you how it drives, long before you reach it.")] },
            foePage(0, "scout", Lang.t("Scouts"), 0, [
              Lang.t("Green craft get out of your way.")]),
            foePage(1, "drone", Lang.t("Drones"), 0, [
              Lang.t("Blue craft drive straight ahead, blind to you and to the road.")]),
            foePage(2, "stalker", Lang.t("Stalkers"), 7, [
              Lang.t("Yellow craft are slow and steer into you. Easy to catch, hard to pass cleanly.")]),
            foePage(3, "marshal", Lang.t("Marshals"), 12, [
              Lang.t("Red craft block your line but never hit on purpose. Only a booster gets you past them easily.")]),
            foePage(4, "ram", Lang.t("Rams"), 18, [
              Lang.t("Violet craft come straight for you, and they hit the hardest.")])
          ] },
          { key: "climb", label: Lang.t("The climb"), pages: [
            bandPage(0, "dusk", 1, Lang.t("Dusk"), [
              Lang.t("The road to the first checkpoint is paved with boosters.")],
              [{ type: "boost", z: 300, off: -60 }, { type: "boost", z: 600, off: 40 }, { type: "rival", kind: 0, z: 900, off: -80 }]),
            bandPage(1, "day", 7, Lang.t("Day"), [
              Lang.t("Two checkpoints before the finish.")],
              [{ type: "ramp", z: 420, off: 30 }, { type: "rival", kind: 2, z: 800, off: -90 }]),
            bandPage(2, "mist", 13, Lang.t("Mist"), [
              Lang.t("From stage 13, some walls after a ramp have no way through.")],
              [{ type: "bomb", z: 420, off: -80 }, { type: "rival", kind: 3, z: 720, off: 60 }]),
            bandPage(3, "overcast", 19, Lang.t("Overcast"), [
              Lang.t("From here on, three checkpoints before the finish.")],
              [{ type: "gate", z: 520 }, { type: "rival", kind: 4, z: 780, off: 40 }]),
            bandPage(4, "night", 25, Lang.t("Night"), [
              Lang.t("Nothing new in this biome, but every hazard and every pilot at once.")],
              [{ type: "bomb", z: 380, off: 90 }, { type: "rival", kind: 4, z: 620, off: -70 }, { type: "rival", kind: 3, z: 900, off: 60 }])
          ] }
        ];
      }
    };
    /* A row of barriers across the road at `z`, filled from each kerb in to
       a gate centred on `gate` — or rail to rail with `gate` null, the wall
       a ramp is the only way over — with the booster the gate often holds. */
    function wallThings(z, gate, pad) {
      var h = roadHalf(T.camZ + z) - 34, step = gate == null ? T.rampStep : T.blockStep, g = 120, out = [], x;
      if (gate == null) {
        for (x = -h; x <= h; x += step) out.push({ type: "block", z: z, off: x });
        return out;
      }
      for (x = -h; x < gate - g; x += step) out.push({ type: "block", z: z, off: x });
      for (x = h; x > gate + g; x -= step) out.push({ type: "block", z: z, off: x });
      if (pad) out.push({ type: "boost", z: z, off: gate });
      return out;
    }

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

    /* What the objectives card (a tap on the level pill) prints for each
       star: the same ladder as `levelStars`, worded. {n} is the distance. */
    function levelRules() {
      return [Lang.t("Reach <b>{n} m</b>"), Lang.t("Cross the <b>finish line</b>"),
              Lang.t("Win the race in <b>first place</b>")];
    }

    return { reset: reset, update: update, render: render,
             onDown: onDown, onMove: onMove, onUp: onUp, onResize: onResize,
             /* `levelWon` is the PODIUM and not `die`: the last arch stands on
                the level's third star, so a shell-side win could only ever
                happen at the chequered flag with every cut behind it — which
                is a race won, finish bonus included. The level layer writes
                the title over it either way. */
             levelProgress: levelProgress, levelStars: levelStars, levelRules: levelRules,
             levelWon: win,
             applyLevel: applyLevel, guide: guide };
  })();

