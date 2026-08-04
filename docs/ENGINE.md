# The Playable Motor

Every playable in this repo is the **same shell with a different game module**.
That shell — the *motor* — lives in
[`template/game-template.html`](../template/game-template.html) and is the
default starting point for any new concept.

A playable always needs the same things, so the motor owns them:

| Layer          | What it is                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Frame**      | A portrait 720×1280 design space, letterbox-scaled to any screen. Canvas *and* DOM overlays share those coordinates.              |
| **Intro**      | Logo, title, one-line pitch, an **animated how-to-play demo**, start button.                                                      |
| **HUD**        | Top band: big animated score, timer, two free slots. Kept clear of notches and camera cut-outs.                                   |
| **Overlay**    | Screen-space notification layer over the game view: toasts, combo banners, reward badges, dramatic edge glow.                     |
| **CTA bar**    | Bottom band with the install button, visible during the whole round, lifted above the home indicator.                             |
| **Fx**         | Canvas juice: particles, rings, floating text, screen shake, colour flash, hit-stop.                                              |
| **End screen** | Cinematic reveal: title, score count-up with confetti, star rating, cascading stat rows, big install CTA and a small replay link. |
| **Ad glue**    | MRAID readiness, pause when not viewable, one `Ad.openStore()` for every CTA.                                                     |

**A new game writes `CONFIG`, `ASSETS` and the `Game` module. Nothing else.**

## Coordinate system

- The creative is authored at **720 × 1280 design pixels** (portrait, fixed).
- `#frame` is a 720×1280 block scaled with a CSS transform, so **all DOM
  overlays are written in design pixels too** — never `vw`, `vh` or `clamp()`
  inside the frame.
- The canvas renders in the same units: `ctx` is pre-transformed, so
  `ctx.fillRect(0, 0, 720, 1280)` always fills the screen.
- `Input` converts pointer events back into design pixels.

```
        720 design px
   ┌────────────────────┐  ← device notch / status bar  (view.insetTop)
   │   HUD  (hudHeight) │
   ├────────────────────┤  ← Layout.top
   │                    │
   │    gameplay area   │    Layout.left / right / w / h / cx / cy
   │                    │
   ├────────────────────┤  ← Layout.bottom
   │ CTA bar (ctaHeight)│
   └────────────────────┘  ← home indicator (view.insetBottom)
```

### `view`

| Field                           | Meaning                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `view.w`, `view.h`              | Design size (720 × 1280).                                                                               |
| `view.scale`                    | design px → screen px factor.                                                                           |
| `view.insetTop` / `insetBottom` | Design pixels eaten by the notch / home indicator, **after** the letterbox bars are taken into account. |

### `Layout`

The rectangle gameplay may safely use: below the HUD, above the CTA bar and
clear of the device insets. Recomputed on every resize and orientation change.

```js
Layout.top, Layout.bottom, Layout.left, Layout.right   // edges
Layout.w, Layout.h, Layout.cx, Layout.cy               // size + centre
```

**Author gameplay against `Layout`, never against hard-coded y values.** That is
what keeps the score, timer and CTA from being covered by a bubble grid or a
bouncing ball — and what keeps the HUD out from under a camera cut-out.

## Screen flow

```
loading ──► intro ──► playing ──► end ──┐
                        ▲               │  "Replay the demo"
                        └───────────────┘
```

- `setState(name)` toggles the screens and shows the HUD + CTA bar only while
  `playing`.
- `startGame()` unlocks audio, resets Fx/Overlay/Game/Round and starts the loop.
  It is bound to both the intro button and the end-screen replay link.
- `endRound(result)` is the single exit from a round (see below).

## CONFIG reference

```js
var CONFIG = {
  title:   "GAME TITLE",                  // intro title + tracking
  tagline: "One line…<br>…max two.",      // intro pitch (HTML allowed)
  gameSeconds: 20,                        // round clock; 0 = endless

  storeUrl: { ios:"…", android:"…", fallback:"…" },

  designWidth: 720, designHeight: 1280,
  bg: "#0a0a1c",

  // Bands the motor reserves; Layout is derived from these + safe-area insets.
  layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 30 },

  // logo   : key in ASSETS.images (null = text-only intro)
  // demo   : tap | hold | drag | swipe | aim
  // caption: one short line under the demo
  intro: { logo: "logo", demo: "tap", caption: "TAP to hit the target" },

  hud: { score: true, timer: true },

  // Every piece of user-facing copy, in one place.
  copy: {
    start:"TAP TO PLAY", ctaBar:"INSTALL NOW", ctaEnd:"PLAY THE FULL GAME",
    replay:"Replay the demo", scoreLabel:"SCORE", timeLabel:"TIME",
    endScore:"FINAL SCORE", gameOver:"GAME OVER", timeUp:"TIME'S UP!"
  },

  // …then your own tunables: speeds, spawn rates, tolerances, palettes.
};
```

## The `Game` contract

```js
var Game = (function () {
  function reset()  { /* required — build a fresh round            */ }
  function update(dt) { /* required — advance the sim, dt in seconds */ }
  function render() { /* required — draw the world in design px     */ }

  function onDown(p) {}   // optional — p = {x, y} in design px
  function onMove(p) {}   // optional
  function onUp(p)   {}   // optional
  function onTimeUp(){}   // optional — the round clock hit zero
  function onResize(){}   // optional — Layout changed (rebuild caches)

  return { reset:reset, update:update, render:render, onDown:onDown,
           onTimeUp:onTimeUp, onResize:onResize };
})();
```

Ending a round — the only way:

```js
endRound({
  title:   "GAME OVER",          // defaults to CONFIG.copy.gameOver
  variant: "" | "win" | "perfect",
  score:   score,                // defaults to the HUD score
  stars:   2,                    // 0..3 — omit to hide the star row
  rows: [                        // stat rows, cascade in, numbers count up
    { label:"HITS",       value: 23 },
    { label:"MAX COMBO",  value: 9,  grade:"accent" },
    { label:"BEST SCORE", value: 1840, grade:"gold" }
  ],
  track: { /* extra analytics payload */ }
});
```

Row grades: `gold` (trophy treatment: shine sweep + twinkling sparks), `accent`,
`good`, `warn`, `bad`, or omitted for neutral. `value` may be a string, in which
case it is written as-is instead of counted up.

`endRound` stops the loop, stores the best score, switches to the end screen and
plays the reveal. It is idempotent — calling it twice does nothing the second
time.

### If the clock should not end the round

Implement `onTimeUp()` and do something else. Chainring releases a spiked
sudden-death ring instead of ending:

```js
function onTimeUp() { if (!doom) spawnDoom(); }   // the run ends on contact
```

Without `onTimeUp`, the motor ends the round with `CONFIG.copy.timeUp`.

## Frame pipeline

The bootstrap drives every frame, so a game only draws its own world:

```js
frameUpdate(dt):
  if (Fx.frozen(dt)) { Fx.update(dt); return; }   // hit-stop
  Round.tick(dt)                                   // clock + HUD timer
  Game.update(dt)
  Fx.update(dt)
  HUD.tick(dt)                                     // eases the score counter

frameRender():
  Fx.begin()      // screen-shake transform
  Game.render()   // background + world
  Fx.render()     // particles, rings, floating text on top of the world
  Fx.end()
  Fx.post()       // full-frame colour flash, unshaken
```

## Module reference

### `HUD`

```js
HUD.setScore(v)          // set the target; the display eases toward it
HUD.setScoreNow(v)       // set instantly (use in reset())
HUD.punch(color)         // bump animation + brief colour tint on a gain
HUD.setLeft(text, label, cls)    // left pill  ("x7" / "COMBO")
HUD.setRight(text, label, cls)   // right pill (the timer uses it)
HUD.setTime(seconds)     // called by Round; turns red under 5 s
HUD.score()              // current target score
```

`cls` may be `warn` (red) or any class you add in the game's CSS. Pass `null` as
the text to empty a slot.

### `Overlay` — screen-space notifications

```js
Overlay.toast("+1 LIFE", { color:"#4bf5ff", dur:1400 });  // pill under the HUD
Overlay.banner("COMBO x8", "+160", { color:"#ffd43b" });   // big mid-screen hit
Overlay.reward("SUPER BLAST!");                            // badge that pops
Overlay.vignette("#ff2d55", 0.9, 600);                     // edge glow (ms = auto-off)
Overlay.clear();                                           // wipe everything
```

Use `Overlay` for UI-level feedback and `Fx.text` for anything anchored to a
world position.

### `Fx` — canvas juice

```js
Fx.burst(x, y, { color, count, speed, size, life, grav, angle, spread });
Fx.ring(x, y, { from, to, color, width, life });
Fx.text(x, y, "+120", { color, size, tier:0..3, life, vy });
Fx.shake(magnitude, seconds);
Fx.flash(color, alpha, decay);
Fx.freeze(seconds);     // hit-stop: the world pauses, the effects do not
Fx.reset();             // called for you by startGame()
```

`tier` escalates the text treatment (outline → glow → gradient) — 0 for a plain
`+10`, 3 for a screen-shaking milestone. `color` may be an array: each particle
picks one.

### `Round`

```js
Round.left()      // seconds remaining
Round.elapsed()   // seconds played — handy for difficulty ramps
Round.stop()
```

### Engine basics

```js
view, Layout, ctx, canvas          // see above
Input.on("down"|"move"|"up", fn)   // design-space pointer events
Loop.start(u, r) / stop() / pause() / resume()
Sound.unlock()                             // must run in a user gesture (iOS)
Sound.beep(freq, dur, type, vol)
Sound.arp([freqs], stepMs, dur, type, vol) // rising celebration run
Sound.clip(name, vol, rate)                // embedded ASSETS.sounds (WebAudio)
Store.get(key, def) / Store.set(key, value)          // safe localStorage
Rand.range(a,b) / int(a,b) / pick(arr) / chance(p)
preloadImages(done) → Images[key]          // decoded embedded images
Confetti.burst(n) / clear()
rgba("#rrggbb", alpha) → "rgba(…)"
clamp(v, lo, hi)
```

### `Ad`

```js
Ad.whenReady(cb)        // MRAID ready, or immediately when standalone
Ad.openStore()          // the ONLY way out — wire every CTA to it
Ad.track(event, data)   // logging stub; swap for a network SDK if needed
Ad.watchVisibility()    // pauses the loop while the ad is off-screen
```

## The animated how-to-play demo

`CONFIG.intro.demo` picks one of five pure-CSS animations, drawn with a
fingertip inside a small stage:

| Value   | Shows                                                                   |
| ------- | ----------------------------------------------------------------------- |
| `tap`   | A finger tapping a pulsing target ring.                                 |
| `hold`  | A finger held down while the target charges.                            |
| `drag`  | A finger sliding along a dashed track.                                  |
| `swipe` | A finger flicking across, with a direction arrow.                       |
| `aim`   | A finger sweeping at the bottom while a dotted beam pivots at a target. |

Add a variant by adding a `.demo-<name>` block to the stylesheet — the markup
already carries every piece (`.demo-target`, `.demo-hand`, `.demo-track`,
`.demo-arrow`, `.demo-beam`).

## Theming — the SKIN block

A game's stylesheet is **the motor stylesheet, unchanged, plus one skin block at
the end**:

```css
  /* =========================================================================
     SKIN — CHAINRING. Everything above is the shared motor stylesheet; the
     theme lives in the :root tokens and only these rules are game-specific.
     ========================================================================= */
  :root { --bg:#0a0e24; --accent:#3aa0ff; --cta-a:#ff8fab; --cta-b:#ff3d6b; }
  html, body { background:radial-gradient(…); }
  #intro-title { /* a gradient-text title, for instance */ }
```

Tokens available: `--bg`, `--text`, `--muted`, `--accent`, `--cta-a`, `--cta-b`,
`--cta-text`, `--danger`, `--gold`, `--good`, `--panel`, `--panel-line`.

`--scale`, `--hud-h`, `--cta-h`, `--inset-top` and `--inset-bottom` are written
by the engine at runtime; never set them by hand.

Keep the block header starting with `SKIN — ` : that marker is what
`tools/check-motor.mjs` uses to tell your CSS from the motor's.

## Keeping the motor shared

```bash
node tools/check-motor.mjs        # report any game that drifted from the template
node tools/check-motor.mjs --fix  # rewrite the shared parts from the template
```

It compares, byte for byte, script sections 3/4/5 and 7 plus the whole
stylesheet above the `SKIN —` block. Run it after editing the template (to push
the change out) and before shipping (to catch a fix that was made in one game
only). If a game genuinely needs different engine behaviour, add it to the
template behind a `CONFIG` flag and re-run `--fix`.

## Rules of the motor

- **Do not fork sections 3, 4, 5 and 7.** They are identical byte-for-byte
  across games, which is what makes a fix in one game applyable to all. Need a
  new gesture or effect? Extend the engine module and carry it back to the
  template.
- **Never read `window.innerWidth`** in game code — use `view` and `Layout`.
- **Never hard-code a y coordinate** for the play area — derive it from
  `Layout`.
- **No `shadowBlur` in per-frame canvas drawing.** Pre-render sprites once
  (see Bubble Blight's cached bubbles) or fake glow with concentric circles
  (see Chainring's ball).
- **All timing in seconds** (`dt`), never frames.
- **Every CTA goes through `Ad.openStore()`.**
- One self-contained HTML file, no external requests, under 5 MB
  (`node tools/check-size.mjs`).

## Reference implementations

- [`games/ring-combo/`](../games/ring-combo/index.html) — timing tap, combo
  multiplier, chain-reaction payoff, `onTimeUp` sudden death, 6 stat rows.
- [`games/bubble-shooter/`](../games/bubble-shooter/index.html) — drag-to-aim
  with a trajectory preview, hex grid, cached sprites, an embedded background,
  pressure rows and a danger line.
- [`games/orbinity/`](../games/orbinity/index.html) — orbital slingshot: a
  constant-arc-length ribbon trail, procedurally generated planet sprites, a
  cached starfield, gravity fields that curve a shot, a landing hint that
  integrates the *same* step function as the simulation, a snake whose girth and
  palette follow the combo tier, spawn placement that avoids the flight path,
  and a combo that dies on a wall bounce or on stalling.

They all use the same sections 3/4/5/7. Diff them to see exactly how little a
game has to own.
