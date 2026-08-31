# Industrialization — the game factory

This repo started as a template for playable ads. It is becoming a **factory**:
one source per game, four build targets, and the tooling to author, build and
publish them.

```
concept ──▶ proto ──▶ web (site + itch) ──▶ measure ──┬─▶ portals
                                                      ├─▶ playable
                                                      └─▶ android
```

A game is written **once**. `games/<slug>/game.js` is the only game-owned code;
what changes between targets is the shell the builder wraps around it. The
playable is no longer the reason the repo exists — it is one of four outlets.

This is the plan of record; the phasing at the end is the order to build it in,
and the prerequisite decisions are settled — see [Decisions](#decisions).

Three pieces exist already:

- **The extraction.** The motor lives once in `packages/`; every game owns only
  `page.html`, `skin.css`, `game.js` and `manifest.json`. `node tools/build.mjs`
  assembles them and `--check` proves all 13 units (12 games + the template)
  rebuild **byte-identically**.
- **The `playable` target**, which is what that build produces.
- **The public site**, in `site/`, assembled by `node tools/build-site.mjs`.

Everything else below is still to build.

## The four targets

|              | proto           | web (site + itch)  | playable        | android        |
| ------------ | --------------- | ------------------ | --------------- | -------------- |
| output       | `dist/proto/`   | `dist/web/`        | 1 inlined HTML  | `.aab`         |
| adapter      | none            | web / portal SDK   | MRAID           | Capacitor      |
| build adds   | devtools        | meta layer, frame  | MRAID, CTA      | AdMob, consent |
| build drops  | intro, CTA, end | 5 MB cap, base64   | meta, backend   | store CTA      |
| size cap     | none            | free, shared cache | < 5 MB          | free           |
| meta layer   | no              | yes, + backend     | no              | yes            |
| storage      | localStorage    | first-party, safe  | localStorage    | native         |
| deploy       | local only      | Vercel + `butler`  | manual delivery | fastlane       |
| review delay | none            | none               | none            | days to weeks  |
| audience     | you             | players            | ad networks     | Play           |

`web` covers three destinations — the newrare site, itch, and later the portals —
because they are one adapter with different configuration. The code cost is paid
once.

**Why the web comes before native.** It is the cheapest end-to-end deployment
loop that exists — no review, no signing, no store account, updates live in
seconds — and it carries the full **meta layer** (start screen, options,
progression, leaderboard). It is a dress rehearsal for the native app, on the web.

**The division of labour between the two web destinations:**

|         | newrare site                         | itch                       |
| ------- | ------------------------------------ | -------------------------- |
| traffic | none, you bring it                   | modest, but free discovery |
| control | total (SEO, backend, analytics, ads) | a page and an iframe       |
| storage | first-party, reliable                | sandboxed, may be blocked  |
| revenue | 100% yours                           | donations only             |
| cost    | hosting + the work                   | zero                       |

The site is the **home** — canonical URL, real progression, real leaderboard.
itch and the portals are **acquisition**. Ship both from day one; they are one
build.

## Target repo layout

```
newrare-arcade/
├── site/                  ← the newrare website (static), deployed on push
│                            the builder drops the games under dist/site/games/
├── packages/
│   ├── engine/            ← sections 3 + 7, extracted (frame, input, loop, audio, Fx)
│   ├── shell/             ← section 5 (HUD, Pop, Overlay, intro, end screen)
│   ├── platform/          ← the adapter interface + one impl per target
│   │   ├── mraid.js
│   │   ├── web.js         ← itch, and the base for portals
│   │   ├── poki.js
│   │   ├── crazygames.js
│   │   └── capacitor.js
│   ├── devtools/          ← the proto overlay: fps, hitboxes, tunables, seed
│   ├── frame-web/         ← desktop letterbox dressing (see Delta 1)
│   └── meta/              ← start screen, options, i18n, progression, leaderboard
├── games/<slug>/
│   ├── game.js            ← sections 1, 2, 6 — the only game-owned code
│   ├── skin.css           ← the SKIN block
│   ├── manifest.json      ← per-game target config
│   └── assets/            ← sounds and images in source form, not base64
├── targets/               ← one builder per target: proto, web, playable, android
├── tools/
│   ├── lab/               ← author and inspect
│   ├── build/             ← build.mjs and the checks, now build assertions
│   └── publish/           ← deploy-web, deploy-itch, gen-native, store-meta
├── lab/                   ← the HTML workbenches (overlay-pop, icon-card…)
└── dist/                  ← gitignored build output
```

**Still no bundler for the games.** `tools/build/build.mjs` is a plain Node script
concatenating text files, the same way `tools/check-motor.mjs` already slices
them. The `no build step` rule in [CLAUDE.md](../CLAUDE.md) now means: *the
games* have no build step — the factory around them may. Real dependencies appear
only at the `android` target, where Capacitor and fastlane are unavoidable.

**The playable's invariant holds.** `--target=playable` regenerates every
`games/<slug>/index.html` with a **null diff**, verified by
`node tools/build.mjs --check`. That is the
acceptance test for the whole extraction: if the diff is not empty, the
extraction is wrong. `tools/check-motor.mjs` stops being a drift checker and
becomes a build assertion.

## Per-game manifest

```json
{
  "slug": "vipera",
  "title": "Vipera",
  "tagline": "Tap to swerve, grow, dodge.",
  "targets": ["proto", "web", "playable", "android"],
  "theme": { "bg": "#0a0a1c", "accent": "#5ef2a0" },
  "itch": {
    "user": "newrare",
    "project": "vipera",
    "channel": "html5",
    "viewport": [450, 800],
    "mobileFriendly": true,
    "frame": "device",
    "cta": false
  },
  "android": {
    "appId": "com.newrare.vipera",
    "ads": { "rewarded": true, "interstitial": true }
  }
}
```

The manifest is the single source of truth. `CONFIG` in the built file, the hub
card, the Capacitor config, the itch push arguments and the store copy are all
derived from it — never edited in two places. `targets` is also how a prototype
declares it is still a prototype: `["proto"]` until it earns more.

## The platform adapter

Section 4 (`AD GLUE`) generalizes into one interface. Every target implements it;
the engine and the games only ever call it.

```js
Platform = {
  whenReady(cb),        // MRAID ready | portal SDK init | immediate
  watchVisibility(),    // pause the loop off-screen
  openStore(),          // store URL | itch page | no-op
  track(event, data),
  ads: {                // NEW — the playable target has no equivalent
    interstitial(done),
    rewarded(done),     // done(granted)
    gameplayStart(),    // portals require this pair
    gameplayStop()
  },
  storage: { get, set } // Store, with the memory fallback of Delta 2
}
```

`ads` is the one genuinely new abstraction. On `proto`, `playable` and `itch`
every method is a no-op that calls back immediately; on portals it maps to their
SDK; on `android` it maps to AdMob.

## proto — the validation loop

The point of the factory: try a concept in an evening and throw it away without
guilt, then promote it without rewriting it. A prototype is a **real game module**
— it implements `reset / update / render / onDown` — running in a stripped shell.

`--target=proto` gives it:

- **Instant start.** No intro to click, no CTA, no end-screen ceremony. `R`
  resets, `SPACE` pauses and steps one frame.
- **A debug overlay** (`packages/devtools/`): fps and `dt`, entity count, hitboxes,
  the `Layout` band drawn over the canvas.
- **Live tunables.** Every number in `CONFIG` gets a slider. You tune gravity by
  dragging, not by reloading.
- **Reproducible runs.** `?seed=42&speed=3` overrides the RNG seed and any tunable
  from the URL, so a bug can be replayed exactly.
- **Reload on save**, from `node tools/lab/serve.mjs` — a static server with an SSE
  reload channel, about forty lines and no dependencies.
- **No constraints.** No size cap, no ad SDK, no store, no dressing.

Promotion to a full game is additive: write the manifest, the skin, the intro
sentence and the sounds. The gameplay code does not move. That property is the
whole reason `proto` is a build target and not a separate folder of throwaway
pages.

## web — the newrare site and itch

The newrare site is **static HTML/CSS** and lives in this repo under `site/`. It
exists: a studio page carrying the playables, the two store apps, the studio copy
and the legal terms, bilingual FR/EN, with the games played in a 9:16 modal and
their screenshots in a lightbox.

`node tools/build-site.mjs` already assembles it into `dist/site/` — it copies
`site/`, then each playable's self-contained `index.html`, then each game's icon
and screenshots out of `assets/`, and rewrites the catalogue with what it found on
disk. **This is the deployable site today**, before any of the extraction below:
the playables are single self-contained files, so shipping them is a copy.

What the `--target=web` builder adds later is the shared engine, assets as files
instead of base64, and the meta layer. The page itself does not change shape.

```
dist/web/
├── index.html              ← the hub, generated from the manifests
├── engine.<hash>.js        ← shared by every game, cached once
├── engine.<hash>.css
└── <slug>/
    ├── index.html          ← thin page, loads the shared engine + its game.js
    ├── game.<hash>.js
    └── assets/…            ← sounds and images as files, no longer base64
```

Three things this target gets that no other web destination does:

1. **Shared cache.** The engine is one file across nine games, so the second game
   a visitor opens starts instantly. This is the reward for dropping the
   single-file constraint — and the reason assets stop being base64 (a data URI
   is ~33% larger than the file it encodes and is re-downloaded per game).
1. **First-party storage.** No sandboxed iframe, no third-party cookie policy:
   `localStorage` is reliable, so progression, best scores and settings actually
   persist. itch is the degraded case, not the reference.
1. **A backend is possible.** A real leaderboard, accounts, cloud saves — the
   parts of `packages/meta` that itch can never host. Start with the local-only
   version, add the server later behind the same interface.

The CTA fallback baked into every game still points at `52-entertainment.com`
([template/game-template.html:936](../template/game-template.html#L936)); phase 1
rewrites it to the newrare domain across the template and the nine games.

**A custom domain is a store prerequisite, not a site prerequisite.** The site
runs perfectly on `newrare-website.vercel.app`, which is where it stays for now.
But that host cannot serve as the developer domain of a Play listing: AdMob wants
an `app-ads.txt` at the root of that domain, and a `*.vercel.app` listing reads as
unfinished. Buy the domain and point it at the existing Vercel project before the
android phase — a few euros a year, and nothing depends on it until then.

**The site is where the store paperwork lives**: `app-ads.txt`, the privacy policy
URL (mandatory as soon as an ad SDK ships) and a public support address.

**Ads on the site are yours.** Unlike a portal, nobody takes a share — but nobody
brings traffic either. Do not wire ads into the site before the measurement phase
says which games hold an audience; an empty site with ads on it earns nothing and
looks worse.

## The three real deltas for the web adapter

Everything else already works: the keyboard is wired (`SPACE`, arrows through
`Input.swipe`), `Sound.unlock()` already handles the required user gesture, and
there are zero external requests — so the itch sandbox needs no adaptation.

### Delta 1 — portrait on desktop

The motor letterboxes 720×1280. On a 16:9 desktop screen that means two huge
black bands. `packages/frame-web/` dresses the space around the canvas: a
background derived from `manifest.theme`, optionally a device bezel.

On the itch page side, set the embed window to portrait (~450×800), enable the
fullscreen button, and tick **mobile friendly** — on a phone the game fills the
screen and the dressing disappears.

### Delta 2 — `Store` has no memory fallback

This one only bites on itch and the portals — on your own origin `localStorage`
works normally. itch serves the game from a sandboxed iframe on
`html-classic.itch.zone`, so a browser blocking third-party storage makes
`localStorage` **throw**.

The current implementation already catches, so nothing crashes:

```js
// template/game-template.html:1464
var Store = {
  get: function (k, d) { try { … } catch (e) { return d; } },
  set: function (k, v) { try { … } catch (e) {} }
};
```

But `set` swallowing the error means the value is lost immediately — not even
within the session, because the next `get` also throws and returns the default.
Best score and progression vanish silently for those players.

Fix: back both accessors with an in-memory map used whenever `localStorage` is
unavailable. Session-scoped persistence instead of none. **This must land before
any retention measurement**, otherwise the numbers are false.

### Delta 3 — `openStore()` has no store

Per destination: on the site it points back at the hub or at the game's page (and
later at the real store listing once the app exists); on itch, at the itch page;
on a portal, nowhere — outbound links are usually forbidden. The motor's
persistent CTA bar therefore becomes optional: `cta: false` in the target config
removes it, and the space it occupied goes back to `Layout`.

## Tooling

Three families, by what they are for.

| family           | tools                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| exists today     | `tools/build-site.mjs` — site + playables → `dist/site/`                                                             |
| `tools/lab/`     | `serve.mjs` (proto + live reload), `embed-asset`, `embed-icon`, `shoot-icon`, `shoot-screens`, headless canvas bench |
| `tools/build/`   | `build.mjs --target=… --game=…`, `check-size`, `check-motor`                                                         |
| `tools/publish/` | `deploy-web`, `deploy-itch` (butler), `gen-native`, `store-meta`                                                     |

The HTML workbenches in [lab/](../lab/) — `overlay-pop`, `icon-card`, `bubble` —
stay where they are: they are visual ateliers, not scripts.

Everything in `tools/` is flat today. Moving the scripts into these
subdirectories breaks the paths quoted in [CLAUDE.md](../CLAUDE.md),
[README.md](../README.md) and [docs/CREATING_A_GAME.md](CREATING_A_GAME.md), so it
is a phase 1 chore done in one commit — `build-site.mjs` becomes
`tools/build/build-site.mjs` then, not before.

## itch deployment with butler

`butler` is itch.io's own CLI. It talks **directly to itch.io over HTTPS** — git
is not involved. It diffs against the previous build of the channel, uploads only
what changed, zips the directory itself, and is idempotent.

```bash
node tools/build/build.mjs --target=web --dest=itch --game=vipera
butler push dist/itch/vipera newrare/vipera:html5
```

- **Auth**: `butler login` once locally (credentials in `~/.config/itch`), or
  `BUTLER_API_KEY` as an environment variable in CI.
- **Channels** are independent: `html5-dev` for every merge, `html5` for the
  public build. A channel name containing `html` marks the build as playable in
  the browser.
- **What butler cannot do**: edit the page. Title, description, tags,
  screenshots, embed size and the *play in browser* checkbox have no public
  API — they are set by hand, once per game. `tools/publish/store-meta.mjs`
  generates the text from the manifest so it is only ever copy-pasted.

## CI — two systems, two jobs

**Vercel owns the web.** The project points at this repo, production branch
`main`, build command `node tools/build-site.mjs`, output directory `dist/site`.
No install step, no dependency, no framework preset — it is one Node script over
the repo's own files.

- Every push to `main` redeploys the site **and** the games together.
- Every pull request gets a **preview URL** — openable on a phone, shareable for
  playtests, nothing signed and nothing reviewed. This is the most profitable
  mechanism in this document, and it costs one Vercel setting.
- Adding a game updates the hub by itself: the cards are generated from the
  manifests.

**GitHub Actions owns everything Vercel cannot run**: `butler`, Gradle, fastlane.

| trigger         | action                                                    |
| --------------- | --------------------------------------------------------- |
| PR / push       | `check-size`, `check-motor`, playable null-diff assertion |
| merge on `main` | `butler push` to `html5-dev`                              |
| git tag         | `butler push` to `html5`, and/or fastlane                 |

**Prerequisite, resolved**: `.gitignore` ignores `assets/` today, which would stop
CI from ever re-embedding a sound, regenerating an icon or shooting a screenshot.
`assets/` is now tracked — 52 MB over 324 files, comfortably inside GitHub's
limits, **no Git LFS needed**. Untracking it is a one-line `.gitignore` change
plus one commit.

## Web portals

A portal is a fourth `platform` implementation — the same slot MRAID occupies.
Once the web target exists, the code cost is roughly a day each. The obstacle is
access, not engineering.

| portal     | access                   | requirements                                                         |
| ---------- | ------------------------ | -------------------------------------------------------------------- |
| Newgrounds | open, upload immediately | none, SDK optional                                                   |
| CrazyGames | submit, QA review        | SDK required, no outbound links, no ads of your own                  |
| Poki       | curated, they select     | SDK required, strict QA, negotiated rev-share, sometimes exclusivity |

All of them monetize with **their** ad SDK and pay a revenue share, which is what
makes `Platform.ads` worth abstracting now rather than later. They also require
`gameplayStart()` / `gameplayStop()` so they know when it is safe to interrupt.

Newgrounds is the place to shake down the adapter. CrazyGames is the first real
reachable traffic. Poki is a goal, not a checkbox.

## android

`--target=android` produces a web directory, `gen-native.mjs` turns the manifest
into a Capacitor project, Gradle produces a signed `.aab`, and `fastlane supply`
uploads it.

```bash
node tools/build/build.mjs --target=android --game=vipera
node tools/publish/gen-native.mjs vipera      # → native/vipera/ (android/)
cd native/vipera && fastlane android beta
```

Friction points, all one-time:

- **Keystore** generated once, never committed (base64 in a CI secret), and backed
  up somewhere other than CI. Losing it means never being able to update the app
  again.
- **Play Console listing created by hand**, once per app: store listing,
  screenshots, content rating questionnaire, *Data safety* form, privacy policy
  URL, public support email, target API level.
- **fastlane supply** needs a Google Play **service account** JSON with API
  access. Expect the very first `.aab` to require a manual upload through the
  console before the API accepts subsequent ones.
- **The closed-test rule applies.** The newrare Play account is a personal one, so
  every app must run a closed test with **12 testers opted in for 14 consecutive
  days** before production. That is the real cost of this phase — recruiting and
  holding twelve distinct Google accounts, not the engineering.
- **Identity verification** (ID, address) and a **public developer address** are
  mandatory on personal accounts and take days to clear. Do it once, early.
- An offline Capacitor game does not trip the "webview wrapping a website"
  rejection — all assets are embedded.

**What fastlane buys, given the listing is manual.** Creating the app is manual;
everything after it is not. fastlane bumps the `versionCode`, builds and signs the
`.aab` without exposing the keystore, uploads to a track, and **promotes a build
between tracks** in one command — which you will run on every cycle of the
12-tester test. `fastlane supply` also updates descriptions, screenshots and
changelogs from text files once the app exists. Only app creation, the content
rating questionnaire and the *Data safety* form stay irreducibly manual.

## Ads on the native app

The SDK can be integrated before publication, but full serving requires the Play
listing to exist (AdMob links the app to verify it) plus an `app-ads.txt` at the
root of the developer domain declared in the listing.

- **Formats**: rewarded (continue / second life) and interstitial (between runs).
  No banner — it eats the portrait canvas.
- **Wiring**: the game calls `Platform.ads.rewarded()`; the Capacitor adapter
  maps it to AdMob, the web adapter to the portal SDK, the playable adapter to
  nothing.
- **Consent is mandatory**: a TCF-certified CMP (Google's UMP SDK qualifies) is
  required to serve personalized ads to EEA/UK traffic.
- **Children**: declaring an under-13 audience puts the app under the Families
  policy — self-certified ad SDKs only, no personalized ads, lower eCPM.
- **Economics**: in casual, eCPM only pays with volume. That is precisely why itch
  and the portals come first — they filter which games deserve the store cost.

## Decisions

| question            | decision                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets/` in git    | tracked, no LFS (52 MB / 324 files)                                                                                                                   |
| site stack          | static HTML/CSS, no build of its own                                                                                                                  |
| site location       | **monorepo** — `site/` in this repo, built by `tools/build-site.mjs`, deployed by Vercel                                                              |
| hosting             | Vercel, games under `/games/<slug>` of the site                                                                                                       |
| domain              | deferred — the site stays on `newrare-website.vercel.app` until the android phase, which is the first thing that actually requires a developer domain |
| itch account        | `newrare`, personal                                                                                                                                   |
| itch structure      | one project per game, plus a collection                                                                                                               |
| Play account        | `newrare`, personal → the 12-testers / 14-days rule applies                                                                                           |
| bundle id namespace | `com.newrare.<slug>`                                                                                                                                  |
| CTA fallback        | newrare domain, replacing `52-entertainment.com` in the template + 9 games                                                                            |

## The manual surface

Automation stops where the platforms offer no API. Knowing exactly where saves
building tools that cannot exist.

**Once, before the store phase:**

- Buy the domain and attach it to the Vercel project (deferred until this phase;
  the site itself needs nothing).
- Publish the privacy policy page, a public support address, and `app-ads.txt`.
- Clear Play identity verification and set the public developer address.
- Create the AdMob account, tax and payment profile, and configure the CMP.
- Recruit twelve testers with twelve distinct Google accounts.
- Store the secrets: `BUTLER_API_KEY`, the Google Play service account JSON, the
  base64 keystore. (Vercel needs no secret — it builds from the repo.)

**Once per game, forever:**

- The itch page — title, description, tags, screenshots, embed size, *play in
  browser*, *mobile friendly*. `store-meta.mjs` generates the text; pasting it is
  manual. No public API exists.
- The Play app — creation, content rating questionnaire, *Data safety* form, and
  the first `.aab` uploaded through the console.
- The AdMob ad units and their link to the listing.
- Portal submissions (Newgrounds, CrazyGames, Poki) — uploads and QA rounds.
- Delivering the playable file to the ad network's console.
- Choosing which moments to capture: `shoot-screens.mjs` takes the shot, it does
  not know which frame sells the game. Play also imposes a 512×512 icon and a
  1024×500 feature graphic.
- The content itself: design, tagline, icon artwork, translations.

**Fully automatic, per game:** the site and web deploy, the itch build and
`butler push`, the playable build, the preview URL of every PR, and every check.

## Phasing

1. ~~**Extract** `engine` / `shell` / `platform`~~ — **done.** `packages/` holds
   the motor, `tools/build.mjs --check` asserts the null diff on 13 units, the CTA
   URLs point at the newrare site, and `assets/` is untracked from `.gitignore`.
   What remains of this phase: reorganize `tools/` into `lab/ build/ publish/`,
   retire `check-motor.mjs` (superseded by `build --check`), and make the
   generated `manifest.json` files the source of the two catalogues instead of
   `site/games.js` and the root `index.html`.
1. **`proto`** — the target, `packages/devtools/`, `tools/lab/serve.mjs`. Two
   days, and every phase after it is faster. It also proves the extraction: an
   engine that can run outside the playable shell is an engine that was really
   extracted.
1. **The site, in this repo, deployed by Vercel** — the page and
   `tools/build-site.mjs` are **done**; what remains is the Vercel project (repo,
   branch, build command, output directory), the custom domain, and generating the
   catalogue from the manifests instead of `site/games.js`. Push-to-deploy and
   preview URLs from here on.
1. **The web adapter, deployed twice** — one game (`vipera`) on the site *and* on
   itch. `frame-web`, the `Store` memory fallback, `cta: false`, `butler push` in
   Actions. One code cost, two destinations, and the whole deployment loop is
   bought.
1. **`packages/meta`** — start screen, options, i18n, progression, leaderboard —
   designed and iterated on the site, where every fix is live in a minute.
1. **All nine games public**, on the site and on itch. This is the measurement:
   real retention and replay rate, for free, before committing any investment.
1. **Portals** — Newgrounds to shake down the adapter, then CrazyGames for
   volume. Real traffic to separate the games that work from the rest.
1. **android**, then backend / IAP / ads — **only** for the games that phases 6
   and 7 validated.

Native comes last on purpose: the cost of the stores is only paid for games that
have already proven something.

## Shipping a new game, once all of this exists

1. `games/<slug>/game.js` + `manifest.json` with `"targets": ["proto"]`.
   `node tools/lab/serve.mjs <slug>` — play it, tune it, decide.
1. If it is worth keeping: add `skin.css`, the intro sentence, the sounds and the
   icon artwork; extend `targets`.
1. Open the PR — the checks run and Vercel posts a preview URL. Play it on a
   phone.
1. Merge — site and games redeploy; the `html5-dev` itch channel updates. The hub
   card appears from the manifest.
1. Tag — production site and the `html5` channel go live. That is the entire web
   release.
1. Create the itch page by hand, once.
1. Portals and the store only if the numbers justify them.
