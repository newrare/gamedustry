  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Bouncetry",
    /* One sentence, and nothing else — the one rule of the game and nothing
       around them. The stage below plays exactly that: the ball flies past
       the dark buttons, the tap lights them and the ball eats the glass. */
    tagline: "One <b class=\"w-tap\">tap</b> switches the <b class=\"w-wall\">buttons</b> on and traps the ball with the bricks",
    gameSeconds: 0,                  // no clock: the run ends when the balls do

    storeUrl: {
      ios:     "https://newrare.app/#playables",
      android: "https://newrare.app/#playables",
      fallback:"https://newrare.app/#playables"
    },

    designWidth: 720, designHeight: 1280, bg: "#070a1e",
    // The brick field hangs from Layout.top and the cannon sits above the CTA
    // bar, so nothing important ever lands under the HUD or a notch.
    layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 24 },
    // No app icon on the intro: the painted logotype (CONFIG.art.title) is
    // the title screen, and the icon only feeds the site card's thumb.
    intro: { logo: null, demo: "aim", caption: "" },
    hud: { score: true, timer: false },
    // The top of the frame is the bricks the player is reading: a notice lands over the foot of it.
    notify: { round: "bottom" },
    /* THE BED. One track, six windows of it. Five are the round's, named on
       the biomes in section 6 — and the sixth is the quiet, slower one the
       menus sit on. The track is 126 bpm, so a bar is 1.905 s and every entry
       point below is a whole bar: the intro gives way to the body at 15.2 s,
       a two-bar break lets it back in brighter at 49.5, it peaks from 76.2,
       breaks down at 114 and climbs again from 121.9 to the finale at 152.4,
       which fades out from 173.4 (see docs/MUSIC.md). A playable has no level
       and no menu, so it ships the first window alone,
       a seam of pre-roll in front of it (CONFIG.music.cut). */
    /* `seam`: every window loops on the bar, two beats of crossfade ending on
       its downbeat (docs/MUSIC.md, The seam); `cut`: the playable's window,
       one seam of pre-roll into its embedded cut. */
    music: {
      volume: 0.11, fade: 1.8, seam: 0.95,
      cut: { from: 0.95, length: 26.668 },
      menu: { from: 0, length: 30.471, rate: 0.85, gain: 0.5 }
    },
    copy: {
      start:"Tap to play", ctaBar:"Install now", ctaEnd:"Play the full game",
      replay:"Replay the demo", scoreLabel:"Score", timeLabel:"Time",
      endScore:"Final score", gameOver:"Out of balls!", timeUp:"Time's up!"
    },

    /* --- the bonus bricks: each blueprint places its own ---------------- */
    bonusMult: 2,                    // score multiplier on a bonus brick
    multiBalls: 3,                   // balls a multiball brick releases
    bigMult: 1.8,                    // the big ball's radius, x the base
    fireSeconds: 5,                  // how long a fireball burns through the glass
    magnetSeconds: 5,                // how long a ball stays a magnet
    magnetReach: 150,                // px from the ball a pane is pulled from
    magnetEvery: 0.09,               // seconds between two panes pulled in
    magnetFlight: 0.24,              // seconds a pane takes to fly into the ball

    /* --- the living glass: each biome brings its own kind (section 6) --- */
    warpEvery: 3,                    // seconds between two jumps of a warp pane
    warpReach: 3,                    // cells a warp pane jumps, at most, each way
    seedEvery: 1,                    // seconds between two panes a seed grows
    seedHp: 2,                       // hits a seed takes: it is the root of the growth
    shieldUp: 1.4,                   // seconds an electric pane's shield holds
    shieldDown: 1.4,                 // seconds it stays down between two
    splitDelay: 0.12,                // seconds before a split pane's shards take a cell

    /* --- the field: the blueprint is the height, the columns the width -- */
    cols: 12,                        // brick columns across Layout (blueprint width)
    cellH: 48,                       // row height: a cell 56x48, the painted brick's shape
    pad: 3,                          // gap between a brick and its cell
    lavaH: 110,                      // the lava lake, up from Layout.bottom
    cannonH: 100,                    // the turret pivot, above the lava surface
    muzzle: 112,                     // where a ball leaves the barrel

    /* --- the shot: ONE ball at a time, and the player re-aims between two */
    startBalls: 6,
    ballR: 12,
    ballSpeed: 900,                  // px/sec, constant while the ball is free
    minAimDeg: 14,                   // never aim flatter than this
    minVyRatio: 0.13,                // no ball ever settles into a flat rally
    traceBounces: 5,                 // how far ahead the dotted sight solves
    pullAfter: 5.5,                  // seconds FREE before gravity pulls
    pull: 620,                       // px/sec^2 — every shot ends in the lake

    /* --- the pocket: a ball that cannot reach the lava any more --------- */
    fastAfter: 5,                    // seconds shut in without touching glass before it speeds up
    fastMult: 1.8,                   // its speed then, x the base
    fastIn: 5,                       // 1/sec easing up to that speed
    fastOut: 16,                     // 1/sec easing back: a touch, or a way down opens
    releaseDelay: 2,                 // seconds the lit bank blinks over an empty pocket
                                     // before the game taps for the player
    stuckAfter: 9,                   // seconds shut in without touching glass: stuck
                                     // (four of them at full speed, past fastAfter)

    /* --- scoring ------------------------------------------------------- */
    colorScore: [10, 20, 30, 40, 60],   // red, green, blue, purple, rainbow — x the combo
    comboStep: 5,                    // bricks of ONE shot for each step of the combo
    comboMax: 5,                     // the multiplier the combo stops at
    pocketBonus: 25,                 // per brick, when a pocket is emptied
    clearBonus: 1000,                // clearing the field
    ballBonus: 400,                  // per ball still in the magazine when the round is won

    /* --- the stars: the wall, and how few balls it took ----------------- */
    starOne: 0.6,                    // share of the wall broken for one star
    starTwo: 0.9,                    // for two; three is the whole wall within par
    parBalls: 4                      // shots a clear may take for three; a level reads its own
                                     // (web.levels.objective, through applyLevel)
  };
  /* ===================================================================
     2. ASSETS — embedded base64 data URIs only (no network requests ever).
     Only the bonus pictograms are embedded here. The
     painted backdrops and brick textures are CONFIG.art (the build injects
     them out of assets/image/embed/); the balls, the cannon, the
     steel and the lava are all drawn in code.
     =================================================================== */
  var ASSETS = {
    images: {
      // assets/motor/lucide/arrow-left-right.svg
      "icoRow": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi42IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTggMyA0IDdsNCA0IiAvPiA8cGF0aCBkPSJNNCA3aDE2IiAvPiA8cGF0aCBkPSJtMTYgMjEgNC00LTQtNCIgLz4gPHBhdGggZD0iTTIwIDE3SDQiIC8+IDwvc3ZnPg==",
      // assets/motor/lucide/arrow-up-down.svg
      "icoCol": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi42IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0ibTIxIDE2LTQgNC00LTQiIC8+IDxwYXRoIGQ9Ik0xNyAyMFY0IiAvPiA8cGF0aCBkPSJtMyA4IDQtNCA0IDQiIC8+IDxwYXRoIGQ9Ik03IDR2MTYiIC8+IDwvc3ZnPg==",
      // assets/motor/lucide/bomb.svg
      "icoBomb": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPGNpcmNsZSBjeD0iMTEiIGN5PSIxMyIgcj0iOSIgLz4gPHBhdGggZD0iTTE0LjM1IDQuNjUgMTYuMyAyLjdhMi40MSAyLjQxIDAgMCAxIDMuNCAwbDEuNiAxLjZhMi40IDIuNCAwIDAgMSAwIDMuNGwtMS45NSAxLjk1IiAvPiA8cGF0aCBkPSJtMjIgMi0xLjUgMS41IiAvPiA8L3N2Zz4=",
      // assets/motor/lucide/circle-plus.svg
      "icoMulti": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIC8+IDxwYXRoIGQ9Ik04IDEyaDgiIC8+IDxwYXRoIGQ9Ik0xMiA4djgiIC8+IDwvc3ZnPg==",
      // assets/motor/lucide/circle-dot.svg
      "icoBig": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIC8+IDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEiIC8+IDwvc3ZnPg==",
      // assets/motor/lucide/flame.svg
      "icoFire": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTEyIDNxMSA0IDQgNi41dDMgNS41YTEgMSAwIDAgMS0xNCAwIDUgNSAwIDAgMSAxLTMgMSAxIDAgMCAwIDUgMGMwLTItMS41LTMtMS41LTVxMC0yIDIuNS00IiAvPiA8L3N2Zz4=",
      // assets/motor/lucide/magnet.svg
      "icoMagnet": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0ibTEyIDE1IDQgNCIgLz4gPHBhdGggZD0iTTIuMzUyIDEwLjY0OGExLjIwNSAxLjIwNSAwIDAgMCAwIDEuNzA0bDIuMjk2IDIuMjk2YTEuMjA1IDEuMjA1IDAgMCAwIDEuNzA0IDBsNi4wMjktNi4wMjlhMSAxIDAgMSAxIDMgM2wtNi4wMjkgNi4wMjlhMS4yMDUgMS4yMDUgMCAwIDAgMCAxLjcwNGwyLjI5NiAyLjI5NmExLjIwNSAxLjIwNSAwIDAgMCAxLjcwNCAwbDYuMzY1LTYuMzY3QTEgMSAwIDAgMCA4LjcxNiA0LjI4MnoiIC8+IDxwYXRoIGQ9Im01IDggNCA0IiAvPiA8L3N2Zz4="
    },
    sounds: {
      // The background bed, looped and crossfaded by Music (see CONFIG.music
      // and BIOMES, which name the window each biome of the climb rides).
      // This is a SHORT CUT of the track — a seam of pre-roll and the first biome's 14 bars, which is
      // all a playable plays, since it has one biome and no menu — and the
      // web target ships the whole of it instead (`web.music` in the manifest):
      //   ffmpeg -ss 14.25 -t 27.618 -i assets/audio/music/bouncetry.mp3 \
      //          -ac 1 -ar 44100 -b:a 64k music.mp3
      "music": "data:audio/mpeg;base64,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tuS+v1tPaM8cC6cE/0ioOF3/+1LE0wALjQ1VTRizGUeSauWmGHeBYIo3Dq3rAhRNoAAd2y1iy4FGZRtXXI3kZhttHEa+48ikEef+PrVkcbkIxCG6aQhgVsk5G0TyyK6OOqUI0UzFOudsVGTMpw87jL9Tw68zeQzbbO0pHWplti2Wj1iunyBwuH5TQ8fEMCHqicoQ0kZYTLbsRDgyQSV6lo3PT86W3afdZg31L/tsPRQLKRfkRUE1hwECAFe5YrC6xV24eX4s2tUnqQAAASXARsYRDwPSfX0Mwg2BQIw/jpP1m//7UsTZgArs51GtJG7BbaasdPGKNw9Oz1RRLxT31lpbnVdPwuc8+Q26uvd3njON3/co1XrGvJPxxWgVm2tTSrN9HU7Xk2WbLCkzqQrXLG0pwOrQX1VE3G1YUU3JTvKhv2p+M9ujB/IDShOYXiRwhXtNK7bdGSb9QwAMG12ar11BJrtgf3VU9NJpRtsRCQE1HvRVYFW6W5TJBowsWUYrSiKEK2uZCMJg8m8SHhwagMgQlUeIZMBHABSBBZx+IMDJQQzKKSMdT+PIcpHYUEwmFixc//tSxN4ACcy5ZYeYTzJbpmtNhLIwxicf+mXExxYeJA7DqZIQNyyI/8oJDDrDbLjRip1J+Sn3//+mcRIEsdbTz3ubbmuc3dX///2xjuar/4zM8Wm65kbnzhu80N0zRQAv84BBVgoBRKBkREVDQiAR4FRh4RFQ0IlPKzxGdLKeJZ4jO/iKdLX57///PFctOkp4qtxadJTxVbkqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+1LEyQAQ7V1tVPSAOlyvbWswsAKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7UsSXg8dMFP5cYIAAAAA0gAAABKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      // No sfx clip here: every key the game plays is a role of the house kit,
      // mapped by `sfx` in manifest.json and injected by the builder.
    }
  };

  /* ===================================================================
     6. GAME — BOUNCETRY: coloured glass and banks of switches, over a lake of lava.

     A round is two beats, repeated until the balls run out:
       aim     drag to swing the turret. The dotted sight solves the next
               FIVE bounces and the release fires ONE ball. The player re-aims
               between every shot.
       flight  the ball ricochets until the lava takes it, and TAP switches
               the buttons on and off while it flies. The three other walls are an
               electric fence, lit only where a ball strikes it.

     TWO KINDS OF BRICK, and they must never be mistaken for one another:
       glass   a painted brick in one of five colours, and the colour is what
               it pays, times the combo: red 10, green 20, blue 30, purple 40,
               rainbow 60. On a board of several colours the top is the rainbow
               and the bottom the red, so the best-paid glass is the glass a
               pocket guards — and what a pane paid is written where it broke,
               in its own colour and bigger the dearer it is. A tough one takes
               two hits.
       switch  a round BUTTON in a brick's cell (a painted cut, dark or lit).
               Dark, the ball flies straight through it — until the player
               taps. Then the whole bank lights up and turns solid: the ball
               bounces off it, it pays nothing and it never breaks. Tap again
               and it goes dark again. No cooldown and no budget: the player
               decides, and the level is what makes a tap right or wrong.
     A board may hold TWO banks of switches: A wears the biome's own colour,
     B yellow (blue in the yellow biome, whose own colour is yellow). Then a
     tap SWAPS them: when one lights up the other goes dark, and the
     blueprint says which one is lit when a shot leaves the cannon.
     In the code a switch is still a `ghost` brick and a lit one `solid`.

     THE POCKET is what all of it is for. The blueprints are drawn around
     chambers of glass whose doors are switches: fly in, tap, and the ball is shut
     in with the glass and eats it. Three rules follow from that:
       - a ball that can no longer reach the lava — every way down shut by the
         fence, glass or a lit switch — and has touched no glass for five
         seconds is SPED UP (x1.8), and eased back to normal the moment it
         touches a pane or a way down opens again. Four more seconds without
         a touch and it counts as stuck: the lava pulls it. The lava's pull
         otherwise only counts the time a ball spent free.
       - a ball shut in a pocket with NO glass left to reach is let out by the
         game: the lit bank blinks for two seconds, then the game taps for the
         player. A tap of the player's own during the blink cancels it.
       - emptying a pocket pays a bonus for every brick it held.

     BONUS BRICKS are glass panes the blueprint places itself, each carrying
     a Lucide pictogram (ASSETS.images.ico*, drawn through the motor's Icon
     helper). Once broken:
       row        clears the glass of its whole row
       column     clears the glass of its whole column
       bomb       detonates the glass among its eight neighbours
       multiball  releases three extra balls
       big ball   the ball that broke it grows, for the rest of its flight
       fireball   for five seconds the ball burns THROUGH the glass instead of
                  bouncing off it (a lit switch still throws it back)
       magnet     for five seconds the glass near the ball tears itself off
                  the board and flies into it, one pane at a time
     A power never touches a switch: lit or dark, it is out of every power's reach.

     THIRTY BLUEPRINTS, one per level and no two alike, in FIVE BIOMES of six
     (the level map's bands, named in the manifest). A biome is a painted
     place of the foundry, from the lava fields outside to the core of the
     furnace, and it brings its own bonuses:
       1  red     lava fields    rows and columns
       2  blue    night works    bombs and multiball
       3  green   green forge    the big ball
       4  purple  machine hall   the fireball
       5  yellow  furnace core   the magnet
     The first biome teaches one bank of switches, the second brings the second
     bank in, and the last three mix them. Every blueprint is mirrored at
     random. The playable draws one of the first biome's two mixes (stages 5
     and 6); the endless run draws any of the thirty.

     SIX STAGES A BIOME, one lesson each (STAGES), whatever the blueprint:
       1  one colour     the biome's own, and nothing else
       2  the colours    all five, dealt by height, each paying its own
       3  the power      one colour again, and the biome's first bonus
       4  the living     one colour again, and the biome's living glass
       5  the mix        the colours, every bonus of the biome and its glass
       6  the finale     the mix, with the power and the glass of the biome
                         before it coming back for a last look
     The blueprint's bonus letters are SLOTS: the stage decides what goes in
     them, and tops them up on plain glass when it wants more than it drew.

     THE SCORE AND THE STARS. The combo is the shot's: every pane one shot
     breaks — by the ball, a power or the balls it split into — counts, the
     multiplier climbs one step every five panes (x2 at 5, up to x5 at 20) and
     only the next shot starts it again. The stars are the wall's, never the
     score's: one for three fifths of it, two for nine tenths, and three for
     clearing it within PAR — a number of shots each level sets; a clear that
     took more is worth two. The third star ends the round, and every ball
     left in the magazine is paid.

     LIVING GLASS. Every biome also brings a pane that does something on its
     own, placed by the game on top of the blueprint (BIOMES[].live) — a warp
     pane is ADDED in a free cell, the three others are plain panes of the
     blueprint turned, so no pocket loses a wall:
       1  warp    a rainbow pane that jumps to a free cell nearby every three
                  seconds
       2  split   a pane rimmed in black: broken, it bursts into plain glass
                  on every free cell around it
       3  seed    a pane that grows one pane of glass on a free cell around it
                  every second, for as long as it stands (it takes two hits)
       4  shield  an electric pane whose shield comes up and drops on a beat:
                  while it is up the pane is steel — the ball, the fire and
                  every power bounce off it
       5  all four at once, fewer of each
     A cell is free when nothing alive stands in it and no ball overlaps it,
     so no pane ever appears on top of a ball. Every pane the living glass
     adds counts in the board, and a clear has to take it too.

     A STAGE HAS ITS OWN BRICK. The glass is cut out of five painted sheets —
     one per colour, the same designs in the same cells — and a stage paints
     all of its glass in ONE design, all five colours of it: brick 7 blue and
     brick 7 green, never 7 and 12. Twenty-three designs survived the
     duplicates on the sheets, so stages 1 to 23 each have their own and the
     last seven wear a design from the second and third biomes again.
     =================================================================== */
  var Game = (function () {
    var C = CONFIG, TAU = Math.PI * 2;

    /* --- the biomes: the painting each one stands in, its stretch of the
         track (CONFIG.music), so the scene and the bed turn over together,
         and how many panes of each living kind it places */
    var BIOMES = [
      { scene: "backgroundPhone",       music: { from: 15.2,  length: 26.668 },   // red: the lava fields, and the map's own
        tone: 0, powers: ["row", "col"],    live: { warp: 5 } },
      { scene: "backgroundPhoneBlue",   music: { from: 49.5,  length: 22.859 },   // blue: the works at night
        tone: 2, powers: ["multi", "bomb"], live: { split: 4 } },
      { scene: "backgroundPhoneGreen",  music: { from: 76.2,  length: 30.477 },   // green: the forge
        tone: 1, powers: ["big"],           live: { seed: 1 } },
      { scene: "backgroundPhonePurple", music: { from: 121.9, length: 28.433 },   // purple: the machine hall
        tone: 3, powers: ["fire"],          live: { shield: 4 } },
      { scene: "backgroundPhoneYellow", music: { from: 152.4, length: 16.995 },   // yellow: the furnace core
        tone: 4, powers: ["magnet"],        live: { warp: 2, split: 2, seed: 1, shield: 2 } }
    ];
    var biome = 0, tex = 1;                    // the stage's biome and brick design
    // `tone` is the biome's own glass (there is no yellow glass: the furnace
    // core's is the rainbow), `powers` its bonuses, first the one it teaches.

    /* --- the six stages of a biome: what each one switches on ----------
         mono    every pane in the biome's own colour
         bonus   how many bonus panes, and `powers` which: 1 the biome's
                 first, 2 all of them in turn
         live    the biome's living glass;  recap  the biome before it too */
    var STAGES = [
      { mono: true,  bonus: 0, powers: 0, live: false, recap: false },   // one colour
      { mono: false, bonus: 0, powers: 0, live: false, recap: false },   // the colours
      { mono: true,  bonus: 2, powers: 1, live: false, recap: false },   // the power
      { mono: true,  bonus: 0, powers: 0, live: true,  recap: false },   // the living glass
      { mono: false, bonus: 3, powers: 2, live: true,  recap: false },   // the mix
      { mono: false, bonus: 4, powers: 2, live: true,  recap: true  }    // the finale
    ];
    var stage = 0, recipe = STAGES[0];        // the stage within its biome, and what it switches on
    var par = CONFIG.parBalls;                // shots within which a clear is worth three stars

    /* --- the living glass: what each kind is called, and for the ones whose
         rule the board cannot show, what the first meeting names
         (Notify.learn, whose line opens the guide page of the same id) */
    var K_WARP = "warp", K_SPLIT = "split", K_SEED = "seed", K_SHIELD = "shield";
    var LIVE_ORDER = [K_WARP, K_SPLIT, K_SEED, K_SHIELD];
    var LIVE = {};
    LIVE[K_WARP]   = { word: "Warp glass" };
    LIVE[K_SPLIT]  = { word: "Split glass",  sub: "This glass bursts into new bricks",        icon: "warn" };
    LIVE[K_SEED]   = { word: "Seed glass",   sub: "This glass grows a brick every second", icon: "heart" };
    LIVE[K_SHIELD] = { word: "Shield glass", sub: "Hit this glass while its shield is down", icon: "lock" };
    var K_MIX = "living";                      // the furnace core's page: all four kinds at once
    var SHOCK = "#7ef9ff", SEED = "#b8ff6a";   // the shield's arc, the seed's sap

    /* --- the five colours of glass, from the cheapest to the dearest ------
         `key` names the painted cut (ArtImages.brickRed07); the three hexes
         are what the sparks, the score and the fallback face are drawn in. */
    function pane(key, core, light, edge) { return { key: key, core: core, light: light, edge: edge }; }
    var COLORS = [
      pane("Red",     "#ff5a1f", "#ffd2b8", "#7a1d00"),
      pane("Green",   "#3ddc6e", "#cfffdc", "#0f5a2a"),
      pane("Blue",    "#2f9bff", "#d0eaff", "#0b3f8c"),
      pane("Purple",  "#b44dff", "#ecd6ff", "#4b1a85"),
      pane("Rainbow", "#ff4fd8", "#fff6c9", "#5a2a7a")
    ];
    var RAINBOW = ["#ff3b57", "#ffd43b", "#4ade80", "#2f9bff", "#b44dff"];
    function sparksOf(tone) { return tone === 4 ? RAINBOW : [COLORS[tone].core, COLORS[tone].light, "#ffffff"]; }
    // The ball has no colour of its own: white while it is free, gold while it
    // is shut in a pocket and running fast.
    var BALL = { core: "#eaf6ff", light: "#ffffff", glow: "#8fd3ff" };
    var HOT  = { core: "#ffd84a", light: "#fff7cf", glow: "#ffb000" };

    /* --- the switches: two banks of buttons, lit (solid) or dark (open) ---
         Bank A wears the biome's own colour and bank B yellow — blue in the
         yellow biome, where yellow is already A. `art` is the colour's place
         on the button sheet (ArtImages.buttonOn01 … buttonOff05); the three
         hexes are what the sparks, the sight and the fallback are drawn in. */
    var BUTTONS = {
      red:    { art: 1, tint: "#ff4a3d", deep: "#6a0f0f", light: "#ffd2cc" },
      blue:   { art: 2, tint: "#3aa0ff", deep: "#0b3f8c", light: "#d6ecff" },
      purple: { art: 3, tint: "#c05cff", deep: "#4b1a85", light: "#f0dcff" },
      green:  { art: 4, tint: "#4ae04a", deep: "#11622f", light: "#d8ffd8" },
      yellow: { art: 5, tint: "#ffc21a", deep: "#7a5200", light: "#fff1c2" }
    };
    var BIOME_HUE = ["red", "blue", "green", "purple", "yellow"];
    var GHOST = [null, null, null];
    function bank(hue, key) {
      var b = BUTTONS[hue];
      return { key: key, art: b.art, tint: b.tint, deep: b.deep, light: b.light };
    }
    function dressBanks() {
      var a = BIOME_HUE[biome] || "red";
      GHOST[1] = bank(a, "a");
      GHOST[2] = bank(a === "yellow" ? "blue" : "yellow", "b");
    }
    dressBanks();                   // the first biome's, before any reset (onResize runs first)
    var GM = 18;                    // sprite margin: a lit button's halo bleeds past its cell

    /* --- the bonuses a blueprint places -------------------------------- */
    var B_ROW = "row", B_COL = "col", B_BOMB = "bomb", B_MULTI = "multi";
    var B_BIG = "big", B_FIRE = "fire", B_MAG = "magnet";
    var BONUS = {};
    BONUS[B_ROW]   = { icon: "icoRow",    word: "Row blast" };
    BONUS[B_COL]   = { icon: "icoCol",    word: "Column blast" };
    BONUS[B_BOMB]  = { icon: "icoBomb",   word: "Bomb" };
    BONUS[B_MULTI] = { icon: "icoMulti",  word: "Multiball" };
    BONUS[B_BIG]   = { icon: "icoBig",    word: "Big ball" };
    BONUS[B_FIRE]  = { icon: "icoFire",   word: "Fireball" };
    BONUS[B_MAG]   = { icon: "icoMagnet", word: "Magnet" };
    // The blueprint's own letter for each of them.
    var SYM = { "=": B_ROW, "!": B_COL, "*": B_BOMB, "+": B_MULTI, "@": B_BIG, "^": B_FIRE, "&": B_MAG };

    /* --- the blueprints ------------------------------------------------
         .  empty   o  glass   O  tough glass (two hits)
         a  switch A  b  switch B
         =  row   !  column   *  bomb   +  multiball
         @  big ball   ^  fireball   &  magnet        (a bonus pane of glass)
         start: the bank that is lit when a shot leaves (0 none, 1 A, 2 B).
       One per level, in order, six per biome. Every pocket keeps a row or
       two of air inside its door, which is the time the player has to tap
       between "the ball is in" and "the ball is out". All thirty were checked
       offline: no two alike, every pane of glass reachable from the cannon,
       at least one pocket a tap can shut. */
    var BLUEPRINTS = [
      // ---- biome 1 ----
      // 1. The lid — a band of glass and one line of switches under it: fly through, tap, rake the band.
      { start: 0, rows: [
        "............",
        "oooooooooooo",
        "ooOooo=ooOoo",
        "oooooooooooo",
        "............",
        "............",
        "aaaaaaaaaaaa",
        "............",
        "............",
        "....o..o....",
        "...oo..oo..."] },
      // 2. The low lid — the band hangs lower, with air over it as well as under it.
      { start: 0, rows: [
        "............",
        "............",
        "oooooooooooo",
        "oooo!ooooooo",
        "oooooooooooo",
        "............",
        "aaaaaaaaaaaa",
        "............",
        "oo........oo",
        "ooo......ooo",
        "oooo....oooo"] },
      // 3. The cage — a box of switches around a core of glass, with air inside it.
      { start: 0, rows: [
        "............",
        "............",
        "..aaaaaaaa..",
        "..aooooooa..",
        "..aoOo=Ooa..",
        "..aooooooa..",
        "..aooOOooa..",
        "..a......a..",
        "..a......a..",
        "..aaaaaaaa..",
        "............",
        "oo........oo",
        "ooo......ooo"] },
      // 4. The twins — two cages back to back: the ball is shut in the one it is in.
      { start: 0, rows: [
        "............",
        "aaaaaaaaaaaa",
        "aaoooaao!oaa",
        "aaOoOaaOoOaa",
        "aao=oaaoooaa",
        "aa...aa...aa",
        "aa...aa...aa",
        "aaaaaaaaaaaa",
        "............",
        "............",
        "..oo....oo..",
        "...o....o..."] },
      // 5. The vault — walls of glass and a floor of switches: the room opens as it is eaten.
      { start: 0, rows: [
        "............",
        "..oooooooo..",
        "..o......o..",
        "..o.OO=O.o..",
        "..o.O!OO.o..",
        "..o......o..",
        "..o......o..",
        "..oaaaaaao..",
        "............",
        "............",
        "oo..o..o..oo"] },
      // 6. The bowl — a bowl of glass under a lid of switches: come down into it from above.
      { start: 0, rows: [
        "............",
        "............",
        "...aaaaaa...",
        "...o....o...",
        "...o.oo.o...",
        "...o.!o.o...",
        "...o....o...",
        "...oooooo...",
        "............",
        "oo........oo",
        "ooo......ooo"] },
      // ---- biome 2 ----
      // 7. Two decks — two lines of the same switches: one tap shuts two rooms.
      { start: 0, rows: [
        "............",
        "oooooooooooo",
        "oooo*oooo+oo",
        "............",
        "aaaaaaaaaaaa",
        "............",
        "ooooo..ooooo",
        "............",
        "aaaaaaaaaaaa",
        "............",
        "...o....o..."] },
      // 8. The diamond — a diamond of switches: its staircase walls hold as well as a straight one.
      { start: 0, rows: [
        "............",
        "ooo..aa..ooo",
        "oo..a..a..oo",
        "...a.oo.a...",
        "..a.o*+o.a..",
        "aa.oooooo.aa",
        "..a......a..",
        "...a....a...",
        "....a..a....",
        ".....aa.....",
        "ooo......ooo",
        "oooo....oooo"] },
      // 9. The shafts — two pillars of switches cut the top into three wells.
      { start: 0, rows: [
        "............",
        "ooooaooaoooo",
        "oo*oaOOao+oo",
        "ooooaooaoooo",
        "....a..a....",
        "....a..a....",
        "....a..a....",
        "....a..a....",
        "....a..a....",
        "............",
        "............",
        "oo...oo...oo"] },
      // 10. The hourglass — two rooms joined by a neck: shut them both, the ball goes where it likes.
      { start: 0, rows: [
        "............",
        "aaaaaaaaaaaa",
        "aa.oooooo.aa",
        "aa.o+oo*o.aa",
        "aa........aa",
        "aaaaa..aaaaa",
        "ooo.a..a.ooo",
        "aaaaa..aaaaa",
        "aa.o....o.aa",
        "aa.oooooo.aa",
        "aa........aa",
        "aaaaaaaaaaaa"] },
      // 11. The airlock — two banks: slip through B into the lock, swap, and the top is shut in.
      { start: 1, rows: [
        "............",
        "oooooooooooo",
        "ooOO*oo+OOoo",
        "oooooooooooo",
        "............",
        "aaaaaaaaaaaa",
        "............",
        "...oo..oo...",
        "............",
        "bbbbbbbbbbbb",
        "............",
        "...o....o...",
        "..ooo..ooo.."] },
      // 12. The seesaw — the left cage is A, the right one B: each tap shuts one and opens the other.
      { start: 1, rows: [
        "............",
        "aaaaaabbbbbb",
        "aaoooabooobb",
        "aaO*Oab+OObb",
        "aaoooabooobb",
        "aa...ab...bb",
        "aa...ab...bb",
        "aaaaaabbbbbb",
        "............",
        "............",
        "..oo....oo..",
        "...o....o..."] },
      // ---- biome 3 ----
      // 13. The ladder — A over the band, B under the room: climb one bank at a time.
      { start: 1, rows: [
        "............",
        "ooooo@oooooo",
        "oooooooooooo",
        "............",
        "aaaaaaaaaaaa",
        "............",
        "ooOooOOooOoo",
        "............",
        "............",
        "bbbbbbbbbbbb",
        "............",
        "...o....o..."] },
      // 14. The tower — one tall narrow cage between two walls of glass.
      { start: 0, rows: [
        "............",
        "....aaaa....",
        "ooo.aooa.ooo",
        "ooo.aoOa.ooo",
        "ooO.a@oa.Ooo",
        "ooo.aooa.ooo",
        "....a..a....",
        "....a..a....",
        "....a..a....",
        "....aaaa....",
        "............",
        "oo........oo",
        "ooo......ooo"] },
      // 15. The pair — two cages apart, A and B, over a pillar of glass.
      { start: 1, rows: [
        "............",
        "aaaaa..bbbbb",
        "aaooa..boobb",
        "aaOoa..bo@bb",
        "aaooa..boobb",
        "aa..a..b..bb",
        "aa..a..b..bb",
        "aaaaa..bbbbb",
        ".....oo.....",
        ".....oo.....",
        "..oo....oo..",
        "oo..o..o..oo"] },
      // 16. The split floor — one band, two floors: A under the left room, B under the right.
      { start: 1, rows: [
        "............",
        "oooooooooooo",
        "ooo@ooooOooo",
        "oooooooooooo",
        ".....oo.....",
        ".....oo.....",
        "aaaaaoobbbbb",
        ".....oo.....",
        "............",
        "...o....o...",
        "..oo....oo.."] },
      // 17. The locks — A, B, A going down: the ball climbs one lock at a time.
      { start: 2, rows: [
        "............",
        "oooooooooooo",
        "ooOOoo@oOOoo",
        "............",
        "aaaaaaaaaaaa",
        "............",
        "oo..oooo..oo",
        "............",
        "bbbbbbbbbbbb",
        "............",
        "..o..oo..o..",
        "............",
        "aaaaaaaaaaaa"] },
      // 18. The nest — a cage of B inside a cage of A.
      { start: 2, rows: [
        "............",
        "aaaaaaaaaaaa",
        "aa.oo..oo.aa",
        "aa.bbbbbb.aa",
        "aa.bo@oob.aa",
        "aa.bOooOb.aa",
        "aa.b....b.aa",
        "aa.bbbbbb.aa",
        "aa..o..o..aa",
        "aa.o.oo.o.aa",
        "aaaaaaaaaaaa",
        "............",
        "ooo..oo..ooo"] },
      // ---- biome 4 ----
      // 19. The kiln — a frame of glass with two lines of switches inside it.
      { start: 0, rows: [
        "............",
        "oooooooooooo",
        "oo........oo",
        "oo.oo^Ooo.oo",
        "oo........oo",
        "oo.aaaaaa.oo",
        "oo........oo",
        "oo.OOOOOO.oo",
        "oo........oo",
        "ooaaaaaaaaoo",
        "............",
        "oo..o..o..oo"] },
      // 20. The grate — a grate of glass between two banks.
      { start: 1, rows: [
        "............",
        "oooooooooooo",
        "oo^oooooOooo",
        "............",
        "aaaaaaaaaaaa",
        "............",
        "ooo.oo.oo.oo",
        "............",
        "bbbbbbbbbbbb",
        "............",
        "..oo.oo.oo.."] },
      // 21. The furnaces — two tall cages and a heart of glass between them.
      { start: 0, rows: [
        "............",
        "aaaaa..aaaaa",
        "aa^oa..aooaa",
        "aaOoa..aoOaa",
        "aaooaooaooaa",
        "aa..aooa..aa",
        "aa..a..a..aa",
        "aa..a..a..aa",
        "aaaaa..aaaaa",
        "ooo......ooo",
        ".....oo.....",
        "oo........oo"] },
      // 22. The stair — a staircase of switches shuts a corner of glass against the ceiling.
      { start: 0, rows: [
        "ooooooo..a..",
        "oo^ooo..a...",
        "ooOoo..a....",
        "oooo..a.....",
        "ooo..a......",
        "oo..a.......",
        "...a........",
        "..a.........",
        "aa..........",
        "............",
        ".......ooooo",
        "......ooOooo"] },
      // 23. The ring — a ring of glass inside a ring of switches, a prize in the hollow.
      { start: 0, rows: [
        "............",
        "..aaaaaaaa..",
        "..a......a..",
        "..a.oooo.a..",
        "..a.o..o.a..",
        "..a.o^.o.a..",
        "..a.oooo.a..",
        "..a.o..o.a..",
        "..a......a..",
        "..aaaaaaaa..",
        "............",
        "oooo.oo.oooo"] },
      // 24. The pillar — one room under the band, split by a pillar of switches.
      { start: 0, rows: [
        "............",
        "ooooo..ooooo",
        "oo^oo..oOooo",
        ".....aa.....",
        ".....aa.....",
        "aaaaaaaaaaaa",
        "oo........oo",
        "....o..o....",
        "..o......o..",
        "...o....o..."] },
      // ---- biome 5 ----
      // 25. The divided cage — a cage of A cut in two by a line of B.
      { start: 2, rows: [
        "............",
        "aaaaaaaaaaaa",
        "aa.oooooo.aa",
        "aa.oO&Ooo.aa",
        "aa..o..o..aa",
        "aabbbbbbbbaa",
        "aa........aa",
        "aa.oooooo.aa",
        "aa........aa",
        "aaaaaaaaaaaa",
        "............",
        "ooo......ooo"] },
      // 26. The deep locks — four lines, A and B in turn, glass on every landing.
      { start: 2, rows: [
        "oooooooooooo",
        "ooO&ooooOooo",
        "............",
        "aaaaaaaaaaaa",
        "............",
        "oo.oo..oo.oo",
        "............",
        "bbbbbbbbbbbb",
        "............",
        "ooo..oo..ooo",
        "............",
        "aaaaaaaaaaaa",
        "............"] },
      // 27. The stack — a cage of A on top of a cage of B.
      { start: 1, rows: [
        "............",
        "aaaaaaaaaaaa",
        "aa.oo&oOo.aa",
        "aa.o....o.aa",
        "aa........aa",
        "aaaaaaaaaaaa",
        "bb.oOoooo.bb",
        "bb...oo...bb",
        "bb........bb",
        "bbbbbbbbbbbb",
        "............",
        "ooo..oo..ooo"] },
      // 28. The two rooms — two rooms of glass, a floor of A under one and of B under the other.
      { start: 1, rows: [
        "............",
        "oooooooooooo",
        "oo...oo...oo",
        "oo.O.oo.&.oo",
        "oo...oo...oo",
        "ooaaaoobbboo",
        "............",
        ".....oo.....",
        "............",
        "...o....o..."] },
      // 29. The great diamond — a diamond of A cut in two by a line of B.
      { start: 2, rows: [
        ".....aa.....",
        "....a..a....",
        "...a.oo.a...",
        "..a.o&Oo.a..",
        "aa.oooooo.aa",
        "aabbbbbbbbaa",
        "..a.o..o.a..",
        "...a....a...",
        "....a..a....",
        ".....aa.....",
        "ooo......ooo",
        "oo..o..o..oo"] },
      // 30. The citadel — a vault of B over two cages of A.
      { start: 1, rows: [
        "oooooooooooo",
        "ooOoo&oooOoo",
        "............",
        "bbbbbbbbbbbb",
        "............",
        "aaaaa..aaaaa",
        "aao&a..aOoaa",
        "aa..a..a..aa",
        "aa..a..a..aa",
        "aaaaa..aaaaa",
        "............",
        "....oooo...."] }
    ];

    /* --- geometry, rebuilt whenever Layout moves ---------------------- */
    var field = { left: 0, right: 0, top: 0, floor: 0 };
    var G = { cols: 0, rows: 0, cw: 0, ch: 0, x0: 0, y0: 0 };
    var cannon = { x: 0, y: 0 };
    var BW = 0, BH = 0;             // a brick face, inside its cell
    var sprites = null;             // cached brick faces, one canvas per look
    var bgCv = null;                // the painted backdrop, composited once
    /* What each cache was last built FROM. A replay of the same level used to
       rebuild all of them — 72 canvases, ~15 MB of pixels thrown at the
       collector per round, reclaimed by a major GC mid-round a few rounds
       later as a hitch. Each cache now names its true inputs here and is
       rebuilt only when one of them moved (a resize, a new band, art that
       finished decoding); the canvases it replaces are freed on the spot. */
    var bgSig = "", glassSig = "", bankSig = "";
    var boxes = {};                 // a painted cut's opaque box, measured once per key
    var bgGrad = null, lavaGrad = null;

    /* --- run state ---------------------------------------------------- */
    var phase;                      // "aim" | "flight" | "over"
    var plan, cells, bricks, total, broken, groups;
    var solidG, releaseT, releaseTick; // the bank that is lit, the auto-tap countdown
    var balls, queue, fired;
    var score, chain, bestChain, bestTally, ballsPaid;   // chain: the panes this shot broke
    var aimA, aiming, trace, traceHits, traceMarks;
    var clock, flightT, endT, idleT, recoil;
    var pulled, cleared, lastWall, lastSwap;
    var beams, bubbles, zaps, flyers, stepping;   // flyers: panes a magnet pulled
    var shards, lifeDirty;          // split panes waiting to burst; the living glass moved

    /* --- small canvas helpers ---------------------------------------- */
    function rr(x, px, py, w, h, r) {
      var k = Math.min(r, w / 2, h / 2);
      x.beginPath();
      x.moveTo(px + k, py);
      x.lineTo(px + w - k, py); x.quadraticCurveTo(px + w, py, px + w, py + k);
      x.lineTo(px + w, py + h - k); x.quadraticCurveTo(px + w, py + h, px + w - k, py + h);
      x.lineTo(px + k, py + h); x.quadraticCurveTo(px, py + h, px, py + h - k);
      x.lineTo(px, py + k); x.quadraticCurveTo(px, py, px + k, py);
      x.closePath();
    }

    function geometry() {
      field.left  = Layout.left;
      field.right = Layout.right;
      field.top   = Layout.top + 6;
      field.floor = Layout.bottom - C.lavaH;      // the surface of the lake
      G.cols = C.cols;
      G.cw = (field.right - field.left) / G.cols;
      G.ch = C.cellH;
      G.x0 = field.left;
      G.y0 = field.top;               // the blueprints bring their own air under the ceiling
      BW = G.cw - C.pad * 2; BH = G.ch - C.pad * 2;
      cannon.x = (field.left + field.right) / 2;
      cannon.y = field.floor - C.cannonH;
      bgGrad = ctx.createLinearGradient(0, 0, 0, Layout.bottom);
      bgGrad.addColorStop(0, "#1b246c");
      bgGrad.addColorStop(0.42, "#131a4c");
      bgGrad.addColorStop(0.78, "#0c1136");
      bgGrad.addColorStop(1, "#1a0d24");
      lavaGrad = ctx.createLinearGradient(0, field.floor, 0, Layout.bottom + 12);
      lavaGrad.addColorStop(0, "#ffd36b");
      lavaGrad.addColorStop(0.16, "#ff8a1a");
      lavaGrad.addColorStop(0.55, "#e03400");
      lavaGrad.addColorStop(1, "#540900");
      buildBackdrop();
    }

    /* The backdrop is the biome's painting (CONFIG.art, one per band; the
       playable ships the first alone), cover-fit to the design canvas and
       composited ONCE here: the glass is what has to read on screen, so the
       art is knocked back with a flat scrim and the HUD / CTA bands are
       darkened further. Falls back to the first biome's, then to the
       gradient, so a bare frame is impossible. */
    function sceneKey() {
      var a = typeof ArtImages !== "undefined" ? ArtImages : {};
      var k = BIOMES[biome].scene, img = a[k];
      if (!(img && img.width)) { k = "backgroundPhone"; img = a[k]; }
      return img && img.width ? k : null;
    }
    function sceneImage() {
      var k = sceneKey();
      return k ? ArtImages[k] : null;
    }
    /* Depends on the frame's size, the HUD / CTA edges the bands are cut at
       and which painting resolved — not on the round, so a replay keeps it.
       A new band repaints the SAME canvas rather than allocating another. */
    function buildBackdrop() {
      var key = sceneKey(), img = key ? ArtImages[key] : null, g, s, w, h, band;
      var sig = view.w + "x" + view.h + "|" + Layout.top + "|" + Layout.bottom + "|" + key;
      if (bgCv && sig === bgSig) return;
      bgSig = sig;
      if (!bgCv || bgCv.width !== view.w || bgCv.height !== view.h) {
        bgCv = freeCanvas(bgCv);
        bgCv = document.createElement("canvas");
        bgCv.width = view.w; bgCv.height = view.h;
      }
      g = bgCv.getContext("2d");
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, view.w, view.h);
      g.fillStyle = C.bg; g.fillRect(0, 0, view.w, view.h);
      if (img && img.width) {
        s = Math.max(view.w / img.width, view.h / img.height);   // cover, never stretch
        w = img.width * s; h = img.height * s;
        g.drawImage(img, (view.w - w) / 2, (view.h - h) / 2, w, h);
      } else {
        g.fillStyle = bgGrad; g.fillRect(0, 0, view.w, view.h);
      }
      g.fillStyle = "rgba(7,10,30,.5)";                          // a stop and a half under the glass
      g.fillRect(0, 0, view.w, view.h);
      band = g.createLinearGradient(0, 0, 0, view.h);
      band.addColorStop(0, "rgba(5,7,22,.72)");
      band.addColorStop(clamp(Layout.top / view.h, 0.02, 0.4), "rgba(5,7,22,0)");
      band.addColorStop(clamp(Layout.bottom / view.h, 0.6, 0.98), "rgba(5,7,22,0)");
      band.addColorStop(1, "rgba(5,7,22,.72)");
      g.fillStyle = band; g.fillRect(0, 0, view.w, view.h);
    }

    /* --- brick faces, rendered once -----------------------------------
       GLASS (the tempered glass picked in lab/brick.html): the body is
       barely tinted so the board reads THROUGH the wall, and the whole shape
       comes from a hard inner bevel, one diagonal refraction band and a
       chipped top corner. A tough pane carries a second, heavier rim and
       shows its cracks once it has been hit. No shadowBlur: each look is
       rasterized here once and blitted afterwards. */
    function face(p, bonus, tough, cracked) {
      var w = Math.max(2, Math.round(BW)), h = Math.max(2, Math.round(BH));
      var cv = document.createElement("canvas"), x = cv.getContext("2d"), d = 2, g;
      cv.width = w * d; cv.height = h * d; x.setTransform(d, 0, 0, d, 0, 0);

      rr(x, 1, 1, w - 2, h - 2, 12); x.fillStyle = rgba(p.core, tough ? 0.66 : 0.5); x.fill();
      x.save(); rr(x, 1, 1, w - 2, h - 2, 12); x.clip();
      g = x.createLinearGradient(0, h * 0.45, 0, h);      // the lip, full colour
      g.addColorStop(0, rgba(p.core, 0)); g.addColorStop(1, rgba(p.edge, 0.85));
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      g = x.createLinearGradient(0, h, w * 0.75, 0);        // the refraction
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.42, "rgba(255,255,255,.34)");
      g.addColorStop(0.5, "rgba(255,255,255,.06)");
      g.addColorStop(0.62, "rgba(255,255,255,.22)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = "rgba(255,255,255,.42)";                // the chipped corner
      x.beginPath(); x.moveTo(w - 20, 0); x.lineTo(w, 0); x.lineTo(w, 15); x.closePath(); x.fill();
      if (cracked) {                                        // the hit it already took
        x.strokeStyle = "rgba(255,255,255,.85)"; x.lineWidth = 1.6;
        x.beginPath();
        x.moveTo(w * 0.42, 0); x.lineTo(w * 0.5, h * 0.42); x.lineTo(w * 0.36, h * 0.7); x.lineTo(w * 0.44, h);
        x.moveTo(w * 0.5, h * 0.42); x.lineTo(w * 0.72, h * 0.3); x.lineTo(w, h * 0.44);
        x.moveTo(w * 0.36, h * 0.7); x.lineTo(w * 0.14, h * 0.62);
        x.stroke();
      }
      x.restore();
      rr(x, 3.5, 3.5, w - 7, h - 7, 10);                    // the inner bevel
      x.strokeStyle = rgba(p.light, 0.5); x.lineWidth = 3; x.stroke();
      rr(x, 1.5, 1.5, w - 3, h - 3, 12);
      x.strokeStyle = rgba(p.light, 0.95); x.lineWidth = 2; x.stroke();
      if (tough) {                                          // the reinforced rim
        rr(x, 7, 7, w - 14, h - 14, 6);
        x.strokeStyle = rgba(p.light, 0.9); x.lineWidth = 2.5; x.stroke();
      }

      if (bonus) {
        // A charged pane: the glass is lit from the inside, a second rim runs
        // around it, and the power's pictogram is etched on the face.
        x.save(); rr(x, 2, 2, w - 4, h - 4, 11); x.clip();
        g = x.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.55);
        g.addColorStop(0, "rgba(255,255,255,.4)"); g.addColorStop(1, "rgba(255,255,255,0)");
        x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.restore();
        rr(x, 5.5, 5.5, w - 11, h - 11, 8);
        x.strokeStyle = "rgba(255,255,255,.8)"; x.lineWidth = 2; x.stroke();
        Icon.draw(x, BONUS[bonus].icon, w / 2, h / 2, Math.round(h * 0.7), "#ffffff");
      }
      return cv;
    }

    /* MIST: no edge at all. A handful of soft puffs, bigger than the cell, so
       a bank of ghost bricks reads as one drifting cloud rather than a row of
       boxes — and only a faint dotted footprint says where each one stands.
       Three variants per bank, so two neighbours never breathe as one. */
    function fogFace(g) {
      var w = Math.round(BW) + GM * 2, h = Math.round(BH) + GM * 2;
      var cv = document.createElement("canvas"), x = cv.getContext("2d"), i, px, py, r, gr;
      cv.width = w; cv.height = h;
      for (i = 0; i < 12; i++) {
        px = GM + Rand.range(0, 1) * BW; py = GM + Rand.range(0.15, 0.85) * BH;
        r = Rand.range(16, 30);
        gr = x.createRadialGradient(px, py, 0, px, py, r);
        gr.addColorStop(0, rgba(g.light, 0.24));
        gr.addColorStop(0.45, rgba(g.tint, 0.12));
        gr.addColorStop(1, rgba(g.tint, 0));
        x.fillStyle = gr;
        x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
      }
      x.setLineDash([4, 6]);
      rr(x, GM + 3, GM + 3, BW - 6, BH - 6, 12);
      x.strokeStyle = rgba(g.tint, 0.18); x.lineWidth = 1.5; x.stroke();
      return cv;
    }

    /* STEEL: the same brick once the tap has condensed it — and the one
       thing on the board that must never pass for a brick. The glass is
       painted metal with rivets and a glow, so the steel is what a foundry
       paints on a barrier: a blast plate framed in yellow and black hazard
       stripes, a halo in the bank's colour and its emblem in the middle (A a
       diamond, B a disc). No rivets and no glow of its own. */
    function steelFace(g) {
      var w = Math.round(BW), h = Math.round(BH), d = 2, i, gr, s, cx, cy, b = 6;
      var cv = document.createElement("canvas"), x = cv.getContext("2d");
      cv.width = (w + GM * 2) * d; cv.height = (h + GM * 2) * d;
      x.setTransform(d, 0, 0, d, GM * d, GM * d);
      for (i = 3; i >= 1; i--) {                           // the energy halo
        rr(x, -i * 3, -i * 3, w + i * 6, h + i * 6, 8 + i * 3);
        x.strokeStyle = rgba(g.tint, 0.1 * (4 - i)); x.lineWidth = 3; x.stroke();
      }
      x.save(); rr(x, 0, 0, w, h, 6); x.clip();            // the hazard frame
      x.fillStyle = "#15161a"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#ffc400";
      for (i = -h; i < w + h; i += 12) {
        x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 6, 0); x.lineTo(i + 6 - h, h); x.lineTo(i - h, h); x.closePath(); x.fill();
      }
      gr = x.createLinearGradient(0, b, 0, h - b);         // the plate inside it
      gr.addColorStop(0, "#5d6578"); gr.addColorStop(0.5, "#2b303d"); gr.addColorStop(1, "#12151c");
      x.fillStyle = gr; x.fillRect(b, b, w - b * 2, h - b * 2);
      x.fillStyle = "rgba(255,255,255,.28)"; x.fillRect(b, b, w - b * 2, 2);
      x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(b, h - b - 2, w - b * 2, 2);
      x.restore();
      rr(x, 1, 1, w - 2, h - 2, 6);
      x.strokeStyle = g.tint; x.lineWidth = 2; x.stroke();
      cx = w / 2; cy = h / 2; s = Math.round((h - b * 2) * 0.36);
      x.fillStyle = g.tint;
      x.beginPath();
      if (g.key === "a") { x.moveTo(cx, cy - s); x.lineTo(cx + s, cy); x.lineTo(cx, cy + s); x.lineTo(cx - s, cy); x.closePath(); }
      else x.arc(cx, cy, s * 0.85, 0, TAU);
      x.fill();
      x.fillStyle = g.deep;
      x.beginPath();
      if (g.key === "a") { s *= 0.45; x.moveTo(cx, cy - s); x.lineTo(cx + s, cy); x.lineTo(cx, cy + s); x.lineTo(cx - s, cy); x.closePath(); }
      else x.arc(cx, cy, s * 0.38, 0, TAU);
      x.fill();
      return cv;
    }

    /* THE PAINTED BRICK: the stage's design in one of the five colours. A cut
       carries a margin and the brick's own glow around it, so the opaque box
       (alpha above 200) is measured once and THAT is laid on the pane; the
       glow past it is clipped rather than spilled over the next cell. A tough
       pane wears a white double rim and shows its cracks once hit; a bonus
       pane carries its pictogram on a dark disc. Without the art — a build
       with no cuts, a decode that failed — the glass face is drawn instead. */
    function brickKey(tone) { return "brick" + COLORS[tone].key + (tex < 10 ? "0" : "") + tex; }
    function brickArt(tone) {
      var img = typeof ArtImages !== "undefined" ? ArtImages[brickKey(tone)] : null;
      return img && img.width ? img : null;
    }
    // A cut never changes once decoded, so its box is measured once per key
    // and the scratch canvas it was read off is freed straight away.
    function opaqueBox(img, key) {
      if (key && boxes[key]) return boxes[key];
      var w = img.width, h = img.height, cv = document.createElement("canvas"), x, d, box;
      var l = w, t = h, r = -1, b = -1, i, j;
      cv.width = w; cv.height = h; x = cv.getContext("2d"); x.drawImage(img, 0, 0);
      try { d = x.getImageData(0, 0, w, h).data; } catch (e) { d = null; }
      freeCanvas(cv);
      if (!d) return { x: 0, y: 0, w: w, h: h };
      for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
        if (d[(j * w + i) * 4 + 3] <= 200) continue;
        if (i < l) l = i; if (i > r) r = i; if (j < t) t = j; if (j > b) b = j;
      }
      box = r > l && b > t ? { x: l, y: t, w: r - l + 1, h: b - t + 1 } : { x: 0, y: 0, w: w, h: h };
      if (key) boxes[key] = box;
      return box;
    }
    function paintedFace(tone, bonus, tough, cracked, box) {
      var img = brickArt(tone);
      if (!img) return face(COLORS[tone], bonus, tough, cracked);
      var w = Math.round(BW), h = Math.round(BH), d = 2, sx = w / box.w, sy = h / box.h;
      var cv = document.createElement("canvas"), x = cv.getContext("2d"), cx = w / 2, cy = h / 2;
      cv.width = w * d; cv.height = h * d; x.setTransform(d, 0, 0, d, 0, 0);
      x.drawImage(img, -box.x * sx, -box.y * sy, img.width * sx, img.height * sy);
      if (tough) {
        rr(x, 2.5, 2.5, w - 5, h - 5, 6);
        x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 2.5; x.stroke();
        rr(x, 6.5, 6.5, w - 13, h - 13, 4);
        x.strokeStyle = "rgba(255,255,255,.55)"; x.lineWidth = 1.5; x.stroke();
      }
      if (cracked) {
        x.strokeStyle = "rgba(255,255,255,.95)"; x.lineWidth = 1.8;
        x.beginPath();
        x.moveTo(w * 0.42, 0); x.lineTo(w * 0.5, h * 0.42); x.lineTo(w * 0.36, h * 0.7); x.lineTo(w * 0.44, h);
        x.moveTo(w * 0.5, h * 0.42); x.lineTo(w * 0.72, h * 0.3); x.lineTo(w, h * 0.44);
        x.moveTo(w * 0.36, h * 0.7); x.lineTo(w * 0.14, h * 0.62);
        x.stroke();
      }
      if (bonus) {
        x.fillStyle = "rgba(6,8,18,.78)";
        x.beginPath(); x.arc(cx, cy, h * 0.36, 0, TAU); x.fill();
        x.strokeStyle = "rgba(255,255,255,.85)"; x.lineWidth = 2; x.stroke();
        Icon.draw(x, BONUS[bonus].icon, cx, cy, Math.round(h * 0.5), "#ffffff");
      }
      return cv;
    }

    /* THE BUTTON: the painted cut, dark or lit, laid round in the middle of
       its cell on the same canvas the fallback faces use (the cell plus GM
       all round). Its opaque box is measured like a brick's, so the button
       and not its margin fills the circle. A lit one gets a halo in its bank's
       colour, because lit is solid and solid is what the player reads. Null
       when the build carries no cut: the fog and the steel stand in. */
    function buttonKey(g, on) { return "button" + (on ? "On" : "Off") + "0" + g.art; }
    function buttonArt(g, on) {
      var img = typeof ArtImages !== "undefined" ? ArtImages[buttonKey(g, on)] : null;
      return img && img.width ? img : null;
    }
    function buttonFace(g, on) {
      var k = buttonKey(g, on), i, bx, S, cx, cy, sx, sy;
      var img = buttonArt(g, on);
      if (!img) return null;
      var w = Math.round(BW), h = Math.round(BH), d = 2;
      var cv = document.createElement("canvas"), x = cv.getContext("2d");
      cv.width = (w + GM * 2) * d; cv.height = (h + GM * 2) * d;
      x.setTransform(d, 0, 0, d, GM * d, GM * d);
      bx = opaqueBox(img, k); S = Math.min(w, h) + 6; cx = w / 2; cy = h / 2;
      if (on) for (i = 3; i >= 1; i--) {
        x.strokeStyle = rgba(g.tint, 0.1 * (4 - i)); x.lineWidth = 3;
        x.beginPath(); x.arc(cx, cy, S / 2 + i * 3, 0, TAU); x.stroke();
      }
      sx = S / bx.w; sy = S / bx.h;
      x.drawImage(img, cx - S / 2 - bx.x * sx, cy - S / 2 - bx.y * sy, img.width * sx, img.height * sy);
      return cv;
    }

    // Every canvas held anywhere inside a retired sprite set, freed.
    function freeSet(o) {
      var k;
      if (!o) return;
      if (o.getContext) { freeCanvas(o); return; }
      for (k in o) if (o.hasOwnProperty(k)) freeSet(o[k]);
    }
    function iconReady(key) {
      var img = typeof Images !== "undefined" ? Images[key] : null;
      return !!(img && img.complete && img.naturalWidth);
    }
    /* Two sets, each rebuilt only when its own inputs move:
         glass  the cell's size, the stage's brick design (`tex`), which of
                its five cuts are decoded and which bonus pictograms are —
                a replay of the level keeps it, the next level redraws it
         banks  the cell's size, the two banks' colours (the biome), and
                which button cuts are decoded — the fog's puffs are drawn at
                random, so a replay now keeps the same mist rather than a
                fresh one, which reads the same */
    function buildSprites() {
      var i, k, box, img, sig, plain, tough, cracked, charged;
      if (!sprites) sprites = { plain: [], tough: [], cracked: [], charged: [],
                                fog: [null, [], []], steel: [null], btnOn: [null], btnOff: [null] };
      sig = BW + "x" + BH + "|" + tex + "|";
      for (i = 0; i < COLORS.length; i++) sig += brickArt(i) ? "1" : "0";
      sig += "|";
      for (k in BONUS) if (BONUS.hasOwnProperty(k)) sig += iconReady(BONUS[k].icon) ? "1" : "0";
      if (sig !== glassSig) {
        glassSig = sig;
        freeSet([sprites.plain, sprites.tough, sprites.cracked, sprites.charged]);
        plain = []; tough = []; cracked = []; charged = [];
        for (i = 0; i < COLORS.length; i++) {
          img = brickArt(i);
          box = img ? opaqueBox(img, brickKey(i)) : null;
          plain.push(paintedFace(i, null, false, false, box));
          tough.push(paintedFace(i, null, true, false, box));
          cracked.push(paintedFace(i, null, true, true, box));
          charged.push({});
          for (k in BONUS) if (BONUS.hasOwnProperty(k)) charged[i][k] = paintedFace(i, k, false, false, box);
        }
        sprites.plain = plain; sprites.tough = tough; sprites.cracked = cracked; sprites.charged = charged;
      }
      sig = BW + "x" + BH + "|" + GHOST[1].art + "," + GHOST[2].art + "|" +
            (buttonArt(GHOST[1], true) ? 1 : 0) + (buttonArt(GHOST[2], true) ? 1 : 0) +
            (buttonArt(GHOST[1], false) ? 1 : 0) + (buttonArt(GHOST[2], false) ? 1 : 0);
      if (sig !== bankSig) {
        bankSig = sig;
        freeSet([sprites.fog, sprites.steel, sprites.btnOn, sprites.btnOff]);
        sprites.fog = [null, [fogFace(GHOST[1]), fogFace(GHOST[1]), fogFace(GHOST[1])],
                             [fogFace(GHOST[2]), fogFace(GHOST[2]), fogFace(GHOST[2])]];
        sprites.steel = [null, steelFace(GHOST[1]), steelFace(GHOST[2])];
        sprites.btnOn = [null, buttonFace(GHOST[1], true), buttonFace(GHOST[2], true)];
        sprites.btnOff = [null, buttonFace(GHOST[1], false), buttonFace(GHOST[2], false)];
      }
    }

    /* --- the board ---------------------------------------------------- */
    function cellAt(c, r) {
      if (c < 0 || c >= G.cols || r < 0 || r >= G.rows) return null;
      return cells[r * G.cols + c];
    }
    // Which blueprint: the level IS the blueprint on the web build; the
    // playable draws one of the first biome's two mixes, the endless run any.
    function pickPlan() {
      var n = BLUEPRINTS.length, lv = C.level | 0, i;
      i = lv > 0 ? Math.min(n, lv) - 1 : C.web && C.web.levels ? Rand.int(0, n - 1) : Rand.int(4, 5);
      biome = Math.floor(i / 6);
      stage = i % 6; recipe = STAGES[stage];
      dressBanks();
      tex = i < 23 ? i + 1 : 7 + (i - 23) * 2; // 24-30 wear 7, 9, … 19 again
      plan = BLUEPRINTS[i];
    }
    function buildBoard() {
      var flip = Rand.chance(0.5), r, c, ch, k;
      G.rows = plan.rows.length;
      cells = new Array(G.cols * G.rows); bricks = []; groups = 1;
      total = 0; broken = 0;
      for (r = 0; r < G.rows; r++) {
        for (c = 0; c < G.cols; c++) {
          ch = plan.rows[r].charAt(flip ? G.cols - 1 - c : c);
          if (ch === "o" || ch === "O" || SYM[ch]) {
            k = { c: c, r: r, ghost: false, group: 0, hp: ch === "O" ? 2 : 1, tough: ch === "O",
                  tone: 0, bonus: null, slot: !!SYM[ch], alive: true, flash: 0, fly: null,
                  kind: null, grow: 1 };
            total++;
          } else if (ch === "a" || ch === "b") {
            k = { c: c, r: r, ghost: true, group: ch === "a" ? 1 : 2, hp: 0,
                  alive: true, flash: 0, pulse: 0, v: (c * 7 + r * 3) % 3,
                  ph: Rand.range(0, TAU), fly: null };
            if (ch === "b") groups = 2;
          } else continue;
          cells[r * G.cols + c] = k; bricks.push(k);
        }
      }
      paintColours();
      placeBonus();
      placeLife();
    }
    /* The colours are dealt by HEIGHT: the glass is ranked top first (the
       centre of a row before its ends) and cut into five equal shares, from
       the rainbow down to the red. Every board shows all five, and the dear
       glass is the glass up where a pocket has to be shut to reach it. A
       one-colour stage paints it all in the biome's own. */
    function paintColours() {
      var glass = [], i, mid = (G.cols - 1) / 2;
      for (i = 0; i < bricks.length; i++) if (!bricks[i].ghost) glass.push(bricks[i]);
      if (recipe.mono) { for (i = 0; i < glass.length; i++) glass[i].tone = BIOMES[biome].tone; return; }
      glass.sort(function (a, b) { return a.r - b.r || Math.abs(a.c - mid) - Math.abs(b.c - mid) || a.c - b.c; });
      for (i = 0; i < glass.length; i++)
        glass[i].tone = COLORS.length - 1 - Math.floor(i * COLORS.length / glass.length);
    }
    /* The stage's bonus panes. The blueprint's letters are the slots it drew
       for them, taken first; past those, plain glass with a free cell beside
       it takes the rest, so every one has a face the ball can reach. What
       goes in them is the stage's: the biome's first power only, or all of
       them in turn — and on the finale, one of the biome before it. */
    function stagePowers() {
      var own = BIOMES[biome].powers, out = [], i, n = recipe.bonus;
      if (!n) return out;
      if (recipe.recap && biome > 0) { out.push(BIOMES[biome - 1].powers[0]); n--; }
      for (i = 0; i < n; i++) out.push(recipe.powers === 1 ? own[0] : own[i % own.length]);
      return out;
    }
    function placeBonus() {
      var want = stagePowers(), slots = [], spare = [], i, k, pick;
      for (i = 0; i < bricks.length; i++) {
        k = bricks[i];
        if (k.ghost) continue;
        if (k.slot) slots.push({ k: k, o: Math.random() });
        else if (!k.tough && freeAround(k.c, k.r, 1).length) spare.push({ k: k, o: Math.random() });
      }
      slots.sort(function (a, b) { return a.o - b.o; });
      spare.sort(function (a, b) { return a.o - b.o; });
      for (i = 0; i < want.length; i++) {
        pick = slots.length ? slots.shift() : spare.shift();
        if (!pick) break;
        pick.k.bonus = want[i];
      }
    }
    // The living glass this stage places: the biome's, and on the finale half
    // of the biome before it again.
    function stageLife() {
      var out = {}, own = BIOMES[biome].live, prev = biome > 0 ? BIOMES[biome - 1].live : null, k;
      if (!recipe.live) return out;
      for (k in own) if (own.hasOwnProperty(k)) out[k] = own[k];
      if (recipe.recap && prev)
        for (k in prev) if (prev.hasOwnProperty(k)) out[k] = (out[k] || 0) + Math.ceil(prev[k] / 2);
      return out;
    }
    function makeBubbles() {
      var i;
      bubbles = [];
      for (i = 0; i < 14; i++)
        bubbles.push({ x: Rand.range(field.left + 16, field.right - 16),
                       r: Rand.range(3, 7), s: Rand.range(0.22, 0.55), o: Rand.range(0, 1) });
    }

    /* --- the living glass ----------------------------------------------
       A cell is free when nothing alive stands in it — glass, a switch of either
       state, a pane a magnet is carrying — and no ball overlaps it, with a
       little air to spare: a pane never appears on top of a ball. */
    function freeCell(c, r) {
      var k, i, b, x, y, dx, dy, m;
      if (c < 0 || c >= G.cols || r < 0 || r >= G.rows) return false;
      k = cells[r * G.cols + c];
      if (k && k.alive) return false;
      x = G.x0 + c * G.cw + C.pad; y = G.y0 + r * G.ch + C.pad;
      for (i = 0; i < balls.length; i++) {
        b = balls[i]; if (!b.alive) continue;
        m = b.r + 8;
        dx = b.x - clamp(b.x, x, x + BW); dy = b.y - clamp(b.y, y, y + BH);
        if (dx * dx + dy * dy < m * m) return false;
      }
      return true;
    }
    // The free cells around (c, r), up to `reach` cells each way, itself left out.
    function freeAround(c, r, reach) {
      var out = [], dc, dr;
      for (dr = -reach; dr <= reach; dr++) for (dc = -reach; dc <= reach; dc++)
        if ((dc || dr) && freeCell(c + dc, r + dr)) out.push({ c: c + dc, r: r + dr });
      return out;
    }
    // A new pane, growing into its cell. It counts in the board like any other.
    function addGlass(c, r, tone, kind) {
      var k = { c: c, r: r, ghost: false, group: 0, hp: 1, tough: false, tone: tone, bonus: null,
                alive: true, flash: 0, fly: null, kind: kind || null, grow: 0 };
      cells[r * G.cols + c] = k; bricks.push(k);
      total++; lifeDirty = true;
      return k;
    }
    function shieldOn(k) {
      return k.kind === K_SHIELD && k.alive && (clock + k.ph) % (C.shieldUp + C.shieldDown) < C.shieldUp;
    }
    // The board is done once every pane is broken and no split pane is still
    // about to burst into more of them.
    function boardDone() { return broken >= total && !shards.length; }

    /* The biome's living glass goes onto the board once the colours are
       dealt. A turned pane is a plain one (no bonus, not tough) with a free
       cell beside it, so it has a face the ball can reach and room to act;
       the seed takes the one with the most room around it. The warp panes
       are ADDED, in free cells, and they are rainbow: the dearest glass on
       the board is the glass that will not keep still. Each kind is spread
       over its own beat, so two of them never jump or light up as one. */
    function placeLife() {
      var want = stageLife(), pool = [], free = [], i, j, k, n, t, room, cnt;
      for (i = 0; i < bricks.length; i++) {
        k = bricks[i];
        if (k.ghost || k.bonus || k.tough) continue;
        room = freeAround(k.c, k.r, 1).length;
        if (room) pool.push({ k: k, room: room, o: Math.random() });
      }
      pool.sort(function (a, b) { return a.o - b.o; });            // shuffled
      for (n = 0; n < (want[K_SEED] || 0) && pool.length; n++) {
        for (j = 0, i = 1; i < pool.length; i++) if (pool[i].room > pool[j].room) j = i;
        k = pool.splice(j, 1)[0].k;
        k.kind = K_SEED; k.hp = C.seedHp; k.tough = C.seedHp > 1; k.seedT = C.seedEvery;
      }
      for (n = 0; n < (want[K_SPLIT] || 0) && pool.length; n++) pool.shift().k.kind = K_SPLIT;
      cnt = want[K_SHIELD] || 0;
      for (n = 0; n < cnt && pool.length; n++) {
        k = pool.shift().k;
        k.kind = K_SHIELD; k.shOn = null;
        k.ph = (C.shieldUp + C.shieldDown) * n / cnt;
      }
      for (j = 0; j < G.rows - 1; j++) for (i = 0; i < G.cols; i++) if (freeCell(i, j)) free.push({ c: i, r: j });
      cnt = want[K_WARP] || 0;
      for (n = 0; n < cnt && free.length; n++) {
        t = free.splice(Rand.int(0, free.length - 1), 1)[0];
        k = addGlass(t.c, t.r, COLORS.length - 1, K_WARP);
        k.grow = 1; k.warpT = C.warpEvery * (1 + n / cnt);
      }
    }

    /* Once a frame, while the board is in play: the shards of a split pane
       take their cells, the warp panes jump, the seeds grow, the shields come
       up and drop and every new pane grows into its own cell. Anything that
       moved while the player is aiming re-solves the sight, which must never
       show a board that is not there. */
    function life(dt) {
      var i, k, was;
      for (i = shards.length - 1; i >= 0; i--) {
        shards[i].t -= dt;
        if (shards[i].t <= 0) burst(shards.splice(i, 1)[0]);
      }
      for (i = 0; i < bricks.length; i++) {
        k = bricks[i];
        if (!k.alive) continue;
        if (k.grow < 1) k.grow = Math.min(1, k.grow + dt / 0.22);
        if (!k.kind || k.fly) continue;
        if (k.kind === K_WARP) {
          k.warpT -= dt;
          if (k.warpT <= 0) { k.warpT += C.warpEvery; warp(k); }
        } else if (k.kind === K_SEED) {
          k.seedT -= dt;
          if (k.seedT <= 0) { k.seedT += C.seedEvery; sprout(k); }
        } else if (k.kind === K_SHIELD) {
          was = k.shOn; k.shOn = shieldOn(k);
          if (was !== k.shOn) {
            lifeDirty = true;
            if (k.shOn && was !== null)
              Fx.ring(brickX(k) + BW / 2, brickY(k) + BH / 2, { from: 40, to: 10, color: SHOCK, width: 3, life: 0.2 });
          }
        }
      }
      if (boardDone()) { clearBoard(); return; }
      if (lifeDirty) {
        lifeDirty = false;
        refreshHUD();
        if (phase === "aim") traceShot();
      }
    }
    // A warp pane leaves its cell for a free one nearby, and grows back in there.
    function warp(k) {
      var to = freeAround(k.c, k.r, C.warpReach), t, x0, y0;
      if (!to.length) return;
      t = to[Rand.int(0, to.length - 1)];
      x0 = brickX(k) + BW / 2; y0 = brickY(k) + BH / 2;
      cells[k.r * G.cols + k.c] = null;
      k.c = t.c; k.r = t.r; cells[t.r * G.cols + t.c] = k;
      k.grow = 0; lifeDirty = true;
      Fx.burst(x0, y0, { color: RAINBOW, count: 8, speed: 180, life: 0.3 });
      Fx.ring(brickX(k) + BW / 2, brickY(k) + BH / 2, { from: 6, to: 42, color: "#ffffff", width: 3, life: 0.22 });
    }
    // A seed grows one pane of plain glass: the biome's own on a one-colour
    // stage, any colour but the rainbow otherwise.
    function sprout(k) {
      var to = freeAround(k.c, k.r, 1), t, n;
      if (!to.length) return;
      t = to[Rand.int(0, to.length - 1)];
      n = addGlass(t.c, t.r, recipe.mono ? BIOMES[biome].tone : Rand.int(0, COLORS.length - 2));
      k.flash = 0.4;
      Fx.ring(brickX(n) + BW / 2, brickY(n) + BH / 2, { from: 4, to: 34, color: SEED, width: 3, life: 0.24 });
    }
    // A split pane was broken a beat ago: its shards take every free cell around it.
    function burst(s) {
      var to = freeAround(s.c, s.r, 1), i, n;
      for (i = 0; i < to.length; i++) {
        n = addGlass(to[i].c, to[i].r, s.tone);
        Fx.burst(brickX(n) + BW / 2, brickY(n) + BH / 2, { color: ["#05060c", COLORS[s.tone].light], count: 4, speed: 140, life: 0.24 });
      }
    }
    // The shield is up: the pane rings like steel, and nothing breaks.
    function shieldHit(k, b) {
      k.flash = 0.6; b.idle = 0;
      if (clock - lastWall > 0.05) {
        Sound.clip("steel", 0.45, 1.45);
        lastWall = clock;
      }
      Fx.burst(b.x, b.y, { color: [SHOCK, "#ffffff"], count: 7, speed: 240, life: 0.24 });
      Fx.ring(brickX(k) + BW / 2, brickY(k) + BH / 2, { from: 8, to: 44, color: SHOCK, width: 3, life: 0.2 });
    }
    /* The stage that brings something new names it, once per player
       (Notify.learn, packages/shell/shell.js) — only what the board cannot
       show: the first board of two banks that a tap swaps them, and the
       living glass whose rule is hidden (split, seed, shield). A power, a
       colour's price and the warp pane read at a glance once met, and the
       last biome's mix is four kinds already named. Each id is a page of
       the guide, which the notice's line in the log opens. */
    function tellStage() {
      var own = BIOMES[biome].live, n = 0, i, one = null, say;
      if (groups > 1) Notify.learn("banks", "Two button colours", { sub: "A tap swaps the button colours", icon: "unlock" });
      if (!recipe.live) return;
      for (i = 0; i < LIVE_ORDER.length; i++) if (own[LIVE_ORDER[i]]) { n++; one = LIVE_ORDER[i]; }
      if (n !== 1) return;
      say = LIVE[one];
      if (say.sub) Notify.learn(one, say.word, { sub: say.sub, icon: say.icon });
    }

    /* --- the switches -------------------------------------------------- */
    function isSolid(k) { return k.ghost && k.group === solidG; }
    // One bank: dark <-> lit. Two banks: A <-> B (a first tap from none gives A).
    function nextSolid() {
      if (groups === 1) return solidG ? 0 : 1;
      return solidG === 1 ? 2 : 1;
    }
    function overlapsBrick(b, k) {
      var bx = brickX(k), by = brickY(k);
      var dx = b.x - clamp(b.x, bx, bx + BW), dy = b.y - clamp(b.y, by, by + BH);
      return dx * dx + dy * dy < b.r * b.r;
    }
    /* THE TAP. Every button of the bank that lights up flashes as it
       condenses; one the ball is already inside stays passable for THAT ball
       until it has left it, or a brick materialising around a ball would spit
       it out sideways. `auto` is the game letting a ball out of an empty
       pocket, which sounds a little lower than the player's own tap. */
    function toggleMist(auto) {
      var i, j, k, b;
      solidG = nextSolid();
      releaseT = -1;
      for (i = 0; i < bricks.length; i++) {
        k = bricks[i];
        if (k.ghost) k.pulse = isSolid(k) ? 1 : 0.3;
      }
      for (j = 0; j < balls.length; j++) {
        b = balls[j]; b.pass = [];
        for (i = 0; i < bricks.length; i++) {
          k = bricks[i];
          if (isSolid(k) && overlapsBrick(b, k)) b.pass.push(k);
        }
        if (b.alive) Fx.ring(b.x, b.y, { from: 10, to: 46, color: solidG ? GHOST[solidG].tint : "#ffffff",
                                         width: 3, life: 0.22 });
      }
      if (clock - lastSwap > 0.07) {
        if (auto) Sound.clip("swap", 0.55, 0.85);
        else Sound.clip("swap", 0.55, Rand.range(0.98, 1.06));
        lastSwap = clock;
      }
    }
    function prunePass(b) {
      if (!b.pass.length) return;
      for (var i = b.pass.length - 1; i >= 0; i--) if (!overlapsBrick(b, b.pass[i])) b.pass.splice(i, 1);
    }

    /* --- the pocket ----------------------------------------------------
       A flood fill from the ball's cell over every cell it can cross (empty,
       broken, or a dark switch), 4-connected: two bricks touching at a corner leave no
       gap a ball fits through. Reaching the bottom row of the grid means the
       open air under it, and the lava: the ball is free. Otherwise the cells
       reached ARE the pocket, and they are returned. */
    function cellOpen(c, r) {
      var k = cells[r * G.cols + c];
      return !k || !k.alive || k.fly || (k.ghost && !isSolid(k));
    }
    function pocketOf(b) {
      var r = Math.floor((b.y - G.y0) / G.ch), c, start, seen, zone, stack, q, rr0, cc, i, nr, nc, nq;
      if (r >= G.rows) return null;
      c = clamp(Math.floor((b.x - G.x0) / G.cw), 0, G.cols - 1);
      r = Math.max(0, r);
      start = r * G.cols + c; seen = {}; zone = [start]; stack = [start];
      seen[start] = true;
      while (stack.length) {
        q = stack.pop(); rr0 = Math.floor(q / G.cols); cc = q % G.cols;
        if (rr0 === G.rows - 1) return null;
        for (i = 0; i < 4; i++) {
          nr = rr0 + (i === 0 ? -1 : i === 1 ? 1 : 0);
          nc = cc + (i === 2 ? -1 : i === 3 ? 1 : 0);
          nq = nr * G.cols + nc;
          if (nr < 0 || nc < 0 || nc >= G.cols || seen[nq] || !cellOpen(nc, nr)) continue;
          seen[nq] = true; zone.push(nq); stack.push(nq);
        }
      }
      return zone;
    }
    // Is there glass the ball can still reach from its pocket? The glass is
    // the pocket's own walls, so it is the cells around it — diagonals
    // included, since a ball clips a corner.
    function pocketHasGlass(zone) {
      var i, r, c, dr, dc, k;
      for (i = 0; i < zone.length; i++) {
        r = Math.floor(zone[i] / G.cols); c = zone[i] % G.cols;
        for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) {
          k = cellAt(c + dc, r + dr);
          if (k && k.alive && !k.ghost && !k.fly) return true;
        }
      }
      return false;
    }
    /* The pocket is empty and the game is about to let the ball out: every
       brick the ball broke in there is paid once more. */
    function pocketCleared() {
      var i, n = 0, bonus, b;
      for (i = 0; i < balls.length; i++) { b = balls[i]; if (b.zone) { n += b.inPocket; b.inPocket = 0; } }
      if (!n) return;
      bonus = C.pocketBonus * n;
      score += bonus; HUD.setScore(score);
      Sound.clip("gold", 0.4, 1.8);
      Pop.show("bonus", { word: "Pocket cleared", sub: "+" + bonus, at: popAt() });
    }

    /* Every comic callout lands in the same band — the strip between the
       turret and the CTA bar — so a big word never covers the bricks the
       player is busy reading. */
    function popAt() {
      return { x: Layout.cx, y: field.floor + (Layout.bottom - field.floor) * 0.45 };
    }
    function brickX(k) { return G.x0 + k.c * G.cw + C.pad; }
    function brickY(k) { return G.y0 + k.r * G.ch + C.pad; }

    /* --- the electric fence --------------------------------------------
       The play area carries no painted frame: the three walls only exist at
       the instant a ball strikes one. Every contact drops a `zap` on that
       side, which lights it as a crackling line — white-hot at the impact,
       dying out toward the two corners — and fades in a few tenths of a
       second. The physics box never changes; the arcs are only what the
       player is shown of it. Same fence as games/spinshock. */
    var SIDE_L = 0, SIDE_R = 1, SIDE_T = 2;
    var ZAP_SEGS = 24;              // vertices of one lightning polyline
    var ZAP_MERGE = 90;             // px within which a hit re-lights the old arc
    // A wide dim halo down to a white-hot core: shadowBlur is banned in frame.
    var ZAP_PASSES = [[20, 0.10], [11, 0.22], [5, 0.5], [2.2, 1]];

    function zapSpan(side) { return side === SIDE_T ? field.right - field.left : field.floor - field.top; }
    function zapBase(side) { return side === SIDE_T ? field.left : field.top; }
    function zapEdge(side) {
      return side === SIDE_L ? field.left : side === SIDE_R ? field.right : field.top;
    }
    function zapRoll(z) {
      z.seg.length = 0;
      for (var i = 0; i <= ZAP_SEGS; i++) z.seg.push(Rand.range(-1, 1));
      z.seg[0] = 0; z.seg[ZAP_SEGS] = 0;         // pinned to the two corners
    }
    function zap(side, x, y, power, col) {
      var len = zapSpan(side);
      var p = clamp(((side === SIDE_T ? x - field.left : y - field.top)) / len, 0, 1);
      var i, z;
      for (i = 0; i < zaps.length; i++) {        // re-light, never stack
        z = zaps[i];
        if (z.side === side && Math.abs(z.p - p) * len < ZAP_MERGE) {
          z.t = 0; z.p = p; z.col = col; z.power = Math.max(z.power, power);
          zapRoll(z);
          return;
        }
      }
      z = { side: side, p: p, t: 0, life: 0.3 + 0.34 * power, power: power,
            col: col, crackle: 0, seg: [] };
      zapRoll(z);
      zaps.push(z);
    }
    // The round opens with the fence powering up once, so the player is told
    // where the walls are before the first ball ever reaches one.
    function zapAll(power) {
      zap(SIDE_T, (field.left + field.right) / 2, field.top, power, "#7ef9ff");
      zap(SIDE_L, field.left, (field.top + field.floor) / 2, power, "#7ef9ff");
      zap(SIDE_R, field.right, (field.top + field.floor) / 2, power, "#7ef9ff");
    }
    function updateZaps(dt) {
      for (var i = zaps.length - 1; i >= 0; i--) {
        var z = zaps[i];
        z.t += dt;
        if (z.t >= z.life) { zaps.splice(i, 1); continue; }
        z.crackle -= dt;                         // only the young arc crackles
        if (z.crackle <= 0 && z.t < z.life * 0.55) { zapRoll(z); z.crackle = 0.045; }
      }
    }
    // createLinearGradient only accepts offsets inside 0..1, and an impact
    // near a corner pushes the lit window past both ends.
    function addStop(g, at, col) { if (at > 0 && at < 1) g.addColorStop(at, col); }

    function drawZap(z) {
      var k = clamp(1 - z.t / z.life, 0, 1);     // 1 on impact, 0 once gone
      var flash = Math.pow(k, 0.55);
      var horiz = z.side === SIDE_T;
      var len = zapSpan(z.side), base = zapBase(z.side), edge = zapEdge(z.side);
      var w = (0.08 + 0.14 * z.power) * (0.85 + 0.4 * (1 - k));
      var amp = (6 + 15 * z.power) * (0.3 + 0.7 * k);
      var inward = z.side === SIDE_R ? -1 : 1;   // the arc bows into the field
      var i, q, u, d, o, x, y, g, a, col;

      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (q = 0; q < ZAP_PASSES.length; q++) {
        a = ZAP_PASSES[q][1] * flash;
        col = q === ZAP_PASSES.length - 1 ? "#ffffff" : z.col;
        g = horiz ? ctx.createLinearGradient(base, 0, base + len, 0)
                  : ctx.createLinearGradient(0, base, 0, base + len);
        g.addColorStop(0, rgba(col, 0));         // dark past the lit window
        addStop(g, z.p - w * 1.8, rgba(col, 0));
        addStop(g, z.p - w, rgba(col, a * 0.2));
        addStop(g, z.p, rgba(col, a));
        addStop(g, z.p + w, rgba(col, a * 0.2));
        addStop(g, z.p + w * 1.8, rgba(col, 0));
        g.addColorStop(1, rgba(col, 0));
        ctx.strokeStyle = g;
        ctx.lineWidth = ZAP_PASSES[q][0] * (0.35 + 0.65 * k);
        ctx.beginPath();
        for (i = 0; i <= ZAP_SEGS; i++) {
          u = i / ZAP_SEGS;
          d = base + u * len;
          o = z.seg[i] * amp * Math.max(0, 1 - Math.abs(u - z.p) / (w * 1.4));
          if (o * inward < 0) o *= 0.35;         // barely any overshoot outward
          x = horiz ? d : edge + o;
          y = horiz ? edge + o : d;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      var px = horiz ? base + z.p * len : edge;  // the contact node itself
      var py = horiz ? edge : base + z.p * len;
      ctx.globalAlpha = flash;
      ctx.fillStyle = rgba(z.col, 0.5);
      ctx.beginPath(); ctx.arc(px, py, 4 + 20 * z.power * k, 0, TAU); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(px, py, 2 + 7 * z.power * k, 0, TAU); ctx.fill();
      ctx.restore();
    }
    function drawZaps() { for (var i = 0; i < zaps.length; i++) drawZap(zaps[i]); }

    /* --- collision, shared by the ball and by the sight ----------------
       Circle against the cell grid: the deepest overlap wins and the contact
       normal is written into HIT, so a corner deflects the shot instead of
       mirroring it like a face. A switch is only a wall while it is lit, and a
       lit switch a ball is still inside (`b.pass`) lets that ball out. The
       preview calls the very same code, which is what keeps the sight honest. */
    var HIT = { k: null, ux: 0, uy: 0, d: 0 };
    function probe(x, y, R, skip, b) {
      var c, r, k, bx, by, dx, dy, d2, ox, oy, d;
      var best = null, bestD = 1e9, bnx = 0, bny = 0, bbx = 0, bby = 0;
      var c0 = Math.floor((x - R - G.x0) / G.cw), c1 = Math.floor((x + R - G.x0) / G.cw);
      var r0 = Math.floor((y - R - G.y0) / G.ch), r1 = Math.floor((y + R - G.y0) / G.ch);
      for (r = r0; r <= r1; r++) for (c = c0; c <= c1; c++) {
        k = cellAt(c, r);
        if (!k || !k.alive || k.fly || (skip && skip[r * G.cols + c])) continue;
        if (k.ghost && (!isSolid(k) || (b && b.pass.indexOf(k) >= 0))) continue;
        bx = G.x0 + c * G.cw + C.pad; by = G.y0 + r * G.ch + C.pad;
        dx = x - clamp(x, bx, bx + BW); dy = y - clamp(y, by, by + BH);
        d2 = dx * dx + dy * dy;
        if (d2 > R * R || d2 >= bestD) continue;
        best = k; bestD = d2; bnx = dx; bny = dy; bbx = bx; bby = by;
      }
      HIT.k = best;
      if (!best) return null;
      d = Math.sqrt(bestD);
      if (d > 0.0001) { HIT.ux = bnx / d; HIT.uy = bny / d; }
      else {                                       // dead centre: shortest way out
        ox = x - (bbx + BW / 2); oy = y - (bby + BH / 2);
        if (Math.abs(ox) / BW > Math.abs(oy) / BH) { HIT.ux = ox < 0 ? -1 : 1; HIT.uy = 0; }
        else { HIT.ux = 0; HIT.uy = oy < 0 ? -1 : 1; }
      }
      HIT.d = d;
      return best;
    }

    /* A ball that settles into a flat rally never comes down. The floor on
       its vertical speed is applied at constant speed and WITHOUT any random
       nudge: every bounce is reproducible, or the sight would be lying. */
    function settle(o) {
      var sp = Math.sqrt(o.vx * o.vx + o.vy * o.vy) || 1, m = sp * C.minVyRatio;
      if (Math.abs(o.vy) >= m) return;
      o.vy = (o.vy < 0 ? -1 : 1) * m;
      o.vx = (o.vx < 0 ? -1 : 1) * Math.sqrt(Math.max(0, sp * sp - m * m));
    }
    function reflect(o, ux, uy) {
      var vn = o.vx * ux + o.vy * uy;
      if (vn < 0) { o.vx -= 2 * vn * ux; o.vy -= 2 * vn * uy; }
      settle(o);
    }
    // Back onto the speed the ball is owed: the base speed times its pocket boost.
    function resetSpeed(b) {
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1, want = C.ballSpeed * b.k;
      b.vx *= want / sp; b.vy *= want / sp;
      settle(b);
    }

    /* --- aiming ------------------------------------------------------- */
    function aimAt(p) {
      var dx = p.x - cannon.x, dy = p.y - cannon.y;
      if (dy > -40) dy = -40;                      // never aim into the lava
      var lim = C.minAimDeg * Math.PI / 180;
      aimA = clamp(Math.atan2(dy, dx), -Math.PI + lim, -lim);
      traceShot();
    }
    /* The sight solves the next five bounces — walls, glass and lit switches —
       for the ball ABOUT TO BE FIRED, with the switches as they stand at launch. A pane
       of glass is taken out of the way once the preview has broken it (a
       tough one after its second hit). */
    function traceShot() {
      var R = C.ballR, step = 7, n = 0, bounces = 0, skip = {}, hits = {}, k, push, key;
      var o = { x: cannon.x + Math.cos(aimA) * C.muzzle,
                y: cannon.y + Math.sin(aimA) * C.muzzle,
                vx: Math.cos(aimA), vy: Math.sin(aimA) };
      trace = [o.x, o.y]; traceHits = []; traceMarks = [];
      while (n++ < 2400 && bounces < C.traceBounces) {
        o.x += o.vx * step; o.y += o.vy * step;
        push = false;
        if (o.x - R < field.left)       { o.x = field.left + R;  reflect(o,  1, 0); push = true; }
        else if (o.x + R > field.right) { o.x = field.right - R; reflect(o, -1, 0); push = true; }
        if (o.y - R < field.top)        { o.y = field.top + R;   reflect(o, 0,  1); push = true; }
        if (push) { bounces++; traceMarks.push({ x: o.x, y: o.y, steel: false }); }
        trace.push(o.x, o.y);
        if (o.y + R >= field.floor) break;         // the lava, and the shot is over
        k = probe(o.x, o.y, R, skip, null);
        if (!k) continue;
        o.x += HIT.ux * (R - HIT.d + 0.5); o.y += HIT.uy * (R - HIT.d + 0.5);
        reflect(o, HIT.ux, HIT.uy);
        bounces++; traceMarks.push({ x: o.x, y: o.y, steel: k.ghost, shock: shieldOn(k) });
        if (!k.ghost && !shieldOn(k)) {
          key = k.r * G.cols + k.c;
          hits[key] = (hits[key] || 0) + 1;
          if (hits[key] >= k.hp) { traceHits.push(k); skip[key] = 1; }
        }
      }
    }

    /* --- the magazine -------------------------------------------------- */
    function ballsLeft() { return queue + balls.length; }
    // The right pill is the wall broken so far, which is what the stars read.
    function wallShare() { return total ? broken / total : 0; }
    function refreshHUD() {
      HUD.setLeft(ballsLeft(), "Balls");
      HUD.setRight(Math.floor(wallShare() * 100) + "%", "Wall");
    }

    /* --- the shot ----------------------------------------------------- */
    function spawn(x, y, a) {
      balls.push({ x: x, y: y, vx: Math.cos(a) * C.ballSpeed, vy: Math.sin(a) * C.ballSpeed,
                   alive: true, k: 1, free: 0, pulling: false, pass: [], zone: null, inPocket: 0, idle: 0,
                   r: C.ballR, rT: C.ballR, fire: 0, mag: 0, magT: 0 });
    }
    function fire() {
      var mx = cannon.x + Math.cos(aimA) * C.muzzle;
      var my = cannon.y + Math.sin(aimA) * C.muzzle;
      queue--;
      spawn(mx, my, aimA);
      fired++;
      phase = "flight"; flightT = 0; pulled = false; recoil = 1;
      chain = 0; releaseT = -1;                    // a new shot, a new combo
      refreshHUD();
      // The shot past par: a clear is now worth two stars. The level layer
      // says it, striking the third star (levelFaults).
      Sound.clip("shoot", 0.7, 0.7);
      Fx.shake(10, 0.22);
      Fx.burst(mx, my, { color: [BALL.glow, "#ffffff"], count: 14, speed: 400,
                         life: 0.32, angle: aimA, spread: 1.1 });
      Fx.ring(mx, my, { from: 10, to: 84, color: BALL.glow, width: 6, life: 0.28 });
    }
    function tone(b) { return b.k > 1.05 ? HOT : BALL; }

    function wallHit(b, side, v) {
      var p = tone(b);
      if (clock - lastWall > 0.05) {
        if (b.zone) Sound.clip("wall", 0.25, 1.14);
        else Sound.clip("wall", 0.25, 0.95);
        lastWall = clock;
      }
      zap(side, b.x, b.y, clamp(v / C.ballSpeed, 0.3, 1), p.glow);
      Fx.burst(b.x, b.y, { color: [p.light, p.glow], count: 5, speed: 170, life: 0.24 });
      Fx.ring(b.x, b.y, { from: 3, to: 40, color: p.glow, width: 4, life: 0.26 });
    }

    /* The lava is the only thing that can take a ball, and it takes it for
       good: no bumper, no second chance, that is what makes an angle worth
       thinking about. */
    function burnBall(b) {
      b.alive = false;
      Sound.clip("burn", 0.5, );
      Fx.burst(b.x, field.floor - 4, { color: ["#fff0b8", "#ffb44f", "#ff4400"],
                                       count: 18, speed: 320, life: 0.55,
                                       angle: -Math.PI / 2, spread: 1.9, grav: 780 });
      Fx.ring(b.x, field.floor, { from: 8, to: 78, color: "#ff8a1a", width: 7, life: 0.38 });
      Fx.shake(7, 0.2);
    }

    // Between two shots the player revises: the switches go back to the way the
    // blueprint opens, the sight is solved again and nothing fires until the
    // next release.
    function shotEnd() {
      if (cleared) return;
      if (boardDone()) { clearBoard(); return; }
      solidG = plan.start; releaseT = -1;
      if (queue > 0) {
        phase = "aim"; aiming = false; idleT = 0; traceShot();
        if (queue === 1) Pop.show("alert", { word: "Last ball", at: popAt() });
      } else {
        phase = "over"; endT = 0;
      }
    }

    function stepBall(b, h) {
      var R = b.r, k;
      stepping = b;
      if (b.pulling) b.vy += C.pull * h;
      b.x += b.vx * h; b.y += b.vy * h;
      if (b.x - R < field.left)       { b.x = field.left + R;  wallHit(b, SIDE_L, Math.abs(b.vx)); reflect(b,  1, 0); }
      else if (b.x + R > field.right) { b.x = field.right - R; wallHit(b, SIDE_R, Math.abs(b.vx)); reflect(b, -1, 0); }
      if (b.y - R < field.top)        { b.y = field.top + R;   wallHit(b, SIDE_T, Math.abs(b.vy)); reflect(b, 0,  1); }
      if (b.y + R >= field.floor) { burnBall(b); return; }
      prunePass(b);
      k = probe(b.x, b.y, R, null, b);
      if (!k) return;
      // A fireball does not bounce off glass: it goes through it and melts it.
      // A raised shield is steel, and throws it back like steel.
      if (b.fire > 0 && !k.ghost && !shieldOn(k)) { k.hp = 1; smash(k, b, 0); return; }
      b.x += HIT.ux * (R - HIT.d + 0.5); b.y += HIT.uy * (R - HIT.d + 0.5);
      reflect(b, HIT.ux, HIT.uy);
      if (k.ghost) clang(k, b);
      else if (shieldOn(k)) shieldHit(k, b);
      else if (k.hp > 1) crack(k, b);
      else smash(k, b, 0);
    }

    /* Steel does not break and does not pay: it rings, sparks in its bank's
       colour and throws the ball back. That is the whole point of it. */
    function clang(k, b) {
      var cx = brickX(k) + BW / 2, cy = brickY(k) + BH / 2, g = GHOST[k.group];
      k.flash = 0.6;
      if (clock - lastWall > 0.05) {
        if (k.group === 1) Sound.clip("steel", 0.45, 0.9);
        else Sound.clip("steel", 0.45, 1.15);
        lastWall = clock;
      }
      Fx.burst(b.x, b.y, { color: [g.light, g.tint], count: 5, speed: 190, life: 0.24 });
      Fx.ring(cx, cy, { from: 6, to: 36, color: g.tint, width: 3, life: 0.2 });
    }
    // A tough pane takes one hit before it breaks: it cracks, and that is all.
    function crack(k, b) {
      var cx = brickX(k) + BW / 2, cy = brickY(k) + BH / 2, p = COLORS[k.tone];
      k.hp--; k.flash = 0.7; b.idle = 0;
      Sound.clip("brick", 0.32, 1.4);
      Fx.burst(cx, cy, { color: [p.light, "#ffffff"], count: 6, speed: 200, life: 0.3 });
    }

    /* --- scoring ------------------------------------------------------
       THE COMBO is the shot's, and nothing but a new shot ends it: every pane
       broken since the release counts, whoever broke it — the ball, a power,
       the balls a multiball split it into. It used to die after 1.6 s without
       a break, which a ball crossing the open field between two panes does
       all the time, so it only ever grew inside a pocket and paid x20 there.
       Now it climbs one step every `comboStep` panes and stops at `comboMax`. */
    function comboMult(n) { return Math.min(C.comboMax, 1 + Math.floor(n / C.comboStep)); }
    // The step it just climbed, said once: the words are the dictionary's.
    var COMBO_WORD = [null, null, "Combo x2", "Combo x3", "Combo x4", "Combo x5"];
    function comboBeat(gain) {
      var m = comboMult(chain);
      if (m === comboMult(chain - 1)) return;
      if (m === 2) {
        Pop.show("streak", { word: "Hot!", sub: COMBO_WORD[2], at: popAt() });
        Sound.clip("chain", 0.2, 1);
      } else if (m === 3) {
        Pop.show("combo", { word: COMBO_WORD[3], sub: "+" + gain, at: popAt() });
        Sound.clip("chain", 0.4, 1.12); Fx.flash("#4bf5ff", 0.18);
      } else if (m === 4) {
        Pop.show("combo", { word: "Smash!", sub: COMBO_WORD[4], cls: "pop-blast", at: popAt() });
        Sound.clip("chain", 0.55, 1.25);
      } else {
        Pop.show("ultra", { word: COMBO_WORD[5], sub: "+" + gain, at: popAt() });
        Sound.clip("chain", 0.7, 1.4);
        Overlay.vignette("rgba(75,245,255,.85)", 1, 620);
      }
    }

    function addBeam(horizontal, k, color) {
      beams.push({ h: horizontal, c: k.c, r: k.r, t: 0, life: 0.45, color: color });
    }

    /* `by` is the ball that caused the break, or null when a power did it.
       Only glass breaks: a switch, lit or not, is out of every power's reach,
       and a power takes a tough pane in one go. A pane a magnet is already
       pulling is on its way and left to arrive. A raised shield is out of
       every power's reach too, as steel is. */
    function smash(k, by, depth) {
      if (!k || !k.alive || k.ghost || (k.fly && depth)) return;
      if (!k.fly && shieldOn(k)) return;

      var bx = brickX(k), by0 = brickY(k);
      var cx = bx + BW / 2, cy = by0 + BH / 2, i, p, gain, mult, bonus = k.bonus;
      var ball = by || stepping;                   // who a big ball, a fire or a magnet goes to
      if (k.fly) { cx = k.fly.x; cy = k.fly.y; k.fly = null; }

      k.alive = false; k.flash = 1; broken++;
      chain++; if (chain > bestChain) bestChain = chain;
      mult = comboMult(chain);
      tally();                                     // a star is lit the moment it is reached
      if (by) { by.idle = 0; if (by.zone) by.inPocket++; }

      p = COLORS[k.tone];
      gain = C.colorScore[k.tone] * mult * (bonus ? C.bonusMult : 1);
      score += gain;
      HUD.setScore(score);
      HUD.punch(mult >= 3 ? "#ffd43b" : p.core);
      refreshHUD();

      Fx.burst(cx, cy, { color: sparksOf(k.tone), count: 10,
                         speed: 280, life: 0.42, grav: 520 });
      Fx.ring(cx, cy, { from: 8, to: 64, color: p.core, width: 4, life: 0.26 });
      Sound.clip("brick", 0.42, 1 + Math.min(chain, 20) * 0.04);

      /* WHAT THE PANE PAID, where it broke: the one place a colour is told
         apart from another by its price. It is written in the pane's own
         colour and grows with what the colour is worth — red at the house
         size, the rainbow half as big again — so a board of five colours
         teaches its prices as it goes. Tier 1 is the one whose fill is the
         colour handed in (the higher tiers paint their own gradient); the
         rainbow takes tier 3, whose magenta-to-gold IS a rainbow. The combo's
         steps keep the callout band (comboBeat). */
      Pop.text(cx, cy - 14, "+" + gain, { color: p.core, size: 22 + k.tone * 3.5,
                                          life: 0.6 + k.tone * 0.06, tier: k.tone === 4 ? 3 : 1 });

      if (bonus === B_BOMB) {                      // takes its eight neighbours
        Sound.clip("blast", 0.9);
        Fx.shake(15, 0.3); Fx.flash("#ffb44f", 0.28); Fx.freeze(0.04);
        Fx.burst(cx, cy, { color: ["#ffb44f", "#fff1c9", "#ff6a00"], count: 30, speed: 560, life: 0.6 });
        Fx.ring(cx, cy, { from: 20, to: 230, color: "#ffb44f", width: 9, life: 0.42 });
        if (!depth) popBonus(B_BOMB);
        smashRing(k, depth);

      } else if (bonus === B_ROW) {                // the whole row goes
        Sound.clip("line", 0.5, 1.25);
        Fx.shake(12, 0.26); Fx.flash("#22d3ee", 0.2);
        addBeam(true, k, "#22d3ee");
        if (!depth) popBonus(B_ROW);
        for (i = 0; i < G.cols; i++) smash(cellAt(i, k.r), null, depth + 1);

      } else if (bonus === B_COL) {                // the whole column goes
        Sound.clip("line", 0.5, 1.5);
        Fx.shake(12, 0.26); Fx.flash("#a855f7", 0.2);
        addBeam(false, k, "#a855f7");
        if (!depth) popBonus(B_COL);
        for (i = 0; i < G.rows; i++) smash(cellAt(k.c, i), null, depth + 1);

      } else if (bonus === B_MULTI) {              // three more balls, right now
        multiball(cx, cy);

      } else if (bonus && ball && ball.alive) {     // a power the ball itself takes
        powerUp(ball, bonus);
      }

      if (k.kind === K_SPLIT) {                    // it bursts: the shards land a beat later
        shards.push({ c: k.c, r: k.r, tone: k.tone, t: C.splitDelay });
        Sound.clip("blast", 0.5, 1.35);
        Fx.shake(6, 0.15);
        Fx.burst(cx, cy, { color: ["#05060c", "#2a2d38", p.light], count: 16, speed: 360, life: 0.4 });
        Fx.ring(cx, cy, { from: 10, to: 90, color: "#05060c", width: 6, life: 0.3 });
      }

      comboBeat(gain);
      if (boardDone()) clearBoard();
    }
    // The power the ball just set off, said where the callouts land: what it
    // does is the guide's page of the same id.
    function popBonus(kind) {
      Pop.show("bonus", { word: BONUS[kind].word, at: popAt() });
    }
    function smashRing(k, depth) {
      var dc, dr;
      for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++)
        if (dc || dr) smash(cellAt(k.c + dc, k.r + dr), null, depth + 1);
    }

    /* The three powers that live ON the ball, for the rest of its flight or
       for a few seconds: it grows, it burns through the glass, it pulls the
       glass in. A second pick-up of the same power refills it. */
    function powerUp(b, kind) {
      if (kind === B_BIG) {
        b.rT = C.ballR * C.bigMult;
        Sound.clip("big", 0.8);
        Fx.ring(b.x, b.y, { from: 10, to: 110, color: "#ffffff", width: 6, life: 0.4 });
      } else if (kind === B_FIRE) {
        b.fire = C.fireSeconds;
        Sound.clip("fire", 0.75);
        Fx.burst(b.x, b.y, { color: ["#fff0b8", "#ffb44f", "#ff4400"], count: 22, speed: 380, life: 0.45 });
        Overlay.vignette("rgba(255,90,20,.6)", 1, 520);
      } else if (kind === B_MAG) {
        b.mag = C.magnetSeconds; b.magT = 0;
        Sound.clip("magnet", 0.7);
        Fx.ring(b.x, b.y, { from: C.magnetReach, to: 20, color: "#c7d2e0", width: 5, life: 0.4 });
      }
      popBonus(kind);
    }

    /* The magnet, once every `magnetEvery`: the nearest pane of glass within
       reach tears itself off the board and flies into the ball, where it
       breaks — scored on arrival, like any other break by that ball. While
       it flies it is off the grid: no bounce, no pocket wall. */
    function magnetize(b, dt) {
      var i, k, dx, dy, d2, best = null, bestD = C.magnetReach * C.magnetReach;
      b.magT -= dt;
      if (b.magT > 0) return;
      b.magT = C.magnetEvery;
      for (i = 0; i < bricks.length; i++) {
        k = bricks[i];
        if (!k.alive || k.ghost || k.fly || shieldOn(k)) continue;
        dx = brickX(k) + BW / 2 - b.x; dy = brickY(k) + BH / 2 - b.y;
        d2 = dx * dx + dy * dy;
        if (d2 < bestD) { bestD = d2; best = k; }
      }
      if (!best) return;
      best.fly = { t: 0, x0: brickX(best) + BW / 2, y0: brickY(best) + BH / 2,
                   x: brickX(best) + BW / 2, y: brickY(best) + BH / 2, ball: b };
      flyers.push(best);
    }
    function updateFlyers(dt) {
      var i, k, f, e;
      for (i = flyers.length - 1; i >= 0; i--) {
        k = flyers[i]; f = k.fly;
        if (!f || !k.alive) { flyers.splice(i, 1); continue; }
        f.t = Math.min(1, f.t + dt / C.magnetFlight);
        e = f.t * f.t;                             // it tears loose slowly, then snaps in
        if (f.ball.alive) { f.bx = f.ball.x; f.by = f.ball.y; }
        f.x = f.x0 + ((f.bx != null ? f.bx : f.x0) - f.x0) * e;
        f.y = f.y0 + ((f.by != null ? f.by : f.y0) - f.y0) * e;
        if (f.t >= 1) {
          flyers.splice(i, 1);
          k.hp = 1;
          smash(k, f.ball.alive ? f.ball : null, 0);
        }
      }
    }

    function multiball(cx, cy) {
      var i, a;
      for (i = 0; i < C.multiBalls; i++) {
        a = -Math.PI / 2 + (i - (C.multiBalls - 1) / 2) * 0.5;
        spawn(cx, cy, a);
      }
      refreshHUD();
      Sound.clip("gold", 0.6, 2);
      Fx.ring(cx, cy, { from: 10, to: 200, color: BALL.glow, width: 8, life: 0.45 });
      Overlay.vignette(rgba(BALL.glow, 0.7), 1, 420);
      Pop.show("bonus", { word: "Multiball", sub: "+" + C.multiBalls + Lang.t(" balls"), at: popAt() });
    }

    function clearBoard() {
      if (cleared) return;
      cleared = true; ballsPaid = true;
      var bonus = C.clearBonus + Math.max(0, queue) * C.ballBonus;
      score += bonus; HUD.setScore(score);
      Sound.clip("clear", 0.2);
      Confetti.burst(40);
      Pop.show("ultra", { word: "Perfect clear", sub: "+" + bonus, hold: 900, at: popAt() });
      phase = "over"; endT = -0.7;                 // let the callout land first
      for (var i = 0; i < balls.length; i++) balls[i].alive = false;
    }

    /* THE STARS are the wall's (CONFIG.starOne / starTwo), and they are the
       level's own count (`levelTally`, which replaces the score bands of the
       level layer): one for three fifths of the wall, two for nine tenths,
       three for the WHOLE wall within par — a clear that took more balls is
       worth two. The third star is a flawless wall, not a big share of one:
       four fifths within par paid it, and the game handed it out too easily.
       A star once lit stays lit, since the living glass grows the wall under
       a share that was already reached. The playable reads the same count. */
    function tally() {
      var s, t;
      if (!bricks) return 0;
      s = wallShare();
      t = cleared ? (fired <= par ? 3 : 2) : s >= C.starTwo ? 2 : s >= C.starOne ? 1 : 0;
      if (t > bestTally) bestTally = t;
      return bestTally;
    }
    /* A shot past par is the one mistake the third star does not forgive:
       the level layer strikes it the moment it is fired (web.levels.faults
       is 0). */
    function levelFaults() { return Math.max(0, fired - par); }
    /* The objectives card (a tap on the level pill), one row a star of the
       count above. */
    function levelRules() {
      var wall = Lang.t("Break <b>{p}%</b> of the wall");
      return [wall.replace("{p}", Math.round(C.starOne * 100)),
              wall.replace("{p}", Math.round(C.starTwo * 100)),
              Lang.t("Clear the wall in <b>{b}</b> balls").replace("{b}", par)];
    }
    // A level sets its par: web.levels.objective IS the par, on the level
    // layer's own lerp, so the map card and the round never disagree.
    function applyLevel(d) {
      var o = C.web && C.web.levels && C.web.levels.objective, st;
      if (d == null || !o) { par = C.parBalls; return; }
      st = o.step || 1;
      par = Math.max(1, Math.round((o.from + (o.to - o.from) * d) / st) * st);
    }

    function finish() {
      var stars = tally(), ratio = wallShare();
      // A round won on par still has balls in the magazine, and they are paid.
      if (stars === 3 && !ballsPaid && queue > 0) {
        ballsPaid = true;
        score += queue * C.ballBonus; HUD.setScoreNow(score);
      }
      endRound({
        title: cleared ? Lang.t("Perfect clear!")
             : stars === 2 ? Lang.t("Huge run!")
             : stars === 1 ? Lang.t("Nice run!") : C.copy.gameOver,
        variant: stars === 3 ? "perfect" : stars ? "win" : "",
        score: score,
        stars: stars,
        rows: [
          { label: "Wall broken", value: Math.floor(ratio * 100) + "%", grade: ratio >= C.starTwo ? "accent" : "" },
          { label: "Balls fired", value: fired + " / " + par, grade: fired <= par ? "accent" : "" },
          { label: "Best combo", value: bestChain, grade: comboMult(bestChain) >= C.comboMax ? "accent" : "" },
          { label: "Best score", value: Math.max(score, Store.get("bestScore", 0)), grade: "gold" }
        ]
      });
    }

    /* --- the engine contract ------------------------------------------ */
    function reset() {
      pickPlan();                      // first: the biome dresses the backdrop and the glass
      balls = []; shards = []; lifeDirty = false;   // before the board: the living glass reads them
      geometry(); buildSprites(); buildBoard(); makeBubbles();
      if (typeof Art !== "undefined" && Art.backdrop) Art.backdrop(BIOMES[biome].scene);
      /* The biome names the stretch of the track the round rides, so replaying
         a level never restarts the music and crossing into the next biome
         does. A playable has no level and a short cut of the track to play it
         on, so `null` — the whole of what this build ships — is right there. */
      Music.play(C.level ? BIOMES[biome].music : null);
      phase = "aim"; idleT = 0;
      queue = C.startBalls; fired = 0;
      solidG = plan.start; releaseT = -1; releaseTick = -1;
      score = 0; chain = 0; bestChain = 0; bestTally = 0; ballsPaid = false;
      clock = 0; flightT = 0; endT = 0; idleT = 0; recoil = 0;
      pulled = false; cleared = false;
      lastSwap = -1; lastWall = -1;
      beams = []; zaps = []; flyers = []; stepping = null;
      aimA = -Math.PI / 2; aiming = false; traceShot();
      zapAll(0.55);                    // power the fence up once, so the walls are shown
      HUD.setScoreNow(0);
      refreshHUD();
      Fx.reset();
      tellStage();
    }

    function onDown(p) {
      // In flight the pointer has one job and it is unlimited: flip the switches.
      if (phase === "flight") { toggleMist(false); return; }
      if (phase !== "aim") return;
      aiming = true; idleT = 0; aimAt(p);
    }
    function onMove(p) { if (phase === "aim" && aiming) aimAt(p); }
    function onUp(p) {
      if (phase !== "aim" || !aiming) return;
      aiming = false; aimAt(p); fire();
    }

    /* Once a frame, for every ball: where is it (free, or shut in a pocket),
       how fast is it owed to go, and is the lava allowed to pull it. Then the
       auto-tap: it counts down while a ball sits in an empty pocket and no
       other ball is still eating one. */
    function pockets(dt) {
      var i, b, target, empty = false, full = false, pullNow = false, fast = C.ballSpeed, sp;
      for (i = 0; i < balls.length; i++) {
        b = balls[i]; if (!b.alive) continue;
        b.zone = pocketOf(b);
        if (b.zone) {
          // A ball can fall into a loop that never touches the glass around
          // it. Past `stuckAfter` without a break it counts as an empty
          // pocket, and the lava pulls it: the loop is broken either way.
          b.idle += dt;                            // since it last touched glass (touchGlass)
          b.pulling = b.idle > C.stuckAfter;
          if (pocketHasGlass(b.zone) && !b.pulling) full = true; else empty = true;
        } else {
          b.free += dt; b.inPocket = 0; b.idle = 0;
          if (b.free > C.pullAfter) { b.pulling = true; pullNow = true; }
        }
        /* THE SPEED-UP is not the pocket's: it is a ball shut in and LOST
           in it — no pane of glass touched for `fastAfter` seconds — that is
           sped up to find the rest, and the next pane it touches brings it
           back to the base speed. A pocket full of glass never speeds up. */
        target = b.zone && b.idle > C.fastAfter ? C.fastMult : 1;
        b.k += (target - b.k) * Math.min(1, dt * (target > b.k ? C.fastIn : C.fastOut));
        b.r += (b.rT - b.r) * Math.min(1, dt * 8);  // a big ball swells, it does not pop
        if (b.fire > 0) b.fire -= dt;
        if (b.mag > 0) { b.mag -= dt; magnetize(b, dt); }
        if (!b.pulling) resetSpeed(b);
        sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (sp > fast) fast = sp;
      }
      if (pullNow && !pulled) {                    // every shot ends in the lake
        pulled = true;
        Overlay.vignette("rgba(255,106,0,.5)", 1, 900);
      }
      if (empty && !full && solidG) {
        if (releaseT < 0) { releaseT = C.releaseDelay; releaseTick = -1; pocketCleared(); }
        releaseT -= dt;
        if (Math.floor(releaseT * 2) !== releaseTick) {    // a tick every half second
          releaseTick = Math.floor(releaseT * 2);
          Sound.clip("tick", 0.3, 1.2 + (1 - releaseT / C.releaseDelay) * 0.6);
        }
        if (releaseT <= 0) toggleMist(true);
      } else releaseT = -1;
      return fast;
    }

    function update(dt) {
      var i, s, sub, h, live, k, fast;
      clock += dt;
      updateZaps(dt);
      updateFlyers(dt);
      if (recoil > 0) recoil = Math.max(0, recoil - dt * 5);
      for (i = 0; i < bricks.length; i++) {
        k = bricks[i];
        if (k.flash > 0) k.flash -= dt * 3.4;
        if (k.pulse > 0) k.pulse -= dt * 5;
      }
      for (i = beams.length - 1; i >= 0; i--) { beams[i].t += dt; if (beams[i].t > beams[i].life) beams.splice(i, 1); }
      if (phase !== "over") life(dt);

      if (phase === "aim") { idleT += dt; return; }
      if (phase === "over") { endT += dt; if (endT > 0.9) finish(); return; }

      flightT += dt;
      fast = pockets(dt);

      // Sub-stepped so the fastest ball never tunnels through a 38 px pane.
      sub = Math.ceil(fast * dt / 6);
      if (sub > 30) sub = 30; if (sub < 1) sub = 1;
      h = dt / sub;
      for (s = 0; s < sub && phase === "flight"; s++)
        for (i = 0; i < balls.length; i++) if (balls[i].alive) stepBall(balls[i], h);

      live = 0;
      for (i = balls.length - 1; i >= 0; i--) if (!balls[i].alive) balls.splice(i, 1); else live++;
      if (!live && phase === "flight") { refreshHUD(); shotEnd(); }
    }

    /* --- drawing ------------------------------------------------------ */
    /* The pocket a ball is shut in, washed in gold under the bricks: the
       player sees the room they built around it. */
    function drawPockets() {
      var i, j, b, q, done = {};
      if (phase !== "flight") return;
      ctx.fillStyle = "rgba(255,216,74,.06)";
      for (i = 0; i < balls.length; i++) {
        b = balls[i]; if (!b.alive || !b.zone) continue;
        for (j = 0; j < b.zone.length; j++) {
          q = b.zone[j];
          if (done[q]) continue;                   // two balls, one room: wash it once
          done[q] = true;
          ctx.fillRect(G.x0 + (q % G.cols) * G.cw, G.y0 + Math.floor(q / G.cols) * G.ch, G.cw, G.ch);
        }
      }
    }

    /* A switch is a button: dark while the ball may pass, lit while it is
       solid. During the auto-tap countdown the lit bank flickers dark, faster
       toward the end, and the bank about to take over flickers lit. Without
       the painted cut the old look stands in: mist that drifts, steel that
       does not. */
    function drawGhost(k, x, y) {
      var solid = isSolid(k), look = solid, off, a, dx, cv, w = BW + GM * 2, h = BH + GM * 2;
      var cx = x + BW / 2, cy = y + BH / 2, R = Math.min(BW, BH) / 2 + 3;
      if (releaseT >= 0) {
        off = Math.floor(releaseT * (releaseT < 0.7 ? 14 : 6)) % 2 === 0;
        if (solid && off) look = false;
        else if (!solid && k.group === nextSolid() && !off) look = true;
      }
      cv = look ? sprites.btnOn[k.group] : sprites.btnOff[k.group];
      if (cv) {
        ctx.drawImage(cv, x - GM, y - GM, w, h);
        if (k.flash > 0) {                         // the ball just rang it
          ctx.globalAlpha = clamp(k.flash, 0, 1) * 0.45;
          ctx.fillStyle = GHOST[k.group].light;
          ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else if (look) {
        ctx.drawImage(sprites.steel[k.group], x - GM, y - GM, w, h);
        if (k.flash > 0) {
          ctx.globalAlpha = clamp(k.flash, 0, 1) * 0.35;
          ctx.fillStyle = GHOST[k.group].light; rr(ctx, x, y, BW, BH, 8); ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else {
        cv = sprites.fog[k.group][k.v];
        a = 0.6 + 0.25 * Math.sin(clock * 1.3 + k.ph);
        dx = Math.sin(clock * 0.55 + k.ph) * 4;
        ctx.globalAlpha = a;
        ctx.drawImage(cv, x - GM + dx, y - GM, w, h);
        ctx.globalAlpha = a * 0.55;
        ctx.drawImage(sprites.fog[k.group][(k.v + 1) % 3], x - GM - dx, y - GM + dx * 0.4, w, h);
        ctx.globalAlpha = 1;
      }
      if (k.pulse > 0) {                           // the instant it switches
        ctx.globalAlpha = clamp(k.pulse, 0, 1) * 0.7;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(cx, cy, R + 3 * k.pulse, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // A pane growing into its cell overshoots a little, then settles.
    function growScale(g) { var t = g - 1; return 1 + 2.2 * t * t * t + 1.2 * t * t; }

    /* Each living kind wears its own mark over the painted face, drawn live
       because it moves: a rim running through the rainbow on a warp pane
       (flickering just before it jumps), a rim of black on a split pane, a
       ring of sap filling up to the next pane on a seed, and a bolt on an
       electric pane — caged in a crackling shield while it is up, which
       stutters before it drops and ghosts in before it rises. Drawn around
       the pane's own origin, so a pane growing in carries its mark. */
    function drawLife(k, x, y, now) {
      var cx = x + BW / 2, cy = y + BH / 2, a, i, j, u, cyc, per, room, t, s;
      if (now == null) now = clock;                // the guide draws a pane at a moment of its own
      if (k.kind === K_WARP) {
        a = k.warpT < 0.22 && Math.floor(k.warpT * 30) % 2 ? 0.3 : 1;
        i = Math.floor(now * 10 + k.c + k.r);
        ctx.globalAlpha = a;
        ctx.strokeStyle = RAINBOW[(i + 2) % RAINBOW.length]; ctx.lineWidth = 7;
        rr(ctx, x - 2, y - 2, BW + 4, BH + 4, 12); ctx.stroke();
        ctx.strokeStyle = RAINBOW[i % RAINBOW.length]; ctx.lineWidth = 3.5;
        rr(ctx, x - 2, y - 2, BW + 4, BH + 4, 12); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.5;
        rr(ctx, x + 3, y + 3, BW - 6, BH - 6, 8); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (k.kind === K_SPLIT) {
        ctx.strokeStyle = "#05060c"; ctx.lineWidth = 7;
        rr(ctx, x + 3.5, y + 3.5, BW - 7, BH - 7, 8); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.5;
        rr(ctx, x + 8, y + 8, BW - 16, BH - 16, 4); ctx.stroke();
      } else if (k.kind === K_SEED) {
        room = k.room != null ? k.room : freeAround(k.c, k.r, 1).length;   // a seed with no room left rests
        t = clamp(1 - k.seedT / C.seedEvery, 0, 1); s = BH * 0.3;
        ctx.fillStyle = "rgba(6,14,4,.72)";
        ctx.beginPath(); ctx.arc(cx, cy, s + 3, 0, TAU); ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = rgba(SEED, 0.25);
        ctx.beginPath(); ctx.arc(cx, cy, s, 0, TAU); ctx.stroke();
        ctx.strokeStyle = rgba(SEED, room ? 1 : 0.35);
        ctx.beginPath(); ctx.arc(cx, cy, s, -Math.PI / 2, -Math.PI / 2 + TAU * (room ? t : 1)); ctx.stroke();
        ctx.fillStyle = rgba(SEED, room ? 0.6 + 0.4 * t : 0.35);
        ctx.beginPath(); ctx.arc(cx, cy, 4 + 3 * t * t, 0, TAU); ctx.fill();
      } else if (k.kind === K_SHIELD) {
        per = C.shieldUp + C.shieldDown; cyc = (now + k.ph) % per; s = BH * 0.34;
        ctx.fillStyle = cyc < C.shieldUp ? "#ffffff" : SHOCK;   // the bolt: this pane is electric
        ctx.strokeStyle = "rgba(6,8,18,.85)"; ctx.lineWidth = 3; ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(cx + 0.2 * s, cy - s); ctx.lineTo(cx - 0.5 * s, cy + 0.12 * s);
        ctx.lineTo(cx - 0.04 * s, cy + 0.12 * s); ctx.lineTo(cx - 0.2 * s, cy + s);
        ctx.lineTo(cx + 0.5 * s, cy - 0.16 * s); ctx.lineTo(cx + 0.04 * s, cy - 0.16 * s);
        ctx.closePath(); ctx.stroke(); ctx.fill();
        if (cyc < C.shieldUp) a = cyc > C.shieldUp - 0.3 && Math.floor(now * 24) % 2 ? 0.25 : 1;
        else a = cyc > per - 0.3 && Math.floor(now * 24) % 2 ? 0.3 : 0;
        if (a > 0) {
          ctx.globalAlpha = a;
          if (cyc < C.shieldUp) {
            ctx.fillStyle = rgba(SHOCK, 0.22); rr(ctx, x - 5, y - 5, BW + 10, BH + 10, 13); ctx.fill();
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.6;
            for (j = 0; j < 2; j++) {              // two arcs crackling across the cage
              ctx.beginPath();
              for (i = 0; i <= 6; i++) {
                u = x - 3 + i / 6 * (BW + 6);
                t = y + BH * (j ? 0.72 : 0.28) + Math.sin(now * 47 + i * 2.3 + j * 5 + k.c) * 6;
                if (i) ctx.lineTo(u, t); else ctx.moveTo(u, t);
              }
              ctx.stroke();
            }
          }
          ctx.strokeStyle = SHOCK; ctx.lineWidth = 3;
          rr(ctx, x - 5, y - 5, BW + 10, BH + 10, 13); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    function drawBricks() {
      var i, k, x, y, g, img;
      // the dark switches first: they are open air, and glass beside them sits in front
      // (every pane and every switch is one element of the round's entrance, Enter)
      for (i = 0; i < bricks.length; i++) {
        k = bricks[i];
        if (k.ghost && k.alive && !isSolid(k)) {
          x = brickX(k); y = brickY(k);
          if (Enter.begin(x + BW / 2, y + BH / 2)) { drawGhost(k, x, y); Enter.end(); }
        }
      }
      for (i = 0; i < bricks.length; i++) {
        k = bricks[i];
        x = brickX(k); y = brickY(k);
        if (k.ghost) {
          if (isSolid(k) && Enter.begin(x + BW / 2, y + BH / 2)) { drawGhost(k, x, y); Enter.end(); }
          continue;
        }
        if (k.alive && k.fly) {                    // torn off by a magnet, on its way
          ctx.save();
          ctx.translate(k.fly.x, k.fly.y);
          ctx.rotate(k.fly.t * 2.4);
          ctx.scale(1 - 0.45 * k.fly.t, 1 - 0.45 * k.fly.t);
          ctx.drawImage(k.bonus ? sprites.charged[k.tone][k.bonus] : sprites.plain[k.tone],
                        -BW / 2, -BH / 2, BW, BH);
          ctx.restore();
          continue;
        }
        if (k.alive) {
          if (!Enter.begin(x + BW / 2, y + BH / 2)) continue;
          img = k.bonus ? sprites.charged[k.tone][k.bonus]
              : k.hp > 1 ? sprites.tough[k.tone]
              : k.tough ? sprites.cracked[k.tone] : sprites.plain[k.tone];
          if (k.kind || k.grow < 1) {              // living glass, or a pane growing in
            g = k.grow < 1 ? growScale(k.grow) : 1;
            ctx.save();
            ctx.translate(x + BW / 2, y + BH / 2);
            if (g !== 1) ctx.scale(g, g);
            ctx.drawImage(img, -BW / 2, -BH / 2, BW, BH);
            if (k.kind) drawLife(k, -BW / 2, -BH / 2);
            ctx.restore();
          } else ctx.drawImage(img, x, y, BW, BH);
          if (k.flash > 0) {                       // a pane that just took a hit
            ctx.globalAlpha = clamp(k.flash, 0, 1) * 0.5;
            ctx.fillStyle = "#ffffff"; rr(ctx, x, y, BW, BH, 12); ctx.fill();
            ctx.globalAlpha = 1;
          }
          Enter.end();
        } else if (k.flash > 0) {                  // the ghost of a smashed pane
          g = 1 - clamp(k.flash, 0, 1);
          ctx.globalAlpha = clamp(k.flash, 0, 1) * 0.65;
          ctx.fillStyle = "#ffffff";
          rr(ctx, x - 4 * g, y - 4 * g, BW + 8 * g, BH + 8 * g, 12);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    // A charged brick fires a beam down its row or column: the cascade is
    // loud enough to be read while it happens.
    function drawBeams() {
      var i, b, a, t, x, y;
      for (i = 0; i < beams.length; i++) {
        b = beams[i]; a = 1 - b.t / b.life; t = 3 + 16 * a;
        ctx.globalAlpha = a * 0.8;
        ctx.fillStyle = b.color;
        if (b.h) {
          y = G.y0 + b.r * G.ch + G.ch / 2;
          ctx.fillRect(field.left, y - t, field.right - field.left, t * 2);
        } else {
          x = G.x0 + b.c * G.cw + G.cw / 2;
          ctx.fillRect(x - t, field.top, t * 2, field.floor - field.top);
        }
      }
      ctx.globalAlpha = 1;
    }

    /* The lake: a molten body, a crust that rolls on two slow waves, bubbles
       coming up through it and a heat glow faked with flat bands — the ball
       that touches any of it is gone. */
    function drawLava() {
      var l = 0, r = view.w, top = field.floor;
      var x, y, i, b, p;
      for (i = 3; i >= 1; i--) {                   // the heat above the surface
        ctx.fillStyle = rgba("#ff6a00", 0.05 * i);
        ctx.fillRect(0, top - 14 * i, view.w, 14 * i);
      }
      ctx.fillStyle = lavaGrad;
      ctx.fillRect(0, top, view.w, Layout.bottom + 14 - top);
      ctx.beginPath();
      ctx.moveTo(l, top + 20);
      for (x = l; x <= r; x += 10) {
        y = top + Math.sin(x * 0.028 + clock * 1.9) * 5 + Math.sin(x * 0.011 - clock * 1.1) * 4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(r, top + 20); ctx.closePath();
      ctx.fillStyle = "rgba(255,196,60,.75)"; ctx.fill();
      for (i = 0; i < bubbles.length; i++) {       // bubbles bursting on the crust
        b = bubbles[i];
        p = (clock * b.s + b.o) % 1;
        ctx.globalAlpha = 0.2 + 0.5 * Math.sin(p * Math.PI);
        ctx.fillStyle = "#fff0b8";
        ctx.beginPath();
        ctx.arc(b.x, top + 38 - p * 32, b.r * (0.4 + p), 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawTrace() {
      if (!trace || trace.length < 6) return;
      var i, n = trace.length / 2, k, x, y, m;
      i = Math.floor(n / 2);                       // the aim line lands on its middle
      if (!Enter.begin(trace[i * 2], trace[i * 2 + 1])) return;
      ctx.fillStyle = BALL.glow;
      for (i = 4; i < n; i += 4) {
        ctx.globalAlpha = clamp(1 - i / n, 0.12, 0.8);
        ctx.beginPath();
        ctx.arc(trace[i * 2], trace[i * 2 + 1], 5 - 2.4 * (i / n), 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.lineWidth = 3;
      for (i = 0; i < traceMarks.length; i++) {    // the five bounce points: a lit
        m = traceMarks[i];                         // switch in its bank's colour
        ctx.strokeStyle = m.steel ? rgba(GHOST[solidG].tint, 0.9)
                        : m.shock ? rgba(SHOCK, 0.9) : rgba(BALL.glow, 0.85);
        ctx.beginPath(); ctx.arc(m.x, m.y, 10, 0, TAU); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 3;
      for (i = 0; i < traceHits.length; i++) {     // and the panes it breaks
        k = traceHits[i];
        x = brickX(k); y = brickY(k);
        ctx.globalAlpha = clamp(1 - i * 0.16, 0.3, 1);
        rr(ctx, x - 3, y - 3, BW + 6, BH + 6, 14); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      Enter.end();
    }

    /* The turret: a pylon planted in the lava, a deck carrying the magazine,
       and a barrel that swings with the aim, recoils on the shot and holds a
       charged core in its throat. All flat fills and rings — no shadowBlur. */
    function drawCannon() {
      var x = cannon.x, y = cannon.y, g, i, a, n, dx, k, bay;
      var next = BALL;

      // the pylon, and the heat shield taking the lava head on
      ctx.fillStyle = "#0a1024";
      ctx.beginPath();
      ctx.moveTo(x - 30, y + 16); ctx.lineTo(x + 30, y + 16);
      ctx.lineTo(x + 52, field.floor + 14); ctx.lineTo(x - 52, field.floor + 14);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba("#4bf5ff", 0.3);        // two coolant veins
      ctx.fillRect(x - 17, y + 26, 5, field.floor - y - 26);
      ctx.fillRect(x + 12, y + 26, 5, field.floor - y - 26);
      g = ctx.createLinearGradient(0, field.floor - 18, 0, field.floor + 6);
      g.addColorStop(0, "#39466e"); g.addColorStop(1, "#0f1730");
      ctx.fillStyle = g; rr(ctx, x - 62, field.floor - 18, 124, 24, 8); ctx.fill();
      ctx.fillStyle = rgba("#ff8a1a", 0.5);        // the shield, glowing hot
      rr(ctx, x - 56, field.floor - 4, 112, 6, 3); ctx.fill();

      // the barrel, authored pointing up and swung onto the aim
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(aimA + Math.PI / 2);
      ctx.translate(0, recoil * 14);
      ctx.fillStyle = "rgba(6,10,26,.55)";         // the cradle behind the tube
      rr(ctx, -26, -34, 52, 52, 14); ctx.fill();
      g = ctx.createLinearGradient(-22, 0, 22, 0);
      g.addColorStop(0, "#0e1526"); g.addColorStop(0.3, "#6f86b8");
      g.addColorStop(0.52, "#a9bfea"); g.addColorStop(0.78, "#3d4c74"); g.addColorStop(1, "#111828");
      ctx.fillStyle = g; rr(ctx, -20, -92, 40, 110, 13); ctx.fill();
      ctx.strokeStyle = "rgba(9,13,28,.85)"; ctx.lineWidth = 3;
      rr(ctx, -20, -92, 40, 110, 13); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.3)";      // the rail highlight
      rr(ctx, -13, -84, 6, 92, 3); ctx.fill();
      ctx.fillStyle = rgba(next.glow, 0.9);        // three rings, in the ball's glow
      rr(ctx, -22, -62, 44, 8, 4); ctx.fill();
      rr(ctx, -22, -42, 44, 8, 4); ctx.fill();
      rr(ctx, -22, -22, 44, 8, 4); ctx.fill();
      g = ctx.createLinearGradient(-27, 0, 27, 0); // the muzzle brake
      g.addColorStop(0, "#18213a"); g.addColorStop(0.48, "#d4e2ff"); g.addColorStop(1, "#18213a");
      ctx.fillStyle = g; rr(ctx, -26, -110, 52, 26, 9); ctx.fill();
      ctx.strokeStyle = "rgba(9,13,28,.8)"; ctx.lineWidth = 3;
      rr(ctx, -26, -110, 52, 26, 9); ctx.stroke();
      ctx.fillStyle = "#04070f"; rr(ctx, -13, -106, 26, 19, 6); ctx.fill();
      k = phase === "aim" ? 0.55 + 0.45 * Math.sin(clock * 5) : 0.22;
      for (i = 3; i >= 1; i--) {                   // the ball charged in the throat
        ctx.fillStyle = rgba(next.glow, 0.15 * i * k);
        ctx.beginPath(); ctx.arc(0, -97, 6 + i * 6, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = rgba(next.light, 0.5 + 0.5 * k);
      ctx.beginPath(); ctx.arc(0, -97, 7.5, 0, TAU); ctx.fill();
      ctx.restore();

      // the shoulder the barrel turns in, over the tube's tail
      g = ctx.createLinearGradient(0, y - 36, 0, y + 18);
      g.addColorStop(0, "#a9bfea"); g.addColorStop(0.5, "#3c4b74"); g.addColorStop(1, "#141c31");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 36, Math.PI, TAU); ctx.closePath(); ctx.fill();
      ctx.fillRect(x - 36, y, 72, 10);
      ctx.strokeStyle = rgba(next.glow, 0.75); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, 36, Math.PI, TAU); ctx.stroke();
      ctx.strokeStyle = "rgba(9,13,28,.7)"; ctx.lineWidth = 3;
      for (i = 0; i <= 8; i++) {                   // notches, so the swing reads
        a = Math.PI + i * Math.PI / 8;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 27, y + Math.sin(a) * 27);
        ctx.lineTo(x + Math.cos(a) * 35, y + Math.sin(a) * 35);
        ctx.stroke();
      }
      n = phase === "aim" ? 0.4 + 0.25 * Math.sin(clock * 5) : 0.25;
      ctx.fillStyle = rgba(next.glow, n);          // the core, awake while aiming
      ctx.beginPath(); ctx.arc(x, y - 2, 13, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba(next.light, 0.9);
      ctx.beginPath(); ctx.arc(x, y - 2, 6, 0, TAU); ctx.fill();

      /* the deck and its magazine, drawn LAST: the base has to hide the
         pivot, or the barrel's tail shows through it mid-swing. Every bead is
         one queued ball. */
      g = ctx.createLinearGradient(0, y + 2, 0, y + 40);
      g.addColorStop(0, "#6a80bd"); g.addColorStop(0.45, "#39476e"); g.addColorStop(1, "#131a2e");
      ctx.fillStyle = g; rr(ctx, x - 80, y + 2, 160, 38, 13); ctx.fill();
      ctx.strokeStyle = "rgba(9,13,28,.7)"; ctx.lineWidth = 3;
      rr(ctx, x - 80, y + 2, 160, 38, 13); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.16)"; rr(ctx, x - 72, y + 6, 144, 7, 4); ctx.fill();
      bay = Math.min(Math.max(queue, 1), 9);
      ctx.fillStyle = "rgba(4,8,22,.75)";
      rr(ctx, x - bay * 8 - 7, y + 18, bay * 16 + 14, 18, 9); ctx.fill();
      for (i = 0; i < bay && i < queue; i++) {
        dx = x + (i - (bay - 1) / 2) * 16;
        ctx.fillStyle = rgba(next.glow, 0.35);
        ctx.beginPath(); ctx.arc(dx, y + 27, 7.5, 0, TAU); ctx.fill();
        ctx.fillStyle = next.core;
        ctx.beginPath(); ctx.arc(dx, y + 27, 5.4, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(next.light, 0.9);
        ctx.beginPath(); ctx.arc(dx - 1.6, y + 25.4, 2.2, 0, TAU); ctx.fill();
      }
      if (queue > 9) {
        ctx.fillStyle = "#dffcff";
        ctx.font = "900 24px -apple-system,Segoe UI,Roboto,sans-serif";
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText("+" + (queue - 9), x + 86, y + 27);
      }
    }

    /* A free ball is white-hot; a ball shut in a pocket runs gold, and its
       streak grows with the speed the pocket gave it. A fireball is molten
       and trails flame; a magnet wears the ring of its reach. */
    var FIRE = { core: "#ff6a1a", light: "#fff0b8", glow: "#ff3d00" };
    function drawBalls() {
      for (var i = 0; i < balls.length; i++) if (balls[i].alive) drawBall(balls[i], clock);
    }
    // One ball, at the moment `now` (the round's clock, or the guide's own).
    function drawBall(b, now) {
      var j, sp, p, len, R, ux, uy, q;
      ctx.lineCap = "round";
      p = b.fire > 0 ? FIRE : tone(b); R = b.r;
      sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
      ux = b.vx / sp; uy = b.vy / sp;
      len = 44 * clamp(sp / C.ballSpeed, 1, 2.2);
      if (b.mag > 0) {                           // the magnet's reach, breathing
        q = 0.5 + 0.5 * Math.sin(now * 9);
        ctx.strokeStyle = rgba("#c7d2e0", 0.18 + 0.14 * q); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(b.x, b.y, C.magnetReach * (0.9 + 0.1 * q), 0, TAU); ctx.stroke();
        ctx.strokeStyle = rgba("#ffffff", 0.5); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, R + 7, 0, TAU); ctx.stroke();
      }
      if (b.fire > 0) {                          // flames licking back off the ball
        for (j = 5; j >= 1; j--) {
          ctx.fillStyle = rgba(j > 2 ? "#ff3d00" : "#ffb44f", 0.1 + 0.05 * (6 - j));
          ctx.beginPath();
          ctx.arc(b.x - ux * j * R * 0.9 + Math.sin(now * 30 + j) * 3,
                  b.y - uy * j * R * 0.9 + Math.cos(now * 27 + j) * 3, R * (1.25 - j * 0.13), 0, TAU);
          ctx.fill();
        }
      }
      ctx.strokeStyle = rgba(p.glow, 0.34); ctx.lineWidth = R * 1.4;
      ctx.beginPath();
      ctx.moveTo(b.x - ux * len, b.y - uy * len); ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.fillStyle = rgba(p.glow, 0.26);
      ctx.beginPath(); ctx.arc(b.x, b.y, R * 1.9, 0, TAU); ctx.fill();
      ctx.fillStyle = p.core;
      ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, TAU); ctx.fill();
      ctx.fillStyle = p.light;
      ctx.beginPath(); ctx.arc(b.x - R * 0.28, b.y - R * 0.3, R * 0.45, 0, TAU); ctx.fill();
    }

    /* The combo is the whole scoring rule, so it is on screen while it runs —
       in the HUD band, right under the big score, where the eye already is
       between two shots. It never reaches the bricks: the band above the
       field is empty by construction (CONFIG.layout.hudHeight). */
    function drawChain() {
      if (chain >= 2) drawChainAt(chain, view.w / 2 - 115, view.insetTop + 110);
    }
    function drawChainAt(n, x, y) {
      var w = 230, h = 40, m = comboMult(n);
      // the bar fills toward the next step, and stays full at the ceiling
      var t = m >= C.comboMax ? 1 : (n % C.comboStep) / C.comboStep;
      var col = m >= 4 ? "#ff2d78" : m >= 3 ? "#ffb44f" : m >= 2 ? "#4bf5ff" : "#9fb6e6";
      ctx.fillStyle = "rgba(6,9,26,.72)"; rr(ctx, x, y, w, h, 20); ctx.fill();
      ctx.fillStyle = rgba(col, 0.3); rr(ctx, x + 4, y + 4, (w - 8) * t, h - 8, 16); ctx.fill();
      ctx.strokeStyle = rgba(col, 0.85); ctx.lineWidth = 2; rr(ctx, x, y, w, h, 20); ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = "900 26px -apple-system,Segoe UI,Roboto,sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(upper(Lang.t("Combo x") + m), x + w / 2, y + h / 2 + 1);
    }

    function render() {
      if (bgCv) ctx.drawImage(bgCv, 0, 0, view.w, view.h);
      else { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, view.w, view.h); }
      drawPockets();
      drawBricks();
      drawBeams();
      if (phase === "aim") drawTrace();
      if (Enter.begin(cannon.x, cannon.y)) { drawCannon(); Enter.end(); }
      drawBalls();
      // The lake is the FOREGROUND: the turret is planted in it, so its base
      // and the ball that falls in both go behind the molten surface.
      drawLava();
      drawZaps();
      drawChain();
    }

    // The motor calls this before the first reset, while the intro is up:
    // only the geometry exists then, there is no board to re-solve yet.
    function onResize() {
      geometry(); buildSprites(); makeBubbles();
      if (cells && phase === "aim") traceShot();
    }

    /* --- the guide: every rule, as pages (packages/webshell/guide.js) -----
       Every page SHOWS before it tells, and its picture is drawn by the
       round's own renderers — the pane sprites, drawLife, drawBall,
       drawCannon, drawLava, the combo pill — on a canvas of its own, with the
       round's `ctx` lent for the length of the call. So the glass read in the
       guide is the glass on the board. A page's level is the one the climb
       first deals the idea on (pickPlan, STAGES): a biome's power on its
       third level, its living glass on its fourth, its second power on its
       fifth. The guide can open before any round: nothing here reads the
       board, and the few round values drawCannon reads are lent and given
       back in the same call (lendRound). */
    function paintPic(W, H, fn) {
      if (!BW) geometry();                         // a guide opened before the first layout
      if (!bubbles) makeBubbles();
      buildSprites();                              // a no-op unless its inputs moved
      var cv = document.createElement("canvas"), k = view.dpr || 1, keep = ctx;
      cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx = cv.getContext("2d"); ctx.scale(k, k);
      try { fn(W, H); } finally { ctx = keep; }
      return cv;
    }
    // The round values drawCannon reads, set for one drawing and given back.
    function lendRound(o, fn) {
      var keep = [aimA, recoil, phase, queue, clock];
      aimA = o.aimA; recoil = 0; phase = "aim"; queue = o.queue; clock = o.clock || 0;
      try { fn(); } finally { aimA = keep[0]; recoil = keep[1]; phase = keep[2]; queue = keep[3]; clock = keep[4]; }
    }
    /* One pane, its top-left corner at (x, y) and `s` times its size: the
       board's own sprite, and a living kind's mark drawn by drawLife at a
       moment of the guide's own (`now`). */
    function gPane(tone, x, y, o) {
      o = o || {};
      var s = o.s || 1, img = o.bonus ? sprites.charged[tone][o.bonus]
            : o.tough ? sprites.tough[tone] : o.cracked ? sprites.cracked[tone] : sprites.plain[tone];
      ctx.save();
      ctx.translate(x + BW * s / 2, y + BH * s / 2); ctx.scale(s, s);
      if (o.alpha != null) ctx.globalAlpha = o.alpha;
      ctx.drawImage(img, -BW / 2, -BH / 2, BW, BH);
      if (o.kind) drawLife({ kind: o.kind, c: 0, r: 0, warpT: 1, seedT: C.seedEvery * 0.35, room: 1, ph: 0 },
                           -BW / 2, -BH / 2, o.now || 0);
      ctx.restore();
    }
    /* One button of a bank in any biome's colour (the board only dresses
       its own two): the painted cut, or the steel and the mist without it. */
    var gBtns = {};
    function gButton(hue, key, on, x, y) {
      var id = hue + key + (on ? 1 : 0) + "|" + BW + "x" + BH, g = bank(hue, key), cv = gBtns[id];
      if (!cv) {
        cv = buttonFace(g, on);
        if (cv) gBtns[id] = cv;
        else cv = on ? steelFace(g) : fogFace(g);
      }
      ctx.drawImage(cv, x - GM, y - GM, BW + GM * 2, BH + GM * 2);
    }
    function hueB(hue) { return hue === "yellow" ? "blue" : "yellow"; }
    function gBall(x, y, o) {
      o = o || {};
      drawBall({ x: x, y: y, vx: o.vx || 0, vy: o.vy == null ? -C.ballSpeed : o.vy, r: o.r || C.ballR,
                 k: o.hot ? C.fastMult : 1, fire: o.fire ? 1 : 0, mag: o.mag ? 1 : 0 }, o.now || 0.2);
    }
    // A plain white chevron between two states of the same thing.
    function gArrow(x, y) {
      ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(x - 8, y - 14); ctx.lineTo(x + 6, y); ctx.lineTo(x - 8, y + 14); ctx.stroke();
    }
    // A row of n panes centred in W, one cell apart, starting at y.
    function rowX(n, W) { return (W - (n - 1) * G.cw - BW) / 2; }

    /* --- the pictures --- */
    // The sight: a band of glass, the turret, and five bounces of dots.
    function shootPic() {
      return paintPic(520, 300, function (W, H) {
        var sc = 0.6, VH = H / sc, floor = VH - 60, cy = floor - C.cannonH, i, c, r, a, x, y, vx, vy, n, R = C.ballR;
        ctx.scale(sc, sc); ctx.translate((W / sc - view.w) / 2, 0);
        for (r = 0; r < 2; r++) for (c = 0; c < 12; c++)
          gPane(4 - r - (c % 3 === 0 ? 1 : 0), field.left + c * G.cw + C.pad, 14 + r * G.ch, { tough: r === 0 && c === 5 });
        a = -Math.PI / 2 + 1;
        ctx.save(); ctx.translate(0, floor - field.floor);
        lendRound({ aimA: a, queue: 5, clock: 0.3 }, drawLava);
        ctx.restore();
        x = cannon.x + Math.cos(a) * C.muzzle; y = cy + Math.sin(a) * C.muzzle;
        vx = Math.cos(a) * 22; vy = Math.sin(a) * 22;
        ctx.fillStyle = BALL.glow;
        for (n = 0; n < 40 && y > 14 + 2 * G.ch + R; n++) {      // the dotted sight, up to the glass
          x += vx; y += vy;
          if (x > field.right - R) { x = field.right - R; vx = -vx;
            ctx.strokeStyle = rgba(BALL.glow, 0.85); ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.stroke(); }
          ctx.globalAlpha = clamp(1 - n / 40, 0.25, 0.85);
          ctx.beginPath(); ctx.arc(x, y, 5 - 2 * n / 40, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
        i = clamp(Math.floor((x - field.left) / G.cw), 0, 11);
        ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 3;
        rr(ctx, field.left + i * G.cw + C.pad - 3, 14 + G.ch - 3, BW + 6, BH + 6, 14); ctx.stroke();
        ctx.save(); ctx.translate(0, cy - cannon.y);
        lendRound({ aimA: a, queue: 5, clock: 0.3 }, drawCannon);
        ctx.restore();
      });
    }
    // Dark, the ball flies through; lit, it bounces off.
    function switchesPic() {
      return paintPic(520, 190, function (W) {
        var hue = BIOME_HUE[biome] || "red", y = 74, x0 = rowX(9, W), i;
        for (i = 0; i < 4; i++) gButton(hue, "a", false, x0 + i * G.cw, y);
        for (i = 5; i < 9; i++) gButton(hue, "a", true, x0 + i * G.cw, y);
        gArrow(x0 + 4 * G.cw + BW / 2, y + BH / 2);
        gBall(x0 + 1.5 * G.cw + BW / 2, y - 22, { vx: 0, vy: -C.ballSpeed });
        gBall(x0 + 6.5 * G.cw + BW / 2 + 22, y + BH + 50, { vx: 0.45 * C.ballSpeed, vy: C.ballSpeed });
        ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x0 + 6.5 * G.cw + BW / 2, y + BH + 6, 18, 0, TAU); ctx.stroke();
      });
    }
    // Two banks: a tap lights one and darkens the other.
    function banksPic() {
      return paintPic(520, 170, function (W) {
        var a = "red", b = hueB(a), x0 = rowX(9, W), i, y1 = 30, y2 = 30 + G.ch + 22;
        for (i = 0; i < 4; i++) { gButton(a, "a", true, x0 + i * G.cw, y1); gButton(b, "b", false, x0 + i * G.cw, y2); }
        for (i = 5; i < 9; i++) { gButton(a, "a", false, x0 + i * G.cw, y1); gButton(b, "b", true, x0 + i * G.cw, y2); }
        gArrow(x0 + 4 * G.cw + BW / 2, (y1 + y2 + BH) / 2);
      });
    }
    // The cage: lit buttons all round, glass inside, the ball shut in and running gold.
    function pocketPic() {
      return paintPic(520, 252, function (W) {
        var cols = 9, rows = 5, x0 = (W - cols * G.cw) / 2, y0 = 6, hue = BIOME_HUE[biome] || "red", c, r, x, y;
        ctx.fillStyle = "rgba(255,216,74,.1)";                     // the pocket, washed in gold
        ctx.fillRect(x0 + G.cw, y0 + 3 * G.ch, (cols - 2) * G.cw, G.ch);
        for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
          x = x0 + c * G.cw + C.pad; y = y0 + r * G.ch + C.pad;
          if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) gButton(hue, "a", true, x, y);
          else if (r < 3 && !(r === 2 && (c === 3 || c === 6))) gPane(r === 1 ? 3 : 2, x, y);
        }
        gBall(x0 + 5.2 * G.cw, y0 + 3.5 * G.ch, { hot: true, vx: -C.ballSpeed, vy: -0.4 * C.ballSpeed });
      });
    }
    // The lake, and a ball on its way into it.
    function lavaPic() {
      return paintPic(520, 230, function () {
        ctx.save(); ctx.translate(-100, 130 - field.floor);
        lendRound({ aimA: -Math.PI / 2, queue: 0, clock: 0.6 }, drawLava);
        ctx.restore();
        gBall(300, 70, { vx: -0.25 * C.ballSpeed, vy: C.ballSpeed });
      });
    }
    function tonesPic() {
      return paintPic(520, 110, function (W) {
        var s = 1.6, step = (W - 20) / 5, i;
        for (i = 0; i < 5; i++) gPane(i, 10 + i * step + (step - BW * s) / 2, (110 - BH * s) / 2, { s: s });
      });
    }
    function comboPic() {
      return paintPic(520, 160, function (W) {
        var x0 = rowX(8, W), i;
        for (i = 0; i < 8; i++) gPane(i < 3 ? 1 : 2, x0 + i * G.cw, 8);
        ctx.save(); ctx.translate(W / 2, 112); ctx.scale(1.3, 1.3);
        drawChainAt(12, -115, -20);
        ctx.restore();
      });
    }
    function toughPic() {
      return paintPic(520, 130, function (W) {
        var s = 2, w = BW * s, gap = 70, x = (W - w * 2 - gap) / 2, y = (130 - BH * s) / 2;
        gPane(2, x, y, { s: s, tough: true });
        gArrow(W / 2, 65);
        gPane(2, x + w + gap, y, { s: s, cracked: true });
      });
    }
    function starsPic() {
      var src = CONFIG.shellArt && CONFIG.shellArt.star, box, im, i;
      if (!src) return null;
      box = document.createElement("div"); box.className = "bt-gstars";
      for (i = 0; i < 3; i++) { im = document.createElement("img"); im.src = src; im.alt = ""; box.appendChild(im); }
      return box;
    }
    /* A biome: its painting, and in front of it the bank of buttons, the
       powers and the living glass it brings, as they stand on its board. */
    function bandPic(b) {
      return paintPic(520, 240, function (W, H) {
        var B = BIOMES[b], a = typeof ArtImages !== "undefined" ? ArtImages[B.scene] : null, s, w, h;
        var items = [], i, x, y, sz = 1.25, step, live = LIVE_ORDER, hue = BIOME_HUE[b];
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
        if (a && a.width) {
          s = Math.max(W / a.width, H / a.height); w = a.width * s; h = a.height * s;
          ctx.drawImage(a, (W - w) / 2, (H - h) * 0.45, w, h);
        }
        ctx.fillStyle = "rgba(7,10,30,.42)"; ctx.fillRect(0, 0, W, H);
        items.push({ btn: "a" });
        if (b > 0) items.push({ btn: "b" });
        for (i = 0; i < B.powers.length; i++) items.push({ bonus: B.powers[i] });
        for (i = 0; i < live.length; i++) if (B.live[live[i]]) items.push({ kind: live[i] });
        step = Math.min(BW * sz + 14, (W - 24) / items.length);
        x = (W - (items.length - 1) * step - BW * sz) / 2; y = H - BH * sz - 30;
        for (i = 0; i < items.length; i++, x += step) {
          if (items[i].btn) {
            ctx.save(); ctx.translate(x + BW * sz / 2, y + BH * sz / 2); ctx.scale(sz, sz);
            gButton(items[i].btn === "a" ? hue : hueB(hue), items[i].btn, true, -BW / 2, -BH / 2);
            ctx.restore();
          } else if (items[i].bonus) gPane(B.tone, x, y, { s: sz, bonus: items[i].bonus });
          else gPane(items[i].kind === K_WARP ? 4 : B.tone, x, y, { s: sz, kind: items[i].kind, now: 0.4,
                                                                     tough: items[i].kind === K_SEED });
        }
      });
    }
    // A living pane between two plain ones, or the shield up and down.
    function livePic(kind, tone) {
      return paintPic(520, 130, function (W) {
        var s = 1.8, w = BW * s, gap = 30, y = (130 - BH * s) / 2, x = (W - w * 3 - gap * 2) / 2;
        if (kind === K_SHIELD) {
          x = (W - w * 2 - gap * 3) / 2;
          gPane(tone, x, y, { s: s, kind: kind, now: 0.5 });
          gPane(tone, x + w + gap * 3, y, { s: s, kind: kind, now: C.shieldUp + 0.5 });
          return;
        }
        gPane(kind === K_WARP ? 2 : tone, x, y, { s: s });
        gPane(kind === K_WARP ? 4 : tone, x + w + gap, y, { s: s, kind: kind, now: 0.4, tough: kind === K_SEED });
        gPane(kind === K_WARP ? 1 : tone, x + (w + gap) * 2, y, { s: s, alpha: kind === K_SEED || kind === K_SPLIT ? 0.55 : 1 });
      });
    }
    function mixPic() {
      return paintPic(520, 120, function (W) {
        var s = 1.5, step = (W - 20) / 4, i, k;
        for (i = 0; i < 4; i++) {
          k = LIVE_ORDER[i];
          gPane(k === K_WARP ? 4 : 4 - i, 10 + i * step + (step - BW * s) / 2, (120 - BH * s) / 2,
                { s: s, kind: k, now: 0.4, tough: k === K_SEED });
        }
      });
    }
    /* A power: its pane, and what it does to the glass around it. */
    function powerPic(kind) {
      var tone = { row: 0, col: 0, multi: 2, bomb: 2, big: 1, fire: 3, magnet: 4 }[kind];
      if (kind === B_ROW) return paintPic(520, 100, function (W) {
        var x0 = rowX(8, W), i, y = 29;
        for (i = 0; i < 8; i++) gPane(tone, x0 + i * G.cw, y, { bonus: i === 3 ? B_ROW : null });
        ctx.globalAlpha = 0.5; ctx.fillStyle = "#22d3ee"; ctx.fillRect(0, y + BH / 2 - 8, W, 16); ctx.globalAlpha = 1;
      });
      if (kind === B_COL) return paintPic(520, 220, function (W) {
        var x0 = rowX(3, W), c, r, x;
        for (c = 0; c < 3; c++) for (r = 0; r < 4; r++) gPane(tone, x0 + c * G.cw, 14 + r * G.ch, { bonus: c === 1 && r === 1 ? B_COL : null });
        x = x0 + G.cw + BW / 2;
        ctx.globalAlpha = 0.5; ctx.fillStyle = "#a855f7"; ctx.fillRect(x - 8, 0, 16, 220); ctx.globalAlpha = 1;
      });
      if (kind === B_BOMB) return paintPic(520, 200, function (W) {
        var x0 = rowX(5, W), c, r, cx, cy;
        for (c = 0; c < 5; c++) for (r = 0; r < 3; r++) gPane(tone, x0 + c * G.cw, 28 + r * G.ch,
          { bonus: c === 2 && r === 1 ? B_BOMB : null, alpha: Math.abs(c - 2) > 1 ? 1 : c === 2 && r === 1 ? 1 : 0.55 });
        cx = x0 + 2 * G.cw + BW / 2; cy = 28 + G.ch + BH / 2;
        ctx.strokeStyle = "rgba(255,180,79,.85)"; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(cx, cy, 82, 0, TAU); ctx.stroke();
      });
      return paintPic(520, kind === B_MAG ? 300 : 200, function (W, H) {
        var s = 1.6, px, py, i, a, cx;
        if (kind === B_MULTI) {
          px = (W - BW * s) / 2; py = H - BH * s - 10;
          for (i = 0; i < 3; i++) {
            a = -Math.PI / 2 + (i - 1) * 0.5;
            gBall(W / 2 + Math.cos(a) * 110, py + 10 + Math.sin(a) * 110, { vx: Math.cos(a) * C.ballSpeed, vy: Math.sin(a) * C.ballSpeed });
          }
          gPane(tone, px, py, { s: s, bonus: kind });
        } else if (kind === B_BIG) {
          px = 60; py = (H - BH * s) / 2;
          gPane(tone, px, py, { s: s, bonus: kind });
          gArrow(250, H / 2);
          gBall(330, H / 2, { vx: 0, vy: -1 });
          gBall(430, H / 2, { vx: 0, vy: -1, r: C.ballR * C.bigMult });
        } else if (kind === B_FIRE) {
          px = 60; py = (H - BH * s) / 2;
          gPane(tone, px, py, { s: s, bonus: kind });
          gArrow(250, H / 2);
          for (i = 0; i < 3; i++) gPane(tone, 300 + i * G.cw, 40, { alpha: i === 1 ? 0.25 : 1 });
          gBall(300 + G.cw + BW / 2, 40 + BH / 2 + 12, { fire: true, vx: 0.2 * C.ballSpeed, vy: -C.ballSpeed });
        } else {
          px = 20; py = (H - BH * s) / 2; cx = 340;
          gPane(tone, px, py, { s: s, bonus: kind });
          gPane(2, cx - 120, 40); gPane(1, cx + 70, 60); gPane(3, cx + 60, H - 90); gPane(0, cx - 130, H - 100);
          ctx.save(); ctx.translate(cx - 40, H / 2 - 30); ctx.rotate(0.8); ctx.scale(0.75, 0.75);
          ctx.drawImage(sprites.plain[2], -BW / 2, -BH / 2, BW, BH); ctx.restore();
          gBall(cx, H / 2, { mag: true, vx: 0.4 * C.ballSpeed, vy: -C.ballSpeed });
        }
      });
    }

    function bandName(b) {
      var B = C.web && C.web.levels && C.web.levels.bands, l = Lang.code ? Lang.code() : "en";
      return B && (B[l] || B.en) ? (B[l] || B.en)[b] : "";
    }
    function bandLv(b) { return b * 6 + 1; }
    function powerPage(kind, lv, lines) {
      return { id: kind, title: Lang.t(BONUS[kind].word), lv: lv, lines: lines,
               pic: function () { return powerPic(kind); } };
    }
    function livePage(kind, tone, lv, lines) {
      return { id: kind, title: Lang.t(LIVE[kind].word), lv: lv, lines: lines,
               pic: function () { return livePic(kind, tone); } };
    }
    function bandPage(b, title, lines) {
      return { id: "band" + (b + 1), title: title, lv: bandLv(b), lines: lines,
               pic: function () { return bandPic(b); } };
    }
    var guide = {
      chapters: function () {
        var pct = function (k) { return Lang.t("{p}% of the wall").replace("{p}", Math.round(C[k] * 100)); };
        var panes = function (n) { return Lang.t("{n} bricks in one shot").replace("{n}", n); };
        return [
          { key: "basics", label: Lang.t("The basics"), pages: [
            { id: "shoot", title: Lang.t("Aim and shoot"), pic: shootPic,
              lines: [Lang.t("Drag to aim and let go to fire. The dotted line shows the next five bounces.")] },
            { id: "switches", title: Lang.t("The buttons"), pic: switchesPic,
              lines: [Lang.t("Tap while the ball flies to light up the buttons. Tap again to switch them off."),
                      Lang.t("A dark button lets the ball through. A lit one bounces it back.")] },
            { id: "pocket", title: Lang.t("The pocket"), pic: pocketPic,
              rows: [[Lang.t("Each brick in a pocket"), "+" + C.pocketBonus]],
              lines: [Lang.t("Tap as the ball enters a pocket walled by buttons. It stays shut in with the bricks.")] },
            { id: "lava", title: Lang.t("The lava"), pic: lavaPic,
              lines: [Lang.t("After a few seconds of flight, the lava pulls the ball down.")] },
            { id: "tough", title: Lang.t("Tough glass"), pic: toughPic,
              lines: [Lang.t("A brick with a double white rim takes two hits. The first one cracks it."),
                      Lang.t("A power breaks this brick in one go.")] },
            { id: "colours", title: Lang.t("Each colour has its price"), pic: tonesPic, lv: 2,
              rows: [[Lang.t("Red"), String(C.colorScore[0]), COLORS[0].core], [Lang.t("Green"), String(C.colorScore[1]), COLORS[1].core],
                     [Lang.t("Blue"), String(C.colorScore[2]), COLORS[2].core], [Lang.t("Purple"), String(C.colorScore[3]), COLORS[3].core],
                     [Lang.t("Rainbow"), String(C.colorScore[4]), COLORS[4].core]],
              lines: [Lang.t("Each brick scores the points of its colour, times the combo.")] },
            { id: "combo", title: Lang.t("The combo"), pic: comboPic,
              rows: [[panes(C.comboStep), "×2"], [panes(C.comboStep * 4), "×" + C.comboMax]],
              lines: [Lang.t("Every brick broken during a shot counts, even by a power or an extra ball.")] },
            { id: "stars", title: Lang.t("The stars"), pic: starsPic,
              rows: [[Lang.t("1 star"), pct("starOne")], [Lang.t("2 stars"), pct("starTwo")],
                     [Lang.t("3 stars"), Lang.t("The whole wall within par")]],
              lines: [Lang.t("Go one shot over par and the third star is lost.")] }
          ] },
          { key: "band1", label: bandName(0), pages: [
            bandPage(0, Lang.t("What this biome brings"), [
              Lang.t("Only red buttons here. You meet the row blast, then the column blast.")]),
            powerPage(B_ROW, 3, [Lang.t("Break this brick and every brick in its row breaks too.")]),
            livePage(K_WARP, 4, 4, [Lang.t("This rainbow brick jumps to a nearby free spot every three seconds."),
                                    Lang.t("The rainbow brick flickers just before it jumps.")]),
            powerPage(B_COL, 5, [Lang.t("Break this brick and every brick in its column breaks too.")])
          ] },
          { key: "band2", label: bandName(1), pages: [
            bandPage(1, Lang.t("What this biome brings"), [
              Lang.t("From level 11, yellow buttons join the blue ones.")]),
            powerPage(B_MULTI, 9, [Lang.t("Break this brick to release extra balls.")]),
            livePage(K_SPLIT, 2, 10, [Lang.t("When split glass breaks, new bricks appear on every free spot around it."),
                                      Lang.t("These new bricks count in the wall, so break them too.")]),
            { id: "banks", title: Lang.t("Two button colours"), pic: banksPic, lv: 11,
              lines: [Lang.t("A tap swaps the two button colours. One lights up as the other goes dark."),
                      Lang.t("Every new shot starts with the same colour lit.")] },
            powerPage(B_BOMB, 11, [Lang.t("Break this brick and the eight bricks around it break too.")])
          ] },
          { key: "band3", label: bandName(2), pages: [
            bandPage(2, Lang.t("What this biome brings"), [
              Lang.t("Here you meet the big ball and the seed glass.")]),
            powerPage(B_BIG, 15, [Lang.t("The ball that breaks this brick grows bigger for the rest of its flight.")]),
            livePage(K_SEED, 1, 16, [Lang.t("Every second, seed glass grows a new brick next to it."),
                                     Lang.t("Seed glass takes two hits, so break it first.")])
          ] },
          { key: "band4", label: bandName(3), pages: [
            bandPage(3, Lang.t("What this biome brings"), [
              Lang.t("Here you meet the fireball and the shield glass.")]),
            powerPage(B_FIRE, 21, [Lang.t("For five seconds, the ball burns through bricks instead of bouncing off them."),
                                   Lang.t("Lit buttons and raised shields still bounce the ball back.")]),
            livePage(K_SHIELD, 3, 22, [Lang.t("While shield glass has its shield up, the ball and every power bounce off it."),
                                       Lang.t("Wait for the shield to drop, then hit the glass.")])
          ] },
          { key: "band5", label: bandName(4), pages: [
            bandPage(4, Lang.t("What this biome brings"), [
              Lang.t("Here you meet the magnet and all four kinds of living glass at once.")]),
            powerPage(B_MAG, 27, [Lang.t("For five seconds, nearby bricks fly into the ball.")]),
            { id: K_MIX, title: Lang.t("Living glass"), lv: 28, pic: mixPic,
              lines: [Lang.t("The bricks living glass adds count in the wall, so break them too.")] }
          ] }
        ];
      }
    };

    /* --- THE LEVEL LAYER (web target) ------------------------------------
       The three-star finish: the web shell has already played the slow
       motion, and the round ends through the game's own result so the end
       screen keeps these stat rows. Ignored by the playable, which has no
       levels — see docs/LEVELS.md. */
    return { reset: reset, update: update, render: render,
             onDown: onDown, onMove: onMove, onUp: onUp, onResize: onResize,
             levelWon: finish, levelTally: tally, levelRules: levelRules, levelFaults: levelFaults,
             applyLevel: applyLevel, guide: guide };
  })();

