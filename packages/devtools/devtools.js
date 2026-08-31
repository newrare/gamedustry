/*
  devtools — the layer the `proto` target adds on top of the motor.

  Loaded only by `node tools/build/build.mjs --target=proto`. It reads the motor
  through window.__PROTO__, which the proto build injects into the bootstrap; on
  a playable build neither this file nor that object exists.

  What it gives a prototype:
    - the round starts by itself, with no intro, no CTA and no end screen
    - a panel with fps, dt, state, clock, the run counter and any counters the
      game opts into through Game.debugCounts()
    - a slider for every number in CONFIG, written back live
    - a canvas overlay: the Layout band, the device insets, the pointer
    - keys:  R reset · SPACE pause/step · T tap · [ ] speed · ` panel
    - URL overrides: ?seed=42 ?speed=2 ?loop=0 ?dev=0 ?<config.path>=<number>

  ES5-ish on purpose, like the motor: this runs in the same mobile WebViews.
*/
(function () {
  "use strict";

  var P = window.__PROTO__;
  if (!P) return;                       // not a proto build

  var q = new URLSearchParams(location.search);
  var SHOW_PANEL = q.get("dev") !== "0";
  var AUTO_LOOP = q.get("loop") !== "0";   // restart instead of showing the end
  var speed = parseFloat(q.get("speed")) || 1;

  /* ── 1. CONFIG overrides from the URL ───────────────────────────────────
     Any dotted path that resolves to a number can be set: ?ballSpeed=900,
     ?spawn.every=0.4. Applied before init() reads CONFIG. */
  var RESERVED = { seed: 1, speed: 1, loop: 1, dev: 1 };

  function resolve(obj, dotted) {
    var parts = dotted.split(".");
    for (var i = 0; i < parts.length - 1; i++) {
      if (obj === null || typeof obj !== "object") return null;
      obj = obj[parts[i]];
    }
    var last = parts[parts.length - 1];
    if (obj === null || typeof obj !== "object" || !(last in obj)) return null;
    return { owner: obj, key: last };
  }

  /* The override is typed off the value already in CONFIG, so ?debug=true sets a
     boolean and ?intro.demo=hold sets a string, while a number stays a number.
     An unknown path is ignored rather than invented. */
  function coerce(current, raw) {
    if (typeof current === "boolean") {
      if (raw === "1" || raw === "true") return true;
      if (raw === "0" || raw === "false") return false;
      return null;
    }
    if (typeof current === "number") {
      var n = parseFloat(raw);
      return isNaN(n) ? null : n;
    }
    if (typeof current === "string") return raw;
    return null;                        // objects and arrays are not overridable
  }

  var applied = [];
  q.forEach(function (value, key) {
    if (RESERVED[key]) return;
    var slot = resolve(P.CONFIG, key);
    if (!slot) return;
    var v = coerce(slot.owner[slot.key], value);
    if (v === null) return;
    slot.owner[slot.key] = v;
    applied.push(key + "=" + v);
  });

  // The CTA bar is gone in a proto, so its band goes back to Layout.
  if (P.CONFIG.layout) P.CONFIG.layout.ctaHeight = 0;

  /* ── 2. The tunable list ────────────────────────────────────────────────
     Every number in CONFIG that is not motor plumbing. Two levels of nesting
     cover how games actually write their knobs. */
  var SKIP = {
    designWidth: 1, designHeight: 1, storeUrl: 1, intro: 1, copy: 1,
    layout: 1, music: 1, keyboard: 1, title: 1, tagline: 1, bg: 1, gameSeconds: 0
  };

  function collectTunables(obj, prefix, depth, out) {
    for (var key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      if (!prefix && SKIP[key]) continue;
      var v = obj[key];
      var path = prefix ? prefix + "." + key : key;
      if (typeof v === "number" && isFinite(v)) out.push({ path: path, owner: obj, key: key, initial: v });
      else if (v && typeof v === "object" && !Array.isArray(v) && depth < 2) collectTunables(v, path, depth + 1, out);
    }
    return out;
  }

  var tunables = collectTunables(P.CONFIG, "", 0, []);

  /* ── 3. State ───────────────────────────────────────────────────────────*/
  var paused = false;
  var runs = 0;
  var frames = 0;
  var fps = 0, fpsFrames = 0, fpsSince = 0, lastDt = 0;
  var pointer = null;

  /* ── 4. The panel ───────────────────────────────────────────────────────*/
  var el = {};

  function panel() {
    var root = document.createElement("div");
    root.id = "dev-panel";
    root.innerHTML =
      '<header><b>PROTO</b><span id="dev-stats"></span>' +
        '<button id="dev-fold" title="Collapse (`)">–</button></header>' +
      '<div id="dev-body">' +
        '<div class="dev-row" id="dev-keys">' +
          '<span><kbd>R</kbd> reset</span><span><kbd>SPACE</kbd> pause / step</span>' +
          '<span><kbd>T</kbd> tap</span><span><kbd>[</kbd><kbd>]</kbd> speed</span>' +
        '</div>' +
        '<div id="dev-tunables"></div>' +
      '</div>';
    document.body.appendChild(root);
    el.root = root;
    el.stats = root.querySelector("#dev-stats");
    el.body = root.querySelector("#dev-body");
    el.tunables = root.querySelector("#dev-tunables");
    root.querySelector("#dev-fold").addEventListener("click", fold);

    if (applied.length) {
      var note = document.createElement("div");
      note.className = "dev-note";
      note.textContent = "from URL: " + applied.join("  ");
      el.body.insertBefore(note, el.tunables);
    }
    buildTunables();
  }

  function fold() {
    el.root.classList.toggle("folded");
  }

  function buildTunables() {
    if (!tunables.length) {
      el.tunables.innerHTML = '<div class="dev-note">CONFIG holds no tunable number.</div>';
      return;
    }
    tunables.forEach(function (t) {
      var span = Math.abs(t.initial) || 1;
      var min = t.initial < 0 ? -span * 3 : 0;
      var max = span * 3;
      var step = span >= 100 ? 1 : span >= 10 ? 0.5 : span >= 1 ? 0.05 : 0.001;

      var row = document.createElement("label");
      row.className = "dev-tune";
      row.innerHTML =
        '<span class="dev-tune-name">' + t.path + '</span>' +
        '<input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + t.initial + '">' +
        '<input type="number" step="' + step + '" value="' + t.initial + '">';
      var range = row.querySelector('input[type=range]');
      var num = row.querySelector('input[type=number]');

      function set(v) {
        var n = parseFloat(v);
        if (isNaN(n)) return;
        t.owner[t.key] = n;
        range.value = n; num.value = n;
        row.classList.toggle("changed", n !== t.initial);
      }
      range.addEventListener("input", function () { set(range.value); });
      num.addEventListener("change", function () { set(num.value); });
      el.tunables.appendChild(row);
    });
  }

  /* How many things the game thinks are alive. Generic counting is impossible —
     only the game knows what an entity is — so this is opt-in: a Game module may
     expose debugCounts() returning {label: number}. The shapes drawn by
     debugShapes() are counted for free. */
  function counters() {
    var parts = [];
    if (P.Game.debugCounts) {
      var c = P.Game.debugCounts() || {};
      for (var k in c) if (Object.prototype.hasOwnProperty.call(c, k)) parts.push(k + " " + c[k]);
    }
    if (P.Game.debugShapes) {
      var shapes = P.Game.debugShapes();
      if (shapes) parts.push("shapes " + shapes.length);
    }
    return parts.length ? " · " + parts.join(" · ") : "";
  }

  function stats() {
    if (!el.stats) return;
    var left = P.Round && P.Round.left ? P.Round.left() : 0;
    el.stats.textContent =
      fps + " fps · " + (lastDt * 1000).toFixed(1) + " ms · " +
      P.state() + (paused ? " (paused)" : "") +
      " · run " + runs +
      (left > 0 ? " · " + left.toFixed(1) + "s left" : "") +
      (speed !== 1 ? " · x" + speed : "") +
      counters();
  }

  /* ── 5. The canvas overlay ──────────────────────────────────────────────
     Drawn after the game's own render, in design coordinates. It shows what a
     game must never guess: where Layout actually is on this viewport. */
  function overlay() {
    var ctx = P.ctx, L = P.Layout, v = P.view;

    ctx.save();
    ctx.lineWidth = 2;

    // The band gameplay may use.
    ctx.strokeStyle = "rgba(80,255,180,.55)";
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(L.left + 1, L.top + 1, L.w - 2, L.h - 2);
    ctx.setLineDash([]);

    // The device insets the motor reserved.
    ctx.fillStyle = "rgba(255,90,140,.16)";
    if (v.insetTop) ctx.fillRect(0, 0, v.w, v.insetTop);
    if (v.insetBottom) ctx.fillRect(0, v.h - v.insetBottom, v.w, v.insetBottom);

    // Centre cross, for eyeballing symmetry.
    ctx.strokeStyle = "rgba(255,255,255,.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(L.cx, L.top); ctx.lineTo(L.cx, L.top + L.h);
    ctx.moveTo(L.left, L.cy); ctx.lineTo(L.left + L.w, L.cy);
    ctx.stroke();

    // Whatever the game chooses to expose.
    if (P.Game.debugShapes) {
      var shapes = P.Game.debugShapes() || [];
      ctx.strokeStyle = "rgba(255,220,60,.8)";
      ctx.lineWidth = 2;
      for (var i = 0; i < shapes.length; i++) {
        var s = shapes[i];
        ctx.beginPath();
        if (typeof s.r === "number") ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        else ctx.rect(s.x, s.y, s.w, s.h);
        ctx.stroke();
      }
    }

    if (pointer) {
      ctx.strokeStyle = "rgba(120,220,255,.9)";
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ── 6. Driving the loop ────────────────────────────────────────────────
     startGame() hands the motor's own callbacks to Loop; we hand it wrapped
     ones instead, so speed, pause and the overlay all ride the motor's clamped
     dt and its visibility handling. */
  function drive() {
    P.Loop.start(
      function (dt) {
        lastDt = dt;
        frames++;
        fpsFrames++;
        var now = performance.now();
        if (now - fpsSince >= 500) {
          fps = Math.round(fpsFrames * 1000 / (now - fpsSince));
          fpsFrames = 0; fpsSince = now;
        }
        P.frameUpdate(dt * speed);
      },
      function () {
        P.frameRender();
        if (SHOW_PANEL) overlay();
        stats();
      }
    );
  }

  function restart() {
    runs++;
    P.startGame();
    drive();
  }

  function step() {
    P.frameUpdate((1 / 60) * speed);
    P.frameRender();
    if (SHOW_PANEL) overlay();
    stats();
  }

  /* ── 7. Keys ────────────────────────────────────────────────────────────
     Captured before the motor's own handler, which binds SPACE as a tap. In a
     proto SPACE is the debugger's pause, and T is the tap. */
  function keys() {
    window.addEventListener("keydown", function (e) {
      var k = e.key;

      if (k === "`") { e.stopPropagation(); e.preventDefault(); fold(); return; }

      if (k === "r" || k === "R") {
        e.stopPropagation(); e.preventDefault();
        paused = false; P.Loop.resume(); restart();
        return;
      }

      if (k === " " || e.code === "Space") {
        e.stopPropagation(); e.preventDefault();
        if (e.repeat) { if (paused) step(); return; }   // hold to scrub
        if (!paused) { paused = true; P.Loop.pause(); stats(); }
        else step();
        return;
      }

      if (k === "t" || k === "T") {
        e.stopPropagation(); e.preventDefault();
        if (!e.repeat) P.Input.at("down", P.Layout.cx, P.Layout.cy);
        return;
      }

      if (k === "[") { e.preventDefault(); speed = Math.max(0.1, +(speed - 0.1).toFixed(2)); stats(); return; }
      if (k === "]") { e.preventDefault(); speed = Math.min(8, +(speed + 0.1).toFixed(2)); stats(); return; }
    }, true);

    window.addEventListener("keyup", function (e) {
      if ((e.key === "t" || e.key === "T")) {
        e.stopPropagation();
        P.Input.at("up", P.Layout.cx, P.Layout.cy);
      }
      if (e.key === " " || e.code === "Space") e.stopPropagation();
    }, true);
  }

  /* ── 8. Boot ────────────────────────────────────────────────────────────
     The motor reaches "intro" after preloadImages and Ad.whenReady; from there
     the proto starts itself, and restarts instead of showing an end screen. */
  function watch() {
    var s = P.state();
    if (s === "intro") restart();
    else if (s === "end" && AUTO_LOOP) restart();
    requestAnimationFrame(watch);
  }

  function boot() {
    if (SHOW_PANEL) panel();
    keys();
    P.Input.on("move", function (p) { pointer = p; });
    P.Input.on("down", function (p) { pointer = p; });
    requestAnimationFrame(watch);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
