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

The motor lives in `packages/`, the builder consumes the manifests, the tools are
split into `lab/` / `build/` / `publish/`, and the two catalogues are generated.
One thing left:

- [ ] MAIN — commit the tools split and the catalogue generator

## Phase 2 — prototyping

Closed, and reversed: `--target=proto`, `packages/devtools/` and
`tools/lab/serve.mjs` were built, then **removed** — nobody used the tuning
panel, iteration happens on the web build, and the word "proto" made a request
for a quick prototype produce a whole game. A prototype is now one raw HTML page
in `prototype/`, outside the motor; see CLAUDE.md, *Three kinds of request*.

- [ ] MAIN — commit the removal of the proto target and the new prototype rules

## Phase 3 — the site, deployed

The site, `build-site.mjs`, `serve-site.mjs`, `vercel.json`, the `draft` flag, the
privacy page, `app-ads.txt` and `analytics.js` are in. What is left is account
work:

- [ ] MAIN — create the Vercel project: this repo, branch `main`, build
  `node tools/build/build-site.mjs`, output `dist/site`, framework "Other"
- [ ] MAIN — turn Web Analytics on in the Vercel project, or `analytics.js` loads
  a collector that answers 404
- [ ] MAIN — verify the preview URL of a pull request on a real phone
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

- [ ] MAIN — `butler login` locally, `BUTLER_API_KEY` as a CI secret
- [ ] MAIN — create the itch page for `vipera` by hand (no public API exists)
- [ ] AUTO — GitHub Actions on every PR: `build.mjs --check`,
  `gen-catalogues.mjs --check`, `check-size` — so a hand-edited artifact or a
  stale catalogue fails the build
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
