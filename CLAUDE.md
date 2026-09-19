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
   inlined in `.demo-hand`; never draw another hand) and re-dress the target /
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
   `Fx.burst/ring/shake/flash/freeze`, `Pop.show` for **every word the game
   writes** — a status line included, which is what the `alert` style is for —
   `Pop.text` for a value floating in the world, `Overlay.vignette` for the
   glow, `Sound.clip`.
1. Give every event a sound **picked from `assets/audio/sfx/`**, trimmed and embedded
   in `ASSETS.sounds` (see [docs/ASSETS.md](docs/ASSETS.md)). Never invent a synth
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
finished game**, and it is one shape for all thirteen — the two files
(`menu.css`, `menu.js`) are the template, so a game gets it by listing `web` in
its `targets` and nothing else:

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
  unlock gesture exactly as they were.
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
- **the three panels open in that same band**: the title and the scene stay, the
  menu is swapped out, and a back arrow returns (ESCAPE too).
- **OPTIONS is real** — music, sound effects and score callouts are switches the
  motor now carries (`Sound.setMuted`, `Music.setMuted`, `Pop.setEnabled`), the
  language is FR/EN live, and the best score can be wiped (it asks twice). All
  of it persisted through `Store`.
- **the round itself gets two controls**, MENU and OPTIONS, in the
  **bottom-right corner** (`#web-ctls`). They are the difference between a
  playable, where the round *is* the ad, and a game the player owns. Not in the
  top band: the HUD is the game's, all of it, and the thirteen fill it
  differently — the corner is where the menu's own entries are and where a thumb
  already is, and nothing about the round has to move to make room (`--hud-h`,
  `--cta-h` and `Layout` are all untouched). Either control **pauses the round**
  (the clock is `Loop`'s, so freezing the loop freezes the world, the timer and
  the game's update at once, and a tab coming back cannot un-pause it) and opens
  one card over the frozen world: the same options rows, or the one question that
  throws a run away — leaving does not call `endRound`, so an abandoned round
  writes no score. ESCAPE is that pause on a keyboard.
- the how-to-play demo moves into the Help panel (the motor's own node, moved
  not copied, so a SKIN's dressing follows it), and the end screen is rewired to
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
  screen keeps its stat rows). See [docs/LEVELS.md](docs/LEVELS.md).
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
  collection and not a banner over the title. It has no ends: today sits in the
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
  day of the run it is are the eyebrow of the card the tap opens. That tap opens
  the LEVEL MAP and plays the gift over it, because the wallet the gift pays
  into is that screen's own header; on `localhost` it pays on every tap and says
  so with a DEV pill on that same card. `meta:<slug>` is the save, kept
  apart from `prog:<slug>` because wiping a climb must not wipe a wallet.
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
  The wallet's two chips are the doors to the shop, here as on the map — and IN
  the shop only the blue one is a door, back to the album, because the gold
  one's door is the screen it is standing on; there is
  no GET TICKETS button, because a button that only exists once the wallet is
  empty teaches nothing before it is. **Every number that moves in a chip moves
  through one engine**, `Meta.fx` — the end screen's cascade, a reward flying
  out of its card, a purchase, a price, a shelf of doubles sold — so a screen
  that pays says so the same way every other one does (see
  [docs/META.md](docs/META.md)). The album is **one screen and does not scroll**: the
  machine down the left, the bet and the odds beside it, the twenty tiles under
  both. A sticker the player has never had arrives on a flash, a shockwave and a
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
  the sentence, `watch an ad` under it at the size a price is read at — beside
  the END SCREEN'S OWN arrow, the same circle the way on wears there, which
  walks past it; a sticker is redrawn rather than multiplied, so that one says
  *one more* and wears no plate. Walking past it goes STRAIGHT to the end
  screen: the token flies into a wallet that is a layer over the frame, so
  nothing has to wait for it, and holding the outro for the flight showed a
  second of the frozen round with nothing on it. Five and
  not three because the plates the shell ships are x2, x5, x10, x20, x50 and
  x100: an offer the player can SEE is worth more than a smaller one they have
  to read. A round with a star is offered the boxes FOR an ad on the end screen;
  a round with none is left alone. **The rewarded ad is a placeholder that says so on
  screen** — the web target has no SDK, and wiring one in is replacing the body
  of `Meta.ad`. The map's header stops writing the game's own name (read one tap
  ago on the title screen) and carries the wallet instead. **Only `radiam`
  declares it today**; a second game is a 5x4 sticker sheet and a manifest
  block. See [docs/META.md](docs/META.md).

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
sheet the **web shell** owns, and there are five — the gift boxes the daily
strip and the three-box ceremony draw, plus the shell's **instruments**: the
coin a wallet counts, the ticket it spends on a pull, the bolt an xp bar fills
with, the star a level is cleared with, the trophy a finished board earns, and
the plate that says a seventh day pays five times over. Those were stroked pictograms
and a stroked pictogram reads as a tool's chrome; the web shell is a game. A
cut is **renamed** in `SHELL_CUTS` and the rename is the declaration —
`reward-08` says nothing, `coin` is what the shell draws — and four of the
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
`Pop.text` and `Overlay.toast/banner/reward` of the `game.js` in source order,
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

The events bench and the copy desk are the second and third lab pages with a
server of their own (`make events`, `make text`), for the same two reasons as the
store composer plus one more: Apply writes.

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
  writes is `Pop`.
- `Confetti.burst(n)`.

Shell (section 5):

- `HUD.setScore/setScoreNow/punch/setLeft/setRight` — the top band.
- `Pop.show(style, {word, sub, at, rot, cls, hold})` — the comic / manga callout
  layer, and **the only place a game writes a word on the round**: score gains,
  combos, every beat that celebrates a player action, and the status lines too —
  `alert` exists for exactly that, sitting where a toast used to and styled like
  the rest of the callouts instead of a leftover pill. **No game calls
  `Overlay.toast/banner/reward` any more**, and a new one should not start:
  thirteen games speaking in one voice is the point, and a pill in its own layer
  reads as another product. A status line that must not fight a celebration
  landing on the same frame is answered by the ANCHOR, not by a second system —
  `alert` sits at `hudUnder`, callouts at `bottom` or in the world.
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
- `Overlay.vignette/clear` — the dramatic full-frame glow, and the way to wipe
  the layer. `Overlay.toast/banner/reward` are still in the motor and no game
  calls them: their words moved to `Pop.show` above, which is where a word
  belongs.
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
  registers none, a playable keeps the straight cut, and the level layer is the
  one user.

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
- [ ] Code and comments in English, and **every string in normal case** — no
  word typed in capitals, no `toUpperCase`; the motor's `upper()` is what
  shouts, and `node tools/lab/scan-text.mjs <slug>` is where the game's copy is
  read back to check it.
