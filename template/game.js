  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Game title",
    /* ONE sentence teaching the core mechanic, never two, and the words that
       carry it wrapped in <b class="w-…"> so they read in colour. The animated
       stage below the line shows the same thing in motion — that is the pitch,
       so intro.caption stays empty. */
    tagline: "<b class=\"w-verb\">Tap</b> to hit the <b class=\"w-target\">target</b>",
    gameSeconds: 20,                 // round length in seconds; 0 = endless

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
    bg: "#0a0a1c",

    // Bands the engine reserves (design px). Layout.top / Layout.bottom are
    // derived from them plus the device safe-area insets: keep gameplay there.
    // The four edges are also floored by the house margin — `safePad`, 26 by
    // default — so nothing the player reads or touches lands on the glass when
    // a target drops one of these bands (the web build zeroes `ctaHeight`).
    //
    // THE TWO BOTTOM CORNERS ARE THE SHELL'S, not the game's. On the web
    // target the round carries MENU / OPTIONS in the bottom-right and the
    // level's stars in the bottom-left, both roughly 240 x 58 design px in
    // from the frame's edge by 26. `Layout` does NOT shrink for either — they
    // are an overlay — so draw the world through them as usual, but anchor no
    // INSTRUMENT and no word there: a gauge, a counter or a label in a bottom
    // corner is the one thing they cover. `games/arcider` moved its shield
    // rail to the right flank for this, and `games/slipdeck`, whose hand fills
    // the foot of the frame, moves the pill instead with `--lv-hud-bottom`
    // (packages/webshell/levels.css).
    layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 30 },

    // Intro: logo is a key in ASSETS.images (omit for a text-only intro).
    // demo is the animated how-to-play: tap | hold | drag | swipe | aim — the
    // shared finger acts out the gesture on a stage the SKIN dresses as the
    // game itself. caption is the fallback label for a stage that cannot say
    // it on its own; leave it empty and the tagline carries the sentence.
    // desk is what a DESK plays with, one row per control (shell.js, Demo):
    // keys (left right up down space, or a label as written) and/or mouse
    // actions (aim click hold drag grab), plus what the row `does`. The first
    // row decides the stage — any mouse and the finger becomes a clicking
    // cursor, keys alone and the keys are pressed. Left out, it follows the
    // demo's gesture.
    intro: { logo: null, demo: "tap", caption: "",
             desk: [{ keys: ["space"], mouse: ["click"] }] },

    // Desktop fallbacks: SPACE acts as a tap (start, play, replay) for the
    // "tap" and "hold" demos, and the LEFT/RIGHT arrows fire a lateral flick
    // for a "swipe" demo. Set to false to keep the keyboard out entirely.
    keyboard: true,

    // HUD slots: the centre score is always there; the timer fills the right.
    hud: { score: true, timer: true },

    // Background music. Only used when the game embeds ASSETS.sounds.music.
    // volume: keep it discreet — the bed must never fight the sfx.
    // fade:   seconds of fade in / out; also the crossfade at the loop seam.
    // A game played on the beat also declares the tempo here — bpm, beatOffset
    // (seconds to the first beat inside the file) and loopBeats (beats the loop
    // keeps) — and drives its action with Beat. See docs/ENGINE.md.
    // seam:   loop ON THE BAR — seconds of equal-power crossfade (two beats)
    //         ending on the loop point; every window is then cut on whole bars
    //         (tools/lab/loop-points.mjs). A whole file with no room on either
    //         side keeps the plain `fade` wrap.
    // cut:    the playable's window inside its embedded cut, when the cut
    //         starts one seam early to give that window a pre-roll —
    //         { from: <seam>, length: <bars> }. The web build drops it.
    //         See docs/MUSIC.md, "The seam".
    music: { volume: 0.12, fade: 1.6, seam: 1 },

    // All user-facing copy in one place.
    copy: {
      start:      "Tap to play",
      ctaBar:     "Install now",
      ctaEnd:     "Play the full game",
      replay:     "Replay the demo",
      scoreLabel: "Score",
      timeLabel:  "Time",
      endScore:   "Final score",
      gameOver:   "Game over",
      timeUp:     "Time's up!"
    }
  };

  /* ===================================================================
     2. ASSETS — embedded base64 data URIs only (no network requests ever).
     Generate entries with tools/lab/embed-asset.mjs. Draw the graphics on canvas:
     every embedded byte counts against the 5 MB budget.

     SOUND EFFECTS ALWAYS COME FROM assets/audio/sfx/ — that shared library is the
     palette for every game, so the whole catalogue sounds like one product.
     Every file there is named <category>-<descriptor>-<NN> (impact-metal-heavy-01,
     gem-pickup-01); browse it by ear at `make events` → /library, or
     `node tools/lab/index-sfx.mjs --list metal heavy`. Pick a clip per event,
     trim it to the useful part and re-encode it small, then embed it under a
     short game-side key:

       ffmpeg -i assets/audio/sfx/<clip>.<ext> -t 0.4 -ac 1 -ar 32000 -b:a 64k gem.mp3
       node tools/lab/embed-asset.mjs gem.mp3 --key gem

     Keep a comment naming the source clip next to every key (below), and pitch
     a single sample with Sound.clip(name, vol, rate) instead of embedding
     variations. Sound.beep / Sound.arp stay available, but only as a fallback
     for an event with no clip.

     The end screen's sounds are NOT here: the score, the stars and the rows
     are the house kit's (assets/audio/kit/, played with Sound.ui), which the
     builder injects into every game — tune them once at `make events` → /kit.
     =================================================================== */
  var ASSETS = {
    images: {
      // logo: "data:image/png;base64,iVBORw0KGgo…"
    },
    sounds: {
      // assets/audio/sfx/*.{mp3,ogg}, trimmed and re-encoded mono 32 kHz / 64 kbps
      // pop: gem-pickup-01     (the file it is cut from, no extension — make events reads this)
      // pop: "data:audio/mpeg;base64,SUQzBAAAAAA…"
      // music: the background bed, looped and crossfaded by Music (see
      // CONFIG.music). Encode it small — mono 64 kbps is plenty under sfx:
      //   ffmpeg -i track.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3
      //   node tools/lab/embed-asset.mjs music.mp3 --key music
      // hit: pop-plop-01   (pitched by combo)
      // combo: harp-success-01
      hit: "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//tYwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAFoABmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmaZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzP////////////////////////////////8AAAAATGF2YzYyLjI4AAAAAAAAAAAAAAAAJAO8AAAAAAAABaBD3wGdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tYxAAAC8UBGFSRgAJ8Mqu3MUAAAAPpkYJgmTyIBQxUIQhDPNEQq7ufxERPRP//QvdzQDA39E9OuehVETd3OO5xETcAEE76FQAQTgYGBgb8QIIQv/4hbgAg5lAx+TlAQ/+GInD6/lz/0B//B8///ghBB3x5HAAAA4AC7PAEgDAb2UzcE9W4CNefX7e9J4Gm58pccsfMYMd6IGxGBSbyfPJgDKwFE4GOKN6SJuGkADCAx8Y783Z3wbiEARtkqK2DlGVf01N2cdhPmhaIubkKKUZFS7O/azfFlkeLMIeQ0sIrWT//9Czf8ZUtk2OEZs3PEMNSqXiIFP/////xc5bNi4tamWmmeAgRZ///loqomBJxtipONphkhuSSbyRBppIP//tYxAaAD91DcbyVgBIPKKiqntAAsikleiJk0fVVVGZCB5G2Da2rNRNSa2HJGzfvdbW9ti4v/5mHONjWHHnX37nX7Wt5buNra3a1sOc5JrWtRa1tQ5zoc6//6/dDv+a/r9zpa1rWta137WtOhLV/KgqCoNA1ETxEO//xK4FQVBWsNVHmrDXTQgAAIAADlmaFueCpWFlXozmpEucw3jqOIHCMgjiehaQvIXouEkUSTKiTNSVRNyY6TKXakpJFnajU954yW0yTUdZ9kkUl/3vdGlWzopMipSbHW+mz0lpIqtXeilvu6KqW231OlUtFIxMjEJBbJ/ULEnhJz1+b5l8YLGwWJAyFSRr/qb9lskukjkblsudisUsAQAYXDELVnFDm//tYxAqAEVEtXbj2ABHLlGTLnvAAlPogwTSCAIE7E8h5cMXCWHpMO1Tu32FcuLYdnaGYKmoD9dephD9Z0lq1YljsfzZrVpz/0rXZsYHB4TxLLYUEyz1mVruWhjilvLWnTwRzM/HRY5Gw41Va7lrTWsz3W3ZmZ/rr3jAwcff/M3GnratW4IhQW//+sACfxnUY/YDWcqoQwzzJG9yWhDjrHQHKHCpFCcwrpLTsWlK2wZHPatjMtk66t651/aFvOrf6+N1rV7B3rVYv3jNc61/4VwqCwFQDJESA4k0eEoYJix4kdPA0SYyRW2gsBtgdAKyJYRBy3kgN5Ul3Hv//fSoAgAC7D67CcpcVC4kqUh1N6pGEHUTEdJBhFhAlaxK40mNw//tYxBEAD5DVDmeYdkGQmNTk8I8IfluSyGtiqYU6aLyLBi4hJOaRp/X85TPlgpHDqq/NUFRxIZmZvjVf/VV6s+GtCqs8CsRAy4qMH5Y86WDvwoJSowtT3+4RPtPKHv3578Fj2tQ555isfUBTp6JeqGAauSoASYcq83rhIlENlELhjeQ4EN4tGSEdCTCcjsJGTAjY0ghIDKCGDHEkJ2cg0xBgdoLkKAJ+PQZagV7Axv6ZtWxkN/y////5kyggdRyNWBghUVrFBYWFhYVIuijcWFRX/1VMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      combo: "data:audio/mpeg;base64,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"
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

     This placeholder is a working demo of the whole engine: tap the drifting
     target inside Layout, chain hits for a combo, HUD/Overlay/Fx feedback.
     =================================================================== */
  var Game = (function () {
    var score, combo, hits, best, dot;

    function reset() {
      score = 0; combo = 0; hits = 0;
      best = Store.get("bestScore", 0);
      dot = { x: Layout.cx, y: Layout.cy, r: 78, vx: Rand.pick([-1, 1]) * 280, vy: 220 };
      HUD.setScoreNow(0);
      HUD.setLeft(best, "Best");
      Fx.reset();
    }

    function onDown(p) {
      var dx = p.x - dot.x, dy = p.y - dot.y;
      if (dx * dx + dy * dy > dot.r * dot.r) {           // miss: break the chain
        combo = 0;
        Fx.shake(4, 0.15);
        Pop.text(p.x, p.y, "Miss", { color: "#ff6b6b", size: 34 });
        return;
      }
      combo++; hits++;
      var gained = 10 * combo;
      score += gained;
      HUD.setScore(score);
      HUD.punch(combo >= 5 ? "#ffd43b" : "#4bf5ff");

      // World-space juice on the impact point.
      Fx.burst(dot.x, dot.y, { color: ["#4bf5ff", "#ffffff"], count: 14, speed: 380, life: .5, grav: 300 });
      Fx.ring(dot.x, dot.y, { from: dot.r * .6, to: dot.r * 2.6, color: "#4bf5ff", width: 6, life: .4 });
      Fx.shake(6 + combo, 0.22);
      Sound.clip("hit", 0.7, Math.min(1.6, 1 + combo * 0.04));

      // Every gain gets a comic score pop right on the impact point.
      Pop.show("score", { word: "+" + gained, at: { x: dot.x, y: dot.y - dot.r } });

      // Screen-space feedback: milestones get the dramatic treatment.
      if (combo > 0 && combo % 5 === 0) {
        Pop.show(combo >= 15 ? "ultra" : "combo", { word: "Combo x" + combo, sub: "+" + combo * 20 });
        Sound.clip("combo", 0.8);
        score += combo * 20; HUD.setScore(score);
      } else if (combo === 3) {
        Pop.show("streak", { word: "Nice chain" });
      }

      // Teleport + speed up.
      dot.x = Rand.range(Layout.left + dot.r, Layout.right - dot.r);
      dot.y = Rand.range(Layout.top + dot.r, Layout.bottom - dot.r);
      dot.vx *= 1.04; dot.vy *= 1.04;
    }

    function update(dt) {
      dot.x += dot.vx * dt; dot.y += dot.vy * dt;
      if (dot.x < Layout.left + dot.r)   { dot.x = Layout.left + dot.r;   dot.vx = Math.abs(dot.vx); }
      if (dot.x > Layout.right - dot.r)  { dot.x = Layout.right - dot.r;  dot.vx = -Math.abs(dot.vx); }
      if (dot.y < Layout.top + dot.r)    { dot.y = Layout.top + dot.r;    dot.vy = Math.abs(dot.vy); }
      if (dot.y > Layout.bottom - dot.r) { dot.y = Layout.bottom - dot.r; dot.vy = -Math.abs(dot.vy); }
    }

    function render() {
      ctx.fillStyle = CONFIG.bg;
      ctx.fillRect(0, 0, view.w, view.h);
      // The playable area, so it is obvious what Layout reserves.
      ctx.strokeStyle = "rgba(255,255,255,.07)";
      ctx.lineWidth = 2;
      ctx.strokeRect(Layout.left, Layout.top, Layout.w, Layout.h);
      /* Target — an ELEMENT of the entrance: on a round's first second the
         ground above is already there and this falls onto it from the glass
         (Enter, docs/ENGINE.md). Wrap each thing the world is made of the
         same way, in the order it should land; outside the entrance the two
         calls cost nothing. */
      if (Enter.begin(dot.x, dot.y)) {
        ctx.fillStyle = rgba("#4bf5ff", 0.25);
        ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.r * 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#4bf5ff";
        ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.r * 0.42, 0, Math.PI * 2); ctx.fill();
        Enter.end();
      }
    }

    // Timer out -> wrap up with a graded result.
    function onTimeUp() {
      var stars = score >= 900 ? 3 : score >= 450 ? 2 : score > 0 ? 1 : 0;
      endRound({
        title: stars === 3 ? "Perfect!" : CONFIG.copy.timeUp,
        variant: stars === 3 ? "perfect" : "",
        score: score,
        stars: stars,
        rows: [
          { label: "Hits", value: hits },
          { label: "Best chain", value: combo, grade: "accent" },
          { label: "Best score", value: Math.max(score, best), grade: "gold" }
        ]
      });
    }

    return { reset: reset, onDown: onDown, update: update, render: render, onTimeUp: onTimeUp };
  })();

