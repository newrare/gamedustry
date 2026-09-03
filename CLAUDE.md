# CLAUDE.md

Guidance for AI assistants (and humans) creating playable ads in this repo.

## What this project is

A **game factory**. Open tasks live in [TODO.md](TODO.md) — read it before
proposing next steps, and update it when something lands. One source per game, several outlets: the **playable ad**
(single-file HTML for ad networks) is the only one built today; the **web** target
(the newrare site and itch.io) and an **android** target are
planned in [docs/INDUSTRIALIZATION.md](docs/INDUSTRIALIZATION.md), which is the
plan of record — read it before proposing anything about builds, targets or
deployment.

Read [README.md](README.md) for the layout and [docs/ENGINE.md](docs/ENGINE.md)
for the motor itself.

## Three kinds of request — settle this before writing anything

What the prompt asks for decides which rules apply. They do not mix.

| the prompt asks for                                | what you make                                | rules                                                                                                               |
| -------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **a prototype** — "test this idea", "is this fun?" | ONE raw HTML file, `prototype/<slug>.html`   | almost none — no motor, no template, no manifest, no build. [Prototypes](#prototypes--a-raw-page-outside-the-motor) |
| **a game**                                         | `games/<slug>/`, four sources, built         | everything in this file                                                                                             |
| **a lab tool**                                     | `lab/<name>.html`, from `lab/_template.html` | a standalone page. [The lab](#the-lab)                                                                              |

A prototype is **not** a small game. It is a page that answers one question
about a mechanic, it is allowed to be ugly, and turning it into a game is a
separate request that comes later — only once you have said the idea is worth
it.

**When the request is a game, it is built on the motor.** Do not design a new
page structure — copy the template's three sources into `games/<slug>/` and
write only `CONFIG`, the theme tokens and the `Game` module. The intro, HUD,
overlay, CTA, juice and end screen already exist. When the request is a
prototype, none of that applies.

**The hard constraints below govern `games/` and `template/` only** — not
`prototype/`, not `lab/`, not `site/`. `site/` is a normal static website: it may
use several files, load its own images and be as large as a website is. It must
not, however, pull in a framework, a CDN script or a web font — same discipline,
different reason (see [The site](#the-site)). `prototype/` and `lab/` are
development pages and answer only to the short rules in their own sections.

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
node tools/build/build.mjs --target=web        # → dist/web/, never committed
node tools/build/build.mjs --target=web --dest=itch   # → dist/itch/<slug>/
```

A game's `manifest.json` lists the `targets` it is meant for; a build for a
target it does not list is skipped and reported.

**There is no separate game server.** To iterate on a game, run the site loop —
`node tools/lab/serve-site.mjs` rebuilds in ~0.3 s and reloads on save (see
[The site](#the-site)). What you play is the web build the site ships.

`packages/webshell/` is the layer the **web** target adds, and section 4 is
the one region chosen by the target rather than shared: `packages/platform/web.js`
replaces `packages/platform/mraid.js`, so there is no MRAID and no store link,
and `CONFIG.layout.ctaHeight` is zeroed before the first layout — the CTA bar's
band goes back to `Layout`. On top of that the webshell turns the intro into a
menu (**PLAY / LEADERBOARD / OPTIONS / HELP**), moves the how-to-play demo into
the Help panel (the motor's own node, moved not copied, so a SKIN's dressing
follows it), and rewires the end screen to **PLAY AGAIN** / **MENU**. It reads
`window.__WEB__`; the motor knows nothing about it. Leaderboard and Options are
placeholders on purpose — the real ones are `packages/meta` (phase 5).

The web menu is **bilingual FR/EN**: the strings live in `packages/webshell/menu.js`
and the language is `?lang=` (the site passes its own choice to the iframe), then
`CONFIG.web.lang`, then the browser. A game overrides any string — its tagline
included — from a `web.copy` block in its `manifest.json`, which the builder
injects as `CONFIG.web`; there is no second place to write game copy.

`packages/frame-web/frame.css` is the third web-only layer: on a window wider
than the portrait frame it dresses the empty bands and draws a device bezel,
from the theme tokens the SKIN already defines. It is inert below `62/100`, so
the site's 9:16 modal and every phone are untouched. The margin it needs comes
from `CONFIG.layout.framePad`, which `packages/platform/web.js` defines as an
accessor — the only knob the motor grew for it, and it is 0 everywhere else.

**The web target has two destinations.** `--dest=site` (the default) writes the
split build: `engine.<hash>.js`, `boot.<hash>.js` and two stylesheets shared by
every game, then `<slug>/{index.html, config.<hash>.js, game.<hash>.js, assets/…}`. The four scripts are the same sections in the same order as the
single file — they simply run at global scope instead of inside one IIFE, which
is why a game needs no change to be split — and the assets are files, not base64
(~33% smaller, and cached). `--dest=itch` writes one self-contained
`dist/itch/<slug>/index.html` instead: an itch project is uploaded alone, so it
has nobody to share a cache with.

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

## Prototypes — a raw page, outside the motor

A prototype answers one question: *is this mechanic fun?* It is one
self-contained HTML file, written from scratch:

```bash
prototype/wheel-of-fortune.html      # open it in a browser — that is the loop
```

The rules, all of them:

- **One file, no build, no server.** Opening it over `file://` must be enough.
- **No motor.** Do not copy `template/`, do not read anything out of
  `packages/`, do not write a `manifest.json`, do not create anything under
  `games/`. A `<canvas>`, a `requestAnimationFrame` loop and a pointer handler
  are the whole scaffolding.
- **No ceremony.** No intro screen, no CTA, no end screen, no sfx, no icon, no
  FR/EN copy, no catalogue entry, no `TODO.md` line. Keep the numbers as plain
  `var`s at the top of the file so they are quick to change, and print debug
  text straight onto the canvas rather than building a panel.
- **It may be ugly.** Placeholder colours, no juice. What has to be right is the
  mechanic and how it feels under a finger.
- **Portrait if the idea is portrait**, but nothing here enforces 720x1280.
- **English in the file**, like everywhere else in the repo.

Hand back the path to open, and stop there. Tuning, balancing and benchmarking
are separate requests: a prototype that answers its question has done its job.

### When a prototype is validated

Converting it into a game is a **new request**, and it runs
[How to create a new game](#how-to-create-a-new-game) from the top — the four
sources, `CONFIG`, the SKIN, the one-sentence intro with its animated demo, the
sfx, the manifest, the catalogues. Only the gameplay travels: port the update /
render / input functions into the `Game` module and drop the prototype's own
loop, canvas sizing and scaffolding, which the motor already owns.

The prototype file stays in `prototype/` afterwards, as the record of where the
idea came from.

## The lab

`lab/` holds standalone HTML tools: a design catalogue or a bench for one piece
of the motor — `overlay-pop.html` is the `Pop` callout catalogue,
`icon-card.html` composes an icon. They never ship, and they are the one place
in the repo allowed to load a file out of `assets/` by relative path.

Start a new one from **`lab/_template.html`**: a single page, inline CSS and JS,
a control panel on one side and the thing being tried on the other. Same
anti-dependency rule as everywhere else — no framework, no CDN, no web font.

## Motor APIs — use these instead of reinventing them

Frame & input (section 3):

- `view` — `w`, `h`, `scale`, `dpr`, `insetTop`, `insetBottom` (design px).
  `view.dpr` is the design→device pixel ratio: size every cached canvas with it
  and never read `window.devicePixelRatio` in a game.
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
- `Store.get/set` — localStorage with an in-memory fallback, so a best score
  survives the session even where a sandboxed iframe makes localStorage throw
  (itch, a portal). `Rand.range/int/pick/chance`.
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
- **`?perf=1`** on a game's URL — the on-device readout: fps, worst frame, and
  how much of it the main thread owned, so a stutter is attributed to script or
  to paint/raster instead of guessed at. Off, and inert, without the flag.
  `&off=vig,decor,word,pops,fx` switches a suspect off on the device, which is
  how a spike is attributed to a layer rather than argued about, and
  **`?perf=bench` runs the whole variant sweep on the device itself** and prints
  the table — the only measurement whose ordering transfers, because a laptop's
  rasterizer and a phone's GPU disagree about what is expensive (see
  docs/ENGINE.md and tools/lab/bench-raster.mjs).
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

- **Six files own it**: `index.html`, `privacy.html`, `style.css`, `script.js`,
  `analytics.js` and `games.js` (the playable catalogue). `image/` holds the site
  art and the store-app screenshots, and `app-ads.txt` sits at the root because
  AdMob reads it there.
- **Every page loads the same `script.js`**, so each `init…()` returns quietly
  when its markup is absent. Add a page, not a second behaviour file.
- **Bilingual FR/EN through one attribute pair.** Any text node carrying
  `data-fr` and `data-en` is filled by `applyLang()`; the choice is remembered in
  `localStorage` and defaults to the browser language. Never hard-code a visible
  string in the markup, and never add a third mechanism.
- **Game copy lives in `games.js`**, one short tagline and three tags per
  language. Long developer descriptions stay in the root `index.html` gallery.
- **`node tools/build/build-site.mjs`** assembles `dist/site/`: it runs
  `build.mjs --target=web` first, copies `site/`, then each game's web build to
  `games/<slug>/` and the motor they share to `games/`, then each game's icon and
  screenshots out of `assets/` renumbered `01.jpg`, `02.jpg`… and finally
  rewrites `games.js` with what it actually found. The page therefore never links a missing image, and it
  never ships a playable's install CTA, which from the site would point at the
  site. `site/newrare-website/` is the previous site: excluded from the build,
  kept for reference.
- **`node tools/lab/serve-site.mjs`** is the loop for working on it: it runs that
  same build and serves `dist/site` with reload on save, so what you look at
  locally is what Vercel would publish. Never add a second way to assemble the
  site.
- **Every in-page anchor is scrolled by `initLegal()`** in `script.js`, never by
  the browser: a link whose hash is already in the URL makes the browser do
  nothing at all, and a click landing during a smooth scroll moves the hash
  without moving the page — both read as "the menu needs several clicks". The
  handler preventDefaults, opens a legal panel when the target is one, sets the
  hash with `replaceState` and calls `scrollIntoView` itself. Clearance under
  the sticky nav comes from `scroll-padding-top` on `html` and from nothing
  else: a `scroll-margin-top` on the sections would *add* to it, not replace it.
- **The legal texts are two `<details>` panels** in the `#legal` section,
  `#terms` and `#privacy`; a legal link must point at a panel id, never at a
  closed summary. `privacy.html` carries the same privacy text as a standing
  page because that URL is what goes into the store listings, so **the two
  copies are edited together**.
- **No dead CTA.** A button never points at nowhere — no `href="#"`. An app whose
  store page does not exist yet keeps the same CTA row as a shipped one, written
  as a real disabled `<button>`: same geometry, no colour, inert and announced as
  disabled. Two cards side by side then read as one row of buttons instead of a
  button facing a status pill, which is what the old `chip-soon` did.
- **A game in construction carries `draft: true`** in `site/games.js`: its copy
  stays written and ready, the build holds it back, and deleting the flag
  publishes it. A game with no icon is dropped and *reported* — that is a missing
  asset, not a decision.
- **Same anti-dependency discipline as the games**, for a different reason: no
  framework, no CDN, no web font. The site must stay a folder of files anyone can
  open, and it must stay fast on a phone.
- **Analytics is Vercel Web Analytics and nothing else.** `analytics.js` injects
  the collector from the deployment's own origin (`/_vercel/insights/script.js`),
  so there is still one host on the network tab, and it loads nothing at all off
  the deployed site — a local copy and a `localhost` run never touch the numbers.
  Report an event with `track(name, data)`; it is a no-op when the collector was
  never loaded, so no caller checks anything. The games stay clean: nothing is
  injected into them, and what they report (phase 4) they will `postMessage` to
  the page.
- **`vercel.json` owns the deploy**: build command, output directory, headers.
  Change it there, never in the dashboard.
- **The games are played in an iframe** inside a 9:16 modal (`#player`), which is
  how a portrait creative is shown on a desktop screen. The page's own language
  rides along as `?lang=`, so the game's menu is never in the other language.
  Closing it removes the `src` so the loop and the audio stop.

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
