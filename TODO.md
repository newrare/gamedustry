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

- [ ] MAIN — `butler login` (butler v15.31 is installed at
  `~/.local/lib/butler`, symlinked into `~/.local/bin`), then the same key as
  `BUTLER_API_KEY` in the repo's CI secrets
- [ ] MAIN — create the itch page for `vipera` by hand, from
  `node tools/publish/store-meta.mjs --game=vipera` (no public API exists); it is
  the pilot page whose form choices the other ten copy
- [ ] AUTO — GitHub Actions: `butler push` to `html5-dev` on merge, `html5` on
  tag. Waits on the itch pages existing — butler cannot push to a project that
  has never been created

## Phase 5 — the meta layer

The web menu carries both entries for real: `packages/webshell/menu.js` opens a
LEADERBOARD panel showing the local best score, and an OPTIONS panel wired to
the motor's own switches (`Sound.setMuted`, `Music.setMuted`, `Pop.setEnabled`),
the FR/EN language and a best-score wipe, all persisted through `Store`. What is
left is moving that behind an interface `packages/meta` owns, so the android
build gets the same screens instead of a second copy.

- [ ] CODE — `packages/meta/`: start screen, options, i18n, progression, shared
  by the web and android targets
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

- [ ] MAIN — `assets/icon/marshmelt.png` + its `thumb/` cut, and
  `assets/sound/marshmelt.mp3` for the music bed; marshmelt is `draft: true`
  until the icon exists

- [ ] MAIN — finish `slipdeck` itself; it and marshmelt are the two games still
  in construction

- [ ] MAIN — playtest `marshmelt` on a phone: the recovery shot (`airShots`),
  `flingSpeed`, the two fall lanes (`fastChance`, `fastMin/fastMax`) and
  `gripCenter` are set off a headless pilot, not off a thumb. The pilot cheats
  (it reads the rock list, it has no reaction time), so it says the mechanics
  hold, not that the curve is right

- [ ] MAIN — pick which of the ten shots of each game go on its itch page, in
  which order. `assets/screen/<slug>-01..10.jpg` now walks a round from its
  first seconds to its end screen (shot 10), and `assets/cover/<slug>.png` is
  built from shot 6 — but which frame sells a game is a human call, and four or
  five of the ten is what a page wants

- [ ] MAIN — reshoot `marshmelt` once it is playable by the pilot: its ten
  shots all read `score: 0`, because the scripted player in
  `tools/lab/shoot-screens.mjs` cannot play it at all (`SPAN.marshmelt` is 4
  seconds against 30 for the others). Its cover is skipped too, for want of an
  icon

- [ ] MAIN — per-game store URLs in `CONFIG.storeUrl`, once a game has a real
  listing (they all point at the site today, which is correct for now)

- [ ] MAIN — decide which languages the games themselves are localized into

## Known drift and small debts

- [ ] CODE — four playables wrap their end title onto two lines, and did so
  before any font landed: `bouncetry` "OUT OF BALLS!" (703px of a 624px band),
  `echomaze` "OUT OF PULSES!" (766), `orbinity` "LOST IN SPACE" (690),
  `slipdeck` "OUT OF LIVES" (636), all at `.eo-title` 96px in the system stack.
  The web build now measures and scales those down
  (`packages/webshell/menu.js`, section 6b); the playable still needs a call —
  the same fitter in the motor, a smaller `.eo-title`, or shorter strings. It
  rebuilds all 14 creatives, so it is a decision, not a patch

- [ ] MAIN — background art for the six games that have none: `arcider`,
  `chainring`, `marshmelt`, `slipdeck`, `triverse`, `vipera`. The web menu shows
  `assets/image/<slug>-background.png` (embedded as `ASSETS.images.bg`) and
  falls back to the SKIN's gradient, which is correct but empty — the seven
  games with a painted hall read far better

- [ ] MAIN — the leaderboard shows one local best score. The online one, the
  accounts and the progression behind it are `packages/meta` (phase 5), and
  OPTIONS is already the panel it plugs into

- [ ] MAIN — retitle the intros: the 13 shipped `#intro-title` rules are all the
  same white-to-accent clipped gradient. `lab/game-title.html` is the rack of
  ready-made looks — pick one per game (the pick is remembered) and paste the
  block it prints into that game's SKIN

- [ ] CODE — `lab/overlay-pop.html` carries its own fork of the pop CSS,
  predating the extraction: it still has a `filter` on `.pop-word` and it did
  not get the composited-slide fix. The catalogue therefore no longer previews
  what the motor draws. Point it at `packages/shell/motor.css` instead

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
