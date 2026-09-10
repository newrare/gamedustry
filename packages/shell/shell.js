  /* ===================================================================
     5. SHELL — state machine, HUD, overlay, intro, end screen.
     The parts of a playable that never change shape between games.
     =================================================================== */

  var State = "loading";   // loading | intro | playing | end

  /* Anything bolted on top of the shell needs to know when the screen changes
     — the web target repaints the menu scene on every entry into "intro". The
     motor itself never registers a hook; a playable ships an empty list. */
  var stateHooks = [];
  function onState(fn) { stateHooks.push(fn); }

  function setState(s) {
    State = s;
    ["loading", "intro", "end"].forEach(function (n) {
      $("screen-" + n).classList.toggle("hidden", n !== s);
    });
    $("hud").classList.toggle("hidden", s !== "playing");
    $("cta-bar").classList.toggle("hidden", s !== "playing");
    $("backdrop").classList.toggle("on", s === "end");
    if (s !== "playing") Overlay.clear();
    Ad.track("state", s);
    for (var i = 0; i < stateHooks.length; i++) stateHooks[i](s);
  }

  /* --- Fit — measured display type ---------------------------------------

     The motor's display sizes were eyeballed against the system stack, and the
     strings are not fixed: "OUT OF BALLS!" is 703px of a 624px band at 96px,
     "OUT OF PULSES!" 766px, and a six-digit score is wider than the five-digit
     one .eo-score was sized on. Four playables wrapped their end title onto two
     lines before any font was added; a game's own face on the web moves every
     width again (Orbitron's digits +24%, Bebas Neue -40%).

     So measure and scale DOWN, never up. No size to re-tune per game, per
     language or per face. The nodes are `nowrap` in the stylesheet, which is
     what makes scrollWidth the true one-line width.

     Room is the design width minus the .screen padding; the web front end
     overrides #intro-title, which lives in its own inset header. Nothing here
     watches for resize on purpose: the frame is a fixed 720x1280 design space
     that CSS scales as a whole, so a fit is deterministic.

     #intro-title is in the list for the game that has no logotype: once
     `assets/art/<slug>-title.png` exists, Art puts an <img> inside that node
     and there is no type left to measure, so the fit is a no-op. All thirteen
     are in that case today. The end title and the score are always type. */
  var Fit = (function () {
    var ROOM = { "intro-title": 624, "eo-title": 624, "eo-score": 624 };
    var MIN  = { "intro-title": 44,  "eo-title": 44,  "eo-score": 60 };

    /* `text` measures a string the node does not carry yet — the score is fitted
       against its final value before the count-up starts, so the number never
       outgrows the size mid-animation. */
    function one(id, text) {
      var n = $(id);
      if (!n) return;
      var had = null;
      if (text != null) { had = n.textContent; n.textContent = text; }
      n.style.fontSize = "";                  // back to the size the CSS asks for
      var size = parseFloat(window.getComputedStyle(n).fontSize);
      var room = ROOM[id] || 624, min = MIN[id] || 44;
      /* Shrink, measure, repeat. One pass would do if width scaled with size,
         and it does not: letter-spacing is a fixed px value, so 13 caps carry
         52px of tracking whatever the size. Two or three passes converge. */
      if (size && n.scrollWidth) {
        for (var i = 0; i < 6 && n.scrollWidth > room && size > min; i++) {
          size = Math.max(min, Math.floor(size * room / n.scrollWidth) - 1);
          n.style.fontSize = size + "px";
        }
      }
      if (had != null) n.textContent = had;
    }

    function all() { for (var id in ROOM) if (ROOM.hasOwnProperty(id)) one(id); }
    function room(id, px) { if (px != null) ROOM[id] = px; return ROOM[id]; }

    return { one: one, all: all, room: room };
  })();

  // --- HUD ---------------------------------------------------------------
  var HUD = (function () {
    var target = 0, shown = 0, colorT = null;
    function write(v) { $("hud-score").textContent = v; }
    // Set the score target; the displayed number eases toward it (see tick).
    function setScore(v) { target = v; }
    function setScoreNow(v) { target = shown = v; write(Math.round(v)); }
    function tick(dt) {
      if (shown === target) return;
      shown += (target - shown) * Math.min(1, dt * 14);
      if (Math.abs(target - shown) < 0.5) shown = target;
      write(Math.round(shown));
    }
    /* Punch the score on a gain — the single most useful piece of HUD juice.
       The animation is restarted by swapping between two identical ones rather
       than with the classic `remove class; void offsetWidth; add class`:
       reading offsetWidth forces a synchronous layout of the whole frame, and
       it happens on the exact frame a pickup already costs the most (a sound, a
       callout, a particle burst). Two animation names restart on their own. */
    var alt = false;
    function punch(color) {
      var el = $("hud-score");
      el.classList.remove(alt ? "bump" : "bump2");
      el.classList.add(alt ? "bump2" : "bump");
      alt = !alt;
      if (color) {
        el.style.color = color;
        clearTimeout(colorT);
        colorT = setTimeout(function () { el.style.color = ""; }, 320);
      }
    }
    function pill(text, label, cls) {
      return '<div class="hud-pill' + (cls ? " " + cls : "") + '">' +
             (label ? '<span class="lbl">' + label + "</span>" : "") + text + "</div>";
    }
    /* Both pills are written from the frame loop — `setTime` below runs on
       every tick, and a game is free to call these with an unchanged value —
       so the string is compared before it is assigned. An `innerHTML` write
       reparses the markup, throws away the two nodes, rebuilds them and pulls a
       style pass, a layout and a repaint behind it. Doing that 60 times a
       second for a timer that changes once a second is most of what a timed
       game spent on its HUD: measured with tools/lab/bench-pop.mjs on the
       gameplay window alone (no callouts), orbinity went from 22 ms of style
       and 19 ms of layout per 3 s to vipera's numbers, which has no timer. */
    var shownL = null, shownR = null;
    function setLeft(text, label, cls) {
      var html = text == null ? "" : pill(text, label, cls);
      if (html === shownL) return;
      shownL = html; $("hud-left").innerHTML = html;
    }
    function setRight(text, label, cls) {
      var html = text == null ? "" : pill(text, label, cls);
      if (html === shownR) return;
      shownR = html; $("hud-right").innerHTML = html;
    }
    function setTime(sec) {
      if (!CONFIG.hud.timer) return;
      var s = Math.max(0, Math.ceil(sec));
      setRight(s, CONFIG.copy.timeLabel, s <= 5 ? "warn" : "");
    }
    return { setScore: setScore, setScoreNow: setScoreNow, tick: tick, punch: punch,
             setLeft: setLeft, setRight: setRight, setTime: setTime,
             score: function () { return target; } };
  })();

  // --- Overlay: screen-space notifications over the game view -------------
  var Overlay = (function () {
    var timers = [];
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

    // A short pill sliding in below the HUD ("+1 LIFE", "2 SHOTS LEFT"…).
    function toast(text, opt) {
      opt = opt || {};
      var el = document.createElement("div");
      el.className = "ov-toast";
      el.textContent = text;
      if (opt.color) el.style.color = opt.color;
      $("ov-toasts").appendChild(el);
      var dur = opt.dur || 1400;
      later(function () { el.classList.add("out"); }, dur);
      later(function () { if (el.parentNode) el.parentNode.removeChild(el); }, dur + 400);
    }

    // The big dramatic mid-screen callout ("COMBO x8", "LAST CHANCE").
    function banner(main, sub, opt) {
      opt = opt || {};
      var box = $("ov-banner");
      $("ov-banner-main").textContent = main;
      $("ov-banner-main").style.color = opt.color || "var(--accent)";
      $("ov-banner-sub").textContent = sub || "";
      box.style.setProperty("--ov-banner-dur", (opt.dur || 1000) + "ms");
      box.classList.remove("show"); void box.offsetWidth; box.classList.add("show");
    }

    // A reward badge that pops and floats away (combo chest, bonus coins…).
    function reward(text, opt) {
      opt = opt || {};
      var el = $("ov-reward");
      el.textContent = text;
      if (opt.color) el.style.color = opt.color;
      el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
    }

    // Edge glow — hold it on during danger, or pulse it on a milestone.
    /* The edge glow is a blurred inset shadow over the WHOLE frame, so writing
       it repaints and re-rasterizes every pixel of the frame — at a phone's
       raster scale, 2.4 Mpx convolved with a 200-odd-pixel blur, off the main
       thread, on whichever frame the game happened to celebrate something.
       Opacity alone is composited and free, so the paint is written only when
       the colour actually changes. A game that pulses the same colour on every
       pickup — which is what a game does — now pays for it once a round.
       If a beat still costs too much here, `?perf=1&off=vig` on the URL takes
       the whole layer out of the picture on the device (see Perf below). */
    var vigColor = null;
    function vignette(color, alpha, ms) {
      var el = $("ov-vignette");
      if (color && color !== vigColor) {
        vigColor = color;
        el.style.boxShadow = "inset 0 0 130px 34px " + color;
      }
      el.style.opacity = alpha == null ? 1 : alpha;
      if (ms) later(function () { el.style.opacity = 0; }, ms);
    }

    function clear() {
      timers.forEach(clearTimeout); timers = [];
      $("ov-toasts").innerHTML = "";
      $("ov-banner").classList.remove("show");
      $("ov-reward").classList.remove("show");
      $("ov-vignette").style.opacity = 0;
      Pop.clear();
    }
    return { toast: toast, banner: banner, reward: reward, vignette: vignette, clear: clear };
  })();

  /* --- Pop: comic / manga callouts --------------------------------------
     The loud half of the overlay: score gains, combo milestones, hero beats.
     Prefer it over Overlay.banner/toast for anything that celebrates a player
     action — a playable sells on how big the feedback feels.

         Pop.show("combo", { word: "COMBO x5", sub: "+120", at: "topRight" })

     Every field of a style can be overridden per call:
       word, sub   the copy (uppercased by CSS)
       at          anchor name (see ANCHORS) or { x, y } in design px
       rot         static tilt, degrees
       cls         extra class on the root node, to retint one call from SKIN
       hold        ms the callout stays fully readable between entry and exit.
                   `hold:-1` keeps it until the returned close() is called.
       enter/exit  ms of the entry / exit animation
     Returns { el, close, remove }.

     The full-screen impact of a style (shake / flash / vignette / confetti) is
     delegated to the layers that already own it — Fx and Overlay — so there is
     never a second shake system. Sound stays with the caller: a game knows
     which of its own samples belongs on the beat.

     Design reference and live catalogue: lab/overlay-comic.html
     -------------------------------------------------------------------- */
  var Pop = (function () {
    var timers = [];
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

    /* Callouts currently on screen, oldest first, and a hard cap on them. Each
       one owns compositing layers, so a player mashing the screen could
       otherwise stack a dozen and cost the round its framerate. The cap is the
       motor's job: a game should never have to rate-limit its own feedback. */
    var live = [], MAX_LIVE = 4;

    /* Named anchors, expressed as fractions of the Layout band so a callout is
       always clear of the HUD, the CTA bar and the device insets: a 3x5 grid
       (column x row) plus four specials. `at` also takes raw design px. */
    var ANCHORS = {
      // row 1 — just under the HUD
      topLeft:    [.30, .10], top:    [.50, .09], topRight:    [.70, .10],
      // row 2
      upperLeft:  [.32, .26], upper:  [.50, .26], upperRight:  [.68, .26],
      // row 3 — eye level
      left:       [.30, .46], center: [.50, .46], right:       [.70, .46],
      // row 4
      lowerLeft:  [.32, .66], lower:  [.50, .66], lowerRight:  [.68, .66],
      // row 5 — just above the CTA bar
      bottomLeft: [.34, .85], bottom: [.50, .85], bottomRight: [.66, .85],
      // specials
      // Far enough below the HUD band that a word PLUS its sub-line still clears
      // the score and the timer — an anchor is a centre point, not a top edge.
      hudUnder:   [.50, .07],   // hugging the HUD, for discreet callouts
      ctaAbove:   [.50, .97],   // sitting right on top of the CTA bar
      edgeLeft:   [.14, .50],   // vertical manga column, left edge
      edgeRight:  [.86, .50]
    };
    function resolve(at) {
      if (at && typeof at === "object") return at;
      var a = ANCHORS[at] || ANCHORS.center;
      return { x: Layout.left + a[0] * Layout.w, y: Layout.top + a[1] * Layout.h };
    }

    /* Build the word. Every glyph layer is expensive to rasterize — gradient
       face clipped to the text, thick stroke, extrusion — so the word is ONE
       layer unless the style actually needs per-letter nodes: `letters` for a
       staggered drop-in, `vertical` for a manga column. */
    function buildWord(text, st) {
      var w = document.createElement("div"), i, ch, el;
      w.className = "pop-word" + (st.vertical ? " vert" : "");
      if (!st.letters && !st.vertical) {
        el = document.createElement("span");
        el.className = "pop-ltr";
        el.setAttribute("data-t", text);
        el.textContent = text;
        w.appendChild(el);
        return w;
      }
      for (i = 0; i < text.length; i++) {
        ch = text.charAt(i);
        if (ch === " ") { el = document.createElement("span"); el.className = "pop-sp"; }
        else {
          el = document.createElement("span");
          el.className = "pop-ltr";
          el.setAttribute("data-t", ch);
          el.style.setProperty("--i", i);
          el.textContent = ch;
        }
        w.appendChild(el);
      }
      return w;
    }

    function decorNode(kind) {
      var d = document.createElement("div");
      d.className = "pop-d pop-d-" + kind;
      return d;
    }

    /* Four ticks flicked diagonally off the callout's corners. Deterministic
       and mirrored, so repeats read as the same effect; four solid bars are
       cheaper than one masked gradient, and they stay inside the shockwave's
       footprint so the callout never grows past its ring. */
    var DASHES = [
      { tx: -215, ty: -86, rd: -28, dw: 46 },
      { tx:  215, ty: -86, rd:  28, dw: 46 },
      { tx: -203, ty:  90, rd:  30, dw: 38 },
      { tx:  203, ty:  90, rd: -30, dw: 38 }
    ];
    function addDashes(parent) {
      var i, d, s;
      for (i = 0; i < DASHES.length; i++) {
        s = DASHES[i];
        d = document.createElement("div");
        d.className = "pop-d-dash";
        d.style.setProperty("--tx", s.tx + "px");
        d.style.setProperty("--ty", s.ty + "px");
        d.style.setProperty("--rd", s.rd + "deg");
        d.style.setProperty("--dw", s.dw + "px");
        d.style.animationDelay = (i % 2 ? 40 : 0) + "ms";
        parent.appendChild(d);
      }
    }

    // Sparkles orbiting the word, for the celebratory styles.
    function addSparks(parent) {
      var n = 7, i, s, a, r;
      for (i = 0; i < n; i++) {
        s = document.createElement("div");
        s.className = "pop-d-spark";
        a = (i / n) * Math.PI * 2 + 0.4;
        r = 210 + Math.random() * 130;
        s.style.left = (50 + Math.cos(a) * r * 0.07) + "%";
        s.style.top  = (50 + Math.sin(a) * r * 0.12) + "%";
        s.style.setProperty("--s", (34 + Math.random() * 40) + "px");
        s.style.animationDelay = (Math.random() * 0.6) + "s";
        parent.appendChild(s);
      }
    }

    /* The web target's OPTIONS panel can turn the callouts off — some players
       want the screen quiet, and on a slow phone the layer is the one thing
       worth dropping (see the mobile-stutter note in TODO.md). A playable
       leaves it on for its whole life. */
    var enabled = true;

    function show(name, opt) {
      if (!enabled) return null;
      opt = opt || {};
      var st = STYLES[name]; if (!st) return null;

      var word = opt.word != null ? opt.word : st.word;
      if (word == null) return null;
      var sub = opt.sub != null ? opt.sub : st.sub;
      var pos = resolve(opt.at != null ? opt.at : st.at);
      var enter = opt.enter != null ? opt.enter : (st.enter || 420);
      var hold  = opt.hold  != null ? opt.hold  : (st.hold == null ? 900 : st.hold);
      var exit  = opt.exit  != null ? opt.exit  : (st.exit  || 340);

      var pop = document.createElement("div");
      pop.className = "pop pop-" + name + (opt.cls ? " " + opt.cls : "");
      // A little jitter keeps repeats from stacking pixel-perfect.
      var px = pos.x + Rand.range(-12, 12), py = pos.y + Rand.range(-10, 10);
      pop.style.top = py + "px";

      var out = document.createElement("div");
      out.className = "pop-out";

      var anim = document.createElement("div");
      anim.className = "pop-anim";
      anim.style.animation = "pop-in-" + st.anim + " " + enter + "ms cubic-bezier(.2,.9,.3,1) forwards";

      // decor behind the word
      var i, decor = st.decor || [];
      for (i = 0; i < decor.length; i++) {
        if (decor[i] === "sparks") { addSparks(anim); continue; }
        if (decor[i] === "dashes") { addDashes(anim); continue; }
        anim.appendChild(decorNode(decor[i]));
      }

      var body = document.createElement("div");
      body.className = "pop-body" + (st.pulse ? " pulse" : "");
      body.style.setProperty("--rot", (opt.rot != null ? opt.rot : (st.rot || 0)) + "deg");
      body.appendChild(buildWord(String(word), st));
      if (sub) {
        var sb = document.createElement("div");
        sb.className = "pop-sub"; sb.textContent = sub;
        body.appendChild(sb);
      }
      anim.appendChild(body);
      out.appendChild(anim);
      pop.appendChild(out);
      $("ov-pops").appendChild(pop);

      // Keep the callout on screen: shrink an over-long word first (offsetWidth
      // is untransformed, i.e. already design px), then pull the anchor in so
      // neither half of a wide word hangs outside the frame.
      var wordEl = body.querySelector(".pop-word");
      var wordW = wordEl.offsetWidth, maxW = st.vertical ? Layout.w * 0.4 : Layout.w;
      if (wordW > maxW) { body.style.setProperty("--fit", (maxW / wordW).toFixed(3)); wordW = maxW; }
      // The word is not always the widest thing in the callout: a style may put
      // a plate around it (`combo`) or a shockwave behind it, and #ov-pops
      // clips, so an off-centre anchor would slice those off. Measure the body
      // and the ring and fold them into the clamp. Only those two: the soft
      // decors (band, dots, rays, chevrons, stripes) are drawn wider than the
      // frame ON PURPOSE and must keep bleeding off both edges.
      var ringEl = anim.querySelector(".pop-d-ring");
      var bodyW = Math.min(Math.max(body.offsetWidth, wordW), Layout.w);
      var half = Math.min(Math.max(bodyW / 2 + 8, ringEl ? ringEl.offsetWidth / 2 : 0), view.w / 2);
      pop.style.left = clamp(px, half, view.w - half) + "px";

      // Full-frame impact, borrowed from the layers that own it. `opt.silent`
      // opts out: the prewarm pass below builds every style while the intro is
      // up, and must not shake, flash, glow the frame edges or drop confetti.
      if (!opt.silent) {
        if (st.shake) Fx.shake(st.shake, st.shakeDur || 0.3);
        if (st.flash) Fx.flash(st.flashCol || "#ffffff", st.flash);
        if (st.vignette) Overlay.vignette(st.vignette, 1, Math.min(st.vignetteMs || 520, enter + Math.max(hold, 0)));
        if (st.confetti) Confetti.burst(st.confetti);
      }

      var handle;
      function remove() {
        var i = live.indexOf(handle);
        if (i >= 0) live.splice(i, 1);
        if (pop.parentNode) pop.parentNode.removeChild(pop);
      }
      function close(delay) {
        if (out.getAttribute("data-closing")) return;
        out.setAttribute("data-closing", "1");
        out.style.animation = "pop-out-" + st.anim + " " + exit + "ms ease-in " + delay + "ms forwards";
        later(remove, delay + exit + 60);
      }
      if (hold >= 0) close(enter + hold);

      handle = { el: pop, close: function () { close(0); }, remove: remove };
      live.push(handle);
      // Over the cap: drop the oldest outright rather than play it out — under a
      // burst it is already faded, and an exit animation costs another frame.
      while (live.length > MAX_LIVE) live[0].remove();
      return handle;
    }

    /* The catalogue. Each entry is one visual language:
         cls is implicit (".pop-<key>")
         anim                 entry/exit pair ("slam" -> pop-in-slam/pop-out-slam)
         enter / hold / exit  default timing in ms; `hold` is what a caller tunes
         decor                layers painted behind the word
         at / rot             default anchor and static tilt
         letters              split the word per glyph (staggered drop-in); off
                              by default because one layer rasterizes far faster
         vertical             manga column, one glyph per line
         shake / flash / vignette / confetti: full-frame impact
       Timings are deliberately tight: a callout that outstays the beat hides the
       gameplay it is celebrating. Lengthen `hold` per call, never by default. */
    var STYLES = {
      // the tiny frequent one, spawned at the impact point
      score:    { anim:"float", enter:240, hold:240, exit:420, decor:[], at:"center", rot:-5 },
      // a mistake: chain lost, wall hit. Sits where a toast would, but styled
      // like the rest of the callouts instead of looking like a leftover pill.
      alert:    { anim:"punch", enter:220, hold:320, exit:220, decor:[], at:"hudUnder", rot:-2 },
      // a scoring milestone: a compact chip with a shockwave, off to one side.
      // This is the one callout a good run fires over and over, so it is built
      // to cost nothing (see .pop-combo and pop-in-chip): no full-frame veil,
      // no clip-path, and a footprint the size of its own text. `ultra` keeps
      // the flash for the moment that really is rare.
      combo:    { anim:"chip", enter:260, hold:520, exit:220, decor:["ring","dashes"],
                  at:"upperRight", rot:-7, shake:4 },
      // a chain staying alive: chevrons pushing the eye sideways
      streak:   { anim:"punch", enter:300, hold:480, exit:240, decor:["chevrons"],
                  at:"left", rot:-7, shake:4 },
      // a comic banner sweeping across the play area
      ribbon:   { anim:"swipe", enter:420, hold:620, exit:320, decor:["band","lines"],
                  at:"upper", shake:5 },
      // poster energy for a big announcement (level up, unlock)
      manifest: { anim:"drop", enter:520, hold:820, exit:320, decor:["dots","band"],
                  at:"center", letters:true, shake:12,
                  vignette:"rgba(214,27,60,.9)", vignetteMs:700 },
      // "you nailed it": gold, sparkles, gentle rays
      perfect:  { anim:"punch", enter:360, hold:620, exit:280, decor:["sparks"],
                  at:"upper", rot:-3, vignette:"rgba(255,190,60,.8)" },
      // the hero moment: rays, chroma, maximum size
      ultra:    { anim:"zoom", enter:440, hold:640, exit:320, decor:["rays"],
                  at:"center", shake:16, flash:0.5, vignette:"rgba(120,70,255,.85)" },
      // a reward sticker
      bonus:    { anim:"drop", enter:380, hold:620, exit:280, decor:["dots"], at:"lower", rot:-4 },
      // hazard tape, blinking for the whole hold
      danger:   { anim:"alarm", enter:240, hold:1100, exit:260, pulse:true, decor:["stripes"],
                  at:"top", vignette:"rgba(255,40,40,.85)", vignetteMs:1100 },
      // the end-of-run peak (its confetti only shows once the end screen is up,
      // since Confetti draws on the end-screen canvas)
      record:   { anim:"drop", enter:620, hold:1500, exit:380, decor:["rays","band","sparks"],
                  at:"center", shake:8, confetti:28 },
      // vertical manga column hugging one edge
      vert:     { anim:"punch", enter:320, hold:560, exit:260, decor:["rays"],
                  at:"edgeRight", rot:4, vertical:true }
    };

    function clear() {
      var i; for (i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers = []; live = [];
      $("ov-pops").innerHTML = "";
    }

    /* Rasterizing a style for the first time costs 50-80 ms (gradient text,
       clip-paths, masks). That must never land on a milestone frame, so every
       style is built once — hidden, one per animation frame — while the intro is
       up and nothing is being played. Idempotent and self-cancelling. */
    var warmed = false;
    function prewarm() {
      if (warmed) return;
      warmed = true;
      var keys = [], k;
      for (k in STYLES) if (STYLES.hasOwnProperty(k)) keys.push(k);
      var i = 0;
      function step() {
        if (i >= keys.length) return;
        // Not visibility:hidden — an invisible layer is never rasterized, which
        // is the whole point of the pass. Near-zero opacity still paints.
        var h = show(keys[i++], { word: "WARM UP", sub: "0", hold: 0, enter: 1, exit: 1, silent: true });
        if (h) h.el.style.opacity = "0.004";
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    return {
      show: show, clear: clear, prewarm: prewarm, styles: STYLES, anchors: ANCHORS,
      setEnabled: function (v) { enabled = !!v; if (!enabled) clear(); },
      isEnabled: function () { return enabled; }
    };
  })();

  /* --- Art: the game's painted screens ------------------------------------

     `CONFIG.art` is injected by tools/build/build.mjs out of `assets/art/`,
     one key per file, and a game declares nothing to get it — the file name is
     the declaration (see tools/lab/encode-art.mjs). Three roles reach the
     shell:

       backgroundPhone   the painting behind the intro and the end screen, and
                         — only for a game that asks with `CONFIG.sceneArt` —
                         behind the round as well. It is off by default because
                         most of the thirteen gameplays are balanced against the
                         flat ground their SKIN paints, and a picture under the
                         world is a contrast regression in those. A game whose
                         world reads over a scene opts in; see `dressFrame`.
       title             the logotype, which replaces BOTH the app icon and the
                         CSS #intro-title. The image goes inside the title node
                         rather than beside it, so the webshell — which wraps
                         that node to make the title breathe — needs no branch.
       character*        the three faces of the end screen.

     Everything here is a no-op when a game ships no art, which is what lets
     the template and any future game boot with an empty `CONFIG.art`. */
  var Art = (function () {
    var art = CONFIG.art || {};

    /* The painted layer, as the first child of a screen: `.screen-art` paints
       the picture and its own scrim (motor.css), and the marker class on the
       screen is what tells the stylesheet to drop the flat tint it used to
       need. Inserting it from here rather than from page.html is deliberate:
       the markup is one file per game, thirteen copies plus the template, and
       a layer nothing configures does not belong in any of them. */
    function dress(screenId) {
      if (!art.backgroundPhone) return;
      var screen = $(screenId);
      if (!screen || screen.querySelector(".screen-art")) return;
      var layer = document.createElement("div");
      layer.className = "screen-art";
      layer.style.backgroundImage = "url(" + art.backgroundPhone + ")";
      screen.insertBefore(layer, screen.firstChild);
      screen.classList.add("has-art");
    }

    /* The same painting behind the ROUND, for a game that sets
       `CONFIG.sceneArt`. `games/chainring`, `games/slipdeck` and
       `games/marshmelt` are the three: each of them painted its own decorative
       ground — a radial gradient, a felt fill, a pre-rendered cavern — and the
       scene replaces exactly that.

       IT IS A CSS LAYER BEHIND THE CANVAS, NOT A drawImage. Blitting a full
       720x1280 picture every frame is ~2.7 Mpixel on a 3x phone, for a
       backdrop that never changes; as a layer the compositor holds it and the
       per-frame cost is zero. The price is that it does not ride `Fx.shake`,
       which transforms the canvas context — a still backdrop under a shaking
       world is the normal way this looks, and `Fx.flash` still covers it
       because the flash is painted on the canvas above.

       A game that opts in must stop painting its own opaque ground, or there
       is nothing to see through: that is what `Art.scene()` is for. It also
       means the SKIN's `html, body` gradient is the fallback for free — with no
       artwork on disk, `scene()` is false and the game paints as it always did. */
    function dressFrame() {
      if (!CONFIG.sceneArt || !art.backgroundPhone) return false;
      var frame = $("frame");
      if (!frame) return false;
      if (!frame.querySelector(".frame-art")) {
        var layer = document.createElement("div");
        layer.className = "frame-art";
        layer.style.backgroundImage = "url(" + art.backgroundPhone + ")";
        frame.insertBefore(layer, frame.firstChild);
      }
      return true;
    }

    /* The logotype. `alt` carries the title so the screen still reads to a
       screen reader and to a browser with images off, and the `art` class
       neutralizes the SKIN's text treatment: every one of them paints the
       title with a gradient clipped to its glyphs, which has no glyphs to
       clip once the node holds a picture, but the font metrics would still
       leave an empty line box behind the image. */
    function titleImage() {
      if (!art.title) return false;
      var node = $("intro-title");
      if (!node) return false;
      var img = document.createElement("img");
      img.className = "art-title";
      img.src = art.title;
      img.alt = CONFIG.title;
      node.textContent = "";
      node.appendChild(img);
      node.classList.add("art");
      return true;
    }

    /* Which face the end screen wears. The star count is the one verdict every
       game already hands the motor on `endRound`, so this works for all
       thirteen without a line of game code: a round worth 0 or 1 star is a
       loss, 2 is a pass, 3 is the run the player wanted. A game that passes
       `stars: null` has no verdict to read, and gets the neutral face. */
    function faceFor(stars) {
      if (stars == null) return art.characterNeutral;
      if (stars >= 3) return art.characterHappy;
      if (stars >= 2) return art.characterNeutral;
      return art.characterSad;
    }

    /* The character node lives in the end screen from boot, empty and hidden,
       so a round ending only swaps a `src` — decoding a 40 KB WebP in the
       middle of the reveal would drop the frame the title slams in on. */
    function buildCharacter() {
      if (!art.characterNeutral && !art.characterSad && !art.characterHappy) return;
      var screen = $("screen-end");
      if (!screen || $("eo-char")) return;
      var img = document.createElement("img");
      img.id = "eo-char";
      img.alt = "";
      /* Right after the confetti canvas: the end screen paints its children in
         document order at the same z-index, so everything the reveal writes —
         title, score, stars, rows, buttons — lands on top of the character
         instead of under it. */
      screen.insertBefore(img, screen.firstChild.nextSibling);
    }

    /* THE FACE IS A CORNER FIGURE, AND IT ARRIVES AT TWICE ITS FINAL SIZE.

       It hangs off the bottom-right corner of the frame, and both sizes are
       constants — the box lives in the stylesheet. It arrives at CHAR_ENTER,
       when the title is the only thing on the screen and there is nothing to
       bury, then gives up room one step at a time as the column claims it (the
       score, the stars, each stat row, the buttons) down to CHAR_HOME. So the
       entrance is a character and the finished screen is a corner figure.

       WHY IT MAY COVER ANYTHING AT ALL: document order puts #eo-char before
       everything the reveal writes, at one shared z-index, so the title, the
       score, the rows and both buttons paint OVER it. Nothing can be hidden by
       the face; the worst case is a face partly covered, and only for a beat.

       This replaced a fit measured against the column every round, band by
       band, and the measurement was not wrong so much as pointless: the end
       screen's column runs from three stat rows to ten, and against a finished
       one the free band is worth 120-165px on most of the thirteen — a sliver,
       and on the dense games no face at all. Letting the plates cover a corner
       of a big figure buys back every pixel that measurement was protecting,
       and it deleted the ResizeObserver the fit needed to survive the web
       target's late title refit: a fixed box has nothing to re-measure.

       Only the BOTTOM edge crops it, CHAR_BLEED px of it: it takes the feet,
       where the top edge would take the head — a figure the frame crops stands
       in the scene, one floating clear of it is a sticker. The right edge is
       flush, because a horizontal crop takes an arm and reads as an accident. */
    var CHAR_ENTER = 660, CHAR_HOME = 330;

    /* How far along the settle the face is, 0..1 — kept so a replay can start
       it over. */
    var charT = 0;

    /* One step of the settle. `t` is how much of the reveal has landed, and the
       shell calls it on every beat that writes over the face. The step is a
       `transform: scale()` about the bottom-right corner (motor.css reads
       `--char-k`), so the box never changes, the anchor cannot drift, no step
       costs a layout, and the bleed shrinks with the figure instead of eating
       more of its feet. */
    function settleCharacter(t) {
      var img = $("eo-char");
      charT = t < 0 ? 0 : t > 1 ? 1 : t;
      if (!img) return;
      /* A calm easing for the way down: the entrance transition overshoots, and
         six of those in a row would read as a wobble. */
      if (charT > 0) img.classList.add("settling");
      img.style.setProperty("--char-k", (1 - (1 - CHAR_HOME / CHAR_ENTER) * charT).toFixed(3));
    }

    function showCharacter(stars) {
      var img = $("eo-char");
      if (!img) return;
      var src = faceFor(stars);
      if (!src) { img.classList.remove("show"); return; }
      if (img.getAttribute("src") !== src) img.src = src;
      img.classList.remove("show", "settling");
      /* A replay starts the settle over: full size with the title, again. */
      settleCharacter(0);
      img.classList.remove("settling");

      /* One frame later, so the class change is a transition and not the
         element's first paint — a replay has to see it arrive again. */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { img.classList.add("show"); });
      });
    }

    function hideCharacter() {
      var img = $("eo-char");
      if (img) img.classList.remove("show");
    }

    var onScene = false;

    return {
      has: function (key) { return !!art[key]; },
      src: function (key) { return art[key] || null; },
      /* True when the painted scene is behind the world, i.e. the game must
         NOT paint its own opaque ground this frame. Read it in render(). */
      scene: function () { return onScene; },
      dress: dress, titleImage: titleImage, buildCharacter: buildCharacter,
      showCharacter: showCharacter, hideCharacter: hideCharacter,
      settleCharacter: settleCharacter,
      dressFrame: function () { onScene = dressFrame(); return onScene; }
    };
  })();

  // --- Intro: logo, copy and the animated how-to-play demo ----------------
  function buildIntro() {
    /* The painted screens come first: the title image below replaces the icon,
       so the icon must not be shown and then hidden. */
    Art.dress("screen-intro");
    Art.dress("screen-end");
    Art.dressFrame();
    Art.buildCharacter();
    var hasArtTitle = Art.titleImage();

    /* A game with a logotype hides the app icon: the picture already carries
       the name and the mark, and the two stacked is the crowded intro the
       artwork was drawn to replace. */
    var logo = !hasArtTitle && CONFIG.intro.logo && ASSETS.images[CONFIG.intro.logo];
    var img = $("app-icon");
    if (logo) { img.src = logo; img.alt = CONFIG.title; } else { img.style.display = "none"; }
    if (!hasArtTitle) $("intro-title").textContent = CONFIG.title;
    $("intro-tagline").innerHTML = CONFIG.tagline;
    $("intro-demo").className = "demo-" + (CONFIG.intro.demo || "tap");
    $("demo-caption").textContent = CONFIG.intro.caption || "";
    $("btn-start").textContent = CONFIG.copy.start;
    $("btn-cta").textContent = CONFIG.copy.ctaBar;
    $("btn-install").textContent = CONFIG.copy.ctaEnd;
    $("btn-replay").textContent = CONFIG.copy.replay;
    $("hud-score-lbl").textContent = CONFIG.copy.scoreLabel;
    $("eo-scorelbl").textContent = CONFIG.copy.endScore;
  }

  // --- End screen: the cinematic reveal ----------------------------------
  // Beats: title -> score count-up (+confetti) -> stars -> stat rows -> CTA.
  var EndScreen = (function () {
    var timers = [];
    var T_TITLE = 120, T_SCORE = 560, T_STARS = 1950, STAR_GAP = 440,
        ROW_GAP = 250, T_CTA_AFTER = 1500;
    // The reveal climbs: each star rings the same chime a step higher. RATE
    // drives the embedded "uiStar" clip, FREQ the synthesized fallback.
    var STAR_RATE = [1, 1.19, 1.42], STAR_FREQ = [660, 880, 1180];

    function countUp(el, target, dur, cb) {
      var start = performance.now();
      function step(now) {
        var p = clamp((now - start) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(e * target);
        if (p < 1) requestAnimationFrame(step);
        else { el.textContent = target; if (cb) cb(); }
      }
      requestAnimationFrame(step);
    }

    // result: { title, variant:""|"win"|"perfect", score, stars:0..3|null,
    //           rows:[{label, value, grade}] }
    function show(result) {
      timers.forEach(clearTimeout); timers = [];
      Confetti.clear();
      function T(fn, ms) { timers.push(setTimeout(fn, ms)); }

      var title = $("eo-title");
      title.textContent = result.title || CONFIG.copy.gameOver;
      Fit.one("eo-title");
      Fit.one("eo-score", String(result.score || 0));
      title.className = "eo-title" + (result.variant ? " " + result.variant : "");
      ["eo-title", "eo-scorelbl", "eo-score"].forEach(function (id) { $(id).classList.remove("show", "pop"); });
      $("eo-score").textContent = "0";
      $("btn-install").classList.remove("show");
      $("btn-replay").classList.remove("show");

      // Stars (pass null / undefined to hide the row entirely).
      var stars = result.stars;
      var hasStars = stars != null;
      $("eo-stars").classList.toggle("hidden", !hasStars);
      for (var i = 1; i <= 3; i++) $("star-" + i).className = "star";

      // Stat rows are rebuilt every round so a replay starts clean.
      var rows = result.rows || [];
      var box = $("eo-stats"), html = "";
      rows.forEach(function (r, i) {
        var label = r.grade === "gold"
          ? '<span class="spark">✦</span> ' + r.label + ' <span class="spark">✦</span>'
          : r.label;
        html += '<div class="eo-row' + (r.grade ? " " + r.grade : "") + '" id="eo-row-' + i + '">' +
                '<span>' + label + '</span><span class="eo-val" id="eo-val-' + i + '">0</span></div>';
      });
      box.innerHTML = html;

      /* THE CHARACTER GIVES UP ROOM AS THE COLUMN CLAIMS IT. It arrives at
         full size with the title, alone on the screen, and every beat that
         writes something over it takes it one step down toward the corner
         figure — so the count is the number of beats left after the title, and
         `settle` is called from each of them. A game with three stat rows
         therefore shrinks it in five steps and one with six in eight: the face
         is done making room exactly when the screen is done filling. */
      var beats = 1 + (hasStars ? 1 : 0) + rows.length + 1, beat = 0;
      function settle() { Art.settleCharacter(++beat / beats); }

      // 1) Title slams in, and the character rises with it — one beat, so the
      //    screen reads as a reaction to the round rather than as a slideshow.
      Art.hideCharacter();
      T(function () {
        title.classList.add("show");
        Art.showCharacter(stars);
      }, T_TITLE);

      // 2) Final score counts up, greeted by confetti.
      T(function () {
        $("eo-scorelbl").classList.add("show");
        $("eo-score").classList.add("show");
        settle();
        Confetti.burst(70);
        countUp($("eo-score"), result.score || 0, 1100, function () {
          $("eo-score").classList.add("pop");
          Sound.cue("uiScore", 0.8, 1, 900, 0.14);
          Confetti.burst(90);
        });
      }, T_SCORE);

      // 3) Stars slam in one by one, each with a rising chime.
      var afterStars = T_SCORE + 900;
      if (hasStars) {
        T(function () {
          for (var s = 1; s <= 3; s++) $("star-" + s).classList.add("dim");
          settle();
        }, T_STARS - 160);
        for (var si = 0; si < stars; si++) {
          (function (idx) {
            T(function () {
              var el = $("star-" + (idx + 1));
              el.classList.remove("dim"); el.classList.add("on");
              Sound.cue("uiStar", 0.75, STAR_RATE[idx] || 1.42, STAR_FREQ[idx] || 1180, 0.16);
              Confetti.burst(30);
            }, T_STARS + idx * STAR_GAP);
          })(si);
        }
        afterStars = T_STARS + Math.max(stars, 1) * STAR_GAP + 350;
      }

      // 4) Stat rows cascade in, counters animating.
      rows.forEach(function (r, i) {
        T(function () {
          $("eo-row-" + i).classList.add("show");
          settle();
          var el = $("eo-val-" + i);
          if (typeof r.value === "number") countUp(el, r.value, 450);
          else el.textContent = r.value;
          Sound.cue("uiRow", 0.5, 1 + i * 0.07, 480 + i * 70, 0.05);
        }, afterStars + i * ROW_GAP);
      });

      // 5) Install CTA, then the discreet replay link.
      var ctaAt = afterStars + rows.length * ROW_GAP + T_CTA_AFTER;
      T(function () { $("btn-install").classList.add("show"); settle(); }, ctaAt);
      T(function () { $("btn-replay").classList.add("show"); }, ctaAt + 500);
    }
    return { show: show };
  })();

  /* --- Perf: a readout on the device itself ------------------------------
     Add `?perf=1` to a game's URL and this box appears; without it not a line
     of it runs. It exists because the two machines disagree: a desktop absorbs
     costs a phone cannot, and no bench on a laptop reproduces the phone that
     is actually stuttering.

     What it shows, and why that split is the whole point:

       fps / worst     the real frame interval, which includes everything —
                       script, style, layout, paint, raster, composite.
       main            how much of the worst frame the MAIN THREAD owned, read
                       from the browser's own long-animation-frame report
                       (Chromium; Firefox has no equivalent and shows "n/a").
       verdict         `main` says which half to look at. A long frame with a
                       long `main` is JavaScript, style or layout — profile the
                       game code. A long frame with a SHORT `main` is paint,
                       raster or compositing: the main thread was idle and the
                       frame still missed, which is what an animated paint
                       property or an oversized layer does, and it is the one
                       failure a JS profiler cannot see.

     Read it while playing, not on the menu: the callouts and the HUD only cost
     anything once a round is running.                                       */
  var Perf = (function () {
    var on = false;
    /* `perf=1` is the live readout, `perf=bench` the self-measuring sweep
       further down. Anything else, and not a line of this module runs. */
    try { on = /[?&#]perf=(1|bench)\b/.test(location.search + location.hash); } catch (e) {}
    if (!on) return { frame: function () {} };

    /* `?perf=1&off=vig,decor` switches a suspect off ON THE DEVICE. The probe
       above says whether a stutter is main-thread or paint/raster; it cannot
       say WHICH layer, and no bench on a laptop reproduces a phone's raster.
       So the bisect moves here: turn one thing off, play the same beat, watch
       `worst`. What is available, from the cheapest guess to the broadest:

         vig     Overlay.vignette — a full-frame repaint, because the colour is
                 assigned per call, blurred over the whole frame
         fx      the canvas juice: bursts, rings, the full-frame flash, shake
         pops    every callout, outright
       and, once `pops` has been shown to be the one, inside a callout:
         decor   the layers behind the word (band, dots, rays, ring, chevrons)
         word    the word's glyph layers, all of them
         glow    just the two BLURRED text-shadows
         shadow  the whole text-shadow stack, blurred and solid
         stroke  just the 14px path stroke around the glyphs
         face    just the gradient face (a second glyph pass, clipped)
         sub     the sub-line under the word

       Canvas drawing is rasterized off the main thread too, so `fx` and `pops`
       together separate the two halves of a pickup: if `off=fx` flattens the
       spike it is the canvas, if `off=pops` does it is the DOM. The box lists
       what is currently off, so a reading is never misattributed. */
    var off = {};
    try {
      var m = /[?&]off=([a-z,]+)/.exec(location.search + location.hash);
      if (m) {
        var names = m[1].split(",");
        for (var k = 0; k < names.length; k++) off[names[k]] = true;
      }
    } catch (e) {}

    function noop() {}
    if (off.vig)  Overlay.vignette = noop;
    if (off.pops) Pop.show = function () { return null; };
    if (off.fx) {
      Fx.burst = noop; Fx.ring = noop; Fx.flash = noop; Fx.shake = noop; Fx.text = noop;
    }
    /* Inside a callout, the word is rendered several times over: a 14px path
       stroke, three solid extrusion copies, two blurred ones, and a second
       glyph pass used as the mask for the gradient face. Each of these takes
       one of them out, so a reading names the layer instead of the module. */
    var OFF_CSS = {
      decor:  ".pop-d,.pop-d-dash,.pop-d-spark{display:none!important}",
      shadow: ".pop-ltr{text-shadow:none!important}",
      glow:   ".pop-ltr{text-shadow:0 5px 0 var(--ink),0 10px 0 var(--ink)," +
              "0 15px 0 var(--ink2)!important}",              // the two blurs only
      stroke: ".pop-ltr{-webkit-text-stroke-width:0!important}",
      face:   ".pop-ltr::before{display:none!important}",
      sub:    ".pop-sub{display:none!important}",
      word:   ".pop-ltr{text-shadow:none!important;-webkit-text-stroke-width:0!important}" +
              ".pop-ltr::before{display:none!important}"
    };
    var rules = "", key;   /* OFF_CSS is also what the ?perf=bench sweep applies */
    for (key in OFF_CSS) if (off[key]) rules += OFF_CSS[key];
    if (rules) {
      var css = document.createElement("style");
      css.textContent = rules;
      document.head.appendChild(css);
    }
    var offList = Object.keys(off).join(",");

    /* `?perf=bench` — the device measures itself.
       A laptop cannot stand in for a phone here, and it was tried: a software
       rasterizer says a callout's halftone decor is 92% of its cost and the
       blurred shadows nothing, while this phone said the opposite, because a
       GPU fills area almost for free and pays for blur passes instead. And the
       GPU's own work cannot be read back — it is asynchronous and Chrome
       exposes no per-layer timing (see tools/lab/bench-raster.mjs, which says
       the same at more length).
       So the sweep runs here. It fires the same callout over and over, once
       per variant, back to back in one session on one device, and prints a
       table: same hardware, same thermal state, same everything but the layer
       under test. Read the ORDER of the rows, not the milliseconds.
       Start a round, put the phone down, wait — it takes about a minute. */
    var bench = false;
    try { bench = /[?&]perf=bench\b/.test(location.search + location.hash); } catch (e) {}

    var box = null, prev = 0, frames = 0, worst = 0, over = 0, since = 0;
    var mainWorst = 0, mainKnown = false;
    /* Ask whether the browser CAN report a long main-thread frame, rather than
       waiting for one to arrive. It is the case that matters: a long frame with
       no report is the verdict, so "no report yet" and "cannot report" must not
       look the same. */
    try {
      mainKnown = !!(window.PerformanceObserver && PerformanceObserver.supportedEntryTypes &&
        PerformanceObserver.supportedEntryTypes.indexOf("long-animation-frame") >= 0);
    } catch (e) {}

    /* The browser reports a long animation frame with the main thread's share
       of it already broken down. Only the total is used here: the interesting
       question on a phone is not which main-thread phase was slow, it is
       whether the main thread was involved at all. */
    try {
      new PerformanceObserver(function (list) {
        var e = list.getEntries();
        for (var i = 0; i < e.length; i++) if (e[i].duration > mainWorst) mainWorst = e[i].duration;
      }).observe({ type: "long-animation-frame", buffered: false });
    } catch (e) {}

    function ensure() {
      if (box) return box;
      box = document.createElement("div");
      /* Inline styles, outside the frame: a probe must not need a rule in the
         motor stylesheet, and it must not ride the frame's scale transform. */
      box.style.cssText = "position:fixed;left:6px;top:6px;z-index:9999;" +
        "padding:6px 8px;border-radius:6px;background:rgba(0,0,0,.72);color:#eafcff;" +
        "font:700 11px/1.45 ui-monospace,Menlo,Consolas,monospace;white-space:pre;" +
        "pointer-events:none;text-align:left";
      document.body.appendChild(box);
      return box;
    }

    function frame() {
      var t = (window.performance && performance.now) ? performance.now() : Date.now();
      if (prev) {
        var dt = t - prev;
        frames++; since += dt;
        if (dt > worst) worst = dt;
        if (dt > 32) over++;
        /* In sweep mode the box belongs to the sweep's table: the live
           readout would overwrite it once a second. */
        if (since >= 1000 && bench) { frames = 0; since = 0; worst = 0; over = 0; mainWorst = 0; }
        else if (since >= 1000) {
          var fps = Math.round(frames * 1000 / since);
          var main = mainKnown ? Math.round(mainWorst) + "ms" : "n/a";
          var verdict = worst < 32 ? "ok"
            : !mainKnown ? "slow — no main-thread report here"
            : mainWorst > worst * 0.6 ? "main thread" : "paint/raster";
          ensure().textContent =
            "fps " + fps + "   worst " + Math.round(worst) + "ms\n" +
            "main " + main + "   >32ms " + over + "/s" +
            (verdict ? "\n" + verdict : "") +
            (offList ? "\noff: " + offList : "");
          frames = 0; since = 0; worst = 0; over = 0; mainWorst = 0;
        }
      }
      prev = t;
    }

    /* --- the device sweep ------------------------------------------------
       Each pass: apply one variant's CSS, fire N callouts on a fixed cadence,
       and keep the frame intervals. Nothing here touches the game's own state
       beyond showing callouts, so the round keeps playing under it. */
    var PASSES = ["base", "glow", "shadow", "face", "decor", "word", "sub"];
    var SWEEP_STYLE = "bonus";        // the callout a pickup fires
    var SWEEP_N = 16, SWEEP_GAP = 260;

    function benchRun() {
      var css = document.createElement("style");
      document.head.appendChild(css);
      var results = [], pass = 0;

      function report(done) {
        var lines = ["callout: " + SWEEP_STYLE + "  x" + SWEEP_N, ""], i, r;
        lines.push("variant   p95  worst  slow/s");
        for (i = 0; i < results.length; i++) {
          r = results[i];
          lines.push(pad(r.name, 9) + pad(Math.round(r.p95), 5) + pad(Math.round(r.worst), 7) +
            (Math.round(r.rate * 10) / 10));
        }
        if (!done) lines.push("…" + PASSES[pass]);
        ensure().textContent = lines.join("\n");
      }
      function pad(v, n) { v = String(v); while (v.length < n) v += " "; return v; }

      function next() {
        if (pass >= PASSES.length) { report(true); return; }
        var name = PASSES[pass];
        css.textContent = name === "base" ? "" : (OFF_CSS[name] || "");
        report(false);
        var stamps = [], fired = 0;
        var running = true;
        function tick(t) { if (!running) return; stamps.push(t); requestAnimationFrame(tick); }
        requestAnimationFrame(tick);
        var iv = setInterval(function () {
          if (fired++ >= SWEEP_N) {
            clearInterval(iv);
            setTimeout(function () {
              running = false;
              var d = [], i;
              for (i = 1; i < stamps.length; i++) d.push(stamps[i] - stamps[i - 1]);
              d.sort(function (a, b) { return a - b; });
              var over = 0;
              for (i = 0; i < d.length; i++) if (d[i] > 32) over++;
              /* Frames over 32 ms per SECOND, not per pass: a pass that ran a
                 little longer would otherwise look worse than one that did
                 not. p95 and worst are already durations. */
              var secs = 0, j;
              for (j = 0; j < d.length; j++) secs += d[j];
              secs = secs / 1000 || 1;
              results.push({
                name: name,
                p95: d.length ? d[Math.min(d.length - 1, Math.floor(d.length * 0.95))] : 0,
                worst: d.length ? d[d.length - 1] : 0,
                rate: over / secs
              });
              pass++;
              Pop.clear();
              next();
            }, 500);
            return;
          }
          Pop.show(SWEEP_STYLE, { word: "COMBO X5", sub: "+120", silent: true });
        }, SWEEP_GAP);
      }
      next();
    }

    /* The sweep needs a round underway: a callout over the menu measures the
       menu. It starts itself on the first frame the game actually renders. */
    var benchStarted = false;
    function maybeBench() {
      if (!bench || benchStarted) return;
      benchStarted = true;
      ensure().textContent = "bench: starting…";
      setTimeout(benchRun, 1200);
    }

    return { frame: function () { maybeBench(); frame(); } };
  })();

  // --- Round clock -------------------------------------------------------
  var Round = (function () {
    var left = 0, running = false, fired = false;
    function reset() {
      left = CONFIG.gameSeconds; running = true; fired = false;
      if (CONFIG.gameSeconds > 0) HUD.setTime(left);
    }
    function tick(dt) {
      if (!running || CONFIG.gameSeconds <= 0) return;
      left = Math.max(0, left - dt);
      HUD.setTime(left);
      if (left <= 0 && !fired) {
        fired = true;
        // The game decides what "time up" means (end now, sudden death…).
        if (Game.onTimeUp) Game.onTimeUp();
        else endRound({ title: CONFIG.copy.timeUp });
      }
    }
    return {
      reset: reset, tick: tick, stop: function () { running = false; },
      left: function () { return left; },
      elapsed: function () { return CONFIG.gameSeconds - left; }
    };
  })();

  // --- The single way a round ends ---------------------------------------
  // result: { title, variant, score, stars, rows, track }
  function endRound(result) {
    if (State === "end") return;
    result = result || {};
    Loop.stop(); Round.stop();
    Music.duck(0.55, 0.8);        // let the end-screen cues sit on top
    var score = result.score == null ? Math.round(HUD.score()) : result.score;
    var best = Math.max(score, Store.get("bestScore", 0));
    Store.set("bestScore", best);
    setState("end");
    EndScreen.show({
      title: result.title || CONFIG.copy.gameOver,
      variant: result.variant || "",
      score: score,
      stars: result.stars,
      rows: result.rows || []
    });
    Ad.track("game_end", result.track || { score: score, best: best });
  }

