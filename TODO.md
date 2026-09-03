# TODO — the newrare game factory

The single running list. [docs/INDUSTRIALIZATION.md](docs/INDUSTRIALIZATION.md)
explains *why* each item exists and in what order; this file tracks *what is
left*. One line per task, grouped by phase, each tagged with who does it:

- **MAIN** — a human action: a decision, an account, an upload, a piece of content.
- **AUTO** — a command or a CI job; no code to write.
- **CODE** — something to develop.

Keep this file honest: a task is **removed** once it is verifiably done — the
record of what shipped lives in git and in the industrialization doc, not here.
Add new tasks here rather than leaving them in a conversation.

______________________________________________________________________

## Phase 0 — decisions

Settled and closed; recorded in the `Decisions` table of the industrialization
doc.

## Phase 1 — extract the motor

Closed. The motor lives in `packages/`, the builder consumes the manifests, the
tools are split into `lab/` / `build/` / `publish/`, the two catalogues are
generated, and all 13 units rebuild byte-identically (`build.mjs --check`).

## Phase 2 — prototyping

Closed, and reversed: `--target=proto`, `packages/devtools/` and
`tools/lab/serve.mjs` were built, then **removed** — nobody used the tuning
panel, iteration happens on the web build, and the word "proto" made a request
for a quick prototype produce a whole game. A prototype is now one raw HTML page
in `prototype/`, outside the motor; see CLAUDE.md, *Three kinds of request*.

## Phase 3 — the site, deployed

**Closed.** The site is live on Vercel with Web Analytics on, serving the 11
published games from `dist/site`; `slipdeck` is held back by its `draft` flag.
Verified on a phone: layout and games both hold up. Two pieces of content are
still owed, and they belong to the phases that need them:

- [ ] MAIN — a support e-mail on the newrare domain (currently a personal Gmail);
  it is quoted in `site/privacy.html` and `site/index.html`, both to update
- [ ] MAIN — fill `site/app-ads.txt` with the AdMob publisher record, once the
  AdMob account exists (phase 8)

## Phase 4 — the web adapter (site + itch share one build)

The code is in: `--target=web` with its two destinations (`--dest=site` splits
the motor into shared hashed files and ships the assets as files, `--dest=itch`
keeps one self-contained document), `packages/frame-web/` (Delta 1),
`Store`'s memory fallback (Delta 2), the bilingual web menu with `CONFIG.web`
fed from the manifest, and the two publishing scripts. What is left needs an
account or a CI runner:

- [ ] MAIN — install `butler` (it is not on this machine) and `butler login`;
  then `BUTLER_API_KEY` as a CI secret
- [ ] MAIN — create the itch page for `vipera` by hand, from
  `node tools/publish/store-meta.mjs --game=vipera` (no public API exists); it is
  the pilot page whose form choices the other ten copy
- [ ] CODE — `store-meta.mjs` says nothing about the page's images, which itch
  asks for: add a section naming the cover (630×500), the screenshots to upload
  out of `assets/screen/<slug>-NN.jpg` and the icon
- [ ] CODE — nothing produces an itch cover: no `assets/cover/` exists and the
  icons are square. A lab page or a `tools/lab/shoot-cover.mjs` should compose
  630×500 from the icon and a screenshot
- [ ] AUTO — GitHub Actions on every PR: `build.mjs --check`,
  `gen-catalogues.mjs --check`, `check-size` — so a hand-edited artifact or a
  stale catalogue fails the build. There is no `.github/workflows/` yet
- [ ] AUTO — GitHub Actions: `butler push` to `html5-dev` on merge, `html5` on tag

## Phase 5 — the meta layer

The web menu already has the two entries: `packages/webshell/menu.js` opens a
LEADERBOARD panel showing the real local best score and an OPTIONS panel that
says "soon". Filling them is this phase, and it lands in `packages/meta` so the
android build gets the same screens.

- [ ] CODE — `packages/meta/`: start screen, options, i18n, progression
- [ ] CODE — OPTIONS, and first a mute the motor does not have: `Sound`/`Music`
  need a master switch before the panel can offer one
- [ ] CODE — a local leaderboard behind the interface a server will later fill,
  replacing the webshell's single best-score placeholder
- [ ] MAIN — decide whether progression is per game or account-wide

## Phase 6 — all games public, then measure

- [ ] AUTO — build and publish every game to the site and to itch
  (`deploy-itch.mjs --all`)
- [ ] MAIN — create the ten remaining itch pages, one per game, and a collection
  that holds them
- [ ] MAIN — read retention and replay rate, and decide which games go further
- [ ] MAIN — do not wire ads into the site before this measurement exists

## Phase 7 — portals

- [ ] CODE — a Newgrounds build, to shake down the adapter (open upload, no QA)
- [ ] CODE — `packages/platform/crazygames.js`: SDK, `gameplayStart/Stop`, no
  outbound links, no ads of our own
- [ ] MAIN — submit to CrazyGames QA and iterate on their report
- [ ] CODE — `packages/platform/poki.js`, only if Poki selects a game

## Phase 8 — android

- [ ] MAIN — buy the domain and attach it to Vercel (the first hard requirement)
- [ ] MAIN — clear Play identity verification, set the public developer address
- [ ] MAIN — recruit 12 testers with 12 distinct Google accounts
- [ ] CODE — `--target=android`
- [ ] CODE — `tools/publish/gen-native.mjs`: manifest → Capacitor project
- [ ] MAIN — generate the keystore, back it up outside CI, base64 into a secret
- [ ] MAIN — create the Play app: listing, screenshots, content rating, *Data
  safety*, privacy URL, support e-mail
- [ ] MAIN — upload the very first `.aab` through the console by hand
- [ ] AUTO — `fastlane android beta`, then track promotion, in CI on tag
- [ ] CODE — `packages/platform/capacitor.js`: `Platform.ads` → AdMob
- [ ] CODE — integrate a TCF-certified CMP (Google UMP) for EEA/UK traffic
- [ ] MAIN — AdMob account, tax and payment profile, ad units linked to the app
- [ ] MAIN — decide whether the audience is declared under 13 (Families policy)

______________________________________________________________________

## Content and assets

- [ ] MAIN — `assets/icon/slipdeck.png` + its `thumb/` cut; slipdeck is
  `draft: true` in `site/games.js` until then
- [ ] MAIN — finish `slipdeck` itself; it is the only game still in construction
- [ ] MAIN — per-game store URLs in `CONFIG.storeUrl`, once a game has a real
  listing (they all point at the site today, which is correct for now)
- [ ] MAIN — decide which languages the games themselves are localized into

## Known drift and small debts

- [ ] CODE — `lab/overlay-pop.html` carries its own fork of the pop CSS,
  predating the extraction: it still has a `filter` on `.pop-word` and it did
  not get the composited-slide fix. The catalogue therefore no longer previews
  what the motor draws. Point it at `packages/shell/motor.css` instead

- [ ] MAIN — the mobile stutter, on the device with `?perf=1`: **gearball reads
  clean** (55-60 fps, worst 20-30 ms, no paint/raster) and **vipera still spikes
  to ~90 ms on a bonus pickup, verdict paint/raster**. Bisect it with
  `?perf=1&off=vig`, then `off=fx`, then `off=pops` — that separates the
  vignette, the canvas juice and the callouts. Two fixes for that beat are
  pending deployment (the vignette repaints once per colour instead of once per
  call, the halftone-dot decor lost 48% of its raster area). What
  has been ruled out by measurement: the sfx path (the audio graph is reclaimed
  either way, render capacity 0.2%) and the scrolling decors (fixed in 912f62a,
  already in production, and the stutter outlived it). What is pending: the
  canvas backing store, which was drawing 342% of the displayed pixels on a
  DPR-2 phone and 152% on a DPR-3 one against a desktop's 0.92 Mpx (`view.dpr`,
  see docs/ENGINE.md), plus the HUD's per-frame `innerHTML` and the forced
  layout in `HUD.punch`. None of the three has been seen on a real phone yet

- [ ] CODE — the end screen animates two paint properties for as long as it is
  up: `starglow` animates `filter: drop-shadow` on every star and
  `.eo-row .shine` animates `left`, i.e. a layout pass per frame per stat row.
  `tools/lab/bench-pop.mjs --styles=end` measures them at 16 ms of raster over
  3 s, so this is a latent cost and not the mobile stall that was fixed — but
  both break the "transform and opacity only" rule and should follow the decors

- [ ] CODE — the games' `page.html` files carry per-game comment drift in the
  markup (edited comments, shortened blocks). Harmless, but it means the markup
  is not shared. Normalize it and reduce `page.html` to three tokens.

- [ ] CODE — `CONFIG.title` is all caps in most games while `manifest.json`
  carries the proper name; pick one and derive the other

- [ ] CODE — the root `index.html` gallery duplicates the site's catalogue

- [ ] MAIN — rename the repo: `playables` no longer describes what it holds
