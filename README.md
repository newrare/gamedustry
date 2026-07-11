# Playable Ads Template

A minimal, prompt-friendly template for building **playable ads** — small
interactive game demos that run inside ad networks (AppLovin, ironSource, Unity
Ads, Google Ads, Vungle, Mintegral, Facebook…).

Each game is a **single, self-contained `index.html`**:

- One HTML file, **under 5 MB** (many networks cap at 2–5 MB).
- **Vanilla JavaScript and vanilla CSS, inlined** — no build step, no bundler,
  no external requests. What you see is what the ad network gets.
- **Assets embedded** as base64 data URIs (see [docs/ASSETS.md](docs/ASSETS.md)).
- Consistent structure so a **new game can be created from a single prompt**.

## Repository layout

```
playableads/
├── index.html                ← game gallery landing page (open this first)
├── README.md                 ← you are here
├── CLAUDE.md                 ← instructions for AI-assisted game creation
├── template/
│   └── game-template.html    ← the canonical starting point (copy this)
├── games/                    ← 12 example games (see catalog below)
│   ├── tap-the-target/index.html
│   ├── stack-blocks/index.html
│   └── … (10 more)
├── tools/
│   ├── embed-asset.mjs       ← encode an image/sound into a data URI
│   └── check-size.mjs        ← verify files stay under the size budget
└── docs/
    ├── ARCHITECTURE.md       ← how a game file is structured (the 7 sections)
    ├── CREATING_A_GAME.md    ← step-by-step recipe + prompt patterns
    ├── ASSETS.md             ← embedding images/sounds, staying under 5 MB
    └── AD_NETWORKS.md        ← MRAID, the CTA, per-network notes & QA
```

## Quick start

**Browse all games** — open the gallery landing page:

```bash
open index.html                              # macOS — lists every game with a Play button
```

**Run a game directly** — just open the file in a browser:

```bash
open games/stack-blocks/index.html          # macOS
# or serve the folder if your browser blocks file:// features:
python3 -m http.server 8000                  # then visit localhost:8000/games/...
```

**Create a new game:**

1. Copy the template into a new folder:
   ```bash
   cp template/game-template.html games/my-game/index.html
   ```
2. Follow [docs/CREATING_A_GAME.md](docs/CREATING_A_GAME.md) — you mostly edit
   the `CONFIG` and `Game` sections and leave the engine/ad glue untouched.
3. Check the size budget:
   ```bash
   node tools/check-size.mjs
   ```

## Game catalog

Twelve self-contained example games, each demonstrating a different input style
and mechanic — a broad reference for what the template can produce. Open any
`games/<slug>/index.html` in a browser to play.

| Game | Mechanic | Input | Round |
|------|----------|-------|-------|
| `tap-the-target` | Tap circles before they vanish; chain combos | Tap a point | Timed |
| `stack-blocks` | Drop a sliding block to build a tower | Tap anywhere | Endless |
| `whack-a-mole` | Whack moles on a 3×3 grid, dodge bombs | Tap a point | Timed |
| `fruit-slice` | Swipe to slice flying fruit, avoid bombs | Blade swipe | Timed |
| `flappy-flyer` | Tap to flap through pipe gaps | Tap anywhere | Endless |
| `brick-breaker` | Bounce a ball to break bricks | Drag paddle | Lives |
| `catch-it` | Catch good items in a basket, dodge bombs | Drag | Timed |
| `snake` | Steer a growing snake to eat, avoid self/walls | Swipe direction | Endless |
| `bubble-shooter` | Aim & shoot to match 3+ same-color bubbles | Aim + tap | Timed/clear |
| `endless-runner` | Tap to jump (double-jump) over obstacles | Tap anywhere | Endless |
| `memory-match` | Flip cards to find matching pairs | Tap a point | Timed |
| `merge-tiles` | Swipe to slide & merge numbered tiles (2048) | Swipe direction | Target/stuck |
| `maze-runner` | Auto-run a generated maze; steer to grab coins & exit | Swipe direction | Timed |
| `dark-maze` | Navigate a maze by torchlight to the glowing exit | Swipe direction | Timed |
| `ring-combo` | Tap as closing rings hit the bouncing ball; chain a combo multiplier | Timing tap | Timed |

Between them they cover tap-a-point, tap-anywhere, drag/track, blade swipe,
swipe-direction, and aim inputs; timed, endless, lives-based, and
target/clear win conditions.

## How a game file is organized

Every file follows the same top-to-bottom sections so code is easy to read and
reusable helpers stay in the same place. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

| # | Section        | Edit per game?      | Purpose |
|---|----------------|---------------------|---------|
| 1 | `CONFIG`       | **Yes**             | Title, timing, store URLs, design resolution |
| 2 | `ASSETS`       | Sometimes           | Embedded base64 images/sounds |
| 3 | `ENGINE`       | Rarely              | Canvas fit, input, loop, audio, storage, RNG |
| 4 | `AD GLUE`      | Rarely              | MRAID readiness, CTA / store open, tracking |
| 5 | `STATE MACHINE`| Light               | loading → intro → playing → end screens |
| 6 | `GAME`         | **Yes (mostly)**    | `reset / onDown / update / render / end` |
| 7 | `BOOTSTRAP`    | Rarely              | Wires buttons + input, starts the flow |

## Design principles

- **Self-contained**: no network calls, no external files. One HTML in, one out.
- **Standalone-runnable**: works both inside a network iframe *and* when opened
  directly in a browser, so you can develop and QA fast.
- **Portrait-first, responsive**: authored at a virtual `720×1280` design
  resolution and letterbox-scaled to any screen (see `fitCanvas`).
- **Clear CTA**: an always-available install button plus an end-screen CTA, both
  routed through the ad network's `open()` when present.
- **English code & docs**; prompts may be in any language.

See [CLAUDE.md](CLAUDE.md) for how to drive this template with prompts.
