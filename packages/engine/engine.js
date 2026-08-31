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
    insetTop: 0,       // design px eaten by the notch / status bar
    insetBottom: 0     // design px eaten by the home indicator
  };

  // The rectangle gameplay may safely use: below the HUD, above the CTA bar,
  // and clear of the device insets. Recomputed on every resize.
  var Layout = { top: 0, bottom: 0, left: 0, right: 0, w: 0, h: 0, cx: 0, cy: 0 };

  // env(safe-area-inset-*) is only observable through a probe element.
  function safeInsets() {
    var cs = window.getComputedStyle($("safe-probe"));
    return { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
  }

  function fitCanvas() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);   // cap DPR for perf
    var scale = Math.min(vw / view.w, vh / view.h);
    view.scale = scale;

    // Backing store at design size x DPR; the frame transform does the rest.
    canvas.width  = Math.round(view.w * dpr);
    canvas.height = Math.round(view.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);                // draw in design px
    cssVar("--scale", scale);

    // Letterbox bars already push the frame away from the notch: only the
    // remaining overlap has to be padded, converted to design px.
    var ins = safeInsets(), bar = Math.max(0, (vh - view.h * scale) / 2);
    view.insetTop    = Math.max(0, (ins.top - bar) / scale);
    view.insetBottom = Math.max(0, (ins.bottom - bar) / scale);
    cssVar("--inset-top", view.insetTop.toFixed(1) + "px");
    cssVar("--inset-bottom", view.insetBottom.toFixed(1) + "px");

    relayout();
  }

  function relayout() {
    var m = CONFIG.layout;
    Layout.top    = view.insetTop + m.hudHeight;
    Layout.bottom = view.h - view.insetBottom - m.ctaHeight;
    Layout.left   = m.sideMargin;
    Layout.right  = view.w - m.sideMargin;
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
    var running = false, paused = false, last = 0, u = null, r = null;
    function frame(now) {
      if (!running) return;
      var dt = Math.min((now - last) / 1000, 0.05);   // clamp tab-switch gaps
      last = now;
      if (!paused) { if (u) u(dt); if (r) r(); }
      requestAnimationFrame(frame);
    }
    return {
      start: function (uu, rr) { u = uu; r = rr; running = true; paused = false; last = performance.now(); requestAnimationFrame(frame); },
      stop:  function () { running = false; },
      pause: function () { paused = true; },
      resume:function () { paused = false; last = performance.now(); },
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
    function ensure() {
      if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
      if (actx && actx.state === "suspended") actx.resume();   // iOS: user gesture
      return actx;
    }
    function beep(freq, dur, type, vol) {
      var a = ensure(); if (!a) return;
      var o = a.createOscillator(), g = a.createGain(), v = (vol == null ? 0.3 : vol);
      o.type = type || "sine"; o.frequency.value = freq || 440;
      g.gain.setValueAtTime(0.001, a.currentTime);
      g.gain.exponentialRampToValueAtTime(v, a.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + (dur || 0.15));
      o.connect(g); g.connect(a.destination);
      o.start(); o.stop(a.currentTime + (dur || 0.15));
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
    function decodeAll() {
      var a = actx; if (!a || !a.decodeAudioData) return;
      Object.keys(ASSETS.sounds).forEach(function (k) {
        if (buffers[k] || pending[k]) return;
        pending[k] = true;
        try {
          a.decodeAudioData(dataToBytes(ASSETS.sounds[k]),
            function (buf) { buffers[k] = buf; pending[k] = false; },
            function () { pending[k] = false; });
        } catch (e) { pending[k] = false; }
      });
    }
    function clip(name, vol, rate) {
      var src = ASSETS.sounds[name]; if (!src) return;
      var a = ensure(), buf = buffers[name];
      if (a && buf) {
        var node = a.createBufferSource(), g = a.createGain();
        node.buffer = buf;
        node.playbackRate.value = rate == null ? 1 : clamp(rate, 0.5, 4);
        g.gain.value = vol == null ? 1 : clamp(vol, 0, 1);
        node.connect(g); g.connect(a.destination);
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

     Scheduling is done with a look-ahead timer against the WebAudio clock,
     which keeps the seam sample-accurate even when the rAF loop is paused.  */
  var Music = (function () {
    var KEY = "music";
    var LOOKAHEAD = 3.0;          // seconds of schedule kept ahead of the clock
    var TICK_MS = 500;
    var TAG_AFTER = 16;           // ticks to wait for the decode before <audio>
    var master = null, timer = null, voices = [], tag = null;
    var playing = false, nextAt = 0, waited = 0, level = 0, fade = 1.6;
    var origin = 0;               // audio-clock time of the track's beat 0

    function cfg() {
      var m = CONFIG.music || {};
      level = m.volume == null ? 0.12 : clamp(m.volume, 0, 1);
      fade  = m.fade   == null ? 1.6  : m.fade;
    }
    /* How far one pass advances before the next one is queued. A beat-locked
       track (CONFIG.music.bpm + loopBeats, see Beat) advances by a whole number
       of beats, so the pulse crosses the seam without shifting and the musical
       clock stays valid for the whole session; whatever is left of the buffer
       past that point is what the crossfade eats. Any other track keeps the
       plain "duration minus fade" wrap.                                      */
    function advance(dur) {
      var m = CONFIG.music || {};
      if (m.bpm > 0 && m.loopBeats > 0) {
        var body = m.loopBeats * 60 / m.bpm;
        if (body > 0.5 && body <= dur) return body;
      }
      return dur - Math.min(fade, dur * 0.45);
    }
    // Queue passes until the schedule reaches LOOKAHEAD past "now".
    function schedule(a, buf) {
      var dur = buf.duration, adv = advance(dur);
      var f = clamp(dur - adv, 0.05, dur * 0.45);
      while (nextAt < a.currentTime + LOOKAHEAD) {
        var at = Math.max(nextAt, a.currentTime + 0.05);
        var src = a.createBufferSource(), g = a.createGain();
        src.buffer = buf;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.linearRampToValueAtTime(1, at + f);
        g.gain.setValueAtTime(1, at + dur - f);
        g.gain.linearRampToValueAtTime(0.0001, at + dur);
        src.connect(g); g.connect(master);
        src.start(at);
        src.stop(at + dur + 0.1);
        voices.push(src);
        if (voices.length > 4) voices.shift();
        // Beat 0 of the first pass anchors the grid: every later pass lands a
        // whole number of beats after it, so the anchor never moves.
        if (!origin) origin = at + ((CONFIG.music || {}).beatOffset || 0);
        nextAt = at + adv;                      // next pass overlaps the tail
      }
    }
    // Last resort: the browser's own loop, seam included. Only used when
    // decodeAudioData never came back (some WebViews refuse long data URIs).
    function startTag(src) {
      if (tag) return;
      try {
        tag = new Audio(src);
        tag.loop = true; tag.volume = level;
        tag.play();
      } catch (e) {}
    }
    function start() {
      var src = ASSETS.sounds[KEY];
      if (!src || playing) return;
      var a = Sound.unlock();                   // context + kicks the decode off
      if (!a) return;
      cfg();
      playing = true; nextAt = 0; waited = 0; origin = 0;
      master = a.createGain();
      master.gain.value = level;
      master.connect(a.destination);
      function pump() {
        var buf = Sound.buffer(KEY);
        if (!buf) { if (++waited > TAG_AFTER) startTag(src); return; }
        if (!nextAt) nextAt = a.currentTime + 0.08;
        schedule(a, buf);
      }
      pump();                     // already decoded (a replay): start at once
      timer = setInterval(pump, TICK_MS);
    }
    function ramp(to, secs) {
      var a = Sound.ctx(); if (!a || !master) return;
      var t = a.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(Math.max(to, 0.0001), t + secs);
      if (tag) tag.volume = clamp(to, 0, 1);
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
      var buf = Sound.buffer(KEY);
      if (buf && nextAt) schedule(a, buf);      // top the schedule back up
      ramp(level, 0.6);
    }
    // Duck under a moment that needs the foreground (0..1 of the base level).
    function duck(factor, secs) { ramp(level * clamp(factor, 0, 1), secs == null ? 0.4 : secs); }
    function stop(secs) {
      if (!playing) return;
      var out = secs == null ? fade : secs;
      ramp(0, out);
      clearInterval(timer); timer = null; playing = false; origin = 0;
      var dying = voices, dyingTag = tag;
      voices = []; tag = null;
      setTimeout(function () {
        for (var i = 0; i < dying.length; i++) { try { dying[i].stop(); } catch (e) {} }
        if (dyingTag) { try { dyingTag.pause(); } catch (e) {} }
      }, out * 1000 + 100);
    }
    return {
      start: start, stop: stop, pause: pause, resume: resume, duck: duck,
      unduck: function (secs) { ramp(level, secs == null ? 0.6 : secs); },
      isPlaying: function () { return playing; },
      // Audio-clock time of the track's beat 0 (0 until a pass is scheduled).
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

  // --- Storage / random ---------------------------------------------------
  var Store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var Rand = {
    range: function (a, b) { return a + Math.random() * (b - a); },
    int:   function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick:  function (arr)  { return arr[Math.floor(Math.random() * arr.length)]; },
    chance:function (p)    { return Math.random() < p; }
  };

  // --- Image preloader ----------------------------------------------------
  var Images = {};
  function preloadImages(done) {
    var keys = Object.keys(ASSETS.images), left = keys.length;
    if (left === 0) return done();
    keys.forEach(function (k) {
      var img = new Image();
      img.onload = img.onerror = function () { if (--left === 0) done(); };
      img.src = ASSETS.images[k];
      Images[k] = img;
    });
  }

  /* --- Icons: embedded SVGs, tinted and cached --------------------------
     Pictograms come from the repo's Lucide pack (assets/lucide/), encoded per
     game with tools/embed-icon.mjs and listed in ASSETS.images under an "ico"
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
    var parts = [], rings = [], texts = [];
    var shakeMag = 0, shakeT = 0, shakeDur = 1;
    var flashCol = "#ffffff", flashA = 0, flashDecay = 1.8;
    var freezeT = 0;

    function reset() {
      parts.length = 0; rings.length = 0; texts.length = 0;
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

    // Floating world-space text. tier 0..3 escalates the outline/glow/gradient.
    function text(x, y, str, opt) {
      opt = opt || {};
      texts.push({ x: x, y: y, text: str, color: opt.color || "#ffffff",
        size: opt.size || 34, tier: opt.tier || 0, vy: opt.vy == null ? -70 : opt.vy,
        life: opt.life || 0.9, maxLife: opt.life || 0.9 });
    }

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
      for (i = texts.length - 1; i >= 0; i--) {
        var t = texts[i];
        t.y += t.vy * dt; t.vy *= 0.9; t.life -= dt;
        if (t.life <= 0) texts.splice(i, 1);
      }
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
      // floating text
      for (i = 0; i < texts.length; i++) drawText(texts[i]);
    }

    function drawText(fl) {
      var t = fl.life / fl.maxLife;
      var pop = t > 0.85 ? (1 - t) / 0.15 : 1;                 // quick pop-in
      var scale = 1 + (1 - t) * (fl.tier >= 2 ? 0.45 : fl.tier >= 1 ? 0.25 : 0.12);
      ctx.save();
      ctx.globalAlpha = clamp(Math.min(1, t * 2.2) * pop, 0, 1);
      ctx.translate(fl.x, fl.y); ctx.scale(scale, scale);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "900 " + fl.size + "px -apple-system,Segoe UI,Roboto,sans-serif";
      if (fl.tier >= 3)      { ctx.shadowColor = "#ff44ff"; ctx.shadowBlur = 22; }
      else if (fl.tier >= 2) { ctx.shadowColor = "#ffaa00"; ctx.shadowBlur = 16; }
      else if (fl.tier >= 1) { ctx.shadowColor = "#22ccff"; ctx.shadowBlur = 12; }
      else                   { ctx.shadowColor = "rgba(0,0,0,.7)"; ctx.shadowBlur = 4; }
      ctx.lineWidth = Math.max(4, fl.size * 0.17);
      ctx.strokeStyle = fl.tier >= 3 ? "rgba(80,0,80,.8)" : "rgba(0,0,0,.75)";
      ctx.strokeText(fl.text, 0, 0);
      ctx.shadowBlur = 0;
      if (fl.tier >= 1) {
        var g = ctx.createLinearGradient(0, -fl.size * 0.5, 0, fl.size * 0.5);
        if (fl.tier >= 3)      { g.addColorStop(0, "#ffffff"); g.addColorStop(.3, "#ff88ff"); g.addColorStop(.7, "#ff00cc"); g.addColorStop(1, "#ffbb00"); }
        else if (fl.tier >= 2) { g.addColorStop(0, "#ffffff"); g.addColorStop(.4, "#ffe060"); g.addColorStop(1, "#ff7700"); }
        else                   { g.addColorStop(0, "#e8f8ff"); g.addColorStop(1, fl.color); }
        ctx.fillStyle = g;
      } else { ctx.fillStyle = fl.color; }
      ctx.fillText(fl.text, 0, 0);
      ctx.restore();
    }

    // Full-frame flash, drawn outside the shake transform.
    function post() {
      if (flashA <= 0) return;
      ctx.globalAlpha = clamp(flashA, 0, 0.85);
      ctx.fillStyle = flashCol;
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.globalAlpha = 1;
    }

    return { reset: reset, burst: burst, ring: ring, text: text, shake: shake,
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
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
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

