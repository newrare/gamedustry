# Newrare — the game factory

A prompt-friendly **motor** (shared shell) plus the tooling around it: one source
per game, several outlets.

| target       | what it is                                      | status                 |
| ------------ | ----------------------------------------------- | ---------------------- |
| **playable** | one self-contained HTML for ad networks (MRAID) | built from `packages/` |
| **web**      | the newrare site and itch.io                    | site in `site/`        |
| **proto**    | a stripped shell for validating a concept fast  | planned                |
| **android**  | a Capacitor build for Google Play               | planned                |

The plan of record for the other three targets — extraction, build, deploy — is
[docs/INDUSTRIALIZATION.md](docs/INDUSTRIALIZATION.md). Everything below
describes what exists now: the motor and the playable it produces.

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
├── site/                     ← the public newrare site (static, deployed by Vercel)
│   ├── index.html            ← studio page: playables, store apps, studio, legal
│   ├── style.css  script.js  ← no framework, no web font, FR/EN in one toggle
│   ├── games.js              ← the playable catalogue the page renders
│   ├── image/                ← site art + store-app screenshots
│   └── newrare-website/      ← the previous site, kept for reference, not published
├── packages/                 ← THE MOTOR, stored once, shared by construction
│   ├── engine/
│   │   ├── engine.js         ← section 3: frame, input, loop, audio, RNG, Fx
│   │   └── bootstrap.js      ← section 7: the frame pipeline and wiring
│   ├── platform/
│   │   └── mraid.js          ← section 4: MRAID, CTA, visibility, tracking
│   └── shell/
│       ├── motor.css         ← the shared stylesheet
│       ├── shell.js          ← section 5: states, HUD, overlay, intro, end
│       └── script-open.js    ← the IIFE open and close
├── template/                 ← the skeleton, itself a build unit
│   ├── page.html  skin.css  game.js
│   └── game-template.html    ← GENERATED, for reading the whole thing at once
├── games/<slug>/             ← page.html · skin.css · game.js · manifest.json
│   │                           index.html is GENERATED from those + packages/
│   ├── spinshock/index.html       ← Spinshock (tap on the impact, shockwave)
│   ├── chainring/index.html       ← Chainring (timing tap)
│   ├── blight/index.html          ← Blight (aim & shoot)
│   ├── bouncetry/index.html       ← Bouncetry (aim, ricochet, tap to swap)
│   ├── orbinity/index.html        ← Orbinity (gravity slingshot)
│   ├── triverse/index.html        ← Triverse (swipe between lanes)
│   ├── vipera/index.html          ← Vipera (tap to swerve, grow, dodge)
│   ├── arcider/index.html         ← Arcider (hold a side, race 20 pilots)
│   ├── echomaze/index.html        ← Echomaze (one look, then echolocate)
│   ├── gearball/index.html        ← Gearball (tap to drop, fill the loop)
│   ├── radiam/index.html          ← Radiam (turn a ring, line up three)
│   └── slipdeck/index.html        ← Slipdeck (swipe to sort, poker hands)
├── assets/                   ← source art & audio (not shipped; embed instead)
│   ├── icon/                 ← one app icon per game, embedded on its intro
│   │   ├── thumb/            ← 320 px cuts, the only assets the gallery loads
│   │   └── auto/             ← 320 px icons drawn in CSS by lab/icon-card.html
│   └── screen/               ← 10 gameplay screenshots per game, for store pages
├── tools/
│   ├── build.mjs             ← assemble a game: --target=playable, --check
│   ├── extract.mjs           ← the one-shot that split the motor out of the games
│   ├── lib/parts.mjs         ← the single definition of the file's regions
│   ├── build-site.mjs        ← assemble site/ + the playables into dist/site/
│   ├── embed-asset.mjs       ← encode an image/sound into a data URI
│   ├── check-size.mjs        ← verify files stay under the size budget
│   ├── check-motor.mjs       ← verify (or --fix) that games share the motor
│   ├── shoot-screens.mjs     ← replay each game headless and shoot assets/screen/
│   └── shoot-icon.mjs        ← shoot lab/icon-card.html into assets/icon/auto/
└── docs/
    ├── ENGINE.md             ← the motor: layout, APIs, contract  ← START HERE
    ├── ARCHITECTURE.md       ← how a game file is structured (the 7 sections)
    ├── CREATING_A_GAME.md    ← step-by-step recipe + prompt patterns
    ├── ASSETS.md             ← embedding images/sounds, staying under 5 MB
    ├── AD_NETWORKS.md        ← MRAID, the CTA, per-network notes & QA
    └── INDUSTRIALIZATION.md  ← the four targets, the build, the deploy, the phasing
```

The running task list is [TODO.md](TODO.md).

## Quick start

**Browse** — open the landing page:

```bash
open index.html                              # macOS
```

**Build the games** — `index.html` is a build output, so rebuild after touching
any source:

```bash
node tools/build.mjs                         # every game + the template
node tools/build.mjs --game=chainring
node tools/build.mjs --check                 # assert artifacts match sources
```

**Run a game directly**:

```bash
open games/chainring/index.html
# or serve the folder if your browser blocks file:// features:
python3 -m http.server 8000                  # then visit localhost:8000/games/…
```

**Build the public site** — assembles `site/` and every playable into
`dist/site/`, copying each game's icon and screenshots out of `assets/`:

```bash
node tools/build-site.mjs
open dist/site/index.html                    # the built site, games included
```

A game appears on the site as soon as it has `assets/icon/thumb/<slug>.png` and
an entry in `site/games.js`; the builder reports the ones it had to skip. This is
the Vercel build command — see
[docs/INDUSTRIALIZATION.md](docs/INDUSTRIALIZATION.md).

**Create a new game**:

1. Copy the template's sources:
   ```bash
   mkdir -p games/my-game
   cp template/page.html template/skin.css template/game.js games/my-game/
   ```
1. Follow [docs/CREATING_A_GAME.md](docs/CREATING_A_GAME.md) — you edit `CONFIG`,
   the theme tokens and the `Game` module, and leave the engine/shell/ad glue
   untouched.
1. Build it, then verify the budget and the round trip:
   ```bash
   node tools/build.mjs --game=my-game
   node tools/check-size.mjs
   node tools/build.mjs --check    # artifacts match their sources
   ```
1. Shoot the store screenshots — a scripted pilot plays every game in headless
   Chrome and writes ten frames per game to `assets/screen/<slug>-NN.jpg`:
   ```bash
   node tools/shoot-screens.mjs            # all games; add a slug to redo one
   ```
1. Draw the app icon — the artwork is a CSS recipe in `lab/icon-card.html`
   (shared silhouette and frame, one interior per game), shot over a
   transparent viewport into `assets/icon/auto/<slug>.png`:
   ```bash
   open lab/icon-card.html                 # the whole series on a checkerboard
   node tools/shoot-icon.mjs               # all icons; add a slug to redo one
   ```

## Game catalog

| Game                    | Mechanic                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Input          | Round                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------- |
| `spinshock` (Spinshock) | A top spins in a dish; tap on each impact to shockwave the rivals into the walls — they take 3 to 5 slams and keep coming back, the top's colour is the gauge                                                                                                                                                                                                                                                                                                        | Timing tap     | Endless / physics dish |
| `chainring` (Chainring) | Tap as closing rings hit the bouncing ball; chain a combo multiplier, then survive a spiked sudden-death ring                                                                                                                                                                                                                                                                                                                                                        | Timing tap     | 30 s + sudden death    |
| `blight` (Blight)       | Aim & shoot to match 3+ bubbles; rainbow supers chain-detonate, a spreading blight must be cut off                                                                                                                                                                                                                                                                                                                                                                   | Drag to aim    | 60 s / danger line     |
| `bouncetry` (Bouncetry) | A ball only breaks glass of its own colour; every wall it touches repaints it, and a tap swaps the whole wall — as often as you like while it flies                                                                                                                                                                                                                                                                                                                  | Drag, then tap | 6 balls / chain        |
| `orbinity` (Orbinity)   | A ribbon snake orbits a mini planet; tap to snap gravity and fling it along the tangent into the next well                                                                                                                                                                                                                                                                                                                                                           | Timing tap     | 30 s / combo chain     |
| `triverse` (Triverse)   | Three ropes of light run up the void; swipe to hop the arrow between them, banking gems and dodging mines                                                                                                                                                                                                                                                                                                                                                            | Swipe lanes    | Endless / 3 lives      |
| `vipera` (Vipera)       | A viper carves up an endless burrow; every tap flips the side it swerves toward, only a full-length body is plated, and an unarmoured bite strips it to a stump                                                                                                                                                                                                                                                                                                      | Tap to swerve  | Endless / 3 lives      |
| `arcider` (Arcider)     | Twenty pilots, one neon highway and three finishers; hold a side to lean, overtake through four gates that trim the field, and spend every fork on shield or on speed                                                                                                                                                                                                                                                                                                | Hold a side    | Race / 4 gates         |
| `echomaze` (Echomaze)   | An electric maze is lit for two seconds, then everything goes dark — walls, mouths and arena alike; a pulse fired into one of its six one-way mouths only ever reveals the wall it just struck, and a spent pulse becomes a one-way valve in the opening it died in                                                                                                                                                                                                  | Aim & fire     | 6 pulses / one exit    |
| `gearball` (Gearball)   | A closed ring of tangent cogs, their rims cut into slots that ride the machine at one rim speed; tap and a ball drops on the highest point of the track — a free slot seats it, a taken one destroys it — and the fall is long enough that the gap to aim at is two slots upstream. A ball that seats NEXT to another welds to it and the whole run pays, so the multiplier follows the chain, and the magazine of three sometimes loads a wild, a split or a charge | Tap to drop    | 45 s / 5 lives         |
| `slipdeck` (Slipdeck)   | A shoe deals one card at a time; flick it into the chute or into the hand, and five keeps are paid as poker on the spot — a pair or better cashes and the chain multiplier climbs, while three discards, a burning fuse and a hand drifting toward HIGH CARD squeeze from the other side                                                                                                                                                                             | Swipe to sort  | 30 s / poker hands     |
| `radiam` (Radiam)       | Three coaxial plates of coloured beads over twelve fixed rays; drag one and it turns alone, rays that would pay light up under the beads, and the dial cashes them only once it comes to rest — then the hub's meter buys a CHARGE that unzips a whole plate, or a wild NOVA that takes its colour off the dial, and each wave sets off the supers it reaches                                                                                                        | Drag a ring    | 40 s / charges & novas |

All of them are built on the same motor: sections 3, 4, 5 and 7 of their scripts
come from the same files in `packages/`, so they are identical by construction.
Look at `games/<slug>/game.js` to see exactly how little a game owns.

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
  be rewritten. It lives once in `packages/`: fix it there and every game — and
  the template — picks it up on the next build.
- **Self-contained**: no network calls, no external files. One HTML in, one out.
- **Standalone-runnable**: works inside a network iframe *and* when opened
  directly in a browser, so you can develop and QA fast.
- **Portrait-first, safe-area aware**: authored at `720×1280`; the HUD and CTA
  never sit under a notch, a camera cut-out or the home indicator.
- **Clear CTA**: an install button during play plus the end-screen CTA, both
  routed through the ad network's `open()` when present.
- **English code & docs**; prompts may be in any language.

See [CLAUDE.md](CLAUDE.md) for how to drive this repo with prompts.
