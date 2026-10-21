# HOLEPOCALYPSE — from the prototype to the game

The plan of record for the fourteenth game: golf against a zombie horde. It is
**built** as `games/holepocalypse` (v0.1.0), on the motor, with every asset
below filed and adopted; what the first build simplified is in
[§12](#12-what-the-first-build-decided).

Everything a session needs to build it is here: the rules the prototype
validated, the steps on the motor, the five biomes, the roster of zombies, the
ten ball kinds, the twenty supers, the thirty levels, the meta layer, and one
complete prompt for every asset still to make.

______________________________________________________________________

## 0. Where things are

| what                                       | where                                                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| the rules prototype (plain shapes)         | [`prototype/siege-golf.html`](../prototype/siege-golf.html)                                                                       |
| the ten launcher controls tried            | [`prototype/siege-golf-controls.html`](../prototype/siege-golf-controls.html) — #8 won                                            |
| the art pass, the reference for every rule | [`prototype/holepocalypse-art.html`](../prototype/holepocalypse-art.html)                                                         |
| the game                                   | [`games/holepocalypse/`](../games/holepocalypse/)                                                                                 |
| the five fairways                          | `assets/image/master/holepocalypse-fairway-0{1..5}.png` (country → graveyard)                                                     |
| the horde and the bosses                   | `holepocalypse-object-<zombie>.png`, `holepocalypse-object-boss-<name>.png`                                                       |
| the app icon                               | `assets/image/icon/holepocalypse.png` and its 320 px `thumb/`                                                                     |
| key art for the listing images             | `holepocalypse-store-invasion.png`, `holepocalypse-store-desk-haunted.png` (not shipped)                                          |
| every sprite and effect, one click each    | [`lab/holepocalypse-fx.html`](../lab/holepocalypse-fx.html) — `make events` → `/hole-fx`, drives the web build through `Game.lab` |
| the ball flag and the hole, tuned          | [`lab/holepocalypse-flags.html`](../lab/holepocalypse-flags.html) — the hologram, the optional flagstick, the cups in perspective |

The painted sources arrived in a `holecopalyspe/` folder at the repo root and
were filed under `assets/image/master/` with the names of §10. A fairway is
`fairway-NN` and not `background-phone-<band>`: the round paints it on the
canvas, so a playable can scale it into the room above its CTA bar, and the
plain `background-phone` (the dusk panorama) stays the intro's and the
menu's. A `<slug>-store-<name>.png` is key art kept for the store images:
encode-art skips it like an object sheet, so it is embedded in no build.

**Slug:** `holepocalypse`. **Store subtitle:** *Holepocalypse: Golf Siege* — the
word "hole" alone points at the hyper-casual "hole.io" genre, the subtitle and
the flag on the icon say golf. Keep marketing copy away from *in the hole*,
*fill the hole*, *deep hole*.

______________________________________________________________________

## 1. The game in one sentence

A zombie horde shambles down a sloped fairway toward your tee; you fling golf
balls that ricochet and knock zombies into each other, and a ball rolled
slowly into the hole fires a shockwave that wipes most of the field.

- **Intro tagline (EN):** `Fling <b class="w-shot">golf balls</b> at the horde and roll one into the <b class="w-hole">hole</b> to blast them all.`
- **Intro tagline (FR):** `Lance des <b class="w-shot">balles de golf</b> sur la horde et fais-en rouler une dans le <b class="w-hole">trou</b> pour tout balayer.`
- **Tags (EN):** golf, zombies, arcade. **(FR):** golf, zombies, arcade.
- **Intro demo:** `CONFIG.intro.demo = "aim"` — the shared finger presses in
  the blue band and drags out; the SKIN draws the two bands and a ball rolling
  into a zombie. Desk: `intro.desk` = mouse drag.

### 1.1 Who it is for, and the hero who speaks to them

**The audience is young players, mostly boys, aged 8 to 12.** Everything
painted is aimed at them: cartoon action that feels a bit daring, goofy
zombies rather than frightening ones, slime and goo for the gross-out laugh,
big explosions, a hero they want to be. Never gore, never real fear — and the
game falls under Google Play's Families policy like every game of the studio
([TODO.md](../TODO.md), *Android*).

**The hero is Ace, a 12-year-old, the coolest kid on the course and the one
who stands up to the zombies** — the age just above the player's, the kid
they look up to and would want as a friend. He is drawn as a HERO rather than
a mascot, so his silhouette is his own: a tall swept-up quiff with one blond
streak, a red headband with sport shades pushed up on it, a red varsity bomber
with white sleeves over a lime t-shirt, a bandolier of golf balls across the
chest, a compact golf bag worn on the back like a quiver, and a chrome driver
with a red lightning bolt. Sure of himself without being mean: a warm grin, a
wink, he never panics, he laughs at the goofy horde and protects the kids of
the base. Even his sad face is a hero's — he loses a round, never his nerve.
He is the end screen's three faces, the title screen and the store images; a
voice line or a speech bubble, if one is ever added, is his.

______________________________________________________________________

## 2. The rules the prototype validated

Every number below is the art prototype's, tuned by play. They are the
starting values of `CONFIG`, not final balance.

### 2.1 The field

- **Portrait, top-down, flat.** The tee is at the bottom, the zombies come
  through a gate at the top, a defense line crosses the fairway just above the
  tee box.
- **A golf course, not a pinball table** (v0.2.0): nothing pulls a ball home.
  It slows on the grass — a constant friction plus a drag that bites at speed
  (`ROLL_DECEL 520` + `ROLL_DRAG 0.9`·speed px/s², so full power rolls about
  1180 px, the whole field) — comes to rest (`REST_SPEED 14`), fades for
  `REST_TIME 0.45` s and goes back into the bag. The first layout had a slope
  (`SLOPE 300`) that sent every ball back down like a flipper; it is gone.
- **The fences are the painted ones.** The fairway narrows toward the gate; the
  physics walls are slanted lines measured off the picture (§10, *geometry*):
  biome 1 is `wallL(y) = max(60, 180 − 0.165·y)` and
  `wallR(y) = min(660, 539 + 0.189·y)`, gate `x 260…465`, top `y 140`, defense
  line `y 1107`, tee `(360, 1186)`. A ball hitting a fence reflects on its
  normal (`fenceBounce`), restitution `0.6`; a bumper returns `0.85` of the
  speed (it used to kick, `1.15`).
- **The zombies fan out of the gate**: each one steers toward its own share of
  the fairway width (`lane`, `FAN_SPEED 40`), so the horde opens like a fan
  instead of marching in a column.

### 2.2 The launcher — the arc

Chosen out of ten control schemes (`siege-golf-controls.html`, #8 *Arc pad*):

- **A half-disc around the tee, cut into two bands.** Inner band, blue,
  **Direct** (`DEAD_ZONE 50 … SPLIT_R 210`). Outer band, orange, **Lob**
  (`SPLIT_R 210 … LOB_R 380`). Beyond the arc is Direct again.
- **The band the touch STARTS in picks the shot for the whole gesture.** A
  start beyond the arc is Direct, so a tap on a zombie blasts it. Dragging
  through the other band never changes the shot — that was the bug the user
  hit when sliding outward for power.
- **The angle of the finger around the tee aims; its distance from the tee is
  the power**, across the whole arc (`DEAD_ZONE … LOB_R`), whatever the shot.
  Beyond the arc is full power.
- **The preview says which shot it is, unmistakably:** Direct is small blue
  dots flat on the grass, a white star at every fence bounce and a green ring
  where the ball comes to rest — the whole roll is drawn, so the ring is the
  point to put on a cup; Lob
  is an orange arc lifted by its height, dots growing toward the top, its
  shadow dashed on the grass and an orange target where it lands. The tee ball
  wears the mode's colour ring. There is no power gauge beside the ball
  (v0.5.1): the preview already says how far the shot goes, and the bands
  name the mode.
- **A shot always leaves upward** (`MIN_UP 0.15`), and `FIRE_COOLDOWN 0.12`
  — `BOSS_COOLDOWN 0.6` between two bag shots while a boss stands, swept round
  the tee in red; a shot released during it is held and leaves when the tee is
  ready. The gun's free balls never wait for it.
- **The arc is painted on the grass**: over the fairway and its terrain, under
  the cups, the zombies and the balls.

### 2.3 Direct and lob

- **Direct:** speed `SHOT_MIN 420 … SHOT_MAX 1900`. Rolls, ricochets off the
  fences, the bumpers and the zombies.
- **Lob:** flies over everything (no collision but the fences and the top),
  height `z` on a parabola (`LOB_G 2400`), lands at a distance
  `LOB_MIN 120 … LOB_MAX 950` from the tee, flight time
  `0.45 + distance/2200` s. On landing it hits what it falls on
  (`LOB_DMG 2`, the ball kind's effect, a 220 px/s kick up the field), then
  rolls on at `LOB_ROLL 0.35` of its speed — slow enough to drop into a hole.
  An explosive lob is a mortar.
- **A lob scatters** (v0.2.2): it lands at a random point of a circle round
  the aimed spot, whose radius grows with the range — `8` px at `LOB_MIN`,
  `95` px at `LOB_MAX`, along `f^1.5` so a short chip stays near exact. A long
  lob on a cup was too sure a thing. The preview draws that circle, dashed,
  with the aimed spot in it.
- **A direct shot aims better under stress** (v0.5.0): it leaves off its line
  by a triangular error inside `±AIM_ERR`, from `0.28` rad (~16°) on a calm
  field to `0.012` rad when it is crowded. The stress counts the zombies
  standing — one in the lower half of the field counts up to `1 + STRESS_NEAR`,
  a boss `STRESS_BOSS 5` — mapped from `STRESS_CALM 1` (calm) to
  `STRESS_FULL 9` (full), and eased at `STRESS_RATE 1.5`/s so a spawn does not
  snap the aim. A crowded screen is not made harder by the aim on top of it; a
  quiet one is where a shot has to be earned. The preview draws the cone off
  the tee, wide and pale when calm, a hairline under pressure. Lobs keep their
  own scatter and the gun (Rush, the last stand) stays exact.

### 2.4 The bag

Five balls (`BAG_MAX`). A shot takes one; a ball coming to rest (or knocked
back past the line) returns it. A ball gone for good (exploded, timed out after `BALL_LIFE 12` s)
comes back after `BAG_REGEN 2.5` s. Balls a super throws are free: they take
nothing and give nothing back.

### 2.5 The hole and the shockwave

- **A ball slower than `HOLE_MAX_SPEED 560` that rolls over the hole drops
  in** (a slight pull, `HOLE_PULL 1600`); faster, it skips over (*Too fast*).
- **A ball in the hole fires a shockwave** from it whose radius is computed to
  cover **80 % of the fairway inside the fences** (`SHOCK_COVER 0.8`), expanding
  in `0.5` s, with a flash and a shake. Every zombie its front reaches is
  killed, and the kills chain on that shot.
- The ball comes home, the hole moves elsewhere on the fairway.
- **Hole in one** (straight from the tee, no bounce, no zombie touched) pays
  double.

### 2.6 The ball flags — anywhere on the fairway, ball kinds

- **One or two ball flags** (the level's `kinds`, the side holes of the first
  layout) are dropped at random on the fairway (`moveFlag`), clear of the
  hole, the supers, the bumpers and the terrain: a cup with a hologram rising
  out of it, the kind's icon turning in a beam of its colour. The hole's own
  hologram is red, taller and carries the shockwave's toxic ring. There is no
  flagstick: a hologram sinks into its cup while a zombie or a ball passes
  through it, so nothing is ever drawn through a pole. Every cup, glow and
  recharge lies on the grass as an ellipse of one ratio (`GROUND_SQUASH`
  0.42), the fairway's perspective; tuned in `lab/holepocalypse-flags.html`.
- **That is the choice of every putt**: the red flag fires the shockwave; a
  ball flag gives a **lost flag back** (never past three, not during the last
  stand) and loads special balls.
- **A player's ball rolled in slower than `SIDE_HOLE_MAX 900` drops in**
  (kinder than the main hole, pull `1800`): it loads **3 balls of that kind**
  on the tee (`LEFT_EXTRA`, queue capped at `SPECIAL_MAX 4`), the ball itself
  comes home, and the flag moves to a new spot where it is capped for
  `TARGET_COOL 8` s — a capped cup is rolled over. A super's ball never drops
  in.
- **The bag is a row of big balls under the tee**, the next shot first, each
  ball wearing the kind it will leave as; a ball out on the course is an empty
  socket ringed white, the one coming back by itself fills its ring. Left of
  the tee, the special about to be fired is named with its count. The tee
  ball wears its colour in a pulsing ring. The level pill's "!" stands on top
  of the pill (`--lv-log-left` / `--lv-log-bottom` in the SKIN) to leave the
  row its room.

### 2.7 The supers — right, tapped

- **Two super buttons** against the right fence. **Every kill charges both**;
  `SUPER_KILLS 12` kills fill one. A full super is tapped and fires; an empty
  one says how full it is. Balls go through the buttons.
- A tap on a super is checked before the launcher, so a touch that lands on
  one never starts an aim.

### 2.8 The last stand

The flag that would end the run buys **8 s of the gun** instead, once per run:
every zombie is knocked back (`LAST_PUSH 450`), the launcher becomes the gun
(hold to auto-fire toward the finger every `0.12` s, free balls; tap for a
putt that comes to rest right where you tapped). Survive it and one flag
comes back. The gun is also what the **Rush** super runs for 6 s. It draws
its reticle and its balls and nothing else: the coloured frame round the
field and its countdown bar went in v0.2.1 (the last stand's seconds are on
the HUD).

### 2.9 Zombies, billiards, chains, flags

- A ball hit damages by speed: `max(1, floor(impact / 380))`, nothing under
  `150`. It is an elastic hit with mass (`MON_MASS 2.5`, ball 1): the zombie
  is knocked back and its knockback dies out (`MON_DRAG 3.5`).
- **Zombies are billiard balls**: they push each other, and two colliding
  faster than `MON_HIT_SPEED 240` both take 1 damage — the chain reactions.
- **A chain** counts every kill one shot causes, by hit, knockback, explosion
  or wave; the n-th kill of a chain pays `n × 100`.
- **Three flags.** A zombie whose feet cross the line costs one.

### 2.10 Depth — the footprint and the draw order

Found the hard way (a direct shot looked like a lob):

- **A zombie's collision circle is its footprint on the grass**, centred near
  its feet (`FEET_DROP 0.19` of a `SPRITE_H 118` sprite under the circle's
  centre) — a rolling ball touches it where it stands.
- **Zombies (by their feet) and rolling balls are painted far to near**, so a
  ball behind a zombie is hidden by it; balls in the air are painted on top.
  Every ball carries a small shadow.

### 2.11 Sprites

- A zombie animates from its sheet: walk at `WALK_FPS 7` on its own clock
  (stopped while frozen), hit for `HIT_TIME 0.3` s on every non-lethal hit with
  a white flash, knockout in `0.6` s, held `0.7` s, faded in `0.4` s.
- **What the walker sheet taught** (it came back usable but dirty):
  - its rows did not sit on a grid — feet overflowed into the next row — so
    frames were found by **connected alpha components**, not by cells;
  - a **soft halo** (alpha 1–60, 20 % of the pixels) surrounded every figure
    and stained the grass: alpha `< 80 → 0`, `80…200` ramped, `≥ 200` solid;
  - each frame is anchored on its **feet** (bottom of the main body, x at its
    alpha-weighted centre), never on its box.
  - In the motor: cut with `cut-objects.mjs … --grid`, encode with a fixed
    `scale` profile (a sheet of frames must not be boxed frame by frame, or
    the zombie pulses in size — marshmelt's lesson), measure the feet off the
    pixels.

______________________________________________________________________

## 3. Building it on the motor

Follow [CLAUDE.md](../CLAUDE.md#how-to-create-a-new-game) and
[CREATING_A_GAME.md](CREATING_A_GAME.md) from the top. What is specific:

1. `games/holepocalypse/` from the template's three sources, then the
   manifest: `title`, `version 0.1.0`, `targets ["playable","web"]` (android
   later), `theme` (fairway green, toxic lime accent `#9fe03a`, dusk purple),
   `web.font` **`russoone`** (a single-weight display face that matches the
   chunky golf-arcade look), `web.music`, `web.levels`, `web.meta`,
   `web.village`.
1. **`CONFIG`**: `gameSeconds` unused by the levels (a level ends on its own
   goal); `layout` bands so `Layout` is the fairway between the HUD and the tee
   box; `CONFIG.sceneArt = true` and `Art.scene()` in `render()`, because the
   round's ground IS the biome's painted fairway (radiam's pattern, one
   background per band: `-background-phone-<band>.png`); per-biome geometry
   (fence lines, gate, line, tee) in a `BIOMES` table, re-measured off each
   painted fairway.
1. **`Game` module** — port from `prototype/holepocalypse-art.html`, dropping
   its loop, canvas sizing, HUD text, the DOM Powers menu and the debug lines:
   the field, `fenceBounce`, the launcher (`aimVec`, `lobVec`, `bandOf`, the
   start-band lock), balls (`updateBall`, `lobLand`, `applyMod`), the hole and
   `coverRadius`, side holes, supers, zombies (`spawn`, `updateMonsters`, the
   billiards), drops, zones, sweeps, the gun (`climbTo`, `rollOf`).
   - `render()`: wrap the board's elements in `Enter.begin/end` in landing
     order — the side holes and supers, the main hole, the bumpers, then the
     zombies already on the field.
   - `onDown/onMove/onUp` carry the touch; `onResize` must not touch round
     state before the first `reset()` (pawko's trap).
1. **The words go through the motor**: every MOMENT is `Pop.show` (`Hole!`,
   `Hole in one!`, `Chain x5`, `Shockwave!`, a super's name, `Too fast` as
   `alert`); every piece of INFORMATION is `Notify.say` (`Super charged`,
   `Hole capped`, `Last stand`, `Flag lost`, `Charging 60 %`); the value a hit
   pays is `Pop.text`. No status line on the canvas.
1. **Sound from the house kit**, mapped in the manifest's `sfx`: ball hit →
   `hit`, fence bounce → `bounce`, lob landing → `launch`, hole → `goal`,
   side hole → `pickup`, shockwave → `burst`, boomer burst → `crash`, super
   fired → `power`, flag lost → `warn`, last stand → `defeat`. `make events` to
   hear and check them.
1. **The level hooks** ([LEVELS.md](LEVELS.md)): `Game.levelGoal(n)` returns
   the level's goal and its words (§8), `Game.levelTally()` counts the stars
   (0–3, §8), `Game.levelWon()` ends the round on the goal. `web.levels.tune`
   lerps the pressure (§8).
1. **Loadout.** The level table fixes the two side-hole kinds (they teach).
   The two supers: fixed on levels 1–6, then **picked before the round** among
   the unlocked ones, on one card (`Modal.open`) — *a decision to confirm when
   building*; the cheap alternative is the level table fixing them too.
1. **The art pipeline**: `encode-art.mjs holepocalypse` for the backgrounds,
   title and characters; `cut-objects.mjs` for every `-object-*` sheet, with
   `--grid` matching the prompt and `--adopt`; frame sheets on a fixed `scale`
   profile.
1. **The icon**: copy it to `assets/image/icon/holepocalypse.png`, cut the
   320 px thumb (`sips -Z 320 …` into `thumb/`); no `logo` key once
   `-title.png` exists.
1. `node tools/update.mjs`, `make text` until *fully translated*, then the
   definition of done of [CLAUDE.md](../CLAUDE.md#definition-of-done-for-a-new-game).

**The playable cut** (5 MB, 20–30 s): biome 1 only, one rising wave, Direct
and Lob, the hole and its shockwave, one side hole (explosive) and one super
(ball rain). Everything else is web.

______________________________________________________________________

## 4. The five biomes

One biome per band of six levels. Each brings **one terrain, one or two new
zombies, two ball kinds, four supers**; band 5 brings almost nothing new and
mixes everything.

| band | biome                | terrain (new)                                                               | zombies (new)         | ball kinds       | supers                                           | boss            | music section          |
| ---- | -------------------- | --------------------------------------------------------------------------- | --------------------- | ---------------- | ------------------------------------------------ | --------------- | ---------------------- |
| 1    | **Country Club**     | bumpers (stone planters, sprinkler heads)                                   | Walker, Boomer        | explosive, multi | Ball rain, Fan volley, Time freeze, Hole blast   | Greenkeeper     | swing, mischievous     |
| 2    | **Desert Links**     | bunkers: sand slows balls (×0.5 speed) and zombies (×0.6)                   | Shield                | pierce, heavy    | Seeker rain, Sniper, Sprinklers, Golf cart       | Caddie Colossus | surf-rock twang        |
| 3    | **Bayou Course**     | water: a ball is lost in it, **a zombie knocked into it drowns**            | Mudder (and Mudlings) | homing, split    | Boom volley, Split storm, Magnet hole, Hailstorm | Bog Giant       | swamp blues, washboard |
| 4    | **Frozen Links**     | ice: balls and zombies slide (friction ×0.3, knockback lasts ×2) — pile-ups | —                     | fire, bouncy     | Firestorm, Super bounce, Cluster bombs, Rush     | Yeti            | icy chiptune, sleigh   |
| 5    | **Graveyard Greens** | graves: zombies also rise mid-field from them                               | Runner, Necromancer   | ice, giant       | Meteor, Carpet strike, Golden rain, Mower        | Zombie King     | organ rock, the climax |

The unlocks are cumulative: in band 5 the side holes may hand any of the ten
kinds and the loadout offers any of the twenty supers.

______________________________________________________________________

## 5. The zombies

Numbers at level 1 of their band; `web.levels.tune` raises HP and speed with
the climb. Radius is the footprint (§2.10).

| zombie          | band | HP  | speed | radius | behaviour                                                                                                                            | the answer                            | sheet                                        |
| --------------- | ---- | --- | ----- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | -------------------------------------------- |
| **Walker**      | 1    | 3   | 1.0   | 30     | shambles down its lane                                                                                                               | anything                              | done — walk 8, hit 4, knockout 4             |
| **Boomer**      | 1    | 2   | 0.8   | 28     | bloated; bursts on death: 120 px, 3 damage, 520 knockback to its neighbours                                                          | burst it inside the pack              | walk 8, hit 4, burst 4                       |
| **Shield**      | 2    | 4   | 0.8   | 32     | holds a golf bag in front: a Direct hit from below does 0 damage and bounces off                                                     | Lob over it, bank off a fence, pierce | walk 8, block 4, knockout 4                  |
| **Mudder**      | 3    | 4   | 0.9   | 32     | made of swamp mud; its knockout splits it into two **Mudlings** (HP 1, radius 18, speed 1.4)                                         | homing, split, or a pond behind it    | walk 8, hit 4, split 4 (Mudling = scaled)    |
| ~~Digger~~      | 4    | 3   | 1.1   | 28     | removed in v0.4.0 — burrows (invulnerable, a moving dirt mound), surfaces near the main hole and **drags it** 200 px toward the line | hit it before it digs; Time freeze    | walk 4, dig 4, surface 4, hit 2 + knockout 2 |
| **Runner**      | 5    | 1   | 2.2   | 26     | sprints straight down                                                                                                                | a fast Direct shot, Seeker rain       | sprint 8, hit 4, knockout 4                  |
| **Necromancer** | 5    | 5   | 0.6   | 30     | stops every 6 s and raises the last two knocked-out zombies as Walkers                                                               | top priority: Sniper, Meteor          | walk 4, cast 4, hit 4, knockout 4            |

**The bosses**, one per band, each the climax of level 6 of its band:

| boss                | band | HP  | what it does                                                                                    | how it falls                                     |
| ------------------- | ---- | --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Greenkeeper**     | 1    | 40  | rides a mower straight down one lane, mowing the bumpers; front hits do half damage             | bank shots on its flanks; the shockwave takes 15 |
| **Caddie Colossus** | 2    | 60  | carries an armoured bag-shield; every 8 s throws a golf bag that blocks a lane for 5 s          | lobs onto its head (double damage)               |
| **Bog Giant**       | 3    | 70  | wades through the ponds, splashing mud that slows the balls in a ring                           | knock it back into a pond three times            |
| **Yeti**            | 4    | 80  | freezes a band of the fairway into ice in front of it; charges when hit                         | fire balls; frozen ground makes it slide back    |
| **Zombie King**     | 5    | 120 | a zombie golfer in a crown; swings and **drives skull balls back at your tee**, raising walkers | hit its skull balls back; supers on its court    |

______________________________________________________________________

## 6. The ten ball kinds — the side holes

A kind sits on a ball until the ball comes home or its timer runs out.

| kind          | icon    | effect                                                                     | numbers                         |
| ------------- | ------- | -------------------------------------------------------------------------- | ------------------------------- |
| **Explosive** | blast   | blows up on the first zombie it touches (or where a lob lands)             | 150 px, 5 damage, 650 knockback |
| **Multi**     | three   | splits in three at its first bounce                                        | ±0.42 rad                       |
| **Pierce**    | dagger  | goes through every zombie in its way, 3 damage each, never deflected       | —                               |
| **Heavy**     | boulder | huge knockback, double damage                                              | ball mass 4                     |
| **Homing**    | magnet  | curves toward the nearest zombie                                           | 2 200 px/s², 3 s                |
| **Split**     | helix   | splits in two at every bounce, up to three generations                     | ±0.45 rad, cap 70 balls         |
| **Fire**      | flame   | sets the grass on fire where it hits: a patch dealing 1 damage every 0.5 s | r 50, 3 s                       |
| **Bouncy**    | bounce  | keeps its speed for 6 s, bouncing off the line instead of coming home      | 1 500 px/s                      |
| **Ice**       | snow    | freezes the zombies it hits                                                | 3 s                             |
| **Giant**     | big     | twice the size, +1 damage                                                  | radius ×2.2                     |

______________________________________________________________________

## 7. The twenty supers — the right buttons

Charged by `SUPER_KILLS 12` kills. A rain never pushes a zombie toward the
line: every knockback goes up the field or sideways.

| super             | band | what it does                                                                   | numbers                                |
| ----------------- | ---- | ------------------------------------------------------------------------------ | -------------------------------------- |
| **Ball rain**     | 1    | balls rain on the whole fairway                                                | 24 drops, 0.1 s apart, r 46, 2 damage  |
| **Fan volley**    | 1    | eleven balls fired at once in a fan                                            | ±1.05 rad, full power                  |
| **Time freeze**   | 1    | every zombie frozen                                                            | 4 s                                    |
| **Hole blast**    | 1    | the hole fires its shockwave right now                                         | 80 % of the field                      |
| **Seeker rain**   | 2    | one ball on each of the twelve zombies nearest the line                        | r 40, 3 damage                         |
| **Sniper**        | 2    | three piercing shots at the toughest zombies                                   | 2 400 px/s, 3 damage each              |
| **Sprinklers**    | 2    | water jets push the whole horde back                                           | −520 knockback, 1 damage               |
| **Golf cart**     | 2    | a cart charges up the busiest lane                                             | 560 px/s, 3 damage, side knock         |
| **Boom volley**   | 3    | five explosive balls in a fan                                                  | ±0.7 rad                               |
| **Split storm**   | 3    | three splitting balls                                                          | three generations                      |
| **Magnet hole**   | 3    | for 6 s the hole swallows any ball within four times its radius — at any speed | each one a shockwave                   |
| **Hailstorm**     | 3    | ice balls freeze what they hit                                                 | 20 drops, 1 damage, 3 s freeze         |
| **Firestorm**     | 4    | burning balls leave fire on the grass                                          | 14 drops, patches r 55 for 4 s         |
| **Super bounce**  | 4    | five balls that bounce without slowing                                         | 6 s                                    |
| **Cluster bombs** | 4    | five bombs that each split into five                                           | r 50 then 5 × r 34                     |
| **Rush**          | 4    | the gun: hold to auto-fire, tap to putt, free balls                            | 6 s                                    |
| **Meteor**        | 5    | a giant ball crushes the biggest pack                                          | r 170, 8 damage, 600 knockback         |
| **Carpet strike** | 5    | seven rows of five impacts sweep up the fairway                                | 0.18 s per row, pushes up              |
| **Golden rain**   | 5    | a rain of gold: kills pay ×3                                                   | 18 drops, 8 s                          |
| **Mower**         | 5    | a mower crosses the fairway just above the line, mowing down every walker      | 520 px/s, walkers die, others 3 damage |

______________________________________________________________________

## 8. The thirty levels

**A level is waves.** It ends — won — when its goal is met (`Game.levelWon()`),
and lost when the last flag falls after the last stand. Length 60–120 s, a boss
about 2 min.

**Stars, counted by the game** (`Game.levelTally()`):

- ★ — the goal;
- ★★ — and no flag lost;
- ★★★ — and the level's **bonus** (last column below).

**Every band is the same six beats:** 1 *discover* (the new thing alone, low
pressure), 2 *practice* (mixed with what is known), 3 *use* (the new kinds
earn their place), 4 *twist* (a modifier), 5 *exam* (everything of the band,
high pressure), 6 *boss*. Level 1 of a band is easier than level 5 of the band
before it.

**The modifiers** of the twist levels: *Moving hole* (it glides across the
field), *Wind* (bends the shots), *Night* (only the bottom half is lit; the
zombies come out of the dark), *Double hole* (two holes, each wave covering
60 %), *Horde* (twice the zombies, 1 HP each), *Scorched course* (level 5,
v0.4.0: every impact — crater, scorch, crack — stays on the grass for the
whole round instead of fading after four seconds).

**The pressure**, lerped over the climb by `web.levels.tune` (levels 1 → 30):

| knob                        | level 1 | level 15 | level 30 |
| --------------------------- | ------- | -------- | -------- |
| spawn every                 | 2.6 s   | 1.6 s    | 1.0 s    |
| walk speed                  | 22      | 35       | 50       |
| Walker HP                   | 2       | 3        | 4        |
| share of special zombies    | 0 %     | 30 %     | 50 %     |
| waves                       | 2       | 3        | 4 + boss |
| main hole distance from tee | short   | middle   | far      |

| lv  | band | beat     | goal (`levelGoal`)         | new             | modifier    | side holes        | supers (fixed / offered)      | bonus ★★★               |
| --- | ---- | -------- | -------------------------- | --------------- | ----------- | ----------------- | ----------------------------- | ----------------------- |
| 1   | 1    | discover | survive 2 waves            | Walker, the arc | —           | explosive         | Ball rain                     | sink the hole once      |
| 2   | 1    | practice | survive 2 waves            | Boomer          | —           | explosive, multi  | Ball rain, Fan volley         | a chain of 4            |
| 3   | 1    | use      | sink the hole 2 times      | Lob             | —           | explosive, multi  | Ball rain, Fan volley         | a lob into the hole     |
| 4   | 1    | twist    | survive 3 waves            | —               | Moving hole | multi, explosive  | Time freeze, Hole blast       | no last stand           |
| 5   | 1    | exam     | survive 3 waves            | —               | Scorched    | explosive, multi  | Fan volley, Time freeze       | a chain of 6            |
| 6   | 1    | boss     | defeat the Greenkeeper     | Greenkeeper     | —           | explosive, multi  | Hole blast, Ball rain         | in under 2 min          |
| 7   | 2    | discover | survive 2 waves            | Shield, bunkers | —           | pierce            | offered: band 1 + Seeker rain | 3 shields by lob        |
| 8   | 2    | practice | survive 3 waves            | —               | —           | pierce, heavy     | offered: + Sniper             | a chain of 5            |
| 9   | 2    | use      | knock out 6 shields        | —               | —           | heavy, pierce     | offered: + Sprinklers         | sink the hole twice     |
| 10  | 2    | twist    | survive 3 waves            | —               | Wind        | pierce, explosive | offered: + Golf cart          | no flag lost twice over |
| 11  | 2    | exam     | survive 3 waves            | —               | —           | heavy, multi      | offered                       | a chain of 7            |
| 12  | 2    | boss     | defeat the Caddie Colossus | Caddie Colossus | —           | pierce, heavy     | offered                       | 5 lobs on its head      |
| 13  | 3    | discover | drown 6 zombies            | water           | —           | heavy             | offered: + Boom volley        | 3 drowned in one shot   |
| 14  | 3    | practice | survive 3 waves            | Mudder          | —           | homing, heavy     | offered: + Split storm        | a chain of 6            |
| 15  | 3    | use      | survive 3 waves            | —               | —           | homing, split     | offered: + Magnet hole        | sink the hole 3 times   |
| 16  | 3    | twist    | survive 3 waves            | —               | Night       | split, pierce     | offered: + Hailstorm          | no last stand           |
| 17  | 3    | exam     | survive 4 waves            | —               | —           | homing, explosive | offered                       | a chain of 8            |
| 18  | 3    | boss     | defeat the Bog Giant       | Bog Giant       | —           | heavy, homing     | offered                       | in under 2 min          |
| 19  | 4    | discover | survive 3 waves            | ice             | —           | bouncy            | offered: + Firestorm          | a 5-zombie pile-up      |
| 20  | 4    | practice | survive 3 waves            | —               | —           | fire, bouncy      | offered: + Super bounce       | chain of 7              |
| 21  | 4    | use      | sink the hole 3 times      | —               | —           | fire, split       | offered: + Cluster bombs      | a chain of 8            |
| 22  | 4    | twist    | survive 4 waves            | —               | Double hole | bouncy, homing    | offered: + Rush               | both holes in one wave  |
| 23  | 4    | exam     | survive 4 waves            | —               | —           | fire, heavy       | offered                       | no flag lost            |
| 24  | 4    | boss     | defeat the Yeti            | Yeti            | —           | fire, bouncy      | offered                       | in under 2 min          |
| 25  | 5    | discover | survive 3 waves            | graves, Runner  | —           | ice               | offered: + Meteor             | no runner across        |
| 26  | 5    | practice | survive 4 waves            | Necromancer     | —           | ice, giant        | offered: + Carpet strike      | no zombie raised        |
| 27  | 5    | use      | knock out 3 necromancers   | —               | —           | giant, any        | offered: + Golden rain        | a chain of 10           |
| 28  | 5    | twist    | survive 4 waves            | —               | Horde       | any, any          | offered: + Mower              | no last stand           |
| 29  | 5    | exam     | survive 4 waves            | —               | —           | any, any          | offered                       | a chain of 12           |
| 30  | 5    | boss     | defeat the Zombie King     | Zombie King     | —           | any, any          | offered                       | in under 3 min          |

**After level 30**, the star above it starts the endless run in the
graveyard: waves forever, every zombie, every kind and super, a best score.

______________________________________________________________________

## 9. The meta layer, the village, the codex

### 9.1 The twenty stickers

Eleven common, five rare, two epic, two legendary, like the other games.
A sticker's name is a proper noun and is never translated. Twelve come off the
map (`awards`), in this order: band 1…5 passed, band 1…5 passed clean, all 30
cleared, ninety of ninety (the shiny one). One legendary (Zombie King) stays
out of `awards`, so the machine can roll one.

| #   | name          | rarity    | how it is earned      |
| --- | ------------- | --------- | --------------------- |
| 1   | Fore!         | common    | band 1 passed         |
| 2   | Tee Time      | common    | machine               |
| 3   | Bogey Man     | common    | band 5 passed         |
| 4   | Sand Trap     | common    | band 2 passed         |
| 5   | Caddie Bag    | common    | machine               |
| 6   | Lucky Ball    | common    | machine               |
| 7   | Broken Visor  | common    | band 5 passed clean   |
| 8   | Toxic Puddle  | common    | machine               |
| 9   | Golf Cart     | common    | machine               |
| 10  | Sprinkler     | common    | band 4 passed clean   |
| 11  | Slime Burp    | common    | machine               |
| 12  | Birdie        | rare      | band 3 passed clean   |
| 13  | Hole in One   | rare      | machine               |
| 14  | Greenkeeper   | rare      | band 1 passed clean   |
| 15  | Swamp Ball    | rare      | band 3 passed         |
| 16  | Frozen Flag   | rare      | band 4 passed         |
| 17  | Boomer Splat  | epic      | band 2 passed clean   |
| 18  | Shockwave     | epic      | all 30 levels cleared |
| 19  | Zombie King   | legendary | machine only          |
| 20  | Golden Putter | legendary | ninety of ninety      |

`"awards": [1, 4, 15, 16, 3, 14, 17, 12, 10, 7, 18, 20]`.

### 9.2 The village

`-background-home.png` is the clubhouse at dusk with six empty pads; the six
houses of `-object-home.png` (3x2) stand on them, composed in `make village`:

| house              | role         |
| ------------------ | ------------ |
| Pro Shop           | `shop`       |
| Trophy Podium      | `ranking`    |
| Course Map Board   | `map`        |
| Locker Room        | `collection` |
| Ball Dispenser     | `daily`      |
| Greenkeeper's Shed | `options`    |

### 9.3 The codex

A bestiary through `Game.codex` ([CLAUDE.md](../CLAUDE.md), *Game.codex*): three
books — *Zombies* (the seven), *Bosses* (the five), *Arsenal* (the ten kinds
and the twenty supers) — a card had once met or unlocked. Optional for 1.0;
its door would be the village role `cards`.

______________________________________________________________________

## 10. The assets — the list and a prompt for each

**Already done:** the app icon (on the user's machine), the biome 1 fairway,
the Walker and the Boomer sheets. **Everything else is below, one complete prompt each**, to
be pasted alone. The artwork is the user's to generate: never draw a
placeholder for any of it.

| asset                                                               | file (`assets/image/master/` unless said)         | prompt      |
| ------------------------------------------------------------------- | ------------------------------------------------- | ----------- |
| fairway, biome 2 to 5                                               | `holepocalypse-background-phone-<band>.png`       | 10.1–10.4   |
| intro and end screen backdrop                                       | `holepocalypse-background-phone.png`              | 10.5        |
| desktop bands                                                       | `holepocalypse-background-desk.png`               | 10.6        |
| village hub                                                         | `holepocalypse-background-home.png`               | 10.7        |
| logotype                                                            | `holepocalypse-title.png`                         | 10.8        |
| end screen character, three faces                                   | `holepocalypse-character-{sad,neutral,happy}.png` | 10.9–10.11  |
| village houses, 3x2                                                 | `holepocalypse-object-home.png`                   | 10.12       |
| stickers, 5x4                                                       | `holepocalypse-object-sticker.png`                | 10.13       |
| decor objects, 4x2                                                  | `holepocalypse-object-decor.png`                  | 10.14       |
| ball kind objects, 5x2                                              | `holepocalypse-object-kind.png`                   | 10.15       |
| super objects, 5x4                                                  | `holepocalypse-object-super.png`                  | 10.16       |
| balls in play, 6x2                                                  | `holepocalypse-object-ball.png`                   | 10.17       |
| course objects, 4x3                                                 | `holepocalypse-object-course.png`                 | 10.18       |
| zombie sheets (Boomer, Shield, Mudder, Digger, Runner, Necromancer) | `holepocalypse-object-<zombie>.png`               | 10.19–10.24 |
| boss sheets (five)                                                  | `holepocalypse-object-boss-<name>.png`            | 10.25–10.29 |
| music, one track in six sections                                    | `assets/audio/music/holepocalypse.mp3`            | 10.30       |
| power effects, ten 4x4 frame sheets                                 | `holepocalypse-object-fx-<name>.png`              | —           |
| time freeze, the shared ice frame                                   | `game-frame-ice.png` (shared, below)              | —           |

**The power effects** replace what the round drew with rings, particles and
the super's own icon. Each sheet is cut with `--grid 4x4` and each animation
adopted under a role of its own, `fx-<anim>-NN` (`CONFIG.art.fxBoom01`…),
encoded at one fixed scale (`GOLF_FX`) so a growing blast is not boxed; the
`FX` table of `game.js` says how each one is played and held, and with no art
on board every caller keeps its old drawing. The playable carries three of
them (`boom`, `dust`, `shock`), the rest is web-only (`WEB_ONLY_HOLE`).
Time freeze lays the shared ice frame over the field
(`"frame-ice": "game-frame-ice"` in `art.objects`, `CONFIG.art.frameIce`).

| sheet             | animations (frames)                                               | played by                                                                                           |
| ----------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `fx-blast`        | `boom` (8), `crater` (8)                                          | explosive ball, Boomer, Boom volley, cluster bombs; Meteor                                          |
| `fx-fire`         | `burn` (12), `meteor` (4)                                         | every fire patch (Fire ball, Firestorm); the falling Meteor                                         |
| `fx-ice`          | `freeze` (8), `hail` (4), `frost` (4)                             | an ice block on a frozen zombie; Hailstorm; Time freeze                                             |
| `fx-energy`       | `shock` (6), `vortex` (4), `target` (4)                           | the hole's shockwave, Hole blast; Magnet hole; Seeker rain                                          |
| `fx-water-wind`   | `jet` (4), `splash` (4), `wind` (7)                               | Sprinklers; the Wind modifier's gusts                                                               |
| `fx-impact`       | `dust` (3), `crack` (4), `coins` (4), `split` (4)                 | a ball landing (rain, seeker, carpet); Heavy; Golden; Split                                         |
| `fx-vehicle`      | `cart` (4), `clip` (3)                                            | Golf cart; the Mower's grass clippings                                                              |
| `fx-vehicle-side` | `mower` (4)                                                       | Mower (painted facing left, mirrored going right)                                                   |
| `fx-plane`        | `plane` (1)                                                       | Carpet strike: the blue plane flying the rows up the field                                          |
| `fx-shot`         | `pierce` (4), `rush` (4), `bounce` (4), `bomb` (2), `bomblet` (2) | Sniper and every piercing ball; Rush, Fan volley; Super bounce and every bouncy ball; Cluster bombs |

The red, green and propeller planes of `fx-plane`, `fx-vehicle` and
`fx-vehicle-side` are cut but not adopted, on purpose.

**The sounds are not generated**: they come from the house kit and the
library (`make events`, §3 step 5).

**The geometry every fairway must keep**, so the walls stay a short table
per biome (in shares of the 9:16 frame): **the play area is the picture** —
the fence lines start at about 9 % (left) and 91 % (right) of the width at
13 % of the height and run almost straight down to about 4 % and 96 % at the
white line, so the grass is never narrower than 80 % of the width; the gate
opening spans 28 %–72 % of the width at the top; a white line crosses at
86.5 % of the height; two tee markers stand at 30 % and 70 % of the width at
92.7 %. The scenery lives in the thin side strips and the band above the gate.
It replaced a road narrowing from 19 %–82 % at the top, which left the field a
third of the frame wide under the gate (the first desert render, and biome 1's
picture, are on that older layout). Each biome's walls are still re-measured
off its own picture.

______________________________________________________________________

## 11. Definition of done

[CLAUDE.md's list](../CLAUDE.md#definition-of-done-for-a-new-game) applies
whole. On top of it, for this game:

- [ ] A touch's first point decides Direct or Lob, and the preview, the tee
  ring and the label always agree with the shot that leaves.
- [ ] A rolling ball and a zombie meet at the zombie's feet; a ball behind a
  zombie is hidden by it.
- [ ] Every biome's walls are measured off its own fairway, and no ball leaves
  the fences.
- [ ] Every sprite sheet is encoded at one fixed scale and anchored on the
  feet; no zombie pulses in size and none carries a halo on the grass.
- [ ] The thirty levels are benched (12 seeds or more a level, a scripted
  pilot driving `frameUpdate`): every level winnable at one star by a plain pilot,
  three stars by a good one.

______________________________________________________________________

## 12. What the first build decided

- **The supers are fixed by the level table** on all thirty levels — the cheap
  alternative of §3 step 7, two per level, rotating the band's new ones in. A
  loadout card before the round is still open.
- **A level counts its own stars** (`levelTally`): the goal, then no flag
  lost, then the bonus — cumulative, so the third needs the second.
- **A boss gives ground**: a hit that does damage knocks it back a step
  (`BOSS_RECOIL 150` px/s, ×2.5 off the shockwave) and stuns it
  (`BOSS_STUN 0.45` s, the hit pose held), once per `BOSS_POISE 1.2` s — the
  hits inside that window still wear it down, and it is never pushed above
  the top of the field, where no rolling ball reaches. A fire's tick never
  knocks it back.
- **A boss is worn down**: a ball takes two HP off it at most (one off the
  Greenkeeper's mower from the front), the shockwave 15, a lob on the
  Colossus's head six, a dunk in a pond eighteen, a skull ball driven back
  into the King eight — so its HP is 100 / 110 / 160 / 260 / 240 rather than
  §5's, and the "in under" bonus 150 s (210 s for the King).
- **Level 13 asks four drowned zombies (bonus: two in one shot), level 27
  four necromancers** — the bench found six and three the wrong length; a
  zombie drowns when knocked into a pond faster than `DROWN_SPEED 40` px/s.
  Pushing one into a pond by hand was too hard on a phone, so **a pond is a
  whirlpool** (v0.2.0): a zombie hit within `POND_REACH 150` px of its bank is
  pulled in for as long as the hit's tag lasts (1.5 s, `POND_PULL 1500`
  px/s² easing out with distance); a walker and a boss it never touches. It
  pulled too well, so since v0.5.5 it takes **a direct ball hit of at least
  `POND_SHOT 700` px/s, the zombie within `POND_REACH 90` px of the bank and
  the pond BEHIND it** — the push no more than ~50° off the line to the water
  (`POND_AIM 0.64`); then that one pond pulls for `POND_TIME 1` s. A zombie
  knocked by another zombie, or with the pond in front of it, is not pulled. Two
  currents turn on the water to say so, and level 13 says it on a notice. The
  pilot's level 13 went from ~220 s to ~56 s.
- **The playable** (free round, `CONFIG.level` unset) is biome 1, three waves,
  one side hole (explosive) and one super (ball rain); everything a later
  band brings is web-only (`WEB_ONLY_HOLE` in `tools/build/build.mjs`).
- **The endless run** is the graveyard with every zombie, waves forever.
- **v0.4.0, the effects pass** (2026-10-18):
  - **Everything round that lies on the grass is an ellipse** of the cups'
    ratio (`GROUND_SQUASH` 0.42): the hole's blast, the seeker's mark, the
    magnet's vortex, the freeze's frost, a crack (`sq` in the `FX` table), the
    obstacles. The shockwave itself is an ellipse of `SHOCK_SQUASH` 0.62 —
    flatter than a circle, rounder than a cup, or a wave covering 80 % of the
    field would be a band — with a soft, wavering front and its hit test and
    `coverRadius` on the same ellipse.
  - **The impacts stay** (`marks`): the last frame of a boom, the meteor's
    crater, a hailstone's frost, a heavy ball's crack, a burnt-out fire
    patch, a broken obstacle's crack lie on the grass for `MARK_LIFE` 4 s,
    then fade over 1.2 s (40 at most). Level 5 carries the *Scorched course*
    twist, where nothing fades (150 at most).
  - **The obstacles** lie flat, without a shadow, raised by a band of their own silhouette darkened under the top face (`BUMPER_DEPTH` 0.5 radius, the height a cup has as depth), and break: `BUMPER_HP` 6
    (a grave 8, the Colossus's bag 4) taken by a ball as a zombie's are, by a
    blast, a drop or a vehicle — never by the shockwave — for
    `BUMPER_SCORE` 50.
  - **The Digger is gone** (its sheet is no longer embedded); level 20's
    bonus is a chain of 7. **A Mudder's halves do not walk**: they sit where
    the split threw them, and any ball touching one bursts it into a splat
    of mud that knocks its neighbours (one point each, so the halves chain).
  - **The Bog Giant's mud** is drawn rather than painted (no cut exists): a
    wobbling blob with a dark lip, splatter, moss, a wet shine and bubbles,
    an ellipse of `MUD_SQUASH` 0.55 that is also the area that slows a ball.
  - **The supers name themselves quietly**, a `score` callout at
    `hudUnder`. *Fan volley* is 22 balls at 2500 px/s gliding on the grass
    (×0.45 friction); *Sprinklers* spray from nozzles hidden past the
    screen's edges, over the fence and a quarter of the fairway in; the *Golf cart* stays inside the gate's width and
    drives up to the painted gate, where it vanishes into the gate's own
    toxic mist; the *Carpet strike* shows only
    the plane's shadow, the bombs raining a beat behind it; the *Mower* is 5
    to 10 mowers on random rows, each way, driving out of a blue portal and
    into an orange one in the fences.
  - **Rush and the last stand** draw no sprite: the bag row becomes a target
    and the time left, the tee a turning sight, the field a breathing glow
    of the phase's colour. The last stand says itself with a notice — an
    event the player did not make — named once with its guide page the first
    time (`Notify.learn("last")`). A **necromancer casting** wears a violet aura (the raised walkers
    too) instead of a callout.
  - **The moving hole runs on a rail** sunk in the grass, the length of its
    swing. **The life gauges** — a zombie's, an obstacle's, the boss's bar
    under its name between two skulls — are HOLOGRAMS like the flags': a
    faint glass ringed in light, one lit cell per point, scanlines and a
    flicker, and the chip of the last hit draining after it. A zombie's and
    an obstacle's show only on a hit, for `LIFE_SHOW` 2 s, fading out over
    the last `LIFE_FADE` 0.3 s, and the next hit brings them back; the
    boss's bar stays up.
  - **The wave is worth the shot** (`shotDifficulty`, 0..1): the hole's
    distance from the tee (`SHOCK_NEAR` 380 → `SHOCK_FAR` 930 px) plus 0.25
    for a lob, 0.1 for a banked shot, 0.1 for one threaded through the
    horde, 0.15 on the moving hole. The wave covers 30 % to 85 % of the
    field with it (×0.75 with two holes), knocks out what it reaches from
    0.5 up and deals 2 to 6 below; the shake, the flash, the sound and the
    score (`HOLE_SCORE` × 1..2, *Hole!* / *Great hole!* / *Mega hole!*) grow
    with it, and the hole's hologram carries one to three rings by its
    distance. The *Hole blast* super keeps the full wave.
  - **A shield blocks a Rush ball 30 % of the time** (`RUSH_BLOCK`), rolled
    once per ball and shield; a stream of free balls breaks a shield wall.
    Bag shots and the last stand's gun are blocked as before.
