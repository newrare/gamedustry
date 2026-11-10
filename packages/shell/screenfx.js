  /* --- ScreenFx: the full-screen effects, called by name -------------------

     A game says something to the whole screen at once: the play is frozen,
     the player took a hit, a bonus landed, the boost is on, time is running
     out. Every game used to paint that itself — a tinted fillRect over the
     canvas, a red edge, a painted ice frame drawn by hand — so each one had
     its own colours, its own timings and its own cost. This is the one
     system for it, the way `Notify` is the one voice for information:

       ScreenFx.play("hit")                 a one-shot: in, hold, out
       ScreenFx.play("bonus", { color: "#7cf" })        any field overridden
       ScreenFx.hold("ice")                 on until released (a state that
       ScreenFx.release("ice")              lasts: a freeze, a boost, a shield)
       ScreenFx.clear()                     everything off at once (the motor
                                            calls it when a round is left)
       ScreenFx.define("rage", { … })       a game's own preset, or
       CONFIG.screenFx = { hit: { … } }     a game's retune of a house one

     AN EFFECT IS A STACK OF LAYERS, every one optional — a flat tint, an edge
     coming in from the glass, a crisp line on it, a bloom from a point, a
     painted FRAME, a sunburst, speed lines, cinema bars — under one colour
     pair, one pulse and one entrance. The presets below are what the lab
     page (lab/screen-fx.html) tunes; its *Copy settings* is a preset to paste
     here, and it loads THIS file, so what is tuned there is what ships.

     THE PAINTED FRAMES are the shared ones (assets/image/master/
     game-frame-<theme>.png: ice, lava, slime, mud, water, wind, knight-blue,
     knight-red). A game wears one only once it has adopted it —
     `"frame-ice": "game-frame-ice"` in `art.objects`, which gives
     `CONFIG.art.frameIce` — because a frame is ~140 KB and every game would
     otherwise carry all eight. A preset whose frame the game has not adopted
     falls back to its edge in the same colour, so `hold("ice")` reads as
     frozen in every game, painted or not.

     COST. Over a live canvas, the layer may only ever animate what the
     compositor animates for free: opacity and transform. Every gradient is
     painted ONCE when the effect is built and never repainted; the pulse is
     an opacity, the entrance a scale, the sunburst a rotation, the speed
     lines a stepped transform. No blur, no filter, no box-shadow with a
     blur radius (Overlay.vignette's is the reason this layer exists rather
     than growing it). `?perf=1&off=sfx` takes the layer out on a device.

     It stands under the HUD and over the canvas (#frame, z-index 14 — the
     HUD is 15), so a frame never covers the score. It depends on nothing of
     the motor but `CONFIG` (guarded), which is why the lab page can load
     the file on its own and `mount()` it on a stage of its own. */
  var ScreenFx = (function () {
    var W = 720, H = 1280;

    /* Every field a preset may set, and what it means when it is absent. */
    var BASE = {
      color: "#ff2d2d",    // the effect's colour: tint, edge, line, frame fallback
      color2: "#ffffff",   // the second colour: the bloom, the rays, the lines
      alpha: 1,            // peak opacity of the whole effect
      tint: 0,             // 0..1   a flat fill of `color` over the frame
      edge: 0,             // 0..1   how far `color` reaches in from the glass
      soft: 0.5,           // 0..1   0 = the colour held, 1 = let go at once
      shape: "rim",        // rim (bands along the glass) | round (a vignette)
      line: 0,             // px     a crisp border of `color` on the glass
      glow: 0,             // 0..1   a bloom of `color2` from `at`
      frame: "",           // a shared painted frame: "ice", "lava", "knight-blue"…
      rays: 0,             // count  a sunburst of `color2` from `at`
      raysAlpha: 0.5,      // 0..1   the rays' own strength
      spin: 40,            // deg/s  the sunburst's turn (negative: the other way)
      lines: 0,            // count  speed lines of `color2` rushing to the edges
      linesAlpha: 0.6,     // 0..1   the lines' own strength
      bars: 0,             // px     cinema bars, top and bottom
      pulse: "none",       // none | beat | breathe | flicker | blink | flash
      period: 0.9,         // s      one turn of the pulse
      count: 0,            // turns  0 = for as long as it is up; N = N turns, and a
                           //        one-shot then lasts exactly N periods (its `hold`)
      enter: "fade",       // fade | close | slam
      blend: "normal",     // normal | screen | multiply | overlay
      at: null,            // { x, y } in design px: where the bloom, rays and
                           // lines come from (the frame's centre otherwise)
      "in": 0.12,          // s      fade in
      hold: 0.25,          // s      held at peak (a one-shot only)
      out: 0.45            // s      fade out
    };

    /* THE HOUSE PRESETS — ported from lab/screen-fx.html (Copy settings).
       A name says what HAPPENED, never what it looks like, so a game calls
       `play("hit")` and the look can change here for every game at once. */
    var PRESETS = {
      // the player took a hit: a red rim slammed onto the glass
      hit:      { color: "#ff2d2d", edge: 0.34, soft: 0.45, line: 6, alpha: 0.95,
                  enter: "slam", "in": 0.06, hold: 0.12, out: 0.5 },
      // the player is about to lose: the edges flash red twice — where a
      // hit is one slam, danger is a count the eye can't take for a hit
      danger:   { color: "#ff1f3d", edge: 0.4, soft: 0.6, line: 4, pulse: "flash", period: 0.42,
                  count: 2, "in": 0.01, out: 0.1 },
      // a bonus, a pickup worth celebrating: a gold rim and a warm bloom
      bonus:    { color: "#ffc531", color2: "#fff3b0", edge: 0.3, soft: 0.55, glow: 0.35,
                  blend: "screen", "in": 0.1, hold: 0.25, out: 0.6 },
      // a life back, a repair: a green rim breathing out
      heal:     { color: "#3ee07a", color2: "#c8ffd9", edge: 0.32, soft: 0.6, glow: 0.2,
                  blend: "screen", pulse: "breathe", period: 0.6, "in": 0.15, hold: 0.5, out: 0.6 },
      // held while a shield is up: a cool blue rim and a thin line on the glass
      shield:   { color: "#3fa8ff", edge: 0.22, soft: 0.7, line: 4, pulse: "breathe", period: 1.6,
                  blend: "screen", "in": 0.25, out: 0.4 },
      // held while a power is charged or running: violet, flickering
      power:    { color: "#a35bff", color2: "#e6ccff", edge: 0.3, soft: 0.5, glow: 0.12,
                  pulse: "flicker", period: 1.2, blend: "screen", "in": 0.2, out: 0.4 },
      // held while the world is frozen: the painted ice closes in
      ice:      { color: "#9fe3ff", frame: "ice", tint: 0.14, edge: 0.18, soft: 0.8,
                  enter: "close", "in": 0.3, out: 0.4 },
      // burning, lava rising, overheat
      fire:     { color: "#ff6a1f", color2: "#ffd25a", frame: "lava", tint: 0.08, edge: 0.2,
                  pulse: "flicker", period: 0.7, enter: "close", "in": 0.25, out: 0.45 },
      // poisoned, slimed
      poison:   { color: "#7be22c", frame: "slime", tint: 0.1, edge: 0.15, pulse: "breathe",
                  period: 1.4, enter: "close", "in": 0.3, out: 0.45 },
      // underwater, soaked
      water:    { color: "#2fa3ff", frame: "water", tint: 0.12, edge: 0.15, pulse: "breathe",
                  period: 2, enter: "close", "in": 0.35, out: 0.45 },
      // stuck, slowed down in the mud
      mud:      { color: "#7a4a22", frame: "mud", tint: 0.14, edge: 0.2, enter: "close",
                  "in": 0.3, out: 0.45 },
      // a gust, a storm
      wind:     { color: "#cfeaff", frame: "wind", enter: "close", "in": 0.3, out: 0.45 },
      // the two armies' banners, for a side that takes the field
      "knight-blue": { color: "#2f6bff", frame: "knight-blue", edge: 0.15, enter: "close",
                  "in": 0.35, hold: 1.2, out: 0.5 },
      "knight-red":  { color: "#e8263a", frame: "knight-red", edge: 0.15, enter: "close",
                  "in": 0.35, hold: 1.2, out: 0.5 },
      // the big moment: a gold sunburst turning behind everything, kept faint
      sunburst: { color: "#ffb21f", color2: "#fff0a6", rays: 18, raysAlpha: 0.22, spin: 30,
                  glow: 0.2, blend: "screen", enter: "close",
                  "in": 0.18, hold: 0.9, out: 0.7 },
      // held while the player goes fast: manga speed lines
      speed:    { color: "#ffffff", color2: "#ffffff", lines: 56, linesAlpha: 0.55,
                  blend: "screen", "in": 0.15, out: 0.3 },
      // held at night, in a cave: the dark closing round the middle
      dark:     { color: "#05060f", shape: "round", edge: 0.9, soft: 0.35, alpha: 0.94, "in": 0.5, out: 0.6 }
    };

    var custom = {};       // ScreenFx.define(), on top of the house table
    var host = null;       // the layer node (made on first use, or mount())
    var artOf = null;      // key -> url; the motor's CONFIG.art unless mounted
    var live = {};         // name -> { node, held, timer, key }
    /* `?perf=1&off=sfx` (see Perf in shell.js): the layer off on a device. */
    var disabled = false;
    try {
      var q = location.search + location.hash;
      disabled = /[?&#]perf=(1|bench)\b/.test(q) && /[?&]off=[a-z,]*\bsfx\b/.test(q);
    } catch (e) {}

    function cfg() { return typeof CONFIG !== "undefined" ? CONFIG : {}; }
    function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
    function assign(dst) {
      for (var i = 1; i < arguments.length; i++) {
        var src = arguments[i]; if (!src) continue;
        for (var k in src) if (own(src, k)) dst[k] = src[k];
      }
      return dst;
    }

    /* "knight-blue" -> "frameKnightBlue": the art key a frame is adopted under. */
    function frameKey(theme) {
      return "frame" + String(theme).replace(/(^|-)([a-z])/g, function (m, d, c) { return c.toUpperCase(); });
    }
    function frameSrc(theme) {
      if (!theme) return null;
      if (artOf) return artOf(theme, frameKey(theme));
      var art = cfg().art;
      return (art && art[frameKey(theme)]) || null;
    }

    function spec(name, o) {
      var tune = cfg().screenFx;
      var base = custom[name] || PRESETS[name];
      if (!base && !o) return null;
      return assign({}, BASE, base, tune && tune[name], o);
    }

    function ensureHost() {
      if (host && host.parentNode) return host;
      if (typeof document === "undefined") return null;
      var frame = document.getElementById("frame");
      if (!frame) return null;
      host = document.createElement("div");
      host.id = "sfx-layer"; host.className = "sfx-layer";
      frame.insertBefore(host, document.getElementById("overlay"));
      return host;
    }

    /* A colour, as a game writes one — "#ff2d2d", "#f2d", "rgb(…)" or
       "rgba(…, .8)" — with its own alpha multiplied by `k`. A colour it
       cannot read (a name) is handed back as it came, at full strength. */
    function rgba(c, k) {
      var str = String(c || ""), m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(str), r, g, b, a = 1;
      if (m) {
        var h = m[1].length === 3 ? m[1].replace(/(.)/g, "$1$1") : m[1];
        r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
      } else if ((m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(str))) {
        r = +m[1]; g = +m[2]; b = +m[3]; if (m[4] != null) a = +m[4];
      } else return k > 0 ? c : "transparent";
      return "rgba(" + r + "," + g + "," + b + "," + Math.round(a * k * 1000) / 1000 + ")";
    }
    function num(v, d) { v = +v; return isFinite(v) ? v : d; }
    function div(cls, css) {
      var d = document.createElement("div");
      d.className = cls; if (css) d.style.cssText = css;
      return d;
    }

    /* The edge, in one of two shapes, both painted once:
         rim    four bands laid along the glass, the colour at the edge and
                clear `edge` x 360 px in — a rim of one thickness all round,
                twice as strong in the corners where two bands cross. What a
                hit, a bonus, a shield are.
         round  an ellipse through the corners, clear in the middle — the
                dark closing in of a vignette (dark).
       `soft` is the fade: 0 holds the colour most of the way, 1 lets it
       go at once and trail off. */
    /* A rim is FOUR NODES, and each is ONE PIXEL long: a band's gradient
       only changes across it, so it is painted as a 1 px strip and
       stretched along the side by a transform the compositor applies — the
       raster is d x 1 px per side instead of d x 1280. Four gradients over
       the whole frame (the first version) rasterized the frame four times
       over, transparent middle included: seventy times the old vignette's
       raster in tools/lab/bench-screenfx.mjs. `stops` run from the glass
       inward, in px, over `d`. */
    function bands(stops, d) {
      var box = div("sfx-l");
      var side = function (dir, css) { box.appendChild(div("sfx-band", css + "background:linear-gradient(" + dir + "," + stops + ")")); };
      side("to right",  "left:0;top:0;width:" + d + "px;height:1px;transform:scaleY(" + H + ");transform-origin:0 0;");
      side("to left",   "right:0;top:0;width:" + d + "px;height:1px;transform:scaleY(" + H + ");transform-origin:0 0;");
      side("to bottom", "left:0;top:0;width:1px;height:" + d + "px;transform:scaleX(" + W + ");transform-origin:0 0;");
      side("to top",    "left:0;bottom:0;width:1px;height:" + d + "px;transform:scaleX(" + W + ");transform-origin:0 100%;");
      return box;
    }
    function edgeNode(s) {
      var reach = Math.max(0.02, Math.min(1, num(s.edge, 0)));
      var soft = Math.max(0, Math.min(1, num(s.soft, 0.5)));
      var c = rgba(s.color, 1), half = rgba(s.color, 0.5), none = rgba(s.color, 0);
      if (s.shape === "round") {
        var start = (1 - reach) * 100, mid = start + (100 - start) * (0.2 + 0.5 * (1 - soft));
        return div("sfx-l", "background:radial-gradient(ellipse farthest-corner at 50% 50%," + none + " " +
               start.toFixed(1) + "%," + half + " " + mid.toFixed(1) + "%," + c + " 100%)");
      }
      var d = Math.round(reach * 360), m = Math.round(d * (0.12 + 0.4 * (1 - soft)));
      return bands(c + " 0px," + half + " " + m + "px," + none + " " + d + "px", d);
    }

    function build(name, s) {
      var at = s.at || { x: W / 2, y: H / 2 };
      /* the sunburst and the lines: a square just big enough to reach the
         farthest corner from `at` — its whole area is rasterized once */
      var R = Math.ceil(Math.max(Math.hypot(at.x, at.y), Math.hypot(W - at.x, at.y),
                                 Math.hypot(at.x, H - at.y), Math.hypot(W - at.x, H - at.y))) + 8;
      var sq = "left:" + (at.x - R) + "px;top:" + (at.y - R) + "px;width:" + 2 * R + "px;height:" + 2 * R + "px;";
      var node = div("sfx sfx-pre sfx-e-" + s.enter, "mix-blend-mode:" + s.blend);
      node.setAttribute("data-fx", name);
      var inner = div("sfx-in");
      var pulse = div("sfx-p" + (s.pulse && s.pulse !== "none" ? " sfx-pu-" + s.pulse : ""),
                      "animation-duration:" + num(s.period, 0.9) + "s" +
                      (s.count > 0 ? ";animation-iteration-count:" + Math.round(s.count) : ""));
      node.appendChild(inner); inner.appendChild(pulse);

      if (s.tint > 0) pulse.appendChild(div("sfx-l", "background:" + rgba(s.color, s.tint)));
      if (s.glow > 0)
        pulse.appendChild(div("sfx-l", "background:radial-gradient(circle at " + at.x + "px " + at.y +
          "px," + rgba(s.color2, s.glow) + "," + rgba(s.color2, s.glow * 0.4) + " 28%," +
          rgba(s.color2, 0) + " 62%)"));
      if (s.rays > 0) {
        var step = 360 / Math.round(s.rays), wide = step * 0.42;
        pulse.appendChild(div("sfx-rays",
          sq + "animation-duration:" + (360 / Math.max(1, Math.abs(num(s.spin, 40)))).toFixed(2) + "s;" +
          "animation-direction:" + (num(s.spin, 40) < 0 ? "reverse" : "normal") + ";" +
          "background:repeating-conic-gradient(from 0deg," + rgba(s.color2, s.raysAlpha) + " 0deg " +
          wide.toFixed(2) + "deg," + rgba(s.color2, 0) + " " + wide.toFixed(2) + "deg " + step.toFixed(2) + "deg)"));
      }
      if (s.lines > 0) {
        /* Two families of thin rays on two periods that never line up, so
           the lines read as scattered rather than combed. */
        var n = Math.round(s.lines), p1 = 360 / n, p2 = 360 / Math.round(n * 0.73) ;
        var c = rgba(s.color2, s.linesAlpha), z = rgba(s.color2, 0);
        pulse.appendChild(div("sfx-lines",
          sq + "background:repeating-conic-gradient(from 0deg," + c + " 0deg " + (p1 * 0.12).toFixed(2) + "deg," +
          z + " " + (p1 * 0.12).toFixed(2) + "deg " + p1.toFixed(2) + "deg)," +
          "repeating-conic-gradient(from " + (p1 * 0.37).toFixed(2) + "deg," + c + " 0deg " +
          (p2 * 0.07).toFixed(2) + "deg," + z + " " + (p2 * 0.07).toFixed(2) + "deg " + p2.toFixed(2) + "deg)"));
      }
      var src = s.frame ? frameSrc(s.frame) : null;
      // a frame the game has not adopted: its edge, at least 0.3 in, stands in for it
      var edge = s.frame && !src ? Math.max(num(s.edge, 0), 0.3) : num(s.edge, 0);
      if (edge > 0) pulse.appendChild(edgeNode(assign({}, s, { edge: edge })));
      if (s.line > 0) pulse.appendChild(div("sfx-l", "box-shadow:inset 0 0 0 " + s.line + "px " + rgba(s.color, 1)));
      if (src) pulse.appendChild(div("sfx-l sfx-frame", "background-image:url(" + src + ")"));
      if (s.bars > 0) {
        node.appendChild(div("sfx-bar top", "height:" + s.bars + "px"));
        node.appendChild(div("sfx-bar bot", "height:" + s.bars + "px"));
      }
      return node;
    }

    function setTimes(L, s, phase) {
      var t = phase === "out" ? num(s.out, 0.45) : num(s["in"], 0.12);
      L.node.style.transitionDuration = t + "s";
      L.node.style.setProperty("--sfx-t", t + "s");
    }

    function leave(L) {
      if (!L || L.leaving) return;
      clearTimeout(L.timer);
      L.leaving = true;
      setTimes(L, L.spec, "out");
      L.node.classList.add("sfx-out");
      L.node.style.opacity = 0;
      L.timer = setTimeout(function () { drop(L); }, num(L.spec.out, 0.45) * 1000 + 60);
    }
    function drop(L) {
      clearTimeout(L.timer);
      if (L.node.parentNode) L.node.parentNode.removeChild(L.node);
      if (live[L.name] === L) delete live[L.name];
    }

    /* THE GLOW — what `Overlay.vignette(color, alpha, ms)` draws. It keeps
       that call's contract to the letter, because 67 calls of 18 games and
       the motor's own Pop styles are written against it: the colour is the
       caller's, the opacity eases over .5 s, `ms` turns it off later, and a
       timer is never cancelled by the next call (a pulse's timer still puts
       out a glow held after it, as it always has). Only the drawing changed.
       It was an inset box-shadow, 130 px of BLUR over the whole frame,
       repainted on every new colour; it is now the rim's gradient, laid out
       on the blur's own curve (the colour at 70 % on the glass, half 34 px
       in, a sixth at 100, gone at 170 — what a 130 px blur of a 34 px spread
       draws), painted once per colour with no blur pass. Same colour, same
       node: a glow driven every frame (blight's proximity) only ever writes
       an opacity. It sits in this layer, under the HUD. */
    var glowNode = null, glowColor = null, glowTimers = [];
    function glowBands(c) {
      return bands(rgba(c, 0.7) + " 0px," + rgba(c, 0.5) + " 34px," + rgba(c, 0.16) + " 100px," + rgba(c, 0) + " 170px", 170);
    }
    function glow(color, alpha, ms) {
      if (disabled) return;
      var h = ensureHost(); if (!h) return;
      if (!glowNode || glowNode.parentNode !== h) {
        glowNode = div("sfx sfx-glow");
        h.insertBefore(glowNode, h.firstChild);
        glowColor = null;
      }
      if (color && color !== glowColor) {
        glowColor = color;
        glowNode.innerHTML = ""; glowNode.appendChild(glowBands(color));
      }
      glowNode.style.opacity = alpha == null ? 1 : alpha;
      if (ms) glowTimers.push(setTimeout(function () { glowNode.style.opacity = 0; }, ms));
    }
    function glowOff() {
      glowTimers.forEach(clearTimeout); glowTimers = [];
      if (glowNode) glowNode.style.opacity = 0;
    }

    function run(name, o, held) {
      if (disabled) return false;
      var s = spec(name, o);
      if (!s) { if (typeof console !== "undefined") console.warn("ScreenFx: no preset '" + name + "'"); return false; }
      var h = ensureHost(); if (!h) return false;
      var key = JSON.stringify(s), L = live[name];

      // the same effect asked again with another look: the old one goes now
      if (L && L.key !== key) { drop(L); L = null; }
      if (L) {
        if (L.held && !held) return true;          // a pulse over a hold adds nothing
        clearTimeout(L.timer);
        L.leaving = false;
        L.node.classList.remove("sfx-out");
        if (s.count > 0 && !held) {               // a counted pulse starts its count again
          var pu = L.node.querySelector(".sfx-p");
          pu.style.animationName = "none"; void pu.offsetWidth; pu.style.animationName = "";
        }
        setTimes(L, s, "in");
        L.node.style.opacity = s.alpha;
      } else {
        L = live[name] = { name: name, spec: s, key: key, node: build(name, s) };
        setTimes(L, s, "in");
        h.appendChild(L.node);
        void L.node.offsetWidth;                    // the start state is laid out first
        L.node.classList.remove("sfx-pre");
        L.node.style.opacity = s.alpha;
      }
      L.held = !!held;
      if (!held) {
        // a counted pulse is the whole of a one-shot's hold: it ends on its last turn
        var hold = s.count > 0 && s.pulse !== "none" ? s.count * num(s.period, 0.9) : num(s.hold, 0.25);
        L.timer = setTimeout(function () { leave(L); }, (num(s["in"], 0.12) + hold) * 1000);
      }
      return true;
    }

    return {
      play: function (name, o) { return run(name, o, false); },
      hold: function (name, o) { return run(name, o, true); },
      release: function (name) { var L = live[name]; if (L) { L.held = false; leave(L); } },
      active: function (name) { var L = live[name]; return !!(L && !L.leaving); },
      clear: function () { for (var k in live) if (own(live, k)) drop(live[k]); glowOff(); },
      glow: glow,
      glowOff: glowOff,
      define: function (name, s) { custom[name] = s; },
      presets: function () { return Object.keys(assign({}, PRESETS, custom)); },
      spec: function (name) { return spec(name); },
      base: function () { return assign({}, BASE); },
      off: function () { disabled = true; this.clear(); },
      /* The lab's door: stand the layer on a node of its own, and say where
         the painted frames are read from — art(theme, key) -> url. */
      mount: function (node, opts) {
        this.clear();
        host = node; if (node) node.classList.add("sfx-layer");
        artOf = (opts && opts.art) || null;
      }
    };
  })();
