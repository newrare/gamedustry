/* =============================================================================
  DEV — the view the band's DEV pill opens, on a machine that is plainly not a
  player's (localhost, a loopback, a LAN address).

  The shell is made of waits — a day for the daily road, two for a wound, five
  for a prisoner, four hours for the camp's news and for the raid that comes
  with a return — and a card that shows up once a day is a card nobody can
  work on. A clock that ran an hour a second was the first answer, and it
  could not be used: everything happened at once, and nothing on purpose.
  This view is the second, and it is two tabs:

    EVENTS   every card and every action the layers can fire, one tap each,
             grouped by the layer that owns it. A layer REGISTERS its own
             (`W.Dev.entry`, packages/webshell/meta.js): the function that
             opens a card is private to the file that draws it, so this list
             is never a second copy of anybody's code. Every one of them is
             the real thing — it reads the save and writes it — so a card
             that needs the camp to hold something says so instead.

    CLOCK    the game's clock, moved by hand, by a step picked once:
               ADVANCE    the hours pass with the player in the game;
               RECONNECT  the player leaves and comes back that much later,
                          and the page reloads, since the boot is the one
                          faithful copy of a return.
             and the way back to the real clock.

  The pill wears the offset while the clock is ahead ("Dev +52h"). Nothing of
  this is built anywhere else: a deployed site's hostname is none of these,
  and a file:// page is how tools/lab/shoot-screens.mjs opens a build, so it
  shows no pill and has no door here.

  It is a development tool, so its own words are in English whatever the
  player's language — like every page of lab/ — and a camp day keeps the
  manifest's title in the language the game is in.

  ES5-ish, same WebViews as the rest.
============================================================================= */
(function () {
  "use strict";

  var W = window.__WEB__;
  var VW = window.__VIEW__;
  if (!W || !VW || !W.Dev || !W.Dev.local || location.hostname === "") return;

  /* The steps, in hours: one, the camp's news and the raid's absence, a
     mission board, a day, a wound, a prisoner. */
  var HOURS = [1, 4, 8, 24, 48, 120];
  var STEP_KEY = "dev:step";
  var step = +W.Store.get(STEP_KEY, 4) || 4;
  if (HOURS.indexOf(step) < 0) step = 4;

  var S = null, tab = "events", beat = null;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function text(tag, cls, str) {
    var n = el(tag, cls);
    n.textContent = str;
    return n;
  }

  /* ── the header: what time the game thinks it is ───────────────────────── */

  function offsetWord() {
    var h = Math.round(W.Dev.offset / 3600000);
    if (!h) return "Real time";
    return "Real time +" + (h >= 48 ? Math.floor(h / 24) + "d " + (h % 24) + "h" : h + "h");
  }
  function clockLine() {
    var d = new Date(W.Dev.now()), when;
    try {
      when = d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short",
                                         hour: "2-digit", minute: "2-digit" });
    } catch (e) { when = d.toString(); }
    return when + " · " + offsetWord();
  }

  function build() {
    S = VW.sheet({ id: "dv-screen", cls: "dv-screen" });
    S.body.classList.add("dv-body");
    S.pages([{ key: "events", label: "Events", icon: "gift" },
             { key: "clock", label: "Clock", icon: "clock" }],
            function (k) { tab = k; paint(); });
  }

  function paint() {
    if (!S) return;
    S.setHead("Dev", clockLine());
    S.light(tab);
    S.body.innerHTML = "";
    if (tab === "clock") paintClock();
    else paintEvents();
  }

  /* ── EVENTS ────────────────────────────────────────────────────────────── */

  function paintEvents() {
    var list = W.Dev.entries(), groups = [], by = {}, i, e, g;
    for (i = 0; i < list.length; i++) {
      e = list[i];
      g = e.group || "Other";
      if (!by[g]) { by[g] = []; groups.push(g); }
      by[g].push(e);
    }
    if (!groups.length) {
      S.body.appendChild(text("p", "dv-note", "No layer of this game registers an event."));
      return;
    }
    for (i = 0; i < groups.length; i++) {
      S.body.appendChild(text("h3", "dv-group", W.upper(groups[i]) + " · " + by[groups[i]].length));
      var box = el("div", "dv-list");
      for (var j = 0; j < by[groups[i]].length; j++) box.appendChild(row(by[groups[i]][j]));
      S.body.appendChild(box);
    }
  }

  function row(e) {
    var b = el("button", "dv-row" + (e.tone ? " " + e.tone : ""));
    var label = typeof e.label === "function" ? e.label() : e.label;
    b.appendChild(text("b", "dv-label", label || "?"));
    if (e.sub) b.appendChild(text("span", "dv-sub", e.sub));
    b.addEventListener("click", function () {
      try { e.run(); }
      catch (err) {
        W.Notify.say("Failed: " + label, { sub: String(err && err.message || err), kind: "loss" });
        if (window.console) console.error(err);
      }
    });
    return b;
  }

  /* ── CLOCK ─────────────────────────────────────────────────────────────── */

  function paintClock() {
    var body = S.body;

    body.appendChild(text("h3", "dv-group", W.upper("Step")));
    var chips = el("div", "dv-steps");
    for (var i = 0; i < HOURS.length; i++) (function (h) {
      var c = el("button", "btn btn-sm btn-plate dv-step" + (h === step ? " on" : ""),
                 h >= 24 ? (h / 24) + "d" : h + "h");
      c.setAttribute("aria-pressed", h === step ? "true" : "false");
      c.addEventListener("click", function () {
        step = h;
        W.Store.set(STEP_KEY, h);
        paint();
      });
      chips.appendChild(c);
    })(HOURS[i]);
    body.appendChild(chips);

    action(body, "Advance " + stepWord(),
      "The hours pass with you in the game: every wait they end is over, the camp's news " +
      "is due at the village, and nothing counts as an absence — no raid.",
      "", function () {
        W.Dev.advance(step);
        W.Notify.say("Clock +" + stepWord(), { kind: "info", key: "dev" });
      });

    action(body, "Reconnect after " + stepWord(),
      "You leave and come back " + stepWord() + " later: the page reloads, and the absence " +
      "counts — a raid on the defense after " + awayHours() + "h, the camp's news, the returns.",
      "", function () { W.Dev.away(step); });

    if (W.Dev.offset) {
      action(body, "Back to real time",
        "The clock drops its " + offsetWord().replace("Real time ", "") + ". A deadline written " +
        "while it was ahead keeps its date, and is that much further off now.",
        "btn-danger", function () {
          W.Dev.reset();
          W.Notify.say("Real time", { kind: "info", key: "dev" });
        });
    }
  }

  function stepWord() { return step >= 24 ? (step / 24) + " day" + (step > 24 ? "s" : "") : step + "h"; }

  /* The raid's absence, read off the manifest so the line never lies about
     it; four hours where a game declares none. */
  function awayHours() {
    var a = W.CONFIG && W.CONFIG.web && W.CONFIG.web.army;
    return (a && a.defense && a.defense.attack && a.defense.attack.awayHours) || 4;
  }

  function action(body, label, sub, cls, fn) {
    var box = el("div", "dv-act");
    var b = text("button", "btn btn-wide" + (cls ? " " + cls : ""), label);
    b.addEventListener("click", fn);
    box.appendChild(b);
    box.appendChild(text("p", "dv-sub", sub));
    body.appendChild(box);
  }

  /* ── the view ──────────────────────────────────────────────────────────── */

  VW.define("dev", {
    build: build,
    node: function () { return S.box; },
    show: function (o) {
      if (o && o.tab) tab = o.tab;
      S.body.scrollTop = 0;
      paint();
      /* the header's minutes, while the view stands */
      if (!beat) beat = setInterval(function () { if (S) S.setHead("Dev", clockLine()); }, 30000);
    },
    hide: function () { if (beat) { clearInterval(beat); beat = null; } },
    hud: true
  });

  W.Dev.onChange(function () { if (VW.top() === "dev") paint(); });
})();
