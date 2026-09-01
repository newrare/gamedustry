  /* ===================================================================
     4. AD NETWORK GLUE — the web build's stand-in. Same shape as
     packages/platform/mraid.js, so the shell and the bootstrap are
     unchanged: only the outlet behind them differs.
     =================================================================== */
  var Ad = (function () {
    /* Delta 3 — a web build has no install CTA, so the band the CTA bar
       reserved at the bottom goes back to the play area. This runs before the
       shell and the bootstrap, i.e. before --cta-h is written and before the
       first relayout(), so Layout is computed with the space already freed. */
    CONFIG.layout.ctaHeight = 0;

    /* Delta 1 — on a desktop window the portrait frame is flush against the
       top and bottom of the screen, which cuts the bezel packages/frame-web
       draws around it. A margin of screen pixels gives it room. It is an
       accessor rather than a number because the answer changes with the
       window: a phone must still fill its screen, so the threshold below is
       the one frame.css uses for the dressing itself (62/100, 480px) and the
       two must be changed together. */
    function framePad() {
      var w = window.innerWidth, h = window.innerHeight;
      if (h < 480 || w / h < 0.62) return 0;
      return Math.min(30, Math.round(h * 0.035));
    }
    try {
      Object.defineProperty(CONFIG.layout, "framePad", { get: framePad });
    } catch (e) {
      CONFIG.layout.framePad = framePad();     // ES3 WebView: fixed at load
    }

    // No ad container to wait for: the page is the container.
    function whenReady(cb) { cb(); }

    /* On the web the tab, not the network, says when the game is off-screen.
       The site also plays a game inside an iframe and drops its src on close,
       which stops the loop outright; this covers the plain background tab. */
    function watchVisibility() {
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { Loop.pause(); Music.pause(); }
        else { Loop.resume(); Music.resume(); }
      });
    }

    /* There is no store to open from a web build: the game IS the destination.
       The web shell rewires every button that called this one, and the CTA bar
       is hidden, so reaching it means a button was missed — say so in the
       console rather than opening a tab nobody asked for. */
    function openStore() { track("cta_click_ignored"); }

    function track(event, data) { try { console.log("[web]", event, data || ""); } catch (e) {} }
    return { whenReady: whenReady, watchVisibility: watchVisibility, openStore: openStore, track: track };
  })();
