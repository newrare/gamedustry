/* The PILOTS: the scripted players that play a game's round for a camera.

   Shared by tools/lab/shoot-screens.mjs (store screenshots) and
   tools/lab/shoot-clip.mjs (promo gameplay clips): a pilot is written once,
   here, and both tools play the same round with it.

   Three tables tune the generic pilot for a game whose demo type alone does
   not play it (SWEEP, RACK), and GAME_PILOT is the game's own player — a hook
   written inside its Game module. `pageScripts(slug)` is what a tool writes
   before its driver: the tables the game needs and `window.__pilot(H, n)`,
   called once per 1/60 s step with the motor handle `H` (Layout, Input,
   CONFIG, Beat). `injectGamePilot(src, slug)` writes the game's own hook. */

/* Games whose tap POINT is the aim, not just a trigger. The generic "tap"
   pilot taps the middle of the play band, which is right where a tap is a
   tap — but marshmelt flings the body along the line to the finger, so
   tapping the centre sends it nowhere and the round ends at score 0 (dead at
   frame 122 on every seed, which is what the old `marshmelt: 4` span above
   was recording). Tapping high in the band and sweeping across it crosses the
   falling rocks instead.

   Benched over 7 seeds, cadence x height x amplitude: this entry holds the
   round for 17.5 s at the median and 12.9 s at the worst seed, for ~600
   points. Halving the cadence loses ten seconds of it, and so does aiming at
   0.2 of the band instead of 0.1 — the pilot is aiming past the rocks.

   every - frames between taps.  y - fraction of the band, from its top.
   amp   - half-width of the sweep, in fractions of the band's width.
   w     - radians of sweep per frame. */
export var SWEEP = {
  marshmelt: { every: 30, y: 0.10, amp: 0.42, w: 0.03 }
};

/* Games with a RACK of cards to play before each drop. pawko deals five cards
   in its hand and a wave leaves only when one is DRAGGED onto the board, so
   the blind pilot drags the five slots in turn onto the board — a used card,
   and a card pressed while the wave is falling, are both ignored by the game.

   slots - how many cards.  x0 / dx - the first slot's centre and the pitch, in
   fractions of the band's width.  y - the slot's centre under the band's top,
   in design px.  board - where the card is let go, as a fraction of the band. */
/* Frames between two shots of the generic drag / aim pilot, for a game whose
   round is paid in shots. The default fires every 0.7 s, which empties
   bouncetry's eight balls in five seconds while the first is still
   bouncing; a player waits for it to come back. */
export var PACE = {
  bouncetry: 120
};

export var RACK = {
  /* the hand is at the foot of the frame since the rack moved under the
     thumb: abs - x0 / dx / y are design px (game.js geometry(): five 118 px
     cards 12 px apart, centred; DECK_Y = 1280 - cornerClear - CARD_H) */
  pawko: { slots: 5, abs: true, x0: 100, dx: 130, y: 1120, board: 0.4 }
};

/* Games no blind gesture can play. stratideck is a turn-based grid: a card is
   sent at one of the few cells its reach opens, and a drag aimed anywhere else
   is refused with an "Out of reach" notice — the generic drag pilot filled
   every shot with those and never took a cell. So the pilot is the game's own:
   a hook written inside its Game module, in front of the module's `return`,
   plays one move through the game's own `attack()` — the same call a drop
   makes — and `play()` says whether it did.

   It picks what a decent player would: the tightest win it can see on the
   board (judge() reads a hidden card, which is fine for a camera and would not
   be for a bench), and when nothing wins, the smallest card it holds at a
   random target, so a loss costs little and the board still moves. The flag
   comes LAST: seeing through the cards, the pilot found it in a few turns and
   the late shots were all end screens. And after a win it takes the first tile of the
   army layer's victory reward, a choice with no default that otherwise holds
   the outro, and the round, forever.

   anchor - the text the hook is written in front of, inside the first script
            block.  every - frames between two moves, the pause a turn reads in. */
export var GAME_PILOT = {
  /* gelatile is a 2048: a blind swipe in one direction jams the board in a
     dozen moves. The pilot is the game's own: it slides the way that keeps
     the biggest tiles snaked in the bottom-left corner, and steers the big
     tiles off a target's cells. */
  gelatile: {
    every: 20,
    anchor: "return { reset: reset, update: update, render: render,",
    js: `
    window.__G = { play: function () {
      if (reached || over || ended) return false;
      var SN = [[0,3],[1,3],[2,3],[3,3],[3,2],[2,2],[1,2],[0,2],[0,1],[1,1],[2,1],[3,1],[3,0],[2,0],[1,0],[0,0]], W = [];
      SN.forEach(function (c, i) { W[c[1] * 4 + c[0]] = Math.pow(4, 15 - i) / Math.pow(4, 10); });
      var best = null, bestV = -1e18;
      ["down", "left", "right", "up"].forEach(function (d) {
        var p = plan(d); if (!p.valid) return;
        var g = [], i, v = 0; for (i = 0; i < 16; i++) g.push(0);
        p.ops.forEach(function (o) {
          if (o.exit) return;
          var c = cellAt(d, o.k, o.to), idx = c[1] * 4 + c[0];
          if (o.merge) g[idx] = o.tile.v * 2; else if (!g[idx]) g[idx] = o.tile.v;
        });
        for (i = 0; i < 16; i++) { v += g[i] * W[i]; if (!g[i]) v += 400; }
        cellPowers.forEach(function (t) {
          if (t.type === "switch") return;
          t.cells.forEach(function (c) { var idx = c[1] * 4 + c[0]; v -= g[idx] * W[idx] + (g[idx] >= 16 ? g[idx] * 2000 : 0); });
        });
        if (d === "up") v -= 3e4;
        if (v > bestV) { bestV = v; best = d; }
      });
      if (!best) return false;
      doMove(best);
      return true;
    } };
    `
  },
  /* parrynormal is a shield turned round the witch: a blind tap launches a
     ball and never aims. The pilot is the game's own: every frame it points
     the shield at the threat closest to reaching her (an inbound ball, a
     spit, a monster), launches whenever a ball is in hand and fires a super
     once two monsters are on the field. */
  parrynormal: {
    every: 1,
    anchor: "return { reset: reset, update: update, render: render,",
    js: `
    window.__G = { play: function () {
      if (mode !== "play" || ended) return false;
      var best = null, bt = 1e9, i, dx, dy, d;
      for (i = 0; i < balls.length; i++) {
        var b = balls[i]; dx = b.x - CX; dy = b.y - CY; d = Math.sqrt(dx * dx + dy * dy) || 1;
        var vr = (b.vx * dx + b.vy * dy) / d;
        if (vr < 0) { var t = (d - 130) / Math.max(40, -vr); if (t < bt) { bt = t; best = Math.atan2(dy, dx); } }
      }
      for (i = 0; i < spits.length; i++) {
        dx = spits[i].x - CX; dy = spits[i].y - CY; d = Math.sqrt(dx * dx + dy * dy);
        if ((d - 130) / 260 < bt) { bt = (d - 130) / 260; best = Math.atan2(dy, dx); }
      }
      for (i = 0; i < enemies.length; i++) {
        var e = enemies[i]; if (e.under) continue;
        dx = e.x - CX; dy = e.y - CY; d = Math.sqrt(dx * dx + dy * dy);
        if ((d - 140) / Math.max(30, e.def.speed) < bt) { bt = (d - 140) / Math.max(30, e.def.speed); best = Math.atan2(dy, dx); }
      }
      if (best != null) dialAngle = best;
      if (enemies.length) launchBall();
      if (enemies.length >= 2) for (i = 0; i < loadout.length; i++) if (!(cds[loadout[i]] > 0)) { fireSuper(i); break; }
      return true;
    } };
    `
  },
  /* holepocalypse is aimed around the tee: a press in the blue band, a drag
     out along the shot. A blind drag lands in whichever band it starts in and
     rarely meets a zombie, so the pilot is the game's own: a full-power
     Direct shot at the zombie nearest the line, a lob at a shield, a full
     super fired at once. */
  holepocalypse: {
    every: 24,
    anchor: "return { reset: reset, update: update, render: render,",
    js: `
    window.__G = { play: function () {
      if (ended || won || over) return false;
      for (var i = 0; i < slots.length; i++) if (!slots[i].left && slots[i].charge >= 1) { superTap(slots[i]); return true; }
      if (bag <= 0) return false;
      var live = mons.filter(function (m) { return !m.dead && m.state !== "under" && m.y > B.top; });
      if (!live.length) return false;
      live.sort(function (a, b) { return b.y - a.y; });
      var m = live[0], dx = m.x - TEE_X, dy = m.y - TEE_Y, l = Math.hypot(dx, dy) || 1, lob = m.kind === "shield";
      var r0 = lob ? 300 : 120, r1 = lob ? Math.min(379, 50 + (l - 120) / 830 * 330) : 380;
      onDown({ x: sx(TEE_X + dx / l * r0), y: sy(TEE_Y + dy / l * r0) });
      onMove({ x: sx(TEE_X + dx / l * r1), y: sy(TEE_Y + dy / l * r1) });
      onUp({});
      return true;
    } };
    `
  },
  /* gearball is a machine with four switches and four gates, and a tap goes to
     the NEAREST of them: a blind tap in the middle of the band flips the same
     switch forever while the locked gates overflow. So the pilot is the
     game's own, and it plays like a decent player: the fullest locked gate
     once it is half full, else the switch an electric marble is about to
     reach when it lies the wrong way, else any locked gate holding marbles. */
  gearball: {
    every: 18,
    anchor: "return { reset: reset, update: update, render: render,",
    // GEARBALL_BIOME=0..4 shoots a free round on that biome's machine
    js: `
    CONFIG.mix.playableBiome = ${+(process.env.GEARBALL_BIOME || 0)};
    window.__G = { play: function () {
      if (state !== "play") return false;
      var best = null, bk = -1, i, g, k, m, id, rem;
      for (i = 0; i < gates.length; i++) {
        g = gates[i]; if (!g.locked) continue;
        k = g.q.length / g.cap; if (k >= 0.5 && k > bk) { bk = k; best = g; }
      }
      if (best) return unlock(best);
      for (id in sw) {
        for (i = 0; i < marbles.length; i++) {
          m = marbles[i];
          if (!m.e || m.st !== "track" || m.ch.to !== id) continue;
          rem = routeWant(id);
          if (m.ch.len - m.d <= 150 && rem !== null && sw[id].dir !== rem) { flip(id, false); return true; }
        }
      }
      for (i = 0; i < gates.length; i++) if (gates[i].locked && gates[i].q.length) return unlock(gates[i]);
      return false;
    } };
    `
  },
  /* grudgeon is a dungeon of cards and fights: a shop waits for a tap
     outside it, an altar or an event for one of its buttons, an event's
     outcome for a tap anywhere, and a hero's turn for an action. The pilot
     answers whichever is open, through the same buttons and the game's own
     heroAct(), and otherwise walks to a lit room it can reach, at random — a
     weakness when the hero has learnt one, a heal when the party is low,
     else an attack or the first skill. */
  grudgeon: {
    every: 20,
    anchor: "return { reset: reset, update: update, render: render,",
    js: `
    window.__G = { play: function () {
      if (ended) return false;
      var lay = document.querySelector("#gd-card:not(.off)");
      if (lay) {
        var b = lay.querySelectorAll(".gd-picks .btn:not(.is-off)");
        if (lay.querySelector(".gd-shop")) { if (b.length && Math.random() < 0.4) b[0].click(); else lay.click(); }
        else if (b.length) b[Math.floor(Math.random() * b.length)].click();
        else lay.click();
        return true;
      }
      if (combat) {
        if (combat.phase !== "input") return false;
        var h = combat.actor, f = combat.foe, pick = "attack", i, sk, kn = h.known || h.b.skills;
        for (i = 0; i < 2; i++) {
          sk = SKILLS[h.b.skills[i]];
          if (kn.indexOf(h.b.skills[i]) >= 0 && sk.sp <= h.sp && sk.kind === "hit" && f.b.weak.indexOf(sk.el) >= 0) pick = h.b.skills[i];
        }
        if (pick === "attack") {
          sk = SKILLS[h.b.skills[1]];
          var low = party.filter(function (x) { return !x.dead && x.hp < x.mhp * 0.4; }).length;
          if (kn.indexOf(h.b.skills[1]) >= 0 && sk.kind === "heal" && sk.sp <= h.sp && low) pick = h.b.skills[1];
          else if (kn.indexOf(h.b.skills[0]) >= 0 && SKILLS[h.b.skills[0]].sp <= h.sp && Math.random() < 0.5) pick = h.b.skills[0];
        }
        heroAct(pick);
        return true;
      }
      if (walk || held || !party || !groups.length) return false;
      var g = groups[gi], ways = [];
      cells.forEach(function (c) { var w = c.state === LIT && pathFor(g, c.i); if (w) ways.push(w); });
      if (!ways.length) return false;
      goTo(g, ways[Math.floor(Math.random() * ways.length)]);
      return true;
    } };
    `
  },
  /* bridgessa is bridge's card play: a tip card waits for a tap, the pick of
     three favours for one of them, a full rail for a row, and the player's
     turn for a card. The pilot answers whichever is open; on its turn it plays
     the card the game's own solver rates best (the Advice favour's answer),
     and now and then uses a favour of the rail first, so the shots show the
     rail lit as well as the cards. */
  bridgessa: {
    every: 24,
    anchor: "return { reset:reset, update:update, render:render,",
    js: `
    window.__G = { play: function () {
      if (done) return false;
      var tipNode = document.querySelector(".bs-tip.on:not(.off)");
      if (tipNode) { if (tipOpen) tipOpen.at = 0; closeTip(true); return true; }
      var cards = document.querySelectorAll(".bs-pick.on:not(.off) .bs-perk"), rows = document.querySelectorAll(".bs-pick.on:not(.off) .bs-row");
      if (rows.length) { rows[0].click(); return true; }
      if (cards.length) { cards[Math.floor(Math.random() * cards.length)].click(); return true; }
      if (phase !== "player") return false;
      for (var r = 0; r < rail.length; r++) {
        if (rail[r] && PERK[rail[r].id].act && !whyNot(rail[r].id) && Math.random() < 0.15 && ["advice", "double", "freediscard", "bribe"].indexOf(rail[r].id) >= 0) { useFavour(rail[r].id); return true; }
      }
      var p = toPlay(), o = S.options(leader, trickCards()), best = -1, c = null, k;
      for (k = 0; k < o.length; k++) if (o[k].v > best && legal(p, o[k].c)) { best = o[k].v; c = o[k].c; }
      if (c === null) c = legalCards(p)[0];
      play(p, c);
      return true;
    } };
    `
  },
  stratideck: {
    every: 45,
    anchor: "return { reset: reset, update: update, render: render,",
    js: `
    window.__G = { play: function () {
      if (ended && !window.__endAt) window.__endAt = window.__progress;   // SHOOT_DEBUG
      var pick = document.querySelector(".ar-pick-t");  // the victory reward holds the outro
      if (pick) { pick.click(); return true; }
      /* the commander's surrender offer holds the round: fight on */
      var sur = document.querySelector(".ar-sur-quote");
      var on = sur && sur.parentNode.querySelector(".web-actions .btn:not(.btn-danger)");
      if (on) { on.click(); return true; }
      if (ended || turn || march || sheet || State !== "playing") return false;
      var best = null, low = -1, keys = [], i, k;
      for (k in targets) if (targets.hasOwnProperty(k)) keys.push(k);
      if (!keys.length) return false;
      for (i = 0; i < handSize; i++) {
        if (!pickable(i)) continue;
        if (low < 0 || hand[i].rank < hand[low].rank) low = i;
        for (var j = 0; j < keys.length; j++) {
          var rc = keys[j].split(","), foe = grid[+rc[0]][+rc[1]];
          var v = judge(hand[i], foe);
          var sc = v.kind === "flag" ? 1 : v.kind === "win" ? 50 - (v.margin | 0) - (v.hurt === "a" ? 5 : 0)
                 : v.kind === "scout" ? 20 : -1;
          if (sc >= 0 && (!best || sc > best.sc)) best = { sc: sc, i: i, r: +rc[0], c: +rc[1] };
        }
      }
      if (!best) {
        if (low < 0) return false;
        var pick = keys[Math.floor(Math.random() * keys.length)].split(",");
        best = { i: low, r: +pick[0], c: +pick[1] };
      }
      attack(best.i, best.r, best.c);
      return true;
    } };
    `
  }
};

/* The generic pilot, as a page script: it reads the tables above off
   window (__SWEEP, __RACK, __GEVERY) and the game's own hook off window.__G. */
var GENERIC_JS = `<script>
window.__pilot = (function () {
  var side = 0, lastBeat = -1;
    /* A scripted player, one per demo type. It is not good at any of these games —
       it only has to keep a round alive and busy long enough to be worth a shot. */
    function pilot(H, n) {
      var L = H.Layout, demo = (H.CONFIG.intro && H.CONFIG.intro.demo) || "tap";
      /* A card the round stops for (Game.held: gearball's upgrade pick,
         slipdeck's joker pick and its full-rail swap) waits for a tap no blind
         gesture lands on, and every later shot is that card. Take one. */
      if (n % 20 === 10) {
        var picks = document.querySelectorAll("#gb-pick:not(.off) .gb-take, .sd-take, .sd-row");
        if (picks.length) { picks[Math.floor(n / 20) % picks.length].click(); return; }
      }
      if (window.__G && window.__G.play) {             // the game's own pilot (GAME_PILOT)
        if (n % window.__GEVERY === 0) window.__G.play();
        return;
      }
      // a rack of cards over the board: drag a card onto it (see RACK)
      var R = window.__RACK;
      if (R) {
        var kk = n % 24, slot = Math.floor(n / 24) % R.slots;
        var sx = R.abs ? R.x0 + R.dx * slot : L.left + L.w * (R.x0 + R.dx * slot), sy = R.abs ? R.y : L.top + R.y;
        var bx = L.left + L.w * (0.2 + 0.6 * Math.abs(Math.sin(n * 0.013))), by = L.top + L.h * R.board;
        if (kk === 0) H.Input.at("down", sx, sy);
        else if (kk < 12) H.Input.at("move", sx + (bx - sx) * (kk / 12), sy + (by - sy) * (kk / 12));
        else if (kk === 12) H.Input.at("up", bx, by);
        return;
      }
      if (demo === "swipe") {                          // one flick every ~0.6 s
        if (n % 36 === 0) H.Input.swipe(n % 72 === 0 ? 1 : -1);
        return;
      }
      if (demo === "hold") {                           // lean one way, then the other
        if (n % 48 === 0) H.Input.at("down", (side++ % 2) ? L.left + L.w * 0.25 : L.right - L.w * 0.25, L.cy);
        else if (n % 48 === 30) H.Input.at("up", L.cx, L.cy);
        return;
      }
      if (demo === "drag" || demo === "aim") {         // aim across the arc, release
        var k = n % (window.__PACE || 42);
        var ax = L.cx, ay = L.bottom - L.h * 0.12;
        var tx = L.left + L.w * (0.2 + 0.6 * Math.abs(Math.sin(n * 0.07)));
        var ty = L.top + L.h * 0.25;
        if (k === 0) H.Input.at("down", ax, ay);
        else if (k < 20) H.Input.at("move", ax + (tx - ax) * (k / 20), ay + (ty - ay) * (k / 20));
        else if (k === 20) H.Input.at("up", tx, ty);
        return;
      }
      // "tap" whose point is the aim: sweep the top of the band (see SWEEP).
      var S = window.__SWEEP;
      if (S) {
        if (n % S.every === 0)
          tap(H, L.left + L.w * (0.5 + S.amp * Math.sin(n * S.w)), L.top + L.h * S.y);
        return;
      }
      // "tap". A game played on the beat is scored on timing, so tap the grid
      // instead of a cadence of our own — that is the difference between a board
      // full of combos and a board full of MISS.
      var m = H.CONFIG.music;
      if (m && m.bpm > 0 && H.Beat) {
        var b = Math.floor(H.Beat.beats());
        if (b !== lastBeat) { lastBeat = b; tap(H, L.cx, L.cy); }
        return;
      }
      if (n % 30 === 0) tap(H, L.cx, L.cy);            // otherwise every 0.5 s
    }
    function tap(H, x, y) { H.Input.at("down", x, y); H.Input.at("up", x, y); }
  return pilot;
})();
</script>`;

/* The page scripts a driver needs before it can call window.__pilot. */
export function pageScripts(slug) {
  var gp = GAME_PILOT[slug];
  return (SWEEP[slug] ? "<script>window.__SWEEP = " + JSON.stringify(SWEEP[slug]) + ";</script>\n" : "")
    + (RACK[slug] ? "<script>window.__RACK = " + JSON.stringify(RACK[slug]) + ";</script>\n" : "")
    + (gp ? "<script>window.__GEVERY = " + gp.every + ";</script>\n" : "")
    + (PACE[slug] ? "<script>window.__PACE = " + PACE[slug] + ";</script>\n" : "")
    + GENERIC_JS + "\n";
}

/* The game's own player, written in front of its anchor inside the game's
   script block. A game with none is returned unchanged. */
export function injectGamePilot(src, slug) {
  var gp = GAME_PILOT[slug];
  if (!gp) return src;
  var at = src.indexOf(gp.anchor);
  if (at < 0 || at > src.indexOf("</script>")) throw new Error(slug + ": no pilot anchor");
  return src.slice(0, at) + gp.js + "\n    " + src.slice(at);
}
