# Playable Ads — the Motor

A prompt-friendly **motor** (shared shell) for building **playable ads** — small
interactive game demos that run inside ad networks (AppLovin, ironSource, Unity
Ads, Google Ads, Vungle, Mintegral, Facebook…).

Every playable has the same skeleton, so the skeleton is written once:

- **Portrait design space** — 720 × 1280, letterbox-scaled; canvas *and* DOM
  overlays share the same coordinates.
- **Animated intro** — logo, title, one-line pitch and a CSS how-to-play demo
  (`tap` / `hold` / `drag` / `swipe` / `aim`).
- **HUD** — big eased score, timer, two free slots, kept clear of notches and
  camera cut-outs.
- **Game-view overlay** — toasts, combo banners, reward badges, dramatic edge
  glow.
- **Persistent CTA bar** — install button on screen for the whole round, lifted
  above the home indicator.
- **Fx layer** — particles, rings, floating text, screen shake, flash, hit-stop.
- **Cinematic end screen** — score count-up with confetti, star rating,
  cascading stat rows, a big install CTA and a small replay link.

**A new game only writes `CONFIG`, `ASSETS` and its `Game` module.**

Each creative ships as a **single, self-contained `index.html`**:

- One HTML file, **under 5 MB** (many networks cap at 2–5 MB).
- **Vanilla JavaScript and CSS, inlined** — no build step, no bundler, no
  external requests. What you see is what the ad network gets.
- **Assets embedded** as base64 data URIs (see [docs/ASSETS.md](docs/ASSETS.md)).

## Repository layout

```
playables/
├── index.html                ← gallery + motor overview (open this first)
├── README.md                 ← you are here
├── CLAUDE.md                 ← instructions for AI-assisted game creation
├── template/
│   └── game-template.html    ← THE MOTOR — copy this for every new game
├── games/
│   ├── chainring/index.html       ← Chainring (timing tap)
│   ├── blight/index.html          ← Blight (aim & shoot)
│   ├── bouncetry/index.html       ← Bouncetry (spin, aim once, ricochet)
│   ├── orbinity/index.html        ← Orbinity (gravity slingshot)
│   ├── triverse/index.html        ← Triverse (swipe between lanes)
│   └── vipera/index.html          ← Vipera (tap to swerve, grow, dodge)
├── assets/                   ← source art & audio (not shipped; embed instead)
│   └── icon/                 ← one app icon per game, embedded on its intro
│       └── thumb/            ← 320 px cuts, the only assets the gallery loads
├── tools/
│   ├── embed-asset.mjs       ← encode an image/sound into a data URI
│   ├── check-size.mjs        ← verify files stay under the size budget
│   └── check-motor.mjs       ← verify (or --fix) that games share the motor
└── docs/
    ├── ENGINE.md             ← the motor: layout, APIs, contract  ← START HERE
    ├── ARCHITECTURE.md       ← how a game file is structured (the 7 sections)
    ├── CREATING_A_GAME.md    ← step-by-step recipe + prompt patterns
    ├── ASSETS.md             ← embedding images/sounds, staying under 5 MB
    └── AD_NETWORKS.md        ← MRAID, the CTA, per-network notes & QA
```

## Quick start

**Browse** — open the landing page:

```bash
open index.html                              # macOS
```

**Run a game directly**:

```bash
open games/chainring/index.html
# or serve the folder if your browser blocks file:// features:
python3 -m http.server 8000                  # then visit localhost:8000/games/…
```

**Create a new game**:

1. Copy the motor:
   ```bash
   cp template/game-template.html games/my-game/index.html
   ```
1. Follow [docs/CREATING_A_GAME.md](docs/CREATING_A_GAME.md) — you edit `CONFIG`,
   the theme tokens and the `Game` module, and leave the engine/shell/ad glue
   untouched.
1. Verify the budget and that the shared motor is still shared:
   ```bash
   node tools/check-size.mjs
   node tools/check-motor.mjs      # --fix pushes template changes into games
   ```

## Game catalog

| Game                    | Mechanic                                                                                                            | Input         | Round               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------- |
| `chainring` (Chainring) | Tap as closing rings hit the bouncing ball; chain a combo multiplier, then survive a spiked sudden-death ring       | Timing tap    | 30 s + sudden death |
| `blight` (Blight)       | Aim & shoot to match 3+ bubbles; rainbow supers chain-detonate, a spreading blight must be cut off                  | Drag to aim   | 60 s / danger line  |
| `bouncetry` (Bouncetry) | Stop the wheel for 2 to 10 balls, then fire the whole volley on one aim; walls and ceiling bounce, the pit does not | Drag to aim   | One shot / chain    |
| `orbinity` (Orbinity)   | A ribbon snake orbits a mini planet; tap to snap gravity and fling it along the tangent into the next well          | Timing tap    | 30 s / combo chain  |
| `triverse` (Triverse)   | Three ropes of light run up the void; swipe to hop the arrow between them, banking gems and dodging mines           | Swipe lanes   | Endless / 3 lives   |
| `vipera` (Vipera)       | A viper carves up an endless burrow; every tap flips the side it swerves toward, and gems grow the body             | Tap to swerve | Endless / grow      |

All of them are built on the same motor: sections 3, 4, 5 and 7 of their scripts
are byte-identical. Diff them to see exactly how little a game owns.

## How a game file is organized

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

| #   | Section     | Edit per game? | Purpose                                                            |
| --- | ----------- | -------------- | ------------------------------------------------------------------ |
| 1   | `CONFIG`    | **Yes**        | Title, copy, clock, store URLs, layout bands, intro demo, tunables |
| 2   | `ASSETS`    | Sometimes      | Embedded base64 images/sounds                                      |
| 3   | `ENGINE`    | No             | Frame/Layout, input, loop, audio, storage, RNG, Fx, confetti       |
| 4   | `AD GLUE`   | No             | MRAID readiness, visibility, store open, tracking                  |
| 5   | `SHELL`     | No             | States, HUD, overlay, intro, end screen, round clock               |
| 6   | `GAME`      | **Yes**        | `reset / update / render` + optional hooks                         |
| 7   | `BOOTSTRAP` | No             | Frame pipeline and wiring                                          |

## Design principles

- **One motor, many games.** The shell is shared code, not a starting point to
  be rewritten. Fix it once, copy it everywhere.
- **Self-contained**: no network calls, no external files. One HTML in, one out.
- **Standalone-runnable**: works inside a network iframe *and* when opened
  directly in a browser, so you can develop and QA fast.
- **Portrait-first, safe-area aware**: authored at `720×1280`; the HUD and CTA
  never sit under a notch, a camera cut-out or the home indicator.
- **Clear CTA**: an install button during play plus the end-screen CTA, both
  routed through the ad network's `open()` when present.
- **English code & docs**; prompts may be in any language.

See [CLAUDE.md](CLAUDE.md) for how to drive this repo with prompts.
