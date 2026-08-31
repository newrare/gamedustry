# TODO — the newrare game factory

The single running list. [docs/INDUSTRIALIZATION.md](docs/INDUSTRIALIZATION.md)
explains *why* each item exists and in what order; this file tracks *what is
left*. One line per task, grouped by phase, each tagged with who does it:

- **MAIN** — a human action: a decision, an account, an upload, a piece of content.
- **AUTO** — a command or a CI job; no code to write.
- **CODE** — something to develop.

Keep this file honest: tick a box only when the thing is verifiably done, and add
new tasks here rather than leaving them in a conversation.

______________________________________________________________________

## Phase 0 — decisions

All settled; recorded in the `Decisions` table of the industrialization doc.

- [x] MAIN — track `assets/` in git, no LFS (52 MB / 324 files)
- [x] MAIN — site stack: static HTML/CSS, monorepo under `site/`
- [x] MAIN — hosting: Vercel, games under `/games/<slug>`
- [x] MAIN — itch account `newrare`, one project per game
- [x] MAIN — Play account `newrare`, personal → 12 testers / 14 days applies
- [x] MAIN — bundle id namespace `com.newrare.<slug>`
- [x] MAIN — custom domain deferred until the android phase

## Phase 1 — extract the motor

- [x] CODE — `packages/engine`, `packages/platform`, `packages/shell`
- [x] CODE — `tools/lib/parts.mjs`, the single definition of the file's regions
- [x] CODE — `tools/extract.mjs`, the one-shot split
- [x] CODE — `tools/build.mjs --target=playable [--game=…] [--check]`
- [x] AUTO — null-diff verified on 13 units (12 games + the template)
- [x] CODE — per-game `manifest.json` generated from CONFIG + the site catalogue
- [x] AUTO — CTA store URLs point at the newrare site in all 12 games + template
- [x] AUTO — `assets/` untracked from `.gitignore`
- [ ] MAIN — **commit everything** (nothing above is in git yet)
- [ ] CODE — reorganize `tools/` into `lab/`, `build/`, `publish/`, and fix the
  paths quoted in [CLAUDE.md](CLAUDE.md), [README.md](README.md) and
  [docs/CREATING_A_GAME.md](docs/CREATING_A_GAME.md)
- [ ] CODE — retire `tools/check-motor.mjs`: `build.mjs --check` supersedes it
- [ ] CODE — generate the two catalogues from the manifests, so a new game is
  registered once instead of in `site/games.js` **and** the root `index.html`
- [ ] CODE — teach `build.mjs` to read `manifest.json` (today it only assembles
  files; the manifest is written but not yet consumed)

## Phase 2 — the `proto` target

- [ ] CODE — `--target=proto`: no intro, no CTA, no end screen; `R` resets,
  `SPACE` pauses and steps a frame
- [ ] CODE — `packages/devtools/`: fps and `dt`, entity count, hitboxes, the
  `Layout` band drawn over the canvas
- [ ] CODE — live tunables: a slider per number in `CONFIG`
- [ ] CODE — reproducible runs: `?seed=42&speed=3` overrides the RNG and any
  tunable from the URL
- [ ] CODE — `tools/lab/serve.mjs`: static server + SSE reload on save
- [ ] CODE — promotion path documented: proto → full game adds manifest, skin,
  intro and sounds, and touches no gameplay code

## Phase 3 — the site, deployed

- [x] CODE — the site itself (`site/`), bilingual FR/EN, responsive
- [x] CODE — `tools/build-site.mjs` → `dist/site/`
- [x] CODE — the `draft: true` flag, so a game in construction stays off the site
- [ ] MAIN — create the Vercel project: this repo, branch `main`, build
  `node tools/build-site.mjs`, output `dist/site`, framework "Other"
- [ ] CODE — `vercel.json`, so those settings live in the repo and not in a
  dashboard
- [ ] MAIN — verify the preview URL of a pull request on a real phone
- [ ] MAIN — remove `site/newrare-website/` once the new site is approved
- [ ] MAIN — a support e-mail on the newrare domain (currently a personal Gmail)
- [ ] CODE — a privacy policy page and `app-ads.txt` on the site
- [ ] CODE — analytics, so phase 6's retention numbers exist

## Phase 4 — the web adapter (site + itch share one build)

- [ ] CODE — **Delta 2 first**: back `Store.get/set` with an in-memory map, or
  every retention number measured on itch is false
- [ ] CODE — `packages/platform/web.js`
- [ ] CODE — `packages/frame-web/`: desktop dressing around the portrait canvas
  (Delta 1)
- [ ] CODE — `cta: false`, giving the CTA bar's space back to `Layout` (Delta 3)
- [ ] CODE — `--target=web`: shared hashed engine, assets as files instead of
  base64
- [ ] CODE — `--target=web --dest=itch` → `dist/itch/<slug>/`
- [ ] CODE — `tools/publish/deploy-itch.mjs`, wrapping `butler`
- [ ] CODE — `tools/publish/store-meta.mjs`: page copy from the manifest
- [ ] MAIN — `butler login` locally, `BUTLER_API_KEY` as a CI secret
- [ ] MAIN — create the itch page for `vipera` by hand (no public API exists)
- [ ] AUTO — GitHub Actions: `build --check` + `check-size` on every PR
- [ ] AUTO — GitHub Actions: `butler push` to `html5-dev` on merge, `html5` on tag

## Phase 5 — the meta layer

- [ ] CODE — `packages/meta/`: start screen, options, i18n, progression
- [ ] CODE — a local leaderboard behind the interface a server will later fill
- [ ] MAIN — decide whether progression is per game or account-wide

## Phase 6 — all games public, then measure

- [ ] AUTO — build and publish every game to the site and to itch
- [ ] MAIN — create the remaining itch pages, one per game
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
- [x] AUTO — radiam screenshots (`node tools/shoot-screens.mjs radiam`)
- [ ] MAIN — finish `slipdeck` itself; it is the only game still in construction
- [ ] MAIN — per-game store URLs in `CONFIG.storeUrl`, once a game has a real
  listing (all three currently point at the site, which is correct for now)
- [ ] MAIN — decide which languages the games themselves are localized into

## Known drift and small debts

- [ ] CODE — the games' `page.html` files carry per-game comment drift in the
  markup (edited comments, shortened blocks). Harmless, but it means the markup
  is not shared. Normalize it and reduce `page.html` to three tokens.
- [ ] CODE — `CONFIG.title` is all caps in most games while `manifest.json`
  carries the proper name; pick one and derive the other
- [ ] CODE — the root `index.html` gallery duplicates the site's catalogue
- [ ] MAIN — rename the repo: `playables` no longer describes what it holds
