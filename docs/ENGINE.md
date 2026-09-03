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
| **Pop**        | Comic / manga callouts over the game view: score gains, combo milestones, hero beats. The loud half of the notification layer.    |
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

| Field                           | Meaning                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `view.w`, `view.h`              | Design size (720 × 1280).                                                                                                                                                                                                |
| `view.scale`                    | design px → screen px factor.                                                                                                                                                                                            |
| `view.dpr`                      | design px → **device** px: what a canvas backing store must be sized in, `scale × devicePixelRatio` clamped to [1, 2]. Use it for a cached canvas instead of reading `devicePixelRatio`, which over-renders (see below). |
| `view.insetTop` / `insetBottom` | Design pixels eaten by the notch / home indicator, **after** the letterbox bars are taken into account.                                                                                                                  |

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

### Playing with the keyboard

Playables ship to phones, but they are authored and reviewed on a desktop. The
motor therefore maps the keyboard onto the two gestures it can fake:

| State     | SPACE does                                                          | ← / → (or A / D) do                      |
| --------- | ------------------------------------------------------------------- | ---------------------------------------- |
| `intro`   | `startGame()`                                                       | nothing                                  |
| `playing` | `Input.at("down"/"up", Layout.cx, Layout.cy)` — a tap at the centre | `Input.swipe(-1 / +1)` — a lateral flick |
| `end`     | replays, once the replay link has appeared                          | nothing                                  |

Each fallback is wired for the mechanic it fits, read off `CONFIG.intro.demo`:

- **SPACE as a tap** — `tap` and `hold` games. A game that reads the pointer
  position (`aim`, `drag`, `swipe`) still gets start and replay, but no
  synthetic tap, because a fixed point would be meaningless.
- **Arrows as a swipe** — `swipe` games. `Input.swipe(dir, dist)` fires a whole
  `down` → `move` → `up` gesture from `Layout.cx/cy`, `dist` design px to the
  side (150 by default), so the game reads the keyboard through the very same
  handlers as a finger and never grows a second input path. Auto-repeat is
  ignored: one press is one flick.

`CONFIG.keyboard = false` turns both off. Keys are consumed with
`preventDefault()`, so they never scroll the host page nor re-click a focused
button.

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

  // Desktop SPACE + arrow keys — see "Playing with the keyboard".
  keyboard: true,

  hud: { score: true, timer: true },

  // Background bed. bpm / beatOffset / loopBeats are only needed by a game
  // played on the beat — see `Music` and `Beat`.
  music: { volume: 0.10, fade: 2.0 },

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

The reveal scores itself through `Sound.cue`, on three keys the games embed in
`ASSETS.sounds`: `uiScore` (the count-up landing), `uiStar` (one chime per star,
pitched up by `STAR_RATE`) and `uiRow` (the stat-row tick). Drop the keys and
the same beats play as synthesized beeps — a new game sounds finished before it
has an sfx pack, and re-themes just by swapping the three clips.

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
  Beat.update(dt)                                  // musical clock — music
  if (Fx.frozen(dt)) { Fx.update(dt); return; }    // does not hit-stop
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

### Canvas resolution — `view.dpr`, and why it is not `devicePixelRatio`

A backing store must hold the pixels the display will actually show, and not
one more. The frame is scaled to fit the screen, so that number is
`view.scale × devicePixelRatio` per design pixel — which is what `view.dpr` is,
clamped to `[1, 2]`.

The motor used to size it `min(devicePixelRatio, 2)`, ignoring the scale, and
the difference is not small. On a 390×844 phone the canvas is displayed 390×693
CSS px, so:

| device                | drawn (before) | displayed | drawn / displayed |
| --------------------- | -------------- | --------- | ----------------- |
| phone, DPR 2          | 3.69 Mpx       | 1.08 Mpx  | **342%**          |
| phone, DPR 3          | 3.69 Mpx       | 2.43 Mpx  | **152%**          |
| desktop window, DPR 1 | 0.92 Mpx       | 0.27 Mpx  | 341% (kept)       |

Every frame, a phone drew between 1.5 and 3.4 times the pixels it could show,
and a desktop at DPR 1 drew 0.92 Mpx against the phone's 3.69 — four times
less. That is the shape of "it is smooth on my desktop and it stutters on my
phone", and it applies to every game at once because it is the canvas itself,
not anything a game does. `view.dpr` now lands on 100% of the displayed pixels
on both phone rows: the same picture, at 1:1, for a third to a quarter of the
fill.

The `[1, 2]` clamp is deliberate on both ends. The floor keeps a low-DPR screen
supersampled (that 341% row is today's behaviour, unchanged, and it is what
gives a DPR-1 display its anti-aliasing); the ceiling keeps a DPR-4 phone from
allocating 4.3 Mpx. Check what a device would get with
`node tools/lab/bench-pop.mjs --dprs=1,2,3`.

A game that pre-renders into its own canvas must use `view.dpr` too — read it
where the canvas is built, not once at load, so a resize is followed. Nothing
in a game should ever read `window.devicePixelRatio`.

### `?perf=1` — the readout on the device

A phone that stutters cannot be diagnosed on a laptop: the desktop absorbs
costs the phone cannot. Append `?perf=1` to a game's URL — the built file, the
web build, the site's iframe — and a small box reports, once a second, while a
round is running:

```
fps 41   worst 78ms
main 12ms   >32ms 9/s
paint/raster
```

`worst` is the real frame interval, everything included. `main` is how much of
it the main thread owned, taken from the browser's own long-animation-frame
report (Chromium only; Firefox shows `n/a`). **The gap between the two is the
diagnosis**: a long frame with a long `main` is script, style or layout, and a
profiler will find it; a long frame with a short `main` is paint, raster or
compositing — the main thread was idle and the frame still missed, which is
what an animated paint property or an oversized layer does, and what no JS
profiler shows. The box prints that verdict itself.

Without the flag not a line of it runs, and `Perf.frame()` in the bootstrap is
an empty function.

**`&off=…` bisects it on the same device.** The verdict says which half of the
pipeline is at fault, never which layer, so switch one suspect off and play the
same beat again:

| `off=`  | what it takes out                                            |
| ------- | ------------------------------------------------------------ |
| `vig`   | `Overlay.vignette` — a blurred repaint of the whole frame    |
| `decor` | the layers behind a callout's word (band, dots, rays, ring…) |
| `word`  | the word's own glyph layers (stroke, extrusion, glow)        |
| `pops`  | every callout, outright                                      |
| `fx`    | the canvas juice: bursts, rings, the full-frame flash, shake |

Several at once, comma separated: `?perf=1&off=vig,decor`. Canvas drawing is
rasterized off the main thread too, so `off=fx` against `off=pops` is what
separates the two halves of a pickup — the canvas or the DOM. The box lists
what is currently off, so a reading can never be misattributed.

### `Pop` — comic callouts

The loud half of the overlay. **Prefer it over `Overlay.banner` / `Overlay.toast`
and over `Fx.text` for anything that celebrates a player action** — score gains,
combo milestones, tier-ups, hero beats. Designed and previewed in
[`lab/overlay-pop.html`](../lab/overlay-pop.html).

```js
Pop.show("score", { word:"+250", at:{ x:ball.x, y:ball.y - 50 } });   // impact point
Pop.show("combo", { word:"COMBO x5", sub:"+120" });                   // milestone
Pop.show("ultra", { word:"CHAIN x20", sub:"+400" });                  // hero beat
var h = Pop.show("danger", { word:"SUDDEN DEATH", hold:-1 });         // stays…
h.close();                                                            // …until closed
Pop.clear();                                                          // wipe (Overlay.clear does it too)
```

Styles, from quiet to loud:

| style      | what it is                                         | default anchor |
| ---------- | -------------------------------------------------- | -------------- |
| `score`    | the small `+250` rising off the impact point       | caller-set     |
| `alert`    | a mistake: chain lost, wall hit. Compact, no decor | `hudUnder`     |
| `streak`   | chain staying alive, chevrons pushing sideways     | `left`         |
| `bonus`    | reward sticker on halftone dots                    | `lower`        |
| `ribbon`   | comic banner sweeping across                       | `upper`        |
| `combo`    | milestone chip on a shockwave                      | `upperRight`   |
| `perfect`  | gold + sparkles + rays, the "you nailed it" beat   | `upper`        |
| `manifest` | poster announcement (level up, unlock)             | `center`       |
| `danger`   | hazard tape, blinking for the whole hold           | `top`          |
| `record`   | end-of-run peak: band, rays, sparkles, confetti    | `center`       |
| `ultra`    | the hero moment: rays, chroma, maximum size        | `center`       |
| `vert`     | vertical manga column hugging one edge             | `edgeRight`    |

Per-call options: `word`, `sub`, `at` (anchor name or `{x,y}` in design px),
`rot`, `cls` (an extra class, to retint one call from the SKIN block), `hold`
(ms fully readable, `-1` = until `close()`), `enter` / `exit` (ms), `silent`
(build the callout without its full-frame impact — no shake, flash, edge glow or
confetti; used by the intro prewarm pass).

Anchors are fractions of `Layout`, so a callout is always clear of the HUD, the
CTA bar and the device insets: a 3×5 grid (`topLeft` … `bottomRight`) plus
`hudUnder`, `ctaAbove`, `edgeLeft`, `edgeRight`. An anchor is the **centre** of
the callout, so the top row already leaves room for a word plus its sub-line. An
over-long word is scaled down and pulled back inside the frame automatically, and
so are the two things that can be wider than it — the plate a style may put
around the word (`combo`) and the shockwave ring behind it — because `#ov-pops`
clips and an off-centre anchor would otherwise slice them off. The soft decors
(band, dots, rays, chevrons, stripes) are drawn wider than the frame on purpose
and keep bleeding off both edges.

Retheme a style from the game's SKIN block by overriding its tokens — never edit
the machinery:

```css
.pop-combo { --chip:#12042e; --chip-line:#c9b4ff;
  --fill:linear-gradient(180deg,#ffffff,#7c5cff); }
```

`combo` is the one callout a good run fires over and over, so it is built as the
cheapest thing in the catalogue: a chip that hugs its own word (the plate is a
`background` on `.pop-body`, not a decor node), a hollow ellipse for the
shockwave and four solid bars for the corner ticks — no `clip-path`, no mask, no
`filter`, no full-frame layer. Its entry (`chip`) never scales past 1.06, so the
compositor rasterizes it at the callout's own size. Retint it, leave the geometry
alone.

A style's full-frame impact (`shake`, `flash`, `vignette`, `confetti`) is
delegated to `Fx` and `Overlay`, so there is never a second shake system. Sound
stays with the caller: play your own sample on the same beat.

**A decor may animate `transform` and `opacity`, and nothing else.** The three
scrolling decors (the ribbon's speed lines, the hazard tape, the chevrons) used
to slide their gradient with `background-position`, which is a paint property:
the browser repainted the whole masked layer on every frame the callout was up.
On a phone that is the stall; a desktop absorbs it, which is why it went
unnoticed. Measured with `node tools/lab/bench-pop.mjs` on an emulated phone at
DPR 3, raster time over a 3 s window:

| callout  | before  | after |
| -------- | ------- | ----- |
| `ribbon` | 2575 ms | 85 ms |
| `danger` | 818 ms  | 34 ms |
| `streak` | 390 ms  | 43 ms |

The gradient now rides a `::before` one tile wider than its box and slides with
`transform`, which the compositor plays without a repaint — same picture, same
motion. `background-position`, `box-shadow`, `filter`, `left` / `top` and
`width` / `height` are all paint or layout properties: none of them belongs in
an animation that runs while a game does. Run the bench before adding a decor
that moves.

#### The overlay must never cost the gameplay a frame

A callout lands on the exact frame the player earned something — the worst
possible frame to drop. These rules are what keep it free, and they were all
measured (frame times recorded in a running round, not guessed):

- **`Pop.prewarm()` runs on the intro.** A style's first rasterization costs
  50–80 ms (gradient text clipped to glyphs, clip-paths, masks). The motor builds
  every style once, hidden, one per animation frame, while the intro is up. Do
  not remove the call in `init()`, and do not "optimize" it to
  `visibility:hidden` — an invisible layer is never rasterized, so it warms
  nothing.
- **The word is one layer.** Per-glyph nodes only exist for `letters` (staggered
  drop-in) and `vertical` styles; every other style paints the whole word as a
  single layer. Splitting a word into 9 gradient-clipped glyph layers costs ~8×
  the raster.
- **`will-change` on `.pop-word` / `.pop-anim` / `.pop-out`.** Without it the
  text is re-rasterized the instant the entry animation ends — a 40–50 ms frame,
  every single callout.
- **No CSS `filter` on a callout layer, ever.** A filter puts the node on its own
  offscreen render surface, which the compositor rasterizes at the *largest*
  scale of the entry animation — `slam` starts at `scale(3.1)`, so a 20 px glow
  costs ~9× the pixels of the word, in one blocking pass, on the exact frame the
  player earned. Measured (390×844 @3, software raster, CPU ×4): a `combo`
  callout stalled the frame train **50 ms** with `filter: drop-shadow`, **9 ms**
  with the same glow expressed as a `text-shadow` on `.pop-ltr`. A blurred
  text-shadow is cheap where a filter is not — Skia blurs the glyph mask into
  tiles the page already rasterizes, spread over the raster threads.
- **No full-screen decor layers.** Flashes go through `Fx.flash` (drawn on the
  canvas we already paint). The ray disc is sized to its **mask**, not to the
  frame: everything past 62 % of the radius is transparent, so the box is 560 px
  with the mask stops rescaled by the same factor — identical circle, 23 % less
  stalled frame time than the 760 px version. It is also **static**: rotating a
  masked conic gradient repaints it every frame and costs ~40 % of the frame
  budget for as long as the callout is up.
- **`flash` is for rare beats.** A full-screen white veil on a callout the player
  earns every few seconds reads as the game hitching, not as a reward. `combo`
  therefore carries none; `ultra` keeps its own.
- **A frequent callout is sized to its own text and entered from close by.** The
  compositor rasterizes an animated layer at the *largest* scale of its
  animation, so an entry that starts at `scale(3.1)` (`slam`) pays for ~9× the
  pixels it ever shows. `combo` used to slam a 600×430 jagged star built from two
  32-point `clip-path`s and hitch for a second doing it; the `chip` entry stays
  inside 0.86–1.06 and its decor is solid colour on rounded boxes animated with
  `transform` and `opacity` only, which the compositor plays without
  re-rasterizing anything.
- **Timings are short on purpose** (0.9–1.4 s end to end). Lengthen `hold` per
  call when a beat needs it; never raise the defaults.
- **At most 4 callouts live at once.** Over the cap the oldest is dropped. A
  player mashing the screen would otherwise stack a dozen layers — measured at
  18 taps/s that was 134 dropped frames in 9 s, and 0 with the cap. Games never
  have to rate-limit their own feedback.

If you add a style, measure it — and measure the **frame gap** it causes, not the
total raster it does. The two disagree: a `filter` does *less* total raster work
than the text-shadow that replaces it, but does it in one blocking pass, which is
what the player feels. On the reference profile above, every style except `ultra`
(its ray disc) and `manifest` (per-glyph nodes) now costs **zero** dropped
frames.

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
Input.at(type, x, y)               // synthesize one (used by the SPACE key)
Input.swipe(dir, dist)             // synthesize a whole flick (the arrow keys)
Loop.start(u, r) / stop() / pause() / resume()
Sound.unlock()                             // must run in a user gesture (iOS)
Sound.clip(name, vol, rate)                // embedded ASSETS.sounds — the default
Sound.beep(freq, dur, type, vol)           // synth fallback, for an event with no clip
Sound.arp([freqs], stepMs, dur, type, vol) // rising celebration run
Sound.cue(name, vol, rate, freq, dur, type) // clip if embedded, else a beep
Music.start() / stop(fade)                 // background bed (see below)
Music.duck(factor, secs) / unduck(secs)    // dip under a foreground moment
Beat.beats() / next(div) / pulse(div)      // the musical clock (see below)
Beat.period() / seconds(beats) / locked()
Store.get(key, def) / Store.set(key, value)          // localStorage + memory fallback
Rand.range(a,b) / int(a,b) / pick(arr) / chance(p)
preloadImages(done) → Images[key]          // decoded embedded images
Icon.draw(ctx, key, cx, cy, size, colour)  // an embedded SVG icon, tinted
Icon.get(key, size, colour) → canvas       // …or the tinted canvas itself
Confetti.burst(n) / clear()
rgba("#rrggbb", alpha) → "rgba(…)"
clamp(v, lo, hi)
```

Every sound effect is a clip picked from the shared **`assets/sfx/`** library and
embedded in `ASSETS.sounds` — see [ASSETS.md](ASSETS.md#sound-effects-always-come-from-assetssfx).
One sample per event, pitched with `rate` instead of duplicated.

Pictograms work the same way: pick one from the shared **`assets/lucide/`** pack,
encode it with `node tools/lab/embed-icon.mjs <name> --key icoThing`, paste it into
`ASSETS.images`, and draw it with `Icon.draw`. Icons are authored white — an
`<img>` has no `currentColor` to resolve — so `Icon` tints them through a
`source-in` fill and caches one canvas per key+size+colour. Never `drawImage`
the raw SVG. See [assets/lucide/README.md](../assets/lucide/README.md).

### `Music` — the background bed

A game gets looping music by embedding **one** clip under the reserved key
`music` and tuning `CONFIG.music`:

```js
CONFIG.music = { volume: 0.10, fade: 2.0 };   // discreet, 2 s fades
ASSETS.sounds.music = "data:audio/mpeg;base64,…";
```

A game played *on* the music adds the track's tempo to the same block and drives
its action with [`Beat`](#beat--the-musical-clock):

```js
CONFIG.music = { volume: 0.10, fade: 2.0,     // …plus the grid
                 bpm: 128, beatOffset: 0.43, loopBeats: 64 };
```

Nothing else to wire: `startGame()` calls `Music.start()`, which is a no-op
when the game ships no `music` clip.

Two things the module takes care of:

- **Volume.** The bed hangs off its own master gain at `CONFIG.music.volume`
  (default `0.12`). Keep it around `0.10` — it must never fight the sfx or the
  callouts. `endRound()` ducks it to 55 % so the end-screen cues cut through,
  and the next `startGame()` lifts it back.
- **A pleasant loop.** The track is *not* required to be a seamless loop. The
  same decoded buffer is re-scheduled every `duration - fade` seconds and each
  pass fades in and out over `fade`, so the tail of one pass crossfades into
  the head of the next: no click at the seam, and the first pass fades in
  instead of slamming on. Passes are queued a few seconds ahead against the
  WebAudio clock, so the seam stays sample-accurate even while the rAF loop is
  paused. With `bpm` + `loopBeats` set, the wrap is `loopBeats` beats instead of
  `duration - fade`, so the pulse crosses the seam without shifting — and the
  crossfade is whatever is left of the buffer past that point.

`Music.pause()` / `Music.resume()` are already wired to
`visibilitychange` and to MRAID's `viewableChange`: they ramp the bed down and
suspend the audio context, which freezes its clock so the loop resumes exactly
where it stopped.

Encode small — the bed plays under everything, so mono 64 kbps is plenty:

```bash
ffmpeg -i track.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3   # ~30 s ≈ 240 KB
node tools/lab/embed-asset.mjs music.mp3 --key music
```

### `Beat` — the musical clock

For a game whose action is written on the music: rings that land on the kick,
obstacles that arrive on the bar, a jump you time to the snare. Declare the
track's grid in `CONFIG.music` and the engine hands the game a clock in **beats**
that is locked to the audio actually playing:

| field        | what it is                                                |
| ------------ | --------------------------------------------------------- |
| `bpm`        | tempo of the track                                        |
| `beatOffset` | seconds from the start of the file to its first beat      |
| `loopBeats`  | beats of the file the loop keeps (a whole number of bars) |

```js
Beat.on()             // is a tempo configured
Beat.beats()          // musical time in beats since the track's beat 0
Beat.period()         // seconds per beat
Beat.seconds(beats)   // beats -> seconds (timing windows, durations)
Beat.next(div)        // next grid line; div slots per beat (1 = beat, 4 = 16th)
Beat.pulse(div)       // 1 on the grid line, falling to 0 before the next one
Beat.locked()         // riding the audio clock rather than its own dt clock
```

The pattern is: schedule on the grid, then interpolate. Give an entity the beat
it must arrive on and derive its position from `Beat.beats()` every frame —
never accumulate its own timer, or it drifts off the music within a few bars.

```js
// launch everything that must arrive one flight from now
while (nextSlot - FLIGHT <= Beat.beats()) { spawn(nextSlot); nextSlot += 1; }
// …and place it: p reaches 1 exactly on its beat
var p = clamp((Beat.beats() - e.born) / e.span, 0, 1);
```

Grade the player in beats too (`Math.abs(e.hit - Beat.beats())`), so a timing
window means the same thing at any tempo: `0.19` of a beat is 89 ms at 128 BPM.

Two details make it usable in an ad:

- **It never waits for the music.** The clock runs off `dt` from the first frame,
  so the game is on-beat even when the track never decodes — or when the creative
  is muted, which is the common case.
- **It corrects instead of snapping.** The phase error against the WebAudio clock
  is folded to the nearest beat and walked out at half a beat per second, so
  locking on (and coming back from a backgrounded tab) stays invisible and
  nothing in flight jumps.

Measuring a track: run a beat tracker, or find the first kick's attack on the
waveform (`beatOffset`) and count the bars the loop should keep. Check that
`loopBeats * 60 / bpm` is a shade **shorter** than the file — the remainder is
the crossfade. `games/chainring` is the reference implementation: 128 BPM,
`beatOffset` 0.43 s, 64 beats of a 30.77 s file.

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

`.demo-hand` is `assets/svg/finger.svg`, turned 180° so the index finger points
up and inlined in the motor stylesheet as a `data:image/svg+xml` background.
Every game shares it — never replace it with a hand of your own. Its fingertip
sits at the **top edge** of the box, so a variant that has to reach a target
moves the whole element (`transform: translate…`) rather than resizing it.

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
the build uses to tell your CSS from the motor's.

## Keeping the motor shared

```bash
node tools/build/build.mjs           # reassemble every game from packages/
node tools/build/build.mjs --check   # assert the artifacts match their sources
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
  (see Blight's cached bubbles) or fake glow with concentric circles
  (see Chainring's ball).
- **All timing in seconds** (`dt`), never frames.
- **Every CTA goes through `Ad.openStore()`.**
- One self-contained HTML file, no external requests, under 5 MB
  (`node tools/build/check-size.mjs`).

## Reference implementations

- [`games/chainring/`](../games/chainring/index.html) — timing tap, combo
  multiplier, chain-reaction payoff, `onTimeUp` sudden death, 6 stat rows.
- [`games/blight/`](../games/blight/index.html) — drag-to-aim
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
