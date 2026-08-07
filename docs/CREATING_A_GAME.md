# Creating a game

Turning the motor into a new playable, plus prompt patterns for doing it with an
AI assistant.

**Read [ENGINE.md](ENGINE.md) first.** A new concept never rebuilds the shell:
it plugs a `Game` module into the motor. The intro, HUD, overlay, CTA, juice and
end screen already exist.

## The recipe

### 1. Copy the template

```bash
cp template/game-template.html games/<slug>/index.html
```

Use a short kebab-case `<slug>` (e.g. `merge-fruit`, `slice-rope`).

### 2. Fill in CONFIG (section 1)

Identity, copy, clock, layout bands and the intro demo — then your own tunables.

```js
var CONFIG = {
  title:   "MERGE FRUIT",
  tagline: "<b class=\"w-drag\">Drag</b> two <b class=\"w-fruit\">fruits</b> together to merge",
  gameSeconds: 30,                       // 0 = endless (ends on a fail state)
  storeUrl: { ios:"…", android:"…", fallback:"https://52-entertainment.com/our-games/" },
  designWidth: 720, designHeight: 1280,
  bg: "#101820",
  layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 30 },
  intro: { logo: "logo", demo: "drag", caption: "" },
  hud: { score: true, timer: true },
  copy: { /* every user-facing string */ },
  // …your tunables: gravity, spawnEvery, mergeScore, palette…
};
```

Pick `intro.demo` from `tap | hold | drag | swipe | aim` so the intro *shows* the
mechanic instead of describing it.

**The intro screen obeys three rules, and every game in `games/` follows them:**

1. **One sentence**, never two, and no `caption`. The `tagline` names the
   gesture and what it does — the stage below it does the rest of the teaching.
   `.demo-caption` collapses on its own when `intro.caption` is `""`.
1. **The keywords are in colour.** Wrap the two or three words that carry the
   mechanic in `<b class="w-…">`. They glow in `--accent` by default; retint
   each class from the SKIN (`#intro-tagline .w-fruit { color:… }`).
1. **The stage illustrates the game, not a generic gesture.** Keep the shared
   finger from the motor (`assets/svg/finger.svg`, already inlined in
   `.demo-hand` — never draw your own hand) and re-dress the other nodes from
   the SKIN: the target becomes the character, the track becomes the world, the
   beam becomes the tap shockwave, the stage's `::before` / `::after` become
   whatever else the picture needs. `games/vipera` and `games/orbinity` are the
   reference.

### 3. Theme it (the SKIN block)

Leave the motor stylesheet alone and append **one** block at the very end,
starting with a `SKIN — ` comment header:

```css
  /* =========================================================================
     SKIN — MERGE FRUIT. Everything above is the shared motor stylesheet.
     ========================================================================= */
  :root { --bg:#101820; --accent:#ffd23f; --cta-a:#ffd23f; --cta-b:#f08c00; --cta-text:#241a00; }
  html, body { background:radial-gradient(900px 900px at 50% 20%, #1d2b1a, #0a1208); }
```

That marker is how `node tools/check-motor.mjs` separates your CSS from the
motor's.

### 4. Rewrite the Game module (section 6)

```js
var Game = (function () {
  var score, /* your state */;

  function reset() {
    score = 0;
    /* create entities inside Layout, reset timers */
    HUD.setScoreNow(0);
    HUD.setLeft(Store.get("bestScore", 0), "BEST");
  }

  function onDown(p) { /* p.x, p.y in design coordinates */ }

  function update(dt) {
    /* advance the simulation; dt is seconds */
    /* clamp entities to Layout.top / bottom / left / right */
  }

  function render() {
    ctx.fillStyle = CONFIG.bg; ctx.fillRect(0, 0, view.w, view.h);
    /* draw the world; Fx particles and text are drawn for you, on top */
  }

  function onTimeUp() {           // optional: the clock hit zero
    endRound({
      title: "TIME'S UP!",
      score: score,
      stars: score >= 900 ? 3 : score >= 450 ? 2 : 1,
      rows: [{ label:"BEST SCORE", value: Store.get("bestScore", 0), grade:"gold" }]
    });
  }

  return { reset:reset, onDown:onDown, update:update, render:render, onTimeUp:onTimeUp };
})();
```

Then add the juice with the shared layers — this is where a playable earns its
install rate:

```js
HUD.setScore(score); HUD.punch("#ffd43b");            // score reacts
Fx.burst(x, y, { color:"#4bf5ff", count:14, speed:380 });
Fx.shake(8, .22); Fx.flash("#ffffff", .3); Fx.freeze(.05);
Pop.show("score", { word:"+" + gained, at:{ x:x, y:y - 40 } });  // every gain
Pop.show("combo", { word:"COMBO x8", sub:"+160" });              // milestone
Pop.show("ultra", { word:"CHAIN x20", sub:"+400" });             // hero beat
Overlay.toast("NICE CHAIN!"); Overlay.vignette("#ffd43b", 1, 520);
Sound.clip("hit", .6, 1 + Math.min(combo, 14) * .045);   // one sample, pitched
Sound.clip("chain", .85);                                // the milestone
```

`Pop` is the comic callout layer (see [ENGINE.md](ENGINE.md) and the live
catalogue in [`lab/overlay-pop.html`](../lab/overlay-pop.html)). Use it for
anything that celebrates a player action — it sells harder than `Overlay.banner`
or `Fx.text`. Retint a style from the SKIN block, never inline.

### 5. Update the intro markup

`#intro-title` and `#intro-tagline` in the markup mirror `CONFIG.title` /
`CONFIG.tagline` (the engine overwrites them at boot — keep them in sync so the
file reads correctly), `<b class="w-…">` markers included.

### 6. Sound, and the assets you truly need

**Every sound effect comes from the shared `assets/sfx/` library** — pick a clip
per event, trim it, re-encode it mono 32 kHz / 64 kbps and embed it in
`ASSETS.sounds` under a short key. The full recipe (and the ffmpeg one-liners) is
in [ASSETS.md](ASSETS.md#sound-effects-always-come-from-assetssfx):

```bash
ffmpeg -i assets/sfx/<clip>.mp3 -t 0.4 -ac 1 -ar 32000 -b:a 64k gem.mp3
node tools/embed-asset.mjs gem.mp3 --key gem
```

Then play it with `Sound.clip(name, vol, rate)` and pitch one sample instead of
embedding variations. `Sound.beep` / `Sound.arp` are only the fallback for an
event that has no clip.

Graphics are the opposite: draw them on canvas. A logo for the intro is usually
the only embedded image. Keep the file under 5 MB.

For a background bed, embed the track under the reserved key `music` and set
`CONFIG.music = { volume: 0.10, fade: 2.0 }`. The engine loops it with a
crossfaded seam, keeps it far under the sfx and ducks it on the end screen —
nothing to wire in the game module.

### 7. Test & verify

```bash
open games/<slug>/index.html          # play it
node tools/check-size.mjs             # size budget
node tools/check-motor.mjs            # the shared sections are still shared
```

Also: dev tools **Network** tab empty (no external requests), test in a
mobile-sized viewport, and check the HUD is still readable on a device with a
notch (Safari → responsive design mode → iPhone with Dynamic Island).

## What to reuse vs. write

- **Reuse**, untouched: `ENGINE`, `AD GLUE`, `SHELL`, `BOOTSTRAP` (sections 3,
  4, 5, 7). They must stay byte-identical across games.
- **Write**: `CONFIG`, the theme tokens, the `Game` module, and the ASSETS you
  truly need.
- Need a new gesture, a new effect or a new HUD slot? Extend the engine module,
  then carry the change back into `template/game-template.html` and the other
  games — never hand-roll it inside `Game`.

## Design tips for playables

- **Instant fun.** No tutorial: the intro is one line plus the animated demo,
  and the mechanic must be obvious in the first 2 seconds.
- **One mechanic.** A playable demos a single hook, not the whole game.
- **Forgiving.** Bias toward the player succeeding — wide timing windows, no
  harsh penalties. A good first impression drives installs.
- **Juicy.** Every input needs an answer: a pop, a shake, a rising pitch, a
  number flying up. The `Fx`, `Pop` and `Overlay` layers exist for this.
- **Always show the CTA.** The install button is on screen during and after
  play; every CTA calls `Ad.openStore()`.
- **Respect the bands.** Gameplay lives inside `Layout`; nothing important under
  the HUD or the CTA bar.

## Prompt patterns (AI-assisted)

The motor is designed so one prompt produces a new game. Name the mechanic, the
fail/win condition and the feel; the assistant fills in `CONFIG` + `Game`.

> New game in `games/bubble-pop/`, built on the motor. Mechanic: bubbles float up
> from the bottom of `Layout`; tap to pop them for points; three bubbles escaping
> the top ends the round. 20-second clock, combo multiplier on consecutive pops.
> Intro demo: `tap`. Keep sections 3/4/5/7 untouched, draw everything on canvas.

> Add `games/ball-jump/`: a ball auto-bounces, tap to jump to the next platform,
> missing one ends the run (endless). Camera follows upward. Use `Fx` for the
> landing juice and `Pop.show("combo", …)` on every 10th platform. Stars from
> height.

> Reskin `games/chainring/` with a warm sunset palette: edit the `:root` tokens
> and the CTA copy only, nothing else.

Good prompts say "built on the motor" and "keep sections 3/4/5/7 untouched" —
that is the whole convention.

## Reference implementations

- [`games/chainring/`](../games/chainring/index.html) — timing tap, combo
  multiplier, chain-reaction payoff, sudden death via `onTimeUp`, 6 stat rows.
- [`games/triverse/`](../games/triverse/index.html) — endless swipe-between-lanes
  runner: procedural paths (including real self-crossing loops) evaluated as
  closed-form functions of a progress coordinate, keyboard arrows through
  `Input.swipe`, eight `assets/sfx` clips.
- [`games/blight/`](../games/blight/index.html) — drag-to-aim
  with a trajectory preview, hex grid, cached sprites, an embedded background,
  pressure rows and a danger line.
