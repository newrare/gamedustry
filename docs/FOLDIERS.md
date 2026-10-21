# FOLDIERS — from the prototype to the game

The plan of record for a new game: a slow conquest of the world played in
**ticks**, against the game, on a map made of cut paper with origami armies
standing on it. Nothing is built yet: the mechanic is validated by
`prototype/conquest-ticks.html`, the look by `lab/conquest-paper.html`, and
three asset sheets are already filed.

Everything a session needs to build it is here: the rules the prototype
validated, the tick and why it is the difficulty, how the round's simulation
is written, the look and the five biomes, the maps, the steps on
the motor, the thirty stages with one new mechanic each, the meta layer, and
one complete prompt for every asset still to make.

______________________________________________________________________

## 0. Where things are

| what                                      | where                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| the rules prototype (plain shapes)        | [`prototype/conquest-ticks.html`](../prototype/conquest-ticks.html) — stage 1, the tick and its clock cheats |
| the ten first looks (shaded maps, arrows) | [`lab/conquest-map.html`](../lab/conquest-map.html)                                                          |
| ink wash, arrows by action                | [`lab/conquest-ink.html`](../lab/conquest-ink.html) — Front, Chevrons, Tracks                                |
| **the look that ships**: paper and camera | [`lab/conquest-paper.html`](../lab/conquest-paper.html) — preset *Close 30°*, ocean *Teal*                   |
| the three sheets already generated        | `assets/image/master/foldiers-object-{army-blue,army-red,scenery}.png` — **done, do not regenerate**         |
| their temporary cuts, for the lab only    | `lab/conquest-paper/{blue,red,object}-NN.png` — the game cuts its own with `cut-objects.mjs --grid 4x4`      |
| the game, once built                      | `games/foldiers/`                                                                                            |

**Slug:** `foldiers`. **Name:** *Foldiers* — *fold* + *soldiers*, the paper
army; *to fold* is also what a player does at poker when they give up, and
what an army does when it breaks. **Store subtitle:** *Foldiers: Paper
Conquest*.

______________________________________________________________________

## 1. The game in one sentence

You command a paper army on a world cut out of paper: draw orders from your
regions to their neighbours, send them before the tick runs out, and every
army on the map moves at once.

- **Intro tagline (EN):** `Draw your <b class="w-orders">orders</b>, send them before the <b class="w-tick">tick</b> ends and conquer the <b class="w-map">map</b>.`
- **Intro tagline (FR):** `Trace tes <b class="w-orders">ordres</b>, envoie-les avant la fin du <b class="w-tick">tick</b> et conquiers la <b class="w-map">carte</b>.`
- **Tags (EN):** strategy, conquest, origami. **(FR):** stratégie, conquête, origami.
- **Intro demo:** `CONFIG.intro.demo = "drag"` — the shared finger drags from a
  blue region to a neutral one, a folded arrow follows it, the finger taps
  *Send*, the two paper armies slide and the region takes the blue tissue.
  Desk: `intro.desk` = mouse drag, click.

### 1.1 Who it is for, and the hero who speaks to them

**The audience is casual strategy players, all ages from 9 up**, the
studio's Families audience like every game ([TODO.md](../TODO.md), *Android*):
a war of paper toys, never a real one. A battle is two paper armies bumping
into each other and the beaten pieces crumpling into scraps; nobody is hurt,
nothing bleeds, a lost region is a flag changing colour. **The pace is slow**:
a tick lasts minutes, a stage is played in one sitting, the game rewards
thinking over reflexes.

**The hero is Marshal Pleat**, the player's own general: an origami officer
folded from navy-blue paper, a paper bicorne with a gold trim, a round friendly
face, a big curled moustache and a rolled map under his arm. Calm, a little
proud, always sure the next fold will be the right one; even his sad face is
a sulk, not a defeat. He is the end screen's three faces, the title screen
and the store images. His rival, the **Red Marshal**, folded from scarlet
paper, is the AI the last stage meets face to face (§8).

______________________________________________________________________

## 2. The rules the prototype validated — stage 1

`prototype/conquest-ticks.html` plays stage 1's rules; its numbers are the
starting tuning (its tick is seconds long, a clock cheat — §3 sets the real
one).

- **The map** is regions on islands and continents. Every region has an
  **owner** (blue, red, neutral), a **terrain** (§5.2) and a number of
  **troops**. Two regions are neighbours when they share a border.
- **Orders.** Drag from one of your regions to a neighbour: all its troops go
  there. Tap the region again: half. Tap again: the order is cancelled. One
  order per region per tick; moving between two of your own regions is a
  reinforcement.
- **The tick resolves everything at once** (both camps' orders):
  1. each order takes its troops out of its region;
  1. two enemy columns crossing the same border meet halfway and cancel each
     other troop for troop;
  1. in every region, the troops that stayed plus the friendly arrivals fight
     every enemy arrival: the defender counts **×1.5**; the strongest side
     wins and keeps `round(raw × (1 − second / strongest))` troops, at least
     one; a tie leaves the region to its owner with no troops;
  1. **production** after the fights: a city adds **+1** troop, a capital
     **+2**.
- **Victory:** the stage's main objective, most often the red capital.
  **Defeat:** the loss of your own capital.
- **The AI** (greedy, one function): it ranks the regions next to its land by
  worth over defence (a city ×3, a capital ×5), pools every region touching a
  target until it outnumbers it by **×1.2**, marches its interior toward the
  front, and keeps part of a frontier home when the player stands next door
  (**0.6** of the threat, all of it on its capital). **10 %** of its regions
  sit a tick out. Those four numbers are the difficulty knobs of
  `web.levels.tune`.

______________________________________________________________________

## 3. The tick — time is the difficulty

The game is solo and slow; the clock is the opponent the player feels. **A
tick is a countdown during which the player plans**; when it ends, the
couriers leave and everything resolves.

- **Orders are drafts until they are sent.** A drawn order shows as its
  arrow; the player can change it, halve it or cancel it as often as they
  like during the tick. Nothing is final before it leaves.
- **They leave in one of two ways**: the player presses **Send orders**
  (FR *Envoyer les ordres*), or the tick runs out and the bell sends every
  draft as it stands. A drag still in progress at the bell is dropped. The
  pressure is to have the whole strategy drawn — and right — in time.
- **Send** is the one big control of the round, at the foot of the play
  area: a paper button carrying the courier crane and a ring that drains with
  the tick. The AI's orders are computed at the start of the tick, so sending
  early changes nothing for it.
- **The tick grows with the game**: two minutes at stage 1, when the map is a
  handful of regions and there is one decision a tick; ten minutes at stage
  30, when a tick holds fronts, gold, spies and standing orders. It stays
  tight for the stage it is on — the difficulty is the ratio between the
  decisions to make and the time to make them in. A player who has decided
  sends early; the long tick is a ceiling, not a wait.

| stages | tick         | regions on the map | a stage is about |
| ------ | ------------ | ------------------ | ---------------- |
| 1–6    | 2:00 → 3:30  | 8 → 16             | 6–10 ticks       |
| 7–12   | 3:45 → 5:00  | 18 → 26            | 10–12 ticks      |
| 13–18  | 5:15 → 6:45  | 28 → 36            | 12–14 ticks      |
| 19–24  | 7:00 → 8:15  | 38 → 48            | 14–16 ticks      |
| 25–30  | 8:30 → 10:00 | 50 → 70            | 16–20 ticks      |

- **The clock is play time, not wall time.** It runs only while the round is
  on screen: the motor already pauses the loop off-screen, and every card
  over the round (the guide, the options, a learn notice) pauses it too
  (`Modal.open`). Nobody loses a tick to a phone call.
- **A stage is played in one go.** The player launches it and either wins it,
  loses it, or abandons it from the round's leave card (`openLeave`): an
  abandoned stage writes no result and starts over from its first tick next
  time. Nothing is saved mid-stage; the long tick is a ceiling, and sending
  early is how a stage stays a sitting.
- **The score is secondary.** It is the HUD score the meta layer pays coins
  from, and it rewards speed without making it the point: **+50** per region
  captured, **doubled** when it was taken by a tick sent before half its time
  ran out; **+100** per tick under the stage's target when the stage is won
  (the *ticks* column of §8).
- **The three stars are three objectives** (`Game.levelTally()`): ★ the
  stage's **main objective**, which ends the stage and wins it; ★ and ★ two
  **sub-objectives** met during the round (take a given region early, never
  lose one, hold three mines at once, finish under the target ticks…). Each
  lights on the live pill the moment it is met (§8 lists them),
  `Game.levelRules(n)` words the three for the OBJECTIVES card, and the
  sub-objectives count only if the main one is won.
- **The playable cut** cannot hold a two-minute tick: it plays stage 1's map
  with ticks of 10 s (§6).

______________________________________________________________________

## 4. The simulation, written once

Thirty stages add rules on top of each other, and the bench (§11) plays them
by the thousand; both stay manageable only if the round's logic is kept apart
from its drawing:

1. **The resolution is one function** `resolve(state, orders) → state`, with
   no reference to the clock, the screen or the input. The renderer reads the
   state and animates the difference; every mechanic of §8 is a step inside
   it.
1. **Orders are data**: `{ from, to, n | share, kind }`, with no reference to
   a canvas object. The AI and the bench's pilot produce orders through the
   same function the player's drag does.
1. **All orders of a tick are applied together**, in an order fixed by region
   index (the prototype already does this), so the player's and the AI's
   orders never depend on which was written first.
1. **Every random draw goes through one seeded generator** owned by the
   state (`state.seed`), never `Math.random()` — the AI's skip, a storm's
   path, a rebellion. The same seed plays the same stage, which is what the
   bench needs, and the maps are generated from a seed too (§5.3).
1. **The tick length is a field of the stage** (§8), never a constant.
1. **The AI may cheat until stage 30**: it sees through the fog and knows the
   map. Stage 30 takes that away — the Red Marshal sees what the player sees
   and plays by the same rules — which makes it the fair fight the climb ends
   on (§8).

______________________________________________________________________

## 5. The look

[`lab/conquest-paper.html`](../lab/conquest-paper.html) is the reference for
the paper, the ocean, the camera and the pieces. The biome trick (§5.2) is
the next thing to try there.

### 5.1 The paper, the ocean, the camera, the pieces

- **The ground is cut paper**, baked once per stage into a texture: land
  sheets stacked by height, each showing its thickness on its near edge and
  its shadow beyond it, a cream beach sheet under the land, region borders as
  fine cuts, every sheet a mosaic of shards a shade apart. **The ocean is
  teal** (`#156c7a`, `#1f8a96`, `#38a6ad`, deep to shallow), cut in wave
  strips, so it never reads as the blue camp, and it **fills the whole
  screen**: the ground is baked with a margin and a periodic tile of deep sea
  repeats beyond it. No table, no tray.
- **The camera** projects the ground onto a tilted plane and stands the
  pieces on it, sorted far to near and scaled by depth. The default is the
  lab's **Close 30°** (tilt 30°, perspective 20 %, zoom 1.9): the player drags
  the map to pan, a double tap zooms out to the whole map and back.
- **The pieces** are the cuts of the asset sheets (§10), drawn by their foot
  with a soft contact shadow. A region shows its building (capital, fort,
  town), its flag and one to three figures for its troops; the exact count is
  a paper tag beside them.
- **The arrows say what an order does**, as in
  [`lab/conquest-ink.html`](../lab/conquest-ink.html), redrawn in paper:
  - **attack** (and landing) — a folded paper strip, light half, dark half, a
    crease (the lab's paper arrow);
  - **move** between own regions — paper chevrons flowing;
  - **march** over several ticks (courier delay, winter, cavalry) — footprints
    walking ahead;
  - a draft not sent yet — the same arrow, lighter, its crease dashed;
  - a red order revealed by a scout or a spy — the same arrow at half
    opacity, with the eye.

### 5.2 The five biomes — terrain is the paper, the owner is tissue

**The trick:** a region's paper sheet says its **terrain**; its **owner** is
a sheet of translucent **tissue paper** in the camp's colour laid over it
(about 45 %, so the terrain still shows through), plus a folded **ribbon** of
the camp's colour along the inside of its border and the camp's **flag**. A
neutral region has no tissue. So a snowy region held by blue reads *snow* and
*blue* at once, and the blue camp never has to be blue land — which is also
what keeps it apart from the teal sea.

| terrain | paper (top shades)  | what is cut into it    | its decor pieces                   |
| ------- | ------------------- | ---------------------- | ---------------------------------- |
| meadow  | `#b9d27a` `#94c060` | plain shards           | scenery sheet (done)               |
| wheat   | `#e8c860` `#d9a93a` | parallel furrow strips | plains sheet (§10.6)               |
| forest  | `#4f8f4a` `#3a7040` | a tight shard mosaic   | woods sheet (§10.7)                |
| snow    | `#f4f6f8` `#dfe8ef` | soft drift curves      | north sheet (§10.8), world (§10.5) |
| desert  | `#ecd29a` `#d9b56e` | dune curves            | desert sheet (§10.9)               |
| jungle  | `#2f8a5a` `#22704a` | leaf-shaped shards     | jungle sheet (§10.10)              |

**A terrain has no rule of its own** unless a stage introduces one (the
mountains of stage 3, the snow of stage 19): it is what the player reads, and
what makes thirty maps thirty places. **Each band is a biome**, a mix of
terrains, with its own decor pieces scattered by the map generator:

| band | world (EN / FR)                            | terrains                        |
| ---- | ------------------------------------------ | ------------------------------- |
| 1    | The Paper Isles / Les Îles de papier       | meadow, a little forest         |
| 2    | The Golden Plains / Les Plaines dorées     | wheat, meadow                   |
| 3    | The Whispering Woods / Les Bois murmurants | forest, meadow                  |
| 4    | The Frozen North / Le Grand Nord           | snow, forest                    |
| 5    | The Whole World / Le Monde entier          | desert, jungle, and all of them |

### 5.3 A map per stage

**Every stage has its own map, with its own number of regions** (8 at stage
1, about 70 at stage 30 — §3's table and §8). A map is data: the land shapes,
the regions with their owner, terrain, building and troops, the extras
(harbours, mines, wonders…), the seed.

- **Generated, then curated.** A generator builds a map from a seed and a
  short brief — the number of regions, of islands, the biome's terrain mix,
  the start positions, what the stage's mechanic needs (a river, passes, a
  wonder) — and checks it: every region reachable, both capitals at the same
  distance in ticks, no camp starting with more production. The designer
  then keeps or rerolls it and moves what needs moving.
- **`lab/foldiers-map.html`**, the map composer, is that loop: a brief, a
  seed, *Generate*, the map on the paper ground under the game's camera,
  regions dragged, owners, terrains and buildings set by a click, *Save* to
  the stage's data. It is the one new lab tool worth building before stage 5.
- **The decor** (trees, rocks, haystacks, cacti…) is scattered by the
  generator from the band's decor sheet, on the free land of each terrain,
  never under a building or a unit.

______________________________________________________________________

## 6. Building it on the motor

Follow [CLAUDE.md](../CLAUDE.md#how-to-create-a-new-game) and
[CREATING_A_GAME.md](CREATING_A_GAME.md) from the top. What is specific:

1. `games/foldiers/` from the template's three sources, then the manifest:
   `title`, `version 0.1.0`, `targets ["playable","web"]` (android later),
   `theme` (teal ocean `#1f8a96`, paper cream `#f6ecd2`, accent gold
   `#f2b400`), `web.font` **`baloo2`** (rounded, soft like folded paper),
   `web.music`, `web.levels`, `web.meta`, `web.village`.
1. **`CONFIG`**: `gameSeconds` unused (a stage ends on its main objective or
   on the loss of the capital); `layout` bands so `Layout` is the map between
   the HUD and the *Send* button; the tunables of §2 and §3 as plain numbers;
   the thirty maps and stage rows (§5.3, §8) as data.
1. **`Game` module** — port from `prototype/conquest-ticks.html` (`resolve`,
   `computeAI`, the order input) and `lab/conquest-paper.html` (the fields,
   the paper shader, the camera, the pieces), dropping their loops, canvas
   sizing, debug text and panels:
   - `reset()` builds the stage's first state from its data and bakes its
     ground (cache keyed on the stage and `view.dpr`; `freeCanvas`
     the one it replaces);
   - `update(dt)` runs the tick countdown and the resolution's animation;
   - `render()` re-projects the ground only when the camera moved (the
     projection is a cached canvas, not 1 900 `drawImage` a frame), then the
     arrows, the pieces and the tags; every piece is wrapped in
     `Enter.begin/end` at its foot, buildings first, then troops, so the
     round's entrance stands the army on the map piece by piece;
   - `onDown/onMove/onUp`: draw or edit an order, tap to halve or cancel, drag
     the map to pan, double tap to zoom out, tap *Send*;
   - `onResize` must not touch round state before the first `reset()`.
1. **Baking the ground on a phone.** The lab bakes a map in a few seconds on
   a desktop, and the maps grow to 70 regions. Measure it on a phone first;
   if it is too slow, bake it in a Web Worker during the round's entrance, at
   a lower resolution, or offline into one picture per stage for the web
   build.
1. **The words go through the motor**: what the player did is `Pop.show`
   (`Captured!`, `Held!`, `Clash`, `Orders sent`), the value is `Pop.text`
   (`+50`); what happened to them is `Notify.say` (`Red took Calder`,
   `Winter has come`, `Revolt in Isel`, `Storm at sea`, `The bell rang`);
   every mechanic is named once with `Notify.learn(id)` on its guide page;
   the rules are pages of `Game.guide`, one per mechanic, each with the stage
   that first deals it (`lv`), ids `gu-<mechanic>` (§8).
1. **Sound from the house kit**, mapped in the manifest's `sfx`: order drawn →
   `toggle`, order cancelled → `miss`, *Send* → `launch`, the bell (tick
   ends) → `warn`, clash → `hit`, region captured → `goal`, region lost →
   `malus`, production → `pickup`, gold → `bonus`, season or storm → `world`,
   capital lost → `defeat`. `make events` to hear and check them.
1. **The level hooks** ([LEVELS.md](LEVELS.md)): `Game.levelGoal(n)` returns
   the main objective and its words, `Game.levelTally()` counts the three
   objectives met, `Game.levelWon()` ends the round on the main one,
   `Game.levelRules(n)` words the three stars (§8). `web.levels.tune` lerps
   the AI's knobs (§2).
1. **The art pipeline**: `encode-art.mjs foldiers` for the backgrounds, title
   and characters; `cut-objects.mjs foldiers` for every `-object-*` sheet with
   **`--grid 4x4`** (the army and works sheets of every colour share their
   layout, so a cell is the same piece in all of them) and `--adopt`.
1. **The icon**: `assets/image/icon/foldiers.png` and its 320 px `thumb/`; no
   `logo` key once `-title.png` exists.
1. `node tools/update.mjs`, `make text` until *fully translated*, then the
   definition of done (§11).

**The playable cut** (5 MB, 20–30 s): stage 1's map, ticks of 10 s, the drag,
*Send* and one capture. Everything else is web.

______________________________________________________________________

## 7. The objectives and sub-objectives — the vocabulary

The three stars of a stage are picked from one small list, so every objective
is one function of the state, checked after each tick:

| objective                          | met when                                                |
| ---------------------------------- | ------------------------------------------------------- |
| take *X*                           | you own region *X* (the red capital, a fort, a wonder…) |
| take *X* before tick *N*           | you own *X* at the end of tick *N* or earlier           |
| hold *K* regions / mines / bridges | you own *K* of them at once                             |
| hold *X* for *N* ticks             | you own *X* at the end of *N* ticks in a row            |
| lose no region                     | no region of yours changed owner during the stage       |
| finish in *N* ticks                | the main objective met by tick *N*                      |
| use the new mechanic *K* times     | recruit, spy, build, sign a truce… *K* times            |
| a stage-specific deed              | a cavalry charge on a capital, a siege in two ticks…    |

______________________________________________________________________

## 8. The thirty stages

**One new mechanic a stage.** Stage 1 is the prototype; every stage after it
adds one rule, explained by its guide page and named once by
`Notify.learn`; everything learned stays. ★1 is the main objective (it ends
and wins the stage), ★2 and ★3 the sub-objectives. *Ticks* is the stage's
target, the one the score's speed bonus counts against.

| lv  | biome | regions | tick  | ticks | new mechanic       | the rule (starting numbers)                                                                                                       | ★1 main objective                    | ★2                             | ★3                            | guide page     | new pieces            |
| --- | ----- | ------- | ----- | ----- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------ | ----------------------------- | -------------- | --------------------- |
| 1   | 1     | 8       | 2:00  | 6     | Orders and ticks   | §2 and §3: draw, edit, Send or the bell, simultaneous resolution, cities +1, capital +2, defender ×1.5                            | take the red capital                 | lose no region                 | finish in 6 ticks             | `gu-orders`    | (sheets done)         |
| 2   | 1     | 9       | 2:15  | 7     | Forts              | a fort defends ×2 instead of ×1.5                                                                                                 | take the fort of Tolen               | take a fort in one tick        | lose no region                | `gu-fort`      | —                     |
| 3   | 1     | 10      | 2:30  | 8     | Mountains          | a mountain border cannot be crossed; a pass is the only way through                                                               | take the red capital                 | hold both passes at once       | finish in 8 ticks             | `gu-mountain`  | —                     |
| 4   | 1     | 12      | 2:45  | 8     | Rivers and bridges | crossing a river: the attacker counts ×0.75; over a bridge, ×1                                                                    | hold both bridges at once            | never attack across open water | take the red capital          | `gu-river`     | bridge (10.1)         |
| 5   | 1     | 14      | 3:00  | 9     | Sea and harbours   | a harbour ships troops to any other harbour; the fleet lands the next tick                                                        | land on the island and take its city | take two islands               | lose no ship                  | `gu-sea`       | —                     |
| 6   | 1     | 16      | 3:30  | 10    | Fog of war         | you see only your regions and their neighbours; a watchtower sees two regions away; red troops elsewhere read `?`                 | find and take the hidden capital     | take it before tick 8          | lose no region                | `gu-fog`       | fog clouds (10.5)     |
| 7   | 2     | 18      | 3:45  | 10    | Gold               | a mine region pays 1 gold a tick to its owner; the HUD counts it                                                                  | hold three mines at once             | hold 15 gold                   | take the red capital          | `gu-gold`      | gold mine (10.1)      |
| 8   | 2     | 20      | 4:00  | 10    | Recruitment        | tap one of your cities: 3 gold → +3 troops there at the next tick                                                                 | take the red capital                 | recruit in 3 cities            | finish in 10 ticks            | `gu-recruit`   | barracks (10.1)       |
| 9   | 2     | 21      | 4:15  | 11    | Cavalry            | a cavalry order moves two regions in one tick through your own or empty land; 4 gold → 2 cavalry                                  | take the red capital                 | take two cities in one tick    | a cavalry charge on a capital | `gu-cavalry`   | —                     |
| 10  | 2     | 22      | 4:30  | 11    | Artillery          | a cannon bombards a neighbour at the start of the tick: −2 troops there; it cannot move and fire in the same tick                 | break the red fortress               | lose no troop on the fortress  | finish in 11 ticks            | `gu-artillery` | —                     |
| 11  | 2     | 24      | 4:45  | 12    | Grain              | a region feeds 6 troops; above, each troop eats 1 grain a tick; without grain, one deserts a tick                                 | hold 25 troops at once               | nobody deserts                 | take the red capital          | `gu-grain`     | farm (10.1)           |
| 12  | 2     | 26      | 5:00  | 12    | Supply lines       | an army more than 3 regions from a city or a depot loses 1 troop a tick; a wagon builds a depot in 1 tick                         | take the far capital                 | no troop lost to supply        | build two depots              | `gu-supply`    | supply depot (10.1)   |
| 13  | 3     | 28      | 5:15  | 12    | Scouts             | a balloon reveals two regions around it and the red orders aimed at them, before the tick                                         | take the red capital                 | never surprised by an attack   | finish in 12 ticks            | `gu-scout`     | —                     |
| 14  | 3     | 29      | 5:30  | 12    | Spies              | 2 gold: the spy shows every red order of the tick as a ghost arrow                                                                | take the red capital                 | lose no region                 | use the spy three times       | `gu-spy`       | spy (10.1)            |
| 15  | 3     | 31      | 5:45  | 13    | Couriers           | an order to a region more than 4 steps from your capital or a courier post arrives one tick late; it marches as footprints        | take the red capital                 | build two courier posts        | finish in 13 ticks            | `gu-courier`   | courier rider (10.1)  |
| 16  | 3     | 32      | 6:15  | 13    | Generals           | your general leads one army: it attacks ×1.5 and defends ×2; if its army is beaten he is captured and the bonus is lost           | capture the red general              | your general never captured    | take the red capital          | `gu-general`   | —                     |
| 17  | 3     | 34      | 6:30  | 14    | Morale             | a win raises an army's morale (+1, up to +3 → ×1.3), a defeat lowers it; a drummer raises it by one                               | take the red capital                 | an army at full morale         | lose no region                | `gu-morale`    | drummer (10.1)        |
| 18  | 3     | 36      | 6:45  | 14    | Standing orders    | a region can hold one order that fires by itself when its condition is met (`if attacked, reinforce from…`, `if empty, retake`)   | hold the line 12 ticks               | three standing orders fire     | lose no region                | `gu-standing`  | —                     |
| 19  | 4     | 38      | 7:00  | 14    | Winter             | the season turns every 6 ticks; in winter, entering snow or mountain takes a tick more and production is halved                   | take the pass and the city behind it | no move lost to the snow       | finish in 14 ticks            | `gu-winter`    | winter pieces (10.5)  |
| 20  | 4     | 40      | 7:15  | 15    | Storms             | a storm drifts over the sea; a sea lane under it is closed and a fleet caught in it loses a third                                 | take the islands across the strait   | no fleet caught                | take the red capital          | `gu-storm`     | storm cloud (10.5)    |
| 21  | 4     | 42      | 7:30  | 15    | Rebellions         | a region taken less than 3 ticks ago with fewer than 2 troops may revolt and turn purple                                          | hold 20 regions at once              | no revolt                      | take the red capital          | `gu-rebels`    | rebel camp (10.5)     |
| 22  | 4     | 44      | 7:45  | 15    | Wonders            | holding the wonder region 5 ticks in a row wins the stage outright                                                                | hold the wonder 5 ticks              | keep your capital untouched    | finish in 15 ticks            | `gu-wonder`    | wonder (10.5)         |
| 23  | 4     | 46      | 8:00  | 16    | Engineers          | 4 gold, 2 ticks: build a palisade (one defence step up) or a bridge                                                               | take the red capital                 | build three works              | lose no region                | `gu-engineer`  | engineer, palisade    |
| 24  | 4     | 48      | 8:15  | 16    | Sieges             | a capital or a fort can only be attacked from a side where you hold two of its neighbours; a siege tower ignores its walls        | take the walled capital              | a siege in two ticks           | finish in 16 ticks            | `gu-siege`     | siege tower, catapult |
| 25  | 5     | 50      | 8:30  | 16    | A third camp       | the green camp plays too, against everyone                                                                                        | take both enemy capitals             | green never touches your land  | finish in 16 ticks            | `gu-green`     | green army (10.3)     |
| 26  | 5     | 54      | 9:00  | 17    | Truces             | an envoy offers a truce: no attack between two camps for 6 ticks; an AI accepts when it is the weaker                             | take the red capital                 | sign two truces                | win during a truce with green | `gu-truce`     | envoy (10.1)          |
| 27  | 5     | 58      | 9:15  | 18    | Betrayal           | every AI has a temper (loyal, opportunist); a truce can be broken, which costs the breaker one morale everywhere                  | outlast both rivals                  | never betrayed                 | lose no region                | `gu-betrayal`  | —                     |
| 28  | 5     | 62      | 9:30  | 18    | Doctrines          | before the stage, pick one doctrine out of three (Blitz: cavalry +1 region; Bastion: forts ×2.5; Merchant: mines pay 2)           | take the red capital                 | finish in 18 ticks             | win with each doctrine once   | `gu-doctrine`  | —                     |
| 29  | 5     | 66      | 9:45  | 19    | Airlift            | a troop balloon carries up to 6 troops three regions away over sea or mountain, in one tick, seen by everyone                     | take the capital across the sea      | land on the capital itself     | finish in 19 ticks            | `gu-airlift`   | troop balloon (10.1)  |
| 30  | 5     | 70      | 10:00 | 20    | The Marshals' duel | a mirror map against the Red Marshal: the AI sees through the fog no more, plays the same tick, the same rules, every mechanic on | take the Red Marshal's capital       | lose no region to him          | finish in 20 ticks            | `gu-duel`      | (character art)       |

**After stage 30**, the star above it starts the endless war: a generated
world map, every mechanic, three rivals, a best score.

______________________________________________________________________

## 9. The meta layer, the village, the codex

### 9.1 The twenty stickers

Eleven common, five rare, two epic, two legendary, like the other games. A
sticker's name is a proper noun and is never translated. Twelve come off the
map (`awards`), in this order: band 1…5 passed, band 1…5 passed clean, all 30
cleared, ninety of ninety. One legendary (Red Marshal) stays out of `awards`,
so the machine can roll one.

| #   | name          | rarity    | how it is earned      |
| --- | ------------- | --------- | --------------------- |
| 1   | First Fold    | common    | band 1 passed         |
| 2   | Paper Crane   | common    | machine               |
| 3   | Bicorne       | common    | band 5 passed         |
| 4   | Sealed Orders | common    | band 2 passed         |
| 5   | Ink Pot       | common    | machine               |
| 6   | Wax Seal      | common    | machine               |
| 7   | Tin Drum      | common    | band 5 passed clean   |
| 8   | Paper Boat    | common    | machine               |
| 9   | Hourglass     | common    | machine               |
| 10  | Compass Rose  | common    | band 4 passed clean   |
| 11  | Snowy Pine    | common    | machine               |
| 12  | Spyglass      | rare      | band 3 passed clean   |
| 13  | Sky Scout     | rare      | machine               |
| 14  | Gold Crown    | rare      | band 1 passed clean   |
| 15  | Lighthouse    | rare      | band 3 passed         |
| 16  | Frozen Flag   | rare      | band 4 passed         |
| 17  | Grand Galleon | epic      | band 2 passed clean   |
| 18  | Creasefire    | epic      | all 30 stages cleared |
| 19  | Red Marshal   | legendary | machine only          |
| 20  | Golden Fold   | legendary | ninety of ninety      |

`"awards": [1, 4, 15, 16, 3, 14, 17, 12, 10, 7, 18, 20]`.

### 9.2 The village

`-background-home.png` is a paper harbour camp at golden hour with six empty
pads; the six houses of `-object-home.png` (3x2) stand on them, composed in
`make village`:

| house            | role         |
| ---------------- | ------------ |
| Quartermaster    | `shop`       |
| Hall of Banners  | `ranking`    |
| War Room         | `map`        |
| Folding Workshop | `collection` |
| Crane Roost      | `daily`      |
| Lighthouse       | `options`    |

### 9.3 The codex

Optional for 1.0: an army book through `Game.codex` — *Troops*, *Works*,
*World* — every piece of the sheets, a card had once its stage is opened. Its
door would be the village role `cards`.

______________________________________________________________________

## 10. The assets — the list and a prompt for each

**Already done — do not regenerate:** the blue army, the red army and the
neutral scenery sheets, filed in `assets/image/master/` (first table). Their
prompts are deliberately not kept here. **Everything else is below, one
complete prompt each**, to be pasted alone. The artwork is the user's to
generate: never draw a placeholder for any of it.

| done — filed, 4x4 grids                    | file (`assets/image/master/`)   |
| ------------------------------------------ | ------------------------------- |
| blue army: buildings, troops, ships, flags | `foldiers-object-army-blue.png` |
| red army, same layout                      | `foldiers-object-army-red.png`  |
| neutral scenery and resources (meadow)     | `foldiers-object-scenery.png`   |

| to generate                                    | file (`assets/image/master/` unless said)    | prompt      |
| ---------------------------------------------- | -------------------------------------------- | ----------- |
| blue specialists and works, 4x4                | `foldiers-object-works-blue.png`             | 10.1        |
| red specialists and works, 4x4                 | `foldiers-object-works-red.png`              | 10.2        |
| green army (stage 25), 4x4                     | `foldiers-object-army-green.png`             | 10.3        |
| green specialists and works, 4x4               | `foldiers-object-works-green.png`            | 10.4        |
| world: fog, winter, storm, wonder, rebels, 4x4 | `foldiers-object-world.png`                  | 10.5        |
| biome decor: Golden Plains, 4x4                | `foldiers-object-decor-plains.png`           | 10.6        |
| biome decor: Whispering Woods, 4x4             | `foldiers-object-decor-woods.png`            | 10.7        |
| biome decor: Frozen North, 4x4                 | `foldiers-object-decor-north.png`            | 10.8        |
| biome decor: desert, 4x4                       | `foldiers-object-decor-desert.png`           | 10.9        |
| biome decor: jungle, 4x4                       | `foldiers-object-decor-jungle.png`           | 10.10       |
| paper poof, 4x4 frames                         | `foldiers-object-fx-poof.png`                | 10.11       |
| intro and end screen backdrop, terrain only    | `foldiers-background-phone.png`              | 10.12       |
| desktop bands, terrain only                    | `foldiers-background-desk.png`               | 10.13       |
| village hub                                    | `foldiers-background-home.png`               | 10.14       |
| logotype                                       | `foldiers-title.png`                         | 10.15       |
| end screen character, three faces              | `foldiers-character-{sad,neutral,happy}.png` | 10.16–10.18 |
| village houses, 3x2                            | `foldiers-object-home.png`                   | 10.19       |
| stickers, 5x4                                  | `foldiers-object-sticker.png`                | 10.20       |
| menu decor objects, 4x2                        | `foldiers-object-decor.png`                  | 10.21       |
| app icon                                       | `assets/image/icon/foldiers.png`             | 10.22       |
| music, one track in six sections               | `assets/audio/music/foldiers.mp3`            | 10.23       |

The paper ground of the round, its terrains, the tissue of the camps, the
arrows and the HUD are drawn by the game: nothing to generate for them. **The
sounds are not generated**: they come from the house kit and the library
(`make events`, §6 step 6).

### 10.1 Blue specialists and works

The three works sheets (10.1, 10.2, 10.4) share one layout, cell for cell.

```text
A sprite sheet of 16 game pieces for a world-conquest strategy game, arranged in a strict grid of 4 columns and 4 rows of equal square cells, one piece per cell, every piece centred horizontally in its cell with clear empty space around it so the sheet can be cut cell by cell, no piece touching another or crossing into a neighbouring cell. Every piece is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, soft natural daylight from the top left, like a macro photograph of a handmade paper diorama. Every coloured part of this army is folded from blue papers (deep blue #2f63c4, light blue #5b8fe0, dark navy #1d3f8a); walls are cream paper, wood is light brown kraft paper, metal is pale grey paper. Every piece is seen from the same three-quarter front view, the camera about 35 degrees above the ground, and stands upright with its base on the same invisible ground line near the bottom of its cell, so each one reads as a small figure that can be placed standing on a paper map; the balloon of row 4 floats at the middle of its cell instead. Same scale for the whole sheet: a person fills about half the height of its cell, a building about four fifths. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch, no cast shadow, no base under any piece. Row 1, left to right: a spy in a long hooded blue cloak holding a small paper lantern, a playful sneaky pose; a scout in a short blue jacket with a backpack and a compass in one hand; an engineer in a blue jacket and a round helmet carrying a shovel over the shoulder; a drummer in a blue coat and bicorne hat beating a small drum. Row 2, left to right: an envoy in a blue coat raising a white paper flag of truce; a courier rider on a blue origami horse at a gallop, a satchel of letters on his side; a wooden siege tower on four wheels with a blue banner; a wooden catapult with a blue arm. Row 3, left to right: a supply depot of stacked kraft crates and barrels beside a small blue tent; a barracks, a long cream building with a blue roof and a blue flag over the door; a short palisade wall of pointed kraft wooden stakes with a blue pennant; a small wooden footbridge with blue railings. Row 4, left to right: a transport galleon with a wide blue hull and cream sails, loaded with crates; a large troop balloon of blue and cream paper strips carrying a gondola with three tiny blue soldiers; a gold mine entrance in a grey rock with a wooden frame and a small cart of gold coins; a farm with a small cream windmill with blue sails and a patch of golden wheat. No written text, no letters, no numbers anywhere in the image.
Every hand has exactly five fingers: one thumb and four fingers, never four, never six.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.2 Red specialists and works

```text
A sprite sheet of 16 game pieces for a world-conquest strategy game, arranged in a strict grid of 4 columns and 4 rows of equal square cells, one piece per cell, every piece centred horizontally in its cell with clear empty space around it so the sheet can be cut cell by cell, no piece touching another or crossing into a neighbouring cell. Every piece is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, soft natural daylight from the top left, like a macro photograph of a handmade paper diorama. Every coloured part of this army is folded from red papers (bright red #d9412f, coral orange #ee6a4a, dark red #a52a1f); walls are cream paper, wood is light brown kraft paper, metal is pale grey paper. Every piece is seen from the same three-quarter front view, the camera about 35 degrees above the ground, and stands upright with its base on the same invisible ground line near the bottom of its cell, so each one reads as a small figure that can be placed standing on a paper map; the balloon of row 4 floats at the middle of its cell instead. Same scale for the whole sheet: a person fills about half the height of its cell, a building about four fifths. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch, no cast shadow, no base under any piece. Row 1, left to right: a spy in a long hooded red cloak holding a small paper lantern, a playful sneaky pose; a scout in a short red jacket with a backpack and a compass in one hand; an engineer in a red jacket and a round helmet carrying a shovel over the shoulder; a drummer in a red coat and bicorne hat beating a small drum. Row 2, left to right: an envoy in a red coat raising a white paper flag of truce; a courier rider on a red origami horse at a gallop, a satchel of letters on his side; a wooden siege tower on four wheels with a red banner; a wooden catapult with a red arm. Row 3, left to right: a supply depot of stacked kraft crates and barrels beside a small red tent; a barracks, a long cream building with a red roof and a red flag over the door; a short palisade wall of pointed kraft wooden stakes with a red pennant; a small wooden footbridge with red railings. Row 4, left to right: a transport galleon with a wide red hull and cream sails, loaded with crates; a large troop balloon of red and cream paper strips carrying a gondola with three tiny red soldiers; a gold mine entrance in a grey rock with a wooden frame and a small cart of gold coins; a farm with a small cream windmill with red sails and a patch of golden wheat. No written text, no letters, no numbers anywhere in the image.
Every hand has exactly five fingers: one thumb and four fingers, never four, never six.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.3 Green army (stage 25)

Same layout as the blue and red army sheets already filed.

```text
A sprite sheet of 16 game pieces for a world-conquest strategy game, arranged in a strict grid of 4 columns and 4 rows of equal square cells, one piece per cell, every piece centred horizontally in its cell with clear empty space around it so the sheet can be cut cell by cell, no piece touching another or crossing into a neighbouring cell. Every piece is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, soft natural daylight from the top left, like a macro photograph of a handmade paper diorama. Every coloured part of this army is folded from green papers (emerald green #2f9e5a, light green #5cc283, dark forest green #1d6b3c); walls are cream paper, wood is light brown kraft paper, metal is pale grey paper. Every piece is seen from the same three-quarter front view, the camera about 35 degrees above the ground, and stands upright with its base on the same invisible ground line near the bottom of its cell, so each one reads as a small figure that can be placed standing on a paper map. Same scale for the whole sheet: a soldier fills about half the height of its cell, a castle about four fifths. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch, no cast shadow, no base under any piece. Row 1, left to right: a capital castle with two towers, pointed green roofs, a small gold paper crown on top and a green flag; a fort, one stone tower with crenellations and a green flag; a town of three small cream houses with green roofs huddled together; a small wooden harbour dock with a cream lighthouse and a green roof. Row 2, left to right: an infantry soldier in a green coat and bicorne hat holding a spear upright; an archer in a green coat holding a bow; a cavalry rider in a green coat on a green origami horse, side-on and walking; a general in a long green coat with a plumed hat holding a spyglass. Row 3, left to right: a cannon on two wheels with a green barrel; a supply wagon with a cream canvas cover pulled by a green origami horse; a sailing warship with a green hull, white sails and a green flag; a small rowing transport boat with a green hull. Row 4, left to right: an army tent of green and cream paper; a wooden watchtower with a green roof; a small hot-air balloon of green and cream paper strips with a wicker basket; a green flag on a wooden pin. No written text, no letters, no numbers anywhere in the image.
Every hand has exactly five fingers: one thumb and four fingers, never four, never six.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.4 Green specialists and works

```text
A sprite sheet of 16 game pieces for a world-conquest strategy game, arranged in a strict grid of 4 columns and 4 rows of equal square cells, one piece per cell, every piece centred horizontally in its cell with clear empty space around it so the sheet can be cut cell by cell, no piece touching another or crossing into a neighbouring cell. Every piece is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, soft natural daylight from the top left, like a macro photograph of a handmade paper diorama. Every coloured part of this army is folded from green papers (emerald green #2f9e5a, light green #5cc283, dark forest green #1d6b3c); walls are cream paper, wood is light brown kraft paper, metal is pale grey paper. Every piece is seen from the same three-quarter front view, the camera about 35 degrees above the ground, and stands upright with its base on the same invisible ground line near the bottom of its cell, so each one reads as a small figure that can be placed standing on a paper map; the balloon of row 4 floats at the middle of its cell instead. Same scale for the whole sheet: a person fills about half the height of its cell, a building about four fifths. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch, no cast shadow, no base under any piece. Row 1, left to right: a spy in a long hooded green cloak holding a small paper lantern, a playful sneaky pose; a scout in a short green jacket with a backpack and a compass in one hand; an engineer in a green jacket and a round helmet carrying a shovel over the shoulder; a drummer in a green coat and bicorne hat beating a small drum. Row 2, left to right: an envoy in a green coat raising a white paper flag of truce; a courier rider on a green origami horse at a gallop, a satchel of letters on his side; a wooden siege tower on four wheels with a green banner; a wooden catapult with a green arm. Row 3, left to right: a supply depot of stacked kraft crates and barrels beside a small green tent; a barracks, a long cream building with a green roof and a green flag over the door; a short palisade wall of pointed kraft wooden stakes with a green pennant; a small wooden footbridge with green railings. Row 4, left to right: a transport galleon with a wide green hull and cream sails, loaded with crates; a large troop balloon of green and cream paper strips carrying a gondola with three tiny green soldiers; a gold mine entrance in a grey rock with a wooden frame and a small cart of gold coins; a farm with a small cream windmill with green sails and a patch of golden wheat. No written text, no letters, no numbers anywhere in the image.
Every hand has exactly five fingers: one thumb and four fingers, never four, never six.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.5 The world: fog, winter, storm, wonder, rebels

```text
A sprite sheet of 16 world pieces for a world-conquest strategy game, arranged in a strict grid of 4 columns and 4 rows of equal square cells, one piece per cell, every piece centred horizontally in its cell with clear empty space around it so the sheet can be cut cell by cell, no piece touching another or crossing into a neighbouring cell. Every piece is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, soft natural daylight from the top left, like a macro photograph of a handmade paper diorama. No red, no blue and no green camp colours: whites, pale greys, cream, kraft brown, gold, and a soft plum purple for the rebels only. Every piece is seen from the same three-quarter front view, the camera about 35 degrees above the ground, and stands upright with its base on the same invisible ground line near the bottom of its cell, so each one reads as a small object that can be placed standing on a paper map; the clouds float at the middle of their cells instead. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch, no cast shadow, no base under any piece. Row 1, left to right: a large puffy cloud folded from white and pale grey paper, flat at the bottom, for fog of war; a medium cloud of the same paper; a small cloud of the same paper; a dark grey paper storm cloud with short white paper rain strips hanging under it as part of the cloud. Row 2, left to right: a pine tree covered in white paper snow; a mountain of pale grey paper entirely covered in white snow; a small pile of white paper snow drifts; a frozen pond, a flat disc of pale icy paper with a few cracks. Row 3, left to right: a wonder, a tall golden paper obelisk on a stepped cream base; ancient ruins, two broken cream columns and a fallen stone; a rebel camp, a patched plum-purple tent with a plum flag and a pitchfork leaning on it; an abandoned fort, a broken cream tower with an empty flagpole. Row 4, left to right: a small volcano of brown and grey paper with an orange paper glow of lava at its top as part of its shape; a wooden treasure chest of kraft paper with gold trim, closed; a market stall with a cream striped awning and a few paper fruits; a wooden signpost with three blank arrows pointing different ways. No written text, no letters, no numbers anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.6 Biome decor — the Golden Plains (band 2)

The five biome sheets (10.6–10.10) share one framing: sixteen decor pieces,
no camp colour, the band's own landscape in paper.

```text
A sprite sheet of 16 landscape decor pieces for a world-conquest strategy game, the farmland of golden plains, arranged in a strict grid of 4 columns and 4 rows of equal square cells, one piece per cell, every piece centred horizontally in its cell with clear empty space around it so the sheet can be cut cell by cell, no piece touching another or crossing into a neighbouring cell. Every piece is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, soft warm daylight from the top left, like a macro photograph of a handmade paper diorama. Colours of a sunny harvest: wheat gold, ochre, warm greens, kraft brown, cream, with a few small touches of soft orange; no red, no blue and no green camp colours used as flags or uniforms. Every piece is seen from the same three-quarter front view, the camera about 35 degrees above the ground, and stands upright with its base on the same invisible ground line near the bottom of its cell, so each one reads as a small object that can be placed standing on a paper map. Same scale for the whole sheet: a tree fills about two thirds of the height of its cell. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch, no cast shadow, no base under any piece. Row 1, left to right: a round golden haystack; a stack of three square hay bales; a broad oak tree with a round crown of warm green paper; a small patch of tall golden wheat stalks. Row 2, left to right: a cluster of three sunflowers; a short wooden fence of three kraft posts and two rails; a cream farmhouse with a brown thatched paper roof; a small round grain silo of cream and kraft paper. Row 3, left to right: a wooden hay cart with two wheels, empty, no horse; a small row of orange paper pumpkins; a straw beehive in the shape of a dome; a white origami sheep standing. Row 4, left to right: a white and brown origami cow standing; an apple tree with small paper apples; a low golden hill with a few paper flowers; a wooden water well with a small roof. No written text, no letters, no numbers anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.7 Biome decor — the Whispering Woods (band 3)

```text
A sprite sheet of 16 landscape decor pieces for a world-conquest strategy game, a deep enchanted-looking forest, arranged in a strict grid of 4 columns and 4 rows of equal square cells, one piece per cell, every piece centred horizontally in its cell with clear empty space around it so the sheet can be cut cell by cell, no piece touching another or crossing into a neighbouring cell. Every piece is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, soft cool daylight from the top left, like a macro photograph of a handmade paper diorama. Colours of a shady forest: deep greens, moss green, bark brown, cream, pale grey, with small touches of mushroom red-brown and soft purple berries; no red, no blue and no green camp colours used as flags or uniforms. Every piece is seen from the same three-quarter front view, the camera about 35 degrees above the ground, and stands upright with its base on the same invisible ground line near the bottom of its cell, so each one reads as a small object that can be placed standing on a paper map. Same scale for the whole sheet: a tall tree fills about four fifths of the height of its cell. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch, no cast shadow, no base under any piece. Row 1, left to right: a very tall dark green fir tree; a slender white birch tree with small pale green leaves; a huge old oak with a thick twisted trunk; a cluster of three dark pine trees close together. Row 2, left to right: a cluster of brown and cream paper mushrooms; a fallen log with moss on it; a tree stump with a small paper owl sitting on it; a large green fern. Row 3, left to right: a hollow tree with a round opening in its trunk; a bush with small purple paper berries; a mossy grey rock; a small wooden woodcutter's hut with a moss-green roof. Row 4, left to right: a ring of small toadstools; an origami deer standing, folded from light brown paper; a tall thin dead tree with bare branches, grey paper; a small wooden footpath sign post with a lantern hanging from it, the lantern unlit. No written text, no letters, no numbers anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.8 Biome decor — the Frozen North (band 4)

```text
A sprite sheet of 16 landscape decor pieces for a world-conquest strategy game, a snowy northern land, arranged in a strict grid of 4 columns and 4 rows of equal square cells, one piece per cell, every piece centred horizontally in its cell with clear empty space around it so the sheet can be cut cell by cell, no piece touching another or crossing into a neighbouring cell. Every piece is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, soft cold daylight from the top left, like a macro photograph of a handmade paper diorama. Colours of a winter land: white, pale icy blue-grey, silver grey, dark evergreen, kraft brown, cream; no red, no blue and no green camp colours used as flags or uniforms. Every piece is seen from the same three-quarter front view, the camera about 35 degrees above the ground, and stands upright with its base on the same invisible ground line near the bottom of its cell, so each one reads as a small object that can be placed standing on a paper map. Same scale for the whole sheet: a tree fills about two thirds of the height of its cell. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch, no cast shadow, no base under any piece. Row 1, left to right: a tall snowy fir tree; two small snowy pines side by side; a bare tree with branches covered in white snow; a large snow-covered boulder. Row 2, left to right: a small igloo of white paper blocks; a jagged ice rock of pale translucent-looking paper with sharp facets; a flat ice floe with a small crack; a frozen waterfall falling from a small grey cliff, all in icy paper. Row 3, left to right: a wooden sled loaded with a small bundle; a cosy log cabin with a thick white snowy roof; a cheerful snowman made of white paper balls with a kraft scarf and twig arms; a white origami fox sitting. Row 4, left to right: a white origami hare; a white origami polar bear walking; a low snowy hill with a few frozen grass blades; a small stone cairn half covered in snow. No written text, no letters, no numbers anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.9 Biome decor — the desert (band 5)

```text
A sprite sheet of 16 landscape decor pieces for a world-conquest strategy game, a sunny desert, arranged in a strict grid of 4 columns and 4 rows of equal square cells, one piece per cell, every piece centred horizontally in its cell with clear empty space around it so the sheet can be cut cell by cell, no piece touching another or crossing into a neighbouring cell. Every piece is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, warm bright daylight from the top left, like a macro photograph of a handmade paper diorama. Colours of a desert: sand, warm ochre, terracotta, sage green for the plants, kraft brown, cream, and a little turquoise for water; no red, no blue and no green camp colours used as flags or uniforms. Every piece is seen from the same three-quarter front view, the camera about 35 degrees above the ground, and stands upright with its base on the same invisible ground line near the bottom of its cell, so each one reads as a small object that can be placed standing on a paper map. Same scale for the whole sheet: a palm tree fills about four fifths of the height of its cell. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch, no cast shadow, no base under any piece. Row 1, left to right: a tall date palm tree; a tall saguaro cactus with two arms; a round barrel cactus with a small paper flower; a low sand dune with soft curves. Row 2, left to right: a small oasis pool of turquoise paper with two small palms beside it; a natural sandstone rock arch; a cluster of terracotta rocks; a small sand-coloured pyramid. Row 3, left to right: an origami camel standing, folded from sand paper; a cream desert tent with a striped ochre awning; a dry thorny bush; a stack of terracotta clay pots. Row 4, left to right: a flat-topped acacia tree; a small mud-brick house with a round dome; a round sandstone boulder worn smooth by the wind; a wooden water well with a rope and bucket. No written text, no letters, no numbers anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.10 Biome decor — the jungle (band 5)

```text
A sprite sheet of 16 landscape decor pieces for a world-conquest strategy game, a lush tropical jungle, arranged in a strict grid of 4 columns and 4 rows of equal square cells, one piece per cell, every piece centred horizontally in its cell with clear empty space around it so the sheet can be cut cell by cell, no piece touching another or crossing into a neighbouring cell. Every piece is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, warm humid daylight from the top left, like a macro photograph of a handmade paper diorama. Colours of a jungle: deep tropical greens, lime green, bark brown, cream, with small bright touches of magenta, yellow and orange for flowers and fruit; no red, no blue and no green camp colours used as flags or uniforms. Every piece is seen from the same three-quarter front view, the camera about 35 degrees above the ground, and stands upright with its base on the same invisible ground line near the bottom of its cell, so each one reads as a small object that can be placed standing on a paper map. Same scale for the whole sheet: a tall tree fills about four fifths of the height of its cell. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch, no cast shadow, no base under any piece. Row 1, left to right: a tall jungle tree with a wide umbrella crown; a cluster of green bamboo stalks; a banana plant with large leaves and a bunch of yellow paper bananas; a big tropical fern. Row 2, left to right: a cluster of bright tropical flowers in magenta and yellow; a giant leafy plant with huge heart-shaped leaves; a small waterfall over mossy rocks into a tiny turquoise pool; a stone temple ruin with a stepped shape, covered in green paper vines. Row 3, left to right: a hut on short wooden stilts with a leaf roof; a mossy boulder with vines; an origami parrot perched on a short branch, in yellow and green paper; a twisted mangrove tree with arching roots. Row 4, left to right: an origami monkey sitting on a stump; a small round bush with orange paper fruits; a hanging rope bridge section between two short posts; a large carved stone head covered in moss, friendly-looking. No written text, no letters, no numbers anywhere in the image.
Every hand has exactly five fingers: one thumb and four fingers, never four, never six.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.11 Paper poof — a beaten army crumples into scraps

```text
A sprite sheet of 16 animation frames for a mobile strategy game, arranged in a strict grid of 4 columns and 4 rows of equal square cells, read left to right then top to bottom, one frame per cell, every frame centred in its cell at exactly the same position and the same scale, so the frames can be cut cell by cell and played in order. The subject is a burst of paper scraps: the moment a small army of origami paper figures is beaten and crumples away, a playful poof and never anything violent. Frame 1: a tight ball of crumpled cream and white paper at the centre. Frames 2 to 6: the ball bursts open into torn paper scraps, small folded triangles and little torn paper bits flying outward in a ring, cream, white and pale grey with a few kraft brown pieces. Frames 7 to 12: the scraps keep drifting outward, slowing down, turning and falling. Frames 13 to 16: the last few scraps settle and fade until frame 16 is almost empty with two tiny scraps left. The paper is matte with visible fibres and crisp torn edges, soft natural daylight from the top left, like a macro photograph of paper. The burst of scraps is the subject itself and stays inside each cell. No written text, no letters, no numbers anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.12 Intro and end screen backdrop — terrain only

```text
Vertical 9:16 mobile game background illustration, 1080x1920 pixels, made entirely of layered cut paper, photographed from above at a slight angle like a macro photograph of a handmade paper map. Only the landscape, no objects of any kind: no buildings, no soldiers, no animals, no ships, no flags, no arrows, no trees, no rocks — just paper terrain and paper sea. A paper world fills the lower two thirds of the frame and runs off its left, right and bottom edges, with no table, no tray and no border: a teal ocean made of layered sheets of teal and turquoise cardstock (#156c7a, #1f8a96, #38a6ad) with cut-out wave strips; two continents and a scattered archipelago of islands, each land stacked in two or three paper layers of different thickness on a cream beach sheet, every layer casting a soft shadow on the one below. The land is a patchwork of terrains, each cut from its own paper: fresh meadow green, golden wheat paper with parallel furrow strips, dark forest green with a tight mosaic of shards, white snow paper with soft drift curves on the northern coast, warm sand paper with dune curves in the south; the patches are separated by fine cut lines like regions on a map. The top third of the image is the same teal paper ocean seen further away, calm, with only a few wave strips, left empty for the game logo. Soft natural daylight from the top left, gentle shadows, visible paper fibres and clean cut edges, shallow depth of field toward the top, warm and charming handcrafted mood. No written text, no letters, no numbers, no logo anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.13 Desktop bands — terrain only

```text
Horizontal 16:9 background illustration, 1920x1080 pixels, made entirely of layered cut paper, photographed from above at a slight angle like a macro photograph of a handmade paper map, for the wide bands on either side of a mobile game shown on a desktop screen. Only the landscape, no objects of any kind: no buildings, no soldiers, no animals, no ships, no flags, no arrows, no trees, no rocks — just paper terrain and paper sea. A teal paper ocean (#156c7a, #1f8a96, #38a6ad) made of layered cardstock with cut-out wave strips fills the whole frame edge to edge, with no table, no tray and no border. The middle third of the image is calm open teal sea with only a few wave strips, because a phone-shaped game window will cover it. The left third holds the coast of a continent stacked in two or three paper layers on a cream beach sheet, its land a patchwork of meadow green, dark forest green and white snow paper separated by fine cut lines; the right third holds the coast of another continent built the same way, its land a patchwork of golden wheat paper with furrow strips, meadow green and warm sand paper with dune curves, with two small islands off its shore. Soft natural daylight from the top left, gentle shadows, visible paper fibres and clean cut edges, warm and charming handcrafted mood. No written text, no letters, no numbers, no logo anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.14 Village hub

```text
Vertical 9:16 mobile game background illustration, 1080x1920 pixels, made entirely of layered cut paper and origami, seen from above at about 35 degrees like a macro photograph of a handmade paper diorama: the home camp of a paper army, a small island harbour at golden hour. A teal paper ocean (#156c7a, #1f8a96, #38a6ad) of layered cardstock with cut-out wave strips surrounds a rounded island that fills the middle of the frame, stacked in two or three layers of pale green and cream paper on a cream beach sheet, with no table, no tray and no border. On the island, six flat empty clearings of light kraft paper, each a soft rounded pad large enough for one building, spread over the island: two near the top, two in the middle, two near the bottom, joined by little paths of cream paper; the pads are completely empty. Around them only small details: paper pine trees and round trees at the edges, a few blue paper flags on pins, a wooden jetty with a small blue origami boat at the bottom right, a few paper rocks. Warm golden-hour light from the top left, long soft shadows, visible paper fibres and clean cut edges, cosy and charming handcrafted mood. The top tenth of the image is open teal sea with nothing in it. No written text, no letters, no numbers, no logo anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.15 Logotype

```text
A game logotype reading exactly the single word "Foldiers", spelled F-O-L-D-I-E-R-S with a capital F and the other letters lowercase, built from thick folded paper letters like an origami craft: each letter folded from matte cardstock with crisp creases and two tones per face showing the folds, the letters F, o, l and d folded from blue paper (#2f63c4 and #5b8fe0) and the letters i, e, r and s folded from red paper (#d9412f and #ee6a4a), all with a thin cream paper edge, standing slightly in relief and gently staggered like paper cut-outs. A small white origami crane perches on top of the letter F, and the dot of the letter i is a tiny gold paper crown. Bold, rounded, playful and very readable on a phone, the whole word on one line, centred, seen straight from the front with soft light from the top left and a soft contact shadow under the letters only. No other words, no subtitle, no tagline, no other letters or numbers anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.16 End screen character — happy

```text
A character illustration for a mobile strategy game's victory screen: Marshal Pleat, a friendly origami general folded entirely from matte paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, like a handmade paper figure photographed in soft daylight from the top left. He wears a long navy and royal blue folded-paper coat (#1d3f8a, #2f63c4) with cream lapels, gold paper buttons and gold epaulettes, a large paper bicorne hat with a gold trim and a small blue cockade, cream paper trousers and dark blue paper boots. His face is folded from peach paper, round and friendly, with small dark eyes, rosy paper cheeks and a big curled white moustache. A rolled paper map is tucked under his left arm. Victory pose: he stands tall, chest out, laughing with his eyes closed in delight, his right arm raised high holding his bicorne hat in the air in triumph. Full body, three-quarter front view, standing, centred, filling the height of the image. Cheerful, proud and warm. No written text, no letters, no numbers anywhere in the image.
Every hand has exactly five fingers: one thumb and four fingers, never four, never six.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.17 End screen character — neutral

```text
A character illustration for a mobile strategy game's score screen: Marshal Pleat, a friendly origami general folded entirely from matte paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, like a handmade paper figure photographed in soft daylight from the top left. He wears a long navy and royal blue folded-paper coat (#1d3f8a, #2f63c4) with cream lapels, gold paper buttons and gold epaulettes, a large paper bicorne hat with a gold trim and a small blue cockade, cream paper trousers and dark blue paper boots. His face is folded from peach paper, round and friendly, with small dark eyes, rosy paper cheeks and a big curled white moustache. A rolled paper map is tucked under his left arm. Thoughtful pose: he stands calmly, one hand stroking his moustache, a small confident half-smile, one eyebrow raised as if planning the next move. Full body, three-quarter front view, standing, centred, filling the height of the image. Calm, clever and warm. No written text, no letters, no numbers anywhere in the image.
Every hand has exactly five fingers: one thumb and four fingers, never four, never six.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.18 End screen character — sad

```text
A character illustration for a mobile strategy game's defeat screen: Marshal Pleat, a friendly origami general folded entirely from matte paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, like a handmade paper figure photographed in soft daylight from the top left. He wears a long navy and royal blue folded-paper coat (#1d3f8a, #2f63c4) with cream lapels, gold paper buttons and gold epaulettes, a large paper bicorne hat with a gold trim and a small blue cockade, cream paper trousers and dark blue paper boots. His face is folded from peach paper, round and friendly, with small dark eyes, rosy paper cheeks and a big curled white moustache. His rolled paper map has come half unrolled and hangs from his hand. Sulking pose: a comic pout, his moustache drooping, his bicorne slightly crooked over one eye, shoulders down, one hand scratching the back of his head — disappointed but clearly ready to try again, never hurt and never crying. Full body, three-quarter front view, standing, centred, filling the height of the image. Funny and endearing. No written text, no letters, no numbers anywhere in the image.
Every hand has exactly five fingers: one thumb and four fingers, never four, never six.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.19 Village houses

```text
A sprite sheet of 6 buildings for the home camp of a mobile strategy game, arranged in a strict grid of 3 columns and 2 rows of equal square cells, one building per cell, every building centred horizontally in its cell with clear empty space around it so the sheet can be cut cell by cell, no building touching another. Every building is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, soft natural daylight from the top left, like a macro photograph of a handmade paper diorama. Walls in cream paper, wood in light brown kraft paper, roofs and banners in blue paper (#2f63c4, #5b8fe0) with gold paper details. Every building is seen from the same three-quarter front view, the camera about 35 degrees above the ground, and stands upright with its base on the same invisible ground line near the bottom of its cell. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch, no cast shadow, no base under any building. Row 1, left to right: the Quartermaster, a striped blue and cream market tent with stacked kraft crates, barrels and a small paper sack of gold coins in front; the Hall of Banners, a three-step cream podium under a row of hanging blue and gold paper banners; the War Room, a large blue command tent with its front flaps open on a small table holding a paper map and tiny flags. Row 2, left to right: the Folding Workshop, a cosy cream cottage with a blue roof, stacks of coloured paper sheets by the door and two small white origami cranes sitting on the roof ridge; the Crane Roost, a round wooden dovecote tower with a blue conical roof and small openings, three white origami cranes perched on its ledge; the Lighthouse, a cream and blue striped paper lighthouse with a gold lamp room. No written text, no letters, no numbers anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.20 Stickers

```text
A sprite sheet of 20 collectible pieces for a mobile strategy game, arranged in a strict grid of 5 columns and 4 rows of equal square cells, one piece per cell, every piece centred in its cell with clear empty space around it so the sheet can be cut cell by cell, no piece touching another. Every piece is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, soft natural daylight from the top left, like a macro photograph of a handmade paper object, each one bold and readable at a small size, seen in a three-quarter view. The four pieces of row 4 look the most precious, with more gold paper and more folds. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch and no cast shadow. Row 1, left to right: a single sheet of cream paper with its first fold, one corner folded over; a white origami crane; a blue paper bicorne hat with a gold trim; a sealed cream envelope with a red wax seal; a small round glass ink pot with a feather quill. Row 2, left to right: a red wax seal stamp with a wooden handle; a small blue and cream paper drum with two drumsticks; a white origami paper boat; an hourglass with a kraft wooden frame and golden sand; a compass rose folded from cream and gold paper. Row 3, left to right: a pine tree covered in white paper snow; a brass and blue paper spyglass; a small hot-air balloon of blue and cream paper strips; a gold paper crown; a cream and blue striped paper lighthouse. Row 4, left to right: a white paper flag frozen with little paper icicles on a wooden pin; a grand sailing galleon folded from blue paper with gold trim and cream sails; a white paper flag of truce crossed with a folded blue paper arrow, for a ceasefire; a red origami marshal's bicorne hat with a white plume and gold trim; a large origami crane folded entirely from shiny gold paper. No written text, no letters, no numbers anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.21 Menu decor objects

```text
A sprite sheet of 8 decorative objects for the menus of a mobile strategy game, arranged in a strict grid of 4 columns and 2 rows of equal square cells, one object per cell, every object centred in its cell with clear empty space around it so the sheet can be cut cell by cell, no object touching another. Every object is made of folded origami and cut paper: matte coloured paper with crisp creases and flat facets, two or three tones per colour to show the folds, visible paper fibres, soft natural daylight from the top left, like a macro photograph of a handmade paper object, each one seen in a three-quarter view. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. No ground patch and no cast shadow. Row 1, left to right: a white origami crane with its wings spread; a blue folded paper flag on a wooden pin; a white origami paper boat; a blue origami horse rearing up. Row 2, left to right: a red origami horse rearing up; a red folded paper flag on a wooden pin; a small stack of colourful paper sheets with the top one half folded; a rolled cream paper map tied with a blue ribbon. No written text, no letters, no numbers anywhere in the image.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.22 App icon

```text
A square mobile app icon, 1024x1024 pixels, for a strategy game made of origami and cut paper, filling the whole square edge to edge with no border and no rounded frame. In the centre, a friendly origami soldier folded from matte blue paper (#2f63c4, #5b8fe0) with a paper bicorne hat with a gold trim, saluting with one hand, shown from the waist up, big and bold so it reads at a small size; behind him a large folded blue paper flag on a wooden pole, and at the bottom a small red paper flag lying folded. The background is a teal paper ocean (#1f8a96, #38a6ad) of layered cardstock with two cut-out wave strips, plus a small cream paper island edge at the bottom. Crisp creases and flat facets, two or three tones per colour, visible paper fibres, soft daylight from the top left, strong simple shapes and high contrast. No written text, no letters, no numbers, no logo anywhere in the image.
Every hand has exactly five fingers: one thumb and four fingers, never four, never six.
Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.23 Music — one track in six sections

Cut into sections by hand afterwards, following [MUSIC.md](MUSIC.md): one
quiet section for the menus, one per band. The ticks are long, so the round's
beds must loop for minutes without tiring: calm, low-energy sections.

```text
Instrumental only, no vocals. A gentle, thoughtful orchestral piece for a slow, cosy strategy game about paper armies, 84 BPM, steady 4/4, about 3 minutes, in six clearly separated sections of about 30 seconds each that can be cut and looped for a long time on their own without tiring the listener. Instruments: pizzicato strings, soft brushed snare and a light bass drum like a toy band, woodwinds (clarinet, flute, bassoon), a glockenspiel and a celesta for the paper sparkle, a warm tuba for the bass, a few plucked harp notes. Section 1: very calm and quiet, only celesta, harp and soft pizzicato — a menu theme. Section 2: the main theme, curious and light, a small island adventure. Section 3: warmer and fuller, a golden harvest feeling with bassoon and tuba. Section 4: mysterious and soft, staccato woodwinds tiptoeing through a whispering forest. Section 5: cold and crisp, glockenspiel and high strings, a snowy expedition with a slow steady drum. Section 6: the grand theme, the full band, confident and noble but still gentle and never aggressive. Clean mix, no sound effects, no sudden loud hits, each section ending on its own downbeat so it loops.
```

______________________________________________________________________

## 11. Definition of done

[CLAUDE.md's list](../CLAUDE.md#definition-of-done-for-a-new-game) applies
whole. On top of it, for this game:

- [ ] `resolve(state, orders)` holds the whole round's logic; the renderer
  only reads the state.
- [ ] Every random draw, the maps included, comes from a seeded generator:
  the same seed plays the same stage.
- [ ] An order stays editable until it leaves; *Send* and the bell send every
  draft and nothing else.
- [ ] The tick never runs while a card is open or the game is off screen; an
  abandoned stage writes no result and starts over.
- [ ] Every stage has its own map; every region reads its terrain and its
  owner at once (paper and tissue); the ocean fills the screen at every
  camera.
- [ ] Every piece stands on its foot, sorted far to near, with its contact
  shadow on the paper.
- [ ] The ground is baked once per stage and re-projected only when the camera
  moves; the largest map loads in under 2 s on a mid-range phone.
- [ ] The three objectives of every stage light live on the pill and are
  worded on the OBJECTIVES card.
- [ ] The thirty stages are benched (12 seeds or more a stage, a scripted
  pilot sending orders through the same function as the drag): every stage
  winnable at one star by a plain pilot, three stars by a good one.

______________________________________________________________________

## 12. What is not decided yet

- **The tick curve.** 2 min → 10 min is the brief; the bench and a phone say
  whether a stage's decisions fit it, and whether the target ticks are right.
- **The tissue.** Terrain as paper and owner as tissue (§5.2) is the plan; it
  is tried in `lab/conquest-paper.html` before the first stage is built.
- **The camera.** *Close 30°* is the default; whether a 70-region map needs a
  wider default, or a mini-map, is decided on a phone.
- **The length of the late stages.** Up to 20 ticks of up to 10 minutes is a
  long sitting with no save; the bench and a playtest say whether the late
  stages need fewer ticks, or whether a save becomes worth adding to the
  motor.
