  /* ===================================================================
     5. SHELL — state machine, HUD, overlay, intro, end screen.
     The parts of a playable that never change shape between games.
     =================================================================== */

  var State = "loading";   // loading | intro | playing | end

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
  }

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

    function show(name, opt) {
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

    return { show: show, clear: clear, prewarm: prewarm, styles: STYLES, anchors: ANCHORS };
  })();

  // --- Intro: logo, copy and the animated how-to-play demo ----------------
  function buildIntro() {
    var logo = CONFIG.intro.logo && ASSETS.images[CONFIG.intro.logo];
    var img = $("app-icon");
    if (logo) { img.src = logo; img.alt = CONFIG.title; } else { img.style.display = "none"; }
    $("intro-title").textContent = CONFIG.title;
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

      // 1) Title slams in.
      T(function () { title.classList.add("show"); }, T_TITLE);

      // 2) Final score counts up, greeted by confetti.
      T(function () {
        $("eo-scorelbl").classList.add("show");
        $("eo-score").classList.add("show");
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
        T(function () { for (var s = 1; s <= 3; s++) $("star-" + s).classList.add("dim"); }, T_STARS - 160);
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
          var el = $("eo-val-" + i);
          if (typeof r.value === "number") countUp(el, r.value, 450);
          else el.textContent = r.value;
          Sound.cue("uiRow", 0.5, 1 + i * 0.07, 480 + i * 70, 0.05);
        }, afterStars + i * ROW_GAP);
      });

      // 5) Install CTA, then the discreet replay link.
      var ctaAt = afterStars + rows.length * ROW_GAP + T_CTA_AFTER;
      T(function () { $("btn-install").classList.add("show"); }, ctaAt);
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
    try { on = /(^|[?&#])perf=1\b/.test(location.search + location.hash); } catch (e) {}
    if (!on) return { frame: function () {} };

    /* `?perf=1&off=vig,decor` switches a suspect off ON THE DEVICE. The probe
       above says whether a stutter is main-thread or paint/raster; it cannot
       say WHICH layer, and no bench on a laptop reproduces a phone's raster.
       So the bisect moves here: turn one thing off, play the same beat, watch
       `worst`. What is available, from the cheapest guess to the broadest:

         vig     Overlay.vignette — a full-frame repaint, because the colour is
                 assigned per call, blurred over the whole frame
         decor   the layers behind a callout's word (band, dots, rays, ring…)
         word    the word's own three glyph layers (stroke, extrusion, glow)
         pops    every callout, outright
         fx      the canvas juice: bursts, rings, the full-frame flash, shake

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
    if (off.decor || off.word) {
      var css = document.createElement("style");
      css.textContent =
        (off.decor ? ".pop-d,.pop-d-dash,.pop-d-spark{display:none!important}" : "") +
        (off.word ? ".pop-ltr{text-shadow:none!important;-webkit-text-stroke-width:0!important}" +
                    ".pop-ltr::before{display:none!important}" : "");
      document.head.appendChild(css);
    }
    var offList = Object.keys(off).join(",");

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
        if (since >= 1000) {
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
    return { frame: frame };
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

