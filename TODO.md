# TODO — the newrare game factory

The single running list. [docs/INDUSTRIALIZATION.md](docs/INDUSTRIALIZATION.md)
explains *why* each item exists and in what order; this file tracks *what is
left*. One line per task, each tagged with who does it:

- **MAIN** — a human action: a decision, an account, an upload, a piece of content.
- **AUTO** — a command; no code to write.
- **CODE** — something to develop.

Keep this file honest: a task is **removed** once it is verifiably done — the
record of what shipped lives in git and in the industrialization doc, not here.
Add new tasks here rather than leaving them in a conversation.

______________________________________________________________________

## Scope, narrowed on 2026-09-10

The factory is built. What is left is **android**, and nothing else is tracked
here any more. The meta layer (`packages/meta`: progression, an online
leaderboard, accounts), the web portals (CrazyGames, Poki and their SDKs), the
measurement gate before wiring ads, and a list of small internal debts were all
dropped from this file on purpose — not done, parked. The industrialization doc
still holds their reasoning if any of them comes back.

Android does not need the meta layer: `--target=android` produces a *web*
directory that Capacitor wraps, so `packages/webshell` ships the start screen,
the options and the FR/EN switch to the app exactly as it does to the site.

## In place

Documented here so the list of what exists does not live only in git.

| capability                           | how                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------ |
| a quick prototype                    | one raw page in `prototype/`, no motor and no build (CLAUDE.md)          |
| the playable-ad build                | `build.mjs` — one self-contained file per game, under 5 MB               |
| the web build                        | `build.mjs --target=web`, `--dest=site` split / `--dest=itch` standalone |
| screenshots, covers, icons           | `tools/lab/shoot-{screens,cover,icon}.mjs`, headless and repeatable      |
| the site, built and deployed         | `build-site.mjs`, then Vercel on every push to `main`                    |
| the 13 itch pages                    | by hand — itch has no API for a page; `store-meta.mjs` prints the form   |
| publishing to itch                   | `make push` — gate, push the commit, then `deploy-itch.mjs --all`        |
| a Newgrounds submission, ready to go | `make ng` — the 13 zips in `dist/newgrounds/`, upload is manual          |
| display type that always fits        | `Fit` in `packages/shell/shell.js`, measured — playable and web alike    |

Two things about that last row, so nobody re-derives them: the `--dest=itch`
build is already portal-neutral (no external request, nothing naming itch.io,
the install CTA inert), and a Newgrounds submission goes *Under Judgment* first
and is deleted automatically if it scores under 1.6/5 at 200 votes — so it is
one game first, not thirteen.

There is no CI. GitHub Actions never ran on this repo (11 runs, every job
refused before a runner was allocated, on a public repo with nothing owed), so
the workflows were deleted and their commands became the root `Makefile`. Run
`make check` before a commit; nothing else will.

______________________________________________________________________

## Android

**The prerequisites are slow and none of them are code.** The domain especially:
it was deferred while the site ran on Vercel, which was right, but Google Play
wants a real support address and a privacy URL on a domain you own, so it comes
back first here.

- [ ] MAIN — buy the domain and attach it to Vercel. `SITE.url` in
  `tools/publish/store-meta.mjs` is the one place the address is written
- [ ] MAIN — a support e-mail on that domain, replacing the personal Gmail
  quoted in `site/privacy.html` and `site/index.html` (both to update, and the
  two copies of the privacy text are edited together)
- [ ] MAIN — clear Play identity verification, set the public developer address
- [ ] MAIN — recruit 12 testers with 12 distinct Google accounts. Google
  requires closed testing before a new personal developer account can go
  public, and this is the item with the longest lead time — start it early

**The build:**

- [ ] CODE — `--target=android` in `build.mjs` (`TARGETS` is `['playable', 'web']`
  today): a web directory for Capacitor to wrap
- [ ] CODE — `tools/publish/gen-native.mjs`: manifest → Capacitor project under
  `native/<slug>/`
- [ ] CODE — `packages/platform/capacitor.js`, the fourth implementation of the
  slot MRAID and `web.js` already fill
- [ ] MAIN — generate the keystore and back it up off the signing machine.
  Losing it means never being able to update an app again
- [ ] AUTO — a `make android` target next to `push`, wrapping Gradle and
  `fastlane android beta`; there is no CI to run it on a tag

**Per app, on the console:**

- [ ] MAIN — create the Play app: listing, screenshots, content rating
  questionnaire, *Data safety* form, privacy URL, support e-mail, target API
  level. `store-meta.mjs` already prints the copy
- [ ] MAIN — upload the very first `.aab` by hand; `fastlane supply` cannot
  create the app
- [ ] MAIN — decide whether the audience is declared under 13 (Families policy).
  It changes what ads and what data collection are allowed, so decide it before
  the *Data safety* form, not after

**Only if the apps are monetized** — kept because the CMP is a legal
requirement, not a feature, and it is easy to discover too late:

- [ ] MAIN — AdMob account, tax and payment profile, ad units linked to the app
- [ ] CODE — a TCF-certified CMP (Google UMP) for EEA/UK traffic, and
  `Platform.ads` wired to AdMob through the Capacitor adapter
- [ ] MAIN — fill `site/app-ads.txt` with the AdMob publisher record
