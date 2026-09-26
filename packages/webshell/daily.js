/*
  webshell — the DAILY STRIP, on the title screen.

  Loaded only by `node tools/build/build.mjs --target=web`, after
  packages/webshell/meta.js, and inert for a game with no `web.meta` block.

  Seven days on a road, one node each, under the game's logotype. Opening the
  game on a new day lights today's node; tapping the strip opens the LEVEL MAP
  and plays the three-box gift over it, and the player picks one of the three.
  Miss a day and the run starts again at one — which is the only punishment in
  this layer, and it is the absence of a reward rather than the loss of one.

  WHY SEVEN AND WHY A RUN. A daily reward with no shape is a coin dropped in a
  slot: there is nothing to be part-way through, so there is nothing to come
  back to. Seven nodes make a week the player can SEE themselves inside, the
  seventh pays richer than the other six, and the strip then rolls over — so
  the second week is the first one again rather than an escalation nobody can
  keep up with.

  WHY IT IS A ROAD AND NOT A ROW OF TILES. The week is a climb like the map's
  is, so it is drawn like one: a rail through seven nodes, SOLID and gold
  behind the player and DOTTED in front of them, with the days still to come
  wearing a question mark rather than a box. The shape says three things at a
  glance that seven equal tiles could not — where the player is, that there is
  something ahead, and that the seventh is worth more than the sixth — and it
  rhymes with the forking road the map is (packages/webshell/levels.js), which
  is the screen this strip hands over to.

  WHY IT OPENS THE MAP. The gift pays into the WALLET, and the wallet is the
  map's own header — a reward granted on the title screen lands on a number
  the player cannot see, so the coins fly out of the box into nothing. Tapping
  the strip therefore does what PLAY does, and the three boxes open over the
  map with the wallet above them. One tap, and what it paid is legible where
  it landed.

  WHAT IT PAYS is meta.js's `randomReward`, the same roll the end screen's gift
  uses: coins, xp, a ticket, or a sticker out of the machine's own pool. The
  strip decides nothing about the odds — one table, one place to tune them.

  THE DAY IS THE DEVICE'S, in its own timezone, as a plain YYYY-MM-DD. There is
  no server and there is nothing to defend: a player who changes their clock to
  claim twice has cheated themselves out of a sticker's worth of anticipation,
  which is the entire stake. If the meta layer ever gets an account
  (packages/meta, phase 5) the date comes from it and this comment goes.

  ON A DEV MACHINE the day is not a gate at all — see DEV below.

  ES5-ish, same WebViews as the rest.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  if (!W) return;

  var MT = window.__META__;
  if (!MT || !MT.active()) { window.__DAILY__ = { active: function () { return false; } }; return; }

  /* ── 0. strings ───────────────────────────────────────────────────────── */

  var STRINGS = {
    en: {
      title: "Daily gift", day: "D{n}", dayLong: "Day {n}", tapDay: "Tap a day",
      pick: "Pick one",
      locked: "Locked", next: "Next gift",
      lockedOne: "One gift a day. This one opens tomorrow.",
      lockedN: "One gift a day. This one opens in {n} days.",
      taken: "Already collected",
      takenGone: "This day is behind you.",
      missed: "Missed",
      missedNote: "This day went by without being opened. It does not come back — but tomorrow does.",
      willXp: "Experience", willCoins: "Coins", willTicket: "A ticket", willGift: "A gift",
      starTag: "×5",
      catchUp: "Catch up",
      catchNote: "This day went by without being opened. It can still be caught up, up to a week late.",
      catchTitle: "Missed day"
    },
    fr: {
      title: "Cadeau du jour", day: "J{n}", dayLong: "Jour {n}", tapDay: "Touche un jour",
      pick: "Choisis",
      locked: "Verrouillé", next: "Prochain cadeau",
      lockedOne: "Un cadeau par jour. Celui-ci s’ouvre demain.",
      lockedN: "Un cadeau par jour. Celui-ci s’ouvre dans {n} jours.",
      taken: "Déjà récupéré",
      takenGone: "Ce jour est derrière toi.",
      missed: "Manqué",
      missedNote: "Ce jour est passé sans être ouvert. Il ne revient pas — demain, si.",
      willXp: "De l’expérience", willCoins: "Des pièces", willTicket: "Un ticket", willGift: "Un cadeau",
      starTag: "×5",
      catchUp: "Rattraper",
      catchNote: "Ce jour est passé sans être ouvert. Il se rattrape encore, jusqu’à une semaine plus tard.",
      catchTitle: "Jour manqué"
    }
  };

  /* Which of them the screen SHOUTS. Every string above is written in normal
     case, like the rest of the repo; the ones listed here are set in capitals
     by the motor's `upper` (packages/engine), which also takes the accents
     off — a capital carries none in this house. */
  var up = W.upper;
  var CAPS = ["title", "day", "dayLong", "pick", "locked", "next",
    "taken", "missed", "willXp", "willCoins", "willTicket", "willGift",
    "catchUp", "catchTitle"
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

  var DAYS = 7;

  /* ── 1. the day, and the run ──────────────────────────────────────────── */

  /* DEV — a gift on tap, as many as you like, and it says so on screen.

     The one thing this layer cannot be worked on is the thing it is made of: a
     ceremony that fires once a day takes a week to look at seven times, and
     the alternative is moving the machine's clock, which is worse than no
     test. So on a machine that is plainly not a player's — localhost, a LAN
     address, or a file:// page — the date stops being a gate: the run still
     advances a cell per claim, the save is still written, and only "you have
     had today's" is lifted. Nothing here reaches a deployed site, whose
     hostname is none of those, and the band wears a DEV pill (meta.js) so a
     screenshot can never be mistaken for the real thing. */
  var DEV = (function () {
    var h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "" ||
           h === "::1" || /^192\.168\./.test(h) || /^10\./.test(h);
  })();

  function today() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  /* A plain YYYY-MM-DD as a day COUNT, so two of them can be subtracted. Built
     on Date.UTC over the local calendar fields on purpose: the numbers came off
     a local clock and only their difference is ever used, so there is nothing
     for a timezone or a DST hour to get wrong. */
  function dayNum(str) {
    var p = String(str).split("-");
    return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000);
  }

  /* { s: the road's first day, d: the day the last gift was taken, k: which
     cell that was, r: what it paid, c: the cells claimed }. Kept in meta.js's
     save, because it pays into meta.js's wallet. */
  function state() {
    var s = MT.daily();
    if (!s || typeof s.k !== "number") return { s: null, d: null, k: 0, c: [] };
    if (!s.c) s.c = s.k ? [s.k] : [];
    return s;
  }

  /* One field at a time, over whatever is already there — the claim writes the
     day and the cell on the way in and the reward on the way out, and neither
     of them may drop the other three. */
  function write(patch) {
    var st = state(), out = { s: st.s, d: st.d, k: st.k, r: st.r, c: st.c }, key;
    for (key in patch) if (patch.hasOwnProperty(key)) out[key] = patch[key];
    MT.setDaily(out);
  }

  /* A save written before the road became a calendar (`k` was 1..7 and wrapped)
     has no origin to count from, and there is nothing honest to infer: today
     becomes day one, and the only thing worth keeping is whether today's gift
     has already been taken. */
  function migrate() {
    var st = MT.daily();
    if (st && st.s) return;
    var o = today(), was = !!(st && st.d === o);
    MT.setDaily({ s: o, d: was ? o : null, k: was ? 1 : 0,
                  r: was ? st.r : null, c: was ? [1] : [] });
  }

  function claimed() { return !DEV && state().d === today(); }

  /* WHICH CELL IS LIVE, and it is the CALENDAR that says so — day one is the
     day the road was first seen and every day since has its own node, claimed
     or not. It used to be a run of seven that wrapped, and a missed day threw
     the player back to the first cell; now the road simply carries on, day 7
     is followed by day 8, and a day nobody opened stays on it behind them,
     greyed. The punishment is still only ever the absence of a reward — but
     now the player can SEE the one they walked past.

     Under DEV the date is not a gate, so the road walks one cell per claim
     instead: seven taps show a whole week, the starred day included. */
  function liveCell() {
    var s = state();
    if (DEV) return s.d ? s.k + 1 : Math.max(1, s.k || 1);
    if (!s.s) return 1;
    return Math.max(1, dayNum(today()) - dayNum(s.s) + 1);
  }

  function claimedAt(a) {
    var c = state().c;
    return !!c && c.indexOf(a) >= 0;
  }

  /* ── 2. the strip ─────────────────────────────────────────────────────── */

  /* THE ROAD IS ENDLESS, and the window on it moves. Seven days is the RUN —
     the seventh pays the rich roll — but the strip does not draw a week that
     starts at a left edge and stops at a right one: it draws a road that runs
     off both sides of the frame, with TODAY pinned near the left and every day
     still to come laid out to the right of it, past the seventh and into the
     week after.

     That is the whole reason for the geometry below. A week drawn edge to edge
     is a thing with an end, and the end is three days away; a road cut by the
     frame is a thing that carries on, and what the player reads is how much of
     it is still ahead. It also puts the one node they can tap where a thumb
     already is, and it costs nothing: the track is one translate, so a day
     passing SLIDES the road by exactly one pitch instead of repainting it. */
  var PITCH = 88;        // design px between two days
  var LEFT_PAD = 78;     // the left-most column's centre, from the frame's edge
  var AHEAD = 10;        // days drawn past today — enough to fill 720 px and bleed
  /* ...and days kept BEHIND it. The road is endless in both directions now
     that it is a calendar, so the window is a window at both ends: two cells
     to the left is one visible column plus one bleeding off the mask, and it
     is what stops a player on day 400 from carrying 410 buttons on the title
     screen. */
  var BEHIND = 2;

  /* TODAY SITS IN THE SECOND COLUMN, not the first, and the one to its left is
     the reason: that node keeps the gift the last claim actually PAID — the
     sticker, the coins, the xp — greyed out beside the box about to be opened.
     A road that starts on today throws yesterday off the edge the moment it is
     claimed, and what it throws away is the only thing on this strip that ever
     says the gift is worth taking.

     Day one is the exception: there is nothing behind it, so it takes the
     first column rather than leaving a third of the frame empty. The road then
     stays put for one day and starts sliding on the second, which reads as a
     road that has not begun to move yet. */
  function slotOf(live) { return live > 1 ? 1 : 0; }

  /* The painted boxes the builder injects for a game with `web.meta`
     (CONFIG.shellArt, from assets/image/shell/). They are the shell's own
     artwork and not a game's, so the strip degrades to the CSS box under
     `.dl-cell` when they are missing — a build made before they existed, or a
     target that does not carry them. */
  var ART = W.CONFIG.shellArt || {};
  function boxArt(n) { return ART["giftClose0" + (((n - 1) % 3) + 1)] || null; }

  /* WHAT EACH DAY OF THE WEEK PAYS, and the road PRINTS IT. Every day ahead
     used to wear a question mark, which said the same nothing seven times
     over; now it wears the thing it will hand across, and the only mystery
     left is how much of it — which is the mystery worth keeping, because a
     number nobody can picture is not a reason to come back and a ticket is.

     It is a LADDER and it is meant to be read as one: experience, then coins,
     then a ticket, round once more, then a gift, then the STARRED gift that
     pays five times over. A player who can see Saturday from Tuesday has a
     reason to be there on Saturday, and that is the whole job of this strip. */
  var LADDER = ["xp", "coins", "ticket", "xp", "coins", "gift", "gift"];
  var STAR = 5;          // what the seventh day multiplies its three boxes by
  function kindOf(a) { return LADDER[(a - 1) % DAYS]; }
  function isStar(a) { return dayOf(a) === DAYS; }
  function kindIcon(k) { return k === "coins" ? "coin" : k; }
  /* WHAT a day pays, in words — never how much. A starred day says the ×5 in
     the same line, because "a gift" and "a gift worth five of them" are not
     the same promise and the road can only draw one star. */
  function kindWord(a) {
    var k = kindOf(a);
    var w = k === "coins" ? T.willCoins : k === "ticket" ? T.willTicket
          : k === "xp" ? T.willXp : T.willGift;
    /* The ×5 is written here only while nothing paints it: a card that shows
       the plate AND the tag says the same thing twice, and the tag is the
       lesser of the two. */
    return isStar(a) && !MT.multArt(STAR) ? w + " " + T.starTag : w;
  }

  /* The day of the week an absolute position on the road falls on, 1..7. The
     road is numbered from the run's first day and never stops, so day 9 is the
     second week's day 2 — and its seventh is a big node again, which is what
     says the run comes round rather than ending. */
  function dayOf(a) { return ((a - 1) % DAYS) + 1; }

  var API = null, strip, win, track, rail, cells = [], base = 0, built = false;
  function el(tag, cls, html) { return API.el(tag, cls, html); }
  function icon(name, cls) { return API.icon(name, cls); }

  /* The two things the road has to know about the shell around it: whether the
     player lives on a hub, and how to open a card. Both are read at the moment
     they are used rather than captured — village.js is the LAST file of the
     web layer, and daily.js is loaded well before it. */
  function villaged() { return !!window.__VILLAGE__; }
  function modal() { return window.__MODAL__; }
  function $(id) { return document.getElementById(id); }

  /* WHAT THE LAST CLAIM PAID, as the node wears it. The save keeps the reward
     beside the day it was taken on (`r` in meta.js's daily block), so the tick
     that day would otherwise carry is replaced by the thing itself: the
     sticker's own picture, or the coin / ticket / xp pictogram. It is the one
     piece of memory this strip has, and it is what makes the empty column to
     the left of today worth keeping. */
  function paidHtml(r) {
    if (r.kind === "sticker") {
      var art = MT.art(r.n);
      return art ? '<img class="rw" alt="" src="' + art + '">' : icon("check", "dl-i");
    }
    return '<span class="rw ' + r.kind + '">' +
           icon(r.kind === "coins" ? "coin" : r.kind, "dl-i") + '</span>';
  }

  /* The FACE of a node is what the day pays: the painted box on a gift day,
     the reward's own pictogram on the three small ones. Nothing here is a
     question mark any more. */
  function cellHtml(a) {
    var k = kindOf(a), face;
    if (k === "gift") {
      var art = boxArt(dayOf(a));
      face = art ? '<img class="box" alt="" src="' + art + '">' : '<i class="box css"></i>';
    } else {
      face = '<span class="kind ' + k + '">' + icon(kindIcon(k), "dl-i") + "</span>";
    }
    return '<span class="dl-node">' +
             '<i class="burst"></i>' +
             '<i class="halo"></i>' +
             '<i class="disc"></i>' +
             face +
             '<i class="mark"></i>' +
           '</span>' +
           '<i class="dot"></i>' +
           '<span class="d"></span>';
  }

  /* THE WINDOW ON AN ENDLESS ROAD. It grows at the right and lets go at the
     left, so the track always holds the same dozen cells however long the
     player has been coming back — a road that only ever appended was fine
     while it wrapped every seven days and is a slow leak now that it counts
     to four hundred. `base` is the absolute day of `cells[0]`, and it is the
     one number the geometry below is written against.

     It returns whether the left end moved: dropping a cell shifts every other
     one by a pitch inside the track, so the translate that follows has to be
     applied WITHOUT the slide or the road appears to jump a day sideways. */
  function grow(from, to) {
    var moved = false, a, c;
    if (!base) base = from;
    while (base < from && cells.length > 1) {
      c = cells.shift();
      if (c.parentNode) c.parentNode.removeChild(c);
      base++;
      moved = true;
    }
    for (a = base + cells.length; a <= to; a++) {
      c = el("button", "dl-cell", cellHtml(a));
      c.type = "button";
      c.setAttribute("data-a", a);
      c.addEventListener("click", onTapCell);
      track.appendChild(c);
      cells.push(c);
    }
    return moved;
  }

  function build() {
    if (built) return;
    built = true;

    strip = el("div"); strip.id = "dl-strip";

    /* EVERY DAY ANSWERS, and each one is its own <button>. Only today's pays,
       but a day the finger lands on and that does nothing reads as a broken
       control — so a day ahead explains that it is locked and a day behind
       shows what it already paid. Three answers, one of which is the gift.

       ONE KEYBOARD STOP, though: today's is the only cell in the tab order
       (the rest carry tabindex -1, set in paint), because seventeen stops
       between two menu lines is a menu nobody can walk down.

       NO HEADING, and no wording of any kind. This sits between two lines of
       the menu, and a title over it would read as a third menu entry — the
       gift box lit on a dotted road says "daily gift" without a word, and
       every word it might have carried is in the card the tap opens. */
    win = el("div", "dl-win");

    track = el("span", "dl-track");
    /* The rail under the nodes, and the nodes sit ABOVE it: a road is a line
       with things standing on it, not a line drawn through them. It is one
       node for the dotted length and one for the gold already walked. */
    rail = el("span", "dl-rail", '<i class="done"></i>');
    track.appendChild(rail);

    win.appendChild(track);
    strip.appendChild(win);
    paint(true);
    return strip;
  }

  function paint(first) {
    if (!built) return;
    var live = liveCell(), taken = claimed(), i;
    /* Only ever ONE day carries a reward — the last one claimed. Every other
       day behind the player is a tick or, now, a reward it never handed
       over. */
    var st = state(), paid = st && st.r ? st.r : null, paidAt = paid ? st.k : 0;

    var jumped = grow(Math.max(1, live - BEHIND), live + AHEAD);
    strip.className = taken ? "taken" : "ready";

    /* The window slides so TODAY lands at LEFT_PAD. Everything behind it runs
       off the left edge and everything ahead runs off the right, which is the
       one thing this layout has to say. On a first paint the slide is skipped:
       a road that scrolls into place on arrival reads as a loading state. */
    var x = LEFT_PAD + slotOf(live) * PITCH - (live - base + 0.5) * PITCH;
    var hard = first || jumped;
    if (hard) track.style.transition = "none";
    track.style.transform = "translateX(" + x + "px)";
    if (hard) requestAnimationFrame(function () { track.style.transition = ""; });

    /* The gold runs from the first day's centre to TODAY's and not one step
       further, so day one is zero gold — right, because nothing is behind the
       player yet, and the lit box is what says where they are. */
    rail.querySelector(".done").style.width = (live - base) * PITCH + "px";

    for (i = 0; i < cells.length; i++) {
      var a = base + i, d = dayOf(a);
      var past = a < live || (a === live && taken);
      var got = past && (a === live || claimedAt(a));
      var miss = past && !got;
      var shows = got && a === paidAt && paid;
      var cls = "dl-cell" + (got ? " got" : miss ? " miss" : a === live ? " live" : " soon");
      if (d === DAYS) cls += " big";
      if (kindOf(a) === "gift") cls += " gift";
      if (shows) cls += " paid";
      cells[i].className = cls;
      /* The mark is the one thing written OVER the day's own reward: a tick on
         a day that was taken, the reward itself on the last one claimed, a
         star on every seventh — and nothing at all on today, on a day ahead
         (its reward is already drawn, which is what the question mark used to
         stand in for) or on one that went by unopened. */
      /* THE SEVENTH DAY WEARS WHAT IT PAYS. A star says "this one is the
         prize"; the painted ×5 says how much, which is the promise that
         brings a player back on Saturday — and the road's own big node is
         already what says a seventh day is different. The star is what it
         falls back to where nothing paints that number. */
      var big = d === DAYS && !got && !shows && !miss;
      var plate = big ? MT.multArt(STAR, "dl-mult") : null;
      var mark = cells[i].querySelector(".mark");
      mark.innerHTML =
        shows ? paidHtml(paid)
        : got ? icon("check", "dl-i")
        : big ? (plate || icon("star", "dl-i"))
        : "";
      /* A PAINTED mark needs no plate under it. The gold disc was there to
         give a dark stroke something to read against; a gold star on a gold
         disc reads as nothing at all, so the badge stands down when the build
         carries the artwork. */
      mark.className = "mark" + (big && (plate || ART.star) ? " art" : "") +
                       (plate ? " wide" : "");
      cells[i].querySelector(".d").textContent = MT.fill(T.day, { n: a });
      /* Today is the only stop on the road; the rest are reachable by finger
         and skipped by the tab key. */
      cells[i].tabIndex = (a === live && !taken) ? 0 : -1;
      cells[i].setAttribute("aria-label",
        MT.fill(T.dayLong, { n: a }) + " — " +
        (miss ? T.missed : got ? T.taken : a === live ? T.title : T.locked));
    }
  }

  /* ── 2b. the road, as a card over the hub ─────────────────────────────── */

  /* WHERE A VILLAGE PUTS THE ROAD. On a game with no hub this strip is a LINE
     OF THE TITLE MENU: it sits between the map and the collection, it is read
     on the way past, and tapping it is what opens the gift.

     A village has no menu to be a line of — it has a BUILDING — and the
     building used to hand the player straight to the day's reward, which meant
     the road itself was never seen at all: the week, where the player is
     inside it, and what tomorrow pays were all invisible on the one game shape
     that has a door dedicated to them.

     So the door opens the ROAD, over the hub, as a card: the village stays
     exactly where it is behind the shell's own veil (packages/webshell/
     view.css), the seven days are the whole of what the card holds, and the
     tap that follows is the same tap the strip has always answered. Nothing is
     navigated — the wallet band this pays into is the hub's own.

     It is dismissed by a tap outside, like every card of this layer; the days
     are `<button>`s, which is what keeps a finger landing on one from being
     read as a tap on the scrim (packages/webshell/view.js, open). */
  var roadCard = null;

  function openRoad() {
    if (roadCard) return;
    if (!built) build();
    paint();
    var MD = modal();
    /* No card system — a build older than view.js, or a playable: the door
       still has to pay out, which is what it did before this card existed. */
    if (!MD) return openToday();
    /* THE ONE WORD THE ROAD CANNOT CARRY. The strip is drawn wordless on
       purpose — inside a menu a heading over it reads as a third menu entry —
       but a card that opens on its own has to say what it is. */
    roadCard = MD.open({
      kind: "road",
      title: T.title, tap: T.tapDay,
      onClose: function () { roadCard = null; },
      fill: function (card) {
        card.appendChild(strip);
      }
    });
  }

  /* CLOSES IT, AND SAYS HOW LONG TO WAIT. A reward card opening in the same
     frame the road starts fading would stack two veils on the hub for a fifth
     of a second, which reads as the screen going black. The number is the
     modal layer's own fade, near enough; 0 when there was no card. */
  function closeRoad() {
    if (!roadCard) return 0;
    roadCard.close();
    roadCard = null;
    return 200;
  }

  function after(ms, fn) { if (ms) setTimeout(fn, ms); else fn(); }

  /* Today's cell, answered with no cell to tap: `onTapCell` on the live day,
     and the same three answers — pay it, or say it was already collected. */
  function openToday() {
    if (!built) build();
    var live = liveCell();
    if (!claimed()) return claim(live);
    return showTaken(live);
  }

  /* ── 3. the tap ────────────────────────────────────────────── */

  /* Three answers, and which one a day gives is the only thing its position on
     the road decides. A day that did nothing when touched would read as a
     broken control, and the road is nothing BUT days a finger can reach.

     The road gets out of the way first: whichever of the three answers this
     is, it is a card, and the card the player tapped it from is a card too. */
  function onTapCell(e) {
    var a = +(e.currentTarget.getAttribute("data-a"));
    var live = liveCell(), taken = claimed();
    after(closeRoad(), function () {
      if (a === live && !taken) return claim(a);
      if (a > live) return showLocked(a, live);
      if (a === live || claimedAt(a)) return showTaken(a);
      showMissed(a);
    });
  }

  /* The eyebrow every one of these cards wears: which day of the run. Only
     the day — "Daily gift" over a title that names the gift, or over "Next
     gift", is one word said twice. That this machine pays on every tap is the
     band's DEV pill to say (packages/webshell/meta.js), not each card's. */
  function eyebrow(a) {
    return MT.fill(T.dayLong, { n: a });
  }

  /* ---- today: the screen that shows a wallet, then the boxes over it -------
     THE GIFT PAYS INTO THE WALLET, so the ceremony has to play somewhere the
     wallet is on screen — a reward granted where the band is not is coins
     flying into nothing.

     ON A VILLAGE that screen is the hub the player is already standing on: the
     band is over it, the road was a card on it, and the boxes simply take the
     road's place. Nothing is navigated, and the map is never involved.

     WITHOUT ONE the strip is a line of the title menu, which carries no band,
     so the tap does what PLAY does — `LV.open()` — and the boxes open over the
     map. A game with neither keeps them over the title screen, which is where
     they used to be. */
  function stage() {
    if (villaged()) return 0;           // the road card has already stepped aside
    var LV = window.__LEVELS__;
    if (LV && LV.active() && !LV.isOpen()) { LV.open(); return 260; }
    return 0;
  }

  /* Sixteen days of memory, which is a fortnight of road and twelve more
     cells than the window ever shows. What it is for is the greyed-out days
     behind today; a year of them is a year of integers nobody reads. */
  function claimedWith(n) {
    var c = (state().c || []).concat([n]);
    return c.length > 16 ? c.slice(c.length - 16) : c;
  }

  function claim(n) {
    write({ s: state().s || today(), d: today(), k: n, c: claimedWith(n) });
    paint();
    W.Sound.cue("uiScore", 0.75, 1.15, 900, 0.12);

    /* The reward is written beside the day, not instead of it: the day is what
       the road is counted in, and `r` is what the node to the left of
       tomorrow's box will show. It is saved on the way OUT of the card because
       that is the first moment it is known. */
    pay(n, stage(), function (rw) {
      if (rw) write({ r: { kind: rw.kind, n: rw.n } });
      paint();
    });
  }

  /* ---- a missed day, bought back ------------------------------------------
     A day that went by unopened can be CAUGHT UP for coins, for a week
     (`MT.catchDays`), at a share of what it would have paid on average
     (`MT.catchUpPrice`). It pays exactly what it would have: the same kind,
     the same ladder, the ×5 of a starred day. Opening the game on the day
     stays free, which is what keeps a catch-up the worse of the two deals.

     It writes the day into the claimed list and NOTHING ELSE: `d` is today's
     gate and `k`/`r` are what the last claim paid, and a day bought back a
     week late is neither today nor the gift the road should show beside it. */
  function recoverable(a) {
    var live = liveCell();
    return a >= 1 && a < live && a >= live - MT.catchDays() && !claimedAt(a);
  }

  function lastMissed() {
    var live = liveCell(), a;
    for (a = live - 1; a >= Math.max(1, live - MT.catchDays()); a--) {
      if (!claimedAt(a)) return a;
    }
    return 0;
  }

  function priceOf(a) {
    return MT.catchUpPrice(kindOf(a), dayOf(a), isStar(a) ? STAR : 1);
  }

  /* `here` is the caller saying the wallet is already on screen — the shop —
     so nothing is staged under the card. */
  function recover(a, here) {
    if (!recoverable(a)) return false;
    var price = priceOf(a), before = MT.coins();
    if (!MT.spend(price)) return false;
    MT.spendFx(before, MT.coins());
    write({ c: claimedWith(a) });
    paint();
    W.Sound.cue("uiScore", 0.75, 1.15, 900, 0.12);
    pay(a, here ? 0 : stage(), function () { paint(); });
    return true;
  }

  /* What a day hands over, once it has been written as claimed: the three
     boxes on a gift day, the prize card on the three small ones. `hop` is how
     long the screen under the card needs to mount. */
  function pay(n, hop, done) {
    var k = kindOf(n), star = isStar(n), d = dayOf(n);

    /* One frame for the map to mount under the card, so nothing arrives over a
       screen that is still being written. Zero on a village: the hub was
       already there and the road took itself away before this ran. */
    after(hop, function () {
      /* A GIFT DAY GETS THE THREE BOXES; the three small ones get the prize
         card straight away, because a choice between three things that are all
         the same thing is not a choice. No tripling on either: the daily gift
         is the one the player did nothing to earn, so it does not also get
         sold back to them. */
      if (k === "gift") {
        MT.gift({
          rich: star, mult: star ? STAR : 1, boost: false,
          eyebrow: eyebrow(n), got: T.title,
          /* Same on the ceremony: the ×5 plate is what a starred day is told
             by, and there is no sentence under the title any more — the three
             boxes are the instruction (packages/webshell/meta.js). */
          title: T.pick,
          done: done
        });
      } else {
        MT.prize({
          eyebrow: eyebrow(n), boost: false, got: T.title,
          reward: MT.dayReward(k, d, star ? STAR : 1),
          done: done
        });
      }
    });
  }

  /* THE PICTURE A DAY WEARS ON ITS CARD — the very box it hands over on a
     gift day, the coin / ticket / bolt otherwise. One helper for the two cards
     that are not a claim (a day ahead, a day gone by), because they show the
     same thing and only the filter over it differs.

     `art` is what tells the dish under the picture to get out of the way: a
     painted piece already has a body, and a plate around it reads as a second
     frame inside the card. A build with no artwork keeps the stroke in its
     ring, which is what gives a stroked glyph a body at all. */
  function faceHtml(a) {
    var k = kindOf(a);
    if (k === "gift") {
      var art = boxArt(dayOf(a));
      if (art) return '<img class="mt-rw-img" alt="" src="' + art + '">';
      return '<span class="mt-rw-ico">' + icon("gift", "mt-rwi") + "</span>";
    }
    var name = kindIcon(k);
    return '<span class="mt-rw-ico ' + k + (ART[name] ? " art" : "") + '">' +
           icon(name, "mt-rwi") + "</span>";
  }

  /* ---- a day ahead: locked, and the rule that locks it --------------------
     It shows the very box it will hand over, drained and padlocked, because
     the answer to "what is in there" is "not yet" and not "nothing". The count
     of days is the actual answer to the question the tap asked. */
  function showLocked(a, live) {
    var away = a - live;
    /* THE PRIZE AT FULL SIZE, THE PADLOCK LAID OVER IT. What is in there is
       the only reason to come back tomorrow, so it gets the whole middle of
       the card and the lock is a bare glyph on top of it — a disc over a disc
       would read as a button, and a small picture behind a big plate says
       "nothing" where the answer is "not yet". */
    var node = el("div", "mt-rw locked",
      faceHtml(a) + '<span class="mt-lock">' + icon("lock", "mt-lock-i") + "</span>");

    /* WHAT IS LEFT OF THE SENTENCE is the answer to the tap — how far away
       this day is — and nothing else. A seventh day used to add "every seventh
       day pays five times over", which is the plate above it said again in the
       card's own type: the picture carries its own number, its own stars and
       its own colour, and a caption under it is a worse copy of all three. */
    var sub = away === 1 ? T.lockedOne : MT.fill(T.lockedN, { n: away });

    /* It names WHAT, and only what: the amount is the one thing a day ahead
       keeps back, and it is the reason to be there when it opens. The title
       says which day it is rather than that it is shut — the padlock over the
       picture already says shut, and twice is once too many. */
    MT.note({ eyebrow: eyebrow(a), title: T.next, art: node,
              mult: isStar(a) ? STAR : 1,
              name: kindWord(a), sub: sub });
    W.Sound.cue("uiRow", 0.5, 0.82, 320, 0.09);
  }

  /* ---- a day behind: what it paid, and that it is spent -------------------
     Only ONE day is remembered — the last one claimed (see paint) — so an
     older day says it is behind the player and shows a tick. Saying less than
     that would be inventing a reward nobody stored. */
  /* ---- a day that went by -------------------------------------------------
     The road no longer resets a player who missed one, so the day they walked
     past is still standing there behind them. It says what it would have paid
     and that it is gone: the punishment in this layer is the absence of a
     reward and never the loss of one, and a day that simply vanished would
     not even be that. */
  function showMissed(a) {
    /* INSIDE THE CATCH-UP WEEK the card carries the one control that changes
       its answer: the day, bought back, at its price. The button is dead
       rather than missing when the wallet cannot pay — the price is still
       what the player needs to read. Past the week the day is simply gone. */
    var can = recoverable(a), act = null, card = null;
    if (can) {
      var price = priceOf(a);
      act = el("button", "btn btn-buy",
        "<span>" + T.catchUp + '</span><span class="btn-badge">' + icon("coin") +
        MT.num(price) + "</span>");
      act.disabled = MT.coins() < price;
      act.addEventListener("click", function () {
        if (card) card.close();
        after(200, function () { recover(a); });
      });
    }
    card = MT.note({
      eyebrow: eyebrow(a), title: T.missed,
      art: el("div", "mt-rw taken", faceHtml(a)),
      mult: isStar(a) ? STAR : 1,
      name: kindWord(a), sub: can ? T.catchNote : T.missedNote,
      act: act
    });
    W.Sound.cue("uiRow", 0.45, 0.72, 260, 0.1);
  }

  function showTaken(a) {
    var st = state(), paid = (st && st.r && st.k === a) ? st.r : null;
    var node = el("div", "mt-rw taken", paid
      ? MT.rewardArt(paid)
      : '<span class="mt-rw-ico done">' + icon("check", "mt-rwi") + '</span>');

    /* NO SENTENCE UNDER A REWARD THAT IS ON THE CARD. "Already collected", the
       thing itself greyed out and the figure it paid say all three of what
       this card is for; a line explaining that the next one is tomorrow is the
       road's own job, and the road is one tap behind this card. The line only
       survives where there is nothing else — a day taken before the save
       started remembering what it paid, which is a title and a tick. */
    MT.note({
      eyebrow: eyebrow(a), title: T.taken, art: node,
      name: paid ? MT.rewardLabel(paid) : "",
      sub: paid ? "" : T.takenGone
    });
    W.Sound.cue("uiRow", 0.5, 0.9, 380, 0.09);
  }

  /* ── 4. mount ─────────────────────────────────────────────────────────── */

  window.__DAILY__ = {
    active: function () { return true; },
    mount: function (api) {
      API = api;
      if (api.lang) setLang(api.lang);
      migrate();
      /* Every arrival on the title screen repaints it: a session that crosses
         midnight, or a gift taken from another screen, must not leave a stale
         strip behind. */
      W.onState(function (s) { if (s === "intro") paint(); });
    },

    /* The strip's node, for menu.js to place. It is NOT appended here: this
       road is a line OF the menu — between the map and the collection — and
       the menu is the one file that decides what order its lines come in.
       mount() runs before the menu is built, so the node is made on the first
       ask rather than on mount. */
    node: function () { return built ? strip : build(); },
    setLang: setLang,
    text: function (k) { return T[k]; },

    /* THE VILLAGE'S OWN DOOR: the road over the hub, as a card (section 2b).
       It is what the daily BUILDING opens (packages/webshell/menu.js, doors),
       and the tap on a day inside it is the same tap the strip has always
       answered. */
    openRoad: openRoad,

    /* THE ROAD WITHOUT THE ROAD — today's cell, answered with no cell to tap.
       It is what the village's door did before that door opened the road
       itself, and it is still the fallback for a build with no card system to
       open one on. */
    openToday: openToday,
    /* THE SHOP'S SHELF FOR A MISSED DAY: the latest one still inside the
       catch-up week (0 when there is none), what it costs, what it wears, and
       the purchase itself — played over the shop, whose band is already on
       screen. */
    lastMissed: lastMissed,
    catchUpPrice: priceOf,
    face: faceHtml,
    dayLabel: function (a) { return MT.fill(T.dayLong, { n: a }); },
    kindWord: kindWord,
    recover: function (a) { return recover(a, true); },
    /* Is there a gift waiting? The menu shows a dot on nothing else. */
    pending: function () { return !claimed(); }
  };

  function setLang(code) {
    LANG = STRINGS[code] ? code : "en";
    T = STRINGS[LANG];
    if (built) {
      win.setAttribute("aria-label", T.title);
      paint();
    }
  }
})();
