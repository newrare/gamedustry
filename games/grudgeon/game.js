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
    intro: { logo: null, demo: "tap", caption: "" },

    keyboard: true,

    // The centre score is always there; the left slot is the gold, the
    // right one the yokai exorcised.
    hud: { score: true, timer: false },

    /* THE BED. One track, cut on its own seams (docs/MUSIC.md): a calm intro
       to 24 s, then ten-second phrases, each ending on a dip, and a fade from
       165 s. The menu gets the intro, slower and quieter; each band below
       gets a window of the body, climbing with the climb. */
    music: {
      volume: 0.12, fade: 1.6,
      menu: { from: 0, length: 24, rate: 0.85, gain: 0.5 }
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
      { name: "Night school",    tint: "#1d2a52", scene: "backgroundPhone01", music: { from: 25,  length: 30 },
        foes: ["hanako", "teketeke", "jinmenken", "akamanto"] },
      { name: "Hospital",        tint: "#173d36", scene: "backgroundPhone02", music: { from: 55,  length: 39 },
        foes: ["kuchisake", "ubume", "gaki", "nopperabo"] },
      { name: "Shrine forest",   tint: "#3d1a1f", scene: "backgroundPhone03", music: { from: 94,  length: 30 },
        foes: ["kasaobake", "chochin", "jorogumo", "tengu"] },
      { name: "Drowned village", tint: "#132f45", scene: "backgroundPhone04", music: { from: 124, length: 26 },
        foes: ["kappa", "nureonna", "funayurei", "umibozu"] },
      { name: "Gate of Yomi",    tint: "#2e1745", scene: "backgroundPhone05", music: { from: 134, length: 30 },
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
      // music: assets/audio/music/grudgeon.mp3, 25 s → 55 s (the first band's
      // window), mono 64 kbps — the web build ships the whole track instead
      music: "data:audio/mpeg;base64,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WTpP+cZjZgEDFCwnrrolbk0VjwoEkhw6Vb4v9aVqYI62T7usz3vV0s/VUzAySWhCpoiXbjnHifIziGLY3UGiX6AJSp9Ftkg7Y09FV0b2IZS57av4FZ/Fen9HdVIHKn2v8nDvUwn/kdyPHdTmRmu++m9uv3st2z2pSXmtLQmImIZdwrQK7Ef/+1LE5gAL7WFjR6TtIWkRrLDzFaQ6WAjft4r6SgCDSyHzDcTvZajo8ywSj5CoXEBkVj0XlhlCP+sKSyovNUWlYUGpjlrw9g0Crn2+Oc0RuF5MXirbf//jZXw3AcqDjUKSdeFTSI+rck+q3WiOVIVz8+TiUYk8bH3dqiCEXpJGmgCG2GpMDQFxzFJSIi2ETDsddFpx2wQZGMmQgsfWmz9KLqCmcNEDZQshzf3M/6UhsNu2Pltv4qnx1/N///8f56YfPfMfxXXVc25tMjesCALE1P/7UsTnAAzZZWGHlHMhPIzrZYeYYMYNU6rUK0alGSBNRQcLKDvbZWSSA25HrU5rJHG02242sA+dGQ0hQX06gro/BpZAWk4fCBmqiUNTTOPUDVGSO80aIQcx/WcZ9aR7yKzREWdFkrKlmJujaS+25hjN7BvGoetvd95W/pPqFaLa2bWbMb17Wtf2xi9s/P/3nwrax6xZa2r8W9vvet1n/1T3xeT6xi98f2x84tjfzXHgy2+N51fw8WFCPmasZ3nC2DcJQBgjKoIgdLJeAkWiqCKo//tSxOoADGlBaeeMU2l0matxhgzo5EkSSapTCEDYJOAQUlJEiRrznqqr1WvONXaqrXNIhUFXA0HBE8FQVwaWdhqDUGniUN//+o9xL/lv8GlB2JTvEsS1HuJVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LE54ANLQFltMWAImYrbjcY8ANVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsTEA8qQbT8cwwAAAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
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
          Pop.text(gp.x, gp.y, "+5 SP", { color: "#8fdcff", size: 22, life: 0.6, tier: 1 });
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
        Pop.text(p.x + Rand.range(-30, 30), p.y, "-" + r.dmg, { color: r.weak ? "#ff5d73" : r.resist ? "#9aa0b5" : "#ffffff", size: 22, life: 0.6, tier: r.weak || r.crit ? 3 : 1 });
        Sound.clip(r.weak ? "weak" : skill ? "skill" : "hit", 0.6, r.resist ? 0.8 : 1);
        f.hitSince = true; f.lastHitter = h;
        if (f.hp <= 0) return;
        if (s.push) push(f, s.push, "Stunned");
        var R = RULES[f.id];
        if (R && R.onHit) R.onHit(f, h, sk, r);
        if (r.weak && !C.extra) { again = true; Pop.show("combo", { word: "Weak!", sub: "One more" }); f.boost = 1; }
        else if (r.crit) Pop.show("streak", { word: "Critical" });
        else if (r.resist) Pop.show("alert", { word: "Resisted" });
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
        later(0.35, function () { if (combat === C) Pop.show("danger", { word: it.label }); });
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
          Pop.text(p.x + 40, p.y, "-" + dmg, { color: "#ff5d73", size: 22, life: 0.6, tier: big ? 3 : 1 });
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
