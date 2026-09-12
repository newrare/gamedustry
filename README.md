# Newrare — the game factory

A prompt-friendly **motor** (shared shell) plus the tooling around it: one source
per game, several outlets.

| target       | what it is                                      | status                 |
| ------------ | ----------------------------------------------- | ---------------------- |
| **playable** | one self-contained HTML for ad networks (MRAID) | built from `packages/` |
| **web**      | the newrare site (and later itch.io)            | `--target=web`         |
| **android**  | a Capacitor build for Google Play               | planned                |

The plan of record for the deploy side of each target is
[docs/INDUSTRIALIZATION.md](docs/INDUSTRIALIZATION.md). Everything below
describes what exists now: the motor, the playable and the web build.

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
gamedustry/
├── index.html                ← gallery + motor overview (open this first)
├── README.md                 ← you are here
├── CLAUDE.md                 ← instructions for AI-assisted game creation
├── Makefile                  ← check / push / itch / site / serve — there is no CI
├── vercel.json               ← the deploy settings, in the repo and not a dashboard
├── site/                     ← the public newrare site (static, deployed by Vercel)
│   ├── index.html            ← studio page: playables, store apps, studio, legal
│   ├── privacy.html          ← the privacy policy, a store prerequisite
│   ├── style.css  script.js  ← no framework, no web font, FR/EN in one toggle
│   ├── analytics.js          ← Vercel Web Analytics, inert off the deployed site
│   ├── games.js              ← the playable catalogue the page renders
│   ├── app-ads.txt           ← authorized ad sellers; empty until AdMob ships
│   ├── image/                ← site art + store-app screenshots
│   └── newrare-website/      ← the previous site, kept for reference, not published
├── packages/                 ← THE MOTOR, stored once, shared by construction
│   ├── engine/
│   │   ├── engine.js         ← section 3: frame, input, loop, audio, RNG, Fx
│   │   └── bootstrap.js      ← section 7: the frame pipeline and wiring
│   ├── platform/
│   │   ├── mraid.js          ← section 4: MRAID, CTA, visibility, tracking
│   │   └── web.js            ← section 4 for the web target: no MRAID, no store
│   ├── shell/
│   │   ├── motor.css         ← the shared stylesheet
│   │   ├── shell.js          ← section 5: states, HUD, overlay, intro, end
│   │   └── script-open.js    ← the IIFE open and close
│   ├── webshell/             ← web only: the menu, the panels, the end screen
│   └── frame-web/            ← web only: the desktop dressing around the frame
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
├── prototype/                ← one raw HTML page per idea: no motor, no build
├── lab/                      ← standalone tools; a new one starts from _template
├── assets/                   ← source art & audio (not shipped; embed instead)
│   ├── audio/                ← one medium, two roles
│   │   ├── music/            ← one looping background bed per game
│   │   └── sfx/              ← the effect library every game picks its clips from
│   ├── image/                ← every picture, filed by who consumes it
│   │   ├── master/           ← the painted masters, 2 MB PNGs, shipped nowhere
│   │   ├── embed/            ← their WebP cut, embedded in every build as CONFIG.art
│   │   ├── object/           ← the cuts of each game's object sheets
│   │   ├── brand/            ← the studio mark the title screen signs itself with
│   │   ├── icon/             ← one app icon per game, embedded on its intro
│   │   │   ├── thumb/        ← 320 px cuts, the only assets the gallery loads
│   │   │   └── auto/         ← 320 px icons drawn in CSS by lab/icon-card.html
│   │   ├── screen/           ← 10 gameplay screenshots per game, the raw captures
│   │   ├── google/           ← cut to Play's specs: <lang>/ galleries + feature/
│   │   ├── itch/             ← the 630x500 cover, <lang>/ — itch reuses the gallery
│   │   └── gear/             ← grey cogs laid over a shot when composing a card
│   └── motor/                ← what the motor reads, shared by all thirteen
│       ├── font/             ← six OFL faces, embedded by the web target only
│       ├── lucide/           ← the pictogram pack Icon.draw tints
│       └── svg/              ← finger.svg, the demo hand every intro uses
├── tools/
│   ├── lib/parts.mjs         ← the single definition of the file's regions
│   ├── build/                ← assemble
│   │   ├── build.mjs         ← a game: --target=playable|web, --check
│   │   ├── build-site.mjs    ← site/ + the web builds into dist/site/
│   │   ├── gen-catalogues.mjs← the two catalogues, from the manifests
│   │   ├── extract.mjs       ← the one-shot that split the motor out of the games
│   │   └── check-size.mjs    ← verify files stay under the size budget
│   ├── update.mjs            ← THE command after any change: build, check, what's left
│   ├── publish/              ← ship it
│   │   ├── deploy-itch.mjs   ← butler push, target read from the manifest
│   │   └── store-meta.mjs    ← the itch page copy, generated from the manifest
│   ├── lab/                  ← author and inspect
│   │   ├── serve-site.mjs    ← the site, locally, rebuilt on save
│   │   ├── embed-asset.mjs   ← encode an image/sound into a data URI
│   │   ├── embed-icon.mjs    ← encode a lucide icon into ASSETS.images
│   │   ├── encode-art.mjs    ← assets/image/master/ masters → assets/image/embed/ (WebP)
│   │   ├── shoot-screens.mjs ← replay each game headless into assets/image/screen/
│   │   ├── shoot-icon.mjs    ← shoot lab/icon-card.html into assets/image/icon/auto/
│   │   ├── cut-objects.mjs   ← a sheet of objects → one transparent PNG each
│   │   │                        (assets/image/master/<slug>-object-*.png → assets/image/object/)
│   │   ├── shoot-cover.mjs   ← shoot lab/cover-card.html into assets/image/itch/cover/
│   │   │                        (--play → the 1024x500 Play graphic, assets/image/google/feature/)
│   │   ├── shoot-store.mjs   ← shoot lab/store-card.html into assets/image/<store>/
│   │   │                        (the listing images, FR/EN punchline on each)
│   │   ├── serve-store.mjs   ← the server lab/store-card.html composes over
│   │   │                        (make store — lists the assets, takes the saves)
│   │   ├── bench-pop.mjs     ← what a callout costs, on an emulated phone
│   │   ├── bench-raster.mjs  ← layer raster cost; and why it can't stand in
│   │   │                       for a phone (use ?perf=bench for that)
│   │   └── bench-audio.mjs   ← does the audio graph grow while a game plays
│   └── publish/              ← deploy (empty until phase 4)
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

**Everything routine is a make target.** GitHub Actions never ran on this repo
(see [docs/INDUSTRIALIZATION.md](docs/INDUSTRIALIZATION.md), *CI*), so the
`Makefile` at the root holds what it would have done. Vercel still redeploys the
site by itself on every push to `main`.

```bash
make check     # mdformat, then the three build gates — before a commit
make push      # check, refuse a dirty tree, git push, publish the 13 to itch
make itch      # re-publish to itch without pushing
make site      # assemble dist/site locally
make serve     # the dev loop, reload on save
make meta      # the itch page copy, one file per game
make android GAME=radiam   # the signed .aab for the Play Console
```

The individual commands below are what those targets run; reach for one when a
target tells you which step failed.

**Browse** — open the landing page:

```bash
open index.html                              # macOS
```

**Build the games** — `index.html` is a build output, so rebuild after touching
any source:

```bash
node tools/build/build.mjs                   # every game + the template
node tools/build/build.mjs --game=chainring
node tools/build/build.mjs --check           # assert artifacts match sources
node tools/build/gen-catalogues.mjs          # the two catalogues, from the manifests
```

**Build a game for the web** — same motor, same game, no ad glue: the intro
becomes a menu (PLAY / LEADERBOARD / OPTIONS / HELP, plus one entry per extra
mode a game declares in `web.modes`), the how-to-play demo moves into the Help
panel, and the install CTA is gone, so its band goes back to the play area:

```bash
node tools/build/build.mjs --target=web                  # → dist/web/
node tools/build/build.mjs --target=web --dest=itch      # → dist/itch/<slug>/
```

The two destinations differ in shape, not in content. `dist/web/` is the split
build the site ships: the motor is one hashed file every game links, and the
assets are files instead of base64, so opening a second game re-downloads
neither. `dist/itch/<slug>/` is one self-contained document again — an itch
project is uploaded alone, so it has no one to share a cache with.

**Publish to itch** — butler pushes the build; the page copy is generated and
pasted by hand, because itch has no public API for a page:

```bash
node tools/publish/deploy-itch.mjs --game=vipera --dry-run
node tools/publish/store-meta.mjs --game=vipera
```

**Build a game for Google Play** — the same web build inside a Capacitor
WebView (same menu, same options, same FR/EN switch), with
`packages/platform/capacitor.js` as section 4: the hardware back button and the
app going to the background are all it adds. One command does the three steps:

```bash
make android GAME=radiam                     # build → native project → .aab
node tools/build/build.mjs --target=android --game=radiam   # → dist/android/<slug>/
node tools/publish/gen-native.mjs radiam     # → native/radiam/, from the manifest
node tools/publish/store-meta.mjs --game=radiam --play      # the Play listing form
```

`native/<slug>/` is a build output like `dist/`: everything in it is derived
from `games/<slug>/manifest.json`, from `assets/image/icon/<slug>.png` and from the
android build, so it is gitignored and never edited by hand. A game reaches
this target by listing `android` in its `targets` and filling the `android`
block of its manifest (`appId`, `versionName`, `versionCode`).

**Signing — one keystore for the studio, one key alias per game.** One file to
back up instead of thirteen, and a key that leaks is replaced for its own app
alone. Where it is and what unlocks it is written once, outside this repo;
`gen-native.mjs` copies it into each generated project with that game's alias,
because `native/<slug>/` is deleted by `--clean`:

```bash
keytool -genkeypair -v -keystore ~/keys/newrare.keystore \
  -alias radiam -keyalg RSA -keysize 4096 -validity 10000

cat > ~/.newrare/signing.properties <<'EOF'
storeFile=/Users/<you>/keys/newrare.keystore
storePassword=<the password typed above>
EOF
chmod 700 ~/.newrare ~/keys && chmod 600 ~/.newrare/signing.properties ~/keys/newrare.keystore
```

Without that file the bundle still builds — unsigned, and Gradle says so. The
passwords are stored in clear, which is what a build secret is: readable by
anything running as you. FileVault covers a stolen machine, the `chmod` covers
the other accounts on it, and Play App Signing covers the rest — this is only
the *upload* key, so a leaked one is revoked and replaced. **Losing it is the
unrecoverable case**, hence:

```bash
# back the keystore up to a password vault. Attach the file itself if the
# vault takes attachments; base64 is only for a vault that takes text.
base64 -i ~/keys/newrare.keystore | pbcopy
pbcopy < /dev/null                           # then clear the clipboard

pbpaste | base64 -d > newrare.keystore       # restoring, later
shasum -a 256 ~/keys/newrare.keystore        # record it, to verify a restore
```

The keystore is useless without its passwords and its alias list, so store the
three together — and back it up again every time a game adds its alias.

**Prototype an idea** — one raw HTML page, no motor and no build; opening it is
the whole loop:

```bash
open prototype/<slug>.html
```

It becomes a game only once the idea is validated, and that conversion is a
separate step — see `CLAUDE.md`, *Three kinds of request*.

**Run a game directly**:

```bash
open games/chainring/index.html
# or serve the folder if your browser blocks file:// features:
python3 -m http.server 8000                  # then visit localhost:8000/games/…
```

**Dress the store listing** — a store page wants the game sold, not documented:
a raw capture is a dial on a dark background next to twelve other dials on dark
backgrounds. `lab/store-card.html` composes the listing images out of a real
frame of play, the game's own character, two or three of its own objects, its
logotype and its typeface, with **one punchline in the player's language** over
it — three formats, two languages, into `assets/image/google/<lang>/` and
`assets/image/itch/<lang>/`:

```bash
node tools/lab/shoot-screens.mjs radiam      # the raw captures, assets/image/screen/
node tools/lab/shoot-store.mjs radiam        # phone 1080×1920, desk 1920×1080, thumb 630×500
node tools/lab/shoot-store.mjs radiam --format desk --lang fr
node tools/lab/shoot-store.mjs --lines       # print the copy, shoot nothing
node tools/lab/shoot-cover.mjs radiam --play   # the Play feature graphic, assets/image/google/feature/
```

The punchlines live in `store.copy` in each `manifest.json` and nowhere else —
two to five words, one `<b>word</b>` in the game's accent, auto-fitted so the
same band holds `AIM & FIRE` and `LES ÉCAILLES DEVIENNENT ARMURE`. The number of
lines is the number of screenshots. See
[docs/ASSETS.md](docs/ASSETS.md#the-listing-images-come-from-assetsimagegoogle-and-assetsimageitch).

None of these tools invents artwork: a game missing a piece is skipped and
reported, never shot with a placeholder in the hole.

**Cut a sheet of objects** — an image model asked for a gear draws a wall of
them. `object-` in a master's name marks it as material to cut rather than a
role to ship, and the cutter takes it apart into one transparent PNG per
object, on the sheet's own alpha when it has one:

```bash
node tools/lab/cut-objects.mjs                      # every sheet of every game
node tools/lab/cut-objects.mjs radiam               # → assets/image/object/radiam-gear-NN.png
node tools/lab/cut-objects.mjs --list               # what it would cut, and where
open dist/object/radiam-gear.png                    # the contact sheet, numbered
node tools/lab/cut-objects.mjs radiam-object-gear --adopt 1,4   # → assets/image/master/
node tools/lab/encode-art.mjs radiam                # the adopted two become art
```

The knob that decides everything is `--solid` (default 110): the alpha at which
a pixel is the object rather than its glow. A halo that reaches the next object
welds the two — chainring's 31 rings came back as *one* object before it
existed — and the glow is not lost, it is re-grown out of each object as far as
`--pad`. The sixteen sheets give **383 objects**.

`assets/image/object/` is tracked and ships nothing: everything under `assets/image/embed/`
is embedded in every build of its game, so `--adopt` is where a cut earns its
place. Flags, numbers and the reasoning:
[docs/ASSETS.md](docs/ASSETS.md#a-sheet-of-objects-assetsimagemasterslug-object-namepng).

**Re-encode the painted artwork** — after adding or changing anything in
`assets/image/master/`. It writes the WebP the build embeds; see
[docs/ASSETS.md](docs/ASSETS.md#painted-artwork-comes-from-assetsimagemaster-re-encoded-into-assetsimageembed):

```bash
node tools/lab/encode-art.mjs                # every game, skipping what is fresh
```

**Build the public site** — runs the web build, then assembles `site/` and every
game into `dist/site/`, copying each game's icon, screenshots and character out
of `assets/`:

```bash
node tools/build/build-site.mjs
open dist/site/index.html                    # the built site, games included
```

**Work on the site** — the same build, served, rebuilt and reloaded on save:

```bash
node tools/lab/serve-site.mjs                # http://localhost:8090/
```

A game appears on the site as soon as it has `assets/image/icon/thumb/<slug>.png` and
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
1. Build and verify it — one command, which is the same one to run after any
   later change. It rebuilds the artifacts and the catalogues, runs the three
   checks, and prints what is left (the itch push, the screenshots, the page
   copy) from what changed in git:
   ```bash
   node tools/update.mjs
   ```
1. Shoot the store screenshots — a scripted pilot plays every game's **web**
   build in headless Chrome (a playable would carry its install CTA into every
   frame) and writes ten of them to `assets/image/screen/<slug>-NN.jpg`. Each shot is
   aimed at a progression of the round, from the first seconds to the end
   screen, so ten shots are ten different pictures:
   ```bash
   node tools/lab/shoot-screens.mjs            # all games; add a slug to redo one
   SHOOT_DEBUG=1 node tools/lab/shoot-screens.mjs vipera   # what each shot caught
   ```
1. Shoot the listing images — `lab/store-card.html` dresses those captures with
   the game's character, its own objects, its logotype and one punchline per
   language, in the three shapes a store asks for. `make store` opens it as an
   editor: three layers, every piece dragged onto the card, a magnetic grid, and
   a layout that is saved per game and duplicated to the others as the template
   for its format.
   ```bash
   make store                                  # compose one by hand, and save it
   node tools/lab/shoot-store.mjs              # 13 games, en + fr, all three formats
   node tools/lab/shoot-store.mjs radiam --format thumb   # just the itch cover
   ```
1. Draw the app icon — the artwork is a CSS recipe in `lab/icon-card.html`
   (shared silhouette and frame, one interior per game), shot over a
   transparent viewport into `assets/image/icon/auto/<slug>.png`:
   ```bash
   open lab/icon-card.html                 # the whole series on a checkerboard
   node tools/lab/shoot-icon.mjs               # all icons; add a slug to redo one
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
