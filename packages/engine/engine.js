  /* ===================================================================
     3. ENGINE — reusable plumbing shared by every game. Extend, don't fork.
     =================================================================== */

  function $(id) { return document.getElementById(id); }
  function cssVar(name, value) { document.documentElement.style.setProperty(name, value); }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // --- Canvas, design-space scaling and the notch-safe layout -------------
  var canvas = $("game"), ctx = canvas.getContext("2d");

  // The virtual screen every coordinate refers to.
  var view = {
    w: CONFIG.designWidth, h: CONFIG.designHeight,
    scale: 1,          // design px -> screen px
    dpr: 1,            // design px -> DEVICE px: what a backing store is sized in
    insetTop: 0,       // design px eaten by the notch / status bar
    insetBottom: 0     // design px eaten by the home indicator
  };

  // The rectangle gameplay may safely use: below the HUD, above the CTA bar,
  // clear of the device insets, and never closer to the glass than the house
  // margin (see relayout). Recomputed on every resize.
  var Layout = { top: 0, bottom: 0, left: 0, right: 0, w: 0, h: 0, cx: 0, cy: 0 };

  // env(safe-area-inset-*) is only observable through a probe element.
  function safeInsets() {
    var cs = window.getComputedStyle($("safe-probe"));
    return { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
  }

  /* How many device pixels one design pixel is worth — which is what a canvas
     backing store must be sized in, and the single biggest cost a game pays
     per frame.

     NOT `min(devicePixelRatio, 2)`, which is what this used to be. The frame is
     scaled to fit the screen (`view.scale`), so the pixels the display will
     actually show are `scale * devicePixelRatio` per design pixel; anything
     above that is drawn and then thrown away by the downscale. On a 390x844
     phone at DPR 3 the old rule sized the canvas 1440x2560 = 3.69 Mpx while the
     screen shows 1170x2080 = 2.43 Mpx, and every frame paid the difference.

     Measured with `node tools/lab/bench-fill.mjs`, one render of vipera:
     3.35 ms at 0.92 Mpx, 11.99 ms at 2.43 Mpx, 17.57 ms at 3.69 Mpx — against
     a 16.7 ms budget at 60 fps. A desktop at DPR 1 was already at 0.92 Mpx and
     a phone at 3.69, which is the whole reason one stuttered and the other
     never did, on every game at once.

     Clamped to [1, 2]: never under the design resolution, never over the old
     ceiling, so a desktop keeps exactly the pixels it had. */
  function pixelRatio(scale) {
    return clamp(scale * (window.devicePixelRatio || 1), 1, 2);
  }

  function fitCanvas() {
    var winW = window.innerWidth, winH = window.innerHeight;

    /* CONFIG.layout.framePad reserves a margin of SCREEN pixels around the
       frame before the scale is computed. A playable leaves it at 0 — an ad
       fills its container, always — while the web target sets it on a desktop
       window so the dressing of packages/frame-web is not cut off by the edge
       of the screen. It may be an accessor (see packages/platform/web.js), so
       it is read on every fit rather than cached. */
    var pad = CONFIG.layout.framePad || 0;
    var vw = Math.max(1, winW - pad * 2), vh = Math.max(1, winH - pad * 2);
    var scale = Math.min(vw / view.w, vh / view.h);
    view.scale = scale;
    var dpr = view.dpr = pixelRatio(scale);

    // Backing store at design size x DPR; the frame transform does the rest.
    canvas.width  = Math.round(view.w * dpr);
    canvas.height = Math.round(view.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);                // draw in design px
    cssVar("--scale", scale);

    // Letterbox bars already push the frame away from the notch: only the
    // remaining overlap has to be padded, converted to design px.
    var ins = safeInsets(), bar = Math.max(0, (winH - view.h * scale) / 2);
    view.insetTop    = Math.max(0, (ins.top - bar) / scale);
    view.insetBottom = Math.max(0, (ins.bottom - bar) / scale);
    cssVar("--inset-top", view.insetTop.toFixed(1) + "px");
    cssVar("--inset-bottom", view.insetBottom.toFixed(1) + "px");

    relayout();
  }

  /* THE HOUSE MARGIN. Nothing the player has to read or touch may sit against
     the edge of the frame: a phone rounds its corners, a gesture bar eats the
     last few pixels, and a figure printed one pixel from the glass reads as a
     bug whatever the device. 26 design px is the number the rest of the motor
     already uses — the HUD band's own side padding, the web shell's two round
     controls, the level map's footer — so it is the one written here.

     It is a FLOOR on the four edges, never an addition: a band that already
     reserves more keeps exactly what it reserved, which is why a playable is
     untouched (its HUD is 150 px and its CTA bar 112). The edge it actually
     bites is the BOTTOM of the web and android builds, where
     packages/platform/web.js zeroes `ctaHeight` and `Layout.bottom` fell on
     the last row of the frame — every instrument a game anchors there (the
     shield rail of games/arcider, the hand label of games/slipdeck, the spin
     gauge of games/spinshock) was flush against the glass.

     A game may raise it through CONFIG.layout.safePad; nothing may lower it
     below zero, and a game that wants its world to bleed off an edge (a lava
     lake, a scrolling lane, a shockwave) draws that outside Layout, which is
     the play band and not a clip rect.

     WHAT IT DOES NOT SAY IS THE TWO BOTTOM CORNERS. The web target's round
     carries MENU / OPTIONS in one and the level's three stars in the other,
     each about 240 x 58 in from the frame by 26, and neither takes a band out
     of `Layout` — they are an overlay, so the world still runs under them.
     A game may therefore draw THROUGH them, and may anchor no INSTRUMENT and
     no word there. Both are the shell's (packages/webshell/menu.css and
     levels.css); a game whose own layout owns the left one moves the pill with
     `--lv-hud-bottom` rather than reserving anything here. */
  var SAFE_PAD = 26;

  function relayout() {
    var m = CONFIG.layout;
    var pad = Math.max(0, m.safePad == null ? SAFE_PAD : m.safePad);
    Layout.top    = view.insetTop + Math.max(m.hudHeight, pad);
    Layout.bottom = view.h - view.insetBottom - Math.max(m.ctaHeight, pad);
    Layout.left   = Math.max(m.sideMargin, pad);
    Layout.right  = view.w - Math.max(m.sideMargin, pad);
    Layout.w = Layout.right - Layout.left;
    Layout.h = Layout.bottom - Layout.top;
    Layout.cx = (Layout.left + Layout.right) / 2;
    Layout.cy = (Layout.top + Layout.bottom) / 2;
    if (typeof Game !== "undefined" && Game && Game.onResize) Game.onResize();
  }

  window.addEventListener("resize", fitCanvas);
  window.addEventListener("orientationchange", fitCanvas);

  // --- Input: mouse + touch unified, mapped into design coordinates -------
  // Also exposes `at()` so the desktop keyboard fallback (section 7) can
  // synthesize a tap without a real pointer.
  var Input = (function () {
    var L = { down: [], move: [], up: [] };
    function toDesign(cx, cy) {
      var r = canvas.getBoundingClientRect();          // accounts for the scale
      return { x: (cx - r.left) / r.width * view.w, y: (cy - r.top) / r.height * view.h };
    }
    function emit(type, e) {
      var t = (e.touches && e.touches[0]) ? e.touches[0]
            : ((e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : e);
      var p = toDesign(t.clientX, t.clientY);
      for (var i = 0; i < L[type].length; i++) L[type][i](p, e);
    }
    canvas.addEventListener("mousedown", function (e) { emit("down", e); });
    canvas.addEventListener("mousemove", function (e) { emit("move", e); });
    window.addEventListener("mouseup",   function (e) { emit("up",   e); });
    canvas.addEventListener("touchstart",  function (e) { e.preventDefault(); emit("down", e); }, { passive: false });
    canvas.addEventListener("touchmove",   function (e) { e.preventDefault(); emit("move", e); }, { passive: false });
    canvas.addEventListener("touchend",    function (e) { e.preventDefault(); emit("up",   e); }, { passive: false });
    canvas.addEventListener("touchcancel", function (e) { emit("up", e); });
    // Fire a synthetic pointer event at a design-space point. `e` is null:
    // listeners must not depend on the raw DOM event.
    function at(type, x, y) {
      var p = { x: x, y: y };
      for (var i = 0; i < L[type].length; i++) L[type][i](p, null);
    }
    /* A whole synthetic flick: down at the centre of the play area, one move
       `dist` to the side, then up. This is how the desktop keyboard fallback
       (section 7) drives a swipe game — the gesture goes through the same
       down/move/up path as a finger, so a game never grows a second input
       API for the arrow keys. dir is -1 (left) or +1 (right). */
    function swipe(dir, dist) {
      var d = dist == null ? 150 : dist, x = Layout.cx, y = Layout.cy;
      at("down", x, y);
      at("move", x + dir * d, y);
      at("up",   x + dir * d, y);
    }
    return { on: function (type, fn) { L[type].push(fn); }, at: at, swipe: swipe };
  })();

  // --- Loop: rAF with clamped dt, pausable when the ad is not visible -----
  var Loop = (function () {
    var running = false, paused = false, last = 0, u = null, r = null, rate = 1;
    /* THE HANDLE IS THE WHOLE POINT. There is exactly ONE rAF chain, and `raf`
       is it. Without it `start()` scheduled a chain every time it was called
       while the old one was still alive — and the old one only checks
       `running`, which start() had just set back to true — so two chains ran
       side by side, each calling update AND render, the world advancing at
       twice the rate and the frame drawn twice over itself. A third call made
       three. The guard below is what makes a round mount once, whoever asks
       and however often; `stop()` cancels the pending frame instead of merely
       flagging it, so a restart in the same frame cannot resurrect it either.
       See the TODO entry "a TAP reloads the game view". */
    var raf = 0;
    function frame(now) {
      raf = 0;
      if (!running) return;
      var dt = Math.min((now - last) / 1000, 0.05);   // clamp tab-switch gaps
      last = now;
      if (!paused) { if (u) u(dt * rate); if (r) r(); }
      if (running) raf = requestAnimationFrame(frame);
    }
    return {
      /* Idempotent: asking a running loop to start re-arms it — the callbacks,
         the time scale and the clock — and keeps the one chain it already has.
         A paused loop is un-paused by it, which is what a round starting from
         behind an open card expects. */
      start: function (uu, rr) {
        u = uu; r = rr; paused = false; rate = 1; last = performance.now();
        if (running) return;
        running = true;
        raf = requestAnimationFrame(frame);
      },
      stop:  function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } },
      pause: function () { paused = true; },
      resume:function () { paused = false; last = performance.now(); },
      /* SLOW MOTION, one number. The frame keeps rendering at full rate and the
         simulation is handed a shorter `dt`, so the world, the round clock and
         the game's own update slow down together — the same reason Loop.pause()
         freezes all three at once. `start` resets it, so a rate left behind by
         one round can never leak into the next. The motor never changes it
         itself; the web target ramps it down for the three-star finish. */
      rate: function (k) { if (k != null) rate = Math.max(0, k); return rate; },
      isRunning: function () { return running; }
    };
  })();
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { Loop.pause(); Music.pause(); }
    else { Loop.resume(); Music.resume(); }
  });

  // --- Sound: WebAudio synth (zero assets) + optional embedded clips ------
  var Sound = (function () {
    var actx = null;
    /* Muted is a switch, not a volume: the web target's OPTIONS panel flips it
       and persists it (packages/webshell). A playable never touches it, so it
       is false for the whole life of a creative. It gates the two leaves —
       beep() and clip() — and therefore arp() and cue() as well. */
    var muted = false;
    function ensure() {
      if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
      if (actx && actx.state === "suspended") actx.resume();   // iOS: user gesture
      return actx;
    }
    function beep(freq, dur, type, vol) {
      if (muted) return;
      var a = ensure(); if (!a) return;
      var o = a.createOscillator(), g = a.createGain(), v = (vol == null ? 0.3 : vol);
      o.type = type || "sine"; o.frequency.value = freq || 440;
      g.gain.setValueAtTime(0.001, a.currentTime);
      g.gain.exponentialRampToValueAtTime(v, a.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + (dur || 0.15));
      o.connect(g); g.connect(a.destination);
      o.onended = release(o, g);
      o.start(); o.stop(a.currentTime + (dur || 0.15));
    }
    /* Pull a voice back out of the graph the moment it is done, instead of
       leaving the GainNode wired to the destination until something collects
       it. Do NOT read more into this than it is: measured with
       tools/lab/bench-audio.mjs (which counts the nodes Chrome itself reports,
       and whose --leak flag replays the version without these three lines),
       Chrome reclaims a finished voice at the next GC either way — 64 of 78
       nodes with the release, 54 of 64 without, and the audio thread's render
       capacity is the same 0.2% in both. So this is hygiene, not the fix for
       anything: it makes the release immediate and independent of an engine's
       GC rather than trusting every mobile browser to do what Chrome does. */
    function release(node, g) {
      return function () { try { node.disconnect(); g.disconnect(); } catch (e) {} };
    }
    // Rising run of notes — the cheapest "you did something great" cue.
    function arp(freqs, step, dur, type, vol) {
      for (var i = 0; i < freqs.length; i++) {
        (function (f, d) { setTimeout(function () { beep(f, dur || 0.12, type || "triangle", vol); }, d); })(freqs[i], i * (step || 55));
      }
    }
    /* --- Embedded clips ---------------------------------------------------
       Played through WebAudio rather than <audio> elements: a buffer source
       per shot means rapid repeats overlap instead of cutting each other off,
       and `rate` can pitch a sample up as a combo grows. Decoding happens once
       inside unlock() (i.e. in the start gesture, which iOS requires); until a
       buffer is ready the call falls back to an <audio> element so no cue is
       ever silently dropped.                                                */
    var buffers = {}, pending = {}, tags = {};

    function dataToBytes(uri) {
      var b64 = uri.slice(uri.indexOf(",") + 1);
      var bin = atob(b64), n = bin.length, bytes = new Uint8Array(n);
      for (var i = 0; i < n; i++) bytes[i] = bin.charCodeAt(i);
      return bytes.buffer;
    }
    /* A clip is either an embedded data URI (the playable, where the file has
       to be one document) or a URL (the web build, where the same bytes ship
       as a file — a data URI is ~33% bigger and cannot be cached). Both end up
       as the same ArrayBuffer, so nothing below this line knows the difference. */
    function fetchBytes(src, ok, fail) {
      if (src.slice(0, 5) === "data:") {
        try { ok(dataToBytes(src)); } catch (e) { fail(); }
        return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open("GET", src, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = function () { if (xhr.response) ok(xhr.response); else fail(); };
      xhr.onerror = fail;
      try { xhr.send(); } catch (e) { fail(); }
    }
    function decodeAll() {
      var a = actx; if (!a || !a.decodeAudioData) return;
      Object.keys(ASSETS.sounds).forEach(function (k) {
        if (buffers[k] || pending[k]) return;
        pending[k] = true;
        fetchBytes(ASSETS.sounds[k], function (bytes) {
          try {
            a.decodeAudioData(bytes,
              function (buf) { buffers[k] = buf; pending[k] = false; },
              function () { pending[k] = false; });
          } catch (e) { pending[k] = false; }
        }, function () { pending[k] = false; });
      });
    }
    function clip(name, vol, rate) {
      if (muted) return;
      var src = ASSETS.sounds[name]; if (!src) return;
      var a = ensure(), buf = buffers[name];
      if (a && buf) {
        var node = a.createBufferSource(), g = a.createGain();
        node.buffer = buf;
        node.playbackRate.value = rate == null ? 1 : clamp(rate, 0.5, 4);
        g.gain.value = vol == null ? 1 : clamp(vol, 0, 1);
        node.connect(g); g.connect(a.destination);
        node.onended = release(node, g);
        node.start();
        return;
      }
      if (!tags[name]) tags[name] = new Audio(src);            // not decoded yet
      try {
        tags[name].volume = vol == null ? 1 : clamp(vol, 0, 1);
        tags[name].playbackRate = rate == null ? 1 : clamp(rate, 0.5, 4);
        tags[name].currentTime = 0; tags[name].play();
      } catch (e) {}
    }
    /* One cue, two ways to play it: the embedded sample when the game ships
       one under `name`, otherwise the synthesized fallback. The shared shell
       uses this so the end screen sounds designed in a game with an sfx pack
       and still sounds like something in a game with zero assets. `rate` also
       shifts the fallback pitch, so both paths follow the same melody.      */
    function cue(name, vol, rate, freq, dur, type) {
      if (ASSETS.sounds[name]) return clip(name, vol, rate);
      beep((freq || 440) * (rate == null ? 1 : rate), dur, type || "triangle", vol == null ? 0.3 : vol * 0.4);
    }
    function unlock() { var a = ensure(); decodeAll(); return a; }
    return {
      unlock: unlock, beep: beep, arp: arp, clip: clip, cue: cue,
      setMuted: function (v) { muted = !!v; },
      isMuted: function () { return muted; },
      ctx: function () { return actx; },              // no resume: for Music
      buffer: function (name) { return buffers[name] || null; }
    };
  })();

  /* --- Music: a discreet background loop ---------------------------------
     A game ships the track as ASSETS.sounds.music and tunes CONFIG.music
     { volume, fade }. Two things matter for a bed that plays under a whole
     session:

     * it must sit far under the sfx — the default volume is 0.12, and the
       track should never fight the callouts;
     * it must not click when it wraps. Rather than trusting the file to be a
       seamless loop, the same buffer is re-scheduled every (duration - fade)
       seconds and every pass fades in and out over `fade`, so the tail of one
       pass crossfades into the head of the next. Any track loops pleasantly,
       and the very first pass fades in instead of slamming on.

     ONE FILE, SEVERAL BEDS. What loops is a SECTION of the track, and by
     default that section is the whole file at speed. `Music.play(section)`
     names another one:

        Music.play({ from: 76, length: 36 })        // a stretch of the track
        Music.play({ from: 0, length: 40, rate: 0.85, gain: 0.5 })

     `from` and `length` are seconds inside the file, `rate` is the playback
     speed (which pitches it with it) and `gain` a multiplier on
     CONFIG.music.volume. A three-minute track is therefore five different
     beds — one per biome, entering the music at its own offset — plus a
     quiet, slower window for the menus, and none of them costs a byte more
     than the file already costs. The section is what the crossfade loops, so
     "reaching the end" is the seam and it fades out and back in like any
     other pass. Switching section CROSSFADES: the passes in flight fade out
     over `fade` while the new one fades in, so a biome change is not a
     restart and never clicks.

     Scheduling is done with a look-ahead timer against the WebAudio clock,
     which keeps the seam sample-accurate even when the rAF loop is paused.  */
  var Music = (function () {
    var KEY = "music";
    var LOOKAHEAD = 3.0;          // seconds of schedule kept ahead of the clock
    var TICK_MS = 500;
    var TAG_AFTER = 16;           // ticks to wait for the decode before <audio>
    var master = null, timer = null, voices = [], tag = null;
    var playing = false, nextAt = 0, waited = 0, level = 0, fade = 1.6;
    var muted = false;            // the web target's OPTIONS switch, persisted
    var origin = 0;               // audio-clock time of the track's beat 0
    var want = null;              // the section asked for, as the caller wrote it
    var cur = null;               // that section resolved against the buffer

    function cfg() {
      var m = CONFIG.music || {};
      level = m.volume == null ? 0.12 : clamp(m.volume, 0, 1);
      fade  = m.fade   == null ? 1.6  : m.fade;
    }
    /* A section against the DECODED buffer, which is the only place its length
       is known: `from` / `len` are seconds inside the file, so one pass lasts
       len / rate of wall-clock time. `plain` says the section is the whole
       file at speed — the one case where the beat grid (see Beat) still means
       anything, since an offset or a rate moves every beat of it. */
    function resolve(o, dur) {
      var s = o || {};
      var from = clamp(s.from > 0 ? s.from : 0, 0, Math.max(dur - 2, 0));
      var len = s.length > 0 ? Math.min(s.length, dur - from) : dur - from;
      var rate = s.rate > 0 ? clamp(s.rate, 0.25, 4) : 1;
      return {
        from: from, len: Math.max(len, 1), rate: rate,
        gain: s.gain == null ? 1 : clamp(s.gain, 0, 4),
        fade: s.fade > 0 ? s.fade : fade,
        plain: from === 0 && rate === 1 && len >= dur - 0.05
      };
    }
    function same(a, b) {
      return !!a && !!b && a.from === b.from && a.len === b.len &&
             a.rate === b.rate && a.gain === b.gain;
    }
    /* How far one pass advances before the next one is queued, in seconds of
       the FILE. A beat-locked track (CONFIG.music.bpm + loopBeats, see Beat)
       advances by a whole number of beats, so the pulse crosses the seam
       without shifting and the musical clock stays valid for the whole
       session; whatever is left of the section past that point is what the
       crossfade eats. Any other track keeps the plain "length minus fade"
       wrap.                                                                 */
    function advance(s) {
      var m = CONFIG.music || {};
      if (s.plain && m.bpm > 0 && m.loopBeats > 0) {
        var body = m.loopBeats * 60 / m.bpm;
        if (body > 0.5 && body <= s.len) return body;
      }
      return s.len - Math.min(s.fade, s.len * 0.45);
    }
    // Queue passes until the schedule reaches LOOKAHEAD past "now".
    function schedule(a, buf) {
      var s = cur, adv = advance(s);
      var f = clamp(s.len - adv, 0.05, s.len * 0.45);
      // The same three lengths in wall-clock seconds: a rate stretches a pass.
      var pass = s.len / s.rate, wf = f / s.rate, wadv = adv / s.rate;
      while (nextAt < a.currentTime + LOOKAHEAD) {
        var at = Math.max(nextAt, a.currentTime + 0.05);
        var src = a.createBufferSource(), g = a.createGain();
        src.buffer = buf;
        if (s.rate !== 1) src.playbackRate.value = s.rate;
        /* The section's own level lives on the PASS, not on the master: the
           master is what duck() and pause() own, and putting the level here is
           what makes a switch between two sections of different volume one
           crossfade instead of a ramp across both of them. */
        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(s.gain, at + wf);
        g.gain.setValueAtTime(s.gain, at + pass - wf);
        g.gain.linearRampToValueAtTime(0.0001, at + pass);
        src.connect(g); g.connect(master);
        src.onended = function () { try { src.disconnect(); g.disconnect(); } catch (e) {} };
        src.start(at, s.from, s.len);
        src.stop(at + pass + 0.1);
        voices.push({ src: src, gain: g });
        if (voices.length > 6) voices.shift();
        // Beat 0 of the first pass anchors the grid: every later pass lands a
        // whole number of beats after it, so the anchor never moves.
        if (!origin && s.plain) origin = at + ((CONFIG.music || {}).beatOffset || 0);
        nextAt = at + wadv;                     // next pass overlaps the tail
      }
    }
    /* Top the schedule up, resolving the section asked for now that the buffer
       is there to resolve it against. Called on the look-ahead timer, and
       straight away whenever something changes the section. */
    function pump() {
      var a = Sound.ctx(); if (!a || !playing) return;
      var buf = Sound.buffer(KEY);
      if (!buf) { if (++waited > TAG_AFTER) startTag(ASSETS.sounds[KEY]); return; }
      if (!cur) cur = resolve(want, buf.duration);
      if (!nextAt) nextAt = a.currentTime + 0.08;
      schedule(a, buf);
    }
    /* Last resort: the browser's own loop, seam included. Only used when
       decodeAudioData never came back (some WebViews refuse long data URIs).
       A section is honoured as far as an <audio> element can — the entry
       point, the rate and the level — but the loop is the whole file: there is
       no way to wrap an element on a window of it. */
    function startTag(src) {
      if (tag) return;
      var s = want || {};
      try {
        tag = new Audio(src);
        tag.loop = true;
        tag.volume = clamp(level * (s.gain == null ? 1 : s.gain), 0, 1);
        if (s.rate > 0) tag.playbackRate = s.rate;
        if (s.from > 0) { try { tag.currentTime = s.from; } catch (e) {} }
        tag.play();
      } catch (e) {}
    }
    function begin() {
      var src = ASSETS.sounds[KEY];
      if (!src || playing || muted) return;
      var a = Sound.unlock();                   // context + kicks the decode off
      if (!a) return;
      cfg();
      playing = true; nextAt = 0; waited = 0; origin = 0; cur = null;
      master = a.createGain();
      master.gain.value = level;
      master.connect(a.destination);
      pump();                     // already decoded (a replay): start at once
      timer = setInterval(pump, TICK_MS);
    }
    /* Three ways in, one behaviour:

         arm(section)     the bed's section from now on, nothing audible yet
         start()          make whatever is armed play — the motor's own call,
                          once per round, and it is a no-op mid-bed
         play(section)    both: switch the running bed to this section

       `arm` is what keeps the order of a round's wiring honest. The bootstrap
       arms the round's default (CONFIG.music.round) BEFORE Game.reset(), so a
       game that picks its own stretch there simply wins, and nothing was
       scheduled in between for the switch to fade out. Asking for the section
       already in force does nothing at all, so a game may call play() on every
       reset() without ever restarting its own music. */
    function arm(o) { want = o || null; }
    function apply() {
      if (!playing) { begin(); return; }
      var a = Sound.ctx(), buf = Sound.buffer(KEY);
      if (!a || !buf) { cur = null; nextAt = 0; return; }   // pump will resolve it
      var next = resolve(want, buf.duration);
      if (same(cur, next)) return;
      cur = next;
      fadeOut(a, next.fade);
      nextAt = 0;                               // the new section starts now
      pump();
    }
    function start(o) { if (o) arm(o); apply(); }
    function play(o) { arm(o); apply(); }
    // Let go of every pass in flight over `secs`, leaving the master alone.
    function fadeOut(a, secs) {
      var t = a.currentTime, dying = voices;
      voices = [];
      for (var i = 0; i < dying.length; i++) {
        var g = dying[i].gain, src = dying[i].src;
        try {
          g.gain.cancelScheduledValues(t);
          g.gain.setValueAtTime(g.gain.value, t);
          g.gain.linearRampToValueAtTime(0.0001, t + secs);
          src.stop(t + secs + 0.05);
        } catch (e) {}
      }
    }
    function ramp(to, secs) {
      var a = Sound.ctx(); if (!a || !master) return;
      var t = a.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(Math.max(to, 0.0001), t + secs);
      if (tag) tag.volume = clamp(to * (cur ? cur.gain : 1), 0, 1);
    }
    /* Suspending the context freezes its clock, so every pass already queued
       stays exactly where it was and the loop resumes without a gap.        */
    function pause() {
      if (!playing) return;
      ramp(0, 0.25);
      if (tag) { try { tag.pause(); } catch (e) {} }
      setTimeout(function () {
        var a = Sound.ctx();
        if (a && playing && a.state === "running") a.suspend();
      }, 300);
    }
    function resume() {
      if (!playing) return;
      var a = Sound.ctx(); if (!a) return;
      if (a.state === "suspended") a.resume();
      if (tag) { try { tag.play(); } catch (e) {} }
      pump();                                   // top the schedule back up
      ramp(level, 0.6);
    }
    // Duck under a moment that needs the foreground (0..1 of the base level).
    function duck(factor, secs) { ramp(level * clamp(factor, 0, 1), secs == null ? 0.4 : secs); }
    function stop(secs) {
      if (!playing) return;
      var out = secs == null ? fade : secs;
      ramp(0, out);
      clearInterval(timer); timer = null; playing = false; origin = 0; cur = null;
      var dying = voices, dyingTag = tag;
      voices = []; tag = null;
      setTimeout(function () {
        for (var i = 0; i < dying.length; i++) { try { dying[i].src.stop(); } catch (e) {} }
        if (dyingTag) { try { dyingTag.pause(); } catch (e) {} }
      }, out * 1000 + 100);
    }
    /* Unlike the sfx switch this one has work to do in both directions: a bed
       already scheduled has to be torn down, and one turned back on has to be
       started again — the motor only calls start() when a round begins. The
       section asked for last is kept, so it comes back on the same bed. */
    function setMuted(v) {
      v = !!v;
      if (v === muted) return;
      muted = v;
      if (v) stop(0.25);
      else start();                       // no-op when the game ships no track
    }
    return {
      start: start, arm: arm, play: play, stop: stop, pause: pause, resume: resume, duck: duck,
      setMuted: setMuted, isMuted: function () { return muted; },
      unduck: function (secs) { ramp(level, secs == null ? 0.6 : secs); },
      isPlaying: function () { return playing; },
      // Audio-clock time of the track's beat 0 (0 until a pass is scheduled).
      // Always 0 for a section that is not the whole file at speed: an offset
      // or a rate moves every beat, so there is no grid left to ride.
      beatOrigin: function () { return origin; }
    };
  })();

  /* --- Beat: the musical clock -------------------------------------------
     For a game whose action is written on the music. Declare the tempo of the
     track next to its mix in CONFIG.music:

        music: { volume: 0.10, fade: 2.0, bpm: 128, beatOffset: 0.43,
                 loopBeats: 64 }

     `bpm` is the tempo, `beatOffset` where the first beat sits inside the
     buffer (seconds — count the encoder's silence in), and `loopBeats` how many
     beats of the file the loop keeps: Music then wraps on exactly that many
     beats, so the grid survives the seam instead of shifting on every pass.
     Measure the three with a beat tracker (or by hand on the waveform) and
     check that loopBeats * 60 / bpm is a little shorter than the file.

     Beat turns that into a clock in beats and keeps it locked to the WebAudio
     clock that actually plays the track, so a mechanic written against it lands
     on the audible beat instead of drifting off it over a round:

        Beat.beats()          musical time in beats since the track's beat 0
        Beat.next(div)        the next grid line, `div` slots per beat
        Beat.pulse(div)       1 on the grid line, falling to 0 before the next
        Beat.seconds(beats)   beats -> seconds, for windows and durations

     Two details make it usable in an ad:

     * It never waits for the music. The clock runs off `dt` from the first
       frame, so the game is on-beat even when the track never decodes — or when
       the creative is muted, which is the common case.
     * It corrects instead of snapping. The phase error against the audio clock
       is folded to the nearest beat and walked out at half a beat per second,
       so locking on (and coming back from a backgrounded tab) stays invisible
       and nothing already in flight jumps.
     ---------------------------------------------------------------------- */
  var Beat = (function () {
    var period = 0;             // seconds per beat, 0 = the game is not on a grid
    var t = 0;                  // musical time, in seconds
    var locked = false;         // riding the audio clock rather than dt
    function reset() {
      var m = CONFIG.music || {};
      period = m.bpm > 0 ? 60 / m.bpm : 0;
      t = 0; locked = false;
    }
    function update(dt) {
      if (!period) return;
      t += dt;
      var a = Sound.ctx(), o = Music.beatOrigin();
      if (!o || !a || a.state !== "running") { locked = false; return; }
      var err = (a.currentTime - o) - t;
      err -= Math.round(err / period) * period;   // nearest beat: phase, not count
      t += clamp(err, -period * 0.5 * dt, period * 0.5 * dt);
      locked = true;
    }
    function beats() { return period ? t / period : 0; }
    return {
      reset: reset, update: update, beats: beats,
      on:      function () { return period > 0; },
      locked:  function () { return locked; },
      period:  function () { return period; },
      seconds: function (b) { return b * period; },
      // Next grid line, `div` slots per beat (1 = beat, 2 = eighth, 4 = 16th).
      next: function (div) {
        var d = div || 1;
        return Math.ceil(beats() * d + 1e-6) / d;
      },
      // 1 the instant a grid line passes, 0 just before the next one.
      pulse: function (div) {
        var d = div || 1, b = beats() * d;
        return 1 - (b - Math.floor(b));
      }
    };
  })();

  /* --- Storage / random ---------------------------------------------------
     Store is localStorage with an in-memory map behind it. On our own origin
     the map is only a mirror; inside a sandboxed iframe (itch, a portal) a
     browser that blocks third-party storage makes localStorage *throw*, and
     without the map `set` would swallow the error and the very next `get`
     would hand back the default — a best score would not survive even the
     current session, and every retention number measured there would be
     false. The map turns that into session-scoped persistence. */
  var Store = (function () {
    var mem = {};

    /* ONE BEST SCORE PER GAME. The split site build serves the thirteen from
       ONE origin (/games/<slug>/), so the bare "bestScore" key every game
       writes was shared by all of them — a high score in vipera showed up in
       slipdeck. The key is renamed here rather than in thirteen games: a game
       that knows its slug (CONFIG.slug, injected by the web build) reads and
       writes "best:<slug>" wherever it asks for "bestScore", and section 6
       needs no edit. A playable is alone in its own origin and keeps the bare
       key. "webLang" and "webSettings" stay shared on purpose: one language
       and one sound choice for the whole site. */
    function real(k) {
      return (k === "bestScore" && CONFIG.slug) ? "best:" + CONFIG.slug : k;
    }

    function get(k, d) {
      k = real(k);
      try {
        var v = localStorage.getItem(k);
        if (v !== null) return JSON.parse(v);
      } catch (e) {}
      return mem.hasOwnProperty(k) ? mem[k] : d;
    }
    function set(k, v) {
      k = real(k);
      mem[k] = v;                                   // always, so a blocked write still holds
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    }
    /* Dropping a key is not the same as setting it to a default: a rename has
       to leave nothing behind, or the old name keeps being adopted by whoever
       reads it next. */
    function del(k) {
      k = real(k);
      delete mem[k];
      try { localStorage.removeItem(k); } catch (e) {}
    }

    /* The rename, once. Whichever game is opened first adopts what the shared
       key held; the key is then dropped so it cannot hand the other twelve a
       score they never made. */
    (function migrate() {
      if (!CONFIG.slug) return;
      var old = null;
      try { old = localStorage.getItem("bestScore"); } catch (e) {}
      if (old === null) return;
      try {
        if (localStorage.getItem(real("bestScore")) === null) set("bestScore", JSON.parse(old));
        localStorage.removeItem("bestScore");
      } catch (e) {}
    })();

    return { get: get, set: set, del: del };
  })();
  /* --- Lang: the one place a word is translated --------------------------

     A game is WRITTEN in English — `CONFIG.copy`, every `Pop.show` word, every
     HUD label, every end-screen row — and its French is a DICTIONARY in its
     manifest (`web.copy.<lang>.strings`), keyed by the English string itself.
     No game invents a key, and a missing entry falls back to the English
     rather than to an empty box.

     `Lang.t` is applied where the motor WRITES the word (Pop, the HUD, the end
     screen, CONFIG.copy), so a game needs no change for the whole of what it
     says to switch language. The one exception is a word a game BUILDS —
     `"x" + mult + " STREAK"` reaches the motor already assembled and no
     dictionary can match it — and there the game wraps its own literal:
     `Lang.t(" STREAK")`. It is evaluated at the call site, every round, which
     is what makes the switch live.

     Nothing is set on a playable: no `CONFIG.web`, no dictionary, `t` is the
     identity, and an ad creative ships in one language as it always has. */
  var Lang = (function () {
    var code = "en", dict = null;

    // `code` is informative; the dictionary is what translates.
    function set(c, d) {
      code = c || "en";
      dict = (d && typeof d === "object") ? d : null;
    }

    /* Anything that is not a string is handed back untouched: the HUD's own
       value is a number more often than not, and a game should never have to
       ask whether a slot holds a word before it fills it. */
    function t(s) {
      if (!dict || typeof s !== "string") return s;
      var v = dict[s];
      return typeof v === "string" ? v : s;
    }

    return { set: set, t: t, code: function () { return code; } };
  })();

  /* --- upper: the one way a word is set in capitals -----------------------

     Every string in this repo is WRITTEN in normal case — a lowercase
     sentence with a capital on its first letter and on a proper noun ("Best
     score", "Time's up!", "Chain x"). Capitals are a LOOK, not a spelling, so
     the screens that want them ask for them here: the HUD, the callouts, the
     buttons and the end screen pass what they write through `upper`, and the
     copy desk shows a game's words the way a human would proofread them
     rather than the way a title screen shouts them.

     Two things it does that `toUpperCase` does not.

     ACCENTS COME OFF. A capital carries no accent in this house — "Déjà" is
     "DEJA", "Ça mélange" is "CA MELANGE" — because the display faces the games
     use are drawn for capitals without diacritics, and an accent on a 96px
     Impact collides with the line above it. Folding happens after the case
     change, so only the uppercase forms need a table.

     A UNIT GLUED TO A NUMBER KEEPS ITS CASE. "Chain x" + 3 is "CHAIN x3", not
     "CHAIN X3"; "1.2s per hop" is "1.2s PER HOP". A run of lowercase letters
     touching a digit is a multiplier or a unit, never a word, and a game
     assembles those by concatenation — which is why the rule is applied here,
     on the finished string, rather than left to each call site.

     Markup is stepped over: a tag, an entity and a `{placeholder}` are copied
     as they are, so a class name cannot be shouted into a different class and
     a token cannot be shouted out of the one `fill` will look for. */
  var upper = (function () {
    // Uppercase letters an accent has to come off, and what they become.
    var FROM = "ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝŸ";
    var TO   = "AAAAAACEEEEIIIINOOOOOOUUUUYY";
    // The ligatures, which fold to two letters instead of one.
    var PAIR = { "Æ": "AE", "Œ": "OE", "ß": "SS" };
    /* A tag, an entity, or a {placeholder}: copied through untouched. The
       placeholder is in here for the same reason a class name is — "Day {n}"
       shouted to "DAY {N}" is a token `fill` no longer recognises, and the
       screen then prints the braces. It cost a strip of the daily road reading
       "J{N}" seven times over to find. */
    var SKIP = /(<[^>]*>|&[a-zA-Z0-9#]+;|\{\w+\})/;
    // A word: ASCII plus the Latin-1 lowercase letters and the oe ligature.
    var WORD = /[a-zß-öø-ÿœ]+/g;
    function digit(c) { return c >= "0" && c <= "9"; }

    function shout(seg) {
      return seg.replace(WORD, function (run, at) {
        var before = at > 0 ? seg.charAt(at - 1) : "";
        var after = seg.charAt(at + run.length);
        if (digit(before) || digit(after)) return run;   // a unit or a multiplier
        return run.toUpperCase();
      });
    }

    function fold(seg) {
      var out = "", i, c, k;
      for (i = 0; i < seg.length; i++) {
        c = seg.charAt(i);
        if (PAIR[c]) { out += PAIR[c]; continue; }
        k = FROM.indexOf(c);
        out += k < 0 ? c : TO.charAt(k);
      }
      return out;
    }

    /* Anything that is not a string is handed back untouched: a HUD slot holds
       a number more often than a word, and no caller should have to ask. */
    return function (s) {
      if (typeof s !== "string") return s;
      var parts = s.split(SKIP), i;
      for (i = 0; i < parts.length; i += 2) parts[i] = fold(shout(parts[i]));
      return parts.join("");
    };
  })();

  var Rand = {
    range: function (a, b) { return a + Math.random() * (b - a); },
    int:   function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick:  function (arr)  { return arr[Math.floor(Math.random() * arr.length)]; },
    chance:function (p)    { return Math.random() < p; }
  };

  // --- Image preloader ----------------------------------------------------
  /* Two registries load here, and only one of them is published.

     ASSETS.images is the game's own — sprites, logos, the Lucide icons — and
     lands in `Images[key]` for the game to draw.

     CONFIG.art is the painted artwork the builder injects out of assets/image/embed/
     (see tools/lab/encode-art.mjs). Nothing draws it on the canvas: the shell
     hands it to an <img> and to a CSS background, so the browser is the one
     that needs it, not the game. It is decoded here all the same, because the
     loading screen is the only moment where waiting for it is free — the
     logotype IS the intro's headline, and a 35 KB WebP that decodes after the
     screen is up shows as a blank where the title goes.

     It lands in `ArtImages`, not in `Images`: those keys belong to the game,
     and a picture called `title` must never collide with a sprite called
     `title`. A game that wants to DRAW one of its own art files on the canvas
     reads it from there — `games/slipdeck` paints `ArtImages.cardKing` into the
     middle of a court card. */
  var Images = {};
  var ArtImages = {};
  function preloadImages(done) {
    var keys = Object.keys(ASSETS.images);
    var art = CONFIG.art ? Object.keys(CONFIG.art) : [];
    var left = keys.length + art.length;
    if (left === 0) return done();
    function tick() { if (--left === 0) done(); }
    keys.forEach(function (k) {
      var img = new Image();
      img.onload = img.onerror = tick;
      img.src = ASSETS.images[k];
      Images[k] = img;
    });
    art.forEach(function (k) {
      var img = new Image();
      img.onload = img.onerror = tick;
      img.src = CONFIG.art[k];
      ArtImages[k] = img;
    });
  }

  /* --- Icons: embedded SVGs, tinted and cached --------------------------
     Pictograms come from the repo's Lucide pack (assets/motor/lucide/), encoded per
     game with tools/lab/embed-icon.mjs and listed in ASSETS.images under an "ico"
     key. They are authored white, because an <img> has no `currentColor` to
     resolve, so every draw goes through here: the icon is rasterized once per
     size+colour into an offscreen canvas (a "source-in" fill turns the white
     artwork into a mask) and blitted afterwards. Never drawImage the raw SVG.

       Icon.draw(ctx, "icoBomb", cx, cy, 26, "#2a1400");   // centred + tinted
       var cv = Icon.get("icoBomb", 26, "#ffffff");        // the canvas itself

     Icons load with the rest of ASSETS.images, i.e. before the intro shows, so
     a sprite built in Game.reset() always finds them decoded. */
  var Icon = (function () {
    var cache = {};
    function get(key, size, color) {
      var id = key + "|" + size + "|" + color, img = Images[key], cv, x;
      if (cache[id]) return cache[id];
      if (!img || !img.complete || !img.naturalWidth) return null;
      cv = document.createElement("canvas");
      cv.width = cv.height = Math.max(1, Math.round(size));
      x = cv.getContext("2d");
      x.drawImage(img, 0, 0, cv.width, cv.height);
      x.globalCompositeOperation = "source-in";       // keep the artwork's alpha
      x.fillStyle = color || "#ffffff";
      x.fillRect(0, 0, cv.width, cv.height);
      cache[id] = cv;
      return cv;
    }
    function draw(c, key, cx, cy, size, color) {
      var cv = get(key, size, color);
      if (cv) c.drawImage(cv, cx - size / 2, cy - size / 2, size, size);
      return !!cv;
    }
    return { get: get, draw: draw, clear: function () { cache = {}; } };
  })();

  // --- Colour helper: "#rrggbb" -> "rgba(r,g,b,a)" ------------------------
  function rgba(hex, a) {
    var h = String(hex).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  /* --- Fx: the shared canvas juice layer --------------------------------
     Particles, expanding rings, floating world-space text, screen shake,
     colour flash and hit-stop — the things every playable needs and no game
     should re-implement. The engine drives it:
        update: Fx.update(dt)
        render: Fx.begin() -> Game.render() -> Fx.render() -> Fx.end() -> Fx.post()
     so a game only draws its world and calls the spawners.
     -------------------------------------------------------------------- */
  var Fx = (function () {
    var MAX_PARTICLES = 260;
    var parts = [], rings = [];
    var shakeMag = 0, shakeT = 0, shakeDur = 1;
    var flashCol = "#ffffff", flashA = 0, flashDecay = 1.8;
    var freezeT = 0;

    function reset() {
      parts.length = 0; rings.length = 0;
      shakeMag = 0; shakeT = 0; flashA = 0; freezeT = 0;
    }

    // A burst of dots. opt: {color, count, speed, size, life, grav, spread}
    function burst(x, y, opt) {
      opt = opt || {};
      var n = opt.count || 10;
      if (parts.length + n > MAX_PARTICLES) n = Math.max(0, MAX_PARTICLES - parts.length);
      var color = opt.color || "#ffffff", sp = opt.speed || 320, grav = opt.grav == null ? 0 : opt.grav;
      var base = opt.angle == null ? null : opt.angle, spread = opt.spread == null ? Math.PI * 2 : opt.spread;
      for (var i = 0; i < n; i++) {
        var a = base == null ? Rand.range(0, Math.PI * 2) : base + Rand.range(-spread / 2, spread / 2);
        var s = sp * Rand.range(0.45, 1.15);
        parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, grav: grav,
          life: (opt.life || 0.5) * Rand.range(0.7, 1.2), max: (opt.life || 0.5) * 1.2,
          r: (opt.size || 5) * Rand.range(0.6, 1.2),
          color: color instanceof Array ? Rand.pick(color) : color
        });
      }
    }

    // An expanding ring. opt: {from, to, color, width, life}
    function ring(x, y, opt) {
      opt = opt || {};
      rings.push({ x: x, y: y, r: opt.from || 10, max: opt.to || 140,
        color: opt.color || "#ffffff", width: opt.width || 4,
        life: opt.life || 0.4, maxLife: opt.life || 0.4 });
    }

    /* There is no Fx.text: the words a game writes all live in `Pop` —
       `Pop.show` for the beat, `Pop.text` for the floating number — so a game
       has one notification system, not two. Pop draws its canvas half inside
       this module's render pass (see bootstrap.js), which is why the number
       still rides the shake. */

    function shake(mag, dur) {
      var cur = shakeT > 0 ? shakeMag * (shakeT / shakeDur) : 0;
      if (mag > cur) { shakeMag = mag; shakeT = dur || 0.3; shakeDur = dur || 0.3; }
    }
    function flash(color, a, decay) {
      flashCol = color || "#ffffff";
      flashA = Math.max(flashA, a == null ? 0.3 : a);
      flashDecay = decay || 1.8;
    }
    // Hit-stop: freeze the simulation for a beat so an impact lands harder.
    function freeze(t) { freezeT = Math.max(freezeT, t); }
    function frozen(dt) { if (freezeT > 0) { freezeT -= dt; return true; } return false; }

    function update(dt) {
      var i;
      for (i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt;
        p.vx *= 0.98; p.life -= dt;
        if (p.life <= 0) parts.splice(i, 1);
      }
      for (i = rings.length - 1; i >= 0; i--) { rings[i].life -= dt; if (rings[i].life <= 0) rings.splice(i, 1); }
      if (shakeT > 0) shakeT -= dt;
      if (flashA > 0) flashA = Math.max(0, flashA - dt * flashDecay);
    }

    function begin() {
      ctx.save();
      if (shakeT > 0) {
        var s = shakeMag * (shakeT / shakeDur);
        ctx.translate(Rand.range(-s, s), Rand.range(-s, s));
      }
    }
    function end() { ctx.restore(); }

    function render() {
      var i;
      // rings
      for (i = 0; i < rings.length; i++) {
        var rg = rings[i], t = rg.life / rg.maxLife;
        ctx.globalAlpha = t * 0.75;
        ctx.strokeStyle = rg.color; ctx.lineWidth = rg.width * t;
        ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r + (rg.max - rg.r) * (1 - t), 0, Math.PI * 2); ctx.stroke();
      }
      // particles
      for (i = 0; i < parts.length; i++) {
        var p = parts[i];
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Full-frame flash, drawn outside the shake transform.
    function post() {
      if (flashA <= 0) return;
      ctx.globalAlpha = clamp(flashA, 0, 0.85);
      ctx.fillStyle = flashCol;
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.globalAlpha = 1;
    }

    return { reset: reset, burst: burst, ring: ring, shake: shake,
             flash: flash, freeze: freeze, frozen: frozen,
             update: update, begin: begin, end: end, render: render, post: post };
  })();

  // --- Confetti: end-screen celebration on its own canvas ----------------
  var Confetti = (function () {
    var cvs = null, cx = null, parts = [], running = false, last = 0;
    var COLORS = ["#00e5ff", "#ff2d95", "#ffd43b", "#39ff14", "#c86bff", "#ff6b35", "#ffffff"];
    function ensure() {
      if (cvs) return true;
      cvs = $("confetti"); if (!cvs) return false;
      cx = cvs.getContext("2d");
      var dpr = pixelRatio(view.scale);          // same rule as the game canvas
      cvs.width = Math.round(view.w * dpr); cvs.height = Math.round(view.h * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }
    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      cx.clearRect(0, 0, view.w, view.h);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt;
        if (p.life <= 0 || p.y > view.h + 40) { parts.splice(i, 1); continue; }
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
        cx.globalAlpha = clamp(p.life, 0, 1); cx.fillStyle = p.color;
        cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
      }
      if (parts.length) requestAnimationFrame(frame);
      else { running = false; cx.clearRect(0, 0, view.w, view.h); }
    }
    function burst(n) {
      if (!ensure()) return;
      for (var i = 0; i < n; i++) {
        parts.push({
          x: view.w * Rand.range(0.15, 0.85), y: view.h * Rand.range(0.26, 0.4),
          vx: Rand.range(-560, 560), vy: Rand.range(-900, -280),
          rot: Rand.range(0, 6.28), vr: Rand.range(-6, 6),
          w: Rand.range(10, 22), h: Rand.range(14, 34),
          color: Rand.pick(COLORS), life: Rand.range(1.8, 3.2)
        });
      }
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    }
    function clear() { parts.length = 0; if (cx) cx.clearRect(0, 0, view.w, view.h); }
    return { burst: burst, clear: clear };
  })();

