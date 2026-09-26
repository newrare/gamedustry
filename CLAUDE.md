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
1. **Every string is written in normal case, and CAPITALS are a look the motor
   applies.** A source — `game.js`, `manifest.json`, `page.html`, the web
   shell's own `STRINGS` — holds `"Best score"`, `"Time's up!"`, `"Chaîne x"`:
   lowercase, with a capital on the first letter and on a proper noun. Where a
   screen shouts, the motor's `upper()` is what shouts it, and **a capital
   carries no accent** ("Déjà" reads DEJA). Never type a word in capitals to get
   capitals on screen, and never `toUpperCase` — `upper` also leaves a unit
   glued to a number alone, so `"Chain x" + 3` stays CHAIN x3. See
   [docs/ENGINE.md](docs/ENGINE.md#upper--capitals-are-a-look-not-a-spelling).
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
   *this* game — keep the motor's shared finger (`assets/motor/svg/finger.svg`, already
   inlined in `.demo-hand`; never draw another hand — the web Help card swaps its picture for the shell's
   painted one, `CONFIG.shellArt.hand`, cut from `assets/image/master/game-object-hand.png`,
   and keeps the box and the SKIN's choreography) and re-dress the target /
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
     over → plays the cinematic end screen. **At most four `rows`**: past that the
     column overflows the frame and the cascade drags. The end screen's
     character no longer depends on the row count — it arrives at twice its
     size and settles into the corner over the reveal, painted under everything
     the screen writes (see [docs/ENGINE.md](docs/ENGINE.md)). `stars` is what
     picks the face — 3 → happy, 2 or 1 → neutral, 0 → sad.
1. Wire the feel through the shared layers: `HUD.setScore/punch/setLeft`,
   `Fx.burst/ring/shake/flash/freeze`, `Pop.show` for **every MOMENT the game
   writes** (a mistake as it happens is the `alert` style), **`Notify.say` for
   every piece of INFORMATION** — a state that changed, an input refused, a
   hint, a warning — `Pop.text` for a value floating in the world,
   `Overlay.vignette` for the glow, `Sound.clip`. Never paint a status line on
   the canvas and never build a message node of your own.
1. Give every event a sound **picked from `assets/audio/sfx/`**, trimmed and embedded
   in `ASSETS.sounds` (see [docs/ASSETS.md](docs/ASSETS.md)). Every file there is
   named `<category>-<descriptor>-<NN>` — browse it by ear at `make events` →
   `/library`, or `node tools/lab/index-sfx.mjs --list metal heavy` — and the
   comment above the clip names the file it was cut from (`// hit: mallet-plink-01`),
   which is the only record `make events` has of it. Never invent a synth
   voice for a game: `Sound.beep/arp` is only the fallback for an event with no
   clip.
1. **Never create the app icon, and never create the painted artwork.** Both are
   added later by the user: the icon (`assets/image/icon/<slug>.png` and its `thumb/`
   cut) and the six pieces of `assets/image/master/<slug>-*.png` (see
   [The painted artwork](#the-painted-artwork)). Leave `ASSETS.images` without a
   `logo` key and keep `CONFIG.intro.logo` at `null` — the intro hides
   `#app-icon`, and once a `-title.png` exists the drawn logotype replaces both
   the icon and the CSS title anyway. Never generate, draw or embed a
   placeholder for any of it.
1. Update `#intro-title` / `#intro-tagline` in `page.html` to match `CONFIG`, then
   describe the game **once**, in `games/<slug>/manifest.json`: `title`,
   `version`, `order`, `draft`, `targets`, `theme`, `copy.fr` / `copy.en` (one
   tagline and three tags each) and `description` (the long English write-up).
   Translate the game in the same file: `web.copy.fr.strings`, one entry per
   English string it writes — `node tools/lab/scan-text.mjs <slug>` lists what is
   missing and `make text` is the desk to fill it in.
   `version` is what the studio signature prints on the title screen — the mark,
   `NEWRARE` and `v<version>` in the bottom-left corner, injected as
   `CONFIG.brand` by the builder and drawn by the shell, so a game writes the
   number and nothing else (see [docs/ENGINE.md](docs/ENGINE.md)). Run
   `node tools/build/gen-catalogues.mjs` to regenerate `site/games.js` and the
   `GAMES` block of the root `index.html` — never edit those two by hand. A game
   with no `assets/image/icon/thumb/<slug>.png` is skipped by the site build.
1. Run `node tools/update.mjs`, which builds, checks and says what is left, then
   open `games/<slug>/index.html` in a browser to test.

The full recipe with prompt patterns is in
[docs/CREATING_A_GAME.md](docs/CREATING_A_GAME.md).

## The build

**After changing anything, run `node tools/update.mjs`** — or `make check`,
which runs `mdformat` first. One command: it rebuilds every artifact and both
catalogues, runs the three checks, and then prints what is left to do — the itch push, the screenshots, the page copy to
paste — worked out from what actually changed in git rather than from a
checklist to remember. Everything below this line is what that command runs;
reach for an individual command when the update tells you which one failed, not
as a habit.

It never pushes anywhere, never reshoots an image and never commits: those are
decisions, and it prints them instead of taking them. **`make push` is the one
that acts** — it gates, refuses a dirty tree, `git push`es, then publishes the
13 to itch; Vercel redeploys the site off the same push. There is no CI: GitHub
Actions never ran on this repo and its workflows were deleted (see
[docs/INDUSTRIALIZATION.md](docs/INDUSTRIALIZATION.md), *CI*), so nothing checks
a commit but the person making it.

**Bump the game's `version` when you change the game.** `manifest.json` carries
a semver `version`, and the title screen signs itself with it — the newrare
mark, `NEWRARE` and `v<version>` in the bottom-left corner, injected as
`CONFIG.brand` (see [docs/ENGINE.md](docs/ENGINE.md)). It is the one number
that says which build a player — or a bug report, or an itch page — is looking
at, so **touching a game's sources means moving its version in the same
change**: patch for a fix or a tuning pass, minor for a new mechanic, mode or
level set, major for a game the player would not recognise. A game that also
ships on Play moves `android.versionName` and `versionCode` with it. Nothing
checks this: `tools/update.mjs` cannot tell a rebuild from a new build, so it
is on the person making the change.

`games/<slug>/index.html` is a **build output**, not a source. The motor lives
once in `packages/`, and each game owns four files:

| file            | what it is                                                       |
| --------------- | ---------------------------------------------------------------- |
| `page.html`     | head + markup, with `{{MOTOR_CSS}}` `{{SKIN_CSS}}` `{{SCRIPT}}`  |
| `skin.css`      | the `SKIN — <GAME>` block, nothing else                          |
| `game.js`       | sections 1 (`CONFIG`), 2 (`ASSETS`) and 6 (`GAME`)               |
| `manifest.json` | title, version, tagline, targets, theme, itch and android config |

```bash
node tools/build/build.mjs                     # every game + the template
node tools/build/build.mjs --game=vipera
node tools/build/build.mjs --check             # assert the artifacts match the sources
node tools/build/build.mjs --target=web        # → dist/web/, never committed
node tools/build/build.mjs --target=web --dest=itch   # → dist/itch/<slug>/
node tools/build/build.mjs --target=android --game=radiam   # → dist/android/<slug>/
```

**`make android GAME=<slug>` is the Play bundle**, and it is the web build in a
Capacitor WebView: same menu, same options, same FR/EN switch, with
`packages/platform/capacitor.js` in section 4 instead of `web.js` — the back
button and the app going to the background are all it adds.
`tools/publish/gen-native.mjs` turns the manifest into `native/<slug>/`, which
is a build output like `dist/` and is never edited by hand; Gradle then writes
the `.aab`, signed with the studio's one keystore and this game's own key alias
— named in `~/.newrare/signing.properties`, outside the repo, because
`native/<slug>/` is regenerated; without that file the bundle is unsigned and
says so.
A game gets there by listing `android` in its `targets` and setting
`android.appId` / `versionName` / `versionCode`. See
[docs/INDUSTRIALIZATION.md](docs/INDUSTRIALIZATION.md), *android*.

A game's `manifest.json` lists the `targets` it is meant for; a build for a
target it does not list is skipped and reported.

**There is no separate game server.** To iterate on a game, run the site loop —
`node tools/lab/serve-site.mjs` rebuilds in ~0.3 s and reloads on save (see
[The site](#the-site)). What you play is the web build the site ships.

`packages/webshell/` is the layer the **web** target adds, and section 4 is
the one region chosen by the target rather than shared: `packages/platform/web.js`
replaces `packages/platform/mraid.js`, so there is no MRAID and no store link,
and `CONFIG.layout.ctaHeight` is zeroed before the first layout — the CTA bar's
band goes back to `Layout`.

On top of that the webshell replaces the playable's intro with **the menu of a
finished game**, and it is one shape for all thirteen — the files of
`packages/webshell/` are the template, so a game gets it by listing `web` in its
`targets` and nothing else.

**Everything that front end puts on screen is one of two things, and there are
exactly two** — `packages/webshell/view.js` is the system and
[docs/VIEWS.md](docs/VIEWS.md) is the plan of record. A **view** is a place the
player goes: title, map, sticker, shop, ranking, score. They stack, and the view
system — not the screen — owns the mounting, the z-order, the bed and the wallet
band. A **card** is something that happens over wherever they are: options,
help, leaving a round, a daily reward, an ad, a prize. It never replaces the
screen under it and it is dismissed rather than navigated. ESCAPE walks that one
stack top down, and `make test` is what holds the contract
(`tools/test/views.mjs`, in a real build).

**Every view that is a room of the place stands in ONE frame, the SHEET** —
the collection, the shop, the ranking and the barracks' four
(`View.sheet`, packages/webshell/view.js). The hub's own ground under one
veil, a sheet risen out of the bottom edge under the band, its title and one
line under it, the body — the one region that scrolls — and a bar at the foot
carrying the view's pages as tabs, then home, help and options after a filet — that house is the way home there, so the band drops its own over a sheet. A view
with one page has no tabs. A view writes its body and names its pages; the
ground, the veil, the header, the bar and the entrance are the sheet's, so a
new room is never a new screen structure. **Pulled down, a sheet goes** — by
finger or by mouse, from the header or from a body scrolled to its top, and it
is `back()`, the same answer as ESCAPE; a control that drags on its own opts
out with `data-nopull`. Chosen in `lab/view-frame.html`; see
[docs/VIEWS.md](docs/VIEWS.md).

**There is no back arrow in it.** A back arrow answers "where did I come from",
and the player does not care — they care where they are going. The **wallet band
IS the navigation**: one line, `⌂ · ⚡ · 1 240 · 3 | 3/20 · 12/90`, each chip the
door to the screen it is the number of — home, the ranking, the shop, the
collection, the map. The tickets and the album's count are ONE chip, two figures
behind one filet, because both open the collection and two chips leading to one
screen read as two places; the count lives there and not in the album's title,
which names the room like every sheet's. The row never changes shape and a chip standing on its own screen goes
inert rather than missing, so a number is never one to find again — the house
alone is dropped on the bare village, since it is only a door and that door is
the screen under it, and over every sheet, whose own bar carries it bottom right
(a card over either brings it back); the row
runs edge to edge, the house against the left gutter, and the level chip's xp
bar fills all the room the counts leave free. A
view's header carries no button; a card's way out is its tap line — every card
ends on one ("Tap to close", "Tap outside to close") — and ESCAPE: no card
carries a cross. The one branch: a game with no `web.meta` has no band, so
its views keep a home button — there is always exactly one way home, never two.
**The bottom-right corner belongs to the ROUND**, which is the one surface with
nothing else on it: options, help and the way out.

What a view brings:

- **the game's own backdrop** — the painted scene the motor already put on the
  intro (`CONFIG.art.backgroundPhone`, see
  [The painted artwork](#the-painted-artwork)). The menu keeps the picture and
  drops the motor's generic scrim for its own, which is cut for this layout — a
  band under the title, a band down the right edge where the entries are. A game
  with no artwork falls back to a picture it embeds itself (`ASSETS.images.bg`)
  and then to the gradient its SKIN paints the game view with, read off the page
  and re-anchored to the 720×1280 frame. Nothing of the world is drawn — no
  entity, no `Game.reset()` — so a menu cannot break on what a game does
  outside a round.
- **the empty bands are the same scene, wide** — on a window wider than the
  portrait frame, `packages/frame-web/frame.css` paints
  `CONFIG.art.backgroundDesk` across the whole page, so a desktop shows one
  picture with a phone standing in the middle of it. Web target only: a playable
  runs in a fixed portrait iframe and has no band to fill.
- **the game's own music, in full** — `web.music` names a track of
  `assets/audio/music/embed/` and the web build ships the whole of it as a
  cached file, in place of the short cut `ASSETS.sounds.music` embeds for a
  playable. Same track, different amount of it: a playable downloads its bytes
  before it can show anything, and has neither the biomes nor the menus that a
  three-minute bed is cut into sections for.
- **the game's own type** — `web.font` in the manifest names one family of
  `assets/motor/font/` (six, all OFL), which the builder embeds in front of the SKIN
  with two tokens: `--web-font` and `--web-fw`, the weight to ask for (a
  single-weight face stays at 400 instead of being smeared into a fake bold).
  Embedded, never fetched, and playables ship no font at all.
- **the display sizes are measured, not re-tuned** — the intro title, the end
  title and the end score are `nowrap` and scaled down until they fit the
  frame. The motor's px were eyeballed against the system stack, and a face
  changes every width (Orbitron's digits +24%, Bebas Neue −40%): "OUT OF
  PULSES!" is 914px of a 624px band at 96px in Orbitron. The fit iterates
  because `letter-spacing` is a fixed px value, so width does not scale with
  size. Nothing to hand-tune per game, per language or per face.
- **the title, breathing** — the SKIN's own `#intro-title`, wrapped in a node
  the webshell animates, so a title look that carries its own `transform` (see
  `lab/game-title.html`) is untouched.
- **the menu bottom-right**, one entry per line, flush against the right edge:
  **PLAY / LEADERBOARD / OPTIONS / HELP**. PLAY *is* the motor's `#btn-start`,
  restyled — which is what keeps `startGame`, the SPACE key and the audio
  unlock gesture exactly as they were. LEADERBOARD opens the **ranking view**
  — two tabs until an online board exists: RECORDS, one screen with no scroll
  (the summed best score of every level under the trophy, the player level,
  stars, stickers and levels cleared, the climb's figures opening LEVELS on a
  tap) and LEVELS (level 0, the thirty in their bands, the endless star),
  both ending on the line that says online rankings come in a future update;
  the other two open **cards**, and the title screen is the one surface that
  lists them as entries because a front door lists what is behind it.
  **A game with a VILLAGE shows none of it**: the hub already draws every door
  as a building, so the title screen is a SPLASH — the logotype on the game's
  own scene, the studio signature in the corner, two seconds of it, and then
  the village opens itself. The entries are still BUILT and simply hidden:
  `#btn-start` is the node every binding of this shell rides on, and the
  village is what it opens (`packages/webshell/menu.js`, `splash`).
- **a game with several modes gets one more entry per mode**, under PLAY, from
  `web.modes` in its manifest — an ordered list of keys whose **first is the
  default**. The shell writes the chosen key to `CONFIG.mode` and starts the
  round the usual way; the game reads it when it resets, and the menu re-arms
  the default on every return, so no path can launch a mode nobody picked. The
  label comes from `web.copy` under `mode<Key>` (`modeClassic`), the key in
  caps otherwise. The motor knows nothing about modes, and a game that declares
  none never sees the field. **No game ships a second mode today**: `radiam`
  declares `web.modes: ["eclipse"]`, a one-entry list that arms `CONFIG.mode`
  and adds nothing to the menu — its timed dial is still in the build, reached
  with `?mode=` for a bench, but the map is what the player gets. An extra entry
  would start a *free* round, so the shell clears `CONFIG.level` and the base
  tuning before it does.
- **a bed over all of it** — the same track the round plays, as its own quiet,
  slower section of the file: `CONFIG.music.menu` in the game, `Music.play` in
  the motor. It starts on the first gesture (nothing may play before one) and
  crossfades into the round's bed on PLAY. A game that names no `menu` section
  keeps silent menus.
- **OPTIONS and HELP are cards, and they open from anywhere** — the title menu
  where there is one, the village's own houses where there is a hub, the bar
  at the foot of every view's sheet (below), and a pair of controls in the
  **bottom-right corner** of a round (`#web-ctls`). The OPTIONS card ends on the **studio signature** — the mark,
  `NEWRARE` and `v<version>`, the same block the motor pins to the corner of
  the title screen out of `CONFIG.brand`. A version number is what a player is
  asked for when a build misbehaves, and a title screen two seconds long is not
  where it can be read. A player standing on the map who wants the music off should not
  have to walk back to the screen they came from, and the rules of the game
  should not live in a panel of that screen either. Two surfaces show no corner:
  the title screen, whose menu lists them, and the score screen, whose own way
  on is the offer and whose corner is where the character lands.
- **OPTIONS is real** — music, sound effects and score callouts are switches the
  motor now carries (`Sound.setMuted`, `Music.setMuted`, `Pop.setEnabled`), the
  language is FR/EN live, and **all the game's data can be erased in one row** —
  the best score, the climb and the meta layer's wallet, collection and daily
  road together (it asks twice, and not from a round). All of it persisted
  through `Store`.
- **the round gets a third control in front of that pair**: the way out. It is
  the difference between a playable, where the round *is* the ad, and a game the
  player owns, and the pictogram is the DESTINATION rather than the door — the
  house, and it leads to the village (the title screen on a game without one),
  never to the map, which is one building of that place. Not in the top band:
  the HUD is the game's, all of it, and the thirteen fill it differently —
  nothing about the round has to move to make room (`--hud-h`, `--cta-h` and
  `Layout` are all untouched). Any card over a round **pauses it** (the clock is
  `Loop`'s, so freezing the loop freezes the world, the timer and the game's
  update at once, and a tab coming back cannot un-pause it): the same options
  rows, or the one question that throws a run away — leaving does not call
  `endRound`, so an abandoned round writes no score. ESCAPE is that pause on a
  keyboard.
- the how-to-play demo moves into the Help card (the motor's own node, moved
  not copied, so a SKIN's dressing follows it — and handed back while the card
  is still in the document, or `getElementById` loses it), and the end screen is
  rewired to
  **PLAY AGAIN** / **MENU** — three icons and a level's own title once the game
  declares `web.levels`, which all thirteen do (next bullet).
- **a game that declares `web.levels` gets the LEVEL MAP instead**, and PLAY is
  what opens it: thirty levels on a forking road, the stars each was cleared
  with, one objective per level lerped out of the ranges the manifest names.
  `packages/webshell/levels.{js,css}` is the screen, `prog:<slug>` is the save,
  and the end screen becomes the level's: the title reads **SCORES** or, on a
  missed objective, **ALMOST** in red, and the buttons become three icons —
  **the map**, **the level again** and **the way on**. The round decides which
  of the first two shines (three stars lights the map, no star lights the
  replay, one or two leaves both plain); **NEXT is never dressed**, because a
  third contender in that argument makes all three quieter. It is
  `last.level + 1` and nothing cleverer — the map is where a fork is chosen —
  and it is HIDDEN where there is no way on: a free round, a round that missed
  its objective, or the last level. The third button is the shell's own node
  and not the motor's: a playable has no next level and the motor must not
  learn what one is.
  At 90/90
  every road turns gold, a star above level 30 starts an endless run, and the
  title screen takes a golden veil. **Under level 1 there is an optional level
  0**, dashed and joined by a dotted spur: it starts no round and earns no
  star — it opens the shell's own Help panel over the map (the menu hands it
  over on mount, so there is one help screen and not two). A board that has
  never been played opens on it; everything else is unchanged, level 1 included.
  All thirteen games declare a `web.levels` block today. The
  motor's only share of it is `onResult(fn)`, a filter over a round's result,
  `Loop.rate(k)` and `onOutro(fn)` — the beat between the round and the end
  screen, with the loop still turning for it, which is what a slow motion needs
  and an end screen cannot give. The stars become the level's without a line
  changing in any `game.js`. **The round wears its three stars live**, in a pill in the
  **bottom-left corner** (never *in* the HUD, whose top band is the game's) —
  mirroring MENU / OPTIONS in the opposite one. Neither corner takes a band out
  of `Layout`: a game draws through them and anchors no instrument and no word
  there. A game whose own layout owns that corner moves the pill from its SKIN
  with `--lv-hud-bottom` / `--lv-hud-left` (`games/slipdeck`, whose five-card
  hand fills the foot of the frame) — and `games/arcider` moved its shield rail
  and speedometer to the right flank instead. **The third star ends the
  round**: slow motion down to 12 %
  over ~0.6 s, then the end screen, because a player who has maxed a level
  should not have to die to be told so. **Every other ending gets its own outro
  too**, on the same hook: one or two stars ease the world down and say nothing,
  a missed objective turns the frame red and burns fire up from the bottom edge
  before the screen that reads ALMOST. A game refines that with three optional
  hooks — `Game.levelProgress()` (what the objective is measured against; the
  HUD score otherwise), `Game.levelStars(stars, value)` (a CAP over what those
  bands pay, never a promotion: `games/arcider` is a race, so the third star
  is the chequered flag taken in first place and a run that never reached it
  is worth one) and `Game.levelWon()` (how it ends its own round, so the end
  screen keeps its stat rows). `Game.levelTally()` goes further for a round won on objectives rather than a
  quantity: it IS the star count, 0 to 3, and replaces the bands
  (`games/stratideck`: the flag, no wound, a prisoner). See [docs/LEVELS.md](docs/LEVELS.md).
- **a game that declares `web.meta` gets the META LAYER on top of that** — a
  wallet, a collection and a reason to open the game tomorrow. It is what the
  map sends a cleared level's score to, AT THE PLAYER'S OWN LEVEL:
  **14 800 pts → 14 coins, × the level** — a sum the end screen writes out in
  three beats (`+14 × Lv 3 = +42`) rather than a total, because the level is
  the one term the player owns; xp stays on the flat rate. It is written as
  its own gold line under a score that STAYS on the screen and paid by a cascade
  of coins that empties THAT line into a wallet pinned in the corner — which
  writes the figure a third time when the last coin lands — plus the score on
  the FLAT rate in xp, which is the player's own level and the bar the map's
  header carries. `packages/webshell/meta.js` is the
  state, `album.js` the collection + the gumball machine + the shop, `daily.js`
  the **daily road**, which is a LINE OF THE MENU between the map and the
  collection and not a banner over the title — and a BUILDING on the hub where
  the game has a village, which is every game that has one: the door then
  opens the STRIP ITSELF as a card over the hub (`DL.openRoad()`), and the tap
  on a day inside it is the tap the road has always answered. It has no
  ends: today sits in the
  SECOND column, the days still to come run past the seventh and into the week
  after, and the frame cuts it on both sides — a day passing SLIDES it by one
  pitch. The second column and not the first because the node to its left keeps
  **what the last claim paid** — the sticker, the coins, the xp — greyed, beside
  the box about to be opened. The rail is solid and gold behind, dotted in
  front, the days stand ON it. **The road is the calendar and only counts up** —
  day 7 is followed by day 8, not by day 1 — and **a day nobody opened stays on
  it behind them, greyed and struck through**, still showing what it would have
  paid; the run no longer resets. **Every day ahead wears its own reward, not a
  question mark**: the week is a LADDER (xp, coins, ticket, xp, coins, a gift,
  then a STARRED gift that pays ×5 on all three boxes), the kind is promised and
  only the amount is kept back, and the painted box means a gift day and nothing
  else. The three small days open the prize card straight onto their reward —
  a choice between three identical things is not a choice. **Every day answers a
  tap**: today's pays, a day ahead opens a NEXT GIFT card (what it will hand
  over, at full size under a padlock, named, `×5` on a starred one, and how far
  away it is), a day behind opens ALREADY COLLECTED — the reward greyed and its
  figure, no sentence — or MISSED. Only today's is in
  the tab order. A reward card is **dismissed by tapping it anywhere** — never
  the three boxes and never the ad, because a tap must not stand in for a
  choice. **Collecting flies the reward into the chip that holds it** — coins,
  tickets, the level bar, or the album's door for a sticker — and the chip
  counts up on the landing, because a number that changed behind a blurred
  card changed nothing the player saw. **It carries no words at
  all** — a heading there would read as a third menu entry; what it is and which
  day of the run it is are the eyebrow of the card the tap opens. THE GIFT
  PLAYS WHERE A WALLET IS ON SCREEN, because coins flying into a band that is
  not there land nowhere: on a village that is the hub the player is already
  standing on — the road card steps aside and the boxes take its place, and the
  map is never involved — and on a game with no hub the tap does what PLAY does
  and opens the LEVEL MAP under it. On `localhost` it pays on every tap, and
  the wallet band says so with a DEV pill in front of the level chip — the one
  DEV pill the front end draws. `meta:<slug>` is the save, kept
  apart from `prog:<slug>` because the two are written on different screens —
  OPTIONS erases both in one row.
  **Twenty stickers a game**, counted `x/20`, **a tile's border its rarity**, an
  unowned one drawn as its own white silhouette, titled `???`, and told in the
  IMPERATIVE what to do to earn it (a sticker owned says what was done; a
  sticker's NAME is never translated — it is a proper noun) — **twelve of them earned off
  the map** (a band passed, a band passed clean, the board, ninety of ninety →
  the shiny one) and the rest out of the machine, **one to five tickets a
  pull** — more tickets in one pull, better odds, shown as four bars that move
  with the bet before a ball does, and **the legendary row is a dial rather than
  a weight: one ticket is 1%, five tickets are 5%, exactly**, which also means a
  game must leave one legendary OUT of `awards` or the machine can never roll
  one — with doubles sold back in the shop for coins that buy the next ticket.
  **A sixth pill on that row is the SUPER TICKET**: fifteen ordinary tickets'
  worth of coins for one pull, and **four numbers that never move — legendary
  30%, epic 25%, rare 20%, common the rest**. Its tiers are PINNED where the
  five bets beside it share out a pool, and that is what it is sold on: the
  ordinary odds drift with the board (the same five tickets read 47/33/16/5 on
  a fresh one and 33/52/10/5 once the map has paid its milestones in), and a
  premium pull that drifts is not a promise. An empty tier hands its share
  back so the four still add to one. It branches inside the same `chances()`,
  the one function the readout and the roll both go through. It is its own
  currency (`save.st`) and it has **no chip in the wallet**: the wallet is
  what can be spent anywhere, and this is spent in one place — the shop card
  it is bought on and the pill it is spent from are where it is counted.
  **The shop around it is a grid of six tiles** — the ticket, the super
  ticket, a mystery gift (the three boxes, which never pay coins), an xp pack
  priced at the player's own level, and two boosts counted in ROUNDS and never
  in minutes (double coins on the next round, double xp on the next three) —
  plus, over the grid, a missed day of the daily road, caught up for a week at
  a share of its average worth. Every price is derived from the ticket or from
  the rates a round pays at (`packages/webshell/meta.js`, section 1).
  The wallet's two chips are the doors to the shop, here as on the map — and IN
  the shop only the blue one is a door, back to the album, because the gold
  one's door is the screen it is standing on; there is
  no GET TICKETS button, because a button that only exists once the wallet is
  empty teaches nothing before it is. **Every number that moves in a chip moves
  through one engine**, `Meta.fx` — the end screen's cascade, a reward flying
  out of its card, a purchase, a price, a shelf of doubles sold — so a screen
  that pays says so the same way every other one does (see
  [docs/META.md](docs/META.md)). The album is **the machine over the shelves**:
  the machine and the bet in a band at the top, then one shelf per rarity, and
  every shelf **opens on its own odds read against ONE ticket** — a track
  notched where a single ticket stands, the gain the bet buys hatched past it,
  the chance in a pill, the rarity and its count in the shelf's corner — so
  "more tickets, rarer stickers" is read before a ball moves
  (`lab/sticker-album.html`). A sticker the player has never had arrives on a flash, a shockwave and a
  plated gold NEW tag; a double **burns off** — embers out of a lava glow and a
  tag that whispers. **Neither card closes itself and neither sells anything**:
  a tap anywhere puts it away, and the one control left is DRAW AGAIN wearing
  the ticket and what the pull costs — gone entirely when the wallet cannot pay
  for it, since a control that cannot act is a wall. A perfect
  round is offered three gift boxes ON THE ROUND ITSELF — the outro holds the
  world in slow motion under them, so the end screen arrives with the prize
  already in the wallet — and then one ad to pay **×5** what was in the one it
  picked, offered on a button that NAMES WHAT IT MULTIPLIES and follows with
  the price — `MULTIPLY YOUR COINS` and the shell's painted ×5 plate finishing
  the sentence, `watch an ad` under it at the size a price is read at. It is the
  card's ONLY control: the arrow beside it was a button for what a miss already
  does, since a tap anywhere else — and ENTER, SPACE or ESCAPE — collects the
  gift as it stands, and one footnote line says so. A sticker is redrawn rather
  than multiplied, so that one says *one more* and wears no plate. Walking past
  it goes STRAIGHT to the end
  screen: the token flies into a wallet that is a layer over the frame, so
  nothing has to wait for it, and holding the outro for the flight showed a
  second of the frozen round with nothing on it. Five and
  not three because the plates the shell ships are x2, x5, x10, x20, x50 and
  x100: an offer the player can SEE is worth more than a smaller one they have
  to read. A round with a star is offered the boxes FOR an ad on the end screen;
  a round with none is left alone. **The rewarded ad is a placeholder that says so on
  screen** — the web target has no SDK, and wiring one in is replacing the body
  of `Meta.ad`. What the player carries is **one band over the top of the
  frame**, the view system's rather than any screen's
  ([docs/VIEWS.md](docs/VIEWS.md)): the level, the coins, the tickets and the
  board's stars on one line, up on the map, the collection, the shop and the
  ranking, down on the title screen, and on the score screen only while a
  reward is flying into it. **All thirteen declare it**; a game is a sheet of
  twenty stickers and a manifest block, whose rates are scaled to what that
  game scores. See [docs/META.md](docs/META.md).
- **a game that declares `web.army` gets the BARRACKS on top of that** — the
  cards the player OWNS, and what a battle costs them. A round that deals a
  fresh random deck every time has nothing at stake; this makes the deck the
  player's and then gives a fight a price. Every card is two numbers read in
  that order — a **grade** and a **tier** (`E D C B A S`, the collection's own
  rarity ladder with one step under it) — and the tier settles a fight between
  two equal grades, so the one DRAW left in the game is two cards that match on
  both. The tier GAP is what the fight costs: the loser's tier standing above
  the winner's **WOUNDS** the winner, which takes the cell, pins the card in its
  hand slot for a turn and sends it to the INFIRMARY for two real days; the
  winner's standing above the loser's leaves the loser **STANDING**, and a won
  battle offers one of those as a PRISONER, who turns after five real days and
  then enlists. The wound is bought out with the shell's rewarded-ad
  placeholder, because a player whose three best cards are in bandages has
  nothing to do for two days, which is not a mechanic; the prisoner's five days
  and a squad's mission are not, because a wait that blocks nothing is the
  reason to come back. Four more doors on the
  hub — DECK, INFIRMARY, PRISON and the CAMP — and every one of them is a VIEW
  and not a card, because each is a place with a list to manage and a screen a
  stray tap can close is not a screen anything is composed on. The camp has four
  tabs. RECRUITS spends the meta layer's own coins and never sells the three
  specials: a spy, a scout and a sapper are ANSWERS to something, and a tent
  that sold them would be selling the solution rather than the army. MISSIONS
  sends a squad of two to five cards away for 4 to 48 real hours on one of
  `web.army.missions.list` (fifty scenarios), on odds the squad's grades and
  tiers decide and the briefing prints live; the squad is out of every battle
  until it is back, the outcome is drawn at the departure, and it comes back
  with a report written in the scenario's own words — what it paid (coins, xp,
  tickets, a sticker, an officer) or what it cost (wounds, cards lost, coins).
  CAMP holds five posts (infirmary, prison, formation, missions, camp), filled
  with the deck's own picker — a card at a post is out of the deck, the squads
  and every battle — over the roll of every card the camp holds and what it is
  doing; REGISTER lists every card lost, with where and when.
  The layer says exactly one thing
  to the game — `CONFIG.army.deck`, read fresh by `Game.reset()` — and the
  battle hands back exactly one thing, `result.army`, which rides on `endRound`
  like the game's own stat rows; the motor knows none of it. A deck short of
  cards is filled with CONSCRIPTS rather than left short, since a battle the
  player cannot start is a closed door and not a cost. `packages/webshell/army.js`
  is the layer, `save.ar` inside `meta:<slug>` is the save, and `games/stratideck`
  is the one game that declares it. **Every card is a person**: `web.army.cast`
  names one officer per army, grade and tier (120), whose name, age, gender and
  lore are read on the back of the card, and whose portrait is cut four to a
  sheet by `tools/lab/cast-sheets.mjs` — plus each red officer again in the
  blue uniform, for a prisoner who enlisted (180 portraits); web-only, never
  preloaded (`CONFIG.artLazy`). **And every officer is ONE person**: the camp
  never holds the same one twice, whatever door they came through. A card
  played in a battle, sent on a mission or holding a post counts a service,
  and a victory rolls it up one tier (about one chance in five,
  `web.army.promotion`) — the face climbs, the portrait and the back of the
  card keep the tier it was raised at, and a card says so on a PROMOTION card.
  A card lost is written in the register with its cause, told once on an IN
  MEMORIAM card at the village, and the tent may find it alive again. See
  [docs/ARMY.md](docs/ARMY.md).

**A game that declares `web.village` gets the VILLAGE**, a view between the
title screen and the map, and it is the place the player lives:

```
title  ->  VILLAGE  ->  map  ->  round  ->  score  ->  VILLAGE
```

The title screen becomes a **SPLASH**: the logotype, the signature, two seconds
of them, and then the village opens on its own — the stacked menu in front of a
hub was the same list twice, read at speed by a player on their way somewhere
else. **PLAY is still the way in** and nothing about it moved: `#btn-start` is
hidden rather than dropped, the SPACE key opens the village from the splash,
and asking for a view already standing peels back to it instead of stacking a
second one, so the button and the timer can never disagree. From there the map is a BUILDING, and so are the
collection, the shop, the ranking, the daily road and the options: the painted
hub of `assets/image/master/<slug>-background-home.png` with the game's own
houses standing on it — **and the shop and the collection stand on that same
picture**, because they are rooms of this place rather than screens over the
round's backdrop, composed in `make village` (see [The lab](#the-lab)) and
read out of `CONFIG.web.village` by `packages/webshell/village.{js,css}`.
**Everything downstream then points back here** rather than at the map or the
title — the band's house chip (`View.home`, whose base view this is, and which
is gone from the band while the village stands bare), the end screen's first button, and the
ESCAPE that walks all the way out. The title screen becomes the front door a
player comes through once a session, which is what a front door is. It never
touches `#btn-start`: the motor's start button stays where the motor put it and
menu.js binds it to this view, so `startGame`, the SPACE key and
`Sound.unlock()`'s user gesture are the ones they have always been.

**The manifest says HOW a house announces itself and the shell says WHETHER.**
**A house moves and a house is lit, and they are TWO fields.** `notify` names
what the BUILDING does — `float` (it hangs above its own light), `breath` (it
swells out of its feet), `alert` (two hops and a wobble, then a long rest — the
rude one, for one house at a time) and `fade` (it goes and comes back, down to
a ghost and never to nothing, because a door that vanishes is a door nobody
finds again) — and `light` names what its HALO does: `blink` on a beat,
`flicker` like a failing tube, `random` on one long uneven cycle. A mill
turning over a flickering pad is one of each, which one field of seven could
not say. **A fifth pulse is not a signal at all**: `cloud` is WEATHER — it
carries the object across the whole frame while it breathes and hazes, three
motions at once on three rhythms divided out of the one number `every` names
(the crossing, then it over 7 and over 5, coprime so they never come back into
phase). `every` runs to **ten minutes** here and to a minute everywhere else,
because a crossing is not a beat: a house that hopped once every ten minutes
would read as broken, and a sky that crosses in ten seconds is a flock of
birds. Two fields exist for this pulse and no other — `drift: "right"` sends it
east instead of west, and `breathEvery` puts the vapour on its own clock when
it should work faster than the wind carrying it. It is what the three shared
cloud sheets are for, it wants `always` because nothing is ever waiting behind
a cloud, it should carry no halo (light lying on a pad is the ground's, and a
cloud has no pad), and a crossing that names no `delay` starts part-way through
so the sky is never empty. Each carries its own two numbers — `every` / `delay`, `lightEvery` /
`lightDelay` — where the first is how long one turn takes and **the second how
late it starts**, which is what keeps two houses wearing the same pulse from
beating as one object; that is a composer's judgement, so it is written per
house rather than derived. `badge` names where a number sits, and **a badge is
about the NUMBER**: the collection counts the tickets that pull the machine
(ordinary plus super), the shop the sticker copies it would buy back, the daily
road today's gift, the map a board nobody has opened. Not "is there something
there" — a boolean written into a badge is the word "true" standing over a
house. Neither half guesses the other —
**except where the house declares `always`**, which takes the question away for
both fields at once: that one runs because the composer wanted a building that
moves, a beacon or a mill or a light that comes and goes, and it never waits on
the meta layer for permission. Its badge still answers to what is waiting,
because a number is about the number.

**`layer` is the composer's hand on the painter's order.** The houses are drawn
in the order the manifest lists them, sorted by `layer` first and by the FEET
inside it: a house whose feet are lower is in front, which answers it on its own
for everything standing on the ground. A cloud does not stand anywhere — its
feet are up in the sky, which would put it behind every roof — so `layer` is a
whole number, absent from almost every house, that says which plane it is on. It
stays a **sort key and never a `z-index`**: a z-index would make every house its
own stacking context and take the halo out of the ground's light
(`packages/webshell/village.css`).

**A house's halo carries its own colour**, `halo.color`, and a house that names
none inherits the game's accent as every village did before it: a hub is a
painted scene with its own lamps in it, and one accent under six buildings
makes them read as six copies of one object. **The cheapest building is
`art: "empty"`** — a box with no picture in it, laid over a lamp the hub was
already painted with, carrying a halo, a badge and a door and drawing nothing.
It is the one `art` that is not a role the game adopted.

**The words are the player's, and they are off.** Every door wears its role's
own name under its feet and every one of them is hidden, because a village is
meant to be read as a place and six plates over six buildings turn it back into
the list it replaced. One row in OPTIONS brings them all back at once
(`Settings.labels`, persisted) — it is not a field of the composition, since a
village where three buildings were named and three were not is the worst of
both.

**The scene is not a photograph: the light BREATHES.** `life.cycle` passes the
hub through its own painted light, out into `warm`, back through it and out
into `cold`, over `seconds` (two minutes by default) — and it is a CYCLE rather
than a clock. Reading the player's real hour was the first answer and it was
the wrong one: a difference nobody can SEE, because nothing moves while they
are looking at it. A slow Ken Burns on the ground was the second, and it went
for the opposite reason — the houses are placed in the design space and do not
move, so a drifting backdrop under fixed buildings reads as the picture
sliding. **Whatever moves here has to move all of it**, and a breath does: the
brightness is on the ground and the tint is laid over the HOUSES too, in
`soft-light`, because light that stops at the buildings is a filter on a
picture. It passes through ZERO twice per cycle, which is where the hub is
exactly as it was drawn. All of it is keyframes — no clock, no interval, no
formula in JavaScript — so the cycle watched in the lab page is the cycle the
player gets.

**A door nobody built mostly does not matter**, because the band over this view
is already the way to the ranking, the shop, the collection and the map, and
**HELP is the map's** — level 0 opens it on every board, so a house for it would
be a second way to one place and six buildings is what a sheet holds. The one
hole worth plugging is OPTIONS, which nothing else carries, and where it is not
a building it is the corner control it is on every other screen
([docs/VIEWS.md](docs/VIEWS.md)). A game with no `web.village` keeps the menu it
has today, byte for byte. Today `chainring` is the one village composed; the
artwork is cut and adopted for all thirteen.

It reads `window.__WEB__` — a plain list of motor references, never behaviour, so
the motor knows nothing about the front end. An *online* leaderboard and
progression are still `packages/meta` (phase 5); the score shown is the one the
motor has always written on `endRound`.

The web menu is **bilingual FR/EN**: the strings live in `packages/webshell/menu.js`
and the language is the player's own choice in OPTIONS (persisted, and it wins),
then `?lang=` (the site passes its own choice to the iframe), then
`CONFIG.web.lang`, then the browser. Changing it rewrites the screen instead of
reloading it. A game overrides any string — its tagline included — from a
`web.copy` block in its `manifest.json`, which the builder injects as
`CONFIG.web`; there is no second place to write game copy, and
`web.copy.fr.tagline` is where a game's intro sentence is translated, its key
words and their `<b class="w-…">` classes included.

**The game itself is translated in the same block**, by
`web.copy.<lang>.strings` — a dictionary whose key IS the English string a game
writes, so there is no key to invent and a missing entry falls back to the
English. The motor applies it where it WRITES a word (`CONFIG.copy`, `Pop.show`,
`Pop.text`, `HUD.setLeft/setRight`, `endRound`'s title and rows), which is why
no `game.js` had to change for the round, the HUD and the end screen to switch
language with the menu. The one thing a game does itself is the string it
BUILDS: `"x" + mult + " streak"` reaches the motor already assembled, so the
game wraps its own literal — `Lang.t(" streak")` — and the same goes for
anything it paints on the canvas. **`make text` is the gate**: it prints
`N untranslated` per game and a game is done when it reads *fully translated*.
See [docs/ENGINE.md](docs/ENGINE.md#lang--the-game-in-the-players-language).

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

## The painted artwork

Every game ships six pieces of painted art, and **a file name is the whole
declaration** — no manifest key, no `ASSETS` edit, no per-game wiring:

| `assets/image/master/<slug>-…`       | where it is used                                                     |
| ------------------------------------ | -------------------------------------------------------------------- |
| `-background-phone.png`              | behind the intro and the end screen — **never behind the round**     |
| `-background-phone-<name>.png`       | the same, one per band of the climb (`echomaze`, `radiam`)           |
| `-background-desk.png`               | the bands around the frame on a desktop window (**web target only**) |
| `-background-home.png`               | the ground the VILLAGE stands on (**web target only**)               |
| `-title.png`                         | the logotype, replacing the app icon **and** the CSS `#intro-title`  |
| `-character-{sad,neutral,happy}.png` | the end screen's face, picked by the star count (0 / 1–2 / 3)        |
| `-object-<name>.png`                 | a **sheet to cut**, never a role — below                             |
| `-sky-<name>.png`                    | a panorama a game draws on the canvas behind its round (`arcider`)   |

**An OBJECT is not in there.** `assets/image/master/` holds what a game owns
outright plus the raw sheets; every object cut out of a sheet — the decor pool,
radiam's beads, the album's stickers, slipdeck's court cards — lives in
`assets/image/object/` and is named by the game in `art.objects` of its
`manifest.json`, because a folder of cuts cannot say which of two files with the
same shape of name is the one that ships (below).

**One prefix belongs to no game.** `assets/image/master/game-object-*.png` is a
sheet the **web shell** owns, and there are several — the gift boxes the daily
strip and the three-box ceremony draw, plus the shell's **instruments**: the
coin a wallet counts, the ticket it spends on a pull, the bolt an xp bar fills
with, the star a level is cleared with, the trophy a finished board earns, the
four-leaf clover the collection is counted with, the plate that says a
seventh day pays five times over, and the hand the Help card acts a gesture
out with. Those were stroked pictograms
and a stroked pictogram reads as a tool's chrome; the web shell is a game. A
cut is **renamed** in `SHELL_CUTS` and the rename is the declaration —
`reward-08` says nothing, `coin` is what the shell draws — and five of the
roles are the names `menu.js` already calls its pictograms by, so `icon("coin")`
finds the painted piece and falls back to the stroke in a build with no
artwork. One swap, and the wallet, the shop, the album, the daily road, the
level map and the end screen's three stars turn painted together. It cuts like
any other sheet and it
cannot be adopted (there is no manifest to write the choice into): the shell
names its own pieces in `SHELL_CUTS` of `tools/lab/encode-art.mjs`, they land
in `assets/image/shell/` rather than `assets/image/embed/`, and the builder
injects them as `CONFIG.shellArt.<camelRole>` on the web target only. Same
shape as `assets/image/brand/newrare.webp`, the studio mark every title screen
signs itself with. Nothing may ever be called `game`.

**Not every sheet under that prefix is the shell's, though, and the second kind
is SHARED MATERIAL** — scenery no game owns and any game may use. The three
cloud sheets (`game-object-cloud-{big,flat,haze}.png`, 22 cuts) are the first
of it, and they exist for the village's sky. A cloud is not the shell's: it
stands on ONE village, at a place that game chose, so it is adopted exactly
like a cut of the game's own sheet — `art.objects` →
`assets/image/embed/<slug>-<role>.webp` → `CONFIG.art.<camelRole>` — and only
the villages that place one carry the bytes. **The role is the cut's own name
with the prefix taken off**, so `game-cloud-haze-03` is `cloud-haze-03` in all
thirteen and there is nothing to invent. It is a `decor` house like any other,
and the village's z-sort by the foot of the object puts a cloud dropped high
behind every building on its own. Adopt it by clicking it in the SHARED CUTS
palette of `make village`, or
`node tools/lab/cut-objects.mjs game-object-cloud-haze --adopt 3,6 --into <slug>`
— `--into` is which game, and a sheet the shell names in `SHELL_CUTS` refuses
it. Clouds are **web-only** art, for the same reason the houses are: the
village is the web menu's own view.

`assets/image/master/` is the **master**: what came out of the image model, up to
2172 px and ~2 MB apiece, 121 MB in total. It ships nowhere. The shipping cut is
`assets/image/embed/`, WebP sized for the 720×1280 design space, ~35 KB a piece and
~270 KB of base64 per game — which is what makes painted screens fit inside the
5 MB creative at all.

```bash
node tools/lab/encode-art.mjs             # every game, skipping what is fresh
node tools/lab/encode-art.mjs vipera      # one game
node tools/lab/encode-art.mjs --list      # what would run, and why
```

**`assets/image/embed/` is committed and the build never encodes it** — same contract as
`assets/motor/font/` and `assets/audio/sfx/`: a shipping-ready input, not a build output.
Encoding needs headless Chrome (~1 s an image), and `tools/update.mjs` has to
stay fast. Run `encode-art` when the artwork itself changes, then
`tools/update.mjs`.

The builder injects what it finds as **`CONFIG.art.<camelRole>`** — a data URI in
the single-file builds, a hashed file in the split site build, with nothing
target-aware in the art itself. `packages/shell/shell.js` (the `Art` module)
puts the background, the logotype and the character on the screens; a game that
wants to draw one of its own files on the **canvas** reads it from `ArtImages`
(`games/slipdeck` paints `ArtImages.cardKing` into its court cards). Adding a
new kind of art is adding a file: `<slug>-<name>.png` becomes
`CONFIG.art.<camelName>`.

The two rules that hold this together:

- **The artwork is not drawn behind the round unless a game asks.** Most
  gameplays are balanced against the flat ground their SKIN paints, and a
  picture under the world costs them contrast. A game whose world reads over its
  scene sets `CONFIG.sceneArt = true` and then stops painting its own opaque
  ground, asking `Art.scene()` in `render()` — `chainring`, `slipdeck`,
  `marshmelt` and `radiam` are the four, and each of them replaced a purely
  decorative ground (a radial gradient, a felt fill, a pre-rendered cavern, a
  wall of gears embedded as a JPEG). `radiam` is the one whose scene changes
  per band, so its round wears the world it is playing. It is a CSS
  layer under the canvas, so it costs nothing per frame; the scrim over it is
  the `--scene-scrim` token a SKIN can raise. See
  [docs/ENGINE.md](docs/ENGINE.md#configart--the-painted-artwork).
- **Four of those cuts are the decor pool, and the shell places them itself.**
  A cut adopted with `--as decor` takes the role `decor-NN` and reaches
  `CONFIG.art.decorNN` like any other picture, and `Decor` — a module of
  `packages/shell/shell.js` — scatters one to three of them over the end
  screen, the round's corners, the web menu's panels, the pause card and the
  level map. **A game names none of them and calls nothing**: the pool is
  whatever `decor*` keys exist. Three pieces on a screen is the ceiling, every
  piece bleeds off an edge, none of them takes a tap, and the round's are worth
  a fifth of a screen's opacity because that is the one place a picture sits
  over a live world. `CONFIG.decor = false` turns it off,
  `CONFIG.decor = { round: false }` keeps the screens only. See
  [docs/ENGINE.md](docs/ENGINE.md#decor--the-games-own-objects-on-the-screens).
- **A sheet of objects is material, not a role.** An image model asked for a
  gear returns a wall of sixteen, so `assets/image/master/<slug>-object-<name>.png` is
  a **sheet to cut**: `encode-art.mjs` skips it and
  `node tools/lab/cut-objects.mjs <slug>` takes it apart into
  `assets/image/object/<slug>-<name>-NN.png`, one transparent PNG per object (577 of
  them across the thirteen games). **Nothing ships from there until the GAME
  names it**: `--adopt 1,4` writes the role into `art.objects` of
  `games/<slug>/manifest.json` — `"gear01": "radiam-gear-01"` — and from there
  the usual pipeline gives `CONFIG.art.gear01`, `ArtImages.gear01` on the
  canvas. Adopting moves no file and copies none: a cut exists once, and the
  choice is a line in the game rather than a second name on disk, because
  `radiam-ball-blue-01.png` ships while `radiam-ball-blue-09.png` beside it does
  not and no rule over names can tell them apart. The adoption is manual on
  purpose: every file under `assets/image/embed/` is embedded in every build of
  its game. **`--grid 5x4` is what several sheets of the same
  picture need** — the cuts are ordered by AREA otherwise, and a recolour whose
  halo is a few pixels wider silently reorders every index after it; with a grid
  the CELL is the identity, so object 7 is the same design in all six sheets.
  `games/radiam`'s bead is that case: twenty designs in six colours, one style
  per pair of levels. See [docs/ASSETS.md](docs/ASSETS.md).
- **The store listing images are made from these pieces too.** A capture, the
  character, two or three adopted objects, the logotype and one punchline out of
  `store.copy` in the manifest. `lab/store-card.html` is where one is composed
  by hand — two layers, every piece dragged onto the card and placed on a
  magnetic grid, the tagline included: it is a palette tile like the rest, its
  line is picked by number out of the manifest and **never typed**, and one
  Save writes the card in both languages. Saved as a layout in
  `lab/store-presets.json` and written straight into
  `assets/image/<store>/{en,fr}/` (`make store`);
  `tools/lab/shoot-store.mjs`
  is the batch, and it shoots a game with its saved layout when it has one. See
  [docs/ASSETS.md](docs/ASSETS.md#the-listing-images-come-from-assetsimagegoogle-and-assetsimageitch).
- **Never create the artwork.** Like the app icon, it is the user's. A game
  without it degrades on its own — the icon comes back, the CSS title comes
  back, the end screen keeps its flat tint — so never generate, draw or embed a
  placeholder.

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
- **English in the file**, like everywhere else in the repo, and **normal
  case** like everywhere else too — a debug line reads `Max height`, not
  `MAX HEIGHT`. A prototype has no design to protect, so it does not carry an
  `upper()`: what it writes is what it shows.

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
`icon-card.html` composes an icon, `game-title.html` is a rack of ready-made
`#intro-title` looks — one pick per game, rendered in that game's own name and
palette, exported as the CSS block to paste into its SKIN,
`gacha.html` is the rack of **sticker-draw ceremonies** — eleven ways to hand
over one sticker (gumball, gashapon capsule, chest, foil pack, wheel, orb, then
peel, blister, claw, hatch, press), each in the album's own chrome, in any of
the thirteen palettes, with its duration printed beside it because a draw is
watched dozens of times. **The gumball won the first round and it is a physics
sim**, tuned from that page's own knobs (gravity, bounce, ball count and size,
slosh) and ported into `packages/webshell/album.js`. The five added after it
answer the criterion the first six surfaced: **a ceremony that plays the same
keyframe every time stops being watched**, so a candidate now earns its place
by having something that CHANGES (the crack, the cell, where the claw goes) or
by being short enough that repetition costs nothing (`peel` and `press` are
about a second). The ones that stand beside the winner are the record of what
it beat, and the page's header also lists what was turned down and on which
rule — a plinko board, a lottery blower, a slot reel.
`gear-decor.html` draws the cogs `tools/lab/shoot-gears.mjs` shoots into
`assets/image/gear/` as transparent PNGs to lay over a screenshot,
`store-card.html` is the store listing composer — a real frame of play dressed
with the game's own character, objects and logotype and one punchline of its
manifest over it, printed FR and EN at once, in four formats (`phone` 1080×1920 for Play and itch, `desk`
1920×1080 for the Play tablet slot, `thumb` 630×500 for the itch cover, and
`multi`, three phone slots composed as one picture and cut at the seams on
save, so a motif carries from one gallery screenshot to the next). It is
the one lab page with a server of its own (`make store`,
`tools/lab/serve-store.mjs`), because it lists what a game owns and writes the
image it composed into `assets/image/<store>/<lang>/`, neither of which a
`file://` page
can do; `tools/lab/shoot-store.mjs` shoots the same page for the batch,
`game-events.html` is **the bench for what a game says and plays**, and the
list has the two sides that question has: **VIEW** is every `Pop.show`,
`Pop.text` and `Notify.say` of the `game.js` in source order,
grouped into the beat they fire together on; **SOUND** is the background bed with its
`CONFIG.music`, then **one card per clip** — the file of `assets/audio/sfx/` it
is cut from and how long the cut is at the top, and under it every line of the
game that plays it with the volume and pitch that line asks for. The card is the
clip and not the line because eighteen cues in a game are seven clips: one
decision, offered once. The whole folder opens from the file button and
**hovering a row plays it**, trimmed to the cut length — a clip is chosen by
ear, 127 names say nothing, and picking them one at a time to hear them is not
choosing. That list is not a `<select>`, for the same reason: a native popup is
drawn by the OS and fires nothing over its rows. A clip nothing plays has no beat and therefore
no row; the *never played* pill in the header names it, which is the one thing
a separate list of the pack was for. `tools/lab/scan-events.mjs` reads them back, and each row is fired
**inside that game's own web build** through `window.__WEB__`, so a callout is
reviewed with its real style, its real SKIN and its real sample under it. The
stage is the build with its chrome hidden — the painted backdrop and the
overlay layer, no menu, no round, no world.

Every row is editable — the pop's **style** from the motor's twelve, the word,
the anchor, the **file a clip is cut from** and how long the cut is, the volume,
the pitch — and **APPLY
writes the choice back into `games/<slug>/game.js`**: `tools/lab/apply-events.mjs`
re-reads the source and splices the one argument, so a multi-line call keeps its
shape; a changed file is re-cut with ffmpeg (mono 32 kHz / 64 kbps, a 70 ms
fade) into `ASSETS.sounds`, its provenance comment moves with it, and the game's
patch version moves in the same change. **An argument the game builds at runtime
is refused by name, never overwritten**: a word written as `"+" plus the gain` is
previewed with a stand-in, and pasting a stand-in back would break the game, so
the row marks it before the click and the report names it after. Changing a
clip's FILE reaches every beat that plays that key, which is why the swap shows
on all of them, and why they are on the card rather than on each line. A volume,
a pitch and a cut length are **sliders cut into magnetic segments** of 0.05, so
the round values are the easy ones to reach. The snap is applied on the MOVE and
never on the draw: 43 of the catalogue's 340 volumes and pitches sit off a 0.05
grid (`0.32`, `1.45`), and a slider whose `step` was 0.05 would rewrite them the
moment the row was drawn — a change nobody asked for, in a tool whose job is to
write changes back. Apply is the one way a change leaves the page; what a line
hands back on a click is its own `file:line`.

**Every element carries two icons.** *Revert* puts it back where the source has
it. *Trash* deletes nothing by itself — it MARKS, like every other change here,
so a removal is reviewed next to the rest of the plan, counted in the Apply
badge and taken back with the same revert as a typo. On a callout or a cue line
it removes that statement; on a clip's card it removes the clip from
`ASSETS.sounds` **and every line that plays it**, because a game calling a clip
it no longer ships gets silence rather than an error. The statement goes, not
the call: `apply-events.mjs` takes the whole line, and the `if (…)` guard with
it when the guard was only ever there for that call — 259 of the catalogue's 277
calls qualify. Anything else (a line shared with code, a dangling `else`, a
guard that closes a brace) is refused by name, and a `//` comment sitting above
a removed line is left alone and reported, because guessing whether it described
that beat or the block around it is worse than saying so.

**The juice is scanned but not listed.** `Fx.burst/ring/shake/flash/freeze` and
`HUD.punch` are drawn by the frame pipeline, which only turns inside a round, so
a button for them would do nothing; and `Overlay.vignette` is a coloured glow
over the frame rather than a notification — it carries no word, so there is
nothing on it to read, re-style or re-word. `scan-events.mjs` prints all of it,
because it is what holds a beat together.

`village.html` is **the village composer** (`make village`), and what it
composes is a game's TITLE SCREEN drawn as a place instead of a list. It is
**two layers**: the painted hub of
`assets/image/master/<slug>-background-home.png`, and the six **houses** cut out
of `<slug>-object-home.png` — a shop, a podium, a globe, a garage, a showroom, a
crowned board — each one the door to a screen the web shell already has. **No
logotype**: the hub IS the picture the title screen sells, and the drawn title
belongs to whatever screen asks for it later.

A house is placed **by the middle of its base**, because that is where it
touches the ground, where its halo goes, what it turns around and what keeps it
on its pad when it is made bigger; the list is **sorted by that point**, so a
house whose feet are lower is drawn in front and nothing has a z-order to set.
Four grips on the selection — move, turn, size, drop — ride inside the rotation
and are sized in screen pixels, so they stay thumb-sized however far the frame
is zoomed out.

Three signals say three different things and never two: the **halo**, an ellipse
lying on the pad in `screen` — the game's accent, or the colour the composer
picked for this house — says THIS IS A DOOR; the **badge** says HOW MANY; the
**animation** says THERE IS SOMETHING TO TAKE, and it is the one that must stay
rare, which is what the NOTIFY preview is for. That last one is **two controls
and not one**, because a building that is alive and a sign that is lit are not
the same statement and a house may make both: the PULSE is its own section and
moves the house (`float`, `breath`, `alert`, `fade`, and `cloud`, which is
weather rather than a signal — it rode under the badge's heading while all four
of them meant "something is waiting", and that heading said a pulse was a
number), the LIGHT sits with the
halo it works and moves nothing else (`blink` on a hard beat, `flicker` like a
failing tube, `random` on one long uneven 7 s cycle every house enters at a
different point of). It was one list picked one at a time, which meant a mill
could be alive or lit and never both, for no reason but the shape of the field.
A light with no halo has nothing to show and the inspector says so rather than
going quiet; `random` is not random (CSS keyframes are deterministic) and the
composer says that too. **The PLANE is not in the inspector, it is the STACK**
— the panel the right column opens on, and the whole composition read as the
order it is painted in: front at the top, grouped by the plane each object
stands on, so the summary of the planes IS the grouping and nothing counts them
twice. A row selects, which is the only way to reach a house standing behind
another, and two arrows move that object a plane without selecting it. It is
one place and not two because a plane only ever means something NEXT TO the
objects that share it: a slider on the selected house would print a number with
nothing to compare it against, which is what it did until this panel existed.
`layer` is a whole number, sorted before the feet and never written as a
`z-index` — the feet answer the order on their own for everything that stands
on the ground, and a cloud's feet are up in the sky. A house's word is the ROLE'S, taken from the shell's own
strings and never typed, like the store card's punchline — and it is previewed
rather than composed, since in the build the names are a row in OPTIONS the
player turns on.

**Every slider is magnetic**, cut into segments at the round values — 10 design
px for a position or a width, 5° for a turn, 0.05 for a ratio, a tenth of a
second for a beat — and the snap runs on the MOVE and never on the draw, so a
village holding numbers off that grid is not rewritten the moment a house is
clicked. **The grid button IS the snap**: it draws exactly what the hand lands
on, and turning it off turns the magnetism off with it. Every group of sliders
is behind a **chevron**, shut, with its values on the header, so the panel reads
as the list of decisions it is. **Every track is notched at the values its
magnet lands on** — a slider that snaps to numbers nothing on it points at is a
slider correcting the hand for no visible reason — and the notches thin up the
1‑2‑5 ladder where a grid would draw too many of them to read. Every colour is
picked in **the page's own picker** and never the OS's: a colour here is judged
by watching it land on the scene, which cannot be done behind a platform dialog
standing over the scene. **That picker opens on a PIPETTE**, because a colour
on a painted hub is taken far more often than it is built out of a saturation
square — the platform's `EyeDropper` where there is one, which samples the
whole SCREEN, and the page's own canvas sampler where there is not (Firefox and
Safari ship none), which samples the SCENE: the hub and the cuts, live under
the pointer, kept on a click and put back on ESCAPE. The label names which of
the two it is, because a tool that is narrower here must not be a tool that
lies.

The page is **DOM and not a canvas**, unlike the store composer: the halo, the
badge and the breath are CSS, so what is tuned there is what ships — the block
marked THE VILLAGE ITSELF is the one that moves into the webshell unchanged. It
places only what the game has ADOPTED, since a cut no manifest names ships
nowhere — and **a spare cut is adopted by clicking it**, which writes the role
into `art.objects` and encodes it, because that decision is made looking at the
picture. **A second palette holds the SHARED cuts** — the clouds, material no
game owns and all thirteen are offered; same click, same `art.objects` line,
and its own list because that is the one thing the picture cannot say. One
palette entry is not a file — **empty**, the box with no
picture in it, for a lamp the hub is already painted with. It writes in two
places and the two mean different things: **Save draft** into
`lab/village-presets.json`, which ships nothing and rebuilds nothing, and **Push** into `web.village` of `games/<slug>/manifest.json`, with
the patch bump and the rebuild that touching a game's sources owes. The segment
at the top says which of the three — manifest, draft, empty — is ON SCREEN, a
source nothing is stored in is disabled rather than silent, and switching asks
before it replaces unsaved work.

`view-frame.html` is **the view frame bench**: the one frame every room of the
place stands in — veil, card, header, the tab bar at the foot and how it shares
the bottom band with options and help, the page change and the entrance — as
six proposals over the five views, in any of the games' palettes. **C · Sheet**
is what ships (packages/webshell/view.css, THE SHEET); the others are the record
of what it beat.

`notify.html` is **the notification catalogue**, and it is where the look of
`Notify` was chosen: seven styles (pill, card, ribbon, plate, stamp, glass,
chip), five slots, four ways a crowd behaves (stack, replace, queue, merge),
the entries, the exits — `fly` into the wallet chip among them — and the
timings, all tried on a 720×1280 frame in any of the games' palettes and faces,
over a live round, the village, the map and a card, with the repo's real
messages. **`D · Chip` is what ships**; the other presets are the record of
what it beat. A new look is tried there first and copied into the NOTIFY block
of `packages/shell/motor.css` by hand — *Copy settings* is the panel's state as
JSON, which a CSS copy does not carry.

`modal.html` is **the card catalogue**, and it is where the ONE card component
every game opens was chosen. The structure is fixed — a tag on the corner, an
eyebrow, a title measured to one line, the content and a tap line, the tag and
the eyebrow optional and the tap line mandatory — and what was tried is the
skin (seven materials), the presentation (center, header, band, tab, ribbon),
where the tag sits and how the card moves. **All seven** puts the real cards
side by side in one look — options, the daily road, the three boxes, a
sticker's detail, a new sticker, the ad, the enemy camp — because a look is
judged on its coherence, in any of the fifteen palettes and both languages.
`#view=gallery&preset=0&game=vipera` opens a state without the panel. **Preset
`A · Chosen` is what ships** — bevel with a 1 px rim over a 70 % fill,
centred, accent title, corner pill, shimmering tap line, pop — as the CARD block of `packages/shell/motor.css`,
which is the motor's so a game's own sheets wear it too (`games/stratideck`'s
camp and army lists over a round); `packages/webshell/view.js` builds the slots
and `view.css` only places the card. The other presets are the record of what
it beat.

`button.html` is **the button catalogue**, and it is where the ONE button
every game draws was chosen: a short list and nothing outside it — the button
(rest, hover, pressed, shiny, off), three sizes, danger, the icon, the switch,
the ad (`.btn-pub`: the play glyph, the line, "watch an ad", the reward) and
the purchase (`.btn-buy`: a word and the price on a macaron) — in ten styles
that can be mixed field by field, in any of the palettes. **`Chosen` is what
ships** — "Jelly" mixed flat — as the BUTTON block of
`packages/shell/motor.css`, so no SKIN writes a button rule of its own; see
[docs/ENGINE.md](docs/ENGINE.md#the-button--one-component-and-a-skin-never-restyles-it).

`sound-library.html` is **the sfx library, by ear** (`make events` →
`http://localhost:8092/library`): every file of `assets/audio/sfx/` on one
page, grouped by the CATEGORY its name starts with, with its length, whether it
is mono, its pack and which game already cuts a clip from it (`chainring.hit`);
a search box, the categories, the packs and the length as facets; hover plays,
click copies the name. The library is ~870 files from two vendors — the
ZapSplat "multimedia" set and ten Kenney CC0 packs — and **every file is named
`<category>-<descriptor>-<NN>.<ext>`**: `impact-metal-heavy-01.ogg`,
`chime-ping-correct-01.mp3`, `voice-female-level-up.ogg`, the category first
because it is what a list groups by, the vendor's word order and marketing words
gone. `assets/audio/sfx/sources.tsv` keeps each file's pack, licence and
original name, `LICENSES.md` beside it says what the packs are, and
`node tools/lab/index-sfx.mjs` (`make sfx`) reads the folder back into
`index.json` — durations, channels, categories, packs — which is what the
bench's file menu (grouped by category since) and this page read; `--list <terms>` is the same list as text, for a hand or a model that wants a metal
impact under 0.3 s without opening a browser. A provenance comment writes the
file's name without its extension and nothing else, and the source format does
not matter: `apply-events` re-cuts every clip through ffmpeg, so an ogg source
ships as the same mono 32 kHz mp3 an mp3 source does. `tools/lab/rename-sfx.mjs`
is the one-shot that did the naming and rewrote every game's provenance comment
with it; it is a record, like `extract.mjs`, and a new pack is named to the
scheme by hand and declared in `sources.tsv` (see `LICENSES.md`).

`game-text.html` is **the copy desk**: every word a game shows a player, in one
list, split into an EN section and an FR one. A game's copy is written where it
is used, which is the right place to write it and the wrong place to proofread
it — the intro sentence lives in three files, a HUD label is the second argument
of a call nine hundred lines down, and the French half of it all is in a manifest
nobody opens while writing gameplay, which is how a game ends up saying "Length" in
one corner and BODY in another. So `tools/lab/scan-text.mjs` reads all four
sources back and groups the result by the SCREEN a player reads it on — the
listing, the title screen, the shell, the HUD, the round, the end screen, the
level objective. Every row has an edit field and **APPLY writes it back**
(`tools/lab/apply-text.mjs`) into whichever of `manifest.json`,
`games/<slug>/game.js` and `games/<slug>/page.html` holds it, then rebuilds the
game and both catalogues, so a proofreading pass leaves a tree that still passes
`node tools/update.mjs`. Three rules make a row honest, and they are why this is
not a find-and-replace: **one row is every site** — "Length" written at three
call sites is ONE row and applying it writes all three, which is the bug the
page exists to prevent; **a mirror is not a second string** — `#intro-title` and
`#intro-tagline` are rewritten from `CONFIG` at boot, so they ride on the CONFIG
row and are written with it rather than being offered on their own; and **a
fragment keeps its expression** — `st === 3 ? "Apex viper!" : CONFIG.copy.gameOver`
is two pieces of copy, so the unit is the string LITERAL and not the argument,
with the expression printed under it and spliced around untouched. The motor's
own menu strings (PLAY, OPTIONS, LEAVE?) are not listed: they belong to the
thirteen equally, and a game that wants its own wording writes it under
`web.copy`, which IS listed. `node tools/lab/scan-text.mjs <slug>` is the same
list as text, no browser.

The events bench, the copy desk and the village composer are the second, third
and fourth lab pages with a server of their own (`make events`, `make text`,
`make village`), for the same two reasons as the store composer plus one more:
Apply writes.

**`make lab` puts all of them on one port, behind a back office**
(`tools/lab/serve-lab.mjs`, `http://localhost:8095/`). `lab/index.html` lists
every page of `lab/`, read off the pages themselves (the `<title>` and the
headline of the header comment, so a new page is listed with nothing to
register), and opens each one in a frame beside the list; the hash is the
location, so a reload comes back to the same page. The four tools with a server
are **proxied under a prefix** — `/events/` (and `/events/library`), `/text/`,
`/store/`, `/village/` — each one the same script its own target runs, started
in **its own process** the first time it is opened: the copy desk's scan is
~18 s of synchronous CPU, and in a shared process it froze every other tool.
That prefix is why a page served by a tool **addresses it with relative urls**
(`api/games`, never `/api/games`) — a new tool page must too. Every other page
is served as a file under `/lab/`, with `assets/`, `games/` and `packages/`
read-only beside it, which is what its `../` paths already reach. All of these
servers sit on `tools/lib/serve.mjs`: they bind `127.0.0.1`, answer only a
`Host` naming this machine, and a new lab server starts from it rather than
from `createServer`.

Last, `level-map.html` is the 30-level map that would sit between the web menu
and the round — a forking road walked on an invisible 6-column grid (see
[docs/LEVELS.md](docs/LEVELS.md)). None of these pages ship, and they are the one
place in the repo allowed to load a file out of `assets/` by relative path.

Start a new one from **`lab/_template.html`**: a single page, inline CSS and JS,
a control panel on one side and the thing being tried on the other. Same
anti-dependency rule as everywhere else — no framework, no CDN, no web font.
And the same casing rule: the page's strings are written in normal case, and a
page that MOCKS a game screen carries its own copy of `upper()` so its capitals
lose their accents exactly as the motor's do — `overlay-pop.html` is the one to
copy it from. A page that is only a control panel needs none: its buttons read
*Apply* and *All*, which is what a tool's chrome should look like anyway.

**A script that drives a headless Chrome imports `tools/lab/chrome.mjs`, and
there is no second way to do it.** Ten tools launch a browser over the DevTools
protocol, and the teardown at the bottom of the file is the one line a run never
reaches when it matters — a throw mid-shoot, a Ctrl-C, a CDP call that never
answers, a window closed on the node process itself. The cost is invisible and
it compounds: a headless browser nobody can see still holds a GPU context and a
few hundred megabytes, and a leftover profile is 50–180 MB of `TMPDIR` that
nothing ever comes back for. The module is three mechanisms because no single
one covers every way a script dies — `reap(child, {label, deadlineMs})` for the
signals and the throws (SIGKILL, never SIGTERM, which a headless Chrome
survives), a deadline for the hang that raises no exception, and
`sweep(prefix)` for the one case no in-process handler can cover, a node that
was itself SIGKILLed: the NEXT run adopts the corpse. Call `sweep` with the
script's own mkdtemp prefix **before** its own `mkdtempSync`, so the run cannot
eat the browser it is about to start. Two rules make the adoption safe and
neither may be relaxed: a process is a candidate only if it is HEADLESS and its
`--user-data-dir` sits under that prefix, and the disk pass removes a dead
browser's PROFILE and nothing else — `bench-raster` leaves its `rows.json` in
that same directory and prints the path.

## Motor APIs — use these instead of reinventing them

Frame & input (section 3):

- `view` — `w`, `h`, `scale`, `dpr`, `insetTop`, `insetBottom` (design px).
  `view.dpr` is the design→device pixel ratio: size every cached canvas with it
  and never read `window.devicePixelRatio` in a game.
- `Layout` — `top / bottom / left / right / w / h / cx / cy`: the band gameplay
  may use, already clear of the HUD, the CTA bar and the device insets, and
  **never closer to the glass than the house margin** — `CONFIG.layout.safePad`,
  26 design px, a FLOOR on the four edges and not an addition (a playable's
  150px HUD and 112px CTA bar already exceed it; the edge it bites is the bottom
  of the web and android builds, where `ctaHeight` is zeroed). Every instrument
  and every readable word a game draws is anchored inside it — `Pop.show` and
  `Pop.text` are clamped into it by the motor. It is **not a clip rect**: a lava
  lake, a scrolling lane or an expanding shockwave is meant to bleed off an edge
  and is drawn outside `Layout`, as it always was. See
  [docs/ENGINE.md](docs/ENGINE.md).
- `Input.on("down"|"move"|"up", fn)` — unified mouse+touch in design space.
- `Input.swipe(dir, dist)` / `Input.at(type, x, y)` — synthesize a gesture. This
  is what the desktop keyboard rides on: SPACE starts, replays and — for
  `tap` / `hold` games — taps at `Layout.cx/cy`; **← / → (or A / D) fire a whole
  left/right flick for `swipe` games**, so a swipe mechanic needs no keyboard
  code of its own. Opt out with `CONFIG.keyboard = false`.
- `Loop.start/stop/pause/resume` — rAF loop with clamped `dt`. `Loop.rate(k)`
  is a time scale on the simulation only: the frame keeps rendering, `update`
  gets `k * dt`, and `start` resets it to 1. The web target's three-star finish
  is what ramps it.
- `Sound.unlock()` (in a user gesture), `Sound.clip(name,vol,rate)` — the way a
  game plays sound: one clip from `assets/audio/sfx/` per event, pitched with `rate`
  rather than duplicated. `Sound.cue(name,vol,rate,freq,dur,type)` plays the clip
  when the game ships one under `name` and a synthesized beep otherwise;
  `Sound.beep(f,dur,type,vol)` / `Sound.arp(freqs,step,dur,type)` are that
  fallback.
- `Music.start/stop/duck/unduck` — the looping background bed. A game only
  embeds `ASSETS.sounds.music` and sets `CONFIG.music = { volume, fade }`; the
  shell starts it, ducks it on the end screen and pauses it off-screen, and the
  loop seam is crossfaded so the track need not be seamless.
  `Music.play({ from, length, rate, gain })` loops **one section** of that
  track instead of all of it, and switching section crossfades — which is how
  one long file becomes a bed per biome plus a quiet, slower one for the menus
  (`CONFIG.music.menu`), at no cost in bytes. `games/arcider` is the reference
  and [docs/MUSIC.md](docs/MUSIC.md) is the procedure for replicating it — read
  it before cutting a game's bed into sections. A long track ships whole on the
  web only (`web.music`).
- `Beat.beats/next/pulse/period/seconds` — the musical clock, for a game played
  on the beat. Add `bpm`, `beatOffset` and `loopBeats` to `CONFIG.music`, then
  schedule on the grid and interpolate toward it (never accumulate your own
  timer, it drifts). It runs off `dt` when the track is missing or muted and
  phase-corrects onto the audio clock without snapping. Reference:
  `games/chainring`.
- `Store.get/set/del` — localStorage with an in-memory fallback, so a best score
  survives the session even where a sandboxed iframe makes localStorage throw
  (itch, a portal). **`"bestScore"` is renamed to `"best:<slug>"` inside `Store`**
  whenever `CONFIG.slug` is set (the web build injects it): the split site build
  serves the thirteen from one origin, and a bare key there is one score for all
  of them. Ask for `"bestScore"` as before — never write the scoped name.
  `Rand.range/int/pick/chance`.
- `Lang.t(str)` / `Lang.code()` — the FR/EN dictionary a game declares in
  `web.copy.<lang>.strings`, keyed by the English. The motor already translates
  every word it writes; a game calls `Lang.t` only on a literal it
  CONCATENATES or paints on the canvas itself, never on a comparison or a
  storage key. See [docs/ENGINE.md](docs/ENGINE.md#lang--the-game-in-the-players-language).
- `upper(str)` — capitals, the house way: accents come off and a lowercase run
  glued to a digit (a unit, a multiplier) is left alone. The motor already
  shouts everything it writes — `CONFIG.copy`, `Pop`, the HUD, the end screen —
  so a game calls it only on what it paints itself with `ctx.fillText`. Every
  string in the repo is written in normal case; this is the only way it reaches
  a screen in capitals. See [docs/ENGINE.md](docs/ENGINE.md#upper--capitals-are-a-look-not-a-spelling).
- `preloadImages(done)` + `Images[key]`. `rgba(hex,a)`, `clamp(v,lo,hi)`.
- `Icon.draw(ctx,key,cx,cy,size,colour)` / `Icon.get(...)` — a pictogram from
  the shared `assets/motor/lucide/` pack, encoded with `node tools/lab/embed-icon.mjs <name> --key icoThing` into `ASSETS.images` and tinted here. Icons are stored
  white, so never `drawImage` the raw SVG.
- `Fx.burst/ring/shake/flash/freeze` — the canvas juice layer; the frame
  pipeline updates and draws it for you. It holds no text: every word a game
  writes is `Pop` or `Notify`.
- `Confetti.burst(n)`.

Shell (section 5):

- `HUD.setScore/setScoreNow/punch/setLeft/setRight` — the top band.
- `Pop.show(style, {word, sub, at, rot, cls, hold})` — the comic / manga callout
  layer, and **the place a game writes a MOMENT**: score gains, combos, every
  beat that celebrates a player action, a mistake as it happens (`alert`:
  "Combo lost", "Miss") and an alarm (`danger`). A word the player has to READ
  rather than feel is not a moment and goes to `Notify.say` below.
  Styles: `score alert streak bonus ribbon combo perfect manifest danger record ultra vert`. Catalogue and live preview: `lab/overlay-pop.html`; what a
  given game already fires, in that game's own build: `make events`.
- `Pop.text(x, y, str, {color, size, tier:0..3, life, vy})` — **the same
  system's other half**: a number floating up from a point in the world, drawn
  on the canvas instead of in the DOM. Use it for the VALUE a hit pays (`+40`
  over the brick) and `Pop.show` for the MOMENT it crosses (the milestone). It
  was `Fx.text` until the two were merged — a game writes its words in one
  place, and `Fx` is pure juice. Uncapped and cheap; only draws while a round is
  running. **The thirteen share one look for it** — `size: 22, life: 0.6, tier: 1`, taken from blight's JOKER — and only the `color` is the game's,
  because the colour is data (the brick that was hit, rot against clean) and the
  rest is style.
- `Notify.say(word, {sub, kind, icon, key, hold})` — **the one voice for
  INFORMATION, on every screen**: a state that changed and stays changed
  ("Shield down", "Wounded"), an input refused ("Out of reach", "Not enough
  coins"), a hint or a lesson, a warning of what is coming ("Last ball"), and
  anything at all said outside a round — the village, the map, a view, a card
  (the web shell's army, OPTIONS and meta layer call it through
  `window.__WEB__.Notify`). `kind` is `info gain good warn loss rare`, a colour
  and a default icon; `icon` is a shell piece (`coin ticket super xp star sticker trophy`, painted where the build has `CONFIG.shellArt`) or a
  pictogram (`info warn lock unlock heart user check x hourglass sparkles eye trash`). **One look, and none of it is a game's**: a chip of the wallet
  band's family pinned top-right — under the band on a view, under the HUD in
  a round — newest on top, four at most, the same notice twice bumps a `×N`
  instead of stacking, a warn or a loss shakes, a timer line drains for 2.2 s,
  and it leaves by flying into the chip it is about (`Notify.target(fn)`,
  registered by meta.js) or lifting away. Tap dismisses, press holds — except
  in a round, where the layer is pointer-transparent so it never eats the
  game's tap. The one knob is `CONFIG.notify = { round: "bottom" }` for a board
  that fills the top of the frame (bouncetry, echomaze). Chosen in
  `lab/notify.html`; see
  [docs/ENGINE.md](docs/ENGINE.md#notify--the-one-voice-for-information).
- `Overlay.vignette/clear` — the dramatic full-frame glow, and the way to wipe
  the layer. It carries no word: the motor's old `toast/banner/reward` were
  deleted when `Notify` took the informative words.
- `Decor.dress(node, {count, spots, size, opacity, front})` / `Decor.clear(node)`
  — one to three of the game's own painted objects around a screen, out of
  `assets/image/embed/<slug>-decor-NN.webp`. The motor dresses the end screen and the
  round on its own; a new screen calls this. Never more than three.
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
- `endRound(result)` — the single way a round ends. `onResult(fn)` registers a
  filter that may rewrite the result before the end screen reads it; the motor
  registers none, and the web target's level layer is what uses it.
  `onOutro(fn)` is the beat BETWEEN the round and the end screen: the clock is
  stopped, the loop is left turning (which is what a slow motion needs), and the
  screen waits for the `done` the hook is handed. Same rule — the motor
  registers none, a playable keeps the straight cut. Hooks CHAIN in the order
  they were registered: the level layer's first, then the army layer's prisoner
  offer.

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
- **The cards are ordered by release, freshest first**: the day the manifest's
  `version` last moved in git, newest first, then the higher version on a tie.
  `gen-catalogues.mjs` reads it from git and bakes the order into `games.js`
  (a bump not committed yet counts as today), because the Vercel build clones
  shallow. `order` in the manifest now sorts the developer gallery only.
- **The hero is dressed with the games' own characters.** `build-site.mjs` copies
  each game's `assets/image/embed/<slug>-character-happy.webp` to
  `image/games/<slug>/character.webp` and marks `character: true`;
  `initHeroCast()` draws two of them at random on every load and stands them
  either side of the headline. The site owns no artwork of its own, and the pair
  is never hard-coded — thirteen characters over two slots is a different pair
  almost every visit. The layer collapses under 1080px, where the headline needs
  the full width.
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
- **Capitals come from `upper()` in `script.js`, not from the stylesheet
  alone.** `applyLang` writes every `data-fr` / `data-en` node and, for a node
  the CSS shouts, writes it already in capitals with the accents taken off —
  the hero eyebrow reads STUDIO DE JEUX INDEPENDANT, which
  `text-transform: uppercase` on its own cannot produce. The stylesheet still
  decides WHAT shouts; this only decides HOW.
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

- **Normal case everywhere, capitals by method — the one rule with no
  exception in this repo.** `games/`, `template/`, `packages/`, `site/`, `lab/`
  and `prototype/` all write `"Best score"`, `"Time's up!"`, `"Dernière vie"`:
  lowercase, a capital on the first letter and on a proper noun. A screen that
  reads in capitals got them from `upper()` — the motor's
  ([packages/engine](packages/engine/engine.js)), the site's
  ([site/script.js](site/script.js)) or the lab page's own copy of it — and
  **a capital carries no accent**: DEJA, CA MELANGE, MEILLEURE CHAINE. Never
  type a word in capitals to get capitals on screen, and never `toUpperCase`,
  which keeps the accent and shouts the `x` of a multiplier. On the site the
  stylesheet stays the one place that says WHAT shouts: `applyLang` reads the
  computed `text-transform`, so a new uppercase rule needs no second list.
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
- [ ] `node tools/update.mjs` passes — the artifact matches its sources, the
  catalogues are current, and every creative is under 5 MB.
- [ ] `node tools/build/build-site.mjs` lists the game (not "skipped") and its card
  reads correctly in `dist/site/index.html`, in both FR and EN.
- [ ] No external requests (check the network tab is empty).
- [ ] Every status line, refusal, hint and warning is a `Notify.say` — no
  message painted on the canvas, no message node of the game's own, no
  `Pop.show("alert")` carrying anything but a mistake as it happens.
- [ ] Code and comments in English, and **every string in normal case** — no
  word typed in capitals, no `toUpperCase`; the motor's `upper()` is what
  shouts, and `node tools/lab/scan-text.mjs <slug>` is where the game's copy is
  read back to check it.
