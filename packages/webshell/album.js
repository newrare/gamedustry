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
    THE MACHINE      down the LEFT of the album, where the thing it fills is,
                     with the bet and the odds in the column beside it and the
                     twenty tiles under both — one screen, and it does not
                     scroll. A REAL gumball machine on a canvas: sixteen
                     spheres under gravity in a glass globe, sloshed by the
                     globe itself and then one of them dropped down the chute
                     into the tray (section 3). A gumball machine and not a
                     slot reel — the player is not betting, they are
                     collecting. One pull eats ONE TO FIVE tickets and the
                     odds move with the bet, shown before they are rolled.
    THE SHOP         a ticket against coins, and doubles against coins. Those
                     are the only two trades, and they are the two ends of the
                     same loop — the machine pays doubles, the shop turns them
                     back into draws.

  WHAT THE SHOP IS NOT: there is no money in it, and there is no bundle, no
  timer and no offer. It is the sink the coins a round pays need in order to
  mean anything, and nothing else. Real-money purchases would be a different
  conversation and a different file (docs/INDUSTRIALIZATION.md).

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
      draw: "Draw", drawCost: "1 ticket", noTicket: "No ticket",
      mixing: "Mixing…",
      perDraw: "Tickets per draw", chances: "Chances",
      newSticker: "New sticker!", dupe: "Already owned",
      sell: "Sell",
      again: "Draw again",
      buyTitle: "Ticket", buyNote: "One draw at the sticker machine.",
      superTitle: "Super ticket",
      superNote: "One draw, and a legendary about one time in three.",
      superOwn: "You have {n}",
      sellTitle: "Your doubles", sellAll: "Sell all",
      fromMap: "Reward earned", fromMachine: "Won from a draw",
      toMap: "A reward to earn", toMachine: "Will come from a draw",
      unknown: "???"
    },
    fr: {
      album: "Stickers", shop: "Boutique",
      draw: "Tirer", drawCost: "1 ticket", noTicket: "Aucun ticket",
      mixing: "Ça mélange…",
      perDraw: "Tickets par tirage", chances: "Chances",
      newSticker: "Nouveau sticker !", dupe: "Déjà obtenu",
      sell: "Vendre",
      again: "Tirer encore",
      buyTitle: "Ticket", buyNote: "Un tirage à la machine à stickers.",
      superTitle: "Super ticket",
      superNote: "Un tirage, et un légendaire environ une fois sur trois.",
      superOwn: "Tu en as {n}",
      sellTitle: "Tes doublons", sellAll: "Tout vendre",
      fromMap: "Récompense gagnée", fromMachine: "Obtenu par tirage",
      toMap: "Une récompense à gagner", toMachine: "S’obtiendra par tirage",
      unknown: "???"
    }
  };

  /* Which of them the screen SHOUTS. Every string above is written in normal
     case, like the rest of the repo; the ones listed here are set in capitals
     by the motor's `upper` (packages/engine), which also takes the accents
     off — a capital carries none in this house. */
  var up = W.upper;
  var CAPS = ["album", "shop", "draw", "drawCost", "noTicket", "mixing",
    "perDraw", "chances", "newSticker", "dupe", "sell",
    "again", "buyTitle", "superTitle",
    "sellTitle", "sellAll", "fromMap", "fromMachine",
    "toMap", "toMachine"
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

  var box, scroll, grid, machine, drawBtn, ctl, betRow, oddsBox;
  var built = false, drawing = false;
  /* How many tickets the next pull eats. It is the player's standing choice,
     not a per-draw question, so it survives a reveal and a trip to the shop —
     only a wallet that can no longer pay for it moves it. */
  var bet = 1;

  function build() {
    if (built) return;
    built = true;

    box = el("div"); box.id = "al-screen";

    var bg = el("div"); bg.id = "al-bg";
    dressBackdrop(bg);
    box.appendChild(bg);

    /* NO HEADER AT ALL. It carried the way back, then only a name and a count,
       and both of those went the same way the wallet did: the name is what the
       player tapped to get here, and the COUNT is what they own — which is the
       band's subject, not a title's (packages/webshell/view.js, section 5). So
       `x / 20` is the band's first chip, on every screen rather than on this
       one, and the height a header was taking goes to the machine, the odds
       and the twenty tiles. */
    /* THE WALLET IS NOT IN THIS HEADER ANY MORE. It is the band the view
       system puts over every screen that carries one (packages/webshell/
       view.js, section 5), and its chips are still the doors they were here:
       there is no GET TICKETS button under the machine, because a button that
       only exists once the wallet is empty teaches nothing before it is — the
       number the player is short of is the thing to tap. */

    /* ONE SCREEN AND NO SCROLL: the machine on the left, what it costs and
       what it pays on the right, the twenty tiles under both. A collection the
       player has to scroll to see is a collection they see half of, and the
       machine standing over it is what the whole screen is for. */
    scroll = el("div"); scroll.id = "al-scroll";
    var top = el("div"); top.id = "al-top";
    top.appendChild(buildMachine());
    top.appendChild(buildControls());
    scroll.appendChild(top);
    grid = el("div"); grid.id = "al-grid";
    scroll.appendChild(grid);
    box.appendChild(scroll);

    frame().appendChild(box);
  }

  /* THE HUB'S OWN GROUND FIRST, where the game has a village: these two
     screens are ROOMS OF THAT PLACE — the collection is a door on the hub and
     the shop is the till inside it — so they stand on the picture the player
     just walked off, not on the backdrop the ROUND is played against. A game
     with no village falls back to what this always did: the same backdrop the
     map and the menu are dressed with, in the same order, so nothing of its
     look changes on the way in.

     `window.__VILLAGE__` is read here rather than captured at load: village.js
     is the last file of the web layer, and this runs on the first open of a
     screen, long after all of it. */
  function dressBackdrop(bg) {
    var VG = window.__VILLAGE__;
    var hub = VG && VG.ground ? VG.ground() : null;
    if (hub) { bg.style.backgroundImage = "url(" + hub + ")"; return; }
    var art = W.Art ? W.Art.src(W.Art.sceneKey()) : null;
    if (art) { bg.style.backgroundImage = "url(" + art + ")"; return; }
    var images = (W.ASSETS && W.ASSETS.images) || {};
    var src = images.bg || images.bg1 || null;
    if (src) { bg.style.backgroundImage = "url(" + src + ")"; return; }
    var cs = window.getComputedStyle(document.body);
    if (cs.backgroundImage && cs.backgroundImage !== "none") bg.style.backgroundImage = cs.backgroundImage;
    bg.style.backgroundColor = cs.backgroundColor;
    bg.className = "flat";
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
  /* The machine is drawn at its own size and SHOWN at four fifths of it: the
     album gives it the left column and keeps the right one for what it costs,
     so the geometry below stays the geometry it was tuned with in
     `lab/gacha.html` and only the transform out of it changes. */
  var SCALE = 0.8;
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

  /* THE OTHER HALF OF THE MACHINE: how many tickets this pull eats, and what
     that buys. The odds are drawn from `MT.odds(bet)` — the same weights the
     roll uses — so raising the bet moves the bars the player is looking at and
     not a promise written beside them. Every pill is selectable even when the
     wallet cannot pay for it: a player who can never SEE what five tickets
     would do has no reason to save for five. */
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
      b = el("button", "al-bet", String(i));
      b.setAttribute("data-b", i);
      betRow.appendChild(b);
    }
    b = el("button", "al-bet sup", icon("ticketSuper", "al-supi") + '<i></i>');
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
          W.Sound.cue("uiRow", 0.4, 1 + step * 0.06, 420 + step * 60, 0.05);
          paintMachine();
        };
      })(+pills[i].getAttribute("data-b")));
    }
    ctl.appendChild(betRow);

    ctl.appendChild(el("div", "al-lbl sub", T.chances));
    oddsBox = el("div", "al-odds");
    ctl.appendChild(oddsBox);

    drawBtn = el("button", "al-draw");
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
      pills[i].className = "al-bet" + (s ? " sup" : "") + (n === bet ? " on" : "") +
                           (lacks ? " short" : "");
      pills[i].disabled = drawing;
      /* The count rides ON the pill because the wallet has no chip for it: a
         player who bought one has to see it somewhere, and this is the only
         screen it can be spent from. Blank at zero rather than "0" — an empty
         pocket is the shop's message, not a counter's. */
      if (s) pills[i].querySelector("i").textContent = supers > 0 ? supers : "";
    }

    var o = MT.odds(bet), html = "";
    for (i = 0; i < o.length; i++) {
      var pc = Math.round(o[i] * 100);
      html += '<div class="al-odd r' + i + (o[i] ? "" : " nil") + '">' +
        '<span class="n">' + MT.text("rarity" + (i + 1)) + "</span>" +
        '<span class="bar"><i style="width:' + (o[i] ? Math.max(1.5, o[i] * 100).toFixed(1) : 0) + '%"></i></span>' +
        '<span class="p">' + (pc < 1 && o[i] > 0 ? "<1%" : pc + "%") + "</span></div>";
    }
    oddsBox.innerHTML = html;

    drawBtn.disabled = drawing || !ok;
    drawBtn.className = "al-draw" + (ok ? "" : " off") + (isSuper ? " sup" : "");
    drawBtn.innerHTML = '<span class="w">' + (drawing ? T.mixing : T.draw) + '</span>' +
      '<span class="c">' + icon(isSuper ? "ticketSuper" : "ticket", "mt-ci") +
      (drawing || isSuper ? "" : bet) + '</span>';
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
    W.Sound.cue("uiRow", 0.5, 0.9, 380, 0.07);

    setTimeout(function () {
      var done = false;
      function landed() {
        if (done) return;
        done = true;
        W.Sound.cue("uiScore", 0.7, 0.85, 520, 0.12);
        var isNew = MT.give(n);
        if (isNew) MT.bumpUnseen();
        drawing = false;
        paintMachine();
        paintGrid();
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
    var h = MD.open({ kind: "sticker " + (isNew ? "fresh" : "seen"), dismiss: false, esc: false });
    var modal = h.box, card = h.card;
    card.appendChild(fx(isNew));
    card.appendChild(el("div", "al-tag " + (isNew ? "new" : "old"),
      isNew ? '<b>' + T.newSticker + "</b>" : T.dupe));
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
      var ok = el("button", "mt-btn gold al-again",
        "<span>" + T.again + "</span>" +
        '<span class="c">' + icon("ticket", "mt-ci") + num(bet) + "</span>");
      ok.addEventListener("click", function () {
        shut();
        setTimeout(onDraw, 260);
      });
      acts.appendChild(ok);
      card.appendChild(acts);
    }
    W.Sound.cue("uiStar", 0.85, isNew ? 1.5 : 1.05, isNew ? 1180 : 720, 0.18, "triangle");
    /* No Confetti here, for the reason meta.js gives on its own gift card: the
       motor's burst draws on the END SCREEN's canvas, which is not over this
       one. The sunburst and the shockwave are the celebration. */
    if (isNew) W.Sound.cue("uiScore", 0.6, 1.6, 1480, 0.22, "triangle");

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

  /* ── 5. the grid ──────────────────────────────────────────────────────── */

  /* READING ORDER IS RANK ORDER, commons first and the legendaries last, and
     within a rank the sheet's own order. It is worked out once: the album is a
     shape the player learns and then fills, so a tile may not move because
     something was drawn — only because the rank ladder says where it belongs.

     Up the ladder rather than down it, because the four odds bars standing
     directly over the grid are written the same way round, and the last row
     being the one worth drawing for is the better page to end on. */
  var ORDER = (function () {
    var out = [], i;
    for (i = 1; i <= MT.total(); i++) out.push(i);
    out.sort(function (a, b) { return (MT.rarityOf(a) - MT.rarityOf(b)) || (a - b); });
    return out;
  })();

  function paintGrid() {
    var total = MT.total(), owned = MT.owned(), i, html = "";
    for (var k = 0; k < ORDER.length; k++) {
      i = ORDER[k];
      var c = MT.count(i);
      var cls = "al-tile r" + MT.rarityOf(i) + (c ? " have" : " ghost") +
        (MT.shiny(i) && c ? " shiny" : "");
      html += '<button class="' + cls + '" data-n="' + i + '">' +
        '<span class="pic"><img src="' + MT.art(i) + '" alt=""></span>' +
        '<span class="nm">' + (c ? MT.name(i) : "???") + "</span>" +
        (c > 1 ? '<i class="dup">x' + c + "</i>" : "") +
        "</button>";
    }
    grid.innerHTML = html;
    var nodes = grid.querySelectorAll(".al-tile");
    for (i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener("click", (function (node) {
        return function () { detail(+node.getAttribute("data-n")); };
      })(nodes[i]));
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
    var h = MD.open({ kind: "sticker detail r" + rar, dismiss: true });
    var card = h.card;
    /* HOW MANY, in the corner and as a number alone. "OWNED x3" spelled out
       under the picture read as a caption and pushed the card taller; a chip
       on the frame is what a count is everywhere else in this layer. */
    if (have) card.appendChild(el("i", "al-own", "x" + have));
    /* NOT YET IS NOT A TITLE. A card whose picture is already a silhouette does
       not need a sentence at the top saying so: the three marks ARE the name it
       does not have, they are what the tile under it reads, and the line under
       the picture is where "how do I get it" is answered. */
    card.appendChild(el("h3", "mt-h", have ? MT.name(n) : T.unknown));
    card.appendChild(el("div", "mt-rw" + (have ? (MT.shiny(n) ? " shiny" : "") : " ghost"),
      '<img class="mt-rw-img" src="' + MT.art(n) + '" alt="">'));
    card.appendChild(el("div", "mt-rw-rar r" + rar, MT.rarityName(n)));
    /* PAST TENSE FOR WHAT IS OWNED, IMPERATIVE FOR WHAT IS NOT: one line, and
       it either says what the player DID or what they have to go and do. */
    card.appendChild(el("div", "mt-rw-src", MT.isMilestone(n)
      ? (MT.milestoneLabel(n, !have) || (have ? T.fromMap : T.toMap))
      : (have ? T.fromMachine : T.toMachine)));
  }

  /* ── 6. the shop ──────────────────────────────────────────────────────── */

  var shop, shopBody, shopBuilt = false;

  function buildShop() {
    if (shopBuilt) return;
    shopBuilt = true;
    shop = el("div"); shop.id = "sh-screen";

    var bg = el("div"); bg.id = "sh-bg";
    dressBackdrop(bg);
    shop.appendChild(bg);

    var head = el("header", "mt-head");
    /* The shop has no x/20 to carry, so its name takes the big slot the album
       spends on the count — one header, two readings of it. */
    var titles = el("div", "mt-titles");
    titles.appendChild(el("div", "mt-eyebrow", ""));
    titles.appendChild(el("div", "mt-count", T.shop));
    head.appendChild(titles);
    shop.appendChild(head);
    /* THE TICKET CHIP IS THE DOOR BACK TO THE COLLECTION, and it is in the
       band over this screen rather than in this header (packages/webshell/
       view.js). The rule the band reads is the one that was written here: a
       chip's door is the OTHER screen, so on the shop the coin chip has
       nowhere to go — its door is the screen it is standing on — and only the
       blue one opens, onto the album, which is where a ticket is spent. */

    shopBody = el("div"); shopBody.id = "sh-body";
    shop.appendChild(shopBody);
    frame().appendChild(shop);
  }

  function paintShop() {
    shopBody.innerHTML = "";

    /* 1. THE TICKET, AND THE TICKET IS THE SUBJECT. Two columns and not three
       rows: the piece down the left at the size of the thing being sold, and
       beside it a column that reads top to bottom — the name, the sentence
       that explains it, the price to pay. Three full-width rows left a hole
       beside a short title and a second one between the piece and the button;
       a column the height of the piece has neither, and it is the order a
       player reads a shelf in anyway.

       The sentence is turned right down: someone who has been here twice is
       not reading it again, and it must not compete with what they came for.
       There is NO "not enough coins" line — the price is on the button, the
       wallet is one row above it, and a card that tells the player off for
       being poor says nothing the two numbers do not. The dead button is the
       whole message. */
    var price = MT.ticketPrice();
    var can = MT.coins() >= price;

    var buy = el("section", "sh-card buy");
    buy.appendChild(el("div", "sh-ico", icon("ticket", "sh-i")));

    var deal = el("div", "sh-body");
    deal.appendChild(el("h3", "sh-h", T.buyTitle));
    deal.appendChild(el("p", "sh-note", T.buyNote));
    var b = el("button", "mt-btn sh-buy" + (can ? " gold" : " off"),
      icon("coin", "mt-ci") + "<span>" + num(price) + "</span>");
    b.disabled = !can;
    b.addEventListener("click", function () {
      /* THE RECT IS TAKEN BEFORE THE TRANSACTION. Paying moves the wallet,
         every wallet repaints its screen (`MT.onChange` below) and this very
         button is one of the nodes that repaint replaces — a detached node
         measures zero, and the ticket would be thrown from the frame's top
         left corner instead of from under the finger. */
      var from = b.getBoundingClientRect();
      if (!MT.spend(price)) return;
      MT.addTickets(1);
      MT.buyFx({ cost: price, kind: "ticket", n: 1, from: from });
      W.Sound.cue("uiScore", 0.7, 1.2, 900, 0.12);
      paintShop();
      if (built) paintMachine();
    });
    deal.appendChild(b);
    buy.appendChild(deal);
    shopBody.appendChild(buy);

    /* 1b. THE SUPER TICKET, the same card with the one number that matters
       changed. Fifteen ordinary tickets' worth of coins for one pull, and a
       legendary about one time in three — a price nobody reaches by accident,
       for the one thing in this shop a player can want after they own most of
       the board. It is the same two columns as the ticket above it on purpose:
       two cards that differ only in their piece, their price and their
       sentence are two cards a player can compare at a glance, which is the
       whole job of a shop with two things in it.

       HOW MANY YOU OWN IS ON THE CARD. There is no chip for it in the wallet —
       it is spent in one place — so the count lives where it is bought and
       where it is spent, and nowhere else. It rides in the column with the
       sentence, where an extra row under the card would have opened the hole
       this layout exists to close. */
    var sPrice = MT.superPrice();
    var sCan = MT.coins() >= sPrice;

    var sBuy = el("section", "sh-card buy super");
    sBuy.appendChild(el("div", "sh-ico", icon("ticketSuper", "sh-i")));

    var sDeal = el("div", "sh-body");
    sDeal.appendChild(el("h3", "sh-h", T.superTitle));
    sDeal.appendChild(el("p", "sh-note", T.superNote));
    if (MT.supers() > 0) {
      sDeal.appendChild(el("p", "sh-note own", fill(T.superOwn, { n: MT.supers() })));
    }
    var sb = el("button", "mt-btn sh-buy" + (sCan ? " gold" : " off"),
      icon("coin", "mt-ci") + "<span>" + num(sPrice) + "</span>");
    sb.disabled = !sCan;
    sb.addEventListener("click", function () {
      if (!MT.spend(sPrice)) return;
      MT.addSupers(1);
      /* No flight: `buyFx` throws the piece into the wallet chip that holds
         it, and this one has no chip. What the player watches instead is the
         coins leaving and the count on this card going up under their finger,
         which is the same beat without a destination invented for it. */
      MT.spendFx(MT.coins() + sPrice, MT.coins());
      W.Sound.cue("uiStar", 0.8, 1.45, 1180, 0.16, "triangle");
      paintShop();
      if (built) paintMachine();
    });
    sDeal.appendChild(sb);
    sBuy.appendChild(sDeal);
    shopBody.appendChild(sBuy);

    /* 2. the doubles. The list is the inventory and the button is the whole
       trade: a player with eleven doubles is not going to tap eleven times.

       A PLAYER WITH NO DOUBLES GETS NO CARD. An empty frame explaining its own
       emptiness is a second product on a screen that sells one, and it is the
       first thing a new player sees here — the shop should look like a shop
       with one thing in it, not like a shop that is broken. */
    var list = MT.dupes();
    if (list.length) {
      var sellBox = el("section", "sh-card col");
      sellBox.appendChild(el("h3", "sh-h", T.sellTitle));
      var row = el("div", "sh-dupes"), total = 0, i;
      for (i = 0; i < list.length; i++) {
        var n = list[i], extra = MT.count(n) - 1;
        total += MT.sellPrice(n) * extra;
        row.innerHTML += '<span class="sh-dup"><img src="' + MT.art(n) + '" alt="">' +
          '<i>x' + extra + "</i></span>";
      }
      sellBox.appendChild(row);
      var all = el("button", "mt-btn gold",
        "<span>" + T.sellAll + "</span>" + icon("coin", "mt-ci") + "<span>" + num(total) + "</span>");
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
          W.Sound.cue("uiScore", 0.7, 1.35, 1000, 0.12);
        }
        paintShop();
        if (built) paintGrid();
      });
      sellBox.appendChild(all);
      shopBody.appendChild(sellBox);
    }
  }

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
    paintMachine();
    paintGrid();
    Machine.refresh();                // the frame may have been resized under it
    MT.markSeen();
  }

  function hideAlbum() {
    Machine.sleep();                  // a machine nobody is looking at draws nothing
  }

  /* One repaint for the two screens whenever the wallet moves under them —
     a ticket bought in the shop has to grey the machine's button in, and a
     sticker earned on the end screen has to fill its tile. */
  MT.onChange(function () {
    if (VW.isOpen("sticker")) { paintMachine(); paintGrid(); }
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
      var labels = ctl.querySelectorAll(".al-lbl");
      labels[0].textContent = T.perDraw;
      labels[1].textContent = T.chances;
      paintMachine();
      paintGrid();
    }
    if (shopBuilt) {
      shop.querySelector(".mt-count").textContent = T.shop;
      paintShop();
    }
  }
})();
