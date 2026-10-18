  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Grudgeon",
    /* One sentence, three words in colour: the gesture, what it lands on and
       what waits inside. The stage under it taps a lit room of the map. */
    tagline: "<b class=\"w-tap\">Tap</b> a lit <b class=\"w-room\">room</b> to explore it and <b class=\"w-fight\">exorcise</b> the yokai inside",
    /* NO CLOCK. A dungeon is turn-based: the run ends when the party falls,
       when no room is left to open, or on the level's third star. */
    gameSeconds: 0,

    // Store links used by every CTA. Until this game has a real listing all
    // three point at the newrare site, where the game can actually be played.
    storeUrl: {
      ios:     "https://newrare.app/#playables",
      android: "https://newrare.app/#playables",
      fallback:"https://newrare.app/#playables"
    },

    designWidth: 720,
    designHeight: 1280,
    bg: "#07060c",

    /* The band's painted scene goes behind the ROUND: the map is drawn over
       it, under a veil dark enough for the rooms to read (drawGround). The
       intro, the end screen and the web menu wear the plain
       `backgroundPhone`; reset() moves the round and the end screen to the
       band's own `backgroundPhoneNN` with Art.backdrop. */
    sceneArt: true,

    layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 26 },

    // The stage is the tap variant, re-dressed from the SKIN as a dungeon
    // room lit at the edge of the dark.
    intro: { logo: null, demo: "tap", caption: "",
             // a room is entered where it is clicked: a mouse game on a desk
             desk: [{ mouse: ["click"] }] },

    keyboard: true,

    // The centre score is always there; the left slot is the gold, the
    // right one the yokai exorcised.
    hud: { score: true, timer: false },

    /* THE BED. One track, cut on its own seams (docs/MUSIC.md): a calm intro
       to 24 s, then ten-second phrases, each ending on a dip, and a fade from
       165 s. The menu gets the intro, slower and quieter; each band below
       gets a window of the body, climbing with the climb. */
    /* `seam`: every window loops on the bar, two beats of crossfade ending on
       its downbeat (docs/MUSIC.md, The seam); `cut`: the playable's window,
       one seam of pre-roll into its embedded cut. */
    music: {
      volume: 0.12, fade: 1.6, seam: 1.25,
      cut: { from: 1.25, length: 29.994 },
      menu: { from: 0, length: 22.535, rate: 0.85, gain: 0.5 }
    },

    // All user-facing copy in one place.
    copy: {
      start:      "Enter the dungeon",
      ctaBar:     "Install now",
      ctaEnd:     "Play the full game",
      replay:     "Descend again",
      scoreLabel: "Score",
      timeLabel:  "Time",
      endScore:   "Final score",
      gameOver:   "The grudge took you",
      timeUp:     "Time's up!",
      cleared:    "Dungeon cleared",
      escaped:    "You got out",
      lifted:     "Grudge lifted",
      goldLabel:  "Gold",
      foesLabel:  "Yokai"
    },

    /* THE FIVE BANDS OF THE CLIMB, six levels apiece — the biomes. Each holds
       the four yokai that haunt it, weakest first: a room deep in the map
       draws from the end of the list. `tint` is the glow under the map where
       the band's painted `scene` is missing, and `music` its window of the
       track. A playable is one round at level 0 and rides the first band. */
    bands: [
      { name: "Night school",    tint: "#1d2a52", scene: "backgroundPhone01", music: { from: 25,  length: 29.994 },
        foes: ["hanako", "teketeke", "jinmenken", "akamanto"] },
      { name: "Hospital",        tint: "#173d36", scene: "backgroundPhone02", music: { from: 55,  length: 40.006 },
        foes: ["kuchisake", "ubume", "gaki", "nopperabo"] },
      { name: "Shrine forest",   tint: "#3d1a1f", scene: "backgroundPhone03", music: { from: 94,  length: 30 },
        foes: ["kasaobake", "chochin", "jorogumo", "tengu"] },
      { name: "Drowned village", tint: "#132f45", scene: "backgroundPhone04", music: { from: 124, length: 25 },
        foes: ["kappa", "nureonna", "funayurei", "umibozu"] },
      { name: "Gate of Yomi",    tint: "#2e1745", scene: "backgroundPhone05", music: { from: 134, length: 25.006 },
        foes: ["rokurokubi", "gashadokuro", "oni", "onryo"] }
    ],

    /* --- game tunables ------------------------------------------------
       The level layer lerps the ones its manifest names (web.levels.tune)
       between level 1 and level 30, in place; section 6 re-reads them on
       every reset, so a playable reads the same numbers it always did. */
    play: {
      cols: 7,           // the dungeon grid, as old-pawko's level selector drew it...
      rows: 7,           // ...grown to 12 rows by the end of the climb
      loops: 0.15,       // chance of an extra corridor between two rooms (forks)
      fights: 10,        // rooms with a yokai — never fewer than the level's 2.2x objective
      shops: 2,
      upgrades: 2,
      events: 2,
      bonus: 3,
      foePower: 1.0,     // the yokai's strength, before the depth of their room
      foeHp: 3.0,        // a yokai's health on top of that: long enough to reach its special
      foeAtk: 1.3,       // its blows on top of that
      depth: 0.25,       // how much stronger the room furthest from the start is
      partyLevel: 1,     // the level the party enters at (a persistent roster comes later)
      goldRate: 1.0,
      candles: 3.0,      // the lantern's candles, per room of the map: every step burns one per hero
      lampBar: 184,      // the lantern's panel under the map: the candles, the heads, the keys, the split
      cornerClear: 70    // the map stops this far above Layout's foot: the web corners
    }
  };

  /* ===================================================================
     2. ASSETS — embedded base64 data URIs only (no network requests ever).
     The room pictograms come from assets/motor/lucide/ (embed-icon.mjs,
     96 px, stroke 2.4) and stand in for the painted items until they decode.
     Every sound effect is a role of the house kit, mapped in manifest.json
     `sfx`; the one embedded sound is the playable's bed.
     =================================================================== */
  var ASSETS = {
    images: {
      // icoFight: lucide sword
      icoFight: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0ibTExIDE5LTYtNiIgLz4gPHBhdGggZD0ibTUgMjEtMi0yIiAvPiA8cGF0aCBkPSJtOCAxNi00IDQiIC8+IDxwYXRoIGQ9Ik05LjUgMTcuNSAyMSA2VjNoLTNMNi41IDE0LjUiIC8+IDwvc3ZnPg==",
      // icoShop: lucide gem
      icoShop: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTEwLjUgMyA4IDlsNCAxMyA0LTEzLTIuNS02IiAvPiA8cGF0aCBkPSJNMTcgM2EyIDIgMCAwIDEgMS42LjhsMyA0YTIgMiAwIDAgMSAuMDEzIDIuMzgybC03Ljk5IDEwLjk4NmEyIDIgMCAwIDEtMy4yNDcgMGwtNy45OS0xMC45ODZBMiAyIDAgMCAxIDIuNCA3LjhsMi45OTgtMy45OTdBMiAyIDAgMCAxIDcgM3oiIC8+IDxwYXRoIGQ9Ik0yIDloMjAiIC8+IDwvc3ZnPg==",
      // icoUpgrade: lucide chevrons-up
      icoUpgrade: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0ibTE3IDExLTUtNS01IDUiIC8+IDxwYXRoIGQ9Im0xNyAxOC01LTUtNSA1IiAvPiA8L3N2Zz4=",
      // icoEvent: lucide eye
      icoEvent: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTIuMDYyIDEyLjM0OGExIDEgMCAwIDEgMC0uNjk2IDEwLjc1IDEwLjc1IDAgMCAxIDE5Ljg3NiAwIDEgMSAwIDAgMSAwIC42OTYgMTAuNzUgMTAuNzUgMCAwIDEtMTkuODc2IDAiIC8+IDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIC8+IDwvc3ZnPg==",
      // icoBonus: lucide sparkles
      icoBonus: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTExLjAxNyAyLjgxNGExIDEgMCAwIDEgMS45NjYgMGwxLjA1MSA1LjU1OGEyIDIgMCAwIDAgMS41OTQgMS41OTRsNS41NTggMS4wNTFhMSAxIDAgMCAxIDAgMS45NjZsLTUuNTU4IDEuMDUxYTIgMiAwIDAgMC0xLjU5NCAxLjU5NGwtMS4wNTEgNS41NThhMSAxIDAgMCAxLTEuOTY2IDBsLTEuMDUxLTUuNTU4YTIgMiAwIDAgMC0xLjU5NC0xLjU5NGwtNS41NTgtMS4wNTFhMSAxIDAgMCAxIDAtMS45NjZsNS41NTgtMS4wNTFhMiAyIDAgMCAwIDEuNTk0LTEuNTk0eiIgLz4gPHBhdGggZD0iTTIwIDJ2NCIgLz4gPHBhdGggZD0iTTIyIDRoLTQiIC8+IDxjaXJjbGUgY3g9IjQiIGN5PSIyMCIgcj0iMiIgLz4gPC9zdmc+",
      // icoStart: lucide flag
      icoStart: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTQgMjJWNGExIDEgMCAwIDEgLjQtLjhBNiA2IDAgMCAxIDggMmMzIDAgNSAyIDcuMzMzIDJxMiAwIDMuMDY3LS44QTEgMSAwIDAgMSAyMCA0djEwYTEgMSAwIDAgMS0uNC44QTYgNiAwIDAgMSAxNiAxNmMtMyAwLTUtMi04LTJhNiA2IDAgMCAwLTQgMS41MjgiIC8+IDwvc3ZnPg==",
      // icoSkull: lucide skull
      icoSkull: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0ibTEyLjUgMTctLjUtMS0uNSAxaDF6IiAvPiA8cGF0aCBkPSJNMTUgMjJhMSAxIDAgMCAwIDEtMXYtMWEyIDIgMCAwIDAgMS41Ni0zLjI1IDggOCAwIDEgMC0xMS4xMiAwQTIgMiAwIDAgMCA4IDIwdjFhMSAxIDAgMCAwIDEgMXoiIC8+IDxjaXJjbGUgY3g9IjE1IiBjeT0iMTIiIHI9IjEiIC8+IDxjaXJjbGUgY3g9IjkiIGN5PSIxMiIgcj0iMSIgLz4gPC9zdmc+",
      /* the fight's scrolls and the five elements' badges */
      // icoFist: lucide hand-fist
      icoFist: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTEyLjAzNSAxNy4wMTJhMyAzIDAgMCAwLTMtM2wtLjMxMS0uMDAyYS43Mi43MiAwIDAgMS0uNTA1LTEuMjI5bDEuMTk1LTEuMTk1QTIgMiAwIDAgMSAxMC44MjggMTFIMTJhMiAyIDAgMCAwIDAtNEg5LjI0M2EzIDMgMCAwIDAtMi4xMjIuODc5bC0yLjcwNyAyLjcwN0E0LjgzIDQuODMgMCAwIDAgMyAxNGE4IDggMCAwIDAgOCA4aDJhOCA4IDAgMCAwIDgtOFY3YTIgMiAwIDEgMC00IDB2MmEyIDIgMCAxIDAgNCAwIiAvPiA8cGF0aCBkPSJNMTMuODg4IDkuNjYyQTIgMiAwIDAgMCAxNyA4VjVBMiAyIDAgMSAwIDEzIDUiIC8+IDxwYXRoIGQ9Ik05IDVBMiAyIDAgMSAwIDUgNVYxMCIgLz4gPHBhdGggZD0iTTkgN1Y0QTIgMiAwIDEgMSAxMyA0VjcuMjY4IiAvPiA8L3N2Zz4=",
      // icoShield: lucide shield
      icoShield: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTIwIDEzYzAgNS0zLjUgNy41LTcuNjYgOC45NWExIDEgMCAwIDEtLjY3LS4wMUM3LjUgMjAuNSA0IDE4IDQgMTNWNmExIDEgMCAwIDEgMS0xYzIgMCA0LjUtMS4yIDYuMjQtMi43MmExLjE3IDEuMTcgMCAwIDEgMS41MiAwQzE0LjUxIDMuODEgMTcgNSAxOSA1YTEgMSAwIDAgMSAxIDF6IiAvPiA8L3N2Zz4=",
      // icoHeart: lucide heart
      icoHeart: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTIgOS41YTUuNSA1LjUgMCAwIDEgOS41OTEtMy42NzYuNTYuNTYgMCAwIDAgLjgxOCAwQTUuNDkgNS40OSAwIDAgMSAyMiA5LjVjMCAyLjI5LTEuNSA0LTMgNS41bC01LjQ5MiA1LjMxM2EyIDIgMCAwIDEtMyAuMDE5TDUgMTVjLTEuNS0xLjUtMy0zLjItMy01LjUiIC8+IDwvc3ZnPg==",
      // icoWard: lucide wand-sparkles
      icoWard: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0ibTIxLjY0IDMuNjQtMS4yOC0xLjI4YTEuMjEgMS4yMSAwIDAgMC0xLjcyIDBMMi4zNiAxOC42NGExLjIxIDEuMjEgMCAwIDAgMCAxLjcybDEuMjggMS4yOGExLjIgMS4yIDAgMCAwIDEuNzIgMEwyMS42NCA1LjM2YTEuMiAxLjIgMCAwIDAgMC0xLjcyIiAvPiA8cGF0aCBkPSJtMTQgNyAzIDMiIC8+IDxwYXRoIGQ9Ik01IDZ2NCIgLz4gPHBhdGggZD0iTTE5IDE0djQiIC8+IDxwYXRoIGQ9Ik0xMCAydjIiIC8+IDxwYXRoIGQ9Ik03IDhIMyIgLz4gPHBhdGggZD0iTTIxIDE2aC00IiAvPiA8cGF0aCBkPSJNMTEgM0g5IiAvPiA8L3N2Zz4=",
      // icoSnow: lucide snowflake
      icoSnow: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0ibTEwIDIwLTEuMjUtMi41TDYgMTgiIC8+IDxwYXRoIGQ9Ik0xMCA0IDguNzUgNi41IDYgNiIgLz4gPHBhdGggZD0ibTE0IDIwIDEuMjUtMi41TDE4IDE4IiAvPiA8cGF0aCBkPSJtMTQgNCAxLjI1IDIuNUwxOCA2IiAvPiA8cGF0aCBkPSJtMTcgMjEtMy02aC00IiAvPiA8cGF0aCBkPSJtMTcgMy0zIDYgMS41IDMiIC8+IDxwYXRoIGQ9Ik0yIDEyaDYuNUwxMCA5IiAvPiA8cGF0aCBkPSJtMjAgMTAtMS41IDIgMS41IDIiIC8+IDxwYXRoIGQ9Ik0yMiAxMmgtNi41TDE0IDE1IiAvPiA8cGF0aCBkPSJtNCAxMCAxLjUgMkw0IDE0IiAvPiA8cGF0aCBkPSJtNyAyMSAzLTYtMS41LTMiIC8+IDxwYXRoIGQ9Im03IDMgMyA2aDQiIC8+IDwvc3ZnPg==",
      // icoFlame: lucide flame
      icoFlame: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTEyIDNxMSA0IDQgNi41dDMgNS41YTEgMSAwIDAgMS0xNCAwIDUgNSAwIDAgMSAxLTMgMSAxIDAgMCAwIDUgMGMwLTItMS41LTMtMS41LTVxMC0yIDIuNS00IiAvPiA8L3N2Zz4=",
      // icoZap: lucide zap
      icoZap: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTE1LjkxNCA0YTEuNSAxLjUgMCAwMC0yLjQ3NC0xLjU2MWwtOSA5QTEuNSAxLjUgMCAwMDUuNSAxNGg0LjAwMmEuNS41IDAgMDEuNDcxLjY2Nkw4LjA4NiAyMGExLjUgMS41IDAgMDAyLjQ3NSAxLjU2bDktOUExLjUgMS41IDAgMDAxOC41IDEwaC0zLjk5N2EuNS41IDAgMDEtLjQ3Mi0uNjY3eiIgLz4gPC9zdmc+",
      // icoAim: lucide crosshair
      icoAim: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIC8+IDxsaW5lIHgxPSIyMiIgeDI9IjE4IiB5MT0iMTIiIHkyPSIxMiIgLz4gPGxpbmUgeDE9IjYiIHgyPSIyIiB5MT0iMTIiIHkyPSIxMiIgLz4gPGxpbmUgeDE9IjEyIiB4Mj0iMTIiIHkxPSI2IiB5Mj0iMiIgLz4gPGxpbmUgeDE9IjEyIiB4Mj0iMTIiIHkxPSIyMiIgeTI9IjE4IiAvPiA8L3N2Zz4=",
      // icoHand: lucide hand
      icoHand: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTE4IDExVjZhMiAyIDAgMCAwLTItMmEyIDIgMCAwIDAtMiAyIiAvPiA8cGF0aCBkPSJNMTQgMTBWNGEyIDIgMCAwIDAtMi0yYTIgMiAwIDAgMC0yIDJ2MiIgLz4gPHBhdGggZD0iTTEwIDEwLjVWNmEyIDIgMCAwIDAtMi0yYTIgMiAwIDAgMC0yIDJ2OCIgLz4gPHBhdGggZD0iTTE4IDhhMiAyIDAgMSAxIDQgMHY2YTggOCAwIDAgMS04IDhoLTJjLTIuOCAwLTQuNS0uODYtNS45OS0yLjM0bC0zLjYtMy42YTIgMiAwIDAgMSAyLjgzLTIuODJMNyAxNSIgLz4gPC9zdmc+",
      // icoSun: lucide sun
      icoSun: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgLz4gPHBhdGggZD0iTTEyIDJ2MiIgLz4gPHBhdGggZD0iTTEyIDIwdjIiIC8+IDxwYXRoIGQ9Im00LjkzIDQuOTMgMS40MSAxLjQxIiAvPiA8cGF0aCBkPSJtMTcuNjYgMTcuNjYgMS40MSAxLjQxIiAvPiA8cGF0aCBkPSJNMiAxMmgyIiAvPiA8cGF0aCBkPSJNMjAgMTJoMiIgLz4gPHBhdGggZD0ibTYuMzQgMTcuNjYtMS40MSAxLjQxIiAvPiA8cGF0aCBkPSJtMTkuMDcgNC45My0xLjQxIDEuNDEiIC8+IDwvc3ZnPg==",
      // icoGhost: lucide ghost
      icoGhost: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTkgMTBoLjAxIiAvPiA8cGF0aCBkPSJNMTUgMTBoLjAxIiAvPiA8cGF0aCBkPSJNMTIgMmE4IDggMCAwIDAtOCA4djEybDMtMyAyLjUgMi41TDEyIDE5bDIuNSAyLjVMMTcgMTlsMyAzVjEwYTggOCAwIDAgMC04LTh6IiAvPiA8L3N2Zz4=",
      // icoLock: lucide lock
      icoLock: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjExIiB4PSIzIiB5PSIxMSIgcng9IjIiIHJ5PSIyIiAvPiA8cGF0aCBkPSJNNyAxMVY3YTUgNSAwIDAgMSAxMCAwdjQiIC8+IDwvc3ZnPg=="
    },
    sounds: {
      // music: assets/audio/music/grudgeon.mp3, 23.75 s → 54.994 s (one seam of
      // pre-roll, then the first band's window: CONFIG.music.cut), mono 64 kbps — the web build ships the whole track instead
      music: "data:audio/mpeg;base64,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"
    }
  };

  /* ===================================================================
     6. GAME — the only section a new concept rewrites.
     Contract (see docs/ENGINE.md):
        reset()            required — build a fresh round
        update(dt)         required — advance the simulation (seconds)
        render()           required — draw the world in design coordinates
        onDown/onMove/onUp optional — pointer, in design coordinates
        onTimeUp()         optional — the round clock hit zero
        onResize()         optional — Layout changed
     Call endRound({...}) when the run is over.

     GRUDGEON is a dungeon crawler on old-pawko's exploration grid: a cols x
     rows map whose rooms are joined by a random corridor graph (a spanning
     tree, so every room is reachable, plus a few loops for forks). Only the
     rooms next to a visited one are lit; tapping one walks the party there
     and opens what it holds — a yokai (a turn-based fight in a modal), a
     shop, an altar of blessings, an event or a bonus — and then lights its
     own neighbours. The level's objective is the number of yokai exorcised.
     =================================================================== */
  var Game = (function () {
    var P = CONFIG.play;
    /* What a stage overrides in CONFIG.play, as the game ships it: a playable,
       the endless run and a free round go back to these. */
    var P0 = { cols: P.cols, rows: P.rows, fights: P.fights, shops: P.shops, upgrades: P.upgrades, events: P.events, bonus: P.bonus };
    var FACE = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';
    function font(size, weight) { return (weight || 800) + " " + Math.round(size) + "px " + FACE; }
    var PARTY_KEY = "party:grudgeon";

    /* --- the data --------------------------------------------------------- */

    /* Five elements, Persona's rule: a yokai hit on its weakness takes 1.6x
       and the hero acts ONE MORE time; a resisted element does half. */
    var ELEMENTS = {
      slash:  { name: "Slash",  color: "#e8e6f0", icon: "icoFight", ink: "#3b3142" },
      fire:   { name: "Fire",   color: "#ff7a3d", icon: "icoFlame", ink: "#b8400f" },
      ice:    { name: "Ice",    color: "#8fdcff", icon: "icoSnow",  ink: "#1f6f9e" },
      light:  { name: "Light",  color: "#fff2a8", icon: "icoSun",   ink: "#9a7406" },
      spirit: { name: "Spirit", color: "#b69cff", icon: "icoGhost", ink: "#5b35b0" }
    };

    /* The four heroes. `coat` / `hair` / `prop` only dress the drawn
       stand-in, which an adopted sprite sheet replaces (spriteArt). */
    var HEROES = {
      akane: { name: "Akane", face: [0.525, 0.14, 0.24], role: "Shrine maiden", color: "#ff5d73", coat: "#f2efe8", hair: "#141018", prop: "wand",
               hp: 72, sp: 40, atk: 9, def: 6, spd: 11, skills: ["purify", "blessing"] },
      kenji: { name: "Kenji", face: [0.535, 0.135, 0.24], role: "Kendo captain", color: "#5aa9ff", coat: "#1b2133", hair: "#0d0d12", prop: "sword",
               hp: 100, sp: 24, atk: 15, def: 9, spd: 8, skills: ["iai", "ward"] },
      yuki:  { name: "Yuki", face: [0.57, 0.12, 0.26], role: "Onmyoji", color: "#9ce7ff", coat: "#2a2340", hair: "#eef3ff", prop: "talisman",
               hp: 60, sp: 60, atk: 7, def: 4, spd: 10, skills: ["frost", "foxfire"] },
      haru:  { name: "Haru", face: [0.59, 0.13, 0.24], role: "Occult photographer", color: "#ffd166", coat: "#3a3f4a", hair: "#4a3020", prop: "camera",
               hp: 76, sp: 36, atk: 10, def: 5, spd: 14, skills: ["flash", "ghostshot"] }
    };
    var HERO_IDS = ["akane", "kenji", "yuki", "haru"];

    /* `w` is the WEIGHT of an action on the fight's timeline: the hero's
       next turn comes w times their wait later. Guard hands the turn back
       early, Iai pays for its power in time, Flash is quick and `push`es the
       yokai back by that share of its own wait.

       Each is a SCROLL with TWO FACES: what it does thrown at the yokai
       (`foe`) and what it does laid on an ally (`ally`) — the hero whose
       turn it is included, unless `noSelf`. A blow on the yokai becomes, on
       an ally, a gift for THEIR next blow: its element (`imbue`), its edge
       (`whet`), a body in front of them (`cover`) or a step up the timeline
       (`hasten`); a support on the yokai turns against it: `provoke` draws
       its next blow on one hero onto the caster, `pacify` halves that blow,
       `bind` pushes it back. `foeText` / `allyText` say so on the scroll. */
    var SKILLS = {
      attack:    { name: "Attack",         kind: "hit", fx: "spells13",  el: "slash",  pow: 1.0, sp: 0,  w: 1, icon: "icoFist",
                   foe: "hit", ally: "cover", noSelf: true,
                   foeText: "A plain blow with the hero's weapon",
                   allyText: "Covers them: the hero takes the next blow aimed at them" },
      guard:     { name: "Guard",          kind: "guard", fx: "spells04", sp: 0, w: 0.6, icon: "icoShield",
                   foe: "provoke", ally: "guard",
                   foeText: "Provokes it: its next blow on one hero comes at this hero, on guard",
                   allyText: "Guards them until their turn: blows on them are halved (+5 SP on oneself)" },
      purify:    { name: "Purify",         kind: "hit", fx: "spells01",  el: "light",  pow: 1.7, sp: 8,  w: 1, icon: "icoBonus",
                   foe: "hit", ally: "imbue",
                   foeText: "A strong blow of light", allyText: "Their next blow becomes light" },
      blessing:  { name: "Blessing",       kind: "heal", fx: "spells02", pow: 0.32,    sp: 12, w: 1.2, icon: "icoHeart",
                   foe: "pacify", ally: "heal",
                   foeText: "Pacifies it: its next blow is halved",
                   allyText: "Heals the whole party by a third of their health" },
      iai:       { name: "Iai slash",      kind: "hit", fx: "spells03",  el: "slash",  pow: 2.3, sp: 8,  w: 1.5, icon: "icoFight",
                   foe: "hit", ally: "whet",
                   foeText: "A very strong cut, slow to recover from",
                   allyText: "Whets their blade: their next blow hits 50% harder" },
      ward:      { name: "Spirit ward",    kind: "ward", fx: "spells04", turns: 2,     sp: 6,  w: 0.8, icon: "icoWard",
                   foe: "bind", ally: "ward",
                   foeText: "Binds it: it is pushed back on the timeline",
                   allyText: "The party takes 40% less from the yokai's next two turns" },
      frost:     { name: "Frost talisman", kind: "hit", fx: "spells05",  el: "ice",    pow: 2.0, sp: 9,  w: 1, icon: "icoSnow",
                   foe: "hit", ally: "imbue",
                   foeText: "A strong blow of ice", allyText: "Their next blow becomes ice" },
      foxfire:   { name: "Foxfire",        kind: "hit", fx: "spells06",  el: "fire",   pow: 2.0, sp: 9,  w: 1, icon: "icoFlame",
                   foe: "hit", ally: "imbue",
                   foeText: "A strong blow of fire", allyText: "Their next blow becomes fire" },
      flash:     { name: "Flash",          kind: "hit", fx: "spells07",  el: "light",  pow: 1.1, sp: 10, w: 0.7, push: 0.6, icon: "icoZap",
                   foe: "hit", ally: "hasten", noSelf: true,
                   foeText: "A quick blow of light that pushes the yokai back on the timeline",
                   allyText: "Hastens them: they move up the timeline" },
      ghostshot: { name: "Ghost shot",     kind: "hit", fx: "spells08",  el: "spirit", pow: 1.6, sp: 8,  w: 1, pierce: true, icon: "icoAim",
                   foe: "hit", ally: "imbue",
                   foeText: "A blow of spirit that goes through the yokai's defense",
                   allyText: "Their next blow becomes spirit" }
    };
    var HASTEN = 0.6, BIND = 0.8, WHET = 1.5, PACIFY = 0.5;

    /* The twenty yokai, four per band. `move` is what their special does
       every third turn: heavy (one hero, 1.8x), all (every hero, 0.75x),
       drain (one hero, heals half of it) or fear (one hero is pushed back on
       the timeline). The first band's four bend that pattern by a rule of
       their own (RULES, in THE FIGHT). */
    var FOES = {
      hanako:      { name: "Hanako-san", face: [0.24, 0.22, 0.25],   color: "#d94a5a", hair: true,  hp: 60,  atk: 9,  def: 4,  spd: 9,  weak: ["light"],  resist: ["ice"],    move: "fear",  special: "Third stall" },
      teketeke:    { name: "Teke Teke", face: [0.19, 0.29, 0.25],    color: "#c9c2b8", hair: true,  hp: 52,  atk: 11, def: 3,  spd: 16, weak: ["ice"],    resist: ["slash"],  move: "heavy", special: "Teke teke" },
      jinmenken:   { name: "Jinmenken", face: [0.14, 0.3, 0.3],    color: "#9a7b5a", hp: 66,  atk: 10, def: 5,  spd: 12, weak: ["fire"],   resist: [],         move: "drain", special: "Leave me be" },
      akamanto:    { name: "Aka Manto", face: [0.37, 0.13, 0.22],    color: "#b3122e", hp: 80,  atk: 12, def: 6,  spd: 10, weak: ["spirit"], resist: ["fire"],   move: "all",   special: "Red or blue?" },
      kuchisake:   { name: "Kuchisake-onna", face: [0.38, 0.21, 0.2], color: "#d8d2cf", hair: true, hp: 88, atk: 13, def: 6, spd: 13, weak: ["light"], resist: ["slash"], move: "heavy", special: "Am I pretty?" },
      ubume:       { name: "Ubume", face: [0.25, 0.18, 0.2],        color: "#8fa8a0", hair: true,  hp: 92,  atk: 11, def: 7,  spd: 8,  weak: ["fire"],   resist: ["ice"],    move: "drain", special: "Hold my baby" },
      gaki:        { name: "Gaki", face: [0.24, 0.23, 0.3],         color: "#a3b06a", hp: 100, atk: 12, def: 5,  spd: 9,  weak: ["light"],  resist: ["spirit"], move: "drain", special: "Endless hunger" },
      nopperabo:   { name: "Nopperabo", face: [0.29, 0.16, 0.22],    color: "#e8e1d8", hp: 96,  atk: 13, def: 8,  spd: 11, weak: ["spirit"], resist: ["light"],  move: "fear",  special: "Faceless" },
      kasaobake:   { name: "Kasa-obake", face: [0.27, 0.33, 0.4],   color: "#c0563c", hp: 110, atk: 14, def: 7,  spd: 13, weak: ["fire"],   resist: ["ice"],    move: "all",   special: "Hundred-year rain" },
      chochin:     { name: "Chochin-obake", face: [0.3, 0.38, 0.45], color: "#f0a23c", hp: 104, atk: 15, def: 6, spd: 12, weak: ["ice"],    resist: ["fire"],   move: "all",   special: "Ghost flame" },
      jorogumo:    { name: "Jorogumo", face: [0.38, 0.24, 0.2],     color: "#7a2b6b", hair: true,  hp: 124, atk: 15, def: 9,  spd: 12, weak: ["fire"],   resist: ["slash"],  move: "drain", special: "Silk cocoon" },
      tengu:       { name: "Tengu", face: [0.46, 0.195, 0.25],        color: "#c8323a", horns: true, hp: 130, atk: 17, def: 9,  spd: 15, weak: ["ice"],    resist: ["spirit"], move: "heavy", special: "Gale fan" },
      kappa:       { name: "Kappa", face: [0.31, 0.33, 0.32],        color: "#4f9a5a", hp: 136, atk: 16, def: 11, spd: 11, weak: ["spirit"], resist: ["ice"],    move: "heavy", special: "Drag under" },
      nureonna:    { name: "Nure-onna", face: [0.33, 0.17, 0.2],    color: "#3d6f7a", hair: true,  hp: 148, atk: 17, def: 10, spd: 12, weak: ["light"],  resist: ["ice"],    move: "drain", special: "Coil" },
      funayurei:   { name: "Funayurei", face: [0.5, 0.19, 0.3],    color: "#7fa3b8", hp: 140, atk: 16, def: 9,  spd: 13, weak: ["fire"],   resist: ["slash"],  move: "all",   special: "Lend us a ladle" },
      umibozu:     { name: "Umibozu", face: [0.37, 0.21, 0.3],      color: "#22303f", hp: 176, atk: 19, def: 13, spd: 7,  weak: ["light"],  resist: ["slash"],  move: "all",   special: "Black tide" },
      rokurokubi:  { name: "Rokurokubi", face: [0.17, 0.19, 0.22],   color: "#c99bb0", hair: true,  hp: 168, atk: 19, def: 11, spd: 13, weak: ["slash"],  resist: ["spirit"], move: "fear",  special: "Long neck" },
      gashadokuro: { name: "Gashadokuro", face: [0.2, 0.21, 0.25],  color: "#e6dcc4", hp: 165, atk: 21, def: 15, spd: 6,  weak: ["light"],  resist: ["slash", "ice"], move: "heavy", special: "Bone crush" },
      oni:         { name: "Oni", face: [0.44, 0.22, 0.25],          color: "#c4302b", horns: true, hp: 190, atk: 23, def: 13, spd: 10, weak: ["spirit"], resist: ["fire"],   move: "all",   special: "Thunder drum" },
      onryo:       { name: "Onryo", face: [0.4, 0.23, 0.22],        color: "#e9e6f2", hair: true,  hp: 220, atk: 22, def: 12, spd: 14, weak: ["light"],  resist: ["spirit", "ice"], move: "fear", special: "Grudge" }
    };

    /* The room types and the colour their pictogram is lit in. */
    /* The room types: the painted item that says what is inside (a fight
       shows its own yokai instead), and the pictogram and colour drawn while
       the art has not decoded or does not exist. */
    var ROOM = {
      start:   { art: "items14", icon: "icoStart",   color: "#9aa0b5" },
      fight:   { art: null,      icon: "icoFight",   color: "#e2364b" },
      shop:    { art: "items06", icon: "icoShop",    color: "#e9c46a" },
      upgrade: { art: "items08", icon: "icoUpgrade", color: "#7ee0a1" },
      event:   { art: "items07", icon: "icoEvent",   color: "#b69cff" },
      bonus:   { art: "items05", icon: "icoBonus",   color: "#ffd166" },
      key:     { art: "items15", icon: "icoLock",    color: "#c79bff" },     // a seal-breaker: opens one sealed door
      empty:   { art: null,      icon: null,         color: "#6c6880" },
      exit:    { art: null,      icon: null,         color: "#ffd166" }      // drawn: a lit torii (drawExit)
    };
    var HIDDEN = 0, LIT = 1, HERE = 2, DONE = 3;

    /* What each yokai move looks like on the hero it lands on (the spell
       sheet), and the aura a special is cast in. */
    var MOVE_FX = { strike: "spells13", heavy: "spells14", all: "spells12", drain: "spells11", fear: "spells10" };

    /* --- the round's state ------------------------------------------------ */
    var cols, rows, cells, edges, cur, geo, party, gold, score, foesDown, rooms;
    var plv, xp, combat, card, bar, walk, jobs, started, ended, best, t, levelD = null, fightsTotal;
    /* the level being played (stageOf), and what its objective counts */
    var stage = null, metFresh = false, fell = false, goldEarned = 0, escaped = false, bossDown = false;
    /* THE WAY THROUGH (see the section of that name): what this stage's band
       brings to the map, the lantern, the doors and their keys, the yokai
       that wander, the groups the party walks in, and the path a first tap
       on a far room proposes. */
    var feats = {}, candles = 0, candles0 = 0, dark = false, keys = 0, doors = {}, roamers = [];
    var groups = [], gi = 0, roster = [], aim = null, tree = {};
    var fxs = [];                        // spell pictures playing over the fight
    /* THE BLAST between the map and a fight: 0 is the map in place, 1 is
       every room blown off the frame from the party's room outwards, which
       leaves the band's scene bare for the fight to stand on. `blowTo` is
       where it is heading; it travels there in BLOW seconds. */
    var blow = 0, blowTo = 0;
    var BLOW = 0.6;

    /* --- small helpers ---------------------------------------------------- */
    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; }
      return a;
    }
    function later(dt, fn) { jobs.push({ t: dt, fn: fn }); }
    function roundRect(g, x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
      g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
      g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
      g.closePath();
    }
    function bandIndex() {
      return CONFIG.level ? clamp(Math.floor((CONFIG.level - 1) / 6), 0, CONFIG.bands.length - 1) : 0;
    }
    function band() { return CONFIG.bands[bandIndex()]; }
    function camel(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function artImg(key) {
      var im = key && ArtImages[key];
      return im && im.complete && im.naturalWidth ? im : null;
    }
    /* A picture fitted into a size x size box around (x, y). */
    function drawFit(g, im, x, y, size, alpha) {
      var k = size / Math.max(im.naturalWidth, im.naturalHeight);
      var was = g.globalAlpha;
      g.globalAlpha = was * (alpha == null ? 1 : alpha);
      g.drawImage(im, x - im.naturalWidth * k / 2, y - im.naturalHeight * k / 2, im.naturalWidth * k, im.naturalHeight * k);
      g.globalAlpha = was;
    }
    /* ======================================================================
       THE THIRTY STAGES — five bands of six, and the same six steps in each:
         1  the band's first yokai, a small map
         2  the same yokai, a bigger map, gold to earn
         3  the band's second yokai
         4  more fights, and a way out to find
         5  the band's third yokai
         6  the band's fourth, as the MASTER of the place, in its far room
       so every band brings its four yokai in one at a time and ends on the
       last of them. The first two stages of a band from the second on keep
       two yokai of the band before, so a map is never one yokai deep. The
       grid, the fights and the other rooms grow with the band.

       Four objectives: exorcise n yokai and earn n gold (stars at 1x, 1.5x
       and 2.2x — the level layer's bands), find the way out and exorcise the
       master (a star for it, one for exorcising m yokai on the way, one if no
       hero fell — levelTally).
       ====================================================================== */
    var STEPS = [
      { dc: 0, dr: 0, f: 3, obj: "exorcise", fresh: 0 },
      { dc: 0, dr: 1, f: 4, obj: "gold" },
      { dc: 1, dr: 1, f: 4, obj: "exorcise", fresh: 1 },
      { dc: 1, dr: 2, f: 6, obj: "exit" },
      { dc: 1, dr: 2, f: 6, obj: "exorcise", fresh: 2 },
      { dc: 2, dr: 3, f: 6, obj: "boss", fresh: 3 }
    ];
    function stageOf(n) {
      var b = clamp(Math.floor((n - 1) / 6), 0, CONFIG.bands.length - 1), k = (n - 1) % 6, T = STEPS[k];
      var foes = CONFIG.bands[b].foes, prev = b ? CONFIG.bands[b - 1].foes : [];
      var cols = Math.min(7, 4 + Math.floor(b / 2) + T.dc), rows = Math.min(12, 4 + Math.round(b * 1.5) + T.dr);
      var fights = T.f + Math.min(b, 3), met = k >= 4 ? 3 : k >= 2 ? 2 : 1;
      var pool = (b && k < 4 ? prev.slice(k < 2 ? 0 : 1, 2) : []).concat(foes.slice(0, met));
      var S = { n: n, band: b, step: k, cols: cols, rows: rows, fights: fights, pool: pool,
                fresh: T.fresh != null ? foes[T.fresh] : null, boss: T.obj === "boss" ? foes[3] : null,
                shops: k >= 1 ? 1 + (b >= 2 ? 1 : 0) : 0, upgrades: k >= 2 ? 1 + (b >= 3 ? 1 : 0) : 0,
                events: k >= 1 ? 1 + (b >= 1 ? 1 : 0) : 1, bonus: 1 + Math.floor(cols * rows / 20),
                obj: T.obj, goal: 1, m: 0 };
      if (T.obj === "exorcise") S.goal = Math.max(1, Math.floor(fights / 2.2));
      else if (T.obj === "gold") {
        var expected = fights * (10 + 4 * b) + S.bonus * 10 * (1 + 0.15 * b);
        S.goal = Math.max(10, Math.round(expected / 3 / 5) * 5);
      } else S.m = Math.ceil((fights - (S.boss ? 1 : 0)) / 2);
      return S;
    }
    /* The objective as the level card writes it, in the player's language. */
    function goalLine(S) {
      if (S.obj === "gold") return Lang.t("Earn <b>{n}</b> gold");
      if (S.obj === "exit") return Lang.t("Find the <b>way out</b>");
      if (S.obj === "boss") return Lang.t("Exorcise the master:") + " <b>" + Lang.t(FOES[S.boss].name) + "</b>";
      return Lang.t("Exorcise <b>{n}</b> yokai");
    }

    /* ======================================================================
       THE MAP — old-pawko's LevelGrid, ported: a randomized DFS spanning tree
       from the start room, then a few extra corridors capped at four per room.
       ====================================================================== */
    function idx(r, c) { return r * cols + c; }
    function around(i) {
      var r = Math.floor(i / cols), c = i % cols, out = [];
      if (r > 0) out.push(i - cols);
      if (r < rows - 1) out.push(i + cols);
      if (c > 0) out.push(i - 1);
      if (c < cols - 1) out.push(i + 1);
      return out;
    }
    function ek(a, b) { return a < b ? a + "-" + b : b + "-" + a; }
    function linked(i) {
      var n = around(i), out = [];
      for (var k = 0; k < n.length; k++) if (edges[ek(i, n[k])]) out.push(n[k]);
      return out;
    }

    function generate() {
      cols = P.cols; rows = P.rows;
      var n = cols * rows, i, k, deg = [], seen = [], list = [];
      cells = []; edges = {}; tree = {}; doors = {}; roamers = [];
      for (i = 0; i < n; i++) {
        cells.push({ i: i, r: Math.floor(i / cols), c: i % cols, type: "empty", state: HIDDEN, pop: 0, foe: null });
        deg.push(0); seen.push(false);
      }
      var start = idx(rows - 1, cols >> 1);
      function link(a, b) { edges[ek(a, b)] = [Math.min(a, b), Math.max(a, b)]; deg[a]++; deg[b]++; }

      /* Phase 1: the spanning tree — every room reachable from the start. */
      var stack = [start]; seen[start] = true;
      while (stack.length) {
        var at = stack[stack.length - 1], nb = shuffle(around(at)), pushed = false;
        for (k = 0; k < nb.length; k++) {
          if (!seen[nb[k]]) { seen[nb[k]] = true; link(at, nb[k]); tree[ek(at, nb[k])] = at; stack.push(nb[k]); pushed = true; break; }
        }
        if (!pushed) stack.pop();
      }
      /* Phase 2: loops, so the map forks instead of being one long corridor. */
      for (i = 0; i < n; i++) {
        var ns = around(i);
        for (k = 0; k < ns.length; k++) {
          var j = ns[k];
          if (j < i || edges[ek(i, j)] || deg[i] >= 4 || deg[j] >= 4) continue;
          if (Math.random() < P.loops) link(i, j);
        }
      }

      /* How far each room is from the start, walking the corridors: the
         depth a yokai's strength and its place in the list come from, and
         where the way out or the master waits — the farthest room. */
      var dist = [], q = [start], far = 0;
      for (i = 0; i < n; i++) dist.push(-1);
      dist[start] = 0;
      while (q.length) {
        var u = q.shift(), lk = linked(u);
        for (k = 0; k < lk.length; k++) if (dist[lk[k]] < 0) { dist[lk[k]] = dist[u] + 1; far = Math.max(far, dist[u] + 1); q.push(lk[k]); }
      }
      var S = stage, end = -1;
      if (S && (S.obj === "exit" || S.boss)) {
        for (i = 0; i < n; i++) if (i !== start && (end < 0 || dist[i] > dist[end])) end = i;
      }

      /* The rooms: a fixed count of each kind, the rest quiet corridors. */
      fightsTotal = S ? S.fights - (S.boss ? 1 : 0) : P.fights;
      var pool = [];
      function add(type, count) { for (var c = 0; c < count; c++) pool.push(type); }
      add("fight", fightsTotal); add("shop", P.shops); add("upgrade", P.upgrades);
      add("event", P.events); add("bonus", P.bonus);
      for (i = 0; i < n; i++) if (i !== start && i !== end) list.push(i);
      shuffle(list);
      pool = pool.slice(0, list.length);
      fightsTotal = 0;
      for (k = 0; k < pool.length; k++) {
        cells[list[k]].type = pool[k];
        if (pool[k] === "fight") fightsTotal++;
      }
      if (end >= 0 && S.obj === "exit") cells[end].type = "exit";
      if (end >= 0 && S.boss) { cells[end].type = "fight"; cells[end].boss = true; cells[end].foe = S.boss; cells[end].depth = 1; fightsTotal++; }

      /* Who haunts each fight: the deeper the room, the later in the list —
         the level's pool, weakest first — and the stronger (P.depth). The
         yokai the level brings in is met early: the nearest fight is its. */
      var foes = S ? S.pool : band().foes, near = -1;
      for (i = 0; i < n; i++) {
        var cl = cells[i];
        if (cl.type !== "fight" || cl.boss) continue;
        var d = far ? dist[i] / far : 0;
        var fi = clamp(Math.floor(d * foes.length + Rand.range(-0.7, 0.5)), 0, foes.length - 1);
        cl.foe = foes[fi]; cl.depth = d;
        if (near < 0 || dist[i] < dist[near]) near = i;
      }
      if (S && S.fresh && !S.boss && near >= 0) cells[near].foe = S.fresh;

      if (feats.doors) placeDoors(start, end, dist);
      if (feats.roam) placeRoamers(start, dist);

      cells[start].type = "start";
      cells[start].state = HERE;
      cur = start;
      reveal(start);
    }

    function reveal(i) {
      var ns = linked(i), out = [];
      for (var k = 0; k < ns.length; k++) {
        var c = cells[ns[k]];
        if (c.state === HIDDEN) { c.state = LIT; c.pop = 0.4; out.push(c); }
      }
      if (out.length) Sound.clip("reveal", 0.5, 0.9 + Math.random() * 0.2);
      return out;
    }

    /* --- geometry: the map is fitted to Layout, clear of the web corners -- */
    function computeGeo() {
      var availH = Layout.h - P.cornerClear - P.lampBar;
      var pitch = Math.min(Layout.w / cols, availH / rows, 150);    // a first stage's 4 x 4 stays a map, not four tiles
      geo = {
        pitch: pitch, size: pitch * 0.7,
        ox: Layout.cx - pitch * cols / 2 + pitch / 2,
        oy: Layout.top + (availH - pitch * rows) / 2 + pitch / 2
      };
    }
    function cellX(c) { return geo.ox + c.c * geo.pitch; }
    function cellY(c) { return geo.oy + c.r * geo.pitch; }

    /* ======================================================================
       THE PARTY
       ====================================================================== */
    function savedParty() {
      var s = Store.get(PARTY_KEY, null), out = [], i;
      if (s && s.length) for (i = 0; i < s.length; i++) if (HEROES[s[i]] && out.indexOf(s[i]) < 0) out.push(s[i]);
      return out.length ? out.slice(0, 4) : HERO_IDS.slice();
    }
    function makeHero(id) {
      var b = HEROES[id], k = 1 + 0.07 * (plv - 1);
      return { id: id, b: b, hero: true,
               mhp: Math.round(b.hp * k), hp: Math.round(b.hp * k), msp: b.sp, sp: b.sp,
               atk: b.atk * k, def: b.def * k, spd: b.spd, pow: 1,
               guard: false, skip: false, dead: false, lunge: 0, hurt: 0, cast: 0 };
    }
    function alive() {
      var out = [];
      for (var i = 0; i < party.length; i++) if (!party[i].dead && !party[i].away) out.push(party[i]);
      return out;
    }
    function levelUp() {
      plv++;
      for (var i = 0; i < roster.length; i++) {
        var h = roster[i], gain = Math.round(h.mhp * 0.07);
        h.mhp += gain; if (!h.dead) h.hp += gain;
        h.atk *= 1.07; h.def *= 1.07;
      }
      Notify.say(Lang.t("Party level") + " " + plv, { kind: "good", icon: "sparkles" });
      Sound.clip("levelup", 0.6);
    }
    function healAll(pct, revive) {
      for (var i = 0; i < party.length; i++) {
        var h = party[i];
        if (h.dead && !revive) continue;
        if (h.dead) { h.dead = false; h.hp = 0; }
        h.hp = Math.min(h.mhp, h.hp + Math.round(h.mhp * pct));
      }
    }
    function spAll(pct) {
      for (var i = 0; i < party.length; i++) if (!party[i].dead) party[i].sp = clamp(party[i].sp + Math.round(party[i].msp * pct), 0, party[i].msp);
    }
    function hurtAll(pct) {
      for (var i = 0; i < party.length; i++) {
        var h = party[i];
        if (h.dead) continue;
        h.hp = Math.max(1, h.hp - Math.round(h.mhp * pct));     // an event wounds, it never kills
      }
    }

    /* ======================================================================
       THE CARDS — the motor's CARD (.mt-card) on a veil over the round, for
       the party, a shop, an altar and an event. The one layer of the round
       that takes a pointer, so the canvas never sees its taps.
       ====================================================================== */
    function openCard(o) {
      closeCard(true);
      var frame = document.getElementById("frame");
      if (!frame) return null;
      var lay = document.createElement("div"); lay.id = "gd-card";
      var mc = document.createElement("div"); mc.className = "mt-card gd-mc" + (o.cls ? " " + o.cls : "");
      mc.innerHTML = (o.eyebrow ? '<p class="mt-eyebrow"></p>' : "") + '<h2 class="mt-h"></h2><div class="mt-body"></div><p class="mt-tap"></p>';
      if (o.eyebrow) mc.querySelector(".mt-eyebrow").textContent = upper(Lang.t(o.eyebrow));
      mc.querySelector(".mt-h").textContent = upper(Lang.t(o.title));
      mc.querySelector(".mt-tap").textContent = upper(Lang.t(o.tap));
      var body = mc.querySelector(".mt-body");
      if (o.text) { var p = document.createElement("p"); p.className = "gd-text"; p.textContent = Lang.t(o.text); body.appendChild(p); }
      if (o.build) o.build(body);
      lay.appendChild(mc);
      lay.addEventListener("click", function () { if (o.onVeil) o.onVeil(); });
      mc.addEventListener("click", function (e) { if (!o.onVeil) e.stopPropagation(); });
      frame.appendChild(lay);
      card = { node: lay };
      if (typeof Fit !== "undefined" && Fit.box) Fit.box(mc.querySelector(".mt-h"), 32);
      requestAnimationFrame(function () { lay.classList.add("on"); });
      return mc;
    }
    function closeCard(now) {
      if (!card) return;
      var n = card.node;
      card = null;
      if (now) { if (n.parentNode) n.parentNode.removeChild(n); return; }
      n.classList.add("off");
      setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 260);
    }
    function button(label, sub, cls, fn, art) {
      var b = document.createElement("button"), src = art && CONFIG.art && CONFIG.art[art];
      b.type = "button"; b.className = "btn btn-sm" + (cls ? " " + cls : "");
      b.innerHTML = (src ? '<img class="gd-ico" alt="">' : "") + '<span class="btn-txt"><b></b>' + (sub != null ? "<i></i>" : "") + "</span>";
      if (src) b.querySelector("img").src = src;
      b.querySelector("b").textContent = upper(Lang.t(label));
      if (sub != null) b.querySelector("i").textContent = sub;
      b.addEventListener("click", function (e) { e.stopPropagation(); fn(b); });
      return b;
    }

    /* --- the party: one to four heroes, before the first step ------------- */
    /* THE PARTY CARD says what a hero COSTS before the first step: every
       tile carries the candle it burns per step, and the lantern under the
       four reads the candles of the stage, what the party picked burns per
       step and how many steps that lights — re-read on every tap. */
    function candleTag(cls) {
      var t = document.createElement("span"), src = CONFIG.art && CONFIG.art.items09;
      t.className = cls;
      if (src) { var im = document.createElement("img"); im.alt = ""; im.src = src; t.appendChild(im); }
      return t;
    }
    function openParty() {
      var pick = savedParty();
      var go, lamp;
      function readLamp() {
        lamp.querySelector(".gd-lamp-n").textContent = candles;
        lamp.querySelector(".gd-lamp-why").textContent = partyBurns(pick.length) + ". " + Lang.t("When they run out, the yokai grow stronger");
      }
      openCard({
        eyebrow: band().name, title: "Your party", tap: "Tap a hero to call or dismiss them",
        build: function (body) {
          var grid = document.createElement("div"); grid.className = "gd-party";
          HERO_IDS.forEach(function (id) {
            var b = HEROES[id], tile = document.createElement("button");
            tile.type = "button"; tile.className = "gd-hero" + (pick.indexOf(id) >= 0 ? " on" : "");
            tile.style.setProperty("--hc", b.color);
            var cv = document.createElement("canvas"); cv.width = cv.height = 150;
            drawHero(cv.getContext("2d"), { b: b, id: id, dead: false, lunge: 0, hurt: 0, cast: 0 }, 75, 80, 140, 1, 1);
            var nm = document.createElement("b"); nm.textContent = upper(b.name);
            var rl = document.createElement("i"); rl.textContent = upper(Lang.t(b.role));
            var burn = candleTag("gd-burn");
            tile.appendChild(cv); tile.appendChild(nm); tile.appendChild(rl); tile.appendChild(burn);
            tile.addEventListener("click", function (e) {
              e.stopPropagation();
              var at = pick.indexOf(id);
              if (at >= 0) {
                if (pick.length === 1) { Notify.say("A party needs one hero", { kind: "warn", key: "party" }); Sound.ui("deny"); return; }
                pick.splice(at, 1);
              } else pick.push(id);
              tile.classList.toggle("on", pick.indexOf(id) >= 0);
              readLamp();
              Sound.ui("tap");
            });
            grid.appendChild(tile);
          });
          body.appendChild(grid);
          lamp = document.createElement("div"); lamp.className = "gd-lamp";
          /* the candles, then what this party burns per move — the sentence
             that changes when a hero is called or dismissed */
          var row = document.createElement("div"); row.className = "gd-lamp-row";
          row.appendChild(candleTag("gd-lamp-ico"));
          var col = document.createElement("p"), v = document.createElement("b"), l = document.createElement("i");
          col.className = "gd-lamp-col"; v.className = "gd-lamp-n"; l.textContent = upper(Lang.t("Candles"));
          col.appendChild(v); col.appendChild(l); row.appendChild(col);
          var why = document.createElement("p"); why.className = "gd-lamp-why";
          lamp.appendChild(row); lamp.appendChild(why);
          body.appendChild(lamp);
          readLamp();
          go = button("Descend", null, "btn-lg btn-shiny", function () {
            pick.sort(function (a, b) { return HERO_IDS.indexOf(a) - HERO_IDS.indexOf(b); });
            Store.set(PARTY_KEY, pick);
            party = roster = pick.map(makeHero);
            groups = [{ heroes: party, at: cur }]; gi = 0;
            for (var r = 0; r < roamers.length; r++) planRoam(roamers[r]);
            closeCard();
            Sound.clip("step", 0.6);
            teach();
            showBubble(groups[0]);
          });
          body.appendChild(go);
        }
      });
    }

    /* --- a shop: three offers, bought as long as the gold lasts ----------- */
    var WARES = [
      { id: "herbs",  art: "items01", name: "Healing herbs",   text: "Heals the party by 40%",       price: 20 },
      { id: "sake",   art: "items02", name: "Sacred sake",     text: "Restores half the party's SP", price: 18 },
      { id: "ofuda",  art: "items03", name: "Ofuda of return", text: "Raises the fallen",            price: 30 },
      { id: "charm",  art: "items04", name: "Iron omamori",    text: "Defense +12% for the run",     price: 35 },
      { id: "beads",  art: "items13", name: "Prayer beads",    text: "Attack +12% for the run",      price: 35 },
      { id: "candles", art: "items09", name: "Candles",        text: "Lights the lantern for a while", price: 16 }
    ];
    var CANDLE_WARE = 0.2, CANDLE_STUB = 0.15;      // shares of the stage's lantern a purchase and a bonus give back
    function priceOf(w) { return Math.round(w.price * (1 + 0.15 * bandIndex())); }
    function applyWare(id) {
      var i;
      if (id === "herbs") healAll(0.4, false);
      else if (id === "sake") spAll(0.5);
      else if (id === "ofuda") { for (i = 0; i < party.length; i++) if (party[i].dead) { party[i].dead = false; party[i].hp = Math.round(party[i].mhp * 0.4); } }
      else if (id === "charm") for (i = 0; i < party.length; i++) party[i].def *= 1.12;
      else if (id === "beads") for (i = 0; i < party.length; i++) party[i].atk *= 1.12;
      else if (id === "candles") addCandles(Math.round(candles0 * CANDLE_WARE));
    }
    function openShop(cell) {
      var fallen = party.length - alive().length, offers = [], pool = [], i;
      for (i = 0; i < WARES.length; i++) if (WARES[i].id !== "ofuda") pool.push(WARES[i]);
      shuffle(pool);
      if (fallen) offers.push(WARES[2]);
      if (dark || candles < candles0 * 0.3) {         // a lantern burning low: the candles are on the counter
        for (i = 0; i < pool.length; i++) if (pool[i].id === "candles") offers.push(pool.splice(i, 1)[0]);
      }
      while (offers.length < 3) offers.push(pool.shift());
      openCard({
        eyebrow: "Shop", title: "Wandering merchant", tap: "Tap outside to leave", cls: "gd-shop",
        build: function (body) {
          var list = document.createElement("div"); list.className = "gd-list";
          offers.forEach(function (w) {
            var price = priceOf(w);
            var b = button(w.name, Lang.t(w.text) + " · " + price + " " + Lang.t("gold"), "", function () {
              if (b.classList.contains("is-sold")) return;
              if (gold < price) { Notify.say("Not enough gold", { kind: "warn", icon: "coin", key: "gold" }); Sound.ui("deny"); return; }
              if (w.id === "ofuda" && alive().length === party.length) { Notify.say("Nobody has fallen", { kind: "info", key: "ofuda" }); Sound.ui("deny"); return; }
              gold -= price; HUD.setLeft(gold, CONFIG.copy.goldLabel);
              applyWare(w.id);
              b.classList.add("is-off", "is-sold");
              Sound.clip("buy", 0.6);
              Notify.say(w.name, { sub: Lang.t(w.text), kind: "gain", icon: "coin" });
            }, w.art);
            list.appendChild(b);
          });
          body.appendChild(list);
        },
        onVeil: function () { closeCard(); afterRoom(cell); }
      });
    }

    /* --- an altar: one blessing out of three, for the rest of the run ----- */
    var BLESSINGS = [
      { id: "vigor", name: "Vigor", text: "Max HP +15% and healed by as much" },
      { id: "focus", name: "Focus", text: "Max SP +10 and restored" },
      { id: "edge",  name: "Edge",  text: "Attack +12%" },
      { id: "shell", name: "Shell", text: "Defense +12%" },
      { id: "swift", name: "Swift", text: "Speed +2" },
      { id: "spark", name: "Spark", text: "Skills hit 15% harder" }
    ];
    function bless(id) {
      for (var i = 0; i < party.length; i++) {
        var h = party[i];
        if (id === "vigor") { var g = Math.round(h.mhp * 0.15); h.mhp += g; if (!h.dead) h.hp += g; }
        else if (id === "focus") { h.msp += 10; if (!h.dead) h.sp = h.msp; }
        else if (id === "edge") h.atk *= 1.12;
        else if (id === "shell") h.def *= 1.12;
        else if (id === "swift") h.spd += 2;
        else if (id === "spark") h.pow *= 1.15;
      }
    }
    function openAltar(cell) {
      var offers = shuffle(BLESSINGS.slice()).slice(0, 3);
      openCard({
        eyebrow: "Altar", title: "Choose a blessing", tap: "Tap a blessing to take it",
        build: function (body) {
          var list = document.createElement("div"); list.className = "gd-list";
          offers.forEach(function (o) {
            list.appendChild(button(o.name, Lang.t(o.text), "", function () {
              bless(o.id);
              Sound.clip("upgrade", 0.6);
              Pop.show("bonus", { word: o.name, sub: o.text });
              closeCard(); afterRoom(cell);
            }));
          });
          body.appendChild(list);
        }
      });
    }

    /* --- an event: a scene and two choices -------------------------------- */
    var EVENTS = [
      { title: "A crying girl", text: "A girl in a school uniform weeps alone at the end of the corridor.",
        a: { label: "Comfort her", run: function () {
          if (Math.random() < 0.6) { healAll(0.25, false); return { word: "She smiles and fades", kind: "good" }; }
          hurtAll(0.15); Sound.clip("curse", 0.6); return { word: "She had no face", kind: "loss" }; } },
        b: { label: "Walk past", run: function () { return null; } } },
      { title: "A glowing vending machine", text: "It hums in the dark, one button lit, a coin slot waiting.",
        a: { label: "Insert 15 gold", cost: 15, run: function () {
          if (Math.random() < 0.5) { spAll(0.4); return { word: "Sacred sake drops", kind: "gain" }; }
          healAll(0.3, false); return { word: "Healing herbs drop", kind: "gain" }; } },
        b: { label: "Kick it", run: function () {
          if (Math.random() < 0.5) { addGold(20); return { word: "Coins spill out", kind: "gain" }; }
          hurtAll(0.12); return { word: "It kicks back", kind: "loss" }; } } },
      { title: "An offering box", text: "A tiny shrine, still tended. Someone left coins in the box.",
        a: { label: "Offer 20 gold", cost: 20, run: function () { bless("edge"); return { word: "The kami is pleased", kind: "good" }; } },
        b: { label: "Steal the coins", run: function () { addGold(30); hurtAll(0.2); Sound.clip("curse", 0.6); return { word: "Cursed coins", kind: "loss" }; } } },
      { title: "Footsteps behind you", text: "Slow, wet footsteps. They stop when you stop.",
        a: { label: "Turn around", run: function () {
          if (Math.random() < 0.5) return { word: "Nobody there", kind: "info" };
          return { fight: true }; } },
        b: { label: "Run", run: function () { spAll(-0.15); return { word: "You lose your breath", kind: "warn" }; } } },
      { title: "A cursed mirror", text: "Your reflection blinks a moment after you do.",
        a: { label: "Look into it", run: function () {
          if (Math.random() < 0.5) { levelUp(); return null; }
          spAll(-0.3); return { word: "It drinks your spirit", kind: "loss" }; } },
        b: { label: "Cover it", run: function () { return null; } } },
      { title: "A ringing phone", text: "An old phone rings in an empty classroom.",
        a: { label: "Answer", run: function () {
          if (Math.random() < 0.5) { addGold(25); return { word: "A voice tells you where coins are hidden", kind: "gain" }; }
          var h = Rand.pick(alive()); h.hp = Math.max(1, h.hp - Math.round(h.mhp * 0.3)); Sound.clip("curse", 0.6);
          return { word: "It was calling for you", kind: "loss" }; } },
        b: { label: "Let it ring", run: function () { return null; } } }
    ];
    function openEvent(cell) {
      var ev = Rand.pick(EVENTS);
      Sound.clip("event", 0.6);
      function choose(ch) {
        if (ch.cost && gold < ch.cost) { Notify.say("Not enough gold", { kind: "warn", icon: "coin", key: "gold" }); Sound.ui("deny"); return; }
        if (ch.cost) { gold -= ch.cost; HUD.setLeft(gold, CONFIG.copy.goldLabel); }
        var out = ch.run();
        closeCard();
        if (out && out.fight) {                            // the footsteps were a yokai
          cell.foe = Rand.pick(band().foes); cell.depth = 0.5;
          later(0.35, function () { fightAt(groups[gi], cell, {}); });
          return;
        }
        if (out) Notify.say(out.word, { kind: out.kind, icon: out.kind === "gain" ? "coin" : null });
        afterRoom(cell);
      }
      openCard({
        eyebrow: "Event", title: ev.title, tap: "Tap a choice", text: ev.text,
        build: function (body) {
          var list = document.createElement("div"); list.className = "gd-list";
          list.appendChild(button(ev.a.label, null, "", function () { choose(ev.a); }));
          list.appendChild(button(ev.b.label, null, "btn-plate", function () { choose(ev.b); }));
          body.appendChild(list);
        }
      });
    }

    /* --- a bonus: taken on the spot --------------------------------------- */
    function addGold(n) { gold += n; goldEarned += n; HUD.setLeft(gold, CONFIG.copy.goldLabel); }
    function takeBonus(cell) {
      var x = cellX(cell), y = cellY(cell), roll = Math.random();
      if (alive().length < party.length && roll < 0.25) {
        for (var i = 0; i < party.length; i++) if (party[i].dead) { party[i].dead = false; party[i].hp = Math.round(party[i].mhp * 0.3); break; }
        Pop.show("bonus", { word: "Soul returned", at: { x: x, y: y } });
        Sound.clip("heal", 0.6);
      } else if (roll < 0.45) {
        var g = Math.round(Rand.range(14, 28) * P.goldRate * (1 + 0.15 * bandIndex()));
        addGold(g);
        Pop.show("bonus", { word: "+" + g + " " + Lang.t("gold"), at: { x: x, y: y } });
        Sound.clip("gold", 0.6);
      } else if (roll < 0.65) {
        var n = Math.round(candles0 * CANDLE_STUB);
        addCandles(n);
        Pop.show("bonus", { word: "Candle stubs", sub: "+" + n, at: { x: x, y: y } });
        Sound.clip("heal", 0.6, 0.8);
      } else if (roll < 0.85) {
        healAll(0.2, false);
        Pop.show("bonus", { word: "Healing spring", at: { x: x, y: y } });
        Sound.clip("heal", 0.6);
      } else {
        spAll(0.3);
        Pop.show("bonus", { word: "Spirit well", at: { x: x, y: y } });
        Sound.clip("heal", 0.6, 1.2);
      }
      Fx.burst(x, y, { color: ["#ffd166", "#ffffff"], count: 14, speed: 260, life: 0.5, grav: 200 });
      afterRoom(cell);
    }

    /* ======================================================================
       THE WAY THROUGH — the map is WALKED, one corridor at a time, through
       the rooms already opened, and each band brings one thing to it
       (featsOf): the lantern's CANDLES everywhere; the hospital's DOORS
       (fire doors that open one way, seals a seal-breaker opens); the shrine
       forest's WANDERING yokai (their next move drawn on the map, and an
       AMBUSH when one walks into the party: it acts first); the drowned
       village's SPLIT party (two groups, the one next door joining a fight
       late); and the Gate of Yomi all of them, one more every two steps of
       its climb.

       THE LANTERN. Every hero carries a candle, so a step burns one per hero
       still standing: four heroes are the stronger party and the one the
       dark catches first. At zero comes the hour of the ox — the lit rooms
       keep what they hold to themselves, the yokai grow stronger and every
       step wounds. Candle stubs (a bonus, the shop) bring the light back.
       ====================================================================== */
    var CHASE = 4;                     // a wandering yokai smells the party this many corridors away
    var REINF = 2.2;                   // a group next door joins a fight after this many of its own waits
    var DARK = 1.25;                   // the yokai's health and blows at the hour of the ox
    var DARK_HURT = 0.03;              // what a step in the dark costs each hero (it never kills)
    var ROAM_SPD = { tengu: 2 };       // corridors a wandering yokai takes per step of the party
    var LEARN_KEY = "learn:grudgeon";
    var held = false;                  // an ambush is being announced: the map takes no tap
    var lampHit = null;                // the split / regroup chip of the lantern's band

    function featsOf(S) {
      if (!S) return {};
      var b = S.band, k = S.step;
      if (b === 1) return { doors: true };
      if (b === 2) return { roam: true };
      if (b === 3) return { split: true };
      if (b >= 4) return { doors: true, roam: k >= 2, split: k >= 4 };
      return {};
    }

    /* --- the groups: one, or two once the party is split ------------------ */
    function lead(g) { gi = groups.indexOf(g); cur = g.at; party = g.heroes; }
    function groupIn(i, not) {
      for (var k = 0; k < groups.length; k++) if (groups[k].at === i && groups[k] !== not) return groups[k];
      return null;
    }
    function otherGroup(g) { for (var k = 0; k < groups.length; k++) if (groups[k] !== g) return groups[k]; return null; }
    function groupCells() {
      if (!groups.length) return [cur];
      var out = [];
      for (var k = 0; k < groups.length; k++) out.push(groups[k].at);
      return out;
    }
    function standing(list) { var n = 0; for (var i = 0; i < list.length; i++) if (!list[i].dead) n++; return n; }
    function burnOf(g) { return Math.max(1, standing(g.heroes)); }
    function byOrder(a, b) { return HERO_IDS.indexOf(a.id) - HERO_IDS.indexOf(b.id); }
    function canSplit() { return feats.split && groups.length === 1 && standing(groups[0].heroes) >= 2; }
    /* The standing heroes in two halves, the first keeping the fallen. */
    function split() {
      var g = groups[gi], up = [], down = [], i;
      for (i = 0; i < g.heroes.length; i++) (g.heroes[i].dead ? down : up).push(g.heroes[i]);
      var half = Math.ceil(up.length / 2);
      g.heroes = up.slice(0, half).concat(down);
      groups.push({ heroes: up.slice(half), at: g.at });
      lead(g);
      aim = null;
      Notify.say("Party split", { sub: Lang.t("Tap a group to lead it"), kind: "info", icon: "user", key: "split" });
      Sound.clip("step", 0.6, 1.2);
    }
    function merge(g, o) {
      g.heroes = g.heroes.concat(o.heroes).sort(byOrder);
      groups.splice(groups.indexOf(o), 1);
      if (o.at !== g.at && !groupIn(o.at)) cells[o.at].state = DONE;
      lead(g);
      Notify.say("Party reunited", { kind: "good", icon: "user", key: "split" });
    }
    /* The other group comes to a fight when it stands in a room next door
       and the corridor between lets it through. */
    function helperOf(g) {
      var o = otherGroup(g);
      if (!o || !standing(o.heroes)) return null;
      if (o.at === g.at) return o;
      return linked(g.at).indexOf(o.at) >= 0 && passable(o.at, g.at) ? o : null;
    }

    /* --- the lantern ------------------------------------------------------- */
    function burn(g, x, y) {
      if (dark) {
        for (var i = 0; i < g.heroes.length; i++) {
          var h = g.heroes[i];
          if (!h.dead) h.hp = Math.max(1, h.hp - Math.round(h.mhp * DARK_HURT));
        }
        return;
      }
      var n = burnOf(g);
      candles = Math.max(0, candles - n);
      Pop.text(x, y - geo.size * 0.45, "-" + n, { color: "#ffcf7a", size: 22, life: 0.6, tier: 1 });
      if (!candles) {
        dark = true;
        Notify.say("The last candle dies", { sub: Lang.t("Hour of the ox: the yokai grow stronger"), kind: "loss", icon: "hourglass", key: "dark" });
        Sound.clip("curse", 0.6);
      }
    }
    function addCandles(n) {
      candles += n;
      if (dark) { dark = false; Notify.say("The light returns", { kind: "good", icon: "sparkles", key: "dark" }); }
    }

    /* --- the doors ------------------------------------------------------------
       Fire doors stand on the tree's way from the start to the far room (the
       way out, the master's, or the farthest), turned away from the start:
       walked through, they do not open again and every branch left behind is
       lost — but the far room is always ahead. One more turns a loop into a
       shortcut that goes one way. Seals close side branches that hold a
       reward, and a big map has one seal-breaker fewer than it has seals. */
    function placeDoors(start, end, dist) {
      var n = cells.length, i, k, far = end;
      if (far < 0) for (i = 0; i < n; i++) if (far < 0 || dist[i] > dist[far]) far = i;
      var parent = [], kids = [];
      for (i = 0; i < n; i++) { parent.push(-1); kids.push([]); }
      for (k in tree) if (tree.hasOwnProperty(k)) {
        var q = edges[k], up = tree[k], ch = q[0] === up ? q[1] : q[0];
        parent[ch] = up; kids[up].push(ch);
      }
      var spine = [], onSpine = {};
      for (i = far; i >= 0; i = parent[i]) { spine.unshift(i); onSpine[i] = true; }
      /* the fire doors, along that way */
      var marks = spine.length < 4 ? [] : n >= 40 ? [0.35, 0.72] : [0.5];
      for (k = 0; k < marks.length; k++) {
        var at = clamp(Math.round(spine.length * marks[k]), 2, spine.length - 1);
        doors[ek(spine[at - 1], spine[at])] = { kind: "oneway", from: spine[at - 1], to: spine[at] };
      }
      /* a loop that only goes one way */
      var loops = [];
      for (k in edges) if (edges.hasOwnProperty(k) && !tree.hasOwnProperty(k)) loops.push(k);
      if (loops.length) {
        var lk = Rand.pick(loops), le = edges[lk], fw = Math.random() < 0.5;
        doors[lk] = { kind: "oneway", from: fw ? le[0] : le[1], to: fw ? le[1] : le[0] };
      }
      /* the seals: side branches of two rooms to a quarter of the map */
      function under(r, out) { out.push(r); for (var j = 0; j < kids[r].length; j++) under(kids[r][j], out); return out; }
      var cand = [];
      for (i = 0; i < n; i++) {
        if (onSpine[i] || parent[i] < 0) continue;
        var sz = under(i, []).length;
        if (sz >= 2 && sz <= Math.max(3, n / 4)) cand.push(i);
      }
      shuffle(cand);
      var want = n >= 30 ? 2 : 1, sealed = {}, seals = 0;
      for (k = 0; k < cand.length && seals < want; k++) {
        var root = cand[k], branch = under(root, []), clash = false;
        for (i = 0; i < branch.length; i++) if (sealed[branch[i]]) clash = true;
        for (i = parent[root]; i >= 0; i = parent[i]) if (sealed[i]) clash = true;
        if (clash) continue;
        for (i = 0; i < branch.length; i++) sealed[branch[i]] = true;
        doors[ek(parent[root], root)] = { kind: "seal", open: false };
        seals++;
        /* what a seal keeps is worth a key: a reward at the end of the branch */
        var has = false, spare = -1;
        for (i = 0; i < branch.length; i++) {
          if (/^(bonus|shop|upgrade)$/.test(cells[branch[i]].type)) has = true;
          if (cells[branch[i]].type === "empty" || cells[branch[i]].type === "event") spare = branch[i];
        }
        if (!has && spare >= 0) cells[spare].type = "bonus";
      }
      /* the seal-breakers, in rooms no seal closes */
      var free = [];
      for (i = 0; i < n; i++) if (!sealed[i] && i !== start && i !== end && dist[i] >= 2 && cells[i].type === "empty") free.push(i);
      if (!free.length) for (i = 0; i < n; i++) if (!sealed[i] && i !== start && i !== end && /^(bonus|event)$/.test(cells[i].type)) free.push(i);
      shuffle(free);
      for (k = 0; k < Math.max(1, seals - 1) && k < free.length && seals; k++) cells[free[k]].type = "key";
    }
    function passable(a, b) {
      var d = doors[ek(a, b)];
      if (!d) return true;
      return d.kind === "oneway" ? d.from === a : d.open;
    }
    function known(c) { return c.state === HERE || c.state === DONE; }
    /* The shortest walk from a group's room to another: through rooms
       already opened only, the doors obeyed (a closed seal costs one of the
       keys held), the last room lit or opened. `free` ignores every door,
       which is how a refused walk says which door refused it. */
    function pathFor(g, to, free) {
      var from = g.at, cap = free ? 99 : Math.min(keys, 3), seen = {}, q = [{ i: from, u: 0, back: null }], k;
      seen[from + ":0"] = true;
      while (q.length) {
        var o = q.shift();
        if (o.i === to) {
          var path = [];
          for (var x = o; x.back; x = x.back) path.unshift(x.i);
          return { path: path, seals: o.u };
        }
        if (o.i !== from && !known(cells[o.i])) continue;
        var lk = linked(o.i);
        for (k = 0; k < lk.length; k++) {
          var j = lk[k], d = doors[ek(o.i, j)], u = o.u;
          if (cells[j].state === HIDDEN) continue;
          if (d && !free) {
            if (d.kind === "oneway" && d.from !== o.i) continue;
            if (d.kind === "seal" && !d.open) { if (u >= cap) continue; u++; }
          }
          if (seen[j + ":" + u]) continue;
          seen[j + ":" + u] = true;
          q.push({ i: j, u: u, back: o });
        }
      }
      return null;
    }
    /* Why a lit room cannot be walked to: the first door on the way. */
    function refused(g, c) {
      var p = pathFor(g, c.i, true), at = g.at, i, d;
      for (i = 0; p && i < p.path.length; i++) {
        d = doors[ek(at, p.path[i])];
        if (d && d.kind === "seal" && !d.open) {
          Notify.say("Sealed door", { sub: Lang.t("Find a seal-breaker to open it"), kind: "warn", icon: "lock", key: "door" });
          Sound.ui("deny"); return;
        }
        if (d && d.kind === "oneway" && d.from !== at) {
          Notify.say("Fire door", { sub: Lang.t("It only opens from the other side"), kind: "info", icon: "lock", key: "door" });
          Sound.ui("deny"); return;
        }
        at = p.path[i];
      }
      Notify.say("No way through", { kind: "info", icon: "lock", key: "door" });
      Sound.ui("deny");
    }
    function frontier() {
      for (var i = 0; i < cells.length; i++) {
        if (cells[i].state !== LIT) continue;
        for (var k = 0; k < groups.length; k++) if (pathFor(groups[k], i)) return true;
      }
      return false;
    }

    /* --- the wandering yokai ------------------------------------------------
       Some of the map's fights leave their room and walk, a corridor per step
       of the party (the tengu two): towards the nearest group once it is
       within CHASE corridors, at random otherwise. Doors do not hold a yokai.
       The next move is planned ahead, drawn as an arrow and kept to, so the
       party can step out of the way. The master never wanders. */
    function placeRoamers(start, dist) {
      var list = [], i;
      for (i = 0; i < cells.length; i++) if (cells[i].type === "fight" && !cells[i].boss && dist[i] >= 3) list.push(i);
      shuffle(list);
      var n = Math.min(list.length, 1 + Math.floor(fightsTotal / 4));
      for (i = 0; i < n; i++) {
        var c = cells[list[i]];
        roamers.push({ at: c.i, trail: [c.i], mt: 1, foe: c.foe, depth: c.depth, spd: ROAM_SPD[c.foe] || 1, plan: [], prev: -1 });
        c.type = "empty"; c.foe = null;
      }
      for (i = 0; i < roamers.length; i++) planRoam(roamers[i]);
    }
    function walkDist(from) {
      var d = [], q = [from], i, k;
      for (i = 0; i < cells.length; i++) d.push(-1);
      d[from] = 0;
      while (q.length) {
        var u = q.shift(), lk = linked(u);
        for (k = 0; k < lk.length; k++) if (d[lk[k]] < 0) { d[lk[k]] = d[u] + 1; q.push(lk[k]); }
      }
      return d;
    }
    function roamerAt(i, not) {
      for (var k = 0; k < roamers.length; k++) if (roamers[k].at === i && roamers[k] !== not) return roamers[k];
      return null;
    }
    function roamFree(i, r) { var c = cells[i]; return !c.boss && c.type !== "exit" && !roamerAt(i, r); }
    function planRoam(r) {
      var at = r.at, prev = r.prev, s, k;
      r.plan = [];
      for (s = 0; s < r.spd; s++) {
        var lk = linked(at), spots = groupCells(), dd = walkDist(at), tgt = -1, nx = -1;
        for (k = 0; k < spots.length; k++) if (dd[spots[k]] > 0 && (tgt < 0 || dd[spots[k]] < dd[tgt])) tgt = spots[k];
        if (tgt >= 0 && dd[tgt] <= CHASE) {
          var back = walkDist(tgt);
          for (k = 0; k < lk.length; k++) if (back[lk[k]] === dd[tgt] - 1 && roamFree(lk[k], r)) { nx = lk[k]; break; }
        }
        if (nx < 0) {
          var opts = [];
          for (k = 0; k < lk.length; k++) if (lk[k] !== prev && roamFree(lk[k], r)) opts.push(lk[k]);
          if (!opts.length && prev >= 0 && roamFree(prev, r)) opts.push(prev);
          if (opts.length) nx = Rand.pick(opts);
        }
        if (nx < 0) break;
        r.plan.push(nx);
        if (groupIn(nx)) break;            // it reaches the party: no move past it
        prev = at; at = nx;
      }
    }
    /* Every wandering yokai takes the move it showed; the first that walks
       into a group ambushes it, and the rest stop at its door. */
    function moveRoamers() {
      var hit = null, k, s, r;
      for (k = 0; k < roamers.length; k++) {
        r = roamers[k];
        r.trail = [r.at]; r.mt = 0;
        for (s = 0; s < r.plan.length; s++) {
          var nx = r.plan[s], g = groupIn(nx);
          if (!roamFree(nx, r) || (g && hit)) break;
          r.prev = r.at; r.at = nx; r.trail.push(nx);
          if (g) { hit = { r: r, g: g }; break; }
        }
      }
      for (k = 0; k < roamers.length; k++) planRoam(roamers[k]);
      return hit;
    }
    function dropRoamer(r) { var k = roamers.indexOf(r); if (k >= 0) roamers.splice(k, 1); }

    /* --- walking --------------------------------------------------------------- */
    function goTo(g, plan) {
      aim = null; peekT = 0;               // a step puts the group's bubble away
      walk = { g: g, path: plan.path, k: 0, t: 0, d: 0.24, from: g.at };
    }
    /* One corridor walked: the seal it broke, the candles, then whoever the
       party walked into, then the wandering yokai's own move. */
    function stepDone() {
      var W = walk, g = W.g, to = W.path[W.k], c = cells[to], fresh = c.state === LIT, d = doors[ek(W.from, to)];
      if (d && d.kind === "seal" && !d.open) {
        d.open = true; keys--;
        Notify.say("Seal broken", { kind: "info", icon: "unlock", key: "door" });
        Sound.clip("upgrade", 0.5, 1.3);
      }
      if (!groupIn(W.from, g)) cells[W.from].state = DONE;
      g.at = to;
      if (groups[gi] === g) cur = to;
      c.state = HERE;
      if (fresh) rooms++;
      burn(g, cellX(c), cellY(c));
      Sound.clip("step", 0.5, 0.9 + Math.random() * 0.2);
      W.k++; W.from = to; W.t = 0;
      var last = W.k >= W.path.length || fresh;
      if (last) walk = null;
      var r = roamerAt(to);
      if (r) {                             // the party walked into it
        walk = null;
        fightAt(g, roamerCell(r), { roamer: r, pending: fresh ? c : null, then: thenFor(g, fresh ? c : null) });
        return;
      }
      var hit = feats.roam ? moveRoamers() : null;
      if (hit) { walk = null; ambush(hit, hit.g === g && fresh ? c : null, thenFor(g, fresh ? c : null)); return; }
      if (!last) return;
      if (fresh) { arrive(c); return; }
      var o = groupIn(to, g);
      if (o) merge(g, o);
      afterStep();
    }
    /* What follows a fight on the way: the room the walk opened, if any. */
    function thenFor(g, c) {
      return function () {
        if (ended) return;
        if (groups.indexOf(g) < 0) { afterStep(); return; }
        lead(g);
        if (c) arrive(c); else afterStep();
      };
    }
    function roamerCell(r) { var c = cells[r.at]; return { i: c.i, r: c.r, c: c.c, type: "fight", foe: r.foe, depth: r.depth, roam: true }; }
    function ambush(hit, pending, then) {
      held = true;
      Notify.say("Ambush", { sub: Lang.t(FOES[hit.r.foe].name) + " " + Lang.t("strikes first"), kind: "warn", icon: "warn", key: "ambush" });
      Sound.clip("curse", 0.6, 1.2);
      later(0.8, function () { fightAt(hit.g, roamerCell(hit.r), { roamer: hit.r, ambush: true, pending: pending, then: then }); });
    }
    /* A fight for one group: the other joins it late from next door. */
    function fightAt(g, cell, o) {
      held = false;
      lead(g);
      party = g.heroes.slice();
      var help = feats.split ? helperOf(g) : null;
      if (help) for (var i = 0; i < help.heroes.length; i++) if (!help.heroes[i].dead) { help.heroes[i].away = true; party.push(help.heroes[i]); }
      o.group = g; o.help = help;
      startCombat(cell, o);
    }
    /* After a fight: who came to help walked in, and the party is the
       group's own again. */
    function settle(C) {
      var came = false, i;
      for (i = 0; i < party.length; i++) {
        if (C.help && C.help.heroes.indexOf(party[i]) >= 0 && !party[i].away) came = true;
        party[i].away = false;
      }
      if (groups.indexOf(C.group) < 0) return;
      if (came && groups.indexOf(C.help) >= 0) {
        burn(C.help, cellX(cells[C.group.at]), cellY(cells[C.group.at]));
        merge(C.group, C.help);
      } else lead(C.group);
    }
    /* A group wiped out while the other still stands: the run goes on with
       it, the fallen carried as souls an ofuda can bring back, and the room
       keeps its yokai. */
    function groupLost(C) {
      var g = C.group, o = otherGroup(g), i;
      for (i = 0; i < party.length; i++) party[i].away = false;
      groups.splice(groups.indexOf(g), 1);
      o.heroes = o.heroes.concat(g.heroes).sort(byOrder);
      var left = C.cell.roam ? C.pending : cells[C.cell.i];
      if (!groupIn(g.at)) cells[g.at].state = DONE;
      if (left && !groupIn(left.i)) left.state = LIT;
      lead(o);
      Notify.say("A group has fallen", { sub: Lang.t("The others walk on"), kind: "loss", icon: "warn", key: "split" });
      if (C.then) C.then(); else afterStep();
    }
    function cellAt(p) {
      var half = geo.pitch / 2;
      for (var k = 0; k < cells.length; k++) {
        var c = cells[k];
        if (Math.abs(p.x - cellX(c)) <= half && Math.abs(p.y - cellY(c)) <= half) return c;
      }
      return null;
    }

    /* The lessons, once each: what this band brings, the first time the
       player meets it. */
    function teach() {
      var seen = Store.get(LEARN_KEY, null) || {}, says = [], i;
      if (!seen.candles) says.push(["Each step burns a candle per hero", "At zero, the hour of the ox", "hourglass", "candles"]);
      if (feats.doors && !seen.doors) says.push(["Fire doors only open one way", "A seal-breaker opens a sealed door", "lock", "doors"]);
      if (feats.roam && !seen.roam) says.push(["Some yokai wander", "The arrow shows their next move", "eye", "roam"]);
      if (feats.split && !seen.split) says.push(["Split the party to explore", "A group next door comes to help", "user", "split"]);
      for (i = 0; i < says.length; i++) seen[says[i][3]] = 1;
      if (says.length) Store.set(LEARN_KEY, seen);
      says.forEach(function (s, k) {
        later(0.6 + k * 0.5, function () { Notify.say(s[0], { sub: Lang.t(s[1]), kind: "info", icon: s[2], hold: 4500 }); });
      });
    }

    function arrive(cell) {
      switch (cell.type) {
        case "fight":   fightAt(groups[gi], cell, {}); break;
        case "shop":    openShop(cell); break;
        case "upgrade": openAltar(cell); break;
        case "event":   openEvent(cell); break;
        case "bonus":   takeBonus(cell); break;
        case "key":     takeKey(cell); break;
        case "exit":    takeExit(cell); break;
        default:
          /* a quiet room: the party catches its breath */
          healAll(0.04, false); spAll(0.04);
          afterRoom(cell);
      }
    }
    function takeKey(cell) {
      keys++;
      Pop.show("bonus", { word: "Seal-breaker", sub: "Opens one sealed door", at: { x: cellX(cell), y: cellY(cell) } });
      Sound.clip("upgrade", 0.6, 1.2);
      afterRoom(cell);
    }
    function afterRoom(cell) {
      if (ended) return;
      reveal(cell.i);
      afterStep();
    }
    function afterStep() {
      if (ended) return;
      if (!frontier()) later(0.6, function () { finish("cleared"); });
    }

    /* ======================================================================
       THE FIGHT — on a TIMELINE (FFX's CTB). Every living unit counts `ct`
       down; the lowest acts, a tie going to the heroes in party order, and
       acting puts it back at its wait (TICK / spd) times the WEIGHT of what
       it did (SKILLS[].w). The yokai plans its turns ahead (`plan`), so the
       timeline shows each of them with what it will do, to whom and for
       exactly how much — its blows have no luck — and the yokai of the first
       band each bend that timeline by a rule out of their legend (RULES).
       Chosen in lab/grudgeon-timeline.html; staged as lab/grudgeon-fight.html's
       preset "B · Diagonal stage" (THE STAGE, below).
       ====================================================================== */
    var TICK = 100, SHOW = 7, SPECIAL_EVERY = 3;
    var ICE_PUSH = 0.5, FEAR_PUSH = 0.6, KNOCKS = 3;
    var POW = { strike: 1, heavy: 1.8, all: 0.75, drain: 1.2, fear: 0.9 };
    /* what a turn with no blow in it says */
    /* A FIGHT'S ENTRANCE, in seconds from its start: the blast carries the
       map away (BLOW), the band's scene stands bare for a full second — no
       veil, no scrim, no HUD over it — then the yokai lands, then the heroes
       one after the other, and last the HUD settles in; the first turn waits
       for it. */
    var INTRO = { foe: BLOW + 1.0, heroes: BLOW + 1.6, gap: 0.09, slide: 0.55, hud: BLOW + 2.45, hudDur: 0.4 };
    var PASS = { silence: "He loses his turn", confused: "She loses her turn", refill: "Its water refills",
                 thanks: "She takes her baby back" };

    /* The animation state every unit of a fight carries, reset when it starts. */
    function anim(o, i) {
      o.hx = 0; o.hz = 0; o.tx = 0; o.tz = 0; o.kx = 0; o.kz = 0;
      o.dash = 0; o.dashGo = 0; o.dashTo = { x: 0, z: 0 };
      o.hurt = 0; o.lunge = 0; o.cast = 0; o.flash = 0; o.boost = 0;
      o.phase = i * 1.7; o.lag = o.hp; o.parts = []; o.acc = 0; o.enterAt = 0;
      o.ct = 0; o.n = 0;
      return o;
    }
    function makeFoe(cell) {
      var b = FOES[cell.foe], k = P.foePower * (1 + P.depth * (cell.depth || 0)), R = RULES[cell.foe];
      /* A smaller party faces a thinner, weaker yokai: four heroes meet it
         whole, one hero meets about half its health and 70% of its blows.
         The master of a level (`cell.boss`) is the same yokai, grown. */
      var n = Math.max(1, alive().length), hk = k * (0.4 + 0.15 * n) * 1.3 * P.foeHp, ak = (0.6 + 0.1 * n) * P.foeAtk;
      if (cell.boss) { hk *= 1.8; ak *= 1.15; }
      if (dark) { hk *= DARK; ak *= DARK; }
      var hp = Math.round(b.hp * hk), spd = b.spd * (R && R.spd || 1);
      return anim({ id: cell.foe, b: b, hero: false, boss: !!cell.boss, mhp: hp, hp: hp,
               atk: b.atk * (1 + 0.6 * (k - 1)) * ak, def: b.def * (1 + 0.3 * (k - 1)), spd: spd, spd0: spd,
               acts: 0, plan: [], doing: null, hitSince: false, lastHitter: null, answered: false,
               knocks: 0, streak: 0, flame: 0, drum: 0, water: 0, grudge: 0, rattle: 0, face: 0,
               dry: false, baby: null, cocoon: null, aggro: {},
               dead: false, fade: 1, known: {} }, 0.25);
    }

    /* A FIGHT IS A SCENE, NOT A CARD. The rooms blow off the frame from the
       party's own room outwards (BLOW), the band's scene is left bare, the
       yokai glides in from the right, then the heroes run in from the left
       one after the other (`enterAt`), then the HUD (INTRO); the first turn
       waits for it. A yokai the level brings in for the first time says so,
       and so does the master of the level. */
    /* `o` is what the way through hands over (fightAt): the group, the one
       coming to help, the wandering yokai, an ambush, the room a walk opened
       and what follows the fight. */
    function startCombat(cell, o) {
      o = o || {};
      var C = combat = { cell: cell, foe: makeFoe(cell), phase: "busy", actor: null, extra: false, ward: 0,
                         age: 0, leave: -1, hover: null, TL: [], lastHero: null,
                         group: o.group, help: o.help, roamer: o.roamer, pending: o.pending, then: o.then };
      for (var i = 0; i < party.length; i++) {
        var h = anim(party[i], i);
        h.guard = false; h.ct = wait(h); h.enterAt = INTRO.heroes + i * INTRO.gap;
        h.imbue = null; h.whet = 0; h.cover = null;
        if (h.away) { h.ct = wait(h) * REINF; h.enterAt = 1e9; }      // off the frame until their turn comes
      }
      C.foe.ct = o.ambush ? 0 : wait(C.foe); C.foe.enterAt = INTRO.foe;
      var tws = tileWidths();
      for (i = 0; i < party.length; i++) party[i].tw = tws[i];
      cam.x = view.w / 2; cam.y = view.h / 2; cam.z = 1; cam.rot = 0; cam.punch = 0; cam.subject = null; cam.lb = 0;
      setStage(true);
      blowTo = 1;
      bareScene(true);
      Sound.clip("fight", 0.6);
      Music.duck(0.55, 0.4);
      var fresh = stage && stage.fresh === cell.foe && !metFresh;
      if (fresh) metFresh = true;
      later(INTRO.foe + 0.35, function () {
        if (combat !== C) return;
        if (C.foe.boss) Pop.show("danger", { word: C.foe.b.name, sub: "Master of the place" });
        else if (fresh) Pop.show("record", { word: C.foe.b.name, sub: "New yokai" });
        else Pop.show("danger", { word: C.foe.b.name });
      });
      later(INTRO.hud, function () { if (combat === C) bareScene(false); });
      later(INTRO.hud + INTRO.hudDur, function () { if (combat === C) step(); });
    }
    /* How far the fight's HUD has settled in, 0 to 1 — and with it the veil
       the ground lays over the scene. 1 outside a fight. */
    function hudIn() {
      return combat ? ease(clamp((combat.age - INTRO.hud) / INTRO.hudDur, 0, 1)) : 1;
    }
    /* The DOM's share of the bare scene: the motor's HUD band and the
       scrim over the painted scene go while it stands (skin.css). */
    function bareScene(on) {
      var fr = document.getElementById("frame");
      if (fr) fr.classList.toggle("gd-bare", on);
    }

    /* --- the timeline ----------------------------------------------------- */
    function wait(u) { return TICK / Math.max(1, u.spd); }
    /* Everyone on the timeline: a group coming from next door included,
       whose first turn is its arrival. */
    function units() {
      var out = [];
      for (var i = 0; i < party.length; i++) if (!party[i].dead) out.push(party[i]);
      if (combat && !combat.foe.dead) out.push(combat.foe);
      return out;
    }
    function lowest(list) {
      var best = null;
      for (var i = 0; i < list.length; i++) if (!best || list[i].ct < best.ct - 1e-6) best = list[i];
      return best;
    }
    /* A unit pushed back on the timeline: the row SHOWS it (the turn slides
       right), so the word is the moment's — a callout, never a notice over
       the very row it is about. */
    function push(u, share, word) {
      u.ct += wait(u) * share;
      if (word) Pop.show(u.hero ? "alert" : "bonus", { word: word, sub: u.hero ? u.b.name : "Pushed back" });
    }
    /* What an action weighs for this hero: a rule may make it heavier. */
    function weightOf(h, w) {
      var f = combat.foe, R = RULES[f.id];
      return R && R.weight ? R.weight(f, h, w) : w;
    }
    function hiddenIntents() {
      var f = combat.foe, R = RULES[f.id];
      return !!(R && R.hidden && R.hidden(f));
    }

    /* The next SHOW turns, as the player will see them. While a hero chooses,
       their own next turn is placed with the weight `w` of the action under
       the pointer, so the row re-sorts itself before anything is chosen; while
       the yokai acts, its first slot is what it is DOING. */
    function timeline(w) {
      var C = combat, out = [], f = C.foe;
      if (f.dead || C.phase === "done") return out;
      var us = units(), sim = [], i, now = C.phase === "input" && C.actor && !C.actor.dead ? C.actor : null, last = C.lastHero;
      for (i = 0; i < us.length; i++) sim.push({ u: us[i], ct: us[i].ct, n: us[i].n, guard: !!us[i].guard });
      function simOf(u) { for (var j = 0; j < sim.length; j++) if (sim[j].u === u) return sim[j]; return null; }
      if (now) {
        out.push({ u: now, key: now.id + ":" + now.n, now: true });
        var s0 = simOf(now);
        s0.ct = wait(now) * weightOf(now, w == null ? 1 : w); s0.n++; s0.guard = C.hover === "guard";
        last = now;
      }
      var fk = 0, wd = C.ward;
      while (out.length < SHOW) {
        var s = lowest(sim);
        if (!s) break;
        var d = s.ct;
        for (i = 0; i < sim.length; i++) sim[i].ct -= d;
        var e = { u: s.u, key: s.u.id + ":" + s.n, now: !out.length, hits: [] };
        if (!s.u.hero) {
          var it = f.doing ? (fk++ === 0 ? f.doing : liveIntent(fk - 2)) : liveIntent(fk++);
          e.it = it;
          var mod = fk === 1;              // the yokai's next turn: the one the scrolls bend
          if (it.alt) e.hits = maybeHits(it, simOf, wd > 0, mod);
          else {
            var tg = it.prev && !mod ? (last && !last.dead ? [last] : []) : targetsOf(it, mod);
            for (i = 0; i < tg.length; i++) { var g = simOf(tg[i]); e.hits.push({ h: tg[i], dmg: estimate(it, tg[i], g && g.guard, wd > 0, mod) }); }
          }
          if (wd > 0) wd--;
          s.ct = wait(s.u) * it.w;
        } else {
          s.guard = false;
          s.ct = wait(s.u) * weightOf(s.u, 1);
          last = s.u;
        }
        s.n++;
        out.push(e);
      }
      return out;
    }

    /* --- the intents ------------------------------------------------------
       An intent is { kind, label, tag, targets | all | prev, pow, flat, w,
       special } plus what it does besides its blow: `drain` (heals half of
       it, `feast` all of it), `fear` (pushes its target back), `gale` (pushes
       back every hero not guarding), `cocoon` (wraps its target), `pierce`
       (no guard holds it) and `after(f)`, run once it has landed. */
    function basePlan(f, i) {
      var sp = (i + 1) % SPECIAL_EVERY === 0, mv = sp ? f.b.move : "strike";
      var it = { kind: mv, label: sp ? f.b.special : "Strike", fx: mv, w: sp ? 1.2 : 1, special: sp, pow: POW[mv] };
      if (mv === "all") it.all = true; else it.targets = [randomHero()];
      if (mv === "drain") it.drain = true;
      if (mv === "fear") it.fear = true;
      return it;
    }
    function intent(k) {
      var f = combat.foe, R = RULES[f.id];
      while (f.plan.length <= k) {
        var j = f.plan.length;
        f.plan.push(R && R.plan ? R.plan(f, j) : basePlan(f, f.acts + j));
      }
      return f.plan[k];
    }
    /* What the k-th planned turn will REALLY be, read now: a rule may turn it
       into another (`live`), from what happened since it was planned. */
    function liveIntent(k) {
      var f = combat.foe, R = RULES[f.id], it = intent(k);
      return R && R.live ? R.live(f, it, k) || it : it;
    }
    /* `mod` is true for the yokai's NEXT turn, the one the scrolls laid
       since its last turn bend: a provoking hero draws a blow aimed at one
       hero, then a hero covering the one aimed at steps in front. */
    function targetsOf(it, mod) {
      if (it.all) return alive();
      var out = [], l = it.targets || [];
      if (it.prev && combat.lastHero) l = [combat.lastHero];
      for (var i = 0; i < l.length; i++) if (l[i] && !l[i].dead) out.push(l[i]);
      if (mod && out.length === 1) {
        var f = combat.foe, h = out[0];
        if (f.taunt && !f.taunt.dead) h = f.taunt;
        if (h.cover && !h.cover.dead) h = h.cover;
        out = [h];
      }
      return out;
    }
    /* A yokai's blow is exactly what its intent says: no luck, no crit. */
    function estimate(it, h, guarded, warded, mod) {
      if (!it.pow && !it.flat) return 0;
      var d = combat.foe.atk * (it.pow || 0) * 2.4 * (14 / (14 + h.def)) + (it.flat || 0);
      if (mod && combat.foe.pacify) d *= PACIFY;
      if (guarded && !it.pierce) d *= 0.5;
      if (warded) d *= 0.6;
      return Math.max(1, Math.round(d));
    }
    function maybeHits(it, simOf, warded, mod) {
      var out = [], alts = [it.alt.red, it.alt.blue], a, i, j, tg, g, d;
      for (a = 0; a < alts.length; a++) {
        tg = targetsOf(alts[a], mod);
        for (i = 0; i < tg.length; i++) {
          g = simOf(tg[i]); d = estimate(alts[a], tg[i], g && g.guard, warded, mod);
          for (j = 0; j < out.length; j++) if (out[j].h === tg[i]) break;
          if (j < out.length) out[j].dmg = Math.max(out[j].dmg, d);
          else out.push({ h: tg[i], dmg: d, maybe: true });
        }
      }
      return out;
    }
    function randomHero() { var a = alive(); return a[Math.floor(Math.random() * a.length)]; }
    function weakestHero() {
      var a = alive(), m = null;
      for (var i = 0; i < a.length; i++) if (!m || a[i].hp < m.hp) m = a[i];
      return m;
    }
    function copyOf(it, extra) {
      var o = {}, k;
      for (k in it) if (it.hasOwnProperty(k)) o[k] = it[k];
      for (k in extra) if (extra.hasOwnProperty(k)) o[k] = extra[k];
      return o;
    }
    /* The plain pattern with the special turned into something of its own. */
    function planWith(special) {
      return function (f, j) {
        var it = basePlan(f, f.acts + j);
        return it.special ? copyOf(it, special(f, it)) : it;
      };
    }
    var NOTHING = { pow: 0, targets: [], all: false, drain: false, fear: false };

    /* --- the rules ---------------------------------------------------------
       One per yokai, out of its legend, and every one of them bends the
       TIMELINE or what it shows — the fight's one surface. A rule may:
         text            the line under the boss bar (`status(f)` adds a count)
         plan(f, j)      its own intents (j turns from now)
         live(f, it, k)  turn the k-th planned intent into another, now
         action(f, h)    a scroll it hands the hero whose turn it is, aimed
                         at the yokai unless it says `on` ("self", "party")
         onHit(f, h, s, r) answer a hero's blow (s the skill, r the result)
         turn(f)         run after each of its own turns
         weight(f, h, w) make a hero's actions heavier
         hidden(f)       hide its intents
         def(f)          a factor on its defense
         spd             a speed of its own
         onScroll(f, h, id, tg) answer a scroll the instant it is used, on
                         the yokai (tg.foe) or on an ally (tg.hero) */
    var RULES = {
      /* --- Night school ---------------------------------------------------- */
      hanako: {
        text: "Third knock, she comes out: hold the door",
        status: function (f) { return Lang.t("Knock") + " " + f.knocks + "/" + KNOCKS; },
        plan: function (f, j) {
          var k = (f.knocks + j) % KNOCKS + 1;
          if (k === KNOCKS) return { kind: "stall", label: f.b.special, all: true, pow: 1.5, w: 1.2, special: true, fx: "all",
                                     after: function (f2) { f2.knocks = 0; } };
          return { kind: "knock", label: "Knock", tag: k + "/" + KNOCKS, targets: [randomHero()], pow: 0.6, w: 1, fx: "strike",
                   after: function (f2) { f2.knocks++; } };
        },
        action: function (f) {
          if (f.knocks < 1) return null;
          return { label: "Hold the door", sub: "One knock back", run: function (f2) {
            f2.knocks--; f2.plan = [];
            Pop.show("bonus", { word: "Door held", sub: "One knock back" });
          } };
        }
      },
      teketeke: {
        text: "Twice as fast, hunts the weakest: ice stops her",
        spd: 1.4,
        plan: planWith(function () { return { targets: [weakestHero()] }; }),
        onHit: function (f, h, s) { if (s.el === "ice") push(f, ICE_PUSH, "Frozen in her tracks"); }
      },
      jinmenken: {
        text: "Don't hit him before \"Leave me be\" and he walks away",
        plan: function (f, j) {
          var i = f.acts + j;
          if (i % 3 === 1) return { kind: "leave", label: "Leave me be", tag: "...", pow: 0, w: 1, targets: [] };
          return basePlan(f, i);
        },
        live: function (f, it, k) {
          if (k === 0 && it.kind === "leave" && f.hitSince && f.lastHitter && !f.lastHitter.dead)
            return { kind: "bite", label: "You hit me", targets: [f.lastHitter], pow: 1.8, w: 1, special: true, fx: "heavy" };
          return it;
        }
      },
      akamanto: {
        text: "Red or blue? Both kill: answer neither",
        plan: function (f, j) {
          var i = f.acts + j;
          if ((i + 1) % SPECIAL_EVERY) return basePlan(f, i);
          return { kind: "question", label: f.b.special, tag: "?", special: true, w: 1.2, pow: 0,
                   alt: { red:  { kind: "red", label: "Red", targets: [randomHero()], pow: 2.2, special: true, fx: "heavy", w: 1.2 },
                          blue: { kind: "blue", label: "Blue", all: true, pow: 0.9, drain: true, special: true, fx: "drain", w: 1.2 } } };
        },
        live: function (f, it, k) {
          return k === 0 && it.kind === "question" && f.answered ? { kind: "silence", label: "Silence", tag: "-", pow: 0, w: 1.2, targets: [] } : it;
        },
        action: function (f) {
          if (intent(0).kind !== "question" || f.answered) return null;
          return { label: "Neither", sub: "Refuse to choose", run: function (f2) {
            f2.answered = true;
            Pop.show("bonus", { word: "Neither", sub: "He has no answer" });
          } };
        }
      },

      /* --- Hospital -------------------------------------------------------- */
      /* "Am I pretty?" is asked of ONE hero, and only that hero can give the
         answer that disarms her: "so-so". */
      kuchisake: {
        text: "She asks one of you: only that one can answer \"so-so\"",
        plan: planWith(function (f, it) { return { kind: "ask", label: f.b.special, tag: "?", pow: 2.0, fx: "heavy" }; }),
        live: function (f, it, k) {
          return k === 0 && it.kind === "ask" && f.answered ? copyOf(copyOf(it, NOTHING), { kind: "confused", label: "Confused", tag: "-" }) : it;
        },
        action: function (f, h) {
          var it = intent(0);
          if (it.kind !== "ask" || f.answered || !it.targets || it.targets[0] !== h) return null;
          return { label: "So-so", sub: "The only safe answer", run: function (f2) {
            f2.answered = true;
            Pop.show("bonus", { word: "So-so", sub: "She doesn't know what to do" });
          } };
        }
      },
      /* Hold her baby and it grows heavier with every step — but she will not
         strike the arms that hold her child, and she thanks them for it. */
      ubume: {
        text: "Hold her baby: heavy to carry, but she spares and thanks you",
        status: function (f) { return f.baby ? Lang.t("Carried by") + " " + f.baby.b.name : ""; },
        plan: planWith(function () { return { targets: [weakestHero()], pow: 1.4 }; }),
        live: function (f, it, k) {
          if (!f.baby || f.baby.dead) return it;
          if (it.special) return copyOf(copyOf(it, NOTHING), { kind: "thanks", label: "Thank you", tag: "+",
            after: function (f2) { if (f2.baby && !f2.baby.dead) { f2.baby.atk *= 1.35; Pop.show("bonus", { word: "Blessed", sub: f2.baby.b.name }); } f2.baby = null; } });
          var tg = targetsOf(it);
          if (tg.length === 1 && tg[0] === f.baby) return copyOf(it, { targets: [weakestOther(f.baby)] });
          return it;
        },
        weight: function (f, h, w) { return h === f.baby ? w * 1.4 : w; },
        action: function (f, h) {
          if (f.baby) return null;
          return { label: "Hold the baby", on: "self", sub: "Slower until she takes it back", run: function (f2) {
            f2.baby = h; f2.plan = [];
            Pop.show("bonus", { word: "Baby held", sub: h.b.name });
          } };
        }
      },
      /* A hungry ghost: what it drains, it eats whole — unless it is fed. */
      gaki: {
        text: "It eats what it drains: an offering keeps it busy",
        plan: planWith(function () { return { feast: true, pow: 1.3 }; }),
        action: function (f) {
          if (gold < 10) return null;
          return { label: "Make an offering", sub: "10 gold · it eats instead", run: function (f2) {
            gold -= 10; HUD.setLeft(gold, CONFIG.copy.goldLabel);
            push(f2, 1.0, "It eats");
          } };
        }
      },
      /* No face, no intent to read — until a spirit blow shows it. */
      nopperabo: {
        text: "Faceless: you can't read it until a spirit blow reveals it",
        status: function (f) { return f.face > 0 ? Lang.t("Revealed") : Lang.t("Hidden"); },
        hidden: function (f) { return f.face <= 0; },
        onHit: function (f, h, s) { if (s.el === "spirit") { f.face = 2; Pop.show("bonus", { word: "Face revealed" }); } },
        turn: function (f) { if (f.face > 0) f.face--; }
      },

      /* --- Shrine forest ---------------------------------------------------- */
      /* It stands on one leg: two blows between two of its turns trip it. */
      kasaobake: {
        text: "On one leg: hit it twice between two of its turns to trip it",
        status: function (f) { return Lang.t("Hits") + " " + f.streak + "/2"; },
        onHit: function (f) { if (++f.streak === 2) push(f, 0.8, "Tripped"); },
        turn: function (f) { f.streak = 0; }
      },
      /* Its flame grows with every turn; ice puts it out. */
      chochin: {
        text: "Its flame grows every turn: ice puts it out",
        status: function (f) { return Lang.t("Flame") + " " + f.flame; },
        live: function (f, it, k) {
          return it.special ? copyOf(it, { pow: 0.4 + 0.2 * (f.flame + k) }) : it;
        },
        onHit: function (f, h, s) { if (s.el === "ice" && f.flame) { f.flame = 0; Pop.show("bonus", { word: "Doused" }); } },
        turn: function (f) { f.flame++; }
      },
      /* Its silk wraps one hero far down the timeline; a blade or fire frees. */
      jorogumo: {
        text: "Its silk wraps a hero: cut it, or burn the spider",
        plan: planWith(function () { return { kind: "cocoon", cocoon: true, drain: false, pow: 0.8, targets: [randomHero()] }; }),
        action: function (f, h) {
          if (!f.cocoon || f.cocoon.dead || f.cocoon === h) return null;
          return { label: "Cut the silk", on: "party", sub: f.cocoon.b.name + " " + Lang.t("acts next"), run: function (f2) {
            freeCocoon(f2);
          } };
        },
        onHit: function (f, h, s) { if (s.el === "fire" && f.cocoon) freeCocoon(f); }
      },
      /* Its fan blows the whole party back down the timeline; a hero on guard
         holds their ground. */
      tengu: {
        text: "Its fan blows you back: a hero on guard holds firm",
        plan: planWith(function () { return { kind: "gale", gale: true, all: true, targets: null, pow: 0.6 }; })
      },

      /* --- Drowned village ------------------------------------------------- */
      /* Bow, and the kappa bows back: the water spills from its head, and it
         is weak until it has refilled it. */
      kappa: {
        text: "Bow and it bows back: dry, it is weak until it refills",
        status: function (f) { return f.dry ? Lang.t("Dry") : ""; },
        def: function (f) { return f.dry ? 0.4 : 1; },
        live: function (f, it, k) {
          return k === 0 && f.dry ? { kind: "refill", label: "Refill", tag: "-", pow: 0, w: 0.8, targets: [],
                                       after: function (f2) { f2.dry = false; } } : it;
        },
        action: function (f) {
          if (f.dry) return null;
          return { label: "Bow", sub: "It bows back and spills its water", run: function (f2) {
            f2.dry = true;
            Pop.show("bonus", { word: "It bows back", sub: "Its water spills" });
          } };
        }
      },
      /* She strikes whoever acted just before her — the timeline decides. */
      nureonna: {
        text: "She strikes the hero who acted just before her",
        plan: function (f, j) {
          var it = basePlan(f, f.acts + j);
          return copyOf(it, { prev: true, all: false, targets: [], label: it.special ? f.b.special : it.label, pow: it.special ? 1.7 : 1 });
        }
      },
      /* Every ladle they get fills the boat: the party grows heavier. A ladle
         with no bottom empties it. */
      funayurei: {
        text: "Each special floods the boat: your actions get heavier",
        status: function (f) { return f.water ? Lang.t("Water") + " " + f.water : ""; },
        plan: planWith(function () { return { after: function (f2) { f2.water++; } }; }),
        weight: function (f, h, w) { return w * (1 + 0.2 * f.water); },
        action: function (f) {
          if (!f.water) return null;
          return { label: "Holed ladle", on: "party", sub: "The water drains away", run: function (f2) {
            f2.water = 0;
            Pop.show("bonus", { word: "Bailed out" });
          } };
        }
      },
      /* It hears only who hurts it: it strikes the hero who dealt it the most
         since its last turn. */
      umibozu: {
        text: "It strikes whoever hurt it most since its last turn",
        live: function (f, it, k) {
          if (k !== 0 || it.all || !it.pow) return it;
          var best = null, top = 0, a = alive();
          for (var i = 0; i < a.length; i++) if ((f.aggro[a[i].id] || 0) > top) { top = f.aggro[a[i].id]; best = a[i]; }
          return best ? copyOf(it, { targets: [best] }) : it;
        },
        onHit: function (f, h, s, r) { f.aggro[h.id] = (f.aggro[h.id] || 0) + r.dmg; },
        turn: function (f) { f.aggro = {}; }
      },

      /* --- Gate of Yomi ----------------------------------------------------- */
      rokurokubi: {
        text: "Its neck reaches past any guard",
        plan: function (f, j) { return copyOf(basePlan(f, f.acts + j), { pierce: true }); }
      },
      /* Its bones rattle: every fourth blow it takes, it strikes back. */
      gashadokuro: {
        text: "Every fourth blow it takes, it strikes back",
        status: function (f) { return Lang.t("Rattle") + " " + f.rattle + "/4"; },
        onHit: function (f, h) { if (++f.rattle >= 4) { f.rattle = 0; counter(f, h); } }
      },
      /* It drums faster every turn; beans drive it back. */
      oni: {
        text: "It drums faster every turn: throw beans to drive it back",
        status: function (f) { return Lang.t("Drum") + " " + f.drum; },
        turn: function (f) { f.drum++; f.spd = f.spd0 * (1 + 0.15 * f.drum); },
        action: function (f) {
          if (!f.drum) return null;
          return { label: "Throw beans", sub: "Oni wa soto!", run: function (f2) {
            f2.drum = 0; f2.spd = f2.spd0;
            push(f2, 0.5, "Driven back");
          } };
        }
      },
      /* It keeps every blow and pays it back in its Grudge; light purifies. */
      onryo: {
        text: "It stores every blow for its Grudge: light purifies it",
        status: function (f) { return Lang.t("Grudge") + " " + f.grudge; },
        live: function (f, it) { return it.special ? copyOf(it, { all: true, targets: null, fear: false, pow: 0.5, flat: Math.round(f.grudge * 0.08),
                                                                  after: function (f2) { f2.grudge = 0; } }) : it; },
        onHit: function (f, h, s, r) {
          if (r.weak) { f.grudge = Math.round(f.grudge / 2); Pop.show("bonus", { word: "Purified" }); }
          else f.grudge += r.dmg;
        }
      }
    };
    function weakestOther(h) {
      var a = alive(), m = null;
      for (var i = 0; i < a.length; i++) if (a[i] !== h && (!m || a[i].hp < m.hp)) m = a[i];
      return m || h;
    }
    function freeCocoon(f) {
      var h = f.cocoon;
      f.cocoon = null;
      if (!h || h.dead) return;
      h.ct = 0;
      Pop.show("bonus", { word: "Freed", sub: h.b.name });
    }
    /* Gashadokuro's answer: a blow straight back at the hero who struck. */
    function counter(f, h) {
      var C = combat;
      later(0.3, function () {
        if (combat !== C || f.dead || h.dead) return;
        var dmg = estimate({ pow: 0.6 }, h, h.guard, C.ward > 0), p = topOf(h);
        h.hp = Math.max(0, h.hp - dmg);
        f.lunge = 0.5;
        spellOn("spells14", h, 1.0);
        impact(h, f, { big: true, color: "#e2364b" });
        Pop.show("danger", { word: "Bone crush", sub: h.b.name });
        Pop.text(p.x + 40, p.y, "-" + dmg, { color: "#ff5d73", size: 22, life: 0.6, tier: 3 });
        Sound.clip("hurt", 0.55);
        if (h.hp <= 0) { h.dead = true; fell = true; Pop.show("alert", { word: h.b.name, sub: "Down" }); Sound.clip("down", 0.6); }
      });
    }
    function ruleAction() {
      var C = combat, R = C && RULES[C.foe.id];
      return R && R.action && C.phase === "input" && !C.foe.dead ? R.action(C.foe, C.actor) : null;
    }

    /* The damage formula of a hero's blow: attack x power, softened by
       defense, a little luck, then the element: weak 1.6x (and ONE MORE),
       resisted 0.5x, 8% crits. */
    function strike(att, tgt, pow, el, pierce) {
      var DR = RULES[tgt.id], def = (pierce ? tgt.def * 0.3 : tgt.def) * (DR && DR.def ? DR.def(tgt) : 1);
      var d = att.atk * pow * 2.4 * (14 / (14 + def)) * Rand.range(0.9, 1.1);
      var weak = false, resist = false, crit = false;
      if (tgt.b.weak.indexOf(el) >= 0) { weak = true; d *= 1.6; }
      else if (tgt.b.resist.indexOf(el) >= 0) { resist = true; d *= 0.5; }
      tgt.known[el] = weak ? "weak" : resist ? "resist" : "normal";
      if (!resist && Math.random() < 0.08) { crit = true; d *= 1.5; }
      d = Math.max(1, Math.round(d));
      tgt.hp = Math.max(0, tgt.hp - d);
      return { dmg: d, weak: weak, resist: resist, crit: crit };
    }
    /* A blow landing: the stage's own beat (knockback, cut, punch) and the
       motor's juice, at the target's place on screen. */
    function impact(tgt, from, opts) {
      tgt.hurt = 0.4; tgt.flash = 1;
      var dx = tgt.hx - from.hx, dz = tgt.hz - from.hz, d = Math.sqrt(dx * dx + dz * dz) || 1;
      tgt.kx = dx / d * 0.25; tgt.kz = dz / d * 0.25;
      var k = opts.weak ? 1.6 : opts.big ? 1.3 : 1;
      Fx.shake(12 * k, 0.25);
      Fx.freeze(0.07 * k);
      cam.punch = 0.06 * k;
      cam.subject = tgt;
      Fx.flash(opts.color || "#ffffff", 0.35 * (opts.weak ? 1 : 0.55));
    }
    function spellOn(key, a, scale) { fxs.push({ key: key, a: a, t: 0, d: 0.75, s: scale || 1.1 }); }
    function topOf(a) { return toScreen(a.sx, a.sy + a.dy - a.s * 0.82); }

    /* --- the heroes ------------------------------------------------------- */
    /* A scroll used: `tg` is where it was aimed, { foe: true } or { hero }
       — left out, a blow goes at the yokai and a support on the caster. */
    function heroAct(id, tg) {
      var C = combat;
      if (!C || C.phase !== "input") return;
      var h = C.actor, s = SKILLS[id], f = C.foe, R = RULES[f.id];
      if (s.sp > h.sp) { Notify.say("Not enough SP", { sub: h.b.name, kind: "warn", key: "sp" }); Sound.ui("deny"); return; }
      if (!tg) tg = s.kind === "hit" ? { foe: true } : { hero: h };
      h.sp -= s.sp;
      hideBar();
      C.phase = "busy"; C.hover = null;
      cam.subject = h;
      if (R && R.onScroll) R.onScroll(f, h, id, tg);
      if (tg.foe) {
        if (s.foe === "hit") { hitFoe(C, h, id, s); return; }
        h.cast = 0.9;
        later(0.3, function () {
          if (combat !== C) return;
          if (s.foe === "provoke") {
            f.taunt = h; h.guard = true;
            spellOn(s.fx, h, 0.9);
            Pop.show("bonus", { word: "Provoked", sub: h.b.name });
            Sound.clip("guard", 0.6, 0.9);
          } else if (s.foe === "pacify") {
            f.pacify = true;
            spellOn(s.fx, f, 1.0);
            Pop.show("bonus", { word: "Pacified", sub: "Its next blow is halved" });
            Sound.clip("heal", 0.6, 0.8);
          } else if (s.foe === "bind") {
            spellOn(s.fx, f, 1.0);
            push(f, BIND, "Bound");
            Sound.clip("guard", 0.6, 0.8);
          }
        });
        later(1.0, function () { endHero(C, h, s.w); });
        return;
      }
      var x = tg.hero;
      if (s.ally === "guard") {
        spellOn(s.fx, x, 0.9);
        x.guard = true; h.cast = 0.4;
        if (x === h) {
          h.sp = Math.min(h.msp, h.sp + 5);
          var gp = topOf(h);
          Pop.show("score", { word: "+5 SP" });
        } else Pop.show("bonus", { word: "Guarded", sub: x.b.name });
        Sound.clip("guard", 0.6);
        later(0.7, function () { endHero(C, h, s.w); });
        return;
      }
      if (s.ally === "heal") {
        h.cast = 0.9;
        Sound.clip("heal", 0.6);
        later(0.3, function () {
          alive().forEach(function (y) {
            var g = Math.min(y.mhp - y.hp, Math.round(y.mhp * s.pow * h.pow)), p = topOf(y);
            y.hp += g; y.flash = 0.6;
            spellOn(s.fx, y, 0.9);
            Pop.text(p.x, p.y, "+" + g, { color: "#7ee0a1", size: 22, life: 0.6, tier: 1 });
          });
        });
        later(1.0, function () { endHero(C, h, s.w); });
        return;
      }
      if (s.ally === "ward") {
        h.cast = 0.9; C.ward = s.turns;
        alive().forEach(function (y) { spellOn(s.fx, y, 0.9); });
        Sound.clip("guard", 0.6, 0.8);
        Pop.show("bonus", { word: "Spirit ward", sub: "The party takes less damage" });
        later(1.0, function () { endHero(C, h, s.w); });
        return;
      }
      /* a blow laid on an ally: a gift for their next blow, a body in
         front of them, or a step up the timeline */
      h.cast = 0.9;
      later(0.3, function () {
        if (combat !== C) return;
        x.flash = 0.6;
        spellOn(s.fx, x, 0.9);
        if (s.ally === "imbue") { x.imbue = s.el; Pop.show("bonus", { word: ELEMENTS[s.el].name, sub: x.b.name }); }
        else if (s.ally === "whet") { x.whet = WHET; Pop.show("bonus", { word: "Whetted", sub: x.b.name }); }
        else if (s.ally === "cover") { x.cover = h; Pop.show("bonus", { word: "Covered", sub: x.b.name }); }
        else if (s.ally === "hasten") { x.ct = Math.max(0, x.ct - wait(x) * HASTEN); Pop.show("bonus", { word: "Hastened", sub: x.b.name }); }
        Sound.clip("upgrade", 0.5, 1.2);
      });
      later(1.0, function () { endHero(C, h, s.w); });
    }
    /* A blow at the yokai: the hero dashes most of the way to it and back.
       What an ally laid on the hero rides on it: an element, an edge. */
    function hitFoe(C, h, id, s) {
      var f = C.foe, again = false, skill = id !== "attack";
      var elId = h.imbue || s.el, mult = h.whet || 1, sk = elId === s.el ? s : copyOf(s, { el: elId });
      h.imbue = null; h.whet = 0;
      if (skill) h.cast = 0.9; else h.lunge = 0.6;
      h.dashTo = { x: f.hx + (h.hx - f.hx) * 0.3, z: f.hz + (h.hz - f.hz) * 0.3 };
      h.dashGo = skill ? 0.35 : 1;
      later(skill ? 0.38 : 0.24, function () {
        if (combat !== C) return;
        var el = ELEMENTS[elId], r = strike(h, f, s.pow * (skill ? h.pow : 1) * mult, elId, s.pierce), p = topOf(f);
        spellOn(r.crit ? "spells14" : s.fx, f, skill ? 1.15 : 0.8);
        impact(f, h, { weak: r.weak, color: el.color });
        Fx.burst(p.x, p.y + 60, { color: [el.color, "#ffffff"], count: r.weak || r.crit ? 22 : 12, speed: 340, life: 0.5, grav: 120 });
        Pop.show("alert", { word: "-" + r.dmg, at: { x: p.x + Rand.range(-30, 30), y: p.y } });
        Sound.clip(r.weak ? "weak" : skill ? "skill" : "hit", 0.6, r.resist ? 0.8 : 1);
        f.hitSince = true; f.lastHitter = h;
        if (f.hp <= 0) return;
        if (s.push) push(f, s.push, "Stunned");
        var R = RULES[f.id];
        if (R && R.onHit) R.onHit(f, h, sk, r);
        if (r.weak && !C.extra) { again = true; Pop.show("combo", { word: "Weak!", sub: "One more", at: "center" }); f.boost = 1; }
        else if (r.crit) Pop.show("streak", { word: "Critical" });
        else if (r.resist) Pop.show("alert", { word: "Resisted", at: "upper" });
      });
      later(0.62, function () { h.dashGo = 0; });
      later(1.05, function () {
        if (combat !== C) return;
        cam.subject = null;
        if (f.hp <= 0) { f.dead = true; win(); return; }
        if (again && !h.dead) { C.extra = true; C.phase = "input"; showBar(h); return; }   // ONE MORE: the same hero, the same slot
        endHero(C, h, s.w);
      });
    }
    /* The button a yokai's rule hands the heroes: it spends the hero's turn. */
    function ruleAct() {
      var C = combat, ra = ruleAction();
      if (!ra) return;
      var h = C.actor;
      hideBar();
      C.phase = "busy"; C.hover = null; cam.subject = h; h.cast = 0.9;
      spellOn("spells04", h, 0.9);
      Sound.clip("guard", 0.6, 1.2);
      later(0.3, function () { if (combat === C) ra.run(C.foe); });
      later(1.0, function () { endHero(C, h, 1); });
    }
    function endHero(C, h, w) {
      if (combat !== C) return;
      h.n++; h.ct = wait(h) * weightOf(h, w);
      C.lastHero = h;
      cam.subject = null;
      step();
    }

    /* --- the yokai -------------------------------------------------------- */
    function foeAct() {
      var C = combat, f = C.foe;
      var it = liveIntent(0);
      f.plan.shift(); f.acts++;
      if (it.kind === "leave") { letGo(); return; }
      if (it.kind === "question") it = Math.random() < 0.5 ? it.alt.red : it.alt.blue;
      f.doing = it;
      if (!it.pow && !it.flat) {                       // a turn with no blow in it
        Pop.show("bonus", { word: it.label, sub: PASS[it.kind] || "Loses the turn" });
        later(1.0, function () { endFoe(C, it); });
        return;
      }
      var big = !!it.special;
      cam.subject = f;
      if (big) {
        C.special = 1; f.cast = 1.5; f.boost = 1.5;
        spellOn("spells09", f, 1.1);
        later(0.35, function () { if (combat === C) Pop.show("ribbon", { word: it.label }); });
        Sound.clip("special", 0.6);
      } else {
        f.lunge = 0.6;
        var h0 = targetsOf(it, true)[0] || randomHero();
        if (h0) { f.dashTo = { x: h0.hx + (f.hx - h0.hx) * 0.3, z: h0.hz + (f.hz - h0.hz) * 0.3 }; f.dashGo = 1; }
        later(0.62, function () { f.dashGo = 0; });
      }
      later(big ? 1.05 : 0.26, function () {
        if (combat !== C) return;
        var tg = targetsOf(it, true), total = 0;
        if (!tg.length && it.pow && alive().length) tg = [randomHero()];
        tg.forEach(function (h) {
          var dmg = estimate(it, h, h.guard, C.ward > 0, true), p = topOf(h);
          total += dmg;
          h.hp = Math.max(0, h.hp - dmg);
          spellOn(MOVE_FX[it.fx] || "spells13", h, 1.0);
          impact(h, f, { big: big, color: big ? "#e2364b" : "#ffffff" });
          Pop.show("alert", { word: "-" + dmg, at: { x: p.x + 40, y: p.y } });
          Fx.burst(p.x, p.y + 60, { color: ["#e2364b", "#2a0a14"], count: 10, speed: 240, life: 0.45, grav: 160 });
          if (h.hp <= 0) {
            h.dead = true; h.hp = 0; fell = true;
            if (f.cocoon === h) f.cocoon = null;
            Pop.show("alert", { word: h.b.name, sub: "Down" });
            Sound.clip("down", 0.6);
          } else if (it.fear) push(h, FEAR_PUSH, "Frozen with fear");
          else if (it.cocoon) { h.ct += wait(h) * 2; f.cocoon = h; Pop.show("alert", { word: "Wrapped in silk", sub: h.b.name }); }
        });
        if (it.gale) {
          alive().forEach(function (h) { if (!h.guard) h.ct += wait(h) * 0.6; });
          Pop.show("alert", { word: "Blown back", sub: "Guard holds firm" });
        }
        if ((it.drain || it.feast) && total) { f.hp = Math.min(f.mhp, f.hp + Math.round(total * (it.feast ? 1 : 0.5))); f.flash = 0.6; }
        if (tg.length) Sound.clip("hurt", 0.55);
        if (C.ward > 0) C.ward--;
      });
      later(big ? 1.9 : 1.05, function () { if (combat === C) { C.special = 0; endFoe(C, it); } });
    }
    function endFoe(C, it) {
      if (combat !== C) return;
      var f = C.foe;
      var R = RULES[f.id];
      if (it.after) it.after(f);
      if (R && R.turn) R.turn(f);
      f.n++; f.ct = wait(f) * it.w;
      f.hitSince = false; f.answered = false; f.doing = null;
      f.taunt = null; f.pacify = false;                 // a scroll bends one turn of the yokai
      for (var i = 0; i < party.length; i++) party[i].cover = null;
      cam.subject = null;
      step();
    }

    /* --- the scheduler: whoever is lowest on the timeline acts next -------- */
    function step() {
      var C = combat;
      if (!C || C.phase === "done" || C.foe.dead) return;
      if (!alive().length) {
        /* the heroes in the room have fallen: whoever is on the way runs in now */
        var late = units().filter(function (x) { return x.hero; });
        if (!late.length) { lose(); return; }
        late.forEach(join);
      }
      var us = units(), u = lowest(us), d = u.ct;
      for (var i = 0; i < us.length; i++) us[i].ct -= d;
      u.ct = 0;
      C.actor = u; C.extra = false;
      if (u.hero && u.away) join(u);
      if (!u.hero) { C.phase = "busy"; later(0.45, function () { if (combat === C) foeAct(); }); return; }
      u.guard = false;
      C.phase = "input"; C.peek = null; C.lastOpen = u;
      setStage();
      showBar(u);
    }

    /* A hero of the group next door reaches the fight: their first turn. */
    function join(h) {
      h.away = false; h.enterAt = combat.age;
      Pop.show("bonus", { word: "Reinforcements", sub: h.b.name });
      Sound.clip("step", 0.6, 1.1);
    }

    /* --- a fight's three ends --------------------------------------------- */
    function win() {
      var C = combat, f = C.foe, fp = toScreen(f.sx, f.sy - f.s * 0.45);
      var pts = Math.round((f.mhp + 40) / 10) * 10;
      var g = Math.round((10 + 4 * bandIndex()) * Rand.range(0.8, 1.2) * P.goldRate);
      foesDown++; score += pts; gold += g; goldEarned += g;
      if (f.boss) bossDown = true;
      HUD.setScore(score); HUD.punch("#e2364b");
      HUD.setLeft(gold, CONFIG.copy.goldLabel);
      HUD.setRight(foesDown, CONFIG.copy.foesLabel);
      Fx.burst(fp.x, fp.y, { color: ["#ffffff", "#b69cff", "#e2364b"], count: 30, speed: 420, life: 0.8, grav: -60 });
      Fx.ring(fp.x, fp.y, { from: 40, to: 260, color: "#fff2a8", width: 8, life: 0.6 });
      Fx.flash("#ffffff", 0.12);
      Sound.clip("exorcise", 0.7);
      Pop.show("bonus", { word: "Exorcised", sub: "+" + g + " " + Lang.t("gold") });
      spellOn("spells01", f, 1.5);
      for (var i = 0; i < 60; i++) f.parts.push({ front: true, x: f.sx + Rand.range(-1, 1) * f.s * 0.3, y: f.sy - Math.random() * f.s * 0.9,
        vx: Rand.range(-30, 30), vy: Rand.range(-160, -60), life: Rand.range(0.8, 1.6), t: 0, size: Rand.range(6, 16), col: "#e9e6ff" });
      if (++xp >= 2) later(1.6, function () { xp = 0; levelUp(); });
      /* the party catches its breath: a long climb is lost to attrition
         otherwise, one fight at a time */
      later(1.6, function () { healAll(0.1, false); spAll(0.1); });
      leaveFight(C);
    }
    /* Jinmenken left in peace: the room is cleared, nobody was exorcised. */
    function letGo() {
      var C = combat;
      C.foe.dead = true;
      Notify.say("Leave me be", { sub: Lang.t("He walks away"), kind: "info", key: "rule" });
      Sound.clip("event", 0.6);
      leaveFight(C);
    }
    /* The heroes run back off the left edge, then the rooms fly home and the
       corridors around this one light up. */
    function leaveFight(C) {
      C.phase = "done";
      hideBar();
      later(1.0, function () { if (combat === C) C.leave = 0; });
      later(1.5, function () {
        if (combat !== C) return;
        combat = null; hideBar(true);
        blowTo = 0;
        Music.unduck();
        if (C.roamer) dropRoamer(C.roamer);
        settle(C);
        later(BLOW, function () {
          if (C.foe.boss && bossDown) finish("lifted");
          else if (C.then) C.then();
          else afterRoom(C.cell);
        });
      });
    }
    /* The group in the fight is down: the run ends, unless the other group
       still stands somewhere on the map. */
    function lose() {
      var C = combat, left = 0;
      C.phase = "done";
      hideBar();
      Sound.clip("down", 0.7, 0.8);
      Fx.flash("#e2364b", 0.25);
      for (var i = 0; i < roster.length; i++) if (!roster[i].dead) left++;
      if (!left || !otherGroup(C.group)) { later(1.3, function () { finish("wiped"); }); return; }
      later(1.3, function () {
        if (combat !== C) return;
        combat = null; hideBar(true);
        blowTo = 0;
        Music.unduck();
        later(BLOW, function () { groupLost(C); });
      });
    }

    /* --- the scrolls: the hero's four actions, and the one a yokai's rule
       hands them, as square scrolls along the foot of the fight. A tap
       SELECTS one — it lifts, its details float over the party and the
       timeline previews its weight — and then a tap on what it is aimed at
       (the yokai, the hero whose turn it is, or any hero: `on`) fires it.
       A scroll can also be dragged and dropped on its target. */
    function weightWord(w) { return w < 0.9 ? Lang.t("Quick") : w > 1.1 ? Lang.t("Slow") : ""; }
    function scrollOf(id) {
      var C = combat, ra;
      if (id === "rule") {
        ra = ruleAction();
        return ra ? { id: id, name: ra.label, sp: 0, w: 1, icon: "icoHand", ink: "#7a4a00", on: ra.on || "foe", text: ra.sub, rule: true } : null;
      }
      var s = SKILLS[id], el = s.el && ELEMENTS[s.el];
      return { id: id, name: s.name, sp: s.sp, w: s.w, icon: s.icon, ink: el ? el.ink : s.kind === "heal" ? "#a3263e" : "#2b4f7a",
               on: "any", noSelf: !!s.noSelf, foeText: s.foeText, allyText: s.allyText, el: el, kind: s.kind,
               off: !!(C && C.actor && s.sp > C.actor.sp) };
    }
    function scrollIds(h) {
      var l = ["attack", h.b.skills[0], h.b.skills[1], "guard"];
      if (ruleAction()) l.push("rule");
      return l;
    }
    function showBar(h) {
      var frame = document.getElementById("frame");
      if (!frame) return;
      if (!bar) {
        bar = document.createElement("div"); bar.id = "gd-bar";
        frame.appendChild(bar);
      }
      bar.innerHTML = "";
      bar.style.setProperty("--hc", h.b.color);
      combat.sel = null; combat.hover = null;
      scrollIds(h).forEach(function (id) { bar.appendChild(scrollNode(scrollOf(id))); });
      bar.classList.remove("off");
      showTip();
      placeBar();
    }
    function scrollNode(info) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "gd-scroll" + (info.rule ? " is-rule" : "") + (info.off ? " is-off" : "");
      b.setAttribute("data-id", info.id);
      b.setAttribute("aria-label", upper(Lang.t(info.name)));
      b.style.setProperty("--ink", info.ink);
      b.innerHTML = '<span class="gd-paper"><i class="gd-glyph"></i></span>' + (info.sp ? '<b class="gd-cost">' + info.sp + "</b>" : "");
      var g = b.querySelector(".gd-glyph"), uri = 'url("' + ASSETS.images[info.icon] + '")';
      g.style.setProperty("-webkit-mask-image", uri); g.style.setProperty("mask-image", uri);
      dragScroll(b, info.id);
      b.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "mouse" && combat && combat.phase === "input" && !combat.sel) combat.hover = info.id;
      });
      b.addEventListener("pointerleave", function () {
        if (combat && combat.phase === "input" && !combat.sel && combat.hover === info.id) combat.hover = null;
      });
      return b;
    }
    /* One pointer on a scroll is a tap (select it, or put it back) or, past
       a few px, a drag: a ghost of the scroll follows the finger, the target
       under it lights up, and letting go on a target fires the scroll. A
       second tap on the same scroll within DOUBLE_TAP fires it on its
       default target (`defaultTarget`) instead of putting it back. */
    var DOUBLE_TAP = 0.35;
    function dragScroll(b, id) {
      var d = null, lastTap = -1;
      b.addEventListener("pointerdown", function (e) {
        if (!combat || combat.phase !== "input" || card) return;
        e.preventDefault();
        d = { x: e.clientX, y: e.clientY, on: false };
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* an old WebView */ }
      });
      b.addEventListener("pointermove", function (e) {
        if (!d) return;
        var p = toDesign(e.clientX, e.clientY);
        if (!d.on) {
          if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) < 10) return;
          if (!select(id, true)) { d = null; return; }
          d.on = true;
          ghost = b.cloneNode(true); ghost.className += " gd-ghost";
          ghost.removeAttribute("data-id");
          document.getElementById("frame").appendChild(ghost);
        }
        ghost.style.left = (p.x - 44) + "px"; ghost.style.top = (p.y - 44) + "px";
        combat.dropOn = targetAt(p);
        ghost.classList.toggle("is-on", !!(combat.dropOn && fits(scrollOf(id), combat.dropOn)));
      });
      function end(e, cancel) {
        if (!d) return;
        var was = d; d = null;
        if (!was.on) {
          if (cancel) return;
          var now = performance.now() / 1000, twice = lastTap >= 0 && now - lastTap < DOUBLE_TAP;
          lastTap = twice ? -1 : now;
          if (twice) { if (combat.sel === id || select(id, true)) aimScroll(defaultTarget(scrollOf(id)), false); }
          else if (combat.sel === id) unselect(); else select(id);
          return;
        }
        dropGhost();
        if (cancel || !combat || combat.phase !== "input") return;
        aimScroll(targetAt(toDesign(e.clientX, e.clientY)), true);
      }
      b.addEventListener("pointerup", function (e) { end(e, false); });
      b.addEventListener("pointercancel", function (e) { end(e, true); });
      b.addEventListener("click", function (e) { e.stopPropagation(); });
    }
    var ghost = null;
    function dropGhost() {
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      ghost = null;
      if (combat) combat.dropOn = null;
    }
    /* a client point -> design px, the way the motor's Input does it */
    function toDesign(cx, cy) {
      var r = document.getElementById("game").getBoundingClientRect();
      return { x: (cx - r.left) / r.width * view.w, y: (cy - r.top) / r.height * view.h };
    }
    function select(id, quiet) {
      var C = combat, info = scrollOf(id);
      if (!C || C.phase !== "input" || !info) return false;
      if (info.off) { Notify.say("Not enough SP", { sub: C.actor.b.name, kind: "warn", key: "sp" }); Sound.ui("deny"); return false; }
      C.sel = id; C.hover = id;
      if (!quiet) Sound.ui("tap");
      markSel();
      return true;
    }
    function unselect() {
      var C = combat;
      if (!C) return;
      C.sel = null; C.hover = null;
      markSel();
    }
    function markSel() {
      if (!bar) return;
      var l = bar.querySelectorAll(".gd-scroll");
      for (var i = 0; i < l.length; i++) l[i].classList.toggle("is-sel", l[i].getAttribute("data-id") === combat.sel);
      showTip();
    }
    /* Does this scroll land on this target? */
    /* Does this scroll land on this target? A hero's scroll lands on the
       yokai or on any standing ally (the caster too, unless `noSelf`); a
       rule's lands where the rule says (`on`). */
    function fits(info, tg) {
      if (!info || !tg) return false;
      if (info.on === "any") return !!tg.foe || !!(tg.hero && !tg.hero.dead && !(info.noSelf && tg.hero === combat.actor));
      if (info.on === "foe") return !!tg.foe;
      if (info.on === "self") return tg.hero === combat.actor;
      return !!(tg.hero && !tg.hero.dead);
    }
    /* Where a double tap sends a scroll: the yokai, or the hero whose turn
       it is for a scroll that cannot reach the yokai. */
    function defaultTarget(info) {
      if (fits(info, { foe: true })) return { foe: true };
      if (fits(info, { hero: combat.actor })) return { hero: combat.actor };
      return null;
    }
    /* A tap or a drop on `tg` with the selected scroll: it fires, or says
       what it is aimed at. Nothing under the finger puts the scroll back. */
    function aimScroll(tg, dropped) {
      var C = combat, info = scrollOf(C.sel);
      if (!info) return;
      if (fits(info, tg)) {
        var id = C.sel;
        C.sel = null;
        if (id === "rule") ruleAct(); else heroAct(id, tg);
        return;
      }
      if (tg || dropped) {
        Notify.say(info.on === "any" ? (tg && tg.hero === C.actor ? "Aim at another hero" : "Aim at the yokai or an ally")
                   : info.on === "foe" ? "Aim at the yokai" : info.on === "self" ? Lang.t("Aim at") + " " + C.actor.b.name : "Aim at a hero",
                   { kind: "info", icon: "info", key: "aim" });
        Sound.ui("deny");
        return;
      }
      unselect();
    }
    /* What the selected scroll does, floated over the party: its name, its
       price, its element and weight, its effect and where to aim it. */
    var tip = null;
    function showTip() {
      var C = combat, info = C && C.phase === "input" && C.sel ? scrollOf(C.sel) : null;
      if (!info) { if (tip) tip.classList.add("off"); return; }
      var frame = document.getElementById("frame");
      if (!tip) { tip = document.createElement("div"); tip.id = "gd-tip"; frame.appendChild(tip); }
      var bits = [];
      if (info.sp) bits.push(info.sp + " SP");
      if (info.el) bits.push(Lang.t(info.el.name));
      if (weightWord(info.w)) bits.push(weightWord(info.w));
      tip.innerHTML = "<p class=\"gd-tip-h\"><b></b><i></i></p><div class=\"gd-tip-faces\"></div><p class=\"gd-tip-a\"></p>";
      tip.querySelector("b").textContent = upper(Lang.t(info.name));
      tip.querySelector("i").textContent = upper(bits.join(" · "));
      var faces = tip.querySelector(".gd-tip-faces");
      if (info.rule) faces.appendChild(face(null, info.text));
      else { faces.appendChild(face("On the yokai", info.foeText)); faces.appendChild(face("On an ally", info.allyText)); }
      tip.querySelector(".gd-tip-a").textContent = Lang.t(info.on === "any" ? "Tap the yokai or an ally, or drop the scroll on one"
        : info.on === "foe" ? "Tap the yokai, or drop the scroll on it"
        : info.on === "self" ? "Tap the hero whose turn it is, or drop the scroll on them" : "Tap a hero, or drop the scroll on one");
      tip.style.setProperty("--ink", info.el ? info.el.color : info.rule ? "#ffd166" : "#f4eef8");
      tip.classList.remove("off");
      placeTip();
    }
    /* one face of a scroll: where it is aimed, then what it does there */
    function face(where, what) {
      var p = document.createElement("p"), t = document.createElement("span");
      p.className = "gd-face";
      if (where) { var b = document.createElement("b"); b.textContent = upper(Lang.t(where)); p.appendChild(b); }
      t.textContent = Lang.t(what);
      p.appendChild(t);
      return p;
    }
    function placeTip() {
      if (!tip) return;
      tip.style.left = Layout.left + "px";
      tip.style.width = Layout.w + "px";
      tip.style.top = (tilesTop() - 14 - (tip.offsetHeight || 120)) + "px";
    }
    function hideBar(remove) {
      dropGhost();
      if (tip) {
        if (remove) { if (tip.parentNode) tip.parentNode.removeChild(tip); tip = null; }
        else tip.classList.add("off");
      }
      if (combat) { combat.sel = null; combat.hover = null; }
      if (!bar) return;
      if (remove) { if (bar.parentNode) bar.parentNode.removeChild(bar); bar = null; return; }
      bar.classList.add("off");
    }
    /* The bar stands on the foot of the fight, and the hero tiles above it
       (`uiTop`). */
    function placeBar() {
      if (!bar) return;
      bar.style.left = Layout.left + "px";
      bar.style.width = Layout.w + "px";
      var hgt = bar.offsetHeight || BAR_H, foot = Layout.bottom - P.cornerClear;   // clear of the web corners
      bar.style.top = (foot - hgt) + "px";
      uiTop = foot - hgt;
      placeTip();
    }

    /* The sprite art, once a sheet is cut and adopted: `hero-akane-01`…`06`
       (idle, attack, skill, guard, hurt, down) and `foe-hanako-01`…`04`
       (idle, attack, hurt, special) become ArtImages.heroAkane01… */
    function spriteArt(kind, id, pose) {
      var im = ArtImages[kind + camel(id) + (pose < 10 ? "0" : "") + pose];
      if (!im && pose !== 1) im = ArtImages[kind + camel(id) + "01"];
      return im && im.complete && im.naturalWidth ? im : null;
    }
    function drawArt(g, im, x, y, s, flip) {
      var k = s / Math.max(im.naturalWidth, im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
      g.save(); g.translate(x, y + s / 2);
      if (flip) g.scale(-1, 1);
      g.drawImage(im, -w / 2, -h, w, h);
      g.restore();
    }

    /* The stand-in hero: a schoolkid silhouette in the hero's colours, facing
       right, with the prop that says who they are. */
    function drawHero(g, h, x, y, s, alpha, breath) {
      var b = h.b, pose = h.dead ? 6 : h.hurt > 0 ? 5 : h.lunge > 0 ? 2 : h.cast > 0 ? 3 : h.guard ? 4 : 1;
      var im = spriteArt("hero", h.id, pose);
      g.save();
      g.globalAlpha = alpha;
      if (im) { drawArt(g, im, x, y, s, false); g.restore(); return; }
      g.translate(x, y + (breath || 0));
      if (h.dead) { g.translate(0, s * 0.3); g.rotate(-Math.PI / 2.4); }
      g.fillStyle = "rgba(0,0,0,.45)";
      g.beginPath(); g.ellipse(0, s * 0.46, s * 0.28, s * 0.06, 0, 0, Math.PI * 2); g.fill();
      // coat
      g.fillStyle = b.coat;
      g.beginPath();
      g.moveTo(-s * 0.2, s * 0.45); g.lineTo(s * 0.2, s * 0.45); g.lineTo(s * 0.13, -s * 0.06); g.lineTo(-s * 0.13, -s * 0.06);
      g.closePath(); g.fill();
      g.fillStyle = b.color; g.fillRect(-s * 0.15, s * 0.06, s * 0.3, s * 0.055);
      // head and hair
      g.fillStyle = "#f1d9c6";
      g.beginPath(); g.arc(0, -s * 0.19, s * 0.12, 0, Math.PI * 2); g.fill();
      g.fillStyle = b.hair;
      g.beginPath(); g.arc(-s * 0.01, -s * 0.22, s * 0.135, Math.PI * 0.95, Math.PI * 2.05); g.fill();
      g.fillRect(-s * 0.145, -s * 0.23, s * 0.06, s * 0.2);
      g.fillStyle = "#1a1020";
      g.beginPath(); g.arc(s * 0.05, -s * 0.18, s * 0.016, 0, Math.PI * 2); g.arc(s * 0.095, -s * 0.18, s * 0.016, 0, Math.PI * 2); g.fill();
      // the prop
      g.strokeStyle = b.color; g.fillStyle = b.color; g.lineWidth = Math.max(2, s * 0.025); g.lineCap = "round";
      if (b.prop === "sword") { g.beginPath(); g.moveTo(s * 0.12, s * 0.12); g.lineTo(s * 0.42, -s * 0.28); g.stroke(); }
      else if (b.prop === "wand") {
        g.beginPath(); g.moveTo(s * 0.12, s * 0.15); g.lineTo(s * 0.28, -s * 0.22); g.stroke();
        g.fillStyle = "#ffffff"; g.fillRect(s * 0.26, -s * 0.3, s * 0.05, s * 0.12);
      } else if (b.prop === "talisman") {
        g.fillStyle = "#fff6dc";
        g.fillRect(s * 0.2, -s * 0.12, s * 0.07, s * 0.14); g.fillRect(s * 0.3, -s * 0.02, s * 0.07, s * 0.14);
        g.fillStyle = b.color; g.fillRect(s * 0.22, -s * 0.08, s * 0.03, s * 0.06);
      } else if (b.prop === "camera") {
        g.fillStyle = "#121318"; g.fillRect(s * 0.1, -s * 0.02, s * 0.2, s * 0.13);
        g.fillStyle = b.color; g.beginPath(); g.arc(s * 0.2, s * 0.045, s * 0.04, 0, Math.PI * 2); g.fill();
      }
      g.restore();
    }

    /* The stand-in yokai: a ghost in its own colour, facing left, with long
       black hair, horns or neither. */
    function drawFoe(g, f, x, y, s, alpha) {
      var pose = f.hurt > 0 ? 3 : f.cast > 0 ? 4 : f.lunge > 0 ? 2 : 1;
      var im = spriteArt("foe", f.id, pose);
      g.save();
      g.globalAlpha = alpha;
      if (im) { drawArt(g, im, x, y, s, false); g.restore(); return; }
      g.translate(x, y);
      var b = f.b, w = s * 0.32, top = -s * 0.4, bot = s * 0.38;
      var grd = g.createLinearGradient(0, top, 0, bot);
      grd.addColorStop(0, b.color); grd.addColorStop(0.7, rgba(b.color, 0.75)); grd.addColorStop(1, rgba(b.color, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(-w, 0);
      g.quadraticCurveTo(-w, top, 0, top);
      g.quadraticCurveTo(w, top, w, 0);
      g.lineTo(w, bot);
      for (var k = 0; k <= 6; k++) g.lineTo(w - (2 * w) * k / 6, bot - (k % 2 ? s * 0.07 : 0) + Math.sin(t * 3 + k) * s * 0.015);
      g.closePath(); g.fill();
      if (b.hair) {
        g.fillStyle = "#07060a";
        g.beginPath(); g.moveTo(-w * 1.05, s * 0.12); g.quadraticCurveTo(-w * 1.1, top - s * 0.03, 0, top - s * 0.03);
        g.quadraticCurveTo(w * 1.1, top - s * 0.03, w * 1.05, s * 0.12); g.lineTo(w * 0.5, s * 0.02); g.lineTo(-w * 0.3, -s * 0.08); g.closePath(); g.fill();
      }
      if (b.horns) {
        g.fillStyle = "#f4ead2";
        g.beginPath(); g.moveTo(-w * 0.6, top + s * 0.08); g.lineTo(-w * 0.85, top - s * 0.12); g.lineTo(-w * 0.3, top + s * 0.03); g.fill();
        g.beginPath(); g.moveTo(w * 0.6, top + s * 0.08); g.lineTo(w * 0.85, top - s * 0.12); g.lineTo(w * 0.3, top + s * 0.03); g.fill();
      }
      // eyes looking left, glowing
      var ey = -s * 0.17;
      g.fillStyle = "rgba(255,255,255,.95)";
      g.beginPath(); g.ellipse(-w * 0.42, ey, s * 0.045, s * 0.03, 0, 0, Math.PI * 2); g.ellipse(-w * 0.02, ey, s * 0.045, s * 0.03, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#e2364b";
      g.beginPath(); g.arc(-w * 0.47, ey, s * 0.018, 0, Math.PI * 2); g.arc(-w * 0.07, ey, s * 0.018, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(10,4,8,.85)";
      g.beginPath(); g.ellipse(-w * 0.22, -s * 0.05, s * 0.06, s * 0.025 + Math.max(0, f.lunge) * s * 0.08, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }

    /* `lag` is the health just lost, held pale a beat before it drains. */
    function drawBar(x, y, w, h, frac, color, lag) {
      ctx.fillStyle = "rgba(255,255,255,.1)";
      roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
      if (lag != null && lag > frac) { ctx.fillStyle = "rgba(255,244,240,.75)"; roundRect(ctx, x, y, Math.max(h, w * lag), h, h / 2); ctx.fill(); }
      if (frac > 0) { ctx.fillStyle = color; roundRect(ctx, x, y, Math.max(h, w * frac), h, h / 2); ctx.fill(); }
    }

    function ease(q) { return q * q * (3 - 2 * q); }

    /* Over the painted scene (CONFIG.sceneArt) the ground is only a veil,
       darker at the edges, so the rooms read over the picture; with no
       scene it is the flat night and the band's tint. */
    function drawGround() {
      var scene = Art.scene();
      if (!scene) {
        ctx.fillStyle = CONFIG.bg;
        ctx.fillRect(0, 0, view.w, view.h);
      }
      var gr = ctx.createRadialGradient(Layout.cx, Layout.cy, 40, Layout.cx, Layout.cy, view.h * 0.7);
      var e = ease(blow);                  // the scene clears as the rooms blow away
      var f = e * hudIn();                 // and comes back under the fight's HUD
      if (scene) { gr.addColorStop(0, rgba("#05040a", 0.45 * (1 - e) + 0.12 * f)); gr.addColorStop(1, rgba("#05040a", 0.8 * (1 - e) + 0.45 * f)); }
      else { gr.addColorStop(0, rgba(band().tint, 0.9)); gr.addColorStop(1, rgba(CONFIG.bg, 0)); }
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, view.w, view.h);
    }

    /* What a room shows: its yokai for a fight, its painted item otherwise,
       the pictogram while neither has decoded. */
    function drawRoomIcon(c, x, y, size, alpha) {
      if (c.type === "exit") { drawExit(x, y, size, alpha); return; }
      var R = ROOM[c.type], im = c.type === "fight" && c.foe ? spriteArt("foe", c.foe, 1) : artImg(R.art);
      if (c.type === "fight" && c.state === DONE) im = null;
      if (im) { drawFit(ctx, im, x, y, size, alpha); return; }
      var ic = c.type === "fight" && c.state === DONE ? "icoSkull" : R.icon;
      if (ic) Icon.draw(ctx, ic, x, y, size * 0.62, c.state === DONE ? "rgba(150,140,170,.45)" : R.color);
      else if (c.state === LIT) { ctx.fillStyle = R.color; ctx.beginPath(); ctx.arc(x, y, size * 0.08, 0, Math.PI * 2); ctx.fill(); }
    }

    /* Where a point of the map is while the blast carries it: pushed away
       from the party's room, the further it was the faster, turning as it
       goes. The party's own room has no direction of its own and takes one
       from its index. */
    var BL = { x: 0, y: 0, r: 0 };
    function blown(x, y, k, e) {
      if (e <= 0) { BL.x = x; BL.y = y; BL.r = 0; return BL; }
      var o = cells[cur], dx = x - cellX(o), dy = y - cellY(o), d = Math.sqrt(dx * dx + dy * dy), a;
      if (d < 1) { a = k * 2.399; dx = Math.cos(a); dy = Math.sin(a); } else { dx /= d; dy /= d; }
      var push = e * (480 + d * 1.4);
      BL.x = x + dx * push; BL.y = y + dy * push; BL.r = e * ((k % 3) - 1) * 1.1;
      return BL;
    }
    function drawMap() {
      var e = ease(blow);
      if (e >= 0.995) return;              // the fight stands on the bare scene
      ctx.save();
      ctx.globalAlpha = 1 - e;
      drawRooms(e);
      drawLamp();
      ctx.restore();
    }
    function drawRooms(e) {
      var s = geo.size, k, c, x, y, a, b, p, q;
      /* the fog: every room still in the dark, the shape of the place */
      ctx.fillStyle = "rgba(120,100,150,.07)";
      for (k = 0; k < cells.length; k++) {
        c = cells[k];
        if (c.state !== HIDDEN) continue;
        p = blown(cellX(c), cellY(c), k, e);
        roundRect(ctx, p.x - s / 2, p.y - s / 2, s, s, s * 0.18); ctx.fill();
      }
      /* the corridors from a room that is no longer dark — they stretch as
         their two rooms fly apart, so they fade twice as fast */
      ctx.lineCap = "round";
      ctx.globalAlpha = (1 - e) * (1 - e);
      for (k in edges) {
        if (!edges.hasOwnProperty(k)) continue;
        q = edges[k]; a = cells[q[0]]; b = cells[q[1]];
        if (a.state === HIDDEN && b.state === HIDDEN) continue;
        var walked = a.state >= HERE && b.state >= HERE;
        ctx.strokeStyle = walked ? "rgba(233,196,106,.55)" : a.state === HIDDEN || b.state === HIDDEN ? "rgba(255,255,255,.08)" : "rgba(182,156,255,.35)";
        ctx.lineWidth = walked ? 6 : 4;
        p = blown(cellX(a), cellY(a), q[0], e); var ax = p.x, ay = p.y;
        p = blown(cellX(b), cellY(b), q[1], e);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      ctx.globalAlpha = 1 - e;
      /* the way a first tap proposes, under the rooms */
      if (aim && !walk) drawAim(e);
      /* the rooms the light reaches — each one an element of the entrance */
      for (k = 0; k < cells.length; k++) {
        c = cells[k];
        if (c.state === HIDDEN) continue;
        if (!Enter.begin(cellX(c), cellY(c))) continue;
        p = blown(cellX(c), cellY(c), k, e);
        x = p.x; y = p.y;
        if (p.r) { ctx.save(); ctx.translate(x, y); ctx.rotate(p.r); ctx.translate(-x, -y); }
        var sc = 1 - c.pop * 0.9, ss = s * Math.max(0.3, sc);
        if (c.state === LIT) {
          var pulse = 0.55 + 0.45 * Math.sin(t * 4 + k), gold = !dark && (c.boss || c.type === "exit");
          ctx.fillStyle = "#1d1526";
          roundRect(ctx, x - ss / 2, y - ss / 2, ss, ss, ss * 0.18); ctx.fill();
          ctx.strokeStyle = gold ? rgba("#ffd166", 0.55 + 0.4 * pulse) : rgba(dark ? "#7a6a90" : "#e2364b", 0.45 + 0.4 * pulse);
          ctx.lineWidth = gold ? 6 : 4; ctx.stroke();
          if (!dark) drawRoomIcon(c, x, y, ss * 0.86, 1);       // the hour of the ox keeps what a room holds
        } else {
          ctx.fillStyle = c.state === HERE ? "#2a1d33" : "#120e18";
          roundRect(ctx, x - ss / 2, y - ss / 2, ss, ss, ss * 0.18); ctx.fill();
          ctx.strokeStyle = c.state === HERE ? "rgba(233,196,106,.7)" : "rgba(255,255,255,.1)"; ctx.lineWidth = 3; ctx.stroke();
          if (c.state === DONE && c.type !== "empty") drawRoomIcon(c, x, y, ss * 0.7, 0.3);
        }
        if (p.r) ctx.restore();
        Enter.end();
      }
      drawDoors(e);
      drawRoamers(e);
      /* the party: a lantern and one head per hero, per group */
      for (k = 0; k < groups.length || (!groups.length && k < 1); k++) drawGroup(groups[k] || null, k, e);
    }

    /* A door on its corridor: an arrow for a fire door, pointing the one way
       it opens; a violet seal with a padlock for a sealed one. */
    function drawDoors(e) {
      var s = geo.size, k, d, q, a, b, p;
      for (k in doors) {
        if (!doors.hasOwnProperty(k)) continue;
        d = doors[k]; q = edges[k]; a = cells[q[0]]; b = cells[q[1]];
        if (a.state === HIDDEN && b.state === HIDDEN) continue;
        if (d.kind === "seal" && d.open) continue;
        var A = d.kind === "oneway" ? cells[d.from] : a, B = d.kind === "oneway" ? cells[d.to] : b;
        p = blown(cellX(A), cellY(A), A.i, e); var ax = p.x, ay = p.y;
        p = blown(cellX(B), cellY(B), B.i, e);
        var mx = (ax + p.x) / 2, my = (ay + p.y) / 2, ang = Math.atan2(p.y - ay, p.x - ax), r = s * 0.2;
        ctx.save();
        ctx.translate(mx, my);
        if (d.kind === "oneway") {
          ctx.rotate(ang);
          ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r * 0.7, -r * 0.8); ctx.lineTo(-r * 0.3, 0); ctx.lineTo(-r * 0.7, r * 0.8); ctx.closePath();
          ctx.fillStyle = "#ff9f43"; ctx.strokeStyle = "#1a0f08"; ctx.lineWidth = 4; ctx.lineJoin = "round";
          ctx.stroke(); ctx.fill();
        } else {
          ctx.fillStyle = "#2a1a3c"; ctx.strokeStyle = "#c79bff"; ctx.lineWidth = 3;
          roundRect(ctx, -r, -r, r * 2, r * 2, r * 0.3); ctx.fill(); ctx.stroke();
          Icon.draw(ctx, "icoLock", 0, 0, r * 1.4, "#e2c8ff");
        }
        ctx.restore();
      }
    }

    /* Where a wandering yokai stands this frame, along the corridors it took. */
    function roamerPos(r) {
      var tr = r.trail, n = tr.length - 1, q = ease(r.mt), at = Math.min(n - 1, Math.floor(q * n));
      if (n < 1) return { x: cellX(cells[r.at]), y: cellY(cells[r.at]) };
      var f = q * n - at, A = cells[tr[at]], B = cells[tr[at + 1]];
      return { x: cellX(A) + (cellX(B) - cellX(A)) * f, y: cellY(A) + (cellY(B) - cellY(A)) * f };
    }
    /* A wandering yokai is seen once its room is lit, with the move it will
       make drawn ahead of it in red. */
    function drawRoamers(e) {
      var s = geo.size, k, j, r, p;
      for (k = 0; k < roamers.length; k++) {
        r = roamers[k];
        if (cells[r.at].state === HIDDEN) continue;
        var pos = roamerPos(r);
        p = blown(pos.x, pos.y, r.at, e);
        var x = p.x, y = p.y - s * 0.08 + Math.sin(t * 2.4 + k) * 4;
        /* the move it will make */
        if (r.mt >= 1 && r.plan.length) {
          var px = cellX(cells[r.at]), py = cellY(cells[r.at]);
          ctx.save();
          ctx.strokeStyle = "rgba(255,70,90,.9)"; ctx.fillStyle = "rgba(255,70,90,.9)"; ctx.lineWidth = 5; ctx.lineCap = "round";
          ctx.setLineDash([10, 9]); ctx.lineDashOffset = -t * 30;
          for (j = 0; j < r.plan.length; j++) {
            var nc = cells[r.plan[j]], nx = cellX(nc), ny = cellY(nc), ang = Math.atan2(ny - py, nx - px);
            var ex = nx - Math.cos(ang) * s * 0.42, ey = ny - Math.sin(ang) * s * 0.42;
            ctx.beginPath(); ctx.moveTo(px + Math.cos(ang) * s * 0.3, py + Math.sin(ang) * s * 0.3); ctx.lineTo(ex, ey); ctx.stroke();
            if (j === r.plan.length - 1) {
              ctx.setLineDash([]);
              ctx.beginPath(); ctx.moveTo(ex + Math.cos(ang) * 14, ey + Math.sin(ang) * 14);
              ctx.lineTo(ex + Math.cos(ang + 2.4) * 14, ey + Math.sin(ang + 2.4) * 14);
              ctx.lineTo(ex + Math.cos(ang - 2.4) * 14, ey + Math.sin(ang - 2.4) * 14);
              ctx.closePath(); ctx.fill();
            }
            px = nx; py = ny;
          }
          ctx.restore();
        }
        var glow = ctx.createRadialGradient(x, y, 4, x, y, s * 0.62);
        glow.addColorStop(0, "rgba(226,54,75,.55)"); glow.addColorStop(1, "rgba(226,54,75,0)");
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, s * 0.62, 0, Math.PI * 2); ctx.fill();
        var im = spriteArt("foe", r.foe, 1);
        if (im) drawFit(ctx, im, x, y, s * 0.92, 1);
        else Icon.draw(ctx, "icoGhost", x, y, s * 0.6, "#ff6a7a");
      }
    }

    /* The way a first tap proposes: the corridors, and what they burn. */
    function drawAim(e) {
      var s = geo.size, i, c = cells[aim.from], short = aim.cost > candles && !dark;
      ctx.save();
      ctx.strokeStyle = short ? "rgba(255,110,110,.85)" : "rgba(255,209,102,.85)"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.setLineDash([2, 14]); ctx.lineDashOffset = -t * 40;
      ctx.beginPath(); ctx.moveTo(cellX(c), cellY(c));
      for (i = 0; i < aim.path.length; i++) { c = cells[aim.path[i]]; ctx.lineTo(cellX(c), cellY(c)); }
      ctx.stroke();
      ctx.setLineDash([]);
      var x = cellX(c), y = cellY(c) - s * 0.62, w = 92, h = 40;
      ctx.fillStyle = "rgba(12,8,18,.92)"; roundRect(ctx, x - w / 2, y - h / 2, w, h, 20); ctx.fill();
      ctx.strokeStyle = short ? "#ff6e6e" : "#ffd166"; ctx.lineWidth = 3; ctx.stroke();
      var im = artImg("items09");
      if (im) drawFit(ctx, im, x - w / 2 + 22, y, 32, 1);
      text("-" + aim.cost, x + 12, y + 1, 24, short ? "#ff8a8a" : "#fff2c4", "center", 0, 900);
      ctx.restore();
    }

    /* One group on the map, as a map shows where you are: a lantern glowing
       in its room under a pin in a neutral white, and — for two seconds
       after a tap on that room, and at the first step of the run — an
       INFO-BUBBLE pointing at the room with the group's heads in it, at a
       size of their own: a room of a big map is far too small to hold four
       faces, and a bubble always up hid the rooms around it. The bubble stands
       above the room, or below it when the top of the frame is too close
       (and for the second group sharing a room); the group the player leads
       is rimmed in gold, the other waits dimmer and smaller. */
    var HEAD_D = 80, PEEK = 2;
    var peekG = null, peekT = 0;           // the group whose bubble is up, and for how much longer
    /* A tap on the group's room puts its bubble up for PEEK seconds; a step
       puts it away at once. */
    function showBubble(g) { peekG = g; peekT = PEEK; }
    function drawHead(h, cx, cy, d, alpha) {
      var hd = artImg("head0" + (HERO_IDS.indexOf(h.id) + 1));
      if (hd) drawFit(ctx, hd, cx, cy, d, (alpha == null ? 1 : alpha) * (h.dead ? 0.32 : 1));
      else {
        ctx.fillStyle = h.dead ? "#3a3542" : h.b.color;
        ctx.beginPath(); ctx.arc(cx, cy, d * 0.42, 0, Math.PI * 2); ctx.fill();
      }
      if (h.dead) Icon.draw(ctx, "icoSkull", cx, cy, d * 0.45, "#d8d2e6");
    }
    function drawGroup(g, k, e) {
      var s = geo.size, at = g ? g.at : cur, x = cellX(cells[at]), y = cellY(cells[at]), p, i;
      if (walk && g && walk.g === g) {
        var A = cells[walk.from], B = cells[walk.path[Math.min(walk.k, walk.path.length - 1)]];
        var q = clamp(walk.t / walk.d, 0, 1); q = q * q * (3 - 2 * q);
        x = cellX(A) + (cellX(B) - cellX(A)) * q;
        y = cellY(A) + (cellY(B) - cellY(A)) * q - Math.sin(q * Math.PI) * 14;
      }
      var shared = !!(g && !(walk && walk.g === g) && groupIn(at, g));
      var lead1 = !g || groups[gi] === g;
      if (!Enter.begin(x, y, { last: true })) return;
      p = blown(x, y, 7 + k, e); x = p.x; y = p.y;
      ctx.save();
      if (!lead1) ctx.globalAlpha *= 0.75;
      /* the lantern in the room, and the pin the bubble points at */
      var gr = s * (lead1 ? 1.1 : 0.8), glow = ctx.createRadialGradient(x, y, 4, x, y, gr);
      glow.addColorStop(0, dark ? "rgba(160,140,200,.35)" : "rgba(255,214,140,.55)"); glow.addColorStop(1, "rgba(255,214,140,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, gr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lead1 ? "#f2eef8" : "#8e889e";     // neutral: no hero's colour
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#07060c"; ctx.lineWidth = 3; ctx.stroke();
      if (!(peekT > 0 && peekG === g && g)) { ctx.restore(); Enter.end(); return; }
      /* the bubble pops in, and fades over its last quarter second */
      var age = PEEK - peekT, pop = clamp(age / 0.15, 0, 1);
      ctx.globalAlpha *= Math.min(pop, clamp(peekT / 0.25, 0, 1));

      var list = g ? g.heroes : party || savedParty().map(function (id) { return { id: id, b: HEROES[id], dead: false }; });
      var n = list.length, d = HEAD_D * (lead1 ? 1 : 0.8), gap = 4, pad = 10, tail = 22;
      var bw = n * d + (n - 1) * gap + pad * 2, bh = d + pad * 2;
      var below = (shared && groups.indexOf(g) === 1) || y - s * 0.2 - tail - bh < Layout.top + 4;
      var tipY = below ? y + s * 0.2 : y - s * 0.2, by = below ? tipY + tail : tipY - tail - bh;
      var bx = clamp(x - bw / 2, Layout.left - 10, Layout.right + 10 - bw), tx = clamp(x, bx + 26, bx + bw - 26);
      ctx.beginPath();
      ctx.moveTo(bx + 18, by); ctx.lineTo(bx + bw - 18, by); ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + 18);
      ctx.lineTo(bx + bw, by + bh - 18); ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - 18, by + bh);
      if (!below) { ctx.lineTo(tx + 14, by + bh); ctx.lineTo(x, tipY); ctx.lineTo(tx - 14, by + bh); }
      ctx.lineTo(bx + 18, by + bh); ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - 18);
      ctx.lineTo(bx, by + 18); ctx.quadraticCurveTo(bx, by, bx + 18, by);
      if (below) { ctx.lineTo(tx - 14, by); ctx.lineTo(x, tipY); ctx.lineTo(tx + 14, by); }
      ctx.closePath();
      ctx.fillStyle = "rgba(14,9,22,.94)"; ctx.fill();
      ctx.strokeStyle = lead1 ? (dark ? "#9a8cb8" : "#ffd166") : "rgba(255,255,255,.3)"; ctx.lineWidth = 3; ctx.stroke();
      for (i = 0; i < n; i++) drawHead(list[i], bx + pad + d / 2 + i * (d + gap), by + bh / 2, d, 1);
      ctx.restore();
      Enter.end();
    }

    /* THE LANTERN, a panel under the map and clear of the web corners — the
       notices own the top of the frame. It says the candle rule with
       pictures: the candles left, then the party led, one big head per hero
       with the candle THEY carry lit beside it (a fallen hero carries none
       and burns none). Under it, the rule as a sentence with the group's own
       number, the seal-breakers held and the chip that splits or regroups
       the party. A way proposed on the map shows what it would burn next to
       the count. */
    function partyBurns(n) {
      return n === 1 ? Lang.t("The party uses 1 candle per move") : Lang.t("The party uses {n} candles per move").replace("{n}", n);
    }
    function drawLamp() {
      var top = Layout.bottom - P.cornerClear - P.lampBar + 4, x0 = Layout.left, W = Layout.w, H = P.lampBar - 10;
      var im = artImg("items09"), g, hs, k;
      lampHit = null;
      if (!party || !groups.length) return;
      if (!Enter.begin(Layout.cx, top + H / 2)) return;
      g = groups[gi]; hs = g.heroes;
      ctx.save();
      ctx.fillStyle = "rgba(10,6,16,.82)"; roundRect(ctx, x0 - 8, top, W + 16, H, 22); ctx.fill();
      var warm = ctx.createRadialGradient(x0 + 40, top + 60, 4, x0 + 40, top + 60, 220);
      warm.addColorStop(0, dark ? "rgba(120,100,160,.22)" : "rgba(255,180,80,.30)"); warm.addColorStop(1, "rgba(255,180,80,0)");
      ctx.fillStyle = warm; roundRect(ctx, x0 - 8, top, W + 16, H, 22); ctx.fill();
      ctx.strokeStyle = dark ? "rgba(255,110,110,.45)" : "rgba(255,207,122,.35)"; ctx.lineWidth = 2;
      roundRect(ctx, x0 - 8, top, W + 16, H, 22); ctx.stroke();
      ctx.restore();

      /* row 1: the candles, then each hero with the candle they burn */
      var d = 104, gap = 6, y1 = top + 14 + d / 2;
      if (im) drawFit(ctx, im, x0 + 36, y1 - 6, 84, dark ? 0.35 : 1);
      else Icon.draw(ctx, "icoFlame", x0 + 36, y1 - 6, 56, dark ? "#6c6880" : "#ffcf7a");
      text(String(candles), x0 + 80, y1 - 12, 46, dark ? "#ff6e6e" : "#fff2c4", "left", 6, 900);
      var cw = ctx.measureText(String(candles)).width;
      if (aim && !dark) text("-" + aim.cost, x0 + 88 + cw, y1 - 10, 26, aim.cost > candles ? "#ff6e6e" : "#ffb86b", "left", 5, 900);
      text(upper(Lang.t("Candles")), x0 + 81, y1 + 26, 18, "rgba(255,242,196,.7)", "left", 4, 900);
      var hx = x0 + W - hs.length * (d + gap) + gap;
      for (k = 0; k < hs.length; k++) {
        var h = hs[k], cx = hx + d / 2;
        drawHead(h, cx - 8, y1, d - 10, 1);
        if (!h.dead && im) {
          /* the candle this hero carries, flickering while it burns */
          var fx = cx + d * 0.3, fy = y1 + d * 0.22, fl = 0.75 + 0.25 * Math.sin(t * 9 + k * 2.1);
          if (!dark) {
            var gl = ctx.createRadialGradient(fx, fy - 16, 1, fx, fy - 16, 30);
            gl.addColorStop(0, "rgba(255,200,110," + (0.6 * fl) + ")"); gl.addColorStop(1, "rgba(255,200,110,0)");
            ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(fx, fy - 16, 30, 0, Math.PI * 2); ctx.fill();
          }
          drawFit(ctx, im, fx, fy, 50, dark ? 0.35 : 1);
        }
        hx += d + gap;
      }

      /* row 2: the rule in words, the keys, the split */
      var y2 = top + H - 26, right = Layout.right;
      var chip = canSplit() ? "Split" : groups.length > 1 ? "Regroup" : null;
      if (chip) {
        ctx.font = font(20, 900);
        var label = upper(Lang.t(chip)), chw = ctx.measureText(label).width + 32, chh = 38, chx = right - chw / 2;
        ctx.fillStyle = "rgba(20,12,30,.95)"; roundRect(ctx, chx - chw / 2, y2 - chh / 2, chw, chh, 19); ctx.fill();
        ctx.strokeStyle = rgba("#9b8cff", 0.6 + 0.3 * Math.sin(t * 3)); ctx.lineWidth = 3; ctx.stroke();
        text(label, chx, y2 + 1, 20, "#e8e1ff", "center", 0, 900);
        lampHit = { x: chx, y: y2, w: chw, h: chh };
        right -= chw + 14;
      }
      if (feats.doors) {
        var kim = artImg("items15");
        text("x" + keys, right, y2 + 1, 24, keys ? "#e2c8ff" : "rgba(226,200,255,.45)", "right", 5, 900);
        var kw = ctx.measureText("x" + keys).width;
        if (kim) drawFit(ctx, kim, right - kw - 22, y2, 38, keys ? 1 : 0.45);
        else Icon.draw(ctx, "icoLock", right - kw - 20, y2, 26, "#c79bff");
      }
      text(dark ? Lang.t("Every step wounds the party") : partyBurns(burnOf(g)), x0 + 6, y2 + 1, 22,
           dark ? "#ff9a9a" : "#fff2c4", "left", 0, 700);
      Enter.end();
    }

    /* ======================================================================
       THE STAGE — lab/grudgeon-fight.html's preset "B · Diagonal stage": the
       party on a diagonal coming at the glass, the yokai deeper on the right,
       a pseudo-3D ground plane, a water reflection under every figure, mist
       on the floor, a rim light, the yokai in flames, a ritual circle under
       the hero whose turn it is, and a camera that zooms on the turn, cuts to
       the target and tilts on a special.

       The HUD stacks down from Layout's top (the timeline, the boss bar),
       the scrolls (DOM) and the hero tiles up from its foot, and the ground
       stands between. Every explanation is in a card a tap opens.
       ====================================================================== */
    var STAGE = { persp: 7, tilt: 0.75, unit: 112, heroScale: 0.95, foeScale: 1.15, foe: [1.2, 1.3] };
    var TILE_H = 76, BAR_H = 100, ROW_H = 84;
    var uiTop = 0;                         // the action bar's live top, which the tiles stand on
    var cam = { x: 360, y: 640, z: 1, rot: 0, punch: 0, subject: null, lb: 0 };
    var G = null;                          // fightGeo(), once per frame

    function fightGeo() {
      var bottom = Layout.bottom - P.cornerClear + 20;
      var barTop = bottom - BAR_H;
      return { top: Layout.top + 6, bottom: bottom, barTop: barTop, ground: barTop - 10 - TILE_H - 150 };
    }
    /* A point of the ground (x across, z into the screen) seen by a camera
       `persp` units in front of it: `s` is the scale there. */
    function proj(wx, wz) {
      var D = STAGE.persp, q = Math.max(D * 0.3, wz + D), k = D / q;
      return { x: view.w / 2 + STAGE.unit * wx * k, y: G.ground - STAGE.unit * STAGE.tilt * D * wz / q, s: k };
    }
    function setStage(snap) {
      var n = party.length;
      for (var i = 0; i < n; i++) {
        var h = party[i];
        h.tx = -2.4 + i * 1.0; h.tz = 0.5 - i * 0.65;
        if (snap) { h.hx = h.tx; h.hz = h.tz; }
      }
      var f = combat.foe;
      f.tx = STAGE.foe[0]; f.tz = STAGE.foe[1];
      if (snap) { f.hx = f.tx; f.hz = f.tz; }
    }
    /* Where a unit is drawn this frame: its place, the dash, the knockback,
       the slide in from its own edge, and the heroes' run off on `leave`. */
    function place(a, C) {
      var x = a.hx + (a.dashTo.x - a.hx) * a.dash * 0.75 + a.kx;
      var z = a.hz + (a.dashTo.z - a.hz) * a.dash * 0.75 + a.kz;
      var e = slideIn(C.age, a.enterAt, INTRO.slide);
      x += (a.hero ? -6.5 : 6.5) * (1 - e);
      if (a.hero && C.leave >= 0) x -= 6.5 * Math.pow(clamp(C.leave / 0.45, 0, 1), 2);
      var p = proj(x, z);
      a.wx = x; a.wz = z; a.sx = p.x; a.sy = p.y; a.k = p.s;
      a.s = (a.hero ? 200 * STAGE.heroScale : 320 * STAGE.foeScale * (a.boss ? 1.15 : 1)) * p.s;
      a.dy = a.hero ? 0 : Math.sin(t * 1.6) * 8;
      if (a.hurt > 0) a.sx += Math.sin(a.hurt * 60) * 7;
      a.alpha = a.hero ? 1 : a.dead ? Math.max(0, a.fade) : 1;
      if (!a.hero && a.dead) a.dy -= (1 - Math.max(0, a.fade)) * 80;
    }
    function slideIn(age, from, dur) {
      var q = clamp((age - from) / dur, 0, 1);
      return 1 - (1 - q) * (1 - q) * (1 - q);
    }

    /* --- the camera: a zoom on the hero whose turn it is, a cut to whoever
       acts or is hit, a dutch angle and letterbox bars on a special. ------ */
    function updateCamera(dt) {
      var C = combat, tx = view.w / 2, ty = view.h / 2, tz = 1, trot = 0;
      var subj = cam.subject || (C.phase === "input" ? C.actor : null);
      if (subj && subj.sx != null) {
        tz = 1 + (cam.subject ? 0.22 : 0.08);
        tx = view.w / 2 + (subj.sx - view.w / 2) * 0.6;
        ty = view.h / 2 + (subj.sy + subj.dy - subj.s * 0.45 - view.h / 2) * 0.6;
      }
      if (C.special) trot = 6 * Math.PI / 180;
      tz += Math.sin(t * 0.21) * 0.02;
      tx += Math.sin(t * 0.13) * 6;
      var hw = view.w / 2 / tz, hh = view.h / 2 / tz;
      tx = clamp(tx, hw, view.w - hw); ty = clamp(ty, hh, view.h - hh);
      var k = Math.min(1, dt * 4);
      cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; cam.z += (tz - cam.z) * k;
      cam.rot += (trot - cam.rot) * Math.min(1, dt * 5);
      cam.punch *= Math.pow(0.0005, dt);
      cam.lb += ((C.special ? 1 : 0) - cam.lb) * Math.min(1, dt * 6);
    }
    function camZoom() { return cam.z + cam.punch; }
    function applyCamera(g) {
      g.translate(view.w / 2, view.h / 2);
      g.rotate(cam.rot);
      g.scale(camZoom(), camZoom());
      g.translate(-cam.x, -cam.y);
    }
    /* stage space -> design px on the frame (the HUD, Pop.text, Fx) */
    function toScreen(x, y) {
      var z = camZoom(), c = Math.cos(cam.rot), s = Math.sin(cam.rot);
      var dx = (x - cam.x) * z, dy = (y - cam.y) * z;
      return { x: view.w / 2 + dx * c - dy * s, y: view.h / 2 + dx * s + dy * c };
    }

    /* --- the figure's effects, built once per picture ----------------------
       Each is a silhouette of the sprite, kept ON the image object (a data
       URI is no key to hash every frame) at half its size: they are soft
       light laid over a figure, and half the pixels is a quarter the memory
       over 28 poses. */
    var FXK = 0.5;
    function fxCache(im) { return im.__gd || (im.__gd = {}); }
    function silOf(im, col) {
      var C = fxCache(im), key = "s" + col;
      if (C[key]) return C[key];
      var c = document.createElement("canvas"), w = Math.ceil(im.naturalWidth * FXK), h = Math.ceil(im.naturalHeight * FXK);
      c.width = w; c.height = h;
      var g = c.getContext("2d");
      g.drawImage(im, 0, 0, w, h);
      g.globalCompositeOperation = "source-in"; g.fillStyle = col; g.fillRect(0, 0, w, h);
      return (C[key] = c);
    }
    /* the rim light: the silhouette minus itself shifted toward the light */
    function rimOf(im, col) {
      var C = fxCache(im), key = "r" + col;
      if (C[key]) return C[key];
      var s = silOf(im, col), c = document.createElement("canvas"), off = Math.max(1, Math.round(s.width * 0.022));
      c.width = s.width; c.height = s.height;
      var g = c.getContext("2d");
      g.drawImage(s, 0, 0);
      g.globalCompositeOperation = "destination-out";
      g.drawImage(silOf(im, "#000000"), Math.round(-0.64 * off), Math.round(0.77 * off));
      return (C[key] = c);
    }
    /* a glow: the silhouette shrunk and blown back up, which blurs it without
       ctx.filter (missing from older WebViews) */
    function glowOf(im, col) {
      var C = fxCache(im), key = "g" + col;
      if (C[key]) return C[key];
      var s = silOf(im, col), pad = 20, c = document.createElement("canvas");
      c.width = s.width + pad * 2; c.height = s.height + pad * 2;
      var sm = document.createElement("canvas"), q = 6;
      sm.width = Math.ceil(c.width / q); sm.height = Math.ceil(c.height / q);
      var gs = sm.getContext("2d");
      gs.drawImage(s, pad / q, pad / q, s.width / q, s.height / q);
      var g = c.getContext("2d");
      g.imageSmoothingEnabled = true;
      g.drawImage(sm, 0, 0, c.width, c.height); g.drawImage(sm, 0, 0, c.width, c.height);
      c.pad = pad;
      sm.width = 0; sm.height = 0;
      return (C[key] = c);
    }
    var DOT = null;
    function dotCv() {
      if (DOT) return DOT;
      DOT = document.createElement("canvas"); DOT.width = DOT.height = 64;
      var g = DOT.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return DOT;
    }
    function mix(a, b, k) {
      var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
      function ch(sh) { return Math.round((x >> sh & 255) * (1 - k) + (y >> sh & 255) * k); }
      return "#" + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1);
    }
    function lum(hex) { var n = parseInt(hex.slice(1), 16); return ((n >> 16 & 255) * 0.3 + (n >> 8 & 255) * 0.59 + (n & 255) * 0.11) / 255; }
    function auraCol(a) { return lum(a.b.color) < 0.35 ? mix(a.b.color, "#b69cff", 0.6) : a.b.color; }

    /* Where the head is, for a portrait cut out of the idle pose: the middle
       of the topmost opaque rows, read once per picture. */
    function headOf(im) {
      var C = fxCache(im);
      if (C.head) return C.head;
      var hd = { x: 0.5, y: 0.14 };
      try {
        var w = 64, hh = Math.round(64 * im.naturalHeight / im.naturalWidth), c = document.createElement("canvas");
        c.width = w; c.height = hh;
        var g = c.getContext("2d"); g.drawImage(im, 0, 0, w, hh);
        var d = g.getImageData(0, 0, w, hh).data, top = -1, x, y, sx = 0, n = 0;
        for (y = 0; y < hh && top < 0; y++) for (x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 140) { top = y; break; }
        if (top >= 0) {
          for (y = top + Math.round(hh * 0.05); y < top + Math.round(hh * 0.14); y++) for (x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 140) { sx += x; n++; }
          if (n) hd = { x: sx / n / w, y: (top + hh * 0.1) / hh };
        }
        c.width = 0;
      } catch (e) { /* a tainted picture keeps the guess */ }
      return (C.head = hd);
    }
    /* A face in a circle (or a square): the crop each figure names in
       `face` — its centre and side as shares of the idle pose — and the
       head found in the picture otherwise. */
    function portrait(a, x, y, r, square) {
      var im = spriteArt(a.hero ? "hero" : "foe", a.id, 1), fc = a.b.face;
      ctx.save();
      ctx.beginPath();
      if (square) ctx.rect(x - r, y - r, r * 2, r * 2); else ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = mix(a.b.color, "#07060c", 0.6); ctx.fillRect(x - r, y - r, r * 2, r * 2);
      if (im) {
        var W = im.naturalWidth, H = im.naturalHeight, side, cx, cy;
        if (fc) { side = fc[2] * W; cx = fc[0] * W; cy = fc[1] * H; }
        else { var hd = headOf(im); side = W * 0.36; cx = hd.x * W; cy = hd.y * H + side * 0.05; }
        /* the crop may stand past the picture's edge: cut it to the picture
           and move the destination with it, the same on every WebView */
        var k = r * 2 / side, sx = cx - side / 2, sy = cy - side / 2, sw = side, sh = side, dx = x - r, dy = y - r;
        if (sx < 0) { dx -= sx * k; sw += sx; sx = 0; }
        if (sy < 0) { dy -= sy * k; sh += sy; sy = 0; }
        sw = Math.min(sw, W - sx); sh = Math.min(sh, H - sy);
        if (sw > 0 && sh > 0) ctx.drawImage(im, sx, sy, sw, sh, dx, dy, sw * k, sh * k);
      }
      ctx.restore();
    }

    /* --- one figure --------------------------------------------------------- */
    function poseOf(a) {
      if (a.hero) return a.dead ? 6 : a.hurt > 0 ? 5 : a.lunge > 0 ? 2 : a.cast > 0 ? 3 : a.guard ? 4 : 1;
      return a.hurt > 0 ? 3 : a.cast > 0 ? 4 : a.lunge > 0 ? 2 : 1;
    }
    function drawActor(a, depth01) {
      var C = combat, im = spriteArt(a.hero ? "hero" : "foe", a.id, poseOf(a));
      if (a.alpha <= 0.01) return;
      if (!im) {                                     // the stand-in, until the sheet is cut
        if (a.hero) drawHero(ctx, a, a.sx, a.sy - a.s * 0.46, a.s, a.dead ? 0.45 : 1, 0);
        else drawFoe(ctx, a, a.sx, a.sy + a.dy - a.s * 0.42, a.s, a.alpha);
        return;
      }
      var w = im.naturalWidth, h = im.naturalHeight, k = a.s / Math.max(w, h);
      var br = 1 + Math.sin(t * 2 + a.phase) * 0.014, bx = 1 - (br - 1) * 0.6;
      /* the reflection: the figure upside down under its feet, in slices that
         ripple and fade — the stage is water */
      var N = 10, sh = h / N, i;
      ctx.save();
      ctx.translate(a.sx, a.sy + 4);
      ctx.scale(k, -k * 0.75);
      for (i = 0; i < N; i++) {
        var sy = h - (i + 1) * sh;
        ctx.globalAlpha = a.alpha * 0.32 * (1 - i / N);
        ctx.drawImage(im, 0, sy, w, sh, -w / 2 + Math.sin(t * 3 + i * 0.9) * (2 + i * 0.8) / k * 0.6, -h + sy, w, sh + 1);
      }
      ctx.restore();
      drawParts(a, false);
      /* the aura behind: the yokai's flames, the ritual circle of the turn */
      if (!a.hero && !a.dead) {
        /* as much aura as health: a yokai at the end of its strength burns low */
        var hk = clamp(a.lag / a.mhp, 0, 1), gl = glowOf(im, auraCol(a)), pw = 0.8 * (1 + a.boost) * (0.12 + 0.88 * hk);
        ctx.save();
        ctx.translate(a.sx, a.sy + a.dy); ctx.scale(k * bx / FXK, k * br / FXK);
        ctx.globalCompositeOperation = "lighter";
        for (i = 0; i < 3; i++) {
          var fl = 0.5 + 0.5 * Math.sin(t * (7 + i * 3) + i * 2 + a.phase);
          ctx.save();
          ctx.globalAlpha = a.alpha * Math.min(1, pw * (0.35 + 0.2 * fl));
          ctx.transform(1, 0, Math.sin(t * 2.3 + i) * 0.06, 1, 0, 0);
          ctx.scale(1 + 0.04 * i * hk, 1.02 + (0.04 + (0.07 + 0.05 * fl) * i) * hk);
          ctx.drawImage(gl, -gl.width / 2, -gl.height + gl.pad);
          ctx.restore();
        }
        ctx.restore();
      }
      if (a.hero && !a.dead && C.phase === "input" && C.actor === a) drawRing(a, auraCol(a));
      /* the figure, breathing, then the light laid over it: the band's shade
         (deeper with distance, and on the heroes waiting), the rim, a flash */
      ctx.save();
      ctx.globalAlpha = a.alpha;
      ctx.translate(a.sx, a.sy + a.dy);
      ctx.scale(k * bx, k * br);
      ctx.drawImage(im, -w / 2, -h);
      ctx.scale(1 / FXK, 1 / FXK);
      var X = -w * FXK / 2, Y = -h * FXK;
      var dim = 0.1 + 0.4 * depth01 * (a.hero ? 1 : 0.5) + (a.hero && C.phase === "input" && C.actor !== a ? 0.25 : 0) + (a.dead ? 0.45 : 0);
      ctx.globalAlpha = a.alpha * Math.min(0.85, dim);
      ctx.drawImage(silOf(im, mix(band().tint, "#05040a", 0.55)), X, Y);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = a.alpha * 0.6;
      ctx.drawImage(rimOf(im, "#ff8fa0"), X, Y);
      ctx.globalCompositeOperation = "source-over";
      if (a.flash > 0) { ctx.globalAlpha = a.alpha * a.flash * 0.7; ctx.drawImage(silOf(im, "#ffffff"), X, Y); }
      ctx.restore();
      drawParts(a, true);
    }
    /* The ritual circle on the ground under the hero whose turn it is. */
    function drawRing(a, col) {
      var r = 0.7, rot = t * 0.7, Nn = 40, i, p, p2;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = col; ctx.lineCap = "round";
      function ring(rad, lw) {
        ctx.lineWidth = lw * a.k; ctx.beginPath();
        for (var j = 0; j <= Nn; j++) { var q = j / Nn * Math.PI * 2, pp = proj(a.wx + Math.cos(q) * rad, a.wz + Math.sin(q) * rad); if (j) ctx.lineTo(pp.x, pp.y); else ctx.moveTo(pp.x, pp.y); }
        ctx.stroke();
      }
      ring(r, 4); ring(r * 0.82, 2);
      ctx.lineWidth = 3 * a.k;
      for (i = 0; i < 12; i++) {
        var q = rot + i / 12 * Math.PI * 2;
        p = proj(a.wx + Math.cos(q) * r * 0.82, a.wz + Math.sin(q) * r * 0.82); p2 = proj(a.wx + Math.cos(q) * r, a.wz + Math.sin(q) * r);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      p = proj(a.wx, a.wz);
      var gw = r * STAGE.unit * 2.4 * p.s;
      ctx.globalAlpha = 0.4;
      ctx.drawImage(dotCv(), p.x - gw / 2, p.y - gw * 0.2, gw, gw * 0.4);
      ctx.restore();
    }
    /* The embers: the yokai's flames rising, the exorcism's light. */
    function spawnEmbers(a, dt) {
      if (a.hero || a.dead || a.sx == null) return;
      var cx = a.sx, cy = a.sy + a.dy - a.s * 0.45, rx = a.s * 0.26, ry = a.s * 0.42;
      a.acc += dt * 26 * 0.8 * (1 + a.boost) * (0.1 + 0.9 * clamp(a.lag / a.mhp, 0, 1));
      while (a.acc > 1) {
        a.acc--;
        var q = Math.random() * Math.PI * 2;
        a.parts.push({ front: Math.random() < 0.5, x: cx + Math.cos(q) * rx * Rand.range(0.4, 1), y: cy + Math.sin(q) * ry * Rand.range(0.3, 1),
          vx: Rand.range(-14, 14), vy: Rand.range(-150, -60), life: Rand.range(0.5, 1.1), t: 0, size: Rand.range(5, 12) * Math.sqrt(a.k), col: auraCol(a) });
      }
    }
    function drawParts(a, front) {
      var l = a.parts, i, p, q, s;
      if (!l.length) return;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (i = 0; i < l.length; i++) {
        p = l[i];
        if (p.front !== front) continue;
        q = p.t / p.life; s = p.size * (1 - q * 0.5);
        ctx.globalAlpha = (1 - q) * Math.max(0.3, a.alpha);
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, s * 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha *= 0.6;
        ctx.drawImage(dotCv(), p.x - s, p.y - s, s * 2, s * 2);
      }
      ctx.restore();
    }
    /* Mist pooled on the floor, drifting. */
    function drawFloor() {
      for (var i = 0; i < 4; i++) {
        var p = proj(Math.sin(t * 0.12 + i * 1.7) * 1.2, Math.cos(t * 0.09 + i) * 0.6);
        var rx = (2.6 + i * 0.4) * STAGE.unit * p.s, ry = rx * 0.225;
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, ry / rx);
        var gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, "rgba(200,190,230,.10)"); gr.addColorStop(1, "rgba(200,190,230,0)");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    /* Under every hero the yokai's next turn will hit: a skull on the
       ground at their feet and the blow it will land (KO when it kills). */
    function drawThreats() {
      var pul = 0.5 + 0.5 * Math.sin(t * 6), inc = incoming(), i, h;
      for (i = 0; i < inc.length; i++) {
        h = inc[i].h;
        if (h.dead || h.sx == null) continue;
        var lethal = inc[i].dmg >= h.hp, label = (lethal ? "KO" : "-" + inc[i].dmg) + (inc[i].maybe ? "?" : "");
        ctx.font = font(22, 900);
        var w = ctx.measureText(label).width + 52, x0 = h.sx - w / 2, y = h.sy + 22;
        ctx.fillStyle = lethal ? rgba("#e2364b", 0.85) : "rgba(24,4,12,.78)"; roundRect(ctx, x0, y - 16, w, 32, 16); ctx.fill();
        ctx.strokeStyle = rgba("#ff5d73", 0.45 + 0.5 * pul); ctx.lineWidth = 2.5; ctx.stroke();
        Icon.draw(ctx, "icoSkull", x0 + 20, y, 24, lethal ? "#ffffff" : "#ff5d73");
        text(label, x0 + 36 + (w - 44) / 2, y + 1, 22, lethal ? "#ffffff" : "#ff8a9a");
      }
    }
    /* The yokai as a target: a gold ring at its feet while a scroll aimed at
       it is chosen, full while one is dragged over it. */
    function drawFoeAim() {
      var C = combat, f = C.foe, info = C.phase === "input" && C.sel ? scrollOf(C.sel) : null;
      if (!info || (info.on !== "foe" && info.on !== "any") || f.dead || f.sx == null) return;
      var on = C.dropOn && C.dropOn.foe, pul = 0.5 + 0.5 * Math.sin(t * 7);
      ctx.save();
      ctx.strokeStyle = rgba("#ffd166", on ? 1 : 0.45 + 0.45 * pul); ctx.lineWidth = on ? 6 : 4;
      ctx.beginPath(); ctx.ellipse(f.sx, f.sy + 6, f.s * 0.32, f.s * 0.08, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    /* --- the fight, one frame ------------------------------------------------ */
    function drawFight() {
      var C = combat, us = party.concat([C.foe]), i, a, zmin = 1e9, zmax = -1e9, hk = hudIn();
      ctx.save();
      applyCamera(ctx);
      ctx.globalAlpha = hk;
      drawFloor();
      ctx.globalAlpha = 1;
      drawFoeAim();
      for (i = 0; i < us.length; i++) { zmin = Math.min(zmin, us[i].wz); zmax = Math.max(zmax, us[i].wz); }
      us.sort(function (p, q) { return q.wz - p.wz; });
      for (i = 0; i < us.length; i++) {
        a = us[i];
        drawActor(a, zmax > zmin ? (a.wz - zmin) / (zmax - zmin) : 0);
      }
      ctx.globalAlpha = hk;
      drawThreats();
      ctx.globalAlpha = 1;
      /* the spells, over everyone */
      for (i = 0; i < fxs.length; i++) {
        var e = fxs[i], q = e.t / e.d, im = artImg(e.key);
        if (!im || e.a.sx == null) continue;
        drawFit(ctx, im, e.a.sx, e.a.sy + e.a.dy - e.a.s * 0.45, e.a.s * e.s * (0.7 + 0.4 * Math.min(1, q * 2.5)), q < 0.6 ? 1 : 1 - (q - 0.6) / 0.4);
      }
      ctx.restore();

      var vg = ctx.createRadialGradient(view.w / 2, view.h / 2, view.h * 0.3, view.w / 2, view.h / 2, view.h * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0," + (0.3 * hk) + ")");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, view.w, view.h);
      if (cam.lb > 0.01) {
        var lb = 130 * cam.lb;
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, view.w, lb); ctx.fillRect(0, view.h - lb, view.w, lb);
      }

      /* the HUD settles in last: the top rows drop from above, the tiles
         rise from below */
      var y = G.top - 40 * (1 - hk), hudA = (1 - cam.lb * 0.75) * hk;
      ctx.save(); ctx.globalAlpha = hudA * C.foe.alpha;
      drawTurnOrder(y);
      drawFoeHud(y + ROW_H + 16);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = hudA * (C.leave >= 0 ? Math.max(0, 1 - C.leave / 0.45) : 1);
      ctx.translate(0, 40 * (1 - hk));
      drawHeroTiles();
      ctx.restore();
    }

    /* --- the HUD ------------------------------------------------------------- */
    function text(str, x, y, size, col, align, stroke, weight) {
      ctx.font = font(size, weight || 900); ctx.textAlign = align || "center"; ctx.textBaseline = "middle";
      if (stroke) { ctx.lineJoin = "round"; ctx.lineWidth = stroke; ctx.strokeStyle = "rgba(6,4,10,.9)"; ctx.strokeText(str, x, y); }
      ctx.fillStyle = col; ctx.fillText(str, x, y);
    }
    function nextFoe() {
      var l = combat.TL;
      for (var i = 0; i < l.length; i++) if (l[i].it) return l[i];
      return null;
    }
    function incoming() { var e = nextFoe(); return e && !hiddenIntents() ? e.hits : []; }
    function incomingOf(h) { var l = incoming(); for (var i = 0; i < l.length; i++) if (l[i].h === h) return l[i]; return null; }
    function topDmg(e) { var m = 0; for (var i = 0; i < e.hits.length; i++) m = Math.max(m, e.hits[i].dmg); return m; }

    /* THE TIMELINE ROW: the next SHOW turns, portraits only — what a turn
       holds is in the card a tap on it opens. A turn keeps its x by its key
       (unit and turn number), so a preview, a push or a one more SLIDES it
       along. The yokai's turns burn in a violet aura: that is the evil
       coming. */
    var slotX = {};
    function drawTurnOrder(y) {
      var C = combat, seen = {}, i, key;
      var me = C.phase === "input" ? C.actor : null, x0 = Layout.left, yy = y + 2 + ROW_H / 2;
      C.slots = [];
      ctx.fillStyle = "rgba(6,4,12,.55)"; roundRect(ctx, x0 - 10, y + 2, Layout.w + 20, ROW_H, 18); ctx.fill();
      for (i = 0; i < C.TL.length; i++) {
        var e = C.TL[i], r = i ? 26 : 32, tx = x0 + 36 + (i ? 92 + (i - 1) * 86 : 0), a = e.u;
        var x = slotX.hasOwnProperty(e.key) ? slotX[e.key] : tx + 90;
        x += (tx - x) * Math.min(1, frameDt * 12);
        slotX[e.key] = x; seen[e.key] = true;
        if (!a.hero) drawEvil(x, yy, r, i);
        if (C.hover && me && a === me && !e.now) {
          ctx.strokeStyle = rgba("#ffd166", 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(t * 8))); ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(x, yy, r + 9, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = "rgba(6,4,12,.85)"; ctx.beginPath(); ctx.arc(x, yy, r + 4, 0, Math.PI * 2); ctx.fill();
        portrait(a, x, yy, r, false);
        ctx.strokeStyle = a.hero ? a.b.color : "#b07cff"; ctx.lineWidth = i ? 2.5 : 4;
        if (a.away) ctx.setLineDash([6, 5]);         // that turn is the arrival of a hero from next door
        ctx.beginPath(); ctx.arc(x, yy, r + 2, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        C.slots.push({ x: x, y: yy, r: r + 10, e: e });
      }
      for (key in slotX) if (slotX.hasOwnProperty(key) && !seen[key]) delete slotX[key];
    }
    /* The aura of evil round a yokai's turn: a violet glow breathing under
       the portrait and wisps rising off its rim, like its own flames. */
    function drawEvil(x, y, r, k) {
      var pul = 0.5 + 0.5 * Math.sin(t * 3 + k * 0.9), j;
      ctx.save();
      var a0 = ctx.globalAlpha;            // the HUD's own fade: the wisps ride on it
      ctx.globalCompositeOperation = "lighter";
      var gr = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * (1.85 + 0.25 * pul));
      gr.addColorStop(0, "rgba(170,80,255,1)"); gr.addColorStop(0.35, "rgba(130,40,240,.6)"); gr.addColorStop(1, "rgba(80,10,170,0)");
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(x, y, r * 2.15, 0, Math.PI * 2); ctx.fill();
      for (j = 0; j < 9; j++) {
        var q = (t * 0.7 + j / 9 + k * 0.13) % 1, an = -Math.PI / 2 + (j / 9 - 0.5) * Math.PI * 1.7 + Math.sin(t * 1.3 + j) * 0.25;
        var wx = x + Math.cos(an) * r * 1.0, wy = y + Math.sin(an) * r * 1.0 - q * r * 1.1, wr = r * 0.26 * (1 - q * 0.7);
        ctx.globalAlpha = a0 * (1 - q) * 0.9;
        var wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr);
        wg.addColorStop(0, "rgba(220,180,255,1)"); wg.addColorStop(0.5, "rgba(160,80,255,.8)"); wg.addColorStop(1, "rgba(120,40,230,0)");
        ctx.fillStyle = wg;
        ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    /* THE BOSS BAR: the yokai's name, a thin health bar in quarters, and
       riding on it a badge for every element the party has FOUND it weak
       to (lit) or resisting (struck out). The rule's own count stands on
       the name's line. A tap on it, on the yokai or on one of its turns
       opens its card: the rule, the turns coming, the weaknesses. */
    var FOE_H = 74;
    function drawFoeHud(topY) {
      var C = combat, f = C.foe, x = Layout.left, w = Layout.w, name = upper(Lang.t(f.b.name)), el, i;
      var gr = ctx.createLinearGradient(0, topY - 8, 0, topY + FOE_H + 10);
      gr.addColorStop(0, "rgba(6,4,12,.8)"); gr.addColorStop(1, "rgba(6,4,12,0)");
      ctx.fillStyle = gr; ctx.fillRect(0, topY - 8, view.w, FOE_H + 18);
      text(name, x, topY + 16, 30, "#f4eef8", "left", 5);
      ctx.font = font(30, 900);
      var nw = ctx.measureText(name).width, R = RULES[f.id], st = R && R.status ? R.status(f) : "";
      if (f.boss) text(upper(Lang.t("Master")), x + nw + 12, topY + 18, 18, "#ffd166", "left", 4);
      if (st) {
        st = upper(st);
        ctx.font = font(20, 900);
        var sw = ctx.measureText(st).width + 22;
        ctx.fillStyle = "rgba(233,196,106,.18)"; roundRect(ctx, x + w - sw, topY - 2, sw, 30, 15); ctx.fill();
        ctx.strokeStyle = "rgba(233,196,106,.8)"; ctx.lineWidth = 2; ctx.stroke();
        text(st, x + w - sw / 2, topY + 14, 20, "#ffd166");
      }
      var by = topY + 46, bh = 10;
      ctx.fillStyle = "rgba(0,0,0,.6)"; roundRect(ctx, x - 3, by - 3, w + 6, bh + 6, (bh + 6) / 2); ctx.fill();
      drawBar(x, by, w, bh, f.hp / f.mhp, "#e2364b", f.lag / f.mhp);
      ctx.fillStyle = "rgba(6,4,12,.8)";
      for (i = 1; i < 4; i++) ctx.fillRect(x + w * i / 4 - 1.5, by, 3, bh);
      var badges = [];
      for (el in f.known) if (f.known.hasOwnProperty(el) && f.known[el] !== "normal") badges.push({ el: el, weak: f.known[el] === "weak" });
      badges.sort(function (p, q) { return (q.weak ? 1 : 0) - (p.weak ? 1 : 0); });
      for (i = 0; i < badges.length; i++) elementBadge(badges[i].el, badges[i].weak, x + w - 24 - i * 50, by + bh / 2, 20);
      C.foeHud = { x: x, y: topY, w: w, h: FOE_H };
    }
    /* An element's badge: lit in its colour on a weakness, grey and struck
       through on a resistance. */
    function elementBadge(el, weak, x, y, r) {
      var E = ELEMENTS[el], pul = weak ? 0.5 + 0.5 * Math.sin(t * 4) : 0;
      if (weak) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = rgba(E.color, 0.18 + 0.2 * pul);
        ctx.beginPath(); ctx.arc(x, y, r + 7, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = "#0b0712"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = weak ? E.color : "#6c6880"; ctx.lineWidth = 3; ctx.stroke();
      Icon.draw(ctx, E.icon, x, y, r * 1.2, weak ? E.color : "#8a8698");
      if (!weak) {
        ctx.strokeStyle = "#e2364b"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x - r * 0.62, y + r * 0.62); ctx.lineTo(x + r * 0.62, y - r * 0.62); ctx.stroke();
      }
    }

    /* THE HERO TILES: slanted, one per hero, over the scrolls. One tile is
       OPEN — the hero whose turn it is, or the one the player tapped — and
       takes the room the others leave: the name, then a bar and its value
       for the health and for the SP. The others are folded to the portrait
       and the two values, in green and in blue. The yokai's next blow hangs
       over the tile it will land on (KO on red when it kills). */
    var FOLD_W = 120, OPEN_W = 300;
    function openTile() {
      var C = combat;
      if (C.peek && !C.peek.dead) return C.peek;
      if (C.phase === "input" && C.actor && C.actor.hero) return C.actor;
      return C.lastOpen && !C.lastOpen.dead ? C.lastOpen : alive()[0] || party[0];
    }
    function tileWidths() {
      var n = party.length, gap = 10, o = openTile(), out = [];
      var open = Math.min(OPEN_W, Layout.w - (n - 1) * (FOLD_W + gap));
      for (var i = 0; i < n; i++) out.push(n === 1 || party[i] === o ? open : FOLD_W);
      return out;
    }
    function tilesTop() { return (uiTop || (G || fightGeo()).barTop) - 12 - TILE_H; }
    function drawHeroTiles() {
      var n = party.length, gap = 10, C = combat, i, tot = -gap, sk = 0.18, aimP = aimingParty();
      for (i = 0; i < n; i++) tot += party[i].tw + gap;
      var x = view.w / 2 - tot / 2, base = tilesTop();
      C.tiles = [];
      for (i = 0; i < n; i++) {
        var h = party[i], tw = h.tw, turn = C.phase === "input" && C.actor === h, th = TILE_H, y = base - (turn ? 8 : 0);
        var openK = clamp((tw - FOLD_W) / Math.max(1, OPEN_W - FOLD_W), 0, 1), ok = aimP && !h.away && fits(scrollOf(C.sel), { hero: h });
        ctx.save();                        // a hero still on the way from next door: a ghost of a tile
        if (h.away) ctx.globalAlpha *= 0.4;
        ctx.save();
        ctx.translate(x, y); ctx.transform(1, 0, -sk, 1, th * sk, 0);
        ctx.fillStyle = turn ? mix(h.b.color, "#0b0610", 0.55) : "rgba(10,6,16,.86)"; ctx.fillRect(0, 0, tw, th);
        ctx.fillStyle = h.dead ? "#4a4458" : h.b.color; ctx.fillRect(0, 0, 6, th);
        if (turn) { ctx.strokeStyle = h.b.color; ctx.lineWidth = 3; ctx.strokeRect(0, 0, tw, th); }
        if (ok) {
          ctx.strokeStyle = rgba("#ffd166", (C.dropOn && C.dropOn.hero === h ? 1 : 0.45 + 0.45 * Math.sin(t * 7))); ctx.lineWidth = 4;
          ctx.strokeRect(-3, -3, tw + 6, th + 6);
        }
        ctx.restore();
        /* the portrait, cut by the tile's own slant, the face in the middle */
        var pw = 64, px = x + th * sk * 0.5 + 6 + pw / 2;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(x + th * sk + 6, y); ctx.lineTo(x + th * sk + 6 + pw, y); ctx.lineTo(x + 6 + pw, y + th); ctx.lineTo(x + 6, y + th); ctx.closePath(); ctx.clip();
        portrait(h, px, y + th / 2, th / 2, true);
        if (h.dead) { ctx.fillStyle = "rgba(6,4,12,.65)"; ctx.fillRect(x, y, pw + 20, th); }
        ctx.restore();
        if (h.dead) Icon.draw(ctx, "icoSkull", px, y + th / 2, 34, "#9a94aa");
        if (h.guard && !h.dead) {
          ctx.fillStyle = "rgba(10,30,48,.9)"; ctx.beginPath(); ctx.arc(px - 22, y + th - 16, 15, 0, Math.PI * 2); ctx.fill();
          Icon.draw(ctx, "icoShield", px - 22, y + th - 16, 20, "#8fdcff");
        }
        /* what allies laid on this hero: an element and an edge for the
           next blow, a body in front of them (in the coverer's colour) */
        if (!h.dead) {
          var marks = [];
          if (h.imbue) marks.push({ ico: ELEMENTS[h.imbue].icon, c: ELEMENTS[h.imbue].color });
          if (h.whet) marks.push({ ico: "icoFight", c: "#ffd166" });
          if (h.cover && !h.cover.dead) marks.push({ ico: "icoShield", c: h.cover.b.color });
          for (var mk = 0; mk < marks.length; mk++) {
            var mx = px - 20 + mk * 30, my = y + 15;
            ctx.fillStyle = "rgba(8,5,14,.92)"; ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = marks[mk].c; ctx.lineWidth = 2; ctx.stroke();
            Icon.draw(ctx, marks[mk].ico, mx, my, 18, marks[mk].c);
          }
        }
        var tx = px + pw / 2 + 8, hpCol = h.dead ? "#6c6880" : h.hp / h.mhp < 0.3 ? "#ff5d73" : "#7ee0a1", spCol = h.dead ? "#6c6880" : "#8fdcff";
        if (openK > 0.6) {
          /* open: the name, then <bar> <value> twice */
          ctx.save(); ctx.globalAlpha *= (openK - 0.6) / 0.4;
          var right = x + tw - 4, vw = 46;
          text(upper(h.b.name), tx, y + 17, 20, h.dead ? "#6c6880" : turn ? "#fff4f0" : h.b.color, "left");
          drawBar(tx - 3, y + 36, right - vw - tx - 6, 10, h.hp / h.mhp, hpCol === "#6c6880" ? "#4a4458" : hpCol, h.lag / h.mhp);
          text("" + h.hp, right, y + 41, 20, hpCol, "right");
          drawBar(tx - 7, y + 58, right - vw - tx - 6, 8, h.sp / h.msp, "#8fdcff");
          text("" + h.sp, right - 4, y + 62, 20, spCol, "right");
          ctx.restore();
        } else {
          /* folded: the two values alone */
          ctx.save(); ctx.globalAlpha *= 1 - openK / 0.6;
          text("" + h.hp, tx - 2, y + 25, 20, hpCol, "left");
          text("" + h.sp, tx - 6, y + 52, 20, spCol, "left");
          ctx.restore();
        }
        var inc = h.dead ? null : incomingOf(h);
        if (inc) {
          var lethal = inc.dmg >= h.hp, label = (lethal ? "KO" : "-" + inc.dmg) + (inc.maybe ? "?" : "");
          ctx.font = font(20, 900);
          var lw = ctx.measureText(label).width + 16, lx = x + tw - lw + 4, ly = y - 18;   // hung over the tile's top edge
          ctx.fillStyle = lethal ? "#e2364b" : "#4a0c18"; roundRect(ctx, lx, ly, lw, 26, 8); ctx.fill();
          ctx.strokeStyle = "#e2364b"; ctx.lineWidth = 2; ctx.stroke();
          text(label, lx + lw / 2, ly + 14, 20, lethal ? "#fff4f0" : "#ff8a9a");
        }
        ctx.restore();
        if (!h.away) C.tiles.push({ x: x, y: y, w: tw + th * sk, h: th, hero: h });
        x += tw + gap;
      }
    }
    function aimingParty() {
      var C = combat, info = C.phase === "input" && C.sel ? scrollOf(C.sel) : null;
      return !!(info && info.on !== "foe");
    }

    /* --- a tap on the fight ------------------------------------------------
       With a scroll chosen, a tap is its aim. Without one, it asks: a turn
       of the timeline, the boss bar or the yokai itself opens the yokai's
       card, a hero's turn their own; a folded tile opens, an open one shows
       its hero's card. */
    function fightTap(p) {
      var C = combat, i, s, tg;
      if (card || C.phase === "done" || C.age < INTRO.hud) return;   // nothing to tap before the HUD is in
      if (C.phase === "input" && C.sel) { aimScroll(targetAt(p), false); return; }
      for (i = 0; i < (C.slots || []).length; i++) {
        s = C.slots[i];
        if ((p.x - s.x) * (p.x - s.x) + (p.y - s.y) * (p.y - s.y) > s.r * s.r) continue;
        if (s.e.u.hero) heroCard(s.e.u); else foeCard(s.e);
        return;
      }
      var hb = C.foeHud;
      if (hb && p.x >= hb.x && p.x <= hb.x + hb.w && p.y >= hb.y && p.y <= hb.y + hb.h) { foeCard(nextFoe()); return; }
      tg = targetAt(p);
      if (!tg) return;
      if (tg.foe) { foeCard(nextFoe()); return; }
      if (tg.tile && tg.hero === openTile()) { heroCard(tg.hero); return; }
      C.peek = tg.hero;
      Sound.ui("tap");
    }
    /* What is under a point of the frame: a hero's tile, the yokai, a hero. */
    function targetAt(p) {
      var C = combat, i, l = C.tiles || [];
      for (i = 0; i < l.length; i++) if (p.x >= l[i].x && p.x <= l[i].x + l[i].w && p.y >= l[i].y - 10 && p.y <= l[i].y + l[i].h) return { hero: l[i].hero, tile: true };
      var hs = alive().slice().sort(function (a, b) { return a.wz - b.wz; });
      for (i = 0; i < hs.length; i++) if (hitActor(hs[i], p, 0.2)) return { hero: hs[i] };
      if (!C.foe.dead && hitActor(C.foe, p, 0.3)) return { foe: true };
      return null;
    }
    function hitActor(a, p, half) {
      if (a.sx == null) return false;
      var top = toScreen(a.sx, a.sy + a.dy - a.s * 0.88), foot = toScreen(a.sx, a.sy + a.dy), hw = a.s * half * camZoom();
      return p.x > foot.x - hw && p.x < foot.x + hw && p.y > top.y && p.y < foot.y + 20;
    }

    /* --- the cards of a fight: what the HUD no longer writes ---------------
       The yokai's card is its health, what it is weak to, its rule and its
       turns to come, the one tapped first and explained; the hero's card is
       their numbers, their next turn, the blow coming at them and what each
       of their scrolls does. */
    function whenWord(at) {
      return at === 0 ? Lang.t("Now") : at === 1 ? Lang.t("Next turn") : Lang.t("In") + " " + at + " " + Lang.t("turns");
    }
    /* what an intent does, in words, out of what it carries */
    function intentText(it) {
      if (hiddenIntents()) return Lang.t("Its face hides what it will do: a spirit blow reveals it");
      if (it.alt) return Lang.t("Red hits one hero hard, blue drains the whole party: answer neither");
      if (it.kind === "leave") return Lang.t("If nobody hits it before this turn, it walks away");
      if (!it.pow && !it.flat) return Lang.t(PASS[it.kind] || "No blow this turn");
      var l = [Lang.t(it.all ? "A blow on the whole party" : it.prev ? "A blow on the hero who acted just before it" : it.special ? "A heavy blow on one hero" : "A blow on one hero")];
      if (it.drain) l.push(Lang.t("it heals by half the damage"));
      if (it.feast) l.push(Lang.t("it heals by all the damage"));
      if (it.fear) l.push(Lang.t("its target is pushed back on the timeline"));
      if (it.gale) l.push(Lang.t("every hero not on guard is pushed back"));
      if (it.cocoon) l.push(Lang.t("its target is wrapped in silk, far back on the timeline"));
      if (it.pierce) l.push(Lang.t("no guard holds it"));
      return l.join(", ");
    }
    function hitsWord(e) {
      if (hiddenIntents()) return "?";
      var it = e.it, names = [], i;
      if (!it.pow && !it.flat && !it.alt) return "";
      if (it.all) return Lang.t("All") + "  " + topDmg(e);
      for (i = 0; i < e.hits.length; i++) names.push(e.hits[i].h.b.name + " " + e.hits[i].dmg + (e.hits[i].maybe ? "?" : ""));
      return names.join(" · ");
    }
    function dom(tag, cls, txt) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (txt != null) n.textContent = txt;
      return n;
    }
    function kv(label, value, cls) {
      var p = dom("p", "gd-kv" + (cls ? " " + cls : ""));
      p.appendChild(dom("b", null, upper(Lang.t(label)))); p.appendChild(dom("span", null, upper(value)));
      return p;
    }
    function badgeRow(f) {
      var row = dom("div", "gd-els"), k, any = { weak: [], resist: [] };
      for (k in f.known) if (f.known.hasOwnProperty(k) && f.known[k] !== "normal") any[f.known[k]].push(k);
      [["weak", "Weak"], ["resist", "Resists"]].forEach(function (w) {
        var g = dom("p", "gd-el-g gd-el-" + w[0]);
        g.appendChild(dom("b", null, upper(Lang.t(w[1]))));
        if (!any[w[0]].length) g.appendChild(dom("i", "gd-el-q", "?"));
        any[w[0]].forEach(function (e) {
          var c = dom("i", "gd-el"), E = ELEMENTS[e], uri = 'url("' + ASSETS.images[E.icon] + '")';
          c.style.setProperty("--c", E.color);
          c.title = Lang.t(E.name);
          var g2 = dom("span", "gd-el-ico"); g2.style.setProperty("-webkit-mask-image", uri); g2.style.setProperty("mask-image", uri);
          c.appendChild(g2); c.appendChild(dom("span", null, upper(Lang.t(E.name))));
          g.appendChild(c);
        });
        row.appendChild(g);
      });
      return row;
    }
    function foeCard(focus) {
      var C = combat, f = C.foe, R = RULES[f.id];
      Sound.ui("tap");
      openCard({
        eyebrow: f.boss ? "Master of the place" : band().name, title: f.b.name, tap: "Tap to close", cls: "gd-info",
        onVeil: function () { closeCard(); },
        build: function (body) {
          var hp = dom("p", "gd-hp"), bar0 = dom("i", "gd-hp-bar"), fill = dom("i");
          fill.style.width = Math.round(100 * f.hp / f.mhp) + "%";
          bar0.appendChild(fill);
          hp.appendChild(dom("b", null, upper(Lang.t("Health")))); hp.appendChild(bar0); hp.appendChild(dom("span", null, f.hp + " / " + f.mhp));
          body.appendChild(hp);
          body.appendChild(badgeRow(f));
          if (R) {
            var rb = dom("div", "gd-rulebox"), st = R.status ? R.status(f) : "";
            var h = dom("p", "gd-sec"); h.appendChild(dom("b", null, upper(Lang.t("Its rule"))));
            if (st) h.appendChild(dom("i", "gd-pill", upper(st)));
            rb.appendChild(h);
            rb.appendChild(dom("p", "gd-line", Lang.t(R.text)));
            body.appendChild(rb);
          }
          var turns = dom("div", "gd-turns"), shown = 0;
          turns.appendChild(dom("p", "gd-sec", upper(Lang.t("Its next turns"))));
          for (var i = 0; i < C.TL.length && shown < 3; i++) {
            var e = C.TL[i];
            if (!e.it) continue;
            shown++;
            var on = focus ? e === focus : shown === 1, row = dom("div", "gd-turn" + (on ? " on" : "") + (e.it.special ? " sp" : ""));
            row.appendChild(dom("b", "gd-when", upper(whenWord(i))));
            row.appendChild(dom("span", "gd-what", upper(hiddenIntents() ? "?" : Lang.t(e.it.label) + (e.it.tag && e.it.pow ? " " + e.it.tag : ""))));
            row.appendChild(dom("span", "gd-dmg", upper(hitsWord(e))));
            if (on) row.appendChild(dom("p", "gd-line", intentText(e.it)));
            turns.appendChild(row);
          }
          body.appendChild(turns);
          body.appendChild(dom("p", "gd-note", Lang.t("Its blows are exact: a guard halves them, a ward takes 40% off")));
        }
      });
    }
    function heroCard(h) {
      var C = combat, at = -1, i;
      for (i = 0; i < C.TL.length; i++) if (C.TL[i].u === h) { at = i; break; }
      Sound.ui("tap");
      openCard({
        eyebrow: h.b.role, title: h.b.name, tap: "Tap to close", cls: "gd-info",
        onVeil: function () { closeCard(); },
        build: function (body) {
          [["Health", h.hp, h.mhp, "h-hp"], ["SP", h.sp, h.msp, "h-sp"]].forEach(function (r) {
            var p = dom("p", "gd-hp gd-" + r[3]), b0 = dom("i", "gd-hp-bar"), fill = dom("i");
            fill.style.width = Math.round(100 * r[1] / r[2]) + "%";
            b0.appendChild(fill);
            p.appendChild(dom("b", null, upper(Lang.t(r[0])))); p.appendChild(b0); p.appendChild(dom("span", null, r[1] + " / " + r[2]));
            body.appendChild(p);
          });
          var inc = h.dead ? null : incomingOf(h);
          if (h.dead) body.appendChild(dom("p", "gd-line", Lang.t("Down: an ofuda of return raises them")));
          else if (at >= 0) body.appendChild(kv("Turn", whenWord(at)));
          if (inc) body.appendChild(kv("The yokai's next blow", inc.dmg >= h.hp ? "KO" : "-" + inc.dmg, "gd-threat"));
          var list = dom("div", "gd-sk");
          ["attack", h.b.skills[0], h.b.skills[1], "guard"].forEach(function (id) {
            var s = SKILLS[id], row = dom("div", "gd-sk-row"), ico = dom("i", "gd-sk-ico"), uri = 'url("' + ASSETS.images[s.icon] + '")';
            ico.style.setProperty("--ink", s.el ? ELEMENTS[s.el].color : "#f4eef8");
            ico.style.setProperty("-webkit-mask-image", uri); ico.style.setProperty("mask-image", uri);
            var tx = dom("div", "gd-sk-t"), hd = dom("p");
            hd.appendChild(dom("b", null, upper(Lang.t(s.name))));
            var bits = [];
            if (s.sp) bits.push(s.sp + " SP");
            if (s.el) bits.push(Lang.t(ELEMENTS[s.el].name));
            if (weightWord(s.w)) bits.push(weightWord(s.w));
            if (bits.length) hd.appendChild(dom("i", null, upper(bits.join(" · "))));
            tx.appendChild(hd); tx.appendChild(face("On the yokai", s.foeText)); tx.appendChild(face("On an ally", s.allyText));
            row.appendChild(ico); row.appendChild(tx);
            list.appendChild(row);
          });
          body.appendChild(list);
        }
      });
    }

    /* --- the fight's clock ---------------------------------------------------- */
    var frameDt = 0;
    function updateFight(dt) {
      var C = combat, us = party.concat([C.foe]), i, a, j, p;
      frameDt = dt;
      C.age += dt;
      if (C.leave >= 0) C.leave += dt;
      G = fightGeo();
      for (i = 0; i < us.length; i++) {
        a = us[i];
        a.hx += (a.tx - a.hx) * Math.min(1, dt * 5); a.hz += (a.tz - a.hz) * Math.min(1, dt * 5);
        a.dash += (a.dashGo - a.dash) * Math.min(1, dt * 12);
        a.kx *= Math.pow(0.0004, dt); a.kz *= Math.pow(0.0004, dt);
        a.lunge = Math.max(0, a.lunge - dt); a.hurt = Math.max(0, a.hurt - dt); a.cast = Math.max(0, a.cast - dt);
        a.flash = Math.max(0, a.flash - dt * 5); a.boost = Math.max(0, a.boost - dt * 0.8);
        a.lag += (a.hp - a.lag) * Math.min(1, dt * (a.lag > a.hp ? 1.6 : 8));
        place(a, C);
        spawnEmbers(a, dt);
        for (j = a.parts.length - 1; j >= 0; j--) {
          p = a.parts[j]; p.t += dt;
          if (p.t >= p.life) { a.parts.splice(j, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt;
        }
      }
      if (C.foe.dead) C.foe.fade = Math.max(0, C.foe.fade - dt * 0.8);
      var tws = tileWidths();
      for (i = 0; i < party.length; i++) party[i].tw += (tws[i] - party[i].tw) * Math.min(1, dt * 12);
      updateCamera(dt);
      C.TL = timeline(C.hover ? (C.hover === "rule" ? 1 : SKILLS[C.hover].w) : null);
    }

    /* ======================================================================
       THE MOTOR'S CONTRACT
       ====================================================================== */
    function reset() {
      closeCard(true); hideBar(true); bareScene(false);
      if (!CONFIG.level) applyLevel(null);  // a playable, the endless run, a free round: the game as it ships
      metFresh = false; fell = false; goldEarned = 0; escaped = false; bossDown = false;
      score = 0; gold = 0; foesDown = 0; rooms = 0; plv = Math.max(1, Math.round(P.partyLevel)); xp = 0;
      combat = null; walk = null; jobs = []; started = false; ended = false; t = 0;
      party = null; roster = []; groups = []; gi = 0; aim = null; held = false; lampHit = null; peekG = null; peekT = 0;
      feats = featsOf(stage); dark = false; keys = 0;
      candles = candles0 = Math.round(P.candles * P.cols * P.rows);
      best = Store.get("bestScore", 0);
      fxs = []; blow = 0; blowTo = 0; uiTop = 0; slotX = {}; G = null;
      /* The band's own scene behind the round and the end screen, and its
         window of the track; level 0 (a playable, a free round) keeps the
         game's own scene and the whole bed. */
      Art.backdrop(CONFIG.level ? band().scene : Art.sceneKey());
      Music.play(CONFIG.level ? band().music : null);
      generate();
      computeGeo();
      HUD.setScoreNow(0);
      HUD.setLeft(0, CONFIG.copy.goldLabel);
      HUD.setRight(0, CONFIG.copy.foesLabel);
      Fx.reset();
    }

    function update(dt) {
      t += dt;
      if (!started) { started = true; openParty(); }
      if (combat && card) return;          // a card over a fight holds it, whoever's turn it is
      var k, j;
      for (k = 0; k < cells.length; k++) if (cells[k].pop > 0) cells[k].pop = Math.max(0, cells[k].pop - dt);
      for (k = jobs.length - 1; k >= 0; k--) {
        j = jobs[k]; j.t -= dt;
        if (j.t <= 0) { jobs.splice(k, 1); j.fn(); }
      }
      if (ended) return;
      if (peekT > 0) peekT = Math.max(0, peekT - dt);
      if (walk) {
        walk.t += dt;
        if (walk.t >= walk.d) stepDone();
      }
      for (k = 0; k < roamers.length; k++) roamers[k].mt = Math.min(1, roamers[k].mt + dt / 0.32);
      for (k = fxs.length - 1; k >= 0; k--) { fxs[k].t += dt; if (fxs[k].t >= fxs[k].d) fxs.splice(k, 1); }
      if (blow !== blowTo) blow = blowTo > blow ? Math.min(blowTo, blow + dt / BLOW) : Math.max(blowTo, blow - dt / BLOW);
      if (combat) updateFight(dt);
    }

    function render() {
      drawGround();
      drawMap();
      if (combat) { G = G || fightGeo(); drawFight(); }
    }

    function onDown(p) {
      if (combat && !ended) { fightTap(p); return; }
      if (ended || card || walk || held || !party || !groups.length || blow > 0) return;
      var g = groups[gi], plan;
      /* the lantern's chip: split the party, or walk one group to the other */
      if (lampHit && Math.abs(p.x - lampHit.x) <= lampHit.w / 2 + 8 && Math.abs(p.y - lampHit.y) <= lampHit.h / 2 + 8) {
        if (canSplit()) { split(); return; }
        var o = otherGroup(g);
        if (!o) return;
        plan = pathFor(g, o.at);
        if (!plan) { refused(g, cells[o.at]); return; }
        if (aim && aim.to === o.at) goTo(g, plan); else propose(g, o.at, plan);
        return;
      }
      var c = cellAt(p);
      if (!c) { aim = null; return; }
      var there = groupIn(c.i, g);
      if (there && !(aim && aim.to === c.i)) { lead(there); aim = null; showBubble(there); Sound.ui("tap"); return; }
      if (c.state === HIDDEN) {
        Notify.say("Too dark to reach", { sub: Lang.t("Open a lit room next to it"), kind: "info", key: "reach" });
        return;
      }
      if (c.i === g.at) { aim = null; showBubble(g); Sound.ui("tap"); return; }
      plan = pathFor(g, c.i);
      if (!plan) { aim = null; refused(g, c); return; }
      /* a room next door is walked to at once; a far one shows its way and
         its price in candles first, and a second tap walks it */
      if (plan.path.length === 1 || (aim && aim.to === c.i)) goTo(g, plan);
      else propose(g, c.i, plan);
    }
    function propose(g, to, plan) {
      aim = { to: to, from: g.at, path: plan.path, cost: plan.path.length * burnOf(g) };
      Sound.ui("tap");
    }

    function onResize() {
      if (!cells) return;                  // the motor calls this before the first reset
      computeGeo();
      placeBar();
      placeTip();
    }

    function finish(how) {
      if (ended) return;
      ended = true;
      closeCard(true); hideBar(true); bareScene(false);
      combat = null;
      Music.unduck();
      var st = foesDown >= fightsTotal ? 3 : foesDown >= Math.ceil(fightsTotal * 0.6) ? 2 : foesDown > 0 ? 1 : 0;
      best = Math.max(best, score);
      Store.set("bestScore", best);
      endRound({
        title: how === "wiped" ? CONFIG.copy.gameOver : how === "lifted" ? CONFIG.copy.lifted : how === "escaped" ? CONFIG.copy.escaped : CONFIG.copy.cleared,
        variant: how !== "wiped" && st === 3 ? "perfect" : "",
        score: score,
        stars: how === "wiped" ? Math.min(st, 1) : st,
        levelScore: levelProgress(),
        rows: [
          { label: "Yokai exorcised", value: foesDown, grade: "accent" },
          { label: "Rooms explored", value: rooms },
          { label: "Gold", value: gold, grade: "gold" },
          { label: "Party level", value: plv }
        ]
      });
    }

    /* The web target's level layer. `applyLevel` hands the climb's `d` before
       the round, and the level itself is CONFIG.level: the stage's map, rooms
       and yokai come from stageOf() and override CONFIG.play. `levelGoal`
       gives the layer each level's own objective and sentence; the measure is
       `levelProgress` (yokai exorcised, or gold earned) and, for the way out
       and the master, `levelTally` counts the stars itself. `levelWon` ends
       the run through the game's own result on the third star, so the end
       screen keeps its stat rows. Ignored by the playable. */
    function applyLevel(d) {
      levelD = d == null ? null : d;
      stage = d != null && CONFIG.level ? stageOf(CONFIG.level) : null;
      var src = stage || P0;
      P.cols = src.cols; P.rows = src.rows; P.fights = src.fights;
      P.shops = src.shops; P.upgrades = src.upgrades; P.events = src.events; P.bonus = src.bonus;
    }
    function levelGoal(n) {
      var S = stageOf(n);
      return { goal: S.obj === "exorcise" || S.obj === "gold" ? S.goal : 1, text: goalLine(S) };
    }
    function levelProgress() { return stage && stage.obj === "gold" ? goldEarned : foesDown || 0; }
    function levelTally() {
      if (!stage || (stage.obj !== "exit" && stage.obj !== "boss")) return null;
      var met = stage.obj === "exit" ? escaped : bossDown;
      if (!met) return 0;
      return 1 + (foesDown - (bossDown ? 1 : 0) >= stage.m ? 1 : 0) + (fell ? 0 : 1);
    }
    function levelWon() { finish("lifted"); }
    /* The objectives card (a tap on the level pill). The score levels keep
       the layer's own bands; the way out and the master are a star each for
       the objective, for m yokai on the way and for no hero fallen. */
    function levelRules(n) {
      var S = stage || stageOf(n);
      if (S.obj !== "exit" && S.obj !== "boss") return null;
      var met = S.obj === "exit" ? escaped : bossDown;
      return [
        { text: goalLine(S), stars: 1, done: met },
        { text: Lang.t("Exorcise <b>{m}</b> yokai on the way").replace("{m}", S.m), stars: 1,
          done: met && foesDown - (bossDown ? 1 : 0) >= S.m },
        { text: Lang.t("No hero falls"), stars: 1, done: met && !fell }
      ];
    }

    /* The way out: walking into it ends the run, wherever the stars stand. */
    function takeExit(cell) {
      escaped = true;
      Pop.show("bonus", { word: "Way out", at: { x: cellX(cell), y: cellY(cell) } });
      Sound.clip("upgrade", 0.6);
      later(0.9, function () { finish("escaped"); });
    }
    /* A torii lit from inside: the gate out of the dungeon. */
    function drawExit(x, y, s, a) {
      var w = s * 0.62, h = s * 0.6, top = y - h * 0.45;
      ctx.save();
      ctx.globalAlpha *= a;
      var gl = ctx.createRadialGradient(x, y + h * 0.1, 2, x, y + h * 0.1, w * 0.6);
      gl.addColorStop(0, "rgba(255,242,196,.95)"); gl.addColorStop(1, "rgba(255,179,71,0)");
      ctx.fillStyle = gl; ctx.fillRect(x - w * 0.6, top, w * 1.2, h);
      ctx.fillStyle = "#c8323a";
      ctx.fillRect(x - w * 0.36, top + h * 0.12, w * 0.09, h * 0.88);
      ctx.fillRect(x + w * 0.27, top + h * 0.12, w * 0.09, h * 0.88);
      ctx.fillRect(x - w * 0.42, top + h * 0.26, w * 0.84, h * 0.07);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.56, top); ctx.quadraticCurveTo(x, top + h * 0.1, x + w * 0.56, top);
      ctx.lineTo(x + w * 0.5, top + h * 0.12); ctx.quadraticCurveTo(x, top + h * 0.2, x - w * 0.5, top + h * 0.12);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    return { reset: reset, update: update, render: render, onDown: onDown, onResize: onResize,
             applyLevel: applyLevel, levelGoal: levelGoal, levelProgress: levelProgress, levelTally: levelTally,
             levelRules: levelRules, levelWon: levelWon };
  })();
