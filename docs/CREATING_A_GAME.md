# Creating a game

A step-by-step recipe for turning the template into a new playable, plus prompt
patterns for doing it with an AI assistant.

## The 6-step recipe

### 1. Copy the template

```bash
cp template/game-template.html games/<slug>/index.html
```

Use a short kebab-case `<slug>` (e.g. `merge-fruit`, `slice-rope`).

### 2. Set CONFIG (section 1)

```js
var CONFIG = {
  title: "MERGE FRUIT",
  gameSeconds: 30,            // 0 for endless (round ends on a fail condition)
  storeUrl: {
    ios:     "https://apps.apple.com/app/id...",
    android: "https://play.google.com/store/apps/details?id=...",
    fallback:"https://52-entertainment.com/our-games/"
  },
  designWidth: 720, designHeight: 1280,
  bg: "#101820",
  // …add your own tunables here (speeds, spawn rates, thresholds)
};
```

### 3. Rewrite the Game module (section 6)

Implement the five touchpoints. Skeleton:

```js
var Game = (function () {
  var score, /* your state */;

  function reset() {
    score = 0;
    /* create entities, reset timers */
    UI.setScore(0);
  }

  function onDown(p) {
    /* p.x, p.y are in design coordinates (0..view.w, 0..view.h) */
  }

  function update(dt) {
    /* advance simulation; dt is seconds */
    /* call end() when the round is over */
  }

  function render() {
    ctx.fillStyle = CONFIG.bg; ctx.fillRect(0, 0, view.w, view.h);
    /* draw entities using ctx in design coordinates */
  }

  function end() {
    Loop.stop();
    Store.set("best", Math.max(score, Store.get("best", 0)));
    UI.setEnd("Well done!", score);
    setState("end");
    Ad.track("game_end", { score: score });
  }

  return { reset: reset, onDown: onDown, update: update, render: render };
})();
```

### 4. Update the copy

- `CONFIG.title` and the intro `.title` / `.subtitle` in the markup.
- End-screen title/subtitle text.
- Button labels (`TAP TO PLAY`, `PLAY THE FULL GAME`, `INSTALL NOW`).

### 5. Add assets only if needed

Draw with canvas and synth audio first. If you truly need an image/sound,
encode it and paste into `ASSETS` — see [ASSETS.md](ASSETS.md). Keep the file
under 5 MB.

### 6. Test & verify

```bash
open games/<slug>/index.html          # play it
node tools/check-size.mjs             # size budget
```

Also open the browser dev tools **Network** tab and confirm it's empty (no
external requests), and test in a mobile-sized viewport.

## What to reuse vs. write

- **Reuse** everything in `ENGINE`, `AD GLUE`, `STATE MACHINE`, `BOOTSTRAP`.
  Need a new input gesture (drag, swipe, multi-touch)? Extend `Input` in the
  engine, don't hand-roll listeners in the game.
- **Write** `CONFIG` values and the `Game` module. That's usually it.

## Design tips for playables

- **Instant fun.** No tutorials. The intro is one line; the mechanic should be
  obvious in the first 2 seconds. A short win within ~5–20 seconds.
- **One mechanic.** Playables demo a single hook, not the whole game.
- **Forgiving.** Bias toward the player succeeding — a good first impression
  drives installs.
- **Always show the CTA.** The install button is on screen during and after
  play; every CTA calls `Ad.openStore()`.
- **Juicy feedback.** Pops, scale bounces, sounds, particles — cheap to add with
  canvas + `Sound.beep`, big impact on feel.
- **Portrait-first** at `720×1280`; make sure nothing important sits under the
  CTA bar or the top HUD.

## Prompt patterns (AI-assisted)

The template is designed so a single prompt can produce a new game. Effective
prompts name the mechanic, the fail/win condition, and the feel. Examples:

> Create a new game in `games/bubble-pop/`. Copy the template. Mechanic: bubbles
> float upward from the bottom; tap to pop them for points; if 3 bubbles reach
> the top the round ends. 20-second round. Keep the 7-section structure and reuse
> the engine. Draw everything on canvas, no assets.

> Add a game `games/ball-jump/`: a ball auto-bounces; tap to make it jump to the
> next platform; missing a platform ends the run (endless). Camera follows the
> ball upward like Stack Blocks. Reuse `Loop`, `Input`, `Sound`, `Ad`.

> Take `games/stack-blocks/` and reskin it: warm sunset palette, add a small
> particle burst on a perfect drop, and change the CTA copy to "BUILD YOURS".

Good prompts reference the constraints in [CLAUDE.md](../CLAUDE.md) implicitly by
saying "keep the structure" and "reuse the engine". The assistant should then
edit mainly `CONFIG` and `Game`.

## Worked examples in this repo

- [`games/tap-the-target/`](../games/tap-the-target/index.html) — spawn/expire
  entities, combo scoring, difficulty ramp, timed round.
- [`games/stack-blocks/`](../games/stack-blocks/index.html) — a moving object,
  tap-to-act, slicing/overhang logic, a scrolling camera, endless run ending on
  a miss.

Between them they cover most playable patterns: timers vs. endless, spawning vs.
single-actor, tap-anywhere vs. tap-a-point, and camera scrolling.
