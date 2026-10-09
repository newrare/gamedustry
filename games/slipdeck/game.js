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
    intro: { logo: null, demo: "swipe", caption: "" },

    // LEFT / RIGHT (or A / D) fire a whole lateral flick through Input.swipe,
    // which is exactly the gesture a thumb makes — no keyboard code of our own.
    keyboard: true,

    // HUD slots: the centre score is always there; the timer fills the right.
    hud: { score: true, timer: false },   // the right pill counts the deck

    /* THE BED. One track, six windows of it: five for the bands of the climb
       (below) and a quiet, slower one under the menus. The entry points are
       the track's own seams, measured (docs/MUSIC.md): 90 BPM with its first
       beat at 0.055 s, so every window starts on a bar (2.667 s). The body
       starts at 10.7 s, breaks down at 74.7-95.4 and fades out from 143.4. */
    music: {
      volume: 0.12, fade: 1.6,
      menu: { from: 0.055, length: 32, rate: 0.85, gain: 0.5 }
    },
    /* THE FIVE BANDS OF THE CLIMB, six levels apiece — the same stretches the
       level map names on its card. Each carries the TABLE the round and the
       end screen are played on and the STRETCH of the track under it, so the
       two can only turn over together. `scene` is a key of CONFIG.art, injected
       out of assets/image/embed/slipdeck-background-phone[-<felt>].webp. A
       playable is one round at level 0: it rides the first band, the only
       scene and the only window the builder embeds in it. */
    bands: [
      { scene: "backgroundPhone",       music: { from: 10.72, length: 32 } },     //  1-6   Warm-up
      { scene: "backgroundPhoneGreen",  music: { from: 42.72, length: 32 } },     //  7-12  Pressure
      { scene: "backgroundPhoneBlue",   music: { from: 96.06, length: 21.33 } },  // 13-18  Squeeze
      { scene: "backgroundPhoneRed",    music: { from: 117.39, length: 24 } },    // 19-24  Overdrive
      { scene: "backgroundPhonePurple", music: { from: 96.06, length: 45.33 } }   // 25-30  Meltdown
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
      // Cut to the first band's window, 12 bars at 90 BPM (10.72 s -> 42.72 s
      // of the source): a playable rides band 1 and plays the whole of it.
      music: "data:audio/mpeg;base64,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"
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
         counter), some steer it (the FATE family, used by a tap on the rail,
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
       — Balatro's own base table, chips then mult. */
    var CAT_ORDER = { high:0, pair:1, twoPair:2, trips:3, straight:4,
                      flush:5, fullHouse:6, quads:7, straightFlush:8 };
    var CAT_NAME = { high:"High card", pair:"Pair", twoPair:"Two pair",
                     trips:"Three of a kind", straight:"Straight", flush:"Flush",
                     fullHouse:"Full house", quads:"Four of a kind",
                     straightFlush:"Straight flush" };
    var BASE = { high:[5,1], pair:[10,2], twoPair:[20,2], trips:[30,3], straight:[30,4],
                 flush:[35,4], fullHouse:[40,4], quads:[60,7], straightFlush:[100,8] };

    /* ===================================================================
       JOKERS — data, plus a score function for the ones that count.
       A score function reads the hand being counted and returns one effect,
       { k: "chips" | "mult" | "xmult", v }. The rule benders and the
       survivors carry none: the code asks has(id) where they bend. The FATE
       jokers are tapped on the rail (`act`, the FATE section below), and the
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

      /* FATE — tapped on the rail, once per hand (FATE below): the jokers
         that steer the deal instead of paying for it. */
      { id:"compass", name:"Compass", fam:"Fate", r:2, act:true, text:"Tap: pick the suit of the next card" },
      { id:"reshuffle", name:"Reshuffle", fam:"Fate", r:1, act:true, text:"Tap: the card in play goes back into the deck, no bin spent" },
      { id:"pocket", name:"Pocket", fam:"Fate", r:2, act:true, text:"Tap: put the card in play aside, or swap it with the one put aside" },
      { id:"rewind", name:"Rewind", fam:"Fate", r:1, act:true, text:"Tap: the last card you binned comes back into your hand, with its bin" },
      { id:"counter", name:"Card counter", fam:"Fate", r:1, text:"Shows what is left in the deck: each suit, and the faces" },
      { id:"called", xm:true, name:"Called shot", fam:"Fate", r:3, act:true, text:"Tap before your third card to call a hand: make it or better for ×mult, miss it and it busts",
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
                       fullHouse:5, quads:6, straightFlush:8 };
    /* THE POT: the share of it a paid hand takes, by strength. The last
       hand of the deck takes all of it (potShare), Croupier adds 25 points. */
    var POT_SHARE = { pair:0.1, twoPair:0.2, trips:0.3, straight:0.4, flush:0.5,
                      fullHouse:0.6, quads:0.8, straightFlush:1 };
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
    var drag = { on:false, sx:0, x0:0 };
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
      var out = { cat:"high", name:CAT_NAME.high, maxR:0, pairRv:0, scoring:[] };
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

      var cat = "high";
      if (straight && flush)             cat = "straightFlush";
      else if (maxR === 4)               cat = "quads";
      else if (maxR === 3 && pairs >= 1) cat = "fullHouse";
      else if (flush)                    cat = "flush";
      else if (straight)                 cat = "straight";
      else if (maxR === 3)               cat = "trips";
      else if (pairs >= 2)               cat = "twoPair";
      else if (pairs === 1)              cat = "pair";

      var all = cat === "straight" || cat === "flush" || cat === "straightFlush";
      for (i = 0; i < n; i++) out.scoring.push(all || (cat !== "high" && rc[cards[i].r] >= 2));
      out.cat = cat; out.name = CAT_NAME[cat]; out.maxR = maxR; out.pairRv = pairRv;
      return out;
    }

    /* `preview` draws nothing random (glass holds, lucky misses), so reading
       the chip under the card never moves the deal. */
    function potShare(cat) {
      if (cardsLeft() < HAND_SIZE) return 1;           // the last hand: all in
      return Math.min(1, (POT_SHARE[cat] || 0) + (has("croupier") ? 0.25 : 0));
    }
    function scoreHand(cards, preview) {
      var ev = evalHand(cards), i;
      var res = { cat:ev.cat, name:ev.name, bust:false, why:"", steps:[],
                  chips:0, mult:0, total:0, streak:0 };

      if (ev.cat === "high") { res.bust = true; res.why = "High card"; }
      else if (ev.cat === "pair" && ev.pairRv < STAGE.floor && !has("lowbar")) {
        res.bust = true; res.why = "Pair too low";
      } else if (!has("exorcist")) {
        for (i = 0; i < cards.length; i++) if (cards[i].curse) { res.bust = true; res.why = "Cursed"; }
      }
      // a called hand missed busts, but only a FULL hand can miss it
      if (!res.bust && called && cards.length >= HAND_SIZE && CAT_ORDER[ev.cat] < CAT_ORDER[called]) {
        res.bust = true; res.why = "Missed call";
      }
      if (res.bust) return res;

      res.streak = ev.cat === lastCat ? catStreak + 1 : 1;
      var chips = BASE[ev.cat][0], mult = BASE[ev.cat][1];
      function step(who, idx, text, col) {
        res.steps.push({ who:who, idx:idx, text:text, col:col, chips:chips, mult:Math.max(1, mult) });
      }
      function apply(who, idx, e) {
        if (!e || !e.v) return;
        if (e.k === "chips")     { chips += e.v; step(who, idx, "+" + e.v, CHIP_COL); }
        else if (e.k === "mult") { mult += e.v;  step(who, idx, (e.v > 0 ? "+" : "") + e.v + Lang.t(" mult"), MULT_COL); }
        else                     { mult *= e.v;  step(who, idx, "×" + e.v, XMULT_COL); }
        res.steps[res.steps.length - 1].e = e;     // what the rail's preview reads
      }
      step("base", -1, "", GOLD);

      var h = { cards:cards, ev:ev, bins:binsThisHand, streak:res.streak, called:called, seat:seat };
      for (i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (ev.scoring[i]) apply("card", i, { k:"chips", v:rankChips(c.r) });
        if (c.mod === "gold") apply("card", i, { k:"chips", v:40 });
        else if (c.mod === "lucky" && !preview && Rand.chance(1 / 3)) apply("card", i, { k:"mult", v:10 });
        else if (c.mod === "glass") {
          if (!preview && Rand.chance(0.25)) step("card", i, Lang.t("Shattered"), MOD_COL.glass);
          else apply("card", i, { k:"xmult", v:2 });
        }
        if (c.curse) apply("card", i, { k:"mult", v:20 });     // only reached with Exorcist
      }
      /* the pot's share, as chips — before the jokers, so every one of
         them that multiplies multiplies the pot too */
      res.pot = POT_ON && cards.length >= HAND_SIZE ? Math.round(pot * potShare(ev.cat)) : 0;
      if (res.pot) apply("pot", -1, { k:"chips", v:res.pot });
      for (i = 0; i < rail.length; i++) {
        var J = JOKER_BY[rail[i].id];
        if (J.score) apply("joker", i, J.score(h, rail[i]));
      }

      res.chips = chips; res.mult = Math.max(1, mult);
      res.total = Math.round(res.chips * res.mult);
      return res;
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
        "A Fate joker acts when you tap it on the rail, once per hand.",
        "A green dot on it says it is ready. It is ready again on the next hand." ] },
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
    function jokerCard(i) {
      if (JOKER_BY[rail[i].id].act) fateCard(i);
      else jokerInfo(rail[i].id, rail[i]);
    }
    function jokerEye(J) { return Lang.t(J.fam) + " · " + Lang.t(RARITY[J.r].name); }
    function jokerInfo(id, inst) {
      var J = JOKER_BY[id], lines = [Lang.t(J.text)];
      inst = inst || { id:id, n:0 };
      var now = inst.id === "ascetic" ? inst.n : inst.id === "veteran" ? hands : 0;
      if (now) lines.push(fill(Lang.t("Now: +{n} mult"), { n:now }));
      if (inst.id === "collector" && catStreak > 1) lines.push(fill(Lang.t("Now: {n} in a row"), { n:catStreak }));
      if (inst.id === "hothand" || inst.id === "charm" || inst.id === "third" || inst.id === "redeal" || inst.id === "ticket") {
        lines.push(fill(Lang.t("Joker gauge: {n} / {max}"), { n:gauge, max:PICK_GAUGE }));
      }
      tipQueue.unshift({ eye:jokerEye(J), title:Lang.t(J.name), lines:lines, col:FAM_COL[J.fam],
                         buttons:J.xm ? [{ label:Lang.t("+ or ×"), plate:true, fn:function () { tip("xmult", null, null, true); } }] : null });
      if (!tipOpen) nextTip();
    }

    /* ===================================================================
       POKER HANDS — the chart, one row per hand, strongest on top.

       Each row deals the hand it names: five small cards, the ones that
       count lifted and the kickers dimmed — the same read the count gives
       on the table, because the lift comes out of evalHand itself — then
       its name and what it opens the count on, chips × mult in the table's
       own blue and red. High card says Bust instead, and the pair carries
       the floor once the climb has set one. Reached from the basics card
       and from a tap on the hand's line; the hand being built is lit.
       =================================================================== */

    var CHART = [
      ["straightFlush", [[8,1],[9,1],[10,1],[11,1],[12,1]]],
      ["quads",         [[11,0],[11,1],[11,2],[11,3],[4,2]]],
      ["fullHouse",     [[7,0],[7,1],[7,3],[2,2],[2,0]]],
      ["flush",         [[12,3],[10,3],[8,3],[5,3],[1,3]]],
      ["straight",      [[4,2],[5,3],[6,1],[7,0],[8,2]]],
      ["trips",         [[6,3],[6,2],[6,1],[12,0],[1,2]]],
      ["twoPair",       [[10,1],[10,3],[3,0],[3,2],[8,3]]],
      ["pair",          [[12,0],[12,1],[2,3],[5,2],[9,0]]],
      ["high",          [[0,0],[9,2],[6,3],[4,1],[1,0]]]
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
        var lift = cat !== "high" && scoring[i];
        miniCard(g, cards[i], i * MINI_STEP + 1, (lift ? 0 : MINI_LIFT) + 1, MINI_W - 2, MINI_H - 2,
                 cat !== "high" && !lift);
      }
      row.appendChild(cv);

      var txt = document.createElement("div"), nm = document.createElement("b"), fig = document.createElement("span");
      txt.className = "sd-hname";
      nm.textContent = upper(Lang.t(CAT_NAME[cat]));
      txt.appendChild(nm);
      fig.className = "sd-hfig";
      if (cat === "high") {
        fig.className += " bust";
        fig.textContent = upper(Lang.t("Bust"));
      } else {
        fig.innerHTML = '<i class="c"></i><span>x</span><i class="m"></i>';
        fig.querySelector(".c").textContent = BASE[cat][0];
        fig.querySelector(".m").textContent = BASE[cat][1];
        if (POT_ON) {
          var ps = document.createElement("span");
          ps.className = "sd-hpot";
          ps.textContent = fill(Lang.t("Pot {n}%"), { n:Math.round(POT_SHARE[cat] * 100) });
          fig.appendChild(ps);
        }
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

    /* The card, on its veil. A card may carry BUTTONS — a FATE joker's
       actions — and then a tap on a button acts and a tap anywhere else
       puts the card away, which is what its tap line says. */
    function nextTip() {
      var t = tipQueue.shift(), frame = document.getElementById("frame");
      if (!t || !frame) { tipOpen = null; return; }
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
        if (i && t.status && i === t.lines.length - 1) p.className = "sd-status";
        mc.querySelector(".mt-body").appendChild(p);
      }
      if (t.chart) mc.querySelector(".mt-body").appendChild(buildHands());
      if (t.demo) {                                  // under the first line, before the rest
        var bd = mc.querySelector(".mt-body");
        bd.insertBefore(buildXDemo(), bd.children[1] || null);
      }
      if (t.buttons) {
        var row = document.createElement("div");
        row.className = "sd-btns" + (t.buttons.length > 4 ? " many" : "");
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
      drag.on = false;
    }
    function tipButton(b) {
      var n = document.createElement("button");
      n.type = "button";
      n.className = "btn btn-sm" + (b.suit != null ? " sd-suit s" + b.suit : "") + (b.plate ? " btn-plate" : "");
      n.textContent = b.suit != null ? b.label : upper(b.label);
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
       FATE — the jokers tapped on the rail, once per hand each.

       They act on the card in play or on the next one, so they wait for a
       card to have landed and for no hand to be in its count. A tap on one
       opens its card: what it does, whether it is ready, and its actions —
       greyed, with the reason, when it is not.
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

    function fateCard(i) {
      var inst = rail[i], id = inst.id, J = JOKER_BY[id], why = fateWhyNot(id), off = !!why, b = [], k;
      var lines = [Lang.t(J.text), why ? Lang.t(why) : Lang.t("Ready")];
      if (id === "compass") {
        for (k = 0; k < 4; k++) {
          (function (s) { b.push({ label:SUIT_GLYPH[s], suit:s, off:off || !suitLeft(s), fn:function () { useCompass(i, s); } }); })(k);
        }
      } else if (id === "reshuffle") b.push({ label:Lang.t("Shuffle it back"), off:off, fn:function () { useReshuffle(i); } });
      else if (id === "pocket") b.push({ label:Lang.t(pocket ? "Swap" : "Put it aside"), off:off, fn:function () { usePocket(i); } });
      else if (id === "rewind") b.push({ label:Lang.t("Take it back"), off:off, fn:function () { useRewind(i); } });
      else if (id === "called") {
        for (k = 0; k < CALLS.length; k++) {
          (function (cat) {
            b.push({ label:Lang.t(CAT_NAME[cat]) + " x" + CALL_X[cat], off:off, plate:true, fn:function () { useCall(i, cat); } });
          })(CALLS[k]);
        }
      }
      tipQueue.unshift({ eye:jokerEye(J), title:Lang.t(J.name), lines:lines, status:true,
                         col:FAM_COL[J.fam], buttons:b });
      if (!tipOpen) nextTip();
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
      if (J.act) tip("fate");
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
      bestTotal = 0; bestName = "—"; jokersTaken = 0;
      lowWarned = false; firstFrame = true; done = false;
      drag.on = false; lit.t = 0;
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
        Notify.say("Last cards", { sub:fill(Lang.t("{n} left in the deck"), { n:left }), kind:"warn" });
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
      if (TALLY_STEP <= 0) { settle(res); return; }
      var base = BASE[res.cat] || BASE.high;
      tally = { res:res, phase:res.bust ? "bust" : "intro", t:0, clock:0, i:1, wait:0,
                fast:false, slam:false, flights:[], op:null, chips:base[0], mult:base[1],
                pc:0, pm:0, pt:0, ticks:0, landed:0 };
    }

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
        fillGauge(GAUGE_GAIN[res.cat] + (has("hothand") ? 1 : 0));
        lastCat = res.cat; catStreak = res.streak;
        if (res.total > bestTotal) { bestTotal = res.total; bestName = res.name; }
        HUD.setScore(score);
        HUD.punch(GOLD);
        Sound.cue("pay", 0.65, 0.88 + CAT_ORDER[res.cat] * 0.06, 700, 0.2, "triangle");
        var big = CAT_ORDER[res.cat] >= CAT_ORDER.flush || res.total >= 1000;
        Pop.show(big ? "ultra" : CAT_ORDER[res.cat] >= CAT_ORDER.trips ? "combo" : "score",
                 { word:res.name, sub:"+" + res.total });
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
       chevrons, the bins, the hand's worth and the cards of the hand. */
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
      if (Math.abs(p.y - L.gateY) < 90 && (p.x < Layout.left + 110 || p.x > Layout.right - 110)) {
        return dry || tip("basics", null, null, true) || true;
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
      if (tipOpen) { closeTip(); return; }
      if (tally) { tally.fast = true; tap = null; return; }   // a tap hurries the count
      tap = { x:p.x, y:p.y, t:Date.now() };
      if (!cur || cur["in"] < 1 || tally) return;
      drag.on = true; drag.sx = p.x; drag.x0 = cur.x;
    }
    function onMove(p) {
      hover(p);
      if (tap && (Math.abs(p.x - tap.x) > 12 || Math.abs(p.y - tap.y) > 12)) tap = null;
      if (!drag.on || !cur) return;
      cur.x = drag.x0 + (p.x - drag.sx);
      cur.y = -Math.abs(cur.x) * 0.06;
      cur.rot = clamp(cur.x / 620, -0.42, 0.42);
    }
    function onUp(p) {
      var t = tap; tap = null;
      if (drag.on) {
        drag.on = false;
        if (cur && Math.abs(cur.x) >= SWIPE_DIST) { decide(cur.x > 0 ? 1 : -1); if (p) hover(p); return; }
      }
      if (t && Date.now() - t.t < 450 && !tally && !tipOpen && !pick && State === "playing") explainAt(t);
      if (p) hover(p);
    }

    /* ===================================================================
       UPDATE — no clock: the only time in this game is animation.
       =================================================================== */

    function update(dt) {
      var i;
      if (firstFrame) {                    // the entrance has landed: say the rules
        firstFrame = false;
        tip("basics");
        if (STAGE.floor > 2) tip("floor", { r:rankWord(STAGE.floor) }, "floor" + STAGE.floor);
        // a run opens on a pick, so a build starts with the first card
        if (anyFam()) { tip("joker"); pendingPick = true; opening = true; }
      }
      lit.t = Math.max(0, lit.t - dt * 3);

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
      var s = T.res.steps[n], p = T.res.steps[n - 1];
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
      var T = tally, res = T.res, steps = res.steps, i, cx = Layout.cx, y = tallyY();
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
          var lvl = CAT_ORDER[res.cat];
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
        var big = res.total >= 600 || CAT_ORDER[res.cat] >= CAT_ORDER.flush;
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
      if (T.t >= T_TOTAL) settle(res);
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
        ctx.translate(-w / 2 + pad, -h / 2 + pad * 2.0);
        if (hidden) { ctx.font = font(small * 0.8, 900); ctx.fillText("?", 0, 0); }
        else { pipPath(ctx, c.s, small * 0.80); ctx.fill(); }
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
       them; the one the card leans toward lights with the pull. They take no
       tap — the swipe is the game. */
    function drawChevrons(x, side, col, label, lit) {
      var y = L.gateY, i;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (i = 0; i < 3; i++) {
        var cx = x + side * (i * 18 - 18), a = 0.25 + 0.25 * i + lit * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - side * 9, y - 24); ctx.lineTo(cx + side * 9, y); ctx.lineTo(cx - side * 9, y + 24);
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

    /* The Pocket's card, aside on the right flank above the KEEP gate. */
    function drawPocket() {
      var w = 92, h = w * 1.4, x = Layout.right - 56, y = L.gateY - 64 - h / 2;
      drawCard(pocket, x, y, w, h, 0.06, 1, null);
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
      var name = v.bust ? Lang.t("Bust") : v.unknown ? "?" : Lang.t(v.name);
      ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.font = font(26, 900);
      ctx.fillStyle = v.bust ? BIN_COL : v.dim || v.unknown ? "rgba(255,255,255,.5)" : GOLD;
      ctx.fillText((lean ? "→ " : "") + upper(name), x0, y);
      if (!v.bust && !v.unknown) figures(Layout.right - 14, y, v.chips, v.mult, v.dim);
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
      ctx.strokeText(upper(Lang.t(res.name)), 0, 0);
      ctx.fillStyle = GOLD; ctx.fillText(upper(Lang.t(res.name)), 0, 0);
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
      var res = T.res, k = clamp(T.t / T_COUNT, 0, 1), i;
      var shown = Math.round(res.total * cubicOut(k));
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

      var size = 76 + 46 * clamp(Math.log(1 + res.total) / Math.log(5000), 0, 1);
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
      var scoring = tally && !tally.res.bust ? evalHand(hand).scoring : null;

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
        if (pocket) drawPocket();
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
        var sc = 0.9 + 0.1 * e, tint = null;
        if (cur.x < -4)      tint = rgba(BIN_COL,  0.05 + pull * 0.17);
        else if (cur.x > 4)  tint = rgba(KEEP_COL, 0.05 + pull * 0.17);
        if (Enter.begin(x, y)) {
          drawCard(cur.card, x, y, L.cardW * sc, L.cardH * sc, cur.rot, e, tint);
          Enter.end();
        }
      }

      drawTally();
    }

    /* ===================================================================
       THE END OF A RUN — the deck ran out, or the lives did.
       =================================================================== */

    function finish(title) {
      if (done) return;
      cursorNow = ""; canvas.style.cursor = "";       // the end screen is not the table
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
          { label:"Best hand",  value:bestTotal ? Lang.t(bestName) + " · " + bestTotal : "—", grade:"accent" },
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
             levelWon:finish, levelGoal:levelGoal, wipe:wipe, codex:codex };
  })();
