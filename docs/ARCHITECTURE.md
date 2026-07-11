# Architecture

Every game is one HTML file split into three top-level blocks — `<style>`,
markup, and `<script>` — and the script is divided into **7 numbered sections**.
This layout is intentional: it keeps reusable plumbing separate from
game-specific logic so a new game touches predictable places.

## File layout

```
<head>
  <meta viewport ...>        ← locked, no zoom/scroll (mandatory for playables)
  <style> … </style>         ← all CSS, inlined
</head>
<body>
  … markup …                 ← canvas + HUD + screens + CTA bar
  <script> (IIFE) </script>  ← all JS, inlined, in 7 sections
</body>
```

Everything lives in one file with no external references, so the creative is
exactly what the ad network receives.

## The 7 script sections

### 1. CONFIG
Plain object of tunables: `title`, `gameSeconds` (`0` = endless), `storeUrl`
(per-platform), design resolution, background color, and any game-specific
parameters (spawn rates, speeds, tolerances). **This is the first thing you edit
for a new game.**

### 2. ASSETS
Registry of embedded base64 data URIs: `{ images: {...}, sounds: {...} }`.
Empty by default — most games draw with canvas and synthesize audio. See
[ASSETS.md](ASSETS.md).

### 3. ENGINE
Reusable, game-agnostic helpers. Rarely edited; extend rather than replace:

| Helper | Responsibility |
|--------|----------------|
| `fitCanvas()` / `view` | Sizes the canvas at `view.w × view.h` design units and letterbox-scales it to the viewport, capping devicePixelRatio for performance. Game code always draws in design coordinates. |
| `Input` | Normalizes mouse + touch into `down/move/up` callbacks, converting screen pixels to design coordinates. |
| `Loop` | `requestAnimationFrame` loop calling `update(dt)` then `render()`; `dt` is clamped so a backgrounded tab doesn't cause a huge jump. |
| `Sound` | WebAudio tone synth (`beep`) needing no assets, plus `clip()` for embedded audio. `unlock()` must run inside a user gesture (iOS). |
| `Store` | `try/catch`-wrapped `localStorage` (sandboxed iframes may throw). |
| `Rand` | `range / int / pick`. |
| `preloadImages` / `Images` | Decodes embedded images before the game starts. |

### 4. AD NETWORK GLUE
The `Ad` module — the bridge to the ad container. See [AD_NETWORKS.md](AD_NETWORKS.md).

- `Ad.whenReady(cb)` — waits for MRAID `ready` (or runs immediately standalone).
- `Ad.openStore()` — the single store-redirect entry point; tries MRAID, then
  network globals, then `window.open`.
- `Ad.track(event, data)` — analytics hook (a `console.log` stub by default).

### 5. STATE MACHINE
`UI.show(name)` toggles the overlay screens and HUD/CTA visibility; `setState(s)`
changes the current state and reports it. States: `loading → intro → playing →
end`. Also small setters like `UI.setScore`, `UI.setEnd`.

### 6. GAME
The part a new prompt mostly rewrites. A self-contained module exposing:

```js
Game.reset()      // start a fresh round (reset score, spawn entities)
Game.onDown(p)    // pointer pressed at design-space point p = {x, y}
Game.update(dt)   // advance simulation; dt in seconds
Game.render()     // draw one frame with ctx, in design coordinates
// internal end()  → stops the loop, records best score, shows end screen
```

All game state is virtual (`view.w/view.h` units, seconds). Never read
`window.innerWidth` here — the engine handles scaling.

### 7. BOOTSTRAP
Wires it together: `fitCanvas()`, routes `Input` to the game while playing, binds
the start/install/CTA buttons, preloads images, then reveals the intro once
`Ad.whenReady` resolves. `startGame()` unlocks audio, resets, and starts the loop.

## Data flow

```
DOMContentLoaded → init()
    fitCanvas · bind inputs & buttons · preloadImages
    → Ad.whenReady → setState("intro")
[user taps PLAY] → startGame()
    Sound.unlock · Game.reset · setState("playing") · Loop.start
[each frame] Loop → Game.update(dt) → Game.render()
[round over] Game.end() → Loop.stop · setState("end")
[user taps CTA/INSTALL] → Ad.openStore()
```

## Coordinate system

- **Design space**: fixed `720 × 1280` (portrait). All positions/sizes are in
  these units.
- **Screen space**: actual device pixels. `fitCanvas` maps design → screen and
  `Input` maps screen → design, so the two never mix in game code.

This is why a game authored once looks correct on any phone, tablet, or the ad
network's preview frame.
