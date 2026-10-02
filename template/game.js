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
     chime-ping-correct-01); browse it by ear at `make events` → /library, or
     `node tools/lab/index-sfx.mjs --list metal heavy`. Pick a clip per event,
     trim it to the useful part and re-encode it small, then embed it under a
     short game-side key:

       ffmpeg -i assets/audio/sfx/<clip>.<ext> -t 0.4 -ac 1 -ar 32000 -b:a 64k gem.mp3
       node tools/lab/embed-asset.mjs gem.mp3 --key gem

     Keep a comment naming the source clip next to every key (below), and pitch
     a single sample with Sound.clip(name, vol, rate) instead of embedding
     variations. Sound.beep / Sound.arp stay available, but only as a fallback
     for an event with no clip.
     =================================================================== */
  var ASSETS = {
    images: {
      // logo: "data:image/png;base64,iVBORw0KGgo…"
    },
    sounds: {
      // assets/audio/sfx/*.{mp3,ogg}, trimmed and re-encoded mono 32 kHz / 64 kbps
      // pop: mallet-plink-01   (the file it is cut from, no extension — make events reads this)
      // pop: "data:audio/mpeg;base64,SUQzBAAAAAA…"
      // music: the background bed, looped and crossfaded by Music (see
      // CONFIG.music). Encode it small — mono 64 kbps is plenty under sfx:
      //   ffmpeg -i track.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3
      //   node tools/lab/embed-asset.mjs music.mp3 --key music
      // hit: pop-high-01   (pitched by combo)
      // combo: harp-ascending-01
      hit: "data:audio/mpeg;base64,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",
      combo: "data:audio/mpeg;base64,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",
      // End-screen cues, shared by every game (played through Sound.cue, so a
      // game that drops them falls back to the synthesized beeps).
      // uiScore: chime-ping-two-tone-high-01
      // uiStar:  impact-generic-light-02 (pitched per star)
      // uiRow:   beep-select-01
      uiScore: "data:audio/mpeg;base64,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qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+1jEnIPKRibMRoH9MAAAAAAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+1jEegPAAAGkAAAAIAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+1jEegPAAAGkAAAAIAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=",
      uiStar: "data:audio/mpeg;base64,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",
      uiRow: "data:audio/mpeg;base64,SUQzBAAAAAAAW1RFTkMAAAAVAAADU291bmQgR3JpbmRlciA0LjQuMQBUQ09QAAAADwAAA0FsYW4gTWNLaW5uZXkAVFNTRQAAAA8AAANMYXZmNjIuMTIuMTAwAAAAAAAAAAAAAAD/+1jAAAAAAAAAAAAAAAAAAAAAAABJbmZvAAAADwAAAAMAAASAAICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwP///////////////////////////////////////////wAAAABMYXZjNjIuMjgAAAAAAAAAAAAAAAAkBSAAAAAAAAAEgBfTdCoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+1jEAAAOiRtP9IWAAiO4br8w0AJQhAAAAAAAACkf+vnSpLDsG4flAoAHADADAnLwSABAEB8UHYOwdg7DSthubv4Yxlf////+9jGU83Nz9m5ubm5uffcPe973v0B3m9sNDRlPZUvfDGSaGjGf/////sYykx2GlJm58+Iz/D//8uH/+Qhj////BCIdmUiMAESMiNuJAAFKQSALCd10W8q7rJOabt+3hbbN+NP0E3CrEgTSs2FYvF8kVGpYTVAtgyycPBAkXPGxedIvHnLCcUHSNlHUFpJObS4O0fEVJWpK9H/dK1iXT/1rb/9TXWdHpU36TmYvH1f9BNS/Zk66lqTSZO69T/f6///01f1fy+pxJP6FKhN/wAAFWwFX9fKqrML/+1jEBoEP4idFvIiAAg/E4qBctaDeSCkBUBUpACwLKhxHRzSdRKJAiLEWJ5J2LxtWgXkjYxNUC6i3qLyi8bGJdNTI2V9WpFFFH3rapJJJL1o/1Ja0nUkkklb6kvWiijScvECIMovkVNUVIooqMUF//////1N/1UldaWj7N////////Wj6KJ6CE4JfqXMowLehm5aUQKnM+hA48CQqW5SrCm3Zy1Tbw/GJRbaNEyUtkn9T+palJUS6g6KP1t113/rZKl6qnMR7JnC8s1qSQek5kXlqUmgPYzNVGw4RikoFuAAmBGiVCpArw8jEnFMepOHkXnUjS//////+v/////////9KkpLotzIvJFt8bv6uTYJApAKBSAUKTCRSaJ2zct//+1jECoPNWhzgAyBZCAAANIAAAATJWkXRJFwuTjS42W//8x00z/800WsXXxE1fax+sWsXPP2sWv//szmlObBxLrTSqB8CkMiIIy8wPFRo45UUEdlYysb////////////////6yocqOUNKSUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU="
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

