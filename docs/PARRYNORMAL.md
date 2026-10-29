# PARRYNORMAL — from the prototype to the game

The plan of record for the next game: the remake of Magic Shield Brick, the
studio's Google Play game, turned into an arcade tower defense. A little witch
stands in the middle of the screen, an arc of shield turns around her, she
launches her own magic balls, parries them back out into the monsters and
throws the monsters back. It is **not built yet**. Everything a session needs
to build it on the motor is here: the rules the prototype validated, the steps
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

She is the round's centre (a sprite, drawn by the game), the end screen's
three faces, the title screen, the village and the store images.

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

| ball  | where it comes from                                                                                | on the shield                               | on the witch                                                            | on a monster      |
| ----- | -------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- | ----------------- |
| blue  | **launched by the witch**: the dial's hub on a phone, a click or SPACE on a desk, along the shield | parried; every 5th parry drops a brown ball | **no heart**: the shield freezes for `SHIELD_LOCK` 1 s, the combo drops | 1 damage, bounces |
| brown | dropped by a blue ball's 5th parry, a parried spit, the Brew super, the Potion                     | parried, scores                             | destroyed, nothing lost                                                 | 1 damage, bounces |

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

- Monsters come in from the screen edges after a red warning ring
  (`SPAWN_WARN` 0.8 s) and walk, fly, dig or hop toward the witch. A monster
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

A pickup floats on the field for `PICKUP_LIFE` 8 s, one every
`PICKUP_EVERY` 6 s. **Any ball that touches one takes it**, a brown ball
too, which is what brown balls are for.

| pickup    | effect                                                                                        |
| --------- | --------------------------------------------------------------------------------------------- |
| Star      | the shield grows 40° for 7 s, **progressively** (`ARC_GROW` 110°/s both ways); stars stack    |
| Pumpkin   | a blast: monsters in range take 2, balls are thrown away, brown balls in range pop in a chain |
| Candle    | a turret where it stood: 1 damage to the nearest monster every 0.9 s, for 12 s                |
| Tombstone | a wall where it stood (6 HP): monsters stop and chew it, balls bounce off it                  |
| Web       | a zone where it stood (radius 110, 10 s): monsters in it move at 35 %                         |
| Potion    | every brown ball splits in two                                                                |
| Heart     | one heart back                                                                                |

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
   cover-fit to the frame. This is gelatile's pattern, not
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
   - **The sprites.** Every monster, pickup, super icon and the witch are cut
     from sheets (§11) and drawn with `drawImage`, centred and scaled to the
     monster's `r`. They move in code: a bob, a squash on a hop, a flap
     (scaleY) for the wings, a white flash on a hit (a pre-tinted copy, made
     once), a fade for the ghost, a grey copy for the gargoyle's stone
     (desaturated once at load, never `ctx.filter`).
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
     prompt, then `--adopt`. The monster sheet is drawn small in the round:
     encode its cuts at a 256 px box.
   - The playable carries biome 1 only: its scene, its four monsters, its
     pickups. The four other scenes and sixteen monsters are web-only
     (`CONFIG.artLazy`).

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

| #   | biome (EN / FR)                       | levels | monsters                                 | scene                                                      |
| --- | ------------------------------------- | ------ | ---------------------------------------- | ---------------------------------------------------------- |
| 1   | Haunted Forest / Forêt hantée         | 1–6    | Bat, Jack, Wisp, Spider                  | twisted trees, an iron fence, a cracked stone path, a moon |
| 2   | Graveyard / Cimetière                 | 7–12   | Zombie, Skeleton, Ghost, Gravedigger     | tombstones, a crooked gate, a mausoleum, mist              |
| 3   | Witch's Swamp / Marais de la sorcière | 13–18  | Slime, Bullfrog, Mosquitoes, Toad Shaman | a bubbling cauldron, lily pads, glowing mushrooms          |
| 4   | Castle Crypt / Crypte du château      | 19–24  | Knight, Gargoyle, Vampire, Rats          | a gothic hall, candelabras, stained glass, sleeping bats   |
| 5   | Dragon's Throne / Trône du dragon     | 25–30  | Imp, Salamander, Dark Priest, Dragon     | a red throne with dragon statues, lava light               |

**Every scene keeps its middle calm**: the witch and the shield stand there,
and the monsters must read over it. The details live along the edges and the
top, the ground at the bottom stays plain for the dial row, and the colours
stay mid-dark so the bright monsters and the cyan shield pop.

______________________________________________________________________

## 5. The twenty monsters

The prototype's `ENEMIES` table, as it was played. The key is the guide
page's id, the `Notify.learn` id and the codex card. The names are the
monsters' kinds, translated (they are not proper nouns).

| key          | EN          | FR             | biome | HP  | speed | behaviour                                                                          | weak to                | first level |
| ------------ | ----------- | -------------- | ----- | --- | ----- | ---------------------------------------------------------------------------------- | ---------------------- | ----------- |
| `bat`        | Bat         | Chauve-souris  | 1     | 1   | 85    | flutters straight in, wobbling                                                     | Lightning, Familiars   | 1           |
| `jack`       | Jack        | Citrouille     | 1     | 3   | 50    | walks straight in                                                                  | Lightning, Fire rain   | 2           |
| `wisp`       | Wisp        | Feu follet     | 1     | 1   | 80    | dashes, stops, dashes again                                                        | Freeze, Salt circle    | 4           |
| `spider`     | Spider      | Araignée       | 1     | 2   | 70    | stops at 270 px, waits 0.9 s, leaps at 520                                         | Freeze, Shockwave      | 5           |
| `zombie`     | Zombie      | Zombie         | 2     | 5   | 32    | very slow, very tough                                                              | Shockwave, Banish      | 7           |
| `skeleton`   | Skeleton    | Squelette      | 2     | 2   | 55    | falls into a pile, pulls itself together in 2.5 s unless the pile is hit           | Lightning, Fire rain   | 8           |
| `ghost`      | Ghost       | Fantôme        | 2     | 2   | 60    | fades 0.9 s in 2: balls pass through, the shield does not                          | Lightning, Broom       | 10          |
| `mole`       | Gravedigger | Fossoyeur      | 2     | 2   | 70    | digs in out of reach, surfaces at 230 px                                           | Shockwave, Lightning   | 11          |
| `slime`      | Slime       | Slime          | 3     | 3   | 45    | splits into two slimelets (1 HP, 75) when knocked out                              | Fire rain, Shockwave   | 13          |
| `frog`       | Bullfrog    | Ouaouaron      | 3     | 2   | 55    | hops in long leaps                                                                 | Freeze, Salt circle    | 14          |
| `mosquito`   | Mosquitoes  | Moustiques     | 3     | 1   | 110   | a swarm of five                                                                    | Shockwave, Familiars   | 16          |
| `shaman`     | Toad Shaman | Crapaud chaman | 3     | 3   | 50    | stops at 340 px and spits every 2.2 s; a spit parried becomes a brown ball         | Freeze, Lightning      | 17          |
| `knight`     | Knight      | Chevalier      | 4     | 5   | 40    | the shield cannot hurt its armour (it still throws it)                             | Lightning, Fire rain   | 19          |
| `gargoyle`   | Gargoyle    | Gargouille     | 4     | 3   | 70    | turns to stone 1.2 s in 3.2: nothing hurts it but magic                            | Lightning, Banish      | 20          |
| `vampire`    | Vampire     | Vampire        | 4     | 3   | 40    | blinks to another side every 1.6 s, 50 px closer                                   | Salt circle, Lightning | 22          |
| `rat`        | Rats        | Rats           | 4     | 1   | 125   | a fast pack of four                                                                | Shockwave, Familiars   | 23          |
| `imp`        | Imp         | Diablotin      | 5     | 1   | 110   | blows up on the shield and jams it to 28° for 1.5 s; a blast if knocked out        | Salt circle, Fire rain | 25          |
| `salamander` | Salamander  | Salamandre     | 5     | 2   | 120   | spirals in from the side                                                           | Freeze, Salt circle    | 26          |
| `priest`     | Dark Priest | Prêtre noir    | 5     | 3   | 45    | stops at 360 px, heals the monsters within 220 by 1 every 2 s                      | Lightning, Banish      | 28          |
| `dragon`     | Dragon      | Dragon         | 5     | 30  | 25    | the boss: stops at 300 px, breathes three fireballs every 2.6 s, charges every 8 s | Lightning, Banish      | 30          |

A monster's **score** is the prototype's (`score`, 20 to 1000). Magic
(Lightning, Banish) ignores every protection: the dirt, the fade, the stone,
the armour.

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
| `play.pickupEvery`    | 6       | 7        | 8        |
| monsters' speed scale | 1.0     | 1.1      | 1.2      |

| lv  | biome | monsters                | count | every (s) | super found       | pickup found         | slots |
| --- | ----- | ----------------------- | ----- | --------- | ----------------- | -------------------- | ----- |
| 1   | 1     | Bat                     | 7     | 3.1       | Lightning, Freeze | Star, Pumpkin, Heart | 2     |
| 2   | 1     | Jack                    | 8     | 3.1       | —                 | Candle               | 2     |
| 3   | 1     | Bat, Jack               | 9     | 3.0       | Shockwave         | —                    | 2     |
| 4   | 1     | Wisp                    | 10    | 2.9       | —                 | Potion               | 2     |
| 5   | 1     | Spider                  | 11    | 2.9       | Full moon         | —                    | 2     |
| 6   | 1     | Wisp, Spider            | 12    | 2.8       | —                 | —                    | 2     |
| 7   | 2     | Zombie                  | 13    | 2.7       | —                 | Tombstone            | 2     |
| 8   | 2     | Skeleton                | 14    | 2.7       | Brew              | —                    | 2     |
| 9   | 2     | Zombie, Skeleton        | 15    | 2.6       | —                 | —                    | 2     |
| 10  | 2     | Ghost                   | 16    | 2.6       | Familiars         | —                    | 3     |
| 11  | 2     | Gravedigger             | 17    | 2.5       | —                 | —                    | 3     |
| 12  | 2     | Ghost, Gravedigger      | 18    | 2.4       | —                 | —                    | 3     |
| 13  | 3     | Slime                   | 19    | 2.4       | Fire rain         | Web                  | 3     |
| 14  | 3     | Bullfrog                | 20    | 2.3       | —                 | —                    | 3     |
| 15  | 3     | Slime, Bullfrog         | 21    | 2.2       | —                 | —                    | 3     |
| 16  | 3     | Mosquitoes              | 22    | 2.2       | Salt circle       | —                    | 3     |
| 17  | 3     | Toad Shaman             | 23    | 2.1       | —                 | —                    | 3     |
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

**After level 30**, the star above it starts the endless run: every monster of
every biome, the biome changing every 20 monsters knocked out, scored on its
best score.

**The bench.** A pilot that aims at the nearest threat with a 0.2 s reaction
and a 360°/s limit, launching whenever it can, cleared 25 of the 30 stages
with the supers and 20 without them (prototype, 2026-10-28). Re-bench in the
game with `Enter.skip()` before setting `count` and `every` for good: every
level should be cleared at one star by that pilot in most seeds.

______________________________________________________________________

## 7. The eleven supers

| key         | EN          | FR               | found on | cooldown | effect                                                                         |
| ----------- | ----------- | ---------------- | -------- | -------- | ------------------------------------------------------------------------------ |
| `lightning` | Lightning   | Foudre           | 1        | 12 s     | strikes the 3 monsters nearest the witch for 3, through every protection       |
| `freeze`    | Freeze      | Gel              | 1        | 16 s     | the whole world at 30 % speed for 4 s (the shield keeps full speed)            |
| `wave`      | Shockwave   | Onde de choc     | 3        | 14 s     | throws every monster back (1 damage) and digs the Gravediggers up              |
| `moon`      | Full moon   | Pleine lune      | 5        | 20 s     | the shield grows to 320° for 4 s                                               |
| `brew`      | Brew        | Chaudron         | 8        | 18 s     | six brown balls burst out of the shield                                        |
| `familiars` | Familiars   | Familiers        | 10       | 22 s     | three friendly bats circle the witch for 8 s and bite what they meet           |
| `meteor`    | Fire rain   | Pluie de feu     | 13       | 20 s     | six fireballs fall on the monsters, 2 damage around each                       |
| `salt`      | Salt circle | Cercle de sel    | 16       | 24 s     | nothing crosses a circle of 250 px for 5 s, spits included                     |
| `broom`     | Broom       | Balai            | 19       | 10 s     | the shield sweeps two full turns in 1 s                                        |
| `toad`      | Toadify     | Crapaudification | 22       | 28 s     | every monster but the Dragon is a harmless toad for 6 s: one hit knocks it out |
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
draws the card from the same painted cut the round uses. Its door is the
village role `cards`.

______________________________________________________________________

## 11. The assets — the list and a prompt for each

**Nothing is done yet.** Every asset is below, one complete prompt each, to be
pasted alone. The artwork is the user's to generate: never draw a placeholder
for any of it. The original game's captures (`site/image/magic-shield-brick/`)
are the reference for the look. Join them to a prompt as a style image when
the image tool allows it.

**Two worlds, kept apart.** The intro, the map, the menus, the village and the
desktop bands are the witch's world at night (her moonlit wood). The round is
the biome's own scene. Every round scene keeps a calm middle, where the witch
stands and the monsters fight.

| what                               | file (`assets/image/master/` unless said)                     | cut                                                 | roles (`CONFIG.art.…`)       | prompt    |
| ---------------------------------- | ------------------------------------------------------------- | --------------------------------------------------- | ---------------------------- | --------- |
| end screen character, three faces  | `parrynormal-character-{sad,neutral,happy}.png`               | —                                                   | `characterSad`, …            | 11.1–11.3 |
| the five round scenes              | `parrynormal-scene-{forest,graveyard,swamp,crypt,throne}.png` | — (scene profile, §3 step 11)                       | `sceneForest`, …             | 11.4–11.8 |
| intro, map and end screen backdrop | `parrynormal-background-phone.png`                            | —                                                   | `backgroundPhone`            | 11.9      |
| desktop bands                      | `parrynormal-background-desk.png`                             | —                                                   | `backgroundDesk`             | 11.10     |
| village hub                        | `parrynormal-background-home.png`                             | —                                                   | `backgroundHome`             | 11.11     |
| logotype                           | `parrynormal-title.png`                                       | —                                                   | `title`                      | 11.12     |
| the witch in the round             | `parrynormal-object-witch.png`                                | `--grid 3x1`                                        | `witch01`–`03`               | 11.13     |
| monsters, 5x4                      | `parrynormal-object-monster.png`                              | `--grid 5x4`, 256 px box                            | `monster01`–`20`             | 11.14     |
| monster states, 4x1                | `parrynormal-object-state.png`                                | `--grid 4x1`                                        | `state01`–`04`               | 11.15     |
| super icons, 4x3                   | `parrynormal-object-super.png`                                | `--grid 4x3`                                        | `super01`–`12`               | 11.16     |
| pickups, 4x2                       | `parrynormal-object-pickup.png`                               | `--grid 4x2`                                        | `pickup01`–`08`              | 11.17     |
| village houses, 3x2                | `parrynormal-object-home.png`                                 | `--grid 3x2`                                        | `home01`–`06`                | 11.18     |
| stickers, 5x4                      | `parrynormal-object-sticker.png`                              | `--grid 5x4 --solid 250 --pad 80 --margin 30 --seq` | `sticker01`–`20`             | 11.19     |
| menu decor objects, 4x2            | `parrynormal-object-decor.png`                                | `--grid 4x2 --as decor`                             | `decor01`–`08` (the pool)    | 11.20     |
| app icon                           | `assets/image/icon/parrynormal.png` (+ `thumb/`)              | —                                                   | the site card                | 11.21     |
| music, one track in six sections   | `assets/audio/music/parrynormal.mp3`                          | `embed/` for the web, 30 s of it in the playable    | `web.music`, `ASSETS.sounds` | 11.22     |

The shield, the balls, their trails, the dial, the hub, the buttons' rims and
cooldowns, the warning rings, the spits, the bolts and the blasts are drawn by
the game. **The sounds are not generated**: they are roles of the house kit
(§3 step 9).

### 11.1 End screen, sad face — `parrynormal-character-sad.png` \*

```text
A character illustration for a casual mobile arcade game, the game's hero alone, centred, seen from the front, filling most of the picture: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose, rosy red blush on the cheeks, under a big floppy purple witch's hat with a curled, bent tip and a dark red band around it. She is a face under a hat: no body, no arms, no legs, no hands. Here she is sad and a little dizzy: her eyebrows tilted up in the middle, her eyes watery and looking down, a small wobbly frown, her hat knocked crooked and sagging over one eye, one small round tear on her cheek. Glossy, polished 3D-rendered cartoon style like a premium emoji: smooth shiny surfaces, soft specular highlights, warm rim light, rich saturated colours. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.2 End screen, neutral face — `parrynormal-character-neutral.png` \*

```text
A character illustration for a casual mobile arcade game, the game's hero alone, centred, seen from the front, filling most of the picture: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose, rosy red blush on the cheeks, under a big floppy purple witch's hat with a curled, bent tip and a dark red band around it. She is a face under a hat: no body, no arms, no legs, no hands. Here she is calm and focused: a gentle, confident closed-mouth smile, her eyes looking slightly to the side as if watching for the next monster, one eyebrow a little raised, her hat straight. Glossy, polished 3D-rendered cartoon style like a premium emoji: smooth shiny surfaces, soft specular highlights, warm rim light, rich saturated colours. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.3 End screen, happy face — `parrynormal-character-happy.png` \*

```text
A character illustration for a casual mobile arcade game, the game's hero alone, centred, seen from the front, filling most of the picture: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose, rosy red blush on the cheeks, under a big floppy purple witch's hat with a curled, bent tip and a dark red band around it. She is a face under a hat: no body, no arms, no legs, no hands. Here she is overjoyed: a wide open laughing smile, her eyes squeezed into happy curved arcs, her cheeks blushing brighter, her hat tilted back proudly with its tip springing up. Glossy, polished 3D-rendered cartoon style like a premium emoji: smooth shiny surfaces, soft specular highlights, warm rim light, rich saturated colours. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.4 Biome 1 scene, the haunted forest — `parrynormal-scene-forest.png`

```text
A portrait 9:16 background illustration, 1080x1920, the setting of a casual mobile arcade game about a little witch defending herself against cartoon monsters: a haunted forest at night, seen from the front at ground level. A huge twisted dark tree leaning in from the left edge with bare crooked branches across the top, a full pale moon behind thin purple clouds near the top right, a low ornate iron fence with stone pillars and crystal spikes crossing the picture at about forty percent of its height, and below it a wide floor of big cracked flagstones in cool violet grey running to the bottom of the picture. The whole middle of the picture, from about a third to three quarters of the height and across most of the width, is a calm, plain area of fence and flagstones with very little detail and gentle contrast, because the hero and the monsters fight there; the bottom fifth is plain flagstones with no detail, because the game's controls lie over it; the details live in the top third and the narrow side edges. Mid-dark night palette of deep purple, plum, night blue and violet grey, with soft moonlight; no pure black areas. No characters, no animals, no monsters, no faces, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a slightly spooky but cosy mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.5 Biome 2 scene, the graveyard — `parrynormal-scene-graveyard.png`

```text
A portrait 9:16 background illustration, 1080x1920, the setting of a casual mobile arcade game about a little witch defending herself against cartoon monsters: a cartoon graveyard at night, seen from the front at ground level. A small stone mausoleum with a pointed roof and a crooked iron gate near the top, rounded tombstones with blank faces leaning at funny angles along the side edges, a gnarled bare tree at the top left, a thin crescent moon, soft low mist drifting over the ground, and a wide floor of trodden earth and short dry grass running to the bottom of the picture. The whole middle of the picture, from about a third to three quarters of the height and across most of the width, is a calm, plain area of misty ground with very little detail and gentle contrast, because the hero and the monsters fight there; the bottom fifth is plain ground with no detail, because the game's controls lie over it; the details live in the top third and the narrow side edges. Mid-dark night palette of slate blue, teal grey, mossy green and pale mist; no pure black areas. No characters, no animals, no monsters, no skeletons, no faces, no text, no letters, no numbers, no names on the tombstones. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a slightly spooky but cosy mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.6 Biome 3 scene, the witch's swamp — `parrynormal-scene-swamp.png`

```text
A portrait 9:16 background illustration, 1080x1920, the setting of a casual mobile arcade game about a little witch defending herself against cartoon monsters: a witch's swamp at night, seen from the front at ground level. Drooping willow branches and hanging moss across the top, a big black cauldron bubbling with green brew tucked against one side edge, clusters of softly luminous teal mushrooms on mossy roots along the side edges, round lily pads floating on dark green water at the top, and a wide floor of flat mossy bank and packed mud running to the bottom of the picture. The whole middle of the picture, from about a third to three quarters of the height and across most of the width, is a calm, plain area of mossy bank with very little detail and gentle contrast, because the hero and the monsters fight there; the bottom fifth is plain moss with no detail, because the game's controls lie over it; the details live in the top third and the narrow side edges. Mid-dark night palette of deep green, teal, murky olive and a touch of purple; no pure black areas. No characters, no animals, no frogs, no monsters, no faces, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a slightly spooky but cosy mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.7 Biome 4 scene, the castle crypt — `parrynormal-scene-crypt.png`

```text
A portrait 9:16 background illustration, 1080x1920, the setting of a casual mobile arcade game about a little witch defending herself against cartoon monsters: the great hall of a gothic castle at night, seen from the front at ground level. Two massive dark stone pillars along the side edges, a tall arched window of red and violet stained glass in a black iron frame at the top centre, a tall iron candelabra with lit candles beside it, and a wide floor of large worn stone slabs in warm red-brown running to the bottom of the picture. The whole middle of the picture, from about a third to three quarters of the height and across most of the width, is a calm, plain area of stone floor with very little detail and gentle contrast, because the hero and the monsters fight there; the bottom fifth is plain stone slabs with no detail, because the game's controls lie over it; the details live in the top third and the narrow side edges. Mid-dark palette of deep crimson, burgundy, warm brown stone and candle amber; no pure black areas. No characters, no animals, no bats, no monsters, no statues, no faces, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a slightly spooky but cosy mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.8 Biome 5 scene, the dragon's throne — `parrynormal-scene-throne.png`

```text
A portrait 9:16 background illustration, 1080x1920, the setting of a casual mobile arcade game about a little witch defending herself against cartoon monsters: a dragon king's throne room, seen from the front at ground level. A tall red velvet throne with a high carved back at the top centre, framed by two big stone dragon statues with folded wings on either side, a wall of red and black gothic stained glass behind, a warm orange light of lava glowing through cracks along the side edges, and a wide floor of large cracked red-brown flagstones running to the bottom of the picture. The whole middle of the picture, from about a third to three quarters of the height and across most of the width, is a calm, plain area of flagstones with very little detail and gentle contrast, because the hero and the monsters fight there; the bottom fifth is plain flagstones with no detail, because the game's controls lie over it; the details live in the top third and the narrow side edges. Mid-dark palette of deep red, crimson, warm black-brown and lava orange; no pure black areas. No characters, no living animals, no monsters, no faces, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a slightly spooky but cosy mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.9 Intro, map and end screen backdrop — `parrynormal-background-phone.png`

```text
A portrait 9:16 background illustration, 1080x1920, for a casual mobile arcade game about a little witch defending herself against cartoon monsters: the witch's moonlit wood at night. A huge full moon low in a deep purple sky, the silhouettes of crooked trees framing the two side edges, a small crooked witch's cottage with a round glowing window on a hill in the far distance, a winding path of flat stones through soft violet grass along the bottom, a few carved pumpkins lit from inside along the path. The middle of the picture is calm and uncluttered, with soft, low-contrast shapes, because a character, a map and text are laid over it; the detail sits along the bottom and the far edges. Mid-dark night palette of deep purple, plum, night blue and warm pumpkin orange; no pure black areas. No characters, no monsters, no faces on the pumpkins other than simple carved triangles, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a cosy, magical Halloween mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.10 Desktop bands — `parrynormal-background-desk.png`

```text
A wide 16:9 background illustration, 1920x1080, for a casual mobile arcade game about a little witch defending herself against cartoon monsters, shown on a desktop around a phone-shaped frame standing in the middle: the witch's moonlit wood at night. A huge full moon low in a deep purple sky, crooked trees and a small crooked witch's cottage with a round glowing window on the left, carved pumpkins lit from inside and a winding path of flat stones through soft violet grass on the right. The central third of the picture is empty and calm, plain sky and soft grass, because the game frame covers it; the trees, the cottage and the pumpkins sit on the left and right thirds. Mid-dark night palette of deep purple, plum, night blue and warm pumpkin orange; no pure black areas. No characters, no monsters, no faces on the pumpkins other than simple carved triangles, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a cosy, magical Halloween mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.11 Village hub — `parrynormal-background-home.png`

```text
A portrait 9:16 background illustration, 1080x1920, the home village of a casual mobile arcade game about a little witch, seen from a slightly high three-quarter view: a mossy clearing in a haunted wood at night, the witch's own little hamlet. Soft violet grass with winding paths of flat stones between patches of moss, crooked trees around the edges, a small pond reflecting a full moon at the top of the picture, a few lanterns on crooked posts and carved pumpkins lit from inside along the paths. On the ground there are six empty round flat stone slabs, clearly visible and spread over the picture so that a building can stand on each one later: two in the upper middle, two in the middle, two in the lower part, none of them closer than a slab's width to another and none touching the edges. The slabs are empty: no buildings, no houses, no objects on them. No characters, no monsters, no faces on the pumpkins other than simple carved triangles, no text, no letters, no numbers. Mid-dark night palette of deep purple, plum, moss green, night blue and warm lantern orange; no pure black areas. Painted cartoon style of a polished casual mobile game: soft painterly shading, gentle gradients, rounded friendly shapes, rich colours, a cosy, magical Halloween mood. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly.
```

### 11.12 Logotype — `parrynormal-title.png` \*

```text
A game logotype reading exactly "PARRYNORMAL", one word, in big chunky rounded letters: each letter a glossy shape in bright orange-yellow with a lighter top face and white specular highlights, a thick dark purple outline and a deep purple bevel at the bottom so the word reads on any background. A small floppy purple witch's hat with a curled tip and a dark red band sits tilted on the first letter "P". The letter "O" is a glossy cyan ring with a gap in it, like an arc of magic shield. The letters sit on one slightly arched line and bounce a little up and down, all at the same size. Correct spelling, every letter clearly readable, no other text. Glossy, polished 3D-rendered cartoon style for a casual mobile arcade game, rich saturated colours, clean edges. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.13 The witch in the round, 3x1 — `parrynormal-object-witch.png` \*

```text
A sprite sheet of three poses of the same game hero, for a casual mobile arcade game, arranged in a strict grid of 3 columns and 1 row, each pose centred in its own cell with wide empty space between the cells, all at exactly the same size and the same front view, soft light from the top left. The hero: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose, rosy red blush on the cheeks, under a big floppy purple witch's hat with a curled, bent tip and a dark red band around it. She is a face under a hat: no body, no arms, no legs, no hands. Left to right: calm, with a gentle closed-mouth smile and her eyes looking straight ahead; hurt, with her eyes squeezed shut, a small wavy frown and her hat knocked crooked; cheering, with a wide open smile and her eyes in happy arcs. Glossy, polished 3D-rendered cartoon style like a premium emoji: smooth shiny surfaces, soft specular highlights, rich saturated colours, bold and readable at a small size. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.14 Monsters, 5x4 — `parrynormal-object-monster.png` \*

```text
A sprite sheet of twenty small cartoon Halloween monsters for a casual mobile arcade game, arranged in a strict grid of 5 columns and 4 rows, each monster centred in its own cell with wide empty space between the cells, all drawn at about the same size so each fills most of its cell, all seen from the front, facing the viewer, soft light from the top left. They are cute and funny rather than scary, with big expressive eyes. Row 1, left to right: a small round purple bat with wide-open wings and little red eyes; a walking carved pumpkin head with a mischievous grin and a short green stem; a will-o'-the-wisp, a round little flame of pale blue fire with two big eyes; a fat round dark purple spider with eight short legs and four little red eyes; a chubby green cartoon zombie with droopy eyes and its arms held out in front. Row 2, left to right: a goofy cartoon skeleton with a big round skull and a toothy grin; a round white sheet ghost with a wavy hem and a surprised open mouth; a brown mole gravedigger wearing a tiny miner's cap and holding a small shovel; a round teal slime blob with a shiny drop on top and a silly smile; a big green bullfrog crouched to jump, with bulging eyes. Row 3, left to right: a tiny grey mosquito with see-through wings and a long thin nose; a plump olive toad shaman wearing a feathered purple headband and holding a wooden staff topped with a pink stone; a small knight in a full grey suit of armour with a closed helmet, a narrow dark visor slit and a red plume; a grey stone gargoyle with small bat wings, two short horns and yellow eyes; a cartoon vampire with a pale round face, slicked black hair, two small white fangs and a black cape lined with red. Row 4, left to right: a grey rat with round pink ears and a long pink tail; a little red imp with two small horns and a pointed tail, hugging a round black cartoon bomb with a short fuse; an orange salamander with yellow spots and a curled tail; a dark priest in a tall pointed purple hood with only two green eyes showing in the shadow of the hood; a big round red dragon with small folded wings, two cream horns, a cream belly and a grumpy frown. Each monster appears once. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

The order of the cells is the order of §5 (`bat` = `monster01` … `dragon` =
`monster20`). The slimelet is the slime's cut, drawn smaller.

### 11.15 Monster states, 4x1 — `parrynormal-object-state.png`

```text
A sprite sheet of four small objects for a casual mobile arcade game about a little witch fighting cute cartoon Halloween monsters, arranged in a strict grid of 4 columns and 1 row, each object centred in its own cell with wide empty space between the cells, all at the same scale, seen from the front, soft light from the top left. Left to right: a small heap of cartoon white bones with a round skull resting on top, its eyes drawn as two dizzy spirals, as if a goofy skeleton had fallen apart; a small mound of fresh brown dirt with a few pebbles, as if something were digging underneath; a cute small green toad sitting, with big round eyes and a sheepish smile; a round cartoon fireball of orange and yellow flame with a short flame tail pointing up. The flame is part of the fireball and stays inside its own outline. No other characters, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

`state01` the Skeleton's pile, `state02` the Gravedigger underground,
`state03` a toadified monster, `state04` the Dragon's fireball.

### 11.16 Super icons, 4x3 — `parrynormal-object-super.png`

```text
A sprite sheet of twelve magic power-up objects for a casual mobile arcade game about a little witch, arranged in a strict grid of 4 columns and 3 rows, each object centred in its own cell with wide empty space between the cells, all at the same scale, the same three-quarter front view, soft light from the top left, each one big and simple enough to read on a small round button. Row 1, left to right: a bright blue-white lightning bolt; an icy blue snowflake crystal; a golden ring of rippling magic like a wave rolling outward, drawn as two thick concentric rings; a round full moon in pale green with a soft crater pattern. Row 2, left to right: a small black witch's cauldron overflowing with round brown bubbles; three small friendly purple bats flying in a circle; a round orange fireball falling at an angle with a short flame tail; a ring of white salt grains on the ground forming a circle. Row 3, left to right: a witch's broomstick with a brown handle and golden straw bristles; a cute green toad with a tiny crown; a glowing pink-magenta five-pointed magic seal with a dark hole in its centre; a round glossy blue magic ball like a marble with a white highlight. The flame, the wave and the magic are part of each object and stay inside its own outline. No characters other than the bats and the toad, no faces on the objects, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

`super01`–`super11` are the supers in the order of §7. `super12` is the blue
ball, the hub's icon.

### 11.17 Pickups, 4x2 — `parrynormal-object-pickup.png`

```text
A sprite sheet of eight small magic items for a casual mobile arcade game about a little witch, arranged in a strict grid of 4 columns and 2 rows, each item centred in its own cell with wide empty space between the cells, all at the same scale, the same three-quarter front view, soft light from the top left, each one simple enough to read at a small size. Row 1, left to right: a plump bright green five-pointed star with rounded points; a round orange carved pumpkin with a lit fuse coming out of its stem, like a cartoon bomb; a fat white wax candle on a little brass holder with a warm orange flame; a rounded grey stone tombstone with a cross carved on its face and a little moss at its foot. Row 2, left to right: a round white spider web stretched across a small twig frame; a round glass potion bottle full of bubbling turquoise liquid with a cork; a glossy red heart with a white highlight; a small friendly purple bat with its wings spread and a happy face. The flame is part of the candle and the fuse's spark is part of the pumpkin, inside their own outlines. No other characters, no text, no letters, no numbers, no words on the tombstone. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, bold and readable at a small size. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

`pickup01`–`pickup07` are the pickups in the order of §2.4. `pickup08` is the
friendly bat the Familiars super circles the witch with.

### 11.18 Village houses, 3x2 — `parrynormal-object-home.png`

```text
A sprite sheet of six small cartoon buildings for the home village of a casual mobile arcade game about a little witch, a village set in a haunted wood at night, arranged in a strict grid of 3 columns and 2 rows, each building centred in its own cell with wide empty space between the cells, all at the same scale, all seen from the same slightly high three-quarter front view, soft light from the top left, each one standing on its own flat base. Row 1, left to right: a cauldron shop, a little crooked wooden stall built around a big black bubbling cauldron, with a striped purple and orange awning; a broomstick podium, a three-step stone podium with a golden broomstick trophy standing on the top step; a crystal ball, a big glowing violet crystal ball on a carved wooden stand, with a winding road map visible inside the glass. Row 2, left to right: a spellbook stand, a giant open spellbook on a lectern with sticker sheets tucked between its pages; a pumpkin cart, a small wooden cart full of carved pumpkins and wrapped gift boxes with ribbons; a bestiary tower, a narrow crooked stone tower with a pointed purple roof and a round window, with a big leather-bound book hanging as its sign. No characters, no faces other than simple carved triangles on the pumpkins, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, a cosy, magical Halloween mood. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.19 Stickers, 5x4 — `parrynormal-object-sticker.png`

```text
A sheet of twenty collectible sticker illustrations for a casual mobile arcade game about a little witch fighting cute cartoon Halloween monsters, arranged in a strict grid of 5 columns and 4 rows, each illustration centred in its own cell with wide empty space between the cells, all at the same scale and the same front view, soft light from the top left. The game's hero appears in some of them: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose, rosy red blush on the cheeks, under a big floppy purple witch's hat with a curled, bent tip and a dark red band; she is a face under a hat, with no body, no arms, no legs and no hands. Row 1, left to right: a cyan arc of magic shield bouncing a small orange ball away; the hero winking, with a small orange ball bouncing off her hat; a small purple bat hanging upside down in front of a full moon; a rounded grey tombstone with a grumpy carved face; a big green bubble rising out of swamp water. Row 2, left to right: a grey knight's helmet with a closed visor and a red plume; two small red devil horns on a little red imp's head peeking up; a round glossy brown ball with a white highlight; a carved pumpkin with a big toothy grin; a white wax candle on a brass holder with an orange flame. Row 3, left to right: a round white spider web with a tiny cute spider in its centre; a small heap of white bones with a dizzy skull on top; a cute green toad blowing a kiss, with a little heart floating from its lips; a ring of white salt on dark ground; a bowling-style scene of three cartoon monsters, a bat, a pumpkin and a slime, tumbling over each other. Row 4, left to right: a round full moon with a gentle smiling face; a perfect cyan arc of shield shaped like a crescent; the hero sitting proudly on the head of a big round red dragon who looks happy and tame; a golden witch's hat with a curled tip and a red band; the hero wearing a golden crown on top of her purple witch's hat and a small purple cape, proud. Each illustration is a die-cut vinyl sticker: a thick, even, pure white border runs all around its outline, the same width on every sticker, with a very soft grey edge on the outside of the white so it reads on a white page, and nothing else behind it; the stickers never touch each other. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline. Every hand has exactly five fingers: one thumb and four fingers, never four, never six. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

The order of the cells is the order of §10.1.

### 11.20 Menu decor objects, 4x2 — `parrynormal-object-decor.png`

```text
A sprite sheet of eight small Halloween objects for the menus of a casual mobile arcade game about a little witch, arranged in a strict grid of 4 columns and 2 rows, each object centred in its own cell with wide empty space between the cells, all at the same scale, the same three-quarter front view, soft light from the top left. Row 1, left to right: a round orange pumpkin with a short curly green stem, not carved; a witch's broomstick lying at an angle; a small black cauldron with a little green brew inside; a round potion bottle with purple liquid and a cork. Row 2, left to right: an old leather spellbook, closed, with a brass clasp; a small iron lantern with a warm orange candle light inside; a wrapped candy in orange and purple twisted paper; a small round crystal ball on a little brass stand. No characters, no faces, no text, no letters, no numbers. Painted cartoon style of a polished casual mobile game: soft painterly shading, rounded friendly shapes, rich saturated colours, a clear darker outline, a cosy, magical Halloween mood. Only the object itself, free-standing: no badge, no disc, no button, no frame, no rim, no backing plate, no border, no sticker outline around it. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.21 App icon — `assets/image/icon/parrynormal.png`

```text
A 1024x1024 mobile app icon for a casual arcade game about a little witch defending herself against cute cartoon monsters, shaped as a rounded square: the four corners are generously rounded, and the area outside the rounded square is empty. In the middle, large and filling about two thirds of the square, the hero: a round, glossy orange-yellow emoji-style face, like a shiny ball, with big glossy violet eyes with white highlights, a small rounded nose, rosy red blush on the cheeks and a confident smile, under a big floppy purple witch's hat with a curled, bent tip and a dark red band around it; she is a face under a hat, with no body, no arms, no legs and no hands. A thick bright cyan arc of magic shield curves around the right side of her face, and a small glossy orange ball bounces off it. Inside the rounded square, the background is a smooth vertical gradient from deep purple at the bottom to night blue at the top, with a pale full moon behind her hat. No text, no letters, no numbers. Glossy, polished 3D-rendered cartoon style like a premium emoji: smooth shiny surfaces, soft specular highlights, rich saturated colours, bold and readable at small sizes. Nothing around the subject: no sparkles, no stars, no glow, no aura, no halo, no smileys, no floating objects, no confetti, no motion lines, no decorative effects of any kind. Family-friendly cartoon art for an all-ages casual mobile game, made in line with the image platform's content policy and guidelines: no gore, no blood, no wounds, no realistic violence, no sexual content; playful, colorful and friendly. On a real transparent background, in PNG format.
```

### 11.22 Music — `assets/audio/music/parrynormal.mp3`

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
- **Monster animation.** One painted pose per monster, moved in code (bob,
  squash, flap). Frame sheets, as holepocalypse's zombies have, would come
  later and only for the monsters that need them.
- **The endless run's biome cycle**: every 20 monsters knocked out (§6), to be
  tuned on the bench.
