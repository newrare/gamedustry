/*
  webshell — the ALBUM: the collection, the machine that fills it, and the
  shop that pays for the machine.

  Loaded only by `node tools/build/build.mjs --target=web`, after
  packages/webshell/meta.js (which holds the state this file draws) and inert
  for a game with no `web.meta` block. Two screens, and they are two rather
  than one for the same reason the map is not a panel: a collection is
  something the player comes to look at, not something they fall into.

    THE ALBUM        every sticker the game has, in RANK order, whether the
                     player owns it or not. An unowned one is drawn as its own
                     SILHOUETTE — the same picture through a black filter —
                     because the shape is the tease: "there is a girl holding
                     something here and I do not know what". No second asset,
                     no placeholder to draw, and the album is legible the
                     minute a game's sheet is cut.
    THE MACHINE      at the top of the album, at half its drawn size, with
                     the bet and DRAW beside it and the four SHELVES under it
                     — one per rarity, each opening on its own odds (section
                     5). A REAL gumball machine on a canvas: sixteen
                     spheres under gravity in a glass globe, sloshed by the
                     globe itself and then one of them dropped down the chute
                     into the tray (section 3). A gumball machine and not a
                     slot reel — the player is not betting, they are
                     collecting. One pull eats ONE TO FIVE tickets and the
                     odds move with the bet, shown before they are rolled.
    THE GALLERY      the album's second tab: the game's own paintings — its
                     scenes and its character — cut into puzzle pieces and
                     bought one at a time with coins, at a price that follows
                     the climb (section 5b, and meta.js section 4b). It is
                     what the coins are for once the machine has nothing left
                     to give.
    THE SHOP         a grid of six tiles bought with coins — the ticket, the
                     super ticket, the mystery gift, the xp pack and the two
                     boosts — plus a missed day of the daily road while it can
                     still be caught up, and the doubles sold back. Every price
                     is derived from the ticket or from the rates a round pays
                     at (packages/webshell/meta.js, section 1).

  WHAT THE SHOP IS NOT: there is no money in it, and there is no bundle, no
  timer and no offer — a boost is counted in rounds, never in minutes. It is
  the sink the coins a round pays need in order to mean anything, and nothing
  else. Real-money purchases would be a different conversation and a different
  file (docs/INDUSTRIALIZATION.md).

  ES5-ish, same WebViews as the rest.
*/
(function () {
  "use strict";

  var W = window.__WEB__;
  var VW = window.__VIEW__;
  var MD = window.__MODAL__;
  if (!W) return;

  var MT = window.__META__;
  if (!MT || !MT.active()) { window.__ALBUM__ = { active: function () { return false; } }; return; }

  /* ── 0. strings ───────────────────────────────────────────────────────── */

  var STRINGS = {
    en: {
      album: "Stickers", shop: "Shop",
      draw: "Draw", drawCost: "1 ticket",
      mixing: "Mixing…",
      perDraw: "Tickets per draw",
      newSticker: "New sticker!", dupe: "Already owned",
      sell: "Sell", buy: "Buy",
      again: "Draw again",
      buyTitle: "Ticket", buyNote: "One draw at the sticker machine.",
      superTitle: "Super ticket",
      superNote: "One draw, and a legendary about one time in three.",
      superOwn: "You have {n}",
      giftTitle: "Mystery gift", giftNote: "Three boxes: tickets, xp or a sticker.",
      xpTitle: "Xp pack", xpNote: "{n} xp at once. The price follows your level.",
      coinBoostTitle: "Double coins", coinBoostNote: "Your next round pays twice the coins.",
      xpBoostTitle: "Double xp", xpBoostNote: "Your next {n} rounds pay twice the xp.",
      activeN: "Active · {n} rounds", active1: "Active · 1 round",
      sell1: "Sell 1 double", sellN: "Sell {n} doubles",
      fromMap: "Reward earned", fromMachine: "Won from a draw",
      toMap: "A reward to earn", toMachine: "Will come from a draw",
      unknown: "???",
      machineTab: "Machine", galleryTab: "Gallery", galleryTitle: "Gallery",
      galPaint: "Painting {n}/{t}", galName: "Painting {n}",
      buyPiece: "Buy a piece",
      galAhead: "Win stars on the map to bring the price down.",
      galFull: "Every painting is complete."
    },
    fr: {
      album: "Stickers", shop: "Boutique",
      draw: "Tirer", drawCost: "1 ticket",
      mixing: "Ca mélange…",
      perDraw: "Tickets par tirage",
      newSticker: "Nouveau sticker !", dupe: "Déjà obtenu",
      sell: "Vendre", buy: "Acheter",
      again: "Tirer encore",
      buyTitle: "Ticket", buyNote: "Un tirage à la machine à stickers.",
      superTitle: "Super ticket",
      superNote: "Un tirage avec environ une chance sur trois de légendaire.",
      superOwn: "Tu en as {n}",
      giftTitle: "Cadeau mystère", giftNote: "Trois boîtes : tickets, xp ou un sticker.",
      xpTitle: "Pack d’xp", xpNote: "{n} xp d’un coup. Le prix suit ton niveau.",
      coinBoostTitle: "Pièces doublées", coinBoostNote: "Ta prochaine partie rapporte deux fois plus de pièces.",
      xpBoostTitle: "Xp doublée", xpBoostNote: "Tes {n} prochaines parties rapportent deux fois plus d’xp.",
      activeN: "Actif · {n} parties", active1: "Actif · 1 partie",
      sell1: "Vendre 1 doublon", sellN: "Vendre {n} doublons",
      fromMap: "Récompense gagnée", fromMachine: "Obtenu par tirage",
      toMap: "Une récompense à gagner", toMachine: "S’obtiendra par tirage",
      unknown: "???",
      machineTab: "Machine", galleryTab: "Galerie", galleryTitle: "Galerie",
      galPaint: "Tableau {n}/{t}", galName: "Tableau {n}",
      buyPiece: "Acheter une pièce",
      galAhead: "Gagne des étoiles sur la carte pour faire baisser le prix.",
      galFull: "Tous les tableaux sont complets."
    }
  };
  W.Desk.table(STRINGS);       // a desk says "click" where a finger says "tap" (engine, Desk)

  /* Which of them the screen SHOUTS. Every string above is written in normal
     case, like the rest of the repo; the ones listed here are set in capitals
     by the motor's `upper` (packages/engine), which also takes the accents
     off — a capital carries none in this house. */
  var up = W.upper;
  var CAPS = ["album", "shop", "draw", "drawCost", "mixing",
    "perDraw", "newSticker", "dupe", "sell", "buy",
    "again", "buyTitle", "superTitle", "giftTitle", "xpTitle",
    "coinBoostTitle", "xpBoostTitle",
    "fromMap", "fromMachine",
    "toMap", "toMachine", "galPaint", "buyPiece"
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
  function fill(s, v) { return MT.fill(s, v); }
  function num(v) { return MT.num(v); }

  /* ── 1. dom helpers, handed over by menu.js ───────────────────────────── */

  var API = null;
  function el(tag, cls, html) { return API.el(tag, cls, html); }
  function icon(name, cls) { return API.icon(name, cls); }
  function $(id) { return document.getElementById(id); }
  function frame() { return $("frame"); }

  /* ── 2. the album screen ──────────────────────────────────────────────── */

  var box, scroll, machine, drawBtn, ctl, betRow;
  var built = false, drawing = false;
  /* How many tickets the next pull eats. It is the player's standing choice,
     not a per-draw question, so it survives a reveal and a trip to the shop —
     only a wallet that can no longer pay for it moves it. */
  var bet = 1;

  var S = null;                         // the album's sheet (view.js)
  var alStock = null;                   // what the player holds, in its header

  function build() {
    if (built) return;
    built = true;

    /* THE SHEET EVERY ROOM OF THE PLACE STANDS IN (packages/webshell/
       view.js, section 6b): the hub, the veil, the title, and the bar that
       carries options and help. The COUNT stays the band's first chip — it is
       what the player owns, which is the band's subject — so the title is the
       room's name and nothing more. */
    /* THE MACHINE OVER THE SHELVES: what a pull costs in a band at the top,
       and under it one shelf per rarity, each opening on its own odds
       (section 5). The body is allowed to scroll: on a tall phone the four
       shelves fit and nothing moves, and on a short one the legendary shelf
       — the one worth drawing for — is scrolled to rather than cut off. */
    scroll = el("div"); scroll.id = "al-scroll";
    pgMachine = el("div", "al-pg"); pgMachine.id = "al-pg-machine";
    var top = el("div"); top.id = "al-top";
    top.appendChild(buildMachine());
    top.appendChild(buildControls());
    pgMachine.appendChild(top);
    pgMachine.appendChild(buildShelves());
    scroll.appendChild(pgMachine);
    /* THE GALLERY IS THE SECOND PAGE of this room (section 5b), and a game
       that ships no painting has no gallery and no tab bar. */
    if (MT.piecesTotal()) {
      pgGallery = buildGallery();
      scroll.appendChild(pgGallery);
    }

    S = VW.sheet({ id: "al-screen", body: scroll });
    box = S.box;
    S.tab = "machine";
    if (pgGallery) S.pages(albumTabs(), pickTab);
    S.setHead(T.album, "");
    alStock = el("div", "sh-stock");
    S.head.appendChild(alStock);
  }

  var pgMachine = null, pgGallery = null;

  function albumTabs() {
    return [{ key: "machine", label: T.machineTab, icon: "ticket" },
            { key: "gallery", label: T.galleryTab, icon: "image" }];
  }

  /* A page change waits for a draw in flight: the reveal opens on the ball's
     landing, and a machine put to sleep under it would never report one. */
  function pickTab(key) {
    if (S.tab === key || drawing) return;
    S.tab = key;
    scroll.scrollTop = 0;
    paintPage();
    W.Sound.ui("tap", 0.45);
  }

  /* The page on show, painted; the other one hidden and, for the machine,
     put to sleep — a canvas nobody is looking at draws nothing. */
  function paintPage() {
    var gal = !!pgGallery && S.tab === "gallery";
    pgMachine.style.display = gal ? "none" : "";
    if (pgGallery) {
      pgGallery.style.display = gal ? "" : "none";
      S.relabel(albumTabs());
      S.light(S.tab);
    }
    if (gal) {
      Machine.sleep();
      S.setHead(T.galleryTitle, "");
      paintGallery();
    } else {
      S.setHead(T.album, "");
      paintMachine();
      paintShelves();
      Machine.refresh();          // the frame may have been resized under it
    }
  }

  /* ── 3. the machine ───────────────────────────────────────────────────── */

  /* A REAL GUMBALL MACHINE: sixteen spheres in a glass globe, under gravity,
     colliding with each other and with the curved wall.

     The first version of this was twelve <i> tags jiggling on a CSS keyframe,
     and that is exactly what it looked like — nothing had weight, nothing fell,
     and nothing ever left the glass, so the modal that pays out could have
     opened without any of it. The whole pleasure of a gumball machine is a pile
     of heavy things sloshing and then ONE of them dropping, and that is a
     simulation, not a transition. `lab/gacha.html` is where this was tuned and
     where the five other candidates it beat still are.

     A canvas rather than DOM for three reasons: circle-against-circle needs
     real positions sixty times a second (a transform on sixteen nodes is a
     layout cost per frame for something 300 px wide), a sphere wants a radial
     gradient rather than two inset shadows, and a canvas loop can SLEEP — once
     the pile has settled nothing is drawn at all, which matters on a screen the
     player scrolls and leaves open.

     It is still the game's own: every colour is read off the frame's theme
     tokens, so a SKIN re-dresses the machine like it re-dresses everything
     else, with no rule per game.

     The draw is three beats and each one is the physics doing it:

       1. THE SLOSH.  The globe itself moves — a damped oscillation of the
          container centre — and the balls are thrown by a wall moving into
          them. That is how you shake a box. An impulse applied to each ball
          would look like sixteen balls deciding to move at once.
       2. THE DROP.   A hatch opens and exactly ONE ball can use it: the winner
          is the ball nearest the mouth (so the eye agrees with the choice) and
          it is the only one whose wall constraint has a gap in it. Nothing else
          can leak out without a rule about it, which is why it is written that
          way round and not "the hole is small enough that probably only one
          will".
       3. THE LANDING. It falls down the chute and bounces into the tray. The
          reveal opens on the landing, not on a timer.

     AND THE GLASS REFILLS, at the start of the NEXT draw rather than the end of
     this one — so the ball that was taken is still sitting in the tray while
     the reveal is open, which is where the eye left it. A machine one ball
     lighter after every draw is empty by the fortieth, and the player who got
     there is the one who played the most. */

  var GUM = {
    balls: 16, r: 19,
    gravity: 2100,        // design px / s^2
    bounce: 0.42,         // restitution off the glass
    ballBounce: 0.26,     // ...and off another ball
    drag: 0.9975,         // air, per 1/240 s step
    wallFriction: 0.965,  // what the glass takes out of a graze
    shake: 34,            // px of slosh
    shakeMs: 620
  };

  /* The globe, the collar, the body, the chute and the tray. Named rather than
     inlined because four of them have to agree: the hole is wider than a ball,
     the chute is wider than the hole, the tray is wider than the chute, and the
     FOOT is wider than the globe — a machine whose glass overhangs its base
     reads as about to fall over, which is the one thing furniture may not do. */
  /* The machine is drawn at its own size and SHOWN at half of it: the album
     gives it the top band and keeps the height for the shelves under it, so
     the geometry below stays the geometry it was tuned with in
     `lab/gacha.html` and only the transform out of it changes. */
  var SCALE = 0.5;
  var G_W = 300, G_H = 424;
  var CX = 150, CY = 146, R = 120;
  var HOLE = 30, NECK = 46;
  var GLOBE_BOT = CY + R;
  var BODY_TOP = 266, BODY_BOT = 384, BODY_TW = 74, BODY_BW = 116;
  var TRAY_FLOOR = 372, TRAY_HALF = 64;
  var STEP = 1 / 240;

  function hexOf(v) {
    v = String(v).replace(/\s/g, "");
    if (v.charAt(0) !== "#") return [200, 200, 200];
    if (v.length === 4) v = "#" + v.charAt(1) + v.charAt(1) + v.charAt(2) + v.charAt(2) + v.charAt(3) + v.charAt(3);
    return [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16)];
  }
  function mixc(c, t, k) {
    var a = hexOf(c), b = hexOf(t);
    return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * k) + "," +
                    Math.round(a[1] + (b[1] - a[1]) * k) + "," +
                    Math.round(a[2] + (b[2] - a[2]) * k) + ")";
  }

  var Machine = (function () {
    var cv = null, ctx = null, dpr = 1;
    var colours = ["#8888ff"];
    var balls = [], winner = null, hatch = 0, crank = 0;
    var shakeT = 0, shakeDur = 0, offX = 0;
    var running = false, quiet = 0, onLanded = null;

    /* The palette is the SKIN's. Read once on mount and again on a language or
       theme change — six tokens, and two of them are near-neighbours in some
       games, which is what makes a pile look like one machine's stock rather
       than a paint chart. */
    function readColours() {
      var cs = window.getComputedStyle($("frame"));
      var names = ["--accent", "--gold", "--danger", "--cta-a", "--accent2", "--cta-b"];
      colours = [];
      for (var i = 0; i < names.length; i++) {
        colours.push((cs.getPropertyValue(names[i]) || "#8888ff").replace(/\s/g, "") || "#8888ff");
      }
    }

    /* The design->device ratio is the motor's, never window.devicePixelRatio:
       the frame is letterboxed and only `view` knows by how much. */
    function size() {
      dpr = Math.min(3, (W.view && W.view.dpr) || window.devicePixelRatio || 1) * SCALE;
      cv.width = Math.round(G_W * dpr);
      cv.height = Math.round(G_H * dpr);
      cv.style.width = (G_W * SCALE) + "px";
      cv.style.height = (G_H * SCALE) + "px";
    }

    function fill() {
      balls = []; winner = null; hatch = 0;
      for (var i = 0; i < GUM.balls; i++) {
        var a = Math.random() * Math.PI * 2, d = Math.random() * (R - GUM.r - 6);
        balls.push({
          x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d * 0.8 - 30,
          vx: (Math.random() - 0.5) * 40, vy: 0, r: GUM.r,
          c: colours[i % colours.length], out: false
        });
      }
      wake();
    }

    function step() {
      if (shakeT > 0) {
        shakeT -= STEP;
        var k = Math.max(0, shakeT / shakeDur);
        offX = Math.sin((shakeDur - shakeT) * 34) * GUM.shake * k * k;
        crank += STEP * 7.5;
      } else offX = 0;

      var cx = CX + offX, i, j, b;

      for (i = 0; i < balls.length; i++) {
        b = balls[i];
        b.vy += GUM.gravity * STEP;
        b.vx *= GUM.drag; b.vy *= GUM.drag;
        b.x += b.vx * STEP; b.y += b.vy * STEP;
      }

      // ball against ball — sixteen of them is 120 pairs, which is nothing
      for (i = 0; i < balls.length; i++) {
        for (j = i + 1; j < balls.length; j++) {
          var a = balls[i], c = balls[j];
          var dx = c.x - a.x, dy = c.y - a.y;
          var min = a.r + c.r, d2 = dx * dx + dy * dy;
          if (d2 > min * min || d2 < 1e-6) continue;
          var d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
          var push = (min - d) * 0.5;
          a.x -= nx * push; a.y -= ny * push;
          c.x += nx * push; c.y += ny * push;
          var rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (rv > 0) continue;
          var imp = -(1 + GUM.ballBounce) * rv * 0.5;
          a.vx -= imp * nx; a.vy -= imp * ny;
          c.vx += imp * nx; c.vy += imp * ny;
        }
      }

      for (i = 0; i < balls.length; i++) confine(balls[i], cx);
    }

    /* THE GAP IS THE WINNER'S AND NOBODY ELSE'S. */
    function confine(b, cx) {
      var dx = b.x - cx, dy = b.y - CY;
      var d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      var lim = R - b.r;
      /* TWO DIFFERENT QUESTIONS, and conflating them cost a whole debugging
         pass: `mine` is "this is the ball that was drawn" and holds for the
         entire journey; `open` is "the flap is up right now" and holds for a
         fraction of a second. The GAP in the glass is the second one — but the
         chute and the tray below are the first, and gating them on `open` too
         meant that the moment the flap shut behind the ball (which is what it
         is supposed to do) the ball lost every wall it had and fell out of the
         world at 2 800 px/s. It only ever showed as "the draw hangs", because
         the timeout was the thing that ended it. */
      var mine = (b === winner);
      var open = mine && hatch > 0.5;
      var inGap = open && dy > 0 && Math.abs(dx) < HOLE - b.r * 0.35;

      if (d > lim && !inGap && !b.out) {
        var nx = dx / d, ny = dy / d;
        b.x = cx + nx * lim; b.y = CY + ny * lim;
        var vn = b.vx * nx + b.vy * ny;
        if (vn > 0) { b.vx -= (1 + GUM.bounce) * vn * nx; b.vy -= (1 + GUM.bounce) * vn * ny; }
        b.vx *= GUM.wallFriction; b.vy *= GUM.wallFriction;
      }

      if (!mine) return;

      /* A pull toward the mouth while the hatch is open: a winner that has to be
         picked by luck out of a jostling pile takes as long as luck takes, and
         a draw has a length. */
      if (!b.out && open && b.y > CY) {
        b.vx += (cx - b.x) * 6 * STEP;
        if (b.y > GLOBE_BOT - b.r) b.out = true;
      }
      if (!b.out) return;
      // through: the flap shuts behind it, which is the machine saying "one"
      if (hatch > 0 && b.y > GLOBE_BOT + 8) hatch = Math.max(0, hatch - 4 * STEP);

      if (b.x < CX - NECK + b.r) { b.x = CX - NECK + b.r; b.vx = -b.vx * GUM.bounce; }
      if (b.x > CX + NECK - b.r) { b.x = CX + NECK - b.r; b.vx = -b.vx * GUM.bounce; }
      if (b.y + b.r > TRAY_FLOOR) {
        b.y = TRAY_FLOOR - b.r;
        b.vy = -b.vy * GUM.bounce;
        b.vx *= 0.88;
        if (Math.abs(b.vy) < 60) {
          b.vy = 0;
          if (onLanded) { var f = onLanded; onLanded = null; f(); }
        }
      }
      if (b.x < CX - TRAY_HALF + b.r) { b.x = CX - TRAY_HALF + b.r; b.vx = -b.vx * 0.5; }
      if (b.x > CX + TRAY_HALF - b.r) { b.x = CX + TRAY_HALF - b.r; b.vx = -b.vx * 0.5; }
    }

    // ---- drawing ---------------------------------------------------------
    function sphere(x, y, r, c) {
      var g = ctx.createRadialGradient(x - r * 0.34, y - r * 0.4, r * 0.12, x, y, r * 1.05);
      g.addColorStop(0, mixc(c, "#ffffff", 0.72));
      g.addColorStop(0.42, c);
      g.addColorStop(1, mixc(c, "#000000", 0.55));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.75)";
      ctx.beginPath(); ctx.ellipse(x - r * 0.34, y - r * 0.42, r * 0.22, r * 0.15, -0.7, 0, 6.2832);
      ctx.fill();
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function bodyPath() {
      var r = 14;
      ctx.beginPath();
      ctx.moveTo(CX - BODY_TW, BODY_TOP);
      ctx.lineTo(CX + BODY_TW, BODY_TOP);
      ctx.lineTo(CX + BODY_BW, BODY_BOT - r);
      ctx.arcTo(CX + BODY_BW, BODY_BOT, CX + BODY_BW - r, BODY_BOT, r);
      ctx.lineTo(CX - BODY_BW + r, BODY_BOT);
      ctx.arcTo(CX - BODY_BW, BODY_BOT, CX - BODY_BW, BODY_BOT - r, r);
      ctx.closePath();
    }

    function draw() {
      var cx = CX + offX, i;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, G_W, G_H);

      // the foot plate, then the body it stands on
      ctx.fillStyle = "rgba(8,10,24,.95)";
      roundRect(CX - 128, BODY_BOT - 6, 256, 26, 9); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.lineWidth = 3;
      roundRect(CX - 128, BODY_BOT - 6, 256, 26, 9); ctx.stroke();

      var ped = ctx.createLinearGradient(CX - BODY_BW, BODY_TOP, CX + BODY_BW, BODY_BOT);
      ped.addColorStop(0, "rgba(150,170,220,.30)");
      ped.addColorStop(0.45, "rgba(30,36,64,.94)");
      ped.addColorStop(1, "rgba(8,10,24,.96)");
      ctx.fillStyle = ped; bodyPath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.26)"; ctx.lineWidth = 3;
      bodyPath(); ctx.stroke();

      // the chute, dark so the ball reads against it
      ctx.fillStyle = "rgba(0,0,0,.78)";
      roundRect(CX - NECK, 262, NECK * 2, 126, 12); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 2;
      roundRect(CX - NECK, 262, NECK * 2, 126, 12); ctx.stroke();

      // the collar the globe screws into
      var col = ctx.createLinearGradient(0, 252, 0, 278);
      col.addColorStop(0, "rgba(226,238,255,.7)");
      col.addColorStop(1, "rgba(120,140,190,.45)");
      ctx.fillStyle = col;
      roundRect(CX - 60, 252, 120, 24, 9); ctx.fill();

      // the globe, back half
      var back = ctx.createRadialGradient(cx - R * 0.3, CY - R * 0.35, R * 0.1, cx, CY, R);
      back.addColorStop(0, "rgba(150,175,225,.16)");
      back.addColorStop(1, "rgba(6,8,22,.74)");
      ctx.fillStyle = back;
      ctx.beginPath(); ctx.arc(cx, CY, R, 0, 6.2832); ctx.fill();

      // the pile
      for (i = 0; i < balls.length; i++) {
        if (balls[i] !== winner) sphere(balls[i].x, balls[i].y, balls[i].r, balls[i].c);
      }

      // the hatch at the mouth
      ctx.save();
      ctx.translate(cx - HOLE, GLOBE_BOT - 10);
      ctx.rotate(hatch * 1.35);
      ctx.fillStyle = "rgba(226,238,255,.9)";
      roundRect(0, -5, HOLE * 2, 10, 5); ctx.fill();
      ctx.restore();

      // the glass, in front
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, CY, R, 0, 6.2832); ctx.clip();
      var gl = ctx.createLinearGradient(cx - R, CY - R, cx + R * 0.4, CY + R);
      gl.addColorStop(0, "rgba(255,255,255,.3)");
      gl.addColorStop(0.34, "rgba(255,255,255,.05)");
      gl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gl;
      ctx.fillRect(cx - R, CY - R, R * 2, R * 2);
      ctx.strokeStyle = "rgba(255,255,255,.34)"; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(cx, CY, R - 8, -0.55, 1.0); ctx.stroke();
      ctx.restore();

      // the rim, and the screw-top on it
      ctx.strokeStyle = "rgba(226,238,255,.66)"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, CY, R - 3, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = "rgba(226,238,255,.72)";
      roundRect(cx - 18, CY - R - 15, 36, 22, 9); ctx.fill();

      // the winner travels in front of the chute
      if (winner) sphere(winner.x, winner.y, winner.r, winner.c);

      // the tray lip, over the ball so it sits IN the tray
      var tr = ctx.createLinearGradient(0, TRAY_FLOOR - 6, 0, TRAY_FLOOR + 22);
      tr.addColorStop(0, "rgba(150,170,220,.34)");
      tr.addColorStop(1, "rgba(6,8,20,.98)");
      ctx.fillStyle = tr;
      roundRect(CX - TRAY_HALF - 14, TRAY_FLOOR - 4, (TRAY_HALF + 14) * 2, 24, 9); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.26)"; ctx.lineWidth = 3;
      roundRect(CX - TRAY_HALF - 14, TRAY_FLOOR - 4, (TRAY_HALF + 14) * 2, 24, 9); ctx.stroke();

      // the crank, on the body
      ctx.save();
      ctx.translate(CX + 66, 318); ctx.rotate(crank);
      ctx.strokeStyle = colours[1]; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, 19, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = colours[1];
      roundRect(-4, -16, 8, 13, 4); ctx.fill();
      ctx.restore();
    }

    /* The loop, and its sleep: when every velocity is under a pixel a second
       the rAF stops and the canvas keeps its last frame. An album is a screen
       the player scrolls and leaves open; a machine that costs a frame forever
       to show a pile that is not moving costs battery to do nothing. */
    function frame() {
      if (!running) return;
      var i, e = 0;
      for (i = 0; i < 4; i++) step();            // 4 x 1/240 = one 60 Hz frame
      draw();
      for (i = 0; i < balls.length; i++) e += Math.abs(balls[i].vx) + Math.abs(balls[i].vy);
      if (e < 12 && shakeT <= 0) quiet++; else quiet = 0;
      if (quiet > 24) { running = false; return; }
      requestAnimationFrame(frame);
    }
    function wake() {
      quiet = 0;
      if (running || !ctx) return;
      running = true;
      requestAnimationFrame(frame);
    }

    return {
      mount: function (canvas) {
        cv = canvas; ctx = cv.getContext("2d");
        readColours(); size(); fill();
      },
      // a language change never touches this; a re-open does, because the
      // frame may have been resized under it
      refresh: function () { if (!ctx) return; size(); wake(); },
      sleep: function () { running = false; },
      shake: function () {
        if (winner) {
          balls.splice(balls.indexOf(winner), 1);
          balls.push({
            x: CX + (Math.random() - 0.5) * 60, y: CY - R + GUM.r + 4,
            vx: (Math.random() - 0.5) * 60, vy: 120, r: GUM.r,
            c: colours[Math.floor(Math.random() * colours.length)], out: false
          });
          winner = null; hatch = 0;
        }
        shakeDur = shakeT = GUM.shakeMs / 1000;
        wake();
      },
      release: function (done) {
        var best = null, bd = 1e9, i;
        for (i = 0; i < balls.length; i++) {
          var dx = balls[i].x - CX, dy = balls[i].y - (CY + R);
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < bd) { bd = d; best = balls[i]; }
        }
        winner = best; hatch = 0; onLanded = done;
        var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
        (function open(now) {
          var t = now || ((window.performance && performance.now) ? performance.now() : Date.now());
          hatch = Math.min(1, (t - t0) / 220);
          if (hatch < 1) requestAnimationFrame(open);
        })(t0);
        wake();
      },
      live: function () { return !!ctx; }
    };
  })();

  function buildMachine() {
    machine = el("div"); machine.id = "al-machine";
    var cv = el("canvas", "al-cv");
    machine.appendChild(cv);
    Machine.mount(cv);
    return machine;
  }

  /* THE OTHER HALF OF THE MACHINE: how many tickets this pull eats. What
     that buys is read on the shelves under it (section 5), out of
     `MT.odds(bet)` — the same weights the roll uses — so raising the bet
     moves the tracks the player is looking at and not a promise written
     beside them. Every pill is selectable even when the wallet cannot pay for
     it: a player who can never SEE what five tickets would do has no reason
     to save for five. */
  function buildControls() {
    ctl = el("div"); ctl.id = "al-ctl";

    ctl.appendChild(el("div", "al-lbl", T.perDraw));

    betRow = el("div", "al-bets");
    /* One pill per ordinary ticket, then the SUPER on the end. It is a bet
       like the five before it — `MT.superBet()` is the number handed to the
       odds and to the roll — so picking it moves the same four bars, and the
       legendary one lands on 30% before a ball has moved. What differs is the
       currency it is paid in, which is the one branch below. */
    var i, b;
    for (i = 1; i <= MT.maxBet(); i++) {
      b = el("button", "btn btn-sm btn-plate al-bet", String(i));
      b.setAttribute("data-b", i);
      betRow.appendChild(b);
    }
    b = el("button", "btn btn-sm btn-plate al-bet sup", icon("ticketSuper", "al-supi") + '<i></i>');
    b.setAttribute("data-b", MT.superBet());
    b.setAttribute("aria-label", T.superTitle);
    betRow.appendChild(b);

    var pills = betRow.querySelectorAll(".al-bet");
    for (i = 0; i < pills.length; i++) {
      pills[i].addEventListener("click", (function (n) {
        return function () {
          if (drawing || bet === n) return;
          bet = n;
          /* The pitch climbs with the row, and the super is the step above
             the last ticket — `n` is a sentinel there and not a position. */
          var step = n === MT.superBet() ? MT.maxBet() + 1 : n;
          W.Sound.ui("tick", 0.4, 1 + step * 0.06);
          paintMachine();
        };
      })(+pills[i].getAttribute("data-b")));
    }
    ctl.appendChild(betRow);

    drawBtn = el("button", "btn btn-buy btn-lg btn-wide al-draw");
    drawBtn.addEventListener("click", onDraw);
    ctl.appendChild(drawBtn);
    return ctl;
  }

  function paintMachine() {
    var have = MT.tickets(), supers = MT.supers(), max = MT.maxBet(), i;
    /* A SENTINEL, not a count (meta.js): the super pill's `bet` is outside the
       range of any number of tickets, so the clamp that keeps an ordinary bet
       inside 1..max has to step around it whole rather than test one end. */
    var sup = MT.superBet();
    if (bet !== sup) {
      if (bet > max) bet = max;
      if (bet < 1) bet = 1;
    }
    /* The super pill is paid for out of its own pocket, so what "short" means
       and what DRAW costs both fork here and nowhere else. */
    var isSuper = bet === sup;
    var ok = isSuper ? supers >= 1 : have >= bet;

    var pills = betRow.querySelectorAll(".al-bet");
    for (i = 0; i < pills.length; i++) {
      var n = +pills[i].getAttribute("data-b");
      var s = n === sup;
      var lacks = s ? supers < 1 : n > have;
      /* the bet in play is the button, the others its plate */
      pills[i].className = "btn btn-sm al-bet" + (s ? " sup" : "") + (n === bet ? "" : " btn-plate") +
                           (lacks ? " short" : "");
      pills[i].setAttribute("aria-pressed", n === bet ? "true" : "false");
      pills[i].disabled = drawing;
      /* The count rides ON the pill because the wallet has no chip for it: a
         player who bought one has to see it somewhere, and this is the only
         screen it can be spent from. Blank at zero rather than "0" — an empty
         pocket is the shop's message, not a counter's. */
      if (s) pills[i].querySelector("i").textContent = supers > 0 ? supers : "";
    }

    paintOdds();
    if (S && S.tab === "gallery") return drawLabel(isSuper, ok);
    paintStock(alStock, [
      { tone: "ticket", pic: "ticket", n: have, label: T.buyTitle },
      { tone: "super", pic: "ticketSuper", n: supers, label: T.superTitle }
    ]);

    drawLabel(isSuper, ok);
  }

  function drawLabel(isSuper, ok) {
    drawBtn.disabled = drawing || !ok;
    drawBtn.innerHTML = "<span>" + (drawing ? T.mixing : T.draw) + "</span>" +
      '<span class="btn-badge">' + icon(isSuper ? "ticketSuper" : "ticket") +
      (drawing || isSuper ? "" : bet) + "</span>";
  }

  /* The draw. The sticker is decided BEFORE a ball moves, like the gift boxes:
     an animation that reads the result is theatre, an animation that decides it
     while the player watches is a machine they cannot trust.

     The timings are the physics', not a schedule: the slosh runs for as long as
     it runs, and the reveal opens when the ball has LANDED. The one timer is a
     ceiling on that wait — a ball that somehow never reports a landing must not
     hang the draw, because the reveal is the point and the physics is the
     flourish. */
  var LAND_MAX = 2200;

  function onDraw() {
    var isSuper = bet === MT.superBet();
    if (drawing || !(isSuper ? MT.useSuper() : MT.useTicket(bet))) return;
    drawing = true;
    paintMachine();

    var n = MT.roll(bet);
    Machine.shake();
    W.Sound.ui("draw", 0.5);

    setTimeout(function () {
      var done = false;
      function landed() {
        if (done) return;
        done = true;
        W.Sound.ui("gain", 0.7, 0.9);
        var isNew = MT.give(n);
        if (isNew) MT.bumpUnseen();
        drawing = false;
        paintMachine();
        paintShelves();
        setTimeout(function () { reveal(n, isNew); }, 240);
      }
      Machine.release(landed);
      setTimeout(landed, LAND_MAX);
    }, GUM.shakeMs + 140);
  }

  /* ── 4. the reveal ────────────────────────────────────────────────────── */

  /* TWO CARDS, AND THEY DO NOT LOOK ALIKE. A sticker the player has never had
     is the whole reason the machine exists, so it arrives on a sunburst and a
     tag that shines. A double is not a failure and is not written like one
     either — but it is not news, so it burns off: embers climbing the card and
     a tag that barely raises its voice.

     NEITHER CLOSES ITSELF. The double used to burn out after two seconds,
     which put a clock on a picture the player might want to look at and made
     the card race the hand reaching for it; the hand cancelled the clock,
     which is a rule nobody can see. A card is dismissed by a tap anywhere on
     the screen, like every other card of this layer, and it waits.

     ONE CONTROL, AND ONLY WHEN IT CAN BE USED: DRAW AGAIN, wearing the ticket
     and what a pull costs. A player with fewer tickets than the bet gets no
     button at all — a control that cannot act is a wall, and the tap that
     closes the card is already the way on. The SELL button is gone with it: a
     price on the card turns a reveal into a till, and the shop sells doubles
     (two taps away, all of them at once, with the total in front of the
     player) which is where that decision belongs. */

  /* The layer the ceremony is painted on, behind everything the card writes.
     Both are pure CSS once the nodes exist (packages/webshell/meta.css): the
     rays spin, the rings expand, the embers rise, and nothing here runs a
     frame loop for a card that lives two seconds. */
  function fx(isNew) {
    var f = el("div", "al-fx"), i, html = "";
    if (isNew) {
      f.appendChild(el("div", "al-flash"));
      f.appendChild(el("div", "al-shock"));
      f.appendChild(el("div", "al-shock d2"));
      for (i = 0; i < 18; i++) {
        var a = (i / 18) * 6.2832 + Math.random() * 0.3;
        var d = 180 + Math.random() * 140;
        html += '<i style="--dx:' + Math.round(Math.cos(a) * d) + "px;--dy:" +
          Math.round(Math.sin(a) * d) + "px;animation-delay:" +
          (Math.random() * 0.22).toFixed(2) + 's"></i>';
      }
      f.appendChild(el("div", "al-sparks", html));
    } else {
      f.appendChild(el("div", "al-lava"));
      for (i = 0; i < 26; i++) {
        var sz = Math.round(5 + Math.random() * 13);
        html += '<i style="left:' + (Math.random() * 100).toFixed(1) + "%;width:" + sz +
          "px;height:" + sz + "px;--rise:" + Math.round(230 + Math.random() * 280) +
          "px;--sway:" + Math.round((Math.random() - 0.5) * 90) +
          "px;animation-duration:" + (1 + Math.random() * 0.9).toFixed(2) +
          "s;animation-delay:" + (Math.random() * 0.65).toFixed(2) + 's"></i>';
      }
      f.appendChild(el("div", "al-embers", html));
    }
    return f;
  }

  function reveal(n, isNew) {
    /* The card is a modal of the view system (packages/webshell/view.js); what
       is left here is what is IN it. `dismiss` is off because DRAW AGAIN is on
       it and a real control must never be what a thumb lands on by missing —
       the tap-out below is the one that knows to spare it. */
    /* The title is the card's own slot, gold like every card's — the plated
       NEW tag it used to wear was a second kind of heading on one card. The
       tap line is the default one: a tap anywhere but DRAW AGAIN closes it. */
    var h = MD.open({
      kind: "sticker " + (isNew ? "fresh" : "seen"), dismiss: false, esc: false,
      title: isNew ? T.newSticker : T.dupe
    });
    var modal = h.box, card = h.body;
    /* the ceremony is painted under all of the card, slots included */
    h.card.appendChild(fx(isNew));
    /* A NEW one gets the layer's own reward badge — the turning sunburst and
       the ring, already coloured by rarity (packages/webshell/meta.css), the
       same frame the gift card puts a prize in. A double gets the picture
       alone: the badge is what says "this is a prize", and a double is not
       one. */
    var art = el("div", "mt-rw" + (MT.shiny(n) ? " shiny" : ""),
      '<img class="mt-rw-img" src="' + MT.art(n) + '" alt="">');
    if (isNew) {
      var badge = el("div", "mt-badge-rw t" + MT.rarityOf(n),
        '<span class="rays"></span><span class="ring"></span>');
      badge.appendChild(art);
      card.appendChild(badge);
    } else {
      card.appendChild(art);
    }
    card.appendChild(el("div", "mt-rw-name", MT.name(n)));
    card.appendChild(el("div", "mt-rw-rar r" + MT.rarityOf(n), MT.rarityName(n)));

    /* The button says what the pull COSTS, in the ticket the wallet counts and
       not in a word: the bet is a standing choice made on the machine's own
       slider, and a player about to spend it again should see it leave. */
    if (MT.tickets() >= bet) {
      var acts = el("div", "mt-acts");
      var ok = el("button", "btn btn-buy al-again",
        "<span>" + T.again + "</span>" +
        '<span class="btn-badge">' + icon("ticket") + num(bet) + "</span>");
      ok.addEventListener("click", function () {
        shut();
        setTimeout(onDraw, 260);
      });
      acts.appendChild(ok);
      card.appendChild(acts);
    }
    W.Sound.ui(isNew ? "reward" : "gain", 0.85);
    /* No Confetti here, for the reason meta.js gives on its own gift card: the
       motor's burst draws on the END SCREEN's canvas, which is not over this
       one. The sunburst and the shockwave are the celebration. */

    /* A tap anywhere puts it away — everywhere but on DRAW AGAIN, which is a
       real control and must never be what a thumb lands on by missing. ENTER,
       SPACE and ESCAPE do the same for a keyboard. */
    MT.tapOut(modal, function () { shut(); });
    var unkey = MT.keyOut(function () { shut(); });

    var gone = false;
    function shut() {
      if (gone) return;
      gone = true;
      if (unkey) unkey();
      h.close();
    }
  }

  /* ── 5. the shelves ───────────────────────────────────────────────────── */

  /* ONE SHELF PER RARITY, commons first and the legendaries last, and within a
     rank the sheet's own order. It is worked out once: the album is a shape
     the player learns and then fills, so a tile may not move because
     something was drawn — only because the rank ladder says where it
     belongs. The epic and legendary shelves share a row, two tiles each.

     EVERY SHELF OPENS ON ITS OWN ODDS, and on what ONE ticket would give.
     A row of pills reading 1 2 3 4 5 reads as a quantity — "draw five
     times?" — and four percentages in a column of their own were too far from
     it to answer. So each shelf starts with one line: a track notched where a
     single ticket stands, the gain the bet buys HATCHED past the notch (or,
     on the common shelf, the share it gives up), then the chance itself in a
     pill. The track is scaled to the most an ordinary bet can reach on that
     rarity, so five tickets fill it; the super ticket runs past it and is
     clamped, which is the truth — it is the one bet that is not on the
     ladder. The rarity's name and the count sign the shelf in its
     bottom-right corner, under the stickers they count.

     Chosen in lab/sticker-album.html, round 2, VERSUS ONE: the round-1
     layouts it came out of and the three other ways of saying "more tickets,
     rarer stickers" it beat are still on that page. */
  var SHELF_COLS = [8, 6, 2, 2];
  var SHELF_MAX = [0, 80, 84, 84];                // px a tile may grow to; 0 = the column
  var TIERS = (function () {
    var out = [[], [], [], []], i;
    for (i = 1; i <= MT.total(); i++) out[MT.rarityOf(i)].push(i);
    return out;
  })();
  var shelves = [];

  function buildShelves() {
    var wrap = el("div"); wrap.id = "al-shelves";
    var pair = el("div", "al-pair"), r;
    for (r = 0; r < 4; r++) {
      var node = el("div", "al-sh r" + r,
        '<div class="al-vs"><span class="al-tk"><span class="b"></span><span class="g"></span><s></s></span>' +
        '<span class="al-ch"><u></u><b></b></span></div>' +
        '<div class="al-row"></div>' +
        '<div class="al-ft"><span class="nm"></span><span class="ct"></span></div>');
      var row = node.querySelector(".al-row");
      row.style.setProperty("--cols", SHELF_COLS[r]);
      if (SHELF_MAX[r]) row.style.setProperty("--max", SHELF_MAX[r] + "px");
      shelves.push({
        node: node, row: row, ch: node.querySelector(".al-ch"),
        fill: node.querySelector(".al-ch u"), pc: node.querySelector(".al-ch b"),
        base: node.querySelector(".al-tk .b"), gain: node.querySelector(".al-tk .g"),
        notch: node.querySelector(".al-tk s"),
        nm: node.querySelector(".al-ft .nm"), ct: node.querySelector(".al-ft .ct"),
        last: null
      });
      (r < 2 ? wrap : pair).appendChild(node);
    }
    wrap.appendChild(pair);
    return wrap;
  }

  function pctText(v) {
    var pc = Math.round(v * 100);
    return pc < 1 && v > 0 ? "<1%" : pc + "%";
  }

  /* The four lines, for the bet on the machine. Written in place rather than
     rebuilt, so a bet that moves a chance ANIMATES it — the track slides, and
     the pill swells when the bet bought it and shrinks when it took it
     away. */
  function paintOdds() {
    var now = MT.odds(bet), one = MT.odds(1), full = [0, 0, 0, 0], b, r, o;
    for (b = 1; b <= MT.maxBet(); b++) {
      o = MT.odds(b);
      for (r = 0; r < 4; r++) if (o[r] > full[r]) full[r] = o[r];
    }
    for (r = 0; r < 4; r++) {
      var sh = shelves[r], v = now[r], v1 = one[r], f = full[r] || 1;
      var lo = Math.min(v1, v), hi = Math.max(v1, v);
      var at = function (x) { return Math.min(100, x / f * 100); };
      sh.base.style.width = at(lo).toFixed(1) + "%";
      sh.gain.style.left = at(lo).toFixed(1) + "%";
      sh.gain.style.width = (at(hi) - at(lo)).toFixed(1) + "%";
      sh.gain.className = "g" + (v < v1 ? " loss" : "");
      sh.notch.style.left = at(v1).toFixed(1) + "%";
      sh.fill.style.width = (v * 100).toFixed(1) + "%";
      sh.pc.textContent = pctText(v);
      sh.ch.className = "al-ch" + (v ? "" : " nil");
      if (sh.last != null && Math.abs(v - sh.last) > 1e-9) {
        void sh.ch.offsetWidth;                  // restart the pulse on a second change
        sh.ch.className += v > sh.last ? " up" : " down";
      }
      sh.last = v;
    }
  }

  function paintShelves() {
    var r, k, i, c, html, have, earn;
    for (r = 0; r < 4; r++) {
      var sh = shelves[r], list = TIERS[r];
      /* a game with no sticker of a rarity has no shelf for it */
      sh.node.style.display = list.length ? "" : "none";
      html = ""; have = 0;
      for (k = 0; k < list.length; k++) {
        i = list[k];
        c = MT.count(i);
        if (c) have++;
        /* A SHADOW THE MACHINE WILL NEVER ROLL wears a padlock: a milestone
           sticker is earned on the map (a band, a clean band, the board), and
           without the mark it reads exactly like the shadows a ticket can
           still pull — the player would bet on a picture no bet can reach. */
        earn = !c && MT.isMilestone(i);
        html += '<button class="al-tile r' + r + (c ? " have" : " ghost") + (earn ? " earn" : "") +
          (MT.shiny(i) && c ? " shiny" : "") +
          '" data-n="' + i + '" aria-label="' + (c ? MT.name(i) : T.unknown) + '">' +
          '<img src="' + MT.art(i) + '" alt="">' +
          (c > 1 ? '<i class="dup">x' + c + "</i>" : "") +
          (earn ? '<i class="lk">' + icon("lock", "al-lki") + "</i>" : "") + "</button>";
      }
      sh.row.innerHTML = html;
      sh.nm.textContent = MT.text("rarity" + (r + 1));
      sh.ct.textContent = have + "/" + list.length;
      var nodes = sh.row.querySelectorAll(".al-tile");
      for (k = 0; k < nodes.length; k++) {
        nodes[k].addEventListener("click", (function (node) {
          return function () { detail(+node.getAttribute("data-n")); };
        })(nodes[k]));
      }
    }
  }

  /* ONE STICKER, AND NOTHING TO DECIDE. It is a card the player opened to LOOK
     at something: the picture at size, what rank it is, where it comes from,
     and how many they have in the corner. It carried a SELL and a KEEP button,
     and both were wrong here — KEEP decided nothing (it was a close button
     wearing a verb), and SELL turned a page of the collection into a till. The
     shop is where doubles are traded, in one gesture, and the reveal card still
     offers the one that just landed.

     So the whole card is the dismiss: a tap anywhere closes it. With no button
     left there is no other target to miss, and the card is the size of the
     frame's middle.

     An unowned one shows the same card with the silhouette and the one line
     that says how it is got — which is the only place in this layer the
     milestones are explained to the player. */
  function detail(n) {
    var have = MT.count(n), rar = MT.rarityOf(n);
    /* HOW MANY, in the corner and as a number alone — the card's tag. "OWNED
       x3" spelled out under the picture read as a caption and pushed the card
       taller.
       NOT YET IS NOT A TITLE. A card whose picture is already a silhouette does
       not need a sentence at the top saying so: the three marks ARE the name it
       does not have, they are what the tile under it reads, and the line under
       the picture is where "how do I get it" is answered. */
    var h = MD.open({
      kind: "sticker detail r" + rar, dismiss: true,
      badge: have ? "x" + have : undefined,
      title: have ? MT.name(n) : T.unknown
    });
    var card = h.body;
    card.appendChild(el("div", "mt-rw" + (have ? (MT.shiny(n) ? " shiny" : "") : " ghost"),
      '<img class="mt-rw-img" src="' + MT.art(n) + '" alt="">'));
    card.appendChild(el("div", "mt-rw-rar r" + rar, MT.rarityName(n)));
    /* PAST TENSE FOR WHAT IS OWNED, IMPERATIVE FOR WHAT IS NOT: one line, and
       it either says what the player DID or what they have to go and do. */
    card.appendChild(el("div", "mt-rw-src", MT.isMilestone(n)
      ? (MT.milestoneLabel(n, !have) || (have ? T.fromMap : T.toMap))
      : (have ? T.fromMachine : T.toMachine)));
  }

  /* ── 5b. the gallery ──────────────────────────────────────────────────── */

  /* THE SECOND THING TO FILL. The machine runs dry once the twenty stickers
     are in, and the coins kept coming with nothing left to buy; the gallery
     is what they go to. Its paintings are the game's OWN — every scene it
     ships, the village's ground, the desk's wide scene and the character in
     its three moods standing on the game's scene (meta.js, section 4b) — so
     there is nothing to draw for it, and it is cut into puzzle pieces bought
     one at a time. The paintings fill in order, each one a step, and a
     painting not reached yet is shown under its pieces with a padlock: the
     shape of what is coming is the reason to go on.

     THE CUT IS GENERATED, never drawn: a grid per painting (meta.js picks it)
     and a tab on every inner edge, its side drawn from a generator seeded on
     the game and the painting, so a piece has the same shape every visit and
     in every build. The order the pieces land in is the same generator's
     shuffle, so a painting fills from everywhere at once and not row by
     row. Nothing about a piece is stored: the save holds one count.

     THE PRICE IS THE CLIMB'S (meta.js `galPrice`): it is read fresh on every
     paint, and the one sentence on the page says what lowers it when the
     gallery has run ahead of the map — a price that moves for a reason the
     player is never told reads as a cheat. */
  var gal = null;                       // the page's nodes
  var galSel = -1;                      // the painting on show; -1 = the one being filled
  var galNew = -1, galNewAt = 0;        // the piece just bought, and when
  var galDone = -1, galDoneAt = 0;      // the painting just completed, and when
  var GAL_NEW_MS = 900, GAL_DONE_MS = 1400;
  var shapes = {};

  /* WHERE A CHARACTER STANDS ON ITS SCENE. The eighteen casts were not cut
     to one shape: 373x560, 460x383, 460x549…, some with a margin of air
     around the body (orbinity's fills 69 % of its height) and some off
     centre in their own file (gearball's sits high). Centring the FILE would
     centre the air with it, so the visible body is measured once — the box
     of every pixel that is not transparent — and THAT box is centred on the
     painting, scaled to fit 78 % of its width and 62 % of its height.

     The measure needs the picture decoded, so every character is measured
     when the gallery is built, long before its tab is opened; a painting
     drawn before its measure lands draws no character and is repainted when
     it does, rather than drawing it once in the wrong place. */
  var CHAR_W = 0.78, CHAR_H = 0.62;
  var bodies = {};                      // src -> the visible box, or 1 while it loads

  function measureBody(src) {
    if (bodies[src]) return;
    bodies[src] = 1;
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight, box = { x: 0, y: 0, w: w, h: h, iw: w, ih: h };
      var cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      try {
        var c = cv.getContext("2d");
        c.drawImage(img, 0, 0);
        var d = c.getImageData(0, 0, w, h).data, x0 = w, y0 = h, x1 = -1, y1 = -1, x, y;
        for (y = 0; y < h; y++) {
          for (x = 0; x < w; x++) {
            if (d[(y * w + x) * 4 + 3] > 24) {
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
          }
        }
        if (x1 >= 0) box = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, iw: w, ih: h };
      } catch (e) { /* a picture the canvas may not read is centred whole */ }
      cv.width = cv.height = 0;
      bodies[src] = box;
      if (gal && VW.isOpen("sticker") && S.tab === "gallery") paintGallery();
    };
    img.src = src;
  }

  /* The picture's own rectangle in the painting's viewBox, placed so that
     its visible body is centred on (w/2, h/2). Null until it is measured. */
  function charPlace(src, w, h) {
    var b = bodies[src];
    if (!b || b === 1) { measureBody(src); return null; }
    var k = Math.min(w * CHAR_W / b.w, h * CHAR_H / b.h);
    return { x: w / 2 - (b.x + b.w / 2) * k, y: h / 2 - (b.y + b.h / 2) * k,
             w: b.iw * k, h: b.ih * k };
  }

  function buildGallery() {
    var list = MT.gallery(), i;
    for (i = 0; i < list.length; i++) if (list[i].groundSrc) measureBody(list[i].src);
    var pg = el("div", "al-pg"); pg.id = "al-pg-gallery";
    gal = {
      frame: el("div", "gl-frame"),
      cap: el("div", "gl-cap"),
      buy: el("button", "btn btn-buy btn-lg btn-wide gl-buy"),
      hint: el("p", "gl-hint"),
      thumbs: el("div", "gl-thumbs")
    };
    gal.buy.addEventListener("click", onBuyPiece);
    gal.frame.addEventListener("click", function () {
      var list = MT.gallery(), i = shownIndex();
      if (ownIn(list[i]) === list[i].n) viewPainting(i);
    });
    pg.appendChild(gal.frame);
    pg.appendChild(gal.cap);
    pg.appendChild(gal.buy);
    pg.appendChild(gal.hint);
    pg.appendChild(gal.thumbs);
    pg.style.display = "none";
    return pg;
  }

  /* A generator seeded on a string: the same pieces, the same order, every
     visit. An LCG and not Math.random, because a cut that changed under the
     player between two visits would be a different puzzle. */
  function rng(str) {
    var st = 7, i;
    for (i = 0; i < str.length; i++) st = (st * 31 + str.charCodeAt(i)) % 4294967296;
    return function () {
      st = (st * 1664525 + 1013904223) % 4294967296;
      return st / 4294967296;
    };
  }

  function f1(v) { return Math.round(v * 10) / 10; }

  /* ONE PAINTING CUT INTO ITS PIECES: an outline per cell, every inner seam
     once, and the order the pieces land in. A tab's side is drawn per EDGE,
     not per piece: the piece on either side of it walks the same curve in
     opposite directions, which is what makes two neighbours fit. */
  function shapeOf(p) {
    if (shapes[p.key]) return shapes[p.key];
    var w = p.wide ? 1600 : 720, h = p.wide ? 900 : 1280;
    var r = rng((W.CONFIG.slug || "game") + ":" + p.key);
    var cw = w / p.cols, ch = h / p.rows, tab = 0.26 * Math.min(cw, ch);
    var hz = [], vt = [], row, c, i;
    for (row = 0; row <= p.rows; row++) {
      hz.push([]);
      for (c = 0; c < p.cols; c++) hz[row].push(r() < 0.5 ? 1 : -1);
    }
    for (row = 0; row < p.rows; row++) {
      vt.push([]);
      for (c = 0; c <= p.cols; c++) vt[row].push(r() < 0.5 ? 1 : -1);
    }
    /* From (ax, ay) to (bx, by), straight on the painting's border (s = 0)
       and with a knob on either side of it inside (s = ±1): a neck, a round
       head wider than the neck, and the same neck back. */
    function edge(ax, ay, bx, by, s) {
      if (!s) return " L" + f1(bx) + " " + f1(by);
      var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy);
      var nx = -dy / len * s * tab, ny = dx / len * s * tab;
      function at(t, n) { return f1(ax + dx * t + nx * n) + " " + f1(ay + dy * t + ny * n); }
      return " L" + at(0.36, 0) +
             " C" + at(0.42, 0) + " " + at(0.30, 1) + " " + at(0.5, 1) +
             " C" + at(0.70, 1) + " " + at(0.58, 0) + " " + at(0.64, 0) +
             " L" + f1(bx) + " " + f1(by);
    }
    var cells = [], seams = "";
    for (row = 0; row < p.rows; row++) {
      for (c = 0; c < p.cols; c++) {
        var x0 = c * cw, y0 = row * ch, x1 = x0 + cw, y1 = y0 + ch;
        cells.push("M" + f1(x0) + " " + f1(y0) +
          edge(x0, y0, x1, y0, row === 0 ? 0 : hz[row][c]) +
          edge(x1, y0, x1, y1, c === p.cols - 1 ? 0 : vt[row][c + 1]) +
          edge(x1, y1, x0, y1, row === p.rows - 1 ? 0 : -hz[row + 1][c]) +
          edge(x0, y1, x0, y0, c === 0 ? 0 : -vt[row][c]) + "Z");
        if (row > 0) seams += "M" + f1(x0) + " " + f1(y0) + edge(x0, y0, x1, y0, hz[row][c]);
        if (c > 0) seams += "M" + f1(x0) + " " + f1(y0) + edge(x0, y0, x0, y1, vt[row][c]);
      }
    }
    var order = [];
    for (i = 0; i < p.n; i++) order.push(i);
    for (i = order.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1)), t = order[i];
      order[i] = order[j]; order[j] = t;
    }
    return (shapes[p.key] = { w: w, h: h, cells: cells, seams: seams, order: order });
  }

  /* The painting as an SVG: the picture (the character on the game's scene,
     where it is one), the seams over it, and a dark piece over every cell
     not owned yet — dark and not black, so the painting shows faintly through
     what is missing. `fresh` is the cell just bought: its piece is drawn
     once more, fading, with a flash on its outline. */
  function paintingSvg(p, owned, fresh) {
    var sh = shapeOf(p), have = {}, i;
    for (i = 0; i < owned; i++) have[sh.order[i]] = true;
    var html = '<svg class="gl-svg" viewBox="0 0 ' + sh.w + " " + sh.h +
      '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<image href="' + (p.groundSrc || p.src) + '" x="0" y="0" width="' + sh.w + '" height="' + sh.h +
      '" preserveAspectRatio="xMidYMid slice"/>';
    /* the character in front of the scene, its VISIBLE body centred on
       the painting both ways (`charPlace`) */
    if (p.groundSrc) {
      var cp = charPlace(p.src, sh.w, sh.h);
      if (cp) {
        html += '<image href="' + p.src + '" x="' + f1(cp.x) + '" y="' + f1(cp.y) +
          '" width="' + f1(cp.w) + '" height="' + f1(cp.h) + '" preserveAspectRatio="none"/>';
      }
    }
    html += '<path class="gl-seam" d="' + sh.seams + '"/>';
    for (i = 0; i < p.n; i++) {
      if (have[i] && i !== fresh) continue;
      html += '<path class="gl-hole' + (i === fresh ? " go" : "") + '" d="' + sh.cells[i] + '"/>';
    }
    if (fresh >= 0) html += '<path class="gl-flash" d="' + sh.cells[fresh] + '"/>';
    return html + "</svg>";
  }

  /* How many pieces of painting `p` are owned: the count fills the paintings
     in order (meta.js), so it is the share of that count past `p.first`. */
  function ownIn(p) { return Math.max(0, Math.min(p.n, MT.pieces() - p.first)); }

  /* The painting being filled — the last one once they all are. */
  function galCurrent() {
    var list = MT.gallery(), owned = MT.pieces(), i;
    for (i = 0; i < list.length; i++) if (owned < list[i].first + list[i].n) return i;
    return list.length - 1;
  }

  function shownIndex() {
    var cur = galCurrent();
    return galSel < 0 || galSel > cur ? cur : galSel;
  }

  function paintGallery() {
    if (!gal) return;
    var list = MT.gallery(), cur = galCurrent(), sel = shownIndex();
    var p = list[sel], have = ownIn(p), now = Date.now(), i;
    var fresh = -1;
    if (now - galNewAt < GAL_NEW_MS && galNew >= p.first && galNew < p.first + p.n) {
      fresh = shapeOf(p).order[galNew - p.first];
    }
    gal.frame.className = "gl-frame" + (p.wide ? " wide" : "") + (have === p.n ? " full" : "") +
      (galDone === sel && now - galDoneAt < GAL_DONE_MS ? " done" : "");
    gal.frame.innerHTML = paintingSvg(p, have, fresh);
    gal.frame.setAttribute("aria-label", fill(T.galName, { n: sel + 1 }));
    gal.cap.textContent = fill(T.galPaint, { n: sel + 1, t: list.length }) + " · " + have + "/" + p.n;

    /* The price, or the line that says there is nothing left to buy. */
    var price = MT.piecePrice();
    if (!price) {
      gal.buy.style.display = "none";
      gal.hint.textContent = T.galFull;
      gal.hint.style.display = "";
    } else {
      gal.buy.style.display = "";
      gal.buy.disabled = MT.coins() < price;
      gal.buy.innerHTML = "<span>" + T.buyPiece + '</span><span class="btn-badge">' +
        icon("coin") + num(price) + "</span>";
      var ahead = MT.pieceAhead() > 1.5;
      gal.hint.textContent = ahead ? T.galAhead : "";
      gal.hint.style.display = ahead ? "" : "none";
    }

    /* EVERY PAINTING, small: done ones ticked, the one on show lit, the
       ones not reached yet under their pieces and a padlock. A tap shows a
       painting already reached in the frame above. */
    gal.thumbs.innerHTML = "";
    for (i = 0; i < list.length; i++) {
      var q = list[i], h = ownIn(q), locked = i > cur;
      var b = el("button", "gl-th" + (q.wide ? " wide" : "") + (i === sel ? " on" : "") +
        (locked ? " locked" : "") + (h === q.n ? " full" : ""),
        paintingSvg(q, locked ? 0 : h, -1) +
        (locked ? '<i class="gl-mk">' + icon("lock", "gl-mki") + "</i>" : "") +
        (h === q.n ? '<i class="gl-mk ok">' + icon("check", "gl-mki") + "</i>" : ""));
      b.setAttribute("aria-label", fill(T.galName, { n: i + 1 }));
      b.setAttribute("aria-pressed", i === sel ? "true" : "false");
      b.disabled = locked;
      b.addEventListener("click", (function (n) {
        return function () {
          if (n === shownIndex()) return;
          galSel = n;
          W.Sound.ui("tick", 0.4);
          paintGallery();
        };
      })(i));
      gal.thumbs.appendChild(b);
    }

    var owned = MT.pieces(), total = MT.piecesTotal();
    paintStock(alStock, [
      { tone: "puzzle", pic: "puzzle", n: owned, fig: owned + "/" + total, label: T.galleryTab }
    ]);
  }

  /* One piece. The price leaves the coin chip like every purchase of this
     layer (`spendFx`), the frame turns to the painting it landed in, and the
     piece fades in where it belongs. The one that completes a painting
     shines it and sounds the reward. */
  function onBuyPiece() {
    var before = MT.coins(), cur = galCurrent();
    if (!MT.buyPiece()) return;
    galNew = MT.pieces() - 1; galNewAt = Date.now();
    galSel = cur;
    var p = MT.gallery()[cur], done = ownIn(p) === p.n;
    if (done) { galDone = cur; galDoneAt = Date.now(); }
    MT.spendFx(before, MT.coins());
    W.Sound.ui(done ? "reward" : "buy", done ? 0.8 : 0.7);
    paintGallery();
  }

  /* A FINISHED PAINTING, AT FULL SIZE, with nothing over it: the reward for
     the pieces is to look at it. Put away by a tap anywhere. */
  function viewPainting(i) {
    var p = MT.gallery()[i];
    MD.open({
      kind: "gl-view" + (p.wide ? " wide" : ""), dismiss: true,
      eyebrow: T.galleryTitle, title: fill(T.galName, { n: i + 1 }),
      fill: function (body) {
        body.appendChild(el("div", "gl-big" + (p.wide ? " wide" : ""), paintingSvg(p, p.n, -1)));
      }
    });
  }

  /* ── 6. the shop ──────────────────────────────────────────────────────── */

  var shop, shopBody, shopBuilt = false, SH = null, shStock = null;

  function buildShop() {
    if (shopBuilt) return;
    shopBuilt = true;
    /* The same sheet as the album's, and the shop's name is its title. */
    /* THE TICKET CHIP IS THE DOOR BACK TO THE COLLECTION, and it is in the
       band over this screen rather than in this header (packages/webshell/
       view.js). The rule the band reads is the one that was written here: a
       chip's door is the OTHER screen, so on the shop the coin chip has
       nowhere to go — its door is the screen it is standing on — and only the
       blue one opens, onto the album, which is where a ticket is spent. */
    shopBody = el("div"); shopBody.id = "sh-body";
    SH = VW.sheet({ id: "sh-screen", body: shopBody });
    shop = SH.box;
    SH.setHead(T.shop, "");
    shStock = el("div", "sh-stock");
    SH.head.appendChild(shStock);
  }

  /* WHAT THE PLAYER ALREADY HOLDS, under the title of the shop and of the
     album. The band counts the coins and the collection and nothing else, so
     the tickets, the super tickets and the rounds left on a boost are counted
     on the two screens they are bought and spent on — in the HEADER, which
     does not scroll, so the figure stays in sight while the shelf below is
     read. A pill at zero is dimmed rather than dropped: the row keeps its
     shape, and an empty pocket is still a figure. A pill whose figure moved
     since it was last painted takes the band's own punch (`mt-hit`), since
     what was bought flies into the band and this is where it is counted. */
  function paintStock(node, list) {
    if (!node) return;
    /* Built once and then written in place: the shop repaints its whole body
       two or three times per purchase (the spend, the gain, the tap), and a
       pill rebuilt on each of them would lose the punch the first one gave. */
    if (node.children.length !== list.length) {
      node.innerHTML = "";
      for (var k = 0; k < list.length; k++) {
        node.appendChild(el("span", "sh-sp " + list[k].tone,
          '<span class="sh-spi">' + icon(list[k].pic, "mt-ci") +
          (list[k].mul ? "<i>" + list[k].mul + "</i>" : "") + "</span><b></b>"));
      }
    }
    for (var i = 0; i < list.length; i++) {
      var o = list[i], p = node.children[i], fig = o.fig != null ? o.fig : num(o.n);
      var b = p.querySelector("b");
      p.classList.toggle("zero", !o.n);
      p.setAttribute("role", "img");
      p.setAttribute("aria-label", o.label + " " + o.n);
      if (b.textContent === fig) continue;
      if (b.textContent !== "") {
        p.classList.remove("mt-hit");
        void p.offsetWidth;                   // restart the animation
        p.classList.add("mt-hit");
      }
      b.textContent = fig;
    }
  }

  /* ONE TILE, the shape every product of the grid is sold in: the piece on
     its own light, the name, what the player already holds of it, and the
     price at the foot. NO SENTENCE: the shelf is read by its pieces, names
     and prices, and what a product does is read on its card (`product`),
     where it is set large enough to be read at all. Two columns of these and not a column of
     rows — a shelf of six is read across as well as down, and a tile the
     height of its piece has no hole in it. The tone is the piece's own
     colour (the ticket's blue, the super's gold, the xp's green…), so the
     light under it says what kind of thing it is before the name does.

     The price is the button, and a dead button is the whole of "not enough
     coins": the wallet is one row above it (see the ticket's note below). */
  function tile(o) {
    var t = el("section", "sh-tile " + o.tone);
    t.appendChild(piece(o));
    t.appendChild(el("h3", "sh-h", o.title));
    var b = buyButton(o, null);
    if (b.disabled) t.classList.add("off");
    t.appendChild(b);
    /* THE REST OF THE TILE IS A DOOR to the product at full size, which is
       the one place its sentence is written. The price keeps its own tap. */
    t.setAttribute("role", "button");
    t.setAttribute("tabindex", "0");
    t.setAttribute("aria-label", o.title);
    t.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("button")) return;
      product(o);
    });
    t.addEventListener("keydown", function (e) {
      if (e.target === t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); product(o); }
    });
    return t;
  }

  /* The piece on its light, its tag, and what the player holds of it — which
     rides on the piece, so a tile is the same height whether it has a count
     or not. */
  function piece(o) {
    var pic = el("div", "sh-pic", '<span class="sh-glow"></span>' + o.pic);
    if (o.tag) pic.appendChild(el("b", "sh-tag", o.tag));
    if (o.own) pic.appendChild(el("b", "sh-own", o.own));
    return pic;
  }

  /* The price, and the purchase behind it. `h` is the product card it sits
     on, if any: that card goes as the coins leave, so what the purchase
     opens or throws lands on the shop and its band. */
  function buyButton(o, h) {
    var b = el("button", "btn btn-buy btn-sm btn-wide sh-buy",
      "<span>" + T.buy + '</span><span class="btn-badge">' + icon("coin") + num(o.price) + "</span>");
    b.disabled = MT.coins() < o.price;
    b.addEventListener("click", function () {
      /* THE RECT IS TAKEN BEFORE THE TRANSACTION. Paying moves the wallet,
         every wallet repaints its screen (`MT.onChange` below) and this very
         button is one of the nodes that repaint replaces — a detached node
         measures zero, and the piece would be thrown from the frame's top
         left corner instead of from under the finger. */
      var from = b.getBoundingClientRect(), before = MT.coins();
      if (!MT.spend(o.price)) return;
      if (h) h.close();
      o.buy(from, before);
      paintShop();
      if (built) paintMachine();
    });
    return b;
  }

  /* ONE PRODUCT AT FULL SIZE: the piece, the name, the sentence the tile
     leaves out, and the same price. Put away by a tap anywhere but the price. */
  function product(o) {
    MD.open({
      kind: "sh-product " + o.tone, dismiss: true,
      eyebrow: T.shop, title: o.title,
      fill: function (body, close, h) {
        body.appendChild(piece(o));
        body.appendChild(el("p", "sh-note", o.note));
        var b = buyButton(o, h);
        b.classList.remove("btn-sm");         // the card's one control, at full size
        body.appendChild(b);
      }
    });
  }

  function roundsLeft(n) {
    return n > 1 ? fill(T.activeN, { n: n }) : T.active1;
  }

  function paintShop() {
    shopBody.innerHTML = "";
    var DL = window.__DAILY__;
    var held = MT.boosts();
    paintStock(shStock, [
      { tone: "ticket", pic: "ticket", n: MT.tickets(), label: T.buyTitle },
      { tone: "super", pic: "ticketSuper", n: MT.supers(), label: T.superTitle },
      { tone: "coins", pic: "coin", mul: "×2", n: held.coins, label: T.coinBoostTitle },
      { tone: "xp", pic: "xp", mul: "×2", n: held.xp, label: T.xpBoostTitle }
    ]);

    /* 0. A MISSED DAY, while it can still be caught up — the one thing on this
       screen that goes away on its own, so it is the first thing on it. Full
       width because it is not a product of the shelf: it is a day of the road,
       with its own face and its own name. No missed day, no card. */
    var miss = DL && DL.active() && DL.lastMissed ? DL.lastMissed() : 0;
    if (miss) {
      var cPrice = DL.catchUpPrice(miss);
      var cBox = el("section", "sh-card sh-catch");
      cBox.appendChild(el("div", "sh-pic", '<span class="sh-glow"></span>' + DL.face(miss)));
      var cCol = el("div", "sh-body");
      cCol.appendChild(el("h3", "sh-h", DL.text("catchTitle")));
      cCol.appendChild(el("p", "sh-note", DL.dayLabel(miss) + " · " + DL.kindWord(miss)));
      var cb = el("button", "btn btn-buy btn-sm sh-buy",
        "<span>" + DL.text("catchUp") + '</span><span class="btn-badge">' + icon("coin") + num(cPrice) + "</span>");
      cb.disabled = MT.coins() < cPrice;
      cb.addEventListener("click", function () {
        /* The road pays it the way it pays today — the prize card, or the
           three boxes on a gift day — over this screen, whose band is where
           the reward lands. */
        if (DL.recover(miss)) paintShop();
      });
      cCol.appendChild(cb);
      cBox.appendChild(cCol);
      shopBody.appendChild(cBox);
    }

    var grid = el("div", "sh-grid");

    /* 1. THE TICKET, AND THE TICKET IS THE SUBJECT: the first tile, the one
       the coins were always for. The sentence is turned right down: someone
       who has been here twice is not reading it again, and it must not
       compete with what they came for.

       There is NO "not enough coins" line — the price is on the button, the
       wallet is one row above it, and a card that tells the player off for
       being poor says nothing the two numbers do not. The dead button is the
       whole message. */
    grid.appendChild(tile({
      tone: "ticket", pic: icon("ticket", "sh-i"),
      title: T.buyTitle, note: T.buyNote, price: MT.ticketPrice(),
      buy: function (from) {
        MT.addTickets(1);
        MT.buyFx({ cost: MT.ticketPrice(), kind: "ticket", n: 1, from: from });
        W.Sound.ui("buy", 0.7);
      }
    }));

    /* 1b. THE SUPER TICKET, the same tile with the one number that matters
       changed. Fifteen ordinary tickets' worth of coins for one pull, and a
       legendary about one time in three — a price nobody reaches by accident,
       for the one thing in this shop a player can want after they own most of
       the board. Beside the ticket on purpose: two tiles that differ only in
       their piece, their price and their sentence are compared at a glance.

       HOW MANY YOU OWN is counted in this screen's header and the album's
       (`paintStock`), where it is bought and where it is spent — the band has
       no figure for any ticket. */
    grid.appendChild(tile({
      tone: "super", pic: icon("ticketSuper", "sh-i"),
      title: T.superTitle, note: T.superNote, price: MT.superPrice(),
      own: MT.supers() > 0 ? fill(T.superOwn, { n: MT.supers() }) : "",
      buy: function (from) {
        MT.addSupers(1);
        /* The same flight as the ticket's: into the collection's chip of the
           band, which is where every ticket lands and writes its figure. */
        MT.buyFx({ cost: MT.superPrice(), kind: "super", n: 1, from: from });
        W.Sound.ui("buy", 0.8, 1.1);
      }
    }));

    /* 2. THE MYSTERY GIFT — the three-box ceremony, bought. The boxes hold
       tickets, xp or a sticker and never coins (`MT.mysteryReward`), and the
       ad that multiplies a gift is not offered on one: the price is what was
       paid for it. The card opens over this screen, so what it pays flies
       into the band above. */
    var art = W.CONFIG.shellArt || {};
    grid.appendChild(tile({
      tone: "gift",
      pic: art.giftClose02 ? '<img class="sh-i art-i" alt="" src="' + art.giftClose02 + '">' : icon("gift", "sh-i"),
      tag: "?", title: T.giftTitle, note: T.giftNote, price: MT.giftPrice(),
      buy: function (from, before) {
        MT.spendFx(before, MT.coins());
        W.Sound.ui("buy", 0.75);
        setTimeout(function () {
          MT.gift({ roll: MT.mysteryReward, boost: false,
                    eyebrow: T.giftTitle, gotEyebrow: T.giftTitle });
        }, 260);
      }
    }));

    /* 3. THE XP PACK — a fixed amount, at a price that follows the level
       (meta.js, section 1). The bar in the band runs on the spot, and a level
       crossed is handed over here with its card, since this is where it was
       bought — the village has nothing left to announce. */
    var pack = MT.xpPack();
    grid.appendChild(tile({
      tone: "xp", pic: icon("xp", "sh-i"), tag: "+" + num(pack),
      title: T.xpTitle, note: fill(T.xpNote, { n: num(pack) }), price: MT.xpPrice(),
      buy: function (from, before) {
        var x0 = MT.xp(), levels = MT.addXp(pack);
        MT.spendFx(before, MT.coins());
        W.Sound.ui("buy", 0.7);
        setTimeout(function () {
          MT.fx({ kind: "xp", n: pack, from: from, before: x0, big: true, spread: 75,
                  done: function () { if (levels) setTimeout(function () { MT.levelUp(levels); }, 700); } });
        }, 170);
      }
    }));

    /* 4. THE BOOSTS, counted in rounds and never in minutes. What is left of
       one is written on its tile, because that is the only place it is read
       before the round spends it. */
    var bo = MT.boosts(), bPrice = MT.boostPrice();
    grid.appendChild(tile({
      tone: "coins", pic: icon("coin", "sh-i"), tag: "×2",
      title: T.coinBoostTitle, note: T.coinBoostNote, price: bPrice,
      own: bo.coins ? roundsLeft(bo.coins) : "",
      buy: function (from, before) {
        MT.addBoost("coins");
        MT.spendFx(before, MT.coins());
        W.Sound.ui("buy", 0.75);
      }
    }));
    grid.appendChild(tile({
      tone: "xp", pic: icon("xp", "sh-i"), tag: "×2",
      title: T.xpBoostTitle, note: fill(T.xpBoostNote, { n: MT.boostXpRounds() }), price: bPrice,
      own: bo.xp ? roundsLeft(bo.xp) : "",
      buy: function (from, before) {
        MT.addBoost("xp");
        MT.spendFx(before, MT.coins());
        W.Sound.ui("buy", 0.75);
      }
    }));

    shopBody.appendChild(grid);
    /* 5. the doubles, AS ONE BUTTON: the stickers it sells are drawn in it,
       each with its count, then the word and what it pays. The button is
       the whole trade — a player with eleven doubles is not going to tap
       eleven times — and a card with a heading around it was the height
       that pushed the sale under the fold.

       A PLAYER WITH NO DOUBLES GETS NO BUTTON. An empty frame explaining its
       own emptiness is a second product on a screen that sells one, and it
       is the first thing a new player sees here — the shop should look like
       a shop with one thing in it, not like a shop that is broken. */
    var list = MT.dupes();
    if (list.length) {
      var total = 0, copies = 0, i, pics = "";
      for (i = 0; i < list.length; i++) {
        var n = list[i], extra = MT.count(n) - 1;
        total += MT.sellPrice(n) * extra;
        copies += extra;
        if (i < SELL_SHOWN) pics += '<img class="sh-dup" src="' + MT.art(n) + '" alt="">';
      }
      var word = up(fill(copies === 1 ? T.sell1 : T.sellN, { n: copies }));
      var all = el("button", "btn btn-buy btn-wide sh-sell",
        '<span class="sh-dupes">' + pics + "</span><span>" + word +
        '</span><span class="btn-badge">' + icon("coin") + num(total) + "</span>");
      all.setAttribute("aria-label", word);
      all.addEventListener("click", function () {
        /* THE COINS ARE WATCHED INTO THE WALLET, not announced in a pill. A
           shelf of doubles becoming money is a TRANSFER — the same shape as a
           score becoming coins on the end screen — so it is the cascade, out
           of the button that was tapped and into the chip that counts them.
           The rect and the figure are both taken BEFORE the sale: selling
           moves the wallet, every wallet repaints this screen, and this very
           button is one of the nodes that repaint replaces. */
        var from = all.getBoundingClientRect(), before = MT.coins();
        var got = MT.sellAll();
        if (got) {
          MT.fx({ kind: "coins", n: got, from: from, before: before, burst: true });
          W.Sound.ui("gain", 0.7);
        }
        paintShop();
        if (built) paintShelves();
      });
      shopBody.appendChild(all);
    }
  }
  var SELL_SHOWN = 4;                       // stickers fanned in the sale button

  /* ── 7. open / close ──────────────────────────────────────────────────── */

  /* THE ALBUM AND THE SHOP ARE TWO LAYERS OVER THE MAP and the wallet's chips
     are doors BOTH WAYS between them, so whichever one is being opened has to
     come to the top. They carry the same z-index — they are the same kind of
     screen — which leaves DOM order to decide, and DOM order is the order they
     were first BUILT in: an album built before a shop is an album that can
     never be reopened from it. The click landed, the screen turned on, and it
     turned on underneath.

     Re-appending is what fixes it rather than a z-index each, because BACK
     peels one layer off and expects to find whatever was under it — a stack
     that only ever grows at the end is a stack that needs no bookkeeping. */
  /* WHAT THE VIEW SYSTEM CALLS. The re-append that used to be written out here
     twice — with the paragraph above explaining why DOM order decided which of
     two equal z-indexes won — is the view system's, and it does it for every
     screen rather than for these two (packages/webshell/view.js). */
  function showAlbum() {
    galSel = -1;                      // the gallery opens on the painting being filled
    paintPage();
    MT.markSeen();
  }

  function hideAlbum() {
    Machine.sleep();                  // a machine nobody is looking at draws nothing
  }

  /* One repaint for the two screens whenever the wallet moves under them —
     a ticket bought in the shop has to grey the machine's button in, and a
     sticker earned on the end screen has to fill its tile. */
  MT.onChange(function () {
    if (VW.isOpen("sticker")) paintPage();
    if (VW.isOpen("shop")) paintShop();
  });

  /* ── 8. the module ────────────────────────────────────────────────────── */

  window.__ALBUM__ = {
    active: function () { return true; },

    mount: function (api) {
      API = api;
      if (api.lang) setLang(api.lang);
      /* TWO VIEWS, declared here and stacked by the view system. They are the
         pair that taught this shell it needed one: the album's tickets open
         the shop and the shop's coins open the album, so either can be under
         the other, and the answer used to be whichever had been BUILT first. */
      var decor = { count: 2, spots: ["l", "r"], size: 130, opacity: 0.3, front: 0 };
      VW.define("sticker", {
        build: build,
        node: function () { return box; },
        show: showAlbum, hide: hideAlbum, hud: true, decor: decor
      });
      VW.define("shop", {
        build: buildShop,
        node: function () { return shop; },
        show: paintShop, hud: true, decor: decor
      });
      /* The machine's two reveals, for the DEV view (packages/webshell/dev.js):
         a sticker given for real, one the album lacks or one it already has. */
      if (W.Dev) {
        var pickSticker = function (had) {
          var out = [], i;
          for (i = 0; i < MT.total(); i++) if (!!MT.count(i) === had) out.push(i);
          return out.length ? out[Math.floor(Math.random() * out.length)] : -1;
        };
        W.Dev.entry({ group: "Shell", label: "Sticker draw, new", sub: "The machine's reveal of a sticker the album lacks",
          run: function () {
            var n = pickSticker(false);
            if (n < 0) { W.Notify.say("The album is full", { kind: "warn" }); return; }
            MT.give(n); MT.bumpUnseen(); reveal(n, true);
          } });
        W.Dev.entry({ group: "Shell", label: "Gallery, five pieces", sub: "Five puzzle pieces of the gallery, for nothing",
          run: function () { MT.addPieces(5); VW.go("sticker"); } });
        W.Dev.entry({ group: "Shell", label: "Sticker draw, double", sub: "The machine's reveal of a sticker already owned",
          run: function () {
            var n = pickSticker(true);
            if (n < 0) { W.Notify.say("No sticker owned yet", { kind: "warn" }); return; }
            MT.give(n); reveal(n, false);
          } });
      }
    },

    setLang: setLang,
    open: function () { VW.go("sticker"); },
    close: function () { if (VW.isOpen("sticker")) VW.back(); },
    isOpen: function () { return VW.isOpen("sticker"); },
    openShop: function () { VW.go("shop"); },
    closeShop: function () { if (VW.isOpen("shop")) VW.back(); },
    isShopOpen: function () { return VW.isOpen("shop"); },
    text: function (k) { return T[k]; }
  };

  function setLang(code) {
    LANG = STRINGS[code] ? code : "en";
    T = STRINGS[LANG];
    if (built) {
      ctl.querySelector(".al-lbl").textContent = T.perDraw;
      paintPage();
    }
    if (shopBuilt) {
      SH.setHead(T.shop, "");
      paintShop();
    }
  }
})();
