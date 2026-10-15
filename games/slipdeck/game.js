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
    music: {
      volume: 0.12, fade: 1.6,
      menu: { from: 0, length: 22.5, rate: 0.85, gain: 0.5 }
    },
    /* THE FIVE BANDS OF THE CLIMB, six levels apiece — the same stretches the
       level map names on its card. Each carries the TABLE the round and the
       end screen are played on and the STRETCH of the track under it, so the
       two can only turn over together. `scene` is a key of CONFIG.art, injected
       out of assets/image/embed/slipdeck-background-phone[-<felt>].webp. A
       playable is one round at level 0: it rides the first band, the only
       scene and the only window the builder embeds in it. */
    bands: [
      { scene: "backgroundPhone",       music: { from: 22.75,  length: 22.75 } },  //  1-6   Warm-up: the beat comes in
      { scene: "backgroundPhoneGreen",  music: { from: 45.5,   length: 36.25 } },  //  7-12  Pressure: the first full body
      { scene: "backgroundPhoneBlue",   music: { from: 81.75,  length: 22 } },     // 13-18  Squeeze: the breakdown
      { scene: "backgroundPhoneRed",    music: { from: 103.75, length: 35.75 } },  // 19-24  Overdrive: the second full body
      { scene: "backgroundPhonePurple", music: { from: 103.75, length: 58.75 } }   // 25-30  Meltdown: that body and the outro
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
      // Cut to the first band's window (22.75 s -> 45.5 s of the source): a
      // playable rides band 1 and plays the whole of it.
      music: "data:audio/mpeg;base64,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bfsq26C+LDzvAKh4XE4JR9Oy8IQTDmHh0csCQwV2C0ijsZatgXNanWXZWHBR6zNtjbfNaTOX9nv/+1LE3oALTWFMzAR3waGSamWGGsgrjzT1fq4i1rPWLmof3LWq714GYpgp8U9SFqK9Z2Wq9betVmm+pm1a84zusbn32c/q9mzMzBNd6evP7M0u+vcnup9trM5DLF3UwceAAAQQDIESpiDC3D1GVHOUW0TVClyaJ0qGjEhyHInAIkuYBiQwGh4KncsDRYGlgrBU6oOxEHVgsDUqCpUFQ16j3LHi3+HcGnf/v/28RUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsTbAAtMZVksPY0BQ5jtNphQAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxOMAEy19WzmGAAkyBuWrnmAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU="
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
      { id:"lowbar", name:"Low bar", fam:"Rule", r:1, text:"Any pair pays, whatever the pair floor" },

      { id:"goldbin", name:"Golden bin", fam:"Bin", r:1, text:"+15 chips for every card binned this hand",
        score:function (h) { return h.bins ? { k:"chips", v:15 * h.bins } : null; } },
      { id:"deep", name:"Deep chute", fam:"Bin", r:1, text:"+2 bins on every hand" },
      { id:"recycler", name:"Recycler", fam:"Bin", r:2, text:"A binned card goes back under the deck" },

      { id:"ascetic", name:"Ascetic", fam:"Grow", r:2, text:"+1 mult for every card binned; a bust resets it",
        score:function (h, inst) { return inst.n ? { k:"mult", v:inst.n } : null; } },
      { id:"collector", xm:true, name:"Collector", fam:"Grow", r:4, text:"×1.5, ×2, ×2.5… for each hand of the same kind in a row",
        score:function (h) { return h.streak > 1 ? { k:"xmult", v:1 + 0.5 * (h.streak - 1) } : null; } },
      { id:"veteran", name:"Veteran", fam:"Grow", r:2, text:"+1 mult for every hand paid this run",
        score:function () { return hands ? { k:"mult", v:hands } : null; } },

      { id:"second", name:"Second chance", fam:"Survive", r:2, text:"A bust breaks this joker instead of a life" },
      { id:"heart", name:"Spare heart", fam:"Survive", r:1, text:"+1 life when taken, −2 mult on every hand",
        score:function () { return { k:"mult", v:-2 }; } },

      { id:"exorcist", name:"Exorcist", fam:"Curse", r:2, text:"A cursed card no longer busts: it gives +20 mult" },
      { id:"seer", name:"Seer", fam:"Curse", r:3, text:"Shows the next card and lifts every veil" },

      /* FATE — the card pushed up onto them, once per hand (FATE below): the jokers
         that steer the deal instead of paying for it. */
      { id:"compass", name:"Compass", fam:"Fate", r:2, act:true, text:"Push the card up onto it, then down onto a suit: the next card is of that suit" },
      { id:"reshuffle", name:"Reshuffle", fam:"Fate", r:1, act:true, text:"Push the card up onto it: the card goes back into the deck, no bin spent" },
      { id:"pocket", name:"Pocket", fam:"Fate", r:2, act:true, text:"Push the card up onto it: the card is put aside, or swapped with the one put aside" },
      { id:"rewind", name:"Rewind", fam:"Fate", r:1, act:true, text:"Push the card up onto it: the last card you binned comes back into your hand, with its bin" },
      { id:"counter", name:"Card counter", fam:"Fate", r:1, text:"Shows what is left in the deck: each suit, and the faces" },
      { id:"called", xm:true, name:"Called shot", fam:"Fate", r:3, act:true, text:"Before your third card, push the card up onto it, then down onto a hand: make it or better for ×mult, miss it and it busts",
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
      { id:"seat", sign:"★", name:"Lucky seat", fam:"Seat", r:1, text:"Every hand lights one place: the card kept there adds its chips twice more",
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
    var lowWarned, firstFrame, done;
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
        "Every hand starts on a card you did not choose. Five cards make a hand, paid as poker.",
        "There is no timer: take your time. The deck is your clock — when it runs out, the run is over.",
        "Tap anything on the table to read its rule again." ] },
      count: { eye:"Your first hand", title:"Chips × mult", hands:true, lines:[
        "The hand gives chips and a mult. Every card that makes it adds its chips: its number, 10 for a face, 11 for an ace.",
        "Then the special cards and your jokers add theirs, left to right. The hand pays chips × mult." ] },
      double: { eye:"How it counts", title:"Two hands in one", hands:true, lines:[
        "Your cards made two hands at once — a pair and a flush, say. Each one is counted on its own, and the hand pays both.",
        "Wild cards and some jokers make it possible: a wild card fits any flush and still pairs its rank." ] },
      bust: { eye:"A hand that does not pay", title:"Bust", lines:[
        "High card busts the hand, and so does a pair under the floor or a cursed card.",
        "A bust costs a life. No lives left, and the run is over." ] },
      bins: { eye:"Bins", title:"No bins left", lines:[
        "You may bin {n} cards per hand. The next one costs a life.",
        "The count starts again with every new hand." ] },
      floor: { eye:"New rule", title:"Pairs of {r} or better", lines:[
        "From this level on, a single pair only pays from {r} up. A lower one busts the hand.",
        "Two pair and better always pay." ] },
      joker: { eye:"New", title:"Jokers", lines:[
        "Every paid hand fills the joker gauge — the stronger the hand, the more it fills. A full gauge deals a pick: take one joker of two.",
        "A joker works on every hand, until the end of the run. Every run opens on a pick.",
        "Three fit on the rail; a fourth asks which one it replaces. Tap a joker on the rail to read it again." ] },
      fate: { eye:"New", title:"Fate jokers", lines:[
        "Left bins, right keeps, and up plays a Fate joker: push the card onto it. Each one acts once per hand.",
        "A green dot on it says it is ready. Tap it to read what it does." ] },
      pot: { eye:"New", title:"The pot", hands:true, lines:[
        "Every card you bin drops its chips into the pot, under the bin gate.",
        "A paid hand takes a share of the pot — the stronger the hand, the bigger the share — and the mult multiplies it.",
        "A bust burns half of the pot. The last hand of the deck takes all of it." ] },
      xmult: { eye:"How it counts", title:"Add or multiply", demo:true, lines:[
        "The red chip is the mult: the hand pays blue chips × red mult.",
        "A × joker counts after the jokers on its left: on the right of the rail, it multiplies everything before it." ] },
      gold:  { eye:"Special card", title:"Gold", lines:[ "A gold card adds 40 chips to the hand it ends in." ] },
      glass: { eye:"Special card", title:"Glass", lines:[ "A glass card doubles the mult — but one time in four it shatters and gives nothing." ] },
      wild:  { eye:"Special card", title:"Wild", lines:[ "A wild card counts as every suit: it fits any flush." ] },
      lucky: { eye:"Special card", title:"Lucky", lines:[ "A lucky card gives +10 mult one time in three." ] },
      curse: { eye:"Danger", title:"Cursed card", lines:[
        "Keep it and the whole hand busts, whatever else it holds. Bin it.",
        "The Exorcist joker turns a curse into +20 mult." ] },
      veil:  { eye:"Danger", title:"Veiled card", lines:[
        "Its suit stays hidden until you keep it: you choose on its rank alone.",
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
      tipQueue.unshift({ joker:id, from:i, lines:lines, ready:J.act && !why,
                         buttons:J.xm ? [{ label:Lang.t("+ or ×"), plate:true, fn:function () { tip("xmult", null, null, true); } }] : null });
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
      if (cat === "pair" && STAGE.floor > 2) {
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
      Sound.cue("tip", 0.35, 1, 620, 0.06, "triangle");
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
      Sound.cue("tip", 0.35, 1.2, 620, 0.06, "triangle");
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
      Notify.say(fill(Lang.t("Next card: {s}"), { s:SUIT_GLYPH[s] }), { kind:"good", icon:"sparkles" });
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
      Notify.say(fill(Lang.t("Called: {hand}"), { hand:Lang.t(CAT_NAME[cat]) }),
                 { sub:fill(Lang.t("x{x} mult if you make it, a bust if you miss"), { x:CALL_X[cat] }), kind:"rare", icon:"eye" });
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
        Notify.say(fill(Lang.t("{j} leaves the rail"), { j:Lang.t(JOKER_BY[out.id].name) }), { kind:"info" });
      } else rail.push({ id:id, n:0 });
      if (id === "heart") { lives++; showLives(); }
      if (id === "seat" && seat < 0) lightSeat();
      var i = out ? slot : rail.length - 1;
      Fx.burst(railX(i), L.railY + L.railH / 2, { color:[FAM_COL[J.fam], "#ffffff"], count:16, speed:320, life:0.45, grav:300 });
      lit.who = "joker"; lit.idx = i; lit.t = 1;
      Pop.show("bonus", { word:J.name, at:"top" });
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

    /* The Help card's example of what the hint lights (menu.js, helpAura):
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
      lowWarned = false; firstFrame = true; done = false;
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
      var left = cardsLeft();
      if (!lowWarned && left <= 8 && left > 0) {
        lowWarned = true;
        Pop.show("alert", { word: "Last cards", sub: fill(Lang.t("{n} left in the deck"), { n:left }) });
      }
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
            Notify.say("No bins left", { sub:"The next bin costs a life", kind:"warn" });
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
         and the Help card says so (helpAura) — no card on the way in. A
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
             levelWon:finish, levelGoal:levelGoal, wipe:wipe, codex:codex, helpAura:helpAura };
  })();
