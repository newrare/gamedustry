/*
  webshell — the META layer: what a player owns, and what brings them back.

  Loaded only by `node tools/build/build.mjs --target=web`, immediately before
  packages/webshell/levels.js, and inert for a game that declares no
  `web.meta` block in its manifest. A playable is one round shown once: it has
  no wallet, no album and no tomorrow, which is why none of this is in the
  motor.

  WHAT IT IS, AND WHY IT IS ONE MODULE

  The web build already had a reason to come back — thirty levels and ninety
  stars. What it did not have was anything to come back FOR once a level was
  cleared: the score went nowhere, a perfect run paid the same as a scrape, and
  a player who had walked the road had walked it. This layer is the loop that
  answers that, and it is four numbers and one collection:

    coins     the round's score, converted AT THE PLAYER'S OWN LEVEL.
              14 800 pts -> 14 coins at level 1, x the level: 148 at level 10.
              The end screen writes the sum out rather than the total.
    tickets   what the sticker machine eats. Bought with coins, given by the
              daily gift, dropped by a level-up.
    xp        the player's own climb, across every level and every game start.
              It is the FLAT conversion of the same score (one hundred points
              an xp), because the level is what multiplies the coins: a climb
              that also paid itself would run away from its own curve.
    stickers  twenty per game, the collection the album counts x/20. Twelve of
              them are EARNED off the map (below); the other eight only ever
              come out of the machine, and every one of them can come out of it
              twice — a double is not waste, it is what the shop buys.

  It is ONE module because those five things are one state: a draw spends a
  ticket and may pay a double, a double sells for coins, coins buy a ticket.
  Splitting it would mean four files reading and writing one save.

  WHERE THE TWELVE EARNED STICKERS COME FROM — the map, and nothing else:

    band 0..4 passed            stickers 1..5
    band 0..4 passed clean      stickers 6..10   (every level played in it 3*)
    all 30 levels cleared       sticker 11
    ninety of ninety            sticker 12, and it is the shiny one

  A band is PASSED when the climb went past it — a cleared level in a higher
  band, or level 30 itself for the top one. It is deliberately not "every level
  of the band cleared": a fork's two roads share a band and missing the road
  not taken is fine by design (docs/LEVELS.md), so a rule that demanded both
  would make five of the twelve unreachable for a player who chose. CLEAN is
  the same band with every level the player PLAYED in it at three stars — the
  road they walked, walked perfectly.

  Those twelve can also come out of the machine, but only once they have been
  earned: a milestone sticker that dropped from a draw would be a milestone
  bought, and the machine would be paying out the album's spine.

  NOTHING HERE IS A SCREEN. The album, the machine and the shop are
  packages/webshell/album.js; the daily strip is packages/webshell/daily.js;
  the map's own header reads this through window.__META__. What lives here is
  the state, the arithmetic, the two pieces of chrome every one of those
  screens needs (the wallet strip and the reward callout), and the two
  ceremonies they share — the three-box gift and the rewarded ad.

  THE REWARDED AD IS A STUB, and it says so on screen. The web target has no ad
  SDK at all (packages/platform/web.js drops MRAID outright), so `ad()` plays a
  placeholder card with a real countdown and then pays. It is the one piece of
  this layer that is waiting for something outside the repo; everything around
  it — the offer, the odds, the tripling — is finished and would not change the
  day a network is wired in. See docs/META.md.

  ES5-ish on purpose, like the rest of the motor: same mobile WebViews.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  var VW = window.__VIEW__;
  var MD = window.__MODAL__;
  if (!W) return;                       // not a web build

  var CONFIG = W.CONFIG;

  /* The manifest's `web.meta` block, injected as CONFIG.web by the builder.
     Its presence is the whole declaration: a game without one never sees a
     coin, and `active()` is false everywhere below. */
  var SPEC = (CONFIG.web && CONFIG.web.meta) || null;
  var ON = !!(SPEC && SPEC.stickers && SPEC.stickers.length);

  /* ── 0. strings ───────────────────────────────────────────────────────── */

  var STRINGS = {
    en: {
      coins: "Coins", tickets: "Tickets", level: "Level", lvShort: "Lv {n}",
      stickersEntry: "Stickers",
      album: "Stickers", shop: "Shop", map: "Levels", home: "Home", scores: "Leaderboard",
      more: "More",
      owned: "{n}/{t}", newSticker: "New sticker!", dupe: "Double",
      gotCoins: "+{n} coins", gotTickets: "+{n} ticket", gotTicketsN: "+{n} tickets",
      gotXp: "+{n} xp", levelUp: "Level up!", levelUpNote: "Player level {n} reached",
      pickOne: "Pick one",
      bonusTitle: "Three-star bonus",
      boostMul: "Multiply your {k}", boostMore: "One more", boostCost: "Watch an ad",
      mulXp: "xp", mulCoins: "coins", mulTicket: "tickets",
      adOfferBtn: "Watch an ad",
      adTitle: "Advertisement", adNote: "No ad network is wired in yet — this is a placeholder.",
      adSkip: "Claim", adWait: "{n}",
      adEyebrow: "Reward", adTapWait: "Reward in {n}",
      giftGot: "Your gift", collect: "Collect",
      tapCollect: "Tap to collect", tapPick: "Tap a box",
      rarity1: "Common", rarity2: "Rare", rarity3: "Epic", rarity4: "Legendary",
      wonBand: "Earned by clearing {b}", wonClean: "Earned by a clean run through {b}",
      wonAll: "Earned by clearing all 30 levels", wonPerfect: "Earned with a perfect 90/90",
      toBand: "Clear {b}", toClean: "Make a clean run through {b}",
      toAll: "Clear all 30 levels", toPerfect: "Get a perfect 90/90",
      awEyebrow: "Level map reward",
      awBand: "{b} cleared!", awClean: "Clean run through {b}!",
      awAll: "All 30 levels cleared!", awPerfect: "Perfect 90/90!",
      close: "Close", back: "Back"
    },
    fr: {
      coins: "Pièces", tickets: "Tickets", level: "Niveau", lvShort: "Nv {n}",
      stickersEntry: "Stickers",
      album: "Stickers", shop: "Boutique", map: "Niveaux", home: "Accueil", scores: "Classement",
      more: "Plus",
      owned: "{n}/{t}", newSticker: "Nouveau sticker !", dupe: "Doublon",
      gotCoins: "+{n} pièces", gotTickets: "+{n} ticket", gotTicketsN: "+{n} tickets",
      gotXp: "+{n} xp", levelUp: "Niveau supérieur !", levelUpNote: "Niveau de joueur {n} atteint",
      pickOne: "Choisis",
      bonusTitle: "Bonus trois étoiles",
      boostMul: "Multiplier tes {k}", boostMore: "Un de plus", boostCost: "Voir une pub",
      mulXp: "xp", mulCoins: "pièces", mulTicket: "tickets",
      adOfferBtn: "Voir une pub",
      adTitle: "Publicité", adNote: "Aucune régie n’est branchée — ceci est un substitut.",
      adSkip: "Récupérer", adWait: "{n}",
      adEyebrow: "Récompense", adTapWait: "Récompense dans {n}",
      giftGot: "Ton cadeau", collect: "Récupérer",
      tapCollect: "Touche pour récupérer", tapPick: "Touche une boîte",
      rarity1: "Commun", rarity2: "Rare", rarity3: "Épique", rarity4: "Légendaire",
      wonBand: "Gagné en terminant {b}", wonClean: "Gagné par un sans-faute sur {b}",
      wonAll: "Gagné en terminant les 30 niveaux", wonPerfect: "Gagné avec un 90/90 parfait",
      toBand: "Termine {b}", toClean: "Réussis un sans-faute sur {b}",
      toAll: "Termine les 30 niveaux", toPerfect: "Obtiens un 90/90 parfait",
      awEyebrow: "Récompense de la carte",
      awBand: "{b} terminé !", awClean: "Sans-faute sur {b} !",
      awAll: "30 niveaux terminés !", awPerfect: "90/90 parfait !",
      close: "Fermer", back: "Retour"
    }
  };

  /* Which of them the screen SHOUTS. Every string above is written in normal
     case, like the rest of the repo; the ones listed here are set in capitals
     by the motor's `upper` (packages/engine), which also takes the accents
     off — a capital carries none in this house. */
  var up = W.upper;
  var CAPS = ["coins", "tickets", "level", "lvShort", "stickersEntry", "album",
    "shop", "newSticker", "dupe", "gotCoins", "gotTickets", "gotTicketsN",
    "gotXp", "levelUp", "pickOne", "bonusTitle", "boostMul", "boostMore",
    "mulXp", "mulCoins", "mulTicket",
    "adOfferBtn", "adTitle", "adSkip", "giftGot", "collect", "tapCollect",
    "rarity1", "rarity2", "rarity3", "rarity4", "wonBand", "wonClean",
    "wonAll", "wonPerfect", "toBand", "toClean", "toAll", "toPerfect",
    "awEyebrow", "awBand", "awClean", "awAll", "awPerfect",
    "close", "back"
  ];
  (function () {
    function shout(v) {
      if (typeof v === "string") return up(v);
      if (v && v.length != null) { for (var i = 0; i < v.length; i++) v[i] = shout(v[i]); }
      return v;
    }
    for (var lang in STRINGS) if (STRINGS.hasOwnProperty(lang)) {
      for (var k = 0; k < CAPS.length; k++) {
        if (STRINGS[lang][CAPS[k]] != null) STRINGS[lang][CAPS[k]] = shout(STRINGS[lang][CAPS[k]]);
      }
    }
  })();

  var LANG = "en", T = STRINGS.en;

  function num(v) { return Number(v).toLocaleString(LANG === "fr" ? "fr-FR" : "en-US"); }

  function fill(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] != null ? vars[k] : m;
    });
  }

  /* ── 1. the tuning ────────────────────────────────────────────────────── */

  /* Everything a game may move, and what it is worth when it says nothing.
     The defaults are the thirteen's: a game only writes what it wants to be
     different, so a second game joining this layer is a one-line manifest
     block and not a table to fill in. */
  function opt(key, dflt) { return SPEC && SPEC[key] != null ? SPEC[key] : dflt; }

  /* WHAT A POINT IS WORTH, and the player's own level is the multiplier on it:
     a round pays `score / coinsPer` coins PER LEVEL, so 14 565 points is 14
     coins at level 1 and 140 at level 10. `coinsPer` is 100 or 1000 and
     nothing else, so the conversion is the score with its last two or three
     digits dropped — a sum the player does by eye, and the one the end screen
     draws on the score itself (`gainLine`). The level was a bar that only ever
     handed out a ticket; it is now the rate the whole game pays at, which is
     what makes the climb worth watching and what the end screen writes out as
     a sum rather than a total (`gainLine`).

     XP IS NOT ON THAT RATE. It is deliberately the old, flat conversion: the
     level is what multiplies the coins, so paying xp by the level too would
     make the climb feed itself and the curve underneath it (350 * l^1.3) would
     stop meaning anything. One run still moves the bar by the same amount at
     level 1 and at level 10 — what changes is what that run is worth in the
     wallet. */
  var POINTS_PER_COIN = opt("coinsPer", 1000);
  var POINTS_PER_XP = opt("xpPer", 100);
  var TICKET_PRICE = opt("ticketPrice", 250);
  /* What a double is bought back for, by rarity — A SHARE OF THIS GAME'S
     TICKET, never a fixed sum. It is well under the ticket price on purpose:
     selling doubles is what keeps a dry streak moving, not an income. Four
     commons for a ticket, and even a legendary double buys back less than one.

     It used to be 60 / 110 / 200 / 420 coins in every game, while the ticket
     is priced per game (8 coins on vipera, 625 on gearball): on seven boards a
     pull sold back for more than it cost, and the machine paid for itself for
     ever. Since every pull costs at least one ticket and hands over exactly
     one sticker, a price held under one ticket closes that loop at every bet
     and on the super ticket alike — `tools/build/build.mjs` refuses a
     manifest `sell` that breaks it. */
  var SELL_SHARE = [0.25, 0.4, 0.6, 0.9];
  var SELL = opt("sell", SELL_SHARE.map(function (f) {
    var v = f * TICKET_PRICE;
    v = v < 20 ? Math.round(v) : Math.round(v / 5) * 5;   // a legible price
    return Math.max(1, Math.min(TICKET_PRICE - 1, v));
  }));
  /* The machine's odds, by rarity. They are weights and not percentages, so a
     game can add a fifth tier without redoing the other four — except for the
     TOP one, whose weight only ever splits that tier between several stickers
     (below). */
  var DROP = opt("drop", [60, 25, 12, 3]);
  /* HOW MANY TICKETS ONE PULL MAY EAT, and what each extra one buys.

     THE TOP TIER IS A DIAL AND NOT A WEIGHT: one ticket is one percent of a
     legendary, five tickets are five, exactly — `legendaryPer` is that percent
     per ticket. A player counting tickets is doing arithmetic, and a number
     they can do in their head is the only kind they can decide on.

     Everything under it stays weighted: each extra ticket multiplies every
     tier above common by LUCK, which takes mass off common without ever
     reordering the ladder (rare overtaking epic is what LUCK^rarity did, and
     a ladder that inverts at five tickets is a ladder the player stops
     reading). On radiam's pool that is common 88 → 47%, rare 7 → 33%, epic
     3.5 → 16%, legendary 1 → 5%. */
  var MAX_BET = opt("maxBet", 5);
  var LUCK = opt("luck", 1.7);
  var LEG_PER = opt("legendaryPer", 1) / 100;
  var TOP_TIER = 3;                             // legendary, the pinned one

  /* THE SUPER TICKET — one pull, fifteen ordinary tickets' worth of coins.

     ITS ODDS ARE PINNED PER TIER AND NOT WEIGHTED, which is the one thing that
     makes it worth its price. An ordinary bet spreads a POOL: the weights are
     shared out over whatever stickers are still in the bag, so the same five
     tickets read 46/33/16/5 on a fresh board and something quite different
     once the map has paid a milestone out and taken it off the table — epic
     fell to 6% on a real board while rare climbed to 35%. A premium pull may
     not do that. It promises the same four numbers every time it is bought,
     and a promise that moves with the board is not one.

     So `SUPER_TOP` is the three tiers above common, in rarity order, as whole
     percentages; COMMON TAKES WHAT IS LEFT. A tier with nothing in it hands
     its share back to the others rather than dropping it on the floor — the
     pool excludes a milestone sticker until the map has paid it, so a board
     with no legendary left to roll must still add up to one.

     `SUPER_BET` is a SENTINEL and not a quantity: it is what `bet` is set to
     while the super pill is armed, and the one thing it must be is a value no
     count of tickets can ever take. It used to be 30 — a number that meant 30%
     through the ordinary dial — which read as thirty tickets on a row of
     1 2 3 4 5 and would have gone quietly wrong the day the odds changed.
     They just did.

     It has no chip in the wallet. The wallet is what can be spent anywhere;
     this is spent in exactly one place, and that place — the shop card and the
     machine's own pill — is where it is counted. */
  var SUPER_PRICE = opt("superPrice", TICKET_PRICE * 15);
  var SUPER_TOP = opt("superOdds", [20, 25, 30]);   // rare, epic, legendary
  var SUPER_BET = -1;
  var STICKERS = SPEC ? SPEC.stickers : [];
  var TOTAL = STICKERS.length;

  /* The player's own climb. A round pays its coins in xp as well, so the bar
     moves on every run and not only on a level cleared — the map is what
     rewards mastery, this is what rewards playing. The curve is the one shape
     that had to be chosen rather than derived: 350 * l^1.3 puts level 2 about
     three rounds in and level 10 about forty, which is a season and not an
     afternoon. */
  function xpFor(l) { return Math.round(350 * Math.pow(l, 1.3)); }

  function rarityOf(i) {
    var s = STICKERS[i - 1];
    var r = s && s.rarity ? s.rarity : "common";
    var k = ["common", "rare", "epic", "legendary"].indexOf(r);
    return k < 0 ? 0 : k;                       // 0..3
  }
  function sellPrice(i) { return SELL[rarityOf(i)] || SELL[0]; }
  function rarityName(i) { return T["rarity" + (rarityOf(i) + 1)]; }
  /* A STICKER'S NAME IS NOT TRANSLATED. It is a proper noun — the title the
     artwork was drawn under — and it reads the same on every board, which is
     what lets a player say "I got Starstruck" to someone playing in the other
     language. Everything else this layer writes goes through `Lang.t`; this
     one deliberately does not. */
  function nameOf(i) {
    var s = STICKERS[i - 1];
    return (s && s.name) || ("#" + i);
  }
  /* The picture, straight off CONFIG.art: `assets/image/embed/<slug>-stickerNN.webp`
     is a data URI in a single-file build and a hashed file in the split one,
     and nothing here has to know which. */
  function artOf(i) {
    var key = "sticker" + (i < 10 ? "0" + i : i);
    return (CONFIG.art && CONFIG.art[key]) || null;
  }

  /* ── 2. the save ──────────────────────────────────────────────────────── */

  /* One key per game, beside the map's own `prog:<slug>`, and kept apart from
     it because the two are read and written on different screens and at
     different rates — not because one outlives the other: OPTIONS erases both
     at once, and a wallet is no more precious than the climb that filled it.

     c coins · t tickets · x xp · s stickers {index: count} · a milestones
     already paid, by key · d the daily strip's own state · ar the barracks
     (army.js) — both of those write through here so there is one save and one
     schema. */
  var KEY = "meta:" + (CONFIG.slug || "game");
  var save = (function load() {
    var s = ON ? W.Store.get(KEY, null) : null;
    if (!s || s.v !== 1 || typeof s.s !== "object" || !s.s) {
      return { v: 1, c: 0, t: 1, st: 0, x: 0, s: {}, a: {}, d: null, ar: null };
    }
    if (!s.a) s.a = {};
    /* `st` arrived after the save did. A field added rather than a version
       bumped: a board with a climb and a collection in it must not be thrown
       away to make room for a counter that starts at zero. */
    if (typeof s.st !== "number") s.st = 0;
    return s;
  })();

  var hooks = [];
  function changed() {
    for (var i = 0; i < hooks.length; i++) hooks[i]();
    paintWallets();
  }
  function persist() { W.Store.set(KEY, save); changed(); }

  function coins() { return save.c; }
  function tickets() { return save.t; }
  function xp() { return save.x; }

  /* The level the xp adds up to, derived and never stored — a stored level is
     a level that can disagree with the xp under it, exactly as the map stores
     no "highest level unlocked". */
  function levelAt(x) {
    var l = 1;
    while (x >= xpFor(l) && l < 999) { x -= xpFor(l); l++; }
    return { level: l, into: x, need: xpFor(l) };
  }
  function playerLevel() { return levelAt(save.x).level; }

  function count(i) { return save.s[i] || 0; }
  function ownedCount() {
    var n = 0;
    for (var k in save.s) if (save.s.hasOwnProperty(k) && save.s[k] > 0) n++;
    return n;
  }
  function dupes() {
    var out = [];
    for (var i = 1; i <= TOTAL; i++) if (count(i) > 1) out.push(i);
    return out;
  }

  /* ── 3. earning and spending ──────────────────────────────────────────── */

  /* WHAT A ROUND'S XP OWES THE PLAYER, KEPT UNTIL THERE IS A SCREEN TO PAY IT
     ON. The state moves at once — it has to, the end screen's own arithmetic
     reads it back — but the READING waits, the same way a coin chip's figure
     waits for its piece to land. The end screen cannot show it (no bar), so
     the VILLAGE does, on arrival: the bar first, then the card. Rounds played
     back to back without passing through it (NEXT, a replay) ADD UP here
     rather than overwrite each other — the bar runs from where the player
     stood the last time they saw it, and every level crossed is paid. */
  var pendXp = null;                 // { before, levels }

  function addCoins(n) { save.c = Math.max(0, save.c + Math.round(n)); persist(); }
  function addTickets(n) { save.t = Math.max(0, save.t + Math.round(n)); persist(); }

  function spend(n) {
    if (save.c < n) return false;
    save.c -= n; persist();
    return true;
  }
  function useTicket(n) {
    n = Math.max(1, n | 0);
    if (save.t < n) return false;
    save.t -= n; persist();
    return true;
  }
  function addSupers(n) { save.st = Math.max(0, save.st + Math.round(n)); persist(); }
  function useSuper() {
    if (save.st < 1) return false;
    save.st -= 1; persist();
    return true;
  }

  /* XP is the one thing that can pay something else back: every player level
     gained hands out a ticket, which is what stops a player who never buys one
     from staring at a machine they cannot use. */
  /* XP MOVES THE STATE AND SAYS NOTHING. It used to fire a callout from in
     here, which is the moment the arithmetic happened and never the moment the
     player was looking: the xp of a cleared level is added on the END screen,
     where the wallet has no level bar at all (see `buildEnd`) and a cascade of
     coins is still running. The line landed over a reveal, for a bar nobody
     could see, and the reward it announced arrived before the screen that
     holds it. Who announces it is now the MAP's business — `arrive()`. */
  function addXp(n) {
    var before = playerLevel();
    save.x += Math.max(0, Math.round(n));
    var after = playerLevel();
    if (after > before) save.t += (after - before);
    persist();
    return after - before;
  }

  /* One sticker in. `true` when it was not there before, which is what the
     album's reveal and the machine's flourish are told apart by. */
  function give(i) {
    var isNew = !count(i);
    save.s[i] = count(i) + 1;
    persist();
    return isNew;
  }

  function sell(i) {
    if (count(i) < 2) return 0;
    var p = sellPrice(i);
    save.s[i]--; save.c += p; persist();
    return p;
  }
  function sellAll() {
    var got = 0, list = dupes(), i;
    for (i = 0; i < list.length; i++) {
      var n = list[i];
      got += sellPrice(n) * (count(n) - 1);
      save.s[n] = 1;
    }
    save.c += got;
    if (got) persist();
    return got;
  }

  /* ── 4. the machine's draw ────────────────────────────────────────────── */

  /* A weighted pick over the stickers that MAY drop: everything except a
     milestone sticker nobody has earned yet (see the header). The pool is
     rebuilt on every draw because it grows as the map is climbed — which is
     the point: a player deep in the climb is drawing from a wider album. */
  function pool() {
    var out = [], i;
    for (i = 1; i <= TOTAL; i++) {
      if (MILESTONE[i] && !count(i)) continue;     // earned off the map, not bought
      out.push(i);
    }
    return out.length ? out : [1];
  }

  /* THE CHANCE OF EVERY STICKER IN THE POOL, for a given bet, summing to 1.
     One place, because the machine SHOWS these numbers before it rolls them
     and a readout computed from a second formula is a readout that will one
     day be a lie.

     The top tier takes `bet * legendaryPer` of the probability off the top and
     the rest of the pool shares what is left, weighted. A pool with no
     legendary in it — radiam's, until the map has paid one — pins nothing and
     the row reads 0%, which is the truth: the machine cannot roll what is not
     in the bag. */
  /* THE SUPER TICKET'S FOUR NUMBERS, and they are the same four every time.
     Each tier is handed its pinned share and splits it evenly between the
     stickers it actually has in the pool — evenly, because within one tier the
     weights are equal anyway and a premium pull should not quietly favour the
     sticker that happens to be drawn first.

     An EMPTY tier is what the renormalise is for: its share would otherwise be
     probability that belongs to nobody, and `roll` walks the list subtracting
     until it goes under zero, so the missing slice would silently fall on the
     last sticker in the bag. */
  function superChances(list) {
    var want = [0, SUPER_TOP[0] / 100, SUPER_TOP[1] / 100, SUPER_TOP[2] / 100];
    want[0] = Math.max(0, 1 - want[1] - want[2] - want[3]);

    var n = [0, 0, 0, 0], i, r, live = 0;
    for (i = 0; i < list.length; i++) n[rarityOf(list[i])]++;
    for (r = 0; r < 4; r++) { if (!n[r]) want[r] = 0; live += want[r]; }

    var out = [];
    for (i = 0; i < list.length; i++) {
      r = rarityOf(list[i]);
      out.push(live > 0 ? (want[r] / live) / n[r] : 1 / list.length);
    }
    return out;
  }

  function chances(list, bet) {
    /* The super ticket is the one pull whose tiers are pinned rather than
       weighted (above). It branches HERE, inside the one function the readout
       and the roll both go through, so the bars the player reads before they
       spend stay the bars the machine rolls. */
    if (bet === SUPER_BET) return superChances(list);
    /* The luck the lower tiers get is capped at the biggest ordinary bet — it
       costs nothing today and it is what stops a bet above five, if one ever
       existed, from starving the common tier out of the machine. */
    var b = Math.max(1, bet | 0);
    var k = Math.pow(LUCK, Math.min(b, MAX_BET) - 1);
    var w = [], i, r, top = 0, rest = 0;
    for (i = 0; i < list.length; i++) {
      r = rarityOf(list[i]);
      var v = (DROP[r] || 1) * (r > 0 ? k : 1);
      w.push(v);
      if (r === TOP_TIER) top += v; else rest += v;
    }
    var pTop = top > 0 ? (rest > 0 ? Math.min(0.95, b * LEG_PER) : 1) : 0;
    var out = [];
    for (i = 0; i < list.length; i++) {
      r = rarityOf(list[i]);
      out.push(r === TOP_TIER ? (w[i] / top) * pTop
                              : (rest ? (w[i] / rest) * (1 - pTop) : 0));
    }
    return out;
  }

  function roll(bet) {
    var list = pool(), p = chances(list, bet), r = Math.random(), i;
    for (i = 0; i < list.length; i++) {
      r -= p[i];
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  /* The same numbers read per rarity, 0..1, over the pool that is actually
     left — a milestone sticker the map has not paid yet is not in it, so what
     the machine prints is the machine's and not the sheet's. */
  function odds(bet) {
    var list = pool(), p = chances(list, bet), out = [0, 0, 0, 0], i;
    for (i = 0; i < list.length; i++) out[rarityOf(list[i])] += p[i];
    return out;
  }

  /* ── 5. the milestones the map pays ───────────────────────────────────── */

  /* WHICH STICKER EACH MILESTONE HANDS OVER, in milestone order: the five
     bands, the five clean bands, the board, the perfect board. Twelve indices,
     and the SHAPE of that list is the layer's — a game may not add a
     milestone, only say which picture pays for one. `web.meta.awards` is that
     line, and it exists because a sheet's reading order is the painter's: the
     game's logotype and its trophy piece are wherever they were drawn, and
     the perfect board should pay in one of those rather than in whatever
     landed in cell twelve. Without it the first twelve are used in order.

     The twelfth is the SHINY one — the album's single piece of foil — because
     the twelfth milestone is ninety of ninety. */
  var AWARDS = (function (a) {
    if (a && a.length === 12) return a;
    var out = [], i;
    for (i = 1; i <= 12; i++) out.push(i);
    return out;
  })(SPEC && SPEC.awards);

  var MILESTONE = {};
  (function () {
    for (var i = 0; i < AWARDS.length; i++) MILESTONE[AWARDS[i]] = true;
  })();

  function awardKey(kind, band) { return band == null ? kind : kind + band; }

  /* Paid once, ever. The key is the milestone and not the sticker, so a game
     that later renumbers its album does not re-pay a climb already rewarded. */
  function award(kind, band, sticker) {
    var k = awardKey(kind, band);
    if (save.a[k]) return null;
    save.a[k] = 1;
    var isNew = give(sticker);              // give() persists, and so records `a`
    return { sticker: sticker, isNew: isNew, key: k };
  }

  /* Read the map back and pay whatever it now owes. Called after every round
     (the end screen) and on every arrival at the map, so a milestone crossed
     by a replay of an old level is never missed. It returns the list of
     stickers just earned, which the end screen shows one after the other. */
  function sweep() {
    var LV = window.__LEVELS__;
    if (!ON || !LV || !LV.active() || !LV.bands) return [];
    var st = LV.bands(), out = [], b, got;
    for (b = 0; b < st.bands.length && b < 5; b++) {
      if (st.bands[b].passed) {
        got = award("band", b, AWARDS[b]);
        if (got) out.push(got);
      }
      if (st.bands[b].passed && st.bands[b].clean) {
        got = award("clean", b, AWARDS[5 + b]);
        if (got) out.push(got);
      }
    }
    if (st.allCleared) { got = award("all", null, AWARDS[10]); if (got) out.push(got); }
    if (st.allPerfect) { got = award("perfect", null, AWARDS[11]); if (got) out.push(got); }
    return out;
  }

  /* WHAT THE PLAYER DID TO EARN IT, in as many words. "REWARD EARNED" said
     only that the map paid for it, which the player already knew — the useful
     half is WHICH climb it was, because that is the one the collection can
     send them back to. The milestone is read off the sticker's own position in
     `AWARDS`, so a game that renames its bands or re-points an award never has
     a second table to keep in step.

     IT HAS TWO TENSES. A sticker already in the album says what was DONE to
     earn it; one still missing says what to DO — the same milestone in the
     imperative, which turns a page of the collection into a list of things to
     go and try. `todo` is which half.

     Null rather than a stand-in when the levels layer is not there (a build
     with `web.meta` and no `web.levels`): the caller falls back to the plain
     line, because inventing a band name is worse than saying less. */
  function milestoneLabel(i, todo) {
    var mi = AWARDS.indexOf(i);
    if (mi < 0) return null;
    if (mi === 11) return todo ? T.toPerfect : T.wonPerfect;
    if (mi === 10) return todo ? T.toAll : T.wonAll;
    var LV = window.__LEVELS__;
    var name = (LV && LV.bandTitle) ? LV.bandTitle(mi < 5 ? mi : mi - 5) : null;
    if (!name) return null;
    var band = mi < 5;
    return fill(todo ? (band ? T.toBand : T.toClean)
                     : (band ? T.wonBand : T.wonClean), { b: name });
  }

  /* Is this sticker the shiny one? Only the perfect board's, and only once the
     board really is perfect — the album's one piece of foil. */
  function shiny(i) { return i === AWARDS[11]; }

  /* ── 6. rewards, as one value the whole layer passes around ───────────── */

  /* { kind: "coins" | "ticket" | "sticker" | "xp", n } — one shape for the
     daily strip, the gift boxes, the machine and the end screen, so granting,
     wording and tripling are each written once. */
  function reward(kind, n) { return { kind: kind, n: n }; }

  function randomReward(rich) {
    var r = Math.random();
    if (r < 0.34) return reward("coins", rich ? 240 + Math.floor(Math.random() * 260) : 90 + Math.floor(Math.random() * 130));
    if (r < 0.58) return reward("xp", rich ? 260 + Math.floor(Math.random() * 240) : 110 + Math.floor(Math.random() * 120));
    if (r < 0.82) return reward("ticket", rich ? 2 : 1);
    return reward("sticker", roll());
  }

  /* WHAT ONE DAY OF THE ROAD PAYS. The KIND is the road's — daily.js owns the
     ladder, because the ladder is a shape the player reads off the strip — and
     the AMOUNT is this file's, because every number this layer hands out is
     tuned in one place. It grows across the week, so the sixth day's coins are
     worth more than the first's without the road having to print either
     figure: what is promised is the KIND, what is kept secret is the size. */
  function dayReward(kind, day, mult) {
    var g = (1 + (Math.max(1, day || 1) - 1) * 0.25) * (mult || 1);
    if (kind === "coins")  return reward("coins",  Math.round((90 + Math.random() * 130) * g));
    if (kind === "xp")     return reward("xp",     Math.round((110 + Math.random() * 120) * g));
    if (kind === "ticket") return reward("ticket", Math.max(1, Math.round(g)));
    return randomReward(g > 2);
  }

  /* WHAT THE AD PAYS. It was three, which is a number nothing in this layer
     can draw: the shell's multiplier plates are x2, x5, x10, x20, x50 and
     x100 (tools/lab/encode-art.mjs), so a ×3 offer could only ever be set in
     the card's own type. Five is the one the artwork states, and an offer the
     player can SEE is worth more than a smaller one they have to read. */
  var AD_MULT = 5;

  function multiply(rw, k) {
    if (rw.kind === "sticker") return reward("sticker", roll());   // a second draw, not a triple copy
    return reward(rw.kind, rw.n * k);
  }

  function grant(rw) {
    if (rw.kind === "coins") { addCoins(rw.n); return; }
    if (rw.kind === "ticket") { addTickets(rw.n); return; }
    if (rw.kind === "xp") { addXp(rw.n); return; }
    if (rw.kind === "sticker") give(rw.n);
  }

  function rewardLabel(rw) {
    if (rw.kind === "coins") return fill(T.gotCoins, { n: num(rw.n) });
    if (rw.kind === "ticket") return fill(rw.n > 1 ? T.gotTicketsN : T.gotTickets, { n: rw.n });
    if (rw.kind === "xp") return fill(T.gotXp, { n: num(rw.n) });
    return nameOf(rw.n);
  }

  function rewardArt(rw) {
    if (rw.kind === "sticker") return '<img class="mt-rw-img" src="' + artOf(rw.n) + '" alt="">';
    /* A card hands over an AMOUNT, and the bag says so where one coin cannot:
       the wallet's chip counts coins, this is the pile that lands in it. The
       painted piece only exists in a build that carries the shell's artwork,
       so the coin — painted or stroked — is what it falls back to.

       `art` is what tells the dish under the picture to get out of the way,
       and it is decided per KIND rather than for the card: a build may well
       paint the coins and leave the ticket stroked, and the stroked one still
       needs its plate to have a body. */
    var name = rw.kind === "coins" ? "coin" : rw.kind === "ticket" ? "ticket" : "xp";
    var pic = rw.kind === "coins" ? artImg("coinPile", "mt-rwi") : null;
    var painted = !!pic || !!(CONFIG.shellArt && CONFIG.shellArt[name]);
    if (!pic) pic = icon(name, "mt-rwi");
    return '<span class="mt-rw-ico ' + rw.kind + (painted ? " art" : "") + '">' +
           pic + '</span>';
  }

  /* ── 7. the chrome every screen of this layer shares ──────────────────── */

  var API = null;                     // { el, icon } — handed in by menu.js
  function el(tag, cls, html) {
    if (API) return API.el(tag, cls, html);
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function icon(name, cls) { return API ? API.icon(name, cls) : ""; }
  /* A painted piece no pictogram is named after (menu.js, artImg): null when
     the build carries no artwork, so every caller keeps a fallback. */
  function artImg(role, cls) { return API && API.art ? API.art(role, cls) : null; }

  /* THE MULTIPLIER, PAINTED. "×5" set in the card's own type is a caption, and
     a caption is the one thing a five-times day must not read as — so where
     the build ships the plate for that number it is drawn instead, and the
     words it replaces come off (see `kindWord` in daily.js). Keyed by the
     NUMBER, so a shell that one day pays double or ten times asks for `2` or
     `10` and gets it or gets nothing; only the roles named in SHELL_CUTS are
     shipped (tools/lab/encode-art.mjs). */
  function multArt(n, cls) {
    return n > 1 ? artImg("mult" + n, cls || "mt-mult") : null;
  }
  function $(id) { return document.getElementById(id); }
  function frame() { return $("frame"); }

  /* THE WALLET STRIP. One node, built into whatever asked for it, repainted
     from one place — the map's header, the album, the shop and the end screen
     all show the same two numbers and they must never disagree by a frame.

     `opts.full` adds the player's own level bar; the album, the shop and the
     end screen take the bare pair.

     `opts.doors` makes the two NUMBERS the two ways out of the wallet — coins
     open the shop, tickets open the album — and it is then the ticket chip
     that wears the album's unseen dot. Two nodes rather than the four a pair
     of numbers beside a pair of buttons costs, which is what let the map's
     header lose its house and still say everything (levels.js).

     `opts.doors = "shop"` is that same wallet ON the album, where "go to the
     album" is not a door and the unseen dot has nothing left to announce: both
     chips lead to the shop, which is the one place either number is spent or
     refilled. It is what replaced the GET TICKETS button under the machine —
     a second way to the same screen, sitting where the player was not
     looking.

     `opts.lvHost` sends the level bar to a node of the caller's own instead of
     stacking it under the chips, so a header can give it a whole row.

     `opts.transient` is the END SCREEN's wallet, and it is the one that is not
     furniture. On the map, the album and the shop the two numbers are what the
     screen is about and they stand there all the time; on the end screen the
     player is reading a score, and a coin chip parked in the corner before a
     single coin has left says nothing while taking a corner of the frame for
     the whole reveal. So every chip of this one is VEILED, the transfer layer
     lifts the veil off the chip it is about to pay into and puts it back once
     the figure over it has been read (`unveil` / `veil` in section 8). A chip
     therefore arrives with its own cascade and leaves with its own tag, and a
     round that pays nothing shows no wallet at all. Veiled and not removed:
     the rect is what every flight aims at (`homeOf`), so the chip has to be in
     the layout before it is visible. */
  var wallets = [];

  function wallet(box, opts) {
    opts = opts || {};
    var bar = el("div", "mt-wallet" + (opts.full ? " full" : "") +
                        (opts.lvHost ? " split" : "") +
                        (opts.transient ? " transient" : ""));

    /* WHICH CHIP IS A DOOR, AND TO WHERE. Every chip of the band is one, and
       every one of them leads to the same screen from every screen:

         LV     → HOME, the title screen    COIN  → the shop
         TICKET → the collection            STAR  → the map

       which is the whole of this front end's navigation — there is no back
       arrow and no home button anywhere, because the four numbers the player
       is already reading are the four ways to go. THE LEVEL CHIP IS THE WAY
       OUT: it is the one number on the band that is about the player rather
       than about what they can spend, it is first in the row, and it goes
       where a home button would have. A chip whose destination is the screen
       it is standing on is INERT rather than missing: the row must not change
       shape as the player walks it, and a number that moved between screens
       would be a number to find again.

       `doors: "auto"` is the band's mode and the only one left. The end
       screen's transient wallet has no doors at all — it is a target for a
       flight, not a menu. */
    var chips = el("div", "mt-chips");
    var auto = opts.doors === "auto";

    function chip(kind, pic, door) {
      return el(door ? "button" : "div", "mt-chip " + kind + (door ? " door" : ""),
                icon(pic, "mt-ci") + '<b></b>');
    }
    var cCoins = chip("coins", "coin", auto);
    var cTick = chip("tickets", "ticket", auto);
    if (auto) {
      cTick.appendChild(el("i", "mt-badge"));
      cCoins.addEventListener("click", function () { goTo("shop"); });
      cTick.addEventListener("click", function () { goTo("sticker"); });
    }
    chips.appendChild(cCoins);
    chips.appendChild(cTick);

    var lvBox = null;
    if (opts.full) {
      /* The bolt in front of "LV 7" is the same one an xp reward hands over,
         which is what ties the number to the bar beside it: the chip is read
         as "this is what experience buys" rather than as a second score. It
         is FIRST in the row and it is the door to the ranking, because the
         player's own level is the one number on this band that is about them
         rather than about what they can spend. */
      lvBox = el(auto ? "button" : "div", "mt-lv" + (auto ? " door" : ""),
        icon("xp", "mt-lvi") +
        '<span class="lbl"></span><span class="bar"><u></u></span>');
      if (auto) lvBox.addEventListener("click", function () { goTo("ranking"); });
    }

    /* THE COLLECTION'S COUNT, and it is the album's own header moved into the
       band. That screen carried a name and an `x / 20` over a row that was
       already saying what the player owns: the name is what they tapped to get
       here, and the count is one of those numbers. So it is a chip like the
       rest, the album has no header left at all, and the height it was taking
       goes to the machine, the odds and the twenty tiles. */
    var cCount = null;
    if (opts.countHost) {
      cCount = chip("collection", "sticker", auto);
      if (auto) cCount.addEventListener("click", function () { goTo("sticker"); });
      opts.countHost.appendChild(cCount);
    }

    /* THE BOARD'S OWN STARS, last in the row. They are not spent and not
       earned by the wallet, which is why they sit at the far end of it — but
       they are what the player owns on THIS game, and the map is where they
       come from. A game with no levels has none and the chip is not built. */
    var cStars = null;
    if (opts.stars && window.__LEVELS__ && window.__LEVELS__.active()) {
      cStars = chip("stars", "star", auto);
      if (auto) cStars.addEventListener("click", function () { goTo("map"); });
    }

    bar.appendChild(chips);
    if (lvBox) (opts.lvHost || bar).appendChild(lvBox);
    if (cStars) (opts.starHost || bar).appendChild(cStars);
    box.appendChild(bar);

    var w = {
      node: bar,
      /* The row the chips, the level and the stars all sit in — they are
         siblings rather than children, because the row's ORDER is the
         navigation and `wallet` does not own it. `veilAll` sweeps from here. */
      root: opts.root || box,
      transient: !!opts.transient,
      /* The house chip is built by the ROW and not here — it is not a number —
         but `bandDoors` greys it with the others, so it travels along. */
      home: opts.homeHost || null,
      lvBox: lvBox,
      coins: cCoins.querySelector("b"),
      tickets: cTick.querySelector("b"),
      badge: cTick.querySelector(".mt-badge"),
      count: cCount,
      countN: cCount ? cCount.querySelector("b") : null,
      stars: cStars,
      starN: cStars ? cStars.querySelector("b") : null,
      lvl: lvBox ? lvBox.querySelector(".lbl") : null,
      bar: lvBox ? lvBox.querySelector(".bar u") : null
    };
    wallets.push(w);
    paintWallet(w);
    return w;
  }

  /* A chip's destination, and the one rule about it: a chip standing on its
     own screen does nothing. Written once here rather than four times above,
     because the inert state and the tap are the same question. */
  function goTo(view) {
    if (VW.top() === view) return;
    if (view === "shop") { if (window.__ALBUM__) window.__ALBUM__.openShop(); return; }
    if (view === "sticker") { if (window.__ALBUM__) window.__ALBUM__.open(); return; }
    if (view === "map") { if (window.__LEVELS__) window.__LEVELS__.open(); return; }
    VW.go(view);
  }

  /* The star chip leads to the map on a game that has one, and is not built at
     all on a game that does not. */

  /* What the wallet holds NOW, by kind — read before a gift is granted, so
     the landing has something to count up from. xp is in here because its
     chip is a bar and a bar has a start too; it used to be the one reward
     whose `before` was 0, which is why it was also the one whose arrival the
     player never saw. */
  function walletOf(kind) {
    return kind === "coins" ? save.c : kind === "ticket" ? save.t
         : kind === "xp" ? save.x : 0;
  }

  /* THE BAR, RUN FROM ONE FIGURE TO ANOTHER. `paintWallet` writes a width and
     the stylesheet transitions it, so filling is free — what is not free is a
     LEVEL being crossed, where the honest width goes backwards and a bar that
     jumps back reads as a loss. So the crossing is played in two: the bar runs
     to the end of the level it was in, and only then starts again from nothing
     at the new one. */
  function fillLv(w, from, to) {
    if (!w.lvBox) { paintWallets(); return; }
    var a = levelAt(from), b = levelAt(to);
    if (a.level === b.level) { paintWallet(w); return; }

    w.lvl.textContent = "LV " + a.level;
    w.bar.style.width = "100%";
    setTimeout(function () {
      /* Back to nothing WITHOUT a transition, or the reset is the same
         backwards slide this exists to avoid — then the real fill runs. */
      w.lvBox.classList.add("no-anim");
      w.bar.style.width = "0%";
      void w.lvBox.offsetWidth;
      w.lvBox.classList.remove("no-anim");
      paintWallet(w);
    }, LV_ROLL);
  }
  var LV_ROLL = 520;                            // the width transition, plus a beat

  function paintWallet(w) {
    /* A chip that is COUNTING owns its own text until it lands (countTo). The
       save is already right; what is on screen is the reading of it, and a
       repaint in the middle of a spree is what would make it a lie. */
    if (!w.coins.mtRun) w.coins.textContent = num(save.c);
    if (!w.tickets.mtRun) w.tickets.textContent = num(save.t);
    if (w.badge) {
      /* The dot on the album button is not a count — it is "there is something
         in there you have not seen", which is the only thing a badge may ever
         say without being read. */
      w.badge.className = "mt-badge" + (unseen() ? " on" : "");
    }
    if (w.lvl) {
      /* HELD, the way a coin chip is held: a gift is granted before its card
         is even drawn, so without this the bar has already moved behind the
         blur and the landing has nothing left to show (see flyReward). */
      var p = levelAt(w.holdXp == null ? save.x : w.holdXp);
      w.lvl.textContent = "LV " + p.level;
      w.bar.style.width = (100 * p.into / p.need).toFixed(1) + "%";
    }
    if (w.countN) w.countN.textContent = ownedCount() + "/" + TOTAL;
    /* THE BOARD, x / 90 — and it burns the way the map's own roads do once it
       is finished: at that point the number stops being a climb and becomes a
       result. */
    if (w.starN && window.__LEVELS__) {
      var LV = window.__LEVELS__;
      w.starN.textContent = LV.total() + "/" + LV.max();
      w.stars.classList.toggle("full", LV.perfect());
    }
  }
  function paintWallets() {
    for (var i = wallets.length - 1; i >= 0; i--) {
      if (!wallets[i].node.parentNode) { wallets.splice(i, 1); continue; }
      paintWallet(wallets[i]);
    }
  }

  /* What the album has that the player has not looked at yet. Written by
     album.js when it opens, read by every wallet. */
  function unseen() { return (save.n || 0) > 0; }
  function markSeen() { if (save.n) { save.n = 0; persist(); } }
  function bumpUnseen() { save.n = (save.n || 0) + 1; persist(); }

  /* ── 7b. where a notice lands ────────────────────────────────────────

     The words this layer says (a purchase refused, a card enlisted) are the
     motor's Notify, the one voice for information on every screen — there
     used to be a second one here, `say`, and it was the same idea one layer
     up. What this layer adds is WHERE a notice goes when it leaves: into the
     chip it is about, the one the wallet's own pieces fly into (homeOf), so
     "+1 ticket" ends in the ticket chip exactly as the ticket itself does. */
  if (W.Notify) W.Notify.target(function (icon) {
    var kind = icon === "coin" ? "coins" : icon === "xp" ? "xp"
             : (icon === "ticket" || icon === "super" || icon === "sticker") ? "ticket" : null;
    var home = kind && homeOf(kind);
    return home ? home.node : null;
  });

  /* ── 8. the transfer layer — the one way a wallet number ever moves ──── */

  /* EVERY SCREEN THAT PAYS, CHARGES OR HANDS SOMETHING OVER CALLS `fx`, and
     nothing else in this front end animates a chip. There used to be four
     near-copies of the same twenty lines — the end screen's coin cascade, the
     reward card's token, the shop's purchase and the shop's price — each with
     its own idea of when the chip should be held back, when it should count
     and whether the figure was written over it. Four copies is four places a
     fix lands in three of.

     What the system says, once:

       A NUMBER THAT CHANGED BEHIND SOMETHING CHANGED NOTHING THE PLAYER SAW.
       So the chip is put back to what it read before the state moved, a piece
       is thrown from wherever the change happened into the chip that holds it,
       and the figure climbs on the landing with the amount written over it.

     `fx(o)`:

       kind    which chip, and what flies: "coins" | "ticket" | "xp" | "sticker"
       n       what moved, SIGNED — -250 charged, +280 earned
       from    a node or a rect the pieces leave. Without one nothing flies and
               the figure and the count happen where they stand (a purchase
               with no chip to leave from: the shop's super ticket).
       rw      a reward object to draw instead of the kind's own piece — a
               sticker's own picture, the coin pile a card hands over
       before   what the chip READ before the state moved. Defaults to the save
               minus `n`, which is right whenever the caller moved the state
               itself and did not repaint anything in between.
       burst   fly eighteen small pieces instead of one, and count THROUGH the
               cascade rather than on its landing. That is a transfer being
               READ — a score becoming coins, a shelf of doubles becoming
               coins — where one piece is one thing changing hands.
       big     the single piece arrives at reward size (what was just bought is
               the subject of the animation)
       tag     write the figure over the chip on the landing. Default on; a
               reward card turns it off, because the card already says the
               figure twice and a third reading lands while it is still there.
       spread  scatter the figure and the launch — for a spree, where five taps
               put five of everything on one point
       done    called when the last piece lands

     A RECT IS AS GOOD AS A NODE for `from`, and for a card it is better: the
     card is already closing when this runs and a closing card is mid-transform,
     so the caller measures first and closes second. */

  var HOME_MS = 620;                       // one piece, launch to landing
  /* The xp figure is read for longer than any other. A coin chip counts up
     BESIDE its label, so the figure is confirmation; a bar has no number of
     its own, so this IS the reading — and on a level-up the bar is still
     running a second after it appeared. */
  var XP_TAG_MS = 2100;
  var TAG_MS = 1300;                       // and every other figure's own life
  var FLY_N = 18, FLY_MS = 620, FLY_GAP = 46;   // the cascade
  /* The beat between a figure leaving the screen and a transient chip going
     with it: they must not vanish on the same frame, or the chip reads as
     having been taken away rather than as having finished. */
  var VEIL_BEAT = 320;

  /* The chip a reward belongs in, taken off whichever wallet is on screen.
     There may be several built (the map's header, the album's, the shop's) and
     only one of them is visible, so the rect is the test — a detached or
     hidden wallet measures zero. */
  function chipOf(w, kind) {
    if (kind === "xp") return w.lvBox;     // the bar, which is the xp chip
    if (!w.node) return null;
    /* Everything that is not a coin and not xp lands in the ticket chip: a
       ticket, and a sticker, whose chip is the album's own door. */
    return w.node.querySelector(".mt-chip." + (kind === "coins" ? "coins" : "tickets"));
  }

  function homeOf(kind) {
    for (var i = wallets.length - 1; i >= 0; i--) {
      var bar = wallets[i].node;
      if (!bar || !bar.parentNode) continue;
      var n = chipOf(wallets[i], kind);
      if (!n) continue;
      var r = n.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return { node: n, w: wallets[i] };
    }
    return null;
  }

  /* ── the veil, and it is only ever the end screen's ─────────────────────
     A transient chip (see `wallet`) is in the layout and out of sight until
     something is paid into it. `reveal` is called by `fx` on its way in and
     `veil` on its way out, a beat after the figure over the chip has been
     read — and the two COUNT, because a round can pay into the same chip
     twice (the coin cascade, then a gift): the last transfer to finish is what
     puts the chip away, never the first. */
  function unveil(w, kind) {
    if (!w || !w.transient) return;
    var n = chipOf(w, kind);
    if (!n) return;
    n.mtSeen = (n.mtSeen || 0) + 1;
    n.classList.add("shown");
  }

  function veil(w, kind, delay) {
    if (!w || !w.transient) return;
    var n = chipOf(w, kind);
    if (!n) return;
    setTimeout(function () {
      n.mtSeen = Math.max(0, (n.mtSeen || 0) - 1);
      if (n.mtSeen) return;
      /* The punch's own animation is `both`, so it holds the chip at scale(1)
         long after it has played — which would pin the veil's slide out. It
         has nothing left to do once the chip is going. */
      n.classList.remove("mt-hit");
      n.classList.remove("shown");
    }, delay);
  }

  /* Back to nothing shown and nothing owed, on the frame the end screen goes
     away: a transfer whose `veil` timer is still out there must not lift a
     chip off the next round's screen. */
  function veilAll(w) {
    if (!w || !w.node) return;
    var all = (w.root || w.node).querySelectorAll(".mt-chip, .mt-lv");
    for (var i = 0; i < all.length; i++) {
      all[i].mtSeen = 0;
      all[i].classList.remove("shown");
    }
  }

  /* A node's centre, in the frame's own design pixels — the space every
     floating piece of this layer is positioned in. */
  function frameXY(node) {
    var host = frame();
    if (!host || !node) return null;
    var r = node.getBoundingClientRect ? node.getBoundingClientRect() : node;
    var fr = host.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    var k = 720 / (fr.width || 720);
    return { x: (r.left + r.width / 2 - fr.left) * k,
             y: (r.top + r.height / 2 - fr.top) * k,
             w: r.width * k, h: r.height * k };
  }

  /* The figure that moved, over the chip it moved in. */
  function tagFly(node, html, cls, spread, ms) {
    var p = frameXY(node);
    if (!p) return;
    var up = cls.indexOf("up") >= 0;
    var t = el("div", "mt-tag " + (cls || ""), html);
    t.style.left = p.x + "px";
    /* A figure that RISES starts clear of the chip, one that falls starts just
       under it — either way it never covers the number it is explaining. */
    t.style.top = (p.y + p.h * (up ? 0.95 : 0.55)) + "px";
    /* SCATTER IS FOR A SPREE AND NOTHING ELSE. Five taps in a second put five
       of these on one chip and two identical figures on one point read as one
       smeared number; a lone figure — the end screen's payout — has nothing to
       avoid and belongs under the middle of its chip. */
    if (spread) {
      t.style.setProperty("--jit", Math.round((Math.random() - 0.5) * spread * 2) + "px");
      t.style.setProperty("--jit-y", Math.round((Math.random() - 0.3) * spread) + "px");
    }
    frame().appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, ms || TAG_MS);
    return t;
  }

  function hit(node) {
    if (!node) return;
    node.classList.remove("mt-hit");
    void node.offsetWidth;                      // restart the animation
    node.classList.add("mt-hit");
  }

  /* One piece in the air. `k` scales it down as it arrives so it reads as
     going INTO the chip rather than landing beside it. */
  function piece(host, cls, html, a, b, jit, k, delay, ms) {
    var jx = jit ? Math.round((Math.random() - 0.5) * jit * 2) : 0;
    var jy = jit ? Math.round((Math.random() - 0.5) * jit * 1.6) : 0;
    var n = el("div", cls, html);
    n.style.left = (a.x + jx) + "px";
    n.style.top = (a.y + jy) + "px";
    host.appendChild(n);
    setTimeout(function () {
      /* The start state has to be RESOLVED before the end state is set, or the
         two are one style recalculation and the transition never runs — the
         piece simply appears on the chip. A rAF is not enough (it can fire
         ahead of the recalculation); reading a layout property is, because it
         forces one. */
      void n.offsetWidth;
      n.classList.add("go");
      if (ms) n.style.transitionDuration = ms + "ms";
      n.style.transform = "translate(" + (b.x - a.x - jx) + "px," +
                          (b.y - a.y - jy) + "px) scale(" + k + ")";
    }, delay);
    return n;
  }

  /* HOLD THE READING BACK. The state moved before this ran — it has to have,
     or the card could not have said what it paid — so every wallet is already
     showing the new figure. This puts the chip back to what the player last
     saw, invisibly, and the landing is what moves it. Claiming the cell
     (`mtRun`) is also what stops the next repaint writing over the hold. */
  function hold(home, cell, lv, before) {
    if (cell) {
      cell.mtRun = (cell.mtRun || 0) + 1;
      cell.textContent = num(before);
    }
    /* XP IS HELD TOO, and it is the BAR that holds it: its chip has no number,
       but it has a width, and a width that moved behind a blurred card moved
       where nobody was looking. Put back without a transition — the rewind
       itself must not be seen. */
    if (lv && lv.lvBox) {
      lv.holdXp = before;
      lv.lvBox.classList.add("no-anim");
      paintWallet(lv);
      void lv.lvBox.offsetWidth;
      lv.lvBox.classList.remove("no-anim");
    }
  }

  /* HOLD THE MOMENT THE STATE MOVES, not the moment the piece flies. A gift
     card grants its reward before it can say what it is, and `persist` repaints
     every wallet on screen — so on the daily road, where the map opens under
     the card, the header counted UP for the quarter second the card was still
     fading in. The player watched the money arrive and was then asked to
     collect it. Whoever grants calls this at once; `fx` holds again on its way
     out, which costs one claim and nothing else. */
  function holdKind(kind, before) {
    var home = homeOf(kind);
    if (!home) return;
    hold(home,
         kind === "coins" ? home.w.coins : kind === "ticket" ? home.w.tickets : null,
         kind === "xp" ? home.w : null,
         before);
  }

  function fx(o) {
    o = o || {};
    var kind = o.kind || (o.rw && o.rw.kind) || "coins";
    var home = homeOf(kind), host = frame();
    var after = walletOf(kind);
    var n = o.n != null ? o.n : (o.rw ? o.rw.n : 0);
    var before = o.before != null ? o.before : after - n;

    if (!home || !host) { paintWallets(); if (o.done) o.done(); return 0; }

    var cell = kind === "coins" ? home.w.coins
             : kind === "ticket" ? home.w.tickets : null;
    var lv = kind === "xp" ? home.w : null;
    hold(home, cell, lv, before);

    /* THE CHIP COMES OUT WITH WHAT IS COMING TO IT. On every screen but the
       end one this does nothing — the wallet is already there. On the end
       screen it is what puts the chip on the frame, in time for the first
       piece to arrive on it, and `veil` below is what takes it away again.

       NOT `reveal`: this module already has one, and it is the gift card's
       (section 10). Two function declarations of one name in one scope is the
       second one winning silently. */
    unveil(home.w, kind);
    var away = (kind === "xp" ? XP_TAG_MS : TAG_MS) + VEIL_BEAT;

    var a = o.from ? frameXY(o.from) : null;
    var b = frameXY(home.node);
    var span = 0, i;

    /* The count runs THROUGH a cascade and ON the landing of a single piece:
       eighteen coins are the transfer itself being read, so the figure has to
       be moving while they are in the air; one piece is a thing changing
       hands, and the number it is worth belongs to the moment it arrives. */
    function land() {
      hit(home.node);
      if (o.tag !== false && n) writeTag();
      if (cell) {
        if (!o.burst) {
          if (after !== before) countTo(cell, before, after, 380);
          else cell.textContent = num(after);
        }
      } else if (lv) {
        /* The bar takes the xp it was holding and runs — and the figure it ran
           by is printed UNDER it, because a bar says how far along the player
           is and never how much just arrived. */
        lv.holdXp = null;
        fillLv(lv, before, after);
      } else paintWallets();
      /* Measured from the LANDING and not from the launch: what the chip is
         waiting to be read for is the figure written over it, which is written
         here (`writeTag`) whatever the transfer was. */
      veil(home.w, kind, away);
      if (o.done) o.done();
    }

    function writeTag() {
      var sign = n < 0 ? "-" : "+";
      var pic = icon(kind === "coins" ? "coin" : kind === "xp" ? "xp" : "ticket", "mt-ci");
      var body = kind === "sticker" ? sign : sign + num(Math.abs(n)) + pic;
      /* THE DIRECTION IS THE CHIP'S, not the sign's, for xp alone. Everywhere
         else a figure rises off the chip when it is earned and falls off it
         when it is spent; xp has no chip — it has a BAR, and the one place a
         figure can sit without covering the number the bar is labelled with is
         UNDER it. A gain rising here crosses the level row and lands on the
         header, which is where it went unread. */
      var dir = kind === "xp" ? "down xp" : (n < 0 ? "down" : "up");
      tagFly(home.node, body, dir, o.spread || 0, kind === "xp" ? XP_TAG_MS : 0);
    }

    if (a && o.burst) {
      for (i = 0; i < FLY_N; i++) {
        (function (idx) {
          piece(host, "mt-coin", icon("coin", "mt-ci"), a, b, 60, 0.45,
                idx * FLY_GAP + 20, FLY_MS);
          setTimeout(function () {
            W.Sound.cue("uiRow", 0.32, 1.1 + idx * 0.035, 620 + idx * 40, 0.04);
            if (idx === FLY_N - 1) land();
          }, idx * FLY_GAP + FLY_MS + 40);
        })(i);
      }
      span = FLY_N * FLY_GAP + FLY_MS + 60;
      /* Counting starts NOW and lasts the whole cascade: the chip fills as the
         coins arrive, which is the reading the eighteen of them exist for. */
      if (cell) countTo(cell, before, after, span);
      /* The pieces live in the frame, not in the piece() helper's hands. */
      setTimeout(function () { sweepPieces(host, "mt-coin"); }, span + 200);
    } else if (a) {
      var fly = piece(host, "mt-home " + (o.big ? "big " : "") + kind,
                      rewardArt(o.rw || { kind: kind, n: Math.abs(n) || 1 }),
                      a, b, o.spread ? 45 : 0, o.big ? 0.26 : 0.3, 0, 0);
      setTimeout(function () {
        if (fly.parentNode) fly.parentNode.removeChild(fly);
        W.Sound.cue("uiStar", 0.6, o.big ? 1.35 : 1.25, o.big ? 1040 : 980, 0.12, "triangle");
        land();
      }, HOME_MS);
      span = HOME_MS;
    } else {
      /* NOTHING FLIES. A charge has no piece — the money does not become an
         object on its way out — so the figure falls off the chip and the
         number runs down under it. Short on purpose: the screen underneath is
         repainted against the REAL figure, and a long count leaves a card
         disagreeing with the chip above it. */
      if (o.tag !== false && n) writeTag();
      hit(home.node);
      if (cell) countTo(cell, before, after, 340);
      else if (lv) { lv.holdXp = null; fillLv(lv, before, after); }
      W.Sound.cue("uiRow", 0.5, n < 0 ? 0.68 : 1.2, n < 0 ? 300 : 900, 0.1);
      veil(home.w, kind, away);
      if (o.done) o.done();
    }
    return span;
  }

  /* The cascade's pieces remove themselves by class rather than by handle:
     eighteen timers holding eighteen closures is eighteen ways to leak one. */
  function sweepPieces(host, cls) {
    var all = host.querySelectorAll("." + cls);
    for (var i = 0; i < all.length; i++) {
      if (all[i].parentNode) all[i].parentNode.removeChild(all[i]);
    }
  }

  /* ---- what the screens call it by ---------------------------------------
     Three names over one engine, because a call site reads better saying what
     it is doing than filling in a bag of options. Nothing here has behaviour
     of its own. */

  /* A gift leaving its card, and it WRITES ITS FIGURE like every other move in
     this layer. The tag used to be off here on the grounds that the card had
     already said the amount twice — but the card is GONE by then: collecting
     closes it and the piece takes 620 ms to land, so what the figure would
     have overlapped stopped existing 400 ms earlier. What was left was a chip
     climbing on its own, which is the one thing this whole layer exists to
     stop: a number that changed with nothing to say it changed.

     A STICKER IS THE EXCEPTION and keeps it off. Its `n` is an index, not an
     amount, so the tag can only ever read "+" — a figure with no figure in
     it. What it landed on says the rest: the album's own door, with the unseen
     dot already on it. */
  function flyReward(rect, rw, before, done) {
    fx({ rw: rw, from: rect, before: before,
         tag: rw.kind !== "sticker", done: done });
  }

  /* What it cost, leaving the wallet. `from`/`to` are handed in rather than
     read off the save, because the transaction has already happened by the
     time this runs — the numbers are the state, this is the reading of it. */
  function spendFx(from, to) {
    fx({ kind: "coins", n: to - from, before: from, spread: 75 });
  }

  /* The whole trade, in the order a trade reads: it costs, then it pays. The
     caller has already moved the state and hands over what it moved, so a tap
     that failed to buy anything can never animate a purchase. */
  function buyFx(o) {
    if (o.cost) spendFx(save.c + o.cost, save.c);
    var n = o.n || 1, kind = o.kind || "ticket";
    var before = walletOf(kind) - n;
    /* Held at once, thrown a beat later: the transaction is already written
       and every wallet has already been repainted with it, so the chip would
       otherwise say the new figure before the piece had left the button. */
    var home = homeOf(kind);
    var cell = home && (kind === "coins" ? home.w.coins : home.w.tickets);
    if (cell) { cell.mtRun = (cell.mtRun || 0) + 1; cell.textContent = num(before); }
    setTimeout(function () {
      fx({ kind: kind, n: n, from: o.from, before: before, big: true, spread: 75 });
    }, 170);
  }

  /* ── 8a-ter. the map's arrival: the bar, then the card ────────────────── */

  /* THE BAR COMES UP EMPTY AND FILLS TO WHERE THE PLAYER NOW STANDS, rather
     than sliding from the old figure to the new one. After a round the
     question is "how far am I", and an empty bar filling answers it in one
     movement — where forty points inside a level three hundred long is a
     twitch nobody reads as progress.

     A LEVEL CROSSED is still played in two: to the end of the level that was
     left, then again from nothing at the new one. Without that the second half
     of the climb is a bar that jumps backwards, which reads as a loss. */
  var LV_RUN = 560;

  function runLv(w, before, done) {
    if (!w || !w.lvBox) { if (done) done(); return; }
    var a = levelAt(before), b = levelAt(save.x);

    function step(label, need, into, next) {
      w.lvBox.classList.add("no-anim");
      w.lvl.textContent = "LV " + label;
      w.bar.style.width = "0%";
      void w.lvBox.offsetWidth;              // the empty state, resolved
      w.lvBox.classList.remove("no-anim");
      void w.lvBox.offsetWidth;              // …and only then the target
      w.bar.style.width = (100 * into / need).toFixed(1) + "%";
      setTimeout(next, LV_RUN);
    }

    if (a.level === b.level) {
      step(b.level, b.need, b.into, function () { if (done) done(); });
      return;
    }
    step(a.level, a.need, a.need, function () {
      W.Sound.cue("uiStar", 0.8, 1.5, 1180, 0.18, "triangle");
      step(b.level, b.need, b.into, function () { if (done) done(); });
    });
  }

  /* WHAT THE MAP OWES THE PLAYER THE MOMENT IT OPENS, in the one order that
     reads: the bar moves, the figure that moved it is printed under it, and
     only then does the card for a level crossed arrive. It used to be the
     reverse — a callout fired on the end screen, seconds before the screen
     that could show what it was talking about.

     THE VILLAGE IS WHERE IT PLAYS. It was the map, when the map's header was
     the one wallet with a level bar; the band is the view system's now and
     carries the bar on every view, and the village is where the end screen
     sends the player back — the place an event of the player's own climb is
     announced, rather than a screen they open to pick a level.
     `village.js` calls this from its `show()`; `levels.js` only does for a
     game with no village. */
  function arrive() {
    if (!pendXp) return;
    var p = pendXp; pendXp = null;
    var home = homeOf("xp");
    if (!home) return;                        // no bar on screen, nothing to read

    var n = save.x - p.before, tag = null;
    if (n > 0) {
      hit(home.node);
      tag = tagFly(home.node, "+" + num(n) + icon("xp", "mt-ci"), "down xp", 0, XP_TAG_MS);
    }
    runLv(home.w, p.before, function () {
      if (!p.levels) return;
      /* The figure goes before the card does. It is held long enough to be
         read while the bar runs, and on a level-up the card arrives inside
         that hold — a number left sitting under a blurred backdrop is a number
         nobody reads and a smear on the card that replaced it. */
      if (tag && tag.parentNode) tag.parentNode.removeChild(tag);
      /* THE CARD IS THE ANNOUNCEMENT. Its own title says what happened — a
         level up — so nothing has to be said twice, and the ticket a level
         pays is handed over the way every other reward in this layer is.
         `granted` because `addXp` already paid it: the card reads the state,
         it does not move it a second time.
         The title is LEVEL UP and never "Level 5!": one door away from a map
         of thirty numbered levels, a bare number read as a level of the map,
         and the reward had no cause the player could name. The eyebrow writes
         the level reached, and calls it the PLAYER's. */
      prize({
        reward: { kind: "ticket", n: p.levels },
        boost: false, granted: true,
        eyebrow: fill(T.levelUpNote, { n: playerLevel() }),
        got: T.levelUp
      });
    });
  }

  /* ── 8b. one card, and the tap that dismisses it ──────────────────────── */

  /* A REWARD CARD IS DISMISSED BY TAPPING IT, anywhere, not only on its button.
     The card is one object saying one thing and there is one way out of it, so
     asking a thumb to find a 44 px pill at the bottom of it is asking for a
     precision the moment does not deserve. The button stays — it is what says
     what the tap DOES, and it is the keyboard's way out — and this is the same
     action under a much larger target.

     A real control inside the card keeps its own click: WATCH AN AD must never
     be what a thumb lands on by missing. The walk up to the box is manual
     rather than `closest("button")`, which is the same reason everything else
     here is ES5-ish. */
  /* WHY THIS SURVIVED THE VIEW SYSTEM. A modal declares `dismiss` and `esc`
     when it opens (packages/webshell/view.js), which is right for every card
     in this shell but one: the ceremony's card CHANGES CHARACTER halfway
     through. Three boxes are a choice and answer to neither a tap nor a key;
     the reward that replaces them has nothing left to decide and answers to
     both. So the card opens closed to both and arms itself here, on the beat
     it stops asking. */
  function tapToDismiss(box, fn) {
    box.addEventListener("click", function (e) {
      var n = e.target;
      while (n && n !== box) {
        if (n.tagName === "BUTTON" || n.tagName === "A") return;
        n = n.parentNode;
      }
      fn();
    });
  }

  /* THE KEYBOARD'S WAY OUT, now that the card has no button to focus. ENTER,
     SPACE and ESCAPE all do the one thing the card does. The listener is on
     the window in capture, so the shell's own ESCAPE (menu.js) never sees the
     press, and it lives exactly as long as the card it belongs to. */
  function keyOut(fn) {
    var held = giftBox;
    function off() { window.removeEventListener("keydown", go, true); }
    function go(e) {
      if (e.key !== "Enter" && e.key !== "Escape" && e.key !== " " &&
          e.keyCode !== 13 && e.keyCode !== 27 && e.keyCode !== 32) return;
      off();
      if (giftBox !== held) return;
      e.preventDefault(); e.stopPropagation();
      fn();
    }
    window.addEventListener("keydown", go, true);
    /* The card may go before a key is ever pressed — a tap on it, usually — and
       a listener left behind would swallow the next ESCAPE the screen under it
       was owed. Whoever closes the card unbinds with this. */
    return off;
  }

  /* ── 8c. the plain card — one title, one picture, one line ─────────────── */

  /* Everything the meta layer has to SAY rather than pay. The daily road is
     what asked for it: a day still locked and a day already taken are two
     explanations, and they are the same card with different words in it.
     `art` is a node the caller built, because what goes in the middle is the
     one thing these cards do not agree on. It is dismissed by tapping it
     anywhere, and carries no button at all — see below. */
  /* NO BUTTON. This card asks nothing and offers no choice — it explains — so
     the whole of it is the way out, exactly like the prize card next to it. A
     CLOSE button under a card that already closes on any tap is a control that
     does what a miss does, and it takes the eye off the one thing the card is
     there to show. `dismiss` is what says that to the view system, which owns
     the scrim, the stack, the fade and the key (packages/webshell/view.js). */
  function note(opts) {
    return MD.open({
      kind: "note",
      dismiss: true,
      onClose: opts.done || null,
      eyebrow: opts.eyebrow, title: opts.title,
      fill: function (card) {
        if (opts.art) card.appendChild(opts.art);
        var plate = multArt(opts.mult);
        if (plate) card.appendChild(el("div", "mt-mult-row", plate));
        if (opts.name) card.appendChild(el("div", "mt-rw-name", opts.name));
        if (opts.sub) card.appendChild(el("p", "mt-sub", opts.sub));
      }
    });
  }

  /* ── 9. the three-box gift ────────────────────────────────────────────── */

  /* One ceremony, three callers: the daily strip, a perfect round and the ad
     the end screen offers. Three boxes, one choice, and what was inside the
     other two is never shown — a gift the player can compare is a gift they
     lost twice.

     The rewards are rolled BEFORE the boxes are drawn and the pick is an
     index, so the box the finger lands on is the box that pays: a reward
     decided after the tap is a slot machine wearing a choice. */
  /* The ceremony's card is a modal of the view system like every other one
     (packages/webshell/view.js); `giftM` is its handle and `giftBox` is the
     node, which the two helpers above watch to know the card they were bound
     to is still the card on screen. Neither dismissed nor escaped while the
     THREE BOXES are up — a choice has no default — and both are armed by the
     reveal, which has nothing left to decide. */
  var giftM = null, giftBox = null;

  /* The painted boxes, injected by the builder for a game with `web.meta`
     (CONFIG.shellArt, out of assets/image/shell/). Three colours, and each one
     exists closed and open under the SAME index — the two sheets were cut on a
     3x1 grid so the cell is the identity (tools/lab/cut-objects.mjs), which is
     the whole reason a lid can be lifted by swapping one src.

     They are the shell's artwork and not a game's, so a build that carries
     none of it falls back to the CSS box underneath: three coloured nodes with
     a lid and a bow, which is what this ceremony was made of before the
     painting arrived. */
  var GIFT_ART = (CONFIG.shellArt && CONFIG.shellArt.giftClose01) ? CONFIG.shellArt : null;

  /* One of the six orders of 0 1 2, in place. Fisher-Yates and not three
     `Math.random()` compared: a shuffle that can hand back a duplicate would
     put two boxes in the same colour, and the one card this is used on is the
     card that must read as three different packages. */
  function deal3() {
    var a = [0, 1, 2], i, j, t;
    for (i = 2; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function giftFace(i, open) {
    if (!GIFT_ART) return null;
    return GIFT_ART[(open ? "giftOpen0" : "giftClose0") + (i + 1)] || null;
  }

  function gift(opts) {
    opts = opts || {};
    closeGift();
    var rich = !!opts.rich;
    /* `mult` is the starred day's ×5, applied to the three rolls BEFORE a box
       is drawn like everything else here — a multiplier applied after the tap
       would be a number decided while the player watched. A sticker is
       re-rolled rather than multiplied (see `multiply`): five copies of one
       picture is not five times a prize. */
    var mult = opts.mult || 1;
    var rewards = [randomReward(rich), randomReward(rich), randomReward(rich)], gi;
    if (mult > 1) for (gi = 0; gi < 3; gi++) rewards[gi] = multiply(rewards[gi], mult);

    /* An EYEBROW over the title, for the caller that has something to say
       about WHY this card is open. The daily strip is the one: it is drawn
       wordless inside the menu, so which day of the run this is is written
       here instead (packages/webshell/daily.js). The tap line is the
       instruction, since a choice closes nothing. */
    giftM = MD.open({
      kind: "gift", dismiss: false, esc: false,
      eyebrow: opts.eyebrow, title: opts.title || T.pickOne, tap: T.tapPick
    });
    giftBox = giftM.box;
    var hand = giftM, card = giftM.body;
    /* The plate sits between the title and the sentence that explains it,
       which is where the eye already is: it is not decoration on the card, it
       is the size of what the three boxes are about to pay. */
    var plate = multArt(mult);
    if (plate) card.appendChild(el("div", "mt-mult-row", plate));
    /* NO LINE UNDER THE TITLE. "Three gifts, one choice" described three
       boxes to a player already looking at three boxes, and a sentence that
       says what the picture says takes the room the picture wanted. The one
       thing the boxes could not show — a starred day's ×5 — is the plate
       above, which is why there is nothing left here to write. */

    /* THE THREE BOXES ARE DEALT, NOT PRINTED. `g0` `g1` `g2` carry a size and
       an idle each — the floater, the rocker, the one something knocks in
       (meta.css) — and they used to be nailed to the position, so the row was
       the same row every time a card opened. Three looks in a fixed order stop
       being three looks after the second card: what the player sees is one
       picture they have already seen.

       Two INDEPENDENT deals, and the second only exists where the build
       carries the painted boxes: one decides which look each position wears,
       one decides which colour. Independent, because tying them would put the
       big floating box in red for ever and only move it along the row.

       IT STILL LEAKS NOTHING, which is the rule this row is built on. Both
       deals are rolled from nothing but `Math.random`, and the three rewards
       are rolled per INDEX and separately (`rewards` above) — so no look can
       be read off a prize and no prize off a look. What must never happen is
       the reverse: a box dressed FROM its reward would turn the ceremony into
       a label. */
    var look = deal3(), faces = GIFT_ART ? deal3() : look;

    var row = el("div", "mt-gifts" + (GIFT_ART ? " art" : ""));
    var open = false;
    [0, 1, 2].forEach(function (i) {
      var b = el("button", "mt-gift g" + look[i], GIFT_ART
        ? '<span class="rays"></span><span class="flash"></span>' +
          '<img class="face" alt="" src="' + giftFace(faces[i], false) + '">'
        : '<span class="lid"></span><span class="body"></span><span class="bow"></span>');
      /* ...and the idles do not start together either. There are only six ways
         to deal three looks, so a player sees the same hand often; a random
         phase means the row is never caught at the same moment of it twice.
         Negative, so nothing waits to begin — CSS wraps it on the duration,
         which is why one value covers idles of 1.9 s, 2.6 s and 3.1 s. */
      b.style.animationDelay = (-3 * Math.random()).toFixed(2) + "s";
      b.addEventListener("click", function () {
        if (open) return;
        open = true;
        row.classList.add("chosen");
        b.classList.add("open");
        /* THE LID COMES OFF, and on a painted box that is one swap of src and
           not a transform: the open picture has its own lid, its own ribbons
           flying and its own light coming out of it, so animating the closed
           one would be a worse version of a thing the artwork already does.
           The two frames land 180 ms apart, under a white flash that covers
           the cut — a straight swap reads as a glitch, a swap inside a flash
           reads as the box bursting. */
        if (GIFT_ART) setTimeout(function () {
          var f = b.querySelector(".face");
          if (f) f.src = giftFace(faces[i], true);
        }, 180);
        W.Sound.cue("uiScore", 0.75, 1.1, 900, 0.14);
        W.Sound.cue("uiStar", 0.55, 1.5, 1400, 0.1, "triangle");
        setTimeout(function () { reveal(hand, rewards[i], opts); }, 760);
      });
      row.appendChild(b);
    });
    card.appendChild(row);
  }

  /* ONE PRIZE, NO CHOICE — the same card the boxes end on, opened straight
     onto its reward. The daily road's small days are what asked for it: a day
     that pays xp does not get three boxes to pick between, because there is
     nothing to pick; it gets the badge, the number and the wallet it flies
     into, which is the half of the ceremony that was ever about the reward. */
  function prize(opts) {
    opts = opts || {};
    closeGift();
    giftM = MD.open({ kind: "gift", dismiss: false, esc: false });
    giftBox = giftM.box;
    reveal(giftM, opts.reward, opts);
  }

  /* What was in the box, then the one offer that follows it. The tripling is
     only ever offered once and only on a reward worth tripling — a sticker
     redraws instead, because three copies of one picture is not a prize. */
  function reveal(hand, rw, opts) {
    var card = hand.body;
    /* What the wallet said BEFORE this gift, kept so the chip can climb to the
       new figure when the reward lands in it rather than having changed behind
       the card (see flyReward). */
    /* `granted` is the caller saying the state already moved — a level-up
       ticket, paid by `addXp` long before this card exists. The card then
       reads it back rather than paying it twice, and `before` is what the
       wallet held one reward ago so the landing still counts up. */
    var before = opts.granted ? walletOf(rw.kind) - rw.n : walletOf(rw.kind);
    if (!opts.granted) grant(rw);
    /* …and the wallet goes back to what it read a moment ago, BEFORE the card
       is built: the screen under it must not spend the reveal showing a figure
       the player has not been handed yet. */
    holdKind(rw.kind, before);
    card.innerHTML = "";
    /* The eyebrow survives the reveal: "Day 12" is what says which card this
       is, and losing it the moment the box opens leaves a prize with no
       provenance on it. */
    /* `gotEyebrow` is the line for THIS half of the ceremony: the pick card
       has to name what is being opened, the reward card has that name in its
       own title, so the daily road hands over a shorter one. */
    var eb = opts.gotEyebrow || opts.eyebrow;
    var isNew = rw.kind === "sticker" && count(rw.n) === 1;
    /* `got` is what the CALLER calls this card — "Daily gift" for the road, so
       the title says which gift this is and the eyebrow stops repeating it. */
    hand.set({
      eyebrow: eb || null,
      title: rw.kind === "sticker" ? (isNew ? T.newSticker : T.dupe) : (opts.got || T.giftGot),
      tap: T.tapCollect
    });
    /* THE BADGE. What a gift pays is a number or a picture, and both of them
       arrive on their own looking like a line of a receipt. The badge is the
       frame that makes it a prize: a sunburst turning behind it and a ring
       around it, in the colour the reward's own rarity already decided — gold
       for a legendary, the accent for a rare, the muted ring for a handful of
       coins. Nothing here is a second piece of art; it is the same reward node
       with a lit backing, so a sticker, a coin icon and an xp bolt all land
       inside one shape. */
    /* The ring takes the reward's OWN colour and invents nothing: gold for
       coins, the accent for a ticket, green for xp — the three the icons are
       already drawn in — and for a sticker the rarity the album prints under
       it. A fifth colour here would be a fifth thing to read. */
    var tone = rw.kind === "sticker" ? "t" + rarityOf(rw.n) : rw.kind;
    var art = el("div", "mt-rw" + (rw.kind === "sticker" && shiny(rw.n) ? " shiny" : ""), rewardArt(rw));
    var badge = el("div", "mt-badge-rw " + tone,
      '<span class="rays"></span><span class="ring"></span>');
    badge.appendChild(art);
    card.appendChild(badge);
    /* WHAT IT PAID, PLATED. The figure is the prize itself, and in the same
       white as a caption it reads as a receipt line under the picture —
       `shine` is the gold sweep that makes it the thing being handed over. */
    card.appendChild(el("div", "mt-rw-name shine", rewardLabel(rw)));
    if (rw.kind === "sticker") card.appendChild(el("div", "mt-rw-rar r" + rarityOf(rw.n), rarityName(rw.n)));

    W.Sound.cue("uiStar", 0.8, 1.35, 1180, 0.18, "triangle");
    /* No Confetti: the motor's own burst draws on the END SCREEN's canvas
       (packages/engine/engine.js), and this card opens over the map or the
       title screen, where that canvas is not on top of anything. The badge's
       own rays are the celebration. */

    var acts = el("div", "mt-acts offer");
    if (opts.boost !== false) {
      /* THE OFFER LEADS WITH WHAT IT PAYS AND FOLLOWS WITH WHAT IT COSTS.
         "Watch an ad" was the whole label, which is the price with the thing
         it buys left out — so the button is two lines now: the REWARD, shouted,
         with the painted plate beside it, and the price under it at the size a
         price should be read at. The plate is the same piece the daily road's
         seventh day wears, so ×5 means one thing in this layer wherever it
         appears; a build with no artwork falls back to the figure in the
         card's own type rather than losing it.

         A STICKER IS NOT MULTIPLIED. `multiply` redraws one instead — five
         copies of one picture is not five times a prize — so the plate comes
         off and the line says what actually happens: one more. A ×5 over a
         button that hands back a single sticker is a promise the card cannot
         keep, and it is the whole reason the number is drawn rather than
         implied. */
      var isSticker = rw.kind === "sticker";
      var plate = isSticker ? "" :
        (multArt(AD_MULT, "mt-btn-mult") || '<b class="mt-btn-x">\u00d7' + AD_MULT + "</b>");
      /* IT NAMES WHAT IS MULTIPLIED. "Win ×5" is a number with no noun on it —
         the plate says how much and nothing said how much of WHAT, on a card
         that pays xp, coins or tickets from one ceremony. The verb and the
         thing are the shouted line, the plate finishes the sentence, and the
         price stays under it at the size a price is read at. */
      var what = rw.kind === "coins" ? T.mulCoins
               : rw.kind === "ticket" ? T.mulTicket : T.mulXp;
      /* NO PLAY PICTOGRAM. It said "this is a video" and the line under it
         already says exactly that in words; what it actually cost was 36px of
         a line that has a verb, a noun and a plate to fit on it. */
      var up = el("button", "mt-btn gold two",
        '<span class="mt-btn-txt"><b>' +
        (isSticker ? T.boostMore : fill(T.boostMul, { k: what })) +
        "</b><i>" + T.boostCost + "</i></span>" + plate);
      up.addEventListener("click", function () {
        if (acts.parentNode) acts.parentNode.removeChild(acts);
        ad(function (ok) {
          if (!ok) { closeGift(); if (opts.done) opts.done(rw); return; }
          var more = multiply(rw, AD_MULT);
          var before3 = walletOf(more.kind);
          grant(more);
          card.innerHTML = "";
          hand.set({ title: opts.got || T.giftGot, tap: T.tapCollect });
          /* The plate again, and it is the only thing on this card that says
             the gift grew: the heading is the same heading and the figure
             under the badge is just a bigger figure. Not over a sticker —
             that one was redrawn, not multiplied. */
          var p5 = more.kind === "sticker" ? null : multArt(AD_MULT);
          if (p5) card.appendChild(el("div", "mt-mult-row", p5));
          var b3 = el("div", "mt-badge-rw t3", '<span class="rays"></span><span class="ring"></span>');
          b3.appendChild(el("div", "mt-rw", rewardArt(more)));
          card.appendChild(b3);
          card.appendChild(el("div", "mt-rw-name shine", rewardLabel(more)));
          function take3() {
            var seat3 = b3.getBoundingClientRect();
            closeGift();
            flyReward(seat3, more, before3, null);
            if (opts.done) opts.done(more);
          }
          /* Nothing left to choose here either, so no button: the tap that
             closes the card is the one that collects (see below). */
          if (giftBox) { tapToDismiss(giftBox, take3); keyOut(take3); }
        });
      });
      acts.appendChild(up);
    }
    /* COLLECT IS WHERE THE REWARD MOVES. The card goes, the thing it showed
       flies out of where it was standing and into the chip that holds it, and
       the chip counts up on the landing. `opts.done` is called at the same
       moment the card closes, not after the flight: the caller's own work
       (the daily road repaints, the end screen carries on) has nothing to do
       with an animation playing over the top of it. */
    function take() {
      var seat = badge.getBoundingClientRect();
      closeGift();
      flyReward(seat, rw, before, null);
      if (opts.done) opts.done(rw);
    }
    /* A CARD WITH ONE WAY OUT CARRIES NO BUTTON. Collecting is not a decision
       — the reward is granted before the card is drawn — so a pill at the foot
       of it is a step asked for nothing, and a thumb that misses it reads as a
       card that will not close. The tap on the card IS the collect, and one
       line says so.

       WHERE AN OFFER IS STILL ON THE TABLE there is ONE control and it is the
       ad. There used to be a second beside it — an arrow, the way past — and
       it was a control for what a miss already does: a tap anywhere on the
       card or on the frame around it collects the gift as it stands, and so
       does ENTER, SPACE or ESCAPE. Two controls where one of them is "do
       nothing" is a decision the card was dressing up, and it halved the
       weight of the only thing on it worth reading. The line under it is what
       says the ad can be walked past, and a line is not a control. */
    if (acts.firstChild) card.appendChild(acts);
    keyOut(take);
    /* The reward is open: from here a tap anywhere collects it. Never during
       the pick — three boxes are a choice, and a choice has no default. */
    if (giftBox) tapToDismiss(giftBox, take);
  }

  function closeGift() {
    if (!giftM) return;
    var m = giftM; giftM = null; giftBox = null;
    m.close();
  }

  /* ── 10. the rewarded ad — a placeholder that says so ─────────────────── */

  /* There is no ad SDK on the web target, so this is a card with a countdown
     and a label that does not pretend otherwise. Everything around it is real:
     the offer, the odds, what it pays. Wiring a network in is replacing the
     body of this function — `cb(true)` when the view completed, `cb(false)`
     when it did not. See docs/META.md. */
  var AD_SECONDS = 4;

  function ad(cb) {
    var iv = null, ready = false, done = false;
    /* NEITHER DISMISSED NOR ESCAPED until it has been watched: an ad is a
       contract — it pays when the countdown is over — so the tap line counts
       it down and only then says the tap collects, and from that beat a tap
       anywhere (or ENTER / SPACE) is the claim. There is no button: a card
       whose last line says what the tap does needs no second control to do
       it. And it does not touch the bed: the screen it opens over already
       ducked it, and a placeholder that raised the music for four seconds and
       dropped it again would be the loudest thing in the game. */
    function claim() {
      if (!ready || done) return;
      done = true;
      window.removeEventListener("keydown", onKey, true);
      h.close();
      cb(true);
    }
    function onKey(e) {
      if (!ready) return;
      if (e.key !== "Enter" && e.key !== " " && e.keyCode !== 13 && e.keyCode !== 32) return;
      e.preventDefault(); e.stopPropagation();
      claim();
    }
    var left = AD_SECONDS;
    var h = MD.open({
      kind: "ad", dismiss: false, esc: false, bed: false,
      eyebrow: T.adEyebrow, title: T.adTitle,
      tap: fill(T.adTapWait, { n: left }),
      onClose: function () {
        if (iv) clearInterval(iv);
        window.removeEventListener("keydown", onKey, true);
      },
      fill: function (card) {
        card.appendChild(el("div", "mt-adslot", '<span class="bar"></span>'));
        card.appendChild(el("p", "mt-sub small", T.adNote));
      }
    });
    iv = setInterval(function () {
      left--;
      if (left > 0) { h.set({ tap: fill(T.adTapWait, { n: left }) }); return; }
      clearInterval(iv); iv = null;
      ready = true;
      h.set({ tap: T.tapCollect });
    }, 1000);
    h.box.addEventListener("click", claim);
    window.addEventListener("keydown", onKey, true);
  }

  /* ── 11. the end screen: the score becomes coins ──────────────────────── */

  /* The motor's end screen is a cascade of timers it owns (packages/shell/
     shell.js, EndScreen) and this layer adds the last beat of it without the
     motor growing a hook: the install CTA taking its `.show` class IS the
     signal that the reveal is done, so the transfer is watched for rather than
     scheduled against a copy of the motor's timings, which would drift the
     first time a game shipped a fifth stat row. */
  var endWallet = null, endBox = null, watching = null;

  /* ── 11a. the band the view system shows ──────────────────────────────── */

  /* WHAT THE PLAYER CARRIES, IN ONE NODE. The component was already one
     (`wallet` above) and the HOSTS were four: the map's header, the album's,
     the shop's and a layer pinned to the corner of the end screen. Four places
     for the same three numbers, and two screens in between that showed none of
     them.

     The band is the view system's now (packages/webshell/view.js, section 5)
     and this is the one function that fills it. It holds BOTH wallets,
     because the end screen's is not the same instrument:

       the full one    coins, tickets and the level bar under them, standing
                       for as long as the view does. The map, the album and
                       the shop declare `hud: true` and get it.
       the transient   the same two chips, veiled, holding their place in the
                       layout so a flight has a rect to aim at, and showing
                       only the chip a cascade is paying into. The score
                       screen is `hud: "auto"`: what the player sees there is
                       a chip that arrives with the coins, writes its figure
                       and goes.

     Which of the two is up is the band's own class, written by syncHud. */
  var band = null;

  /* ONE LINE, AND THE ORDER IS THE NAVIGATION:

       LV 4  ·  1 240 coins  ·  3 tickets  ·  12/90 stars

     left to right, the same four on every screen that carries the band, each
     one a door to the screen it is the number of — the ranking, the shop, the
     collection, the map. That is why the row never changes shape: a player who
     learns where the coins are has learnt where the shop is, on every screen
     they will ever see it. The level bar used to be a second row under the
     chips; it is the first chip now, and its figure (`0 / 350`) moved to the
     ranking, which is the screen that reads it. */
  function bandRow(cls, home) {
    var row = el("div", "mt-band " + cls);
    var lv = el("div", "mt-band-lv");
    /* The game's own figures, folded behind one chip (section 11b) — on the
       standing row only, since the end screen's is a target for a flight. */
    var more = home ? buildMore() : null;
    var chips = el("div", "mt-band-chips");
    var star = el("div", "mt-band-star");
    /* THE ORDER OF THE ROW, and it is the order the player reads it in:

         ⌂  ·  ⚡ xp  ·  coins  ·  tickets  ·  stickers  ·  stars

       the way out first, then what is EARNED by playing (xp), then what is
       SPENT (coins, tickets), then what those two buy (the collection), then
       what the board itself is worth. Home is the only chip here that is not a
       number — the rest of the row is what the player owns, this is the way
       out of wherever they own it.

       The two counts hang in hosts the wallet fills: they are numbers it
       paints, like the coins between them. */
    var cnt = el("div", "mt-band-count");
    var h = null;
    if (home) {
      h = el("button", "mt-chip home door", icon("home", "mt-ci"));
      h.setAttribute("aria-label", T.home);
      h.addEventListener("click", function () { VW.home(); });
      row.appendChild(h);
    }
    row.appendChild(lv);
    if (more) row.appendChild(more);
    row.appendChild(chips);
    row.appendChild(cnt);
    row.appendChild(star);
    return { row: row, lv: lv, chips: chips, star: star, count: cnt, home: h };
  }

  function mountBand(host) {
    var a = bandRow("full", true), b = bandRow("transient", false);
    host.appendChild(a.row);
    host.appendChild(b.row);
    var full = a.chips, trans = b.chips;
    band = wallet(full, { full: true, doors: "auto", lvHost: a.lv, stars: true,
                          starHost: a.star, countHost: a.count, root: a.row,
                          homeHost: a.home });
    /* The end screen's own, and it is the SAME four chips — veiled, holding
       their place in the layout so a flight has a rect to aim at, and lifted
       one at a time by whatever is being paid in. It carries the level chip
       too, because xp is a reward like the other three and the bar was the one
       of them with nowhere to land. */
    endWallet = wallet(trans, { full: true, transient: true, lvHost: b.lv, root: b.row });
    VW.onChange(bandDoors);
    bandDoors();
  }

  /* A chip standing on its own screen goes quiet: it still counts, it just
     stops offering. Re-read on every move of the stack. */
  function bandDoors() {
    if (!band) return;
    var top = VW.top();
    /* The house chip means whatever `View.home` means — the title screen, or
       the VILLAGE on a game that has one. On the bare village it is not quiet
       but GONE: the other chips are numbers and keep counting where their
       door is shut, this one is only a door, and a door home drawn over home
       is nothing but a greyed house. The level bar takes the room it leaves.
       A card over the village brings it back, since from there it is a way
       out again. */
    /* ...and on every SHEET, for the same reason from the other side: the
       sheet's own bar carries the house, bottom right, and a second one up
       here would be two ways to one place (packages/webshell/view.js). */
    if (band.home) {
      var M = window.__MODAL__;
      var bare = top === "village" || (!!top && VW.sheeted(top));
      band.home.classList.toggle("gone", bare && !(M && M.any()));
    }
    mark(band.home, "village", top, T.home);
    mark(band.count, "sticker", top, T.album);
    mark(band.lvBox, "ranking", top, T.scores);
    mark(band.coins.parentNode, "shop", top, T.shop);
    mark(band.tickets.parentNode, "sticker", top, T.album);
    mark(band.stars, "map", top, T.map);
  }

  function mark(node, view, top, label) {
    if (!node) return;
    var here = top === view;
    node.classList.toggle("inert", here);
    node.setAttribute("aria-label", here ? "" : (label || ""));
  }

  function buildEnd() {
    var screen = $("screen-end");
    if (!endBox) {
      endBox = el("div"); endBox.id = "mt-end";
      /* Above the way out, whatever the way out is drawn as: on a map the two
         buttons are moved into a row of their own (packages/webshell/menu.js),
         so the node to insert in front of is that row and not a button that is
         no longer a child of this screen. */
      var cta = $("btn-install");
      var ref = cta.parentNode === screen ? cta : cta.parentNode;
      screen.insertBefore(endBox, ref);
    }
    /* The band itself belongs to the view system and is built with it; all
       this screen does is ask for it. `hud: "auto"` is what keeps it down
       until something flies into it. */
    VW.hudShow();
  }

  /* What the round paid, and the order it pays in: the coins first — they are
     the transfer the player just watched — then whatever the map now owes,
     then the offer that asks for one more round.

     THE SCORE STAYS ON THE SCREEN. It used to drain to zero as the coins left
     it, which read beautifully and cost the player the one number they had
     just spent a round making: by the time the wallet had finished counting up
     there was nothing left on the screen saying what the run was worth. So the
     conversion is its own line now — `+148` under the score, in the coin's own
     gold — and it is that line the cascade empties, leaves behind, and writes
     again on the wallet when the last coin lands. Three readings of one
     number, and the score is untouched by all three. */
  /* ── the column is laid out BEFORE the reveal, not during it ───────────
     Everything the motor writes on this screen has its place from the first
     frame: the title, the score and the stat rows are all in the DOM at full
     size and only fade in (packages/shell/shell.js). This layer writes two
     more things — the conversion under the score and the offer under the rows
     — and both used to ARRIVE, which pushed a column mid-cascade: the stars
     dropped 50 px while they were still slamming in, the rows moved under a
     finger, and the buttons landed somewhere other than where they had been
     announced. So the two slots are opened here, on the frame the round ends,
     empty and at the height they will need. The only thing on this screen that
     changes size is the character, which is what it is for. */
  function reserveEnd(result) {
    buildEnd();
    endBox.innerHTML = "";
    var screen = $("screen-end");
    var old = $("mt-gain");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    screen.classList.remove("has-gain");
    $("eo-score").classList.remove("cut");

    var score = Math.max(0, Math.round(result.score || 0));
    var earn = Math.floor(score / POINTS_PER_COIN) * playerLevel();
    if (earn > 0) {
      var g = el("div", "mt-gain");
      g.id = "mt-gain";
      var sc = $("eo-score");
      sc.parentNode.insertBefore(g, sc.nextSibling);
      /* The stars are tucked up under the score and this line stands between
         the two, so the row is told there is something in that gap: without it
         it climbs into the score's own baseline (packages/shell/motor.css) and
         gold working over a gold star is not read at all. */
      screen.classList.add("has-gain");
    }
    /* …and the offer's own room, on the rounds that will be offered one. */
    var st = result.stars || 0;
    endBox.className = (st >= 1 && st < 3) ? "slot" : "";
  }

  function endRun(result) {
    buildEnd();
    endBox.innerHTML = "";
    var score = Math.max(0, Math.round(result.score || 0));
    /* THE LEVEL THE ROUND WAS PLAYED AT is what pays it, read before a single
       coin moves: `addXp` below may well level the player up on this very run,
       and a rate that changed halfway through its own animation would write a
       sum the screen then contradicts. */
    var lvl = playerLevel();
    var base = Math.floor(score / POINTS_PER_COIN);
    var earn = base * lvl;
    var xpGain = Math.floor(score / POINTS_PER_XP);
    var stars = result.stars || 0;

    function afterCoins() {
      /* The coins themselves are already IN — they are paid on the frame the
         cascade leaves (see below), because a chip can only count up to a
         figure the save already holds. What is left is the climb and whatever
         the map owes for it. */
      /* Granted here, READ on the map (see `arrive`). `before` is taken first
         because that is the figure the bar has to come back to. */
      var x0 = save.x;
      var got = addXp(xpGain);
      if (xpGain > 0) pendXp = pendXp
        ? { before: pendXp.before, levels: pendXp.levels + got }
        : { before: x0, levels: got };
      var won = sweep();
      showAwards(won, function () {});
    }

    /* THE OFFER ARRIVES WITH THE WAY OUT. `endRun` runs on the frame the motor
       lights the navigation (see watchEnd), so putting it here is putting it on
       the same beat as the map, the replay and the arrow — three ways to leave
       and one reason to stay, offered together. Held to the end of the transfer
       it landed seconds after the player had already read the row of buttons
       and decided, which is a fourth control appearing under a thumb on its way
       somewhere. */
    offer(stars);

    if (earn > 0) {
      var gain = gainLine(base, lvl, earn);
      /* The sum is READ before it is spent. The coins used to leave the moment
         the figure landed, which is fine for one number and wrong for three:
         what the level is worth is the thing this beat exists to say, and a
         line that empties while it is still being written says nothing. */
      setTimeout(function () {
        /* PAID FIRST, ANIMATED SECOND — the contract every other caller of
           `fx` keeps (section 8): the chip counts up to what the SAVE holds,
           so a payout that had not been made yet counted from its old figure
           to the same old figure. The wallet moving here is never seen, since
           `fx` holds the chip back to `c0` on the very next line. */
        var c0 = save.c;
        addCoins(earn);
        /* The same `fx` the shop and the reward cards use, with the cascade
           turned on: a score becoming coins is a TRANSFER being read, so the
           eighteen pieces empty the line the figure is written on and the chip
           counts through them. The figure landing on the chip is `fx`'s own
           doing now and no longer a second copy of it here. */
        fx({ kind: "coins", n: earn, from: gain, before: c0, burst: true,
             done: function () {
               /* IT DOES NOT LEAVE. What the level is worth is the one thing
                  on this screen a player can act on, and a line that says it
                  for a second and then vanishes has said it to nobody. The
                  coins go; the sentence stays, small and quiet, under the
                  score it explains. */
               gain.classList.add("kept");
               afterCoins();
             } });
         /* …and it is READ before it is spent: the sum lands, then a beat of
            nothing, then the coins leave. 260 ms was the figure arriving and
            being emptied in the same breath. */
      }, GAIN_MS * 2 + 620);
    } else {
      afterCoins();
    }
  }

  /* The conversion, under the score. Inserted after #eo-score rather than into
     #mt-end, which sits under the stat rows: what a score is worth belongs
     against the score, not at the foot of the column.

     IT IS THE SUM AND NOT THE TOTAL. `+145` is a number handed down; what the
     player owns is the LEVEL in the middle of it, and a total hides the one
     term they can move. So the line is written in three beats — what the score
     converts to, the level it is multiplied by, then the figure that lands —
     and the multiplier is written even at level 1, where it is the only place
     a player ever learns the lever exists.

     The parts arrive one at a time because a sum that appears whole is read as
     one number; the pause between them is what makes the "x" a step. */
  var GAIN_MS = 340;

  function gainLine(base, lvl, total) {
    /* The node is ALREADY in the column — `reserveEnd` put it there, empty and
       at its full height, before the motor's reveal began (see below). Filling
       a box that is already standing moves nothing; creating one here pushed
       the stars, the rows and the buttons down mid-cascade. */
    var g = $("mt-gain");
    if (!g) {
      g = el("div", "mt-gain");
      g.id = "mt-gain";
      var sc0 = $("eo-score");
      sc0.parentNode.insertBefore(g, sc0.nextSibling);
      sc0.parentNode.classList.add("has-gain");
    }
    g.innerHTML = "";
    /* THE RATE IS READ ON THE SCORE ITSELF. A rate is always 100 or 1000
       (tools/build/build.mjs refuses anything else), so what a round pays is
       the score with its last two or three digits dropped: 14 798 is 14. The
       digits that stay turn gold, like the `+14` under them, and the ones that
       go fade — the player sees which part of their number became coins
       without being told a rate. The motor rewrites the node as plain text on
       the next round, so nothing has to undo it. */
    var sc = $("eo-score"), txt = sc.textContent;
    var cut = String(POINTS_PER_COIN).length - 1;
    if (/^\d+$/.test(txt) && txt.length > cut) {
      sc.innerHTML = "<span class=\"mt-keep\">" + txt.slice(0, -cut) +
        "</span><span class=\"mt-cut\">" + txt.slice(-cut) + "</span>";
    }
    var parts = [
      el("span", "mt-gp base", "+" + num(base) + icon("coin", "mt-ci")),
      /* THE LEVEL IS A TAG. It is the one term of this sum the player owns,
         and written as plain text between two coins it reads as another
         operand. In a pill it reads as a THING — the same shape the wallet
         puts around a number, which is where they last saw their level. */
      el("span", "mt-gp mul", "\u00d7 <b class=\"mt-lvtag\">" +
        fill(T.lvShort, { n: lvl }) + "</b>"),
      el("span", "mt-gp sum", "= +" + num(total) + icon("coin", "mt-ci"))
    ];
    for (var i = 0; i < parts.length; i++) g.appendChild(parts[i]);
    requestAnimationFrame(function () { g.classList.add("on"); });

    /* Each beat has its own small cue, and the sum's is the one that rings:
       it is the figure the wallet is about to be paid. */
    step(0, 0.55, 0.9);
    step(1, 0.5, 1.15);
    step(2, 0.8, 1.45);
    function step(i, vol, rate) {
      setTimeout(function () {
        if (i === 0) sc.classList.add("cut");
        parts[i].classList.add("on");
        W.Sound.cue("uiRow", vol, rate, 620 + i * 220, 0.08);
      }, i * GAIN_MS);
    }
    return g;
  }

  /* A COUNTER THAT CAN BE INTERRUPTED. A second call on the same cell takes
     over from WHERE THE FIRST ONE HAD GOT TO, not from the figure it was
     handed: the shop's buy button can be tapped five times in a second, and
     five counters each starting from their own snapshot would make the number
     jump backwards between every one of them. `from` is only ever used when
     nothing is already moving.

     `mtRun` is also what stops `paintWallet` writing the final figure over a
     chip that is mid-count — the two are exclusive, exactly as they are on the
     end screen's transfer. */
  function countTo(cell, from, to, ms) {
    if (!cell) return;
    if (cell.mtRun) {
      var seen = parseInt(String(cell.textContent).replace(/[^0-9]/g, ""), 10);
      if (!isNaN(seen)) from = seen;
    }
    var mine = cell.mtRun = (cell.mtRun || 0) + 1;
    var t0 = performance.now();
    (function step(now) {
      if (cell.mtRun !== mine) return;          // a later call took the cell over
      var p = Math.min(1, ((now || performance.now()) - t0) / ms);
      cell.textContent = num(Math.round(from + (to - from) * p));
      if (p < 1) requestAnimationFrame(step);
      else cell.mtRun = 0;
    })(t0);
  }

  /* The stickers the map just paid, one card after the other. */
  function showAwards(list, done) {
    if (!list.length) { done(); return; }
    var i = 0;
    function next() {
      if (i >= list.length) { done(); return; }
      var a = list[i++];
      stickerCard(a.sticker, next, a);
    }
    next();
  }

  /* WHY THE MAP PAID, as the card's title. "New sticker!" over a sticker said
     what the picture already shows and nothing of where it came from: the card
     lands on the end screen of an ordinary round, and the player could not tell
     it from a gift. The milestone is read off the award's own key ("band2",
     "clean0", "all", "perfect"), the same key `award` pays once on. */
  function awardTitle(key) {
    if (key === "perfect") return T.awPerfect;
    if (key === "all") return T.awAll;
    var m = /^(band|clean)(\d+)$/.exec(key || "");
    var LV = window.__LEVELS__;
    var name = m && LV && LV.bandTitle ? LV.bandTitle(+m[2]) : null;
    if (!name) return null;
    return fill(m[1] === "band" ? T.awBand : T.awClean, { b: name });
  }

  /* `a` is the award when the map is the one paying (see `showAwards`): the
     title then names the milestone and the eyebrow says it is the map's, with
     new-or-double kept as its second half. Without it the card is the plain
     sticker reveal it always was. */
  function stickerCard(n, done, a) {
    var why = a ? awardTitle(a.key) : null;
    /* Nothing to decide, so no button: a tap anywhere collects it, and the
       tap line says so. */
    MD.open({
      kind: "sticker", onClose: done,
      eyebrow: why ? T.awEyebrow + " · " + (a.isNew ? T.newSticker : T.dupe) : undefined,
      title: why || T.newSticker,
      tap: T.tapCollect,
      fill: function (card) {
        card.appendChild(el("div", "mt-rw" + (shiny(n) ? " shiny" : ""),
          '<img class="mt-rw-img" src="' + artOf(n) + '" alt="">'));
        card.appendChild(el("div", "mt-rw-name", nameOf(n)));
        card.appendChild(el("div", "mt-rw-rar r" + rarityOf(n), rarityName(n)));
      }
    });
    W.Sound.cue("uiStar", 0.85, 1.5, 1180, 0.2, "triangle");
  }

  /* THE THREE-STAR BONUS, HANDED OVER ON THE ROUND THAT EARNED IT. It used to
     be the end screen's last beat, three screens' worth of reveal after the
     third star lit; it is now the outro's (packages/webshell/levels.js), which
     means the boxes open over the world still crawling in slow motion and the
     end screen arrives with the prize already in the wallet.

     The wallet comes with it: a reward that flies has to have somewhere to fly
     to (`flyReward` measures a VISIBLE chip and gives up without one), and the
     corner wallet the end screen shows is exactly the chip this gift lands in
     a moment later. It is built and shown here, and the state hook takes it
     away on any screen that is not the end one.

     `done` is the outro's, so the end screen waits for the flight to land and
     not merely for the card to close — the wallet has to be still by the time
     the score starts counting into it. */
  function bonus(done) {
    buildEnd();
    var handed = false;
    function once() {
      if (handed) return;
      handed = true;
      /* STRAIGHT TO THE END SCREEN, with the reward still in the air. This
         used to hold the outro for the length of the flight plus a beat, and
         what the player watched for that second was the frozen ROUND — the
         card they had just dismissed was gone and nothing had replaced it.
         Nothing needed the wait: the wallet the token flies into is a layer
         over `#frame` and not a child of the end screen, so the flight plays
         over whatever is underneath it, and the score cascade that counts into
         the same chip does not start until the install CTA lands, seconds
         later (`watchEnd`). */
      done();
    }
    gift({ rich: true, title: T.bonusTitle, done: once });
  }

  /* The two offers, and they are the only place this layer asks for anything:
     a round that earned a star is offered a gift for an ad, and a round that
     earned nothing is left alone — a player who just failed is the last person
     to sell to. A perfect round has already been paid, on the round itself
     (see `bonus`), so the end screen asks it for nothing at all. */
  function offer(stars) {
    if (stars >= 3) return;
    if (stars >= 1) {
      /* ONE CONTROL, AND IT SAYS THE WHOLE DEAL. It was a gold label beside a
         button — "A FREE GIFT" · WATCH AN AD — which reads as a claim followed
         by a price, and the label sat outside the only thing that could be
         tapped. The offer is one sentence and it belongs ON the button: what
         is given, and what it costs, in the order they happen. */
      var row = el("div", "mt-offer");
      /* THE PRICE, THE WORDS, THEN WHAT IT PAYS. The gift is the shell's own
         painted box rather than the stroked pictogram — a stroked gift on a
         gold button reads as the button's chrome, and the thing being handed
         over should look like the thing the ceremony opens. It falls back to
         the pictogram in a build with no shell artwork. */
      var box = GIFT_ART ? giftFace(1, false) : null;
      var b = el("button", "mt-btn small gold",
        icon("play", "mt-ci") + "<span>" + T.adOfferBtn + "</span>" +
        (box ? '<img class="mt-gift-i art-i" alt="" src="' + box + '">'
             : icon("gift", "mt-ci")));
      b.addEventListener("click", function () {
        if (row.parentNode) row.parentNode.removeChild(row);
        ad(function (ok) { if (ok) gift({ boost: false }); });
      });
      row.appendChild(b);
      endBox.appendChild(row);
    }
  }

  /* The install CTA landing is the end of the motor's reveal. Polled rather
     than observed: the button is replaced by a clone when the web shell
     unbinds it (menu.js), so a MutationObserver would be watching a node that
     is no longer in the document. */
  function watchEnd(result) {
    if (watching) clearInterval(watching);
    var tries = 0;
    watching = setInterval(function () {
      var cta = $("btn-install");
      if (++tries > 200 || W.state() !== "end") { clearInterval(watching); watching = null; return; }
      if (!cta || !cta.classList.contains("show")) return;
      clearInterval(watching); watching = null;
      endRun(result);
    }, 100);
  }

  if (ON) {
    /* The result filter runs inside endRound — which is where the score and
       the stars are known. The level layer registers its own and this one
       never touches the result: it only reads it.

       The result is read where it is KNOWN and watched for where it is SHOWN,
       and the two are no longer the same moment: an outro holds the frame
       between them (packages/shell/shell.js), the state is still "playing"
       while it plays, and a watch armed there would give up on its first tick
       for exactly that reason. So the result is kept, and the end screen
       arriving is what starts the transfer. */
    var pending = null;
    W.onResult(function (result) {
      if (W.state() === "playing") pending = result;
    });
    W.onState(function (s) {
      /* The state hook fires on a CHANGE, and the wallet the three-star bonus
         flies into is shown from the OUTRO — after the round already went to
         "playing" and before it goes to "end". So a round starting still takes
         the wallet down, and nothing takes it down between the two. */
      if (s === "end") {
        /* The layout first, on this very frame — then the transfer, which
           waits for the motor's reveal to finish (watchEnd). */
        if (pending) { reserveEnd(pending); watchEnd(pending); pending = null; }
        return;
      }
      pending = null;
      if (watching) { clearInterval(watching); watching = null; }
      closeGift();
      if (endBox) endBox.innerHTML = "";
      var g = $("mt-gain");
      if (g && g.parentNode) {
        g.parentNode.classList.remove("has-gain");
        g.parentNode.removeChild(g);
      }
      VW.hudHide();
      if (endWallet) veilAll(endWallet);
    });
  }

  /* ── 11b. the band's fold: what a game adds to it ─────────────────────── */

  /* A GAME WITH MORE TO COUNT THAN THE WALLET — the barracks' missions and
     cards — gets ONE chip for all of it, and not a row: a second line under
     the band was a second band, over the top of every screen, for figures the
     player reads once in a while. The chip sits between the level and the
     coins (`⌂ · ⚡ xp · ⚔ · coins · …`), the level bar gives it the room, and
     a hover or a tap unfolds the figures under it, each one a door.

     TWO KEYS TURN IT ON, and neither alone: the manifest names what goes in
     it (`web.meta.more: ["army"]`, in that order), and the layer that owns
     those figures registers them (`moreAdd`). A game that declares nothing
     has no chip, and the bar takes the room back.

       moreAdd(key, { title: fn -> string,
                      rows:  fn -> [{ pic, label, value, go }] })

     `pic` is markup (a pictogram of the shell's, or the layer's own), `go` is
     what a tap on the row opens. The fold paints only while it is open —
     `moreRepaint()` is free otherwise. */
  var MORE = (SPEC && SPEC.more) || [];
  var moreProv = {}, moreBox = null, moreBtn = null, morePanel = null;
  var moreOpen = false, morePinned = false;

  function buildMore() {
    if (!MORE.length) return null;
    moreBox = el("div", "mt-band-more");
    moreBtn = el("button", "mt-chip more door", icon("sword", "mt-ci"));
    moreBtn.setAttribute("aria-haspopup", "true");
    moreBtn.setAttribute("aria-expanded", "false");
    morePanel = el("div", "mt-more");
    morePanel.hidden = true;
    moreBox.appendChild(moreBtn);
    moreBox.appendChild(morePanel);
    moreBox.hidden = !moreFilled();         // until a layer fills it

    /* HOVER OPENS, A CLICK PINS. A mouse unfolds it on the way past and folds
       it when it leaves; a tap — and a click after a hover — pins it open,
       and a second one folds it. A finger has no hover, so a tap is the
       whole gesture there. */
    moreBox.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "mouse") setMore(true);
    });
    moreBox.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "mouse" && !morePinned) setMore(false);
    });
    moreBtn.addEventListener("click", function () {
      if (morePinned) { morePinned = false; setMore(false); return; }
      morePinned = true;
      setMore(true);
    });
    /* Anywhere else folds it, and so does walking to another screen. */
    document.addEventListener("pointerdown", function (e) {
      if (moreOpen && !moreBox.contains(e.target)) { morePinned = false; setMore(false); }
    }, true);
    VW.onChange(function () { morePinned = false; setMore(false); });
    paintMoreBtn();
    return moreBox;
  }

  /* A layer may register before the band is built, or after: both orders
     end on the same answer. */
  function moreAdd(key, prov) {
    moreProv[key] = prov;
    if (moreBox) moreBox.hidden = !moreFilled();
  }
  function moreFilled() {
    for (var i = 0; i < MORE.length; i++) if (moreProv[MORE[i]]) return true;
    return false;
  }

  function setMore(on) {
    if (!moreBox || on === moreOpen) return;
    moreOpen = on;
    moreBtn.classList.toggle("open", on);
    moreBtn.setAttribute("aria-expanded", on ? "true" : "false");
    morePanel.hidden = !on;
    if (on) { paintMore(); placeMore(); }
  }

  function paintMoreBtn() {
    if (moreBtn) moreBtn.setAttribute("aria-label", T.more);
  }

  function paintMore() {
    if (!moreOpen) return;
    morePanel.innerHTML = "";
    for (var i = 0; i < MORE.length; i++) {
      var p = moreProv[MORE[i]];
      if (!p) continue;
      var t = p.title ? p.title() : "";
      if (t) morePanel.appendChild(el("div", "mt-more-h", W.upper(t)));
      var rows = p.rows();
      for (var j = 0; j < rows.length; j++) morePanel.appendChild(moreRow(rows[j]));
    }
  }

  function moreRow(r) {
    var b = el("button", "mt-more-row",
               '<span class="mt-more-pic">' + (r.pic || "") + "</span>" +
               '<span class="mt-more-lbl"></span><b></b>');
    b.querySelector(".mt-more-lbl").textContent = r.label;
    b.querySelector("b").textContent = r.value;
    b.addEventListener("click", function () {
      morePinned = false;
      setMore(false);
      if (r.go) r.go();
    });
    return b;
  }

  /* UNDER THE CHIP, INSIDE THE FRAME. The chip moves along the row with the
     width of the counts beside it, so the fold is laid under it and then
     pulled back left by whatever it would spill past the right gutter. */
  function placeMore() {
    morePanel.style.left = "0px";
    var f = frame();
    if (!f) return;
    var fr = f.getBoundingClientRect(), pr = morePanel.getBoundingClientRect();
    var k = fr.width / 720 || 1;
    var over = pr.right - (fr.right - 26 * k);
    if (over > 0) morePanel.style.left = (-over / k) + "px";
  }

  function moreRepaint() { paintMore(); }

  /* ── 12. the module ───────────────────────────────────────────────────── */

  window.__META__ = {
    active: function () { return ON; },
    mount: function (api) {
      API = api;
      if (api.lang) setLang(api.lang);
      /* The one thing this layer hands the view system: what goes in the band.
         The band's node, where it sits, which views carry it and when it is
         up are all the view system's (packages/webshell/view.js). */
      VW.hudMount(mountBand);
    },
    setLang: setLang,
    text: function (k) { return T[k]; },
    fill: fill,
    num: num,

    coins: coins, tickets: tickets, xp: xp,
    level: playerLevel,
    levelAt: function () { return levelAt(save.x); },
    addCoins: addCoins, addTickets: addTickets, addXp: addXp,
    spend: spend, useTicket: useTicket,
    supers: function () { return save.st; },
    addSupers: addSupers, useSuper: useSuper,

    total: function () { return TOTAL; },
    owned: ownedCount,
    count: count,
    dupes: dupes,
    give: give, sell: sell, sellAll: sellAll,
    sellPrice: sellPrice, rarityOf: rarityOf, rarityName: rarityName,
    name: nameOf, art: artOf, shiny: shiny,
    multArt: multArt,
    isMilestone: function (i) { return !!MILESTONE[i]; },
    milestoneLabel: milestoneLabel,
    ticketPrice: function () { return TICKET_PRICE; },

    roll: roll, odds: odds, sweep: sweep,
    maxBet: function () { return MAX_BET; },
    superPrice: function () { return SUPER_PRICE; },
    superBet: function () { return SUPER_BET; },
    reward: reward, randomReward: randomReward, grant: grant,
    dayReward: dayReward,
    rewardLabel: rewardLabel, rewardArt: rewardArt,

    wallet: wallet, repaint: paintWallets,
    moreAdd: moreAdd, moreRepaint: moreRepaint,
    gift: gift, prize: prize, ad: ad, stickerCard: stickerCard, note: note,
    /* THE TRANSFER LAYER — the one way a screen of this front end makes a
       wallet number move (section 8). `buyFx` and `spendFx` are two named
       shorthands over it and carry no behaviour of their own. */
    arrive: arrive,
    fx: fx,
    buyFx: buyFx,
    spendFx: spendFx,
    bonus: bonus,
    /* The two ways out of a card, handed over so the album's own reveal
       dismisses exactly like every card of this layer instead of carrying a
       second copy of the rule (packages/webshell/album.js). */
    tapOut: tapToDismiss, keyOut: keyOut,
    /* Is a card of this layer on screen? The web shell asks before it opens
       the pause over one: a ceremony the player is mid-way through is not a
       round to be paused. */
    busy: function () { return !!giftBox; },
    markSeen: markSeen, bumpUnseen: bumpUnseen, unseen: unseen,
    onChange: function (fn) { hooks.push(fn); },

    /* The daily strip's own state, kept in this save rather than in a second
       one: it spends and pays the same wallet. */
    daily: function () { return save.d; },
    setDaily: function (d) { save.d = d; persist(); },

    /* THE BARRACKS, in the same save and for the same reason: a roster is
       bought with the coins this wallet holds, and a second key would be a
       second thing for OPTIONS to erase and a second thing to forget
       (packages/webshell/army.js). */
    army: function () { return save.ar || null; },
    setArmy: function (a) { save.ar = a; persist(); },

    /* OPTIONS erases the whole save and this is its share of it: the wallet,
       the tickets, the collection, the milestones already paid and the daily
       road, back to the shape `load` hands a first-time player. */
    wipe: function () {
      save = { v: 1, c: 0, t: 1, st: 0, x: 0, s: {}, a: {}, d: null, ar: null };
      persist();
    }
  };

  function setLang(code) {
    LANG = STRINGS[code] ? code : "en";
    T = STRINGS[LANG];
    paintWallets();
    paintMoreBtn();
    paintMore();
  }
})();
