# PARRYNORMAL — from the prototype to the game

The plan of record for the next game: the remake of Magic Shield Brick, the
studio's Google Play game, turned into an arcade tower defense. A little witch
stands in the middle of the screen, an arc of shield turns around her, she
launches her own magic balls, parries them back out into the monsters and
throws the monsters back. **It is built** (`games/parrynormal`, v2.0.0, §14
says what the build decided). Everything a session needed to build it on the
motor is here: the rules the prototype validated, the steps
on the motor, the five biomes, the twenty monsters, the eleven supers, the
thirty levels, the meta layer, and one complete prompt for every asset to make.

**Slug:** `parrynormal` (parry + paranormal). The name was checked free on
Google Play and the App Store on 2026-10-27, by a search engine only: confirm
it in the Play Console and App Store Connect before the listing.

**Version: 2.0.0.** It is a remake, so it starts where Magic Shield Brick left
off: `manifest.json` carries `version 2.0.0` from the first build, and the
title screen signs itself `v2.0.0`.

______________________________________________________________________

## 0. Where things are

| what                                       | where                                                                |
| ------------------------------------------ | -------------------------------------------------------------------- |
| the prototype, the reference for the rules | [`prototype/parrynormal.html`](../prototype/parrynormal.html)        |
| the original game's captures and icon      | [`site/image/magic-shield-brick/`](../site/image/magic-shield-brick) |
| the game                                   | `games/parrynormal/` (to create)                                     |

The prototype is the reference for every rule and every number below. Its look
is not: its placeholder glyphs are replaced by the painted sprites of §11. Its
tunables are the `var`s at the top of the file. Port them as they are, then
tune them in the game, not in the prototype.

The art direction is the original game's (the captures): painted Halloween
scenes in deep purples and night blues, a glossy emoji-like hero in a witch's
hat, a cyan arc of shield that turns green when it grows, orange-brown balls
with a soft trail, chunky gold numbers.

______________________________________________________________________

## 1. The game in one sentence

Turn the shield around the witch to parry her magic balls into the monsters,
and throw back every monster that comes too close.

- **Intro tagline (EN):** `Turn the <b class="w-shield">shield</b> to parry the balls and throw the <b class="w-monster">monsters</b> back.`
- **Intro tagline (FR):** `Tourne le <b class="w-shield">bouclier</b> pour renvoyer les balles et repousser les <b class="w-monster">monstres</b>.`
- **Tags (EN):** arcade, tower defense, Halloween. **(FR):** arcade, tower
  defense, Halloween.
- **Store subtitle:** *Parrynormal: Witch Shield Defense*.
- **Intro demo:** `CONFIG.intro.demo = "drag"`. The shared finger turns a
  small dial drawn by the SKIN, a cyan arc turns around a little witch with
  it, and a ball bounces off the arc. `CONFIG.intro.desk`: the mouse aims, a
  click launches a ball, Z X C V fire the supers.

### 1.1 Who it is for, and the hero who speaks to them

**The audience is the original's: all ages, short arcade sessions.** It is a
reflex game with a light layer of preparation (the supers picked before each
stage). Monsters are cartoon and funny, never scary: a monster that is beaten
is *knocked out* and goes *poof*. The game falls under Google Play's Families
policy like every game of the studio.

**The hero is the witch of Magic Shield Brick** (the original icon): a round,
glossy orange-yellow emoji face, big glossy violet eyes with white highlights,
a small nose, rosy red blush on the cheeks and a gentle smile, under a big
floppy purple witch's hat with a curled tip and a dark red band. She has no
arms and no legs: she is a face under a hat. Her name is an open decision
(§13).

She is the round's centre, seen from above on her own frame sheet (§1.2), and,
seen from the front, the end screen's three faces, the title screen, the
village and the store images.

### 1.2 The camera and the sprites

- **The round is seen from high above, in the three-quarter view of a classic
  top-down adventure game**: the ground lies flat and fills the frame, and what
  stands on it shows its top and a little of its front. The monsters come from
  all four edges and the shield turns all the way round, so the camera looks
  down on the arena rather than across it. The scene (§11.4–11.8) has no
  horizon and no sky, the details in a border along the edges, the middle a
  plain clearing.

- **Everything outside the round stays front view**: the end screen's three
  faces, the logotype, the icon, the stickers, the village, and the monsters'
  portraits that the stage card, the guide and the bestiary show (§11.16).
  The pickups and the supers' icons are the same three-quarter objects in the
  round and on the buttons: an item floats, it does not walk.

- **One sheet per character, its columns the DIRECTIONS and its rows the
  MOMENTS**: the witch (§11.13), each of the twenty monsters (§11.14), and
  one sheet of extras (§11.15). A first test, one animation per row with the
  monster asked to face the top of every cell, came back with a different
  orientation in every cell: an image model holds front, profile and back,
  not a heading. Every sheet is 5 columns × 4 rows (the Dragon 5 × 5):

  | column | direction                      | mirrored, it also gives |
  | ------ | ------------------------------ | ----------------------- |
  | 1      | front, moving down the screen  | —                       |
  | 2      | front diagonal, down and right | down and left           |
  | 3      | profile, moving right          | moving left             |
  | 4      | back diagonal, up and right    | up and left             |
  | 5      | back, moving up the screen     | —                       |

  | row | moment        | played                                                                                         |
  | --- | ------------- | ---------------------------------------------------------------------------------------------- |
  | 1–2 | the two steps | alternated at `MOVE_FPS` 6, scaled by the monster's speed, slowed by Freeze                    |
  | 3   | the attack    | held while it does its special (§5: the leap, the spit, the dig, the bomb…) or bites the witch |
  | 4   | the hurt      | on a hit for 0.25 s, held while it is thrown; a knockout is this frame squashed, then the poof |

  The Dragon's extra row is its charge. The witch's sheet is 5 × 5: two ready
  frames (breathing, looped), launching, hurt (a heart lost, the shield
  frozen), cheering. She turns with the middle of the shield, through the
  directions in between, one at a time.

- **Eight directions, never a rotation.** The game takes the heading (the
  velocity, or the shield's angle for the witch, who always faces it), picks
  the nearest of the eight, and draws the right-facing columns mirrored for
  the left (a flip, `ctx.scale(-1, 1)`). A three-quarter sprite that is
  rotated leans, so nothing on these sheets turns. The two exceptions are not
  people: the Dragon's fireball, which is round and rotates to its flight,
  and the tumble of a monster thrown by the shield, which spins on its slide
  because a spin is the slapstick of being thrown.

- **The painter's order is the feet.** A monster lower on the screen stands in
  front of one higher up, so the round sorts its sprites by the feet every
  frame, and every frame is anchored on its feet. The game draws a soft
  ellipse under every sprite (a cached canvas, never `shadowBlur`), set lower
  under a flier so it reads as off the ground. The sheets carry no shadow and
  an even light from above, since a mirrored frame would mirror its light.

- **What the code still does**: the white flash of a hit (a tinted copy of
  each frame, made once), the Gargoyle's stone (a grey copy), the Ghost's fade
  and the Vampire's blink (alpha), the knockout's squash, the slime's split
  (two slimelets, the slime's frames at 0.6), the swarms (one Mosquito, one
  Rat, drawn five and four times, each on its own phase), the Skeleton's pile
  and the Gravedigger's mound (§11.15, in place of the monster), every
  projectile and blast but the fireball, and the variants of §5.1: the size,
  the biome's palette and the mood's tint and pace.

- **The pipeline** is holepocalypse's (its §2.11): cut with the sheet's own
  `--grid`, encode on one fixed `scale` profile, never a box (a box fits each
  frame on its own and the monster pulses in size), clear the soft halo the
  image model leaves (alpha `< 80 → 0`), and anchor every frame on its feet:
  the bottom of the main body, x at its alpha-weighted centre, measured off
  the pixels, never on the cell.

- **A sheet is judged before it is adopted** in
  [`lab/parrynormal-sprites.html`](../lab/parrynormal-sprites.html) (`make lab`):
  it cuts the sheet by its cells, measures the feet, and plays it in the
  arena, driven by the pointer, in the eight directions side by side, or as
  the sheet with its cut.

______________________________________________________________________

## 2. The rules the prototype validated

### 2.1 The shield and the control

- **The shield is an arc** around the witch, centre radius `SHIELD_R` 118,
  thickness `SHIELD_W` 16, `BASE_ARC` 70° at rest. **It never closes**: at
  most `MAX_ARC` 320°, so an opening of 40° always stays.
- **On a phone it is steered with a DIAL** at the bottom of the screen: the
  shield points where the thumb is on the dial (absolute), so the thumb never
  covers the action. That was the original's flaw: its shield pointed at the
  finger, which sat next to the witch and hid the balls. A white dot on the
  dial's rim shows where the thumb is.
- **On a desk there is no dial**: the shield points at the mouse, button up
  or down. `Desk.on()` says which (the motor follows
  `(hover: hover) and (pointer: fine)` live, and `?desk=1` forces it).
- **The spin kick**: the shield's own angular speed is passed to a parried
  ball (`SPIN_KICK` 0.5). Turning the shield as a ball lands is how the witch
  aims.
- **The perfect parry**: an impact within `PERFECT_DEG` 8° of the arc's middle
  (a white notch drawn on it) pays `PERFECT_SCORE` 20 more and sends the ball
  out `PERFECT_SPEED` ×1.3 harder.
- **The bounce**: every impact dents the shield on a spring (`SPRING_K` 900,
  `SPRING_D` 16): deepest where it was hit, fading over `BOUNCE_SPREAD` 0.55
  rad either side, a quarter of it all along, and the arc fattens a little
  while it bounces. A monster dents it more than a ball. A launch pushes it
  out. The arc is drawn as a polyline (`shieldPath`) for that.

### 2.2 The balls

| ball  | where it comes from                                                                       | on the shield                               | on the witch                                                              | on a monster      |
| ----- | ----------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- | ----------------- |
| blue  | **launched by the witch**: the dial's hub on a phone, a click on a desk, along the shield | parried; every 5th parry drops a brown ball | **no heart**: the shield freezes for `SHIELD_LOCK` 0.5 s, the combo drops | 1 damage, bounces |
| brown | dropped by a blue ball's 5th parry, a parried spit, the Brew super, the Potion            | parried, scores                             | destroyed, nothing lost                                                   | 1 damage, bounces |

- `MAX_BLUE` 3 blue balls out at once, `BALL_CD` 2 s between two launches,
  `LAUNCH_SPEED` 620. The hub shows the cooldown and three pips for the balls
  still in hand.
- Every ball is pulled toward the witch (`GRAVITY` 220 + 5 per stage) and
  bounces off the screen edges, so every ball comes back: that is the parry
  loop. `MAX_SPEED` 950, four substeps a frame.
- A blue ball wears five small pips around it, one per parry toward its brown
  ball.
- At most `MAX_BROWN` 24 brown balls.

### 2.3 The monsters and the knockback

- Monsters come in from **any point of the four screen edges** — a random
  angle around the witch, carried out to the edge (`edgePoint`) — after a red
  warning ring (`SPAWN_WARN` 0.8 s) and walk, fly, dig or hop toward the witch. A monster
  that reaches her costs a heart. `LIVES` 3 a stage.
- **The shield throws a monster far back**: 1 damage and a slide of
  `KNOCK_SPEED` 1150 px/s, damped by `KNOCK_DAMP` 3.5, about 330 px. The
  dragon slides `KNOCK_BOSS` 0.45 of it. A sliding monster bounces off the
  screen edges.
- **The strike (bowling)**: a monster still sliding faster than `KNOCK_HIT`
  280 px/s that meets another one hurts it (1 damage, `Strike`) and passes it
  `KNOCK_PASS` 0.6 of its speed, so a throw can chain. It hurts the Knight,
  whom the shield cannot.
- Each monster's behaviour, hit points and speed are the prototype's
  `ENEMIES` table (§5).
- A stage is won when every monster of it is gone.

### 2.4 The pickups — the tower defense on the field

A pickup floats on the field for `PICKUP_LIFE` 10 s, one every
`PICKUP_EVERY` 5 s. **Any ball that touches one takes it**, a brown ball
too, which is what brown balls are for.

| pickup  | effect                                                                                                     |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| Star    | the shield grows 40° for 5 s, **progressively** (`ARC_GROW` 110°/s both ways); stars stack                 |
| Pumpkin | a blast: monsters in range take 5 (`blastDmg`), balls are thrown away, brown balls in range pop in a chain |
| Candle  | a turret where it stood: a homing flame at the nearest monster every 1 s (1 damage on arrival), for 10 s   |
| Web     | a zone where it stood (radius 110, 10 s): monsters in it move at 35 %                                      |
| Potion  | every brown ball splits in two                                                                             |
| Heart   | one heart back                                                                                             |

The Tombstone left the pickups in v2.3.0: it is now what a knocked-out
**zombie** leaves where it fell (§5).

### 2.5 The supers — the buttons beside the dial

- **Picked before each stage** on the stage card (§3 step 7): 2 slots from
  level 1, 3 from level 10, 4 from level 20.
- **One button per slot**, either side of the dial (`SLOT_POS`), each with its
  own cooldown drawn as a pie and a count. Fired at the right moment, they are
  the counter to the stage's monsters.
- **A super is found** on its level (§6): that stage's card adds it to the
  loadout, so it is met, and marks it *New*.
- Eleven supers (§7). The prototype's numbers: Lightning 12 s, Freeze 16 s,
  Shockwave 14 s, Full moon 20 s, Brew 18 s, Familiars 22 s, Fire rain 20 s,
  Salt circle 24 s, Broom 10 s, Toadify 28 s, Banish 30 s.

### 2.6 Score and combo

- A parry pays `PARRY_SCORE` 10 × the combo multiplier, a perfect parry 30 ×.
- The combo counts every parry, of a ball, a monster or a spit. It climbs one
  multiplier step every `COMBO_STEP` 10, up to ×5, and drops to zero on a
  heart lost or a shield frozen.
- A monster knocked out pays its own `score`, × the multiplier. A brown ball
  popped in a pumpkin chain pays 25.

### 2.7 What stays in the prototype

The debug keys (`[` `]` stage, `1`–`7` pickups, `N`, `K`, `R`), the debug text
lines and the arrow keys' dial do not travel. The placeholder glyphs
(`drawMonster`, `drawSuperGlyph`, `drawPickupGlyph`) stay as the fallback of a
build without the sprites, and are what the guide draws until the art lands.
The rejected malus (the frog that turned the shield to the opposite side) is
gone for good: the control is hard enough. Its idea lives on as the Toadify
super, turned in the player's favour.

______________________________________________________________________

## 3. Building it on the motor

Follow [CLAUDE.md](../CLAUDE.md#how-to-create-a-new-game) and
[CREATING_A_GAME.md](CREATING_A_GAME.md) from the top. What is specific:

1. **The sources.** Create `games/parrynormal/` from the template's three
   sources, then the manifest:

   - `title` *Parrynormal*, **`version 2.0.0`**, `targets ["playable", "web"]`
     (android later, §13);
   - `theme`: night purple ground `#2b1636`, the shield's cyan as the accent
     `#19e6ff`, the hat's purple as `accent2` `#6b3fb8`, the score's gold
     `#ffd23a`;
   - `web.font` **`bungee`**: a chunky single-weight display face, close to
     the original's arcade numbers;
   - `web.music`, `web.levels` (five `bands`, the biomes of §4), `web.meta`,
     `web.village`.

1. **A motor gain: multi-touch.** `Input` follows `touches[0]`, so a second
   finger is invisible to the game, and a thumb held on the dial while
   another finger taps a super must work. Make `Input` keep the `identifier`
   of the touch that started on the canvas and read that touch out of
   `changedTouches` / `touches`, and emit a second finger's `down` with its
   own id (`p.id`). No game changes behaviour, since none uses two fingers
   today. Document it in [ENGINE.md](ENGINE.md) beside `Input.on`.

   The supers' buttons may instead be DOM buttons laid over the canvas, which
   receive their own touches. Even so, the canvas must keep following the
   dial's finger, so the identifier part of the gain is needed either way.

1. **`CONFIG`.**

   - `gameSeconds`: not used by the levels (a level ends when its monsters are
     gone); the playable sets it (below).
   - `layout`: the arena is `Layout` above **`Layout.foot`**. The dial row
     (dial, hub, slots and their names) sits on `Layout.foot`, about 230
     design px tall, and the witch stands at the middle of what is left. The
     prototype's fixed `CY` 590 and `DIAL_Y` 1120 become values computed in
     `onResize` from `Layout`, never hard-coded.
   - The prototype's tunables become `CONFIG.play`; `ENEMIES`, `SUPERS`,
     `PICKUPS`, `BIOMES` and the level table become tables of section 6.

1. **The round's scene.** The round paints its biome's scene itself, on the
   canvas, under everything: `ArtImages.sceneForest`, `sceneGraveyard`…,
   the ground seen from above (§1.2), cover-fit to the frame. This is gelatile's pattern, not
   `CONFIG.sceneArt`: the intro, the map and the menus keep the plain
   `backgroundPhone` (§11). Without the art, the scene falls back to the
   prototype's vertical gradient in the biome's three colours.

1. **The `Game` module.** Port it from `prototype/parrynormal.html`, dropping
   its loop, canvas sizing, HUD text, the stage card's canvas drawing, the
   keys and the debug lines.

   - Port: the shield (`arcDeg`, `onShield`, `kickShield`, `shieldPath`,
     `freezeShield`), the balls (`launchBall`, `updateBalls`, `parry`,
     `bounceOff`, `dropBrown`), the monsters (`newEnemy`, `updateEnemy`,
     `slide`, `throwBack`, `collideEnemy`, `hurtEnemy`, `killEnemy`,
     `explode`), the spits, the pickups and towers (`apply`, `blast`,
     `updateChain`, `updateTowers`), the supers (`fireSuper`,
     `updateMeteors`, `updateFamiliars`).
   - **The sprites** follow §1.2. The witch and the monsters play their
     top-down frame sheets (§11.13–11.15), drawn with `drawImage`, centred on
     their feet, scaled to the monster's `r`, in the column of their heading,
     mirrored for the left; each monster keeps its own animation clock, so a pack never
     steps as one. The flash and stone copies are made once at load, keyed
     on `view.dpr`, never `ctx.filter`. The pickups are their cuts (§11.18),
     bobbing over a shadow.
   - `render()` paints the scene, then wraps the witch in one
     `Enter.begin/end` (she lands first), then the dial row's elements. The
     monsters arrive with their warning rings after the landing, never during
     it.
   - `onDown/onMove/onUp` carry the dial (phone) or the mouse aim (desk,
     `Desk.on()`): on a desk a `move` aims and a `down` launches. On a phone
     a `down` on the hub launches, on a slot fires the super, anywhere else
     takes the dial. `onResize` rebuilds the layout and the sprite caches and
     must not touch round state before the first `reset()`.
   - **The text floors** (CLAUDE.md, constraint 8): the slot names under the
     buttons are capitals (`upper()`) in bold at 18 px or more, and the hub's
     count is a figure. The prototype's 20 px normal-case labels do not
     survive.
   - No `shadowBlur`: the shield's glow is the prototype's three wide
     strokes, and every trail is drawn lines.

1. **The words go through the motor** (§9).

1. **The stage card.** Before each level's round, one card (the shell's card
   component, the round paused under it) announces the stage: the biome, the
   number of monsters, each kind with its picture, its name, its line and
   *Weak to* (the supers that counter it, the ones in the loadout in green),
   then the unlocked supers as tiles to pick, *New* on the one found here, a
   green dot on a counter. Its tap line is **Tap to fight**. The tiles take
   their own taps and never close the card: a tap must not stand in for a
   choice. The loadout is saved per game (`Store`), so the next card opens on
   the last one. *To confirm when building*: the API a game uses to open a
   shell card over its own round. Holepocalypse left the same card open (its
   §12), so whichever lands first sets the pattern. The playable has no card:
   its loadout is fixed.

1. **The HUD.** `HUD.setScore` carries the score, `HUD.setLeft` the hearts
   (`♥ 3`), `HUD.setRight` the monsters left (`Monsters 9`). The combo is a
   `Pop.show("combo")` when its multiplier steps up, not a HUD line. The live
   star pill is the level layer's.

1. **Sound from the house kit**, mapped in the manifest's `sfx` (variants
   picked in `make events`):

   | key       | role      | when                                                    |
   | --------- | --------- | ------------------------------------------------------- |
   | `launch`  | `launch`  | a blue ball launched                                    |
   | `parry`   | `bounce`  | a ball parried; the rate climbs with the combo (melody) |
   | `perfect` | `bonus`   | a perfect parry                                         |
   | `combo`   | `combo`   | the multiplier steps up                                 |
   | `drop`    | `burst`   | a blue ball drops its brown ball                        |
   | `hit`     | `monster` | a ball hits a monster                                   |
   | `shove`   | `crash`   | the shield throws a monster back                        |
   | `strike`  | `crash`   | a thrown monster bowls another one over                 |
   | `ko`      | `burst`   | a monster knocked out                                   |
   | `ouch`    | `warn`    | a heart lost                                            |
   | `frozen`  | `malus`   | the shield frozen by her own ball, or jammed by an imp  |
   | `take`    | `pickup`  | a pickup taken                                          |
   | `build`   | `toggle`  | a candle, tombstone or web set down                     |
   | `super`   | `power`   | a super fired                                           |
   | `back`    | `bounce`  | a spit parried back as a brown ball                     |
   | `arrive`  | `world`   | a monster's warning ring                                |
   | `clear`   | `goal`    | the stage cleared                                       |
   | `down`    | `miss`    | the last heart lost                                     |

1. **The level hooks** ([LEVELS.md](LEVELS.md)):

   - `Game.levelGoal(n)` returns the goal, *Clear the stage*, with its count
     (`{ goal: count, text: "Knock out 13 monsters" }`);
   - `Game.levelProgress()` is the monsters knocked out;
   - `Game.levelTally()` counts the stars (§6);
   - `Game.levelWon()` ends the round once the last monster is gone, after
     about 0.6 s so its poof is seen.

   The level table (`LEVELS` in game.js, read off `CONFIG.level`) gives each
   level its monsters, count, spawn rhythm, new super and new pickup.
   `web.levels.tune` lerps only the pressure (§6).

1. **The art pipeline.**

   - `encode-art.mjs parrynormal` for the backgrounds, the five scenes, the
     title and the characters. The `scene-*` roles need the
     `background-phone` profile in `profileFor` (the one gelatile adds; add it
     if gelatile is not built yet), and the `scene-` prefix among the known
     roles.
   - `cut-objects.mjs` for every `-object-*` sheet, with the `--grid` of its
     prompt, then `--adopt`.
   - The frame sheets (`witchNN`, `<monster>NN`, `extraNN`) need a fixed
     `scale` profile in `profileFor` and their prefixes among the known roles
     of `encode-art.mjs`, as holepocalypse's zombies have: about 0.25 for a
     monster, so a frame is about twice the size it is drawn at, more for
     the witch and the Dragon. The size it is drawn at is the BOSS's
     (§5.1, × 1.8): a normal monster and a baby are scaled down from it.
     Set it once the first sheet is in.
   - The portraits (`monsterNN`) are drawn on cards only: a 256 px box.
   - The playable carries biome 1 only: its scene, the witch, the Bat and
     Jack sheets, the Star and the Pumpkin. The other scenes, monsters,
     extras and the portraits are web-only (`CONFIG.artLazy`).

1. **The icon.** Copy it to `assets/image/icon/parrynormal.png` and cut the
   320 px thumb into `thumb/`. Leave no `logo` key once `-title.png` exists.

1. **Close.** Run `node tools/update.mjs`, then `make text` until it reads
   *fully translated*, then the definition of done (§12).

**The playable cut** (5 MB, 20–30 s):

- the haunted forest: its scene, Bats and Jacks;
- the blue ball and its brown balls, the Star and the Pumpkin;
- one super, Lightning, fixed (no stage card);
- `gameSeconds` 45. The round ends on the clock, or on the last heart.

Everything else is web.

______________________________________________________________________

## 4. The five biomes

One biome per six levels. Each brings four monsters, one at a time (§6), and
its own painted scene behind the round. The original game's captures already
show three of the places: the haunted forest, the castle hall, the dragon's
throne.

| #   | biome (EN / FR)                       | levels | monsters                             | scene                                                          |
| --- | ------------------------------------- | ------ | ------------------------------------ | -------------------------------------------------------------- |
| 1   | Haunted Forest / Forêt hantée         | 1–6    | Bat, Jack, Wisp, Spider              | cracked flagstones, trees and fence pieces in the corners      |
| 2   | Graveyard / Cimetière                 | 7–12   | Zombie, Skeleton, Ghost, Gravedigger | trodden earth, mist, tombstones and a mausoleum in corners     |
| 3   | Witch's Swamp / Marais de la sorcière | 13–18  | Slime, Mosquitoes, Toad Shaman       | a mossy bank, water and lily pads, a cauldron, mushrooms       |
| 4   | Castle Crypt / Crypte du château      | 19–24  | Knight, Gargoyle, Vampire, Rats      | stone slabs, pillar tops, candelabras, stained-glass light     |
| 5   | Dragon's Throne / Trône du dragon     | 25–30  | Imp, Salamander, Dark Priest, Dragon | cracked flagstones, lava cracks, throne and statues in corners |

**Every scene is the ground seen from above, and keeps its middle calm**
(§1.2): the witch and the shield stand there, and the monsters walk across it
from every edge. The details live in a border along the edges, the ground at
the bottom stays plain for the dial row, nothing marks the centre (the witch's
height is computed from `Layout`), and the colours stay mid-dark so the bright
monsters and the cyan shield pop.

**Every edge is open**, since a monster can enter at any point of any edge
(§2.3). Along the edges there are only low things a creature walks over
(grass, roots, leaves, puddles, mist, cracks), and the very edge fades into
the night, so a monster walks in out of the dark. Anything tall (a trunk, a
fence, a pillar, a tombstone, a statue, the throne) stands only in the
corners, never in a line along an edge. A scene with a fence or a row of
trees across an edge is regenerated, not kept: it shows a wall the monsters
walk through.

______________________________________________________________________

## 5. The twenty monsters

The prototype's `ENEMIES` table, as it was played. The key is the guide
page's id, the `Notify.learn` id and the codex card. The names are the
monsters' kinds, translated (they are not proper nouns).

| key          | EN          | FR             | biome | HP  | speed | behaviour                                                                              | weak to                | first level |
| ------------ | ----------- | -------------- | ----- | --- | ----- | -------------------------------------------------------------------------------------- | ---------------------- | ----------- |
| `bat`        | Bat         | Chauve-souris  | 1     | 1   | 85    | flutters straight in, wobbling                                                         | Lightning, Familiars   | 1           |
| `jack`       | Jack        | Citrouille     | 1     | 3   | 50    | walks straight in                                                                      | Lightning, Fire rain   | 2           |
| `wisp`       | Wisp        | Feu follet     | 1     | 1   | 80    | dashes, stops, dashes again                                                            | Freeze, Salt circle    | 4           |
| `spider`     | Spider      | Araignée       | 1     | 2   | 70    | stops at 270 px, waits 0.9 s, leaps at 520                                             | Freeze, Shockwave      | 5           |
| `zombie`     | Zombie      | Zombie         | 2     | 5   | 32    | very slow, very tough                                                                  | Shockwave, Banish      | 7           |
| `skeleton`   | Skeleton    | Squelette      | 2     | 2   | 55    | falls into a pile, pulls itself together in 2.5 s unless the pile is hit               | Lightning, Fire rain   | 8           |
| `ghost`      | Ghost       | Fantôme        | 2     | 2   | 60    | fades 0.9 s in 2: balls pass through, the shield does not                              | Lightning, Broom       | 10          |
| `mole`       | Gravedigger | Fossoyeur      | 2     | 2   | 70    | digs in out of reach, surfaces at 230 px                                               | Shockwave, Lightning   | 11          |
| `slime`      | Slime       | Slime          | 3     | 3   | 45    | splits into two slimelets (1 HP, 75) when knocked out                                  | Fire rain, Shockwave   | 13          |
| ~~`frog`~~   | Bullfrog    | Ouaouaron      | 3     | 2   | 55    | RETIRED in v2.3.0, see below                                                           | Freeze, Salt circle    | 14          |
| `mosquito`   | Mosquitoes  | Moustiques     | 3     | 1   | 110   | a swarm of five                                                                        | Shockwave, Familiars   | 16          |
| `shaman`     | Toad Shaman | Crapaud chaman | 3     | 3   | 50    | stops at 340 px, spits every 3 s and creeps in between; a spit parried is a brown ball | Freeze, Lightning      | 17          |
| `knight`     | Knight      | Chevalier      | 4     | 5   | 40    | the shield cannot hurt its armour (it still throws it)                                 | Lightning, Fire rain   | 19          |
| `gargoyle`   | Gargoyle    | Gargouille     | 4     | 3   | 70    | turns to stone 1.2 s in 3.2: nothing hurts it but magic                                | Lightning, Banish      | 20          |
| `vampire`    | Vampire     | Vampire        | 4     | 3   | 40    | blinks to another side every 1.6 s, 50 px closer                                       | Salt circle, Lightning | 22          |
| `rat`        | Rats        | Rats           | 4     | 1   | 125   | a fast pack of four                                                                    | Shockwave, Familiars   | 23          |
| `imp`        | Imp         | Diablotin      | 5     | 1   | 110   | blows up on the shield and jams it to 28° for 1.5 s; a blast if knocked out            | Salt circle, Fire rain | 25          |
| `salamander` | Salamander  | Salamandre     | 5     | 2   | 120   | spirals in from the side                                                               | Freeze, Salt circle    | 26          |
| `priest`     | Dark Priest | Prêtre noir    | 5     | 3   | 45    | stops at 360 px, heals the monsters within 220 by 1 every 2 s                          | Lightning, Banish      | 28          |
| `dragon`     | Dragon      | Dragon         | 5     | 30  | 25    | the boss: stops at 300 px, breathes three fireballs every 2.6 s, charges every 8 s     | Lightning, Banish      | 30          |

A monster's **score** is the prototype's (`score`, 20 to 1000). Magic
(Lightning, Banish) ignores every protection: the dirt, the fade, the stone,
the armour.

### 5.1 Variants — one sheet, many monsters

A sheet (§1.2) is a kind, and a kind is drawn in many ways without one more
picture: **smaller or bigger, in another colour, in another mood**. Each of
the three is a number the round already has (the frame's size, a baked
colour swap, the step rate and the speed), so a variant costs a row of a
table, never a sheet. All three were tried in
[`lab/parrynormal-sprites.html`](../lab/parrynormal-sprites.html): its frame
width is the size, its colour swap the palette, its steps per second with
its speed the mood.

A spawn is therefore a kind plus up to three modifiers, written in the level
table as `spider`, `spider:baby`, `spider:boss`, `spider@swamp`. The moods
are never written there: the round gives them (below).

#### Size — babies and bosses

| size   | drawn | HP                | speed  | step rate | score | knockback taken           | comes                                     |
| ------ | ----- | ----------------- | ------ | --------- | ----- | ------------------------- | ----------------------------------------- |
| baby   | × 0.6 | × 0.5, at least 1 | × 1.25 | × 1.4     | × 0.5 | × 1.3, they fly further   | in a clutch of three, side by side        |
| normal | × 1   | the kind's        | × 1    | × 1       | × 1   | × 1                       | one at a time                             |
| boss   | × 1.8 | × 6               | × 0.7  | × 0.6     | × 8   | × 0.45, the Dragon's rule | alone, last of its stage, after a warning |

- **A baby is weaker, a boss is a wall.** A baby clutch tests the reflex (three
  small targets at once, fast and light), a boss tests the strike and the
  supers: it shrugs the shield off, and what moves it is a bowled monster or
  magic.
- **The size keeps the kind's behaviour and scales its reach**: a boss Spider
  waits and leaps from 1.8 × as far, a boss Toad Shaman spits a ball that
  needs two parries, a boss Gravedigger surfaces with a ring of dirt that
  throws the balls around it. A baby keeps its kind's trick at its own size.
- **Bosses always wear the enraged mood below half their HP** (below), so a
  fight against one has two halves.
- **The sheets are encoded for the boss**, the biggest a frame is ever drawn
  (§3 step 11): a normal monster and a baby are scaled DOWN from it, never a
  boss scaled up from a normal frame.
- The Dragon is a boss by kind (§5); it takes no `:boss`.

#### Palette — the biome's colours

Each biome has a palette, a colour swap of the kind's body:

| biome     | palette    | the swap (hue, saturation, lightness) |
| --------- | ---------- | ------------------------------------- |
| forest    | as painted | —                                     |
| graveyard | moss grey  | 165°, × 0.7, × 0.95                   |
| swamp     | poison     | 115°, × 1, × 1                        |
| crypt     | blood moon | 345°, × 1.1, × 0.9                    |
| throne    | ember      | 22°, × 1.2, × 1.05                    |

- **A kind wears the palette of the biome it fights in**, so a forest Spider
  met again in the swamp is a poison-green Spider. Its own biome's kinds keep
  their painted colours, which is what makes a returning kind read as a
  visitor, and the endless run dresses every kind in the biome of the moment.
- **The palette changes the look, not the rules**: the same HP, speed and
  behaviour. The guide says so on its page, and a kind's bestiary card shows
  every palette it has been met in.
- **The swap moves only the hues near the body's own** (the lab's method):
  the eyes, the teeth, a pumpkin's stem keep their colour. It is measured per
  kind, so the body's hue is read off the sheet, not typed. A palette that
  swallows a kind's details (a red body under red eyes) is skipped for that
  kind in `PALETTE_SKIP`, judged in the lab by eye.

#### Mood — the same monster, in another state

| mood    | look                                            | speed  | step rate | lasts          | when                                                                                       |
| ------- | ----------------------------------------------- | ------ | --------- | -------------- | ------------------------------------------------------------------------------------------ |
| enraged | a red tint that pulses, a hop on the spot first | × 1.6  | × 1.8     | 5 s            | a monster of its own kind knocked out within 160 px; a boss below half its HP (to the end) |
| slowed  | a cold blue tint                                | × 0.5  | × 0.5     | while it lasts | Freeze (§7), a Web (§2.4)                                                                  |
| dizzy   | the hurt frame held, a small wobble of ±6°      | 0      | 0         | 1 s            | bowled over by a thrown monster (the strike) or thrown into a screen edge                  |
| tired   | a little greyer                                 | × 0.75 | × 0.75    | to the end     | thrown back by the shield a third time                                                     |

- **A mood is the round's answer to what the player did**: knock one Spider
  out next to its sisters and they come on faster and red; throw the same
  Zombie back three times and it drags its feet. Rage is the chain reaction
  that punishes a sloppy knockout, tiredness the reward for holding a line.
- **Rage spreads only once**: an enraged monster knocked out does not enrage
  its neighbours again, or a pack would never end. A slowed monster that
  enrages is simply both (× 0.8 speed).
- **A mood never changes the frames**, only how fast they turn and how they
  are tinted: the step rate scales the walk cycle (§1.2), and the tint is a
  coloured copy of each frame made once at load, like the white flash, drawn
  over it at a pulsing alpha. Never a `ctx.filter`.
- **The kind's own behaviour reads the mood**: an enraged Spider waits 0.4 s
  instead of 0.9 before it leaps, an enraged Toad Shaman spits twice as
  often, an enraged Vampire blinks every 0.8 s, an enraged Imp runs at the
  shield and blows up early. A table, `MOOD_TRICK`, next to `ENEMIES`, one
  line a kind, and an empty line is a kind that only changes its pace.

#### In the code

- Three tables beside `ENEMIES` in section 6: `SIZES`, `PALETTES` (per biome,
  plus `PALETTE_SKIP`) and `MOODS`, with `MOOD_TRICK` for what a mood does to
  each kind's trick. Every multiplier above is a field there and nowhere
  else, so tuning is editing a table.
- **Baked at the round's start, never mid-round**: `reset()` reads the
  level's spawns, builds the palette frames each one needs (`kind|palette`,
  cached across rounds and keyed on `view.dpr`) and the tint copies of the
  moods. A palette is 20 frames recoloured once, a few milliseconds; it
  happens behind the stage card, before the entrance.
- **A monster carries `size`, `palette` and `mood`**, and its draw is the same
  call for all of them: the frame of its direction and moment (§1.2), drawn
  at `r × size`, from the palette's frames, with the mood's tint over it and
  its walk clock running at `rate × size.rate × mood.rate`.
- **The hitbox follows the size** (`r × size`), and so do the shadow and the
  warning ring.

#### What the player is told

- **A variant met the first time is named once**, `Notify.learn`, on its
  guide page: `baby`, `boss`, `palette`, `enraged`, `slowed`, `dizzy`,
  `tired`.
- **A boss is announced** when its warning ring opens: a `Notify.say` of the
  event (`warn`), *A giant spider!*, since the player did not make it.
- **Rage and tiredness are the player's doing**, so they are a `Pop.show` over
  the monster the first time a stage sees them (`alert`: *Enraged*; `score`:
  *Tired*), and nothing after: the tint says the rest.
- **The bestiary** (§10.3) keeps one card per kind, with the sizes and
  palettes the player has met on it. A boss knocked out is a line of its
  card, *Giant, knocked out*, which the codex can count.

______________________________________________________________________

## 6. The thirty levels

**A level is a stage**: its monsters come in turn from the edges, `count` of
them every `every` seconds, and it is won when the last one is gone.

**The stars are counted by the game** (`Game.levelTally()`), cumulative:

- ★ — the stage cleared;
- ★★ — cleared with at most one heart lost;
- ★★★ — cleared with no heart lost.

A heart lost is a monster or a spit that reached the witch. Her own blue ball
never costs one. A stage lost (three hearts) earns no star, and the score
still pays the wallet.

**The pressure**, lerped over the climb by `web.levels.tune`:

| knob                  | level 1 | level 15 | level 30 |
| --------------------- | ------- | -------- | -------- |
| `play.gravityStage`   | 5       | 5        | 5        |
| monsters' speed scale | 1.0     | 1.1      | 1.2      |

| lv  | biome | monsters                | count | every (s) | super found       | pickup found         | slots |
| --- | ----- | ----------------------- | ----- | --------- | ----------------- | -------------------- | ----- |
| 1   | 1     | Bat                     | 7     | 3.1       | Lightning, Freeze | Star, Pumpkin, Heart | 2     |
| 2   | 1     | Jack                    | 8     | 3.1       | —                 | Candle               | 2     |
| 3   | 1     | Bat, Jack               | 9     | 3.0       | Shockwave         | —                    | 2     |
| 4   | 1     | Wisp                    | 10    | 2.9       | —                 | Potion               | 2     |
| 5   | 1     | Spider                  | 11    | 2.9       | Full moon         | —                    | 2     |
| 6   | 1     | Wisp, Spider            | 12    | 2.8       | —                 | —                    | 2     |
| 7   | 2     | Zombie                  | 13    | 2.7       | —                 | —                    | 2     |
| 8   | 2     | Skeleton                | 14    | 2.7       | Brew              | —                    | 2     |
| 9   | 2     | Zombie, Skeleton        | 15    | 2.6       | —                 | —                    | 2     |
| 10  | 2     | Ghost                   | 16    | 2.6       | Familiars         | —                    | 3     |
| 11  | 2     | Gravedigger             | 17    | 2.5       | —                 | —                    | 3     |
| 12  | 2     | Ghost, Gravedigger      | 18    | 2.4       | —                 | —                    | 3     |
| 13  | 3     | Slime                   | 19    | 2.4       | Fire rain         | Web                  | 3     |
| 14  | 3     | Mosquitoes              | 20    | 2.3       | —                 | —                    | 3     |
| 15  | 3     | Slime, Mosquitoes       | 21    | 2.2       | —                 | —                    | 3     |
| 16  | 3     | Toad Shaman             | 22    | 2.2       | Salt circle       | —                    | 3     |
| 17  | 3     | Slime, Toad Shaman      | 23    | 2.1       | —                 | —                    | 3     |
| 18  | 3     | Mosquitoes, Toad Shaman | 24    | 2.0       | —                 | —                    | 3     |
| 19  | 4     | Knight                  | 25    | 2.0       | Broom             | —                    | 3     |
| 20  | 4     | Gargoyle                | 26    | 1.9       | —                 | —                    | 4     |
| 21  | 4     | Knight, Gargoyle        | 27    | 1.8       | —                 | —                    | 4     |
| 22  | 4     | Vampire                 | 28    | 1.8       | Toadify           | —                    | 4     |
| 23  | 4     | Rats                    | 29    | 1.7       | —                 | —                    | 4     |
| 24  | 4     | Vampire, Rats           | 30    | 1.6       | —                 | —                    | 4     |
| 25  | 5     | Imp                     | 31    | 1.6       | Banish            | —                    | 4     |
| 26  | 5     | Salamander              | 32    | 1.5       | —                 | —                    | 4     |
| 27  | 5     | Imp, Salamander         | 33    | 1.4       | —                 | —                    | 4     |
| 28  | 5     | Dark Priest, Salamander | 34    | 1.4       | —                 | —                    | 4     |
| 29  | 5     | Dark Priest, Imp        | 35    | 1.3       | —                 | —                    | 4     |
| 30  | 5     | Dragon, Imp             | 36    | 1.2       | —                 | —                    | 4     |

`count` is `6 + level` and `every` is `max(1.2, 3.2 − 0.065 × level)`, the
prototype's `stageDef`. A swarm (Mosquitoes, Rats) counts each of its members.
On level 30 the Dragon comes first, after 3 s, and the Imps keep coming.

The prototype offered every pickup from level 1. The game staggers them (the
*pickup found* column), so each one is met on its own and named by
`Notify.learn`.

**The variants** (§5.1) are met on their own levels, then mixed in:

| lv  | met for the first time                                                   |
| --- | ------------------------------------------------------------------------ |
| 3   | babies: the Bats come in clutches of three, among the normal ones        |
| 6   | the first boss: a giant Spider ends the stage                            |
| 8   | rage: a Skeleton knocked out next to its kind enrages them               |
| 9   | a returning kind: forest Jacks in the graveyard's palette, among its own |
| 12  | a giant Gravedigger ends the stage                                       |
| 15  | returning kinds in the swamp's palette                                   |
| 18  | a giant Toad Shaman ends the stage                                       |
| 21  | returning kinds in the crypt's palette                                   |
| 24  | a giant Vampire ends the stage                                           |
| 27  | returning kinds in the throne's palette                                  |
| 30  | the Dragon, a boss by kind                                               |

Slowed, dizzy and tired come with what causes them (Freeze and the Web, the
strike, the shield), from level 1. A boss counts as one monster of `count`,
a baby clutch as three. From level 10 on, about one spawn in five of a
stage's own kinds is a baby clutch.

**After level 30**, the star above it starts the endless run: every monster of
every biome, the biome changing every 20 monsters knocked out, every kind in
the biome's palette, babies and a boss every 40 monsters, scored on its best
score.

**The bench.** A pilot that aims at the nearest threat with a 0.2 s reaction
and a 360°/s limit, launching whenever it can, cleared 25 of the 30 stages
with the supers and 20 without them (prototype, 2026-10-28). Re-bench in the
game with `Enter.skip()` before setting `count` and `every` for good: every
level should be cleared at one star by that pilot in most seeds.

______________________________________________________________________

## 7. The eleven supers

| key         | EN          | FR               | found on | cooldown | effect                                                                         |
| ----------- | ----------- | ---------------- | -------- | -------- | ------------------------------------------------------------------------------ |
| `lightning` | Lightning   | Foudre           | 1        | 10 s     | strikes the 3 monsters nearest the witch for 3, through every protection       |
| `freeze`    | Freeze      | Gel              | 1        | 15 s     | the whole world at 30 % speed for 5 s (the shield keeps full speed)            |
| `wave`      | Shockwave   | Onde de choc     | 3        | 15 s     | throws every monster back (1 damage) and digs the Gravediggers up              |
| `moon`      | Full moon   | Pleine lune      | 5        | 20 s     | the shield grows to 320° for 5 s                                               |
| `brew`      | Brew        | Chaudron         | 8        | 20 s     | six brown balls burst out of the shield                                        |
| `familiars` | Familiars   | Familiers        | 10       | 20 s     | three friendly bats circle the witch for 10 s and bite what they meet          |
| `meteor`    | Fire rain   | Pluie de feu     | 13       | 20 s     | six fireballs fall on the monsters, 2 damage around each                       |
| `salt`      | Salt circle | Cercle de sel    | 16       | 25 s     | nothing crosses a circle of 250 px for 5 s, spits included                     |
| `broom`     | Broom       | Balai            | 19       | 10 s     | the shield sweeps two full turns in 1 s                                        |
| `toad`      | Toadify     | Crapaudification | 22       | 30 s     | every monster but the Dragon is a harmless toad for 5 s: one hit knocks it out |
| `banish`    | Banish      | Bannissement     | 25       | 30 s     | the toughest monster vanishes (the Dragon takes 10)                            |

The supers' icons on the buttons are the painted cuts of §11. The witch's own
blue ball has its icon too, on the hub.

______________________________________________________________________

## 8. The guide and the notices

`Game.guide.chapters()`, every page illustrated: a monster, a super or a
pickup is its painted cut, and a rule is a small scene drawn by the round's
own renderer, its `ctx` lent for the call. A picture shows the rule before two
or three short lines tell it ([CLAUDE.md](../CLAUDE.md#the-guide)).

| chapter  | pages (id, level)                                                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Basics   | `shield` 1, `aim` (dial or mouse) 1, `ball` (launching, the frozen shield) 1, `brown` 1, `perfect` 1, `combo` 1, `throw` (the knockback) 1, `strike` 1, `stars` 1 |
| Monsters | the twenty, by key, on their first level (§5)                                                                                                                     |
| Variants | `baby` 3, `boss` 6, `enraged` 8, `palette` 9, `slowed` 1, `dizzy` 1, `tired` 1 (§5.1)                                                                             |
| Supers   | `supers` (the card and the slots) 1, then the eleven, by key, on their level (§7)                                                                                 |
| Pickups  | the seven, by key, on their level (§6)                                                                                                                            |
| Biomes   | `forest` 1, `graveyard` 7, `swamp` 13, `crypt` 19, `throne` 25, each page its scene                                                                               |

`Notify.learn` names each monster, super and pickup the first time the round
meets it, on its page id. The stage card already announces the stage's
monsters, so a monster's notice is short and only opens its page.

______________________________________________________________________

## 9. The words — where each one goes

| it is…                                        | where          | examples                                                        |
| --------------------------------------------- | -------------- | --------------------------------------------------------------- |
| the value a parry or a knockout pays          | `Pop.text`     | `+10` over the impact, `+60` over a Jack                        |
| a moment the player made                      | `Pop.show`     | `Perfect`, `Combo x3` (`combo`), `Strike`, a super's name       |
| a mistake as it happens, and its state        | `Pop.show`     | `Ouch` (`alert`), `Shield frozen` (`alert`)                     |
| an event the player did not make              | `Notify.say`   | `Shield jammed` (an imp, `warn`), `The dragon charges` (`warn`) |
| an input refused                              | `Notify.say`   | `Not ready` (a super on cooldown), `No ball left`               |
| a monster, super or pickup met the first time | `Notify.learn` | `Ghost`, sub `Balls pass through it when it fades`              |
| a variant met the first time                  | `Notify.learn` | `Babies`, `Giant`, `Enraged`, `Tired` (§5.1)                    |
| a boss arriving                               | `Notify.say`   | `A giant spider!` (`warn`)                                      |
| a mood the player caused, first of the stage  | `Pop.show`     | `Enraged` (`alert`), `Tired` (`score`)                          |
| a rule                                        | `Game.guide`   | every page of §8                                                |

Copy follows the `write-copy` skill, with vipera's guide as the reference, in
British English, and the French is adapted with `adapt-fr`, never calqued.

______________________________________________________________________

## 10. The meta layer, the village, the codex

### 10.1 The twenty stickers

Eleven common, five rare, two epic and two legendary, like the other games. A
sticker's name is a proper noun and is never translated. Twelve come off the
map (`awards`): biomes 1 to 5 passed, biomes 1 to 5 passed clean, all 30
cleared, ninety of ninety. One legendary (Golden Hat) stays out of `awards`,
so the machine can roll one.

| #   | name         | rarity    | how it is earned      |
| --- | ------------ | --------- | --------------------- |
| 1   | First Parry  | common    | machine               |
| 2   | Lucky Bounce | common    | machine               |
| 3   | Moonlit Bat  | common    | biome 1 passed        |
| 4   | Grumpy Grave | common    | biome 2 passed        |
| 5   | Swamp Bubble | common    | biome 3 passed        |
| 6   | Iron Visor   | common    | biome 4 passed        |
| 7   | Hot Horns    | common    | biome 5 passed        |
| 8   | Brown Ball   | common    | machine               |
| 9   | Jack's Grin  | common    | biome 1 passed clean  |
| 10  | Candle Tower | common    | machine               |
| 11  | Sticky Web   | common    | machine               |
| 12  | Bone Pile    | rare      | biome 2 passed clean  |
| 13  | Toad Kiss    | rare      | machine               |
| 14  | Salt Circle  | rare      | biome 3 passed clean  |
| 15  | Strike!      | rare      | biome 4 passed clean  |
| 16  | Full Moon    | rare      | biome 5 passed clean  |
| 17  | Perfect Arc  | epic      | machine               |
| 18  | Dragon Tamer | epic      | all 30 levels cleared |
| 19  | Golden Hat   | legendary | machine only          |
| 20  | Witch Queen  | legendary | ninety of ninety      |

`"awards": [3, 4, 5, 6, 7, 9, 12, 14, 15, 16, 18, 20]`.

### 10.2 The village

The village is the witch's own hamlet at night: a mossy clearing in a haunted
wood, lit by lanterns and the moon. `-background-home.png` lays six empty
round stone slabs on the ground as pads. The six houses of `-object-home.png`
(3x2) stand on them, composed in `make village`:

| house             | role         |
| ----------------- | ------------ |
| Cauldron Shop     | `shop`       |
| Broomstick Podium | `ranking`    |
| Crystal Ball      | `map`        |
| Spellbook Stand   | `collection` |
| Pumpkin Cart      | `daily`      |
| Bestiary Tower    | `cards`      |

OPTIONS stays the corner control. The bestiary (the codex, below) is worth a
building here: twenty monsters are what the player collects in this game.

### 10.3 The codex — the bestiary

`Game.codex`, three books: *Monsters* (the twenty, had once met in a round),
*Supers* (the eleven, had once found) and *Pickups* (the seven). `node(id)`
draws the card from the same painted cut the round uses. A monster's card
lists the sizes and palettes the player has met it in, and how many giants
of it were knocked out (§5.1). Its door is the village role `cards`.

______________________________________________________________________

## 11. The assets — the list and a prompt for each

**Nothing is done yet.** Every asset is below, one complete prompt each, to be
pasted alone. The artwork is the user's to generate: never draw a placeholder
for any of it. The original game's captures (`site/image/magic-shield-brick/`)
are the reference for the look. Join them to a prompt as a style image when
the image tool allows it.

**Two worlds, kept apart.** The intro, the map, the menus, the village and the
desktop bands are the witch's world at night (her moonlit wood), seen from the
front. The round is the biome's own scene, **seen from high above**, and so
are the witch and the monsters in it (§1.2): their sheets are frames, not
poses. Every round scene keeps a calm middle, where the witch stands and the
monsters fight.

| what                               | file (`assets/image/master/` unless said)                     | cut                                                 | roles (`CONFIG.art.…`)         | prompt    |
| ---------------------------------- | ------------------------------------------------------------- | --------------------------------------------------- | ------------------------------ | --------- |
| end screen character, three faces  | `parrynormal-character-{sad,neutral,happy}.png`               | —                                                   | `characterSad`, …              | 11.1–11.3 |
| the five round scenes              | `parrynormal-scene-{forest,graveyard,swamp,crypt,throne}.png` | — (scene profile, §3 step 11)                       | `sceneForest`, …               | 11.4–11.8 |
| intro, map and end screen backdrop | `parrynormal-background-phone.png`                            | —                                                   | `backgroundPhone`              | 11.9      |
| desktop bands                      | `parrynormal-background-desk.png`                             | —                                                   | `backgroundDesk`               | 11.10     |
| village hub                        | `parrynormal-background-home.png`                             | —                                                   | `backgroundHome`               | 11.11     |
| logotype                           | `parrynormal-title.png`                                       | —                                                   | `title`                        | 11.12     |
| the witch in the round, 5x5        | `parrynormal-object-witch.png`                                | `--grid 5x5`, fixed scale                           | `witch01`–`25`                 | 11.13     |
| the twenty monsters, 5x4           | `parrynormal-object-<key>.png`, one sheet each                | `--grid 5x4` (dragon `5x5`), fixed scale            | `bat01`–`20` … `dragon01`–`25` | 11.14     |
| toad, fireball, familiar, pile…    | `parrynormal-object-extra.png`                                | `--grid 4x2`, fixed scale                           | `extra01`–`08`                 | 11.15     |
| monster portraits, front, 5x4      | `parrynormal-object-monster.png`                              | `--grid 5x4`, 256 px box                            | `monster01`–`20`               | 11.16     |
| super icons, 4x3                   | `parrynormal-object-super.png`                                | `--grid 4x3`                                        | `super01`–`12`                 | 11.17     |
| pickups, 4x2                       | `parrynormal-object-pickup.png`                               | `--grid 4x2`                                        | `pickup01`–`08`                | 11.18     |
| village houses, 3x2                | `parrynormal-object-home.png`                                 | `--grid 3x2`                                        | `home01`–`06`                  | 11.19     |
| stickers, 5x4                      | `parrynormal-object-sticker.png`                              | `--grid 5x4 --solid 250 --pad 80 --margin 30 --seq` | `sticker01`–`20`               | 11.20     |
| menu decor objects, 4x2            | `parrynormal-object-decor.png`                                | `--grid 4x2 --as decor`                             | `decor01`–`08` (the pool)      | 11.21     |
| app icon                           | `assets/image/icon/parrynormal.png` (+ `thumb/`)              | —                                                   | the site card                  | 11.22     |
| music, one track in six sections   | `assets/audio/music/parrynormal.mp3`                          | `embed/` for the web, 30 s of it in the playable    | `web.music`, `ASSETS.sounds`   | 11.23     |

The shield, the balls, their trails, the dial, the hub, the buttons' rims and
cooldowns, the warning rings, the spits, the bolts and the blasts are drawn by
the game. **The sounds are not generated**: they are roles of the house kit
(§3 step 9).

### 11.1 End screen, sad face — `parrynormal-character-sad.png`

- [x] generated

```text
A character illustration for a casual mobile arcade game, the game's hero alone, centred, seen from the front, filling most of the picture: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose, rosy red blush on the cheeks, under a big floppy purple witch's hat with a curled, bent tip and a dark red band around it. She is a face under a hat: no body, no arms, no legs, no hands. Here she is sad and a little dizzy: her eyebrows tilted up in the middle, her eyes watery and looking down, a small wobbly frown, her hat knocked crooked and sagging over one eye, one small round tear on her cheek. Glossy, polished 3D-rendered cartoon style like a premium emoji: smooth shiny surfaces, soft specular highlights, warm rim light, rich saturated colours. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.2 End screen, neutral face — `parrynormal-character-neutral.png`

- [x] generated

```text
A character illustration for a casual mobile arcade game, the game's hero alone, centred, seen from the front, filling most of the picture: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose, rosy red blush on the cheeks, under a big floppy purple witch's hat with a curled, bent tip and a dark red band around it. She is a face under a hat: no body, no arms, no legs, no hands. Here she is calm and focused: a gentle, confident closed-mouth smile, her eyes looking slightly to the side as if watching for the next monster, one eyebrow a little raised, her hat straight. Glossy, polished 3D-rendered cartoon style like a premium emoji: smooth shiny surfaces, soft specular highlights, warm rim light, rich saturated colours. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.3 End screen, happy face — `parrynormal-character-happy.png`

- [x] generated

```text
A character illustration for a casual mobile arcade game, the game's hero alone, centred, seen from the front, filling most of the picture: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose, rosy red blush on the cheeks, under a big floppy purple witch's hat with a curled, bent tip and a dark red band around it. She is a face under a hat: no body, no arms, no legs, no hands. Here she is overjoyed: a wide open laughing smile, her eyes squeezed into happy curved arcs, her cheeks blushing brighter, her hat tilted back proudly with its tip springing up. Glossy, polished 3D-rendered cartoon style like a premium emoji: smooth shiny surfaces, soft specular highlights, warm rim light, rich saturated colours. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.4 Biome 1 scene, the haunted forest — `parrynormal-scene-forest.png`

- [x] generated

```text
A portrait 9:16 background illustration, 1080x1920, the play field of a casual mobile arcade game about a little witch defending herself against cartoon monsters, seen from high above at a steep angle, in the top-down three-quarter view of a classic top-down adventure game: the ground lies flat and fills the picture, and the things along the edges show their tops and a little of their fronts: a haunted forest clearing at night. The ground is a wide floor of big cracked flagstones in cool violet grey, with moss in the cracks and patches of soft violet grass, lit by pale, cool moonlight. The four edges are open, because the monsters walk in from every point of every edge: along the edges there are only low things a creature walks straight over, tufts of violet grass, low undergrowth, gnarled roots lying flat and scattered orange fallen leaves, and the very edge of the picture fades softly into the dark night, as if the clearing went on into the darkness. Nothing tall stands along an edge and nothing forms a line along one: no wall, no fence, no hedge, no row of trees or stones across an edge. Anything tall stands only in the corners, the two top corners and the two sides just above the bottom fifth: the twisted trunks of dark trees with their crooked branches reaching in, and in the two top corners a short broken piece of ornate iron fence on a stone pillar topped with a violet crystal, each piece ending well before the middle of the top edge. The whole middle of the picture, from about a tenth to four fifths of the height and across most of the width, is a calm, open clearing of plain ground with very little detail and gentle contrast, because the hero stands at its centre and the monsters walk across it from every side; the bottom fifth is plain ground with no detail, because the game's controls lie over it. No horizon and no sky: the ground fills the whole picture, and nothing marks the centre. Mid-dark night palette of deep purple, plum, night blue and violet grey; no pure black areas. No characters, no animals, no monsters, no faces, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a slightly spooky but cosy mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.5 Biome 2 scene, the graveyard — `parrynormal-scene-graveyard.png`

- [x] generated

```text
A portrait 9:16 background illustration, 1080x1920, the play field of a casual mobile arcade game about a little witch defending herself against cartoon monsters, seen from high above at a steep angle, in the top-down three-quarter view of a classic top-down adventure game: the ground lies flat and fills the picture, and the things along the edges show their tops and a little of their fronts: a cartoon graveyard at night. The ground is a wide floor of trodden earth and short dry grass, with thin patches of low mist lying flat on it. The four edges are open, because the monsters walk in from every point of every edge: along the edges there are only low things a creature walks straight over, short dry grass, low grassy grave mounds level with the ground, flat stone slabs and patches of mist, and the very edge of the picture fades softly into the dark night, as if the clearing went on into the darkness. Nothing tall stands along an edge and nothing forms a line along one: no wall, no fence, no hedge, no row of trees or stones across an edge. Anything tall stands only in the corners, the two top corners and the two sides just above the bottom fifth: a few rounded blank tombstones leaning at funny angles, gnarled bare trees, and in one top corner the slate roof of a small stone mausoleum. The whole middle of the picture, from about a tenth to four fifths of the height and across most of the width, is a calm, open clearing of plain ground with very little detail and gentle contrast, because the hero stands at its centre and the monsters walk across it from every side; the bottom fifth is plain ground with no detail, because the game's controls lie over it. No horizon and no sky: the ground fills the whole picture, and nothing marks the centre. Mid-dark night palette of slate blue, teal grey, mossy green and pale mist; no pure black areas. No characters, no animals, no monsters, no skeletons, no faces, no text, no letters, no numbers, no names on the tombstones. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a slightly spooky but cosy mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.6 Biome 3 scene, the witch's swamp — `parrynormal-scene-swamp.png`

- [ ] generated

```text
A portrait 9:16 background illustration, 1080x1920, the play field of a casual mobile arcade game about a little witch defending herself against cartoon monsters, seen from high above at a steep angle, in the top-down three-quarter view of a classic top-down adventure game: the ground lies flat and fills the picture, and the things along the edges show their tops and a little of their fronts: a witch's swamp at night. The ground is a wide floor of flat mossy bank and packed mud. The four edges are open, because the monsters walk in from every point of every edge: along the edges there are only low things a creature walks straight over, shallow puddles, flat mossy roots, low clumps of reeds and small pale teal mushroom caps, and the very edge of the picture fades softly into the dark night, as if the clearing went on into the darkness. Nothing tall stands along an edge and nothing forms a line along one: no wall, no fence, no hedge, no row of trees or stones across an edge. Anything tall stands only in the corners, the two top corners and the two sides just above the bottom fifth: dark green water with round lily pads in the two top corners, the drooping crowns of willows, and in one top corner a big black cauldron of bubbling green brew. The whole middle of the picture, from about a tenth to four fifths of the height and across most of the width, is a calm, open clearing of plain ground with very little detail and gentle contrast, because the hero stands at its centre and the monsters walk across it from every side; the bottom fifth is plain ground with no detail, because the game's controls lie over it. No horizon and no sky: the ground fills the whole picture, and nothing marks the centre. Mid-dark night palette of deep green, teal, murky olive and a touch of purple; no pure black areas. No characters, no animals, no frogs, no monsters, no faces, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a slightly spooky but cosy mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.7 Biome 4 scene, the castle crypt — `parrynormal-scene-crypt.png`

- [x] generated

```text
A portrait 9:16 background illustration, 1080x1920, the play field of a casual mobile arcade game about a little witch defending herself against cartoon monsters, seen from high above at a steep angle, in the top-down three-quarter view of a classic top-down adventure game: the ground lies flat and fills the picture, and the things along the edges show their tops and a little of their fronts: the great hall of a gothic castle crypt at night. The ground is a wide floor of large worn stone slabs in warm red-brown, with soft patches of red and violet light from stained glass lying on the floor. The four edges are open, because the monsters walk in from every point of every edge: along the edges there are only low things a creature walks straight over, cracked slabs, a few small fallen stones, worn edges of old rugs and short candle stubs, and the very edge of the picture fades softly into the dark night, as if the clearing went on into the darkness. Nothing tall stands along an edge and nothing forms a line along one: no wall, no fence, no hedge, no row of trees or stones across an edge. Anything tall stands only in the corners, the two top corners and the two sides just above the bottom fifth: the square tops of massive dark stone pillars, each with a tall iron candelabra of lit candles beside it. The whole middle of the picture, from about a tenth to four fifths of the height and across most of the width, is a calm, open clearing of plain ground with very little detail and gentle contrast, because the hero stands at its centre and the monsters walk across it from every side; the bottom fifth is plain ground with no detail, because the game's controls lie over it. No horizon and no sky: the ground fills the whole picture, and nothing marks the centre. Mid-dark palette of deep crimson, burgundy, warm brown stone and candle amber; no pure black areas. No characters, no animals, no bats, no monsters, no statues, no faces, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a slightly spooky but cosy mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.8 Biome 5 scene, the dragon's throne — `parrynormal-scene-throne.png`

- [x] generated

```text
A portrait 9:16 background illustration, 1080x1920, the play field of a casual mobile arcade game about a little witch defending herself against cartoon monsters, seen from high above at a steep angle, in the top-down three-quarter view of a classic top-down adventure game: the ground lies flat and fills the picture, and the things along the edges show their tops and a little of their fronts: a dragon king's throne room. The ground is a wide floor of large cracked red-brown flagstones. The four edges are open, because the monsters walk in from every point of every edge: along the edges there are only low things a creature walks straight over, thin cracks of bright orange lava running flat in the floor, scattered small stones and a few gold coins, and the very edge of the picture fades softly into the dark night, as if the clearing went on into the darkness. Nothing tall stands along an edge and nothing forms a line along one: no wall, no fence, no hedge, no row of trees or stones across an edge. Anything tall stands only in the corners, the two top corners and the two sides just above the bottom fifth: in the top left corner a tall red velvet throne with a high carved back, turned toward the middle, and big stone dragon statues with folded wings in the other corners. The whole middle of the picture, from about a tenth to four fifths of the height and across most of the width, is a calm, open clearing of plain ground with very little detail and gentle contrast, because the hero stands at its centre and the monsters walk across it from every side; the bottom fifth is plain ground with no detail, because the game's controls lie over it. No horizon and no sky: the ground fills the whole picture, and nothing marks the centre. Mid-dark palette of deep red, crimson, warm black-brown and lava orange; no pure black areas. No characters, no living animals, no monsters, no faces, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a slightly spooky but cosy mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.9 Intro, map and end screen backdrop — `parrynormal-background-phone.png`

- [x] generated

```text
A portrait 9:16 background illustration, 1080x1920, for a casual mobile arcade game about a little witch defending herself against cartoon monsters: the witch's moonlit wood at night. A huge full moon low in a deep purple sky, the silhouettes of crooked trees framing the two side edges, a small crooked witch's cottage with a round glowing window on a hill in the far distance, a winding path of flat stones through soft violet grass along the bottom, a few carved pumpkins lit from inside along the path. The middle of the picture is calm and uncluttered, with soft, low-contrast shapes, because a character, a map and text are laid over it; the detail sits along the bottom and the far edges. Mid-dark night palette of deep purple, plum, night blue and warm pumpkin orange; no pure black areas. No characters, no monsters, no faces on the pumpkins other than simple carved triangles, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a cosy, magical Halloween mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.10 Desktop bands — `parrynormal-background-desk.png`

- [x] generated

```text
A wide 16:9 background illustration, 1920x1080, for a casual mobile arcade game about a little witch defending herself against cartoon monsters, shown on a desktop around a phone-shaped frame standing in the middle: the witch's moonlit wood at night. A huge full moon low in a deep purple sky, crooked trees and a small crooked witch's cottage with a round glowing window on the left, carved pumpkins lit from inside and a winding path of flat stones through soft violet grass on the right. The central third of the picture is empty and calm, plain sky and soft grass, because the game frame covers it; the trees, the cottage and the pumpkins sit on the left and right thirds. Mid-dark night palette of deep purple, plum, night blue and warm pumpkin orange; no pure black areas. No characters, no monsters, no faces on the pumpkins other than simple carved triangles, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a cosy, magical Halloween mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.11 Village hub — `parrynormal-background-home.png`

- [x] generated

```text
A portrait 9:16 background illustration, 1080x1920, the home village of a casual mobile arcade game about a little witch, seen from a slightly high three-quarter view: a mossy clearing in a haunted wood at night, the witch's own little hamlet. Soft violet grass with winding paths of flat stones between patches of moss, crooked trees around the edges, a small pond reflecting a full moon at the top of the picture, a few lanterns on crooked posts and carved pumpkins lit from inside along the paths. On the ground there are six empty round flat stone slabs, clearly visible and spread over the picture so that a building can stand on each one later: two in the upper middle, two in the middle, two in the lower part, none of them closer than a slab's width to another and none touching the edges. The slabs are empty: no buildings, no houses, no objects on them. No characters, no monsters, no faces on the pumpkins other than simple carved triangles, no text, no letters, no numbers. Mid-dark night palette of deep purple, plum, moss green, night blue and warm lantern orange; no pure black areas. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a cosy, magical Halloween mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.12 Logotype — `parrynormal-title.png`

- [x] generated

```text
A game logotype reading exactly "PARRYNORMAL", one word, in big chunky rounded letters: each letter a glossy shape in bright orange-yellow with a lighter top face and white specular highlights, a thick dark purple outline and a deep purple bevel at the bottom so the word reads on any background. A small floppy purple witch's hat with a curled tip and a dark red band sits tilted on the first letter "P". The letter "O" is a glossy cyan ring with a gap in it, like an arc of magic shield. The letters sit on one slightly arched line and bounce a little up and down, all at the same size. Correct spelling, every letter clearly readable, no other text. Glossy, polished 3D-rendered cartoon style for a casual mobile arcade game, rich saturated colours, clean edges. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.13 The witch in the round, 5x5 — `parrynormal-object-witch.png`

- [x] generated

```text
A sprite sheet of twenty-five animation frames of one game hero for a casual mobile arcade game, the whole sheet a square picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at her from high above at a steep angle, so the top of her hat and a little of her face are both visible. Arranged in a strict grid of 5 columns and 5 rows, each frame centred in its own square cell with wide empty space between the cells, the hero at exactly the same size and scale in every frame, at the same height in her cell, never crossing into the next cell. She stands in place and turns on the spot to face where she is looking, so the columns show her turning round, step by step. Each column is one direction she faces, the same in every row, left to right: column 1 facing the viewer, her whole face to the viewer; column 2 turned a quarter to the right, diagonally down and to the right, her face three-quarters to the viewer; column 3 turned to the right, seen in profile, facing right, one eye and the curve of her cheek showing; column 4 turned further, diagonally up and to the right, seen three-quarters from behind, only the edge of her cheek showing; column 5 facing away from the viewer, seen from behind, only the back of her head and her hat visible. The diagonal and profile columns always face right, never left. In every column the curled, bent tip of her hat flops backward, away from where she faces, so the way she faces reads from the hat alone. Each row is one moment, the same in every column, top to bottom: row 1 ready, breathing in: a gentle closed-mouth smile, her face a little taller, the hat tip swaying to one side; row 2 ready, breathing out: the same smile, her face a little rounder, the hat tip swaying to the other side; row 3 launching a magic ball: leaning forward toward where she faces, a determined little grin, the hat tip flung back; row 4 hurt: leaning back, her eyes squeezed shut, a small wavy frown, her hat knocked crooked; row 5 cheering: bouncing up, a wide open smile, her eyes in happy arcs, the hat tip springing up. The hero: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose and rosy red blush on the cheeks, under a big floppy purple witch's hat with a wide round brim, a curled, bent tip and a dark red band around it. She is a face under a hat: no body, no arms, no legs, no hands. Every frame shows the same hero with the same colours, proportions and details; only the direction and the expression change. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Glossy, polished 3D-rendered cartoon style like a premium emoji: smooth shiny surfaces, soft specular highlights, rich saturated colours, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

Columns are the directions, rows the moments (§1.2): `witch01`–`10` ready, two
frames breathing in and out (looped), `witch11`–`15` the launch, `witch16`–`20`
hurt (a heart lost, the shield frozen), `witch21`–`25` cheering (the stage
cleared). She faces the middle of the shield: the nearest of the eight
directions, the right-facing columns mirrored for the left, and a turn steps
through the directions in between, one at a time, the short way round, so she
turns on the spot rather than flips.

### 11.14 The twenty monsters in the round, 5x4

One sheet per monster, every one on the same grid (§1.2): the five columns are
the directions, the four rows the moments (two steps, the attack, the hurt). Cut
each with `--grid 5x4` (the Dragon `5x5`, its charge on row 4) and adopt every
cell: the cell is the frame. A role reads row by row, `bat01`–`05` the first
step from front to back, `bat06`–`10` the second, `bat11`–`15` the attack,
`bat16`–`20` the hurt.

| key          | sheet                                    | roles                         | the attack frame               |
| ------------ | ---------------------------------------- | ----------------------------- | ------------------------------ |
| `bat`        | `parrynormal-object-bat.png`             | `bat01`–`bat20`               | a bite                         |
| `jack`       | `parrynormal-object-jack.png`            | `jack01`–`jack20`             | a headbutt                     |
| `wisp`       | `parrynormal-object-wisp.png`            | `wisp01`–`wisp20`             | a dash                         |
| `spider`     | `parrynormal-object-spider.png`          | `spider01`–`spider20`         | a leap                         |
| `zombie`     | `parrynormal-object-zombie.png`          | `zombie01`–`zombie20`         | a big clumsy hug               |
| `skeleton`   | `parrynormal-object-skeleton.png`        | `skeleton01`–`skeleton20`     | a bony slap                    |
| `ghost`      | `parrynormal-object-ghost.png`           | `ghost01`–`ghost20`           | a boo                          |
| `mole`       | `parrynormal-object-mole.png`            | `mole01`–`mole20`             | digging                        |
| `slime`      | `parrynormal-object-slime.png`           | `slime01`–`slime20`           | a bounce                       |
| `frog`       | `parrynormal-object-frog.png`            | `frog01`–`frog20`             | its tongue                     |
| `mosquito`   | `parrynormal-object-mosquito.png`        | `mosquito01`–`mosquito20`     | a sting                        |
| `shaman`     | `parrynormal-object-shaman.png`          | `shaman01`–`shaman20`         | a spit                         |
| `knight`     | `parrynormal-object-knight.png`          | `knight01`–`knight20`         | a shield bash                  |
| `gargoyle`   | `parrynormal-object-gargoyle.png`        | `gargoyle01`–`gargoyle20`     | a pounce                       |
| `vampire`    | `parrynormal-object-vampire.png`         | `vampire01`–`vampire20`       | a pounce                       |
| `rat`        | `parrynormal-object-rat.png`             | `rat01`–`rat20`               | a nibble                       |
| `imp`        | `parrynormal-object-imp.png`             | `imp01`–`imp20`               | lifting its bomb over its head |
| `salamander` | `parrynormal-object-salamander.png`      | `salamander01`–`salamander20` | a snap                         |
| `priest`     | `parrynormal-object-priest.png`          | `priest01`–`priest20`         | a healing spell                |
| `dragon`     | `parrynormal-object-dragon.png`, **5x5** | `dragon01`–`dragon25`         | fire breath; row 4 the charge  |

#### 11.14.1 Bat — `parrynormal-object-bat.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 flying toward the viewer, down the screen, its face to the viewer; column 2 flying diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 flying to the right, seen in profile, facing right; column 4 flying diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 flying away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 flying, first step: its wings raised high and spread wide; row 2 flying, second step: its wings swept down, folded close to its round body; row 3 attacking: a bite, leaning forward, its mouth wide open showing its two little fangs; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a small round purple bat with big pointed ears, little red eyes and a tiny smile showing two small white fangs, two wide wings. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.2 Jack — `parrynormal-object-jack.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 walking toward the viewer, down the screen, its face to the viewer; column 2 walking diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 walking to the right, seen in profile, facing right; column 4 walking diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 walking away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 walking, first step: its left vine foot stepping forward, the pumpkin tilting a little; row 2 walking, second step: its right vine foot stepping forward, the pumpkin tilting the other way; row 3 attacking: a headbutt, lunging forward, its carved grin opened wide; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a walking carved pumpkin head, round and bright orange with deep ribs, a short curly green stem on top and a mischievous carved grin with triangle eyes, on two short stubby green vine legs. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.3 Wisp — `parrynormal-object-wisp.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 floating toward the viewer, down the screen, its face to the viewer; column 2 floating diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 floating to the right, seen in profile, facing right; column 4 floating diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 floating away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 floating, first step: round, its flame tips curling up; row 2 floating, second step: a little stretched, its flame tips trailing back; row 3 attacking: a dash, stretched long into a teardrop shooting forward, its eyes wide; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a will-o'-the-wisp, a round little flame of pale blue fire with two big round eyes and a small surprised mouth, the wavy tips of its flame trailing behind it. The flame is the creature's own body and stays inside its outline. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.4 Spider — `parrynormal-object-spider.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 scuttling toward the viewer, down the screen, its face to the viewer; column 2 scuttling diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 scuttling to the right, seen in profile, facing right; column 4 scuttling diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 scuttling away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 scuttling, first step: the four legs of one side reaching forward; row 2 scuttling, second step: the four legs of the other side reaching forward; row 3 attacking: a leap, springing forward off the ground, all eight legs spread wide; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a fat round dark purple spider with eight short bent legs, four little shiny red eyes in a row, a tiny smile and a lighter purple pattern on its round back. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.5 Zombie — `parrynormal-object-zombie.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 walking toward the viewer, down the screen, its face to the viewer; column 2 walking diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 walking to the right, seen in profile, facing right; column 4 walking diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 walking away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 walking, first step: its left foot forward, its arms swaying; row 2 walking, second step: its right foot forward, its arms swaying the other way; row 3 attacking: a big clumsy hug, its arms reaching forward to grab, its hands open; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a chubby green cartoon zombie with droopy sleepy eyes, a messy tuft of brown hair, a torn light blue shirt and patched brown trousers, its two arms held straight out in front of it, its two hands open. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.6 Skeleton — `parrynormal-object-skeleton.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 walking toward the viewer, down the screen, its face to the viewer; column 2 walking diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 walking to the right, seen in profile, facing right; column 4 walking diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 walking away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 walking, first step: its left foot and right arm forward; row 2 walking, second step: its right foot and left arm forward; row 3 attacking: a bony slap, one arm swinging forward, its grin wide; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a goofy cartoon skeleton made of clean white toy-like bones, with a big round skull, a wide toothy grin and two big round dark eye holes with small white pupils. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.7 Ghost — `parrynormal-object-ghost.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 floating toward the viewer, down the screen, its face to the viewer; column 2 floating diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 floating to the right, seen in profile, facing right; column 4 floating diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 floating away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 floating, first step: its hem fluttering one way; row 2 floating, second step: its hem fluttering the other way; row 3 attacking: a boo, its arms raised high and its mouth opened wide; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a round white sheet ghost, puffy like a little dome, with a wavy hem, two small stubby arms, big round black eyes and a surprised open mouth. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.8 Gravedigger — `parrynormal-object-mole.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 walking toward the viewer, down the screen, its face to the viewer; column 2 walking diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 walking to the right, seen in profile, facing right; column 4 walking diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 walking away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 walking, first step: its left foot forward, the shovel on its shoulder; row 2 walking, second step: its right foot forward, the shovel on its shoulder; row 3 attacking: digging, driving its shovel into the ground in front of it; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a brown mole gravedigger with soft velvety fur, a pink nose, small round eyes, a tiny yellow miner's cap with an unlit lamp, and big pink digging paws holding a small wooden shovel. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.9 Slime — `parrynormal-object-slime.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 crawling toward the viewer, down the screen, its face to the viewer; column 2 crawling diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 crawling to the right, seen in profile, facing right; column 4 crawling diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 crawling away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 crawling, first step: stretched long in the direction it moves; row 2 crawling, second step: squashed short and wide; row 3 attacking: a bounce, leaping forward, its silly smile wide open; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a round teal slime blob, glossy and a little see-through, with a shiny drop on top, two big round eyes and a silly wide smile. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.10 Bullfrog — `parrynormal-object-frog.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 hopping toward the viewer, down the screen, its face to the viewer; column 2 hopping diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 hopping to the right, seen in profile, facing right; column 4 hopping diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 hopping away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 hopping, first step: crouched, its legs folded under it; row 2 hopping, second step: in mid-leap, its body stretched long, its hind legs trailing; row 3 attacking: its tongue, its mouth open and a short pink tongue shooting forward, staying inside the cell; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a big green bullfrog with a pale yellow belly, two bulging eyes on the top of its head, a wide happy mouth, little webbed hands and strong hind legs. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.11 Mosquitoes — `parrynormal-object-mosquito.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 flying toward the viewer, down the screen, its face to the viewer; column 2 flying diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 flying to the right, seen in profile, facing right; column 4 flying diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 flying away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 flying, first step: its wings raised; row 2 flying, second step: its wings swept down; row 3 attacking: a sting, diving forward, its long nose pointed ahead; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a tiny round grey mosquito with two see-through wings, six thin legs, big round red eyes and a long thin nose. One single mosquito: the game draws the swarm. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.12 Toad Shaman — `parrynormal-object-shaman.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 walking toward the viewer, down the screen, its face to the viewer; column 2 walking diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 walking to the right, seen in profile, facing right; column 4 walking diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 walking away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 walking, first step: its left foot forward, the staff swinging; row 2 walking, second step: its right foot forward, the staff swinging back; row 3 attacking: a spit, leaning forward, its cheeks puffed and its mouth wide open. The spit is drawn by the game: nothing comes out of its mouth; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a plump olive toad shaman with a pale belly, a feathered purple headband, wide sleepy eyes and a wide mouth, holding a wooden staff topped with a round pink stone in one hand. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.13 Knight — `parrynormal-object-knight.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 marching toward the viewer, down the screen, its face to the viewer; column 2 marching diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 marching to the right, seen in profile, facing right; column 4 marching diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 marching away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 marching, first step: its left foot forward; row 2 marching, second step: its right foot forward; row 3 attacking: a shield bash, shoving forward behind its round shield; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a small, chunky knight in a full suit of shiny grey armour, with round shoulder plates, a closed rounded helmet with a narrow dark visor slit, a bright red plume on top and a small round wooden shield on one arm. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.14 Gargoyle — `parrynormal-object-gargoyle.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 hopping toward the viewer, down the screen, its face to the viewer; column 2 hopping diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 hopping to the right, seen in profile, facing right; column 4 hopping diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 hopping away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 hopping, first step: crouched, its wings half open; row 2 hopping, second step: hopping forward, its wings spread wide; row 3 attacking: a pounce, leaping forward, its little claws out; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a grey stone gargoyle with a round body, small bat wings, two short horns, big yellow eyes, a cheeky grin and little clawed hands and feet. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.15 Vampire — `parrynormal-object-vampire.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 gliding toward the viewer, down the screen, its face to the viewer; column 2 gliding diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 gliding to the right, seen in profile, facing right; column 4 gliding diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 gliding away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 gliding, first step: its cape swinging one way; row 2 gliding, second step: its cape swinging the other way; row 3 attacking: a pounce, its cape spread wide like wings, its fangs showing; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a little cartoon vampire with a pale round face, slicked black hair with a widow's peak, two small white fangs, a mischievous grin and a big black cape lined with red. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.16 Rats — `parrynormal-object-rat.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 scurrying toward the viewer, down the screen, its face to the viewer; column 2 scurrying diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 scurrying to the right, seen in profile, facing right; column 4 scurrying diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 scurrying away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 scurrying, first step: one front paw and the opposite back paw forward, its tail curving one way; row 2 scurrying, second step: the other two paws forward, its tail curving the other way; row 3 attacking: a nibble, sniffing forward, its two big front teeth showing; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a plump grey rat with big round pink ears, big shiny eyes, a pink nose with whiskers, small pink paws and a long pink tail. One single rat: the game draws the pack. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.17 Imp — `parrynormal-object-imp.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 running toward the viewer, down the screen, its face to the viewer; column 2 running diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 running to the right, seen in profile, facing right; column 4 running diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 running away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 running, first step: its left foot forward, hugging its bomb; row 2 running, second step: its right foot forward, hugging its bomb; row 3 attacking: lifting its bomb over its head, the fuse lit with a small orange spark at its tip. The spark is part of the fuse and stays inside the bomb's outline; the blast is drawn by the game; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a little red imp with two small horns, a pointed tail, big yellow eyes and a mischievous grin, hugging a round black cartoon bomb with a short fuse. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.18 Salamander — `parrynormal-object-salamander.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 crawling toward the viewer, down the screen, its face to the viewer; column 2 crawling diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 crawling to the right, seen in profile, facing right; column 4 crawling diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 crawling away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 crawling, first step: its body curved in an S one way; row 2 crawling, second step: its body curved in an S the other way; row 3 attacking: a snap, lunging forward, its mouth open; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: an orange salamander with bright yellow spots, four short legs, a long curling tail, two big round eyes on the top of its head and a happy smile. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.19 Dark Priest — `parrynormal-object-priest.png`

- [x] generated

```text
A sprite sheet of twenty animation frames of one small cartoon Halloween monster for a casual mobile arcade game, the whole sheet a 5:4 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 4 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 gliding toward the viewer, down the screen, its face to the viewer; column 2 gliding diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 gliding to the right, seen in profile, facing right; column 4 gliding diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 gliding away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 gliding, first step: its robe swaying one way; row 2 gliding, second step: its robe swaying the other way; row 3 attacking: a healing spell, holding its staff high with both hands. The healing magic is drawn by the game: nothing comes out of the staff; row 4 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a dark priest in a long purple robe and a tall pointed purple hood, with only two big bright green eyes showing in the shadow of the hood, and two small hands holding a crooked wooden staff topped with a round green crystal. Every frame shows the same monster with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

#### 11.14.20 Dragon, 5x5 — `parrynormal-object-dragon.png`

- [x] generated

```text
A sprite sheet of twenty-five animation frames of one big cartoon boss monster for a casual mobile arcade game, the whole sheet a square picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at it from high above at a steep angle, so its top and a little of its front are both visible. Arranged in a strict grid of 5 columns and 5 rows, each frame centred in its own square cell with wide empty space between the cells, the subject at exactly the same size and scale in every frame, its feet at the same height in its cell, never crossing into the next cell. Each column is one direction, the same in every row, left to right: column 1 walking toward the viewer, down the screen, its face to the viewer; column 2 walking diagonally down and to the right, its face three-quarters to the viewer and turned to the right; column 3 walking to the right, seen in profile, facing right; column 4 walking diagonally up and to the right, seen three-quarters from behind and turned to the right, its face hidden; column 5 walking away from the viewer, up the screen, seen from behind, its face hidden. The diagonal and profile columns always face right, never left. Each row is one moment, the same in every column, top to bottom: row 1 walking, first step: its left foot forward, stomping; row 2 walking, second step: its right foot forward, stomping; row 3 breathing fire: its mouth wide open, leaning back. The fireballs are drawn by the game: nothing comes out of its mouth; row 4 charging: its head lowered, its horns pointing forward, running hard; row 5 hurt: flinching back, its eyes squeezed shut, a little squashed. The monster: a big round red dragon, chubby and grumpy, with two cream horns, a cream belly, small orange-red wings, four short legs, a thick tail, big yellow eyes and a grumpy frown. Every frame shows the same dragon with the same colours, proportions and details; only the direction and the pose change. Cute and funny rather than scary, with big expressive eyes. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.15 Toad, fireball, familiar, pile and mound, 4x2 —

`parrynormal-object-extra.png`

- [ ] generated

```text
A sprite sheet of eight small game sprites for a casual mobile arcade game about a little witch fighting cute cartoon Halloween monsters, the whole sheet a 2:1 picture, drawn in the high top-down three-quarter view of a classic top-down adventure game: the camera looks down at them from high above at a steep angle, so their tops and a little of their fronts are both visible. Arranged in a strict grid of 4 columns and 2 rows, each sprite centred in its own square cell with wide empty space between the cells, all at the same scale, never crossing into the next cell. Row 1, left to right: a cute small green toad sitting, facing the viewer, its two big round eyes on the top of its head and a sheepish smile; the same toad in mid-hop toward the viewer, its legs stretched; a round cartoon fireball of orange and yellow flame flying to the right, its short flame tail trailing behind it to the left; the same fireball, its tail curling a little the other way. The flame is the fireball's own body and stays inside its outline. Row 2, left to right: a small friendly lilac bat facing the viewer, with a happy smile, big kind eyes and a tiny purple witch's hat, its wings raised high; the same bat, its wings swept down; a small neat heap of clean white toy-like cartoon bones with a round skull resting on top, its eyes drawn as two dizzy spirals; a round mound of fresh brown dirt with a few pebbles, as if something were digging underneath. No other characters, no text, no letters, no numbers. Soft, even light from above, no cast shadow and no shadow on the ground, because the game draws the shadow itself. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

`extra01`–`02` a toadified monster (Toadify), `extra03`–`04` the Dragon's
fireball, the one sprite the game rotates to its heading, `extra05`–`06` a
familiar circling the witch (Familiars), `extra07` the Skeleton's pile,
`extra08` the Gravedigger underground.

### 11.16 Monster portraits, front view, 5x4 — `parrynormal-object-monster.png`

- [x] generated

```text
A sprite sheet of twenty small cartoon Halloween monsters for a casual mobile arcade game, arranged in a strict grid of 5 columns and 4 rows, each monster centred in its own cell with wide empty space between the cells, all drawn at about the same size so each fills most of its cell, all seen from the front, facing the viewer, soft light from the top left. They are cute and funny rather than scary, with big expressive eyes. Row 1, left to right: a small round purple bat with wide-open wings and little red eyes; a walking carved pumpkin head with a mischievous grin and a short green stem; a will-o'-the-wisp, a round little flame of pale blue fire with two big eyes; a fat round dark purple spider with eight short legs and four little red eyes; a chubby green cartoon zombie with droopy eyes and its arms held out in front. Row 2, left to right: a goofy cartoon skeleton with a big round skull and a toothy grin; a round white sheet ghost with a wavy hem and a surprised open mouth; a brown mole gravedigger wearing a tiny miner's cap and holding a small shovel; a round teal slime blob with a shiny drop on top and a silly smile; a big green bullfrog crouched to jump, with bulging eyes. Row 3, left to right: a tiny grey mosquito with see-through wings and a long thin nose; a plump olive toad shaman wearing a feathered purple headband and holding a wooden staff topped with a pink stone; a small knight in a full grey suit of armour with a closed helmet, a narrow dark visor slit and a red plume; a grey stone gargoyle with small bat wings, two short horns and yellow eyes; a cartoon vampire with a pale round face, slicked black hair, two small white fangs and a black cape lined with red. Row 4, left to right: a grey rat with round pink ears and a long pink tail; a little red imp with two small horns and a pointed tail, hugging a round black cartoon bomb with a short fuse; an orange salamander with yellow spots and a curled tail; a dark priest in a tall pointed purple hood with only two green eyes showing in the shadow of the hood; a big round red dragon with small folded wings, two cream horns, a cream belly and a grumpy frown. Each monster appears once. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

The order of the cells is the order of §5 (`bat` = `monster01` … `dragon` =
`monster20`). These are the monsters' PORTRAITS, never drawn in the round:
the stage card, the guide's pages and the bestiary show them, so they are
web-only.

### 11.17 Super icons, 4x3 — `parrynormal-object-super.png`

- [] generated

```text
A sprite sheet of twelve magic power-up objects for a casual mobile arcade game about a little witch, arranged in a strict grid of 4 columns and 3 rows, each object centred in its own cell with wide empty space between the cells, all at the same scale, the same three-quarter front view, soft light from the top left, each one big and simple enough to read on a small round button. Row 1, left to right: a bright blue-white lightning bolt; an icy blue snowflake crystal; a golden ring of rippling magic like a wave rolling outward, drawn as two thick concentric rings; a round full moon in pale green with a soft crater pattern. Row 2, left to right: a small black witch's cauldron overflowing with round brown bubbles; three small friendly purple bats flying in a circle; a round orange fireball falling at an angle with a short flame tail; a ring of white salt grains on the ground forming a circle. Row 3, left to right: a witch's broomstick with a brown handle and golden straw bristles; a cute green toad with a tiny crown; a glowing pink-magenta five-pointed magic seal with a dark hole in its centre; a round glossy blue magic ball like a marble with a white highlight. The flame, the wave and the magic are part of each object and stay inside its own outline. No characters other than the bats and the toad, no faces on the objects, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

`super01`–`super11` are the supers in the order of §7. `super12` is the blue
ball, the hub's icon.

### 11.18 Pickups, 4x2 — `parrynormal-object-pickup.png`

- [x] generated

```text
A sprite sheet of eight small magic items for a casual mobile arcade game about a little witch, arranged in a strict grid of 4 columns and 2 rows, each item centred in its own cell with wide empty space between the cells, all at the same scale, the same three-quarter front view, soft light from the top left, each one simple enough to read at a small size. Row 1, left to right: a plump bright green five-pointed star with rounded points; a round orange carved pumpkin with a lit fuse coming out of its stem, like a cartoon bomb; a fat white wax candle on a little brass holder with a warm orange flame; a rounded grey stone tombstone with a cross carved on its face and a little moss at its foot. Row 2, left to right: a round white spider web stretched across a small twig frame; a round glass potion bottle full of bubbling turquoise liquid with a cork; a glossy red heart with a white highlight; a small friendly purple bat with its wings spread and a happy face. The flame is part of the candle and the fuse's spark is part of the pumpkin, inside their own outlines. No other characters, no text, no letters, no numbers, no words on the tombstone. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

`pickup01`–`pickup07` are the pickups in the order of §2.4. `pickup08`, the
friendly bat, is the Familiars' picture in the guide and the bestiary; in the
round the familiars fly on their sprites of §11.15.

### 11.19 Village houses, 3x2 — `parrynormal-object-home.png`

- [ ] generated

```text
A sprite sheet of six small cartoon buildings for the home village of a casual mobile arcade game about a little witch, a village set in a haunted wood at night, arranged in a strict grid of 3 columns and 2 rows, each building centred in its own cell with wide empty space between the cells, all at the same scale, all seen from the same slightly high three-quarter front view, soft light from the top left, each one standing on its own flat base. Row 1, left to right: a cauldron shop, a little crooked wooden stall built around a big black bubbling cauldron, with a striped purple and orange awning; a broomstick podium, a three-step stone podium with a golden broomstick trophy standing on the top step; a crystal ball, a big glowing violet crystal ball on a carved wooden stand, with a winding road map visible inside the glass. Row 2, left to right: a spellbook stand, a giant open spellbook on a lectern with sticker sheets tucked between its pages; a pumpkin cart, a small wooden cart full of carved pumpkins and wrapped gift boxes with ribbons; a bestiary tower, a narrow crooked stone tower with a pointed purple roof and a round window, with a big leather-bound book hanging as its sign. No characters, no faces other than simple carved triangles on the pumpkins, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, a cosy, magical Halloween mood. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.20 Stickers, 5x4 — `parrynormal-object-sticker.png`

- [x] generated

```text
A sheet of twenty collectible sticker illustrations for a casual mobile arcade game about a little witch fighting cute cartoon Halloween monsters, arranged in a strict grid of 5 columns and 4 rows, each illustration centred in its own cell with wide empty space between the cells, all at the same scale and the same front view, soft light from the top left. The game's hero appears in some of them: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose, rosy red blush on the cheeks, under a big floppy purple witch's hat with a curled, bent tip and a dark red band; she is a face under a hat, with no body, no arms, no legs and no hands. Row 1, left to right: a cyan arc of magic shield bouncing a small orange ball away; the hero winking, with a small orange ball bouncing off her hat; a small purple bat hanging upside down in front of a full moon; a rounded grey tombstone with a grumpy carved face; a big green bubble rising out of swamp water. Row 2, left to right: a grey knight's helmet with a closed visor and a red plume; two small red devil horns on a little red imp's head peeking up; a round glossy brown ball with a white highlight; a carved pumpkin with a big toothy grin; a white wax candle on a brass holder with an orange flame. Row 3, left to right: a round white spider web with a tiny cute spider in its centre; a small heap of white bones with a dizzy skull on top; a cute green toad blowing a kiss, with a little heart floating from its lips; a ring of white salt on dark ground; a bowling-style scene of three cartoon monsters, a bat, a pumpkin and a slime, tumbling over each other. Row 4, left to right: a round full moon with a gentle smiling face; a perfect cyan arc of shield shaped like a crescent; the hero sitting proudly on the head of a big round red dragon who looks happy and tame; a golden witch's hat with a curled tip and a red band; the hero wearing a golden crown on top of her purple witch's hat and a small purple cape, proud. Each illustration is a die-cut vinyl sticker: a thick, even, pure white border runs all around its outline, the same width on every sticker, with a very soft grey edge on the outside of the white so it reads on a white page, and nothing else behind it; the stickers never touch each other. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

The order of the cells is the order of §10.1.

### 11.21 Menu decor objects, 4x2 — `parrynormal-object-decor.png`

- [x] generated

```text
A sprite sheet of eight small Halloween objects for the menus of a casual mobile arcade game about a little witch, arranged in a strict grid of 4 columns and 2 rows, each object centred in its own cell with wide empty space between the cells, all at the same scale, the same three-quarter front view, soft light from the top left. Row 1, left to right: a round orange pumpkin with a short curly green stem, not carved; a witch's broomstick lying at an angle; a small black cauldron with a little green brew inside; a round potion bottle with purple liquid and a cork. Row 2, left to right: an old leather spellbook, closed, with a brass clasp; a small iron lantern with a warm orange candle light inside; a wrapped candy in orange and purple twisted paper; a small round crystal ball on a little brass stand. No characters, no faces, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, a cosy, magical Halloween mood. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.22 App icon — `assets/image/icon/parrynormal.png`

- [ ] generated

```text
A 1024x1024 mobile app icon for a casual arcade game about a little witch defending herself against cute cartoon monsters, shaped as a rounded square: the four corners are generously rounded, and the area outside the rounded square is empty. In the middle, large and filling about two thirds of the square, the hero: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose, rosy red blush on the cheeks and a confident smile, under a big floppy purple witch's hat with a curled, bent tip and a dark red band around it; she is a face under a hat, with no body, no arms, no legs and no hands. A thick bright cyan arc of magic shield curves around the right side of her face, and a small glossy orange ball bounces off it. Inside the rounded square, the background is a smooth vertical gradient from deep purple at the bottom to night blue at the top, with a pale full moon behind her hat. No text, no letters, no numbers. Glossy, polished 3D-rendered cartoon style like a premium emoji: smooth shiny surfaces, soft specular highlights, rich saturated colours, bold and readable at small sizes. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.23 Music — `assets/audio/music/parrynormal.mp3`

- [x] generated

```text
Instrumental background music for a fun, spooky-cute casual mobile arcade game about a little witch fighting cartoon Halloween monsters. 128 BPM, steady and exact tempo, 4/4, about three minutes, one catchy melody that runs through the whole track. Six clear sections of about 30 seconds each, the same theme in a new colour each time: first a calm, slower, mysterious section with celesta, soft pizzicato strings and a music box, to serve as the menu bed; then a bouncy haunted forest section with pizzicato strings, harpsichord, bassoon and light percussion; then a graveyard section with a swinging organ, xylophone like rattling bones and a walking bass; then a swamp section with a bubbly synth bass, jaw harp, muted brass and wooden percussion; then a castle crypt section with a dramatic pipe organ, choir pads and timpani, still playful; then an epic dragon throne section with full brass, driving drums and a bold, heroic version of the theme. Mischievous, energetic and fun, never truly scary, every section loops comfortably. No vocals, no screams, no sudden drops, no loud transitions.
```

Cut it into sections as [MUSIC.md](MUSIC.md) describes: the first section is
the menu bed (`CONFIG.music.menu`), the five others are one per biome, moved
with the biome in `reset()`. Measure the BPM rather than trusting the prompt
(generated tracks miss it).

______________________________________________________________________

## 12. Definition of done

[CLAUDE.md's list](../CLAUDE.md#definition-of-done-for-a-new-game) applies
whole. On top of it, for this game:

- [ ] On a phone the dial steers the shield and the thumb never covers the
  witch. A second finger fires a super while the thumb stays on the dial.
- [ ] On a desk the shield follows the mouse with no dial on screen, a click
  launches, Z X C V fire the supers.
- [ ] The shield never closes, the stars grow it progressively, and every
  impact makes it bounce.
- [ ] Her own blue ball never costs a heart: it freezes the shield for 1 s.
- [ ] A monster thrown by the shield slides far back and bowls over what it
  meets.
- [ ] Every stage opens on its card: the monsters, their weaknesses, the
  supers to pick, a new one marked. The tiles never close the card.
- [ ] The twenty monsters, eleven supers and seven pickups each have their
  guide page, are named once by `Notify.learn`, and are in the bestiary.
- [ ] The round is seen from above: the witch and every monster play their
  frames in the nearest of eight directions, mirrored for the left and never
  rotated, each sheet encoded at one fixed
  scale and anchored on its measured feet, so nothing pulses or slides
  between two frames.
- [ ] The variants of §5.1 come out of the same sheets: babies, bosses
  (encoded at the boss's size, never scaled up), the biome palettes (the eyes
  untouched), the moods' tint and pace, all baked at the round's start, each
  named once by `Notify.learn` and on its guide page.
- [ ] Monster sprites, their flash and stone copies are built once, keyed on
  `view.dpr`. No `shadowBlur`, no `ctx.filter`.
- [ ] **The thirty levels are benched** (§6): the reaction-limited pilot clears
  every level at one star in most seeds, at least 12 seeds a level, driving the
  round headless with `Enter.skip()`.
- [ ] `version` reads `2.0.0` on the title screen.

______________________________________________________________________

## 13. What is not decided yet

- **The witch's name.** The original never named her. A proposal: **Hazel**
  (witch hazel). She can stay unnamed: the guide says *the witch*.
- **The stage card's API**: how a game opens a shell card over its own round
  (§3 step 7). Holepocalypse has the same open question.
- **Android and the old listing.** Magic Shield Brick is live on Google Play.
  If Parrynormal is to ship as its update, rather than as a new app,
  `android.appId` must be the old app's id and `versionCode` must be above
  its last one, which is what `2.0.0` already says. The old app id and its
  last `versionCode` are needed from the Play Console.
- **The variants' numbers** (§5.1): the sizes, the palettes and the moods are
  first values, to be set on the bench and judged in the lab.
- **The endless run's biome cycle**: every 20 monsters knocked out (§6), to be
  tuned on the bench.

______________________________________________________________________

## 14. What the build decided (2026-11-04)

- **The assets** arrived as one folder of 41 pictures and the track; each was
  renamed to its role in `assets/image/master/` (§11's table) and the track is
  `assets/audio/music/parrynormal.mp3`. One sheet had no role:
  *Planche de sprites squelettes animés*, a skeleton already scattered into
  bones, is kept as key art, `parrynormal-store-skeleton-scattered.png`. There
  was no app icon in the folder: `assets/image/icon/parrynormal.png` is still
  to come, and until it lands the site build skips the game.
- **Encoding**: fixed `scale` profiles in `tools/lab/encode-art.mjs` (witch
  0.5, the nineteen kinds and the extras 0.42, the Dragon 0.6), the portraits
  in a 256 box, the pickups in a 192 box; the soft halo cleared (alpha under
  80\) on every frame cut. `WEB_ONLY_PARRY` in `tools/build/build.mjs` keeps
  the playable to the forest, the witch, the Bat and the Jack, Lightning, the
  Star and the Pumpkin (1.8 MB). The web build fetches the other kinds' frames
  on demand (`CONFIG.artLazy`) and prefetches a level's kinds in `reset()`.
- **The feet** are measured at runtime off each frame's pixels (the bottom of
  the solid body, x at its alpha-weighted centre over its lowest quarter),
  never on the cell; one scale per kind, off its first frame.
- **Multi-touch** is an opt-in of the motor, `CONFIG.multiTouch` (§3 step 2):
  every finger reaches the game with its own `p.id`; the other games keep the
  one-finger path byte for byte.
- **v2.3.0: nineteen monsters, and the zombie's grave.** The Bullfrog left
  the round: Toadify already turns any monster into a frog, so the two were
  one idea twice. Its entry stays in `ENEMIES` (`retired`, so every other
  kind keeps its `monsterNN` card) and its 5x4 sheet is what a toadified
  monster is drawn with — its walk, facing where it goes, a small hop a step.
  The swamp deals three kinds (`PATTERN3`: slime, mosquitoes, slime +
  mosquitoes, shaman, slime + shaman, mosquitoes + shaman) and stage 21's
  returning frog is a slime. The Tombstone pickup went the same way
  (`retired`, kept for its art): a knocked-out **zombie** leaves its
  tombstone where it fell — a wall (6 HP) monsters chew and balls bounce off
  — and after `tombRise` 4 s it opens, the zombie climbing back out on
  `tombChance` 40 %, once (a risen zombie leaves no second stone). The roll
  is made when the stone is laid: one about to open shakes for its last
  second and counts as a monster still to beat. Guide page `grave`. The web
  pickup's pale disc went too: the sprite says where the zone is.
- **The stage card is the shell's LOADOUT card** (`Game.loadout`, the pattern
  holepocalypse set): the supers are picked there, the found one tagged NEW.
  The monsters of a stage are announced by `Notify.learn` the first time they
  are met, and their page in the guide holds what the card would have said.
- **The music** measured 124 BPM, not 128; its six sections are cut in
  `CONFIG.music` (`menu`, `biomes[0..4]`, the playable's `cut`), the throne's
  only 8 bars long because the track ends there.
- **The Toad Shaman spits every 3 s, not 2.2, and creeps in between two
  spits** (20 % of its pace): a level of twenty-odd shamans parked at 340 px
  emptied the witch's hearts in 13 to 21 s on the bench.
- **A slime's two slimelets carry on the slide** their parent was thrown
  into: born still beside the shield, they reached the witch (level 13 lost
  in 18 s on the first pass, won twice after).
- **A heart lost leaves the witch 1 s of grace**: a swarm of Mosquitoes
  slipping past the shield cost one heart per member and ended level 18 in
  a single pass; it now costs one.
- **A giant's stage (6, 12, 18, 24) spawns 0.3 s slower** than §6's
  formula: level 18 (Mosquitoes, Toad Shamans, the swamp's visitors and a
  giant shaman) was the one the pilot still lost two seeds in three.
- **Words**: a refused input (no ball left, a super not ready) is said at
  most once every 3 s per kind, so a player mashing the hub is told once.
- **The bench** is a scratch rig (headless Chrome over the web build with
  `?bench=1`, which exposes `window.__PN`: the state, `aim`, `launch`,
  `fire`). Its first pass, one seed a level with the reaction-limited pilot,
  is the baseline to tune `count` and `every` from.

## 15. The night, the camera and the walls (2.1.0, 2026-11-05)

Ported from `lab/parrynormal-sprites.html` (Feel and Light), section *THE
NIGHT, THE CAMERA AND THE WALLS* of `games/parrynormal/game.js`; every value
per biome is a row of `NIGHTS`.

- **Each biome has its own night**: a half-resolution light map filled with
  the biome's ambient colour and laid over the world in `multiply`, lit by the
  witch's lantern, the shield, the balls, the spits, the fireballs, a candle,
  the pickups, every blow and the lamps painted into the scene (the forest's
  crystals, the swamp's cauldron and mushrooms, the crypt's candelabras and
  windows, the throne's lava). Fog in the graveyard and the swamp, fireflies,
  embers rising over the throne, moon shafts in the forest and the graveyard,
  a vignette in the biome's own dark. Every monster carries a faint light so
  one far out in the dark still reads.
- **The shield and the blue balls stay light**: they are drawn after the
  multiply, at full strength, with a `screen` glow around them.
- **The camera takes the blow**, by trauma (shakes by its square), a zoom
  punch toward the point of impact and the motor's hit-stop: a parried ball
  barely nudges it, a monster thrown back knocks it, a monster thrown and
  knocked out lands harder, and a heart lost rattles the frame and burns the
  screen's edges red (`IMPACTS`). It replaced every `Fx.shake` of the game.
- **A heart lost, if it is not the last, sends a green wave** out of the
  witch that throws every monster on screen back without harm: the throw is
  `soft`, so it bowls nobody over. Guide page `wave-green`, *Second wind*.
- **Walls**: ellipses over the painted trees, tombs, pillars and statues of
  each scene. A walker's feet never enter one: it spawns elsewhere, slides
  around it, and stops against it when thrown (dizzy when thrown hard).
  Fliers cross them, a Gravedigger digs under them. A pickup never lands in
  one either.
- **Nothing floats any more**: every frame's feet were measured on its line,
  so the sheets were right. The Gargoyle was drawn as a flier though it
  walks, the fliers hung at half height (neither standing nor flying, now a
  `lift` of their own over a smaller shadow), and a thrown monster spun around
  its belly with its feet off the floor; it now leans back on its feet and
  drags dust, and the shadow has a dark core where the feet touch.

## 16. The ice, the last chance and the giants that bounce (2.2.0, 2026-11-05)

- **The frozen shield is a block of ice**, 0.5 s instead of 1 s
  (`shieldLock`): faceted, with shards standing out of it, laid over the arc,
  which keeps its own colour underneath. It melts from both ends toward the
  middle, so the time left is read on the shield; it does not bounce while
  frozen, and it shatters off when the lock ends (`drawIce`, `thaw`). The
  combo is still dropped: that is the malus.
- **The last chance**: a monster that slips through the gap and stands
  between the shield and the witch, before reaching her, is whisked away
  once, unharmed — a streak of light up out of it to the top of the frame,
  then down onto a spot 360 to 520 px from her, out of the walls
  (`tpUp` + `tpDown`, untouchable meanwhile), where it lands dazed. The second
  time the same monster slips in, it gets to her: without that, nothing that
  walks could ever cost a heart. Guide page `rescue`.
- **A giant thrown back flies far and bounces** off the screen's edges
  (`bossKnock` 1 instead of 0.45, `bossDamp`, `bossBounce`), and one that got
  to the witch is thrown out the same way: it walks in again from another
  side, so the player has to turn the shield rather than hold one side.
  Guide page `bounce`.

## 17. The attack: wind-up and charge (2.3.0, 2026-11-05)

- **Every walker attacks the same way** (`attackStep`): once within
  `attackRange` (270 px × the size's reach) of the witch it stops in its
  attack pose, the sheet's row 3, while a red aura ARRIVES on it (closing in
  from twice its size) — the wind-up, `windup` 0.6 s — then rushes her at a
  run, its steps twice as fast, the aura burning and throwing embers — the
  charge, `chargeK` × its speed, never under `chargeMin` 150 px/s. It lasts
  until it gets to her or something throws it back (`throwBack`, a strike,
  the Toadify super), and the monster then walks `attackCd` 1.6 s before it
  can attack again. The spider winds up 0.9 s and leaps at 520 px/s
  (`ATTACK`); the Toad Shaman winds up for the half second before each spit;
  the dragon for 0.8 s before its rush, which keeps its row 4; the Dark Priest
  never attacks. Row 3 now means the attack pose and nothing else: the
  pose the monsters took near the shield is gone.
- **The aura** is grudgeon's yokai flame: the frame's silhouette in red,
  blurred, laid behind the sprite three times and stretched upward. Its
  first layer is flat, so it stays red on the forest's violet (added, it
  went pink), and its light is a glow laid after the night, never in the
  light map (for the same reason).
- **The last chance spares no charging monster**: only one that slips
  inside the shield without charging — a shaman creeping in, a monster
  between two attacks — is sent away.
- Sounds: `charge` (`power/fireignite`) as the aura comes, `warp`
  (`move/teleport`) for the last chance.
- `lab/parrynormal-anims.html` plays every animation of a character in the
  eight directions, the wind-up and the charge included.

## 18. The supers' buttons (2.4.0, 2026-11-05)

- **No name and no key on a button**: the icon says which super it is, a
  tap or a click fires it. Z X C V are gone, and so is their line in the
  desk legend; SPACE still launches a ball.
- **A button is a vessel** (`drawSlot`): fired, it empties and its colour
  brews back up from the bottom — a rolling surface, bubbles, smoke curling
  off it — the icon dim and the rim filling round like a clock. Full, it
  bursts (`superReady`): the button pops, flashes white, throws a ring and
  sparks in its colour and plays `ready` (`power/powerup02`), then breathes,
  lit, until it is fired. The countdown figure is gone with it.

## 19. The Gravedigger's feint (2.5.0, 2026-11-05)

- **The Gravedigger never charges** (`ATTACK.mole.feint`): it comes in
  walking, not underground, and its wind-up — the pose, the red aura — is a
  feint, after which it digs in where it stands (`burrowDown`). Under the
  ground it is a mound nothing the player has can touch (the Shockwave and
  the Lightning still dig it up), tunnelling round the witch for 1.3 to 2.2 s
  (`dig`), then it comes up elsewhere and walks for 2.2 s
  (`ATTACK.mole.rest`) before it can feint again. It is there to make the
  player turn the shield toward a threat that is not one; balls and the
  shield get it while it walks or winds up. Guide page `dig`.

## 20. One objective a stage, monsters all the way (2.6.0, 2026-11-05)

- **A stage is no longer a queue that runs dry.** Its monsters come one after
  another for as long as it lasts (`levelSpawn`: its own kinds, the returning
  ones a quarter of the time, a share of babies), never more than its `cap`
  on the field at once (2.4 + 0.14 × level, a group counting each member),
  and its giant — or the dragon — comes once, `BOSS_IN` 25 s in. A stage
  never ends on one giant left alone, and it ends on its objective, the
  field going up in smoke.
- **Each stage asks one thing** (`OBJ`), written on its card by
  `Game.levelGoal` and counted down in the HUD's right slot: knock out n
  monsters (11 stages), survive n seconds (5), throw n monsters back with
  the shield (5), make n perfect parries (2), bowl n monsters over (2),
  defeat the giant or the dragon (5). A throw or a strike is asked on a stage
  of walkers that come to the shield, never of ghosts, swarms or spitters.
  Stages 9 and 27 charge a star for a super: their third star is "fire no
  super" instead of "lose no heart", and the first super fired there says so.
  Guide page `goals`.
- **The charge was eased for it**: swarms (mosquitoes, rats) no longer charge
  — their rush is their attack, and four or five charging at once cost a
  heart every time — and a charge runs at 2 × the monster's pace between 110
  and 200 px/s.

## 21. Round durations (2.6.5, 2026-11-05)

Every duration the player reads or plays against is a round number on the
1 / 5 / 10 / 15 / 20 grid: Star 5 s, Candle 10 s (one zap a second), a pickup
every 5 s on every stage (the `pickupEvery` lerp of `web.levels.tune` is
gone) and 10 s on the field, Freeze, Full moon and Toadify 5 s, Familiars
10 s, enraged 5 s, a tombstone opens after 5 s and 1 s of grace after a heart.
The frozen shield is the one exception, kept at 0.5 s. Cooldowns: Lightning 10, Broom 10, Freeze 15,
Shockwave 15, Full moon 20, Brew 20, Familiars 20, Fire rain 20, Salt circle
25, Toadify 30, Banish 30. Animation beats (wind-ups, digging, the teleport)
keep their own fractions: they are felt, never read.

## 22. Banish and the candle's flames (2.7.0, 2026-11-05)

- **Banish is a three-beat show** on its target (`banish`, `BANISH_SEAL`
  0.45 s, `BANISH_BEAM` 0.6 s): a magenta seal opens on the ground under it
  while the frame darkens and the monster is pinned; a pillar of light falls
  from above the frame onto it (the `ko` camera impact, a flash, sparks);
  its white silhouette is pulled up the pillar while the seal burns away.
  The Dragon takes its 10 on the strike and stays.
- **A candle throws flames**, not a beam (`shootFlame`): a wisp of fire leaps
  out of the wick, rises on a curve, then homes in shedding embers; the
  damage lands on arrival, in a puff of fire. A target gone meanwhile hands
  the flame to the nearest monster, or it gutters out.
- **The pumpkin hits for 5** (`blastDmg`, was 2) and is drawn as the loudest
  thing a pickup does (`blasts`): a hit-stop, a camera kick, a fireball,
  eleven tongues of fire, a shockwave past its reach, the shell in chunks,
  smoke, and a scorch on the floor that cools over 4 s.
