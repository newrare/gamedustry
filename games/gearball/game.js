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
    intro: { logo: null, demo: "tap", caption: "" },
    keyboard: true,

    /* The round's notices dock over the foot of the frame: the top of the
       machine carries the first gate's padlock, the one a player has to tap
       at the very moment a notice would land on it. */
    notify: { round: "bottom" },

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
       A playable has no level and no menu, so it ships the first window alone
       and plays all of it. */
    music: {
      volume: 0.10, fade: 1.8,
      menu: { from: 0, length: 33, rate: 0.85, gain: 1 },
      biomes: [
        { from: 35.25,  length: 30.83 },   //  1-6   Workshop   bars  0-14
        { from: 66.08,  length: 22.02 },   //  7-12  Glassworks bars 14-24
        { from: 88.09,  length: 22.02 },   // 13-18  Maelstrom  bars 24-34
        { from: 110.11, length: 22.02 },   // 19-24  Depths     bars 34-44
        { from: 118.92, length: 26.42 }    // 25-30  Clockwork  bars 38-50
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
      hintSpill:  "It rolls behind the machine to the red socket, and costs a heart"
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
      /* THE MACHINE. Each biome of the level map is its own layout (section
         6, LAYOUTS), from one switch to six; a round with no level — the
         playable, a free round — plays this one (0 = the first biome). */
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

      /* THE COMBO lives on the wheel hub: +1 per marble delivered, a jump for
         an electric on target, broken by a shatter or a wasted electric. The
         multiplier is its tier + 1; the tiers are reachable inside one shift. */
      tiers: [12, 35, 80],

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
      // assets/audio/sfx/*.{mp3,ogg}, trimmed and re-encoded mono 32 kHz / 64 kbps
      // pop: "data:audio/mpeg;base64,SUQzBAAAAAA…"
      // assets/audio/music/gearball.mp3 — the playable's bed: the first biome's
      // window (CONFIG.music.biomes[0]), looped and crossfaded by Music. The web
      // target swaps it for the whole track (web.music). Re-encoded mono 44.1 kHz / 64 kbps:
      //   ffmpeg -ss 35.25 -t 30.83 -i assets/audio/music/gearball.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3
      //   node tools/lab/embed-asset.mjs music.mp3 --key music
      "music": "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAASeAAPFtQACBQgKDQ8SFBcaHB8hJCcpLC4xNDU4Oz1AQkVISk1PUlVXWlxfYmRnaGtucHN1eHt9gIKFiIqNj5KVl5qcnqGjpqmrrrCztbi7vcDCxcjKzc/R1NbZ3N7h4+bp6+7w8/b4+/0AAAAATGF2YzYyLjI4AAAAAAAAAAAAAAAAJAXNAAAAAAADxbW/R9s8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAA8AAAaQAAAAhPJtYAYSNsK0zNTMGNFUOLuk0hL4KYXfXw8MSQy/ydJpKkw4JCdAulF7E4vYnV1f3/1dRebEOjo/GUdHn//Kyji0eWXIj///+xWIYHG/m3Zoz/MmtBsyqADG2Aky3QcFOnk7z3ClocB58DhcA5E2Zx64dmd507Est9QvgTWGLQMMMiQ6lBoOB4opWrt6F2RT8HQSEYJe1DE7L+crxutRX1KF6ICERGlwvlenesH38Pgh1OeXD8u6t8ufn8T/YXIVHPZ7/+1LENYAOfI0Q7LMlwmOWJKm9MtNR0H3eNP9RyDjVd/yStIgR0kJDynQIHklgEEiMOLurWTrMDITHwxWxfkrYQNA6Y9l2WvKKKEyJgpZ8mC4XCmupvgo6MQRQgSM2sjOiEWEDKMDRJRELBQBTlipABFRpmgjPnYCAJfRpqtUCrAMHLnJWt0BgIva4wHDnHhmsaCDaaV0ZEYTCCKBWRkC6ctrkLZf+l+pZSynI5aS3zCBxhvp3f+4BqSPMAMPUATKZABS+dpmTcmcRF7gApdchZ//7UsQNAAo4py2sMG2JSxMlKZek+JorMqioSjAvh7Cv3tmtZSF8wBi8VpXbNrSsSM97uWgqZwvUBcITrBXblP5wLF6NhdjQpPzf+3/oOgkAAFIwFVGAnWhdV+sRvUMzHQs/mchbO4s+4sTN2+D9QG+/u2KlRREWRKrLGGUopTxy6lbLfnl/sLwiEquXkep72kxzFidiLV7BCwmQWjjv1roMQUAC8AvUTpRHJsh8lkRBIVRZKh4WzQw28Vl81AIKqTRwNrGJFoiBdGwTiEUNzSrF//tSxBiACkirMTWEgAlDk6znHrAA3VqJVpXb9/P7q7+npZsarPPG3Pll+F96qr/0s95aJtT6oIKKSCCCCCCAI9i4UFIJvNiIeZOCfU+VetPGZNHeBOCb+4nm5KHTH/ZMzhoHk2K//HW44fgQZ5FY9/+cfbHMmYXPHeUEBk4LhJJzwQc7jv8P1RggAAAAAClezs94CGNeYhEw5SSDSFpzDFBxitDoP9IIZaKa4lFU1X6qIg5D+sMRJd28I4l4RQAj8STEgBiSiU+Wb29Wgo1nrYb/+1LEJIARwOFhvYYAAa0m7WjzFiPHyNIhQa70dExMEZsxU4ZRtiFpyewNWbW/VnoGu0100ZXLo2a85rMBoeEzQitKgYaw8R55MSgyWJAsnnklV+LMMWwlypUUoUACSVLg+QD8QA2ipXRd3AXQBigoaXND26XJsl4hQLk4d5WDu+DHfKTzWnJcm0VqWbMUqxcwqjnMhzC6kldKCOqLz+edw+NI9rJFf/01cBDsQKUjyb2yiaXclBf0RmHef/jPYw9mTaYpalUAAApxBGGERFqKqf/7UsQFgIrUzWZsJK8RkiBuJPQOLihuL1QxB8KljkxyJLDQiShmC9gQPXSqG0FA9CT0ntZmwheCjkqzvPR7JGBb2kuYV0b/m6+blHxj0lv2UgeIDnYQILL5ClaalIFIn0iSjMA5KQ3S4nAb67YyDHYnFe/Ym6pvppjV8aE8AcRZsMwcyJDjmowlYim95TX6xndRUdiA3gllIFTER7Txeb25qey5Y8jlkchFzN///SuYIQXCan3SosWIKt3KKtieWgBI9pz1KgAACnAKaRIbuWD8//tSxAWDykkDZGw8o8FEkmxBhhkgKM4y5HQYaiQwqTvqw5wV3XVDncIGWYkzoMVz3y7iA46O64mUYU76BIVPdztN2b3687XfsQqZPfRnrSyI/EyqTVto8lTTvsoLEzgdnDWk80CC72BPoqANhWBQ1bOMLhxEY3ArKXjAiF7A916I5d5nzAc7HXj9kb9MS/gTm/5+5ygMaeZqePOyViyI2xQ586p8J+5VA+t090V1UUAAlLgIkKFXG5rVgaKONLV6DHBeVG7rDoi+7Jg83FGZKDv/+1LEEYAJuTlo7DBJATeb7R2EibA6i1JR3eJIWxWCyOlBPVvW0c/2ttXcW7+jN9sjtcZO1ltsbp/kTs/8W7hkBAhBclBdsac+b9Ps2OKNaePB+9Ndge8NIGxK6XLZfs3KWbPdqEZNJk82cC1b/e30ui8H1bof+6koZasAK+xmumt2cGi76+BxCP26vQhaCAKd4A4AcyZGKS0rTqOoupHiJrZhQYiKdXP6nq8Ln0HD+Jr/+c3O18a0Ito58TbU2yvoh9R//0R0oJr7uIFG38A56//7UsQhgAl0uWZnpK8BSpvtKYMNiL4gOBAQDLmKYPgIARLmvAKm/j8RSGFBE3FFognm5Vt94zFqDJD+hQRM44sjrl6nUrD5hJysRqFTzE/w7kvwGZeS/TXjEXgV5P34+pXgdxIh+609/LAdgNCZZ3rqDAAQAhOXAHhB2FHVutad9TqMLwXUum2CJEA6Ew2TSbkInbHSVh4rD8rzPS06WWpD1IjbuSIduJjja7T23TKGNp6ubaqD11ekW1WofDwp16AA7w6RgOiAh1B0fI+7SsBK//tSxDAACfjdZUwkqwFIF2vJlhXYEHKNrCWHT6jq14RExBr1HBsdOXT1Tj2bvt5yVxrqKNkVRPF0EUECtlapD/HEX6M3KXIMAWMCAwPtdFgD7dTSC92igG7yeAwNTWKMuZMm21xuQ9FGuXgRWmIbxDmM/PlvokxpsCdYAiM5Rool2PMYr3JnEJVHKqnQ4Ymo5RUw2iPtWEZ6aaIS/YqTPIdkjnH7a/o97/+gVbquZVMhSHJVPp0vZZxz9NFodv3NRnRF3ba5pm0j/wW3R/IGVi7/+1LEPQAKeMtgTDDrQUmcruTxqtakvRPocLPeOI22F+QIfS9RagOji/VCEuva7Gv+VOvWfXoW9HQ31u//KMQ39dUAAlE00RG5OU1p8F9ui5awostkroOZMv4OMgoPPImQ/bBSlmpDYMUzXNep/Fv5ypPZK1KdFRZTV72dARRvWPjKer1L8q3HvHN63ec9H/8kTYz44gkFFJRdyg7SnZGCsIehynNcYC3m6aDVpGLVfafX3FZjbrxLF+jq0ytTiWk3qehkycYYSCgZOZzj5sTv+//7UsRHgQpQu2BsJO2BRBytHYSdMkqn2vb5/Qvvo1+2r/pdqCo5/ofWhQIEgBu7gPYpB6PnxwJ8U9AFIXoaiITh2mJSMx4YN4i4TnsgUCHHJm85v5jXTltndC1OmgUr/A0Z29CJb7r6GXXy/20Zly9bt8DoueR1uO/8t1oAgAAgBNSABVDgLqTVyDkQxUl9MQWokyNkvhFqQtNjm/AcwD/kFcE7Hnubfq+ZQw13yzMkxuE9EePrMEoZnUJcQh/6RUWrt+t+lBpIPKvs0/R0KgUF//tSxFOACkkDZueM8sFHl2yo9h1oiSJLblGMPSn4a4eowu6hUQSRgwwwTMmkCGDUZdCfYJmyAStRu4ZuWfyGvrQ/x19RZT+Vf/EIa/VCgxsOfkvI4yxDeH0gal7tpxVQw+MDbXU01KIBAbbmBWQMlkMWl6wbtOY4gVFEmKL0pANFN1q53K5YOqyiTlN3qZf0sVGaonnkqVEp+XSvuo1InJnZghL79KFo8X3+izTnXM9Q9PZTn0yt7ArpACmjVxAKSSIaGoYiurqqnwYgUo6rWRj/+1LEXwAKfL1vR6Tp0UyXrF2GHWh6HIiuPnqiR0OoSqJZ6SG6lVGHmxr6yfoc1f3kSbSPh7N8mcQn8Yz0m6/DLLjbWiAMCqtvJo+z22M+9lXoEkaWVKbHKWpvYY15vQxWnCJnDmLuYRGE1C/ficdvpE67cLkqs73lfoWuL99fy8nwrYsronigAARs65wNgo8Xoe6XZZ7wkxJUkwZanyQF0QGAAk7fkLjGNWSMt5BTYYy4oBODyJRUTYjRM6/pxTPtsdGIpa1v/na9V2zJQdFkn//7UsRpgAqAp1xNMQtBO5XupPSJNn/01hj5K7TkxYSH3rYABKsMSwysep156pjJdPsd62VCCBARswC7U0GcyV22ew3ANsqLY+yVvaWUy9mlRMekTTYVkpH2lhmr15jzseZWmZNJa2noNNp6vYQAgz/qnq/mOs04wysmoYj9ZP1bKw/7VQAAAZT+QFOBnMzCQjAHCCQIDLBogQga6aBEIGhacwcMNeOS11yGoAgdGRvX5UtPRsin6umQZSsWsQUQ/1LHelxdeftTrWmBFHXPBfb3//tSxHYACeybZOwwqYE7m2ydhJ3Y40blATXP3VYxrch3FL9V2az4SiQyuzShe2YviZnGlWpIy207yF7tX7aoX8sTF/Lc2xz+i9/x4jCyimmLu25gpPANWcxqaMqZcaIwAcIXCNNAEWFGgcZCAqJr1MKRma61JVrgOeqksGjnKJNLiYBEGUsbJoAo7S3YI2b26BvL6M5MDr0nOHdROQWK017aFQb25uO5S5amIF3ybTGoSiFZ8rN5lizd6i1tlMEs/zqz/Il0d3XZhCTW1qzbs5//+1LEhIOReTNQbL1TSj+vqk2lirAC9C/N/VBtA6aGIHoWAWEkTzSCAAJJVOo5PcHTSCJZmhBtRphSA9KGtYslNYMW0XubmIQI2j+CRmChRAkMRgjaKilCC0VpmGvMhSMeQlw3PnskLSsfYtVvialpgbVYElS2aWKQJ2bB9Rwvc0jDhjOpI9iAJZD0W7IVMeyErKsSl5U721tnyAl9/Kr7OdjF2/6/2N0r+XU7IfZ8pKcNPCICQiEP+yFRZRQSKAYWDDRZVORdLwNJbLC5W/UDCf/7UsRUg5DtdVJtPU3J9a4rTaep+mrW3N1D3FJgQkQ6NPNo2Zpt6lkg6kn6Rj/4lQnUk9GmJf+sf31h9fP1BK2u/k/oDot9C78g0dG2OFn79Depy2UXL7WzS+tb3HpNucT/PZm3U8wv2d+Qhk3GYUh2AABAlNVTMyBGFDMQxSNNU9AKtYGA2SCqRLWlgW5srjFG02A2svwxNw3Qd0qBVB4Me11m8lFn8CJKy6bNHeP9wjRroYg8QY6RFL+9Sln6bw1vuacYprVFcNKtFyqxQWQ2//tSxDADj/E/Um09VMHwJSrNpiqY/5Ozdeo6/v5PtX0P/6v3FZuUPP5RLgxQwYOh3doP4fSd5h6BtU5ELKyRe9XS9B4IIhxhWI8YSbfdmDMHTpX/d+UOTDjlMmgp5m4kwOmrszPznnpihXZ9HRQ697o9RxLp5Vevcseh6W+1VZyBmjEa6IqIecDgpMecS9RirrZ1qg49d/Ir6WNyZ+b5D6jFaj0w65yHnAzjnRdQDI6KA4SQVJKYcoOSWm3FpqjEfTJXQXEQlLCo9PmoY/0Qd8T/+1LEEAIOOSli7KUPEXsibN2EjeIExoWUP0J1As05nDL3ummT4/aQ1u4dd1bjv4Sr95+Mup4JHded6wD1///0P1rO2UaWszFTjVgPR0d3FVoMufhPSrblBmoW1akKNBAltShKadZSgJKbtA8UsCS9aTHmurDsVjJYE9DW3T5TNZl/CIVECMYRORFJnGn+Vz6BIbb+zlTyii1DuP2CzSfK58zu4cIfkRUj09c/2n/UzPn92y2eZVgSnQQ6HKwoJFLBK5YtrqoXwCTYMcMk7z7RkP/7UsQFgAnQrXDHmQ7xVZ8uZPYM9oyy/xy3nCqSwJd+ioEcLDB5SORlapSXCZB7yRg6/r/ZF07dCQXnUsWk2Qk3zFT/9o6DAuTVzLO5e3njrE7rKGunG1aBUQlEGvCag6STOifKIuBNzCASwpOaIa3/MiurVN25g+vQ5+mSVnA0h7t9IvtglGq55foW/kc/8MAHNeZ5ZCISWr/mplvbuXrGcQKCwADubDvPRey3PwQAApOUGmwZQAAXmiC76hzyShSMYh9zJBKWfQ1pOZiahuIM//tSxBGACninZuwlDtFlny4k9Km+lW1kRiLKpmoWtf/69fqezHdKYyzwQGoGRfpf7MY+WdCR9VbZQ4tukQDDauU6tX6ErBWWUrpsIKZZtLooGVRCMnegE6vI/LICwxNDANNNI66Zr5mMqDn7MXKxt2a8YizibPCJEqu9NAQ10eqgwAmupqFs51caTnsR1nmSQ76J7k//5Rv29PqVm1DkqgUSU3EW223KUSjI81TPVRGWFvNJVuC9LOLcpJJoK61swYTxWfFYthF5I66tK1DpK5P/+1LEGIAMWPl5p6GzMX8pK92UKlkoAZJSy6C3BnJ0N4+lrdqalLWNnupOvmyLtUs6lqQKxlJpp1/zh5nwp5qqnsKskE1/tQACA49gY9ICOYPaYYvMEJjxdOHHKTZ+u+CGxu+2S/F4kz2km3rnvFwtqEVniR4oXXekptVJqu8Jcg4mTF2BI09tFSekfhoS1RSkxaniTTVzjXtUc//OJd6f2/f9//yJWggFFIFJArBHgrVIXsSQTxnREQ4EeciPYTQKCapgt03E0eak26nlh/0aPv/7UsQVAAuA+2snpO1xWqmu6PQeXlwoLoCZSxU1t5SeOM0bz3SJgdlGrHxlLYnDlZ+a3ij1m36H/9XeLFW6CK1gd7Tmr8hqOaupJJJOAg6lF1UqdTxPn8I1UBMfSoXB9sB1MDYXGDCkZrJlDjyyDhAd72CRna/Vx3PvoQqImjSYOj2tcvvYdLfWnnN1VPxt//GOn+YvZldvNVVun8m9BABUgOiCKIQJa3uSues/8hSClDWZW3anhrVu2ptkqMNvSQXqQy6hbK8+Im6dTohfbHXm//tSxBmBCsVNYmwk8NGIEa1phgz6Niur8t+37fv8r7TfyP66qagYbmLeyyhqrmGPfY5Oqnv8coQGAAASnKNKCCJWQ7L4dfR5SmQykkJzl1jETlBathzclb6xRt2h0USgQAot/KgY6E5yHwvBVCfQDFk5i8HAXfPGvqkBSXKOggB0Llz9HKQfBwE8fnVqcAAwB3wwNeGcuUP7SioBBgAACk5EITHct7ADpqSBsXz8bFgdV5dXkJ3YF3DKaS5qzMmiU2X+OaiIVa/W/huZYQVlcYf/+1LEGwAKUItrTDEDUU2brE2mDTCLu3lAKMPESwdZ4ieydoEqdvb8GntF53/I0/1+tAFSzgExDGDQUPhtnkHLnjqX6E4ORrMCpVeccZ8TKLp5xaBv+jhlDOqwGObnVgN4cLL1ShzakrQ9SvFX/82Yh2VLEJj/nTknvRw7F/lHf1hW1BgvAACcQOd0zyAxoobUdQPYuxMuqWyURnFprvvUeT7z8Sdynn6uGL4JXT9PQdn4/Qy2N2CTP65bGxct2L16A2y5BkM96uI5fnRHZbzCvf/7UsQmAAs5AVxsmLaBYKSu9PSpbq+6LeyRTr/+QAxYu75QAwtRokoloqmIZCGRToV5nGKkxxF6L6MBih5sdH+bNq5C6HMq4PVJsSmmm1ypronMM6tVxf2TYgo/yckICY4gPegEaUmJUnQ72Qe+//5B//8j//K32s871gQnXLzihTDL1AHpRvVUSRbZfYqcJgLqtxg/hCyYIlsS0VwWBcLyIWlJlSGhnJNqSqfS35uz+yhsbd50KJfaTiEPxy+lbEZEp5CUiOE42bTKnU+UM//5//tSxCsADGUpXm0lTcG2JKxdlLW6yC9K//tNL+zyHW//9YjASS21TiNIBG2agyxsi151wEo1u6dxuspDBwkE9EM1GseqHbSp+Q3CLsmlW4VBHDIP9boHv9xj5PLO9urQH1FSvsgplomR1IwAYDTazLNFo+yxOzbTW+/1MsRpF11tsn/OP/z+kD3nM0OuuIS1AABhPOnoMEFMUVR1Wyukv8sGpgFyKEDSlY1DHBD8uA4NR8H2iUiOTJoNGT7KqI8WreotbeljjSLq/7cyCirN32X/+1LEIIINtV1YbTGtwc0xq52Uthp2D3FModEaz/+16lqUsFWl9SkfrWoLgpSl1vV9ePH//5xv//ofqY4MZp90I0iACRZMNrMKzpKqvWEYSMgQGmg1lLiOvI0+EQG/FMoRXpKIWTVQzACY2CuJI4EVVO3xhpfZZt1RjA5FmrrYZJ4LaQnMyVQUZl0QopGf01IWoqRZgHQj+o3Z1VpMoFfemv3/yO///mbf//T/zv+g/X1K5eVQAEAEgyuYDgCgssAmXdW+w5ubSkLVe+yJTF0kZv/7UsQOAA1Ji1jtva3Biy4u9PY1vk3xX3aZq+ZdMLaNtndVU7rOY7bjUKDGrNWLv+t97sOdCfbMW8XJuO6MD1smRhfX+r9JzgSf/+y8Lozf/8of6v8uv//6zL9S0v8yb/8u5EJRRRSJtpNGjfLEGYo1SbyjPh2jUOUCGriRUqVC72NIaLLtF74dX9el2uvLNqzGZVyawuQ4BEX0/dzvOonFzp6h+LVN+/XRmYVz/r+o2dYOtf9/6iH/rb+Zf//t/oo/zrfUHRm76av6AYBlmwhM//tSxAWAC4Encyetr/FyoCtNpDZgM81zBbT9Q9YVTntS+cBBEkyizbCPFsrZbVpltMbaN/NS1opENu+PVWmXRLycCwNl838vSTetBSSxpClID/dBtqM6FsKan/+iyyw0/tb863+XAAdrwO/TOEGKwq7VOyYAXnYEvt16WG2X0TP6Jtom13dqkqxJOvaiM5aDwohqpU062uMiI1n9DO5roa980mBWSA3q/RXqSUkpINJojTUylItqqoGiv/t5m7kep6NFBBRIokuyAFgZQu1oMCT/+1LEBwAK8RVpTDCn0X0g7SWGHT4y1iysGacv2wgtn7JbuobgbD7UI4drE+W/nYmuH+daK2erC/TGi7J6Gt+JuqGIqDoSXhQqVG1Eg4ZEHtnQQQhWRL2mORn9Bjdo8EWgFAUcjHAalLpvyvRqktjEDEc/Aw8CANzbkeO99Q2r7v76UJDyNDHOPKlze2BKCd6Dr5F7JRhW1KxOJ37Y4Gp7cUGIOnviobkr6nd3S4hGyGntQu3pHfZxZX5RHuUhEQAQS24NoIYr5SzUAepub+gkVf/7UsQJgAydFV7ssafReSzrnYepOBoHs+aFRJJpYFnk/3UgAbHXcaU+Q7fVqqX+dXQEmNFzY+nOP8qM2W2tjo3qr1pCUN+b0vjqmnZSLDzetGmiFAhrZU6j1Llyz+cdrOejH/lzn9JBSgAKnwfoK2SUU7YA462XgiTQE0wFJiNMgYK5fs3rDJU/mfKvPyDaxGhq+lanjGrtcLYSzamusXUcrdyrflRTroRhxvzK/HjJ8LhvqBONX21/lG//5v//b//Us7V1KgEggE73oMi5kGLU//tSxAWCC8UZXuwxScF2oOuNhLWYtYkxeA4wxQfgsJKUTbCW6Pz6nrXCl2Fa5DlwAf+TjewHnM18iMcYl9HShbvNdqtmi8i/F4Ib/Q3+P0neLbfgguu+YW+xEFk+vUl6j38908h0dnSAGD3KPYAKw4SWCsCdTgO1H2oN9KWLwROjxwQExwQ23IJNWbt2wVrmbLiDopx/sokDaoqzxJjbSdJIqMCCpXokD8wC7P+f/j0NUjVNlRgPrMAm3p6m/Onujl/6//+qFvVkSCHBBkoHmZL/+1LEBYALzQVrJ6WrsWglLij0Ki5PT5IWX4gJ4nmaodRkBYdUYXCWxXMZBJbfQBf6Y29EmxmKGaTupCwhTVM8apJGRgQZ/yYQfqSCFb60v5JmyJt0xl/phpT1Nqb8f2/rOf2fyHRyHQN3UxJQLCg8TMFdZCJViwZp+v3E6TEcWZqJvGWYbJxkXopPdgLPS3zh9wxxTZde9cE3MRFswm/i436CWC2d9ST9RUNQcZ5URGivgOFzFt2/b//yX/O/z/byHRUCAECAge6AWUYj4EDU3f/7UsQHAAuBB11MsUfBR5ytqPKO4thlsYZ8djITTdKP5TJYlFMKSaTTlO4mZ+VX4fARvrv2YeujEN2IVqVu5rnKiPFw4b7i4/8YgXfzf1IQ+MOM2HvNOZQpz0U/q35O38V/lgJFSRCUrAC9B+qwvRDVOBKKpwV79zc1hjgQav5r09/AgK/31GN7dZ3hGjLITQhOrCggdbq9D17hTnetVCAqs54we3IRgxbV3g7vZYogHHuLtyoBUViQU7IAtR6BqC3KNXlimuebm57cpVK+s5PI//tSxA4ACkSlbUeNdtEqGG4k9JVu+LQpFdYt6qVqcL+p2+K+nS4ooV+T8gaFUyItyFaGVYzX25Bg5kjiAiGIs0cABUKrPVtsS7d1IlMqAE2J9PiMOJlykZjvEJNxPhUVroAvH0bq1KdzmkScEkblmzDquj8xm7nvujZsKPUer/qLjjW+RpgPf3CB1nEmM4cNd7mRfS1NBVGAEpt2gQiIlTJWSxmQaxblYo3ipUSZirmJMyozeyD2kFsHBjepVDv5gzI9DDbORBhba9IgPuxIrt//+1LEHYAKAPdtR41RUUUe7WmGHPJSrK3LaUUgv0b9uv6uVQuZRXzn/Y4AUdAiWpKB4yHRV79uzDyqFECJILCxML2SiX1qAZAVezlFN/bakqR0MQfLLN0H23OHWn2PJfEIBxMeL3KNTQf/O/bpPPZugY7/452ZbU7b9YXVAAVJYARMX/BRVDcIm05+pS27mOdElFX0eqE2IGgnmb+phbqjHivTYKI9yVSmbyg6/iat8WfKhKZ3Rq3Yq/1/P62GrolEEm238eb/9v/1//lXFLppq//7UsQqgAohS2esDPDBYaluZPS1tpsDqJGV6yh1zvqhqFuSmepJJTGxbKAnM7lZIPCqngtVFd4Pwj07qbn+pUC60UHxM7J5WG/XsZJqsZpIDqq+cetlTz+pL6j//5ge//T/du63//MTfUpFFpVA3JRYM2Ckh0vH0CgJEG+DT2azz9TLwYQC+XPFguoViaUrLaWopbIBjSFpHIpm9m74Q2Y6zlR0tWn/IEPhbtJoBhrKrlC/VhwNU7/jb9vzv/xub/+U7v+kENRBUQgEoRaDgJhT//tSxDOAC1kTXGyw8UFpKWzlhjT+jJRQDnpjISVBXOWokpQzAYzjMX/a/bWChH3JsoQNqDrcfZ9dCMEhOGyKgi6bG6a1D11O5mf+TiP9d6NY0v9L7Fn/51//zv9f29a2/I+WBAAADYwIJUroojwmu/46lJmUNYjUrl1995DUe3tZCrI6VPGUUYPVasuDS8UwxHEXZh8ncLllR6hQOhug27zTPnP9H+Y9qubXlCF//lS+rh3/+8kApxgQCLOI/q0O3IKdZo/C0ZVDZokxHCg/0WP/+1LENwEKSPlc7KVQgUOfLA2GHPqY3XNencXsIY6cjY6IRg11Wjt4m71H/uQOqYx5ZvHjmQs8e7Zz06VShQu+v1QaFg1+Gdnf9dUIolgiUpbA1ZuGvFNEpDBYUPPFTJxZ3VRKbs1kfoEUXMIgxWomppwYyMyUO326B7/O1CgtNZvOdRwt/0Qwwxa+6H9qeg8Gy+yb6EHdjHhnkTElqeFXEkUyquc2meOaoJ0VwfKXGGXyiYEtkgIkzEWszeg+Uhf9DG1rSlmVh+0/J27sbPxgPv/7UsRDAAptD2tHiPFRXh7ucPYpZqZGXaQEQEwQb11eRAXv/zwV2d00Vx8JAsPPmfJwvmUYh+U+v94M4QAyFPbzuJcq5pppGboSJ0XHh2kYtNQUmICwckqfkkJZwNVwJ2aeTK5tbgYyBuKr+Pmru9cwm0jEOJ+zxmBE//EkCsrkprJtKg1ig1zr74iD/3eIflPljfoBjSbREjeunLInAtkjUALAo3IOth8HBsRgOA1C1W/9uNZ6MaKiZTlNebt1Eh87oa0/SPl+pQmYooNsjM0H//tSxEuAC0j3YUwlTUFnoi4xhLT+Dua7aGtRdCVLHTZV60B9Kygk+aeofm/9M0+r/8lVLcdjkcRRiTA5lWXB4h4iJ2lwXmkrCKLD0cUaFCS3ujYXlrLP+hAmbBSSHXyTqsg3UUvUg9PMHtoMhzFH+dNEw7kpaqdU7SI5pf+seh7/y+v4v8LjvLfKAqsBWBHNeVZvPMOyy9ZrsxJckvaL4fsLC2kMBlez+QIHWpOiYbC4TW1ZKfmHVscUpj3oxBlqDA90yg9WkifaibRiBY3/iL//+1LETwAK5Pd5p7GpsV+oLGmGKTj8qKxb/oFwr/6W/8w7/5D+IyVpZSITcmBmMxzl5Zj0Lwoz4eKxEj4wVBvAhAYrV5o4Fab3Z4guun34eEpkdEV/Hn7nNOzjXXQz4IWfWjKJglM/5w89v7DVv+gjCwv/1X/3PX/dET/3BJK1WP7kfFS71akFpg41YXM7x5k3LsdC8EobEAWutI2E46/6iePv4+ziE8+SacuacbKHeVfmlWrzH6GrS41Z+5j1Qn/8dpWURnuFmRnb7BGWOX9Et//7UsRVgAu5W2tHsO0RUCst5PYdNv8x//t/5V0pZSUgE6oAbidL+pTeHMfK50fSrSBb4LO52XJT7o45olP5vVW50pq2XzQbHFDeV/Lrq3z+o9tUvUOBPq34MUlausjgwwwcWEEW//ELvQe9b/9PIhFy3kmcGQn7ahyRZHSpVlGlnY/hAlmphd2ZCbQFNDrTkJOh/+9T2aif1kb9Th1JEhfNbsXIE4IDQlUCDnogg4QO3fp1ecAggBBwIRr0dTUAbwQpCvU81/iQBULJPC+TEMwM//tSxFqACezfa0eIdxFJlW8o8wmaFYknTQsgNEJGRJLzeTdCZXXrpPwiNEJKIqCgGrdO/i9SkuUay4wnG+/GUXERYZYXZpdoKoMFSau+yWHr54+9lcb/25UuSpgmszT97/8BnVQEIpyghQQERigKy1wFXDhUNQ1mNDFthKy6vcT2+mmtY6yISiUI5nUyeqrAjTmUdQ1DuyKVkNN0qzTjOj+OI/QJr0hx6ia8xeEnq2ybPWoAcBAACXKAStlqJmDS3fSngcVLj0JS6U+JPqUHfuf/+1LEZ4AMCONmTDEjiUCZLemGFLoI85tbJjb++L17ailSFMQy0eUry/tBoDojpl57xwgd3Tbg/iwsOXsFNuogjWbPiZ+0YLKbPgFIoCCU7QMwZQdKqKBdnQj4R6L55MBSw9TBZ7uIqrqk3qSqabXwWrnMlUof6EX3zsoQTuszfmvRDfpt1+o26fQzBGaBAwKVGwxoXpUnC8jVAIjbSISRSUAHwxDNoPpHqTcSF4kIANxAMiQpPWHeZI+u3SBtmI9yr4moeFF2OBDKskkqWCRKbv/7UsRtAApcrWtMMEfRPR8t6PSJao3xM10emvP6tTPEC7afjX3/0/5vbquvjVMgCREBBacoBEj9EKTJLVcjkC5oJpkhqWlzoWY8ZN8GOQuHkTiQczVcGUmnZ+1f2lXVcLCWsfnzr3UTk83H+Yky+8t7lC9X/2NL2dhEtyUVXvyeUQGrI02WkmIwX6qV2MKGWbKcyvOo6rnwh7ioGhsGK3MYYV2UtS2OvKhx7K6jUd6yGs6NqroM5n6ah598x9lUk3/7/9EOEQ5alEVjiaaNT9uU//tSxHmAChFJeaYMsPlJH21o8Z4iCK8ZNgqKBar8KJxUUG3FR2B5qExSTC4kDy8NTqmQj3E7s4e9qG3nDGmpLyvGLqzYf1d+/bRyavBWn4Ju+29QgDb5m+He7GF+jKb/8Z+n9n5/SgsgMF6ksx4Jv26Po0hm9iBJNNxeA71O7V1uBh+Y3qiDmEG5QZU7dKo4i+NA2W2+Vm1sob1d6D3K2lvi4v9fxlq7sn1LN/7FBzKG8xsfu+UXuGv69ootKBacXZZjBcMEJpdJILrolHhSlNz/+1DEhgAKAPl9p6DusUae7SmGFXz2Az+0MewLsvl6jUZ4nXIQs3fIj2pmPVqgoqr5N2/yA7vNP+Itqvbo+S66v9S3/5/7zfL/ln8vfLUJqttNppFNwEoZitV6EEzXk0ZZ1FM1j6fcTS9G7cmfBAq7JrWvWgGe5/2qRXKrKW+GRVGVBej4j83wlkbTJy5+lEaj7PjvS6ifp6W/tfp9PwaagAEpeDf1QMkY/AC4pJBbqP087R6xQHkruiMLo6BW96a1JUa09WM7Mv1n5Yi1e2cI//tSxJKAChj5ZqytT3FHqW6phij+J84Br61/7eOXxILEcyg5RA6enA/6jy5G32uibrba6YP4lQgAIkWAH5YVrKSZa6rWlOpyLWQpfM3CGXgSKzUJMhu11zuu2+ES4r9jH2+aiJZlKWnlRUAYc+ND1qVT6NlQx0voZ/5hhzTfPG5zKrPzy/xb1AOYdqhOFeJb1UrhutD8BQhCkouJ1UnkIUyChMuoTZIxQNr9/Apx4yqiuhQkcYcAW10K7KXGFvJSFhWCdVmJoVBlO+gvb/jfr+L/+1LEnwAKSUt3p7BLsUYU642mDXClMV0e1Sf/mf9G/6k/WgoAAABQHIQIrkgF+1bRIA9bkSKEvtKZilbhI0s4rAdHH25rWYwPt/sQF1mbxZ3g6yJuUNV31aaNHR7lsPREKxLH6UNEsNGb2yH1+z/8lbp87/ob/0b/mF/WBflySKScoZJm1M87dqJkb+KRKHoyl4L8iILlFYqxk4glnUdfJPuW9ZrRt3QYz1IEXmsXrICb8/Ki2zxxJjhCEv35j/8Tf9Sb/9v/f/p/4mO+7vN9a//7UsSrAAoc817ssOnBWyZsZZec/HRtNQb+tJBRRMIagz06TPt+dxEQFHIhZusalZHB/mRmhsO3OH9cgmOilrPI/M9CTdBkyaZhqDNmMOF4Fhz3N6CQ3/caZzMyIIACvMGfk/+n/Qn/Bf/J14mr1upUvm1hVLKYxy7MqkSpkC7EpWTZfHBgD0x0wCqwpOlycdE4wEvlWJ3Q3jbPP0mAb8ia9TTtRLZmotzkS7XDXsTdBWHH/xj0VuozT9Z5//t/0bzPFxMm2pnp9G+v1AAQIABC//tSxLUACx0zWu0lUQFeJm1ph5z6RvNOFLRBORAr3RzXkn4pe5kBRo62d67X2VUpZpUjblX3GwhFWq1VZvOu239fhA618t8XxbtpNqYPS8nQumy9FDvbWEZH/jnr8benq//t/0+/lP/T/2L/P+dqBbTccSZTSUhqPF21oEYR3HwXupmNjAyIhpJOrVc/hRosZ9hqQGvnC/uk121y2/1CJvrldNPGR1N6EJhr5wjgdbQ91RxJf/q3b0BW5/v/7f9G8V83p7EHfDsJxRtRstmKQEP/+1LEuoALCTNxR6hTsW6mbaT0qXbRoZqb2UK4RKPcyxKxXqpJZVcSS8sssBlibMWuJBgSN3XfFcdKpg/J5VP2gTrKnN18dN89VKwIBprdZ6ed6q39FmqrHItbeZ1Qs1OEqDkisZKVUSS5cBakCOmoG9qkYk6b6CDq0RhxJQkH95hXU37OF81nHERvb7YbV3L6OjyNfVX1ryN2bxR0lAzdvVtRhLtQXbInJfRHbzpU10xhaXywnUaIUB5IEpN0HFRMtkS/26QM7k3Lp+SUtqKQY//7UsS+gAvhYVtMvOvBY6lutPUXHslH0/KNt1DQgTe8dwWH3kt4ZqXLuK2cFm5sr/T79q0T2HuWNmFq95GWwnuEb5Kivk51LZd6EV/qc//aj/QEIkt7IjQI6KIkFJWFuRqZfSHYLeaA67jVX5icXlbRmX97YpJjdSxUlMy+d+60V+5VYmKTNlYf0f2m0wENocvSOevQBAb6dkC4LJuky5J5+aQk7/ep7/5//M/59P5AS2oiTjj3f9yN+pvm6glXanEikES4fiWSBCWQy0LG4xNB//tSxMCACxEfdaeg9PFRo6zphhT6ODJCQG+Tslzft5Ik2bU1T/y0+qaK9j/vPxk910ZlqUH7XUDe2IPf6b5UA7f/8APmvOV6SEUX05AKn+o8f/KH/5xb/KkiN/Hhv9BiX/lSIn+zoMAFQIgSgh8ffJkgFo1wMPWc8UYbf4zVa0wuRqq17BokJW2mzsYH1ZAoSFHIzO0nPqbw9wbed7rW7mtjNllLOyqt0U61Jg7S6q762Gt/9Zp/Uov///7/9v+ivW/pKV/On339E29flwBkAID/+1LEyAALXTVi7CxP2ZGr7GmEKsoBS9KRBeklCpip6t9MPAoKwfqDSPBNLKJfJTWHewh3Bs8CwwXsetcOxenUuhSVGCkZLGjWcgLGmEl8wKIu5nqwYjrWvSgo9PINaeMPKvoz/hV4TRCLVIJhtjNAKUbTRaJCJcGueI+Ue/Rh6olFynnpHvV8ElWGlxpEnKgx4+y4ZGhyijjnlfQv0GtnToeIvtTiWlG6wRhGYe6OixkLfsi5/r5Qt/q/t53/NRsoadkRTwc93s/7ag0pY0UkSf/7UsTGAAzVYXGnoVbxlavraZe1eEQ6TRUIIRs3UIazYQhPnEMdELhxNSziOKEKq8H6mM4PQ8RD0KJZnRDaF+j0WL+oLNHRTahILdusZxTe1LUsZVWf9v/Pdfr+//+pP29vfubf6jNCvB3VEXlQBIQJACT3B+mdlVyo3MR9hpY6JdpRUmNddFO1XgVP6eHGuWivy9uUEZvjao/vH6Oae9MX0OhI14GsjvfQCT1/E4N26IwFPb3/6Fv8qLPM9P+V/9v9SGjZ7fTVBKWJxpJqwG6C//tSxL4AC9TjW00xR8Fqpq509KmmfE8cCcE1hI1bW1QoztlnUk239kJr56Kbafc18/hmJmBAxHYKNZAYkVohzRtPwlABZdyQPw9RKbSdKdwjFzzLrceF3+g393/0duW6/I///5pmu//0Iu/1mEAN8I/Ctg9CLEp9oJGWKdQFVbeo0TCLg14/NEh06OEeEECBalIPI6nrBMPWsdhH1bGHt1vLC+/g6zWE8En/F+KU+/kmq89P0gL+EpwzRvq3+eIf4ZqVCACc4KrzQg7lUXRkZUr/+1LEvwAL0WFzp52v8Wapq6mHnPid1VtAlyZy6KC5crKqHiJAfR8yQ4qYeE1XPrTbeiC3J2IkaCVBU6bgvrzxBlUUil6XjnQfqHaojDYnfPO93AHy2z9YW/0gLIgAAC3QloAH4tuu9218wMIATFBEAdAJQrDl4A8JYoILNasEoF1y88gJWeipmK0U4QYx0dGR5tA7oqdD8vJ/l+qEA3vfMz/iLft30/nAT//8F0oVABJTWAc4L0CKfJqKNGHGnlpkL2d8aA3rh8hrBdm5OlLEp//7UsTAgAwFS2dHpPhRWJJrjZYhsCkyWl63fLQzOsrJhgbaYVJvQ7OFDoPegy914+v8df6uPaeVf//2/nfypP+n8f/lQAQCdgVg3WDJDygkRc5U0b1MRNwVBWbPQdAKMGF5kOkJE8rXpyGRzq5igZLp8rDyjc2OtTRK3WZoSKXDXXWoiGkz7xyavO/5g/6z3p5X3c729fX57icSdbUQFsgzKDCZDZektaUxx1jrcCJM2Xn2xmch+wxUrbarfk0WfrSVGEeLEwqctT9SyaaBYEHN//tSxMMACmyRYGw9J4FNKOzphIj6boJ9vK/0Hm/KDv8od7GoKH7Nm/xx/2GPOdHV6QATCSlAgFuqnKtSMuFefqWwPITEJdQqGTEmBauea40tqU7qIoVilEuzKU2NHND+LqSF3dBxWKEd1FcNZQ3xW6NlTP4zb9C/U7n+nq6j/DPX1P5OGWgSQnIKsTkYW2jdYYZ684+EkeDUJj9o7MRvhZWvrnJihhRZpYdPLx5RFaWmqPK8BZqSpd8J1U4zUFQzR/CFf1Lfzf9v6N+hB9PO/nv/+1LEzYAKSVdo55jvUVcaa42GNaB+gz7OW9/JdSBBJUY684qAQ30cBl7ZKVy6jd35BYXEIZnYkMI1Q6UpyeVvQCS6SiShSm1vP5iKa1imcCF+tTS9lFo653DEUIa6PUFpMqptg+/i5/5v+W/k3Ty38Y/1Hn8g8r7ujroBUIAgMEBu7gSAF2iikE4bD2TMQcmmlrzgEBpIf0GXhIhJ0o4NvTjASUiNnUlUM2HBh8nmADNmEtQ41pr4n/xJ1Ku6lAz65Jr+pf+hv8a9Ohv81/0Lef/7UsTXgAphKW0nsOsxSxotcYYpbh6vP8r1EKIAJLkBJ1KYFcqncKH70ktyTj4byh+7TwhqikGVZdlFIAhEfpOyiGPs372MsW+7D4hJS30qFpERB+uSIUd3cvO//+X/Pru/+4Z/6mYt/0c893/gtRQBnJ+58/J7BHP8T5dQAAALmw0AdUhaJsVSIN7TQHcbUFYwsrfVOwkx9VDRl5LQSra8EoPK6vCNUxrR3BU0SDxXG4txOyspoZNKOs3odXCrUqiQqzXxX1//rVf7CCVcR/qs//tSxOKACqUpYuww59F1pyuNhil6U/JAZ4qNzxXU/aDVn+npIcTaTZJJRcAuQdx6UWS6mnMkLA+4aDKM1MQD8/IONwqZtGrUeqIe9yslepkZE3X5kCE5s4QlL+JXVVKzL//pMZv8qfHOK+/WDt+Tut2sIV/mqjvp/SKKTgKsL0jjFHU4mtBLfd+0xk1mmGoh0iVwO5kxCalVbONM8FOubp34i+ix/xP6vVQZSQAwKDFmMpUKDHN1QidVaxwWuttDdvlRAYbMdOba+cDyzK/KG/r/+1LE5wALZSldrCTrQYek7J2DDeqYN3Zc0+T2CoMmli1tywtSTgfgh5JDaUiAT6ErLE3LlXdlYjOOBWKpbL+4wondcbpG+Qu3Myeli+9Bvuv/0rqdT1FANjq2Ir0CiHFOpyYdZqI84D75+zkmcrvUDJ51k3+6OYJ5Nv2X9NUW+7jl7wqx3HbBSy2mHBRQFYgG0kM6njCvJXUapfXckSU2akcqW040yV4OJj3UqsOT5L45Pb4Fs/C9xCa3W39Ih1OD7+iDDa72u6NZkesIltfrb//7UsTmgAyA3WLssQnBRSCutPSJN3QHjf7VT0L+T6gBwABCMv4MqYz21OEzkbYLUrkszDl1wYIJAMRaP6AwlKAo9WidbkCikSRZ6lny9qzR4qmoLN85UJ5kq5UfByztplbd+kNybakaIWDa31Lf1uocLWu3Tvfjzdf51775w+/T1AKgFKIKkgJlypdzjMqso8rrbM/hBG8IJrGDZs9l3g6Ik5lK1fg6jXVbftf0WSF+S2KHpnNefNi5+fypf+VJn3nuUEv3seTdc8iAmZqpztV6//tSxOmADL05dUeg9rF1IC3k9KpmkLpm80un5xf2dQKTiRStX/BwC4ECZBdUMJ5OXZhL6WBOkJaSgcpVu8fJhtHz78cUjnw4jDFpm2zMBwvqLeV1stKlMm6FZwrI/fl0lEaNbGCYLI+0wfRPfedCtZOtaWnenOqSEZN2X9A2784f9/EdALAAMBL247WCMEDAEQCDTKSUCExtpt5/6gqBNLa5MNtVlHUCOf8otjTQg6TVne+ir0kaEOVomZSbLh9kJZaZo8zrTOi/Wg2pRq/ticP/+1LE5YALmSlzJ6zzsYilK+mVtbhq5kYn8wZmKwbyCDOijmFq/GMr+l/qP+/p/0gVCqUAXHABimhKE9tW57RbSted1H+ZksJcQqHUhB483owG8/K3aunU5TmphZppRBi2V8i2n3YYnvVEmlB3+JRMtGkxwOAvmUSkiHx/2UEZK7pfP6+Qt//0YuvWzlUAVgAAAf+DT+FqTJXlrCnOUVlpGBBAyKAZTPgwaCJU2kIglkYvk5stVluQjbGOMQGMuFIwlDFZXFuhy9H/k/zCvXim0P/7UsTkAAtFKWVMMUnRkiTuMPS2Vu2GQB3iNqlseU6r5YcBKIqJBUdBY6axMNdse0EfSiPdFA5h+02hj4nbK4y+DiJk8dQgsrlLGiIRex6sfMORDEG/P1H3+4Uf8qLWXuVF6k/UvnnoZDaKarGxormnrk+9FP/t+aOPdYZxKEMmCWdppJFygDYXsxCHiGk9TzUZezxHaG+uX4u50wEEVmD7xwEE0qeVXscyqhS3QA1DI/Y88gz2RTgWHU8sfWOz+4ZEn4vb9S/99ehdvmDn5pAq//tSxOKADPUnW0ylsoF0pOxphilqpIihzW8gVdNktrsmAgAAJKgC2jh5CZEba9W+gBoUShK2SIKCJQ8bbx6khgiRzaaDrfdGudhfW0vsCzHbWT32wwZWNy026pQD90mjhYOp4+I5dUawsKOfox5Ltnl+2gT1YX53+S6eThgAAAJcGrRioFXKGr9VVdOSQMqgxVJ1TLUAv6ejHiRoCPRE9yfT2acQpqwr7TO/kgN4dZB+gpPZC4xikiqD5GPBEWjxnU2q56gnMSs4s/1IbLqc2/H/+1LE3gAKJN1dTKRHgXck7GmGHHo39n/Hv/9ypDfU1GX0HOgpRotNVTXijNRGGShiTFsOJSGwlG1Yl86UUrXia1lZLVqjmj8RlFzAKdW5sY7QsclluXjB0r8abtkCV2bYT/i+yWjSrDZMPcDKDB8Mb0crlkcu7TUgABShTAQXkoYAFSBT/cK3miABFPQEqThRqo4W040iMSZgwcL+PEVNa1dTw7HP8Siz1jVhlMTXYK1QUEjp7Z4xOtmhirNoJNb7j38x8/jzUKalX74pP0PSc//7UsTkgAuc92lHsU7Ra5zrnZWeKFL5zv9C6OjX0CIRAIdwBkELRkK62CNzgGCbyskpY0Ac2gA8yVBudAxi+hnx5KvaX9m0BEm9wIR7MKtQdYLF1UJEDijS0QlaOgUK886BvfYV/voyYXz8jp8a6qr2OK0rn67xz6EP1dIJREotyoViPbEmurzcV6yIjXKVo0DZsf3qRSeOeG9n2ik5pwhGOmpUgfuGH2RlEN0/zhnKhAhYXoNbwQvvon6C+/Z7GrAHwr0AmwTPBjm3wrJvlPyb//tSxOaADIFHWuw864FNmu7w9ZXmB+XugfoG9uuRG8GILGhhJxKKUlh2I09iOVwUTEDjwuIjsPMbuY78T/uVvfKmOwoTCT6vhRqjASytUY1NMW7aCrbPUOSoXjmoI0UPzRJ3lZ6XQaLWmay3uiRSreJC+gfqfqob5m0QUm4AvzDN6hCFSIxZrMoyF2DHpUoYPKM5DQ1Re4ttKqiiycNt1iPPi9qJjEPjjuraO4xFKxRA8pUYe9EImEebQ5XHiySjhcxyloYRdLDFR7tWj/RS1R7/+1LE6IAMPSdYbLzpwXgk652GFXCoqGfeJdPWCAABK7gDMNUEel+rck7qVR3SKDoqC1QbrDlfh+KyVCIrBgSz8kCOtFRZp6k7ZL3HzqQFCwejuOtPEafKuKKd3pgeRYk9MLyz03jwOEhoHOAgcOqUGHvJpY7XzPIVWfpQMpOXAeoQxUFhIMWM7cm64EyVB0uT19KmX+VQ8oGbAJLlr2U++pppGDmkr/1Iz6X+CtjL3lPaPVGf9yNVzAYp/TepmOxW3BMzXHZEAjl0DHPKKc8ze//7UsTmgAtJJ2+MLE9xcSTt5PYVNuFhKvakPUHmkAAALl4VXNB1hS9T+MHkrvS6GHmfzCE9eS+1W3QRWJPHstaH4TsIMNoPgtGi+46o/eladKt0TJsNi0vVY9U9HUce1X3Q4LYbbrkUwUWfQxka9S9Cj7X0L0i73WmulQIAAApyh8lIiyOcE2oUe9TRJ5jd4qNRCfSAotvpfwpNV8MZ8p9l0tnZ2jiLHdTq4Z4UbEP6Yj+3qY+f9zWBuvsuj2WQqbBtEik/+ch1o6qEY7nnJJdp//tSxOkADB03c0ekq7FyEqydhhj4rR3McwzS9oIEAAAWpvwZ48mpLo9zJhGUDIKkUhCbRJg7dijyTn6CO0JsXKsVTPGu12lH496UGM52af5CCQ7RTJ+hzf9VeUXRb2b69mO2lgkAuzvrJyCZCmd0KwmKnyI1xL1sapU8QdCSiSnwvBSlKW4+yaHdtFxToXVz4fZckSl9MbW7nIOveAYKJhOo1RhrLtnpZD8rdnNNRqUUt3/oUS+jqyZ0Uwhj/rPgqkcu9FyLqiyX3Tnf8mgwEbv/+1LE6AAMBQd1R5hRUXWZ7N2FiigZ+omQwBIZlQgABadwJMWXfVmrerhjTztweJRyCIvEozRyZbIv+G2KE9SqDVQuEquLf2OnPLGv6FtSdm9NSK2RcbX/anR9dRVcboC2LZrueIvz65v45/4Ot8RPO+oOmaEHg61qeV1qFkRAEptSgUcxxWpzngaawt1wJoyielKozsyPIRvFZNRq06qps9DtZfRheSu687Ks+VjIkmteKGoimAZPHhyoykiVsUE9PnaPUtW5XIw2hhZhaHZrKP/7UsTnAAupW2rnsEtZdCbtqPSU+FF7ErOpTqAALW4HsjagT5ZYptK2yt8pZElV3drOG/kZgduqte3bguNMk0EIggV61xUF7CchkFKK51R6+o4WyecLaojQgRb6mnWdXBu7PXTjblv204ozD5+61ZrK/5T+dTUABQ3gRcmE2jQIxU9kK3xV+NsR0DDHJGPkqYbioQykmzGC7nmQ3DMkKy7y56ajgWgPHsp0lyIk5DLrzia6TkZNsySwWHTPErk2zjBDEi/rLTSV42j1S4JQqPc5//tSxOeAC9Elb0eYUWF7nWxdhiHgckxMhpf7QUqkABBCgEMUeWH5L0bOUg3JpaAEJxAB4ckgehRx+fuYzh1IMdaCtxXEV2O9VmdpqgOCu/GD6u2I09Z5dQVqaMynLiDxv9P3ZDqVqnPZ5LKqexCijmOKjXURITQSPgcSqibAgluUDCwEpYCKTbfLYpmtPxBjsSK6/td/48/kdjWoDGJwYSZ0cbRyrDG3YI+v7FjCfJ7GjAAx3Sn0CmJPFidIwChpbOdEEehNVML+xwEAgk9Hd27/+1LE5oALcM9rTDFH0Weka82UnhAmH3/8phR0VsWH9YACSipmWBKSibboxyJI6HREGyOAXEfGZi7xIFwNCJWr2naTtISoqisgiSGPGPtN2Qj1ExrbU/IXu1Bz1EoAaxAT33SrjAnS1n+gLxn7ehZrbP8Zjn/1Kf3f/ooSBABScYJol+tyWsakDAXWVWTcXzQWou5zqpPvflebbGhDh6EWMM0aJBd2bqliuUpribyDlXUbz3zgCUXOl6anB4Fs9zkqyOqKE8tnX/i3a+X+GY4jL//7UsTpgAwozVpsvQfBf6dtKYYUt37yP+ndB+/5H95ICbcggoHEWdeczFgDT4DhaF8PR5ol+Hlsy6lpHVuKNWYC7wrMwjDbndEZF0iL0+7qfPWapgnNKdqbQMVCwFIycxUydNJTJielNCv3oMsnVp2W693GdH/9n/9az/5P85UqBIBScYZ8jA112l/qidKBIEaqXakcfYNOwIsm3ZomheabaSSAhPSjx6ibtS6rEU8m5hFMR82xTUnu88wNuZayn2Igprts7dAwOe1Xp4s+69cM//tSxOaADAUvZOwMsVFpoquNlKogU16OmhSnat7qSN/80v26SZNaVVfyQbLVjQ6/UieuGM3ZeTGRMxkmbYbRR4iqIRFkFgCkranuc0tGM6tVQoxefjeymbTYaXn7nnotR29Ju+g+LTVtteg361bNwXRMMMN0Q6YcYTkhm9TezFf/0L9mpSrIqVlbBGV709Wyq0u85MfUAUWXrSP83LdqP2JFKICnJbQX5XOuVVlOZZA1B11Y3pkdkkUuxl26XW0nytvwAflFub0WKKjJ89F0Sqj/+1LE5wML/S9g7CFREX4l7I2ENiIe1VYxkfqU/M9AgBGv5/E5v0fpEY+3yIgAAUnKAZEb8thwmIww5unvUcSLdKjid2dgl5M4o4PMQB62FaVBcXWlr7iZuJcSm+962yQqB59WMUBDQYMs/cYzIJW5+WuevB0+Nno6MzCzvZz2uYYDitU15Oi0qd3qz9hZFS++HdY6BILctAWiIl2k30B8MNYweSMolP9Nyy/bzhHb0S7gm3F5bgtVfgwK2VKFfy+dKNh86WwUUFLN4k69idNKzv/7UsTlAAwpTWDsJVDRgSmt5YQp7v3c1GrxYfD0HJk1Zu38D++LiOZ5eiKQ1+jXbIrm0J7irdsvqy5+7QVz1RJCJag7pCeKk7GA2UA5LtWUQ9FMDxr1NHb/im8Ucr67BORuSGyYE/wAMbB+wsfdSe9kU/Mok3BBmkJXFfL3CcVpHx/8g3hAOIFDLd+XYUrjSXggFKxxz/476v66AAZV2HKASQ8FXBcjyNlClg3QmENXlFtc2gqEAuQtNnjS8PT5p31lZo5UkH50KS4dkYdm3Vc3//tSxOIADGUvaywg9TGbJewdhCo6WHJ0P9CeGygdi+w8jbfWIyaIlofWPHBHGlcfrXGliK7z0JrVdiJj4vc5Z7VetWu5306kVL1wyiKWwa/Mr8iavW9mKMpM5m9b+4wjpDezvgN1yZxA8idfRYlNOZkQmalAAG0eISPDKMR6IZhqF4+MAivTkRc/aVf/BxLkSK7chQyUpigRvoCmBA109IOOXDyS1/WEuCgVh7yKv3+SuEVd1nZSL37f/F5YWJvb3d////0VZaQSASnRsnAmVwf/+1LE2wAMrS9k7I1xUXij7ujwop6bWWTpEPEJPIHqIKNm1i1Kml0oGaERL+DjHPgkQ2aGbwgUnl5asIvYZF//Gp5H184PYTS15FxvhoAUKAkUF30bilEt+wipL9IQAQCnNRkBzjyVKGPHahUzEzs3RNSJwS2jvkrL0hp/uwrQ5qpatPz7fS1AiqorX+NuNS85WPdldOXdSs7kd7Puh7B9EQjPY6PEHb5Si4ADRIVN6HsL+Uy56gAACnAKMTktS2zph0EtdvxlccHfEK/HZeYbhv/7UsTXABJRO2RsPYLBTgwu5PYM526f7ZJZFmuh24K5ddJHTV1+lTpBFf9G1fdffvnkdktVTKR70yWdjDKh2OVyzBUW7Ps5QxUX6oqHdhbOvI7OyN1MUwNAzcEAACCoDch1y/MJZSu9/JbPOm4Uvd6NWLzPcZHVfvMiWPMoIq4wPzLofKl6m4YiecmcLz7qRhZR8YAbCNClzjRICR2sgab71/9QshgCCqRijaYEAkugW+gKCHt8whir1P7A8NokVCqX6XBUYtLSxQdYd6IsJzF///tSxMIACnzDeUekZ3FjqO4c9JWbK2srVY/Lc3M7/Hz5Nu+u8NopZOHTciGl7iQ0D2i+/3MZhta+pZQQGDbjkeKgAXgOtIxVTL0VVWAakuV+lHBIWdj0Rppa+rHMQivh5pvJE3+klZlG4yQQaDGD3VQZzMr0tu5dydVk+xqaXfkBKRHRZtQHcUQB5YUYb1QLihu8UgQIUQCLswJnBJUWHXPROlCp0cnAlfXJ6WgxEo41SuQlFow3YDCFTIu/5gzAY5fZ9LwZaQ0bT8+kttif8+//+1LEyYAMBXdobBhO2UaSbN2DDhAckPDkR5BLahxIRg0xHVtwoC4ryUqVAAKMoOU2YLXVmsvAqm9bjoTQeKnhDlxEezgWmFidL9bMP2iZhbxqDGCjGIdmAAoCKPOV/yjzN/dKC5vz/CuLqmLgX+jRhgQmGyOMXUdSrSt0JTNgIjYmyuOqKroe37evoy0Z4vhTAbve0HqIuyCGY7Fa2PfbI/3fl/vz1kAMOiEFnSAzvsLjCZwQ5iiGQeUEC1oGC0+YWkgnyCtxiCj5SUTaykLe0v/7UsTOgwosi2RsMMqBSZlsCZSJ0CDlSkgY9x+5QxwGBDE2cxUMQPKQzDAsohlZsHq1AoUJid5NQA8+uTDIsjKEAAlOBshXqJsRJ/syJTjuDFRUlnhZaM1frkMEJ4t1rNFmoGUcCweSfqOmL7Q4gc9pKvQyRamt4pi1G6VM1b7xLX5U63p9ZBLJmpvUK2WRpIluUah2AKJAqQBUW7koqpZdTCXZWzq12zVY5nZZRn6Z1pWwkxXV6Zpgle3thAhKx1nnb//29OiuGEGFxMfj9fzT//tSxNqACmDJaUw8Y4FHlKvNhg2gv06/T7AwH1pSrEZoGpECQCUnA1yCGHHLkJEQA4WE9F03RlxdRSxgqy3xHDfkHAgCS3du9gltf66PvzKEtNrsAw05K3nq5t+ckt0XoOsmid852gx7e2Z8ljXh4DVgqdFqF+iVpJJS07kJcTSPEt44AAgymUrW3EZDXGXDVFUlYl9Qr31VJIxhZHrXEU+T8/O2Wqx1o5t3eaENs4z0zAJedv++Anpv0G99EH/6frU7dVmQOI00oUQevSayJ4L/+1LE5gAPlUtwx4zMsTkJLaj2GOJ3Qi/V7hWrdhIEgAAEU6EIk1LRoStY4EAPVYAwimGhrce0p4v0v3Ofulo0/UOwYmGVKV0r9bi/EQa9WklWjrMTMeoF1zX/iA1VX94x/+K5Xfp+r4PS5r/5b+frGnfFvRynpUClmvFaGgyQilKMZEECXRKTuX2gCgoG5kTi4uqe2i1r5RS4ymB4VKGkz0GRkvVTD0oWzreW2eY9Qei1z/Y4QNzfYP6N1e2zNm/8cR1u8Kv2JHUAIq7aGFEgLv/7UsTegAoY0XVGDFaRTxotaPMd4reLBl2pABCIAJO4AkGuZw6RvBzIQIsj0WhSgQ03oRW5aIl1+q5cJSDxtvLuJjvVuzBrG05Tv4UdTFB/k2Pb6wP+8WvDB7tTPBgs+vlSa9Pp9eU1Yh9HoN3FWJcuGQ0+tw2zUiZqT4yQkTKOMYY5x+DlM1MOaXU7In10xLosenThVFUlic8J6xeehrGmoYrU/54qkmx31Y+XuSpnw6/9qmAFwZlybaKcSAx0q1UUKjq9H9v+H/6/+3/cEpLZ//tSxOoADKFjb0eYVtF2IWvdhiC4tUqQNgtfEwnKoesk6ZHqAhAi9AiwqGA2xF0HvdRk8bbWPGbfEJEicuPMJfUxADWevQlFBlzcXnnvEJ6CIlIMEzljoBa/OHPzyv4Nd3Pct75ERERKT6MRyQcKGdznHFrtBDkAzykEIuxAOAhObgjZOjJOIvsBQGEf2A6SiFDR6Ip3mp3fIdrZnaSSSptM1QLE1bsSGsOlswE8tYL1SZhwuGJwcIHKLIE5uxZ8820WeihyMawaBx51w0Ar0Yr/+1LE5oELTPdm56Tn0Xucq+jzKtAxEOgb/WAASAAACMhDAFkchllQVJyK2cfZxKBXPqR3zjjqWRQ1r0bK6Fy6ay27LCG0zHA585X+9VeBdX2IbdXJgdu4rNADjgky5ShivWCzf1aZ+fnIbUlvG7uo1Ebaxe+foBOJplXrVZaWcOX+//HQWTLmBCWyj8HJnRWyokBUD7jKFm9IkkFOU/yGFEmztLwX4uCqPA5Car528WVDM6GI3+u2+Gby8o1oXmMud2a8w10NNGdTlvKJk9Qarf/7UsTngAzBI2TnoFcRV5erlYYhaOvk0liQFVRfc0COwEl33zqKgF6m3z1QKOJMHwdB7Hidx+FvVmj8MWoCgQuCxJyKLze/Q+DordsOpnpyk8q6JqPKjUUwu2a2qPyJwQyVkHE1vk6QEVACFNtErhoyJHeZpGSS/dUIpKFpkkkuWogl5hhqanGaK0c5PTdVA3HM8TAQOMqBSHQxVnNE6zXztCbB9NhhDd1ArriLah0yXlnwsPFKsPqqQkGa/I/7Zhz1IMdnEmtVqJiI9nOklVFy//tQxOeAC4x1aaekacHxJuwo9g54OpEd+M+D9Z0RELLZEbT3GgNem4AFAEMAJACX3JOiw41lCmc3F1BUqrqi0qrF5HuRDiMskg4im7dS6mwViM2LR1z7UFETPTCwSaoh4mGe5zIYRPzPdCj36P7evlKVjjD3dRjKk7q+hH6eIupHl+Scz0oGbFkSCk5SCD+PdCz52aTULUxRgLqxdhGjT2ku/EfPAuFbzxX5dmWYCJ7vwlEnC+0upe0vCv7Nwjr30kfp3U/Uvt/6N7fb2J2H0f/7UsTYgEoUkW1HpE0RMxMtIPSJcqbOsvx6WMbUAgAAAt01+w2MBGiSyg5FksdlCJDBmw11cj46XPJzXLJY7LvVZmCBzc2bEZW4+YqKcPaZrYvubsThuPprJudPgTEhcsguShzC7wzH1aG9QXjOz+QdHvNNHx6ZhN5I/PXVD/d+rP/lPt9P+/b8g7tFAAkAEAmr8BAhsKAcZbYkR1VHGoQ+F1iqtTrBjKeuL/pGuGgCV3oI1Xz1vRTTtLOmNCjayjAKZaQq3yht7Hmahmvv7kvX//tSxOeADaldaaegtFFtpmxo9JXY5OWRGPMM4hWbIru5RvX1J/+ref2cten1Je4X+3boAFgxAFGScRtBxAqKAmqLztsYA0aCesOhOcNSbqearTY4WMhoUJzLp4srpGS3ZQtbR66HMUBTRlJS7vOLtMi5uFV73byjf81myrH0NFtdkbqZ6P1Hnp6ltW3f+88rltIEAABEcAEgDiJ7LdbGqRrUQHjMwhvctkE/Pw/Vm6e49VakjeL0JwffxoK354laTMaJqs+BnQ2mJOisOm5lm1P/+1LE4QAKPTVpR7BH0bsuqt2XqXi4d3qFHoq9KCOvwyvaWYpADr1QEM/v7t/o3/C/UYAFdlTAxNhsbcFSxhlC3n0gAeQCqfKC25Ewy+SBEODhoMHSfGkbpdsgYFa0fcUc/YnYn0ZRF9wjlOFwXOIR5hpU3qiETqIPfq9hOldXMXOE4ePpicF0otyydernUNg9kGxITskxEKSZCs6aSFCiYqCq0a2l1k4Sc9sYSeaOiQPGlanM/gnVQRaAAAFwegAHHaqTlL8YyAZ1KmDoEIuoRP/7UsTegAxhSV1MMUnBe6Pr6YYo+Er4XiEaO9Zd2FX5Y8MM0+58tPh0VqiBQPAlOSQaUlONESHwKGCJEmTNQVoB233Nr//8d212l3uQCcEAAJLm6HARh/spfFOW1zBElOhk4QQG2XopIzi2vs9tDDeEmteKL3Kl9peUWsDGhlKRz3poi8Ypi+Ag8MAIo9z/1/4DHUkdK90QhoNuXbrWDMCCUm4EvGMeyHuSdPTKlR44PyEbJdDrziO1BzVbOQVqSCjE1uimZmbjOX/ag63SnbwA//tSxNuBi3UxWuwgVMIWJqwphiUo////sEKX62kqhA0LrFhLDvzghx+0J+iz160JPLd9ddgQUk5TRFQFyjyAqwzHB8gmRgkN2OMkMkGIkuq06TO3kE4Oq0uc1OjP7OZdxN0RFCgFVSqt2qrCIqXurSGSNuUHZYx+itfFPJelC97lhpBqHOLCtQTZVCbTd2T5EFfERDWr3E3qu/c9I7W91ECLOt3AtUtHF+N+b57uyDp4sIqbdXFr5moN9PwjtqXZMtu7fn/9UCh1vWVvyNDJOmH/+1LEyIAKHHFpR6RrAUQOrWj0jPjBjkMsYvwMkfxLRJATg6DwO5cnGoCMvy/E5KZmWDPY45mxPpy8CBPnESucn8ohOg637YYUvd79iHQ5brBSyO9Ax8qDhvu7Z4+7+j/O6Ox2+p3/2FBE3ulVpKOhyVJWKJNVgENmxCmqY1NgFQCpAAARVvBqFgRbLvYK7W6jHGLqVr1LD2kSJMcQYolIjcvWj3RusL9swjy3Y954zd8ao7vNFVB53hvTYQt6vkmUdLv6GfN9HXbPIf+7FDGvL//7UsTVggpEwWznpGmRTRgtXPSVot38rOs8WV8okASAASCU4ExUojGFRh42JElmTOO5LBZYX9wMxyMPb24Me+7RZ+q9Wkgbwff8GNlclfjzYsup3e6Z6vLTHwkRb1Asf55liNDxlvPbqiJSrFDFaav9/cotF2NarSzut9p60Vm5uOI2idkqBgAANENAUo1ip3x8Ksag89Z05fWa9FHxeG18rLQSFIQevRYvxIoMzsdt6Db2IzFK04pUg1/sS4xNr2D/W46Uwbe78+RG37Xqijgf//tSxOCACfz7c0egr5GOoq3o9B7OPnBYIAgYlD5TrB8Hz4P5OQ8QQQBMPkNfLnygIEN1tlJVAbP9HLM5lNZByOOc2jikypYvb6/sfwctBwjCbxHVSMcjl2nkdjo2olp7a/2K+nR301KtQ0xlzPNfakpRlKQjsidNe6UkMGUrMYjGFOxebMy0zAQdXpPFTqYM/wEQUk4C2hdB2QnA6D98qVWJCRsuSLiSPYe6m6x7zKIHVgyYRpRMi5CcuKKifvNNytIUaQHkRBO2/pv7ylHmXIH/+1LE5IALMPdfTDznwZ6oa6mHnXsWencUQBSTxMJ9sb/c+w5k1aGQ4VDzeXdiOD5wJNPPSO3YgAACkCAcGVa8/rBIRjA8ceSbntRCii1eBRykoheshOOY54iohnUOWY4oPZVenqdcqLiqnpqtNLKysy0LZEUlUf+j1Uq/9cM43nwtb5036dSy1QNhCiwgCTJQIJhcS2ovE1zqkd1sTUQKDCoLojCR4q5Zl2S0oBX+MDJiM6s7kSRUU9gThHHGR2R69Zm1pV+dr0R/0Mfd3Z2/b//7UsThgAzcqVrMMNFBd6uvMPGKJtZXOn92/MN6wpFXHEkCSka2B2WAQwOjcNud6DGOL6dzrILjxT11HQ3ZxR7RYGL8roLwgSxxV2Zf9yGc46tnR4hnRmfsuzsSjMJvpj0VWMx2eE6SOvquqFACvONJDDrv/oyag61Ez0IBMQAAAS3AKWLpvg1x5ooyme0nipB5KrW/uxaKWso1sJSnksAVM38eg14cmK9q6+agTUrQOaoI+961Yd3/1dVrejKMi/Wnv/lP/0TYA8jW2pRlIujm//tSxN0ADDTXbUekycFOHq0phAnxMJznOE1PUrvlk2JuRoakHMJACA6nwJ8A1C1rKH3hDCoU9a3Yy6mEC25iXVJfas9gypjfmWpX73Cu+9DJyP909GnrYfAucmdeNOztbQqWt85mNtVygFrbmopKj31wxec5iZ/+L3/yv+p3N9P9FRXAAEtqH+Z9SIFtMcaMtkyaq9sHy+44VI9daORbkDU5UPhqiYAkHdiWmtZ5nJyerMq38c4tXaeX54TW7c72D3Tp3exSlvrzMJd9eZpF1kn/+1LE4AAKCSVnrCRJQXmgLzWEldZLY1ZQSRNA3urSWpabJmaYnI3IrXd730+bHOnqP9r7SxDLPnW0gomIAADGucWQ/MBWRope0Ex1pq2VfvdSPBP1Q+JcyBMRYuihj5cLho1jfc2sMSpvfTZF96rfs++N1qI4c1l1FGPtkVUFFYzn/1mCuYqPIk0FYW/W6nU6mdJThF0H66221qUIZJ+2dX/K2//9Z//PP1WnHX3rZ9FZ9QBAQQAAAAAIcm/msIwoJGIgw0DLSeN/E7xoWa/AsP/7UsTmgAx5JWFMoPHRdqAr6ZMqmDoGZuK0psZcmxGbi2Iv914R4PjVWmTKshQkkQpifyxEpVxnLzD73U2IEUHUPFvbJIeI1Hjt1h1BxmZvQcT/6xuFW3+9O50wDlpv/HR3daVRQCLf+k7EAx/R+3E5f/Wc4G32dGkBZ1sNllooiBooUQRyJmj3ZAWQXwKcMLQXzBAUTC0/fW3GWx+G41/ctf8Nuo6thKm2YL7f/9s8oWeKz3lntcqLP4br71lQoDLKZ05qjVtFa2SBeddnnlkg//tSxOOADoUlXOwtsZHhsarpl7V4YJG62pk4FGbqMFI6b61qSsTiN/ObXvMH/2/0f3rv+n9X7pG/pRAAAEJKgK44hyQRujHpNBsxJMZPmyJvVVHBCiPdWrKOMHM4sdbfvccJhX3nbvrW3236XmIUGnEax5GswUVE4gEjCpskEWBsQGTcL2UUb4W9BEqJIrvhdKJIXuRpZOFhbrMNqRfNRlHBXYXhGYudXLM29uewvtANk/89oeoyx0LO8oAHAAAA4BFhAS8SXJfHwtIa4uxxVsf/+1LEywAQQSlPrbz1QfMx7bT2N4bst6MXHqHwNh5Xgugb8UBe9TOqu2+YU6so/6HocnMPjYY4LF7HZP/XzWbzMeGK5GHsA0NVuMH0drXktNb93UoAw6pgIgEu3irC7TutNdqzKXfVDoJxnpOvAW0Nf7sLJ2Gfzb83E7tscdUJbnr6Fp0nnaQ5kUEheKMMUvVwohshTqAhWVHzZy79f+EQUaEV5za20GR2tJIkgkqL6FkhlNpRppnJ6twxJh7i1BZR4t/Gwg9nq7dkdn7PLObl0P/7UsSpgBAtJVzssSvBUBdsJYYYeAH6JD12h1vTr/VsrubV+6kdWegI84JhnWjHdnjK/o1re2t9GW06KgAkAAAuBCZ1RCVH9rD5xrNeQXojRZ6GWIFjBtjbA44uRR7BwQUmFXkAHKElQwH4i4juqlRSu/eg0X75QdnV6mF1I7XhlbbC261QREqqppKZ9X3ALkgAOblSZZRniRbivO48xxWI5sLX8oHqs1ZV7agGqMwOy7gAdo6rC1wupjkJuSPOR0lCc92RhcheftKjuuaUDvTZ//tSxJyAClCTaawwR8FDGq809gj+LehGcxynZj/hRNp15zpJTD5V2ojn3850U2/xegQgAAtrCgoABDFL0zYbhD4KxFrDw8E7mEj2OPo4Pd6VuoTi5+FYVzUbbPNyL7hpRfAjV5h1Tlo2PhRS98dUYm3tWjEQXNqrc48TWcX8jdDtKLymv66Ftf/z//CRybfv//rcTBEZAebsBMwU0obZzSSiAkYvPVIhKIh9OUTcBhgZkZ/eM8rfA78/MR2cLg5UIi6y5bKMcx5bNN0L/mjT6OD/+1LEqIEKTOVfLDCnwXigq+mGKPhC/76+MTTRurqQh5yMkYgFkUj0jKtr/jS3/7knVxD1+/X7qkrqmBBAZUUY6EcymqjG5SKhAx15Vsfqp4WJT7ykySkgzNeFTnNYTmMiXeL/agzbtqTU8gFkz5UE32/9Rk7jODBGvZvgS+DWFYbEJ/Rvv/n4//8jrXf3f2dH6STnSfSAABE4KSApJYFGlYR7IjJFliaXZDnnhlyhvYJie+Wvx4rz+ww843LaAl0UUli7iKM1H2aK555rHM6flP/7UsSuAIxZCVrsPWfBfiTr6Yeo+Be9C2OAGNU/mJ+IqyY3Ro4QNMqdG893fWvyhb+fcpZch/Z28hUEgAAAACZC1Z5mX9bjO8pa26XCvav4dezjahmqwtSezYxwgv5W5Ia27KRnyhusQzQRI0kGTnLZ33d+LMRA65ygUkiGZ1ezOeJUHaqaxNz2dL12Ren/S2QYjIPLFoVGAyKsOv8KqUgsVCu5AgAAqAngojPNYNQdaqXEdaCEQxEHWPkChbRCLINEaoBq3PvgLh02neNrHEmi//tSxKqAC8UJb0ep8fF9ISuNl5z4aQVFByGhZ8nyY8d1uTH7IjTyHgPBUFwEdBncY+wQDyNnY9rpVQNeAAABc4QRogJUQ8ve4KkWYXCcmQAGj2eHh13L/3uTL0jtrwg2BEndpWZrqrk0OBJVnrZHq21ndW0sPqgZ6Pl0ZP0T2f3RFBiQ2d6XtbeWCqw8FOhYVOgIg5bOqoduiWcGJqtEZMVV6LKLelfzA8LirRgEZRiOPvScuV6PZQYQmQa23W/85bSQup48zjSz6cJkX7MFBmX/+1LEqYAM+TVhTCSvgU8WbOjzITiaSDIdguIVPgyLNQFWkCBScwYhUOjgKTA5UenG5Eyry3iIrU0NIAqVFmE2RedmT8rLmCL3LdPYjzjZ+0EHaivWvcpaPJ7SWav9DJp/vUnf2hWp8zDlE52LMDvzoZ2EcUokrZUkBY1QRlgMCyqPZAYaqw4K7+rNOUU49tEkBAzOS+OX/gi/3w1GkAHMqkN1Qmd7typppz3u1W3+lvMJW0+yTXuiO3banutK/ojU0shdAE8BmJHI3TUuw5bqCf/7UsSpgIo4+2lMMEeBQBZtHYYIupAlDEaZdHsWQQXJ3rsZyBPjBdg/Jge2yCJUZHr1PPp+vULyebT3gYnbWVIh3yzrkU8Xv3v++IcneF/XyOq+CDxnmdPeUd7VKDepxzkrNMbjebMxzKM87GkozlyQF1Egj29S6YWN3vkVkx72rSoR2u6clPy54/so5qJVbZZv/lf0f6fNO9Yat/5R/tb2/a3Q+3RrNlS65hUAhOIBqMJSzjkH2PBVnCzD5S6NTonanOWZFKB2gI6YPx9TMxS8//tSxLaACkUvb0eYTxlGqe5k8aoulGHYdXwpDeqJyojlndFgN04t31Cf6tvYq/x7R927nG+ynfT8UHsOanbdX5PuDO8ZtqRbgOysBBUSwPFxU8OgUso5ihSkZQH67/hazV3vdtRYhaUre+zAS2PpYVGXoxoLp/h+a0TgYfWchaxBTRSTO1laO7ojf/t/zLAoT+Vda2Jqzz3TY5zx12dFc9bYhGz6lQSZBSIKTgDQXYBorXEmgMhgG+4KFd6UEu3M2sXGhApmucMVNw6OQ9jxzRj/+1LEwoAKHN1cTKRRgUmpriT1ne7jPApFq0aPOGhfZoVqj4Y14FTahacaD96nfwsqev0F//qMfrT6r+6/GN8lONHAABK2qvCOqXyw4Uk4iQr0G7lmLMosqBVunEjGMr6m2zIneUMI21vtqbBKHrwuDcG0b4PQHBIjpAu399KIF9uoWjnZGshRGAoy351bajcsn4ZCLFKR2FyuOsTmUZE5Rq9Teq9AgRGCeBOQF1mYfPbeTUIaxEZS0QXotX+tL0AAAE8jAHQQsdCgcjtZVh4RLP/7UsTOgApA92mnsOnhjSluKMedcsF/HjrfER8sGyVGgdbKBuMBNLWPEZVkNp/A2qxkUnUhIDufXPg5r+8J1BjQRPi7krGU+hCa6HM/kvo9gDsmfQECoAJABcwG4yxHVG8TZ8u2BM4aBhRSEDErVlMJOtjelhMqMFbw1jR3IOToc2iISt8V+J4bXNH6nMbHjNY8Bkh5F/4j3WE/1vp9TuADR61HE3pVC04AsAFu0qRJy6kuRJ7DSTcA3cKAmfkjRHkdNc6anjUZ4vnnlA81SRFi//tSxNGACw1LY0ecuFHtpmxNhiRws+yU+71JFLdqmW1Rf2phDFVVN7oATIoJHB1ah4/va/N/7VyvbY+eSFSABIBNjofBIkOZoqGHtCbWZ41GPLLqzBqUDPbNVF+nR7LhHlTc0xF3k3p0dmuY6um6tNDVGzfQ+3XzB8szmKNNncemanE3wMBk3tb+7/95lQm6UZJRbVGsQlx8nKBJuQlqsTQSlMIGFqxI31yRLw/CCHss4aeyIurwV6VCmnaq0xrEQxBAWdy/1H6cDBeKpl1Q6qX/+1LExYAKTLVm56RpgUeV7Oj0jPBDjFqgF/3f/KHRaJetLTVCMgJJOoxXmqLYulaqXa7PBLvStdQkrAZzLlfcas54HWRrA8nlL6SW4lpx1W39WLM7t0v4TMdtTL0FPr6EZOvxAz///9B///9ujjWEW7tiVSm5ASAJTdci8lGsjqURBISEl4RyrBtvDuLcaGO9kOn4r/rTJgveEmkkh+1G6An1uu7MJjp8YLuuq6B2KLurvyhn2+qXdCJ2E1tdfQJCjf2ab1+os+zRVEtoNHyIk//7UsTRAAo00WdHpEnBQ51sqPSdoAuFyLLxnk57oFSJKbdJySoZaSHqHqE8OgM8WNmM0wluOf0gArVDHskjTPoLy0NM4bdBHPiSONjHtMJtAXEjOuNfSIgvqk1Ir0n+LUtHsrVDlq0NoUaOfdPp/TqO+/3+n1QcxPa93T1UKgEwAAAD0k3JHTkrkWlF9bpOM2LWJk7AmKVYbah5273pcQw1WIxBDIp7/4hCDJ1G+enyntoie+w1qiLtPPO9/+QQMiL8w6sPoAH6z/AEH6Sjg/ac//tSxN2ACgytbUYkq1FDq21o9ZXas/zgLLUQRhICTuE90KTdOOwpfOy0yNRZunGLiUdcTFqLzqHHN4pnsKCVuVrrP27+p3VW1l+v0NcidyfOWxmFHWjeitJ/diIfnpk5z07D8EIjbgD39g6LKeOCgUIkakMueDRFf15Z9TAAFIDPFNaHIxw02oIYVnSNpYzGgC6o9rnCtYSEYVeoTiiBiaAubKn3W92zqrh8nO3bpJPNh4YuoKxQGyQ6RCRdJNrzn5eEarM78SjWRj62C8lgMEz/+1LE6oAMeSdlR7CtUYWrbOj0lapMNDAEv78W/eLkzNNokAEEFRMdQFb0dRGUwH2pjQZwE4ybBucqGVhgsOd7RgSmJWkzVQiUiQi8/yOrvrOgz2zTgFBrmWpKSlnNTYyUjheR4aqARsOgo2IlnExVqCowfQkYeGkf8SrVH7pUAEEFRhosJkzjq5WyMKUFiy5ASEbgfbDYNICQ4SNL5zhkctvpKdAy1Jq898fu/8x2unK+62l7y2OEo5Ef67V65d3jO+ZLKaWNlHkzj7GSS7kkQf/7UsTlgAq0xWEnmFUBjx6s9MCPSB+ZF8l+qo4zWRBwCQCnKFTKa0rQYlIVrvzTQW6j8iQADwJBozBg3xuXWGxma88YozhVLo4RHqBQ4uBIGQ+SN5vmZW1vvn//Hy7/neSCc8DAdPP8eMMUSYdQXWoJBmQPrGkpG+lbvSoAIAAAAC7xQIeJXShrL0vE3YLUj4puyP1Dpclvh5VmjkFyNNe2LBjywGvZ6P1yRxDPq2qIYfDN//s6S1Tv/8JL12b1/u/C4CeWENM//1EDGX5z2LGb//tSxOaAC8zVZKwxI4Fzmm71pgzmM14BgqRaEiAD5DgLcZml4posGRETjd2aZrKEYpSyZFtBsBekJm60kUTrsdnw2qVmt+rPddkOGMPGILOxEkPF0Ioo7TPkeTVV1MY1Knro7G0s1PfO9tbFvZOlfvNIIa6m4hjG3/pmAgAAOGG6Zz7uDoKok5QRB0upDmNMuSvU7EbCPxooNIA13sKmk3EGARtRERHMGj3hiDvupDVtfShZpHQMLKnmGsc/atI9or3+fyDAGeOyBY8mglTSeFP/+1LE5oAL0MFzTCTJcXOZ7R2EjWoUWL1wUqi++kATQHEAXKABwDkOkzGUngSIZqgQpHO0ShDPGYE3rA5d0expJ1uPnzwFwVj2IcOVLo2cUnPcXln7NGR+1mGglk1FNkoz9xg+3ZPrVTXfptZfyoonA3Wh1C1iU7xdeqLVJFQJIgpt0E+rDAHmkC7DLOlcJVyZGBFQE4M5wFtncFgel08wTD4Y6h7YRRIo9/FH2hHXh/tcTTyLakSBrdL9i2lI8y2Ugqkpoj9Z/VTv0G9TIkZvwP/7UsTmgQt8i2dMMKfJe6YsCYYJcZ0yQMXn3COtDOEiUk5QDABjJ0X8sKfCWp+ChJwK9zSbA36aa5LbnEaNq0StZa7PY88RId+3kd97qPkHrUTJPTAZtRgoplJxd0agYe1SN2aEf+/Q/7fQe+6Pp36UVUdJr9Hc/hcrrbetyQAagTfA1zck4HgR7ZqHFwXGQiVQjTlTzzCDcdgTzmuEliBKxud2yJdeIvd77zDRubx0UaKmuZAN2cwBjptBFkR6k+prWdd+JWkYoKAZTL9Pfo/6//tSxOcAC8jBXsy9BwF4nyyo9hbIkAEhy8FJggGSgbioqrOIQkk4ilc19/409EafjCXcoVMaQvDxZcvTqcOXPOg3lyX5SxQwU680+ev44q9W1hVwTRRe8Y+zgCeeRuc+55/qp1OA4XCMQpZJ6hFLXL0b0PKoYxdihE1aAgCiE3YCtN3euw+S5GVTb2Rx5rUO1oB0Nmx2QDeaktUWaqqDabX3z242TEs6URT8rAIkJnfMbj9jf7pop35VoKLfcuxhi3cFUHyygUHRVRddQ3qxfNP/+1LE5oALrRNrR6ytUYKpbRzzixJIoDpMXYeMicmnFRlJ8MFjCTkLUxpDcOVQm6emkopzR2q5yXJJTlmu5aqqiQqzrVubcBDDT0KVXRDhtV+lbPKjmz1vdguCdD4/Ue9/Ume55hdj5JACyOYYxtBwaI9fyyf6v1XRByYea715Qytemha5eJKAScHkpkNLkXVmLYuX6bJ6wLZmwl2m9EkySAliNmNsL0Lka9qd3B0/RqWEi5rMh+JgC05/gaW/1X79TDUHVE5+pQbM2XZ3QDhr5v/7UsTlggpowVpMvKnBlZurXZYOKHUfEj/id+qeJZjBiqOmVFfsDqF6khCg41EeI5FG7CwrEmCtncpl8OTEAqA8kHEF4PFT5GaWEkZZWSd/Hf3dmzd4XZ/yhGvZb9Q6u9hgFKRUHUTl1qTTrnR2n6a1G2pjFug7UJBVeZ+cf/29/v7eYn377vU8/sVVACgAAAE38NMAAiklUi94BMoO4pxoSXlMro7o8EUDLCaUyhMN7NtjFJxq1n2ZqxBx8rG7tiOfdTBdRYLKMiDbeN7YrJpz//tSxOcAC8jRYuwkTdGVKS2k9Z3+vAwz38vmU9Rd5r+TWh53mL0d17+a+gEHPyUc63A8zWkPOE4AFEAAlN7mYCa6RwkQtoW4CiV3px4xiT3nqbjJIBm4/alUGdm5DSNVZp25bVHpx6qMIqD0kh/5kZ9OKiY1zrExkjwnehjmZqge/izdQXBj36kG498g3T5f1vlDPb7+d4RFkz2/lRavRtlpNQAAABQCADDeBQhhkj1LFJiv1VS0aTUYeqDkabLDOU+nJLRX6lc3OpGzn/iWUsL/+1LE4wAMBTNvR5ju8ZAmbSWEtX6NH7VbWewHjr5wfFvbwx49QmqjyEk8/wqv1P8Xjn+hGl0ImXPGb9Pl/T0/9H8h+W/6v6dCunfRSc20iAABZ3ZCWrKk26JcpeIzGMbLIMiVEvIhqOtCoUZL3UseE0VPUHnm8eVIXfucBsrrd9jzvv2XTj4PSZN35AuxmMNyPgq3neCpvX5Rjlp8RvNblS//v/0fzHPdzxjDcacrddViXPRM5Kr3kAQEAFF3gwRd0+bZzEiHcVaaVa5eKNqPx//7UsTegAz9M1tMPOfBqqZraYWemElGBt87uZx56QXdR2ja87V4sWLFnVWXosqZ79M5Ve8y1lbudtObM1yyxxEX+os7yhxcgl7qfkb/zlO6EZr1FuCGsTBiXPqw/iera3lwsCCQuHwwHzgRD4qUBAImglYAAABTtHMLAShDjRQsiDqLTMrnZ2FR2yTasbAyssMEpwfIReQmYpqpxzHBsMghFe4dSIxkb83MzD469xOZHBESA1Z6FqKjrUy5/bRyGH0Xu/68e6KUKgGSgIABc3LY//tSxNMCDQVdW6w9S8Gnpmsdh514RyMV0BKFvTpgnJzy4CGhdATxxlSNC9FnWmhHTTC/zPJaKVgwsZoWuS1KU94XAxEeP0x7rOeLLF+Z7uVQlBXxauj+Bq3XCPzBABTmyfQYdOpazxMFuuyqEkvkZSSwlCJyPl+vV9IWPH2qUO3Tx173oT5KnKpsALscXkBL2zawcYNWeQNOgmhI+tKjjxgRcQ9fr2V3TA+MOMrYm2oT8ZUUSlL1CRRfoh+YLiTxRnrgYA6J0KMwNyNXcrmuVfb/+1LEyAAOiPNi57BPwVuTrSj2DLhKGyNG3FSPnlKjh2Idqpr6aDk/fiyQWXN7XVEjBqstYNWzoidqZrQuLmmoPyZou8/cn+nYAAAVIzwmoDgtNZ0wd125HC/gMZY00tjhTi+tQZduT7LK20zDE8c8up6S2MRyM5miCOLuV/FlTmbkA4/b1Eh2WWZYik9sEJbY1p+qAn7XiMoYrOiFToteK0q/YioMiQRTkw4xNTQMlTFckC7nTCMjQIsHxOju2JVF+ytljoiQlcpSJ0YYzm6Oyv/7UsTAAAn0jWtHpGfBSpHsjYYM+PuhTo9aM3qAuf2QYGHDWWXWJW0a9LkvVhlT+fK6ezvtHi4SjRUayaAABKkVYRLTrmGDpncYCzN+XkfVJCTgEgm9COlIn1RnadEF3WT740dGmo5yDtS2zkqOzR5tXxE72vKB1Jlj3lu2c7274vaw6WZ13ItzIocKR1ii/13AF/BVBQNi3EpPMRoWQmZOECQYVOm4Orqwcju4UZHB636KVSs3UJ1VHszKzqPUQ9tHOPKC2hO5nFx1GWzRWHEl//tSxMyACpylb0elCaFtlOxNh5T4JDZhfL/ecaLLHxC0CnatndQKf1irKikSU3aYJSvkOXbigWdWqBXGTZZdodB3Q9TvvTxY6zBzDHnN3cQyXP2nfQVo8NoavhH/hEM/0T3pKIemkY9NupPN6evoLBpdo0sHHVCJGdJBPupVS4iAk3KFoMs7TpaFQmUS2FotqYn5wqsEThzSaer7Yl2e2WOJN0vF1yzmW108vnTftxoLTmr1EId/ofRreV6rPWPJVPsO/tr5vuX+wknulUPPJ7L/+1LE0gAKcKdo56SpgVCXrE2EnWj0AgBCSEUnQnGJGi6xXeXC6zRHoj8Huiz2r5afWG4HDR6tMHqFeeJR7cXnz8Hbe01ev0MzMy7P42DCJqO5a/Fnp1TCy3/CoIe1bi5R9kXx5+9HjmZ/Hv0085+Ph9dt0HritHlKpyCEglzcBTZoRpkrZIqni0+CJLDjMoo/d8CFChMQMLkcCghVPIEYKn9dRSokHqNsQTYilBQzt9JWq2zGUz4OMZQO7NQ1HCQKk3O5SRWkpWl7iq6o9u6UM//7UsTcAAp0p2BHsOtBUqRt6PMV4i52f+rPVRIV6uiSASoBdDhOQuaDUxlqFGl/YTfJg1w21my8wnDZZPwLLyVtBJ01pbk9zHXqrtn5BPYeP1uydwmeGeniPHcudCdDnQed1u7I6/kZHORaDuiaAn4EAzB5MTiiMN0FlQBSGBJBaoQrGpu409KhgbIICZtTQmPCEpsJRcAxExcjHah1WYpl13pyXJ3OtNAsPIqc4zbXvbxCNGAcjIfiI+PTw3+FN/fqjsFiyFQ3Gr+hNV5v8f+J//tSxOWACoUlaOek7RGPpuxphh27CYpf4pwEArhAAJJJIStAug2hy0ELEzE1aTZuqHwakVcpwiQV4iKVqUFWaPyasO43LXwf7gXEXtoyx8set5CXODZaGH3IBTN9RENb0b+Vf9ST+r/yP/f+Q/44r+xM5SVX4rc1/HsdpQCCQRE4U4v+FICUMEsK6P8NVGOxyP1Tkxb3h+VhFoj8/eHyM+1u9L493X6j6z3BqPMrMf9rfZyF1OKi5N6QUD0HLqqAfQzsPFrfEQl/b/f9RoPNQ93/+1LE54ALwSNe7CStwXkk7ej0liZUlJ5Gmd7enqKWZqQAfNMfIjhSi7mwZLKX9PKY/ipVa6YDcVZU1xASqdvdlqptrNdUVatyTPW3LTslss2jVg4NpE+0QSzfKFv4ybqtDf6kzfUi6dW98jb7RaZla08npIL8h1oAAAmYadO8NTIuMWgUSTZnF0TqDUkftPJojr2m8lq/J56Sy7KBEetQLStHXlWPXYOStXryygSZvVIbHAYqSy16wdi2d9YxbrvnDX+57q5t/W+i3X/t/W/81//7UMTnAAu5N2NMMKvRfCbsaPYpet+tvY/v5ABgBCAApNhGJekNoDkU6RctVZ8CAmUGAzGodoyy0YuL0p7R8+b3DO2vR7LrH70Ffs1lA/VBidG50dPZYmOp8KPoXONHifWkTt/If1GGa3Mf2y7/mP+w8jv5np/21RxEkJJyCrQN1ib3tEmWnPy3rssJh8qLg86A+0LvMIlJLLbuSazIUz0qvBqGKxrYqF1y2o2XbUVjDxVToE8s5cgORXD85t3PIX/n6/Lb9xt76nfyh30Qepf/+1LE5gALsQVlp7DtgWinbWT0qebFG8z0Dz1UkSCUoWwf5L0qfp+Ftc1Nkeiraa6mR8ZyLhwbVUCyI8i0Wa5A2xepUJt+2q86Itx1cjo9v45aP87+Ink7/jxn7284ybu3n37/6Nu9H9zJuuPbifqYPHYue/gF9329nUaVQQAoUwAgw00PMoFZEx3DSELjU0tWrG3llzrTy/KR/ZdVCQviaMKnbdR2BD0Q7L+hrBPR8sqYuENgR5LWi/iQews7GqVfdcKxrzFvm94O7+IwOnKPGv/7UsToAAvpJ1ZspbFBb6TrqYYdOMus5+d53qOxzxHN5VhixtSR9/eb/H33rtWJdOTRM3dy0cYNrai/X/+P/9fw3+3+49d1xDxWu4uvn///////0neTafx48DUTe9YmlzPZiogVBargEkkpxJhQjzV5lK3B7DoOpyZ0QpobfSOFEkxZSIk5qp3m/Hw4OMBMuhxADLTaYBJwsIFRdJb7BoTcIj3+Rad/4SOhoRDj1ZL5LUZrcgAhwABKcwCwgVdyHeljfS1eDVskYgA0OqFFQdQN//tSxOgAC4UnYOwlS5GIpO3qnoAGrCgbi1qI/Ter1qBy5uV9XWHC8thJndtGtLSaAQ/dFddzUpQpe1MNaGKQ8NKrQs4DKGTtqlMjAAUgBITl4BpE5G0oH5giYaw0+0RhUeGYKICobmP0l33al22nBJOqVaVMUe5Jt2P7MsLfuswwe++keZpnoo/IpGjxyhxuZ4u5BxjVDB62xZ49xHFclQQAggpyBrgqS8sxpN5/qURq71oaDuosYWH6pOq8w/5VZ5oiuprfFNzPy3GuhVARwmr/+1LE5oAUoYVlOYeACTqJrqueYAKo3dTAalsQel4R7mMWHxOlwF6eo5MHHheJ1Iq3dZogKAkFJypAW4OoTYTeEiUiVjsv0Wivk73G1l7FndRIahwVNGbcxVFHaDNVCei4L+4L/V+xqMJqyt0o7efT6ZyGdGVbW6tu3IVc2is8ydBbrp6muONKAqoEABzdjItVrUTQBP7Ya+qGVKd1kYIIxpNkjVTioatuZiLk8oMqEOzhY87gL5xlVkWVBNp2Xfo/+39D9fZdPbRH7tX6dPXu/f/7UsTKgApol2tMJGmBUZdtqYSVMAlkGVDaTlrftrCCEAE5uVBBD17PCpXJGjcd1/XRbPoTROhGcDD27k0tyW+P7ubSbTjFWV2q9phCa2mGub+rMYHXG+1KNzeGM23IR1V0x6tRvRHqtkr1atsq6mpRdkMVNmiu6gd2atVWqqiyigjAK7OY6JN5oRURHoUyJZlPmCkkv2XcKhUWvD6crS6uC3YkacJhYTgbLwVNfLXuLRNE30d6HCm43o+7XRBHo/J/t79UsdU2Uwo08o+ky4hW//tSxNSACcSDbOeYTVFcKW3o9gjq7/qXrv45YACQAAFyfnLAOPDxd9P9cajbgq1vqwiLFwCLgMRHVdIWx89BU1pj8Y9bSj0K3VggRWKDL1KPaMbjjqZIMjBRujZxd6D1mPBJ9N2KofVUdhLI6PSn7Xbtq1vVWY1O+XPRzS1Ud//qduUdAACcoO0sFbQE1YyAlEE/1K36ZQzK8RkFYOShtXyvQ5Q1g1fYn9dN1ua10VVs43MZkCZ6Jmjxp+Ixj5ug2bm9j3XaxUO/NQlS2U/NrRT/+1LE34AKES9kbDBLAXWnbF2GFXguYZvdrLVhFFuNJJItN0lp0EPJ6jSXoQabQzlxbWA75GJyPtyiL0XnulXG5hcHqZTbJefcQeI627iajtTQ4lX8jIUGN/OLLQOzFzIxSX32mZV9E3IzgBCnkOLM5gHfrCRX/7Xw+ykAGVUEV4E0QlVn8XlOJjppCTgrFOFRVLY+rETt6LsWUtLTj0RAyTmlld/bzm9TCbPoPz0dYD2R5vO3HRe8/Z50+Ki3WrznoNO8fb4jDG3/Mf+amYNzX//7UsTmgAttB3VHoLMxoa4sKYSdaHbvjjVC2mABKTcYaI80eDEOENcV9dI0XwQRGnGDaeKQCojIkxJtFjnFB4iGK56DBN7yhHwPMYDaHDnrBtG0o4RWvoLMHcsqLhWyTWTOnDEbl+pJ9SxB2pKX28l/c0X6xB0f/z//6jA19G3WJllklasIOoV0P5xNxlP6jAfT1yO1tcD4SiwGtxJdzN6v9eRsITzLZyWbIdZaNGS9QgNRduysVC3r0Y5MaF7z38yo2VbIRGfECJ/b/N/+p5hN//tSxOKACmzNXmyw60F+oO608wou9YFCQHLeDkoIlmHkAiDz7JkM6lCfyfMMyZRqvIVEkCUqlSw9q49GEyJhBxVqOPyE/oFsu0Mz177mJofFu9JQAXNNKIYZnqWEsNjZTpN4+L3u+nUTLKilW9hcHeb09H/22Qk/RoohHFARkwFuzHQPEpkWq0lEPgY8U6ziPDL5GIjBfLKILIWX3zWpG9vpX97nIoPiKPd+e2c1XIKTxNTPTIsKR+eopVXzW2yYXdL+jRH438IBv/6f1WRyB4b/+1LE5wILiUttJ5jw8ZKl7Bz0Niq/6VoKuioFjKy+XlMpQsRrPxhqRYNwa8ovy7sMfCxSiLse6FQhnZDCgvWMVGroujmzFb35qNmSfOegSUoxt1VTEA2SOehkq6PU8JxIk52p8afX8Si/X/T+5RXOOUmT6n7NdQEJAAVTCUibwS0J0PUpGqY3T7bSxQVXz0MXfXHIGXQ7cB8bd93H8wtwRH3S8ofAHSzUAs7FFJBqx7DxHEcLC0WZmXhPVCjvbqiD9F0Kt6FH6f6/3GZOxqGzZv/7UsTkgApFM3MnoU8xjaZrnZMqWK6VqhG1boGAQAkqAToDAdxCWPCYOtCchLsh4KFoTWLMgU6b25caPtgZjOhRdLp/W/43Vvkpq10bX+/NNfMd9msSt2/QqHHY55M5puePS99a/Jvo5/Uo/X/Nf81SI+hE5YoRayo3FQIAgApOg+S2qR4rznVzI9RQtMNHKRkNTfbFNGW9hoPvYdf8IcsmnvjIIBitYP28QAMHwfB8+iinIlwQBBlbz5d4fm+D//Yj/ggQYPEgQDEuCAIFxACY//tSxOeBC51LaSessfFuJi1k8yomPg+D4fSVCrjKVcwk1kiekGxyCEVi6bXGrPs3k7AETmpvOmpc2Ux51YlVZazBDK5FggTL9UkM1MGjtGnoB/jBzFNtjaW71dZRYGhJtc5qpkjzg6ieJJuUFAC8ZYKLYhyNIpOoMeXVZlHQIlJSUTskSVVJuocqFYkMINXzQErAPZ4ePXLC4kk+I4BEWTT7bNJosDsLclwhOLn03T6+j9uwDE/+keTkZC8/0W/ui0YOayBTin+RUZd39DwVMBT/+1LE6QAMBUtnJ41ReX+ma92EqiIHXCA2s8ex40rYEgpybLkk5BUJL4toxHqtjeKx/dDUIRD08VtOqltR/T/H9YiGpibGldZqfk0zcxQbbae6lRJZlbl7xJ5tVZlVpNzmRtUeS90/9HSMGXkn8zCzjJIxWRJMaj6VFpGgAAEFQdhpE4VhtG+aaiGxiOofQOlHKF4bNHQPKIVTNGM9RkKfMhNfhiIvruyrIQYkX4trC8mP5UPmCr9X4iJNH7O7f9rfRtlN/Skr9//ixludceATfP/7UsTnAotkY2jnvMFRgJQsCYYakH/6SGfc3f+wASW9xmgCSXmbk7NIWN8SqDMuJKnA4m8TJ7aKZ92tSwMMSc0lgxmbiFSBRr60pQ7PLWxl0cjpyVRDbRmsBjKQVe04lVOVDQnkVuDhCprS58ZT8P5FAYGNA6C2uK4A6nIHlVQVQdVBmHxEOMdyVOcpaG8+XKlQmJGRQZ7CEoTJSCmoBob7Sm9t4fsdhlgmZ9ORAsnvT1P6YdRSzLj3ymtDMbNlWAcKAicUQvF2bbmNWjTFBGSC//tSxOcAC6yzdUeYcRFwpa7o8woSKkDEbtCV0/QBomgBbUu46MvKsicEQC4+i0CS4dypGNTdmh6Fu4SnMxbaIykQtIN2MRkDM8OnYYWMCW+OYqqyjdtu2GX/VBysLaCfZS3tbKrLqdWBiHLVyl1axVCiVbEhIezZwVlaAIAAy5wF6WwxIcCTVLcvEzljbW2ftSKZsLmbBMMHLMuMcu28Kl6z80fciyHjj6OWwmRVEjqOO2sG7kg5XZqobPjDafzM4o0Y/70lxJOj9+v9tH2H0Mz/+1LE6AAL8Hd1R7Bn+XySbM2HmLiS3M4k0FYsNJVpJRRUBfTyMJKiBEYMo1EQcDBGhIlQKlwVxeJob0UCyCOucnS763oFK5swzjDs7mHhYqNkWJmc9MM+sqTYUD51/NibRn/2wibWXr0/j9znelR5rOfwUrD+VSZaVJJJLgKARoXc3z4MonBPSVtZ6QmdPGJARibNq2JGfEekf70wOaeHi6jue2Mn5Jxr5PL5Xf89D7tZY/N++b27MpQvmf3qPYmbRa+yRBsPEzQl7ZzoOzXQhf/7UsTmgAuktXUnmG+xdaZtqYYIeBwqZRrcItvbUklElQA4DZM0up9FGchtpp8h0VU6V8dEIelHLTcUwRULfZgCQcgFRot8xv8XfRTZntzV1Df8Jy5FICtZ8Qf4wfv/s5WVxy1SrfiNVfq5YE0KDILOBe9t6ACAAArcGHmGqQGPJrwbisyjL5CQaaRnaZBD8rWl86pWSTJgwRMqT4vDZafl+L4cRPUjhflez7OPTI9Ozqo7kFg7EczZVFziffM3Qhn+6/gKdxv0/w9sMtRv59G4//tSxOcAC51HYuywq0FpJm5o8xYX0fjhVyQQQkTCSoG3KKrsddtnKicDCk7HEKyYHoNV1hzjabHs9DkP9t+r5qyxlnEIh40WmvRBDYm4wifhEXCzEfUXe75hdf1E30UzoP+hbe0KFTESzX/hEDn9mDROqbqKI9rjQ+nQBRlolJFzgK7LusfkS7JCw2HWjTDlXkB6lr2wJMUJ/isSDMyo42cr75bW2WNm+WrCP8u32rJTCWY9+conf2aUnvEA2Zr/7tSR2T5X/IPZJo3f8o35Qkb/+1LE6QIMNP1xR5jxuWGebijzFi78g/wvH+RBmIuju5hwvP1q4qGaqqi4MpItRopklWCduYIAbRwq061YCrInqxryp6PSt51gxfOVaVt7fgzlipibIZUTqFRo1hW3Nc44GQaDp57YMGJfwud/Kv/Pb9Sb+5b9jm/KE/6Da/uQiILI+8s795Qf06FDnVUAQDACACfgIScoiq0SUvaauV3Yy3idEiWipODIXJHLnq+SxmDbQpSfKk/3kPl5ZUKF/qaOp6N3dazQyzzHwUFiO3iVT//7UsTqAIwZJVjtMK9BhKjtNYYU/pX/E/9X/q39f9/6/0Hf5Tz3QBQBJBSJcgoov202Ku9Os6Zav2VOVFIAh/c5Wbe3J7kZkSkdUtyvWaX9fPnS/kps4JTz4ZYEAY2081hjCggo9tEZqbzvlH93RyyKbOR5F+W938gqAIAAgAEyULbEcExnJLWPuwCca1BadbLCwCYFAKtEAp9wXBkfc8WNvFxcWQRSWLNvviakNqtCa+wjmkg+aYCbq5M6j4IpXwfU5sUiz+IE/n/5b+K/6Fv5//tSxOcADXlXZUwxT9GGqu509ij+R/5f/f/UAIAAFyAx8g3gwZGl4GatzXFIV8KVpizBKAgGbaswO4/SkZQzRCN5TJhlEmgMqt3G0lo2mPZUTefAMvlE4qzBcLZFIVQ8qJtfhc9JyqCTfly355A6dJQ39CQvVF0K/yJv5JUAAYNK/OgJAARhokfTDSPctItRIWEOvDCarwKgXWhq16J3WLuNxJjm7zRRu5AaRP/+1l15TZOxn2B579IHO3qGNPk7ZlypaZ8CTo18wJfzxW383+j/+1LE3gAKtTddTKTxAUoV7KmDNir/x73539f8mU8ADFmeC4cFrCqrOkudNZ7IyrqEJ7LmlbEYZX72D4CfI06L0BZ50VSJ5t59thmlB/5QpurB2EeRMzpRuP6D26jkdjvh0iW0GP5MVf9D/0ftqF11+7KErs5qGqupEkgp4qTcJY9OFHmArEPotrB8J2QyXD9ChAs2uTyJHdGKw2WJKC462odBMnRvge4PiOml82QKJnz3/JZYuwC/q50IKC7veyJSJ//SIlc+ly7aIgof1UIm9f/7UsTngAudJ1lNIPFBhiTq3aSqKC86JxNsiJXJlCOLvLi59Svu/y913+zLjEoXck93KFFPuRcP7IMkXsXF7sgdDhgIAABVuhkbc3WKQmRxuBY7IJBFIRDmn9t2ZP0xNqPTFhER3KSsevSMUkDSIaDTdwNekWIkP77yWLfy3/8s0iRSjmpIjoV9jqsRL+cI1veH3b2OWOhrVWzNWoJ5E8Gg6sFTtiP6ZJv6VQEAAAygAzhxyig/7r1135nZEaH1YELANy0+LoW4z1zfk/YU6lst//tSxOYDi3UnVE0w8VFlnmrNtJYofxh9Q6EWacAq7QPN+FRpZeESTmejC+qPtVbwA25+rS+UDAzGp/vt+jsWv47Q1/yFEkpOochxeVEhCcKE/0PX4B1uRPni7QcNVywsgi5zmFAR59d3ExFFurc9NtBg58rzBRlPf36+/TUYq2NaJACBYhqz9P5wWw0HlN1jrFJ9mhUadCSiipKDlI441SXtlRh1x1UhZoQT1pufDN4vFiICxwqKUiCnI2Qhjydm7KjyvUDItH6f8+pT8b8mP0X/+1LE6YARFZl1R6UNeZ6hrR2Ejfhk60lev5foUJAYu8zhpTSv8Ttghzoc+KBmoYagACEggEgJN3iiJ+C2Qo5UScBMGgFmFSwBBcaHxgooiOkfxtlXIGjRhe5d9QxQ4n8M35wgYi8tzhHm378Mw1SH3DoEXJTSFUYicnR2UwPu91nXWgAoSgQSAFJuKLGkIUNMWk4ATB8Okio8XAohQIxgOQbWMNQkQe1RkOoh9FUhgdKHRJkuo1YP36f6kuxr0ft2a5rp6nVdS2glWEf3EnEzFv/7UsTPAApUh2bsMQfJSplvqPGWHl9PWpukAlQCiSU5B0jJFBYuxtukRdtp7vwfB0UWjZaVSzxbdvETpjKYkzOvjL5cibOlHFC7Wcuzkrlw7ZXvZJAT2ZNrOlW5N03meSXq0n3fvLts+ltW1nZzFIWFEERCLzu2OgRCABOTiN5W0fGp0shr61VTx974pNvwEIejmUXGUBKFrH636HN4up1Kyna59cbjnP1htszV7FNlBOtn4J1SvNaemoM3RF3alCs0rOtURDXQKmqOWveSqSOV//tSxNoACvlBd0eIcdFHle109IywFRf9f/oVZxr5zr//UaKSdBwth0Cp+Qw4EsTjIDpUHVcQrmK1v1rI1ntI5aslRsxdS9MgqeXSrXAkxllDje/Cl0ENgk/gkSnp6umKadhsXDcTBtSFIMObvc/qU572M2TadGR16V31DXqktEElQf5rmqzF5LmYSldoQnWcookcPmTIqgfiCq833Gikk5+OPyahR2ReBaUcycuuNksgfbclndkQSb+z6powKLYwcFbiaUL1upqrG7ndWVchfv3/+1LE4wAKWPdrrCRFgXgnLSmFieo+x0igcoEuS0CwIsXtQHOpFwhN0asWIxkdDkXHkx1oileWarV24Pf9ceLMUevS1jGBo5WUQd3N4NW5OTkMRYZgipZWYxnmcUgd7oxbOv3q6YPvZZJ1eKFAMQYwFBQeEQ1bN0t7FUoVYAEu+OsRdIOdCnwZRArkl83JRoPggi4UrGTd8ziyjCiK0yPDitx+7U1Qs1rmroWlKndEZWf0Qz26u9DVYwfDZbRM+6PqznWcz6Lq+jTFt720/2HFLf/7UsTogAxJZWLsMEvJcJcvaMYJflL+gF7GWki3LhGBaUMOAwDtYSSnKMZUvi4KosRx/SbpBtMyNUPzX6qQEZAwFzNOhYjHZjuijgcxepZcoF2MHkP6g/IN/BYk802zMLC3P3hKdq1Dr/RGeltQ5208sRO0lDB07fT+QOBzmk2hD1NHEABlUaSKjuFqVRIboskZ2vTjnVr9c8CYNLalM0+85N5+w+JTBswDiHdineNSlP3FYDdK0UbMHkdLJ4SEW/k316snq9TJAysxdxaTeiev//tSxOcACyS5cUekrbGMpOzc9Ikyr5Uv/yC9fKN+uX6+SEDJX/SrvnxonxbdFWQuJstK8IAjAHHIeByAuFIZOQkJSSmyh3qbRdr0rK/BQSQjiTadTMPOftZoqyKq8Pn9ZbaXHUJJewExOeb9BAjde9JQb+W8n6V4u/6+vlf/NNf9z2/dCL/QnddTtcgkgBFQR8rlcWMIeBWa0+D3RKeZFjwcATMaHKIr409Qr2u7InDfeZbr1bsI+/kz79qFNA2yRB/tGfnC0/xAf/qG/2ERJfL/+1LE5oAK8TVgbDDnwbIrrWjziuJOoeHdfU/v1b/o///6/0iJ3izqGJfuSQIAATvM4TYCcFuFhDNTgO0EEu0Qcx+syHjIOlFYsXCkWmC+SKaV8WQgYpgOG9df/LvN8gGtemqhO49n+AIvTRwUM/1GeutTeraoVavCFg9YtViE5G7Oh9sVb1HacwogAoi0ENJhqqMUTWKGucpWEUn2QcBwo4cokqtUTOvE7wvP9EmPCaG3qtGq5V/veLcv2y5vlzl4dRMq6RFnEXLomBBE57P5Uf/7UsTigAyhTWtHpOvZfCutKMGrRMThomv29kCerRL56vM1bP76cVowr/6waNEpNWnGoS1VjYTBOFGju4tINgiuElZH0I5aj+CsZysZICYNGBot43MX1mld9VZuVXFd+IFkdJ2eBktduhgZjnvoVLdfVvV+YXay+f6f9PmK88w5C55WZlGOug2EtEQsmmJXOwASSnAxoLwsnbJk04kmSB4sEESA1HAgFhDVH0TJ41bxMssZ5Re7nJJuil3Ont1Hl5UJR51BBHozGPoFQleyUmBj//tSxN6DC5FdXmewq9FznKuM8x6QrV5uNfb29WTO9X5Gj6FurdH9/P8z33eX6wsfcHdN9hYAQgEQFLNzKxKEtjPK4d5ThRnhEcG0jHKJRq8/55X0q8g+paQAkDQUNgMNS2g+X5NuZh+fFf8niOL/Froa8NzQZDYwOBUQCo5LQwuoCyjHAJE/NeWzAgRheusj6f/61SAAW7UaQCWhVqgYQkd4tyNBh18mDMTeGHliRGDUcC0jap5T67qSLDxHrfRbmdglBpHOZxJzC9Ed0R37gKv/+1LE34ALsLtabD1nwZGpbNz0qXpY/gDyhyRfIV6A9BnfS1bjhH1jbZLuUQ9q/3LTdL4WcWSUGUoa2sVSlgtNLGuPLDTpslhverkwkpuJNbvYXgAOdp1/l+hHtbSW+qWKTZmd6fIlpgb9qF9R/cTUXY4oPs01xRSLVRtR2IRC7rVJHttD605cFnpd99IM6IAKUiHEFKCwG0e9vYagB6eNq6w9TssxhM56IXiVD4G7vW9kvSKoBYHOaA0FR1qD4Em2TPmBKr568oLPP6isP8/mCv/7UsTcgAwhTVxsMUfReRTr6YegcF/O8fJusozddHRupP/lP/vqw/oaePOSg9CLJKCCYAxDmkHUaRKRctMQ80odCcL0OI0DCX1tEG6sVYEfI882KSdNARAerijDw1nyKt1FjLo1kU5zNVMZQUCcbLjRNgqDW/pfq3mF1qOFvJ+e3UStnP8eSl36IXTVDmZDRIfli7uQ9baDSiCVESkSSSCoU5+mmmkslWAhxwqs0jiVaiPxiK59d1wuJsWohpnmGFEl6R8tM3rjxa6IjPmVePAl//tSxNqDivSlWmwwTsF1HeuNhJXobJo7zASXveggOfrp+jeQ8r6t1T2tVGfoX6KazIKyO+KvvoP14tWcl6gAC0zw0IWEIxq+QdM4VhR7K3X7fWFOVDMBR1+qeM/afupnavNjan2a0wkM3yY+vyXcratPrTGM/BUdcyIdL40uk8Gvz8+Cgt6nPeP/bOUfPbNf/MdeeT+v1/+QoZWA3k85Xi8A0BCAU27wEYaKGBWGdNDx3UanbWMyrkh7gn0NcU+xz4OV1tgVbaNeNmHlVxfBs2z/+1LE3gAMoTVe7DzrUYwmrSj0ndr+vqsatEt58Rx6lIPqxteqHvyod8acwVQsNqZ0N8/qw2fYo/VfX1L+/p2v49L9W//qUfLUkmTcsQCCFMJtA6WapXF4S0MJEQCIb+K6dMOxtCjP9KRk65uLNLh+/YBLTxXGdWZ3XMrnuTXOfetbeu6U8oo+cCwkYXQdGOhj9gb69AuW6N483VvIL09W9/Ul/ynqa3KF//O/49fb2LU2VgQCJKBRTlBvVEKQ5yMp+gT7UKYa0fK4KprVTbGuwv/7UsTYAAwZM22nsO6xjKErTYWemPaNrUFCVfzE7ESPosKw+P61L3yo6mPGM2W1cbncTAl/xOf/1bq2yn+rdadvV/+PM1JpnKP7dXN99ZO1Pyb7XSwBAmqBLBbRaiNODCfTGcxC1ltY1RdFHe02EGLgCLnmgUCGsPI+GUkIt9A9ruSq62HerdDe5IdoUJtJpIhrg2Bs+j6TettZE6EWFHQhulDkKyojgI/bjAACW4HWMI1LWsNyfpFCMyKLzkUZrFJodEE+aZlMebBRcMb5BTbL//tSxNQADPVbXUw9ScGZLqsNh514N1Ra3QWfhCRzwhGeHfpq8xyEUMdqK/hn6fm780KgOMJqEkeWpofhlQo+r1gAB24CN7WASd8UOLhozttBMVfilaCoxK1q07roPjmp1Sw7Cb0FDIAMBBJvx4fHb/lHZZE4o8JmM/r6lpHK35q2OWGDALIUzyJ4UaHbWKJeTpErv0VBRpJohFFFwDhJwhdigSg7jAwNDYlPIyqE0rwos4OB4cnK9Pwp//ThV/vSGcps9Z0hP2SWHRcOF1jxuw7/+1LEywALvXNlR6zy0VibrST0Ke6TjXPVyP7rCj1u3iniREN2HY1+sFVJASU5cEsJiHQxlWUAGon0TXTAg1a1wXCPPVQQgYbFQUysCF4jseGfyWQtzrs8q3o9lEmelX9BrmdS000PXq3upOe34MRa4RZB/a2Ws2BvQgSAFJuYM1LekyW2YA9bIHcrwPAdd74CjzYcFydCK/SLFUnYtpwJSFsTl/9+zu699RroHShitiTrxlAjCEs2aa/WMLTURzKcXfMM+hbZNvUeEr26/Lo70P/7UsTPAwo022JsME0RUBLsDYYZ0J0zpQUE7DAZhCWxMpsQsqKP28qJ7JXhedrUNmhQUIRKfR8AlSmzms+pLHxoGchKLrPwjtdOO+cu36ORve4ZASoNjSa467Exg/DxrLkPbGe5+RnUuRCvPf9cVyzta/1JjG8930KI283XQxlbMI4E1ZBVhddmsXZhMg+B2qc/C5ngmUYu46dirTy4757A3rp/GxIV/Wbjre/Ti1s8PQBPoLprJL6xfWj07qqTD8NjoJqTLnpxwMv0vyl/9Z3+//tSxNoACfB7eaewxTFEnu3o8ZYic06v1//xgADc3ooY1hBdWOOsxMAGDNTy2mSyBCyWLbnZxi1F1MiwqB5PiiJHR3Wyw+ta+dN/rT1Q9kTBTVcHsqcbE4QG2x8xpyOKgQO9GXOQb9KlvlRp/6qOi/6V3m2++rTU9fygB2/9dSgAgJOQINycQjdt1WgCEzTG5OBE5U8cPwTA9WFWfUT70JvNdupo25i/6+86fqOZjtNoPtu0RmpsAKic0WNpQM/lr8de6JOT2FNvb1PDTejeh/7/+1LE54ALvRNm7CVN0Zeq7RmEqX6/VT/t+WCJTUkZKXiHptTgJkT3w64UYrQ00icmJ7GFS2uvLLqPhNzS61vLmvWOWBUGpPbnQxuf7RVT2eoG1dHsC1o9h+i7lBiiucpqq7rFQm+v53/1KkRh+yW1PITPbmby/1+hF19/VUoAC8WOgqlY79lh4wWAJ6HG3lTE48zyVRGG7EsSFzSBR+JisTtiuxgyAByhJ/bGVcEBRApBSEPtXPwJFATJ5tuU8jsv0d/9G01yJ1OQbLmtf/0EF//7UsTjgAqs+W0nmbExjCkrjYSeGDdTQ3fBWnqhxxJ1dU1A5GZEKEvLIUGkR8WlLsnqSjic92T8CpNQvJK2CA+as5EiRx5RymSWVcXpgCJnHOS1LYig0ZEQNB1T9IsBkCUFng0VQoGumr5UiJUgUXdb4liJkhDVfkIAApzAKzDGbDVik1GmOcjYqowgmNool5TD7ZlQ6TSlsSVFyM0z0ziTuFrR8LtG3rrX1T8MQOp9rWPQ13XR5gIFctm76I9Tnt+y/cqxAQeRFkBDQIjjfSsY//tSxOUDCvFLYuwk8NGLqaxNhKoiD5TfwGOxhO+XEiZkEgElQIeOcRovKF0J2bykK/CLOg0EiemZ0jor1E1vFwKOnluUWvtcxVylLex1Ug81SUldMYO7VONO7/OJpU9TDQPem0Uq/McX7f/URB1dv/5gwfAbon6H1ZBy7q4KhSoCIVASU2lQUoAGHecJoK03i/l0FU0H4hqjYU3Ais0Fo2Ep8weAFT5aBF3dWSpmGTqZ+xbu4WhlgP/s9PBzlPmHJziWaxzGkIDCuirWW/sPPf//+1LE5YGKLN1gTCRRQZWSbF2GGTj8k/y3s/otbFelS9lopAiS0lTS0HcVVfF7qrd3+aI0JMiMCYYG0LT6S14MmiUZ/XqX9dyZ63a5a1TzVPY/Yn5h6HIPPbUSiSvno7HoXc04RgBpm7aG7fI///i2/9P6o39P//qzb7v71dnaqe6uQQESlBZKjVFuj+7qtbmydhUXUcmpyEB+gjRAWzInEsDyEV2dUpA+rNWPhmUOLeQqbnonEMZRn9G/Ayf0i1z7k401Ppk0sV/3tVcId/uZEP/7UsToAAwgsVptPMmBhSUtqPYVrtJa60z6QWgvGKbWen9dxMH/Wky/aT1////5m7/MvsucNlDcXEaAQAAEsqHWkaxpIY7zF4OjzDEOyNDK2SJ4LtYE3kZuJ8Ukp+Uz2u1l+Y74RGS5AkVeVcscdil7iOQUPeqln7IOeruGsBc7//Lv0qNECiI/RMykkrTQWTQpjWpdWl+6iY3//lE//t/WXf63P/Wr9VJI6buJKQAiETz0FB+BJEsOrkvQIgVZ0tiZlrDYiskkGTTIawhtgNLI//tSxOSAC7UBZ0ehUZGFMyydhik63ZFOVGXIu5IcPqLyVh3fmjNFqvfcaqFRXmNRa+wuYvLRassdXZLq52nSOs54KE3W/1n7rRvUCPv+tvruLRl//8kj39f+VP//8w/0Da/qJx7+tLmgfoqABAINNJqDFS4eQjJAAs9LxAFLBTYkMsDhSyQSChYRprooMJHI2MzESbSrjKR53eUMefKreruF8q+AKO5ng5O6n8pNV6gomN0V36szIePBD233Z3Wai0kKeX9ku88idCGIf2+qdGH/+1DE4wAOcYNjTDGr0c0wa12VtqK3/6uTBa/r/z7f/+oo/5hb92/s/Uf8igQACXZBFM4/MuJCDLF2hoCmcMPb2ONbUGaC+TJq7OA4FYgiup3hj4gBC9TbPYeSO5kTj/VklQoLVOhFBboqpu0iMs0T1lQ0iRXbqX61PYE9PP9S/ZbIgu/6+s4ZVhPgRH/NXXrRyVR//9Y5n/pN/O//ypwAhILZg13mHNIQRRYOJjCREwYFFQFZap6cIyBQBbAsN+yoAF8bWB4dVVX/yOy5DWZq//tSxM0DDymLVGy9rcHxsaoNvEW4RCPvluiuY2sspqLWqlyL40uNyXW5ifApFj3ND6TEBIkxylhkfRNVuRBIko/W6LLXOLNT4bRLCRZ1vz/1Ug4v/1cxH8bf9/qmz//+s9/oABAlEAPygzNE06YGF2DNCYsQBxIFKVRfB0MPSrNONDgt0bnMFkN8kXKnhsx7zoMInKfafr7oOdHO63FJ00b8VqtOtfQqJBy/7ZtDIExfV5YqNujmsDIhDefVU37xVYynp/kL/6El+G5SnAmQMqn/+1LEsAEOWY1WzSWykf0paUm8NXiK8/TTIAi0olly1ljgIMySvhO6fyLkp56TTXw+J67VTkm7jQ+/kN8IZtZZcb9GqTLX85H+xt5qGueOANToON9NROLTNDXndfnW/R/7kHOvkbxyV2kHE2ndN+G15oGkszKH3Uj2wEG48Flzh7CVBKRIjJu3KoIasVudVsM7R0OGc4TXxFpQZvISjopr3vMEGOI3cq/5wh7fHJMnQhLx/u4/dypLqA+XoR85zTWkREPi1X0cn+phYb/aAW6UQv/7UsSVAAyZJ1lNLVMBcKUtpPMezlQJsGwVRQH0ZZ9AHxEB+CVB4mQ5WPVTnhDQMByh5whtLMF7ybHRTe13d0CzvaG/oPZtJbOY/yhGWRexUT+fWFwz+i2+IY9ZAhhoXRtHRSgAAbGsr6dT2iWrrfMf6lCVlT9fi676lQB0AAAT0fDHKjfxPhOZkq839P4tDHTxwM8RClarX8Jb81hGnHEGF83EzjY08qWMdqipKybZzkx+8yWe+xFHJZaS5JgUps3pJfnA4CwwROoJxPU2vsEW//tSxJKADJ0ndYwxR/GlqS0w9KrOKHVq/olN6+r/N//+v/b847XxOAEQIAAG15gYI7gFbUFPx9nOZb1DMlS82KDScTRxQlJSTY8ft4oc7yJJE1lR6hylq6ZauP60pkeUoqbOJNcsu2tEbe2wXJ/0v1EmZLdVliyS+dBwmr0V60+tpdHWtuc+us4/+30P6v6bK+v+d8QqAAB6mERguAgmRPL/P8giZkXeKTleHgfxfjoTsBQIhSxMtiDxaGltyYAvwrwGTUFEpSYuruSpHok88mz/+1LEiQANFWddTD2nwbcxK2mHtPhOKFdJTGRZfyobVeomASw9Z9ZZb4nhASHi9JER571oBFFZ/3/In//W///Sb9f87yj8q/UN/VRIKMShYydFtfHmPM3xPyMmIh5pHGvr7gdGSNQnc2jSYYWcsAE4cn9D23zSfKP1f01uYfw5but54XA7iNfglgk7/Uu/WoiicuIs2ZOJoylLPOcAdZjl0v8t/HsQP1/0DT//ot//t9dL9Rw9qgu5qWR5w1J8ns/LuzE5J2SOFBNsrm5tMBFqrP/7UsR7gA3FZ1ZsPafBtrDt6PW1/q4kTeyntWm97sABuW9y8ye/WVy75EYifi1XqzFtR/ONX8X3+SABtXbqNq/OiNUSAgyRgPVtF6QFFG9pmaNQP/jvG1Vy+o//P/2dvJ9IKcTKaRbSaMNchocUcm6IJ8rR63LLCfiyxOaq1CkV8q9Zbp9zUzCJpfXk/7db+WFeCRtG4s1R49nh/FLxgJOVXsRR3OqqsTYCRNbK6P6IlJYpNeo31IZwGJT6LVP+Ppr/b+///b//mbf01REJgShB//tSxGuADPUJayexrbGmLS408zdGC7HiZTCSyZZWlw4uKcYGCrwXaaujEg9qUeCqOA7OIppgc7UNB8/xjxRI9q29BH7cqKGV9TyBv3/QudOVmUUvRWqCGOIhy5RPy3//Kp1o09YIASkBp4fepUw42i11vKwRZccJhLT2Ut2T5s4wwuoJwsLQ4hYIBWdjCgBaxaOA7NLW09pX0cOm0j/Tar6E6H7WeWLO63LNX8eNACjlOs/X4a/h3+gvgAKkmB7gqw5UIOdRC7tZ+sR7v1K9anf/+1LEYIMKnSdoR6FPsVCU642GIeh2hIoc+NifCWJc0jaDWj1dn3nfN3updlNWJxlzT9flQCiC26yp1RqH7weEhdMup2Gv3cs+6xkKh91a09cAlJJwPCDCwok/jxQk10VEOdVj2UlFiKyUoxQJ2C3rMZxio946/O3KGdDZRsyIKQcNImzTPNc1PHNePfVPnF+1PxW3JZfyPvj4THIAAF2AxVzJiS9V8PG0wpZDBCC6rpQ2xpurOwZMQgckK7yDR2LydNycTjAYtag90uuNpgrXsP/7UsRqAAo0wWznmO7RNB7u6PEeLl87ME/ZTARZU1b5Qt85ts9q8/6jP/3Kl9T9jv/lCgAEmoAHEEyG8EqNMkQmw1D4NE0KF8Sp87in1bJfsnCLzAkzjyhIMzOinTaMI+sIJfUWfwoTcq6jt5TjLJhXq2A88OEplChuT/v/+v/5P/4oagSE0iZKkcHGLQJsnD7UphxWlVOCsa10pXJgTUtDzcp3piGeeSIgUkfbemv0+jp8S2Q9sO35f9vgeHDr2jj90E35v5b/1UThrruu0zbO//tSxHiBCkj5Wmys7UFFKWxc8ooyL9n4YIACjJtgTQBwEjC/M1DwiGs+DpE69SGaGYo45junTqtcl9PLuEq1CHiHRkGQ8vrytX97B9fo/ITuXVoho2ObzvbooDwzXu3xf0Z3dJ1B//+Q7csP+n81FLUEVVIAJgpQMsRWqQkCChIe9SUICJJg+3gzxB7chNotbjm5TbIhhOIrF579goiS+aAQJXtFwNLUOjA99yASTfq6+LL3Uy/a42P/v1Lf/m///1f5AxSIOrAECKvCjXMXE4L/+1LEhIAKGSNxh6zvMVifbB2FnjBD6JOhabyshc6YcFIz5kCu1LJFptxiagw25Fmt3kD4O0is7+YIajogPln5QFsspzMg79H+v6fkW6nKbrkIsd/8qOf+8jfR/1IEBJBScAhIabChYDjj2KZLMEYmGCGG6ds1YNsZA7WsD2fXc60Y0ljnzmciCTdRMJRm6iR9CFvKUW6GdrkUV879Gnt/qOvb/lSP77bP/de/7fKO27VbTVYF64cDMBARhepoRHkNiBDr5upkyvmIt/5gM6lRhP/7UsSPAAqlS2knrUuxUiKrjYepcDjaILhzWULkOw2+U37DrIwLQKIRfRhEdLt06IHCEz6Y0yTMzdIDg+nezwTWb4EyOmoAAHpAJgEyRhHpE6humWk4LMiQeDOpSM4I7Gk0osoQbdAjpCTscDLg9Os5xPXUj1PVjXkhq5urdB8O/roBT/3B+MnkpjzXQfEUuTn5/jpP6Psu6/rJCAKrQJOpIqUkO+RVytLWkC8xV5Y0r3uNO5ERsUdmBQxhzR8s9DBNdUqR+cbplW9ZtFGIfX71//tSxJgACj1LXuww59FJnu5kw5amxcBb/5UF5940757a86AJHWPvYtmTLht9HyP/ylUAMrggD6TJEtZBRKl8Q5lKZuO4S6mMJDX51quhzwuzoJwXVLrgjdrpz7Vq3sonTF8AYL6vOj0ftG8iGy7e0XIqMC+EN/2i5fn6oaDSKCQndGmuhQVx5PydjOLv0fZ9H0tmWphjMdb6gfSTOJXRjkH8zhwDPanFalukSzxforMRQqK8E5UMA9n5H++LWVf/BK/4VI+BRioHw1L3ZnB5/HX/+1LEo4EKiPdcZ7DswUue7Fz1Mjq/nkFOAv8xz8eF31twsLfXfB+Q+Jfiv/1qFBIAgAGtVWlhFcMgy0JIWTtFKqVdHBQo7Is9DkyxLOKIHV2WkEQH2Ulstr1kAT1Acdq4U8SHREHHrHxYnECf7VA3/jQbTTRoSyxiHW9R6j7vs+36CiFCwgmAlE6MhFDAS5zIlQVHIyCPluJPIkZj7bwI0j2EgA6Z/hYToDugYIcc1Bcxua3p2yT9TlzxAD1HbnrlS3/qGS1uqq8HLNad8oY/+f/7UsStgAv091hnrVaBXx7tNPWduP+GfiNv+xHECQEbt5fydoo5kPUiGLa4QMBTl6c1Y9mbxG4yLjXEm2oeAMZoq7RPQpUCKs9Sr7nH6lrC7ypFJxwRA+Tue1sMt/qjt/5T/5xFfU/1DHeQ+Iv+kUIgBWzZGF7PZCVColsxXJAOkWSRxSUe6kLdVeStrnv2fYF7RBmEr0MQcfx0vuaa9WlBd6t5o3bznNxUAXvse+g1NWm7cm3vvsW+v8/4363+pQTFIYBKm3PxHSGhcKxLYYRG//tSxK+ACoj1XUeVVwFWnq009B3iBwJLh+fr0IWydv5rXS/+nh/7MXJkQnFnXREQ/TR0YQxn09cO5CEnyMqBCEJdPo31QjOvJznfGYHxAXT9cQHJTd8mGgAFOWhdhKQLUUfPAhuiI+suSTWlR3jBEk2xEpqKkdNS941AZDKI26AErWytvSTtqZNFVKopbHWYtOWsFAbSerDbJgyXER+m8gs1eSj7jP7dwanmNfN2KUlUlgqCwqEjxosVWE0BoVbaM/uVAwAAAAB3gQEG/QAQU93/+1LEuIEKUPlg56TwgUQe7Cj0nhAAVEyBiLZHXj8Yg/CWTZACI0cUytS/cJD2JEFMSL90kAhw7AeHBSk5gxuH1DTgLNHhLCRIyn4kfF7YlfKLb9zr1yu+t/sG/qZVFsXPEZ96Gcw2IZs7cRxxGGBEGlywiWQJl1StwfMFzIyrOSQn+ZPDt/1ALF/I0Ni5UOZFuX050/0IIGpzSkXZuaLqO6mXdHlr/4hVDAACU3QDAixkYXhUyeJsz3PJK3jqMPykcXZ6CMN1phrqSTYDzt1rFf/7UsTEgApc+WlGDFZBrZ2tHPYkSPqcUL1mIdky9WDoa6MqpXuFOzSoJk2CUIFiR0chTj4qMy/5H3hr1Eo5E6AQACxNgYZhICoFj4wGCSwaaMi+eFpIEiCnE4/fXEt5Mmr1ncvLMKY82h3u06TsRf3Bi6w8n8/ISiNErO335Mdmi7ymKcZp7v/6VQgAANLQC3ACkJNDqOj6kmFA6UCAeK87lpTlsZ1Evj6tHaptOPuY0WIBWVrKscWY5RWN/PEdN7CJ8dBwyG1Qj0QVCz5/bJ/v//tSxMMACmhvY0ywZ4E4FS7lhI0+9Gf/WxxZ1Wo7p/5QEvRRZmgAw+A0PwtMBriMjCE2CdegPoSpuOnlOrp3u4znpXlKz+OZRvfVHHwkvLAptU9XHs5Nl+RByaY8q67Ry/Vn9CdtNtlUqS/Pv5/1Ob1/t8mbSgyYADDV+4IgrNJqLsUoccRBYO/MQdf2zxGPZwxP0/U+voP36JM5WVpHv3wiMhwqopyJq5MYouOOcAdUmLVHXq+/0DVTZ1U58QVjiGxOa7K6jZ/OP7ReW+zt1Z//+1LE0AEKTLNq7CSpkSeUrKmGIPjtfRm+7epCA1HGUgii05RhRkHkxx8jcLUhJvlOfKqMgtw8jwE7xp4VdCafqUQtkLCcEBx9EP7yqsUfABmO2LNdfxwEfWXUw49QJttp+LP36wqLPjZvQUP9euP7ZpZe7F+S1uz2jXUIRBEwLPeBSZbxCplErSIJYUFK5ZwM6gXTXWx97wQ6r9lzXTNZrpM2rhC8YYqTwRqzwq6HN0IFlHwbtmnAXnGkLOYzGNcgZ/V1bOIXvOZWtcgElKtk9//7UsTfgApY+WDsPOWBU6luJMWp9uaW7dPZlNR7IlORNJpNFNOBgTpp8tq3ZnQcpC1brtupOtdjr6n0yOm8Y9IL+t0flxgM6k6s0wGJjEkRjt4s1HqHfqEm2xWtFDhzqH3crlermN619w9k/40M+3436P+pvQ7djD4qGp4kRJsClFyElOo6iFiymIbUiW0IYcZfRuFYSdBfoD1F2/hGi9M96FaCyDfl8gmOdDIwltaI6tQd8YPQoIU6HlRogLib9qq55dPoOaFlXze6me+tm9nV//tSxOmADD1JY0wlUMF6Ka609Z2e0xt+qbW4CRAqJCe35CAeakXAz3MXbFhOPyDMkA+HlQ6HEtGCwfaIS5byxB/VqGAk/MK1zrR80K/RXGaMMDxnxNlzne/aQAg+3tuAF323IIEZqnlYocEdDHM1x9RrdFGCu6SyWT/+yggABASLCKES4RmSyYOvhWR2I9DK6alBEnQT2a/Oo6hudvpHfKSrstUcl6nLJOljoQ6ne2/TurlC2dvB0c4hjh3fxwG+e3H26N0HXZ99yorfjR+OE+n/+1LE5wAL3PthTD1JwXApbrWFla7xw1nu8n/5MgAAAluDdFShYZQRsKfbwNMcjKcf6jicEPUl3AgbJSTm8IOcqM4wBGEvCTHUhx3DajF+YPbrNq+CTct4wDf0+/T0In3M9Bs/Ruhf/p/6t1N8sOunCCvWadrQvpoAlBACCSnAhobwhSBHrGIUapOhIHVHVaVb2Emyww0bSVKFX0jyGpms8Agxk0GKPHjuppecqhImg4xmgk7RsmcBwFvM8UN09Rr6JpGPf0O/6E/+v08KM6m+t//7UsTngAudP2snrK15gqDr6YYVONmd8TgHQIACkkoFzIrsTdiAFclGu0YWFdJFSKss2tQQXlISlZZXk+D6xbqXQnRS0w5Rt4oStRek5heWJsiO8oeLecBINtuT6BQOf+cFv9jyZ3N9G/87/q/r5Rv//8u+jfKOq9MAAoCUyDSEEHYSkWJqY4mGowzR1JnOXPW/BKzptUMK4hQ3tDvLDuBCmQENqzttmyrvgtPrHN5w8KGiCmrjGSAw5NfEftkXUSAPvoUz1GYfP36iP/5B/0X///tSxOaDC60HWuyw74FopqtNlKngy3/X0bygb/93uodIVIABABtCLDYi7qBzmlGE7njHi5OHGSsUqIOpOwE4rGBmiZZrNotEaSXbNrf3LNmb7OPfxVjdfPXQ1FRnEgPIvUX7yviYEvN8L/+Z9/Hf/f/ov/VvTzj//HPu/SokAEF0+NF5qOINMuLTrBNMCQtCdNoUMvEm9PQpzOtda6vGblOMwstW3CgpOq258t0sF2ez09dZhu6kWoxEFY+O6cCzrrMUq1OOzAoGl5LdAEjLa+j/+1LE6IALlTFfR4z0UYErrCmHnLp7e/kvT53p6Ev+ree3Ks8V9WjO+QqgAAApgacpGAFyl7RRRaH2GKws2MBPHiwJ5Guaw3uLSuH8aHozQS27bwktXplf93m+hOkoBB5xeIA8mJjmxor4ij0UX6W4U/o8Wye6sX377cxRoy0FVFpIpJF28E4H4OQlh7Hipg/IqqaqNbKd5EdMOKJYdTkAtFBsZakuyD9DOoiGRS5LVt/zP4noL9fRqQZupRb6qnX1I/VF9ODabEa0uMZIKHlgTP/7UsToAgydMVRsPU3BaikrHYedeOAgQE5YLcDFH6L2KOMu4+zQSTHDcleYKEmQ3XRSjDs3MBB8i8ZrpnbmW6dRX1L7eXxB1X0UW+Xwb9H8Y5MJsrC+Yr3BnPwqHnChmaZsG7/U5FQl2qcGQ7p8IBIVJMEoSCcYSUR1M6C6AASgIDBQS35UcFxgVLPnmcCJs9pmmwqbuJqr4Sgs1H6lxyZ44KgkVkEA3H1AfP4ttjPbswRUg+Eo78is7QKgZNIMSzzgABm53wfkz77sqO2z8wh///tSxOYCDSkxUmws+EFOlirdl5U42/oaUNZvc0RRlq+axNf5w+/1qUDPC7vd5wCYAEGAkvXACVBccIflicUe+Ltq8kfVrUfBg1ivap+Pf9E5Q3VAxkAl3G7i9zjUPWrdecPHueqizV0QrzRNahrcwAWTXTqYIgbX3zTB1v5ENf+PG/yF/5x5f/lzP8gP/yIt/YlLVQBswAJAK1Hhg4xEwWlIyJTSHQibsvrpiF9haWUblr/TLcIjbv7dKhlXLqW4lOLuKoi6R1Duk1jXlI0efkv/+1LE5YAKLR1tp5hMkaUpa+j1ieqmpYmxU8/zCMIV2+DD/8b/6F/+f/5P/ml/9DGdG+eif0Zv5Ef5X1CV1g0kknYTU5yAGEiaIohbWniwOSiUpZhyPVAdaeHKcmt9v+d9cnmaDTZ9DILC9nPcgdCCwcYxo01YnlTDLaAhEyXTuDA0/WQjb/p/wf+jCur9Sf6ByEUkrYU7fwRv+P6VAPAAAgGHYz9eIEopodUJftgioMzFgeaWAFWqNkTlaGqwFKn1+MCM/Tm49itTIwJyh7FBBv/7UsTmAA2pSV2sMO9Bk6vraYepeGHj5GzUFl1ZXXPAyWo7tuJQfNf5UTG7nuaplZ2zIKg6x9Nf2+EajMEjvEB/i3r9YJ0YNAJ1/CTC4CqCxIy0yw0o5EggtIp88IdXLBCJ636csnHW9uVUBMv4LbZFkFMifu6l3P6Ky3eOZpx0XqcSQoziXpE4VmVuumYDlboXevQarjMb9J+gebWv1f9zbVV6g3530+kpmNpFtoNyWonrVUFVpZANJpXpNI4UtCPFTsBNHsF9dDp67yhLSp5p//tSxNqADHVfWUwtVMGDq+zo9QriTiKxdQHcPUrOJENc10bJK5byH7PMCUXWfMu4wCFL+qBbfr5B6XxKf/KL1M6lfTyFv9F/5d/f5H0hGsggEtDcJyO9TBCBQQD8Qs8UpHUTxsUr9lvZlxmeiexbXX3r97I162rjG1JNNF8jIe/kk9Vb6xrPuqmjw7AynFupkXSIoslmdZcdCxmzo6NmGZL35xXpt2ev9A95HxJvlfV9yhKogJM0DJlAi88FMgaxKHulcQHQwB86OykaMqbQL2//+1LE1gAMbOdbTDFHwZKkq+mHtPgkT2nDBYHI/xDsscMKUpSLq8XV9C9MbZ8d9DEY8HprLML0OEAIt26jW3Y1Zj9T56CY3r9///6Tl36Heb4tDZVkokyTBXhdmY7JMhxK21GrKrUjKj15xWMrxyHVNhIdi6TThRzZeMGvPPQdn3lqUgtXRk+1P+UDNTj+RPKSWd1M63ojP/29Pf/nl0xBT5EIAABTdEMBEwhD+KrP8MCifDtg5siOmLcXq+XGZfe084y8uxhCIzKzKrK94upVIv/7UsTQAAwNTW2sPUfRkCRs5PG2zgqKutCvo+okOQpHxgJoXUf+qr+VFu1tGf8n9/6j+WEn9Y/ULfUoBIJMAu5/EPdEzcjAchYLCWOgFBKkVEl88mA6ZvtYHLc80b7lcc/WT1JKikaDBpyQiZaPqK2Qp6E9141P/jn3aM/2//9W/U1/qpD+Z/KEtVUD5WQUm29TxNwX0YhD86SWkiipxXHtHdJLSvVvCRA6yPddHMk6Ls67oKdSz4jGFGc+pATlNdAfG6kKPNKBSvT0JtvGRb9S//tSxMuAC4FLYuww6dFAJG3o8x3qb/P/lX/t/v/GnTv/ln1M5QDgCAGknPy450GTgcxUbQcXpeOFRqHHwcmq7lO8x82kJiLba6z4i3dT/GVbW0PfOavOF2VttvNkaX/S84PjdVZ9AvtvUv/Iy38t/v/Mf+/9H/k/X/o6VQJhVRSRbuFwB4hDVePSpEcgi6NZb1G3pqx+P7P2a7Ih0iHG2FIPyi024uRG5UUeLAVPUeh60p0Ph/5wGQt5vhcn/qX/lf6Ff5C/6Hf7/yn9Sd/oQv//+1LE04AKPRdm7DCl0Uko7mj2HP7O/xr+hCH+Q5JAAEHUzchlArpGmgChxDR313vwnDGlipqVWWUa4I6szB9Q8dVCo8u8YKqvmqsi6968qf7rK2WoMSR0zn2Y4MhU6eTZRNFtu2oT7ZF8aTJf5IH/6X9bf0/9v6v6zBtRvlf/1iQCA5WOnGGSoOSXtetfTqvlmnpfoFq3mOwE/KgfUGESnOIk4HE+e6KEdY2tt8kQ5cB7TShLKFaqPbmhrfoBH3xOLP49/t/t/HP6G/7fyP+n3//7UsTfAArJS29HmU7RWCTsaYSp8P1AAAs0BWY/8zWGd0DDKpPCyxdVGu+GYLThld9xnmsNtTK/Qr4PSgtKC468idi+DV0tSX7UpinZsPqq2FK3Y0EWU0q1mPE1Pc/g+ea/FII/ybaeTe3mETk1z/9/6/qcT9nF6hVAAFJyBc4XMy9prty+XPq+s+6PYLmMSBNJSjxCgdz8jKIQemYgQgtNozel0xY6OnVOhJzmV5KMKoyimrhiMcivEfkanc+vQmQcenaLf1P9jix3kHl6LXd1//tSxOaAC8FraUehUVGHpSrNlLYY8nIZsAAFu0iJEGwCVp3ka68soWRkxiRLZrTsJjNLm9LMsXlh6O2pXImysyi8pxYYXrgW/DDNYCiUzEZq/FodgiFxWkj8Yn8sqXOtVvSeQuy21LsMceUqMUOIkHlEbgWgdzi8x/u7/6oj8NJGijFxaiQSDH625q1tzadH2LKw7GCpleCHdNt4umGiqeNVN/5aDhVIEEtzBMcRRqCuQh1RmbPIhuA1wdPOQxFBuasyme9GfGy0CB1FQ6VnNQ//+1LE5IMKTSlabKTvAYOlKo2WHiiqu/OiUcpR5Bit5B3XoCBYDpfLHxsK1pDW+1T52Gt2PFyjIle01eLtOooLYNEIwcqaPzJ4otlaEwypM97SbXlAvqaQI9kOqppkcpPRO4iPVX0v3ew4Q1fUUEOnQ+nqL/W6adQJW/6ptCdG6dj9QhC7ImdoogBEgUwK3PfgMBXkYLETFnXCyilyrI+j+mV9lMaksWU4I+7ar57nWTdYIXv2EQnnyfiZdyxBUAeBVHNINQDhjrnEwLOch6WE4P/7UsTogAuRKWLsGK1SMCfrTZMLkRF51Kvs3kf/36E23dFfoBTcLKJozYb4ew/DkEkVgOJlKlbHCQqEaeVK5l+BGFUB1QubEO9Tj0Hg+KDdDSBpzSTS159Ik+S0lBxc7kI6bQhd5AEJmun08bf7f5SrwHEp1GN99Qmo02kWkW5AUBfVQYgD28O9lXzyfpRuOFySDtOhFgicD+SvN26n/JpfCSzr7b0n2/Y5te8uXlScUJ/++ms9250yuo5dykI/fRfY/WxxlsiNHZN/XZM3WqLN//tSxNIACkynaUykp5E1pS4k84o2SacdKozXdI0bU69Xf/nwbxpJCqwU4aouZ4D0K0XU0zxMdNlDgdcGlE4lmZvYSRv7/Una7n1qsqv9PbkkIcJsXDVHjOrSSkXP21Yk53KhYZEL8YgHH5Tr9ik8Kbmk+zJnk+gZGtQmrfyNe7p93KoB4ACwE9uAmBYUVC4p9w60hT8bgeBW2xGQwKxqDtKfwnKZJStq/qPybIXsOkNxIOVkTo2QKRbFxP2L6EdYy8fyiEYfLkvQa6Lswatn+SP/+1LE4AAK2QFpp5jygU6gLjD0KeZq2gHS2pyb9XfDNeTcx+nKdiW8TAExpJssEtOMOcJCbrkakIzOhN2U8YRis7G0J5WUd1K4pI76A14qXsr6UDtne5EiFXoXfKbSKl25BRBLFHO4jEfW5wZBPOWQvov0wT6n8zlTmRAHC+qaFPXkzolbY3p7qTo7+moKsAAgC98DsMWxUVGgCbZvlWPFee+lqMim2i4WnttTm1k871xt1MaZ3N9Ma2m6IJ9RtoTtWSMsqr0Ic0SS3blC/+Cro//7UsTogAzxS3Wnpg+xfKFtZPYpdupR/ViofH9+ra9BmSJt3/yD7+kIQAAVvBxtGVMQLEQxa1laTsJiMJgIR4NZZC3bmMJnYwQdrD8L2pctLt7iG/XJeZOo/C8Ea9JV3P7sl/gG3WArUAF9KhLGnZF5wbhdzCPt7GZd/RUByItN8r3hohqzCVg2DOMwjQ8EPekwGEPg1VnKCKxdsB2WmO/HWI+YexPqCG5RR+mqs6zpczM4ze/ONHe2VBW51jYrihSU5aCW7r4lu2uUJX2uRjA8//tSxOMADD0nXUwlUoGNqW309KpW9CUwjUnp1tRTlnGFGPtSMggEJSAy3AkctkUCF3V4LqUMUtfegQ6JYNgjUrtzE0zFPj0CkSPg4ZMTtfOxXwDGnrdyzrQvVca3B6XsRM6+FCX5UXuviciyZkq/fKv35P+R77EDP7f6VQBEgAu8CDJfRJ9HxUjis3eKxAdCh2oZPSQRh72vQNF0bEwPKp+eWH2OlxyWYNMZr3O6K0quFS9irxMFHn+Fm/UXt7ikz5qv6Vcz5UNLXxkkvOj7tm7/+1LE3gAK4SdfTBlSgU2Sa12WGShn9Xf2/0L9AiAAA1sCrBDoVEskabKWvw1YbnPtgUKh24sqCPjLRiYdsxUGt68D7vs7R5pve8CFdSJb6rvMZ4QXiaPbiqtk/2t//IN03urk0it8tk505m+oA9X4lWkuYMfRUznvfhgBMhACA9+Coctyz1lyzJ9h0SnG7wFmuKtgHoSKkObgTNYmlKFH9abfwk2oDLmoQvQuNZe6LnPUo36lu+gTKj80t/J3Lq80fNqKkU4uzmWz2npRTn2bRf/7UsTmgAx9J2+HsUtxXaDrXZWeKPpI/5AABgCAUZuCBAlVpCRUId5TmPbUfRh2sB6tSQS0iWby0iz9Z09jvNXt/S7b9ZLPP3fo1RM6sJiyJJnmjYiqs2gIpU7KEGW+YT5/MpZ2lGurXHWpailla1ij3bqX/pXp/x92tRoDlUQLFgVwRQuwQU/yXs11yPnBs5UUiQNVC8B2tJV+upea9sFJE7M8JEcFUNuyRhKDQIzjR7ob8yA+47OIttx3EO/To3bE2/cVsZikgxqHZ3Y73agR//tSxOaAC41HXuws8QF6oKvdhYo43Rpls7Wco/qMASAQpwPOAUyEjCHAaSr5uUackoSo4vV2pu89tA6k8mfa2AACp9cx30pV0R5uA1iPGM2y7s6IId0AgM6gjYaj7MJgZbH0Fu/FuJ8nTrxvGv27LUmYf+rduJcW5bl1MSSAS5Q0AwldZXCsrutTl0vjjayRSc3Tg0XXMxBDbmI5O01rM6IwZwKjIEuNfOGYgKM8duP/Uc2bQV/juTn6sljlVnVIt2pFbuKkdRbf3e1rjfVpUNT/+1LE5wALQSljTCztgYYo6+mHnTjjXaAIRUQBScoCoRCZlLKHQglU7N60Qae6a6ohoC5WPUFgCK9lOB57Kdz5u+cOnZbqgtxN9DWCIqQiAghQtRo++iiAiMZksYVPU/H6Ny7LVjHcju9PZFVmSc/v9EJ7NfTMOQfqr1VfGAoDljTrl4QQv431c/PEl7jRz0gnSFqNnWitnZdRQh5lhhgoMGTCGEJtyYflWkMCUoUCUubkguo/qquEmwVnNX/9CIRG6b/2vPnv8AGDoxTw44AUuP/7UsTnAAvJS2snsKnxdSTrXYSWIIFtNY0LO0BRJJEJQEcN8iSUl9SBYV0lUEn4alaG66MZl5aZWpxpJ9qxUqxhhO12V+4To9waTaHmEjsUDaFqx98xKSEFt7ox1GlAhhJZyoCIi91tSwsZAeM+mEjglvCQqk8AgFzfiGJoLKmgNej7c/H18MXkMYHxwVCkLrlhtEvdoJiKpcCN5OJEUnRJjO7LQXGw9MMHEQXWMPK7q1LiJqfahaCrNfKshHcQVEVaHZvyOjOgDjGV7Chh25xR//tQxOcACxlHYuwkrNF8JyxphhWipvqOKP8kV19IIIISpgtRbidIlVkFK4G7wEGheSxJsRDgb1Edhsp+9Aony80JscxWU0hu5K9lclhgviDl6Igrf1bbGXuv9Bj61pp+4Kw0cVvQ2dJGtomS6E+67jm+6jnBf7PlP3UddgCCUU5X4pReRYQqzHKBVqVOE6IKdMD5MRikX0g323kyXeNsOGZTYep7oxLDwpmuzI+bXGdHUMdjzEZPuj/+hDDK3/0akiOdLusiA3/ohiHYuU2eg//7UsTogAwVB3UnoFbxZBYusPGKxrARFNNU2ZjxiDsIJKcvEBFTwI15x1PNGvM7iBpqVGl2WHFWHgKrKzSOxsTl1q+1baeV1LnR7O5CDgLFWpZkF3K2I9WOT9WqzKLOlzVcNtDewyBEqY2k+KJL96wwTjQswIhZnKpu1AIFUABSTcEZHka3Jow+TAos8M03GVxJ44Zuww7irqlBsqQG5wT6SFVFr+C9vpNe38qr1X8MuJ6rCNsjy92rB0CqeS0lzUhJkjxqbYHWiwd4iSDq6nrg//tSxOmADD0JaOwwp8F6Ky8o9hT3J8q5R5Xh3UJHEkiWa7w+DkLAMMfA/T/PNHGgdjTKkXKBlSIPb+INtGGfzQlQQpCxJbZbfH/Ig9KEdBGZfXHQbLKG7FlFwjhoioY06d2JnbqR28x1ov1ohOcWYQogbFiGWiUEgBJScoAqS5tRRZl0KaKx9u7lPFMVnqXpS330bZ932fpca8sXM5f5vYZvkl7LvgQluvhT6gvkof9Syg44+P5WnEQxq/bOoUXaocdrb7irUZHaqvVq2/Dx1sX/+1LE5wALsT9xR6RLUXmWLWmHiTBnVuKu0gABL8COWZ4+pmlS3ZNmbX8oAulV8OPFJGxwqSMIXAgCAqPcaMJngPbg9BUTon3sGmOcgxyJOKGR3YYPWJaBrbFcPMb2eyXUV+nvhFa6n7f6lU8c9XLFb1fbHXuEXqoHwAJSmBJ8l0vJkzZmLJCiO4vFZcOxpBJk5BSFCOUloT54RjXmF0IUGeJGaNIa2N7RYTFrF4vTeIsXxlrWIKa90o9gGSq2N/5W0ZyTqit8mtTos9UZDDnUov/7UsTnAAusz2tMGHBRZaEvMPGqNtc+ABgEiQUVKC5gDmiq6jIXeWRFgMFQPC9CEqU0E8qLVhhqnYkrj+2gdokW6j2cEII4S1Mk8XMK25neEBsMACAznzPAS/zP/+BBspVKfwhBfbC/U6dTdiW8IOLFXWvE4gGMDF0MZqomZIKclgxZkbMGrpju0wqkc6OjUVjwcExuGrCnCr/+v6NJsaHe9P3c1nepNsxOaOi6nd1mFXMAhTxwns721Rjnm1r10qQXceNGTEnQfcqL7IE446B5//tSxOmAC/0jZ0wgsZF2pGuNpJXgtlCoadq386Wf79ZQ+/1GPRrDQgBEAxXgK3F7Ei6jC4g6UIa63IaAtu7C2kwUm/Cx8RDI3L9dzyXyln0hOb02ai7Pt3LG9U7zBFW0rV56AVzpA1/aGI1OnTLGJNgul+v+X00b4uHPp+/9vQlb6RZIVkVWE8MQnitLC6FdU5xE4SmT5Q27o+Y9JkNrZB90cpkioOF2PHTFtVJeyPW/vnPcSI1wmaRg8eacR+phWFUcXm82iCMXmnFzjvYqQKj/+1LE6IALnUNi7DClkYmibF2GDPrTjiXrOFH/5r/f6E/7tIKEAEgOy/AW5dljz3MrcxgD9xNnyOczJWlUcjVnzaYA1M8W8eDHZU1OL/iKRzHmKhQ1va18l3oaAy0qZXdZYKo5LWzmO2EESPns3tGrWujfIxz6/mP9vqTfkP31AECQVbaQ03DYLTs6ZrDDsPQtkiHTVp66Kom3jRwhfuF6anZiq1/CdyUkWhCM7hjnGQ2HDLc7Od6rVsO/iuwFnt7XsJ21MvS2I5tHQwqzznKHu//7UsTmgAzJS2bsManRbyYsKZWp6GqfikY+v48n3/Lfkv2BKEtJKmqsICPIlxcSSMJIV3KwlwbD+NBzgmfdzyisrws9Yog69ttSOT76l+o+U2Xz6fE3UHeu9oMcmCt3EwctxFLGWx09xU1I2r7zHNbhBT/e7JBjfTbqz+n4v9YGJhopU0tgwC1JyZTo5j6byWORtQDlfpRnUrIdYg8SOU8ViC5DTh4hnjzR6jHqRButPSyE4kT3FIpwC7Q9P12sGKOvSjq3Cnvd/4v+nsUX6u6a//tSxOOAC6UvbSehUXFtJexphKnY6/lb4c/5UQAABTkAi2BxckBOQkk4aliwzJ0dAURdprsC8pHQfkiD0DzDIkrKSNUPpJddmv/DlJYepAh2wfrdH7aO3J33jxDG9urhvBuRriJmYmKmh3LQmyGLV0yysd3L6RbT99mYjgaezdT2vUzkOiqYzJzrZHm8/3R6m+okEBAoplVNpJuRSO2gAxTUdBfoRgjxj0rJdaAFuQ+/75uu8srgR/FgtEJel3Pk5BrluSCvmN6Zci7iyASbXFb/+1LE5QAL7S9c7Rj0wXImLjD1ij5FZHnRiPXBmGurk1DXDu98KyPFQh45Y3FttQsKZpJtaUjHaLvCGwsVguEFRX+m9xp8RHlc39nHdtts+d3j4187j6/prWPqanxnVbf6e3vnVYe/7STRMTKiHZYOWsPIjYsbODCIgqgBf5BOIwZd8OHMDdZVRrrK46vMxgIepFydRxLA+CamKeJfz9hkxPg+j/T7UPBWmyEoajhWl8bgsJcGtgaRPAfrEIeZZPRxo2dnYHBjYDzhvnM3FUuWGf/7UsTlAAsRL3GHoK/x1yerXrSwApC1Gwp5UpqOybZ0MO07EHPVQ3TjIhcTUf/61JT4k99QpnsL7npjG9fes4zmAqqmZ90iXe7U1QVioAAABMB9hUmopS37ISU6kN9xP27nt5COMO7BaeMHF3ZzrJavPvTCEzRORLQNqls7GLE1xF5ea0XxHr1ED+x99qn618RbXpVenC18QUxZTFbGhqi8VUsQWf+plKX77IiRMU5SDZaRAKthkDO0qHegJk7NXXXAQqUcHct3FUdEa19caUYi//tSxNuAEyE7abmXgBpcoawDNPABqrT7j72VzM7WWWJvebXgYa5kKqLVHB7NenRAgjEZVcokKdaq0iudXa89fnQ93EmbS6X/xpgrI/6vrVnVkBIABdEUO0r2cm6yUSkOQuyMZLpeIww0csRE7wEBpUqpOgcETxaTFxVBILM0UPdrzLLOgKg10+dk2Ivpo7WIjPRuZFRKfkqe+p0Iqt9CWDrhwEGn86EOYhBhD0aeHzBwc799k3AM+cSeUCSQU5kPBXmkzLLVk9ISmJinXohryCn/+1LEoQCMKQFzXPQAMXokbR2GFXr0GrdN1vD3nc+6+mcxddYOFWmwHDMP3MRC//VlP/zZIZIYkz+/ZI4DCysFgEhlYE3i2f/CeU0tOWpmQYHpSFklSMinpSbVCoCASU6IJJhFAZxkztwzDWDtKjjRsEzy0OxKLVS3FA3HSyjtfjULKBW+d7hSk5gi5c/pcoUxOBZJ4XcCSxjzSAJSTMpNGsUViwr0PknwT6qrPfoCABj3AxwhSD7Ek7V8r6dideFg1KYl3YQvRHvDrBjKNp9ue//7UsSfAA0pYXdHjLE5eCsuaPCO8/39yara1ce3LFUI/cbQhqKy2VQ9ebNdDa3/S1EKKKv58ibrP6y4QkzS73x7v/FzqJOWUgO/78oo9hUCCBBScCQBEwMUxRmTwMqUA4+qImESjMrxkrmTWEPcSQHxQrtoQuriz2h8KQKO1T4dPLmpdMZBjYQHJDVsaVJiUFGfeRJTbz+plTNL6V0ApoQNpttRTAHOHk8FG5JglZYGs3jFoMjRXbPLIKVqLVSYdiHtvrlLOoh9hP/5U203jf1S//tSxJkACmiNZuwwawFwGSyNhhVxx9pERtZgWaJxKSNYmDiPfRFQ+HamK5jNz8LHkiUAs0IEgOTgFdaCji1y++44FsjYkjgg8vlD/0MToG9akC1KpfJE2Umjl27vK+o8ZWPREBrfmddbcFq+Ia29daqFqaRW9tkclXtQmz4CWkg4a4PtsfUADfhClcrvduPRiWvFHqQWNKEYyjmcQmpjPpbcOusjHwOKCjlEziCEUFEQnMs3cW5iH0RET67wv9ETRERH/JOgYgvTiIafom6IACD/+1LEnwAJzI1k7BhwgU0RrjT0oUxOUOOHYPh84J6gwXeD6nB/7BUGQAAAKlC5H+Si8OYhoZC0KQoObFRpIgFEmHc4aiWkTcifVvLyRfM7z/nn95ms2/4JQaJRnLRne1EknnwEeuCLqWtOiVQh+FH7UOXtypZa0O/1dSVEAAE7SyQlKy+8AQzE6aldGGZieiTwKepZEbmw9gqnNy3oFEmMkggV1RPZWqPVZpFgBHKt852QyJJg+3v3W2wcUhdBCJsX3cUFUP2e7xP2ogOwgZIRc//7UsSsAwoki2JsJE9Bb55siYSNYGBmp5OHUqi+NCiFYFEE8LnC6axl0Yy20HpWAWMKpWMUpqHU0ZWdzL9LoOtTsrBIbXm3V/ajIu2cZcgKH2KU+7dqQd60+vbQ2mVuyo126pIkAqLiySjUDBRCQrEU9KCaNlUqZiOJAYifenIhhUQkFrPQ5io4y6WLKCGikq75919TgnF53msjt+k7/le8p6nblO8n7N1pzh8KqzwaBpS1VSKZYkQBzROBFLhPHewEx4qj5pNIDyg9RPZDrFru//tSxLOACoSbaUewwUFCmizdhInYTa0pReY6y2jRDjGq2nHpaYRIjiJVJ6wt2Fn9RIWd09EBY4H5LvLdSnbFP9no9HWEaqSqAEYBjJ4kgUIFNVvtugoRQUIp0YB0VAtPCLAtUOkq3nShFmBwRl7+s7RmVLlUIHPPJiCToSoautntqE8ko3c4oN0qz1nCHpo/JJwViF91X3+3pIIOiABSMhWnKZ6qPYepXMx0NyFovqeUtMO05B04pIrvH/j0aKJTOwdKaHnLUk0v5bWiNiEJadr/+1LEvwAKJM9rR6TnwUwZ7ujEKe7gYE5qruyi7PVeh/q3Ked6f//6bczPZf1QmZ2ViKwm0QU1aCQYkDQKgmOBUIpi48jDNjsL9oPWckOJUqOOPsrWd1BxFZpQ/U96LX09/toFn/nip+qdzf22v257U26P/r/549dNtWvX5N+8j6NNNRhQ98LKZc2jQQ5gNg4DvQhAvUOhF7kcdzl38kSgaUWZm4yTxJNLGMq5H/KBeUPqxa7vRCYz4Ef72oVlNLOT8//MYB8MB4UaeIGXS2y1mv/7UsTKgAn0u28nsKfxTBnriYYo+Mj6NbUEAoSWX2ToSdGALoplVRqoUiGrnJAy6w8nkeQxXUI2gkKB5iGoZyTQiB+LbhEuOKa6aUsAMvcVkWRuFQR/p1HW1UR2myKNb9z13RqUmRHEYRLNaOSCoKLU977wlY1lRK//9SpADYAAAAJB9HmaxWGgrUakGSKl3B+u4Cvxzq6Bs47J6HNsq0n5xDUOOm2P260xOnXUn/qoQl+fJBJAnKV2WpUK2xGiK56Oi190eSceJOUwAYM1fxOQ//tSxNcACkVLZuexTRFFKW2ol55KpWePmkr4R+kTD0EEAArgdonhP0emUJIMLI9OAn10NZXacgwrwOlTcsIKjLYYUtwldxApdoo2WShUPqv45qJXTYGws2xVd5pql1rqjspSvmmMjkf+kVQyJWVzyKyp1iwnSInewZUASFAQAE7TQI4YMQ0GRC2tFnoOyCwiEAyLyPML/XQD4cYv3yTPm925OjOWo3OJtOtdVekgLUOV+3v6P6I1Y+rG33rjHbpesnNfUU+pSO7LZxgCLuFktQP/+1LE4wPKTKVYDD0lwYcYa0GXpLAeKDK9VuWAAAUofYBFWDT7b2HYi7UMrncyKxOZwYfD1eindRSpVtxNoM5vcoRAO7sDKrHTlxNKsz5uRGSN23mZoPKoeKztQhBN+66L6Gc04WtNXbIihEIILhkUDM4CTU5U/ffsOprZQhgAAABbjkMAWY8i+IWSw88I4l+l9X3OkiKxqRWmlXTINtTS7i288UFc80r+3ffGik6L63+YDFZ7hU9CAalm6uTuy9S6L1X6fb28Z9kaUeKirwJFj//7UsTmgAug5WVHrG/BcZ4sqPQJ+K9drLbPoISTpKSSSLkwiyiLZDXY60EbrwvxcpjhThoOjhmnjyE05UPh83Ss5Iq/bZvr7jH1GvVCBriU6MbCQXq426oEhRlZvn/8g7x7WcPeJ9S32VeJl6F8/ovjG2fvfOtc4qi6pVUAJQAQEc1xSpnCXufxOmNhpkhK493FUIpdRCoOdxe1iIrEWzBKM/cdkk3+mEuutAtZ1nDP9IYc1Ah2dqri1U2pHusHh2+7PX0oqR6+//J7CglG5UQx//tSxOeAC6k5Z0ekSdGFm2uNhJ6QseKkDInTSBShcwcr64+tXf1tpyH/gPfU2W6AEk4UykElJcRhbPtAos5lwbJIDdYVadoPk7/IzJThw7UxGqZILp+0Tu9Thf2i2/KepK6soLhMj1L2VDfBgt/oRP0+QNViJOMh8XfMPqx9d/lX/5V/afmDm7TxQBOHJWsO1n1qAA4QgFpu8V2gGL60LyixZSwtbkoZHfdhpTd35i/KtNlKbVm3faJEMdzJwRGOcxW+/Gz/XWmKIoNnm3RKOUz/+1LE5gALOQVe56yzAYGmbbT0leKJX4N0B+XrOAeHEVuI3VwOIdPYR29ucLH6f+Z5Ut/1fz/ls//As5q0cv3AQQASQmXsCEESAQ1k7MmhQO00iK7jHM0OSKdbVfNpnbTu3RlZzMBqRJmCEYd/iWaPmbUhy3zuVIvae8FRM+FWfKnanDUlLnBcMm2YSzDLA/BB5iPtIl319Sb/873+Rf/v1ML1RBjZFy7KzKZ7X36aAEQACZ+v4ISWnQBw+sp3HIX7ZLB+V3pLqNajavVf7/yEN//7UsTmgA3xB1tMPWXBi6ZttPYporwiwbQcmLO2yesH27PWYgWTPQx4IIJ3oOPIDD02ptbGCIfxUIFk5GHpu0e9iE3vfB6e4c2N//9gMDjwQIFhZacEC1/OUgenD7DoY4WcQJkyq9//Yho1No+WawDQH0hH96kEAYAABSuJ4qBYibjiJCKW2IxF8ThQhokQ7Z82mGQKZFRGYsu04vwpASCmKp/jqUJUndjQlpIHqZW4U6iLkDpQSqekms+sNpvH1Gi37NOhbv6SiXkdvt0JBZmA//tSxNsADQ0zXUws9QG8pmtph514ElFOQ7iKPBUF1hIlXbUz1ZP5ua1G3xmy8/Y1QGUCd7dA8uSU/Sv25aT9Ed1adWkd7N12++1bB4sxrfMGme5KMgBE1PssteNA1+ylibqgAAS7hl5FMmG9iBToMIeYya4jwIJ6UCcfk19Tyb3F6GL0Z8o04bPNhAUP2R84/dLAdsCmFwuRC5ZVLXiA6VUOKaAg8O5H7fxdvXq2PTMNcuHvzNVpOOJkhJJJukhnLdcfcwyFhPIBkZIauRskd27/+1LEzQAQWVtg7DDJQWETLOj0jSh0jciq0eiDjbt783jKrSS9I0ApZnuXVWFUS9N3qvR3OWidvcdzgCSbCrlWokfu9EIPItK9VyNdUlJBFOjnJIZMA5G0faVcnE4Ffz5erp2tGjArjERmetkUSB7XB6RfU9S3F3APjlWjPrxLev4QD5pUreJTOIN7qSX7n7q9TtCnysYY3MlbKgCpKRAFzEKQkbacTwO9+OggIysrRI6DNBrJvt2FGJjytm7Hg1H/YcdvS6ilzpqsAx16Cz44E//7UsS9gAoQy3FHjFERSo9sjYYM+P7KhiOj0628e0qh6OlyhZk1/SWCUu61zP/ZMe5zPYCcpTSouW4vpeksUqCRiCMU0Bjq+Vgs+W1rWFB/SC8jsv+rTtxr+CadSAmxMvYDA+9bw++vwF7n/Bxm/QdG6OLGu1ekw22Kz0WfLofX/QO3OWI7v65Z/oWqBK1UFIAJRKn2SSY5k+NiEhK+XKdsdqzCvWpaEvt5YNp+syZ0yFmTVEdFqLCyNF0XixzzKTCKZq9AVvQu2o77/m9P6C/1//tSxMmACgTrf6eEsPFDlK7o9Anu+YLFvnd8yCsotzvTzVW4FEtcJL1OoYZ4DCQh000XIC6CYD0srVZCJ92Z+Sum52FwDAkcAkv2RKxuTUQrH7z9aQyZS3jvLTzX8kh2jvsBe4iJsE+7fQ9/4odX1Mxzfmu8PaGOWBwp6FChx3T+i5cAAvRdBIQdaVQO4RKNPF2tGS/inxD2vpa7YEbbJNPaAhgWD3cCxSWFHkHBOfkm2E5h1PBruHAlI3A4eLDp7haYdfKXFw0TVupQ0UeKjVr/+1LE1wAKjPlrJ7Dn8V8e7aT0CuYkZDvTq0RvXzzTWv3YnVWjn546p+qmuyMaOlaoWx1eu174yxTvx/vXbCwFE0Y2iV3MlURbrPz0xF7+rXHl0RaIIE+ObQTROaFC5ANnkeJCQVwaVRHjrSYrkvhOZQlOMg0SkwywSSYnlv7y7Mt0i6Iag9GBknJoE7Kfe77r7Ft//uX/vdBMtbsU6SewiV0M59iU9KoAdVllZBRJJLoJWTAPlIPtgQK6UPAPRKSfxonjhO0rwcsoKFbMym12MP/7UsTegAtBE21HtLMxY5nrBYWiKKmpJGb76A1g4lEUwoGnvA2aASBU6POvLXKHeOUl5pKsswtBVIiCp0FQ8hEAAATlAxpS0lW2VIhS5K6JyhjgsM8JEBmXUyrUnuqKyXCtf9RwpRmLxiji6xRwigzZ1DCHu2f/TaFl/lMSr54gmb2LxqdilRQF0qi+wk/1enRVBbUbbKRIJJhKiEHfDOtoIG8biGGinpB9zDM3wonaLs6lxb7zSsihVIcuVnpdsOSU4NSTmlnz/63Y5jNeEX89//tSxOMAjtk9XEw9BwmlnyyZhJm5bEVkUjf+voIHd9kJ//022qBiEQAAE2gI6GrRYm5cE6vqJrFSBZGsACRqJ9lVEm0i3h8Zkz7dcWadDg3ex9n3ghJTBpKNpbVGdvVke68xVbr/8///hh1ZW9XK2joCI9pezcoBMAAAA7FwbSM20QTCxNYsHqyTS2VItialptr0A1bki3ZxfyVb+WqirY6UxTMLHeObownt/3sG6weUYSiiBSztoMDtZ/jliTndP6VBpfnltuTmOIY0xD02Dx7/+1LE0IAKMHd157Bh4U6XLGmWDSiaqP7rprxNXFV+y/jj1fT1v0n/dySjiVRwAQhRQAAaqPMDBNI3ERKBF+P8u6MKpzqfD8xtHm6zKlh9lnK9R1707MxxdFS168O6IZqMbf19Ner+JXQMzT1KMs6OE6xXLWAU+sz430lqTaujQCU67HkVK605wNTMtJSSVXuvIP+U/7uR87121MoAEQBgAABxPmIiBlIVKA4CyG5EYQwlm7L4xQZF6q0/wEV1GXaJnivH5BcesHOcxVr78FyzXf/7UsTbgAnxAXenpEzxQ6SsaPSJMDLmNG3WtIxUD0YxUfoKGK9lp0VjUfW/uYm601nlJnxjAU5t0HratkzVKkHP0r/17yH//83//+s54GV2O1JskAAgMJAAhONTizJTACBocAqqOS+7oPGRAzzyqYSLlkQibYxITnqXAU0a6tZ28EU5a7e5bixRq7xjaCjvpT2xVxxe+LB/nD4t6WrpgWpsG9JBMZkF0l9jZrumaSeBfL+anCxkUJcQYmh+Nf6fatUgV/rf+a///mP+dQ50hFnL//tSxOkADlUlW00hdQG3oCt1pLagxVD01QAjQAkmIja+cRRv+gFEMJUNfhw4efZXzZXUwXTFuOm9AmUdaoSg69OC6FceRqNs+okc8n2dORrU8J/rGd51fQuoiaJQbZEkmhkah2YrZrjZ6OF5db+cLU7WUmXTEFT2zYwZSji1FZufBOTTppqdO6VSTIBej2pXOn2WpdCXv+/+Xv9v2meKdLQIB0AAAmufZlvhx5d9LaNSqpMRybhuxhWZ6ogZjpZkXVY7ZEP2PbTXvOY6gePK6n//+1LE1oAOgU1ZrT2rwgCrqmm3tiiqUf7gYeRJX4+I6ZsCxzkicSxLtDGscMiZEdk+Oldrdt+69+jGFHO+btvLvw4MNXv3oB6t0h4hvHDxIc1/6beUvlJAoQg/OolH1aOUlAD44kyESSlAGQAgHCU6PhgpEU0o1ymdK9lY486djPpEUL1+uAVYMO1kt7AqCRJL3Jq58syXjVVPVTVMB5xJEG+Gbxs+UyqjKaxbiqVCINLTd6uz+VBkesRVIo2T5PpBbJEc52JxqLgZK5E4wjCIVv/7UsS6ABEdb1msva/B8KBrZYexeAPe/q5PoIa6savgRyhlUr7l94F//zkPOYOofJZOGVBElQAsC77s/5iclHaP1fYhSC49Pb7aKwCzYkUSCi3KPo7g8yR1ROcNiWBEm2NM6OIEXMbC6FDmvo0vSjuJidkPxHYFDSQaE4bLB9D3mgk3J9JZQOLEbUFTyMF9Ctlnc5njX8YQc5SEqbnWdIFeAAAgZzgEQaQ+G0va2pm5mXbi1quuLOOGi0H7iJGQSIOzBziXGvsWgG9llclCsUwu//tSxJWACpC1aaeYcwFCFe8w9I1etONF/4/+/8dzL1kpBrqcfKBSQcD1u8gr9H/4OgK+b/2qAlVBIAlp0CqcpRkNQeoJ2RlcyN61NSRHv5ZHK2cHVus2/3ghPxGVCVtDDthulSvRtHNZWlL38UktCeODZ/zLt3G7nHkHeanNqBC23/yyPxH09PoYOQlfxU/YizKqJIFboZQvxXy+nmuD1ZinUsdfVcWJ2C61K5alglpqseJ9ygfszSKN8A2xErMODbjWRhIpVGtcz29STvoJn9f/+1LEoQAKhEVxpiWKkUkc7KjymnD5gmFhQK5hM4XV1VjhUAOBIWzjxv29pQcozdv53//b+jUszkUft4mqAwwAAAHTcCRhlNtMNj1O/EMK5eWkmbzHBouZJOmvjCfth4z7zxacfDI+F6+IAhUwGOL6sLi1SrLk1PKCa22MwJ0+pAn1EGe5ckzRHXvNCWFKhYhP7J8XFkM9n+pw0/lkZZbKjmVfrEgAATpeFzmxwKCle7bNI4/MDujXhlXks5p5spNUjuWvlHPm4x+O1Rdw5lDYDP/7UsSrgAs9B2dHrPYRoa0s6PKq0r8ndUZmW1rpo3WfT4uG3t4fJgP/cVycBtJt6jX9YwhUYFEpp0i4pB9JMHkvoGZgrUeR+RB7d+LHezton0IkDiFk+h8oYgATASAAARreKGU1X0wccEUZToWGUZFb1oINdbH58+VsTEb0A6frqM6ypmI/vqyVvVv3FNlPoUCw37/x/nDhxhGLZcx5QyIA41ShAp5xIivdig3//seTiBz1yCf3nzgAAb1RY5J68PgIMAAB3vMCSlzqEnRiGZCe//tSxKgADNknXUw9R8HIIKtdhbbYgWZUVQAbttMdjKR7ulL5EzuTZu5CPQ7es7hTiGtP8zcvj465dFNQXlEk97H1J62RdehXHb1kEmL6DJSetsqpvmGHImF////3y275VdASSSZHZnq6CbkVSLIYCdA0CTLpCUAwrdk0/Y3NzZ7IYfzmOpghrbNXdeJN75lJxv4Fn0y+f063icTiqMlKCeQ0cE6VrCIEbDh9ZAMl2Gqr06eKEIfZ7aRNQkRqRKIogFu8KrpfGFawyz3sW08l+A3/+1LEmYAM1SdjrDFDgY+mLGWErHD4bcuTHA25p+G0aVFpkEAEeOGJgDaEJWGH9nXp1dssm/8+lSbh/gShDgUYWCQNlHlRicl9xQCqvx9R4NU1GaqYkEEpyY0hN4hb0sXeoWRmRMYJhAHEJrzNZsqSJBPhSGokU4UrkNOS1E+MUNHRm6E86mSj4IiM7JYqLV19qa5BrVZeW4lOdkBHsTS/BlHtW4BgEQAUnKEPFCJcpzomVJ5IUegokNMyPFdjQ7O8xYSGTDbCZ5z/aEVu8pUbRP/7UsSSAApIg2+njY6BSJYt9YSNWDFZRToJKtihwChVPSZ7hXmlnMRXdi2b/o3/461ClaiXKmn0taollASIkUQUUW5gwl4EOOwkLomEg5h1HQ8T5oTLDf3elvbmyL5uT5zQ/t5S0K3X5iVRApHOPcd0tUa6f8M5WygHdkYz22/ELv/t/+o3LARNkbSNNhUAIAAASU4CEShIJA5BjMgN4pEdgvp2FHpwepOm4CUpCMaweqKRgmPSWUTfO9EHWwopXHswcjZqAsRG2X7DL33/N7Kf//tSxJ2ACkj3d0ekR/FPHu2o9Iky6Bn2ljHyqdhiT1naxBoVAgVIDLIDV/BghihHGBmLwFGmniMRKELKZdcV4osBnart1tm6beq0TV0/urobWitTH6mvQrvnBt1OstLmIPM/m/lfdUf0Pb/5V2KIYK9+U/DBcccadcabUgKpjFJPovCJE5PNXKxH4AokfpU9nDH/eo0GPNm4nQh6VpCCrEkfrJof8rSR7Lj3yoWdHX5tDBg3WOKk9Yo9k/l//xSWp1b5T2f+f+/x5Qy4HLJBcgL/+1LEqIAKQRNxp5hQ0UUb7KmHlDrzm1wiG58809CY1KGXTryV/5JEfoXs5pIftmMa8r/DFSiQY0utfiBcMLrmoqEOLuvNycajKyANZp0oBVvt9Bj51G4/zM6mxUaX9vQQiz5U1PP+q/p/+hMBGyMK1uVxwHYAjCPqY8EkH0yWJCLIRIQ0t7DHNCSblK+rR2+EdlpHCwlsUTeKotbIJR2ut1VDFTNSadrB3PZJY/A5z7q3PKpstAs+d/PPeqj+Wf/onu3X+X/SAJgAAGG2gH2MEv/7UsS0gAoU92ensO0BU6kv9PSdfriT5Wi/H04u2Xc00u5It0I49Ji5KQgxCCh/5tdVm5//75zmjQKOTR7AS0jbUFAYOJtrsey4Jk6ltvN3emEMz22XfIUQUTtyae2PMISAwsxAxAmm0PpgXUPdtjoOTTgR+2Dw9IP//+fB3S4AIhJKMlskknFo1O524Bn21cEFmHX9LkHB+crAk5KSYQAjgciwCSWZ/Rrc4rbhzGamKDnVOkkfvryW+HJMRn/nFyaaoNDHiEa16DEUe2mN+egG//tSxL+AC8FLYUww8SFrn2009jU0D29gIAFQcfQ9A5k0bTCSljYDbxtgbSICJl3QtNg2m6LumvWR21KESR5Fn+jH5C3Wzt09kqjoHM0IMykiH1uo9c2tOPNf/+XAgfM8Uy4s5wsXSMobuJCQNoVhCSUD4WoB6H7EkN5xuc1mzsj61L1EotDwPKhzMqGlfqplLnZ2lBVygl9m9WVf9FV3LG3sAuYnRXX2eO/+FFhGunahFQJRALAAkuB2DRMNCEowHZK/boLcbWObLWL9Ro6qpGH/+1LEwQAOYRdnR6TPyUsWLFWGGOgOkBLBWpYYuL51GT+AE+ZDNZlNoycE9Kp0xvm6RSuxWHMS6CnnQ7MugYydvr+or9/xoQF0AtVogCgIOtYu4txvtpuKw7W0/w6XxUHeebJMWTB+yi3qzYGZbdH5u0fRDd4uK7Qq0dkjCVZdBJ/+ogCt7LziiWJGMVsUIR7ltxN//p//elUtCAAMkxCBVKUvSEtJ6x2VcM3QrNWRgfvfCW8SM9/P2sgmG1Qb7xtoUbXFyBr86HDqjpwydrER2P/7UMS8AIoErWtHpEfBMRutKPSJKGkT7+MF3XbXYTzYmylqLlmal+AI+kfQr4m0fVl3sWW0okEmQACBCePI/gsHAZEo/HMPysPAgQSUHolc1j+5st/foNahUOb1SVPLyQTv0fudto0dLo25QkGL7m5xZ+33GB1mVAEMnIqKWa/GPqs/u/+Sc9uPvQQAAd4xSEJwf2UuLc4MJtu1IP+M2R7pAe0rOyVqlPl3SEVFuGLxD3S6EYdpGtY1TRLeJR2oIrV4kX9gkeP9I6t6J6hZX3L/+1LEywAKZPVlR6RNQTye7PT2FTBq5kWlW8Mzf7eQXZnduja9TpABdDkk6ZHFXqtxUhDtnyPT18uO+nROIa13sbjSNtpl6LCkbo1VdbK2N/5hT1mlxTB/VJ59ZRx8uHxoLn6d4nF0VE2+evohyD6jgYLn0fqDCi3kEAABTnKk5UYeMqTMGUwlW8PUsFX6kBCBt4iR5Im97HRBFQcwQJwYJgx5rBS5B3gjYul8OPMtx1j4RjoQzCldiZvwppbD6RNdhwFcEG2mqqw8Up0i6RHJbv/7UsTXgArM92DnoLZBWZ6t9MMWxrmSNPjOWnzjT7MlUSCBdCvqsZsLHIj84mOdXZUiVMEAEqBvAPwg9iQiTo5FjHJ0RKnMkTSCSQoXsmxcJECFIZV0A6wm32v/m54y32La6fYfbthhOwgn+ytj5sxO/3K3CpAuBA+TigJiMhEfizuJm0B4HJzXJppEAAFTBG8hY0eYf59F2ThYHgol5eHkET5aOHF/L/hSI4WtnrNWxO0FOZFH6d4Ge5VNGzPpQMwcxxLn5jOoqeDQ9Z1QNKlz//tSxN8ACoj1WsegVQFMkq5k9Ilu0sOWGuWF+4FajqywAwAJXhPAHfaHWbWwzJ1AkAkTSYdHFI3S0lYRWRP2TDBMoSGKGvrZ1wVLs0yGouoWYhHEDwJANgMKHOXBIIn6XLP0rWZh1/zkgxpm7kFvgKlKKZkAEkpSZYyhjAKRgiX4yV/HEZzCZS4cPt4NgwBb3vxbdLF3YR5A/YvRyEJ7bWwtw97kyllY3Of/CuE0LTemsVwyFnlzlJktlPEdN/8qgdkQEEHTHWn33PrP/Yf9////+1LE6QCOwZNjR6RsyV+XbXT0mOAtieXXLvM6AMABLdSNEqpA4XnIeGenocg+RcfXgmB4WyD7vSWP81mgYfnNDfMiN+Vb6nSLLQ6PkqMBkGJRP3REbP/a935E/05CVdCKhELkI6MlXeqvkJ/02tvi7kECF4feymoKBBJKSgKYZAjarAKBIBA7Kh2N1KMUE7kFBpcO75j3YpQs9hEB4Ntaq+q5o6imxqEkvXVucjJDFD+Oaq7bm3etu/623vHZDsKhsUFnjgXaJEhcSGgXlZiwq//7UsTgAIp0l2tMMGfBRA4s6YYM+Nrvdq1n3PovSCdyoJIIKh2jpOJiPg/zsiEKPNHOamOZqozptZDEM3ErKyeoLRj2DO6x6vKUBk6QRpi4ano7NeIt6vsqxJb2RW9H9H1yuJRTmyHefz4qZDeZq0xz3QirlbvN8F/3/2oHAAALl4roImWUWqpi/KDw8BRK1DG5mXa5gM6Pg3GjHbEw/8ybxXfo8TVrKZBgYdzRgw7Z0C0rIgvVB2HPx7dCs3rWyKNrVWN0o/r7OUrjWbcwDe81//tSxOuAjLyFbUwkzRltrC2pgxWyJIHkjUuv6WyAAsAkgFJuITxbS6akGSoVG1F/mmB4chKSRDtGj/gen2Ok8WWhXR6QGYN+/JEUOUwTfK/xp/A6e1e4lWLQjsctQkjuhdW6O3L5jBRwkRMDyJUQzpfn7idF/dUsv2kkkinT8QQxzxHpPI7Yz9GJFPKY2HFmb1VeItKqe9ZmjdWM5UfeQRG6qGpHL72mFalcgnNmPVKtldwd3na1LvYM29jGfb1klb09oC9+bvTXejElOop/V/r/+1LE6IAMNNFo57EDkXafLqj0Fdff36TCoyspqiSiASoBb1EKWa6EuSsJse67HmrWtnViuguVZBONVFt9znocRQ6vrL5UNMHDnp1/eS+2A6bCfdPziG0d2+X7PajIVu1kodjD2+t6K1maVxbKEDkKVFMGCiXx3jYCGGYVUFbDwKQKFFPx6ygQ5PnGKhcwYhwuQxv0l3qSo3j74InY04VRr7vzZTdLqRp3mUYCptizoizj8aSg9icwYh6uIkf0cinqIWUzjFz3UE0mdHXo3VLfZv/7UsTmgAu0/WLsPKfBYx8tKYYJOurKOcLkWMiTAYAJM3pGGLcvIy9uKE1rTSJc/SZsVSlQhCIeB+Z6FlYzulLFhs6yERxWo/pc9DbVy+bQFh9lFZpapVnVlPVqjxBqK/Yz/RFd6Usek15UhN5upBkMOqOGtpyh6FM+KQA0KA4yilpuJMkq0pp/GYN0WwZURLuyUrTGuFmd3ljZJWuLMp1Q/b3kERxvQOoyjtF6oI1wyv+B7az7OzH0+Jbmn9hgIG2ul1fI/3MdM/k8vbFzeXvY//tSxOkADAFnd0esT/F2p24o9YnvdBwy3LVboyQaVGz/gwp/7ajgsja3tv/MBBIABu4Fwhp5PRJly0jFSQ5D0AulQTDR4bZ9C36hYlInTfY2OPxDoUQqpMU/0/gTB8YdR8Omc6S5GCvyPoGTf6lvRvLM1TX2GYqnNjIziUJvUvXGQsvRW6nfLXx+cPSE+usR6TUUklLR0j/fnQoCDp46BGGJFJukwd2g3VLegTvHBWdQ1EfUaNljNLo6K8ubePNZY4i2MMbA8Cyo0VdgOe2X8xP/+1LE6AAMJTFpJ7Cp8XMfK42WHWjbyfp8l/7dW8q3V/KJ0bqgvLne9Pt8gHgAAApQAHrgBnKQjxYRcyEGQ4g+sUFZ8ewqILZglJEZ1aw1nMdorZx/fGP2H+p+rjtRoY2xhx8Iiq8RbiQp5OgkT28nZF6Arcb9n/1f39P/EP/kGKqqrfklAkAAGlONIXQXlW8X5KqEn1oJ4xR8b85DD6TrNc4XnYvy3mF9oq/7+VvhdDlrFNEsdO6hnYxyoNbLNBk8kbGusi8YDnUeplAbwscgbf/7UsTnAA3FB2WsPWfhh6YrnZSp4EweN/WT/foW9P//b/kTf8uDe7Z0AAqQACi/eF0wS0xazSkokeUAzZqvXWjcBxx5IvcygW/Kaenn43ZUL7vklj7dCl5vSI/R+iv+UBtU1Y+EdW4YtzdkuvoXDT9yS8Qm/6D7MiHtzBp6Pyg6amXLdRJZLkPUW+c3KFvu4r9PcgBNVJASakJAHCLohZPQtJgC3FjMk3o6PTh1qAsbEsTrKkcmw4KAOr04jhsFS3SzBAM/QX/UHH+VXH7/txMb//tSxN0ACxU3a0ew59Fjpmvc9hU6dNMCEu2Y553AUHdyI/hweyxEiI0L8QfUw//zen29WaokycdorxN/7AGCCDaAaKKINZoClDhLcFmYeB4RpWVMYZD8Px88J+P89AzBYC4KhwqDM9JaYQy0VDCJevEcwLZ/chfmadtwRHZ+fLHLnBgZmbxwYNr3CuTzosOTL+L38YOI5T0f9udvwCsHhDlE8Bls/UeAkEPv//+6FleQgEpNwfUdpWHRdHIvhxTrzK2KRKCjHpPAkQWQk6EDDdP/+1LE4gAMBTNa7BlUQaYma6mFnqA4Q2umayG7JCjXKpGrpfl0d1kZzurS3xUuNInWo9msqL94w7QFY1Kd3/+5l1k2ztqFpZBJyNodZLTMRSEF/Tx9vI6zRHLhZdPUyqjsC7F9BQEiySZM4lgNCypU4stGjAKCQFIjXEDABc4JOWdxWOL1aRTQ/X4sKjCiHZH4xcqWr+a01QEEABO7BawJRDRQEEOMW16jlQoZIpioglwFHyJ6MUKmMJHrEQMMstdC0wVRVZFYa1DW8tLfWU2fzv/7UsTbAAzBPWNHrLGRwhZrBYexKb4sRvRiY/mTqQPYo8t/O0YrmMzyd6b+xP/1BkYBKu4D8Agi/Pw4CTos/GRJKtOnerFwU98L2k2tzDbz39DsfTZG/AjuVGOXLuZ3uh9UX0spADK6fQXVLPq3qztktcu1nITclHP+U7C5C+CC0PbIG5+OcgCQQICKScG8GGWBzgHnHOMtscEhkkE7AWLSH7IXfvM4gzRKPnNg+CshttWpcv0Lsx5w3PPPQrq4CjOyVOFjtXmDx7VabyrVLnXT//tSxM2Aimilb0ekrtFHiy4o8w3Kz37bfUoonftfQTExEuOSuUkp20ohlFIFu4JebxFlvJmQpLDRVaPL5KHJW6LZafXd7H49LvUFQ/HKxaho2dgbmewyHdQymKgnWCZXV+wD/njrpRMZVbSr3Jco6l1DtIB+EgoJ7kLnAu9dqjAn9ymspiRYQRIJkuH4PASFbOtpUhdFehcBCUW2soDNy1kyzN4G1IwKCCSCWSp59rCEO8TNv1PXfoEf/Yde/i/s+bZyUWDRDOcKlCNvnn70oKP/+1LE2IAKZI9k56TNAV4hbRz2FdjXfphxGtEUAIQAClaAGjpBTNgfJHC2k6Iyc6UJsvs5wmZuhc4SGUQN8AhZt8g2ESYjYuFXNnLfyzNpZTW3tpQ3VxrLjjnZoHDNXRUjw0BNudVDxt8aoS5OJyUhk/rKhS0qHxQSmDh4wxVbQQRqqckUVYIyE27ihURvqB2mltdma5iwZEYmgCOyQhATpd/b/3nQ2DJGiSDNTnmSg9H9G6+Q/fiWdSjXOGARP/ia6yWdcsBvtlG0+rIhpVJkqP/7UsThAQvYz2tHpOmRbBds3PYJMJRlYujBokBjqnhOwVdjiQAi/wtQuonJDryM1ZwzhadI5rhMMYdXDdhc6ekyaoOgxXVR1UG0KiqS25jaJj7kQ3qYgs1qF94gnX+Kpb9UGQR/5Qj83zf+r/6E//+vqZzF0dWl91/TibPzxtVABAAKdAPI9WIpzObENH0uTkhn6TJ9EWGKzqaWt5+nmNSAeZizyn5pZswX7o/UO8dq1PKM/6w1/yXu3JdT9GZ/atCVM3/QxuYOvVO4z5o67JCM//tSxOIACmDjaUeYTQGgF6vc9J3wU1UpIJJUBIR1EtGOViWQoz2g5CbHwfypUSjhrz2OpEMrAi7ZGd4yMbxklhs8Si7cxJ3OqKkR/4L98W+rlKyQbHwvL6ZAb4W/xdmv/ekbZRnu5D02u6Knl7feyizVM5dYS7d5neizCJiKJIAK4VBeDFMsmx5kkNA8kCozDSM12pdN2YWTcw44AnDVozySN1j7PJ13uqSs7v4tkOreoW6gU/EBTcelCfdKN+7pQpJSJ+2hqb/1X8caUyNFxlz/+1LE4oALaLtvR6VJ0Wunq82GKal6gXTUCSUnQg+ZgqUl0E1XOQzh6SsdqN2B0jPhKhImnmhlUoTD39qm+U552qaYXR5D+UK6jmWfq5g0V0C4kOjLuDgXGis57hYa8u1BGGD67Doy32Ku9lfU/8eOenWf/EzexQRhh9pNqETBJaoRFiUWSWsDwCvMgSh9nOORcqTmhDMBBTo5IGmtkRxQfOmcldueq+VJ1vv4EvGQlKPgCLBFiNjod24WMms+gvf9W/jr60ich/V/7/1/1/ioiv/7UsTlAAo9I2LnoPJZmKbt6PQK5zP45dN5pedqBAyQQ5+IVIjNSdtVrYEC5azqTuvFCUE9K4EjzF2i3AIbGaf0zqmCx9pc0zDDfbFQN966PNwgdDNLsGVzuFgQjjPwWZh/Vv44/5pn+X66qx+yypD+Z/k9U1xJ18WTqVUgSABBe4zUjKy5Qt52RFwp55ZEuuwn80GPzM2/VC82b6FO4PSUwyJ6Kjre6yITs8ecQe0a5AaUZCGcxGEE4/wo6m+pn8i/zf8v/O9tS39P8g3xJ0f1//tSxOcACxEjbYeYr3GipSwdhh16M6AAAIIQId/MRkl1Y2dJmxVUsgd5+5DCoaYrES46GDYwgHNLeyx6lcOfO+j9voO+dVTtzOneWVcXsObilbkT4vCGVfwoEtdLDn89v5N+inPb2dDfn/yrfU4Vfb0o1u5HpQAAApTPIDQlshAA1W5jCmbMxrl1I6+khbipGVw7fZLGYCgZomPnKOIUcdMxV1JmeHRN7lkOg8jqgoWgNB80nNxJEKc55+wX5s1HmkBX+L/83/b9CJP6fyv+Nvb/+1LE5AALAUtpR6TvUXmlK52GHej/u6egHxS0RKP8uFyJK0d4XqiGnUVWeWPz0dbaifSODUw+rLSggnlLQhBPYQQj9P6sL5d0JdnfRUo6aHbqOvejBkjChzEhtt5GF5GI05iNfz/RjyNd5GP/950HEGnFqOB8iQnMuOdKcosAAIu0LEJgMMf8Si2VisPbgm0HIbJRJqzL5gx44Tn5waUhqAqsTQHCCWZJpKaJtmir4IJmNnJFDJJbfnt45lqqLYkVOiQVEiptEQ6nFFNVAsjZRv/7UsTmgArZKVzsGVCBfCUrqYYpsMJ/dnF/feb7hSk0ySWxiilr0MJ1f2/TBPBA849sgXHDS5UWui1oZpdKRCt5GXzuSZiTR1idy1X/5tbHJTzqo3Fd5DBzATgHxLJRbPBjqqOp2twkVL5UQFArJ70rCao8kRjc2w0BbB+NyUXargVc4VKIED6MRtNx5WOaeVJmUVXPjOfEpDSZjon6h33Nv/C09v9odeFM4gM0eU6pOdjVOTjgtOGWsoaQi3yCarqgFJFNylLlDVX3cdtyoNYf//tSxOmDi9kpVmylUMGVJOtJlJXwNRGEI+5qZ5+qRaHShvOdVCLgfjLfZeBiMLCsZnBRChOuWwmiI8Zu8tniSAKeXf3nq6NaTLRg57XKf/DUNcsTKqAJCScoIwJKqy+Iw+1OTk6HnZkW51Ilkx5ksp2w/542jJyEIY9HkLkvZf9m6uggEwxVTU4k2yI6R44ctDtgMSs9cu1bEdygmPWYTVbsz9Bl5hcAAgAAAXKDWYvU1Jp6t91Rx+UuNqQ9I4eVfxOGeIqmKNphusGRy7x07G7/+1LE5YOSnY1gbDEjCZ8crITzDxoda1jC4vjGYxDra64SFeVMJjr36D6/VFZU3Mr2svrb/vWNRqO8akn9/EoJADmAi2C0peV2IQEtNnBQWDBq5oM1on2sWsfsVrVbOX+bWatcanHEiaHcBG1ZFVVGvY7FAcU51lVmL+70+y6ZxhyXsv/26WeLN+4QTYldcjQqAAGEZDqNSxf4KOtUNkR4up3o8rFaF6/FIaBASLINUZTSRYohbICaCGauuvZ4t27vr3dPhL5UfJIK6We4gqfp4//7UsTFAAoEl3dMMGVRTxcuKPMVogBHQ9ZH7+prHIO/SdhJIrV4VIABARdoELDIUIr5fFBFFeItOHO0IcLtY9HNdIyrup/3gyGUCQMbBnjGV7SARqqPqZVQs+NCn7GuHqOpOr0r0P16Ov2s/9j2LbTuyYi466RpUYQEogpuV0IqT83R1uIsiOHkxm6yyF3mNiG1i2MaQn8m6GYjWixRsrhlFGTLXA2l6m18dW8W0duutuuqmzIfcH6PU4urq1yxtJE0ZQ+wg6PBg01sgZHCsBC1//tSxNECCn0DZ0wwqYFFIGzNhhUwIy6LtpJ0cqwyBRkgoYkyqPUuDMfGlQynu/ocvER5WKgbKCA/i+3WUpDZWt32m6bLAMzjqbF10vHdW5KxMM0JRULZRi6hx9Oo5Ee7ZHw4PmkVH+UxFkd1Vv5LyrxMWzNWyH+V0hJi0wQAC3ARYvRpy+0a16W2IMVdKDYWSAocmEYiaGSAZiTmpEdpyzPNWDFHYyaXDVfpnv9tlo08a9dcJt36N38V/26eXm+n8Seytytmd1iRuyY09GMXxCH/+1LE3AEKOINgTD0k0UEibKjxllB/6D9QQKcbJRJJKcGOjyTkbSivN9cPTNOI8zhVR+SnCyESczIfj1sxnfRlFFlbWxSOHW1FW2rQfVRB8xnkCLcj6K2vQe+rc/VunTzNqx2ivdU/Z2oQecyIzp1YlJLUaiACu6CO/dqVABlAkkpyAoqAlRlQ2jSIelpUXZA0h56KOMEgOCaakikYq5dnqYKhRqObjZ4Lxt50xHVPck0RWruEsjnxFnt7/sma6jXn2HAXeExnCdZgsHwyUrriJv/7UsTpAExc32lHpK9ReCdtGPSVsgZS8Darwi1GmkkiWlAjj6YiDm0T86iTIIxxMF1QoUPhpxzCDwDFOeB3Juyjgo2WjmEfeQ8AWN9fidOYy8qPLMOdPuVCdqoaeppExTAkF/RDK88otUlX+EBZ7SXNcVLEgVPKfFQIpKpqbaVV7wwTdK4cLOap/nO7L6bbEhonR2bKiaivMqrGJglh63pIFGO94zbOy2WhG/OKek2Y0XbDI1TPfrYcYpn2NlolaRxNE+ZAYRKLRY+6SNk6A8Wp//tSxOaACxU3Ymykq9GKpS509JXespZ+viNCITZOpSlNeSJ72780+49rEAAAm1IVEp7U7CV+qHqwo/xR84ehifgGerKLPlP34TyrNdyQ2GRkEqTu5L2Vnfn14qitKgA5p57mNnCwhkp2y514qmNBLI1vmXVf+4vdxxa8/6q3/szX1d+RO66ptJpuAqJm8rjIVSEHPFOVAUcjufvD2SrWFs5WPw79yQcUc9nbzkt3FTru6l2staUu0rUw7OisxRoqTqTMSg1+/x9fcyN0l6OSF73/+1LE5oALSMFlTBixEYOfLvTzHe5G69SxClmv/nf/5qSv6NADGNCqtgcauhJpCVCiFOsIo2nhxGeraLp04WUF8YdQbnBAxq++j+w5ZsSuXV5nusAsHC2BZ5A19JFFHqj3vKjqMl+lEK/l/UHRzulG8hJ3+tdCJ1r/y2WqAhxEBEIE0Tp5GMKwikaOdZMwI6aCKMRHxEkssmzTjymsoO8RV6SOXKUvUm5t0UjbDz/9NjIfEEnZe3Aavz9Nj27SITXcu1F4dskP45atTn/G31f4hP/7UsTmgA1BL3EnmbExaB8snYEuYt/b6P+3eJjv/1fyoCkAElJF0FgSx1jsJa4oSf6MOoF+3YRV36IdasrMmFI1FXpWvCfKm6OUiZzrtMRjpOKqJsBVaM79JcoL/RHTuVGf/2//HU/e/T/NR3lBSjgbdVIEgpN2Bikun8WEagps2G65iwZdKNPnP3p58PsWmt0xMTVwRqS8g8p++1OQ8HxURq25lDzXFblfAuXdBGd3qaOmIGtVyR1XcUDN6M5p1HQnPR0kW7lSGjffP/qytYTH//tSxOKAC30veUeZrzFdqW3k8aqe0vmIlWl///5MVClQAAAVAAR1eACHkwHRpacixwjlWzuE94BCjM+GVvZO720JXdEQn4EIk5omX/c/V3cOBgYIAEbun//HP+Ho76f/l1z/v6CETd30RELvpl8RC64t+v/lon//7gbnK4iV+IVRPRE6Dd9PcDRqBkVVEkpNwEh8VA0MCWQFTRMEYCAZAteI+6KOHTAZQ4OrllREuNJ6vywgafKHG3wNewoRB1yCWIQCdOCiLfqmF+rKjXi+nS//+1LE5oAMDVdlJ6zx8UUl7Ojxnhp//tbf/77xIAABJ3KUQ8vxrkHQ9hTjMZSrP9VmeXqiPV01as76AcNIc1l9jSCQ6rnbvOVaLpKI6bWRk4+n0q7QPLT7fLZ49CB0D7FxWfSza/JstWRJfURLBIM27/YxyAD/auoXpaSQQClGpBjjIsr34m6cLtAL0QRhkYwkH0TNDCiQ9Vw9fjSlo4ktXNzL9nqpjUS+QizrIMnmZ5DdWJ30Nn/vQESogio6un5xA1BCXeHagaahptrav2ULI//7UsTrgAz5L2DsGPDRrrPuKMMN33IxLdueKA/KqAAACoDIOI2S9o4shyD6DOQIJgPqQVlE2JZ2K/Ru7bUWc8t9ySszFBDZU3BNNnYj2MlKqYSG/s6alLmvo3i1chW9f4JeUrJVrK8nspi9XbVv6brRPDxK1oqqgFn9NQZBABAJUlFeHilQV6GkCB+oeFqXB0piaEhURHqtKW08/kp4F9uQhnPZKIax3oOXqudi/bKsvJxipu5fpPTf78ruczW/5glgQCcmkMj0pSPHoB9ynN62//tSxN+ACbBjc0YkZ9FvFm0c8w6QcexleXiiOoQAABKcok4LQB+KdjO8mp6qBONjW+U5WminwgpZcx8HYxVtEPMxAgHgzLhFBoxv66Ys37Cf0OlqU+H6SPB8unhQ+JFzOmlQmDOylyxVaGv3l5OyWqNJPovULXE1MQAASncSHbqlI1+ClLWudZVEmRNKUFgjulc7CFysNvuup59j17FKxQrszOdypKRmdGQUpvejFKr99N1ooz0/8mCr1t+jUrt6c3Z7lFO+8DnIJvl/cd96jpr/+1LE6IAL3Pt3R7CrsX4r7mj0iTYVOvAzv/mtsdfSSESU6IuRQkSkdLxgqctqMMcyTuL8YSvYoZi08ENUDJhawanWFbobHC30EnoMcKMMZ0WP3mOWRXdXZLSsOuW1/ND+djXonsrnHNxxiskoT7yxVY1yC9Vm0sqUatGOFhaQAgIFw+jyO+LBOs4SkUjCkUOa5lDRtRZiu308FqRnKTg0pEWE//QdpQqP5ShvvboXc9Z72U4eJFwsVY86+URK0WVVO1vzyVs+/9TunZu9i8oaYf/7UsTnAAuo/W1HjFTRbRZtXPYNmqO/q0gqDACCUpQQwJnqJ9YswtwmaKZw0+UdsUzV7MPMLaDSPYz3jqyKPzNn0gGFBzkIQM7Iup2R0QPluV2CnStmBJFk9VeMBzs5nd7NeVHEH+vl1F6IZ3empK9lbHnRckZUkMJ61QWZ5JJKCgB2DoTKWVBdlctksQ1IWXMNDrvV8uV22AOKYWZhEodTHwHgciNeVE0qmVwb0zPDblaqhyO74IUUjOQjBTNci+DdAzf/19D/uuzfkOlSqEd4//tSxOiADAUnauwwSxl/n+7o8ZYeaEStzBYAFOASU3KC6xFBwGdLtd6cbZg006+cDTjXbFyPq/ltLLiYMHNddYZmtzlM4t4xOWRf6KbEbWjlo8lppxolsRJpgpZWEVbo52U7uQGP92RvLeitRk+1Do/sYSvvak3aAlm4EoIqAJOhBVRFWdpAz+OVHoS+U5Omaje3o/bgpI7LGUy2VRPfjFS+lxzAjfMQgLE9mzTkuXM/e6BAUVC9j9bFARrveYVdk1Mjr3WlviCsuan/FCbK4ib/+1LE5oALFTNxR4zxMYakbOmDFhohE1oKe74GgIkKCSU3gI/S4LWbLPry13kT2lI/WApYIqnBgfNrCauVMNM0eJVMlFdTjkCgYnM5zmBEljkVECRtJ5gPgxFvlRc+zUG7L0mCNvOMjx7GTzNP89+mVf7wfv88IAKMVPd5RjGYzjpibqpWAAAgEgAqsGJDvMSXCljEH3bxfMugB0GZOBHJyZilNRdZsfrB5Ps7oM6sT2Z8DUUxhhOHtpRryn2bn0DOiriEtN9RZ/K/4//l/6f1Hv/7UsTnAAthM3FHjFHxdqTsqYMWI/1V/45b48PurP30rVSKnyaEAEgJwBSQupHV2o65buvbCpY4NPE0zYEnKF+Jduy9l+VUsoum1uUT+dcaFYYun0RxkMw1QgHaiw58LX+H/6v/Z9k1J14x/2E0ei4i38St9B9W3ooAEgAUAAAKeklhfbrOMUBlzvm4reu8z6AkEakGBTuKakac+VPO91HPRfquCnIo2azed5YzMYipDjsZ7PIhPR1Rqgy9TfEAunUv/F3+f/Qv+5Ca9HXJPbIL//tSxOiADAU5bUeYszmiquwplh0ifjDq5Y/2dYWGF1B7BMktmMDlH2NzcbUtMGEjpIVWOiFFngDiDqvVL2MRROFk7pRMS8Uqjq3axAs8OQhYvy9vZFLzSpuj0oYjX2I7rzhQlNSJ/uJPU7NlZb+znv6H9Z9/zjvUl2/nP877OqoQQBCCdwYENwKkYMRCZsWiz0dbvIWQxNlEjbs/A+gZaJzudRPnp0zyZ5Xh1x6JN72NfhQ5ybm8MoccclgVJT26AEIi+os/lf8//M/u/fv/Rv3/+1LE4gILfUlfTDDxEU6lLCmEFloKe/n///SAAATQZTOmfDYGFkwAUNozMGWldTnCwO46fBfaDmbKpMsZI68+sRtKQ0ikrYAtRwObsi8syAQ2FndgkaMeKZRUx0N81UiSV1EVDX43Hk0vODJb7lb/qMP6jX9V+/b+pv0yTG6vbQMAAAADlwGeokPUg84sSQlM+glrVxaDfKGtbcJ1obZ9NPdfjYwBpnSGMNuYhRAr4zUfcbK23Tc33H5YUz4f+orN38HPPXEBZvWJnz2WUH/6E//7UsToAovlJ1utGVLBjKUqSaY2KNu49zbKeR/ub9lIeQ6RtUVBRDbuLaR4/0+6RYsavmR0kwBSAwtugeuE5JrtDgexl3sRzAhyZWWT3s6emaU7orK//Od/wADgowwimKHGVXqd/nO8+hJ35C1Od//+mLnwGUOCD6gQcF9Z+D4HPlwfPh8AAKXckwQ9LrpnN63K9GXQX8xrguSuPdD3jSX00Z4y0lkornpuoxMvyHm6u8O03KhCfPMWk3i3l4DIgE4MNko2FjwiBOBY2ZaVOMNy//tSxOSACuUnWuys70GSJOpNtLYg8F58mXiBwbh6TXCZI2ucAsIiYGUlcT5lHj7g3iZ6L1FHyUbJWxhChFWeSpI1JWP+SxdTMyto06Xg18JpGnC703Ii20NTzlz4MvLB8y6VAEIbABAATu4JIBkVq6fHYXhKIhbyewiCQjWG2ze2elw5pKDcJkpukXjrBnDypY5RjkdYc9fa9amzmpbqdRw1Alr1YYKLeIN5A1meuzXz7P9XXt9CBQSAAAEycANgzSrMl6ii4Lo+D7YDAOt0r4H/+1LE5IAL0SlZTRjxQYokbijzFXpiIIyIuKhEDa/GpoBWgmfYm3qoxlXf2p5lyxWI9UqZ7PdAz2dn+EAAHOrMkBfagaC0WP5Z649XA/o7Oj4olSkqS5JLoAAKcuCiQSBx1WuLJHygmafOMZyXRUVo3CPrL/S/dPau4WjG6QyjL6RsQlTTPhYVxq6WSpKLtpQJEiQiCjIuePSrlg88Gyx4ofmHvqFQKcWKsyteKG5Z3V6Uv10AAAyARiOQVNRarKnedllEPP3PPAgenvOE0u3lxf/7UsTiABNBL2RsPSnBTpVuNPSJaFbYyqVbPGAu56SISFhlxzNq74irazLWnbUIvTNLXoPYxnIVUYUYZGRSp2NbR0xPL1c3s/pvpQtUGfYTtVdFH2ekKUkCyUlLjkMzJSHagjlJeu46d6OUD4uDEp2JlXC2wTs+M/2UxaPNb1tVDnLZGfK9uiIqhmlWd2L89zGONFYn/iLfOiC9qPy/f6/Qr8Jins2vf0kMs3f/T/iLSjHd3T7Y5QCCFeDmkGBQPEgKyTrVpAzukdKSocPJOFyV//tSxMkAC7ilbUekTYFrkm2Nh5U4zOWhWMZXrbGP6zfEjShSBYzR9zSxqCo3uma3hxS8fOtYxHkRnRA46tRVhJyW8WdvbFuiLp8Ys6xB/QzERA4Z+/p6WKyI8Yp8mHxi7FArCgSiASoA8p4+GgvsigQ5OqMw22KkYamh3TkFEyLvSz8/GTYFvjw90gXPgevXdS9ivAFJvTV4+0HDakKwbqQ60BP3RtuPU3zXZ1RysxSUD8veeZeqa7a/Y+r6B6pFwuVlVnI/RKN1qjUAopOXCkn/+1DEyoALuQdkbDxNgYMsrijzlwKkuI4rAI9KGu9am8FNYfS2/FmnIxHOIskU3Xx+FJDegZgpWu6DE8L+8/RQuTVonucxFCm3lxDumqQbbf/Dsr4T90oUL/rml/jpdnoZSLTWgW21HaOjE43NJsACQAAFvzHA+AeFTUvO3Ba7lEglAovKFGQ9YVLYd6dXV0u3N6K8OXOl0DXfvPTPehYRdvt01hMs1N5tWHQzOKZRXRGlH/efTlq3/+m2v0PpDPJscKFQzah1gVTfEsx/2RkV//tSxMiADNUtYGw8q8GeJu3o8otOWKJJKcQs/STNg3HA+5WpYP1+5KXHjMO1itq6VOqxsUXYT14H1qGkhhuVHC2zYhLpR4y1aky6ER0CI3kan44hO/7RN3LKk6S1SOE3tA+RffX1wju+hACIAL2ANokxeEM6Xu/bJoo9SJA0FKhh6NBN0ewDERLcqIkJBz1piQTsLNYZvJekMS24Euc4RAinsgIVVxZ7iqnZ8rvkdMh92gzT3Z7q0oUqAAAhEovbg0OQDpwRdjlI+e59fsTjKUb/+1LEvwAMSXNs7DRPUXafbA2HiXjW+IjzOOE8rS5TJ/S5rjA7xaEPnxbW3pYNeN7ZUF7qfOGvbzWMSroe1Gz3o7XaQun1JwoI6Uj4upDxAg00QOOfidDN5OgXoPW2zHNglykP9fQtoNtKQylTURwxt7GXR5q5jVcOovIn3jKRB0H8m6+SVyHzCs4by440RiTOsuNlqyL1B4BT/M8ZvQzugjZtMQeJBvr/+cX65/8Wn0RokvcjpEiCa351TE7mJgdYZBbCclFiMUxnpkIWh7AvEv/7UsS9AArQs3NHnFgxPo4sHaeVOEhLi3TDbIiHyUb2yRuIXqA7+VKfWt/HzRVb99ZVMReELh2R1rrDNvmnktwuA//tr/x99bo9RXhfye5Sao1Ob7er1Sr7fT//5fl/4LlAAC3IArPeNLhpiJbwOy3E3wiWBSHGrXbWP0gCXWYJ+PIJfrrzn8wAsW2P7aUgDhlOqTigaXIqeTulCukoJTqW3wm3oYrq9gcN7XHWL4FC2/BaKOrR69fl6gAEy4DUIpmEFYAiypFy14JkrNyf0lyS//tSxMeAC4DPZUw864GTHm5o85dCeryPKISyrgvYkQWnnol989iGvse3lYDnxNqaruy8r6dy08jPD8h1cV9/V6QoILZujPUs8Ap+fbs+2tyJr7V2q6GrJVLrKr6JEpIpUqJCTujSK9Hl/PlViIBWAXZ5oiHj8iuXiNeLgUjU/WThap8iHmaimWIEQWU2uzt6CLqNq7LqKX/t/Vqvz/TT/TIv/r+/2//VERj0lUA2iokfMzNFNWAAHLgV5L1cywqQqZj7JULpULMyyRXLHMZ2P5v/+1LExQAL0YVtR6xaEV8Y7A2nnPh/tQiB5SBhSSsIap+2TUCjoYyXcifOkiNiuJX9emOTuSW/4ZfcUeUyKn1WfruzCm7dJ67T7dUIIEktukD4S2Z7WRMjjTjMDIuypLEEPFMoucUrQHsvk3OwRl5/u8hQGPfaJyjqasvpYa6Mupqe4SfTWSQb1Kex/h7ev9qdeoqkDthgdcnZO7WqEBnBEEqOQFQ+K4eBeXGgGoKyIyKilZ7oWmUPFhv9tPlj/yD/bKbw2aalHveP9S6W05s+///7UsTHgAuAxV5sPQvBaa0vKPSpHm+Xrkq237VbsWcQUQuxH0fQ+QMiC4XYL3uchMh3oOawGABF2XBSlAx6GF4Ja1iEjXnsj1BFKbc3JGcsH/KdEmaI/eeDut6MlYDXDbpahErbRakyOqdoZf/M2ar/N/UiFINnv8S/Ecsi0qM2sm9FbdBiEAkFFFFuUTZZFwZTvOtfLOzQ2wj/fv47ZBaJ/beGXyO87byHO5/MnjzQtVL+tdCerjdO+V7v+jgRi/6/X9tPW6CLZXWO9bvUecpQ//tSxMoCCjyZYmww6YFGD21phhz6W5XWiPaI2Pc+B2NkgUIAJ97hWaULyspR8UNa6thVmKwLRTO47dK2p1kmar2K6M2RNQy/n9GbrUOE8iBvdhzOyTbTbGG2cZoQiuHGOzn8qCg/qW8YEZMcctZCYoxLkRtZN8g/+q/+5Y1evOU88o0+5PRVAgACDZuIKRJ5Qt9Uc07RKkXKsnYnTkfRDFfog6FmRZ8Etm4CUs2FKJLlkiMp4QHsa8rKCYhqXXL42IM9ivsKQ7/zQyc3+UOdV+z/+1LE1gAKcN1tRjxPEUUb7J2FieCjpYnX/FRb/1O/9Szu9j+QdYbKapVFEJIwThnFebCWKM1F9EmOxNAGYmD24dFCuK5w56YpaDsQKkf9EGamf89MsWwD7s13Er21RjdX8qW/q8UBlTbnH+UHjKvc9CyjpAsrtfzRLDBM+/ATPu/9kWUBlRleFJBKJUCgPCWLgQNQDwTkM+1PAMtXoiC4Hs/n8ZpbW0zC9DxUcrKlHSQTYlflB+sqZZ/MDtTzhapDUYq7Mt8MAQibaL+kJ2eqZv/7UsThgAro3WtHrLZRk6TsHYeo+Do08HDeuuEKf85F/9Cu/9Sjere5dW9frQMAAUlIc0lYnjZ0vyCF+u20MgVMw+quN6A4AM0yGFIRwihflkYxXUzdfiS6EtaF/KA/amIBp5QvtC4b3n91GwttzPE4wXX+iD/19CBL/0/9YuPr+qArpq3lfl/SFZI0FJEgwHy0k2V6XRTClD+QpSXVGu+jp5NTY87UdL3PTRsZw/1uDZ2n9+xeKk1MnVd0TxxzGYFkxWPImVuHVdtlK3r5TGJ1//tSxOEAC4kpXuy85cF4Hy4o9h1+3oP/9BL///9//iX/2Bfl+r9AcgSUpJRXC5mgh6EqRbSyuTaeNwUn6iwUWBvVLtwzddDgYHc2PmHZOsIPxIDNJhEc78VtoYlNllorenQgojrK+PiwjRt/MAZX9/Vrf8V/+f/yQT5nrFIAACgAjJ/x2InYVgo4kVK1nNMUhXmykg35YEFhNkEEXtvOiJKX55Acob9OFPWv7gyCeN3cwROp8Abh+5Q1LxNq3GnP/wGA69T+YDLqWmqh7bb4FHv/+1LE4YAMWVtvR7Tx8XCq7F2GHPqitIaL3UlvkH9QHO+kQIAKm24AjAWQ1UAWVzOpaNxLH5tXLcBnYGVAOWW3EA8dtiENZgDNQT+LbV2dra9f5xYfAJEokLMj5iVmT4FJ3iI9Le+wM59U8qE83ZSt0f0DgN79//2fJxa6pCBLclLOErk2dytJ0eJvWYxvm04P0dBbzFcauSQoz2EqWTouuzQtT0ggyaZ8cNZ6WjtDSJGuv1EGQTY+eKbELKqnUtFnEVfo/QNFCnqiWeMNF7DJUP/7UsTgAAs1WXFHrLNxWKstHPWVyqC3HHySuNd/oGragEEpOBQGmlUGepARZzqPZuXA7UDJKtQkTdBIKSUH+NXxG1HcPJR87Xt71BFyeXS8Lel8CIhUap91zAG+qkdqpcmOrKK5mZ36nP4Qa+ydyVWq/MkJygFOCoWxKgkXC0QUSmnAVSkO0y0Yd6Et53LTYW9ANcsJXqEwcDjfi+6+6plY9gWDYL2WZ2ZavWPUjo4hoX5DoEF+WGV/kKI7p1A2pS1otGEcFzSkvnxrCpHWHW5h//tSxOYADBj3X008p8Fgnqyc8xbQQd0Lx4e2sikgGVJbgOsbpLyvTZuj2YoKXcDsPF5DcDtYGWM425FozOCrkmOCR0DRO9zXA3xvtUrUUf/yA4AGc0y40TVUkoWfLrUCSou+RrQr5W84I+tPwa+7fgn9W00//hGyNQAE5uB3tHBmTMm0ftmw8LTt+xRWZLlTKZisAwRDsZUlL4hNHlbEZorAzPOEEMKs1vVl7flqV0L3a/hy7lWsF58qB5E3tvkYnmWyNtKDxPUnXygUjf+eK5n/+1LE54AL+Q15R5iw8XOlbqj0Cf5rVNTeSmH9Vf0b2PPfxvfSVIEBJuRLlA95H6ctmpYLZrO9KW7Q/fivYNhinnGg9ouJI6znBE93i31Ef1cXrbWqPvEpW6iv80CynRe0qFrN1fvL9KjRH5EIt3/8hb/9/r+jfu/jF9Gv9SopuSRangNheVZ5kMRY3TWeG4g1UeSLzRfVlsH+4sQDNetedBvzZxMzdzXCS/9rGiZzYqBTpnqBiz+EF/2tMDrel7tEn1n/j5/v7iuW7SKu6Epnqf/7UsTnAAuEwXenmQ9xdSlt6PQKOm5/J9+8KQADlvwspFVb7RVrP8FlM3fdlrBpfJHAprMdklqWl4L3Y86NSKTCEGbsL8sc4SgnPaTxc+kSrM9QZd+eA0e2YhfVqAqe+RUoYYIB+qEDvNWNbf/HPq3ojf/lPVnb5N26qkAAoNq8EF5Qi7D5paswGXkrHhbnDsmas/0onmxuI0OdAxdmGfCCzc8PIVLBmAtZ02s7ciSu/1+mWWlp48h31xTfwXS2a77wkrhnePXFPbVR8NZ56nNW//tSxOgADP1LWmyxUQFhKWxdhKoakVFn/+Xf/a6D6erHepb4+/z+c9W+RyoCCUcANwScvJ6FllNlbVaOCE4t9Y7WlTyiiOQOUDTpyiKxMhUIgMOQEhiIDv2qmjBcEzcjHgSbbdQseYXJ5MKE2et3+oQhiyQohZn/Sy+EiJCoLhiIChxmju+j9NURtj4RiaGxR+YWQB4DmqzavsYKcOhjfG6W6GpRqLphJ3BwxiYzFUKUxH8YZukuYFYGSaOz5K/SrFUyPpa06hPSkO0K1IpBErD/+1LE5YAK+SFvJ61P8YIpq52EKlA2hqqW9dr2n4I2ZherAeBsyeFRWdZJLJHiJ1v/0DvyyEk5LhAyKDTGljUWwHgYCILFpMKKZU3dK9zx1FQ62EOl4YrIzVY/NQbHS9j5krEGYs6W37+XyGTEpJkeRQUYqwXO1V4qJH0uCiKPoU4dNB3+dBRTTgAkxaSKOoEBBB4NmgYiWlF5LPqcHUVQlsUMf67eBrYDUaG7IjHI7fg7OIANwFUHB6MANUzRv3Rgrxp2v+//rK3/7Eon/+d5/P/7UsTnAQ2dS1jsvPGBcRvsDPSOMBlOv40MQxASTcvAYUjEs912Rr/fZr8dZbVl89KY7DsGwSnAOFiEU/lU9zMSt0LuQ5djmm1ju1drypc0avTrq1nD17flWI5J5W/OwqIm1Zz+devn0UlmlEOj/CigauJWhjd8W5Sj0tUNmORRlNJJyjCQwvZbFIYkMry7okvkM4CgTidWXjhup1y3fqrU4PKdLWTnVZpwch5d4Y0ap/Y27ZNie3S0NNqykp2F+32UEIQzq+/2/KvqCPu1wo31//tSxOAADJypWg09i0FEGO3phgyyOynD+rSAwWIWiySSECouRcS0JArg0W03hgiBnY4nir1DO2IhAex6jWuq4GehtB4dEJXRGkgr6e4HFzdXfI+ZJ6czexykW+v2MD/WWoV43b7fndN/5f/+r//p//mP/fxwk9lGpQSYIAITklMNYu3eXqtaHYIir1VE5z+RF0WlfXiD5dzZgHRMhuDGVxy9FGXRWiQ4+rvzFbvmXlphsioaZteeukP6P5qqoGMl5pcz4rI5ub9h8l//Uv/+j/v/+1LE4wAKREV1R7EBeYgl7WmECft+JuM0binYEYgBKJbjodlS5b7cV1MgeBS1eCun3wkfIjZwQhw5g5HFrHN5w4k4qfonfTRdYng2fCeVOp1rbF+E6pQy5t4s/Td6isPszutaNhdPRV+KX+X/K//2V//7//yn6u/QeOrOrpUSKyQ2N1OuzA9UcFBVEWgZiYsE2NVAVrpiBn50CRgS5GtYZNL35P3Y37CGoTtQmXzrQ06aZDZQn/SqVHQVJHmnVQs0fbFH7fjj5yyP4r1/9iv/+//7UsTmgAtpB3enoFMxdS9ttPQeZv6/mP9/yuSCaksbbUbijw5jAfSwIRaQwieH0kj+Ll4ImhsQX5hkXo3O12YybJHp6ivcv0L9aUdshm0ds5ynPyhOhKhkkBsVU6zGNQwJ4sJ6PPWyiv+d+f9H/IXs//lS3/6v+nygcrLELgSWiukY6yWlrgEbKUuaIHarKl4ikIPyO53Zn6wr3rCZiQ+GccrdzSGjZKvwRzZWaIO0O0bJoLXcrGEy/Wq0hEF/S+6gR66CK64pxXRSVy9Wt/UV//tSxOgAC91dZUwg8JGGryyphZ26/WC3xIKRScAUiHDYNUX5MvEsUlC2i+rsFRizagx6aP8ZW9tuTXTFziY+SslLSR09l9eM9G1jZlnZ3tmsPjjWMggrejquoRNV06diEIu9lOpcPil5bNociKyFv3VlOQezj4Bm0OdKw6oAgRAsAsK74BbEYsILCEdXzkVMTDwN5/khRhWH67mjmaxSN4kJxtmavAglaRXckLWJ3WbpFy7qXS+f/+XLf/4ozr+fRr7G27oNhW/5KG1V/6f8e93/+1LE5YALSXuBpiTvcZcrb3TEqbZFfLHAsRb54e6/+Nz7DG3ygAQAAgAusGG4PwF5UFVDXkS1SGKhosOXUlx/hVPGhJjJKSE3EoXVVuQowaKsovrceBWAuHt7Q6Y3gp1MXG63XNPHRlvuDxU/RX9mKgn/t/OO/qevnnnBOQW71c3/FfmfXQA2pJZQzGFWhb0cdqilrZnhXG6T3wOob83DiyVWxfUKOWVz4Wi+9Fq5LW3jqzVCULYWoC/6CFMuKRSc++IR21rOkwJcdCVbs6V22f/7UsTjgAoNJ28noK9xmCTtKYMWZhWwHgh9c+31RpPsqj/7LHsj//5i/jv9gkd6Fk0z654VAabcTphUl81Oo83WjbgumZW/7p0zoVvHI1ig0vs3UbUPp3LZ86bvmbBweJD3ixmM/at2T41qhH7E9cIkWdXuCem6SfppIoPs58YwSdJvTJ46n7aDIhQfb/Xjhf//qJA//W3+c/rPot0Wr1troXUtTVIH0gSWoXxFIGOiA0itGLIQQ+DJ3oSikLvtAWPFZ+u/i992Zxu1zd6gVZ9a//tSxOYADI0pXa09B8GBJKspl504JdHSRAAiqvDxjUdovlQXUnIGS/OazCFaus3JFljONQ3G5o/mzU9aDGYJEZ/QM0EXtdmChPurX/8cX//ySN/6/9ZJ/1lz/Qf1KSU3PShsEAMgg4K8A74YkWOjwCFdR20mlOphmE89KVsD0tEn8TDp7Joi04KtgT5fZ2CC4QqOPJ/m3kcbNVj93rMWHnFxFFhdNkG+nFZEUOKPKbIvioxfX9K3rmAQjf2/xo//+anv//QP///NP8y+vZ/stR//+1LE4YANQSVnLDGw8dAy7F2WNbps30IyCbPv7AXE3ohVMFAEIkq3VeoaGMwwhgVARx+XiQ+RskMWe5VGJw1bsjQqNS2wWFvhUybiqVLarClV6hfkyzW0OD94J2Q2GqUIS09pSRMngKWzHxUIxk+vVeklSSMgAjmzJes93UpjoTdG31f4l6P9X+Mx//b/LXdPU/6gAiABCZcNNZlNmrNAIKgISRWHfSofVKF3WsO6wOxD9p/xGdM6LJ6caw8OwkjVe6w47rh7NPpucJoHXOPjuP/7UsTQgQ7Zi1ZtpbSBw7Fqnae2KOJZBdWfUfMLOMF3dZ+Ny0bzCKxSxNet9Kdeuiai6BlI/zzeukEobdXbTUmikwcJ9vznullTf7/5r/oP/OP+V9MAJBt8EdHnIYi4sMWdV2CBlll93klTSGvtxa+umUkIK9BxFAORbZFIuEpR8WyaE0QYKdn3bE25erM5rI2q++h8IX1Q91E1kurulFLpoDjFsMnezOp39bGInH9lGn0sSZD//xxJf1Kb8+3//zb/ST/WfT/VQ5eYV4tX4WJJ//tSxLqAD3FLUE09tMH1reqpp7X4gphuUhyhcFR/N/KkHvPNR4xHRSTl6Yul5YL1RBJ9wGEEjrixMo4HGDu5w1j8ERfVDnZJCglUK3JhJ7EtFabMfUC4iiwimjzXufMOLGh7u9pxVHbPmqCJH+f3RcWt1+d/0AEgAABKkgDDCQWL2pzhQxnYz6UBBRt3bNQxMqTlri9FETwkVXk+sy3SpV+x8IXBG7Jq99WU1bELmtYNP136oeGdvKpl0u6h0T7IzSJWBP7bXGgnGzGiUUE28J7/+1LEnAAOuY1WbL4NwZygbNmGHbpfGAVhIJo+Hgmj6wPZtqEfpiuYv1NN178t+oqsSauiqE44lFtudjehCHq1cG28WnqR/ziH81P0NMKDUu1zUIuhvulXG9tWpM/pChYHZ1tPf0zG/MOFpJ96KhQFrLxBZkHVCdiaRKRQSVk67Td2Pq7bCUNdlDuv+82FoVI+wNyiu00JrpWmDnQ/FtD2cK3W2QfWj2/NQfc97TaPk9cut/QQBv+Esas9dpj/1ULR66omhv9RHN0a72/o4yEOM//7UsSLgAo5A2tHrE3Rpq4vtMQeniUscZHp8YPUspOchoLpmacnM/8v6vWCmjW0G40mYxOkWeZjJVEisTy5QdF8qEidpJst28KGN/Hheb9hOuKpHM6VvMBrD51D3hdK7KtkLMnUaGwIlikmWPCcrY1STOBTGz9daAH0pu9t5V+tmJoNg86kzJE3x3qdT/LP//9QocTEUxj2NefmmHTlE4QE20vt/5f7upUAgMVcnUC2JICVnuUinjAtlx3XZiHsTQxSEI1w6XVpAnSlt5MBQKZI//tSxIuADiV1eawtTfH0rq709p9e2PD8ZVJBMyGrZ5wyGssaboEqt3UPqRlTk9a0wqLr+msHSDW7sjZ1EQseutzByYFp60a0lEgdbvsME779b/tjmKJakkk9Sr99TJkZv62/6j/3dQCS0ZfLmNh5ihGRKRgQUCh0MDUL6JMsOF0/3siVlXc0olM2BjrdmPCGXMaGvCNKSsCKi2eLLBA6jWar38fN/UhmtwYSjz9sI/r5eW6adAK4ppfMWA2BTHUkdSLpkB+ndlC+/VtMf+J6f+//+1LEcgIPRXVezDGrIeKuqom3tfD/4+n0n3//yz/W//n/t6UBQSkEx5txXigIMP8k6EFOXUyKL5dj/fnqq2yrVP1xf5jvqPNVXazDe5RMmcc2Tbli/bDCpDKo0ZLsWbb+qE0iUg54xQuoUZQz9wyO/1GnZ9BOAxuazu6W/go///44Lx9aNt9PMCMu/5qv/2f+hfzIjjUaTbjiTlCzymE4JB8EoMFhiECUsCBKXk0cleenmfcppZjdMvSIrzhVG7MfrQswzCnWTFEA5pAUep83JP/7UsRWgA31h2mnqPxhz7OvNMarLoljwSBI0MU1UGNicUG/qLP9Q7f+mv+sew2dXt9dbB+E7H7unmqlEWrGADC7/qQl/+Pm/yf/l1UGnQFmg8OoGocLBObq4N9iL4ctzJQ6AosWXyh3tU77EI0QWoQn7LcR1PYdnhw56PsJ9cSAp3NwcmCAALJdG0fVvBQBYrdbVrkgNtPT3UXv+i/+dPf//nBfM0lmCVS1pMymoHEz4Vc8/0an/5N+G/SMAtAvzcK8qBpfuhDCjM071NDCn8kR//tSxEKADeV1ayetr/GOKWvdlilwV1AyE2klz9Vadxz4SeMa2lCcrMrBld37dRhKD9iLxLJFf8emnv9wnCeTT/mD+7WJDkMFltlIFmKPjDkpxeS///RyNp//9cYjTyP3+c9iCAI04CKkzyss/PuBE5HViIhJB8clGvE9VCil5tY40/OhKpX9Nr89ZMbV7/qNoOh3yRFvkCldfuYW/6fKhIeaVChMtXB9PVX/b/6h0cVvWb9co1gAAJGAp8PTFAKyU1HFnHUmX/KRTIBuqreVczn/+1LENwMKWU1cbDCpwUqg602XlTgoCeKjsrk8Tf6uowf0jYp4UZsVGetCRMMRdGU4WIufkM9h5PboIfb513XPNPUc6/yK/ECfQHOCFQKIIAIBl/AGgahBVCjxLIWcDxTuMJhb8rtYlccPiZw+0yr0b5bY/sjUuB66vF40vntUrE5/Qd5eoDr/WKE6ewqpJWfuQqaqdQOFv//fw0BRG/q//HS+Q/o9IQlVQILCkW/D5WCxvGUlhLScohQL9mZgj0RsqtYAB/DFXvlx16IKC1Kgs//7UsRCAAstYWNHlPWBSzEtdPMd0O9sv/qk3jRbMPBzcnyoLRf62yTf8n/5vVuwXLf9P+onI/9P/v//v8gqLLTiSStKmOJ+kIBKFaZVAOhgnPD85WL9RfhKW5swUdmEHFO4QW+oJP3qe7UQbPqU6ogE+Food/2wrGFTUt5cKZf0YqNUt+Aw+b+3/Kjn/Rv+Vf///V//8z0JfWEIGyECEZLLwtDMYrxrG8cSX0cE7YQQKLg0kzVjZndqRnOvdGmikeqrG7ak1dIbfTtmYt7VmCq0//tSxEmAC22Jc4YtUbFnq6z09LTwkAlEendNM4GtXWlx/Rs33GD/6l/9RZ/1N/yst/9/+YP/5KoIUqAAANIhTEGNo33rwQFCVWXEgnpCTY2SFHbzLeVibv1Xq76gpLOwII/Nc1kMjMRaG2NlWg+BWPXe9xcB1tTucBgbf8hf/kn/v/yhL/0/80v///o3/X1+WMkQghogo8JewhvH7sikLcUy/PLS22zwEqkFrxUpmtKk/gotT4WlbrgD9nC5yf3LSG9ELO4Yhp7eLg+/ugGhp/z/+1LETIALGYljp6VHwUosLGj1qeij/8f/+n/KE//T/7///7lvs8VqEAAgAAoA+RroQylAGQ0HIpTTNdlcqOnyPSUtsNLqGzUiGNvxpt41muZsa3KPrZyFG682KBPOMNdSMOf8XB9/x8EP/Iv+hB/7f+d/0/9C/2eL/+9yFBQHGm5CgYlh60qujfBY6ODqsM3L7P3lJxqOUJINK72Vsrl9sIXlkUfuOTJiBosYpn3pqBw4p7/FAcuqGcLkd3enb8/Iqr2321P+rf//44//plKAAv/7UsRUgAphM1znmVgBSyZtaPWduAOg05Yi0KT4Fr0sUI54Sx/KFlC4nKT89XNKiQuDkQEyE2pSqzk4WngRCQSyQUiumS8u6znFIc1FBCjadNXrdTsUgbBOESBMxSZpQkOCIC+4VKsejqez/6lebQALKcuYmIBmgZa5USNjIrGD0Kfrs43ifGuel61uMY4n2X/f1m9NUoQ62tuLAUvJpUSoqZ/7mTM/e+drraQHf9NCo4WTliKflMeYI6/gFnv6qhiAAEpSCs1DHwYPJICvR2SQ//tSxF+AC1ixZAwwy8FKFe6ph5gyJYgJ78qEeWO2s43+e65XJE1aSV0FmMMoleCej0VfPVnrznd7mlISe6Stt/Ic9ur11/ye//+HEoZ3E+Lh/kPUkUQAAJKgGIFVrSSaAHIRbIhcIhJKQZPJSYhndmCo9zS/GEqqD4WS8eW7Lm5GOPtMkzF5zPdSVaNB7pFdm/J1zRFZ5RXX63/8C/850EVdbH66DBABPm1hv8lsGqVgL6OvN4RjkrUlXpHZsTN/dNYs5WpqYhOtJbntBStOVmv/+1LEZoAKESVs7CRNEUAU7R2GNHrVSjF6tzmVGKvenRC2e+iGgQIq3o4ECD++n/Q3v9P/O///Uub/1f9YAEgLAZSDl+YCZiwKPLiLOHnuNB1ANZGyxtZ0+vCxM63P/YsBnjsaw5tC4wqUPfVtL3xl0XXnp/gKGDrfQ//jL/XZv7ij//9FF5fXWav+w1+/xJUAgEGUiJJAKMygfcevAjOHOn444zfzcWy8sTaWZrH2hLZYB4kG5BONjbqQfLWP2L3N0Rptsr97x2V23fgIy/wbf//7UsR0AAp1IWLMMPRBSyltdYYc+Mf9qgD/7/8cb//8GP/572+j/oBZ6TvAbQhD36DZmR3FamdL3kb5WfN5urs6+L//wzFvHovvdWwVOoWtrNLMSDwlhJRMxUucALDGWqTj3/Vv+/+hH/r/wPb//9Ro37zW2+Ov/p/0LegjETRCWoJwXggtC5sUui1qYjsBZxSzomIJusPMdtObG4eROVFkkkkRWLbMWRJ5yVFT+Zo7PyBpvFb8ToT1r/1/6C///8r///xpf9P+FfO+X9PpAgBB//tSxH6ACnEjZ0wsTcFSLm7k9J8OIlFGMLvDmrlUlF3GfxxZh+W8qDhjjVJI5YOnR2Smz4oGxuPcDYPMbRaZk1vNzNQZ9VTdqxWai27pDkOps6q6Rgb/6z3+svf9Tf5x///1myFf7I6PzYsf3eryqhAEkoEyBfqFC72LNci3x7UUAKkJbmTI0mOSxz9W2t4Bx2JyQ0lvkVPrfTTlWpLeNuUAu0/NR4CiafNPKF/+3/I/9f+n//9SzM/7r26Ccj1J8SnOWf1gSKAkSSm4WRDdwp//+1LEiIAKQUtm7CytwXWpbOmFtXr27utFmfymBW2rCdigReknrX8yeshlgrIgIUkQryEkBte4cyFapLDtRRhp3+FkY/2R+/26J4/a32/3/9v8aEPZbhr0+vylCkcUbTbaSTo0k8YrKrTmczuYVKrTfd4waakfNOn8fr5jQ9/5gMJOc8RrunufTvJ2Nl28TDOrHKD6XIoqna4s/6J+V+KUa/pf+O/8BmHflyXt9figFEoCEhe8NnGswC1x++RWNxF152hl134n2OXNP53GbV5egv/7UsSOgAqtS2TsJOnRRSPsqYSVcqcXkEp5hbGizxo+Au5OJjsYXMPT0Vv1Dn6qv4cyEAsQFNqqcJsVl40SbLblaB5zv4LqDkksjaiSUUyfiDrThWowslmwjOnKVDL5iTGETA8xXgGlo+NlRRY5r2C9OdhB8i9sr7ZR7LmkbfoKP1f+NUU4o7HC2/rB4k//ynX1mP4JcMrqOf/UDVSJIBTaoIagDeSdZ08kCwschCEceR9pQhCD1Xjbu0Qt4+pxpgW5Nlyskmy51tr636tXW1A6//tSxJkACnT3e6eYsvFPHyzphBZQUPsZh5V9Z6j6iXf6y9/E3T/OL/Mz1cr7v7f4puf3dFUabokQQs1SUzOlQx1nsqTCpZgSKAyMJ6GuEk5Nex305HYNHgonQMjHWP76T6+vs/TrV/nv1hvt9SP8vLJ5ANThRUO2ybpKNgSASJ6dQ1fzv//t/////ONzP8RgAAZKhXBS0vXKUTmmTMYbCsOGRNS4jpTD6h9YzIo/9tV1DFF1tfxknAUB14ZmLHo6x4xLvIh3l8o/1FxD9RgF0b//+1LEowAKfQWBp7FFsVUhLSmGNPqX/iFJlJ0nMTv8oCEma3b8Yl+rq/2/yX9/SgZepRJJslBp1+OtTOXetNxmSj9dFK2tLAc86zCJe8ptSXpqDhvuItG3fXEUxqlmdAoNWL5R/0J/ogp/cNG//x8KTiCh7Dhf0UH3SnKt9AuBsb9H/cd/2fzvf3cWB61pqHHEJFjPBuJ5CS5IEirXa8r2ZcQVFDrKrr6ow0zd90hxTceu8Y45e2ZO46vAAwcvIAznMHe07UpDLXrROjd+NYJ+bP/7UsSsAAtNaW9MJaXRbSErjYeo+N9H+Ml5fXZQjT0FILPhaBlpnqed/j879b/5/+zt7eSqDRAAEECNARXGSQibD7EcKzJo7G6j/FfvKvMVfaYKBh76b9sRdS8gFvmlt2PS19NZ+I41ehfIG5LQwmndheZ80YgJP+9/kxBIiSXURLECE58YgUx1TSElyr/oKDT4m5L+oCMUSgTPWDDpC0ieztRCFzbuvzzRq5OLfUkXvpGGbxVBXMV9SBUkcTeto6gPIjrmmnRP/Hn6UNM72Khz//tQxK8AC4Epa0w9R9GVIK2k9bcOfgUI5Z6nGme4QnqeVc1B5VSk8GDPN06cfLP/XQEIEVBlDGyRqiwhaaxoOmGkQ836sSK8xMmSvhJW6WYNKQqYGY8Xb+YQBnkbo+8YOmPAswDEaOSiczFUxc/ajEj6o8FPfF4VURX1svwoFsY6IyJ8GDOK2TXTxN/QAGAAAAOYAMrNUUIhl6KMTmF5s+twxGYE3HnjcannaGWU+UrQJ28QH7QrADlc2dqhqEoLTdAFK8r3yDuSZ4or1Qc/UP/7UsSrgAwRB19MvUuRXKDr6Yec+Kb+SfniLJELu6Hi5jzmWoA8l0XTryzf0AEYAJQRjYMBEASt9G3BzvgGak0GwFYs4XR86/KYvLoidu06BOB53KNdmj32an1Tg3RPtJPrTzc8truIwhbvpHO3N/UYErkpiliEWW5xqhqXacjXb8WiV6qKYh/q6wEy/M2Yk0neI1Tbn3nxqWYXLJDGo81i5E5hSOEYlTKZrOspbqzM/csBk47lvSx9WFmZQhfHGyhqoujjHZ3HgLvV54+N/0L///tSxK2AC3znWy09SeFsIOsplKpYoRb8e/ir+rflS39v0Jf4p2dnZ/JVACCjRIACcjwVaRpTUXY4EvflpKGoF0dgTKtWTABjvlS7Gc35hDWtirzxqD/3/M+LrOLnyB9G5Z6vy1/Iw2fShoUz3flv3C/S60YXt+M3a3aw1qd3/2/0dnZ0Btu22tkpKJQgbmLiXxMqJxUh+6VpdhG8pmYIEX5+YIhD5mMMvit/v1zsBMcq0V3A6Tvgm1bDja6oN9iELxrNoCvpof+okCYYNWkqCof/+1LEsAALoQdhTDFL0W2lLTWFnlQj9QbROSV9vyBer2f2f0dHb0ICIhQki61ABBXTH8HllDauvKYtKYBS9uyCGsE/RltwabxGxDk5c9fdfa4trmp9Ga6pQ001uVc66xByigit7IFlLzg2t84HxFJZ7UVX8qCtG1Al1LLyy1tWcDEbWRT578iM31f7f/9P//rb87/oE1VkEpK1wl067GndhdILAOIYuWEMSr0kb4+0B89f0iT8VecjAa0tQmyRrJBqxCm+dP5FTedSyoorO82Fkf/7UsSxgAtE5V+sPUfBeiCu9PEq1i6TeZBCt+b/pjBFMzKBPTaYmOrUEnSegYLrINusQIMiB1NDUyH1J//9D//nerp6KgEkU3Gi0XrKLGNQ8Hh9nRlMP2qC3qh7GLuhjFeUtzkzrocM9489TrQBNMrys6ccyBcB+a48J9X1bKN+hf9RnW2p36ig0SWXFVDxP0kXqCKFJqKGdb8fyAO/T/L/ynV/UAsFICEEObYu3ZSxoktXg/aENsdSusyq+s6JOtQONuWsCkeAwPLqDdIjY09k//tSxLMADaF5Y0w9q9GxLOyphjS6WVQxg8ShRlQ0vrZSltmUqLSvapohn/b+TpIiNncQydqAqHC7Obr/GJv9H//Tm5rlar8A4OYTVAWdEocCMzJffQimZX0s3EmTtVhC9SP54Rjp74rO7054pBjaKHnUPj/x7iB2VlHLrqBPohf7bO+Kv84qOV19/aUW6maxaFEKCTt4EEDqDMQYxF2QttQi9DJpUjgmidS7splJY3hC/bN5kDB9EKnq7UyspR6OPxPOLfX8aPu+T9Gupkt0EQf/+1LEpAAL9Qdvp6m1UWUg7SWHqP7exDVbXuen59vjIkcOL4s/a1ULAILcmDVxor0NPb+DWk2w+TyA9IPFSRU2h8GcqHSHJrsYoNrQ3UxEqP61OdTHqdticHBsTIZPSisPhsx2z/oP7+vqNOrW+Vf2X8z/p26q/ocPKAGLQEUndADjEyLcRaoXzoWjkOu65UCZqlcs6H7f3u2R6nTUF4Lpgg/rFQtV/2GOEXRPJmYGde/owzfm/mdHZu7iYCujsrdTiBJUPujtd4jkrf/YBNKQVf/7UsSlgAmxB3smGLExSySuaPSU+qcQBgnYOopkiXTl9Q1mU6UiWZcI+I5HdAdBXNKNkENju6M81SBL0B6Eeo9+ouBrTur0qhobv4kNW0ibeo/RVuRARna1b5Rv/0//t9X+cNAr3eKSSScGgW5UHkZLWT0pEcjUIVB4wutH4U/IP5hYfXm1iBuMvbH2gmnS0IuumwWnmNsIitsC7fWtlsFu95dk8r84xaag1G/b4uLfT9W+/1X9/qOc9qoI1BhQWglwaKWGuW5OjBjyG8OlAi2z//tSxLMACl1Jbuwk55lMIm4o8Z5iWn94CZie5sIa/Mkb/ltHBaFT0GpplzQHbPiXV2w7ptvlAadbKt6EPdHTmlQ5n9vlAZvoYevcz/87/9COsIQiiSQlGAbGzJOoWHbrKmatDrO8S0zZTlaFo36AH44y+P2QqIpdxp8fprW++ULVtnkrzlQR0OLPYFyaYWoIdNqdlcXB1q7Ht4rM+kz3Ql/9bijWMzv53RqqCa5+pVrHyZawl08uB2KpsaUE3B+WFdBPV9waP+lJ9aqtqZRcej7/+1LEvgAKWUtxJ5VRcVsprqj0Ke5W+djY2hpF1DnPmHuKkw58Q9qg+XdTD99Bn459RP5s/8v+/1Dn8rbyndp/I/tBAABQGAuCqYMIgYE/KsDpM1rQbGppBK7NChrG0Dhib7FbTvVFbd+1C0OGX94eU17znMoyYqMgP6XRAUPH0LHqErrV7u0/J2pP00Z6Oi/qd6un5Hk6ATRo3kVbTn8lKerQU8dKMV8LUPKnotrILpMoYhTK3qx0SxCzoc1SQIuqjNkaAXFA9lVdQxWnRqIxzP/7UsTHAApRS20npOnxYx8saZYpPMLkbutJ6PsBaYBQjOTC6C7+UmXXpq1K5USToWlOyliLf/6SlVhZpQBJTcoBNxMsPKOwHJ4NZvYaiSiWBR9Cg8sKoSS1n2+BXboqoBrIEjCTlqiDFV0d130MKDHZrMoYIfqxxRmVcTMH9vjSEs3kljfd5wMtII2JfRUbulSQWQRHK1q9gGCmuKqM2aIowAgcFgtMeEp5RktKM15jAgxKfjNurx0JRU2lgldHsC3ynMU7Z8YXv8GWybFiH7W7//tSxM8ACmkTcSew6/FRH2tZp51we5LdPegkzqEAxbHRsqcnhxwZ2ECRMjdEVFLHb4xeuvqgbA1AaytgjxHpir/Yai1Nc8NfuVoznEZptyKYdZt/ONaPC/TrT82RHGnOe5MCMxlVv0ukoi6//qX/4Q//s/+tCgnXpG4W0pC8cyjNZOJpLDzSp8FK5GEtGQp166lv5HJ1WfJ8nW5Q2L2JAajKqvkD88p0K/ddznrzIelm+eL6Cbsgk5FCWXrqSOG7qqSdI4TUtKpdv80//+X0evz/+1LE2QAL2KNcDL2HyU6W7SmGFSq/n04jpe/DsUCcNbjRbjbSpRksIg3CPLwT86m5GnQZMcppC7Z4uQnKhW69NRdMw5Nd5hz31/V65UtWmyzrps9fVy6yEyI8D3K2FiFzLhIOn1Fi1UU1rogSw9tppkJS20EVh2b6vrqqC5/6v6x9P/5bzvTp1ohmAEHBqLpSVL4VpAoqxY+2sy5MW9zYuw9bOXKQkyrcsDCid2w1HhTeEksK6LsmbiuGs72WNPOo739Pj4PWk2ibKFn2akeEef/7UsTdgAp5J20sJEnxPqBtqYYpGk3f72ay0qQSN/oopMn00yoCioU97/8cjf/+gWt//1nvUvnf2QCAFCIKCRLL11rgBj5ufBrlQpwX4fFitx1PBosl09F9t9M183MenaO031i1EThTFAywOx2s11hbC4SZdGELrEqaiUCmaufPzpMEYDiPGy/trdTMYhNEfvZT3mFQVbXt/8c/+v/MH/2/6v0VADOAAAJILT5zVkJTaUFRncR1YQ0eiam+ryuPCGxdlsMC8+VInLXbRn29suG9//tSxOmADHEnfaeNtLG1JO609jW+WY/npOl8QlW9zu01KWH8jdd9PnVz4j/J9WoaEqH2PMy2rSKgQlD9Xv1BcXv/7rx4f//JJv//WUPNVS++h6FiQOe6WWOOwkrGaylYdAwjpCOlEkRrE3H03k5u5po9gtousm2jJnsBRZ3FzNJrbdvO1/Gd6i/NcXrmw7QLRPjK1noiXyMFpqcK4WhTOv1/+Mr//zhh//9P//5X//9R7/RbX5z8hnUAIAAAUUtTK9TKlA4mnYsKqOApfeZtDFD/+1LE3wANZU1jrL2r4aUk7T2GNTy5y8r6sayZlm3MsxQyQJGpYhbcsRO7s91mSDr6zJqvo5xtRRZDylvrWaVbnH1PO5lB7G0ySfr/djw+hKHv7/zIStv/+skG/q/zApN/ZLvWcJcq3byoC0gAlJRsHIgBR0Hn/VDEI87D0RZ/ZbEqexRy+ZaF2RZHA9Da90WTFkU21Z2XZ7rzD/x9bpjH5RC578uWDsxjs15cCJNTqPdTeqfkwLSrXpnFekaol8LYjVoLSQ+7qF3/dD9Rs3+39f/7UsTSgA2RS1mtPa3BkS3vtPS3RhsqBqwItFOFAyN4yYRHBbMcZzA7YmsRS9ER8Hk/UE1MPELseIQ5205yN8uXbj1Df/DJRkr4NvfXNvcOVnW11EUvm7vZZgH8l0vqY+nZdkiSBZVzqGcQ+6owvW2h/zL1+ZACAAAFmmgVqJ9dWGVybafdsxq99M1RmJV4LzDfU2uwKUeQufpYBz0QRvkQ/18gGlaclMHEd9aA3DaBHf0EIj1Rccg3ETv/+Tf5ljIf+rR0O/IMLt93+EPvC76b//tSxMgADZVLV009rcGiKWupljYq3AqeWN9HlTSHj0G4UqUq8fufFzJ+nN39LoMHbQJOuhkKjuk3iJyjKgC3uUdY8W1accM07SH5UF531L36joTkfnl/1Amxyr0bohw3LTtPFwAQIAASADVsdSagbCkjjDQ1ULS5U9EmzDtb1+eIjmtWemBysyzpLvg6UluUndyWPZulmDtONptXReXj/5gRvzAUq/Weod1lynbjw1+Nh/9f8x/rf9M5//XOrX9v2ONVBr1FEAqJQL+UGc2BmuP/+1LEuwAL0QNfTTGr4WIc66mHoHicyyUm6OtBRSWFU0zHDCVFX0TXUV++ZN3egQoVro16xnTsYo6ups7t0Env5wg/lQIwi/UkX7+oeqCBfrQUPdleoKkaaKP/mHv7v7P4e7P6QGwAAAA7lBqhaKP7D2vv4VC8YBEP46DarlRlGYyI9X4Rj11quYIJymxiSWkJI60h2OlHuypmy5NTU60KRzX3KkfzMTH+l+sjkumXKVQ4P1hQo6Z7X/SPdvIf19fX/WoKW3OOJJpROkjiHkp5kP/7UsS9gApBB20MMOfxeK0rtZe0eC6Qk0C+LYbQfZblY/VmhMPIuYzXiT5I3qgJHtqP5fTNd3kCvyr3bC/iVqzC4V3Jwy/zEGt/qPfxsMEDFnaPf61BWJaHX/Ue6+r/b/J9vJ9ACSiRSIKTzlEoQdARxYlWo1Co0ZGOYZ7XVWE5T1QU2PAqK5gr0gVdiLkPIWxUdausSC+rWGRPX4bfjACiIqvc4X/1BczI+Sx/RGA6mYngN9Tsk2t/rJ7f/83/znZ09nDdAAB0gBGp0VqMVASJ//tSxMMAC6kFZUw9p9F4oOuphjS4W0rPF3Xm3aoSelFxDVrhuuPS4Pa9USBJi+JizEgDXfsX71kpZ2HBroFhYyDlIm68oXvswnEp6NQbgG3+S/UobN8/9QkfVv/HX/2f3/yIkAASAF0I2lr2KIaorKWtDaarU3RR5ZkUeA+MhLJMBWQgFgIBnd1SJKEB8shzRovG9UxfhrV8oSsQXETKkThI5+fwUkxLlXXCE8UrdyX88Q/YFdapRasKtWHecKyqU+a4uZ8gBtTjOFfDsms2NeH/+1LEwwALtQl5p62vsYAlLXT1NfpBo0mCPzi8sODkVY+r0E6ESKMQXzZ2Hj3W6ha/MVVKLsPOdUQILWcEZsXBRMZ0N92IP7gBAgFSUCaE4ckU1BsSzo4F0AaD7AZip9bszTSg/IsLZyLNH/0NA2I2wTx7h2tr3e9nUE/7Dujv9/SAJJmxgYeaQnMClwFV0Wk5vY0VVTUAQAAc2AAcD4HaOiAMR+G4fjmiB2XY0eTLDhWPhFPmKZ6mkjW7hM3T5WXNkxJlAVUTEsum9OZLfdZsjv/7UsTCAgs1BV9MsOnBRRDr5YYloHU/0bR/p9/V/aKMDwqgoGZAwTQXe+7uQy0rhKSSTgVCehCAyLz4cICyMaF9Zxg57sshhXzyhUH1y/1T/DlQzQ5L8f3/SsT/q3Pqc3KWNn8UyulLHOskvyZNtzn3/LnDT6gzH1YWc82pyUrVKESUknKXU7pDINctEc/JwJOnwlmwMlkUuNx0q16r1kKuJryvBfvjWfz1zkqrpsg1FHyqqWioqK8eisZlujsPUHhZ0YGnMIDkZWa0rPJZiAoo//tSxMqACfirdyewp/E2mO2cxIminIAgAAKb3R5RFZiugeEjrCiurN2DyAOBREW4TGgbdggP40JUsg3qDrwfPXBgLvUPhGr9p8AT6L8KV5z8srrFb2JZ+bLWkpyq2ypelPh/Lz7MmZWv/hiFQyZnrxwZARNvkjLjMv0qW2SQmpMJ0xnITkik+TM7DKLcIJmRkUvICjf0DmL1el57rlZRk7VpAE2Lo2TV9NX70esmpGUzSi89EgSIz63lqaIFW1I95QRse+OSnXrV4jJnhYKNFjD/+1LE2YAKVQNm57CtAUqk76jEjK7zICTSb5aTSKbofaiMA5Ue15SpBD/XquKIW1U/TH/LxhRpZEzhiZBP2Y+/5ME8V2JCyqUHyvUP41u5lBHcg7P11f/qZIAato1V2FX+ymV2L3T1W1B5pV8VJo+l9uJijf17qgECXbmWjRVABAlGJjaEhEFSCmDTlPSZ9msv1AEch2zVVtalepJDYcXLx7PEuJVJfvmmgc5VWS1Ys4bPQ/HsTkNODq6H2NdVL4n7t9VZRus7VG1XL76p6bTP/v/7UsTkgApUk27npGfRjySsXYSNKEqkcN/30T9I5NFFNJpuHYtxC/mWTFQOoQDnTxkHy4uZUj+UNMR1Nu3w3yZzTdBHnF1WKg+x6lHOUh1LI7u5wXpZrrRT1HFhiFJRn22c9SB0+xvsdqi0Slbzi9F5/UlOfqa26ITf3/RVP00o2AXx6E4PkvheqB3HPAPVWyDAVHh50YYKjLZN+1lLxN5SQoQSKN9cBnxhk+WWzirKPYe23nmmha10231N/9HUammfbtOvuj2c9z5t7NnseebV//tSxOcACySzbOekqZF4pK8o9JXmGKK+ebblW4qkAIQASSnKCIK+WAEp0iGgJHpImkcSFo1KpZcpZKqJ/NoobwXsS6UiuMCjF0BYw4M1C8pTNeCBnc/WpPrnFB//3Cd8HP/5dio4Ua9tInJtc5YqW9AFDakCkoMeBUaVQCCkk5QQsFhRlL4vjL0fImZAxuoQCSnVJz9X8KyPWoxWT8aO6KFx/c5nZXbqYVUxwBZpibEG+ReIIjXBlc19yWeOjv64iuI0/Nzz1tjTVS0uYF8QdTz/+1LE6QAMNSVcbCzywX4oLqj0qL7UipjsuIWtJSRScBpnAnBwkQnhlSpRLGSWyYPXVCbDIHCrnZoEzXnCS4Hk2SgzKb04fUja1RGLc1BvIbKVAslDTv6iTduc21B/ORkv9h5efNbZEG9lMVWalyhrNP857L9GfRCUhSnXVQASlKDdF23SAbj4R7DSlhgxQ4RDVAM833UqgGcdOBTTNmo0v1KjKuDdahdFfSj1YuYp2MRm96iOXox8VGIuYCliIw2rdGF5e3F72Z0IPZX/LfT8qf/7UsTmAAuZQ2jHpOvxcxlsKYeM8n//L/7e//5U8Rb4JIAcNKjEIgB+Rmdg0JZUqVxy1bnJ83DPUtgoSEbSDlSHnOFHp8PY1+8eYg3fWMJOq2Cdc8+cIFyp6UCnfSrXrEt7ceOvk7PeYS/Q/Xv9C/7v/1oABBuA15DULwJtgA8ZGgoDnKbhDjC5BDju15pPNY/CUbsVGjZU/IVVxituw3ZTmvfMFto1tYfqyo0M2xuF74NzzZAmuaWhUDls59Zkuawir1/u4jrRvRyGFMyKqCJf//tSxOcAC1TPYuwxB5GKqW3o9Kl3f6D/T8zf/l/b4V9QCKbXBoaqNsQXowuHxzESbZhi/sWOu/TwfVWdfqo7QbUpGkWdsRK7NH78v84N8vS2oaxVtbUBD6ZP4BnoZrpQAkzMotzbAqGrvj7LqgGPutfyf/9//1/38udq1vlXAFUYaZcA6FukMgv05RLC2jSbMiaWZY8hrViEph3hRbrh1WjHqre5fMm+2G3fefRds0bcbGC56wxQcWDS+nnxYT6lXt/MNogRBdwyUb6p0juMpSf/+1LE5gMLkUtYbD1HwVSfK0mXqWg6fUF/+o/0bpCj/QHpja0YjaMFAHVoBRScoDVgxDwEaEDqSNlXztjKSMveSQ1qQBvQrLHcCasm5G+6KeEwMzUCcUEER6hGMACPBb+AXTvcFlXSSXf8wNOmKmEvj5DNTTVXrQF/2uomZTyY7UjBRl77HqY13RZavaCtLwAE7diUZhWLHZwXJZIzdFwUyei4WUzHkW58Fm+QtEqyZKIBY2Hh0Vh9YLiIKyEwUMRiFIqLEmr4CYD2DZgLrRFRHP/7UsTrAw01S1ZsLFcBdalrTYYeKGCjCx1uCafghJ+ucEgYC7BsUCMmKmiMCwoqT/SCKx5c4YmfPNGkDIJt2T4kaQGCdgoLCuTcmRXqDIWusnK5ZN6UabCgfJiU0fdOETSlgSgnWMFQs2v0gAAN3K3hWAVAiOnu16Aom3X6CJyGvYOXRzUvPrGyqaYSgoWkIfIGyo5VfLF2Vn/fzKdp5grZTMLl7q3ltc1vVZ8wYZzZUR8yUU4ixuokVnU1mbcfUa1iorlvVMv7fqvHnTqtf21V//tSxOWCDQ1LaSesXHGSKayc9BY6b+sQAAAKuywJMZ2EW35jT8RsH5kviww4/sX3NhNG+RTpFmzuOn8VEiojE1IsKKODRAMAFg2yHR6pW8R9tqFZ9jbJf/0Y9u16VJa9X7+8JJiWhj+UnNcT6AAAgAAJTvFDIQNQTXzfxxo0J8RklGx2ZluxDM2kNQo5X0Lc4bf558tk90pRjNAzCTUKxPmK5kZeUIEKJ8v+8+mdW/+mXofyCYujR+nwM12qKaMA0N/elCFp5lkQSQVCTj1o8kz/+1LE3QMTBTlkbD0jgZ+lrQ2GFbjASpRsp2pYLmAiKEx7A+L/WFvX7k6CG0JjWGP+l1S5fkMmMjuX2Gz7hmIkZIOgsoJxW28tWntHRrVq/GJPzL62xJzHeS0LLPpSISSCIKKcB+hxClBpMx8IepjSOhGHcfTMwgS2hBqbCq+Rjcfz7Jhw9lc1UoeqVuUV2NeqkhTpUQ4FBtijNTNTmOPC3sClgRYn8eabUpUgAAuhlIgKrAnkq1QxGtRWMt42yqDNRQNVS2R1AMcB8jjygqsuWv/7UsS7AArBH2zsMEfBXxvtqYYM+MuYDSJua+32pT62UgP3HLGf7u2TUxj4QZuqPPSrWY0AYxRRHR6v6nOm8gk8sZU1SASQVA2DcqZaWSQ6l5vZVKuo6QkQlbU6tzMyBBQhJZzyCpQnumEeZ/R2dSICoM2V53jZ7eDIZcdYWiMJkz6cqne6MPj/8cvWpOzzxY/R6GoZUQEii3bg6zlNc6yw0Jsp2tzXT5pZ4gCXIftIFltm7sU6Hu55HDkhs/u9yuU5CK8/yt/cRoV2ZGZqyUBb//tSxMIACpyVe0ekabExkW4o9ImidKW9biHYUdMhXMj//RRWZo1N5Ugv+ggFKTcATr3bk5zLpQ5bkStj7tx+JLpp36lcMAqUBgJgSFRYahWMEPPJua72sU7JnVlfg25m2qVmJXSZkXNR7TDY61LWoWMJYGQpiDiLW/5L+ija4XqFNyJRuSXSWSzZ7X+gYTskEt2HlC36h9+4+t9JKLMIZg/sxGLY0kcQJcGqYgExrHwg0h0DoDwTy0oJImEEVDueCIskZnj5vTShJxqQjUG2Y3D/+1LEzwAKUH1ibDDOgUiSrqjxJi7DnJia65wpDwjZMOHDdJpVcQcSylB2xlRGo2Tz4bWm2DKplFIdBy6N3nJfDfmW5z+rdNUu+2mhzZW/qGf/////////0aHMQYfAgEAAAAWoNeSFjwGKIlHgCg5Er9WoaDOMRBy1TLY+zVTtc7Rx+lU3GWebCd6Zel3Z0OOg/XRGUauVC2qNiYFi0KK4LKLO2DadqZHs7607eryjMnLBPHhRm1+6eqCNiSdGs0JvgbcW3TU7fVz57T4/1C7yNP/7UsTagAppKXNHmE0RURLsjrKAAHhzYlx/au6/cWuc4/8W/7XCr9fVvj0zX519e19b//8HZL8lIwCAArsZQIBX+Vqd28xbKJO3BNHD87Tzkv4DWHCIGHohVUTOYUOUSYp7iQ12z5pUOTyveuq9c3rVGt/fMOF5/7/fSWenZXkY6D/utccOBqX5T+31gAAl2lSNmjSGXrqjLToi0gkA3Nk6cNbeop8l9dLcSOcghK/27ETTChuFanUdXR5KMcCg/M5l9Qy1v2FPXG8/4GUxu9Ff//tSxOSAEymDgbmFgBJaqGwbNPAAArquyNXXMB2jobpZfWoAAzGYyaZdL/JatrBVqhaewalllWLtzjXw3QWpsatdixsEkMEF2ck0bTFEdz+Unb+tfdvFeixmxPbfiACbNyzVEkvraZaXLOrw/uSvDwvbX//9IKeM5AMCAQWVQAvGTBOFQHEpWQ1B7N6LFTCZnzeej863KhYeanDiobNIq/mR6dZ0uhBXEmrCpiGCPGpnHh0H086/yNrAlVSQBKDac/5L+j//1Q1FGmmkUkkqBZ3/+1LEqoAKhRlq/YKAAUkZrM2WDPgwHQcS2FAkFg6HMvLR/q4pueqsL9I/mpEykuWMro28bye43QJc+V2acWZIUJ/fVi8+i9jXmo7HblcnLvqyW/fLf/ixNrPfcAjSygAuJ+GQhravIYxmZpKLhcLay1IYq1K5z5ZI2IvPktKPp4GfpAhuHRZ8KJeNO+wuzG38OWeMH+zcIP7+j8jpkEvI/UdndfYdnM/XtT0/SdLqAQAAC3uM+oRqXsxZCuVqaP8DrdJ54bLoH1RwZP69XnnBrP/7UsS1A4pMr2BMmRFBRhXrzaegeKufjFUuo+25gkXyYxNdBKdsKnu2/nK2OHNz30FBb285tUfnjuRlHVaP4mHyXfU9vOkNKoOKCAncRCJjiIoCBC3ltHKo3BFtij1OoGmUzYsOJBKEJu0WdpMcn0Vs3WuCHdQ8KTspTA6K5zlstjT/c7aptmFV7In32tsW+S3yyJGr6QBAAPg75e6XLdGjr1a8rW3fNn3EShe13wPbB79PdBlenEPWzgcnlDMhZOhFhYDMgxU3vCzhekSjNaEv//tSxMEAChTbfaYI9PFLIO3k8ZaO0v//vkZQ7yffrZeLGFU39RUOnQkK6PrMiAMqFgNMWg9aHIUKHC4xR1p+ivfagIbCOYY2QMUSBtO0JcyZKPhY//HvEvZ9xW8JSTxlnhwInb3dPcHcIzy6MqEV70Kf/IocW/ScygDw+GOX+moFJxuNJJFJ2kZjpuVdqNmJEYh2k/RIaCnWoDjzLgfVWC6wFVWnuVlWk0PC97iyENKh5DDolARy7czIUpNFh/g19itud7SpZ+WJWf6AAIQKAA//+1LEzQKKVNti7LDpQUGWa4WXrPB/DQGOcBbVYYJNSAqgjS0vwUe4sm0gjdMbTl8vH9dY+VYZxEygAHkNYQEnRoxmXEGbMIn8a5UYgSJRqv6tp/UOCosTrIWuTIpIgcif5nFJt/2ks7L1zYq7c8IDzk8e+cLVKrqFNEBJQKAxDxJwhZumKhk5lnK+SiJw0PoEX5dfGJJ4fxB1XF6H22UrqjeyxgaQ46lO47NwXuR3KjghG7v8Hf38wcGGZ7f6gwT0o90n7yBtqaT2g1D2fN22kv/7UsTZgIpk8WTMMGsBSJztJPQJ+PqEJE30uX0kAAAAjlB1RSQxdYSEPu0xZzETtPKZcncxQm7B4ysSpeQVpFVPK1xVxq78BoZHOiD3YpAAelhF3EsSMyrCRCPMHhXeV/K/zdGRbaKr4irk3o1AGGDusL/Mddn2Ct4AEDGQAYnQL/TJhP47EAOoy10mXTs081+9A1mq49eMS+tVt0laKb2moSisdSIKk5mqnk/XBrPfkWIw3Cw+xM5auUb9LK8Ifp8pUOjFY4pMFMpXs/h1/kfk//tSxOSACXBNeaekytGXnqyo8qaovp/zJAALShkSFwokMxdmBb0AAsWgcGg1HFOfJTgSvwjWYKCy63MAnzot/kNGPyVU1FXVp5LV1IRvP15dCMv/XGQ/f29RDbKjVHrE4Tyjj+509JhEXb/X/9S3/zP/oTJ+An1IT6YkAABBK4i1GZHM1VlcpWJua51jIawbTJrwRXdyp0WGYzcOZgll5affo8f52/c4msX4dX/Mx7537jX/7eo8FGtdmFc8agaTPQcz38k//NI/P2xt9/ip//z/+1LE6YAMTPd1R4kY8XIeq92XlPjv2/aU9nQDGAMqBc/wQoNKk1RLvaZAL4SdXqtIGL5bgOL4ozDzY+qZeWmvmxfZ7HFHfEjgs6u9SRuqrhx40XKCD94U/jXNcgiCsrdlZIc/+J/K/Ua6/9HEdEymzE7emRlavuM4ZTDFCjTjKchKSSos8h7H4QIvJ5m+p1gwD3IQ6and0Sg94v6Q9xJPUnXZDxevRbD/ENl8DnzxmjzPvGN6gRhohE2NJVn5j3on6A5a0dmRBUWY3buJHrtrfv/7UsToAgts919MpLSBhassDYYo+v9TfiHI2+Xf1mgKAMmwBYkHLA1PFtXPWPL9wTV8XzI3Uy528L5eA1x4g6vTwxf8RN3TiFxC0Tv+UTvC+vd4EIAEO6Vx48Qg4uFUF6Ff0z7AsPTgnRAFwIAwXAhdEkNPsDH9KhWVFJAJKlGDMCW0zaDI639HJXdB8oeKrGsGBSdqYKCUkIzxSB0NGeYXUXEKZHKJu8pUZkrYrVNRIJx9HQxvejTlYhf+vXp0/yJVpf6f832Qv+39RxizKUS6//tSxOeAC6T1Wu0w8UGCKCwph5U4lFUoQ42pWuQCiUlJQuJHlczW9Pauh/4rArgNeeyQxOT3cJZky0rk+Ocp2J1NIWi3oGnldPMHWM/nZe/AwwwtzjY86FVguTuU7Jdk6fDcsJEIJzRVZdDZCjnMqOefmpImCDadDwmk3EiCCSUob7AZxe1WbY5HiEST8hmIhEkXlV53oliGezqU736vCF6hC9NZC71Hn/LDiwsVTweT3XOi3IiaH81PzdHEvURBfS5bNalSr6GLHaHXZF2bPBr/+1LE5oALvPV3p7C2MWYgbZzxmnhDtpY1UAAEpuFPln16semG6BhENRbKnD9cRgyqhEs0sFjexWtylYTKdTnsuQUQVA87Wyu/rJXLVSFU7W6VZuNYUMEKhE9Yu8ah0VJFmCrn9KNfbhxOsyd2wD/CZktVLOa0JIot0kB1HWN5Plob80Q/7otYanKi7VTEAIXAcn3BtYvWcIsVT6yNWfsiJHKgnlq1w97mosIEiYuP/kKPJ8FEksoy/kxnL9f0yy/PjtZYGHCqwfjVz3feqPPPhP/7UMTogAvZW29MJEmReRHuaYMN4oCjxr90MmkiICgSSoOih1eS0Iw/bowqCXDitDJpVq/E55o76kT+ezXJief1Opay6iYj2SpswWL/KfyILra0jJNVJaxo9RyvKQ98etdyO2xVM3svhXCbK2Pq7p62KFzTq1sfJ6AmGFUYkgEEwAXhcE1KkP1kIAtqxDgh8Yl1bQhmb+A52RI9bHe8krsXBHPLZ+B/7uThQ5JD2gBZ+oSVVI8GnTy9dRAMuyIYUPTjonVMw4rVndRj/8eLfXr/+1LE54ALlM17p7BnsWURbE2HmLgqmt9v3+v05LLB0kDdbkkEJ9bcSiE3JSC5fN6W9YE1lQ6QSp0HyoLX7uIdnuBedOLS01rjM0oqmV1Lph/pV3cg/MCH8b/QHnXJZ1QsCZzPoW3qNSSZt+9Df26zxbfIsUmFzfRrfpH+12URLu9pJJIJ0viqT0Un5by/k1YD0btJyxjpBXNA5lHmoWorx8WUK7g3fC65+QyueEjyLTQ8x15BEWqBuZQw4znGISMVl/3/5mpa8+n67LqrpPdTlv/7UsTqgAx9BXVHoG/xfB8tqYaV/noRLkX9EsWktgjBOdCOpOKvB/v2QI6SgSSSVBOoTJIXxtSNE/PJItRqaX74nGeMsb3JfC+g9Rgnf+xX5fg5HmJgLd/usaq1LC7LLJdR1xqUWKFDRFFSxhxJhyoJSHNK6qEYb3JsSNi506Qc1fV1rFqM2L1QWFRh45uJqLW/7W4LNOkqpoiZ08oFXQMbYWUCADAaYvFd72UMVd2B0A/PUh+PcLR66w+DxMLBMRXXlcnlwxPzDD9g/DwoAceE//tSxOcADP1PaUew6fFgH2zdhh06YbRICjJur3F9I0nBcmPI041n3wvbYxdbNUOo0EYOkgXphiz6aOiTZhh3R/QAzFciGAC5uCqkuE50y6UDtgxJ5+fafWG4cq1jmFdapyf6NnrL3feZ4myAjKBax/8k6pbf//57dtVRSlEDMWQRKu96UmwEiSlBLfxK0tK53QoUrSSQQCVBcC7lRBJhkQvHQ3dKYKEoRnoGeCGCgaIZgmmHo0M/NiJx3nw/UN34X8p0iQ8i8n6UOOeX//217w//+1LE5QAM0T13R7Dm+eQwLqjzIZ9QyqWyHRrfOWNfNXpZ/iA0jMdv6QoAABzcGvQzz2CqEwKz0SeUWikXR8JRUaQyHHzYCkV5/LJliWMYgE00MYGBsNUiVSVoWct+dy4nC/z3PBPipptV0Iix6wimghickylT1EeEdaOqBajbMRSSScx8nKhj4v5FIaaR2mQeqlwuUzVrSOvRf61DWUyq+Nh201d4EObVlNRCMlJLGxQPNEhV1flPZTb+39ARVSs/5/q7H0iBZSE7A0eO/W+/U//7UsTTAAtEtWKsMSfBQRYt9YYM+PfcGDj3pcSCIQEEkpy1PQM867d6q5IcS4aU9EBxNHEHOmMuxoBGo980JcIp+SzCWy847o3KGspnoRl8VSj0H3V3m6S9/TZqIMmq6Nb3OB27NOYh/9LomlDE6I+iZzVbT9Xm+35r/Xe1y3/RQAAAArMMCRoqNMY6r1RwHRYDPvAscnCYnohimKCIAI8pKxm5dQM6IpVK1spO20RqqKDhrKYUxeZncjtB9qoIW1/0f6fuHH+/79ba7Rg3Z3f///tSxNuACmDdcUewYzFLGaxdhgzwyn8+HU00Y0ok1Hj2qOoeQTgaMIeZdlEkIa3DVkkyHfYfetyGOp5O9Sup/KjkAr5oGQ+25ELTrMzPk8nZ/mdwQ4W3avJDD6kdH+iU9vxvnuk6KYYtTqmq9//6fp+4sjrQmmxBZjTxF+oom2imiinQYcUXiGnVZvRx74Yoq2wrayn0S500rB+9KjknGsapc+2eXAe6JkIvSZWdKsSkQxgZHNswK/o9OGH/engat7/n7ytT1b17+X/+v639VKr/+1LE5oALiQV7p5iw8Y6vrOmEnXr1drkFFVgzA4pVIISiAMpOOgC0QI80LQ5pby8KTRxngmz2eQ5WF3exvABkA5Uj57l9+AOEAngpxA8jztrWOlS8I3dt3+Yf+345fZv2dbRrtbtPZ//LhP7j6ULqEIJKCBJKSkrEGGfh3KiduQKTeKGjSp9rcqtfeqTaIe2Ijtrh3W3iegbf4m5/ERE77hwMDcEggCSh3Fvfd4gAIJAM4hdd0267uaf/7ohBD4YQxueTBybRG57u+9mZZ4Phcf/7UsTkgAp9BV7sMKuBky9vdPSJvyBgp+whhghRdL99gJhgAAAC0AiACEX4ILbyx3n7dyH7GhOhegiZjDQAkQsTILkdktiz9mscenHPGMkOLGcyIKAiQZjcYVSVL/1XTpiQ6oDIoBCoZOrKts365Z69bvqqDaVTSJSJJSh5F5IKfwolQpziJOeRODmDo1RHQpdsiJoll1jd+zj2iyC1Z50V7M62dkqi0Jfdzsu9NVBxwSjuc+t+0DMIYUPKrDLwG5dJ0+1QtgmF7If+FtQTYM7H//tSxOYAC819dUesUTE/nq1o8ZYiLkikwsQAAACUwgjGA2XNZU0jD6yxWAv2LGBmW0SailJZauKUX3IA8UbiW5UEBLJkVEuU1UUzFLM5FMpslTEvl0q02Csp384mfR0Jr5df0tT+3ulL+p3rt5PysDKys81U+MJqdFU6EpBRBcR8IohKtDRORIFItn3FbGlF7P1cKm9HbAM72CFLT9pJOhIpuRd66q4ZntxjStfFhEWPLL3bS6DvmedDHIysi7uy5PtcBB0p9rKnRo1SGSCCNfH/+1LE7IANtSlvp4zT0UaXLOWUjTjqRozigo5L3IKma4wkskQDUFKH4qDKQgzDrQBTPzASysck8uHKXUWI9ZIr1dnXCte+sRtK5HqZ+7cYTk9Q1/TUtbMlRUt9bKWO8sf8klpm6i1J3GME76Z5FJmVyM7IDvRqr/SUDlmW2n+Nf/+IAK1ibhQsNcYmjSoXAFWURcR0Yatt83SsPE9ThPdRPgWge9nDYx9cdRRTlAZZLRfrFvBS4ns+o9PEj235u/dQTmsx6YXZmr7BiLCGfZzlKv/7UsTqgAwo03mnpEsxf6/sXZYJKEZtheBE/bNGnsbUVKvpvShp84BEmOmHMxiJbNx6Kf83/I3T6EuSjcoLeWKABSMMPWJuoqCYABhDzwW7jJJa01D5Dw/1AcT85m6NlXnbNTrxePrS523Y0JsnE23tiMeMTiUV6nesWCUyPPTYdrso32QMTzfsfQepS7A5GevdRKpL2U5kJ6hXX2bspaYXpJvomfv0z///0P6ySbrvNn4sDbyaiyZiCBAIWNTtNkoAxN5BkCPDmEr9GRycEPkI//tSxOeAC/EnbyegsPG6pO4o9pceBy2UrvQB7n4A0LD8/SpjzZawybbjtauan0hKYjjEYjgooHA5s1xW+fxN0rEiLOKSwUg7i2InQ4iEfN+e6586RABzm+hf5mCr//1HG//9i/9G/y/7Stec98IiGExnGN6mSEkwyTqFobMNaFCVBYkrJOKoRBngrseL1KLpqVe8pEk+4tG9npeVPIXGYmg+l582HbDxGlh61MPlBRFKwpVq9B7MLQu2Uuwzlt1K6KdS1ugiTQnyf0EyWNF0zxn/+1LE3gAN0V1pLDFL8eUt602ntXLOAyIq1put3r1Ym/1alet5z/v/t+hOIdbppm8MCr1Z3F4QBWMFnC4lEZMWlXNCWLjoR0XsVkeV05Tf5Oqx43Mw+PemdEEbnLWhNMlFKCUnDpLRsq4fRwnn2govkwobHblmytf3Vv4VZ82ybQ5NFQjU3bOIINYaqsLkATMYdusapTLY1xohXUUmsxZrTC3t9X/qcqX38HKAoVD0BIYaFQSgIx8yACAYSAwik4JIRWabRqCuM8l9stKiEw1Krv/7UsTIAw4tXVRtPU3CDa4rDae1uEAlnwlafMHcTbXMjgInn69Q57D6SEeDW45h+FxPc0kDFf2MEI/EjkofxuofZ49C+C8sI22dUYZTWYXYI5rygSxYiSGn0AmQKDRxIUbofSJ7tdUJNxAAAVsAqAlSSQiOZB+Nim3DNI6GxMGtChL2WvNboUDb05IRfblu4ziVMkje46UvJWg67V7ZXRuj7FASKzGRjf//X9MBBQGyoSCazr2EspkYsTKiABJLjpKZmb9v+zukSCwHye0HYDE6//tSxKuAED1LWk0tEdGpF6z1hiU4I0o2opGomVHaz0KwaJHRKkdmvUGqqJYpDeruDdp0ZGkLPdLaS3v/SiKvWCNuqMwwfKi+58UOHP/73+TVC/VgEkEqQjQ6ElhUluVqEnKTZXJMIzodpVGlivUXM0wzJH6j2NXgDxq9VFxNfMVDWy3xdV9QL2l9zPIjm1z9rEf/rqxlzUrP9/POl9reNTu9Wv/+oBaBEIg5t76tFWUqmspwsvpN/F///BCPQsFElJ2IPjSG5TLIVlLxh1ibfGj/+1LEkwAKVPFtR6RNgUqbremGCLqkMaNGcmy9x4yVfUDM4dFIkEaSsgwNV2wKhu1OkQ+0NLohDPbQkpmq8jGqmPToD6oy7oaYZ/on9qf8X+tH6fvE4dIyFtmOH7JP6xEE3Wx+/+o/AmKgUAbEK1MUtHOf99GY/DMKbVwIT31/U+ULy6H1zJtTJwnKP1Vjs2YfDe+zTXK5r1LLL+T/c9SgeHNfmmAjLt71Rv7wv+6bopvzZwiCbdZxyZ31YiBoLPo+pZzHrR4tGvrsxG/+oy9VWf/7UsSeAA1dc3lHpQrxnK5tqYYpOkAwABAtOzQw08v0YVA5yjJdiGXAZMw5prdFuPrPoxrn1O4+mLonDrUofpwxYFrp7EXEUr6+2dxq+Xe6blhN8KewsEWqxNU1pohazRDUvUB1D0da1ekQ0OyNieKiClumkjNh4un+oSYoJ2U26m/ZMyErMz60mrQepv1jhWq3zB/+XfWqRJKSkFRz7ABkSC7HUNHqut68SI7dmrOhSO/dybIZL5XGA8RG75oehDihjNR1t9MwiNA8ojk5O8S2//tSxJMADVFzbSwxT3IGrmupp7W4w8KS1YO2iBmqSHDA779//UsKE2pj/F5RJATTpGqmO2L4rraprpFwHa1a6Cmckm+tSwS5r127f50YY1nSTZM3SWUkjiC9kDgMRoirUmtyXP/3UJ0bO3bL6f1VlxweCBaZaTtAGER0vl/SdciJj1KmYSza1AtvFu1PjCojIWflj3AnlLsgIKPnHegrRsECI+0SXUkNhmPgpadOYvf7yR+fSn055iA+sXkm+M3bRGG3TVhmTOzfOFPt6p+zh8P/+1LEeoASmZ1abL2v0h6zrKmHqfq7z0Tb/UEERJCYWNNIUMIJMioYUaC2EA6c2yVHV/ZR6T/opUv/QZGVAgQRJpJqUQxO5YYu06eXRTv7QupXgWZuK31j6QdZ4llRuvyf7K2SZMGSTwCqR0tZe0Q8ddR8Qm+55OsRHoOil5Yvu8K5PRdjTxcOqrzGoMWT5qlxq9MxHjx2t8Sk///iCE92Y1jazzEXXGIad3rIyi0RHzFHW+cxCYy25xGgAqEJBVSCS3DaEYUzOrFpoWGKI0Shhf/7UsRKAA+1nWVMvU3Rtamt9PMhdFJbGuE73532zyIersDDRqxQ+iCDy7+yV0HgoiUG6eHd3eya4r/xgnowhEThRQUTe/8rRPm/h3Fz655Yd96Iif/7/JYjOee+73vcvFveNMp+hxRT5PyXkgduUJIJJcBhh5SNWVHk5cIa4N9IiA0QnoGI01IoODRectSLNJ/FVgINDeLZ8YvwEoZzSMPtm3GOCSY4cNTI54Cog2xES9wif//k1JDXxxVNQ0S9gSiUaRWQGyBqkqoy+kBDVuRP//tSxDKACmy7b0eka1FHFa8w8Ynun3DYV/THabxqBOCi/GQmFkJT4cXnQVxopzPabBrtU7a661UXY+thgTmrBA5qOupAHtdlrQGTtpSoWeqAxyP6DaoEQvoAEEktbkD043TiovK5FbSiSVB5PUg/pTjbY0TFv29hpwpBfZ6Jj+Xq4uW52ZJR2uALkVi8QAR4ZyTkF5oKz/8u/8q6MbZkm8XYS60PJpqsAoxgEEA65aBSJnEDvyygSGyAhBhU8RYmOeUWicdbYTpf2y45mMObuon/+1LEPYAKQIVrrDBDwU4mbOmEnLinNXSYNq33q5yrymp7frKFf+3r9Tf/Y2PM3gIGSG/or0U1N1KGfT539i6qI74RSAbCEHkONWOBwmgrj/VaATrMp1OkEWL6pCX/h3/0aLxn9WzIdQM3DfX9+TmWt9+tgmgfMovF7vob3A2Tvt7nt9WxO9fznv2hRF31/P816w8Cwn6ujnJ+aUJ/+UoK89rAmoABlpK8R1IaMRsP0kndhJgWXzMSjRecDvFfqA4fu2XoVp6yl6bbxQtNqETjwv/7UsRIgAxJc3EnpU3xmLAsaZYo+Ai6cUcqJc0y028Dhs5lesJ46dumh4A0FbIvZXFzf7Dn/mf8oX/9/bNkQfJ//+co2/7ttl62SsM1EqmkhJFFwP4HQaTCllYSFDTnMZsP9nXTc/R3Rk+BMRi80owI0SjKyty7rjxJUItipmaDZ1pOlLUExCAeJ5S9dlB3JSqttUOg8v+s9/rHn/1N/1P/1/6lLI3V9pL16H09QEcmERssqgnodVscM30x31vxCGIFl4lwuVHSJRLoXr/qmuaz//tSxEIADA0zaUetr1FzG2xphjV4rsx5XqXrO9YB+URtp2f/ogaGM0QTdE1OhRD3SRMnostgwkBlov3UHYoP/nU3/qGR6vkfW/yX/Qn1qhAACDb67BkJByKqVTqxp+2kM7iTmr8YJbmkZmNpzvHlU6vvFXWoudTblcZ8w28Vy8abbbbFPVS0dDXOmisEb6eoem3TRZKAuHLfoQP/xbf/v/0L+t/kv/SApAADg+MfHnpFSJMWEkmgPg2WJkpnB+pdsHoXKDg0QEiOOzXg2vd7DhX/+1LEQQALBQdarT1LwXaWLKWHpAjKqP2e+37coRxup2P6oqTOXdbYhGB1qKKUblQCulNXWKHtfBY/v37xYPPjBZpl3CrH9Pa6IEFqgUSxD8jLIHlAEAIFBQw5aE23I4UyTiFAXIyiBosmQ2gAEFkIS2T97EEex2ULJw+oaavqJ0AAAnGHyWT33mNzv/vy78P4w94fGgF4nB+x/e4NyNtklJFKWmAY5ORA0yKARJgJmEnEksigO0ZKEgSOKjh2Qxrm1KIIU1QKssXs7TO1K3/qYf/7UsREAApgzWYMJMXBPxHvtPYNGs/okh9NZ51zpgwFCx768UBnihE6gt52rCTPrgwAAAAsB2wzg5tdTkspc7MqGoYpKhJCU3uWnKohJ25quMuIimWCHXjYAkmvNvvLiSBgKMLFmL1+3Wz1s4nw2ecFmRcICr7YGcDjbA5Rk2B9rHUBBIAS5SyxYJcZbUbi49MHiJUTTAMheuvyiNyu9Wkmw4HTbYwfWwKf5ilP2BpMDR2W9GrPWH2zQrDOz8h8eYMvurCVGNdg2ZoM5O/qnO5u//tSxFCAikyPaSywx8FGFa1phIz4muXTFq5QIpFt0bIxDwzObridJ8I9PLhkOdQsWkw54gzlRM8LSxMDcDQjmXjgj7DrJejHYirkcuFOZ0qn26/zmrYpdEXc093aM4S/z//y5kPb1ami1gJAAAtJhGkUPDLbSGA45LpJI3HlCoyR1pQiWealyeG5B79pZu0b2ShmkMLtuZnftq0v6lf8235boUCIJKxHVzGRyGHjQ5BQH78O/rOf76yrlAACM1iSNHN7pbG2Qvwx8vD+lRm410j/+1LEXIAKRPV5R4yxUUMcrZ2ElWhD/h96ynG4F/5ayau2/S46BrhQ7KREcpWqqPUG8r9eEYnt//6h8wZ7Bd3DGM5QdBeJ96/1//u/0SgIBMSbAx67F4Iijc2uutHqMTjswOQOQhI+aywZxUGB5ru7DSkP+S+2HfOMrMYe0RUrnCcvm5rvcQKVP0/OV/9hQeezqapI49hEKEj3JuYh+ERH7///Jf/hyr/0VQQkqViAE4zKF2YHcVbjBHomH2f2YmGw2Gmx1+6mOd+un3DYq92HFP/7UsRpAwnc92hssEfBbSUszYYdOlkvhAe3NuY0Nl//aTL4chFtHGnLhgTkVf27auR/9Y5DK1a6q8x2U3CZf///jv/rG/9tZAKjnU4imCImSz8UdNPBqI1GC40IOlZcUdI1tSvQgQKmqrvexY2gfOrHTnnuzoY2MFi8wUB5OOqPslnEAbJ/Zldixn72OEV1XPS6nEZIk5yV4pL///+g//9bv/KlFRVWkFhwgUQ/zgXlQkB4vLwsK9SR5zEeISpmBHGwIKW6meY0wYR1Wg50Saj1//tSxHGBCy0nYmygs0FzpOzdlhzwEBOpzhINoVGtqZ2/PVxyP/wkFChSqNjhMWdw8LlFmIcQSgCAy///+M//d/0AABaKgSottXU9CUr04GrtyTMbjPyW861DF5qBLu4xP0yroMyo5nCowdho5HrO7q06KtTXV6Grs3JOb+0hd/8GFaj+lvpda9+0Wgbe/+3/6AAQraDbaPQZB9C1QYwiEiWQVyJACA/EVcJPgQqEKVBFXl0Cg5pKdCy6c2/HUncSEMjyezIKvDkWUJz/tN8//hL/+1LEdAALDSdxJ7Cj8T6erA2hIqg2nzPhGqwv+VIEQyy/kIGSajP9QCSV3AWQPtgGHnZTri7QbCcLdNFmSSAGxl1vEZ9QALEm7PrYUY9aztnF+Ko5DTK9iNmENbS6D3+qKEb/W89OY/d/9C2bBgY5Nvf6ewQA+/UqAALdtM6x+DYoi+yCAnyfS42j2Ri/HY4ZuLtXtjsXSPRLqJs130ziO6XRn1CRj2rqeLhz9s8t59MTk34+6SgTBkyejK9jmbX0JW7c/RV9xoT/6s3+cMet3v/7UsR+Awps915ssGmBPyZsjYSJaEP+pCABCDvwo0Squ5rmKWs8xd/35gGES2nilpkvIGj0/CpBT1mulAQ4GQDgtCRJk/hLpoluQNUc3VNZnmUc0UjPv2CM3/UcLPVu7i3/qQZ0P9hMG0/1+vUaEVe+8Fe27/iOJZoUpyNS0VTKVH3/ly5n7qQDG4zIQ/Y6yUM1FoyLTDpOeZQ9+myt6Jz+RM83ZDLk3VJIgzyzjIE5tIBpmjsiT2MTYzGOEugk1HpA8kdaf8yPf8//5n9VVIX2//tSxIoAC1EzYmw85cF9JqxdhB5Y/1q19nWTBvW/11q/6j3/+7dM2EAACBBCSkl45KmetwVJdFOl3F+jEZpx1EfljZO2ueWI26GKHD8PacQ3xgzRqw4KDTmi6Aym3e9Qm4Qzf1j+Iv3egRCiHtrfl8jKV+gOjP/WYX/k8j/9bf8wIS/+v/mS/+r1r3WWVQBIEAqQTnHMxcpApfDKmnW3zdR12ZwKsO0tMjINrQDCdRas0qb3Tea7zTctM/4Ln36qtabUKAYA8D3WjQhpC8M6vx//+1LEiwANmYlxTC2r0ZWxLHWWNPhFL+6B8//zqP+sl/+o1/5WUv+v/qJA2/9D+ukWv7K7BCKASoNBkc6IY3UrequrkWBe9JJ2qFR+dFT60qAnNPRAuavMrWBlNLdB3z0P90thZvmqwc3XnWmya1ek2Vict+gphu62Rc1MgVkMya9dVyRN0/TpqE8ZX9zf/mL/9f/kQ8r/t/zpt//1ef+hAQQSi1IWoGy0qYQ05STBW4Muiq2ZGIYJzFyePTBV+G2iym+5Cp16QXOV3ADOM6Q+v//7UsR/gAxtYWFMvavBqbFsKZY1eGLd6kruSAyWqXVZicGbovpHAxFJkP5gbV0XUgimHUzO71Lrf22maP/Ov1pqQWZksJAwe1e6zM9vVzE9/ZSGut+s2e9NIATMZhVsIq1yJfMBSQZGq1qi/FhX7eV+nUe9+LjNVkXmqqphYQldJli6pV8Bvbc28O0M27/cB6/3rEOIpKxHOKrmiEzPG1iWG5UoXHhKC6gKdWMbU9U+dQ6E36S/7Vc2YvuMADFpZggHjFLBkGnAqPrPrf5L/0fY//tSxHaCDq2LYOylq5HtHGwNl6H46ZS4ahACgABJkgIHRZ3oDiTZ3Kj8egUUm0hWSFiOkoLnz0gZqeFSusrSj8uTUdGUFK1CD7YJfpaH4EMRLunOVczUpSBuXXBcKnRriNiUsxTScHeZqK2dUhJOS4jSgO04HpyGgo1BK2JpFWTInLM5ArkDUCstWZvP5w/lBC6L/2P6dJqU8xZwdqSNOhwfWoqs/vklWRydHyB97RGT9b9Q85RcdDSJYsaytQwlIWQyUi3uNgZiVZmxvPeeypT/+1LEXAAKGK9rTCRpwU6SLuj0jOopXMcBPLWOMgmCpFmRO/A2k9UHOXEdnTWiKctFMO6vZHNqaDg16d0Fb/6frVS7U/T/mv0zH/8w84/roY+/RB9/3qZ/yhnqDbrjiTTSZMi8YjgQVgID8YEkaSilPx4OyVMME3Kh0qZfBaDhAxpOQ3hVLsfmu6EY0oWT1L1XepcLZN+awNAJtRFJEkTP18n/N/wT///ghwcysp0YfYjSsGQW387f8P6/UgFoESTSirEZxYsKiDSpmHJBVf+Bqf/7UsRngAshc3GnmO7hgq5vtMUKPmbo5YZcr+6npHo+QKlJ6n0iep5IC8Mvdat5bxFlx7bIDxZRMsk9WsObfqrOhiPoM227fPTc4MWnapeTXX18zb//+WopqSZbKY0ZBJNq1uPif0f/57/rAggBlQJrololYxQNW9IxLr4abuwdSEBu7BtGhc8kKjApXuXrRCx4xKBRPexHsXq35sGsv2+6/WaIy0sPMCBLZcF1iyIcy6aYgPaec4EwhDn5rWfTsqgXH185UT/Ecn/b/5U4mb7y//tSxGiADWFza0wtrdHAKWupp6m46XeYiqPhY1yPljAIEgrcbtC+YcFCUqVbl3r+o4HZcx2YfSDqFJVfReddI2I51YxuxdjIXErCX57nHIw+rbWHmr5PhJqiA8kZI80zeKLffM91VQmaSzA2VnI/CicuvZRkQ199SAtGf+n/xZkf//86Y/6CKP9ZPLH/nH/5j/ywQjLQZialk2GEk0lyMY4uNVsA06mwvaHErHRJe/sNIHmoBT+WoKyaZ9CF40GKLA4igcNWVZNjgt3WgkdbUDv/+1LEWQAOdXNfTL2tweMurPWGNTQZSJ+ZGiicF4JFNBJ9U4C42rY6ZjK00H6gtaVf1oP/hQjd/t/sdEmOMmmqlrdnX50Q55L/P/8w9ZHyVSquKqWm3gRZ+jvVZdjtiLJjiJOahO1cqKm25trMTFB15mO0OrH1SKSafA9Dg375uuS50mOedVKAJ3u5pmwEJe3s/4Kg1HTiCK03UTXor2W50HhkFutfdL/Gk///+sS01r6Og6nqoqjFf/W//Mm855gUVnYyi6rRZALZ6nIbplsWav/7UsRAgA4BdW8nra/xkqkt6PSqwqM6IqrblYqIu/1DLGjPjL184OweTGXMyyYMZPJc6HDs96Zm55INC0jDDMb6p/kwfGdFzX+h5hQHSS5hx5qMQzzv1///yJHV//RbIMQ51u8k7hzw6gEAgAJcBfYEisObhH1oIoP6tK27stZm40OQlU4eaVnGFx0eaks8D7lFzA4ErtadjULPnP/KvtRJj+0VkUuO1x2ZkZFVqeqjd//2o//X////8KiIX6v6rhYvYrV0hAqW7imFAhSFuJeU//tSxDQACy1LYOywTck+lK7o8wmanhDUshSSujWoSNAQybiSTECq46WEJdBDVKc/8texcNTytN/oBrIBWCrePIqIoSBM3dot2RME23rN5sx9bvlBD+4WaZAQAS3CiL4hKsPadXu0OdpfCgUUAc7gUDZst7bMUW7XqzxheO6sun4MrecrX4ff0Z6Mdai2//1d92/8ppnZ1It5W4hKqpVYX24T0O1f6AghQBJBblHMAwlYtkpPdCJTJb1hXn1BhqxnQiaHDWRDMAOyMG8fZamFflr/+1LEPYAKATd3R5hNcT6m7WjxniJ9KBsldqy6tTq6fjT+VD/6fyo0fTzf0Fmb9/57f3f0lHchxNy9FRSokohNxwwMlyodbovYRi4CTSkrJA6ysBErGS16m8RO5xNxvPsfceQ49m65orQ6ZfOIHpWkuidUFP8qX//6Cxv1b+Bf+r/z///KN19buT5cAIEAiAtkx3iNo1Vb9529OFYdGYnqaLS3lhgIYcUGtMhkXJKDYL9Vf7n7iPuqRggTP+qLMdofqYXT8Rv4hO/r+omGv9W/if/7UsRLgAoZOWtMMOXRTq+s9YQduB/v/N/q38p//6/6P/KqAACAqYTRC147lFBm8bcSH4ri2DJ/snjXNOhedlsRzqYVhgjffTrvn6f2VtR7L7s32mjtVPedmEU2RGKOhvxq1OeJwx/v+gv/2/QAeluV/oCn9P9C/+S6vDIYYLGCIBAT+FZ1hlyRZ05Q48Wf+3IblO7lH2bb53pStTDXwGSRZzsNgtzGb+6y1NSkIXVrZxNuYfKU/JfuaCP9P6kv9v1G39f8f/lH/YfJf1+3pgEI//tSxFcACx07Z6ww68FLpyy1kx4Y4AABilIIRK9lGTeO7DWMI1Ie1aXnJlfncCZeS7OVZSvHrNTTWW0A50R1sfeu0eZPxrt3FAZ/p9pokM+ZsW38Yb9f8i/8v/K/93b0ApmUtJVFHWR1oflHyICK1Yc28kKtatUWXOgcVWNQjMpkFc69KrPxNjPtVvft/Em3lcKG1TrIeRJBAClR2ei4cSV0F309v4l/VP43/OdV2zrqOOQXaEcGJgRmDAkmg9WNyBGDh5xIGzTvyeMPRTG0lwP/+1LEXwAJpTljTKTuQUCm7vKeUAYQOSX0SXIZNLwkgLEQIljJSBdNTclyGBAglBmczJzMMs3JU3MiKI0YDjDogT0SxRNOkggxgajhGc4T0h2sodyk2m6Zfag4XREoCZidEUkFPuulTdBCy0IxxhjFzxuUF+tq9vW3ZUumzKTQWZJuv//3Vbf+o0NkXNVSiKyYsQABbBQxhaqNgzbxeB4bzfilh2s+e5RXpgOHqcOuSChPCmkXmOJbXifppHXkYlBQSJDALDnPTUOY42eFBgNKAv/7UsRuABNZiV4ZpoAJPwztZ7CAAKTqxhYtJFlgr5JqI70iKgojWkSCiSAYKcOAk6EF9JgHbNBYIghnZYKjOqcjaQg3yABehZ7F1zB0OAowxQERsFBi8r0iIsVGMqHuFp4XVG1pru25P7LmyfRqDIqRsDx0iufd9AAQAACFAEISKs+QOpFL0efxTy4JMESwmWD4RJeNIXJLCsCfskf3pHQpxU1rbnitZxYfSPZc9gvD82tobvNCaG49DcIGfo/5t1dBYXKGtj7vn7+uQdBAldvY//tSxFaACoRpeaewZXFKjSzdhI0wxGWSuIaYrD/JYtOAwJMq6C/LHtZdGkI7N6gXxuEsRW6/TZ5K5Sb0pl/ZF5MEzlw5s6PSRmJc+wm0iaXGZBShOlWno3p2PrqIObm7jGUABBRSdaEHNeZpD/aFyY7CkjNn5cfKVmasUKqeP0fHV6Lz9UFtSyyMJOan6AHSuRetJDe4cFXWvPUm5d93A5tKPjgx/ilbT/hrW1dXSmR/tipREJJKacIo7hUJB2TSiqRrWkqu7pUfqOFwMx61Epn/+1DEYQAKKMtkDDBtgUYSramGDLgAewzLzGMK5qlN/uRmd6t/Uun9Hveayh9KWnOcdtjperWonfar//T467YG8Q/kteSRrAABJEC/IS8EgaNAcLjsnpXtmY5SyCUtnjjvPNSPqgsiNEpUxa0UyejQr6kGkwfKWZu32Ah2mqx1GaloVJOy9Geue7ROXaqelPccPVdO7iL3//2VJuEAgluOUHB3HC5bOysUyeZHtUTUcZ40aUsxxcXnEEzmbRrObuzTBz0euZefqNR1kejqprHb//tSxG0AChknc0YM71FKm6yNgx4gNOAkbshO7ujvSgpY5PrREmrM/0/1L93q0D0iQAKDrwGeLXci3NP/RQS9lMbOCEjFR4uNg6jMCYkkMpKD3xKd/6vu6ta26VQ7MOWPRPlEnpITC7U6f6VP6TQVjnZ31Y91WcIk//LeQ4qedxSI2FqFa1cEAIglUOi+JA5gzJ4DFBFxBw3q6pPiS9bYeMEEYwXQz0UIdUdv8KCyU6sUG5ehk2KC3//qEPX/58CX/9uWf9Ub+wt9nBgVceTGF1v/+1LEeQAKDSd1RglRUVCbrR2EqTj6xAj1lNsqLcsD2OssB1p2Mmlw4sMBjfQo6jivZq0eJcKwWR2pH2azuUM2s7ifd+TxptRe4uXVHJHWoxFISuZEP7vx41kQDC7SFvTq0IW/+vl293SqGVVEgtIKAlhUPh28Jw+GASZJGBKnhSDxf21x7g+wWVauLcemWt7UCIqiBpkI6KOlFHmEGRqeZNqWDzYkz//N/+F7Kzfxpf2qUqs3KXLVRue9AEFF4DAJeNQl5uqgt5wlq2OlwnUYSf/7UsSEgAolKXdGCPDxQCBu5PWeNgyYOBRsGir4KngQA04dBsKDug5louRjxBXZX27Y+UFv/T+rYdv/2//X7/yv/lOUGdivQ1GWgaQeihTgAIRTl4fmMVrk4qgoWMvRRGOczTCVrty6/T4agmMsEJQDwxu661ntFCe+ftQQ1D7/Bn/y8K/ye6O3/wEHrk/wh/oZImUMdbMypYwfBygYYFQinNuAsH4ik8SQoLisiegp43yP55KFbX25x8o9I3GvipJA1qe/vdXqJUVowB8atfxp//tSxJGACiVJd0Ykpzk5qi0M9ImS3b/xB2K5iPdnKcez7jN0sFibL9fJ7enc0837/KtaiiYAFpyUNQpSNWsGQMJgSvVD1xO1sMIaGVR5C102sf/KNHduRbR00oc20ahtB12PEVijmnHg6Whj/xWXf1qnJvrqnyDW0a/Qmtv+b////y2kEgAAC3tuAfQhxwpE5jVH2XxrXk1VxZDafnNg5nyMfKnT4RUhuKZzuWhfPd2dZAh83FZDCr1EUzmaiht/thmKTT7Vc4x8WLUd9ugs3Ub/+1LEn4AJ4UlxR4ix0UopbqjCnnqzf0//yVUEAAN/+B0hGjRL2vMofKiHmuFfSA3Mb5SUUOjzlWBoH0r8/YLGYcblXVaTVfVCqOr4s7Z4N75WQNnYYhaLGPq5hx1AXi3Pd1NY6g6/2+VOfKfp/JAQBBbkgIUA1ItQqSOkDGDtwg5zIrBJka03QEKQVRy1uPhl8z7W2xl6exPZbWzFdS+IbTKhIOnlZhfZ0GI605N73iDaxl/VVH3/5CNFp1KDn53RrWzrZDRLbgJIDiuPJINitP/7UsSsgAn5S2znpO0RSZvtKPSqECFQNxk9fC2bj0jc8/l/WkS7KSxHRgqSGiNqpqPk++R/GvTf5Uu7Vu5mjiKXpaY1bKGGbWz3dUFpn2+rf+6Hl9TjcXBACAU5Ih4xlPKyM6FISqH4hEfztILTkYnRO9RLo21tA9ng+lQCZO4sInN1nCPbThGxk9CDC/QObhC+CHY/+H6xC09yLiPvIQsnjjph2J4lF171hAODxV5If/yd1v73s2oEEwAAAndjwGMH4tUCOSzUYNmStHjKFCIn//tSxLkACnT3aOeZUIFMny0c9KlyPeQqrgs2utR9ER3R+8vMuiu/Jl3nIEOiQ21aBIMGCIcpisbTZFGjFvXLWSApKbBcgs1ng/S///0opATEAuANsJOVG8ryuOAI0KExQw4DwqDQqRhvQZJBNI92+o8aP17dT5zdEd/cA6L92re767Zu732ZxXt7TvCQV2FLDjhEPLSxqFXyJKoEAABKci2xKScanDTW3bIuJ3rAcBrTo8sOTFWh0BoKm27gq1gXqKW6ocjlkZQTaetmk5SjLkX/+1LEw4AKMTN7RgTycYCjrZzzDTqGlxV5v5mgoamfY+xT0poXC0++2i9cxR+oKABJJciwIY4iEpBYrvsSIlu88CzOzp9iqysbH2ge+ITA8zWV3DamwWH0xhIWMkS4M++k2Gzc/fcxx4jcVQOu7GMer/vwgbb+ys0tx33DK6n9VQCcAABKu4UDKJBxkcFSwWjuvZx2cO1OyGWRKRPfAcPZvcmgvQl1UYHIOd1ONxyz5WDcSQrKDZ95hl4x+FcyN3t68bbtvcGBUBC9K3wTuqpyq//7UsTIgIpYY2tHsSDBLhJsqYSYuOtYJqAEEpqWjdD2DGJYGaTkSUH4sBzjbQCApCEsQF8P6qBfF1kf/RHf0vTQ31ewC3EikiBHs+OuPV46ggPFWEf0qUQccze9mOI0hjUfTro2/0dGD/Eeb8a8QqdpWG78Kvv4hfHolO4ZEkkpQvePPV1HINeWHGgskZWAGcEULzd01Fa6XyC/i1iOx9H1U22YI2297rErmGPulXzjsVoopUSHGh59v3mRv+MuMA+gtu30Hf90iL6f/FNv/r9v//tSxNcACdiPZOwkSVFGkmxdh40qzv9/uOf+QJRiRQTLVL6ZZcl0oysOwyytJmfqqR+DFS62k4/opEnsa2GbLEX1h/Js4Q5z4pKUfXnctVWNi1/ZS7LscI70N7uIdRto+vTk82q980vj//oW//t+f+VGUXEM/F1mVQCBBJQTUdR3R/Xc/0WZpFSIzW5t7JOboS9wpF8teVwFESUjNOOnvu119NplpuahNvMI9k4t3qdW25bKsyA6tfQuOP1AtzvQceot0f/qXzPn9C+Qf/ov/6//+1LE5IAKVOlhTBhQwY2krKj2FWr/0NGezFnXR4UAACmzCwEylLpLWTCUsTRQkK7gJWybh6OwBJnVp43hHB1I6x3GWKd9jTvPYUVxq21EHjnOzjal1lWuTNKadwWZ/o8465YNHme88mOEpzmGR2QdsRxsq6duUfJ//v////uYOnfgPmkIACDs+wo8xjU2SbUGciwJRSykTzCeGLtJ52MftokptzTqqSvViDUeq9XGA+dtJCdMRatm/kTqwEz6vInVjXURhFzS13d3SqDbtpqmQv/7UsTngQu5eW9MMKnxcivudPMeFl+vvzky2zWZ/f8VIgAN3YCpTGtnQsNANDS2Fh1eW3Hmm0uS6VSiOOBZvodItnLYpjN1eWaXKh4+TVJ419cylZWlNLJtLIJAqLFw8RcVHEW2qioABNKiJNST52XGSaPfShm+WJKRSkPU74hNxbkEjyHDqclGT5VlxPFKTTNdtOx3g+LwHEGazOlCPEyNr/nkv3PqbIM41aUQiiEomRa0rGDe/cdg8Hb6/UuozodByebspusvpqt0EP6H5xz9//tSxOgADAVhZUww69Gaq+udhioaa3psdPqTCAyOMh/vFCEMlFAzUaZRjpDTJ0KpC04hsZVQkPxGg3UdtzqXWuwGs3v2pGV5kTBnVl33smgU6QryjczQG4aSxuhCHjflC3//v/V/4KXbdZQc/QYv9ScdNNVGQ0SQQGqbPOJWKuEIKMynh/keQgAgkgIrkBxUaSKx40kG2yJCwEveaMs9fukhcNt9LeVZJP4degowDIC8ey9UtcRoHv8bf4NjW2w8TOz0dRSWRn8RaeoKEf6fyov/+1LE4oELHQ9e7D1HQU8Sa42Dppif9S/87+n+n//y3//t/Hm/jn+UAWVclFFFQaZPx+p+CcZKleabarGEsCWYWRDR+I7URIfVk8UiscFA/vPKI0xHZMvvz0xQvt1XtLrm6CE1BxOgA126gcE/9f5USPTxP7+S/qO/zfUf1nv66gQAAAEqDBUJ4OyvNdqu5Ur5nUZbyOKkeaXPLKESS5Unj3Wp4OJEVWiXftocqto1edXf/0mYAUzXuj67Od+rrSo0ZadtZN3fYYwL7/r/xt/r/v/7UsTqAA0BOXFHobFxmyltKPQqkqHq/9/5W/9/6Rb/s6ekUIakLCW4hkYij7DbOZM0LKNvFAUjvQO6TOwv0Ak7DYNhBL0axKKLJWl98Y75o4VEDeW2pJPPPWZ8qav5MV9zMPX/2W8fg30vW5Wha9awvX9b/qE8Nv1mn8rDif//nv8//NX/W38+9QQAAoR/EM0FAfViha1tWOOa2tPA0aadPz8otlZSrDEDZL3GKnu9fOVLOdL8XzCr/X1WdoMY65h1ejEMW4x3sIITD87cJbX7//tSxOCAC4F/XuwY8sFdGmzo9Z6Sh6Pl/T3yMCJzOsqSZ75gHW/VtPC238b+1A9Gn//Kf5R+t/bTWAAYgDCSE69hwqCgR1XCwrNGKRMNDdMagsTBipIJ8fRLjGOJ4dW3j6h5f7K/5CG1nc0jJDXgTboz2H3PzBLZN+IB75hgIxo35zfjEWGVr7Fq6qU/7fx7/me+VHP8j/v/qQEsAABDc2GmhASE0DTOBGOZ/siUZD8PBX7ycJUgZJ06TowRltEIMm0Nna42JtuRdtcVmQVZkLr/+1LE5ICL2Tla7DGvgZq0K92Eteop/kVSYfdGEwz1O6qc50qcvktnPkIQPeQ55z38v/O5PUV/0+oAMWABKNPFXQUqMc2oqELmEy0USffn0/32tsrAtLu3gbc07ChMzyzA3FeWAxysWycFhEbGR4NYSH7t5agijrjbE71+y8V1arKwKwhPiUEoNiuIQSuOwnePhWsyFGTOxSssF0krtcgWBoqNALGbtT/EblovEr0ip2xHYxSlCcLaRIJIIKhfAsNyuVUAGxoUmCsEp+IaMqMXW//7UsTfgA11a1rsMU+BgKdsNYYo+A9DEJL4k8yv5y59fYHubKdiS1GO/9lpM4M+xkNDGsK3q5P+p5Ruyr1OGD5CloHc9ijCnRQZdZ1BuKNokJIopRJuI8FAiF6KoV51MnsKCw4aBp1feI/VR/7/rx/d6EpuZlC2fUpP5O3H/7JS3dt/ruq/0272nYlTk9fOLdTjwhFh7DCwg5/rE40mAAGDhd5yxcBqUAB4IKqpGWcsZaXHeIo1ZGXKiZU6wxIjxQXfpJw2xjHgrlXZj6bzIjxd//tSxNeAC2E7Z0eYr0HuGK409j8U1hMa52LCEez+2t8VekNdwlWOpiK8SyZ92DjOf9KT1TvhiAW//0ioEACEAYPUdp0lVHMqTTAeO1Hc6Wa9WF+uLXUBhQr4aiaMbKzZlkXbxB8FkgPQWqaswoP/mIuifaFn+NJp6qq57/JdJpwKGtP+6n9YsHcotNqKADdcIAZCAUwEABQ8LI5kITkBMMCAMSEXOmSjRyOGikN1xGn/+uFlUrkxMAK641SnYVY7v/frQrFMl6Ufq3if5Uz7qgv/+1LEygAKbJF9phhPMWglsLTzCa5Y/eoOwnWtHpd3tPWtyQBAAAkABXGOS+Gur/REYe0edfphra2uijabGrIdC4cepTsVHgtJTKfUKmIhNVVAr7wiqZoZ6hRYcmJHae2v6OMt//K3cXEf1v/kpT1VotGIL8d9uuoAEAl4ymCcoSSUABQQIDKpLpLCPNaYs/yACH2kqEQ+jTBD2WWAteVZ8MtjaVOzu5ZUwSLnpc+LAA1vPa2ycVf9gD1P/8/ZqOvv9YZNM7pWs882zBGGn/zfUv/7UsTRAAn0lWisPQfBR5Xs2Zeg+MPJ//jjy7vTOn22fMVxO9ZhFaxI/PpIoUGRtpSctxTluX2GAu1WnHLzRB10mrZbzpy8U7Ca07zkpiWNDaH1shH0GSZzZxbzGSIoGOKOV0uYdr2DrX1v97Kwj0/97f/0Co9v/V////f8qXoCpH9/AVhxHZooIol0cfg2sFNGjUVg+YpPGWiGPtXUgdFSLj4aXaVQhjtGM48Ab0PfsIAyLy2ZQ3B0cWSadVRUc3OMZ1d/WjqOI8dEQJ7b/+VO//tSxN4ACkS7c6YkSeFQl2yph4k4/qf+vOut+JOo8kwsiceXDvK0vdWMWWQS65moMc8V2XViSzxZbTxuX1+uXNsLVPRIr+yoPapPde8azyBxiEiiirX3w7x2k1FrrvjD8tv1ED0b/p6D/b/QIO3/9Xbp/y+Z/v/8L92e/RRVKACCSnAVaoWK+baPMAeKefV+c2+sMImkqDcniqlrDWW4sfAcwfQbdKYd8U0oosy2UyDpQMhXU16jC+x1RY7/lbxT//QROX/+NHZD7K9nxEAQU6D/+1LE6IAN6P1cbLD2gXMs7uj2CXuAwfBVwx2HExm6ZbWGlLFa7XpNHYXJl/SVfkB8XwzccTlNrLGccJibRorRwBMarXxAcjUF7qo5pyC4t6XFY0rq8ujM/cM9P+ouM/5F1U1Ikv97HyuLmV5EHNO+6RgrihGlBBKSkuLoYJcTLT52kAerBNHYjchs1TKPkJFwja0DeaSgoue8N+wm64WR5Wfr5b8Tavb7Ev6Lk+1U7qOaHg5tf8Y9ug7xId0HJQREXHMl0zDe29RgOf06eqdAg//7UsTggAtk22hsMOnRWCmvKPWJ9hv6MT/iJv7U/pAAgAAFIuULsInt87j+VGfPzJFwPIRiHxTOJMVJZYVHCD16BSy7i+nHDwn1q6NttK2bPdmUTho445S5yuxcEX79xUl8j2M+3n/fyX90Q7/s/tV7ltv58n6c5S5VJu6UElIqWCQ8yk+qzORZYQTElIB9EKqJSLKNPzGsP8eSLrpONcTvaKntnb1I0xxuVTViNHhcYbp1Ys5qJ6IZ0boNG6p5H/3/6dpd0dB0slmRr7M9dNC///tSxOWBiez/ZuwwrVGIKSxplhYbVfIacYBwFJJKVMMW03sQasn6kqz2PvP7DKjx9PCqhHBCWuVQketqkeWmu6LooVUv6JaK0WNjW6ov5BLbeReBNb/fDXFae844Ki03cd6iEj3fuNzejeN26t7/9Xf//MpQVt7N/+0ef1EpbN1KQooojhUkkT5fVU3l3OeOm/HNwsv2VyTUr7cwfNT+05L7iUKHFiOaNklmDjiFEw2cJ6g9dj7JSpSrKB4ILzvE5/v1KsrIUdsiOG9C3kP/M/7/+1LE6oAM0V1tR6Sv0WymbSmGHPq/N8q+/+e9e6glrpACSkTELGqP5CjpGkbg9ZoLpckiL8OKrkqlalkUx52YkFjfo+rlPEYujZNxUOuODiGvChx/byuigeMeJN55YGt28Ug1coebj5yccN6D//Q3/r9/V///8q9eW9cYHlAQSSXEoJVNIEW4dZmK9DHBUnSlHJkAhQ48CTRMZLCiSv/MUSwlEvIDGM2yOZlkMeXY7Qt7z3hiW87sIxN5voNuj8hKr0fztav5N/1bqab5z9/U4v/7UsTngAttdXdHsOdxnCus3YYdusuq/dyesBAID13CCycLLWPJkpUjonZTxilgNIRHYJFhkOo0IMV5FykHgUJt7y/XCrHaL7a6zRqKyjWeI6JlVbVq4nRzIET/NNnEwiFjzB8XPuIxPy/jx7WOO+q5h3ZfZureWrRk8NJNJSREKJJqQCglRp9skao6DpOo1HJyndJ+t2TCFyuz2tb2d6xSfPzA0uy1tB3N6p48scWeR2DydRi6v4yME3ERfWZcoCl6t7p/xhuvxFSMUSL0D45h//tSxOQACyEzbMew6fFzq+4o8Z4WVIBdEA97KjOCoABACACNeojD6aukJaM7bLDpmK0ShWHmUz1nTENEJYd0CuZC1isTKcUpeNRdqUniFnTZuxEXLC1akXVY2ZDNBu+rmeaI45R/GseG4F3fQcXQ8Xv7+xzf+Pv/9v/mIp0x/MIa+XoDgYJLbiwYdZoLOGsJPqHuw4rmWA6uEBDEg5MCYPQxeo0R8wfbIRJte6EBlCLa4s1gFR+acc3ojGtOEgv4/epxAEaf8EPnfEQxG/2DH/j/+1LE5wALcU1vR5lNcYSk692GHTjUk366Fvl7k5f5cGTmiQDacjuJiwIAaJTkEKNTKUtFWZY5eAQZMowOmtdNe4sc1/lC9qbPxE5mLEaUM/LRDd9R9nLKzJh5EB86298YAhDRdSM3lBiOI/80ob/4u///+xFT/kD/9SMmNe76ahWmEcVE3MOwxkORpIi2nEeqnQwkFp6XjA0EhBEzYsQgzpsB/UiVuTy+BSAcEFrxSIqdRqE/OqNLbEhG5Ksfk585WAi2oYhqoQCFN9vIC7Hfpf/7UsTmgAvNB3esPKuxkKgrqZedOAeN/zRupif4/HL/6N/83/7Fk9PnvrBCWJAAgN2thdwea1hpsKWDdRs7xqMsAXKJ8mNlBUGAaEzZTI6aTUJCCv3LUGMwZC7CHjFeWP1myKbVHy5VYxLUGRWSBi09l1adAYYCAN79RsFXNz7oLWylXHCq+r1DCt/53/5x6ff8OQMmACASicBtISgUEymKLkEfVBalifFwU8EmygT5wmY2xrWE2JtumTSpVZ/l6tQAaGubfK0lcnvfUl0x+Hgz//tSxOMACzkPYuww6dF6Ky3o9Kl6a28Zx4/+P4/H3Zn2Z0QnBT9D5O/+z/+6FT/5ppyj/T/6xIBOtWvjhBa7E3UZEh2X5K3Eh7GSPXHYLbKL4tbtURM4T/qxdvVGrR8OS3b1zhcT237uMXOJIp7LhtgXjkhLnpUYjzkjupwZA16ZlblW+/kJKSed8hO9/j4WG8t9bfu+Fvp/9Ko5tiW2ykXG8tSmDnN1ToRpCEAqUPPO2ywtLi6BR0ED2z+ynpEcVOTzsUNuls1m1MJHSveMwZD/+1LE5IAM0VtpJ7FJ8aGkrHWGNTj61t5HAM39ZulHJucPL/0Ao/y+IAp+v0AjP2+df/T/401f+H8hi53yxSiSQToWb12Oo0CyPQsJc0LQ08bpEvzU1LLQxJSR1vNHLW2JXTkwqSVFwSSnpQWzHP+Pmllyju71Zehb/zQKfM6HC4v/0H3Tv7BUuX/6tX+9Lf5hA7zvYg8iEACATd9x0IQRR1Mt00OjSJXAMbrPypCG7Zb0VhSFiAeNcO/TC4hEnmF02ctOgw27CL6MECO9DSq9b//7UsTbAAvpP2VHpbDRj58sHYepuEibJ+zKJB1n5Wog0PD+r7RIYLezdBFGbp35D6del/lgZpFBJKSgmIagnI9kUhCvbVXCglwlckMZLjgfHMMAnhIba9zPidrzuXLJdm1/eDz09bHymzs7WIU/7amHPy1CyA87eheclnn/+IxdEwKLEoqYI1puQALYZgdI7HEmJnpiK5pbKmWlJhj0+bFK82TFBcnkEhOVhcXFjm/aqytPzpwfxUj3LL3ExcyNf9RREZ/9Xe+/0p7t8InDi0HG//tSxNcAC80/c0ewrfFiKy4w9B6ORGDzOI/tU1EVAOQAEhOSgB6EDB4ogaBij7ZSTDyWz8Kk5gFU5Bk0GWChY1irImEEyo4nNqdms9WzVekoypmcZnlkrwgFKg9zG02AQh6O/RHQUlXUSfyBxaMyN7O6/8sXf9eZx3KVig4AZQAim5cG5FHlL4qovHGEw/DTycfaMNzvvDXlMvgOQcoyfoWo6C5E4hVr3dKp9ZqbtsUqimSo+V98HcFKo+yDtd9BI9ZHMNfN6S66DarFP0Vfl1L/+1LE2YALUPdjTDCtAUyVrmjzCfbdWquqYf66tH6vyWMbxW6JJqrEWK0WJBkIR6MQa2cB0qC6Vdr6daIHC+5A6UFncd2IPXaqJbmv4JrryaUbUuda14PAHad+r79I5Wfdr9t9xc/qAH0/CDN+vtP/6//x3KUABJW4UvGQBsUSMJoy7pJpYV27an4elDWsoZaTB0gQaLYV0PCy60LSolIuqg1YQfejyqu77MdUxxtoJkhOqZQCwys4hAJJlTZ3OQZjh7cr+PvqYnoLN+n1EEW+t//7UsTggApA927HmLExfCYtKPSVevJ2f0/b9vjJtfdpUCEnPwWDhtGGrnXqnoj8nC67T3elD/75T0rQadn6q/Yoz0ujL5CdFTyhn1ijdpf6ve+tkN6lKrUAHGL95UJG9+thC3x78Uvn6/QZf0bopQW9rP8sZfZvo37fHy2pAEgAEhzbeWD6pEEzJiT9Dh7ku828IqvRF6tLQvLKIQqhe06hvESSSGcYhxC3jPI3azf51Hlw3CR+5wPKq6wB9HY5vYQllblDDdYoLoY5SPGzqKIn//tSxOYADClJa0wZsVFJqW5k9BX+0/Qt9P0b/9/2+V/QCAjEAAypHbxsBcj4N1QneX1LqY/DhnP9E5zRK0P42d8vd9y9v2CRmWa2fAUcYt7TS7dSJlZKBfshljwHmo0bn59io4vZWd7Q8Mfs35X9/Pjn7/K6uU/JaueVBCYAAApyUlJDbHXebkyxR6Hq0OO/IIcmL9p/lexkMLmuQ39vc4cfeUDnkd1Ym04/6t8FOy8BbU0+ccynQi/u10u/WozkIvchUFfumr653RUbsf9fx2X/+1LE6gIM4UtYbLFRAXMpbB2Enii4v/jjGgABF78lEH+RscmPsKeKVU72RamobV6zZM1DRKHDbNPFs6dpFgu8P8fDG2xFSqmFXQdbtK4oc9xula5rR5e7lVnUCjYBdQiNxqZZh8O0esQ6XxPzz7VxULcxNWMNn6kRhzHjNlfZbWOYxqd0xKtEjqHh1AqDLF6dYt6XgIqRaSUBQABktBcc4eYCTyfyAU7yIYnh6nSFRCPTEkJ6DQggP9Y+5j1udv5J9VVauUopmsVAy7dkhzAAp//7UsTmAAv9SWFMpPEBZaJtNPSqHCo/aeyXimKKYUOEnCg9NZIUHgOTPUho1cBbf/QGIAgpygR8lzGClsKFha21vAfOwQMS2uT3aM5WUH1H7HY4XU86xayrlIvggpFVDX5/5GakR/+/D0X7bRpokgMLpzoVifIlpZSA+8cPTS20UOPtKdQARCSkG5aB6QE0uZ3q4wJSwHQmmwQHRjJEerNhaOKo9XHRfNfbaJhZKTcF5Xd2izbf/9f1NnVbnux2zvMy5MHV0oHIeqHV4ZycaUEY//tSxOcAC2lLZ0wwrpH5JmxNh6G49hh4Bc0639QxGkgoklxkzJ0PNFF9KZsJq8NdryS9DDdV0Rzk4PzLMrUiGnz7vkDEZXDOHoxhsa0tkIsvKdh1GlCsSCWj3IiE4J/r9Aoi+yi0+P+6FTcE5VUwkRsa3NvbcIA29R3XBQSf2McqG2MYSnYYKgUOTD2uQNBLUhYfn0xA3DMBFQBEGBac2obJHs/Ijk11b/PwAr7zf/yRiLmjxmUEkFhRrnOoCxxu/4U+3S1JAL+347ohqP1UURP/+1LE2AAKhLFe7LBHwU8V7F2WDPot2fo79H8kGoBAQ/424C8cOM2XOj4w4rdciHHSlzbWIOrR2H4Vatp7DiKKnVERhmk95OjnPb3QSpyE3K0bpsKEo53Y8cNQ85zI2r+/KgcQadMdpi8v+d+/zH9Kh1lGkO/iHs0qJNopFkIJQQgrjLBKIYSJvP6KSw+JgpsEbRZZVtwj2zjJp0IIv3klfdg6lzb0wGvn5LNo2BSnomhMYo2RaPDKHpWRv6bahYY17ozct+V/M6q23qMW//b/9P/7UsTiAAp8rWtHpQfReCIt6PSJtv7fm/z33VBNJdYcNThSShTDVb+LJrKIrHGRzLQHHSQlUUDi5MRD6YKkKA9Qcts8mva9a87FP03tCr2FMfccWchs22/Ly6Wh55i9PmExi290Z+d+n7/Mf9CyL/+3/6f3/KdCMPzt9lU/qzSWSi1AsFpyvBJirUxWMIYhm4OaANKwzahCxyromHFFxtYZru0nITyyM0C2Rk60GRKxAKme2W1HZEtjBCSy7L84Mzf3/ECf6r9Sz7nI9ecYKEOq//tSxOcAC50JXG0wq8FyISudlJ4g1P459P0L/v+V9uH+2gEglQADrMYRsFohpf0OHtIV6Djr+0RtsXKJb0JsTiLD84gdIvLM5L84EsecuoZDlzjby69vWJyY2E6Uv9amNgaX+p30A46//Rn01/ctcj3f/yP4lRa7JDSUTgENDlUZ7HyryUlEYxxpWVMr7a2MZffJHXIgx2NQOYrbzTCRAEPoSgKiPE/m1yyuT8LESZ2t2MWWn8q5Xk8QAJVNEXdC1dYcppcyN4F0Y3VrK1dF+kL/+1LE6AAMPXttR7Dr8XErrvWGHX6OPzr9z5KwEQKKe+Bm4CQKVCgJbgcDxMmOvMPCx6TiAFCiBpQTQWHICBaXsuieBlIurfpx879yv9L3jVrFHyK5VjBcgmoo28XMV7/fKJdiH/Q4Kej8oHeg+RulZzT59fefvaEf+IUANiBVVcBYeJQxhbyQHohqKFUrjgT5B3NsfHrZggqZkf08Ea6bx0V9xwCm0rV4sx//8+gOdy9pIxILztPNF4FFxY+jmLY1T4lBqntITHNbqSi2btecSf/7UsTmgAxJX29MMUdxTiDtsPQd/vRCoKydE9T29aBULL9rfsn+Rn/y/Jj1AACBBAMuSq84uGvw2s1KxrzgK/YQoi+rdpY1zRBgfkIiQRnyNDMFAKCkJrP9sBFhqCf68zP32MFMYrZjqhKC8+qosDlGi1fqZfUpwsz/6z37Odf//y5//8+7kOohyX+MOLUSe7BHJK3hcRroJRqtMn6LkWSDVB0KIxouVa0v0+gWG0F+xQGp7i/U9ltLUR3DiE55ygHlByRNmOoDlCLEqbX1F4Eu//tSxOmADDkjb0egUfF7GetdphU5oyPdSKal1Mo8iNITRH9Q2IpKW9RiHwsrVW396if//8r///f+o2/rV/pGbyVKw0lVC0Y20iaXNLIASQyXS7NQzooxEAXxBX6oKz7PQFSt5TldF+Uj60Z5ibik/hhQz7cmiObgCG6M/QThRmrSgk5WNI8B1OL7rdB9d0jAJU0/OGqut2WFe39v6x7f6bfzB/6v+3+ZN1NpN+tJedfRFgQAhAMHHFaZBSQpKCCQCok0xkqPRMA/kJQ5IfSaNFT/+1LE5wANpVtlJ5lU8YWkrDWEtahRdDBiqohMSe7CCCRU8NJLWLuRzskHS432bSM/xp5TGR9JSdyn3pwogFXNc1eyImlSb9am7VKgq3/OJq1KRnQ+N/T/qHj/r/y///+l/l1/63/X7ntCCQ0mVAqOD2JWyJlKmb8Pe+bywzGW7xvlHLYWt1678ylazGB0M64NVIGXRIz5QtvFp9vTqFmMKSwRUupEw0cDUTEx2naaRwQIbVIeikindNzVEkQCUR/UU30kVLMQe0V62ar/I//f+f/7UsTdgA4Jg21HobLRvzEudPY1fon/9f+Xf85/mD/l1QQABoMHAxge4O7BZVI5YFx2Lq7extKiejIZUkH0hgBlBOJA4LnHTMAos5aHDTryk7y2F6fvg5TZU5NlsE4FdIsc1LiEc5BKRmZUFGwn4cJajpVq9rpFQKyh+s/10ZwJIyv1/5R/1f5gf/3/y9/2+vNP/zKp9YCEGZ+DJQHwrG3EGGTuStbu77SFtumnpx4sj8AjDfUA7kxhwu8CeU0iuhKl/tzVkemFx8wNHN7/u9QG//tQxMuCDnWNVOy9rcHKrevdljYaQW5G2g2zTVizZ2RrRdOwhzx76r9LYyBVP+T1etJ0gJWtO+8//lP/V/nP//0f9Ff9Nf+3LuWVAEAGnLuSuBsS+WSrkV0wuxdanLXXZU4eAbGRgCARFnhJCgQIAQOCQUVSc0S5MhNVkL6teNyh1APHN1tJmjAfCaFHUw8eEUkMfpvfYLggyn9Vb7IVCIv17bUZlCT/Nv+e1//84bP7Or8WAIDv4HQjbh5cifFrbqUdK90JkK8kVB7bIBYG0P/7UsS1gQ6li1TtMa1BwLGqiYe1uqH2F9hpaAsSzhTDbmPgzn1+SxjnsvobSGvOpXmzC20szmb9/6KJ4EcfoDXYbeqJ3WQ7z/tVWHBQAFJzYFGQ8mTYTAtqS2+Zm5TzLuDR1lhUypqhxL2bY0FDG0Ph6jG3Xz/St22oyeTKdVdYuyg2ZX/4gT3pX/RBDL3/86BwUXXodPvIJjwoTFiZr1M3KJCYBiRF9xAp7bZDibv+QUv0kFuNMlEoFmURURhAZP9eOcuCSZF84jzKFbVj5Voa//tSxKCCDSFLXuyk7cFBFyyNhgl4C/A1Nf17NFaU98wOWGxUL8y27MroX5pXPRuoks38Rhx///VQnzmlDCNpMOciTnGdv/8oIYSycgNyzT5hhG9jQowpiFtEOoPyaiPZmIxgUrbWSoyfllUCMODtNM6AgUFpyFvE+khXYiTuNP+nYw/6kMXDSdTc+gb0ldZhwRYB5TZw8YZc6GlbNLpu8ZmYjYLDLBa5XlN7hkmvAjxb1onxcNUPqUFvDKlsk2WLb1pLH8V0nRvdpNdTfWdf////+1LEoYANJYdvR6Cxkc2zrvT2KaYnMXHWcaYo+tkGMzUmj+n9u/+s96fSKBoBvMKKgOFCNTGygeKDXxdiWtopzTxmDKhiOD6CfTJuK9lOLxHFcBRD7Xa4N6ETL1yJwgP8PMqC+C7bjyNuHtNYqUmmzea3uNRf/dg7mvX5h7dRfOd9a5IPX9Qwim/+v4zDoORKmezhk7MtDU0d1/5l8r9nUgEyE/AbQOKmgQyIwAS4DJoU7LLWeX2jcjhJpEOcWINzW4t07VzRT0l6pp4bFDzuhP/7UsSRAg99c1xtPa3B1yvrXae1uGjatn5+/m5N58riAjvqjGJnqzdiU8w2Bsm/UsA6Xa3yi/0F43+nP/4Lw0/0/1FwWAvHVjXoiIytU91AlQyrryP/ybyfiUDigI/sUrSEhMtaryr6gpyHzhm49t506u4Yr6izqP0+IGtw7wVfGpCU8CL8nsbW698/kecjYdUr9XxY8u4xshxdummwh28uIgDBPbWs1hxTC/+UL/5USG+2Z/wPLf//lBhEmWujU/UFxhv9n/1LeJPRA0UBJEgp//tSxHYADqlzWmy9TcHCrm0ph538x5w+4SLVEo6k6mi19rqPTO6dskFzx+u81P0hGt0nP/vWDAshzUzKRlOzNcxfhEK4iz7zXmasx6WqqIl8wAifi/yZsIolU9u0jL/6F/9BZ/5zfVlCSN/1r/yAEhW032Rk8yGN/0GT/8UI37EP+oquAIIggDUQoyc8BhwsIJQCAFJNlq/GpjRbsNvpL0O3WIRsgbJZgZjQzDWXQzjU3hsPySdVSKcVloMDMf/tqxazbCa9b1CEvPvf73cMS1v/+1LEYQAOnZ1fTL1N0d0zat2nqbhasCMP/6Hjv/HX/yv/IB3//84UCs+do6mXL0Oc4BwUt+gyb/QW/9CL/UoqAABa1Jd0JA9AXHZmOCRJuJYBzk8TJYFFBOF7txKFFWpJdRRGJHUBcq2F4ULdHCoIzkvzAZUXuLloVBwXPLWvUIDbfYCIaNrsqKU2e+OiI3+O/8LF/9P9RwJRx266I6pvhE7l2+T8NemIBJP0hNBdCElNBpgYM0xw12VRqPjzX+zZfwz1SL/EnUsCWWEpCmeO5//7UsRIgw0BSVhsvOfBZCmrjZedOGTH3arRa9z/QX0RSPj7zttAgL7ew+nOToMNqnUd+Z0f/P///nFxgubr0bbmNLfZ6QAhMjAaUwXoV0MGVTb9I1wYDQ6OANIxD1ZCTWWcuFY/vRWQnXGrGQ+APfjEFe01OxXWQX/YXcqb4UCN1OHg1hcU6sI9X8YO6p2/P7f1G8c74FT2ekAADAQAFLR0wsV3GJQyl3lIh8JQ/rqJMZgo9ie3QgmjS9dt64PHUssAsGEVqyhKa1zADP7mdT9Y//tSxEYACoj3X0ywqcFGJiwph4i4N5T/+f0b36P8zf6vyl6gB0///UDOezyn/kIIdVIIBNgEHB3EnRpNYR6G4T8qitU6gUq7/Dq+lYipito45nw789rqV76gRzdqHurWM41/eVG3h1rsVriL/8Jj9P1f/OGf9X/6D///8R///4z/xH6gjQywgGwJQgsxnhPqULSOghdEqjLqaLsu5fIlvyBLVJVssS39dqE6K74HXnEkihkkkknAG+vnbcJjVUPdkotUVIMyWW2/AiDf+OEq29j/+1LEUQAKkV1rp6St4Y4xLbD1nf4a3+qdu9Agb/Vv+Jxf///o//T3by/rLzUgLSuaYmYHpTCwDuAWin1lAtbmB4ixMOQYQ7BuHgmv4w8I1kU3d3TAbeHDJdg4WmgB5j3MyZnCjDpqpLlKHhmEGeevOCQCafugyJP6xCv/oSt/lBJ/5pJ/yo7/6f/OekJUsooEptNSt1lDNFh2ZiSGQsliNK+1iOSvzZM1Ola5VTt8rv4qftdWu+BjzPPD6kaWxFcjstgVnJfRSrURRIN/UGhL/v/7UsRTAAwpM2dHpUvBcyut9YW1upnv6o4kP+//n//b/lZHX/1/867yW6B/nBMZYCVE0iLxfRTxHoYqYLtwqX9QT0Tkz6bzc5dcOrm2e+pr+BB2xdHum5FB3PHwn5iNE+dsyIkNXuoJ8GRNl/WVt/uMX/zL/mI5G/zNH/nT//q/6Jp9FWW9YGCCAtMx3ygjK8zky95IDpZS40t0CAWdY5z6ppCij4UHFups/cW79bhcLbNySLyhbI8pqHqeY00IWTU0+5QOXv6gyJv/l/9Qok/5//tSxFIACy1hbyetrfFtq+yphKl4v/kP/X/zR1f+v/Ql+6is76ICFBAG2a7RTgVpkHUqS/s7E4Ico6TrmLI9kIMkSWvcljd14pWG/6hWqkvV/gRJWObPlRICNa51R4Oeq/Ilv+hex+ug0Lf9P+j/9X/4of6vV/6IHONsejTgomVKfjVqOXHPCsDBi0roIBwoIx6b9rZwlLx4Uy8wtbRFMQiaH44HpuaEwzKjcv5r/g/D7GWjDJReooOzg8DgRA7OMLJeCAaSiIMHPH8//97krwv/+1LEVYAKMTFnR6DvgXmbbEGWIXg9rVf/2QbAAAasEbwaMWO+ofoAkiSVBiiRPA/YmQRl+ipw3TCRoYLIhK4L9kqfQCRNSSxJZTPfmt0bqez3KbMqzAqD3BWernAVCdNCblodo6W3SCw0ygB8BAACU9yF5rg4zc6CLtinYyoH5jJAo449ZYOkGUhcGk1mfiQ4HO560G0KofsEDYGDAMhhThIGWTMVfc26xQJiYInBxpKTiO39OKSizfRv1gRhAAAfAjAphoDQW0JRynTSEK2HBP/7UsRbgAoor2ssMMOBQo0tqYYM+E7W6LcjnMhdp8UZDDDfnyzWcDyfiKzVNYDl4b0EAJWasLwucNlRga0NPiSaUKVNM4hdQJbyT0uDMvf2f7zbLLiBJJNzLBBE3BZ+RFQpeKpMTRcBSxJVQVh5K8FkAu4gbUXXF0xm8RdV3V0ILjqxUNDBZT12JNxYULzb4v7lm6d8j1bU3e9ygf+kMk3F0tWLU64AwjAAAlHwtxLVsr1z0UYzUO9lN/ByDyy1FLAewD/qi39lMYQHh1CzXUIx//tSxGiAClR/aSekdAFMje7phiBq4t3EEUcUe9HfsHQkXTBaWqX/Xx7M1rbEcavdlfs0L5L/9b/+zR+kAAgIUAFJB0AOwAFLknT6TaQZ1Ol1KzqcDayUAOufgKXlo/MyudhL8NLW0MpcU9EoYjOf0eFXdqDgPOzqZorP9ELu3P/T/+//6//1//r/+VcBEoJwIzq5UCgo3Ph8ICpKrLCvh4jSiVhRIAI0S6ISYEt/XsuEtnMpXe/2EBjOilAVcqTsitol/qBY47Useivkjl/2xIb/+1LEc4AKOMFnTDynwUEpbTT2HaD7/K/p+z////yr/9X/W6JIBNpQAHhBDnN16h5hKxvVamYm4+1RRogRJFrEkSEyrguFd3c5CrbPGNdgMzB/p+I/4la8+bX7mxwNGTbihkL83/3oF6/+v/8c//p/+Vf/+/6qNQkQnI6IE0jqRp2ngl72XR6KZGMkLPI/o4Yf4+qTxy411RulUooNQ1Mh5Qeui2+DYd8TaH5pB2dS2yuIwnmOiI5a/R+jN2weO9X+v5R/isOfT+3/ypn///+Sfv/7UsSAgApVS3eGJPCxS6ltnPQewmxYiwC45AaltXIbm4L+rRdWo97W4RYZ5QYsQ6yqvuXeQxl82pmFnbLueGptDPv/42b0G/5v5vxGC2u0ha9b/MPfuQAFTfX9f/4zb/9W+3zR7+r9dRdlVY2eA/TZQt4fyiFARDAg0i3xlW9sLLu1qtjngp/O4Vnhs4uZ/8RRHcurHg8PUi4nOfRT2fSoWFz1109tdvaLn/9P1XU2aJK/T9W/+hIQIQASynIEcyd7hs2bi00QlI4IJwJZiJMa//tSxIuBC3mBbOw9R9FKqa2phimqGKOQYUaaxSIuXGNJsk8nG73lybU10wUEomk5QnORY1fVyovP/R57/f43L/+JDf9Bwsf+HU5QML/SHwwiP7y9IPU8EMswRSd+D3woxpowCzFCVRIPyTgcR0H0fxn3DZCh9/Hkj4cUa0Jln5Vo+setVWBtX39X/9CBRh1yiIyHqItp7pRXiOQ3bdEtpurvnCt/9D93/NpJAIqDBPgy0vbgvseCpm9QdOhpQjXSvFHFKc0YsfP1qbNS9Hdv2lz/+1LEkgAJ4Ut1J5jtMUwfLSmGHLrTj3Jvj9rUFX1K7PnPWHgJmt32qn/wvwjEsFoVy7Ihw+QLZMIomHx7OpPiOb/3S3/1N/5wygiCKkwBRJJpMPqYFY1OXscp7G7Q6AMb80CFGwJUqictQWpvLhGHJYZBl5Dey2wq/y6ZT63q7vuRB5ev7Hv/UMIMsnBSnzdA1OuZkiMYmmR0vH0mTVkU3///+Sv/D2b/6RyAgCIygDcTAOJ1YcOAWMxNtnMBYfQUKXri/Ajzk8KYGNZZtyHtev/7UsSfAwtpJ2ZsJOnBbZ7sjYYo+i4dlvXefISSeJD+TNTUn2/USjKdvt/6BdgIDQGobn9VPBd5IXQ+cjiqEbfq7//y/+t1f/pqIYrQsJOuYFAEyN4ok4XMvRtwTVLDgLQBFoYKGUbbNzCe9/8vCJigylkE5gOr+/zccawe5VqN3Azb7noU7dTHMOAKB2Nxqc7mLc8DkZSVtKCgZX///sW//9RSf6DF/v/vcUjMt60Agqdng6INUUzdFMddjU0WGI3IaT4SJhmGiACdPWLHIRGG//tSxKGCDB0pZGwlq9FppOxdlik6aFvIlzlmcAEjvcQhFXIX2PMe7RgIY4w9kLJQnB6j1Q5ryjIi1vUuVBsFDEhjnIX1D1lI2R2M4XZa////J/+nI/fTWMZ6KgAlolQKEo4ui/MBLoQ4ve8rXXzbmzQ0FcwsSrfo3NIeEgTWbsct0HH1WLCJCqILLaMQ4muaX0prY1mDGrnCAbTsoW6iAv96GRwmd1fRnAFQwXsiOxEgUAIHjWL1RnxP///8qKv//o/y/ps6f7qWNDPcEQRgsYn/+1LEoYAMrYltR6Tp0ZulK82UqaDOZ4aVQTzJBpXLfHgT1q1IvqMJdv7A1eBoNfuXu7jvIID00Q4WXCJ/kD5CxqiFA+KVVjsbNKXEdmXFSUu5ZdxATPTWiLnf+olFTxoyWoo6CZqKZ14V////En/VrZ6PJXdVQQESTW4M0qTeZiLeqYtMhqLueJ7ovu6vHxSTm2IMKZCvJQmTvK1+U9Orjwod03F7VViV61RdqmNyhyn9t//6iyFMgrnzbmuQgASZR4pIpMQn4khYa1U/z/8d///7UsSZAw4dg2DsvOvRlyTrTaYeUFryXt+5BC1qnQ6xA1eyaLIotB7kwmXQs4KonCcuL5Tai1H88Hut3zU1Mjjlg2q1SMR1T6UZ6uVIHVkolUPX0Im/s7ISp7742GxhpdanoSnAaLkBIeaRkTvqNf+//6kn/6EBAAAKcAyZEwSQiZ4KEhxQaBREOD4upR1B8zBVI/XIQDnDwfKmQj2hi7JZYpdE5YJNXTRlF5iWutRWS21Q0wz5qVo+rJqp/+yHr/3y2sP/2f/UA6oAKaTcoiAP//tSxIuADA0pYuyxSdFtpS2lhik+TiU4oEj+zSLtwqvj8odDeTFM9J4xpU04LrdfCtepXPYN3V5pVRJUG72ysQULXh8GTrXVqEbN/qdFw+kdu+pJ6lrbrOD8ipFvoPoot1DkQ/1q9LzEZe37X/1mJv9/9D1m/6nOHggc7QEns1ruVSKjbLDTAWsQztyHAiPyKeyfR1ceqHqs7qGbNlG6FQ2VuYaAhUFrClr3tEQACndJoLQqLmNfapkRBRv/1AaDD/mRKIM9SqnBaUm/mRvX+on/+1LEi4AKPPda7TDnwbSzrOmFtfLHv+v+qsOSbr/pX/5x/6cn5Fxh1AkqIhuFWC02FlalSf73YDAkFRocy6oQhvb78X4sR2QjzOrzuX7DM9XOCHXd1dkwvpoyLLOKRRJwTsy71MgYiLpNU9aguQkH/ye3+se3/Wc39UiF//rf+nMy35D7/Z5TyqoACEgAAwoESljQYBkUAKql3nEydV3BowKD4nTHvilil9Qjx2nbSSSpmJ7piBUzRFB7rIoX969SlzMV7eplqF9q39Ysyj/ytP/7UsSKAA09XW2sLa+hiSas6ZY0/P/clf//9SX//+dPf+e/5f1EGCAA0yAaF9CdHHnGNA4rsw9H3sbQEw4JkoDMdPIBoj12za3OyW8rNIXc+WAI4gbqJLRng52p5xHD+Jkn/UTA1tUj8SU3/6J//m33+Q+7yX/lf+t/tgCAAIiJSkQTj7qyZKvsSaaFKn/ooBvL6fVshNfpXRVqJtbtBaaf4gZmptr1/q4jV5Ykj6Jq1IQrGrdaZhiqCob/GgX/bxBkv+VH/9RGb/nv+VJ/+//J//tSxIGACu0xY6wlqUFVm2wphjU45Z///rNv/QI8gCHTKLgN+AkvA+y+EsHtkD9331tOCJtCPOt3mT5v3maNON47++85lp/uUxPHUMRGoZCY35Gyt9mXWRQpWt9xUIS/1rFn/5l/5f/6k/+p//f/nXf9bv+QAgAABFOJwdio4pHNVfxm7WYch+tDMXOBSA2ErNKCQMNWhaUCm7k8qcqK7/BQvDyns8YiVF+rodNcQqUPd9grO/pOPC9C23+rf5AExj9fc7/lE///xe/1fd/xUAn/+1LEiQALrWFfTL2rwWKmLGmHtXiO38VhR+SvcNWxmDbxoWNld8b1qfnrVIIzppQkQlBZYt1Y61YbP901JjTXPMZGFDXQzPWpysxQff2scFiXvb/9wh/83O9I5//rfqWPeTd//qoAAN7gRfB2gxbV31nUNnKZ/ETwQThYVWEaWI6qVXl6xaarngiPRrVAXYeMii3wqtBmClgoLrHM8grWhW9X7uhAUn5v6eop/gmfOpNCBtHk62WdARabcRJSJMmsXCY8SaBBIDUDxGFDGMtg0f/7UsSMAQtRMWFNJUvBSCYszZYc+Hkst60/eFhQAK09OT3fXZey6I+AK5PKI/kEf1/3/r/EwUDKzu87v9Cvr1D/XqL/q/+H+l2p/EfIVRq/yFQBy6EPI+EUZCTTZTpbS9mkpCsfuQiqHIUrVhY38iSIJWzjZG9q1njj/UYMr+Uf3y+3QoLP8oGn9P5U7+Qv/Kf/+n9U/oT//9nX8r5cAIEQWAC7yrxONIOaYg34Bmx6I6tWOZ49cvizO9J+UICNT8bhqy9kSs10qpmBNla+hf3q//tSxJOACkzbYmwwSYFDK3A0kRZ2Ve3VBn+IAlb9P6iz//oIv+38cd3cty/UZ2k/6vcqDadijabRJKhURCnUBbysSliZvzoTaGGSrMRD6ZAKE42BUpRY3tcV3O5d3X63BQTKSdpNq+ppf+SfqHhL/t+UHv+38Wv6f7t/P/qW/yPv7OzoABWABgIBswRo/DPnoUmyupAEZiU0vqpZwWwz0naBhPrJg7RxPGcgkdjCSfvbnvrI3wNOu05UWHzTajwU39B/XzQnBT/yNv0Hf9v5b+j/+1LEn4AJ+W1zJ5lQsUGirKmGHLj/yv+Z/loDKMAAUIpEBQv2UQKrG2B4pa5V6OXpfLZfy2mzqLRmHHgoxYVU+YFaSZYNuh74SVMlOYNd0SgeHI/qKVmeRB3+b/IRFf0LfoR/7/x4/83+g5/+nrEXTREJFP4LtDQvjLIcfGBKEDyVRIbZa4LhYsSj+5K61vIbV4S1Sv1LpnaBakTFrITTHzcVEEf1Ej+ou/o/8t/T/Eb+r/xGb+PfxMR6eo708tURNxlJUqJ4bZ4nawGWcyrVyf/7UsStAAohO3unmU8xSycr5ZSp6ISqjj9RTeCgXnVE51qlHIY3GcQK3MUzaQv3LcLp21JL3qcWeviP/Kv/T+cN/5Q7+Iv9f8q38SUZUrKE3xvs9/Z/ULCBVthlS6MyZzaS2b4naZX3joG1VbxEjgcXrlpSLK8zKREBcfyfoXOCRd7cl3l5IFxRD1kZ1mIw2XH5KORwUY976r+7rNtiU581ZWHwTepCvd2qCUDaRAKJTlqZYJI7UAN+984rbJbE/G6ekitm1A2CSB21Z3Vla+HU//tSxLkACnE5YUwNUMFDpyyphJz4+aJRbfk75I5yVVjJ8oodwNEmXPyJXfrw1hgRVHHZBadBnpHgKtn9HLfpBMMaTIbJkkyNAtlhWzwZE+hrAml0xyrUZDJ4Tj59R72bJUPx8dLmdCMViGIg54RMR/2mOn1Zv7VLlhFdSYMc0qfOcLpoqO2CA5yPE5z/6nf8x0UTKVAiAlHSwZaTLIlD9O8VPJIRJLxYGURuUXbCmPnwGr/+aCkYLpMCvPvbr5VpVp/yo5h45E+dv5z8upxT/az/+1LExIBKVTtzh6TvMUsV7FWWJPjeNf/2kecKGt93fs9CjBd38j0v2iHyiDs2pDQKjUChEFGcQA5EkX0nzUfRCCSAQuD317fwry3Wq9ITM1f8UlbdRnqY6+rmAjLsE2OEP0Qcv7it/xpk06Cv8oIqmZ2iBlXpVv4k3/Of//b80gkxE0yGkk4qCSNwkZolzRqLZJ0C7OR+YL44q8TSYOhh0z+gzCeZXlJEbWx8aPYd6NQI3ezGkIjs+iVFX+b0+L/8t/QS//8yVLvxX2///T8wEf/7UsTPgAogg3GsGE9RSpcudPKiokYUEA0U4lVLyPqELCF0OdKGgsbSBWymjKGFUwrf1HPnBmiQMuW//d3VtiyhqY0M2fI/hfnd1E01Bil81lFRvahULAoHW9RpNj5igxqxiA3G3atRdSPJvZAihBMtN7uyf+PBv6X+c///f/ez65kfq5rRZVUAEYgAAhNxHJPk5KIUlXW6kI0o/H3kitR+3kf7J6ItJ6S1I+VexBk1V+q7tSR6KpNSQzmeoah79whwWHO1M/Fvi6HcvLyxLyia//tSxNuACsEnb0wkq9FOn+3o9hU6J26DXpufSKg/pfU5/v0RCuvo/+oe7//+d/6f8W+TBUdJZkQ03ZI3jfio8lpLEPKd8do8w1A3TdBMw194TANFqVLe7YRpua9WG9fevas/Uv8P5blGo47AYm60spkEArUzY390Hr2QogezfZaXem5kJYbMl1Jfbkh//8uP//8t93K9sNIJ5+NtGNpMqjdY0NhB1n4TgfzwJoZRIXwytxsK8kt7wE93aXX787nt5Z3/OkFe1hIn+6izaAwI0OT/+1LE5IAJ/QNxp6TvEc4t7LWGNbLDl7kD4sTToMM5TQb13Z+ngep/7rLLV0EYDqIz+//mf+r/Hse//9Zl/p/5t/7I/ngAh2gQGNCyuZ2KHYm5NzQsdlrsYaJfZSz2+vu7Sv28ZN408I+NZrRXX3qfGazPXtaQpNw4UfH/tunKItz5Dalu6OgGMfjgf8a0870jKHMuf8Y/9CkG0/6v3sFtb//zD/V/WYt//9H/V/mv0wCzEyiLCyA8QikkrCPQonaElk0I87oi9RUnOhhjZ+WJCP/7UsTggAzhJ12spbTBkqlwfPW19pIrDS6pF1p7uYiUzYt7lYsB4IjiTRqxhKWJqbNPISz/m9XuewIxz3Y47+cBMTf85DL4TxyZvNQk/Rn//9CYWf+2oqgSYVaJdniyvD0VTQ5rzxd8u7gfB0QaVgmYsVo3fFYWxCDpRbcX3OykJJ2/M6EG+dSN/zryByO8phW+q7CIDM/7dF4QGs1O5n+XFgAoDZRBk1NLAnCazBaknOpW5DHMlVN7ebm1yLROYtJvVFBd7ektl+lMs1j3Ztwm//tSxNiADRmVd6exsXGsriu1p7X49zDqncp1nle97AO33GM35/0Wnib/qP1FW1f+/1F/81/NHf/9wue9TI64VNGGxSRpsOO/KnnxbaOzzS+1EWLbl0FmrlAagVPSwN29ySky5XnakxioAhmWToDg5WMQSIoe9ZQWrbniYt9EDbt6Et+CovHeVkgsuReHyXoMTmA/GTpp/s/47IJn6m/yX8n+OO9KDTVqjraSWaYFBgFYciMZ4NYveVSMUZcEyYBNaF6jKpqw9IbWygtrCZDUaVr/+1LEzIAL2Utph6FTMT0gbiTxlp6rVdSxKaL7Zk19OZN8yI7P+cZXykTn9/yyJwC6gMiBpJ4pkySoWUnjxWJknk1gQyXPTc7lg99hjafzn9v//fyYKLjLbop6w6gnETgXE3Knypy5KtVqVmgGcHXhWKNbhvV0JnGlSv+WoSVkvOwV8ApN6r+V2zFGY4i0U4fCZMdnGQIhDqj9w+b8t9UECJBAEQpag+Mqi3BYe9M4s99ANN//oX//hH//0//3AH5OGSjuqDSXyRFZhLkqmwzz0//7UsTTgAptBV9MvKfBrSCtZYOu5iatdodzcoXYOq6GuLjBh3LtdvS9872DShKRiY65wLFFhT+Frqh3RqzeHkgdJ721mq7SuG6FBT+VK/2/UFQLYmgVDZ54FM9GNPRBDtomrbahXN//7//9P/+v//J/JgBCoEIkoiNMy+xpl+nJZC/zTG4rdiDbPTEp1wgpQqI6rWHB/aRDfVTVj/Ri0Z3T7NLkxzjfg/Cmm3n1izkhS2Xn+Wow1ThdVKgk/1Gf/8wEAREBE86PhA/0Bb/K/oAx//tSxNIADXUFd6Y+CbGwsS3w9Qsu//9X//6/////xZ5OACEYZVKFEIFvu9dBAU6+7PHV0OKUv6Yb4oI6IQp9bVLHFmia+bHaGUv7eYvuQSKNfGWRQrtNqRRgKWXUjD1qc0SSZflDP5f8XATjI0KYvsFL1PxWXdM09UvYBILB5Y1v9Kv//zP/+n//H/LgAwAikB0kBYoRDTshSHFf9pRJwYlKKtzcAouJetchyjnpR+C/L1ef5zs2oLlLJBDk8hnMTn7YRl1U3IPNAULr54REMvv/+1LExAANnYlrLD1N8auxLDWXnbpewpM/jH6v+gGBKXAqQRBAemNTHhUy5z/+Ir/0f///V10AMEVEgMhUjRO6cUNu0wSH3ef+AmAwiWRuheIiXK4zlG79Dbl9DL6T5I/D8ttGpVIGb5QLig+jXLFrSGmEcSYCLgNMVCNYlZqP1b9f9m+g0BHHi5aD+pv5d/////870gAXkCi6S8w4Yzz/EVOoa9FlbWR4wTNFyYm3eBuKE42KpcGGQXFsGxJp4d13fkGZtw0B6VJ0LDXYdX/66v/7UsS2AA1th2mMPUnxlSDrqaWe0Mm1UGe/tfLHn2igD61kAQDGnMZBzP61GWCAAFu3gU4OpGQ1YiE6ygWwfasao6JDiNEiGXQPQWXwD4T4lhPbuVU0jBYZkKJPKm7tXOvcm/Yr9FqxbMqMq1uOpxBhp5CBKHHNcqx02Sp24A3hCAAAAUpcOKhpsDMmdvTPtqS0IkbyxAhFolUphD1+jLGInSXGbK6xzPmY11GBGaR4wqfDod6WHb7FFziVBWLB1fWa1DdCbw0/c5klpbSmiK77//tSxKuAC9zVZUwktoFKkOxJl6R4fUoNLaIsJJtS3jK0iT1eJZMHDKaCnR8i6SllX1ehFFrXEyAmISGXThtjejb3LcYcDqyr3pSQTfiTmZdzWTSCIHCLhEBnjhVzBx873Lt20eslNHkCvioEkm5KRo8TRXTOgEQc5SmgOBHfA4mTJs1o3hysplfFfduj4ShG6N4k5vQmhGctCNrlH/9pgQ1IoBxj4QRshQfCx7hVPWGwZBr/+4Uo1flaAJKTUoysTcIu8kPyJAnAsUeK93JXdqH/+1LEsIAKbN9vR6RHwUwOLWmGCPg8FzAOoNcOKFYa1Hhylpq2b5TPWkx0mkPRs1vz13EwZrVNa7P3bX3Uv5mtZ/vaT//xDkAAggFJOVofYTqqPBzbEybydcG+JASJKHBQvJ/puIGz7O3mVIf5Mw5Doxanvog6MIysacv6v363PiAq72N/RBHead6majAe1kgeiwWUPng6E3//1RQRIBSKMLChoE7YywwtpSMOlLW0xV2S7ZS913BaqSUqX56FJEVAmFVqSF7OggxNau5ffQo/z//7UsS7AAoscXenmG5hRJZuqPSJcl+GAn3Y//Us//0BwyrliI+5OQ4vUjcxXerIpIPSEk//p//lBY/6T1yVRTTUVIG5EgSxxIU1KljzCV9broHBjAy9Ip75vS8ekYTidOtD5k/mmRLCwx+pp/5P+pyeGQXhQ109ugkGf/j4UIh03VvFhTn32oRoRjX/+v/+LhVCib2o6iABFNvNkA08oY9+XtoGpQ/F5jVTTOcYE+Q7+OX8cspMqWO73ONXjbfqu50Ki2/b84s3uxttTgKq3+2V//tSxMeACVztaGwM75FIHW2c8Z4iLf/iltCG1dyQQDMUUUMhlKwEHGH////9BxqxVaqu0SKMz4BlGO5lcWMX5RH1+hRIFPRLoG522w4tSoKzWW0FNGo87yuCJaxwr6Zm9j3dtSeihWT/sUE5S5v6EZ6P2P0ypf2qDDCv/8OqESQAFVoHAE03he59XEFUu/YbmYQnIpHzjbz9e4zrcwMel+Wna0n1EGQdeqqFXRBlmQi+i6TMRs6kNRbuy/unVCFf3+4raapdFmDrEsDb+kAGxBb/+1LE1wALiWFxR41S8WssLyjzKaZnwsKSSbtg/zW2zYxh82xzrMn4VLMN4/C4umUplYFVmFctYG04/2A7ks8N/ivl3E4DaONsRkl4XqgwYyCUf89f8VeO7pVGRjn8o134hdZj7otilhlQYVuUKLAQfYfIGD33lDRGBF+bCqaSPE1F0WALBRl+HPjuc3Epq+/coJppbq3GCRGadamMys57yxcoreyp5+NAEwj0dHzoYVTkCWEyC3olRGMGXZPTJiaNrO2+Yu3SX1XL73Jvuwxgx//7UMTZgAqBYWzsHFPRPaSuZPMJrptL9XN5cIKCSUtBVctxpMtcJmaR8LZDjXLTBScsFmw4uFGvPuxOLHAm5VoI36QroRUamowLzjzygHjIyLUC3ziE4FaZ+/xIMamvfKfdOtAvFou2RyhCSKvPm0mD6Yp9TkMSlv/x4flKSAQH7rwKiGmwLAzgs8QxX8OxbcKI0ECJKec2mO2fl8eeNoMwunBfdtk6tTV6lI+48VNPWHAznmWJOClI0C87pIGajcpg8ECpBTHHQfl9tWirusf/+1LE5QAJ6OtpLDCn8Zcg7WWEif4bt//9f51/rb//8qNAgA0XLxCEN6nNVWUssUFMtahuOM3geVOvSPLhRx1p1av2tSy6xr88GOxHu7CkT5hn/PeiEyESUFiojAjREU1Q0uhm/lwYLZ2n5r679sLhFq1u+/1b5pf6M/qv/xcd+r9FJMl0FSy24McjhroSe5nF2ekMK9scy+r6gszwospiVjRmc5I1fu/jy6/xC+P//mXX+M2DHjzPKVyIVfTZaQcgfpnEx/rOmneqBRC8a1aaNP/7UsTogAvw328sLa+xiCltHYeo+tdx2JamtrdRkGlaXm69ef6qJ6yqhiFJXlX6V+7X5OErf7/tf/qPkysMCY5bMVTxRR+2zBcqt8pgWTvBIgOWRjAxceDcKvRpj285Ok2P1mbKf5n1rRC6AjQ9ESgVIAFqaJl4popidOpNN97oOCGFZFkbnb2y8e0CpR+62Qgeya63TMLVVv61HkaqhjFDvSf6f/50eX9z/IfoERbsahSkkjx7uwhi6X0KSdmhHH5s60/TJ0uo8U6IU+qdDYrt//tSxOWBC/FLZuwxp8GAqSwdhqrI0mTTL4bev3U81/vEEIEwtsLgaYieXcUgGLIHrl0vpCHAohEmVNnRfWyysoTFF2rc6tFEE5f6b6NbL61OlsmmRnXQoP9f6vnSB/u8v+gAv8FBgoyBjMlwNdYpOgbGhgUBlgu92LxAPGM2rQUFHI2hldDhGkHCixgwifsYOtKL6ZwCaSy8aGbSGsPKdr/rThl55y9Dt6L5LnnC151MByE7FAMD+iREZsWbtV44r+yumcnN/O9jp2BzknC06X7/+1LE44AOpYFxR7G8EcepremEtWojkGkgd7z3f/UQApKAAAFWYYh0nUZk98oYRJohURrshtNxO8Vmxprf2E97e0k6EIlzrMU1RZkMsIHeootFZHQkhtvMaJ0ZUMLw6LGBd4lHNF5Fz+6MzrGt0OrFHrQkFKS4mB1thjKhDjSiqZybGFWjgblZtTPkILC590NPznFUDg7oQhXa6vrbadjbIr70Fv2/Vh1q/fytY9fZjmTa/ZGCOS9Widnl6OYdu99aBQAAAVOAWA0TfMST7U+Qtf/7UsTOAA4hTX+nrbGx3x/siYSw+f2Mzz6xWhS/xGlaudgCP4obWHsd+IUDNx5UTt7pisxpKBp+VBZBMvXng2i8SFk6oZZGLt1ruW+INqt7v90p9TfR+LIAAEJ3q2jRYCcqOzyPLfHc9acwR8QleiJL0OC3a/SqC09ZpYFDEi7lwQ3h4RgyLcgIlt9eyKCEz5aWVrBCCNnQuYiRXkxCV9fziBVB9Ycp9TG1AAGFPg6ac+b3w4lJGpuM1o62Xli46Jy24G2Iy/G+wTKMwc6oItJt//tSxLeACii1b6wkp8FFny7o8woSu0dxus+nr9f/0OZ2NArGM7iq/+CGRU1ftP//b/6Wr1W3P23c5CA0arUs3x3DgkCk2sKaUR4Pmh4UURSP4iZs3zMMBaxtUbxLvw3v3f6O6W1CbmDwYY7qj+OUZKEe08pVt1tQ8oGXRdPze7y34YDehn5nucYv/1dtv///f9EFmWE02/FhTgokUiykkSQqTA1ySoaI+Lg/KU9XjI1q5Usyb6OZj/mitm0kP3SR8egm6d+kNFXXBQTmXvoQZZb/+1LExAEKVH9m7DDNAUcUrR2HjPioobbIkVaf5jnhqjc5Po2iT+zKKy//t/+n9fmf/QjFp/3SzIxvbrNPYuAkUBTS+WHGktPak9xCN+WiVCWVyMITpgUyNq0ROrl06wndhcduhhFa8v+XAxK9bKYfCeULpIgjq0GZonCSl6xOnXVeykTJAWYMqmrrRU+5n3TSJR506yAF6XjduyLJUkSNvSQ9ahjFjq5x6uv9/mIyP62tW1X/mv6qCRJUSSbTTio7EQhCBwgi6tKTu5StKZooz//7UsTPgAppTWZMMEvRYrBuHPOK4vQF9H/i8m4EjhNXdYi/TPrqjUfUDGPNH9dQ7QxIElIXQFvvohuMcdzBrpJHEBdFFNrWq9nu7IGalLOHi+DaOq9a6nUDRpimI5qocwSw1MMowg7env/KBZd8l+eAYkS02qBHQoOVTl5YhyFcNyKcGmZSR1RlZgykw1aT36zjUtH67I6W80104fU/w+9XtsC8dwlYQVUpjAPV1FJLMg6jhQQ4vL11O9dRe3dA8XK1IpnA8rt3T9SamZNVTJ2Y//tSxNeADA2Dd6etT3HksGzZhjU+azP3Q/X/+op//poft8z/RSwEpIAHyqDMThbU0J1oTdzAKUIjTm2HbMWISAQKBTqMByFEShqAYcASTESvLw9x/+B3Ub4XJtbFigMp7lqRJTTgYZpC5SfxQapmnEHLIii8SNKAh/q4oswzflPCSMlbmzjPyIqlr3eh+oRAAF4Y4q8Xiy2CXNhyIKUS5POJWBXHZMjp42ZKqQdbSLyF8o7sdDZXVvzHNz/sK1H13z6bOWai0KB4uMCRIQmpasv/+1LEyIAOiUt5p7Va8cGwbRz0NxKZvaNLOn5tuF1qra7qAwEAA28HkBqJQl0MQ0ttyxqE+z0FCkqmTFOzB4eE6vfCTupQFIZioJL6vWYay632MX3Cgze7fN+uzkFzZFTbjvWf/+Xf/2Qw0No9Ys60qAJKBYCLSg9QvkerFQ/SliwMawvCgRKIYC55lfwkahX+zuUNZEQl7aSpVneIfJfVGr3HIigMCmeZ3Rt0/2dhhDFXIVqK7lL3pGv/8r/+8qTM/voUI4GARCoFlQ1QQ9Vf9//7UsS0AA0pE2hnpMjBPxGsmYYZWHLjzR4CVicckaIScRwd4Zu92+Hy65DJhaB5C1K8zdTJ0Rv36Kn99v/iYuExeInFJikAyMH0K7IMyG///+Jf6NYINR/EKEi0tkYCzo6LhELQnPm4wZClo3aJ+TDRoVQOH1kGmN5HOaKhqx5w0ED+v19Eb9M8ec1uqf/+UHxOCJAos/jRS4uY0g6FnQLEN///8d//db+oaKUEAnE1vB5CavWct0YbArUn/AMmENE6RU4+ixvZuUg7j1RS6D0r//tSxLWACdTHaOekqwFNHu2o9JVyavCasw4wV1pGr1UoNXU+gWFiGHZz8UC85Pu9Cbf6MBUSDCS5o6YWNDBqK5xyFExWb///8p/+Q/+ZFZL5OMHBUPBQJGZYVQRB2FvI6qFj4K5NiidD6utWa+A6Gq+tShfDq9QcdNUrTgHC1S+2HhVu1yj0sLgUmojpZlcKw2PstZpsfjqGmVSYeouEWVYnRnuhIMB+7HC808nXiq////qQ//iP/2EVEZSzOKiRISh7kFOIQPw51Efw6TYWoGX/+1LEwoAKVSdq7CSp0UQk7qjDHWLkkVmmtXeik04smsSaxADwpbIMBcOuIQMCI7IXZv+SGu/7+XEINwi8V9dxX/H9WcI+sVrbK8w9xapcSwSN/8t/+Ff/KCA1AEOW2SUa+yZORKabi8AKTbkx+f1N1rk7hO95QMT0sjax1wlegC1Qg4Ke3aAdWdpLHsZYWK3Jv4Qdm3Umgiy0dyEqwfkMKmYlU3ZLP3PMO5LI39u86CP/1gOFYIbrThxoDEEwnku0rdttTs+sx8svn3wyDxIUPf/7UsTOgwvBKWBsMOmBriUrzaYpeIwpm/UiVCaHfBN5mHvTJ0CABdsd0KvADCKiRO66b+78RJwyNKaE+QQRQMGAHPiruT2OfngQCAAdAEI+kqI5WBzqllXzVqGyqlA7ai6jAiEwUuYZINFRBMqPHwP/mr5mki2n65WaUOUkEWKHiIOKEoarbYNUkbsBp5vW7Qg8iLWRK7V5V1Uhr4SiiSFDmeFO+Zsl/Y0VRHynxW4GGNRUYj6mke32j3ZTm+N2UHlNvjDe5UmjGOpNHMDAQejl//tSxMeDC1z3Ymw9A8FoJOwJgxZYVZjOrdFV1mTYsoIpo89OsO1/+4Hnbf5Yw70+PMAAEgQAADIskaS013W6NLkb9sLaoMy6gF2AkrqewVby+QBGNGOwID6XG0JK3nBZl59XohUnrXlC1kZo6SKg7ZvVjhq/+z/3k///5r///lJcA8z7Or7fUgUQ62CykjVuLuaKFQ3RppKEwLtQRUIXn6CjbJgPv5IutAFgoqWocl8Rhhc3Wpf6aF89GcrQMES3zVCn/v9UY8KUoqcdf/Eyf///+1LEywCKOOFkLDBtAUSS7SkHoCDlGGjnHdr+26iz+8t/zCPiogEoIoApSCDmUPlUuzrU0qfYDawSkSsPEPTsrv2EFuuQfDVfXNhuI7mDyHHe67pypduvTtteY8ef/Cwd/r+mgPf+Y/+ULf6N/yxp1dDWOXftG/+zf9DP9zv+OG0BCBSWikZAGULcsj9nJevF9QxgT9lGlFWpfeft3mnrmzjuGrU3rcO6Rj6y3m1f9tWo6iqUbZaM8tS3xOYdrO/MkVJIibpW9UvAy217z3/Fu//7UsTXgAp0z3dHpKuxWCRsaYYdOP+cf/ct///LI9vb11Mgsb/Jeo/7fDwJKFBbajLQlJRLvZTOO7D8JmJfF1P5P/Kplmv6bXPmu2HdWn2TB9vMq+jH2ZEmVmN++8vYLamvAjYzLjS+S6+ZdSscY40NlvwNgp0+i/5ULxv9G/yMt//+hhOn9G/yZv8r/53/T/lVEiyg5HIDPM1R0aAsDVaZKiICo5QqUrIwZ5jA6y/xlf+toyIja1ETGUDY6KotUnnWdCog1mE+q7BwN7F2oSZN//tSxOCACy1zcaeg7uFtM60o9Z16I1QZrmgdSgmpkFPpkJ7LduO3+pRke/yKWf9/6Kh7Fv+7f5X63+d8h6CuOJiWSwFB4OeD2ah4NJ+YkSRZahP1y9HezNHfIil7E4FxHb5Fb+85NyoW8k+V3+kA/v+V3xi9m+f/DGazi1qZNZWXqS9lUx5dt6jJv8xLP//4/pIum/tp/WPqaL/rS/5l6XehAghwp4CKAmIYPApDhdK9PEteLEFXpClHtjuzApRz298AXR3bx7L4h4fV9ek/vUr/+1LE5AAMvV1lR7T8kZqzbTWHqbzqZONuKFKHvvcjORs/lCJ1OdXkOQcpzv5AzvoRTnQkhPHf6/+Iu/1yWAqBkpcWGn2Y64j7yqklEPSwQkCSGZVQ7FgmEshI697Qpmqj6B6eK1e7uzk1pFFBRqptQFFcU8MoxcBG5/cv4fDXKcbXcvmxuFIsh6Ldq/hVIwAAA3sFKfQbhOlYqR6sohrNkyC6nfV9BRrb2cKyxzUhi3GcPt/SSmp0znk/GlRuGe3/0HWOl0Cj4r2JEABe1L+lQv/7UsTbgAz5SWDsMafBkC5uJMW1/pOW+l7NQulQoe9ldfqQfwEkFNwxHYvF4AYYD+OoBjk9Mhn0BEZouRVjZd2ACkpAxg06QGbscQ6t/MGW7IU8GTl1fqr8+6npKW32aGGywuT7xrrQ3ziI1nAb1Uo4jfOf2aUDEIACA29xBC3gUTiSR/qNDxZUQmmIu8HEeMg6vmpX0f7Ox7DllKPFnIdmVeqWhmtS9jq+4W41/tKGp/ynPS8mhuL9sqGmu4IfZKOr99R/9v5/7DW+o9raM2nc//tSxNOCCs0hYKestMFFnG0ZhI14CrWh2tYK6VBNFJuDQLYdB/Kg001BHwwi5DeHar56P0GhJkhyBAsAIIqERoe926XwgWn88qfJDEbACaEUPtSkfzPO6dzy2+SranrIgpoeyZ1/1kP27/sORkfrQ/kz+pv6z/t5J2v0KgDJIWU02QDKUQXhPWYp0PJ6houZNi9MyLNusQ9WZmo2R7dKJketFNvI5Vtj6V3fy49eBY4urC7YzO7hCWuINaUf9w/8MblA631M/lSb+j/oK/+38j//+1LE3YAKHJFo57BnwUuZ7dzBimLoQ/yo0/nf1N/r/lRJoaSSJTVFYkBINzY/LBcJK0YWKwfU2EiVJaqR7jFZJDdcImkyspY8wtSBtSp51HH7GJPNyunyDfygf//8qNP6f1EV/Rv5Z/7/7f/80k/r/kD/1wZwRBIBhuJarNLNs/h1p7hQe+sQYjAUEQqxPzCkT1kQj6VGK1QmhXlcqyhpsQe3WTUa4CA80oifpZtWx9rKz61fJ7dlyeHp/1t15wTlrbTmvtKP9X+c/UdMv6kf///7UsTpgAv9W2dHoFOBhSdtaPS18uo91u4c6ugAlMisAkswGB8jCYCxlhjoN6byoON8pn/03Fjivz3VLnjhu/k3uKY+iqWRk1A1rvBmuxnajHI++4HBYaOe5uQkPtqpCoa9NX+wgEtPnCtLFVZEJ/7/x/0dT/5Dl/b/UgJoAAAKsuNAdQx35xsbG8U8NzxCefTeXoqBASrR2eEfKmvTR21Afvjr9Aj99BKd0mNtI6ek7aThdkwiQc72NYk4wOxih48iyz08/ffxeZfHFGWOB4vC//tSxOaADBl9aaetUaFMr+2owynaKKFsIbFjoOvHBdywiAAleD0bBYFKj2U4ms7WUhFccEJ185DyB0lnaQsNFRuJtWfr0bplU8oiXr3325PojBudRYWWDgI8aTSBwcCCHBhNl6we2KUfAl39RDIvPun8vL95ebWU7nPqBTaiKIIIICiYJ+X2MYtVEUhmbLuGhEH0GC1MUZKRyvEGqzoy2JEWa5KFEYf/vj9qSp8dH7r43761Xm0+SRAJkSnSoSfh1qWSyux2oOkSHlhg8bEuWd7/+1LE6oAMgVtfTC2vgXqi7PT0HjTRGdsPIj4NLGgzc0AgDguAJVcqQ/0oRlRlkrGE5y3JJGBWipy6pSWpjYB9ky9mWzFZXaA1/nX7HYSYOWvpvIiaDMscTOtS64wtB8sZBlKaxaoxao6qCelAxIsMU44EFTgLbLESADhjXQ5XnG0kkkSoippy8G8gTxSouxiH4J8gBEgFWCLDUaQ5K6HvlXMM1PjIRk/Mip4m3I2vTPFnkTUPB7EkLWKk1OehUt373JxblL7uTb/qYkiMjiL2D//7UsTnAAvlJ2lHiQ/BcI6tKPYJOIl2AQys14gOSYBAgQAAAFxQhyC9r5Q5FWdUz7IsSuA2xPtQA2BCz2HnAv1dBYDE57UNiC4aGJIzRYhnPBFzMpA+dMHubldPaw1IvlgkM09ZMp+arFDW4Lk9YuL5cHxL/WkSl2tQTTclkACJSmELEV2JSt54eFZDLwbDnJ0CKmJNbFrBz0esPFnGZDtEsZmcjEqjp5IZjMRih1YbWZkD9W9+l3m6aHevJf8n/36fR38yS1OdUDObNbN71vks//tSxOcAC9SpeaekyLF8E+4k9I2eHkHeislCY4VUCgAAUnXwAfm3eZlkODu0dmqGPRkDQrHkAysf+VklnUMvsrl0YuUSpFvJU4lFtRUDcwlHnL1OcpCsr00mZu1ERuSgUbvrb/8mQIUyn7XvSTNmxAz1ViAVLFEquWgCQQBCfB7P8egka0oTqXNC+TvkahjqGrobJ9mC2o8ExOx83aK1r9TXw7NX0Doj81FvRN5N6jer27+Y1X6toAC9M/crd+wh/t/UIvPV9Qi9Z07U7DoPAcD/+1LE5gALpN+Bp6RrMXKXLLGEjZhChV3cRSmoCCjAKCUS48m+TbeZ7WdRYYLtj5oScyWs6QLRtXRXBbRbag7pQgeSVGPU4Vt7YLDlOPRKiglHtDJT+v/UJv81P3CPv6zzkNnuNSd/jjv7zzP6f8q32QwuTALgPwbRFGVLDTcRKaTaKJzAYyGHagY4+1Qp7IlXQFQ3K/RKI+tG5zJmvtKnHpz5mfyv/LmWe/UdLhUobpH1LeUqTfXExac9v9zcEP2Ym7c1FAgb/M83lE/p/q3////7UsTnAAupcWtMMEXBaiCs6YYIuDP3QRjg5iN5WLl2jk5B5MEAuGHOGHvKmc2WfJ47QxzZG9JK1JI5RFzH6djAXxOOd8QjqWF2/dZpcrXFdV0/+7bECtiyv3bDc0ONfs7SplPv+XT/cUgP/dd/Mv4/2Fb0a/DiMv6P9KoEEll0KDaUwV4HniT0zr9x+BqXrq0EDbpnmcmZmhk2YIDREGQIUUflxOyWXSjBKMczK+7MsPkOPjSz3oiXOSfP21GKqdxra8O0ul5X/MuTQJb3nk0C//tSxOkADD0Dc0egsfF8q+2phJy6SO51REDLzr8kn9y77hL2GP7lgANAFhB7FVq0FuokIvplr+BGRB5DA+Dc9KglAYjHkgAunJhadUnQ90a+1SAJtI9Tg0YuWgYF6uvpRlHP1xCb14eVi9sxD6IsaWguZRsLYgPbpDk6QAEAA2oj6Lkr2fd12+UFcF0lzNLuULqzbQ78BQ428/VEyBsKalvJIMbGI2SVVKNt79kXzcykBFIsROREm1SExOjsqNWu/+hGQYWjyWMyMtD9RqJMHif/+1LE5oAMiV97p7Dt8Vub7FWXrLjX0f/lJL6EGtLVRLJs41C3Cx9EIZALuh6AV0qtSa1dNqlA7ZEjZrjhlOHlA36gTvck1izPu2Vd8XS53e1zKlqCjqlgPl6Vfvb1s3e2gRDwIHgKGMQICagVCIgFfMdkDj/5Wv/8X////Yw5u3oZ6TACOnxB4Nrk1p3XUT1gNrjqrKpnjlas5YK4GrDtUSqOj/kSf/FzVZu4RPfvy6CPVPciZcwek5jZQ+j81pIPR1Pm9SR/f1FYsJQCgsD0wf/7UsTmgwzk42ZsJNFBTZcsSZYNMGRq5KRC2cKqocYhqYyb///48//+30YkD/9QdGWKUrBIAiyUMYrSJIlHp4oFwom5PKGIqypNp6sHjHRfRo9rvLJU3OB2XKc0jtpX5T5TfW2c7r/7f/GoLgAQemjCjYgOjApAYIhxIRUUcKDzngBhlGJGVqrf6dAXnN/1O1RFXlBKPdfwqB01AgCARk8Kzl3pANHZ4xAuu7acr+sJaS7rZ3JQNijJbD7UrSLsYZTKey/m3X3nZ7i1xlMVw62K//tSxOcAC6T3ZOyksQGbq66k9ZY2pjB8dZxqmewmxrbxHMniPK/1/x//8/QCwuaDSWqQVDxQcAmHtHnbGWlQxJ0///5oqf/T6fKu3/9ftIC4QgCYjCGAbfiin1WsfL5Sl6qVhb0xtx5Q+U067y2KkTpbi4uko8kmCzWzWDZCD8uiPY8nj9N1L+LKanZJitKXy1u86YhK5/5r7L7j+v+QIRMSy5R5OOHjN5mA9Lx2ko82tZ1AuQTXb3/ppnkf///2LPX3qX/59h0/TSoAZUiFMIL/+1LE4wANdVtibDFNQZ8rLVz1neKiC4TjuU48GKb0Dd44/ix22i8Qor8Ll8A5zfcIc1pGec/dyai0PpZusOWy4Ppbb7/f9s63uNEkPlZvumNOW/nTaU9749Na/+XL4/rr/GqF+bVGqVxEXKfUisZmYJcoGSHMp3ascj8ZyIImPpWn/6KwlP///5EX/6v1fzIuANIEsgGFV1R9TN21h500kqeKU8QkkSv1Le5dPU3yjtx/9Kq8krTPziYyo/Eh6Jh2aea3FVEVT60zkz/ffvM2uf/7UsTXAg41iVztIVdB5zFr3ZWqep/upjWU9Rtsnumh/LDIwJI3sXcudLBTHeZmBgcMyeTD64e701t9Tqu9igSslG//v8kZchCUU4uj6QEAEBQj52dNZajDUjcRuTt0zPotXqUXnBocv2lIBIzYP39Wt3pTCascpPIb9P1erf19fifDB0lrzu6z8o4fv8Smu7PTMQswZJpNNoKISmmKFYYLvtEjhxyZlwP5A/g2KyiJIBLUAupHrKbOVDxblAZaEvDqWj60PxDAKE440i0uQCuw//tSxL8AEEGHZyy9U/HkK2zphZ58K+HQyT3K0fsbuTcAmut//I5Ct7IZBhTHqsvn/wowo8KoCPEWFus7BX+JolBItRkqN5qQAEElQu9g5bFjWkJVR1ZXE6kNWCdDJNpE9CumJ78+XATAeXSuT+ShTjA51sgdemmq13DHZs1neXsMbawimCrh0VhRBS3ZlHK7mfQXAAwAAAACUlBIlChcsCJmMcdaOO3ApSPRzItBaaMLjLT6tKID0WlkjVNcJ0XWF5BvwQ57Egt7O3vXQsn/uOv/+1LEn4AL3L9irDDNwU6a7ijzDaqfI+oUVJChCjTQKBT7NUK2QJX9doYqCAAAU4wSVJ4MidhwWPsRjLoV5XKVG7EQLDNKpbili9DW5rw1NULVVLvw37PuZd85B8s40kzKGc9/TMkZdeWbUJBEmbTQquxzvoRfbz6sv0dH/39PQshAASJ7deZGxKErxIpxEkpI8diDZRAMZdC463lpdQKZqwlIvVojZNs32Kt62DSyZhKNTPE00SKlyWp3AihIuc2SL8wLwlfvd9g7Dot7K6BP1P/7UsSkAAnAyXdHmE7xTRZtNYYNMK+odr/8uNa6DqUdE6b+6zduj4zDor6m1f6zBvW6W2pyFQCARJybpIE5NtLsWEWDVbZWAsRCOL75DE2/yv2uOyrSzjucA+8tc2F1Sm8y73n3IqsZWR2zVWeIjWKsSE7g7iYxKSTfQapRFFu/Q5PEbCEQZLVojFLVoo98Yz/6jv/WOjf9/X2Gogq/9P+qWv/t9vLhBBLTgXQLlbd2GFqmZPJnHuPtKDpZomTpXsRKm7W/evm7MtZIflmgZjff//tSxLEACq0zZOwxTYHEK+xdlbX4qTSbGpYUTMXcjQphzo61KBz1ofEkLXPPz2BYD7XpqFs+nNMIxix39Tv+g//8v/misNL///Q9P+nlH2kbehURZECEm4pAOg/W4nJlHSPxyJzMXNUuLk6gKVZURcHh1QYWRubv43zf2oPew9aZ3UhMjn6XPKZ6cHiDg669J1iFFK86bWsBzAqpu2i1RMHVO3daQn7of1I/+c/9/7sZliv1rZT3/We/p2dQEAIoK5xG5p6sDbr8W87dC+HYBj7/+1LEq4IOFYlg7L2vgZ6xbE2HqXpMRmCcXUk2gJTkxWS3o4q+2u/0zfZbAN94qJXZvVSIju6kzqLuPwQzorN7Loj6IpF1Gnw+nv+o5ftZATy6nb2Mv+om/9T+6mzp7/6/2eb/12IVAAgAJfcHTFInlddg7qOBDgPzKhcmEMkaxOwgcRuhBVc1bU6jm09khMaCNRGzzOhM96ccC4REIlccyWH7/dCiLYERHqUtJvltP5d4yd3LB8P2+rfvi75IEE2sf4as49Z3pK/dDx8XesS6Gf/7UsSdAA01X2lHra+RlqwsHYY1eH+5RShckxhodjbdjtT2PTsc38XX7o/t6PzWO1bffS0A6Pn/QCcDTGHNUDP0Gz88/Wqt2xSiVxX+LP+vNA00oWSCiSUpcIgjKpgPAFxrfRHrCEJX05DNMbXBVMj6TSl7xZk6Z8p09RE+UkIoZozDtzPpypMSzfmKYhGJaUXoZ4qFyLF1T9Pd/QbGCjv2zQzUwEtFNymyWonDdDFJLsZG5yk8S4IrJyxWqGx5JaCxilzGWR1EyzsW9B6eDBKZ//tSxJMBCtjjZSwlB8E8m61Zgw34G87f5mfBt19SlxQRZZf4PJCOj0BA5JD+4AJQ8yEDN0VSTyK11RAcQLaTa3ChliG2hRlqs95i8RRqjYeF0RdzZhEktso7sQCDlOzMsgOIhztVzVGk0kutEFqtKUME2dT3Ff/Y0tO+s/9tP+v//62U3+v01f/Qi+Dd2sAgAuwY2yVJF3GkqCKG0B2H4asqsSzQoGZPsunOsVqhtdIT9eDVpW7JFbYtkDITLZmpQQqn5lZUeMk+bQoIZzn+wVz/+1LEngAKJNt9pgxRcUwZrqj2CDq5+nsSf6lP+v+g8LfRW/84XnK3el0p5o8JPb5REggQQFcSxDwL0UYXShS70tOswmxtUDmnILVVlkeQ3rdGapIuGsV084jbCrZi0KBlEqjnKKt3r1K7u5S7gaY31YKjP+Yb7eR///QeLf//xsXe/sZ/oPEH4r8GPd6XndnTcJBTMEGoXdRljXlzEPCIqYbUoXBpk8S6v/35b2neE8QWXPLctM0KMFCGrVY14NMfaD3SaAtXpdOiOP1pIxtLcv/7UsSpgAqJX21HpUfBeilsDYeo+CAkJTvrFIbe/xN/4z///cY9vb+yBm7K7en+ITm+tW/41Rv7/8oqAkgBCJz3eBRcCBlvwQrC+8kgKCGh07/UmK4k9YBcN2vZWW37opk1EjRn310w0Xm+tPoPPeFWJHz4O/IUutXjdFnAeOnm1soiAVENEaz3nsjubKgUCjK8xWQXj1F6OoGxq3NtX/ZBOIkTTm3+dGBdvopX/oOv7vAhdv0d1V66K1pTw6Gc5YK7bktdRMMy5hRd2Mun1mN///tSxK4AC5FNYOw858Gis25o9R+GpyXkZYXlzuS8ObvYuk8RSY1T6d6AG74uvpoand7J50Qohl/7NV/v/V1A497Jt8Pcauu+sxoYRmvTKnz9+cD0qqmaZUk9vYVEuj6w35/w1SqvumqWykUD4PEatVjiVNQ+Wsny7+9S/owrzuIgbTJpfyR1/1zqIiVpZnuDR9PqnIAMH7II5h+YeHwUF6apZJGCY41LVhxIoaxhJqLLDFpXTKBi/9KZGiGX2YE6N8sImBmDgWFyMWWJEjHKco3/+1LEqQAO9XVjTL1NwbQpruT1nn59+kAuAsAAgFhVM4LE5l9o2GXpmQigSZVFJOigSCIxtWNOrHg8ntmAjwEYyPbP4Z+XZ179jve/f7PJkyZZOwICAYP8oYWD8TvpLh+xxQaD/n1eiIHY9QJWEAAAEgIQAFq8JGTD8UOoY4lk+O37kxhawqmRDFOrQH00LBaCDyVTto9nqFphh01NTMLHdlC7HUUc+ektx6RiUaGjF/SCjxEeEg8NUw6vEq/0C6BABTcKqEwoDfh/4lCZxo8RPv/7UsSUgA3pO3smIHHxTRLtcYSYuAyKRwPCGkBuq5z1pof9qqzt1EUoURYK7VLR8zvrWxeqlrvvpt+yZlpGBBbhCm7BcuYWgYxSFGyJRR8TvjP7/aoBi9QnumyyshAYzOyhO12Dh88HYpFc3PSA7FcO5qjPgGQtwl5VJYghGo873Ol7OrGEIqNvrX3gbaxwPD7T1Ou5fZ3WUjhcBGFkgj3PQyYd7G6P0AiKkYC2L1qGKKpCs7l4CwrNDs/AqdcriJuA2aHGWQ6eC3VKYTi3ZnCb//tSxJEACmSXbUwxA0FLmW2dhIkyONkbUfbiDZiXjJ+dHOGzcLV76wIoShtLllQOBqTyhTJvoT6HJ6NwPgIRAAAKBCVA1nDC4YZ5POs0dOstLGA0+FUclri7IqsyJx4JS5MyXjfHql/2q93192rOdaM+5x8SzMVW0TR3R+7ZUVaOkn79Xzf/uCowxd1+hp5RsEViAZ5UwmYp9IOO8rx/F7NlyOt0pXOGo9pLDEs1SrIKnCrYJbeLM4MWZVGsOB9ZZ3GT2OGcW6ZwiQloQ2o6Wa7/+1DEnAGKXKlkLLDJgUQSrJWWGPg/Wnq/rELrWof+4/4Q7Mq7CF8AApaZjQ22w0F2G7ryuEstqE1BTCX0aQtWOZiZ8sMoOO3T7T5syxpqg5q6vj7Ntz26n0Usn/15wi+17/5JL/u01UVwmFhINOnQhq8r7OrRb9Akkot4zAaM5TxzoKI8FG2zNspuKoJcoKSMgZxdNAzJty4G2uIS8MNruVTzVrnX17v5U23rPbqZUB3Vv/zf/91ilz9PV/yGgFjRudO8tpzCKCQEAk6S+cai//tSxKeAinELZywwScFJm+wBl6D4cTTOqFqINxkyJigalA1ol48yhy0i86sWZowwb6u5o9JRaTH/hS5qzhueEBIbCO1MfV///B71/9Kg6b/+fjT/T/Ex//dfx9tYyHQ4oOdehAAJKCRoJ8V9Cw44xdzBPpnSx5Ga9Jm4qV7kHVtOeVYzRpZJpLDOTuqec1JzKabRF7XxjIhL3nuNKs8+0+yaOWutk3P9qBF/tzq4BP/6eT+T5H/X4rU5RhCrdEtVKIFVSAHZgRHSCUUibkPvx/n/+1LEsoAJ9QVobDDnwUAgLdz0Hbr/XFbR5fW6PAUXP+SIEOcO9s6V1Iqpv6qV/PsvzKBVDV3YcNKnCWOD1DzlNUXEy/3+9A9bT/0lApn//8p/r/oTf7f0IH/0EkEKCkZHAKnSulqaNd3hxeHKzhVsHCNYkLg+90tEStEiFLfWR6z0Quum7uqmiyzHz2saczV5jv+Y7zUUhPIgwJzFEGyMv6sRiFb/6+Q+S9/+eeiAlJuUFxScrapfOU0UABMCRlUDnACPUKkJOXa0oLQMpByKbP/7UsTAgArxTWbsMOfRbqBsnPWeakce5mac1q7r1Hu4pEEKsg4p3VRhnJ9kr7EgeqgR/97x3/4QZ2IHn/nX/TlF/wKAATNwKkiZD+pIovqCjQb+Os3ltTuHk/YdXBURSlQ+4ahgsXthjVOf0cC+2rQYiDR85iIdvYk+VB2jQiP1G/zltt5eb/ZEmESf7WDw55PsOdsQ/igCoJSSeBCYmjF3Odh4CAbnW3t96rsOz3Yasg1wIU5tPj0NylEMds8pF9bTbV9sPlK4GCLW0WGQgmWn//tSxMSACuVNbSwxSfFGoC2phii6gf/wv53m5P/7//g//7//mMYU9v4GBCFlyhApJp8DsPeIgDTL2XAXyLRukTQHKWWMvsj5VDFSmPTUOm79T9Lb+5rM3bt0Oum0N0RpoZSbe/uWL/bbPG6fb8h/+r//m/3rnBIRu7q+qIQJiclVOJ6opNtKA3jbZiFpQvpVQkWtTKIv67UEq6ZIGjc01vfDp1lbSsgZu07qqmVFmsMZlOmfWORFBFnOAealpHNBFnTScC9G0V2fCTpQ+y4mJ/T/+1LEzgAKRTNo7CSl0U8fa82WFaD9X53+d/Z9VN/b4qN58EBx7BE0nOjzMFJJaAkAvRA6rpOlDIYd3izyrKZUjrfeQpexhtbKe1olYw1bRXXMv31Ne4pbz8j3dze8bn7XMQW+uiQMvn1bc67gf/833H/T8ob+j8tr53UqEEgBJEu2hQcac/LSXJgZPdzIIe6LPdG4TBNmGM6brMvk4vOZdqRJEJe4bnMFY0XWkLl7s6lkvWAx6vlm9PxUL30ma2hk5jCqGml1Qw0FQoVOzClD+P/7UsTZAApJT2jsIE/RS6ntXPSdeqBfMc4+prpifvf+Rr0fpk3VgEkpQGbJZhz1hk0lUSruAnworDeSCVRHcOQNDOi4N6PxjDjX8l7M3Dtyr4jjjjP2Vrw62PDA61H2gNnH3W4JfPJP5gz8zvURtv9otbzPvL//o/+2cKnXy9fLvQIAMMy/onlIHsb1oqyHFZtckFFdynp2/ct35c1qUISiQYD5UnUQzm2UYhC0aZ6cISgkcEk5qLgvcM/tDd3525MVrE6UZZNd7CEV++f9tXCN//tSxOQAC7FJd0e083Fin2vNlZY4znIQ7kJItZHk8n1durqc50YOOQn/7y74EgQTBEDio4TsCIIAERMJoOG1dbDdk0FLlOsML5vXcKNpLbobrxRTCzoTpxVqdMY2KsTDqWyngwF6oFCiAFZgiZKWrtNLtlSliRwTqq1GtTFDQtOZP8x8/f2u9b0DiUjptDX4yNLUZQ4kS/bVyZDAxR2GPK4qq8spFVTqWC6ZtGSWO5wl79oeW+/QB0WVrdaXftkwPqLQ5LePVpJNR509tJmdSrr/+1LE5oAMxUtnTCzw0Wopq42FnmLA+O2Mh9LOG/Sb+gVklSiQZJSEP7glkgqB0ZGY+NjA6lRIQjOxQsVYk0qz7JPUdtDfysP5VqjSvV/D/W3Bv/9v/kGs8rR5zCZp17UFrTlnGPJ9n8eYPMo1JUF1PrUlumSQQEjIJejQL4nyNHs+ZCEcnx5ENgIB5ZV8dOsJjPG73QjVzPmRCdkWGPGYg1FsLsapRjHWNHj3coq69KSzjU9ewwaGI4mwRPeFnGiRFD4He1xcPiljFY1Rhut/q//7UsTkAA5FL2TsJFGBRpVsFYeg+P/zv/1RoubXViW+hXeJStUEAySWk6dYOpbFtZC7oheCcq+Vjd2AWlUmK61Vzj8zSbgzXpD0f3gRatUvNW8YxZXRJjUOnay3QtSPf1osPopF9+ki1jAnX6vWi/t8mf/lPq+QC7m5foCiBAgB6AD0xjWXg7SjJ+ulWTdCC+tR/MSr28Pyzo6pH5/fqHEoVnA9k6iA9ltKe4fIUkbZqEGtSVY9m1u9Ah7spSf9Q8vk9RQu7DV5xxmohvgw5+X4//tSxOAACmirXiw9hYFFHy3oxIk6w23R9H0hicApEoL9Qhb1sTY3eWwskJVRinwwmNIkywzK82sUImmFrcAYedl8fZwaxw7CjK9UaUkw4u48Wg9AOMIY2U6YcJya+Y3FZzevlB9r5h3UD39fjv///qYbv/Qbp7fLO338l+J6d3cqgFHNUJwV0QNaN52ZTctHXBBtdUUMzH6hG0A/aTHmDzfDfTGkHVTwnZgujVlM9Wo7Pq/ZRSf2UKjenwJ/M3iTL0+Df/4i+r6X//9QAAAlzWj/+1LE64ANvYltR7Cn+WMe7Sj2NPolqx0fEKYCgV9kynIpGVuVEb7UKRgCCShh515XSu9nnT6qMRUaQt0D+b7sq/FsijZ8MWFb+M/g8Pud+dI3Cwxe6eIDn/8jf+If+4FBvv5mb2+p/+hn9/cOs7zf/opAAAAKKoi4QrUmzNgbK25tIa0gYy1maBj6Rtv3ga+EpgWhdqG6V2bm4CvT6vhVyxOmGKqSswclq8cA++b8WT9JZo0ww/OmO2coqRmsRu4ET09jjvP5B7f9Bj6+//5Lbv/7UsTmA4stD1rHrLTBjKsrTYec+Cv29QzyjSLND4I2WMwBZRDD8Ux4FhbDeOE0Odakb3OrHNFuxPGFnbWMlqCSLCn1s5woNeaTVrfZ343Ozp5GrVNeLb1Au3Zv3tDTjAIs7b9EVfLPyhpu1X6E0VE6jCH1bGetsjqqDACAW3Aw8oeq1gK5mcKVPxUYvNNeceS0UCvlKhMuBCFJyuuabJAlN7W6oRFZV3Tpv8p5FpTZFeqlqIUD2ysHEPoZCHHjw4jojiOc6ij1qHvRicjN5wy0//tSxOWACbT3byekS7GHqysNhJaYWtV+d+yVdLBUBAScoHArQHiw0vmAo3ILULsJL4FXy2tQobIcLcXnkBxUOIzthIogYcYfnIL0apC8RYTmRT16keRUUpQ+5TMh3ETofY+SwwWeUquf2m/OpwQEHMFzW+fi4uFxfi4oigL+lFFn12Ogy3EoGEfL4wDEbkKQ04VUmThuACDJCeyqLyOJQg/2xElnFWRVZmZjwvjunyd+f1GAdOtRWUmKI2vxWFkw5zy72NGg+V00eYSWZLdf/+r/+1LE64AMRPVW7CS0wYSe7aTzHt5iI6lTsjLHPQDXNIJIJSjAL06nMQs0S/sTgVifSLpDoaZPrmhxYKy4FDYO3qQ9o7Sp4VPL3X4pXmWS2KwmONqOeFA/zexxvtq4p3RXpQH7P36Dc1rP5pJeb5XFXUfb4M15fbsqAkQAAVIOoLWi5GaByFtR53m1p5LSPnAteQpQ4ozRwaKvmx2XCPqVahHbbjnjCOiuPkwhUbUOXwmdmlQjkiO8PCXr4f+3ZH6vxBvI/v/7f9fEhz7CLcp/Ov/7UsTngAvU92LsJK9Re57s3YYVOj/1G/ZvpryrAAAJN3jqilaH7HwcKFvaw5krzD5OVC3AMBkVKGVyNA+j4KAJ1pRazJ0eQ3HR6cihHtKlm2AEQs6ITuagurcaBnonYiMv29W1V/HX48d//y3/V/Xx91GS8C/O1aIAQADBL0aJ/xbphgINJS80JzNW2WsoYo1K5jqYEJSsVhkZmVmO4VDxSP4M0s1qlZryQFoo6uMI1KRRh31DLNEVLlsxaPF3ZhbhCbpmvUXz/t5j9+sl36vT//tSxOaAC60zcSeZTvFro24o9B3uPf+e/9/fzujT4j+eq1+gQYAAQSWJkEY/NMRnsSTkdJMhzp1WZ9Hp2ytrBFY1h4nIUkd1CCcvDiZZPFm231pXMhl/G/PF9dwTWfgCk+ouVll+oGhnqX6BT/x5uj6sNGyG70f07fnfd69lASl2RUXGWdhaQl3OyGwq5lLOj6KvLJgpOE4dZMIxcQ5LErqogA+rk+1pu7tMPU/q/HCVRwKS8O1YqOjl3LxDfN3SXy8dRCV/X+Sa7qL/ei2ipsv/+1LE6AIL9V1e7DCu0XCmK6mEnTBgm7zdGn7Ol8W0aAAQABsSfEMcPVsgPAISsAwU54JDS8bRHBQaBIWuJir2GKyE4elwEmD5EYKgNknBrgkUMLfAUzagESN9Wo85CdLZJILEdjjHcU0pFSp1PKwF8XbhXw5VdBgx4jHWMdb+Opyv8zXNv7pWDrPyyPJY7PCYP5Xf8n/zl3jd/5IsdztSZjv9//ePj/0/+/8/++741EpSJ//58uaOSaUBGBAAAAABCaoaYWHOE9MwBqLPUoY80//7UsToAAzZMVjsvamBZ5trqYedeN4XvZa3z/ubL5NGTRFrVMVzaz1Q82zZY0NXaHKk5CzLc2tDlDswWtFZV6shu73Cm3XPrGVzE4Tq1Pbf6nzNqtf5pYz1qpZPxdvs/LL8bp/lRIa3RHLTawY964zNj49Lb1n/MJwc7xpouJYPzjdq/7vv11n7rvOM/2zSr4FY0VFGiv3zAAZAAkBKUATRsC0o5gPM8ItFa5qFZbbTvW0mTRkkkXYXiB2bEQK2s6jW/z7/l4/iKr4/7kgyF//h//tSxOWAC8DbazT1gDJnJ6rXMvAABjuGkKBybV+XATxIJEDEIF8NkxEbIyJUSUUoqQQCCZTJNOZVTWAmX3kYabCKvrEluvB5iTmSI9Za6hjCS4I1UIlwZ73EZeriEFq5hvVfdU7ebz30Y1VpOKhi2j0siJ4UXfUSicJ0OiwUCvLa6urDcStpN5olLWNFZVQoomOYloK8/TpRjGeNSwurJJtnw6mlh2klzeDSSb3ZtVjW6qRjngxb0m7FVB1Zikkas3ON7+iP/8ydeGkzcoSBHfb/+1LEx4ATTUtnOZeAAVGVrSuegABZMtFxJdswLrP1emw7KA8HwXQSONOROHENSABJbgaZBDRQKhJ0jeYNZ0Ua3bHFlgLXgOOYc9pP+UgwoMmKpVTRt4ZqzGkbTLpH0DlpVKrMQluR+rdb/J9+qqKBMseaSDDrKQGv7b98BEjrC9A9VLNBNNzHAb8Y1C3FCP1+p03ysRtGgdzRcWKpnZk86AfIWAA5jHujwk//Z9X95dcpimZggOKIXcVECuoxkZKHTjFf7dC9HQnUHQlL+og9/v/7UsSuAAtorWBssWzBch0t6PEa4s9Vv9mGbnNhMq6d/YoqaVJEAsL4KolBAyenIsKJhMcwnx40lS9G9I+BfyKHV4v7VdKnFE6Qbk1Gycll76LfW9QxhHuohzFnbFmsyCw9+ffFQbf/xe/lfUMKrWX42+v1/+cSozfUoA0mZMmN4j9O/r/QBMKCAJUE7LxGQIpWlwLibAsDJBI8zCclPuG3MtA9+OtbYjfqDOl15kiKbmHq1v4EJldUkH0NBh1nURLE2oXogFutJzkcgMZu3lEB//tSxLAACnz3ZueYVBFyHq3o9hU6ezTvqUPN6/Cv/r/9l/+Hn2ZL/q/TGlgBIAFt0CmL0vs3FjEIT2wgBk2mwqoTc25UvAQllZ1VkyxPpsaQfktLXrWoPT+++6j90eVx3R/Qvv9phn/0O8dfNmEPT4WLer+r/+j//X/8bvk85yv6Ak1Egk2UXJaD5HgW5eM1UmW8OyQzzFCZmhVeMx1myJZhZyxTnBTHpYpYEd3MqS3s4hkxF0QfUrCDxj+hP9rhf0+JC/RH8aOv/oO+/0/7U///+1LEtYAMfVlpJ6T2sYAoLHT2FhhGfxN0ue9aG2wRIFuSACeUp8HOYRfIRcU8sUPYKksbx+lQnaRvJtbTXsi1QT5yxHWwESmbTGEZO69B5qIEgKr1RbtUYr6q3UVH3z9WFS+vwsdntH0/LaMqa2wiqrQDhFWkhbFOnQq1WZEReKiMcY2fKC1OWcOLxGAqpBlCkdbCnZ7AyqFqBjOmjs+hhEhAw532FHflV+XTRG6f94J6SZ2L4uNeT0f/LSwAAEpQFhzOIFXSoY740FJsoC0njv/7UsSxgArpWWVMMO1RWalttPYVqmMxHUnJKEAWRLnWWTaxTItPJRkALtGNCWGvF+cqofTF1z6g3kEPy/dcs//z6PUMtlwsh5vD7fcjynrItcFMSlFK8iCMBrrKQDtJedgOJwTqlQ5EqAaxpbqDXm/TDgbHJBbpyjMCciW1Mo1XSezqc0WWbUZ1x0MUFjv+pNGVdu9Rn/8qftT8dT/9C3/6v/9CygIAQAAAABJQF9RSKJqJkMLLRlBCwneno5ihjQoZdzFcmAgnwuomG2+Oz7uV//tSxLiAChz3aUekrRE8HW1k9gjmM2bHs5xY66xSPvfEuj0Kj05HUoDM9aflG+/6b2ovlSFCdYa/P//kQQBAwCMkwMsWHeZuYgvhuOtbZJmU+UbBE7G0qj0DFadHxZjlS1bI21xsmJuK8iZldQ6xDYQI6NgUeVZ4YadQDAXnTGlP0IbZv47+v5b9v7P3/KUNmFEEiwkBbqOYE8T1SIwhxzkUfVbnvmKxpRmN32WXnGsNq0Rh661yZS6vKmXH4ejqhW21BRi0qmE2/ffFYseuPN7/+1LExoAKfMNa7DBnkUIpLST2HW6ChnVq+lBf/+JxZV6xv0/kCoGoSk8/cHC4xFCUCuSFnaeVPiKxml5lUDt3yduVfR6yF6JLWPGCFnvmoj7FHXy9qzUMiKkzA8mfeaqNBYi88/po/Hueo6KP5h+3zEjUeFP2fuVqAQDdroHEkO/SvnTggRmSYcp0mn2oOdL7dhcMj0DQc+Z5ypNf8sy3HJ384lnp8Vw5VLHlbam+Q+LyqtwGtXE6QDfD1HLGldzQGhyeV9GCEnKnpS+xoPzPRv/7UsTSAQpo3VusPOfBSZuq2ZedOPoGf0fnfqd9QpuAAIuTwDSBYU8qB/IZFRscbBMqxWpSw2rfoGoU1YsjpARaY0prPViMszRZBiNFW/sQ1WyyrEHWYrVASuYuGh+3M3OJsv/EIclTbbcKEo7sv1HP++UBH6fy37PqA4xpavLGV2o2MJkrgrU5MzJyE9RTCyYATlUSBEA4JAkEYaACGJLeFC1fEkqf3Fhhp2WG3zMn5C8JDbdlrcelnJy/8pWdeGzhm8eQn+Glg4MCFjD5Bus+//tSxN0ACkj7a4es77FJHy6w9bW20BkDlUIO8vqDfXwTQSkhzIluQ0daNVBkxcnWkXBIOctSCsiTRAkaNI1yU2GWkI6BpEq7KWYBJROC5IBBqVWeRD233YSUPDBXBiCOgyxV580BkhMowlqz33mgANPx6XmA/3oBQYYiEAABKk3PlNbMldFtsKoKMtg03NnQFMLp27tCYiLADSsDA+FmKOvZ1rouc0s0Ppb/SPpp9a3QWOKlaFwKcNB0OYuS41bmEpZhb2dkKWIo/xfDjlnRERb/+1LE6IAMLPla7Cz4gXKiq6mFnjCeKhskeBYiJAAIJTlp3It+hQ9JyHeWpFp83HFQVHesA0+wMy7OXZz5gsVmes1AFPWy/nllImV2aUSZ8YZGSfUBHED87WckxZpoUOvNgkPWeQWhQabEN5LQEr2ocrpnv30mBlEEgEklKE1L1KcJ6A3CzYDlW4jQ0IYd1aJcR88HLEoxVFih3k9Z33vBrYxyZEkdT71GH/c1o5RZC3cLsjTCaBm7zdSqGG0NUjKH1E+61VmqlqUN06Kyv/m//f/7UsTngYvoo1wsPYcBZZNsJPSOWBlFYgehJVU2nDU0EkUQS3BnIc8HqQBJ2gLYMgSAkdJELIKe4bf2GxZVz66Z64MW2MGvafS4N+KzqmDvzYbcUtbSZBT/laxyftojoOpNVX+fnNRi9AdZz/+N6/9//5R/8ooCigAAAEGTfiQJbF24vyh6VUIYrYeySwNTwDul06bF9SsvqIOpORAtLOTZVVJbhum8ES11DnBRO9bnYRu6CxqsVUS6+jnsXug1Rjr2nKzlAQZb3Hv0fTs/iEvY//tSxOkAC9iPZ+eg0UFrke009I1izX+U7dZ/89o5cMrwEo4g+89RqifwoNpQ1NcT1kAl7J5qRmopHVXtSt5JaD3eneF8zq/Ld5Q2EgD7hZ37Uem3lOKMcI5Vsc/SZ1Exf6NdNAf/jv4o5yUboaWD6qu36N//f9/x/87Xx1rls00piAsAAEJKzl+IOky6461RDuEObd62YUUWtO/SUzcnO+gYkDDKLS8U2VVFzvGPkBlKRxiDPDeJPy/Kf1qHdvD/gn+ja8N+n5my/9B//6N/+r//+1LE6gAMfV9rp6BP8WIr7fT0lbb/qRv/0CUUFQIoggBApNwLlYI0NJFwi/qho+BjlA2BasOQhllnNo0LwfUhLG7k5FfUOt1dkl/PR1wo5cSl3yHzz4+ZQtmaC/RTEEbvUi896CAl7Jui0ByZ8f/E7aa/lC//8p//V//4r8rNju+SqqIhEwpBqCBDVoALnMRYe+CPqRjEH3nXypo69gc2cEA/7zbpuIXbVjoAzjoDBloDwycoi6Fs/l5trgA0V6CZt6CYn9D83kv0/v23fyj//v/7UsTpgIyRI1usLPEBhK+r6YSeIuU/X9W/X8c/MT80tMJAgJTk+yPLuzrYXce2JD1iEVN2I3q9cR5UU6lZAQ0CHpZ1a0z3ShZiirJAQSyTksTvLvICVUTXPYsVMBatRJEycwSnfSh101FX6f1ffOqzGsUONjWNSHXV+/fp/kEcPACkzH8CdKu5PkqgzfE2CNrA8tjmlR8yVjWOIXkTC8OAi5CxalRJosejQB19/5Ai3KQOKHVJ1JzHKwwe1ynz8OxtFA3U7UjbqeVdJvLi+esl//tSxOSACwV7X6wgUUGTq6v1hZ5a3Q6FJKKksJqtCtFgIY5JEdAkkEMxFi7qp3cqgadm40u8wLiL5SqoqISx8BQZ5EdfPBXMuaWafrMBVB0BwYYtz5Blf+YIAmeK/0r+bvSncaMfJP0lk0r59NE69+BSveQKCB1qw+rUMBIEAAA3ZY8xDjVE8Z1wAxJa+NPRPtxZvy0sGpKdsSZpkupLpCERtDUAJwoovJ7z6fwsx8rfWAq/wK/5E3trb9YQYoEgnUzFwIbt8wEv5Rv43f9S/6D/+1LE5AALdX1xrCDtMXigq6mHqPAFSd3RcYGvTqDe38kp8jAvevQgfiI/wxyRnX5xcNgSGACtisYHpgDZYYQL8xKoqONg8s1KMllqtCF1+EQZNroH73deatVLf5mKday/QAUVav7S/XkBYodbiIp8XAl/dv1Hf6p+hK/6P/Jf6Fv4vH2qf4m6Xc//RbgjSGWWSg0qnh4rRymvGO8TYtzs90NFMk94pEPHuR97ts7ncesyW7wjXkEJbcjc34oLWnVpoOaDYOmFvBft4UBn9f5UaP/7UsTlAApIsV1HsQkBlqLsaPYhmr+rfxt/v/Hv9/8t/o6/d0moBAMMFAAGY3kJJQQcli7bzUF1ZC+wDMdX2YA/Wt2kScRt4TCMbFAxqvizOGoErfTCNw1f4DcyeshzIpbkfIxz+PKfBEIX+z/xz+rfxV/r/kf+Z/Qa//+/9f8m9PSqZWgUgAhGRAZTahGrCVwmo9Di9T4UIIl9RiC7i2gH9EvFT6yTFSZoMEBB1qrfhbjObJFE/6O9DTczgeLa+oO3MfmgcE/9P1CgpT8qW06B//tSxOcADjlJV0wlUwFrp2uo9inoZ/1b+Ov/B7/EAP0//1T+v9Bv5HkjSRGAQGtksXpRilmXFai9JeEStHB3DaV7cfIL5worzPPSWQ1Lee7+Bvb1W8qha1OX1LUEkNtSSVMjpZ/jTb8eH7E4Uv9vzIX3/OntWqX2/t/HxL+Xv6Q6v//rb+r/OeR5angCGAUgABX2EYHkIYUgolWxmOarmuo5VF4cGwqQVkS1YYLmdQK2aoe0PXQcrAaUdkQcoeTKkD45jAy5UfLkr1F56V7if+n/+1LE3oAKlTthp5j0QXYv67T1qpANv697RmFRnP5pUTajA8yUAhX9P8RRb+OGfjMKZ+uW939aTUCfLmXhiWBHSDHWtH+cbW3oWuAEESLiWCRg4sWHnnCIno19yCvc1/8PGyw2JCyIzf0Rdu2u7bVQIOoxmuQ52U7HQFMKaiZhEeiu5GlIr/L/XpfBk/v/Ef8nAAbbkQ4HFkRasiaS4DpwHLVwvHTIhCkSl1o/1OxRUQ2LLE6U59N9Faj2988PxiZYZ1nw4sLMgCZmOjGCJGktd//7UsTjAIxRf19HrPLRhC/rdPS2GAYbOHWqxu9sWwPsFhGmIgD0ARgYCUC5SOhNFRY4xLxVIRCT3JZUO0AttPvlRm1NSZ9JipC1V683invr7TJAQpFCqRkSGgbHi5NhlJoj+I2q0CRiAAL4JOElVNlisCqrkgOUkaUyUQ2X8FZldLTtjYV+M5Z2q5HsAVWydEhWWyR7Ek4Ztia9u/K071lQbZz8pmQT2jPbhRcXPnstPL8xxJ/8Ytf//qo1NWQFAd2fTYWAnbMkm5EqkXQ2DIbi//tSxN8ADPVJWaexTsFpIqsA9hXwKbYHKygONbGhGQyWqVKl55uZ5P+w4IDILjyIABEQhUThgXf3WS6EubAATxfp3v8G0LD7CFmt/uTb0kwIAAAAXG5Gg5EKLMAht+3EYaPDJSclDwSkMtVNU7C47fgdoH7D99BFm+UZ8vOOil7a5mGXFnPGgIPQw5CWmkViM27qNQTGmPyDFatKVEbyTBAAAAEwJFHaYq9uMKbNAsqHIsksfhPAfYyQUpUgWn3a5cpNZ90J+c9qVUmVnO6JSgb/+1LE3AASHQFkbL2LwVEPbaWHmSmt+oN/ZykEL+unoo7B8kOFUuKqv+XO98NQUDbo5i5iLZ4ARLtHCBDJCxD0kaRzGoQFBbVB+GIzl3oRzCaYjYgqQEeKYUat3VR2IQ9gpzUU2Zn32Ofn5BiUTu3WtSNrym9+G9fXZNQcIjbWrgMEe9qLRfpqAIAlICFx7o6sNpjMvWAljWS2CkIbj7hYox4PiuJ5IhNwxQDEG4nHZXOH48cbjh6OyNicjQpdTTy5lufZ6eaafqjzgheab5qI5v/7UsTHAAoYc3snpGrxQQ4tJYYZKLpYf6n7/8rX/QQCkmaCTENEOWx8nuZiEF9QkjlM4k/zty0BONgcOSyxDqcHBXjPbRr+j9O/8bF7u8+P8edxIHL1vXR7mIefMqAs6WT6I/jLNnd7MRHmoggR1FMd7mqax5d+3//zP0PIeZXzjhT5EpVGkGiqAAAtAFJo8FmJRoKU0mFdHRBBrEmEFiIbWQUgfT+hNVuM9LXLKMIFegKT6E51SQ5tHqMCTNTYgfc1mcZF376p8+gKfbv1bkpv//tSxNSAikC5aOywR8FFIC0c9Imga9unlH/V/92lXp6saMAFAoUUeDkJXsneJjUDPK+AkpV8ibupVhWhbxK8ocMAXHdNyCuo1U2PnGXSbaNtTkPUbTB8xiERg3Ex2t2LiYZpJaW/uBf/h/6jyAY/bb/p9vnuymoIAAAAkmjxwRaVgdmLw83edT0eVTqeZwyOGZdaglktLdvh9amuoCd1Cd7c4s150vn0Yud7nwK10jByJ7kqW4m2PChza2oW+aeKQBFev/oyip/7dHfKu+mt//7/+1LE4IIKTQNmzCTtAairrUz0KfulRzhHQemIj9g0KEAlIgiJNDy4Ie3J8mMBqSqcqzKm+/Kt+nOnk+FuKb16dGkqn7ZCV/DjnQ7COdTIqm6E6qWMXWeD264Xq2w1nO64QDWup/T+gK3t00HqiCtnv2/1f//7fsYRiMFIFX4gFWFd9QAkCXASQskxF2ILfZhMPTZQlOW/F18SS7uWMGuQ/p8Ms7A0O0geHFq1AYQ8iGdN5dVpzEBbLmRxkIGetKTcHKr65IuvpQH/2/w39kt9uf/7UsTgAgqVAWlHsUmBUpdsnYSeGEfyft6hAAFEiBCXmVNEX8jT+wOzFfrMqT4vGLu5pmnJZgPGIoMNS0oN7AksQnCxhbvojzj0THgFHJNz8o33zaCEOio52qSHtKlhDEB4pN4hf/nzPdTR/r//rBxzLgjhFSQtqGtVAQAUUm4BjNfdS1D8EuhJ3havCMOwTTFNjeMUpaY1EsQ9B+6sd1o2qv1mrLaWvfeH6ZQg2UXsw2uelz2W/Qw9dVWgMbfuXvs1w3W1dXRdkk2XqPIfBl76//tSxOkADF0BZ0ws8UGSK67o9ZY+jXW7lBt3+nFwUVMJLUadFdK08XSGnAUGoiOV7yh7Xe9vR+66ExxEazjJHxwtRrc3r/V3sIJyujNoHZpg1/nEH7meYKHu0Es0BgQWgmnqprfBgt19/8n//3f////Cx2Y2El3rvsUWWiVZRM25BD0EX5wQZI1Mg0sdcyFJMUhcKCbzkCjsNYPbskLee18jttXfR37rcvg5KdxdSb0JvKHvc4AOyX29W0GDF6JVrfKLaUbfpeIDVLVKfXyf6f//+1LE4wIKUN1mbCCzQX8brR2EohJv2cW3XPd73I0lU6qm2o1MdC8OJInemTNQg+FYeDxTm7FvtsPDTJ312M0Eo0RquDsWJGn45Fru1dIAHXpDGhQMrf4qb+P1V3SxgS+y5/+LP6/9///jdrfT/Vv6lhZlUuEiV0VOlRQ3CSSbSpH2KRRjkXzfOt8jU6xzLhiLyGwZp/TbwpyffAT7bGi2Q6bbsfJ2anH3MWP31Li6yI97snFn8q55GYnCfr7me9BHZGetS3+Z//9f//2/qQT+UP/7UsTngAvxAWzsLO3RcCuuqPQKOmu3Ra99BWHiEgllCFxUIZ4SyYiHCqcjtFQqFw6XByrmZjsrEzFNLF3gx6y9W4JM4t2q3O9Yz/nUO9SnYBABK3CPmfXEDLv20Zjz2E81pjZzeif//7fs593SYacPumfUizqVQAtwDFLLmLAI1sQdJuzD3NMSZBTIMEt8sHFqeVsgDh1+ZtQRJ8ZqXrZ1hDbi3dSetCd+DIvNCq9DbcmZ+xWz3rqTfqav57Ujwam/VGU6upw9/QxWN1zQns5t//tQxOeADA1ddSekrfFyq68o9B4qdlsxlnkBFSLg6+s50f6gAaQxaFQl2GIM2UbeZ7WWKBxREeAmSQuWWnoFgSapcbtZxmry1t4wCBvrk0HK4lNy8A4pmzLkjc30S2z1s0OdBUMe2m+ueCT7e7Ii7xo5F9WqPZq9fv6VACSrdNOS0CaL+rlgyLuKo8GMBUXgUZnRE9IYYcszO1t8SK9sWmpHjHTUasOlcSzVntelUqCg35MoPqUGqHnjrzh4MKvulT6c0EL10kLmG6qG2VTXJP/7UsTmgAttb3DnpO3Rb64vaMEePvPv+R3t7/6v7//b/HfR/1UpYyUCkWgoBwDBRkVCchlXTAfHlJDOCRoPqA5ysUB3pS0e+NaMuxJlPg5RWYkuq06KpZPtJoa5QijioAtKvno9eqQlelT3mf53//1Jv5/s6gzPRZ3uszJ6GmiQSijCxOBfENIGc5+qNcVAgYNBgRGIlCLNYEYnpNQHNpOJXIIBUQGyGsxvXlSdllq/Y19zO/PL7nroGz/rr0uNs2r57H0ux49eeBwsILR8V/2a//tSxOiDDREBXk0lVoFcG+xJgx6YwENHx3VeOeSsAQAQZHaiClWTded4KNy4THRoSvZdCJdHK9mAFCat2CgAP2SMDOTYTEX60VkLl8v5KUoPnt0YD0siNvdz7xWqfVTkMVnHCxUx3XVla9augZC4IAutiBeW8/vEZLSp/b11AQAB+BajYC/7XE53ofQumwpBp7maZspj9BIplcFnKbKlc2MQ2txvKMLzuI7tfQqX3M9cjYp1TZfzdSpmxZ7e9+merfsrdbUAu6q7LRm79v6s/q7/+1LE5oAMrV9kbDzrgVok76jCnbaDVPd1oAMgAgrgQyTilIWcMNNTJ4IAc7HBKjKleIlAyMMFh+6YicoeQ45ko6olWWvqqnwXh5S0rOggHrsvPrN/9o9xVbzD//9jtOB8rg2mhyK9lSWqUsykl1LAv3dTgET8Upxb3OZ7ihpFBZgQQSVAMDuRFCCgRl2wcKVbgl1mpwWWmoF1pxs12lrQbqpWWspz6dFElD0Zb35/+hAZKTpkf36XmdAQTe3/zN2c8xivSVaVzu4nbimeYtl3Mv/7UsTmgAvBAXlHpUfxfZus3YSeIAEBACbcRPVmZa4rOYOkjsM7CxVYIG03SpXss+p8ozDEXs8wj9FvWRywIZRMxCuqMt6D6qoZEas1nTR+v7sRfoI1WXvrxr9sYyBdWwgjUuKktTA0Ajos8JIz9rJF39o/XUrX1AIAAlJylKPMVR6GBl0nx3hAQgbgPtQs1o5Vx7YPR/NRxGgtxFsPoYjWV6J6VGgqkGRny2uZtY16xSGeFV+Trar3kTMLT/6cs7tm7/mOtEyYGx0WeAd7mnAj//tSxOWACuUnZMws8UGTpO3k9A5+QQlLLVDmUFUBKABUHqPoRRdF9qeaSmO5KOzhq7TTGaQ0xQ9Efs1OU2s5tuZPvJo0j/8lgQNmJudN77Oj2ZKV/W1Eft3St3RFqqmv+/66VtRr090OadNwtjMIX1LVpSPbml091QCUlLhw40EWDMQS/Te7sBw10T0KTSh1YDxIFSAaIhlGhHEcqGzbaPq1JN017ueoI0mJ9IJmqV8cQ9geFBaEdehICEw+KDTQ9AMFJokVe9norrU3dbHNC73/+1LE5YAKXRN3Rgj1cYwb7R2CmqJOAD/2SBAAAJbgoxfCRb2M5lUrXiqo3Bf9DDDE6AeOiQVT6OwlFyI6jLzcLRZqJsqrekQkKDJgdQWHCkTBd4l6hgZOuGCACkDgwsRWrpHBcGmG4ZAorjiLGojWofaWfqicJsqVIAAASm4FTs/TGd9hkCJPsqbowx9orMsBf9gbZDBoM0jRU5g0siW4lk7XoRkrpIPKWXMcuefLoaH4w0cvO9zv9OWmf0/mRFw3y1L4LLZ1IBcwcvaLIYEIJf/7UsTogAvRO2rnlFLRd6buqPMV9lb6WR9qv3pICIAQCCoA2DtHhFQ0kpiZMJUvXcYukMkGV0EacWL3T4gTNuOXiU9geFnj7voQM+9keyGSiKv0QrptO0Kd679PnF20ty6fY1X53te5I5RVigFivMPExhNNhW3UxSoYABQCQSVDLRRgqwT44SVaQkrmdEaBSGB+9OJ2gwzJF7R5WIXbuIRLNLN+avcTV72qLEHyatXDVX8RNpDpXwQ///C/8+Eojc+LmLsSsdILS4VCzud85Ui+//tSxOgBC6SfamwkbYF4je1dhI2aJUWimrpSBFUkkFJwGA3GcYjCegD8JB4Tg2WCnjA+8GGGHFRSXOvGDVcPUVpRu+0dlrxWW/YbmpVum7ImVLfeYSf84259sRwHEjErY9ls63Uon8b5rtoResjY97xhUknJLqRXAAATMBx4WyB3HqZugKeJVwsiGGlKgjDvkQ4XNRZort0Y9JztCeDDYC9lNNljDEPs/O8T5yNNE62zRwFhpuey0Y3ZGVSKp+z/z3MqtlBE0/0T0dnqLWo7LIn/+1LE6AAL1PFq7CRtEXIlLmj0FbZw0F6v/9KuhDurrEVA8lhCcFWIvhCU3mZcQWhmB0dltiM8QgsH41Tiry+yyvtV6X2YneascWmDsoWRWw8L2Rjg45e1nOj/tf+/+IIf2Cw///9v9OviqU1/clUgBJSScwZZ0ELVxRIc6P0xlKYitUZd0ZPhqRm4S5iyvr2jZg6vkz42KDCgzbN511eySQpw+vB0N3ZfVS6sQffUTbTL9DbrXX0dXH/+lExXdebX8//S/kHdPsep3K5WOWUEZv/7UsToAAuo4XNHpQqxdqSu6MMd5lV/zjOnsWXIACT3Mx0NQgTPHfihftS9gCokOLuwtiKupfWZM2tVub9RISdNY80pF6EHxM5S0Rz7vm7cvrT2DpHpz05u5PdJaDOKW2/bOjQ7xkMNENB9nY2UKtFdqP/pNrV5wva7+tUABgCIypOX8mnNWmxVPVurlky1uWhATvxRMsu875e9ZUOwTec2CVJq9C6SsQsJhEtcTpMA0fDh2eoafBsshFSu4ai8o8odGSYlIj0T6uyne/Pe5Ssg//tSxOiDjHkTYmww8NE6JGyNhhWocreztSN0rZsf+dN53DNWQaU24ihNAsHOox9qhGm8OklIsCrP4uqolKG4Nxjh6D7UpvRzZsLkp4zqdsyAxomaQdEJs+YDSARLB0erqYOePtzp9KUPrmSrkPmIiexLHU7U/yYEkpOaB0qiscCkoa4hptowSJmOxRv2dHIsk768QxKg2OZCKGMFsxjZlb3fKt63P6VUNyJxYaahwUdQOMPRFACeSCxwbXQhtE+RXOY9uZP2GkPrCSdQcBtANCz/+1LE7QENKXdq56BW2XwW7E2EiihAcLB8GwCVdKEwBASUtBMDgLobgtpcRjHgsDnNFXPjQXKTnmOx3h+RTZfnqoHDf5hukKZiOH5loIL7WfP3iIYQ/9Z68l0MODGNPQ1Ttt21oskvHih5VIoogUHCoQEgtxd1ZX8O1QAawdiBIjUdfRVqR6MzOk6SEFTQdpdkfdBQF36YAohMkDAaoPzOUgtyQyQq43W7W2gg199fNI1d9a3HZMOpmPoOr/U3TmCq2yq5OVdgY40kJhNr6z97Nv/7UsTmg4ywq2BMvTDJRYotDZekONfasAhOW00kLelvIEcxzqUpxuA4S4KYvC2niUP5Auxpcksg+VolkudGPS7Yu+seS591X0SWcSxSmub8SrD7UNouP3LOrQ/oFLOtbEL26JiYvOLVL/t/THug/Z8mCADan1bZ00eHNZaSbybEuOCgomLt4iRVdXrVGWpkEAtOBdm+QR8dZPSXpOcIalAQgJND1p1A61WmoNPKlWns9CtZrMpUxP5U/Rjm+1Hxw9PuOuxY6PkKA2ljW2OV3zt0//tSxOkADFSBamw8w5FuF21c8w4SKM6PekmNNZuAcj/a5h/QxXeUPdK3uzdxkco3K9RV9YJMhoiquVQD5K8bkRCDyePdJElb9NGPidrRQO1ZDPcyabwx6R5qUykJqids6ooA02UnGrO3s1lIXs8G5yqfTndJX7VqkCyNc1elFvaMvd6j8+ygN/8EuigA1qOAw9UwhMDVlIP41geJsqZbF1LmeONSNVc6hawsJcrvuKdc7xhq/EX0Z4/ch2zlssLcm05PeG4enRfOV4/UVEw9jYH/+1LE54MLMN1gTaRPkc8k7I2HrDKLmAUwJd1NVkfaodArf17UqFaaMrfNQb/yBTTSZjLUTTgLR+Txcn8hRxIFPl6HlidoFB8SSCOb0K5uEwNo46lLIYowQS9Rho+a/qIENSY409iiOqG92caGnd6X0R1MC4c9t6f6ELMldXRXNZnmHocl9vpNclexoFvilqoVaK1t/wXIlpf4zpEJhU4QpnU6Yb1suK7H4YkybfhRYVEuqSqdq5Hdu90vW7NvZzBiv22obSE1H/Qc39FdrEYQAf/7UsTegAvlL3NHsUk5c6BuZPWKPsi9mIc9EiZxllnkYl1ISjFDwfCT6gfhsXFQ2z+gJZGQiiinCak4NeVhLEfCeYFEpoytlTLiSTQWNolCx50G1V3997STF33EzaK+EQjnSnHwPPSyrVil9bLlVysIoiexv4EiqLnF5oCGzqm5Vomz/hYrQcll96IAIAASEm4DL8Q2SIXsyCwlGep2KgzC+KihsiRAV4Sx8+TUO4c7LcrzyP5b7V3jsAaVjJiI5ZI1mTgfSxI1400Xzw8bIPWd//tSxN6AC80DWm0wsUGDJO709Kk+DLQqouE4Mp4oun7n0XDV5S1QkKtKxQnMaoQsyk2lDGfIOOu451YPEQxGoRL660qJk4lu72zkwFomcaQ0//2Mw/IYaw5/u/T9/l/hRDzEokOfFKzW2hBxZIHWarTo7Q8bSVKmHQ5JKnI447LtAUcU/UZAx0lPF3fXrMQ66FlpFZvakU/nCYQGcuTkcwVPmxr0rRfNWbFe65nGfpWQafTf4x6rv8FDPyhBfExPAgDqRvUhfi0l4nbnhYjqNW//+1LE3IALuQFzJ6St8WQb7ij0CfavxjsBEmiJeRKidW3Sd+UFRjpWa8GCzJ44T2oqEec+V6pcFTA7yJZeO/bcV0ZR33HDNa5uHWc5TdmEDnnpKGlVWc1xwXSvRCaerBOnTLUNq48tzHfIIvBVKnhlNIfCJmDL8rfF1QUouan7BNjZGYxsxyk8L9K0nGrEk+QpkTEyiiqqyIMSRkEhDZIIw56XgiYbVGsqB+BMRPWkgdJLrv5onF2z/g/Tr/wZBPpJc6yE4XWmbRNKfe/ZPVrbUv/7UsTfAEp0bWNMvMNRWR6upPQN7jRrt575fP1Lzp8zVwaq8avKACBJTrgDiq2I2vRDzQnQfiINClz7yeX1WxKwzjOt2Xx7tXTYXs7OXktO62N2xDRscraqfK/yyrPs5rutCo54oKHN5/qW/e813JK0w4SKzVluc04zQr+//lK/6utCBXSkIouJgvZbiLoijLTyoXsrgepK+V8q9q6C5YoVPvOTRRRp6hd5xnDYGzH8tR0VzGdXf/Jsf/YEZCXf7F9v8qj8TrkyQNziLJg3a6Rv//tSxOgADOkTgawZEPFUGq3k9hz+EpUTGJSy76/fB8W/XyBrVaACXpgBIxjx5giQsCYOx1W9liNjmHQkDBJQdZhgfuW90gLzqZwa9obCjWfizrVILke5xlncwxQIhsTGVJPJ+yOX/Qu3qoET6u6V/QWzjjJ5xR0qzqIQbaHibh9wN/sDeruZADRBJtOTYdS+otxejEIQ5EcEhknqi2YHkYbYueX3co/+Nd0rRIR0ddqOqyJGKwNASdLybi+47uG5fvq7/+g4eb4rh3v5YYZPFDb/+1LE54ANBQVrJ5lw8XIg7B2Erere/m3y7RAYBAc+zbzKWaqZs/0JtBASE05IF+GMTXYBcZmMWdCrMiUKw4BMRFp+kcfUnR2duGTPUrSqYwSNsOrz9ewIBggKaG/Lt2ogMcwQjU2s9EGGoIEBoUhSJxQmpva7t8/elbuFfT8bsXs/7mzaNHtqpDU28gbEYuM2w7O0OpKe07iDm/2gZZNfPv///9REABRUuBI9x2yylSUEzzqsndOMQZEUG7gzHjdVZllml8pKKssUHgCh5fdZFP/7UsTjAAvNB21HoXGxhhyqzaedMHBXRS0Xp10py6GPLhe5lGJUfEYJGFqKrZOdL2r27FQ8YyKr/6QECQAADlAXunYyl0ShC1CeM5HGUbqwnGEin6eRL5ykbt7q0uM+CpcFoKGZi9LR87JosavlRlPSc1xhqQkGpwywqK62tWERe2Iy+BFZhLBfpsmVFVGQAEpygRUBIVRBjvUJoZRDmcakSQOCRGo7acboCZllhoFNwkVRUPTvDrwQPz+nGaULDaAp8BMGp9Ppf+EsiRfplm5z//tSxOEAC7jlZUwxB+HxIizdhhk77yzumLHHynH4aOssJAAFOQCfgvCduA8o6LilhetrUfBXCkrlCKvcMTF8PjC7hzeuyB0LUsIzQiwdnrK+69ne6zt0f4gWrc+XSlFVtn2V3RFv0sOvaeBdDO77FKUqAiFEEluXAvoGVQua/FG8XS+7ApRDrPZkUDEQqO2znD0ypnnRos+EiboO+JoZDvTWXN1tCnV1Ov96BMnsdl/xZhjzFrQmue/rpa+++cwd1DfGvGNZvJjE0nd/z9+XWBT/+1LE0gAKGIlm7DDNAUcN7KmHsLiHqp+2QExgIJJbgAUwboZTFlHoA8ki1DvHbc4DyQi4pEaILGYJdDcsi5Rs4J9qJ0PPiqkswc0vDidJ1QZV/RIfm/V18POw0fX5U//1nEWIrLHweHwIW3VQzzKWEtxKLY9GuMsPf+bCWHYmiq1oz5IAhACcuAUmWqBmF0L3wbhLpJDMum6yCJ0DIpmsVOmck3j4a9Wacw1s4Rrvl8qazJ1LvS1rbEL555yVdmQPHc51k35mrP9CYMyW767usf/7UsTegAo8p2tHoHJRPR8sjPGKmlSdTT1ZrKkqRb19pobnltQcHOrfsGYpASUk4B/kpB4Mo6hNkkahd7oSinE/3U7GulSkthzLuz3Hcqo/zZ8+cd7auP8rGrdTmz932KrmKuWOi7QMHWTlSVOj9a9mNV1fr9AEC4iKNwcUdTTiWYSsYLjTS30FoKk4IHLwKCyVvHJgurFIXE5dEm4xdEbIGSoaSgpXaAiOqQQrkl7KONvhuZMqjR+S8Q+BcqHoqH0yojnufMZVrS/1b/K3Pvqz//tSxOuADGj5Z0wxDNmqIu0o9KGnmGGlj2rfRBda/p5SLFna7mtFQBaAmlmAhDolPxB0ucDQq10I1DmSNafIEBm6snY7SomRpoYHR4VHQbncaeipCFt2ojLD4pBc2WprISCQSN7iVi3+SOniJj66JaXv831JBCPMGTb7KlBr8koVluiUyk4EJSxj2OtvUjgwqyKVB8tzjPV4loLUihJEKYCJjJgT+xtUX+Rxze0IGyvmFEoaldaI3zSzN90MqmhyNMpZjWrdT7K7uRHiEcpvHHr/+1LE4oAMMRdg7KVNWXifrSj1nf499T5gZ92FD/05bQcpSiQtAjzYedz1Va7Y2BUqhFBPVZDyjrjYMI6sbWg6fy9g3JcKDhwZAtmMMyu7pCBlSoKlXZjdTmb/Z8+7e6y3q3uia7PDK4Ptwm4hNquXzVUJOENtAEpJyCmuifRTTVZN0ELqS+pho5joiHq88gNrdiI0dkr0r96yM0UUuf3/gfLy57v370Elth8FipWdOaeXulV9WNuyM66o92mz1mxJaqyeTYcKm1iJaYGPqfZFp//7UsTggAto+WLMJU2xYJbqiaYh2g3C/2f////oZgaCiS5KBEp02StSXKxFk027K17TdR4EIjQsD42O4oJRQQD7pesnnizQNIFhgCiYgu/5hcTO9xp9570o63wq/rKVb2UnPCqY5WkpKjsIRDFM9goFbyN6XMWnEi4XY0IqANGQJEqSgw5XizWpAcOu17J2uRaMAiVCH59E+oPMYUHL2ZW+/NOxaprIu16Kdg8oDKK2WW9YNNqP3QWj/6NblfxQyMWjKWFOk6w6PaxhpUUt6akI//tSxOSAC4T7c0eNUTlEHu2k9InmWGnEUIvKCMADLk4PioLHl736TGDAXdXE5zFOKJKbtzZSghgeCMsIMs6hTjd/Kz9aNSZTZks9D3OtQdil0mNl6A/koxkcNc8+svO1fW2X3MEtIXXEqEBoItCZux9dbX+LNpHPUZu11QS2w2oikS1AD/P4uZBSDMAL0LpCBSEoKi/cA8rcXrk3Ms5gaFR1xnoGuo2c6GOdrhOLqyqjtZCoEDWfP5Az/9DP/ZhsY90VzzCAmQnRiV3Q7m+rurL/+1LE64AM2Pdxp5jy+X6erGmEibIp3/yVv63PIUZee1sElAONNU9geFcsnaikSnmY60IymUKhSM6KYo8BaYSegI4pHWGfUE8E1mrXsVqEd+d80A0snY12PKMz/55//oouVzzbzCjMQBcDgMK7EJWfDXoLOt3OVTUqDaqDjZUijcDDo2lA15tGXN2gRoAXHSNFgTmoOfiRhBw2LgJrFtQX069A5wjc1uUl41wy8gz7XPxUQe99u/9Rl//tp5qREYY/dfVpFETX9/Damu7mm/mxmv/7UsTmAAtE62NMMEvRgBXq3ZY1qIQPtY8P14qqSThZYl7ACBEWVgGt6QCmCCnInmkWut46F85etgFswO9onLjeFCIUMyFScBJCIoxqCxKJkKIoibT9T2iBqGVhcf18BFcV9Dg7PsoI6V/l3TKAe0sqP8VvQ//niaVP5eevUeNsCBtttRqJnF+1nqYOzDMuopRFGkK/VgbnEJVLa8ioomq1YpVfHa0PkhscaZwjrtDHAlaWLYlFGdiuOjzM+MsDJqWPVjngw90rJMfjIaDYhB3B//tSxOaADCFDa6exSblcm+2w8x4eeFggnW3j1sxfB3AaBVn20LRoKCGf7VM/blRljKasthQu3QShehcXPgaHlFoJWLbtCzzJ3/d7LHjjyDxU/rYtyJzeIKQ8AsECYAwQopsvCnu0tyr0zF0gx05fWSW3HI5KpnO1kcz9Q0ExGetZOKCeyhSVg6MRFdMSqoD90eUKBjI0I0SMLjJnt689WVtWrYThKCpMdHzx0JJicxa27avzZ7x0FUWtuAJ2RgEAoABKn4EqBfglMO1NmidbcXj/+1LE6AAMsPlxrBlusXYe6t2UobCMhbEW8xWuWOTGKwOSybr1ab0ih8ZnVihf0gsI6omlgss6aSs/0TnbS1ZdIHDD7jD5FjPrPmjo3OmW4wGWmv+4CUoAAknKA2hASHRSqbCiNNvKVwOllKmO82LAQPhIiWDs802INuxQah6ctD/NS4K52UPCznDPCMyhhwET2ApEtG5D1uHqo3qU+Gwpd7m1sdWuCQACU3AIMgGyGIKUohvpAViAaD5p5WrPOMGy4JazJOS6ylj5nU03b5KrGP/7UsTkgxKZIWJsPRHBlBfrxaexmOtwrI+j2EkKX+sOqSoLaRw8UBIKpJQZMh4OhY0aRdtS2FXM+6GbKwA29uAO+GQIYqxNYXOwGliUDP3MUxKZiaabyJFi6DbkKAJ2Kkl6l2zyTZlDpvh569ldVSGXhoEwKIlCUucTZnsTCgbEqds5WaaJaYzFUu/RBbsLbaTiacBPUJLVWJ0nhUs5pHEnYzOo3BHVnVwC0o/2Ch9Qh3zZfadeMu89oRnYoOjpxAxKXVxirR99jPoNUAglLG73//tSxMWAClhzaUeNNgFEEq3o9I2ic76h1babn6KxCM+QAJEBlkE6GxMZTmD489bvu5lakUDKKyoMN5uoquU9s1D7jtd0riyNk05LQhS0W5b4g7WZn3yBZwQqe+KCURDgksUSn45vMraExRKoiPNLaCC/eKIBAAKctxBFK0pKSLqDQFI9GVAeu17HmcF2i1Czg4aMSw6Y+hj43bw8Xts6topo3l52iO3x2zutO8+M4d2mt9PdKJPNDez9w7cihnwkw+/lBTLi7SR8QR5TU0GDqL3/+1LE0YEKQI1m7KRNET+RrA2UnaDKx1n3c37tAKxMi7NgGoJCIiiVo8SSH2qVWg0y0HNFOGE80s9VfHzLs3qeQZ+3LzQ7ss+w//gNidpKcNKRi/KMN/v2e7OPXMvOw2ODUs5jxcGxeF4jmgKKxAeLhkAnhLCoqCBUamoAAFgU1LuDmoaMChrSX63BMp/5Q7btxeC0/20TUOzx6rTiSDqAkQmHNoxf3P/kNZ7s2+kGzH/DyG4/S001DEyH1duqKe5cSlzi1GkUo33JKDLmpY5h5//7UsTegAogp3mnmU9xSpFsoYSVttW4mVMpvYXMAEJ27mg4NYXGTBeJ12wP+8MOpaF0nmbWKDBxRVGsqsLZUwAiOebHXssO+DnmBxF0poQpFlyyaKT82HAfeBwCDcoZFgHeYhwESBCmMV5FzXmg+sUHPqrVaH669FUAC8NX+NSXCJiSaCVTeGGawC3xeJljci+ycztSSU5U8ruYyzfaGBllUMgiHd4kIdblz5G5VYFAhQSyxd536th6PPrMLpo5ukdJPp8oWOeC0+5YPsNDadmH//tSxOqADIy1Vu0wbcF3mG0k9I2+Gv0eOAATb2MhZBgwxAlMRVCHnbj8EOCu9VM8ESe8VdJm1atjnGmz2baogvzvS+wfJLTzzhsQE451JybqXJOquo+qXk96u+RoeN/HT4sOIxVo8NGTypEiYnvqf6IVGoeJ3iimMQ/ZZ+gBtpRshJJpOApjsPtnFfJkfyJQtTmq+WD2UqmORXv+3LpFWz1F47kd5sWl+9CN2mGs8XIy0d7IUj5ZVQo84JUXcqt1ImM1nRo6PXWVSTEj+nvk7O3/+1LE5wILxKtdTDFNgWwOK42EjaAVNuofe//8hlQKBUASbklOHS+aE6XNMvuW0GaccVEBOC5k2SOzozhdOpWLjfwe4ZXbm4f2k/tpoPpbv45ZrkjiTkzBWkvv61qPip5pDnBUwWUcDQETxsBro/dW//QQs4fOrXm1KgmZtCiWzaxOVRBxY+vlos3BT9R+FwM2tIaJNFEywwikkUoUKS9huP9R33vRZU12Z9dVAzVTZ5UEmXXwz+NEKggySoy7hm8ntZtutN/ranbVOjr45aGVEf/7UsToAwt4sVZNMPZBkRYrTaehaHIpA9Nfdu2AtttuNJtuOAbqsJHKP09SrTe0YfiSRiYYFCjlnMLBUuUGiUZEg+VOj5/KTC0PlB8TSG+lsr5WS2Ainuc0+JG9+hyERWMPSMD6kOQ5RDG/X1N7W/pl2Hyop1qj4v9qAAACgABSl3wCrJwClMuTJEMoQs5+nlUSGmSnjAWJHaOjuCmcIs2bFdiB21dbtJHtHz/lyjlYoIylPCvklTHH3ntoK22Nh3No7Vs+8i1BIuypdl+itnHQ//tSxOYAC5jFc6eY8PFtmSyphKEisLXpWA7056nyABKKcSAaKSUHsKaIwh5/q8wG5jZ6qiIe7YgKWXTUk37hXMFiHBr4UB3oPZnEQMBFhmOgEIFPnU69nrbpHfi7GUGZas/oC9DWhdZ0tzrlsvGEgvWc37qfSbkGibJ66gBANS7cCB5d8T6XEbFDCRy6KrUlV3MIyk/GNHnOslY1hlOCNe70UzFia1azhb6qt5e7N3YEl3SrZWdJtcJgY7HQUVWQc5Ga3Q7fVKpq/1KW7PJRWkf/+1LE54ALzTNnLCRNsXOmbrT0FbehN1Tsb0fXP42oAgAFyTAyoN8gftw3bW0VQK8fxOUZXL2sNydyQz8qpI/F4Iu2J6pDi4rn82mxagIMeTtyCe5XPaOS5SE58jnPnQLZ1qxNxgEFIPl1malOOE7L2fSt5I7Wrf9tAIAAABWPAwNXeg83ZzI07bHIcWq5bLjY2IT5lAegeI0AqA09kQNMCGTONjU7BDeoxQAn//N13u3+3/8b4XFQ7NMM94Ufj6kUygekdx6v+DI+W/T0kEQodP/7UsTngAwNB1usvEnBc5utdPeIvsf0Ko9xu2IEEtxuIoFJJOU53pSvVUmShY1wX4vpxQVc+fdiOsIZ5VFlHOnx8BApXWCnz2mFu3YkiXSxFWkzXOhlJ0MzP9GPehkMWVdWr/7sqqWGsDKmOUHWuOkyqyppxBTMgTkDLk0KBkYAAEpOUuoGQUzh6BXEbCyb4Qs+3g8nyHy1yxwWEJ7p7aUgjrj7SvRopBPdQI8++n1AaK7v38us857O71aqyaMpPff+je+qe7Zf1TdHXWv/2nO0//tSxOaBC9lLWuwwq8FnletpgxaIj8hh0uMuKkJtyNEktJuARjnXmxgCYnHunYjIGnRF8H3kGn8ve48CKuDf553qXNW4CRMdnYMduX3jEiY8uXDNSL4c+8yLn3/jKAyZgk/vsObGWpG9p2maSkKM8/h+KjUMd9Yib9tAtQiXJITckoKjlsoaQtYeB4AzjDvO7P1cpK8r/QLvRFgSdCNKyyaHXBtyUe0RcaKveQzFPZSIpmZXeEnrdOJCAOiLOL2VEdzuz5p5FX0/0JToyDlRl/3/+1LE6AAMBN1fTCTLQX0iLzTxiebglguqjO/+9AbidSRKabcAnbcZLwmhbROjxN5UlczqY/zZ52KLZCjzEXP0q7PUHrchyBHvkVz2LXqj9eaP5ZAyK/M6HGh5FNVhGef3yyN9j0zQop7RShZ3kRT5C+EPMg9GSV/6hsQKv2Wk2k4AoS8HtXkeqEPOCZEhqm08E4epp0bJxthJaTT3SRQuXjgPYrGiDrCAc9KHXE1zsU9h2ZvttynzIKPiW1a1OC30XQyM2r9PcxLK6J8r51UYe//7UsTmAAtdcWVMMEuRfiRutYMOH0QaVUOp2IPKLocdIzDJBYqG8aExaquy4DjJ+PUvCVIMepbVzFJJmx5Kwrop+bgJHJ5R5NWDQLIe4gKwd2E0WI+va9V8vCLcgRnmdNhM3TWFi3Ginjud9fs3svX18Z1+z+g8hY/BJH2L9nf1qgVauRSJKgRepCZj+ufHWjy7B4lV6kFIty3lgbajVgsDqVZS/myXZw3lsO5X1rYsnGjhlhj+T3l1mhjlHsPlZfCrkdeEfl9G617+P/+qs7YR//tSxOaAC5kNaUwYrtl5Ja508w3Xej0TSiDkZh5DKjsIXg3Zr4y4BRcvAhfUOJy6yOF9majdwv+L6hcOv3ColYlEbh9m/GFNg4arFUe0TGNvI+v40ESC3ERFU4vWc6ukUyNLzf8IPkmjNBSYoduKIDBGpsmlaz9cMV0CAAQCU5fxEuMBBM4WHSTQVL9kxxlPF3U6kBY7T8XBWn/CIQzJBFrl6wEiJKzWUAbgx3kWZTqyL9ypXdLi0VliETiaaqIrAlIA6aFHwWCMRBw3J63iHMz/+1LE5wANDTdvR6yv8WMkrST0Ffc9Nqed0zHtmyehpnfP77v63GZQfl+EdL2Fm/y3bHzs+WhMWU8Z4+/O+fwZLxhmfIKrvWIAAApyUnYlQMiEkzXQ1A9AYwsBqKjB7tgXko6mVGdUVGCRQuQrJxkXegOqNOv8t0apVN6s3n0yIzLp/nPJbP+3Iv+VDU73y/9y9hmErbHj5IGjcFXafeWsuEQ71qF198CU5buQUYgsLQitphaN1tBNGkImhfWGO2sjfWsVVoPQOFiAOLLrEJOGwv/7UMTkAAw1O2lMPEv5TBSrTYYWGFcDQmKgYs8kqWER5woCJJwDbIPxdayvzS2k7WYmxTdbO6iBUb1qBp6QEIBARbA+jVETTZvqk9jeKI4imkXLMbqqxgNMLdOgKoO0DdjZnMPnFaz0czyojumxbKpbrM7evl7LnNouXX6aWX2dz9+M9hB7Pc+1br1XMlf+1QUgVEkCkknAf5plVy4LycRph5Rl36lM0PLIWJSi+TIkQnHZwiYjS5BmBjOJMU5lNaS6NsVpuERCpWce7H6o9PX/+1LE5wARLU9bTLzLgXierRz0jarqVGts76fVKdEMqjIoINO0RJxMgZ1JAEAIIABSblAxArGNVcmLtTXalIqClFsFSYKRizztEIws97JWgkIVDGaiKJK07tzM77QRDP6uSnqIrK71EcvV9SaP5U+3l7u9G1FZTQfQ9pN2+lUCABKTcAJ6cRA4bTnLYK1uGAKpgzT6hGHkJDEczJt1bxhqHUfjVne/ex2IHuZAJEiWOj9XbRqoI0PxTiZ8NBslnLSw4DhKqjy48Ryn2ijnWcimAf/7UsTRAApwRXTnpGkRRyHtpPMJ5wCW5KAcAq8miX4tKB24x0qyxhe02uBcQSihEW12D29uLx5PnQfylBJPIgjmyl9A9mcS38/sOn3jHwFUsSil1g7w6W+UciwkakXsIIivjR1+kXAxI6TmXiEh4yTp6P1qf+6Vz75a4de3x9EFEwAU1JAQtcFgjXnTiTksfMTmRkosQiSRoHie9ZP03fPeomtzjdbQKty0s74ujoIPdjPKHVqxZxUMNlrAbVE1Fl/RsTFKO7WV5hIXrOfY6xK9//tSxNwACsELc6ekTrFJIay1hgkiE+0bMvQwn+olMRlNpdXhiEIHSfBWDhAsMg/QQrVF1l1yiC68vqmPsbBjFV4SkuBJcoonmyv8U9gmTmX+CmiSktHpfu4ov+K8tdNBQlQRDkUHkQ7PigiaHFm2Wgm19A+jjNzFAEk3/PuzZgLAVgepLhypAYmsFc+vFIrTRncWr5PBiqpMvU64K/avyyF3LG2Rm5OKuPRdSx76Y4caBK/vV9RcKCdYZBzhyitQJCy/FKilTbTFFhQYSvgVb5L/+1LE5YIKOJ1e7CRLka8k6+mWIWNs5eNamWM3+aQ2DKmdZAsLj3gA6IcIAaSAI+sUoLMMWhpTmGhaZM9Njjd+pvQZNmi+6f8X0IPMwvXptto+WY8sWPgOgK75MfFewKRRSh+jGDpHAQBRNSsXThCcV21WQe5xmaqkMpZG5hNPd5lf2QbtQlTg0Pm9YkiTFAwwECEERHCSf5EY6IUYyhRiKUu5ZG9QIjkGMihzqSqNbQ1//pOMt+YVBiUAAhJuCMJKUrIZEJ8foMMscdqUqklFWf/7UsTkgAsg/WDsJKnRahWt8PYgvuH7smh7Elxjgqcg2pWl+agahWpUqC/k/y9KQqFz7e4NC99S6RfzVemGOsBCAaImaGdi2GCI4tMTCpBThdoQAJTcFE8KYbq8W9nLqTEFSa5oheMiAdksJLpGjzztutwsb1Kle9/iVHh5kX8fvHy6Vy5eUs0KUnKfpmZ/nrD03Gx8irSdNjWqo//2MKsRWSQpATIAAANS0AtjmHCItGFhp607oySViA6JK5aDx6WIiai24k/cpXBSs5ghNrHT//tSxOiAE/VvXmw80clum+9o9I3mw3Oddi2Px53QMJ7lVUOVjD1ZKvZP0QaVFj5YOOp5yS+6go93Vd9v/XSQAABFyAz/TspR2ZrEmytq14t2JAPLFs6R2kk+VzX0xwhG1XTYCqEzC8gskGIOj+iwYof3XBXeNbFyKrSHzomagNKfESFH4uqtT7XkkpzDRsRuZ+j1KgAAIEAAATJgiaPwGshQC34q2rUi/qKJkgACAoAsDT68+uzd9UeLlAjL/aSnbsFC+pj1JMH6Am6XdCGelOP/+1LEyIAKiN9tR5htEU4b7ej0jTK0MrEZHXXrq18q9uXkMqRupdX+jcUL//4vThorP5kpqwZO1hO98n5lK+I/EmpulSoQ2CphUnE+3kGvNJcxGMGrWcx/sn37C95Ofhs+ZEoyUHO867s2nUQ2QqzAI676JcxX1GmZ7qz6Z36v/Tk6Cinv1NkNdQU8QAKUkoYAdYafbbMwqug4ctFjpxuTdWAwyHKYJmI6R6zziEN9sLykw/TtEj8sJL3fanu3tLruptaotZUdP2BFjmVKqAMQVP/7UsTSgArEp19NMKnBVA5rnZYZ2DhcXtfVtSxd27dnMSuS9f9rnE0R9tfqqE7pAQt0BKTkgAhlOVCHyaO88GShTBHyB3se5mlZW4UgMOGKNi7sEJZMLblprxzHThWMvWWCjsrGO1GitjGMoWNZXarnnfyaas5rCE2p71VmbXahrOtfsza2/843VC/+lQk+gBVrAHJVEtV6bMK6wigeKvP1PsrOAsjB6bHHvInLvi+nCZEwlaXw/VptavgqnvarG2WqurWR9+XwXK9Is59gfQGj//tSxNqACwEnXawwqcFhpO3lhJV+QL7mVO9gpFh78Pbz70lAQYQABKcgGsJSJrwU1p14bgFN9A1jLzcdSP0eEqfyIQb05AKFCBYHGWS78VW8MpCON2kc7SctLKs8oXKZ//1DJP9BKFzzeE7R/PBZ3qBYFzYw0wwg+wgp4fdB/dNKGTqQGVsBVCulQrWtVrkv8M43BdsssFyYY6vwe05YwDexw28a963+Bda2dF2vKwh6iepPOhLWX3ZNbWcxk97FlRKkCN/SXVOIVuef7OqHFRb/+1LE4AAMSU1jTKzt2XUk7GmGHapzR2RK5IFLYBZDREnGa3F6eMpRi8EshCuVtUq3oORRPjRnrtCs5y1fwVZqu293e5QskkDgtx4U0ydEMw7G5GWiMWiUueUtlBmWRP0qVg7ly9x/9f8itIobjZRvLL85pAqEBboJkzMbGT6QJNuXAN8OJDR0nKTqATwvCiVxdFCrVlzQyjqxYoCEhA13K9bG3SjmwLRgi5iFyyflR1KTV1DqR4O6sZDMNuhLyqrrpvPqm5GbKu30dF1f66P/mP/7UsTeAApQzWsnoE2xc5wsaYQOGjFcyC5LY2aBD+UJOS7ANFyK9zK5XbOSCgCXKZpPVPxCWqlxUqB7ShDlGC0s7PzU5XNUI5N4f+H/SitsxvG0ARVhuwvn/l0YXTBpPMVdWLSDDkSId2NDg4+baD1bCBY6iRe1NiUqChDaaI014XtIgZBQBCw/UmbxDzxRTQdR/q5qMfq+jt+YwMro3N/+12oXF5lFYlzp+EdzhaQHax8BHPbb/7/hGPUVmTij3+2DIMw698aD45EOkIqGlovc//tSxOQASqkrbyegUTGGpO1k8w8GTo51ZEIaTRAKKTgMQeAzVyUAq28g4z19Eo0kAwNASBzYJWBTbB03cAog8NILzvI8hq2BFiB25w4gQGwg7t/+pKXfzWHguPy0nbIgv2COsv+3+h0HJJTjGudyypXmAXcNJcE7cJ6vMQYABJKQCCU0ziz7pNjfhRoQgvQmcNZwHh8PB4LYFOmjDVQ83RxjprY/90mLlcQBCWC8ZbZCSuYokQ6irGKXRruN5E1ETak6+nRun/kOo48wgPY9e2X/+1LE5oALiSltR6xRUXSa7aj0jhrOpbneQIoCITl/xt/J6gbYUBUsdklCSVGsMHdizzujSWXPuPFDSw7f2484Opa1KSa08Crdy+q/1xcMBx+5DcSYj5wXZUjnGtOlCa7ikZ4O7oIGqp6O/laowV67/85HqMHLih2tEAf7F9cEBIBcBGwINDR1ntdSNQIUBhDqNBUvp0koDIoX1kXSkYX5R4IqRae12MDSxj5otbhbr5htueI4mK/rbu7EZ4gs2vb6g9YlJpWbCbViTeZTejuAgP/7UsTngAtM1W+HrHDxjqctdPSNbyCSnIYMCloWRdQSQa8p2kIhq9lBblDwWIw2ay+kfjz2SidYJGXHahhQQBJoy7Ehzi9i3MvmyTCrahltuH9fxWwXQJo4m7vrNu2gcIx0eHyMQmZGVk/QiamAAULquv/vs8vmDjHpVToyuogKEtVziYc6WuSoAaRyf1/90f39nv/81QAlAIBKcgICQYEW9Sr5EIQZauPMthg+iJ0pCkXCywMZ+Op2HaeJzLJOOXLWiKjM2DjYJD1XWxlZ8XiJ//tSxOaCCzkBXOywqZGQoCs1lJbIWKVjT/eu7uLuHP4XWq+LlhEa5lf/+kvl/KX/wlEfOHVA10GvdFTh+H7syEVQAAKTlC4L+rmYgqGORagkSCPi8eTFlCPssiZNoexI5OvYXK3ztQqRyQTPGfJVqgZZmlAFVVq9KZFVNHoCs269/07OsVpdR1JbnKgJ0q1aCJoAAFJy5VH4rUu4kkQxwJI2LTiPD9ePkG4tSGxT7ExEnemQdFLl7UFJCkQwnDatVrz4lnBnDKBUsSKklpDrZFv/+1LE5YAKKMNjDDEJsgsna92WFwtGy1zCLtxH4NzbbLtONqtS1rgSVAJBTcuPESZoPHSxAF7MOEO40KkDSPPYNEUCt5IlrquqCnRj6x9OqnQucHMP0iINJPB6u4IR0Smjjja+hPnRe2z4WJnB0OoZZdsvXGITfQxnIJKKKcDiFnZDzGEOmhezjUJLGmOkaLMVJbyst7jlu1576wjrR67e2YLOKEAhKiSNmZmZqtmbwVGNmO5l7bDkFREM8tc42WqJpldv9JGLRrL01fuQoucNaP/7UsTZgAy1G21HpQmRQCFuqPYI8lXBS1Mf7i3uBgKcRJSSSToFTUfxASAy8bjNWRGBumC+BUZuUVGq4NV4CXbP8bFwW6lCVmZEzutHJassv0iHNdKd7oVLvRydimc4Ic9bA61McHhFUez96g8EgWIFJbdzQ/vQPf1i6gWW1GkS2mnASo7k4aI3jjTLCW8vxC2iiuRQJg0MnbKH2YEyKSEQ7nZ3pt/byOS8eKWeVXyrGIs5nGQueY7peW9zBAe8IB1x8+4q82QufvdIUdx5xYFz//tSxNyACliXcUewRdE/ji3o9I0qhhguKkTs3aLgIBBSbgMycArsFFonLVc/AkamZg5cvpZWzGHXex3Szqi/Qk0eamwauMaJX9pG9bR2jxfd4KY6Lpq4MvjMZPmRFQED8SxyG1qW9zXTxq2OeCQ5qLnvVX7RWmIlqJfTCGeQWasDOJzHJId6iXSLLRUxkc+cURYyGrdW0mKbxl5sAbvhsRC+2qdgROA2mCf4wU0LyOzX9Qx5H8Nzo7POmf/m/hoSiDMKRhsEnljibWXD4TeMcMD/+1LE6QAMQT9xR4xXMXWa7rTECiZlQjrQ1tQ5TqkzPCgmFJHpjvrWc5kL/vBnzKC6SBfvZWGeD2bUog63tII+jekMVGqJzHULBQyMOwJ3cq0T5lh6ykeyI88ZjqJRETpjqIUg6BYLioPwq24XddpiKtJ1qGIuJHGrBKoQZVbDcIOaI9RBR4HeexbyuPZudq8mCIEaZmTgMY0wzkht86R/FkECfF2kgJ1zCCbtMQTh8JyS+WyL4xwiTevPNz9bD84QQEMgApbZ08AhIZQky/8/T//7UsTnAAvMr3WnpG2xdhmrXZYOGky/ft6fZTOcKcEGw/FSlzZMBACJAE5nJm34daw4mEFay4cVf9XTLIGZZE5yF3+QSYyCWrREfyQFCMtL6PENCyyGJbSreBqn3WQtiqpfFvbSrCI9Yux8a8+DjSIoYUBZlZ39O9UEmiAU03LABSDAZB1kiPwGQCXMtVo9DVJY8U5BQn4G+hobigjR8blXKZ8VV7Cco4i+PROPWAKKJUcAjDBYssRFkHAKdc0VBcyIDh2Zc34peVS9M0xy0kjy//tSxOcAS3zdaSeYcrF4mq0lhI4egpNBRB2ZqrBOcQJNuXBQJ54Obo4F4ZJKoi12AXUsXY7Qzj8+BxAjxaCjim6psXCyiDCo9mkn9hRHXMiBJVqAZmx93oyIjIzFRy93e+Up2dFdkRV795eyFquU9VI/6qLBiKlwEipbYBUphV0wlttuQAdJJSABDQnJhiaiEC6ZkRYAmVHNpJeDDr1kX39LOY9Jlu+ArtYPM+jI6cvwseZBNJ5tBa6Sk4oUa4MvceE6XMJorBuKiyCqkONFqij/+1LE6AANGUVlJ6RtsUoPqtmXpgg1ZizqGa8kIpNuAT4n05atRXk/KUfifYkuT1DDrVCXY8ADhhorJHtHIZ3h0lyCyA+Jt0Ir9RrquFi84MzNckqxjKIv3WYrbMfMEas8NFyIlI5CNa8OK33zI5l+WMh5yF1C2tSP6hCrIBacloC5VQrhJLHWKe3joJCiimThOjuS7ShPob8qFpktrOSS95eelNzcxIaVYEHgliaOpfoqFngz6BAymT5xqaaJhQXWTb+Xhf0/hXI1I0MlVCj5ef/7UsToAAvwe2VHpNBRgCTs6YWJ6sf8+elGoPMOblDLWyL1WCBJ1BHKcI4xgjyVxyJRoSSlVKmULFTKSlHfnlyy7hDV7tFoRaZQUnvjrR1itwVLDH4wNlTDFCwFEoXCF70ljwqBzYXPvDhG0mgM1100ZKbO3bBDDskcTRTbclBOXBWhVArOAYBxIYP034MJWqqCp4WuiaDxp9DWx65043yXKurGg7Y5a0rfjjGCtY0f7PDzI1Iqrr36a2uv281YseOOXjNLzO33iYlDtFpmAge3//tSxOYACwC5daYYsPGCpW2o8o3/myw9Y1q7i2HUljhkNAALn/BjWmI3QSK1F/hwTt1Idf+UTMC0titiQjEB4VBCEg3Jjy6lzCc5ZzyB3ayjZlOz9T16Prka+rPX2r93trPISI2LvNnReQc00kxWkwnTL6WhiqD3VsWLI2LViQPGieuolAsKnu88+pBiDkNQdyZhqHEaAwp8oxjutYWoZpiNiEKguZozqHTqTFX+2U9bnnaLmNVVxIrmn4WsKlvaos0KmC5uDZSnTygiuCrzDgT/+1LE54AMFSljR6RxEWERLSTzIhax/8f40z33uKr3b55rPp9f5srNer+0ffmm72B4HvSmfqmc7+38ePSBEUajwwTKp5EgaZ4kCDnf///////3/4/+qU3jX8zi8xu81JNmRiVVQAIRScoHGTQxx2MxB1y4qpZclVBXCyyt4GZB1mWxN52en9OKwt21/WUpFz/SO7W+877/8TN2pRidlNOPt1lJCoLMcKHomSQEna5RATl2L3syEIlAcFjwEicqhzjpSi6O1psVBmVgEFJOUlR1I//7UsTpAAy4+3GnoNHxTBlrXrCgAFXC5wgYJxq4RgPTpkjUF92za/3BUSoVOoUR6YG+SF3LXKlkZ7dlz8kzXzFfVWAyqzpCVRu0WdgFKEyrKmOY4uRHtM+nIyT66KCiVEUSACCAo0D1nWW03MDsNc1xGSpZIhuww03bm24jZF75uoyNw5SGx3WHc/PQVTPDZGHC48w2yAQQagVB2RFQ0E44kSX3XfdSqdBRk7ZeJDlkpSm0dIogcVQQQSnQa1KJE5s7W7q+rDK2PrWmXxQvGgzL//tSxOqAFUGPcVmHgBmRFi7rnmACpbYWVrDF8DdrNV1s2XQGhkKIllBsNmXBwOHrdFaxU8TWnIa1Oq6fwJAcsG13RAixyik8ZOOjEyGhQBYAEYYoLQS2Erxha1YLVePxvYSx9HA+JIzuJd6UyHEK/Mp3GMlkXsmpVx4nAzLGP1LzM6h8rfnV5fy82zp58z1Wgxda6F1tionSKTfmDlHGtSkAAEl0xqDEMjZRGmEMjaaAwuwJA+AUUmzRAUJwMKtK7zzVw4oEqGycFHAYiwTEON//+1LEwQAKWKd5R7Bo0VuPL3T0jZ5BVJgNoCKpF71MSGUqc8JtJeulmteJRp3d0sHGrN/cyhTyRLqICLm7ph2VvtPbV9lUXrhpzAyQmBSjMLDzVCOXKPdAq+WLhOpwdLmeaAzDkp5YAR7D6wqRWoBubGFu4wo60WZVZyJNwqI8R9U0BwidUgODjrUabkpqEACUbJRRRTwIwOUcA+slmoTXsYgA3hZENlBUPHCpPMQEbRHwSHKQ6sZh54g3P+1zBLCY9NpT9SfMj2IZBKsFjpmpZv/7UsTKAAqYV29MMGsRTRpsiZYNMFtCIW7K9PFahkyCr/+K2BcEtRIlRJO8DcOxRFCZo3CqR7Cp1qq0r4L2j+aC2UDBmsyq61M9cyUQUgPv2Fg3MMQKCU6eiRB0G0UzAkuWQiuokPQOW3sXrPDIoSYVAowgEnpReN1e6igVmJKKTlQlu2QiL1M2aQos+tltwaOlM7SID6olrksNOd2EOtaPMykpk4M4tEZSZ5GWIsvwOOk6DCN/Vt83SWJrX3+f4Dru46trua16eXexvtkpzCPY//tSxNQCCmh3YmwkZ0FUDGydhI0whY7q7u+pwge62wCABJKbArgCesRfqJVpOy4oQEOCsNpTsJMjphoowqw6D6cXAuCIEFlFfAq/kTEUp7jiNKzkXZi9DbQfGtGWgu4dHgTEkzYgBc2JRMhSI7GDs8onipRU23OcihKfhUTRLs4LEOrkmwXx+fWBOsqUVSvptMzpswiWxRty36RaC5AnZQrIleHgPBQVigVkjr1fG4qI2kKkykwSiUaun/dPuWolQEACCUnAGMlBonMKGATEEOj/+1LE3YAKPKVrp6Ro4VqPrbTxIiSwErVkheH90TkChWpiiYQTzdV+mzj2swsuOUtICTKiigZFWR0OuS5anQcEZ5jls77/Zf+lnu6Qq8bH4r4mK23YFAnAJwGyQdgoKR10WDTTZghHnFj6FGwu7KYEtEfCj1gkWB2VArVuCZcOBV6UO2Mk2hx3EQheA59/UcWPGhyDLR6pf53s9ofDB5VmIzUAAAOY8nIWokwG/iw8ghDvrnV5LarcXrBAlGCF4K0eYYWoS08hjS48sEpQDeHxOv/7UsTnAAwAh2tMMGlafiwsXYekcVD5UscXGQYQSelwcvQdNGEbStTnt//j/o00eVckkCIARs/oAIABlS4yOZaWhX1D6+WTt7Ll1FVZAOkYQuLrWGp3XJKZ5AmytKza59gwxCzeDH9JdF5Mls/hBQ4k8AgEASCksP0UtbGq+aU57hEKN+nd7LKLgEoDDyE42DZpDoBRAQhStV1pKTLlsSeKApfQRqNX1E5kgMvMiOrRynORnETDmC4vTp0VIpBiiGicMWJnS8WnVcnpwLHv+xpu//tSxMUACeBTb0ewY9E/ii8kxIzuFkeG3CmmHu+3/vQCkyAklOSiOAtyZGUZzScs0I0VJtPtsVPTxzwYj2aW5khRvHtfLzYxFNkQTKNRO9lreqeVEXhIxTWdlyOdWIjL16CXoa5LjitKFRX/6YrTxyYAwhpEgggkqFCTEJQao+SUkoIecTwtIiSepM8H8N7pJa41IFTCE6LW3brmFgZzv1K6aH5VHlDJ23pGvv5H4MYDzDMFYjOicsLh9yzuRPvGIFjTXdqURRbdZlXHgbfMAF7/+1LE04IKQGdibCVtAUmRbGmGDTCVo7AIAolJuBBxBguuv5QxIxhzyQesZBd8zTBwkNzfwP2cW9gQxzNrMkzC5RHIZorTTQNFhu05dYzgktnKHTb5/5VBWcK3Q6u/mdLT4U7+WlIFQ18DfdDCWb1oY7ctiS9SMihGqgQD9CFLQr6CgMLSiYy01oTPwe6lMFSILtxIOCj1WFxkICToeuvj7QTgTitnUCAgBMYQrRDTCdIZkOgIZI8uhJh3QGKR4LAHjnxEfuX6fu1Pf/T0hHQxC//7UsTfAAocgVosJHDZQ55tKPCOsq5QQ4IQYRShWuEKAcFmW26fYGLM//RwUlX/6S4QAGxGAsRKK9YICdqOhIkRg5SdHRAWosVSkiENQQ9ppn/3dfzo0x4x7bXiZIhQr+ciBAARXigpR2XggCARSD9K2lzYeQcKfOX3H6gxAIZT4E6MhPkwM4kxxvAPp5G2zp1l1T2kqysbT6OsDLD1MO0wfvJjw+9PSaV5ueyeo3n2fhiz6WnLkgCrsZk80zkv5hVdv1YSpOmMoakWi6qKw6ZW//tSxOwADFila6eYcPGHHmvdhI164KukEX1hpMmAqAURAgAHNthzBvt66DaFeUSrNwPZbj8JT8bRrPZjaczRWBItEIfSZP/JAF1nTpCjbhZRVnq5bdtWV/D6vFLZ7+iWu/ebqVzKJiiSNQiPDxkkgCvW0Ve8ZptEjj/GjkIGBkgCCW710D/F2Oo+TtNVBN43wcN8ME5bOXVtT2UV5FItbMedoOHHI0DPaZr0JpCY6oclJYXn0sH061HMtN1VkbY0AF3BU+PQ5AXMzqakqo8alvr/+1LE54IOSSVaTCRryTKSLOTzDeD6pVVNSLGtCQQIAklORPV7h4kJhxaILCN46AYYQx4JKD3zKE26j0pk0fzMt5QOOGajKTv6nmuCml4f2dK6mCOG9HP+/0EdpVeHVm59os8SKWxBEVUbGPNIW4KgEFVLTbJH7fi9NQomHIKJKUKZMFvcyvyeR4eVhx/CuoGUdpn0r/+U1hLQK/UmYq+aXTqQV3+98FceU1bzBGZqWgvzYm8wTGe/NdR6ACjhckSJhNRcNpE4GLptF7AfPteaHv/7UsTmAAuE32InsG/Bfhos9PYJeIdR8kmMyrreoAhgACSpcDiflAK6QUWa3K+6jcplH+2BYhBQNC77ihACG6sQhSGxIZhdE7vVPMlZMrISK54Tbf2PPkM/onXuL/3f62f5UvhHZKzokrjC9wFe48xJFqTrnU1PGJvNdKoKu+Bv6gfytHQpzKSZKfomivL+8XSSPrEa0VyanJx8pjFrQX5BxMqVTMbT3pzNLDbiHJjuERtqtQA2ValBaU/k8v7dw8LTNgUMCrGmyWbpF0AIJw63//tSxOYAC2CRZUewacF1lizphgy6gkwy3/YASnbwA4mohgek4na0ludV/WFJEoXvLD9aMyLVj7LMIP51MSKspSDPuDirLK7LY+o5ds3UzTc/E9o/40U+IB4552HJ7rdPxc/kDru7Xnin6uWmPjpKIc/NZ8iiOw5Q6i7Iv9kW/xpBNFxtEtptuDGOI25WU7F0lni2fjujGk3FCNy6hJ4ZGCxd14tL7mPnn9TxWW7FzbqrRxntNcouHiJhTk5e5HkJmpOKtJNVXHj0pggdSCAYWTL/+1LE54AL8MlvR7Bn8XacK6mUjXBqj4kS2mjpu6QQDAAAAS3BUgXwAoTYlyHE8nTg7AHpOsO0yoFTbxrnux5q2L7BSQpvrmC7vuXsgdSvotrv7nEF2uEAARuFC6BAcg+I6AfhgPlC7xAAwtUcE6imJ3izA+XLg4gPwwpriKs4cb1f307aAQCSmnIXVcA8XEsCLNxDYBxI4sEYmRYMMEu3kGQw6xwYI2Pq9TotqtTLV03/6TsKyB+E4Zy1k8wLvXXqXh+k5UnDjzpK0s4qW4fF8v/7UsTmgAtExXEnjTMxlZ9rDYSiGcxk1aBYtIRmrgJJqZIV6aidXRUd2Yioo6exRaILQdYK6nc1HEqhZZGCRpyTx6NQ3ct83G10grWik7oFVnhrlVLc7f8dhMjAAAm9+TsUgW8v5di+o5DW5Gs6ofh/uhG6AvEiIloaycRopMmtlChD5QXCsiB6flqf7qZI6nCtKcY8MfDNhALgJLmyZB50LvTWNSR4oSWfdPo2gJNSLRmqc+TbAAJEuQUAzRaz0J+xpqtDATAIfoLaer5iF25X//tSxOSACzjbdaeYsTGbEWvo9I4YwpVo6fFByBOAuYKWqXjMdcLhdBIEbimQSWpRbNZcb/vT/ncEHgeBhNO1bfwv4rAIcZ/PqN2qI5cItRKbRL8kQXEUkQUUinA+EkGFRwaEE/LY6n7dAseT+nCKcsGp0NJxupLper06tfb4ZRQ7RYIWknvCQEEOokeSUE1REihTJxydziycBUWX2RKp0cLi6A1oOuLBoz/0KhEEBFS/lvEHgGV2kr3jdx17r9wBXlhe5qDXCtuxJEzF8ioDb83/+1LE4gASBUVo57DR2XMWbaj0jZjdsipZsqyZG2XgoSsSMsKRbe+fn+okpwr3/y6CU8gzvjXWMU9VTqEh4BIq1q1daKaQjSRKJKcGhAqRE+st2Ze53+QBAEvxaPZDJxgVkwpCaFXEzRRQes1NszTTzIvmA2QTqVwrKoN9tEb27tovtY4pc5+KFxLJOc+d52Kqn8yaobi5L45AAkSUSU4DIMFXBQofUuhqhgfUJdKSTalrfph3URzVdBHj+jO8NoFcbVkaSrmTqojU8kTKIFvaXf/7UsTJgAs8q2ZsLG0BXQ0vdMQZ5nG/yRfFX9DL9zrs9yHMJI1K1NOzVskmxoTueVdpoi6P9eZ8MY5S0mLioiEKNrQ9ELOzOsj8aftlcPYGGXCA3XbNCTcRyOv2FpMGTXI0LVMNVy6eUO23mfKbQzZ1VLtpetuC/qx6BxjnKQhM62BvskXmPOoLSFUAQAvgQdMCAY9lazonAzux9l6+YNd0DDSgH7LHjytCbZ6iUb6/YkxAIcEiETABBWRCPOhBeIv2BTrYAnoX6lyDXwbm7Z6k//tSxM6ACmzTYuwkbQFWmW41hAmmDmfdDGb0tkIf+Bzv2EgABGXYtAhCPOcpcMremljEhf2F0IiLPHGmmHplGbBOW4q4JmJ+vJKQuzEYMkQWYDigM1j9wqPHvNmX2CNQqlxQXTPhiFxpddv17hik4miUzJGAAEwQI20BAXRO8lTirkyIh0NggfMRpee3AnFFTQT6kVLkmWOopoNdiloJpkyGtmm/EkEaqc7fjbkfBoiyUlUfTAwYJa6qEYAAFAD8ySCKhLIcSFXMiSbGdsDY05z/+1LE2AAKuKlhTDENEV2ireT0Cp4yDmQyyl/IOXNRvydAmjXbKIOukm0HgwwCaxAiOCjJpt13isAYJj4wFNRw3ZShVepZewUJIBCkJ9MIERFBi3HV3xfEEH+cRC6f3/P/7130SRH3Di3SNQc8LlHYH1caiAApDI2ADbLnDiuE3jqUS6puN3pRBllkDlP9PM5maHAtY1ahexYVHA1FVgkLCtMlqipZpK0Ux3f/euD0IBT+2drlapEwodv/5/+R6rqmdPmsIizi05J+2SryNccxo//7UsTfAApUr1TMMGzKXi1rXYMluTaKvG7PTooGeVxOElEp3jGD+JsXwuDgjCJlLiiVjnBZhojx3xWbexwZFGg3X6pRuwV5wK4LFpdB158ui4WAoCdjYUcYPIj0JbFdaS2RIvS3dPhHcuv877JT3hPSRtsAqJyVBl9JytAFyqNVEsyB6FUU0OKSLa5Z7vNCkxXlZj3MeafartGpFh4QCJU0WFBjSJNAd686+iUPK/hlbBWh+RsL4ur0mvCViaXdNSJWGABKcoNXEM7Uspl4S8oC//tSxMeAjnUtXsekc0GXp21plA4o8UrjhA08PYmSmAnujRx4lWrisilLHhx1Qy9yz9oTBTKbd+rEPRtHTuezy9XVuvMzWa56PT77tRxUFtcOpFCcOAbKIACEnIckpDMVaSCqopCQUIzk1bHuI4hUgye5hU9nOQTHXH0UBByq2zoyJpURZHW+VNPmT9RJnaVDKELp1yu5lXJ7eba+MDXOnb1tKQUcbesWKBVpn1rRq0IHj36NsE40RYdiTBnKk1STvzJMpNT9i8QS4dWvXLj2pjv/+1DEuICKXF1xp6RwQUIL77T2Cg7Cb8r67RwXDFk9W/jkLRpZu247Ul0eapP1y6ncEW6CkqP1EyHMlimA5VfM+1SI5pmn9LT16C3+sJlhAgUm4ANo2hTEAScw1UcKkUR9OVF04rl9YB3HOhl9Gn/+9gVCXnS3KEW8rygdkP5GZ0VXdw+LkfKxBDbWQFei5aMdmTURKv9v4w9r8qtmrRUAlCNAAiO68EvAoErk1tpsmbLLIAqF5xYOakZtHAgbVKwu6aH7u+303sxutUzNwYKr//tSxMQACh0FZ0ywpcFrJSzphhR601FwXzlB9spFPNXyUmr5rtZTVseGxtEeysrNKK5hAet51v6Ub//ocWb+1iQhqlBCKbgAsjF5G9iDjXHp3HtRuTIQNg2JkbwAtVBSVoCgLP2S8ItHxDsEK9yQSkeue/wsVAsG9jHMWjW+QIzU5r9bnuD3fk3J12ucTSq3q7PRKSjb00b+hbGNu9QSAYRbVwhmOrEhN3YbFw9Ki0PCGoZiOODgPB+j37blrElaqoXzVA9ZqCm6QyxHp4hyNOn/+1LEzAALEQVYLLCxUUegLKjzFeIu0lBUeRTxVwK3FT/3cbwQlBt0p+viupv5LfWP2HwsAyni0aFhr/YYRqGnwAAwBKd2/AHgQsJyAfCgmOM1Rd0dBZG5OFxF8drGzMcWFE9HiqVDnFpBO1lcaT91tRXS7kvMkZbeKDtSuPPEBoUqH2eqm8sKans3xWRiMQAbDwIsiUsKgVUFc0ys500AUCh0molCwfEQjYTLRS66mg6oGjmqkhMm5z5ZeSYIlWBJBhQXBOitV0aEZNjVg+ZFMP/7UsTUgAuZJ2GsMUnBdKTr6YSdfD1p4qh9CAAIAF/PaRECGYBksLbA4zxR1i2Eekzck6y8C5Rg5MC1TI8Xo0x7KF7vaD4vUdsgE+UghlzMleLUNPLy/1Q6Irg4KSKUIdy7OKKU9tODTH//V6QhkAJJJSEAWNkWm0IONel5RNado5q88hGTkWPrO3V76pqCAwfqTlpVwewQdeRibkI3PTR6/2T207feYhxQYBizr/0O//+AEMb4LO8iCLAAABJ3YzrL6oSm8dumeqKQ0zmO4TL9//tSxNWAC8jdXuwxBcJVqezo9I64R9uTN2BD9/Lw5JQcSkzI6uVH9WPsjgMIGxocsmXlUySgWAAEOliOmaBFoaCJb5Y2qvlUakpvLb97siQAXGAMOcRNoXJo3mikRUjB8kvv9dhweFLmPWO1kD3xAANMuKV3mnfrmDQwwzH1/k5FYFL//p5mewWA2AyQmewtAolMSEi9iFK4tSQfTIq/XQSgpAISt4MLRCguu1hukQbnBz0p9Uj2XYM02qlm0QyJb2aRgByjjupsKnIzO9TYZmn/+1LEuYAKWLVlLDBuwTCZ7ajximKNoy7rnre/nmOpnI6srOl+mpl1Qug7TenOe63jyTnw7rBGT4lFGSwPwlYFpVkzZRri4K6mmk1hQItDFce2JBJJ5XSAeHirthy/03FVLyWZg6I5P41K9J9JZQ8Il3Ge7vB0EWCw8OnmcXFdMyVf2gRai//tGaCQEpKShfLdQxDkKqaVni7dF0KS7hy0dDN4P36Z8S9xBy0R21c0uiNQBHbs6O1Sq4WP/UU7Iiif//GtLgEo8AEwgIht6mQitv/7UsTIAUpoZWVMGQ6BPZUsIYMOEMn4vPI7TYCAYAAAWUHeIZ4B2Dp0q3xdkK45Q8ky+EOT1RIcOGkQCCaeFr15WQyyBsqctYMVtJJVv2LJf1r4BU5TJloUCb0KYn8S+2cj/rX4JxQyOrqtxyhwkYWdYRoKp3fu6gSAEAu/gsVew1GpsPzSkQuGgVYqFwjFA1kkiFmIabZLjShtu4KhGtphFa+saeWIYiH3LvbZ+78EJW7391olRQvXUvFdO7wkvA8hLkXsUpKnl5feFFxHIMFw//tSxNSACjDRYUwZTsFKDe0o9iC6/GsKKLslXLu7i55BhA0BcWHA3FgAAQBwHhou/boLjyEku/3iPLPi4kXKDxReHRP/h3eDFHgAGEAABQHFqmaWTT3XTQV4/5sRKKxzAefmIdpgsmFpthZyCCEUWRUYZrRDpk79MYMGZzwvng5OgQAIb75hkMHGGhgHwACDHh020IIhj/0y7/C4vJBAgWVmFQi1W0C0QS3RDs6pZLaWeciBYhDzWZp3likUnsklMKV15GwZ7EgnC4oRiuMmHy7/+1LE4IAJ5MVnTDCpEXOb6umWCejbhio90FW9POyRZjIbBXQChos4sdxUiScVaVv4rXHA0CpWq5bh+i4AJSctQ8kinSQKkFCQBPPx6UJQsXHgHVEVBoh2heM9qOoNWG+n3SbMM5U9lpW20vMq8Y0lvf59L8KrWMQ45RqQVFRrXVZiBp0lvR/FFQaRgABScoJAKShR5nmlFWyLyglbXAlyaNi/HWgOI/6OZ8GX6qAo5+pKGF6qx60nFNUh5U3gmWvc+gpu9Bb0JRM7GPp1hStuVP/7UsTogRG1mVzsvQNJYpFstYYY2BnFzz7B7HVrC7JEJasXREkknORcj5eqeKeFYZhzR0MRtsxnL/t+XDqR33LCf/eVol/AGmKzIuJVm6lu42T8feysj/a/E15iqWdff3ONSZlOHtkby9h/r3/C5HPvRJOrYehxD6yqISUSaJKRScAVRyF5iGS+R/PZ+klYiRNTLxGebRDKvnY23GDULPq/64W5s/qMMc+QUqqQo/VSws28i/NiUl+VMi+clK5t59P5P+GcdJCECVznAs5v5cFP//tSxNMAClBbeawNLpE7Fq5o9gx6k1c3eFOMgKrYGAGED/TYXZeBes5d1MLekEgFNZaaUbaAh8LdcHAWkiCkkMI9zBi2etcFCo+O7gwIZio6uF5IUB5dM5PQOva/prOtnDpcE345ef09v2XndOlqLWyNIjGicvPMqg53lTKSTgLEY46tkGfF+WlJBLCzTmWlF4rWRVLLnbkev7LsNdYmGJryqLmIjTM7egRHq4gGiVzO7gKmutdxopo9CzLUydkserONpX93OQrIgmpla5m4Ojz/+1LE4AAKALVvR6RNEXKgrmTzDq4s0wQTeqsPkpKBpFmQ5CXmkxmI5HpMh7EsnXU3X6eMt+aOMOnLRSlKrXJwhfdaSLSvW5hf7+wdRbVe/+zBm9PuZd1xKqVXjscpEEVldDFvb7oQEqJnKWnuaDMsChMV3XMqAAJTgIxnEY2hMJNN2Fzr8uuSm9SMqKkFfKx3I4wWDU7WxmnORpYYchhTHs3tphSXHesJjlgaBE2ZR6j65EWbyuDq28Y083tDz9Jf/TynaSQ/ZiJxVQkyw1CXiv/7UsTngAtVKXWnpG0xgKKtJPQOZosuzkNoAIAMARATC/iQQ+1xFfWIdeNuGp15KdRFtL0Rd9YVgcPwmd6hgBT7MK2sJ0eJ0mHyDrfXV9Jp05NZmH63kmUEFraMhB7j/3H/72ZJB07AeC0mGA83hELAM19hMosDiAmozQAAgABattFtJsVkU2kzGRpBgtQpIhYR8oSEHSfx4CgQasLvoJow848cMwZ19oxmSOiOpwhE5jK+VE0bPUyM5patx7PB2ShSuLaQcTwzGKo+DxennoT4//tSxOgAS+UFb0ewrzFkny2w9Yn29XFU+Ph9hUuFqL0rAMhGuXX2RQjHUsDicKom4U1deJKQjDigCEhuUWrn+XuRomlp6dNLy66UuXNqY6PJaBIsEj7x5AESIMpdAzvU9wU6gwAAJSkUSuc32GdJIO5K3Ad4mzFIa8I7FG+epFMwygM9TeRFS7zi0X3beuy0U5lRSve/cMp7ESQRE61pqiMbUxruspdEq6pr+VO99nRtysz7SqpkVXcnnqIl68zcNUtaVSomQUUCgLkmgZKwrAv/+1LE6YAL9N1UbDENEYQXazGEmhANRuiGFxpInVLUriN7cFlJFnmuiyMaBDH/koRmPs6nGYGdfuQ5iVtItfSsRg2CDArel7KTBy9Iqk4/X2/OOybjN7HxGJvR+wK5RJSko6xJyHR2RFEBVAVfSC1Kz8pzbrbTrNGBwocj5jYuW0gMobUfEnnqelYoOxud61nUr1mS0Pf4aOkFGwqNnYacxzqPWvQBXMtLWEVwAgAAAAEObFBUi32h7COLas1muXVFlluq3eMWWij8khALOopo0v/7UsTnAhSJM2FHpZEBgCxtaPMKCl4mzkYspHBX9WKggdORTV0l/2to99W//8w5FoPuGlecz7XP3/NTC142j0mAgAQACBcAJ/APFgJ2dh5Mz4nR0juA9jQQ8bSrfFyq8vSHwxNkIKzrlIhjmPcP+9vspIOX9PuF2MWJmfvpEZZAy/ZXqF3urdUW7ODdNWK45lKZZQ8CQAAASE7wnkYYqGncc5d2VYM9kIOIEcysCLDT8VWTiPJtLQ1jyVlV0OtXrdzgrH5Nr8oJizCTSCPMlspA//tSxMKAClyDd4YUcPE/jO4o9iy6gmArQ66rVuBeq0Y/1hBgTq0IUaSKZI0zYN1CDgUCEyItBwkBHFNLgoZGhvgx6KSmK4+7VRo0s5nGP2HF9AdWRw+HEZ517rRFX7fsFEfdi/dwobnWeqk67oLMdXSEgCGXt9ApCABAAoFO7thfh6WnMXht74Hhh0pLDgv2rEiJYhm2L2IfLTzyKrKO6RZ2BYUg4bAuYRFAML0O9NojAMm5AlxIIIumx9KoaORbdkBrXnFItO3gO6CZoPy5xeX/+1LEzwAKMNFhrBjvAUgaa2j1ifDlXkPqvBAAApzZRBGyHSRR8XRmoq+sClUyGNh/iNNQc3bVRhnG05IhBGaqSBGQm0mKfCbOriMk6SENqoGG9YTNroMrG3xfixC/pEkxQhJF9QHliSyAiEiMgVN3hIuWMm0HMF1jTj4IIT4oQtoyhgNwFZY8Tr3PryjJiE6z1HZuC4eFJuIgEo+K6EaScsk6JOQHSYwjIFU99KF0TE1XqWous54rKJ0zIFgSbwtVs8yCaILIjl49E8/RhQelYv/7UsTbAAoAfV2npQyBP5itsPKOLrllQ+ViMu9H/g3KUIrnIVpxCEV39Pvq0aDn13ftnequRvBI1wMGi4nP1iAwAEieH3kBBY8TriAH3qBAEwu8XPif/yAxfoFKAEJIIIBdA4QaIrbLmqPbL4lUk8L2x9N+2EQsyccipYj3GAITJHT0aQsyGjeSre/tmVZPa+fp40eULkwsaFJRdKIb/4/W7xqcEC8O2BaTRnM2FvFTeW/bDPAp5Mh3zff//tUDAQAACVMFzDRnZc9fcmgKPrSa//tSxOkADAB9WawwrQKUsOsM/CRgfHAJB4RjBASHc3qxfzxSuJe39euSe8QSlVsQFGWA6R2tbJo2LJPJDRkzXtko8cVWw6M8HodirQYQ9LcljDGwZgAAKcAbRviKlIJRVCzRKFyhJxoBxaLrthBgkekBc6doHeqBGmMTGRlKiwzZgrS4N5FO9dJ3T7X9ZHf9ue0FFgKplEqPSoVQkra5U/ZM6mPSKgAEBCAACU5QBdhM02XnU2jTeRVCmHR7bJe0J5iTJJqz06J5B2wAmUCxGVz/+1LExAAKsKdvpgxPQYsR7bWEmaHEzzEm1HxCGUAqROiBbSAiWQUVfcULlrVC5OmTJpZjeI3xAr1SH9YiAACw0njlOXU0RDVw4o8jfvO87hRsYNmxqJQSxDdd+GNJQY8BJEubE0osOUPNMQRFgu6gwFBz2oSOQZaZ9MYhn48m06PVjI8YkWYkWiFLRgvVAAWAG8YCiw66tKPK04ip95408LjIYN+haPDxoUGzAmRwmw6WHouhUJvol87Fy++/43WUwmaB3DGBZL5jdrFzY4DJff/7UsTFgAo4i2tMMKfBSJptnPSJortkuFZFC/42itArUSARnAnRgE/JEdEgVk8foSgyeAWWH66IZgPEojBg+hmEyDu9b0Qj2206FbXO13yrtW1P37FOvZlZOezIT360S//9vznHCk+A27yFUJzCAANEAAlPcEpAsxA8uzRpHISGpvezRzbjBSUOWUjyTvbUOau0+8srEsp/U2joKXJzmT1mvkYKdrT7eE9qfSlKsynZntJPa/qiLTd0ZX0b3SSd26pVCLmS6EUNcC4oBAHi5hd0//tSxNGACjxNaaw9JwFFCaxZlJmYuLoSjcAQYlYk0k3Jz2FtOArqJcXTB5qxTpJKGI5rDqjJZRumWeT4Ok/9lqUyWYZSLmVvzw3xEWznTvz08BmKMTqGUjsStbSuvzJv/MpmhH/QwegPH0UVBIsYeVIJNPWz5o0sMqpqCJRMcaSSSTh8nSSkcDckS7LAjhWR8ViqrpHE7bHlTA3Iq3BMQ2dYXt3qvWJq4mrtCsjd2vk2UR4t1wQosYyghAo54MqMg6EgwIXjjDDSilGxqUJy66T/+1LE3YKJ1HdgTCTMQTQmrSj2CGwGBA9IdD1BIWClfolEopQSA9jWYz9LgZQjLsm7GjvC85hLxIucH528r/YzESLvKyioP0OwCHDwwlEWVBVz6Xz/2TuSGVreis7ZWZAuZuMzMoK2nHqAZ9t0KjJM+q+xPwwXZ90/qgAS3djdrAzSDSLzPFzMZbVynKCgqZodgZB8juOoVkcUB9jfqhe1KdNtg4BltEJy0NLiSFSaqmSadbz8rmenSlCbOLNRzya3mnTOqTZ/OIekbDJgwIqIhf/7UsTtgAztMV9MjLUBg5ztNPMOLGcst+tR3/6AIBQBJKbkAjhk6IimL1y+UtdfptGYubHHiiQbAiwZTQitTyyHDM4QMrYDwMOURt6sAtlpz21d3vRROzOrlyX2ZBztKHUAZpHGiiFLWJY9l+3DVel8klSY91xJa1UVF+akFJJJ0ZZoE7V1E6zmIXNUqRmuu5LBC064SK878O+agzJGqQlfsGwpzqogbs/Lwkx5hQk0eqIk+5js3R+sXoJgHBwOvSmzmsudkGMTcdIwRp0jHzWO//tSxOcAC9Cfc6ewZ/FxF+3o9g1mQParSFxwfQEoAEqNwGyLKHkk1WDssdOWR2LDkTUYHEIwgOSwl60btoNLcMzxKz23sUfbtb663qwsZFvtsnK+pYzXtqtk/gmcpEM5JHKOxWEkwRpLOevH7dmufIN5PX19D5vGKgW45XG2243MPJTDE/CgvDiJAHzd5TojFxk4EeN6UN9NrGLJ6WAprbbtIr622qvyaHcc3fq4rc7JPhY6ryswYsj+kx7ijUvFrAn5/b68VyGETy/FHnJyJD7/+1LE54AL0PNcbLBLgXOTrGmEibJwPMeeI1AA0AkghIpyQxwUiBCww4y24w6U23F94pAkdnQ05wWs+QujrYQl0oTARKt7muWlEjpkaXDLvvjWBgD1RfB/OO8onz/Z91fqxKfUxOVvCWrcmZHLx8PRMBa970dMxLe5/dUACFEoEJNySgxRHgSxbz3Tp7NiqQ05VyZcz9w9Jl0Fx9ZpKxPD44bV7bHqxpzEbaEJPRXp1JGU5+ikYnLy/Up2t99Wd0uRqq5jqjEkCmasAZp6ayrp7f/7UsTngAvMzXNHmK1xbxysHZYJOtbksrtutNzzABBNISlm/A2xwhiI6RqJI7Mua4/00z1WsdipVWgvQrYwcOlW48CkLWp+ZYUOQ075dOu+mpb2nMgfq/ONuVPKz1icEznRBInuaNCDbGWoON6Nsqf8w6lOhp7dm/pOYzQbtU9wrUygzdsMOR0qAIAAABSW4JqcVjfEhUU2vrtaxFpQ3rbunatR7nqNJpRRN4gswlYuaVWPCzdrccY9krQmNHqzHHe3kNrJTCY83FxQEhcHBZ1L//tSxOgAC7THe6YUeLF/JOw1hAmyohj2WPLiM6CBlySVa6D8EHX3sf+n0DGdt+kAAwAFLd/zSkuAAjw/adGMz0rfx6qfOC68vkUotuzrZQKEi5GKyecF9hkzqOaUakSE6SBik3wTQIVnKTXaiGFEclECCJtcEyxC1EnSZcQwjQhJKMd3YUMRYPd+ShKcOirkoUHMKEJAgFj3WkFB16aWQOupcti5P40lOpfe6xhyJxN6fpTn71HaNkOlk+QdaGEVAAKctEmHBwOq1tlTaQI+jhv/+1LE5wALyPFnp6VM0ayma6mWHXgzciMQ3YvW4zVNkBYUwC+CdCMBVks5hqZiypAIkKCxGIjDoybQQSqXye+o72l6FAYJIP1MnXfD5SDUWeoTDBBkgRx4eIBBa+DQGHrmAI8JwAIHOERJu8gwdCS8QQ4IbcOLF1M6X3U0IyJiglHoagkDASbIPj6MOA11a1wppxyc2FIiCcKD5WlXk0r4y8TVNWHnjFmmYWAJUtsQUhLLuDZDZlW+idqbKFBDqBgaHuhKbFyIsCpgFSrZbtsUxv/7UsTgAAxApVtMPKuCQa9s6YSh+KyY1tTwKNqtAKU/zNuW0ckqBgdAApty8P0TMDKTNAErJ2cqTO9EMCffxFdKd0LaetYzC99udqz7h2MDT4MrM3U5r31jIXyqYagaQLWig8SMEpcLLeQn2lmsn1j6mHHqvz73xu/MdwfL13tWP2ACAAAKuQRnQBf5oraK+cd7n7jiYrgiknlojNlakjycdup2YeXwP+iaTPKUFChXuhqNBGJAgA2uHqh1yNUw5l7Woqo6e/eMt6qmhC416mUo//tSxMSAEP1lZmwkb8FVEe+0wYokHWNCqrStKeAkm3OFjNbL+tVIYJDAUnZHKLQdQHZIiKjig6ZCvglSVTDDqhaExXSUiBsxN2MSO3VK+0Nc+c4QkTXC4YnW7VPi8sF7FkWmf1qpevc7yyg2k4WvdFwGoYimkomnMEmE3IFBJ3iGXQ4mxQVPJOIUqXzBBoLz08Ps4+SO7ZTI0qEeTYXzXviTH1V8oT+Zgj8zKnoSj0uLrk3yMWKiye8gpae6mhk4pjZpE9KybJEdfigBJGIkZKP/+1LEs4ALdI1tR5hwwVQM7N2GIWiNzlCArFG3EsYAeRpB0Tjk6wR3ju9EePlpJH3kDjxkhGrwzNV88M/Ub6Xd6Vwvw9I0XxH9CYci4NXIckrIFc+xDVrv9aa1d6/pk7xQ0KbWgAmSXBep4MWsQ7R5kj2sxZ8yUiE9ZwPZtEeIfvCYwlQJfzHvHpA1yqVzb1Qn9+5eZc+Z86ZTmb0mNS+/QwO1y21BlgCVNrCtoLRKMEYefvvRY8rSNdQ5iFlXsW6lFQASpMDIRDjHyz77KCP61//7UsS5AAq4p2jsMGOBaJWt9PMN3NtIUkSg41yo6MWE58P2gEcVR3Ay6UkyYcStZRmPyj8qsEMVfveoXmW0mm0vf/2BMN210BMy6KvvaaqI1M3Q4UjzSB+29KGAFuX8H8qfZQWA3UZnGm7QCwQaLBYEMHmBAlEiTmFc7GVyKJSUlbPBDxLGEmtL5A4Iic7kZza9GJghayKnkAmrapsmvAwgFkmUGRBPnv61ABKlwOQE2Igjye8pZcnAiGslbAYd9AHIFBw2QsmhJaA1gjxLJHrV//tSxL8ACqSpb6exA6F1FywNhg1wqkvabxg1kcVOiABRCFAwBL3hwayLrYSSyfe8UaQJIYLlH4WxGZTb9611NW4DACVJuBc0wAis9c9/lrs5UDeQaM/QQTQLg+uqgRxU1NK4XMal9w5K36cP9rhI86eDolGDBzkOlIgHqILY5hKI2usWm1XUiB2PR+7ut4jVAAScAPQAa0C4dVZ6X4EMVQBlGYjYF2hWC5oXhBGpVEDkFnGUinEdYK3Xrzz9tzQR47Q7ZfdGzibmhJJIgZIvcUH/+1LEw4IKmKdebSRtQTsUrJ2DCWiRAKpCaR+EJdyAI0rfo+9RHBEVgT8D2JqehxmqVehOjqFrBcQ0VWh0gg12fyGLs6GavOQTAjqSwi+CzVuoNorI57JucqMUzf63SSjsvug0rReVHPJI2uXvQzUSTyKutSWgZW0kmk3AFUQgqEwRk7BbkST+xe6nQ4kozKITLSKhnH39O7vS698wsPwI6EE2W7oYjOA06Tjwx0SSmDYDpAin0j+HzO2zXzKIOM7EhMKaywdwbVN7SK5SEZTrpv/7UsTPggpgXV5s4SEBOQvsaYSJcOT/Umd9P+7gUIUSbW8WVcizs6NPU4V5GMJzNyhORQV2osHGTKWwiVGobuQ24VuVX2Zyfka+PPxzN1pxzghIrL89zKyGZ3781rwNQbAJUKtg4s+MHGxQBA+DAbJp3QzSjIinUgkgXHGSWknALcjxbifnKZJYkuX65WSrk6oxyv0OJkF0G9Yql2KaEPnAPBOxmUv4T9CHNhAQUOO7PDQEKMsPnnZ5kjIR//rO7/6+VT2pmZPnvYcIGGBgBZs3//tSxNyAChRvWmwwy4E7mO0Y9hU+rLXZqkICZyE03KB7rAHHcFvHpciIlRcYAzaGgtNrBA+evD3BlRrYLh4J4n/8QhVF624H94FdjQeIpIG/FBaXEvf1t+/d7y7cDVW5TJiRgqm+vKCNRSCgCAJMaGA8ScQ4wiYbRfVqJh78lJJJ0Is4Q0FMYzMepKhgXGbw0hYjwpD6mVmIlN4yQS2c2XmE95Dh6wAOEM+/YGtki7zNfyppZ48HbX8oxpgQKCVBVDIvBQGGMUqJio1Zxy2BxI7/+1LE6oBMlNlzp7BruWwZLnDzCf5yGbR56j/sq6CNgFJN0GrhcdxmWSB14aesHXY8+kmhE9JqV6pHMIFJJaaDpGbnJkLXREl0h+Ud0X80Zttg6LuHIUw6tbtzEd0v2f2ecLyh57rZANrrUKgm7iQSgdSPywmJicB2LZFFVQAAMWAgCCEzGrRKNmAx5qhPABsmBnrNpngguHIW0KDJixwQRLNAlAwx1xpGiCvLbM9PBImZZwLuscbjIssPWVEuDvQk8Fs5XilcF0j/SBQm1qLTK//7UsTogAupC3GnmG6xhxZsaYYZKseUj7tiPBljVhR4d4rjnMDUOXGJoUjx42Rol8Rb4cNa+Nb3Smr6Y4TJPE3vOqTb3j0xry0r93x7xYE0TWfuSkGl6zYea1p43//iZwEGGAwFYAAIaC4CNT5TkC6jJEMmus1dNGuNRq+pa2ATEWAhZfD7QZdV8V8vhDC1MA1UMsuX75lFhmP0PhyW2+dneKxgqhLxXqmIztUCdkeYq8ZH8RSQ1U5R3tfuPDb2BvVrFlXVjO4T/23WHu0rCnkY//tSxOcAC9ibbUewybF5k6vesLACoM0kis92HH3abEHPzL91xuHb6pLFhTa+NYzqmqwrfOs51859vqJv31Hyy6KKACTAAAlO4nYSkGIWMkbSfyGAmwSiVP+qipA01C4clqDTgORBCG7DoA9FFEi+PuuLRYujrU+qm4aZZb/5vju+OqvGKM6ErHNS1yzbmKMqyGVKwzNGmHRw469QLpEpH3Nf+hrL5RZVs2AwEpMHBIT8WBJsJ/KB2aL5EQEgQyDL3V7NRlIZqeVdJ2j8YXQq6y//+1LE5gAUZT1buaeAAmUp7EMy8AA0FNIsdisVjc4V2L3Yctqnw0VJcSYI10Cam/xPon+M+tWXVXzKaotJ3n/qVSpkkkEEwQgdJNlyGZiKT4jhGKhieAg4hlghk+b6NJEgOM0pYA0KGESS5g9DpRKZqi/f3TyIS/Wu6ClsgVCaTmKTKldN6v//fm4DetP+25Vu+T6mlX3b//3f7op1/267H8A4CiknKV5e0qyISkYp/q8vWnS+jphgQ4rCHeLvSZauo0sFJI+7BzFQrslfV7dUpP/7UsSlgAwop21c9AABYgovZMekZ9MwbmG7FbWaFAg7av/+/V3+/dXlGJEvNnY7YDExitLlVDoYlX5d5k7Wt6v3ev/KACACTHOZAAkS3fGRF8lOk08ghjSXVo2u8CghEB0kWguiCVJgzNlW3cRab8JWPRlaCsXTvXHzts1Z8unoFWJpzM/M/vn5GO2EHUFQSC4qwe6oFmmy/A3YGqSRrFSMrrUKKJHu0QCYAUBccYZRrC3D5hmY/Vg/Uj0+b7WpEspH0rKxjTmlTj/k3XDmUYSt//tSxKaADDBVdUexA/l4E23c8wmbdUA6s7rtXNV+QjGDPJRa6VNpaOaA7A3BRgmKnEh8nBdQMnwAEB6DJ1jkUMQ4yB6dUX2XPsoAgASTd6CkiLMI2QY25bpipA1iS24+aECkyxHqRNCAFcTTIGSJNONPoi+BoaV2Duou79YatGvlFrQ1E2LADBowyku8EZEXexSEuQ0iQlNP4u0e94uJAiLmfl1HsRCViqAFEpOJPsVkLOX7Y1QNMCxRZb5HDw6WcoqpWoFi88vjbX07Ei3YyZT/+1LEpIAMcM1g7CRtQXgQrWT0DiagpTYiSMOq5vKLeSTX1scrSMsaWtwXipZaHQZBW0k4JxLlaLreKFhKTpBk6oi/6RSLpTWqH5AUiiXBwC4BIaFcAcNRIHIjFRomnaGCBoUZpEpp3rf9//iyj+YNuXOlCtbK+kezorWa96L/q5mZV7T6X3Ret+n//9PX8MqD7bWzBQSBsyppmkABhASk5KCqThbc7Rpd1eOImABLaIBlgUE2svhNB9Sgg338+nlFMA5PboLQhrca7x7areyaHf/7UsShggvglWDsJQtBaZCsnYYhKp/1RmGHkzQDAh9SVqLqJjEjIq7krTTuRbxbjFIEGgAJVgjIs7WUzmN43TLRAzWBVMiiRrRol2gAMjMJxgxDNlsGJj8K1I35YEOERzQGOImDKK8bb+UTV3iQy+lCjJJDD7pkVaiwW6nf81aNR41YeymurwbBzIpkPNhVirVBSi4vKS7uFxycM+Sy5WSvOXuro72u1ifG947CnP2QmCFaTBws23Ulr0jI8/ief/n/J3HcFIPH7OiTYHmqY/ss//tSxKKACmkndUYYTbFFla0o9JU6LH2frgAgnAAReFzAAEl2n2KhlX5dBhIoLx6WStwOTcIhiV1i5lLAJzPNGRPZQhPOCUbNgxX88dm1WPGanYpAwxHSJkUODjzwoJSWqFSSLizlh2L2C32OWAE4AJTclBKi7oWXRaLoGqFAlRrFKXxVnfaKplPTnP0GHwV9RyC6jwdo0da5ldaPXdGnkPqzMgTYaTTlT0kL/w5UQHQ6tqiCFlpABumv+Z2cjU2E5S2UmmnKOEWkURCU8XNcuBn/+1LErgAKIJdrJ6RtcUsZbqT2DT5K5VQ1cNxaIBpr8g7aj1JndrbhY94RKFGzNWg+2CVRRW+dP+Eg4shQHmvn6W/OLX7qXDBiimolf+3b9SxUbeQqrzCNA32Yy7lC0LTQj37YmKqpQHnXBPjJApWFJYqVs6BFISrtzKC08tXws62hTWQ4Vy5/M5XZ0e0E93Wa5GzdOu0M8W++P1AM4d///0ICQASTkBQl7PUek+xikhJeUw6QOQnIrLD9lXNA027Lh7PQQOxAKRHajEKiqJN9Sv/7UsS6AAp0hVpssHDBRBltKPKOMoY5EGL3kfvqz6DtBjmkK1UfkeS2q/06wdKXrdvCvqtsqAFYAApJygv8MhaGJHi7KnYdt9WklBeEhdtGH0f0J+WbetSOu21yB/NVIkzYShJr2xa6HQzX71vtT14yp9MeJY1TPrenwZY9UYSQkRAN9ZskdEMFgJjV3AlBL5ZAANcQxSkckcJFHsrXSekULqWAyDwgUVnNQGKmuVZ49iznxfVSq6WM6Hz44HRYBLF8YgUuJB8aHqN5o48kZCOj//tQxMWACdhleaekbTFDny3k9IneeC6m+K9M2IH/WPDXwjS/gaN+1rgkbEVmNCobIlg6QycWEAeEQzHAkvjyVlBnDZahv6yZqHG/0uHkEVGIjxxu6+8RtyegoCw1E4Gu7vR8Uinoh92iSeAH4cIzOH/IACAAAJmSBgZ32VSCRkxGjMJjbXohM0NiGZZHpDdr3XUeOattSlEJc6gm49hxhGEiBvsWFXbHwGcoZoE4ho7pytv5PJCzRCCjEzRI7dN3N6nxb/3Ezp1hFNIk1BAII//7UsTTAAn4+WDnsKkRSJXsaYYVMgwEIeUXTDGgJ6xAAQQVEmRBXVOk4rkWaKfVjA9dRU6XeJ3ciHdnKr4h9C91ZUby2fw4pnLBQg1wZFaQMnyZX7/GISFMzQ1LbKdN+WlYmHi5U6okqBRfcvVTaWURWcWLrubMLrtRCGoAEApuVnLcWwN4biGHOPROjlCX5xcx0qcd7/MiICJKPEUOwXyya6Ykuz6b9EQwQPLpbrrqzVsLbY6DItUrWFRCDqB63GhoqWe+gc9hCa33uqf4l1MQ//tSxOAAClRlXOw9JwFNFiuFhiF5AoX+WH/YWgAElJxYEjqmCwB3VjWxgLPWJME0sCcH/DiW4qGwTRVPsQhjLgTOpSh9kDU1OtD0gP0QY2E5htJWVLDcav9DRljH2NNKA54uO5EHgisuwNQmjwsLEwH9z1xddLP1OXZ1+xUAAFuAAhwPHaChdIkvo0NQk2nCvRV8l1u5IHReLK68jCYpm9lbrNa04qUMYA90S2VVJu0mBwVH7+oIkrvmRyru0pDKS/es7WtqVldlEoVMH3Hn/mn/+1LE6wAMuNlpTBh1AXSVL2jzDd5atSXxAzUEMKgJTTco4ToYUrFCPKMsBd0gdZOVg/XSyvuIUJRBKdES5UydnnQWWzGhmEJTt9heTHC6JyFiE1eUUhgjvn/nwuczMgULkwcPV6BcLxO0rxTIg+PLjJMh8u15/ajqBFFhRAHWMTaa7m9rTIsqFpDoBmSygJxnjxje7xAofKnfZq71G4bVJdbQ49jvA0sYjthptGSlYtkQjqQv9WvRHdLPKwcjO9VR+/RjMrMbMbt/twygqsFMA//7UsTngAucoXFHpK8RhZQtHYYhMvscwn/VoDTjbTSSaSbpgF5EjHZGPQcQYYu5fjiL+ZJ/qSZhQ2+iDkWDM9lqnjjFSh4RmhtEFTNLrrWkjGb6lM2gapn/nfnYZX1/aRrpxzMy/MhOeahwAFgMmWJhos4cPAB7v+kPKQwAFFN0GvJLROpkrrMTjSu0dHQY5JzYfCaG0Cgwx4HVbR+md8vxUpQZhfgoZicyAhRh334LYQJBBRMRJGLmhmU8vdONMFTPPtJGC9MvKZgrzF2F0G8P//tSxOYAC0TTYm0YtIF3mW2o8w3So8yL82EZOMFiyBPDpzawSAASi4DIdB5KqsrgpPdrahzJomCCGNycDYSSQOkPQmgyi9Kz5DNG7Z0Tf1BMLHAqIcZ2WxRBjCV1O3tu1JE2HVEYyoOx623/1f/lco+EeqTH+eZ3fz9EKCOe5T81KCkwgtyXAAVgSgdTcUiIjIBQuKOP1yIypttTJv4ST6iUROe1zd1IwY2cI1XJrOfixhKDEHTTORhs4vPn4hGFCUcind97F+flRGZr+2D8jnT/+1LE6AALuSdrLDBJ8YAfrvTzDd465mrniJux3U93lK6Ldx0NzjIevA5VCQk3KBrphCumMvGwdpDTYFXo98rBwToMERQ1IkEzreligzkYMGHl2etNA1rvffn61gwdU/Oawb930KHxioMV9EG0xdrxzt/Mke86J8TWgjB2BLXPlX86kbe/5ndaLTUlSaTjbkAgQsRIjXK6p3CxjgytINQ5SCKchq3cireajItFPm1Op7bvs/+/AW+W5g9bXEb2zzDz+VfhBrw7B+5ioCXc0E1JPf/7UsTnAAyU5WDsMGsZc57r3ZYJM5gMmHFSQbWMPArKCnKuNS9cWasA0REA0kyXxXJ0XImF2BdshhIWfwgq5CP/Sw6BUmRVvm6YxthHLUgQcJgyLvFnSag+XLsFnlhKLvzuDA48XICwWOLHJc7SVsSRXska/zA1GmgZW8BaiKYzPEWYOYi7iRcqdSdgRy3Ykb1QeXKiKDejA/CARGF1lJMx9FbVC7OiizRNFIzK9zDDvGiU7mWuIHfS9RWj7LWCDwulmGvzMTnimKp55DaoDqlW//tSxOQADJ07a0eNFZF4luydhI1zlRy1deEBBGT9RwPTCzNgCqICyAWAHMlOhmiEnCtJyYxTRo3FcXKyaccTikgszvhutIt/hrIPGX3T8uZNYBXMK/yBjLU3ed8FHPBKcIiQotDBZvfIqhpwEFTwRRX3KNbCon7q6gLgEpOUG2gXyVgbqkMtF0WoENTc4nKpCxKidQSeiQggiZ1VG+j1VeontmV5Q5YhByRPQffwI7/axd2LJsl4sd/lXw34JTUnpR1f72dXTfUEEfme9/UbL2f/+1LE4IAK4Jt7p7DG8UuMreT0jZ6MW/5mf4IBLIKbbuACi/i1KVvJS7OJfeekGVtubYjdg061iISDqYqNuTh3jWiM3atvJnTEy24IBukgcTTtqE8RVRNXMlxLqxWVEu+llpMrJXrZP84NpyvIFGAZmdJKOhxBZ9xS2V21ABTm4CZx4FThAY0l90KU4hMkuy5FCsGpGM0xFgaWgXpCfCGwzAw5jdCCqq+F79MoGMTMCZ6pGwJa4KZeuevP3QNaVTjCHmX4W7hBcn/kvkf/7jAIM//7UsTpgAyNOWcsIE/xZ5ktJPMN9hGpLjhqFBwlMewRK4xVmwxES6a02rUqdrmBaqRQ7DIsHFQThKVvxwD7faJRewTCYV52S9f+EkI+yAi5lG6ReU8e3zHNoec7XWzkCMrrqos81zlDjqosxXX0+1UzWKVypj1a3X9lEhwP1j0JKNRWJy+kWZsMtsJGpEY/J46HvEXNFllbVAoI6EyOJYbWxsZd2fvYGCn++ELOZvCbdio0ia873o9k4QERcg0WIzshFGKckUOaD4DaUAfAddZB//tSxOgAC6zHXOykbRmEIKxphYm67HIog465WkAAFSQC8AcS0DmCFbD3MTDNjA2pb5zSnUI5DLlQxOrCnQJIroAUhCx/jxK5GExR94S2vEzSRbiQlqT0eogoijwNZRiKicQDux2SBLaWv3MGnfhM2KLKqBLEBOXFMC0niPQwjPTdIty5ICcuL6q4D095CXmH3UWsSEpnVXud0n5YPjEyUvWusfbcuxdGtXLXlC9iKK2zO/Stb9/WieZMy4YQBNo/7W0MAAAASU5BxIKilgyuPz7/+1LE5oAL4PNUbLBrgY+k7KWGFX7hu8s4m9Pve7L2QU8cx7EAVWNMumGhQTKJveqgbFYrId8moEnSq78iGPE7SGDmF0poyFVEgbgiajIqYWmzMyFUuEi4NZFJzRyMBwt/GC45oMBYGVBJsRAqeMG1BlxuHWuABRLdi6OjXwivIJJTkwbwKofZbzS0nZWEuChn6GyLcJtAYzqVylMKwiiJrmZrByK4HgFgiATxOVQ9zQq6EzXBKwYDwRc0oAlpLlAbLU44lWSREJF9H/9Tuus9qf/7UsTjAAqoy28nmK9ylagrjYexcEMQEABKakAwBkkfcGKvC4CYDuHiaBYIydjjw1hVc64SV/4bCitAqqhBQY6e+6XcT/c/nwOnoCOo7W882FRioklcGX0s6DVHIVQFQg4Kmzrqa+sm3JoAo5DEBAKdyQIEAAAJKlEcBQGpZAqxp5NKwwNoaiF0NjxdGdhvdL5CinEEIarI0EjuqHIpbuwo6Kt6HocGXQ6VA2pXuRnnaR2Zv06200p/t7tYZ8pmXWQwtjMZWOQPNIiuVvYzGE1V//tSxMOADtTla0wkb9FQim8o8ZoSFRoJ6wAVwApOhAU1AEIhsJaTghiBQq0wBizalE8riwy8LFYCx9fdSH0y/E7RbVp2Kvotnior+3Rd17pWMM4csK87z9iL//Cut3cRuSzijYRBUFnBmt19cTaOxQWcU2SIKkBAKgHu+gjYoYsNAIjUX3d9ptlaNGvjGKNpVidOwmV1s+EEJUwcJCi0F9kxhn1ACs8kp3XVn4KGpLcZj/xMudeUvHCgFRNUSiR1yRSA0m+u4bX0MUeRA3/p7AH/+1LEvAALoN1vR7Bq0Ywr7amWCSIFfVBBz+LQhSjNRiF0TqfFuQe3yQ2knl2PECyULXFTMAF1FLF+tEcQ1lhFy+wOvtx2VW+kPcnVtbIiCOqvYhyJlwE4lQ4CvKphw09+shUY2V4wLlPdb5Ff+gAEApwwhHioWLYV2rezhmooARMWtKDENzo9EZ4mvcDz5rE0+oeP3mcusgE3ORD4ui6jlW2R8CyEDixT63MJ7f69R8yVRuMs98SBQqGjelkWhsIi4jJpjCh91aAGtYUtLlUSVP/7UsS6A4t0u2JMMQ2BbZTsDYSOYKopCqVFWs5SHFGUKGH6xnCriwHhprN1aD55QTyOqioWb/JIyvZzqCBWeDQdjlOvL0H3Uzqo0zTveQcr0XvYivsAjvTq3GtrHWlq9FVHco1WGpJicpDqhQIorBhvJ/7KGECJAJbkHSL3JjNaZuxhpbqqPoWpQVScLFA+qSUPZismn3qqoQ8lr7ZIOEsWCdLgvUVwXmUln0zQ4lP78FXAW+wLUlkSLGc5EUxXeisREKv/zldRYEcJFHCM61zA//tSxLyAC0i9cSewUvGLl2xNhYl6yO7+b2/qCAQAghKbchOx9Uju3nucGVp/w+ylvhYXcQTOgWsIESFiC8Tc2U4QS7AqudojX25HojXAabFdjP+UK97lBW+Heo1MPIo3FHIb37DL3Bu+jsf1P6AkAkAJScgD+UhDWk0yenaadSnCJ+pdgIv6EXkc1dYtE0uDb7BFAFgsuhlbk8m3LlDRS9D6LRL2dw1jUiN9iQhaZpFykAoSbiqokCOUNN0r2CkBgAJScgCSYgV6oN00HhzpAhz/+1LEu4AL3QVzJ6StcYikrN2FiXJYI2kAiEZMqpwrPPFJp2Ng52dPkC8y+Ln82bui1H2e7cXFZ5TLcFFXf6DTvm1iI/XRX7++pv7zbpkiHXfqMamtm+jWf/G36AbAElNOgo0IV05bKJYsBA77NMfWVy99o5A1/cV06Wyh1/ZdAUrooMlquBrnzSeQuwBm2xXeNaelAOZ1f48H0TvO95EqLFNS/qwhL/9/8p/7Gp/t/Q/+UcaVqZyja6GcreJFAABTcA5ciMDkIAw4JYEz5UxRBv/7UsS5AApYlWdMJEuBRJSt6PYNIobyS6XSxpmMrN9jA9WDUT6dguZe/Vj0dbD7W/Dr6ivgl677llY21XScIjaGv3DXm7Qjvay+R70aNTv6C2HGAz6We7lPK/9ZAABThN+OogtdEQm6K6VUaenOGEXOly6tMFn2+mRe1dHoxNjm3SkBUbh9PIpiRrVWKklNKigrU1VQ52Gsy6XwJDNd6nmDPbaKRn56f92q3/L90543/u85/yYAABKcOBCyMb3P2xJrrGmRsuL4wxx4SwLH7KvS//tSxMUACyFdauekq5GGMO1dgx4iFyE/grlR+iRH2fA6rGqTbZTZ8XY9NQyobdGrsoRkl/lC/+OF/7XqmtnlvJ3aEK0nLq+lLsuGXMXi1OGG6BGgA47wJ9PD0KlKjDUpzOBJgPaGlVMyLNhQeT0gvIcdFFJWNKu0YWVp8P37Efq1UYet4Eqdvh1kT8KDdN2h4W5x0ksulfk6v5UbSijlzuhbn8U6JrTVI4QAUkoTJRg1VcYxcGYwGAlIcyrR6+2BelEUBBNbcE7pqWjMwbq2+P3/+1LExYMLNPlgbCSvQWUfa82HnWjyr+1bGeT2qnOajfPDbqcb1Hx0dc+0SS1mTpexrrd3+VT3DV3SdMqY6wJOQRJTTVJaxDHYF2kEMSB7tAoIC7ULMFSBI4l23kfF8iSdB4O+6B3WcqZ7uxqKemQ81kzrmte0qHyQDiRK3/RR3k+dxun/r8c4YSMya1RoXkodQgUyWoSUUkUob0FRR1IZ6IH5guFWVhFF8EzKYfb/Dd+Sm8fXUWnKRf3lx6X84h7GQkK05YZIOgWU87O5f0voKP/7UsTKAQsg5WJsMOtBVJes3PYVcLeqJxC1pXTZkZU9K+GRJbOMVbkACQGYQAUpbujK5qTEMPNAr/QiFSQeVKCEByRAXOhhISIzKgN2MkMzCDpKHs8h/unDdC356z/wSTmCQiFhug1eUq1aEJ/F3L3OJlhF/oUtxWn0qlIFZIKSktTZ2Ilf2nlGPQxjYGTaSIrHBi4t19cfsewxG9ShihZ2zMbNPNHvmkSauPutR5t5h/KBj76K3f2csQKES2O2bXinkm65f15B/jPtHBI5UMxi//tSxNCACkC5aOek7RFOlS3o8x2qqCv5rXVOf3fy+7QQEAAEoy4NcbmPGkViLOzEaMu8qa8CoNIhAJWWoEAOb8bXj4xkdjoiYK5yP8lZdyqPtjpt71MX1yRADi09OZW9tXUcgZdSLQXGL7onfIPq5BKlqgAAG7x0LGw4isLD3lgFQJhyQqkpAJhyrAoA+SzYSx2NPcwvvMOuOir72Wry1pZ7jJzOliPuy6oo6/QgQNRqHWMAQPa/EDfJqKCPIUpqFRGpaardlXoPF9Ufe3RtxqH/+1LE24AKUKd7p6RnMUkSbXWEjVDvd0Q4bbRI+tLbWiSkinCfIQhM6sOFRll1CiZ36sg4aapWEogPBA2o05rm1vfyajhv+Zq93uuBYP72KkbEjAFhFTnfQ7mtVdjHehqaxd3M7edK/NdKovVCULOjOUEMLy2k21anX/ulOmoGnqSSSQFB2vCbzK5Di/Kx6jUS5rOV1lyYXsrxOCysW4X8ecS9+g+Vei+Ejr+Q9qnyOPytpuJ9QcCtftxoRdqp8a6/45d7f/8U/9uqjqlEDJ/qd//7UsTnAAwcz29HsOkZS5ks6YSVcPyORv+IPeptLtATPOgAkgmDmPkbyFi2hUH8fxAUedBuGZqreJt281U+TXzpIMvr7jyu8o9WkrspXSOgkcUnDdj+bKD91oYC4CtmR+gDHVpr8waP6anjf/yy/bExZ/tj7cw1laif/f6G3VbcxWdpVlswoUYqAAKavQxZqL4UAXNJ3mUel7frBQMPJNXJi7JVquEVVnloLCdN6e23NpSbN+oWcrfGI6TODsyJLK+Ot1OMVkkX0MWZAsW87oPN//tSxOsADMkxXmwwq8GAJm7o9An+p9B639C32eVwTz9ZnP6kBQs/X+7QEgAAEpwTYGAMEV03yFK8fCkSwhys6i6tjKttowl2bot6pIhlZbUUWuQMHWkwG4nyquJKVkxhWqreUvCb+OahwBHf9W/7f+Obp6P/0fWP9fq3r/eq40XkCK/VTQADJKFWpYFKmXJaO5DLwAgbAyIhcHQawrN6LljC+I/XsNhCsdf5E7t9DjJTdP+lcOLX+0/Qi3ZIWUEj/2seY59gfZDakKLg+QJpqDj/+1LE5YALnXNzR6Cxsaevbaj2HS5QMO+XSX/a+RACCc2XcBohBESF3tFZU6SyAla+1uPMlI5mcdl65qR24yNbKp9DCsrk0fjhYdxygHa47XkxlkzPD2A76qUplow9RjkS6lFTMvkKD6yORkdIEQNThPurFbngbLo5ZH9Z4dpnEMvyK5eZsQzAcWEjVBZgpDjip+oKxZdklQoGEQAAkpQBpKAdK0XJVFWyBiBfKVCsF/cQm0h+FYClEjnoo8kcEtNJkvD4VqfMpOcoQssB0KHaVP/7UsTgAAuc815sMOvBayysHPQWkls5XcjmXzvb/S3coYPZMJHWCalTaJ+q5zgkylIJTd30gjjkN2iT0kjFJGdWAq88ssiJEIzZO4YK7TROMxQo55gqZCJNpWzh0Yg1wgoO1sJaqfVhpzIvxVbmTJ4htCb5Y5AbxZhE8G6z4uMqJUCSnJszCBmk1ncuztj4OUvsaEXRmDyWbuoGLPQYvF/13esa0w7IvGNm+sct/i+tBLZ9/gD96NlWelHsZdWENG572NgZ+bG+SVoAMOH6exta//tSxOIDCpCvYmwwZ8HrouxNhg4oXTUhJJp3FWljU57zMpN1akk/l4YTignjtajOm5wZZN45V5WB8aXAg+hjjyi+IbDgjbvMv7goIyrmv/jw8ta2V7rrZZdtjrqoJpE/agI17MrapGr7Je3fB2MUlzTWRRj0bFnwCuoIYRQSmpKBOwkgnquGAaAUCR4GgFewSjnOmjicUS6upv7eZW5JLfXXtmweBp63lhTvvlh5s1prAMPbU4hLq9WGx2yKKDK7Kh3lOUdkHTDJMIBubqair1n/+1LE2AAKGMtvR5hNgUYJbyj0mVJtHZnryf6r6bfpqeeSF9Qdf1FMlFQQy+TFr6+2tMiX5JUcWHQNdChWnxW8x6zcZbVOsRrvqaampqSp9Nh9FClrPI1J+SJQSn95SjZos+h+tAiGDr7K68r6ov0Lv/8fI/T6GfzK7vzZ5tGqWIZVTKNskgJJw/gGEyHojB/kzaCBm6Px1IZki2d4pTVQNaVY1OtF5bTUOHhjZnXpL//HFWrNOmbwF5+0J/g6eV/cIDk6od9xgCnV1Yrn2INFnf/7UsTkgAoU33LnmE2RkqrvaPQKdtbmf1Doon/dTr661Iwp/+MEhv/6yAAENz0KOCTRbs8rFCgtNk76sGVhlkuXusx86WBoZsCwcDhexY+DLUNo1kQaWGDnQRV31eqQZyplls+7fih1XlY9WyYSacrp9jxdl6bTIUppW9GjH/yykJp56aTVWVIQN/1HlSAAAAqcMQQuKB4Khi7ECIdKzaJwRMhYc3AUUgeB/FjXw8F4NSH72BwiBx2HTi6/MXk2eXnfqURHP3n4J5Hd5QUm1C/V//tSxOeADL1Pa0eY9NF2KW6phJ4n+23xIUff/H//dG9Lfj/2J0IXZOtJhMopyIDwcdZ8abbSs2p9/IPj99pE/anIflMiaDPUqdvXUMoy4enYaOFtseIjtUaXxvl7Dsfbm9m5E/0B4sry9ginn+5/o54QQ4sRxH8vsRTL0joWaZJgYQkA4URDTz4mfwjMnTYI+AWn3z3HMh0dAispkamZZaPKrDGj5dtaGWoQFFJzYHyOEnl8dEMalDQ2NQo4Mj1TQ+ESO2x5ngzlXiyK5pUd1cr/+1LE44AMaUlvR7CvcYwiq92FnjBRJytKf5RV18QHhuDU8mWPGP9DpLp9ksRfrQ48FBcbSpL2kZNJWhWeBiAgAAqSgrCNmTLQeeChjbXoKJmNZfi04MOfbdMv32U8g6Ocp24M2p8cUZwic3QYXWpY6CTY/cyPl2QYIQ699WCEo9sgsiKXu30SCLRVSyDZV2/zACf6/w57+moFMNRIlIpRrEcGQGrQkHKZRMT32bRcaOBMjAMhLF8KBtWmtmgRYy6NT7wMPGjUZLRTYzQ6dVh7if/7UsTeAYtJS1zsJLFB8bAs3YYOKgPG2SlRuj0URe9cf+gG/zWb0hxdP/9CF/p/r////8n9P7jfLpFGKJIROX68xfDcFYAtJxuQY/ldtCWJqES1wxRiUIMLOO9rz5J6+z/TNHW9Q1FG1RW9/WTDBNkmSQdMoPWdpxcLTZ/mqDvNmRqCQXqqL5cKRePGSJTL8d4KyS7TFS3YyrdbqWoYM8l+cb2zr/9HleXPSIXRQQLlagACANJMsfAK8nCln1ZEOtAw+EJloaravypkDSzxQs3R//tSxNCACiCLc0ewodFtJKwphAqYDtqxwQphmjMIaVmRuksj1HMHUwLg1iFGLOk1OTiNuXVKUjlultmkuI0h8qGN591rGYW5ee3MzExTpppONAJ2hQRrTuYsukYIHQT5/7fTlQWJ+rZqm+8xN///r/9/9Pp1ottbSOpCgBxPgiAIyIZyRWGAl2ykOMB23diWPCPL6qiFQwhqcY+TGJXnYtay2rjbVHZhuk9NMsz/RrewmyTv7n/f1gme9GkcSYay9sg6JuXiGo/88Wn1pIIoImL/+1LE2AALfYVxp6BUkd2krvWWNToGc6n1OswSWghTUdChWrrava6qQv//+omG3+Qb44f01vQ3DVUEEBqY5Z8CgTGjjDCRUG/y8EIiqJDD6sSua6f75Rtv+FDZTlyJ+DHX180PBM61KYFVC+bS6M79XxIl2qIdD+m66rqKGISqbEatn9E60xcJrM1oi4LyDe6krXp3Ccv9dFV9FSgmCSL6Pv11icq/oN+mOf/V/nB2v/1rUvUdUj/SVs9BR9IENhp8UjnNCA5Cx9BBKlDIszkiNP/7UsTMAxCtl1tNPa3B5yTrDae1eNLcinaQtiOdT+ARSU1elwcsSt6frjaYctqh6zPpZGySlHp/Vxm3s8kEWFJeMHaqSspmHm/fV72lDmF6pYcT+1WW7LqUkoFOKHutStdSTuE3f+nb6A8k/6v8kTf//1j2978oDWDRU4p6QmoEEhgc4kB9c913wVPAbD1BY477BX9lrptkiODLwUzYiPGZa1WmVqVqK0VqMuPDN9NKxj7VE10q0lGQCrM3PUFIMIYoG6JxbLJxEIJo/SW1qnvU//tSxKoDEIGXVG09tMH1qWrNp7YwB9KP2d9BloKWGw+u2j9almL//+Zf//nv846V2fL3tAgHPPFwABAgyKVwe0AoDtUQjVLRrb7B70QqD82yvG0xrah5MvEpVkJ9qKFojjmqyB57kJY9/IS5Q+4OUF6c/+0AKCCNCs4k5ufHEPp86ipTqHwZB73e/0cOx/5okfWrQdZMEpNNl//mH+t/5Nb//1G/F1G8Tf411Q70pKMbQdA6SBYwFRicAXDoQwWgq2X0wQRBEypw8vTMs1PNuZH/+1LEhwEOsXFWbLG0QcupazWWNiDBHHP5+beG95mf7ROH5tNR9YtgIIfm7+6XitaHFK/+/8zUtj417zQxd5rfF5GNOXWdQBotbvb/Pb+v+eYzV9PXPIn933dW03G4r/Y7Y88yAlJAqAaR6kJQ0rDcKJvPLSUQ3aGGCaQDupikZrQ5127/RzeXfuMXMmZ/KDYkMnlcQMBSpjvKhGG5Kx5gSEwmMfdCiKY147AE3VSbf+Ot7g3hjrdwV93Ez3TRQ8Mev4JKCxSAEAtTA9DKohbb/f/7UsRwgA4tTXNGPVx5iBvt6PMeXgA0m43KXvLFbssk86zMtFFoNon/s3o6rzjhaa+Wda6h8AyrGCbOBgxKI7Gb6hMehO4k+/dGXSJmQ7aBw5qznzNJkMa08T/fIgxAgUpBcJpZcxzGA/F5PCutdgeilMNNjJkJY9UpmLtPQNFxycTLlAIKwzdMDTdRdVYf1uHsqPte9BWdXWUL/joc31MntxUR/Kf4qb9PnXb/+5i6/T8mkj9NCIAACI+dAYUDFvWJMah5o1qNwuOQFOtghtkS//tSxGSAipzDY0wYskFjKOxplZ5awMonL7y4yy2JBT+U6//MJpg+OOUZrYPVXCKTHhiQ9NViMpXq2zpJ247V0Cf6FQBy/0Nr1KJ+j/yv/vMWPN20/0//6//48YF3upSIAAhHsBc2Av55lvJoznGfxdKLZPWMvViasB+23lKV7lT5sPRWe09K5GXqLCYFLE2JwqoOmudtYgdWXKK9daid9SAEL9Hr8c/jv8lf9P5X+n+3//X/hGwSjBk7OEOJFQQAAAVzBzGYBrl1yqTvHDjOcW3/+1LEa4AMLWdc7Kz2gYetLej1D25IXuz1Fh0N7nRdetlHnaMU9sWH3Hp2XURDnOeI9goi2Y5Igu/Ile/YhO/IgSb863oVOk9UKiIbrQQTlPLuyj9Xnf7P7f7OgBkIAkiopQWZ3gUDoOOMfsYnTEu45t4bLnjq7mo9UzC92Nsx9nZv1krLU+5m/J2qiaCVaa3ESUmGGMUKTXMDc/+gRvzMB1n/rLKvWMEe5DoASd3wJm5j6/yn//i7//o39q6MO1b1/nFvoQAQPDgrBZoYFW2AJP/7UsRngAsw5V7sPUfBpTEsqPafUs+E0jkYynuhx/tTAW+j6c+sMVVTaqYbd2bxh3123iBdIqC9nDFZxQksUExlZ5QjO/OH/1YJH8/+NRMIDyOhgKnNmGKVGhOzq+38ZDn+7/6Ont5oAACoU0gwEwAyxYtdbZX2irZ7EofFGKjBlgrozho4oiTkS01irP61ZhNGfeabv2pygVVyPph605+Jr0DqqmpD0RgfK+ynADtTzP4ea0+8ffmMYETnjdOj0+W/p//7Hd2tAQAGpJAAUMjY//tSxGQDC9kJXGw9R8GAIOtNl514c0mhdhqbXPhcdi862B7Q2KHbaIbm00hBMBF0bepkdTUccMbSMuaW9a/zpBPVzyco1OCAzh3qeC9juIAjkV1xJ18THdooYVCXZw9/KgUgEAAAAJwBG2GEmV6NidR5KoXG9see9wnCY4RMujTsl505UHRuJtEpI0rLLY9a10/rBnbtQmvlDaheRRDwi1kzT0h//GFh3Kqkr5SvLKo9SgwAAAACdASSIlRprrcqJN5m6vEKXejEeKoZyxIV4hP/+1LEYoAKnMdo7CStwUIUrTWGDbAE9M7jQwCZDOHYhHDpx5Q8T/SFQUE7ioEEvbDZdT0QXJTpkOuy9Ujcpa0XoK0X/VTP2FJOFJEAotO1lPtLH2VtzsVguxYTdiwEhw7pSx5A3rwbY2yTKLDIiM8JOZxRVdTQ//rNg///q1YhdFZxsEHYozdSrld9AqCD9pEhJCx4+tKg6JVVYbGYGa8J+Y5/jmUdlG4nmhVSxQkhYcPjYAjcazbAVG5ZBzUqrKXcY+l0xdXKIK6mQoDyJcx/Uf/7UsRtgAoccWdMMM1BShgv9PMNVjVbkUYxrJuujXvdhRZZxikF6gkbUKo93Ges/AAAAluC0up40JKW2IiLL00acJvWgDBssEkNki4ptclfKz2cwvaUGDlOnSJrMxVBra1zV7H/PB4zHZqb1PdfT7pqz0dma4O0BI75woKCjGBAX//YOQRAAJyMDg21dhyVuXXYfNqmL/yyC0daWioZxcBwmyCkZbZocYf7uYpavVvidV8c+wP1+RpaFxoO5tJvMEZlSpqXa4iig2rf6DUeXp3///tSxHmACjTdeSeYrPFQm+ydhh0q/zgCVauDMkmG9hT+wEVFRZ+6sJpH9fl16sik0qrLxsvflbEOX66hn9+qddDek3fnWjYyV/QDOm3ycDYTRSPzBqSk5WUXU6upHWT2//R//SN//d/yqlRhFBEGBNRmHCuFEynsgW1ZTq6PAe9eeKZwJq8snqIu+9n7lHq9z+xblaeyv6czyc3xBczEwAJjo0cJ7qw63zvzX5y/yX/z1GfXOtpNdSeLBFUdRqQWgsSEIfhURyRtBdHBRHcuLan/+1LEhIAJ3Plo7CDu0UofbE2FtiiMpRT4g77FJXnPIdHVg8iVdlYuuF6BCWa9NI7b+wDScr6CLvw/mXf0FL/6T4g62Z/UWf+ZIht37dmUSmNvtT//5UtVAHzAhjyFC3bkzvhbqu0+3lb6ykgrV0hjc6pIDGUTfK6hTILcufFbR0Us4WyetWu2NUXo0euvKfgy3KAKe2okaoq/UQnO/NrrG7ff6Dv9/yv/8kAwAVgX7hlVz+q4pXJIhM5Ymp4t2bwpPRqkgCHJ6q02LQLCr8GRhf/7UMSRgAoo+WsnsOvxX6ltpPYdfpriRlvrGcedXmOH2BxqWSx0k7W3ARfgKu+NbCw1X+Iv0qcL92ImbpVP6SgBEBJSkkOR6X6ElGFJJZrn5mjGb8i6Kf7AKeCMyWsUzwukkSEFsKtuFvaHw6TrGeemgdBxaf61B09+hhxsxHKthkh56sl3UIHMK7Py34pySqTIRBACJSUTK5HOfz9VmYqmdbjok6M7KBwSJiqdLUVQxV0tyDvFWO/9L/pD/5c1V8mfWI4JM31yp3/nlzqTJiv/+1LEmgIKTN9aTDzrwUKUq6WDFsicUJslKfFISsv+j//fT/f/8sZ/0DRBAAIU8nLJ2o04q1GhuU/SrYHk3LGNJn8tPJD6/MxSCex2Vuuut2f7hMnMT9LPf1ulrkZrBDv9cqLHO/ypjHMzH9jRUTKMftfH2+35X/8DtKIAlRuC4qss0YZK7UK2pHlUgmZGBjVTY81O7lXabUDio2BxHQdHaMndQIvaiumMVzFsjmTjrfXgpP7uwqTKqPeNEVU5aMnARP/K//7/+n/1HS1ACAATj//7UsSmgAoM+W1HmK1RUitutPQdvgV0E3V0Z6uFgckOeMymIeULxNxHaBlTrJeU6MXmrkMFs6F2eIby4mUc/kZAoHb32MGLnCsma/Ls1Jtvn4+Caf+fbp54699fjxZvb5H9n/0KalIVEkKt0lrciTwMMvhMEMFYwsVwzppeP1Rb/Xeov7TebAONsa2El1ZDCV7ocIImVkkTHHzQZPtq/q/9diL/1GxMhjIRMaVj0JgnG6q/Uf//n/s+xP/NKnAIAAASqwQcM/ScnkoCZxJjxijJ//tSxLIBCgT3Z0ek7YFKKy0o85YjGEtPVii4PSrU72x5elPAGXRQZZJQ89hUm0R9EcVszYQkvUv2EJRG+ryTGf+WNv/kzWbT5r///+VHn+XM+ttJQsJNEExGkIJKuTaOlgN2yv2nypIZB7mpblvN9EyrW8PZmoN6KYNsVVIV9R1+hV/K/ufx0YX/q//yY0QkYljVMOASMoRsjkGxEdeh31/+3/1//GB2wVM/IdQBAAKqdYTN6aA5WWbzNxc+XpkA5LSJ9/n/aKGDo6r29YE3/P//+1LEvoAKoRFe56T0gVyerWj2KPoYBB+pcfsOv0vBc4znsEBfYdIh55hsTkDK1daR8dTnfUu/Ob1Ggt9VznFDxtLhQ5/899OzQCQJIICcchLxNzjomcj+0cjeiQZhORyYpaXL0kRSJIuHBwhCJxmvvtuhOIDJsgQOk2pFq9pOfb+7/l//w8wuJ1RWK0RJm1gUQk4jBtQgAAZcjnSc1ZuyfnWN/4Rhu0YwJOo3P23gICOU9B+fOCAHzFTvVlIjQgAAUruAQo0gki6Q+5gHUdJjsv/7UsTGAAopJ2FHpPCBbysutPWd3ifZzccjD3EmVBJZPzHF8SZ0K5ByzmmFwQ5qVewVFkK81qPzxJiJaJEzhzbbybVVbnmjaM5frPgqCTFfR2a9bNELAAS5dlGT0iHaOnSTqUy8EKwDKMm8QpsJlGIvwJIwILchaufeeSnuVtDkJo6XSfVPaDYcCr3bQuzGAy975Jbhzij0Nc5xwCIlBZOp6XRK/+kAEJ7goQZhBx0fi+Nt04rZIjUjuvKvOTLT8a2omVh85G3WgyO4y5Gdq2DA//tSxM2ACvTdWmww8MHMnu3o9iS6EwwZaosJhXBhjRSFyPVeEWbCJyll/k6LIdBRKdnp+s2fFZdS4r/9QIAJjwBixA70mCgFA+MLJdtwGtTMNS1aMKJkY+B/ET7TKvWBJGUWSFTY49CkAotFkYpqSGexX4hxfYMq550vygUdxiolAK3HXWUr23kyJhlzoloAKu/ggKiioJLEWJHDsLjzFaOUWk3JHVob4fCgVrF7ZjTZnNgKylNcDv6Wh8/yl02+L3P4Ydpo1pnrtHF76N1t73n/+1LExgAKfLFvR6TMwUSOLpz0jSItKKimsjNsAush/+sAMBggo1GAlyQJajgfzCVD5cqFmVTOc0SEwvkQA9ClWkidKRaQTUMGXYSCaBxsQQ8/UudCa0Em/WQCSccNH6QeGts5ltQTN/by3/5U+ma7vr/J1QFxWRCJKMNMWIx1AOF4TopD3V5BE/Y94m1yon8xYKSany8XnuKXemY32Xo8RitV0+l39S15wd1o4FWInqhgk/i2fq20a9/ZmvUdQ7IZHnoLvfZ97hEfc2rKtFGlwf/7UsTRgQpMtWhsMG0BSJVtHZSNoD7vrf8p23s1ACsIoqznqA1qJVjefjvSsM8lQrUIMlVSF9fVQIcqMuNa96pxIc3r3YhB1Fhxlwy+/Kjz0vgB8dn9Ad7utuu7ZSKte9TUSsUm9zT/xz67IsQi7VZVHvEoP7dP5PV26gAErcDAQDPXWnohJfYUvDcodKdhxqxYBrbs35NxFSbuPTnQk8jzF7rYZ5RVSpeGbWUgy+Z1P8r/lr5QJZ20zAqWKqLd6kJ55G0Bu1STfh6da6wo/1/R//tSxN0ACcDdamwgT8FInu2o9B38/ms3Z//gwACnXyl4E0rhgL8NbVKNDaNFmtvFTqbtdjcA0t2OI9zGEqCOhOXafrKkMtWtavoQZXn73Q6TK+vKPy0eYE371pgXpRq6GHFap2o2ZHvl/mr/5R/1dfGaG/8l3Yt3bdupAACctOBloKCpcIVImyER73Cl6ug4tg6Rs4rToBkwAyMcLIsQkAeaxHlxWPh+WMfZhI0OSRQsmSgDIRXWHWTxd6H3+IKzoyndZ83kZXJa5bXdbZ2Qf2b/+1LE6oAMpRVvR6y28Xeg7aT1nf6H4nfTWQZW7QBQIgIKTkoKUii6z8vHUbaUR5rpkM6DlIgZJIdEyk6FpQIvnd0J29he9Iggar70Y5WsY2XzIgx0CQoVFkqh13Qv3sdRDm1HCpQFFArHB06oEWAepNpI8/a73Paya7U4QABSUgaVEJExtl2Q04MPwJJhJV2XDgmQDSHlNrHNoPlLl8sobFIztSa/i9wi5vahE1mlDnz1z3b2Bhj7TVOd7nOfZ0IJ0LdLdfZ+n/6fzjzHmnjQmv/7UsTnAwuJSV5sMFFBfiJrjYYWKFg2pgoqt/1gKqwCSk3cPKYExF+Hap5ZF5mQPp2WPHSwZdwD2PM0TENpX3ge66z2fasc9eG376quvlSTzpKZPAxam0fNGy6e09L2N2OIPz+h7/83/16GVzSRaihl9+eL5JkgB4ua3gGUEJRKbdIkqZkw3DXy6DXsZK3R/qZKDUzaD7HIYkym+3ujhn6jRfOVwv90oaSW+gjeu7xVfNOatcTkGrI6sFi3mIrqNX53oUsrrdWcq1kIHe+ifO/9//tSxOcAC8z5XGywrUF1me1phJU6X/447/tl+fwGBSoiBCMUoNNtPaAUD0lZwlxXDSbjMd0JbJtDlYDsKYtjBbi1HhCpbSP/ycioRttV8c9S1zELvsYGHT9Wf389HmnEnYwgIxpxeeWZaf/b/3+7UOI0O29Z67KZF76KAXkVEJFOVliWhWp2VztuqjBitMOuC4zuu3Aj/zVun1ViNn6XCbXrhlegAlVj+l9kyTF59T/zPa2R+LXPhFssvr6kqHF379SD+/l++kS76/fb9Fb/K/r/+1LE5wALrTFk7DDp0XombamDHep9uCH+b053b/ja1GhfwABAFYsTgoIGnkiIPQWimMvWFMAZ00kxRWzUhNkZTNUbVspEJt9bD80raiUan2vPpI31GzHm+OuDyPpATHDo48440/dQOBlUch4gO6/O+/l9u/yPq0bfu91+Q1UAEmCQUkpQtQhoDU0HUY7YdSEqo4lTpQmHAZNIKIRsxRCJ6DGeEgqrLxOfFqXANN2jfGDn4QrjF2UQ6jAzqpKsBhT28vp6Cn/v/0f/p6C/lf3+L//7UsTnAAvdMWlMMOvRcqZtKPQd6uCe20G8R6UppRVqkEkglQOwShEK8zVwdieQDkYaEuyigsiDY6zOT2Pdmo8dPN5VXclRJ20iJXvjR0o4tQ1ZJiU04vnT25wM9/Kt/0N6ecNe5y84ZXt6P1f7c9H44+WwtogsUHhxBYVbfVT7lQMOGRPwBEqALuUBGAH5j8VGSVnsEUqjm8JZQJZ+NDF1iGVyU/zmOEB0DGDFDlAgUZ7S5qcMBgebnN8e3Svbj32xhKbCx8LCWXoLtdGsJ++Q//tSxOcADHFzZ0wsVRlsm2tNh514Cm5ZUMGRvgd44Q/S9Yef1fzvAydAU+qH5H3B1K1y0wZtQSKuhhe01SdDLtt0xNKE20Co4ouFYISPErD9B+P2d/uWvhf539DNG9DzLINqf4ekQNUtAYettRoe59ESv/+0B3+6/L/+9P6/alBIAAABTkDmDTGAnkxGXaytnkWG7YoU+EFTUCI8VRchuVPMeXJ5cTtaqiFrUS1nNoh268rMiT+1/2MtOdzfr+3vTbo5ki0qqLkcqVOviIj4H6n/+1LE5YALeUtnR6SrkYomLaj1nlY1i4EAAQU5W9XYPJfl/3HaPSS50lB4GljToAFrDfZ5SXdtfg6oL4ofYuR6lMjZ2bB96V31dJvNOq1rFa/1b1BUY/zSFVP3NY96Uzo0b3559KsymN+l2Gk7c5ciY9m8k6dNTjP0Fo8TRbbYM6YNdqxpmsrZZARCzvFAZbkdB0G6h6GkJXF08uTePO+pYEPITQFSLSCh0nGFjkHqo15pNJXjbSQyaw9otF4TBq7L5rjVUMPoiHq6HOcnPp12Kv/7UsTkA4oAn1ossMsBpY/sTYSNeU3+n/q/+cTp/V+b0Pb/LvTpClgRAFOL9REDAYjoG8YhMDyS4Bg+MyIjIFklZLe1vCd77Tg0Gy31pzpETmkDd8w48xqzKPPdFz5ihKRUfpPCxPc1phrCpTqrOyf5Rv//53/UkNXrNcXc/K0KBAAJMgWBog8Rx4ObO0Z9qWB2dzZQGgwBqsvsqS4ZH7RY1fBIPDZDjQW47s/Btrfyj757NIaWY3TJGQq6KJJJmfQOVQzsUFXOt7/8o3+jf83///tSxOUACoUNa0egTVG7rCydhh27mD0u2TKo8HlLr/d1ElNQoFAEEBQkQ5BPU4byXJUTWMmykVR+I6wjf3wHaanzHOTUli1pQobcvMzdt61eN3egXLznc8/EAS/vMDmvtFq6NXU37pnFv9C//T/nF3/3/5P++3/IUlqhKoaelRIBJVAosgbzbFOMqy+KQwBZIa3ThQ8497pdcak99zalUorUOxVMas81Hn5o6ylTY88VtX9Aunv9xgGtulFHvu72HyMjKemxZdOhUTu569WzvmH/+1LE4YALgV1xJ5lO8WKkrKj2KPgyP20f/VP5xh/MUxlioXZJ+qFRyAS0OkosOIqNByXcokMFCUHQfEEvkAaBfg9JisPpk18k5n/kvTXJE4Prm0K08yzEBvWvoTujy3n+v+gjk3vuHgc7vsorPuncxPpVC23yoXjqru17JzV2IjWbq9/suAt81Q3o94EyNS1kC6YDDABae67GTEaBWIX1ZO6b1QwmSYIVJM0nYVq/CVdCw3f0ji7otupgqjIiKhvfHja9FIg5c7js3/yx0pRRcf/7UsTlAAvFJWDssUvRai6uNPYpbmvFR7V8Ry1vQ8MAslFZqs8LOs1Oc2f9G/49+mr9/qi/9P1Um+G193kQEKlJASSkfEiOhvC202+siZulWrBSpPpoNGddUC2n0d5waBtDIdAtGYHGg4oXOvcxqyxyea/8s5XPQnMiPue98E2gEyHTuPrgSN+//r6vYcB8MARTleo9/xKU63vg0Cv5+hYBAAALkoWWxdPZx004m37T4KHjOTJXYY5DDQZXLm5FrkqofGhMYFQVcJGnEZ5H5Etw//tSxOaADX2Jb0exSfGbsW50xQsqritQgCmYdXHIlMEe15ZsWf/wECcdeGoEsaM3bl7ue6etbBVAQU5dypH4G6qSqN4QUv6LfD8gtywgQqpVyBbGrDQcTIYymdBeg1u9KsZGj/3FLZH1HfroO6LD34w2W2vyzGLuRg9tUeyu2S4WMn0YLuzFDt0btuQASyZcnAOPj8UzASonKynGSdohQ3BSrSrUS22UkwMqVhg1CqWiZ1Idt97GPlF3+ULOpk6hzm7tlDs8M7pIq3HP93fyfMH/+1LE2wAM0U1c7L1LwYQXbSmEmhLNDM6G8Xa9d4EAAABItyywOKGabZ09rlZGX2stByeuJ1nrykedrGKFPoUghalEh1JGnJTFmmy3KPyjTD3IRGHHU3JgzC2QjH1A8WVvv/KN5hqEbfoX0bnt+aSe239ifqfznLIAAKOcQpGEOcwDarPZCvh+wqqoBNv8m6/bwlziOtCHBv7EiCpYlhyyzVFmYWbJ1J6vWj9DcIHGy3ug6ajJeCoJzL6gN0NfKkv5MttOqXeiT5w005pX+i/0///7UsTVAApYp2lMJG8BTJXu6PSJIiH/6+kGARACCE1Q/AlQAJOkDAIoPZpBWB0i+jGyxIlUsJjMN8QDHGiEz9U2U7RXWQkd6r7PxV2Egm62vjp1F4VQ2uz8KIxPqSfyv9yR/5r/PML/x1/3R93yf//3/i4OqVNXS/E5ihFAEkpyp7CyiabWmFyxQZegFE37kVY+98fZBU+qi4DpprETClafw13XOksLvOv2fWjiYC3cPNuCYgjnlPoYH5vhVu9DARb8cf+e/6kn+aU/qQ06itE9//tSxOAACgS/e0eU03FqJO0pgyoajRR7f4MBzArbiRLiFNwNtJopFlSqExwbx0lEdZ9i4nrQ4MQEEiToUrJhnoJbxvN64djWn2VmdlcrqYQY+IGzD6oJNaasXr8c6nsaBwi99Qs38z/M/nt25v9X+kV9b9p92U/2dVUKEBQEEk7Seq8RBjbx2h9tAFSq0yB4TFaRmWl4I6lIKj+0mT27xu+X6ep/GVCdFVgbHZxTy668cFxt3aoPzFRnx4P/ua/5/9Df3KpX5f+v6OUOaQn2Wj3/+1LE6IALoSdebLDtQYYrLGj0qermNu1GcnvpCgAAgEouUL94kXZcBxp9kIqOzsi4+SDEE9PZ70RqSEOxunrBGABCdLuxDJJE8USq2kIrowt1oRrZzmIkVkdJ1o2c7/99O61szP+j0db5VPoQhK/e2n2UxECACudwgjn/0IB1hH4R+ik1gBISbgQAS8Roa6Ei1OKJJ6VpcHqKU7cs+Ygirb5a8qUhp193Bc9kyOVcsc5XalFb+htVBHTVqGQ0OzNz9+6FGvbwwiCgdjiKf0+R0v/7UsTnAAxRJ2LsJO3RXqTvNPSd3l9ISoZJJCJKbuE2N43waRKEPEyL4ejWmkauEKXTDZqOOP4S7j4sCk9fYeJwpU7aTUZPnMXQ/JrEHYk2xyZes1bPa3z1zaVBuLMzEPIn/bT3f7nEKKVsgFIZdknpetL9pJRGESQAAApu0Kwc6GExJZo/mMb4oibE2dpFXqraSOLeXTB+/CAU8MWBuUYG++5txPTo+oQYZTgjNYxk+oo2s+EKoUstaZgs9+CAAE7GdY7i1EHhG5ySjA8JWLGg//tSxOeAC8EpZ0ek69Gbri1o8wmrQAAxPuUHePDVUSbRRJKTpLyxC+J8ZsRFk3GJsVzCpIhLPl4MHeoS4ml1l/b+xd/1Ls06CL2t3b2mGCjuzGyDi/sRf4p7UdnnJNYGYwaQKs5M8c7K03fp4BSFGD36tdKqDbVacabbbd4SugOiBTi1gmYOpIdHein7BDjLAVMpMQsmyeSHKsiY5zIa6afz4ilk9LEge9zncEEr6/oOR73kD5NXp92dVAUl2KWq/41xg3trCQUD9hOHUXKEJ0L/+1LE4wAJ9N1zR5hQ0YCk7nTzClIoOBAD4lkJOpVYACccoaTmCsL2aeS6wi7lo4t9T9fPkHI6y23PaJqIWDs9ymRqdcQP/DtmqL/m/4r4N/WKGNZXx+UPNqZjygFhFqlvqjPmaqHAWRL2dtP+Lp/DzOzo9/u6agEwEBIKclHElvEaWUOhOyJj6ZLI3QZ1msjJuVu7FN0GDltW1KNXTT2eu7q76s4qfzRZG3FCfXnmDs41ebudlDxcfr1L81zLBxulDkZ3q6zARQ/MIn7n2OfAwf/7UsTpAAww3W1HiHNRYBvvtPYU/rG1M6Ple7DFGX9/Q2mZACAAAAJuQKADpCvPUn66Qx3wRaGLlrQtZIw6a2PvclTWA/CD1mvniSM6OgihEYkqWfKN3e0zroeX/qUNropg3RHM3l39Fh71/b9BUe+PqLMw37On3wV1EJBKkuJVJyMSgZgknVmjDACJTbMqbATp0TS6q9d5NF91uGk7LbsN/KXUsnV/eRSzshFs43h14+WbM1Hzv8hqZWga6ZkhSz1UAy1H5ls51aab+i5ialHm//tSxOoADIkDg6Ygr/FkIG1c9Ap60eks6JbUs7P6kAwOOJI+2tVQAJpKJAALklKc8wIhonnpWHCHwF4BdFt5hdVtU7xNQhoQcsnLtt5G56RG2R9H43vfG+upWX87EdTPnDOnKVX0ugjR6pu2t2iPqi7afd0e1mv9agAUpvzQGDjy0t9arit3ZIgIJxYy0d127xF+3twfqgj2LhaovrtOj9vRc4qBVPS0CcZcfel/OLegLXTwFT3FQ7lcZ/wT6H3iU3fsZqWoPSrtWu7IW5E/u7P/+1LE6QANASllTDDy0VOgLKjxnlL2V7t8b6Kgx/u6CAACk5BdSgBMN3WDWo68Be8OTiztoT+XSyWYBgKjHYWR2zOSZWrlpzZlslxZejM5X1PnvV8oe+uhUY/PDLpczPQv0fRejfzPbEzO2i/zvbY6v4+ZVaS/y9UvFhSiSinRqNJZFmLCpS/nWZbnId5jQpoCrlrdN+XLjv1h/d1Xvd3W8tguLuNGc79D+YcwpP8J9uVX7+NUaJ+/VE0TLr6L5bT2MfbaVEgz8gu9d1Fyrdjbqf/7UsTogA1VXWlMMOuRRyBtdPYVmq1TNsk0WZkmk3khaiJoiPL6+gMAAAACk6AdeEFAbyWysUcg1t1fSxsdBH7MvhfJ6PsEsk4EF0ANZa8X0hFWa1j+3KEqrnlXqZqod6KgTMfcyg0UxLqOMXHHeGed2OP/x9Czj5c0hakhwAATdpiBLk53hL0xCAmksQWGhEfNpUu06imRoRAXtZNkRS0Vv1ru6zd5nOkj/vCZXxJkiVPq2fx3TQROkWWhWLZYksiIdwoeTMiOH3lbxhB1eQ40//tSxOgBDElLXmyYVMFfpuydhh2qtQWbFQoGmjNFv9+gAMBAQFJsC06yiI0PL0jT9vYLIYgej0HpSeWDaE9TBmuswT9obmGW53HZM84LgdOZT6GPqW0ZDOUKlsutyipvwQGMqjoTMUQ3kz+0nbTdP5Vsxqyc4zflP6kAANzARBF7wWArQWtZQSgkggOZDgFJuEP9JrDMca7Qb9MazRRddGQz+XKYs7osbxcZWM1kVzkLrF5ISY4isXdGNo77jfmagLtNHjnKLKuxFnkvRtejXFX/+1LE6IANaSdzR6y48VIYbSmBngpfyrXMbYv9P7yd1Ul3YeBACrwQmxASaypXHGyjoC48ISihtGOnnY3GOwqo8lnlBB1gEj7JgddxW0aAxlUVW8za4uYwwNNvms2dbtiOvADuh9xXBvgjWOyXfO1QbUyVFP8oAAAd4NZi1QacqgUBfBlSKwa+B0L1gWvQzSxlfsGRCSLHlEdgrvCbLvodkz+lPMPhzPVO3544/NGlfPNFiKtVGWY2foD1NqdvlG4brSDpV6K2GbV+Nq2V+//VD//7UsTmgAwY52bsPKuRZCDsqYYpME2zP9Dbrw4SIjIAVglVotySCMEhJkkxuyXh1FiT6DvkV00MOCRaik5vBU2ipc8RmCnK4i2FNiIssgq6o9zD+vFno2puvXq2guQooPZYsw8THTlBXIpkLLdTkq38VpSrBy7ldb56W3MNVSgAApJwES2CFCGwS9wXGdl5Jh8qAqXeuam4jGza4rAtLH8nevFy7awgsxGcLgQiQRNTUFMzp+hcSqxbu8XzhphHfnzByBw9by79qX/BxRNEg731//tSxOeDDLEpXGy9S4FJnOwNgwooGZAKTcvFxH8S+dBIQch+pWdGwEw9iDLAJjp2hGusbNAERiMMQlSGtyOYvlZ9xzzysk1x+Bo4JpM+lLSaYoCJBy12TQMM4wZQgtBIy/fgA5OVyveFn+HU4t8GR7HnT8j4hdEkf2aLuR/eWn4xO2qqpLhUCgQPAkWqGZNP/hQxFalQElOXcehyH4Kx+bPxuAUehGbNGgSQ4NsxcIF2UUpPjW4JqEvr9yojRxc4l6kuWMC7GOOsEy18swYWa8j/+1LE6YAMPVdcbDBRQYUk7WT2FP85g+sgomHAg9iqUwwjqC5Qhs2X2VLCAAAUnMVAvmQlirXB+ngjGInNrKRMuIbtlZKkvd5fWWoN/snix1mTI9JwiwwTkHBUdWHM2cTfRA4MvprWCtbW6wvREKT//v1l0Jw4qHzi2v+5ABJScaISjXqs9/4ETcVhZLZadLZbIrThIMjhcBgfiuxytpoxzZlcbfO93G4qTpxWHjs7q1pzuo0pLew4QAtS3tVT0U6L+6mMRQ6ADbEiZ6IfwmLP/f/7UsTlgApkt2jsJGtR9rEuHPSNu35wWY70pqSBAAC3N2piITB2gQ86jckm3afErmpPDk25OGpEZLJEfrlGzdtMcPrbVipajHU2yepGNVVuyFN5bLoLHN6rOeWYSOpvTQhWoU50bvv00+YqVT+my2EpQeHMR6d61SgEQJBSTmLqSobinRCVLpKLq4Eah8HKOeQ1OLT6olYoHFBt3d1OInoqKjk92MxvidehavtfQ8Y7GZ/0UUWXv+6aKGX6OxUtX+KGcgslRxXZ2qU23US5SD7D//tSxNsACmhve0YkSVFGDO4c9hUyqIhZP9AaiwAktuTM4nMEvZ6HGfIoDSZiqgmA8Hx2RxrqwbinsbpimHemeN3DrpOhCMlyr5UVOYdLO0JiUp2uKuZ40BQTOyRfZZQzfptSObyJpahWlRVZnR8asvAvib3CZ/xa1TGemeiU0i4BNUNZjQhEnXBooUdx1LT1XKGtlyZcF0dFGB70iJvazMLt+U+22npRBTVkqIDFHh1lFAS9Wigi89zmRfCpHO1f6F2r1/Rs2c96Xd2V1Vla7qz/+1LE5oMLqNFqbCSt0WglbU2GCThr5qmono9I3orAECSW5QQoBmaC7vUufx1xjnGFuKlFFVCEig7xEUsbZotFhk/o+KG1cSQdJ/cD7kh0uvLp6vyj/6fLr/00HfgWIla3Mv8FaqqH4Svq3he66rV8js/x1qJ2DCZp5etakRRFiwGwCreoJckmdk2T6KRDDJGaHkzatSVY3WJoVnjW7rjqqT8erW46j+54nmeRQ2Vr4O9Zig6enuc9Ih+AGj6pqlbu34JEXn/Xoxn3eR1m5ky8E//7UsTogAu9a3NHsEVRf6Rt6PYVKuvwczM+fewlkEAQWy7p0rhDAq0YYYvChUZyx4jKfZQYYBqBOdbUTj4pvqbTT7Bqd0q/dWQeobJje2+ni3z57yzrKYXyPwaT9FP8v0KZKLGQBd7crlBDsUOWvcxPe4nRmnO7g/1KCBwQgFpy1XhqNCPqUiBIzrNXZAFpLm6ZaqM5waW41MB7uHTLW6CjW0Yl1dFrRGXVnlVnk9MLgFD88eorsY7ig3tX6Ey01mLIez7k8yy9qADk7ZxidDB8//tSxOeADAlHd0eY8PFzJOzc9Apy9v27jRTTfMtPX9D1J5NIRBAAS5JQNo3XIdwN0RwekJpVHweLHBTi8yDuVEeQhykgD2NCxaz/fUyO6udtQqbmUzVqST2zA4yIv+GA0yqH6PPUSRysohh7pYYkDlTSEtL9oXgpMe1duMv/0Hv6+WKJLfjKEFgAAEaM0qSTiMppCQUBjGsgjnQ08j+bdmEgI2ywwhqdwwUWsYNghvgM3Go5GAoVY34DLocyP1BLstZlX7xqHgzpKdSdrsLE30n/+1LE5wALmSVtJ6BVeXadLST0jb4U1qfZZQa6mvrqEc6/Uku9if+zd1EJHzOV7oiJEFWWieFvZzWfnAG0qCDnKPPKiONDk8bBWfKijvKRjhJutqOh6rZNNo1mwjai8rNixWyiVOfKhMNNUhuqIpzgiFBkhQ0gWzEqA2DYzo/dENnIdV9kYKxanX81fqvqW/V+mkokWUwESkVGdBYnwDYUwfo+gVqGi3mVlPl1NmY9kp+jV99K8xK839vcV1JyT7EkGOlqUfffz+jt64DF0MPXV//7UsTngAyhX2lHmPCRjiYs6PMqEhb6siLM7qmV18AlVLqzfx5/+7GDPuZO4U7e5kVpBdDfrsEj/0Lsa6CUUk4fGTSIKN06ztcUYO0pJRaDgq8uDa/n3RRNs8sZ/aSBFrnNOPY0mee21klWRx6jNg6VU+24HEamJdkbcCZs9zldtZUJC2ybV1GF+ze6+jaUcr+R/Pfv+upJRSQFVo0jEfkuJG9CljoeQIImK3uTesnsatIyE3V+I1oMX3NkmDpVTmt3Kvs9Ck/3sYvLaan834lp//tSxOEADIEvaSeNsXGKJi2k8yomVWZu22/cQC879sz11Y7V4McxKnXhZmedvxoZ9NLOtfejbiV/z2zRYMAOOb4szQLuKwmaVQJ/M4UQ72NEonUNcHCwcm25KzOJAEi+M5GOesejLfjhCS/jkgeWu6TMxTh06acru5s2RDvee+2MC61Rk+o+pZq89ReWz9Zvt/poxH/d9VUAFJKBGWIO4imy1tGFXY+3AfXQQ63K3A0ck0qyaZcQIXroLR145qJUV6J5Tl5T9qz8v4GZzd28hxj/+1LE24AMdUlzp6yzsXKl7ij2HWa+vJRIuzdaBpmu9nbipk/WzFTLbsnyrf//5qMqIWB+GF4hGVot0kZJ1pCoyGnmyNa7MqdrT9Z0QhCjZ2mAgQajo2kYi3TEJsbNcuK31kNpi9+fKhY2KxWKzeefg42vNi57SAUGMUWuagUAwCBI2jRz951I3yNbP/Odec50SpzkajKcTD4EFCZznOT30O8lf0DjMQjoQinOJh8OCijgQOcmAAbc/COExEyZQwVSkECug7xTYXQguGiVIC8EGf/7UsTZAAwdMWknrLOxbSYsHPQqYCNP5QWP8mU3kqa7T5WkJuqSQBjTTocacsccyW3m96UomA9PLKmwKlGQagWPHlSA+MsW04+cinlZdet1HtOxcv8gvyU/2Nf/36f22hI1Mkk6epkUneFaW97CJHt+pwEqbDJERpfF2sbjQAgAHwfwGIaBviTYD/QYwC3Ia5uJwNpiNtgpbyneLWYmaQYI1ALEEimzn4swhjfedTYMCoTcHUhMVOhp8kkNPvdRPHWMf4NAVJVITWkC7nL6qgAA//tSxNiDi5UvXmwY8ZHxMC1M9JY6nKAZhBG09gNVPkpI8KEHJZVYR6cOk2XxBSKRC0rum5BbewQubbQCMFDOSOuexQQLFhY2Ki4eBtCqkCAPBNyWJWHgUAZ3RxNOAVl1muMXczqsTQAFNygytQJqifVmU8p050oVaN3ToJSEkC05JLqmBCXu+YDTrkophKH5fKV9iLrA8jkrpSgB/f147iraFlZDYbOXCzk8y8whyVqFxxjcCR8Y75QAjUtMgBejLx0FdCIUtZa3VKOlhCq2bnL/+1DEygEQiVtsZ6TJwUQPreTzDeCyvy0qDYrWirZ0TypRMltFfGXQaGwS2TZqgRvzm+YgeNLGqIiGB0lYOabpeVcF6X+TtkZ70AJtYGKAAAkJQBxkfC+NMg4+ztJcQ6oHDUWpY3FZc6K/SZUOa2dh0ySENOIcZrWQ1lBOHYk3ErpZUQiKDaVy61Wnt5q1EwwNDTVFfxFFapZ/vc2JQEOqAwDNGmBjihDUknUp2Yzbth0HgijS7OnBUJi2K9qwsiORRN2Cgc8pBqzszXtmnyPR//tSxLyCCnRxbGekbsFJle3dhg0gz/ltR1M6ma8EPZV7yFsb9RW1jkEWy5t/f9SzvtQEgIYyACTLgVSJMrGZe4D7s9cZ9mGKRsLx8SqohgeaRXeXPQRpyiIznY2lsJHUe19VzmM2uxnxT0X+eu/rIgik/fFK4/19V2AsDGDr8/dv6MSTVR+P6JKSKcO5iSqIH0qhdgrkOJYJ9JALXRA4ERaYurJLYUa/1iI9iPulD2IyH3nlSrXhbQKT9LL1PEGVpQL4ukBCwwwOP8TCZbtn8Hb/+1LEx4AJ7IdkLKRu0UuYrOmEidCpl5V67M8sCAAAJTgBGFWo6qYzrCiVS/lh1AQw1GcAgiHA8GX8cqYxe2FXtC3opHbVdznEBmMONApyoBhk4UHkn5Aw99aHJsfcu2ucbEn1orGAMo02AyAtWfzVZdL3vivR5BUAIABScgCITciyxP3Z3Lpdi5hoWZWDu20PY2ao8VJk5EZ0CALh61dHDU4n8X2MZVi9778o6nqnxi94kC7DdsW86sheQRlEYKloznk1MI0lSx7ZFUShltAvbv/7UsTUAAnEu2AsGLEZRBmtKYYVWWotXaPJ3poOC55HpjPestJqI01juoEaXWJlQ8DqSBG5+kADhgOksz7KFKfnsiEmaVqK2fFFr+b/Vx9wnCah1n//auTUXqIFQJSblARyyBqCMog30mmFWeaA0tHcuxicDb32HkuhCgsCarnp5JtsbdlhZmepsR+zMQ4CCowkVmZpzEIICUZHuIVwLu6nf7wx0+sBhh6DsvKFFQYAAAFymYDx0LQjvep9ubk0r2N0wKwdG15oywVbWasjWshk//tSxOIACline0ekaXFuDGxdhKFaTwVJN0B6mq555M0PSTLh15nUOI2vl+xQ+F8w8ewcl6F3mVeotMdY3uX/26tLv48QAACDe4FGmCF0hDQbzAkLnSeT6z5SHXVTOpl/jRN1a3QkOokXEN0DNyO3tP01ip67rZLr6nYHhHwwLQQGY2b7QgPHnqGp0en1GKG0eHcyRDqbW9QABFO0cc2iNkBu0zcUIRVHMmUjIejsX4F8jxsTtE01tQTPLMB1GLmhyo0U1RIn97j6VJ4++3GhZG//+1LE6IATqaNo57EqkVASLujzDZKeLGI1t5RdVdGLO+2dDrn8TI/kJ/xgrurIkgkqieSgpEgqiWQThaB4s8YXPlDMH8d8ia9LHBTsFiOQ6CsiZnI4pdK2b/pCOn4gOs0vq2a/Rv7q3yM7/e+f/su//+V5furRjy7d/JIBEpVgAguAusYxh514sSWCbq7T+NKRzf9XN1oN2JkmXeHzjowqbWdEDzEZdyxSLFBQ7qJzHSKkvOasDrnUJsjgQF/VRIMVn9XH+/t+9Bq8OhR1ShJolv/7UsTNgApAlWjsPQPBT5KtXYegOEf4orTMTRJclwtppnEhxM0EuCWHidIGsKioqHZnZ0JV6zncYMWFQ7JRcZQLRzTnVTVqxrWlEfIPf8Lf8ZFpxzy1FjTqbZTBvNZEVrscuiOdQ6ypvONbu/HVRGnp/2Uq41xGeL5QwDPD+tUCBAAKVw1MKoJwtdawnu9EMRiMiSIbLkYSnCGnbwcrMFlgJLLnbDVdJbYuYZI1FSJszixTUC93B8n1Uf+ceJNkoUO+DEqyzxXdT5ZRV9DtaDPp//tSxNiACdSnZmwxBcFLLG7owZYP8UgAAAAl4M6qYvOPCL7s8VWkzWVKkMYCn4ZnSK23fiDVhAiBM4WS+KlD9+jPNvYgFDqQnC2KjOy/bdNl9p5Tftmmyh0rndSVGBDoRs6j/XWRkU5iqeMItH8nU8jbv/noyn+p35zkX+xNYgKABBB976UB6iZueplFPFsmk7lJeXgsCARBLEJs0eC7RO+vBi1db+DY6RohEqUjKwWMzlPTOQkMqMcPHyn08mRP5Jhlvk0IaAR59QgcKTF4gGD/+1LE5YAKtOVgbDyrQZqo7ij0nTK76/8/1L2colaEgQQAbxYDaDQT6NPUtrYwuIZxinC/RRgKcREgiRdqAqJE1GmjCRZpB0OKDcfiT5p2LmM01t2YXaE9BwRAREc8co2mpdCur+YVLG3bmoHpB/uqljxtbVz06LamtfVJfcVVtW6XFkwjvc3d/qKbS1ivl83iEwUIAAEuhLGkcqofI1dp/BgETEQyUIxMVvOMQ0hYxCFksp1+fabmqgxKvQyCGPW2RLPXkTEUwhiwzrWiSJiEuP/7UsTlAgpwpWDsMKtBvCzr6YYVuZBrhD/BZYbmXITeUuJsaztVLFZfAAABAToOQGmD/SawuDDHEeRll/XKUUsiHqiIrnqOiplKNGNSyjhvPIABCKPuXpyteGmPza0A0RU+XFjqHLNbzJQyNY+YQA36R75AzUpuk/ZXKsYQBICJTm57nSOxPDeShfGdCy4IKVgJelFO9fXZWVVgazuiZM24Ui5IaqQZSi9zKDUOgPRHaXDAlMDJUtgJkuyXUI60bwT+EYoeiACIuHVjGw9zD9yD//tSxOGACqSld6YkaeHGJK0Y8yG5wxq9C+Zxf0oxoxIIkgAFRRlsFS4n6JKIohly/ox6pVWd2htanZwUzyU0ItGMYkOwXfGK7EWd71JZLa31mBmALSGHBrDESspixKgwpCk3pdFxqg7JHZE+cLn0satOsNN4htoBitVa2hgCAiFBmIoNMxlsv6HOhjIkMdCBMBgMw9aWXaWmMsp2MmFnflq0fVIR3iwb4h5SS2Im5RR+HxecVAwYVIoKiDoLApZVEruUwOylQSI+pP/Hf9H6i0r/+1LE3AAKWIdtR7BrQUiQbajzChiyj6DisboTPAYio4p4O/SABoBADTWysawYO0vxo7Jnjuv0zAZcbjUf4I9zqee1FbiDSsRxZR79JKlj7Lqa7OqqOaMwl+ptC7k1VWAWCBd6mHalSzafO87oYNG83o3/v/09SOiGEt+3Kduvu0KCQIBCTiDiBpNxy26sQkzRYHd0eZPw5M/NpQsZL7naqFJna1qTTouKvV5zSbYx4lNSQBSMixx7Vblx4s2DJL7dSv/mn3o3Ur55nT6+r/8pfv/7UsTngAvUzWunmFCBcpEutPSJ3n3yn2/b6fp+d8r0agnGUJBKctU5yD5XlWEP5hk8LwTn3TnLC4TWrBK1UJSQZ/sR6lUt5qYANfE77ircPMWlt0EbY2+r+KH99YU3RF4GTr8HetnrUV3m8JM/CG8SHdD/Guyaq+d0/toICBAQAG92ANqNrdNnMw3V0U+WqKYtDUndlpq43Chhx6x1jCA7K2Om5MnD326EsXOsVqJxo0X1Gt2LZVGNyi/v1Em/7iju9k4LajORSO7UmstL70Z6//tSxOeADMU1cUekqXFyJmxphh0wLtEyXibZZcCtdTcrsUoyAAC5uT4RUTqOFeuT7U42UarCmXQSA8DggaQSKPIHFQuCYC6w2sYjsyRRTFMTZlu0lmT1G1S0eldUsXi+iDJdDzMmIiOoEXgYqZTWqcMZicqKVRQCzrYgVBQlsxLamYVoykyw7rDVsLFIOCxYSAW5Q2LJGfl6C7pFRAbkQTQ6FcRwdzENE/xQIYrDGQkHQSVVIvLbwh40o9mlRwOZCBDeaTsL4mZwzjHXwwHPWJL/+1LE5AALgX9i7DFJ0WopLWj0FeJFjSQ6Q5UqA7Kg9O7laXhJfqqLPue6/1/oADOCAABST36JGMP9LmvQdRkGaKWf5OZy6w1C9mHzVAe7hwDZqKyd04Hldk5weR8IMZEE1iYBhWAXKwUArni/3sFEjPQE3JQWLVfVItAtLa8oAf9FADFAAAJOUMeQlywEdch7ung8jjJ4qBBvSQQOXQSOzW1Jk7TknKtdMiF1KiKlX06yX6pF9v9ByCFTdh5Qs8Os/W7/yWDTH7G9oUfaAiKJt//7UsTmgAx9MWFMMKuB0qZszPSN8MjsdNW/IJaSbr8pwtW6IxRMZKXIwOotqBwWUyteo1UdpYyRa5jboZY1aiJSYi/a60v0GLStRvpNSAI9Ib61HUnHr/Ep8/frKuO6haz6+Gl/rikWuGLyq8FgEWSlj76bbWRcb0biqmJ3pBKKKdXxtEhbDtoNw1iysPcm2iDtDV0ZvB4aAmeqh5lGUMxSqs9HdmteHxWzEOGuZMgiWugvYlmDbOzjbEJYcZeQP3fV1++aoxW3o/1r/RfXvujF//tSxNgACiCLeyeYbXFOji408w3YyCnunHD3+4KTkEqBIsIokp0dipS/Mx8QKh5HKoM5P2ciYxY4CeN1Pog0r4tQs9BaCs42H7la5+C10nIuBI5VnDh/fV0+DLfWj8Y3VyuvO3/tEHWtQon7ty3Ni9b7wMl6l3PnMjVoYlQiW3bj+PMKgrjbNFD00Z7MXBc8qHKZ0WHMEwK7hxaxadJRyhLjrRJGkgOMkN34u04tvTIQLCdZ55vNdBGFKt0edxmu016LMlm+/tOFIeMzxWfGkgz/+1LE44AKNKdvR6RLUYsg72mHoK74NkdlpQjKPtvMziaclP9Kx9tpNNFunRRIrg1+J9yCYE5ZELkCjAQzhVlqH8dc5xhixAvRj+oU0TFIt89P83aeS1r+cPDuvcGroidpCdpdlBk7SU59yPmo30b9+k4OZDKyjRK+R/KXTWJGUEbP/FUAAAy4uASob7MORChwh7lOBBOMoQnMaMakK4tz44UaaC7NauMAmxZfYZAglZkClO7zk0/+Cve0qDufpLoV89/z3iemiGhabnmf9fTQg//7UsTnAAvlT3dHmLB5bR7utPWVvrCAouC4hPCp14X/SOJXBHDhQBn5xNqjgPvUcxey0o7oIYDAk53DsoTOMFANZvQlaZNkohaZFCoGsgqsBDt3QRiyyijB2RLAig0MY+FRBhmFiFGIBQwuq+yUxYoTsJME4EWVQYB8eeG0LVTT/S1VD1OyagDMKI0hiIxrqIUBlPVMsqFwhFOwRVCXkMkFoF8tq07Uq2k8BCLLPIIzc2sKjQKois1xHF7exiVDJwnIYD4ASE06//Wy9+E2EIgf//tSxOeADNUVbUeo09F8ny7oxZ9OFt7d9JSZmaampVierJNbfWnDbyVX788ZA+VgNJ/F45jBmCZXqFWP/oDBIAGA5gdYhJc0WyHyyPkuo3HobET8Z0Ie6ZcvWwn1DK7lFriAqRSIzagmqQ5sIZtRK3t/nOMpiYzdKyKvAXMvGA4im39K4UTeKJPan4QZqgQAAANOFVBdFI+aUhNwTCrC3xGXJje6S5wOhdV9AvhNaBB15O0QaJuzZYpDvbXCix4gHCAVqYfQAg1eqsBIkQKHGCr/+1LE4oCNoS9gZ6BxQUWQLJjzJiDWOpAr3OkjNnzQ/6qbP7Qgxew0CkSXMAOwFs4nSAcz0blIgmRApJ5ALQUDVl6HnQeALV6NNRC+7ew2rv70UKzCxHcntFkSIBItn39rKdGTa/uvkb+pHNzQWeUL9CXbEI0+uY+iCytQJJluUzADXKgehUVGzqjeqejrm2WXQkWE5cEUrK+d21KUbzM9TsO7t6Wa11ecRr/79cSEsY1rS3/ZtZPSQfE8SgBJpFqqWt8hH7/5h86lhGNfqlW/MP/7UsThAI5Q72IsvSPBQRitJPYOCFRVV9EU76GkA/anWXWEj1aqYuMSOoPzuGWJDaLUSSZLkTwdSPATS+k9Pkq2xIPIagqPd4hjKiTFnf1xtuXDEIYpyzfAKfSsjdCMClelCElbrkbZRmOIg8Dcwk9Txseabeogw1JyAyzUvVlzgNkzH95v+U//+Rf//T+noplEbotyN62MUmoBAAASKxmQg6sfbTCVSdZgPkgCEC7p+wnpIqSnrkR+UPeiH9k9XgCwxrGpUcnDpGl5vJ/BdTah//tSxN2ACjhxZuwwaUFUIG409Am80gvglaPW8XWuyTqUWEw/+XTC6STH3QBXHqWtpwxsvrSHAb/qV/USb1r//nG9vX2sIukV6UKzyAm1a00YqkUq3FYLgqRP1WdzA2GKsl5WwQZiPoZYCgs9lRTNX5PvGdya3H8dT+O3sEFwepD4+tWpKWSYhv7xo6+qBbSUq2CYsbMYjvFFk35xZqhfSczAk31bztO8F/+buyqc4LH/o/N8m7UzUGwX4qQdkXyYfWs84rUGWlU0yQBFeCsCZSz/+1LE6AAOQTlrTDFN0akwLjT0qhpuXfmop0CsRrj5drTYuQwdWgtj75hLivmssXacjpMdMsJzx6QpiDxZHKmYdoAxxKq57dxmzNHK57Gze+W1sQEe3p8Ys4x7UgTOnE7RXNff/Ocs3rQBD/3+5yEH/p9Xih//+jKn8+exE6/pL9Zc7HlYCACDAMZbZtQm2OkwjO9yi/WqvpC28mE5KCad9sJQ87URuw0t4LsOl5tnb9Q8R0OYsZg1tnDJDxjz3vw2WeTGc/OUXGVENBs6cGw0r//7UsTXgA3BJ1jssbDB4aTutPafjtS3umx9ZcBSTV015mcJVN7MZLRIZKIKNEVqnvreTgz2ct/09S3axd6UnFvf1gQEq7QtRS0HKYm4koh14GgLnXvTOxLnYTkUg70D67XlHa0lIzJsnqKNdGFJq0QJ+eSelksSQOmMG1nT69YgUQkAfoshSGwoISIqlaTDbE5rIC6hORAmcYnUUaAwDRK9sohER4ZAhANpSKybk64shciITR1PEpO1y0sep/Is7X795r9sbGTUelAQWzr0YLAY//tSxMIAD5Vna0e88fnhICsNl7YoZ2oLIaQI/zTsV3N+oAuKvk+rYGaiX0Z2aWbN0UDydLSGlEll04KlaYSieirHwulw9IXuhWeL/3nhzKNR1Iv9kluwmqy/6+h/O3UNd8XUPqkuNQgIqIi4sjeHCcITKOGhHlLcX5C6xl0xtkrrX7ek2SRX68FWkHzrE3XoTbKVW+phpNZuvnIQEwuDQJLalpWQcIFe1unSj37d2v2O+o0EGAAAD4IYVEgiN/m60LRpqXstiLcqd7pIs4iNdiP/+1LEpYMRtUtibCTTwUUQ7EWGGgl6kepbMLVzOmBJPEh4bTcIHPMf6O0wcr3E7rrfOEBDGQrZX76f3a3q+2telJ/1ETQ65X6VBFSAAghNwZFIWYULWZVHOQ298qj0TsUrtSuOP3G7FNZQE5zYZ5DU+fXkfwySCwpRqu9XtqRGtrR7dnGf6N+rKS6UH/iF0uwtkmt7PTPf3+anHXgpoyUSSm8IrDFDY3KLpZ2qjvT6jirudVPmaG4fC7KBioutGB27TDqBtndRObEYtMvZU7Kbbv/7UsSUAAnErXmHjFKxRZ7sZZWKWLoM/lQlb6L+p73fo/TJ/zPV523/9v6f1f+im2dh+WjyEqImkNsuCbfVMoquYBUgfUAmlEs5B5YXRDjPS+vDqxYuL2Nqe/zEEy6AiaWuakBovqOlXiFqJVCj+7Ht/JdsqAe1uhK/x4sYw6cTUI1Y7j4PBlCBiafyt/f+X//p//aQ1/t9TjpDanYgkglQ8LE2czVXZ6uaIMRcKdk21qlKys7a5b1aP9xfFtQkd8eb8q/IU5wdEeRrLETNfo7f//tSxKIAClT1a0wgURFtLS2o8Z5ClREV+5ACC/X/H556OkaPrwo9z27acVGrN/+pzf2/f/a93o/6f5cAIAAAQMpiMzLxaEw62oBkXQDOnzxgzsBWvI0JUteMMGpnz6JnA3N63ZrCuaYKhvYUB7GD7ZxBvNOLI3jgk+8fAFT9n/FA0OIqOmRtsmhISHKOfp/Kf7f7ejp/kwZUQAABidCsZwpdFbiQG5bbhTJyR6EvaWQKtWPucWZrg7bXmv3yj3Xo0//+X/guf8/+Nx0og0ZyY6L/+1LEqQAL6YlxRhxXUXMxLij0Hs6yansYYFS11P5hn0P//vHG//5/8xGRpk/M7ueZ5UDlPdUDIAAAAG7QCFpxMeYeqnaw44PIyNtYnE/NtTjNRAm+S+I4QgGJ6xM0QoiIKNxX1Tc6BuY75ZxPvUhEYczAfvzTf/0w21cfC0mkYgDiYm4Ljn+6MHjwJQ5aU9X2JBgwfoc5QFxaiCmifRoOUBGNo5TbK8Sxc8tb1hDTNDo4nMhIVqVuqLfdw8DstxPL2jpylLvR7dQcsztb1zFL+//7UsSpAAuBBWFMPOfBabDtaPYcOlDb7o+RHXGxWdXkVp/oByZAApJygJzhARmTImmZKXEMVJ4XRzqomSocI3lpBZt9KDWz9z/kGaxqm3c2vBoGES3BMYLLCQmfvWz3vIZog9bJNSsFmHanjjzgrOilWWAQAAHKAPEJAF+SonaWHJxOaG7nII0szMjuPO+Z5rxFA1mmer56jICAdtibQ/KREytsTiC4ZvRjCHR7v7julCq3o7zH1EOg0KPMXKFjy2ntGxOLKk/36ISbTlL4+qnQ//tSxKuBC3jVaUwkZ8E1Fu1U9g24SOD4WgJHwqI2R7iPCrYYym7mmqYNq7oY/NtzRNe4kHJpLPMNK5X/2EA94gRoj0gYJx9qqlSSIofT6jHpHsUoeyV8rqXx3EwBoqgpuS8IwYiQtGPB3oDISdrZVjUF9ZCFEdZ6B6zsP7Dq52ExEWcUN7quS6/jAJRH3c/7SOA1QsHxwkuPjouDb1cq/9+hQ+MUFmCwnEssEghRAACadoMQpReMyZTR4JdTKs5Xsg0o8GGsYYbcSRIw7ud9+7//+1LEtQAJ8HF3RjzKUUqWrRz0ipCydo4HqmwmRbucD0fe7y/ZDD99iWnb0f1UVvb/QeGjFkFhVyg+8enQnxQWBBNFwooEoopwEOPQmZIku8M7Yka0ZDlRVxHczQyhPWSGttD0E6LSepyH2qNe54yYvj9X4REnoyp0Yw/7/Ts9U5HAHav2yjn1lWWJMY/DjqWgAEAaHxhjeRBblwQiKJZjPJwN50oOeUDKJ25LspOZA56o8LVl5nVtLNWRhm2cbduq/X8Q+QBbWkHdUE3/T1EvRv/7UsTBgAo8tYFGIM/xQJTu6MGh6vRyCpv/nJSWv2Of7+iiI6RWmt5sBAAt4N4WEeppF81gM4oR9P0bZmCELSXJmZMLidxrLc0qTQn2i6QlrJdwfxWWYpfuYQefwfstqAWfTf5VutW9T2rXXQ5C59P9EInnr5zX/0oAAFu1JRdpoEGFZY75Y25bS2SRaV9UnRdlkCYVUlIxEcXRcWe9jmC8O71FmcU0TF/xtlVk/kjUWMO0AZYrj4t+z/KkGRXq3xxM5q21UlVcOFknNmo6I0FP//tSxM6ACij7b0eU7tFOny8084n+8uifWXDuyVLeHQP9MsAgBjGADnJgW0t5nsK6P0gYQUFZSNk8sRgmkyNptwEzGE7FB8w9TGW0nunZxCH1VkyjoI7VJxAr3s7ONk6BeH8pwitEouw3JOt9bjSy7ADnDFyjYkLosh719GSY6AQEwwPm00CMozq8kB9CiRgYH0Bklr3jR5G23/f9WpBJNEzUk+YtEVSmBGo6f2/VPJtu3/JoAEAAAFNwSEIsk82bKJPmiUdz0C4XUUrHjRFvZaD/+1LE2gAJ+TFxR7Cu0T+fLBj0nhp3Y0kg/rGsb4xTC4uHFRQeG1iFcKA1qflRwqxg/wIaTSP65JUbUbducGVkW6UKW963f/akxBAEgBEhS7DqVhzHd8axOsYCRCDxZYTD7cTkCOFtkynXXd2/Xo7kcwYPKr/zsvbAba3R7s9T9U/qkMvd/WQrAjBDBDQ6VU9/GEO99qdyqGJvac+qeYAAgBC24ZlEPhH4qkaSUc2GgB5fKRPuJi+kJ+Lc0z7f565VqwYyklmth1Y83WWmiOXRG//7UsToA4uQ31xsMPECZSxsDPWlwXEAOmhcUfL4qGgkExglEZEeFlViketzlfN7d38lt9N1wqKqI5LEWfyqWGEonI/jiZ455VsTzsevayeZ6/RyZKPkKmb6jt3LvQTPa39Z7Kzud71YfAce3b6v6dUPZ0OdTVorOfnV8ca/3/a5/1dCywjd8jXIAACAAq7nZ2pxBH6ux3OaSQ/R6xy/O1c1QkZuV1eCfUkZt1Kb1t1thczWrPNredYdVOYrl95UUhK8i8pW9a6AI6ZviAkOE9Tt//tSxMsACjhRa0Y8xUFQGa30wYsAPEUj2VqLxIMY5Gj7TT3q3/tNfsWVARAEpN0vzls8jsO1FKkmRLFcmT6mdB+x4V2WGBv50yAqygqD04zvGolc8AW0R47z0GkCHkeQUYlTL8js0IAH7v8BF+3U4b/5hYn+7//UUd33TkhWEzBOp+ffZkG+YRCUSW5SEyDhLkyp0SNUpJQOK6TUW4EPPC/S2YG7R2BvzcgxrfsfjY7Cby3dJ80IA19EXjW/bqR/+jm9PGottETjfxb4Ci2SHDP/+1LE1gAKXJVrRiSvAU4ermT0nbam5wu7KO9RAAAA05U+h56txyIsO9LHyRDwgQLdcRmV+cgdVz5YoWEp1Jp/FrsqY0nVKjWE0/Nton+2YtKUHOFRKpvwTsFZvO71ECydV7hATerd2J6d8X/0W2/dkUHKdRZslQn8kiBwAAACUnQxusijbgGo0spYXA3wRUdgQLjHCxi2QK0ALSyuwCzqYfzsd8YEWbPwELfkxYo7PDIU58/MTYlOZOjjiHdnMAJ4hhRDsIc+J2nXivRcEAgQMf/7UsTggAuQ92NHtLgBdSUs6PQVukAGRoHMq2nvAAnuYQjiaCN8q+cLc8tKaI8RHCBQNEIOLp8RR0AGA/cpSQJCLuKdFLgyFYhh/KVF+yZOxg7ahcV+fhiDzI2+IU0cqXVFpPW/H2UQ4sPqQFyYnCxwBrNnwuwDhuGGCwIapsT1cU/6qgQkuWRr982bRABgwgDEUrfde8w3OPoZrdsytxUt5AHyeEnIlw/EtGdrYQGWXQTAjsuKdnzGkJ3SDMhJEV1iJa+7MRyUiqMQkWY4KA1k//tSxOGACjT3bUeYrZF4JSuc9Yoo4VplWNa/6uF3i2cdwS0m2YUNQ6YVUhxzHHd7/z2xBCYBTcJYu5bC5nQ+PlHhSihfF0ZDJTZUufMs7gz1+eAwt4WSIES03wf2i8+TdsWsRHK1TAlKqAIGz2icHrUBw4wMP04oMO1FiDwuVW5J6hvVJaNDbIAJJKh+MRYWZApU+T7KlaJGoKD3LWG1SpFYfIlpK6VmKDU/IpVu9iNTz2Lt//CwywRPUBjxxIpBNZhSxUFY5aeuiUxbf2kJF97/+1LE54APwYthR6RxAUAOLaj0iaDvLGb6y1nUBBFyflOdqJJOnTsVaJKbJ5zKJKQ0PgjmLeSM33lv0gaWmH7Z3k9i6OVOUydVb5Gc9aNmzoxmulI5GLazGr73yztsrgLjEIPUTiyG4sZYSiznzK7UiEWcDgnZ7jSFqimAFNJ3lsAjRaxjkRqebWtLTJS42d5Vbcj4cbYYOxVEOUiHyMuFeIpi+l4d5zyNs0Ic6seGFXsUgbOjF1Pabz7+aFFktbmazQCDSwysioeyhipQWa5KHP/7UsTegIxg4WisMQ2JQ41uKPSZkLWksnUBgAAABJTxMZab9PalW3By2WwBTcO9BoRmSMcGTYMMvC0ydoHX7Y7NYkJqGHUqlrP/qK/+EZTgCCPhQ2c+qkPPDmGLNkkVqLnd/SDzkn96kMHgI0RQItvliUq4sz83XQAIASAQEk7uQlKDUOcXBVmaxpFGKhVQHokhaQp4z6Fxp5Ljm4g8RVZwjPRpHpyGORChgGFPu5aWV69SUd1aky00lS3VdV9rs1RiDwaIrgYUeNnQMoqWHPey//tSxOKACiiVf6ekavF/n69k8wnui197nIUb1AKEIECkm5kNA4TuItInKOuEfXOWCc7KvIiMNFmOQZbKejLL7atsXXeFB84WFsk+cwquSCsCwkyocmlIkRLs4hylKH/1dytN7NOl/M0/UwQoHUhC+xRMngEXo9np5C/OqgBCARISTcfhynGpRito0EevqiCdUcvscRIidHgxyrGu1T11eWI1Ue1wOfu68MjMqovqoN344hzA6IvWwl22R+ltv7q51rq3wZooYaKSS0ocivXq87L/+1LE54ALZItw7DxhwXoWbWmGDPhZlgABCu6AsWKXqTCARk/B2zyOmzeBy9MkJBYR6WZNOus/6QMGh6C6atU6uTmlp+8VGcO1t3VoVjZLY4ogLRqqYDNKz3cltv9OnpPpq/17tGC0gGzqCqz44HgkOK/b9z9pz10AgpKUlctJGhaqIMSUWZq+jfLrQrjDruoCxKaBmYBHq90ewYr5i4S1r/jB/YdZLuyS1aTFrbD7J4mZaJM0xAVVjDK2TntmXS9WVvq3an/d9/0KGCidxtdxq//7UsTogAv8+2+nsElBfR7t6PWN4ifKv7Eo29lgDBKgABYj4/z9aTuRbskpPEOSJYHqJs9JpAW6I+JIeLMRWkGdwPSat7Ckp3ls8ZE/C1eq0e2QIjnYbQhKvN6W2tLU9YneOJDo121/2i2xTgEfQTCBAgTrnya/sfQqBAAc3AmHHKPqWMra4tN+W4KeZC95iDhmBUmmhp7bZZLetxqDmrjB22tC071EY0jgcVGODM1SFFPQwVz1fV9kqaO7P1O6afPFiMXOmMmlkHqIgMfoc4sm//tSxOaACuT3b0ekTVGCHuxNhYoo5n1h//5hw1O1AEglOlGpCcKdWJ4wZ3hSKdYfmchokLknzD4SS5dlPLEnlFclnQdHqotkahVa8mxGTesGIEd0eoRwih6kB9wIvKj5IINGICWsCE6TzagpvDwcraC9IvKO9MEVNI6qEkASinKCNENCdQo0ydnKhynOl8haiOdCZUFWekZEKx/Flq5y4xBqIJULM9t+OdpQLJ9h+C1UqYWR3HRWGVr9FW1Pme/uWzsS46oOP6MhvFgNb3WRbg//+1LE6IAMFSNmbCTtkXIaLeTzFibv+wUABJLToMWu0WM5LQHEUDZMQwNpB6PRBeL5giYq6ZmqrZUH40vYkot+tzcFlU1I/eg42TPR0otXmAdtraX+JIE7/3PuVf1ur/Tb9onqnkl3upKWDOd3e3D1Z7/LRbixJvrD9lUXYJKTVoNosAkzMS40DINuOljoVqoNiO2oCLrFVK42csJBz3DxhV/ByVyA3eHn+gEdMgPvGArPmurIFyzc3sKH5y+Od13lDl483Of/3/69bHakRk1CAv/7UsTngAusx2JsMEuBfJXu6PMJpgHPEWws3FYUet66gEAAEkuD0ExgeVOFKktmno66onWGg9J5+elomvOSuLiSN2gmDeqHPDlH+yy/N8aOJ0Ah0FQSPsWOZqtvPesFQz5fniBPfWT/8inObq//v/1+c/KPry33Qz9digQFtKJTTlBrm+KetFELidy5KZ6imeAVcFqOOCoVGvoepHBmU56KCRtpMjm3F5Cj6ehQHfu9EenX0CTkaKkP1ajIW6gaW5gqspUoGT1c4n0Ej0+M+V9X//tQxOcACwjbaueM9NGLnKzdhizqf/Ue5n1fx0/iYMxNqratmcVYpQYuQBTVpIBIKg9CrLWNDTiuHyhyhLD5oUm+E0I9KhC2uuksHI/2gT353/YzBrOduo/1ZO2iGLwv3HdwmKv31mb/Qnr69a+VW6/N2R30FanVbnDG3VrunutlwtUAwAAAAUZTm8akICSxgjJ2qtlh+sBhorEgtvruE7jMekjkDDJqcO3u/Xf9i232prcZYzdAzMlm2OfZlqc6nep6EIQKjSN+2e68H/yiHf/7UsTmgAwpM2rnjPTRaKYsHYYdOv2UJgg0+xTLqYerteJw/EZ+cqAgFQ1g6rMzGWl+xQdKw9vIASmdSVdgV+nJpF9tAX2u44ORPDoBIGg/CE7Jh8d1jIRcHMQDFcZ0UnuUP7fLC05/bfRq9Gz2+mBplEiiN0pO4QEgoYny+/5IVJI+bvS/9A+NnUa6YeECSvlT4W+ZGB6FBQ0JOEZuVLNQ8EJzfz8kjvAFH3v+1QX7NEyiim3KxjpLf36KN1cMp6IS0F8VysBbEOkmkkXa2SO8//tSxOaADXUxaUek9JFfJm5o9JU+mE1goXhic+mOGJYu+FM5z/+dXR3jYO511aCfJr9IvOHkfF6XzEDg+5JFhBjk38otInAcyKHjaGzYkBiB0uXh9i0lSa2woExNpVcB8sDkD4sJJfO0gGzwrMnA/qnfq7DWc7ovr5IZPIndEsNJsjs7RO05ENFuokhZLGIxhy9lOIL7evejoQml+roQ1IJND8YUVi61CgFInoA0PI/R+DNP1Ju0+LHoKnWQksRWPOPMswCO4yBiwVJGd5eGd5X/+1LE4oCL8NtjTDBJwhcr7BmGDik0cqYzd/vznbX/bKhyIYjcBTc4lq1TSG7a5929Orrx/XRv1RC6r7xBAACQpwApExcDSUp4G4ikNWYJvMrGDA2SMJEkVEKimujgWk1jCGuiPFp+4bvnLLWqGuYmvlDwsYBgTTJn7VbgAu5Z/uaDOznp1V7ee23kq3qWavYwSw0qKogACioeYcggSJQxHKhDl9oOVuYmiOmsUnh7KXappLi08NyjekjdLJnle97eeRHwqwqlbZOJEjlCMNHIFf/7UsTNgAyM532nmG0hRJIwNMCKlM90w8u3Tvat79Fkdrw76iFsRKETmJugokgFc4VaqzzPMw0m4mMr0OQC2Ouj8wLg+aTHoAIeg+oBNzSzEN+NSQNNkolIV/ulUVV8lFt32pLdFpHyZk0gco5UWlT70ebjdHbvuv6qJ2RBkkFKYIGEqOAyELMtIHAr0NOJVQ0YtnBJDHSAg1dq0eW3xgGrLr9GVJhZw0Op+hOSQvE1Z/+Fa3WHiWEn8TVLTFHuGUsaduOeMOxCBxZgMtDoqKtW//tSxNCACfiTbqekykFdkm1Y9J2wRKjSYdHuiU4BAAJTqtgGYrCo4+8GRlmUORVGicB+qEAtlaxQy4qrG1KtmmFbLU9De/+q/2+46K9h0w56IYpS3PoZN1Jacz6t3dk0P07qV8z/XOi5h0UPTkKzoeSA6gp79YvQzrogBBKScoh2Bgv0wpprqQ8z97nCdWjbrP1wWxN2jeJmcEVcW2lXJ4wx8yzfWpwI9zF2SsdhCVXwbn7QiHq9gcqefSXGqGPRF3KS+NNlDLwVIDRRkqxcFwr/+1LE2oAKaI9u55huwTkY7QT0jdgbQlNu3sZ+gkAECACU7hhhEZS912Ks1ZpOw+yYiPOPi9+QAcVZQCDLyJ30zzkFqRKb/MuaV8DomobWJh0pmZ0RpSu0G6Oinql6b+vo61krR/dVT7ohOlNOqlBhgcMjlj6ymPLOWv9tCACBEkFu8LWZCWM9ZOUy1cjTnFiaU4gsnFB6Fi86HIzT4B8oj5il4ChWKgLRE1ctBZVsxtln5+NbqzHZWy0pqiX1RRO4SPGiiVCwbSYVYrgc6Q8dKv/7UsTngAvIkW9HpG7BdSCtHYYJcFskSTU3c3vkwACwkMjTFkXY3tsiyUJ7cytDmlUEYlIQUQDE/HM+Ogh5gsUfyr3La9eCrq95+/w7t60W6zwMzFMw8xmIxxatSQGe7acapi7eVu+t5E/HWzqCsDK4gETIxLpO6nct5FUgIAAKcoxAVaVSZezQJaxHgjBWXgmHSIS2FsS0WHySbHxZ9/lnzGyy9jew1vF6MS4wGqhSkYg9NaFGhtCdQ5XF2DJ2GnCSjPKdfBxgfKMCSFg2I1HD//tSxOeAC9C7auwkbUF8pS1phImoSj8xrY1Bz6inMRjSKfR4IfYq1qAiEUWULkrVXVyIDIui0bt2jhKappwbegf9YjxowWdFsXt95aSTfZ37274XTnU+/Bf8Mt9iViEEDAnLOPFefbF3CNvLKCVxus5EZab6yf/1KnsrrBJJBUExNRjDuNY0TVLai8nJsjMeAn1yh1YapeolGBVDEedM9Mo0smL2+S+OprUxPjrDIQRMpVsDT7Uf/CfETRB6HA6pPngPcYLOmTJsixIaFViOau7/+1LE5oALqNttR5ivAXggrImGCbD9ZNI9Whb1gBAIALnDFRbblMwoHGwTMkK4ZpZMH1IAmZDZgLiGEWxo+11H8msPNN2tox0k+wNCviOOF5eosaFd5+8b90ZH/WC3I883lZfTdEka2ivVrzlJu9wTP0fputh5jpP9dRIAAAl3geSTHEvmopkITgOY/kLazdNteP1eWfGOmGcmak3ZiFeAMfU3sQajZ3EaCj3taFahOHE0dSqjvsL+ViSorPdfbW9rfVNbKrM3I6q1vQKxtEKtPf/7UsTmgIuYqWjnsKnBbZUszYYZkM7MCNrzfbSVmyoJKKToh8ImhAzgLmsEBIDQeRBmRcwVlSOigySNWk9ETyLNh4DDMGSNaYG2YCtJEWuEMqeY4UdSrWQTYCTLqmlm0HmBlQmchrrU416b/UitSOnh0sYeJz9sS/0qAzAAAAhOcYMkLDDhr3iL+NwFDQCP5RgGSEMUp9jbJnBsxov6XHKyVP7V/W1duJCIQEE6LaHGd5budldbIIzO7ZrOVmt3vZeqFVLfZ2smqpf+nvCNH9Kq//tSxOgAC+TDe0eNELF1JSzdhAn4es83YTBRpIABJu8ISLUGAaBLDwOBQgxz8STKrzziMyZeqomRiWRG5qo3jdzSUt9HTNz94Zh3jPmUFHkmZP7TyRz6LcKiQzcG0KF1nWg4GES5lZwQHBYMS7Gku4kxj7hWFtjym4Ug5QQAAAF3kpCkzAWbKaQy9eRcF6SYaF4r603AOaBrp8B8rjqIyuh8wy+6uHA3PgaVBhMPhz6jTllE4dj6K7Zh+tu3cFnFlEauN3Ine6ZNKLp/NesKNZ//+1LE54ALxSlm55hQwXUUbej2DVptN9bfH77IERHKa1wUWlm4zFsWU9/nkHrGcCNLEAbfNY0acaDAEOGSUoULONECSgcDAgMGNhNBO3DqeIU7rm47pKSTTlRaUJciinQ0bNjQbC7GD8wjJHuypOmMl3+tUskncqELAcaQUWJiNQum0YYGT14qFjBtKAZPVgL+oB7PzSAMSH9Au0gO+IwDPjblIRHJgABASdxvg6R0JQYLYYDanhSgpD18hRAEktCyQOPVhToj7xBBVkTXfW3c6f/7UsTngAtxL2VMMEnBiJPs6PSN4EbqSwOTm4lWsLhhCrgvEB8KFXrrLi9z1vZhdn/FPbYNaXQrc7BNCEIAACmpR8ElJjQmTUdx9C6aUipoh8VigotbnllGElIutBKRAnavT825X0KQyOn//2dUk4FjoxDkmCUikrGnIw0kwMU1z+psUaKCsfi5JVbEmexNShECCNhpJsLJaD5QptRpZENiFqlGzh2nIJESqOL/dFKNdf3n3byyYOUi4Edl1I90/p21CiB8XBWbddvWtVwlidAs//tSxOaAEmGDZuwwyYE+CnBo9JiaqaPooVNCYI7EsODWEyAwSJ64AAApXgjBwhqD4Kg0V9OCuk0RRHQjPE6NDM4FtAlCLBrMGVXDL3EOSz6h/rttPgMRRU60qB2DM41YiNSJ5j7Doszkwp/DdCZ1TUJ64XWLmE6XQ/UzAJJScqiJuKlAj/LopkQqU23Ie/JyzJFBUArC7KzLYf/y8bNN11Mp0qB0Wjr71nYR2CIpoZWmtRH4x+O+3cFkITlPtNFYfdHpuHP+sN7/e+TB6bs+9v//+1LE0wAKeGdzp7DIQVKSrijzDhD//jExr3Lm5LRU2wMCBBCTdwbBaiPho1uPxxVZTwycbPaAnFE0o2C8wDzaRgrTcLym5WM8XssIqM1D/4+4I9A7WqV3d2onipJ6gzB4s3G0I2GbxyRdjQP0POFZR9/ckMCSUnKH6ahGVQpjnG4cxcDmTJfYJzsp7Ybyxx0jUzZ2+vRdvPa5LSuLXHWPUZnNTZ2e0GRTh7ZNTmI8/X2dio6KdRjbvdaZO7NaXJa6mMiZWbSJ1CDQ7DmmINMWlf/7UsTcggpQjWzHsGtBS5BtnPYNUB8bFjoy1QsWPf1IgASQClJwW9QFKmz9MQnzYShUSjijl9nOzPU07NdwR71WgYTW1DQV9r2wfdkBKcMvcFSNn9R1KySjGTCP7G7/+h16V0WK+VVOZ3/0w1b/1aVe9Pch2lu0elZqEQQAU3u1jxVZKlsvivJApwtrC9hFVMDy2o6pW7DQZsOqSj/XymZJz2MOGzcVa/vW+dlDBkNKMljfAeYPOtmfKcpT9hDw6ZmpEZLxbK3PLQvPJ+T8/kz+//tSxOeADECncOeYr1lLlO3o8wogZdEY5NcX2rUhxX6SIggAx7iABygNyTTyHEbQo/SsQ01rlvjoprUaloTjaSjxqkAi0Ijt8H5EHtWEGIHSPfCBZaZh7DOQI/kc+T735Pg537niJVDn4eFYufSBU3U8eefgyj2tdQQAAApOACYkQMRDCboIlo6ibmyp0MhomrW2nmr240ko2L7NlsaLWf5xBqk5vGDJH+KizdU1lXIq0dxDME+Mp9VYzHo0aJSumxnshlKUrqzI9nsyEvIrbv3/+1LE6wANDS9u55hS0WeSrWjzDlEZWd+IwVpOtt+++tlw14amgQQQXXJdYEhGiydyxQ8SzIfC2vK3nPBnslWf2O/IFd/GIhByOcFKaiI+5qmQ5WjWK5MDO6Wf7jV1ddRRX+m9f9/Z7pbGnmeuGBr1MFWqkwMdlgu8KEXhRQr66FQFWJRKc2J0PsharMt0O50Kx4GFNLJaFBdnip8Et1cV3NhWqodMozNRSZFEqE0QqmgjNjdf8H2f95arJ9dnX+zUG5HodOvOlih1CLRwHBkg4f/7UsTngAxRKWbnsG2BYJltHPMOUHjpkcu6Vu35IyDEAAqTcE6SgXFoTxQEKC5XQ+lk8ksZaoqUCP/gO+kL19cCy7OwxXQUJItyWovvVJdyf61q9rHjBWZtw25Ed2Z6JFF3s2t1F9BMSGyUFGGDwlLtG2dblnShYLJNOUtVFra1FYgUElJuVHogYpNyxs5MSargsiHtkI6UPyuHO3Bs48pHcEa08lmJWXqp6O4zPnkeZyw1mfAR1RayPkQBQSR65Og6OptqJir3/orPmb//RFGr//tSxOgADLEnZueYtJF2IC8phhS+zy9fk+Sp/yoqsLAAAAqPDtFKQ6xZmCyESPSS5Qqwvz562Obng4e22m7CX/EV2RY0PPfsZ0ljE13uOY13gbXUdhMlLVxGneQeherTs0JPI8juias39WZAt9DIj9u6X5hEh8LxZOFl1pFkOtOXI/a1ahAgAJJOowcIbSJQZoG+kp1CFhIr196xrhHOqIdi7NgwATcVHnwbVJbUdUXo67d8j/60n/UFZrxMsZ3u9lUc60yyl3YdD9iHT+zJ6X7/+1LE5IALTSd1R6RHkYSZbJz2FegMzW/6t/Uf/9RRdSdSH/0GwIBSTlMIzhwOKrL8WB8zqQK1tOpdPrMCyLBLATBs5/5xZKkmhj0dzMU62bo8QZ2OvlC3KUsqnVmIKgjmMpHoZVxZyI1vStPfpKZnaz/2/ZRYG0bqo7jHvu/66gkEAABJTlPw+0wOlIneLIfS21FPCyl32tM+sNzzrKLEP98ep/Xe8JAiEXsIEK9O9nlH+SIiIXIT9aqvZPyaZGJyEKrj+10yPZr8WoDFzd5PiP/7UsTkgAsdKW9HoE8RniUt6PQWpjgCD4nBTLgQYuERqosALIBTkKc3xc5UMWZ0o5H+eUc90aLmsC5EgRHRtGoFowis0ku2nTpJM1M/NmbCK2dMtjRMkuzZ5z806SFmZ2r/9/iRHOXjv5G4xEZoZIRZoAUn8k02iu1xHRej0W7wRAQQkAA7OwkOGAChxLCIIpGQGOEJVbBnlSgAAN5Bcwic98ZU6ArAecmY8KGC2w3AYkq5RGpYcIabUF4sJ0S2qM8SWso3bTgLMnVNXqr5dfHK//tSxOIAC20naOegUdFrpO1c8xWifC7QHS5wHCiePzsMPkzCiyXEWtoE0PD3s3vUlZpYPigoZjw4kgXYOcEFrRSpYdWplGuLSgiHm9fWtEIRJZA6cJqkRnHFcGydc0uCRGpBV+6i6j9/kbnLfs96ynV4v+DalegxwGQaaF2Ic/fU/Vd54s001nVvUcxIGHbtTqN/UkU79FAUkkSYPg5CgmkU7HISTUSi2ZrYiKIPCE8TFhHdsXm+1LnlOmuuNWsPLyjQPW8kPh7kfMYyrUdKvcX/+1LE5ICLxSVvR4xRkdkxLmj0jaMmUSW7T3bGP+61SKmt4VKHRYC2nIs5W7LBCIQAAtlSSmqJEsdz1bHmvHUY6viG6fb+6hWujVg5CHRyhpmA12KxYrKE7ENhPtnd2kIqVa7CKiJXLJ7y7ma6I7oH2FnkzFU0w+lohmbqtbkWXV7qlSgCABQCUZRyBEHUQU0yQH8ojQXbooHw6L1434djpyK5WM4msm5fEG03voKTZ095Gmh65fpQcXFQyIkFDta2EFKNNFVTxZXc6eqQsFE/Ov/7UsTYAYwMj27MMMXBWRPtlYSN6O3Klji53k1MpCikaDVTbKSr0yVGXeIQlvKVnNxC2s8BTxOqqf5C272z4nTeUQ9MjBnMT3zDU/ZprqPqpWqZu+2vAaXUyokUDtyzqKYHCgxCbmWXjHns49fX7Eq2caNKjKxKunXvDqZrLTLUbcxb0MZxpI85UWsdWmVDGQCljCEGD/WRG6cZjYyP3lNpzPdJ6pTBps5lSMmPt9n8OKdoRDExJYMWWcQ9vzRsc+3//NcRNtYD6VjFvFNY8TRp//tSxNqACqybfaYYbSFWEq3lh5Q41NFKNDUOIKW9QzslIJKObjp0W51dLlN+Qy0JIKiQWV4gHj9Dx6ohJE0tL3+ZGXjCUXRcExwY1f8J+FuET3Ne6L8e75fRTRKd3ov7Y18i0+cFycTSj1rNqah4NIBK669wuEHG3ulUIR/qVVVFyYj/Z02ch1ErIov+yYq1oFhMSwLN2Ibd/s75/e+6Lk+ZtXJvxr59HoZkQds9zSCwKZyvETM9rIa/XVtnXu7x6psZ6iDSySpEYsih5kNlkNX/+1LE4wAK2Htqx7DMgXETbzT0jXx4xAtcH2MFHvZSEjCAAgCS3LwGYAiUQuhwoBJE4BEnhWXzUgsILyCvkem75zRhqwfp6k5Cqm6YI8tX+SMMIpJwdrE6B45KQ2gmMH1UjH5ZaEPeZm2LVudYLBAAhRQxVdXOG1V30pT6VSIEAhJ3Agj1KwzkCvIBYKRQmERGOBYMyxCpROCgsPbp/FaVUpU8QjSHVOtDaBb0RRB8aZf6Uimf3zEXhmVspOS+ev5dKU5n/f/P8i//Jz7PpQdhqf/7UsTngAwM6XmnpGthdZSuKYYMuIHYaSo7TKWfLCJ4ESQCC8BUL0Zo/TzQhpUEtLgSDZtv6KCBdQR7AuR9yKKNEMEnqlJQyPMcwo0uo1KGKNut6JdOgEPmiQfDhBxRGJwPv3GQqVO6HMWVVI4qsExNNKzyzuh6ShxCH1IAIALadAIyIY/JaLcqTHOoTBlKa6JncFYuIu45PHF7WIinHUV399HEW7RHFodB1zW9VdEMjnx930DgVqUNMaEtIlYyZ3ZkVqdl7rLtR/c6Gnq19nQy//tSxOaAC9zzeyekq7F1ji209gz47UxhBp61bBegEpNygT7pHq8yHM51eczGyNqlOdzb16Glh/K1qO2v5m5jn+qRJyPuXvru6nuPODA6i9XOluILJaRq7xOi93MjlazPs+ZGl7SzyrNtwtj/4uLMEwhD+bDdV9pqjePqUiCQUnuYJzESZReXEuewVTuwrmy7EDTtuVNTw+liKSXClFJE0fsWsJu5dkdNZaFTz9bqt5taHNCgaUQCIAJBwMiqiSg4eqktQZ1FD7FBwdFqcvFhU/D/+1LE5gALnStq7DBlwXcRremEFbQUc8j51uhWdIAAAAAFvcElXFF2sr3Ys7bXkMI6uN5yALk6RsM0dCa5GZzEo+JqhcBQMQuw3FiruRV6SnH3hn1icIH55T0FQfCJWppxrg6hsoWYsBiWfRM3GmlqT4EBJAQNUGK/QjeMFRYIgkpOUNQXseKrWTKW5UdHMxnYU/l6YbPMhFCxi4ETCh5dKYtLXWiuME2MiVXVtFRqDu1Nu2o7qVLFF6lpM0vrz+rLawRIaMsHBqWeIGgGZJJGoP/7UsTmgAuBI2rnoFUBeSTuXPQN+sSOlFyu5Q3UpgAgpS8VgsZzmWJCvxFnkS1irQLzswJKotBdPjqBaxq8G4tFi4ageagz+/dBcmu2lZ5VkxTVN2DUqzIj7MYpBudSutPTv9mOcz3lcj6GjIKInb9gsoW4co9Nj39bUV0AIAABUpY6EpFD3mTnRYh6IjBUDrToGyO9whD4VejA550zgnY1Iib/cIcQpNJL6rakbPwtNd1XGMnzXi6Tt8M767BWLTaWmaSVCKa9nuldGo/Lty3t//tSxOcAC7iLaOwY8QF9EW0phg1gStH/qJkEX/ziAAxCAEASUnctcJQns/C/lwsDgFE+XPNCngeOoSYAnA4Dq7TLuCykIYogHKY9dnF3xIU2myIRnkgpLZEu2ewwKOHLBAut556Gm5bQaugdgUCD1tn0olxh9S06vl7OpRUAABAvgFJIkMO9IwBisw/iGspOCUPB4ZmqwzuyFi5ef+wfmClDM7Za+9Q4YXvmB4TA6HEvjoheXIIqEMiufiDJLFxcfPuAQsWWCBAUPx0l+8n2jtT/+1LE5oALnPtxR6BO0XsgbR2DFiCVBn+4vPmil2pL4cR5QveQlzJESIaQMvHegGO1CAQSnSQrIl7Rp3Jh7p1mWRYgA4KMiJQVGtXlbKFWTOBdyZOkBA11Y/lL1BsAkY8aqc/6fzXOim13IMfNT67Cgpt/7ej7cz6n+yFXmSS6VRYqZJKZcmMESxyk1OpRwkLMOp2zrhlo6u+cLPOEASqZneueSx2GoqHfZ5oDO1/aQxA6s7kYMV97/+kgwkBBQeyu+suKvK3vIgC1awqj9ZjsYv/7UsTmgAvJK2LspE3BdRLs9YMNqNL3PCqgSzY02QUQC6XQuBSJc7jiNxWD0PW4kbGT1gUTGh6fnW9Q4s71vg6b62gwtSSnk0DQzbIsoGFoEOI6SSGrYVW6RJp9m8yRTEde+y/7I66EqRuiexFUhhpLuti55bM6p9dV2LYSDXQqASQAAEgu8vUcgbOWCJQkweLcBYKjfKWu5YmcZXKGtW5DoCbR+6vo+JRV5TIgbVeoY6P1ynvTn5TPJ9bydDNKkH5dNG8WIiAZMSox/xcd2yr2//tSxOaADdDXZuwxCcFDGS5phI0iGwID4z10G37tb53qEhgYAEEqUUcjxB0LlLS2lSxSmHSKsNgxukXOjaFdx8x8BsXT3Xs6/DEsVOHUM3pZ4MXBYZQYFjFymU1pStwncExOWFHJ79RGIfF38GAsKJQYShQbDTaiZx1DOBeiKypYklJOUl4wQaY5jmIIAGE4aSvVBqSF6Vcah/RbOuzA89RuOFymwFY/lS3cSzcb2/PLhVHJ3rYctrnGI4RFCQJNOmDgo0WYPKgpN0FDQFrY8ir/+1LE5IAKsMl1R4jR0ZauLvTxiqY8yUb7qUCyAABJUEAgHfRWXa8Kei0XYSHjRGKiwI4CU2qAQXy28lDF+F6tLflreaFyhejtjAYBGGDOlBR5VgjZaW61IAZc8qCyLRjSj7wbYQGOEZZTgggAgvYKFqmGOtYiMAYM+NyxtXS3ydURAgAQCVLzDhB40ZeolCCBFUOqlMqBdO0XXzIBsy8cs1sGtOLEChx4ZqKoy03aof5WZg4Rf7HeUFppSlhl8JhnMgaofrPDIwmdcCQspoNCRv/7UsTkgAugx2NMmFFBcw9tKYYNKsKV6F0M/t6wI5YAAAJcEsiZ1qtMa+ulSTWnCsu2wBIxmzvKdQ/FSssSrXoBXRcr03964oy8yYzW2Fyh8PdnPZHiAaouzo5nnZCOT9u1d2ef1vnOy9iffQr13+vtNCpeZEGQ+5ZHU9wD39IAQJEkgAAt4AAs/BG3I0CeHY6N+rprRaPfNz9TDE6vvIy5fixzmqDWis/6cBOzn3K5u4uJqny9UZXT9ir0YjUxq3ARZFyUqj7Gb1MkhIWZIBgI//tSxOWACxTBb0ewZdGZGKvdlg0yaa6B0gp8a5PwBQpci7mhKYN0Dh4+EoEHnBAOy6PKgvWC4fLrzPps6yxg4JLnNw0kuqxFhqkixP2bIfqlDc3e1vuRZrPe5zVM1414zM7rzKNrLZQqokxbEHCAq0+9fODAOZCqn+2uKHPHX0oqABwAAAAOcx3glUOEctp6VY9qA+scVH59l4nogHK161Yy2Sl5vvCva61ndmKQJoI2vQsDA0Ck0nwC4DNYGcRpCx00r3f4SMi5FyCTUpTUDBL/+1LE5AAK8MNjTLBjwYmnbCmDClqxnv7On1hOOOJtIoklU3HRVsAMIfQsbGetVUdxyVYTsWohqTVyerqrKUVnamxBOWXUlanYLO2zrblBUn+9lIrWfaYxtPhLo28LPhalT4JNGmhpQmVKsI3iTcLL61DnMaFUiyzQ6gTyTcSoFAAACnQCrDUx40Fo2qVAidB06SUQVKUNJZOFbC5kgv5QliM+4rVt+ixKih4ZCpLi65LId9NenjY9b3i4uYLAw/NhPrEcfnhYcg1vTpGK62uWbv/7UsTlAIqQx2WnjFMBoxsrnZYY6KESQwpzgoCLg2fNKX0h6+rEmV2KZz3diseiVqAGBcq6mWh0sZPZ0sA3UkTDVzNs1kCCAuKDEXeqex4LIjpyFHt6zetX5U0DGcM3YiOcifymk7DRVjSf7/38n/8Us7aZe+i2Pa4W67oS6RSCSknQqcmsha5kFuq0qIOrAZ0TAmD0aCAUvBj7GHFsZnvS8rxBT9Kyg8OKD8BmTuPlfZH/7J0XuD0OkGHxYJrF1qSqTFbXjKrHO79ZFb6ksyXK//tSxOQACrRrYUywxUGRmS608w5m1Hiz/WAuooJJSUoLEmBO0eXAwD0eH85k4RZmtD5ewuTjpNhdV9U32MK3JxGQN/J8SUo2obG9sTOgPu0xZ5JlZCTlg1WqAjhkUBPM8u5lyoTdPVf9Pbb5Fdgy3YoJREwiwbaMZcUNI/5OAEhYBJgBLn5YOPkVidwnjmaiAV1TaEZIScpWcBDk9Fmfi27vOUtSYmPTiWxCzEikm1IAjATUwqtMXP/GFUbmxUVVU7ZW8eNo+yJgeDIlS8PXJtT/+1LE5QCKUJdg7DBlgZkkq6mjDliCm4mmyiiSVUwIiPxXqwqSdqhIcdj0e22TA4KoIvqJL6hoyd7/taK72l1RS1tk9qKmq9sQLkPV3MiwSNDmq1rLTV7oe102Eu6V5a+xr1fkIysfav6pb3srWXqhf4zA+fnh378jF/5YJEEFQwCtLauFUVBb2A0zVeH8hCSyxPGEvUaNkW7UPexffMegJDcMDlISNCyr0goxI13RWpVbyrlK6lM67VOhTvFKd1ns9kZeXrd/oYjgtXs+27dTq//7UsTmgAssl2dMMGlRkacs6PMKWotTl2RrOWFCjF6AE5bE2Wk45gMIdZTNqGn2dLMjFQSBANkyBEeYAhliyE/TxSICP39xif8Phm23n3zU9L5cNHUMLqb2efOcoQcRi4seMrcHE0+Ya2Wo8qx+TZlkKg8AAAFTIYgfcBEIpF5iQ2FuNFp5+5e2jxxqUS1+14zk9MKdPNZrqCXBeQ2yyO5BmVcQJUpEqgSPXWlqBSpKzG9VOl4QXD4a7/s7O/d0khSFTg2eJPurWxR2bWkv5ciE//tSxOWACmRbZawxI4GPK2509gk+DFb8WTi5q9IFTCggA5PxMhenCizQH0cyEqM61QolxO0LC2lr153Y+FLc2RuMuJ5j8qjghYPEPWIE3Sv0mPHpqhioTmasdLUkziaQvWkBXN0l/BPt1GOFUh/5Uyf/Ibrd0//4nv/MqNerDAAA2AhZoACnlA0jEJxOHxkKtQHaeCWvlNI4XmY3RAxdvAp5ZbJbs0DaBn10TqxIytX+zbFA2JhoMvKg0K70BhZ5xE1HtX2qekXcxBW9Up6vZ6T/+1LE6AAMUStvR5hRMUaXLfT0jSQGCneVShOQhziN3SXgyWPjTQigfaDZLQwJK1107o5PXIOX2GvaNY0JrWSi158i9NfNazHrw0geu5aW3XfP40z9kn8Hst9ofWPnR1ETgVOmwveChe9XYxakMU+P1TtvsR8AAAqUEpAuaEaPi4jEWpwI/E5SwLGXYqRecdhfUw9UrfG3dycPeGX5saYejqcJVgyp8adO2olReLQDOZFVlxpZGci1NL947e3mZmZHzs/8vUScfVxIRBMy0D+eS//7UsTrgAzcuVjspNJBhBltJPQOXxLRpVB0AAlOxgzCCh4814hA3GljkIhbrM+gKIVYFuIW0UfzEkNz3XlHnVK/DE2XcUL+79qA42rimUQJsQFCHY+cqEampoachz38h5lfmcPzMkLOEoRblqEJMqAqvFRDH0L7ke6K+liAQQTBDQbIKUdd3VB2sy8IR9aFhTE2xDJpiH6444uR1o+h0Z7H43pVYJMz6ClsYp4UxJE4FvN9OLGdkMkz9y21kOUHpgxiV64PBjZyEdnDw6gg0PoU//tSxOWBilhxWsw9JUF8G6upgw5grdPIxf/GpXe5Y4AAGyMnaCCCnmbkjyXOxgTrB/rpoZ2FwQBMGVR5MLHWcqKslRkRHwYFHur0dQ/Qg6kPqgfaRbOpuqSuVGmaXWzZhTSpmV7zEVi9Ppop1GOVEbQ+r9kmDoo6VtaPtPoVAnkAAAF3gs2bxAeq4WBrYDpKPLyUcCuGhVIdtEnCzq40zHDzfkJsMyHiVLLx10+klxambfL+uce/Oe55H5I5aMZbH9pXM/hVfRCo1o7pXcXx+1P/+1LE6oCMCP9c7KRywYMdK2mGDhgnsyWgN/+yFJI01TS2B+mAOt2QRBCSHKcCqRyZJIOd6T+10tRuuuUraEmTqeZJRrU4qszctzYtP6CEsooxKNTr5nA4tngsoZZy/MUPe3LJJ32iEcz5L3/6HI7wsy/nPmu30mFRl2FaADrAAAIALnDSQPk5miC0yAIvABwlqRUJY44J8RkMOQ8E+mTxxLWtwDUXA7tk+DJC3XJjITiyfh+Txell3hTYimRQ//SGpEHR2I/PPI7fL8i6dvzWOf/7UMToAAws921MsGfxe6WrmZeUupX8K4l34RDD7u2cwQnG02iiSSVEkCtGpBUAwB/oaFC1QSRgHBKLuxhbiFJdR5sDg7EQzHoByO+JI1HPu6uydtSHZS0eroR7tWm+65yvLYowkckQnmbVBw1Wp3CA1KSfR53rBAAAODLxgEA2cssjkFQETWytaikFtsqJ2riVLK3YCCn7if3XOyvzTldlvSKY0MghxQFG8BnCiNLTH9VwKBwrEcHk3aJ25K2MiGRcRkhjjF3i0lbxqMUx79z/+1LE5QALMPdhTDBlyYCnLnDzDlfo5Eta6BRFwocSZ1gcUOmkegHuilJUg7iTiWgmiYYHQLklQdmokg+lE1WYIE0lIbzd8s+ms7AgmYgnQq9z5fM1FoMLIYjLRGaLHmdcs57lkXZkv7ocICHljpAUFIfsdO/4UAIASk4EYFZRALiZKQqIw2CBkIZj+aDKN8h6t7OQZZfru8FC7775avWw62K+bPtWUa5tXaR9PnmoLh6nPSi3ry60oQpWBlteW9np3I7JUq/TIZGAlqzkqtf+wP/7UsTmAAwVO1+sMGXJWZrudPYI7tBzW6Aen0g5VcEYABJTiCMzgB8VGGjpTEhDKfKSocjkwPYlngHrIqDwufbTFi5f4IXmHVhHvIMKB7CFbU4Z+hfoDFUGbShcEhF5r5epToi1it6HbawO0k1CvrBOUHBQbaeJL0VWDkIAAwAEAAEqXjEwYYF3X+vBHuQxFwrrtTr4R+VRFr+ShNV+9AW5Ye0x4ScbEkTUaM4QQEArgn4SHdjJ8poo3zebuiFn2f4ewCFgOMctO29TxMEGt0w5//tSxOiADUj/VMyYVQFimi3k9gy+GDhMhQEOMqQ7RRXqTqAOAAAB8GAwXKZYzSFF0USFnShSOZ1cc6obi2EPYxM5C4XHz0QtEiHnsB6yagfOSK1Eulm6lNQ/q45RlpKQ0sOvATGV5sMCgstokNpyZFyCZli9NarAKvU+APQAAEJy8cCDyRaRrLoKpQTdLlV4gC+IWwkYo3E6bUzxkVMBV1W7ydtve1JjeZ6rR53NeOGLIhcFCKHOMyqcgsgFx4jKFjzSHEyXA9UKr8zcWFVNrov/+1LE5QALaSdth6xS+XWYa92GDLpCCMsEpljYDbrKTUSAKqI2DuEwAHotw6yXiwljJXFgNSefLSUMHzWV2nfJsx6YfKn6hMmLKPjkJgoWjKCWR9GMniQh5tELWNr5Z8/cw4IoQI7rdf2Qunf/JqozFtnXt7v8vmEY9LmYPs7+Q734To8bAUsRBACAWXYX4vmFkHKcxNyFKyikaEfhPuD8nqNATJJSE4IINSCgsTrkwBDy++dTSUhcMnPJ70Z8kD4nFZADDRImb9zpjPn/R2UXBP/7UsTmgAxQt12sJHBBYRDrJZegsFKl/5PWT9I6QWaVq/bz//+F5//+TbuTABN1wMddq0LjwghTBhlZfc2WujZSIB4BjSAAAIKTlds0mRoi8ebAhOb4YEu96szThcreovKSJuukeyfVxYmkzQU9ZTld0RKl0VsrMR0NVz77VHM5nzK30+1HmX/m6fsraf/MhWu6RzZ3bhys6SIyoC6y1GwCVxIphIlFKvQ6ySzF7AXicjlBDFeWSEMKH4PV/ZY1Eyu7Y05nrabMujkMUOOtCQuV//tSxOcAC+h/X0y8Z8GamC2w9gz/3XUJfmizKtVRjfZlG6rsMMRFlmldUaj9trXyP0RjM9uv1oKX1zHdrctp0Pw5VKP1gDIkggRBOvdIYRmCVsnWKsGsuSJ7LioITHGsWqGB7rz6le4ZtVJ3JqWdrko8nVH4ZMvTsafuRprLraPsIKEZbmmQIx0r1dzolWIMmmql1KrWO86pqv9x///uMGL2GP+c/oUJ1ZxpFtptrQSalVALcZAsZyndOehLV9LYSZ5sC92LS4m+5EZmX/H7JOb/+1LE4gAPPWNvh6Rv+XSnLbWEiWqP8/6CJ7rL76Qq4rU+WDBt9j1cens3s7Z7cPbVTH2LuOXxo05D0ZWe5z1NB4ym7//Krf///0tGtTv+171ib71xEKAEApJwGsF0SchYVdqmTSZWtJ+MAwXA5fhKK8RVBJqI4x8bpx1wuP3i5Aard7rdZx8uciK+YcxfNLZUe9TnND0kMP9mVDENPMcqCBdVOU9DTP1HWd2t6Mh6ygNv/+txiX6g7w+3qa/TQtG+hRQAgFJOkJ50ACMVhzWkp//7UsTUgAwlJ3WnjLRxhaTstYSKkJ17lhl+9fV/1OqUplFsI3j5sFV5TQdCuN+1kUDuRcku45BV9Yj23/acL9bZOfa6fJx5ZShQqx3zDy1SI0ncSAJW2OnHH6UPWH3bt1RKHgXOd+v+JBN/VfepzJ9rnHy6Mai0ZkQlUus4opnYoIAAVc4MaAruEjmQo8qtYdSuc0GCJIwxnTeOm+btO5Ze3C850EuZJEAHHYrMkUTjVRVx+0uQq4y0+v27n14ODeLcepvu2lt2XODU380Nk0q3//tSxNEADVVhfaeY9PmvpOwdlik6Zi+DWnqdZwySSZI4XFGcH90DZBFSmML01LWsZFa0P/5eTdval/UW9bBcZKCvTS5CADAAAABk4y8vODHzKhpKIUBhUQW1FWbvzB0RYOVQOUMZn3nRJwa9QMIe6wyWYBoDqGpwukU+I56T85rCw0muTF11fFBa3wuJF8bOHZuQj5xhNBTH1Ipov6LpVqax0Jwz77u9A0YzdgpXWl3UjrXVSJd///Jp//b/P/5q7/pHkqvcWAXQAEgpt0wEDND/+1LEw4EPTYte7LFN2gEpax2mNphkW0dN04ZkLl13TcKEQJCoJ3my+1M6gixcr8cjtfhanOsxjOtTSwNubU5eEA0fFRmmY9H95UbL/XuxmYpS8E3PoKV2fPJsqYCXIIumq1JVmdFEzJBSdf1VrTXmBT//9Ewv9IvLrTW3KL1uvooqAGAAAAFtQ40Q0YJLWu4iirS6Rr730bgv8vqq0eWtwQOwgDbRnMrQeRg/0L14WZkv19ixFu0Jr7W/LSZjlI9ytPer00ydvU3ZtqDE0Kkmk//7UsSkABA5c1VNsbTB2i4saYM2mmo1PKRQOGKLGx4C7JVM+yKCC1LczRTPKQEgXF00akrLWifSzI2/oP/lH9S21WW1M831gTIASQTI6Dqk0UqnwhS+GiwuNwvB7oZZnGYLk0EKQ7E/gqEyuRKxBRDKMfKljVbIRlvcefoM5cL182XlbOu1khmZ2Ujqt0lO0L62vZR5MwQH1MvmjgIkbi6fTrWxqpaK0jJjoc4oopLPnkGqVRWmk83f+7/qPv9ctrXXdZibudZgJi4EBFN82Zcp//tSxIWAECVzXUylsxIKrixphbZa+C40uaXpTOXC/UPNn+EPFCayi7yRMsrGmMXWV0qjdagKB+Mali80RpMnrrD+6NgVkgTeHR1TcoXjTfLejI99Jmms13rT8Thwruz73ribX3fxrQg97/1nt2ofkQByGzju/7KDLpv/VDM8d/7/0/nixah9pQq6lzkAEcIJKVc3nhPQyw0ExdYkHcCJP031p53jdKIJ31XZGgrUE3WGseYzi0ZekteuzTxXDXGlWJi1GIR9/dqt3uqfOtmQiFj/+1LEYYEP8W9WbT1VQiarqx2Xn1Ab/ETs0vTLnSZz9KOxTFTXGc43vF7Y8DxLwRYK49t/F5Mw5J5FhCLM/aae091kQODzD3PsyoqGjUcaVL///b+g600yR6sOVQBwQAASqvONQxxwF8mqOBpeMqijzZ0DXH0jdxVGTxxrU1Fo8MBRpsM7GH7ZxsUeqZZkTFh4hOs28S/3VR4hSC3pW1obT9ZgNNLPs2tQUyJStLf88dapcw4ogZnfPIx87ueR0ODEho5jUM593iASlvf+LyTWrP/7UsQ6gA/hXVtMvVNCEauspYeqf3bp+Tv/IutDZ+oCvUABlMuoGXRogdqjSnVfJ86sQbqrtnK54zA01P4yj5PRUP5QW8ZM1zbo0BcbpiSb27la08ttQ9E9vvwWT/bY71lWNU8BBA4nUlc/NLQ1E7pETN2Fj4E1Gj1xr+V7LApmlZ8Eqv/LiBX2WYqTkALCEfXRHmslnKtb9/9P8h5TrwL8rUrqACcTZIIJSKgt4aRcVQp0mbLwue45PlAf0p2HEhyGVV9xRaY3YMcy09rvK+cw//tSxBaAD1FLbaetsbGLoGxphKz4ltbbiJWneRFLtM6zyI6rWe92Cxdp/9JINmLpmqwoa1mLKRYciB41OnDeZh1dzdG+31ssQ57V6tL1FbM+gtVqegqsx5Y85JoRH4tI1VmwHUAADc1vXKmENXa+/EIcOmC4bwWCQjgNNHxuo6Mc7MuCdukU24NqNQfDurKri6+HB/ay3GzYyCiytq1NPg8IONvNytUTfPCoZfz3MK975R7ChZ0VH7v++8pP2buS93T1v/21FAAAW6qIspuo9PX/+1LEBYALkQVe7CVQwXagLSj1qdo+ad0OQ9PQfXl8ZnKB8L0SX9u5oE3HXxCXLYHqaMwRxllN79I2Sr1hekzZJyhJMIieTwrB19uQO60Y+wFVtj7qTaeor/7NoerINS7M9P/3dHkQa1AJBLkcNIEACUTqpH2PQnlMfajUimXTxERV0Gm94rPq3kyvUWhrUT1ZHXM8ykKg0bJ1S45OUtZyIU/0Gz55AZQBJnzph5JPQ93kYcJmtq2k6jQvi76mvOVenz/Lqga1BFCQzwBEGGzKo//7UsQGAAu9A20npanxbpvuNPSqopTSYDmsyMh8jwogGwJrO4/cJiPq9J33SkI3W2xIy2OGLmUdSBQUrnT2zqSYzI/9M2OvOuixiCcm6DqUySl2QTSQUoQI8tnWpVH+xj/yPv6vOdQBjjJSTKjieH0fovqxT0IUPQijE5cj8O1D5Jl8x97wRpa06od3XrQZxmidz4RfUN/+d/9AezK5Mxrl3fEWKqoAdKI9z16VvfQGP3cn83PDFm0K9v+R/0ef9yfUmgt1FKSbbWPwOsTBzVR5//tSxAcAC80DbUetrdFvpKxphii4khLhGaLJV+pJSo6YDLrFyzD7iLuWUWhtGWrTz7z1IH3rHUKmgxIab156Irbas2sgZiQf+6nUpaVAO6Nf0PrUsvH///Ov9Wn/+edk2GwxSBkABAAACpNcpMJkDosklrGQ7SHZrJ+oOlJWRDUAx17isgeg8OEp+KFkqMpC8vMnuzSz4TB1ppBdhe5zzbuRCb/uctJrkATC97c2yLZlCo39mTdTIsCc3/nJeVf/+uoBcBAwna7k9S1wd9x404D/+1LEB4ALOQFlTCFTAXWgLij0Ko7/yqA7vYpfguxHr1tUPN7dOE1548D1JsZXeJWIyzkLpJpYW+weE2tiqviCPuDjrxcNXo696zmIlMAvb6Tlot7iWb/P/yj/4Bd/s6ha4HLJKRMM1lH0wKVRIYomtH3U6tTrNJqVX7/PXMu28UiEdkaKi5BwWFkJZxZzqtHXwljjrJ3sYXWxKdcRhQ9H7asrS7hp+yjV59DXYJjq2tDPe8XO++t3+3l68XRVASAAIJ/+dpZWYrU7J6FWiFNlBf/7UsQJgAwxBWVMPWPBfyBtaParGnXDEem1xeg6tydStLXEkG9Jt124d9qrPvOxPN9142l9TLJ8wv4NtliIZVx/n6lKDHSpoNuiI+IPbY90SBd83/fd87s0slEa1tP2ja/+zoAWQEsJyxhAhkG+rmNwTychJuOrVytvWrciU8vgO8zYHRld1t/WiGPpnJrxJfff4+GTZYlk5DjxykHwgq+igUEklonzrLDwnqZcwTWn0IWgABSeTVVK9HnqHpbueh9v+hUASwEAhJJ2sAsi4hFM//tSxAaAC0EDaaehVOFVIC008zXkqgRTKhBMl1DV0i5uuvdU0k7dbLqU4/F2ICW9j6uhs7ZXDSj9hEGr4P+C15Yi4OGvv0rpSoh37THG/YxKg1GrMY82/z5oiVph/Osb7+kAJQkEBAuSIDAEPIQttKLTLxqWNMr9OWSWZR3FtqmR9c5yQzpdF2w3fFXqnmdY7TXpKyvZi7QNwxFHqfU6WpBFbCML7WWXqKjq1TohU3f+v1sXzfT7lQE0ACAVdgVqJxDQWSOLLX3mspMoTggHSAT/+1LEDIAKdQNjTCVJwUegLjD0KbZRXJOMaNxSd76eB91wxFi8Z7DLMlHMN2GBk6ZyF7nornh4OGdty5r3vIgHztW7aL0CgT//SPZ85+j/QAW6kShllhSjyL2/OZIMCHMKNVa2q0TYQCXD+JUm4pADc2JfrNpeb2z1IqAtdwHxazkqZQvRyNkcMhx/7mZ6GSMCZ2r3X1OuBTZ//tx+t/4szpUBXZ1ElJzbUFXsvTcYKvQxPKWPJFcVxdgfthO36lxWMa9FeJs9VOvQtVpcio9Pcv/7UsQXgArhA2+nra7hW6BrZZSekGH3ROlykmLIopt+yDvSXWFVb9Rctnzqkg8H2ZqOu3WjF029RCwj7+kAIAAAfwcFK8gegiiMDJGw9AEtg/s+/0jlMk/qcHJRvPdB71o5y6guCA2ogWIaSknvXwtqUVa8cJC7IVKbiBrKu4gFn9G6Uwa/6LsymGoAU3/5vGhN39QCsCAgFaSLIbQuqwZG9eD5wxOPd5MKo86XoiGPNL4BR1NNByr/FK2Tyzv5ty73mNVZ7kRq5rVSPdW41FBW//tSxB6ACokDYUwxqcFHIG+09KqOvmCKFkmRdYWDaLvct3VTrEltf1f5z/oIUlbLjbRjaqYZWnR0Mx04QxyjJ9qUki9F00/986hbjEl8PYedV6F/dHctmJzo03j9uX5VuvOLfyJT0qyHHAU+nUoYjpNwnNs/9PFYc/yH/9vvBDcRBTMS2QBHDgtlsug6uJB4ejUUz48Qoi4YbsU6y+QvaFmFOXobNkmPp2zoyPoISbvR3iE1bpSpb+5cy6pqFP8t/ULt/b/Hy3//YcPo0+f6AFX/+1LEKYAKKSVxhizvMT+gbfT1nez2gkZYtrAnhrFKyIFQJZVOCxKnWxM9qiPhjzh9L3rwWalKT+btS21qSbMUWt9ptH0PY9h3il1otKlv5M7VJ+BHrzmtSruAY9W9P8df90jVBMcaSRhjaZCUfh3bPkwUHxya+fGag/KULFt+IDvHr3jL+dQc4ae8TC7X4kDI9CIKZZo8E80sSmTywvDhm2h7W6VArH/y/Slgui3/5z2GBM1jl1MYkAVMIAGOWJQDZdi1MRfT3LYrE7HssvExVv/7UsQ2gAqRA3mmGU1xXqTtNPY2JKiwTW/5Sj53Vvw/ZVSPzLU7pTfzNJHTFC5ueFQiUpqaNkQ2spFkDAfw1Iqc2zjN9dg4er1f4xf//nP//zb39SoUVtuhO0mwJUZyqtCZHelMH4T8Pw3JkU4ohMevPbVr1MrDyNAd73hDW+HKkWy82p9b16/GDPQ3D+ra/3DKiSSM5iTCoaUelbdd4U7/26+FR///KN/izuc6wlHU0yrI5CRw+A1LRdTDWldQT8RHUti4iaG3WlMZS/nbla78//tSxD4ACwkDYGw9TcFhm++0wy4eBBQQAzUWJ2CKzphZSrQgQ1Oavc4hFlW7ntgx5774W623TUwwmY/mCviKiNANyMHoELeQ/0UIAQjkkgUIMkN/B2MatfvGd+/cmyeFpfVt5YZ713+f9wU9z0hbijEaOTpnBQxn/8yzGeaD1BKDv6vaRkAIIRWjRvtRj9AgijaRh+nTn4ZlPO/L/znO6EwQggYUGZCcjZSf9v6QA4dSARAVUgM4B9oB+vqFEG5ESKBVZM0aKpw8t3rFlHz+a0v/+1LEQ4AMcQVo56RTgUmXbjjzPXTv0UFEhQ5Emhy09p908KWsHEb1p6/H+LY3QkVYsHN61xi+s1iwYtn1vW7+3zue1gLRAAAATEBkAQAWZJ0OZB7WqFQqYjVxY0uKgFJCKymyA4FHFFoRjbNPjvrbSqarTWy+VcTiHSV31/PVQfKkt1utEfrp/7/Rv+yvS0wpZ///5YA1NkAAEgOamnxP9c7XnfgIe7hEetlRgRVZi80gYt/BOM6IRM6H7COB0p/S6ihJqkr06h9ULz19/PxUgP/7UsRGgAopB2NNJUvBSBMstYYguOG6WBlaUCb8SIUA5tda3vGijv6v/+SqBbdjZSKRRUpdDw2WB+7RCN3C+djUPEk7FrsEcMyqmVtuzRIt+0efGQn8YUNdRXTV4BrejhlKpPlp70o39P9fx09Nmr//5813pVP3//46AScAbxv7WQQVw4xCT7uQQyQqB4SyymMye/I+qFb9l27ppfY1SgEZJyr45yi6cw05SqNVXnZtZyAXOY19Q93to/8/fOY+k6Y4+3ahVxxOTT+j+j+o3RJJ//tSxFKACkFnfaYE9rFCnu4k9hy2XG4mUU0qULMQRDicl8jKRbZlKn2iFhQ4ilIWzKH5aJTUlqC1zqRrwPnpd/To1Crtm0T7VFCpbg4ZrZr0+ONN2nuce2whWWsk6v6f/+Xc6kz6oAACu7keKOQ7h1ORkVhutLZXODyM/qpaKwjsFHHmaScBU1FIc8KqLF5BnFtCTOdt93q26BNMRm4Fd9+Z/GdXekVHVeaNB1zSplMnR/Kfyn9aEUaSiSSRdlzoVofpfyHKs524v16Naj+pljT/+1LEXwAKKOd9p6TrsUmd7Gj2KKhksZCprz/OPvwButnqRx0WSO8Q6qS1SUSy2qX/j78wJH82r9B4bboPmZcyMDFr/voW93b/P/29v9IltcrcSKKjdIxYgx2roTI43xpuMVdnleI2B/93tK5l9tUeKzeILtacZHPKNmvrpT3q9Pib3zwFU/f+P2L6e3RfKjnW6IIwXQ2QaDvT1f0f1db9VS+9qKSJjlAUhqjfPUfYhSHLpEZZzDLg1u+h2mKiv7K/UGJOlduoMquNvRudqklKyP/7UsRrAApdCXOnoVERShzvtPUmrgLmyrdQ5ldMX0Tl/jP7AW//7O63VjX/HBjtTiTp6P6f6vf+kN16NtlFEIqlFEMI+QHkgJmBDiEMVGRMbiIsqYTKWHm8OG6Ug+VacjuI/Q7IuvMbOP0JeeuKObuJv//5xj6PvxkOf/8t//3//7f/89vyj9dVagAiGRMgAIkCS8x+xIlg7PV1N48+kMehcm0RTZVJErY49jx1ikb4o1/4HxfH0bccL0G/PZqutzHqXui9+G3y+oF3//7fnt+J//tSxHYACnDnbUes8xFDru709ih+m/Vvyhb+U/p/r6hNhlIJKklGCtBhD1jZQbEAd8UjWUdnVXLmH7buUmlFSDWONKcpSVZozfMdVpqU0L0V9RhqmQBM2br/c0+adj01pWjE41+h+0/FzWtUd5/+zo6eSgizGUQiiC5KVTq+a8/rqWHmrLOjHGCSddsWFRtUwVVXNr6+6/yi2vre72H2ewwyCgNVKEurWNzyX8a/wc//9X06e6MJ2//xMMn0X89/b2X2ckA2DSWQAQb2ARwTeyX/+1LEgYAKOQdj7LznwUwgrWmGKHqNyR2nej7zX85JAiAaQDB1cvp7wtA6mVnUcDhjMZyF6jA2guOqU3V6PepJ2og+f6haf9f6He8q3pKv770Is0ZArOonLv0VBFLabbCJ12BUYkE5T6vxFoVIX57ZWwHw7svFFcqgMbMWdgvrNrNADnsEtcpxMSmFy2PGanPXy2htFGe+gSMchfOFFHecgt6cqv5jt//UG2fr/kw3pHZZGmWpMZzw95ilfH2XxDrREwgq+AeFiSISqTIvdty+Kv/7UsSNAAotCWusPOfRSCLsNYSpmAAf6O6jdrDcvif2tJJtob34s7aDRvof/J/zP5R/5DtgeBZp3Y39RzxXKdXu1OVKKgMQAIACSNMMAjpScZgoK+0TxazSTccTOeDDD69uJKTlbUJDZ8czTULdk29UVuvD6X8PWig6WpyhyspO6FBLencEH+U38ebec35R/6/kP+v//r/qANJhULJQe05r+DmrDvpROBDL+BMtLQnFUCYeYGbqpoS5JJlRzz22zgAKPdaawyTEkaXFQdZyrVKF//tSxJkAClknZaww60FJpO/09J3e330L5U7iG/UI3+p2/j86jPcXm78Rm/R9XsVC0/8t/R/X/VUDAVSgApHBTefZRBDet45s1BfHClUu/CJClzjq7WdaFZu6sAs59m6/Uc6pNFBagKHa9H/l+W1IfoAIbN8j/ER5E8wyIh7a4RBhEux0xaPOCoPhfK9H8t9ND9X1BqpSSRFMqJ0LzYthdxoBlspY6UlRMQWhFcQsZhxk4VIlNQIqe6duJlwOGNXygz21Jduv54OW/enxu6kh1jn/+1LEpAAKYQdbTK1NgW2g7DWGKPhB8nTMDA1dU7W9S3/+j/9/t//qU1/P/SoCAEkgBPZTI4P2jivpWKTS2Cj5TDeZyWJ88uJd2r46lteGq/WO9zRtHdZwjQ0nA3IQoNh9iDHNXyhfvq2jaGdsXgRu7rVi08v1EQp5p1VFlmeekUlj2Un5leorkoH/Lf0/7gAAY5QtODgSYT1JrPNiQAlIQ3Ay0AmkW4EDBkKNJLk27aPUUfvt397H4qINFZq90hq2ijmppWxPibdEGBRZGroSjf/7UsSqgAtlB2NMsOnRVS0vNMMdzqeQNkBK+uLwVOxGXr/qP9/J39YkvPt/5bfBDod+jr66CRbRSiBIKKokSoN2EjkdpePPcI5Fcw7qUupqkd8YJJrMqspTiTxftv5+EvDcMjbavUz6NRG/i9f/qQ126l/tBc9v/z///I////O06FTVxG+pYvHIAIAACnO1opITI4fZTTFkQ/sq4NQ7Llku+7LsOPGF4jfQdJXI4BR0cWtRMd4ruihPbKGM5D0P0Hc4tcp76C1lfb9iFvqd/Fn+//tSxLAADEEHXUw9R8GGIOtNp6l4n8eL+b/t//0/m6+TOynH19cEANqY0ccBUS+8PqXxq7BgHp9HLJGquKfw83Jsay9XjMYRqTDIz1rkQuFiAylqAUiQhVhZZRQXqRltT9HyIdujUKLTxIAgLOLy2g/MdWScJz26tq/EN/f+P3/T/Lf539h7n7PlEhBFOvgyHOKYPGteWWYLb/rs9mdO2Yy9WZW17euRe21DbN2yMClNvaa4yfAixSVYUXF5+Rj+5EfQiFPMoUMm0yINWlSzVdX/+1LErAAKgWl1p4j3MWOs652XqHi9Tv5L+aPG/N/iIOPnPu39v////5Cfw2oAGmCsEi5pdjoNfytEMsZU2mYcegxkVO3qBwabl8p2o42+kJt94QJGBFiGVX2Ix90U1/k95v3k+VNJPlqCgvqWniZr2xWBXVrSEx+ow2cj2bY92Bfsr6fWExhpslTIf0/1dRSjcdzKCKaVLYU54rtKNCyYZfdtDcXJIv2M89PFMIq8Uz8TDBxYlSBzZFqiOywj6vp1ftlD9W0J9tQdvpza25cjk//7UsSzggyJKVptPUfBeK0r3aepOKAO07PQFFm3Tb8IvX/9C//9v+3oMdbIcho7pABgyoiXOtHWaPzFInDmovBT2t00piFBRG7x+urYjILTPXYVbzLl11S6vQP1mXW+ptz9S2ql5P5gFYyjrWY3az8lRVCruBR7FdYsDgd7t2/Uev9P/117NQ2qfAFBSWjLkkGAwG16NtYeBhudqCHUtXsnl7A8ByPdeAF+1llRHTRUMS86+crpPkQ/nGqOu+ihNS9257+Gyl+lW3l6iLsU/VQb//tSxLAADEUHWE0869FmrS8085Z2qqPJ9cUl/538i/n/8r1himiqHfi1F174pEqSZHiVM5WnQzog3D+nsvIkvqtOwWuiruVmbNQ84PVFtTUBe8gfGRIsXozCVyjZ/v208n/YBrt1/m6rsnvUZinSjKZ9JO4zd3/z32SBxUTNRRJSNYIhjcSASAaMB9nCX/tEeY3S36SphB1pGMiyDQ0iuo76gyKK47WDQ735H1Gp9zaoWWafZSz2LPd+PO24at//nVrS+mmKsUYWwpDyM5ZMxdH/+1LEsAALRQdrLDSx8XopLSmGnnLdv/YdPXlej+j/c+t61QAQiFACADbeOQ1RIgRyIs3iL1oIKdBt7FKtwkDHYHaD8ec7Vf+63nZFVt9Y91bPA9CLsV57ZU/kNNEOew/3qKwA3//xqcx6TkIdJ7AY6Iu6PO80PiyVM1H/57+Q5MJM/gCiduBw5N5lfwHA8y9bD+vpLGaTFodC4dKLgYypHFLZN7CACTaPNQDHeJqSr1K8dL6FaS9Z1FKd6mAFf/85qHzol/oIwx7Uzfi7+36jb//7UsSxgAsFCW1HpVIRcKDuNPUuPrqFCcCJcZKQKQjSHPY5EhYrkrh/KEqSAMEkXq/LURfpXE8anEt0AOshXj5lkQ7QeF2Uq+Ql6zkmtqmhL+UCA3f/5Wys+Sv9hHJavXe/kYqut1t3//JDct+QkFEgNCEtNSlSrMfBfmK68yv5nqMcEkCveh5Vi9YYq1OV55EyCQ2r6n6n8z+T9tQWTPo1vYXHuSIcPiIL5nVzKAMjcgONJO9vF70+36E6FgGYhJKy0DcLwuK6NdGvlwXXUZMQ//tSxLUAC6kJX6086cFJJOxphJ2Y0jdiKVZFVKrkLxuKvThMQ135nKjw1iYtdH2PepryBqKNGMUfJvVQ278/+PWnnqhpDurzAeuY7d/xJL09f55F/F//dcobZbySQUlEPF6W6pIkiqjABZlINTBUjYH/mfOZoQQJP0s1v3AXtNW8LMtiDKIenR9Wei1Q3lk+UAAY5vO/jZ1qrU76gvbdudfwuXX6t+o7/v8X+8l9FQnE02miklGqD6kV8LB/HdoD/KYB8OqF8GzMMnUzqLdirM3/+1LEuwAKbQVzrDFFsUUk7qjzKc6Ci3a1ztghTQo9yNhl38dHTnA1o1A4Fv9v7kpqk09Cx7uY84L0b0I2Vnf8RzSf3/3f2byQAQXIAl/YEOqead0xD7zw/EzsuztRtHrWMQzS1dQ+yIQmLeCxb3xA7U3LoQu7kxdpA9yItlG7ak2nKkXfKgfOsyUf+Sqp5KYYce281gXjqm1bT4jvf1/sW/pVBwKRJ/oC4bRzaHJ4LGc7W0Q2qnqwy4bJJdywkIE91c40eRSsVSGKiFBAEGGIGP/7UsTGgAshJ2tHoU6RVaUt6PYc/gqfanrJQJ3SBiEYYAwtNzDMu+N9/x4FNDufe+9/+dKGBpshKLaf9l/1FNlxpBEJrKBTj+01dC2NA1lEHxl0Z1sGnS56CPp+1vquTIPXEylKVHtRSOxafoYrdc3f4qBlNshlKidt6GtKpUxJxEJYo0tLKXz0Oiw+j/yKAgAADJADOwIoDxqQMpbxYNQdcUwdk5xN72CZMdXQlTaEkjl22Ofi1YCpcUS6Tb2tXrqFE0zpywo6l9wqO6yVVSK///tSxM0ACrUFeaYJVvFmpOwpl6j4qKFRF0qZZSbEySRL9fd6fLibu5zsAHkyJ1UbLCRU2x2yJBuQG0IwRE0WUfXWRLjBRVHsw+0K1NQpzE6u6E6ke1FIr0aI0V/1AzHa8n4NCybFod71M15H5z0L3Oun6SRupBJBScBckoCKRplGqaSVLFyiP1TkJR4XAM4Lqk8dOxpIOc/mZQ/ChyuA3pSDfkDyHvE0e5BL7P7Vd17G25HWpwAZkY4MEWxCL0vQkxrkV+oq3XVi7qTRkatgYPv/+1DE0wAK5MVeLDzH0UIc73D2FP4lX+/tJHN3UWmonKBcIQARmCDoF1INWxyB2wncSiQREvlTqJfmthndhfsQSHx9f8l38yKbrcyG2mUVAVurXQ+vHBDzjGcqVdj3OGSbuipzXHdqe2UJFIItzmi1lIogogTip3jv1wgAABArt/Alo1Gvqq8S3hg1qae0qeRsd527MVhxs1DAzI+SJqHthqKEpGHVlDUKHehReil2px43QZgVlHqqkucWQ8uJDq3M/XU808v7FSlv/KM75/s///tSxNyCilSpXO08ScE1mGwdhIkwnxKT+hAYIpOog9hmsSWPInhFkxYGtM3RM6uYlnS0XTtJzf2jjKWSLj2eeYptzyelCm3HJBl08Re+eB1buynK7mlweLuxyUbvJbc8z6lv/PcmKm5AyubaeRKjsrHt/9fqQd9RD9oIgpuMHEGrJvS2KruJbXEO02lEwuccjkSUcy+OwpgN930m4O3SQvDrVtc5KumRoEgcmBwjZqu3mLV+Tu/ERN2OC29+2bUEQ6qotam0i5rDQ49We8wjsiX/+1LE6oAMXUlvR6RNMYAfLyjEKi5ejWF76r06jzbscf/6v8fluc0JFfpQsuoy13FpLMWnQwU2O+6Vh13gb9onU2v5Cfg1e0bs/MMef/aJkebTE6fH2+G2majS1phbegmev/l2obddZii5+3u8qZ/bybs8Z+/OVX2pGjSKbgLcEwBOJ4uYtB3rJbIJqJGqTq8utY0ufqTf1JtN4yhBAQ0F1Ow6jEYW5fm5QLqwC6MzwUu7crnZh9uYz+ln4x0Oc0gelio8VFPmsftIwsaafdn+a//7UsTnAAtI+WNMmVBBgqktGPSqJhjttdF3SmRk9wECiClIBC4SSknDrWoEJCxNl8SXJ8rCytKdTsy+6CFRtpisuYretNlJ4BDK2XD+ENJarmzyhN+oGa8HzM3Hn3uX+ULfQ31ML6VW3Qt/0ZhwMt5zX48hnjyGW//46+olaRSkSi3BUc6vSXuRxwXPezNi71oQq9ouuV0uz6FNLxw29xaXizsTzDg1R5nUEzPNuJbWeoV/HbdTN8cIv6t3Qo9Vxz6E/+joOHvVDZhtM9kO0fr6//tSxOeDTS1NXmw9S9E7ImxFlh4a2q7om5dlfDmoUYUFfAqwBalIoDiHYeQsT9dFmzJmZxUpq22bGaSduST0hi0NA3sb0yBz0vd8sSV53gOvvgI/qBuuK+oz2jWTxJN8BXRCtEFNZ/5n71v6n+U5KnTF1fe2hBfbZIIZXmikky5CrWy42I8dQp0A0cpqqrUMMzaEbw/61rTmiN1Z2wlHDlyIy+NxgtOZQIHV4P87NDmVe+eh4mRnuopq1p5uflH+R/+apajJX8cLnqjujEDnunT/+1LE6QAMZUl1R4lYMXepbF2HnTpjXRq1KF2rVoFX4lZqvDYTZKme6ON5Akubi/t6rL5uIpjxx1J9XiyfN57dXJNHWqVaRVZ3NCeLJisZC+LV1HH9BXSYrkTe4kOeYbkJf5V5jWL2MECN3c/Sg1OqfCa+xnnp19OozvoqACbV2GXF6hAeBAcF+hkqQJf2qkFVj77SCusibRUgKORagzP4CDXbTmK2nulLViZ8n9afpG+Pr5KG9G9wzy3UvjemEp3Q4xC2bcQBsy+Y/eRLr6fk///7UsTmgQu5S3FMMOuxb6ltJPSWJvWUVvVH8e03u1lrptp0GOzbrBCITteBMIeKFUM+xedpgwTyQaiaGRWMgdcGYazE6CEQ8QYbAuHSGn3HgN0EalaMU+0g7xHgvGI7upoYF6lqiT8YAcabz9MKwbP6P8YWVEJF6MVGCJ59+g3srOVA2IUSf/U7Rir31QQFHOBQ8PhBJMdSaJgEMUWxQOTDpgO1l2znUYyTcRO9Om2I/wlWExl+fK4KWJSWUMCZTuYX0RiZqlqCA1aMgCbfJn3Q//tSxOeAC/FLc0es7XF3KW3k9QrmQQbfNazswiiQ/nOZ5g1/ftQv/+R/s5q9qc9WfnFsgCCkkpAZxvagkgtOhWlWxjyBUqaXBDkZmGSAgkzz0+pYs2X8qbg7b2p/jMe+ygj11XeEg5zekkWC08tYAeynFpGBc6I0qdVFPinfRszF/bI39Cf/3w/Zb5z2oWez59jr/+nF6gCS5sDO5Jky+b1KWPKVEIaEZPVnPEXs62hFn6VxfUuUOp1+LGw+XL5gjSWLWFuW2R7Jfxb669Ar/JP/+1LE5oEM2UtabDzvgZWgq12nqTg81LVARmlrAGNTUh9RlW4+1CzSJemo06qqf7ccF2dX0oS7/VP/+NBAAIpyBUY0NcNAms0NbTeKAR2ISR+2E23odN8xQLltkdMHu5MISykzX0gwYD9nbKGbpJ9S2V0aRBLqmg1Mq1X+v5R/r+W/+5Qk3/5n9TKVPZevbFv+QtNKDV4BwQoYy7bk3DNVC8LMiCNxyTp7qxcWz5pdX8fDrM2195q7saDwJnJ0Z6I49erZBpkYCT0yj58wr6zNXv/7UsTeAQxVS1psvUmBiyksHYepesR1uqypuV8R2dZiDe/sDg1VfxxHwvaxyxlVzzxcu9prwArfGsk8+KAIFOWwFEnicwDJSw0VCgcIeilpPUVTCah8RNWrL9dkkvL891ntuqnwWt9W1N2RyJ6tiL04Qa6Pts2lB7XQj2z9HQqHulpnNPgoEu7X6XFSHO+1fddJldUCz9muKrlVIpJOQ2II3qF3fHbsytlMxJdM6dQE0KDEvpeVz6DuHoQNNoo6CYPu2ujXK8tgCVbKAvc9W0W+//tSxNkCDBlJWmy868FYKWwdhKnaUZvRk8o0cZWM9iqfR98ofp39Sqz+516LpV03tG/O6mepUKTKLoT5tB3x0e4I1LFtgrEBNvZ3NuiuMCTlZWkvc9BerLjwuOvqrIesUblpQAMscJnoTVv9wx/O22N0f/Vv/ag+i233hz6MBzqYyGmKrDBZ6lUARPXE6gZVACLbl4FfLwUDCQgtByLZMpFlqQa9tkXp2uZVfUvgbewXLG6Zd/gpwW/Pdyovw63GlauE7BryjZdfKjXbIfzs91T/+1LE24AMtVdqx6kXMXCpLNz1HxJPsS5v7VQb/70iGMVay7srPkZtVcm6HA4TGMqsPRZmEBJKJgHyxjnsPBKno4FXQx25Lx6L6kZi+AfYH0nSdZWaB02P+4fNf6bWFnPqD7Yt0epRWvUks3EIdtnPV8KvK9/p/b6Ev/oR/lEL4+ccbc/ntYZMbI1balmGq8R8eZLEgI0j12XAoIYfCYG5BjJx1kPg2v8N2WI9Vq4uLoQQY67sIzy7XOqS53bHao9BEmIYiEJbOxeOUXT2QJDMxv/7UsTYgAsBSXVHmO7xZSruqPOV9htm6Qp0r1+g7t7+Tf5+eb5tfWLydtIAAcuBugZxD21ZQMoem3GHQamOp8MYYkyCRuqxpk9BFjIXjg2tL5iFIVsdOw7NQpMlWKPtdkfikXGA/PRkLCB+wEBZzC8jDtHfLfEGNXRMjazOwEbSA1UPfsLwatP2zhupvs+yn7d+k10/6QqNrRMYL4WrB7NwaLmmk2fsFOdKr0I/nmqNOOTrUXK3AU5AZdNLxfFMV8KNu3PkVW87xcz3ymfWBTWc//tSxN2ADAFXa0eNVpFeqW2o8x3u8hBAY5dDaNgaMfInvZzwDS842qMeYrCEEDVme744Lub7akOmcSsc46XM9LJZBHNASQ5NBnf0ZoXpQlM4SpbaCYsqeYZ0U2nrZVsZrZwACcLcBBMTgKLbKuY+IRX3mq60kRVV+XhEJDFSSQX68HHxMAD0Rj9+30/HtHQ4962KjDuvaiYUF+rqn4z2aZam/0/Gr92hACBhATAJacjdysiDLfl68nZdccGUtCTqGK9sSL7GgB98NW5VwIxNERD/+1LE34ALnU1tJ7FJ8bepao2HqhjnKky5Sw0uQh/8ZtNFjHpdivArtOyIInmd9sSDHdNW2ZxiYibt+ITft8ZDv/5ZP2Vu660b5E/6QY1AJBTkgBhlsChMr4UBoHkY+kOJVZTUYV24wpgkM2HPkxmECzkoug4qzD4u+t0NSJtWqOPXURGlH33wUDZiLj+5iXMUqWWTdJxIQAR01fWg8d/pqLk+id7eerfHVVa/JTCaKgF1T5RwTVPo7G4pMpVJIBHYmKuvir8ti2Gq/PNqMpYxuP/7UsTYAAzpS2knqPixjikrqYedOFX5OHffPapbI39QllpGXoWz1ciHf+2ayL0+g+//tr/yv+tVVl0dOlSo7omm8hU58MEl5PEUtDxPR6m5GFMOKpZ1lEqjPQ32bnUO11nmSHm9LXVXc4+2Y9tD8JoapGKUyXWVp5b9n3zPvr+X/0UwN/Xa8AF9GXfifo/wYplTaRBAmgWQhQm6tLk/RQqSlqgyyUKSircNUZ2W70DCT0Gsg0PWK047IsKffGPtj/wv8fplRl23cvmZF/Uz8lTT//tSxNCADAlJX6w9R+F0KSxo9J4S+oJXX9KCr/+X+/5VzYBIuSsEAjF4Zx8C/O9kNK7MYCaT8Rkw0YnLb65mtSWIXWWsLmONLc+MiyqiS+jZL9gnLQ2o8z6jTbyEHrPh5KUKevgjV5XzQsPJ69MYR73d31oAE0EcRqBk4SDgONIoywa7ZhKtNTgHBGoIcXfQrQ8Xai5AxoqU0ytuBYnjFXoSwhxzoCeBVuFcd7eRJOhcprXBN7DF+otwNV3DpUAljj6LY23jRT998RP8n4v/+ND/+1LEz4AKMUtzR6VLsUUpriT2inbf3+dv///40QEER/5pYkRBWjRTYs7LfpPZTLCIo3C+wx6FvsKjBd3i4h8ZDiMPooQVmBvcLewOVaOVsj4oqUbFj0dTwS0ffOx8OZ+lVZUCB0vV/qNP/RBWM3T/jX6ovy6HVsvoFSf66lpdJFbuCNqAn3OOIdiqSeJ15NEqVDHk+7RFd6L8e3iNUeEyCi1dLKiNpZ12Wf02q5/VnQVCLqNs/mKoVBn0ZKnIHqs67bIzif9/PE4vztLuiTDn2f/7UsTcAAmJS2snlPGxSaKtHPUWan/+n5VwAE3GCoNL9EGUsdas2So1irUbJOvjVj0FvM+8hXT6zTNskVIGyWtZWXKyj48GXt9p7lnov4nYcvi9QD+yb5X5i5KQ424bbdaaYfBJfmJcnV9Q0dp66EReY1W+8eCNjaxP9hPVEgCAik4dqXJkomVKlhwnpAccw2yqYD+AVs6f7WTFw/0Sk0ICFh8Xctzd/W4o7i49CBzon2DyS8/cCiJXW9pW5lPfHvXCJN/Nf1//oQ5Fb+3QoEP0//tSxOqBDJFJUkystsF/KaudhZ4Y/tKO+sABJW1VQCcA0XKFygaVI+UjQuQsXQoltxFssK1ltHT2WEx/i2qItJT1wnKqTXYGrPTyVaohPBKPlqhbrrN31jMLTF/ouhdahjWsCSCSc92FDH2lLbEzR2XrM1n+7vyZ7p6XoxyIbK1xlb5yiy/bW3MxPRaxBkrHn9dZEUcvfd860NexATjLSJJABJi2Z54Nx2KUjK2hiNUFz6uISEMNyGNUSZy7qMQ5CkFnRopLvmnPOOlHUjfvRbf/+1LE5gALEUtxJ7T1MY2ibA2FnjpDtSpRre97muPZtNHSXQ2wYEy+zZJaj3/oebR0gIDAEAi5QAbwhxwYKaBL2iisPLl8Io4jVwqE5cVspQz+jHJkTTnIBERRdxVUWo3ZSigXTF2VJIuSZwkBz0o75Ro4rdn6nOvumjaduog1PZ+VFVkRIEmMQBAATzXfH01J5bVzrAHBQ2wLKEVySMdVFvjlidjqTkJ3dBG0vfE9KkQvR5rI59woWN/Ziunv6mHqwkUORjocAB6tqyNINOu5Mf/7UsTmAgsI92jnpQXSCiZsjYwwAK3//4FWADGCACQUnNzjAhYhS0mBpO0KORd8qsdY5VoL2D7Ra9alOG5zXz1yOvUjwXaG6xR+H/02hK/flJBxNsarz/EmUGbaXapAx/VK1Esla70O9dOiBEH+Fn+wFeaU9Ndr2mXf0gAgAQABcdHEz0bWa2WZdiBn9fZvIaiTixCakepU0yknGz/cldbUU1WQdLJI7kyVOnTDS5zzAyd1WK6ul9CaQ+CBtXXt7vHAQv77DhrZ96rOEhf00Fxg//tSxNaACiT1daekSTFDnuyplhS48evirfUe+76awU5ARAKScArQcpHJ0E+nFfeKW3N6x4Dz4cgySiWHvbB+oP6vmQHKqhCo0rZrGcf/iWHcpjr7xMOXbZ9BocyN6vExA7qS3jYE/9KiWZ/4pd/+n/0J6f0P/+Ty1Qr3EikmSUmq0yLteeIsq6YOmmdSrddXTeY3UB0jBv47xHP1umJY6fj0Zmy7MhTv6btOdneUIsvFms8MHfnnKKi/sb46Jmq1Eqx4kL/5oJs1purPf/mEq///+1LE44AKfPVrR6Sp0YQe7DWDCpg7/5pYd6PYHgtoFUBAzDBHB1KrPJSwlerpvK/iqCPtmnMJh4DUy1wUK7ZmFhKLAcjgEyp3gC1W2Ki1qFLFXjwta1Ba1UGppjfep4a3VzOZKOuls9mHPX54u/r//7f+rf+hZjNX5RUFYBESUk3CrUIy5L0wzJYZpm4xeIuEQ+SSJVJCUm6btRXZzH/WY8qj3c0lMJNE7uxAmOiEwUOca9HriB1lcQHiNri68oI3RtUcPH/8YO/8Ivvi9OT/4v/7UsTnAAvo+V1MrPTBZ6ssaYYdc2v/z//HN/9BsAADJdwDNhi/pTAVGSE64dsHwNXA/RcAK+qQthj9uQvsKTTBU7+Y7ZD3M3pkXOu0PLE1kIJ0Q+w10QQ/+A9ABiAAR54WUACBdkPBNMxDIaCgSdMQspD8xA84gaTUTTbLaD0C0/2Q/fSEk9y78OmUOXS4EGoJrfrVCiUQAKsDgg7bsUDl00OWr0DwFEW0q41s6rfWsJbKaCmrQBiibmZOznnhm24dOWVVVQZviVja5ZnZnUq0//tSxOgADAFZdawk7XF1KyzlhJ2u9FLZJdSbjb3++KqinyKkCFzMOo/e8KEAAlIF5kylqtkaxQGmlYfhDSBjS7kKEVJaXoZFgmp/9L79NZ+638pllXkjImCAE6lkJfPv72jCyZi//bM6CCBAJCtN5jQrq/6Yu9tlT/rVCmytLkjaam6fK0tXNIq5+aJdDsoPAuWQDrhcdy5YrnSKZqK47+FAW5sEHbCr+innUMPVAQNNMithSE37FiRN0Pvw1DnRKGS7js3dKVSIhF2srz4Tcxv/+1LE5wALtVllTDyrUd6nbN2EmLhhZDTwlJ5wUFwmAACXIau6JLEmNupJH3pl9NMdKJFAedyR1ImxfLJ5KoRKsO+w97EfKAOiI7C/f1L5FW0a2px8I6pcV8sMn+ZpuAt3VXKs/Y11bCf06+gZgmlSqf4vRLp9bvUqBADSWNqkFjgcDdItAOarTIoD3MMMqBk1mNSDezVPoHifVIOod1OIz1AITPcvGvct8zowWlTspOTa8J36/V+2//dnjshqbvVZtu77QnQWDo+JR0JZ4lR/of/7UsTaAIow1WksDNNBPxns6ZYMuN6Prl17HfT6Q7GkymECUSqIMng1I7jEJeSZGL6tovnharAxtjR/GOjiHDXATnMpQXIisKPpo1Mq29u62xcvtOzQmuaq78o1Ghar6ylK/pvx/t/8f/5v/lGnvfZQaLVhhdjdVQtz5CBbcmE+HiazUjm0fS4PlaJEdLRXlY6P0b7nBJJqyltNQJYjvYzMLt6dqY1qvtVrHKIkR+LZ1AyYcx2/nNXM+ZZUmP4ofZlO6W/885v/Vv/h1HlFoscZ//tSxOcAC/zFc6ekaaFlHuvNlAo43XrrpFlZgIkpt4GtTxZBC2SxGIPTxqYOjQMsKEZYCQKbULzTAE+2E8KyuNGooROhsPlxzo0RbexakzojJ7bI4NZLJ9SXO4lrd2spBB/GPtX1v/5V/+v/0F+5myMJCjZPvTb+NFGVBhZQkAlJ0CqEWYrCimNZUkjk4KZbxlHYQybW1E8OXsIlQjx5+4LtB6s9vU32nc6O3rIu3qd8hCXdJCEYjrOyuaQhGSn1f//ITYlH/+hEJuxJ3schCq7/+1LE6AAMCMtcbL1hwWit7rTzij5CBANI7U9+AHRwERgAgAmXBaAjxpr4H0BK5TkyRrbUQMRzDDsE8+qnH50A+Do4ytwelQXOBEgJgvDDGJm2JIkY2w1Dmd3aS4oDVwTuTa5KDEOskREqRU2ETqUtGyyG/w4qEAAAkBeBPlk0keqKPLJpU5kA21leeW7flPzARC1OSoGX8nc9V2M4q5L7jD798j2yervTWu0Xn6GfEUdhiRY1quDHphmz007smejdarnX+ry1516KN5KdJWkODf/7UsTogAuZb21HlPNRhjRtKYSVIoLTNRl3FWRtjjJUev4SiAU5Ak4eB4IYIepkodTWK6QhjGCAY2wFdQP9FiD7ugFtw8+D3flDBymOExRiB0sE7BAbZrWfMSSJytxI6ZLS1S4FGoJSxWZsaFphydX6KBpvRRQKbtCgl7NFqEYLoo12py8mU4mTtkRylgOs5m+Yy8tTYsT2PVC4MqSZcoXQogEdI4ZO1Os4x2Fswrp4FYQRUdiF6imRZA9DTwsIBYOnAVW4NfQzUIyTWOMjHLE3//tSxOcAC/V5a0ecUJlaCK0o9Jh4TMvXOKWARofgIIBBMHoOIj1yljoSzBKql3IcLDaCg2I6xf9g5s/xqUQrsjd1zO5bcjer7Sjz9Rqikh0xHbbNYjDco1kc56KL1oimsZrrWVbxfRrq+q+999D7f9f/yUYI0nJCne7VHi9AoguOwVVG3Ydlcq/2LSPB530eqB4RTz8ShwJkJktSk51BVoWwci4oQUiSbsursVfac9eQ2yHz9bTEDCh77Y7jokOo5eVrxHb0WduZNfok632fEJD/+1LE6YAMuO1gzKWLwUkLbajzIVowhDVgln8wAoYAIIcvwNGNkUYcRyrJ5HaYR5Ic1F7k75jfHhWsT3VTVErnA7HiHAGeSWIvtShOYMrNlGq+MUehPfRznYaCWPPWP+4y6WQcdeSNmLFHoVDH39l/TyLH/8e7ckoBAgAgAGrgDRDj6k24QC4MuZgo4iYWaTF8x0cWEv57wXzbjm02TYpgM/fUkfBnpvdd0YJ+thRlC7Dwe5xCUFm+HY2uCX2a7DxD6fHSdKDxm6o5qWLpTPI//v/7UsTrgAyo1WtHiLcRfqstqPSppn2efyOQwUAClGamEw0UqzSIbhllcSSxQw70MiyXSUwotyo7eDLtF19iuauc+pScFM0QsxlFbNI8WlC54mLzy0oMb0DqmMphr9254lpXH3SkwklorN7KWdnUqZoo6W/6//jUbW3O1OQs/v8o31UOIQFAA6/yWBhyZkfUdn3VcSVtBEYcQwglUuHgGlKGk3Ll8enQb95h+gshIaWrqH/UcJtR4klWwxOMHegrft5Q4ZUsT4kLJxHugkw0IrPy//tSxOcAC5z1aUwdb9FuKCvph5y4rv/gr898n9oQAgDTuBFkRoqk3S2IFNFyM1ZTrYeMPOpVeGT+rZQDyY5luAMvM9wvJZ5SnML2/km5cvoHOVnQQvdPIk3nuA6pcZ+67rP1Hb7m496zvST6HO5stcZejzLLlvRwXwCn7Sf35r/+KgIBAJPfiKVQpLqeDKSwQRPKJUOHVmxQoYR7xkYJxk2fawgHySaFtwBAuaUth7D9itnniJOL4rIZTQmmk0CIhHjDZ5k4my2ww0yhODZw6Uf/+1LE6IILwPlbTTzpwZ6q652HnTp1EC51EqleI11IT7zDUbQvjJz3NSmSaeRIVpmjKIq1SAukgNmSx1AbZph7q080qstf3fuuBcOPaFFsFluXbhWj1BBeAQAAXcJIEjORDlCkmQ3KnmXQBMiFDMkRq7MDYyYo/LuVXndNNCVmefzzsFt3awzaKzwyViK3a1XXzzsBDkE4odSt7/qOW032+w99X5t3pgISywASQApeQQUCaBD0BP5uASgDoyx+yd8kA7OmTp+0n63UmY7tFRZ1df/7UsTjgQrc4WFMsKnBkhjrqZesOYJXJGBslJPVjUVSref2bfqxvX+UjhwGKmE9RaAnMTQ///oao/a4jnd6lAEGJgAEFIuQpheo9VoalroQ8HcTBLo6CYzMuTxesn2oiiQTJksGMCqkK3O/apsWS3PshnjQSjQ0sYTNA0MBuKS1Yz5QfqFOy3cWc+NO0XFj2yvXDdmdTaSSacqTsSZDyohFULSiCfs5h7sUhiItKO1Tr/E6ZxCpNEms5y5xKuJORULRWHbfOj2DxeSkWGtRSWYi//tSxOOAEf1FYuyxI8FDliyo9I04LoWihbeM2pEJEVY5jWWbHD71VuCnFQAJAQAAAlLwCHg0KhEnbeTPEpW9SdDwuHOXV12XTgCGkg5XeOcLOrBIOKrcdEMTf43mM22Rh8nsxarI/R3wfNSTrQ9yb27Jym5ho6a8kvvbJ+g7CCS6tnV/Y0yG1QRgIAAaewBEwFEUxZ002s+ypk8cx+PGiKVD9E2IKZ2nTivmRVoKFh0nE6oZFDcpQxCTlUUXGNQtumrioyqgGDMrKGItrujaL6f/+1LE0QAKfNFnrCRHwUwSrXTxDiKPF63/quhqkj0AEmpcY2oDJFsSEk3LQFUIowu04cm+FzD4vXELWAVpUNrhHzWwMxvjFltXtH7WjGhx5h1Vc1KFp1XZ0I84jCUZta01tG0PXo5zscjJSvNyEuNHrPpJjmyDlPADiW+lECAFEBu7gyZQURAjM2uv3Ab8xpwIdnnnzhrUklw/A21KoSetAuEGdO2WEO+5JJ+muSfx1akZzn1tz572o7bkW75fc9wd/h+l/04EEqJv3d2O6Lczov/7UsTbgAqgzX2nmLBxcR7r9YQqIE1ig2vsEi1JnlqeACrAAKScgolFd/a8BWoRMcWnCGZah8hNLTqVP4trnQe3jLSDE6+PnPac6NVXZGV0qcQS9nMRTT7nWdxMPuIBwaBBQadz0I66E0PyEa9m0ZaEU7+comH3IQUAOxzyLr5voEfHb5m/AT//Jh8iCZcXTIAQCUo5CVAPgCevCbQYL0MWWTVNzBKac/nD351jhCHChccL0EEzwPAATpAZYbUJ1HA+fao5WVMFnh0JrL3C62FZ//tSxOCACyT3X0y850FanW2phKliCvYzdAIbJLaGVxDI9NwQgoABWg6RpQcjkTidQMaRgSJgJgqNozAnaBVZtXH4SnGhSRCWXtdYlo2VULjwWEppViVxU8Gm0NSmkxl141/cZeUYuWKLoIpDRVmXXl/D/S5II0s2blTIdw1G7Cvr1v+aGuqkkopy4fY3RKugHi90PhKI5ISQp4Xiew0ZMTKMRxBzPHutEKV6mB767lKxUe87E9yaNbKhrC07F+ja/samasysY0SFLp7CcsFQVpH/+1LE5oAL/PVfTKxvwa8mLSmGFLsoY/5488Sy6OWNNpN3Ge4DwG2pS6KcwRroeh5/JujYdq1hli+BGeMbZVCxMQCa/8i7szgJbSImebPlEPzuycsp533Dh/f4EIYY8YBzwnCISh8AL2M1c2JjsieSfJzx6vu+a2vqBJbjTRAIISgkhI0LW0GXiKdgooaJenMr0GuSEYtBEOceVzV+XgDr1fQdK1ov7iuWtHRmosS2UIA7Lcwk7HQfxM3Y47q+6Erc+6wZjq6zOwfLKazsPeLpZf/7UsTegApcP2+nsMHhg5cs5YekAVVrQt/arjieoVJICTlCoAjylS0U12Nr9bmLhYOw0qC+VIA2ofUXnKOUXVKM11gztBxJSLFGCziNo6lbbwQ9MvgvsQp3CCXap24Xyme6r63yssrP2t//lFIhdSmVw1vE6Ltw4MUnrmiASQDDkCZCtDvGuTYfRdRVLB/tqtUhvnYucwPhTbsz6yecr3Dnyq0Nrm8dP4z44F9rgCqtEFnkccdWqyDwiV8zahiPUK3dFXZ61H+8zX/9v+ny+Do///tSxOKACkj9c0ewQ5F4GbA08ZZu1RFeyJhwTdsEShQkklJwLoxS+B/k6JodR1kU9XlhZTzDRHQmRllY/divANvNJ5Bp7jQnOyNht3TQZq4OAKPxYKzer2cmJ1uFCnt1ES9h3mJR49NQS9Sev/o3/T4l41zrP80x2vIqKa+pIJty4nGkIEJLcOO53mtdIQJGEwS2no2yTUUFu44KhPRG6I43SrDU8xWhM3H/jDHsoins9cyaKGZUCAEb0H+VBaTfm+K9M3UD8nxHT6C/P6F8ZvH/+1LE6AAL2Qdxp5iu8XOlLOmGCPJ1U3ivEoot8ipKVAwAAJggOk1YVwSENhahld3XUjUcjHXgm8ITjKp3CGpzKfrtiWZy1Y6BJu6c353QM/3wqb986R5cqGJZ/cMa4nbCQJ6bKos/+UHVWKfMgU1QpKO9P9OI6gSi3FEUSUi4DBgJVIoFSqQ7z6jJFUnmo2FLphgaoF0mhLivasQ3UPUof9W6Qyq53hW/xQXXNGfdvGOhj6jwd7aj4ES7ZhDU4DCR7IY88w8Ft5s1KDQ/1f0/6P/7UsToAAwJMW1HoFUxdKZsaPQWmt1IOyoNjCF63mq2RX7qAAWww+AjBKhEEvgDhokmIrC4gKttFk6PiwyhGq492FKrFY+1JZ+jBRajOx7AqKlnzFon0jB5RVskXJJw9F7Jzg0OiAKhIcJ12ttBhkntuDUZoE3txbXrYrK6jU3b1BOrpFFKNJ6jqpqIyA6WKomnTUZ2L4oxIWMNF/r+0/wBkgAAHAZeXvqt8vxPAjAMD5GJEZkaULE7knJyGwY6EZJ6fooD92DKnMKuSwbSMNwM//tSxOcADB0zbUecVVFZm2udlJaYBMKOkGcMdQvuFFH5zOcFCROzN1zwz+UchGW//t132OPqC8PgARHScASkQMw0SVxGz0ZtMLVHNeG3RdtaZV0kJSi/9b6jraRKVPma/3iUe+vbfWisL2tZU2s4M+6+gYXYlSQEMF3Kioa+ewUnWpHfT7uuYmZaYSRZclFsemgzIFDOztLcmKTry8XKQkzkDpK66F/XwTVPySYjn7svEdDHfmdn4+joyKdws5yun0/9HRRhhULEQnCZOSHWyVf/+1LE6QANCTVxp7D0cfMhq4mWJTGzad0bvoOAY+n3gKIYAATJeCvPtiqkzhubxRNVOLElYynblgeN6LM1q9vhmYhVX03Tu/NoSDLuveV7ugzK42bUWtQYr2Cyn6zUM3t8RepRyCyntF1NMIjGs/l/t7NLlb+UCTzycRSTSbpfYilNDJ8H8mUYXJJrKeH4KU8V+ojhO3w4imuFgYarIIO7iyZ9lR5qS1WNNc3V7XE56YCRsiHKdfPb3pj7wdYGhdbme86kzWpTM4p+Qo4uZhrLhf/7UsTUgIpAtWUsJGXJRxZsSPMKmFr6etYXPKIm4pejpAUgQgBFt0BScFQQo0x8qcvhiNB86Sh9vpkKjWdW1HxLLCKTUvqT/Vt2kaUbSOZ1V8o3tdzjLKUEcM9m8//zVu+bV5sg+JZhZxrLNWAb21P3e74mGioFEb3LmkEIIRJJblI4BMkHIa4xmE3ll8fM8U2lPBaL4daaoumCE3mrqu7ByPtx7sKzxgRWsKYojUfXAccfIGefdFFL99Rr+3jBXdQ0ikMSpaTX2/0p9hy+3/J+//tQxOCACmTRc0ekrVFbmmxph5T4cLLBqJIDOUUVAKCpl4Qu2BNqwwiGlW5EnZeEPNQ9VaWIxWA9ELYWt3OqlLZlk1EuxuO1fYs1PCgT5JNLfUkV1rx8o7O8d8mvJmsBNZuGE7uu9xHl2iRb873hkMiM2O1gQOsE7AEnFkgK3vhxv3q9hHt0sgAgISgUwASqA2H3BOIh5joqca87Ul0wiraPP9F63+Y0pjfMmR1b/ZYRbebnr+35DNX7zh2p3OCbpehE5IzHMZIKdkg+4LvLif/7UsTpAAzZE3mnnHOxaRys6POa4sP24gW1if8+XJuetv+KHAg6XQcdIgAUQCQnbsVx1NSEnWoOkwZOlxU4Sm151s9ya8t7I36C0Y+YPjrUyuwRHch6uYjf7s1E7Kyq7F2Y2qschmFnKKoDQVDooPTNIQIlnZg6GmZ1ITERVIlOnpKKYSIkx//0VQkAAAlwEpR6bEnLcn1ObLIxHZDfq1tS6gvavba0uwJg8nG1573xVj2Thk2KA+GGsMZvrHrCRR+znaM7PFk1WA55kOeREHpD//tSxOaADQkzZ0eUdxGCG2108RtURwxYaOh7T+guoXSABPn8YGNcVBCBAOflKGqMNcmYdhgk7EQaGBGsERcTRZcqToX/rA8QVLNYhvyOd+nYaP6VjX2m+HWNGKpIg1BUoPCgdWW+HeUe8WqBt23mH/BRuvvRdlK1IEgACU4AYB2GeCh15uIIoMOHiw1BVDpfew2bdoK4kTeHzcXYrNbwpSbvFq0g3s0fJmCyVimrDsRbr1Y+7a5T+7he16l6SY2NE6AMHaurpnhHinNPb1v2q5b/+1LE4AALnJtpp7BL4X0abWj2FPAs1QfIlXrF0vH/SABDiAHgVOl105i6aYMuKLBYTOYJjcoVnhaC6lVxwAC0dITcK4YffdEE7H/NhtZNZ7m1cUG0/L2aSHgjhZHgg/RPsN0pQUKTg5rojpIpSQFNSiAAW1GQECUorRvK9NHBkISnjz2r7mOW9FJ9IslLilNQUKmSw2ertW+UsGfcs6tZVoVvKPLQ5Astx9QZZuyrqIAlrRUuv1LYTfLE2kDayQSYMPHQOosSvOOW+9ni2Bs41f/7UsTfgIs4s2TnpNSBPw3saPekICweCY2j3gKACSLkETB4sOqBo4UwOAoULWisdlcnsUEse9/stK05kEnmE6dekslzMU7rdmPI3Snb9hhiCfuRTIZS2TUiO0Fgy1tTIKCFAvGYiXtSLyjRBNCSNu6fj/9HUzFpk/B+lbdBnRHwQG0fpSZJDkWVAAAgANEq8yzW6rBJVFxVbCHBMsSOrRR++UEFL6oVskYFfDesdY+UfXOYawZ5lbxF1ZSOFb/WVzPv7vCHKr8azRvL9NBeR7qA//tSxOiADHSzXuw9CZFDFmulhg141HpYw5MwDxbbntTQ79fyH/6N/+n9W9fn/lCH0ezLMb5q6ZMDwQCU3xLrnNPKECSXbApDMdYkCMolCBXB6HAhq88yAIHjHKj1IfhjUY4lnMzR0aixa3KAiIFpvlqf7/09EUJqPgOvIXc0FR7H1d9DIPlnP6v926sn4//b1Rv/yP9a+/1/KDn0ove5/T3VPlX1qgQ1OSKaaVWxAL1q6TEkgqVYqUEuY80ilf+mlDrx381A843crTNtqGXJqy3/+1LE7AAMvM9tp7CwsbYl692GijpikHm0teeNgPgPMCW2sSUvvGLD1pS+64hidPMOPtoJi/7VI3rXpDtUHVMc/MdOwzfoaR6GmFRBL836P/+a/yn//8oOfvqk20970fNLa5VlVEoBJiNElIAwOZVpQVxPEpGTGJrIX9kWzInExXSoxy+dVMUWi+P+1J6JYniZ1Le2kUVmb/+zqmLXoSU+z6Ij3ptFgBRylYxWO80opLLgV5sglM5OU6VFNEpI3sh7Ikb/9T/W3zBX0/ppfX+RBv/7UsTgAg1hgVtMvO3BtLHrKYepeN+sUvZVd4W1LP4A/N2H1TUABFqQxPgVeVth8abMXeUi90TryeNyi9IKfV9DO1H37rWKkFRTd2npdNXwmkT0ReGDdNX2b/6vToTUWUrAsARohnx5DGuFBiqeihMGZsYIaKid6torLKPuGcBIgdV3iO0I0fcfYgNGnLOXn2KsUQdHDy5cruGWViMhDqauVksXR5aCB58LC9Gz6wUHowiWgm5uUTekzmUcA2D+hqh6q5iE6ZXv8KRLiadqiXPs//tSxNGAD12PY0w9VtHwMi109o9uprtTkn5FDNy+wVVz3eF/wMpW1QyHohDeVxxQ+BAkGzpZpC+X3qinI/431pUl6PM/c9UALwAAAC51O+cU0dUYmR0BG+VPUHDcR9aZDusKz5ZH/63avVR/JjGMjun2KHHVLOBK5jVrcQirDXQjYcp1f0f9fE3YsSmirHDRR8tSAlxRaCScoanpUNzZwnh6N1pUPCKfsuon5k41ZtM4JKUmV0RQmqT3RMIpi9Vd38Nt8X8xSldpXZ+ju3VFR9P/+1LEtAARIU1ebDB3QVEVLfT0iXhns9+hf+//v8/2bt1MrujKrSg3rfKR3WM5QXeuxKoAAaMImEFRziIiw9KxRicGjJWYs2nimeJ0TbB6snQTlM/fF4kudvEkqFOdEp54NED3anSiM/EXrhlatVHObR/QRGmdHNb8yYpZ00KCWiyPv2ZVGdeSTj+Z6xxgH2iiqC77F6QQCJLABZuLRtKTFGRw+84WKCho4SA/cuaubX6XnvQQi753JptLW17YgPhV4hNm4xAs4xp2KM3UDNlwdf/7UsSjAAl8f2tHsKfBbSyuKMOLAraMbbVvUFBj/9d1Q1+zDoB1/9P9Pyn7lLV2c12VL0RyzdVnoa5oveeIDDLMlQABHg5a5Ek+Pk4ToRyK5ICnDw0k9QtmX29BKxH+pc/dz91wPRD1FlVwkYQZXsLrxyqaaQo+MdW/XxYYZvM9vAljT5UB2Tj3D4OrNhQ8HgcOX6+U+pbRJoQUq0/6v3oi+R/ot22+b+VHPnHoVOmCwCFyXvENdwYdCsygYjhD1IOEM4mAIZJC9cUMPtGKWOtp//tSxK0ADFjfZaww6cGfrKvph5043GtD0YvG8Bdk1k/w2HuIw9cKRMnYjtVu8imqV1xQHVBN7ApRosyZAyE6RTV17ExIagOBNX7shuke9H0OOIgJy9PtSpf29bEJf66df2r0Fn9zDjpEJxZUM0s6sREwXI6LEgACShCmmk2qQ4eg/Rxn6sDCFwLueZ3NjpOQkEo6+gm8q7W0CPs7w091tBTxbAXuYjZ3Y9hR2gVrBPf//Fw/jIg33nAuMr3xaKG1kXrvrOUwZEXSXvapZXoJHWT/+1LEpYAOpWVnp61aYeswLOT2qx45qpMHUj9u8qT9kX54vQ/NK///5P89s4sJw46Y1THqyC0tW1bVgCAcAfBgUrVuEyVfhV5iAVxcx0pZA7zxSX3bUqvGAFh7Dg7NAIdP2h4uyfKfc/gPXNB/O8v0W716Z2IvLu2vk/qY1TyOc+s6re1NQ48fI1IFM7xTVM333m836O8ZYuYC2nf//5nl6e+EStJEfBBTiHPiAMB8CFP2lxwYAACBEAQQIMg4RMZuDR3IzBxsYW79uZWeXb+G///7UsSLgBAFg2WntPyR66LrFYeiONxc9tr+R42HjNjUjShHSkLgcCc3zKN79AMH2qqgNarHbNbfX7W2D4ESjyRSWFCdSKj1Gjo9+toSFIQCBYUXeKZZWgEAAi4imDXhB2vOzL3FXezaG4flskvRK9qi7isJXTIjIrHwmdGleUeaR4J2Sz0COH/qeevYnDDco1Bqq8nNByLjVBRnp8opdZ+ae21jafP99bQwNsMNrG2LzNIENqoMDCNrfr37dyNVf+8qJW0t/6oEMwQQAHeCVqsL//tSxGwAC8inZaw9BcG9G+yZhLIpNnElj1O1IwYEB9lxN8BNOsAf6DzYoiTer62tLwHaFQOv9oQBV8hi+Co9QWR6dqN/8WRnTRWMhmuxRhiFOTjAtDw1T6xGErh76SIOQgAWlYdDtPhOkwqA2qLY3Tsut8hfr8lz7VGRWCUYMvYrQGiUe7KJjn4rfuKPR/qyc4z0eprJ/7KNGMUibRDWQMzzaCnW7/7f9mg23RNS9JkAKgAQQGnUPBpjzwPUiAZlw1KrqI+cM4VJ6quh5Oh6XEf/+1LEYwAKfOlpTCRHwUSdLV2GHHq15Re6BKSZ1Qf9Cz9B831JWaOstJ4x9+yP/8dZDyzNOYxBLM8Rp3V1/7f/kn//9y3c0yysGEyYXRoAIMbQCYRNbxkAc32xCNoOOBCEguFzzNUfOMlTeJZLqS2pR2EW8Sw674k3jR/oPdPNoFhlv+//w1w+BBVBYVKQxAAEBc8orL1f15//8d//9f/6Lu2vUKd8KwmlWkU6ETnKpjeOtPGsdQ6kUpkOG4UK/uzvV5sL+v3KrhC+kRnEF1sls//7UsRugAtJT2lMMOXRYrAudMQWGjq0R+YTrHVvIP8INX/X///6ijJIIGWlzBDHdJ5y2vKcN/Uf/5QLf7tn/KgNJyIssklgxJnS4xDUSYonBCkW7bFMzxortcueG6n6xWjhixV+tYAY2KKUB+s2Q6QJEPChb0c9lHTBf7b3Vm985RwBphAXOeVHI6yCQUWF0FRNmxA3///SQ/7dv/bd6BBqRNAwxPEPfHjGY1XBRzgtqFGzObC9bGai5vmyv+v8pL/WrGi5Pa32MCFP9DuvqIDM//tSxHMACpT1daeVONF9pS609B6O6z8gho4/Yj+8J291f/NT9fx8JCYJGpa9p0pJcjoSAflyBMJRoH0lJuyYOJ76/r+hK3+dxH0+oXNWtZUlFEwW9RJXcVcucZ3CiwEbTuokjrMLflU2dY/TN7ZrUSY7lCrVcT4DElachfxJd+4WdKDUmQlUF0CZkd3T6f9HFprq6/UUl1mmS+ZEII////J///KfvX0bd/40Nt/pJggGgFVnnQIGG/7FnzWzBEulNCqW5pni+PKpaK2D5gfrjPH/+1LEdwANMSlrJ61ZMYmzrmj1HxZ9zAjQ54OBZXOkJ5cgNbaCD1wEFvhjcQKVnU4Ft2y4qn/h4UVPW8JKqtGaOoTDMn/o/+shiildZp/zwL7rOwQwtR6LuE8P1DGtqUqH7PLeqw4a1iN9QjH3ebOTnmpFiRSyP51jLETyfP/JZ9ZwEGnewGNVOMKrx0Z/fzv/UVkyZQs59ENPA8wcMQ4fZuIS3r//+L/+dzH/RRBIA4vzsXQ0AwBMGQBizCajrPpDy8VEvtLPReQzozUZtDUQ4//7UsRvAAuM917sPKnBdSUtpPMfDjnV6LB7bcGIP+Zz1aIglj/5KuP/EoYYslGhcY0j4T1qKxGK6mkz+g1+voAYGo6lJVx48Cp0xDRjK4Gn////GP9OpAAGuAaBkxL8M1cB6SIy0ZdMyMSwTN53UZ+PGh5RcwDR143kPvVZIsjAXoaeEJ6ag5GWVoi9opLO2aHpapb1Mu7IXb/oBd7quhyQiMK8o1siX7v6j/+7Df/QAIEYgAmN0oxYiFLZxmwPFFgmMxIBK9iKE6T6Z9yBqqYy//tSxHACDLEnVEy869FlnysZp5z40KpPkX9PiB/Cnx9/QZ9aev3+nxIaO1dzHRQElkdVE7aoFn+3r9KdRG/+nyfoNhlb05q/7D6o9eQgEInASlxD/KdGF2JqwnErZ0UXp+svqNiO2tZSMGOJaxJdbsTUxXKFfjZtJNvEJf0BLSJwbvQ///4+BcsNs6iIUAkyFzkE7q2I7+j//+OiQ3/t6p8Kt/7f5eoQoDUwEbFQNA1VSfzOkpkko4RrAklkGkiSJ7EIwI1ql+C0IJt4HNQ+Gln/+1LEboILBYNlR6TnkWiwLF2HnDpI878m/Wf9Rv2KzT/1t/8uCkdYpqOoVoLH06khkSkmyY6Dcgrc2RayRYv609Rr/9//oHXd6vV/y1Z70AEiIYABycA9pPsPas6i2GDSuH+SyVudrUplsvcX4X+8O8K7kVaXDgIZu1a7a00v5AvTHQ/0f1Mb/2/+LxscIzmXPHViIzKJzxeahTE3///5P///5xf/k6IAxSBAAOjgW1BZ9m1cdbCv24hWsiB0icrNmkoZ+gf6f352IXa0Ho1HjP/7UsRzAAydgWdHpanRX6sr6YMeGDCY0Z+JvgolsoH/L+hZP///LAXPFbXuiGBt3MRRWY1YqLf/f/40/+t/+sUoRkyAK3AYwcBOi/lsei1tSHNkq4GG80TKDbPfAgDkGUYqu2FjQ/ImraTNkPjzeLm8oX+/pX/3/+cKBicw4QInnlwGmHqrkB5neeHf9Ff/RzgX/nduAf+iBRcTLbpSNcxdHWEbkcHRmfjZS4IAxs8YolyBPduATyV83HvnLdI9vZ9vKamnVvG/GD/v6HJ7f//K//tSxHKACmknX0ww50FiJSzo9Z1yH1ddrMgSJZnGVPhbf//+oWb/0/+Uf5F+w8Q+9oQAAQcFpLGZU8DVUa2F2pbNs+ee3PSKmgN485+kzp2xVxcdZANHH26BIW7vYwyaggQaRKqh9fAgQl8IyIiOFz3+GpeShGb0OYf5/X/1Bv/9v/haCIrLErgBbkAAwJFUbJhzJS4Go6xq0GF4sLmz7clQm8LCiyUGiZhc2pGR5V6yTPV7jDSEC/5iFEGFgJABVrB8Tg6Gg2ihp8DBOMTzvp7/+1LEeoAKpVdzphT5UUmk65WECmrUUuP9yYsAwUjZwsI0BMRIUcB9pJWmEoVUW14801OvhX5bRAm2FskROBAWy1ScnWtpUuCCZMVA6J6iG0LX82bRb8bQ4qTONUKYpxy/X6QeLAZgxSGZZ//6f0UgQgAAAI6CBjSYbdFykJcKbHRPGm67d6Gt0zqZTvKrgWJtvLmOfCUgFdSaPd6lTHaFcFPtrXvKi6Ir6D0I3t5P/ODLAppxR5yxA44NzDt3OO8v9YClEwQ4h50GWmg2kohJ/P/7UsSEgApkY22mPZCBThTrxZeksJ0RQ5miNCL4cNp6MQn7lB+XIiVIowBL2HM1zVkDm875hzv9uuQklMx+gsXzqRSACP/4gfQlGoPpdqVybd3EbvFvrQFOACAJiUIWt+5cWk6SLpxOJVmq8jMDVmdOPcsfMsAaRCGCVfFkABy9wMaN1mN5Sv8R6/WK6B4ztTKoTb0WaAT/8YzzrXKO/2Q1v///qLfu/QABAgIP4CMDzXdeSKE1ngkIkXOmDpWPzwRSpxUAtzTF9DH+eKug02bX//tSxI8AimTHY0wgssFCm2wc9BYod6xIWW5LOrmFPRLRIM3rrERf20MIr0X4Lsycp/6MgopGqq6t09PUagBAAcB1mmWmMlAnOAmOPSjwZiUuaemclKySx9OkBH2zReV1+3XNPWvFMvGhhFmD6WwT1R7EHG6axoN/oM+/haEYxarI02rroPYNHlyG5vQQRihQDdlooAdaEtpfBB0uZsZHEzaeSn5hD1bSKVMligS8lnAR8jNbfeKNfQn3/fGNM8/QgM32ae+/O4iDK2SyOdh7JKT/+1LEmwAKLSljTCCxQUEkrCWGFPhqiBpaUz/1pUAesEv0VQEAAfhUcCiLmKDMzIVPqkY/Tj1lXiKc4cFtapx1d1sjBwKIqF+hPtesQgTY4OVaK9cW7rfFiMv2iQ//z/8YGq2zWGB5ejOmKqRLdVHspqGU6ah4AUCkoJhTbmC/Liu1tSCathlRDiLYzDpeAXCaMn1tCZtSEA56hJnat9X79hjI4oGvQwc9b6NfXMxAT08RH221mN0379Fpe5Vr2GivrlHQCaxT9b/0qgwUK3SFTv/7UsSoAAnk81zMPKfBSB4saPSVcO9+HQR+DFV5TKAVEuMHlBMEMi1Ejs90u+sbOhiKMfR96NuUEupc80aqfIxE+Z6FrMcZkJhcPvbqaG/qfmlf+rfbz29+pj/6N/oRndv5MIZrOJEUF9qsdAPJPLCPu/aq61HCwilRluqLtNKL/dytorX7XxN0qv5suOf1mwS9yzCluNSD8bM+JiOdPfwz6ePEm53PKv1E3SFJmUxCz3+3/ycItmJMzCw5UngTispNy3K4vL5I6DqVBiHhzc20//tSxLUAClUHWswwq0FSIK009JV0qONcPKI5+ZFzk5qTn9D7X6K+6FVPX01yeJl9ugx/+Mcur0jQEDrXRqIv/3/9/9V//b9JRT/0AQAAkzR4hLIxoTIDJBdKHq5bi6WLuHLIOm2lcnsKjR/3FI+6BEL/iEAqw9pPJvTUh//goPSjyrXZy8V4ttCv/oEJ7+CJ0TYGfZUED6nfvf7fp8eqAAAhEH5IlsRVc5IouFqqHu6JktqGzxQihiOH6Md4c20ZB+Z2z8wq43k8zqIOgWMlKAn/+1LEvwAKcTNpp7FFgUmY60mGHog/KXwoEhnN6FSfQzoOFv9B8hxwfAxhlTlgcPW1/M+v9nnPQQM7JILUSgDKbifmjCxZUSfZELlaLZH8F++zuxvTZYHgMBDYhiBsahX1F/nt0M91bGQNbs7C4xiI4KMLXn+AeS+b1Ho9cVI5Q+8jZVFaMX8to2/X4I0R36QBAMKAZJOSwvRqxTPDVkSwRkgxIfCDSnW6ELi1FVFg56hKPqP/JPx1ug76+cBZ80blrONSXMO8Kt7+h29tUb/q/v/7UsTKAApFYXOHrK2xTBtrGYWKkIvKnP/26/X/9f6FBH4l7wICAF5vKiOhyXqjsNzWEZQFZQHYDhgcHx6G1EGWzn7KphKDn25vebHQTltCg0Ts06OB78cJmaofyru0UL0ZnoOaYsA/EfrefQyd+6Q+5qvvEAiz50i+ytawgCgyUcYcrxzYZYAsuIP3Ln3bFBVfbwPpIGp8j8A3KszrO9ZzRTTPN7HeMjS4kdRl1k4PBd1mxoi7hVVQ5ybholFqPZWTTubjqO0z4X+ZG8XETqZu//tSxNUACpTRWmw858FUHm0o9QpyJInGi+cgcFO79CN/+gQOXc95MD0J6g16iXqmLSQrdKJUqApnJcrKZTSwiXqXnjySaWddjaB91HXcaV4iCpO0wcFDMqjNbTBs3kRfum6qDxPuiMv3/8wIRL/ezplSaRrF1fcoWQCH/llg+vs+kGm+ar+tAiGABE2DVogrvgZ2X0VBAkOTsnjg1Nvsoa/q2LDArFXLD76m3babgfXzq+T4r/fLs22d8xzzGkx9rv4yG00m7MueReneOgdKEST/+1LE3gAKYV1rJ6TusUAV61mGHPjjD0YgNFxsxUJVG6Fy7U+3/+hdjR25238iAZdA0rLf1oGelirZICd32Vy2zzKkxr0kQ+niKtFnUrmMYxE4xnezfg8GCSUyFmSlIgmhWZhItBJEUThGv6y2l0yeVMVKO674XGr3KPIJhKa5Tc7I2SzLmrzXf1Ki73+rIuz13GcW2xUxTKGaFoUAhBwEgAkFvKFAhyZ1DMuthDYiVUBQZAizJtPHUgbEQJrNKSlSpfxtGomqOC8u9GKzy0uHfP/7UsTqgA6pJ1RMLLcBZh4uKPUaOs9TmYPnQoi608gVryjSTkdFhfSVh2JQFS3/FDCqKQy2qmnNKtikDYuFiEPhZMRKXMF8mjSpTx/f/ENnEbFpnCRanL8g37scM+lcGK71uY4vrVs6brtdGL6FdHdrJtXunVi3r20d8wsyKoK7rvIqBChbJXWoGJAIoONQxTznNIhRxXUhuMkUqggQunTG+oHai3anIuH0/5bd6bUTAHj79QMtnl46Z7MSU5t4uk63RyiGjUNGtvsoOSTWm5zH//tSxOECDF0vYOwxS8G2pWxFgwroFtfaQMtTuQvD3qfJZL/yP9KnHBauOaSaTdTYm5bni7HIvp9DmtSnWLWwL70bTziRCaUDeSlhxTSCKQclJ+14L/sxB02ejCncOHFXOqz5JZ++5R0rokDP6pukDgZav62/uszf/p/1UUv+r/1Hv//65//e825FABsbADErIL4p4BQXE6tZUrvPa7j7L0UwTzk8TgxWexN3IXdonU28ICPvwjSlnhTNU/vvQ8JJLajRcbgPw6d03O1wrYsNE3n/+1LE1oAKYJtprCRHwT2k73DDiibP78LW5NlQgtVpnzQKwaP/iP/0Kf+Z/1Lf9P/KDn/t/oWJv+3W/l/QQJAiSgubN2LiRIM0F4xpM67tPDfpHbMKNO2Cijs+nEvKrVhwzN41LR7TonUbUBFRs+7cEfkZ4+YDq+rpEQN1IsqnSIoUhqguY6SYaB1fvqMQI0lV/4+p/8m/+Z/9i7/1P/ziP/h/1esA2SCGCAVg3IO+nUy2sLYd942k08qeVAJy6+ckCNiMO6E80pjPJriE3UXX3v/7UsTjAAwg23GHsO3xhqwtqPW1+h+uv/ZdiTM7k4VfOvm64Fu1zllUA1M6VKpkgiB1f85Cajf/0D/+xe/85/5t/1f+5///+sx/9X26yho0B0AADzi1S7CFzqURkRbV5afLOi06fTAxqQpaLEsU00rhVqYZKrk7HNBxbCoI41esnAeLKTWdPbGQxGSynPoxqCioK19Qlxl1v1D6GF/qJR/+RFv+j/zpU/6v75ibf6lqb/n/68gqABgRWAEbdUoPFFm1bIBiiKE86DiSqKyyQ9us//tSxN+ADd2LX6w9T8Ggpmslp7V4hN7P56D5W2E5nq5NfO87m383hTf9qEvjKuubO7Q8G+XHWbbi2h70NiW60FVKQUGIZGtB6lsIGLZ/8nHlK+tEJZv1aX/Yo/9X/mD/9bt/nGfoyIWgC0sNNgquvZpjGgItDgDMZBBTOZAq1+GW8FszN7KugfEJuinvABFOVmCyu16LzUsf4YxsV8Wq5c/i65IuvHxB2hiJLW5xB1sJMGSjONWimMCDWy6moZoaK/uK11/qNf+o///1dIZm/9b/+1LE0gAM5YtbTD2rwZQsKtmnyPi/9Is7++oQGmtRBOfZ/g0BYAFRXvQgwrE4fhsGG+QT9/kH4sbx0LSr1nbDcPLffTvNVHtzw9WU8kC1tRtustPG1YYiVZRmol0bEqO8OapF3NFVog4BOra/NiAptOy0QRpfOHkNzv/L//9egMDhj+2sz+pCLaf8OhgUNBAABFG4a2CEqVMGjQ+FC2gRSDQoxzIO5lEcDhWNxoYkJxtbEuiYKRww9iAuaRuNXzhbXiUncUdQzXhWA/5bSFdn6//7UsTJgA2lXV2sva3Bv6vqWae1eNA8T/jMl/SgKfR/N9fX/7/2YQQaEHonRf0WKn+xxZ7SdQw2oQiUQUlKRJ9iCCbZFUepHoM3R3F6TRNSUQREo1vRELTasvk8Mzfksz6+YCiEexUSOxEW6l/NfxT53jH6dihb/jH/qT/fzv/Lf+/9KAkn36I36BDiP/5S+Idnh2gw24ygqKjgX06Bah5FwBBsR91FkqcCtPYGGDMf5nDQ5J4OuGdIwdlR0gbx9rsI5bsLvEz8qE3m+BMWdStK//tSxLkADh1hY6e1VYGWLCs1h6jwA8I/8fL2t2YTMi38wWf8xf+v16wz+vn/0Qub/3597STNcQQLKDCEgpbuDpCVFS5OwG8a7EqEBIdCTOI/7DVra8pUsrjY7j1i58sDNiwWBeoG2YKp/OGnnNxeW8xuHo552qAiGn/Ub/pIBVMN1bU4Gv284XJ/r8yryAKdX85+v8qQnM/VQVicACjAIAABRzgW1K9mTTqEdEFEeqJeK5ZJ0rzfTgueH3ohDvVGU+THt8ng5fEsqWfhltGfx/z/+1LEq4ALuYtlp6hX2XwxbTD0nc9X46W8/xCR9vCgd/xwkvpMOAELUqzToif9irf6t6eKASX//6GEyrf/yzouNnXlEBIQLAABUU4MEiMIwsPgI0VNgyEbk7XiOSrcfIaW7agmkqILmj2sO3eMOFFmCoVLeKW3KP0JvGJfmjTe2zh6NPfQ5w0P/yn11cAfRXT5X/x83+rf6AwKV7fu/8XI3/S9NMX+XMuw5MlqKYU9DwMBbrE2JIdxNUUoWNwPdyyjM3/b4NmVzOwm38DJ6/XZ2//7UsSrAAyZX1+nlVRBjTErdZecuWX2xlNa1qbqNPOP1tqd6NAaSN/qOln/OFiulWZGgbDW260v/Mf+v/w+JX/7f5ChsQ0fL/1s80mCzgzLUAQEoSyUAjJeSkUod+biQOi1F/5Ho2QSuHycVAC4mjcHQjVNzEHjCvxngY4sFWrPC155bqQ+U8qOerbkg97/DM//oJiJn9wH3/sgiW/9/9fc8/QDQhEf/3/Yfz6/39VV5F5MCCAPeKXXixyfmia7HV+JduWy67RQVIY4t/G9q2tq//tSxKUADHmLWaw9RcGYr+0o9psyWfRXI8vy9nfnml0lJXuCW0p3AgOIrCeSE3O33ent8KJvaGWkCAfpWSNRRAhb2U/4oQ91IEZDwBjrmHauTf0yr7aa9LJSMhNZ/zNICQCEMgE8Y0JXwSCHTRyfNm7Esn6uivaTs04SG6HqfSwThIJCU0LLLSMqtAofnNq+XV2VrTRxO2lnFRwMLgOBlKEEA1hVdIw2rP8p7jz1YTAcMBRBE470P/5X/1fu2pU2METrIAAABTcwiGx9xaY5Bnj/+1LEngAMOYldrDFHgaCma1mEKthJVQD6owiGdzV22RFlU0UX+GnA9lo5du0OyYbTrdAP9/lnzv6z/P3eQhx1EDAqgXqfutlT0j9dYGR/hNH/Etfr5sl2KiGVAIBJakAkEgiD+UwbBmglooJ8owPZUZ9ipOZzsLz6EwRpj/sFyZr2c9HUn7dCPLWSolEG38p5zrp+koxy9B15R3Xyv1DSdgMtn9/A/wu/pWKegBSSKVY5UPNGEbsdBbRsqoraE6Sk+5z11t5bsDIjFXbKiIHwGv/7UsSXAAw422TnsKvBTZIs9YYYeEk2Sf0qTEFfULdPUN6mFq6k1CBrf/zhN/9G/476aH/4h///ChwcFFKg9BguQ0yZ0EQFPer8pTAIyCARCZpmcw7C6Gue4tZFP1a1oezz3bFPb2vFpjD6TMfWQ2WlbeH/AUHpdqnrVcQZ6kzyLrG+h/PgvEyU6sAaCvRr9dkrkwN57NRyXY//H9/b/8oSlnqlHU/9cXf+swtOFgI2KdWinh6D5Ogq1OayQ6nLldwxeMlNHOcf6eQ8pSxIKLj///tSxJoACizbaUYY7tFxKW1o9ZX6asnpFTnf3fruFUWOV9jqnwLHRBsrMawTafWEwLRtFR8hMe9DJozALGTlVXaP2P7cr/472eHvT6vR6hBGIYDXIylualQqHRBHkWZcgliTwrrj1+WUI9hmfQsinBUTCcxkJN9oPBBKbl8ISoNMRGs/mQR182OTLcBAV103Cn/1b/jv+3/v///Z/9f+I+p/t9/h4MmntkxaRoWEjVQ+3Fcqk+orMehiY0mFUY7lq3id1+bz8j2IEbVpHiJizYL/+1LEoQAL8Utlp61UgYIe7PT2KXjWpqzK7RUCP0awTOFJAUboTZ05Cgmcxvy2lQyHPtkImX/Qf/9P+Rv///P/2IDvbkD+R8t/1hAdARJJSzAlBWF8Pw2RGREFQzEYISxOaIQ0liorSQfm5vVZa3ltkhQbU/kLJpzqC2lbBe6dqNQttSx5qZzgTXTPr8Yun6kzg2f8s/1D3/Vv8BR///8JE00RQGt9YUDezyv/KgAQAiAAFIAegYyu21vIUJYRmggorPInNdsB6vcXqLnBrfBhKP/7UMSfAArRSWmmLLaBgaltdPWp/BxrYLQlm1agrTmyIIMISAfTTVyopZKip0AFNf0UXKhulEKhz/Rf+S/9f+MCb/T/xVbT0lv8oX/5Z/+uCTSyRVSocpFSrDoRQxBQR4qRIVnkvRKHT4tdQb9pBmEXAHhwbEySKTtrRaQp5HiXQxEfJ9CWtQbaq+uMC55+tmGYce2/L/6Df/mf8i///xkKVVH7kBu6VsJQ3f/r/6wVGqmQ2yy1YttuTUpaxpo0CpdTLgkRLJdFTQbIu58O8nr/+1LEoQAMXUtdR7S4wXupa2mHqWjGHzMl9aeLYyCazulVF0E2231YH3t9H8eq3zQdki5Pzst/2/1M/5zf6f//4+OXbvkP9A35X1v6vXUEBHEgmxAl7jsAgvTwJkT4k7koxpBW2WhAuBm3z/FSZ10nHNeXhgGev9VzW5Fah9P19/alIP+zpzsigfUuZ8Ktf0iYGN/n/7Fv+v+pR/6f9FEQ3/Vvbj4f/zv+Pi7/P/8sCjDXUZGo2rTZUhYqooSx59RDeF/mh+JocPYVnALq5nx53v/7UsSeAAvZS3GHrVExZqlttYYdeuwhHSVd5wa37y7yHT7GqaeGn7eIm+0w4AQMo+XMKHgYGf+d/y//X/o///9zqfoq2+VJL//+pf/iFQIAjJaOSA1orO4HJpDy5DDilaG3cJ6UOjy+aTi6JgFYbGrGYmYtVIsVKXWSaBg9JaCaRPLmyje60xMzyDupkaYwxuy/dYfhkoa+tZo3fyi/s8j/yrupPU/3+GQA0qxmGhEIg0IhGJA2DLDHtjMq14O7AL4oFU14wCAbdp3/4GaoWeFI//tSxJ+ADB2dX6ew68Fqrq509h06iUcBo4zYaoJgTaJ14N0hzgCAhkcjDUcoZrywFzYYUDvECMieI0coiXwFGC3l0LbkwaOksgJkbfixhbc3Lgl6KJDTI26v4oYaZ9ZBi0gPx9Reeijq/5QKBwvoDcSYzd0VOkkZLRZFX/5khXz/PFSpUJKUTvvJ98hOYVF/1KWYzyv/oGFOUBLCBXQumguQViFHArBwV0VwFNCipv//wjorjv//xNhPBv//5+pMQU1FMy4xMDCqqqqqqqqqqqr/+1LEn4ALWNFa1YaAAmiqLHc1MAKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7UsSDA8b4aLZcEQAIAAA0gAAABKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      // --- the machine's events, from assets/audio/sfx/ (trimmed, mono 32 kHz/64 kbps)
      // flip: metal-click-01   (a switch flips; a marble passing it ticks it quieter)
      "flip": "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//tYwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAAH4ABJSUlJSUlJSUlJSUlJSUlJbW1tbW1tbW1tbW1tbW1tbW2SkpKSkpKSkpKSkpKSkpKStra2tra2tra2tra2tra2trbb29vb29vb29vb29vb29vb2/////////////////////8AAAAATGF2YzYyLjI4AAAAAAAAAAAAAAAAJATAAAAAAAAAB+DGgmWGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tYxAAADFxdNrSUgAJQwKknHqABBgAHgQCgEAQDBIx/c99KEAbFZO3P+c4Qh5o0eqBcNisVisVisVo2AQBAEAQB8HwfB8HAQBAEAQB8Hz6wcBAEAQy5/wQDAPg+D4PgQEAQDH///wcBAMZ/lAQ8uD5//gQMcHw+qD1eoJ/1+qCsXJkV6kYVIiV0udPsmEQZsGXITwKZgLCIC04lEUDpg8BZlDwKQ6IkXAWXJRYl5UgISM49Ti5uqLNoVPQ8fkhGhM806Y9aopnQodU9HUw9jM82h1q3ozIY5t9FmZpp6J13mkToremsqiW2X9EP29dX0Nax7T3Q2bos9nd3syfpPaqz32X87a0ub0+W2yyAGKwwNk5GaxUDxOIt3Fq06Lx0//tYxAoAEA1jPXzEAAIdOedgww3xPQVAaGgchTJY6GgoskoOAPXzA6GwRFSkvR6Dem+b62Wb/9+bHDYmxodExNf89bDW/q+p/+6b7077ipkrJyTHR1Zlj6r//9f46+/1SkhnEzBMvCeTJEVrFDbrjxG8OvnRE9SDqhwdfSJLmj+1VgmOAA2wetetNG0WyupFmwDIh9+mMmZdd9iUUw1nHAhAifsM0T02a3ep+/djzrXb/I0D08gM3qO/XzdA5Fv/mZhRKC3+7bRBi+RzJ5a9/dMnM+u5/kK7wy9XMux/O8odUBDOEgVytDgYdxbInAQhDKL++Rkkvnk/uHN5S9nf7g9ZnRafXTzP0nlzRnNjMRIkAJZCkbPF641LqKx4pTgz//tYxAuAEbXNSeYMukoJG+n6sPAAxDeRF672zA4sgqwTFiW9J5ZQpn75uVCoucYoyv6kM8YU6t/w8uZvyuHCGvd1zJz39CotCA5NiElcYCT/cis6Z1RCn6IRlc53690d6Wu25L6yTOVDoQjodz7oU/rlX79EReRe6G2GIDE4D78EeMA8hPNpl1r1HrM6g0ILkIygDy5ZjecuqP4dCGcZ56eRrTQBqVxeXyIGwLgEMCo1t+/Z3jzTz782oECzgwS7rHgU1tt25vnurQ5rYra9Pr21fer/MfG7zz3949r13v6tu/3iFufe9/6xSNFO92UYYYo8QQJjS7Vx97d8huW4fCmfLa6f+hyqdWB49DvZ2ASk1u10jzebDOCEgrmpiX6U//tYxAkAEUYNd7iVAAoUvar/noAA0ccyiJuIhERUek8JpOzIYPxXHpciImKsTkhOhcenCsQmecIgkmMYRkBEczJTz0ZSMnFgeRJKkByKd/5ITnnkjHkiuqKyHHELfv/6NPWPDGcw60iVCogSEl///PfzMy/ah05zaGtzv///+ZtnkZOSKeSXZXm/8hOG3TCCGAiIJIAhT0SWhhRmJ8nmb6YawaQXtcHj45HSHJzXkqKjsYPFSAbFWs0xB2YHIdRBQt8f0aNWgbNcv021xelu3Rq+srxfX/7TlXX7XszX5QfLDRDXP/65TYdHMSoq9Qws/+3KSw9ca93o/NLVf/8fH//X5V/21/////9//f/PMwD1O9V3cQeDEzAAB7ZihY7J//tYxAaAj+HxScQMusnuPeZsJBZ4D2xUVBspjC1yK0tTUOxTVZTW3w0yLKOWD1UweC2JUk2q5VgLa8NelD9VZ1ARJc2Y6gEPP1LY1pIbNl/G5VVTOlwwpUmJeBhVRjKX/7ZS6GebT9isjio5V9S5f0/6rXxFxEVLMZDeqYiIscFVEcKyG2nyKCGbaI6PzGDMBAToBOgEQVNzAzqYo7Zn9pDk2RWIaSSA+B4AEC4VNJFSaaakORUOQah7zTNFqqqrdC0kitMsN7WsevcqSaodCN816ioqKitcNDLUFWgdDgVCMzWvSrWb//Khpg85al//EQ70MYxvq36P/6G///qsBQX5Vd8RhPWWVbCQUKTeXU8l9xEVJA0dJU3PJREjEqyK//tYxA6DzbnxBACkU0AAADSAAAAEAqXdsZXCNS8clcfGDSrkT0N5qFZ8dvYsrNsrHb5UFFdjFIcoYyGcrGcKjUcqOUMipM5ShgQcYCdv+ltyo6trflT7lRVus1v//////7GWYGMZTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      // lock: metal-latch-01   (a gate locks)
      "lock": "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//tYwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAHAAAJAABAQEBAQEBAQEBAQEBAQGBgYGBgYGBgYGBgYGBggICAgICAgICAgICAgICgoKCgoKCgoKCgoKCgoKDAwMDAwMDAwMDAwMDAwODg4ODg4ODg4ODg4ODg//////////////////8AAAAATGF2YzYyLjI4AAAAAAAAAAAAAAAAJARAAAAAAAAACQByUwBrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tYxAAAC8hPKtQRgAJ9Oew3MLAC0AAARgxjGPGNjGMY7u//XRERERAADAwMP3QfB8+XB8H3icEHCcH/y4Pg+DgIcHwfPlATB/LggcLny5+CEMfLg+H3cHAQBAEAQB8H8CHP/icEAQBD/8oCBzxGH/4OBjWbZ2WX1yK0xCESK12xT1OlfkPL7WhyPQiein1KlmAIzWcPggkwHIDRq8xIsB/M7g8w6bsNT7oTKXITZ8yKiEDwdRVPNbsOtY8+yjkv3so0lqFU5r2nG1y4+u+Xn/+q9BKYZvn5qF4lPtt/2dfM/ezqNj73VUfzXdXfFd99Nu74rYyer44+Pr4r/50kW9d/HLIiLZf2vhEyt9MLDxNpIoVE/8lqx0lEAABAg0mX//tYxAaAD4jzT5mEgAI4ubF/GIAApLO+TCtvbF6rwVZy5GtdxlZqyRtnEw+aKjBmj+TfNWHlOE2Uc0LP6Kr/9XTvWSCyJZW7jkKyXpK5SYUIEuNM+X11bH153/tfY/vh1NXrFkxiE0RoEk5oTiUSiS//OUObwHaSWH61f/c3OIiDDzrLsVadtk7mJc2M9Zk4lEK3mBunERm9ny2mHj755YEjHg/QCRwgNnBwKA4H7Sehk2pdHkae+6UpDHCcRF4rGolGPendSKOdV/K3t0/fwnWKgTOqxYniDhGnJiIqd/uNP1SIR8+nrr/+a5/////94p7dHE46OKHWjRPP8f9+32lX/+///v4jmBF4SQ8VeqVd8kp8uFJSIxaAEgDFojEp//tYxAaAEHXzb9zDgAHyvy04wYroUth3ithyxc9XLoRJFtHUalh9FNNZSBB1NqaaKWRk3Nc44456HJPR+6JRTUoddB4eNWNDiZx0wmOjlXEzmzWvtZlR1sfR30WyHPXAiRZucYyqiPys9HPf6ZzKaqK1e1qf//ml3ZddvTMdn/Q1WatlOWREQMnV/MXtXVqZoToAUJRbehW6lXE4wDgAK+PrXI6KvrDVk5p2reu8PS/K7lrKtLyBhBZVSlqcViyLNS8qEYyWaJSKOFw1LInOhdtencuXIs5DllMofZOfcj+lY5G76l63t1P/bUyqlyzsj3WuWe4NguzKRHte6U/6sRWLBOqbwZ766pvamUJTElACUaRsNSVJTIbIG6l2pNEK//tYxAuAEEnrYcSYscIDtKs4gw9YUUM5Ktn5G6KSx8XeHclm98nt/TJWXiMvhkwvsztNPBWdsam7Nr3SI6+SOf1f2jh1ZLIb/rfKIwiQRQjCQt1kczI9UsdC9U7lVm5KEZ0stl6f3/75ytUpFR6/60VavejNRUi1QmCrAscbfsoa6uHYRERAAHs07ZpUVFJYYP7E6m/9wNPMOMONoERhJg8Ycba1XfNfdq3VVpmW/jf2uBJeB6d2IauJuIoKNQMJo0jiZE52OnvjJY+/c8ubwbcWv/m9uuWdqN37Wnk6E3zXhVbqcWkVVrcj44SGUPuXfhbPOQMbH/U5MUm2HCB55ApVaKvHo0UCAAJu2z2SOiElijMJD8H9qXABLzNOudEw//tYxA8AUGH1VcMYUcIsvyl4hItYYl/RJVxT9ud8lst7apY41Jo/xbzpphJuyOM5uTlbtIuSXF1hBkts4Y//6F/TnfYZgJjA0a9DsDOxTCjvSqVK9FdjUZX7GNyPSsqWulJjabKn1OFN979a/vR0VylUahWRyxQ97JgAiKllUgED/WdhBLo+IZw9AkaEjt8FU0MpJo2CCr+RFOlPVqvY6Yi73lWVd9sJI1tpcQoLsYV6T2rscqBwfIIFg0Wdr2psSKkqJOHhPN1XNltzWRH3tMwuG1/6o/7K57/xjFdUqxUrVfUxXFVl9rNNlXQyzWR0VWZQAWJTvM+/o/oaQ90FGFwxjaHCqgBwd5VUEwgAAv/a/GE8OMLSxGkVieqFhlVY//tYxA0AEH35ReQMXkH1NKYsZIuQsULDQIrL9YLjRBXiVKF1Wrhhjqu7Sqk1xEmM4wPhYdY1HZkK6YabJqofmAiQjAQEGG4xrt7VUaiBbkGM+lVKP63+7K1Lqz3+XWxXIv1S2yTP22KVqPoUyKxqlM9fqb5sxlupnCs1CKC/1vCiySAgGfH/+P9z/EnPXXycqyEvU043a7zkhNPn/ramczYJVT9s2e8tVScSOARMS1ShpZHBozPIliZoiJvT0SxNKmkJCtLfviq7YpIxTBE1LY5Wx87Q3iyLZeUvkuxZgLo7OhmDGMilBjVRy6S/6G95v+Y4Y8dUd1/1PyUBVUAABb8Qv8L/Qlps0VJVnodj7pFbMf/VoYSlVxjGPqUY1tbG//tYxBGDzd2lFKCkU4AIAEABkAAEpeMaOgi7yER9JoqSiI0htyKcfi12s2hyKS4BX4i3NitvImil0UzzGMoCJcKAkcqPKxWMZSl/WYpashlarfyty///lookRf/6wmAkVnn4TEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      // unlock: coins-handle-02      (a gate opens and its queue runs out)
      "unlock": "data:audio/mpeg;base64,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",
      // deliver: ui-glass-02   (a marble drops into a receptacle, pitched per receptacle)
      "deliver": "data:audio/mpeg;base64,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",
      // shatter: impact-glass-heavy-02   (a marble finds a full queue)
      "shatter": "data:audio/mpeg;base64,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",
      // heart: impact-glass-light-02 (the heart that shatter cost)
      "heart": "data:audio/mpeg;base64,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",
      // chime: glock-ping-01       (a chime by the rails, throttled and very low)
      "chime": "data:audio/mpeg;base64,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",
      // chain: harp-run-up-01        (a combo tier, pitched up per tier)
      "chain": "data:audio/mpeg;base64,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",
      // blackout: impact-mining-04     (the combo breaks and the lights go out)
      "blackout": "data:audio/mpeg;base64,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QXORcnCHjvYaASAFJr1K5wwRxsSZ5leDZwzgIouitaETFLlYLIhRT7YRARIrq6D9aDW//UVGSSFpAefQLGEwMVbP///XWjb////10RfAZ5XAcYWVM7Fr/9kkjEsC0gmFAM3VgBIGEolA8bFUkX////9v/9H6ajDeFcN7h980YwWTCyE0PNZNdtH7jFJny48IrSHR1t9qiqDUT/////TFgIiRYZ4LXQhZ4GCw6QQgZxav////////6imMYACL//tYxJECDaE9EA9uo4G1J6Ld3NRawNESkAYYEcT6bKHv/61Il0vEiNMDAABA8TQQNMA8TmMwQwjxniDf/////pGwDwA2IcYYC1RneGGIiEdRiircoJoOX+fWL4BhZHjWHl7+h1/T/8zKhqXh1BsoFVaBpUJizjM4mgz///W3/////ZNBINsAizAcQBvk4gs4VP/+gZlwMtgaYLoDQLHARcvoF9f////z3/ft0roAJAHAABhUlB52TpvoHRi6YoYRsa1h394Zxww+DqY6xfCoP9X73/+oX4tY5CZOBY+BjBNgePAYFgAMmThfNEF///+v////9SxQgbwBgPfgYJA5cL6Zobjf//0jpYFrAcCgMzswCAME7mBobnip////9H/s//tYxKkCDlE7Dg9mo4GwJ2MdzNRg/rEYhGGaixOdV3mTKJkoakQu9yHbl9JXuRERkIkM4fYiwgV/16//t6heiA45Q5ofCDYOAzFsAPXhQCwBFLE6bNR////////6kkTYZgAoJAV4QBxiFhK5mZEyNn//RSKJKBxIGDXWAYAROyaZqbFv////d/+VMjlBMtv8OWSlKoqEwdyi3yv394U5flHPLv6iLy5f//r+pf/7l0NiFvIiM6BABgBKAgMg4LgzsVwmzAzTZ////////6kUT5OCfwRAQAFIeDg8irIITBTIwd3/+7GxFUhjqegy1FJ/PUzZ////r/+pyagDYA4ACNKLUyuljp6YAweGgIq9zIHjFJX1ugZkr7P/1K28f9+6//tYxL8DjpE9Eu7ipRHOJ2IF3dQwI//MBOxfQJ8NkAxu8gIgoT+RA3NE0///2Wn/////2TIqNsEhYFlY7C+mgma//+gTYrQDFYMFaA4GQh///t//9Hs/Z30AUAAAYywF5p5O2mFcKAYJ4N4OxG6lfDlb7dUztQgndaoBm5ORqnUkgp3pXQpM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xo5grUhg7hZw//tYxPMACbw8xhXxgATBw5sHP1AA9DKrXV//5GiURTiCiEwy4rYfY2RSI8C5h1ater//4j4RiVhAUUgKBF8NMR0OMWSMaKVE3FwQsLX6tf+v//4uYV0cAhKOYLiFJDSFIlMUCLoc0WcOeITDrGiKRGyK2azqtVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tYxLkAGQ3I/Tm5gAAAADSDgAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
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

     THE MACHINE GROWS WITH THE CLIMB. Each biome of the level map (six
     levels) is its own machine on its OWN SKELETON, built out of a small
     library of track modules — zigzags, loops, corkscrews, a coil,
     whirlpools that drain through their centre, glass tubes, dives that
     take a line behind the others and bring it back through a pipe mouth,
     and ferry gears that carry a marble round their rim from one line to
     the next:

       biome   switches  gates  arrivals   skeleton
       1       1         2      2          the traverse: wheel high left, a loop and a coil
       2       2         3      3          the cascade: a glass fall left, wheel low right
       3       4         4      4          the staircase: a whirlpool, a coil, wheel off centre
       4       5         5      5          the braid: lines that cross by diving, a tunnel
       5       6         6      6          the chain: three switches along the top, a tree below

     A layout is a GRAPH — the feed gear, the switches, the wheel, the ferries, the arrivals,
     the channels between them — and every rule reads the graph, never a
     count: the route lighting, the payoff arc, the lock scheduler, the tap
     search and the pilots work the same on all five.

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
       glass, mouth]. Depth 1 is the front plane, below 0 the rail runs behind
       the machine (smaller, dimmer, under every front rail); `glass` marks the
       segment ending at a point as a glass tube; `mouth` marks a pipe mouth,
       where a line dives or resurfaces.
       =============================================================== */
    function Track(x, y) {
      this.p = [[x, y, 1, 0, 0]];
      this.z = 1; this.g = 0; this.m = 0; this.bowls = [];
      this.mods = [];     // the loops and spirals, for the module prizes (CARD_FX)
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
      for (i = 0; i < tr.mods.length; i++) t2.mods.push({ kind: tr.mods[i].kind, x: 660 - tr.mods[i].x, y: tr.mods[i].y });
      return t2;
    }
    function T(x, y) { return new Track(x, y); }

    /* ===============================================================
       THE FIVE MACHINES. Coordinates are machine px. `sw` are the switches
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
       the marbles flow, how the switches chain — so a new biome is a new
       place and not the last one with more floors. Every layout is checked
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
    var LAYOUTS = [
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
                  { ch: "S3L", at: [250, 946], cap: 3, p: [130, 790] }],
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
    var LAY = [];                   // the built layouts, one per biome, made on first use
    function layout(b) {
      if (LAY[b]) return LAY[b];
      var src = LAYOUTS[b](), L = { b: b, CH: {}, sw: src.sw, wheel: src.wheel, arr: src.arr, out: src.out,
                                     gates: src.gates, chimes: src.chimes, bowls: [], order: [] }, k, c, i;
      for (k in src.ch) if (src.ch.hasOwnProperty(k)) {
        c = src.ch[k];
        L.CH[k] = makeChannel(k, c.to, c.tr.p);
        for (i = 0; i < c.tr.bowls.length; i++) L.bowls.push(c.tr.bowls[i]);
        L.CH[k].mods = [];
        for (i = 0; i < c.tr.mods.length; i++)
          L.CH[k].mods.push({ kind: c.tr.mods[i].kind, d: nearestD(L.CH[k], c.tr.mods[i].x, c.tr.mods[i].y) });
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

    var tmpP = { x: 0, y: 0, z: 1, slope: 0 };
    function at(ch, d, o) {
      o = o || tmpP;
      var f = Math.max(0, Math.min(ch.n - 1.001, d / DS)), i = Math.floor(f), q = f - i;
      o.x = ch.xs[i] + (ch.xs[i + 1] - ch.xs[i]) * q;
      o.y = ch.ys[i] + (ch.ys[i + 1] - ch.ys[i]) * q;
      o.z = ch.zs[i] + (ch.zs[i + 1] - ch.zs[i]) * q;
      o.slope = (ch.ys[i + 1] - ch.ys[i]) / DS;
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
    /* Six levels a biome, five biomes: the stretches the level map names on
       its own card (web.levels.bands). A round with no level — the playable,
       a free round, the endless run — plays `mix.playableBiome`. */
    function biome() {
      if (!CONFIG.level) return clamp(M.playableBiome | 0, 0, LAYOUTS.length - 1);
      return clamp(Math.floor((CONFIG.level - 1) / 6), 0, LAYOUTS.length - 1);
    }

    /* ---------------- state ------------------------------------------ */
    var L = null, CH = null;        // the machine this round is played on
    var marbles = [], queue = [], boxes = {}, sw = {}, parts = [], shards = [], rings = [], arcs = [], puffs = [];
    var wheel = null, chimes = [], gates = [], fers = [], sink = null;
    var state = "play", t = 0, feedK = 0, feedTurn = 0, lockT = 0, electricIn = 0, arrival = "a0", path = null;
    var score = 0, combo = 0, bestCombo = 0, hearts = 5, heartsMax = 5, best = 0;
    var heartHit = 0, hubPop = 0, hubBreak = 0, hubZap = 0, zap = 0, overT = 0, ended = false;
    // THE BLACKOUT: a broken combo cuts the machine's lights for half a second.
    var BLACKOUT = 0.5, blackT = 0;
    var flow = 0, screwSlot = 0, towerQ = [], revealT = -1;
    var stats = null, taught = null, chimeGap = 0, clickGap = 0, lastTick = 0, spaceTap = false;
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
      Pop.text(toDX(mx), toDY(my), str, { color: color, size: 22, life: 0.6, tier: 1 });
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
      var mc = boxes[id], e = m.e, pts, before;
      // Whatever an arrival swallows falls through it to the gutter and goes home.
      m.st = "drop"; m.vy = 0;
      m.e = false; m.spent = true;
      mc.led = (mc.led + 1) % 5; mc.sweep = 0.4;
      if (e && isSocket(id)) {
        stats.eOn++; stats.delivered++;
        before = tier(combo);
        combo += MOD.comboStep; if (combo > bestCombo) bestCombo = combo;
        pts = Math.round(M.electricScore * MOD.eScore * payK(m));
        score += pts;
        if (dnFlag && !m.clone) { dnFlag = false; score *= 2; Pop.show("record", { word: "Double!", sub: "x2" }); }
        HUD.setScore(score); HUD.punch(C.volt);
        arcs.push({ t: 0, jump: M.electricJump, rev: false, path: L.pay[id], id: Math.random() });
        mc.kick = 0.7; mc.charge = 1;
        Fx.shake(7, 0.22); Fx.flash(C.volt, 0.16);
        spark(mc.x, RIM_Y + 20, C.volt, 30, 320);
        ring(mc.x, RIM_Y + 40, C.volt, 20, 180, 0.8, 5);
        ring(mc.x, RIM_Y + 40, C.voltHi, 10, 240, 0.6, 3);
        Pop.show("bonus", { word: "Charged!", sub: "+" + pts, at: { x: toDX(mc.x), y: toDY(RIM_Y - 90) } });
        if (MOD.over) chargeT = MOD.over;
        // a charged socket deals the cards, once the arc has reached the hub
        if (!m.clone && !pendingPick && !held && charge() >= 1) { pendingPick = true; pickT = KC.pickDelay; }
        if (tier(combo) > before) tierUp(true);
        return;
      }
      if (e) {
        mc.fizz = 0.9;
        puff(mc.x, RIM_Y + 10, 7);
        spark(mc.x, RIM_Y + 10, C.volt, 8, 120, 60);
        if (m.clone) return;                           // a clone that misses just goes out
        if (seconds > 0) {
          seconds--; queue.unshift("e");
          Pop.show("bonus", { word: "Second chance" });
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
      before = tier(combo);
      combo += MOD.comboStep; if (combo > bestCombo) bestCombo = combo;
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
      if (tier(combo) > before) tierUp();
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
        Pop.show("bonus", { word: "Shielded" });
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
        tc = TIERS_COL[tier(combo)];
        for (i = 0; i < 12; i++) {
          a = i / 12 * PI2 + Math.random() * 0.3; v = 160 + Math.random() * 160;
          shards.push({ x: L.wheel.cx + Math.cos(a) * 44, y: L.wheel.cy + Math.sin(a) * 44, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
                        a: a + Math.PI / 2, va: (Math.random() - 0.5) * 18, s: 6, t: 0, life: 0.7, color: tc });
        }
        hubBreak = 0.6;
        blackT = BLACKOUT;
        Sound.clip("blackout", 0.5, 1);
        if (!quiet && combo >= tierAt(0)) Pop.show("alert", { word: "Combo lost" });
      }
      combo = 0;
    }
    // A heart goes: the HUD, the cue, and the end of the shift on the last one.
    function loseHeart(n) {
      heartHit = 0.7;
      if (state !== "play") return;
      hearts = Math.max(0, hearts - (n || 1));
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
      Pop.show("bonus", { word: "Caught" });
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
      if (g.q.length) { g.flush = true; g.flushT = 0; }
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
      Pop.show("bonus", { word: FAM_BY[c.fam].name, sub: durText(c) });
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
      if (!any) { Notify.say("No gate is locked", { kind: "info", icon: "unlock", key: "gb-key" }); return; }
      keys--;
      Pop.show("bonus", { word: "Master key" });
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
      L = layout(biome()); CH = L.CH;
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
      heartHit = 0; hubPop = 0; hubBreak = 0; hubZap = 0; zap = 0; overT = 0; blackT = 0;
      flow = 0; screwSlot = 0; towerQ = []; revealT = 0.25; chimeGap = 0; clickGap = 0;
      stats = { delivered: 0, eOn: 0, eWasted: 0, destroyed: 0, spilled: 0, unlocks: 0, locks: 0, moves: 0 };
      taught = { lock: false, volt: false, spill: false };
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
      heartHit = Math.max(0, heartHit - dt);
      hubPop = Math.max(0, hubPop - dt); hubBreak = Math.max(0, hubBreak - dt); hubZap = Math.max(0, hubZap - dt);
      blackT = Math.max(0, blackT - dt);
      zap = Math.max(0, zap - dt);
      chimeGap -= dt; clickGap -= dt;
      // the lessons, one at a time: a notice never stacks on another hint
      hintT -= dt;
      if (hintT <= 0 && hints.length && state === "play") {
        var h = hints.shift();
        Notify.say(h[0], h[1]);
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
          if (g.flushT <= 0 && g.q.length) { releaseGate(g, M.flushV); g.flushT = M.flushGap / MOD.flush; }
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
      m.v = Math.max(M.vMin, Math.min(M.vMax, m.v + (M.gravity * p.slope - M.friction) * mdt));
      var d0 = m.d;
      m.d += m.v * mdt; m.rot += m.v * mdt / R;
      for (i = 0; i < chimes.length; i++) {
        c = chimes[i];
        if (c.ch === m.ch && d0 < c.d && m.d >= c.d) {
          c.hit = 0;
          if (chimeGap <= 0) { chimeGap = 0.32; Sound.clip("chime", 0.05, 0.85 + c.n * 0.09); }
        }
      }
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
        md = mods[i]; v = md.kind === "loop" ? MOD.loop : MOD.spiral;
        if (!v || d0 >= md.d || m.d < md.d) continue;
        pts = Math.round(v * mult() * MOD.score);
        score += pts; HUD.setScore(score);
        popText(m.x, m.y - 30, Lang.t(md.kind === "loop" ? "Loop +" : "Spiral +") + pts, C.amber);
        spark(m.x, m.y, C.amber, 8, 200);
        if (chimeGap <= 0) { chimeGap = 0.2; Sound.clip("chime", 0.05, 1.2); }
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
      if (builtRails !== key + "/" + L.b) { builtRails = key + "/" + L.b; buildRails(k); }
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
    function isGlass(ch, i) { return ch.zs[i] >= 0 && !!ch.gs[i]; }
    function eachCh(fn) { for (var id in CH) if (CH.hasOwnProperty(id)) fn(CH[id]); }
    function buildRails(k) {
      var fb = boxOf(function (ch, i) { return ch.zs[i] >= 0; }, 40);
      var j, bw;
      for (j = 0; j < L.bowls.length; j++) {
        bw = L.bowls[j];
        fb.x = Math.min(fb.x, bw.cx - bw.r - 30); fb.w = Math.max(fb.x + fb.w, bw.cx + bw.r + 30) - fb.x;
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
          eachCh(function (ch) { tubeWalls(c, ch); });
          eachCh(function (ch) { for (var i = 0; i < ch.mouths.length; i++) paintMouth(c, ch, ch.mouths[i]); });
        }),
        glass: layer(boxOf(isGlass, 34), k, function (c) { eachCh(function (ch) { tubeSheen(c, ch); }); })
      };
      // the spill network's cogs, one sprite each at its own size
      layers.cogs = [];
      for (j = 0; j < L.cogs.length; j++) {
        bw = L.cogs[j][2];
        layers.cogs.push(layer({ x: -bw - 2, y: -bw - 2, w: bw * 2 + 4, h: bw * 2 + 4 }, k, function (c) {
          paintCog(c, bw, Math.max(8, Math.round(bw / 4)), bw > 40 ? 6 : 4, bw * 0.16);
        }));
      }
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
    // A glass tube: two walls and a joint every few steps, on the front layer...
    function tubeWalls(c, ch) {
      var i, nv;
      c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = tca("#0a051c", .5); c.lineWidth = 2 * R + 16; runs(c, ch, isGlass, 0);
      c.strokeStyle = tca("#9678ff", .10); c.lineWidth = 2 * R + 8; runs(c, ch, isGlass, 0);
      c.strokeStyle = tc("#0b0720"); c.lineWidth = 5;
      runs(c, ch, isGlass, -(R + 5)); runs(c, ch, isGlass, R + 5);
      c.strokeStyle = tc("#cfc6f5"); c.lineWidth = 2;
      runs(c, ch, isGlass, -(R + 5)); runs(c, ch, isGlass, R + 5);
      for (i = 0; i < ch.n; i += 14) {
        if (!isGlass(ch, i)) continue;
        nv = normalAt(ch, i);
        c.strokeStyle = tc("#0b0720"); c.lineWidth = 7;
        c.beginPath(); c.moveTo(ch.xs[i] - nv[0] * (R + 8), ch.ys[i] - nv[1] * (R + 8));
        c.lineTo(ch.xs[i] + nv[0] * (R + 8), ch.ys[i] + nv[1] * (R + 8)); c.stroke();
        c.strokeStyle = tc("#e6e0ff"); c.lineWidth = 3; c.stroke();
      }
    }
    // ...and its sheen, over the marbles.
    function tubeSheen(c, ch) {
      c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = tca("#c8b4ff", .14); c.lineWidth = 2 * R + 6; runs(c, ch, isGlass, 0);
      c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 2.4; runs(c, ch, isGlass, -(R - 3));
      c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 1.5; runs(c, ch, isGlass, R - 5);
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
      var pop = 1 + hubPop * 0.7;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = font(combo >= 100 ? 30 : 36, 900);
      ctx.lineJoin = "round"; ctx.lineWidth = 6 / S; ctx.strokeStyle = tca("#060314", .9);
      ctx.strokeText("x" + combo, 0, 2);
      ctx.fillStyle = combo > 0 ? col : tc("#6e6390");
      ctx.fillText("x" + combo, 0, 2);
      ctx.restore();
    }
    // Sparks orbiting the wheel, more and faster with each tier.
    function drawOrbit() {
      var tr = tier(combo), n = ORBIT_SPARKS[tr], col, i, j, a, rr, aj;
      if (!n || state !== "play") return;
      col = TIERS_COL[tr];
      for (i = 0; i < n; i++) {
        a = t * (1.4 + tr * 0.5) + i * PI2 / n; rr = RIM + 16 + 5 * Math.sin(t * 3 + i * 1.7);
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
      drawFerries();
      drawTierGlow();
      if (Enter.begin(L.wheel.cx, L.wheel.cy)) { drawWheel(); drawSurge(); Enter.end(); }
      drawChimes();
      drawSwitches();
      drawGates();
      drawArcs();
      for (i = 0; i < marbles.length; i++) {
        m = marbles[i];
        if (m.z >= 0 && (m.st === "track" || m.st === "gate" || m.st === "wait" || m.st === "fwait" || m.st === "wheel" || m.st === "drop")) drawMarble(m);
      }
      if (Lg && Enter.begin(Lg.x + Lg.w / 2, Lg.y + Lg.h / 2, { rank: 1 })) { ctx.drawImage(Lg.cv, Lg.x, Lg.y, Lg.w, Lg.h); Enter.end(); }
      drawReceivers();
      for (i = 0; i < marbles.length; i++) if (marbles[i].st === "gutter" || marbles[i].st === "towait") drawMarble(marbles[i]);
      if (Enter.begin(H0[0] + 40, H0[1] - 50)) { drawFeed(); Enter.end(); }
      drawOrbit();
      drawEffects();
      ctx.restore();
      /* The lights go out: dark at once, held, back in the last fifth — the
         HUD and the shell stay lit, the machine does not. */
      if (blackT > 0) {
        var bk = blackT > BLACKOUT * 0.2 ? 1 : blackT / (BLACKOUT * 0.2);
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
             held: function () { return !!held; }, codex: codex, wipe: wipe };
  })();
