/* ==========================================================================
   Newrare — analytics

   Vercel Web Analytics, and nothing else. The script is served from the
   deployment's own origin (/_vercel/insights/script.js), so the site keeps its
   rule of no third-party host, no CDN and no web font: there is still exactly
   one origin on the network tab.

   Three properties this file is built around:
     1. It is inert off Vercel. Opening site/index.html from the disk, or
        serving it on localhost, makes no request at all — a preview build and a
        local edit never pollute the numbers.
     2. It is optional. Every call goes through track(), which does nothing when
        the collector was never loaded, so no caller has to check.
     3. It never reaches the games. The playables are copied verbatim into
        dist/site/games/<slug>/ and stay self-contained files with zero
        requests; what they report, they report by postMessage (see below).

   What we measure and why: phase 6 of docs/INDUSTRIALIZATION.md decides which
   games go further from how often they are started and replayed. That is the
   whole brief — page views, plus one event per game start.
   ========================================================================== */
'use strict';

var Analytics = (function () {
  var COLLECTOR = '/_vercel/insights/script.js';
  var enabled = false;

  /* The collector is only useful on the deployed site. Anywhere else — the
     file:// disk copy, localhost, a LAN address — measurement is noise. */
  function shouldLoad() {
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return false;
    var host = location.hostname;
    if (!host) return false;
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
    if (/\.local$/.test(host)) return false;
    return true;
  }

  function init() {
    if (!shouldLoad()) return;

    /* The queue has to exist before the script does: events fired during page
       load are replayed once the collector arrives. */
    window.va = window.va || function () {
      (window.vaq = window.vaq || []).push(arguments);
    };

    var tag = document.createElement('script');
    tag.defer = true;
    tag.src = COLLECTOR;
    document.head.appendChild(tag);
    enabled = true;

    listenToGames();
  }

  /* One event, one name, a flat bag of scalars — that is all the collector
     accepts, and all we need. */
  function track(name, data) {
    if (!enabled || typeof window.va !== 'function') return;
    window.va('event', { name: name, data: data || {} });
  }

  /* The games run in a same-origin iframe. They send nothing today; the web
     adapter (phase 4) is what will make Platform.track() post to the parent.
     The listener lives here so that when it does, the site side already exists
     and the games still ship as files with no analytics code of their own. */
  function listenToGames() {
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin) return;
      var msg = e.data;
      if (!msg || msg.source !== 'newrare' || typeof msg.event !== 'string') return;

      var data = { game: String(msg.game || 'unknown') };
      if (msg.data && typeof msg.data === 'object') {
        for (var key in msg.data) {
          if (!Object.prototype.hasOwnProperty.call(msg.data, key)) continue;
          var value = msg.data[key];
          var type = typeof value;
          if (type === 'string' || type === 'number' || type === 'boolean') data[key] = value;
        }
      }
      track('game:' + msg.event, data);
    });
  }

  return { init: init, track: track };
})();

Analytics.init();
