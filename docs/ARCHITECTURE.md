# Architecture

Every game is one HTML file split into three top-level blocks — `<style>`,
markup, and `<script>` — and the script is divided into **7 numbered sections**.
This layout is intentional: it keeps the shared motor separate from
game-specific logic so a new game touches predictable places.

For what the motor actually gives you (APIs, layout, end screen, juice), read
[ENGINE.md](ENGINE.md). This page is about where things live in the file.

## File layout

```
<head>
  <meta viewport ...>        ← locked, no zoom/scroll, viewport-fit=cover
  <style> … </style>         ← theme tokens + all CSS, inlined
</head>
<body>
  #safe-probe                ← measures env(safe-area-inset-*) for the engine
  #backdrop                  ← full-viewport tint behind the end screen
  #stage > #frame            ← the 720×1280 design-space block (scaled as one)
      canvas#game            ← the world
      #overlay               ← toasts / banners / rewards / edge glow
      #hud                   ← score, timer, free slots
      #cta-bar               ← persistent install button
      .screen ×3             ← loading / intro / end
  <script> (IIFE) </script>  ← all JS, inlined, in 7 sections
</body>
```

Everything lives in one file with no external references, so the creative is
exactly what the ad network receives.

**The frame is the key idea:** `#frame` is a 720×1280 element scaled with a CSS
transform, so the canvas and every DOM overlay share one coordinate system.
Inside the frame, sizes are written in design pixels — no `vw`, `vh` or
`clamp()`.

## The 7 script sections

| #   | Section     | Edit per game? | Purpose                                                                |
| --- | ----------- | -------------- | ---------------------------------------------------------------------- |
| 1   | `CONFIG`    | **Yes**        | Title, copy, clock, store URLs, layout bands, intro demo, tunables     |
| 2   | `ASSETS`    | Sometimes      | Embedded base64 images/sounds                                          |
| 3   | `ENGINE`    | No             | Frame/Layout, Input, Loop, Sound, Store, Rand, images, Fx, Confetti    |
| 4   | `AD GLUE`   | No             | MRAID readiness, visibility, store open, tracking                      |
| 5   | `SHELL`     | No             | State machine, HUD, Overlay, intro build, EndScreen, Round, `endRound` |
| 6   | `GAME`      | **Yes**        | `reset / update / render` + optional pointer & lifecycle hooks         |
| 7   | `BOOTSTRAP` | No             | Frame pipeline, `startGame`, wiring                                    |

Sections 3, 4, 5 and 7 are **identical byte-for-byte between games**, and so is
the stylesheet above each game's `SKIN —` block. `node tools/check-motor.mjs`
verifies it and `--fix` restores it from the template, so a motor fix reaches
every creative.

### 1. CONFIG

Plain object of tunables: identity and copy, `gameSeconds` (`0` = endless),
`storeUrl` per platform, the design resolution, `layout` (the bands reserved for
the HUD and CTA bar), the intro demo, then your own game parameters. Full
reference in [ENGINE.md](ENGINE.md#config-reference).

### 2. ASSETS

Registry of embedded base64 data URIs: `{ images: {...}, sounds: {...} }`.
Usually just a logo. See [ASSETS.md](ASSETS.md).

### 3. ENGINE

Reusable, game-agnostic helpers:

| Helper                     | Responsibility                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fitCanvas()` / `view`     | Sizes the canvas at 720×1280 design units, scales the frame to the viewport, caps devicePixelRatio, and converts the safe-area insets into design pixels. |
| `Layout`                   | The rectangle gameplay may use: below the HUD, above the CTA bar, clear of notch and home indicator. Recomputed on resize.                                |
| `Input`                    | Normalizes mouse + touch into `down/move/up`, in design coordinates.                                                                                      |
| `Loop`                     | rAF loop with clamped `dt`, plus `pause`/`resume` (tab hidden, ad not viewable).                                                                          |
| `Sound`                    | WebAudio synth (`beep`, `arp`) needing no assets, plus `clip()` for embedded audio. `unlock()` must run inside a user gesture.                            |
| `Store`                    | `try/catch`-wrapped `localStorage` (sandboxed iframes may throw).                                                                                         |
| `Rand`                     | `range / int / pick / chance`.                                                                                                                            |
| `preloadImages` / `Images` | Decodes embedded images before the intro shows.                                                                                                           |
| `Fx`                       | Particles, rings, floating text, shake, flash, hit-stop — driven by the frame pipeline.                                                                   |
| `Confetti`                 | End-screen celebration on its own canvas.                                                                                                                 |
| `rgba` / `clamp`           | Small shared helpers.                                                                                                                                     |

### 4. AD NETWORK GLUE

The `Ad` module — the bridge to the ad container. See
[AD_NETWORKS.md](AD_NETWORKS.md).

- `Ad.whenReady(cb)` — waits for MRAID `ready` (or runs immediately standalone).
- `Ad.openStore()` — the single store-redirect entry point.
- `Ad.watchVisibility()` — pauses the loop while the creative is off-screen.
- `Ad.track(event, data)` — analytics hook (a `console.log` stub by default).

### 5. SHELL

Everything that makes a playable a playable, minus the game:

- `setState(name)` — `loading → intro → playing → end`, toggling HUD/CTA/screens.
- `HUD` — eased score, punch animation, timer, two free slots.
- `Overlay` — toasts, banners, reward badges, edge glow.
- `buildIntro()` — writes the logo, copy and picks the animated how-to-play demo.
- `EndScreen` — the staggered reveal (title → score count-up + confetti → stars
  → stat rows → install CTA → replay link).
- `Round` — the clock, the HUD timer and the `onTimeUp` hand-off.
- `endRound(result)` — the one way a round ends.

### 6. GAME

The part a new prompt rewrites. A self-contained module exposing:

```js
Game.reset()       // start a fresh round
Game.update(dt)    // advance the simulation; dt in seconds
Game.render()      // draw the world with ctx, in design coordinates
Game.onDown(p)     // optional pointer hooks (design coordinates)
Game.onTimeUp()    // optional — the clock hit zero
Game.onResize()    // optional — Layout changed
```

All game state is virtual (design units, seconds). Never read
`window.innerWidth` here, and never hard-code the top/bottom of the play area —
use `Layout`.

### 7. BOOTSTRAP

`frameUpdate`/`frameRender` (the pipeline that runs Round, the game, Fx and the
HUD in the right order), `startGame()`, input routing, button wiring, then
`preloadImages` → `Ad.whenReady` → intro.

## Data flow

```
DOMContentLoaded → init()
    buildIntro · fitCanvas · bind inputs & buttons · Ad.watchVisibility
    → preloadImages → Ad.whenReady → setState("intro")
[user taps PLAY] → startGame()
    Sound.unlock · Fx.reset · Game.reset · Round.reset · setState("playing") · Loop.start
[each frame] frameUpdate(dt) → Round.tick · Game.update · Fx.update · HUD.tick
             frameRender()   → Fx.begin · Game.render · Fx.render · Fx.end · Fx.post
[round over] endRound({…}) → Loop.stop · setState("end") · EndScreen.show
[user taps CTA/INSTALL] → Ad.openStore()
[user taps REPLAY]      → startGame()
```

## Coordinate system

- **Design space**: fixed `720 × 1280` (portrait). All positions, sizes and font
  sizes — canvas *and* DOM — are in these units.
- **Screen space**: actual device pixels. `fitCanvas` maps design → screen (one
  CSS transform plus the canvas transform) and `Input` maps screen → design, so
  the two never mix in game code.
- **Safe area**: `view.insetTop` / `view.insetBottom` report, in design pixels,
  how much of the frame is under a notch or home indicator; the HUD and CTA bar
  pad themselves accordingly and `Layout` shrinks to match.

This is why a game authored once looks correct on any phone, tablet, or the ad
network's preview frame.
