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
    intro: { logo: null, demo: "tap", caption: "" },

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
    music: { volume: 0.12, fade: 1.6 },

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
      // combo: harp-run-up-01
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

