  /* ===================================================================
     7. BOOTSTRAP — wiring. Rarely edited.
     =================================================================== */
  function frameUpdate(dt) {
    Beat.update(dt);                                // music does not hit-stop
    if (Fx.frozen(dt)) { Fx.update(dt); return; }   // hit-stop: only fx advance
    Round.tick(dt);
    if (State !== "playing") return;                // a game may have ended us
    Game.update(dt);
    Fx.update(dt);
    HUD.tick(dt);
  }
  function frameRender() {
    Fx.begin();      // shake transform
    Game.render();   // the world
    Fx.render();     // particles / rings / floating text above it
    Fx.end();
    Fx.post();       // full-frame flash, unshaken
  }

  function startGame() {
    Sound.unlock();                       // must run inside a user gesture (iOS)
    Music.start();                        // no-op without ASSETS.sounds.music
    Music.unduck();                       // back to full bed after an end screen
    Fx.reset(); Overlay.clear(); Confetti.clear();
    Beat.reset();                         // musical clock, before the game reads it
    Game.reset();
    Round.reset();
    setState("playing");
    Ad.track("game_start");
    Loop.start(frameUpdate, frameRender);
  }

  /* Desktop convenience — the creative must be playable without a touchscreen.
     SPACE mirrors a screen tap: it starts the round from the intro, replays from
     the end screen (once the replay link is out), and during play it is
     forwarded to the game as a tap at the centre of the play area. That only
     makes sense for a one-touch mechanic, so it is enabled for the "tap" and
     "hold" demos.
     LEFT / RIGHT (or A / D) mirror a lateral flick for a "swipe" game: the
     engine synthesizes the whole down/move/up gesture through Input.swipe, so
     the game reads the keyboard through the very same code path as a finger.
     CONFIG.keyboard = false opts out of both. */
  function spaceIsATap() {
    if (CONFIG.keyboard === false) return false;
    var demo = CONFIG.intro.demo || "tap";
    return demo === "tap" || demo === "hold";
  }
  function arrowsAreASwipe() {
    if (CONFIG.keyboard === false) return false;
    return (CONFIG.intro.demo || "tap") === "swipe";
  }
  function bindKeys() {
    var held = false;                    // ignore the auto-repeat of a held key
    function isSpace(e) { return e.code === "Space" || e.key === " " || e.keyCode === 32; }
    function arrowDir(e) {
      if (e.code === "ArrowLeft"  || e.key === "ArrowLeft"  || e.key === "a" || e.key === "A" || e.keyCode === 37) return -1;
      if (e.code === "ArrowRight" || e.key === "ArrowRight" || e.key === "d" || e.key === "D" || e.keyCode === 39) return 1;
      return 0;
    }
    window.addEventListener("keydown", function (e) {
      var dir = arrowsAreASwipe() ? arrowDir(e) : 0;
      if (dir && State === "playing") {
        e.preventDefault();              // no page scroll
        if (!e.repeat) Input.swipe(dir); // one flick per press, never auto-repeat
        return;
      }
      if (!isSpace(e)) return;
      e.preventDefault();                // no page scroll, no button re-click
      if (e.repeat || held) return;
      if (State === "intro") { startGame(); return; }
      if (State === "end") {
        if ($("btn-replay").classList.contains("show")) startGame();
        return;
      }
      if (State !== "playing" || !spaceIsATap()) return;
      held = true;
      Input.at("down", Layout.cx, Layout.cy);
    });
    window.addEventListener("keyup", function (e) {
      if (!isSpace(e) || !held) return;
      held = false;
      Input.at("up", Layout.cx, Layout.cy);
    });
  }

  function init() {
    buildIntro();
    cssVar("--hud-h", CONFIG.layout.hudHeight + "px");
    cssVar("--cta-h", CONFIG.layout.ctaHeight + "px");
    fitCanvas();

    // Route pointer input to the game only while it is playing.
    Input.on("down", function (p) { if (State === "playing" && Game.onDown) Game.onDown(p); });
    Input.on("move", function (p) { if (State === "playing" && Game.onMove) Game.onMove(p); });
    Input.on("up",   function (p) { if (State === "playing" && Game.onUp)   Game.onUp(p); });

    bindKeys();

    $("btn-start").addEventListener("click", startGame);
    $("btn-replay").addEventListener("click", startGame);
    $("btn-install").addEventListener("click", Ad.openStore);
    $("btn-cta").addEventListener("click", Ad.openStore);

    Ad.watchVisibility();
    preloadImages(function () {
      Ad.whenReady(function () {
        setState("intro");
        Pop.prewarm();          // pay the callouts' first-raster cost off-gameplay
        Ad.track("loaded");
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

