  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Slipdeck",
    /* One sentence, three words in colour: the two gestures and the prize. */
    tagline: "<b class=\"w-bin\">Bin</b> or <b class=\"w-keep\">keep</b> the card you are dealt to finish your <b class=\"w-hand\">hand</b>",
    gameSeconds: 0,                  // no clock: the deck is what ends a run

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
    bg: "#050d0a",

    /* The painted scene goes behind the ROUND too, not just behind the intro
       and the end screen: assets/image/embed/slipdeck-background-phone.webp replaces the
       flat felt fill this game used to draw as its own ground. The motor puts it in
       as a CSS layer under the canvas (Art.dressFrame), and render() below asks
       Art.scene() before painting a ground of its own. */
    sceneArt: true,

    // Bands the engine reserves (design px). Layout.top / Layout.bottom are
    // derived from them plus the device safe-area insets: keep gameplay there.
    layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 26 },

    // The stage is the swipe variant, re-dressed as a card table: the shared
    // finger flicks a card right into the hand, then left into the bin.
    // no app icon on the intro: assets/image/master/slipdeck-title.png, the
    // painted logotype, takes its place (Art.titleImage, packages/shell)
    intro: { logo: null, demo: "swipe", caption: "",
             // on a desk: the card is held and flicked with the mouse (shell.js, Demo)
             desk: [{ mouse: ["hold", "drag"] }] },

    // LEFT / RIGHT (or A / D) fire a whole lateral flick through Input.swipe,
    // which is exactly the gesture a thumb makes — no keyboard code of our own.
    keyboard: true,

    // HUD slots: the centre score is always there; the timer fills the right.
    hud: { score: true, timer: false },   // the right pill counts the deck

    /* THE BED. One track, six windows of it: five for the bands of the climb
       (below) and a quiet, slower one under the menus. The entry points are
       the track's own seams, measured on its RMS profile (docs/MUSIC.md): a
       sparse intro to 22.75 s, the beat in from there, the full body from
       45.5 s, a breakdown at 81.75-103.75, the full body again to 139.5, an
       outro to the last hit at 162.5 and a reverb tail after it, which the
       web cut leaves out. The round is not played on the beat, so a window
       is cut on a seam rather than on a bar: the crossfade hides the loop. */
    /* `seam`: every window loops on the bar, two beats of crossfade ending on
       its downbeat (docs/MUSIC.md, The seam); `cut`: the playable's window,
       one seam of pre-roll into its embedded cut. */
    music: {
      volume: 0.12, fade: 1.6, seam: 1.45,
      cut: { from: 1.45, length: 23.148 },
      menu: { from: 0, length: 20.287, rate: 0.85, gain: 0.5 }
    },
    /* THE FIVE BANDS OF THE CLIMB, six levels apiece — the same stretches the
       level map names on its card. Each carries the TABLE the round and the
       end screen are played on and the STRETCH of the track under it, so the
       two can only turn over together. `scene` is a key of CONFIG.art, injected
       out of assets/image/embed/slipdeck-background-phone[-<felt>].webp. A
       playable is one round at level 0: it rides the first band, the only
       scene and the only window the builder embeds in it. */
    bands: [
      { scene: "backgroundPhone",       music: { from: 22.75,  length: 23.148 } },  //  1-6   Warm-up: the beat comes in
      { scene: "backgroundPhoneGreen",  music: { from: 45.5,   length: 31.826 } },  //  7-12  Pressure: the first full body
      { scene: "backgroundPhoneBlue",   music: { from: 81.75,  length: 20.258 } },     // 13-18  Squeeze: the breakdown
      { scene: "backgroundPhoneRed",    music: { from: 103.75, length: 31.78 } },  // 19-24  Overdrive: the second full body
      { scene: "backgroundPhonePurple", music: { from: 103.75, length: 57.796 } }   // 25-30  Meltdown: that body and the outro
    ],

    // All user-facing copy in one place.
    copy: {
      start:      "Deal me in",
      ctaBar:     "Install now",
      ctaEnd:     "Play the full game",
      replay:     "Deal another hand",
      scoreLabel: "Score",
      timeLabel:  "Time",
      endScore:   "Final score",
      gameOver:   "Out of lives",
      timeUp:     "Time's up!"
    },

    /* ---- SLIPDECK tunables -------------------------------------------------
       Settled on lab/slipdeck.html, whose bench plays hundreds of runs with
       an always-keep pilot and a line-reading one: the rules are only right
       while reading beats spamming by a wide margin.

       They live in CONFIG rather than in section 6 for one reason: the web
       target's level layer lerps them per level (docs/LEVELS.md), and a `var`
       inside the Game module is reachable by nothing. Section 6 re-reads them
       on every reset. What a level DEALS (jokers, special cards, the pair
       floor) is section 6's stageFor; these are the numbers. */
    play: {
      handSize:    5,      // real poker, the anchor included
      deckSize:    32,     // cards in a run: the only clock there is. A
                           // playable is short; the web levels deal 52
      chuteDepth:  3,      // bins allowed PER HAND, the one past it costs a
                           // life. Reset when a hand resolves
      shoeBias:    0.70,   // chance a deal is picked to keep the hand's line
                           // alive. It feeds a blind keeper too, so the climb
                           // lowers it
      pairFloor:   2,      // lowest bare pair that pays in a PLAYABLE, as a
                           // rank value (2..14, 11 = J); the levels set theirs
      lives:       3,
      jokerSlots:  3,      // jokers the rail holds; a fourth asks which it replaces
      pickGauge:   4,      // joker gauge: a full one deals a pick of two jokers.
                           // A paid hand fills it by its strength (GAUGE_GAIN).
                           // 4 gives the bench pilot the jokers per run the
                           // old stream dealt it (~3.5 on levels 4-19)
      curseRate:   0.05,   // chance a dealt card is cursed (once unlocked)
      veilRate:    0.05,   // chance a dealt card hides its suit (once unlocked)
      enhanceRate: 0.10,   // chance a dealt card is gold, glass, wild or lucky
      tallyStep:   0.42,   // seconds between two throws of a hand's count
                           // (THE COUNT); 0 pays at once
      pot:         true    // THE POT: a binned card's chips wait under the
                           // bin gate for a hand strong enough to take them
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
    },
    sounds: {
      // pop: "data:audio/mpeg;base64,SUQzBAAAAAA…"
      // music: assets/audio/music/slipdeck.mp3 — the background bed, looped and
      // crossfaded by Music (see CONFIG.music); mono 44.1 kHz / 64 kbps.
      // Cut to one seam of pre-roll then the first band's window (21.3 s ->
      // 45.898 s of the source): a playable rides band 1 and loops CONFIG.music.cut.
      music: "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAOvAAMCmwADBQgLDRASFBgaHB8hJCcpKy4xNDY4Oz5AQ0VHS01PUlRXWlxeYWRnaWtucXN2eHp+gIKFh4qNj5GUl5qcnqGkpqmrrbGztbi6vcDCxMfKzc/R1NfZ3N7g5Obo6+3v8/X3+v0AAAAATGF2YzYyLjI4AAAAAAAAAAAAAAAAJAPcAAAAAAADApv1nyGuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAAAAaQAAAAhHAwTIrDwAJZWV5g91DJp6GACFCZZxyeWsSMpwwaihgEBiL8TTQBu8F+Jmq2A5DoUERjQxQTMavf7o8f3gPImWNnsxv9ggc5cP//4P/4fCAQBAIDgTGBAAAA/ZgwKZlKQZiMSh1Rf1u2YIgIYthaZxCMZSBhh4OAdtzCEYTDkEccIpcDsCADCXIoF1AzAGuHgZ0qAAk8iAuM2NALIAGB4NtguA+bqk4gThMDtHJD2/2QaaRBMZEVueLpOf7aes8aKcyP/+1LEOgAS7YkdmdoACi8qKyuwkAZf+3+YF0vmpsanEEf/t/5mYIOYGik1qV////+s8Xz6Z+2O8dgzb8kkjbdhcUMNJSiZG4lK18Epc6jhvBSuH2sP958qKUSGCDrKKHiEDjA2J0WIxYYPF29YVlA6oSEGqvtdym2uoVIziyCbBhWWQueYKyiCrpQUMPRZDX6gZnNdq9su2KBQzLWOgxcVo5IMUQMVdtp3s04f+aPzRoCRAgQMZbbqQIIfJ2xnjM0/eoQVqmAgimpHG4nNfdd9FP/7UsQGAAuRI1OsJE0hfCMpKZYNkTzhJhC3oGetBIy7KhvOA8Ms4QSYYxq4rQd7UWSqsGRinY7uiujOyIiJ3LS897JX0KH2RWM0shns3pqvfzOy9OY10qreoYOvqwVtu1UpKzv50CA1UEnJeIJXMm2YKx2EmEGu5FBjRhoIAJBl661AermD3jM85Zy4MdNJRenzwb7FScdDZTJpTuTH9jtFR0ZSOPtIOT892b6XJmd/5/6MXT05tv+5DH1xLd1eg+vMe7vKAgJxFIkqB4W6LZGB//tSxAYAC9CjSU0Yb2F5kSm1lg2UgDViAckAsGrsRpUUFwQXA7av8/MUOS4OtR4F3uDhl+Ku6O9J4vVzJ9X81ACwFarsZrGM7aZHi9zplO+PDDXEH2qOJFeLogBAIHzaTtJQdOx7EIgBAKVJBbkkCirwsOSJC4yBkOOCxBmgFIAYiY8wx4chgRDiN4qD8Wj5wq7mFExKX5KiQPOwjLqk4kjs/owjEZAlRCgOuPQuZSFgVIiZhUWGLCn6j0wSYSiVr72mX0pVglwUDkTwlgxaWpP/+1LEBYALsKFEDOkogW4mK3TxifxDVXJGDEwwyjfVray8ZdOHy5OHhNBmmfSr8GUez0TkgjEQ49TFm2qQLlgwIzc90gEi70EYgHBsKHpozaB8EDBG9ib4fGgQCGVv7pD///P4WnPhbIVCR6tJq2/MomthxHOIc1E8HoMsM2O2RyeDLIMqqNAEhAGotwoDGUQzLHXyL5941PPYzpdARMZp92Nf9HVEKWXJX3syOi0NN99U/6OuX/RTKJGqAooIgkbtHemIECDSKa2W7RBrLmVGdP/7UsQHAAvk31esGE9hew7pHayMoCxW6vK5z1sAhUEWpPMtmvCGCBbIkKXNO81W/UAOJk0n0DZjL1ObVVkrtKmyMrl3/rvzzJQzIxCMCKwJhhy32sZ9hAWAQ8H1jlvHMQIBXNY1NQBASES1I81xgokRBQQ7o8RlLNMQstQAYE4ICpH1eAeF0IFAYHjOZjhABlCREPQp4kEfTWgzMIiCBDVZSh4YP/sLHA+YUJ3rRTkC6Ft9nnP8MIcZQjSbKBG90Wc0IBsgtCAIbTYbSTqYQB4j//tSxAYAC6x3WaeYq6GAI+s1hJWgEhABBKVcPpPB/pUCUsQf3DvzpAlXx+9h9r7NvTddV6sc9okCiKxWfVOgggHwGMXgAWasGw0w6bFsZa8Q04p7ZOwcPUlUWrJSjHxYThwg5+tdGQIFCAiBRbufCUTDfwUSBgynbm0URFed+n9azQN4jdan8IMPb388DBScXIRmVf0I0hxZCEpyEiYuhNCMv/p9tq/Ot7U9V9vv/q4CARnhYgTIEOUE6HV1bBdBQGFlIZFBtYAAAAABSojkqe//+1LEBQELESFRTAyzCUgj6c2EiZmBmXmFDwwcnIzgLITOhiciF9+ocpKWrORm7S2VUhJLWFcP+W+VL6zk1qyzpSEYf5W/q19NzGcy3r7108qd6ftR9TUCSCT6eN9NL4r8ptDQASSsJqneeHZaC6wVRL2RCBsmmOhFH3QBxC0egpEhN5lFmfulkWpJMhEU58AEKi1d5XZERPW11ud7tbVttfs/X//Wkn0ykOCXa7eEmdXqb6xJ1UAIAA1j5qH5pszqgt7xRJaLprzVC+zaQJcfO//7UsQNgAmg11EsGK7BN5goyZYNYEnTBchJW1QmOUduz21lR6aDUExoBKHhBUqLG6Wf6fZ2/6NyCZmOQRHuru/+t38zX//oAGPOtbVIxZKU4PGir2IRBgcL1vKkCEtIQbpHzxMtcTXXR8k1nFeDObQUMVYRNbPWqjL+fn3I/7ln2R+2lvDgo0pEt+sBWLETyqEUv90sxDITcaSaSUCqJC0I9XCDpJBGyiAdN6EV0YTEjztvSQtbBUvVsCdVu4lGpv5R39qE1WfUef/y//7mNHRj//tSxB4ACnA7X6ekaTlPDamdlIlj7iLb/fbY26rb+9o/5fKuE9ZpDdIhZ3xkDgEpNwXXCVKzhI0+6FV10KUQpkCtYySICodnkJEKClPqaJ/lXMz2nS6p1Ejem9/3vIJ6J73W325u883B8m0c9HK7Nmc5+Xv3r+Nn8RcEVFdf/8ZqbCJSlaSjSTC5P5xPCoNUnCw0ynpGXL2GvvtuT/NUaVz6GEYwSEdMAYpBRRXbbwLM2ais9Ized/MYoOEfugVw0uoc63kjY6z3bViM8uMKJQb/+1LEKAAKPJthp4TS8UIQJ8a0kACIXBZBbZCInAIifHpchU2Z0aYASRAB0c7DGZVNrnUEgVUHiMREANRFLCsjcYBkgxtxekXVtOKFiVJRerXjPavO+xI4QWDUrdVkFLSsWGD4q9/9VSSSPNZLb7N5s9t9qGA5hmFZkWbM1JOO2KfcWwYYxkNpzQYcI5pGhYEkFvAflYJQJA0D+fJYhg4AgD0QYfCoeR/WDrTUuHWQqTWCUbyor5RcZjYgiZuPtMCHQRqK1CYWPiV1KVPJW5yT0//7UsQ0gBMhi2W5lYAR+KqqwzEAAWQb2uiO8fT7TxxiR1V1nnHq+R/KDrY2yv/74//////+qthz//////////6uuGLH6aJReVOxaSUSAiZe2nHjRt2ZijkDvwOXyIEVNB1IkTDCwXIF6gOkplBER+NA8ovkRTJkpKPIlZi4K0FJlU1NjI/KKFJIgIrYdpASgOFMuoKUgyqNNFJBJFX9X7qb1vq9X/s62QTJsoHVly3MUklVf/RWXC+iXkS6pM+xSc/pLqr0hkAAU23GsOkRg5hY//tSxAaACkR5WVz0ABE+juophI1Qieg3zoJ6hisc2xXzKBdvKBrYTLKKvA0c0VIrNKsxK1RUQyR11TZxZ7TYiHCqTDhlQ49GBoJ7vo2K/2v36RTPXIT36e+K8AAAAE5LNp5XVa2vEmYeCE1YdaWn5eGGyFYGso4XA9lEG4QqIOJ4rZjueZfOHMlcSMPF4lKuQNxoI7DJ1mv/OdKrSm1bvluOwmhDWIPZFaZkAAxZMtORyqQ6DtJccpFgaZM1EaA+ljCw9Y1WroTgCAqOMHo7G4z/+1LEE4AKZGVVtPSAIhEmajcysACdcf/l5SUrTd04iEw4OsUYrWYY956MZzKGjdyUpWwjTT1L9qPERNKJp/VFRrMAGrITlqcatls1kjABecwjVF0qQ40yCR84aDJlMRqFDAHSJ4KFsnS5WGKB3tIY+CITh2ECTj6JDGxOIZEdobvXosTs+N7kkTV1khUmrkxGZOH4NodEUzOMOIHbNIW1n26E6uL9YdByVte+4e5lf1U8Oodi0j4yEDlf3X/f/8/3mhzOVTVsSQMNDQrLDIaBav/7UsQFgAvdBU4ZlYABS5Sp67BgAAUBLIskD2hpaHXVa80OLP4wOCEiZiCaaqcue17rYWMeufWasaqt2cHFPOnb28I0a5677rlm6FXE2ttfH/UV1fB1szPSvzX/227ZLX9qrIu9/SYKUoAYISUmpxBEXTqae14HbN4BIjUoq0e/UlEA3IdzrrCDtJh3UZn8x9t/m93rHindnztn1qqr/7NnZ8iZzfqjp1WyGqHQVZ6flhEeET9w0XcVe0qhASACo6BHFh2zkS5Pc2xYpShB1FVj//tSxAqCCmCVSO0kasnGpKjJpI4YTKGPhRQFCAMIIzMGiSQgIkHCobKlNEpB2B7Qu8O4xNe6nNykKmDE7hO/WmMexGOsE83lp/d9p6vO9z92PvsAFqzXWrlgSZYNZg+MAsYhEBUGOgnKbtDb61JZvkzIWEqqFalaSD5JdvoC9NMHAZJxkAdGKEpGcrUXNFa3I14M6VT5ZPYreno5bCBaOEstOcVizJueVu6OjhA4UMFHGFo6QGIQ4OF6AI9n6DQr0IU1r1JoBORyIttpwSpdoKz/+1LEBgAJ6JNnp5hssU2OrHTEjSaVDkYjjnWTKQJ3ICU4LHsDMCPw8VlytXqyk3DJFMLfY9qvO8P1JqCRamEhkWZmsBKK9W1R6TYgupdZEuOnnIJse+h62QCnHYk42mwXRGPD1wDILiw9ITjJEDJwHATrq9ttTsQQAtSEq+X4nsdWiHDiwIJFFRDD4GESQYIIvOvgGae5Zja5WxA6CwjGQmUh9jzaaLCSCVVdACr0BtJOCSvFaT7cojOSsEsr6XOcE0xFpdv5pL7p4vk35HOyZv/7UsQSgAokX1FMMGkhjSaqaYSM2EY7mZvGUxJISAIwMECz08K1mxOJy8vWigy+gIh9cbHSY8mUVY/uoIOYIHaEgAGwAknba9L/FqxpbEjcRQVK8AYyGygVZkhJsrMGlBIWf487ZvLNxE9DKZ+VhGWccy6Z7sUsRHMEjomXPMnOBMCUKCWVB8uxqfnxKpofwv9+c7C00IXQITAaCiQTCwA+0gl1alFUqwuEFBG3I9lmEs4W2CGInCUkJUKB5RIkVjsYLpNIIJrAeAw6s0xbWq4P//tSxBYACzilUAwkzQFQkmwphgy6dXxeJI1TyuSREo8mgtE4sRYIQDjQoitSzTTgMkXBILCQCnq7v54V/08CigVSScFVkEpJyWOpWS5uosyGxF4VGaBVkvgKDod1WLnm3WdaXtQ4i6vMyHUyhdIpzLVsjEyEBlh81Dm8SPVsrnf++i38j31CVwQHzBVJMhEqHipxVQF6FwBwABATcguqcToyQ8ZATY0yQFzEaHLn4sOkbo7xaFkDFuJkdYhG0oJxbMeeX591qq2hljLimzJJ4jH/+1LEHQAKLJNVTDBm4UkTaimkjRwTAA/SaoU9oCxIbY5yVd5216UMIysWRUgCaoAKTcEcVKwVBYP1GPEQ0sOwCsBcSOIyYEQptAyiJQBBjuQzRtVMnkr/lrJmb3Kf3Y/nclBmw0wQSDxZ9IFJhV50216QBRWKXWdLjFjNtxNCqJcklrbsrkBAhHHEmI3E5EPs89rmEiVtqnSrn7cWE81idsv1W/a1titPhXRNEZxoIShasSZNGatH40xDihROD4QKiA5NtSKHUd7lqHa82nYurf/7UsQpAApws2+nmK8xUY6tdPYNLnmcQW5JdE425AD4FwyaA8WtStRu1Dh1Kg3gOWsg9RHhOxlU8j4OR8B3zpAszzVtyNhUJLtcTGVE+XEb26LgcMhRKz7GCzzY0dJhA4RFxZdCFp1gwbsRYAISKiMoIh0SIjS8jpDdOG08BqWHShaqHxpGWfbkrUXuryw6QiyV6qd/oCLXi0UZdA3D5Wtic1QwZMaLmRUMMaYc2lUAqeatzCNutH5WxSzW7rQJZpBNtyB8Gnv0IRmtTkPEv1rE//tSxDMAClCHV4ywZ/FNnyrphI0a+Ix0Ye8RqL7Kw+DwUBnrmDCZL+12WKQJrL5MrM++NmRlodO731Rgj5+Xlzzcp39TmSn/56UQxwsf02FbK9Cb0kBGqQSTcgfBrLbwgbOLSKIf4r6wv6SUFxsjGnTXIE61jXLfdHQ0gX+z+qSGvUwfppxcjRUgDyFYQDL2viguLiFCEYs+kVEzVKPrdNpYJxetFZRWoADAAWgAiDpomIZGvriMWWZEqRdRw240dCUikSiTYQGjz3+E9z3CcJT/+1LEPgBKcG1VTTzFEToWKSWkiXhlulsUCdR6qdLSS3bHe+7ZXsWqRT++hhlvMGRO96fbAG8Mb9VFr0wk7HIk423Bk6zUPcQJvJWvIXY/OzqnEJpe6z2PAohVtoVOsudoIdGYaBVLm3DSzgIdABto0HVSgnvtLEyEk4KqklJ3VNr5NLxNIUMqPXoB60gnJtxE2HOwgjPgJBJOkxKltgmPAMTmNJjdPgybkpNudBYJ1PaMrAajHbD2DxcVbrFisJ5RAEFA27KKCziSmDGjsctNTv/7UsRLAAnUY2mnjLCxQo0qKZSJIGJlEzliBemuqiogIF1plplRwPizqJqHCA7Rpa/LSqcXwJekyBRymFVuVjfNysnWKKTqTSEIruQRoxBZiFO5j0U9Pr6HvJWnV9KdXYGgUDAnKAOUGHOQKE+0oYPhmjqABroBkJOBjLci59c44ghCyhPJDrCIzIpXRyq3SyYWHSLGdnuiskmfSkWTSEgaJxUkskechsHQKwfBVIiG4lCkYSDR77AE+JVBpYzkmazx/5J1z/TVAFh2rgSUAzWj//tSxFkACojZV6wYSeFPjimqtIAA8nstgDfgFYuly2VCIhmJDrAkalVoAeCCw4jLVgAoJrmB/k4EaY6aeuCMjrmdQPHFjL5EIOfbehpKHjkxpRwdMSEn8WBhhKVUqlydaxB1fEGHiJuJu0Nyj1pFj61rE2/TetR/qJbTP84vX4xt5EzE+9Zj/b6+M4pT73///+8i7eUzM/j63GboVcUmi5T//0hg0AKlviy1SpB45DdWBMs1bma40sum+VIMBQqi+KP3cK1ZFmuJ65gvrO4sJif/+1LEYoATNTtZuYeAAUSRaguw8AAtPt+261xM+1u1rbzq2t71PWAkuU9G/ejQvZ/t/5IMojm3KXt3KYw07FIk22moX0LBJhGgjfHeWR7ItkhROrJz1KgV/y+G10kAj2PRKRX0g9qiDp5mbNkTGRYVTBQTlAFep2+1Dk8ix2ZLBcYOeHqkbu2it1cDc83oAABUBAAJLkF5LBNUURMfBOxTRcC+EOIiHCho6IyxGldFUBDWMbLz8U2Jw0ZWFhwMeS7+xXmjCxQui5j4te5lizRNsf/7UsRLAApgi2unsGPxUA/pdZSVMOtoxASUaNGBd1rb3VZtHmEKQCCjCJAbdtDKBoSugiCjahiaeaRrS14PPXDyQyMmZZlHJzMxnsm+oStJ1V71gQkVmH/dOWhtzvWSqeV3gapnYVszCvY0969i516opjxpyEzLTBQ1E8H9jH0P9dAAACKwaGQUkpAuCWK4ToALJqpiKJBuOKsOmAQPRBagYwe9X3Q7iTciWIqF8lEjlllV/2+na8p4b/PLLietCmIlR8z1B1leGg8AooxVoXXs//tSxFWAC3zdTa0ka0FUFip89gzsaSXPWUvWA0AF2FUI1kuWDmZ/SlIOD1gFnJat4t8wL5TKhQLCY0gQF1311cdmL0JE1h9aXE8S4EzkjdYpT0w/0aEd2ggyQeVMlTz8K5uJEiifmRkhqgyT/CPD4jgCq82h5ezsFJ5imvL00OASEZQi8/yl5c07RYQgmxCxFHVWxKbSYvC0hRrWq+hYyqouetla9frxNNWbq8KR7jnDpqrk5VJFnZR0ZkKzbul+GjjChYqiGshiXO/rrf+roCD/+1LEWwIMZNlCzTBrwZIfKKmmCXm0iryKhhASpGQRwLmzt8l7/rUAACAlAApyYKOI/ukZBRpRsla6zlGSXvRcVUgd2spPJ+AJNTeSlXeBFI16JpPqBjCxYVHkzsTgR87KZHGrfuSS44ZT9C+5289SJ+ka9RzfvxeGf+X388tPP8ktnKQPfe8GNIREgACS5Am8JG2WIIRf0ARrEigEse7KZxsU1SFwTBCl7FPQnWJulWLE0bcUWSwPGF2D6/5ZmdXOhCMcxoq2fVTvGJsc4dDiPf/7UsRVAgxZOUmsmG8JhxYotaSNsXOY+np1zBZjSWtx0K973IONE9Wvy5f5f/JbNQAi5VEQnJ9xNMfcVKsCKWgE5OEWIO3wsWL7o0CbYVnz9zjrLAaCKwOLKRAQHCwxURLS5aXw/wyHw6wh6fXPMMFrg+wTHZkJg4g2MH9qN6D93eqhcWPBN6gAaYASTjwg1QqBU9juBUwUqd1TJ/5dDiBUpBAdFQahxhUaS0iJ6RdYzGAolE691rsfXNS2K+x6+sU+hQXHMU+o3VIR6qhPiiqg//tSxFCACvivUawwZYFZFilplA1wAADnx8LRYmscLC7klwACEABrFZUwn3LyAv5ecia9q85QzuOisWTtClcklHEdL0fYTPghYXE9wUQMVBQ2eEfunaE1UO9+v+iF6JOO+RGR1s/tv+idd3iAZwEAQ3FiE6BhwN8O4G90QQ4X1MAAINEjq0A3kAAKSlMFVuZdRE1YRS2EhkTEZddorxE/Fq6Mjg+sUeQsuOpaKVzCFBBFAXuoMpDh8uxDBQuOdtp3EjEUebYenZIFUfMJIgw4I7f/+1LEV4AMYRFLLCRrgU2N6qj2DODxanVeTCLyKgEAAFSRdH8QcIwhAmqfFyT5dLp80CfmAlMM52B0G+PCjUmwLHCcdDQ4RBUVCpDBfExXNATMGBXgTCISAKSlkYlNKI2GhErInPNIUm0dlhlZ5lZV+UxMNSi//8/zL///81nDKw9qUth0o5CmBhgENSDA6jq3nbMsp3JrnUNqRkd/NQzotlaZVRJBKbcMEiFUIUKFDyxKk0VCKebItXYlabl3gMZgp4tRlZqcDYpSEUCcZiUvJv/7UsRaABCZhVLHpHGJUJBr6PYNGs8l6YkcONHgdO1AY6JWEOt+r0t63brLlQqRlnob6X7FliTGt9UCAAFW6KULDWAAf7pPk9hUJhBcyGe0UTOa5uRrWHdaO3MmSxHTTrKl0mYheBZ6ypFL3R1dbnjiqZfmyDbek6owRp8klPOLmPT3+KO+v0CpAYUaiQCj1/iCAJQsJADEQZcxH9BRYkUGeTDia/ZTZprY9AYYovn0G8xU6KVgs9ptgAB8eLCOwELAkvzxskg4wybyXfoXTUot//tSxEuACdStSswka8FLi6q09I0gWzQeFY/ZYPU87rUkMDoykJt24IgZpnPQfpT88hJHpsTC6JgmzhRPwo6ZLKKdmI8qfT7uRaiywtQscIjiwGQt57YXbaMCoGZPvGkDN1wHQLTTt3GaqTkLV0D0oQBhlIARVlC2FmP+i0JfUEd1pisc1TOZTTsJNYceE2ihhJ3Z2h0k/MUmyTGLJgiMZd0JkUIrT36p3m3dHbDojv/VDaOWXvHotoNxV2xMSXzRo8hNamhQc9EA3JdwB0kJmW//+1LEWIAKDF9Tp5hNQUwcqamDCagbw3zsKcgsUF2Vx0XUFLDLyyJhzEjs7ELz/0gNwYl4QcKZXOERe4I981+4OdKkZ4IFRp1KUvK+uh9iLhkzN3Ok2Vs6U1ogqSQqK0TaTcAphP24VKabDnL8fEMwY6mqUZMXHW9tVFXJR4jOiRWmCrqbXFVBFHCMDFTBMcLpS6tmM3pIXciRiqRem3VurpfcQQhbDaR2gKDaAgQFp3VkU0pKEktnwTRRk5SkcfbAfhtnib5JnyuUcibMt9Bto//7UsRkgAo0rVWnpGkBR4utvPShnghPYvZJdmF5eYo/oVKYwmDj0uMtMWNepgwOhC1zQA3YgO06bFPTape5c+fYz1ghgSNRCBYakehhpnkLUUb4yKtW4CMP9SP0FJlCH2jjHRoGMwCGRuYSrBMnSy4DCrAgjYsOR7Gkd4VUY8YCMCn0n65+VXGmBBSjLHnrePsF2Ja1dURA23GjKyNxNmVBLJtCynMFT4oUJV59Q3UNjAaigNIt6QA5oxQusHxMnr8KaAV6YuD9vKqVW8+Tr36n//tSxHCAClRxWeeYbyFLDutw8w3WE9NYf2X71tGs2DUhFZbTfK+AhBpqNBJJuBvL0ep6cl7ASUV2YOAYP+Yq0wk/N0jecq/FzeQLd1e7a0fOHCrMUiCRjTXvube2szK+rMRAGYDO1wQcURMTYwri7VvTTVSya/ZGKgAndABJUoI2Ik/6hKIyTnG1ICajcCnpgIsgFshCfsgjRzNJ1Iaq39tYICRevGxKDKPmwo5LyZ1ZtAWWGVCgbbQykx3t8ktarbERfU1btceAEFc6SHG3+Br/+1LEe4AJjFlfh7Bm+UcWKvT2FTLQhCFI4AFJQMhp8pxDiP2M3FzrArw8RGsqGEd9jKYQUc6M4nZCuwedeww23mqvykYQYU/usT5ZpmBkmzIjqc5guZTnBdm5tQAMNOUcIOeuDRwHPccRTmGOBlOGU4DNV8Qnav5fiQMgbYA8BNQ5YwBKGgTkKoFoC0D2EzVJpLkAvqJqBWNY9DJE2Nj5WWhzBuKB0sHwrJVNbIoutZJm7HXJq3ZFR4yQSrJc1N2N6CKVkaL733TTp+6KqqnSU//7UsSKAAnkb01H4MEBPRYqtphQAH/mjJopy+mmUDOlp6zFI///yXNS+bol83W9/MSSLygU2YIAAP2ZpNS2o4W8/BfHepZmNRKNwXLdmba4a2UcqamWYsa8aE+W5q63aPLXcBzrn7xCfyzTYxj1+t49oz1UrUotNiv6Skp2hIWuV5qsbtoEw575UWxVxg6cCG/dANy29tPAvKwfijIYm0w/OyNuOgir6k2uQkqQnEkubxTjdTcsMETVzlq5FHKrzIJPc8is2BRUeIQ2XehLVUJR//tSxJiAEsmDVTj2gAljEKobnvAAN2NRvdp6MwlDU9qT2NUDoJKbdsEhcAASNxsFOXb1IgyE0cCiEDQw65FSkjvVk8VTNVj7lIhRE3d1xejrtt/vHqQN2bcl22nSUoWx5kVszRiTz6FIPEi6RdNDyCC5VeVvGLsTe8NyQs8WTcxV3S0SqbapBADiYYARUs8EKaOO7zrMtCCJ4rpnG4WvqOARLPvYFF+XxH7GIq+X6oEmDLChzLW6keIH6mGkeUBplwqVNzaSChAGLzbzFVj3xwv/+1LEfwAK8IVXR6SpQXEVqnTzDegMRbFESf+YxzoCSOQfAS1rQS3UEkB7VVApy3cwEJQ9LmM5mWsjuZz0cjvVSjT7cpSTCdI7nXWaXhLMk7zZTEC1InaF9zI+/TfhbnkZJS7eAbUoKFQgZEThCLlQOApY4UfU9O08jc5OT1VHn+y5KgWA25UQCi5eRpSmkuyCLgWYm4w6KKjG9eacI2WaPKfLDely205DLON/YFfUNAFo9W3RDMnJp7UMzJZUnOGCbIhkPFkgUVdQK6YWnV6ujv/7UsSDAAukg0+sGK1BaRaqtPMN2J9Yae0k9VpWirkggBM22QWi7ebB1nWSQmp9C2nEjJj1fv08c8jxqCBsqXuSHNXneiXN6VfBM4UcDV1rkXBViopOofL771bC8siXQdC782pf+qh7FECL0QKEOtFpTucNS9cjptoAAKNIkEopuCcO4+rF4/gOJghIwJaI0JERG0VG4HNQp/6jIDPMHlyKGca8MhJnlNdObFlYT+aFe232DDndGPcLHv1LUBGsB8iB9Bvt6OEi6mJhOPmNnYAG//tSxIUACxCvUaeYUoFkFio09I2gk5evEOLAq0EnAtjxIzMfEdzxQWiObVo11JIWvJ7ty4xvrxTMuG2eVYGM3Wh8P7JpHYbIPSCsCQVmbT7CDo78jcU0X58vd5/8061b1o01EC6UAAGS6bS6gtm7SHbEjP2uSw/e8QFJcW0uYzO9d9bEJ/fMmsoQw2c1bS3KMit+++/R219xjJ98o7qHaiIzDpW7ruShySYurA7Y+cQNd/Z9D0gA/ICoGioRKnj02/QQgoGrXFgVbAARuLsE2on/+1LEigIKkK9VpiRpEUOVqjT0jWBGmW57999Rg3WpRrnqkB9imZ814ZR128+evnnAQJvSLvE9lU0n2f++og2VaaIkbnsexaUDAAEg1vJdr0fcSQAVjzhANrtJHi9EuSqFE1kv1jjiysOYhRFu1qrcVIKsTw5MyDW949netcGI1Jkj3H408ERXqSuYlBY8WJqkXKRQmx8w3o1hGFBUI3kaGoACRcC2BClImEqabPqZWLDAnGTLnE1mFJM3zqSOOONmhOUJBSashFyZ29mb+02QF//7UsSVAIpU3U9MGEvBOJMpaYSNOJHkdWlULsEwEEJ8YJkIgOlE0EL+NoLcuQJ2Kjhx97WjdP+qu/0xYjAgeYoWbFXepTAiY0wACkBekVSpDLqTY/UJU8jUridK9HOgMZLzUwwURw/3uEFHkyr6G5u6ey5mSZ+1fYnjmrKKEsHSJwALC8SgyPmiH///7lYIBZX5gVYMaoZI/NhJSLbhUi9RiOhHQfmzQZEcqHs5ygpQMJAnQSixeSyynHItWup6xDXlRmrkjA9VJ6QNHKMCJQ22//tSxKKCCiy3RKwwa8GclukE96UwlU70Of5VmbV/61xu5tHnSTG0U8olKCaaiIKAu9JIVpkOBMyfsQNvKodDI+qQhlCKRKcZhZa0KsBH6f11BURExjOKHFiKREu5ykPvoIiz+vSxCqy9hNaqQGmplCj1+l6BVKCg8sQfDtrOsAARtogAEJypAIIki8AzwOhCnR5URoYiUyqOP4mpaD3vzcVRq781jIp4LIk6UJwkcMhRKLFJ1k0nEkw267n2nniJ7fDNtf2HlGUkDxXndbEga7//+1LEpAAKRJFbp5hvATqSa6jzDaL1qgAYQAAElHEgF7KDkwgWFN2dfas7EwRhwmwSwbQZcn5KOOzlppSTKLZBvrBsiMQpLF7jJhcNkCpy/PKEZAxcucXMxYkQnTVXYUSSY3Y6i9H/+rqJBTTjQMIOQESCP5YA0VkAOeLVYZSysUsN1WuIDt0I/y+uZAzwrih720zB1pUcr0/66v2dlMJEgdWTHqIEJCed0J00Zgz3Dl9H1qU/U3NqZ3UABsAAACoFEoDcdmDBQkq1adjFsHz5c//7UsSxgAqQb1+HpGcxTowp9PSY4ORETNxfNFbs37K4WlDpwONTZg4LGgFDBV5JmLRuj6rfhzKZK4wcNssXpJVfFN5+Xjh2gUMhxEetKCgk3W0AgDpBXwClKIfgSI4F2qlFtBWmRVMum5m7DZq84KUzVTRgwIxqEy8kz/W133u03tO4uKuO2uMsXZo/R/a+cNBE5aX9wJMFPWfDpdJfAioEJCRsgFpR3Lg4zgPVDBDAFIhI4pqg8i03lxiZYTFyNiKOVbM6IobB3Sd882Dd8tz+//tSxLsACkixSSwka8FBlavwwYou/PhHmU6DFxFuSaeFWLCSxzBmzWv10+ltsemXHj43VesAFO2JkGNSjwjWWEsUpVq5KG9OAxlEEzHaMNuic3Y3u61KjGXSG+QQeELPGkPIJnUea+zk6E2OKKJnuAAeLN4BgYWS82kROLDmmYxPpV//lGymLKTVABCciIAACcy7C6ay7AnwEo0Wg/xY1BIOBmpzAObdMluzRbZrPuP6kcawGfBsIg0ce8kSH7d24WSXyCluoaYMt0VsOf56SKL/+1DEx4AKAKtNTCRJwUSWK/D2CH7xDilBbFDU5IBZbZYAMWWQgBJO3pk4lWcJbhwohgL5vQg5YLKJjNajUI/YEw70a9iog4iXq7qVkdHrtR23LdWIq/ILJWWv2Cr3PyJNp+TgSYSxNylsUu6f0jqNRMLI7KEkESWxkAguTCQmMmzBBKBqzSRYx53To7o0Krer1C7D2Wmoo+t2THvDZTuKHh+6bRV9oXeVncRR102HRbKi4QyEeu2dauS1bLkuughRklcSfZSgc0b6Kt7SpxZs//tSxNQACiCrVaekZUFQk6r09JUwcg5FPw2CEJfLCEkClRW4PQjDWCAuMgpRcifHAi3qO0xQZPxcRrSbrHDZoU+4xwGYin1JpVXYxej4aqaEVbWK14Plov/gUQ2uWg0Rljjl2uGk2z57UVY4lpY4YdeteKgNQ0KvDh50+pISQwFlFxGFJSLpNqxaxppxtVNom11PoMOjZA7LIXLnVaRH0ey+dC1tSnmOE1rNaIUaEBWFqO9UIOOj4iPJ2zvjwT7/UNoLEu16Y0D/bqx4ErLJmSn/+1LE3wAKYF1Rp7DEQU8WKvTzCSASt/Yt72LFlgT51rGbTq6tK6klf7iw6eXUaus5+ab+9YvPrOfS1f4/1b69P73vEp/TH+YMK80GSufTes/X9fSnzff///8Fur4MSM9NZM4UuRzrKKKKGmQ3UNLyjFUnTgubiu+oyuv1KAxRVkQazjB4q5HV0ZKq0e5kRzOYxilRHM+eXr6Gb2OxmUWNOi7VaqI5tnVAgwq6//T/vbL2/7brdVZ/MIoHzQq8wWNAU83LVQRDEAAAAAm9FCcGYf/7UsTpgAwE81GnoE9BixXq9piABGwBtDhEhL2WQs5dWRec4pRgCNI7jmEqw5Krggv8yP0FAo1Z2dMDZN2e5VRFKtuk7Iy72h5/+i2p0Pz3Vv9G9O+ispPpTciKxWledPcqCjFAjZoYgu6kKmmKGgBCGJIJKPAmZQMXK1ukyaBKNtHJl8e/KGaCnGkihbKPqSqpqPrd2tuQioCxnhvq8L6qab9numzMqkpohxBUf7IQYaeEbjjgn3Glz9wBMoUs2TWm8U5DPi9iuJAOEjK1tdaq//tSxOYAFI1rXfmHgAF7LCynnlAGJEHrkIAKLcpGC0NcXMMQkSXMhElyFsOYZR4KXtaybywV0Mb7NerfuYVDGBFQTelBEE5GaLmVnH0Oudrnf/fcK4ujm3AABiUoaIm19qGrW5C5rYZYDbCPMLP44DIDgu6oUIotp0khCbyUAtpycqHE/zoDyvl5ckwkUMdGElXKhwvpH1mrfXW7wpWTco/XL54U/WVjPZ2o26Vmz7weHTYr/FwysR5Ux6RIib+r/9lW8pp7sftrW17/22df9XL/+1LEwgCMvWVRp5hNQYUY6fWDCej6gnXrd5nUPzc3j7yFKBFTcaAIBLqdjW2ZKWBC1ogyQAXMCOLG0BQPqWFU7U7XPldQTs5C4AJK8CCnmqY/pZhXNrs7s6O9/Zq61vXzNzHb+3x8EHTZAslJU/SLq1HmsaikojVSKAEvfalyoux45cPV3qciiokM2WZFFEt3hYH4cCsBxYKh+OiEsGI19G8fvQrpWWiKt50rLFYe49JoHRONWIssLihAJSYkGibk2DCZRF6g1qMsaHjoWQ9aGf/7UsS8AAyUs1OnmG8BkCzq9PGKqYUFVsknUAAEaTYthMXe46MeWKtFjOte7UoIIJVtAAAFOSRi8CuuRJeIVBICjZgwIe4u9CC2AhLgnKFDMWLNeKzJAbJGBMQ+V40/7DLI8r7G31JA6B0LThLH63llaKS6IrTFnVuGNGIhy6EWPTApoPJIqBDGmmbIiMt+SmNEzjtT5iKtS1SsUsOsCDpT6lCk1a9tBYSAJKdsmvh9HXf0c4IdTA5WdvdrMiLvu4tl9RkHEQITK6cesyoruacI//tSxLWADOivT6wwxYGDDOr0wKJArCOx66nu1GHhU+hopENW7oUMIS5RAAgFuwSrqC4ZEpdEckA42Wn1fGBdabxb7QIiS0FhFGCtVEZ2YrhmSyC2vcE6XgpH/3s1FbIISuXc9A+eBJb+mTIopkntmfuf64wfI9+hAELe1IJABONpzlAT0FBIBoXXxAFiQkhIRDkZ2eh9szP/bR70GFu6skinaqDI907I691/87/oyLf/9Lev/9GaYRKCw1IDYxS2QRj1OD1VQnNnAOX6/6alUXP/+1LEr4ALGLFTrCRlAWsWKzTzCXB4zQcJucjwCBDtcZQ/UO1lV23zlTrWMoFqbBR1HhSzTLhwh2fkZMSYKwAautBg8yqIxL3XTiHCMI1zyzqwY6BBoaW95JwTI4trRT4o37af6UCVRDDAqRuMiqvkQybCnkh3i+19pxy9as7Q+2w0d7gWvLZgkvtpWwcVUrHuzFF26x0wmic8epyvla8vBJ5j/Nnyc44oxRe4svdq//TY1rdKAQATMW9NoAB0MSXwbRtOWxQSMCgaCEosqSet8f/7UsSzgAo4r1OsMEVBWyBr9PYIfKDhiFKwp5dnMUSy4huU7r0a3pSc+XaaTn5vrlEr4nX5t8xANWxp6VyqE2fV0e/6G9ZJAK61aUSTm9yBwzVWuPMyaeHoyLlCkN62RxYgzoarYvNkKhxVkWkzxCDWRyu01zsn23q2uux3RTAVRToCap9LadLlfLeZgBCm7G75RznJmr9NYZUfmzciSTlhAaGbIsKEj2XXlJAQZoRTGTSZJr94Ba6JEfORTo5Iw0NkpKGLVmfU1v6tve0eYBlV//tSxL0CikCxTgwYcME+leoVhhmQ2hnUoj22el93UPDjd6Ktap8ePZUggUa5JsBeEcDeWI1hxnHgEDArcBz+xhMoJ/QHTvJaQRSWV2ZnMEFLu5HuzGDrapxAVv9Ka3qQB+izLoVxdO1d41orG1qbtv2PhRRnspffW9pAIAYKWFacSTnM4xFyFsmjsFgipc/jdymNdcSpTaGfb5UTR/lY8URvWZWfb04N+zeMQwlXOmQZOsrYoZCNKRhBtrdzqw196cxeTmxZx+d+KiFRmraUlmL/+1LEygAJnLVQrJkRAUcWLHWGFOxCBAuK1meo/Y8AAhgAAClFOpa8QKq0FIk0zfsuSi+pUcFMVlbs2sKf5D8ecpQW5qQSG4oO1Elk+MR3KXv1iL8vQEFRlO6yqEeaUJFYhyQsMQ7JzxaVqbl1u8juAUtCoMvXUXClAAAHGQAIBSjPnjkRFuFJdChJGMieyLW2xMcvEcWmGlyccVwPm8ZqADHNCwcxApMgT0vqMX8kOT+dffpcrQeKMpJ+JJhxqMFHiZPQKl2lpGEai3SukPDrNv/7UsTYgAmksXemDLLxQxXtcPSI7gqT9GsCEAgCFKSkCaMl57FjEhHkrySDlwTM9jsaYRaR3zcbXROuimfM/lnGlbq1xYPZjsshUIS2mU/t+zEdn5ZGO90u1TKQMwDLsTlz8mrTrUiG1PusJNgk5xIUc+4K0iZ5CugAANZ+IpENzUD5pohyJAsdB6WJeOGfiwpxqyVRrPAC3c2MpftVFj+NKu1sYed/3Pa0ozCUCn1NFibA/TBQ86TPGnEgJEESxGliUF6uKaax7021qrgU2wBh//tSxOeADADHY+eYUuFqlepph40YY2EzKNqrOqAgVa/wtklOyg1oolVSbg4dnGwoUjReOJzc9Ied6elB2qegqWHO0MvIhJsYRcE0NNT1csnP8pYeLKz0TZBIxXcwbXUhIbdfkeFqXRGLg+IxIMxIKXHBXSLGg3UhVDWEgQ+fMpouXkZB5jeIWqihFiWicn4m00bLqi4TYwTbU4Jpszg+EAG6JQSec9kxrvnpzT2nWtRNE6xjCx3pu2iX76oWzXtet2vpv0RP+zJ06Ef9fIiFYWj/+1LE6AALpL9VrDBsgXuV6/zxDlB5z1xGKitxCsgAQeRIFEFKNhZezsfHCl1IQw4pU7zs1Wj4+SSYY0Fv6xGqTTBEZH/zMxQpNCji/kC8bMlhT88mshftiBI4h8oJ9yWIscyilT1DFn1PqHDgGjF7xnIixUgxO0x3zFZAAYeVopENzFSh5um8yiwDHbyhSI4lYgx9CMH0hH/oego0irOOa6ZjlhrFdUO70y09zzXTeM/Uh2Ie3unfs6XQxURlmv5Tp0JR2rT6LGGEDVmyCY1i4P/7UsToAAvod1usPQiBdhYsdPWNbFNDw5F7hSkdJIEFLLNBNFt1sKPD1hAGWs3UNHjng8FQ0Gsnvni8qK2bctaP7lEB0qgeZ0qhpIa6lI6NxnczQbs+X7Tt3OKIEgvygcF1DlEwoxliWMKKEri1YM2DIrsX3ReE1p/tUOTVAAAhKCMmU0Y5aF9W0ECoEchkcFSB/oYhElgZ+HGkjkGDnhLzP5Df0UztQ2YgfB1CS6UJzeQQR+VtP287ud/4ojHPuQBzrWgsDAATYid/2d7OWhHc//tSxOeAC+llX6ekTMF2lis1hg2INKPNqNjFf0iAgYhRILLZKc0lVZFDLWiZW/BESmZ+cBmxcJhMmJjzucVhBElHxbNDoZjC2SyjsyO9s3Q0tOr9DKXrElEXXoivdW+DYtl9dvTqWUMga9O1nUwtMg6Jzz2MUnPNrSqFqNWy96K7YEAlGBHJAiiEqExDraKNKMs0CYRE6zz2b8Q61tFOLuk6KUFRrrh+wN6J5F1f/v5Smcpzg3/+89iQQ6E6Wcl8uJz9Hh9wVxGKNfLUXM1Ureb/+1LE5wAL3Stdp7CpAXkVq/WGCOgpa9taa5NAqIDTKDSslRcqBBCA4WnMCC0NQ18hIyfqITwcZgHYMXSxJwgs/ZgWi2oDA6SnR0PzBIrn8zqO7Dk0E0dh5xxY+YIRVB9XzjIQMGiA+QI7/9guKjzx8sTrHzq1peSZVUEID34y2ACo+EUlxkSU5ckmdSrJ2pdr06MPt4hLuvY2V9Lyjn9E+cPPcMRacVuop2fOvw/yp6qkyx6dHfG+4hxRdKgB1KgwQupvLuWWCBxQ0MqUfPk1k//7UsTmAAt0sWHsGG8BcxrsPYSJIEFg4GTg0bbztxbrIAAFeqCAOtp21DhHs+jQbg8QiJKU3Giw3XHR0Py65JCta8ONjudMWUK+XYm1Wkp5rV5yQz/uh6LwvIsQ4lBt4sFpkigXeXtingb6eO3PtWp+hBoFuqbicl3yCmBUdFu8zXeJy8zkXDDVrk81AS1mFkTIyBQimS8Cw4CCwNSp3zgt6+3CUIKua9jIxxaXK6q6EuOlGnOvV9QIlu8xGNfn8ZBIMeHNIMroFQApYRLEJYUU//tSxOeAjBUJcYekbPFsFe4wwo3GlQ8q1iT+aFBSFCs8oxH2AAICqtEoElyPQqAT4JTl1GtIl3X+eCmDzAmQxGD0tSIvSPavK55n1d6OgQ1TnKo1T7vrZv/qvgBRQsS58SOdkhddRKIO5suq/oKgpkx6mIcrBKNVgOu2Um4QAAAZNVQbATU037uAUzQIbaywZYHwOMFjAZDAhCplmpIkCHTG8xyyv0zCMSmQ1EqoXNjiFoPb9/zu5/3uOQkzsBrpGQTFao82HHAERqFK2EkDzGL/+1LE54AMQL9jrDxj4WmVqzGWDOiuus949ZF863dcTQIRNnzTYKT113uCKMNwFG2aJkiIWowPJtEdmvgNHCnozqOhSZ+RQEIOSWIUkY4T+///+Z/5zOCvoKFCJWr77K5+7osWQUyn3kygEh4rBOJ0oCDNNVAzVmyIi3ZOJ9TnFYeyOVp+FhcT4T6NU6yhJxsijS8XcrnpqjWAAnfsw5EKbfNEGzDugSkfatTTuYJZ9RNAQkjy7Oi6zuzrO7mPGbT/e1VOq7JXr22f2/brLBpYpv/7UsTnAAykx2/nsElhYpXrtYSJaGNHmxkeLmjsigGSCUI6NOotykBQanApihIcogy0ON9cxV/SiwjTIDp/Dr5PoZBA+60VnmGdsmxjAls5UDddd2OR31eysDfraiPeKjSCIDuVQy95a5wozW4y4VRzBYAmwndcu0wdo1JAggV1yILanbkNzPB1dskgFPoBwFA+zuhlRMgcZm2KRy3UqCeUx3ioI49/I1uLqE7n6fS/rfH9NBxMiWZAz+VKTWEj7e7u/jRuEv+3/ePvZuloffmb//tSxOYAC9ixX+wkZwFOlix1hIzgt/J7zYf3K9dPzO/v6YYCccSKSCSj1qywUMGZ2ycggYNDwc145qhGEB1Wi7V4ubxzJXCDGkv5ZG3YhFwraxPC4jkYQqVZKV0zxw+Erk0ZFzA0P9FCn3+91Yt/M1l1PdXdJSAFWlokkAm7JXMhIBeEUwghoLlSiw93Yeik2wG6AAJZVkkTyrJ6LoGOzrlRg0yER0EnsjTUzOxfTku3IVkHmtu4DNYbcG3IoHQjrFjzWVMBFrnhLcSh1jhpFiD/+1LE6oAMtW1v54xRYXgWLLzzCciASLKDIIMfLgB5SC911LQIYCCwm4u9waEgExC0AZMYioa9s/VlFJHBMk05F4JbKKTcpBLxTkMoNlKtlsYP1JtWlyQaBQYhLdXLf6HWqPvbWs723/zvb22dXu+32p11SxjGOPFiBlwtQiwnrWACpPpEoQmrSN7NoPEz4ttmwLRSpN4pXkLtrMEqeWROyqbBFF0ToyEQ9rWnV2ZL2IKEJ73vej0QcozJXt9Uo1QZRo9eqytCq2ErBlS6+81Ugf/7UsTmgAw4cV2MJGcJUJVstYYMqBMOiikls6pGtAEJzad4q8EO5HwtNARIHRZw8daIYuXA0gVA1I7ARGPNAZr43S6X2G/IXVH4VtsLt+kS5LZwyb/a7VQsUQe5XZ96EYyvRkiISPhVi6XaybLU0ER1r6MWKceNQMU1BF3cUSAAi3nCgAvhEXaBjg8s7TJMgQmcdUhSoqGGFuXpJLHZuYY5Wq7UqYd2a9l6Is1ymf84h3y3OZBIoCCDGRzoobGQywhaszco4odmxhqE3+LanKVC//tSxOmAjFyxY6wYToGLrWulhIk4c5/JoBJpu+UACaJJbwdsBnjSgCmbErINmCmgCosGTyesPVsDlESxM33vu1FrVAQynPFkGtRlZa0Qere5DmMqCcsRUHERtCusrtRkdlUuRnRieu6aNdVU/Tsmu7VNdv3a5qN2cg/Lzjrz1c+M+0/FMBAWRFeKEQCFD2MuKFSAIosctUjImVQtgC6sJ2UWvXTgtFtFVRDHIf3mQ3I7NXd6e5/yIUqvRTchr9iMqU4NynzyE/2352wJxFa56nn/+1LE5IALMNtnrCRHgYEbLDGElXioVCw4gHCxZQcGPJprZRc4grO+TF93kkmpIx6GEWmkifh6P0TF3pPMh6sy3F70ewAHoGUQAWGfuscLbtQkoSRURqP7WOeuqtZhqm/7uWFXeUbiv6rFHFDXv7dK3VIChk3Y9Lty3UogFuRWQkgAB6LE9EFAU4TWDpA+VQdVwRBLAyHkb2QSKLPc2goUIECvwrhgYEAMWevkIOZcPNl8iFY4NLcuu7hOal8FW4/eCTnm9O/BVvCKbH/mpIZBuP/7UsTlgArEsV+MJEeBravrsYSVMclnib/9//YH5HQwAeurqIR7L3d7tueu5Aau1Q8WWElSsYem4fgjV0gp0a8Zz7zo/nyii6dVnLwg/sAxhiTil2oasTtREpNd9Kui+9rb8m4s6fH110KI8WxUq6lTkFxMPe46sUJB2dGxliQVxCdRrmIBVlZ4XRopF0+SPZxEhaIuk2b04gcXwW2HDEtn3SW/tB/fWR+S8QG4pMtmQ1/6r2rx6PoqnDmcCaEKDKbT4KvUhD1dL+5nrUxw4FSK//tSxOKAC4TRZeekSwFaGi588YoUy26Szi5ILQomtyiEQRUsk+gByAmkfIMETFCEWoj/ZE5drfrTP4lGTVniIZZ0lI5OemCESc+U43fR6Ha8zJoYnSLKCCaGK1GcClosz9GR69kc2sMqCVblOAlA2BBerbxjVWETNXqIXSQhJxRUvDkOAIpQJDq4HgUGW5WgOqrSyaH4FJYE30/nQV2/qQbA2p2jk5/dQ7Ujns99AAGgIqmdFS3+ZQsEX63gyYsv2/Ms6HqmDKTKfIbX+ECf6/3/+1LE5wANnOtfp7BnCV+WLbzxiiD56fSucLpe+qwnmZmh/ZkJGeGTw+1x63hIm1gEZXYSoAJsiAqQEbAJQnWI0YQMs+5mvLvCTYH50Q6x51xA6wOW2gs0j+QwHNEcLkXm4HGbtpYY4HxbOE1LGvLo3GsiwRnA0puL4wpcZNUXLjAOdAdOXVQlKoUFVom7n3UhExcng9HSbrpqQs/S8Gs6jqd9RlYhTA2zAPMmhfhtHsARq0/j0YgQ8wj4OBleADhKQWXVychDfQvc56PWWCZopv/7UsTigAsUr23nmEnBVRZs8PGWIFEgNlq9rKnWSBpm1DB3MRIceQ0Oto6aBBnWnGkCAE8G1FG8JOj0+XKQgRMPtzUsZlSaQNFU62NnK+Q8nYauxKOVullu1zG0JrJPLVtIRQ73F7WH0Ln0p2D7WuUnbi6Vs3vTS57YTbQZ9T7V12AFJDpVX1sklMqB5CJpSIygfGxDEvp5QgOgH5LV1pnKRmIKMveQ7P/a6VUb51P76v+jjsJc+Ni613kSTSRYbrU/7Vsf0+RJRoiNJd73a2qA//tSxOmADqlja+wwbwFklayw8JpoKKJjK32YABZ6EROPQEcs8LawF9OuzZOc5iFzL9zy98WVdYaj4oBBor+O+NcMQmTjJUY9wY1Wsd1ajvVUJPopx0GORnTfsS+92pZLLt2XZ3X7lXSXd2dU7onaikd9yuoxQ3+emAG2pIHSXXMftYIGCWuJfOwggIDYdD4cRKmSMJeOfBckGmIxNC1fHDUIa0/QILvrc+ejRjP/M6TkaISDUWhAPJDohxP+V5YZ57UZr4/9FEgNABRtYaUpHkL/+1LE4AAL0IF555hyYVWWrXTzCdio1CXogLQ/1i2wb2xzW2urURc0bIh9Y0AAz2Q/BQlMagPgkYj+UPKTANgGjUDd8X1/cHnD6NYbQkknm381q55m6+xQgjTppSBC5FV9YWPdP6Fcd2Vh8ehH6lVrEv9fowREyzQczui5ZKVftsjRBJSSQvR3CuqmyaXhOR1xm6Y3UsqCxZQiLrVzyjzQBdTClxCSrV/PZaaHI/sh4L37bUvO7ogz8mtOjIqndne2urNJstZpyW36JWm/+1qH0v/7UsTkAAnUr3HmJEkBt6vtfPMKWUq5giIGJoyL6LEoRQdHbZg96yAC8JY5S5mDGRBfV2NwZ1ITgTJTMhCKofvFtJr94mQDko0EHV0Zg6mq+tD3/S1X6RweUfqmn0U61WbN6sVjUM1z1YmYqkWehC2VNoscitVUNCZuiJ3kIIDyeTIFyRRTwE3MbxwPWxxFnF8bhIXAhGcsDezoA71OMuXcGSfkgixqZU5uHg7f5bU5TIs7gzMh+udQRYIWChsWIQK6cPLKvdTFWCN7W3yN5SJz//tSxOOAC+DBbeewboFbF+489gywomGi4isOVKiSrErmULLZEP/WQAUkx1NxfhXEshJbj+FnFJZmqKSBikNdAfbdgQesJHw8FnC4JtGhlQRJrJJynqBQsONC5LLUKAaFe2oduILJL8yXBjJrITy6VOFhCTHfrl1SB1eMdm/sRQLSKCnLebkRFlKfJcTH0xGoIeIwhiIq3exUHoW1qU85n0IDp/DVbt0OWylfrv6FYpfp9it+Z0f1L4Y76g6SJTvLCJbkxEDT0kqRCHRZ8Shqpxb/+1LE5oAMAWV1p4xS0VUVbnzwilAGpWnEQAAKqS+mS3xVSMUg8gGcHAfdr8AMaiEdUzedtRGJxSuuRmgoYWJyFZSCBYYIAwLIELw6ISKL2DhQTvi5ggMSVDQRDazTQenEgEXF9bRx5T69kif2HjlAglWEnhUbLVtlXC/bS1s0IBjnldciJIUtBnkvU6Yq4j9N+47MqRypd16rM/PrBnGygoj9eGxbMk/z5nlo7H411Vv/v+xWGLy/Ipbzst3irl/VWR+qGKVlWVluWdGN+jcro//7UsTpgAy8t3HnpG5BW4ZuvPQZwNFLujleLDhnIM/9v/1hABTWStkkswYGAZK2WUsJf0fR2WieY0TRAqYHMFXeXWB1cq5ZUqZPzb2JM/7Yf+xA13X8GcOOsuMMhPUVYbbsYmgGxw5iKT4FUCST217Ptatg/p9kR1UFluWXSRpEljKK0cpOhzidItGIhOp9LsDQVS+bb2AxYWHcz6rWqZJGxAvEPKO4owAVLVPiQ57nh5dF5SegJug3kPSyN52dSI3sk5OrVbz1+yboU4YNJeqU//tSxOkAC8zrc+eMUQGWCKxxhJmQGkfjYp76NFi1gASTab71xScAThBSnGCXgUleRpNFDCCmUp9G68VFcJtTVUPmRrk6L8uupNDcSmj6xUMlmkVRAfccYVOKeVPLtoG2o+2he+B3LSDglDIHdCRZWJRk84vc3Unreo2tCLst2v2rjboOyOQcMjdUDMRALBo8dDEGjKRXdGyfm2Lshk1sCkI0mIFOFYsRW3hvV66ZIw7TVE/3IocLvPDDkSqVI/ttr9l80/P72/8Yv4eXwSnXdYD/+1LE5QAL7SdvrBhP4VkSbbWWDKyCUYc0pZun2ozn1+NATwAAulaRadHLAjGA0SZcCLLwM8hAkScZPd6Io4GCNgGYae6r7WT6db9KPj6oQ3JFKO31XejaSPBaLMxeZb+a6/p8wZfSntX//e3N0lmUE5MI7rP//5JCAAC1RMEAQ1tkwZIKBUHUABiRqs6uHpb2B2zFwZGkhOy9HoPi8ENY16/S3/kZFKoTZi+iJzqZEghIoGrm7kVnS3WtZHpodqpZa62XQ//6evSVlmZyhEiwzv/7UsToAAwlJXunjFSxcosudPYg3J/7r2f9tCDMokpGnmgHHMmKSGScG6FmEXF/hZijwQglg2gikGJiyJ02LGEhB59uNGqCOkyhdqWOYiM9EN2CBk11qe1EuNUjLZ7t16YtzMxiHItVtvT1ZXyM3DPVkIgo4sEU6/7TFld71U6F3wA0m3q3GkkYQ4d6bMEr0yLYf7Onz156rMllTaJLpdYqpHgMOoVKNvDbvIZbh2PV6+cc5qtRfmI9WeNVfo2/KTPBPVdiVbfh2/wp8vfQBOkU//tSxOcADIEtg6YgcXFWpWvppIlwaBQwwg3pR+2x//9gAABVa90aSWMlE5UAaxi9wXA9y35DDMB23xxr7i+QYCkcG776bf0huuzGs1ekahtllxm/MRyFKlWarHw2Z1/bW/zK5UnsSirr/srduiuuh3QcIJub3r//CNE/9PySAAADdVehIKoCUFrR0HWI8gbokkAVA4yRyG+wnLzss4J/faJhTsNDM9NlW5RMpik1Kh6mKxq+n5Hdlm0of16+iO+v/+v6/K7eoiND4SbLRZJWxDn/+1LE6AIL2S9fTSRLoZSlKt2mCVgfN/orSAAQlbptXY51GkZGWIaphiypex165qMSJ6aOnw1uEUByF7i5LmRlF5lo5aUPIs8O6TktFt0LsOBJ9Xq6tOz3FMYGQ6L6Grqa95dN1d2f8iN6dyulSUYosXBcKhsB/nwGAB7tiWBBC8zlkyD0xSA6awP6AQcSDS4AWDjBpRlEFJNehVI4ykeSwvxCEcubp0+0KRm1tTpVVQkqb60hgmgi5GDfPBTLp+6UShYo8FugCY4SGtGumZdfc//7UsTkAAt1K3WniHOxdCsstYMJ7IoMQOLcpeitdKOpJVdmO5Fpl77ez67IQeqlfSgTcuKLcDTjS+MABRUcaUaRJaHjlXZCzEMtsJHwoNOwfLpgk7KYHg+dCB9CE11MryodW3zTNrZpCobXS1TWy/VRXEErFAqrVYh1Bxb2/1IU8MpWZ4ZOIVFGL+/vX/RVAGkhDCDkmlN1oLKCCk3rGyrBIusiZgq1hDFoKpGg2FDMFDPvoN+rc01ARK/6BT1N/4WZfg5t98rYxQz7v9Pkz7FO//tSxOWACvUnY6wwpaGNpW01hAm0c3sFwDjSThfrOTXTUgMUV/+1BL8krSIUGRjtkfkQBpyHOUtWBwbVCALHy/Fd83xGLRbLYqnzMDMiO/Mt7HXfb5lZ11u+dNCP5ljYsE41riJNQsphDNfyVXuKhYjX/FnUdaoAFlua26tuPpEAVAJIB6KQHEX5SkHUBvrJ6R2ptQ6e8TSlc7RZYAbI0F0ie5nxdnrzJkTS12dDZPRjIZsk50dU9ek7Oqw+x91892yy1X29KKxi2HAzw7/Cy03/+1LE5gAPKSlOLTytgU+S7nT0oKZ//YAAACo20SklkeDzxA9IjkBapzFrhSzZq9BUBttgsRmyrRSGiexgedIsurTMEuZABl0Z1OMagbfrIRvlk1XVPrfcpSmOYx0G80BhMeYJBcTCgZCu9S2368+BIoOC4oHWijv0Lbb2RbcpiQAiVHZ/KjlQBvN4UQb4ZQsaFIpnP1bXpnx7D3UEseQhbCjnjbd+uluFTjneiMApIx0kMz/IIH1aRf3VWa7rOYiundJiIA87lFxE5KRqPxlDz//7UsTdAgqM2VTMmG5BOxUsdYSM7KmhM+D4Jd/2drXu/WACDLtlLUk3yUDLEawUVR4mY8smevGxCpiQ1PZNbJCuA8SPhVElP9Slaevd8zKqr3S4gM7jjeVtvHBim6TaImCVmis0lhSm4RBs2osDgIAE/b/Qjq6q0qoAaoC4FWxkMBe0wEINsnHSl6yYKW8VUHBSeUYsJJ6ECOKCR7NJ5vWezPhPD75IQ00r2Zct3bo4ErEZfdKI7KyQSKchXG3+zuKI9OnZvalvSZq9LvdSFdhg//tSxOkAC40vZ6eMUuGilar1lI3guws70g6GgSm4uYEKG04bdpsrnNclor8uM2cgMwGkmhlGHfa/4pJ8bzFEe1yQUvoODQA5O5JyR+X5T3n2z9olQslI/zEk/5aBajRpz5+fr9nkX+TJy/YqrQYwLcWEzDP//3dVJAZwqpMdZGBgAFG7AGPfo6jwIgHsNJQCLKwddVk2rqVxfLCMQvD+uMuYmFFf0gnOMpbEdvixpYRhMYquSRDhGKO2dsQCRoGJJXhZepnVh/7dPv3OH9zhof//+1LE5IALrNdrh7Cu8VyQbLWEidTC7xfWChbkXf/+gkxOOfS1pJkGeTE508TQzjmHQfmmNAqWc1+LPbZwHhvEEcCrFpoxkpMCBCzS12NrkVT77BYWf5w/pQi/KlOGX+vDa6m6HD7+hL/dP5pDIs+naevOEJUAAAB4IkAKOjNo6UZIprTkiZuRrlfFT88i+8tJI2zUEToJRPU89KMaKVqKhccJah1+uD2kTawE+/d+Nfl+/yPPzoCjw6NfVR+i58N93VaS39ZVd7tF3NVH+zdQjf/7UsToAgt9K1DNMEtBeyVqaZYNYJIoWKtdUz8X//6QMAIRGm/4ZEhLMGtHuMXyhpLV7UeZXp1oPTnSTrSMNBwRMAHyCECDcHThzZ8iwIK3DhCgzcDggep56E5iLmWboB8MwgROHFWtcgeEEENb9P99CEidZtUAQAABTqVAvItAaTg8hH1tc2YRB04bhmlf163yjbyxutYC70p8UPjkTfDmyUYXfml2upbx41oxzMdvadKezbaDMhkBUDNKzpRGLQhHqc/dV//tX9Cfvs4IYuyC//tQxOiADHEtTk0YcoFUJS609I2epifM+CdmjqO9zQTG7JZfC1oRXGs1PReMoRHfKqvlglIZYIz1uONe+FXVboC21REVxq4NTkI6y6fVSU98r8xpUdP9HQzoYyf/0kUzKdiYIr2YylN1IgdnYEsZIPI9w5QMHLP6qiDG7ZY40SSkejb1MjzQKVdpp1hajWRLHHfPmtjgRz8TsZ4ywJWeFEYIqsSAY4rwIABLIIky/KAFGhI+1GvpzNIZo7E5xx9RQzp4m/YxGRQjVD6ile/sV//7UsTpggzRK1OsjRNBVxUqYZMN2PKxWqXgcEXHItgujlgYUwDOEFATzRxkmWpm2gCx/31msolQHgQE+GymCRpZLFuYmqzAp0kWWEcrlKIUiyLlaxIqwHQ6NUROAc7KwGxQVWd2rLKW9DWFJt0s5fVSuGanuv2rs/cnH1JV6xAII1ZnaWNIFU3hbC3j0GKMhDzgPXKIdLiMpavECqbBwgidA6xXa6oQcSvGGDQsMkJd1b2HzRu5B1BoifOltf1ZFM0Ezltq5MeOKb++sqsKDvrd//tSxOkADKEnWOwYUYFoJe7wwYpe4wBAnigEdLcIVNyE3yA5MyL3kcxVSBGqMcGrithmL3XpOUbi56Mbz66IDAhOJggRkPxSO6R2UGBQ4k4acWDp0Gg0XaVY96hk6BASOgKsW41LlSMUYVKjQ4YTfS3zzSMvJJmDNnUqAAYyV3aLdE05ijL6OQcqqDVASbCuDygKlByhjs+vRQHB/nwqG3nvwothdqkZWifViZ2HoExcVecmKUJlQ4pp1qXTTBEdGeuwiYkVKKiNMPCQFQWAQu//+1LE54AOPTN3p5R4MTiIbXTHmCy5t7csgW+LaciAQrLHCpFiNBGJoJ9lqJCEaMKRIqDJiLRFEqowOTdB4pWyJzY711hFbn8NchzKroksMc/s5DzVST0odVBVnJ6RMHrFrSn3/elj9y9u//+237Z/JU//CIbW9sF7AAttEFSJUy9QxWa47Pye9FqJJ7UyHdzY7CZTSRueo+YTVb/pxQhKQYch4j7iHt1MRF/Mv+SNwY967nNV3MxyZFVn56HxlsogSHpHr0slI9rXv5kUz73ZUP/7UsTlgAqIUWnnmG4hj49qZZYNWEqsLAQHQRW////UACTHZP6qSCZRPFStCwIBwSeD1nP1CTSq5M1Id2eJq9MPaM+YBO1Pdw9KE5PlLlnqVJM8qeRHrIbh47IjX0b/L5VYUOAOZjCH88s/y/r6ZxjIwmtYWLs8AANAYsN2CNS0Cto2Bw7PNPtBUxQRVUQESZPa9jZGECiEpYOsKyRaba6JstDaUlMceso1UgsH9KZkzKIGBEUqR73HEnk3SKyznU61ywuFEd89///3K8OwFWa5//tSxOcAC+RtZ+ewZeFrJKlFpg1pS2VHFmBiRYQ3FLgAQC45FWkogWCLvJckC1OxSDYJ9iW6Bqcpvv5MRnCQyvddN3RMIfHSMZJoXhaPnxCAGgZbRl2tvuqNnJbdz9IAeX0VS/7d4A4Ql9v9KpqyO7zZjGKXLMAq4MeqACAAQCkpACagYCYxlyRgs7CVNxQm+hIYIgTP5Gue450rob+EkH5QiiKBSMJGu/1Xzxcu1S8/JjZL16NfUXjO8blMaTJn/q4qQxpm/RuUokJgv//9EX3/+1LE6AAMXS9TLIyz4VylLTDxlrdMhfUuxrjCP/rAg+mWVHKJAgujGmBtIWvL2F7g+JaZ8gQNGCxgzSLJR70MGorxLl3TlvW7uW4u6bxdwY5CRfFMvV2HLyl3Fa1P//wj9pFixhzp3383CVX/3Ff+9S73fvWMHiuKGSgoKChmW9wklnjDJcaCsThwHhFB9J/5nlgBxkkdrq8AIFucUUmbmcD7NDyblivFO7Sez2xe3G8oxAM/XjLssAbZ9X6gTr/Wp5QEIJJ2zFOowQ9gJiyg2v/7UsTpAAyZLUZNJG0BaaWrNYMKLTGOSQZGNofp2686Juzf7ZGIFdRljDyP2edkxcOywwTM0+CoCCQAlQZFJhAISIXERxO5wIdX7LVxZU0BGRFDs5PADUlXfdyuL7eOZlvmiQi8vXGKnv7vxSGBAAOIlCV7y7wORD4VEd9LSR8neD7d+6CC3pm0O/9nv6LZRQACQAACiqim4IKDNXiQP8beLsOhYLqMRls8GOjHNPUVPX558vrVOnrbooTZJT1lnUJTu1GJLoyGL3GRknKSqLX2//tSxOcAC+krSM0YsYHqrKxk9iFfKy03o+iwI913eB2Ns7Ny6bd7vRdJlRkMrbjf/kS29p3XaJp21P9neniId0MTcejs93f8Rg63o38EOzbLpCNzWayNtSU+XaWKXC2Ug+E10a/QnzSweLRgDSobtQlaoKyCXvNA+JBKCRNy3SwkHODrGkjwVWSQIGGvv1doeowlPc8ljs6ccW1JiImxNQ9ugzdWABAVrjkRJUp+kLBkiPGSAPEnEAIoVPqcJKE6EnRslkTLEmZ7W8NhchttoKH/+1LE2ACLVNNQrIxVAV+SqqmUjSgTmDAbNkiL2xOGTccEnubqWesWbcMtd6u9Sd4qeK4XWuTttJqf7OnQAANULKQUrsJ9lqBHVVwhq1iBXPnpQ579EvNc2ao4cY8lPodhShU/IhZl0aX8LY16VqxyTM12Ofdr5WQ69CVP/fe/77av0/V3Qg6UKCtxN+0o9xgt6aPrAQKaRIot4cIpkBbGBDhGWzK4fYjEYMb5VsTWLU8lp4QLUgJNxA5bbBzGQKSpeVUelWYUGAXdv0dqvKki2f/7UsTcgA+lTVUssMhJTwlu9PYMaplV+/ncBM/3aFdgxkEFAUjO3UFdYFiJ5UkQGg5JHHEikyqXBhu0oOEuhXmE+OejQlKAS2gJrD6PaxwWR4oKTqY20WPSfZbjnIR1ERBmV9tHEWVZkuxfN02drsJVf+rd0Whn6ks9aK2ojqrBjwx979kAEAt22RJlwKJOoBAlmUfwPJu8sXnTCYgbxRwXtICiVo/v127ffbdWtXr4k4CcZiO9Ne5c6H0bQj0mZ9keyv6Wbo4WKv/+rdlX6NWa//tSxNIACnxjX6ekZwFcpWrphIlYrkdgYZSCUB6FKtAELXtNlxsTyloo4OkM2DxF4Oo7l2Gnyz5B3IpT4y/UomO02Ua6poWclUK8Ou9vCyuaBGAw1P/586ypCK6q8j6/xtUuzwAwocPX7v1/b449r4+Z57iR1qw0YIgM4Z/WABCUVSbbkZCh6KIQ8LzFgH8ozZHZtOHqU/GSYcUUay5SLVHEzGfoOp6ajhR5lNGWZe66peJY4RzLa/9vOZi2roRGHtMvH8yn/TAgSDUDR9GXsBT/+1LE2oAKxNFVTCRKgVslbXT0lSY9TZjzQHeXYTNCMgRNxytxppoFWslSpIJCCcCNna8XB4tbtZ2lnG75MidlJxkV9Sq/+HebgoKUPXIy49QmKHz6Xmkj31hEVP/v/tOOO8P8svz/5blVz/pmdhSi1M4oQxdqAAATKhSIYjBIiDRDImN9IaqNvt/XWVUdtNODpG1JZ1lyIE7KNR8FG7kp6T2oPy85oEeaZ31Ttt5DeMLWMRnIl6tUjndzRITIRUqzUQj39GHDqf/IyIr5KEutFf/7UsTiAArdK1msMEmheCSq6ZGidDFTMQcLmAdqlYp3EFJRA6kAFBxt1TNC+hRKgvVQEuQtYY1eudqk+yWvka+CAfZWjzHfU7jtbtlFKiDmpRiDIRGlZcQ0pmVDECBDwr52ad1yPVG5G6XVpnOQOCp2on//ers7ZUnYrtFxKBwSH1HAxvo1ljWKAAGIAAOSh3AMGKMmU4kCakagDQX5hqMU8rkT9OGx5ItZAzyCSr77eFMosY27OnLJL7e7To8jWBOO6670VNCWZuzMd0I8oUcp//tSxOWAC7DdV6wxBaFXJi108w3mh0dSEY8729v7fZUZnqQGlIBe2hAhMkAuWtwa2sREdZwLE67VAYQFXFEHQDYVFFIly3CSEQll41GkiFBIrLpldbOHtU3S0QgSPedkRcRIZdEVgqExunl+CO9CiesNINXpTP7ppltRE1jb5envu/EqFufoiWnBgdNzAEuhSsgQYMNCcJm9Om1MgPYRoIQggIIroRIiQAKABOLA/ls8yOE8kfDsjAGJgfA5AgCgABJ3NioFDmI7GkoBYgmEmFD/+1LE6YANYT1RrJixIY4mrLDzFf8DaD00JTWG6s4XStNMgv+mI02KWnQi0CX4eiMKa1GWk1px2olG6lL9DYEKibjGEldNbRCkdIyP7n3SmgcSWbOSBeK7a7Vq+o2FhMqd3EI8Vyfdq5O5hMUgWVZlWz3LJUoogRSA0zyi9bxLuspj5w9rxv2l92LZAm32NqVrf0VrIFDQAAJjk3PRDFeXyYm6OjnYwMQ5WHBNLidpoqlZWaOA5ii3l51IwE2Ekn3JDTGC1YNPchCUKNwVVkdCav/7UsTgAgt9K1VMoE2CU6prqYSPCW7TFh3VuRd9gu9TxcFk/3aWIsO06sCJABLkl3JQ2JSTs0xDCteEwKkw+hIfHaVajSC457X2rU7XugesoBAqkqEhKpbiqiYdcfEuLiUuxnWvXwSDNXfzaUOH4M0MFhgUF1JH/RGu/cvRpABYSdW2piFpP4oEYWhx2s6BUsgWNBrBgIxg0PqGKnXDpeevvHfsvl2e+IhAo1jPdwZnZk0VWKab5FRp8zkb//3vVnItf+9v319Pf4SQUj/V9P3V//tSxMWAEjWjYuwM2UFJiO209hjgCQCm7JAo+w1CpDJPkUgNEizxwwBbgQPorDJLpCmsdhXOoox7zM3UlzI5IbW057d3DpDK9aqTQz/yF5H55RM+04TJ4cAIpaK1R3mcZFAu6j96ALSTiv6WxsrgqUm+EoH3xOJxVNiFhYsq88P2XVp6/zcR6IaCOAm3OGJjKxrwu65v6+fRYdBNhSHQAxCyTZyCpRZ0jiupDLTjpPKPBE2NWUdzf7EAgW7wkqARDMYIGiZ89bgAcsATYx0IKcT/+1LEsYAKeEVlRj2AgUqkqw2GCPgZYUEyNiZkb5QFkFmUlD0SsQGLakhsspPsfmChGFaOYnh25R/vwJSvMaklLDWEFEH/HPTu6R8EiI5AEB63S62y3zIIwjrVgVoPsl2hSjFTCczty9OkkFYi1HYG86MjMzIkFMCGP/VB0f6VZmdnOZ9ijtp+l3lRbiCE3I6PRv//8zslIJ4skMCqGVl2aWbf/qUcMY2gFuAmpeE6ogqMFJgQE8hKEdMZBKcNEg2AInDKazyRsxaO4Vx0N3GekP/7UsS8AAoU1VrsJGlBTJHtcPYMfrQOkQgdGrX/4fjmLKdU4EAwIEHt/c8lE4sBSiv/tuilHT0IP//f0rno3sJzTlIT2Ea1mJXsRWvVMo4yZQ4HL8n3h6UlIb16DQuKBsKWNL/luaiGKRvVvnCCHw+RR3RdwaCQTDyRSrpbm8XgPJOK4pr909/f6AADHKSKCUU6WgQiJDxwFTWlDrkw6I3MgwouQBhtH4mtpVdher17vPVT7UPlfkKf/UhVqvk1OQEplbT9+eDSyZAuX09IO2lH//tSxMgACiC1Tsy8ZwFaJWy09gisXyLxig7NuvjvFBonoAABEbZeyurjQNMDQOkCoXlYO6djZG9GVgKl6CB8TAUSFx7GcEhxFcyEQWVzuZx0UOyq/6IOHszv31RiMUyfX/3am4i7DV1Z21l1KwD43u7/W0gqADZrWaYHL4NJ8mkZUjUNQDpvgY7vqBomqUoZrkRzjKLDhs3faUXR5E3YEynXCU62c7DvPKBDcSwNEh+t6Vwr04ww3pWsaPSygrqAxKe0bdNt0JgiLLanHzO0K3X/+1LE0gAJzH1KDGhhwUqTbSTzDd41Mvc2clyxxn+5FVDgTt0u73vFxq1csu7ZiZzqW8OuodLY1XcW2da/+v9Xjs+/n/ea1brPv8fO8/O/TdNav8f/O/4bFHcVa1XxLQFL1P9AECQAkJJOqzrRCwhEFPoCgcCeYY8MHReLyqTxGYyJiJKCmaXyvOZTnGsmlVfbYnnfu+eN3t2vv+fP8NKJ5KbWqxTYh5F3v6kb2fs8d+VFA+sS1HuqACKLcIbRRSpsso9QSwiAQKPVg82BzBeyQf/7UsTfgAp4nVlMJEnhSZqrcp5QBJFKrYyxGyATAAacGhsSsNA8AhzTCwogyFD3UOOcP71I7CBJ6tR6geKMiqCOL/m+2kJINmT6xW0hrQAidUyoO0VyhlIhCu8nEOh4CsR8IpTx9Y0dOmUXqWoI3W+IF2CCenDlsGWoVS4LH11HXqYegObDKXu7Hi44voZUMtG1TXFGjh8Wpdqe7R0eqgALLYbTbcjK1kFFWJnA7jZOLY0K4Tknl5abFrmX2hGjjsquwMhRLl+zFSN+yPm+aEVu//tSxOoAFVVxX7mHgAFQkurrsGAAfmfPnfhGQkmMtiGLWHW7oGo2IawWHzuHXr777P1F7Xt3pBAF0tB4YVwc0AdBz2yptU07ZJOAYhEW4U1DE7uXlnZujVPrpz77S4b13DutIMzaI4n4PH1NRJpDYViUWCjZqwsw8X73f09/r/9LNUE7Wvr01RADIipVa2V6S8aE4PilKFwmKyxUhH6ou5GhE9wNsh3fYjayoIIgDLg50iUkk+kMDyT2khjFi4kCxsQrIA0IxcJMONG2P/yqlVj/+1LEyIAKTDdfp6RnIUCMKyWGDLSqUjQCr1L1VKrkQASJo6pZLJAbERDRZDGG7GLxKXCY1Qoi49I2ny9E2Ddg4Q+Lq5ruwpTsKBrVMm5s+tipd2ZJl4jHPe3Tr9NWp8+4w5THX8U+3+//qNQujEVaXH/tEUOKPpTFwBzAJGPAOpH/gZSmHGjM4gJocCxa5BCRQ0WknBzdtrqNt9RQR/9lmIEC4p1vNNQrNsruxVmMYBOdHfZ6odHLXPR1KoQP3s1u9P6pdF6SV1D7CkBMi8ywsv/7UsTVAgpkqVdMMGjBRA/p2YYtGB73zB0x/ppIRCSgfsiIAEKZwagFAYFkKNAWBQGtN8k2nbV82WMxx5Hh5FB6MoQQhVHwdrXkx8edPXF+Ibx5BzuFQu1tEpqs5BmyO3v6nM6nbdF/6NfJs7X2MVa5cYSwmO49AAEhEZcISUBIIbNeombDT4AZqw+XKKzbRpE02xOhHDmUPJYn4+6mhkT5nNjUW44NDyqrfvUCIfkQ/aN0vpw6nbF71uzIrBIgtJ9Lh9+rnz/zPn5MRfruMJZM//tSxOCACmhJZeYkaqFOE2v09gytus9+hPtqkBtKONqNNJgjLaehRqAyDjSRcat6rPjuUCEEVxZQLgqVGlrfU7TQkySl5svl/oWjbO7TcI0zlBCMXR2uiKxS8pDOdr+ItuquQ4oEEF3qt2Tanr+63sifU7C4OhUOxSA21pI5a3N+erklhYFST8zLn85SKtMai0WINpIncmR7sWZFv3ZiYhYJC07XNDyzx4hOZObwqcKnYj6U94V/2Ok87Pe1+m9FOefPfdpknQigRWD8TMHHudz/+1LE6wAMqS9OzBhPYWolaQ2jCiCFFyGfPn1LHDuykBCEERcyjJUlArX0n4o1tg7EqyAhlkOcldNm/jz6Be2e1p4aQsoiRK2UCFGmaUgjZrXemDiZkiMDbZQwJ2iEQDAjcRCsi0SyNuIAAFwGFNiZcyTontIbRWSQJkEQdK9ePENmvd3GN/GNEPbZbR+5yD7tvnQ/go+3MCENm17UZemIR3PWFwPDAnNE9rzg0+CHnHCAnDwCNAhBSgtONDWEXeZZdhgHawK9Gq48ACUwAsSkB//7UsTpAAwFK00spG0pdqUstPSVtz5qCqKTgg5QGwp580GTQACaywWaFxEAgrUkODQXewmfTfaWoYaM2EWaWVOSFXzwLjAfFj9ph3T6eUrAV0dzvdMe8KJmYSvViUfZbhDMpkKAlyltsaRjK/27gw0/bOBQkToMgUPidBNu0eOJyJ9zQiepdWUVu5fWyx84m7++5grO36Ls2r6FAqqAYIyUZJhIINWxl6n7YrNig+ZMMIBeUaWjGqu3578rVtUlwmEIpJfIkxnp1LKhnO/+8rKW//tSxOgAC/1BY6eMseJMq6nFhJo47eVkMqIVkdf//vtZHTzGdr7vX6V/zXjlUz38iE7dtdpdZA3RWgE8RAxD4QUyADMRiYcK7EYmOqYzjqsZdjtLrqFVI1Nf8jTQo2SCWpc/5Ngc2BctGmSJkBBVv/h3a3pqquFWrc86/y6sC052n9wAAzZXeX33lk3FY19sIZ5AingrMA/sTmDV4ecHNl9bKQAoE8h8dTZX4mXgx8+a83xh6GDG43dFEjSTQkOaLhi5E2D6UTLO/pr4nCLxGGn/+1LEzIILKElaDDzIgTUKrKWTJWiptbPaPmAS3ZLbJI2kqLQcQ/R9QyLKhWlikTq7Sy0po5jTrujZYEVmrGyz9Nd5hcHXkTpu47/K2Tsg6Iz2rZr0VF27lZ73SnJ2ui000R6///bTQzrRft9NXv8MiG28XSMj1tExV9UAT2y72XWy3m/UvdGoxRgKYMQwTLM5heKM4kuwvUZJgxlgv9srdyK/2rzdznSKe9IwgMB0PWkiIBQEFCFKwqNAKCz2oNmhAaetz80qhwdWBnPoptXsfv/7UsTXAAo1QVoNpEnBSRVwtMYMNg1pTUAm1df9YYB8mFDYcyhUuGp4xkZa1BC9bAikscF1TgJTwwM6JR+h1gLxxYZvlwgMOGVHU4uTc+VLDO5PyMlMN9dm/ZW23rU2aegd4apS0zvlf+T8/XPQoZeSrRKkD0LuiskqACibcjcjabApxHpStphMNnkHOoviRF54ILO2Fz/QOsL26U5FV3fde3+cOG9dhKYU1aJrrcBpohRmZP6PT7/bl2Ru9/5hidyp/J/+/vOdu6E55Zl0/CXM//tSxOMACniDb+ywZWF9qy608womdurWqztb4A4ht2XA2uTMEcwQ1GeIY+xGOIrMJIx62P5IVGiuoHOaOUMyOO/zHblDXNMkhhyQWsDHidrrwMLUeNm1WX3K38CFrxpN+4vipopB1u/7/3W/Ma7qJ/X1WBBgZVfXFfa3AAJpCJ0yAQbDfODZDTI3QXLNiaS+eZc8phiKvfycoGc/A5FjZc8gTjfD2f4smYjAio6n5uzECI3KyNHM5ZHQ9XZWr8622jEcWlNX/9elndGrR636CBT/+1LE5wALLF1lrLzDYYMlKqW2DRw4hWJoyl6xoAOVIOJpoAXea8AB2xqbotGNoJSpp1No+8URjb5Qrrf5uRJpKbJxM5vy9vPHRb3DCcwtvOW1umprMyjvtUS0OhGMU4QE7s2is5u13Uocpi2/vrI7fNZW662zIZCsKZ0KABbctsbbibBzDlFAJyoCLP6CDMuhPYWxRF0Tnoz9o9SQscpH9unwnDWuXW5BFmOdV6nJpuEZD6EuUMpIUeWc1zM5LZWelXMQVOv/7fvu0wY5eidYQ//7UsTngAu1LWusMGm5fRSp3bYNIQcWFBEmqnYAI3Y5U5E0nEYQI0y+mIjAkJOU+oDRfAFiEt8GLdTte3ON/5mb+zdtfe7ES+xXEszM3w8rhgYMcv/CWPDEYjvrOcjJ/3VdSN0RmOHuoNnf/T///zAAAR+vsAAFAAuOEvIfwPHgE++EAARVNamMf1MbeMY5KfJk0oQCfeGlRlxF7MrsxStC27DAVTSXRpDoZYITWvtTO9ZZnBucmEekXh6oa6c2RCgUjWgoSJRtKWSzaXN7jTm9//tSxOcAC60tU00YTuF8Jippown0iMMGve77mDnH3Tmq97EoFD3snUJ/w5AgBJJTqcZvlRljqWYDKmGGAdAiHIXg0N0HDdklMikWQX6Ar9+PVRZqFEJInoZSSSPWKJJ3TwBDDNnqVYhztmkhtYx2jtKu9LJUXsjml+7trQAQMWWkiCSKQqhIwbECWB/UZHgHEbDgNXLS2SIiLK0Y8yeKgxiiFKhdlLOIRypurVdvkKwblJr0tbqdkXVe0+iKQ87ZKqHMV0f3d9L//f6af9+ng+b/+1LE5oALhS9rp7BH8aQarjT2CX9nh963XVAAKaKqrGubic7oghY1wLMJsoJhQfFgyHhwbM6kA+mqb35m7nnOZZohaoHARA521r9DBjOQvwuReW5e5l16fYkeHpOIxhXlaHrYUslVUvMjo5KkkA3asoXoll3TVjimliWoAgS5EkkqURJDL/jYsTCVgQGNMZh+PKbt1wdAnVLYQ+vZ126TtqFF9Z4s4cNOE3+9UlGz7Hhwz4s7kSVPp7OvA7GCi8iy9zeRoyF+4+iJRSLJPZYsiv/7UsThggwslU4NPNDBQYnqqaYMsIyqkGpV60gBMI62NNIl1HYA0irQJeIpwhqEOqZB4K0QVltNI6SZDPVcUu/RhvjthpCbn4xkmOi1MVFVrUQ6BHu9HNrIimM6Oc9DX5VLRftITrfX/+7KQOB2UvWXWRjb6vFo1BLjxVUACL1EpQt+cpUahWYtkc0CPaIOcFZzhNxldA5zo3HTylFHKZJcHmHTNQ6iJzbuQYyQKSu/bM8/3UTCLnzx/9TcXNOt6UPNOPq4d/NtTmqeUJsUSfcv//tSxOaAC1VbWaywRWGFl+w9hgy8psz99/PMSzdFBE6xs9z+UxLNHF/zwAJbd0SjdkgRfDNEZnSJ5l0x6FZPIYkj+REZcbEbY165cY/ls7rWtaa1laeruXdaf1PJOjfPY013cpypzmt/vlkVFPQ4bms5R67N//dzRwHRPrMZpU1f6gAlInI3IkWw9DNEYOkjz8Vp1sCoUxlK1aSdWjXviCwR6aDmt6ZeUWElcMAuMrL/32ZYjoR+cs72r9Ptf83o1DFe3/9Ua7KXISE8CMUhLYL/+1LE5oALdLNRTTBpAX6iKzWWCPwJJuO+zv3x+/2AEUpHK+khOwZgXjQLcZfbnQK6kSeCLPfjdcJE+LRWki8hn8PvoiDbHplDTCSOPdGRC18jbUQldN3OGeMDTR5tk3dNtk2PIFQuRv//9TBf/BvFzSXrfFiSFQAIXLUKBYC5Yz/cLyjJuUTDCjHNY6grBajl9752MV222Xiskm7rvQPkr4pIbKHpL5LrTjVzhmx20vi6weDfqGcz2Tcqh+tsrU2b0fRiqcEal6p/6TTpKUHkdf/7UsTmgA1NL1EtGXEhXqTrtYYcvOrUGuGNRRdMKypqpsMGLOgwNk5AJU0QADJWTOE0yIuVCXllM3VbNgYEBiYztJxrZrFEdmKN8JaimOysqzOxXZVDKvgrWc73OiqzXe360bIzKCJQlV7/2zqzFdQaM50NWVgZlYb0/aoAABMxktJlQA1SccIBuwQFA2AtcyxujF4MkbyQLSX4gyvsVCYRHgcaYVOZRpXFEU4sRpHcykBDGOZ5Np3H2KciIqOLrdRiq9SDHY/3tqs7scQt/+n+//tSxOOACwURaaeNU3lgpOwxgYpu0iGQp16oR1ErjEPmrOlYASNhrLhjNJaEZsTbDAMKXlJTKSW4WogBw0D2kROLoGl7nRVK+2RcMwH4gwQA/UpbSwbTo3EWkSYQJPHxMeB2wuyTg+E8uKKPjooqRK3PfT2L0SyMPBxUQaKT9+xlQ5rwcDsK0GMNFIv/Pww92bxROTJZNTceg5zP/t6i9hx/evWarlZSgbpLfLnth3u/////N2HXZuwyNk3KruoADQAAFZDwG3A5svcClS98VhD/+1LE6QIMWSVPTSSvoXakqiWjCeT3R2zIr92nuSymMFBTmyRNyXNnHqdxv/uEz9047QwGBo1EEg2eChIPvADhjPKJSBBO/4Ad5Qh/C2U/Xe+gT1fGAI3AQAEk47QhyFRGcyGKRkpicD3OSOtf1an61Lr9/rmetWJLHtyFg9619wT/RFTmVsZK+McjtZsOwsu+t28a++oymtjQUKk8Jx2VpFEJh0HXZqCcMzlLhMz7icFIHiDVSzXi+90/1rtOfxQNuIpsfevkYeUbzKQTzahobP/7UsTmgAx1L1O1ooAia68s9zCwAvFmnbTPnnWxj3OVB8J7W3bmReoHPRUAWufeOMpJSp8QwTUaTme66NMOjJYbO/rJOuWYlML0Nt8Os2FIQV33HpWPdYJuFQUBB633DHMDSn4TBulEszmGNfW5+vKqKgIBEXFjQtGmepgorZJafYhQASNUq2AC0nSMQ08xEQWLTEEQ4R7CQ+PDA4uWXEdkF6pKQy3+4KHJmpMgqASEcu48FBIITzE4TO6jC5EOHjV62Lfkrej3F0TIWqWgZcWf//tSxMUACkRlWz2TAAJFNKuphJrgyJ7GCaj8SgAEIJaHaStMl1kDhEwLAA4GJHIJEcIHGQ+jvcnrSB5BepucwbtUHSZ1wGQ8klDMURCUfYgJaUljoqGlyrqB4JVP+r+iAWqoDqdVXvLBSxG8ADBACJGBjdRjypNbIuY86SoqLUcIKjCYQB9Qwhjk084/t2K2qtgcuePp1PRKpZWWax3PI9bbc2cxVVllbK3tqxPR1BKffSRqGlcQfPA8ByxWAEg+/lv0sd6uB3mkVxNzgNNCiCb/+1LEsQAK9Fdnp7FnAVUJq3GGGKhtoA+Nk9kMeph1w6vSmqGCNr358MKjsSlIRTLBmPb5IAxUwWWeExFOyFxwzFV9iav1tEl0l249z1uqZtqlEmgA4JJHd0Lk/BUBqUYmzrORRGkENOuFCMoRBdYqqQroqRIy83IJ8IeJTYayTK90Q8KwcKkzrmR+bQZ9OUIx6SLiZS3MfKLoi2qmp6af/06Mg+QeJQA6NfZXrG1eUIK8RMN1VHsmUJCIcCnQzgR6Zd6IFz5bdaj3oYLtxwFQdv/7UsS4gAn4Q2XnsMNhRBspoaYJYFSksMMM1gMu5lNfZgMThYLqciFCHo/eMEYRPA68QOLukyiBqLq++5ZlABcElsTkbKUoOIECSfEkTBxIj4OOlWgHicFiMKenyrljXJUKpQePyEULCoWfQSKFlHgjUEwjJILPFE9vWWY3Dp5lafahgleg0StPwm5ndT1LANSowqGVxhnZycedi4zihaLL12MJHEtDcCQT3XzwSNHU5suxdzzAc28Xbu9Vs2Y+uuMW8OhoAIikR5xwOBd+pa5o//tSxMYAClh9ZaewZyFNFSyw9I0mn6EpVY86TijtrPKfYoe0AppyWf9K7EJydRXspErT4PSoyjPVMSGdbDGi3kkDtI5qy+HNvp5BbUU4IfsdSXp0DxVtsaQnIuCZeprTA8mZOPP2DaK1NS9P/Aa3MKGEYs/9KAAAIBEAzBpTfSDrYROQHJSK8nyigpBiR6qIZqZIhhv8+nXv3vbvzWDuC3cc6ala41hJveTh4LWOmxSQGKrAG9aaYVFWngiZCDHmb0bk2nh6YuyK5K3JKRWAFk3/+1LE0QAKbEVjp7DG4UKIbfTBGQbOJKbL7vKAAIrsqwaUssi6JJuSYkqgsFooaS28WnBMPE7/QGB4BQKITOk4d3Du7l9eu7luBhwMDAwMQCAIAgGmH965+JiFgJic/Nra826jS6jCCrBeGPwwCBzRn5i0MKQs5y8AVbAAacSQJHGkLuukE5Lg3SeKVxXlKd25X6GspMlEdyrZZcJgKmr41U0O2q/qTTSIKYSpZjQ99Fm/WkXB9pIJA13rUcA83NpPmB2s/slztjLyZ2oG6DoCIv/7UMTdAAoYZ0it4MNBSQ/tMPYI/kox4AcOrs5JJG7GKUhUIYzXl4ySRtpGUrripy1PWpYPKZWeH5bDGNUKuym5Ealz2hXeHrucRTsJidJXPqxCsJwauaRYrd/1Agk9WCBcnH+140pYUOHjcIHKP/+FlQGv/m0AWJ1gsIAzrBbKY0NPGrCCIpHZIdKRBejXGaam+hCpGDEakYN8G7EG2Vj1uqGd3CCAa409T7cwb9/5/n55AypdI+0plw3kFGBYFSz6n6Cj8gB0lTiRt96Ttxf/+1LE6QAMLJtLLTBpgXIN7Tz2DHy1tDvVoEDjqmKlt7XI5zvG4P0tFaR5zOkkZZfHiZQuthRegyCBZrIy3jdUHYvIxkT4p391lsaKWaDU/lnu2amZzIibUdL9DMV2yutWFCjiKaC21j1lnlzqpXQo8sbFg4LESJdTE3fQADl7mKePbEinUSJcH8W0YgdAco1pkW5Mo7xnqagY2PKQvxI56i2sXRByu6saw0XYQti9JIZVG49c++S5AofNvgZR5EIMVsesimj3+ntPNqRzpVZJkv/7UsToAAtsjVQsvMPBeZ8t/MGaNLQnVSoAGVV3tXnsbTmOwOEDAD/M4g4mxclYuXNGneE+8fqujEhN1DZ3sDp0nSIqnIhjebACZZB7aO/TfPCHmjow8CGTDdb8vIw6YclgTWlDG7z6IiGPGPVrc5gq9FABK0c24Zpudn4ACWZYin+1scfNgXYWcxuHAHRyHcuB22sG/4ccsslPNYlTI++xigijtbL3I7/m+as5QqKAsUeslQK1RTe/YpAtXuPKP1IlyAFde2/9NfUBnFmjmlgG//tSxOkAC9jjWYwwZUGInS188wms0ecDdFB9IA16u3tkcb2gcgGmEt1rq5W52grPxFP3yM60OvRxqF/q7unCF3tqAT/bVt5CcScYLSxKD7UJPPeUFKg2MY+0SqUHFCxYDrpIho4pT6aLwjj3DiqgqRWlzkI6yb3qXahlNVUAFnhFRle+sl+JmEcBoi0nKS4vyUO4yVwzNx9w8NN9nBooUkVwENXFf+pLhhiWSq0MaxYGatHpZ90L3VN/+ibPzcyJm6UP6Juilrs7GLuik3UIoNb/+1LE5oALIJdl57BtIYsQLDzzDhRjQlv19AAaa0RRiSSgGCQOOJjLbWInyu2MxiCnefNujUqmLMLSSglMP8aW6dGgAfrzIy+RolnDrDZrhlhdzP5lY5tHlPkcss/+8aD/TNPKFK6xpfL7+W/7HMn9hOX1eH/RytUpABjFjbaTjcAiEbEnCAkNAQlm+ceibzwBCoKnt3Fq0hA1IHEbeJ4+lbwlRZl2nX1NdEeEeur5muHsX1QKt3YX3I6sUw3XKSyOBBYFhzZ2MU24jOpwqTgMTP/7UsTmgAtsb2XnsQPhgwtrtYYM/GHHD5k2PY3cAAsIjQ7azbX6qpBcg6FmxgDAGJ0QRFKUjQxrRP7S201FBTCCSGhgIRRT6DqDCirrX8JLBlTRmOpusAc6HBmDutpK16kslA3SrX/9TAnWZmnMeLU1lDECiKisHDKL+9UAAp0SSJHEKzGXTNkAcgRNLmt82AIEhWIg1KJQy9a54sK7fdAtahu5GXhhr1SUKd2HAsSJPIrE3ZVIlEY4fQlFkOH3Id9ZGVvfEEOJiryKR16sxlyW//tSxOYACyU1YeeMT2F6qGp1kw3cPnczaLIqsmSimYTQiMOGgd1RnR9/8oxhBB2BWptNh2g421MUbBoakeB9YfzR0UxkT8R1BOpe1h2Iq1kDyhYnYJ4nj0cGBkJ48HEEIkLxwZfJ/1MB4qtuqfi7IXPXHp82ubuJwMCSsKLYlnRzAmLKQtlwSHjspFgkH5VqzWjceTzHoOnPV70X29/7r+Zs25hQ44+6CAHIWBYKfXBY+gC+6HGQkU68vkHPRajbTXxh+PP+9kakzpQDEqZwpdb/+1LE6AAL/M1TrCRPIXmla/2GCHxgampPqTlDBD6zT7PgwgCQ0EEKBwGvHy7LsvZmaPLxJKpZkIajm+NkGYyJuoxtzv9xDRDfyIQlT6v6W3d7e319WRezeoQcx/WBgmBHQAAADMi2AhpewecvBUT6TlHcOIRW295+80ZXvBbVqY9wnMurldS6ZRiKDUOANfmAoiI6XIVqkdcSEhMcJHHLSPDoiUodZCoLLRSlVOsoBFFzHEWSogLlRTbpu/3/9KLc1xVwuChI9mEUbgBFH22TG//7UsTmgA2RY01NMKfCFKcpFaYeOElIncCWCIqwTVGaQa5ZHTiZwP389J8XJ0zxgeQYRDuFmUA9TZHzhZs2hKZKWWxfb/TYhIIioubaVFEnhcuHFJGH6XxUlmiwRB/D7YfEACCY9NDKsj/0U9ACjy7U8TdrY3f4Oj8Pi4PRCCsVgiZJRS/SgZJ3Y5KCRUC4R8V8MjRUMttW6myZsmDv35eF4Okf+VMzI2YHc5KTjhfgJpJ3kCNySLyoZSLrRymoVcPbbSXSbqexVQA3H9WlZCSo//tSxMuADS03XawYVUGupWsphhU4UYEgKQZImph1hAkhFRABUj3EAYOtZeDm6OQpHIQp0w//TPHs6rOiORlRRabUOhv0k2tMtVL4yt5eJszjbZbz9PzIj9fjwIQl0iLOKWNjLDIpMkiKAJWoEMyjWAEGrC042UVVgQVdJNV6jrkvfDsd4+kobu91iOQHfqgYe5QdVTMW3rtXpLG4RyaF/SBum1bIvpGTW30XN5r0dVR72Np2scqL+1GNZ6bN75W/6dHnNuqGghM8edCgv7EKAAD/+1LEvwALvJ1brDBnAW4XLbzDDZTQJkWFBDgDEQwOCg0oTfiOr4gGN3oLfOn+RX6eVfnCo5jZbiRHylEj4UKg0q32X6bqV58ZlqtmnkTH1UjSu6X9un/NXlbErPWAHSq39VF6WCJ7nUvjciCm29bWnEyUy8HQIlggJBLPxDWFPmjekJE1g1ba5M1GztV8kb26qxegaz79JTmCC3f/feutmDKYokQuwNVIVsqbsRy1GgBYKPPLAMu6nrkadqm1ADDTTtLacV0LBloOiRJTahtrD//7UsTAAAxVB1+nsGPheyvrNYGJ+MB40KV5UI7fkmne5A7HNDpnIXGCEfvY93M7qQ0f4EHU2rqybQjZqu3nV3rYe/y98BWqBliBSqxKhpOsUPH2x/bpALUckjbbaSh2AgdF5kWCWRDa5ZG54bU9B/+ZjpG9e8tdNF3/8ENqV+32G3HXzRnPmJBGykmdwRDYAiYajn/t/36f/J8Z47xK34rTJGpKNfW6S9gAE90m0W8AsufrJoukXQJHLoqKQClS6onII5DL0oGI75AzdikDD3M4//tSxL0ACwz/TyyMUYFIFq20wwoW2HaH9+aC4akgQOKTBKRfdSIY0KqWXiMALvDosW32SQBGpu+9+HIiK8G4lHKkZoipAAIjji6lCBbAII6k4WaOP1Czu2GkggtQv8JweLI7h64lYWbSlZzwKjtGzZqkX0b2y16jekvcARs/BZIcAPFn7K0ESPd19C6HbxyWxIktpcdqADStntttt1tsstttoATXaAmjdSclpZOaVTittsw+Gk2WkSAFiXbKhkHpM3JgMVrPxLJc+Urge8z189T/+1LExYAKgGFVrLBnwUuirXTAiyZqbn6OVUD8yuJ2o3Ull6J1d8zpn/l1elv3qSW59pblTHe85dnX7nlSWcL1Fy3hu5Y/uWGOM1bwz/Gp/N4Za/K9jrf5buau8+h5+v3y5rXf/+Z1L2sP/uv3jjlq7vl7tjQAAEIoEAgCAHfWCiBoiMNGItyAXU4FeKWQFQydIEIHaVDDjr6edUrwJwcA6EpaGfLpwU5iOSvhsZfEBOxK47Yuok7jH8R+f6KY0WmoO2Gto+vv6c1phti7/Gvi0f/7UsTQAAsMfU1MsGmBP4ursp7ABiJf61/qH661qSmK43v4/x/u96Z3m+Y9/6azbG//f0j03AefP/1aErotf8ff//+n7/cCJr33r//sKqAhL1qqAMBSBKaaRK5Vg2BbDyMJUFyewUUlqq9kxHeKcArqhg+H2IdDiYq9FUpV6u07yJWjucqiC/q/WShCu/Os/Xnbn0Iert///o3/zv9L2X7LLsOZN3PPpSAg14f7eH7JASaVGAnc4hKrVG1Q0UNQy1+BZ2ZhODAaBu8kyUFzM3Fp//tSxNmAE10/ZbmcABJlrGqzMvAAY6/faEoZp5ltt29rTVa7tOwevGyNPW2zBs+0wU6/NvUYrECBtEohJ1kMDxHNxUVAEMnAbAs68EwCSQEAbbqMdYy/NBkEFtr3W/EslOszH3u4j9747GG7BisqGvZf4wjUGXr0pFLubtHNeVv9zbSMSQWk3QBS20wSASUKSAJSPVOVc5lnU3K1PrJ+xI3juhgmgmOTLlGV3N6/DgdEU+RUsMNQPpJ+q9mDYZRjhgHtbM03OmyS8OlinrHP3Uj/+1LEnQALiVlfvPKAKlGz6k2DJbmFocg9ttzmTtMe1Q8btv3T183l1sYzf3rZ8x9z//92eO//g7fWWIv51IN7ZnZy6Q7Y7H8qLCgDG37pSolhrAHwQUpAlVCAHozGpLpNRYVTCvMnTYDcGqWVccULKiJ7JI8RCgUTYtg0sx7ham0cOsOvKmjwxaztvYq4TKZcOHiJK1Bw6JbV7U1O/rsQAhPS5AXeYGbIvI0soZuditcVztGdojEyNX/+60JhWJRKHBIgkRBobcoHktOAYERV7v/7UsSCgA/Zl1unjM9JVIirsPYMcA4VBSdnhwoFdFpFx0YMI9GFNr4Dderc467Z48gSd/32AAMrG7w02zaUx3iuEEQ9FSJ4laARiMNhtkeNk77AQQYLczx5AbeZjW0NIIPO8fcjKDEwykL4sHRUqhZwXIzbVBB3MqVT0u/ypXGAU2TalNWANaKJkLUBwIAMDIz3fEVoTMgiGgX9oVutygx33LpB4wiAimRIls5mcPr0QDmlcjG3FaIn9XYxBgt3a4pgkIktY4JIGSVJUehIo518//tSxHaACiQtVSxhgEFWDyx89I0U7t75b5F8WA35iSfWAGWM7Y5Gk5S6DxIcpEW4HkjGiREXPfD8hixZ0cOLonikIXGpkeSZEyCeAiR0K8iKCBkWvJjHZo41Er1Tz5k0BkTucFZ1xG1Dm0FKFpqW78CQK7WqJIRp6h1AZGhGasbUQV4vWaiT1KAuuagRiO04GSCBhOR8im5UlA5muykXPLPNT373XlaYr4mkeky2PDioaBwQiYmxR2JCLh2riJSn/1f//0gOSGzx11yW92D5FUn/+1LEgQAKPJFIzJhMwU0R63T2DUzRxVBkOw+pKHR+8OaIZTdxfAThFMRazKn5oKpkFk+H8LDhmecbz/GiJYSJC1KKjuMFTKqVNGhN0+x4VnYijHfX9wsdBU5TBTkUcf/9Wf5BBPCTl+QR4H8QYvbG3vnORjTk87uB32HshfoCDDSd6feqtjy0s52En/1mkHX5XkmY37xKcSni6EMUbe5gdf4YyLh3WbcQ/T7ngtuuW2yyRthKO4KloCQsJaQnoY9rh4eU0Mc81OUOqXtjuv0cmf/7UsSMAAn0f0QNYMNBSQ4rtPYMdPcZuR/5RSiWahOXTLtboo6or3mKCVHFOhij2oa6eu/Wv9f29LtV3/iUI9QAYVSUS5LREAM6D5FZGD2XAkw3OhyLQIMB+uJ++/fKy/uWmDrHEGTvCPykeZ+734/Kfk5wq7xK833eFXgQ+lmcAg1CWf28grXAhAMFy6nTCynjt49BU42WAGgEUqGtMiNKy512h2ItKa0soKRBgoniNAxkoawxbc8zUw3tUo6CBJ1Z4MZC3uWaMtqvmxZ+MVpL//tSxJkACiS1ZYeM03E/JO20wwomTQpSBQETYBDouSBJzHbd3//5FbE1iDApDASCAhLRqVjsgAPocSkAUyg7dUv3nLfvOWAluAaIzFBqhHuABY1apBSFgs5QFwMxRkLWyRDgEbICxFqqXjnKS8y7P0Yf6v2rT2Zk5ETq1WvSkRwi1jwrv8xXiiUFGmBZvpHtVjc3JkbJu8j3xv6hXvWbdo+M581Z/PAZHmr3xqWLp/fe91+/THzbf89Nb/xT/ybLQ0zSAAAFJy3FMcB4Hc1FQnn/+1LEpoAKZLNPTDBnwUkTqcaykACiMGw80BdERGDsvEIJlwDsq4zr4RsqSpyZaacAgZKT0caFhY6Co4838VWKPyrmLO72U2iUgkTpPJxTN//+7mj5/q5dDAAAAABSQUgHEE8jPSy1Q5UNJAEGX2FMpVGtp9sCHoSjSQqFGZOD65IaIyVA0VYZAwCPuFA6HYhd3V//yPWmfZsGaRzCdQOvB9J9hxdd5fX/JpQHAAI3jwNg+IqwYGixUOCZEdHcaaQgyEGhkwiTUWkfvEj4RFD7xf/7UsSxgBL9LWe5l4AZR4luK5iQAg63rfD49TpBtAca2WGluLPXpbqiFZhbJ+KhGVHAIOGIsGQAlHbosOWe/GIIAAAQAoKIHMBKFWtLKqQo7Py6DEmHRZPh10pEdWbGGorBrc6zziHbCoCwJSB4kKjA6PCZL0GkHXBMS8sHVP+JZKl3La3p1khC4kecDbb3nvczSDMoADaTLiqADoc4doDjwsLNASBJUZMEipo+UkabCZdBR0E4S5NqVkgv7lZfUQhYhAD63x7J4GZVaYtCz1IM//tSxJqBCmRRY0Y9J0FCCGykwyRIrWE2J/Tj2vaqupTPqSeAj2euDDM8FtoqVBsQKKgjx/o5aeyKB4pVPpzurXxjIKwlEKTMkoIubG9LqOvJzqccjFdwheITwBbYS2iybez9l19vCRJZ2YEjiDLE2NDVo2yllW3WFYq7NZbpK3jtFzByh2EoZzUY13hPxh7irB0SzKFuGQXkaY+EmhvNJZrZ3ctrd3mYrTSvTtvt2Ya0h0cxmp+qtnbPGB9fT9okDQ1246gr/I+1aAABIG430qH/+1LEpoAKVE9bJ7DHAUCOq2j0jHAzAVYOSzCPB+fmQmqBziZL8Kphce6fookExbq4d0J0S3yOKe9/zhhxCbFRdwkS0kWfLlmlz2USfIqMnVHE+b9IqDjkhlQaKrIlLvqASIIJNhOAqwMpgNRc8NOKODJ0IjwfBTxuhlBEZLGIGYnLNw5fywyc4w2pOJih9pK1dyui3bPZPVWbR8845nT799OqbX1vs8z9X2PQZepbYmaqBs8uvsn1dtC4BIjlEhlYkl8/JZcLxFxQLBc9CpiiYP/7UsSzAAocf1dMPGGBSJzsdPMJdGdV3qBGX7vM1qOGBqVaEb5TnXf6rfeJ7NVQ5X/fZCUCK6oZNmu10lQuveudRr4zmcSnEAVIgRlgSRBMtZnLkg8NZIEklFYXi4jHaM7lBjMDJilVd/VXYHixqotCOWHBRFC//pEbVDSZP/6Hl8hW5jju0wmjFASYgDjX6Hu7RdtEMCuGJrSQD2YYptqKYKMAThgl4cTGOVtVCmOZfbFuBQIOghCKU2ke83OKRsjpdzEhgAERe9SRW1xRoufW//tSxL+ACkh3USwwZUFHJeophhS4Br2ABvGoGrMLFdDdT0cYpO5x80dOo9XIWI+9GoBxNtJhyJkqkgGAuIgkRDk0tKyiIIoLQUQEPlmuU7wWnnn+955iQZNtHFH19mqfMjNTslIzszhT/zzFU4SAZ5xT3/bHyH10T7Uv9XTiNradK10sAAAWVdHkRwFRxiB3dhx3oxYaEhSJALOVhASguKWca7M+WjzDSRIHgKaKjew2lFJF/uJJcLHmRqP1XHFiH9CzwGCkilyvc6+7ijd96rD/+1LEy4AKQSdlphhNKUwXKYmWDLga9ZpbJq3JOnhDSdnkoxYEvMfbMxKBBPWyRSVkixo6C6YB+tHGygIM2cyVbJTyQ+51mjE7O1vqzHOjAs6RIjfdtCJvO8lVYcxZbOZxSj3SdjGUiD5YPPbmKYo3eZGB0aKou8wnrQA3KLiJaeEYSTSKTOhkBcbCGJZ8Zkgfyqzgg9Rc2uXe3lbKkCzLCByPOq3o4hwgNwhJhkTLOLQNjHACPjwdxYEwiaxLCSWdr+hYPHIECtr7dRLSGwwIgP/7UsTXAApIXVlHmGyBRZWsNMMNfMk7K0qcRd3gCiPEyQjIONMOQcFxIHXI28HxqIxyjVtfu3TReyJDZI/XsagZlHAN609HaJpTUzHKw/5BhFbR4fuszIzNB3HnBMynBU3JhOaEKXeQVXVAi0gw9AwSlojM/nt7/9ViACTEiabICChyCOEUqVYPiITREWoxKIpGxcMO9M+lhYMxjbwtPUxKstd0XBX4vo4cV1abzO3tPLOKnfTXy8/EPYlwVC4aE07ijlCQES6nCoGwepRYcJCe//tSxOMACbhTTswkyEGUI+w08ZYsHs0fr/ur1ASQrs6uzzZbc56IIhEq0T4OdDEozG85mcWsVcLXz0qnjh/1ngymRU1U8GU6NlC1/wbHQokG4LL5ZDmHA1YSB0Oxd8uGr4a1jE3NTd06G+8/esWnTym5YkEyUJ56AqEZJBLUyOzUA7J5c11rTvNZi77Yp7RrVqH/xQSofDnH1sFmc20rq850Dgv3MQwWn0wSeX8NkLsuV7yGzCHlW3xQ8qLsD52s0LPHpADewA95tgbBVR1Dlg3/+1LE54ALzG1TTDBjwXUUaimDDdgeX21XMVd1ICJkEZZbZALgjCSwQDOPKm2fWkh2CH1l7crGUEu1GznDVu4Wcv2+1W3ppd28tIrudym3Xd5qndjTNezEK6f2RnCIzq1q/7+3tsxGZ3X/o1mzlV4kkSaZvuVdUKPtDKYEEAm2kE5RFKa+4RKjDSLhadRWoMjb4qqObRh8Stqg9AeqMlujUS6YNVSqodFKAwzAJHIpEn+Tsf2kZ9bh7kbvfMqgCCbHf3Rd2OUpGdLGwu8pErna1f/7UsTngAu81VmnsGOhb47sfPYNlLLtA50DIWp33oANIBiRsACBrbCbQOxaCoOx2LP3C2m1lSqse2VyacuTMBO0AoQhA6IdgcGDPyz4i6wgGkafTalhxHkU1tjaqW4lo9iCqR2SJpQuaOJTWEQ09teugvLCQP2T9dcAEzglGk4CpgNcAiJjk0CgRjKpDcKI5oGVEk9ZT5fVrKQdZV0ND+obljIas2kjaa4mad2k2IaKo+Z4qHZagVqOUpAwJpXf6r6pP2/6rb/uanY0TBRRx8i+//tSxOiADBjFTywYbuF4JWp1gwnsph5Mu/SXkjChjoVQuhCJydKAtIhejFHYdh0S999/XEpVweQKksaE9IubtCSRaZoDDB1YbcWEIn4vlT0NOZO7pyfC0KjZkZi6JQ4n9gt+IiF+Xwv/n5k5+56I5/fy3c/QoYQQAAAARgEAQ3Fzec8X4nUb1vHQlRydTkO7F0h0J5ccCAToS8S4YG1dgCYDiAIGJlCS6wnIAwqjbFDmFxtovtBQuodDCQY6AnULnBEDCNkXKk7TCJAhBQINMk7/+1LE5wAL8LNLTKRtAWmWaKWTFhiPFhxEJEci7ZBgwdaGBxNrBdu5j8RbJJbNNxjKRal3mdYS+pe06kf3doswh7o2cEljQ/OYUCRWk5CbIQvMRYRz/+ev88e6f/NjgwqlarBXYbejhp83JW4h81ceASsNgXHf1baFT6P7qTMph3pKVEe95MR6uVDRMkjR51LWtHW1aWendagRrLqqw178a9e0y1YKWKEUAVSJwwgiB6XhveZJeff8/3iflmT2Ll1kNunqSu7swcGQtehu63rVl//7UsToAAvg/U9MMQPhpigoQaSNoP/G1acaTcx+HQZUZOmWhrcg0KTSbjUKEy07NA8p8hTvkdlVzyMjwXIhInb5PGPdL6ddFL2dGzFQGCKWi+llReOfnhyJB/fFpNC11hUe8qpyH7mK1XB8PHdywiBEIEKYIoSSCnRDUU5bQp211IAIKn+hdojbG75RrC9zneZtJcgwCo9TokUx6KiKhC4rHHXKBMBHythoABw/Ood3OFbVue6ll/3eHe3a/VoVCEMABOcZRoXLXs+ckdXj/Wae//tSxOGDEm1TUkwlD8nHqCqBhg34IvZZNHN1YetCsQC4uU4gJWaTbKWhzGscxKWkxPxZErBR9yVMv99TKE5fVyHj89s98/X16Wd5KdExoqIeWVGpHOnpZt87K3RcJsfXqOv/G1+drac53kyHkzLCpJsf5fEYuzszxNC9vXxsKIrOYrFiUIESaQWMOu753sxeVDmdYUsqaVRS9K3msl3RbTixNKW5kn2porLzfa34xpVzLBR5e5hKKnViJrh65gKG31NMOh0DWFgGen+2sbvLoTr/+1LEvIALSMdzp6RPIUAL62D8mUgAeCKWCyIw6nEmT/AzFrTGI1y51yCs+tKGsIU6KTNFcnKZ2lcbFCwNFdTdqKSom30Bw6sJnSKHdOtE6+Y72iFq9EMnhdUmRxhaRaNcxZUtkmTzwAjtSYWxQIKIOehS5NKrqDoIhx2eQDMhKDYYBu2QBQkJo5e2BDOJvbC0VD6PQh63hdhjVTqfOcPn8MGXn6hRZQu7AR8yQPZFGaTAE9GmKqlWAEJ65UMkmpiEi66GlQAABAgCoNksAuMXIP/7UsTFAAu481TMoG8BkSNtNPQV5Fj1eMrU8/UNwNDEjYDgT11azXmVhI8KIkvoifFdThCuEyECJ0KJvS2wxxzekygiFAEt72xZjd6G1PnyM8gVnXIOgdfYsJvZKN818112IASQ3B2lrLbXL2cTElp5JqAfaOMpjMg/4L4SoF2KERpvRTu1YEtEoLCHDprV0bNrlmZFMHD43+XeOMWWRuEkqoACnSbr8jOkhagOPHi965FLEuVf0IslfUUtUNUAFMKMiypQ6kdYiWtRijXXkguR//tSxMIAC8ira+YMVKF0Fmolkw3QSafmJdNHtTqSq8RCCKkurfyk7brjuT1aK7Q0LufdF0YYLOO1VMKw0MQ8USDlM+uM72mVu1rvvU95+aJ7c8n7f16jIAZojY35b0qQqtChUD2vM48ffzkMtYuS4+Pa/J5UTA0z07lv4XSaCWS4y87lBjIQ/vmgRxYvfeJmmqnsNgRLZoDCJ9fTGKC9w5xOMYFY09uv0bd/0UzwoZLKADTEKA3DMIgCITU6eBW9iLwvy+l6WRh8D/4kDL6ovd7/+1LEwgALOHlNjJhugWsTLDz0jZRjdoobUlJikxRxgsomVv0Iihbu9vTU0qrp1bUefr+yL9m5U0Z6WuWlv6VVnp6f//////9bsMEDEOzg62IDwReZiRB3RfeDpQ/sRgpwTldQCkR7UI0bfs2tpsJNaooopJtXdtJiKR3V2e6OIGAFCkat30TfZNkS9XO9wfoV02vpF/yU32ez//6QyLUBkEQqokpAGQtC1YF2nLiMnicNv41yctzAXE8A598+gMLo/iypqNd3ZSfc/R3iEicP4f/7UsTFgAqseVOMGE8hZA8qsYMJ3Bt/+gQMFOsoCBiL////qBAEwfEAY+Uc8QQwsH0OXzlsvjChTtFXF7yaCn20UUSviaAk1nLY3oBM23skzWlDGcuM7bUWgtwkgoaGX4Sa40MUyqjMPXWJxONCZhUiBcUAOBTekxCobMrS2EknuailFbcl94p3a2tf/pRVzO9fWn/rXtdVYpWffoqX7FEsKgFBHYpLhvYMUpUBBKTjTy+wusxGlMuVWfahZ7Im70VWeRmxgFhxuMWpnXFmGncw//tSxMwACs2VU4wwrKlNF+iFpImo+mW6z5FUwYZJHgqoA55ZGqwcJSz9NC3Wnlf/TstqTqxe0jmlDxKpYIptFcCSIgZIIyak5ZYk8fo9CjTaOMk0XJbJGQS0fJV6Lycx+Jsaevx2EV06MZXcapWfRei74m5injUgO1i/Lgd5UMs+Qv98L2Km3SS2mx8S3GaEWf1uATRRCUZLbZCXRQ+oFxGWlpgnmBbwkAgCGBXV4cPMX9Bpg46OlLuKV2m65HW+6ncObF5CLFqjvDDnqYx3UuX/+1LE1QAKeItdrCRs4dIpqgWEimjZ+kojIEl4s6QWXe1pBVDv1iBMYBSImuliUy2apyvEXAQDg6iK/+5Cxb2FTtGg4mTo1UFTFmbQpjFRfkb7nUSF2sN3CbKntsDto/09H/F1NGZRczrYx1HicDmVR0iNdrcaRBY9x3I5GjdHAP92XFSG7anKQIqExZvhcniHwyAJV7Ftutv/rxF5t9XrD670xoggu8/KwLPsX4yw4YAHUcMZUMIOi5E6KnR4UEpjxdxV/aUEaF0yRYJtljEYLP/7UsTOgApMY1rsJGzBQpCsvPYVlLFu5UAM82AmzIFMjfettvMJvnQvqQ0jCTzIX5Xnl+L5TqAaMF5pWg/lBdoEwGSJueqCPM/imNfzjhWaH/+2+hTyz0cmFm7tMbUTJhB6ULaPfFGCq0WVuoImZg79DSabHdbrWdYAgC1gAIEMFQoBTj1bN0bVVYYht3qjU4k2M9Gxly/oYA4LS1u+SmI71pnCp3ihCJXLPOh8/4dN1pXLtNj60Ql6mGFmIHnA7WNL0SIpUaYk6LK7ps7XDV2v//tSxNsACdyFZ+YkSSEmkGy88wnAqubba2J3MpAhFCCDVK9Ek5SES33AdaC30cKcoIOo5d/mVAcAmMU3oQqHVuFr5oR6IdmLR+WmrzBh1eylZhkpCbkcqcv+bcaixqHMTfGi4TmdeFV6hams+IG9K/7SNV1t1NUAGAaMkplAKKZgrIWGTNcVsr2076ULR56rUM02ptdeZAYcJz0/LuPI42xkDOW+sP/PaqdBU3IiJcs8l9cvP4ZoGEtQpoyFmbYaAFbej1c81ZhpKbFF2Pjo8Uf/+1LE7IAM7L9vp5hxcXYYrLzyjgS61+9f3gBmpBBu1v0il5Gy7D1E5LjhBMUVNrs882AXg3NuEfzp5ivOQyanQt2rZERKc6k0MNCrkuCX/h//3v6I8LtDe1XS/2YxYppryyT4FCFIuJj6ErDbgvYh99jqkywr3UdSlRIyUghoWyNpJg/R9iwD/NpeTWiFqpkQXuVIvgOAOdDZo43wb65U5VUkX0I67cZ6zVqJa7O3ZqmXSmnZjs7J/3lW7DxCsm7AlrKIpCipQuboUaaSGzDm2f/7UsToAAvwuU0ssGzBZpWq/YYVoBhqZYdCPFnMPABIIAsW1sbacCijSEi1/PY3N74299EyKewvihgObCsqdlyLYI2TlTph5mIauQjDhFxyr6gaTZcGAkLlGiwAoCJoMQIZY4wQYKEHi0DrYbd1ZcZv78nWOOAAvtvVAABr5wXEdieaiQKkUJFAgYBIF2iyAIkXKj2lUSW0CaxmaClqA3x3GgqIUjAWMSQjJgM5SBwAqywEkbk6vuR6DJXCHLhrXVzhOqKqTzSzC+6tfVUx2rtl//tSxOkAC9zTVawkbmF9myv89I3URC7SCnLwhR/pZGnocpfEsbKeWn0WNlqhzWE6TCHAySB5AYbrn1vXYTlQIB1LD8E0pwqsONJxBHyiVe/YUWBSTeNDCRrRSKZ6mbBpp5UES4WJRoQdCx0qbJYiFh6zUFRqUFl1N+hqQkF5wwoWNDK//m47JTnAhA0aYCp5elm+3vL9qTd69yo0qRePq/RCyQAANhAlxlZUILOWPH3IeKUvBTRSEVqUGlhNNpzQsUHqjlI9HLWTJO8lCi1JxRX/+1DE54AL/Nlp54h3MW2LK32HjZzoRmHgPRTvdaNxIEoIr/lHA30REIQighCINBZuHjhzA7wPbQSfm+sPvw88tzn4COQCI+zuCQ+IXbDyyvYBBzDsDAwiAAEIENREsmIBGRAbysOUcBdR9gECgPGfQxFGrPApmt8Zw79fJFtcY2v5nSLO2zs6/d42G6CA6LVs5OHG0SNFA4xiatbf8m22NyXCmSr9tZjZ9y2+HYV5+pTXvxyZWI8M4aGxnmXDIjzQWAzNF9VCxgK3U13DO2bO//tSxOcCUoyzSSzp6kFCkmmBlI2gXS+k1YBg3hIBAga10tEklkgBQVBYLwDkAeQ7UCSrtYdhEweT0q+hCrQSVRWRDsj9zS5E0nsd+PD9RR1fdyhRodtgaehtBpE9LrnmXig/bOna1fLUNZ4V2P/RpETMCKkdtto2515U1PFCozQc0EGGaa1vI9JajuHkmPbJjaWHju1jkVMUO5k0b6fcuw6FsmqpBQ/Dytded5akFpk4d/o+lhk0SBO1ezSZKhxZrfsTKjBWckkaaSinOksKaJv/+1LE0oAOHOlVLBRvyf8zq3DzDnkgUKQmVCD7t6D6Fsa0JUKVIy646CJldCmfz5RKlhgrE7gNtwrQXMlqEsFlBxJvY23YObJ1m4x6c1dDTt2gmtb1N/KgogCuuJtEkgMbEnveZxYrEJsZM7k/+2yonsM14VxpbM+myWY/cMwdevmoydogK8zrKD+/ydpub3c7+sfd2ntjORZdus8he/A8iMMm1bu9Kamv//7CATIAC1eNv5G52U0y4Ks404tQG4BfI5m3sug0GYnsE7LuJT9ahP/7UsS4AApYm2OmDFFhTI9s/PSNzKMmS3jLUSu4PMrSN9zCQo7teT3jWRhwVMt9sN6HLsPxi0oWmdWowp3/Ye/dXLpADAACDRNbYwSFDHAWXSuXFncfGUASaupZY4gLM1Vjzobu5AJueDGzABdQa70xZId2u+9yOJkfv/uCI1hRO/vggZA+O36tKQlYZpYUJMXssvFFVQCQBU4nGiAWh2n1gFqwh9Xfirqgy5MZvb1ks4ozyymBNwyUYyDYInqK2IUtLjmkXqEpEyh4HKy8Bh9Y//tSxMMACgxlb6egTjFRCGy0rDA3xRdAo1w2xMSxSBVVHmCqRj9xwCGxRX8gXASBNckbST5YUCrSAMi4L5oWIhjRXAm4DCd6l4/fGVPLytR7eLGh1XJ5M5R4FZgZZ5gm+D0JuFBwaPAFjVPipeRdqVFG5jDrbuaBYPKHp+LNc5UAAAUttt1JSkixCBFpg7XKj+y5kQ76OgwiZqIKLet5QM7a1Hu6OXdKujkCgGeKNDFZsk1wgBwQyj2IkXh0+OtvjbSz+rV79+50sH3BhuXF2nL/+1LEzoAKaHlj56BQoUeWa32HjYxz6SUwVnpFGiSWqSVmotmTpRFtyQgdd7zCZqknJkuAw6yCdibIpRnMbbntfPzFiA5gbSFvqkhE5AliInlmXnTyLv+bb3hHIRF0p5z3/NZ6TPmhNCn5X84a/6K5QymVOR1z4ZJjIy6q99daBSDLVUkRAAaQUh/vDJwiXHYjxEl6xdQI+Ic5vpdQN6iJYpRD/Dj7w2Zvy9i0VvID7TSgARIkvWpQm2rUqdYBiLrPpNzTqP/eYAwigSqYrBFBP//7UsTZgEp4eVesrE4hRgusdPSaFkMobefUZSn//0emQJh8IkaQ4Lgo9FT2/fSSAQJBABAAUKE1kiQg4UYfafeoR9VpdYcPi/UEJUlJCLMRNUhcbvoUL4stkY6l4NbeP6n+fFkhY04eLBkTFHYgcetFhv/R4u3/08Kq3jQCqUMo9aoAgAwlAMwxPxMS81WFGnW+YOkW6LWdDWAxQwmZqdwxJGzopDl2rPIudjEHHmpQTOInE3pveFlWT2zjnfG8M5RpxqYgWoem6agpFZQyTOez//tSxOSACmBDVaxlYYGerG009I3eXKeH2lRlEuuQ1i6XMcK6fT0OX11vPkJRQEQBsq5QGypL8glUuE4olRBBDDRiEhM2wny07z/9YYhafTTKNPp0Sv2ZNAysrf3l6ogUxG+yTSOeip6FFiyw0LBORllxpL0BUKKDVZJz/pS36NcAkERVKipZwhfi0LpDnE8E44hHx+mIkIh0ODySBWihZ+CYhVayvsu9U3SWr0p2pYea+yeqzKdL5XClnA6JYuskj/9GUAIUDA5zjNnyXa31AKr/+1LE5QANgHlpp+B0sUsMauj8JMiBHKzG0raUx2H4b8BPl4JvJx2l3aG5ZLmdaqQizTuSBDtv6btQoYpmKGmTORnN5mEc2dSyh95nJ8XZn0bEaHsrb4QiUr+Z93eyp0vWndH9cu+gxzhMUMHkOip0VmNQkaPNrdUqpCoAEAQxNpItqo7Q2jdFHLpXAkkfEBl33XT4nA1K7jx7PqUWHM/gioG1a5Z/sTk50s5SyZYz0vi6Lm827Wzc3oJZGpLdabVK13y1VdUR9JlUqelyhYZc7f/7UsTjgAzs8VuHiM2BShMsMPSNGFT8aob1PR6gAAAAgERstJpxBGCioGxdY7ztliDjobOrTwzFldLPdHCAnybKffVFAzLFMhtvTo1tWainncpnOkr1ondk2dNVYqquULLu5mdGPej3V76/2b+zlbtW4RFU955XWmoFkEdW6SNIqhLQkwTxexRE+LcuUsGyd55HplTqZWsN2Dcup9ztT5dK+8Rr18fpUpoy1DU3gafyRmXMuLPJFWf3Mx9ecOuUjVR50Fvd7bUyyev3oy+5Swik//tSxOSACeTBW4eUTgGcJqy88ZasEjhgcK7K9VYCAIqmzkTNAqVGi6X+Wm12AclMJ951HH4cyBYHlvIj3561v92Yk0LWBcMc/PCzmQH6EnGDpp+kYxbV4pZvYpDJuuheS2gQMyKghqqL26am+X/2zP6laEXHTjfVABEABGltJo24AZAfg+1CX5dHkiVglSsWmY2jiPqBmwsz+Aj0f6zbAlZIlP3v7jQ00jYfxVXN2to0bnMvP0Iy7IViEqq0S48cw6RqtMy1ostn8n362eYqeuj/+1LE5wALsTFVrAyzQW8l6n2EldgWdB12oBEENV98qhvF7JUmRRC4oCGsH6SByMNAITGVPoZNvU6lpQSRoaP8ja7zmNeUmIOJCB3jFRShmrK8XqNgwp+5ExWOjoVjKq7MUIq7xUSzMwvHsuztMP6pTatV9m5N4WsUFYIFokd2VuNFIHeZJWnOOdEFOpmhdLiKesV2ZhL0lo8sStedbxRtcu8bEtAp5FG7uWKNWFL5VcfFbmQZjCkZZG2ppoh5+NWmCIVnIMRqHv07W2oa96990f/7UsToAEv9LVmnjLbhbCWqtYQWnC3+FugizBrNiACDOiLhblGFgEwsd01crMWo6DmvPMPwVDuupwHCKdBWUPF2fQcZCkD2Q+5auXHy8J78XdULh2fBlkGSWxALBwcCii48UHC4R0WfApS3cu8JC9Hh3xQu4wUuERI3v////7/r3f7f5e1Plt3t/hHd+oRDBc+4IAg/ykpcMpoAABqUCplJkskCQtIBZzlNSWMIJMRnymsOjIKr2DDkqKKEiMVtUFAAA3AGO0OCsN2FBpZMBjjQ//tSxOiAC7EtWeegsyGEpmtw8ZbfdYDEIk06ey8jSFsfGGp775C9PSBED0ynJoj/BtbqZgbIBNo17F3cvpQD7LAiho5wX3GGvaG27QVJAgW2yyDbcksZChxQDKY9IYYCfVG7sPnQqOG1RSSluyyyOuzSUkYym1yaU0a6PVGMlwZhjKxVl9FLqRCEkXUjenszf6gYiD4gesEBZFIq0PDUkw+ISaSg18XIGF/59qkLAEISOGQgi0Y7kE57ookOuLhSX3bnplND4yPLkluB5l5mljf/+1LE5wAL4TVjp4y3Me4rqimEoYCprqJNQFQNhpsPWGqaHHnLYAoaYo8triu2WLmGvSOXXZOQPH1sTYLmHXq9a5gG6kaMfFgnVZrY3GUiWCjK4sOFEoidKfQOaCLZOIROdYkhbewx6L+RlBsJItHZke+qaUvtX/VtqUajurK25SsertXNelWKzrp6G92lr03d/7f2/QBML/99ADUmO0d3JIk7jGtI0i1fEpqdOnRBxunhmQlAxi4JaChgYUS4cjIi6i3Evw54Ndy4OT4pMqa9Dv/7UsTXgA4EtVMspM0Bf5ls6ZSJOA63VWEXW/706VRUkQqssGIsfUq970EmdiUmBu8HVyVaiY11bUvBmiIyaThj2rEYdHSaDdRLgJiQlE5lbVneBgY5ptRQDiByQQeVawAsBda+3e96dNraXOp7Co1C3JESLxrXLUHqRYPYvEGySrDtygRWNlh3a2WRpwhywZa2Y6iMQ/LmcUbDeIQgj1wudlc+XmT4vOUflKDYtJgJV45GXf8jU9u/yzvD1ypGcUQaZ/wG4uVAQFijaAmg50/7//tSxM2ACrhZaeyxA4FHqy809IjmzbYSTp/UCSAcovuV84KjRzeJoTlUcLoH6RPeSjrUTT28dOEyFK6aSbRh7qgyBg5bhdSnWa7l7qqLSUJ9qXTd6rQ8srfd7tKl3UrVoyadiaG7mTX+n6Myl1GdWFoCvZbcliIAA6ASkVGDl+6MFBUOJq9RCBqZT0Nv0DBCjVLvjJaxfkuhUqduejo7AitZ3wUzBkLcAahjDBMF1o16mxwzMqRrZ1VEkST+zEWxkLKpx3QTX369nOitdG0evbb/+1LE14AKYF1l7LxhgUmG7X2WDHREt+54G6QUw1JYlG0VAYSDBjZ3Bf5vGntxp2QKmvzdErfJb9u1D2M289evhljV3kRGcx3Q5aipAEEyPdin2mU6rJPccW7vHs8W3ruztI6o7uHBY6j2IvXt03Nr7stvXbJp7tXdqZOgAc7SC3zD3TWDag5En97JbY4wAzK8cBliuq1OH7gnSo3FiF0JxMdMI6drwOigX64b0dl+eRjS5exA4bVbm8IT+SCmYp52Y9PVsx1IV1Q6DXSaz2l02f/7UsTigApcvXvnmHBxb6cqsbQJ9Dbp7/6t/0sIGDbMeusksZcAkrIPkvZCYz1T0LNiPrMwf4x2VQcTNlmWV0MtpjVPHJw1OVt7styeTRzX97Rdc22ugFbekAIAEBAEDFFAwKGJoyMVojveiRCIju8IWW//8vf///726f8z/9f+8zCJBjYoAOHuhz3Qeg3U377ZGm3AXLaOcE0zsRu86EG6hwBuD6S7Ph1FsJzJsENwmYkhvSdvv9VVbareaboccab/vr9rJ2LIpE1nVjZrMv6f//tSxOkAC/k7SU4MUYGqKqw1orK+///1VlQ44akQgLrdcUARO4kqJXg5DMBCUgWKJEO06rDaICkmmNWxrFr2SyusYD8mPliBjSI4a9zmdNJlTbz3rn9216zKs1lMR2P/792Y9C5Eut2b/+i0RbGLSzb1Wlc5p5U8aEgCxl0HPNvZ3QKFOeekk0rFGmkGmdTqx66LVRlw2VeLJ5tTlpMHu5Az4dWk4dICeoCpenmzkwR75TzRsuaHwVM9gK508o8vDfqx43q2BFqn4eIt3j/eNUX/+1LE4YAKeTtvp5hQ8bwnrbT0of4NY9faDf/9xgs9Z4bC/bYG49MbgefPslryekSPf4v7b1qzlnV8emv753/ibemz1zjOrt6sY/XWM/N7xLY////////aoU7g9fNc8KYmE4ADDBSSg7cGdWIFh2tSL9e6eqQ891XdEHsqKmgUXTQtykNHpxu76Ks61UTSfP8W08pvCTz73EyL5b3rdO7wxgwUrU9By0kClOC4nLlMP/1Oc/0n+x/UADClcSKIALqEkIP1FL8yfQmGJ0KGxQ0y/P/7UsTeAAoxO3OnjPExfKhp6rRwASlKXFEGoFmm9IKOmG6y6viwEYnSBQYQXK6jEEaZXhFDpmsJsZWOHGedBnKNTCrpucNE8jP22xvqHbeb9Zenj08YzLmTVP4I0vEMyBfmMQ/kCSlMtJk1UiHSjrjGAiQGsMpxEAgFirjGUdCLy8U7MN9GPhQPIUWkap/UrDLNcyhytREdqx3cpu7slTaI/Jwz1UTCkKmYbUOFTyf1rWNO6OTuPfjn6n/K7/lvKwGiVpra2inMK6X1AKAva3zv//tSxOOAE2FpYVmHgBFbnGrbsIAAsClL1SrHDUzcIO2E0jp2LVGN7qKdJ5mLkkCqxGKIYAbItbqQR1Syo4P9QVjD3dDN5UAnmrfEQBCrNjFAAKI0ledEQkbA6Wzxto2y+pT+TbSaTkoC2xRkCFLEmDxRrKyQB5eLvYdw7vaR1iRAyhBr0h4Y1ZoeiYHRSpw88aqWpK3hQycFzjQ1/X2aO5tyWv4EWZDSj/FB6gADKhEGxhxZNci/kcoEj8ceQ5jIiQw4MBTLcF+x1uDof95XghH/+1LEyIAOnaNdp6RpATwTK/z0iVjCZI94fYdGrUoUPoO3mgRSIkBQUeKVtF1IOoFBY1UazsfFUcs9+ewyoUUsl0YUu7CIEBgRyiNrIkWwQIfg5WpBUJxCiAMpY0AtzltQ40lODi/jou5rddHVOGnZVuOp8yrHqWGBgUTmmtaGHOC6S12jIiZm1kqydw+oFLThhimdjd5ANUnDH7bJI0kwddEKQ1C1Yp05sdhYy8u7n8ikYht0VRqfuvUmMUaKaJwNThXK0rebIWfQ3SlnpmzN///7UsTEgApsU12nmGrBUArsvPMN1KZc6iQ+RQoxJd660anCnGWDpcP6AAQDCkkminAVCqqskcGDYi5TRnuRaX7T3aZVWbgx4bVn7kzYwqrQ4LkDe1pkX3zrtnCW0em8sh5ftmv6f/YrB2tf/9aWyV/ttS7qz+YjPVQzdJJzqgADFEQxiMy6QzIMyJMuKCizDY2RGjBdVbVNvhZgwgRB6gLBnqEztWux0bcdSuc+EKekh85TW3bndmRtsjNIipSnR/Ri2KRxYu9DKKG+1+oUCEBo//tSxM6ACrQ/TSw8ykFJDus88w3cp0GJgba5ZQFFgJR1E1k/VOzo6BojrQ9Nl+SgV5pRdeS9ql3j2KzMAMR9QRKCFccG5ZtxqVPUgFzQHgZSl9YKUNah53/9St4g4JoCMyGG9zjK9DDxl89sdQRaLNck28WClqYAAAdR2JNK4FXwLIKBTwLWK7X7UbU7yQGQm1cTyk7xLXWBdNsyQySzBoG9QQP4N1QfcEcTKCo4hZCRtE7CLPsQtzBEf+qk2RZdFQYcBGY7stXCbjCSSLyaXOn/+1LE2IAJqMlrp4xS8VCoanWBlmMN4gcCt70KQK26gEmKF3tYSuXopwvBm7/NMKtMRcy7L1+z87NlgIoFgghjOyFAAhoQQOQMg/Xe4jtm+7z+M/tOIjDCAQYQC6iAAhERz0Qr/2aXWYyLv//+UUceLHkBGURA9QQCsCCUvwB6kxLBGLCXFQF/ZyahvjgRZlpI8m0bJSeIruw85yNSLaiqNETkTkaiUVe5xDid4Y5ZUIHNVBglduiWTaZAIwY/irO6/QKk5/ffyCw+3PvH/Le9pP/7UsTlggngz0ENMEzBlxnodZGmqH6vChLHTXf3QAAvIkANyOy1qRSOG3AGTpRmKQuowOMrSyiGhesFQL/oYBcI04SoazhYBdQFEQlo7o4poWhGFSs5nQSIJQ0bO3KUTV/T24La286g7TAuPHu0qcV6zfwzSi+yVhYk3TqGTvf/Td9zROEO5gAzDO44t3FmnzeWV/475QQSEYAIB2g9J4en6kU2H1GR60gjgj9z/8/5yf+BlaoD4Ai+EEYuMzKL0aW5CAEmCwy+042qKrkMFRtG//tSxOkCDDTPSawkboFnGim1kw34ArQVtgV/KxUXoYMrlYrF4fS+uGmJgrrvzz55fHj20gwQ5BQh1maaMbFnfM9zQyF5khZvoZXMtiQK8qkNY4kublHlXvIVrpIGTYhTZ2dZsU+4wDVIElMttQKqjdrN66iHQSNLm54MxZSjcHGWHUWghnSxo8Eqs3KiheOrpKfcYcQXVnKSqraY6X3WS9HoxoT1c6BRKWPUoGiJ+DXphUibWN7rKmQAAABSScCcSAqPCOVxOfHYSBpDsyORYqX/+1LE6QAMTJdXR6RtSlsjK2mGDwlqysBZcdFI7LKgkr1Epkg6FHGHHUjj+gRkM/5UK1www/W9WI2iS19FjSClM674nbT/HdLTv0ker0i4ABNJuh3nq6QZxu1qVMFSgDqTkFO1dtjKcqd8fQomjBpzBOT7hZvI5H9PLIzGbeFTANHJ1D69aa2XuY57+k3NCEKB3+lliGNvqYWEO9fY74tVBUMEBaE3ELFLEZF0F+MosJ7jSmLk0QC0Lyhw2E8nwieXEA0ithYVB9cSiLDhILlcKf/7UsTKAY2Y12AsMHLBSRCrlYYaUEc4LUg4VNNYRnhcCjjpGoCupLxskMzejNGVu/66PT5JEYCgFlTEEEm2cLtXWgTbnA6uRGSKv/B7hSIXgwwBJYNsoZQW2m2bM6WvUBZ9e7+ykurKZHeRu5mmq+b9LdrMvZr7EVTXJmYWtg7Zf9X+3VscWnUfrUoBAvJ+CEBwcoyU6XBPnIXk53h0HM5E2RCrvJ4EMHOb0rbLSMGnyo0SPQNXFwOFg+I0z29OSpxpF6aLDLQOLiVoLhebQhPV//tSxMiBCjSBXUYYVEFGDqto8w4QQNT+AWUCzLa7EBTjCkAZyWFiE/DUEzOw/i+qAZZmJCCFDi4yE8iGixqXnrEoUWtNKzpzu0OEFsmft+Zoeb3NQ0SHTg1DGMnh9Kp9IODiQoVI0/Rcha1MJFQyoBHEsXeNX5Jn1xHGpbIrdYnMUKnQwhZCEURtFO0UCo5AxOT4qcTB5CYnplHVirkKkjgwM0HCoYnKa0zhc8GKRNMcNHBGQcBrAIUGmEMJvdNNSMBCGCYYNJsPrdciOurvWwz/+1LE1IAKTF9MJ6TQgVAc6ZmEiagfu4lahPZo7wErBLmkUuQgnRzzEQTU9GpBjJNNPGS4uEIkFjsToXYYqfKB6D1FEGUi27lx+w7YGoZclgYiemlnyvItkYU9+9Y5iokn6fr3afE/t1vtrq3/q2Tfuofpzl9+/3a/l/17KgMAtpFOkCGXqQrQfprmeaJxDsSRTHGfileaKMmzRYytUHR3Kel+xBIdSemIG3qFjKVBI/NXnzr0rVes8OeSdERdZcRBQQHFNSPS9valgiQ9m2LOk//7UsTfAgnQQ07IPMGBbZKp6PYNWDiCTrYoX6NZgyB5TJEyVS/G0YjYZLQdyZQojRPLUnaZ02+HAFKFiGhoiWmDVsxBirNO+47WIhnr57n366t+GleeVYgDDYo1TGPOPULJPDipcQNYK7kHPlkpA0UGqTGkzBg20idSv/rVACAzOqQEYpKRkMTiIaH4zGmYxDi2n6Vp+j7hl+OMf53jPL4Qg0x4OCwutwGCdvFxIuasXGIUAXiMZ2RJS17lWG5wXSvYD+OWHufcke/3rCeLkhpY//tSxOgADACDXaewaSF9imqo9I1R0uhDXaNBr861q+MM8J6wPFG/tmusf51bFa6/9Nxq7vS/x/TP39/GLfWfTN8aewoNaM7m0fXz8Y9c0///////7mnlC7fNe6wor2yXBsFgvdUYQAFJN0O9D4pdkYpD+fKAmafUG2Bc1Q2IFmUYkraRSZTyUpSWV3v3aeAH2IaYCTwJnEygOSCSrVItc1UYTDgz0DLimt99DueQ3tyzRppSAAGxDAwjvC8OYoz1UC+iEuy3YkcFJYJxYKzWxxz/+1LE5gALkFFO7D0hQX2UquqegARJZ54wjCaEgtay2380Kgq55sUFR0MlX1NiuYFhqG+VKoWLEn3JcZUeDVDuWZSe6t71MUAGK5QEsqXRFNlEqkAc2pOJdPHcxTLylfrCDL6wvX0FXvocG0OIU0qcJhUiqVyozEOY14XPHxpQWiZ20eAucqy/FFueMMP33/2NlUI+0A79FlyF6VR3bttNs43eShtg3RnonhU+ZnQmiBpSJWUhrZsKKOyxJTpcgjK0ms7qyFuTZKZwxjUvakyLIf/7UsTmABSFdVu494ABOgrq356QAIQOLtNeKgPRWpG/Qo9uOsuHbXsrDo4+0DS5uZfQigBQAAEMrgRm6kh56lztRZvl+xSHlUnfhkmOWQE6SSONMZLOcY2dSO9sjqpMJApCgNpaTvSbesAEQ6uRL6VWLdLh9IANVJ8l/u/+KailjUUAAgASQSlBRKY6dRIFNQktVqjDOIApxlFNGgNTyO7jVMY1WFTdRG51IRXOQ1vwNBssXUEWqYNJSKmm5V6AM8XuObQ7MoM72ITozyn/+tbl//tSxMqACmBbTkewzEFAHqu08Ip8ZZmj7QQAChpggawO6cDg4wKWpVFY4WEwM4hJSAoEOWhYVEArBeaE4cpHaxBiJhGplFgBtELxrTyhEdAQLxAOHqQEjVCayQPj4YFuHhc9j3b9ZELG2kC546VU97mqfigBNlYoVWm+tj/MC8JInsdhqJ9yOg7YpZOEdDD7cWpC7yAfUENQpQB3ViCgoyqgMNScZjwlIyhoVqTZWM07LuRHvrer3j1RKJXzvIRCt/8/v+LctxYREh1Q9ojpFGP/+1LE1wAKiIdlpiRpITmN6ZmDFZCqGpTRkwjbRn5L9bJMoilVwuakRJLk9pCi6m4e020rZV6XEduBh6B6frW6RJ8lESk83kIUMNDJik8qbHNS709spCyP/OcJnsX5cotmo3JusIoctKr9znP89hzqie8S16qEJrnKEsmdFQDAAykY5GFAOplkla+010HNh2MPXAcuY08lWJzOqCYNADHnnqenouIKwiFGXcfoRLP47ldIqrGe91OdlmUj372a72U5Wtv0SzY5k4YpTSxLsyWeF//7UsTjgApgbU1MPGHBa4poWYYZiFDtT5G0NDJBbSbwCmQMtcoQEFVbG20ZZa7DNn6ReRIpiCcXOgTMzV3LL00U1gh72WnFBKsIWJGd0UrvIYeWVP51ZG1X9/kkR1wrRLFa8hQTWI60dNf69tS6llQojMQuevfn62oBAmQm2y7S3Cuo+maLITjNk61KURIHMkRSzKlbsLZheDgGkKAiwEFxY2lQZCsw9scGStqxEKgcQnzIIGRjpUBn0/+s+CaK3vQpxkQLHGDMTiAYMBCTDB+X//tSxOqADEEpX+eMUWGJpSs08w4cSwgXKROT+5ooNFAkYkOl4hgBBIWxEyEJMSRjj0ksu6cuZsFAJVV2o+6bF5meoqkthYQMVLy1WaEuBtyx+XD0nwIj9O0naSqoUcUS9w7SLYG7rDtJocGJCKB8WzArlsrlY1aL5ihFUtKFylVUuqimfHqZ1YZs97pbMH8n4bdf/mb/WU70yP/Kw706z3oIHAwPAwPhmm5OMEo57hDBpbTuyO/825Ula2NBeJEKFsoS1ATTJRAQv6eg+mb5YNr/+1LE5gALPOdRrBhPIXYlqN2GCaH0CI2EcnNprD3qI1ZY+SqRUJEYqUu3BFVHLP+EjMxIaRQ0txIEQYjBm1eTYKm6HAY72t08uT1z+Z9hF/03Pv/vLuXm8cjueAea2KCILEDwMx6aBZH6zVJA4VSKSslE0qKQMoRUjERsJSZkQliNEQuKbV3NxGmma7CELGRCAYqxIyCRJ4DYRhYJ0PAZo1cbU9ksVy9wWmaXKv9P9/9xJmBYteYct/9KKkCSkQViaKlTLb0Ahawpi/haW0kpUP/7UsToAAv8P01MPGUCcyWpAbYOedVTx5tlGZwq0Vtn6kSjdW1VxNL84/3VRyoRIkjy2yyGkRSfWG7d3AqSY7VQz7JJQlK3JWoVy6IaedHGjOEtDNEutaSocEoID0KyCtBAHNK4UpzJW82aQMrcvV1DF3OQU6oWYkg7XkUSnui3a4x2k45oVNiIvTYxxN42kyQtqrcjls9ord6bb/bgN3brpgUhdap3KjFU/QRjibpI8l8GOaSdZlKzq5vgnjdxzG9u2pus27QlU3EcpTijLzi3//tSxMeADYlPVgwkbwFBiy58kKYMQpTTG//latuRqrltoXtSo6BcYUDrH6ZLfLGkCXFtLvlozTyIxrHKEVgkLx4t0U6Fhz2lLwgqbFA80lIGzc500A8EveG3jhZ4jurEVkWar68wStS4tdDQuJ2EiJQVaGiNEEgQEDmKCvr+pMJC7asc9p9iF3FUr+cqAIAEQDGSkXKgNmqWdtNN7grOQzFTRAbVMLg0hQIG9WA0E15lqgbw2tXyeBF6hgejwZGyDUzgpKfvw6PaKW/bUhKF6LD/+1LExwAKDH1lp6RowUmPbbzBioSLJFQvSIgzf/iriaklHAVIpSlep0mimtUgxcpj2koBYNh6Ml/tiIOZJYERrZKYz6KWTIZXn2TkDiRaQkSBIGnovArwQpFgR/0JxwqKvFB8ZfPIJf1bkvSr//fVAIDIHGEWNbAgQAly6S9WdpbHyBCA6rZXjVh2pxwFqx9z6eXUONNBrV9/vZi2MC5SSqL+zQ3XvXv5nhnhpnJ+1y3aqItHO70SmSZqGZlFzjyulpnbMS5UKzmiYHQIrxqowv/7UsTTgApU11+HjFShTo7phZShEPNRgLBQal3UECVMAKmi7LYTEg1nts6C0Dl2kz2JPlAcC0svvp90MgtPz97kde7O7jVBqQP/fJ2X8kULatq6eO2ZtzDWzrllxyMT1O/2moPFdymQrEPyipar9iHH1UJgzr55HD9iAMV+iA0LMkBy6IVA2vReXlQHGYUwgIUD0IowEYwHMKoTfGHqMoZHqt+8VP6lGVz6xz9fqRyMnvwL2QnY+ee+TG52Z4xk3XqizoVp+VHa9/z/t/zn+CcR//tSxN4CCchbTu0lCME/jCo1lg0obw//PyOpRwDADISH6x3RoQJTxhzFyuo06DI0AFUsblruwLO7suY2ekge3+VBJXvx5vN0RlDHVjteYWQjIDT3nSqNdUmtRaMR91Ts1Ee7Mi3KmvtkJ8tCNmn//pb6kHzM0CzrA+pCqiUQo7ZXyCE9ONTD7TaPSchFptQvi6qxzdmAQUwULgKNffxDdPuHWlaV90eOEJyNnJrPYTllTN+lur8S7sj77v1m7V7983+d0arzFupVEXT+hVWIiob/+1LE7IINHQlEzRi0wXMhKOWjFpiDw1ljoUovV1anrSuNyMyE/Nx4kn4SVWOm5Pq1R/CbEAoEYrFYrWyRG1C+oSLt5sLRlGMRiSMkDDkcs6ckz9t1CxWlFSDGw7cNyCrdzr6d/vdk07OnZvWrUbUX6/scOdg4IDGhBYngmqYq91UAwAAGVSqV3VVWmTkldAgiFR3emX4oYepo2/QVELYx+efJ80prQVc14VT5JqlgTpUE/Tp8HEhqdaFbWFPBewGaL9XojY6XOVnsFGOh0q7qYP/7UsTngAv5L0bNsGuJdicq9YEmvKiKysqp++Y3oM3JWAnRgif/TCAuLPof1jQGwqAiA223MaZDU8XUusJRIkHOhqC0XVJrPGiY2/tSh7E5SsbMZCggJWcztUuyb9gWDOKhQsaDSyQRivD5I9b3y7126l/2HzMkHQzVbHtFxdqM9coAIAENaqSpBCKiK5r+PucxJdBSV7uNMg4A6QApbSRPwNYUODXi1GOHn/nf51YtakTH8akUL6xMyBIYCI8ct4+ZVYcWlw3ejvqkR8m9blRX//tQxOaACy0zX4eNVTmbJew09In8WACDF7W2SAFWUufPtLXBPP3HADZOpYqvrLDi48ggBJQ08CE5T9GcGkcB5K21+j3jbeC7q2iI6l21mauiiAcCU7IxGkgGnsL1kniobeK8qrehVZ8QjRGPK564WWx8G7VCyFGM5r31NWF9/92jjm5gK5WlhNraAJ6DLgi1oguqnzkDnlUf12RQ0QrwZ7sSSiwzw0y/aB5AAppmbyXd2+B/dgh7Fa03IIDfltBnGZvt/Nf+vNsNlcoV8KvFCf/7UsTjgA0Ym1DMvFEBTo/rdPYJIDE+a9q73+jP0SkQQJsdSZRE21DjKKB4FOKJA1rZ1CysisahiuAs4b6iBAz0lA6woKCpPq+VDIwnqhJq5sKI0rtpF2kC6mFkuaSWTA7Xgqw5decD7gO5AstpzSz2p45b6maGtyrySwudlS74Y6up3BZx3G6Ro8whpJuLqMmlMWiNAqNrwWFGhCIIlqVc4jAbqG0OcUlmy0Wg4rDm/MpDVjrhom2xkgVWkRu25aWrGrQsXDkgrPmmCirm/Tq6//tSxOMACfSvSqykasGTEqr1h6EUf+kGBHVMOKUJEIYaSNBhlh5wuoCIs7hT4xVtaCPqDOjOYUxZA0ojJR4TjeZOZPyUlNOaAcZqc2xNItiXzNu6ZPXNarZfSkpLif8prjJExZ/YyJAoNDjT25lqhApYcxEqAAQIJQuNWTCUbWMeCMrMYki4CZpay9oVSOQ/VyIpm5SPKks0mNa9vOfraYJCrjsLr8lFvvif/tc3PUgqrr9cyuSbZZ6MZUyfW8yy8yP/urW/4tup/lzPz7bJYYb/+1LE5oALxG1jp7BpaX+OqZmXpRjPt711XZgAEBGPIOIlIBRou1YLyJexyEQSa97kLUEQWj5lCD0oKyySaMPFxGredXYYgdCATVufo2aBwCKvaETHFXhykdV2Iib55Ly5Q/eaGZkKKlZ68isQWgmWMigSQt9KkrDU39qKABAISo2reI4ELX+LmKpsvo1nngIWZcbCN2YR3Jq5Kemp6WKBsyyjV6nWQYFKJyIFCI12bha0jprM5P+f58tvWYi5nS/S5Ny/kbeqWw4hhGKkEy6tKf/7UsTlg4qgeUgMvTDBdJpoSaMOIBqlctPXY+ykBIvg3I5eC3ZQYkMg0RBO0/rwHbgCho0Ap4R4yuEy18XH6uQZcYvP3vdHm7r7X28nsxh3LZD6z7M4nl5XU3SFqSz5cuwFecYVXfb2OrMUr3oD9Xb9nqmsyZX1PuvDygAwAEolI0VAVDNeHUHkLnHbYvoYqapo9sUhmV593CCYBc/UuQu5POd3aD4au0NndX7MmeVW33e/jI8rKvhmfN0n+ThnMJFZ4DEzlMe3Ea80RFdZn//5//tSxOoADEE1QyxsZcGCHmm1lg0sXI0m8lP1b/0ASBgOx2KViIh4c1WglEm2VDAqfrbiikuSoxJMlQhc0t25fD7DpUgjqUqHj2RTVGqozTP5YTymgw8YMhH/Zf12frNaBZ7PKo3hc3JjXJ7p+8SJf/tZ6peJCQxjYGuu2G2pd6khuOEM00wHjchuZP8Z+N719e+IlPrO6ZtXOa4g6tr//H3v0vS3o5t8+7Whb+JIPz6///////+Jfer38f8Eey4FJqV202MNSbMQsiueHgIEyuT/+1LE5oALmQFLjKRuoXgRKWmWGRlOjHVSl22xXj6M084lSRcFz/rxtW+zP7vhi7/25d3m5mn3jnEzRQFg6bcFziQvLg/lD9yi6JBUo44JGCAQ5SH3tBC7/1//9ImIQTuh2ndlz93I+ABwJUlQEKDjBwQoStjMGqH9lbRFfKYYm/ujLzl7TRhwl+brs5kzK063oMeFHoLgnB9DU7IAoU2ofHxWlRjcpsjd8bbXtRbPt+3zSs5kNH9b4a+m0iRNGB69ujfJM2yxNTRmCZZ5nSNNJ//7UsTnAAvEi021owAqki3rdzDwAYlmg5D2FcZ2UhO8yLhsvPOw058pbaUibXvtt+81JCMqU/XxB0ywjSXj1iB4rPAsVFetbm5XbFX/6wHeYQnFV6zDevYNvjYcE2kHmVltqkSFA1uiEcehkHg8h3JyTFh8UZIBepNqjHOI2nK/RACIWKApI8wAsEIBCgHZjNAnc9ilSIpZWTRHFxZFiP+VIij1HlkUS3ju/VVqZIoAMGmyfiq7qsXa3Db+X3xpwciHRWShYqzeEyJgJI8ukjic//tSxMOACsSDZ5zzACGtpurVgRlw5pmShGRrsqGlI92PcH2ZFZFIJdqpo5eXdGKnff395RWKNZbS+UTOzpZQ6iDVnxU5kdSf3a9G220mW4QCdaBGSuJqafwDGYMITYiOnXqjjeL16gluNw1Gqah067X2q61qI4EU5Jy6s2dns9NDn2VEWabmt/6m/r7f/Oza/0detCxUt/o5yroW7eoDFQN2RY1ZcaNbtFYixF7KR0YBERZDDj3P7KMAkgNWsot8w7cYox/U5lqynd2m+uahCBz/+1LEwIAKAIFt5hhswUqJrTzDDZQ3/9N0ujnTkMVEPZKvWbY/t2stG/8z56///84nF7v+1iNngix6qwAJJcC5gaPHgiPTvjQFnLTnoC0RlKT0iEzsQ8TPQ5qS08Nr/J3sanrm6Mpzs+5+pUPADTD7/109d3PY4tR3oxv6ntZDm/PZer21o76//+lD2MIXfr1yX9ihVFUAMCt3WIySKA4ULSjIWGyhWQg6HHxRlb07jLNuFWFStHjk3wcTzES57c+3e1KMPAWd0/2sXR4eZN8KWP/7UsTNAgrY41eMJKkBUSeq9YSpKLGzP0bIDFmtkm0IFj5UUDxp//oCf9vtf07KjIGfAGkCaJPpmwsy6L/Q2bkZflhyzbdPEn0m6Rxo9NnqF77/iYprZ+eLubvd1NOD+G8tlDd9k99dV0+lbUWtgz+v9/VW6TdfT/fo9sWUToUABaJaEQLbKmQcBxSJCP7BF8Dujfs7bUlZ5FGQNemS96nuvHuI7X3rMettEJgXQFDSI41nujNZ191Of65rd7ZqLt2p3b9+tW0/f7afYxS07fP6//tSxNWACyE7XewZTWFop2llpKlogI0BJeIf/2RqcOkQagKJgSIyKCa4HYyyW6MWLfrFjTl62R/2Vr2b//B05nX/sv05N8+gQ1jf/5nN9eSBnYgICsCSPUcqyAnIzzP+kWpf/7FSSJCD0b+7EiEZ8Ygwywk5maPbVNgBBcD23+0jSKwFxYfgQMC+IBwB1SYo3l/XXox4THFZA4w/chD3Qmtnpnu1dgoDmVnQh53vmeb23l9FZlujI3dkWSnb/S7ff6f76Vudr/Q9dyrMU6C5aLz/+1LE2YAKxMtXp5x0wTmn6NWVifBBnzLH4PP+2JIBHo6DAjEQUiRJBAIIuFeIDyYDCVlNSq5tixgTWsYoEvlUqHSwpnTChcE5FCNgkWy9GdDJiXzI3M0L4cX9Trgo0sbJF0dyEP5nNBxjKP05igGO99sS4YMwGJjqyubAeT6W3z7w959bwqZ9Nb3vGLZ16//53nOM2xrW86+64rj+u/jGfnO8b+KfOq69a6p3to39PrGP/8f/T++L7/z///tsQqM87SoRAYLoV0waeemklUNAkf/7UsTlAApJP0ksmUtBlivr/MCPnL4NKafL5qI2IhLbiCILoIgePisudlSZWeXfnTXJ2mOz9L2y22xq4fRh1BBow4wQAM+OPnFCMit+GHVOQ4pid7/a7N+un3pBkNLwsSqT+JzEOWCuB7UEqnui5FCx4r2//0MAU3imcKzCb4OPRY5QGRhBAeFCfNyU0uIeEh+rgi4lBCFP2CorEZQRhz0mgIBHJwTn7kVKaGNSf///yFVJUOqyNEAAqBkERpJQ7GAyCYJo09SUuezHQG7MgEHd//tSxOcAC8V7X7TCgCqUMGo3MPABYescgRA0DyDqzIlARMKne2MM6d4K3OOwV3laRrWEQUDu+lBLlaX85PJ5piHhUjFTXMepQBgVuu4RGw20Y5k0NJWqAzQUbYiXzKlUQ+Wz0c1C4QGXMD9PKSY2JbBVDlN/f1qCxbdYoi8O2MBLEZwAkqD3WCpEDbadbG+HXJr3LGP1oUqN+3UqACFBQSAAEIoo/pgIGs3oodlpiY2FZUaHG2nCWm7YJKJCyomJWGqUm7WJo/VyGBUHXiUyXGj/+1LEwwAKiHdUvYYAAVefawDzDVg+OLAYe1g5ahzRd7WYoPofE1UzadHdw77vqR3HwAxU4kmQSU4qRpzTkw1jvbFoDKDvMYDcuDDD9MVS1dZeDL0HqlbIarIZXZ9dry6AgtVdQzmzImvDVLLHPw0X3CZmGTrdnUdmjYlOJ25K43c6BKAIgyZVCAFuX/U/Dim5rYjwBcfK4tO+XkaGFSutbIDctXSQdFcurxpTcXV3GgYFR8HYAFQrWLp1rLpiIqAjaPuZpbsd3b//9tAAQZsV+f/7UsTLgApMS2GlsGFBSw7rMPMWEEC0ig5UgBlrLrjMxwALdMnblSoh09y/GWCGBwzQNTPKhyU2+TU9re2XSdNd63ubDLe+CIDVtqpjr51DPnIt/+3vefcr/dj8o0P+FC/bPIzJe0zpuhPRw+HmPMQVyUiJ3/0GKFUAJwc0h1tikawD7ViuF6XZuO4SQAnjE9jB3oOE/sgVW/Z49nOsYcnZasfZykykY1NNrnht0+dd3s9Vfnmz5qV9LP3To6Xc1+d9WV/0ZZm5s8kOeyXITGsH//tSxNaACih1T4wkqMFCDqp1hhUgCh/FwABggOXDI5OdEzCjCVSGaC47jgeUMNZVQqlHj38ldIrsKHjgAwdqD0/xFLIr7eea21XjZ6+QcDIrXJKpqUNMV2RDLKrIyJQ367MqTNSyKisn9dkkZ1rHDQ5SkMARxl2qtQChBNIiSkTAFBMGamDpsre1yH8BMnGeaNL4avnKImzZQdFh4ZV2OtrqEtolbv0h1v69l0KhAa6N7qphvbc+qO9jOezfvuulTLa02VEVFN7pt7siz1oWtK//+1LE44AJPH1IrLEI0aMkqbGVjfQ7iPWcb0BTgrlttkcSYM6EiSHk96LLNJ9El6HstardKRlLLQrYfg9OZwoynthd9mryWg+HMr56txQJED7nT8e1NWfqWzlMFRgTnCsiPM+jN6L+TTbfd87yIxxBUqLHi1JtfX0ksQxqtuIkFoMkpQkkMl2expk4eqJQHt/heD3fca6k0VdV0/67be8sYcs5U0PHKNnb98iodtg8DcqEw4Yyc3ZL2K+jizMQbhTQD0gTe435/Eb2ZdYqoueJkP/7UsToAAtpN1nnjVKhgR+oZZMp6O73MnAAAHLfpbbFK0uCwCs69PL0EwsBTNdTvxJnCsDl2oBSLeeMw0uR5Vjy6KRxvWCO3ImuZ2lKF0WZ1XAobfcpEYHCdqGidt5Vew/sIpWZBFfAkNVzFSoOkLcZZI0pB4OT4hvSstzr1Yo6deMU6V99NUJ75//u2RDgMIjlQii7BYJLKnNhDQsAMdEiM6+83DA4J4Eg2Yp6N1LcyMBpiHQ/K2ikhRlW2uc1BCtcTr3lh7UzqcDgIhonXn6+//tSxOgAC70rUawhT2l0pO109YovV0162X2du3i70pA8LbE8TOIAYcEGcIcmkQJhkInweBGUGv//859AKQdjZISCk/YgP0UJKJzL6V/aZumaQ4K0DRJAEFi9RRmqyfM+dl5mWpLuZ/omupUcylT799DFy+iG1XtbZv/01d/18+e3V1ZhCAkGqZL1j/r9KADRJFmPQDmLGAdSwx+H2vulZVvuEK0RZVZZGtqltuUiKpLzPI4j2zRVvssMVLP69lVyGoydOytkstVd2o6cne3ZJqv/+1LE6IALmJ9hp7Bt8hEmbHWGFuS+qNTpWerhxJJpPR+b7faAEC1EppFMzjDQEmZGmqzqZg6MoQRkrIuZOauL5WQRTOOuuPGWgyPaaqyq5/53IDLLJ0DoFkLKtTs8dHscS26gk3UYl1TVLAgW/5PRVq4mdjUAMSaNxONJPHw5grUu5toVYee2XihUUvwTXldqJwVhK7EgoY/SwKpEFyEbmceF0r9AEMmtl9tm1K9V8yPWzys9UaiemyVdjSuuyEs6TQ2nYu23/X+yL3nnWroDXv/7UsTWAAtUrVqtMMnBSaXstaMJOM7BMK+FPZ8MAICGIpVJZqf0JAzalA2d+6jxiBsUjmcQn4w4wKnkHC2X8olTbNWRLyf/jDa+uarYNyURQeHWifeKAIYLoKMZ2SNrUaoyosdUD9wss+LutahKXtHGHLAhuxUqjrUA1gmM56EBtKt9kr78XngoFM3wnBp2p021a1gugPwdCMdISAjJxIYEImw8bquILRULJYaBlElIhqpbbMWZr5zF6XkbZS2RMhbo769EVEZbuyGOUekchQLq//tSxN2ACkUnYY0kqSFCkGrxxKEQPHmsdVaQS3agKQXawpbWIvGKmJxQcuAMyiOlgb4QoCMw7eMJn2YjM8XlJy9+TxhyzbcNc/R3MdfsE4EX7iPnZZ0qpvoadmjNyzPK9tsV5Amtbk1KESERwY3WVLQoKJg0hLpC6YuVAwoAe+LOb0yI4ZMWpUGvsniYOEWciESgcgIoFwjzVkIkNRyC0nSuMamm7lLG2OPNTWrOwaq9NtKqezJP1ZKZZ3Y+um8y2/XXe6fpXvrfWqTigZErRef/+1LE6gAMeW9ZrQxPiW8O6rG8ICjc43xDWvV+4AQK/KF3RsqGdI1N0l1v9k8D1JHX6GllcHWa9pwQ+SCVWNZp3vZuSRlVd+7dTtx4PA6JOfdWlFRzettbsd1kdKt6LX7Nbnt/vNZpSOrui5QgIg6Ma9C0u21Vd9nQCuFv37m2sLwq2Lrtamq5prdXjWXUh21AeGFqOSMycfPrLSxqN2c6bXVMldteqzlroZfFg3Mc3LI2MY2tVKqldWyTuf7K9y1/+zFb9Tu8lXq+Z7TkBMMF2f/7UsToAAwZD1CuJKuBchPsNaYgfGm0WdF31YuQ3pClMltrcrbJYf1jTMkwU8PpXHJBRGjthw7MaFaZPEotfCFR2qO7YJJNRJSZfjHsOBHerrfVbFMuKVug4HyCn0ABgLDA4SSpws7WxZEDkxoJjSYqCYd/9PqqANGu+9ltsKwGEvKsIScMMvLIVz5PLEiWarvzwBwOyBLD6JoRSVOQg0pM47PbMb0F7PZbBOS8+VS8TDSpoApgmJRxUeHREdla3othGTVbEoqMWtIHNH//k0FQ//tSxOcAC7ElTy2lSYFxpGt1lAn0oTkV6TlCLQCgAbM5ZGQoJXfLJ03k65UmXTEIclny+Vz+coQrfhAWDhwNGWv0cdeSnhh3KlJK7VWii8UaXEmSMTbhDrFF1s8b2B3cp4wyNhrfuQxN9pa79+YfuITtukr1t6npZXuXaa9T5CwBxZC7Kln9uhKuU/U6Mx3Z9N3mf1iFFkIUAH7C69snpPSw4ANC373zM2KIQeTBEUzKjvsf/tm54lOrMROQOSWTs6QjWpVsu8QiVsUlQxz+M5T/+1LE6AAMMStfrCxPoV8QrXTxMl7sIPopTbUWVCYKdW1ymoq7blHok2djCgRqKQWNHOISE6g2BU6G2qlHSDW/NE8hvmKXvRKefBoJjCZs29YQCV76MBiLKNsQ1EDo2fbiD7XkKzLa8iSxEhmjJQqzW3Hnov2R+e8hof0VGLIahctbRX3dQ20EExRFMdJJCGfdoyLYyAdI7qJpk9tOIxkykHJ7NZp4ePWVj5vh27fcIOBAeGERUnQHVjae6bT1e99pD00BQ3SNcAq4szE5owpIif/7UsTpAAwgd12nma8ihDGrdYEb1UalQ9dxl6O+piPHjT1i01R7GSG4jIyZQfjk1dmciJaFATM/4cJVU62cT5JmhQRwIg2LC7HUHRr0g0wmfAhAouyz5dFQto99qACxdZHIADhIIo4IAxdGbwlWbq2vWxUOqRuz2fm7fLhBE2iZjlslI0E1VwylmiAeXsq/mH5U5kxeV1E5rPz//mO4RJIVqRX2JV6kDr9mtQBBLYlXAlhAyWKMUo6bIxHiyw2iM8sinzcrcAEB+uu5Jincukmv//tSxMYCCoh5UAw8awG1oupU9JkYGbXOfxfQMp1RKNF2irulaqktc0hRa1w6v2q8VEYKhgILmF/+e9KWt6wATA0hCJGMkgsTs44whSRWznTgslSt2MA6RB6u4vHBNIYKcCgb26SNPzuNkf/IAwUJgIE7Drx+oTkzBl5GzRXbUn7AA5VpMkYd/9n94s3UARCjcLUJCAZWHGLaHAdRxKxxEzNJw2wsx/PKLSQ0qLezzb7uCmWZ2crI9piM+7utWEOyN+tPJ3RDFK/Sv26N120TP///+1LEwwAKwN1hh4RzQTYkq7DAjriWyG921ijNyP/ZR8N54yBn/5aaKAg4ZlTjJcMCtSuH1iv6yiWvAiluaxLKb0es3do5qqruYouuyl/rgwx3IZTIi1ZPbJdVRFR0/0///2f/19aTNKHQS70f9i6besEmGl0AMRSNX9QYnwmoki0HMjT8L8JE1J91SOZUh/vr0nZy40GxE3I+mNz6tamke2mIle6cCMFCidv3+s1GdcVQOsiklcy0sz/+yeRUf7f7mKHxFlFEHhYbM7vupFUPs//7UsTPAAnYe1eHjM9BPI9q/PYNEN6VECLBYAJjh4lVv310VO9GM5rkeqDvQgo4CpR8aGMGG2lycZVQzGpBOuPAhumTOKM7Pvc/dD2BgqpInrsntzVViiFbGTDD77HzPWn6Up+Rst6ICSRA5YLL/+mgpV/JNLoExe+2zW61mDJQttQocb1MKg6IKpjt0Ywkip2wUoBnanzIPSKJkOQxy2uy0u7591th2xzxKFv219ea+rq8HEEQcg0PjkKznzNZKMifvz9P0r02OjCh1QLMKIQX//tSxN4ACk0lU6eYTsFFJKpphgkoc1/6jJgV7flFpSBk7hUEAOAyxJQSohcdSsRcoyiNbQqkgCLbvMkm9qZGJIFmdFRDNrt8iAD+SWn36bKdTIZEHfRtv0//9/dafud5zmKohWHKaU3Q53VFP/eS3IoAsR2MF+8RAJuTDkHTjI89C9kZ74/E4+OZzYDjaOoaCQmjCL7fix3VWMWeep4+MjSREmetCuHkSGBxBYdnFh2xdFj5q64eYz6j3gk2HMaBRIvur42qKn9KiubRB9HHEkD/+1LE6gAMMSVRh6CxQWyf6/zxqiC8h8FiQ4GpDCCFROvSTIG1vqd2gQRnIACEcRAcdVsbhIDoESQCZ0OxYQy4uAEDxOJZPPxQPikCZOERgmunDgmT6Hp/savQ9R1J+IWLmdf1IyKN8nDQcGN+1v3hBCocDfS00oGLQOcJLXCGByhggKOPoYAzasho/8MFC4LAg5vuRVca5UaCYJgOWU79yiPCEbyqmRLWcJZNwEWUMmtLmWDQRlqTaBUChTJa7tOLEopOOTPKRYQyVz2/bowSI//7UsTpgAytK1unmK+BRKVqZPSJIBdpbtQ624XICACUhyDyEpth0K4UIRmpeX/9UvpISBFDvE3QGOaAFDgbizJFDjj5BNzHfsQ2Xqc1n0yyMIlIbpbL6ebKdJ0HSFaf4GSkzhUHhWuVZwNEw6SrrE+JayjGxmiCvKwSQzBSVBdjxYg4iDriXsPKQIh50Gkxj2lRgdEq1PRs/lj09kfxE91SjgEAAhJJQcloqAcTheqpTKp+oFtYPhgc1chpJdMoVkeIiIlQkjA0KrZtqtQmAbCC//tSxOwADxUpVYw9A4GcFKz0x44gxQcs+hiEAsVZdFCcL4qD7JP/sA6/+XUn6C/7Je3YI/6hkAAABlSygHMsltihph2RBxBiRzok0Oy2kG6tI1rrCe7MVQIN+tVit7Z2+U4hpa6MsyYvfzl97ID/ehQxrMjC2vysJNBxDBRSsdzxs8/IFUBkitQNCfamlcaLK26Va3dXI9NColMoN776jLiwIIP1aRbInVczLS0pke2qqExMmaDkOErLqUCf2G+6yQ85D+hI0FafGT+l5vAnFob/+1LE2gAOtOdnTBh4AUgMb7D0jO6bPXg2GkDQoJn/OinulqVPVYZ/9T0A4CAHrXiDoYX8XJQOR+PjSS90SGV01RCwk46y1sVRNjBSJyKzaNHo6q3OHaBAZmJA7hK71vaSLGh6dzJFAumbkiIFoCsgKOKuRDrUuJtGXfzub1oBMWRsl1LYggzWggCS8glcFz1cH5ENz8iBCqNFyJnLNbGiq1diZte/b8eBBQ9jZi6ejBNFwMHii1OIx244x1pOscoJBRT+8uYcPiMkqirsYo8Bgf/7UsTUAAoQUWNHvScBiaDr5PYMuFITcSUoiFKmWiwF3Sh9Iioo+xAKgZnS9+IlpkiyFZZ56onmD1MTEhxGSlTXJymCxB0RyUSialKrotTW0ahKuvpsqade9tM813d6Mz3/qkaJLc6lfi6J8Zd6/mIBUpNIBtpFKiRKwgyNEucKvMVHoW5kpNZiUzxpSACB0jLQLhrfPNfJ0pK71pzYfzteewRWP6f/PksXx6uUZy+mSC9iK8pkxEs4pdvw50iCflvU3ia9cj5kY+ZCjwh5nFgD//tSxNiACcyrYYeMUUFND2sk9I1YsvW5mN3rQAGCYSgkigFAzwrSWAvxM3EKhWBExK6o2MkqUd3nAiWgqcxJVNFwPZaayuPVo5q1885gVnoJNYhhFQaKpBiBgKLhpoCdq1Qy9z3vGy1mx1LwrPPEqEpvreKqDE8m7ff1VQAwYwQAmSCoB1P4R8Xwua1KiiYPk+uaNiueRWzrEdkFMx7NmHElbp5fkZJSWlGcBAchmHTuqOvojtoikOZ1oqblmKR6bdu69jrPFEX8IzmDz0vH9Kf/+1LE5YAKJHVbhhhsYXKlKmmGFSCTY0V85s/YTKJbZE7G051gl6pF4XcUsvcgJyOiQF0ZvR40RLtqrSPIhD1zmQUn0MyelVhpIsZGIcY2bAT7FGksQOgQeySeLlfkgEMLAZVKDMPtorJpMwIZCLye6ZKq5dqmFBAlqnpVAAQEKJBcacpASHJOCuMxHjooOiJZjAE7Q4OMiMZCigIMTB6yLaMgz2n//8e9e/jv7/cCUncfPm0mXbZdZiTWDhUAnzazVzerwwLkB6cKJe4b6YYbQP/7UsTsgAz1KVenmG+hfg6qdPYgpOiHMXf/cXeYJGhiIRG0IoOiY2QPTOZmFdSNUBzAEQRLlBICuYm5MOR6TLShVPFV00z7Q9guJ7SV6IeTWxiydvLmybha6jzk07oIto/zX5H8MQvEggBrtS8yAyaO7SZY04x5S02iMIGu7PXJ2//Q1QAlACJWzBYyMPxUyoIQwMiwASCYc+7MYS5EMRWIbSJnIh6yHOvbNyZc3fCWU9I53X1TRxxpjSdYdNKAFoxYUvR+2ipz2hOK9/djihtr//tSxOaAC3z5VaeMsSF9juv09Izs9nCp1e4FutyS/dNbZwO8qOHRiERPPSyIaMR3Daiupi2TDhpBUklGUiOuHcELhJw//8jcIKGKOIQIBdjRtQwRjCaGEnK2FQkg60XEwuC4LCcAloPGT9B4iB6lrQaYZZPCxZKsV2fWA0glRmdprLHJzO0EzoJXYxFngWByQucNR1VZAuPlqo9OWHHYXIyyAnLMJMQK2n3ZnaEaVKuzKzozc0jUItiNmqenz+7FX1c+yUYYOnKnDlbHKeqeTtb/+1LE5oALhJtXrDDGwZ2QaYHMsLBStCTS14vSjlwHA1pa5ESVMYvSAAGXE8iQSxzRjS00TqFqMrCKmkKJmBdECH9xdaU+JkIpXYSMzJwJtKqkbLcdC5KvprtUqpWtYwgKjgiSZrODVhNLFVmLsjHnVse6RdsUumoAsR91ltpAqnF2hjUTEY3PBGbLkJwVBpbWLycZ5YvvTHP1yyf2KFTff9zen1NwQIoL0eL764pFsdc28XXbQ80/6X/E+/o9/3//zzFO9ofeqS6XP5N7VBhiBv/7UsTigApAdVMuGE1Bg46tcZYMdhQu4LT/bqAEU2WVZHWm3Lx/BoTiv0uOMhSYjt5DOmR3hJI7H+BRxDPYrfNKrGJdrjcWXPQMOHgkS+dUFTt6nDHKSkCoIgFXfHAmFRwqMSwq4YnxebHPjQyFXHkEWgcEV0uXCIGRXQAgziy1oXngqBMAKxsgX/AzbQW4Nx/IEfyR3qR05qp+pcNiAZ9YRSNTQXqh2bGkP01gQhRSm6/7oVyI77vZCsrpbff/t97D0QWEh8M1t7lwUnrnaCDe//tSxOcAC9j5Y+ywRaFmCqu1thhsvzFGd/+/0AMSVEhyoksHFQK00iGKke0F5dnZFLmSAEMebm3HChMZgnfkm0vN3QtHSKwoZRTaJV7XF3Z4Rh4hgqPdyHX6ie4zWSBU4KmAARMDBZTnkFOY4yaOwkxy/oWuERUg1TtaFQAjDlC1Y0k2d3QXSbDZU/J3zgWCaeIO82CxnDUPTRJYjKUrHRSTmB/BzJmmXr6W0CNkFscKhGiXA+v8kLnzudMy+zqKZbQ0O/2Q88muU0fYDFIsERT/+1LE6IAL8QNdrTEBoXyKbD2WIKRp2/mq+pb6v1hKSu7RyRtJgK1ZLchZjRCwIaOBg6BPg+rvD5kWTaSyoIcw5aUeae8m1GhF0YcOfuKmG0LCgRLN6c8G/vStPOnkhm6q26r98p8t3vKXx6WKj4TFX4rfRWQo6AASgUKbz2R9GExAJLtkw8zN73/L10kAPs648C5CSfooi8OQX05hBz8aiQla5ijtmUvQOv4yqiIaiDAGK9nolHaoozO1WnZDEHnQrM1ERF/9N/JYY40SQH1tCf/7UsTnAAuQ/1ONjLEpfxNqdbegdFHvKsIp05l9u0BF0g2ZldlkSnHkz7zwzCsnQfdUsOjQKS+MMVJCwShbCnKOAruABXOWYvCaUkIt3Ofhwz2nNPh00J/vadScueWfCc88v0T/9P8/+n5n9f///riCJwM0r17Q4GBj4QAEFXRKAKcKu8c6e5pwQlPCABH0W9IqAUAACBTTSKgDeRYjBOVurtSD2YGBxKuU3B6DwbzQcWpwG0S8sFFyQtjB4gEZGWZRr6IBwVrpHSyE1EnEgMTo//tSxOaAC7T5Va0gb6Flnq009A4uSL6kxd2TqFR+VWSBRCAceckw0byKzpQpMSI2CeiNZxycOZhN73vqDI22Z99vH/d9/j9m73bcgqmx0pP19kxAqazyMZW1/ZjYfucwxBTROl6ulIF9BOQN+waYEAEAwKhrkU/WFOIYooibUx/RE+fhKhprKPf3nO2LKMoTsfRlGA3AHAHBWgpCIHZ8nyZPHL/x6JGRMns61INz9BQXHuH4gQC4ovUcNlrfTGMM9rLN4qQExaTO9SBUfMlA+i//+1LE6QAMaPdFLbCtQcuyq72GDR0Ic1UhtqJIAEAEGNNhxskG5rqNmj4pS11zoqBfRWK5mjzhRJpDNXxi3FyzMVg+LSBYDSKMvuxqoqXXVlM61LQz1lYUGHNWpnWjlQ1XS9HW+ndn6///61/PrKnolD/0zh2eLLSUucK0gEmwCgBEo8mSNaNAg8GFTjlVBgDli82KfkwnJh+mF9uH2ud+2N/WRGcjP8sr/xLE85/Ha6dM4JViJ5dEQumIlEwGYtDrC4bhZaVvo0vYPI33jXNyBP/7UMTbgBLhe1OnpNHJmZUrJYegOEXX2C5AAbgCAADEWOJ1mILxaUODnyMjG84lIaaBMVJIrRUmbQoU8YCrAZWCtynvHrY8o1iL4KgYHX2FyJIQBRDyJ1BKrpteiIdf09INZxycFBIIW1nTpoNGkuQgAAIORLUjSuHTSZWY4MgEQpxJMhvM0nWmwYOLMLPIpIkBdS11nrEXByhRWvMX5/24SVcLWWoatA4RDawEFd7jFvzDD4LUrXvFGmKXgJe6Yc711QkEz44pFEnK0SKw87X/+1LEugAMhWVfrCRJwWMTayWWDSgCQlZAHKwCMOtN9cGw0DoTW2YHfItZ0zUSlKxQwzNR7+SgnrhRrNjGF1D2Unt7LqLMUtULsM1ouRdh3Xt+klfmL6Ctep4BBIpYJKRJUac2qEhZzP2xiEQ7w1JRsolZx8MTMfSjFUCGUxOSrRpom0MuU2RcaErGKVIgrKGx61jSIxlIkB0UXzFDniZNeYP+YvvUqgI8Nw9sUdjGq8s9AATFaKSiSco6DDKyUvnDig6Gc5ib8FslgVqReJaWqP/7UsS5gAr4N1dH5SDBRY/q8ZSNYFb14l3mmJzcmlgQdBUyF0XsAIPgcyQaR6g+JXg0zxZfbSeyhRweMpFRQ3QR9uZQ5h7a1S/0fQBAYdK2o0yoHZfORMocBr6bofAEIzUWroggD4hHrjukNXa/93a5M04gSgAuuqcgyvDqxUNX0+10yoHggTgcuFxwq+1OfShE8kEUkjZ5D70D3UXNFCXF1QAERWyioSCwtBx0zWCQFDa2DYEQSkbq7cEQMkGKp/GVSNlnd4YJszsNyJcra2tI//tSxMKACjxnXawkawFfiCp1lg0QvRQIWC4hF/5TyU+doPpHextDP6f/e/3z7kVvcYqBGX2do6WkQ2LiWxoBFhzsTccTgY1FHmnnKlMBDR2mw7F2/z95XbmJ/5jGYppbnsE7GRxlkphlp7GffKbEBQex55czcytP/Td5GK3Ukzc//z8l3YrsDc2HQLdvXbgNdlYqRQcVcnfw4SMvDYhSF1YziDqXzASWcH4lGAfFC4FYa6rxLawq+k4UAarQydCRCbAAeLTrQCEiyBO0Si4PPX//+1LEy4AKrFNVrLBqgVeVazWGCPT9k6HXpEtwuOtQk2HhoYEblmosmkglhQOFRYVIGBHrPAAs9jJN1sC7KCZvl6TctwRh8tOx8lZOW1+YnlcC6wGr7BkqwR0PK8UZjUsrCupfEnt6oX+PVhl35P1Lv/U5ve41s8YVMd7V1UmHHXZf+2DhKdCjIPM/lwXFGTDXZ7viXKAtjQSbIdjQ2PEWUF8qEu4shUseXcO03ZMOhijwSW367nRKG9fRHDQ71omTSrav/6fN/NfNfz2NeUSy7//7UsTTgAr8+1WsMGdhVB8rNYGKdMIVe/V9j1DuCnreh45QEgmJRqNRJtxORxuNCNVvHBlIKqzWhEkT7Kew3XM5+aKF0cA1Bunciq5bi9x15HJaSz+NNSs6sZpavJ7UrWIXN4aqmalqTT62q31hwj0vHrezykXclIW9fq9jZI9ItoOf/853/r4xn4/z9Z+LfdsZvTFc//P/+8Utfw/EsrPXG61g6/t///////2RqVjJAeRN3pHoJymgiuilrFtaqtHTBHGuaxLi2Is6y5oBZi5b//tSxNsACkhLZYewyLFLn+hBpg2gl09upQ0LtLAoKpGKSeYpcRnRcyDLnJeiCQFDT3bSjVCUY8iGF7H1q+9vQ11bGOFxrnGpAhOEzAgBFpZK0+vxZppFT3Vyu19oDGiRf04zseFhwlZr63L7RZQ1F2eUapqRNRbgZEEGTr+bkTRNiY8lspcmWaG6+KxV0qiZnYrY8QpQek+nt6aU9NLA6RsVkOulRADl913lrcw8h6qHBsmnAAogIChvT0vDQtAilL5gqGThwEmadpiRce+EBRP/+1LE5gAMOP1nlPQAOmMurXce8AOwbeRZvnyobUNYLlgussMegl8iPNCRYJrFJ7F9CTl4RaoNuJhIHwFIdlFjMAlWn9zjINPxTH9E2lmYl4TEjiqrPjd7N3zk/h/pHx/WN8M01sxL6vDp9ZCAlJkT5rKMZI2IPNkhKQxmWgBsE9KZVkj+cvy79dy/r3s/BMXWOMLgSXQ58L7Wzq00cwd3lZ/1kcfGgohiV1JUbFQQ8lUJsJTxrYwhazsJpOcqtSU+nnCrZm/VXVjqxsGRU9lJ5f/7UsTGgAqQQ2888YAxQRJqiaMN0PoHFkIQtKKOg8aKzIl9F73YgivBV1Y0Vc4pfExt60OSAUAR0BnBRWEBMzkSuTc+AasOPdayuOTfjf3Jdjhy63XxzD9NTr60kfyPn9uypEhHaMt9N3lVKUa1QdhYOlgmzapCEpETiVzUHWN61tdQxS9/6tOhCQAczjkiJShh7PQ6H59pgIQSeVB6DRKuWr86uT7YaJvTuE6ZJHalL+RfTgCdYCYTCYqbFEiQOix+JZkVBU2vImPJnZFCYbDn//tSxNIACtRVa6YYbKFwq6z08Is0s2ZVljcnkWJZUDwL5rJpWipWi23Zbi8CaEkCBDY7qsWJacBFwsytdQqx+HcUKjm3ERDMgQ4pz4R5vJDUIOAA+ViEdPJPDVB19JlS2WD6A2N4+dysc7pKg04RBpbhnbqETyftAAXABQICAQs0YiEF212OcIAEeAzmwRHlvIZgDN0jAN8km5SjagYVz0hmNG5pKxvB62VX1a3FcImZpM0vEsmQ8lbOXufqqf1iKo3r5VRiPMaqm+/85oV71fj/+1LE1oAKnIFv5iBQoU+XKdWRlmBb+VQUemN3IBAEAA0EhuEqAcUdsmBInnFmnANzk2zIQNqzY1olXlikOOEsP/Mh+tZG/QnSpxa/n65MLhDEIQuh73Tc1IOKujm59vCFUMtjjzRqFic7WTjryCD55ykpooE4PHRRVHaNAACIBAYQeGup1gKYQlMkRDAB7A7wvsjjF52Usgp2CTtq1ehzlZgEuNc1OJFV5Yt2j3L7Ox8fdhyNB+qt+4+KULIMMQgRriplklK5pr1IItUARUeRZP/7UsTgAAo0cV+nsGkhZY7r9YYNXFN0k4S366GEFgEBqWtZyMuBJeDWZL0b3UrDAxtSHnFdpkuFdggm6PHlzWgHPdpLny39u95xTM0tcs6Uu/A4ADQp5nFBHSLs5L5xjrZEx5zX/pfM6X+RnCNA6cFGKKgiL1sXFxlO8ytSMJjCkHBwEuFoDqYNIAzikEpC4Lso/oPrrhcMPpVkcxK7crf8BpgBC0MIIC0iBawsoITiLOCN9RabRC2RT1mwmEewcDZcLB2ZuksrAEMS2SGbGaEi//tSxOiADDTTSS2sbcl5lKm1l6EgX2cbfpalObD//9IZ8cioMjGmwQQH1AgsPiBMoc9hSNnAaPmry51JoaozmcRsebmnRQYFjsuX0Xyac+YOgqE6YgqU1jQ5zERtGbrioekGug6fj6hJqvY4e1Tceps3ERzV/HO7uQAx9iC4EiBiS6ji7+U/mP01AtIAtBWUCdIT1KUKVcwEvomCjIeEpKhWnVUsyUbsVDIrWtudisj9qt4J0Zmu/9ejejIyPd1SpUoHDFw9ImaFg4hTXIdyQvT/+1LE5oALvItHLGjFgXsgKvWWDXSROCF7RRuhzlhUAUARkhm9aYSlMn0F2mAAwoaGabpf5QPZeFsUIdwEbjpCP3WeV9lRKQDWz83MhIqGzbH5fz6FbVVCrGJb60SxV2o98iVd4tSoOCX9qT1hYZngZ9Qd693qAKDv231ajahYqqFhgFwULlKIi0tm2MZm6a3FI+6FELPvZgIzfHdJRZe1RzTksgySP4rQpHMv+25idnQg4aNGBUuoPBN7BCwOsYXFQ6ZbGJNR7SDrmJQjEqGOyv/7UsTmAw6Qv1RsmZFBT5erAbwgYOwl3xso1fQATwzaUINIooQKhgIYQ0cOyKhTJHUbIaQpcxxnch+MvzYwKJ1yg8muU88x2ny8W0PRcM3dmZ1CVtj2SQqNalZO5uKsPPYZI+BnrMi9vizWPUbU6qokRwMzLJEq1iEAIySySyuJOAo0tY9FHlaw7a5Wg6jkNv7IZ25G/rS+ZstY6yWWcYTrcWs1VvLVf33oowI0U+COI/L4jxbDnXW3OouUOIVpZ65exb/PpBROBzhzjQKKqlVx//tSxN+AChjXYMyYSMFdFGy9lg0g4snjw1qRr/cAAIIsKr3b2ubmR6leNNN0SbRnl7fLcpBAFh8vMh0HI4hYl+DrtoTNnrIsyTGV9WC0TZuKCNFzrqGCIGXS3PAA0eFDcWavki0UPgRUmJqybqxkWrFqoDTMFc0GhT2bLg25tvvv/rJeNUIliKDYXA3EoJRBGQHRWUXPIlwoDNBO0CxdCB2tOtoDOQTfY1hJnsQNzq2rQQDodub4oZSRVQUULbEAyeQh6v01GSFtgsVQxJwqHQ3/+1LE6YAMRKtnrRhPIXOOKdXNGDC+K6h9jAobqJBDks1tsiTghO6LaxCEQK7jsRKFSSIPuyaIMmRcQECx/FuHyJwgPDzpahf75CnUlO5nx3CE3yIuaAghcKC5oKgwKgkkiCSh7nfckwFWXPUZcC6egNoXo4uzq+z0daokkR2z22yJyiyNhSx0PPI95lHOiD/mR+oaDbGdf3F1vTWYsBls6RilyYkYwub0+34geWUr3O0h1C7p3PV2sjUcmZP/pke/w6OYEXR4DSAORWIGvETTRv/7UsToAAwE9XGsIHFxe46svZYJLIOmUYqK7U6QAA1I7LY2kwQNgNRnMpoMJRn64rlOSGNKu1YjYB+b3/12eOJnOMxyJBsCYick7gUaazznkylZnn/qtu9H2s7kM0kzms9j9WMQSd1kdXc6Bp8WCNxMPmag7Si+NSg3bQABTTkaTlNW2BrIs8PAgF0LLmMRiwcAwF1xFsskU5gJ4sm9z+q37QF0Yc5nUXA/DZ2umHI2XOERQQTLvvE5og4NIehTC7hRr/bpD77AJrajPMmzNs5o//tSxOaAC5h1haYYbrF1ji61hI2mB8PxQ5KoR7NekAAIOPubSFzlmWMBzpAtFuiundQ/6VS8hINaH7TRy3T51KMYVtIq20RVyMMwt3Vj7EqSXZmqEADSt6QbEKwYA4ESc9zc3ipMUQBRaLDHKYPbFmrpBMmJglMgghbUP9IAEtNyyWJkFnkrx1PEFBK08RYIKvMNMLe9LzIxt7knDgu8PVDUYi0Ps4j7Ncti+ZCLLmTAKwc5jvFGTEsZAENIWdyEG+l0+kgTKIAd8oD5j22ovHP/+1LE5wALsPN3p4xVMXie7bTzCpbNwgwURbQqGFzLOj/tcm1KEKnqQO9KQArsDdjieHwB1ECQkcCqK/BaOkIyGqPlqw209Zd3HlW7r+W7s2F6FpsmUjRGBSpEBJOCOPgd0y9jBnqPpJklj1IlDiI9go1R93TmBxprVMTmdj21ABDWs8fsrj5RiCh0nCSUxTgOofMVmY0xXlFgJAnsy/NlItHK2RShRpS/MarfdHMKO30f3SnQxV67J6fWndvNo44JTrL9/2WX+syCr0quf5A/UP/7UsTnAAvwdVNNMGzBeZGsdYYJLAAElpdrWy5mFR84hW4Dy6KThugShV1QnDQaUz0DA6t+XbZU5VyfY46XSziqqsf9M6/7j6qEHBkH3iUtIJCwQAhGxA50SVUDycq065qUrcBzAzTDjmgU68E12NEp8OwcKKHuQ7g3vSkgEhRWhWttcTdXQihks6QenQlS54U7aTIiEdNsTeBHGSIxbmBTJCd2J6MaZ1GXy69pPOFXD0ZQmXW9orDjkMAahU4FHWRB9YsZDY8RmjGSEqVmFeeF//tSxOYADUiJb6eYGjFMi6yo9izkmeTFocY+Kkxl7msAABM81lsiVqh47JStSQmUkK76t7EX5lsa98sL1uBo2vitSZrzotWbmGwttpHf3pEvQ+14qZAI9rxCGg0kifUhzAGWaKlEUKsqXAwfDLm+lELCMYbCLIrkLmrLKkQhJbdZbI3AsiLA0idIWvE+Hmf21IX9dlZvqkak6d/XNEMEdt2BYAaZ3MtiHtP+izGCbBBZc0LOlu0MMOuSnFemZAshpqhfS+lyG/7R9XjCur/pqtn/+1LE5QAKNPdnp5hM4Z2P6/WWDTRFWnT42YF95X/2VAAbptyNOBRRNM61lllpk/lMXjFTYwwUgvGzOj8Q3Sdda8gUaKWPqELJwOmW50vbzWiQ4Ig4BWLBUoXPgEaT5ICX0/xRcgEppjkKf3gJa+pTO6oCUcMhBwJsnT8huwcJ1hpqKMExjg2do2CwKgQEQaKio0ItOkbRh4Owa7bj2oejQQKGbZ6rO+Ituw2KsOZykQYEHBJIm098tSPcjzP5g7kxH1v+T/9Se53ulJRL+T+ZSv/7UsTmgAwIf3XnwG6xa42rtYSODEm85H7wAQknI242nAkxkjoIYb5klSnDqcmpFFm9thlVCBKpuCRoQ1LakYu8yJG67K33l6Qt/fyn5z8vb+U7yw6XsdfuVym98LzV3o5sQqTMjJOFt3+EZ/Scm2+h1NG6eQoAAJOttuNlMNwgsDpVoRGtD+ZAYLq6JGTd6+VRJUPJKllNjl2G2I3S5lnx1y+vSCnjf/fNKFWud3Xny27ds6ebnfoH6Y9ZDpBxg3Qx9BcHiyEBU5QiToRULilL//tSxOaAC/j7caegcHlGDqtplg0a1HUl2iqAAQ2o4262mxDSZBqe3dXCqCdL4LI25TdlFZFrTIZuAydj72ITXurO5zPpCqRmZuu0XhAbhlfMz5eeUPzp+Z5NJ5exPlllt7QxbUhVJEWBk6BnNcSnTF2h6ECm2uoAAQJRNOtlwA0iDKBiO5oTBlCpgWZeICgjUjVnSJR8HSjq0dQ6dIvQ29tlQ13ywRtrIcgi+R9VAYJRQRWB7MbGKVKbj5xvx5yXxp877263dL/IYiHe3e/7R2r/+1LE64AMcPlATaBwwXAn7LTzDd/XpPEvsxPf/2AGsbTRTtpaExrYBqyluLdyIEBhqfCUq7YxDEAufLspx1Vj2Ilej5WKlDDrxFZbSYU6mgcwmLfJ4rl7orzhJn2E5uLkSi4ARWt+dH39bqRydYxeMWV////Zd55CJnzp8+CMMIWPtfsgANtuRuNFJpjQDkZZ+H0hS+X6edWpeEr6H3NLJqI7ex7IZRVsLMwiOD3P4t6rcVxeI+i0ftzLhVsrE/cW6imZWRVHK+Q9xTrYgzpjJf/7UsTpgAwQuWGsPMVxbxvsdYYNnomiKP1C0NJ4voYhx4rKkAkiN0uJURFZFauNTiwG2pTQ5spQ7xZCUxYeILva7+iIkyEBx7hoLMJbvJRiiKhYIupr//QAGIKKl65yF04/gqgGamakmYDixEa9T+v1DuMouS++sP+c15rk/ka7aguu2uAcfCgEI23q8jI25//3UPOc3pLtZfFTJIxPupHMjJzZJwOyMMh0kJ5FP9m/6uxGOdiFsQjuTQp3OLNmgmeWPfU+EZIpLhdH06kAo6xt//tSxOkADEx9T60wSymaFiopow3RINpx2wUibkUsaGotTEMio1F6P9SUgNoxTNelszRmljMzN/K0/21/yKOFVaJXL6qod2YCFf9OC4bpQJhOy3RJSPkufSa98n398tDLbxTCzBggR1IldyEgUqnQbxQYIxMYTIc20exC3AABSStupJJ1hCWo2wiamEgjeCYFUzKJ9ItQ0x5NyYKogbJaU+SOHTk1Zi93duYTHLJMQos9a7LxKQw2hwmNmkOq9UHwjcaHuLAYhdkzz3LQ1C2ooAD/+1LE4oAR/SNrp6R+OdOkKuWUifhxBpAabqO6VQADB3iHm36tqd8mA6VQgDkMeyL5/LkCTIHlB4KtE6otjUZbbiCsGMbcQzKnrV0QEZrtdTL2bp+7IrENa767p1suqN+tI6zwa/T4UDrYURFBcq0Ohn17HPAABcrkUiRTyLoMUAEq8Vh3GT4d5WaUkRRJ68RKggSpraqDF0rqw2Doewv4lcuGX6MKQY8ZXyVdLhzYTb9lx8t9M7YrStp5dn6UTZQ0tx5gBCgHdWoAEuWyd9K8Uf/7UsS+AA1dX3GnmGxRcYwr9YeYmLwOdRGMtnrEKfCgpgLjVBchYIhY9VKJL7nQbJVtD+3VDGDWwqdDUm1jTzEtMA0wOCzSrSxbAMOD4nJA0cDMsPvXsftsktPlksKM2v21IFvf6+y6VOUuBwMy2LBBC49AFQAdCRYOxDdOi1J6ivOXZJ12asZuDJZw9fBDRPbYysARotM/p9/1vGIo8N6sKoRmx/5Il5xgSrtDDdOnJHTs9jn3/lHyNQAAYm4nI2nQ/4yc2mXUu1I5nbvo6Wym//tSxLgACvEDbeeYSuFPj2t1lI0YtFL4mULCyyr4mqQQn87DNvmQDjOOJsgxVexzlcdA8bcGYbPVrte+dk+oyoOQ4afF0N/6gMUBkyjS6VMABAtxyuSxOhwUO45BIomEvBDgpko/TElMXHSSsXjFMeMZNNQ3jmGS/SBfdexayPeh3AXS5/EaoRzyuav5FFQhLEZ60pJNjElhKhFtJ7/y6zta6fQqAKDksjbjQUCYE9ARBXSQBqwvRwIHUinO5leUTzPO3v1eHMIDFZYjDg45O13/+1LEwAAKpF9rh6UIsV0bbvTBiq5NCNyOy/1w5UqUuasqLN+///IrK6OQy2ay/00///86oOYNEwsbTn370COyyEKB8T4DwJgeKhF8hCe2nlEZ2p9KFmUQOBMwsXqPy8Sw9MzNs7smx8pP3rxixlc65nykHdVRZWDP//RS+c5wRRI047qvR/oiKkdpOqMVBDDk0slsIcEFo8Aga7W36/6vn35EojBE5IL0bgQ0aFkmksDJEtprNv/+R8vmSR6F79eaYIGZkNaVVO9eViKT//oXRf/7UsTHgApMeV+sMGlRTxRr9YYNMndBYzumWD4JvS8xQsqguCJP6ZgYgUAVUk0lksRkHGVInyFE4qmZy3Rnk7cgCCL3bEBIES4m/z03j2DlukidD5UztnII25FcO5wSGI9T0LZ/Of//crsrrFuQqtL/yEYwxFOGV/Mjrd6lH/zDP96EKgAFuSjZEjfBM47VSscKCmmmAgBGCXeYM0lyhICB4x2WW4g+L1KJg4tOsvoJES+nhihpr03Tcl+7lmtcwu9rqhX/IG5v9B0uciCYFldu//tSxNIBCpErZ6eMUXk/mu0o8wnunqYzEYs3u8zCADISdw4GhAjUJ/6000f//077HUBtRy6yA6bQPQKo6YtG2jeQORpEiZORvCh4LlgwdJ00aTiF8Bv0YgE5RIAJ0ot0BWjiA+io77I4q405Aw4PCHy5swhHdVK1xXh839QRPJWW2Mt4Qeab7s7vP8mGZpW2veYeyZJqxijLo8ea9l2sGJd8/vGA+D7MMfVjP5IWUMAohLyJNfF5xK+mABaJAAfBEQZiFlUISDeBNSP0aCkZFIL/+1LE3YALENVprBhPcWKfbbWDCa8q9aGfdK4Tms59sDouZL4v2Lz9oClxyyVFOZGIHEGvfzyIG21ydFKtAyOW5HGnlvpUKpv9m/Hmlp1/uNwlND5USat5eX+MY1JWnRY7HseAAhLDMaSIlFOEmgygUOQRliqgzuqqP3PO1DsvfiUjBwkFi4OukmWq5HNiUziTx6E3IZawWhsmieqKvxdLkNQNYraNpQ6KM/zNQU/19X+VAAAEV6ZdIyADAHUGYiRD+OGw0dR0B2J4uFcfWW6iNv/7UsTigBJlS11MiTyRepPrqaYZIJVOFiZB3i3RVDlTB/I9bIzkDPXSkVNCjzCDdSlSKHoK0hg2ciYJLW9z/71ZZMc9X/f+g6sAAJvQ2RoqThaZAyIDgvYkkKreaEJvU5MFHoVTjDhigGFvf/+2PNPgmDrqD4TdcKbQUVUpX6jsxFBokPizxSf0K7k0ua8eg7/ozKOkXIPtpRUAAN7V2WJAKmmzD1IEhXJVAFgUDRdU9oHSwfu9CxeLaLCECWWVYzMWWJXaqcKAkOIsw6CYSeiP//tSxMeADKVZWy2YaQE7iyx9owmQvIihVp2dPAAGb4TOlnev6/0pqd/Ky08z1ABRAGDxcbNTJw1WNwcGgIeYrRcQFLiYKvQVCUFT3/YG+oV6PPuhgPEgqceBh7mnKGGj7RQKBrUbtXOg3esqKY4sMYLPbTALVpKCCKIXNpNfWoetAADjkkkaJTA/UdGk1CxcMx9oPTxiIwXlow5as1Ps+1bikZHRCs7IrkO+M3IqRT+uZPm7kute3/7IHE6ioNWbZV6nQoSuumTLwFND1sYLgAD/+1LEy4AKYGdh7LBloUGIa7W8GBgBJQqxhTA5mMDIIyMJkYSBYCKhigzkQLQVIRbKIzBr40/PrNNrRqfmrcXkCKuQ3CegoYfMM9iMsDsPxtGoNKNpN26jl7qYmKOWaf/3usYLQ6gO4kYzq1Ptq8eqTs21f+iM3K15HjNXnUaVACUt2tkrKcAToQElkB6fx5nkWBlZjqDkZMvnw3UC1opMQqGHO3aSuuyeIS8mtPTztmRXOVBWQOXW5EX/ZEn///dhygMIODqtcQXZ3+q1KHMFQP/7UsTXgAn8W12tJGkhS4Zo2cywUEkAkB0FJqOmmY44GCI+A59GWksXVAIMMciwttUTVlKv5IfMhZQOtnbQBuR6d/GhbM2AqWVh1tylBKkq5hbY2tJMjY5l9/ufdgIwoCMFBgIYNYwZtSfC4tI3PXxcCAAuIDjwolhKpQAA3JJE2kWwrgPQLJfl9EF29hLVbyADRwJKmODK4Uchm0xZlaTuNuEBrnyu8RwjmLEGDkrU6CEPCCK5oIOS34VvetC8967wDKshETsi3//IG4Y5g4rG//tSxOQACcTJZawwQ/GsqCk1xBYxgVT3TZbgc20EIuW7SSNyMN5HlmyMqEo5SnpK0soKC7ZsaTKBxlY8WiWdKCiByMnggRIMRm6/zRUY9EZ9SqxWI49zIKM9H3R/Jr0MdyuDBIIBhhXFtte9juFldAK+r//sCM//Bk+Tjs0AJBLKuBpTRvvhsyYBDAI+ZkMJGmdJhgQcVR5o0ZMjLyKGmDAqxu2yUwIsxokxIcFA0JaD661AzABjEAkNIEZgXEWy0JIRN4swykvHD05m+7X4RQz/+1LE5QAKKMtrp7BLsZkZqB3EjZgpnFVc7T7UYl0MTnwXL9y+aceT53pa0+OPhGbdC19+8MaetMDhhBx3RlG0bdc6fsy7UyOygnIkzK97HdbpDnJkZOS0Nl0ajRKtI0ep/p1mhOUKOLa9+SqCi0/8WUeUaj4hFRKJByzqSaQ6aqf5bBLEiQD0Bk0zzSqIUGJbl7woAsRVUs8oQcRXFsJggmdRhy2ONYgUUTOahMTeQ2zcoXOenFssfZQkDsQThFPCogjnHozqerJPFVvF6V/o8v/7UsTnAAvA82GsJGlxfxnttPSVd/aXLClkGCg3LGUhZ6nnDg8CDGklWhY+CEvP95d+XAhn8PigRfP6VVMAAABKbkO8YyFMDpPsLxtUTa+N5vdsGGJsQ92rW+02APEEUggymIVqKWt/0O60NI5N7fTRneEVLMdLsx6NJZziDYteoUZF5eNjGNvf/+9jPcvfe2hiFtbSTtN39syFnz8com4Qcwlz7+DFTrK/+AhqcDEgRLjZAElWCFiWQQ5MRzQ1wSiDCWIjtdoHi4rZO4DI+rGg//tSxOYCFGVXTO0I3oJMnqx1l6KQ1IfTaOCg8Mg9BXLGosFCoaR5YekKuqb3zb9HZ7fJRTVPEXESvvoXUWWdqPddigVGpElX0tuC4MFBkLQ+JwtLomaTxIM1huXwJRFZ6DVTYUKGxOZs21Tph1BoAnQ6MEQ5h4qrqwE21TSUDHVw6tyPVhrFlp6L7RUq6+1kkd/+kAlpOVN8/lhaiABeATyEognSOdIhPsqNYUJjIoylyhIwKXPOquekjsZpsGTYbaFBy0FlKa94cE2sGWl86Kn/+1LEqIGOUVNvR4jTmT+JrKmGGHgb1K17etwGYxBOOYnvwEJfWlrF+lCKAVVpUedKpE8DR3HitwasKrqyt+lOX4p0plYrCpUZoWmLh4trCxp620za6yrVqV1pR4i8LD3iA8qKljTdJRsvpWv7naHOnypOG9yXU6pb6ad7EoBLDcjacaRKeQJgK8thrC3iklhD1gWIQHZTbMOB5iWG0pRpXKVdROkMqkXkq0FRCXFjweUrcGhOooVuouead77n0TtbP6Vi6VIY9y0FdRdDWF7W9v/7UsSlAAoQY3WFsGGxTAnrDZeYcGsAoKee2/ayXxILJQPbK8jQQNFcS/Q1RVusVjFPZtZTDg9diNMwZihB0g/KfCLJA4wRZecQfF0gNyhUeT71iNlCb1na2mW6tr9ZpNCaqPfa52nN9QAAjpSMpwJ7nZPGlDo9GoUSdAtglScsZ/H6xsEyvoupqzlJWQj+TaYdeJFkUeB3KPLMNJT0VzTTFpS1Tmvx21pGitbiI4aAAky19JpJkSk1ybpaPgiiVE2U4SARKAVUvQPXb5TJuL/r//tSxLEAClBdTk1hgUFSC+009KDekm2CYTo1wRbIzgSYRprsojC2Zk2qKGGWqxO/81nOch3Fw/YulrFlXuCblplSaWq7vq1r+TXGMTra4mAgekaC4EceMngs6KVggXTNaoQD05AB4bhUw+wmgXLiohqoPU7NnHlk/S3MjmnAiEAgYIUOGCRUi+LA4Gn0euXS417YXLtpWxH3wwhdghXTtgo1NpPLdI3LlCBwQgRJYhiQgaQnEATC7hQjqD5MbqQTam5TUTrks5gHzAbOlLZ09nD/+1LEu4AKZGljrDBloU6KaimnmHDSBY20aHCRy7QWacEI17lsasUss12OtoyW8qzD5QUQ02l9ZAX1luEgFoYDbfkpdqxXRTinVyshKOj6Gxcm56pUV0jBEKf23Kcy3y9k/137/9tuHo030DJbJ/UNShNzkUPLWee+gnls7JnnzYkgjdqb2aBh+gAAJE5CAwIQwInEoUEQrcgEJb1mFVB+FgXYVK2kGurHr8YUgnKq48XR2k8DxHuXy0+VCmC0R9DmqNDZIYAeZwuEQeyzBSDssv/7UsTGAAnMg2OsJKlxQYnpmbywGJoGZIjBrTJpky30kS4PM+ShCNCtY9SVMUFVWupEvGiJfdNVzij6vdd7si9160a/pppo3pp1Iu61KMzAdTVlaKa0DE2V//zdzQvy4ZrMDpiQrbeBAAAtuVL47TMI4LajbjUbVQm47lEp2buySsWDFon6UAQCeKDjpsNErw4iIzLlAVQiPOF1uyjGaUljMy9jexddJK1baRpa8XFDxJzzTRYOy4qMD9UAAsswAtogGNHCUggN/n/Z6JKUXHx6//tSxNSACmxPd6exIvFEj+xqnmAGPBwtbSE99uGvyBARzVWY0FJDp8VFyw8EhKLhoIMAlC7RKPIQHdokYhsqGeKHqlqs//ZXtMky7yN33AECOuJVxJF2WBpsOKvD4ahetEGpNOzBE8mEtIybRwCXY15CpSFmKwcLusHCwKgRokFYWCLkTQqOJhcCC6SylOLXIKo/e48tJ396tdvgFh0bYpfd6wMkIBQFDDj1U+YUxFmFsAURQkYRTzEgh91KeDgRUAojYeyg4de120v0xw6e4r//+1DE4AATRXNbuZaAAUwGax+wYAD/PdekSpPPxfmjZMoA3NiBNn29A8cRtwMmjI73NTKuqiGhml/+kAI6m0kk3UyzoqNIZRR4WLM3h1RumktCeEpKEAMScBHllpSNprwY65x8b0Xj+XoBKmsNIa8VETCdBo6Ixh28Be7qtaMSIVaOY/7vmwHYvdXNJcoABx+23euN36BlggSSiKSY8LXB5LBBURr1g5aTsTG6aN1nw3LY7SJDItvlVL/5qnPPTjHbAOLnZERJpWshIOqpjy7m//tSxMaACfxJW6ywZWFQiiu1lgx0v++K7mmGORSrf1XfXyqA203pNLa4nBx9BKyWIyALexIV2UEu15wSA8Sn2WvazZodLTNuSUlzw5v8+Nz5f5x8Fw0DQMB4OWh1iyp1YMiXOESu5jtPQ863Kp1YZYPsDrWMfSoAI4g7Em4FUjoHTIg2jr1UoUMdd5/g14Gf36fUYfksgSz+iwiq/2+b7Ayyp/zVoJ4+sfdQu5mkDnLqWdSHqXU/MpqZ/k++jgl1n8OyHf3+9yIu47NlFkbznfn/+1LE0oAKcH1MzeEBQUoN6qmTDWD1hjSW7paoABkxtJXRtwKzhqsyYVTRX7zrZxGxg6H5BKOFg3M2Wyq4KchwAiNFFVAsIxJPMhOdpITOpO4TFqZCrDLR9MyhSMZQ/5ctmM2/B61lqJOSnXWw9pfM4KHfiKW44RubXvepAAEIJxyShLk7o0IQUIN2vLbJQRUC+pUKDQOQiVrlBcSjouOW80pmq6j9bw1gosxnPcMrvVAxH1cxV0Putl0sfu1ndFBYoxA2TSROCcpNmC0J27DVN//7UsTdgAowbWGnsMGhS42t9PYZLqDpoKoXNZI01QSbjjlctkbgSQD7DoEPQCEm+b5hryKLHpHakhqDu6SWiwW0sCslZ7Gy5+Y4GG3Hxwu6l3rLSdzaYWYNGwgmPIUPMy0zmqUyJ3r0RUIHn4TpEpiuW/eMWGoo5yoyF1IAJR+3u/2u2vGKeCAJDSlVJsELABMVAQMN7wk9DJMnjqEqEUEeraUsIUohZ0HQju7B3MdM6NZrImiWdeqGaSrzoy/Of119G9XO5O36kc3d5JCZJBZ0//tSxOkADBk/UU0Yb2mAmmp1pgzlIQIIYHMoXcsAKU1U4JkoYcZNS3EJgWwCThQEtvgiAXIYg/b7u3Tz9unn6uqSlgMr1uvXFQGhYdgvel19/Yi87Et9IeQ/Tl5LVnAiGBgIhbscGCGJaMkCQqOFGvtn69IB9WdiWqPEMS0ZXLcajV5UJkIkKLnEUJ/bNu/lMlt/obFp7sRbK2M7vk72Mxnv8uIz7zAQYWtSs+XrdxY9BDtDp8wP/sDw/8GBfh4+PTExk01ENBvTFHA6EiMqFAb/+1LE5oALxL9JTbBJQXYY7PTzDpaTiAJcJqAKAmNhwD1QVNfOnk1K7UBB8P9T2IsKiq/y5GHyGoEMK1ca8rqn2rr3Yuxi97+zXtacWn+L9PXVK2X3GzdJEVVlKle202lbVdcXtusdqOKn5nC0Ll+EWeb87IpcEnJndziOqhgAParkRAwV0KsEeVsMQnVUL7+4AEkAQEYGznz4AmkcxIxk6R1oHir68TpboZR+fLdRtYVtCjnyZFSQ9BaFQ6FyxVdMZBUQUwCZHB5QDDO87D08v//7UsTmgAuhQ1usJEeijqzp2aYaeSb08pa79L7jzZCKzvo6FQSVXZc3GkSWJGdJlNCfiHTRdtiieJJ5h/HWrU0A2SayzZOnZtpBVlhEl7s/XDKLCWx5iGR6ntiyHgEl3/TV1fWsi1x7PaXs8uyPbSAhwDGrs0koMRQTFQg0UAeIMfoeS0eeTPcwhvKpYVkmBOaJeEioiHzirEE3yIumR+aHnxAYpxtkmt7jYbYYbaHi3U962qEX2yrmV/0JbpUAlNyTx2toqAzCdLCfMiwYaR09//tSxMQAEXlZUg2wccE6CmxlliDgz0pIGR+p9RzbP9CGBw5rODI7En/oGYiI1RQxRmCixjKGPQ4LSwiPC7kBlAyacUWoZGqh37/zdaVuVSntizG/1awAAEiU0mzaxqc/uUpQEFwEwfUvvklI+bXG2uwG8n8sQX5DGy53CBlXLf61W9aJRF3HAZFgacIlWDWJAa2qHoXlpr1Nbq/q9avXqN72NJF3Ls93uQAAA2eY641KaKSYxeXTjYkzcRAJZdB2sEofFqZTCUSBx9K+mDNscqf/+1LEtIAJbH99p5hOsTiPatW0jZDJ8ii6git0OlIw0VDbmcUaVBlaHkg094mohc0+yzc6bpj+KaggpKjG/10AEimknAZrRGIAoJnEFYJWEYIFLiid7A6V72jxXHPlmY5qbtsxDjkMuvY1uo6xxw3W0axoLN/gq1L3JZgD9mo8pLDRUJECIqvWsVCaFMxRIuoAAl0o0iUBHPMMeGCQFID0VPRAheDgpPiwPxp5wS2RTLXsioQfGaG1oeO2J2m3ehc/NYewVAI57mWT5wZUeOlpwf/7UsTFgAp4fXmnsGXxTAvs/YYY9JrtmEtxqEv9yW9DbDSiRZbDr0hApqRxy2SSAgR8KEvJC06Lq1Gkbz43Gt+bvjNeVfXuNfCGoWXR6WqGCUcAQoGw68WJjzbIolBom3TyWLCIacTDYoCV7SsguxdJISuuc1KItZ21AAIFtyJJgwbJAruaA9m+CZwJ4ZaKGYpDRQCIsHfljg4BrjsLyyXOCr1hWgxDGFKY4xOihQbGY4k3ADPUGfUUvLQ6dnIHhgGBGGWOonEyT7p4IzIqoYVb//tSxNACCkxVX60kaWFACerpvKwqL/fQ8z0kJ1OggAtSTSXSSQKXCo3qc5JhzSE3TiRZ0GuU35FSgbmTlbvFrKIyrokCORDDCmFIfL1BxciNYpVY8wqK0uzd7pMjHdVOd6e37VGFekacSRzwxkIlT75UukPhtKuc8BoVAAKLSkcjibADaOwAmE3EjHmDGmQamPNUwUHl4qlG4JMSXOoI3qLGAUyC1iFi7KEJaSe+aJydV3upflm9fwyzCRyNOGhnen1z8f/3/q+a9AuIYDy58dD/+1LE3IAKdGtfTSTHsUcJrbT2ISZ0AWv+1v79fJgFGk6DSjjY3jFwRx4ekAYwAboGmCCBKHSkfN2FC/qSp+nQXpyCCFsQDWTt/fyAGiCgYFAYYijAgwoFBQKBQKEE37AgYUKOcxZPRRAgdckDDiyBoy/8db7PtAIfA+34IM3mCIAAotrz7PzP/Wfb9w4ZOgABGnlWwZ4OEeIllzcAt2TXgpqisTiyxgOK7FHekmOl65PHrTEisMR+rmpPHMq3BUiTK96o1llTqh1DXUdWv6um2P/7UsTngAv4kU1NsGzhchntdYeUvuW4UscPq1FEdNSVC4f9OZ+fx05JMi6Uk/y4EfkMMbt6ctMeHH9qe3D6Pk8qH4lioYbEoCNUbe/2gAFKEoaVXMATsPwxQGkIGERDKpNYGpVZOcEllR9cdd4qzf91QhQlpAF61wMhLZkq51azWjGQLDZVtGcaHa0UKnb2m47cg2pi3IODCKtfQgY+AAWbbttjjc47gHyB+LsHs6Rx7UC8JjYOXsGDdp6snj6L1j750YU0LKF9+Qy4eCNAWcGt//tSxOcAC9jbY6egbrnDk2nNoyYRWTqWQnUuYXQKASlzyBdR0oizvfsWmPi4tqF7dLQsv1oAAMLSlUovIlIBcZf8Og3BDg0JhAQHP1ARIIFOmruVcdasGXGCE6YbDS2IGAdxZjDQQacLG6zrSqxqyvsNVupHWrbF5cQZixiu1PO07Llj6+gIp63TW2Npuw0QLATgiUoT+4rK4kHZAIvri2Pp0CNTwE3D2UVHIxJk6uqmszO3HDhytTZcVIvYoc8XLiguLK7q5KjKjHCj9q3GVrr/+1LE3QAPRU9ZLDxr4UKKLTD2DH64u/tfI2IvO6AAAFFZFve1yS9J96iAyOiQ6saTnQkhEIoHBo+2Th3uba8ursBHVr09yfVcUK3VCDwHwiOCKTyQ60dJXQmsm8kBYiBWccJUHGhyedj6D2cE6gaiU/U9ZNOer2oxGZ/6agADG07W2kUgKaB3BIgPIFo7hdaIM3jxQ9iNTywVdl1uKu4l4COW3BdqwScdBXnCIAyLomGU1hs8VcFpDJgmQxVhjRrzTXvRZJ9UnfRnTVr3rfL/P//7UsTVgApoeWWnpGkhQwfs8YYkTh+/+LHpczeG0HY8ll9MtkJ6SCnJJZLZG2D5JGnSVF4YR9XCk/MSxcoN7xY83xMS84X7krryuVKHHlNoSt65V1+vHxttUuSOXMFZ1BwLDibekbuBfujnOS0cy19fofU9/8d77fsAKSjcBAYz9QM/ygyiM8RTSS44BlYAOnAFD0533htWmciQBpZAxESw4epAbdXVsS7d2hGhpTO4C6oh5m0W1ruVWoUqGDvEjTGpc901UAzgVJCg0nUfWraY//tSxOGACnhrd6ewZzF6C6w9hgz0TJbAilXZdoFwAibjlbUgFFDRkNU87gSnsrUOshTkdFY0I4fF4Y/jYu8z106irirv2BxFgUY0ZhIhlAj/f3NgoYJ5JY8cu0433nro1nG3peRlLpfMrmV/+tavv5cmEw08NuPQox0xylUghWSSyWSNwBQC5CunUTwY5S4IIxFgU5/io1CONOSDFLDbP4+1C0UFj0QAiRwTqdXSEBEEBMr7ZHdWJyA7t3J7ceG0v1z+qsGdJ80Oa1r7/ohG+TH/+1LE5gAMnHVlp70n+UyTLfT2IOfvbeZwnSMSAACbKiSbBJCBAk104zLs0yMzx434GHAMKQBuxNwJKfm32itM8dJQmpw4W/qGfoHulwK2fL6vyAmw1D0zh5LY/cpK3755JrzP74OmWGAyA0J18J3vPrKuF0i0avxd6CEolQAA2m42422wSIW0QoMAeRskMfrl0a6HmxCtlYc5BblBhqWPS2CO0nc1GCD7t7k4VWQlWb5K+vV4mX0wE4FohMA10fo5j9qIJ0ywZR/8aH871Pp1vf/7UsToAAwQoULNsK0BeqHqKZYNLM/bVGbNZKEvv//oAgFgdHI6PhZFa1mTCZbUAAOp1nAg68krm/U2gdLrqk3aTXlS6IHZWcB3EuTkhS9O2xGSIi0nAeu4bG8Ucfo9VPMRc95Dlc6TQW1sJWmVFqmvqmZGSZjUdkUr5mF5m9Y8TPjvmCJJq68yTwfXeNU3/jW4k2ImPalNzSwc41b0//+Na////9NP39fFxi2IOgn/Tww50AuKqAoNKgAC6yAAAUm6T8RgUgJeWgkohl0LkZXq//tSxOYAC1zLaaekbnGCmelpow4cqVLcxLahvjiJEiqkf3atas23eeurjZROW3LCtx950gNIBrSDIyh1mXpT/WQTZZl3tfp/9CHKHFqFdGAGLAJLrbkAKuk3hAjCT5zHfp09yzTLhiu5N77EXVI262rDbMLsW9HEid9H2Rs70n9T/3+VS80iBjVMvww3FRBTCyrZMJCeZ02gWiTIE9ZbVI3kA2KpyYg3j4OIyeKOPIHMJK7QMN5UTcSRe9haWJz2E4XcJMQFcLUKo0CciJhU3In/+1LE5gAL1INhtPSAOmYna7cw8AA2KFAnmqtTltJrUtgrRkaBSgACtWnoACkp25hWaE9aysKS2YLAgPqCsBSBMLE0DbrSzxZ7KuV/0JbSHcKvz+93tzBwMual//xRVQSqCiP50GEbC0rYiGtdVbqMaYEERIYVKkgn0O//9aAAAJmdYfXpEBQzVGI6OkMBmBGw5uDqdjWxqxSWIGJo26x5kgJpWegRHkrjARJUHBkSN+vKoWZQMqhAaQW3PhUa99u9QhY6Rfbin2QTFSt4Spu7WP/7UsTHgAp4bV+88wACPzRtsPCmnk9z8rqqAADJKjjJADTghhQW8MGIHCgJQ2QLTxNxHzQ2fnzyuHdTC8UAc0Y9rB2qNaqw43Ynrl5xzBgoocWeKawnChNjW63B2M1U8ZZzrEJLPELSBaxzJ1KwAAjHIpHEnKjoXSBThHkbWXLG2y0IjARqit/mEZR5NV33shI2Bf1WJQYxhpp+SKTpmEyCBUVOAmNOS1h020U8bV9K1Oagef2LoQdpNtRTrr3KiiNiSdUAgxyySSJEtpiORlgJ//tSxLOACvi7W4wkZ4FeEay89gx8kbhe7olqFhULoyrc/YhDlcmQr597scIVBlm4gYicAZMmKCoeAbBF6guSHCScWwRUvZuaR+bneM9YZOguaCd6VHn0fu/W4AAIFqJxppwDmGcgsgHED3QYedDUHF3FV4xAMRb/RpIaaAq+tjoKkCEiQEDwYKCEsIGCqlOMOEhBmABjnBkYGLSDXg/21M1RlYuHyJbbhfn8vIJVAEoYygEoBjch4jpvSZnyRsYN5WNzo25z8Ki7nGIvhCilksr/+1LEuYAKcINTrKRowVaJ6rWGDOhTLvNNVSqlDKVm7tEy/V21T1NStVWva1tNlR4Ie+K5NQclihb/et1QlbYn1gAFqOR1xskiyALemDqQkkE6JTxUD0uDPz4WmUoP5zC0yrUI9B7iEQPRrPn5drgjstJWB7UStCOpvb6q4w9pV4UwB+Z+DzcmOGADPvDQpft93doVAAONt2tsicCy2gCIYCmlgzYqjmg6A+LDMTEHlx2ULFhpwRbps6CTmF1ynQ82RKAMEgfrlDGtA8vmxYClGv/7UsTCgApQV2mnsGkxSwdp9YyYYGB0BPOdWjDqZ9I0gn0JdiohPFVB4rUCf1hHHVsOGIsGaKEAYOUBNjkpfxt23cSek9+rFqWwc0mljzmZvuuiFC5ggDCic+coHvqcKxRr2Y6cQ0afiC6GFXFFdf/zkgSAaQwKFxAsD9Xd05MAMao0oUTSq0ueLuNQEOVcyPZX2Gn/f56t7r6toADoFtyb6M5n9RUyv635dO8Rk9DSoHGHAxI4grbItQUFmLzsTC0aef0/T/8bBvHjSk4gUDZ5//tSxM2ACdzTRq0gTkFJmmx09g0e69qAAAJVGHZ8tRtJG2k0QhgiBwhgjpKLBpM340ehPADi0Dl7kokAcCBg5SQcFYco+rz4GADYV9NIhWSgWQFQBIbXbk/ePX7kXg63NgXPaszyXZ2qZbPxCCXs+WLHZXj6u7zQWdOTb04YznGKV8su9/cSG/juFd3xeFuavtn6zi8H7mpq3z/rG8U9PjVd/Oon9s/GfferzvIlMPMavjP///+v/v/////+I/Z4+n4gAY5l/HAxM5ZsMQmXCAj/+1LE2oAKZEtZrDDHIU+I6VmsmGgsHHCYgugFFWtstUDkTjr/YkyFwQ/gJ6GX9JFQoifE2fM6NRjfp9HSBxQdRLYpM1qxiLuWKE2vocasGucWsr375ylpDgwaaxjf3jMmI/pTOMVmxG8CnrvGvbfp6/Ovr414Wd1rf5/tp7NbF6ybZc43r/dc+F///8X3Rxu0Rs6zJ//b+kKCRxgGcBHs9gALooFaZ6FyBZF/RxYhnxUrAcVfGi1l3GIrCAkUb6Mu77PTtaf7Nke72UzB8zHRCv/7UsTlAAqQmVNVgYACrjCqdzTwAIvuyndkZTMg04wdpJijHFBQYKCAdA6FHDyGNel+6v//9X+lAAVl8kaJIMp8L4f4lVQjSaUV1G5jjprNA0E0k3lKzSvK1GthBGfnIlx6muSbc8DBPRa1C6n1d0UPWqY9V38yoBDR6kOSSfjXIoMrvI3ArLcyQQIYnLpEoQYeISEAaLiG+AbuxmlJq47IvsqFv+25BzUda4+D4+7DnLt68OVrg2K+zCiyyuAuIlSzCqiyqqXPeoqOiUy/ae6d//tSxMMAE0VjUrmngAFKnevnnlAAmcEo3ZFE2N9TGfSqMDF4V2WbbU25oROCMGmY5oHJxIAi+HgmkTmViDFQQKscl16GypfU/1RMKCaVjF6Bdy0Ql9zB4xzmFTxN7LD61O0rSYatze9q0JZU8YVbWAAaY1f1Ac9x0BdgThzF3FnqZDgtVBea2V8ZaGgmbj4HxoxIEHiUMqWLAYYdFBjJk+k0G1nwWf1Oc5r7l3t1R7cq9TGkvcOi9iUl1JRLjYcpe6HaBCCADjJsLBwBnIgwOOj/+1LEqoAKHE9jp5hMgU0SavD2DODIgVJQOCIUp+uAIVCY0+ErO0+r1rpx1ElkGkOVW9szvU9iVdSl/nlgtQVB2cUQxS5SKnetjXOfzv09830bxsldSW36wAFTbbXW21Am3GwIoABWfAKttA5D8hOjC97WCUZsGDCZZaW0fW76POfb0s6s912YWJSdakS9ujUs5LyKse4UNQUUkRDnIbDkSO01UNxann1oF5CaTSEX05LJI2lAmVcLMfx3FiLlIVZbCFB+plb9oDkAvBZXY0Lz3f/7UsS2AAnUc2fnsEbhS4cq8PYY3JLJ1Oo1xKIGDhOCo46Kh0JIJNYbEibnLtfYvdNvUjclR6EiKH/YSCBw7DSxYKMhcABUSKuyOKQWVvA2Ux1U4VWjRMoeaMuQ78Gvd5AmJFiB7E8tMXzy9C/71HUrwivMSHgEkkBWido6g5Uk40BiJ50OVvRFWNyJsBjnoMJds3UC1sjapQA00vggFAZObJyZSAGdjTxPemuNVKYx+RvqTF6QMCWExYm3FhVRi8I7L/mBtjnni6kihcJqBAst//tSxMMACiiPSM08Z0FRlWr1hgk0gaUg+MCSkISE31mHIrt4eFhc4PvSr7f8OAALmR6SRtyBJSVliBPZwHcDhJKsGrh1XudBWvS4rH4CrCtQ5UJM9OTMfa/aRn3PPgnWRWBnvGToTJZSweoZmxMbKgkhpQ+Xicao7sJ667Nyc8kuAAABAhCKTgAykEhgCrHmxmSCsnMeZQmgwExJrjdhQcPF4foX/mqFMmHwo6ElHWer0shbv/DNdGclt6TfzF6/0J6pf6JfW5692xtzra/9zqv/+1LEzgAKcFNnp5kMcVANanWUjZz8tVR+k0kil661Ws1UqzoxGGxGKGRmH6DlkFWWp9xSUtjVpbm+e4hbW5CjpCViRh1LRTnA9V+1hD+ndxKN0BbOg6IKhc4TasPV9UxDoUESlbRG56yR6TxZJLzsDhuRyYGZSszDu7fHtraoT6jj0p2HyWx8wPrVKM2LvJt7xlGZj11Sl1zK9ef/////4o8eOEjyJvNJ661LNWV7N/////////7////53jU0bUK9tKtVQiUCZAAAAo0NUoQP9v/7UsTYAAocT0TNZMMBTA2qNZSNnGc07OrYTW4L1ZFtxUaS8U/DMlCDmY91y1BFsYMKECHBTZyhxQYEGD+r3f+DhdAnCx10X4n/////ilgFTcRgAZCb2X06fxqOCgOpiszbijmeQoNW6BDRBMKZRmZjmjhRJfycPzOaOjry0R/NMaUqW0M+vMb+lNOsoCmDuV/4/Lub6FR65F/3O8q5agVAGk+pSW7JDNWgFmsUNzujhCG2u0i6B68RDOZ6spVXaCDUfRW3XdUJWe7I76+yKzPf//tSxOQACohHQ7WkgAqosSy3MvAD0RbEe9Xt09KSAhHtPGAMxAXFFAJUx3VaGLDH//cQKk2ru7WW1kvCeQqguLz43ORmkFzKEMcgefiAXrM1k19F2G4T/Vvl3znB4cMpheRQSEqcscKAyt6qcltd9HZdRVV125J5MqwCknKS8yFQXixuAafe7lekTTraPooBFi5KlCH6ufKFl2gM3fOdGe0bfh3qwHDmStGyw0zyJEV9D9DOX+a1LdustN2uyHqjvqyq7afT8IRPsxyerWmPLuP/+1LEwoAI3FVlvPSAAT4drHTxleiUtPyv1gB/vTRptIp14KWYJFDxch63MXUyy8xSzMWNDftm3mcsPrLPmnwwmHNJCCEgMfe84nZr/10VEvDCMRSktbu/vuc1pdWlfhTHO89cnh6+fl3NTQLSIzZ0sY2wxnWd1kWqACR7SpeLP7En2ww0SGil6n5FDoeDFRpZuHrGXdkPthv+MmVDmxRuubLl4IGaE4PpKRU0vrednzL7SqqZz1LIiTZ++unT+qpy1Yv/Wt///pmNtcyHBBh4X//7UsTVAAnk61KsMEcBRo9tPMENxDQKziJ1xt2/fwBLURyRSONOqdMNSOEKjccy7sBwLbKcBG4vlZWbtWbgAOYpiwpUWfoSr/A1EUs8bMKg7ScGBpRIAmwiHnkps0hJY9IC1T+HXterd6vO1bklKzLoBOj+TkFHFbJJImUoewVDMX88WQRRiXaRQ+h6z+IxrpgUs7iV2Z6L29xM+5Zxb19tjnffkXrVdnQ6sT083yFlbL3ultv+j/VHaZkd/lUxpuvv6xmszL0m0vIxZCm2hwEU//tSxOKACj0JX6eMUQF5res08I6wG9VACcrskbldj4YUQcbaCnfGEOB2XcO8p6PdGSwVpVDWZBNdcZheVEm4lef3Hzf7d1uak583ndnNuhTmtdGaR5VQjrmRt//98pWedk2fRbIl2RyvtZFo68uZ+3uxRM1uj0843KoBIFTQOlx1CcYia8wkgAtHpzyhw0ESelKlqN7uRPGrVfnU2fqQHfuJDGX3J5gfGV8MKzO3be9l5PLyiv5+7ufI0sVIMUtYVkUvbfXJmQKfJgilMk49ZET/+1LE6AAMKWdj54xTqVoL6rWHjHAVe8au7otYAAKImyZEwWCwSMXoTjefaax0tPL6V8WGQC3AmCsQLUp8YV8MEVJwh61BO3Y68KUz9+SE/058bB/Rg4JTsGRly7N/7RoQeFQeEoOibr0thwuffECuK8uG2OENFyFBegACxS4lI2IwlOmiNHkEDrM2VUjb4XHjhK2GPcks7SWMwmIq0t3bKSzMMRA0As9hgjaRZzi7OjIQiHmRGZjolFcriLEJ01Zn//29WOFBERQrqIhCxFNbn//7UsTqAEvVNWmnmFExhrCstPMJ9/12aDzNCAC0i5H9HZA2Zxm/ytCSrSmmrwaY7hACNSyHKSWM7ctlbDwbeFCTtznLUDEL+p2lAUBQwFwHAOJ0zc5zcIAQAgQBhkjDYICyNuCjpr3Ok0aPfMAInp29//ZLc6swRhkNVK96kqpw4GBnYIIDgYGBiz5TnOBgYGMHdjgYGBgYhg4s4fz6gQBPrDFYfgAgElAmSgGiABlLKSH1ZJ2IQ9AN1sFp+e1WfE03MTRlYH7rTctMQ3rFW1rW//tSxOeAC7ydQM1gw4F2lSl1kw4ketlsdhi+zVnrVElEhQESAib7J1pXlmbXX9///////TzPMYxvm6tLMBGfVQwEgcNa2tU3lWwaEQBa+EE6QwXMHoDB9ZVDSVj4LnMTKXS8Ws0Y4qAPkMpX/jn2sVmWhNh3+I4i+SJ6O+e9Pv6Jn+7/1EfCFdBzAPAMPqspT/UQy8QOcKcn6TBHSXh3fSRxuYwCkimJeq0uaUD1Afhw1HJp5nqXXLvTmPNZkkbfRG8xJEpGpZjapYC4VTa4ndT/+1LE54ALoQNPrJhO6icsKc2EijD4DwlEKheJZ7hszJPvFEzBlZ+8c2aHmJk0U29X9nIDQK29wAAEUeKkBcISSVBbQSRQ6G3oY9Aa0Sl9yFUIbAqV+l/+uNMlEgnpLsxk1Ewia3TuV9sj1jzbDDKXNuV5PBBcj3dfkrKLKzec7Vv5c7kQOEtJd33mrKnsHAqfKCUG4gtGI5qIShgpOOtiz93DnEObZsftB5//xln8OTW31WsOSB46Kxz8XuZKu62976ujt1GqVuchOVnnThdwev/7UsTSAAxBXVbsME9BPBtqlYYMcJPNpEUaQGqybNT3WJtOt42DvLiKpXAULawFA1BMTxt8qyzinoB5GVTMWaxy4vDEnluzfc9KfzyYiFNf+yh+0oppgLi84EwosEgTMAmZGAEw+9KRrbTbdq3NetERKsrCDzbB+niiAW2XtlvrbTyRKMNSGqLoeJBy5oxDzxUZsrNmNEIXYnNLnKyaTrUOS49Z6PpQDKfEQzJBTU5QTHz+ch53m6Dzy1XY/acy17PgMMkgBSxyNjit80tRLfUp//tSxNeACsjbc+WEdSE+mStk9gxhPPMekS/RpAAEAIKBBILhIiMVjmQXjMYFe8caYzV/bcaJQYrbIh01QocgAruqWgSh30cgv0ug4jkWiH5WDU1ypAzAhIsaUe42EAwlIFenvZ3OFgokKjNqWo8dQ1AozQUDybeRkBXCwPR8CWR3lgGfqgWOvSMqKO1LyQTIunR+REIGsKoaVnoZ/k+ehyG0wodBEk7rZaQYEKEgTxg1Y85rPj/67FRw0sOzZkmKNalb22LBYPBINrapJ5pLHi//+1LE4oAKPJVr5hhsoX8TLDz2DLTGIvFdgA4pczCAKuEEciXqbKLqkvxqLva7ysrr5aGiorPpIxTvLn7jZOlZwvSMXBbJW4feERmQcSux682zLU+l52Oq/xL5FpwjyNuMpWMvvqCOA9L9ufqmb/ArpWjfmIcBt9ogpx1vSSttwHAAQEA7CAyCsfheOKY6C0o2uyM9QPhTTMJ4vhfHRzM5e3kJzv/fdkza3UctGzoG51UtsplorsUE7nWisy0o+Rzls5ls7Mj2Jdw11b0Xq/o2Sv/7UsTngAu4412npG5hcRFpNZSNiLsnDpN2HKSG7XpLJbI5AuC7ncZgt4/RMDwFLCQFAXggjPSyKSQ4ZzAqPKQmmc47mYpQM3iUswbkgSA22FQpkjbcWMU63aYc4WRHYX/SkXpfmX34VRfVAxiCRUm4Mkjh8uoG02No4OpqALJckEouBWYKJmDiOEqbM3ctwWFNs7jsRlf/wUDgXEy0DrPTG4fd8xDUj+au6h98Pv3tmW0W2H0n/9gsLdA9sggCCgAZZdu72xeAFtgd4/FwPFpA//tSxOiAS6yrQk0wbMF4nmklpI2l+RLioHDnMAN6BAxgMFjQDPoyPmGhxmi4JIpi46VS0xNGOIdAd6GBmu+JLGYoaSwKuPL48Fjk6Pxp1UpxJMzFgiMLgiSZmRC2CXZiOG4cYhxwloFCAUFLvOtBnqX6YbeuErCsMv1t5uMMrnRI9g5JQpK47II9pysBgKyIbD2tdXIYkF8SCucar/6P1fsf9k0v7l83L9S835eBC9sSXt733ISLPCogNZpTTT/iyCca+FiRg0hhxzWTJjjEpTP/+1LE6IAL+TdlphhU8YIfLPT2DWaBTJcTONTZpwBVAMYwS4zKESMoTAU3M2KOuRA281TIXiMRBqQspAQrFJB5afaNp8ObUIdwjqSQjMPPQBNzQLd53V7wHknKiomcuRzoFi9JYew+SRKxYqUh+JwFwQX4VzA0u0fb25A1RpyOVLTUax7e621im8E9S6JbK6gW/dtrrbQBAIBSacBKNe7R3LdeNO8+wyAbBkGUkjhMiwANVCKqCntBDqOsYd/Mjcs8j7naqqUnlJIxd/Pg1oAIRP/7UsTmAAuUnU9MpMyijZuowbyxeJqj7oqAntUIbQAx6Np+9y3pscF2VWEAAApyLkzwtJMkIZUNs1t6uIJFcV2wvmGUtrIpki1OcCDAYoUs0W1abMLETFh3s6v+l/8zzG//9F88xyAAGYuEGEQjCK4GHA3M3hUXeCzYgAkYSMEAKb0dSDgbi3DjwW7CDgAlKnTCOH64uKdkF5+gADzxSyKKqFlMVlKSTGEyupiZXMB6b1yuwX6/ZWZzuPmp0i+cL//Km9zhTBHRBqw7WkShQQ7q//tQxMQAEeDfTi1hkQFHlO61hIzeGFQi1UFaEqRNqUwR5HTY4upkbn5pb2YQ8n8tmph1eAWHyoiY2VVHI1NkJ0+a1r8XUS7DelH3ZRO+teQ4mvZ56srHsz5nYruX+jwFACAVeVSBRkSXnmmQysZEQLgiAUkJVzqQKszWhZgMSSLwoknEWkAEhZ7Cx5DVPHuFjwie1ljyR5OVihERPp+wGj2bbEXuWatgqeLwq16utX3/1YTAOAAGkGVQBphB8SM/zgqmnGkt9gyFotJErJyWx//7UsSxAA5tm2LnhHdZ9jRt5MGyvpCBKBRSm8fSABJhDPmNj3KZe53trBemVDfndzzN8G5bjxZ527qyvX7Uk9Vehj/fQSeWJyq7/QZqAAIAWQbQ6I/gdBpCJBcpA1vBIHMOT0HVUJk2nFS0BOUcnWyzJgrInQEJhkVdBoiMDfGhkWrAPmEHfK+i06lhmgWyWeFc1A62qY9qH4HM3KuVouWGpElI0YRJALDUpp7PURpctOLEIXAyjQPBgULGSYziFcWeoc6svAMuYVNlFwtQMC58//tSxJaACohLVswkxwFQE+olhI2YuuggNMb4UHgEr057nmUsJvNT1pVASUfi6BYs5RbUp7m/GQACCb9X2ZF0QD1DFh64kfIHJYVgiVDMjVXDusXFIqqFsNIQKlR6sk213cLucXOHRYVYXPKecFhxdDD4qcdrSa7dkeyrrv6f8WhKgwl25QALADbA8vBhFmJlq2RVdcZBwnuEU6J5YXlo6KAbWKGJZlcRQp+2YiiRoYbsWOgBQEaJCqGpQkqo09JoEgVv2VwsPUIRrdV93VtMMpv/+1LEoAIKUENPLDDGwU2J6h2EjRjfrLnOr6KFAQWY6KKJDGxotKCvOgMU1fl3V8R4cDtEX2lRTPButPTMrW1Ux99UxL9YBCBPmcd6Cs73k/LRM5Ovf6lpGg1HcgkCDB/t6/u3UdfXFe/5RQyomFTRDSKHuekQNFuOrhL48yTCOTqpWL7kuSLgnGCIBnCSbpPh5ZiajgHBk9YPODcXex4sDQ1zU0PDwamwjVW/sQZv5wfJabPPrZL7YgdtraoIAMwMMBFagR4Go7zc12MmbJQ6Lf/7UsSrAAnEWU8sMQdBSYoqJYYg3AYkrysS2kokStLk3sijh/EgRGC/glPLY7FxBdyz+NVP5HOiehCyQ4g86Rv474Tip9R277In9x310o+xu+iAtvRNy3uNLqVLFE0rLYn4TUxuq0yXaQupx/jvLkPwrKZ0wvxU+z4EDuCsagJJepvKlsQWWZZA/ugmIaANccS6NF9H6GHUvqFgLu9//1YnYxbpmRwL9tUIXuQY3Y5jsDGF8S0vahUjQRBEyNuDCrIfEpIKFVQ7Mcpg9pZ2aETD//tSxLiCCdCtSKywa0FHiykFl5kYrYx2ESKziHOQWZQtcVSYCqhp01hHSYYtanKSwkL+lvVobdo4xdyKNu6ZEBBhyABIaEZnzPgpetGA0ZHD9abkiONUqOgncNyJ7etV9+GHbw9Vyy2IAs6YWF50JLWtzaAOLEDzWnnxTRSeSNlFMUoxr0uRNu/emBo7+lAIBAjihC2aCQ5eREl4ERkYgsSYKx8VCrB1h4BgXBIkb2Y754A2kCqKE+mV/ObnTY+mDldyIadOn7UQLmnvD0+s3fL/+1LExgAKIJlMzDBngViQ7HT2GTwDCk/QlwxNOmLhwyuu1Xtb12gIvft2WJMJ1dDdJ0IYj1yhLwFTgqNRRh8s2mvtJEn2YgyPwOW0pSYLPWK0CMFrzoDOONXG1mhh9T4uq5v2q7Bw3RdamnqsvS+lR8rlPoTVBygABteCHDFZDS5pBYiLSwdWSxCAH97SUNPPUMumrcf/tlNDRwAK+1Y2jmZ/WLmgJABQmMOZhau5WwjSQihF7mWdNLdPO6kI+X/+Hd7ojK1/VP+3b6b7c6VFof/7UsTQAApAY1lHpKcBP4ppSYywEBRo0lOK1AAIuIpMBNqYgYKA1QCVmJqJg2q5DjugnLu7io1IwqVjZQFjcrTgcfAHR5OHl/mUrBgIxl8v8MeDPtUHsEkgUudN6iZb36T+813Sd38//y+Th3nOE6GX/8e8epx64N/Ftf3FAALORhbZJKibb/KPFSjTXuYO1J8YiJwdA1j8RjIQak7W1ld1i8Kxyag2EGL+oFIlqHqyiipWlUil5c/I6GWpQGQwX5oiZtqSlSzERNROSu1yaYoo//tSxN0ACnShSKykZ0E6Cev09JjkyQa+oOKq9ekqAGKwjGqu/SuXnqSMe4fY/lQIi4hPHQZkklfGOl6lmySB2jIee4ZijZTgDKJ3O86BQp39iJorafZlU95bCkIvip17LOhEfjXhpqiMwgVY1ZlBA1o2BhLybIoSvQgWABKUKIAFpYFCWzA2GY47aVbHA7uII+YUXWx9Hc0sJatDdxq1NY8jkKkGAAbIXQQZgynJN6Md3ZtLO1jPctd0386Ua//eyXTeY9DbZXZaL5zSTtOs7uL/+1LE6YAMHWNKzIxTgYeS6nTxihmGFAUZWz9KwA/QKcKTYYACSAWALUuDuDWOVAqVPpstxjMCIVqJP4aismY4+MCWfUBCnHxxCV3tC866sZczym8OxytY21zlwJUboi7rlrO8H4q8EvqEJDPqFrjOBX/Kv/zBqBaf1L3kBO/uv+oPQnwywKo44xiggGEknrgcHaErLl7SoQnE1Os5uHVsDCcruxNxV60aHnfz8o1CXXjxAzI6MQFlU178bBhFNVmRF/5vgxh4mAUDMFzSdl1+gP/7UsTmAAucnVOsMGlhdJYrvPYItAqirwItoUcl2wwQWXGhDE4YwWvVjZWYJokRZdeCJqWdvyuMTlfYYSDzE1IluhqNEQZNFA5oRf1zadRIrrqbaK5SczfJm3WX+wcOv9faObJnd/l+44vfSKMZizWNbX2WOL1jeGBIWqzhKmNNltiGF9hOhRQk9/mBwCihIMFC8kHqEtP/Y7DhYYcYdN21C+dmbsd/XbjWb8LsfZvwTgil9LZSsAzEEJkWgqmq/IBGc3sjcB/n0fWPyO/HWUwN//tSxOcAC6k5TUwwR6F/FOmph4x9jZhhJMGFEHbm1E+3kVF95GbtYgxjvRt3ue9+ThlTlD6olHumj2iSSb7k5JRBNSJwgDBP0fxfPDV6nP71bf/k9qFe1fd7tKp5KEajeQbSYMtDpAgLB+jYptGKKeqWDGNyQHTySuUrqfuOx1Lclt+oJ6+WdxatApD/oMZozQ+wvUcTMeobqFjTD2vq6BMXA9miZuf7iR4mM+WPDfyJeZ2iDIEwG+2I5QMp9tixAh3JKzPKbjc1kyS0YbiHjpT/+1LE5oALTO1dJ7Blsloyac2RsjFHi8idNEO2jC82EtYpio1SnjLI7X6///119uvrz7VQZsisJCjZLJzndaJAIC7irddgvczxtHUkcREWBmhmSdYfJSxyi1aLrczrMLDyGp67ipcVTF1a7Klxv20wfVR45M0Ky7LgwEGng2EgcDYJINqyis78WFhRPz7YohoaQFXq2WrGmSMVTQgkBWkiq0kjSRi9chISVvDLRTWAtETOOvTLA6Sli5h4Yao2Srqqc0Y0aQQCLWHj55wgCjWpKv/7UsTMAhK1h05M4SOJvCbrpPSLGCh9QcYN1JNh1ymXEiTI2sfbu1aaejVR1IOBqST6lUGxN3KlWSSYz2SwCuxrWLqTlAQnZzKhokZE5CdssvBWM5CKB1ISrodatwYgzLavOxBBnflbTRW/30W9ZUOd5xBGpmaNuDAuqdww+hKaxb67osUNuXs3/pAMAmVvckTUp8ubaGWasg+y4whKFdMWHdGTccEMcJTXzFF0vSFiFRIEfVzT3LK5FBAoCHKFBRaFjFB4WqTSPa8QPf6FoEqP//tSxKeAC6yfXMwwacFLi6w09I1QTFnp3qmrUX+aO2v1ySo570IVAABlylshGGMYTQjZWoFL1tg2ophRU0h125fwcq30Edfqpqxn7kVOxTBTuXktXM+xlt/y7M7YoShgWE6jwLAIuvYpQMJDs00zcGVnW5ItvCtIlTQpAWH7D18bevlv5hlX1UC6QyODaleLYTFYMvg2ZR4WGg5KDao7HZKLaJ00FMRWKVQzmmak96k9KFZFdtX2/dcy3dGGINQPPHlvvaJg04DeqIzZtxScSg7/+1LErQAK8M9jrCRK4V8PK/T0jWAuLFAKsBB0U5Z6FQAAHVE02kCosAy9G0lnLm4tnkMkBH1n0QDmWhSTCSAvKIrYjKbGYC7ty0OnhijZl2Z9l0/Lhw/5XpZw5UGj72o5XMLgENccmBk7oXH6cCveGft0zelGIKx2SSJpMFkypA0B+H2aE2oKBlUh1aYIinDS4NYoufaiGIhNDw9RLSoGAMWGLLxM9X11qFRIXQTBMoKpqvYGLxVDyMJJPGKtZ0q4bPisy5UhIGRR99LBsHgtk//7UsSzAguQq05NDFFBXxVqJZYJWGLmfSWOqMJsGz4SrmExEX4b0uJTLNYM7HW3tln4X1lnfm7DsRulclg23YpUubdHOcrA0MDWptadYR3JKKtxyGrTcipdbaLA6AABAEAZGnKFFh4YVCphkbkN+8DbLGEcdmuQ6iwstRKz8PElgFHGPhtMuQGETKZtWLOqRn+PQsdi6xhU7WeFTEdK/IXYwiLDwkux/GShZ++9HcpBJtuALjQMsMYIAHiOq4UVWKpaUQChFIRKducQe8BerJut//tSxLaACqCtV6wkauFBC+209iCmnfA0BAx36GJQlUb+vnnm5vdnkP9s4xTvnjUWIQ2hzIwA7xwdc3vouWtnQv1NQXrAB9kZUURdkI6Iy1hEZh6DrpK4JF5KO15WBkJVBw/CrkyRqRnTbOq5Rc2Qc8MZQTfpehwqcoDDmiEzjlplGXVijihcuaPjBzFHWLfc1cUe99QAgLNUIIUQy7p4XGo8OlgpsAGA4QxTRYCKBOZKGTf2BzXOPK4HKxe/WrvJFnI13FlpnOrB3WyV3chGcjP/+1LEwYAKVK1jh7BJ8UmPabWmDVCyu+zuRvt9PX/slaHVXXVdGd9WOc53IRaEJt0rITIxwRI7+mIwGFEucZUJpZ7GG0KZkI5iMwDQbCo3IB2RHowcATBAGS6T3glVBnCiyIjClg2cQE7EHr0h2XSGLoiWwo0S1McJOGz68pDUQSPRlCH0bnpFV2L49FldEsy7r1EHabzZ/cCdyX75/mZ/u/P37tXfM8Pvhv89T87T1u32dlRMyzihZD1Zb69+Fm0es3XMNgcGyPvRBkmcfFMf+v/7UsTNAAoopUZtMGrBQowqpYYNJuoAEGMRnkNKZ5HmlGpWDFU9AoqFsSx4JFSEsBY8PAgLnzNkKHDowFE40hyVUzvyFx+VLFYKIgcNL1sw2S6+vX5HqXUe7OSTJsuNKICx5oLHyTc62gEwEQ2pNJG4yqAY7jJ0LmjjJXdoS5jviEhRETqIUshNLtTOBxpdcEgWJCEHVnBp2WDzFkXCq1pZJrY5b+TA6i7w+mDZA8TZ+rt+9sw5YiVuetiA/roFwOuzSWNoqDBPJNP2E6j9Xmm7//tSxNoCC91PTMywSwplq2lBxhqY20r19bmC5v/QwKKLCq3Z0+3m8bSlMhBMsiD4ZjQpPOlsX456gsLDRy1FHL9EdYv4qKxVzshY5wAKsMHn1VqYaekDZzaHd412kYdIElVSWhgAQDoguGrCosLrvBVRE5upcYHVDUNQ5hr1RpKav6ocx0MqmcLhaqGK+OW97z7GIA1Oj//6m7IQcX1sELrr+ZbGVQCAoYrJCiiodkSEPVAk3nkk8vohko/RBpGIia6CcCdR3FwKBCxgVDhUMgb/+1LEu4AKkGNSTmUhAUwHrHWjJRxa3OComqSBQS1sNA0R4rQdHrQLLtLafrT/60rWhTK8XDIPAWzQrcA0DZfrrGWlTQrg+VL7anAjdI2ovbPUNlMtCRURX1UmAcCO/PWOCj7SpSeXD85M2gtIoeWKqGh0ETW+In7XhZxBDkhYJaEsVR9C3bVMo91mN3sanqUOxbT/a2tpukiwdJdCnMsFVgQIRMdB0VXLmEwJISfWmQ8HL3wvNEEkqPjzHeF4dOsbxSC7yLMQIOIRO6k36wnETf/7UsTFgAqAbXenoGzxPJBw/MSVLrblb8vN0pq3obJH2mZUWFlceAkLZPbrWkphTliJkEuORmRSMF+eyvmXcarDgtg9nPVhQw7dco/RTpyTCJO357j1nlOS6aBQGnwaFlk9iBgx7HONUsXVF32dH8aR/Suq4YlXIIcpAEMDZ5WNd/ZbxW0DKETUd7CdLGJLEVFTvaZ4R/ilI2S05nZAESrVe1o2VNX7/tedVG2QPvqI+Z5QpjUH2WE4drFwoNQGklAVACwYn7N5VIs8wha6zOxD//tSxNGACiw3W60lSMFQj2x1lI0sXBVKFdV/9QAGbX8t5hlODQWGREYCwVfLRQ+BVgKhLE6qnajMpq0rUPjdHDJS0EwIsR0xY511NH1K9Vcz+5ZB8cOsctdX5T3RyO7OtpFKdkdFb6KhyPTmtbbQvTV99FvjLJDmr7bIxFvUAREksrkjRTAfzt8c6AaEJyb7Azu06Tf7OhExTghQi14BFNJ4TsYSFIkJk+It1FNWnoktJ8tyzPLbt/6IW/l54TrX6GHuZoIAKdEZhEmPWkDuAj3/+1LE3IAKVEl7p6TF8UyN7DWXmCzCKDBxhOIDY04A3gA0okSDlEuTHaoLBq8lriKbU8AQKVi4y38gwJ2DAVzDrsqHOsWPXMWFSI+4N7KfzOh8Da0V7qh/tV3c8RMWOw6OQdY0UeHlPuJqYVi00/CTWhwrVDq1ITLVAiKgmHGcpggJApjxRh5WthjzvsQgSNqXs7d934kjJdpAgYSXFAoBAwenEWEDCBAAId2u7KIECEZ9L7M5MmQwmAwGAyZMmQQc9PWMIW2HzZmfHaE8zD9cMP/7UsTngAvEl2PsPQHhhyRpZbQKKDx9N/tX///1x7+ACI/7o6PgX8wPEEAAAnMXoV4hQIGwzAMDPWFAzjtLDNaba+RCSA0TMmMxS7cdnSJL7ooGuafn2/SCmysiM7NKz07WPDRZaRFhzao8u3v+rWulk5znqRmJcfps/MrEnybbnOd7SEsp6nc+dDDs6dQ1pJPt84lzp4HCSgE/mAABTtFfISaQZjOpkxGJUTx9I+ZJdxJbPt5KIBEotFKS13GNYT+bqSBgoYlJL123FxFsH6/T//tSxOWACmy1aaegcHGMFqgJvSA4dPLzL8vo7nmEB49Vd9XdWynQi8VpA66RqJZUqmSj4unKFC4cWDwseKCUXBwI5FzjLVoOJPoernsW9PNpR8b/J6qxfxYghkOKuRIglKGCW0uY/1ZBDsRwvKBqjXmDd16pgHi8u8I9Xb1W71zK84dRyasNpNDpskV4oi8RA13lRGE9RZCxnqoQ6q9hLY2rPHd+pTEUuo01xqKQUnVLqxCFbIBMDARibpIIYmFiYARoAoUBBCRSaj2jee+ss23/+1LE6AANgKVQzKTOqb2rap2DFbk2dIAMqdFVJoErw8JjZB0NLJC1bkMZczqV3Xa36EfXtI5clbUfkUK0oohyR2SNolM7y5LgtxVlhOkfJwWNHZdd9cdlog78K7kTdWIMNw9RQKbSPQazOX4ZE3+iLYSsMkPP/er9HrSVx89qvUfqQqscx8KcNMyq6OSuAAEia0TaSUsIQegUtG6EFutIQl1dkmi7AZ2keGRtyub5cjNOA2lqSkv1xAApFzawCI1WIG54QvJLdXxT0qAdD6y2pf/7UsTYAA+ZiV1HhREJTAxsdPYgaLRpt6PM3gpzTKTTDPd9YEUk0k6EECYZaFIRbCvmWihY6x5fwfJRrIyNfAcYWPrDwYwKvNkMIxQcoUiZR0hWns0qKSbi/TKpRo9jCKAw0illFmvNwsiUXeAvSyNWRdcsy9AjAARNEkFKAUJFRCBBw6UQddxEchtGZcgUaImiBOTjYUJHgQ2Kg5IE2RRNwOOUQjOzjpaAZoolh97npugzrT39F29D9WB6pFBO79O/nvz2pDUvxjwZeSPy5ZSL//tSxM4ACYRBVCxpJEFDky309A3eWc8S+ekVRwAEABkoot+kcuKBlQoOFpQhZB6ADbpVVT6OxJdncTCVMD9ZwftC7wp0iRSIp5psN1Ryu2M08icyKC3iSSUKiJZtljOLqe5R15BLxEI7IUPAAGQWFh5hz1LmGpsJ0M04xNUlEOyqORpkoKYgifNxEH+q2cBqkTjDAB5MU5tk2sDcL+CaihlwKYd8gcUS2pHWFQzufGX564Y9opSXhXN6XjMZfCK53y+TY1jCVELDvPIvFHToJKD/+1LE3YAKLFVbrLBsoU6Tad2mDSCo1296YDSiwFZZpZW0nG8nlTHJS3PDPIfdAdOF7+00eE6Ih1g7MnEPaLyZv2z6Rta/H/t9+Z93K1PwNTq0TZSmTdmtPo67LRdEttcnmbp+q9ebdaJsi6sTupCFQrGRxBR0uWjz9SozQBRlZo+1kbdGlEIA6jJXpfDxKHsYoD5lpk9sS7ZlgHQICT8/RVEmbt1d7nrQsbE3Zid/9yIOCw7Z5yX8k4ULOnckouUIVKTOLqu1k/ehHulKRRzCIf/7UsTpAAwoSUlNPQkJf5Ir/PMORIDz7EMrfKVAEAYybuRok1R9pdOp1HnYgxG0HiIdpD1VJ+6nPj8Skb3gT3NPrptjnyPlf0IEOV1z/p5tEqk86zsFwta1oo5okPqS2Qewqp2MWwrIr52YvlmAsqZgla9zjiCrHMbTWK0CIONv26OMrEE7hIItej60AN1+wJOApKDBggC4Jk6NHNrki4rfq4jAOAMDYYDAUAwhC4JgbDbIBwBidtAxFGEQfEAIUCgAccXRMWNS57EsSlNIp27K//tSxOYAC0TpZ6ekbnF8Kq208wpmh1fVnBdagwA335APBs7rQ2wE2VPZQcOQqHQTArHDxoJhJQaYErrBJHViSVVQHitQ85GC6pvGYkcpKkwN9Qn8tO1Tg8Sn0qB1BsMVMCIPrayhby5SsLg/bWD5+qpL5v9VgOuFQk8Y8KnbRWsXe7n0/j0CAABXACKTKm+fqNuiS0P40nnO5TUXNyKhu32OSbHlHwh43eFUZSW+Jg8/Yne12PNHDDDT5KIT3ncSU0rxrNzXmpqyMUvOEup1qmL/+1LE5wALrMF35gR6MX0TK3WUjaTQhVV2LexF8Jr77bCiO10qqKVt/E9juI71AsnCOoPcVEaiKZJI/N3tlVPHf1bHm50dQHx25wCBorIySAC48EXdV/YOtdaULPfWKzIENZzB1g0PsgtIUehoqHKq+Xkv/ymgOsIldyZWNeKtZanrOrG63b/V3TrjqyRhIu/V50KZBvFu9MiqBCTUQAHQIPC/CaC631ckZJPc5J0UtxHY0SkjxTC8CQ5qliqhyyIpQCpgKpEwGQUCjRGZLHgOSP/7UsTmgAyUbWOmYSRhhIutsMM9zgCTCDz3vLFhYiQSxkSgb7L7mKruKflXWrS31SrkBmltsjSJUMwsISoOc9C9dMh+cBBchgwd9WpGh99MEuZ9RBauWdHF3VSzNoWIBxdJglYKKWgqK0Eqnoi1Y4dY8hv2af9yrFXa9Heg20Za2kmA445/srrotD1OVTFxoVJNHwqLJNUzyvmcoZ4lEwFLhcoHCg8BDgfAZBZwRlXLDwFcKRKSOtNBaeOiVawyYEtDnfFjyE6qFfzvr//RpQQD//tSxOGAEAExVswZL8k8jmw1gw1YisqjoKSzd0AEAN2WrnG2YibGVtNiTYYRboPr1Ec78sypc9bsza9KPdvb9u78s5dYvafIBJHIBgJiASy8NSUpEkyYpL+Uz/zzhtnWrKBASsJFCRSswOK1DAwwqmsUcbMnT6EC0+XQ/hNTIyQ59nn5OjzGdlDOEjVdowOqqNd1V/VWAIBiskRBRJjR6StALzzF5mALbFBnUL6VaM1B2eZW4FCNFHbpmif73fTn2oESuLek2D72G2JTrh9CYxz/+1LE14AKXDNVLKRIwT6M7nT2IN4feXKHyhzWKCBykJN7PlwsckPqpkFCAMAoA12SQmNGYzbnq0JzTGKYWhmLWj3pAcBLJnMCc3MR706JEK5K5ku7L15nzGfUpkzFCsD0UnolrFHrKoPa6LKwV//eJQVOqjAoyhRGHWgrOgYGk/pqJAEaKbSyoUJB0MH8lcPBpB7V4ZCSFo/vwjYo8k3THyc+WPdMO2VJBSHr2aSnroC9f8yyoQw4+UGqLtDohLmSsCcZdgAJ1Cy2l8gfZ8ovfv/7UsTkAAm4S2uHlG5yDSxrdYYNvVw4ADAAh1wyUWuZQCJoc+MJSgkQPAwsLt9cYy88ZruG7mn3ueCGUKRsGOgK4SSsIMUZTnR5HTQ39KRS0zBWl4eQhu0gg0+GBGfGEQQqhVRBZtcPEnsrPlz4UwxF9KuJ3wQQFXBIwtcYfmzBhEj+MAJegv0X4j0E23uuTbhPzAFGMLIERKGUVoNXLKpVaYsmB9rTStSarN2yj7omDqJQkdOxxQ0VSoKJDkRIC4NhpIpdyULh9A0gsdX8HNUE//tSxNmAClR5XawwaOFSkew08wmk8GjUnhr5Zp7JUqhpkDV+S/MQNcv7HxURVFEOOyf9LY5B/Mhln0r35Uo64sOCGLnJRH7Zzhl7i3WOLaaK6kTuCOUKMkAiHyhkWaPfPk3hELh4pJgQaUJreg1v/q/3IcBDAEjzQqtucBjqAAypAAbVwZSqmxvJxL2YinGjBos3GJA4OQh1UGAoT0w5jeSmisudh/3oUraJGXedRx6kOTcWllWffyZkI8gkBcR0k+hgNB3vi9WhYvvo7uhCZFb/+1LE44AKHIthh7BpcXgVqSWNjOD3lnkVYvdJpJ+UtpQD+w4/Qt66YfL7yAoUDGMcm+mILC700yUAbyEwOGADNSgDD6YLLHFnELIPEKM+t5idokzuZT7Szbq2Xp1SJYZiQZAiVheltJUF3VdrMVJ5kRR4sdGVYm44eFOhBqlcrpV7DkUzprc6NsvvZ2IjUodFZnjDphIABEBNFxdZRwENi+GS9DEu/QTVEBhQFAHEEcaeA2GcNygmRJLLFsE5kkotMWiXkgQqjlFWMPHJi3FCqP/7UsTqAA6RF0bMaQbJQgqtcPYNJpJQwq+XyFM9DnGHw05Ji9ChXeAYK+2/sTJT7gxcJmQmkPaG052ge9bVdP0gJAEOiszmbQBogrNGCAwHs2iEwfrj8XAu5Swb+SoKNBII/ZDZSgwBAJEWEjSIEDFpEs9IMoKpPgyblWvWfWHVv/8893Q/zDfO9FR4qHnk09Dcag2zdba3GkSmCeF4GYvLTBbEwI9EaQSLERTMmuhiaSHw6KkTouRDwgQHlPeaFwbHhMAzoqtOG5Meoc8PLob1//tSxOWCDry1VS3hB8HBoiuZthU4vb1WjyeF+oAF3kViYBAk9iT3yveCGANTOyyWtIuhXit0MQg54K1gSYqoqxKJMKmC9QLpRAtYaK6WUto+fX3LZwe3pOlRCm3CErQtoGHvetaJJxNqErAIwWFdXNXr+xDSEKftZjpFFQ6lf/vbbI28IROS07jBLFk90O2am20rIq87QlJwVmzlWw8bNJq7W0nJGseztVT2w0Uae9I5lzwUagcmxQ60FTi3HVWQrJvVXvvns39OVQCwjCaTpof/+1LE0AAKbIlbLaRowUkJbP2mDDQCmxMqABHKAy4cKmuPFYhKM0dDhTZlDhFBOsFcBJGfZSuCcrv3Pz0ZpacWMwkUCF1DMW566bY2mxW9KKzHsfVXJf57WoZsg7DpCGxdkuMiVeuxryHvmlTKSINEBIWSRkWqABDdjqUabcB6R2W/QFIAF+cbuu0WYHKeG27MI6+7WnQyi1NeugMETIyYPTu6zfUIyegyLItXm0WI7uVy36z3IjtcyTmMZ9umSaiqjuzsm12bcvBl1Vveuj8xVv/7UsTbAApELXWnrYAxSQ8sfaeMNOdX3B5YNWmwECq2pX20HPKKmgNm7RYHoHgVhkTrzYyNbxtZCvWlMSM1yBCwb0CDSkjkQBO1nEgSHQ6LQ6E5KCRPkOZ2SlyIK2AyGDwYBU0kDark650OWhq60aisTVjwVHim1iZEsG+7a7S7WyTXTYagA0EwvcTbXtGqLUzcgzGjmqwhyIdA1wOXmeOiACTEn4NPgRJCBhzWYkigW5Y7JWjWmsqcQc2CPQ1ZkrXndtwa1WD429TbtBqKxym3//tSxOaACxx7eaeYbrFyFSjl3Qw4yG3Qv3s8at+bpqKWU9JKIw7dFG7lSm7W7ci1WVzkCSqH7u687btwzNTUxUq0vMsMM93/3Y1GJ/8LVjP8O4YWKuOf///////Re8uPEiTu4M8AAAAVkiWRkMzl6SSDYhAAMtKw4SGyZK8HbQOQAqTEQEAgNiCBq6VAFVAESu2ruWRg6xNABShhPjiU0giB5ol7I6iHWaarrAVTm/YWyP5H8qIliwaK1ljPle/cGtR7Vk1fli+/TOf8skFRsqH/+1LE6YAMUTlRrZhRIXEU67K0MAbx7QrQbbe///9RxlYeacWIE14L3trLC3jf////cG9nemm7Q+zJO8xv+r0r/GOd6gUxLdK5JI3AIRZLk9Jbk0cmvzweHScTtdC4oQAGswpRpZrE2Nb7bOJMD55aZlW/nX625uumZVqOudY5q+ateIW+r2jni09ei5u5/iav/j+t7/6vTbMSmihlHQQDvzSowARr0UNZE1e9Gllr2g1AkkBGkXDOpYJdirLZw/zd75TJmkWnj7q/l7Br2mRmRP/7UsToABUJF2e5rBAaayPp/zbwAII+mX5Pkek/p6XKF7/L5uX5Hv05ywvmd5BMecKgz6pC8UWdA2sO9t4AjH6LtCIBgSpBktNlSgficDkCaJ4f6yHefFETDVxj2ymIcSjxsYIkPcTzwIhEAJHA78Vsw88DA3ddgZubn10tKuLQGGEAzxZCFfBLdNXhG8N3t+mpT/4/Cnu6/wp/CKf4EQy0/dnkMbmPkOmm31r1Axmznp7/giRelowf9vuBgBAABjqtgluaAFDWu04RAg82elkN//tSxKSAC00jZ7z0ADGBpGrlhg0/QVfhqHbEfh+Ndcpgymr8r+IBSAwfEBIWJvGKyCZxKBQoQCyNKbSBrI66CgncbkiMkZsgYjsULQSQRSlKj4eAQiVM+7uy1lhAuvBAw9MhhijiEfkH2bJ9OH3N88zMaOn6nmRE6Ta42Ixm+6W3h9zyfyy4Nd3OWY1OGVJErzBXFQshrmgkSS3KP85yAiGCqXUxyCUsMoAUQrCEaJ2k65cw2hLPyV57wGWokLWKGqMcF0cttNiL5Ki2KqGUbJv/+1LEpQAPJWVXp4zV6k+rqZmUmmHLaKsVYDjAQRfoxWmbEIsSqIFk3G5dO9BiUqMXsNYF1x6pwgg8k0Nsul1hyk0Pp2E9wbk8vBI6AICUyWoACYhzlULeX6yrB6CwuyOxjLRBCfCcSEqEblaWsBNGY+NzICZSy9gQo/1VWYmK5Z4QWaOGPSSLEgERAQptYKxU6JGbiVjVPGep+Gv1Kfq+ikIwNoqGfWRMp0QAmCqEYOcJg98P1QmGzaoRR1oLdcoXuCgVMiItCHMgUox4yaizA//7UMR8gA6BZ2GnpGkJUhLq8PSNIGSa0KuEbTI8SLd2Cr4vUBdNnmsg+kter1AFbKemSAAAKiUgA2OsHRIul9mv24uQmJyn3PnbDbrjtHzLcUn4q+w6ETyDKAg+ac0vYKWoOpFVHm2PCZ0DHjQu+YWLiW7sXewUUSEczlllrtdt7ADoEUMFaHdtrHG7zMkPFEnk5KBaGvBLUB2G1lRWPOf9yhiNytWCy3IoJxYSnlRxICIUeJyTwuVOxRwdHzEGTpi8kGXrimnbGtps5ZBZVR7/+1LEdYAJuDNl5jDBoUEGKfGMsMC2ySleAeVUAgLbFXJWy2EkLKMAyBePX4nYHJ4hi4N8VMTBbSJOsT4sNKKS8B44gsETqXMvzvaVy7biZs2ZBg2MNEkC80pYqVf66ZtyFioaUOK3S+ljt67WPjYAgB5JJJlFQS8ABVe1JlNPBhI1a0aG2DWMYjJViz4VryxvBuMVcyN95lvUz63EJJbKSlJNtb5f+5HhsSWDlnUvzx13ip1Nzakq2KOhCAVLWFakpIiW2aWRtuBFksJWuz7pk//7UsSEgAp8U2HnsGjhS5Jq9PYNjOWjJYXZGYs90u4pA6wZB0IG353mnYezAWHi27/U7SlcyN2ffP81/dqtfp6i0iAwboXcJniQndQ3HQTqFDUTGXp0MikxbdLJJGmwmT2LYfCGSl+JCamjTgB3peMhgcUvWSFMgY6jHh+s+DJWgEW5yF4saENYmkd/+YWJXCnjY6RSSZzxYOnqtWp1x0q9E7chKhxBWWHgBXskUmnASArfUwZCw2aeEYGHxVlJZ4QMp3E5ArWx4iXKTGEmNVQn//tSxI8ACkStUawwaSFGmS108wnmakkekHdnP/tLvoSlw4XmnmWXxURnccMxUmcBtI+Y7ckVrASXf3lCDfEuigIEAlOUCJMz6xQlEQmrbVK4loGISlm3ultKxbdZt5eHjEKagLjVmBztD6mPBAOMgcHGpBoKLSwuusDWBk+SOkf9EziGh6Y7Yi7opcGqUuWkyHLJJJHHICYHYlhuQh4UA4M3T9KXhkwPIHlmEBjpcj9bNPJek3vZvm6X/7mykAQNQgo4LuMFHj2sEbiqJNaYZM7/+1LEmwAKTJdpp7BscUiVaimXjRrrrlpaD5/o1MuJigITgz5+AIAZGIZDQaLQiUjEgAaVAuqyUDIUCl/wEcLOOWVTqeEjgrGbouKGQXIAgFSAChYFczMJLzxBzn8HUHLhX0qS4bilIOiAwlXRQPVfBsT4LAvapTBToOu295NmkSGuy6oJYSsS7m9h0v4+Y7vFFtbi2YK5ivKuFLbeb+f7e7CyPLYfw76iT6tv0t//////XGvvceFBtZzbPDQ94AAAAEJv2xuo8cnh3Ox9JQzzwP/7UsSmgAnkS0Ts6QUBRo0tdphgBlQoNt8ZBDyBCEEGv5y9rU+qgtG1N9uoLhgJlwnv16y2lv/+lb+XEA2kPuufU4HwschkL1g+EGrxATwQnPIVXoUVj6Gq0mImxISeiyKUyi9IopohMhM0krE4X9WI6LRFO210qGdQurOJqjw1kjFNqR+zE+p6YJYtVyjiR2YB44F2CrwGaAAbjaFf8maqR/z/996IgANNpvFAFcRnh0LAuECgpRweOxJTOkAhKqESJYtuLXQ14QqPQPItDo0+//tSxLQAExkrYbmHgBlCii3rnsAACg8SDSqpFxUbayKIDZVQV55E98W/thv6VbBe24gMeJWCXQPQ5JtIiQgAAAAX7q7Yu6UB0z+RkiiypyHLKAEDUA4TA8Bk+uJSfqtRLsLKh9PK6rV+pPy92e24u8WFKKtjbN8W3KlXXX0q39JW5b2zAqMa54Cr/+sjAABJKj1ssedlLrP7C2ZD2F0iwWAsKshUjETQ8sJFWDzagUKB1CjkWYSm7T/l1RiGkhDJhB95l6aH4+5pevTuo6y5C7T/+1LEnQAKRINiB5h2AU6J7SiUjLj6UWLb9oqI3HcjtrcqEIBLJITTkm4rFQuDVKO4g9iQyD6RslTSHsQoIssyePFYjbB0KGKA8JAM8Bb6DYenZCNLPJWIjxwwjY3ci5iCbqxVcDLCguh+GqfLIIoQSdyJHSQAAAImRRVxnEV1HWmNFIUD43YFQYAHqI0YTXNivPJFFSxlFHF0LWL61vMzhwAtZKDA0fTLztx/QaRafN0r6PdY6x5uOcLWj2oQKFaB1vRVlVaaAMG18gUFR1ba4v/7UsSoAAngc1ssJEuBRI5rHYSNIHLbA5QukstcHhWOgVoHkQJnBsZTIYkrtOTYNQ6Fqwx+1L9WNWBCg7KD8kpS1n9XWOJAy5JJn0RYGVHjt6JIKkirhK9lOtzhZ/2obT96/pYWBO3CYCaHQymGgq5KY6Zmd4g8wtVgoCBXRtt7lfc6NJr/Kou6rTM4gc5fDpAzfbw+WMg8/5es5vq+hlB+/v8zjf19v5/YHwaeu7UKjwqoskAz4t826SLSURiT4XAsAx2YALZShnCmj6MzaeP8//tSxLWACkwzX6W9IoFIjmpdhI0wLPUR0XSrUsLeclXZAcKdco2S2SwhowoWCAqcUjEBQUd5doTQ3+fo0aboF0e8cL9WwtANtzqWytzCwXJ9JmvPMdozI6hZll3PAWZYbAIzodQwIecyTHBxcYfeYTeTDmZJ1JHjic2YIqY+dfShutNry6HEO5ULIQlZ19Koui1BlPnVqm7hra7b/dJeJhUQAmERSB8ORbJ0I5JmIvLXPrQ8e+/uFNokcNDlHmhcQKQiAQGdQgXEhx60iUS1cXD/+1LEwQAKgHFOTKRpQUeNLKTHmDca0YbuRqt4aurdqchZlRalkyTGsXdyRIOtFtFkGPi+oQaJkqtUHoTVgS0zGlttyCuUUpWNCqbwZxVlj7H2dEj1qEvpq/uu+NPn2qY+vWfsdYbUHcyi6YT1n9mrs9ymaO3Yi4y7piSiXK5Y1ZNpY9pbbYBCcsh1Dwc5VUTcn7I9cFcbCNHpDQLdhwO5FAgAPcklxPEjeHcnjqQkA8BGGCwRg3W3Hx2x4I9K4YmWpKCINb13Hzno5Yq3o/n5wf/7UsTMAAoQkUxMMGsBQopsNLeMNGDxedrktLRM2Pzijzz5nV8/OFkx/W8dqX2rj7XUg9wtuEzJ11k7Z+15v/f94/6aZr7EE7lKL4179FSyZmZmZmZmZmZmZmZmZmZk8PO88bNQIABh6ACAAssAoEEUkrGXrkbUiQFZ92NCg4sv9yXlcdyXQTztKnKeSoBdB0k4s/S7M+obw6kipEneHGQ27k+fN7WghMW6PtykeR765hNR5GipWh3PnGc+TD3PYqy2fbtbfzjec2+7fG4Xi/Wq//tSxNkACgxRZ6YEUmE5lSsqnoAExvr79sfPz9//e9Wlliz1jR2Kf///X19f///4/Zavctby+JaBo2iCrN7ZqgAwQBJLScM8qIxKzhQw6zBDqSiZeMTe5XRtUAwoHxwCiwFMMsPFbB4RcpS02oqo5UWiOzZdqP7I9LK4qURb1ch7kVTLlMbq8xVTi20cUOvKqTR3OAAEZIILbSTpQmkfo3Ee3qwqzkEnR1MGX3iO0ltC68/biR0CV697sZZGW/T2OMCNLGg0A42OCjhZB1819N//+1LE54AU9YVpuPYAEleqaqcw8ACvpc9Sf/tOuTU9TBwHarQLnpnM1RUuvmbaJNLoDx1L6MnFcaTQuj4MweOE50dm4+iRNojDrnKMRREOaaeguUZdCFCg0IBxBISRIsVSdONCDXL1IF3mvu+S0X3V7Pd5Qu0RnyWtL4oeiERAGZoYTohBYK3F2tKdFLl+JdOw5Ul0pY5CFrI1tMtq1D2ZtanXdfoIuhlLkZlmvjjYDSPTEApUGCaRI3QyVMUerT0ITuXOarPRqcprrrhdF60qBP/7UsSmgAp4p1dc8oABQY5q9PYM6AICBB9kmwSZ4aZhM8lhHDsBpAhGlQrI6HUI6JgGl6HMidzQpwgycIs6Wli5hE3k/2lYjKmcz/lLKmXxKZf/5gjJAL2vYk4FjIxFu4eCkXW0nFHCpSyKIzR6yTRUVIMIHy8dFAVNGzyo8fYNAcABRicxKvsdk2QPS+6xiMyPOTO3O+gky6RqDEmaUbSCqilnVPO5XIvDqHEmOJJc7XouZroBtgCHE5cECm7KCExG8kbEaR2X3GxxGgHUIqvj//tSxLIACohZW0YkymFIjmlJhg3Ybk2UKKDeDsBc1ju7ue1JbGiOzwzXg5CTgdoQOalbaMwcYNF74+EzZ68Ckg45J3CAfaAW3SAUY1SSwMSygZEuVORTZsSp2fNPdmMSCnvs0ljAiJtJHws3NePgj9LTsZlBGSE01FumOgOL7n7aHaS5CGarfhyHkhUj7/zMWQnQY/m8p2cuT00AICSRLjczItLcLrRabC1CmUKfFSYlUYPXLp/pLgYOmm74Zn8EcrlVJc1Ze+bdszbobWdwFxb/+1LEvIAJpOFMrCRowU2VK3T2DORyIqwWb1NWSiX/t2A0DLemSte3z0TB1p3O0/pIgAsME2k3AJ2KAlQfxOFwTdJl6Uq+qkmnYcdVSHClwRcopRz3ECK70MQxoRfWh2z2h1aP9mRU+lL8f3Lrcy/PuhUwIovF73l3pEMqIjTEfaXetfrVBQqiwcRISCgBEWZa4rLFGfRScbHCaC6+ngcXGDAiQOh4WIp5jMxxwjZGvo2z9fv9f//b66TnMHELktVpzne9KFnf+9J1Po1og3WD7P/7UsTKAAp8h1FMJGkBNxmowYSN4C/Y9gWdsR/5MAGZr/3JxFEJFEFFFj8AdRQBGlGZqBeMYjw4jUVLazHUaJ0oaTh5LB1D6PaSqIjBuVQSC2iaTB2oPKyXjWWtJ5sPjOsoEXLi0uOIymIC5hRBBn5LXnfUJkll7jSznacmhbmDeqt56yKmrv/lAlXPD6ZG5krv2yyGVrpuptxHNVdRnjeuo6+f/zqDzZ/bWMvbsMh2uhIoF2Fhh/////lFAFAaqQBOQPmh8ouw05bF7JmcJHZ+//tSxNcACkSNSuwwaQFMmeno8w3U/vG9PH8lGSP53N48J4UbkdZwFjVFojm2xodY1cZprx5t5tN5X0T3fzwJ8Uvt+/gRN3k0X0DixwxGjaauTpFqpTejaQhMwwwkneI0JOxJOEhoFJTQnEIdyShCslhTdhq49Cchj78mAr5Er7zrLwi8RVSclu8stE7bI2x7OZH9JDBTpFB4VrYxiO7VRVABHDd6jy164dlVPP/Seu3+7WoQJWRJM1TrIIEIBLbHQfzIdRGFrpPWt3LZwJxyuQr/+1LE4gAKkSdKVYKAAngw6ysesAIFowMSZ8knVvt5ZFb9eBaO1xIBFKVHTShXtuuBt/Y5KoapX7PbtaKhLniuae5J2WoldddAARDhiQEBk7BQypE7nfKZP+zBYBhHZeILTIC0k1l1Wo6IEOsIzOWNRHZr2+dt1dBkMj87IcZHKqFJ9OJBxFaJ621EKepvbllZIasDQ3uWlF/Sj6CVAs66BlGaoztGRStfguEgZ6Gx7FfnI7KpKDM3Pm2b1Wr1tf+6benHVmZ0hy9kculxx1losP/7UsTGgAwEq188x4ABSRPs9MMJ4GpsUFxKywyHWiRSbQzrWsZ7NHRXsoI3EPID2vW5H9wAUMTqZTRAM0umUsQd4TeAchCIyNZbLYvWVQZ06acdWZxqpqCbc35UI7jASDEuCjA9kh67ToeeDpJEWYZVpJuef6Ga7uv16bp5xnOHjx46Wbvy9XSqCD0+10krjb1z1MFyWwvEcX44nJ4eSqK6AqKEKQccpMBCgIORVIZn8otOWDOMXqUtyBr7tqyowNrc0OqshiQA6lXn9iJ99vCu//tSxMsACjR/aeYMT2FQFurxhIjo8P63asDNK0+SYn0LAIUAhIpJxDmGIIPGACsQL4iaUP1aKAm5MlWx9S7KHhZ+VDOSjZNrlzpzg4E0kSg4TCVMap+lb1VrcglF2kDdVvcdoo2dtZ5xjW4bG1gGd/V2IgEVkkKwQPAkJEJwBBczOCWiDBQUAFhxUAW8qowZvH1ZNIYCcRyoGURkaTAhC0ElyMvGqITJG6aaGAgz7nUAUIXn03jKzwuuWcx6FCgOkDowGQYC4oiy+ZRkHWpS1TD/+1LE1gAKXHlVLTBHwVEL63WGDLQ2dkiSxfvTd7KgAAVEU062nAskvklyXLUKNS4If5M96ASKCIVIlw4SERhkbWQQwSm8cSkVGrM5b0jul0vu+62bz1JwgLF2llvAODzEl0i6mgM5TSgj1BwoLJakw0oD6R4KCjHU1+K1AQAnJZgiaAjZiiQkcSEOOGeN31BlbwpHQUEleVTM5TYfHQQdUw6B3chI1iEDdUpbHnsQ62JkUhnL1jHfsQ36bqfz4CTja5HSlipt2nogI5VbbP/ztv/7UsTgAAqAX2GnpGxhRwmpqZeYoLYqb0+fW+4+FNAA427giAFaizyEBb0jWS5ZbMmAvW9jwPxZjrz7IC5WQ3SyJ7Pl3C+bOYrMb6qd2ciez1nvI0xDtmt18Zfmx7UvQIb9Hp3/5mf2nlb6v8/ca87JSTpiRJ/T7+38ygEAsVhIGWHBoELDRIEcU2uVcqPq+F5zcSfy7DLTLJQxTyquYPT3OqZMOcmdimf07rTXd7HF6u04aZRZwKgRo+5Ag7z8gcCwIEgOGAwIDgogMIE5yUYp//tSxOsADPCjPk2kcMFzj6o1hJkcRN1lHQwMF/YQ7C+meREyAYm36RCG7hFnFYHxXWTx7Lbi0PwaD2TzO3CQou8EgHHSuO7BdBubOUv/CQtenqNn+K0ITtqBnIS0797SOr1fc66f/sRV7/dV34JghAAok36Ee76KANnyjkudtjgURBToFAM8oFviHgaWB3oERWAQLL+gYYBFGA6ChgKWIA1frzUklSyOWoQNsGDFuU+ERR0Jzi9K1FAqrdW2lFG/7TKznwNWt9h6Dzj0iB5yAhz/+1LE5oILvLtI7TBoyXIQ6SmNGGmIYGgt7RrUsyJ8lKzqr6OjWVNNqsrlC5uru3+jtY/oWpstc7uQOQWcYNfTXWAwCQAAXJt15ZHUkvh0bqWdME6UxD10hx+LvRolEhJCTGMGVR0TRp4BQYpJqXo5SwUqpHqcNSxq0XuGkbv7Q2N+xb+/ZXaNEq+/3201sZYAEptyVvFdXjOwdLQxKKMplwVydRKeQSOGQFaFRiSgbV1YcWszCmThokKu0hoeJhgNPPC1aSoGSmzKKM459vpgWP/7UsTnAgtMl0jNGK8BeKEqmYYJsFv5KHRfVhro2zWza6JQAHBsK8VdKo1QzSTVtt1NdiJClE/IU+MDCiIMX0sZIVTCRUyYwICGQqDVSgiFOLbJF4fnUPxYBCQKEQykkKnVTQqrLbGytjHZwjlZZuJL6QACpJltswYO8D5lIWGR9nz/ReVPvDM5EJTGM2C3aQ0ebehbELNpjS+N6EJYtDCRfAazZzqNm5f+p2UN3Iyzar75ouvV2lvM8s/MZaIxW1T50dZHDIuz7d5gs9o6sMVU//tSxOiAEJU7UCyYWkEzCuz0x5jgNEZ9lGRyOZEjeei1NwP84121mk6S5+syufGjAMPNNGNSD91OZNEHK1qn3mAUN8b/7eXBlHYr+YQa05IeKWNNyOWqgrUH2/avlQ5HAeCiTLDuoiZH0igiBncpOzJSI9A8EivWi6aVBAAiEZQ9pMt1DMFFU7UFAL7Iionlwej8ZpoS88sPjkwQ6vk7YWmn+dlyjLAxKMSsXvxsODInpFrYRE5Qvav/QZmUi0Y3Fm1//9W+b+9Ia1etW2toUFD/+1LE3YAKEE9nR6RuET4NagmHpSDr9L/1vmzhASAgApFShVQCiqUhQJ+ipCBCXIEcUQLgOsbRYlEp5Xq4YmVOo8bMHHrA1rTEVfNspu3T0EocdgQIB4C2yyb0Yh8HPZv9NnOs2s6/i/8xCMmFWxkVStijt3+zjOc/yF8qlQADBAbbcwR0arQgEMdAJC4SqhPSVB8FKrDKRpcS9l8P5bXk4FRwwc0yaKDhucEFDJLUU5RHuRw4XmpA4/Su//Cwh9t4DtaeYgqkN8/QTXFaxVmom//7UsTrgAv441BsJHCBkhxq6PMN7A45axzWPSsAOSTQgkmQXeikJAdQdFhQdZshiPSmVysVSRTTA/TCmT0GO93ahYAUGlIURS9Fo+em2ohHO8m8JVJwZecZSFFCzzOH6lBQaUK1JUDLEMi+4WQUE028oLA+qesW4L7//6kCILcsvxUAICOGVQMNK2opU6fTggfDBeWh5QxeuUFgyiM2bPLKbKUGRKJdxZu5gzGiitc8kxz5KeefAgqwCOF5kTpaKxuLxxc2TfvNi4EuuTypcHwj//tSxOcAC8y3RuwwaYl7i+idl5jhBEP1iPFv/7IAKy3cPQkAmKMBkgdhNVwXXlTZYLiztwhVskstwRMfEOwyZV6JtFTm19auLXCKmeMvgYAGNzNT6m0K8sk/IWB2mnkTzcjcmnfZBYgdN9imgcAIGmhK/E8RIQ82oNGKO/8J/X0yH5VccSFmIIGAHWZbZdaVjXWAw65FI/6kIDU0A0FB1q5SeD0XBWKBWIANyKZLUsxqJf20OxNLXqsUpcqO1P3F7FYp5407ucKnlGtqDUjuWvP/+1LE5gILYKtJTDxnAX8YqI2HjOjf8d2v7LZ3qVoYLAAPHyjS6AyjzC6euhZlteW/z/t3w81sSmvqAACBlGygC1FqbQgAjLtAunFQw/vI5stz7vVLTbcgYCkVlMNL32/j6ZHe7JodjEFPp4wBh5J65NN6QBw4AGcgPaiDkykHdOJTbH7//LT/j/vr9v3+ff4dstsvbidh77ohdSDpBBaYDpRM5A8mYcQz/D9yHpA8nvPCHZzFEyewWkhoIryA5shVJCTlv12ZSM6/Rcxbrs+3Ff/7UsTmgguYj0jsMGlBkKIpXYSNqfa0U/SDof4mivkT5dChJsRxXjgJeIQYIbRKUcoWY8S9I1WpZoXBmn4Xc5lOfJ2F32SgaJ9iHhgDkgqqaPLSzLdYYphwY1CnViHWolnR3ZHznIjIpCM/kdX1Xe0hPyf/nd3qc7sAHnOdG+zne7mBCKzFfnITtymTtXjsyEIz458+LZbVaIlARwdG4iApQVBAiEUxgqDIJFZGkSL4zijUquep7dqEhjiEAB0bM2ypu3EdkMc1y57rAvzFf9ej//tSxOQDDqEnRCwwzdIYsWnM9JkwH+tWA0iKBUFFV20jyVNDHnjFZMiHSPtNrcFwVYjKrgGWKrgJaMskzkaBBLbCl0wkXRonWsFrINMCNiLRCKUTeIFjMCBjkdfjB0NiNVQiozNl/9L3BBNQXS9RJrSR5xowl9QiprskL/K6d4YGB8yC456PIt7qUVFxyyH4WvDgA4dtFsMgIIQ/rWURfRPPyfPrJWuDOpqWq7aA02rE1/LLT7IU1S2qvs21lsYvqpd/6ysVF+nqpZVW9Kb9DmH/+1LExAASDYthp4jdCX2Zq/DEjKjAJIYh4aWwd4l/qPehQR+Ytskp0wEKVpjQBmh2jCZKQ+Tl+52gOtxK/Lcc7yEomgUIO1VNlzOpat5HDPTfzUoukx/p+jfa5roYz0tR0ej4pDfeNXa2vc11QNsrrUOzSZWJangAJgCUyCoUBsCKGioACsFjkaRwE2AUqXXl5sBRYiWycV1So5JpBCBaB5IWVDrSZoOAA0KizT7VPc1DjNtWh3bS98WSJPfsrt/WdnK3L+9SKiE+QUczCLxmDv/7UsSqAAo8gWGnpGjBS6SrsMGKGC0WEiYG8LaRZP3adVLUuifGgc1AItE0QigQApulJkGNBUFSwGGAMTodlhzCY0KhSsSkVLULSpWZOR1lj7WLKT2prn27v7v6v/0BwKlV27LpQIqDvoQtZ1NteyASQT9m3DmGuXbfmhNpHnQ5JNqYoyPTckxnNBBO91oCMHEH7CcaUEanEA+qkhRlHIAhND3Lb/W9ytvYIAifnGsxBoqAMmZWJyppuosUIWKz0Cwctjy6kuWTexslq6eufQrA//tSxLWACrUFVUewRUE8Bymo9iSY8HEi7T6Z0jUrzwYsOPxESgrQ4lzlDT+oVSLpFWaUHgQFwFaWZJ6tuPgq5gGuPiUAhrty1uoACx1oAJsraJ1KKL2B2WbTrIJcDzJgTsIA0jidpskIYOxZuisGhbbJYWZTEjA9ErwMipY/dappZSo0YEiQuICQCdYBSImPSV4s9SudubKURun6KiAWmnGZa0ia2WlUVemPEShgsKpf9AaPso7HC+ugWKLeHaaAg04BDnm7LMyCBXeSzc/pL/P/+1LEwQAKbE1CDDzHAUyO6VmEjSB3kTy/Kd5kR3PI/SfyZoCbGto69m/95F88rQU2Ocv0pAQCSAQIo6tcOAZYnCHiMnbE1GIu28g0bZQC71m7Tb2loM7vCWFVV/Nk4mm5oSp/eC32WFNLLFqODSYsTRZEFwHeLUZeJNYHV/LtDGECjSjiEQAQPLAjgO5zqkIEFGhWSWVtBU5F4PH0YDx8KRlJXMSAijXwMsc9jEsIrFt4Drpcelypx4wNPcDkF3IFIJV7iyRRYCTpkXu0J//pw//7UsTLgAqAZ1mnsGHhSQ0ppYSNHEmGSsXxRToiZi5HSQAAAIACSADJRIk93RYerYmG48DoBwKUzjSvR7SLUHkVJQpfoS1N3eZ+xN7yQrQwbg3J4loJIA4I4JoKdXkJ/Gveu6fxvmeFcDAiL78Dx3o5c6wWq/91W3//8o5W33B6caHkXbRUUnY3G61MuGY6WSKmSWF6KoyESuCEIzelArUGWBGF8E4Uhtn8RGSrBcbEANAgSvMuJ0km4lhRMunFzSJbGHlt4Bko7KQt/Ps7gsQO//tSxNYACnjfVawwZWFmECldlI1YivREeBQ+14oZLh9bwyNJxYMJqJ/w/e+KwgSdcPjHU//rAFcQjChN5dijUJpHQSoV5DZDyT0dNJUm8E5Uwp21W8YXRGgEWNwZaKta+dOhFtcuo5G9zFshoDBOlo8q5YnBJ5tT2AAUFVnQiIVoNgnIjUzcylOpCaPQgvU+xKo+Kp9SnEHKnoJwtJ0HOibCAyRsIxhgWiS0r0KEkoUi0VaYIlHQVqjGfSUsh9CN1YyDNDE1zLKc7DU/5YcP9lL/+1LE3QAJtFdh5jBh4Y0R6nWGDlhspm8uGrIKwdMFkFrAKnf+/ZrgCAJABBJKDh3BWjtTzIDWEFIIDhKDY/OTxqJIgLzDGOpzUj0PBUc8RUlALOsaOfHD5caDSD462xcR0jQkFyMAxzkfI/rLv5c2N0Hezv1+t1VAEwBAVuDWaiIUDqlE4AGAoyQB5RFE5MVmDrGkEuVjduIBTAwAQBq+QnOKm99eHM9jI87Lr5rjcMd81aWd2Nz0mpDRPpGeohtBI2qSe461lG1ouYWsbmSSsf/7UsTigA3At2unpHLhbJIrRPMOUOWvWPnHDrr1IEV4VnSSNtJ4w0IJ0RKOGOJIcGIHSCQiMZhSyYKrJVDPrx5bJjgdjDv2OSG1SNaCPXOFRQy4ssSCBjD0F8yeKi5RQ0ql8xJXS21L0P4qdcLSrHksiWSwN8sWnRrq1SAgVFEokCkabMAU1H2BsB8mAkqKp6OsL6gtLtRtxLn0xsZkWJUjRCySXGyyCpQHggDAWFQkeUFhQAh5phriosASYtaMDgo0lQwIiRRsEQmF9eN7j31K//tSxNuACijrVgeka0E/iGs09iCgfSsraLKCv1kAiJpotktOUzVo+iXoANdGq0t6ibzQcWK7U3TxH3s8kgxA9ozWykgNzQQghZbYcJPzMhI9OWx3zte07c6sAyJwzPo1v0ev3ndRbTlBpPErCCfrKHiKVhqP0JxX/QpAD2y4QU4HRb8qiUAYmCQQNHXkgFQJAUVcjcE0lx1ASYgZbqLnRkBEQg00MWQkmCPDCMDzJWHDZGZ2n832z8zPKsC12Lkz8ykziM1s37m44kBNbCrVvOX/+1LE6IAMEN9PLDBlgXcMq/z2DLSZnvTMh/ne8eTA0QQCng0hQMCvQkpvHopSbHYtnEc5yPEPX5WbbGzry/V+87GKlwWK1bbXzNXo1XERpDqCkPnm6/i4pabr+u52lVshT+m6v6/ne9K/qHoatUezV/53n/z7KtyVbZr8X3MBBySUCncGiSJDFVMeAUaD5gAUCAcPH5ipVGjlSop6A3/l1s7p1GRHjLvt9aXztuv2lQpfUWDaByIMFCoVIA0/EbdI5Q2UUADgUJpHzSe9DB1+2P/7UsTnAAu0Z1WnsGWhcx/qtPGKbEwAFIAQAbwR0X0KTCqSsoeYr1jBfRqrpUlDKIep4PrLy+rVwSd11PmHrFmPECJFz59XmpPilvuWSuZN59ZmXUGhRAW/EgSWC3EeyYP/8mqnf7ne8HQXfgBp2OYf/+JaA/59hHF8vyoAAC/KO1+Xaxu12vXABXQg4b5jRQdUliEAgZAlAxnHEx4sGkWRlBYoIxK4/jvG66MlCy4DpeEuM5Fr6YGe7SR1IQxnzpBNSjhwdnodSeZm9RpBVQpm//tSxOeADAj7T0wkaWl/Hmjdh6CxRNGQwRXkVugK/Sy+a1MrFRA6xIzMiUkXp6ro/0OalXFiQWVniT7+/u16ZY38+ZLfb17HnpnVvjL6I5zZ3XP1voSzXpb/6ppdMz99Nm9dR8oBASOt2TRWSsxq16wWoZEzrYAdsBIl7JJg4hOqGp/FDuwcFLS+OQIAVABZOBvDuJ4HIBpkMzC5CyHmkcIA7B6GRfHYdL0mhUyXL6TD0MzxLD1jxGATSKjQ6bpnzEzPpIJmzMmndBzPVkuXzAz/+1LE5YAKeHlNTDDFgZcP6Oqy8AHW1EoGjUNCrdK9GYpJJMyDU9TIa2qU9NFXUktDoWVuaJr//6F02b2fpHFQds5ArQpLvro3Im3M/FLLzDHiqVU2qU0pjsJ2Ssyi/BkFzE6JOHlyTqNd/ZHeBAMA84+fyWo76/ltZo03vpfiqbfLovMs8pNq3z/KOStoMkkjHBMyOYtAIHVzH70iiVmV7Bp3VhV7A7K31KQ2XADMhSACRalxicCbSKCeA07CoRhBOT0Uvj0diTAboTZxHVBV5v/7UsTmgBSVP025h4ACbC/uNzLQA3QU6oZCGYoCytrf7srNQjOZVzZOqt0VQz7qVCGTmbb16ehFZhtUdR2HUxH25uy+ZxvfSIO5rXfz/Rv/0v+9W0oBHWQgAc3oOPNFmopfXx4Jb2CV0TAE8cE4JNCqZlz0JjU9FOm0zjAxRl0yxMz0MxX0xV2nNVlcKwx8UOVJ/v9GDgMBsyYg2pdF6XERZggXSWHNQhDkX1d7XoUkKkT/QI4mEYObxVzMRrrG3eVflhk5qCWue59M7ULdyVRK//tSxKSADRi5gbzzADGOnyu1tgg5hhmRo4lI44Q0TDmzy3vR1Yxd1NRzHZ6yFKtJrIyoA1uV0fZFqlVCb920fTuzNNZZ9bZulNbdnszt/7K7T9hjYemhvWlMSwQxG0FCADHr05pwSjapq76CjTH8ZTiROIDLAHIyzRtr5m9QLDpKXs/ob6vVUpKfWCBG7C4ef51X3sM39PsCIp9+NQaIIQCji5+gLFB6GiNqzUXfR2wfQgM+7aFQAgo4kSQCCoegbhgORBjLoeUPKoqFViU4TlD/+1DEnAAMRLdTLaRpAX8rLX2TCZyiE+5ZEadIc5Ag6rOrNByFZ5y0LyWxiCWY5y1efabdqmnAGZ6nsmv9dKI9vZTU1R3CnE3zXJ1rR3t72XvVDaWQVaY03VlVDXbhKghlJ/E0QU06eu8niBIQXQLCcTwPwVPFx4cpD2yJ9U5iLczmdJS6pThI3qa/P3DDrZqijnMOGTinoRRLtENll4unPgFJ1/rTfY/lV8XcrFAlSCLltbaiQQVTTR3ZFajgGiKdh4tQ8MjBccljmGkXs5Gh//tSxJiAC3C7U42kaMGOq+p1tgip0Zg6Ih97WSU9lss1ndhf7fRbPN1CREVFSHt+xSlwUEIepb561TVyr12cHpw5UNM2kwAk7EkgAtm6zBZ6UOc/YsFD0cgDeJ5kSER+tKw+2nENfBsI5H305TKcm/Bzbz5BxaOH/7wiM6CxRUxKVBBYjBc70x8k6y5dLSK93Vcw0Jd/obs2gjLbyxsgAp06VZJBUZ01YBQfCtFROcV5HBtUwqjEUSzmc+w+M3TLeFssv/1W+z+7Ky0ZFb4mgoL/+1LEloAKFHtbrTBhwUWVq/WmCDzDecsOGvkQYeYCe6vDQPBtpI17GJaf70PDbPdVEdm311aSRSgfSEo1IgZjJMSLnovKjEUYlPuLgPf7mFVkz9dE/zw9oIELqwzZAoFOBM4BHiIQj2Dg/+G09KxEA3h8AM8tUhfd1rua5u6GTlDIvSGZJrpelRcGLIIr2zAIWiW8musEUxyTppZsZUjR+EZ3ysSzKNDzPXPu+h9KZEFlW3s95XJC4Dt8+f0//qZos0JgiIiViNDPYVf5PXZYQP/7UsSjgApkoVONsGWBTBLr9YSMrLei5QASdZtAAAA2Crwt6qKNMLHpAO45Z4wJMohVQtEpfGddmCs+ovDfrkrJB3KsftDTEO5JDpd8uIb0cz0yDihN+eZ95k/Jt9GXcTizGR+RrWlvSAARDDIiYAJYiy8jsJUbwYwFsLOiGAbaJ3ygqW1PcY2rowrPyvbOPFP3M23QBAxVxcTB1AlBFIAehJ1JDYlzwP9QlIIe/surfpk73HC6MWcoyGEqcml+21jRBCgGVhldcEQ2dJmjxk5h//tSxK4ACkxbdaYYTvFAn22wwZY+4CTqNnPw3hiErUzY8BQhtqV69hIYtepH1ra2ZorU9MGhBxwgAqWen//9P//W5V0TA6IhZowuMpEojh2Q+LqTAAp1tCIU6WTHMVQNXObU/41GLNatUSolBZxdhGpGe3bwnNYxEEaoxIvT8tN20+pNyWBFN9E337FKBFd2Tck+EZIDAmhpHRX1fjbKNSo3lzMmyQAnSEPY1GKIiDihsCk5Nz9Ifq3XAavGQUcLIitvEYvqh9pDM+HMgAB5x7L/+1LEuoAKFLNXrCRlgUsPazj0jLBJvoY9h88Kdnj82LsNr8aZnEWKQzrf2bwD+tEzUozNkbVRkkQBKcCBKE6hSI5WhHEaE5HAsPRLTAwJiQKbulP6pjg4QmhGA2mgIF1pDq+tANOQk2RLNNN2VoGiFTMwelrGFmtqvemLZGInK8zV626KVEZkl4dYSQU5SsKDEPh+AEEU+JBVSRiS8ZUA3JYb4omOnAUBBLSIzpxrlCwncekYCBFz4DeYaaWHum5akaHVHT9j2jxR8WkHqMzd/v/7UsTGgApUY3+kvYqxL52rlPYM8Nveqbs+HiQmtcloALn8dhZH+wGGjpEeqhFNooKbRilzaqM4W51ZkZhr6NoGUTCb0kY1JQMoz+epNSEgqwE1iqRURMHkkOMDmERXrmQ8WaJb6r8J9lFUXIyLSblh6KjSlKYtbfWs277e2IIxuiIPpLChaEwtPALNh4+kbBo5r5FTKJik2QqUtczQiUmIsEi4hNDYMaUhj5gqFkbSj/+/G0ZYkFrYQ6E+btSGDVG2b6b87+9i6/XP4532//wn//tSxNUACehzZ+YMTwFJCSy8xgwo18TKb9u/5P+UAJnNowCmRPRXTSPsBhR6HjSHQ1KAMaexo0b8qvzYrmmeLmRL1oFUfolXLOMKIXVqodzYNFQKRlJ/SNARogMOwSfZeIzrJEmi4ROq2XGn2zwoXbr/UmOVQEt/+aRKJSqLLaklOzDyOBfNJ0pjEEIFC4YRjJEQAu0E4JkPWsvk6kdSkSwFmjF1zUEvnl3Z0gd+hkNG/iGbGO55M6LNxwWjhYVFjQfNm8NXL7YoOHtzRQ2kO2j/+1LE4gAKQD9l5hhsQXWSqzD0jRgU0vYga8rPVJGt/XTqUbTJuHEdDiWgkafNSKu1ScRvDgRE06Dp6IHB3aJasIMt82phDITNOlhCbUmVVcWRiWs81pkDFQc8w0VYBSow58g6zHEYSvG3N9iRum+091I9PVsVAAIidSIAClDGUEQ4NT6dYTMFkICxHB3SOXl5fJx6cnMJ4qq27RJNAVAAVBEREia/BNCLbDDkpKCVnuRmNJRUCmU1IhiwmyH8/zysp65lz8iMaIABzsI5I8UURf/7UsToAAwYW1+mJGdJWhdp7PYM4LSH5sPLFU6iYAINhaTQCd4ME1xQF3QoAQFtgGa9PVyVpe1EFhAWQBCCAY3tkOWmu42y1n0T5OUiOkDZvXqGpOU7lkb5mWXz4ayq8756HM6bKM1LR2FAYHmwCYHZOLLFT52H1PQYjqkABqAAAHMAqSbMotWFLBMQGksPTXapH3ieAu4go/j6SyMhpYaCDDBDGWXOSxxBa96WkfSphPfVWp5VmVVHs+r3akJSSBRIRqh9QmqzYFNvAYUDLScm//tSxOoADHy5V6ekaqFhkyxw9g2WTMAQVfda5vHk7UqgMceuBgAIDAJAITNhues2u2aLm8LEUMUrIouxMsxhEhppv7L0IFJuFbeTA0xcBbSj6rYEsf4Ss8VEyxGT8xRJWfR+OLnEZKe+y+IbSO7Q596a0/j7pjJ2q6C1Ravo0LOqP97prv46siUcGCE3/G8Z1fevvf8OPmkSnh+2PvHzr////++9XzaJLjXJesdc8R/yPv4y8fviHW2hsq3+KojESQCC25dvEDVJOzGSZeNg4zz/+1LE6YAMbStJrDBlgXma6bTzDajQ5FGmoZ3z90KhcSCIdMzPNelqvbHR067yNFQbMFxYa8VMkkbKwCUF1bqBEHmFmgEtNlRENOKNHwJWQFsDMyLqrOsHTQ5YBCBsmyZTyyFKhoAkAFqrgEFA1RbLBMhxE2ZzYbl5N6dLth1ZGvFcDGvMMyMlBTLN4XE84Oyr3ern6FOc6uFDO52BjrTkNm+FSZpeQMRHB8RWh8jMBESRkNDGuvlHLrx3c1v7/+xdiDRTJIKJKTpnLg/oTEKMaf/7UsTmgAyAj0lVlIACZaQtNzDwASLXKXUiRkTjO5R53sjNhuvFrHQakoZpU8+lVmqVJWzIqn8mfwk3NOU/rn19z/99pSFz/0gRvRoFDE12kmMSYYhPECr1EBRiKj8L6vKFL5F5eRYIiYyQGHNRwpEugEiTBTptmycmPGRclNRksCBIgEggIQcGWWFyxhgjFxQjqyBkA6QuFRYo5oxBBAKbmm0eN0nDB7Ftr4m3de5rLiuBEZU979Q9IpizT5y7IYU7eYE5SgoajmRzSzwfeNmS//tSxMWADCxjebz0ABF1GW3w8w4WmF4c6ua8vDx5yd2alKZRc2ZpiVd0EvalzjvkRMtr5Jp4OlVnxYLLX3fBXR58VTbLU/o52/Zqr/yntb2tqzq/atNp/7NNbi0JNfpjBRQSmm3a7KGdv81gzvjrPaV+mjwIA0wVnIlD7EKVEMVVT+4O4EGYq5CSQmY/KRv4FiMwUYMTxr8aVDQyJzYE/+NkXzyzvVyikezSND+qRfdEv1j2PnFyuUl1+/32+fst24YJ1C9DQXG/IACAAABdRtH/+1LExAASvaNxp40zsgAxa6mBmmlARhGOl5wJaVrgb2IIvuFAjoQzEYzEn2h+A56HeS7G6eJMHTjmHUTktG8yvkmX9VWi8krXn/ZlO2UaLSh0MwAmliPuYb7TYdIwEbFQTofTRRdeVWTInaw+Eo1CEFzCjZLa3K1IRtVN1Sg58khTR/WBYikKYFApBUIy2u8SQ+MmEmxx3VQG+JgoNfGHi6EpIR+lyLogZ4X9u9HKnHIs50xnHnmrXd3sAT2ubyzPW4SmCSAq5ILPUtSyhFJVlv/7UsSXAA1RaVlMMGrJqJVppaMOYBclN9C2worHY22kioepGw7zL5BjLgCxrbcqyxE8aYBkLtSLFuFFUNxGEJU6b3eKIg9XYQlKuyIGKIcnu5VodVtuulu9k5rLayEZ3GjwitCZFn+m2VfZ+uNWoYR69imBQJBSTjgweic/mZ/JpCO+2sFJSMnNNTGRq0+LVZWVQQgQWaop0qFFCK9LKBzKZrPMx3piYFwCEgIaiFw4YVAs51C5nK5CtDb6abnX5Szd+y7duE0VVPYsmFlM6bo///tSxIqAC7CrZYewZ3FlG+208woWYuU5cTo3wZU7AcOoXGxos0oRgAuICJDMEPRToSX8tkhEoInJyQwAaKSwyLExrg+yE5sUXaW7BdiNpcq9ZVqgur0mhKOOHmmNSmx6ZrYpZZbsvE+ICbsAMgqHI7UoUGREB9GkEzECaX1M7Y9vOllamhb6FvmhTqlUp5+l0JlNwT3AN79q8uaM0I1gcYcE7qE/tSlx6l5RzmrRDbjSd8yubjo8GrjrJpwoL4XsD8fCxgqnNnMkP9wfrp+UsQ3/+1LEjQAKWHlO7LBqgU6SKqWUjVScC1U7XB7gUDRdgqcetjBUfdxKBVLF4wcdpYkWna4qTJXpHZKvUPU/1rl00M93oXXVAgtkZpQVXZ7951WJrLRymwKKnE5aEzhQkAASYEUnIvZjFhx2bsAilufl8btfoGZshPudCdX/oyHFAfPCqdgUBsp3YackWARrSXWnrHMx/oQAQg06Klyb8eaOZgqYPgx6b6PiG0dct6QMiVRJZqErQs+VpiOeJpWke9FYQTEXiqdl//f8XDJYPNUjXv/7UsSXgAnonWWnmGlhT4utMPYYpvoJbBInIJAAcTsirQxWNdYJSCiQkeoABIUkAFKNvBQLG7kWpLWPgIBZc+oa+6AB0xhMZLjo6olZRH8paNw3xxbZU5YcLQk+amA4MWKuWRH9ACBQcgwRCn6Ou6vPUq//MeEJ942SBvPIsUEQUomqukdTkTy+bQLa8XRUJHyJQqsoHpSLjC/SmELGOZaIySOAqJL3PupGflBmmcxKU8yJcMNsA4kaDbzNzueBUNmEVKs/9TfLPf61Ctr3u60q//tSxKOCCfBpTi1gZ4FGButdrCRYCIaUcl/S2YNaKLBnVqsCuKwhIPBlG8jKasKFsEVnjFDu1uQORvGKPoWX3hs6Z3JBkIMKxKLKgZILNoCVDGeyqORxztZiP7BlgiHKQ1b4rrN/KCJaXXW2yRuUDpuJYmcTUgRlk/XTu0xdIzG0P39pQcalYeOFHkR5pzACPFjhIhMDVHw2AcuB1jhC88AyUZj1uSIFC/0JkGdSDSpdClVRffaTBAJUbdUoOCZoaPuWU8l8myru1UrIi36qaTT/+1LEsQAKbFFZreEgwUgS7TGGDOYko1c5rTS9s2o+/t8fvTv89bLf2gPAELJdcJDRpZmp9XaW1e2MHoiv/pms/SeKNuUE6P7wALFkZckuGMy7OkFn0phoMaSHADl7ZQt3tlnEOuLSQJkim/swognlMta8ca8hztW26LUqMqNt/yV53BLWXOmVMPoyV/i6zrW719MlcTRLsJIqAFJFJEpug1zUMVBFhaZhhi4WhoGMoBB9BMdYmABz5KgVXrUyqdlbDcW4iGWafaS3iaQnXdg5oP/7UsS8AAo8hWuMsGdxQIhvtMeM5tHdsCCRpsHmvHd2nsdWPMNPbaWrpPGsqg4tGkEBAUtdrNh35aZqk6sWBgJTIFA2T3wXUuMAcH9BLnxamkQLyCaNGHS0R73OEP/RLfrBAK0qUMDgsF0gAy1ZI04y8N/prHnbt1tW4NpHgEvajYsg0+4k004DqqQbTUblpDvBYlMud6QdhyEK1xChWL3riWTd9MWenMTXI4qFkpP+KU+uKNQRWEhIbeaDZ9ZVDoqa1NQOxVDyOKoSwtRmhW9o//tSxMkACbB5aYy8wbFDFSsxswnctM6bkAASqDr5MRAAOP0Q21MBPCqWmhEUYc5IlTdkOcAMMRYVOm2hsUptXXcngSQoLgi2aaZ1SBnvDMLTve+yo6ncLKsh1oWAykPSZJ4YBMpL66h3ax51oeWLBuy/WGnAkVuSUIm4sXoACFQ1ttuOQACjIGXQicLmr4FsjAKniMswGR0bEdoPEhYvibtOqMQvL9/GTylf4lOpz224jc7Z/uKfC1DR4Kn2oDLwMudIp1AQmrsA5siMJ6NirZ//+1LE14AKSHlRTbBnQUcPKrGmDRwPh6xTlFy4AFT7sqklt3DXMBKNz8XJMBzl7bGJaiwDhskq7h377Pp8SVpOqKSacZI30RVUymw4KzHayRsn3t1V7sF0bbE5xajS73dQxbYbq5t2u1bEMm4VtqMQmjeqiYqdJo5zlPZnSeZQkUtA00w2WJTSswDmAHAtAF51BVkgiogi3DHTSrNhXn7qlIoMh725ydYiAApVkDCjke4dSeOBtiCAqcFcll2vUj0USsSs1Hm5L3zf53v4t75e3v/7UsTjgApIfVdMsGjhkQ/ojbeZaEeMmve9sREREOub/a4QQgAIREFh3dxcKiCMDcGdMYQFHD1hJAb6uLexM5e73mX+f2189Ek3eEs24NvcygbVEVwEAsYtzL/Wuex31CKNtc3L56+Sy7vpY7HYUL/YICc12jajIMDVOVEOjXZRYDlBOCz3EIxFAiHkncJPTli0B4RT5PCdEswUPikeBGJ4Lllw9puHzVp+v/s0/7Tn/ZiBmrdjpg7QSwSAaDScnJaZQo35gWrsqWlTy6AKCNjU//tSxOYAC1STV6wwxuI0s+v08KbdPU13D9/+IgO5jGxVVgo9zVAvchaK317idQAHIAAF2bwSq2pNqgVwLRZWcBuZEZU++SqySSfA0aNPJqe6oW5OJC5lCuZRTRK/fdacrl2eR1Q5V9EdiGeM+USCQExCEla/WhsOvZKnel+xzhxUgBWCK50c9LT6CB1p5F1y1AQ6blW4k/DJYw86JagRMsxWgkO1q8kmK6SWvaRmMMXwHmc9yq5IQ32P19z5nHzqtimSK3+QcQLFjNayhcmzTYL/+1LE0AAQdYdfp405SeMYrTS3sBwdk4uprDeqpdUc8sp77/ZFG3kS1apkgNu+NxokqEMJeim5lIZUYwFqEe8ZcixHmzq05oBS2j8bJDzTU6DGa6g71i9MBdJTjSsOVw1/plnSEkQmAlTVIpaaD1g1hqfHWMjtiGDWQGxZwjW80kS7mEWVEj2h7Nd6AAINztRBmvAkKqdHUVjQ/ZIDIvJLZHYW5DH2D2ETnrFqyE0RHsrUzQGRwMHK22zS+d4osBo4tcFCV9DwZCoVGBdL20LDJf/7UsSvgAxIr10sJE8BU5JrpYYNKF9ZtbQycBocXTQLk51SQDa9jzSJYsTYzpS1nTi1NSAGVZh7brI75DNM4hGS2E8RoukUctDQRw7goH7TakcCdTkJAtTfq43CzKS5vSmfTuJolpTK5+RWle7kdcILhjIkFlRz33oWZESnsqudLVi6SSnvYxiyy3lgkXtp3vI4rEAEnXpbJEnzOJqW+jAXcI+dYOdPHD5YJrIpAaVInbU7UCLKLVXRmXDnZ4NG1dCZH+MFj5fl+ZzLfuWuFBIu//tSxLGADBSXY6ekbqGMDytxhg2cgRGit1BfwkRZXaoVcOVprmjhoraOurCbmqPMCJ06dHBex6pMgJKPX9LcYnh/lXKXYgiCLy9XnFcHFLSqw3tTg3/fXi9I1qbG0zabjINyC0bzaf97t8K4yR9yFuCglbMg0eLUssg1rXcoj1LQqSspUi4UQ+tRKnpf/RgACCSpZQxhqcSABaUaARJszgQA1dkgnyoGQnUKe2MkHJWB3uCgsjpSK6d4/c8DgEYdYUDpUGwfBUoKMPocsJIFQAf/+1LErYAMFKtp57BpYYIVbDT0jSyci00klWlTRWj0+FDa2TyGLAk/bK1EAIKJ/91mT1SEeyOIQhIa9GFwXrRYDctq1enhvjAOps42am4w5mLgUpXbbMtdRvveFnzhXy0MoFCpmMQDixcSGryLjdlKxVSwzRO5MrMMJao4kAMJOXVVDeT0s1bzUFzQsBcbQTOAsNVUCJNRLjTeiIDqoVS7m7dSjkhK+Lg+960iM1WsWJlxKFw8hYdmtiT49KGBIePcKEACp+dExwMeZ01UFwAASP/7UsSqgArMe2mHhNQxXQoqcZeZFKIKRgfFpq5llUoGmdPB1h/6ETWcypALCPLCLR9xcsf7PQg+3YOpeZhf9oMlwASU0kx44anMKal5sOgQJjUpF7xL7B25OwN/srmllFsWYFeSCUDOOCMBFwn1l5kGG/+TKGt2ni7DbFjQOdl4fH0LzbC6kJjATTlSe5MTEgrAzi44ShVDbzYqUGED4uIryIqB757BlY/cKKesoiu1FnutQ39oxWwAwq/dtdt/YzB7quhvhUGKKc6VzGVV/lDy//tSxLGACjitaYeUcHFJCmxw9i0eK3N+cq/R46Tb+6zCJ4NB9AuqgeNcH2vFTrRTNhcsMUkPxzWY2LvGvxzuX7LgPbCJ8hcUsy44Z/lAAACFQ+V9xMvoSSYIMSOpwqMxhQkN2gYYIi3TMHoiEUSy0DSK3lQX3adkzO7exc6hdMm6/EIiD7GtSri7iG2usMOUF3yZegohjwgUUtYDL4nkD5/OCB0nn1h9//r2mIbq4ia8l6maAOE5Q6wiBDzwMmibhgSBLAYfvDEnJS0OEe0lgmD/+1LEvYIKYE9RTGWIYUYKaZmUjZyGXC+SVy1CK5cOVSgTCaH4UH7C07KhUbODMkF8kQsQPsLwQGAA0soR4+HsQyPus5Z3/6f/df/75H+XDUzsh2e6nkZWAwhkKUCGHUEBxoNqeXYsMt/0oAEglE4iqii3mFAY0KLGdhoAXzU2+Uc67YJ8uGs2w+hCQRQk9xBDhAFnIRK32jODDhOLha0rBnnHXlWi8ZeXf1v/3/1VvRWmO2zPpOIY539yEmUQko5/8pthSPUZaD0mGoqBUM1oyP/7UsTJAApQU2OnmE0haQ/qJYYNmDV4Tmzo2rE3ExkwB6tuTyfaz8Y/mXnz0YGXLBicLiKww1ti10g4hQW141mWEwbzVmln9WIwGjvqo8dySCU5ZcmyBHhLuODHaz5v1PqyjAm2spg3FEDCzxRvS6yQxZZYn3eecc7P7Ucj7dm+flaW45MD8qoLpBsNjBhRmxGUFP//orTl6SoqL6MYtfZH1YCAE9vK0k0sJ5ugnTYHHA+P4Qo+u9PKrEWNUsYt8aU1pMPyx1jxpeWCnUdWLtnb//tSxNCAD8VDWEwwbcFHK2xo8Ip8kpmx+uXcGi6wYHAcH5y0op4b/Uvj+2tSjt+6YYTacUbHXDnlGAAAFI7Wk066LCUrLdEzOC2mJpCuwRYOWEJOCSvxE6F/MSGNgBeEyzSSnDBU3JC6w0D9xpbDbR0mlQmLvETGPxFaKLet39V2u9O97t+RalLi1VTIgCqZy2tNTHuXM2UbFP5gLyepNE3zBRqlekkjEB6sruQT7T+eOhk2hD5tb+swRAKIrGzQPiZTUbWxrn7jsWURHsZ+pv7/+1LExoAJ5INzhiRqsUgTLPWEjVw+ks1ghe67DtjyDFPpaJDbkjkiZSiUgnwj+YtCGbCoKLENxpYiFnlSL/B8xIKP1Gqb2hnkf+kjHLqaBhKbNAPnUuasSjlA2NN36YCQ/+v/SytPZR5FD3kaFkLqil4aAce5Z/AwM2ZswpY3f82AltkPWOrCvWFTq7X/UzxzyAaA8GkuHcQYFLhSxeU/i441xsUH5kDTn38TzUnJivMTO4IdfwDi+eifW/X0Vy0mRfSBX/3n0Mu4W1/FKf+/6//7UsTTgApoPWWmPMchSovrdYYNILAS6W8YQs8sAlElDSIohxEroH+msKl655D0mA5UqNWkL3BblWu285JNCGUPqAY6KQNHoMAKKYzuFhtB1cfJ+Wn9I/8jLqvlIqntW++V0FDMsMcrfj3aS9ky+zdpMVERR+zv/+1AAJaSlEGCNAmJhaPhdNjhiFGhCZfgcFL+KIJEx4x4kxBIFMbquAFB0Iiyf/kyx2eiL/VuZkVcw2rOFKSWiDVZfZf8skOSfjk3WwoE83+f8tiTAlMj/7H6//tSxN6ACkBxZaeYTyEqDu40xA4We6xgKbi18j+U6gAQQGGDxkSE4rCU+pkiLjnxIxEFDAyGGkR1/pSIzlKEvAKhMmIy2FCJT7lGiottJ4TttX0/PU/eua7CsLwkaPzsoMA7qa2gyRLNobpmmSLroolRQTQDvQSveE1qEFJOW21qOKOqiMAEGAp/9IXXNFg/cngWLtYjdS7jbV8VjNwpTjVkZfQKXeqYEoG8FwbYNxbGAOEi0YiDdQpGn0mFCtuCkbTfOM01JBhxjoUacN9UEoP/+1LE7gAMjH1GTGkFSY0a6VmsDSGkvYB4G4QtVtxVCYhlgqBhm8hqXLgHAqUSVTVon0+7pVdS8I1P/f+WeiiU4RAUDRlINHijoOF7myDEyxg4OBwDtaME4s30SBN3/UkQJBOUgEjcJw0ciMhHgD8IkGQCyAYmAvzCoZmac6YsaCgoMHKHEo3zyvrtcy7rgrv+/bfuN3hvWicpIkt8nyUFCocu3VXC97DaLsABn2L2zJxAgYIHgc21suKMGl0kiZJzQ+bIq3OJKgAAADEyEjiD4//7UsToAQw4eUrssG7JbA/pZbYN3FEzCMauyKWq5VjFjW+AUnIEBlQwYkQcpvBfbP6Pe8VfHOn/X3x/VURaRoWPq79qdJGhoG4sa8JSDDILQ4TGDx5ogFimVCSll73RZhDofC38VzDzXFUdPCdv5bJxLVVEEmUlLpdmOoARFu9c70+sL+XDbOlu1tjbbpsZEDOFVnsjmmraOtTAQ05kkXF4lcWbm7cYXbZtYsp4Cc0s+JTUS+RDRbqPKUP1ChBSheVQr1Hhrg0SUtxVw+SGdSDu//tSxOeAFEEpc609D/GckyuNt5hoNIIvRq2aagUmXZrJY2m4PIpSfqYxjyWTgqNVVVXRqQV0SI88KchbmQqM7bF5EHYxwiF+V8rYno2dKSCtsVLRIRShLH3xgiV21Y6ieJQMtc221pKocOOlnbtKfToDkUtv9++1t580JgTMnGDiFBFSSemfla7XApZhXlCmwLuqDLMaJpqHQMyX+vSUFUroxEbe97oCqIsPCFCBEgDkxRZmLj3Q05rcVFGF3Lv+X/2JSJ2JWYIJhysAAIpu277/+1LEwIAPKUFjjKUI6UgLcPTzFWbWTmNsQkISizDktNepPu409pt8uEXCMbZVFUzSG5zZYputOo3VzyJESC3f/s73YmpSIRFv4RPI2I6YtJ+wH0mMohZe9/85IU7/T7WIHFybw+m7UAACGYnLZZJj3NLoGUqJJBx4QElqLDLjRlOBAuEWiqJDKOnQeocZsVSgHMqoklJPWqqz8OMWOfiJVbUIUbe1JZjWu1860kv9dIQMBVfq56SHiI2dJMXuczpqBSSdlru1sdyBSKEFmfh0KP/7UsS4gAqogXmnpG7xZxMw9PSVnkmg+BwV3SGpdPVBEhfIXpx40qcUe6z50c5CUNJOQNDEaaNpNXz6Nqp9//7JNxvWKVDxS9CxdwcaPn73Kpmpn1rAALtSNspAm2iCXCKoleuHPL1gZ/mi3xu9mbQqHpD7WRt3yEuc3P5B32MECT+6NGnnC0hdBuNvOiBzzwsIJAgYoOfx7YhugZ4kYFxK/YWurLFIvQAAAjG/0sADIagA3B9jjUhsGWPSiR2nmufEqYKXxP3hjMrnpVih6Fbu//tSxL8ACxStZ6yka2Fijix1lI0cy4Vh+1Iu5LwbKhpQ4KBVoa0lzqZNE6i9UsxXrJZjoirWRjyy8kgQu7f627g55ChUrJSXXV4tQfCLXyPSO486MLBuaKV8EBH6cc8AACcUWcogLm0lAMYecc+0OKct5NgJGGvLECFTiFpNYXRsp01Uv+tThA9Vf9AAAAnI0iiDSDM9A3rjXaJyJ1X6XgFLS0QQFB7owM/EalDK2AnEjPeJEDNetcdYtm7qe7cns7vdmWTW+jUImx+vu7kzvDn/+1LExAAKCDd9p7DG8UmSLWmEjW63nP/q+u3vb+dGBuQl4gCD/2yETgGBHHJMFQTTrf8xHVK10QwgayxjBAs20GxaRMLgCDhSjUSiJY82Eowio3Fxd4SnGCgoKIQlIk+d7/oqI1UZqf+mmn8b+k1GD6Mv6WWioqbKTVp9IvRz1QAAPLbUJWWUDbgV4MIBSOM5h1lciQOyM3zm3hxduWlHtpIp3F2W/24WRNXrjIlPwnS6NYiKrDR1qRkqS30hwrLy2j/8V1f2NET4BOzqNSpfZf/7UsTQggngW2mHjFIxQ4hs9YeYbGKh8glGJyx2ONKF8HJYsYtCxRBH49RSAGjypNT43tWx7+IQH99FANUUURiRyBiTzaladb8qcUG0NpfN2899KCr+hRZtkecJiHMiQMmyVEg8Ydczd5YjbVvXoQpQWUYQqyvl0gAFfvmFxUBLIVcJBWFlLot5qAJex0szeEAGRMvdHsxGBqNR20MgJRgJ1xlX+/m4v+W2Hydhn/3zjhDS8h6uIYEHJTYlnatgoZ3fPi5UFloextd44SRgmBwI//tSxN6CCx0JW0ykTyFaGuuplAmwhsceuZoGtLpSaqciRJa2GJKGkgkCbrSRoLQaBosJlEX/GTumiBKgFPe1xsGiLN/mbnYQSN27mI7c31DBbWGF0iZ4se3KIZN4YkkFNbQx5FMRuWSYdeWHc1leT+z80hZkYhbq7mdNAKIckr1baTjELKK6H+AgdQGL0AayHchWifFIflUPGTN1AXqDm8ouhF7IxEyUNo166wbQJkXIbIsHhBEDGrbxM07ZTW1q10Q9bqRUdbWx9b7XqfX6/qD/+1LE5IAKcGFlTD2C4YGaLrT2DWYAEIRskFBGc43MyNo2jo7DR7YaXOswgIYiDaSZ94p6Nzab0OHV4G8zlq5pSlv4NwLF2cNTtave/h0xT2feeOIH0HKHW8Gwlr2l7Jud+nfoK37vt7evtu8cin/CtrEXT3xLb9+93QAQEo25I2kwb4QwD8PUM9ZMUvgpamPRmTHEjZXVVJiGYH+3Qz++WzJGk9iyF8aSdalVJ+tkZikyzbzPIXuxyKB44Eea5/2/rt/r9Z2/Trdl3J9+3iiFT//7UsToggwov2csJGsxdZUtNYSN3rv0NCdygAbetsQOJDiJLEnum2ukiXY7DWPhbP2CbsKe2FItfCdQWYe9wKFmeMXB4VFxzicdyRRg5SMzWJ5Utma1A5nl0r9tBQCqmYYhYKWqLHFLdJgF1w8cIRCdOC8TYaz6ABQacalsjcBGyKBqAzhmo0wj3NlJGxGMF8mHpnrDtokuQ8IWDUN79Fa7YSXN4UQSaiq5ixEbMZsjNpDYgzLWpYa+vBX2f8Ww81drNTVrinft/vNP2/93XFHM//tQxOcACrBfcaexI3GWD+oprKxtTcoum22iAQnpOSNxggKa6iji2albFl3sXH7BF2VB8rCLo/Q2Of/Xrep7mpimawGIEH82waUhl3NyZDlrmjSzFwYzdd9Ml26f3nf80yqVVZvl6M5cGQCEBS0542a6nHfbVf2v/Le7VQAAkf/uGMgy051QF6HVKeYc9CPkqZEowIzKUwdF2SDQ/P6VQ//3cW2/Mqz66Ovhxj0mVEKt/LZkUzXK09gSU8i36ZZ8kfUqVt5ln/BRsYH3qFj5w//7UsTnAMuEmWmnsGm5chcsoYeM/s8P5ZJAV31N87I42wm0KgBsSzQcSGYZaZEZ8Ow2E9EvZHBIIhJuJJtTLPdtvarYpI6mhNRzx5dDxDuq2EDzGF2AlL1Lh/fhfkCShiNCKDCqXPJhYm0idCoqjDNQqt/SoxS1fRqVAOU0NEBQxc4zrgLKi+1dYaDILqKptQBUwGEh0lYkbLE7c10ajDHpSFfegJIo5KEAbDYrFZORkYrJwwgYhDz2E99AEEh0A4GwwSYvteBAG0cxWCYJgmKw//tSxOiADACzaaescLmBnmwph4z32KCSFrrkYrRoECCEPs7yEIQ/////rITnNtdGjRzy7nOc15oECCGzXFYrDBIgYXFYXBMEwwgxdGKxWTt8Tg+D6gfB8P/UD5+QAYViJtFKEjGQCKxuYEOa4yi3ExWB3sLaqnNJIizKZLlDVkcigH2EJIpTEPRpGIzDhUfIl1y69xTjGpRtcum8nICAQCAoOBwcQI50kWODAHB4jLrqnQgIQVCYvCEDm/0vDvRiighijKQaBqTBoRVg0HTZtKr/+1LE5gILbPFbLKRrsXOXbCmGDT4AjaGUQZLlUh2cUvBQZcSFwa04cCGFr5BNmVwdLk6S729C5V60ePtE0xiojyj5wQphG+eWvoT0zFdNcKFRvCQomsbdz2zVO6cZfv/M4RHD31I3yLQCztwMR/+8///NIP/T//1t4GaQAmkMzgdMYkGAgKkvYyN/wFW8ihK9gcmKsZ4zM26Y3Evl05NkeI5LpdNdEujTSKVL/LgjiU/fn7t47b5OtEdn3MW+nHmkEx09nzb/wrXayk9jNUltL//7UsTnghQFWVrNZSExyBVrqYekrOcCAMM1Wok5mUVj4IkA82D3fb+f/9CPY5wA4zf2t2xNOpMfgM4kRXl3YSUoyqwTB5sjYOiUl7KnXELKjUGp5tUDD+wmyWOknnliJg5JIKsXnubcVc2VezbfefCpsIVuW5R9tFFXoc56/7KQAACIsVWii4MhEbgU8RRTEYQnStBzLBnIJEPqXEfq2DvuaxKSQ6V4nSDJ8IidynA0dFwCLm6dp976lRCNxd5inrM6Htoa2p8Xn7hdCGqbNoMp//tSxLwADMiJX0ywZ8m7GisJl5k5cxbtXqoAAgBEdIl1iSmKsV4BRL4Xk2EwoUrATEZEJa7Y8QRBNFHXYWCKW52hy6UE9Lrwj+LmZJcgQ9046XtdW60XJcbXUqNy5iN0X5BQolB9q9z46wXZTvKuQAAEaTjacwwGBWzUgATySafbVnWYXgo9eFR5Q+Lossh3nEiw41+50w9LPyNGKnLYXVQ2GJVOkqRUugymSGE7TWtOVdk2tiFwq/epZw4ZTpj+WLR8igVbd9cAAsSm2iXMDX//+1LEr4AKMF1vp6Ro4VgH6/WHpJA5uNkVNgod21TFE7GgeBnPMwZj8CM+yPssyrfpyYDRMuNImUuYASRVBnLD6ySiJ6lIBFM8SF0gad+Lkr+7xKEVHpS7r55z6wook40SgwhsQVSqgpwxp56jA7BSGxSr3EgWBUgLF1NacadtzPsN91nh1D9NSPplGp9Z6zeuZGq7EGYUfBomZDW4AtjXZ3uhpqf+CobudXN1KgAAAkJXssErCxAWKETWHGRHgnQRqZnK02HUZdD0CpCgHrfD0//7UsS5gAq0fWnnmG6hYQ9raZWNYAIiCInVTn9Lcs8MpBMFIkmHixsEXPLVilDRKYLKf+6/KMe5ftndy5W6Uz1QAQACEWklgYYBaAPHC9QXDvK5oOExwQcrDYcIHakbCXrTfPMgpz7XayrI0eHUKCoCagnmR2M1UKiiChcMAeIXkHndmNVhR/96lmREa2llSCkVAERSpacsjkCKFxFvSB9F9QoJ8ddircQeMF8KiIkA2Ff3gcFlhY4DVoRegE5R8ifCxou1R8OEROEiT0pX6RfH//tSxMCCCgBHW0w9BuFAlCy1hg02WBMUbfxSMlXoSUWpRUSpfZeKABEFNVux30JpAdecrZghG0ZfUrB2ZQ9tBVfMcY3iACRTHMzmUtXNNH4cyd54SKNqXfXW2oi5xM/OjVk9a3H4diNQwUUWHB4EA8uoWbUUSgASCSpX/UDpK9ApQQIExRcJYQmBYKz5or33GrVIiM+5EpSlSAs2DhMERu1mJWwjuo5mfSR8/O2+4kPrE/wxoZQBBLv0TDJpQWTQjaTT5/QZ58Y8elbZx1yErWz/+1LEzgBJ9FNdjDzFMUMI6zGNPB71SdJAGeqELUy0I3NwLIzQAhkmqwZCgVOk6okiU9bFYDXl44oWTcgqgXGZZJ7lX9eJiwwX3WbSxxQ8cJ5weUSltKI5LUm8L52DdWSz88rAssLm1/D4jkjSggLKpEah1pBiaCcvk/8/lmwUg/KyupdV/vUzo2AoKCSCCdo5+stvF0aaJz4BQwIBI3WQTI0ZPU0a5sgIAwkBhLCBVGjSVlJOWLydWdJBDw+7/pGMVQEAqtRIOgCHeQNyv1A1U//7UsTbgEokN2mnpMqxOgztNYShFgwCe5zVFPsmAcGCcLFiYgXjxkCEhVSGtuObfqquMa+waLlWYLNSk6OqlpQwoMtU39dNkYu3//k/2l5DzqVs1nc0rM2UrGAgIUiDpUFQ28kWwaKgr/+FAB99JUSjBWptsJnDwzDUtyMlCQCQJbKaLJhCKOBgfVBDTerQ7JVze6dwRcKZT+n3VPo8P7n77kxDlRlOGoSHceQQsgfHZAmIGIOs0BkyfB5ky0yH55VQnDwp5RRyABw9LKCS1mjZ//tSxOmAC9jVW4ykbbKhsGoJpiW9dYIHGOUn76Xu1gAEKABl5MluQ6HQxpUjlKPMZFUMwg4ByhagwHFhdtHArWF+rX03ZS1zWsqr+uz3yLpHUPMn6DUiBPJIaqUGwEWFMSIUY5mpYtpxpQCzq12k/tbe9bkvrfjFp5eD95Da5MKSIlFOKoNLDnhEGgsJnXUSzC5TRTRQ4fQCUperqnlxyUGn7InCtyJi5DLa7GWX3257wIHVNSBa1PCw8qE9vpFT27bbCtCA6p70bINVUbTy6gD/+1LEw4IMqTNYzKRL0b6dawmUGbgOnjqBAUTaUWC0Uonjd6s3WIF7QHlkhpGUIuJIDO2f3rXWGcREFTFzhoPCR4qSBayOGCXCrkV2miLwkefKkxbWtbhEj/F+cEQCdIKDifa2a8uACDU7ttW072qKUBQzc3Wc2UP/SpOEvgnI0GLzWAmxh9Z4sSQLxKnL3qMYOPecQwqhAtJNaHWLHuedJFsDB01cNU7Woff0Xps6oQLYqyxzrZ+W100gIFpOf9LZdjdFmFcRhtp8+5EceM5gnf/7UsS3Agvw6V8sFGvBQxJsNYeNGHB06ZoFfZv2mJ2cCWrKUmwzRLTd8hXbQiqOhxcUJjGpFAEBQ2FIup5px9TxG4tSnX6a7OBVp3ObZXOlUCgm3I5I2mxAYgGQjhuZbS4NHQ1PVY4i8vWFVJEL4DeLlx/eqK9jcOQfuX+n9UY96QqAF3eMcqfVMHo1QQJJiqAKW2HDZU4EhQGyB0rY5CBap7vUAAAJCjcjiUAhqeih+Vkk3gamLMFR8BREB1SobndTOiwPdaxaAIHo4ozCC77i//tSxLyACkRTYUwwqSFOCmy1hiEU3rft95Cal35YXy5/zKHnKBJlkaYY4ZteiesdFxd8TezoUakl/0gAiRJx2RtuBscQFWN2hL4Q+uaQMKYxKEQFvT2gqv5B/ez40VQiv2a6HoZBggzBUY1ABc3UpbDzxedxMgyGlCjDBAyEnY5jiBI7YmecXDoX45TRddUAgNNvS2uNwL5fgzxul9JDFMxAlvHi0CY9XzgncPtl8VKjWO7B2MHPDD4u+bVerNNNAcYdBs1DjhJbW9DxQO4wXBX/+1LEx4AKSH9ph6RM8U6PrbWGDL44l6B8VF42lb/+nDVt2lFqACttyRtwPqrGCBsigZk1dYBda0ZHx4qT9BRjn8TupKN3jvOhtuXcx63pQp2K2ZvS5+uXAaQgQNCVLCKcY9bQKHhwMSZBFx1zD1X25saYQQcunY0goJtzWWySMNguYfh5lwJqegrxjHYrnQ5lnMAfmuiyrL62xfvRMbod8LpSPH7LRh73s9nAirZBLAKH7k6syUzJuN4HbEbtriLJy6F3Zdel3l+eNb76d5Tir//7UsTSgApUu1WsMGqhTgntNYYhlrqe7//9iGoYarVlkjoFMZx5ChOgfx1n2RSXPBXmEYruCuZnjXn38Cl7sEWPakeE1qBFkgEPQpZWTAPVEJo5zHQxfRZXOLs9yyb0ankiq4w3CVgKYfA4y8o9iPEXU3oy2dKMSTeqCRGXIAB4sD4Foe+cHTWgVNyZPmOwQKeTLSaBuE517//8/WV8+yyrj/4WWtV3gM8r0KCDiJ+S0nhDhumEk59ejxJxIzWqf4qlAEUCuMCnmUiwku6RCgFs//tSxN0ACjRfa6ewyzFNkmyphI2mMS3A0U1qkBT0ZzAEkhQYARlETwl5yomoZlKqppMlborY2RNRPcLiIopxpWA0KAkVEXxSTbu1JrjI6ZncPJgOG6EUnX7mJekwwyQAqG5EYrEAVJgiPkhG6aS8qhKMMq/4e8u9yN+E/57UdU2v5Pq9v0AABS7JBTBqBD207wTs4gw4QvgeYQYG6XfljRR3g/DWJ4eK6PxsQ6A3K6Ark+wMx1dmXD3ELffs4YGSrpM7BkW9m5v+qIQzPOXY53X/+1LE6IAL+Jdtp7DNOomq7Sj0v9a6aqdj2kAH37OlnbO5Unpvtuu8aUshtf7/afeso+P4y70EU01kWx975p2y094AGpQge62H+8vRAAADkY1SCiJInWBSxIhIC7DlLyoG5l6Rqepyk9lVFFc35kjM7gwuma3p2reM5yg65yoVITzV/6t0f9f85P//ZS+fDBq3n/GUmEw+lOmq4rDVYSh3WxVCEpb9QqDAQABRYKqTE1BZlsdFShDKmWQ3GUI2NgJhVcXQvLsyeVpOtcNSinYxof/7UsTFAxBU21ItYS2CCSzsjPEbGV66qpEpmfYp3J6X/l8L/8MTPwSKHn+3d63NbZ7HtgalF/3pJ7XkuW5VWzr5apbScMM0n6jOY6iRyL5VMKpqvYMK4CCgwLdbVCiCouLOAKXrMjKnRFYPQRYkXDVbuGhnOoZ1GlovKsW7zzEyq20KH60pJW1PFfW6oAttOYqChcgGeChSynxm1phUEo1mp6fEGSeisRrRrPxUMiNBTXdVNebU1Xb/JUdAxkgA86QYDLTLEV2qB73Fe1ZK9emj//tSxKCAC20/ZmeEeQFJlWzo9I1knt2hV6iysgQFXUovAnZSBvqyQUVGOERJknSWCL6TLF4lhjoxGQU8NTa6LxwBG5ioleOcDPrvYbZt3ftfz950NufHg0ScpiRUCn3ERZCxkLAik0vW3q9nahmz3K3duFWp/7lAFgVOOSWRuaYLhjk6VKa7gsBTqQhg0aXxFD0QWFe0LRWzcCdQ8EJ2DmhdCSgqghj5gieMSLGNoLNWecBj1CHrRfeEELI9lvpQtSTe537Xp0/RRcMkjkljibD/+1LEp4AJ0D1xJ6RscU2Paw2WDOiIH+WAhR9mkWMP4wn6GFqJ0Q0qNkdjEGlfvPOnwsVVa9VrvWFOsoQIMuYSRRRVIHwyHDQkDDRFYgmunpeFQ2PuWla0GXxCA5pPzrGHDLZLLtI3AQAbh3NZHKgxBcSjeFQeZwCxCMzNaI4OAtzHPHajtgtHEV3XDo9IIAVOPAuJhRhqzmC5X1gBpGWccvuahjfX9AlESg4eoAmlAAQIKxtNghIEoAy7UHSC56Yaoo4aCMw5aEdApEQMmRWUGv/7UsS0gApsXVBM4YNBRgir9ZYZHJrn2eD6N/KY7dBVCG9vM3eihYPriMa0zvYLsbI9ZIVUo+5CmNL6jhhNrm8ne5aU6EEFiNNRzfSS49E8ALRaidLo5CfAF7SaC0xfTsxO3MW4x5oZxawWfAzHmO1uApQbSYBBYgYIALFaJubqjnPeYVPHqzaJ4TiwbejUulBOqtgdqP//WgGgYiqX/Y3NxQURKYWlY+sTe5WhrI9qQYE9qhzbj6WNzV5MpA/cpncLRNCmGNiJkeHHGixu8VPK//tSxMAAClhhcaekyrE8DO709I1WZxcmbsaPi0uv3xzRac73pFGllLS59TQ5W6//rCwtUvpNI2C07QU4FAgV0pY08Ik+wP2YPqrBq9CXpsNNQy2f3tPefbdp8cJWAxQAvHKcOLkDUpa+esf2B1z2TqEw7d30L9bLRyTjH+GQiSgejfV9xUmYQcY3iZEmRD2SuGIgIATpGxXGXw3A21oPjdgaUWfpJluD0tba487NAjLJ8QwKHzLfnbFE6RqrK52CrA9jydD2IA/j6ORVKhYN6oD/+1LEzQAKVGdTTSRrAUwJ7HT2DRxGKonFcsHpkcwNsXp70qizi+zMju+4/7O2dsxu3b//5/va3hNWw/fy3j52i1JESj0F7zQImMWi2UaVfzZeNRSInEoaqvaAxYqACrABJbjyBEYUAyIA2cNP04YIVStbb4LIypgZbcIKkxbifB9Q6MLgsgq82oVcjKzKGYY8QEQdR6pKdQ5R6jbZ1prYACVwSKk/6d9Y6LgQuZU+1aoAEDbVye6x3kaMUJQpxNOCmZAqYIXnS4rJgXN8Jaw4gv/7UsTYAAp4UWGsMGlhRoxrqYSZFJjbnBoQxWI2Z+9gzHK0zlbu6OjZ2lW3BMetpwPWXsY/T39iv96lLWcd1VzCxnoFB7+7pXxbmFRqYvfAeBQEA8IIBSMZTFkBIzU4csbtUz2RFqyGRzVb6+yvyW9nS1nO6kHOJkHSnSxfV6ljWmNAxw0x2f5m4/NbRG8+W00hgSWTX7OSPIgmIG1WG8W7BAEsBY9qCs5aE/Uav5LDMvC+7VqPNpb2le+63f5tiwGnJgcKXz/U02sQlkyaNCCu//tSxOMAEsVlUC0w1QlMDusphI1Yi9DFUteuS/f/9EdUteeT3EAAVyyW1xN9oiIQoJoTQIrEHuaG4oF6TgSYoqbeUtdZpxCPXe8qOKZLs9nL3wBuVmVVMcy130RVSjIolnRDAAsz9fFGyv7P/38iZNNVaMXNoVVQhQAXjXscctWwMGAIi1qu5PAazlFiqaINiYOJ8yOuTUMb+oTXGHu4opzciMQQ1E696NQG5SsyKWibCjTrLZ6TJl1bR00TZ306XyIyr9F20tnYrKVmDGeuLln/+1LEzAAJyJ1pqDBD4TWV7WWEiL6n4KoAwd2W/1AAK2nGmnAQggoPBFURBBYEoA961QuHRTSgbaEYHSB5Uk6eOm2ceHxQXL3HDUEjBFD2yYkknQ8IzfLmOYvD4edamrlPavUm5JCUPt7r/mz7bP4YGO/ljDv5huS//X8qCUXBGFM75PIMPLBG0gqfJkhmjZlgxnqqylnOOki767HahCGInpFrs4kbRsCzuw5IDuCgI6pYsuPOkjKSARIND4dRAIq5phzWMXmnPfLRQrpvDvoW/v/7UsTcAAn8cWensMXhTpTsdYSVLKQbkHExlb2gEhJt1yyNNh8WgiMzJH3blD7/xJ6GRYCMc8wCCRhaIUdUwdBdjEQonjB74sVgr4o8IyHrADCPnSJKbH0lr4FSg8a2NlyBUaL4lMNXZk30gYcRAo+ZCIbQLjxd6dRFh5dAsNyWyXWyQEDCOCbtiWQk9h5Il8YrKmYG+ujdIiFt6SixKPI1EK5YUCYgBaUQlRclaQnHNxQYxVj7HY2GbK3ux7AdzjHTD/qGS8WLqqYOLWEY1ilF//tSxOgADBUnW0wkSeF4DSpppg1lSxw12KIJdcsAOq05I2mGjiMAIWX3ZY/cVbxShjKi9d0b1zGB7XJPVoxLSYQVstdzjO1BWZXRkrmyEXgCF8O5uHusCUg4EymaXteZf5LmkiCOi864Ijxwnil9t2B1IJgQYlhpYfHNrSoAABmv/8QCyIubS0BVgUOrAqZxTScwGUvjTwxeKDoltGCEUcG4TFrglHSisqgvG57CM6j4Rbh/ai6OEL9SUsu+BGsYQRKEu7TWN1iMub8EAraCiFr/+1LE5oALjF1ETTxswX4S7LWEjXZAhbDYnpknUQChMTqLtwVFaOc8UpAxV5yAkZXRzWdPsWjkgQRI0JG1YnQEBmSiAgc9AhJ16YtHqToQh4Qiu33FvHkJNXIfm/nY4Sddtkbcm1zhZRoIbGFBUU3GaWuuHHnkNqWU7+dz+loEOyIShTIHZnB0+xBV5UmdqtXZA2eORqD2jJxMugaQFIEKygXASaORgnTQMJNkACCRACC8SfURpg0DEGiQwcUWSRqsePcd2d8fXrCfve+i66n0h//7UsTmgAugyWunpG6xfZrsKYMOHnKi2tQx6WZtpYUQN4RQKsIu5g8xHSc/YLRMsd17qT7NDIGyJeoBgFxuvatEqtIAGjE9HF5pZQPO7kDSu9AM5D+UAYy21976fC7Lc8LsusaqWc5uRIqMhSLbg8kP310YXKs2z4drWQFtUYBDBbdvJOhhMKCLYMoUyEY/PuxEa7Iv6M89NkVee/t+iNXacGp7EmcxAdDslKNwMbV5Dl7xOXod9uBFGSWVJwpEsqBYRZU+hERSpZPRnqXRN1Sx//tSxOYCE61nUS1hIypbrCy1hJo99pJ6GSPrm4zHoo6y5BS/a/qs7PRS0GL/6lpuYpaGzdBJ22o8JIu4/Gi1T6+G8UcKLQe1sfoxFGgEJ6itBSKksrlaRJYO5OElUZJW1nQgs4TqZffkm7ComOFVfL1LCndP1V4dNDPgFNS/ts48EuDqmsRLCasJaVgIsbJd0bKWIJaySP5F2v6kiUsSeodSt2oJR3a7W2yNOoWlB+KdH6WCcjASJnM67uKlJYIZ2EPQVLWfC2A4QFQt5Ihbl5n/+1LEqYAPtWdtrBhYqVQYr7TzCdZqsXg8K8yyJGKgswiPOBYCiVTacTmKSSj32e2xfIoUO9aqhVRYsePaJDWqBJDdk0caRKYpuHgvhOjeSUY1lHhFk1U9jKNFPKgsI4sYaqD4i2JCwT2PpbYnalHhUXDJK8UDVLjS2HRqHAHgIYuzF1CZRWj+uJBePE5hRJJHIDHiiF9Kn3AAAGyVyRtucxEwCkjThkEI8QlTkvspGWEtLthkMIpGCWKCaHqkjCsYZNZzksokKp5IhOnSPWUnqv/7UsSeAApgfXmnoHBxXJOwNPWNnnzJobaKlb1IWx2xtXuoPPnqb1rhK7JUYRQ5M3tqAJLmj1l1rcAF87SbGon1K/QJfoalZV9LnUeCdFvrPOuvYbgxNSwQLYEymZ9zrOqTwR/CZ45Mg7M8YqxVxRtscoghPc6JRD3Zw8cXrRVvsEVtKbNESwwsAkJxvSSyJwAOA+zTPYUqKdylO2Ip1qItHTc/1dHgdvz8nyPFXTVhBQBHEBdS1auCfUbc4RCBkiKG7hokPgYkRFVKU77fwo4+//tSxKaACxRNb6w9gbFSi6w1pI0se0vowBfDTqR40rUANp05G0mA+6YpgKSzTUYRPq1JoTBQG+fE1slzUaZ/oqDG+dYdt/5I2tbZHKDBQUOpkBAKB5lZsNveQAwVWBk0W4y9btO+p/6X10QEgeZAAEImSRyA7igElT/PwsyM0RuF1QqAMudV0nQ14kBIA1ImjxCFm30RRgkd88gp3IUx1dxJf7Ifz2YisddjLxrwvC4Zc511raYi6n1qpX9FFyvQFgAClJJLdbJAP8zg8i1Jdfn/+1LErYAK2L91p6xwcUqLrfT3jL5SiNbVxmztVMT4m4subIVt5UOeN1QvDdhYAqJxxR5+iyhmn0ziec4yZsrUcbLMJoFc6t7mhWjmyA1lAwW6fHsmgABOc2djgQoMBgACCOslGToQlLCgFBoThZTEndXgFwmTIOpw7Bjq5YdfeQQXVTbnmvXVXSQ6TsM0l5/1dc5AhN5KH7Tj4mMgLRb97NelJ+lTFQAU3r2WExS0x5QQyKMr4lik036zi1p4nThqenvI9mU4Q2ZphDtW6jaZHv/7UsS2gAnIXWVMJMlxSxLqaaWNZP6QGP3uyBAUNhsetizNtfXX7QDTmtUwJy5xV+JlHUBECpUjpBiq+Sxtps5qA0kWTtPrtHMngOEl2HckWEnHUOFNHlmveA8eq9dFsVo9CGkHQ4QhAhxknL4PM5EmEfJuQQ8EPUxC0iD3F/9jCDsQkmhbGTBiHc/Xvf22/ewhiZMpCSbKth7IZrkz/zCrucoiv73u5/Tmjh2EKyKADOf+bjzBA5UEiqJGJZ0zRS5OCIBgFZKTBcdYA/0bHhH8//tSxMQACginb6ekbrFEFOrplAm82QzyXxAZusbE5Boy1R5ps9WyVgBn05raNa729y0sSCY1wqmKix56njN9GCv3+v1Iq9YcFiX0jbUJARSaWTtMnM3kwJMfRxaBG5fgMJagd1KnjjKUaFqnIbwsxBacbQVLBRhYzAawVNq0Sr5wmKhl66hWF4vol01OF13MX6v/37KTMOOO3C57UeGqRTGkt9skbDp8C2hgqUo10nTiatq9XJii9oGhMRQovkC1HlhtrGrCqbQq8a/Y+27oVm3/+1LE0QAJuHtfLDBpcfonLejzD18W4keTOBsBOPrqe6oLCdksUYgH0t//0eip/S9aqquSAABBi7bIIKizkEx7MtGBexeeqxYvfAyUXkBwcZ8Sz3JLUU5yaMphTs870ntsGDA2Ueti2nSABCh5DUtVIKet52tKHOG//3pk3V4ggVlVOuTjddUAAIqTytlJSpSgjAkEe0CwLtbm/CuYQ7UqtUTtMLHLhQHrSYOdK7MpM+DQEESoxoeUWSesuSpQYe8aFj6Hs0jse/aJdH2lUypJ1f/7UsTIggosZVItPYjBRAnqnZYNIJFZCY1ubZ3qACKUjsriaTExfixK8kq4cikIM3L2e6VssEpC0f8hVyWjpt+G7CQ8dtaBYydlQGgwBcIi3qEG+VNpO9tR1u1/dr3Gkpvmhs/RVSyxv+FvveXn//+Mv1vte+BrI0059CoAAEiDHJKBwoxbj4vBG2OWDL9I0KplqWbwI7EdgRynIAEwbp5s4eTLzMRaqmn2v2qvtPmeq8UBIg848YigKNqHg8Dzg8QIoNmUG2pMJvFsFRM+xxZh//tSxNUACiCNeaegTXFIias1lhkcXU8gE2lFkfSAAWk3f+qx+xAkBeY2tJsu3viT0ytlLYREK9BJhtky/8gCbUXoSdRDRWcIox5fD7g26rEXlp//fjJp42U5Tk53qvQlNHlmQJ5vFh/+nvbVKSEl//kfNjYH2urx0FgF5MaQTAiKnHtmVHAOKT9R46Wnb4vKjYJokGZQEwwL40HpN46jtaFHuTpP4gw58hWBDjJSBJ9Pp/WBR5wGfSBqI92bkBe0W21wlezrMb/1IxP1/1K5/8//+1LE4QAKQFNdrBhs4XiPLbT2Gec8EDQZr/OO9gituSuNwCAUbBKdIyZaEZU+QhHTU4cl+xxJZfNBTepNHMUnuy9Axa9KvuartVOdOLziy5z65V3YRoBwJn0mKyqflO58/pkntSbMtwph5GB2Lvfr03p4NAUrPrTWKSAjI7NJbbJAdQzgBkSMQJ8hCEnpLQkRgui3eQbJwwEgxtzGxKUTJ2eGSoMxX4O9xmEYiZg2sm+nRyej9WsfDjjKiKHIae8vWb8zAUl72R3JsXPfXoS7df/7UsTmgAukd1FM6MFBc6cscYSNZ3Xv3r//vtgBhqSNOSRuBTsLEAh2ghyHhUYQfUPiDgOWX+JMlkDx+8Ri09rRhmyX/8eq5PXezOgDsSjWdoiPmvmbtOhG0dl8/EZrTyTy3mhzcx/F077r+cdx6n379v8WkhL7ur976yRqILLc00kkpbjgX5bIULCrTGVR0PVMsLt+xROXhRd8cCWRRjkXrlTHiwMC1siGSEv+blf/PI4v02Q4TxTFqDioHk7P8gZFX0/8/6coLAMgfFQILGf9//tSxOeCC+idTO0waWlymSp1pg08hcgfGgQ/1HjHoDolACdDuY4EeN4jBnF7w+1hpMAOZDc9AL2x5xH8iccnLNSG4Mg531gFylo4tJZaqMFjjf0okMFA5mRdPnBAKTgHC+dIoHNPBDHAOy4zx+YURj4O7pPaK6EwdtQ27Kx/sEU3pM7/tz7l+cv31tXCWCY4H6iOL4v/ZvmzM/SdpNbVsyjkdrEd/6TXZYYoKCDiB13ZZfPz+WGXWWH0FRdqIRckkXObFnS8ICi90NSzMlHf4eD/+1LE54ALtKtrp6Rs+YMSbHWGGV+i48WRNEolURCo1cns3GSbkYo3FLzP8nINkwokCYGCcwBwI3U072KOE4zFKTB2tpCuSm1jyITBg2gjN52kkEUEGVBQYSnbNZJZC4uRtQUiwrLCAUZZPNG5SFzXqCkuogjNcLidWUExWTvdOCiDIyhCif5CEMvYekoVTEEY/8Ed9fgBiB/0ZgChydwoIpGRtBzhxHqHlSgecEiorQ4PJ9QDhaaJCywsdFdgbfYyKQ5vVu+dzkOFFWdLej7Ih//7UsTmAAsgp3GnpHByiTRqhaYO8iLe1CtdjK1dmey7TOX1b6f32pehlVCIdYtHFix19sb4sUqNyo+k2EN/Z38qADDaqTZJBKjGAgolQfCoPLQyJguTDJ7R4i/ID5kFWFBK5IFExoVAAqGs7Ik4kKmgI9hlSEAFxRaxYQo0jix1jYm9tmugigRU5iGlY3UojEQs5P2gDBy6xypEFOBmRgrqZCfUFLB1CVaYvpUFLVCE9VHRd280Xc0SzCSBpYEQiEQmt61hUK0DSMXCbjzsc4K+//tSxMYAEz1rWmxlIMmFpyz09Iip6kNVFa3Naw66enrViIZFQDaL/1ZWE8XECC4VSopOOBNBL8BOGlM0dEwpxsLiz0AOdW1VhVPJ8c/IcYRTlEALfeHc9npWHZM+SynZWv81K+jXql2b/1snp+13NMhv/m79kMY0CYyVRFLBtdBj0eGm5assoZ5QYuaZMkDlIiE3l4mAKtzag5y+nzh1mxCjTb8vpQxdSpYA23mvI+iQx7n7ggq1DAqPda8WetCUIeJHkbjB9AwvaskVesoqtK//+1LEpgAKbClhrDEkQUWIrLWGCLRCmyyHnX+qlEbVAKKTkicaRKcFI/FZUfmbxknC4pLRqeL1nugG7iPrQ64WCJSd9M6bUoPBlANhgXNiwncKknqpcGBE+cA6XJfQsrQMmM3gDo/tePuEwrdRf0en+8wCITUhfOfuQy2rTA4MFBchxCwGYSxhYKCYlprs+3FKJhg1cXX0HFB566iUeV33whbH/xYV+Iij9l4386eY2BUIhwmkecuHAyH3CIpCJRosKiAmEAGIOc6yE4yOoeX1Jf/7UMSxgAsxN1LtDFFBWo2pyaSNoCHHdfvbdI3BsOM3lgvLw5EAJ+dJeFh5ESqpy0C3rEl+eH80veK9iRd35M85552/I24AxFGVmEPJIWIaGA6KmFo8DTfflsYl9LfjTiiDwYCaXOWBQWFUMEGDUjs55KAs0heAB9xS/BhkQldG2SjwUDKAkDMkDW+dlmCByH3dEU3yGP+Ffs2PaEV9VLt3MibP+0WkqGn5MRjDMkpNi+HLXt9XTJbxMA2KQbMu21tsjbCeCOmShpNkJERoF9D/+1LEtoAKSEVnrDElMX4S6IHGDdisGHA0PkaM1PWX1AFSFSSFeQCFI5mWSmroxe89IhIWXL2G2X6XSmliV55Fafz2gjUs0NzqRS6lrlyfrujO1YDZlu2lkbSVhHIGokB4KDsEh8ZJa9NwisGE0qoIMpRQTtVsZU86XETwI0PrUAyxje0gAEjHh5eo3Y9geLqOu/7LfWeQvkadot2MWD5NIgpfS15OAAFUR7diQJj8nRRJUFjZzA06thL5ylpw0wWqsBBMd7d+QKzF+94CY5M5R//7UsS7gApEhXensGmxURUo2bSNYPa5lbD1dkzOCjzqUOIiq4nM0Leskh263i6wknqqT0d77kiJe9T3VqX0gB8MlCAsMdceDR5EDZG7r5GHIy96NP5CJtBLPnBiBNGBAWD2TzBceDmDcvA0Ija+FfaJOWyoWCuWDtMIhdCsqCQhiQyJbxw5eeps2IynVlfToy/7+v/////+mjHkQUaSRlUPmDgiBxgoHyh9a5hct+t1BBYCyvWdsMAA/AVSvKtM78kh1ixpI84aBHJWROAkr+eT//tSxMYACkTTd6ekZfFKiK60xCWGUfHflllE2RDtvmeSHDPu6OQQPXRwhX/zS6EnJi9BBcJY+ldMz3eAAICcTk7VzhzVezZTu/aQAS6IAAWgMdpMdoRp0j4RmBljSLiElcgVQVDeqkqoqwfbjrP6TforUZzg2aMCAkknFFPLIPBNPNEw0wcobNA0WcGCp4NFGrYhLbKdMaln9hL/UtUAsTa2uJJKXxxPsECBxANHysYibcxYKqj4kilRtOuGAjUzeWS9WUKhGoeFkhQO1HhQAGH/+1LE0YAKhH9brDBJocUpKlWmFbvAZlba7/prKjoUDpBpRVjCY/UB9KUcA78GmnUtuD6hyQAFoEABgSAN8jG2gVCJwMZWotVHyGR5YGwRx1I6uwFEpWkrBKVyf0ZeeXmd6Vnrn2lrlDEqKHwmBhWgKrQ5NAGlwCgIrXUjZO6m3NcLpxy4nsLa+hUAyAhcmc08e6GbaiXfRNJhSK6XTWqscjMvfuwz6UTx2lDOUjeBZVtqHRnTX51WSq2iMmCBH0FKJdYbF8Ive0UCblGBruT0bv/7UsTMgArg418sGGnBSQxrpZSNIFldqLet6/uX8XxtfqAADks8zjRKkCmaww8cVI3QmIGAKUDKBg2GGRknayLEcknPtEyJcQpw7QCRUXmp/5ZszZ+keVSvzsGPOkKRLnJhLLE9jOr+W79qdbuhNpISwa/ZpQEk245/0tnsZYGMHOTgvRgnICgimqRhUJbp3ZAWOotdxqp2/HlQQF05z5zQSSrZVHnRHusCtLX3EhqZJBYNgZblJDeLkmvPlC4hQ+onAfPVuIPolmhVrIkiqEIM//tSxNWACmBVY6wwY4FREyplow0YuUaF7eiJQAAMkSEWSy1yBI8zUivtoLoODADykkISeYnQ/CpOiIgSiWR1lvx9QoeftYDT1LSResrA6+aBCu5/s4VfciMVbEprTszr+R0s1qP0j/8/+WR445kFYqdkjRdddbO1Yk61AAMbrZlsjkCmJ8em3Ye8StCfL53CUPS4GStWK9J5bdcSD5E9MLkx0rxgi+cQE7UyI82QgQgEbn6xBUHzI+k8J8z7k+svd9NdjKWZ5+MG6SACMDDBFh3/+1LE34AKcJ1MrRhNAU0S67WEjPw5pSItFCZtxHUAFd7bjRkBIOOu3MZQIJJWPCwJVZZwNDslKgS++PDJYEarrrsWXXVagv6wS3e3yc0QYHof5wXjDNRNqIbbUzNffLBCANicwuwuuQ8O2ojHuJGrVFLblyoajiT1CssqAbU1tltsjkEIkgsA9BbkILCSc81lsXBvnGfu0NYZYt1P8RnCJEt9qYmBeoEK9cMMKXQXHwg4wHyih44SkUB9xUEHi5py21vShRsgbIoeyaaplUKZTf/7UsTqAAxIl2WHsEfxfR4q/ZYM/DjHEWaaQEQGDdSlgQDiBeGyBADM4LAptXilhgCi4zAAF1BONaGBHp9IYozI1o85A0Xo+nJYLpDahhffjYdP4EkzPLdyy1vCeuf+ju9fPUtaYvPCBQontJmuGKYtzs/8///u/wAAV3UAAZTHG2m1gTHgHIgNqscRruipvFlA8EynUbH9GYEww2ZQ17ixYYLCoWFlLktdRg5l9ttDEMD4ln/sGAlgfNyQJANDw7j9QiQxDJ5LEsRyYo2938OD//tSxOcAC+TdU6ywZ+F0E+nppg00gzbOztewYGDj77b9ygAebYuTeFFVCgp/1g+HygIA+D8AANGficPmcOCB9SauKCVSEgEAmBFqzEA3Toyv0SqFWDwJMr0NRJkn7RX62kUWo5VGlmNtY7i3hHxc0PX2NYWBPxTR2R2kSMMHlSVMq2KjbSREFFly+QkSEB4qRoyNp84ssGDDMqjn7gARGBFhuLtn2tvQcbpUNSXkjr61qgAwo2iSSFtvPCyy7aYcZfBq003bqMVFtHUIyJXnNhP/+1LE5oALSGtrp4h2MYSaaSmmDTFPMTfBE2w2q7SopIg0AI+imyGdSy+nPn4IS6tD43eMcqitpB/4RX+DnofFqJlGS8SR4oJakZlOapCKLd3SZX0AFjRSoaQLg0WY15YZ11Kx+nCLvARbG8doXwMMgTTKo7lg/CRUFQYEoZABMDbTAiD5oVlaSwNA0ITvjwOkahpm5GZKR63xO9AlW9N5k+KGa03MoDMXP+tdAqAKHhq6JkHACpK0hQW20uAQx6eQeKQCCjAU2qptmR+fX0XNO//7UsTmgg9sv1lM4YDR1xhpxaelONC0jM27//++YIZczh7YqZHPO5I7Xm4M5o8N5bTvdIuVCGXCiUjA0dRDQlJgbcO7dVNUw71OetIACAbFCMpXE1daJRAQTAaVmAbjoPz8DpOLAh/qo+bPCVFHBMtC5ye5VXO3UI4E0pVJLsFEwiMU6/nShzVTQgWr9Jt881XexPRD5BIfDiHnldi6pJUBVSy3OSNEp3OlOKxyRQkhdUTSRM4wCDa45N016fiNzT565BfvuiLDDMYYuSQJRrmu//tSxMuAC8z7Y6wkacFdBqvxh5icLGDYhYpZVShrk6SuLltoGrePNHmPArkOPH/KICcOC4FDYTOM3SqHc6sAIOyyu2tEGPSd0OGpbfaqNgzHDoCalUiWkCg68TLXFrVmN9Fpf6znIhlobjHi5pTyQsRhl4uniFS1iUNOK7749TfQoknu/u01JjxI2p54xfWLNrUAEOWSqStEhvAA1AS2JKxtYq/5etfEYDRCZBBygMNNNFnxizm27YgiNUQ5TPYga9PqSDnQpirqbySrmsagkWr/+1LEzoALfOdQrRhrQU2L7D2GDKiNxuVe5hhYRmxR1qv6qfpET3vs3agAw047HK0QmtY8UTNvFQkmy8jzxlECRJAOmOH7orcHm7Il70FR+NYcoBw5IHSrTSAbLIHoLAUfrn4w3GSByLW7Rdyf29mRzVOKkUOYG7gkOtQ8uXWo3XQqALNkt0ltqYiGCA9hXAVh9RFdpYKi7GSPIKAq7jy+2HoZmNXNYDvXdGCxG7UNNTDEf+THkSSa9MW8yNcCqQVLEWPeHf/H3omwEWMSrm//5P/7UsTUgAtAXXWnpGlxTgpr9YYYnEtbFG+wBA1iHI0UhQcY7yYw8JSx44CT6rHWAyFkoNBknPgmKYjxJTaL+yBpqqVZkPdKKIqtKgEZqvPkHmQwpZ3eg+gtRJd3dyy2Q1ZeKKqDUBQ0aEUUl/ZetAKphzkH3B082I+pNL4As12uOWSNwQgwhZBvK0toSNJCxdMI+8Y6FK/Q1hpHQ2soz36JmABF9xSbw7HaLJttkImu3czqbqYfKzWHK3TtoigF+g5Woyx7f+7LvPct3X846bVz//tSxNuACnh7W6ykSWFdiOr1liUUHFH9kf/vGjQCi05NJLHAECQA7TSIAdRwIThjRuYyr2drUbOuJLdhegD5ddxcSh0PImWvWmn2j2De+2TvZMsZbKXpectelafm0+n0p7xUoKkB6CiGyjJW8VfS1u96E949Wja4wioABuff6bO6+73f34bAANCLeKIOat9mimD5rCIRCINz3GAIJtWGCQhaLFDtxJasTf0S+4vE4ClkWeNym2choOpm7IM4vlGqaNNs1+VYX7TCIhRy6zIYb53/+1LE44AKeJFvphh0cYgZqamklTS5fqQI70zYsyaN3c792QV9UnIYlk7LZ2AasakcxS09utJIft0vPpbOeFfW8MO409rD6373+NJYuWL1fv///////+WO/x/v/3K92V6xr0/bfQJb4f/km0pI3Gk2g1AsIEO4RBtAP5wDfMdTmQxpcVbYba5MkgiEaWE8hC4Pwap4KoTsli6iIWepToJWvVbndtnO3MiGKeC6xJCjUiWuo48SrxtYcRI3s8vi37MsXpv5gTar/t9X6prOd6r3+f/7UsTmgEuYn2enmFE5chTs9p7ABs4/+/XF/9f5+N/GqUj5b4zJCm/x//7RYX////+H8FX7Z4E2M73/+tVjMLQpwMVqJVVlqTbaZBieE/KlQkvgl4mTkWIu3FQukfBehsJiCms5p4l4INpe46uea+pnnf5le3j/Tt0IT+PM3d7c/tPRCAicHBguBw+XKQ///Z6n7tgYJiBMxOBhCZ9izYAQUiISSRRUQ/MOgqsuUxqXP/Cmpah2llVx5qSZkUZilSmtXquSuVWyTnKP2dzuqTYg//tSxOeAFOE/a7mcEBJpLKzrHvAC3NuU8U1ZAFDCBYxbThOuUeuj2jsoM6ujYqpRauc6pON3AgVncYrBttZQUJR1+LF0Z9TCJq56INwIXxO+hHuSDcEJkEX9OEzwssQGRQhGzA1aZ+ywjhujxNUBFleKh31kSJWoAVkB4wwoHImIyWRFwyKTL3vZIemCJNo5CDRVzmBERG1yyCnAJgIDhE9ErSRQbceETyJYOPPGgMHWq8Au61RparsSSCgqRK2lrYFvWqc7hU0szS8AQSNv1tL/+1LEpIALZMNzvPQAMigrKzWEjnlJOtKD9IfLQXfAb7t6yGtCaWpZh65digt8CZ9gHEnGBiNfpMxsc91GLs66ZnroqQnrK311MaJct1mViypK10fdkTR20mM/SXVIJhCGnkWuQeZaFAWXQT73MHhoigWgCIQk5AGMKRDKQoFFzG3glbjN5L7lfF/akASpSCimw6iMoZSysR3lXv9+N/CEQk/vfcdyhCesrEoSIgIBgwo2txsLrAwPOHiqkFbzR6oT5MkrLaSpb3oADVckjcaIJf/7UsSPgAugd2/mJGjhhqTrtYGJ6OAr1wLaeDccRnDxaGchKTgDayEgxsWHSTyHdDF7dXUz30MY7VjF8fNHHDQfEoiDwsRNMalZJhLv7AafsrJrWQcKg1WGf3qcgzpsO4GlSR3eigACBEl2fTONJ6IBQ0tECHrh6UPgwK2RmPiEV4oC88iZWdEpVvWOJIPJ/t9jvpxgRi5Q42ZEzwaGNSDYifiB+YetiqUnR1atIu1F/00X+n5k/FlhowsCMwnTLtzIxweiAJMoCgkOC15bZ9IB//tSxI4ACwibTK2Mz4FhEC009I1ekL2pVXn2cUHziw7nQgYluyKHN3FusacQxw0nk/hELayhs62nSRzyOp08WjGnSsUb52b22reY/7abP//y3QA2aoRBFUzmwVCmappKYHd8uLRWnUwlro2VtNu8WZYSthRjL6ipGp90hCssc/ZtSuJAxhIxjJ72271WY6CQ0NOSAU6k1mHtkwDEV+j9aRNrXQAAEADC1CimAoAOsHLAk1ZQIEp2RN/EfnJlTk2JM4XHAJYKWen7WnqTdrG/GID/+1LEk4AKcF1f7DDIoVCTKIG9IDEkattVbLjglBIUwKOyhqkBAdJobh2SFCZ4nF7oZbfdoGE3+1Cf3hBHwxGMDoY5AogMaosrRYXBg0kIqQ5QtXiyrJzEOOGwIYOioIjyTgC6sv4O45rBcuMJThS4q0YLNKDAOMS+IST95Jo6KOhkyKNVqe05b4X15LpALVcbjksjkC7DkOw2FYuWBSo1Al8HKmeCyhgUDCJH6GFKSTBhT+Qli+X+ZwqpDxotPLPP4lGIgPNKJEX4BW5V7jDwvf/7UsSdgAosrVksJK7xTg7p9aMJpO8eI6LpQwEGslHNPvQa1xABNySQYDI1sN3CVlGiGCAEC4bXJ1EFUmj97CMm57C5MLyRkQkRt+CCJhHIkI2kEW5wmjkgYXakwRnwMAOMFRW6Sp8SIxQq+59uE1DKg2ESgXHoSyulh+h+mU8WbNGyaWiwjOJSsgAxISAEwAgw5YHOg6YLInEcaKYPdMkQOVKiCV4qKJNiFAHmI3g5YeoxJ80tUangRPa0sYSSAjCIZfQEAggqgZypg/sFNLoI//tSxKkACkhHQE5hJMFKk2009I1Oy7cZacz14NSapbyXccpEyYNFEY6IkNGkIiWbZRRp8fCTpL425IsHgZQHhUzGelUAQAWBPBhXJeKTtyRup0lAAEuSgqNcVuZWz9tGYRBPtGZPlb0EQHH2IGRJSlkaSSQxasXwKml1i1cmqWNhXHYivh4FwEgXPO55QU4sBZL9CwkBAAJTAlXY8leiWcv6pcG6Z6oTVUzUcWLDJIeXQjtEuOXZZTbUzegWokSW2pS0C/0asY////9pQ4B0rCz/+1LEtIEMnLFi7DEiEdmWKoGcJiDrhB2lwfB91YPz4gcsEF4JqgfdgOIwN9tKapaK7jcKix5VEpXGkMVKs1VpRtGjcNUBgOMKhM0lrkuFT9pRzMWCJ8mKg+wHD5QUrPvh5RQTpUAAu+4ppLvWUefaLMFlpQ7+4mkI/+zQlsb1o1J1ixgT/GiVJ0YHJKXVI44FFUbSlUkmBgqHKLNOnhUc7EMVcFEkgmCoTUGoFQ1JhR5Q2suGlnTwNRqxLW5TlY/DTh5iSt7P//f/dREAwIwyMP/7UsSkgAoAgWDMMHKBNIutaPSJmgSVmYKqVujpPwruaAQaJDgnQEw0gIjaFDUM7aQNTGQ7GjVDp5Nds+UMQWUPtvIxoTvotN3WhJZ28iq7v1nnaHpo2yj/W5TKH3+pIFQKTCMbKIMhwRVLwKrMrj7OfD0xskPUA1chLF7ptfoCMqxCarBOHI8OUgcu5RoUcd2zx4xSTeIRhOhB+6JlLUt7KPYK7b+Sk6XOzwJxqkzzHKchALDabiUiRJa6EyRi5Z1yCy46xoJjxIbS8lYgOW3u//tSxLODirxDYCwww4E7CGtBhhhwdgUTT7nVvvYaL+1eMVSmLZuJzdfhsx/PP/6efg06Sqskhm1AvAohWRMSzm/u47WdcralfZSAg5LfSwucpgIhS7i9XVcuNFwYu2IC6AGSx400gPkQR6xi4tBuJ1hIcn/JTOuxTz9f24xrb/+35JzBSgWOyz7IwzvSGx6hK56/IscpIXCoSUgFMJWTP63SXD5BiHcAMQeTigFjYyTK7m5QGpSaBNZvRSzKpld258OvXtILiR5sElb1OOigutz/+1LEvwAKDHdUzCRowU2KK3WGDOSnA6eaXEYYq7a63JMFUOUhinrtSnIrjX1H6PbMglhJuNNxIlNkFsDVoAZeEJNDvCqnLbZMoqNTwvL7TYhFA+jb9xERAZqzZkuQgBpwFQMIRpcGAjS7Axx7qTGcuWnNE4qFIt7NXF0Gly7WVzxY3b/QAgEQFyNOVL4UjEn0rpUxlxo2g46oemfQD8Cem7HJNprUjcuFW5HGn8WOM8mR25HagkxyCYsG5pbBrDYpHXI/opC1Jyq85QpYxKAALP/7UsTLAApkuWmnsGXxQ5cqpZSNHNoSy/5IBNQhIVUlutcvKscRxFvAaMIQQBJ8flwkNlARkA6MC4dNuqrS/xYMEWaGpuRk8Njy/LLbIy+X/rGjAlh07LgUCWqO5kT1yU80iQHoHCAXeSiCVLRZqyocSnQ+Np7JxYuhK30EsyRttxpAp8B0PB3LbSHASUZCIw6DyPxuoTlYWq9WbBTYX6XeVrcdWN2qT2jR9YdGELTq/l7VDNp2DmCWQXn9EuK////f9SNkeHYsNqslFNek4JhI//tSxNcACkRbYagwwWFPC+y09hh2H1kzMFFv/W3y4BTuujbtujnXiHnQdIZcbKPZE2vq9MQlbF25zyvmyLn/Xtuvtb635ItdatsKftMZQq1UQ5IMrZFkE2qBo/z+qchhARIJs8KL55f/f4fbZoq7965p/Dv2lA92MQDSACUnZEh5d9rZ34dBwFGATK03U2b/ypD2cFEkTCJQwWYHSeaoehrOci4Y+H6l8zOqCekMgAqQJqSlIIFc4yuyMCKnIF3lVJB0mEFHnEn3Nbi5+lSpHLD/+1LE4gAKGIdTTKRpAYeTrDz2DHywkQ0SbQMHZUXSiEpI7XJE0kz3DTazVFDpWHgiKD4uB0EBJUOi3WYlrVlixBpzDLIxscNOyKyEb+a53ozLCRX0+zKVRQaYExCLWyBKZpB4JAcja004vTQpghAQ1w0c1d1zKYz/RSQ3JJZLY2kpEPZPkyLHtQDpOKOvIlyQKihthx+fa66EnJ/dW6bXLexz9tgGuSFbTNSu03dSYnM2/Csfa4yDK1PegA2rGgdwcfXSs0BVGQvc7GJYLNv13f/7UsTmgAvNB22mBFrxcTAtNPCPNGMPpdvS7dEwAAiTbVZBBNdIMCmuOrPKK8NNPXLOhJ42DIh0hKFDqwDrtZJ/z4vH7+iVJ5yqORffrsHvuLz7Q0qmLkhh9tRy2cIBEVEDUI6AdKF3vCarA137LqpNxYuAxMIAg/exOuNVCBPklktaST7d1XLPeQXZLKGUdkNiRpMWhPR6mKdpEJHbVpT8fWZTYgyTzO/72/vSSSWGwIhQA2DLVhMljxtbGrKqe+569VRYqeQv07339xJMmHQ0//tSxOcAC/x3Z+eYbOFrFS309hS+ZYE3IzJs6moAARjEQQS1aBclWwy2DOrgJPdUiXcMS3B0aWUy+5DbjDfFGyFW38RJV4kon4K+wvDOZI6//V8jhdJgsegqDwKgukLHnDzsXF1I3gMSGS5VdtKyxobPnCCV7naGhqjSlQBKNouQDI8ZSYmIBA6JnkgIYDpoFAolA8qAgD2JQlKtA0pbcDVM9y9HPXh9Os99g4QiOe57I1TGeXa7OyLS7S0qSybtrounW9vNdnN3o7mcgpHv+0v/+1LE54AL1Klxp5hw8X6Pa3WEjTzJs+dR50/LTbxQAAZQVW0TTgS/BigQAcCblkZZ00lL6qdioV3Q4EpxHMpHe85Mir6Ndbnfyry5OtC8oUDIctFyr+hDx/W9r5xdBRG71/edrrrf/tOKjIkf+9/n/fxdsoflN5DP9/EABOpSW/XW4OisLMuaeBb+TS34PpnVj6qcNQ1UuQn0se+pIh77GIi6St1EBo7TUhdkqoR9LTP0panznrVuGMmz5x1L7mRn8LCW5I+KCh5kDsTesRsaeP/7UsTmAAuAd2GsPMUhehOqKZMN3LQ0m958YEQAmuTtcbgRsM+QLriAgekWkGgyJEkXaUHTca2x5Unwj7i8oHV2YRw+i0GIh0OIYrFciockcaEkz5/DM2Je/trsguLn1dSz6v8nLztBigN0AFRaXfigOuMCl7mKxPe8UQABU7LLtbbNEiIjX1Fx01ebbxjVoGChc0gbVBpIwiAaLhxTx2lKZtF1z2dsz0Q+n+X33//8+Ofp+ZGiF1zCDFaBnXAzhPpYUCAAAggjKQreJI59/CJn//tSxOaAC9T/TO2wSYlwimq1jLBVCf4XERwMDFvPicQOB/08Bvg/yjj4AAzKuklbTletMNr84Nlil55YNuZVMZdVrWJze7d3eFu7R3sq95JCtkRdL+/wso/+HiZxCPhJWKd7+X1yc0YEIouC5UPuRMRQnTqnmvkfy5bodp04IBFmdCmdViLPmAQsCXkEaX0FLth6D4/Lesj1g+n3NCQzEpLJYiQU6QzJhEvw0nGyXTy5w7gLxb3pID1ObCkmqpoo5zyLAnIBeAHdXHWzneHPIGr/+1LE5wALmN1brJhu4XwcKimmDSTHId5PEMFiOk/xnk1JMZJKi6tDh4dODZRcNisgyTqVIhJNg+gjMgQKsZ15RmpHNttSdTcxmcluZnSRqP0/fvvyPVS7I7KUBBEccwqIC5gu5ARXiZ7AlK961mgC8KkSQILY00tMRVcHijcVcp15yRZP+PM5q1nd2i4ie8VdODpvgMBO3JTrxjggA4xhANBBzjb3Z5nWJ+7pPZal5eSy5UtBdiSs9gjLkAmBWErck+PaMNImJphlCC93s/yz9//7UsTnAA1VQ12sJGjhzSnsNYGavYTcQRSlF65NJiiNVGU0B4enl2c2kcmV5Li+FtMQ/GQbh+NCqRgoJcCZcTruMiDTPhMjwqOyPFDhQwr/yldKkPa4IPHnjEWi6BWOqa4rsTXVvmHjEaESjqFCrpSTbPPA4ZEMqoAAvbbK6NlGxGAIS4DoiqFONh6DQFgwBZqbY5pM+QELlMjRfffOAQUYID7hOEYANBBM+LOCKhZgnCLWqe8+Rb6acy44ZdX056r0aOqcNLJbBCoAA6kUCAjF//tSxNYAEblHb6ekurG7lmvph6U4DC7bixsaxmZqh0mnd2RQczgaNcxgJ2oum0+VCnCtI6TKFdkOa6iPf2Ih76PM7bKjssxU2RkvfW6Lu/o2j/KhrUk2cqKrnTq1tvdun/+tWKajsNedJhDdVlsTjRBcjStkTXyrABJWT1BJ7TcFPX+8DJYc1Qg6ATgorzYSVg4XBmXqBWSdS0KDGKA1jkFVusaWPJeEEV76dRM2ECUbELEhRJVYUNoCAvaFsZbHtHuS9imFn10rQALs19n1kkz/+1LEtYAKyINz57BK4UcKbTWEjORMxPWczg6QHwNvRKu0EI0c3bzX0WPQ9kMRnU1dVPYyNV3AIwVAgnDoaAbgCYhqJQCcFlBkKllsSbACBI9yNcwk2IVRYDhNTqwpW76kayEw9e3G3qMgODVFVZLW0nTJEabTrWyZBoMJtqGKXodk1KyLITMT0TMsCQRYCKzCq5lNt2PIHTdSNSMM0BPyTh6ViVZTFwDGdSmV7ueBXvWlw6SS+18ritIgSga49X0iO5UsGOWyy2tpMJA+hHDJYv/7UsS/ggvNf1dNJErBco6r9ZYM5Cflbkc2lMXk3kY5s048+qmGIxCPGCtFuXzvZZ2QnuWWU100psXmxrKHFBLuFRKq9wxu1zmKiu7ZXigNOElGtIb49Ns6kE1brZLZE4EPOM7EOQJIRuwVX6FoEhiX1h2OTSAdkt5w9Xo4S22GR6dLtojjHXOXNOCvvnmZRlIHyBVvEjnpFgVT+jtIllBIQnbjxkyuBT4ZI5lrnUoECFptpyNpMKU6IBkjjD8TfQBiUJR0Iq+xYd2RA+i1F2+z//tSxMAAC3BhZaewZ2FnEK588w3OBjsKpIaA1gFGUBPg3zzGOcC98LNeGs2/BGc/tbeBl/o4/n+/zbru9/Pt+9XdjN8qIMUtbckbTYBmAOdTOEyB9F4jl+dVMrJaTt5yDTAZM8c472hlP/Eu3ixqgyoiYGuuJHUEWNnd5GSct48QuW5DLB9+QmBQOEyygZGUCl6SorOelNUAiuk40ikIUqowNHcSoIUqhyEsDl0AeSLrlxkobuvo5YqJiR8GsimFWGS7u0LyQ4FS7oOvLscUSMf/+1LEwwAKPH9vp5hxMVcUbjT2DLalQrDC1JEIRTln/pXTFTl2WbMmmCi5hVbVNoFLzwJNpA+OjDEsKdJptCdevmBiMrYAoEzFgKpgiqBA44SkyFTYFaxmajyWK4QJAZh8QIDB3wusL9dxo4lc3/2EylRAufEAYOJhg3AYIF3/Jg2pXLVNCJ+MiqAtmYTxixgAZA5NVpa/XjquKhKDqwocSJChB5/fepznODUAoSEi6NGGAwgLm5V32ujRt0gJJoIfEez3Ps/QZjUPlZacZKJMLP/7UsTNAAo0X2enpGi5Sgps9PeYNkP9/MdP7L4zmZ7td7tJTfRUddlHqLg1GEkDFJPokRhUWkGhY04RqCQVaqF2PIkgc11A8c+i2elXtMK1fxA65ywIBKSURSSIMalQch2vCiejoZV1NGg1UWmZbOZg8JmcofVJYUgy2d0d5Gm3/KOGlmkZR9UVtybXeJ7bMJVst9nGq3Kxvll6//008v////XtRGMY9UKJDKODch5CihItAsVDVom/93gm/2+dRIUQMWHUZSVBARIGAVzQCMac//tSxNiACkRjXUwxBzFHCSiFnaRguSz1cb+xG0u2ZCB82WzmMhbSQlLRqBqFsOBiK/gU37hjmA6VUeZtNneLi7mpaZSanf/qhR/7WMGHnWC6ZvFygC043G22SWVRQXRCNyC+PxakqmW2TZJrAvftFvU3cjlhm2/JsgJbX4m4zJHTGwwXJ9rnxEk+Efc8g48+oTgfiZGP2C55qoX/YZmU30cQDAI7Up2qxQGVCAylDgp9krUOwAADRovM/rRCChvjTx0nmy5OJZ/HyOVRI440kGD/+1LE5IASHZtUbKUNyacs7bTzCqfFZ98e8ERWt6yqntoZVJtra9XRq1pkGkl6zRND3Oc2krS8RnEV+rTSACT/cgG5T7KuKpB9ozZkhGVasUUC1IgU1MTZLFUam4lo+ZV6xxG//ifcVBApAbDClDOYjTbgpR1x+9VLk9tXWLf+mQbmTKpECguWEz3XCg7utSoAANbWzRkkGHyK7IQ4WMKsXAgpRRny+wjAcTnQANQWPN5m+DFLORtRFxZO7VsWZATn2IXRdXAjYytgpWY9f6/WoP/7UsTFAAoQX1JspGzBVBfuNMCO1gxVarTP6W2m9C18iQAEv97bESlVScbw0RjCQq4RMC/0KzFh4fdBiru8VqI5EnAZxCyw4KC6XPckw8lUJn46XszSJFI9VqfogWX7TzehKGDIyh4VTdWcCyTt0VSh9QAAA7k5EiW6gUjSj4WACdBAZQMtkiI/thrtajZHVoGbrXx3BYkUYMPvC5OL3/cXgeACOlwk64dkDpvNi8OVCwfa2LIA6hQ2ldsahCuthCPp7nqllbHOeqtynAwFC4DQ//tSxNAACfxNVswwSMFKEGslhI0gEYfI1y4CtJAKTkdXIudbMXEmKJLcylYaUKVMN05IOTh8eoB604qtxUipTARLiVpFz9mNV4rssOqZSPKcFkGHBV4dtMCg2dIpmkPPFrnRdSWNIHiwriKKud1bGPcFEDUDtMaYb0IAAFXaTWtFOrxWATLZwRyEIWsIohwuDWu0hOMNxyLyWM/NkJDpxmur6Uz9wXFnbryzPHbluSBoKPJmiKmtVXmmlSbn1PA4uZAcwb3qXUxa9hIWSVurrFH/+1DE3IAJlFdhp6Rq4UMHbHT2GOTlHVSU98sgAmtJZJGikwzC1Qs0yWHK7NsRar9FN2zkdkKBMvY8DGVhy8wigwEEgToMgjsbMKv9UIghTrdV4f82ZZZyTb88gQHJi6L0JWJkhJm+w6xzQkCC2RPvaWW2lPuSi9l9QAFd+l1+klxpH8OtGAWQtBzknLfdwVslDTcLmOvRJF+8WTbtbDtYhlEJua+WzBTBoQuCNTzizZkkTSkkJC6jqTb2oDFZDLiAIuewTihRbTgRjpeb59U0//tSxOsADLhvVawwbsF3kuyw9g2WE0X6VIG/Umr3/JBJYIhU4OLAVnMqcB0E3UI1RYAAHDghORdCxInF8LCIaa/jDsbZ+kLA5oIEDk/P9SFi+cdoTyiy188ZjMHzCIlqzhSTxAJx6LwaENBdM3zt4wTo2K3abZbUYR7W3e+/7njt2Gwbc7XLR2UdYfkJm9HF7Mt1AvEgRo0SuLym9mDHy5Suotwt6jtpuM6/TgTvM1Vzq924TYnKeZuedX8nlfyZgVVkoKnU1AkYlWAGwESM3SD/+1LE5wALpG9ZrDzHIXYWbPTzDeapItu4Td4xeW+7zMn6ktJ2phEkjh5o1pTw6SyZ9r6dlx2icbHxm/y962zTnoY7z7vreNNDhtr7t0mTZc55Gtxk2QRdDa/2f/0AAAlUpUFbWQrQ8iKrXGgyscMBvyYlHnuDEfgZD+5QLLONEQKB9A5YKPPDwoGDJvgABXhEgkMlyagqkccTWs+mynralJzWTR5dYY3RpphdAP3of/talSkAAYYQQJr8RERVTLNXk+zSRN1KTjOHhdC5ETZxXP/7UsTngAvIdV+nhHJilDNpyaYl+AfVFxF8Q8V3+sySLVJOQZ3N1Gyi4ii9kDy4pIqxqGnCQaWC8xqh0eB5JBg8lhd0H81LkQ/5aFsWJExpp6RfNoysFJue/xUGKsqc6aQoLGfPEa/vqK6hvjXy6AAGVXegBZfKYCXqT693ufhE8evRDgU2xLElQml1pwwEUyuAFop1mgqFR7DRVJVbnJIqPUIiWVDXNCI88Na3V1km1xrGJtfXGu26tGL7fxwAAEKqyuNNSqUOWlcDRUyd7Yxk//tSxMOACuynUAzoxUFZhmtxhhkQqX0JGJ+zh9dXCtene4lVV0EPg6vlEgS953MzbcvTIr6fqzYiJCJnW0Xn7CLEzh1ovf9/6xpKaPCaMVUtSBO5zlgAAORNttokxwloCMBbdqEcmgMUm6/A+0L54Ni2YMUymUCFaS7KRq9EVOlm7Oc7TUWaYvY5EdyoXDAlIC0SJFyNGGHqVobovvvs8zz38kkmyx6n301loa3222yNut5sp50QotjxgOCAD8IG0GW1L7MPwT4hJJjpUTEQ20//+1LEyoAO1O1ZLDEIiT0Ka7GEjSBhKK1yc3ohIrz25ysab+TNlfMuU5jcAok3i55PtL7m2qzJIS3f/Z0adT79l7ragCAAEInKm1BSo5ppIEH9dpsZCYGTLMgqKC+GNJxLI1BHvTOi6qm+ZQTaN1V72QznuwL8025+antWlFvsuyMr6W/9ERarojn/+2jgj7T4bvY52CpFgFqKySNpILgrTUJSOI3EIktG2l0xMpSHw3IfsWkeqanIJjAbPOBpyKXiAuKEUNc82KtF8u4cAF1ojf/7UsTFgAp0mVmsMGkBUBLrNYYdHI0jJnIYJ8XUlwfAJMMCQa//TJgAAAIS5VGR/JCmbZ0gNaXiPEMFji1E36jsRvbXcFqu5TjU38pCkayUSVjsusxftZw6Fjiz5c7Wgu9SEgQgCbqFV0dtgoA127D+nupRV98x9VUAAABCSRlFRihEUBGcPmjAiQhefpxmAwpIUjB3Zi0KqQ2vV5FRXecB8JSQ4ZUKyOvgWxKrMhgyCkWMWpJ0VU9O6tYGqWIirQ9U5Ru1rNFo4KmH3po2TAqS//tSxM+ACqiZeaekcLFKpOt1hIksim11QiPBhlJCHfhAkjFKgYSIBS3rqLfLXGdsjimDwrltAjEYf9tiR7oSmNz4WmBQiGCPIxRvVR8fRI8TnnzhRNbef5mUUxx4LKTSkVOkHAMEtzNMKu3reMYqNTcgMVFRwIibR7EAAAJjY7msjTWgpZSmQVE+cefViCl7/KT9cgh+wSiZFlLf6dC0FQ4RlizxOPBcLB8+KOTsEk+ZYQWHkIJ3i5cONabO1kHM6HrQ0yt0Mb7L5eb5MVmT4bn/+1LE2YAJtEdvp7DBcUILKbGNLNh4XKOV7awAQGQuG3G5OxlrpbYLnbSLyKKFQ7FQwyFiczNsCBXJi0coFWCcYJZTuRmOgAVyizwMcAaoc6n5G5mVkc5dk6/fNtur326f9LmbopnOqdGVWRWTU8hFfZ528jnCmLmUEYqDCwBCIqRhrbZvACBBl8riQAj0k4twsCViJw8AF7TBeEr3kKNo0ArjpOlPKYt53nQHQOIXh5rlQk+Qs0V9dlETwK0W4P0/ogVZER+LrQoowSXGEaGGp//7UsToAgv8l02tJG7Bc5Up8ZYNLCGjxaHiJk1e5Ru5PYn///U2c0G0ofh9BViKFf8oQAZCEgIg7AgRjIpCiUgzSwiOzhrUIkFir5sVlr9ZuRpeWEAzOvjv/33d7sUUe5+iKfBkGPNo/YcBA82iU8kEDqogVFzCBQUGnvz3RBjj4IHGKcQR/3b0stR3/+jQUmUAAFqtAAgzmXUsIVJlQ5EEN9xZLNHamQQNc5VUuk2adLbs/XsOPSJeYQxVVh8y/Lp2WOUZ3NkPFAwQfVgTxM4e//tSxOeAC5g/XewxKGGpLGs1hIkoB2mxdYHcLP+9Xj13Djy9XV8BfAus6eEDMXhahpGgiVSqQBFFAeCQPY7Ep8yEl4tkXoIRxrgedSJxnMDcFhcaNMjmqYQUWFUUqeu0nIsF7QWYKpV3MoXPf/ja5GLv/A0p5VUAAFP1lEgEuIIHiBhwUdACXWoR4KWcELS0XLEeBCAeTLHnwedMeBiVieyjEjYTKnLhYNmQcPFRqbhQXYsQpnpxL1FQ7MumRhGKgHhSFJHLh2bcDLTtqAEuULL/+1LE4gINHINfp70p4XucatjzIQgEDWTymNei7qFCIIdtiP9nJN3xbjbPctU+YAiRXFASlKqLLh8kJIhijIKEhg34bhlFK+aGLs17Dol5QmytSNF4v5tvXR5bkFM/jzW24h79f+/01rvXfN8v/am/KdPxNz7t3H/T41UAAGHyKRlJKCniVBjBdEEOU+AeGiaofEjB+/R8VEWn7Bgg929IubKJXpCoxCWpZw2pHk/GzNbr9m00cJCyUy+lnwmEoB4cDRqWDAnbcgJrLmWqQDTgbf/7UsTcAArQxV+HmGjBKwhtPMQJlMsmroK9tHpJJDk8skaaSB6BsAJKLSlANxNQB9EkpOBTYcAGgVN2xxyYWF+Puv01Q3YIecZzJDDGoNF7/Ccqs6hSRPhf0EcXPeKWzpGJJ7noeEYmWSg7SbPPPLtQa+ibxowAAMUBKwUwOgcycDsYBcYODAAomAWLQsVfRaT1PyuqUQooB08WoHZtYzU0BA1E4YPhsMWW5zBIlW68fI6Z+bbViyaUj579Uv9p99QqxzvL8a56tVGCguulJ5jj//tSxOkADFBNU6wwaQFzDez89gytzt7h0J+ccAAClW++mxVizoAmiKM1iIaKJnYWFIJU6e3pJcOMcfTsDsD2tJrzLNnPfcoi600reWJDoKo8VNEfbJpPJqaVu2tsUtybd/9/8vmhq5MHGnT1u+xYnGhHJYgTPSypCQAASspV1UFCZgNklI8DkOYetM+EnoDRHcmUhqHGkjE+g1MPNdtLKs1tmlxjR6fpqW6UkmuufafKdUz+yXb91J/sJgZlu/YLQHJdjQVcUhAqXIDQGW9E60b/+1LE5wALqM1Xp7BlYWccbPTGDL7rIRaboNEkMcjOBxIdANGgF5GRMkFwSHZ9A4btPB5LzcF3hofMhHHqylQz2smbm858ryp2amFnn9I68dQtez+3xb7mriTrgntkPVjZvz79/+cX530c/3WZebdXfyLm3bRSRJrG4RkgABpuVxyOJ1qpRoNggO0CSDKUKyoomORRbNTwIggjaPg4Be0TTNT/IfyuFAFwLOX6G/YSURDaZkrl4uENV64VkWIhCXWjpvNZnYHk2ZFK0KZCUNevIP/7UsTpgAw09UMs6GdBdI1rcPQaByiVrGdC0dCoZ4Ekr17V7G3BmzK8cGI0EYq8RJJXDTXmJjFM6zvHOhUSoQ3uemOO8fSSR623X/////31HZJX8Vnj1Y5JYEKesuGGFb+kWBMoAAgDW6UAE4FspTGKwk0x3OtwVMGhiDM1A1A1N3flDOIEpDrbUuLYXDN4CcUdsPIZ8jjmnVdNe+f8zSYraC/sEBoOTRxOoEBoEicoA1T6lqPnNmz2ws7J1HMLJaUFvuQqwAAAIgApwyocys8///tSxOgACyDfW4eYcLGTE+gOtLABpk5jcyht6i5CfrqyJMI9GxGWfSp7tj0xT727a8R/DzamGNBspQA3FBIvMIMcIJRjEUuzlJziwAOGEOdlFrOUDCBhKDI1lap63jJJXp/5G01UGIChBcMNPi494HILhjjFGiqWCIZ/XSEEdKogS0Y5QuietQCiSJA0yA0tDyibM0NS6WYTLvPeYcCOqVY6stUBGDouIQ17xpJYKiIOrIlQWCrBF4ifNhoPnmzqzymZ+iMQhqYbl0lb099K2Dn/+1LE5wAUvT9XuYeAEX0Na3ew8AB1ABEdhc+gMZPjmZEabkVmBCDvuooJwnU2hx7zJ6huqJwY6umqY+UXphiUgEAnoOOIJaZFyZNwaVocVbjZ8cMmmsd7LFi1CBwGWzWJXUI9FPPFCwASG9PER/9Y3MOdWeMcZHEjgQG7zRbHk7Zgk1jhqtCeQ7m2GZmOAKEKAJg6lNIuC4xYLokio0NoNWoQ0GTS7GPfflr0OiwECqZK1qUrSjpjHOmAKMf+xQImFomqjX6xp4zeTjQVic8qgv/7UsTCAA5tA11NPEnBVAos9ZYMcO5V41qCsfF9GZPGAn5/GbW46rpb+NR83NwbH86VRQbIUJTRIeTLB3Jh8GgSFxCRUXXzq+fMFO62rYz/74iSpTNWoV1bX/aW2NvEK0f5MMF+Kwi17qRTmj0e4dGGUOSNceXYCcpz9zPlGfCcFSrGmS6FnEgwJonAah9L1WNSKtmk9Cehqb1DdXZ+RGPSVSlpYk6JVQABAlWEZqRsmUznl73Pe6lGQLXYdYHLjI0XCSKJOAQTlXtQrxF05ZI5//tSxLuACkRPW428ZwFZim39hgw86/K9mSiDKnOFFPLMIvWBn3lRy2JfpW9qZP/b+qsw0oIixIXPVMVUU+ugAAAJUSEacVSYMZwCYqTOXbF0BK34dL8w6Sh5EAfzxlYHr1cb33U6vrfo/YqKxjUY43RdDCRRpfpv7I6VhBZYNngWWo9FFqt6dZ3kiWCvjtCXe9UAABGRRdthjfeJFpb5NxogULEqqAChznLgMCgmWdgTcu2SWeIlxfLhgtmjXd3P6HJ8AxZbhRFEcHRjRFSYU8f/+1LExQAKcHlr7DBHoUMML/TzCV4EBFb1unUWsUBs0q9L47zNTY6oAKupumgGylo21U5AnMp581lzj7vq8Go/zciPEomZMOHvw2HdzjXiPekQ3/G+OVzine+e4Y0gNiMcQZttt12NsvOlTZ8yoeScp7lChRNJhtrqlQPgtAhgtqoVilxH9C6FfrfF/JbTxqPUlIDwMYqOy8ND28/cdvz9y2+NqKfZ6eqV2IWY8YTIEy4Cvh+B3kGJMapYy2ItMHaY6cTkNSLmPGLYTMuw2xwRkP/7UsTQgApYX13tJGlhShTq/bYJLIJ2vJNXRKMEVnYIs8CZOPYzhDtLOwRtbxT6xTHviu/vOt/+mcVVlGCaPE3lVn+um1mcXN4/ktm2Y6oOCUpLLZJGiUAqrl5NZ+QUWNKGkzOjiNVV6c0DF9pdiyBhDKP2nc+XpySSWs1TqmmZc0JQFRgOxFCgMhpQkCss869HDhESpEQyin/9R3hskgQRJZa25G3ALCuFgwXw7AZVFMQqEYLh8MD0yA3FGamSISpCEljiUhgVUkEnjzNpAEry//tSxNuACjhfT42kaWFGEmtlow3eiXWCsJGirlLEumsNQ5OuEbt/Y8s2+xI8wyhZgCroDowMgDXwPHiAAKkAuMFiBlSDsmCEGIWKCR3FrERf+Jw/Iobf+3KL3Zici9iksZgbhCNIQinnFszoACFOgt2sr6LSxO+T7kanc9Cb/8j0AC1clTyKtFeb9yBEehRWFEeBQGg+mMLEAFkwXacU+6CiS4wwsbgjSeAv0P2I+B/Xh8gZHjWACIsZEMFkZgQpmiphEBwYAaMAoFPGHH/RNYz/+1LE54ASPU9SzRnt+TsNrTT2GS4/cBMwkHGdVmNvQw+MxSM08dnLBiizTkocJQTG1LwDGCQwo46vRaCBJWR7N1/GIGIJS+pi+4N2yvTTdNKNaRmS6JqxbqfOZHcEwNnSIdouW7tQauI2m6+8hAAKUYlTUTQAQVFW4wFKu1ADRQ6eE/bWZJUo2pEgjNYcN5+7zqV37U9+CKHPjCQE8ALRCrvJZXpCLb4m2sYQlfBLMQpluciET98/p/+ZdeoEAFuhokAAqLgwTnUaGoclgfBixv/7UsTVAApkP2WnsSUx+qqpiaEisTTxocjzb1lHzSLd6ojlZvR7QEdrOmFj0kpkLmQ4pQ9m0q5pIc69e3e8slNaCVmPU4VvPscxOowhup2htD3KcKpICSZyRpEAsOTkEUMXpPKRHuHwkxoC6yDEWFB86hgDf0ITrkDUEilWP2/0P+yHlY3OAJcgGl6mEGdaux6Fq//WlF55CFMh242WE2JdrZKFXQPsgBSRygIOMgEAhIUOeQeFAMu/KMsByerU5weTd2WLBXjZqJrZ2mZBzZ3P//tSxMoADnkRTg0YVQE+Ga188Zn9tTZgZbFZsi1M6ttqdQqnOaYdQsOvWYQ6HXfuYWZOG77CqVXr6lEEBS6X/obTEI0OxFIbo1jyq6enbBiqqZVzvn7fJAJJYYFpMGsez3IulxSht1F35GUY20OwwJBiwbGoBUJsY84vmUr5WW9VsxCsNFeamWwKeRq7xyoEAlyqNxkklrtDCeK4113gU0vlhKsQhOaACyYJj0SDuH9Eezushod8kauZgxQsbOkSQVgq4O45rM4CvOrBIiFyk8T/+1LExgAKdFthp6RIwUESbnTBDg5a/qSwpYv3CnSeV/FTqV3yrm2Q769Za43AlB1CUBMTAKPCkNsMWxxFy0/LASp4Rr4MdE4+2wCAI/tHrd6oPj/oi75voGHfb6WNdkelWJ2lPRSGtPvdz9Pb/XHfZ//3vv/tjeK6IAEk81kjSTC4LYhSycLVRIA9rKckSGkmxIeCcOI+xDy+sdSbsZscl0wcKYGyKcRskLOihdTOwOXHv0gqROUJHaOtZVjlv+7tdZZEovv033p/343rmnb1hP/7UsTSAAo0rVDNMEkBThBtcMeM7vLz3+/G8bzpgAAU4nVKsP+slRFOxFOG8SowHFrC4vnRH4cALkY9QzAmrZFj7/+zSE5s3Tgo5qKsp+EZGvMxiJj3p0qf8nqtY8i2zn5UrswYkJTYlsjlyyhRa9SswacSMKNFGB3uAAAZYxKiacBdVd7WhkmZUUDApfclmG3BqHqxQwPQftIYRLonT9NtjdgjnraCqwh7Kg60j+ey5BVI2KfSp4wKC5E+oQYVGMNwOou1sXakWa1Tz0EZdzS3//tSxN0ACmBlZaekaTFMCG409hg3sDr0GXgIK2XrBBBaqn/948DcUfWmLgfx2lMiO8pMkMVG6mg2i8sHpUr6hpKQLxZRhjUyAV9yWGDrjpUmev+4gw7DgYSs7EFXRiEJ7gOPDF/y9pF9vlkqIHv2eZr6G2/y7umr7PdFAALIpsEyBtg4EZQCmElOh44oBPhOJlL8PpAGU0RAuuKCOLeRN6x+tHcUjkJwm+DHzJkCpEOE8Vyt0KCptAuToK6osIQAKIyMHcjQjHeS5XX2Un+enrz/+1LE6AAMCHtlp7ByeXMZazGGDTY6nneiX2ObMx1IrqLCCA4shD5Ci0AAYtQxGkB0IAwC+QMIqVDijU5aAAY1NUYeDMgZaLB1VyyafblRNdC5EHHJXe/de0mRMFAcigLY0IXd+iyDnHAlpmPlC7PBwse0OfrPe+4IYxAADDIYF3lATwfen1CCTgfg5CpNJfxZQHHTPhjRHTMQjNvjLuTqCzpHAYoUWMUgQoHYEFdwHGYI4l4cRAqGhzT+BTLAVyp1AQcWCMRkOCBho1OiaCjQg//7UsTngAwAh02tMGshdBRr8YYNJ5rqakRlL0RtadI/rd5ZJYagCBKVAwqQpzVGQDMg+wG0IHki83KJc30pSio911SzZRBet2lZiEMqM7SnrAIDSYfUOLvaXy9IgOfaGOQu7Vd/MRCLX5Tcd2Il+W4qCw0EGbFAz/xSYirQWItQem+1i1yV0Nj56gtwxTaQJGIUVCxEYhl9TE1fMt0T/sj0FEbU+jI3lOKdsgmnAIqvT01xXJqx1vFn1SqPY8y+4WA1lzWGFaggmqxAADQDh2QK//tSxOcCDjFHT00kTelhEapZl5pQ3HsnG3t+Ip2QdkGMz3uW5Pflvsr6LyojAD13RYlagWFPPABWJ7wtEcOx9IZTOYHQPgKEF57BJhAik+jTwk4Yimaxy6wv09x/L1GG6gSDwSfgrx4TqW59sNTN7uo+VUFXB2dinrvU9B39IZRFg6RSmGk324gxwytYZiTUF3v2ps/U1DsZY8t2XjaAgJpHSCiFGBq5pOmorObnpl33/2VeN+2KSW4dcVOPNplhZ2/BpX4TQo8R/toUbdIN8O3/+1LE4AOSwN9QLWUrwhIy7M2CmuECABTevgv7GEvWsZRsVUCts1bBNnBcszCo0NOdGnUhKnE81dq5IAwSj7PrLdVmQkigPtGU6Hn3BpLkxQsDo1+ISf1WmQjpF0YZRW4qPQn8t+6gAFIpRrSmY8AR8YmodGGznJAM9BQMgvaJYEVyrSxKYpe9aLDPimZmYNY4k61+RyM0YSoDBkwNJXHSWeWdulyZV2m9XW9XPTTP1EbLNh+P+0yjXSoAgSVtqW2yXLtQEtW0sxYJmAxvTcQlFv/7UsSwgApMeWCsMMkBSRBqxYSaEMbCIsJEmrWBx2Yj4zMpEq90kBnSQCbCg9uNS1YbKPXO2KFj0oe0ObNvXrVZaSHkpIQDluTBpD+P2UJM/0EoBTPV3/aWhoOJDS2oQYbgIKGY+RqdJJaYeBI1f+Biq/3jJycGOalgpGC2U+oy+BKohc+iwVQgudWeYaWAyBYGR2QSraUj2vULWniWLJ2U1Nir8lUATUjacinRAErsRhMFZS+ZVTFyFMmewGCLazKIGhMeMz0paOXjunTkOrCh//tSxLwCCjhdVsw8yMFKjupNpI0gmW2aQsQVvDTBmzzZVa3OShCF9QHfbk5RLuisVEg46in3Errv7EARXC7JfYnQc5cSmJ+j16UngLTYWFil2H7sYkD/OFxTqFE06OJY4K9+nlfvFRlYUsxuA5IUiMTaz6kOFzy1KS5u0GX1IZbQAaGdrAvRmzBsw5SFQIJblbl9iUpdTHMpQLowshsA3EsiFw00RnCMwgVJKKqTVeU4aGwlQSR+OTqZlz/yQ0g4cWZOAckKsIlxY9SYCDGOHR7/+1LEx4AKdF1jp6RsYU8P7DT2DVzLkN39P07LFJUFgeMsRsUCAOqrQmFuU/Eih41manA7AZtbsIVPNEm2fy3Ip0iHJSg5xdFzyky6LnQwzts4ZCHKn/kSppKEdvRNNV6dt0VlswJ1tjqnjzxte90YVZ7Dr1LbTrUDIMiRBj7LzSAQdR/UXf8QqBcm9CZAKh3dSeEfCY5oBkHeo9pmY9DgF/85Ec5rxBHDSD6AMGgXDYwPtNvaWYB0vuFpg6bg9cNSfa55T+9LLFuGFxjCB9x0iv/7UsTRgAoAaVLspEtBSgxrtPwY3Aa6x+SjqQQBCCwy0DQPQRAoHKY6xZ9zhQyHYdTSbpKX5mG1ikSicA5hZtlzJAY40ENOKPecR7/lVkrGkOtcWBANgwxZgMMNnvUiRdRTZEoLZlwQDQq9JqsOGkMNOqJDZsaI1/exTgQWMQUCjkSBKY2ML/mqLDra0zDNpjr3ao4sOVIxFJLD8EOyrGs9OhOdsj6uNJpEqR0ihY8aOReTCuhptaPG2E6YlEUPwIAXDoWhGAwQBzLxNIwsA+JC//tSxN4ACmSDX6ekaSFNmqnZkwnYc9Rnh2syGCqsrKxJRpIwaUsSMmYmnSbmpif/uk+6u4q0LFjbRJ1cgaMJLQ8x3FAXgKBwSxojCKPW+6cgkoQRYobA80RhMfXTmOqZGBgYGio0QsQnqeXmweQDOyFjRRqpI4lE3IVXLA+gQuXiaDMkjaAmWaUGiGaTWyanNXI4tsbVAxYPRI8ClxYQ5+D4gUyeU3X/UzTf2dRX06dbv9IANUBQp9fbTSgxa5VyidYGFJ+w8BCIVCM/wkGQSZL/+1LE6IAL4HdS7DBo4XsMqRmNmKiJAlw2l1jzCzE+cbEBACpGC6WRxDo1KIk1ISGadwtUv7iFqir++oSwb9jiLhgcap69iPJMFgI+IBtFBJAuUKCQaAprAuBYqMHiwjmJkU4jla62svy6qchNEn27L5nJPi0OnAuVrk5xiCWapCdniiFS589YfXoWdXaoXWsiEC6H//9dGAgACgkQDCyuSUVKTGxAU9TyU5ZHAE5G6GKagCama5E0oahuu2JWXFTeZ2lqfs07IIH7GP6u7l1PRf/7UsTng5S5c0oMsRbJPI2qBYelCmjymWFDTHEQAIESt1+wI48XP13f//7B5MTSald5VdnDbtDfN2RDwxhhkTjBwWuBk1I6jbSXXZbPQotUniqGeu7WIUeZnwwmHOQcFSKzIswk9W/Io24iJq/08eeFLFtWz/sWZelNSiAhA1lXSfbaS8q2RAo1TGGpRuBNVOiW+SGAJHgo8yP7L0q53LPYWrt1UIPcJnVLaGVWPUhn/iRszwa/5r+x3Yu7Bg2i7WHREiJlGrSVQuMshWdcyeSG//tSxMsACexRUywkyEFBFSlBtg0orFM4or5spUcUsb4+HIXERVNVzAyJwIE4bPGqQNORyleaBSwelxhHrQtUEUVw/dyOQxXMiC/mJzT4zVV73eiq+M7RXRwZlrDf2touua9j1279fff0q5KHpNKUZLIxyjWt3QYWlkoFtuSAlIJFgYeIzUcxUQqCGXqNjp0r4bGFosedDAfycfHTUVClZgtyxeJWg0T8PTtBs7Ej6ExTYn12y7axnPsIzp6FaD/m0KSXMiI9r9hc/n8PLBFACBD/+1LE2QIKEKlKDRhxATuPqqmEiSDwiisD3O2yAStYASTMGOUUlYBpwccoubepuKzxBgAuIkayl+KVTNuEOQLnam60jsKZg5VRUnVZfnXiUsKLiTzdyteE979R/nuf9NQ11lbsPHboO53n+1u3Hd5CbK/2fJ9X+ohc8XLVAABMJtJOALAixQeEJJEUCdrKWWnwCr6Pw6z+QzYyTiUPIaQEfLTMMMqRiNhYGcLVJThA4ZKzKlAkJDPO54wmEAVR3VUIngYzJ9ey1b0qDgfJoWyEhv/7UsTnAAt4xWHnsGkhexPpCY2Y3SSQmF3GWknDAVSZCsrjusjcAKBKJkgBzomGaB49duBVnGXxvJJdiREJdNKGluKV/ePUJxgjYpBFvBtjOMknt1Ggk6nE648DjhAUuE6QAwqs+QdeOQ2ccfYpt614JAsA2qAhX7kfULZMQ1EDgtIe+jcncBCJRy553ffeN5yyipqZ8ZnDDU5dxqa/rnEJyow+zEk+4RaRx5ifKJv1mTcKWfJ7K7tVjiEQxT3IxcXkfINxcoI0SQ/by/dyz45M//tSxOeDC80PSGywasF7DCgJnRjpp7QzdnuWRxiVRFdUWyggGOQBgECorekKHadAuiOeLpEBJSBU2KwTAGbLgmFyeZA6aSCKkdUMTxtQkzPUPPaYgHNBxqJqUiQCCFfD7kKhyLCScFS2GGON+zh9XP6vLzHoZ/devJh5E5c4Eg8cL4CxeIB5alFhPKQiO3/316ykL7CxyjbkJ/hwIA6LSepusWHji+AwCwGPaQcmkhQQAKRu7MX8U+5D9//2x8ndMR/22zvpkZtsQwvuegidOnv/+1LE5oAL0I1LTKRs4WkPLTTHoD4gVhAjMFE6mEzI+9FtvXqWvZfrxG2jOf1wBiqwgABARLksKIL8SNKCAofUmwwJGOxuVkbTxYPT+i5uzK2ZfYhdZofjUXUpsD6zFTOWHFc1/5iApDKo3LMZbzKGssu1ItLYnEprky5UroajNpFNaj0Tlup6Ptpfq3a9et3dXHtbVw8Dg2xRIkwKEFBg2cFUik2sLJhJVtZoeZaL7rGw1/6UAqtCiJAMRCKYTeVo7zDFKNR2BCA6NAoiRPVKof/7UsToAxM1n0pMITXiWS4qBZYZ+eOYXrmzXuj3dSsKle/2Q7MS/MZ19oMmImnXNKnb/6toa2e72rYIjR4qMU/7SCGKM9tFtFWtg67b+appKn+Sx4crAXCUPCBkEAXcsF0DLId2DsGFLXrYYCZzgppP+09ypTPdARMXFn9VALEyT+gQPlDkYgqHqn9SnZNGBvr29taCw/Hj/W0EbNv7rWknVKji9nRo7hFA5QgYD5xjCYlLfPxsOWBnWrJKfqJgv3oz/5kmWYneYYBBo7GFQ6LC//tSxK4AEHC9YawzB8E+k+xo9IkYzCpmWArjadrz2F5Xf9lbVXPU6LXFW+k8pF1KAABCMjTSKbroQSoyvfqYaqg2mxu8BZFdhcAgg/zpijCU9Gk8rOea2/V/Lw1MRAkJXjA81Ba98DpU/h9ZU37Zj7hbigUPOqdF7OutnYtiq3KDRIOqLAbcu9e1kd8Yw0+dOSAm+IUEZ7CRHrFho5YVw9BhughGP2kvnkv7g1avHz3yMNFRpRB6AQiXnjTTRF51mSMiHT6rdSLdbmjcij2LUOf/+1LEogAKDHltp6RooUkP7TT2DOTVbc/7qgAA7HlGFG0tYSKhOogkR7AcAklySeXqDOhuo481DGDzEJIESse6PQMkXQbIyBtl9oMaE82NJFxQusOg0bap6xrtSTnSyl8usJCkXw0LP06QqskgG/6TiRKCGGeLww44dxPAjIf0I4l00smZwZl8+47MhH94eMMhL+YK++tz1/hcp5qlWCB4NJMnxwVJES6S4iHvagU3LtPYlWh9hVLyL/qt1HlMUFIAFvqulR4m7K0ORiie7AKmE//7UsSugAqAX1mspMhBRQ8stPYM3G3H5qAnNi1BWHj7vuiVqaCTCOzLBJYgnV0Lng0a+xhQxbjsnrqfRovVIiDOMAyFJIBuRsUyPTHPNo1HelGgPgSqbVhnIHWQYEBmIOpi6acyTLFR/HgxijcrJcWST8EVq9d9p/lmkDiawSK+EMI9BARwEWurB1Qv2Uj/+EdWdB0KWDt7rcM8Jso3JdVt30UABqSXE22FKQqYSeBg5gCxZc4ggFMZh2JbMUSt1qJSa5LM6wJXXYjBEyn5kcmX//tQxLmACkR5UyywaOFOjywo9hjmTftDhlKfXHHDoxbzCgHwQCYw28hIkghcY5WzGX17qOL/1AAAqKOv+oUjUa57QhzG4GSZHPncNA5hOC7FV/WrMwNh5a2lTJHpCiCBAVD9EjZ85E3UvWK5SzSsUiA3WQSAlG0kRknWqvrNqs6x6zjBpyGWrQAATbHXK5HBGoJSjZ/pfbCCL4TybvL3BUcHhtC0+3Vqk5Se+FN0/l2fBHK3CckLzhRDK7Hln07v/SM6L2Nj7lnXTXm+cy/MO//7UsTEAAnYrVssMGdxP5NoRZ2MennC+eY7pQxMyqjQgKusUfVtX+sRy0GR0J9Uq+G39gWsQXuISkRFt6vt36n5Tr35YsM18DjZLEszXqMrRhYsWLH3d3dxcLPAz6ZxLsU9KwAYUKnHqM4gck2M5No84Jz7BhxOfIKd1k2vAaoA4AAMuwqCjQCTS1iqIkuEiIVJlKWvpD8tZ9Ypm4oAxYiGJKYF8FkS5IWzc9Wkofj5Y6AonB2JIg0KzTN6HR19nvlHRCzFrKs9F0d6lMb/7k7///tSxNKACfx9T0xoZWFDlqww9g0m329/7f7mT96M9kd7Jq/dj0CkymZMABTWDaIrHE3w6Pg2Ko+eTAYiOHJ75YbHuIfAIpQ9mdTgNcYUHaVZSyBCoaLC4SYHWMKHTK1KY2Ejqx4BclaAspF/2WGJL+2/6b9lIbsMsSlXeuoAAFWNkoAgGM/VILELAmcp2qdBFwcGkuk5CfBo4yRnEsBlrCvjgO2GjuYwYhNJVoQhCsEHJWwgiJTpMEgAdRGi9B0kkqNAM5Yra634uhe0UrY3TYH/+1LE4AIKcOtZrDBn4XaVqkmGDXgSIjcjYSAc695ay05nBWlQsrWfIGtjShXpiLyo+JcZHiseZUUPUgxalQ5mC50ONnmXLS2gcyLOOtXpEf5f06YDSBBjBY+D4aHCzBc2kNh3pJIJkVoPL4szQtRtBNL3CgRyRZZP8hTVEAAFNBSCoikpT0MAx0abxmFmCAQmY6I6mooE+1RGo5DQUCENnwLAPQQQ0CRgYs+PsFPSBAwTtwgQOIwTFcUa45CuLjTztxBpo0POVY1tH/9WbWooTP/7UsTlAAzJT1DMsFEBTAosvMYMfALgpafeilt0wgACkK0DJLv5e3dPNyk8MHIEkg5xkfnNiOwpOUxKQaItduXBJPD50QAiVqr1vZ0czZIgqYEx4aGAYZayNZHvFHnmeK9SBqKTrwkFSbBQrAd6HBJQeFLkRmglxRUATDRKUBAdHUTmCDmc5JkkIOkdHmftwu7FnJrQuJXZPXoStRPONc65NKxu+M7VVCFp05pFH5575OtmV+ZOQqDAfeL2uMMPFxyROJhOs0lazVTSvM1KcRqX//tSxOYACxRNV6wwZ2GGF2u1hgzkpcQWRUkAA012SVpFwKYDq1IIuCUm9WOP+bhK3ddiAZc/16JP4dADIBZBIsyciDrRybsRVx3qY1ZdOc0JvrR1VgyzEf8Sxg7zMjVGdN/dzlRGY9um6CKqhs2bSW91DoREwdrc1EdUGQXADo2hPMANTJO8eGHQ4jNsgUNWUr1OGDm/S1xhL2++UByIkBmZuUGyFVTYiSj2ZW6TV6Kimxs7Xn8MbREbUfWwFImWwBgmpwLBIH+Gs8kzUtZajNL/+1LE5oALtHNf5400IWqMa3WGGPCUq40OuQVeoaQQarLG5G02CZlgIYhhUv3gqSskHWZSTY0Cg+CbBoRDirTKq9Pb5oynQZoRgpSNQFxwQnXVxbKqaeIrbrhme8iv83B7hYtf9EnkZpJmupPsy/B2jeSDWD/BL3Y9jVa9AKftvpYdVL5fiQxR5F1VIumiZEwHtpriajDMRgtAsyKOSMNFB72I5fQR37P9Z90vBKZSObF89GVcGOk53Z/CYz5O3KinPMNv95p7uIbe4Eq/j3pvV//7UsToAAugi0jsZMVBg6RqNYMJ7I70Nxu/9XkoARKBVVQoQCyoHMzEQzFFjCCAhGdtIBtFvYyEF0YCYMR4MECCtOasMHOHohjeGQcfQkahhZeZmHGZQseaaBARGWuCZoLlAGst5XMMImlCJ15UtQwJJPALuu3Q9cxClSAA1rbbq4du/dMi2wBlqskGgYg7eWRiUtJ5gaHqCwp+/XgihJ2BimPMZlCHOpjPM7kSznJtoQOORXatOjPnRj+SdG///nniGD6gAfJhHZFnU/eoagLO//tSxOcAC8yHQExowcF5EWw09I1n5lKKI4uQftioRAFf6eqxyLaa6a7blyAHUAhaS0Os+yQi3Gv0duqYDUJSM8mYFOeCHn4wu1OS8lCpTUZkwpHB/uq5VTgpD5OI4DsNQfh/oedxtHWq05BqaagbzHJZ1enGB+bhgo5xXSlhDDEOFYabgaWhxsTCMOHrpA21TGFlhoCQdXuZdWs70MGx3vFco08wvy1Ci33UI9pTDY6IPMTmNMbxCv5EWdzRatUBOSSR0FHYXJqWDWyER9OTDt3/+1LE5oALlIVVLDDIuXaOaKWnjOSg1IprKf7TU2WhmKsmU7lPE2Utr6n1IQJQQPh4uyJEg05IZXLGlrDaQXQi6F4kMI1SqxdADAXBtCLNigkJKqTC8kyessnKJ2tI0m/S0/kDDOTuTPN7bOYQQbEz04J0h7vTAgLPX7XZkiCBhB2QMx92+Zk99hsivpCGjP/ne2//8O7p672QkCAIyk4gTSmRZ9H8XVAPx/ADPHBOzlDC8xOn0rUJVRQrHaZn+exo2PG1Ulh1zqJ48pmpfZn99v/7UsTnAAv481esMEdCgSop1Yeh+Tv1jRAo+uQQnCep4bClRxsQeyyz3zjK5np+vpBQMzUGaUwo1XDkbhztEBSHmM/hikafaSUhgNeadAJaLRpWKc+1JBHiFsRgzjpsamS5/KQLGn8kOha6LRDnW0jzb9U6nDsrMT60n4MyZQ82ylACsUFhQ6FCxHeSaRVAWXcdWexQeMbljFdP2Es3UsiAR1uWoEkJq0nxWIYTRTJguo3MipJCShlMMNM4tWRykKGM2cz9WRhKyl829ZRpY64g//tSxMUAEvGjWGwk0cGoKWuw9gzgszOm3KHGQKHSMA3t1gUWep/wmr7xKbkkCYkyixW5m705lSNgFWZZS2xIlw7BoPy9AzRXbmOZdoSVbZldhttvsL3yCy5GRoasrSOhrVL6sYtSDgQHnTrEUKArt9IuVzU0niJzbUNln1dpZmpAJAU29qZOz66OgAE2HUAdl6CAbuIhjzlNCqcFCAZXdFIEJmUIlE8GGKZaUTuXU33kaiR3BNR//d7ooFCUwLGw0AOoNqrEQwsoDTym2tNkthP/+1LEogAKyKdfh7BHQU0Oq3T0jRgrNlns7YsqEtAXKv6Lkd7SgfS2ZHHNqgAHZbIRRcQ9dYXUk8gMUcZSTwKtmXSuKxOrKq85ZqAIIjFrSi3MNA1gqbdRtVznaUBO59MWUlAq9g3W4sKMO0tTik4i5nQz7ckTYrlCuKPJEBdwAPRUuuViytrbjbTlZQ0dXzM2W12kF2SouagPKCdS11JuenNXqbYUGh8yKECc8+dhMXIha5WJhcPGl3F2gcJbQcIIQ8TOgmQ/jqQiZM9XnRcNiP/7UsSrAApwdWHnjTEhc47pZYShILNya3+goFF9tJ8hSIDkksjjRJZvFm4Gom4MhcKWNxGWyaQ/qSNq2Xs224ilOyGuNI5iu4/7WaWAPBYpT8cRCFmtVjpelFg5u3oS5iJhLFJjHx+7H9SumeF9vdOgJGYBRU0HEgM0DHFqIFS3FCDhJg+WtPemjltlAQk/EosPu6SB/wYd6tU/3b7vPCl9BFr2NuO7tvEpYkWDb9k9UOXC1FtzkPRsXbdXiVtz3bRW1nSqQADf8tlrIJpwqsIy//tSxLCCCyx1TUwM7wFaDqp1ga4gMk4YDYKElri+Vza5Pm1G0uu539iFH0tZN5DTP8ZqYmn07LADajndCpR40YCO5/o5cf/pOd2pX+7enijvYiYZzQADXVSC6ShIJGkhgjHT1Ak5vJJxERjJpHI12zRs5bOMqLuZmZ6rn477X4jtVkCTNPeTDaHjz0mNLozKQH0P8olHeEBMGaxGMZLAAXkRcKz9JdY4SXx4HHHWlusnAIAjNTkjBAhpnQPUBpoYk0iNABn0hFlAtq9nfOwgmTz/+1LEtoAKDJ9np6UF8U8SqJmULbBQaeT1FQocmsDnGJRmRaaFgYAVXa07XYQc4xaVzHGU77P/q6bKdGyi695Q4hqq9KUKTXtmzLAp2qIsSEtlIAoSgu5xGyZwc2OeEiC4K0xpJhoaKPuPMuW5cXuhCAWPcpiyjZmvloQBEUh2JaYJDEAADkQk3owsOH/qxSq8LJDYX9E3zDT9cbr///0fQ0UdGacP5Owvhoh1C7MMI7hN0IgIhSyMy8g6RYbCqZSYmo+csa+JAM+kv9SbSyJE8v/7UsTCAAmEgVenjTEhbxCppYShGDHWRRX5SRDxyGYUEvBNfq+MB3tCXQq/92v3xx39O4zpvD1NPq/X8vixFYfFG3x7j+0GCpWHoWpj0PasaRcuqLhJ7TJahRxH7syiYQdHJVdXbOs5QvTpGX/97szluY1HDUrnCgSiGwbBxI02nPMoU0soquLdUOJMMB9jv9H/9l1fo1KVj6k1zbjJILgu5LTRCQAWGFKBgFPQySfYuPLu6WILQmFNKWpDTIZCR4KiJAsBhglcw6BjbCSxmLrI//tSxMwCCiCHUaeMzwGIEat0/DIInolDOFXKWMq2ln/ZR/ViyxWl6nsPafrQpbllzaRSTqVNMsJrBcna8Ngn47Vx4J56mOrRw444/ARyOXGKiEIKpT3N+DEDove/rCueSXAx9RpMR6FzwCpv3+qaQoSvf1fqWPQwfZblqUoACxpkAsNgEkC1AkQ34BUDHMiq58RGAshcUhuF1HVKHn1sZKTdvyqUt65V8TqEHb3vxS6V0NFoBQOQsfQ5wAqS7VVVSx1DZKoSuSHwsIWgVosRvYv/+1LE0IALOHlUB5kyyUYcrDDDDUhjB9gxiwAAVIEygrrnSsYAAYL+dJaZRZIKnJAlHAxFfD/540QgtRkxuTOh43d6uHhK7ri+JrLKBp5FmgQHIcInalFm0mEBWYQE2GBjyrCpHCrSQ5bjSGMlRvPPrvYpQ9GtwwKPFn/TAAAdsbaZABiiqgSXQqNM1mbYXMBVwkKXjQmNlp1twtMR8svsw4/ZZzqj5qqalutn6/UoJg/hxhfUXOnTY3BtZJSaSCzr3O8ksSLNuZXpZu4j3irY1f/7UsTYgAoIRWGnsGVBQZKrtPYIsJ3pJEUEXXaf1AAAqNyJFIhhYR/Q4wQBy3skQ9FOSsDhlAJCdQcJGVUYUg/zjSplNVXJYruhlj3diLNUiCATufV60PscqHZTSry0dEd89O+yJdURlsv7NtVV+n/ZrqrKjjWXPFkBCAi4BWjFlB5QC2GghE8OMFQ1GdjSP78iwNrj4gxlxtw+LCtiiinKNag8fur5Z7mtcYzVN4TAeLJfTTg5noR68b9vBcOOeEAb82Z3Jvq0v1zdnadzvdv5//tSxOYACyCVTyelCQGHj+lxhiEQCz5/8O8+rEglsBqs0BMCBzSRXkUyUdD34sQp1g0aDwmA3ugxqkJpOMI8sYrG3Sj8UmEcw7mLqtp+VQChHEalTq6zcy6q3rqLuY+DRMPmJ4FXtEJZ6VyJtjTpqsil2tAvWXFaFpKKAI8tJpouBfqM4lkc8nih6MBHTJnwPEZNL4w9kkjOEnIK0z67jrZLKqXnZtPjtvc7Zh0UvlJEEx7uoZ8zBSVEoZe4tb1JepfpMvucyU5W1WkRh9LWo3D/+1LE5oALvJdRrDEH4Wun6fWElTSOwuwVXTAKyGIpXJHG2mwOwnB9ErFjVNy0KMvDOy6WUEsnGnYWX6+akNy/SO6NrU03//c+olsxbNdQ4Gl1oVrtmKJ+TjG0On05d2duUrmi9SZVv0yAysejlRPv/mmmv9I+Mx//69UAAJ2S2SNKTKFmQ0UGF+jo+OgILhmSKnGpWXrUUARCGj5O3LI+/Epppx02Xzz7rrkFqWcn4gpgoI4lZxGiBBgbDZOwSddHtd7cDrjaNudNpRFbajl27f/7UsToAgvoeT7MsQsJeJXnyaYhWHb8kGZYQAZAhCSTv6EOd9XkdXV/+9399ec/T3QhAAQcPxACAPvZKCAEHSiMCYnD9YPptKViQdNjQDkp00o5BRYW4MZDG4l8XRLioBVAWG3KZQeTT2MGQ9FrWMRlNPLqaUQK3NOeCoFUXBwwAYvKcxpWJ3tylLppVj9eb3zjB3ePCl+5KLjcjoUs7nqpQtEu1ISccgm5gL5MA7RiJ1cHOXwqTqLwnG1INr6JS7O/hQXO7ykAJBgBG2JvNjNJ//tSxOcAC6j9S0wsT6F3j+v08y4nmw+ponMlhpIMBMMPdbR3/6kAsRACAU6DBiI9g3SBZaly975QI/F4nCuRHSfBdGIUGuhFlDuws8+rTlPk0cmzkqyfb/DkaZFMBh000UFJy/KSlO/ZsJnib+fd12wDrnct/4etJ6qSr1eat2voBjkbjblBwaQpy31i+1WNJqHFTIJVJKtG0pbW1OmnKN3cBpLW6ObLIWp8ilQjOjOyTp3NIm29j2rvVNAgg+pmKjgxym4LIFRluJeVD7lOUcP/+1LE5wARATVZrKRW4msa6sm8PXRKrbiMCl1mDaoOTXbW2SNpOAVzhI8vq0XEmy2KyP6lSgpHjpbR55o7afhsouDJWp6fmflKjuZxgQ2ph14ymdKVyERROGSJzjHMKkRc7oaly3uWuIJJs77oUAbx4Y/+sDBHaXh6tvrZdOXSKbewxYeAGwSCJXhkcTDezJydyaKZia6COv8S1m+H/P76vb121qAbIMUYqBBWwaYBcNmt5ZdRsxRl43Fel4WItf1lGKV7VowG8VgbToW+mioAAP/7UsSzgAtUjVtNpGnJYhitcYYI7uxl7+yxk/IChYMEr1SHEUsRTcSOJkwAsWDJWXOoZ8w/X367n3EzubyT5Dt9x7kHNQaEgFnxd0SElit4HdFAZApZTQOdeeGvuG3lmx+T39+WaVDj3KEu/r0AgBKInZpXNP8VN2srFc8Rgruy0E+qdQKoDhPzuLvYYUXm9GLHGAYFbxfAgsNMeWxr8ftXt05rYkVEj2OcdJDzDSphztGrctVBwNnilulv/6AneVW5zrRtABO+hYbzhKhpLRfL//tSxLeACrB9e6exBvFrD+z9hKy82dWGQudFBViA0UaCzhMJEELOsPyVS3KoXR62cx0sZb8YBUUCc42hd7GqsKvgyQDwoIhD3oLGaF7TL2kS24k/qOzhKJR32FWsHizXR4AAdjgCkkrdP7lKBCVw6BrjhBymch3jAGQob3nAIdJGDocWaaQi3iL+pe2m+zivv72aIGKBkMtxZ6igNWEGhs7CYuRDSYWask8FVIcLE52lJdPb6mscZ5UUWCDzV9ICElWHZVk1lbgIJdClBhTNCjH/+1LEvQALTHdXjbzAwV0OqrG2GPjhEa25IMStVkEcbzdGFQkaAmI2mpSFvPy1XfjefplACvKpm3Km7Co54jHguRHobh6vb3t7OJWKBYSZ4ljiVCwAHNJEUzG0wa2S+rNmrwCFy7KWDJmP+8btv3apK1K/ylGgRPlJ7ONW/Myriq9vhhhd/apwKy9/zUdne6zi80JodsQPaHRyWkktIl/9qjouiWMXugIrrginNba5JI2wNhrOEXGxcTLIYaNl9iJ/EaaoelF3HxKHzKKiLLrbr//7UsTCAAsEgV2tJOehdw7qdaSs4MmQN3InHpf1PCWAGLwxlhe5psQhhChGYLkyLiyTSgsxLS6gDPXbw56/+sABqQEG5aDm3bQIhGSmGCsiPzS3YjMPyuP0VJ8epQY6AgxiA741p8bJSpa/FvP75yUjn6FGRcWY4PUG98cBxkxgQP3lEG5gXkHly3NrpCW/tbUuR7bbW2yyQDKgihOyFQ6B0UcIgTF00J3KVaRdDHWyG/trQN43btpl+ic36Tdzf2ZtepUCdtfiFrHkN0CieKXU//tSxMUAChh3c+eNMPFYFCp1oynkkiJHKvcKjAYr4eYkvuvWmyqzSTGgAAXDUXLMIhsWOQggAJrRsF5QCi+HpahIWwWGXKorVpgzCARbTsmq+CBhKwdQV0CE1H+q0KDnTyFK2lN3QtJHQttiFId8Vwljrj0j2P1xXLEqo1Iv1Du8iRX+2yBEtmsbFf/7P38eJu9a5+r0+/jX9NQ4/1vcTOs+u7fP3//////TG/8v7vKfH/xBmyCv+CBR3nRKPKoOsLwWorzkVJYo5xPBblUzyq3/+1LEz4AKKHlpp5lQ8USOqWmRveh0ymECwGkhU0aRiYjEypGLOtFLY3lZcYw+bnjfrJ2TbW1Hx2fvK2e6xDkPlqqy/jzxKo8P/wBG0IW278On+p/t6t7v9gAoRZEpABAqnNkpkNQLYShRU4QrnW0KOHCItmGNSp+ZFuUOKh2H/57j0RwhuWyu/mc8vyfXdArEgCKoIzUjRESZSjEutvBkMt3uRv/nmWZRDL/z4flkVIy9z94tU6nz/75vTd8qGorn6QohBy61OiA43W9HGwTeMv/7UsTcAAqMe3W0xgAyVSdqtzDwAIGQMEIUUiLvSsaRY9V0slaqsuZluhQpPd8rTWKlROUt2sKW8KNkQCmHStSwSNnSxaOcI0u6iWGcppdSate6V0OYmriKyhgAAkiwqm4mUCYZBaiBceimOA5jyWldlhusscGakjJOolRqtEVMfCtDrzf/61ysAKrDcbD49fVmqTsZO7qXXUqr/+/plbLT///9KP/+YsIXd7l0UzAyZmqXbbONJY9GdZdFpM5lqhLLFWV7w4zyZ66rAmCL1WNr//tSxMUACsibVBz0gAmlMuv09IyZS2l5lNau3ncEBQ7z/9rvJLuUO9kpf3X39H+vfvu6V///XmX///OwMa3e9mpIAByrb6VZDDFgBehDidkCN0uhYpVCjF1O4B9DKTWfdl407eKbWfJ28a8dP7s5wK2RT0WrbW6tbOvW/sbzjm0fvOdmzN2bsjIlFfq3t/Jrt//+xhUYAFdaUBAWyXeWaOpFpMWfkaYC6QySjFPcKyVJdnYZvbSh57U24abRFsl0/RBeGY/etN6t83VO7bfrou3/+1LEwwAKfJNhh6RFgUwr67zECfBH271Vd0X20t0//0MMPf/b/nkJpQjQ8OfpAATttktklYCIKg4j8LAd6SP85sKfq51O5wdVvLL4ryq1urTUu0vKTZLWpvTVQKwmB86g7UNXsr9mMdjPRsr6S6J+qr7qz3/X9///uf///ylEYlVACTZ22VWWAKJDRLNJcXT8iifwU7ZOTK7TwGpmNiC8+nLNjZp8MCucrdtVQ86DQkKW/eqpypIY6PfMZnQ3Wn+q7SmT+jK3///xSn///OOHf//7UsTNgAn1Y2fnjFGhUSvqcPMpqfUAACo8IhOlSQgMba+PKVhHnqPRtgjSIMItx4OH41YIYXVjqxzN/J+/Q/Htk9Y3P6c/6LD6FeUXUu99daSFCk6SlIugju67IIKXRurobPU63o7fq///+on++3/+sniMnf/0gcIzCgQG7VY429gATBauIg8JDoBkfGWZ0dM3sNYjmZlOLivdc+y73///8V0QzmPbUztzsr89tjByFe/jAH3pTj+YNlwsgML6NgwUMKSentW1DhafsbfO/X7s//tSxNmACoFjTSwlR8FIrGs09ophK7avt///1Q4Jf9KX/4MMf/reoAHu5pqlFEAncrySpESra3D/HrNxdOTG3uE8jGEru7zQj04Oe1cqiJf/6X6aIS/3/HrfMs1PLVVsbNU7WbhZHCWmgJ+r/7v/AUs+r8O/+3nr6kgrlBRKtlU5qklSBxpNIF0WQvDZAFYUXV3D8GNcUwQDvfDKPYG15+kdMDgQBEUJxLNzgRx3LhMcmk3owyv+jgfEA2J4WGDfIK1wix+bv6frQ/lXfT/hNw//+1LE5AAKJWNZp5itAZEsKn2GNTgs9f+jESbQSAY/rKk4VRJxoGiTZLQqQTKCjIjjsGQHAI3DECDHjDJNsEULPVQRcmOyCRlLS1EiL4xdPNQtgoyCYACIoQEpc+iwSLbK2iuHF33f8eCuMUMGxcNFPQN6tOEZzBVDKj6ATiamooZTM23P20FYP61WtbDIaeavZ/RVdAAAAEuWhcHwnickoXZwoaYKqNMKIg5bVIvt7GdQVLsmQXmTRPIMi1JYnVBESyTdJtXyUxBINiIEhIAkFP/7UsTnAA0RX1+lsFrBQxgrdPGZ6A4NI57nRUSiOMSJSfV1VE3qJeb+rywLR6YVqXJHYivFkLusGVYuMts3MvyzNnLckTijzEEBIq9FYME3DQQ+9IROlKcsmEYpjmsw4VL0lz0u+K1pRBYKfmGxRONU2AxOP6fqgc2rs//J+pUAJqXdybQbrlsVUFCT/LOrgjLnnnBg+oJLLcl5DWmW7ZVPSxqlI8oZeaSVEMP26cKc+bn6FKBgBCAM3BmEUfSuUrKbwQ/yxPiPm8+CB4RWIAfH//tSxOgAC9BpXUfhiMHeluqVrLFwrPAQokYGgccaQgMaKa3CMVpiDF+Lng0j8Ph0WRzNCwhHThuUk8RkWiQGIAwnWle1lE2XmS5CzF9mr1ofNCoZHZH+7wXZxKCp0NFXC0O1QmOa0KESssAqcRHiO9Yq9NB57v//9iopwWxkl6hYmCsGpKWjUEw+j9Z4SjInNL3SudQcuHOkHPSqJWXISFSwUyk/y/zgHA6dZKx55EJQM+KrWTQqoeWdS5oieeiI8oNFq6jwBBICBOGDolWCt5n/+1LE2oEKXF1nR7EwEU2P6oWHmhg8xYYKB7/WqAEwS6VtKtK0aK9LzMqbRwy7rsHRcOhdtg8K1VUzsGldHJK2DFjHICix2qFKZ+RBhgiH/nrpwzOGvElq+f1DyBJZ8L3bGigbaIvVZQwRxSlhcxs11i9rnfZVhSCvmyl0TbwtppFarrHO/MYzrr7WXxwaFe8QKRQSHvVN07zbiJ7U203a34iYlvw9g3gMD47lGz1M+7GtWXrfdx9jejVtLdWtzIeZ60y2y+uVND7Vfo621oXvqv/7UsTlA4zlAV5HsGtBPBVrQMMJ2KJzGX6zeFOmAAMUpNJOVbCSjLIClrosPowuOBnDYIYXxdVGcIrRqNrquli5zURCx5J1uvfXUVAiJNXRlTtMv9lY86lVYqCEaAUUOrbabKUQ495EBHRa8eca5A17iteeP1nUnET56tWKO725G0nhCBAPnz8LCaNghdLpZH1tYwWnGDtw3RuO8as0hDjYuoPRe40qZ0Wu1FAQiL4+4VCsj13LGbeDOpklR1nVP70Xy1Vt6kLdP//2+96k//aK//tSxOeAC9B1X4YM8SFil+plhI0geTe7bI0wvSrWBAABpHUUBwasqVnQyEwRspmqMHY1J0IqEMxUB4gAwFA0BsIndHILUWTOQ1aGv9XKFnnerUHQIOXKbaofq5iIdrWbZ9UMfVP3Y12PPk3DiXsLANdpiBX5SvY+phOj0gAPQBcablcxfaNbqL8UXnmTlUdID+hYdA4kErSiEgZR5lNxSqOa0YffX+rxy8cXQwIiACDQXCHYXSCTDx9YsWrviQDNHUZR5NwHFWU4HHGh5UUPCZD/+1LE6YAMYYtfp6xPqXkW6imGHSBxv1sf/YLG0AoBZCJVEhGXaORhH0IcchJoFtFNUIwOB9CHIgxx8NtRQS1Nda4IDrLOYo/W0M+ln2RBxZcXaQi2VLijBdgaYSQq/a1VtDMXALzaPGix48mRUJ2sqXQ9H8VS4nTtAgDMlo8mTwZ2cGadXGFspoQ4LRxggeA2NyAySCBhalY31mmgSo48698MSPKbcTuteONRVSu0RAggesIRECUvDA165C80B40PLek25wjQXsR6vbAAY/79Df/7UsTmgAu9g1tGIFMheBwo2ZSdcCYoGA7n8+l7vAgeqQAtLjKUekvmKAIKMQIAstXSkKnRSthoIs81HgSQNATQv4zSkXH2xvt2BlgaMzr3d9BD3sapUed49cs5T0s1Ed5cqxJx1n/pt/zhK36aBQEiNmBsIddHAwMEMGuhYCqzDw/VG3CJuUCRCFUQZAywhCuayktturLX3vmgFUz/lXP9HgNWeU6ipThlq2RzyLNAVSCAkJmNbb2Nm2iFJYsQfUpUsQFQwAklVxG6i1qwO4i6//tSxOaCC4h1UUwlCQFzDqlZhI1o18XNkC1qgBUZXlmi27WO8LWC0TEdq7uu2uoEQRCpMEcCgDgQ0kgaLSkyyOWd1ORCRiX/pz0YELZ5i5GFzm7u5Di4JrJi5h7J9japsosOJ7xRNBfiyhxYWJvaiqcND9e7GMo+ugWK99fLo426cE8NOFdwIbiIyGAIFSxdJyEtHElHywDhAof5EuUdEmSWwyD+/hPnKfs/wn0lo4om/++ppeIYZFsYHSoL2tawBsLAJw1BAMhgKGJ1RQu97tT/+1LE6AIMeIVQzeBngTMOqpmzCajyl3Xubd2tpTpAQTncSkKIBgrXmAAI8i5Ggj0gSVGuoyFLTx8qWWjAgHaKTPn8fapvxCN5O7XP7O2Nk/lkw+F1TQDZOB8igoUDsgpo8moylh9SdZcWAFM481XN9+Kr3wg9pOt/+HDlABpglIAlU4L4DhNUa84m3VpAcHqOT5FYfNkKPENkrvam6dVBrt/Ft3t9+kc2rmA3BwfRymg1qLFDVRXG2LcLET0TUbU0q0P+/pvmovSAmNcIRIEg7P/7UsTtgA0or0rOJGuBdRRsvaSI7JFSLFi9wUAn3zfkckuOWbRZcpsADnF4fFt4qaOB2XEpbMudTE1Cjoxs6vIVmUSHFqLM3pKtBEoYQymeqLZO5FQ5LjzFetZMp2Q6t8yFZ0Rd6l1I44YKV3P48aQMIARZtdZHSYcVd3UKBFRFaGZ7trZLTVuMw42Aom08Eb1IqZUrBjKZWpLEBzmW14bRiMqfLA7R+Zft2dV0d6qOJqdfYznTY/rJKEDh0GzIESfEoNijiztc6KKuF1SXmeJU//tSxOgADCivX60xA2F1jut1t5g0jwyPSyVXItA3NXiWaL/tt9wGFQKscWJqulihC5rRWQmReFhkfDaEsIcQNRzRQRxRMrJrP4zCs7ndjwQLL+WerZdj8Q0c/r0yZ+8Nc//P1WzM5bOIJMGbVl1lrBYX3Erd2whpqgIAKc8P48PW8CwyRXMNQvIgSrtfyY7daeGZXLbMKwmZW6IAIEnTxKNSBSjtpJt22l8/rfbM8FkjrUjyFCCgcD6llxGHFrHX18vrSGTIo9yXpUsOae7bRLn/+1LE5oALTH1RTaUIwYgfq/WmFHx6ev1F9NyAAA7pLdq25MPnZ0nzDIGj3xaxTkWWJEKGjuDm+Eilzt1PiOm/yqI3CQKKOjTKA1w0jIo3LfGuTKV19YooR3JeVGQEsJAWssgVBkJMDTGNihEFQEBRcAlhc6JSMJG1kZUAAgApVI6yZDQ2YsmCjNkXBIAzBgEpkE6kaIONDJOoPFXHzRpRVmPg3S+uZ2ZhI62xqsk9k1KAGupZzmJMi89Oyr9K3ZPHLBr11vo+/+mv4fenZTckuv/7UMTmAAtwo3vnmG+xcR/sfZYNHCZACuhWhXBQax2PI5CRJOvFUoY+Ig2Dt0QnBIiRkshRSKhpTdxcDqr67S3mKp7fnjhCA/7j5f7sa5Q9z7i0qu9Ej0icsfoYOcUo8XPaT1uJRD4jLP3FEmYgz6npIpz6cRzw4MpqqOalxDB8A5wkPPBuJ/quzIPKMV+BSy5kdLxdJfUl2PQAAB9dcCGm21mkLapBlyfx3lAtOSV6kQqMxs6SOBPoWtx16VnUx9t5feFe/cwJANAQA4oWdq//+1LE54AL0HVCrmDDgX4Ka/WHmCROT33+u2+5lfpSlN29317d19vym/LBg4XCiFo/a+75JTRJ9N6X/blPpZc3mRGrqiE+T3p/68OBpZ/396jizB8pFx1Y47fuQBkACrACj7AK/IAJXKkcadruU8kFR6XYtzYriWAR0Q8yfF4R0vpLFUqAOVhMV1hskscnvUtNehZvtqZfWHJlx5l514+aRqS4qKRRPWdavPVo93wuHg2FRou0zFdKy6p9rlot21C6lFCXT1vZ7WoAOBAAAII8T//7UsTmgArow0ktJOtCHbHqZZShVYWg+QhwFhAGtcNcJcw6HhaPUfmX0ae2OwzolQqnBwrOZtxdv+s2hyZIOQdK40JBwNsAj0wE4DXG3oatKrCBC/tZW8eqtt+H0srmGzC9WgAEQQRN0Q8gYI3jQBlJdV4XmstmVfKN4RvU5FqJVoAASVnpRXOHJh/KE1O69MEVF1pPnT+AuuecvZtTPk4kDONGwBeJJlYxyOmaXoqyLe8sxSCdUEuPJVQGKY54nXatK8qTqOtdFmpSuLB49BgC//tSxNUADxVlaaewb+G0F2tlgzHQa/QgCIFA6sjv6LWUDJD2Tikykf9jZU9XaEAB4xwMbESywZ1kry9iLPY67/5ADgyInE0R5+sq8cRewXGqi7tVBAIJ0apYBmeQUiXAYWWZROc4tMj2MUjmhkpCQBqU4PbhNGOIJ/GbiuR5GcUsl/tCAyZYgVDZeUFjrRSWMD0m1DP0Y248oy1DNPdTq14i3NXbns/fctUAAM9MpIslOMwf9X70JUGkjLH3qo8qvi8UgNF49ju0rbs/ArmRTyP/+1LEwAAKyIVZJ7BpAVqYqzGBifgpaSATpy1+6wTAzqeNSlATWkUHAshIasYx4rG+xhgIokYw2HGQSoMZdbs3lqSo4c9DAQAj23FI2nO8cfl7OhhC63yfOUJkQfGLGDWo86MPKCAjMZOdtGsdn5JTMrGPzvYFAMK1baKsDKSOJyKhT8so0tnOCyrvdc32ItIa5gHQAioHTamIsUoAIxdNotogOx9O9vMR0yEkQ8lSOFqC2Z5oI7XRVobVcxY8Fgl75oQl7p4M2uuy0/PaIxCyc//7UsTHgArMd23nsGchU46qsYYNGAhU+tIFHGQO1g1kknI6n3USvS/wVUge5c6TG33Fb6FKKaiAQ1ElVKCHIdZiNRbhKI8xMmaiSYM2yBHkpES/bpapFsXsQMLq7BhQa/m1nvIECoFm3mX1kwKaD8RFrXGZ2KGiLvaLC5CpFC055TT7SDx3qgEgoLChSIbXi8ohrmiVI6IaqkMMOYtAdNKWBkAqHg2OuQmSqJdmKBnJ06lo5ydrJil7v4UbbjwmUInRKYvk1oLscxUG6kDEws8H//tSxM+ACwh3VawwSsFUj6s1gZnoDRoNNZLh+gz+9MzN/uABDdcbjrbbrgq3RFOchqselalYW8DD6oUAsXpQ0mjy0MIbKds61Fw6Qu57v+zHEQMJqUPFDsVOoPm5gpIAAjcWxlhKR3Jb0+irprT5eU8hKSe6qgAAIxY40mnMo4WhLZqUBQwJKQActVyA9QepDb7rKUzLkOnje07al0Ew9B4IAgkxiZEgicxhl21GQYsFdSmTtWdof+ef/n5etyqHpKR3l40//z/p/zYljkX+d4b/+1LE1oAK2HlXrDxloUAO6/DxGiZ+VOV0lihDSeQrsM2pusyASYh3GWONB3MKbwKIUwzokCxsTiiADAz1jettc9OxJuq9XWB+hb15Wn6kVtFJ8T1wF7ESDNcV1B0kqSCWtTSOqEn6M5ZW7aOTOjUca9iIQZ3JqVclOOIo8b+qrRYz8cSkwaGwpJJcg8mA6iAgZHu2Y7Cs+rYWtTShgvrefi3JHQfOvLnQiC97fbeTYHWfiZp5lm9u5SuByu7m86+8JzKdQuhlngQ40EJ9wPijlv/7UsThAArwd0bNJW0BTA7rNYSVLFHE1DyF2gH2NZYU//f0z4ICe9F8YYB9N/jgAACEam1VAuAlyWag0eOxD0WnVWMzsVFljQbJHXdFhzW2jvO+zcpVE3UpncUjC9TK8CclOGZMGCJGZoOnCYUsopR5KmESIViksWNsatT3Ls1iquSOIlY5exVZ6Xs7EN9kMiGdnSqje/+qk2uxhEiPu0iqYImCURDo8YaYzCNzKQegio4iKqv5tyE1AGhltQ6lA9QqZPpUZoiO8ynAFIPxfijg//tSxOmAD+mTWawYcqlUDux1h5y0Q6mZSEh0qaMC2FmgmfiyMSN5gZ28abEX85UIgw4NFnnR7XsTeL7TLl59j3qYl/9P90k1Mf7Et1IQKYsqTG32tb7GXRNM65BGw4Al4XF41fhENgO/1rSCyXjLTgUNXxjDtoCFtO2j11O7kFGD8gHwRHlWEy1ph9L2paQn1qHhRL2dmqIP10dvSTFzb9aJMmjSAoEJIDehUi7B0Wafcw9SHH7RlUJtMgG8JVDYor5CUHfP2jbbqWJzsCnfZ///+1LE3QALcHljrIzUoiesamW0lqD/OS8RDUnuOpmnd093NC054eKj2sJmZw8PMPpXcMLnlA0setEq9yTjazBtBMXELXs+7jSQ2IXnrE2kpHX2eeVKKGRbsQLHGGhfVWtJ2j52UoQC0ttdx+98PbvZYEvZjpkuLPNC5c25g5rB/2BgOBg98un+yv/PkjTnaaNkrQAIKnHshDsAly6nTHCB4zz3yJ35IVAq/0axiSrw5fp/CJkYn93i6h/2dpXCyc5P0dWQOKMLGmBpPcYtYLzAqf/7UsTIAAn0e1JNJG6BYQ8tfPYUvCMktAoEVvr0//qEtTpemR1xzdLJQbY1xGCKMoztL40Q62KVxRwHCKcw6984+cVc6Uu8nZbX92dYA4Rub7Et74x3nYDJtY9KotRAxoqqmJUNnSQCQOhE2kVCT8u07Z//8NMWFol0fdut7EoAADSDceBCIDiSS50ZSuJfj3sBBAwUEUF8VL0BopnORlptxs/lMe+suMPygvyW0WtxdhIuut5QPJWpBcGhYFyIeYw2Zjs2mnnLt3Hs1F5T3192//tSxNIAC9i3UK08awEni2x1hhkgkoBDv62SFFPKNtNfhmI4k/aNWqEpcEMtENLkORJCyyJhHuwjoo3HOGw/MS7IzD3swEzqaKm/7hNZLc49r1CPPPWAckHXKShpFYYg4o6MRlH3PvvsZNjmJGLfH2xYQjgMVEj3spEbmaVUVQLyuty0UtqdiQyJmhzLWFft2QQhWw8R7+t948q/Zp6yigJpj8EFCeRniZPOiY76PbXOSc5P6VzUdympzyh22RaQJP3oQDDErXYGO5JxlUgNJFL/+1LE24AKzHtXjTxLAUkPLL2EldQqmpjLkVAngbgcQmNDb0AgAQCNvwYm+zc2AKiJiOdV+YJTUpcpziiy7H3cLOQZfpRtNOaH93pI+4vrrxouYJyi2H9xNjlhI9WavRm/IgNq5HfUh7MVC2ZWbf1Af5vjvefRwoC8nQ0QCoBVpQAIaDSblwKgBnjDGbgx0e52pCQTijhKHVa+dl2phptRRGqaMW7lBibuo1mWUAGqh3Zm3ldYkE7qrG1NUKPMpaUJImwdLF3K8ctXWWqVHPa95v/7UsTlAApQc00NvKsBoo7rdYegvEqk/rQCAzbauulv7zpTs6MigQIjtB6cjEHLUPn5S1+hgCBsFhxpfgWLIrqcpTb5Tpcbo52dO2cbRrKxsWpRgzeWTTOxYQw/Lik/Ztr9L4sbJ9xaU0dbP/U6ZM6875n/wvTNzLv//059hwYDFmbxWUOexgAc0Sh2FiB2H63/T1oARqERebG+mGWRr4ibIsm0BJi+y43bVVBC4aMQV0ypyWGT8Wf2w5NHGdymYnLd2U1QnFaxFKqdCFGTMshl//tSxOUCCvSfTM3hRUGTn6nxpAptEJ2vj6IFwcMgTHIHcrYNBDOJPz7q+4Luu/rp3SZe/m+T5fiu9Bo95rOGDjyBAuKjxwgA2lK5V6ez/7EcjgBUMdTMUMFFBnwqLcLQwbaKMnnH9dmzCblLf1KGM41cY9pDUqSXTvq6qXqcPLhqRQzPPz+0lq6Dzk2UhPDuJMWNiBSW3WClH8CVACJ7vtTRABZK4XGGiThSQgACzgWNHGmBWXgTsyaSRAI9jGc1Qn0//yBmMSFPn0+m9HQXUuT/+1LE5IAKkHNRTSSugeyrLDWGDfwggSD6na6zZwcTZSpxEa396a4yqmqJ1GPOaK385h84XABATVtiJTbgEhGbCGQadCSas6Xi3Hh6UcM6TYxNiGqoGrVWtaeqQeHmnGuBk6ye6A3iVlT6lZ21xakqt1aewrc7qrJctoEx76lPknKeLp0qAACbdrrrbaxhYReswotNFA5MYF1oouSlo4o0niTRbDZoDE0HhSPdkNNClczo39ahUJOYFzeLXmdPc5VCDh+LD3Ip761uWpHtbfq97f/7UsTagw7481RN4QXBLpnqwc0MOHrLIky7mx4RTkt9ttkbdAk0WMkxiGKEH0U4ZxhOhEF5DZH8i6ihT4TN8dLmggIHdFwMdCXP3c/p4UQOEhwtjAkIBUGw2DCGoLQOsbQzPriy2Mn3teQ1/Zt66gpCglKXKeLuq0UAApN6yRtpKB2F6MLbYJRkCouCWRSgHJubvnCHYt7FKZMdBt4JNkvfVkursZBRxwANih0HQGG7hWZDRMNrYHiIoLRpNhMid76CzQ9QcPCc2qhyHXi7Dyu///tSxNaACpiFaawkZWE+iKz1rCQYUZUxan789KgBKOPWW2NuAWchAyKsx6idqCGFV2SsnMgXUBKHcJLWSQQUH05N7p35vhKMtS1oAKQ2M9lCCQAUCoVn0ZoRiOZWpavIzP0Nerps+Y3K7SuTd7S3S/z9LHRrYOvL0JuBIaoAAIQt1yJosH6djQQ3DILgzFJEMwQDGlIyHdgcjxgXqEy8QMJcZz/OWN4b7FAWD72JpmIyuXNNKxQoGLElb9Gc4mcO+3fIrj8aHl3LLpKDQOXeKLj/+1LE4gAKXHVnrTBFYXMOrzT2DO61Kj9Z9n0y9oIKLafaVO438AFVwcKZwZIOn8sM/6xK49Kh4GbVDwffWckfSzha+zsdlVp3iU6itJk3djqDkQLiV58iOHFWk49SWIExwX/w+l7WNfYLmSsnBV+h40CFy5gTFReAlQilbb7t7LJKOU6zIEcEbbTJPJHRj8OQTo8z5HoD9iOLblyzb5V4LDuzumMuErjiTY9SEzYi6aEvfPD5c/nRJQ++hSdhQ+6z5pVZmtBgElKouEIw7ln/7f/7UsToAAv0YW2sMQPxfyauNYSJdzI8UtICMdv1tsjbplDEKM6T2aSHmIdszQ2npZNDy2qqihg5VJzgpj863dWohYx6Myu7EaXVZqgY6T0OeREV+s+UiRc7XjzZYVWTfcUEb6QtW1LLuoyV8hcEGxSSCADYQvRAb2n5+H0AACU4iCRAYInsFhmZeaYKnEARlw4EIAOFQsaMHG8UoJI/AcTBMjML/XB0JGDv+2mRbXrtLYo09AAHCCpRRUmB41M4lvG3Z9CF7D/R6tmff9GXpUAy//tSxOYCC6y3V60wSaFuDqv1pg00onIhA+OqGaErQBockmWcM4Y8szhWP0EeKLRjUZjswNXeNRaC1XBg0STsnIJ241FZHW1NMIuU2L4rwARlZzojxjbEPrYH0qTbV2llFlHUgSt5R3nkp6/o5Metx1wCe5AAESpK22lAawHzeMBXKHSB1JAzSkf+KUEUjcmtU3Yz+U/OP32ji96aqwOqJCFDZQFQlQwiIArllEG0fkKVAguBVVXDQk6VLlysOYW8J5xYCUIkIQIWzlG74Kx1sWD/+1LE54ALUO15p6RtMY0VrnT2FdaSm2h5Iu9r7Ruo0SJC1jctbptSiG4YrDGIiZBJkMIQfY3vRaUCKTccV/SuIKI2URVAeUNPlkLdGU7PIoDnbWRegeKJHuq2w1HvLUccTClPfaivL5WVBz4LKIUociKPNDFOW7XdM2pyw6z+yusLJf+xNzycyklr+uoAAIxZt2NpKv6EQjiqRalIoJk406cnHmBKsaoHOsRInnW3haSV3CiHbgzFwOzAGHihLCLBPPKW5IpQ3St5hRHtu993rf/7UsTmggvUX09NvMjBVQ6qJZYNmF7V+hb0Lc11LuMaFbzERM6Y+MrKDLCE0sOe03FJhBYzwxKB5tpDTyjb3D6I2p8t4XcDQkeGnTQdLWJUQRSoOGiyxYPHhruxrtFXIv6CxOQoXmgHiix5KLmYohTSt/9dAACBEakiJLpkQKMEdgEMMJ4tORDQen3NR5+KHF17PmrYsNtITeNum7TyjI5Bct9rD8pSBEBAJggQLMaKEguG1izXoYMgW175Iy0zyODgcoWxDWVxKkYNePCVdRkV//tSxOqAECidYUxgy9FMDq3w8wnmGIoHmDDTCkpq0gBKO22yRtpwlQNMIfKXlUElczJqmFOynHhnhtYt6Sx3bR2ja405e1VevpyHk6L+f6rZHYqZQocufIKt8lKzBBUmYcLgVZEAiopfdWlrR8zUuw2qpIurK02fSgAA3ZJLI20wCRAlywhkAK8plqAreYDBDMwfJuAZZEhU/G3VO9WTN+6PYdgdQABYZa+uSctJBYxINXIxRn6xLFSrLCJ3hSUqucYVkSyAEQPkjgtlSddSVAv/+1LE3gAJyF1hrDBFoVGG6gm8JJhReHQaFMlNRYYAACIU3pZW4CgAaoUY62EKgaMCAxhhQQNQLpIxxqZjSLy0L5X8lPJnY/YM3uHXhVcAVWADOlOzwocGUnpm3n9sK04xK2O848GnOGOPTqY4scuAznIGPPV0kWGffVlqABTkkslskcCHggBAhbxtK0/y9mg9Y1ZFL0Xwr1mTCk3QWz2nU5TRztyTtn+0gHDvMbt5h6I/crf21j7cjiTq+jmfams05p8R2CQsLFgcDjCVzetfuP/7UsTqgAzce1espGzhZxNt9PYNblgbMREyMmnkFJvSSW62SALxZBoHsMdbH0OI6p19U4czCHsW0hvSMFybIF7tGBsMXcVLGFlgCdfs1fMJkkoPSJwUB8khYYNqEbkgwHWijIPDizTIlcOPWsp2sjEOdDU9tqVuISckgNrij8WE8cwGrI0s+CgcY0UiUwYQSq5GANaTSn/U0lrzy/JrV1satMsqTYuwhN1BOVdnZ2MSA5GcnxEOj7FOr/sY5FeyOzlkvWJsBLz6dQ7rdZrpNUP///tSxOgADCTLZ6ewZ/F1leq1pg0sjSSUqpQSYm2wFqc59JMg2jhk8DTjRT34syWIPxTNOY1AxCGXRaFch3FgDJablfdYpPD8+ZMo5cqUEL/7f/uZJA6Np/rY7426+f7nvEBhQRHg4wmDdKoeDp2CZEe08wgozepNilcNqUzPVQAqbakaKQdgzEEBzQZnuDaMXf/bsOU2SvDwNuQeXNFL6+Yq2PqlZZ8e6S1fB8TuOtKpTEPATYdZx8nsu+48+MaDwYVc03Lydajl3qYTeybet9r/+1LE5oALjN1rp5ixcWqPrbTwmk77hu3itoBLalkRdkksN8LgN43S9OJ5pZAqlMMsnUHcHBzcHpYRs4WWQPJpfwXoPRA1OM/CDwspC+9udnQCCQ6vucIQNDwcyeVD0/O0QhiPGSD0QyMTCeVFAdi8uERW4oQjRtWeSnLR+fsD5EsXtr6VjZV8dru1tp2Bw7e6zK/m4+epL8/SlDxOhjwtorEAulw0nV92T4sjMDgkFdBNFbh+XDRGBw5E+e7f/96qABDWqUBMIcSwOITEnCzF8P/7UsTpAgvQu0RtjLKBkpUpHbwYtNWpotTSi6/E8776RiWRZz5M9DffEsq+6kbHSsEzRqmDNAMm4AGgwh/CGoJJpksK6UUqonesDqG09cq945v267WhDxLFIp4zauVWplGmi4NMI7GVgP0/FUsMe1VU51ZWM4Q6ROgsmeL3Z/j2zQ0RdSz7jR8/aNZ7XNF8MBg0fjBonVvinv/6QFw4RaAakLNAtZv6nUpjWjLaCfVMJMEjFTeh8UFyYls/HnyicDhmdQN1wUOYGm16yzqxhBaX//tSxOUACuSRXUwlDTKYKu208zIn8Se1WJcfc1uV7LW4eV13bPABP0/JYxwjmaybcNWf8+kvHYfs8Zr5P1/3///lAAWfqqraTLooMHPLyDg2ptLgOgJEVBo4oAdInHKJ02czoRgq/2ZRyelvDNu/7sKLM43gkpJNbOybpoRvFQ2ijy62knqm5J6XZdRql+7Tmo9cXTvdQAS8ttnJGiVEgJgagI0ZCGI5RhuIXIaiIpGi1EHEJ+M1XYpv36qOhKfshkZ62zisu7vKnbGY4rXeXzL/+1LExAASySFZLTzR4YmKa+mGGOHK8ClTA1sfU4hJl1vF3GlLMHH8GnvUMiJNihXMuhtPa1ScqgADWFhai7/RuU3xSAH0P9ZTCkIhFUCldiwApqmRTDJcP4j5kjjVzKoi1KWhghCxQ7OiUJBJbywjjwaDqB4BYOHAYDPTvU1QugqL+ss5NG7wmFWZU5TDTqEesAAMUqtuJAqAgzqHaxEkIosZbTIRUZU6/NdmVCX5gQjKiC41eI2LDgqbMRL565Z2AVZi5nJ9/LkJ02JSvcgE/P/7UsSlgAqUh2OsJGVBdBcstPSM9KtcxN/xQLNnjzM+XFoxCULY3uawDQADR3a7tI1OIcBHBvCKOA3bGqB7hIKvEMOTE3uyoDDpRSXncqKpVQSXvatbgmYIkDrCxyAltW6cUPKm5ZrRKRNOvZ2oZ+BQaPq51dqvkxKyut3oASUcljksjbAcgbB4JQEjwB5OSOBY5ZcB/TQt39ATYpa5q1XM+KDEsq5sZzLOBiIUOt8ddy7EunWvgpkyxiA4dQJWOirFsPLIJFAROOALLobIqb76//tSxKqACzBfa+ewZaFRl6u1h4xsVSCW1JY5dI2wvDgShkI8wqJtBMxyriAYUiAl6GATBdOKec7k++TbqPLibjzIz92/+nkD8TBU0epHEx1ri4bSNbB3jXM11xOiP6uJqLv60hZQBi1VnFjgbDUhlUIGHBkYjJpuaCUGJsugomBD7anILUa6z7DjcCwwAQcooxg8KEa3Y4k6DnLWlqkeIjlakVB0KOEIhd1byocbeifsk3POvrUEdz2pG02AoRjhmYgJlq8bbmDFDZCvgJmwfDX/+1LEsYAKYFljp6RnIVEU7fTEjZbznCZ10vwWykZQgjJWOElUU62Tzwwi2c2878vVGOvGDCM+F8Yutbt74bF7mCjwO+4BHzU8vMlaEtUACkWVG5HG4BMgW4rwLhaNBDlKkYaf1nKcg3Sn3i1f08hwxGngw1fEnFU3wVsfM/OMM2dPbk+Wlm8m57CUEhkGpsxe1Dg+G3l6lftckOmUKYNTWwUFCKoAQTA5druDEis1sfBs0SloXCYyF1Bt8NUM3FpLGk3Zhgr2KPW7FPent//vUf/7UsS7gAm8e22npMlxRo6oScwgqEd+ogIYDoqaJiUQuQ1poHz5gok2Mn0hIHVevVujcZFmpsvl2tt96AACASTcaccpM4yCw5Q4wKszZNAArAhu4bREiIdZe04lCUkyYMQABAhF3N6YYQVZwum5lhwMdAgjTfR3NAN9E3P/rmkQ+mEDUpreTYA5cPnA+t9FTj/KHC5wHz4IOgg4TuE4PwTHBjs/6QFIpyNyrwPFoN+0MieBQpQdCSuERJhWABicIpprSrTshLbDQyjggVuzqt9F//tSxMmACoSbYUwkZ7FYFay08w3mVTDBugP/FYMKYwxuMTbyiSAhTAwzJBwEreER9KKUPWGarjmFzPrXPzKEpN1+HGoVYFAVjATEDMzZBKr1VzdgzYYaTdVZR3He37u64GAAWqMUojfjkxoAMHAYbW016fhrtakqwNPW78t7zUouT3eXZUeOs/mUmRqjFm5TLtF93+KbpghtrqMB76V8GPyE4JB0sgHH9o3v6IOBBRMsUB8LBusLDTTCFo/rL0aaADNWWFVqogSXRWjHAySA2LT/+1LE0gAKYFdPTeEjAaQVq2mjDaRgNzeBIf6jWXQo+/niIj7nJqxH/M6RRVqS5S82R/Sz7Js/vX7srIyiAuIhz3Rlyplv+nTP630Pmy7PseJEILrWAU64pY0SknTY0QcNFQyjIqFYdnRfYJh40bH98N7jARGM1GlaePC8ULGzvaSRaoPCWRCS2nSpEVchTXgEqRfn6UiFp3+hD9BLvSeeIeEvxF3saSK1Oq/zERYGCgjHWJl9VgUgGAR12JSz6Bl+YUDCMoMggrvOB2VV1aVFpP/7UsTSAA71W17tJGdpe5yrGbGacNTR2z+9kQt1yVLKSUGZS8JioNCMFRhcCOKuEwLPbSy1/ti8wmJLaKc71UAJJqKRuIkAsG+SYS+coG5wYDqDfkRkNTwhnxYCGe0qiBxLMolJEsdetJEUnAyOHJYlG9jGoCbQSbOsSEGCljjZ1iDztyP29raEbWN1VRV6gLi6ATcdeslbRCYVjCHIf90dPDTPqKxpM7oo+FYfwx/D56FwVrE/rRT6+5bnDdtgHeQMonFsHL4dsPkQKeCZVYXR//tSxMSAChzLb+wwQeFOB6w1phhoaMiFLbE7Btcr//U11g41kKr+gJuWZ266yNwBJEeS9QK9biH2oo6lbl0rB8qYyxSqQHDSUXNiV817V72hsYPPgESAcHmLqCtaxEprVSo8QJnXMSlCkoMCrib26xmTZ0kmkW1XK10Bsyo2yikDndKwWsKmZBTsDml82JS6dS8/UPxdek1k4Uzdu10qPYLnQ4hUQj8sE4s2/+qMhkd1ZkekcI//8vyVf8oZrG7ZTzCp3zQ/61IpllFvnIx2xBz/+1LE0AAKVJVODaBNQUgH7TWGGHaXiChjKlNe+gBJw1TSSyOQDEjHqW8njRHQByYoh2JmhWpA0fbLmjLXow7VhjQmB6PaFHlyy/hQ72iHQ0lyv6F6qaAkCciuF4LPDvmUCMFO/N/g9pmNVZS713tu8Gffar//nAAAgRYnI03AbfID0CPjxeIji4CtikTLnsX9+RAGndGH3p1cgsFSwWyJ1MU8E+vDAKY5lO2DsxjM6m/k83zLe6gvQ3ofy8/X6/ACbxTSi6LSm6Xy3vV9vu763//7UsTbgAowi22sPGXxSIsutPKhxr437/Py/KQBJwxWSWSNwEiJqSUVZfTNIU/NFoP43m90nFYjVd94XURxnU1eWSWyBCBD7OQgDaCTYYABihIKgAYq596/BDtDxw6KPOiNpUROjwIcDrQ2V10aHe3qmmuNCqp4PyqVACAgEqS7AIMDTs5Icw48yhEkFoOoxITnKljXSEG5g6DZp0rmNgLWXF+9fV6YS/UwpmROhpqZ+XOPYDNWLETOiHQOCBKKQ5eHHhGn/z1LroZ/TkpHOEVN//tSxOeAC+kPX0ywbzFnDy208ZqXz9IfpGLhk5cWWsQsDIj+4jsAHeEYEASJAAhLpNkECX0/jMKV34fjbS0xydthuK1bXcVnakYZDp+va1HZ34c5/j1mEIYS85zrf7gRGBQJ8wEACERne773fts5PTCEFMufiAufDHBN4gdcD7wQdPo/+6NaAIufVSoCAHCSCm4DEBX8qipNhULNSNIwUQT+NGTAIDcWGSxVKXURRBARAoHfLbA9KG69ACCBGYxl55QWWGENNDzIYN3S1VI9L6T/+1LE6QAMIJVPrLxnqXYRLTT3jS6B8WdQaqJhgAxgGGSZwnjNp6BnzIDbIhEskcCNpNmUl7IatpZqJlBU35F8bl0SFhlacOw3FW6besSMwZK/UqaImjAisBClckJ1caroAAKTlUSpPJXMSqRz1FISdJOiQnKuVNNDsbT8uEjS5+2Yb20RjvV7PqWS2/WCRmVZkz8l5zEf5KIFBsU5VIAMuwcxuDwJxnYASRjJgjGMY7R2MQ8YyHiIIZBRDvdGY25GHg5MLQ98ya3Yp7Z+TT7Zdv/7UsTngA15KU1NPGzJhpIsZYeZdv2hCmqf6VACQAFIJEltcl2iVQl29fXCcmVzBqFernamvJXW8/GNxf7UYuSKCe+pMoLI+X9ZVtfMuhGCOwlTFy/sOi+IKnRNZ9edQfTkoPTNUsXlFvLdNJshSunwKiB5LO1qSIlflPrx8Fpr5vagsNAFHEEjvGsbSztXA/1EaBoMgzmdAG+iYzAozxaDjAA4wwiiB5CNi3nukDoTB4qJaJpa3HiJtdD2SxtyAMQSWPZ5NT/Yiyte+kquUcZa//tSxN6AEiD5XUzhKeHNM+1M8Jsr1p6xNQwAAADSIVGMDzA0DYO+RKqhD3yejAMksWRIKcOCkUYzZN1kQUbZdpdps2ok0S74kFHuYsxSEpZ5089yTqrEj3tYHG9KL+2zYxtiaPS9zLkPFWIFfUAQIGCAGnE5QokHOFMtFqu2378jhgjMHUYZBNAukbcDBPG0DMnNUJQebHUOrDM5W8FHuKCIO7JJLGhNdjwMISrddeqi2XGePZ8A7i3ra3773TXeAAGEDQTZRJj/DTTaBAyDH8X/+1LEugANcZt3R4U3uT+J64mHmHBsX+CSNcerz4OhxH+tG8ExSrU02AcKcFcNMMap5i8edASEuWKogAgO/JLdexyO/vezsqbI/SiqJOJoxi37mPjlvuIrddkru1jbsItJrgMwkDsdhN2FW1GQyGelnVkJ+aWp9qQDDI83YriMLEs3CKokcqc2j5kSnIao4xn528ZNqPVVcgq7rFdneh139kqkB1V5lFUEEwU3G02BQkDH9I01pb7RRPgCjRWToSoCidYE78bwPxUzrzgYTPQrAv/7UsS6AAqMgWFHmEshSg1rNYSM8Bv2shh/B0jNKOc8TbmIXEhpsigTuvRucoUSm9TzTXlLKedLJs96wAARgDHdFYihwZEeIQBzIopD86FRmVJAmDi0/1FSaZ+o6SCDmbpj02p15qv2SxdWLih46ULqa4BOgQgGG4FfBdrxwJq2JAoZ1d3HISxjZxlVikGU1nW5bGkwSEWIz3qILY3JZOsq6Ujx4aBOWE9O12XBjM2aGQUDN+JCGCj0+pSFiaP0FYdeKlATiNK666C+qVHr6tVt//tSxMSAClBRWawxB2FCk+70wI6O/ohe0wDrz4+oXDpgAAAQEB/j7dgkpWcOBBamQGCuQhhFr7itEfU1rQadOi64oYSsnlxXZAlmiJpRkDGh+Z+HALUjY0ytImY8XXLpTGVtKI//Yv3p9SmjHyCJ+zqqAJBGNKnsjTrCxppqjH4BdN8GmrB02LwanUVIbX8/FV9xWeWMkjnru+Cs3KBRJPfFBiFUWRY3baX3krKKUdSREEyp9a1MOmx48gGBpl5wX32EQKXsGNqqnUXEThS50cj/+1DE0IBJ6IFbTDBnkUSMa3WGLGxjRooV/9gCJiBSJpugRZ3zzNQhd9RNpLS0oHhiL4w9AgqHKl7wzayQEp9QgD9EhPNF0IWKoRFygTCff/97qq0cLrFji5uw4dtQo26apSpdoTYbFha7Mp75Mo1Q0nFeGCqDN63fdQ8mYbkSATWkEPxDFwnhfGsxeR5WpzbVmc776m49M4pHwTM/lSZY9BYmFurK5OLO6LY2q9iRllY8eEgJaIGlQj55JUQ8TwkRwoWbhd0OSseAq1YxzsDH//tSxN2ACfhlcaeccjFCDGoxh42YCzIzoIOxhJh2DjkQ6NrX6Kn0//V2p+RUIE0C5B0wOFIQE5AIQ0LC55u6YRyi9l5u0jo8OE6C71SO+obNRNpzZl2faaAaDCEAKRaRgZocwM8Iy2F2P0hwrgWFWaAxWpfq9qcs5diUMPf1WBmmXsRLzVmIwqexhTYiAp5eavvIvERNjtkgXiqnlkUvsC/d4iVm9eODoaQ3UPUBAIYIV1I8aRJLjBzHue6JK8BoyoKiHwfLrB9LmnK/vfU0H4r/+1LE6wAMnJNbrDBuoXsQqmmUjdB4MGgo85VNo/t1qt/zz7E8t+CFZHEBRJxSsc1kuEb+L7kN/1LMz1N7nPdDjdj0gAAhiANtxu5KUOybnvrSM/XI4IvOl53DCJNnihL/pkilZX+o/vWLY6Gr1PrebMsXsqWfWUBM4ZFyT+S8B/A5ZxlI9tHqX2XNc5AJJLBMqXiiPyAAAzRCkUlAQkpuHlgIFx3dUGFp05ZMRjAh4BjYiEtqcRsrIfKjw9qlSRBKUiOP/8Wk8uXSWb5q/Imk9P/7UsTnABMxh2tHiT6xUA/sNPYM7CMWIvzv1v0RDO3EvlklP/tkhxCCVCDutyQES3FY62kSGjIxMTFYcjkXEL+P1D5ie0Lc/LDDkFlNhQfT1slORXVS7cgX2rXRwERKs6We2LmRGvM51RBFahhIOfyLo1JIw6z1f//d710VEAAATnEsECCWBFgbSPaAt/HHQ6iQEJ9uAZR2TuvKX/WNp4cGyh2h85Qco713HmRa0y7ehslX8FSyUA0gVOQkcVJANCJFlyP/U3RbIP0MZ/+LeY2K//tSxM4ACkSdW4wwZ2FLCas1hgjwpAAIgNkEqBKYBpATwMgKRyAAdSYLKhyhEVqRfdOqBxII6hDxwUzgGmjUMUEBw4f9H+bZ5+PR0qDuWDVuYXP0iAIKOcLk5eIiqHi55bCCVC52gNlGyhVsyy+sofvuHFWTwlM174aqAICECZ1bacCDIeyNKjx7TnYSGctdz7J58mI5Y29OKPMlUolL6jusiQ2i+DjmA5pePuSrCsyRaBygsqJ6slG2Kpqs7SuVH0brum1mqhVZZP9nRdv5UUL/+1LE2YAKeKdTTKRpQUEVLbTCjw5DzjyyLtyjWxkUAQMUca0jabA7F8rkJgEJcGY16JY1oXEijwRQk24RAMeQjODQcmdf6qj2bKkLC4bP1ZVETsurEM8OXXWhO4St9rMO+3mGizDsnv7fqljLTpS7QQ8oSaVFgl8N721/NQAARQANdtdwCiROPLIBSTZVgxQIQ4kBSngEEhgOKhMGmKnwamu5fHDb5l2dJKlQkpWFayyzVtYNHj4YE4o0+8cDiSCz97QGoYJgLATHsZVtXalco//7UsTlgAp4XVWsMA8hkg1oqaeZoOlpZ+9QVDflFhMuOy17W2SAugyAWAOMxJMxgFZWPSnjpauX0Bhmw92aVMtno4x/N5weojowLNbCqbMCFOB0lVvpGtMtLcGltCzuhApu+zIrKm1CKskm3Ttnft0MDTh9hzyKgG9ZBQACBDkakkBpaKD1GFAcQRhljyRQKgYoOzxtGt229du3S2X61sO5+EkAY4IUlzwu+gdbHVjgNLtjcvLbPcb1LmzJ+3hNnudKyPvbP3u4Ygg6ZmeIjh0h//tSxOcADAETU6y8SeF3i+y09jx/m8BMRQEzbLC+qiXLlB2qMEVruuS5BSyfUJIWFktlctk8S6pz5Rdim5SQkHQ4OCIZlsc112nHK2qsRPyv2VlKd/TdjvcmcrAwyGXEfO/6VRtk8d4OHBhBiCONJhgogPASAJFISCi6KsKmTVYtPVcqj4vQfrcTHbhyfr32G0p+dgfHclgfNnT/FwgGi+B1u+rIvYWMOLOzm4Dg8WUYXr2yuW7Hjb9IqThwTImyQYHjq9espaYglNBph3/lzt//+1LE5gALnGFPrWGAwXKhrbTBiw4q/udfcycwgiti48Pri+AYGOQG8QAeWHXc3PhUOLNoY0EH9TkKBpAiwMPjRQ1CdDZxrqA0rAw2neWFaEGwUFKPTbm0TTKT1RVqcEWyWtkUphUljWs41KX/v3HrTixtDMURC4MlnxVDQqm0QmAaQx/pNWCzTt1oVPiUrIfGGKAcMoCz946iUAAkQXDTHKkmmIeuahF1dyGkgSpLbZJY0ipg/DNryOkQDBIU/M4yashdk8tV68Wzymf/VXEw5v/7UsTnAhRNh1FMmZHqUCzqxbYOOqTjQy+9P84pcMrwzYjsWnf02X9/6c/ehF/+b//30pDoFiyUCoN5elx4gSxbHsdZCLrutttjaSpgD+IUsUQg+FCbqnKvcXJhUaEsnMKD+VhQtwLNalXMKhTxK2TBElWGXhlKVOw2MY5y0VXu3Yzbs/HpTJHZOW7MqbFgSnQiE1nBZjRy2VLYAA1rTIqZXYa5+TOnndAsu0SdGB48JiHQQHR4hJVFTSeSj8MR7w93JDR7NOaTM37+JtikkoWO//tSxKmADki/XE1hIMFOpnA0wYqmJDSrh4OE0lqE3l21S4+uSc1ueyu6qiLqoQAAAjkNQBnL4moUEQkaLsHJACqEnp5I9E/XmEzQzj15lVrVQyosC+10u5Ey4CEiyXmRQrYE0NmAuLw4fHnnJFN5lF7bl1frQeTUrZ628VhVqk3bQAUS1XVqrnZBjONUa9mpi16fcm2uvlFLuMjUpjVCGl5iPftvL1PrLO2KnPEtUz7+tCsIqz63C6bXuXUO1pWcKgQnACtScyAkxXkO/zre2jr/+1LEpIAK3FWBp6UIsTuPq+WkjPTVOoUAyVaeS6yNwBdFYsrD4Nh1DcalpOUzYbhkYHMvoQ7kAQVVkkIP4uBtFMOOsqrVSYD40OLF70urMEUigtInZ5oshOzOnt0jcxkVZyoTM0X3AasfDt2TNc3o1UxzJRFCgKNgAtUYeUISUtBklvWSDqZllP/IH6vzsvGw3Hq28qGMaPtrYATKPi5LpMp++kqDahahThKFzTQSW0W2OF6822c22PbNXAAkjFrJLI4wBpCEoUY84sZ0tSolXP/7UsSvgApoXVuNJEzhSQ7s8YeNLucVPBKVznLe+YpNLhzQwUhx1ILBAKsJdeeCHI4miZwgCYEJHhh9LiQBDKLCie2jfMpCZkKB0SmDa2x2v27wAUQzK7IyzIgQEedaeQcWGeQSni+rskIosfpOMlgxjdaQ0jQGd0/+77QqyYYG53HB404XYIYamMSLTWYYWGhcYgmcao0xayLWMF3v//iLc+n7agAABTYq4mggCrAHIBCtR0C67uS2S6qyL5Iwd9GNc9wxQG1SpYQAaoLf59ST//tSxLqACiBjd6exA/FLi+iFzKCwEVgoJI5GBNTRshX/OCyzOOWcH+8iJGuDDHRczGlD77f///f01AAIBqouNJFAmAA6kyHJToHY5kEYUNgaYCLB1GMalYCGHcd5KFLhJHMC64lvDFMWPfFpp0Xh4U+xTqw+Zz4zJMfP5wVNmlnCzzs63qJ/z8Pn7+VqABRNPksjbTBlE6CQLuOW2Aa7m1tU/SJoENQ9W19CSgEBEMQOgtlXDJAHSk9yNM6rHsfrc/+ILhuRwj3QhY5Lp/3TRAv/+1LExoBKUF1tp7xl8UcKrPWGPO6i1gnWfJ6upf5fT0vAFIlSVEUSETS1MnpkxuufK7L1Um7y9YpA8jui4QQq+wTmlIk6CED1oYz7HU6Nu7c57ORTnaeo7ut3Yn60ZuQQScWECMCUcYP3RAY3/Z9a/jn4OrnUH3/7f39VCRZkSCpGgJCCxMv8ogXpg9j1SAKsCROPS+VzNR+Wz0r2VMeXM+xvG4tZfKfJfJaaEoIGl9mftrA7FWHO7Osfkilq8FC1hXyZ1LkcRRUP7KQ8ikcytf/7UsTSAAoch2GsMG1xSY2r9Yegfqrb+0rLTXrbpsjKyHVijbGuUfv+VJqOWa7SkfYfOYeCTr/RFZp7rm+PIgKAFH0chteZeEhYhmNUo4XrPFLDvaF8zwPTk0O2IeS8XdCkKzLEQEypWnEQZuU1LdaYZDoGqIHACg0J3NQ/yEi2Zu3Ve/b+Ro3Hs0IyFQUq07rFAAbGPbVbSl0mQhD7IosuHiLQ+H1gVw6hhQtD9naaLhfbGdAWhM5cJTqrljwdDyTk+ZJHGLaZnmEF5DosnE9x//tSxN4ACgiXa6ekbzFommwlgwnnAg1a9RdSYEUPDlwwQF1J6bWrPAAgBjAVIIqAs8e8xpvlFSNB2jvq6EVeKAYGp2fCzJwnNrUNckkMNieuqFHpdu+lezMUdRmomRQWKRIki2E9gzE5lLErEuxybJY9/VX1ks4ZZYqipQAo01UokUAXAJYW4ig0TVwbg8EPSKGGswjCGPgpYGKMBJTwVScQhZobX7KyuIlBayxE3f8Z8Cn1PFB4srSQOi5UFihIDAiw0KbVtszv/pzDxXjL8u7/+1LE5oAP3U9a7Qh66UqLalmnpOCSByTr3UofrUAABkEk43WSSWuQE4AYCgF8Le2I8/mFqWsOzbIMDfVm6WA2GpJB+Ngz+imxMyy8nihERGFREKNs4TAUXhpIHseNYUPohtZIUPZZtoblg7rn7STlsI3N2js3cO4U+hUAAAAFGAJcKKgIAQdEeRZ0ChAA4MZYbxepD2o2CzliRYhTFilTCPo4F9mtY2425mUZnLzhRKE5AzliwGBgPgzbOmGql0F+OcMhRUS7q2pQwq5TxZGoaP/7UsTbgAo8O2GsMQWhTotqdZeZkCgUWBnUZEFTRWaOaxtwZLwSVRoSN0O8zgG0d6SNWFDKQigxLFTbSSblZY66lFF/f/gTk4XuZtOLnDXSZ91/cPmtfL1rU8WA96GLXMpcAxK9YpSlUXIvREZdyVPalA1YatAidc0tAKjetkusbcGRTjKLUrzGU4zCSMvWG4zB+mwC3iRHBEL596gP6yD53vunBWVECFlBV8YSA532kZvfbOxFjQqgGVGyYmFlypMmGnVwyBLh1zb14ipS2/SI//tSxOaAC6xnZaw9ZbFzjaw89JnkieRVOx8yAC2645ZZHIKDvBftKkPBOFYoEke6aXiqEuP8b08x4fns5nxhk93RKvGC0+ZYSOKnHGLqzLIxTMosqU6Wa2BfbHH/j4hID99WnmvazFtlsn96mHaoWh/qLUP5ft+WstraAAZCcT/9ZDSMARcoojSmvDSnmcuOPPwaH2jCJt8qoQHXUdWUo8Vnv+DUGCz57G2bF2u8vMyKrTa+f/LhCXlhgIFHNBUOG71sS1qQoREuRVhloztdFhH/+1LE5wALiGtT7LxF4XoR7bT2GZ401AzXuVA5YAhtR6K2SSQNguY9Bij/FwPSZEF1PkE4HEPB1Cs8s8tLA5HapD90PXOn5lLx6SF79CaqbDCYIWE0WtF6v5dzrJefX/8yv+fcucZFgJ1KFc3PEHIkOsjLhMalCvhRHWq+BStdn0u10tEhuj8VaFGmbDOS4fGCxwHRNX6HTVokGweDokXLxABdPt5owVJ9o+pDa/1WX1zJdpd1qr3TNN+OuUpjl3qZ1tbyvbsdZ5yATmww8PjwuP/7UsTngAucf22noNQxfw9tNPYN53hqErwy19J/iix0+tRhYAv1HOsKhMbkYbDYdbiA8gegZhPjXkVzkL1IGAVgm6BExQseERESIIdJqHpEzEAHgEMnIFS/nN+I6aWfYx543Nz46DQmjqJAeR0sY2DiZwd5vcm8Iyd4zje/BPG8vo+fsB0XGtL07vn5ulVIY2bfnd0TVK1////L2MYaDsHwvZudyk+lCk7////+cvecp5ys5Vedhd0Xw49q1QBZJARu08PMDCukcuTmgpFxV1LP//tSxOcAC7CRXYwwyXF9Haz09g0+2JXQqWUBRhTlhBQrjGxZdWtKGRqJTJG2KfRAyI4fB0cCBE4/ICxwvD5Bbw4021QIAMLIGvF5eLm5mt7q9vSH2f8HwAkJnhGaJEIp2g7C5ngjl0g2RezCcU69cINkKWcIFKwIKJins7M690YLfhf8lp7FdWZeytTCIz54JUOljZWAvKfwzaaftG9lxWrFhONpsOoCJ3Wk1uXsy4rQ6Q6/WbOrYfa8NYULKjlW2pUAFCZHWmaZIAMhEmF8aqz/+1LE5oAMbLdxtPYAMmMyLOsesAOoTldH/RT1gJSL0bGzjsdtTMT6Gg9+WU1htpw25lqysthMGNDao5dbWYhOi7nOnaUo7+uhSb1la792YT9N/2gAhCpr8BfqjDQHYWWyFOoSrAYWlWPC208nUR45R+j3CAemquOzxgXBkHYaN7ySA+q1pZAmzp5ohUBaFETzEpY3cukk4khPTKpNlA2IosBtuttG5SARBZY9WkSrTMnecmeM8xTPVBlR0Sj4aXrJQSmKmrRvlml72/w+D4Q1z//7UsTGAArIgWE88YABqTFtvPEN/ECJynAHBdk7rFTg9xwUJKYPRiXRFm7VvOqLIJdlW2o8Wq+WfqubXuZWACIPY5tZEpkmBNhcHQ2Guf0pu6Oi50BEBKZPo6bjr9oUwA9y4OXA7zIBD60H12nkRZcWUNkUAcuwJsprSqliMww7f3/jdw3qprbiqAebXIm1AAEDCjU3rnVJplXBMAaYgCWIS8MyyQd0QJ1mmhosGVLHbFRpVoDa3LjlSzNsyjAeccmwgGWhoYvgk8qlbAyJCSUs//tSxMOACbSDaeeEVKFLimtxhgiwObWa68REiw9F91dfX9X4tdxgAIAQhklTBebulsEZS9Q4b5xKsg9l7K8e6uJzF6IJnXJ+TVLb5r0AjwiRKBbGhsAARoQnKqFOpAbEEHpZ/orhZP/HGYqB1vP+QPkL5oWMhG452RxRAFKmmXIgycBwEIP8Vp4IKkjnI0S1/oEdJEtDUjHr1RcoCFXmpzDQx8JRwRC8LMklY3ue/jg4CmnC5tp1CBa8qPUOBoWehYtdH8ZKSYFAK14TZjKxMhr/+1LE0QAKXFdfrDzDIUKJbDT0iSSRDbL3qFj39QChairekbSQuJAKI3i6hmiCnSfz49WSY8KhMF58K4NNI6Qt2nmy27KwYVFnnFEMz0PpICyQM+WTl86xER38zzt2TWTpZRJMj/GQPaoE9YfcloQVS6U1QsbXNQiqIMKdTctjSSCoHKGrHQnSXB8Npu6a7SqhUtqpaqAubjaWQwArzGdyIxN5KUfzjNQsyQ5R2Snc07KSVq3OtHnP709fShxMhHKt9PoltTmUaow2t65ObvcbJv/7UsTdAAp0W1/sPMOhUIirdYekZFlkngABilBJNlp1GYHNERDEdXAkl2awgVMx11meJwP5ZeV3dz/K7OyiUAPk873I4dlhTalqZipkLzNKQQJkxGxFNuv6eS549opI58/mx+5YjJpRrhdYcuApA4ED4EE9g82l26t9ABN6eJplZRQRhha41RV8CUaTiJKlb7TMWQ8JhKEHAYXM4ALt6RwvO8OgZqREBKZUrLUhifm1KiKl6u901ot90689U9llz1RF/9/3S3/prvoW2xqthWHS//tSxOcAC8RxTOyxDIFsGyz09I12Qct5YO8AUaQKylWabSUP4kI9IjTMQQcxOwIJ/AGEwY0UbjCGqFZnGw45OdczM17b9NKuIjy6C4E4rA1ljV5zk7NNRqCgIAgGAgCAYLgR5eEBoXN4rf2aP7v/g/id8ucVoIJqyhzg+km4zHZIjMEFWg/Sy4gx+L7qxpAZcedaEhEJCkCSNmPnFlDKpVHOq7soSEmWX8U6RIl3EM8zBwxxkExIE8OdEPCKldiFPbRl9Pb/1rY50Z1NIyqIsjv/+1LE6AALXQFpp5hPcYcZ6nWBijBd80pU7AxpxOOryXYmIc/Tv1+n/bPZrvneoWUlQT0Yih2JYBkrqwkrDA0RPex1wDw0fImUuORl8Uxv2vcssS/91xLSekH1e9o76jPS5v4pv6e5PqKqe0ublYWDMSDlHuw6MuZdbVq4lO/VMBBLWFVtGygFWMNopzlZAjEgEBolm7ZgVybGpxes4cCdAyhWRcHL7EqmfnD7l/RxQjclTxjDrXixI+++1Y2SGxagkeApH6f/qs2Y5+LCxLiV2//7UsTngAvZXVVMmE0Be44saPY8+q8AM2iyQAVJsDdBwweumuHZCHCGlHh60L4/RnnU2RXOwLErqVcrXaK9/c3pkBj1FShMsISzBOWYLFSNiZMVcpwjXxTQqgakZ7mr0JLiFdzY2xJqMSDpI2gfHtYMq1IABsRV1lkkGJ3jJy1wOE7BERwFGTMGpDRCeagQEcjw1WcIiY2ctCFFojjkHcgJlEpr/l8eRQxmxlaRLFXJBRH9NcvJiX5Y3hLzvnhScw41bmLPLPP2ba4SkkJWbwaS//tSxOaDDak3XmwkS8lGnasBhiCgh4UDB5glpUAA4M6q4iiVYJVWRDCKOQXzR46jXgJlXL7cXlD52SNFEQpLXXzfzheGxGsRz/ufqTY0EGrYsODm2llMSVhkoDyxQ2WY9hKSSW0tptJSzbzyGKQk+gmwjihIGsVdCwiQj0UADEM1SMkkqiqwT8fqdivMAALArEeVnpVPh5BdaVh5U63KQeW12NDGRBCuiJRmMOf0RUSVWR6L1+5nWu1S7lb/1t1ZjGf39fN9W/0+vR360v0+KMX/+1LE5QAKYHdp57BjoXKK6qmXmKDgRF1A76NjI1YFCk4QsNSYDPVN4TFU0lBAc2uQ+UbU5T1lLEI1D9WHXQhlkzu1J3ENASg+1UjK6lMYm0VZjsuc719LXSrfclHjQSFLELOB0tLgsVpYLtFzQAZeHvq6mZMG8VUBAgrYYSmjqsCBc/NWMBKTG24CDAVD0eF9W1zsFLuLg6Mm1QyeACpdQ6upPi696WK1fVAVOw+cNkr55MCeKHyZ8og8YW1gtBJLR4xg0focmIxQRFFsGPnbLP/7UsTrAAys31msMGdhgQvrNYeYpFm301H1UAAAjAotxItgt6cBGMsyBU6RojcDEy5y3znXlqQe2q2k8W1g8+CZrJdtYGZVhbY3FBGOAkJ5BEYaGzEFQIDtKZ+63Ltf1zvuvJQPtM5R71frxcWmHQO4svP1vdUr799j3TIAAAQ2tyNuSJbGtJCgnFEQ5QG5rWAic0CGAoi8VFt+VnDg0ndHHTpM5ykyBxB9thU5wym50nv/wyu2cQ8zLKZdLlLql5Qt0Oa/5tnlkqnkHJNi27sn//tSxOYAC1VZVawwSSFvlWiJswpQa50vKwoz6QQm1pZI7IUmpCejsEJmPpDSkBokLi2A2JxQBI2uJdl8BtOdCW++AnZSNCDnEPJ8v/zEFm1qZUMEcka1H9A8LOIRAWDv+NA5B/6i4gE5AQFym3h9Q0CIyn/nyHOVRYTkjAtR9FFsB/8aCOEeOIQv/ap3SVkdNoEmkFFRSipZs/3On5SXJZcpIw4EZr1aaWw3A+pZLF4P7AjB6d9Ixnhz6b878/PSsgZ+jaxm0u26E0sctNO0Y57/+1LE6IAL3H1AzbBtAYMPabWkjdVRarMbTMayOvXmlLzMWZR4KQFDQHxJOE77qOtZYZaht2tHtlzZ7h1V7XeOrrYL7Vc7X5rjlnv09On3cmpBnXfzh6kvGqzhMarNjAhayv8IIDjMAhp5wPwEGOlI4FpYDb5VZiCZsXXvOX5K/bubpK16SP469ZR51GqtaikTlSOo4MIgZW0ZpLSmcobETppPNvWZ+rzQV8OPRjvGOuA8Y1csHOxKBXrpcsR0EzLEOghZplse7pHalO1SMDK7YP/7UsTmgAuA/VGssGehbZStNPYM9nB9Ev/llsjz7jm0zBADAsNFrlensVCo+Xk62wsH7Mdd/+/+CrEC7qgUSy5RUKx/A4aCkZLhIPtLSMDRIEs1MjESUaicdXEo59/ejYJJVLNGN8vlrLmcxq62Q5WiQwqZMJBsBkf+QBVSwhJ10FTbDqJsqCT12o2l1zOiBmZ65Rg8fAAVaVXg3dbU714epBB04JkNCIh+4UVtxKqptAZL3muoztmqyrWAs1XpMBEufE/SCK/DL8wYKH3h4EjG//tSxOiDFL2lTGywe0pPoCnFl68YI1sCKnfY540seYSZfNu6cafxRSCnEAxV3sDDtqoAYYRBApDI+fTC4BTHhGC6nnnZxKcIfEgxIgLSgWWRnMR0peRs/+Cq5TagCjpWWLCjSZxbThQOAjBBcsqGUiqmIhaMLrNFIbGjVsoCrzrjh8/czHKCiiJEeevzdlyA9ixgCJDRFNtvIjOpzXTA6p0LR5xC8qCYfFIlEBzE1sPoVF0sw1Vl7ocqB1OVIhqbasZ2UQz2Olvpzopk6ctqX6H/+1LEqYALeKlpRhhPEV2R7Tz2DLQU/u33Zbf9V/t5W/6f1dchIJxAD6msElwCnBisxQAR0WkAlZwXEazpKYliA3Fh28fXF4aj4vbHVCGSlIMmpmnD2oSmiabYq7Sggysm96MpDPKypX5fsqPNfo6Aj3ZPQ3ddNXmVWYyWcGcEzKA0GkM7+KoSs1CoBKcXuDxjQAAge/JLZE50X2jg5I1GwJKJBFDrUOqdwnLioO8n9obwOLUUc/siqxRCo2y1KWjG0Kgsn9G31edWBvWiUNI9vv/7UsStgAv8WVMs4MEBbyttfPSI9L//qd63XYtPy7X/2/roynKzW5+rLCx7EBmnIrUABBRVtWtACIERWgQDF4SeLAxhEuhdcKqGYsn86suZLkUdyDiDi5ym9kN/uZRnylVAxIKuHPrig8AjA9sOij25YbP0XU2zFLyz5n/H90mIhwWiEyOFzMVY5aQAsHlG1o0SqVTszEpotVBhLEmhGY8JVNyqfE8PNhE0IDZE51dsf4853r9uYGSikViYLqY/c60kLWEPvfcvZtTxRqWtHJv1//tSxK2AC/UHUyygTUFrrmu1hgiwqRubc5ffPvmJGSh2pakFjAi06ZEOJUzYyRL0yfoFH2TKPNbcxgsdjrX4kv3UofuxDgLWkg0BLGIJ+5hIHSp6aCj4lArCbGpjFazY6zafYRUn6H3QE5oBc6P7yQ0xSUZZYu8FVqCpk0Cs58AeeFnBK4GKJYsPKJ5OCOs0fJGH6vEyQ8XIejgZPUyxlxw0b28lQSOsv23rcoLgJl5F/R65CtaCLiNnXOsKu6kwVVFbqvkVACYCEIPTYjYe7Cz/+1LErgALOHdZrLBj4VAM63WGGNy40QOIGrAtcZG8lAIwJOCQPCQLLdvR+ZO/ZqklyGIHHyXf5sOMS2MJnSsSBQNPucypojUo1LUukXqZDhg5aVTrbsF9pe7SfWAZE45HLZG4FMSwZjPGHiH+EUj0z2lubVbKhszIsiBV7awmbVXes1mI+hw0BqwyZ2zw3m9ODUS0NtIOUKAIiVn1qiYw9QTAEgXMIFdcV0Sy2tIt7aEAFkJxV9rCOgIOAyJXZtSfqPxBgAgHjkR4+EnSJqI14P/7UsS1AwqAXUQt6MOBOgvoyaYhiCgPkwmOEJoF279p3AzuE9M5ChDaXfifbnfzJRYEDY+XEzhYZWlgEJzwCKrVR/2t9naAQCiUbZkgyo1YEA3clLdH1eeGoKj2Ecyk263LkUcByIcwr567rm7dakp7/bH8p/lcESFcKo0hJatB8o5FJSuiV9ZXC6GVSyn7h35izfpKS1jlhhunp+jdFOzrkf//88uxD16yXqKjv2LRkDMmCA+qbiiAwvXJ9UJIMSMBckAIQmxGGxW9gjJy5tBB//tSxMGACkxfTY0kaWFRki008w3W1AGDBYtb4HOMOjh6AMU2P+AzKRqFliHcdFKwYynKvrF4pHFaGG2toLM6d92Wuw6zWjdt8LNyAVUcpLD7OOFjtyg+D6ZlTDLJJbB4R1Qg+1g46JIq5qb2dGep26f89UW11tpX///pmHXEgGOoqUSHmlKw0OuOAEASjBYPDCkEg8HSrf/a4sSIb//mmuj+jA9HIVcWnEqpchFI/fOXanJzNa/Lz0h6lAhZkSchjYCRMQAWDGYMAAK61tArDED/+1LEzAAKJKtbjCRpMlos62mAp8sBRiCBI/C0yZyMQiUeIZAiNdFYANMQMTutv84GbXK3n+kdJQACIyQAADqdGsBNdv2tNXA/BXKh8gC5LNS4qDJZULatPbns3Z6KFYwCiqy2nq9zqvfVXbVnfR0U6M4xwAm0YDSqtmUtU3DLo5foPK/p6In0gODbSABtKNeUvepJjpdw+GBwrOSMXH1GHnMw7AIXK68MjJBKscZfzz70EFDVhluoeAD8rUetNpOgreGn351DyyJIsq9L7A7/e//7UsS2AA9JX04soLURYZ2uNMCabfkmDjd54sbZkWrBVQCBmuUB09zCAAEQ0dkGLUBahDWoLjTRoszU4GYIWeXjCSkLD2c2IgVhXlE0/nqqz8jziTP6DQNQqKNFQ1SiX2sRZfM3HRyEqMzsMxiVMp7U+4WBrlkSSVyf42GRGKwtDQWAoSgqNEY4Bww3IJ/ULw8/1HJjLFuxmZCkZ3NMacag1eQfalqDgaRzI1glF76NAGMe5XyV+sH3IHCQ0uRVRSxlDUq9KgCoS3pE0kSoNaUd//tSxKqACgTNX4wkRQFRjesllgyoW6EQsxEgyPGAUJCSDFKoAigbiWVrKthHGSQd3gIQAhT1k3EgE4iFKUT7lMLw1SGirGveLeIaNXzqXlYs6n2j0GC7t4ifSLgANBUUTJ5w3DjpARYMsWRoGQzD6fDiqzI43muMFxOBeYwDUbpbTWRlt5Ts3E3eG5TUsVvanPFHNgmC50jaepRc0AqFrqF698jcNWFUWCH/+VsqBdW97poB3gsRjpKMMA4HRqKw3rHBYdOPpgk7Recm7TEmx/T/+1LEtgIKSJVTLCRswUiLqzWUjLjjCHZiQzLvO24UZZVVShEv+TVLijAdKQEnbUqYS/KEQ8JlnzSV2lNqCKrksAQG9ORpyAkGnCUG84d1ghdVx4hBVpc+DYQCKgSmkI2Dh7c8ogPd5Kutjw6OAxVwZVAoICMHBicip8ipgQeI2NvYMJCoMMhTSglqe0qp/1PoAQFNqUYBDgQQcQQ0voN40CmLf1Cl1y9U7EY89J8ql/iOTQnKrwgSugsQrvus3sjSy5pUNEIxP5DHFtKcVQsoL//7UsTBgAo0SWumGSjxRo8pCbykMHLmwlOIcqSob/ahQoq42y2PAICq7psiBwCrDKStrpd+WPBCIagc0SDUP+pgnB0ZLjCWu+OXWNEqQniEjLgEg4WEZwaYgZIWUUrxaIlYvFJX6EAUmTcgg3nI95QfUcFwfC7mjWlGymB0g4tDALNFZCQHDGIMXgL+KBmKiWyAxCBiXKAtSaw69BUZvWlmoJDksob8GJiOpEDAQwKNggvk/nFVmuYC+ICAZjgrrdtx5tw0T0V0H1rzVFb1T24g//tQxM2ACdihYSekazFBCapprCQk1hnD8Om/dyMMAQcdV379PDbuQasO0+N28/6WAwsmAwGP5iwQZZiNlYZhO0ygAhn+97v9uZniEMbvbY0Zr3e1m9+2Hky6QXn4/PQJAADru33uwgBcsZ5LZhx5CvtcSbq9VksqkUYn4umYNJdhBouTD68WKwI5UHuLBZcUSwr8e6HbSSQQiMCXKqrWUJTOWsK3YmgkykTiEKFJUZC3yq00G9tZy7I0uxOzfK5RTKtRPFc5rTlCrXMzCr0g9f/7UsTbgAoglVUnpG6xSAqrZZMlbvt9YzMyz5ex3MaALAcCVnyCQ04UKBQSkewxE+B3FBcOPm3arFU11SAAAOXgEaEMXjFem+nW16ji4lgB1Gmarwtx1GEEqU5ehOyJicgSVNoXHTJK+RMIoWJCL12Pn6kzHldwFVgUYeQLFn8RFp7vnWLUVIktfUXKoAKcsoonDuQk8YmEdAKqGW0x8Q4FbN2TWqLW6uqbiEt4VPpMA9sO9zMJsYZjPZoZK1PO82bD2J3DyYOO79h+oYWSuTym//tSxOgAFF0tTmzgz+pdIC11h48cv//lz/nAzKHK1QCJtvx3JE8x5QGVhdHo6ViSc4Cla4sJtc3tYTFuA5g6zlO2yPdedtPdTn/yiwBj6SEK9QgYhBGUDCiAcUtmU1M2BArNG2ICTK7CQ5hxilMXkwgzYII6pk126vXUoSV7hFvMm42j0oemj+kDaNdb+TLd/ahCEobC5OJ7Y2SC4Qz/xvZ9JmMRIAJF44SJezKO0EETqx6YLWE0IFAMYNJgGNjqLrTV1nUjncX3ZC3Zzf7UUpT/+1LEqIAJzI1m56RwgT+VrejAjkqoxlto2ssolwZBqoJHjSHip0NGypZYKig+JYrmnqPFskh5vQtbb/R//uUiwMK23xyuuCGeoksDKc48TRTCiUbPIqXLyUmHM1KflZ5Q6GpCrgE86xAs0LAo9h5vw05gZW5AdFi2YCBIqdM6eTvJCbfdRa5CN/bFn6a9QiJLYtwxUs+/hCg+ThhRtmDtm2TDlfz1Zv4ugtGt1mhSXEQXkaku6ybBR14NzKB44CFDcqOualwiEtCBKD33oVZnff/7UsS3ARDBm2RniTNJVhQrVZSJKGkQRntex4NLUubWpoXecizOv0IAUGF2u71tuqPkT3QQOn2huy4qnd4zuQgjIRjlPdhXldnaLFzTtEBUrkhLv/jwi08dCc5QwYPQcKu0Y+nEZBaFv62BGhro6+y5O7b8jfBX+kNxgAwg6xFFcDmfFV0rbmIhQSnGU2EsjCidZ87ErBPGEtLwrEh4O8IuVc8l3uZ4fRDJ3VQqQxZuq2JQpDpwRf53T3MFVJrUvbd2LonA10NVz1UpxIEshyBb//tSxKcACmhJVsy8w0FFi2mFnAw4FgYmFBViDSZpAG7S3aOVMmgdtm064CCB4iq5vK2yoyux+JRPmUySLZqXLok6sjv0XWt4ykmjikv2dcUkwYB5DUr5r0/u79Cdbx6QBAGm9v/7dsNEbqsFpsYidP9CZkvPANCdJxdoMgsLkyCjQGCHpAnBoibV3IXSzMz9v703JCJbnb290/JyNozJ1b9NHkjuoZ6LWGxTnPl03+spRMFMqAnAIMCLPS+TTj9RNLS8PDoBq0aQjxJ3pBDaluX/+1LEsoAKCGNhrDBpYUOSKo2HjRzBNMMUdQfGlqD8+Ec/LtGFHOlFszMFopC6Ghc2KvIC+rq0MGPORuLxDTbpfAF/rACJRcl/SuuS8vR5VR0qEJGwD5IdkuHdESOWAmzA5Q6EUtPMK0nAR9R5b6xaAEiuJ0PY9YZL0rHk+1FZAp0pqroR261nq0q6rOz1q6EADDim3E5WwB+JKKupiIcRUDgXyGXVaOhDD2RaOckhDWhokxHI8FBUPPWUcJIYEhMUMSC9axOEZJAfEmjcj9y7Xv/7UsS/gAowq1JsGE8hQh+stPGJ/GCY8C7I5s468NLTeATPTH/r0IEnEmSmVQjQMjoaK4SCNmD0wPMMAtkgcTAHR8smKqFa2VjcPDuN1UvUlqrRiVBJEoSQ/SN2Wl4l036x0eKboQ8VSIw48Od2snR/X6kMahX/KzX9ulUIAQIKMRjaUTLIE+WtnawEBj6y2XpR+XSzlktZvSZG69Tf1ozk0LBMkIpdorC5psE5hlVpn3G893PuYBhwVAoqYWVywoLKe0Wt9ebtqWEhC08ntdSp//tSxMyACfirVmywaqEwCy0w9I0mdy3NW3QsgN/6AACYKJFN6SxJ9JZWxnRMbBFlgLTmtMxeu6omg6oM9UVwglwU4lldyWJGsIGsMrl/M76IpfOlc3Xu7ERGGUAvacb3ekVcBsdQ7+iPbS9LXI1ROoGbyyUSNCvehQCPcbNLo4k8FIDHNMD0yBpyigDqL8EpOYXp6JZMNOSIVgAE+XAA0fTOLiKeFckv1iiKhn3d9Jl6mZVnP2Ri1BvUdFEDLjN8VYrvkTNyZ6aZCQTA/dqcuF3/+1LE3IIKXEFXTLzFAVGP6umWDXiKr3ixNjLLmgAwYqySJspYF0SsaYOlWl0KoQEnhzDYihow0YgJ3AVFAhagnIScE0JIat3TSaWdnPLc23pS5l9ptBiIMDBxpEmqoAESD7kPjJoRgesusSlrf/ucAwRjAAOepwxSNT2KAIagjksiRKrGg6TTCIs0zl6Gnw/HWlQI6buvbQyfTinHa6Gz6nqxvSMlNKu3ccAAiY8AQCGgETA6haQ2IWpLvFwEVRFHsJIKLd4us4eUJCPX/7lWrP/7UsTmgAvIb0rNZSHBaRRsPYMNzKD1NNs9IAFVk8ucsbnUwBmMBLJ5BwxnPB0iPkSK+hB5DWOjL/SVBSou1mW+Tl33bea4O5v9DXYpStnfC2qaxDhRTIKOCgeQLPuDu2qQi0DHoTKl3dKZLShqjgdRLgq4YIn6mLoG6wGWKHJftJJdAZhI9JWWA2jM/fRwr6d93jCG04Ybqa5+o5yQlTQEI4xBQwGhEvOHPkAcnxAjy2P5GmUgSgsDCEiUYy4YK0rQWDYMpB9rljTqfYlyyJ0N//tSxOgAC/ynX6eYbqF8lCu09Q2ElSkeONNq29igSYqnK5a2mwuxrnviGlaG0fphkpK4/Qf5P2o8aFEnholrQJjVe8X0+iWyMpFc+ojNI4OOsSffhfnevg1ShzzZYvhX+71Ne7n4A0NaKpyg/b5tO/LlFV3/+gAoIC4r645AVVUfiZ8XIccWDaQkKls4iMivnghaFrpK7uoMOB4OCmqyViI34nESH78bBCehR5DcrXqRbfRw7CQaAnBYdN6Sj5XfLSzQ8mWBt9ipXcFr/6BNrj//+1LE5oALTH1frAyvIYKUK/T2CaT8n77dAAQ4JxIJIlnnBLC1YO0uKZRU2ok/edoQVPU0ANDT5ZmLZqa3uorKE7RNH0KHGuoUhrtrcbtmr+vZn36xvyGKLjdjq91WVZWutJkX0ql8zrMnrxFW4iLGX0OFHuDTKul+ltYsAAA1OVkkssZmZqYBQu0j4BW3VT0R4SjiC/W3eKkUbU2stmpwAg409ZJ/9tnUe5vnUNuY9iuRqnXciauYUAJfMBIEBEh1fcQA58MCmTWcfyTkwuXROf/7UsTnAAvQn12sMGyhYhTtdPQN11Ovwfp1nwffOfY82AASQYUnEkkzPCQEgSGxlC+clRCldQH8aCsay+hMe8q2Ez/wBc4738p1G3xGfJPesZjScKMILL3eFwu/72CD9ZlGcElQxYViuBPakzbKyetKIlDBOu/IIYEZOsSQnEnDgoRivFor4IBITp+eLmiddKxADAmHROcQHSIq0et7KlvgovuLtrwTSYhNGdRK129wQpx7mgAOUlDdrI1K9K6UxVmUDwlvIOf6imbD4Q9YlkC///tSxOmAC+CnVaygT2mLlGkpphoM97PueeX54c7+Tt1o3ACjQQheCmJlC80QgRr7JLMg8uvfdgP/n217ET9MYdpyQwcs/zGhwLGLrtmL3rk6QbpAQI8IFIuab9VXnd7Nq4Qvyn/7/v+GZ/kfDb8NqV7UMd0ipONokjZnVjRdqntqEolk0cZLlJ5pvL8SWusAWCCbjABUtFuIGtdliFQNazSYmUJPIdiu67DrcmpRvW6B6Rad/SqqmTTMnZUsbhvC+QmSM1FJ6a1vBZXA00u46av/+1LE5oAMFINRTLCu4k2xbLTxpm8cIiUcLTl09XrT4/KxKKjxdAyfQ17fvv0jdubLqnb9ttfcyi+nMnniYGZyXMZ+t67OugAOiAQS0kmquAhgfCOqUgYjMLMJIksFRNSzHmzhiHb6gR71re8XetaCEJ2iJrGhSfOaCFZOCTQQxWqyODDYVpL6k875N7IYhLkLnhP9HntfIpaS8IGywuUJkYpzqBgAIgEEpO45DDxE4YH9DMNGhKdzVo8WCUywrpRkxY6wdjLZ6GczUzZCJUQi1v/7UsTKgBLlU2WsMTipzZdrqYexOFIxRlh8yZkDLggcNyKajBVsgiTixBIXDRlq1P7KDbtfU0r4kDuIgpRVEDJ4R2dt/rG7z4L4f7NFLgZUc5lamxtDQQpQn9lt3JwYrWWs5DUgtqn0McJSL+mHGA8ekSQipkGqZEaiKWO3PFnpxhd751F0pNCMaMAbF6R6dA4I3kXxWmjtAAIFTRRKJLhA4GzAPGiSRDuDqzkGTLP6p+GHngln+knqp4X1Js5fGfH4Y9Gu3Mdj86aWyiTM7hQm//tSxKMAC6FhYaeEV8FUj2qJhI2IRNOFyihdjyq0ngunBb8UaxWs54JhG92k6/vM3udbedOVLWeJqgAGAzSykSSoQsRVSCnI0BQB6ntW0KM1LmaWj96jJssV7KBhkFLwzWUW7M1qBBV6texRKEiy3OqW0khYZJBDI2uP0VaL1i5rsv33/6s06Mh2S8ku1wABatONFOkKCf5sGgPjBaUWgx1wZS6bnKzsVrIQq5GAFtVNwYtyO0uwiBDrmphjY5eMUcvPEGRF0AqEQPLgEA3MPRn/+1LEp4ALQHVt56RqoXSPavWGDWCrpija5FbdlaF/X9axhtt6FTp32SSiUZCEx3ycTTYH7SbB27btw4ggfMhJjNcVkymgU0zkVlXiQqEAXERpp9xiwsXerFHb7CsKql18ZWu4dpX4JBTXOSqzi3CdICc+GerZddUAAiEHC5UiXac56ZyixF0wAgkXbeeINQafsUFF8b0rP6I7mKnu/3mE0G3K5WAUGosNJAqKAcrmtIHDygI6xD3i7dbzS2FejBTn9KZxi0rJX/xWx/9SAGZkq//7UsSpgAqEdVesPEcBWw/qqYSNiBJKBAs7xREHOvojuAQaZ5asOypWWFdSARHR/W+wYE9UoaaO7gcSeMNFw6bHsaBhycitNCGnkptNSKLcyFHjLNlTxa1QxQ1kekqQUeqAKZ5+pYT/RCAolRxhRRHiwYDENAiTdOODlZd8Y6TNBx51b7fPWokmpdWxx4gJDXUHgoMqqNG4MGEFiBCVDgaCDXz4569rJBCK0KHVg8tL8r3PBEryFqUqzshQEuC4IwE80rt7kqEckt4m0lEqm639//tSxLIACeQ3TmxlIUFSC+r1h5kMqmcexHRx2OciVMout5FmoddJLHvVb/bXfRb//99OT+9UyvCNbCKE/+nz92LTsV58OGRRTpoj+wMX2IeIHCjlmOSPwdEdHxaRlnSVe7gScLlbKMJAgBMWOSi3hhUgs8xiHYTkIAiOp+ZOXWJ5P7dCbnn6+c7vawZL1AqplAxa2JnXCrVzNlJYlbo09y2XU8btlk//LJhUTGnBQXasZo11ADf/QAk3OPxzFbQEr5sh2co5nGMbKAO2ThECxij/+1LEvgAKCF1VTJhsYUcL66WHmN4MZaC9lO2j7368smHKu3n9h21YobgLR6cBAmBiZAW1ynGzferh+q2a977FlEyAezr/vRo93vBkkScCu7dTCHaGpqa4CaE7UkD6clV+kvWah28qS8x1XsnZndtW8Oasf6zoYhULD8kF1UenxachKQnicU0zLryhe4Sy4htQJ2IbOvU0BFCfyrN5Omv/nzSc+wnU6dhH/5Gpk9NIDDCDMQHmgdhiOiwOEZEOIg37v+DCpq7+tQAZG0HI5KwmCf/7UsTLAg1da0pNCHHJRgordYYI9NQWis2B5WNCujLY9EYYjMkgauUSBw+pZMVzAmd7guobgyNm2jMZf0Wu3/BJkMCQNdCQcuWP9pAzpqE3/RVw6tImk3EgeBMyoKlQBKlKxo0WaGIJqpUK3HiSOjNfdRwWYNRiUPTVVimIOEFgcIs131Th0KAcBNSP0HUTaTSCclkLLlWNC7XnHNq97dOfdOPc6s2wQx6hRb0j9P/aAJ2JjaLBgfRndwOSerFuXPp5xg7eQF2NySBdhgqCBZmP//tSxMqCClCNUs3kxcH0LCvNlg38MpWcjIEM0951Z0/clWdzZzF3X17FZWr7tzXuMGDE5mLb0VqSEBi6tSELoW962U32enU5Ialk99tsbSUL1MY7uOZ44oTgji67KoaSAV6S3oWVVme0Sgc0BlvgZ1hNqD4JBMXMoGogDQg+JibsllnLtjDqmvWc9rVVOcp5CoWOtWoa81N2KIr01QAAHcRAAJNarxkbDTm2QrNW4MZbWbZnGHvkksgrkUxisQTOuBn2uM5mZsfQ9e/BAaYAgWf/+1LEwIAKUIFlrJhs4UWHqlm8mDADVCSB8mzhgqYGqHvVZ1Pd/Z8YhQ5Rmtwi29egAAIVyTRxJPGV5P+xNaqzTECUup2SQSgzaoNJ0CL8n0SGV7zdsGyQKRgQ7A3YUdRUXLNeaUwJJWmyWA4VGPk11UV//7FpSl3GTPUDbzhKSHgB7yqVWgGjB7stGYkBIkMTM/DhYshuLsGTIaE+kwhOi8WzsZqrlvSOPLuDHdoEZ2a83moTcjtqz92JQ1nfNKS/dhQX7AsOTIWZfQIKkq/N0//7UsTMgAqMy1KuYEGBTwkvtPMJXgz1dgAAGAGkHNq2nIIvi340Q+bEh5FHOFS9W0LrJmSGckR1cZ0kmKsOjHluFfPMPnZbPRxRZqTqV75t80rl2c/9OVzUxDI6mGM4eLxV3GUtf/+M/v334Er0EmEcd9fajPM/igAButbSBbAMMKni6LWxAMFgQGGUUsVUbtJq04yzby3Q4U6gFS4pB3eV+pcQ9HS+MtWeiXOJa9utDXznViqmipIWySgjN6ZWeZtK5v0XbLJTellcBcCgkRjU//tSxNYACfhbU03kYYFPCyt1pgzgggsTi6U0O0mE02iU4bJx0kGICZABlEBogVRclp7IFYKGmky/8YjI+NlBMxCKA4e36d1b19si3UyMqP2cy/9e/tZ9W5bOmvov0+rqRyESppHZ0z6vZ2RkQ7dBj2p+Ux1MSRCd2V2IejOwTDIjuNVVAADmk+/+rcpcFbSo2cgnsPllVxCTl7WFplISaSoxtakfbAD9sDYIR9tuzlC55VJPAuKi884ktaaxd5J7oacdfOsZ88+otiudT+A3i87/+1LE4gAJ5LtOTZhOwX0Xq32WDSWWTZ6LnesNgAEmzy7fauZEdCJINfwitHmkEsvpkiG37H+QE+kvvbfKrvKNsIutyBL4MSYQTO78ynSy3XMRCP7pVQd3olE0uqJ3tTT7bOoSWAIBPBcXX/Zx9WRpKsvlwVKoSXvEnQpAI70o3AShDQOomx5FaO0Q5gO0KYOUUtvuf53lNOvM1cJLeAbE3EvJClfc7eMC3j5mW18CxxD6HuTs01u+znE0ZJVezs+FY4NjInBbArBdwAOA5mWoNf/7UsToggwVJVNNGE8hmjDp6ZMJ2SIYoE4nBXAwCxGgZ5BzjYmAviEKpkUEDWI0USOLh/sptU2lX59SratSx1PZ6VADiRtjKmTbeyVuqKMFxMRrPEu93ZPVo4cfvO4wlgKmPN4pM7GDYKAykbsTS2Vi2dcWVxzVhc0tbMicBcel5IFxKH8lWJpwPJSHIyI61pDu7l6rT29d9Zy1EqxwZZrwsN6oj33izhORWfGi7wfemMGBjZWu56GPMwAAjE1GQBLfE2Qr1fwlUpY1rOC2AuXA//tSxOKACoRVYaw9BWF5Gyu1lApk120/UtisZ7L/xx5SddCcRoykrHEN5n/9EDFDV3je43/nJE5uCCmg37PsxDFe3JqTPbocqdlZfTw/eYQstO3/fMYsND/tBkhD+HMtCjAjHsxAhZiDmZUp2q6yyf1yEOxu9vyl9nUwgk4nQ5BAG4Kofp26dEAdpe0ccIMgpWOAwcOmlgly2RSgyM/yv3jXOGu35/GqqsOP7dWoYOHiXyM6FDR1tBLIopaSix7T2T0cx1S1zxYJSx486e+lAAD/+1LE5wAQYMVhR7HvMd+XrCmBseQFRLiISDkbLwLVfAQ7BZEbqxNhRC4PoD4WYmRuzvjrxJgMt0EyBYDCUsDyBVhJMNE223TSZVReaQhfG7WOMGFO//9QvHBYWKLGPuKuzzHfIgAhDSWSIolODBoRDOASTFASK6zoaDhNKL9mGrhY1I2C0eRcFO7Dcnf3R+B0ucLBUaC41qwRWCo3mShCxtIsIwyWa8UKzpFDCKtP1Ix2s6KtSlP/oQAABM5pI2k61RFwmM7JB0X0wq2+CmCF1v/7UsTHgg8xo2OsBNOBXRSsdPYNkNy+OY1ocEcszfjpuS3wsVAk7YnTIgb21/7EWPfZi8+e6kQkINBkMpSkybFDZtqGrFFPjaT6QMKMW/ycjQpidOs2vWXJpZEo0QLDvKDARBRpDWIJ7iMzEXvklEusHUntglVmy0KKPSdDnaBdnd2ibdQllfRlnylD//aLC41L84eDF3giZGkuSGK++iJSyzsotJFCv+psIJx22SJpICCH6FWR4ph9ixPYCLVK0vOJSoWNroBaIQBpB7OC6yCL//tSxL0ACjw9V6w8pwFPiOt1l7CkPOARJwlG1ZkXQiyqAHa1AkXe1drNy8PwTKBhbxOBmCd5vWYbGd3JggFrf775xOWCET04H2Eck6DJlS43RhM21ggx+B0yRw5n72Jck0Jh+DHwhAgUZS8cIDoiAyip0PpN2vPnuQrUL0mHd+1qxY49xVWPubFA7O+6MGnf9KdqAAKexlNONhTLTcKX6ATg+kelDoQEY4tKTS6EIgiYW1XgxZhtJE7+aO81537RQCEICKULGWP51qErKMbFgVP/+1LEyAJLTJlbrDxpYUaVqvWGDaQmn2REy+e0yolcLfouWoX+7i//qXUqJN2PvQ8ESq6YvKhzYP9lgyoPWXh5ON4F6M8bSQWW2+lyuMTt6sfDyAm1TAIFwUGg+HDgTclSlNewSBhZplQcPqevmbz+61XVSqpHV/rA1RyiAACNed1bRbslYOumLFiVy2zxt6U7YjMbnWqgUODh5G2rmIsKX8lkuSZYaIBEAB5uoAlM8//csntOvL6kQsDXV7c/BSwcif/hxU7F2gPtLxG7uo0LL//7UsTQAAnkSW2nlQ4xWgjr9YegtDYsnL9lnOqpnSyhv9b92qF8TP3v6e7ADMqBqOmfwcpz+mg2f4pWQr5dAUCYNGYNnFALTF92J7WyRDmeH48mjfn0lCBmFy6ajgDtYwVHhzZUVUAlKZ/+XzbvizutOoYGCEoeau8w0esAAxNu61pInPSrsaHiKCQqGZYuCQCC4pYLZfOx3JA6IZ+vfPqGD1IFihG+GrR6cLmc5BxbyXqQ0HSHoy6vsyPKq9nrDvaAGB7T8BrUKBhO96tG0TiZ//tSxNsCCjhNUUzhhMFMB6kZneBAHrvQ5Rgh/F0OalMk4dzZIPcIlCsWZvAgFTPVAVL22Gcg41gjP6RMsRBRRedgdTltsGD0QW6uwSC5k45qK0yyyOaloJCUYKAM9OB/KGBxs4OlKxwJiYABgMAAIg+OrB8PlMQHP/ULJkhQsyMraKrsvYxwEiQ0WuTGlTESyyME3faVHYXn97U1c17nLp572EWYFyVZE01Hzdc5wduNG7WlBYYihVL3r4xuiZqM6dqiuS1RZZNG8YVmhkijqYz/+1LE5oANaJ1brKxs6UMMadmUjcg+KgdQQ0HkNGtYQ6KRk38dfCJIlKwrc8o/+z/oEAC6kALg0ubGVujJykO22j6qCZbQc7b4iQjnk+DlsZP7Sw9GkMilMjY/csqFrAMCoQTQlA+JTB4KjH8KnY4shR6aZ1fY9u7F9hpNzr7PpZ9NIBQJblSAO1j4PF+WaHtqAcUGYOfte0s/bdtlxSHn0pAyYanJ62z0kbUsifril5COJmFc1/e5vUGitYEbp9gs/daL4aucNIWPeZeecMbHtf/7UsTmgA1wd2GsMeXhVgtrFZYZSGvbIg/9yAGZJ7iYHGJ6PVIPGQ9TtS8GOXcuj2LZtsrqXYnrtAfeB2i2ji8KdSMnq4Uwgrtte2zUexqoaf7FodvR2MrGWpWMZnqnfZvZ13Wb2ffSiev926KFKiWmtPph/One431eKgBADJY6mSUtCBuCbqAqDZOQg8E/Hxt+dOJ5kvyVqzSOd+udfviNUXOTbt83+nQRBhaBIsgOcvKkrlTMU3ruT+hXVNnu1UVUoqWd2cqUugM1nuzfekun//tSxOQADYEVVgwkccFCjmulgw2Qs9yH99rZSHuJMyBiw9idfbtJL/WXAMCAUY6yBEJPtPQqZAr55CgaiUCYQTD0iFxwg+YC+mxLPrKUgaPYCEBjawMD5suB0hhNjdoYM7hehiqtE2qg69IGrR2VagoPhzG8g4uoTPp+uoQynZG420koh0NaVd1HQN4kOrqw1rCNaMBJbAMgYfvRMVLdVPrQMHCrGWCiwReuS0lqHZe0K0NQxEIlCQaO+rHPCdzjzzRBIhniKgoIxj7bAkkNV7X/+1LE44AKHOdrh4RVcY0rrGTxil9+qeYElHW+lwABAqkTjjkgDuFkAxmGA+wKpkmIkw6B9JZsWCowWCSzLZVhuOTQe1rjCmPtWMKavZgQ8PYYWU878ZHEAzCHKQ4JuufT+4DHleqtzukrU6x/b59y/+/Qd78v/qhF1b9VQDSUTf//etgGrb3TR5qyUFjCizxUcSqtzAUfHua6bKudSPM9oFVz0dryrSOWH5kfDnxspSRvK91O2r5S3KOSmXfNYcgtDmNVcUKhKHQ6L3py5cKnVP/7UsTnAA1hbWGnmE+pRgeqXZYZSCUaARj23VgAADROIpouAlAXINlFYDYExhEcDnOIOMujyEohXFWH4wNZDHGcs0EeCRQOTwzf7Lwt65J29bv3NKT5MHOiNzEKWP050/vYi8V09Vfqvxfdu1w05CV///L5fd39j3TH43rVAfzgNJzAdZEkRCglYy3CKgDnz6Lqqziu9WU3JAQreM2yUsgUst/OMH0R+0v4M8R4Hl2vMzGHjeSEkb//n6buVnynVWIRhzesl933/lPPJC5IXlPf//tSxOaAC6SLb6ywZ3F5Eas08w4V8sj/L68fpwAGBhGMxQY44NdG5c5a+/QJzMrJBjgINOcVKGgihWUrehp+nFa1KYxA9G/ONahmmGu9ZdV7nvlm+Rhu79MMiEPJUKgRPUeSQfeR4mQ2DwQN9RBayaNRBDIJhgkQRFb0CBg4yK6gu3mnoRjnRmf8DOAQT3EIzihd5/nBYq0oVKvcYWRTA7kCokDwMgyADjP3lOg7xgnMB8BHI2iNKCixeJwWVq+WrHYBgZg7hQ51phJ6SuTSRGb/+1LE5oALdN9pjCRs8YKOKjWHmK1EGn0ZKQNCmgOPuRGlCIlPLTjGE3o0NVTvd08MuWPx8kxQPIwJNNGli5xeOFuqjcnGpQiwzOE8yXnvv5/5/sFiY+cZP+Y6QcFiPz3f/P2f3/zkEkm1msdriTrAMR5LxOWMhk8ZUCo2kFSwnWk14GHy3XXZhRMTdXP2Q784TSexPiJDnf8qT+yghZWzswqDVI/3EK/lTV40J1NP02xZVBYF8b7dcDoCXW3I2UXDIuDtAxYM65qAsdRqXjodmv/7UsTmAgzpOU7MsG0iExjsdZSLFCxoekI35RMEixK4YmUTFIPQWHAXjtwr+3adBMcQKEXmkhYOprfZD759zak62CZVmNX6lp2b7SVazyCO/UaDSbdlscjZKYXK7q/nfA8FDoQgIgdjXGVA1kHxxamtUgy6z85Vv/9dZ9eJFUqbLNtV+xoyZap9v1xjVqf2IVsPKWp+lQSQjpIy5Z50LkoTe3ylAhM2WmeNtbU5zNlZ4QHkQ8jgS7D2IJGpYTlZRMZRa9caiphiPlJV2IGcKCbQ//tSxM4ADsDxVi3hIYlKl/D0xIzuCFjKiLcBKe8NGIxcOKUdC6d//c1G56ddxHZs8SNQ2mTjwy20AAVRXa23/tkvC+DSmgyxgIjsbmZNGp5yMQ4Rdeyui9Xa8m8IyQfzFWle5WGk+oIUchYRlGe4XRuUQPW26zeQCaFGlPnl1dKrjCE1tc7QGqvZSg1G7btLbI3ACNvSaR0geBvoqx8JJ03M5bHNs+XDFvukCVr1f3a6uEokDU5XP52wjpPxiNp8+y3NSV0lfkV7aOW3/10T9Mv/+1LEx4AKiHVfTTBjQUWXrvWEjG5y319PSQUg2eR3mi+BAIJSP/toMyZuie6eSQR2QwOQPp+Tox3w97BzXplbqtC1M1hyZHBjRlSKAYewPCaRzp8cKiIRDwmMIg4n2/w4KsegcOF3iI8qNWPOMrQYAAKSjO81cEBI4qNYxlVZgKwFQBY6gAADcZVoLo6p5KhcJKOpIHBKNWqYmzZ0SGGUn+k+u8mJHenK7fNJYEOFacTqOiaTrwpZjvM2v8zv5zS3yO+ptW2iX/uz+i9O/363Qv/7UsTSgAoYX2vsMGHhR47tPZYMfM1vL3dLop2WSQ414wgkMbJqcCwODSIfTJoPA30po4amYardq2aF5aaPqXD21d/wI1ZJpaSz69tXx76pOyKWPRSMlnE0HE5y9koLMeasbHNUKdeev3NumWIcFVl8YWJ7IuFSq/I4qNSMs0qbQO1MNiMiHQ2QMEZsQH8STaYn4VXvVF3sQulZMLpYgTRyQX/4TfDPOsydQiTlDzdwGoBurRUAEACSNwlBwHOarcptIIcTClbpSVrS8JzpDKo5//tSxN8ACk0rd6eMVTk6iiyxlgh+VEXaykm8pRVHczFCkulWb5XLNbzGdWdaF6d6J1uiW/Jtc52b3/zr9b8863pFA7pC6QOL3LJgAL/XSMAhgXGLR/4PTkMEg1vqW3CkwaUcYo17TUhbr3St5yNJFZks/hciIB7WNW0AjlBM6VGnUCU62vwVBWJRflW1Iik1LA0Bg00RB2W3QVcqBLaUsrcjacBvsQ8FXHQRMizM8rQ76G5mNCHWgMrlm7bDLNm1nVdndCgi34fV3PQEIUWwRSz/+1LE7IIMqF9CbmkhimyrKmmnpjxcZFxy6npTF5Dd9kuMNkGWjHJ3PEOQexqQglZcABa6pRQxkDxEwGWPq3kddaQMaINhYMDW4qwkHo4ynlAEnCikGqMQibrggeTy5e2hD4sAyzJhCkP7EqqTeaSpF88cQ4gcuL3vE6hUP3lIfQiXXQBT85IQycKohCCXAs2/kabsmO5DE5PTO86FLRWasbh+YkFakAwBKThw5msBBBpcIBmm7/u5tFAxeCSQIIQjxco6AxcdwOJReaCEd++haf/7UMTKAAotJVmspErhQwwr5YYYNuiVEL//3w8mmYoxV+24OPPqIyEO166cSemQpr2H2Hyz2y2jptGfnpoD8VRyjj+ED4Bm2Gc/QGWZeKiFnDnOgnpQgEb9dqkguUefqfdLsyRbhgkYOkJjZC8Q0qFtGkDWn2UCELUYFVTGz0kSAcI0ZGvpKNUathek5EdSTNKopHiNpYy0pcT7JtgkiKFG2URnCA9lqSYxPYTkePqo1XpYlEigvsqzIfKmvPYXTqu3LriOdtZbO3u5VK/7iU7/+1LE1gAKGHlpp7BJcUeP6yWEjSYjQBzawXi3b2I+3LsCZAILyUACy6hViBIWdyRZU5ERAQHtwE4iS4SSUfZ3KQkOmR5ylg1XjZzpHmxz14R3sGewyllTBBWZNTBKONv2O9u9qyB0ImsAPawVogEYu3VflbdAABwAAKJIkA580uVAAw98nfWMvhm9fF4a05YJGZWf4dmCcuwzoLhgj7UMjzqTfKrRMNm3Qc1ql2ZDu1mbZm78peJAIKMBrWnZko0ZdFfzvpUAA9pgQcvOXzDiK//7UsTigw/FZ0xMjNPCY6qpxZeksWDp0bViPteIBtVW8V1QcJhDiodu89E6mtRCfYaMbdpmR3hqWpZcvM8+yTIzv2HLdoMbq2VONpJod9uzPX73Mrs+NFb9lw7SBImmQinUQTokHAWa0t1heTwqUCOWnXhzsJdll66uk7hcY5QlmDi1hBhcumQUjJR1z0vDZVIduGrCJV0UXI3KIWqyS7jZVs8Sa6qU7xjBQ9foAAPCVFbcM3uAVCsGCpILXY8zGyQRHSRVqzJGH0lwt+oUUk5w//tSxLUAClSVXyeYaME/m6phgYn4xijI+3Szk05+tBX6qcwoecOSmLwOJktMlYdKi9LFGC+zhdFN79auwWIWsed2TzAEBxYpucg7ES6BIzOC1cAkpRgjocJp9JpLJxWgT5oiYNk4mFowrD1PU22BBnHMquaFTlcsK5QHAZOiUJUpKhphK5WJSFeMj7NNSO72FSAs8iZ1KgAAFG4o403Atg8IRGZ0D+LQ9nafKE/3G8UnMhtORADNDSxJ7NpN3vHX9mDCwdAla3hcwTHzYvKCoHH/+1LEwYIKPLdRLDBqgUSGanWGJJhji9civPhp7RIVtL8GwIQv7bw+ifRHCMBGwRmOWJJmglBQgUmtMtCYNJPvvDeSQxAMgTEwcoRlpTu1ybIytW4wTaUg1n7H7eqlE2W5JubluL2mcA4kULNduGmllIhccY733ibsW/OS01UAA0ABqwVUGysiUgQU4ZGiAUTwJlA5ReCD5beWiKgoOqJPPwT1Gqyqad/VUglbmt+/ma1nN5a3rviIuVXpUmdBaBZqdoe1LRqYro2b3/XS49ACAv/7UsTOAgpEgUssmG5BTBBomZSN0CoyxEYugEkCDzJbg4xh3VSlGH0ETLIbo2ZAsCLmpj5Y3DGcJcDGi0wseoL6RClpZmSC6dNpRtvZjiVT7l8Q+EsO5tzKT2Mun53PLTKvox3Nf8/PUz+h+niSEgGdBaMar/UqAAbZaZYaMYZsFbdlcNqxZUjLGJy2Pw++NM5/R3BiRA/yT7mV4csx1OVTQPIuv+DtedJBslxKLn1b73T7nc7I9nnn1FxnOu15p7341s7+5CPozm5x5ZX/ctni//tSxNkCCgRVVaw8w2FJEGhFrCRgHBRwD/bdcowkDS4pjIZXNbr9uJwABQQrAz1czNFFFPNma7FF8hQlppd9BkWDLQN4n+14BMVgB4xsLWH1an8CQ2JQAwTIOIuBQy+fi9ywRmN2KBRuORifi99dF61y7L2QzGpRNyF/8NXrV2et3NP4pyoJFJ2H+2a1XHt/k5r8P+bZ3DaYb6y5xKb8/z/vdau/h2phnSOvSRuhjfY3le/////////nP////mJzDqwAvWQAAAKct+wWqNMiy4T/+1LE5YIJ8JVHLWFhQZKmKOmWDZS0cuqTNQ6iWI5EP50qZgwSls9iX6/e6myVM2XI3VzrebaZtVjvr+/+bB8cfsWrlVeK3Lw5abWycryj4uj36OUr3TV+rDc7uy+w5S1oKSs+lOvZY5m3X26m3+/yvfvN7FtwvoUS5xZ3iWW1h5EdriYI6u33YcO3xxhowE8XqOQwHl0V2N0tAoFJJJ0PlRMCLAyFT4ApQESInZUPup+xyMa75+ozC7s60AfuR5q3Rl3nKRjaHRfz7pZJvXOQtP/7UsTpAAwstVU1hYA6nSXudzOCQ1dzZEJX07d/zT8qe7HlT+Kjm5uDakLduXVxai0B7hBw1+BHevULMnQjgMEAp1rM3ASDIUi9KdSFtkyIUUU4BabI9mlSiKidAgkKCKUjptGfus+qRtMq3nPGcljUv/9pdDO3V1W9WV5u5DIcSsbzv/I7Z2lESu54NCMaEwSDp0jxY81CIUHgagFZbXyRiMbNB+EuoyUvJrReS1M1JgdqkKIAqFHZlrbV32/hfZbvxL29IzuX5Kf5/y+v/woZ//tSxMKAEeVXb1z2ABGbszA0kI6v5dfjgqi1SSUgkzTJbWzoZcUQxpXRpuI6d+kAQKDXAJDGOcwBeGZCCSqc0F508cnqcl0S6ZQHnkwgSojsCUSlrLnUn/WlddVOdTWZtgerO1QoA42L/hIRtDSnh6ZRansf66WW0KPvSQ299v/QAaTpaNClWGsrt/4cHSUjpSIAigDKgiS8dIe9J+F5t+kFAQ7x7nYaqVm/RZVAFaJhKeB1bEjF6G21MAUff+r00BlA9wQQGEyzSXXM5702qiH/+1LEpYAK8N9zp4xPoUYabKT2DDwsBwgpRAxr6GDgM5Cpq2ElH3V5FWygoSH4CgKICMSkt6scOkBeElizO7NrF++59Pu0lsFQAGoulnLGBZNorYx2ihjEv6xtizSMWXOvUKoEDNrJgUJARpTExFftkwlxr5eR3oAdVpBsRI2gAsrDTMF20BHLVTvj4RXZHg/eBQbErg65E4WkTrhW0CzyyhCoohTr5Nab9u65fCfWj2/66hAAFREucNS27oRp7j3pQxAtFWX03Bgir0ZHMDgXHf/7UsSvAwo8kVRHmFEBOQ2qRYSNYjhxSPhw6jmewyN0Z8vyqmTW0kiHSm+tFCAeCg8qm68GLixTvEoG/+341Kq4ypj6NNfw7qSBgEo0k6tg2MW83OOpMRlSRAlcgFRNGRKMn5oB1ybKDVZZc9YZiSI40OlsCPQARYSi7jIceOH3MDZXE7lKGNYmi+nd/N2M6RflKlYpne8AQBJshKIkGD2EXKcsCGGmWxWAPCLcUIQ9EJ5Ewowkk4KPSmENxNRzsg6sN81Ov06mlTgd3M7EEMde//tSxLyBCeiJTAykrYE8CilVnCQoKbr7CcaTSSI6aXTn9vanItP9tUYB928h7CSA5h27OogiBoSx23CK1doWhKfQBPRO8sLYZrw/Fy7Y1qTxKDFSmEwgUc33VoLnlHNgkA5QiEUVKDChENmeGIshBdTnP3FlUpG4g8P2ucqxddUAIARZBshUBvF2EE7MEKUvJaABuor36pUI5Gs8KjlhISKCGkwrCf4E95KTIAMhPAbPwyDIaCNzXDR4sK/tp02+9imjo42xH4gelxDU2YaH2Dz/+1LEywEKRI1O7DBqwTeJ6imEjRhT9YAAGExppyiAQNmnqxNpaunDael9dj0jzlsRuurUICXPDqI1m7TIanu5JcbE//GtI1L1FY+933cacb+P2bPH6bwpEYd3oOFnOeW0T5YCpEwFaSF22KSLF0FxQnYhLCwoQGiat67vqSA0Y3GkzGm043I22yAggS+1bYg5FMFyhxFowKoJDpwC6b/NGVSaWO4xGF6rpYj+CrT4Ysk7R62qG1zq8h3sS+eeFiHj0iXm2/Z7nIdFMWtAg0vRhv/7UsTZAApgi1enmG5hRIsowZeZIJZNEkJWq2JQZxvX/rb/L+7LlgiKdILG8/P3nVdeX+n/f3pHl3mFnVLV/+dfGd51/n7vjX987gPKXv///////////////HZHkRXs8eJ8xKIyBWkiUgAiRQb/xqg0z+FanyLfq5B1S14C81ZSDFm7S9dCULdKFEWQ8vBkNY9mQXJmZ0NgvXxBhjPk8dr5+9U7c+pGmfbL7nt0TE0d9rmiwtiOjqG2t11aSeNfGXrFuzDJBz6RN/1ramvmkKPL//tSxOSACmRRTSw8yIGWlKoqsGAALmtqf7+rfPp9Wp/vP9//6vYVv9/5pX//Ov67/+c6fPmFlri3+J1peeu1Kf0KACR022JE3k92IrqIBPrBrCIu4rw/DMzD0akSxKQHtZJ0nRM1v5ZqkV5PJP3ylDYIrm5a2hM8DWpD6GFzQpPkXYvnK/lL/9lPddMRodCjS0nZFPUFIIIlF1VEFOViYnx6GTKvhx+2q4lWREq4wcxhtnOGTaCtDmoYGxQ2gXmHHhx6b6kuFITeXNpbvWus2P7/+1LE5gAUcZNhuYeAGmOrKzMw8AArRZf9G6tnKIUOxxFJ9dbyCOVqBAASMDaaSdxZhSnkYB8MJkEe2IQVbCrYZiKE5vZSTXVtjG2dwcqs6ruRLWJkswgQvKPcEQImXdFHB81S9N6VLk+cSJxZS6H7sVtzvejXtpvRrrSAIHgIAAKgO8AOBghIEUDGANyqORQwbFU/LyEaPXPVzmwwmJX2LVnN3lRyCBYRMUHYGdu1LYsTKiI6o8OKrUxFFn0sYBgZM+3ZUHWf+2HXV2NN1QACGv/7UsSlgApkcVBdhIABOIpqnYSNUH0kmkk4VJQikGbFFAZAqEkfyIkUCRCUIXPvoymMlISFp92/c2wE2LOmGFQEg5eLoaBCJwYpEUQ1SGCnFVCEXYz2OaieFltt6m9alQL/UAAawBSctDMRLkYXe8aE+H01SuGo1HhMeaJy49wEURiGSJ6R3L3f72IyIjOm0uH0BhQzYB5dvSD4cTaufaHxM4u8beFhOhCXNAxQPkCEpXfPOvxyABKoQZJChQaBGcQoJZBlyaDFH0rTqSC+2JeO//tSxLKACmR3W6ekR0FIDeoo9gzoYAQwCEoZWvUPTOzItoKCkUUQWAx9EFXUECpjHKHEiobIlhUO5idSb/KgkkJDago8OzusN9f/c0ApNqBWw5Gy/QEEWoZBogJIwldIvDypA2P4TCNA4OXbqBOZakDqcUH6ClrHNrbzO2U5FL+bfrfmZLylImXWzPTnkJQx6Ct+d/d9Qc2quSuiBKKUbaTjaUC8ZBejpYCbEnUSVOEvlw+mEstvmHLWF1lRSGop7Ixm/37NfvMmFERWwyOzpKf/+1LEvYAKFENZp6WKYUwL6mmGGNg6ZfkmXtP8jLSh2vXvZ1VeN9ISYJQ8Li5gRlageBEqiAoAxpNiEbMiLgOSR1SoU7Y1IxoYPjhBJ3mC8716Bc5CERU4KiA5YHiBTOt3eLMl3wfhhh+UAAKAgGHkw+D8oc6C6nHM4D66gQcXPh8EOUOKDFUsGE2jEDWYwIbRpSNL/KOLSgfKWY3a0OSK9F8rFmbjEThMX1ljDdNS0b/ytnb1JiPJ9JYxhidt/dp+4ae4Pu6jWITtnBCCZSGMbf/7UsTJgwpIWUpMPMbBPhlpDZYNKCKyYDWhv2iwiT09ez3cOBuRsyLU7ov5/X853Sllep6TmgDBY0HxJqW4TggvGery6qSUTWBEITiSCHGbv7wnZpiWGLW2Fw3sx86ajiFHhwEkIpnkm7uKOmS6KZDNwncxLCUMKF2gxgaiCwKkehulZDgoXrGLKEdMjhaXN0b4c+oeZwy51jcvKS0acDnAqzwcMAUVqdX92igACBAAAIzifk5HIA9leuRtodLKuzyO1LGDNzTfXesmsZRQWZaQ//tSxNaACjjLZaewZ3FRhylJnDAg0SsbK5nb6G02ahaoyIIIzMoDXBPEImKhW9q29DXldkLH/xNbINQ2zxN/naTIAJUDgoU0oE+jAwe52xxRiuVq6ToUB8PMWKLUysHudmViHpK0emKFpW1WXbIT6NunlR/0ymNbmov+6H0uT9uzL//W3+0Eops29kx7VEwXLbW42USLcWMkwi4VmYZqAEWQwYH4vcGPkCJW133Vis6lLIDgJUPR+6W60YVunfo/ajMpWmUsSaco+vLs3hOduf3/+1LE4QPPLTdQDBhagZ6oKwGUjTi6F9X0u64jcLHwkMeoj2nlgA3MrTNum8SYY6I6DWoVgGmaM7HQ5J0bg6XsbqXauDDQyOK2V5JU47/kXSOX6JIVFlAACvJHFhoXUprQAkJpHDFRurvo4WsKuVf+desC1yXts40AQCEQWZeAISFmHDiYCF0hAgPXayVRNzRlZdAOr3mulYWmD4CQwwNKhGSA11/yMhxE0NCFp4JMGhBTzrmw0TSHBgiAqio2KlRtZTICpJeZVFAOIWY+wStye//7UsTOgAo0oV8nmK0BMSgr5YYIsM+o0tjBjtfQACY3FKpQdJkBO4NcO5UKMeSSfCEp9bdo4gJwgojFQjMfE0B4szM426wtRfIJ60WIaw9Lk9M4ZTP5/HywV9KXPnjvnSIHyD/VfLcgUdreWD2dm2PXYWGjBkaeLLTUKQAJwQTSakLBxTwMKmkAykuyrlFBnbjtwkzjyuUjThTIswJFpNbGC9pxIlNtHeJf/Pio1hUTBABqhcgpWJlmxz3GizLwODTSNx0sLE1JSoyKBprTrsge//tSxN2ACmS5Z6ekR2FLj6rlhgyoQ5ztq2z36ziqlBANHSIQlM64OmzMyOXSPQUUWrO0/KITNpjo8wGjAnMxk9RXLzHUhRTXVgut97sTrE86d9LtdrldXem5M6NqU66PdLM10T1b1a7A4Kpz0kGINsxCOvt3956D5vlVAEAW25AODzaIGBECc78ozRskLI7ko6JLrgWAm/gRQHUSpIJhYvs5IXq7RlnUXeKxzuasEWrKn25Kd/y4fZkRS0OvQV9PLYgv+q+tbvDlKyHf3MNx/zf/+1LE6IAMHGlKTbBqgXgY7DD0jZ61d/FrHr9Wx1pBSSWhW0UBgUBmTAoHGBYCSyIlMLgsjKp+QAZI8NRtUvvIW8kmC1fgZpAy76vSTJse7l5k6vKa/ErwEEDCDxwRBYg1ZUo+BLakpUHLlDhgodrInghiojAEXk6PlwA1gYcbaYZybiacQqsI7UiEjQwJaj4mAgj0+YwDCuEi5nFi2Xe/m16xt7nAQZw7TQ89kpksO6UIaGkcjw5KiJlHdSbbnrwqNnb4bNT7HjPgP5frf+7lgP/7UsTnAgugX01MbSMBeR4pWaSJfX3c+l7V/3oAZeVqkRuCJiqyTQLWdaC2SAbHAVFUgGSlo3Pmlpioyltc3y0HPLPoIVRUT/aH7y2tf+1rZ9f+5JyTJkB4Zc1t+tbYK+uifSAgCKgMGw20MKlqP/oeYa4QuA3QkVb9OwtJhcDtbT3UGoDCp1QpydqtXq9Rs9jnJ2TsuZb1XjFI/kOQ0FA8YIjAchODQUEr+/bTTEnEzdxICcNBC6y7u7CyCGHg+f+EQfeMctqsUOf8gio5HjrV//tSxOcCC+ClRu0kbQlwEmkNtg0wtSUryFtKQAAIBTTstU6TUU4ThLWyJHVRdgIHCCJoJCoIoCjY9yu0ck7QSlpAhCIlNBVveB3oYcF4pE8S+1zMoWrF1Vlpv1E4Ed+5HSYNMhomYmTLWbRrL0ckGHCsUIZnTVvO02f8tWd+q4tsbN3N0Sk6BMQPV7jcz08u0O3+FmYAxCtpkYfAzSTN7R63aJEJD6FBAAKTbcKgK4bh8FPOEw7BaViuDYJSYqL4nDn4GhqKJxPmroMFEuwvRj7/+1LE54ALwJdNTLBJqWuXKuWWGOYeUnt28cg4cUlhoH3i6Ru8HTTSKMiB2E5zDDUlw/G/Tp8Tmuj1Bi04AAKbkw0ApPEMHl5gMExUOV5PfMCmc+UQGsCQFngFBDKRhg4GYdhZuz+i48AiWKClYwRQsWVzyA7lZ5t7K6XzsyLMpwCj1CKq5/4JrDQd78rVEqZVWZXkOZrP8hkBBJVLqNQaR7yd2o3GGotUjXzqBSFe1MQaydhSpjuMzqqET8Dpdy4meW8Q9FznmKZQdYRvh5HiqP/7UsTpAAwIh29HvMvyKyBrKYSbCNP56Rb/UZNu/roUCGg4EQm0lJuGGXItgYcM9GsjQiI+vMLDMBSQnpRelqAC5QYUK0Qo4hSZDJk0PRZBYNJJ3VXiptymUvF2ueiug3DTtjqyAZGFgORjm2HKI1gkRSKnVyHsQkA1rG4lGm3PWa038tDHTIrXiAeAHBsDVBLOko/fP2KstwMM5IM1GXSE9MmZsonI35Q/LUp7z4cPX/csyoUrZCNrjZWdFXLQpdmx2kSjBR70TdZdQGjRiR5C//tSxNGACkB1aUewZZFEi2wclhg4YF2qgdFyGrCDaccffdXKgzVEnIZMojXPMnyRftCCcWZKnUJMApQTTPPpi05IoPtxpajZUlX8jUlbjCUzVDVSkPM8siKWiWHQyhs5+THovwxyKpXZIeeTfPGyy2BQ/cHnv4yW2Yrf1wICUCSKJgRfGAsgRWO1aCDXZWK6bOZXAl+L1XBgUECdRQZVP3DyXDQVJyI+2xOD1oecqLZVsdTEM83ukrJUkdjIj0V06NlWdmszFtbVslrutmf/ZyH/+1LE3YAJvMdpJ4R28V8Oa/T0jOzFscSIxRsNrJbeYGBiFRJFQIFiE5MmAAk+FulArVHRLQjj6rUHx2ThMUXYNuvExWRhB8jiE1P4YOfI02hZPMq88YLlzBtCGIctrnyZU+1B8x2B4jxexiICDgHHHxq0JZaRWgEIABEbBQ0RslvS5I5IjOy981A0nj8BoxCdK+diSwWyuXyqeNJ779S8pxlj2mFilrlQTU81u1nyUY7//HvTz+20uT78/9Ssy/L/7W5HRm4/6ym04qtD9hwncv/7UsTogAwQtV2sMGWhfaFs8PMN3uN+PQOsPAUMABJNOQlJNwoxUGMB+KlAHx7TiOahS6HzA8oQ4Ibi5AjdZja+0K9gjKDJkQcz4RQLkReSII+AYgmM26UvcvhNjkwq5gLODrTBvQdc94GARKldKcF7R7A4HiYHidtm+966CAAk7rwIA25mWGjkC31hIPZrGGYrzsuldj7cAZI0BwtM5c0cyhGB7YMWVdCBZufq9OJqJMz1aBfIu8p5H/9Mj2dgRnnG4abkJmgnwJuDL3NZU9i8//tSxOaAC+0pT0wYTyldEeoplg0kkNFVsGEgWSTSARyAKcm+EROxVVUew6TW5ZA7yyx6KB84AqxGB4tWllWAeVM5y5ctWZw4GDgoxLhqJPUuliSRrs7nEfSt1vboLu77v/XW+5f1UVGLXbqENh/IgFDIXDaEExOoKFSMnHicLJQIBPPu/C9t2262OWytwMA4CQMpSzL8ZJKJ82G809SLKgjo2BMAoCdLXcf88Ewki9cuMTGymYWLULr78k189E6AiowE1vecDHUBVELNT2mnA1//+1LE6QAL+SlJLLBpqYcVaWmWDLyWq07u0A2/JQGiKfKkC/qn3FtwXL3TcSpEoObrL6cwSAuLyAWMqcWWBwYIR5E2fsXqvXv/NH82OkI5g3EciGa+xUJhgcEwG4jk8zaJA6JQbj4C4Dz4RKKlpeBePks+EDgy44k+0kUIMdx/J6FgvOMo8XZ7kseHAiKeS54Kx5E1DyWeHAePBgvBBkUHYj0QZu7zH+We7y5kuWHYfu9jT0qKinREp+J/r/5MuPUqAEWiNAOgakk4ZSGKl6rorP/7UsTmAAucz0jspG0BoCGp6YKmqA4tbinUrtzSHoDSkqNcRHYlKlq2kKlaY2t61lO/fSs8drnz59qGh09BWtLvMPutllgqyt6FQuYfJxaspdp0+QzuXLmIXcdyiFxJprQnim+l25/IutCPXyC9dXMUfZA+pQiNoEZz16+n+C1XUbydIzf7/46O5lPf3Wjsha40gH0vpAKLjJEAAMVBYgWCccC+IxUejR0Jp4zU5cagVVcEdZSCm0t1TdPMhRrLtDkQu5vYfPOH203kpf9TRhSA//tSxOGACfCndaeM0bKatGmJhiH4VxkYhbAumk0j7z1kwF5gskxWn19Pzq5BBmRYVk1ijT0GUnyxsgZkJQy8VlcKoXDRpyq0lxDqWbrE1yMMGJ6RQszh53/zh4Unm7zQwBLiJQjgUwWq9wa7VPuQSVS5MCXvUDgcEx5x5rvpABLkJDQASRoCMPWOAC2RIoM4E4NVY4npdJ7BZsiGJF0z9tk2VLh0l0p4o3hQ8EjVqACAQKMuTPRZylCMswVt32HTtOMlXc7+MSRGCh47+SoATUD/+1LExAASGYlWR7DPwUgYK7D2DDCRFp/jfMQ0TLAJgibKh6Hl+KA4yRqdpZ3irTCtRNq7qmYUTUwKQkl7xqzh8+VKqJuUxI4SqTNPWhECoGElQVkqFqVSHtKHXMzapdh5ut2hQBtbHtnTQXJ6QAAxhdCOMHDpT+MLsYLh8aMLltWhZb+v7xWClUy9Th0JudWa0tRDHVzUUKVo257O0KWMYJazCRtzrluQbWP2i/xdsOfrX0UBQtTeShD3naKRTlpaxaTryjsDvKA5p9okbm7aYv/7UsSwgApAg2fnpGOBPgtqsPYYoFSP3SBkCUamy+FTe/eNl4Z9DOhaJNOXEh1YqkTAADFjkIEWM7FWY4T0vwnf3KdsL7l2m5cDBRAkyW5SAqwQGAtQacmMOAlDScHphaNSoQdgZhf881alUFgBj9UeS9Naq4Md3Wtmsxuhdr++zZf2mVDsg5QZndFaZZNKr5jtd2Zd9HmVkMrXaZbD1dNYiHQjftD4mPuqt+EKZvjSBLUjkV/S2J45EoMR0FoOHw1p0TgiG1C4qdWNkq6N6+/q//tSxL2ACkxFTSw8xQE9ECjFlg2gDEKf6iGY6pW/CM25/0gSVBc24UQhCW3v0Cg4eE/f3Yl/pjU2AEMi0evS2l9HoABUkcmbbSTgnImIJtmHCV512BILhk4ZNAZIQxLDE4Kbi693Q2iEk0zpgOjgCneJShWBwO60CXKcFBlyo0XUs+yZA7t9VEi4p69BMMpnCQtNKM21AAYQoAgEwgKZjILEXheYkRckYY25BYeGjgZFwEbWEUrouq5QgGDTU5FagscGShi4MVpNTbyjQfQpJR3/+1LEyoAKIH9KzCRrQZqoKemGCLHXdf/rxOMLmrHPs/c+AF6BUI8ccgnDAAponRJtdBKXhdtrcArwghJcPKHTYrZkguaOGVU9gC0mKhTb3ctCufgzqzOi7r1ZDXZ3yatp11RSISql0eYz1Z53Z7Xeum2Z16ZqN6o6WrLQqggcNCthB5lD+WWVABkOdZGjgllDitRAbAVZl8NMrW0ZgHCTgT84iWKDY+yxk4LgrFhuCMD4QwugjB/A2BMB7hprwkiy3q9jnpVUuZ/qZIoXhDG9jv/7UsTMgAnYgWWGJGdxSokq9PekFNP5d0EN336+88/RSCZGxsc+KEk/o9v+IdMZIWdv/eGABhRJaLiILQRBWsSPOhPCChH28MEDIO5uOo8zWL+4DqNYLwaomiiOVkZkXgbk0BgbEYuAGMRknUsDmOyumHLW83/bmLBQceaXFUWCwEQUDAfaBHe/ssnJf/ir9VL3B9H6FSEAC96QQk5J08ql5+uVUyqEdKtVrI/frslrkhKdYoLCFEwJaCxw48WGIi2RUdfViPdPekqv15+6vOd9//tSxNmCCixVTUwkyAFyqSlFhIkyH0YGWRu5wRCr6UWDAbpac/rIWFf39FgAAB8qBICrSzIsnK8sj0dY00sTW0sQxLEolxvZnlyWKU1dlK5pbX3vuM5XNpbKFantQYQeBqprhRBZk0UahKiph1HIIlNLL4lEYr+jUqVc3YhFCCIEFJJFuBsB1tZvG6sFuyaLjtQoQkXYKORNaSKJba75rB/9mx5nSBohnAeFM+Z8TYKHSKBKBggQaHpwJh5qSoM672FklSFZUWGhIjLFu/W7daX/+1LE4IAM7JNTLDzLwYeP62j2Cli2PYnBXTgrpUgy7u4XM00njOOolywLW5nT0UkmNFC4dXoh3GWBKh5K6Q7flUG76zWjUyVMtkVufSwVQEnkX3uBoetJdChEccBCxvIrj5trD1rKGF3jlVsqvpQ892Cz2rFgy7igraK1KgFhVVhHOW2R2fAjH85CQYi6RDCuElGRq5hoTmw8Js1UEkg4iBXrVmUaBFPA/aQP7hlb1aeFxY7PI/fPZ9R//L/vAtvhYp9+JIg8oF5RNr32/Pjfv//7UsTZgAok6WDHiHOBR5Gr2PSI+P/+wFGNfevNztgoSX2J6ptKZrFvFobgxLoMLj6UEwsHcmIKkm1gKOrzLm2buhAds3sCsS3SEzkzXZKjtKCrirmg6WFBO9Z64ST5UwLCpG2gS/PM12ysXGPAojrLFnHooto8FRy4ldHIAJU+sM2tslyRJcQhmPNdDjcgsNEQ/RIAjQBmS4wSqbRtnp4YDFQaUhwpT6XcmYS5RJPKhDzT/BkEREKhIHxqD4VETjwlLB1kVusYkqNA4JBcTm/5//tSxOYAC4yBXaeYbQF7Dex09hlMssxiEIVdfX9FQANtEtJowFQZdMvilixJ3S6kCAVWqBJA6sXFQdxKeeaRxQQSsucwj+MP22Z61dJ3wO5yNdzUp6cFD/G3zml/zvmdOR7Su243J/XOu+L75/27///5NasAx6OVk0ZfdQAPoCj234KhS7iElVi4YeTbirAImI2wHDAL6PoVRgUBYVEkv8/ISVjP+RWEeYY5cmdhM2Y7eT2ZtOMrLvZof4crCh7EhFmxzL2gI2CjDEOnAgoFg3f/+1LE5gALtFVl5hiuaXmNq7T2GDyZRiWrfUanQEE9nWrbbL+MkUwT5VHfMT5zVZ/IuDo8zOqhDhd74mJ2uGPngQCJTh5yHSd5zB6wuWkouxStluCVWVuRyaoul0d6vkVtmbJq/ayKx6Om6+1N8toNlPe84WoX9pi93+oAGxCC23MCoqdwZ+khE5fp7wEqnkB0RxgqNSyXx3DwW3WEMs0ZPIPfrGDc6XPN1igxUkvoXNWMHDqqCPGTSHPWWEB8yUW0HBYYQNl6hSussPcPStEgyv/7UsTmAAuslV2npGdhdA3qKYYY/TpGVh7NvtQAAAIAAC2ruGehASy4c8GMRROJ2FFwHLf5LxoDlz8QkAia6MBw2ahE2hxgWFKq6/TJ6us+cDHLQoWiZdkpo79fg8IHDhRwnP+get9oYcnGMEI4gJ84+D+sUQTlGMUOOVy1Txi8KdGsm8PxtImbEWjBMYiJDgq4xgoAXrLMrsi1+NyKlitao3Z+rsJiVqPbj+D9xGRXHrS0VeXxBQkPBLQ4figcoDUUhlKxxXj9gM6sUjC8ZI9W//tSxOaAC4jjUUwkaYF7Jms08YpkSMyDvOJGF/V0igNBeP0f7gZaAJeThpQ4nsZTsp5qROSGQmXJ+zvmAaGIxDxAcjnfsRc7h86rRkKdCda5EILv3atCKLityOUdoIAOCT4cOOoiDpigDSJdK8rivoeL8jUnJcAiGBcMxKbZRU5YSbMlof3Tdl47UEkRywTVaxuLdW9v5laO99OnTbYlbzqiI2USwl+So5mo/GSY57n1L3wGgPgk9yam5x97hWcz/9ICAIC0Q5wD60LGKEKIKgT/+1DE5wALpHtJTLBnwXGSanWEjage5f7sqtRDHk6R+rlAOW6kTejh7BSO+yNjIuFujxE4khKzp0sKDywKyQGQ43ItjXAgXfTvWXNFzYZP7/2PAJNSKHsqzIGiNNsznftrJcIpkNoRFh9jL6YWRPEhEHjVlx0kRxazdi3qIFygiDkKRjFmZui9hCi0q83gMek/orcfAjHfQUScdetL6Fq73sRptyEgo5VVElu/3ltsaTgAxoB8RR+cKwQkpcZGBWKC8vEkwgevZO1a7cGJ6tp4//tSxOeDFDU9Um28uMGNFyqFxhk6QXttmQi2f+9fnH7moJEWPNIYAySYn0hS9smVTF273FS+mi8sHShJz1+qG0tNzf6AQVZAUAjKuXMyA1EpIBgz+w4v9ouKNzmVpo00LKhGk/yYzptB2eb+2yI7WF/n24U4m07yfkf+h9to+Xfu8hBMuNhk3QjYpKT6TZSsXeEGNeQ+pxNAsHA2lJbU4IkcihJLv7pbZGioIQ7JlKmnNzOI5LsCNPw9UjySjavRY2/9P2ZXoxvdyyrq/RmnYDH/+1LEwwAKZFtUzbzDQTwOrf2WCHycKkym79vyqTvTZb0r5qBjkCtKqJM1pY1XWHmtdsuq3oljRYeARKBH98qGrUxhNAEEI7WmwwyhwHRTfpuTipcNfrkqBUcJKVc2UU3J9R21gpE798mqpC4qGVfKfPXp6G/3y+72f7SL32JOoeKq7F+fnOH3L/eztILXMSjJWo9co7tYkRyURGDKnaYALuEVE0VDvitFxCFRFiVK7TavLZJoB9kpB4s0cNMWbuXr6CZGkzNb5t3cc2kCpDaAqf/7UsTPgArQf3+mCNIxeJpqJcSNMAADHprEi0JCT0VsSLRe1g3FiQuBedM26PqsplrdRISNhfQ+T1Atrf/l261x8JqcVyH4GysUBWFnguhBVpV6NGcYFTaEgkp/6WRM/NjhhVHh8Mnw7QWQB7hdb1L2LmUDGrV+rdUbAUMLF7Zn/Wuh2sTlTqnzyCqJOgERtbi3tu5cGmokRN5CgWGxcX5LDAc4t8/avU/llz4PMmDjOdtMxfnEwjqt+5UzPQsVE789jv0YWBZQhQTIv/dx1JLU//tSxNMAC3TFeaewS7FwoOmZxI0w9tylObAbEjIoZpeXdSvpADDUaAVl22ALhqaMFQ3Vvht40FAKXOCaX1bxySnXHjrESnJXmMcZL/fvjdz5FixEihQI1ANG5Qr8/f6Fa7TR/dYWyF8wHW59nPY1ym4v/9vsvu3//s7lABtQJzW3A5T4HLTAgAgXTNyiKuVjxKSRCIt/YpXExkHMTBlYZrJI4SINOvyk57lduJt700vtDevOPN0cjnbxe09RVqGJ7zU9b0SW7M6e4IEEsF4zAV//+1LE1QAK1F1TTaRJgUuKrDWWJEy7kb0i6UXAByoAlHJgefgxwKuDgCwXpsMsRVf1QZKAyXNLS2nWOmEL0NkbjpgRi8LXaXyCAQ5n64odRaFAQzgHlWmKknx1Xfb0H7My9ZEZql54hzdwtIATKdtr9//Sf7+3rq8uwmUAI0AUnHKDgzhGZEAFAxFpLKOJql1rET7Ep+XS5236UKTqkPWPWxQ6UA4Jhy28Nt93t5dufxutt21VhUTl0peG1MLh8Oz6ygPnpLO8ywuCQSFo0Mkhxf/7UsTeAApgpV+ssGPhWowqdaYY4WGK6Rq2FmbwsQUnI7LHNnrNXt9tawGwx+kUI6PQX0mPcfuw3OJLflihctf19zALqeK0IePVQohZbXFUcA5XABoE0QwwxHTDIyTqAmoEymxpjamon8BX0WqMjCpl07o3NcZfjLMB/dwdTR6ueWjE8sGFNFc4faoB3p9TKBQIhSVwwt8V+7u8hU3rMzlBzBkjS7amVC4WZt6tv4x9b3LXxfT5z/6Z3e+5zn/+k2YfyioCCCCeVSn7uXoSWs2C//tSxOcAC4zxTU0YT8F8jmkphg0xGHlv3UZAnXBDPGvNhkMLlTdHRoijB5iI0Go0oabp2JZmnFaYSSO9tTKHxnebz37eeqYb0m+XLCw6hsPtjn/EiZv3ryFPdxeP7+m4DuNWmfPWsT63fOIvxqmb4xTd9/31JjX1bf3WJW997zuWSTUi6a//j63u1fvX//1f9s1GlTsK7YqsTCJvwXT6QcegAHlhyGuT1EIeqFhDH6kSm3zku4j6hYoYOcSiEUeFhYbQ2qj/n/qVI44SLxszcFr/+1LE5wAL1H1JVaWAApYnrHcw8AI9WMmjGg/anTZD1OEeRcXkaeEAtYooeEFuWrPdQMKaKGj1KNNDx5MuHCaygx1xNKSZRdjtupznH+/RASU2hVQ5EkQ3WwqE5EPxiHC89IJ62JBJb14Rkp6tO3Vq3VtbML20VUIgezxFo4GVCosMLQKokAQrTWYqfBrtfloKklBgXO2uQp5AR0Uem5hpN4dpsxZFbEABF2JglQHL2DXFadpSJhCjzO5Qp+JTafun3wgBw8BQ8EgKMupwYDMYz//7UsTCgBLpTVk5h4ABrp2rZ56AACiLFXdmtzez4i6vZ7SjWMgoDb9QoLC7rSy4dBsUrWdfu7+bkipZSkpuJe0VTXiuCrn1qREBAAADDWBx6giMOA/xZWWpXnW/2JJy2n2/xaBvKJrK46QscIsiQ7hb2RAiwpEg38i4xDMcYpUxRWYmvx+FiKg5QvxykTE1MTEmfygNImDEmSAk2amJrVMf5KsNMmzUtl1yPrJnRU//mA6ThcL5DTQc0pFBNSVSSSkklJf/RLjmCmPUET6jibJa//tSxJ8ACxRPZeYMUkFwkqqynlAAWl1o1o//9ZuHv/zoKkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+1LEooASvZ08uagAAAAANIOAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg=="
      // No sfx clip here: every key the game plays is a role of the house kit,
      // mapped by `sfx` in manifest.json and injected by the builder.
    }
  };

  /* ===================================================================
     6. GAME — SLIPDECK.

     A counted deck deals ONE card at a time to the middle of the table and
     the player flicks it LEFT to bin it or RIGHT to keep it. Every hand
     opens on one card the player did not choose, the anchor; four more keeps
     fill it, and it is counted as poker, Balatro-style: the category gives
     CHIPS and MULT, every card that makes it adds its chips, the card
     modifiers and the jokers add theirs, and the hand pays chips x mult.

     There is NO CLOCK. It used to be a reflex game — a 30 s round and a fuse
     on every card — and it was won by swiping right without looking: the
     shoe fed whatever the hand already held and a bare pair paid, so keeping
     everything busted about one hand in eleven (lab/slipdeck.html, the
     bench). It is a game of reading now, and the pressure comes from four
     places instead of a timer:
       - the DECK is the clock: a run is DECK_SIZE cards, and a bin is a card
         no hand will ever get;
       - a hand BUSTS on high card, on a bare pair under the PAIR FLOOR, and
         on a CURSED card, and a bust costs a life;
       - a hand allows CHUTE_DEPTH bins, and the one past it costs a life;
       - the JOKERS are EARNED: every paid hand fills the joker gauge by its
         strength (a pair 1, a flush 4…), and a full gauge deals a PICK of two
         jokers, one taken. A run opens on a pick, so a build starts at once,
         and a full rail of three asks which joker the new one replaces. The
         jokers are what bends the chance: some read the deck (Seer, Card
         counter), some steer it (the FATE family, played by pushing the card up onto it,
         once per hand), some move the picks themselves (the LUCK family:
         rarer jokers, a fuller gauge, a third card). Every joker has a
         rarity, and the pick draws by it;
       - THE POT turns a bin into a stake: the chips of every card binned
         drop into a pot under the bin gate, a paid hand takes a share of
         it by its strength (POT_SHARE) as chips the mult then multiplies,
         a bust burns half of it, and the last hand of the deck takes it all.

     The climb brings the ideas in one at a time (stageFor), and each is
     explained by a card the first time it lands on the table (TIPS): a
     player is never handed a rule they have not been told.
     =================================================================== */
  var Game = (function () {

    /* --- tuning ---------------------------------------------------------
       The numbers a level moves live in CONFIG.play (section 1) and are
       re-read on every reset, so the web target can lerp them before a round
       starts and a playable reads the same numbers it always did. */
    var HAND_SIZE, DECK_SIZE, CHUTE_DEPTH, SHOE_BIAS, LIVES, SLOTS,
        PICK_GAUGE, CURSE_RATE, VEIL_RATE, ENHANCE_RATE, TALLY_STEP, POT_ON, STAGE;
    function readTunables() {
      var P = CONFIG.play;
      HAND_SIZE    = P.handSize;
      DECK_SIZE    = P.deckSize;
      CHUTE_DEPTH  = P.chuteDepth;
      SHOE_BIAS    = P.shoeBias;
      LIVES        = P.lives;
      SLOTS        = P.jokerSlots;
      PICK_GAUGE   = P.pickGauge;
      CURSE_RATE   = P.curseRate;
      VEIL_RATE    = P.veilRate;
      ENHANCE_RATE = P.enhanceRate;
      TALLY_STEP   = P.tallyStep;
      POT_ON       = P.pot !== false;
      STAGE = stageFor(CONFIG.level || 0);
    }

    var SWIPE_DIST  = 92;    // design px a flick must cross to commit
    var DEAL_IN     = 0.16;  // seconds the next card takes to reach the middle
    var DEAL_WAIT   = 0.07;  // beat between one decision and the next card

    /* --- the deck ------------------------------------------------------- */
    var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    var SUIT_RED = [false, true, true, false];

    /* Where the pips sit on a numbered card, in the traditional arrangement.
       Coordinates are normalized: x is -1 / 0 / +1 for the left, centre and
       right column, y is -1 at the top row and +1 at the bottom. A real card
       prints the pips below the middle upside down, and so does this one. */
    var PIP_LAYOUT = [
      [[0,0]],                                                          // A
      [[0,-1],[0,1]],                                                   // 2
      [[0,-1],[0,0],[0,1]],                                             // 3
      [[-1,-1],[1,-1],[-1,1],[1,1]],                                    // 4
      [[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],                              // 5
      [[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]],                       // 6
      [[-1,-1],[1,-1],[0,-0.5],[-1,0],[1,0],[-1,1],[1,1]],              // 7
      [[-1,-1],[1,-1],[0,-0.5],[-1,0],[1,0],[0,0.5],[-1,1],[1,1]],      // 8
      [[-1,-1],[1,-1],[-1,-0.3333],[1,-0.3333],[0,0],
       [-1,0.3333],[1,0.3333],[-1,1],[1,1]],                            // 9
      [[-1,-1],[1,-1],[0,-0.6667],[-1,-0.3333],[1,-0.3333],
       [-1,0.3333],[1,0.3333],[0,0.6667],[-1,1],[1,1]]                  // 10
    ];

    var CARD_FACE = "#f7f4ea", INK_BLACK = "#1c2b24", INK_RED = "#d5263c";
    var BIN_COL = "#ff4a5e", KEEP_COL = "#3ddc97", GOLD = "#f5c451", CYAN = "#7ee8c4";
    var CHIP_COL = "#4fa8ff", MULT_COL = "#ff4a5e";
    var CHIP_BOX = "#2f6fc4", MULT_BOX = "#c42f48";   // the hand's worth: blue chips, red mult
    /* A ×mult is not a +mult: it MULTIPLIES the red chip. It wears its own
       colour and its own shape everywhere — an orange burst, never a pill —
       so "this one doubles" reads before a figure is. */
    var XMULT_COL = "#ff9f1c", XMULT_BOX = "#e8590c";

    /* --- card modifiers ---------------------------------------------------
       A dealt card may carry ONE of: an enhancement (mod), a curse, a veil.
       The anchor never does: it has to be an honest card. */
    var MODS = ["gold", "glass", "wild", "lucky"];
    var MOD_NAME = { gold:"Gold", glass:"Glass", wild:"Wild", lucky:"Lucky" };
    var MOD_COL  = { gold:"#f5c451", glass:"#8fd8ff", wild:"#ff7ad9", lucky:"#42e8b0" };
    var CURSE_COL = "#b98cff", VEIL_COL = "#9aa8a0";

    /* rank value: 2..10, J 11, Q 12, K 13, A 14 */
    function rvOf(r) { return r === 0 ? 14 : r + 1; }
    function rankWord(v) { return v === 14 ? "A" : v === 13 ? "K" : v === 12 ? "Q" : v === 11 ? "J" : String(v); }
    /* chips a scoring card adds: its number, 10 for a face, 11 for an ace */
    function rankChips(r) { return r === 0 ? 11 : r >= 10 ? 10 : r + 1; }

    /* Poker categories, weakest first, and what each one opens the count on
       — Balatro's own base table, chips then mult — plus the royal flush,
       the straight flush that ends on the ace, on a step of its own. */
    var CAT_ORDER = { high:0, pair:1, twoPair:2, trips:3, straight:4,
                      flush:5, fullHouse:6, quads:7, straightFlush:8, royalFlush:9 };
    var CAT_NAME = { high:"High card", pair:"Pair", twoPair:"Two pair",
                     trips:"Three of a kind", straight:"Straight", flush:"Flush",
                     fullHouse:"Full house", quads:"Four of a kind",
                     straightFlush:"Straight flush", royalFlush:"Royal flush" };
    var BASE = { high:[5,1], pair:[10,2], twoPair:[20,2], trips:[30,3], straight:[30,4],
                 flush:[35,4], fullHouse:[40,4], quads:[60,7], straightFlush:[100,8],
                 royalFlush:[150,10] };

    /* ===================================================================
       JOKERS — data, plus a score function for the ones that count.
       A score function reads the hand being counted and returns one effect,
       { k: "chips" | "mult" | "xmult", v }. The rule benders and the
       survivors carry none: the code asks has(id) where they bend. The FATE
       jokers are played by pushing the card up onto them (`act`, FATE below), and the
       LUCK jokers bend the picks (dealPick).

       `r` is the joker's RARITY, 1 common to 4 legendary: what a pick draws
       by (PICK_WEIGHT) and the frame its card wears. The painted piece of a
       joker is `joker<NN>` of art.objects, NN its place in this list — so a
       new joker goes at the END, where the next cut of the sheet waits.
       =================================================================== */

    var FAM_COL = { Mult:"#ff5a6e", Rule:"#7ee8ff", Bin:"#ff9a4a",
                    Grow:"#3ddc97", Survive:"#ff7ad9", Curse:"#b98cff",
                    Fate:"#4f9bff", Luck:"#ffd54a", Risk:"#c6ff4a", Seat:"#f3e3b5" };
    var RARITY = [null,
      { name:"Common", color:"#b8b2dd" }, { name:"Rare", color:"#3fa0ff" },
      { name:"Epic", color:"#d64dff" }, { name:"Legendary", color:"#ffd43b" }];

    function countWhere(cards, fn) {
      var n = 0;
      for (var i = 0; i < cards.length; i++) if (fn(cards[i])) n++;
      return n;
    }

    var JOKERS = [
      /* Smeared makes ♣ a spade and ♦ a heart: the suit jokers follow it, or
         the two would fight the one build they are made for. */
      { id:"spade", name:"Spade lover", fam:"Mult", r:1, text:"+3 mult for every ♠ in the hand",
        score:function (h) { var sm = has("smear"); var n = countWhere(h.cards, function (c) { return c.s === 0 || (sm && c.s === 3) || c.mod === "wild"; }); return n ? { k:"mult", v:3 * n } : null; } },
      { id:"red", name:"Red tide", fam:"Mult", r:1, text:"+2 mult for every ♥ or ♦ in the hand",
        score:function (h) { var n = countWhere(h.cards, function (c) { return SUIT_RED[c.s] || c.mod === "wild"; }); return n ? { k:"mult", v:2 * n } : null; } },
      { id:"even", name:"Even steven", fam:"Mult", r:1, text:"+4 mult for every 2, 4, 6, 8 or 10",
        score:function (h) { var n = countWhere(h.cards, function (c) { return c.r >= 1 && c.r <= 9 && c.r % 2 === 1; }); return n ? { k:"mult", v:4 * n } : null; } },
      { id:"court", name:"Royal court", fam:"Mult", r:1, text:"+30 chips for every J, Q or K",
        score:function (h) { var n = countWhere(h.cards, function (c) { return c.r >= 10; }); return n ? { k:"chips", v:30 * n } : null; } },
      { id:"jolly", name:"Jolly", fam:"Mult", r:1, text:"+8 mult if the hand holds a pair",
        score:function (h) { return h.ev.maxR >= 2 ? { k:"mult", v:8 } : null; } },
      { id:"low", xm:true, name:"Low tide", fam:"Mult", r:2, text:"×2 mult if no card is above 7 (aces are low)",
        score:function (h) { return countWhere(h.cards, function (c) { return c.r > 6; }) === 0 ? { k:"xmult", v:2 } : null; } },

      { id:"four", name:"Four fingers", fam:"Rule", r:2, text:"Flushes and straights need one card less" },
      { id:"smear", name:"Smeared", fam:"Rule", r:2, text:"♥ and ♦ are one suit, ♠ and ♣ are another" },
      { id:"shortcut", name:"Shortcut", fam:"Rule", r:2, text:"Straights may skip one rank between two cards" },
      { id:"lowbar", name:"Low bar", fam:"Rule", r:1, text:"Any pair pays, however low" },

      { id:"goldbin", name:"Golden bin", fam:"Bin", r:1, text:"+15 chips for every card binned this hand",
        score:function (h) { return h.bins ? { k:"chips", v:15 * h.bins } : null; } },
      { id:"deep", name:"Deep chute", fam:"Bin", r:1, text:"+2 bins on every hand" },
      { id:"recycler", name:"Recycler", fam:"Bin", r:2, text:"A binned card goes back under the deck" },

      { id:"ascetic", name:"Ascetic", fam:"Grow", r:2, text:"+1 mult for every card you bin. A bust resets it.",
        score:function (h, inst) { return inst.n ? { k:"mult", v:inst.n } : null; } },
      { id:"collector", xm:true, name:"Collector", fam:"Grow", r:4, text:"×1.5, ×2, ×2.5… as you chain the same poker hand",
        score:function (h) { return h.streak > 1 ? { k:"xmult", v:1 + 0.5 * (h.streak - 1) } : null; } },
      { id:"veteran", name:"Veteran", fam:"Grow", r:2, text:"+1 mult for every hand paid this run",
        score:function () { return hands ? { k:"mult", v:hands } : null; } },

      { id:"second", name:"Second chance", fam:"Survive", r:2, text:"A bust breaks this joker instead of a life" },
      { id:"heart", name:"Spare heart", fam:"Survive", r:1, text:"+1 life when taken, −2 mult on every hand",
        score:function () { return { k:"mult", v:-2 }; } },

      { id:"exorcist", name:"Exorcist", fam:"Curse", r:2, text:"A cursed card gives +20 mult instead of busting the hand" },
      { id:"seer", name:"Seer", fam:"Curse", r:3, text:"Shows the next card and lifts every veil" },

      /* FATE — the card pushed up onto them, once per hand (FATE below): the jokers
         that steer the deal instead of paying for it. */
      { id:"compass", name:"Compass", fam:"Fate", r:2, act:true, text:"Choose the next card's suit. Push the card up onto it, then down onto a suit." },
      { id:"reshuffle", name:"Reshuffle", fam:"Fate", r:1, act:true, text:"Sends the card back into the deck, no bin spent. Push the card up onto it." },
      { id:"pocket", name:"Pocket", fam:"Fate", r:2, act:true, text:"Puts the card aside, or swaps it with the one already there. Push the card up onto it." },
      { id:"rewind", name:"Rewind", fam:"Fate", r:1, act:true, text:"Puts the last card you binned back into your hand, bin refunded. Push the card up onto it." },
      { id:"counter", name:"Card counter", fam:"Fate", r:1, text:"Shows what is left in the deck: each suit, and the faces" },
      { id:"called", xm:true, name:"Called shot", fam:"Fate", r:3, act:true, text:"Call a hand before your third card. Make it or better for ×mult, or the hand busts.",
        score:function (h) { return h.called && CAT_ORDER[h.ev.cat] >= CAT_ORDER[h.called] ? { k:"xmult", v:CALL_X[h.called] } : null; } },

      /* RISK — more than any other joker pays, for a price the run feels. */
      { id:"greed", xm:true, name:"Greed", fam:"Risk", r:4, text:"×3 mult, but only one bin per hand",
        score:function () { return { k:"xmult", v:3 }; } },

      /* LUCK — the picks themselves: what they deal, how often, how many. */
      { id:"charm", name:"Lucky charm", fam:"Luck", r:2, text:"Rare, epic and legendary jokers come twice as often in a pick" },
      { id:"ticket", name:"Golden ticket", fam:"Luck", r:3, text:"Your next pick deals only epic and legendary jokers. Then the ticket is spent" },
      { id:"hothand", name:"Hot hand", fam:"Luck", r:1, text:"Every paid hand fills the joker gauge by 1 more" },
      { id:"third", name:"Third option", fam:"Luck", r:2, text:"Every pick deals three jokers instead of two" },
      { id:"redeal", name:"Re-deal", fam:"Luck", r:1, text:"Once per pick, deal the jokers again" },

      /* THE POT's own three, in the Bin family: a bin is what fills it.
         Croupier and Fireproof are read where the pot is taken and burnt
         (scoreHand, settle); Ante where a hand is paid. */
      { id:"croupier", sign:"%", name:"Croupier", fam:"Bin", r:2, text:"Every paid hand takes 25% more of the pot" },
      { id:"fireproof", sign:"♨", name:"Fireproof", fam:"Bin", r:1, text:"A bust no longer burns the pot" },
      { id:"ante", sign:"+", name:"Ante", fam:"Bin", r:1, text:"Every paid hand puts 15 chips into the pot" },

      /* SEAT — the places of the hand. Cards fill it left to right, one at
         a time, so WHERE a card lands is a decision no dealt hand of eight
         has: keep the ace now, or let it pass for the lit place. The anchor
         is place 1, the card that ends the hand place 5. */
      { id:"seat", sign:"★", name:"Lucky seat", fam:"Seat", r:1, text:"Each hand lights up one place. The card you keep there adds its chips twice more.",
        score:function (h) { var c = h.cards[h.seat]; return c ? { k:"chips", v:2 * rankChips(c.r) } : null; } },
      { id:"keystone", sign:"◆", xm:true, name:"Keystone", fam:"Seat", r:2, text:"×1.5 mult if the middle card of the hand scores",
        score:function (h) { var m = (h.cards.length - 1) >> 1; return h.cards.length >= HAND_SIZE && h.ev.scoring[m] ? { k:"xmult", v:1.5 } : null; } },
      { id:"stairs", sign:"↗", name:"Staircase", fam:"Seat", r:2, text:"+3 mult for every card higher than the one before it",
        score:function (h) { var n = 0; for (var i = 1; i < h.cards.length; i++) if (rvOf(h.cards[i].r) > rvOf(h.cards[i - 1].r)) n++; return n ? { k:"mult", v:3 * n } : null; } },
      { id:"lastword", sign:"⇥", name:"Last word", fam:"Seat", r:1, text:"The card that ends the hand adds its chips as mult",
        score:function (h) { var c = h.cards[HAND_SIZE - 1]; return c && h.cards.length >= HAND_SIZE ? { k:"mult", v:rankChips(c.r) } : null; } }
    ];
    var JOKER_BY = {};
    for (var ji = 0; ji < JOKERS.length; ji++) JOKER_BY[JOKERS[ji].id] = JOKERS[ji];

    /* How much a paid hand fills the joker gauge: its strength, so a player
       who builds bigger hands earns jokers sooner, and a bust earns nothing. */
    var GAUGE_GAIN = { pair:1, twoPair:2, trips:3, straight:4, flush:4,
                       fullHouse:5, quads:6, straightFlush:8, royalFlush:10 };
    /* THE POT: the share of it a paid hand takes, by strength. The last
       hand of the deck takes all of it (potShare), Croupier adds 25 points. */
    var POT_SHARE = { pair:0.1, twoPair:0.2, trips:0.3, straight:0.4, flush:0.5,
                      fullHouse:0.6, quads:0.8, straightFlush:1, royalFlush:1 };
    /* What a pick draws by: common, rare, epic, legendary. Lucky charm
       doubles the three rare rows. */
    var PICK_WEIGHT = [0, 10, 5, 2, 0.7];
    /* Called shot: what each call pays when the hand makes it, or better.
       The harder the call, the more it pays. */
    var CALL_X = { pair:1.5, twoPair:2, trips:2.5, straight:3, flush:3, fullHouse:4, quads:5 };
    var CALLS = ["pair", "twoPair", "trips", "straight", "flush", "fullHouse", "quads"];

    /* ===================================================================
       THE CLIMB — what a level deals, one idea at a time.

       Level 1–2 is plain poker; enhanced cards arrive on 3, the first jokers
       — and the gauge that earns them — on 4, then a family of jokers every
       few levels (FAM_LEVEL), curses on 13 and veils on 16. The pair floor
       climbs with them: any pair, then 8s, 10s and J or better from 19. The
       web's free run (level 0) deals all of it; a playable deals a short,
       friendly set from CONFIG.play.
       =================================================================== */
    var FAM_LEVEL = { Mult:4, Luck:5, Rule:7, Fate:8, Bin:10, Seat:11, Curse:13, Grow:19, Survive:22, Risk:22 };
    function stageFor(n) {
      var fams = {}, f;
      if (!n) {
        if (CONFIG.web) {
          for (f in FAM_LEVEL) fams[f] = 1;
          return { fams:fams, mods:MODS, curse:true, veil:true, seer:true, floor:11 };
        }
        return { fams:{ Mult:1, Rule:1, Fate:1 }, mods:MODS, curse:false, veil:false, seer:false,
                 floor:CONFIG.play.pairFloor };
      }
      for (f in FAM_LEVEL) fams[f] = n >= FAM_LEVEL[f];
      return {
        fams: fams,
        mods: n >= 5 ? MODS : n >= 3 ? ["gold", "wild"] : [],
        curse: n >= 13, veil: n >= 16, seer: n >= 16,
        floor: n >= 19 ? 11 : n >= 13 ? 10 : n >= 7 ? 8 : 2
      };
    }

    /* The objective of every level, read off the bench (lab/slipdeck.html
       rules, 400 seeds a level, the line-reading pilot): the goal is its
       median over 1.5, so two stars is a median run and three a top-fifth
       one. Since the jokers are earned by the gauge (v1.6.0) the lab still
       deals them in the stream; a headless bench of this file with a pilot
       that picks by value put levels 4-19 within noise of the old medians
       at a gauge of 4, so the table was kept. It is not monotonic and should not be: the first jokers (4) pay
       far more than the pair floor of 7 and the curses of 13 let through. */
    var GOALS = [0,
       500,  500,  650, 2400, 2450, 2450, 1500, 1500, 1450, 1400,
      1400, 1400, 1200, 1200, 1200,  900,  900,  900,  750,  750,
       750,  700,  700,  700,  700,  700,  700,  650,  650,  650];

    /* --- state ---------------------------------------------------------- */
    var shoe, upcoming, hand, cur, flying, landing, rail, tally;
    var chute, binsThisHand, score, lives, lastCat, catStreak;
    var kept, binned, hands, busts, overflows, bestTotal, bestName, jokersTaken;
    var firstFrame, done;
    /* the joker economy: the gauge, a pick waiting to open or open, the FATE
       jokers spent this hand, the card in the Pocket, the hand Called shot
       named and the last card binned this hand (Rewind) */
    var gauge, pendingPick, opening, pick, used, pocket, called, lastBin;
    /* the pot: its chips, the coins flying into it, its last pulse; and the
       place Lucky seat lit for this hand (-1: none) */
    var pot = 0, potFly = [], potHit = 0, seat = -1;
    var drag = { on:false, sx:0, sy:0, x0:0, y0:0, free:false };   // free: the card may be lifted (FATE GESTURES)
    var lit = { who:"", idx:-1, t:0 };
    var L = {}, deckSprite = null;

    function has(id) {
      if (!rail) return false;              // no round yet: the guide's chart reads the hands bare
      for (var i = 0; i < rail.length; i++) if (rail[i].id === id) return true;
      return false;
    }
    function chuteCap() { return (has("greed") ? 1 : CHUTE_DEPTH) + (has("deep") ? 2 : 0); }
    function anyFam() { for (var f in STAGE.fams) if (STAGE.fams[f]) return true; return false; }
    function veiled(c) { return c.veil && !has("seer"); }

    /* ===================================================================
       DECK AND SHOE
       =================================================================== */

    function buildShoe() {
      var full = [], s, r, i, j, t;
      while (full.length < DECK_SIZE) {
        for (s = 0; s < 4; s++) for (r = 0; r < 13; r++) full.push({ r:r, s:s });
      }
      for (i = full.length - 1; i > 0; i--) {              // Fisher-Yates
        j = Rand.int(0, i); t = full[i]; full[i] = full[j]; full[j] = t;
      }
      shoe = full.slice(0, DECK_SIZE);
    }
    function cardsLeft() { return shoe.length + (upcoming ? 1 : 0); }

    /* Which line is this hand still on? A hand with no category yet is not
       "nothing": it is a flush draw, a straight draw, or a dead pile — and
       that is what the player has to read to decide. */
    function lineOf(cards) {
      var n = cards.length, i, lo = 99, hi = -1, sameSuit = true;
      if (n < 2) return "";                        // one card is on every line
      for (i = 0; i < n; i++) {
        if (cards[i].mod !== "wild" && cards[0].mod !== "wild" && cards[i].s !== cards[0].s) sameSuit = false;
        if (cards[i].r < lo) lo = cards[i].r;
        if (cards[i].r > hi) hi = cards[i].r;
      }
      if (sameSuit && n < HAND_SIZE) return "Flush draw";
      var seen = {};
      for (i = 0; i < n; i++) { if (seen[cards[i].r]) return ""; seen[cards[i].r] = 1; }
      if ((hi - lo) <= HAND_SIZE - 1 && n < HAND_SIZE) return "Straight draw";
      return "";
    }

    /* Would this card keep the hand alive? A rank already held, a shared suit,
       or a tight enough spread. Anything else is a card the shoe skips over. */
    function helps(card) {
      if (!hand.length) return true;
      for (var i = 0; i < hand.length; i++) if (hand[i].r === card.r) return true;
      return lineOf(hand.concat([card])) !== "";
    }

    /* A card dealt from the shoe may carry ONE of: a curse, a veil, an
       enhancement — each once the climb has opened it. `clean` keeps the
       curse off (the Compass names a suit, it does not hand over a trap). */
    function dress(c, clean) {
      c = { r:c.r, s:c.s };
      var roll = Rand.range(0, 1);
      var cr = STAGE.curse && !clean ? CURSE_RATE : 0, vr = STAGE.veil ? VEIL_RATE : 0;
      var er = STAGE.mods.length ? ENHANCE_RATE : 0;
      if (roll < cr) c.curse = true;
      else if (roll < cr + vr) c.veil = true;
      else if (roll < cr + vr + er) c.mod = Rand.pick(STAGE.mods);
      return c;
    }

    /* One deal, drawn one step ahead (`upcoming`) so the Seer can show it.
       The bias may reach a few cards down for one that keeps the hand on its
       line — SHOE_BIAS of the time, lower as the climb goes. */
    function draw() {
      if (!shoe.length) return null;
      var idx = 0;
      if (Rand.chance(SHOE_BIAS)) {
        var depth = Math.min(shoe.length, 10);
        for (var i = 0; i < depth; i++) { if (helps(shoe[i])) { idx = i; break; } }
      }
      return dress(shoe.splice(idx, 1)[0]);
    }
    /* A card put back into the deck goes in bare, at a random depth. */
    function toShoe(c) { shoe.splice(Rand.int(0, shoe.length), 0, { r:c.r, s:c.s }); }

    /* ===================================================================
       HAND EVALUATION — count ranks, count suits, look for a run, bent by
       the rule jokers. Then the COUNT: scoreHand turns a full hand into the
       steps the tally plays, each carrying the running chips and mult.
       =================================================================== */

    function numAsc(a, b) { return a - b; }
    function hasRun(vals, need, step) {
      if (vals.length < need) return false;
      var chain = 1;
      for (var i = 1; i < vals.length; i++) {
        var d = vals[i] - vals[i - 1];
        chain = (d >= 1 && d <= step) ? chain + 1 : 1;
        if (chain >= need) return true;
      }
      return need <= 1;
    }

    function evalHand(cards) {
      var n = cards.length, i, k;
      var out = { cat:"high", name:CAT_NAME.high, maxR:0, pairRv:0, scoring:[], parts:[] };
      if (!n) return out;

      var smear = has("smear"), rc = {}, sc = {}, wild = 0, c, key;
      for (i = 0; i < n; i++) {
        c = cards[i];
        rc[c.r] = (rc[c.r] || 0) + 1;
        if (c.mod === "wild") wild++;
        else { key = smear ? (SUIT_RED[c.s] ? 1 : 0) : c.s; sc[key] = (sc[key] || 0) + 1; }
      }
      var maxR = 0, pairs = 0, maxS = 0, pairRv = 0;
      for (k in rc) {
        if (rc[k] > maxR) maxR = rc[k];
        if (rc[k] === 2) { pairs++; pairRv = Math.max(pairRv, rvOf(+k)); }
      }
      for (k in sc) if (sc[k] > maxS) maxS = sc[k];

      /* Four fingers asks one card less of a flush or a straight; the hand
         still has to be full before either can be called. */
      var need = has("four") ? Math.max(3, HAND_SIZE - 1) : HAND_SIZE;
      var full = n >= HAND_SIZE;
      var flush = full && (maxS + wild) >= need;
      var vals = [];
      for (k in rc) { vals.push(+k + 1); if (+k === 0) vals.push(14); }   // the ace plays both ends
      vals.sort(numAsc);
      var straight = full && hasRun(vals, need, has("shortcut") ? 2 : 1);

      /* royal: the five ranks from 10 to the ace, all of them, in one suit */
      var royal = true;
      for (k = 10; k <= 14; k++) if (vals.indexOf(k) < 0) royal = false;

      /* Two families, read apart: what the RANKS make (a pair up to four
         of a kind) and what the LINE makes (a straight, a flush, both). In
         plain poker five cards hold one or the other, but a wild card, Four
         fingers or Smeared can make both at once — a pair AND a flush — and
         such a hand is counted once per hand it makes (scoreHand), the
         weakest first. A full house is one hand, not trips and a pair. */
      var kind = maxR === 4 ? "quads" : maxR === 3 && pairs >= 1 ? "fullHouse"
               : maxR === 3 ? "trips" : pairs >= 2 ? "twoPair" : pairs === 1 ? "pair" : null;
      var line = straight && flush && royal ? "royalFlush" : straight && flush ? "straightFlush"
               : flush ? "flush" : straight ? "straight" : null;
      var parts = [], ks = [], ls = [];
      for (i = 0; i < n; i++) { ks.push(rc[cards[i].r] >= 2); ls.push(true); }
      if (kind) parts.push({ cat:kind, scoring:ks });
      if (line) parts.push({ cat:line, scoring:ls });
      parts.sort(function (a, b) { return CAT_ORDER[a.cat] - CAT_ORDER[b.cat]; });

      var cat = parts.length ? parts[parts.length - 1].cat : "high";
      for (i = 0; i < n; i++) out.scoring.push(!!line || (!!kind && ks[i]));
      out.cat = cat; out.name = CAT_NAME[cat]; out.maxR = maxR; out.pairRv = pairRv;
      out.parts = parts;
      return out;
    }
    /* The name of a hand that may be two: "Pair + Flush", in the player's
       language, the weakest first like the count plays them. */
    function handName(parts) {
      var s = [];
      for (var i = 0; i < parts.length; i++) s.push(Lang.t(CAT_NAME[parts[i].cat]));
      return s.join(" + ");
    }

    /* `preview` draws nothing random (glass holds, lucky misses), so reading
       the chip under the card never moves the deal. */
    function potShare(cat) {
      if (cardsLeft() < HAND_SIZE) return 1;           // the last hand: all in
      return Math.min(1, (POT_SHARE[cat] || 0) + (has("croupier") ? 0.25 : 0));
    }
    function scoreHand(cards, preview) {
      var ev = evalHand(cards), i, q;
      var res = { cat:ev.cat, name:ev.name, bust:false, why:"", steps:[], parts:[],
                  chips:0, mult:0, total:0, streak:0, pot:0 };

      /* a pair under the floor does not pay — and busts the hand only when
         it is all the hand makes: beside a flush it is simply not counted */
      var parts = [];
      for (i = 0; i < ev.parts.length; i++) {
        if (ev.parts[i].cat === "pair" && ev.pairRv < STAGE.floor && !has("lowbar")) continue;
        parts.push(ev.parts[i]);
      }
      if (ev.cat === "high") { res.bust = true; res.why = "High card"; }
      else if (!parts.length) { res.bust = true; res.why = "Pair too low"; }
      else if (!has("exorcist")) {
        for (i = 0; i < cards.length; i++) if (cards[i].curse) { res.bust = true; res.why = "Cursed"; }
      }
      // a called hand missed busts, but only a FULL hand can miss it
      if (!res.bust && called && cards.length >= HAND_SIZE && CAT_ORDER[ev.cat] < CAT_ORDER[called]) {
        res.bust = true; res.why = "Missed call";
      }
      if (res.bust) return res;

      var top = parts[parts.length - 1].cat;
      res.cat = top; res.name = CAT_NAME[top];
      res.streak = top === lastCat ? catStreak + 1 : 1;

      /* The dice are thrown once per card, not once per count: a glass that
         shatters has shattered for both hands it sits in. */
      var lucky = [], shatter = [];
      for (i = 0; i < cards.length; i++) {
        lucky.push(cards[i].mod === "lucky" && !preview && Rand.chance(1 / 3));
        shatter.push(cards[i].mod === "glass" && !preview && Rand.chance(0.25));
      }
      /* the pot's share goes to the strongest hand, once */
      res.pot = POT_ON && cards.length >= HAND_SIZE ? Math.round(pot * potShare(top)) : 0;

      /* One COUNT per hand the cards make, each the whole count — its base,
         the cards that make IT, the special cards, the pot, the jokers —
         and the hand pays the sum. */
      for (q = 0; q < parts.length; q++) {
        var P = countPart(cards, parts[q], ev, res, lucky, shatter, q === parts.length - 1 ? res.pot : 0);
        res.parts.push(P);
        res.steps = res.steps.concat(P.steps);
        res.total += P.total;
      }
      var last = res.parts[res.parts.length - 1];
      res.chips = last.chips; res.mult = last.mult;
      return res;
    }
    function countPart(cards, part, ev, res, lucky, shatter, potChips) {
      var i, P = { cat:part.cat, scoring:part.scoring, steps:[], chips:0, mult:0, total:0 };
      var chips = BASE[part.cat][0], mult = BASE[part.cat][1];
      function step(who, idx, text, col) {
        P.steps.push({ who:who, idx:idx, text:text, col:col, chips:chips, mult:Math.max(1, mult) });
      }
      function apply(who, idx, e) {
        if (!e || !e.v) return;
        if (e.k === "chips")     { chips += e.v; step(who, idx, "+" + e.v, CHIP_COL); }
        else if (e.k === "mult") { mult += e.v;  step(who, idx, (e.v > 0 ? "+" : "") + e.v + Lang.t(" mult"), MULT_COL); }
        else                     { mult *= e.v;  step(who, idx, "×" + e.v, XMULT_COL); }
        P.steps[P.steps.length - 1].e = e;     // what the rail's preview reads
      }
      step("base", -1, "", GOLD);

      // the jokers read THIS hand: its category, the cards that make it
      var pev = { cat:part.cat, maxR:ev.maxR, pairRv:ev.pairRv, scoring:part.scoring };
      var h = { cards:cards, ev:pev, bins:binsThisHand, streak:res.streak, called:called, seat:seat };
      for (i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (part.scoring[i]) apply("card", i, { k:"chips", v:rankChips(c.r) });
        if (c.mod === "gold") apply("card", i, { k:"chips", v:40 });
        else if (lucky[i]) apply("card", i, { k:"mult", v:10 });
        else if (c.mod === "glass") {
          if (shatter[i]) step("card", i, Lang.t("Shattered"), MOD_COL.glass);
          else apply("card", i, { k:"xmult", v:2 });
        }
        if (c.curse) apply("card", i, { k:"mult", v:20 });     // only reached with Exorcist
      }
      /* the pot's share, as chips — before the jokers, so every one of
         them that multiplies multiplies the pot too */
      if (potChips) apply("pot", -1, { k:"chips", v:potChips });
      for (i = 0; i < rail.length; i++) {
        var J = JOKER_BY[rail[i].id];
        if (J.score) apply("joker", i, J.score(h, rail[i]));
      }

      P.chips = chips; P.mult = Math.max(1, mult);
      P.total = Math.round(P.chips * P.mult);
      return P;
    }

    /* ===================================================================
       LAYOUT — every coordinate derives from Layout, so the table stays
       clear of a notch, the HUD and the CTA bar on any device. From the top:
       the joker rail (medallions), the live card between its chevrons, the
       bins, what the hand is worth, the hand fanned at the foot. The look
       was picked in lab/slipdeck-table.html.
       =================================================================== */

    /* On the web the bottom row is the shell's: the level pill bottom-left,
       the round's three controls bottom-right (~55 px buttons, 26 px off the
       edge). The table stops above it, which gives the pill its own corner
       back — no --lv-hud-bottom. */
    var WEB_FOOT = 72;

    function layout() {
      var bottom = Layout.bottom - (CONFIG.web ? WEB_FOOT : 0);
      var band = bottom - Layout.top;

      L.railY = Layout.top + 6;
      L.railH = 120;
      L.medalR = 40;

      L.cardH  = Math.min(480, band * 0.44);
      L.cardW  = L.cardH * 0.715;
      L.cardCX = Layout.cx;
      L.cardCY = L.railY + L.railH + 24 + L.cardH / 2;

      L.slotGap = 13;
      L.slotW = Math.min(126, (Layout.w - (HAND_SIZE - 1) * L.slotGap) / HAND_SIZE);
      L.slotH = L.slotW * 1.4;
      L.slotY = bottom - 30 - L.slotH / 2;          // the fan's ends hang a little lower
      var row = HAND_SIZE * L.slotW + (HAND_SIZE - 1) * L.slotGap;
      L.slotX0 = Layout.cx - row / 2 + L.slotW / 2;
      L.valueY = L.slotY - L.slotH / 2 - 30;        // what the hand is worth, over it

      /* the bins and, under them once jokers are dealt, the joker gauge —
         two rows shared out of the room between the card and the hand */
      var mid = (L.cardCY + L.cardH / 2 + L.valueY - 26) / 2 + 4;
      L.binsY  = mid - 21;
      L.gaugeY = mid + 23;

      /* The canvas paints the same felt the page does, so the letterbox and
         the table never disagree on what green the room is. Built here, not
         per frame. */
      L.felt = ctx.createRadialGradient(Layout.cx, view.h * 0.36, 40,
                                        Layout.cx, view.h * 0.36, 900);
      L.felt.addColorStop(0, "#17402f");
      L.felt.addColorStop(0.56, "#0b2419");
      L.felt.addColorStop(1, "#040b08");

      L.gateY = L.cardCY;
      /* the pot: under the BIN gate, between the card and the left edge —
         a binned card is flicked left, its chips fall right below */
      L.potX = Layout.left + 64;
      L.potY = L.cardCY + L.cardH / 2 - 56;

      buildDeckSprite();
    }

    function slotX(i) { return L.slotX0 + i * (L.slotW + L.slotGap); }
    /* The hand is fanned: the middle slot up, the ends lower and turned out. */
    function slotPose(i) {
      var k = i - (HAND_SIZE - 1) / 2;
      return { x:slotX(i), y:L.slotY + k * k * 7 - 4, r:k * 0.07 };
    }
    function railW() { return (Layout.w - (SLOTS - 1) * 12) / SLOTS; }
    function railX(i) { return Layout.left + i * (railW() + 12) + railW() / 2; }

    /* The deck back is a lattice of ~30 strokes and it never changes: raster
       it once per layout instead of stroking it three times a frame. Sized
       with view.dpr and rebuilt only when the size changes. */
    var deckKey = "";
    function buildDeckSprite() {
      var w = Math.round(L.cardW), h = Math.round(L.cardH), k = w + "x" + h + "@" + view.dpr;
      if (w <= 0 || h <= 0 || k === deckKey) return;
      deckKey = k;
      deckSprite = freeCanvas(deckSprite);
      var c = document.createElement("canvas");
      c.width = Math.round(w * view.dpr); c.height = Math.round(h * view.dpr);
      var g = c.getContext("2d"), r = w * 0.085;
      g.scale(view.dpr, view.dpr);
      roundRectOn(g, 0.5, 0.5, w - 1, h - 1, r);
      g.fillStyle = "#14432f"; g.fill();
      g.lineWidth = 3; g.strokeStyle = "rgba(245,196,81,.30)"; g.stroke();
      g.save();
      roundRectOn(g, 12, 12, w - 24, h - 24, r * 0.7);
      g.clip();
      g.strokeStyle = "rgba(245,196,81,.16)"; g.lineWidth = 3;
      for (var i = -h; i < w + h; i += 22) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i - h, h); g.stroke();
      }
      g.restore();
      deckSprite = c;
    }

    /* ===================================================================
       TIPS — a card the first time an idea lands on the table.

       The rules arrive one at a time with the climb, and each is told ONCE,
       at the moment it matters: the first joker dealt, the first cursed
       card, the first hand counted. The card is the motor's own (.mt-card,
       motor.css) on a veil, and while it is open the round is HELD
       (Game.held, docs/ENGINE.md): nothing is dealt, nothing is counted. A
       tap anywhere puts it away. What has been told is kept per player
       (Store, `tips:<slug>`) and erased with the rest of the game's data.

       A tap on a joker of the rail opens the same card on that joker, any
       time: the rail only names them, and what one does is never more than
       a tap away. The basics and the count carry a button to the chart of
       the poker hands (POKER HANDS, below), and a tap on the hand's line
       opens it straight.
       =================================================================== */

    var TIPS = {
      basics: { eye:"How to play", title:"Build a poker hand", hands:true, lines:[
        "Swipe right to keep the card, left to bin it.",
        "Five cards make a hand, paid as poker. The run ends when the deck runs out." ] },
      count: { eye:"Your first hand", title:"Chips × mult", hands:true, lines:[
        "Each card that makes the hand adds its value in chips. A face is worth 10, an ace 11.",
        "Then special cards and jokers add theirs, left to right. The hand pays chips × mult." ] },
      double: { eye:"How scoring works", title:"Two hands in one", hands:true, lines:[
        "A hand can make two poker hands at once, like a pair and a flush. It pays both.",
        "Wild cards and some jokers make a double hand possible." ] },
      bust: { eye:"A hand that does not pay", title:"Bust", lines:[
        "High card, a pair too low or a cursed card: the hand busts and costs a life." ] },
      bins: { eye:"Bins", title:"No bins left", lines:[
        "You may bin {n} cards per hand. The next one costs a life." ] },
      floor: { eye:"New rule", title:"Pairs of {r} or better", say:"A lower pair busts the hand", lines:[
        "From this level on, a single pair only pays from {r} up.",
        "A lower pair busts the hand. Two pair and better always pay." ] },
      joker: { eye:"New", title:"Jokers", say:"Paid hands fill the joker gauge", lines:[
        "Paid hands fill the joker gauge, strong ones faster. A full gauge deals you two jokers to choose from.",
        "A joker lasts the whole run, on every hand." ] },
      fate: { eye:"New", title:"Fate jokers", say:"Push a card up onto one", lines:[
        "Push the card up onto a Fate joker to play it. Each one works once per hand." ] },
      pot: { eye:"New", title:"The pot", say:"Bins feed the next paid hand", hands:true, lines:[
        "Binned cards drop their chips into the pot. Each paid hand takes a share, bigger for a strong hand.",
        "A bust burns half the pot. The deck's last hand takes all of it." ] },
      xmult: { eye:"How scoring works", title:"Add or multiply", say:"A × joker multiplies what is on its left", demo:true, lines:[
        "A × joker multiplies everything on its left. It pays the most at the right end of the rail." ] },
      gold:  { eye:"Special card", title:"Gold", lines:[ "A gold card adds 40 chips to its hand." ] },
      glass: { eye:"Special card", title:"Glass", say:"Doubles the mult, or shatters", lines:[ "A glass card doubles the mult — but one time in four it shatters and gives nothing." ] },
      wild:  { eye:"Special card", title:"Wild", say:"Counts as every suit", lines:[ "A wild card counts as every suit: it fits any flush." ] },
      lucky: { eye:"Special card", title:"Lucky", lines:[ "A lucky card gives +10 mult one time in three." ] },
      curse: { eye:"Danger", title:"Cursed card", say:"Keep a cursed card and the hand busts", lines:[
        "Keep a cursed card and the whole hand busts, whatever else it holds. Bin it.",
        "The Exorcist joker turns a curse into +20 mult." ] },
      veil:  { eye:"Danger", title:"Veiled card", lines:[
        "A veiled card's suit stays hidden until you keep it.",
        "The Seer joker lifts every veil." ] }
    };

    function tipsKey() { return "tips:" + (CONFIG.slug || "slipdeck"); }
    function told() { var s = Store.get(tipsKey(), null); return s && typeof s === "object" ? s : {}; }
    function wipe() { Store.del(tipsKey()); Store.del(seenKey()); }

    var tipOpen = null, tipQueue = [];

    function fill(str, vars) {
      return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
    }
    /* Queue the tip `key` unless the player has already been told. `id` is
       what is remembered, so a rule that changes (the pair floor) is told
       again under its new value. `again` is the player ASKING — a tap on the
       thing the tip is about — and is answered whatever was told before. */
    function tip(key, vars, id, again) {
      if (done) return;
      /* THE WEB BUILD HAS A GUIDE (packages/webshell/guide.js), and a rule is
         a page of it: a tap on the table opens that page, and an idea met
         for the first time is NAMED by a notice whose line in the log opens
         it — no card on the way, the round is never stopped to teach. Only
         a tip with a `say` is named: a hidden rule or a choice to make. What
         the count, a callout or the HUD already shows (the count, a bust,
         the bins, a gold card) is not. A playable has no guide and keeps the
         cards below. */
      var GD = window.__GUIDE__;
      if (GD) {
        if (again) GD.open(key);
        else if (TIPS[key].say) {
          Notify.learn(key, fill(Lang.t(TIPS[key].title), vars),
                       { sub:fill(Lang.t(TIPS[key].say), vars), mark:id });
        }
        return;
      }
      var mark = id || key, s = told();
      if (!again) {
        if (s[mark]) return;
        s[mark] = 1; Store.set(tipsKey(), s);
      }
      var T = TIPS[key], lines = [], i;
      for (i = 0; i < T.lines.length; i++) lines.push(fill(Lang.t(T.lines[i]), vars));
      tipQueue.push({ eye:Lang.t(T.eye), title:fill(Lang.t(T.title), vars), lines:lines, demo:T.demo,
                      buttons:T.hands ? [{ label:Lang.t("Poker hands"), fn:handsCard }] : null });
      if (!tipOpen) nextTip();
    }
    /* A tap on a joker of the rail deals its CARD again — the one the pick
       showed, grown out of its medallion — with what it holds right now
       under it: a counter, the gauge, whether a Fate joker is ready. */
    function jokerCard(i) {
      var inst = rail[i], id = inst.id, J = JOKER_BY[id], lines = [], why;
      var now = id === "ascetic" ? inst.n : id === "veteran" ? hands : 0;
      if (now) lines.push(fill(Lang.t("Now: +{n} mult"), { n:now }));
      if (id === "collector" && catStreak > 1) lines.push(fill(Lang.t("Now: {n} in a row"), { n:catStreak }));
      if (id === "hothand" || id === "charm" || id === "third" || id === "redeal" || id === "ticket") {
        lines.push(fill(Lang.t("Joker gauge: {n} / {max}"), { n:gauge, max:PICK_GAUGE }));
      }
      if (J.act) { why = fateWhyNot(id); lines.push(why ? Lang.t(why) : Lang.t("Ready")); }
      var btns = [];
      if (J.xm) btns.push({ label:Lang.t("+ or ×"), plate:true, fn:function () { tip("xmult", null, null, true); } });
      if (J.act && window.__GUIDE__) btns.push({ label:Lang.t("Fate jokers"), plate:true, fn:function () { tip("fate", null, null, true); } });
      tipQueue.unshift({ joker:id, from:i, lines:lines, ready:J.act && !why, buttons:btns.length ? btns : null });
      if (!tipOpen) nextTip();
    }

    /* ===================================================================
       POKER HANDS — the chart, one row per hand, strongest on top.

       Each row deals the hand it names: five small cards, the ones that
       count lifted and the kickers dimmed — the same read the count gives
       on the table, because the lift comes out of evalHand itself — then
       its name and what it opens the count on, chips × mult in the table's
       own blue and red. Only the hands that pay are listed — a high card
       is not a hand here, the bust rule says so — and the pair carries the
       floor once the climb has set one. Reached from the basics card
       and from a tap on the hand's line; the hand being built is lit.
       =================================================================== */

    var CHART = [
      ["royalFlush",    [[9,0],[10,0],[11,0],[12,0],[0,0]]],
      ["straightFlush", [[8,1],[9,1],[10,1],[11,1],[12,1]]],
      ["quads",         [[11,0],[11,1],[11,2],[11,3],[4,2]]],
      ["fullHouse",     [[7,0],[7,1],[7,3],[2,2],[2,0]]],
      ["flush",         [[12,3],[10,3],[8,3],[5,3],[1,3]]],
      ["straight",      [[4,2],[5,3],[6,1],[7,0],[8,2]]],
      ["trips",         [[6,3],[6,2],[6,1],[12,0],[1,2]]],
      ["twoPair",       [[10,1],[10,3],[3,0],[3,2],[8,3]]],
      ["pair",          [[12,0],[12,1],[2,3],[5,2],[9,0]]]
    ];
    var MINI_W = 58, MINI_H = 80, MINI_STEP = 32, MINI_LIFT = 8;

    function handsCard() {
      if (window.__GUIDE__) { window.__GUIDE__.open("hands"); return; }
      tipQueue.unshift({ eye:Lang.t("Strongest on top"), title:Lang.t("Poker hands"), lines:[], chart:true });
      if (!tipOpen) nextTip();
    }

    /* One small card on its own canvas `g`: the corner index and a big pip,
       in the table's inks. The index is the one thing read on it, so it sits
       at the type floor (20 px); everything else is the card's silhouette.
       A kicker is shaded rather than faded: the cards overlap, and a faded
       one shows the card under it through its face. */
    function miniCard(g, c, x, y, w, h, dim) {
      var r = w * 0.12, col = SUIT_RED[c.s] ? INK_RED : INK_BLACK;
      g.save();
      roundRectOn(g, x, y, w, h, r);
      var gr = g.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, "#fbf7ec"); gr.addColorStop(1, "#ece2c9");
      g.fillStyle = gr; g.fill();
      g.lineWidth = 2; g.strokeStyle = "#c9a24a"; g.stroke();
      g.fillStyle = col;
      g.textAlign = "center"; g.textBaseline = "middle";
      g.font = font(20, 900);
      g.fillText(RANKS[c.r], x + 16, y + 15);
      g.save(); g.translate(x + 16, y + 34); pipPath(g, c.s, 15); g.fill(); g.restore();
      g.save(); g.translate(x + w * 0.62, y + h * 0.64); pipPath(g, c.s, w * 0.46); g.fill(); g.restore();
      if (dim) { roundRectOn(g, x, y, w, h, r); g.fillStyle = "rgba(6,12,10,.5)"; g.fill(); }
      g.restore();
    }

    function handRow(cat, deal, now) {
      var cards = [], i;
      for (i = 0; i < deal.length; i++) cards.push({ r:deal[i][0], s:deal[i][1] });
      var scoring = evalHand(cards).scoring;
      var row = document.createElement("div");
      row.className = "sd-hrow" + (cat === now ? " now" : "");

      var cw = MINI_STEP * (cards.length - 1) + MINI_W, ch = MINI_H + MINI_LIFT, k = view.dpr || 1;
      var cv = document.createElement("canvas");
      cv.width = Math.round(cw * k); cv.height = Math.round(ch * k);
      cv.style.width = cw + "px"; cv.style.height = ch + "px";
      var g = cv.getContext("2d");
      g.scale(k, k);
      for (i = 0; i < cards.length; i++) {
        miniCard(g, cards[i], i * MINI_STEP + 1, (scoring[i] ? 0 : MINI_LIFT) + 1, MINI_W - 2, MINI_H - 2, !scoring[i]);
      }
      row.appendChild(cv);

      var txt = document.createElement("div"), nm = document.createElement("b"), fig = document.createElement("span");
      txt.className = "sd-hname";
      nm.textContent = upper(Lang.t(CAT_NAME[cat]));
      txt.appendChild(nm);
      fig.className = "sd-hfig";
      fig.innerHTML = '<i class="c"></i><span>x</span><i class="m"></i>';
      fig.querySelector(".c").textContent = BASE[cat][0];
      fig.querySelector(".m").textContent = BASE[cat][1];
      if (POT_ON) {
        var ps = document.createElement("span");
        ps.className = "sd-hpot";
        ps.textContent = fill(Lang.t("Pot {n}%"), { n:Math.round(POT_SHARE[cat] * 100) });
        fig.appendChild(ps);
      }
      txt.appendChild(fig);
      if (cat === "pair" && STAGE && STAGE.floor > 2) {
        var fl = document.createElement("em");
        fl.textContent = fill(Lang.t("{r} or better"), { r:rankWord(STAGE.floor) });
        txt.appendChild(fl);
      }
      row.appendChild(txt);
      return row;
    }

    /* + OR ×, shown: the red pill adds to the mult, the orange burst
       multiplies it — each with what it does to the same red chip. */
    function buildXDemo() {
      var box = document.createElement("div");
      box.className = "sd-xdemo";
      [["+9", false, 4, 13, "adds to the mult"], ["×2", true, 13, 26, "multiplies the mult"]].forEach(function (d) {
        var row = document.createElement("div"), k = view.dpr || 1, cv = document.createElement("canvas");
        row.className = "sd-xrow";
        cv.width = Math.round(84 * k); cv.height = Math.round(64 * k);
        cv.style.width = "84px"; cv.style.height = "64px";
        var g = cv.getContext("2d");
        g.scale(k, k);
        if (d[1]) burstOn(g, 42, 32, d[0], 1.25); else pillOn(g, 42, 32, d[0], MULT_BOX, 1.25);
        row.appendChild(cv);
        var fig = document.createElement("span");
        fig.className = "sd-hfig";
        fig.innerHTML = '<i class="m"></i><span>→</span><i class="m"></i>';
        fig.children[0].textContent = d[2]; fig.children[2].textContent = d[3];
        row.appendChild(fig);
        var em = document.createElement("em");
        em.textContent = Lang.t(d[4]);
        row.appendChild(em);
        box.appendChild(row);
      });
      return box;
    }

    function buildHands() {
      var box = document.createElement("div"), i;
      var now = hand && hand.length > 1 && !tally ? evalHand(hand).cat : null;
      box.className = "sd-hands";
      for (i = 0; i < CHART.length; i++) box.appendChild(handRow(CHART[i][0], CHART[i][1], now));
      return box;
    }

    /* The card, on its veil. A card may carry BUTTONS — the chart of the
       poker hands, + or × — and then a tap on a button acts and a tap
       anywhere else puts the card away, which is what its tap line says.
       A joker's own card is laid out apart (jokerShow). */
    function nextTip() {
      var t = tipQueue.shift(), frame = document.getElementById("frame");
      if (!t || !frame) { tipOpen = null; return; }
      if (t.joker) { jokerShow(t, frame); return; }
      var lay = document.createElement("div"), mc = document.createElement("div"), i, p;
      lay.className = "sd-tip";
      mc.className = "mt-card sd-tc" + (t.chart ? " sd-chart" : "");
      if (t.col) mc.style.setProperty("--tc", t.col);
      mc.innerHTML = '<p class="mt-eyebrow"></p><h2 class="mt-h wrap"></h2><div class="mt-body"></div><p class="mt-tap"></p>';
      mc.querySelector(".mt-eyebrow").textContent = upper(t.eye);
      mc.querySelector(".mt-h").textContent = upper(t.title);
      mc.querySelector(".mt-tap").textContent = upper(Lang.t(t.buttons ? "Tap outside to close" : "Tap to continue"));
      for (i = 0; i < t.lines.length; i++) {
        p = document.createElement("p"); p.textContent = t.lines[i];
        mc.querySelector(".mt-body").appendChild(p);
      }
      if (t.chart) mc.querySelector(".mt-body").appendChild(buildHands());
      if (t.demo) {                                  // under the first line, before the rest
        var bd = mc.querySelector(".mt-body");
        bd.insertBefore(buildXDemo(), bd.children[1] || null);
      }
      if (t.buttons) {
        var row = document.createElement("div");
        row.className = "sd-btns";
        for (i = 0; i < t.buttons.length; i++) row.appendChild(tipButton(t.buttons[i]));
        mc.querySelector(".mt-body").appendChild(row);
      }
      lay.appendChild(mc);
      frame.appendChild(lay);
      tipOpen = { node:lay, at:Date.now() };
      lay.addEventListener("pointerdown", function (e) { e.stopPropagation(); closeTip(); });
      requestAnimationFrame(function () { lay.classList.add("on"); });
      Sound.cue("tip", 0.35, 1.1, 620, 0.06, "triangle");
      Music.duck(0.45, 0.3);
      drag.on = false; liftOff();
    }
    /* The joker's card on the veil, grown out of its medallion on the rail
       (--fx / --fy: the medallion's offset from the middle of the frame). */
    function jokerShow(t, frame) {
      var lay = document.createElement("div"), box = document.createElement("div"), i, p;
      lay.className = "sd-tip sd-jtip";
      box.className = "mt-card sd-jshow";            // a card with no chrome, like the pick's: its tap line is the motor's
      box.style.setProperty("--fx", Math.round(railX(t.from) - view.w / 2) + "px");
      box.style.setProperty("--fy", Math.round(L.railY + 44 - view.h / 2) + "px");
      box.appendChild(jokerNode(t.joker, { w:420 }));
      for (i = 0; i < t.lines.length; i++) {
        p = document.createElement("p");
        p.className = "sd-jnow" + (t.ready && i === t.lines.length - 1 ? " ready" : "");
        p.textContent = t.lines[i];
        box.appendChild(p);
      }
      if (t.buttons) {
        var row = document.createElement("div");
        row.className = "sd-btns";
        for (i = 0; i < t.buttons.length; i++) row.appendChild(tipButton(t.buttons[i]));
        box.appendChild(row);
      }
      p = document.createElement("p");
      p.className = "mt-tap";
      p.textContent = upper(Lang.t("Tap to continue"));
      box.appendChild(p);
      lay.appendChild(box);
      frame.appendChild(lay);
      tipOpen = { node:lay, at:Date.now() };
      lay.addEventListener("pointerdown", function (e) { e.stopPropagation(); closeTip(); });
      requestAnimationFrame(function () { lay.classList.add("on"); });
      Sound.cue("tip", 0.35, 0.75, 620, 0.06, "triangle");
      Music.duck(0.45, 0.3);
      drag.on = false; liftOff();
    }
    function tipButton(b) {
      var n = document.createElement("button");
      n.type = "button";
      n.className = "btn btn-sm" + (b.plate ? " btn-plate" : "");
      n.textContent = upper(b.label);
      if (b.off) n.disabled = true;
      n.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
      n.addEventListener("click", function (e) {
        e.stopPropagation();
        if (b.off || !tipOpen) return;
        closeTip(true);
        b.fn();
      });
      return n;
    }
    function closeTip(now) {
      if (!tipOpen || (!now && Date.now() - tipOpen.at < 300)) return;   // not the tap that opened it
      var n = tipOpen.node;
      n.classList.add("off");
      setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 260);
      Music.unduck();
      tipOpen = null;
      if (tipQueue.length) nextTip();
    }
    function dropTips() {
      tipQueue = [];
      if (!tipOpen) return;
      var n = tipOpen.node;
      if (n.parentNode) n.parentNode.removeChild(n);
      Music.unduck();
      tipOpen = null;
    }

    /* ===================================================================
       FATE — the jokers the card is pushed up onto, once per hand each.

       They act on the card in play or on the next one, so they wait for a
       card to have landed and for no hand to be in its count. They are
       played with the card pushed up (FATE GESTURES); a tap deals the joker's card,
       with whether it is ready or why not (jokerCard).
       =================================================================== */

    var SUIT_GLYPH = ["♠", "♥", "♦", "♣"];

    function fateWhyNot(id) {
      if (used[id]) return "Used this hand — ready on the next one";
      if (id === "called") {
        if (called) return fill(Lang.t("Called: {hand}"), { hand:Lang.t(CAT_NAME[called]) });
        if (hand.length > 2) return "Too late: call before your third card";
      }
      if (!cur || cur["in"] < 1 || tally || State !== "playing") return "Wait for the next card";
      if (id === "compass" && !upcoming) return "No card left to steer";
      if (id === "rewind" && !lastBin) return "Bin a card first";
      return "";
    }
    function suitLeft(s) {
      for (var i = 0; i < shoe.length; i++) if (shoe[i].s === s) return true;
      return !!(upcoming && upcoming.s === s);
    }

    function spent(i, id) {
      used[id] = 1;
      Fx.burst(railX(i), L.railY + 44, { color:[FAM_COL.Fate, "#ffffff"], count:14, speed:300, life:0.4, grav:300 });
      Sound.cue("fate", 0.45, 1.1, 740, 0.1, "triangle");
    }
    /* Compass: the next card is drawn from the named suit — never a cursed
       one — and the one it replaces goes back into the deck. */
    function useCompass(i, s) {
      if (fateWhyNot("compass")) return;
      if (!(upcoming && upcoming.s === s)) {
        var idx = -1, k;
        for (k = 0; k < shoe.length; k++) if (shoe[k].s === s) { idx = k; break; }
        if (idx < 0) { Notify.say(fill(Lang.t("No {s} left"), { s:SUIT_GLYPH[s] }), { kind:"warn" }); return; }
        var next = dress(shoe.splice(idx, 1)[0], true);
        if (upcoming) toShoe(upcoming);
        upcoming = next;
      }
      spent(i, "compass");
      Pop.show("bonus", { word:fill(Lang.t("Next card: {s}"), { s:SUIT_GLYPH[s] }), at:"top" });
    }
    /* Reshuffle: the card in play goes back into the deck at a random depth.
       No bin is spent and no card is lost: it may come back. */
    function useReshuffle(i) {
      if (fateWhyNot("reshuffle")) return;
      var c = cur.card;
      flying.push({ card:c, x:L.cardCX + cur.x, y:L.cardCY + cur.y, vx:0, vy:-1300, rot:cur.rot, spin:2.4, a:1 });
      toShoe(c);
      cur = null; dealWait = DEAL_WAIT;
      spent(i, "reshuffle");
      showDeck();
    }
    /* Pocket: one card kept aside, out of every hand, until it is swapped
       back in for the card in play. */
    function usePocket(i) {
      if (fateWhyNot("pocket")) return;
      var c = cur.card;
      if (!pocket) { pocket = c; cur = null; dealWait = DEAL_WAIT; }
      else { var p = pocket; pocket = c; cur = { card:p, x:0, y:0, rot:0, "in":0 }; }
      spent(i, "pocket");
    }
    /* Rewind: the last card binned this hand comes back into the hand, and
       its bin with it. A card the Recycler had sent under the deck is taken
       back out of it. */
    function useRewind(i) {
      if (fateWhyNot("rewind")) return;
      var c = lastBin, k;
      lastBin = null;
      chute = Math.max(0, chute - 1); binsThisHand = Math.max(0, binsThisHand - 1); binned--;
      if (c.potted) { pot = Math.max(0, pot - c.potted); c.potted = 0; potHit = 1; }
      for (k = 0; k < rail.length; k++) if (rail[k].id === "ascetic" && rail[k].n > 0) rail[k].n--;
      if (c.recycled) {
        for (k = shoe.length - 1; k >= 0; k--) if (shoe[k].r === c.r && shoe[k].s === c.s) { shoe.splice(k, 1); break; }
        c.recycled = false;
        showDeck();
      }
      spent(i, "rewind");
      kept++;
      c.veil = false;
      landing.push({ card:c, fx:Layout.left + 40, fy:L.gateY, frot:-0.3, slot:hand.length, t:0 });
      hand.push(c);
      if (hand.length >= HAND_SIZE) {
        // the card in play stays the next one dealt
        if (cur) { if (upcoming) shoe.unshift({ r:upcoming.r, s:upcoming.s }); upcoming = cur.card; cur = null; }
        resolveHand();
      }
    }
    /* Called shot: the hand is named before its third card. */
    function useCall(i, cat) {
      if (fateWhyNot("called")) return;
      called = cat;
      spent(i, "called");
      Pop.show("bonus", { word:fill(Lang.t("Called: {hand}"), { hand:Lang.t(CAT_NAME[cat]) }),
                          sub:fill(Lang.t("x{x} mult"), { x:CALL_X[cat] }), at:"top" });
    }

    /* ===================================================================
       FATE GESTURES — the card has three ways out: left bins it, right
       keeps it, UP plays a Fate joker.

       Every Fate joker is played the same way (chosen in
       lab/slipdeck-fate.html, F): the card in play pushed up off the
       table onto the joker on the rail, and let go there. Compass and
       Called shot pick something: the card held over one lays its choices
       under the rail — four suits, the hands — and the finger slides down
       onto one before it lets go. Let go anywhere else and the card goes
       back, no decision taken — unless it was brought back down into the
       lane past a gate, which is a swipe again. The rail itself only
       reads: a tap deals the joker's card. A mouse drags the same way.
       =================================================================== */

    var UP_START = 110;          // how far up the card goes, more up than sideways, before it is playing a joker
    /* The card pushed up: on, the finger, the choice joker whose choices
       are open, the not-ready joker already warned about. */
    var lift = { on:false, x:0, y:0, open:null, warned:null };
    function liftOff() { lift.on = false; lift.open = null; lift.warned = null; }

    function railIdx(id) {
      for (var i = 0; i < rail.length; i++) if (rail[i].id === id) return i;
      return -1;
    }
    function pocketBox() { var w = 92, h = w * 1.4; return { x:Layout.right - 56, y:L.gateY - 64 - h / 2, w:w, h:h }; }
    function isChoice(id) { return id === "compass" || id === "called"; }
    /* Some Fate joker of the rail can be played now: the card may go up. */
    function fateReady() {
      for (var i = 0; i < rail.length; i++) if (JOKER_BY[rail[i].id].act && !fateWhyNot(rail[i].id)) return true;
      return false;
    }
    /* The Fate joker whose column of the rail the finger is in, or -1. A
       little under the rail still counts: the card is in the way of it. */
    function liftAt(p) {
      if (p.y > L.railY + L.railH + 20) return -1;
      var i = railAt({ x:p.x, y:Math.max(p.y, L.railY) });
      return i >= 0 && JOKER_BY[rail[i].id].act ? i : -1;
    }

    /* The choices a Compass or a Called shot lays under the rail. */
    function fateChoices(id) {
      var out = [], k, y0 = L.railY + L.railH;
      if (id === "compass") {
        for (k = 0; k < 4; k++) out.push({ val:k, x:Layout.cx + (k - 1.5) * 152, y:y0 + 96, r:62, off:!suitLeft(k) });
      } else if (id === "called") {
        var w = Math.min(420, Layout.w - 40);
        for (k = 0; k < CALLS.length; k++) out.push({ val:CALLS[k], x:Layout.cx, y:y0 + 56 + k * 64, w:w, h:54 });
      }
      return out;
    }
    /* What the card would play if the finger let go at p: a ready joker
       that asks for nothing under it, or a choice of the open one. */
    function liftDrop(p) {
      var i = liftAt(p), id, cs, k, c;
      if (i >= 0) {
        id = rail[i].id;
        return !isChoice(id) && !fateWhyNot(id) ? { id:id, i:i } : null;
      }
      if (!lift.open || fateWhyNot(lift.open)) return null;
      cs = fateChoices(lift.open);
      for (k = 0; k < cs.length; k++) {
        c = cs[k];
        if (c.off) continue;
        if (c.r ? (p.x - c.x) * (p.x - c.x) + (p.y - c.y) * (p.y - c.y) < (c.r + 10) * (c.r + 10)
                : Math.abs(p.x - c.x) < c.w / 2 + 6 && Math.abs(p.y - c.y) < c.h / 2 + 5) {
          return { id:lift.open, i:railIdx(lift.open), val:c.val };
        }
      }
      return null;
    }
    /* The card follows the finger up; past UP_START it is playing a joker
       for the rest of the drag. Over a choice joker its choices open, and
       stay open while the finger slides down past a neighbour; over a joker
       not ready yet the finger is told why, once — unless choices are open. */
    function liftMove(p) {
      lift.x = p.x; lift.y = p.y;
      if (!lift.on && cur && cur.y < -UP_START && -cur.y > Math.abs(cur.x)) lift.on = true;
      if (!lift.on) return;
      var i = liftAt(p), id;
      if (i < 0) return;
      id = rail[i].id;
      if (fateWhyNot(id)) {
        // on the way down to an open joker's choices, a neighbour is crossed, not aimed at
        if (lift.warned !== id && !lift.open) { lift.warned = id; Notify.say(fateWhyNot(id), { kind:"warn", key:"fate" }); }
      } else if (isChoice(id)) lift.open = id;
    }
    /* Let go while playing a joker: play what is under the finger, or
       take the card back — a swipe again if it came down past a gate. */
    function liftRelease(p) {
      var hit = p ? liftDrop(p) : null;
      liftOff();
      if (hit) {
        if (hit.id === "compass") useCompass(hit.i, hit.val);
        else if (hit.id === "called") useCall(hit.i, hit.val);
        else if (hit.id === "reshuffle") useReshuffle(hit.i);
        else if (hit.id === "pocket") usePocket(hit.i);
        else if (hit.id === "rewind") useRewind(hit.i);
        return;
      }
      if (cur && cur.y > -60 && Math.abs(cur.x) >= SWIPE_DIST) decide(cur.x > 0 ? 1 : -1);
    }

    /* A tap on a chevron is a finger that wanted to move the card: the
       card leans that way and springs back, which says how it is done. */
    function gateAt(p) {
      if (Math.abs(p.y - L.gateY) > 60) return 0;
      return p.x < Layout.left + 110 ? -1 : p.x > Layout.right - 110 ? 1 : 0;
    }
    function nudge(side) {
      if (!cur || cur["in"] < 1 || drag.on) return;
      cur.x = side * 56; cur.y = -4; cur.rot = side * 0.09;
    }

    /* ===================================================================
       HINT — now and then the table shows what answers a finger.

       After a couple of seconds with no press, a faint gold aura breathes over
       every element a tap explains, top to bottom, the deck and the lives
       of the HUD with them — and a ready Fate joker draws the push that
       plays it, a dot travelling up from the card. Any press puts it off again.
       =================================================================== */

    var HINT_IDLE = 2.5, HINT_EVERY = 5, HINT_LEN = 1.9;
    var hintT = -1, idleT = 0, hintNext = HINT_IDLE, clock = 0;

    function hintPoke() { idleT = 0; hintNext = HINT_IDLE; }
    function hudHint(on) {
      var ids = ["hud-left", "hud-right"], n, k;
      for (k = 0; k < ids.length; k++) {
        n = document.getElementById(ids[k]);
        if (n) { if (on) n.classList.add("sd-hint"); else n.classList.remove("sd-hint"); }
      }
    }
    function tickHint(dt) {
      if (hintT >= 0) {
        hintT += dt;
        if (hintT > HINT_LEN) { hintT = -1; hudHint(false); }
        return;
      }
      if (done || tally || pick || tipOpen || drag.on || !cur || cur["in"] < 1) return;
      idleT += dt;
      if (idleT >= hintNext) { hintT = 0; hintNext = idleT + HINT_EVERY; hudHint(true); }
    }

    /* Every element a tap explains (explainAt), in reading order. */
    function hintZones() {
      var z = [], i, q, b, cap, x0, x1;
      for (i = 0; i < SLOTS; i++) if (rail[i] || anyFam()) z.push({ x:railX(i), y:L.railY + 44, r:L.medalR + 6 });
      if (pocket || has("pocket")) { b = pocketBox(); z.push({ x:b.x, y:b.y, w:b.w + 10, h:b.h + 10 }); }
      cap = chuteCap(); x0 = Layout.cx - 100; x1 = Layout.cx + 24 + (cap - 1) * 34;
      z.push({ x:(x0 + x1) / 2, y:L.binsY, w:x1 - x0 + 20, h:40 });
      if (anyFam()) { x1 = Layout.cx + 22 + (PICK_GAUGE - 1) * 34; z.push({ x:(x0 + x1) / 2, y:L.gaugeY, w:x1 - x0 + 20, h:40 }); }
      if (POT_ON) z.push({ x:L.potX, y:L.potY, r:58 });
      if (pv && pv.v && hand.length) z.push({ x:Layout.cx, y:L.valueY, w:440, h:46 });
      for (i = 0; i < hand.length; i++) { q = slotPose(i); z.push({ x:q.x, y:q.y, w:L.slotW + 8, h:L.slotH + 8 }); }
      return z;
    }
    function drawHint() {
      if (hintT < 0 || tally) return;
      var z = hintZones(), k, u, a, j, g;
      ctx.save();
      for (k = 0; k < z.length; k++) {
        u = (hintT - k * 0.05) / 1.1;
        if (u <= 0 || u >= 1) continue;
        a = Math.sin(Math.PI * u);
        for (j = 0; j < 2; j++) {                    // a glow faked with two rings
          g = 3 + j * 6;
          ctx.beginPath();
          if (z[k].r) ctx.arc(z[k].x, z[k].y, z[k].r + g, 0, Math.PI * 2);
          else roundRect(z[k].x - z[k].w / 2 - g, z[k].y - z[k].h / 2 - g, z[k].w + 2 * g, z[k].h + 2 * g, 14 + g);
          ctx.lineWidth = 3; ctx.strokeStyle = rgba(GOLD, a * [0.26, 0.1][j]); ctx.stroke();
        }
      }
      ctx.restore();
      drawGestureHints();
    }
    /* The push that plays each ready Fate joker: a dotted path from the
       card up to the joker, a dot travelling it. */
    function drawGestureHints() {
      if (!cur || cur["in"] < 1) return;
      var u = clamp((hintT - 0.3) / 1.3, 0, 1), a = Math.sin(Math.PI * u), i, id, ax, ay, bx, by, e;
      if (a <= 0) return;
      e = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
      for (i = 0; i < rail.length; i++) {
        id = rail[i].id;
        if (!JOKER_BY[id].act || fateWhyNot(id)) continue;
        ax = L.cardCX; ay = L.cardCY; bx = railX(i); by = L.railY + 44;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
        ctx.setLineDash([2, 16]); ctx.lineCap = "round";
        ctx.lineWidth = 5; ctx.strokeStyle = rgba(FAM_COL.Fate, a * 0.4); ctx.stroke();
        ctx.setLineDash([]);
        var dx = ax + (bx - ax) * e, dy = ay + (by - ay) * e;
        ctx.beginPath(); ctx.arc(dx, dy, 18, 0, Math.PI * 2);
        ctx.fillStyle = rgba("#ffffff", a * 0.2); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = rgba("#ffffff", a * 0.5); ctx.stroke();
        ctx.restore();
      }
    }

    /* The card pushed up: a ring on every Fate joker it can play — lit
       under the finger — with the joker drawn over the card, which has
       risen into the rail; then the open joker's choices under the rail,
       the one under the finger lit. */
    function drawFate() {
      if (!drag.on || !drag.free || !cur || (cur.y > -30 && !lift.on)) return;
      var i, k, c, id, on, pulse = 0.5 + 0.5 * Math.sin(clock * 7), R = L.medalR, col = FAM_COL.Fate;
      var p = { x:lift.x, y:lift.y }, hit = lift.on ? liftDrop(p) : null, under = lift.on ? liftAt(p) : -1;
      for (i = 0; i < rail.length; i++) {
        id = rail[i].id;
        if (!JOKER_BY[id].act || fateWhyNot(id)) continue;
        on = under === i || lift.open === id;
        ctx.save();
        ctx.lineWidth = on ? 7 : 4; ctx.strokeStyle = rgba(col, on ? 1 : 0.35 + 0.4 * pulse);
        ctx.setLineDash(on ? [] : [9, 8]);
        ctx.beginPath(); ctx.arc(railX(i), L.railY + 44, R + 12, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        drawMedal(id, railX(i), L.railY + 44, R * (on ? 1.2 : 1), 1);
      }
      if (!lift.open) return;
      ctx.save();
      ctx.fillStyle = "rgba(4,9,7,.55)";
      ctx.fillRect(0, L.railY + L.railH, view.w, view.h);
      var cs = fateChoices(lift.open);
      ctx.textBaseline = "middle";
      for (k = 0; k < cs.length; k++) {
        c = cs[k];
        var sel = hit && hit.val === c.val;
        ctx.globalAlpha = c.off ? 0.3 : 1;
        ctx.beginPath();
        if (c.r) ctx.arc(c.x, c.y, c.r * (sel ? 1.12 : 1), 0, Math.PI * 2);
        else roundRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, c.h / 2);
        ctx.fillStyle = sel ? col : "rgba(19,15,38,.94)"; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = sel ? "#ffffff" : col; ctx.stroke();
        if (c.r) {
          ctx.save(); ctx.translate(c.x, c.y);
          ctx.fillStyle = SUIT_RED[c.val] ? "#ff8a98" : "#f4efe2";
          pipPath(ctx, c.val, 64); ctx.fill();
          ctx.restore();
        } else {
          ctx.font = font(22, 900); ctx.fillStyle = "#ffffff";
          ctx.textAlign = "left"; ctx.fillText(upper(Lang.t(CAT_NAME[c.val])), c.x - c.w / 2 + 26, c.y + 1);
          ctx.textAlign = "right"; ctx.fillStyle = sel ? "#ffffff" : GOLD;
          ctx.fillText("x" + CALL_X[c.val], c.x + c.w / 2 - 26, c.y + 1);
        }
      }
      ctx.restore();
    }
    /* A joker's medallion on its own, drawn over the card pushed into the rail. */
    function drawMedal(id, x, y, R, alpha) {
      var J = JOKER_BY[id], col = FAM_COL[J.fam];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2);
      var mg = ctx.createRadialGradient(x, y - 10, 4, x, y, R);
      mg.addColorStop(0, rgba(col, 0.7)); mg.addColorStop(1, "#130f26");
      ctx.fillStyle = mg; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
      if (jokerArt(id)) fitImg(jokerArt(id), x, y, R * 1.7, R * 1.7);
      else {
        ctx.fillStyle = col; ctx.font = font(44, 900);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(J.sign || "?", x, y + 2);
      }
      ctx.restore();
    }

    /* ===================================================================
       THE PICK — two jokers, one taken.

       A full gauge, or the start of a run, deals a pick; the round is held
       (Game.held) while it is open. The jokers are drawn by rarity out of
       every family the level has opened, never one already on the rail. A
       pick cannot be refused — a full rail is what asks which joker goes,
       and keeping the rail as it is IS the refusal.

       Every joker ever taken is remembered (Store, `jokers:<slug>`): that is
       what the collection shows, and a joker the player meets for the first
       time wears NEW in the pick.
       =================================================================== */

    function seenKey() { return "jokers:" + (CONFIG.slug || "slipdeck"); }
    function seen() { var s = Store.get(seenKey(), null); return s && typeof s === "object" ? s : {}; }
    function remember(id) { var s = seen(); if (!s[id]) { s[id] = 1; Store.set(seenKey(), s); } }

    function dealPick(n, minR) {
      var pool = [], sum = 0, out = [], i, J, w, roll, charm = has("charm");
      for (i = 0; i < JOKERS.length; i++) {
        J = JOKERS[i];
        if (!STAGE.fams[J.fam] || has(J.id) || J.r < minR) continue;
        if (J.id === "seer" && !STAGE.seer) continue;
        w = PICK_WEIGHT[J.r] * (charm && J.r > 1 ? 2 : 1);
        pool.push([J.id, w]); sum += w;
      }
      while (out.length < n && pool.length) {
        roll = Rand.range(0, sum);
        for (i = 0; i < pool.length - 1; i++) { roll -= pool[i][1]; if (roll <= 0) break; }
        out.push(pool[i][0]); sum -= pool[i][1]; pool.splice(i, 1);
      }
      return out;
    }

    function openPick() {
      pendingPick = false;
      var n = has("third") ? 3 : 2, minR = 0, i, deal;
      for (i = 0; i < rail.length; i++) {
        if (rail[i].id === "ticket") {                     // spent as the pick opens
          rail.splice(i, 1); minR = 3;
          Notify.say("Golden ticket", { sub:"Only epic and legendary jokers", kind:"rare", icon:"sparkles" });
          break;
        }
      }
      deal = dealPick(n, minR);
      if (deal.length < n && minR) deal = deal.concat(dealPick(n - deal.length, 0).filter(function (id) { return deal.indexOf(id) < 0; }));
      if (!deal.length) { opening = false; return; }
      showPick(deal);
    }

    function overlay(cls) {
      var frame = document.getElementById("frame"), lay = document.createElement("div");
      lay.className = "sd-pick " + (cls || "");
      lay.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
      frame.appendChild(lay);
      requestAnimationFrame(function () { lay.classList.add("on"); });
      return lay;
    }
    function pickCard(lay, eye, title, tap) {
      var mc = document.createElement("div");
      mc.className = "mt-card sd-pc";
      mc.innerHTML = '<p class="mt-eyebrow"></p><h2 class="mt-h"></h2><div class="mt-body"></div><p class="mt-tap"></p>';
      mc.querySelector(".mt-eyebrow").textContent = upper(Lang.t(eye));
      mc.querySelector(".mt-h").textContent = upper(Lang.t(title));
      mc.querySelector(".mt-tap").textContent = upper(Lang.t(tap));
      lay.appendChild(mc);
      return mc.querySelector(".mt-body");
    }

    function showPick(deal, eye) {
      if (!document.getElementById("frame")) return;
      var lay = overlay(), had = seen(), i, btn;
      eye = eye || (opening ? "A new run" : "Joker gauge full");
      var body = pickCard(lay, eye, "Pick one", "Tap a joker to take it");
      var row = document.createElement("div");
      row.className = "sd-deal";
      for (i = 0; i < deal.length; i++) {
        btn = document.createElement("button");
        btn.className = "sd-take"; btn.type = "button";
        btn.setAttribute("aria-label", Lang.t(JOKER_BY[deal[i]].name));
        btn.appendChild(jokerNode(deal[i], { w:290, fresh:!had[deal[i]] }));
        (function (k) { btn.addEventListener("click", function (e) { e.stopPropagation(); take(k); }); })(i);
        row.appendChild(btn);
      }
      body.appendChild(row);
      pick = { node:lay, deal:deal, eye:eye, redealt:false };
      if (has("redeal")) {
        var rd = document.createElement("button");
        rd.type = "button"; rd.className = "btn btn-sm btn-plate sd-redeal";
        rd.textContent = upper(Lang.t("Re-deal"));
        rd.addEventListener("click", function (e) {
          e.stopPropagation();
          if (!pick || pick.redealt) return;
          var again = dealPick(deal.length, 0);
          if (!again.length) return;
          var eye0 = pick.eye;
          closePick(null, true);
          showPick(again, eye0);
          pick.redealt = true;
          var r2 = pick.node.querySelector(".sd-redeal");
          if (r2) r2.parentNode.removeChild(r2);
        });
        body.appendChild(rd);
      }
      opening = false;
      drag.on = false;
      Sound.cue("pick", 0.45, 1.1, 760, 0.12, "triangle");
      Music.duck(0.45, 0.3);
    }
    function take(k) {
      if (!pick || !pick.deal || !pick.deal[k]) return;
      var id = pick.deal[k];
      closePick(k);
      if (rail.length < SLOTS) equip(id, rail.length);
      else showReplace(id);
    }

    /* A full rail: the new joker names the one it replaces, or goes back.
       One row per joker on the rail, at reading size, and the refusal. */
    function showReplace(id) {
      var lay = overlay("sd-swap"), i, row, J = JOKER_BY[id];
      var body = pickCard(lay, "Rail full", "Replace which joker?", "Tap the joker to replace");
      var head = document.createElement("p");
      head.className = "sd-newline";
      head.textContent = fill(Lang.t("New: {j}"), { j:Lang.t(J.name) });
      head.style.color = FAM_COL[J.fam];
      body.appendChild(head);
      for (i = 0; i < rail.length; i++) {
        (function (k) {
          var R = JOKER_BY[rail[k].id];
          row = document.createElement("button");
          row.type = "button"; row.className = "sd-row";
          row.style.setProperty("--c", FAM_COL[R.fam]);
          var src = jokerSrc(R.id);
          row.innerHTML = '<span class="sd-rart">' + (src ? '<img alt="" draggable="false" src="' + src + '">' : "") +
                          '</span><span class="sd-rtx"><b></b><i></i></span>';
          row.querySelector("b").textContent = upper(Lang.t(R.name));
          row.querySelector("i").textContent = Lang.t(R.text);
          row.addEventListener("click", function (e) { e.stopPropagation(); closePick(); equip(id, k); });
          body.appendChild(row);
        })(i);
      }
      var keep = document.createElement("button");
      keep.type = "button"; keep.className = "btn btn-sm btn-plate";
      keep.textContent = upper(Lang.t("Keep my rail"));
      keep.addEventListener("click", function (e) { e.stopPropagation(); closePick(); });
      body.appendChild(keep);
      pick = { node:lay, replace:id };
      Music.duck(0.45, 0.3);
    }
    function closePick(k, quiet) {
      if (!pick) return;
      var n = pick.node, takes = n.querySelectorAll(".sd-take");
      if (k != null && takes[k]) takes[k].classList.add("took");
      pick = null;
      n.classList.add("off");
      if (!quiet) Music.unduck();
      setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 320);
    }
    function dropPick() {
      if (!pick) return;
      var n = pick.node;
      pick = null;
      if (n.parentNode) n.parentNode.removeChild(n);
      Music.unduck();
    }

    /* Onto the rail, at `slot`: the end of it, or the joker it replaces. */
    function equip(id, slot) {
      var J = JOKER_BY[id], out = slot < rail.length ? rail[slot] : null;
      jokersTaken++;
      remember(id);
      if (out) {
        if (out.id === "pocket" && pocket) { toShoe(pocket); pocket = null; }
        if (out.id === "called") called = null;
        rail[slot] = { id:id, n:0 };
      } else rail.push({ id:id, n:0 });
      if (id === "heart") { lives++; showLives(); }
      if (id === "seat" && seat < 0) lightSeat();
      var i = out ? slot : rail.length - 1;
      Fx.burst(railX(i), L.railY + L.railH / 2, { color:[FAM_COL[J.fam], "#ffffff"], count:16, speed:320, life:0.45, grav:300 });
      lit.who = "joker"; lit.idx = i; lit.t = 1;
      // the joker it replaced rides on the callout: one word for one choice
      Pop.show("bonus", { word:J.name, sub:out ? fill(Lang.t("{j} leaves the rail"), { j:Lang.t(JOKER_BY[out.id].name) }) : null, at:"top" });
      Sound.cue("joker", 0.5, 1, 700, 0.12, "triangle");
      if (J.act) tip("fate", null, "fate3");     // told again since the push up replaced the drags
      if (J.xm) tip("xmult");
    }

    /* THE JOKER, as DOM — the one builder of the pick's cards and of the
       collection (packages/webshell/codex.js asks for it through
       codex.node). Authored at 300 x 420 design px and scaled as a whole to
       the width asked for; the look is the SKIN's .sd-jc. A `ghost` is a
       joker never taken yet: its silhouette, named ???. */
    var JC_W = 300;
    function jokerKey(id) {
      for (var i = 0; i < JOKERS.length; i++) if (JOKERS[i].id === id) return "joker" + (i < 9 ? "0" : "") + (i + 1);
      return "";
    }
    function jokerSrc(id) { var a = CONFIG.art || {}; return a[jokerKey(id)] || ""; }
    function jokerNode(id, opt) {
      opt = opt || {};
      var J = JOKER_BY[id], R = RARITY[J.r], w = opt.w || JC_W, ghost = !!opt.ghost, src = jokerSrc(id);
      var box = document.createElement("div");
      box.className = "sd-jbox";
      box.style.width = w + "px"; box.style.height = Math.round(w * 1.4) + "px";
      var n = document.createElement("div");
      n.className = "sd-jc r-" + (ghost ? 1 : J.r) + (ghost ? " ghost" : "");
      n.style.setProperty("--sk", w / JC_W);
      n.style.setProperty("--c", ghost ? "#5d567a" : FAM_COL[J.fam]);
      n.style.setProperty("--r", ghost ? "#6d6690" : R.color);
      n.innerHTML =
        '<div class="sd-jglow"></div><div class="sd-jfam"></div>' +
        '<div class="sd-jart">' + (src ? '<img alt="" draggable="false" src="' + src + '">' : '<span class="sd-jsign"></span>') + "</div>" +
        '<div class="sd-jname"></div><div class="sd-jtext"></div><div class="sd-jrar"><span></span></div>' +
        (opt.fresh && !ghost ? '<div class="sd-jnew"><span></span></div>' : "");
      n.querySelector(".sd-jfam").textContent = ghost ? "" : upper(Lang.t(J.fam));
      if (!src) n.querySelector(".sd-jsign").textContent = J.sign || "?";
      n.querySelector(".sd-jname").textContent = ghost ? "???" : upper(Lang.t(J.name));
      n.querySelector(".sd-jtext").textContent = ghost ? "" : Lang.t(J.text);
      n.querySelector(".sd-jrar span").textContent = ghost ? "???" : upper(Lang.t(R.name));
      // the word stays English in every language, like the album's NEW tag
      if (opt.fresh && !ghost) n.querySelector(".sd-jnew span").textContent = upper("New");
      box.appendChild(n);
      return box;
    }

    /* The guide's example of what the hint lights (guide.js, helpAura):
       a joker's medallion as the rail draws it, the first that has its art. */
    function helpAura() {
      var J = JOKERS[0], i, n = document.createElement("div"), src;
      for (i = 0; i < JOKERS.length; i++) if (jokerSrc(JOKERS[i].id)) { J = JOKERS[i]; break; }
      src = jokerSrc(J.id);
      n.className = "sd-medal";
      n.style.setProperty("--c", FAM_COL[J.fam]);
      n.innerHTML = src ? '<img alt="" draggable="false" src="' + src + '">' : "<span></span>";
      if (!src) n.querySelector("span").textContent = J.sign || "?";
      return n;
    }

    /* --- the guide: every rule, as pages (packages/webshell/guide.js) -----
       The TIPS above are its words, so a rule is written once: read on a
       card in a playable, on a page of the guide on the web. Every page
       SHOWS before it tells: its picture is drawn by the table's own
       renderers (drawCard, the chart's rows, the joker's card), so what is
       read in the guide is what is dealt in a round. A page's level is the
       one the climb deals the idea on (stageFor), locked until then. */
    function tipPage(key, lv, vars, pic, skip) {
      var T = TIPS[key], lines = [], i;
      for (i = 0; i < T.lines.length; i++) if (!skip || skip.indexOf(i) < 0) lines.push(fill(Lang.t(T.lines[i]), vars));
      return { id:key, title:fill(Lang.t(T.title), vars), lines:lines, lv:lv, pic:pic };
    }
    /* A row of cards painted by drawCard on a canvas of its own: the round's
       `ctx` is lent to it for the length of the call, which is how a card in
       the guide is the card on the table, pixel for pixel. `gap` opens a
       space before a card, `dim` greys one out (a kicker, a pair too low). */
    function cardsPic(cards, w) {
      w = w || 112;
      var h = Math.round(w * 1.42), step = Math.round(w * 0.74), pad = 14, k = view.dpr || 1, i, x, W;
      for (W = pad * 2 + w, i = 1; i < cards.length; i++) W += step + (cards[i].gap ? w * 0.4 : 0);
      var cv = document.createElement("canvas"), keep = ctx;
      cv.width = Math.round(W * k); cv.height = Math.round((h + pad * 2) * k);
      cv.style.width = W + "px"; cv.style.height = (h + pad * 2) + "px";
      ctx = cv.getContext("2d"); ctx.scale(k, k);
      try {
        for (x = pad + w / 2, i = 0; i < cards.length; i++) {
          if (i) x += step + (cards[i].gap ? w * 0.4 : 0);
          drawCard(cards[i], x, pad + h / 2, w, h, (i - (cards.length - 1) / 2) * 0.05, 1,
                   cards[i].dim ? "rgba(6,12,10,.55)" : null);
        }
      } finally { ctx = keep; }
      return cv;
    }
    function card(r, s, more) { var c = { r:r, s:s }, k; for (k in more || {}) c[k] = more[k]; return c; }
    function oneRow(cat) {
      var box = document.createElement("div"), i;
      box.className = "sd-hands";
      for (i = 0; i < CHART.length; i++) if (CHART[i][0] === cat) box.appendChild(handRow(cat, CHART[i][1], null));
      return box;
    }
    function jokersPic(ids) {
      var box = document.createElement("div"), i;
      box.className = "sd-gjokers";
      for (i = 0; i < ids.length; i++) box.appendChild(jokerNode(ids[i], { w:240 }));
      return box;
    }
    // the tip says what just happened ("No bins left"); the page names the rule
    function binsPage(vars) { var P = tipPage("bins", 0, vars); P.title = Lang.t(TIPS.bins.eye); return P; }
    var guide = {
      chapters: function () {
        var bins = { n:CONFIG.play.chuteDepth };
        return [
          { key:"basics", label:Lang.t("The basics"), pages:[
            tipPage("basics", 0, null, function () {
              return cardsPic([card(6, 1), card(6, 0), card(6, 2), card(1, 3), card(1, 1)]);
            }),
            { id:"hands", title:Lang.t("Poker hands"), node:buildHands, lines:[
              Lang.t("Each poker hand starts from the chips × mult shown beside it.") ] },
            tipPage("count", 0, null, function () { return oneRow("fullHouse"); }),
            tipPage("double", 0, null, function () {
              return cardsPic([card(6, 1), card(8, 1), card(12, 1), card(1, 1), card(6, 0, { mod:"wild" })]);
            }),
            tipPage("bust", 0, null, function () {
              return cardsPic([card(12, 0, { dim:1 }), card(8, 1, { dim:1 }), card(5, 2, { dim:1 }), card(3, 3, { dim:1 }), card(1, 0, { dim:1 })]);
            }),
            binsPage(bins), tipPage("pot")
          ] },
          { key:"jokers", label:Lang.t("Jokers"), pages:[
            tipPage("joker", FAM_LEVEL.Mult, null, function () { return jokersPic([JOKERS[0].id, JOKERS[1].id]); }),
            tipPage("xmult", FAM_LEVEL.Mult, null, buildXDemo),
            tipPage("fate", FAM_LEVEL.Fate, null, function () { return jokersPic(["compass", "reshuffle"]); })
          ] },
          { key:"cards", label:Lang.t("Special cards"), pages:[
            tipPage("gold", 3, null, function () { return cardsPic([card(11, 2, { mod:"gold" })], 150); }),
            tipPage("wild", 3, null, function () { return cardsPic([card(7, 3, { mod:"wild" })], 150); }),
            tipPage("glass", 5, null, function () { return cardsPic([card(9, 1, { mod:"glass" })], 150); }),
            tipPage("lucky", 5, null, function () { return cardsPic([card(4, 0, { mod:"lucky" })], 150); }),
            tipPage("curse", 13, null, function () { return cardsPic([card(12, 0, { curse:true })], 150); }),
            tipPage("veil", 16, null, function () { return cardsPic([card(10, 2, { veil:true })], 150); })
          ] },
          { key:"climb", label:Lang.t("The climb"), pages:[
            { id:"floor", title:Lang.t("Minimum pair"), lv:7, pic:function () {
                return cardsPic([card(6, 0, { dim:1 }), card(6, 1, { dim:1 }), card(7, 2, { gap:1 }), card(7, 3)]);
              }, lines:[
              Lang.t("From level 7, a single pair needs 8s or better to pay. Then 10s from level 13, jacks from 19."),
              Lang.t("A lower pair busts the hand. Two pair and better always pay.") ] }
          ] }
        ];
      }
    };

    /* --- the collection: every joker ever taken --------------------------
       The codex's books are the four rarities, so what a player is missing
       reads as how rare it is. A joker is had once it has been taken in a
       round; `lv` is the level its family opens on. */
    var codex = {
      books: function () {
        var out = [], r;
        for (r = 1; r < RARITY.length; r++) out.push({ key:String(r), label:Lang.t(RARITY[r].name), color:RARITY[r].color });
        return out;
      },
      items: function (book) {
        var out = [], s = seen(), i, J;
        for (i = 0; i < JOKERS.length; i++) {
          J = JOKERS[i];
          if (String(J.r) === book) out.push({ id:J.id, lv:FAM_LEVEL[J.fam], had:!!s[J.id] });
        }
        return out;
      },
      node: jokerNode,
      info: function (id) {
        var J = JOKER_BY[id], R = RARITY[J.r];
        return { name:Lang.t(J.name), color:FAM_COL[J.fam],
                 lock:Lang.t("Take it in a round to add it to the collection"),
                 chips:[{ text:Lang.t(R.name), color:R.color }, { text:Lang.t(J.fam), color:FAM_COL[J.fam] }] };
      }
    };

    /* ===================================================================
       ROUND
       =================================================================== */

    /* Six levels a band, five bands. Anything off the map — the endless run
       above level 30 — keeps the last one, and a playable (no level) rides
       the first. */
    function bandFor() {
      var b = CONFIG.bands;
      if (!CONFIG.level) return b[0];
      return b[clamp(Math.floor((CONFIG.level - 1) / 6), 0, b.length - 1)];
    }

    function reset() {
      readTunables();
      /* THE TABLE AND ITS BED, moved together: replaying a level never
         restarts the music and crossing into the next band does. A playable
         has no level and a short cut of the track, so `null` — the whole of
         what this build ships — is the right section there. */
      var band = bandFor();
      Art.backdrop(band.scene);
      Music.play(CONFIG.level ? band.music : null);
      layout();
      dropTips();
      dropPick();
      buildShoe();
      upcoming = null;
      cur = null; flying = []; landing = []; hand = []; rail = []; tally = null;
      chute = 0; binsThisHand = 0; score = 0; lives = LIVES;
      lastCat = ""; catStreak = 0;
      kept = 0; binned = 0; hands = 0; busts = 0; overflows = 0;
      bestTotal = 0; bestName = []; jokersTaken = 0;
      firstFrame = true; done = false;
      drag.on = false; lit.t = 0; liftOff();
      hintT = -1; hintPoke(); hudHint(false);
      gauge = 0; pendingPick = false; opening = false; pick = null;
      used = {}; pocket = null; called = null; lastBin = null;
      pot = 0; potFly = []; potHit = 0; seat = -1;

      HUD.setScoreNow(0);
      showLives();
      showDeck();
      Fx.reset();
      seedHand();
      nextCard();
    }

    function showLives() {
      var s = "", i, n = Math.max(LIVES, lives);
      for (i = 0; i < n; i++) s += (i < lives ? "♥" : "♡");
      HUD.setRight(s, "Lives", lives <= 1 ? "warn" : "");   // the lives top-right
    }
    function showDeck() {
      var n = cardsLeft();
      HUD.setLeft(String(n), "Deck", n <= 8 ? "warn" : "");  // the deck top-left
    }

    /* Every hand opens on one card the player did not choose. It comes off the
       top of the shoe with no bias and no modifier — the anchor has to be
       honest, or it is just the game picking the line for them. */
    function seedHand() {
      if (!shoe.length) return;
      var c = shoe.shift();
      c = { r:c.r, s:c.s };
      hand = [c];
      lightSeat();
      landing.push({ card:c, fx:L.cardCX, fy:L.cardCY - L.cardH * 0.18,
                     frot:0, slot:0, t:0 });
      Sound.cue("deal", 0.4, 0.86, 560, 0.06, "square");
      showDeck();
    }

    /* Lucky seat lights one of the places still to fill — never the anchor's,
       which nobody chooses. */
    function lightSeat() {
      seat = has("seat") && hand.length < HAND_SIZE ? Rand.int(Math.max(1, hand.length), HAND_SIZE - 1) : -1;
    }

    function nextCard() {
      if (!upcoming) upcoming = draw();
      if (!upcoming) { finish(Lang.t("Deck cleared")); return; }
      cur = { card:upcoming, x:0, y:0, rot:0, "in":0 };
      upcoming = draw();
      showDeck();
      Sound.cue("deal", 0.45, 1, 660, 0.05, "square");
    }

    /* The card has landed in the middle: if it brings an idea the player
       has not met, this is the moment to tell it. */
    function arrived(c) {
      if (c.curse) tip("curse");
      else if (c.veil && !has("seer")) tip("veil");
      else if (c.mod) tip(c.mod);
    }

    function loseLife(word, col) {
      lives--;
      showLives();
      Fx.shake(14, 0.3);
      Fx.flash(col, 0.34, 2.2);
      Pop.show(word === "Too many bins" ? "alert" : "danger", { word:word });
      if (lives <= 0) finish(CONFIG.copy.gameOver);
    }

    /* ===================================================================
       THE TWO DECISIONS
       =================================================================== */

    function decide(dir) {                                 // -1 bin, +1 keep
      if (!cur || cur["in"] < 1 || tally || tipOpen || pick || State !== "playing") return;
      var c = cur.card, x = L.cardCX + cur.x, y = L.cardCY + cur.y, rot = cur.rot;
      cur = null;
      dealWait = DEAL_WAIT;

      if (dir < 0) {
        binned++; binsThisHand++;
        for (var i = 0; i < rail.length; i++) if (rail[i].id === "ascetic") rail[i].n++;
        if (has("recycler")) { shoe.push({ r:c.r, s:c.s }); c.recycled = true; showDeck(); }
        lastBin = c;
        if (POT_ON) {                                      // its chips drop into the pot
          c.potted = c.curse ? 0 : rankChips(c.r);
          if (c.potted) potFly.push({ x0:x, y0:y, v:c.potted, t:0 });
          tip("pot");
        }
        flying.push({ card:c, x:x, y:y, vx:-1700, vy:-160, rot:rot, spin:-3.6, a:1 });
        Sound.cue("bin", 0.4, 1, 220, 0.07, "sawtooth");
        chute++;
        var cap = chuteCap();
        if (chute > cap) {                                 // the chute overflows
          chute = 0; overflows++;
          Sound.cue("warn", 0.55, 0.9, 180, 0.2, "square");
          loseLife("Too many bins", BIN_COL);
        } else {
          Fx.burst(Layout.left + 40, L.gateY, {
            color:[BIN_COL, "#ffffff"], count:8, speed:260, life:0.35, grav:400 });
          if (chute === cap) {
            Pop.show("alert", { word:"No bins left", sub:"The next bin costs a life" });
            tip("bins", { n:cap });
          }
        }
        return;
      }

      kept++;
      c.veil = false;                                      // a kept card shows its suit
      landing.push({ card:c, fx:x, fy:y, frot:rot, slot:hand.length, t:0 });
      hand.push(c);
      Sound.cue("keep", 0.5, 1 + hand.length * 0.06, 520, 0.07, "triangle");
      Fx.burst(Layout.right - 40, L.gateY, {
        color:[KEEP_COL, "#ffffff"], count:8, speed:260, life:0.35, grav:400 });
      if (hand.length >= HAND_SIZE) resolveHand();
    }
    var dealWait = 0;

    /* THE GAUGE. A paid hand fills it by its strength; a full one queues a
       pick, opened once the hand has left the table (update), and what
       passes the top is kept for the next one. No jokers on this level, no
       gauge. */
    function fillGauge(n) {
      if (!anyFam() || !n) return;
      gauge += n;
      if (gauge >= PICK_GAUGE) { gauge -= PICK_GAUGE; pendingPick = true; }
    }

    /* A full hand is counted step by step — the category, each scoring card,
       each joker left to right — and only then paid. The first time, the
       count is explained before it plays. The count's own staging is THE
       COUNT, under UPDATE. */
    function resolveHand() {
      var res = scoreHand(hand, false);
      if (!res.bust) tip("count");
      if (res.parts.length > 1) tip("double");
      if (TALLY_STEP <= 0) { settle(res); return; }
      tally = { res:res, phase:res.bust ? "bust" : "intro", t:0, clock:0, i:1, wait:0,
                fast:false, slam:false, flights:[], op:null, chips:0, mult:0,
                pc:0, pm:0, pt:0, ticks:0, landed:0, p:0, banked:0 };
      tallyPart(tally, 0);
    }
    /* The count plays one hand at a time: `p` is the one on the chips,
       `banked` what the hands before it already paid. */
    function tallyPart(T, p) {
      var P = T.res.parts[p], base = BASE[P ? P.cat : "high"];
      T.p = p; T.chips = base[0]; T.mult = base[1];
      if (p > 0) {
        T.banked += T.res.parts[p - 1].total;
        T.phase = "intro"; T.t = 0; T.i = 1; T.wait = 0; T.slam = false;
        T.flights = []; T.op = null; T.ticks = 0; T.landed = 0; T.pt = 0;
      }
    }
    function tallyPartOf(T) { return T.res.parts[T.p]; }

    function settle(res) {
      var i, cx = Layout.cx, cy = L.slotY;
      tally = null;
      if (res.bust) {
        busts++; lastCat = ""; catStreak = 0;
        for (i = 0; i < rail.length; i++) if (rail[i].id === "ascetic") rail[i].n = 0;
        var saved = -1;
        for (i = 0; i < rail.length; i++) if (rail[i].id === "second") saved = i;
        Sound.cue("bust", 0.6, 1, 150, 0.3, "sawtooth");
        Fx.freeze(0.08);
        if (saved >= 0) {
          rail.splice(saved, 1);
          Fx.shake(8, 0.2);
          Pop.show("bonus", { word:"Second chance", sub:res.why });
          Sound.cue("saved", 0.5, 1, 500, 0.2, "triangle");
        } else loseLife(res.why === "High card" ? "Bust" : res.why, BIN_COL);
        burnPot();
        tip("bust");
      } else {
        hands++;
        score += res.total;
        if (res.pot) { pot -= res.pot; potHit = 1; }
        if (POT_ON && has("ante")) { pot += 15; potHit = 1; }
        var gain = has("hothand") ? 1 : 0;
        for (i = 0; i < res.parts.length; i++) gain += GAUGE_GAIN[res.parts[i].cat];
        fillGauge(gain);
        lastCat = res.cat; catStreak = res.streak;
        if (res.total > bestTotal) { bestTotal = res.total; bestName = res.parts; }
        HUD.setScore(score);
        HUD.punch(GOLD);
        Sound.cue("pay", 0.65, 0.88 + CAT_ORDER[res.cat] * 0.06, 700, 0.2, "triangle");
        var big = CAT_ORDER[res.cat] >= CAT_ORDER.flush || res.total >= 1000;
        Pop.show(big ? "ultra" : CAT_ORDER[res.cat] >= CAT_ORDER.trips ? "combo" : "score",
                 { word:handName(res.parts), sub:"+" + res.total });
        if (catStreak > 1) Pop.show("streak", { word:"x" + catStreak + Lang.t(" in a row"), at:"upperRight" });
        Fx.ring(cx, cy, { from:60, to:520, color:GOLD, width:9, life:0.5 });
        for (i = 0; i < HAND_SIZE; i++) {
          Fx.burst(slotX(i), cy, { color:[GOLD, "#ffffff", KEEP_COL],
            count:14, speed:460, life:0.6, grav:900 });
        }
        Fx.shake(big ? 14 : 8, 0.26);
        if (big) Fx.freeze(0.09);
      }

      chute = 0; binsThisHand = 0;    // the bins are reset by the next hand
      seat = -1;                      // and the lit place is drawn again (seedHand)
      used = {}; called = null; lastBin = null;   // and so are the Fate jokers

      /* The hand always leaves the table: up and out when it pays, down into
         the felt when it busts. */
      for (i = 0; i < hand.length; i++) {
        flying.push({
          card: hand[i], x: slotX(i), y: L.slotY, rot: 0,
          vx: (i - (HAND_SIZE - 1) / 2) * 260,
          vy: res.bust ? 700 : -1000,
          spin: Rand.range(-3, 3), a: 1
        });
      }
      hand = [];
      if (State !== "playing" || done) return;
      seedHand();          // the next hand opens on its own anchor
      dealWait = 0.2;
    }

    /* ===================================================================
       INPUT — one drag, and the flick the arrow keys ride through
       Input.swipe. A tap on the rail opens what a joker does.
       =================================================================== */

    function railAt(p) {
      if (p.y < L.railY || p.y > L.railY + L.railH) return -1;
      for (var i = 0; i < rail.length; i++) {
        if (Math.abs(p.x - railX(i)) <= railW() / 2) return i;
      }
      return -1;
    }

    /* What a tap at p is about, and the card that tells it. Every tip the
       table shows once can be read again by touching the thing it explains:
       the deck and the lives up in the HUD (which takes no pointer: the tap
       reaches the canvas under it), a joker of the rail, the live card, the
       Pocket, the bins, the hand's worth and the cards of the hand. Not the
       chevrons: a finger on them wanted to move the card (nudge). */
    function explainAt(p, dry) {
      var i, c, q;
      if (p.y < Layout.top) {                        // the HUD band
        if (p.x < Layout.cx - 120) return dry || tip("basics", null, null, true) || true;
        if (p.x > Layout.cx + 120) return dry || tip("bust", null, null, true) || true;
        return false;
      }
      if (p.y >= L.railY && p.y <= L.railY + L.railH) {
        i = railAt(p);
        if (dry) return true;
        if (i >= 0) jokerCard(i); else tip("joker", null, null, true);
        return true;
      }
      if (cur && cur["in"] >= 1 && Math.abs(p.x - L.cardCX) < L.cardW / 2 && Math.abs(p.y - L.cardCY) < L.cardH / 2) {
        if (dry) return true;
        explainCard(cur.card);
        return true;
      }
      if (POT_ON && Math.abs(p.x - L.potX) < 70 && Math.abs(p.y - L.potY) < 70) {
        return dry || tip("pot", null, null, true) || true;
      }
      if (pocket || has("pocket")) {
        var b = pocketBox();
        if (Math.abs(p.x - b.x) < b.w / 2 + 10 && Math.abs(p.y - b.y) < b.h / 2 + 10 && railIdx("pocket") >= 0) {
          return dry || jokerCard(railIdx("pocket")) || true;
        }
      }
      if (Math.abs(p.y - L.binsY) < 21 && Math.abs(p.x - Layout.cx) < 200) {
        return dry || tip("bins", { n:chuteCap() }, null, true) || true;
      }
      if (anyFam() && Math.abs(p.y - L.gaugeY) < 21 && Math.abs(p.x - Layout.cx) < 240) {
        return dry || tip("joker", null, null, true) || true;
      }
      if (Math.abs(p.y - L.valueY) < 26 && hand.length) {
        return dry || handsCard() || true;
      }
      for (i = 0; i < hand.length; i++) {
        q = slotPose(i);
        if (Math.abs(p.x - q.x) < L.slotW / 2 && Math.abs(p.y - q.y) < L.slotH / 2) {
          return dry || explainCard(hand[i], true) || true;
        }
      }
      return false;
    }

    /* ON A DESK THE MOUSE SAYS WHAT CAN BE DONE. The canvas takes every
       pointer, so the cursor is the canvas's: the help cursor over anything a
       tap would explain (the same test as the tap, explainAt in dry mode) —
       except the live card, whose first answer is the swipe: over it the
       open hand, closed while it is dragged. A tap on it still explains it.
       A finger never sees any of it. */
    var cursorNow = "";
    function overCard(p) {
      return cur && cur["in"] >= 1 && Math.abs(p.x - L.cardCX) < L.cardW / 2 && Math.abs(p.y - L.cardCY) < L.cardH / 2;
    }
    function hover(p) {
      var playing = State === "playing" && !tally && !tipOpen && !pick;
      var want = drag.on ? "grabbing"
               : playing && overCard(p) ? "grab"
               : playing && explainAt(p, true) ? "help" : "";
      if (want === cursorNow) return;
      cursorNow = want;
      canvas.style.cursor = want;
    }

    /* A card's own rule: its modifier, or — a plain card in the hand — the
       pair floor once there is one, the count otherwise. */
    function explainCard(c, inHand) {
      if (c.curse) tip("curse", null, null, true);
      else if (veiled(c)) tip("veil", null, null, true);
      else if (c.mod) tip(c.mod, null, null, true);
      else if (inHand && STAGE.floor > 2) tip("floor", { r:rankWord(STAGE.floor) }, null, true);
      else tip(inHand ? "count" : "basics", null, null, true);
    }

    var tap = null;                                  // a press that has not moved yet
    function onDown(p) {
      hintPoke();
      if (tipOpen) { closeTip(); return; }
      if (tally) { tally.fast = true; tap = null; return; }   // a tap hurries the count
      tap = { x:p.x, y:p.y, t:Date.now() };
      /* The rail never moves the card: a press there reads a joker. A Fate
         joker is played by pushing the card up onto it (FATE GESTURES). */
      if (p.y >= L.railY && p.y <= L.railY + L.railH) return;
      if (!cur || cur["in"] < 1 || tally) return;
      drag.on = true; drag.sx = p.x; drag.sy = p.y; drag.x0 = cur.x; drag.y0 = cur.y;
      drag.free = fateReady();
      liftOff(); lift.x = p.x; lift.y = p.y;
    }
    function onMove(p) {
      hover(p);
      if (tap && (Math.abs(p.x - tap.x) > 12 || Math.abs(p.y - tap.y) > 12)) tap = null;
      if (!drag.on || !cur) return;
      // choices open: the card waits up in the rail while the finger picks
      if (lift.open) { liftMove(p); return; }
      cur.x = drag.x0 + (p.x - drag.sx);
      // the card follows the finger up only when a Fate joker can be played
      cur.y = drag.free ? Math.min(40, drag.y0 + (p.y - drag.sy)) : -Math.abs(cur.x) * 0.06;
      cur.rot = clamp(cur.x / 620, -0.42, 0.42) * (lift.on ? 0.3 : 1);
      if (drag.free) liftMove(p);
    }
    function onUp(p) {
      var t = tap; tap = null;
      if (drag.on) {
        drag.on = false;
        // pushed up: it plays the joker under the finger, or goes back
        if (lift.on) { liftRelease(p); if (p) hover(p); return; }
        liftOff();
        /* lifted toward nothing: the card goes back, no decision taken. A
           finger pushed up while no Fate joker is ready is the same: a
           push toward a spent joker must not bin the card on the way —
           it says why the joker is not ready instead. */
        var fx = p ? p.x - drag.sx : 0, fy = p ? p.y - drag.sy : 0;
        var lifted = cur && (drag.free ? cur.y < -SWIPE_DIST && -cur.y > Math.abs(cur.x) * 0.8
                                       : fy < -UP_START && -fy > Math.abs(fx));
        if (lifted && !drag.free && p && liftAt(p) >= 0) Notify.say(fateWhyNot(rail[liftAt(p)].id), { kind:"warn", key:"fate" });
        if (cur && !lifted && Math.abs(cur.x) >= SWIPE_DIST) { decide(cur.x > 0 ? 1 : -1); if (p) hover(p); return; }
      }
      if (t && Date.now() - t.t < 450 && !tally && !tipOpen && !pick && State === "playing") {
        var g = gateAt(t);
        if (g) nudge(g); else explainAt(t);
      }
      if (p) hover(p);
    }

    /* ===================================================================
       UPDATE — no clock: the only time in this game is animation.
       =================================================================== */

    function update(dt) {
      var i;
      /* The entrance has landed: say what is NEW to this level. The rules
         themselves open on a tap of whatever the hint lights (explainAt),
         and the guide's contents say so (helpAura) — no card on the way in. A
         playable has no Help card, so it keeps the rules card. */
      if (firstFrame) {
        firstFrame = false;
        if (!CONFIG.web) tip("basics");
        if (STAGE.floor > 2) tip("floor", { r:rankWord(STAGE.floor) }, "floor" + STAGE.floor);
        // a run opens on a pick, so a build starts with the first card
        if (anyFam()) { tip("joker"); pendingPick = true; opening = true; }
      }
      lit.t = Math.max(0, lit.t - dt * 3);
      clock += dt;
      tickHint(dt);

      for (i = flying.length - 1; i >= 0; i--) {
        var f = flying[i];
        f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 1900 * dt;
        f.rot += f.spin * dt; f.a -= dt * 1.3;
        if (f.a <= 0 || f.y > view.h + 500) flying.splice(i, 1);
      }
      potHit = Math.max(0, potHit - dt * 3);
      for (i = potFly.length - 1; i >= 0; i--) {
        potFly[i].t += dt / 0.34;
        if (potFly[i].t >= 1) {
          pot += potFly[i].v; potHit = 1;
          Fx.burst(L.potX, L.potY - 20, { color:[GOLD, "#ffffff"], count:10, speed:240, life:0.4, grav:500 });
          Pop.text(L.potX, L.potY - 60, "+" + potFly[i].v, { color:GOLD, size:22, life:0.6, tier:1 });
          Sound.cue("tally", 0.35, 1.25, 990, 0.04, "triangle");
          potFly.splice(i, 1);
        }
      }
      for (i = landing.length - 1; i >= 0; i--) {
        landing[i].t += dt / 0.18;
        if (landing[i].t >= 1) landing.splice(i, 1);
      }
      if (done) return;

      if (tally) { tickTally(dt); return; }
      // a pick waits for the table to be still: the hand gone, no card landing
      if (pendingPick && !pick && !tipOpen && !landing.length) { openPick(); return; }

      if (!cur) {
        dealWait -= dt;
        if (dealWait <= 0) nextCard();
        return;
      }

      if (cur["in"] < 1) {
        cur["in"] = clamp(cur["in"] + Math.max(0, dt) / DEAL_IN, 0, 1);
        // landed: a card bringing a new idea is explained before it can be swiped
        if (cur["in"] >= 1) arrived(cur.card);
        return;
      }

      if (!drag.on) {
        var k = Math.min(1, dt * 15);                // spring back to the middle
        cur.x = cur.x + (0 - cur.x) * k;
        cur.y = cur.y + (0 - cur.y) * k;
        cur.rot = cur.rot + (0 - cur.rot) * k;
      }
    }

    /* ===================================================================
       THE COUNT — the moment a run is played for, so it takes its time and
       makes noise. Five beats:

         intro   the hand's name slams in, the two casino chips pop up
         steps   every card and every joker that pays throws its value at
                 the chip it feeds — chips to the blue one, mult to the red
                 one — and the chip takes the hit: it swells, flashes, sheds
                 sparks and shakes the table; a ×mult hits hardest
         merge   the two chips wind back and crash together in the middle
         total   the product counts up in gold over a sunburst, as big as
                 the hand is worth
         hold    a beat to read it, then settle() pays it

       The chips heat up with what the hand is worth (a glow around them,
       a tremor on the figures). A tap anywhere hurries the rest of the
       count. TALLY_STEP is the gap between two throws, tightening a little
       as a long count goes on; 0 pays at once (the bench).
       =================================================================== */

    var T_INTRO = 0.6, T_FLY = 0.28, T_MERGE = 0.42, T_COUNT = 0.65, T_TOTAL = 1.15, T_BUST = 0.95;

    function backOut(t) { var c = 1.70158; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; }
    function backIn(t) { var c = 1.70158; return (c + 1) * t * t * t - c * t * t; }
    function cubicOut(t) { t = 1 - t; return 1 - t * t * t; }

    function tallyY() { return L.cardCY + 30; }
    /* -1 the chips, +1 the mult. In the merge they wind back, then meet. */
    function chipPos(side) {
      var x = Layout.cx + side * 138, T = tally;
      if (T && T.phase === "merge") x += (Layout.cx - x) * backIn(clamp(T.t / T_MERGE, 0, 1));
      return { x:x, y:tallyY() };
    }
    function stepGap(n) { return Math.max(TALLY_STEP * 0.62, TALLY_STEP * (1 - 0.05 * n)); }
    /* how hot the hand runs, 0..1: what the two chips make right now */
    function tallyHeat() { return tally ? clamp(Math.log(1 + tally.chips * tally.mult) / Math.log(1500), 0, 1) : 0; }

    function fireStep(T, n) {
      var st = tallyPartOf(T).steps, s = st[n], p = st[n - 1];
      lit.who = s.who; lit.idx = s.idx; lit.t = 1;
      var src = s.who === "card" ? { x:slotPose(s.idx).x, y:L.slotY - L.slotH / 2 }
              : s.who === "pot"  ? { x:L.potX, y:L.potY - 20 }
                                 : { x:railX(s.idx), y:L.railY + 44 };
      if (s.who === "pot") { T.potOut = true; potHit = 1; Fx.burst(src.x, src.y, { color:[GOLD, "#ffffff"], count:22, speed:420, life:0.5, grav:500 }); }
      var to = s.e && s.e.k === "xmult" ? "x" : s.chips !== p.chips ? "c" : s.mult === p.mult ? "" : "m";
      if (!to) {                                    // a glass that shattered: nothing to throw
        Pop.text(src.x, src.y - 20, s.text, { color:s.col, size:22, life:0.6, tier:1 });
        Fx.burst(src.x, src.y, { color:[MOD_COL.glass, "#ffffff"], count:16, speed:360, life:0.5, grav:900 });
        Sound.cue("bin", 0.4, 1.3, 260, 0.06, "sawtooth");
        return;
      }
      T.flights.push({ x0:src.x, y0:src.y, to:to, s:s, t:0 });
      Fx.burst(src.x, src.y, { color:[s.col, "#ffffff"], count:8, speed:260, life:0.35 });
      Sound.cue("deal", 0.22, 1.35, 700, 0.03, "square");
    }

    /* A throw lands: the chip takes the new figure and the hit. A × does
       not land at once: its burst sticks to the red chip, which reads
       "13 ×2" and trembles for T_OP, then flips to 26 with the hardest hit
       of the count (opDone). The count waits for it. */
    var T_OP = 0.55;
    function landStep(T, f) {
      var side = f.to === "c" ? -1 : 1, c = chipPos(side), col = side < 0 ? CHIP_COL : MULT_COL;
      var n = T.landed++;
      if (f.to === "x") {
        T.op = { s:f.s, t:0 };
        T.pm = 0.5;
        Fx.ring(c.x, c.y, { from:60, to:150, color:XMULT_COL, width:6, life:0.3 });
        Sound.cue("tally", 0.42, 0.8, 660, 0.05, "triangle");
        return;
      }
      T.chips = f.s.chips; T.mult = f.s.mult;
      if (side < 0) T.pc = 1; else T.pm = 1;
      Fx.burst(c.x, c.y, { color:[col, "#ffffff", GOLD], count:14, speed:420, life:0.5, grav:600 });
      Fx.ring(c.x, c.y, { from:70, to:180, color:col, width:7, life:0.36 });
      Fx.shake(side < 0 ? 5 : 8, 0.18);
      Sound.cue("tally", 0.42, 0.95 + Math.min(n, 14) * 0.06, 880, 0.04, "triangle");
    }
    function opDone(T) {
      var c = chipPos(1), s = T.op.s;
      T.op = null;
      T.chips = s.chips; T.mult = s.mult; T.pm = 1.6;
      Fx.burst(c.x, c.y, { color:[XMULT_COL, "#ffffff", GOLD], count:38, speed:720, life:0.7, grav:600 });
      Fx.ring(c.x, c.y, { from:70, to:310, color:XMULT_COL, width:12, life:0.55 });
      Fx.ring(c.x, c.y, { from:40, to:200, color:"#ffffff", width:5, life:0.4 });
      Fx.flash(XMULT_COL, 0.32, 2.2);
      Fx.shake(16, 0.32);
      Fx.freeze(0.08);
      Sound.cue("joker", 0.55, 1.2, 760, 0.12, "triangle");
    }

    function tickTally(dt) {
      if (landing.length) return;                    // the last card lands first
      var T = tally, res = T.res, i, cx = Layout.cx, y = tallyY();
      var part = res.bust ? null : tallyPartOf(T), steps = part ? part.steps : [];
      if (T.fast) dt *= 2.6;
      T.t += dt; T.clock += dt;
      T.pc = Math.max(0, T.pc - dt * 3.5);
      T.pm = Math.max(0, T.pm - dt * 3.5);
      T.pt = Math.max(0, T.pt - dt * 2.5);
      if (T.op) {                                    // a × on the chip: everything waits
        T.op.t += dt;
        if (T.op.t >= T_OP) opDone(T);
        return;
      }
      for (i = 0; i < T.flights.length; i++) {
        T.flights[i].t += dt / T_FLY;
        if (T.flights[i].t >= 1) { landStep(T, T.flights.splice(i, 1)[0]); i--; }
      }

      if (T.phase === "bust") {
        if (!T.slam && T.t > 0.14) {
          T.slam = true;
          Fx.flash(BIN_COL, 0.3, 2.2);
          Fx.shake(14, 0.32);
          Fx.burst(cx, y, { color:[BIN_COL, "#2a0a10"], count:30, speed:520, life:0.6, grav:1200 });
        }
        if (T.t >= T_BUST) settle(res);
        return;
      }

      if (T.phase === "intro") {
        if (!T.slam && T.t > 0.2) {
          T.slam = true;
          var lvl = CAT_ORDER[part.cat];
          Fx.shake(5 + lvl * 1.5, 0.24);
          Fx.ring(cx, y - 150, { from:40, to:300 + lvl * 30, color:GOLD, width:6, life:0.45 });
          Fx.burst(cx, y - 150, { color:[GOLD, "#ffffff"], count:12 + lvl * 3, speed:480, life:0.55, grav:700 });
          Sound.cue("keep", 0.5, 0.8 + lvl * 0.04, 520, 0.08, "triangle");
        }
        if (T.t >= T_INTRO) { T.phase = "steps"; T.t = 0; T.wait = 0; }
        return;
      }

      if (T.phase === "steps") {
        if (T.t < T.wait) return;
        if (T.i < steps.length) {
          fireStep(T, T.i);
          T.wait = stepGap(T.i); T.i++; T.t = 0;
          return;
        }
        if (T.flights.length || T.t < T.wait + 0.3) return;
        T.phase = "merge"; T.t = 0;
        Sound.cue("deal", 0.35, 0.7, 400, 0.08, "square");
        return;
      }

      if (T.phase === "merge") {
        if (T.t < T_MERGE) return;
        T.phase = "total"; T.t = 0; T.pt = 1;
        var big = T.banked + part.total >= 600 || CAT_ORDER[part.cat] >= CAT_ORDER.flush;
        Fx.flash(GOLD, big ? 0.45 : 0.32, 2);
        Fx.ring(cx, y, { from:30, to:big ? 520 : 380, color:GOLD, width:14, life:0.6 });
        Fx.ring(cx, y, { from:20, to:260, color:"#ffffff", width:6, life:0.4 });
        Fx.burst(cx, y, { color:[GOLD, "#ffffff", CHIP_COL, MULT_COL], count:big ? 60 : 36, speed:big ? 820 : 600, life:0.8, grav:700 });
        Fx.shake(big ? 20 : 12, 0.36);
        Fx.freeze(big ? 0.1 : 0.06);
        Sound.cue("pay", 0.4, 0.7, 500, 0.12, "triangle");
        return;
      }

      // total: count up, a tick per notch, then a punch once it stands
      var k = clamp(T.t / T_COUNT, 0, 1), notch = Math.floor(k * 10);
      if (notch > T.ticks && k < 1) {
        T.ticks = notch;
        Sound.cue("tally", 0.22, 1 + notch * 0.07, 990, 0.03, "triangle");
      }
      if (k >= 1 && T.ticks < 99) {
        T.ticks = 99; T.pt = 1;
        Fx.burst(cx, y, { color:[GOLD, "#ffffff"], count:24, speed:560, life:0.6, grav:400 });
        Fx.shake(8, 0.2);
      }
      if (T.t >= T_TOTAL) {
        if (T.p < res.parts.length - 1) tallyPart(T, T.p + 1);   // the next hand it makes
        else settle(res);
      }
    }

    /* ===================================================================
       RENDER
       =================================================================== */

    function font(size, weight) {
      return (weight || 900) + " " + Math.round(size) + "px -apple-system,Segoe UI,Roboto,sans-serif";
    }
    function roundRectOn(g, x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }
    function roundRect(x, y, w, h, r) { roundRectOn(ctx, x, y, w, h, r); }

    /* Words wrapped to a width, in the font already set on ctx. */
    function wrap(txt, maxW) {
      var words = String(txt).split(" "), lines = [], line = "", i, t;
      for (i = 0; i < words.length; i++) {
        t = line ? line + " " + words[i] : words[i];
        if (line && ctx.measureText(t).width > maxW) { lines.push(line); line = words[i]; }
        else line = t;
      }
      if (line) lines.push(line);
      return lines;
    }

    /* --- the four suits, as paths ---------------------------------------
       A ten of clubs carries ten pips and every card on screen carries its
       corner indices, so a fillText per pip would put a hundred glyph draws in
       the frame. Paths cost nothing, scale to any card size without a second
       atlas, and give the pips the same silhouette at every size. */
    function heartInto(g, r, sy) {                    // sy -1 flips it: a spade
      g.moveTo(0, sy * r * 0.92);
      g.bezierCurveTo(-r * 1.32, sy * -r * 0.18, -r * 0.60, sy * -r * 1.12, 0, sy * -r * 0.40);
      g.bezierCurveTo(r * 0.60, sy * -r * 1.12, r * 1.32, sy * -r * 0.18, 0, sy * r * 0.92);
      g.closePath();
    }
    function stemInto(g, r) {                         // the foot of ♠ and ♣
      g.moveTo(-r * 0.36, r * 0.98);
      g.bezierCurveTo(-r * 0.11, r * 0.66, -r * 0.07, r * 0.34, -r * 0.06, r * 0.12);
      g.lineTo(r * 0.06, r * 0.12);
      g.bezierCurveTo(r * 0.07, r * 0.34, r * 0.11, r * 0.66, r * 0.36, r * 0.98);
      g.closePath();
    }
    function lobeInto(g, cx, cy, rr) {
      g.moveTo(cx + rr, cy);
      g.arc(cx, cy, rr, 0, Math.PI * 2);
    }
    /* One pip, centred on the current origin, `s` tall. */
    function pipPath(g, suit, s) {
      var r = s / 2;
      g.beginPath();
      if (suit === 2) {                                              // diamond
        g.moveTo(0, -r); g.lineTo(r * 0.70, 0); g.lineTo(0, r); g.lineTo(-r * 0.70, 0);
        g.closePath();
      } else if (suit === 1) {                                       // heart
        heartInto(g, r, 1);
      } else if (suit === 0) {                                       // spade
        heartInto(g, r, -1); stemInto(g, r);
      } else {                                                       // club
        lobeInto(g, 0, -r * 0.46, r * 0.40);
        lobeInto(g, -r * 0.44, r * 0.18, r * 0.40);
        lobeInto(g, r * 0.44, r * 0.18, r * 0.40);
        stemInto(g, r);
      }
    }

    /* A numbered card: its pips, laid out the way a printed deck lays them. */
    function drawPips(c, w, h, col) {
      var lay = PIP_LAYOUT[c.r], colX = w * 0.215, rowY = h * 0.30;
      var s = c.r === 0 ? w * 0.44 : w * 0.198;      // the ace gets one big pip
      ctx.fillStyle = col;
      for (var i = 0; i < lay.length; i++) {
        ctx.save();
        ctx.translate(lay[i][0] * colX, lay[i][1] * rowY);
        if (lay[i][1] > 0.001) ctx.rotate(Math.PI);  // lower half prints inverted
        pipPath(ctx, c.s, s);
        ctx.fill();
        ctx.restore();
      }
    }

    /* The painted illustrations of the three court cards, from
       assets/image/object/slipdeck-card-{jack,queen,king}.png, named by the
       manifest's art.objects. They are drawn WITHOUT a suit — no heart, no
       spade anywhere in them — which is what lets three pictures dress all
       twelve court cards: the suit and the rank are already said by the
       mirrored corners and by the pip inside the panel. */
    var COURT_ART = { 10: "cardJack", 11: "cardQueen", 12: "cardKing" };

    function courtArt(c) {
      var img = ArtImages[COURT_ART[c.r]];
      // An <img> is only safe to draw once it has decoded; the preloader waits
      // for all of them before the intro, so this is the file:// / cache-miss
      // case, and the drawn-by-hand panel below is the fallback.
      return img && img.complete && img.naturalWidth ? img : null;
    }

    function drawCourt(c, w, h, col, hidden) {
      var iw = w * 0.60, ih = h * 0.62, q;
      var art = courtArt(c);

      roundRect(-iw / 2, -ih / 2, iw, ih, w * 0.05);
      ctx.fillStyle = rgba(col, 0.07); ctx.fill();
      ctx.lineWidth = Math.max(2, w * 0.012);
      ctx.strokeStyle = rgba(col, 0.5); ctx.stroke();
      roundRect(-iw / 2 + w * 0.03, -ih / 2 + w * 0.03, iw - w * 0.06, ih - w * 0.06, w * 0.035);
      ctx.lineWidth = Math.max(1, w * 0.006); ctx.stroke();

      if (art) {
        /* The illustration fills the inner panel, clipped to the panel's own
           rounded rect so it cannot spill over the double border, and
           `contain`-fitted so a picture whose aspect ratio differs from the
           panel's is never stretched. */
        var pad = w * 0.03;
        var bw = iw - pad * 2, bh = ih - pad * 2;
        var s = Math.min(bw / art.naturalWidth, bh / art.naturalHeight);
        var dw = art.naturalWidth * s, dh = art.naturalHeight * s;
        ctx.save();
        roundRect(-iw / 2 + pad, -ih / 2 + pad, bw, bh, w * 0.035);
        ctx.clip();
        ctx.drawImage(art, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
        return;
      }
      // No picture: the plain divided panel this card has always had.
      ctx.beginPath();
      ctx.moveTo(-iw / 2, 0); ctx.lineTo(iw / 2, 0); ctx.stroke();
      ctx.fillStyle = col;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (q = 0; q < 2; q++) {
        ctx.save();
        if (q) ctx.rotate(Math.PI);
        ctx.font = font(h * 0.19, 900);
        ctx.fillText(RANKS[c.r], 0, -ih * 0.22);
        if (!hidden) {
          ctx.translate(0, -ih * 0.40);
          pipPath(ctx, c.s, w * 0.13);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    /* --- the painted pieces ------------------------------------------------
       The twenty jokers and the six marks of the special cards, cut out of
       assets/image/master/slipdeck-object-{joker,mark}.png and named in the
       manifest's art.objects (`joker01`… in JOKERS order, `mark01`… below).
       An <img> is drawn only once it has decoded. */
    var MARK_N = { gold:1, glass:2, wild:3, lucky:4, curse:5, veil:6 };
    function art(key) {
      var img = ArtImages[key];
      return img && img.complete && img.naturalWidth ? img : null;
    }
    function jokerArt(id) {
      for (var i = 0; i < JOKERS.length; i++) if (JOKERS[i].id === id) return art("joker" + (i < 9 ? "0" : "") + (i + 1));
      return null;
    }
    function markArt(k) { return art("mark0" + MARK_N[k]); }
    /* an image fitted (contain) in a box centred on cx, cy */
    function fitImg(img, cx, cy, w, h) {
      if (!img) return;
      var s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      ctx.drawImage(img, cx - img.naturalWidth * s / 2, cy - img.naturalHeight * s / 2,
                    img.naturalWidth * s, img.naturalHeight * s);
    }
    /* A soft shadow with no shadowBlur: three widening dark shapes. */
    function shadowUnder(x, y, w, h, r, a) {
      for (var i = 3; i >= 1; i--) {
        roundRect(x - i * 3, y - i * 3 + 10, w + i * 6, h + i * 6, r + i * 3);
        ctx.fillStyle = "rgba(0,0,0," + a + ")"; ctx.fill();
      }
    }

    /* One card face, drawn in design units — the IVORY face: a cream gradient
       inside a double gilded rim, the suit as a faint watermark behind the
       pips, the two corners mirrored the way a real card is. A special card
       wears its painted mark as a sticker on the top-right corner, in a ring
       of its colour; a cursed one is dark; a veiled one shows its rank and a
       "?" for a suit. */
    function drawCard(c, x, y, w, h, rot, alpha, tint) {
      ctx.save();
      ctx.translate(x, y);
      if (rot) ctx.rotate(rot);
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      var r = w * 0.085, hidden = veiled(c);
      var modKey = c.curse ? "curse" : c.mod ? c.mod : hidden ? "veil" : null;
      var rim = modKey ? (modKey === "curse" ? CURSE_COL : modKey === "veil" ? VEIL_COL : MOD_COL[modKey]) : "#c9a24a";

      if (w > 150) shadowUnder(-w / 2, -h / 2, w, h, r, 0.10);
      roundRect(-w / 2, -h / 2, w, h, r);
      if (c.curse) ctx.fillStyle = "#24152f";
      else {
        var g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        g.addColorStop(0, c.mod === "gold" ? "#fff4cf" : c.mod === "glass" ? "#f1f9ff" : c.mod === "lucky" ? "#f1fcef" : "#fbf7ec");
        g.addColorStop(1, "#ece2c9");
        ctx.fillStyle = g;
      }
      ctx.fill();
      ctx.lineWidth = Math.max(2, w * 0.022); ctx.strokeStyle = rim; ctx.stroke();
      roundRect(-w / 2 + w * 0.045, -h / 2 + w * 0.045, w * 0.91, h - w * 0.09, r * 0.7);
      ctx.lineWidth = Math.max(1, w * 0.007); ctx.strokeStyle = rgba(rim, 0.55); ctx.stroke();

      var col = c.curse ? "#dcc2f7" : hidden ? "#5f6a64" : SUIT_RED[c.s] ? INK_RED : INK_BLACK;
      var small = w * 0.17, pad = w * 0.115, q;

      if (!hidden && w > 150) {                       // the suit, as a watermark
        ctx.save(); ctx.globalAlpha *= 0.08; ctx.fillStyle = col;
        pipPath(ctx, c.s, w * 0.9); ctx.fill(); ctx.restore();
      }
      if (hidden && c.r <= 9) {                       // the pips would say the suit
        ctx.fillStyle = col;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = font(w * 0.5, 900);
        ctx.fillText("?", 0, 0);
      } else if (c.r <= 9) drawPips(c, w, h, col);
      else drawCourt(c, w, h, col, hidden);

      ctx.fillStyle = col;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (q = 0; q < 2; q++) {
        ctx.save();
        if (q) ctx.rotate(Math.PI);
        ctx.font = font(small, 900);
        ctx.fillText(RANKS[c.r], -w / 2 + pad, -h / 2 + pad * 0.95);
        // the corner's suit is an index, not a pip: well under the face's
        // pips (w * 0.198) so it is never counted with them
        ctx.translate(-w / 2 + pad, -h / 2 + pad * 1.85);
        if (hidden) { ctx.font = font(small * 0.6, 900); ctx.fillText("?", 0, 0); }
        else { pipPath(ctx, c.s, w * 0.085); ctx.fill(); }
        ctx.restore();
      }

      if (modKey) {                                   // the mark, stuck on the corner
        var ms = w * (w > 150 ? 0.42 : 0.52);
        ctx.save();
        ctx.translate(w / 2 - ms * 0.32, -h / 2 + ms * 0.32); ctx.rotate(0.18);
        ctx.beginPath(); ctx.arc(0, 0, ms * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(10,14,12,.8)"; ctx.fill();
        ctx.lineWidth = Math.max(2, w * 0.016); ctx.strokeStyle = rim; ctx.stroke();
        fitImg(markArt(modKey), 0, 0, ms * 0.86, ms * 0.86);
        ctx.restore();
      }

      if (tint) { roundRect(-w / 2, -h / 2, w, h, r); ctx.fillStyle = tint; ctx.fill(); }
      ctx.restore();
    }

    /* The gates: three chevrons each side, pointing out, the label under
       them. A light runs through them outward, over and over, so they read
       as a way the card goes; the one the card leans toward lights with the
       pull. A tap on them only nudges the card their way (nudge) — the
       swipe is the game, and the rules are read on the deck and on the card. */
    var CHEV_EVERY = 3.2, CHEV_LEN = 0.9, CHEV_GAP = 0.22;
    function drawChevrons(x, side, col, label, lit) {
      var y = L.gateY, i;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (i = 0; i < 3; i++) {
        // one slow wave every CHEV_EVERY s, each chevron lit CHEV_LEN s, the next one CHEV_GAP s later
        var u = (clock % CHEV_EVERY - i * CHEV_GAP) / CHEV_LEN, w = u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
        var cx = x + side * (i * 18 - 18 + w * 6), a = 0.2 + 0.18 * i + w * 0.7 + lit * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - side * 9, y - 24); ctx.lineTo(cx + side * 9, y); ctx.lineTo(cx - side * 9, y + 24);
        if (w > 0) { ctx.lineWidth = 17; ctx.strokeStyle = rgba(col, w * 0.22); ctx.stroke(); }   // the glow, a wide faint stroke
        ctx.lineWidth = 7; ctx.strokeStyle = rgba(col, Math.min(1, a)); ctx.stroke();
      }
      ctx.lineCap = "butt";
      ctx.fillStyle = rgba(col, 0.75 + lit * 0.25); ctx.font = font(20, 900);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(upper(label), x, y + 50);
    }

    /* The rail: the jokers as medallions, in the order they count, left to
       right — the painted piece in a disc of its family's colour, its name
       under it. A tap opens what one does. A FATE joker wears a green dot
       while it is ready this hand and dims once spent; Called shot wears the
       hand it called. */
    function drawRail() {
      var i, R = L.medalR;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (i = 0; i < SLOTS; i++) {
        var cx = railX(i), my = L.railY + 44, inst = rail[i];
        if (!Enter.begin(cx, my)) continue;
        var hot = lit.t > 0 && lit.who === "joker" && lit.idx === i;
        ctx.save();
        if (hot) { var k = 1 + lit.t * 0.25; ctx.translate(cx, my); ctx.scale(k, k); ctx.translate(-cx, -my); }
        ctx.beginPath(); ctx.arc(cx, my, R, 0, Math.PI * 2);
        if (!inst) {
          ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fill();
          ctx.setLineDash([7, 7]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.stroke();
          ctx.setLineDash([]); ctx.restore(); Enter.end();
          continue;
        }
        var J = JOKER_BY[inst.id], col = FAM_COL[J.fam];
        var spentNow = J.act && used[inst.id];
        if (spentNow) ctx.globalAlpha = 0.45;
        var mg = ctx.createRadialGradient(cx, my - 10, 4, cx, my, R);
        mg.addColorStop(0, rgba(col, hot ? 0.8 : 0.45)); mg.addColorStop(1, "#130f26");
        ctx.fillStyle = mg; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, my, R + 5, 0, Math.PI * 2);
        ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(245,196,81,.6)"; ctx.stroke();
        if (jokerArt(inst.id)) fitImg(jokerArt(inst.id), cx, my, R * 1.7, R * 1.7);
        else {                                        // no painted piece cut yet: its sign
          ctx.fillStyle = col; ctx.font = font(44, 900);
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(J.sign || "?", cx, my + 2);
        }
        ctx.fillStyle = "#f4f1ff"; ctx.font = font(20, 900);
        var nm = wrap(upper(Lang.t(J.name)), railW() - 8);
        ctx.fillText(nm[0] + (nm.length > 1 ? "…" : ""), cx, L.railY + 104);
        var counter = inst.id === "ascetic" && inst.n ? "+" + inst.n
                    : inst.id === "veteran" && hands ? "+" + hands
                    : inst.id === "collector" && catStreak > 1 ? "x" + catStreak : "";
        ctx.restore();
        if (counter) badge(cx + R * 0.8, my - R * 0.8, counter, MULT_COL);
        if (J.act && !spentNow) {                     // ready this hand
          ctx.beginPath(); ctx.arc(cx + R * 0.74, my + R * 0.74, 11, 0, Math.PI * 2);
          ctx.fillStyle = KEEP_COL; ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = "#0b2419"; ctx.stroke();
        }
        if (inst.id === "called" && called) badge(cx, my + R - 4, upper(Lang.t(CAT_NAME[called])), FAM_COL.Fate);
        jokerGain(i, cx, my, R, inst.id === "called" && called);
        Enter.end();
      }
    }
    /* What a joker would pay the hand the value line shows — the hand as
       it stands, or, while the live card leans toward KEEP, the hand with it
       — in the count's colours: chips blue, mult red, ×mult red with its x.
       The same figures the line adds up, so the line reads as its sources.
       Leaning, the joker that would pay glows and its tag swells with the
       pull; one that would not stays as it is. */
    function jokerGain(i, cx, my, R, top) {
      var v = pv && pv.v, j, s = null;
      if (!v || !v.steps || v.bust) return;
      for (j = 0; j < v.steps.length; j++) if (v.steps[j].who === "joker" && v.steps[j].idx === i) s = v.steps[j];
      if (!s || !s.e) return;
      var e = s.e, xm = e.k === "xmult", col = e.k === "chips" ? CHIP_BOX : MULT_BOX;
      var txt = xm ? "×" + Math.round(e.v * 100) / 100 : (e.v > 0 ? "+" : "") + e.v;
      var y = top ? my - R + 10 : my + R - 12;
      ctx.save();
      if (pv.lean) {
        var k = 0.6 + 0.4 * pv.pull;
        ctx.beginPath(); ctx.arc(cx, my, R + 10, 0, Math.PI * 2);
        ctx.lineWidth = 5; ctx.strokeStyle = rgba(xm ? XMULT_COL : col === CHIP_BOX ? CHIP_COL : MULT_COL, 0.35 + 0.45 * pv.pull); ctx.stroke();
        ctx.translate(cx, y); ctx.scale(1 + 0.25 * pv.pull, 1 + 0.25 * pv.pull); ctx.translate(-cx, -y);
        ctx.globalAlpha = k;
      } else ctx.globalAlpha = v.dim ? 0.55 : 0.9;
      if (xm) xBadge(cx, y, txt); else badge(cx, y, txt, col);
      ctx.restore();
    }
    function badge(x, y, txt, col) { pillOn(ctx, x, y, txt, col, 1); }
    function xBadge(x, y, txt) { burstOn(ctx, x, y, txt, 1); }
    function pillOn(g, x, y, txt, col, s) {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.font = font(20, 900);
      var w = Math.max(34, g.measureText(txt).width + 16);
      roundRectOn(g, -w / 2, -15, w, 30, 15); g.fillStyle = col; g.fill();
      g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(txt, 0, 1);
      g.restore();
    }
    /* The ×mult's mark: a twelve-point burst in orange, rimmed in gold. */
    function burstOn(g, x, y, txt, s) {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.font = font(22, 900);
      var r = Math.max(24, g.measureText(txt).width / 2 + 13), i, n = 12;
      g.beginPath();
      for (i = 0; i < n * 2; i++) {
        var a = i * Math.PI / n - Math.PI / 2, rr = i % 2 ? r * 0.8 : r;
        if (i) g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.closePath();
      var gr = g.createLinearGradient(0, -r, 0, r);
      gr.addColorStop(0, XMULT_COL); gr.addColorStop(1, XMULT_BOX);
      g.fillStyle = gr; g.fill();
      g.lineWidth = 3; g.strokeStyle = "#ffe08a"; g.stroke();
      g.textAlign = "center"; g.textBaseline = "middle";
      g.lineWidth = 4; g.strokeStyle = "rgba(60,20,0,.55)"; g.strokeText(txt, 0, 1);
      g.fillStyle = "#ffffff"; g.fillText(txt, 0, 1);
      g.restore();
    }

    /* The bins: red tokens, one spent per card binned — the price of saying
       no, and the bench says it has to be impossible to miss. */
    function drawBins() {
      var cap = chuteCap(), y = L.binsY, i;
      ctx.textBaseline = "middle"; ctx.textAlign = "right"; ctx.font = font(22, 900);
      ctx.fillStyle = chute >= cap ? BIN_COL : "rgba(255,255,255,.5)";
      ctx.fillText(upper(Lang.t("Bins")), Layout.cx - 20, y);
      for (i = 0; i < cap; i++) {
        var tx = Layout.cx + 10 + i * 34, used = i < chute;
        ctx.beginPath(); ctx.arc(tx, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = used ? "rgba(255,255,255,.08)" : "#d5263c"; ctx.fill();
        ctx.lineWidth = 3; ctx.setLineDash(used ? [4, 4] : [5, 3]);
        ctx.strokeStyle = used ? "rgba(255,255,255,.25)" : "#ffd6dc"; ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    /* The joker gauge, under the bins and in their shape: gold diamonds,
       one lit per point a paid hand put in. It pulses once full. */
    function drawGauge() {
      var y = L.gaugeY, i, full = pendingPick || !!pick;
      ctx.textBaseline = "middle"; ctx.textAlign = "right"; ctx.font = font(22, 900);
      ctx.fillStyle = full ? GOLD : "rgba(255,255,255,.5)";
      ctx.fillText(upper(Lang.t("Joker")), Layout.cx - 20, y);
      for (i = 0; i < PICK_GAUGE; i++) {
        var tx = Layout.cx + 10 + i * 34, on = full || i < gauge;
        ctx.beginPath();
        ctx.moveTo(tx, y - 14); ctx.lineTo(tx + 12, y); ctx.lineTo(tx, y + 14); ctx.lineTo(tx - 12, y);
        ctx.closePath();
        ctx.fillStyle = on ? GOLD : "rgba(255,255,255,.08)"; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = on ? "#fff3c4" : "rgba(255,255,255,.25)"; ctx.stroke();
      }
    }

    /* Card counter: what is left in the deck, down the left flank above the
       BIN gate — each suit, then the faces. The card waiting to be dealt is
       still in the deck, as far as the player can know. */
    function drawCounter() {
      var n = [0, 0, 0, 0], faces = 0, i, c, x = Layout.left + 40, y0 = L.gateY - 196;
      for (i = 0; i <= shoe.length; i++) {
        c = i < shoe.length ? shoe[i] : upcoming;
        if (!c) continue;
        n[c.s]++; if (c.r >= 10) faces++;
      }
      ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.font = font(22, 900);
      for (i = 0; i < 4; i++) {
        var y = y0 + i * 32;
        ctx.save(); ctx.translate(x - 12, y);
        ctx.fillStyle = SUIT_RED[i] ? "#ff8a98" : "#f4efe2";
        pipPath(ctx, i, 22); ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#ffffff"; ctx.fillText(String(n[i]), x + 6, y + 1);
      }
      ctx.fillStyle = GOLD; ctx.fillText(upper(Lang.t("Faces")) + " " + faces, x - 24, y0 + 4 * 32 + 1);
    }

    /* The Pocket's card, aside on the right flank above the KEEP gate —
       and while it is empty, its slot: the place a card is dragged to. */
    function drawPocket() {
      var b = pocketBox(), w = b.w, h = b.h, x = b.x, y = b.y;
      if (pocket) drawCard(pocket, x, y, w, h, 0.06, 1, null);
      else {
        ctx.beginPath(); roundRect(x - w / 2, y - h / 2, w, h, 10);
        ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fill();
        ctx.setLineDash([7, 7]); ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(FAM_COL.Fate, 0.6); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = FAM_COL.Fate; ctx.font = font(20, 900);
      ctx.fillText(upper(Lang.t("Pocket")), x, y - h / 2 - 16);
    }

    /* What a set of cards is worth as it stands: scoreHand's count with
       nothing random, and — on a hand not yet full — no bust for a high card
       or a low pair, which the next cards may still mend: they read dim. */
    function worth(cards) {
      if (!cards.length) return null;
      var full = cards.length >= HAND_SIZE, i;
      for (i = 0; i < cards.length; i++) if (veiled(cards[i])) return { name:"?", unknown:true };
      var res = scoreHand(cards, true);
      if (!res.bust) return res;
      if (full || res.why === "Cursed") return res;
      /* not full: count it as it stands, dimmed — and a high card is not
         worth a word: the hand shows nothing until it holds something */
      var ev = evalHand(cards), b = BASE[ev.cat], chips = b[0], mult = b[1];
      if (ev.cat === "high") return null;
      for (i = 0; i < cards.length; i++) if (ev.scoring[i]) chips += rankChips(cards[i].r);
      return { name:ev.name, chips:chips, mult:mult, dim:true };
    }

    /* Over the hand: its name, and chips x mult in the count's own colours —
       blue and red. While the live card leans toward KEEP, what keeping it
       would make takes the place, behind an arrow. */
    var pv = null;                                   // this frame's preview: { v, lean }
    function preview() {
      var now = worth(hand), next = null, pull = cur ? clamp(cur.x / SWIPE_DIST, 0, 1) : 0;
      if (cur && cur["in"] >= 1 && pull > 0.25) next = worth(hand.concat([cur.card]));
      return { v:next || now, lean:!!next, pull:pull };
    }
    function drawValue() {
      var v = pv && pv.v;
      if (!v) return;
      var y = L.valueY, lean = pv.lean, x0 = Layout.left + 14;
      var multi = v.parts && v.parts.length > 1;
      var name = v.bust ? Lang.t("Bust") : v.unknown ? "?" : multi ? handName(v.parts) : Lang.t(v.name);
      ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.font = font(26, 900);
      ctx.fillStyle = v.bust ? BIN_COL : v.dim || v.unknown ? "rgba(255,255,255,.5)" : GOLD;
      var label = (lean ? "→ " : "") + upper(name);
      ctx.fillText(label, x0, y);
      if (v.bust || v.unknown) return;
      if (!multi) { figures(Layout.right - 14, y, v.chips, v.mult, v.dim); return; }
      /* two hands: each one's chips x mult, joined by a +, the weakest on
         the left like the count plays them — or, where the line has no room
         for both, what they pay together */
      var room = Layout.right - 14 - (x0 + ctx.measureText(label).width + 24), w = 0, i;
      for (i = 0; i < v.parts.length; i++) w += figuresW(v.parts[i].chips, v.parts[i].mult) + (i ? 40 : 0);
      if (w > room) { totalPill(Layout.right - 14, y, v.total); return; }
      var xr = Layout.right - 14;
      for (i = v.parts.length - 1; i >= 0; i--) {
        figures(xr, y, v.parts[i].chips, v.parts[i].mult, false);
        xr -= figuresW(v.parts[i].chips, v.parts[i].mult);
        if (i) {
          ctx.font = font(24, 900); ctx.textAlign = "center"; ctx.fillStyle = GOLD;
          ctx.fillText("+", xr - 20, y + 1);
          xr -= 40;
        }
      }
    }
    function totalPill(xr, y, total) {
      var t = "= " + total;
      ctx.font = font(24, 900); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var w = ctx.measureText(t).width + 28;
      roundRect(xr - w, y - 18, w, 36, 10); ctx.fillStyle = "#8a5a10"; ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.fillText(t, xr - w / 2, y + 1);
    }
    function figures(xr, y, c, m, dim) {
      var ms = String(Math.round(m * 100) / 100), cs = String(c);
      ctx.font = font(24, 900); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var mw = ctx.measureText(ms).width + 24, cw = ctx.measureText(cs).width + 24, x = xr;
      ctx.save(); if (dim) ctx.globalAlpha *= 0.55;
      roundRect(x - mw, y - 18, mw, 36, 10); ctx.fillStyle = MULT_BOX; ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.fillText(ms, x - mw / 2, y + 1);
      x -= mw + 30;
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillText("x", x + 15, y + 1);
      roundRect(x - cw, y - 18, cw, 36, 10); ctx.fillStyle = CHIP_BOX; ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.fillText(cs, x - cw / 2, y + 1);
      ctx.restore();
    }

    /* The count, where the card stood (THE COUNT, above): the hand's name
       over two casino chips, chips in blue and mult in red, the throws in
       flight between the table and the chips, then the total. */
    function drawTally() {
      if (!tally) return;
      var T = tally, res = T.res, cx = Layout.cx, y = tallyY(), i, k;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineJoin = "round";

      if (T.phase === "bust") {
        k = backOut(clamp(T.t / 0.3, 0, 1));
        var jit = T.t < 0.5 ? Math.sin(T.clock * 70) * 6 * (1 - T.t / 0.5) : 0;
        ctx.save();
        ctx.translate(cx + jit, y); ctx.scale(2.6 - 1.6 * k, 2.6 - 1.6 * k);
        ctx.globalAlpha = clamp(T.t / 0.12, 0, 1);
        ctx.font = font(56, 900);
        ctx.lineWidth = 10; ctx.strokeStyle = "rgba(20,4,8,.8)";
        ctx.strokeText(upper(Lang.t(res.why)), 0, 0);
        ctx.fillStyle = BIN_COL; ctx.fillText(upper(Lang.t(res.why)), 0, 0);
        ctx.restore();
        return;
      }

      var heat = tallyHeat();

      // the name: slammed down from twice its size, then breathing
      var ki = T.phase === "intro" ? clamp(T.t / 0.32, 0, 1) : 1;
      var sn = (2.4 - 1.4 * backOut(ki)) * (1 + 0.04 * Math.sin(T.clock * 6) * heat);
      ctx.save();
      ctx.translate(cx, y - 150); ctx.scale(sn, sn);
      ctx.globalAlpha = clamp(ki * 3, 0, 1);
      ctx.font = font(48, 900);
      ctx.lineWidth = 10; ctx.strokeStyle = "rgba(30,16,0,.75)";
      var nm = upper(Lang.t(CAT_NAME[tallyPartOf(T).cat]));
      if (T.p > 0) nm = "+ " + nm;                   // the second hand the cards make
      ctx.strokeText(nm, 0, 0);
      ctx.fillStyle = GOLD; ctx.fillText(nm, 0, 0);
      ctx.restore();

      if (T.phase === "total") { drawTotal(T, cx, y, heat); return; }

      // the chips, popped in one after the other, wound back and merged
      var kc = T.phase === "intro" ? backOut(clamp((T.t - 0.12) / 0.3, 0, 1)) : 1;
      var km = T.phase === "intro" ? backOut(clamp((T.t - 0.24) / 0.3, 0, 1)) : 1;
      var mk = T.phase === "merge" ? clamp(T.t / T_MERGE, 0, 1) : 0;
      var shrink = 1 - 0.45 * mk * mk;
      var a = chipPos(-1), b = chipPos(1);
      if (kc > 0) casinoChip(a.x, a.y, "#2463b8", CHIP_COL, T.chips, kc * shrink, heat, T.pc, T.clock);
      var charge = T.op ? clamp(T.op.t / T_OP, 0, 1) : 0;
      if (km > 0) casinoChip(b.x + Math.sin(T.clock * 55) * 5 * charge, b.y, "#b8243c", MULT_COL,
                             Math.round(T.mult * 100) / 100, km * shrink, heat, T.pm, T.clock + 1.7);
      ctx.save();
      ctx.globalAlpha = clamp(km, 0, 1) * (1 - mk);
      ctx.translate(cx, y); ctx.scale(1 + 0.12 * Math.sin(T.clock * 8) * heat, 1 + 0.12 * Math.sin(T.clock * 8) * heat);
      ctx.font = font(56, 900);
      ctx.lineWidth = 8; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.strokeText("x", 0, 2);
      ctx.fillStyle = "#ffffff"; ctx.fillText("x", 0, 2);
      ctx.restore();

      for (i = 0; i < T.flights.length; i++) drawFlight(T.flights[i]);
      if (T.op) {                                    // "13 ×2": the burst stuck to the chip
        var ko = backOut(clamp(T.op.t / 0.22, 0, 1));
        ctx.save();
        ctx.beginPath(); ctx.arc(b.x, b.y, 96 + 10 * Math.sin(T.clock * 24), 0, Math.PI * 2);
        ctx.lineWidth = 6; ctx.strokeStyle = rgba(XMULT_COL, 0.4 + 0.4 * charge); ctx.stroke();
        ctx.restore();
        burstOn(ctx, b.x + 78, b.y - 70, "×" + Math.round(T.op.s.e.v * 100) / 100, 1.7 * ko * (1 + 0.12 * charge));
      }
    }

    /* A throw in flight: its value on a pill of the chip's colour, arcing
       up from the card or the joker and down onto the chip, swelling on the
       way, a trail of sparks behind it. */
    function drawFlight(f) {
      var to = chipPos(f.to === "c" ? -1 : 1), j;
      // from the hand it arcs over the chip; from the rail it dips under the HUD
      var cxp = (f.x0 + to.x) / 2, cyp = f.y0 > to.y ? to.y - 140 : f.y0 + 30;
      function at(t) {
        var u = 1 - t;
        return { x:u * u * f.x0 + 2 * u * t * cxp + t * t * to.x, y:u * u * f.y0 + 2 * u * t * cyp + t * t * to.y };
      }
      var k = f.t * f.t * (3 - 2 * f.t), col = f.to === "c" ? CHIP_COL : f.to === "x" ? XMULT_COL : MULT_COL;
      var box = f.to === "c" ? CHIP_BOX : MULT_BOX;
      for (j = 4; j >= 1; j--) {
        var q = at(Math.max(0, k - j * 0.05));
        ctx.beginPath(); ctx.arc(q.x, q.y, 14 - j * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = rgba(col, 0.5 - j * 0.1); ctx.fill();
      }
      var p = at(k), sc = (f.to === "x" ? 1.25 : 1) * (0.85 + 0.45 * Math.sin(Math.PI * k));
      if (f.to === "x") { burstOn(ctx, p.x, p.y, f.s.text, 1.4 * sc); return; }
      ctx.save();
      ctx.translate(p.x, p.y); ctx.scale(sc, sc); ctx.rotate((1 - k) * (f.x0 < to.x ? -0.3 : 0.3));
      ctx.font = font(32, 900);
      var w = ctx.measureText(f.s.text).width + 30;
      roundRect(-w / 2, -24, w, 48, 16);
      ctx.fillStyle = box; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = "#ffffff"; ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(f.s.text, 0, 2);
      ctx.restore();
    }

    /* The total over a turning sunburst: it rises from small to its full
       size while it counts up, bigger the more the hand is worth, and takes
       a punch once it stands. The two figures it was made of sit under it.
       The rays shoot out to the edges of the frame and past them — a sun
       held inside a disc reads as a badge — and only thin out on the way. */
    function drawTotal(T, cx, y, heat) {
      var k = clamp(T.t / T_COUNT, 0, 1), i, sum = T.banked + tallyPartOf(T).total;
      var shown = T.banked + Math.round(tallyPartOf(T).total * cubicOut(k));
      var far = Math.sqrt(view.w * view.w + view.h * view.h);
      var R = far * cubicOut(clamp(T.t / 0.35, 0, 1)), rot = T.clock * 0.7, n = 18;
      if (R > 1) {
        var sun = ctx.createRadialGradient(cx, y, 0, cx, y, R);
        sun.addColorStop(0, rgba(GOLD, 0.34 + 0.16 * heat));
        sun.addColorStop(0.3, rgba(GOLD, 0.2 + 0.1 * heat));
        sun.addColorStop(1, rgba(GOLD, 0.06 + 0.05 * heat));
        ctx.beginPath();
        for (i = 0; i < n; i++) {
          var a0 = rot + i * Math.PI * 2 / n;
          ctx.moveTo(cx, y); ctx.arc(cx, y, R, a0, a0 + Math.PI / n * 0.9); ctx.closePath();
        }
        ctx.fillStyle = sun; ctx.fill();
      }
      for (i = 3; i >= 1; i--) {                      // a glow, as rings: no shadowBlur
        ctx.beginPath(); ctx.arc(cx, y, 70 + i * 26, 0, Math.PI * 2);
        ctx.fillStyle = rgba(GOLD, 0.05 + 0.04 * heat); ctx.fill();
      }

      var size = 76 + 46 * clamp(Math.log(1 + sum) / Math.log(5000), 0, 1);
      var sc = (0.35 + 0.65 * backOut(clamp(T.t / 0.3, 0, 1))) * (1 + 0.28 * T.pt);
      var jit = heat > 0.6 ? Math.sin(T.clock * 53) * 3 * heat : 0;
      ctx.save();
      ctx.translate(cx + jit, y); ctx.scale(sc, sc);
      ctx.font = font(size, 900);
      ctx.lineWidth = 16; ctx.strokeStyle = "rgba(40,20,0,.8)"; ctx.strokeText(String(shown), 0, 4);
      var g = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
      g.addColorStop(0, "#fff8dc"); g.addColorStop(0.55, GOLD); g.addColorStop(1, "#d98a1c");
      ctx.fillStyle = g; ctx.fillText(String(shown), 0, 4);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = clamp((T.t - 0.2) / 0.2, 0, 1);
      figures(cx + figuresW(T.chips, T.mult) / 2, y + size * 0.5 + 46, T.chips, T.mult, false);
      ctx.restore();
    }
    function figuresW(c, m) {
      ctx.font = font(24, 900);
      return ctx.measureText(String(Math.round(m * 100) / 100)).width + 24 + 30 +
             ctx.measureText(String(c)).width + 24;
    }

    /* A casino chip carrying its figure. `pulse` is the last hit (it swells
       and flashes white), `heat` how hot the hand runs (a glow that
       flickers around it, a tremor on the figure). */
    function casinoChip(x, y, col, glow, val, s, heat, pulse, t) {
      var R = 82, i;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s * (1 + 0.3 * pulse), s * (1 + 0.3 * pulse));
      if (heat > 0.05) {
        for (i = 3; i >= 1; i--) {
          var fl = 0.7 + 0.3 * Math.sin(t * 17 + i * 2.1);
          ctx.beginPath(); ctx.arc(0, 0, R + i * 11 * fl, 0, Math.PI * 2);
          ctx.fillStyle = rgba(glow, heat * 0.16 * fl); ctx.fill();
        }
      }
      ctx.beginPath(); ctx.arc(0, 7, R, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      for (i = 0; i < 8; i++) {                       // the edge stripes, turning with the hit
        var a = i * Math.PI / 4 + pulse * 0.8;
        ctx.beginPath(); ctx.arc(0, 0, R - 8, a - 0.14, a + 0.14);
        ctx.lineWidth = 14; ctx.strokeStyle = "#f4efe2"; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, R * 0.66, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fill();
      ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.stroke();
      ctx.setLineDash([]);
      if (pulse > 0) {
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + (0.5 * Math.min(1, pulse)) + ")"; ctx.fill();
      }
      var str = String(val), jit = heat > 0.5 ? Math.sin(t * 61) * 2.5 * heat : 0;
      ctx.font = font(str.length > 4 ? 34 : str.length > 3 ? 42 : 54, 900);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 6; ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.strokeText(str, jit, 2);
      ctx.fillStyle = "#ffffff"; ctx.fillText(str, jit, 2);
      ctx.restore();
    }

    /* THE POT, under the bin gate: a stack of casino chips that grows with
       it, its name and its figure under it — ALL IN once the deck cannot
       deal another hand, since the next paid hand takes everything. It
       swells when it is fed, taken from or burnt. The coins of a bin fly
       into it from where the card was flicked. */
    function drawPot() {
      // once the count has thrown the pot's share, the stack shows what is left
      var left = pot - (tally && tally.potOut ? tally.res.pot : 0);
      var x = L.potX, y = L.potY, n = Math.min(8, Math.ceil(left / 10)), i;
      var hit = Math.max(potHit, lit.who === "pot" ? lit.t : 0), k = 1 + 0.2 * hit;
      var allIn = left > 0 && cardsLeft() < HAND_SIZE;
      ctx.save();
      ctx.translate(x, y); ctx.scale(k, k);
      ctx.beginPath(); ctx.ellipse(0, 0, 48, 17, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fill();
      if (!n) {
        ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(245,196,81,.35)"; ctx.stroke();
        ctx.setLineDash([]);
      }
      if (allIn || hit > 0) {                        // a glow, as rings: no shadowBlur
        for (i = 3; i >= 1; i--) {
          ctx.beginPath(); ctx.ellipse(0, -n * 4, 44 + i * 9, 24 + n * 4 + i * 9, 0, 0, Math.PI * 2);
          ctx.fillStyle = rgba(GOLD, 0.06 * Math.max(hit, allIn ? 0.6 + 0.4 * Math.sin(Date.now() / 160) : 0)); ctx.fill();
        }
      }
      var cols = ["#c42f48", "#2f6fc4", "#e9e3d0", "#1f8a5b"];
      for (i = 0; i < n; i++) {                      // the stack, one chip a row
        var cy = -i * 8 - 4;
        ctx.beginPath(); ctx.ellipse(0, cy + 4, 38, 13, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, cy, 38, 13, 0, 0, Math.PI * 2);
        ctx.fillStyle = cols[i % 4]; ctx.fill();
        ctx.setLineDash([7, 7]); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = font(20, 900);
      ctx.fillStyle = allIn ? GOLD : "rgba(245,196,81,.75)";
      ctx.fillText(upper(Lang.t(allIn ? "All in" : "Pot")), x, y + 34);
      ctx.font = font(30, 900);
      ctx.fillStyle = left ? GOLD : "rgba(255,255,255,.4)";
      ctx.fillText(String(left), x, y + 62);

      for (i = 0; i < potFly.length; i++) {          // a bin's coins, on their way
        var f = potFly[i], t = f.t, u = 1 - t;
        var cxp = (f.x0 + x) / 2, cyp = Math.min(f.y0, y) - 120;
        var px = u * u * f.x0 + 2 * u * t * cxp + t * t * x, py = u * u * f.y0 + 2 * u * t * cyp + t * t * (y - 20);
        ctx.beginPath(); ctx.arc(px, py, 15, 0, Math.PI * 2);
        ctx.fillStyle = GOLD; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = "#fff3cf"; ctx.stroke();
      }
    }

    /* A bust burns half the pot — flames up out of the stack — unless
       Fireproof stands on the rail. */
    function burnPot() {
      if (!POT_ON || pot <= 0 || has("fireproof")) return;
      var lost = Math.ceil(pot / 2);
      pot -= lost; potHit = 1;
      Fx.burst(L.potX, L.potY - 20, { color:["#ff7a1c", "#ffd23f", "#ff3b1c"], count:30, speed:360, life:0.8, grav:-420 });
      Pop.text(L.potX, L.potY - 70, "-" + lost, { color:BIN_COL, size:22, life:0.6, tier:1 });
    }

    /* THE PLACES the Seat jokers give a meaning to, marked under the hand:
       Lucky seat's lit place in gold (the empty slot glows too), Keystone's
       middle and Last word's last in the family's ivory. A mark is a tag on
       the slot's foot, so a card sitting there leaves it readable. */
    function drawSeats() {
      var marks = [], i;
      if (seat >= 0) marks.push([seat, "★", GOLD]);
      if (has("keystone")) marks.push([(HAND_SIZE - 1) >> 1, "◆", FAM_COL.Seat]);
      if (has("lastword")) marks.push([HAND_SIZE - 1, "⇥", FAM_COL.Seat]);
      for (i = 0; i < marks.length; i++) {
        var m = marks[i], q = slotPose(m[0]), filled = m[0] < hand.length;
        ctx.save();
        ctx.translate(q.x, q.y); ctx.rotate(q.r);
        if (!filled) {
          roundRect(-L.slotW / 2, -L.slotH / 2, L.slotW, L.slotH, L.slotW * 0.085);
          ctx.fillStyle = rgba(m[2], 0.1 + 0.05 * Math.sin(Date.now() / 220)); ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = rgba(m[2], 0.7); ctx.stroke();
          ctx.font = font(44, 900); ctx.fillStyle = rgba(m[2], 0.8);
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(m[1], 0, 0);
        }
        var ty = L.slotH / 2 - 2, same = 0, j;          // two marks on one place stand side by side
        for (j = 0; j < i; j++) if (marks[j][0] === m[0]) same++;
        var tx = same * 50 - (same ? 25 : 0);
        ctx.translate(tx, 0);
        roundRect(-22, ty - 15, 44, 30, 15);
        ctx.fillStyle = "#14231c"; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = m[2]; ctx.stroke();
        ctx.font = font(20, 900); ctx.fillStyle = m[2];
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(m[1], 0, ty + 1);
        ctx.restore();
      }
    }

    function drawHand() {
      var i, j;
      var scoring = tally && !tally.res.bust ? tallyPartOf(tally).scoring : null;

      for (i = 0; i < HAND_SIZE; i++) {             // each empty slot is an element
        var p = slotPose(i);
        if (!Enter.begin(p.x, p.y)) continue;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        roundRect(-L.slotW / 2, -L.slotH / 2, L.slotW, L.slotH, L.slotW * 0.085);
        ctx.fillStyle = "rgba(255,255,255,.035)"; ctx.fill();
        ctx.setLineDash([9, 9]);
        ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        Enter.end();
      }

      for (i = 0; i < hand.length; i++) {
        var moving = false;
        for (j = 0; j < landing.length; j++) if (landing[j].slot === i) moving = true;
        var q = slotPose(i);
        if (moving || !Enter.begin(q.x, q.y)) continue;
        var hot = lit.t > 0 && lit.who === "card" && lit.idx === i;
        var dy = hot ? -34 * lit.t : (scoring && scoring[i] ? -10 : 0);
        drawCard(hand[i], q.x, q.y + dy, L.slotW, L.slotH, q.r,
                 scoring && !scoring[i] ? 0.55 : 1, null);
        Enter.end();
      }
      for (i = 0; i < landing.length; i++) {
        var la = landing[i], t = 1 - (1 - la.t) * (1 - la.t) * (1 - la.t), to = slotPose(la.slot);
        var lx = la.fx + (to.x - la.fx) * t, ly = la.fy + (to.y - la.fy) * t;
        if (!Enter.begin(lx, ly)) continue;
        drawCard(la.card, lx, ly,
          L.cardW + (L.slotW - L.cardW) * t,
          L.cardH + (L.slotH - L.cardH) * t,
          la.frot * (1 - t) + to.r * t, 1, null);
        Enter.end();
      }

      if (!tally && !landing.length) drawCardWorth();
      if (!tally && Enter.begin(Layout.cx, L.valueY)) { drawValue(); Enter.end(); }
    }

    /* On every card of the hand that counts, what it adds — its chips in
       blue, a glass's ×2 burst or an exorcised curse's +20 in red — pinned on its
       top edge, so the worth over the hand reads as the sum of the cards. */
    function drawCardWorth() {
      var v = worth(hand);
      if (!v || v.bust || v.unknown) return;
      var ev = evalHand(hand), i, c, q, tags;
      for (i = 0; i < hand.length; i++) {
        c = hand[i]; tags = [];
        if (ev.scoring[i]) tags.push(["+" + (rankChips(c.r) + (c.mod === "gold" ? 40 : 0)), CHIP_BOX]);
        else if (c.mod === "gold") tags.push(["+40", CHIP_BOX]);
        if (c.mod === "glass") tags.push(["×2", null]);
        if (c.curse) tags.push(["+20", MULT_BOX]);
        if (!tags.length) continue;
        q = slotPose(i);
        ctx.save();
        ctx.translate(q.x, q.y); ctx.rotate(q.r);
        if (v.dim) ctx.globalAlpha *= 0.55;
        var x = -(tags.length - 1) * 30;
        for (var k = 0; k < tags.length; k++) {
          if (tags[k][1]) badge(x + k * 60, -L.slotH / 2, tags[k][0], tags[k][1]);
          else xBadge(x + k * 60, -L.slotH / 2, tags[k][0]);
        }
        ctx.restore();
      }
    }

    /* The Seer: the next deal, face up, peeking out of the shoe. */
    function drawNext() {
      if (!has("seer") || !upcoming || tally) return;
      var w = L.cardW * 0.34, h = L.cardH * 0.34;
      var x = L.cardCX + L.cardW / 2 - w * 0.2, y = L.cardCY - L.cardH / 2 + h * 0.3;
      var c = { r:upcoming.r, s:upcoming.s, mod:upcoming.mod, curse:upcoming.curse };
      drawCard(c, x, y, w, h, 0.12, 1, null);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = FAM_COL.Curse; ctx.font = font(20, 900);
      ctx.fillText(upper(Lang.t("Next")), x, y + h / 2 + 18);
    }

    function render() {
      var i;
      /* The table is the painted scene (CONFIG.sceneArt), a CSS layer under the
         canvas the frame pipeline has already wiped. The felt is the fallback
         for a build with no artwork on disk. */
      if (!Art.scene()) {
        ctx.fillStyle = L.felt || CONFIG.bg;
        ctx.fillRect(0, 0, view.w, view.h);
      }

      var pull = cur ? clamp(Math.abs(cur.x) / SWIPE_DIST, 0, 1) : 0;
      // the rail, the chevrons, the bins, the hand and the cards are the
      // elements of the round's entrance (Enter): each lands on its own place
      pv = tally ? null : preview();
      drawRail();
      if (!tally) {
        if (Enter.begin(Layout.left + 40, L.gateY)) {
          drawChevrons(Layout.left + 40, -1, BIN_COL, Lang.t("Bin"), cur && cur.x < 0 ? pull : 0);
          Enter.end();
        }
        if (Enter.begin(Layout.right - 40, L.gateY)) {
          drawChevrons(Layout.right - 40, 1, KEEP_COL, Lang.t("Keep"), cur && cur.x > 0 ? pull : 0);
          Enter.end();
        }
        if (Enter.begin(Layout.cx, L.binsY)) { drawBins(); Enter.end(); }
        if (anyFam() && Enter.begin(Layout.cx, L.gaugeY)) { drawGauge(); Enter.end(); }
        if (has("counter")) drawCounter();
        if (pocket || has("pocket")) drawPocket();
      }
      if (POT_ON && Enter.begin(L.potX, L.potY)) { drawPot(); Enter.end(); }
      drawHand();
      if (!tally) drawSeats();

      // the shoe: two backs peeking behind the live card, gone with the deck
      // and stepping aside while a hand is counted
      var left = cardsLeft();
      if (deckSprite && !tally && left > 0 && Enter.begin(L.cardCX + 13, L.cardCY + 18)) {
        if (left > 1) {
          ctx.save();
          ctx.globalAlpha = 0.45;
          ctx.translate(L.cardCX + 18, L.cardCY + 24); ctx.rotate(0.05);
          ctx.drawImage(deckSprite, -L.cardW / 2, -L.cardH / 2, L.cardW, L.cardH);
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.translate(L.cardCX + 9, L.cardCY + 12); ctx.rotate(0.024);
        ctx.drawImage(deckSprite, -L.cardW / 2, -L.cardH / 2, L.cardW, L.cardH);
        ctx.restore();
        Enter.end();
      }
      drawNext();

      for (i = 0; i < flying.length; i++) {
        var f = flying[i];
        drawCard(f.card, f.x, f.y, L.cardW * 0.82, L.cardH * 0.82, f.rot, clamp(f.a, 0, 1), null);
      }

      if (cur) {
        var t = cur["in"], e = 1 - (1 - t) * (1 - t) * (1 - t);
        var x = L.cardCX + cur.x;
        var y = (L.cardCY + 90) + (L.cardCY + cur.y - (L.cardCY + 90)) * e;
        var sc = 0.9 + 0.1 * e, tint = null, al = e;
        if (drag.on && drag.free && cur.y < 0) {
          // pushed up into the rail, the card shrinks so the jokers stay in
          // sight, and fades under the choices it opened
          sc *= clamp((y - L.railY) / (L.cardCY - L.railY), 0.42, 1);
          if (lift.open) al *= 0.45;
        }
        if (lift.on)         tint = rgba(FAM_COL.Fate, 0.28);   // pushed up: it is playing a joker
        else if (cur.x < -4) tint = rgba(BIN_COL,  0.05 + pull * 0.17);
        else if (cur.x > 4)  tint = rgba(KEEP_COL, 0.05 + pull * 0.17);
        if (Enter.begin(x, y)) {
          drawCard(cur.card, x, y, L.cardW * sc, L.cardH * sc, cur.rot, al, tint);
          Enter.end();
        }
      }

      if (!tally) { drawHint(); drawFate(); }
      drawTally();
    }

    /* ===================================================================
       THE END OF A RUN — the deck ran out, or the lives did.
       =================================================================== */

    function finish(title) {
      if (done) return;
      cursorNow = ""; canvas.style.cursor = "";       // the end screen is not the table
      hintT = -1; hudHint(false); liftOff();
      done = true; cur = null; tally = null;
      dropTips();
      dropPick();
      /* Playable thresholds, read off the bench on its own deal (32 cards,
         any pair, Mult and Rule jokers): ~1100 is a median run, ~2000 the
         top fifth. */
      var stars = score >= 2200 ? 3 : score >= 1100 ? 2 : score > 0 ? 1 : 0;
      endRound({
        title: stars === 3 ? Lang.t("Sharp eye!") : title,
        variant: stars === 3 ? "perfect" : "",
        score: score,
        stars: stars,
        rows: [
          { label:"Hands paid", value:hands },
          { label:"Best hand",  value:bestTotal ? handName(bestName) + " · " + bestTotal : "—", grade:"accent" },
          { label:"Jokers taken", value:jokersTaken, grade:"gold" }
        ]
      });
    }

    function onResize() { readTunables(); layout(); }

    /* --- THE LEVEL LAYER (web target) ------------------------------------
       The objective of every level is its own (GOALS, above): the climb
       changes the rules, and the score a level can reach changes with them.
       The three-star finish ends the round through the game's own result so
       the end screen keeps these stat rows. Ignored by the playable, which
       has no levels — see docs/LEVELS.md. */
    function levelGoal(n) { return GOALS[n] ? { goal:GOALS[n] } : null; }

    return { reset:reset, update:update, render:render,
             onDown:onDown, onMove:onMove, onUp:onUp,
             onResize:onResize, held:function () { return !!(tipOpen || pick); },
             levelWon:finish, levelGoal:levelGoal, wipe:wipe, codex:codex, helpAura:helpAura, guide:guide };
  })();
