# FOLDIERS — from the prototype to the game

The plan of record for a new game: a slow conquest of the world played in
**ticks**, against the game, on a map made of cut paper with origami armies
standing on it. The mechanic was validated by `prototype/conquest-ticks.html`
and the look by `lab/conquest-paper.html`; **v0.1.0 is built** in
`games/foldiers/` — all thirty stages, every asset of section 10 filed — and
section 13 says what it is and what it still owes.

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
| every sheet of section 10                 | `assets/image/master/foldiers-*.png` — **all generated and filed, do not regenerate**                        |
| their temporary cuts, for the lab only    | `lab/conquest-paper/{blue,red,object}-NN.png` — the game cuts its own with `cut-objects.mjs --grid 4x4`      |
| the game                                  | `games/foldiers/` (v0.1.0)                                                                                   |
| the bench of section 11                   | `tools/lab/bench-foldiers.mjs` — the thirty stages played by a scripted pilot in Node                        |
| frames of the web build                   | `tools/lab/shoot-foldiers.mjs` — a level, the village, gestures in design px                                 |

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
- **Intro demo:** `CONFIG.intro.demo = "tap"` — the shared finger taps a blue
  region (it wears a white rim), a paper rosette with a sword pops on the
  neutral one next door, the finger taps it and a folded arrow unfolds, then
  it taps *Send* and the region takes the blue tissue. Desk: `intro.desk` =
  click (pick a region, then an action), drag (move the map), click (Send).

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
- **Orders.** Two taps, and a drag only ever moves the map (chosen in
  `lab/foldiers-target-actions.html`, preset *G · Chosen*). A tap anywhere
  on a region picks it — a piece standing on it (its troops, its flag, its
  building) picks ITS region even where it stands over a neighbour's paper —
  and opens its card (one layout for every region: its name on its owner's
  tag followed by what stands on it as tags, its land tagged in the
  top-right corner, then its building in a frame beside its numbers as
  captioned figures — troops, riders, per tick, defence — then one line per
  thing to know behind the sign the map draws for it, then its actions).
  A region of YOURS picked up stamps its troops on the spot, gets a white
  rim, dims every region it cannot act on, and **every region it can act on
  wears its actions** as paper rosettes over its troops: the main one big,
  the others small down its right side — **All**, **Half**, on a region
  holding both arms **Foot only** and **Cavalry only**, the cavalry's ride
  two regions away, the cannon's shot, the balloon's airlift, and **Cancel**
  where an order already goes (that order leads the row and wears a green
  tick). A rosette's rim is the verdict of its fight, its figure how many
  leave; a sword attacks, chevrons move into a region of yours. A tap on a
  rosette gives the order and puts the region down; a tap on the target
  region itself gives its main action; the sea, or the same region again,
  puts it down. A tap on an arrow picks its region up again. **The camera
  brings every rosette on screen** between the resources under the HUD and
  the top of the card, moving as little as it can: not at all if they all
  fit, else the smallest pan, else a zoom out to 0.8 of its zoom at most;
  what still does not fit gets an arrow on the edge of the frame, which a
  tap follows. The arrows are drawn over the pieces. One order per region
  per tick — **two when it holds cavalry and foot**, one per arm, so the
  riders are never held back by the foot (stage 9); moving between two of
  your own regions is a reinforcement.
- **The tick resolves everything at once** (both camps' orders):
  1. each order takes its troops out of its region;
  1. two enemy columns crossing the same border meet halfway and cancel each
     other troop for troop;
  1. in every region, the troops that stayed plus the friendly arrivals fight
     every enemy arrival, counted in **whole points** so a fight adds up in
     one's head: a troop is worth **2** in attack and **3** in defence, and
     every bonus adds or takes points (a fort +1 per defender, a palisade +1,
     a general +1 per troop of his army, a river −1 per troop crossing it,
     morale ±1 per step for the whole army). The side with more points wins
     and keeps `round(points left over ÷ points per troop)` troops — 20
     against 12 leaves 8, so 4 attackers — at least one and never more than
     it sent; a tie leaves the region to its owner with no troops;
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

**The player reads one word for it: a TURN** — "turn" in English, "tour"
in French: `Turn 3 / 15` and `Time 7:43` in the HUD, "at the end of the
turn" for what resolves. The code and this document keep `tick` and `bell`
(the moment a tick ends), which never reach the screen. In French the
pieces that would collide with "le tour" are named apart: the siege tower is
the *beffroi*, the watchtower the *poste d'observation*.

**The playing area is the BOARD** — "board" in English, "plateau" in
French — so that in French "carte" means one thing in a round: a CARD, and
the cards a tapped region deals sit in the player's HAND ("main"). "Map" /
"Carte" stays the shell's own word for the map of the thirty stages, and a
level stays a "stage" in both languages, as the shell writes it ("Stage
réussi !"); "niveau" is the player's xp level. The code keeps `map` / `M`.

- **Orders are drafts until they are sent.** A drawn order shows as its
  arrow; the player can change it, halve it or cancel it as often as they
  like during the tick. Nothing is final before it leaves, and **everything is
  final once it has**: a column on the road (a fleet, a march in the snow, a
  courier's late order) cannot be recalled, and its troops come back under
  the player's hand when they land. The region it left keeps ordering what
  stayed behind.
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

- **The ground is cut paper, with scissors**: every edge is straight. A
  region is the Voronoi polygon of its seed, the coast the bisector with a sea
  seed (virtual ones stand past the lattice's rim), each long coast edge
  folded once near its middle. Land sheets stacked by height (three, by the
  distance to the coast), each showing its thickness on its near edge, its
  shadow beyond it and a lit rim; a cream beach and two shallows grown out of
  the coast by fixed widths; rivers cut out of the land, a bank on each side;
  a ridge a row of folded paper tents; region borders as fine creases; every
  sheet a mosaic of shards a shade apart. **The ocean is teal** (`#156c7a`,
  `#1f8a96`, `#38a6ad`, deep to shallow), cut in folded wave strips, so it
  never reads as the blue camp, and it **fills the whole screen**: a periodic
  tile of deep sea. No table, no tray.
- **The camera** projects the ground onto a tilted plane and stands the
  pieces on it, sorted far to near and scaled by depth. The default is the
  lab's **Close 30°** (tilt 30°, perspective 20 %, zoom 1.9): the player drags
  the map anywhere but on troops to pan, pinches to zoom, and a double tap zooms out to the whole map
  and back. On a desk the cursor is a hand over the empty map, the arrows
  (WASD / ZQSD) pan, the wheel and + / − zoom; the guide's *Moving the map*
  page says so, per device.
- **The pieces** are the cuts of the asset sheets (§10), drawn by their foot
  and glued to the paper: **no contact shadow**, except under what flies (a
  balloon, a cloud, the storm), where the shadow is what tells it is in the
  air. A region shows its building (capital, fort,
  town), its flag and one to three figures for its troops; the exact count is
  a paper tag beside them.
- **The arrows say what an order does**, as in
  [`lab/conquest-ink.html`](../lab/conquest-ink.html), redrawn in paper:
  - **every march** (an attack, a landing, a move between own regions) — one
    folded paper strip, light half, dark half, a crease (the lab's paper
    arrow); the chevrons of a move are gone (`lab/foldiers-arrows.html`);
  - **march** over several ticks (courier delay, winter, cavalry, a fleet) —
    footprints walking ahead, ending in a head;
  - the cannon's shot and the engineer's bridge — a dashed line ending in a
    head;
  - a draft not sent yet — the same arrow, lighter, its crease dashed;
  - a red order revealed by a scout or a spy — the same arrow at half
    opacity, no eye: what shows it is already on the map;
  - an order over several ticks is drawn **whole on the tick it is given**;
    on the ticks after it, the route stays as a ghost.
- **An order carries its troops** (`lab/foldiers-arrows.html`). While you
  plan, a troop or a piece given an order leaves the map and rides on its
  arrow: one small paper disc for each kind of troop, the figure cropped by
  it, no count, strung on the shaft at 45 % of its length and slid along it
  to clear another string. What still stands on a region still owes an
  order. Defend and Wait put ONE badge in the figure's place: the same disc,
  its border a looped arrow (green, grey). No count is drawn on a figure and
  no tag at an arrow's head while you plan: the forecast and the ticks are
  read on the target's rosette as the order is given.
- **What the map adds on top** (`lab/foldiers-upgrades.html`):
  - the **upgrades are won on the map**: every upgrade the stage deals shines
    as a badge over a region the player does not hold (the piece upgraded in
    a paper disc, a paper arrow pointing up, the new value on a tag), seeded
    from next to the player's land to deep in the map, over the fog too,
    at the heart of its region (the cell farthest from its borders, `spotHome`).
    Taking that region wins it, for the player only: a rival taking it wins
    nothing and no rival camp ever plays an upgrade (`hasUp`). The badge flies
    into the **upgrades' paper**, first of the plates at the foot (upgrades,
    reserve, Send, gold), which unfolds row by row like an accordion, takes
    it with bigger badges (the ones still to win as ghosts), and folds itself
    away 3.5 s later; a tap unfolds it by hand, a tap on a badge, on the map
    or in the paper, opens its guide page (`gu-upgrades` says how they are won);
  - the **forecast** on a target's rosette wears what moved it as stamps laid
    over its top — veterans, a charge, a river on your side, a hold (struck
    when your siege tower cancels it) on theirs, each with its point;
  - the **weather** coming is its cloud hanging over the region (the storm's,
    or a white one shedding flakes), its shadow on the region and the troops
    it will take pinned in the middle of the cloud;
  - the **engineer's works**: a palisade ordered is the engineer's ringed
    badge in the works' gold, a bridge ordered is the same badge standing on
    the river; once built, the palisade stands big in front of the troops,
    the bridge on the river, and each wears a gold "built" tag for the tick
    after the bell.
- **What the bench (`prototype/conquest-ticks.html`) showed has to be read on
  the map:**
  - **a mountain is a ridge, not a line** — thick, with mountain pieces
    standing along it, so it reads as a wall; a thin brown border reads as a
    river;
  - **the next tick's production** is a ghost beside the troops' tag
    (`5 +2`), recruits and winter included;
  - **every order forecasts its fight** on a tag at its head (taken and what
    is left, troops missing, tie, risky, unknown), and every frontier region
    wears a shield that says whether it holds against all its enemy
    neighbours at once; the arithmetic (troops × points, each bonus named) is one
    tap away.

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
what makes thirty maps thirty places. **A stage is one biome**: every
region of its map is cut from the same paper and scattered from the same
decor sheet, so the climb reads as a change of place rather than a patchwork.
The biome is the band's, save in the Whole World, which alternates its two
new ones stage by stage; the endless war draws one per run (`BANDS` and the
stage rows' `biome`, `games/foldiers/game.js`):

| band | world (EN / FR)                            | biome of its stages                      |
| ---- | ------------------------------------------ | ---------------------------------------- |
| 1    | The Paper Isles / Les Îles de papier       | meadow                                   |
| 2    | The Golden Plains / Les Plaines dorées     | wheat                                    |
| 3    | The Whispering Woods / Les Bois murmurants | forest                                   |
| 4    | The Frozen North / Le Grand Nord           | snow                                     |
| 5    | The Whole World / Le Monde entier          | desert (25, 27, 29), jungle (26, 28, 30) |

### 5.3 A map per stage

**Every stage has its own map, with its own number of regions** (8 at stage
1, about 70 at stage 30 — §3's table and §8). A map is data: the land shapes,
the regions with their owner, terrain, building and troops, the extras
(harbours, mines, wonders…), the seed.

- **Generated, then curated.** A generator builds a map from a seed and a
  short brief — the number of regions, of islands, the stage's biome,
  the start positions, what the stage's mechanic needs (a river, passes, a
  wonder) — and checks it: every region reachable, both capitals at the same
  distance in ticks, no camp starting with more production. The designer
  then keeps or rerolls it and moves what needs moving.
- **`lab/foldiers-map.html`**, the map composer, is that loop: a brief, a
  seed, *Generate*, the map on the paper ground under the game's camera,
  regions dragged, owners, terrains and buildings set by a click, *Save* to
  the stage's data. It is the one new lab tool worth building before stage 5.
- **The decor** (trees, rocks, haystacks, cacti…) is scattered by the
  generator from the stage's decor sheet, on the free land of each region,
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
   - `reset()` builds the stage's first state from its data and the
     ground's paths and tiles (cached on the stage's seed);
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

**One new rule a stage.** Stage 1 is the base game of
`lab/foldiers-click-orders.html` (its round 12); every stage after it adds
one rule, explained by its guide page and named once by `Notify.learn`;
everything learned stays. The slots between the new mechanics are
**upgrades** of what the player already has, and stages 19 to 21 are the
**weather**, announced one tick ahead. The weather keeps to its land
(`WEATHER_LAND`): snow falls on snowy land only, a storm breaks anywhere but
the desert — so past band 4 a jungle map has storms only and a desert map no
weather at all. ★1 is the main objective (it ends and
wins the stage), ★2 and ★3 the sub-objectives. *Ticks* is the stage's
target, the one the score's speed bonus counts against.

The base rules (stage 1): tap a region of yours and it deals its cards (one
a troop, one a piece, one a purchase); picked cards go to a lit region as
one CONVOY, three convoys a region at most; every troop and piece owes an
order (Defend / Wait otherwise). A battle is troop for troop: the bigger
side keeps the difference, a tie leaves nobody; every modifier is one flat
point (Defend +1, a river −1), save a fort's walls (+2 to whoever holds
it, broken by a siege tower). The capital (+2), the towns (+1) and the forts
(+1) pay into the RESERVE, dropped on any region linked to the capital.

| lv  | biome | regions | tick  | ticks | rule               | what it does                                                                        | ★1 main objective                    | ★2                                 | ★3                             | guide page    |
| --- | ----- | ------- | ----- | ----- | ------------------ | ----------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------- | ------------------------------ | ------------- |
| 1   | 1     | 8       | 2:00  | 6     | Orders and ticks   | the base rules above                                                                | take the red capital                 | lose no region                     | finish in 6 ticks              | `gu-orders`   |
| 2   | 1     | 9       | 2:15  | 7     | Forts              | a fort's walls add +2 in defence; it pays +1 a tick to the reserve                  | take the fort of Tolen               | take a fort in one tick            | lose no region                 | `gu-fort`     |
| 3   | 1     | 10      | 2:30  | 8     | Mountains          | a mountain border cannot be crossed; a pass is the only way through                 | take the red capital                 | hold both passes at once           | finish in 8 ticks              | `gu-mountain` |
| 4   | 1     | 12      | 2:45  | 8     | Rivers and bridges | an attack across a river: −1; over a bridge, no loss                                | take the red capital                 | hold both bridges at once          | never attack across open water | `gu-river`    |
| 5   | 1     | 14      | 3:00  | 9     | Sea and harbours   | a harbour ships infantry to another harbour, one leg of sea a tick                  | land on the island and take its city | land on the red coast              | lose no fleet                  | `gu-sea`      |
| 6   | 1     | 16      | 3:30  | 10    | Fog of war         | you see your regions and their neighbours; a watchtower sees two away               | find and take the hidden capital     | take it before tick 8              | lose no region                 | `gu-fog`      |
| 7   | 2     | 18      | 3:45  | 10    | Gold               | a mine pays 1 gold a tick to its owner                                              | take the red capital                 | hold three mines at once           | hold 15 gold                   | `gu-gold`     |
| 8   | 2     | 20      | 4:00  | 10    | Recruitment        | a town or the capital: 3 gold → +3 infantry                                         | take the red capital                 | recruit in 3 cities                | finish in 10 ticks             | `gu-recruit`  |
| 9   | 2     | 21      | 4:15  | 11    | Cavalry            | cavalry rides two regions a tick through own or empty land; 4 gold → 2              | take the red capital                 | take two cities in one tick        | a charge on a capital          | `gu-cav`      |
| 10  | 2     | 22      | 4:30  | 11    | Artillery          | a cannon fires on a neighbour first: −2 there                                       | break the red fortress               | bombard the fortress 3 times       | finish in 11 ticks             | `gu-cannon`   |
| 11  | 2     | 24      | 4:45  | 12    | Bigger towns       | upgrade: a town pays +2 a tick                                                      | take the red capital                 | take two cities in one tick        | finish in 12 ticks             | `gu-towns2`   |
| 12  | 2     | 26      | 5:00  | 12    | Veterans           | upgrade: a convoy with infantry attacks at +1                                       | take the red capital                 | lose no region                     | finish in 12 ticks             | `gu-veterans` |
| 13  | 3     | 28      | 5:15  | 12    | Scouts             | the scout balloon (a piece) sees two regions around it and the convoys leaving them | take the red capital                 | never surprised by an attack       | finish in 12 ticks             | `gu-scout`    |
| 14  | 3     | 29      | 5:30  | 12    | Spies              | the spy (a piece) reads the red regions next to its own: convoys, Defend, reserve   | take the red capital                 | lose no region                     | read red on 3 ticks            | `gu-spy`      |
| 15  | 3     | 31      | 5:45  | 13    | Long guns          | upgrade: a cannon fires two regions away                                            | take the red capital                 | fire the cannon 3 times            | finish in 13 ticks             | `gu-longguns` |
| 16  | 3     | 32      | 6:15  | 13    | Heavy shells       | upgrade: a shot takes 3 troops                                                      | take the red capital                 | fire the cannon 4 times            | finish in 13 ticks             | `gu-shells`   |
| 17  | 3     | 34      | 6:30  | 14    | Rich mines         | upgrade: a mine pays 2 gold a tick                                                  | take the red capital                 | hold 20 gold                       | hold three mines               | `gu-mines2`   |
| 18  | 3     | 36      | 6:45  | 14    | Cavalry charge     | upgrade: a convoy with cavalry attacks at +1                                        | take the red capital                 | a charge on a capital              | finish in 14 ticks             | `gu-charge`   |
| 19  | 4     | 38      | 7:00  | 14    | Snow               | one region a tick is announced for the next bell; snow takes half its troops        | take the pass and the city behind it | lose no troop to the weather       | finish in 14 ticks             | `gu-snow`     |
| 20  | 4     | 40      | 7:15  | 15    | Storms             | the announced weather may be a storm: every troop there is lost                     | take the red capital                 | take the islands across the strait | lose no troop to the weather   | `gu-storm`    |
| 21  | 4     | 42      | 7:30  | 15    | Weather fronts     | two regions announced a tick                                                        | take the red capital                 | hold 20 regions at once            | lose no troop to the weather   | `gu-fronts`   |
| 22  | 4     | 44      | 7:45  | 15    | Wonders            | pulling the wonder's gauge to your end (5 steps) wins the stage outright            | fill your side of the wonder's gauge | keep your capital untouched        | finish in 15 ticks             | `gu-wonder`   |
| 23  | 4     | 46      | 8:00  | 16    | Engineers          | 4 gold: a palisade (the region always defends, +1) or a bridge                      | take the red capital                 | build three works                  | lose no region                 | `gu-engineer` |
| 24  | 4     | 48      | 8:15  | 16    | Sieges             | a siege tower in an attack cancels the defender's Defend, palisade and fort walls   | take the red capital                 | take it within 2 ticks             | finish in 16 ticks             | `gu-siege`    |
| 25  | 5     | 50      | 8:30  | 16    | A third camp       | the green camp plays too, against everyone                                          | take both enemy capitals             | green never touches your land      | finish in 16 ticks             | `gu-green`    |
| 26  | 5     | 54      | 9:00  | 17    | Stone forts        | upgrade: a fort pays +2 a tick                                                      | take the red capital                 | take a fort in one tick            | lose no region                 | `gu-forts2`   |
| 27  | 5     | 58      | 9:15  | 18    | Royal capital      | upgrade: the capital pays +3 a tick                                                 | take the red capital                 | your capital never attacked        | finish in 18 ticks             | `gu-capital3` |
| 28  | 5     | 62      | 9:30  | 18    | Barracks           | upgrade: 3 gold → +5 infantry                                                       | take the red capital                 | recruit in 3 cities                | hold 40 troops                 | `gu-barracks` |
| 29  | 5     | 66      | 9:45  | 19    | Fast ships         | upgrade: a fleet sails twice as far a tick                                          | take the red capital                 | land on two islands                | finish in 19 ticks             | `gu-ships`    |
| 30  | 5     | 70      | 10:00 | 20    | The Marshals' duel | a mirror map against the Red Marshal, every rule on                                 | take the Red Marshal's capital       | lose no region to him              | finish in 20 ticks             | `gu-duel`     |

Removed on 2026-11-11 (the user's cut): grain and farms, supply lines and
depots, couriers and relays, generals, morale and drummers, standing orders,
winter, sea storms, rebellions, truces, betrayal, doctrines and the airlift.

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

## 10. The assets — filed, cut and adopted

**Every piece of section 10 is generated and filed — do not regenerate any of
it.** The prompts were removed once the last sheet came back (they are in the
git history of this file). The art came in as `foldiers/` at the root with the
image model's own French names, and was renamed and filed as below; the 4x4
sheets are cut with `cut-objects.mjs --grid 4x4`, so a cell is the same piece
in every camp's sheet, and every cut is adopted in `art.objects` of the
manifest (258 roles).

| what                                              | file (`assets/image/master/`)                 | cut                                                 | roles (`CONFIG.art.…`)       |
| ------------------------------------------------- | --------------------------------------------- | --------------------------------------------------- | ---------------------------- |
| blue army: buildings, troops, ships, flags        | `foldiers-object-army-blue.png`               | `--grid 4x4`                                        | `armyBlue01`–`16`            |
| red army, same layout                             | `foldiers-object-army-red.png`                | `--grid 4x4`                                        | `armyRed01`–`16`             |
| green army (stage 25), same layout                | `foldiers-object-army-green.png`              | `--grid 4x4`                                        | `armyGreen01`–`16`           |
| blue, red, green specialists and works            | `foldiers-object-works-{blue,red,green}.png`  | `--grid 4x4`                                        | `worksBlue01`–`16`, …        |
| neutral scenery and resources (meadow)            | `foldiers-object-scenery.png`                 | `--grid 4x4`                                        | `scenery01`–`16`             |
| world: fog, winter, storm, wonder, rebels         | `foldiers-object-world.png`                   | `--grid 4x4`                                        | `world01`–`16`               |
| biome decor: plains, woods, north, desert, jungle | `foldiers-object-{plains,…,jungle}.png`       | `--grid 4x4`                                        | `plains01`–`16`, …           |
| paper poof, 16 frames                             | `foldiers-object-poof.png`                    | sliced into its 16 equal cells (ffmpeg `crop`)      | `poof01`–`16`                |
| intro and end screen backdrop                     | `foldiers-background-phone.png`               | —                                                   | `backgroundPhone`            |
| desktop bands                                     | `foldiers-background-desk.png`                | —                                                   | `backgroundDesk`             |
| village hub                                       | `foldiers-background-home.png`                | —                                                   | `backgroundHome`             |
| logotype                                          | `foldiers-title.png`                          | —                                                   | `title`                      |
| end screen character, three faces                 | `foldiers-character-{sad,neutral,happy}.png`  | —                                                   | `characterSad`, …            |
| village houses, 3x2                               | `foldiers-object-home.png`                    | `--grid 3x2`                                        | `home01`–`06`                |
| stickers, 5x4                                     | `foldiers-object-sticker.png`                 | `--grid 5x4 --solid 250 --pad 80 --margin 30 --seq` | `sticker01`–`20`             |
| menu decor objects, 4x2                           | `foldiers-object-decor.png`                   | `--grid 4x2 --as decor`                             | `decor01`–`08` (the pool)    |
| app icon                                          | `assets/image/icon/foldiers.png` (+ `thumb/`) | —                                                   | the site card                |
| music, one track in six sections                  | `assets/audio/music/foldiers.mp3`             | `embed/` for the web, 30 s of it in the playable    | `web.music`, `ASSETS.sounds` |

Two names moved from the plan: the five biome sheets are
`foldiers-object-<biome>.png` and not `-decor-<biome>`, because every role
starting with `decor` joins the shell's decor pool and would be scattered over
the end screen; and the poof is `-object-poof` rather than `-fx-poof`, whose
`fx-` roles are holepocalypse's. Each sheet's cell order is the one of its
prompt, read row by row: `ARMY`, `WORKS`, `SCENERY` and `WORLD` in
`games/foldiers/game.js` name every cell.

The pieces are encoded at 220 px (`FOLD_PIECE` in `tools/lab/encode-art.mjs`),
the poof frames at a fixed half scale; the playable carries only what stage 1
draws — the blue and red armies, the scenery, the poof — and everything else
is web-only (`WEB_ONLY_FOLD` in `tools/build/build.mjs`). The four later
biomes' decor is loaded by the stage that scatters it (`CONFIG.artLazy`).

The paper ground of the round, its terrains, the tissue of the camps, the
arrows and the HUD are drawn by the game. **The sounds are not generated**:
they are roles of the house kit, mapped in the manifest's `sfx` (order drawn
`toggle/clickswitch`, cancelled `miss/void`, the bubble `card/cardplace`, Send
`launch/metalclank`, the bell `warn/marimbataps`, a clash `burst/hitthud`, a
capture `goal/jinglepizzicato`, a region lost `malus/impactmining`, production
`pickup/item`, gold `bonus/uiselect`, the season `world/winter`).

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
- [ ] Every piece stands on its foot, sorted far to near, with no shadow but
  under what flies.
- [ ] The ground's paths are built once per stage and painted again only when
  the camera zooms or pans past its margin; the largest map loads in under
  2 s on a mid-range phone.
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

______________________________________________________________________

## 13. What v0.1.0 is — and what it still owes

`games/foldiers/` plays all thirty stages, the endless war past them and the
playable cut, on the motor, with the meta layer, the village and the guide.
Where it had to decide something this document left open, or departed from
it, it is written here.

- **The rules are the prototype's, ported whole** (`planMoves`, `battle`,
  `resolve`, `applyResolve`, `computeAI`, the forecast), with three changes:
  the AI ships troops between harbours (it never did, and a stage across a
  strait left it idle); **an AI capital away from the front keeps a garrison
  of 4 + tick / 3 and marches the rest** — in the prototype it kept
  everything, and over a long stage its +2 a tick grew into a stack nothing
  could take; and **grain and supply bind the rivals too** — the prototype's
  scenarios had one camp to test them on, and on a big map they bound the
  player alone. A rival does not manage its grain: once its stock is gone, an
  overfed stack thins by one troop a tick.
- **Everything learned stays**: a stage plays every rule of the stages before
  it (`RULE_AT`), except the wonder (stage 22 and the endless war), the storm
  (the sea stages from 20) and the fair Red Marshal (stage 30). The doctrine is
  picked before stages 28 to 30.
- **The wonder is a tug of war** (stage 22 and the endless war): it shines on
  the map from the first tick, through the fog, and wears a gauge — yellow in
  the middle, the player's five steps on one side, the rivals' five on the
  other (`wonderG`, −5 to +5). Every bell the region's holder moves it one
  step its way; a bell where it is nobody's, or where the fight on it ended
  even, leaves it. The player's end wins the stage, a rival's loses it (in
  the endless war it can only lose). Chosen in `lab/foldiers-upgrades.html`,
  view Wonder.
- **The maps are generated, not yet curated** (`genMap`): a jittered hex
  lattice of seeds, rows from the red capital (top) to the blue one (bottom);
  sea carved as a strait across the middle row with islands in it (stages 5,
  20, 29 and the endless war); a mountain ridge is a row boundary with two
  passes, a river the next one with its bridges; then forts, mines, farms,
  towers, the wonder and the starts, checked (every region reachable, both
  rivals at the same distance) and rerolled on a bad draw. A stage's seed is
  fixed (`4242 + n × 7919`), so a stage is always the same map; the endless
  war draws a new one. The map composer of 5.3 is still to build.
- **The camera is drawn orthographic**: at the lab's 20 % perspective the
  depth scale changes by under 4 % across a screen, and a flat transform is
  one transform of the ground's paths instead of one per screen row. Close 30°
  (zoom 1.9) is the default; a map that fits the screen at 0.8 of that opens
  whole. A double tap toggles the whole map; two fingers pinch; on a desk the
  wheel and + / − zoom, the arrows pan and ENTER sends.
- **A bell plays out in two beats** (`MARCH_S`, then `FIGHT_S` where two sides
  meet). The columns MARCH: one to three paper figures by the count, each
  hopping off its feet, rocking side to side and trembling a little on every
  step, along the arrow's own curve, facing the way they go; a fleet rocks, a
  balloon floats. A column bound for a fight stops at the border, and the
  FIGHT is three bumps — attackers and defenders lunge at each other, scraps
  of paper in the camps' colours fly with a white cut-paper star, one thud a
  bump — then the beaten FOLD FLAT on the map and the winners jump. A region
  nobody holds defends with a grey figure of its own. Two columns crossing one
  border bump twice on it and the one left with nothing folds there. The
  paper poof is kept for the cannon's shot only.
- **The ground is vector, not a bake** (v0.2.1): the 1 M-texel bake was
  upscaled ~3× at Close 30° and its half-resolution tissue stair-stepped on
  every border of a camp. Now every sheet is a `Path2D` in world units
  (`geo()`, once per stage, a few ms), the edges that face something lower
  carry their shadow, thickness and rim as strips, and the grain is a
  periodic tile per paper (2 texels a world unit, laid as a pattern, the land
  tiles a stage does not use freed). The tissue — the camps' fill, their
  ribbon clipped inside their own land, the fog, the selection — is paths
  too, rebuilt when an owner, the fog or the selection changes. The whole
  ground is painted into a canvas of the screen's own pixels with a 96 px
  margin and blitted on whole device pixels while the camera pans inside it
  (~4 ms a still frame in headless Chrome against ~8–12 for the bake's two
  `drawImage`s); a zoom or a pan past the margin paints it again (~25–35 ms
  on headless Chrome's CPU rasterizer). Still to measure on a phone (§12).
- **The objectives** follow section 8, with these readings: stage 2's "a fort
  in one tick" is a fort taken on the first tick you attacked it; stage 10's
  second star is *bombard the fortress 3 times* (instead of "lose no troop on
  the fortress", which no assault can meet); stage 18's line is three regions
  of yours behind palisades, and losing one loses the stage; stage 28's *win
  with each doctrine once* is remembered across plays (`foldiersDoctrines` in
  Store). A "never" sub-objective lights only once the stage is won.
- **The playable** is stage 1's map with 10 s ticks, ended after three ticks
  or on the red capital: one star a capture, up to three.
- **The bench** (`tools/lab/bench-foldiers.mjs`) plays every stage with a
  plain pilot. At v0.1.0 it wins most of stages 1 to 23 and leaves 24 to 30
  undecided after sixty ticks: on the 48-to-70-region maps it spreads its
  troops thin where a player would mass them, and walls (24) and revolts (21)
  punish exactly that. Whether the late stages need fewer regions, a stronger
  pilot or easier `web.levels.tune` knobs is the next job.
- **Not done yet**: the bed cut into one section per band (docs/MUSIC.md), the
  map composer, the codex (optional, 9.3), the store images, and a phone
  playtest.
