  /* ===================================================================
     4. AD NETWORK GLUE — MRAID + CTA + tracking. Do not remove.
     =================================================================== */
  var Ad = (function () {
    function platform() {
      var ua = navigator.userAgent || "";
      if (/iPad|iPhone|iPod/.test(ua)) return "ios";
      if (/android/i.test(ua)) return "android";
      return "fallback";
    }
    function targetUrl() { return CONFIG.storeUrl[platform()] || CONFIG.storeUrl.fallback; }

    // Start only once the ad container says it is ready (instant standalone).
    function whenReady(cb) {
      if (!window.mraid) return cb();
      if (mraid.getState && mraid.getState() === "loading") mraid.addEventListener("ready", cb);
      else cb();
    }
    // Pause the game while the ad is off-screen, where the network reports it.
    function watchVisibility() {
      try {
        if (window.mraid && mraid.addEventListener) {
          mraid.addEventListener("viewableChange", function (viewable) {
            if (viewable) { Loop.resume(); Music.resume(); }
            else { Loop.pause(); Music.pause(); }
          });
        }
      } catch (e) {}
    }
    // The ONLY way out of the creative. Order matters: MRAID, then the common
    // network globals, then a plain window.open.
    function openStore() {
      track("cta_click");
      var url = targetUrl();
      try { if (window.mraid && typeof mraid.open === "function") { mraid.open(url); return; } } catch (e) {}
      try { if (typeof window.install === "function") { window.install(); return; } } catch (e) {}
      try { if (window.ExitApi && typeof ExitApi.exit === "function") { ExitApi.exit(); return; } } catch (e) {}
      try { if (typeof window.mintegral_playable_exit === "function") { window.mintegral_playable_exit(); return; } } catch (e) {}
      window.open(url, "_blank");
    }
    function track(event, data) { try { console.log("[playable]", event, data || ""); } catch (e) {} }
    return { whenReady: whenReady, watchVisibility: watchVisibility, openStore: openStore, track: track };
  })();

