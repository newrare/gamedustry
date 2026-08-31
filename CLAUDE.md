# CLAUDE.md

Guidance for AI assistants (and humans) creating playable ads in this repo.

## What this project is

A **game factory**. Open tasks live in [TODO.md](TODO.md) — read it before
proposing next steps, and update it when something lands. One source per game, several outlets: the **playable ad**
(single-file HTML for ad networks) is the only one built today; the **web** target
(the newrare site and itch.io), a **proto** target and an **android** target are
planned in [docs/INDUSTRIALIZATION.md](docs/INDUSTRIALIZATION.md), which is the
plan of record — read it before proposing anything about builds, targets or
deployment.

Read [README.md](README.md) for the layout and [docs/ENGINE.md](docs/ENGINE.md)
for the motor itself.

**Default assumption: every new game concept is built on the motor.** When a
prompt describes a new game, do not design a new page structure — copy
`template/game-template.html` and write only `CONFIG`, the theme tokens and the
`Game` module. The intro, HUD, overlay, CTA, juice and end screen already exist.

**The hard constraints below govern `games/` and `template/` only.** `site/` is a
normal static website: it may use several files, load its own images and be as
large as a website is. It must not, however, pull in a framework, a CDN script or
a web font — same discipline, different reason (see [The site](#the-site)).

## Hard constraints — never break these

1. **One self-contained HTML file per game.** All JS and CSS are inlined in the
   `index.html`, which is now **generated** — see [The build](#the-build). No external `<script src>`, `<link href>`, `fetch`, `import`,
   web fonts, or CDN links. The file must work with `file://` and inside a
   sandboxed ad iframe.
1. **Under 5 MB.** Target < 2 MB when possible. Verify with
   `node tools/build/check-size.mjs`. Prefer canvas/CSS drawing and WebAudio synth
   over embedded binaries. Embed assets only as base64 data URIs
   (see [docs/ASSETS.md](docs/ASSETS.md)).
1. **Vanilla only.** No frameworks, no TypeScript, no build step. Plain ES5-ish
   JS that runs in mobile WebViews (`var`, `function`, no arrow functions, no
   template literals). The tooling around the games (`tools/`) is modern Node ESM
   and may do as it likes; the games themselves never gain a build step.
1. **English** for all code, comments, identifiers, and docs. Prompts may be in
   any language.
1. **Keep the 7-section structure** (see
   [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)). Sections 3 (`ENGINE`),
   4 (`AD GLUE`), 5 (`SHELL`) and 7 (`BOOTSTRAP`) plus the motor stylesheet now
   live in `packages/` and are shared by construction — a game cannot fork them.
   Put new reusable helpers there; put game logic in section 6 of
   `games/<slug>/game.js`. Verify with `node tools/build/build.mjs --check`.
1. **Portrait only**, authored in the `720×1280` design space. Never read
   `window.innerWidth` in game code, never hard-code the top/bottom of the play
   area — use `view` and `Layout`.

## How to create a new game

1. Copy the template's three sources into `games/<slug>/`:
   ```bash
   mkdir -p games/<slug>
   cp template/page.html template/skin.css template/game.js games/<slug>/
   ```
   Then write `games/<slug>/manifest.json` and build with
   `node tools/build/build.mjs --game=<slug>`. **Never create or edit
   `games/<slug>/index.html` by hand** — it is the build output.
1. Edit **`CONFIG`** (section 1 of `game.js`): `title`, `tagline`, `gameSeconds`, store URLs,
   `bg`, `layout` bands, `intro.demo` (`tap | hold | drag | swipe | aim`),
   `copy`, then your own tunables.
1. Write the intro to the house rules: **one sentence** in `tagline` (never two,
   and `intro.caption` stays `""`), its two or three key words wrapped in
   `<b class="w-…">` so they read in colour, and a demo stage that illustrates
   *this* game — keep the motor's shared finger (`assets/svg/finger.svg`, already
   inlined in `.demo-hand`; never draw another hand) and re-dress the target /
   track / beam and the stage's `::before` / `::after` from the SKIN.
   `games/vipera` and `games/orbinity` are the reference.
1. Retheme in `games/<slug>/skin.css`, which is the `SKIN — <GAME>` block and
   nothing else: `:root` token overrides (`--bg`, `--accent`, `--cta-a/b`,
   `--danger`, `--gold`…) plus any game-specific rules. The motor stylesheet is
   `packages/shell/motor.css`: a change there reaches every game, which is the
   point — never copy a motor rule into a skin to tweak it.
1. Rewrite the **`Game`** module (section 6 of `games/<slug>/game.js`):
   - `reset()` — initialize a fresh round (position entities inside `Layout`).
   - `update(dt)` — advance the simulation; `dt` is seconds.
   - `render()` — draw the world with `ctx` in design coordinates.
   - `onDown(p)` / `onMove(p)` / `onUp(p)` — optional pointer hooks, `p` is
     `{x,y}` in design coordinates.
   - `onTimeUp()` — optional; without it the clock ends the round.
   - `onResize()` — optional; rebuild cached canvases when `Layout` changes.
   - call `endRound({ title, variant, score, stars, rows })` when the run is
     over → plays the cinematic end screen.
1. Wire the feel through the shared layers: `HUD.setScore/punch/setLeft`,
   `Fx.burst/ring/text/shake/flash/freeze`, `Pop.show` for the score and combo
   callouts, `Overlay.toast/vignette`, `Sound.clip`.
1. Give every event a sound **picked from `assets/sfx/`**, trimmed and embedded
   in `ASSETS.sounds` (see [docs/ASSETS.md](docs/ASSETS.md)). Never invent a synth
   voice for a game: `Sound.beep/arp` is only the fallback for an event with no
   clip.
1. **Never create the app icon.** The artwork (`assets/icon/<slug>.png` and its
   `thumb/` cut, embedded as `ASSETS.images.logo` on the intro) is added later
   by the user. Leave `ASSETS.images` without a `logo` key and keep
   `CONFIG.intro.logo` at `null` — the intro simply hides `#app-icon`. Never
   generate, draw or embed a placeholder icon.
1. Update `#intro-title` / `#intro-tagline` in `page.html` to match `CONFIG`, then
   describe the game **once**, in `games/<slug>/manifest.json`: `title`, `order`,
   `draft`, `targets`, `theme`, `copy.fr` / `copy.en` (one tagline and three tags
   each) and `description` (the long English write-up). Run
   `node tools/build/gen-catalogues.mjs` to regenerate `site/games.js` and the
   `GAMES` block of the root `index.html` — never edit those two by hand. A game
   with no `assets/icon/thumb/<slug>.png` is skipped by the site build.
1. Run `node tools/build/build.mjs --game=<slug>` then `node tools/build/check-size.mjs`, and
   open `games/<slug>/index.html` in a browser to test.

The full recipe with prompt patterns is in
[docs/CREATING_A_GAME.md](docs/CREATING_A_GAME.md).

## The build

`games/<slug>/index.html` is a **build output**, not a source. The motor lives
once in `packages/`, and each game owns four files:

| file            | what it is                                                      |
| --------------- | --------------------------------------------------------------- |
| `page.html`     | head + markup, with `{{MOTOR_CSS}}` `{{SKIN_CSS}}` `{{SCRIPT}}` |
| `skin.css`      | the `SKIN — <GAME>` block, nothing else                         |
| `game.js`       | sections 1 (`CONFIG`), 2 (`ASSETS`) and 6 (`GAME`)              |
| `manifest.json` | title, tagline, targets, theme, itch and android config         |

```bash
node tools/build/build.mjs                     # every game + the template
node tools/build/build.mjs --game=vipera
node tools/build/build.mjs --check             # assert the artifacts match the sources
node tools/build/build.mjs --target=proto      # → dist/proto/<slug>/, never committed
```

A game's `manifest.json` lists the distribution `targets` it is meant for; a
build for a target it does not list is skipped and reported. `proto` is a
development target and is always available.

`packages/devtools/` is added by the proto target only — see
[Prototyping](#prototyping--start-every-concept-here). The playable build never
sees it, and the motor knows nothing about it: the proto build injects a
`window.__PROTO__` handle into the bootstrap and the devtools read that.

`--check` rebuilds in memory and compares byte for byte. A DIFF means someone
edited an `index.html` directly, or a source changed without a rebuild; it is the
CI gate. The template is a build unit too, so `template/game-template.html` never
holds a second copy of the motor.

The builder splits `game.js` at the section 6 banner and injects the motor
between the two halves, so **the banner comment lines are structural** — do not
reword `6. GAME`, and do not reorder the sections.

`node tools/build/extract.mjs` is the one-shot that created this layout from the old
single-file games. It only needs re-running if a game's `index.html` becomes the
source of truth again, which should not happen.

## Prototyping — start every concept here

A new concept is a `proto` before it is a game. Same engine, same `Game`
contract, none of the ceremony:

```bash
node tools/lab/serve.mjs my-game        # http://localhost:8080/my-game/
```

The round starts by itself — no intro to click, no CTA, no end screen (it
restarts instead). Saving any file under `packages/` or `games/<slug>/` rebuilds
and reloads the page.

| key     | what it does                            |
| ------- | --------------------------------------- |
| `R`     | restart the round                       |
| `SPACE` | pause; press again to advance one frame |
| `T`     | a tap at the centre of `Layout`         |
| `[` `]` | slow down / speed up                    |
| `` ` `` | fold the panel                          |

The URL is the control surface:

| query               | effect                                           |
| ------------------- | ------------------------------------------------ |
| `?seed=42`          | seeds `Math.random`, so the run is reproducible  |
| `?speed=2`          | time scale                                       |
| `?loop=0`           | keep the end screen instead of restarting        |
| `?dev=0`            | hide the panel, for a clean look at the game     |
| `?play.gapWide=200` | overrides any number in `CONFIG`, by dotted path |

The panel lists **every number in `CONFIG`** as a slider — that is what the
prototype is for. Values are written back live; anything read at `reset()` needs
an `R` to take effect.

**Two opt-in debug hooks.** A `Game` module may return either; nothing else in
the motor calls them, so a playable build pays nothing for them.

| hook            | what the proto does with it                                                              |
| --------------- | ---------------------------------------------------------------------------------------- |
| `debugShapes()` | draws `{x,y,r}` circles and `{x,y,w,h}` rects in design coords, and counts them          |
| `debugCounts()` | prints `{label: number}` in the panel header — how many things the game thinks are alive |

An entity count cannot be generic: only the game knows what an entity is. When
you are tuning a mechanic, **add a counter to the event you believe is
happening** before touching the numbers that shape it — that is what settles a
question in one run instead of a dozen.

### Promoting a proto to a game

The point of `proto` being a build target and not a scratch folder: **promotion
adds, it never rewrites.** A validated prototype already implements
`reset / update / render / onDown`, so becoming a game is:

1. write the intro — one sentence in `CONFIG.tagline`, its key words in
   `<b class="w-…">`, and a demo stage that acts out *this* mechanic;
1. fill `games/<slug>/skin.css` with the theme tokens;
1. give every event a clip from `assets/sfx/`, embedded in `ASSETS.sounds`;
1. add the icon artwork (the user's job, never generated);
1. extend `targets` in `manifest.json` and write the FR/EN `copy`;
1. `node tools/build/build.mjs --game=<slug>` and
   `node tools/build/gen-catalogues.mjs`.

Gameplay code does not move. If it has to, the prototype was not finished.

## Motor APIs — use these instead of reinventing them

Frame & input (section 3):

- `view` — `w`, `h`, `scale`, `insetTop`, `insetBottom` (design px).
- `Layout` — `top / bottom / left / right / w / h / cx / cy`: the band gameplay
  may use, already clear of the HUD, the CTA bar and the device insets.
- `Input.on("down"|"move"|"up", fn)` — unified mouse+touch in design space.
- `Input.swipe(dir, dist)` / `Input.at(type, x, y)` — synthesize a gesture. This
  is what the desktop keyboard rides on: SPACE starts, replays and — for
  `tap` / `hold` games — taps at `Layout.cx/cy`; **← / → (or A / D) fire a whole
  left/right flick for `swipe` games**, so a swipe mechanic needs no keyboard
  code of its own. Opt out with `CONFIG.keyboard = false`.
- `Loop.start/stop/pause/resume` — rAF loop with clamped `dt`.
- `Sound.unlock()` (in a user gesture), `Sound.clip(name,vol,rate)` — the way a
  game plays sound: one clip from `assets/sfx/` per event, pitched with `rate`
  rather than duplicated. `Sound.cue(name,vol,rate,freq,dur,type)` plays the clip
  when the game ships one under `name` and a synthesized beep otherwise;
  `Sound.beep(f,dur,type,vol)` / `Sound.arp(freqs,step,dur,type)` are that
  fallback.
- `Music.start/stop/duck/unduck` — the looping background bed. A game only
  embeds `ASSETS.sounds.music` and sets `CONFIG.music = { volume, fade }`; the
  shell starts it, ducks it on the end screen and pauses it off-screen, and the
  loop seam is crossfaded so the track need not be seamless.
- `Beat.beats/next/pulse/period/seconds` — the musical clock, for a game played
  on the beat. Add `bpm`, `beatOffset` and `loopBeats` to `CONFIG.music`, then
  schedule on the grid and interpolate toward it (never accumulate your own
  timer, it drifts). It runs off `dt` when the track is missing or muted and
  phase-corrects onto the audio clock without snapping. Reference:
  `games/chainring`.
- `Store.get/set` — safe localStorage. `Rand.range/int/pick/chance`.
- `preloadImages(done)` + `Images[key]`. `rgba(hex,a)`, `clamp(v,lo,hi)`.
- `Icon.draw(ctx,key,cx,cy,size,colour)` / `Icon.get(...)` — a pictogram from
  the shared `assets/lucide/` pack, encoded with `node tools/lab/embed-icon.mjs <name> --key icoThing` into `ASSETS.images` and tinted here. Icons are stored
  white, so never `drawImage` the raw SVG.
- `Fx.burst/ring/text/shake/flash/freeze` — the canvas juice layer; the frame
  pipeline updates and draws it for you.
- `Confetti.burst(n)`.

Shell (section 5):

- `HUD.setScore/setScoreNow/punch/setLeft/setRight` — the top band.
- `Pop.show(style, {word, sub, at, rot, cls, hold})` — the comic / manga callout
  layer. **Use it for score gains, combos and every beat that celebrates a
  player action**, in preference to `Overlay.banner/toast` and `Fx.text`.
  Styles: `score alert streak bonus ribbon combo perfect manifest danger record ultra vert`. Catalogue and live preview: `lab/overlay-pop.html`.
- `Overlay.toast/banner/reward/vignette/clear` — screen-space notifications,
  combo callouts, rewards, dramatic glow.
- `Round.left()/elapsed()` — the clock.
- `endRound(result)` — the single way a round ends.

## Ad-network glue (section 4) — do not remove

- `Ad.whenReady(cb)` gates the start on MRAID being ready (falls back instantly
  when running standalone).
- `Ad.openStore()` is the **only** way to send the user to the store. Wire every
  CTA/install button to it.
- `Ad.watchVisibility()` pauses the loop while the creative is off-screen.
- `Ad.track(event, data)` is a logging stub — replace with a network SDK call if
  a campaign needs analytics.

See [docs/AD_NETWORKS.md](docs/AD_NETWORKS.md) for MRAID and per-network detail.

## The site

`site/` is the public newrare site — a studio page listing the playables, the
store apps, the studio and the legal terms. Static HTML, CSS and JS, no build of
its own, deployed by Vercel from this repo.

- **Four files own it**: `index.html`, `style.css`, `script.js` and `games.js`
  (the playable catalogue). `image/` holds the site art and the store-app
  screenshots.
- **Bilingual FR/EN through one attribute pair.** Any text node carrying
  `data-fr` and `data-en` is filled by `applyLang()`; the choice is remembered in
  `localStorage` and defaults to the browser language. Never hard-code a visible
  string in the markup, and never add a third mechanism.
- **Game copy lives in `games.js`**, one short tagline and three tags per
  language. Long developer descriptions stay in the root `index.html` gallery.
- **`node tools/build/build-site.mjs`** assembles `dist/site/`: it copies `site/`, then
  each playable's self-contained `index.html`, then each game's icon and
  screenshots out of `assets/` renumbered `01.jpg`, `02.jpg`… and finally rewrites
  `games.js` with what it actually found. The page therefore never links a
  missing image. `site/newrare-website/` is the previous site: excluded from the
  build, kept for reference.
- **No dead CTA.** A button ships only when its destination exists. A game or app
  without a link gets a state chip (`chip-soon`), not a `href="#"`.
- **A game in construction carries `draft: true`** in `site/games.js`: its copy
  stays written and ready, the build holds it back, and deleting the flag
  publishes it. A game with no icon is dropped and *reported* — that is a missing
  asset, not a decision.
- **Same anti-dependency discipline as the games**, for a different reason: no
  framework, no CDN, no web font. The site must stay a folder of files anyone can
  open, and it must stay fast on a phone.
- **The games are played in an iframe** inside a 9:16 modal (`#player`), which is
  how a portrait creative is shown on a desktop screen. Closing it removes the
  `src` so the loop and the audio stop.

## Conventions

- Design resolution is `720×1280` (portrait). **Both canvas and DOM** are
  authored in these units — no `vw`, `vh` or `clamp()` inside `#frame`.
- All timing is in **seconds** (`dt`), not frames.
- State flow: `loading → intro → playing → end`, with a replay link back to
  `playing`. The install CTA must be reachable at all times.
- No `shadowBlur` in per-frame canvas drawing: pre-render sprites once, or fake
  glow with concentric circles.
- Favor readable, well-commented code over cleverness — these files are meant to
  be re-read and forked.

## Definition of done for a new game

- [ ] Opens and plays in a desktop browser and a mobile viewport.
- [ ] Core loop is fun within ~5–20 seconds (playables are short).
- [ ] Intro explains the mechanic in **one sentence** with its key words in
  colour, **and** shows it with an animated demo of the game itself, acted out
  by the shared finger.
- [ ] HUD readable and nothing important under a notch or the CTA bar (test a
  viewport with a Dynamic Island).
- [ ] End screen shows score, stars and stat rows, then the install CTA and the
  replay link.
- [ ] Every CTA calls `Ad.openStore()`.
- [ ] `node tools/build/check-size.mjs` passes (< 5 MB).
- [ ] `node tools/build/build.mjs --check` passes (the artifact matches its sources).
- [ ] `node tools/build/build-site.mjs` lists the game (not "skipped") and its card
  reads correctly in `dist/site/index.html`, in both FR and EN.
- [ ] No external requests (check the network tab is empty).
- [ ] Code and comments in English.
