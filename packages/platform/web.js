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

    /* Delta 4 — the landscape cut of the game's own painting, for the bands
       around the frame that only a desktop window has.
       `assets/art/<slug>-background-desk.webp` is injected as
       `CONFIG.art.backgroundDesk` by the builder, and ONLY for this target: a
       playable runs in a fixed portrait iframe and has no band to fill, so it
       would carry 30 KB it can never show (the same reason it ships no font).

       It travels as a custom property because the layer that paints it is a
       stylesheet — packages/frame-web/frame.css, which keeps the threshold and
       the whole dressing in one place. The class travels with it because a
       picture needs a scrim and an absent picture must not get one: a bare
       `var(--art-bg-desk, none)` would leave the scrim darkening the window of
       a game that ships no artwork. Two facts, one contract, and frame.css
       falls back to the gradient it has always drawn. */
    (function () {
      var desk = CONFIG.art && CONFIG.art.backgroundDesk;
      if (!desk) return;
      /* The URL is resolved against the document before it goes in, and that
         is not decoration. In the split site build CONFIG.art holds a path
         relative to the GAME's folder ("assets/backgroundDesk.<hash>.webp"),
         while the var() that substitutes it lives in the motor stylesheet one
         directory up — and a relative url() inside a custom property is
         resolved against the sheet that uses it, so the browser looked for the
         picture next to the shared engine.css and found nothing. Absolute, the
         question does not arise. A data URI (every other build) comes back
         from new URL() untouched. */
      var url = desk;
      try { url = new URL(desk, document.baseURI).href; } catch (e) {}
      var root = document.documentElement;
      root.style.setProperty("--art-bg-desk", "url(" + url + ")");
      root.className += (root.className ? " " : "") + "has-art-desk";
    })();

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
