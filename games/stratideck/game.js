  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Stratideck",
    /* One sentence, three words in colour: the gesture, what it lands on and
       the one rule that decides a fight. The stage under it drags a blue card
       onto a face-down red one, which flips and falls. */
    tagline: "<b class=\"w-drag\">Drag</b> a card onto a <b class=\"w-hidden\">hidden</b> enemy, the higher <b class=\"w-rank\">rank</b> wins",
    /* NO CLOCK. A battle is turn-based: it ends when the enemy camp is empty,
       its flag is taken, or the player's army is spent. */
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
    bg: "#0a1026",

    /* The painted camp goes behind the ROUND too: the grid, the hand and the
       readouts are drawn over the band's own scene, on a translucent panel,
       so the round is played in the world the level map shows. render()
       asks Art.scene() before painting a ground of its own. */
    sceneArt: true,

    /* The 180 portraits of the cast (`castBlue04C`…) are web-only art and are
       only ever an <img src>: waiting on all of them before the title screen
       would be a loading bar for pictures most sessions never open. */
    artLazy: /^cast/,

    layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 26 },

    // The stage is the drag variant, re-dressed from the SKIN as a battle
    // grid: the shared finger carries a blue card up onto a face-down red one.
    intro: { logo: null, demo: "drag", caption: "" },

    // SPACE starts and replays; a grid pick is a pointer's job.
    keyboard: true,

    // The centre score is always there; the right slot counts the foes.
    hud: { score: true, timer: false },

    /* THE BED. One track, six windows of it: five for the bands of the climb
       (below) and a quiet, slower one under the menus. The entry points are
       the track's own seams, measured (docs/MUSIC.md): a quiet intro to 30 s,
       the body from 30, a full section 45-75, a break at 75, a second body
       80-110, a breakdown 115-125, the loudest section 125-155, an outro to
       170 and the fade from 173. */
    /* `seam`: every window loops on the bar, two beats of crossfade ending on
       its downbeat (docs/MUSIC.md, The seam); `cut`: the playable's window,
       one seam of pre-roll into its embedded cut. */
    music: {
      volume: 0.11, fade: 1.8, seam: 0.97,
      cut: { from: 0.97, length: 30.968 },
      menu: { from: 0, length: 30.968, rate: 0.85, gain: 0.5 }
    },
    /* THE FIVE BANDS OF THE CLIMB, six levels apiece — the same stretches the
       level map names on its card. Each carries the PICTURE the round and the
       end screen are played over and the STRETCH of the track under it, so the
       two can only turn over together. `scene` is a key of CONFIG.art, injected
       out of assets/image/embed/stratideck-background-phone-NN.webp. A playable
       is one round at level 0: it rides the first band, the only scene and the
       only window the builder embeds in it. `hand` is how many of the row's
       slots (play.handSlots) the band deals into: a biome opens one more, so
       the three locked slots are the climb's to give, not a post's. */
    bands: [
      { scene: "backgroundPhone01", hand: 2, music: { from: 30,  length: 30.968 } },  //  1-6   Outpost
      { scene: "backgroundPhone02", hand: 3, music: { from: 45,  length: 30.956 } },  //  7-12  Palisade
      { scene: "backgroundPhone03", hand: 4, music: { from: 80,  length: 29.021 } },  // 13-18  Warcamp
      { scene: "backgroundPhone04", hand: 5, music: { from: 125, length: 30.962 } },  // 19-24  Siege
      { scene: "backgroundPhone05", hand: 5, music: { from: 140, length: 30.962 } }   // 25-30  Citadel
    ],

    // All user-facing copy in one place.
    copy: {
      start:      "To battle",
      ctaBar:     "Install now",
      ctaEnd:     "Play the full game",
      replay:     "Fight again",
      scoreLabel: "Score",
      timeLabel:  "Time",
      endScore:   "Final score",
      gameOver:   "Army lost",
      timeUp:     "Time's up!",
      victory:    "Camp taken!",
      flagTaken:  "Flag captured!",
      cardsLabel: "Cards",
      foesLabel:  "Foes"
    },

    /* --- game tunables ------------------------------------------------
       The level layer lerps the ones its manifest names (web.levels.tune)
       between level 1 and level 30, in place; section 6 re-reads them on
       every reset, so a playable reads the same numbers it always did. */
    play: {
      cols: 4,           // the enemy camp: columns...
      rows: 3,           // ...and rows of face-down cards
      traps: 0,          // traps hidden in the camp (only a sapper clears one)
      objects: 1,        // objects in the camp, each answering to one grade (OBJECTS)
      deckRatio: 1.1,    // a GENERATED army, as a share of the camp's cells. A
                         // web build with a barracks hands its own deck over in
                         // CONFIG.army and this is not read at all.
      enemyBias: -1.0,   // shift on the enemy GRADES drawn: negative = weaker camp
      deckBias: 0.6,     // the same shift on a generated army
      /* THE SECOND AXIS OF A CAMP, and the one the tiers added: 0 is a camp of
         E and D, 1 is a camp where S is ordinary. A level is not merely a
         bigger camp than the one before it, it is a better equipped one — which
         is what makes a deck worth going back to the barracks for. */
      enemyTier: 0.12,
      deckTier: 0.22,    // the same for a generated army (playable, endless run)
      handSize: 2,       // cards on the table at once, dealt in the MID format (a band's `hand` wins)
      handSlots: 5,      // the row they stand in: the slots past handSize are locked
      /* How many of the cards NOT played go back under the deck after a turn,
         by the hand's size (index = open slots): a two-card hand keeps its
         other card, a wider one sends one or two back and keeps the rest. */
      handReturn: [0, 0, 0, 1, 2, 2],
      // no score goal: the three stars are the flag, no wound and a capture (tally)
      cornerClear: 96    // the hand stops this far above the frame's foot, so the
                         // web target's two corner pills never cover a card
    },

    /* THE CARD FACES, as lab/stratideck-card.html composes them. The look is
       the SKIN's card block, which that bench links as it is; these are the
       knobs of its panel, under the same names, so "Copy the card settings"
       in the lab is this block and nothing has to be renamed on the way.
       `style` is the frame, `brank` / `btier` the two badge designs, `arank`
       / `atier` their place ("auto" is the design's own); `blur` is read at
       a 300px card and scaled with it.
       THREE CARDS: `rfull` / `rmid` / `rtiny` are the widths each format is
       composed at, and every place shows that card scaled as a whole
       (sizeNode). Then, per format, the grade badge, the tier badge and the
       macaron: `rankFull` its size (×), `rankFullX` / `rankFullY` its offset
       from the design's own place, in percents of the card's width. */
    cards: {
      style: "forge", brank: "shield", btier: "seal", arank: "tl", atier: "br",
      rankOn: true, tierOn: true,
      zoom: 2.6, blur: 2, vary: true,
      hero: 95, mark: 0.5, mx: -28, markover: false,
      midz: 1.49, midx: -4, midy: 16, tinyz: 2.23, tinyx: -11, tinyy: 59,
      rfull: 320, rmid: 120, rtiny: 60,
      rankFull: 1, tierFull: 1.3, perkFull: 0.86,
      rankMid: 1.6, tierMid: 2.19, perkMid: 1.42,
      rankTiny: 1.21, tierTiny: 1.5, perkTiny: 1.09,
      rankFullX: 0, rankFullY: 0, tierFullX: -1, tierFullY: -5, perkFullX: 2, perkFullY: -10,
      rankMidX: 2, rankMidY: 4, tierMidX: 2, tierMidY: -8, perkMidX: 1, perkMidY: -26,
      rankTinyX: -1, rankTinyY: 0, tierTinyX: -1, tierTinyY: -6, perkTinyX: 0, perkTinyY: -2
    }
  };

  /* ===================================================================
     2. ASSETS — embedded base64 data URIs only (no network requests ever).
     =================================================================== */
  var ASSETS = {
    /* No `logo`: this game ships a painted logotype
       (assets/image/master/stratideck-title.png) and the shell hides
       #app-icon as soon as one exists. The card crests, the special ranks,
       the flag, the trap and the decor pool are painted too — cut out of
       stratideck-object-other.png and named in art.objects of the manifest
       (piece-01..09, decor-01..04). */
    images: {},
    sounds: {
      // The background bed, looped and crossfaded by Music. The playable's cut
      // is the FIRST band's window and nothing else; the web target ships the
      // whole track instead (`web.music` in the manifest):
      //   ffmpeg -ss 29.03 -t 31.938 -i assets/audio/music/stratideck.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3
      music: "data:audio/mpeg;base64,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"
      // No sfx clip here: every key the game plays is a role of the house kit,
      // mapped by `sfx` in manifest.json and injected by the builder.
    }
  };

  /* ===================================================================
     6. GAME — STRATIDECK
     A camp of face-down enemy cards on a grid, and the player's own army
     dealt four at a time under it. A card is dragged (or tapped, then the
     cell tapped) onto an enemy the player can REACH — the bottom row at
     first, then whatever stands next to a cell already emptied, so the camp
     is opened corridor by corridor.

     EVERY CARD IS TWO NUMBERS, AND THEY ARE READ IN THAT ORDER: the GRADE,
     1 to 12, and the TIER, E D C B A S. The grade is what a fight is decided
     on; the tier is what decides it when two grades are equal, and what says
     who limps away when they are not. A draw is now only possible between
     two cards that match on BOTH — a Captain B against a Captain B — which
     is what makes the tier the second half of the guess the player is making
     about a face-down card.

     A FIGHT LEAVES A MARK. The winner is the higher grade, then the higher
     tier; and the tier GAP decides what the fight cost:

       the loser's tier is higher   the winner is WOUNDED — it takes the
                                    cell, sits out a turn, and goes to the
                                    infirmary when the battle is over
       the winner's tier is higher  the loser is WOUNDED rather than
                                    destroyed: an enemy left standing is one
                                    the player may take PRISONER at the end
       the two tiers are equal      a clean fight, and nothing is owed

     Three specials still bend the rule the way Stratego does, and all three
     are blind to the tier — the SPY kills the Marshal, the SAPPER is the only
     card that clears a TRAP, and the SCOUT does not fight at all: it reveals
     the card it is sent at and comes back.

     EVERY OTHER GRADE HAS AN OBJECT OF ITS OWN TO BREAK. A camp is also built
     of six OBJECTS — a straw man, a fence, a rock, a forest, a skull and a
     book — which never fight: each does one thing to whoever strikes it,
     except to the ONE grade that breaks it (OBJECTS, below). So a Sergeant
     is not merely a weaker Captain: it is the card that tears the straw man
     down, and the macaron in its corner says so. Only the Marshal has none —
     it is the highest grade, and that is its whole particularity.

     A card that wins returns to the bottom of the deck; a card that loses is
     gone; a card that wins WOUNDED stays in its hand slot, greyed, for one
     turn. THE HAND IS DEALT AFRESH EVERY TURN: once a card has been played,
     every card of the hand that was not goes back under the deck too, so a
     card held back is a card given up — only a bandage or a stun keeps its
     slot. After every card sent, THE CAMP ANSWERS: it may slide one soldier
     one cell into the emptied corridor, or pass — the flag and the traps
     never move, some soldiers never do on purpose, and a card that has moved
     stays tilted for the rest of the battle (THE ENEMY'S TURN, below). The
     enemy FLAG, once found, ends the battle in a capture. The camp
     grows with the level, and a level's camp is always the same, so a second
     try is played with what the first one learned.

     WHERE THE ARMY COMES FROM. A playable and an endless run generate their
     own deck, exactly as they always did. A web build with a BARRACKS
     (packages/webshell/army.js, `web.army` in the manifest) hands the player's
     own cards over in `CONFIG.army` before the round, and the battle reports
     back what it cost: which of them were wounded, and which enemies were
     left standing to be taken prisoner. The motor knows none of it — it
     travels on `endRound`'s result like the game's own stat rows.
     =================================================================== */
  var Game = (function () {
    var P = CONFIG.play;

    /* --- the grades -----------------------------------------------------
       EVERY GRADE HAS A PAINTED FACE AND IT HAS TWO OF THEM: the blue one is
       the player's army, the red one the camp's — the same officer on both
       sides of the same war, which is what makes a card taken prisoner
       obviously the card that was just fighting back. They come off
       assets/image/master/stratideck-card-<side>-<name>.png, so there is
       nothing in the manifest to wire: a file name is the whole declaration
       (CLAUDE.md, The painted artwork).

       `art` is the cut of the object sheet that was there before them, kept as
       the fallback for a build with no artwork on disk, and 11 and 12 — the
       two enemy-only cards — have nothing else.

       13 to 18 are OBJECTS too, like the flag and the trap: cards with no
       grade and no tier, which the camp deals from the level its kind is
       unlocked at (OBJECTS, below). */
    var RANKS = {
      1:  { name: "Spy",        art: "piece08", blue: "cardBlueSpy",        red: "cardRedSpy" },
      2:  { name: "Scout",      art: "piece07", blue: "cardBlueScout",      red: "cardRedScout" },
      3:  { name: "Sapper",     art: "piece09", blue: "cardBlueSapper",     red: "cardRedSapper" },
      4:  { name: "Sergeant",                   blue: "cardBlueSergeant",   red: "cardRedSergeant" },
      5:  { name: "Lieutenant",                 blue: "cardBlueLieutenant", red: "cardRedLieutenant" },
      6:  { name: "Captain",                    blue: "cardBlueCaptain",    red: "cardRedCaptain" },
      7:  { name: "Major",                      blue: "cardBlueMajor",      red: "cardRedMajor" },
      8:  { name: "Colonel",                    blue: "cardBlueColonel",    red: "cardRedColonel" },
      9:  { name: "General",    art: "piece06", blue: "cardBlueGeneral",    red: "cardRedGeneral" },
      10: { name: "Marshal",    art: "piece05", blue: "cardBlueMarshal",    red: "cardRedMarshal" },
      11: { name: "Trap",       art: "piece04" },
      12: { name: "Flag",       art: "piece03" },
      13: { name: "Straw man",    art: "itemStraw" },
      14: { name: "Wooden fence", art: "itemFence" },
      15: { name: "Rock",         art: "itemRock" },
      16: { name: "Forest",       art: "itemForest" },
      17: { name: "Skull",        art: "itemSkull" },
      18: { name: "Book",         art: "itemBook" }
    };
    var SPY = 1, SCOUT = 2, SAPPER = 3, GENERAL = 9, MARSHAL = 10, TRAP = 11, FLAG = 12;
    var STRAW = 13, FENCE = 14, ROCK = 15, FOREST = 16, SKULL = 17, BOOK = 18;
    var CREST = { blue: "piece01", red: "piece02" };

    /* --- the objects ------------------------------------------------------
       WHAT A CAMP IS BUILT OF, AND THE ONE GRADE EACH OF THEM ANSWERS TO.
       An object never fights and never moves. Struck by its `breaker` it is
       destroyed and the card goes back to the deck like any winner; struck
       by anything else it does its `effect` and stays where it stands:

         decoy   the card goes back to the bottom of the deck
         block   the card goes back to its hand slot — the turn was spent
         stray   the card is out of this battle: neither wounded nor dead,
                 it simply never finds its way back before the end
         stun    the card goes back to its slot and never leaves it again
                 this battle — a slot of the hand taken for good
         spell   the card turns round and strikes one of its own hand, and
                 that fight is a real one: it wins, loses, wounds or is
                 wounded exactly as against the camp

       `unlock` is the first level of the climb that deals it, so the three
       that only cost a turn arrive before the three that cost a card. The
       playable and the endless run deal the first three only. `hit` is the
       callout when it acts, `lesson` the one line that names its breaker —
       said the first time that kind acts in a battle — and `broken` the
       callout when its breaker takes it down. */
    var OBJECTS = {
      13: { breaker: 4, effect: "decoy", unlock: 1,  hit: "Straw man!", broken: "Straw man torn",
            lesson: "Only a sergeant is too naive to fall for it" },
      14: { breaker: 5, effect: "block", unlock: 1,  hit: "Fence!", broken: "Fence chopped",
            lesson: "Only a lieutenant carries an axe" },
      15: { breaker: 6, effect: "block", unlock: 4,  hit: "Rock!", broken: "Rock smashed",
            lesson: "Only a captain carries a pickaxe" },
      16: { breaker: 7, effect: "stray", unlock: 8,  hit: "Lost in the forest", broken: "Forest crossed",
            lesson: "Only a major finds his way through" },
      17: { breaker: 8, effect: "stun",  unlock: 13, hit: "Stunned!", broken: "Skull shattered",
            lesson: "Only a colonel is not afraid of it" },
      18: { breaker: 9, effect: "spell", unlock: 18, hit: "Bewitched!", broken: "Book burnt",
            lesson: "Only a general can never turn traitor" }
    };
    /* ON THE WEB THE MANIFEST SAYS WHEN. `web.army.objects[].camp` is the
       first level of the climb that deals each kind, so the objects arrive
       in the biome whose end hands them to the player's own defense
       (packages/webshell/army.js, the defense): met in battle first, owned
       after. A playable reads no manifest and keeps the table above. */
    (function () {
      var list = CONFIG.web && CONFIG.web.army && CONFIG.web.army.objects;
      for (var i = 0; list && i < list.length; i++) {
        if (OBJECTS[list[i].r] && list[i].camp) OBJECTS[list[i].r].unlock = list[i].camp | 0;
      }
    })();
    /* the three that cost a card never stand on the front row: a first turn
       that loses a card for the battle is a first turn nobody played */
    var HARMLESS = { decoy: true, block: true };
    function isObject(r) { return !!OBJECTS[r]; }

    /* WHAT THE BACK OF AN OBJECT SAYS: what it does to whoever strikes it,
       and `by`, the one grade that destroys it (0 for the flag, which any
       card takes). Every object card turns over to this — in the round's
       lists and in the barracks' OBJECTS tab (packages/webshell/army.js,
       openFile) — so the rule is read where the card is, rather than learnt
       by losing a card to it. The trap and the flag are objects here too. */
    var ABOUT = {
      11: { by: SAPPER, text: "A mine hidden among the soldiers. Any card that strikes it is lost with it." },
      12: { by: 0, text: "The enemy's standard. Capture it and the battle is won on the spot, whatever still stands in the camp." },
      13: { by: 4, text: "A decoy dressed as a soldier. A card that strikes it is fooled and goes back to the bottom of the deck." },
      14: { by: 5, text: "A wall of stakes. A card that strikes it goes back to its place in the hand: the turn is wasted." },
      15: { by: 6, text: "A boulder in the way. A card that strikes it goes back to its place in the hand: the turn is wasted." },
      16: { by: 7, text: "A card that walks into it gets lost: out of the battle until the end, neither wounded nor dead." },
      17: { by: 8, text: "A card that strikes it is frozen with fear: it goes back to its place in the hand and never leaves it again this battle." },
      18: { by: 9, text: "A card that opens it is bewitched: it turns round and strikes a card of its own hand." }
    };
    /* The barracks' door into it: the text in the player's language and the
       breaker's grade, which the shell names in its own words. */
    function objectInfo(r) {
      var a = ABOUT[r];
      return a ? { text: Lang.t(a.text), by: a.by } : null;
    }

    /* WHAT THE BACK OF AN OFFICER SAYS ABOUT THEIR GRADE: the one thing that
       makes it useful, which the macaron on the face only draws — the three
       specials' rule, the object each of the next six breaks, the crown. It
       is the grade's and not the officer's, so it is read on every card of
       that grade, a stranger's or a turncoat's included (army.js, fileBack). */
    var SKILL = {
      1:  "Kills the marshal, whatever its tier. Against any other card it is the weakest of all.",
      2:  "Does not fight a hidden card: reveals it and goes back to the bottom of the deck.",
      3:  "The only grade that clears a trap without being lost with it.",
      4:  "The only grade that tears down the straw man.",
      5:  "The only grade that chops down the wooden fence.",
      6:  "The only grade that smashes the rock.",
      7:  "The only grade that crosses the forest without getting lost.",
      8:  "The only grade that shatters the skull without being stunned.",
      9:  "The only grade that burns the book without being bewitched.",
      10: "The highest grade: no soldier outranks it, but the spy kills it."
    };
    function gradeInfo(r) {
      return SKILL[r] ? Lang.t(SKILL[r]) : "";
    }

    /* --- the macaron ------------------------------------------------------
       EVERY GRADE WEARS WHAT MAKES IT USEFUL, in a round macaron in the
       bottom-left corner of the army's cards: the ability of the three
       specials, the object each of the next six breaks, the crown of the one
       that outranks everything. Lucide pictograms (assets/motor/lucide/, the
       file named on each line), inlined as DOM SVG because a card face is
       DOM: the stroke is the stylesheet's, so it follows the card. */
    var PERK = {
      1:  '<path d="m11 19-6-6"/><path d="m5 21-2-2"/><path d="m8 16-4 4"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"/>',   // sword
      2:  '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',   // eye
      3:  '<circle cx="11" cy="13" r="9"/><path d="M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95"/><path d="m22 2-1.5 1.5"/>',   // bomb
      4:  '<path d="m2 22 10-10"/><path d="m16 8-1.17 1.17"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="m8 8-.53.53a3.5 3.5 0 0 0 0 4.94L9 15l1.53-1.53c.55-.55.88-1.25.98-1.97"/><path d="M10.91 5.26c.15-.26.34-.51.56-.73L13 3l1.53 1.53a3.5 3.5 0 0 1 .28 4.62"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="m16 16-.53.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.49 3.49 0 0 1 1.97-.98"/><path d="M18.74 13.09c.26-.15.51-.34.73-.56L21 11l-1.53-1.53a3.5 3.5 0 0 0-4.62-.28"/><path d="m2 2 20 20"/>',   // wheat-off
      5:  '<path d="m14 12-8.381 8.38a1 1 0 0 1-3.001-3L11 9"/><path d="M15 15.5a.5.5 0 0 0 .5.5A6.5 6.5 0 0 0 22 9.5a.5.5 0 0 0-.5-.5h-1.672a2 2 0 0 1-1.414-.586l-5.062-5.062a1.205 1.205 0 0 0-1.704 0L9.352 5.648a1.205 1.205 0 0 0 0 1.704l5.062 5.062A2 2 0 0 1 15 13.828z"/>',   // axe
      6:  '<path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999"/><path d="M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024"/><path d="M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069"/><path d="M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z"/>',   // pickaxe
      7:  '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',   // compass
      8:  '<path d="M12.035 17.012a3 3 0 0 0-3-3l-.311-.002a.72.72 0 0 1-.505-1.229l1.195-1.195A2 2 0 0 1 10.828 11H12a2 2 0 0 0 0-4H9.243a3 3 0 0 0-2.122.879l-2.707 2.707A4.83 4.83 0 0 0 3 14a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v2a2 2 0 1 0 4 0"/><path d="M13.888 9.662A2 2 0 0 0 17 8V5A2 2 0 1 0 13 5"/><path d="M9 5A2 2 0 1 0 5 5V10"/><path d="M9 7V4A2 2 0 1 1 13 4V7.268"/>',   // hand-fist
      9:  '<path d="M18 6V4a2 2 0 1 0-4 0v2"/><path d="M20 15v6a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H10"/><rect x="12" y="6" width="8" height="5" rx="1"/>',   // book-lock
      10: '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>'   // crown
    };

    /* --- the tiers --------------------------------------------------------
       SIX STEPS AND SIX FAMILIES: E is basic, D common, C uncommon, B rare,
       A epic, S legendary — the ladder the collection is read on
       (packages/webshell/meta.css), with one step added under it so that the
       card a conscript comes with is visibly the bottom of the pile. That
       step is BRONZE and not a darker grey: two greys side by side on a
       grid read as one colour, and E against D is a call the player makes
       every turn.

       THE COLOURS ARE NOT THE SKIN'S. Grey to gold is a ladder the player
       reads as a ladder, and a game whose accent happened to be gold would
       flatten epic against legendary. Same reasoning as `Pop.text`: the
       colour is data and the rest is style. */
    var TIERS = ["E", "D", "C", "B", "A", "S"];
    var TIER_COLOR = ["#c8773f", "#aab1c6", "#51cf66", "#4dabf7", "#c77dff", "#ffd43b"];
    var TOP_TIER = TIERS.length - 1;

    /* --- what a fight pays ------------------------------------------------
       A kill pays by the grade it took down, times how TIGHT the card was: the
       tightest card that could do it (the same grade won on tier, one grade
       above, the spy on the marshal, the sapper on a trap) pays double, two
       grades above pays even, and an OVERKILL — three or more — pays half.
       That margin is the whole economy of the game: a marshal thrown blind at
       the camp wins almost every fight and earns almost nothing, so a reveal
       is worth points on its own. The bench said so in one run — a pilot that
       only ever played its biggest card out-scored a careful one four to one
       on a flat payout.

       THE TIER IS THE SECOND FACTOR, and it points the other way: a card that
       beat something better equipped than itself is worth more than one that
       walked over a conscript. A streak of wins multiplies all of it, gently. */
    var KILL = 10, TIE = 10, TRAP_CLEAR = 120, SCOUT_PAY = 15, OBJECT_PAY = 100;
    /* THE FLAG PAYS FOR THE CAMP THAT WAS BEATEN, NOT FOR THE CAMP THAT WAS
       SKIPPED. It used to be `ROUTED * (foesLeft - 1)` — a rout bonus — and on
       a small camp that read as a coup. On the big camps the climb now builds
       it was the whole score and it pointed the wrong way: a battle that
       tunnelled straight up one column to the top row and took the flag with
       twenty-six enemies still standing paid MORE than one that fought through
       them, and a deeper camp was free points rather than a longer fight. The
       bench said so in one run — a careful pilot took every level in ten to
       twenty turns of a thirty-six cell camp and won 100% of them.

       So the flag is a capture bonus over what the battle actually did, and
       finding it early is now what it should always have been: the risk that
       ends a good run. The scout is the answer to it — reading the top row
       before walking into it is what that card is for. */
    var FLAG_PAY = 260, ROUTED = 34, SURVIVOR = 30, STREAK_STEP = 0.2, STREAK_CAP = 2;
    var TIER_STEP = 0.22, TIER_MIN = 0.7, TIER_MAX = 1.9;
    /* THE STARS ARE THREE OBJECTIVES (`tally`), AND THE SCORE ECHOES THEM:
       the flag already paid for the camp that was beaten, so a capture and a
       battle without a wound now pay too — the score is what the wallet and
       the ranking read, and it should rise with the same things the stars
       do rather than beside them. */
    var CAPTIVE_PAY = 80;                       // per enemy left standing to be taken
    var UNSCATHED = 200;                        // a battle won without a wound

    /* --- colours ----------------------------------------------------------- */
    var GOLD = "#f2c14e", BLUE = "#5aa9ff", RED = "#ff5c5c", INK = "#f6f1e4";

    /* --- geometry (design px), rebuilt by geometry() ---------------------- */
    var G = {};
    var HAND_W = 118, HAND_H = 165, HAND_GAP = 10;   // the size is geometry()'s

    /* --- state --------------------------------------------------------------- */
    var grid, cols, rows, deck, hand, handSize, handSlots;
    var score, streak, bestStreak, kills, ties, losses, precise, scouted, trapsCleared;
    var reach, targets, selected, drag, turn, refills, returns, mood, lastFoe, lastWon;
    var levelD, ended, outcome, tAnim, seed, BAND, flagCell, flagTaken;
    /* THE CAMP IS PLAYED FROM MEMORY. Only the last enemy turned over stays
       face up (`lastFoe`); the one before it turns back down the moment a new
       one is revealed, and `hiding` is that card on its way over. */
    var hiding;
    /* THE COMMANDER OFFERS A SURRENDER ONCE A BATTLE: `offered` is that
       offer made, whatever the answer was (HOPELESS, below). */
    var offered;
    /* THE ENEMY'S REPLY: after every turn the camp may slide one of its
       soldiers one cell, or pass. `march` is that move while it plays. */
    var march;
    /* THE BATTLE'S OWN LEDGER, and the only thing that leaves the round: the
       ids of the player's cards that were wounded, and the enemies left
       standing. Both are empty and inert for a playable. */
    var wounded, captives, roster, met;
    /* every card of the barracks played this battle, by id: each is a
       service, and a won battle may promote it (packages/webshell/army.js) */
    var used = {};
    /* WHAT THE ROUND KEEPS TO SHOW, in the order it happened: the player's
       cards wounded (the infirmary icon), the enemies beaten (the pile in the
       top-right corner) — the captives are `captives` above (the prison). */
    var hurtCards, fallen, sheet;
    /* THE ARMY AS IT MARCHED IN, and the cards of it that fell: a tap on the
       deck pile shows the one split in two by the other. */
    var army0, lostCards, refused, prisonWarned;
    /* THE OBJECTS' SHARE OF IT: the cards a forest swallowed (out of the
       battle, neither dead nor wounded), how many objects were broken, and
       which kinds have already told the player who breaks them. */
    var strayed, smashed, taught;
    /* THE CAMP AS IT WAS DEALT, counted by grade: what the commander tells the
       player when asked (a tap on him). Grades and counts only — no tier, no
       place — so it is the start of a deduction and not the answer. */
    var muster;

    /* --- the level ------------------------------------------------------------
       The web target's level layer hands `d` (0 at the foot of the climb, 1
       at the top) before the round starts, and null for an endless run. The
       objective is the same number the map writes on its card — one lerp
       over web.levels.objective. A playable never gets the call and plays to
       its own goal. */
    function applyLevel(d) { levelD = (d == null) ? null : d; }
    function bandFor() {
      var b = CONFIG.bands;
      if (!CONFIG.level) return b[0];
      return b[clamp(Math.floor((CONFIG.level - 1) / 6), 0, b.length - 1)];
    }
    /* What opens hand slot `i`: the first band that deals into it, named
       by the level it starts at and, on the web, the biome the map calls it
       (web.levels.bands). "" when no band ever opens it. */
    function unlockLine(i) {
      var b = CONFIG.bands, L = CONFIG.web && CONFIG.web.levels && CONFIG.web.levels.bands, k, names;
      for (k = 0; k < b.length; k++) if ((b[k].hand | 0) > i) break;
      if (k >= b.length) return "";
      names = L && (L[Lang.code()] || L.en);
      return Lang.t("Unlocks at level") + " " + ((L && L.from && L.from[k]) || k * 6 + 1) +
             (names && names[k] ? " · " + names[k] : "");
    }

    /* A tiny LCG for what has to be the same every time a level is opened:
       the camp and, where the game generates one, the deck. A level is a
       puzzle the player learns, so it is seeded by the level number; the
       playable and the endless run draw from Rand instead. */
    function lcg() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    function draw() { return CONFIG.level ? lcg() : Math.random(); }
    function drawInt(n) { return Math.min(n - 1, Math.floor(draw() * n)); }
    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(draw() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    /* --- helpers ------------------------------------------------------------- */
    function font(size, weight) {
      return (weight || 900) + " " + Math.round(size) + "px -apple-system,Segoe UI,Roboto,sans-serif";
    }
    function roundRect(g, x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }
    function ease(t) { return 1 - (1 - t) * (1 - t) * (1 - t); }
    function art(key) {
      var img = ArtImages[key];
      return img && img.complete && img.naturalWidth ? img : null;
    }
    function rankName(r) { return RANKS[r].name; }
    function tierName(t) { return TIERS[clamp(t | 0, 0, TOP_TIER)]; }
    /* The one place a card is named in full, so the callouts, the readout and
       the end screen cannot disagree: MAJOR·B. The grade is translated and the
       tier is a letter, which is the same letter in every language. */
    /* WHO A CARD IS, in what the round says: the officer's own name — "Sara
       Colt", not "Scout·C" — out of the barracks' cast, where the web shell
       has one. `side` is the army the card stands in ("red" for the camp);
       a turncoat is named as the officer they were raised. An object, and a
       build with no barracks (a playable), keep the grade and the tier. */
    function cardName(card, side) {
      var AR = window.__ARMY__;
      if (AR && AR.who && card.rank <= MARSHAL) {
        return AR.who(side === "red" ? "red" : (card.o || "blue"), card.rank, card.base != null ? card.base : card.tier);
      }
      return Lang.t(rankName(card.rank)) + "·" + tierName(card.tier);
    }
    /* `o` is the army the officer was RAISED in, when it is not the one they
       fight for: "red" on a prisoner who turned (packages/webshell/army.js).
       It changes the face and nothing else — a turncoat is a card of the
       player's army in every rule of the round. `base` is the tier the
       officer was RAISED at, on a card the barracks has promoted since: the
       portrait and the name are read there, every rule and the frame at
       `tier`. */
    function card(rank, tier, id, o, base) {
      var c = { rank: rank, tier: clamp(tier | 0, 0, TOP_TIER), id: id || null, hurt: 0 };
      if (o) c.o = o;
      if (base != null && (base | 0) !== c.tier) c.base = clamp(base | 0, 0, TOP_TIER);
      return c;
    }

    /* ===================================================================
       THE CAMP AND THE ARMY
       =================================================================== */

    /* A weighted grade for a soldier: a pyramid over 2..10 (an enemy never
       needs a spy — it never attacks) leaned by `bias`, positive toward the
       high grades. A generated army comes off the same table. */
    function soldierRank(bias, min) {
      var w = { 2: 1.4, 3: 2.0, 4: 2.6, 5: 2.6, 6: 2.1, 7: 1.5, 8: 1.0, 9: 0.35, 10: 0.15 };
      var total = 0, r, x;
      for (r = min; r <= 10; r++) total += w[r] * Math.exp(bias * (r - 5) / 3);
      x = draw() * total;
      for (r = min; r <= 10; r++) {
        x -= w[r] * Math.exp(bias * (r - 5) / 3);
        if (x <= 0) return r;
      }
      return min;
    }

    /* AND A TIER FOR IT, off the same shape of table. `lvl` is 0 at the foot
       of the ladder — a camp of E and D — and 1 at the top, where S is
       ordinary. It is what the climb moves (web.levels.tune), and it is the
       second axis of a level's difficulty: level 30 is not merely a bigger
       camp, it is a better equipped one. */
    function soldierTier(lvl) {
      var w = [3.2, 3.0, 2.2, 1.3, 0.55, 0.18], bias = -1.1 + 3.4 * clamp(lvl, 0, 1);
      var total = 0, i, x;
      for (i = 0; i <= TOP_TIER; i++) total += w[i] * Math.exp(bias * (i - 2) / 2);
      x = draw() * total;
      for (i = 0; i <= TOP_TIER; i++) {
        x -= w[i] * Math.exp(bias * (i - 2) / 2);
        if (x <= 0) return i;
      }
      return 0;
    }

    /* THE CAMP IS A FORMATION, AND THE CLIMB DEALS A DIFFERENT ONE EVERY
       LEVEL. A battle is two games at once — reading where the flag is and
       remembering what was turned over — and a flag that always sat on the
       back row, usually in a corner, answered the first before the round
       began. So each formation says three things: where the flag may stand,
       which cells the strongest grades are dealt to, and where a trap goes
       first.

         keep    the flag in the middle of the back row, the officers around it
         wall    the flag anywhere at the back, the best grades on the FRONT —
                 the camp is a wall to break before it is a puzzle
         flank   the flag down one side, the guard around it
         deep    the flag in the middle of the camp with privates round it, and
                 the officers on the back row, where a flag is expected
         decoy   a trap (or an officer) in a back corner, guarded like a flag,
                 and the real one somewhere else in the back half

       Never on the front row, because a flag struck on the first turn is a
       battle nobody played. A level cycles `(L - 1) * 3 mod 5` — level 1 is
       the keep, the camp a player expects — so two levels in a row never
       share a formation, and everything inside one is drawn off the
       level's seed: a second try is the same camp, a new level is not. */
    var FORMATIONS = ["keep", "wall", "flank", "deep", "decoy"];

    function formationFor() {
      if (!CONFIG.level) return FORMATIONS[drawInt(FORMATIONS.length)];
      return FORMATIONS[(((CONFIG.level | 0) - 1) * 3) % FORMATIONS.length];
    }
    function dist(a, b) { return Math.abs(a.r - b.r) + Math.abs(a.c - b.c); }
    function pickCell(list) { return list[drawInt(list.length)]; }

    /* The cells a flag may stand on, per formation. `back` is the deepest row
       the flag is allowed on: the back row alone on a three-row camp's first
       formations, down to one row above the front on a big one. */
    function flagCells(form) {
      var out = [], r, c, back = rows - 2, half = Math.max(0, Math.floor((rows - 1) / 2));
      for (r = 0; r <= back; r++) for (c = 0; c < cols; c++) {
        var side = c === 0 || c === cols - 1, top = r === 0;
        if (form === "keep"  && top && !side) out.push({ r: r, c: c });
        if (form === "wall"  && top) out.push({ r: r, c: c });
        if (form === "flank" && side && r <= Math.max(1, half) && !(top && rows >= 4)) out.push({ r: r, c: c });
        if (form === "deep"  && r >= 1 && r <= back) out.push({ r: r, c: c });
        if (form === "decoy" && r <= Math.max(1, half) && !(top && side)) out.push({ r: r, c: c });
      }
      return out.length ? out : [{ r: 0, c: drawInt(cols) }];
    }

    /* How much a cell deserves a strong grade: the highest-scoring cells get
       the best cards. The noise is in cells, so a formation is a tendency the
       player learns to read and not a template they can recite. */
    function cellWeight(form, q, decoy) {
      var noise = draw() * 1.6;
      if (form === "wall")  return q.r + noise;
      if (form === "deep")  return -q.r - (dist(q, flagCell) <= 1 ? 2.5 : 0) + noise;
      if (form === "decoy") return -dist(q, decoy) + noise;
      return -dist(q, flagCell) + noise;                      // keep, flank
    }

    /* The camp: `known` is what the player has ever seen of a cell; a
       defeated cell is null.

       THE FLAG AND THE TRAPS CARRY A TIER TOO, and it is the camp's best:
       neither of them ever fights on it — the flag is taken by anything and a
       trap answers only to a sapper — but a card the player turns over must
       never be a card with no tier on its face. */
    function buildGrid() {
      var r, c, cells = [], i;
      var lvl = clamp(P.enemyTier == null ? 0.15 : P.enemyTier, 0, 1);
      grid = [];
      for (r = 0; r < rows; r++) {
        grid.push([]);
        for (c = 0; c < cols; c++) { grid[r].push(null); cells.push({ r: r, c: c }); }
      }
      var form = formationFor();
      flagCell = pickCell(flagCells(form));
      grid[flagCell.r][flagCell.c] = card(FLAG, TOP_TIER);

      // the decoy: a back corner the flag is not standing in
      var decoy = { r: 0, c: flagCell.c < cols / 2 ? cols - 1 : 0 };

      // the traps: the decoy's corner first, then round the flag, then anywhere
      var traps = P.traps | 0, placed = 0, q;
      var first = [];
      if (form === "decoy") first.push(decoy);
      var around = shuffle([
        { r: flagCell.r - 1, c: flagCell.c }, { r: flagCell.r + 1, c: flagCell.c },
        { r: flagCell.r, c: flagCell.c - 1 }, { r: flagCell.r, c: flagCell.c + 1 }
      ]);
      first = first.concat(around);
      for (i = 0; i < first.length && placed < traps; i++) {
        q = first[i];
        if (q.r < 0 || q.r >= rows - 1 || q.c < 0 || q.c >= cols || grid[q.r][q.c]) continue;
        grid[q.r][q.c] = card(TRAP, TOP_TIER); placed++;
      }
      shuffle(cells);
      for (i = 0; i < cells.length && placed < traps; i++) {
        q = cells[i];
        if (grid[q.r][q.c] || q.r === rows - 1) continue;   // never on the front row
        grid[q.r][q.c] = card(TRAP, TOP_TIER); placed++;
      }
      placeObjects();
      // the soldiers, the two officers among them, best grades to the cells
      // the formation weighs highest
      var free = [];
      for (i = 0; i < cells.length; i++) if (!grid[cells[i].r][cells[i].c]) free.push(cells[i]);
      var ranks = [];
      if (free.length >= 6) ranks.push(MARSHAL);
      if (free.length >= 8) ranks.push(GENERAL);
      while (ranks.length < free.length) ranks.push(soldierRank(P.enemyBias, 2));
      ranks.sort(function (a, b) { return b - a; });
      for (i = 0; i < free.length; i++) free[i].w = cellWeight(form, free[i], decoy);
      free.sort(function (a, b) { return b.w - a.w; });
      for (i = 0; i < free.length; i++) {
        var sold = card(ranks[i], soldierTier(lvl));
        /* A BLUFF, DECIDED BEFORE THE FIRST TURN: some soldiers never move.
           A card that stays put all battle is a card the player starts to
           read as a trap or the flag — which is exactly what the camp wants
           them to think. */
        sold.anchored = draw() < ANCHORED;
        grid[free[i].r][free[i].c] = sold;
      }
      muster = {};
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        var g = grid[r][c].rank;
        muster[g] = (muster[g] || 0) + 1;
      }
    }

    /* THE OBJECTS, after the traps and before the soldiers. The kinds the
       level has unlocked are shuffled and dealt round-robin, so a camp shows
       as many DIFFERENT objects as it can before it repeats one; the three
       that cost a card are kept off the front row.

       NEVER NEXT TO THE FLAG. A flag walled in by fences and rocks, against
       a deck with no lieutenant and no captain in it, is a battle that can be
       neither won nor lost — a fence sends the card back and costs nothing.
       The flag is guarded by soldiers and traps, which can always be fought
       through or died against. Every object carries the camp's best tier on
       its face, like the flag and the traps. */
    function placeObjects() {
      var n = P.objects | 0, pool = [], cells = [], r, c, i, k;
      if (n <= 0) return;
      for (k in OBJECTS) {
        if (!OBJECTS.hasOwnProperty(k)) continue;
        var O = OBJECTS[k];
        if (CONFIG.level ? O.unlock <= CONFIG.level : HARMLESS[O.effect]) pool.push(+k);
      }
      if (!pool.length) return;
      shuffle(pool);
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        if (!grid[r][c] && dist({ r: r, c: c }, flagCell) > 1) cells.push({ r: r, c: c });
      }
      shuffle(cells);
      for (i = 0; i < n && cells.length; i++) {
        var kind = pool[i % pool.length], keepBack = !HARMLESS[OBJECTS[kind].effect], spot = -1;
        for (var j = 0; j < cells.length && spot < 0; j++) {
          if (!(keepBack && cells[j].r === rows - 1)) spot = j;
        }
        if (spot < 0) continue;                 // no room behind the front row for this one
        grid[cells[spot].r][cells[spot].c] = card(kind, TOP_TIER);
        cells.splice(spot, 1);
      }
    }

    /* THE ARMY, AND THERE ARE TWO WAYS IT ARRIVES.

       A BARRACKS HANDS ONE OVER. `CONFIG.army.deck` is the deck the player
       composed, every card with an `id` of its own so the battle can name the
       ones it wounded. It is taken exactly as it stands — no officer is added
       and no count is made up — because a deck the player chose and a deck the
       game corrected are two different games.

       WITHOUT ONE THE GAME BUILDS ITS OWN, as it always has: one marshal, one
       general, one spy, the scouts, a sapper per trap (and one at least),
       soldiers to make the count, and a tier per card off the same ladder the
       camp is drawn on. That is what a playable plays and what an endless run
       plays. */
    function buildDeck() {
      var i;
      deck = [];
      roster = (CONFIG.army && CONFIG.army.deck && CONFIG.army.deck.length)
             ? CONFIG.army.deck : null;
      if (roster) {
        for (i = 0; i < roster.length; i++) {
          deck.push(card(roster[i].r, roster[i].t, roster[i].id, roster[i].o, roster[i].b));
        }
      } else {
        var n = Math.max(6, Math.round(cols * rows * P.deckRatio));
        var traps = P.traps | 0;
        var lvl = clamp(P.deckTier == null ? 0.2 : P.deckTier, 0, 1);
        var ranks = [MARSHAL, GENERAL, SPY, SCOUT, SCOUT];
        if (n >= 20) ranks.push(SCOUT);
        var sappers = Math.max(1, traps + (traps >= 3 ? 1 : 0));
        for (i = 0; i < sappers; i++) ranks.push(SAPPER);
        while (ranks.length < n) ranks.push(soldierRank(P.deckBias, 4));
        for (i = 0; i < ranks.length; i++) deck.push(card(ranks[i], soldierTier(lvl)));
      }
      army0 = deck.slice();
      shuffle(deck);
      hand = [];
      refillHand(false);
    }

    /* `wait` holds the deal back that many animation lengths, so a card
       going back under the deck has left its slot before the next one lands. */
    function refillHand(animate, wait) {
      var i;
      for (i = 0; i < handSize; i++) {
        if (hand[i] == null && deck.length) {
          hand[i] = deck.shift();
          if (animate) refills.push({ slot: i, t: -(wait || 0) });
        }
      }
    }
    /* THE HAND IS PARTLY DEALT AFRESH: once a card has been played, some of
       the cards that were not go under the deck and fly to the pile to say
       so — how many is `play.handReturn` read at the hand's size (none on two
       slots, one on three, two on four and five), which ones is drawn among
       the free ones, and the rest keep their slots. A wounded or a stunned
       card is pinned to its slot and is never drawn — so is the played card
       itself when it came back to it (a fence, a rock, a spell it survived).
       Returns how many went. */
    function returnHand(played) {
      var i, free = [], quota = (P.handReturn || [])[handSize];
      for (i = 0; i < handSize; i++) if (i !== played && pickable(i)) free.push(i);
      if (quota == null) quota = free.length;
      shuffle(free);
      free = free.slice(0, quota).sort(function (a, b) { return a - b; });
      for (i = 0; i < free.length; i++) {
        deck.push(hand[free[i]]);
        returns.push({ card: hand[free[i]], slot: free[i], t: 0 });
        hand[free[i]] = null;
      }
      return free.length;
    }
    function countHand() {
      var n = 0;
      for (var i = 0; i < handSize; i++) if (hand[i] != null) n++;
      return n;
    }
    function cardsLeft() { return deck.length + countHand(); }
    /* A WOUNDED CARD IS STILL AN ARMY, but it cannot be sent this turn. The two
       counts are told apart because the round ends on one of them and not the
       other: a hand of nothing but bandages is a turn to wait through, not a
       battle lost. */
    function readyLeft() {
      var n = deck.length;
      for (var i = 0; i < handSize; i++) if (pickable(i)) n++;
      return n;
    }
    /* What can go out NOW: a stunned card fills its slot for good, so a deck
       can still hold cards behind a hand that none of them can reach. */
    function playableNow() {
      var n = 0;
      for (var i = 0; i < handSize; i++) if (pickable(i)) n++;
      return n;
    }
    /* A trap and an object are not foes: the count is what can be fought. */
    function foesLeft() {
      var n = 0;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++)
        if (grid[r][c] && grid[r][c].rank !== TRAP && !isObject(grid[r][c].rank)) n++;
      return n;
    }

    /* ===================================================================
       REACH — where the army can strike from
       A walk from a virtual row under the camp through the cells already
       emptied, four-way; every enemy standing next to a reached cell is a
       target. The front row is reachable from the start.
       =================================================================== */
    function computeReach() {
      var r, c, i, q = [], seen = {}, k;
      reach = {}; targets = {};
      for (c = 0; c < cols; c++) q.push({ r: rows, c: c });
      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      while (q.length) {
        var p = q.shift();
        for (i = 0; i < 4; i++) {
          var nr = p.r + dirs[i][0], nc = p.c + dirs[i][1];
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          k = nr + "," + nc;
          if (seen[k]) continue;
          if (grid[nr][nc] === null) { seen[k] = true; reach[k] = true; q.push({ r: nr, c: nc }); }
          else targets[k] = true;
        }
      }
    }
    function isTarget(r, c) { return !!targets[r + "," + c]; }
    function anyTarget() { for (var k in targets) if (targets.hasOwnProperty(k)) return true; return false; }

    /* ===================================================================
       GEOMETRY — everything derives from Layout

       THE CARDS ARE AS BIG AS THE BAND LETS THEM BE, because a painted card
       is read by its picture and its two badges, and both are sized in
       percents of the card (the SKIN's `1em = 1% of the card`). The hand
       takes the whole width of Layout, the camp takes whatever height the
       hand and the info band leave, and a cell is SQUARE — the lab's grid
       formats are squares, and a square is also the widest cell a 6x6 camp
       can afford in a portrait frame.
       =================================================================== */
    var HAND_MAX = 160;           // a hand slot stops here; a row of five is width-bound
    var LIFT = 34;                // the room a picked card rises into, badges included
    var CELL_MAX = 190;
    /* The two square formats of the lab: MID carries the name plate and wants
       room; TINY is the token, whose badges are re-measured for a small card.
       A four-column camp deals 155px cells and reads as cards; from five
       columns on the plate is too small to read and TINY is the one. */
    var MID_MIN = 150;
    /* The fight is TINY AGAINST TINY: the card that leaves the hand is the
       token, `TOKEN` of a cell wide, and the enemy it meets turns over into
       the same format whatever the camp is dealt in. The hand card itself
       never leaves its slot while the token is out. */
    var TOKEN = 0.72, FIGHT_FMT = "tiny";
    /* The commander's picture (stratideck-enemy-*.png, 1148x1371): its
       height over its width, and where the face is — x of its centre, y of
       the chin — as fractions of the picture. */
    var FOE_RATIO = 1371 / 1148, FOE_FACE = [0.62, 0.46];
    /* DRAWN MIRRORED, so he looks INTO the frame — at the camp and the
       player — rather than off its right edge. The face's x is read on the
       mirrored picture. */
    var FOE_FLIP = true, FOE_FX = FOE_FLIP ? 1 - FOE_FACE[0] : FOE_FACE[0];

    function geometry() {
      var bottom = Math.min(Layout.bottom, CONFIG.designHeight - P.cornerClear);
      /* THE HAND IS A ROW OF SQUARES: the cards dealt in the lab's MID
         format, then the locked slots, all the same size so the row reads as
         one hand with room in it. */
      HAND_W = Math.floor(Math.min(HAND_MAX, (Layout.w - (handSlots - 1) * HAND_GAP) / handSlots));
      HAND_H = HAND_W;
      G.handBottom = bottom;
      G.handY = bottom - HAND_H;
      var row = handSlots * HAND_W + (handSlots - 1) * HAND_GAP;
      G.handX0 = Layout.cx - row / 2;

      G.infoH = 130;
      G.infoY = G.handY - LIFT - G.infoH;

      G.gridTop = Layout.top + 12;
      G.gridBot = G.infoY - 10;
      var gap = 12, pad = 14;
      var cw = Math.min(CELL_MAX, (Layout.w - 12 - (cols - 1) * gap) / cols);
      var maxH = (G.gridBot - G.gridTop - 2 * pad - (rows - 1) * gap) / rows;
      cw = Math.floor(Math.min(cw, maxH));
      G.cw = cw; G.ch = cw; G.gap = gap;
      G.fmt = cw >= MID_MIN ? "mid" : "tiny";
      var gw = cols * cw + (cols - 1) * gap, gh = rows * cw + (rows - 1) * gap;
      G.gx0 = Layout.cx - gw / 2;
      G.gy0 = G.gridTop + pad + Math.max(0, (G.gridBot - G.gridTop - 2 * pad - gh) / 2);
      G.gw = gw; G.gh = gh;
      /* the army's card on a cell it strikes: a TOKEN, the same tiny format
         as the enemy it meets, a little smaller and offset so both read */
      G.tw = Math.round(cw * TOKEN); G.ax = -cw * 0.34; G.ay = cw * 0.3;

      /* THE INFO BAND IS THE PLAYER'S SIDE: the deck pile on the left, the
         infirmary and the prison on the right — the two tents of the village,
         each the door to its list. */
      G.deckW = 70; G.deckH = Math.round(G.deckW * 1.4);
      G.deckX = Layout.left + 6;
      G.deckY = G.infoY + G.infoH - G.deckH;
      G.doorW = 124; G.doorH = Math.round(G.doorW * 297 / 420);
      G.doorY = G.infoY + G.infoH - G.doorH - 24;
      G.prisonX = Layout.right - G.doorW;
      G.infX = G.prisonX - G.doorW - 6;

      /* THE TOP-RIGHT CORNER IS THE ENEMY'S SIDE: under the HUD's foe count,
         the pile of what the camp has lost; left of it, the commander.

         THE COMMANDER STANDS BEHIND HIS CAMP. He is drawn big, in the table
         layer UNDER the camp's panel and its cards, placed so his FACE clears
         the top edge of the panel and the rest of him is hidden by the board
         — the face is what the player reads his mood off, and a whole figure
         shrunk into the HUD band was a face nobody could see. `FOE_FACE` is
         where the face sits in his picture (x centre, y of the chin), so the
         chin lands on the panel's edge whatever height the camp is dealt at.
         The HUD's own gradient lies over his hat and barely touches his face. */
      var hudTop = view.insetTop;
      G.pileW = 58;
      G.pileCx = Layout.right - 45;
      G.pileCy = hudTop + 94 + G.pileW / 2;
      G.panelTop = G.gy0 - 14;
      G.foeW = 260; G.foeH = Math.round(G.foeW * FOE_RATIO);
      G.foeX = Layout.right - 175 - G.foeW * FOE_FX;
      G.foeY = G.panelTop - G.foeH * FOE_FACE[1];
    }
    function cellX(c) { return G.gx0 + c * (G.cw + G.gap); }
    function cellY(r) { return G.gy0 + r * (G.ch + G.gap); }
    function cellAt(p) {
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var x = cellX(c), y = cellY(r);
        if (p.x >= x - 6 && p.x <= x + G.cw + 6 && p.y >= y - 6 && p.y <= y + G.ch + 6) return { r: r, c: c };
      }
      return null;
    }
    function handX(i) { return G.handX0 + i * (HAND_W + HAND_GAP); }
    function handAt(p) {
      if (p.y < G.handY - 40 || p.y > G.handBottom + 10) return -1;
      for (var i = 0; i < handSlots; i++) {
        if (i < handSize && hand[i] == null) continue;
        var x = handX(i);
        if (p.x >= x - 8 && p.x <= x + HAND_W + 8) return i;
      }
      return -1;
    }

    /* ===================================================================
       LIFECYCLE
       =================================================================== */
    function reset() {
      BAND = bandFor();
      Art.backdrop(BAND.scene);
      seed = ((CONFIG.level | 0) * 7919 + 12345) >>> 0;
      cols = Math.max(2, P.cols | 0); rows = Math.max(2, P.rows | 0);
      handSize = Math.max(2, (BAND.hand || P.handSize) | 0);
      handSlots = Math.max(handSize, P.handSlots | 0);
      geometry();
      tableClear();
      refills = []; returns = [];
      wounded = {}; captives = []; hurtCards = []; fallen = []; lostCards = []; met = []; refused = []; prisonWarned = false;
      used = {};
      strayed = []; smashed = 0; taught = {};
      sheetClose();
      buildGrid();
      buildDeck();
      computeReach();
      score = 0; streak = 0; bestStreak = 0;
      kills = 0; ties = 0; losses = 0; precise = 0; scouted = 0; trapsCleared = 0;
      selected = -1; drag = null; turn = null; march = null; ended = false; outcome = null; tAnim = 0;
      mood = "neutral"; lastFoe = null; lastWon = null; hiding = null;
      flagTaken = false; offered = false;
      HUD.setScoreNow(0);
      showCounts();
      Fx.reset();
      Music.play(CONFIG.level ? BAND.music : null);
    }
    /* The motor lays the frame out before any round exists (the intro, a
       turn of the device on the menu): nothing to place then — reset()
       builds the camp from Layout when the round starts. */
    function onResize() {
      if (!grid) return;
      geometry();
    }
    function showCounts() {
      var left = cardsLeft();
      HUD.setLeft(left, CONFIG.copy.cardsLabel, left <= 2 ? "warn" : "");
      HUD.setRight(foesLeft(), CONFIG.copy.foesLabel);
    }

    /* ===================================================================
       INPUT — pick a card, send it at a cell; or drag it there
       =================================================================== */
    /* A BANDAGED CARD IS NOT PICKED UP AT ALL. It is answered rather than
       ignored: a slot that does nothing under the finger reads as a dead
       screen, and the one thing the player needs told is that it comes back
       next turn. */
    function pickable(i) { return hand[i] != null && !hand[i].hurt && !hand[i].stun; }

    function inBox(p, x, y, w, h) { return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h; }
    /* The five things on the table that open a list: the beaten pile, the
       two tents, the deck pile and the commander's face — the part of him
       above the board. */
    function zoneAt(p) {
      var ph = G.pileW / 2 + 10;
      if (inBox(p, G.pileCx - ph, G.pileCy - ph, ph * 2, ph * 2)) return "beaten";
      if (inBox(p, G.infX, G.doorY - 6, G.doorW, G.doorH + 30)) return "infirmary";
      if (inBox(p, G.prisonX, G.doorY - 6, G.doorW, G.doorH + 30)) return "prison";
      if (inBox(p, G.deckX - 6, G.deckY - 16, G.deckW + 18, G.deckH + 22)) return "army";
      var top = Math.max(view.insetTop, G.foeY), fx = G.foeX + G.foeW * FOE_FX;
      if (inBox(p, fx - G.foeW * 0.35, top, G.foeW * 0.7, G.panelTop - top)) return "camp";
      return null;
    }
    /* ON A DESK THE MOUSE SAYS WHAT IS CLICKABLE. The canvas takes every
       pointer — the cards and the commander are layers under it — so the hand
       cursor is the canvas's, set while the mouse is over one of the zones
       above. A finger never sees it. */
    var cursorOn = false;
    function hover(p) {
      var on = sheet ? !!sheetFileAt(p) : !drag && (!!zoneAt(p) || !!foeUpAt(p));
      if (on === cursorOn) return;
      cursorOn = on;
      var cv = document.getElementById("game");
      if (cv) cv.style.cursor = on ? "pointer" : "";
    }
    function onDown(p) {
      if (ended || State !== "playing") return;
      /* the lists: a tap on an officer opens their file, a tap anywhere else
         puts the list away, and a tap on a pile or a tent opens it — between
         turns or during one, since nothing is chosen */
      if (sheet) {
        var at = sheetFileAt(p);
        if (at) window.__ARMY__.file(at._file, at._file.team, at.querySelector(".card") || at);
        else sheetClose();
        return;
      }
      var zone = zoneAt(p);
      if (zone) { sheetOpen(zone); return; }
      if (turn || march) return;
      var i = handAt(p);
      if (i >= handSize) {
        /* A LOCKED SLOT IS ANSWERED TOO, for the same reason a bandage is:
           a slot that does nothing under the finger reads as a dead screen. */
        Sound.clip("warn", 0.35, 0.9);
        Pop.show("alert", { word: "Slot locked", sub: unlockLine(i) });
        return;
      }
      if (i >= 0) {
        if (!pickable(i)) {
          Sound.clip("warn", 0.35, 0.9);
          if (hand[i].stun) Notify.say("Stunned for the battle", { kind: "warn", icon: "lock" });
          else Notify.say("Still wounded", { kind: "warn", icon: "hourglass" });
          return;
        }
        selected = i;
        drag = { i: i, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false };
        Sound.clip("pick", 0.45, 1 + i * 0.03);
        return;
      }
      var cell = cellAt(p), armed = selected >= 0 && pickable(selected);
      if (cell && armed && isTarget(cell.r, cell.c)) { attack(selected, cell.r, cell.c); return; }
      /* a card picked and a target in reach is a strike; anything else on
         the one enemy face up is a question about it */
      if (foeUpAt(p)) { foeOpen(cell); return; }
      if (cell && armed) {
        if (grid[cell.r][cell.c]) {
          Sound.clip("warn", 0.35, 1.2);
          Pop.show("alert", { word: "Out of reach" });
        }
        return;
      }
      selected = -1;
    }
    /* THE ENEMY FACE UP IS A DOOR TOO. The camp is played from memory and
       the card just turned over is the one the player is reading, so a tap
       on it opens it at full size, the way a card of the lists does — its
       file, or what an object does and who breaks it. Between turns only:
       a card mid-fight or mid-march is not standing where it is drawn. Only
       where the web shell's barracks is there to show it. */
    function foeUpAt(p) {
      if (turn || march || !lastFoe || !window.__ARMY__ || !window.__ARMY__.file) return null;
      var cell = cellAt(p);
      return cell && grid[cell.r][cell.c] === lastFoe ? cell : null;
    }
    function foeOpen(cell) {
      var f = fileOf(lastFoe, "red");
      if (cursorOn) { cursorOn = false; document.getElementById("game").style.cursor = ""; }
      drag = null;
      window.__ARMY__.file(f, f.team, Table.nodes[cellKey(cell.r, cell.c)]);
    }
    function onMove(p) {
      if (!ended && State === "playing") hover(p);
      if (!drag) return;
      drag.x = p.x; drag.y = p.y;
      if (Math.abs(p.x - drag.sx) + Math.abs(p.y - drag.sy) > 14) drag.moved = true;
    }
    function onUp(p) {
      if (!drag) return;
      var d = drag; drag = null;
      if (ended || turn || march) return;
      if (!d.moved) return;                       // a tap: the card stays picked
      var cell = cellAt(p);
      if (cell && isTarget(cell.r, cell.c)) { attack(d.i, cell.r, cell.c, { x: p.x, y: p.y - DRAG_UP, s: DRAG_S }); return; }
      if (cell && grid[cell.r][cell.c]) {
        Sound.clip("warn", 0.35, 1.2);
      }
    }

    /* ===================================================================
       THE FIGHT
       =================================================================== */

    /* The verdict, before anything moves: what happens to the attacker, to
       the defender, and what it pays.

       THE GRADE FIRST, THE TIER SECOND, AND THE TIER GAP LAST. `margin` is how
       far above the defender the attacker's grade was — 0 when the two grades
       matched and the tier settled it, which is the tightest win there is.
       `hurt` says who limps away: "a" the attacker, "d" the defender, nothing
       when the two tiers matched.

       The three specials are blind to the tier on purpose. A spy kills the
       marshal because it is a spy; a sapper clears a trap because it is a
       sapper; a scout reveals because it is a scout. Putting a letter in front
       of any of those turns a rule the player can recite into a rule they have
       to look up. */
    function judge(a, foe) {
      var d = foe.rank;
      if (d === FLAG)  return { kind: "flag" };
      /* a scout REVEALS — a card already turned over leaves it nothing to
         do but fight, which a grade 2 mostly loses */
      if (a.rank === SCOUT && !foe.known) return { kind: "scout" };
      if (d === TRAP)  return a.rank === SAPPER ? { kind: "clear" } : { kind: "trap" };
      /* an object is broken by its one grade and answers everyone else its
         own way — blind to the tier, like the specials */
      if (isObject(d)) return a.rank === OBJECTS[d].breaker ? { kind: "smash" } : { kind: OBJECTS[d].effect };
      if (a.rank === SPY && d === MARSHAL) return { kind: "win", margin: 1, hurt: null };
      if (a.rank > d)  return { kind: "win", margin: a.rank - d, hurt: toll(a, foe) };
      if (a.rank < d)  return { kind: "lose" };
      /* SAME GRADE: the tier is the whole of it, and equal on both is the one
         draw left in the game. */
      if (a.tier > foe.tier) return { kind: "win", margin: 0, hurt: "d" };
      if (a.tier < foe.tier) return { kind: "lose" };
      return { kind: "tie" };
    }

    /* ===================================================================
       THE DEFENSE — the player's own camp, stormed while they are away
       =================================================================== */

    /* THE SAME RULES, THE OTHER WAY ROUND. The barracks lets the player lay
       out a camp of their own — a flag, their cards, the objects the climb
       gave them (packages/webshell/army.js, the defense) — and while they are
       away the red army may storm it. How well it holds is not a formula over
       where things stand: it is this function playing the assault, many
       times, with `judge` and every object's effect exactly as a battle
       plays them. A flag left in the open falls because the attacker walks
       up to it, not because a rule said the back row is safer.

       `cells` is the grid row by row, `rows * cols` entries of null or
       `{ r, t, id }` (an object carries no tier and no id); row `rows - 1` is
       the FRONT, the one the attacker reaches first, as the camp's bottom row
       is in a battle. `army` is the attacker's deck, `{ r, t }` each — the
       barracks mirrors it off the player's own roster. The attacker plays the
       way a careful player does: it takes a flag it can see, sends the
       tightest card that beats a card it has already turned over, sends a
       scout at what it cannot see, and otherwise probes the dark with a
       middling card, leaning toward the back where flags are kept. The camp
       never moves and never strikes back — a defense is a layout.

       AN ASSAULT IS A RAID, NOT A SIEGE: it lasts `turns` cards sent, then
       the attacker has to be gone before the camp wakes. Without that bound
       a winner going back under the deck wins forever — the marshal walks
       through every wall given the night — and every defense falls; with it,
       what a layout buys is TIME, which is exactly what a fence, a straw man
       and a flag kept deep are for.

       Returns the share of assaults held over `runs`, and one more assault
       played out in full (`run`), which is the one that HAPPENED: who of the
       player's cards was beaten, which of the attacker's fell, and the LOG —
       every card sent, in the order it was sent, against what and how it
       went (`judge`'s kind, and `hurt` on a win), which the barracks' report
       tab reads back as a list of duels. */
    var DEF_HAND = 4;

    function defenseRun(cells, cols, rows, army, turns, rnd) {
      var g = [], known = [], deck = [], hand = [], beaten = [], fallen = [], log = [], i, k, turn;
      for (i = 0; i < cells.length; i++) {
        g.push(cells[i] ? { rank: cells[i].r, tier: cells[i].t | 0, id: cells[i].id != null ? cells[i].id : null } : null);
        known.push(false);
      }
      for (i = 0; i < army.length; i++) deck.push({ rank: army[i].r, tier: army[i].t | 0, stun: false });
      for (i = deck.length - 1; i > 0; i--) {
        k = Math.floor(rnd() * (i + 1));
        var sw = deck[i]; deck[i] = deck[k]; deck[k] = sw;
      }
      function deal() { while (hand.length < DEF_HAND && deck.length) hand.push(deck.shift()); }
      /* WHAT THE ATTACKER CAN STRIKE: the front row, then whatever stands
         next to ground it has opened — an empty cell is open ground from the
         start, which is what makes a hole in the wall a way in. */
      function reach() {
        var open = {}, seen = {}, stack = [], out = [], c, r, n, d;
        for (c = 0; c < cols; c++) {
          k = (rows - 1) * cols + c;
          if (g[k]) { if (!seen[k]) { seen[k] = 1; out.push(k); } }
          else if (!open[k]) { open[k] = 1; stack.push(k); }
        }
        while (stack.length) {
          k = stack.pop(); r = Math.floor(k / cols); c = k % cols;
          var near = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
          for (d = 0; d < 4; d++) {
            if (near[d][0] < 0 || near[d][0] >= rows || near[d][1] < 0 || near[d][1] >= cols) continue;
            n = near[d][0] * cols + near[d][1];
            if (g[n]) { if (!seen[n]) { seen[n] = 1; out.push(n); } }
            else if (!open[n]) { open[n] = 1; stack.push(n); }
          }
        }
        return out;
      }
      function weakest(live) {
        var b = live[0];
        for (var j = 1; j < live.length; j++) if (hand[live[j]].rank * 10 + hand[live[j]].tier < hand[b].rank * 10 + hand[b].tier) b = live[j];
        return b;
      }
      /* deeper cells weigh more: that is where a flag is looked for */
      function pickDark(list) {
        var tot = 0, j, x;
        for (j = 0; j < list.length; j++) tot += 1 + 0.5 * (rows - 1 - Math.floor(list[j] / cols));
        x = rnd() * tot;
        for (j = 0; j < list.length; j++) {
          x -= 1 + 0.5 * (rows - 1 - Math.floor(list[j] / cols));
          if (x <= 0) return list[j];
        }
        return list[list.length - 1];
      }
      function choose(targets, live) {
        var j, h, q, v, best = null, dark = [], soft = [], score;
        for (j = 0; j < targets.length; j++) {
          q = targets[j];
          if (!known[q]) { dark.push(q); continue; }
          if (g[q].rank === FLAG) return { q: q, h: weakest(live) };
          if (isObject(g[q].rank) && HARMLESS[OBJECTS[g[q].rank].effect]) soft.push(q);
          for (h = 0; h < live.length; h++) {
            v = judge(hand[live[h]], { rank: g[q].rank, tier: g[q].tier, known: true });
            if (v.kind === "win") score = 20 - v.margin * 2 - (v.hurt === "a" ? 3 : 0);
            else if (v.kind === "smash" || v.kind === "clear") score = 22;
            else continue;
            if (!best || score > best.s) best = { q: q, h: live[h], s: score };
          }
        }
        if (best) return best;
        if (dark.length) {
          for (h = 0; h < live.length; h++) if (hand[live[h]].rank === SCOUT) return { q: pickDark(dark), h: live[h] };
          var byRank = live.slice().sort(function (a, b) { return hand[a].rank - hand[b].rank; });
          return { q: pickDark(dark), h: byRank[Math.floor(byRank.length / 2)] };
        }
        /* nothing to beat and nothing unseen: a harmless object only costs a
           turn, and a turn is a new hand */
        if (soft.length) return { q: soft[Math.floor(rnd() * soft.length)], h: weakest(live) };
        /* ...and what is left is a card it cannot beat: it throws its
           weakest at the weakest of them, since standing still takes nothing */
        var low = targets[0];
        for (j = 1; j < targets.length; j++) if (g[targets[j]].rank < g[low].rank) low = targets[j];
        return { q: low, h: weakest(live) };
      }
      deal();
      for (turn = 0; turn < turns; turn++) {
        var live = [];
        for (i = 0; i < hand.length; i++) if (!hand[i].stun) live.push(i);
        if (!live.length) break;              // nothing left to send: the camp held
        var targets = reach();
        if (!targets.length) break;
        var mv = choose(targets, live), a = hand[mv.h], q = mv.q, foe = g[q];
        var v = judge(a, { rank: foe.rank, tier: foe.tier, known: known[q] }), back = true, gone = null;
        known[q] = true;
        log.push({ a: { r: a.rank, t: a.tier }, d: { r: foe.rank, t: foe.tier, id: foe.id }, k: v.kind, hurt: v.hurt || null });
        switch (v.kind) {
          case "flag": return { held: false, beaten: beaten, fallen: fallen, log: log, turns: turn + 1 };
          case "trap": back = false; fallen.push(a); g[q] = null; break;
          case "clear": case "smash": g[q] = null; break;
          case "stray": back = false; break;
          case "stun": a.stun = true; break;
          case "spell":
            var allies = [];
            for (i = 0; i < hand.length; i++) if (i !== mv.h) allies.push(i);
            if (allies.length) {
              var b = hand[allies[Math.floor(rnd() * allies.length)]];
              var sv = judge(a, { rank: b.rank, tier: b.tier, known: true });
              if (sv.kind === "win") gone = b;
              else if (sv.kind === "lose") back = false;
              else { back = false; gone = b; }
            }
            break;
          case "win": if (foe.id != null) beaten.push(foe.id); g[q] = null; break;
          case "lose": back = false; fallen.push(a); break;
          case "tie": back = false; fallen.push(a); if (foe.id != null) beaten.push(foe.id); g[q] = null; break;
        }
        /* THE HAND IS DEALT AFRESH, as in a battle: every card but a stunned
           one goes back under the deck, the one sent included when it came
           back, and four are dealt. */
        var keep = [];
        for (i = 0; i < hand.length; i++) {
          var hc = hand[i];
          if (hc === gone) continue;
          if (hc.stun) { keep.push(hc); continue; }
          if (hc === a && !back) continue;
          deck.push(hc);
        }
        hand = keep;
        deal();
      }
      return { held: true, beaten: beaten, fallen: fallen, log: log, turns: turn };
    }

    function defenseSim(cells, cols, rows, army, opt) {
      var n = Math.max(1, (opt && opt.runs) | 0 || 200), turns = Math.max(1, (opt && opt.turns) | 0 || 14), held = 0, i;
      for (i = 0; i < n; i++) if (defenseRun(cells, cols, rows, army, turns, Math.random).held) held++;
      return { held: held / n, runs: n, run: defenseRun(cells, cols, rows, army, turns, Math.random) };
    }

    /* WHO PAYS FOR A WIN THE GRADE ALREADY DECIDED. The loser's tier standing
       above the winner's is a card that was better equipped and lost anyway —
       it takes a piece of the winner with it. The other way round the fight
       was one-sided enough that the loser is left standing rather than
       destroyed, which is what makes it a prisoner worth taking. */
    function toll(a, foe) {
      if (foe.tier > a.tier) return "a";
      if (a.tier > foe.tier) return "d";
      return null;
    }

    /* THE BOOK'S SPELL: the card turns round and strikes one of its own hand,
       picked before anything moves so the duel can show who. It is the same
       fight as against the camp, read from both sides — the grade decides,
       the tier settles equal grades, and the tier gap decides what it costs:
       a winner whose tier was lower is wounded, a loser whose tier was lower
       is left standing — WOUNDED, since an ally cannot be taken prisoner —
       rather than killed. A card that survives goes back to its own slot:
       it never left the hand, it only turned round in it. With nobody else in
       the hand the spell finds no one and the card simply comes back. */
    function bewitch(a, i) {
      var picks = [], j;
      for (j = 0; j < handSize; j++) if (j !== i && hand[j]) picks.push(j);
      if (!picks.length) return { kind: "spell", ally: -1 };
      j = picks[drawInt(picks.length)];
      var b = hand[j], v = judge(a, { rank: b.rank, tier: b.tier, known: true });
      var out = { kind: "spell", ally: j, b: b, res: v.kind,
                  deadA: false, hurtA: false, deadB: false, hurtB: false };
      if (v.kind === "win") {
        out.hurtA = v.hurt === "a";
        out.hurtB = v.hurt === "d";
        out.deadB = !out.hurtB;
      } else if (v.kind === "lose") {
        var t = toll(b, a);
        out.hurtB = t === "a";
        out.hurtA = t === "d";
        out.deadA = !out.hurtA;
      } else {
        out.deadA = out.deadB = true;
      }
      return out;
    }

    /* A WOUND, wherever it comes from: the card stays in its hand slot for
       this turn and the next, and goes on the infirmary's list — WHEN THERE
       IS A BED. The barracks has six (`CONFIG.army.beds` is how many are
       free when the battle starts); a card of the player's own that finds
       none is refused, and a wound nobody can treat is a card lost: it
       leaves the battle on the spot, the barracks strikes it off the roster
       (`ledger`, `dead`), and the notice says so now rather than later. A
       conscript has no id and never reaches a bed, so it is always taken in.
       `slot` is the hand slot the card stands in, emptied on a refusal.
       Returns whether the card was admitted. */
    function wound(c, slot, gap) {
      var beds = CONFIG.army && CONFIG.army.beds;
      if (c.id && beds != null && !wounded[c.id] && Object.keys(wounded).length >= beds) {
        refused.push(c);
        lostCards.push(c);
        losses++;
        if (slot != null && hand[slot] === c) hand[slot] = null;
        Notify.say("Infirmary full", { sub: cardName(c) + " · " + Lang.t("Card lost"), kind: "loss", icon: "heart" });
        return false;
      }
      c.hurt = 2;
      /* the tier gap is kept, the widest if the card is hurt twice: it is how
         long the barracks keeps the card in the infirmary (`ledger`) */
      if (c.id) wounded[c.id] = Math.max(wounded[c.id] || 0, gap || 1);
      if (hurtCards.indexOf(c) < 0) hurtCards.push(c);
      return true;
    }

    function mult() { return Math.min(STREAK_CAP, 1 + STREAK_STEP * Math.max(0, streak - 1)); }
    /* What the tier gap is worth: beating something better equipped pays more
       than walking over a conscript, clamped both ways so it stays a nudge
       rather than the whole score. */
    function tierPay(a, foe) {
      return clamp(1 + TIER_STEP * (foe.tier - a.tier), TIER_MIN, TIER_MAX);
    }

    /* `from` is where the token sets off: the finger that let go of it, or
       the hand card it springs out of when the cell was tapped. */
    function attack(i, r, c, from) {
      var a = hand[i], foe = grid[r][c];
      if (a == null || a.hurt || a.stun || !foe) return;
      selected = -1;
      if (a.id) used[a.id] = 1;               // a service, for the barracks (`ledger`)
      var verdict = judge(a, foe);
      if (verdict.kind === "spell") verdict = bewitch(a, i);
      turn = {
        i: i, r: r, c: c, a: a, foe: foe, verdict: verdict,
        state: "fly", t: 0, wasUp: foe === lastFoe,
        from: from || { x: handX(i) + HAND_W / 2, y: G.handY + HAND_H / 2 - LIFT_SEL, s: 0.6 }
      };
      hand[i] = null;
      Sound.clip("place", 0.5, 1);
    }

    /* AN OBJECT STRUCK BY THE WRONG GRADE. Nothing is beaten and the object
       stays where it stands; what happens to the card is the object's own
       effect (OBJECTS). The callout is the moment, and the first time a kind
       acts in a battle one Notify names the grade that breaks it — the rule
       is learnt from the mistake it answers, not from a page of rules. */
    function objectHit(T, O) {
      var v = T.verdict, a = T.a;
      streak = 0;
      lastWon = false; mood = "happy";
      Pop.show("alert", { word: O.hit });
      if (v.kind === "decoy") {
        deck.push(a);
        Sound.clip("place", 0.5, 0.8);
      } else if (v.kind === "block") {
        hand[T.i] = a;
        Sound.clip("lose", 0.45, 1.3);
        Fx.shake(6, 0.2);
      } else if (v.kind === "stray") {
        strayed.push(a);
        Sound.clip("lose", 0.5, 0.8);
        Pop.show("alert", { word: "Out of the battle", sub: cardName(a) });
      } else if (v.kind === "stun") {
        a.stun = true;
        hand[T.i] = a;
        Sound.clip("tie", 0.55, 0.7);
        Fx.flash("#9b6bff", 0.25, 2.5);
        Notify.say("Stunned for the battle", { sub: cardName(a), kind: "loss", icon: "hourglass" });
      } else if (v.kind === "spell") {
        spellLands(T);
      }
      if (!taught[T.foe.rank]) {
        taught[T.foe.rank] = true;
        Notify.say(O.lesson, { kind: "info", icon: "info" });
      }
    }

    /* The spell's fight, landed (bewitch picked it): who falls, who limps. */
    function spellLands(T) {
      var v = T.verdict, a = T.a, b = v.b;
      Fx.flash("#9b6bff", 0.3, 2.2);
      if (v.ally < 0) {
        hand[T.i] = a;
        Sound.clip("place", 0.45, 0.7);
        Notify.say("The spell hits no one", { kind: "info", icon: "sparkles" });
        return;
      }
      Sound.clip(v.res === "tie" ? "tie" : "lose", 0.6, 0.9);
      Fx.shake(9, 0.25);
      if (v.deadB) { lostCards.push(b); hand[v.ally] = null; losses++; }
      else if (v.hurtB) wound(b, v.ally, Math.abs(a.tier - b.tier));
      if (v.deadA) { lostCards.push(a); losses++; }
      else { hand[T.i] = a; if (v.hurtA) wound(a, T.i, Math.abs(a.tier - b.tier)); }
      var fell = v.deadA && v.deadB ? "Both fall"
               : v.deadB ? "An ally falls"
               : v.deadA ? "Struck down by an ally"
               : v.hurtB ? "An ally is wounded" : "Wounded by an ally";
      Pop.show("alert", { word: fell, sub: cardName(a) + " → " + cardName(b) });
    }

    /* The verdict lands: the camp and the deck are updated here, once, at
       the moment of the clash — everything after it is the picture catching
       up. */
    function resolve(T) {
      var v = T.verdict, foe = T.foe, a = T.a, pts = 0, O = OBJECTS[foe.rank];
      if (v.kind === "flag" || v.kind === "clear" || v.kind === "smash" || v.kind === "win" || v.kind === "tie") fallen.push(foe);
      var cx = cellX(T.c) + G.cw / 2, cy = cellY(T.r) + G.ch / 2;
      /* every enemy card turned over, once: the barracks' collection is
         filled from it (`ledger`) */
      if (!foe.known) met.push({ r: foe.rank, t: foe.tier });
      foe.known = true;
      if (lastFoe && lastFoe !== foe) hiding = { card: lastFoe, t: 0 };
      lastFoe = foe;

      if (v.kind === "scout") {
        scouted++;
        deck.push(a);
        pts = SCOUT_PAY;
        lastWon = null; mood = "neutral";
        Sound.clip("flip", 0.6, 1.3);
        Notify.say(Lang.t("Spotted") + ": " + cardName(foe, "red"), { kind: "info", icon: "eye" });
      } else if (v.kind === "flag") {
        pts = FLAG_PAY + ROUTED * kills;      // what was BEATEN, not what was skipped
        flagTaken = true;
        grid[T.r][T.c] = null;
        deck.push(a);
        kills++; streak++;
        lastWon = true; mood = "sad";
        Sound.clip("flag", 0.8, 1);
        Fx.flash(GOLD, 0.5, 2.5); Fx.shake(16, 0.4); Fx.freeze(0.1);
        Fx.ring(cx, cy, { from: 40, to: 700, color: GOLD, width: 10, life: 0.6 });
        Pop.show("record", { word: CONFIG.copy.flagTaken, sub: "+" + pts });
      } else if (v.kind === "clear") {
        pts = Math.round(TRAP_CLEAR * mult());
        grid[T.r][T.c] = null;
        deck.push(a);
        trapsCleared++; streak++;
        lastWon = true; mood = "sad";
        Sound.clip("win", 0.6, 1.1);
        Fx.burst(cx, cy, { color: [GOLD, "#ffffff"], count: 16, speed: 360, life: 0.5, grav: 500 });
        Pop.show("bonus", { word: "Trap cleared", sub: "+" + pts });
      } else if (v.kind === "smash") {
        /* THE ONE GRADE THE OBJECT ANSWERS TO: it goes, and the card goes
           back to the deck like any winner. */
        pts = Math.round(OBJECT_PAY * mult());
        grid[T.r][T.c] = null;
        deck.push(a);
        smashed++; streak++;
        if (streak > bestStreak) bestStreak = streak;
        lastWon = true; mood = "sad";
        Sound.clip("win", 0.6, 1.05);
        Fx.burst(cx, cy, { color: [GOLD, BLUE, "#ffffff"], count: 16, speed: 360, life: 0.5, grav: 500 });
        Pop.show("bonus", { word: O.broken, sub: "+" + pts });
      } else if (O) {
        objectHit(T, O);
      } else if (v.kind === "trap") {
        lostCards.push(a);
        losses++; streak = 0;
        lastWon = false; mood = "happy";
        Sound.clip("trap", 0.7, 1);
        Fx.flash(RED, 0.4, 2.2); Fx.shake(14, 0.35); Fx.freeze(0.06);
        Fx.burst(cx, cy, { color: [RED, "#3a0a0a"], count: 18, speed: 420, life: 0.5, grav: 600 });
        Pop.show("alert", { word: "Trap!" });
      } else if (v.kind === "win") {
        streak++;
        if (streak > bestStreak) bestStreak = streak;
        var tight = v.margin <= 1 ? 2 : v.margin === 2 ? 1 : 0.5;
        pts = Math.round(KILL * foe.rank * tight * tierPay(a, foe) * mult());
        grid[T.r][T.c] = null;
        kills++;
        if (v.margin <= 1) precise++;
        lastWon = true; mood = "sad";
        Sound.clip("win", 0.6, 0.9 + foe.rank * 0.03);
        Fx.burst(cx, cy, { color: [GOLD, BLUE, "#ffffff"], count: 14, speed: 380, life: 0.5, grav: 500 });
        Fx.shake(6, 0.2);

        if (v.hurt === "a") {
          /* A WIN THAT COST SOMETHING. The card takes the cell and stays in the
             slot it was sent from, bandaged, unable to go out again until the
             turn after next — and it is on the infirmary's list for as long as
             the barracks says when the battle is over. It does NOT go to the
             bottom of the deck: a wound the player cannot see is a rule
             nobody learns, and the slot it occupies is what the wound costs. */
          hand[T.i] = a;
          Sound.clip("tie", 0.5, 1.25);
          Fx.burst(cx, cy, { color: [RED, "#ffd0d0"], count: 10, speed: 260, life: 0.45, grav: 420 });
          if (wound(a, T.i, foe.tier - a.tier)) Notify.say("Wounded", { sub: cardName(a), kind: "loss" });
        } else {
          deck.push(a);
          if (v.hurt === "d" && foe.rank <= MARSHAL) {
            /* AN ENEMY LEFT STANDING. The cell is taken either way — this is
               not a fight the player has to finish — but a card beaten by
               something plainly better is one that can be talked into
               changing sides, and the end of a won battle is where that is
               offered (packages/webshell/army.js). */
            var cells = CONFIG.army && CONFIG.army.cells;
            if (cells != null && captives.length >= cells) {
              /* NO CELL FOR THEM. The barracks' prison has six, and a
                 prisoner with nowhere to go is not taken: said once, on the
                 first one turned away. */
              if (!prisonWarned) {
                prisonWarned = true;
                Notify.say("Prison full", { sub: cardName(foe, "red") + " " + Lang.t("walks free"), kind: "warn", icon: "lock" });
              }
            } else {
              captives.push({ r: foe.rank, t: foe.tier, seq: captives.length });
              pts += CAPTIVE_PAY;
              Pop.show("bonus", { word: "Captive", sub: cardName(foe, "red") });
            }
          } else if (v.margin <= 1) {
            Pop.show("combo", { word: "Precise!", sub: "+" + pts });
          } else if (v.margin >= 3) {
            Pop.show("alert", { word: "Overkill" });
          }
        }
        if (streak >= 3 && v.margin <= 2 && v.hurt !== "a") {
        }
      } else if (v.kind === "lose") {
        lostCards.push(a);
        losses++; streak = 0;
        lastWon = false; mood = "happy";
        Sound.clip("lose", 0.6, 1);
        Fx.shake(10, 0.28); Fx.flash(RED, 0.25, 2.5);
        Pop.show("alert", { word: cardName(foe, "red") + " " + Lang.t("holds") });
      } else {                                              // tie: both fall
        lostCards.push(a);
        ties++; streak = 0;
        pts = TIE * foe.rank;
        grid[T.r][T.c] = null;
        lastWon = null; mood = "neutral";
        Sound.clip("tie", 0.6, 1);
        Fx.shake(8, 0.25);
        Fx.burst(cx, cy, { color: [BLUE, RED], count: 16, speed: 340, life: 0.5, grav: 500 });
        Pop.show("alert", { word: "Both fall" });
      }

      if (pts) {
        score += pts;
        HUD.setScore(score);
        HUD.punch(v.kind === "flag" ? GOLD : BLUE);
        Pop.text(cx, cy - G.ch * 0.6, "+" + pts, { color: GOLD, size: 22, life: 0.6, tier: 1 });
      }
      T.pts = pts;
      Sound.clip("clash", 0.5, 1);
      computeReach();
      showCounts();
    }

    /* After the pictures have caught up: the bandages come off a turn at a
       time, a new card fills the empty slot, and the two questions every turn
       ends on — is the camp empty, is the army. */
    function endTurn(T) {
      var v = T.verdict, i;
      var gone = returnHand(T.i);
      for (i = 0; i < handSize; i++) if (hand[i] && hand[i].hurt) hand[i].hurt--;
      refillHand(true, gone ? 1 : 0);
      var left = cardsLeft();
      if (left <= 2 && left > 0) Sound.clip("warn", 0.4, 1);
      showCounts();
      turn = null;
      if (v.kind === "flag" || foesLeft() === 0) { finish(true); return; }
      if (left === 0) { finish(false); return; }
      /* A HAND OF NOTHING BUT BANDAGES IS NOT A BATTLE LOST. The wounds come
         off on the turn boundary above, so the only way `playableNow` can be
         0 here with cards still on the table is a hand that heals next turn —
         and there is no turn to wait through, because a turn is a card being
         sent. So they are healed on the spot rather than the round being
         ended on a technicality nobody could have played around. */
      if (!playableNow()) {
        for (i = 0; i < handSize; i++) if (hand[i]) hand[i].hurt = 0;
      }
      /* A HAND OF NOTHING BUT STUNNED CARDS IS. No bandage comes off a
         stun, and the deck behind it has no slot to be dealt into: the army
         cannot send another card, which is an army spent. */
      if (!playableNow()) {
        Pop.show("alert", { word: "No card can move" });
        finish(false);
        return;
      }
      if (!anyTarget()) { finish(true); return; }         // nothing left to strike: the camp is taken
      if (!offered) {
        var lost = hopeless();
        if (lost) offerSurrender(lost);
      }
      enemyTurn();
    }

    /* ===================================================================
       THE ENEMY'S TURN — one soldier, one cell, or nothing
       The camp answers every card the player sends. It may slide ONE of its
       soldiers one cell — up, down or sideways — into a cell the fighting
       emptied, or it may pass. The flag and the traps never move, and the
       anchored soldiers never do either (buildGrid): standing still is the
       camp's bluff.

       WHAT IT PLAYS FOR IS THE FLAG. `siege()` is how many enemy cards still
       stand between the army and the flag, on the cheapest path — an emptied
       cell is free, a standing card costs one fight. A move that raises it is
       a card stepping into the corridor the player was opening; a move that
       lowers it is never played. When nothing defends, the camp may still
       move for the sake of it — a weak card it knows the player has seen
       stepping out of reach, a strong one stepping into it — and it passes
       more often low on the climb than high on it.

       A CARD THAT HAS MOVED IS TILTED a few degrees for the rest of the
       battle, face up or face down: it is the one thing the player is told
       about it, and it is what makes an untilted card worth wondering about.
       =================================================================== */
    var ANCHORED = 0.4;                       // share of soldiers that never move
    var THINK = 0.3, MARCH = 0.4;             // the pause before the move, the slide

    function siege() {
      var r, c, i, best = {}, dq = [], k;
      for (c = 0; c < cols; c++) {
        var cost0 = grid[rows - 1][c] && (rows - 1 !== flagCell.r || c !== flagCell.c) ? 1 : 0;
        k = (rows - 1) + "," + c;
        if (best[k] == null || cost0 < best[k]) { best[k] = cost0; dq.push({ r: rows - 1, c: c, d: cost0 }); }
      }
      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      while (dq.length) {
        dq.sort(function (a, b) { return a.d - b.d; });
        var p = dq.shift();
        if (p.d > best[p.r + "," + p.c]) continue;
        if (p.r === flagCell.r && p.c === flagCell.c) return p.d;
        for (i = 0; i < 4; i++) {
          r = p.r + dirs[i][0]; c = p.c + dirs[i][1];
          if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
          var isFlag = r === flagCell.r && c === flagCell.c;
          var d = p.d + (grid[r][c] && !isFlag ? 1 : 0);
          k = r + "," + c;
          if (best[k] == null || d < best[k]) { best[k] = d; dq.push({ r: r, c: c, d: d }); }
        }
      }
      return 99;
    }
    function movable(q) { return q && q.rank <= MARSHAL && !q.anchored; }

    /* ===================================================================
       HOPELESS — a battle the army can no longer win
       A battle is won two ways: the flag is taken, or every soldier of the
       camp is beaten (the camp emptied is the second one finished). When
       the army that is left can do neither, the camp's commander says so
       and offers a surrender (packages/webshell/army.js, `surrender`) —
       the player who refuses plays on to the end screen, but knowing.

       THE TEST IS OPTIMISTIC ON PURPOSE, so an offer is never made on a
       battle that could still be won: every card that can go out counts
       as many times as it is needed (a winner goes back under the deck), a
       draw counts as a way through, and a soldier who may still move is
       one that may step out of the corridor. What is left is what never
       gives way: a trap with no sapper in the army, an object with none of
       its breaker's grade, an anchored soldier nobody outranks.
       Returns why the flag is out of reach — "trap", "object" or "soldier",
       the first that walls it — or null while the battle can be won.
       =================================================================== */
    function hopeless() {
      var army = deck.slice(), i, r, c;
      for (i = 0; i < handSize; i++) if (hand[i] && !hand[i].stun) army.push(hand[i]);
      if (!army.length) return null;                    // the army spent ends it anyway
      function beaten(q) {
        var foe = { rank: q.rank, tier: q.tier, known: true };
        for (var j = 0; j < army.length; j++) {
          var k = judge(army[j], foe).kind;
          if (k === "win" || k === "tie" || k === "clear" || k === "smash" || k === "flag") return true;
        }
        return false;
      }
      /* a walk from under the camp through every cell that can give way */
      function walk(pass) {
        var seen = {}, q = [], dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]], wall = [], x, d;
        for (x = 0; x < cols; x++) q.push({ r: rows, c: x });
        while (q.length) {
          var p = q.shift();
          for (d = 0; d < 4; d++) {
            var nr = p.r + dirs[d][0], nc = p.c + dirs[d][1], k = nr + "," + nc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[k]) continue;
            seen[k] = true;
            var g = grid[nr][nc];
            if (!g || pass(g)) q.push({ r: nr, c: nc });
            else wall.push(g);
          }
        }
        return { seen: seen, wall: wall };
      }
      var sold = [], all = true;
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        var g = grid[r][c];
        if (!g || g.rank > MARSHAL) continue;
        sold.push(r + "," + c);
        if (!beaten(g)) all = false;
      }
      /* the second way: every soldier beaten, each reached through what can be cleared */
      if (all) {
        var w2 = walk(function (g) { return g.rank <= MARSHAL || beaten(g); });
        for (i = 0; i < sold.length && w2.seen[sold[i]]; i++) {}
        if (i === sold.length) return null;
      }
      /* the first way: the flag, reached through what can be cleared or may move */
      var w1 = walk(function (g) { return g.rank === FLAG || beaten(g) || movable(g); });
      if (w1.seen[flagCell.r + "," + flagCell.c]) return null;
      var why = { trap: 0, object: 0, soldier: 0 };
      for (i = 0; i < w1.wall.length; i++) {
        var x = w1.wall[i].rank;
        why[x === TRAP ? "trap" : isObject(x) ? "object" : "soldier"]++;
      }
      return why.trap ? "trap" : why.object ? "object" : "soldier";
    }

    /* The offer, where there is a barracks to make it: the commander's face
       turns smug, and the web shell asks. A playable has nobody to ask and
       plays the battle out as it always did. */
    function offerSurrender(why) {
      var AR = window.__ARMY__;
      if (!AR || !AR.surrender) return;
      offered = true;
      mood = "happy";
      AR.surrender(why);
    }

    function enemyTurn() {
      var lvl = levelD == null ? 0.3 : levelD;
      var base = siege(), moves = [], r, c, i, k0, before = {};
      for (k0 in targets) if (targets.hasOwnProperty(k0)) before[k0] = true;   // the loop re-reaches
      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        var q = grid[r][c];
        if (!movable(q)) continue;
        var wasTarget = !!before[r + "," + c];
        for (i = 0; i < 4; i++) {
          var nr = r + dirs[i][0], nc = c + dirs[i][1];
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc]) continue;
          grid[nr][nc] = q; grid[r][c] = null;
          var gain = siege() - base;
          computeReach();
          var exposed = isTarget(nr, nc);
          grid[r][c] = q; grid[nr][nc] = null;
          if (gain < 0) continue;
          var sc = gain * 3;
          if (exposed) sc += (q.rank - 5) * 0.25;                  // strong cards step forward
          if (q.known && wasTarget && !exposed && q.rank <= 5) sc += 0.8;   // a seen weakling steps back
          sc += draw() * 0.6;
          moves.push({ q: q, from: { r: r, c: c }, to: { r: nr, c: nc }, gain: gain, sc: sc });
        }
      }
      computeReach();
      if (!moves.length) return;
      moves.sort(function (a, b) { return b.sc - a.sc; });
      var m = moves[0];
      var play = m.gain > 0 ? draw() < 0.45 + 0.45 * lvl : m.sc > 0.4 && draw() < 0.15 + 0.3 * lvl;
      if (!play) return;
      march = { q: m.q, from: m.from, to: m.to, t: 0, state: "think" };
    }

    function marchStep(dt) {
      var M = march;
      M.t += dt;
      if (M.state === "think" && M.t >= THINK) {
        M.state = "slide"; M.t = 0;
        grid[M.to.r][M.to.c] = M.q; grid[M.from.r][M.from.c] = null;
        if (!M.q.moved) {
          M.q.moved = true;
          M.q.tilt = (draw() < 0.5 ? -1 : 1) * (0.05 + 0.035 * draw());   // 3 to 5 degrees
        }
        computeReach();
        Sound.clip("place", 0.35, 0.75);
      } else if (M.state === "slide" && M.t >= MARCH) {
        march = null;
        showCounts();
      }
    }

    /* ===================================================================
       UPDATE — the turn's five beats
       =================================================================== */
    var FLY = 0.3, FLIP = 0.3, CLASH = 0.62, SETTLE = 0.45;
    /* THE DUEL: a fight is played a second time, BIG, over the table, so the
       player can see who hit whom (drawDuel). It enters, the winner winds up,
       lunges and lands — the verdict is written at that impact, `D_HIT` — the
       loser is knocked back and greyed, and both leave. A draw is two cards
       lunging at once. The flag and the scout do not fight and skip it. */
    var D_IN = 0.3, D_WIND = 0.55, D_HIT = 0.72, D_KNOCK = 1.2, D_OUT = 1.55, DUEL = 1.85;
    /* THE FLAG IS SHOWN BEFORE IT IS WON. A capture used to fade the flag out
       with the settle and cut to the end screen: the one card the whole
       battle was about was on screen for a fraction of a second. It now
       stays turned over, raised and lit, for two seconds — the clash and
       this hold together — and only then is the victory declared. */
    var REVEAL = 2 - CLASH;
    /* AN OBJECT THAT ONLY TURNS A CARD AWAY IS NOT A FIGHT. The straw man,
       the fence, the rock, the forest and the skull play on the board, where
       the token is sent back, lost or held; the object a grade breaks is
       fought in the duel like a soldier, and so is the book's spell — the
       duel is the card against the ALLY it turned on. */
    var TURNED = { decoy: true, block: true, stray: true, stun: true };
    function noDuel(v) {
      return v.kind === "flag" || v.kind === "scout" || TURNED[v.kind] || (v.kind === "spell" && v.ally < 0);
    }

    function update(dt) {
      var i;
      tAnim += dt;
      for (i = refills.length - 1; i >= 0; i--) {
        refills[i].t += dt / 0.28;
        if (refills[i].t >= 1) refills.splice(i, 1);
      }
      for (i = returns.length - 1; i >= 0; i--) {
        returns[i].t += dt / 0.28;
        if (returns[i].t >= 1) returns.splice(i, 1);
      }
      if (hiding) { hiding.t += dt / FLIP; if (hiding.t >= 1) hiding = null; }
      if (march) { marchStep(dt); return; }
      if (!turn) return;
      var T = turn;
      T.t += dt;
      if (T.state === "fly" && T.t >= FLY) {
        T.state = "flip"; T.t = 0;
        Sound.clip("flip", 0.55, 1);
      } else if (T.state === "flip" && T.t >= FLIP) {
        T.t = 0;
        if (noDuel(T.verdict)) { T.state = "clash"; resolve(T); }
        else { T.state = "duel"; Sound.clip("place", 0.4, 0.7); }
      } else if (T.state === "duel") {
        if (!T.hit && T.t >= D_HIT) { T.hit = true; resolve(T); duelGlow(T.verdict); }
        if (T.t >= DUEL) { T.state = "settle"; T.t = 0; }
      } else if (T.state === "clash" && T.t >= CLASH) {
        T.state = T.verdict.kind === "flag" ? "reveal" : "settle"; T.t = 0;
      } else if ((T.state === "settle" && T.t >= SETTLE) || (T.state === "reveal" && T.t >= REVEAL)) {
        endTurn(T);
      }
    }

    /* ===================================================================
       THE CARD FACES — the lab's card, as DOM
       lab/stratideck-card.html is where a card is composed, and it draws
       with the SKIN itself (the block between THE CARD ITSELF and END OF
       THE CARD), linked rather than copied. What this section adds is the
       one thing a stylesheet cannot say: which nodes a card is made of, with
       the numbers of CONFIG.cards on them. `faceNode` is the lab's `build()`
       minus the tilt, and `sizeNode` its `dress()` — a change to either is
       made on both. It is the one builder of a card face in the game: the
       barracks asks for it too (`cardNode`), so a card picked in the deck
       screen and the card that lands on the grid are the same object.
       =================================================================== */
    var TIER_CLS   = ["basic", "common", "uncommon", "rare", "epic", "legendary"];
    var TIER_LABEL = ["Basic", "Common", "Uncommon", "Rare", "Epic", "Legendary"];
    var TIER_PIPS  = [1, 1, 2, 3, 4, 5];
    /* where each grade's scene looks, when `vary` is on — the lab's table */
    var FOCUS = { 1: [72, 22], 2: [30, 24], 3: [84, 80], 4: [16, 78], 5: [50, 74], 6: [66, 66],
                  7: [36, 62], 8: [78, 44], 9: [22, 46], 10: [50, 30], 11: [40, 50], 12: [60, 36],
                  13: [26, 70], 14: [70, 58], 15: [44, 82], 16: [18, 34], 17: [80, 28], 18: [56, 52] };
    /* A face-down card must not say what it is: the frame's inner rim is the
       rarity colour on a face, and the house gold on a back. */
    var BACK_RIM = "#d9a441";
    /* A card with no tier has no rarity colour to wear: an OBJECT is a warm
       brass, a GHOST (a card the player has never had) a cold slate — so a
       shadow never reads as the bottom rung of the ladder. */
    var OBJECT_RIM = "#c9a86a", GHOST_RIM = "#69718a";

    /* The seven badge shapes, verbatim from the lab. `.f` is the coloured
       body, `.f2` its darker second colour, `.x` the neutral metal, `.g` the
       gloss, `.d` the shade; the number is HTML laid over it. */
    var BADGE = {
      shield:  { vb: "0 0 100 110", svg:
        '<path class="f" d="M50 4 L92 18 V52 C92 78 72 96 50 106 C28 96 8 78 8 52 V18 Z"/>' +
        '<path class="d" d="M50 4 L92 18 V52 C92 78 72 96 50 106 C28 96 8 78 8 52 V18 Z"/>' +
        '<path class="g" d="M50 10 L86 22 V50 C86 62 78 72 66 80 C58 66 46 60 14 52 V22 Z"/>' },
      crown:   { vb: "0 0 120 90", svg:
        '<path class="f" d="M12 80 L4 24 L36 48 L60 6 L84 48 L116 24 L108 80 Z"/>' +
        '<path class="d" d="M12 80 L4 24 L36 48 L60 6 L84 48 L116 24 L108 80 Z"/>' +
        '<path class="g" d="M16 36 L36 54 L60 16 L84 54 L104 36 L100 56 L20 56 Z"/>' +
        '<rect class="f2" x="10" y="76" width="100" height="10" rx="3"/>' +
        '<circle class="x" cx="24" cy="66" r="3.5"/><circle class="x" cx="96" cy="66" r="3.5"/>' },
      seal:    { vb: "0 0 120 130", svg:
        '<path class="f2" d="M44 72 L22 128 L38 118 L48 130 L62 86 Z"/><path class="f2" d="M76 72 L98 128 L82 118 L72 130 L58 86 Z"/>' +
        '<circle class="f" cx="60" cy="52" r="44" style="stroke-width:9; stroke-dasharray:5 4.2"/>' +
        '<circle class="f" cx="60" cy="52" r="40" style="stroke:none"/>' +
        '<circle class="d" cx="60" cy="52" r="40"/><ellipse class="g" cx="60" cy="38" rx="30" ry="18"/>' +
        '<circle cx="60" cy="52" r="33" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="2.5"/>' },
      medal:   { vb: "0 0 100 140", svg:
        '<path class="f2" d="M28 0 H72 L62 54 H38 Z"/><path class="x" d="M46 0 H54 L53 54 H47 Z" style="fill:rgba(255,255,255,.55); stroke:none"/>' +
        '<circle class="f" cx="50" cy="94" r="42"/><circle class="d" cx="50" cy="94" r="42"/>' +
        '<circle cx="50" cy="94" r="34" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="3"/><ellipse class="g" cx="50" cy="78" rx="30" ry="18"/>' },
      dogtag:  { vb: "0 0 70 140", svg:
        '<path d="M35 0 V44" fill="none" stroke="#9aa3b0" stroke-width="4" stroke-dasharray="5 4"/>' +
        '<rect class="f" x="6" y="44" width="58" height="90" rx="12"/><rect class="d" x="6" y="44" width="58" height="90" rx="12"/>' +
        '<rect class="g" x="8" y="46" width="54" height="40" rx="10"/>' +
        '<circle cx="35" cy="57" r="5" fill="#0b0d12"/><path d="M6 64 L14 70 L6 76 Z" fill="rgba(0,0,0,.35)"/>' +
        '<rect x="18" y="118" width="34" height="3" fill="rgba(0,0,0,.35)"/><rect x="24" y="124" width="22" height="3" fill="rgba(0,0,0,.35)"/>' },
      burst:   { vb: "0 0 100 100", svg:
        '<path class="f" d="M50.0 5.4 L55.7 25.1 L70.5 7.5 L65.4 30.7 L86.2 21.1 L74.9 38.0 L91.4 40.6 L79.1 50.0 L91.2 59.4 L75.5 62.3 L83.3 76.5 L65.5 69.5 L69.7 90.9 L57.2 81.5 L50.0 93.0 L44.2 75.6 L29.6 92.4 L29.1 76.2 L13.6 79.1 L24.8 62.1 L1.4 61.1 L25.5 50.0 L2.4 39.1 L25.8 38.3 L16.3 23.1 L34.3 30.3 L30.7 9.9 L42.8 18.6 Z"/>' +
        '<path class="d" d="M50.0 5.4 L55.7 25.1 L70.5 7.5 L65.4 30.7 L86.2 21.1 L74.9 38.0 L91.4 40.6 L79.1 50.0 L91.2 59.4 L75.5 62.3 L83.3 76.5 L65.5 69.5 L69.7 90.9 L57.2 81.5 L50.0 93.0 L44.2 75.6 L29.6 92.4 L29.1 76.2 L13.6 79.1 L24.8 62.1 L1.4 61.1 L25.5 50.0 L2.4 39.1 L25.8 38.3 L16.3 23.1 L34.3 30.3 L30.7 9.9 L42.8 18.6 Z"/>' +
        '<ellipse class="g" cx="50" cy="38" rx="26" ry="16"/>' },
      scroll:  { vb: "0 0 180 60", svg:
        '<rect class="f" x="18" y="14" width="144" height="32"/><rect class="d" x="18" y="14" width="144" height="32"/>' +
        '<rect class="g" x="18" y="14" width="144" height="14"/>' +
        '<rect class="f2" x="3" y="5" width="24" height="50" rx="11"/><rect class="f2" x="153" y="5" width="24" height="50" rx="11"/>' +
        '<rect x="9" y="12" width="6" height="36" rx="3" fill="rgba(0,0,0,.3)"/><rect x="165" y="12" width="6" height="36" rx="3" fill="rgba(0,0,0,.3)"/>' }
    };

    /* the gradients every badge shape refers to, once per document */
    function badgeDefs() {
      if (document.getElementById("bx-defs")) return;
      var box = document.createElement("div");
      box.innerHTML =
        '<svg id="bx-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
        '<linearGradient id="bx-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="bx-shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>' +
        '<linearGradient id="bx-steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2f5f9"/><stop offset=".45" stop-color="#a7b0bd"/><stop offset=".55" stop-color="#6d7683"/><stop offset="1" stop-color="#c9d1db"/></linearGradient>' +
        "</defs></svg>";
      document.body.appendChild(box.firstChild);
    }
    function badgeHTML(role, design, value, at) {
      var d = BADGE[design] || BADGE.shield;
      return '<div class="c-badge ' + role + " d-" + (BADGE[design] ? design : "shield") +
        (at && at !== "auto" ? " at-" + at : "") + '">' +
        '<svg viewBox="' + d.vb + '" preserveAspectRatio="none">' + d.svg + "</svg>" +
        "<span>" + value + "</span></div>";
    }
    function artUrl(key) {
      var src = key && CONFIG.art && CONFIG.art[key];
      return src ? 'url("' + src + '")' : "none";
    }

    /* ONE CARD FACE. `c` is { rank, tier } or null for a back with nothing
       behind it (the deck pile); `side` picks the painted officer and the
       cloth of the back. Every number is a CSS variable, so a size change is
       a restyle (`sizeNode`) and never a rebuild.

       TWO SHAPES THE BARRACKS' COLLECTION ASKS FOR (`cardNode`): a card whose
       `tier` is null is an OBJECT — no badge, no pips, and the plate says
       "Object" where a rarity would be (the flag and the trap in the round
       keep the camp's tier); and `ghost` is a card the player has never had,
       drawn as its own white silhouette like an unowned sticker, named ???,
       with its grade and its tier badges still on it, in slate. */
    /* THE CAST: one painted officer per army, grade and tier — 120 of them,
       `assets/image/master/stratideck-object-cast-<side>-NN.png` cut four to
       a sheet (tools/lab/cast-sheets.mjs) — so a card is a PERSON, the one
       whose name, age and story the barracks prints on its back. The key is
       worked out, never listed: `castBlue04C` is the blue sergeant at C, and
       `castTurn04C` the RED sergeant at C in the blue army's uniform, painted
       under their red self on the same sheet. A portrait not painted yet
       falls back — the turncoat on the red officer, anyone on the grade's
       face — so every sheet that lands fills its four cards and nothing else
       changes. */
    function castKey(kind, rank, t) {
      return "cast" + (kind === "turn" ? "Turn" : kind === "red" ? "Red" : "Blue") +
             (rank < 10 ? "0" : "") + rank + TIERS[t];
    }
    function castArt(kind, rank, t) {
      return (CONFIG.art && CONFIG.art[castKey(kind, rank, t)]) ||
             (kind === "turn" && CONFIG.art && CONFIG.art[castKey("red", rank, t)]) || "";
    }
    /* NO CREST ON A FACE, and no turncoat's disc under it: the army a card
       fights for is its cloth and its side of the table, and the corner was
       one badge too many beside the grade, the tier and the macaron. A
       turncoat still wears the army's uniform over the camp's face, and the
       back of the card (cardBack) says where they came from. */
    function faceNode(c, fmt, side, ghost) {
      var K = CONFIG.cards, t = c ? clamp(c.tier | 0, 0, TOP_TIER) : 0;
      var def = c ? RANKS[c.rank] : null, officer = c && c.rank <= 10;
      var tiered = !!c && c.tier != null && !ghost;
      badgeDefs();
      var n = document.createElement("div");
      n.className = "card static fmt-" + fmt + " style-" + K.style + " tier-" + TIER_CLS[t] +
        (K.markover ? " mark-over" : "") + (K.rankOn && officer ? " rank-on" : "") +
        (K.tierOn && c && c.tier != null ? " tier-on" : "") + (c ? "" : " back") +
        (c && !officer ? " object" : "") + (ghost ? " ghost" : "");
      n.style.setProperty("--rar", !c ? BACK_RIM : ghost ? GHOST_RIM : tiered ? TIER_COLOR[t] : OBJECT_RIM);
      n.style.setProperty("--team", side === "red" ? RED : BLUE);
      var f = c && K.vary && FOCUS[c.rank] ? FOCUS[c.rank] : [50, 40];
      n.style.setProperty("--fx", f[0] + "%");
      n.style.setProperty("--fy", f[1] + "%");
      n.style.setProperty("--zoom", K.zoom);
      n.style.setProperty("--hero", K.hero + "%");
      n.style.setProperty("--mark", K.mark);
      n.style.setProperty("--mx", K.mx + "%");
      n.style.setProperty("--midz", K.midz);
      n.style.setProperty("--midx", K.midx + "%");
      n.style.setProperty("--midy", K.midy + "%");
      n.style.setProperty("--tinyz", K.tinyz);
      n.style.setProperty("--tinyx", K.tinyx + "%");
      n.style.setProperty("--tinyy", K.tinyy + "%");
      /* the grade badge, the tier badge and the macaron at THIS format's own
         size and place (the SKIN's --k-* / --x-* / --y-*) */
      var F = fmt.charAt(0).toUpperCase() + fmt.slice(1);
      ["rank", "tier", "perk"].forEach(function (k) {
        n.style.setProperty("--k-" + k, K[k + F] != null ? K[k + F] : 1);
        n.style.setProperty("--x-" + k, K[k + F + "X"] || 0);
        n.style.setProperty("--y-" + k, K[k + F + "Y"] || 0);
      });

      var crest = (CONFIG.art && CREST[side] && CONFIG.art[CREST[side]]) || "";
      var html = '<div class="c-body"><div class="c-frame"></div><div class="c-scene"></div>';
      if (c) {
        /* THE SIDE PICKS THE FACE: the painted officer where the build has
           one, the object-sheet cut where it does not (the trap, the flag),
           and the lab's "missing" plate where there is neither. */
        var turn = officer && side !== "none" && c.o && c.o !== side;
        var kind = turn ? "turn" : (c.o || side);
        var key = side === "red" ? def.red : def.blue;
        if (c.o === "red") key = def.red;
        /* the portrait is the officer's, at the tier they were raised at:
           a promotion changes the frame and never the face */
        var src = (officer && castArt(kind, c.rank, c.base != null ? clamp(c.base | 0, 0, TOP_TIER) : t)) ||
                  (key && CONFIG.art && CONFIG.art[key]) || (def.art && CONFIG.art && CONFIG.art[def.art]) || "";
        var pips = "";
        for (var i = 0; tiered && i < TIER_PIPS[t]; i++) pips += "<i></i>";
        var name = ghost ? "???" : upper(Lang.t(def.name));
        html +=
          '<div class="c-mark' + (c.rank >= 10 ? " two" : "") + '"><b>' + (officer ? c.rank : "") + "</b></div>" +
          '<div class="c-hero' + (src ? "" : " missing") + '" data-missing="' + name + '">' +
            (src ? '<img alt="" src="' + src + '">' : "") + "</div>" +
          '<div class="c-plate"><span class="c-name">' + name +
            '</span><span class="c-tier">' + (ghost ? "" : upper(Lang.t(tiered ? TIER_LABEL[t] : "Object"))) + "</span></div>" +
          '<div class="c-pips">' + pips + "</div>";
      }
      html += '<div class="c-back">' + (crest ? '<img alt="" src="' + crest + '">' : "") + "</div>" +
              '<div class="c-shine"></div></div>';
      /* THE BADGES AND THE MACARON ARE SIBLINGS OF THE BODY: `.c-body` clips
         to the card's outline, and inside it a badge hung over the edge was
         cut, and the macaron in its corner kept a quarter of its disc */
      if (c) {
        html += badgeHTML("rank", K.brank, officer ? c.rank : "", K.arank) +
          badgeHTML("tier", K.btier, TIERS[t], K.atier) +
          /* the macaron: what this grade is FOR (PERK), on the army's cards
             only — the camp never strikes, so its officers use none of it */
          (officer && side !== "red" && PERK[c.rank]
            ? '<div class="c-perk"><svg viewBox="0 0 24 24" aria-hidden="true">' + PERK[c.rank] + "</svg></div>" : "");
      }
      n.innerHTML = html;
      /* the plate's words: one size per line for the officers, measured
         once per language; an object fitted on its own card */
      var TIERN = [];
      for (var q = 0; q <= TOP_TIER; q++) TIERN.push(upper(Lang.t(TIER_LABEL[q])));
      var NAMES = [];
      for (q = 1; q <= 10; q++) NAMES.push(upper(Lang.t(RANKS[q].name)));
      plateFit(K.style, { full: K.rfull, mid: K.rmid }, NAMES, TIERN,
               K.style + "." + K.rfull + "." + K.rmid + "." + Lang.code());
      if (c && !officer && !ghost) fitName(n);
      return n;
    }
    /* ONE SIZE PER LINE: every grade's name at the size of the longest one,
       every rarity at the size of the longest rarity — per format and per
       language, so a LIEUTENANT and a GENERAL dealt side by side read at the
       same size. Measured once on a card nobody sees, at the reference
       width (the ratio holds at any other), for the frame style in use, and
       written on the root as `--nfit-full`, `--tfit-full` and `--nfit-mid`,
       which the SKIN hands to every card that is not an object. `names` and
       `tiers` are the words as they are shown (translated, in capitals). */
    var plateKey = "";
    function plateFit(style, refs, names, tiers, key) {
      if (key === plateKey || !document.body) return;
      plateKey = key;
      var host = document.createElement("div"), out = {};
      host.style.cssText = "position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none";
      document.body.appendChild(host);
      [["full", refs.full], ["mid", refs.mid]].forEach(function (f) {
        var n = document.createElement("div");
        n.className = "card static fmt-" + f[0] + " style-" + style + " tier-rare";
        n.style.cssText = "--w:" + f[1] + "px;--h:" + (f[0] === "full" ? Math.round(f[1] * 1.4) : f[1]) +
          "px;--sk:1;--nfit:1;--tfit:1";
        n.innerHTML = '<div class="c-body"><div class="c-plate"><span class="c-name"></span><span class="c-tier"></span></div></div>';
        host.appendChild(n);
        var plate = n.querySelector(".c-plate"), cs = getComputedStyle(plate);
        var room = plate.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        var widest = function (sel, list) {
          var el = plate.querySelector(sel), rg = document.createRange(), max = 0;
          for (var i = 0; i < list.length; i++) {
            el.textContent = list[i];
            rg.selectNodeContents(el);
            max = Math.max(max, rg.getBoundingClientRect().width);
          }
          return max;
        };
        var fit = function (w) { return w > room && room > 0 ? Math.max(0.3, room / w) : 1; };
        out["n" + f[0]] = fit(widest(".c-name", names));
        if (f[0] === "full") out.tfull = fit(widest(".c-tier", tiers));
      });
      host.parentNode.removeChild(host);
      var root = document.documentElement.style;
      root.setProperty("--nfit-full", out.nfull.toFixed(3));
      root.setProperty("--tfit-full", out.tfull.toFixed(3));
      root.setProperty("--nfit-mid", out.nmid.toFixed(3));
    }
    /* AN OBJECT'S WORDS, SHRUNK TO ITS PLATE (the SKIN's `--nfit` / `--tfit`):
       an object's name is not a grade, so it is fitted on its own card rather
       than sized with the grades (plateFit). Measured once the plate has a
       size, since the face, the tracking and the language all move the width
       and a card may be built in a tab not shown yet (ResizeObserver), and
       taken once: the words and the plate scale together, so the ratio holds
       at any width. The officer's file hides the plate and is never measured. */
    function fitName(n) {
      var fmt = n.classList.contains("fmt-mid") ? "mid" : n.classList.contains("fmt-full") ? "full" : "";
      if (!fmt || typeof ResizeObserver === "undefined") return;
      var plate = n.querySelector(".c-plate");
      if (!plate) return;
      var ro = new ResizeObserver(function () {
        if (!plate.clientWidth) return;
        ro.disconnect();
        /* in screen boxes, so a card scaled or turning is measured as it
           stands: the ratio is all that is kept */
        var pr = plate.getBoundingClientRect();
        var k = pr.width / plate.clientWidth, cs = getComputedStyle(plate);
        var room = pr.width - (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)) * k;
        /* each line on its own: the text's width, not its block's — a Range
           over the letters — against the plate's */
        [[".c-name", "--nfit"], [".c-tier", "--tfit"]].forEach(function (l) {
          var line = plate.querySelector(l[0]);
          if (!line || !line.textContent) return;
          var rg = document.createRange();
          rg.selectNodeContents(line);
          var w = rg.getBoundingClientRect().width;
          n.style.setProperty(l[1], w > room ? Math.max(0.3, room / w).toFixed(3) : "1");
        });
      });
      ro.observe(plate);
    }
    /* THE SIZE: one number, and the card follows it as a whole. Every length
       on a card is in em (1% of its width), so `--w` alone scales it; the
       text floors are the one thing in px, and `--sk` scales them with it —
       the width over the format's reference (CONFIG.cards.rfull / rmid /
       rtiny, the width the lab composes it at), never under 1 so a card
       squeezed under its reference keeps its words at their floor. The
       scene's blur is read at 300px and scaled like the rest.
       `own` is the officer's file (cardBack), a page laid out at its own
       width: its floors stay at 18 px. */
    function refOf(fmt) {
      var K = CONFIG.cards;
      return (fmt === "mid" ? K.rmid : fmt === "tiny" ? K.rtiny : K.rfull) || 120;
    }
    function sizeNode(n, w, fmt, own) {
      n.style.setProperty("--w", w + "px");
      n.style.setProperty("--h", (fmt === "full" ? Math.round(w * 1.4) : w) + "px");
      n.style.setProperty("--blur", (CONFIG.cards.blur * w / 300).toFixed(2) + "px");
      n.style.setProperty("--sk", own ? "1" : Math.max(1, w / refOf(fmt)).toFixed(3));
    }
    /* The barracks' door into this builder: `c` is { rank, tier }, `opt` is
       { fmt, w, side, ghost }. The scene is the first band's, which is the
       camp the player's army was raised in. `side: "none"` is a card of
       neither army — an object — and wears no crest. */
    function cardNode(c, opt) {
      opt = opt || {};
      var fmt = opt.fmt || "full";
      var n = faceNode(c, fmt, opt.side || "blue", !!opt.ghost);
      sizeNode(n, opt.w || 120, fmt);
      n.style.setProperty("--bgi", artUrl(CONFIG.bands[0].scene));
      return n;
    }

    /* THE BACK OF AN OFFICER'S FILE, for the barracks (packages/webshell/
       army.js, openFile). It is the same card turned over: the frame, the
       rim, the grade, the tier and the pips of the face, so the back is
       visibly the same object, with the officer standing small in a window
       at its head and their file under it. The macaron stays on the face:
       its pictogram heads the ability line instead. `info` is written by the
       barracks, already in the player's language and already in capitals
       where it shouts: { grade, first, last, facts: [], job, jobPost, skill,
       lore, army, turn }.
       Every line is text written into a node, never markup — a name like
       O'Ween and a lore with quotes in it are data. */
    function cardBack(c, opt, info) {
      opt = opt || {};
      var n = cardNode(c, { fmt: "full", w: opt.w || 300, side: opt.side || "blue" });
      sizeNode(n, opt.w || 300, "full", true);   // a page at its own width, not a card scaled
      n.classList.add("file");
      var body = n.querySelector(".c-body");
      function line(parent, tag, cls, str) {
        var e = document.createElement(tag);
        e.className = cls;
        if (str != null) e.textContent = str;
        parent.appendChild(e);
        return e;
      }
      var sheet = line(body, "div", "cf-file");
      var plate = line(sheet, "div", "cf-plate");
      if (info.first) line(plate, "span", "cf-first", info.first);
      line(plate, "span", "cf-last", info.last);
      line(plate, "span", "cf-grade", info.grade);
      if (info.facts && info.facts.length) {
        var facts = line(sheet, "div", "cf-facts");
        for (var i = 0; i < info.facts.length; i++) line(facts, "span", "", info.facts[i]);
      }
      /* the officer's trade, and the post of the camp it suits
         (packages/webshell/army.js, `postPct`) */
      if (info.job) {
        var job = line(sheet, "div", "cf-job");
        line(job, "b", "", info.job);
        if (info.jobPost) line(job, "span", "", info.jobPost);
      }
      /* the grade's ability, under the macaron's own pictogram */
      if (info.skill) {
        var skill = line(sheet, "div", "cf-skill");
        if (PERK[c.rank]) skill.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + PERK[c.rank] + "</svg>";
        line(skill, "p", "", info.skill);
      }
      var lore = line(sheet, "div", "cf-lore");
      var crest = CONFIG.art && CREST[opt.side] && CONFIG.art[CREST[opt.side]];
      if (crest) {
        var wm = line(lore, "img", "cf-wm");
        wm.alt = ""; wm.src = crest;
      }
      line(lore, "p", "", info.lore || "");
      /* an object fights for neither army: no foot */
      if (info.army) {
        var foot = line(sheet, "div", "cf-foot");
        line(foot, "span", "", info.army);
        if (info.turn) line(foot, "span", "turn", info.turn);
      } else n.classList.add("footless");
      return n;
    }

    /* ===================================================================
       THE TABLE — the round's cards, placed every frame
       One layer of card nodes between the painted scene and the canvas
       (z-index -1, after .frame-art): the canvas above it still draws what is
       not a card — the halo round a target, the bandage on a wounded card,
       every word, the Fx — which therefore lands ON the cards. A node is kept
       per SLOT ("g2.3" a cell, "h1" a hand slot, "p0" the pile, "last"), so a
       card that moves from one frame to the next is the same node moved, and
       a style is written only when it changed: a frame where nothing moves
       touches nothing.
       =================================================================== */
    var Table = { root: null, top: null, crown: null, sheet: null, foe: null, panel: null,
                  duel: null, duelBack: null,
                  nodes: {}, seen: {}, z: 1, panelAt: "" };

    function tableRoot() {
      if (Table.root) return Table.root;
      var canvas = document.getElementById("game");
      var root = document.createElement("div");
      root.className = "cd-layer";
      canvas.parentNode.insertBefore(root, canvas);
      Table.panel = document.createElement("div");
      Table.panel.className = "cd-panel";
      root.appendChild(Table.panel);
      Table.root = root;
      /* THE CARD UNDER THE FINGER IS ABOVE THE CANVAS. Everything else on the
         table sits under it so the canvas can paint the halos and the Fx on
         the cards — but a card being dragged crosses the camp, and the camp's
         halos and dashes painted over it read as a card turning translucent
         in the hand. The one layer over the canvas holds that token and
         nothing else. */
      var top = document.createElement("div");
      top.className = "cd-layer cd-top";
      canvas.parentNode.insertBefore(top, canvas.nextSibling);
      Table.top = top;
      /* THE ENEMY'S CORNER, top right, is over the HUD's own gradient: the
         commander and the pile of what the camp has lost are the enemy's
         side of the table, and a veil over them would push them back into
         the scene. Appended last, at the HUD's depth, so it lands on it. */
      var crown = document.createElement("div");
      crown.className = "cd-layer cd-crown";
      canvas.parentNode.appendChild(crown);
      Table.crown = crown;
      Table.foe = document.createElement("img");
      Table.foe.className = "cd-foe"; Table.foe.alt = "";
      root.insertBefore(Table.foe, Table.panel);          // behind the board
      /* THE DUEL'S LAYER, over the canvas and under the HUD: the two big
         cards of a fight, on a dim of their own. */
      var duel = document.createElement("div");
      duel.className = "cd-layer cd-duel";
      Table.duelBack = document.createElement("div");
      Table.duelBack.className = "cd-duel-back";
      duel.appendChild(Table.duelBack);
      canvas.parentNode.insertBefore(duel, top.nextSibling);
      Table.duel = duel;
      /* THE LISTS: the infirmary, the prison and the beaten pile open one
         sheet over the round, above the callouts. It takes no pointer — the
         canvas under it still gets the tap, and onDown closes it. */
      var sh = document.createElement("div");
      sh.className = "cd-layer cd-sheet";
      canvas.parentNode.appendChild(sh);
      Table.sheet = sh;
      /* The cards are the round's and nothing else's: a menu the web shell
         draws over a cleared canvas must not find a camp still standing under
         it. The end screen keeps them, as it keeps the canvas's last frame. */
      onState(function (s) {
        root.style.visibility = (s === "playing" || s === "end") ? "" : "hidden";
        top.style.visibility = s === "playing" ? "" : "hidden";
        crown.style.visibility = s === "playing" ? "" : "hidden";
        duel.style.visibility = s === "playing" ? "" : "hidden";
        if (s !== "playing") {
          sheetClose();
          cursorOn = false; canvas.style.cursor = "";
        }
      });
      return root;
    }
    function tableClear() {
      var root = tableRoot(), k;
      for (k in Table.nodes) if (Table.nodes.hasOwnProperty(k)) Table.nodes[k].parentNode.removeChild(Table.nodes[k]);
      Table.nodes = {};
      root.style.setProperty("--bgi", artUrl(BAND.scene));
      root.style.visibility = "";
    }
    function styleOnce(n, prop, v) {
      if (n._s[prop] !== v) { n._s[prop] = v; n.style[prop] = v; }
    }
    /* THE ROUND'S ENTRANCE (Enter): the camp's panel, every card, the doors
       and the commander are its elements, landing in the order render()
       opens them — the board, the camp, the pile, the tents, the commander,
       the hand last. A card is a DOM node, which the canvas transform of an
       element does not reach, so the element's flight — its scale, where it
       has put the point, its fade — is read back off the context against the
       ground's (`enterBase`, taken at the top of render) and handed to the
       node. Null outside the entrance, so a round pays nothing for it. */
    var enterBase = null, ENTER_ALPHA = null;
    try { ENTER_ALPHA = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ctx), "globalAlpha"); } catch (e) {}
    function enterGround() {
      enterBase = null;
      if (!Enter.active() || !ctx.getTransform) return;
      var m = ctx.getTransform();
      enterBase = { a: m.a, d: m.d, e: m.e, f: m.f, al: ENTER_ALPHA && ENTER_ALPHA.get ? ENTER_ALPHA.get.call(ctx) || 1 : 1 };
    }
    function enterLook(x, y) {
      if (!enterBase || !Enter.active()) return null;
      var m = ctx.getTransform(), b = enterBase, s = m.a / b.a;
      return { x: x * s + (m.e - b.e) / b.a, y: y * s + (m.f - b.f) / b.d, s: s,
               a: ENTER_ALPHA && ENTER_ALPHA.get ? ENTER_ALPHA.get.call(ctx) / b.al : 1 };
    }
    function place(key, c, x, y, w, h, fmt, opt) {
      var side = opt.side || "blue", down = !!opt.down || !c;
      var sig = (c ? c.rank + "." + c.tier + (c.o || "") : "x") + "." + side + "." + fmt + "." + Lang.code();
      var n = Table.nodes[key];
      if (!n || n._sig !== sig) {
        if (n) n.parentNode.removeChild(n);
        n = faceNode(c, fmt, side);
        n._sig = sig; n._s = {}; n._w = 0; n._down = !c; n._seen = false;
        if (opt.still) n.classList.add("still");
        (opt.layer ? Table[opt.layer] : Table.root).appendChild(n);
        Table.nodes[key] = n;
      }
      Table.seen[key] = true;
      styleOnce(n, "display", "");
      if (n._w !== w) { sizeNode(n, w, fmt); n._w = w; }
      if (c && n._down !== down) {
        n.classList.toggle("back", down);
        n.style.setProperty("--rar", down ? BACK_RIM : TIER_COLOR[c.tier]);
        n._down = down;
      }
      if (opt.pile && !n._pile) { n.classList.add("pile"); n._pile = true; }
      var seen = down && !!opt.seen;
      if (n._seen !== seen) { n.classList.toggle("seen", seen); n._seen = seen; }
      var dimmed = !!opt.dim;
      if (n._dim !== dimmed) { n.classList.toggle("dim", dimmed); n._dim = dimmed; }
      var shine = opt.shine || 0;
      if (n._shine !== shine) {
        n.classList.toggle("lit", shine > 0);
        n.classList.toggle("hot", shine > 1);
        n._shine = shine;
      }
      if (opt.delay != null && n._delay !== opt.delay) {
        n.style.setProperty("--sd", opt.delay.toFixed(2) + "s");
        n._delay = opt.delay;
      }
      var sx = opt.scale || 1, sy = sx, en = enterLook(x, y), ea = 1;
      if (en) { x = en.x; y = en.y; sx *= en.s; sy = sx; ea = en.a; }
      if (opt.flip != null) sx *= Math.max(0.02, Math.abs(Math.cos(opt.flip * Math.PI)));
      var tf = "translate(" + (x - w / 2).toFixed(1) + "px," + (y - h / 2).toFixed(1) + "px)";
      if (opt.rot) tf += " rotate(" + opt.rot.toFixed(3) + "rad)";
      if (sx !== 1 || sy !== 1) tf += " scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ")";
      styleOnce(n, "transform", tf);
      styleOnce(n, "opacity", opt.alpha != null || ea !== 1 ? String(Math.round(clamp((opt.alpha != null ? opt.alpha : 1) * ea, 0, 1) * 100) / 100) : "1");
      styleOnce(n, "zIndex", String(Table.z++));
    }
    function tableBegin() {
      tableRoot();
      Table.seen = {}; Table.z = 1;
      Table.root.classList.toggle("flat", !Art.scene());
    }
    function tableEnd() {
      for (var k in Table.nodes) {
        if (Table.nodes.hasOwnProperty(k) && !Table.seen[k]) styleOnce(Table.nodes[k], "display", "none");
      }
    }
    /* The camp's panel is part of the table, UNDER the cards: on the canvas
       it would be a veil over them. */
    function panel(x, y, w, h) {
      var pn = Table.panel, en = enterLook(x + w / 2, y + h / 2);
      if (!pn._s) pn._s = {};
      styleOnce(pn, "visibility", "");
      styleOnce(pn, "transform", en ? "translate(" + (en.x - x - w / 2).toFixed(1) + "px," + (en.y - y - h / 2).toFixed(1) + "px) scale(" + en.s.toFixed(3) + ")" : "");
      styleOnce(pn, "opacity", en ? String(Math.round(clamp(en.a, 0, 1) * 100) / 100) : "");
      var at = Math.round(x) + "," + Math.round(y) + "," + Math.round(w) + "," + Math.round(h);
      if (Table.panelAt === at) return;
      Table.panelAt = at;
      var s = Table.panel.style;
      s.left = Math.round(x) + "px"; s.top = Math.round(y) + "px";
      s.width = Math.round(w) + "px"; s.height = Math.round(h) + "px";
    }

    /* One card, about its centre, `w` wide: the node on the table, and what
       the canvas paints over it. `fmt` is the lab's format — "full" (5:7, the
       hand), "mid" or "tiny" (squares, the camp) — and it decides the height.
       `side` is blue (the army) or red (the camp); `down` a face-down card;
       `seen` a face-down card the player has already turned over once;
       `shine` a target the player may strike (1, or 2 while a card is
       picked); `lit` the canvas ring, for the hand and the token. */
    function drawCard(key, c, x, y, w, opt) {
      opt = opt || {};
      var fmt = opt.fmt || "full", h = fmt === "full" ? Math.round(w * 1.4) : w;
      if (!Enter.begin(x, y)) return;          // not landed yet: its node stays hidden (tableEnd)
      place(key, c, x, y, w, h, fmt, opt);
      var lit = opt.lit || 0, hurt = c && c.hurt && !opt.down, stun = c && c.stun && !opt.down;
      if (lit <= 0 && !hurt && !stun) { Enter.end(); return; }
      ctx.save();
      ctx.translate(x, y);
      if (opt.rot) ctx.rotate(opt.rot);
      if (opt.scale) ctx.scale(opt.scale, opt.scale);
      if (opt.alpha != null) ctx.globalAlpha = clamp(opt.alpha, 0, 1);
      if (opt.flip != null) ctx.scale(Math.max(0.02, Math.abs(Math.cos(opt.flip * Math.PI))), 1);
      var r = w * (fmt === "tiny" ? 0.16 : fmt === "mid" ? 0.05 : 0.06);
      if (lit > 0) {
        /* THE HALO IS A RING, NOT A FILL: it is painted over the card now,
           and a gold wash over a painted officer is a card nobody can read. */
        roundRect(ctx, -w / 2 - 7, -h / 2 - 7, w + 14, h + 14, r + 7);
        ctx.lineWidth = 9; ctx.strokeStyle = rgba(GOLD, 0.12 + 0.18 * lit); ctx.stroke();
        roundRect(ctx, -w / 2 - 4, -h / 2 - 4, w + 8, h + 8, r + 4);
        ctx.lineWidth = 3 + 2 * lit; ctx.strokeStyle = rgba(GOLD, 0.45 + 0.5 * lit); ctx.stroke();
      }
      if (stun) drawStun(w, h, r);
      else if (hurt) drawWound(w, h, r);
      ctx.restore();
      Enter.end();
    }

    /* STUNNED, AND IT IS THE SKULL THAT DID IT: a violet veil — a wound's
       veil says "not this turn", this one "not this battle" — and the skull
       that stunned it, in the Lucide stroke (assets/motor/lucide/skull.svg)
       replayed through Path2D like the drop. */
    var SKULL_PATHS = ["m12.5 17-.5-1-.5 1h1z",
      "M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"];
    var skullShapes = null;
    function drawStun(w, h, r) {
      roundRect(ctx, -w / 2, -h / 2, w, h, r);
      ctx.fillStyle = "rgba(34,12,60,.66)"; ctx.fill();
      if (!skullShapes) skullShapes = SKULL_PATHS.map(function (d) { return new Path2D(d); });
      var s = Math.min(w, h) * 0.5 / 24;
      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-12, -12);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineWidth = 3.4; ctx.strokeStyle = "rgba(10,0,20,.8)";
      for (var i = 0; i < skullShapes.length; i++) ctx.stroke(skullShapes[i]);
      ctx.lineWidth = 2; ctx.strokeStyle = "#d9c2ff";
      for (i = 0; i < skullShapes.length; i++) ctx.stroke(skullShapes[i]);
      ctx.fillStyle = "#d9c2ff";
      ctx.beginPath(); ctx.arc(15, 12, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(9, 12, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    /* A WOUND, AND IT IS A DROP OF BLOOD AND A VEIL. The veil is what says the
       card cannot be sent — a greyed card reads as unavailable in any game —
       and the drop is what says why. A red cross said the opposite: it is the
       sign of the medic, not of the hurt. The drop is an SVG path (24-unit
       box) replayed through Path2D, filled with a lit gradient and a white
       glint so it reads as liquid rather than as a red pictogram. */
    var DROP_PATH = "M12 1.5C12 1.5 4.2 10.4 4.2 15.6a7.8 7.8 0 0 0 15.6 0C19.8 10.4 12 1.5 12 1.5z";
    var dropShape = null;
    function drawWound(w, h, r) {
      roundRect(ctx, -w / 2, -h / 2, w, h, r);
      ctx.fillStyle = "rgba(8,10,22,.6)"; ctx.fill();
      if (!dropShape) dropShape = new Path2D(DROP_PATH);
      var s = Math.min(w, h) * 0.46 / 24;
      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-12, -13);
      var g = ctx.createLinearGradient(6, 3, 18, 24);
      g.addColorStop(0, "#ff6b6b"); g.addColorStop(0.55, "#d61f2c"); g.addColorStop(1, "#6e0710");
      ctx.fillStyle = g; ctx.fill(dropShape);
      ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(20,0,4,.85)"; ctx.stroke(dropShape);
      ctx.beginPath();
      ctx.ellipse(9.2, 15.2, 1.6, 3.2, 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fill();
      ctx.restore();
    }

    /* ===================================================================
       RENDER
       =================================================================== */
    function cellKey(r, c) { return "g" + r + "." + c; }

    function drawGrid() {
      var r, c, T = turn;
      if (!Enter.begin(G.gx0 + G.gw / 2, G.gy0 + G.gh / 2)) {
        if (!Table.panel._s) Table.panel._s = {};
        styleOnce(Table.panel, "visibility", "hidden");
        return;
      }
      panel(G.gx0 - 14, G.gy0 - 14, G.gw + 28, G.gh + 28);
      var hot = selected >= 0 || (drag && drag.moved) ? 2 : 1;
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        var x = cellX(c) + G.cw / 2, y = cellY(r) + G.ch / 2, cell = grid[r][c];
        var busy = T && T.r === r && T.c === c;
        var sliding = march && march.state === "slide";
        if (sliding && ((march.from.r === r && march.from.c === c) || (march.to.r === r && march.to.c === c))) {
          if (cell !== march.q) continue;               // the cell it left: no dashes under the slide
          var km = ease(Math.min(1, march.t / MARCH));
          var fx = cellX(march.from.c) + G.cw / 2, fy = cellY(march.from.r) + G.ch / 2;
          drawCard(cellKey(r, c), cell, fx + (x - fx) * km, fy + (y - fy) * km, G.cw,
                   { fmt: G.fmt, side: "red", down: cell !== lastFoe, seen: cell.known, still: true,
                     rot: cell.tilt * km, scale: 1 + 0.08 * Math.sin(km * Math.PI) });
          continue;
        }
        if (!cell) {
          /* an emptied cell: the path the army walks. Not under a fight — the
             canvas is over the cards, so its dashes would be painted across
             the card falling or the flag being shown. */
          if (busy) continue;
          roundRect(ctx, cellX(c), cellY(r), G.cw, G.ch, G.cw * 0.11);
          ctx.fillStyle = reach[r + "," + c] ? rgba(GOLD, 0.07) : "rgba(255,255,255,.03)"; ctx.fill();
          ctx.setLineDash([7, 8]); ctx.lineWidth = 2;
          ctx.strokeStyle = reach[r + "," + c] ? rgba(GOLD, 0.28) : "rgba(255,255,255,.1)"; ctx.stroke();
          ctx.setLineDash([]);
          continue;
        }
        if (busy && T.state !== "fly") continue;   // drawn by drawTurn
        var key = cellKey(r, c), target = isTarget(r, c) && !T;
        /* A moved card keeps its tilt everywhere it is drawn (`tilt`, set on
           its first move); the one about to move rises a little first. */
        /* the card turned over before this one, going back face down */
        if (hiding && hiding.card === cell) {
          var k = Math.min(1, hiding.t);
          drawCard(key, cell, x, y, G.cw, { fmt: G.fmt, side: "red", down: k >= 0.5, flip: k,
                   seen: true, still: true, rot: cell.tilt || 0 });
          continue;
        }
        var up = cell === lastFoe;
        /* THE CAMP HOLDS STILL. Thirty-six shimmering frames are thirty-six
           repaints a frame for a decoration nobody is looking at: only the
           cards the player may strike catch the light, a gloss swept across
           them in a wave down the camp, faster once a card is picked. */
        var lift = march && march.state === "think" && march.q === cell ? 1.06 : 1;
        drawCard(key, cell, x, y, G.cw, { fmt: G.fmt, side: "red", down: !up, seen: cell.known, still: true,
                 shine: target && !march ? hot : 0, delay: (r + c) * 0.12,
                 rot: cell.tilt || 0, scale: lift,
                 alpha: !isTarget(r, c) && !up ? 0.82 : 1 });
      }
      Enter.end();
    }

    /* The turn's own drawing: the token in flight, the enemy turning over,
       the clash and the two cards' exits. The token is one node ("tok") from
       the moment it leaves to the moment it goes, and the enemy keeps its
       cell's; the hand card it came from is drawHand's and stays put. */
    function drawTurn() {
      var T = turn;
      if (!T) return;
      var tx = cellX(T.c) + G.cw / 2, ty = cellY(T.r) + G.ch / 2;
      var fk = cellKey(T.r, T.c), tw = G.tw;
      var ox = tx + G.ax, oy = ty + G.ay;
      var v = T.verdict, k;
      var tok = { fmt: FIGHT_FMT, side: "blue" };
      if (T.state === "fly") {
        k = ease(Math.min(1, T.t / FLY));
        tok.scale = T.from.s + (1 - T.from.s) * k; tok.rot = -0.12 * (1 - k);
        drawCard("tok", T.a, T.from.x + (ox - T.from.x) * k, T.from.y + (oy - T.from.y) * k - 40 * Math.sin(k * Math.PI), tw, tok);
        return;
      }
      if (T.state === "flip") {
        k = Math.min(1, T.t / FLIP);
        /* the swap to the fight's format happens edge-on, where it cannot be
           seen; a card already face up does not show its back on the way */
        var turnOver = !T.wasUp || G.fmt !== FIGHT_FMT;
        drawCard(fk, T.foe, tx, ty, G.cw, { fmt: k < 0.5 ? G.fmt : FIGHT_FMT, side: "red",
                 down: !T.wasUp && k < 0.5, seen: T.foe.known, flip: turnOver ? k : null,
                 scale: 1 + 0.1 * Math.sin(k * Math.PI), still: true });
        tok.rot = -0.08;
        drawCard("tok", T.a, ox, oy, tw, tok);
        return;
      }
      var won = v.kind === "win" || v.kind === "flag" || v.kind === "clear" || v.kind === "smash" || v.kind === "scout";
      var lost = v.kind === "lose" || v.kind === "trap";
      /* turned away by an object: the object holds, the token is thrown back */
      var turned = !!TURNED[v.kind] || v.kind === "spell";
      /* A CAPTIVE DOES NOT FALL. The cell is taken, so the camp is one card
         lighter either way, but the picture has to say which of the two
         happened: a card that fades out is gone and a card that walks off is
         one the player may be offered at the end. */
      var spared = v.kind === "win" && v.hurt === "d";
      var foe = { fmt: FIGHT_FMT, side: "red", still: true };
      if (T.state === "clash") {
        k = Math.min(1, T.t / CLASH);
        var kick = v.kind === "flag" ? 0 : Math.max(0, 1 - k * 4);
        // the enemy, face up, kicked back if it fell; the flag rises instead
        foe.scale = v.kind === "flag" ? 1.06 + 0.16 * ease(k) : 1.06;
        foe.lit = v.kind === "flag" ? ease(k) : 0;
        drawCard(fk, T.foe, tx + (won ? 10 * kick : 0), ty - (won ? 8 * kick : 0), G.cw, foe);
        // the token, in front, kicked back if it fell or was turned away
        var back = lost || turned;
        tok.rot = -0.08 + (back ? 0.1 * kick : 0); tok.scale = won ? 1.08 : 1;
        if (v.kind === "flag") tok.alpha = 1 - ease(k);
        drawCard("tok", T.a, ox - (back ? 12 * kick : 0), oy + (back ? 10 * kick : 0), tw, tok);
        return;
      }
      if (T.state === "duel") {
        // the board holds still under the big duel
        foe.scale = 1.06;
        drawCard(fk, T.foe, tx, ty, G.cw, foe);
        tok.rot = -0.08;
        drawCard("tok", T.a, ox, oy, tw, tok);
        drawDuel(T);
        return;
      }
      if (T.state === "reveal") {
        // the flag, raised and lit, breathing, until the victory is declared
        var pulse = 0.5 + 0.5 * Math.sin(T.t * 6);
        foe.scale = 1.22 + 0.04 * pulse; foe.lit = 0.7 + 0.3 * pulse;
        drawCard(fk, T.foe, tx, ty, G.cw, foe);
        return;
      }
      // settle: the loser goes, the token goes with the fight
      k = ease(Math.min(1, T.t / SETTLE));
      /* an enemy that stays on its cell settles back into the camp's format,
         edge-on again for the swap, when the camp is not dealt tiny */
      var stay = function () {
        var back = G.fmt !== FIGHT_FMT;
        drawCard(fk, T.foe, tx, ty, G.cw, { fmt: back && k >= 0.5 ? G.fmt : FIGHT_FMT, side: "red", still: true,
                 flip: back ? k : null, scale: 1.06 - 0.06 * k });
      };
      /* A token that won goes back to the bottom of the deck, and flies to
         the pile to say so; a wounded one flies back to its slot, where the
         card comes back into the hand. */
      var px = G.deckX + G.deckW / 2, py = G.deckY + G.deckH / 2, ps = 0.75 * G.deckW / tw;
      var hx = handX(T.i) + HAND_W / 2, hy = G.handY + HAND_H / 2, hs = HAND_W / tw;
      var home = function (toSlot) {
        var slot = toSlot || v.hurt === "a";
        var gx = slot ? hx : px, gy = slot ? hy : py, gs = slot ? hs : ps;
        tok.scale = 1.08 + (gs - 1.08) * k; tok.rot = -0.08 * (1 - k);
        drawCard("tok", T.a, ox + (gx - ox) * k, oy + (gy - oy) * k - 50 * Math.sin(k * Math.PI), tw, tok);
      };
      var fade = function () {
        tok.alpha = 1 - k; tok.scale = 1 - 0.35 * k; tok.rot = -0.08 - 0.5 * k;
        drawCard("tok", T.a, ox, oy + 40 * k, tw, tok);
      };
      if (v.kind === "scout" || v.kind === "decoy") {
        // back to the bottom of the deck
        stay();
        home();
      } else if (v.kind === "block" || v.kind === "stun") {
        // back to its own slot, where it lands (stunned, it lands for good)
        stay();
        home(true);
      } else if (v.kind === "stray") {
        // into the trees: it drifts off the cell, shrinking, and is gone
        stay();
        tok.alpha = 1 - k; tok.scale = 1 - 0.5 * k; tok.rot = -0.08 + 0.6 * k;
        drawCard("tok", T.a, ox - 30 * k, oy - 60 * k, tw, tok);
      } else if (v.kind === "spell") {
        // the fight was the duel; what survived it goes back to its slot
        stay();
        if (v.deadA) fade(); else home(true);
      } else if (won) {
        if (spared) {
          // led away: sideways off the cell, upright, rather than face down
          foe.alpha = 1 - k; foe.scale = 1 - 0.15 * k; foe.rot = -0.15 * k;
          drawCard(fk, T.foe, tx + 70 * k, ty - 10 * k, G.cw, foe);
        } else {
          foe.alpha = 1 - k; foe.scale = 1 - 0.3 * k; foe.rot = 0.3 * k;
          drawCard(fk, T.foe, tx, ty + 30 * k, G.cw, foe);
        }
        home();
      } else if (lost) {
        stay();
        fade();
      } else {                                              // tie: both go
        foe.alpha = 1 - k; foe.scale = 1 - 0.3 * k; foe.rot = 0.4 * k;
        drawCard(fk, T.foe, tx + 20 * k, ty - 20 * k, G.cw, foe);
        tok.alpha = 1 - k; tok.scale = 1 - 0.3 * k; tok.rot = -0.5 * k;
        drawCard("tok", T.a, ox - 20 * k, oy + 30 * k, tw, tok);
      }
    }

    /* The edge of the frame says how it went, at the impact: blue the
       army won, red it lost, gold a draw or a win that cost a wound. */
    function duelGlow(v) {
      var c = v.kind === "spell" ? "rgba(155,107,255,.9)"
            : v.kind === "lose" || v.kind === "trap" ? "rgba(255,70,70,.9)"
            : v.kind === "tie" || v.hurt === "a" ? "rgba(255,212,59,.9)"
            : "rgba(90,169,255,.9)";
      Overlay.vignette(c, 1, 900);
    }

    /* THE DUEL, BIG. The two cards of the fight at full size over the
       table, the army's on the left and the camp's on the right: the WINNER
       is the one that moves — it winds up, lunges and lands — and the loser
       is knocked back, shaken and greyed. `duelBack` is the dim behind them.

       One pose function per card, read off the duel's clock; everything is
       the card nodes the table already builds, in their own layer above the
       canvas. */
    var DUEL_W = 312;             // may touch or cross the frame's edges mid-fight
    function duelPose(t, side, role) {
      var dir = side === "a" ? 1 : -1;            // +1: towards the camp's card
      var p = { dx: 0, rot: 0, scale: 1, alpha: 1, dim: false };
      var e = ease(clamp(t / D_IN, 0, 1));
      p.dx = -dir * 280 * (1 - e); p.scale = 0.7 + 0.3 * e; p.alpha = e;
      var reach = role === "tie" ? 58 : 118;
      if (role === "win" || role === "tie") {
        if (t > D_IN && t <= D_WIND) p.dx = -dir * 26 * ease((t - D_IN) / (D_WIND - D_IN));
        else if (t > D_WIND && t <= D_HIT) {
          var u = (t - D_WIND) / (D_HIT - D_WIND);
          p.dx = -dir * 26 + dir * (26 + reach) * u * u; p.scale = 1 + 0.08 * u;
        } else if (t > D_HIT) {
          var b = ease(clamp((t - D_HIT) / (D_KNOCK - D_HIT), 0, 1));
          p.dx = dir * reach * (1 - b); p.scale = 1.08 - 0.08 * b;
        }
        p.rot = dir * 0.05;
      }
      if ((role === "lose" || role === "tie") && t > D_HIT) {
        var q = ease(clamp((t - D_HIT) / (D_KNOCK - D_HIT), 0, 1));
        var shake = Math.sin((t - D_HIT) * 70) * 10 * (1 - q);
        var back = role === "tie" ? 36 : 50;
        p.dx += -dir * back * q + shake;
        p.rot = -dir * 0.32 * q;
        p.alpha = 1 - 0.35 * q; p.dim = true;
      }
      if (t > D_OUT) {
        var o = clamp((t - D_OUT) / (DUEL - D_OUT), 0, 1);
        p.alpha *= 1 - o; p.scale *= 1 - 0.1 * o;
      }
      return p;
    }
    function drawDuel(T) {
      var v = T.verdict, t = T.t;
      /* the book's spell: the right-hand card is the ALLY it turned on, in
         blue, and the fight is the one bewitch() settled */
      var spell = v.kind === "spell", them = spell ? v.b : T.foe;
      var aw = spell ? v.res === "win" : v.kind === "win" || v.kind === "clear" || v.kind === "smash";
      var fw = spell ? v.res === "lose" : v.kind === "lose" || v.kind === "trap";
      var ra = aw ? "win" : fw ? "lose" : "tie", rf = fw ? "win" : aw ? "lose" : "tie";
      var cx = Layout.cx, h = Math.round(DUEL_W * 1.4);
      var cy = clamp(G.gy0 + G.gh / 2, Layout.top + h / 2 - 20, G.handY - h / 2);
      var gap = DUEL_W / 2 + 24;
      var dim = Math.min(clamp(t / D_IN, 0, 1), 1 - clamp((t - D_OUT) / (DUEL - D_OUT), 0, 1));
      var bs = Table.duelBack.style, op = (0.8 * dim).toFixed(2);
      if (bs.opacity !== op) bs.opacity = op;
      var pa = duelPose(t, "a", ra), pf = duelPose(t, "f", rf);
      // the winner is drawn last, so its lunge lands ON the loser
      var order = rf === "win" ? [["a", pa], ["f", pf]] : [["f", pf], ["a", pa]];
      for (var i = 0; i < 2; i++) {
        var who = order[i][0], P = order[i][1];
        var x = cx + (who === "a" ? -gap : gap) + P.dx;
        drawCard(who === "a" ? "duelA" : "duelF", who === "a" ? T.a : them, x, cy, DUEL_W,
                 { fmt: "full", side: who === "a" || spell ? "blue" : "red", layer: "duel", still: true,
                   rot: P.rot, scale: P.scale, alpha: P.alpha, dim: P.dim });
      }
    }

    /* A picked card rises this far out of its slot, and a dragged one's token
       rides this far above the finger, at this scale. */
    var LIFT_SEL = 22, DRAG_UP = 30, DRAG_S = 1.1;

    function slotDashes(i) {
      roundRect(ctx, handX(i), G.handY, HAND_W, HAND_H, HAND_W * 0.05);
      ctx.fillStyle = "rgba(255,255,255,.035)"; ctx.fill();
      ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.stroke();
      ctx.setLineDash([]);
    }

    /* A LOCKED SLOT: a dark plate in the row and the padlock of the Lucide
       stroke (assets/motor/lucide/lock.svg), replayed through Path2D like
       the skull — a slot the hand has, not a card it lost. */
    var LOCK_PATHS = ["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z",
      "M7 11V7a5 5 0 0 1 10 0v4"];
    var lockShapes = null;
    function slotLocked(i) {
      var x = handX(i), y = G.handY;
      roundRect(ctx, x, y, HAND_W, HAND_H, HAND_W * 0.05);
      ctx.fillStyle = "rgba(6,8,18,.55)"; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.stroke();
      if (!lockShapes) lockShapes = LOCK_PATHS.map(function (d) { return new Path2D(d); });
      var s = HAND_W * 0.34 / 24;
      ctx.save();
      ctx.translate(x + HAND_W / 2, y + HAND_H / 2);
      ctx.scale(s, s);
      ctx.translate(-12, -12);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(246,241,228,.32)";
      for (var k = 0; k < lockShapes.length; k++) ctx.stroke(lockShapes[k]);
      ctx.restore();
    }

    /* The hand. A card being PLAYED is its token: the moment it is dragged
       out, or sent from a tap, the big card leaves its slot and the tiny one
       is the only picture of it on the table — two pictures of one card read
       as two cards. It comes back into the slot only when it comes back to
       the hand (wounded), and otherwise the next card is dealt into it.

       The slot's dashes are painted on the canvas, which is OVER the cards,
       so they are only drawn where no card is standing: dashes across a card
       are what made a picked card look see-through. */
    function drawHand() {
      var i, j, T = turn;
      var px = G.deckX + G.deckW / 2, py = G.deckY + G.deckH / 2, ps = G.deckW / HAND_W;
      for (i = handSize; i < handSlots; i++) slotLocked(i);
      /* the cards not played this turn, on their way under the deck */
      for (j = 0; j < returns.length; j++) {
        var R = returns[j], kr = ease(Math.min(1, R.t));
        var rx = handX(R.slot) + HAND_W / 2, ry = G.handY + HAND_H / 2;
        drawCard("r" + R.slot, R.card, rx + (px - rx) * kr, ry + (py - ry) * kr - 40 * Math.sin(kr * Math.PI), HAND_W,
                 { fmt: "mid", down: kr >= 0.5, flip: kr, scale: 1 + (ps - 1) * kr });
      }
      for (i = 0; i < handSize; i++) {
        var x = handX(i) + HAND_W / 2, y = G.handY + HAND_H / 2;
        /* the ally a spell turned the card on has stepped into the duel: one
           picture of it, not two */
        var called = T && T.state === "duel" && T.verdict.kind === "spell" && T.verdict.ally === i;
        var played = (T && T.i === i) || (drag && drag.moved && drag.i === i && !T) || called;
        if (played || hand[i] == null) { slotDashes(i); continue; }
        var arriving = null;
        for (j = 0; j < refills.length; j++) if (refills[j].slot === i) arriving = refills[j];
        if (arriving) {
          if (arriving.t < 0) { slotDashes(i); continue; }   // still waiting for the pile
          var ka = ease(Math.min(1, arriving.t));
          drawCard("h" + i, hand[i], px + (x - px) * ka, py + (y - py) * ka, HAND_W,
                   { fmt: "mid", down: ka < 0.5, flip: ka * 0.5 + 0.5, scale: ps + (1 - ps) * ka });
          continue;
        }
        var sel = selected === i && !T;
        drawCard("h" + i, hand[i], x, sel ? y - LIFT_SEL : y, HAND_W,
                 { fmt: "mid", lit: sel ? 1 : 0, scale: sel ? 1.06 : 1 });
      }
      /* the dragged card's token, over the canvas, under the finger */
      if (drag && drag.moved && hand[drag.i] != null && !T) {
        drawCard("drag", hand[drag.i], drag.x, drag.y - DRAG_UP, G.tw,
                 { fmt: FIGHT_FMT, layer: "top", lit: 1, scale: DRAG_S,
                   rot: (drag.x - (handX(drag.i) + HAND_W / 2)) / 1800 });
      }
    }

    /* A number on a card node: the deck's count as a watermark across its
       top card, the beaten pile's as a badge. DOM, because both piles are
       card nodes and the pile in the corner stands over the canvas. */
    function countOn(key, v, cls) {
      var n = Table.nodes[key];
      if (!n) return;
      var b = n._count;
      if (!b) {
        b = document.createElement("b");
        /* a watermark is clipped by the card it is printed on, so it goes in
           the card's body (overflow hidden, the card's own corners); a badge
           hangs off the corner, so it goes on the node */
        var into = cls && cls.indexOf("wm") >= 0 ? n.querySelector(".c-body") || n : n;
        into.appendChild(b); n._count = b; b._t = null;
      }
      var txt = v == null ? "" : String(v), c = "c-count" + (cls ? " " + cls : "");
      if (b._t !== txt) { b.textContent = txt; b._t = txt; }
      if (b.className !== c) b.className = c;
    }

    /* A tent of the village, and the door to its list. The picture is the
       hub's own (`art.objects`: infirmary, prison); a build with no artwork
       draws a plain plate with the word, which is all the door needs. */
    function drawDoor(role, x, count, tint) {
      var img = art(role), y = G.doorY, w = G.doorW, h = G.doorH;
      var open = sheet && sheet.kind === role;
      if (!Enter.begin(x + w / 2, y + h / 2)) return;
      ctx.save();
      /* the pad it stands on, in its own colour: the prison is a black tent
         and a black tent on a night scene is a door nobody finds */
      ctx.save();
      ctx.translate(x + w / 2, y + h * 0.9);
      ctx.scale(1, 0.32);
      var halo = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.55);
      halo.addColorStop(0, rgba(tint, 0.55)); halo.addColorStop(1, rgba(tint, 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0, 0, w * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (img) {
        ctx.globalAlpha = count || open ? 1 : 0.88;
        ctx.drawImage(img, x, y, w, h);
      } else {
        roundRect(ctx, x + 8, y + 8, w - 16, h - 12, 12);
        ctx.fillStyle = rgba(tint, 0.25); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = rgba(tint, 0.7); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = font(18, 900); ctx.fillStyle = rgba(INK, open ? 1 : 0.8);
      ctx.fillText(upper(Lang.t(role === "infirmary" ? "Infirmary" : "Prison")), x + w / 2, y + h + 14);
      if (count) {
        var bx = x + w - 12, by = y + 10;
        ctx.beginPath(); ctx.arc(bx, by, 15, 0, Math.PI * 2);
        ctx.fillStyle = tint; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(8,10,22,.85)"; ctx.stroke();
        ctx.font = font(18, 900); ctx.fillStyle = "#fff";
        ctx.fillText(String(count), bx, by + 1);
      }
      ctx.restore();
      Enter.end();
    }

    /* The enemy's corner: the commander behind his camp, reacting to the
       last fight, and the pile of the camp's losses, the last one beaten face
       up on top. */
    function drawCrown() {
      var f = Table.foe;
      if (!f._s) f._s = {};
      var key = mood === "happy" ? "enemyHappy" : mood === "sad" ? "enemySad" : "enemyNeutral";
      var src = (CONFIG.art && CONFIG.art[key]) || "";
      if (f._src !== src) { f._src = src; if (src) f.src = src; styleOnce(f, "display", src ? "" : "none"); }
      styleOnce(f, "width", G.foeW + "px"); styleOnce(f, "height", G.foeH + "px");
      var bob = Math.round(Math.sin(tAnim * 2.2) * 30) / 10;
      var fcx = G.foeX + G.foeW / 2, fcy = G.foeY + G.foeH / 2, fen = null;
      if (Enter.begin(fcx, fcy)) {
        fen = enterLook(fcx, fcy);
        Enter.end();
        styleOnce(f, "visibility", "");
      } else styleOnce(f, "visibility", "hidden");
      styleOnce(f, "transform", (fen ? "translate(" + (fen.x - fcx).toFixed(1) + "px," + (fen.y - fcy).toFixed(1) + "px) " : "") +
                "translate(" + Math.round(G.foeX) + "px," + (Math.round(G.foeY) + bob) + "px)" +
                (fen ? " scale(" + fen.s.toFixed(3) + ")" : "") + (FOE_FLIP ? " scaleX(-1)" : ""));
      styleOnce(f, "opacity", fen ? String(Math.round(clamp(fen.a, 0, 1) * 100) / 100) : "");

      var i, n = fallen.length, w = G.pileW;
      if (!n) {
        roundRect(ctx, G.pileCx - w / 2, G.pileCy - w / 2, w, w, w * 0.16);
        ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.stroke();
        ctx.setLineDash([]);
        return;
      }
      for (i = Math.min(3, n) - 1; i >= 0; i--) {
        drawCard("b" + i, fallen[n - 1 - i], G.pileCx - i * 4, G.pileCy - i * 4, w,
                 { fmt: "tiny", side: "red", still: true, layer: "crown" });
      }
      countOn("b0", n, "badge");
    }

    function drawInfo() {
      // the deck pile, three backs deep; its count is the watermark on top
      var i, n = deck.length;
      for (i = Math.min(3, n) - 1; i >= 0; i--) {
        drawCard("p" + i, null, G.deckX + G.deckW / 2 + i * 3, G.deckY + G.deckH / 2 - i * 4, G.deckW, { pile: true });
      }
      if (n) countOn("p0", n, n <= 2 ? "wm warn" : "wm");
      else {
        roundRect(ctx, G.deckX, G.deckY, G.deckW, G.deckH, G.deckW * 0.06);
        ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.stroke();
        ctx.setLineDash([]);
      }

      /* The centre of the band carries no words: the targets' gloss says
         where to strike, and the streak is the callout's to announce. */

      drawDoor("infirmary", G.infX, hurtCards.length, RED);
      drawDoor("prison", G.prisonX, captives.length, BLUE);
      drawCrown();
    }

    /* ===================================================================
       THE LISTS — the infirmary, the prison, the camp's losses
       One sheet over the round, newest first, so the oldest is at the foot
       of the list. It is read, never played: a tap anywhere closes it.
       =================================================================== */
    var DROP_SVG = '<svg class="sh-drop" viewBox="0 0 24 24"><path d="' + DROP_PATH + '"/></svg>';
    /* The camp as it was dealt: one tile per grade, best first, with how
       many of it the enemy brought. The tile's tier badge is hidden, since
       the muster does not say it. */
    function campGrid() {
      var grid = document.createElement("div"), g, total = 0;
      grid.className = "sh-tiles";
      var order = [FLAG, TRAP, STRAW, FENCE, ROCK, FOREST, SKULL, BOOK, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      for (var i = 0; i < order.length; i++) {
        g = order[i];
        if (!muster[g]) continue;
        total += muster[g];
        var cell = document.createElement("div");
        cell.className = "sh-cell";
        var n = faceNode(card(g, 0), "tiny", "red");
        sizeNode(n, 96, "tiny");
        n.style.setProperty("--bgi", artUrl(BAND.scene));
        n.classList.add("still", "no-tier");
        cell.appendChild(n);
        /* the count and nothing else: what a token is, it says at full size */
        cell.insertAdjacentHTML("beforeend", '<div class="sh-n">×' + muster[g] + "</div>");
        fileDoor(cell, card(g, 0), "red", true);
        grid.appendChild(cell);
      }
      return { node: grid, total: total };
    }

    /* The army as it marched in, in two parts: the cards still standing —
       in the deck, in the hand or in a bed, a wounded one wearing its drop —
       and the cards lost, each part best grade first. A third, only when a
       forest swallowed someone: neither standing nor lost, simply gone for
       the rest of the battle. */
    function armyTiles(list, w, lost) {
      var grid = document.createElement("div");
      grid.className = "sh-tiles" + (lost ? " lost" : "");
      list = list.slice().sort(function (a, b) { return (b.rank - a.rank) || (b.tier - a.tier); });
      for (var i = 0; i < list.length; i++) {
        var cell = document.createElement("div");
        cell.className = "sh-cell";
        var n = faceNode(list[i], "tiny", "blue");
        sizeNode(n, w, "tiny");
        n.style.setProperty("--bgi", artUrl(BAND.scene));
        n.classList.add("still");
        cell.appendChild(n);
        fileDoor(cell, list[i], "blue");
        if (hurtCards.indexOf(list[i]) >= 0) cell.insertAdjacentHTML("beforeend", DROP_SVG);
        grid.appendChild(cell);
      }
      return grid;
    }
    /* THE MOTOR'S CARD (packages/shell/motor.css, CARD): the count on the
       corner, the eyebrow, the title, a body, and the line that says what the
       tap does — the same six slots every card of the web shell is built on,
       so a list over the round reads as one of them. */
    function sheetCard(kind, title, count, sub) {
      var box = document.createElement("div");
      box.className = "mt-card sh-box sh-" + kind;
      box.innerHTML = (count != null ? '<i class="mt-pin">' + count + "</i>" : "") +
        (sub ? '<div class="mt-eyebrow">' + upper(Lang.t(sub)) + "</div>" : "") +
        '<h3 class="mt-h">' + upper(Lang.t(title)) + "</h3>";
      var body = document.createElement("div");
      body.className = "mt-body";
      box.appendChild(body);
      return { box: box, body: body };
    }
    function sheetShow(box) {
      box.insertAdjacentHTML("beforeend", '<p class="mt-tap">' + upper(Lang.t("Tap to close")) + "</p>");
      Table.sheet.innerHTML = "";
      Table.sheet.appendChild(box);
      Table.sheet.classList.add("on");
      Fit.box(box.querySelector(".mt-h"), 32);
      sheet = { kind: box.getAttribute("data-kind") };
      drag = null;
      Sound.clip("pick", 0.4, 0.8);
    }

    function armySheet() {
      var alive = [], i;
      for (i = 0; i < army0.length; i++) {
        if (lostCards.indexOf(army0[i]) < 0 && strayed.indexOf(army0[i]) < 0) alive.push(army0[i]);
      }
      var n = army0.length, w = n > 24 ? 76 : n > 14 ? 88 : 100;
      var c = sheetCard("army", "Your army", n, "At the start of the battle"), box = c.body;
      /* A SECTION IS DRAWN ONLY WHEN IT HOLDS A CARD: an empty heading is a
         line that says nothing happened, which the count on the corner
         already says. */
      if (alive.length) {
        box.insertAdjacentHTML("beforeend", '<div class="sh-sec">' + upper(Lang.t("Alive")) + " <span>" + alive.length + "</span></div>");
        box.appendChild(armyTiles(alive, w));
      }
      if (lostCards.length) {
        box.insertAdjacentHTML("beforeend", '<div class="sh-sec lost">' + upper(Lang.t("Lost")) + " <span>" + lostCards.length + "</span></div>");
        box.appendChild(armyTiles(lostCards, w, true));
      }
      if (strayed.length) {
        box.insertAdjacentHTML("beforeend", '<div class="sh-sec lost">' + upper(Lang.t("Lost in the forest")) + " <span>" + strayed.length + "</span></div>");
        box.appendChild(armyTiles(strayed, w, true));
      }
      return c.box;
    }

    /* A CARD OF A LIST IS A DOOR TO WHO IT IS. The sheet takes no pointer —
       the canvas under it gets the tap (onDown) — so a cell that can open an
       officer's file carries the file it opens, and the tap is matched
       against the cells' own boxes. Only where the web shell's barracks is
       there to show them: a playable has no barracks.

       THREE KINDS OF DOOR. An officer opens their file; an OBJECT opens the
       card at full size, whose back says what it does and which grade
       destroys it (ABOUT); and a tile of the camp's muster (`blind`) opens
       the card at full size and nothing more — it counts grades and hides
       the tiers, and a file would say both. */
    function fileOf(c, side, blind) {
      if (c.rank > MARSHAL) return { g: c.rank, obj: true, team: "none" };
      if (blind) return { o: side, g: c.rank, t: c.tier, blind: true, team: side };
      return { o: c.o || side, g: c.rank, t: c.tier, b: c.base != null ? c.base : null, team: side };
    }
    function fileDoor(cell, c, side, blind) {
      var AR = window.__ARMY__;
      if (!AR || !AR.file || !c) return;
      cell._file = fileOf(c, side, blind);
      cell.classList.add("file");
    }
    function sheetFileAt(p) {
      if (!sheet || !Table.sheet) return null;
      var cv = document.getElementById("game");
      if (!cv) return null;
      var r = cv.getBoundingClientRect();
      var x = r.left + p.x / view.w * r.width, y = r.top + p.y / view.h * r.height;
      var cells = Table.sheet.querySelectorAll(".sh-cell.file");
      for (var i = 0; i < cells.length; i++) {
        var b = cells[i].getBoundingClientRect();
        if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return cells[i];
      }
      return null;
    }

    function sheetOpen(kind) {
      var list = [], side = "red", title, empty, i;
      if (cursorOn) { cursorOn = false; document.getElementById("game").style.cursor = ""; }
      if (kind === "camp" || kind === "army") {
        var cbox;
        if (kind === "army") cbox = armySheet();
        else {
          var cg = campGrid();
          var cc = sheetCard("camp", "Enemy camp", cg.total, "At the start of the battle");
          cc.body.appendChild(cg.node);
          cbox = cc.box;
        }
        cbox.setAttribute("data-kind", kind);
        sheetShow(cbox);
        return;
      }
      if (kind === "infirmary") { list = hurtCards; side = "blue"; title = "Infirmary"; empty = "Nobody wounded yet"; }
      else if (kind === "prison") {
        for (i = 0; i < captives.length; i++) list.push(card(captives[i].r, captives[i].t));
        title = "Prison"; empty = "No prisoners yet";
      } else { list = fallen; title = "Foes beaten"; empty = "No foe beaten yet"; }
      var sc = sheetCard(kind, title, list.length || null), box = sc.body;
      sc.box.setAttribute("data-kind", kind);
      if (!list.length) {
        box.innerHTML += '<div class="sh-empty">' + upper(Lang.t(empty)) + "</div>";
      } else {
        var grid = document.createElement("div");
        grid.className = "sh-tiles";
        var w = list.length > 20 ? 88 : 104;
        for (i = list.length - 1; i >= 0; i--) {
          var cell = document.createElement("div");
          cell.className = "sh-cell";
          var n = faceNode(list[i], "tiny", side);
          sizeNode(n, w, "tiny");
          n.style.setProperty("--bgi", artUrl(BAND.scene));
          n.classList.add("still");
          cell.appendChild(n);
          fileDoor(cell, list[i], side);
          if (kind === "infirmary") cell.insertAdjacentHTML("beforeend", DROP_SVG);
          grid.appendChild(cell);
        }
        box.appendChild(grid);
      }
      sheetShow(sc.box);
    }
    function sheetClose() {
      sheet = null;
      if (Table.sheet) { Table.sheet.classList.remove("on"); Table.sheet.innerHTML = ""; }
    }

    function render() {
      /* The camp is the painted scene (CONFIG.sceneArt), a CSS layer under the
         table; with no artwork on disk the table paints the fallback ground
         itself (`.cd-layer.flat`), since a ground painted on the canvas would
         now hide every card under it — and the canvas is then wiped here,
         whole, because the frame pipeline only wipes it for a scene. */
      if (!Art.scene()) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
      }
      enterGround();
      tableBegin();
      drawGrid();
      drawInfo();
      drawHand();
      drawTurn();
      if ((!turn || turn.state !== "duel") && Table.duelBack.style.opacity !== "0") Table.duelBack.style.opacity = "0";
      tableEnd();
    }

    /* ===================================================================
       THE END OF A BATTLE
       =================================================================== */

    /* WHAT THE BATTLE OWES THE BARRACKS, and it is the whole of what leaves
       this file: the ids of the player's own cards that were wounded, every
       enemy card that was turned over (`met`, the collection's), and the
       enemies left standing, best first — the choice offered at the end is
       three cards and a player asked to pick between fifteen is not being
       offered a choice. It rides on the result, so the motor carries it
       without knowing what any of it is. */
    function ledger() {
      var out = [], gaps = {}, k;
      for (k in wounded) if (wounded.hasOwnProperty(k)) { out.push(k); gaps[k] = wounded[k]; }
      var best = captives.slice().sort(function (a, b) {
        return (b.r * 10 + b.t) - (a.r * 10 + a.t);
      });
      var dead = [];
      for (k = 0; k < refused.length; k++) if (refused[k].id) dead.push(refused[k].id);
      var played = [];
      for (k in used) if (used.hasOwnProperty(k)) played.push(k);
      return { hurt: out, gaps: gaps, dead: dead, met: met.slice(0), used: played,
               captives: best.slice(0, 8).map(function (q) { return { r: q.r, t: q.t }; }) };
    }

    /* THE THREE STARS ARE THREE OBJECTIVES, and the score decides none of
       them: one for the flag, one for a battle without a single wound, one
       for taking at least one prisoner — and a battle whose army ran out
       before the flag fell is worth nothing, whatever it collected on the way.
       Read live by the level layer (`levelTally`): the unwounded star is held
       from the first turn and goes out on the first wound, the capture's
       lights on the first prisoner, the flag's on the capture that ends the
       round. The playable ends on the same count. */
    function tally() {
      if (outcome === false) return 0;
      return (flagTaken ? 1 : 0) + (hurtCards.length || refused.length ? 0 : 1) + (captives.length ? 1 : 0);
    }

    function finish(won) {
      if (ended) return;
      ended = true; outcome = won; turn = null; march = null; drag = null; selected = -1;
      var clean = won && !hurtCards.length && !refused.length;
      var bonus = won ? SURVIVOR * cardsLeft() + (clean ? UNSCATHED : 0) : 0;
      score += bonus;
      HUD.setScore(score);
      var stars = tally();
      if (won) {
        Sound.clip("victory", 0.8, 1);
        Fx.flash(GOLD, 0.4, 2);
        Pop.show("record", { word: CONFIG.copy.victory, sub: bonus ? "+" + bonus : "" });
      } else {
        Sound.clip("defeat", 0.8, 1);
        Fx.flash(RED, 0.4, 1.6);
      }
      if (clean) Pop.show("ultra", { word: "Unscathed", sub: "+" + UNSCATHED });
      /* THE ROWS ARE THE STARS: the three objectives, each with the star it
         earned or a dash, and then what the battle beat. The level layer adds
         no objective row of its own for a game that tallies its stars. */
      var star = function (on) { return on ? "★" : "—"; };
      var led = ledger();
      var rows = [
        { label: "Flag captured",  value: star(flagTaken && won), grade: flagTaken && won ? "gold" : "" },
        { label: "No wounds",      value: star(clean),            grade: clean ? "gold" : "" },
        { label: "Prisoner taken", value: star(won && captives.length > 0), grade: won && captives.length ? "gold" : "" },
        { label: "Foes beaten",    value: kills }
      ];
      endRound({
        title: won ? CONFIG.copy.victory : CONFIG.copy.gameOver,
        variant: won && stars === 3 ? "win" : "",
        score: score,
        stars: stars,
        rows: rows,
        /* The barracks reads this and nothing else of the round
           (packages/webshell/army.js). `won` is what decides whether a
           prisoner is offered at all. */
        army: { won: won, hurt: led.hurt, dead: led.dead, met: led.met, captives: led.captives, used: led.used },
        track: { score: score, kills: kills, losses: losses, ties: ties, scouted: scouted, traps: trapsCleared,
                 objects: smashed, strayed: strayed.length, won: won }
      });
    }

    /* The web target's level layer: `applyLevel` hands the climb's `d` before
       the round (the objective comes from it), and `levelWon` ends the round
       through the game's own result on the third star, so the end screen
       keeps these stat rows. Ignored by the playable. */
    function levelWon() {
      if (turn && turn.verdict.kind === "flag") return;   // the reveal's end declares it
      finish(true);
    }
    /* The level layer's two hooks on the stars: `levelTally` IS the count
       (it replaces the score bands, packages/webshell/levels.js) and
       `levelStars` stays as the floor it can never be promoted past — a lost
       battle is worth nothing. */
    function levelTally() { return tally(); }
    /* The objectives card (a tap on the level pill): the three stars are
       earned one by one, in any order — one star a row. */
    function levelRules() {
      var lost = outcome === false;
      return [
        { text: Lang.t("Retrieve the enemy <b>flag</b>"), stars: 1, done: !lost && flagTaken },
        { text: Lang.t("Win with no <b>wounds</b>"), stars: 1, done: !lost && !hurtCards.length && !refused.length },
        { text: Lang.t("Take a <b>prisoner</b>"), stars: 1, done: !lost && captives.length > 0 }
      ];
    }
    function levelStars(stars) { return outcome === false ? 0 : stars; }

    return { reset: reset, update: update, render: render,
             onDown: onDown, onMove: onMove, onUp: onUp, onResize: onResize,
             applyLevel: applyLevel, levelWon: levelWon, levelStars: levelStars, levelTally: levelTally, levelRules: levelRules,
             cardNode: cardNode, cardBack: cardBack, objectInfo: objectInfo, gradeInfo: gradeInfo,
             defense: defenseSim };
  })();
