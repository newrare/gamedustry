# CLAUDE.md

Guidance for AI assistants (and humans) creating playable ads in this repo.

## What this project is

A template for **playable ads**: single-file HTML mini-games shipped to ad
networks. Read [README.md](README.md) first for the layout. The non-negotiable
constraints below shape every decision.

## Hard constraints — never break these

1. **One self-contained HTML file per game.** All JS and CSS are inlined in the
   `index.html`. No external `<script src>`, `<link href>`, `fetch`, `import`,
   web fonts, or CDN links. The file must work with `file://` and inside a
   sandboxed ad iframe.
2. **Under 5 MB.** Target < 2 MB when possible. Verify with
   `node tools/check-size.mjs`. Prefer canvas/CSS drawing and WebAudio synth
   over embedded binaries. Embed assets only as base64 data URIs
   (see [docs/ASSETS.md](docs/ASSETS.md)).
3. **Vanilla only.** No frameworks, no TypeScript, no build step. Plain ES5-ish
   JS that runs in mobile WebViews (avoid bleeding-edge syntax).
4. **English** for all code, comments, identifiers, and docs. Prompts may be in
   any language.
5. **Keep the 7-section structure** (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).
   Don't reorganize the file; put new reusable helpers in the `ENGINE` section
   and game-specific logic in the `GAME` section.

## How to create a new game

1. Copy `template/game-template.html` to `games/<slug>/index.html`.
2. Edit **`CONFIG`** (section 1): title, `gameSeconds`, store URLs, `bg`, design
   resolution, and any game-specific tunables.
3. Rewrite the **`Game`** module (section 6). It must expose:
   - `reset()` — initialize a fresh round.
   - `onDown(p)` — handle a pointer press; `p` is `{x,y}` in design coordinates
     (games that only need "a tap happened" can ignore `p`).
   - `update(dt)` — advance the simulation; `dt` is seconds since last frame.
   - `render()` — draw one frame using `ctx` in design coordinates.
   - call the module's `end()` when the round is over → shows the end screen.
4. Update the intro/end copy in the markup and `CONFIG.title`.
5. Leave `ENGINE`, `AD GLUE`, `STATE MACHINE`, and `BOOTSTRAP` alone unless you
   have a specific reason. If a game needs new input types (drag, multi-touch),
   extend `Input` in the engine rather than hand-rolling in the game.
6. Run `node tools/check-size.mjs` and open the file in a browser to test.

The full recipe with prompt patterns is in [docs/CREATING_A_GAME.md](docs/CREATING_A_GAME.md).

## Available engine helpers (section 3)

Use these instead of reinventing them:

- `fitCanvas()` / `view` — responsive canvas at `view.w × view.h` design space.
- `Input.on(type, fn)` — unified mouse+touch, coords in design space
  (`type` is `"down" | "move" | "up"` in the template).
- `Loop.start(update, render)` / `Loop.stop()` — rAF loop with clamped `dt`.
- `Sound.unlock()` (call in a user gesture), `Sound.beep(freq, dur, type)`,
  `Sound.clip(name)` — zero-asset audio.
- `Store.get/set` — safe localStorage (may be blocked in some iframes).
- `Rand.range/int/pick` — random helpers.
- `preloadImages(done)` + `Images[key]` — decode embedded images before start.

## Ad-network glue (section 4) — do not remove

- `Ad.whenReady(cb)` gates the start on MRAID being ready (falls back instantly
  when running standalone).
- `Ad.openStore()` is the **only** way to send the user to the store. It tries
  MRAID `open()`, then common network globals, then `window.open`. Wire every
  CTA/install button to it.
- `Ad.track(event, data)` is a logging stub — replace with a network SDK call if
  a campaign needs analytics.

See [docs/AD_NETWORKS.md](docs/AD_NETWORKS.md) for MRAID and per-network detail.

## Conventions

- Design resolution is `720×1280` (portrait). Author game logic in those units;
  never read `window.innerWidth` inside game code — use `view.w/view.h`.
- All timing is in **seconds** (`dt`), not frames.
- Keep a clear state flow: `loading → intro → playing → end`. The install CTA
  must be reachable at all times during and after play.
- Favor readable, well-commented code over cleverness — these files are meant to
  be re-read and forked.

## Definition of done for a new game

- [ ] Opens and plays in a desktop browser and a mobile viewport.
- [ ] Core loop is fun within ~5–20 seconds (playables are short).
- [ ] Intro explains the mechanic in one line; end screen shows a result.
- [ ] Every CTA calls `Ad.openStore()`.
- [ ] `node tools/check-size.mjs` passes (< 5 MB).
- [ ] No external requests (check the network tab is empty).
- [ ] Code/comments in English; structure preserved.
