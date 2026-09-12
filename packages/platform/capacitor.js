  /* ===================================================================
     4. AD NETWORK GLUE — the android build's stand-in. Fourth
     implementation of the slot packages/platform/mraid.js and
     packages/platform/web.js already fill, so the shell and the
     bootstrap above and below it are unchanged.

     The android target is the web build inside a Capacitor WebView:
     same menu, same options, same FR/EN switch (packages/webshell), the
     whole bundle on the device. What is native, and what this file
     therefore owns, is only what a browser tab has no equivalent of —
     the hardware back button, the app going to the background, and
     leaving the app.

     The first three deltas below are the same as web.js's, and they are
     restated rather than shared because the two targets have to be able
     to diverge: this one runs on one device shape, behind one WebView,
     with no tab and no iframe around it. Whoever changes one should
     read the other.
     =================================================================== */
  var Ad = (function () {
    // The Capacitor bridge, when the page runs inside the app. Absent when the
    // same directory is opened in a browser, which is how it is debugged.
    function plugin(name) {
      try {
        var C = window.Capacitor;
        return (C && C.Plugins && C.Plugins[name]) || null;
      } catch (e) { return null; }
    }

    /* Delta 3 — no install CTA on a store app: the player already
       installed it. The band the CTA bar reserved goes back to the play
       area. This runs before --cta-h is written and before the first
       relayout(), so Layout is computed with the space already freed. */
    CONFIG.layout.ctaHeight = 0;

    /* Delta 1 — the bezel packages/frame-web draws needs a margin of
       screen pixels. A phone is below the threshold and gets 0, which is
       the whole point; a tablet is not, and Play reviews on one. */
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

    /* Delta 4 — the landscape cut of the game's painting, for the bands a
       window wider than the frame has. Same contract as web.js: the class
       travels with the URL so an absent picture gets no scrim. */
    (function () {
      var desk = CONFIG.art && CONFIG.art.backgroundDesk;
      if (!desk) return;
      var url = desk;
      try { url = new URL(desk, document.baseURI).href; } catch (e) {}
      var root = document.documentElement;
      root.style.setProperty("--art-bg-desk", "url(" + url + ")");
      root.className += (root.className ? " " : "") + "has-art-desk";
    })();

    // Nothing to wait for: the WebView is the container and it is up.
    function whenReady(cb) { cb(); }

    /* Off-screen on a phone is the app being backgrounded, which the
       WebView reports as a visibility change — and, when @capacitor/app is
       installed, as appStateChange, which also fires when the screen locks.
       Both are wired: the second is the reliable one, the first is what the
       same build does in a browser. */
    function watchVisibility() {
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) suspend(); else wake();
      });
      var App = plugin("App");
      if (App && App.addListener) {
        App.addListener("appStateChange", function (s) {
          if (s && s.isActive) wake(); else suspend();
        });
        App.addListener("backButton", back);
      }
    }
    function suspend() { Loop.pause(); Music.pause(); }
    function wake() { Loop.resume(); Music.resume(); }

    /* The hardware back button is ESCAPE. The web shell already owns that
       key — it closes a panel, closes the pause card, and pauses a running
       round — so the button is dispatched as one and nothing here has to
       know what screen is up. Nobody took it (the menu, with nothing open)
       means back is "leave the app", which is what Play expects of it. */
    function back() {
      var e;
      try {
        e = new KeyboardEvent("keydown", { key: "Escape", keyCode: 27, bubbles: true, cancelable: true });
      } catch (err) {                                  // old WebView
        e = document.createEvent("Event");
        e.initEvent("keydown", true, true);
        e.key = "Escape";
        e.keyCode = 27;
      }
      window.dispatchEvent(e);
      if (e.defaultPrevented) return;
      var App = plugin("App");
      if (App && App.exitApp) App.exitApp();
    }

    /* There is no store to send anyone to: this IS the store app. The web
       shell rewires every button that called this one and the CTA bar is
       hidden, so reaching it means a button was missed. */
    function openStore() { track("cta_click_ignored"); }

    function track(event, data) { try { console.log("[android]", event, data || ""); } catch (e) {} }
    return { whenReady: whenReady, watchVisibility: watchVisibility, openStore: openStore, track: track };
  })();
