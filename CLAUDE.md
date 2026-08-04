# CLAUDE.md

Guidance for AI assistants (and humans) creating playable ads in this repo.

## What this project is

A **motor** (shared shell) for **playable ads**: single-file HTML mini-games
shipped to ad networks. Read [README.md](README.md) for the layout and
[docs/ENGINE.md](docs/ENGINE.md) for the motor itself.

**Default assumption: every new game concept is built on the motor.** When a
prompt describes a new game, do not design a new page structure — copy
`template/game-template.html` and write only `CONFIG`, the theme tokens and the
`Game` module. The intro, HUD, overlay, CTA, juice and end screen already exist.

## Hard constraints — never break these

1. **One self-contained HTML file per game.** All JS and CSS are inlined in the
   `index.html`. No external `<script src>`, `<link href>`, `fetch`, `import`,
   web fonts, or CDN links. The file must work with `file://` and inside a
   sandboxed ad iframe.
1. **Under 5 MB.** Target < 2 MB when possible. Verify with
   `node tools/check-size.mjs`. Prefer canvas/CSS drawing and WebAudio synth
   over embedded binaries. Embed assets only as base64 data URIs
   (see [docs/ASSETS.md](docs/ASSETS.md)).
1. **Vanilla only.** No frameworks, no TypeScript, no build step. Plain ES5-ish
   JS that runs in mobile WebViews (`var`, `function`, no arrow functions, no
   template literals).
1. **English** for all code, comments, identifiers, and docs. Prompts may be in
   any language.
1. **Keep the 7-section structure** (see
   [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)). Sections 3 (`ENGINE`),
   4 (`AD GLUE`), 5 (`SHELL`) and 7 (`BOOTSTRAP`) must stay **byte-identical
   across games**, and so must the stylesheet above the game's `SKIN —` block.
   Verify with `node tools/check-motor.mjs` (`--fix` pushes template changes
   into every game). Put new reusable helpers in the engine and carry them back
   into the template; put game logic in section 6.
1. **Portrait only**, authored in the `720×1280` design space. Never read
   `window.innerWidth` in game code, never hard-code the top/bottom of the play
   area — use `view` and `Layout`.

## How to create a new game

1. Copy `template/game-template.html` to `games/<slug>/index.html`.
1. Edit **`CONFIG`** (section 1): `title`, `tagline`, `gameSeconds`, store URLs,
   `bg`, `layout` bands, `intro.demo` (`tap | hold | drag | swipe | aim`),
   `copy`, then your own tunables.
1. Retheme by appending a single `SKIN — <GAME>` block at the end of the
   stylesheet: `:root` token overrides (`--bg`, `--accent`, `--cta-a/b`,
   `--danger`, `--gold`…) plus any game-specific rules. Never edit the motor CSS
   above it.
1. Rewrite the **`Game`** module (section 6):
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
   `Fx.burst/ring/text/shake/flash/freeze`,
   `Overlay.toast/banner/reward/vignette`, `Sound.beep/arp`.
1. Update `#intro-title` / `#intro-tagline` in the markup to match `CONFIG`, and
   add an entry to the `GAMES` array in the root `index.html`.
1. Run `node tools/check-size.mjs` and open the file in a browser to test.

The full recipe with prompt patterns is in
[docs/CREATING_A_GAME.md](docs/CREATING_A_GAME.md).

## Motor APIs — use these instead of reinventing them

Frame & input (section 3):

- `view` — `w`, `h`, `scale`, `insetTop`, `insetBottom` (design px).
- `Layout` — `top / bottom / left / right / w / h / cx / cy`: the band gameplay
  may use, already clear of the HUD, the CTA bar and the device insets.
- `Input.on("down"|"move"|"up", fn)` — unified mouse+touch in design space.
- `Loop.start/stop/pause/resume` — rAF loop with clamped `dt`.
- `Sound.unlock()` (in a user gesture), `Sound.beep(f,dur,type,vol)`,
  `Sound.arp(freqs,step,dur,type)`, `Sound.clip(name,vol,rate)`.
- `Store.get/set` — safe localStorage. `Rand.range/int/pick/chance`.
- `preloadImages(done)` + `Images[key]`. `rgba(hex,a)`, `clamp(v,lo,hi)`.
- `Fx.burst/ring/text/shake/flash/freeze` — the canvas juice layer; the frame
  pipeline updates and draws it for you.
- `Confetti.burst(n)`.

Shell (section 5):

- `HUD.setScore/setScoreNow/punch/setLeft/setRight` — the top band.
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
- [ ] Intro explains the mechanic in one line **and** shows it with an animated
  demo.
- [ ] HUD readable and nothing important under a notch or the CTA bar (test a
  viewport with a Dynamic Island).
- [ ] End screen shows score, stars and stat rows, then the install CTA and the
  replay link.
- [ ] Every CTA calls `Ad.openStore()`.
- [ ] `node tools/check-size.mjs` passes (< 5 MB).
- [ ] `node tools/check-motor.mjs` passes (no drift from the template).
- [ ] No external requests (check the network tab is empty).
- [ ] Code and comments in English.
