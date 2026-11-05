# GELATILE — from the prototype to the game

The plan of record for the twentieth game: 2048 with jelly tiles, five biomes
and fourteen powers. It is **built** as `games/gelatile` (v0.1.0), on the motor,
with every asset of §10 filed, cut and adopted; what the first build decided —
the balance above all — is in [§13](#13-what-the-first-build-decided), and the
level table in `games/gelatile/game.js` (`LEVELS`) is now the authority over
§6's first guesses.

**Slug:** `gelatile` (gel + tile, it reads the same in French and English).

______________________________________________________________________

## 0. Where things are

| what                                       | where                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| the rules prototype, the reference         | [`prototype/merge-2048.html`](../prototype/merge-2048.html)                                                  |
| the ten merge and ten magnet effects tried | [`prototype/merge-2048-fx.html`](../prototype/merge-2048-fx.html) — *Stamp* and *Comet pull* won             |
| the ten targeting looks tried              | [`prototype/merge-2048-targets.html`](../prototype/merge-2048-targets.html) — *Gutter lines*, slow beat, won |
| the grey material textures                 | `fusionMania/` at the repo root (temporary): three of them are kept, filed in §10                            |
| the hero, three faces (the user's)         | `assets/image/master/gelatile-character-{sad,neutral,happy}.png`                                             |
| the game                                   | `games/gelatile/` (to create)                                                                                |

The prototype is the reference for every rule and every number below, except
its look: its fifteen palettes are replaced by the five biomes of §2.3. Its
tunables are the `var`s at the top of the file. Port them as they are, then
tune them in the game, not in the prototype.

______________________________________________________________________

## 1. The game in one sentence

Swipe the jelly tiles to merge twins into bigger numbers, and read the board's
targets one move ahead before a power strikes.

- **Intro tagline (EN):** `Swipe to <b class="w-merge">merge</b> twin jellies and reach the <b class="w-goal">big tile</b> before the board fills up.`
- **Intro tagline (FR):** `Glisse pour <b class="w-merge">fusionner</b> les gelées jumelles et atteins la <b class="w-goal">grosse tuile</b> avant que la grille soit pleine.`
- **Tags (EN):** puzzle, merge, numbers. **(FR):** réflexion, fusion, chiffres.
- **Store subtitle:** *Gelatile: Merge 2048 Puzzle*.
- **Intro demo:** `CONFIG.intro.demo = "swipe"`. The game's own 4x4 board,
  drawn by the SKIN with the Bubble Bath tiles: the shared finger flicks right
  under it, every tile slides to the right wall, two `2` tiles stamp into a
  `4` and a new `2` is born. Desk: the RIGHT key alone appears on the stage,
  only while the move is played; the legend under it names the four arrows
  (see the motor gain in §3, step 2).

### 1.1 Who it is for, and the hero who speaks to them

**The audience is the 2048 audience: all ages, mostly adults, short sessions
on a commute or a sofa.** It is a calm game with a satisfying touch. The
satisfaction comes from the slides, the stamp of a merge, the gold from 128 up
and the targets, which are a puzzle and never a scare. The game falls under
Google Play's Families policy like every game of the studio.

**It is not a 2048 clone, and the look is what says so.** None of the classic
2048 colours (the beige `2`, the orange climb) appears. Each biome is one
place, one tile colour, one material and one painted scene that agree with each
other. The menus all live in one world of soap foam and bubbles.

**The hero is Gelo, a glossy sky-blue jelly cube.** His body is rounded and
translucent, with a few small air bubbles inside. He has big glossy dark-blue
eyes with white highlights, short dark-blue eyebrows, pink blushing cheeks and
a small open smile. He has no arms and no legs: he IS a tile, the first `2` of
every board grown up. He is cheerful, a little wobbly, and proud of every
merge.

He is the end screen's three faces (already painted), the title screen, the
village and the store images. He never stands over the board during a round:
the board is the whole picture.

______________________________________________________________________

## 2. The rules the prototype validated

### 2.1 The board and the move

- A **4x4 board**. A move slides every tile as far as it goes toward one side.
  Two equal tiles that meet merge into their sum, and a tile merges **once per
  move**. The score gains the value of every tile made.
- After every valid move one tile spawns on an empty cell: a `2`, or a `4`
  with `FOUR_CHANCE` (0.1). It never spawns on a cell a target has just struck
  (`spawnTile(at, hit)`).
- A move that moves nothing is **refused**. It costs no move and spawns
  nothing, and the board answers with a nudge (§2.2).
- The round is lost when no direction is valid (`anyValid()`), which includes
  a locked side (§2.9).
- **The resolution is one function per line**, `resolveLine(line, dir, wrapOn)`,
  called by `plan(dir)` for the four lines. It knows ice, ghosts, stone and the
  teleport wall. `plan` is pure: the lean preview, the bench and the refusal
  all read it, and `doMove` is the only function that writes the board.

### 2.2 The feel — every number was chosen by eye

| what                    | how it moves                                                                                                                                                                                  | tunables                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| slide                   | eased lerp from the tile's drawn position (a lean included), so a move fired mid-lean never jumps                                                                                             | `MOVE_T` 0.12 s                                                       |
| merge — **Stamp**       | the tile lands pressed flat and springs back, `0.3·e^(−7t)·cos(18t)`, widened by 0.75 of it and anchored on its bottom edge; dust from the two bottom corners, the `+v` float, a short shake  | `STAMP_T` 0.7 s                                                       |
| spawn                   | grows in from nothing with an ease-out-back                                                                                                                                                   | `SPAWN_T` 0.18 s                                                      |
| lean (slow drag)        | a drag leans every tile that WOULD move, the merging pairs closer; coming back to the start cancels; 0.75 cell commits without lifting, 0.3 on release                                        | `LEAN` 0.16, `COMMIT_DRAG` 0.75, `RELEASE_DRAG` 0.3                   |
| refused move — nudge    | the board leans a little toward that side and comes back (rubber); a locked side flashes red                                                                                                  | `RUBBER` 0.04                                                         |
| magnet — **Comet pull** | twins in line with only empty cells between them lean toward each other; one bead a side, half a cycle apart, with a five-step tail, quieter with distance; side by side the lean is discreet | `MAGNET` 0.05, `MAGNET_NEAR` 0.3, `MAGNET_FAR` 0.6, `COMET_SPEED` 0.6 |

A merging tile is drawn above the others while it is stamped (`t._top`), so a
pressed tile is never cut by a neighbour. The magnet's beads are drawn after
the tiles, inside the board's clip, in world space (`setWorld()`). The comets
were invisible while they inherited the last tile's transform.

### 2.3 The five biomes — one tile colour, one material, one scene

**This replaces the prototype's fifteen palettes.** A biome is one band of six
levels, and it is a single coherent look:

- **one tile palette:** a path through OKLCH from the `2` to the `2048` in the
  biome's own colour family. Lightness, chroma and hue all move one step per
  value, so 2 → 4 → 8 always reads as a climb (`buildPalette`);
- **one material:** the grey texture laid over every tile (§2.4);
- **one painted scene behind the board:** `gelatile-scene-<biome>.png` (§10).

**Every palette is a light one.** The tiles go from very pale to medium-dark,
always over a light scene, and the numbers' ink follows the tile (dark on a
light tile, white on a dark one). The prototype's dark palettes (`dark: true`,
tiles that got lighter as they climbed over a dark ground) are gone, and so is
that branch of `buildPalette`. The board plate and its cells take the biome's
hue, light and slightly translucent, so the scene shows around the board and
never through the tiles.

**No two biomes share a colour family**: lavender, green, blue, pink-red,
aqua. Warm yellows and oranges are left out on purpose: that is the classic
2048 climb.

| #   | biome (EN / FR)                     | levels | tiles 2 → 2048        | hue 2 → 2048 | L 2 → 2048  | C 2 → 2048  | material | scene                                    |
| --- | ----------------------------------- | ------ | --------------------- | ------------ | ----------- | ----------- | -------- | ---------------------------------------- |
| 1   | Bubble Bath / Bain moussant         | 1–6    | pale lilac → lavender | 305 → 275    | 0.95 → 0.52 | 0.04 → 0.17 | soap     | a funny, cute bathroom full of soap foam |
| 2   | Jungle Lodge / Cabane de la jungle  | 7–12   | pale lime → emerald   | 118 → 158    | 0.94 → 0.46 | 0.06 → 0.15 | wood     | a wooden treehouse deck in the jungle    |
| 3   | Crystal Cave / Grotte de cristal    | 13–18  | ice blue → deep blue  | 215 → 258    | 0.96 → 0.48 | 0.03 → 0.15 | crystal  | a bright crystal cave in winter          |
| 4   | Rice Terraces / Rizières            | 19–24  | sakura pink → crimson | 355 → 375    | 0.94 → 0.50 | 0.05 → 0.19 | bamboo   | rice terraces under Asian mountains      |
| 5   | Coconut Beach / Plage des cocotiers | 25–30  | pale aqua → turquoise | 170 → 205    | 0.95 → 0.50 | 0.05 → 0.13 | sand     | a sunny beach with coconut palms         |

The hue, L and C ranges are first values. Tune them in the prototype before
porting (its `PALETTES` table takes the same three pairs), checking each ramp
over its painted scene once that scene exists. Past 2048 the hue keeps walking
(4096 and up), as in the prototype. `oklch()` and its gamut mapping port
unchanged.

### 2.4 The materials — a grey texture in hard-light

A material is a **grey** texture laid over the tile colour in `hard-light`. A
50 % grey changes nothing, a lighter grey lifts and a darker grey sinks, so the
file needs no colour of its own. Each tile shows a crop of it (`crop`) at an
offset picked from its value, so two tiles never look stamped from one
picture. `alpha` sets how strongly it shows. There are five files, one per
biome: §10's `gelatile-texture-<name>.png`. Three come from `fusionMania/`
(soap, wood, crystal) and two are still to generate (bamboo, sand).

**The prototype corrected each PNG with a `ctx.filter` tone** (`tone`:
brightness, contrast), because a `file://` image cannot be read back. **The
game must not do that**: `ctx.filter` is missing on older iOS Safari. A data
URI and a same-origin file CAN be read back, so the game normalises each
texture once, when it loads: it maps the mean grey to 128 and the standard
deviation to about 38, in a canvas, and then bakes the result into the tile
sprites. The `tone` column disappears. The procedural fallbacks
(`drawTexture`) stay, for a build that ships without a texture.

### 2.5 The premium tiles — gold from 128, then rainbow

| from | rim     | adds                          |
| ---- | ------- | ----------------------------- |
| 128  | gold    | thin rim                      |
| 256  | gold    | inner rim, a slow light sweep |
| 512  | gold    | wider sweep, two glints       |
| 1024 | gold    | four glints, gold number      |
| 2048 | rainbow | rainbow rim                   |
| 4096 | rainbow | holographic shimmer           |

The static part is baked into the tile sprite (`tileSprite`). The animated
part (sweep, glints, rainbow) is drawn live by `premiumLive`, on the few big
tiles only. The gold number turns bronze on a light tile (L > 0.7), where gold
could not be read.

### 2.6 The powers — what they share

- A power arrives every `POWER_EVERY_MIN`–`POWER_EVERY_MAX` moves (4–7), and
  the game picks it among the level's pool (§6).
- **A tile power and a side power last `POWER_MOVES` (5) moves.** Pips under
  the tile, or on the side's strip, count the moves left, and the power fades
  as it wears off.
- **A cell power is a TARGET, and it strikes after the next move**, on
  whatever tile has landed on its cells. That is the decision the whole game
  is built on: the player sees the target one move ahead and chooses which
  tile goes there, or none. No more than three targets wait at once.
- A merged tile keeps a power: the survivor's own, or the other tile's.
- **One fairness rule the prototype did not have:** a target is never placed
  where EVERY valid move would land the biggest tile on it. Placement tries
  the four `plan(dir)` and draws again when there is no way out. A power may
  hurt, but it is never unavoidable.
- **A target is announced one move ahead**: on the move before one drops, a
  yellow warning sign springs onto the board's top-left corner (the one
  corner no target badge sits on), with a soft `warn` cue; once the target
  is down it turns red, and it stays up until the last target has struck. No callout and no frame around the board: a first try with a
  `danger` callout and a red rim fired every few moves and was far too loud.
  The next power is drawn as soon as the last one lands (`nextPower`), which
  is what lets it be announced.
- **Freeze and Stone are a nuisance, not a loss**: they are drawn twice as
  often from a mixed pool (`play.lightWeight`), wait 60 % of the usual gap
  (`play.lightEvery`), and land on a tile under 16 (`play.lightBelow`), else
  on the smallest tiles left, never on the biggest.

### 2.7 The five tile powers

| power            | rule                                                                                                | look                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Freeze           | the tile holds its cell and is a wall; a twin may still merge INTO it, which thaws it               | ice sprite, cracks that grow as it wears, a snowflake |
| Stone            | the tile slides but never merges                                                                    | stone sprite, the number carved, cracks               |
| Vertical ghost   | moving up or down, a ghost with nothing in front of it passes through the wall and leaves the board | fades, a dashed rim marching, two chevrons ↕          |
| Horizontal ghost | the same, left or right                                                                             | the same, chevrons ↔                                  |
| Mystery          | the tile's number is hidden; it still merges by its real value                                      | the biome's grey tile, a question mark                |

### 2.8 The seven cell powers — the targets

| power           | cells                        | strikes                                                            |
| --------------- | ---------------------------- | ------------------------------------------------------------------ |
| Fireball        | one (on a tile 3 times in 4) | burns the tile                                                     |
| Purple smoke    | one                          | halves the tile (a `2` vanishes)                                   |
| Comet           | a 2x2 block                  | destroys every tile in it, after a short flight (`COMET_T` 0.16 s) |
| Black smoke     | a 2x2 block                  | halves every tile in it                                            |
| Vertical bolt   | a whole column               | destroys every tile in it                                          |
| Horizontal bolt | a whole row                  | destroys every tile in it                                          |
| Switch          | two cells (tiles preferred)  | swaps them, in an arc                                              |

**The targeting look is *Gutter lines* on a slow beat** (targets page, round
3). It says that the GRID is aimed at, not a tile:

- a light tint on the floor of the target cells;
- a fine border in the gutter around them (`TARGET_BORDER` 0.5);
- one ring every `PING_PERIOD` (2.1 s), clipped to the gutters, so only the
  grid lines light up as it travels (`PING_REACH` 1.4 cells, `PING_ALPHA` 0.6,
  `PING_WIDTH` 1.6 gutters). The first ring leaves when the target appears,
  so two targets never beat in unison;
- the switch's two cells joined by a dashed arc;
- **all of it under the tiles**: a tile standing on a target hides the
  floor, and the lit gutters still show around it;
- **the power's badge always at the top-right gutter crossing of the target**
  (one per cell for the switch). It is sized at `BADGE` 0.14 cell so that it
  fits between the corners of the tiles. It is drawn outside the board's clip,
  so a badge on the rim is never cut.

`targetRects`, `clipGutters` (an even-odd clip: the board minus every cell),
`drawTargets` and `badge` port as they are.

### 2.9 The two side powers

| power    | rule                                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Teleport | the tile the wall would stop goes through it and lands in the far cell of its line, and the rest closes up behind; drawn as a portal on both walls |
| Lock     | that direction cannot be played; never placed when it would leave no valid move                                                                    |

### 2.10 What stays in the prototype

The debug keys (`[` `]` stage, `P` palettes, `M` material, `V` all values,
`T` auto powers), the palette overlay, the material chip, `?autoplay=1`, the
debug text and **undo** do not travel. *All values* becomes a page of the
guide (§7). Autoplay becomes the bench (§11). Undo is an open decision (§12).

______________________________________________________________________

## 3. Building it on the motor

Follow [CLAUDE.md](../CLAUDE.md#how-to-create-a-new-game) and
[CREATING_A_GAME.md](CREATING_A_GAME.md) from the top. What is specific:

1. **The sources.** Create `games/gelatile/` from the template's three
   sources, then the manifest:

   - `title`, `version 0.1.0`, `targets ["playable", "web"]` (android later);
   - `theme`: Gelo's sky blue as the accent `#3aa8ff`, his blush as
     `accent2` `#ff6fa8`;
   - `web.font` **`baloo2`**: round and friendly, the jelly's own shape. The
     tile digits are drawn in it on the web, and in the system face in a
     playable, which ships no font;
   - `web.music`, `web.levels` (its five `bands` are the biomes of §2.3),
     `web.meta`, `web.village`.

1. **A motor gain: the down arrow.** The keyboard gives `swipe` games ← and →,
   and ↑ behind `CONFIG.swipeUp`. 2048 needs ↓ too. Add `CONFIG.swipeDown`,
   which works the same way:

   - `Input.swipe("down")` in `packages/engine/engine.js`;
   - the ↓ / S key in `bindKeys` of `packages/engine/bootstrap.js`;
   - the key legend of the intro demo in `packages/shell/shell.js`
     (`r.keys`).

   It reaches every game and changes none, since none sets the flag. Document
   it in [ENGINE.md](ENGINE.md) beside `swipeUp`. The synthetic flick is 150
   design px, more than `COMMIT_DRAG` (0.75 of a ~140 px cell), so a key
   commits the move through the same path as a finger.

1. **`CONFIG`.**

   - `gameSeconds`: not used by the levels, since a level ends on its goal;
     the playable sets it (below).
   - `layout` bands: the board is the largest square that fits in `Layout`
     above `Layout.foot`, with a margin of about three gutters for the side
     powers' strips.
   - The prototype's tunables become `CONFIG.play`.
   - `BIOMES` (§2.3: name, palette ranges, material, scene role), `MATERIALS`,
     `PREMIUM` and `POWERS` become tables of section 6.

1. **The round's scene.** The round paints its biome's scene itself, on the
   canvas, under the board: `ArtImages.sceneSoap`, `sceneJungle`…, cover-fit
   to the frame. This is holepocalypse's fairway pattern, not
   `CONFIG.sceneArt`. With per-band `background-phone-<band>` files the motor
   would drop the plain `backgroundPhone`, and the intro, the map and the menus
   must keep the soap-and-bubbles picture (§10.1). Without the art, the scene
   falls back to a soft vertical gradient in the biome's hue.

1. **The `Game` module.** Port it from `prototype/merge-2048.html`, dropping
   its loop, canvas sizing, `layout()`, HUD, buttons, keys, debug and the dark
   palette branch.

   - Port: the colour (`oklch`, `buildPalette`), the rules (`resolveLine`,
     `plan`, `doMove`, `resolveCell`), the powers (`addPower`, `pickCells`
     plus the fairness rule), the positions (`tilePos`, `placeTile`,
     `computeMagnet`, `leanGoal`, `nudgeOffset`), the drawing (`paintTile`,
     `paintPower`, `drawTargets`, `drawSides`, `drawComets`, `drawFx`) and
     the effects.
   - `later(at, fn)` stays the event queue, on the motor's clock.
   - **The sprites.** Tile sprites are sized with `view.dpr` and keyed on the
     biome, the value and the cell size. A level wears one biome, so its 17
     values are built once. They are rebuilt only when that key changes, the
     old canvas released with `freeCanvas`, never once per round. The ice and
     stone sprites follow the same rule.
   - `render()` paints the scene first, then wraps the board's ground in one
     `Enter.begin/end` and each starting tile in its own, so the board lands
     and then its seeded tiles fall onto it.
   - `onDown/onMove/onUp` carry the drag and the lean. `onResize` rebuilds the
     sprites and must not touch round state before the first `reset()`.
   - The particles are pre-drawn dots, and nothing uses `shadowBlur`.

1. **The words go through the motor** (§9):

   - what the player DID is `Pop`: `Pop.text` for the `+v` of a merge and the
     `−v` of a tile lost to a power; `Pop.show("combo")` for two or more
     merges in one move (`Double`, `Triple`, `Quad`); `Pop.show("bonus")` the
     first time a value of 128 or more is made in the round;
   - a REFUSAL is `Notify.say`: a swipe into a locked side says `Side locked`
     once per round. A plain refused move says nothing, the nudge is enough;
   - a POWER met for the first time is `Notify.learn(<power>, <name>)` and
     opens its guide page;
   - nothing is painted on the canvas but the tiles' own numbers.

1. **The HUD.** `HUD.setScore` carries the score. `HUD.setLeft` carries the
   goal (`Goal 512`) and `HUD.setRight` the moves against the par
   (`Moves 42 / 85`). The live star pill is the level layer's.

1. **Sound from the house kit**, mapped in the manifest's `sfx` (variants
   picked in `make events`):

   | key      | role     | when                                                                         |
   | -------- | -------- | ---------------------------------------------------------------------------- |
   | `slide`  | `move`   | a valid move                                                                 |
   | `merge`  | `pickup` | a merge; the rate climbs with log2 of the value (the melody, one expression) |
   | `gold`   | `bonus`  | a merge of 128 or more                                                       |
   | `refuse` | `miss`   | a refused move, a locked side                                                |
   | `target` | `warn`   | a target placed                                                              |
   | `apply`  | `power`  | a tile or side power applied                                                 |
   | `thaw`   | `burst`  | ice shattered by a merge                                                     |
   | `strike` | `crash`  | fireball, comet, bolt                                                        |
   | `smoke`  | `malus`  | purple or black smoke                                                        |
   | `swap`   | `toggle` | switch                                                                       |
   | `portal` | `launch` | a tile through the teleport wall                                             |
   | `goal`   | `goal`   | the goal tile made                                                           |
   | `stuck`  | `defeat` | no move left                                                                 |

1. **The level hooks** ([LEVELS.md](LEVELS.md)):

   - `Game.levelGoal(n)` returns the goal tile and its words (§6);
   - `Game.levelTally()` counts the stars, 0 to 3 (§6);
   - `Game.levelWon()` ends the round when the goal tile has been stamped,
     about 0.7 s after the merge, so the stamp is seen.

   The level table (`LEVELS` in game.js, read off `CONFIG.level`) gives each
   level its start board, power pool, modifier and bonus. The biome is the
   level's band. `web.levels.tune` only lerps the pressure.

1. **The art pipeline.**

   - `encode-art.mjs gelatile` for the backgrounds, the scenes, the title, the
     characters and the textures. Two roles need a profile in `profileFor`:
     `/^scene-[a-z]+$/` → the `background-phone` profile, and
     `/^texture-[a-z]+$/` → `{ w: 512, h: 512, q: 0.8 }`. Add both prefixes to
     the known roles too, so they are encoded as roles and not skipped as
     sheets.
   - `cut-objects.mjs` for every `-object-*` sheet, with the `--grid` of its
     prompt, then `--adopt`.
   - The playable carries biome 1 only: its scene and its soap texture. The
     four other scenes and textures are web-only, loaded by their biome's
     levels (`CONFIG.artLazy`).

1. **The icon.** Copy it to `assets/image/icon/gelatile.png` and cut the 320
   px thumb into `thumb/`. Leave no `logo` key once `-title.png` exists.

1. **Close.** Run `node tools/update.mjs`, then `make text` until it reads
   *fully translated*, then the definition of done (§11).

**The playable cut** (5 MB, 20–30 s):

- biome 1: the bathroom scene, the lavender tiles, the soap material;
- a seeded start board, so the first gold arrives fast: a 128, 32, 32, 16, 8
  and 4 laid in a snake in the bottom-left corner, about 50 moves to the goal;
- the goal tile is 256;
- one tile power (Freeze) and one target (Fireball);
- `gameSeconds` 45. The round ends on the goal or on the clock.

Everything else is web.

______________________________________________________________________

## 4. The five biomes — what each one brings

One biome per six levels (§2.3 for the look). Each biome brings its powers one
at a time. Its fourth level twists a rule (§6), and its sixth asks for a
bigger tile.

| biome | name (EN / FR)                      | levels | brings                                         |
| ----- | ----------------------------------- | ------ | ---------------------------------------------- |
| 1     | Bubble Bath / Bain moussant         | 1–6    | the game itself, Freeze, Stone                 |
| 2     | Jungle Lodge / Cabane de la jungle  | 7–12   | Vertical ghost, Horizontal ghost, Mystery      |
| 3     | Crystal Cave / Grotte de cristal    | 13–18  | the targets: Fireball, Purple smoke, the bolts |
| 4     | Rice Terraces / Rizières            | 19–24  | Comet, Black smoke, Switch                     |
| 5     | Coconut Beach / Plage des cocotiers | 25–30  | the sides: Teleport, Lock — then everything    |

______________________________________________________________________

## 5. The fourteen powers

Names in English and French; the French *Gel* is a pun the game keeps (frost
and jelly). The prototype's key is the guide page's id and the
`Notify.learn` id.

| key        | EN               | FR                 | kind | first level |
| ---------- | ---------------- | ------------------ | ---- | ----------- |
| `freeze`   | Freeze           | Gel                | tile | 2           |
| `stone`    | Stone            | Pierre             | tile | 3           |
| `ghostV`   | Vertical ghost   | Fantôme vertical   | tile | 7           |
| `ghostH`   | Horizontal ghost | Fantôme horizontal | tile | 8           |
| `mystery`  | Mystery          | Mystère            | tile | 9           |
| `fire`     | Fireball         | Boule de feu       | cell | 13          |
| `purple`   | Purple smoke     | Fumée violette     | cell | 14          |
| `boltV`    | Vertical bolt    | Éclair vertical    | cell | 15          |
| `boltH`    | Horizontal bolt  | Éclair horizontal  | cell | 15          |
| `comet`    | Comet            | Comète             | cell | 19          |
| `black`    | Black smoke      | Fumée noire        | cell | 20          |
| `switch`   | Switch           | Échange            | cell | 21          |
| `teleport` | Teleport         | Téléport           | side | 25          |
| `lock`     | Lock             | Verrou             | side | 26          |

In the round, the badge and the tile marks stay drawn in code (`icon()`): at
0.14 of a cell, a painted picture would not read. The painted power objects of
§10 are for the guide pages and the codex.

______________________________________________________________________

## 6. The thirty levels

**A level is a goal tile.** It is won when that tile is made
(`Game.levelWon()`), and lost when no move is left. It starts from a **seeded
board**, laid as a snake in a corner, so a high goal stays a 1–4 minute round
and the board teaches the corner strategy without a word.

**The stars are counted by the game** (`Game.levelTally()`):

- ★ — the goal tile;
- ★★ — made within the par of moves;
- ★★★ — within the par, and the level's **bonus** (last column).

A round with no move left before the goal earns no star. The score still pays
the wallet (`web.meta.roundScore`, set from the bench).

**The par** below is a first guess: moves ≈ (1.3 × goal − start sum) / 2.2,
since every move adds 2.2 to the board on average. The bench sets the real
value (§11).

**The modifiers** of the fourth level of each biome:

| modifier | rule                                                    |
| -------- | ------------------------------------------------------- |
| Clutter  | the start board also holds eight small mismatched tiles |
| Fours    | half the spawns are a `4`                               |
| Storm    | a power every 2–3 moves                                 |
| Lasting  | the powers last 8 moves instead of 5                    |
| Counted  | the par is a limit: past 1.3 × par the round is lost    |

**The pressure**, lerped over the climb by `web.levels.tune` (levels 1 → 30):

| knob                 | level 1 | level 15 | level 30 |
| -------------------- | ------- | -------- | -------- |
| `play.powerEveryMin` | 6       | 4        | 3        |
| `play.powerEveryMax` | 9       | 7        | 5        |
| `play.maxTargets`    | 1       | 2        | 3        |
| `play.fourChance`    | 0.10    | 0.12     | 0.15     |

| lv  | biome | goal | start (snake)       | par | powers                  | modifier | bonus ★★★                    |
| --- | ----- | ---- | ------------------- | --- | ----------------------- | -------- | ---------------------------- |
| 1   | 1     | 128  | two tiles           | 80  | —                       | —        | the biggest tile in a corner |
| 2   | 1     | 128  | 32, 16              | 60  | Freeze                  | —        | thaw 2 frozen tiles          |
| 3   | 1     | 256  | 64, 32              | 110 | Stone                   | —        | no stone left on the board   |
| 4   | 1     | 256  | 128 + clutter       | 75  | Freeze                  | Clutter  | 3 merges in one move         |
| 5   | 1     | 256  | 64, 32, 32          | 95  | Freeze, Stone           | —        | thaw 3 frozen tiles          |
| 6   | 1     | 512  | 128, 64, 32, 16     | 190 | Freeze, Stone           | —        | the biggest tile in a corner |
| 7   | 2     | 256  | 64, 32              | 110 | Vertical ghost          | —        | send 2 ghosts out            |
| 8   | 2     | 256  | 64, 32              | 110 | Horizontal ghost        | —        | no ghost lost above 8        |
| 9   | 2     | 512  | 128, 64, 32         | 200 | Mystery                 | —        | merge 2 mystery tiles        |
| 10  | 2     | 512  | 128, 64             | 160 | ghosts, Mystery         | Fours    | 3 merges in one move         |
| 11  | 2     | 512  | 256, 32             | 170 | biomes 1 and 2          | —        | thaw 3 frozen tiles          |
| 12  | 2     | 1024 | 512, 128, 64        | 285 | biomes 1 and 2          | —        | the biggest tile in a corner |
| 13  | 3     | 512  | 128, 64, 32         | 200 | Fireball                | —        | no tile burned               |
| 14  | 3     | 512  | 128, 64, 32         | 200 | Purple smoke            | —        | no tile halved               |
| 15  | 3     | 512  | 256, 64             | 160 | the bolts               | —        | a bolt that strikes nothing  |
| 16  | 3     | 1024 | 512, 128, 64, 32    | 270 | Fireball, smoke, bolts  | Storm    | no tile lost above 16        |
| 17  | 3     | 1024 | 512, 256            | 255 | biome 3 + Freeze, Stone | —        | no tile lost above 16        |
| 18  | 3     | 1024 | 512, 128, 64        | 285 | biomes 1 to 3           | —        | the biggest tile in a corner |
| 19  | 4     | 1024 | 512, 256, 64        | 230 | Comet                   | —        | a comet that strikes nothing |
| 20  | 4     | 1024 | 512, 256, 64        | 230 | Black smoke             | —        | no tile halved               |
| 21  | 4     | 1024 | 512, 256, 128       | 200 | Switch                  | —        | a merge right after a switch |
| 22  | 4     | 1024 | 512, 256, 64        | 230 | biome 4                 | Lasting  | thaw 3 frozen tiles          |
| 23  | 4     | 1024 | 512, 256            | 255 | biomes 3 and 4          | —        | no tile lost above 32        |
| 24  | 4     | 2048 | 1024, 512, 256, 128 | 340 | biomes 1 to 4           | —        | the biggest tile in a corner |
| 25  | 5     | 1024 | 512, 256, 64        | 230 | Teleport                | —        | 5 tiles through the portal   |
| 26  | 5     | 1024 | 512, 256, 64        | 230 | Lock                    | —        | no move refused              |
| 27  | 5     | 1024 | 512, 256            | 255 | the sides + biome 4     | —        | 4 merges in one move         |
| 28  | 5     | 1024 | 512, 256, 128       | 200 | all                     | Counted  | no tile lost above 32        |
| 29  | 5     | 2048 | 1024, 512, 256, 128 | 340 | all                     | —        | no tile lost above 64        |
| 30  | 5     | 2048 | 1024, 512, 256, 64  | 365 | all                     | —        | the biggest tile in a corner |

*The biggest tile in a corner* and the other "at the end" bonuses are read at
the moment the goal tile is made, since the round ends there.

**After level 30**, the star above it starts the endless run: 2048 from two
tiles, every power, no goal. The biome moves to the next one (tiles, material
and scene together) each time a new biggest tile from 256 up is made, with the
prototype's crossfade (`prevPalIdx`, `palT0`), and the scene crossfades with
it. The run is scored on its best score.

______________________________________________________________________

## 7. The guide and the notices

`Game.guide.chapters()`, every page illustrated with a mini board drawn by the
round's own renderer, its `ctx` lent for the call. A picture shows the rule
before two or three short lines tell it ([CLAUDE.md](../CLAUDE.md#the-guide)).

| chapter     | pages (id, level)                                                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Basics      | `swipe` 1, `merge` 1, `corner` 1, `preview` (the lean and its cancel) 1, `magnet` 1, `gold` (the premium tiles) 1, `values` (every value of the biome, the old *All values*) 1, `stars` 1 |
| Biomes      | `bath` 1, `jungle` 7, `crystal` 13, `rice` 19, `beach` 25 — each page its scene and its tile strip                                                                                        |
| Tile powers | `freeze` 2, `stone` 3, `ghostV` 7, `ghostH` 8, `mystery` 9                                                                                                                                |
| Targets     | `target` (how a target reads and strikes) 13, `fire` 13, `purple` 14, `boltV` 15, `boltH` 15, `comet` 19, `black` 20, `switch` 21                                                         |
| Sides       | `teleport` 25, `lock` 26                                                                                                                                                                  |
| Twists      | `clutter` 4, `fours` 10, `storm` 16, `lasting` 22, `counted` 28                                                                                                                           |

`Notify.learn` names each power and each twist the first time the round meets
it, on its page id. A new biome needs no notice: the new place is the news.

______________________________________________________________________

## 8. The meta layer, the village, the codex

### 8.1 The twenty stickers

Eleven common, five rare, two epic and two legendary, like the other games. A
sticker's name is a proper noun and is never translated. Twelve come off the
map (`awards`), in this order: biomes 1 to 5 passed (each one's own object),
biomes 1 to 5 passed clean, all 30 cleared, ninety of ninety. One legendary
(Gelo Crown) stays out of `awards`, so the machine can roll one.

| #   | name          | rarity    | how it is earned      |
| --- | ------------- | --------- | --------------------- |
| 1   | First Merge   | common    | machine               |
| 2   | Wobble        | common    | machine               |
| 3   | Rubber Duck   | common    | biome 1 passed        |
| 4   | Bamboo Sprout | common    | biome 2 passed        |
| 5   | Ice Cube      | common    | biome 3 passed        |
| 6   | Paper Lantern | common    | biome 4 passed        |
| 7   | Coconut       | common    | biome 5 passed        |
| 8   | Bubble Pop    | common    | machine               |
| 9   | Corner King   | common    | biome 1 passed clean  |
| 10  | Stone Face    | common    | machine               |
| 11  | Mystery Box   | common    | machine               |
| 12  | Fireball      | rare      | biome 2 passed clean  |
| 13  | Purple Haze   | rare      | machine               |
| 14  | Thunder Jelly | rare      | biome 3 passed clean  |
| 15  | Comet Crash   | rare      | biome 4 passed clean  |
| 16  | Portal Hop    | rare      | biome 5 passed clean  |
| 17  | Golden 128    | epic      | machine               |
| 18  | Rainbow 2048  | epic      | all 30 levels cleared |
| 19  | Gelo Crown    | legendary | machine only          |
| 20  | Holo 4096     | legendary | ninety of ninety      |

`"awards": [3, 4, 5, 6, 7, 9, 12, 14, 15, 16, 18, 20]`.

### 8.2 The village

The village belongs to the menus' world of soap and bubbles.
`-background-home.png` is a giant, cosy bathroom seen as a little town, with
six empty soap dishes lying on the floor as pads. The six houses of
`-object-home.png` (3x2) stand on them, composed in `make village`:

| house         | role         |
| ------------- | ------------ |
| Soap Shop     | `shop`       |
| Duck Podium   | `ranking`    |
| Mirror Map    | `map`        |
| Bath Salt Jar | `collection` |
| Gift Basket   | `daily`      |
| Tap Workshop  | `options`    |

### 8.3 The codex

Optional for 1.0, through `Game.codex`. It would have two books: *Powers* (the
fourteen, a card had once met) and *Biomes* (the five tile strips 2 → 2048 on
their scene, had once their first level is opened). Its door would be the
village role `cards`.

______________________________________________________________________

## 9. The words — where each one goes

| it is…                                  | where          | examples                                        |
| --------------------------------------- | -------------- | ----------------------------------------------- |
| the value a merge pays or a power costs | `Pop.text`     | `+256` over the tile, `−64` in red              |
| a moment the player made                | `Pop.show`     | `Double`, `Triple` (`combo`); `512!` (`bonus`)  |
| a move refused                          | `Notify.say`   | `Side locked` (`warn`), once per round          |
| a power or twist met the first time     | `Notify.learn` | `Freeze`, sub `Merge a twin into it to thaw it` |
| a rule                                  | `Game.guide`   | every page of §7                                |

Copy follows the `write-copy` skill, with vipera's guide as the reference, in
British English, and the French is adapted with `adapt-fr`, never calqued.

______________________________________________________________________

## 10. The assets — the list and a prompt for each

**Already done:** the three faces of Gelo (the user's), and three of the grey
textures in `fusionMania/`. **Everything else is below, one complete prompt
each**, to be pasted alone. The artwork is the user's to generate: never draw
a placeholder for any of it.

**Two worlds, one thread.** The intro, the map, the menus, the village and the
desktop bands are one world of soap foam and bubbles. The round is the
biome's own scene. Every scene is light, so the board and the light tile
palettes read over it. **The soap bubbles are the thread between them**: each
biome scene carries a few, at its edges and never behind the board, so a
jungle, a cave or a beach still belongs to the same game as its menus.

| what                                | file (`assets/image/master/` unless said)             | cut                                                 | roles (`CONFIG.art.…`)       | prompt    |
| ----------------------------------- | ----------------------------------------------------- | --------------------------------------------------- | ---------------------------- | --------- |
| end screen character, three faces   | `gelatile-character-{sad,neutral,happy}.png`          | —                                                   | `characterSad`, …            | done      |
| tile materials: soap, wood, crystal | `gelatile-texture-{soap,wood,crystal}.png`            | — (texture profile, §3 step 10)                     | `textureSoap`, …             | done      |
| tile materials: bamboo, sand        | `gelatile-texture-{bamboo,sand}.png`                  | — (texture profile)                                 | `textureBamboo`, …           | 10.1–10.2 |
| the five round scenes               | `gelatile-scene-{bath,jungle,crystal,rice,beach}.png` | — (scene profile, §3 step 10)                       | `sceneBath`, …               | 10.3–10.7 |
| intro, map and end screen backdrop  | `gelatile-background-phone.png`                       | —                                                   | `backgroundPhone`            | 10.8      |
| desktop bands                       | `gelatile-background-desk.png`                        | —                                                   | `backgroundDesk`             | 10.9      |
| village hub                         | `gelatile-background-home.png`                        | —                                                   | `backgroundHome`             | 10.10     |
| logotype                            | `gelatile-title.png`                                  | —                                                   | `title`                      | 10.11     |
| village houses, 3x2                 | `gelatile-object-home.png`                            | `--grid 3x2`                                        | `home01`–`06`                | 10.12     |
| stickers, 5x4                       | `gelatile-object-sticker.png`                         | `--grid 5x4 --solid 250 --pad 80 --margin 30 --seq` | `sticker01`–`20`             | 10.13     |
| menu decor objects, 4x2             | `gelatile-object-decor.png`                           | `--grid 4x2 --as decor`                             | `decor01`–`08` (the pool)    | 10.14     |
| power objects, 7x2                  | `gelatile-object-power.png`                           | `--grid 7x2`                                        | `power01`–`14`               | 10.15     |
| app icon                            | `assets/image/icon/gelatile.png` (+ `thumb/`)         | —                                                   | the site card                | 10.16     |
| music, one track in six sections    | `assets/audio/music/gelatile.mp3`                     | `embed/` for the web, 30 s of it in the playable    | `web.music`, `ASSETS.sounds` | 10.17     |

**Three textures of `fusionMania/` are kept and filed under these names.** The
five others (gem, marble, brushed metal, leather, hexagons) are not used, and
the folder goes once these three are filed:

| file in `fusionMania/`                              | filed as                       | biome |
| --------------------------------------------------- | ------------------------------ | ----- |
| `Bulles en suspension sur gel brillant.png`         | `gelatile-texture-soap.png`    | 1     |
| `Texture de bois monochrome en niveaux de gris.png` | `gelatile-texture-wood.png`    | 2     |
| `Texture cristalline monochrome facettée.png`       | `gelatile-texture-crystal.png` | 3     |

The board, the tiles, the powers' marks, the targets and the HUD are drawn by
the game. **The sounds are not generated**: they are roles of the house kit
(§3 step 8).

### 10.1 Bamboo material — `gelatile-texture-bamboo.png` \*

```text
A seamless tileable square texture, 1024x1024, strictly monochrome greyscale with no colour at all: a tightly woven bamboo mat seen straight from above, flat strips of split bamboo crossing over and under each other in a regular basket weave, fine fibres and small node marks along the strips. Evenly lit with no light direction and no shadow gradient across the picture, an average tone of middle grey, medium contrast, the same density of detail everywhere so it repeats without visible seams. A flat material texture only, filling the whole square edge to edge. No objects, no characters, no text, no letters, no numbers. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.2 Sand material — `gelatile-texture-sand.png` \*

```text
A seamless tileable square texture, 1024x1024, strictly monochrome greyscale with no colour at all: fine beach sand seen straight from above, shaped into soft wavy ripples left by the wind, tiny grains visible on the ripples, a few very small shell fragments pressed into the sand. Evenly lit with no light direction and no shadow gradient across the picture, an average tone of middle grey, medium contrast, the same density of detail everywhere so it repeats without visible seams. A flat material texture only, filling the whole square edge to edge. No objects, no characters, no text, no letters, no numbers. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.3 Biome 1 scene, the bathroom — `gelatile-scene-bath.png` \*

```text
A portrait 9:16 background illustration, 1080x1920, the setting of a casual mobile puzzle game about jelly tiles: a funny, cute bathroom seen from the front, bright and light. Pastel lilac and white tiles on the wall, a pastel clawfoot bathtub overflowing with fluffy white soap foam along the bottom of the picture, a cheerful yellow rubber duck on the tub's rim, a pink bar of soap on a little dish, a round mirror and a towel hook near the top corners, big glossy soap bubbles resting on the foam and drifting near the side edges and the top, never in the calm middle; the soap bubbles are part of the scenery, the soap-bubble theme every biome of the game shares. The whole middle of the picture, from about a quarter to three quarters of the height and across most of the width, is a calm, plain, light lilac tiled wall with very little detail, because a square game board covers it; the fun details live in the top fifth, the bottom fifth and the narrow side edges. Light, airy, pastel lavender palette with touches of yellow and pink, soft daylight. No characters, no faces, no text, no letters, no numbers, no game board. Glossy cartoon jelly style: soft translucent gel and soap surfaces with bright specular highlights, rounded shapes, gentle candy colours, thin darker outlines, soft cel shading. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.4 Biome 2 scene, the jungle — `gelatile-scene-jungle.png` \*

```text
A portrait 9:16 background illustration, 1080x1920, the setting of a casual mobile puzzle game about jelly tiles: a wooden treehouse deck in a sunny jungle, seen from the front, bright and light. Pale warm wooden planks across the bottom of the picture, a wooden railing, big glossy tropical leaves and hanging vines framing the top and the side edges, soft green foliage in the far distance, sunbeams through the leaves. A few glossy soap bubbles with soft iridescent lilac and aqua reflections are part of the scenery, the soap-bubble theme every biome of the game shares: two or three small clusters, resting on the ground and drifting near the side edges and the top, never in the calm middle; they are drawn as part of the place, at its own scale and in its own light. The whole middle of the picture, from about a quarter to three quarters of the height and across most of the width, is a calm, plain, light area of pale sunlit foliage and soft sky with very little detail, because a square game board covers it; the details live in the top fifth, the bottom fifth and the narrow side edges. Light, fresh palette of pale lime, soft greens and honey wood, warm daylight. No characters, no animals, no faces, no text, no letters, no numbers, no game board. Glossy cartoon style: soft surfaces with bright specular highlights, rounded shapes, gentle saturated colours, thin darker outlines, soft cel shading. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.5 Biome 3 scene, the crystal cave — `gelatile-scene-crystal.png` \*

```text
A portrait 9:16 background illustration, 1080x1920, the setting of a casual mobile puzzle game about jelly tiles: a bright crystal cave in winter, seen from the front, light and luminous rather than dark. Clusters of pale ice-blue and soft periwinkle crystals rising from a floor of fresh white snow along the bottom of the picture, icicles and more crystals hanging along the top, a wide opening at the back letting in cold white daylight that fills the cave. A few glossy soap bubbles with soft iridescent lilac and aqua reflections are part of the scenery, the soap-bubble theme every biome of the game shares: two or three small clusters, resting on the ground and drifting near the side edges and the top, never in the calm middle; they are drawn as part of the place, at its own scale and in its own light. The whole middle of the picture, from about a quarter to three quarters of the height and across most of the width, is a calm, plain, light area of pale frosted ice wall with very little detail, because a square game board covers it; the crystals live in the top fifth, the bottom fifth and the narrow side edges. Light, cool palette of white, ice blue and soft periwinkle, bright wintry daylight. No characters, no animals, no faces, no text, no letters, no numbers, no game board. Glossy cartoon style: translucent crystal and ice surfaces with bright specular highlights, rounded shapes, gentle colours, thin darker outlines, soft cel shading. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.6 Biome 4 scene, the rice terraces — `gelatile-scene-rice.png` \*

```text
A portrait 9:16 background illustration, 1080x1920, the setting of a casual mobile puzzle game about jelly tiles: rice terraces in the morning under gentle Asian mountains, seen from the front, bright and light. Curved green rice terraces stepping down along the bottom of the picture, soft misty mountain peaks in the far distance near the top, a cherry tree in pink blossom leaning in from one side edge, a small red wooden bridge tucked in a bottom corner. A few glossy soap bubbles with soft iridescent lilac and aqua reflections are part of the scenery, the soap-bubble theme every biome of the game shares: two or three small clusters, resting on the ground and drifting near the side edges and the top, never in the calm middle; they are drawn as part of the place, at its own scale and in its own light. The whole middle of the picture, from about a quarter to three quarters of the height and across most of the width, is a calm, plain, light area of soft morning mist and pale sky with very little detail, because a square game board covers it; the details live in the top fifth, the bottom fifth and the narrow side edges. Light, soft palette of misty white, sakura pink and fresh green with a touch of red, gentle morning light. No characters, no people, no faces, no text, no letters, no numbers, no game board. Glossy cartoon style: soft surfaces with bright specular highlights, rounded shapes, gentle colours, thin darker outlines, soft cel shading. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.7 Biome 5 scene, the beach — `gelatile-scene-beach.png` \*

```text
A portrait 9:16 background illustration, 1080x1920, the setting of a casual mobile puzzle game about jelly tiles: a sunny tropical beach, seen from the front, bright and light. Pale golden sand along the bottom of the picture with a few seashells and a half coconut, two coconut palms leaning in from the side edges with their leaves across the top corners, a calm turquoise sea and a pale sky near the top. A few glossy soap bubbles with soft iridescent lilac and aqua reflections are part of the scenery, the soap-bubble theme every biome of the game shares: two or three small clusters, resting on the ground and drifting near the side edges and the top, never in the calm middle; they are drawn as part of the place, at its own scale and in its own light. The whole middle of the picture, from about a quarter to three quarters of the height and across most of the width, is a calm, plain, light area of pale turquoise shallow water and soft sky with very little detail, because a square game board covers it; the details live in the top fifth, the bottom fifth and the narrow side edges. Light, sunny palette of pale aqua, turquoise and soft sand, bright midday light. No characters, no people, no animals, no faces, no text, no letters, no numbers, no game board. Glossy cartoon style: soft surfaces with bright specular highlights, rounded shapes, gentle saturated colours, thin darker outlines, soft cel shading. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.8 Intro, map and end screen backdrop — `gelatile-background-phone.png` \*

```text
A portrait 9:16 background illustration, 1080x1920, for a casual mobile puzzle game about jelly tiles: a dreamy world of soap foam and bubbles. Soft rolling hills of fluffy white soap foam along the bottom of the picture, large glossy soap bubbles with gentle iridescent lilac, aqua and pink reflections resting on the foam and rising from it, a pale lavender-to-aqua sky above. The soap bubbles are the subject of the picture. The middle of the picture is calm and uncluttered, with soft, light, low-contrast shapes, because a character, a map and text are laid over it; the bigger bubbles sit along the bottom and the far edges. Light, airy pastel palette of white, lavender, aqua and a touch of pink. No characters, no faces, no text, no letters, no numbers, no game board. Glossy cartoon style: soft translucent soap surfaces with bright specular highlights, rounded shapes, gentle candy colours, thin darker outlines, soft cel shading. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.9 Desktop bands — `gelatile-background-desk.png` \*

```text
A wide 16:9 background illustration, 1920x1080, for a casual mobile puzzle game about jelly tiles, shown on a desktop around a phone-shaped frame standing in the middle: a dreamy world of soap foam and bubbles. Soft rolling hills of fluffy white soap foam along the bottom of the picture, large glossy soap bubbles with gentle iridescent lilac, aqua and pink reflections resting on the foam and rising from it, a pale lavender-to-aqua sky above. The soap bubbles are the subject of the picture. The central third of the picture is empty and calm, plain sky and soft foam, because the game frame covers it; the bigger bubbles and the detail sit on the left and right thirds. Light, airy pastel palette of white, lavender, aqua and a touch of pink. No characters, no faces, no text, no letters, no numbers, no game board. Glossy cartoon style: soft translucent soap surfaces with bright specular highlights, rounded shapes, gentle candy colours, thin darker outlines, soft cel shading. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.10 Village hub — `gelatile-background-home.png` \*

```text
A portrait 9:16 background illustration, 1080x1920, the home village of a casual mobile puzzle game about jelly tiles, seen from a slightly high three-quarter view: a giant, cosy bathroom seen as a little town. A floor of big pastel lilac and white tiles with winding paths of soft white soap foam between them, a bathtub at the top of the picture used as a small lake full of foam, a few glossy soap bubbles resting on the floor, pale lavender walls fading into a soft aqua light at the top. On the floor there are six empty round soap dishes lying flat, clearly visible and spread over the picture so that a building can stand on each one later: two in the upper middle, two in the middle, two in the lower part, none of them closer than a dish's width to another and none touching the edges. The dishes are empty: no buildings, no houses, no objects on them. No characters, no faces, no text, no letters, no numbers. Light, airy pastel palette of white, lavender, aqua and a touch of pink. Glossy cartoon style: soft translucent soap surfaces with bright specular highlights, rounded shapes, gentle candy colours, thin darker outlines, soft cel shading. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.11 Logotype — `gelatile-title.png` \*

```text
A game logotype reading exactly "GELATILE", one word, in big chunky rounded letters made of glossy translucent jelly: each letter a soft gel shape in sky blue with a lighter top face, bright white specular highlights, a few tiny air bubbles inside, a thin dark-blue outline and a soft darker-blue bevel at the bottom so the word reads on any background. A soft cap of white soap foam sits on top of three of the letters. The letters sit on one slightly arched line and wobble a little, as if squished, all at the same size. The letter "I" is a small rounded square jelly tile in pale lavender instead of a stroke. Correct spelling, every letter clearly readable, no other text. Glossy cartoon jelly style for a casual mobile puzzle game, gentle candy colours, clean edges. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 10.12 Village houses, 3x2 — `gelatile-object-home.png` \*

```text
A sprite sheet of six small cartoon buildings for the home village of a casual mobile puzzle game about jelly tiles, a village set in a giant bathroom, arranged in a strict grid of 3 columns and 2 rows, each building centred in its own cell with wide empty space between the cells, all at the same scale, all seen from the same slightly high three-quarter front view, soft light from the top left, each one standing on its own flat base. Row 1, left to right: a soap shop, a small shop shaped like a big pink bar of soap with a striped lilac and white awning and a round window; a duck podium, a golden rubber duck trophy standing on a three-step podium; a mirror map, a round bathroom mirror on a little stand with a winding road map drawn on its glass. Row 2, left to right: a bath salt jar, a big glass jar with a lavender lid, full of colourful sticker sheets; a gift basket, a wicker basket full of wrapped gift boxes with ribbons; a tap workshop, a small hut shaped like a chrome bath tap, with a round door and a cog on its side. No characters, no faces, no text, no letters, no numbers. Glossy cartoon style: soft soap, glass and chrome surfaces with bright specular highlights, rounded shapes, gentle candy colours, thin darker outlines, soft cel shading. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 10.13 Stickers, 5x4 — `gelatile-object-sticker.png` \*

```text
A sheet of twenty collectible sticker illustrations for a casual mobile puzzle game about jelly tiles, arranged in a strict grid of 5 columns and 4 rows, each illustration centred in its own cell with wide empty space between the cells, all at the same scale and the same front view, soft light from the top left. The game's hero, Gelo, appears in some of them: a cute glossy sky-blue jelly cube with rounded corners, a translucent gel body with a few tiny air bubbles inside, large glossy dark-blue eyes with white highlights, short dark-blue eyebrows, soft pink blush on the cheeks and a small open smile; he has no arms, no legs and no hands. Row 1, left to right: two small blue jelly cubes squishing together into one; Gelo squashed sideways in a big wobble, laughing; a cheerful yellow rubber duck; a fresh green bamboo sprout with two leaves; a pale-blue jelly cube inside a clear ice shell with white frost cracks. Row 2, left to right: a round red paper lantern with a gold top and tassel; a brown coconut with a straw in it; a big glossy soap bubble bursting into round droplets; Gelo wearing a tiny golden crown, sitting snug in the corner of a game board; a grey stone block tile with a grumpy carved face. Row 3, left to right: a grey rounded square tile with a big white question mark; an orange cartoon fireball with a determined face; a puff of purple smoke with sleepy eyes; a lemon-yellow jelly cube with a cartoon lightning bolt on its front; a cyan comet with a short tail landing on a 2x2 block of tiles. Row 4, left to right: a blue jelly cube half through a swirling cyan portal ring; a gold-rimmed rounded square tile showing the number 128; a rounded square tile with a rainbow rim showing the number 2048; Gelo wearing a royal crown and a red velvet cape, proud; a holographic iridescent rounded square tile showing the number 4096. Every number is drawn correctly and clearly. Each illustration is a die-cut vinyl sticker: a thick, even, pure white border runs all around its outline, the same width on every sticker, with a very soft grey edge on the outside of the white so it reads on a white page, and nothing else behind it; the stickers never touch each other. Glossy cartoon jelly style: soft translucent gel surfaces with bright specular highlights, rounded shapes, saturated candy colours, thin darker outlines, soft cel shading. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 10.14 Menu decor objects, 4x2 — `gelatile-object-decor.png` \*

```text
A sprite sheet of eight small bath-time objects for the menus of a casual mobile puzzle game about jelly tiles, arranged in a strict grid of 4 columns and 2 rows, each object centred in its own cell with wide empty space between the cells, all at the same scale, the same three-quarter front view, soft light from the top left. Row 1, left to right: a cheerful yellow rubber duck; a pink bar of soap with a little cap of foam; a round yellow bath sponge; a toothbrush with lilac bristles lying at an angle. Row 2, left to right: a round lavender bath bomb; a rounded aqua shampoo bottle with a pump and a blank label; a folded fluffy white towel; a small lavender jelly cube with no face. No characters, no faces, no text, no letters, no numbers. Glossy cartoon style: soft soap, rubber and gel surfaces with bright specular highlights, rounded shapes, gentle candy colours, thin darker outlines, soft cel shading. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 10.15 Power objects, 7x2 — `gelatile-object-power.png` \*

```text
A sprite sheet of fourteen power-up objects for a casual mobile puzzle game about jelly tiles, arranged in a strict grid of 7 columns and 2 rows, each object centred in its own cell with wide empty space between the cells, all at the same scale, the same three-quarter front view, soft light from the top left. Row 1, left to right: a pale-blue block of clear ice with white frost cracks; a round grey boulder with chipped edges; a translucent lavender jelly cube with two chevrons pointing up and down on its front; the same translucent lavender jelly cube with two chevrons pointing left and right; a grey rounded cube with a big white question mark; an orange cartoon fireball with a short flame trail; a round puff of purple smoke. Row 2, left to right: a cyan comet with a short bright tail; a round puff of dark grey-violet smoke; a lemon-yellow lightning bolt standing upright; the same lemon-yellow lightning bolt lying horizontally; two curved teal arrows chasing each other in a circle; a swirling cyan portal ring; a red padlock, closed. The flame, the smoke, the comet tail and the lightning are part of each object and stay inside its own outline. No characters, no faces, no text, no letters, no numbers. Glossy cartoon jelly style: soft translucent gel surfaces with bright specular highlights, rounded shapes, saturated candy colours, thin darker outlines, soft cel shading. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 10.16 App icon — `assets/image/icon/gelatile.png`

```text
A 1024x1024 mobile app icon for a casual puzzle game about jelly tiles, shaped as a rounded square: the four corners are generously rounded and the edges are soft and slightly bevelled, like a glossy jelly tile, and the area outside the rounded square is empty. In the middle, large and filling about two thirds of the square, Gelo, a cute glossy sky-blue jelly cube with rounded corners, slightly tilted, a translucent gel body with a few tiny air bubbles inside, large glossy dark-blue eyes with white highlights, short dark-blue eyebrows, soft pink blush on the cheeks and a small open happy smile; he has no arms, no legs and no hands. A soft cap of white soap foam sits on top of his head. Behind him, two smaller rounded square jelly tiles peek out from the lower corners, one pale lavender and one pale aqua. Inside the rounded square, the background is a smooth vertical gradient from soft lavender at the bottom to pale aqua at the top. No text, no letters, no numbers. Glossy cartoon jelly style: soft translucent gel surfaces with bright specular highlights, rounded shapes, gentle candy colours, thin darker outlines, soft cel shading, bold and readable at small sizes. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 10.17 Music — `assets/audio/music/gelatile.mp3` \*

```text
Instrumental background music for a calm, cheerful casual mobile puzzle game about jelly tiles. 100 BPM, steady and exact tempo, 4/4, about three minutes, one melody that runs through the whole track. Six clear sections of about 30 seconds each, the same theme in a new colour each time: first a calm, slower bubbly section with soft glockenspiel and gentle water-drop plops, to serve as the menu bed; then a playful bathroom section with marimba, pizzicato strings and bubbly synth pops; then a jungle section with wooden marimba, light hand drums and shakers; then a winter crystal cave section with celesta, music box and soft chimes; then an Asian rice terrace section with a pentatonic koto melody and a bamboo flute; then a sunny beach section with ukulele, steel drum and light bongos. Warm, sunny and relaxing, never tense, every section loops comfortably. No vocals, no sudden drops, no loud transitions.
```

Cut it into sections as [MUSIC.md](MUSIC.md) describes: the first section is
the menu bed (`CONFIG.music.menu`), and the five others are one per biome,
moved with the biome in `reset()`. Measure the BPM rather than trusting the
prompt (generated tracks miss it).

______________________________________________________________________

## 11. Definition of done

[CLAUDE.md's list](../CLAUDE.md#definition-of-done-for-a-new-game) applies
whole. On top of it, for this game:

- [ ] Swipe, drag and the four arrow keys play the same move through one input
  path; a slow drag leans and a return to the start cancels.
- [ ] A move fired mid-slide or mid-lean never makes a tile jump.
- [ ] The magnet is discreet for twins side by side, and visible for twins
  with empty cells between them.
- [ ] Every target reads as the GRID being aimed at: everything under the
  tiles, the badge at the top-right crossing, never cut on the rim.
- [ ] No target is ever unavoidable for the biggest tile (§2.6).
- [ ] Each of the five biome palettes reads as a climb from 2 to 2048 over its
  own scene, no tile colour recalls the classic 2048 climb, and every number
  is readable on its tile, gold included.
- [ ] The intro, the map, the menus and the village wear the soap-and-bubbles
  world, and the round wears its biome's scene.
- [ ] Tile sprites are cached on the biome, the value and `view.dpr`, and
  rebuilt only when that key changes. No `ctx.filter` and no `shadowBlur` per
  frame.
- [ ] **The thirty levels are benched**: a corner-strategy pilot (down and
  left first, then right, then up) and a better depth-2 pilot, at least 12
  seeds a level, driving the round headless with `Enter.skip()`. Every level
  must be cleared at one star by the plain pilot in most seeds, and at three
  stars by the better one. The par is set from the better pilot's median
  moves × 1.1.

______________________________________________________________________

## 12. What is not decided yet

- **Undo.** It is gone from the game for now. It could come back as a shop
  booster counted in uses (three undos for a price derived from the ticket),
  which would also be a coin sink.
- **Gelo in the round.** For now he stays off the board. One option is that
  the round's `2` tiles wear a tiny face of his, from a painted sheet.
- **The power cadence.** It is random within the level's window, like the
  prototype. The alternative is a scripted list of arrivals per level, which
  makes the bench exact and the levels authored.
- **Android.** It comes later, like every game: `targets` gains `android`
  once the web build is benched.

______________________________________________________________________

## 13. What the first build decided

**The assets** arrived as `gelatile/` at the repo root with the image model's
French names and were filed under the names of §10. The cut-outs (the three
faces, the logotype, the icon and the three sheets) carried a faint haze of
low alpha round them, the decor sheet a strong glow (30 % of its pixels
semi-transparent): every alpha under a threshold (40, the decor 100) was
zeroed and the edge ramped back to full on 200 before filing. The five unused
textures (gem, leather, marble, metal, hexagons) were left in `gelatile/`.

**The pipeline gained two things**: `encode-art.mjs` knows the `scene-<biome>`
role (a phone background) and the `texture-<name>` role (512 px), and
`build.mjs` keeps the four later biomes' scenes and materials out of the
playable (`WEB_ONLY_GEL`). The motor gained `CONFIG.swipeDown` (§3 step 2).

**The balance was benched**, eight seeds a level, with a two-ply pilot that
keeps a snake in the bottom-left corner, reads the targets and avoids a
ghost's exit (the bench harness is not in the repo; the screenshot pilot in
`tools/lab/shoot-screens.mjs` is its one-ply cousin). What it changed:

- **The fairness rule covers every big tile**, not only the biggest: a harmful
  target is never placed where every valid move lands a tile of at least a
  sixteenth of the biggest (8 and up) on it, and a power that finds no fair
  place is not dropped. With the biggest alone protected, a comet or a bolt
  every five moves destroyed more than a move adds (2.2 a move on average) and
  the board never grew. **Since v0.3.0 the bolts aim** at the lines holding the most
  weight (a line's chance is 0.5 plus its tiles' share of the biggest), under
  the same rule: the threat is real, and a move that saves every big tile
  always exists.
- **The switch never picks a big tile**; it swaps small tiles or empty cells.
- **A side power never takes a wall the biggest tile leans on**, and the next
  power waits five more moves after one; a lock that is all that stands
  between the board and a move breaks instead of ending the round.
- **Storm moved to level 10** (tile powers, nothing destroyed) at one power
  every three or four moves, and **Fours to level 16**, where four destructive
  powers left a storm board treading water for a thousand moves.
- **The pressure** is `powerEveryMin` 6 → 4, `powerEveryMax` 9 → 7,
  `maxTargets` 1 → 2, `fourChance` 0.10 → 0.14 (`web.levels.tune`).
- **The seeded boards of the 1024 and 2048 levels are one or two tiles
  stronger** than §6 (512, 256, 128 and up), and **every par is the pilot's
  median winning moves × 1.15**. Levels 1–15 are won by the pilot in 6 to 8
  seeds of 8; the late levels in 4 to 6, the finale (30) the hardest.
- Level 22's bonus is *lose no tile above 32*: its pool (comet, black smoke,
  switch) has no ice to thaw.

**The playable has no clock**: `gameSeconds` is 0 so a level never times out
on the web, and the free round ends on its 256 (25–55 moves for the pilot) or
when no move is left.

**Still owed**: a playtest of the thirty levels on a phone (the balance is a
pilot's), and the village composed by eye in `make village` (the six houses
stand on the six soap dishes from coordinates read off the picture).

## 14. The two village modes (v0.2.0)

Two houses float in the village's bathtub, beside the climb: each one arms a
key of `web.modes` (`["levels", "classic", "fast"]`) and starts a free round
on biome 1, the bathroom, with **no power and no target**.

- **Classic** (the duck, `decor01`): no goal, no par, no clock. The round runs
  until no move is left and the score is all that counts. Stars by the
  biggest tile: 512, 1024, 2048. The record is the best score, armed as the
  round's `Record`.
- **Fast** (the bath bomb, `decor05`): the goal is 2048 and the HUD's right
  pill is a clock, started on the first move and stopped on the 2048's stamp.
  **A new tile is two notches under the biggest one** — `top / 8`, or
  `top / 4` one time in ten (the usual four's odds), never under 2 and 4: 128
  deals 16 and 32, 1024 deals 128 and 256 (`spawnValue`). Three stars for a
  new best time, two for a slower 2048, one for a lost board that reached
  1024\. A pilot sim (20 seeds) reaches 2048 in about 110 moves against about
  960 for a classic board, and wins 12 of 20, against 14 for classic: a
  jump of the biggest tile strands the smaller tiles already on the board.

Their records live outside the climb, in `gelatile:classic` and
`gelatile:fast` (`{ best, time, tile, rounds }`), shown by the ranking's MODES
tab through `Game.records()` and erased by OPTIONS through `Game.wipe()`. The
houses reuse two adopted decor cuts: a pair of dedicated objects is a swap of
`art` in `web.village`.

Both modes pay coins on their score like any round. The fast mode's score
runs high for its length (about 16 000 in 110 moves, since merging spawned
128s and 256s is worth a lot) — the one thing to watch if it becomes the
cheapest coin source.
