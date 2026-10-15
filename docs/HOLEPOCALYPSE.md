# HOLEPOCALYPSE — from the prototype to the game

The plan of record for the fourteenth game: golf against a zombie horde. It is
**designed and prototyped, not built**. Build it once the thirteen are
validated and live on Google Play ([TODO.md](../TODO.md), *New games*).

Everything a session needs to build it is here: the rules the prototype
validated, the steps on the motor, the five biomes, the roster of zombies, the
ten ball kinds, the twenty supers, the thirty levels, the meta layer, and one
complete prompt for every asset still to make.

______________________________________________________________________

## 0. Where things are

| what                                        | where                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| the rules prototype (plain shapes)          | [`prototype/siege-golf.html`](../prototype/siege-golf.html)                              |
| the ten launcher controls tried             | [`prototype/siege-golf-controls.html`](../prototype/siege-golf-controls.html) — #8 won   |
| the art pass, the reference for every rule  | [`prototype/holepocalypse-art.html`](../prototype/holepocalypse-art.html)                |
| the biome 1 fairway (master, not yet filed) | repo root, `Holepocalypse Fairway toxique au crépuscule.png` (941×1672)                  |
| the walker sheet (master, not yet filed)    | repo root, `Holepocalypse Planche de sprites _ golfeur zombie en action.png` (1024×1536) |
| the app icon                                | on the user's machine; goes to `assets/image/icon/holepocalypse.png` (§3, step 9)        |

The two root files are untracked. On the day the game is built they move to
`assets/image/master/holepocalypse-background-phone-country.png` and
`assets/image/master/holepocalypse-object-walker.png`.

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

______________________________________________________________________

## 2. The rules the prototype validated

Every number below is the art prototype's, tuned by play. They are the
starting values of `CONFIG`, not final balance.

### 2.1 The field

- **Portrait, top-down, sloped toward the player.** The tee is at the bottom,
  the zombies come through a gate at the top, a defense line crosses the
  fairway just above the tee box.
- **The slope** pulls every ball toward the tee (`SLOPE 300` px/s², rolling
  friction `ROLL_DECEL 90`), so every ball rolls home into the bag on its own.
- **The fences are the painted ones.** The fairway narrows toward the gate; the
  physics walls are slanted lines measured off the picture (§10, *geometry*):
  biome 1 is `wallL(y) = max(60, 180 − 0.165·y)` and
  `wallR(y) = min(660, 539 + 0.189·y)`, gate `x 260…465`, top `y 140`, defense
  line `y 1107`, tee `(360, 1186)`. A ball hitting a fence reflects on its
  normal (`fenceBounce`), restitution `0.85`.
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
  where the ball tops out (its slowest point, the one to put on the hole); Lob
  is an orange arc lifted by its height, dots growing toward the top, its
  shadow dashed on the grass and an orange target where it lands. The tee ball
  wears the mode's colour ring, and `Direct` / `Lob` is written over the power
  bar.
- **A shot always leaves upward** (`MIN_UP 0.15`), and `FIRE_COOLDOWN 0.12`.

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

### 2.4 The bag

Five balls (`BAG_MAX`). A shot takes one; a ball rolling back past the line
returns it. A ball gone for good (exploded, timed out after `BALL_LIFE 12` s)
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

### 2.6 The side holes — left, ball kinds

- **Two side holes** at the foot of the fairway against the left fence
  (`y 905` and `1015`), a cup with a flag whose pennant shows its ball kind.
- **A player's ball rolled in slower than `SIDE_HOLE_MAX 900` drops in**
  (kinder than the main hole, pull `1800`): it loads **3 balls of that kind**
  on the tee (`LEFT_EXTRA`, queue capped at `SPECIAL_MAX 4`), the ball itself
  comes home, and the hole is capped for `TARGET_COOL 8` s — a capped hole is
  rolled over. A super's ball never drops in.
- The loaded balls show bottom right, next one first; the tee ball wears its
  colour.

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
putt that tops out right where you tapped). Survive it and one flag comes
back. The gun is also what the **Rush** super runs for 6 s.

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
   billiards), drops, zones, sweeps, the gun (`climbTo`, `apexOf`).
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
| 4    | **Frozen Links**     | ice: balls and zombies slide (friction ×0.3, knockback lasts ×2) — pile-ups | Digger                | fire, bouncy     | Firestorm, Super bounce, Cluster bombs, Rush     | Yeti            | icy chiptune, sleigh   |
| 5    | **Graveyard Greens** | graves: zombies also rise mid-field from them                               | Runner, Necromancer   | ice, giant       | Meteor, Carpet strike, Golden rain, Mower        | Zombie King     | organ rock, the climax |

The unlocks are cumulative: in band 5 the side holes may hand any of the ten
kinds and the loadout offers any of the twenty supers.

______________________________________________________________________

## 5. The zombies

Numbers at level 1 of their band; `web.levels.tune` raises HP and speed with
the climb. Radius is the footprint (§2.10).

| zombie          | band | HP  | speed | radius | behaviour                                                                                                        | the answer                            | sheet                                        |
| --------------- | ---- | --- | ----- | ------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------- |
| **Walker**      | 1    | 3   | 1.0   | 30     | shambles down its lane                                                                                           | anything                              | done — walk 8, hit 4, knockout 4             |
| **Boomer**      | 1    | 2   | 0.8   | 28     | bloated; bursts on death: 120 px, 3 damage, 520 knockback to its neighbours                                      | burst it inside the pack              | walk 8, hit 4, burst 4                       |
| **Shield**      | 2    | 4   | 0.8   | 32     | holds a golf bag in front: a Direct hit from below does 0 damage and bounces off                                 | Lob over it, bank off a fence, pierce | walk 8, block 4, knockout 4                  |
| **Mudder**      | 3    | 4   | 0.9   | 32     | made of swamp mud; its knockout splits it into two **Mudlings** (HP 1, radius 18, speed 1.4)                     | homing, split, or a pond behind it    | walk 8, hit 4, split 4 (Mudling = scaled)    |
| **Digger**      | 4    | 3   | 1.1   | 28     | burrows (invulnerable, a moving dirt mound), surfaces near the main hole and **drags it** 200 px toward the line | hit it before it digs; Time freeze    | walk 4, dig 4, surface 4, hit 2 + knockout 2 |
| **Runner**      | 5    | 1   | 2.2   | 26     | sprints straight down                                                                                            | a fast Direct shot, Seeker rain       | sprint 8, hit 4, knockout 4                  |
| **Necromancer** | 5    | 5   | 0.6   | 30     | stops every 6 s and raises the last two knocked-out zombies as Walkers                                           | top priority: Sniper, Meteor          | walk 4, cast 4, hit 4, knockout 4            |

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
60 %), *Horde* (twice the zombies, 1 HP each).

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
| 5   | 1    | exam     | survive 3 waves            | —               | —           | explosive, multi  | Fan volley, Time freeze       | a chain of 6            |
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
| 20  | 4    | practice | survive 3 waves            | Digger          | —           | fire, bouncy      | offered: + Super bounce       | no hole dragged         |
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
| 11  | Pro Shop      | common    | machine               |
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
the Walker sheet. **Everything else is below, one complete prompt each**, to
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
| ball kind badges, 5x2                                               | `holepocalypse-object-kind.png`                   | 10.15       |
| super badges, 5x4                                                   | `holepocalypse-object-super.png`                  | 10.16       |
| balls in play, 6x2                                                  | `holepocalypse-object-ball.png`                   | 10.17       |
| course objects, 4x3                                                 | `holepocalypse-object-course.png`                 | 10.18       |
| zombie sheets (Boomer, Shield, Mudder, Digger, Runner, Necromancer) | `holepocalypse-object-<zombie>.png`               | 10.19–10.24 |
| boss sheets (five)                                                  | `holepocalypse-object-boss-<name>.png`            | 10.25–10.29 |
| music, one track in six sections                                    | `assets/audio/music/holepocalypse.mp3`            | 10.30       |

**The sounds are not generated**: they come from the house kit and the
library (`make events`, §3 step 5).

**The geometry every fairway must keep**, so the walls stay a short table
per biome (measured off biome 1, in shares of the 9:16 frame): the fence
lines run from about 19 % (left) and 82 % (right) of the width at 14 % of the
height out to the frame's edges around 70–76 % of the height; the gate opening
spans 34 %–68 % of the width at the top; a white line crosses at 86.5 % of the
height; two tee markers stand at 30 % and 70 % of the width at 92.7 %. Each
biome's walls are still re-measured off its own picture.

### 10.1 Fairway — Desert Links

```
Top-down view, vertical mobile game background, 9:16 portrait, 1080x1920, polished casual mobile-game art style, cartoon 3D render, warm late-afternoon light.
A long desert golf fairway running from the top to the bottom of the image, seen from above, slightly sloping down toward the viewer, narrowing toward the top like a road in perspective. Bright green grass with wide horizontal mowing stripes in two alternating shades of green, surrounded by golden sand dunes. The fairway itself is kept clean and empty: no hole, no flag, no ball, no characters, no bunker inside the fairway, so gameplay elements stay readable on top of it.
Layout, to be followed exactly: white wooden rail fences run along both sides of the fairway, starting at about 19% (left) and 82% (right) of the image width at 14% of the height, and widening out to the left and right edges of the image around 72% of the height. At the very top, centered between 34% and 68% of the width, the broken adobe gate of a desert golf resort, torn open, with a sickly toxic-green glow and mist pouring out. At 86.5% of the height a thin white line crosses the fairway from fence to fence. Below it, a tee box of shorter darker grass with two white tee markers at 30% and 70% of the width, at 92.7% of the height.
Outside the fences only: dunes, tall cacti, sun-bleached cattle skulls, a half-buried golf cart, scattered golf balls, a torn parasol, small toxic-green puddles in the sand. Orange and pink sky at the top edge behind the gate.
Clean, readable, low detail in the play area, high contrast between the grass and the borders, no text, no letters, no logo, no UI.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.2 Fairway — Bayou Course

```
Top-down view, vertical mobile game background, 9:16 portrait, 1080x1920, polished casual mobile-game art style, cartoon 3D render, misty green-gold evening light.
A long swamp golf fairway running from the top to the bottom of the image, seen from above, slightly sloping down toward the viewer, narrowing toward the top like a road in perspective. Lush green grass with wide horizontal mowing stripes in two alternating shades of green, damp and slightly darker at the edges. The fairway itself is kept clean and empty: no hole, no flag, no ball, no characters, no pond inside the fairway, so gameplay elements stay readable on top of it.
Layout, to be followed exactly: old white wooden rail fences, a bit mossy, run along both sides of the fairway, starting at about 19% (left) and 82% (right) of the image width at 14% of the height, and widening out to the left and right edges of the image around 72% of the height. At the very top, centered between 34% and 68% of the width, a broken wooden bayou gate hung with spanish moss, torn open, a sickly toxic-green glow and mist pouring out. At 86.5% of the height a thin white line crosses the fairway from fence to fence. Below it, a tee box of shorter darker grass with two white tee markers at 30% and 70% of the width, at 92.7% of the height.
Outside the fences only: dark swamp water with lily pads, cypress trees with hanging moss, a sunken rowboat, fireflies, a rusty golf cart half in the water, scattered golf balls, small toxic-green bubbles in the water.
Clean, readable, low detail in the play area, high contrast between the grass and the borders, no text, no letters, no logo, no UI.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.3 Fairway — Frozen Links

```
Top-down view, vertical mobile game background, 9:16 portrait, 1080x1920, polished casual mobile-game art style, cartoon 3D render, cold blue winter twilight.
A long snowy golf fairway running from the top to the bottom of the image, seen from above, slightly sloping down toward the viewer, narrowing toward the top like a road in perspective. Pale frosted green grass with wide horizontal mowing stripes in two alternating shades, a light dusting of snow, so it still reads as a golf fairway. The fairway itself is kept clean and empty: no hole, no flag, no ball, no characters, no ice patch inside the fairway, so gameplay elements stay readable on top of it.
Layout, to be followed exactly: white wooden rail fences capped with snow run along both sides of the fairway, starting at about 19% (left) and 82% (right) of the image width at 14% of the height, and widening out to the left and right edges of the image around 72% of the height. At the very top, centered between 34% and 68% of the width, the broken iron gate of a mountain golf lodge, torn open and covered in icicles, a sickly toxic-green glow and mist pouring out. At 86.5% of the height a thin white line crosses the fairway from fence to fence. Below it, a tee box of shorter darker grass with two white tee markers at 30% and 70% of the width, at 92.7% of the height.
Outside the fences only: snowy pine trees, snowdrifts, a frozen pond, a golf cart stuck in snow, a snowman wearing a golf visor, scattered golf balls, small toxic-green cracks glowing in the ice.
Clean, readable, low detail in the play area, high contrast between the grass and the borders, no text, no letters, no logo, no UI.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.4 Fairway — Graveyard Greens

```
Top-down view, vertical mobile game background, 9:16 portrait, 1080x1920, polished casual mobile-game art style, cartoon 3D render, purple moonlit night with soft green glows.
A long haunted golf fairway running from the top to the bottom of the image, seen from above, slightly sloping down toward the viewer, narrowing toward the top like a road in perspective. Deep green grass with wide horizontal mowing stripes in two alternating shades of green, lit by moonlight. The fairway itself is kept clean and empty: no hole, no flag, no ball, no characters, no grave inside the fairway, so gameplay elements stay readable on top of it.
Layout, to be followed exactly: crooked white wooden rail fences run along both sides of the fairway, starting at about 19% (left) and 82% (right) of the image width at 14% of the height, and widening out to the left and right edges of the image around 72% of the height. At the very top, centered between 34% and 68% of the width, the broken wrought-iron gate of an old cemetery golf course, torn open, a bright toxic-green glow and mist pouring out, a full moon behind it. At 86.5% of the height a thin white line crosses the fairway from fence to fence. Below it, a tee box of shorter darker grass with two white tee markers at 30% and 70% of the width, at 92.7% of the height.
Outside the fences only: cartoon tombstones shaped like golf balls and golf bags, dead twisted trees, jack-o'-lantern style lanterns, a toppled golf cart, scattered golf balls, small toxic-green wisps.
Clean, readable, low detail in the play area, high contrast between the grass and the borders, no text, no letters, no logo, no UI.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.5 Intro and end screen backdrop

```
Vertical mobile game title screen background, 9:16 portrait, 1080x1920, polished casual mobile-game art style, cartoon 3D render, dramatic dusk lighting with purple and orange sky.
A fancy country club golf course at dusk seen from a low three-quarter angle: a perfect green with a red flag in the foreground lower third, the elegant clubhouse on a hill in the background, and a sickly toxic-green glow rising from behind the clubhouse. Far in the distance, small cartoon zombie silhouettes in golf clothes shamble over the hill. Golf balls scattered on the grass, an overturned golf cart at one side.
Keep the upper third calm and fairly empty (sky and soft glow) because a logo will be placed there, and keep the right edge simple because menu buttons will be placed there.
Rich, saturated, inviting, playful-spooky mood, no text, no letters, no logo, no UI.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.6 Desktop bands

```
Wide landscape illustration, 16:9, 1920x1080, polished casual mobile-game art style, cartoon 3D render, dusk lighting with a purple and orange sky.
A panoramic view of a fancy country club golf course at dusk: rolling fairways, sand bunkers, a lake, the elegant clubhouse in the middle distance, and a sickly toxic-green glow and mist rising from the course. Small cartoon zombie silhouettes in golf clothes shamble across the far fairways. Golf flags, an overturned golf cart, scattered golf balls.
The center third of the image must stay calm and fairly dark and simple, because a phone-sized game frame will stand on top of it; put the interesting details on the left and right thirds.
Rich, saturated, playful-spooky mood, no text, no letters, no logo, no UI.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.7 Village hub

```
Vertical mobile game hub screen, 9:16 portrait, 1080x1920, polished casual mobile-game art style, cartoon 3D render, cozy dusk lighting with warm lamps and a purple sky.
A top-down three-quarter view of a golf club's grounds at dusk turned into a survivors' camp: winding cart paths, neat lawns, hedges, lanterns on posts, a small pond, a putting green with a flag in the middle. On the grounds, six EMPTY round flat pads of pale paving stone, clearly visible and spread out with space around each one, where buildings will be placed later: two in the upper part, two in the middle, two in the lower part. The pads are empty: no building on them.
At the edges: hedges, trees, a broken gate at the top with a faint toxic-green glow far behind it, sandbags and a barricade of golf carts showing the camp is defended.
Warm, safe, inviting, no characters, no text, no letters, no logo, no UI.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 10.8 Logotype

```
Game logo for a mobile game, the single word "HOLEPOCALYPSE" spelled exactly H-O-L-E-P-O-C-A-L-Y-P-S-E, wide horizontal layout, polished casual mobile-game style, chunky 3D cartoon letters with a thick dark outline.
The letters are fresh golf-green with a lighter top face and a toxic lime-green glow dripping slightly from the bottom edges like slime. The letter O of "HOLE" is a golf ball with dimples sitting in a golf hole, a small red golf flag planted behind it; a cartoon zombie hand pokes out of the letter O of "POCALYPSE" holding a golf ball.
Bold, readable at small size, playful-spooky, centered, nothing else around it.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.9 Character — sad

```
Single character portrait for a mobile game end screen, upper body, polished casual mobile-game style, cartoon 3D render, thick clean outlines, vibrant colors.
The hero: Ace, a tough retired golf pro in her sixties, short silver hair under a white visor, a red and green plaid golf vest over a white polo, a striped golf glove, a small bandage on her cheek, holding a driver over her shoulder like a baseball bat.
Expression: SAD and defeated, shoulders slumped, the driver drooping, a small tear, a few cartoon zombie-green slime splashes on her vest, a broken golf tee in her other hand.
Facing the viewer, centered, no background scene, no text.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.10 Character — neutral

```
Single character portrait for a mobile game end screen, upper body, polished casual mobile-game style, cartoon 3D render, thick clean outlines, vibrant colors.
The hero: Ace, a tough retired golf pro in her sixties, short silver hair under a white visor, a red and green plaid golf vest over a white polo, a striped golf glove, a small bandage on her cheek, holding a driver over her shoulder like a baseball bat.
Expression: NEUTRAL and determined, a confident half smile, one eyebrow raised, the driver resting on her shoulder, tossing a golf ball up with her other hand.
Facing the viewer, centered, no background scene, no text.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.11 Character — happy

```
Single character portrait for a mobile game end screen, upper body, polished casual mobile-game style, cartoon 3D render, thick clean outlines, vibrant colors.
The hero: Ace, a tough retired golf pro in her sixties, short silver hair under a white visor, a red and green plaid golf vest over a white polo, a striped golf glove, a small bandage on her cheek, holding a driver over her shoulder like a baseball bat.
Expression: HAPPY and triumphant, a big laugh, the driver raised high in victory, a golden trophy shaped like a golf ball in her other hand, small sparkles around her.
Facing the viewer, centered, no background scene, no text.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.12 Village houses (3x2)

```
Sprite sheet for a mobile game, 3 columns by 2 rows grid, 6 separate buildings, each centered in its own equal cell with generous empty space around it, nothing touching or overlapping another cell, no grid lines.
Polished casual mobile-game style, cartoon 3D render, thick clean outlines, vibrant colors, warm dusk lighting, all buildings at the same scale and the same top-down three-quarter camera angle, each standing on its own small round base of grass.
Row 1: a PRO SHOP, a small wooden golf store with a striped awning, golf clubs and balls in the window and a golf-ball sign; a TROPHY PODIUM, a three-step winners' podium with a big golden golf-ball trophy on top; a COURSE MAP BOARD, a large wooden signboard on posts showing a winding course map with little flags.
Row 2: a LOCKER ROOM, a small stone building with a green door and lockers visible through the open door, a sticker-covered locker in front; a BALL DISPENSER, a big red vintage golf ball vending machine with a crank and a glass dome full of balls; a GREENKEEPER'S SHED, a wooden tool shed with a lawn mower, rakes and a watering can.
No characters, no text, no letters, no numbers, no logo.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.13 Stickers (5x4)

```
Sticker sheet for a mobile game collection album, 5 columns by 4 rows grid, 20 separate die-cut stickers, each centered in its own equal cell with generous empty space around it, each with a thick white sticker border, nothing touching or overlapping another cell, no grid lines.
Polished casual mobile-game style, cartoon 3D render, thick clean outlines, vibrant colors, funny-spooky golf-and-zombies theme, every sticker the same size.
Row 1: (1) a golf ball flying with a big "swoosh" trail and a shouting cartoon mouth; (2) a golf tee with a tiny clock on it; (3) a goofy cartoon zombie golfer peeking from behind a flag; (4) a sand bunker with a zombie hand holding a rake out of the sand; (5) a golf bag with clubs and googly eyes.
Row 2: (6) a golf ball with a four-leaf clover; (7) a cracked red sun visor; (8) a bubbling toxic-green puddle with a golf ball floating in it; (9) a golf cart with tiny wheels doing a wheelie; (10) a lawn sprinkler spraying water in a rainbow.
Row 3: (11) a tiny pro shop building with a striped awning; (12) a cute bird wearing a golf cap; (13) a golf ball dropping into a glowing hole with stars; (14) a grumpy zombie greenkeeper on a lawn mower; (15) a muddy swamp golf ball with a lily pad on top.
Row 4: (16) a frozen golf flag covered in icicles; (17) a cartoon green goo splash shaped like a star; (18) a ring-shaped green shockwave bursting out of a golf hole; (19) a zombie king wearing a golden crown and holding a golden golf club, special shiny foil look; (20) a golden putter with sparkles, special shiny foil look.
No text, no letters, no numbers, no logo.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.14 Decor objects (4x2)

```
Sprite sheet for a mobile game, 4 columns by 2 rows grid, 8 separate objects, each centered in its own equal cell with generous empty space around it, nothing touching or overlapping another cell, no grid lines.
Polished casual mobile-game style, cartoon 3D render, thick clean outlines, vibrant colors, all objects at a similar size, seen from a slight three-quarter angle.
Row 1: a bent golf club; a golf ball with a crack and a tiny toxic-green glow inside; a red golf flag on its pole, slightly torn; a golf bag knocked over with a cartoon zombie hand waving out of it.
Row 2: a small toxic-green barrel with a golf-ball symbol; a cracked red sun visor; a golf tee with a bandage wrapped around it; a little pile of golf balls with one of them wearing googly eyes.
No characters, no text, no letters, no numbers, no logo.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.15 Ball kind badges (5x2)

```
Icon sheet for a mobile game, 5 columns by 2 rows grid, 10 separate round badge icons, each centered in its own equal cell with generous empty space around it, nothing touching or overlapping another cell, no grid lines.
Polished casual mobile-game style, cartoon 3D render, every badge the same size: a glossy round golf-ball-white disc with dimples, a thick dark outline and a colored rim, with one bold symbol in the middle, readable at very small size.
Row 1: EXPLOSIVE, red-orange rim, a cartoon blast burst; MULTI, cyan rim, three small golf balls fanning out; PIERCE, magenta rim, a sharp arrow piercing through; HEAVY, dark grey rim, a heavy round boulder; HOMING, violet rim, a horseshoe magnet.
Row 2: SPLIT, light green rim, a ball splitting into two halves with motion lines; FIRE, orange rim, a flame; BOUNCY, pink rim, a ball with springy bounce lines; ICE, pale blue rim, a snowflake; GIANT, white rim with a gold edge, a very big ball next to a tiny one.
No text, no letters, no numbers, no logo.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.16 Super badges (5x4)

```
Icon sheet for a mobile game, 5 columns by 4 rows grid, 20 separate power-up badge icons, each centered in its own equal cell with generous empty space around it, nothing touching or overlapping another cell, no grid lines.
Polished casual mobile-game style, cartoon 3D render, every badge the same size: a glossy rounded-square button with a thick dark outline, a deep purple face and a golden rim, with one bold colorful symbol in the middle, readable at very small size.
Row 1: BALL RAIN, a cloud raining golf balls; FAN VOLLEY, golf balls fanning out from one point; TIME FREEZE, an hourglass with frost; HOLE BLAST, a golf hole with a green shockwave ring; SEEKER RAIN, a golf ball with a target reticle.
Row 2: SNIPER, a golf ball shaped like a bullet with a crosshair; SPRINKLERS, a lawn sprinkler spraying water; GOLF CART, a small golf cart charging forward with speed lines; BOOM VOLLEY, three golf balls with fuses; SPLIT STORM, golf balls splitting into many.
Row 3: MAGNET HOLE, a golf hole with a horseshoe magnet above it; HAILSTORM, a cloud dropping ice-cube golf balls; FIRESTORM, flaming golf balls falling; SUPER BOUNCE, a golf ball with springs; CLUSTER BOMBS, a bomb splitting into small bombs.
Row 4: RUSH, a golden star with motion lines; METEOR, a giant flaming golf ball falling; CARPET STRIKE, a small cartoon plane dropping golf balls in rows; GOLDEN RAIN, gold coins and golden golf balls raining; MOWER, a ride-on lawn mower.
No text, no letters, no numbers, no logo.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.17 Balls in play (6x2)

```
Sprite sheet for a mobile game, 6 columns by 2 rows grid, 12 separate golf balls seen from straight above, each centered in its own equal cell with generous empty space around it, nothing touching or overlapping another cell, no grid lines, no shadows.
Polished casual mobile-game style, cartoon 3D render, every ball exactly the same size and perfectly round, with visible dimples, a thick dark outline and a small white highlight at the top left, readable at very small size.
Row 1: a plain white golf ball; a red-orange explosive ball with a short lit fuse; a cyan ball with a faint triple ghost; a magenta ball with a sharp arrow stripe; a dark grey heavy stone ball; a violet ball with a magnet stripe.
Row 2: a light green ball with a seam down the middle; an orange ball wrapped in small flames; a pink rubbery bouncy ball; a pale blue ice ball with frost; a white ball with a golden ring (the giant ball); a golden ball with sparkles.
No text, no letters, no numbers, no logo.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.18 Course objects (4x3)

```
Sprite sheet for a mobile game, 4 columns by 3 rows grid, 12 separate golf course objects seen from a top-down view, each centered in its own equal cell with generous empty space around it, nothing touching or overlapping another cell, no grid lines.
Polished casual mobile-game style, cartoon 3D render, thick clean outlines, vibrant colors, all objects lit from the top left, same top-down camera for all.
Row 1: a golf cup seen from above, a dark round hole with a white rim in a small disc of short grass; a red golf flag on a white pole seen from a slight angle; a golf cup covered by a round grey metal lid; a round stone planter full of flowers (a bumper).
Row 2: a round brass lawn sprinkler head (a bumper); a small kidney-shaped sand bunker; a large irregular sand bunker; a small round pond with lily pads.
Row 3: a large irregular pond with reeds; an irregular patch of slippery blue ice; a cartoon tombstone shaped like a golf ball; a cracked grave mound with a toxic-green glow.
No characters, no text, no letters, no numbers, no logo.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.19 Zombie — Boomer

```
Sprite sheet for a mobile game: ONE single character drawn 16 times, a 4 columns by 4 rows grid of 16 equal square cells, read left to right then top to bottom. It is an animation sheet, so the character must be IDENTICAL in every frame: same design, same colors, same proportions, same size, same camera, same lighting. Only the pose changes. Every figure sits fully inside its own cell with clear empty space on all four sides; nothing touches the cell edges; no glow, haze or soft halo around the figure.

THE CHARACTER, a bloated zombie golfer, cartoon 3D render in a polished casual mobile-game style, thick clean dark outlines, funny rather than scary:
- Body: short legs, a huge round swollen belly about 1.3 times wider than a normal man, short stubby arms.
- Skin: grey-green (#8FA38A) with darker green shading.
- Eyes: round, glowing red pupils (#FF3B3B), always visible.
- Head: a flat checkered golf cap.
- Top: a purple polo shirt (#7A3E8C) stretched tight and torn at the seams.
- Bottom: loud yellow and blue checkered golf trousers.
- Belly and shoulders: four glowing lime-green pustules (#C6FF3A).

CAMERA AND FRAMING, the same in all 16 cells:
- Top-down three-quarter view from above, about 45 degrees, the character facing the viewer and walking toward the bottom of the image.
- The character fills about 65% of the cell height, centered horizontally.
- The soles of the feet always sit on the same baseline, at 85% of the cell height from the top.
- Light from the top left, soft shadow on the character itself only.

ROWS 1 AND 2, WALK CYCLE, 8 frames, a heavy waddle; the short arms reach forward and sway; the belly bounces up and down one beat after the feet.
- Frame 1, left foot forward touching the ground, belly level.
- Frame 2, weight on the left foot, knees bent, body lowest, belly squashed wide.
- Frame 3, left leg straight under the body, right foot lifted beside it, belly stretched tall.
- Frame 4, body highest, right leg swinging forward, belly lifted.
- Frame 5, mirror of frame 1 with the right foot forward.
- Frame 6, mirror of frame 2, weight on the right foot, belly squashed wide.
- Frame 7, mirror of frame 3, left foot lifted.
- Frame 8, mirror of frame 4, left leg swinging forward.

ROW 3, HIT REACTION, 4 frames, bonked in the belly by a golf ball:
- Frame 9, the belly squashes inward like jelly, eyes squeezed shut.
- Frame 10, the belly bounces back outward wider than before, arms flung up.
- Frame 11, wobbling, pustules glowing brighter.
- Frame 12, settled back to the walking pose of frame 3.

ROW 4, BURST, 4 frames, a cartoon pop:
- Frame 13, swelling up like a balloon, eyes bulging, lines of lime-green light cracking across the shirt.
- Frame 14, almost spherical, glowing intensely, feet lifting off the ground.
- Frame 15, bursting into a cartoon splash of bright lime-green goo shaped like a star, the cap flying up.
- Frame 16, a flat lime-green goo stain on the ground with the cap lying in it.

No text, no letters, no numbers, no logo, no motion blur, no speed lines.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.20 Zombie — Shield

```
Sprite sheet for a mobile game: ONE single character drawn 16 times, a 4 columns by 4 rows grid of 16 equal square cells, read left to right then top to bottom. It is an animation sheet, so the character must be IDENTICAL in every frame: same design, same colors, same proportions, same size, same camera, same lighting. Only the pose changes. Every figure sits fully inside its own cell with clear empty space on all four sides; nothing touches the cell edges; no glow, haze or soft halo around the figure.

THE CHARACTER, a zombie caddie with a shield, cartoon 3D render in a polished casual mobile-game style, thick clean dark outlines, funny rather than scary:
- Body: a stocky adult, slightly hunched.
- Skin: grey-green (#8FA38A) with darker green shading.
- Eyes: round, glowing red pupils (#FF3B3B), always visible.
- Head: a white caddie cap worn backwards.
- Clothes: a white caddie overall (#EDEDED) with a green bib number patch without any number, torn at the knees.
- Shield: a big tan leather golf bag (#B07A3C) full of clubs held flat in front of the body with both arms like a riot shield, covering the chest and belly.

CAMERA AND FRAMING, the same in all 16 cells:
- Top-down three-quarter view from above, about 45 degrees, the character facing the viewer and walking toward the bottom of the image.
- The character fills about 70% of the cell height, centered horizontally.
- The soles of the feet always sit on the same baseline, at 85% of the cell height from the top.
- Light from the top left, soft shadow on the character itself only.

ROWS 1 AND 2, WALK CYCLE, 8 frames, a steady march behind the bag; the bag stays in front of the body and bobs with each step.
- Frame 1, left foot forward touching the ground. Frame 2, weight on the left foot, body lowest. Frame 3, left leg straight, right foot passing. Frame 4, body highest, right leg swinging forward.
- Frames 5 to 8, the same four poses mirrored with the other leg.

ROW 3, BLOCK, 4 frames, a golf ball bounces off the bag:
- Frame 9, the bag takes the impact, a small cartoon spark on the leather, the caddie leans back.
- Frame 10, sliding back a little, heels digging in, gritting teeth.
- Frame 11, peeking over the bag, annoyed.
- Frame 12, back to the walking pose of frame 3.

ROW 4, KNOCKOUT, 4 frames, cartoon slapstick:
- Frame 13, the bag knocked aside, the caddie tipping backward, arms up.
- Frame 14, falling backward, clubs flying out of the bag.
- Frame 15, lying flat on the ground, eyes turned into cartoon spirals, the bag beside him.
- Frame 16, a poof of grey dust with the cap and the bag lying in it.

No text, no letters, no numbers, no logo, no motion blur, no speed lines.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.21 Zombie — Mudder

```
Sprite sheet for a mobile game: ONE single character drawn 16 times, a 4 columns by 4 rows grid of 16 equal square cells, read left to right then top to bottom. It is an animation sheet, so the character must be IDENTICAL in every frame: same design, same colors, same proportions, same size, same camera, same lighting. Only the pose changes. Every figure sits fully inside its own cell with clear empty space on all four sides; nothing touches the cell edges; no glow, haze or soft halo around the figure.

THE CHARACTER, a swamp mud zombie, cartoon 3D render in a polished casual mobile-game style, thick clean dark outlines, funny rather than scary:
- Body: a lumpy man-shaped figure made of glossy brown swamp mud (#6B4A2B) with green algae patches, a bit wider than a man.
- Eyes: round, glowing red pupils (#FF3B3B), always visible.
- Head: a lily pad stuck on the head like a hat, a golf ball half sunk in the mud of the chest.
- Arms: long and drippy, reaching forward, small mud drips falling.

CAMERA AND FRAMING, the same in all 16 cells:
- Top-down three-quarter view from above, about 45 degrees, the character facing the viewer and walking toward the bottom of the image.
- The character fills about 70% of the cell height, centered horizontally.
- The base of the body always sits on the same baseline, at 85% of the cell height from the top.
- Light from the top left, soft shadow on the character itself only.

ROWS 1 AND 2, WALK CYCLE, 8 frames, a sloshing, wobbling shamble; the mud body squashes and stretches with each step, arms swaying forward.
- Frame 1, left foot forward. Frame 2, weight on the left, body squashed lowest. Frame 3, passing, body stretched tall. Frame 4, body highest, right leg swinging forward.
- Frames 5 to 8, the same four poses mirrored with the other leg.

ROW 3, HIT REACTION, 4 frames:
- Frame 9, a splat dent in the mud chest where the ball hit, eyes squeezed.
- Frame 10, leaning back, mud splashing out in cartoon drops.
- Frame 11, wobbling like jelly.
- Frame 12, reformed, back to the walking pose of frame 3.

ROW 4, SPLIT, 4 frames, the mud body splits into two small mud creatures:
- Frame 13, a crack of light running down the middle of the body.
- Frame 14, the body pulling apart into two halves.
- Frame 15, two small round mud blobs with red eyes and tiny arms, side by side, each about half the size.
- Frame 16, one single small mud blob alone, standing, ready to waddle (this is the small creature, drawn alone in the cell).

No text, no letters, no numbers, no logo, no motion blur, no speed lines.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.22 Zombie — Digger

```
Sprite sheet for a mobile game: ONE single character drawn 16 times, a 4 columns by 4 rows grid of 16 equal square cells, read left to right then top to bottom. It is an animation sheet, so the character must be IDENTICAL in every frame: same design, same colors, same proportions, same size, same camera, same lighting. Only the pose changes. Every figure sits fully inside its own cell with clear empty space on all four sides; nothing touches the cell edges; no glow, haze or soft halo around the figure.

THE CHARACTER, a zombie groundskeeper who digs, cartoon 3D render in a polished casual mobile-game style, thick clean dark outlines, funny rather than scary:
- Body: a wiry adult, hunched forward.
- Skin: grey-green (#8FA38A) with darker green shading.
- Eyes: round, glowing red pupils (#FF3B3B), always visible.
- Head: a knitted green beanie and a miner's headlamp.
- Clothes: green dungarees (#3E6B3A) over a brown shirt, muddy boots.
- Tool: a small garden shovel in both hands.

CAMERA AND FRAMING, the same in all 16 cells:
- Top-down three-quarter view from above, about 45 degrees, the character facing the viewer and moving toward the bottom of the image.
- The character fills about 65% of the cell height when standing, centered horizontally.
- The ground line always sits on the same baseline, at 85% of the cell height from the top.
- Light from the top left, soft shadow on the character itself only.

ROW 1, WALK, 4 frames: left foot forward; passing with the body lowest; right foot forward; passing with the body highest. The shovel held ready.
ROW 2, DIG IN, 4 frames: stabbing the shovel into the grass with dirt flying; half sunk into a hole, only the upper body visible; only the head and the beanie above a mound of dirt; just a mound of fresh dirt with the headlamp glowing out of it.
ROW 3, SURFACE, 4 frames: a mound of dirt bulging; the head and shovel popping out with dirt flying; climbing out waist-deep; standing again shaking off the dirt.
ROW 4, HIT AND KNOCKOUT, 4 frames: bonked by a golf ball, headlamp flickering, leaning back; staggering with stars around the head; falling flat with eyes turned into cartoon spirals, the shovel beside him; a poof of grey dust with the beanie and the shovel lying in it.

No text, no letters, no numbers, no logo, no motion blur, no speed lines.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.23 Zombie — Runner

```
Sprite sheet for a mobile game: ONE single character drawn 16 times, a 4 columns by 4 rows grid of 16 equal square cells, read left to right then top to bottom. It is an animation sheet, so the character must be IDENTICAL in every frame: same design, same colors, same proportions, same size, same camera, same lighting. Only the pose changes. Every figure sits fully inside its own cell with clear empty space on all four sides; nothing touches the cell edges; no glow, haze or soft halo around the figure.

THE CHARACTER, a fast zombie jogger, cartoon 3D render in a polished casual mobile-game style, thick clean dark outlines, funny rather than scary:
- Body: skinny and long-legged, leaning far forward.
- Skin: grey-green (#8FA38A) with darker green shading.
- Eyes: round, glowing red pupils (#FF3B3B), always visible, wide open.
- Head: a red sweatband, wild hair streaming back.
- Clothes: a bright yellow running vest (#F2D23A), blue running shorts, one running shoe and one bare foot.

CAMERA AND FRAMING, the same in all 16 cells:
- Top-down three-quarter view from above, about 45 degrees, the character facing the viewer and running toward the bottom of the image.
- The character fills about 70% of the cell height, centered horizontally.
- The ground line always sits on the same baseline, at 85% of the cell height from the top.
- Light from the top left, soft shadow on the character itself only.

ROWS 1 AND 2, SPRINT CYCLE, 8 frames, a frantic sprint with big strides, arms pumping, both feet off the ground in frames 4 and 8:
- Frame 1, left foot striking the ground far forward, right arm forward. Frame 2, weight on the left, knee bent, body lowest. Frame 3, pushing off, right knee driving up. Frame 4, airborne, legs spread wide.
- Frames 5 to 8, the same four poses mirrored with the other leg and arm.

ROW 3, HIT REACTION, 4 frames: bonked in the chest, head snapped back; stumbling, arms windmilling; almost falling, one foot up; recovering into the sprint pose of frame 1.
ROW 4, KNOCKOUT, 4 frames: tripping forward, arms out; flying flat in the air like a superhero belly flop; face down on the grass with eyes turned into cartoon spirals, the sweatband flying off; a poof of grey dust with the sweatband and the shoe lying in it.

No text, no letters, no numbers, no logo, no motion blur, no speed lines.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.24 Zombie — Necromancer

```
Sprite sheet for a mobile game: ONE single character drawn 16 times, a 4 columns by 4 rows grid of 16 equal square cells, read left to right then top to bottom. It is an animation sheet, so the character must be IDENTICAL in every frame: same design, same colors, same proportions, same size, same camera, same lighting. Only the pose changes. Every figure sits fully inside its own cell with clear empty space on all four sides; nothing touches the cell edges; no glow, haze or soft halo around the figure except the magic described in the cast frames.

THE CHARACTER, a zombie club president who raises the others, cartoon 3D render in a polished casual mobile-game style, thick clean dark outlines, funny rather than scary:
- Body: a tall thin old man, very straight, with a long chin.
- Skin: pale grey-green (#A3B39E) with darker shading.
- Eyes: round, glowing lime-green pupils (#C6FF3A), always visible.
- Head: a tall black top hat with a lime-green band, a thin moustache.
- Clothes: a long dark purple tailcoat (#3E2350) over a green golf vest, a monocle.
- Prop: a golf club topped with a glowing green crystal ball, held like a wizard's staff.

CAMERA AND FRAMING, the same in all 16 cells:
- Top-down three-quarter view from above, about 45 degrees, the character facing the viewer and walking toward the bottom of the image.
- The character fills about 75% of the cell height, centered horizontally.
- The soles of the feet always sit on the same baseline, at 85% of the cell height from the top.
- Light from the top left, soft shadow on the character itself only.

ROW 1, WALK, 4 frames, a slow pompous stride using the club like a cane: left foot forward; passing; right foot forward; passing.
ROW 2, CAST, 4 frames: raising the club, the crystal starting to glow; both arms raised high, a swirl of lime-green sparkles around the crystal; pointing the club down at the ground, green sparkles shooting down; lowering the arms, a few sparkles fading.
ROW 3, HIT REACTION, 4 frames: bonked, the top hat jumping up off his head; leaning back, monocle popping out; catching the hat, annoyed; back to the walking pose.
ROW 4, KNOCKOUT, 4 frames: tipping backward stiff like a plank; falling flat, the club flying; lying on the ground with eyes turned into cartoon spirals, the hat rolling away; a poof of grey dust with the top hat and the club lying in it.

No text, no letters, no numbers, no logo, no motion blur, no speed lines.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.25 Boss — Greenkeeper

```
Sprite sheet for a mobile game: ONE single boss character drawn 12 times, a 4 columns by 3 rows grid of 12 equal square cells, read left to right then top to bottom. It is an animation sheet, so the boss must be IDENTICAL in every frame: same design, same colors, same proportions, same size, same camera, same lighting. Only the pose changes. Every figure sits fully inside its own cell with clear empty space on all four sides; nothing touches the cell edges; no glow, haze or soft halo around the figure.

THE BOSS, the zombie Greenkeeper on his ride-on mower, cartoon 3D render in a polished casual mobile-game style, thick clean dark outlines, funny rather than scary:
- A big burly zombie groundskeeper with grey-green skin (#8FA38A), glowing red eyes (#FF3B3B), a bushy beard full of grass clippings, a straw hat, green overalls.
- He rides a rusty red ride-on lawn mower with a big front grille like teeth, one headlight cracked, grass clippings shooting out of the side.

CAMERA AND FRAMING, the same in all 12 cells:
- Top-down three-quarter view from above, about 45 degrees, driving toward the viewer (toward the bottom of the image).
- The boss and mower fill about 80% of the cell, centered; the wheels always on the same baseline at 88% of the cell height.
- Light from the top left, soft shadow on the boss itself only.

ROW 1, DRIVE, 4 frames: the mower rolling forward with the wheels turning, the driver bouncing in the seat, grass clippings puffing out of the side in a different puff each frame.
ROW 2, ATTACK, 4 frames: revving the engine with smoke puffs; leaning forward, the grille snapping open like a mouth; charging with the grille wide open; braking with a skid of grass.
ROW 3, HIT AND DEFEAT, 4 frames: bonked by a golf ball, straw hat jumping up; spinning in the seat with stars around the head; the mower coughing black smoke and stopping; the mower parked and smoking, the greenkeeper slumped over the wheel with eyes turned into cartoon spirals.

No text, no letters, no numbers, no logo, no motion blur, no speed lines.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.26 Boss — Caddie Colossus

```
Sprite sheet for a mobile game: ONE single boss character drawn 12 times, a 4 columns by 3 rows grid of 12 equal square cells, read left to right then top to bottom. It is an animation sheet, so the boss must be IDENTICAL in every frame: same design, same colors, same proportions, same size, same camera, same lighting. Only the pose changes. Every figure sits fully inside its own cell with clear empty space on all four sides; nothing touches the cell edges; no glow, haze or soft halo around the figure.

THE BOSS, the Caddie Colossus, cartoon 3D render in a polished casual mobile-game style, thick clean dark outlines, funny rather than scary:
- A giant hulking zombie caddie, three times as wide as a normal zombie, grey-green skin (#8FA38A), glowing red eyes (#FF3B3B), a tiny caddie cap on a huge head, a sweat-stained white caddie overall stretched over big muscles.
- He carries an enormous armoured golf bag (#B07A3C with riveted steel plates) in front of him like a tower shield, a forest of golf clubs sticking out of the top.

CAMERA AND FRAMING, the same in all 12 cells:
- Top-down three-quarter view from above, about 45 degrees, facing the viewer and walking toward the bottom of the image.
- The boss fills about 80% of the cell, centered; the feet always on the same baseline at 88% of the cell height.
- Light from the top left, soft shadow on the boss itself only.

ROW 1, STOMP, 4 frames: left foot stomping forward with a small dust puff; passing; right foot stomping forward with a dust puff; passing. The bag stays in front.
ROW 2, THROW, 4 frames: pulling a spare golf bag from behind his back; lifting it high over his head with both arms; throwing it forward, the bag flying out of his hands; back to the stomp pose, panting.
ROW 3, HIT AND DEFEAT, 4 frames: bonked on the head by a golf ball, a cartoon bump rising, eyes crossed; staggering, the armoured bag tilting; dropping the bag, falling backward like a giant tree; lying on his back with eyes turned into cartoon spirals, clubs scattered around him.

No text, no letters, no numbers, no logo, no motion blur, no speed lines.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.27 Boss — Bog Giant

```
Sprite sheet for a mobile game: ONE single boss character drawn 12 times, a 4 columns by 3 rows grid of 12 equal square cells, read left to right then top to bottom. It is an animation sheet, so the boss must be IDENTICAL in every frame: same design, same colors, same proportions, same size, same camera, same lighting. Only the pose changes. Every figure sits fully inside its own cell with clear empty space on all four sides; nothing touches the cell edges; no glow, haze or soft halo around the figure.

THE BOSS, the Bog Giant, cartoon 3D render in a polished casual mobile-game style, thick clean dark outlines, funny rather than scary:
- A huge round swamp giant made of glossy brown mud (#6B4A2B) and green moss, three times as wide as a normal zombie, glowing red eyes (#FF3B3B), a cypress stump growing on its head like a hat, reeds and lily pads stuck all over it, dozens of golf balls half sunk in its belly.
- Long dripping arms with big three-fingered mud hands.

CAMERA AND FRAMING, the same in all 12 cells:
- Top-down three-quarter view from above, about 45 degrees, facing the viewer and wading toward the bottom of the image.
- The boss fills about 80% of the cell, centered; the base always on the same baseline at 88% of the cell height.
- Light from the top left, soft shadow on the boss itself only.

ROW 1, WADE, 4 frames: a heavy sloshing step with the left side; mud body squashing low; a heavy step with the right side; mud body stretching tall. Small mud drips falling.
ROW 2, SPLASH ATTACK, 4 frames: raising both mud hands high; slamming them down; a big round ring of mud splashing outward around it; settling, mud dripping from its arms.
ROW 3, HIT AND DEFEAT, 4 frames: bonked, a splat dent in its belly; tipping backward with arms flailing; falling backward into an unseen pond with a big cartoon water splash; only its stump hat and bubbles left floating on a circle of water.

No text, no letters, no numbers, no logo, no motion blur, no speed lines.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.28 Boss — Yeti

```
Sprite sheet for a mobile game: ONE single boss character drawn 12 times, a 4 columns by 3 rows grid of 12 equal square cells, read left to right then top to bottom. It is an animation sheet, so the boss must be IDENTICAL in every frame: same design, same colors, same proportions, same size, same camera, same lighting. Only the pose changes. Every figure sits fully inside its own cell with clear empty space on all four sides; nothing touches the cell edges; no glow, haze or soft halo around the figure except the frost described in the attack frames.

THE BOSS, the zombie Yeti, cartoon 3D render in a polished casual mobile-game style, thick clean dark outlines, funny rather than scary:
- A huge shaggy white yeti with patches of pale green fur, three times as wide as a normal zombie, glowing red eyes (#FF3B3B), a big underbite with two blunt rounded teeth, a red and white knitted bobble hat, a striped golf scarf.
- Giant furry hands, one of them holding a bent golf club like a toothpick.

CAMERA AND FRAMING, the same in all 12 cells:
- Top-down three-quarter view from above, about 45 degrees, facing the viewer and walking toward the bottom of the image.
- The boss fills about 80% of the cell, centered; the feet always on the same baseline at 88% of the cell height.
- Light from the top left, soft shadow on the boss itself only.

ROW 1, STOMP, 4 frames: left foot forward, snow puffing; passing, body lowest; right foot forward, snow puffing; passing, body highest.
ROW 2, FROST ATTACK, 4 frames: taking a huge breath, cheeks puffed; blowing a cone of sparkly blue frost forward; slamming the ground with both hands, ice crystals spreading; charging forward on all fours.
ROW 3, HIT AND DEFEAT, 4 frames: bonked on the nose, eyes watering, bobble hat jumping; slipping on ice, feet flying up; landing flat on its back in the snow; lying in a yeti-shaped snow angel with eyes turned into cartoon spirals, the bobble hat on its belly.

No text, no letters, no numbers, no logo, no motion blur, no speed lines.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.29 Boss — Zombie King

```
Sprite sheet for a mobile game: ONE single boss character drawn 12 times, a 4 columns by 3 rows grid of 12 equal square cells, read left to right then top to bottom. It is an animation sheet, so the boss must be IDENTICAL in every frame: same design, same colors, same proportions, same size, same camera, same lighting. Only the pose changes. Every figure sits fully inside its own cell with clear empty space on all four sides; nothing touches the cell edges; no glow, haze or soft halo around the figure except the magic described in the frames.

THE BOSS, the Zombie King, cartoon 3D render in a polished casual mobile-game style, thick clean dark outlines, funny rather than scary:
- A tall regal zombie golfer twice the size of a normal zombie, grey-green skin (#8FA38A), glowing lime-green eyes (#C6FF3A), a long white beard, a big golden crown with golf-ball jewels.
- A royal purple cape with a green lining over a gold and black argyle golf sweater, white golf trousers, golden golf shoes.
- A golden driver held in both hands.

CAMERA AND FRAMING, the same in all 12 cells:
- Top-down three-quarter view from above, about 45 degrees, facing the viewer.
- The boss fills about 80% of the cell, centered; the feet always on the same baseline at 88% of the cell height.
- Light from the top left, soft shadow on the boss itself only.

ROW 1, WALK, 4 frames: a proud royal stride with the cape flowing, the driver resting on the shoulder; left foot forward; passing; right foot forward; passing.
ROW 2, ROYAL SWING, 4 frames: placing a glowing green skull-shaped golf ball on a tee in front of him; winding the golden driver back over his shoulder; swinging through, the green ball shooting forward toward the viewer with sparkles; the follow-through pose, cape swirling, with a smug grin.
ROW 3, HIT AND DEFEAT, 4 frames: bonked, the crown jumping up off his head; staggering, catching the crown; falling backward with the cape flying; lying flat on his back with eyes turned into cartoon spirals, the crown rolling beside him and the golden driver bent.

No text, no letters, no numbers, no logo, no motion blur, no speed lines.
Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
On a real transparent background, in PNG format.
```

### 10.30 Music — one track in six sections

One file, cut into a menu bed and five biome beds with `Music.play` sections
([MUSIC.md](MUSIC.md), arcider is the reference). AI tracks miss the asked BPM
and can drift their grid: measure the real tempo before cutting.

```
Instrumental music for a family-friendly casual mobile game about golf and cartoon zombies, about 4 minutes, 120 BPM, steady tempo the whole way, in 4/4, playful-spooky and catchy, no vocals, no lyrics, no spoken words, clean loopable section endings.
[Section 1, menu, 0:00-0:35] a relaxed and mischievous lounge-swing groove: brushed drums, upright bass, vibraphone and a playful theremin melody, quiet and cozy.
[Section 2, Country Club, 0:35-1:15] the same melody turned into an upbeat swing with a walking bass, finger snaps, muted trumpet and a bouncy piano, a little spooky organ under it.
[Section 3, Desert Links, 1:15-1:55] the melody as surf rock: twangy reverb electric guitar, fast tom drums, hand claps, a desert whistle.
[Section 4, Bayou Course, 1:55-2:35] the melody as swamp blues: slide guitar, harmonica, washboard percussion, a stomping kick drum, frog-like bass plucks.
[Section 5, Frozen Links, 2:35-3:15] the melody as icy chiptune pop: sleigh bells, glockenspiel, bright square-wave synths, a crisp electronic beat.
[Section 6, Graveyard Greens, 3:15-4:00] the climax: the melody on a big church-style organ over driving rock drums and electric guitars, choir pads without words, energetic and triumphant.
```

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
