# Levels — 30 levels per game, one screen for the thirteen

The **web** and **android** targets are games people come back to, not a
creative shown once. What a returning player needs is somewhere to be: thirty
levels, a map that shows where they are, and stars that say how well each one
went. The playable keeps none of this — it is one round, it always was.

This document is the plan of record for that layer, **and the layer now
ships**: `packages/webshell/levels.js` and `levels.css` are the screen, and
all thirteen games declare a `web.levels` block. The mock stays where it was —
[`lab/level-map.html`](../lab/level-map.html), open it and pick a game — and it
is still where a change to the look is tried before it is shipped.

```
title screen (the web menu)  ->  LEVEL MAP  ->  the round  ->  end screen
                                     ^                            |
                                     +-------- back / next -------+
```

**The climb also feeds the meta layer.** A game that declares `web.meta` turns
a band passed, a band passed clean, the board and ninety of ninety into four
kinds of sticker, and a level's score into coins — `bandsState()` in
`levels.js` is what reads the bands back, and it lives here because the bands
are the map's. See [META.md](META.md).

______________________________________________________________________

## 1. The model

Nothing is authored per level. Every level is derived from where it sits on
the climb, which is what lets one screen and one formula serve thirteen games.

**Every level is the same kind of level. There is no boss, and there will not
be one** — what separates level 29 from level 3 is `d`, not a different shape
of round, so every node on the map is the same circle. Thirteen games would
otherwise each need a boss designed for them, and the whole point of this
layer is that it costs a table of ranges per game and nothing else.

### The map is a road with forks

The ladder is not a line, and it is not a line with bypasses either. It is a
**road that forks**: at a junction the player picks a side and **sees what
each side costs** — one level this way, three that way — and the two roads
rejoin further up.

That distinction is the whole design. A bypass drawn over a spine says *the
spine is the game and this is a cheat*; a fork says *these are two roads,
choose*. Missing the levels on the road not taken is fine — they are
something to come back for, not a debt, and the map marks them quietly rather
than scolding.

The graph, in order — a `line` is that many levels in a row, a `fork` is two
roads that split and rejoin, and **a road may ask for a total star count**
before it opens:

| section | left road         | right road | levels              |
| ------- | ----------------- | ---------- | ------------------- |
| line    | —                 | —          | 1 2 3               |
| fork    | **1 level**       | 3 levels   | 4 · 5 6 7           |
| line    | —                 | —          | 8 9                 |
| fork    | **2 levels**, ★14 | 4 levels   | 10 11 · 12 13 14 15 |
| line    | —                 | —          | 16 17               |
| fork    | **1 level**, ★30  | 3 levels   | 18 · 19 20 21       |
| line    | —                 | —          | 22 23               |
| fork    | **2 levels**      | 3 levels   | 24 25 · 26 27 28    |
| line    | —                 | —          | 29 30               |

Thirty levels, four forks, and it is always the **short** road that carries a
star gate when there is one — the short road is the favour, so it is the one
that costs. Two of the four are gated.

**A fork's two roads share one band of the climb**, and the band is as long as
the longer road. A short road spreads its levels across the whole band and
lands its last one at the top of it, so one level standing in for three is
*the hardest of the three*, not the easiest. Taking the short road buys time,
never an easier game.

| symbol | value                       | what it is                              |
| ------ | --------------------------- | --------------------------------------- |
| levels | 30                          | nodes in the graph                      |
| rows   | 24                          | steps of the climb the 30 sit on        |
| `d(n)` | `((row(n) - 1) / 23) ^ 0.9` | difficulty, 0 at the foot, 1 at the top |
| bands  | 5 × `Warm-up … Meltdown`    | a name for the card, nothing gated      |

`d` is the **only** thing a game is handed, and it comes from the node's *row*,
not from the number it wears. The exponent 0.9 front-loads the curve a little,
so the early levels separate from each other instead of all feeling like
level 1.

**There are no global star gates any more.** A gate belongs to a road, not to
a band of the map: a wall across the whole climb forces backtracking on
everyone, where a wall across *one* of two roads is a choice — take the long
way now, or go back and polish. Missing levels is not a failure state, so
nothing should stop the player dead for having missed some.

### Drawing it: an invisible grid

Three passes, and how the first two failed is the reason the third is built
the way it is:

- **a snake with dotted arcs bowed over it** — everything curved, everything
  dotted, nothing said which line was the road and which the detour;
- **free-placed nodes joined by cubic curves** — better, and it could show a
  fork, but the curves went where the maths put them, which was never where a
  road would go, and two of them crossing read as a mistake.

So there is a **grid**. Six columns wide, as many rows as it takes, and
invisible. The levels are dropped on cells — most cells stay empty, which is
the point — and a road is then just a walk from cell to cell: **across, and
up**. Nothing curves, nothing crosses, every corner is a right angle, and the
eye can follow one road without losing it.

| piece   | value                                                            |
| ------- | ---------------------------------------------------------------- |
| columns | 6, at 120 px — a level is 84 px, so a cell holds one comfortably |
| rows    | 64 px, and a level sits every **other** row                      |
| corners | 22 px radius, so the turn reads without looking like a circuit   |

**Levels sit on even rows and roads turn on the odd row between them**, so a
horizontal run can never pass through a level: the free row is reserved by
construction rather than checked for afterwards.

The placement is **random, and seeded by the game's slug** — thirteen games,
thirteen maps, each stable forever. Four rules keep a random map drawable, and
they are the only constraints:

- a level never takes its predecessor's column, or the road between them
  would be a straight line with nothing to read;
- **a fork node sits in column 2 or 3**, and its two roads take the columns to
  its left and to its right. The first pass let both roads pick from a fixed
  left half and right half of the *board*, and when the fork itself landed on
  column 1 both roads left rightwards and were drawn on top of each other —
  which is how you get a map where "left" and "right" mean nothing. Left and
  right are measured from the fork, never from the board;
- a fork's roads start **at least two columns off** the fork, so the
  horizontal run out of it has room for a wall with clearance either side;
- a merge takes **neither** of its two incoming columns, or one road's final
  climb would pass straight through the other road's last level.

Everything else is the dice. `lab/level-map.html` has a **path style** select
(`wander`, `tight`, `zigzag`, `edges` — how far the common road is allowed to
jump between columns) and a **re-roll the map** button, so the character of
the board is picked by looking at it rather than argued about.

**The shipped style is `zigzag`**, for the thirteen: the common road crosses
the board every time, so the climb never reads as a straight column and a fork
always has room either side of it. The other three stay in the lab, and the
seed stays the slug — one map per game, the same map forever.

**There is no sign on a road.** A `2 LEVELS` label was tried and it says
nothing the board does not already say louder: the two roads out of a fork are
drawn with their levels on them, so counting them *is* looking at them. The
only furniture on a road is its wall, and only a gated road has one.

**A gated road has a wall**, standing across the run a little past its middle,
and it has exactly two states with no words on either:

- **shut** — two stone halves meeting, a lock over the join. The road is
  painted in the player's colour right up to it and **stops dead there**.
  Tapping the wall is how you learn what it wants.
- **broken** — the stars are in, the halves are blown apart, rubble either
  side, and **the road's own colour runs through the gap** and on to the
  level.

The wall is across the road, so on a horizontal run it is a vertical bar. It
is not on the final climb: that climb is one row tall and the level sitting on
top of it covers most of it.

**A road is never seen behind a level.** The circles are opaque — a road
crossing one would read as a road going *through* it.

**The board slides UNDER the header and under the card.** The scrolling band is
the whole frame, and the two chrome bands are margins on the canvas rather than
insets on the viewport (`#lv-canvas`, rewritten in `draw` and `writeCard` from
the header's measured height and the card's own): the climb still starts below
the header and ends above the card, and what scrolls past either of them passes
beneath it. Clipping the viewport at their edge instead cut the road in mid-air
and sliced the top off a level's circle — an edge the eye reads as a rendering
fault, not as an edge. Everything that centres a level measures the visible band
back out of those two margins (`scrollTo`).

**Which is what the two chrome bands then have to hold on their own.** Under the
header the scrim runs from `rgba(0,0,0,.94)` to nothing over the band's own
height **plus 150 px past its edge**, in five stops rather than two: what sits
behind the wallet, the xp bar and the star counter is a live map, a number read
over a road is read twice, a scrim that stops at the header's edge stops *on*
something, and a straight two-stop fade shows its own middle as a band across
the picture. It is written in percentages, so the taller header the meta layer
builds (196 px against 150) wears the same curve and not a compressed one.

The card at the foot is a **panel** instead of a fade. It has a border along its
top edge, which is what separates it from the map, so nothing is asking its
background to do that job as well — and the third of it that used to fade up
from nothing was exactly where the level's name and its objective are written.
It sits at ~80 % black rather than ~95: the road is still read through it, which
is what a panel sliding over a map should let happen, and the border plus a
line that never wraps is what carries the text over it.

**Its three statements are one line each, measured.** The name and its band, the
objective and the note are single statements, and a statement that wraps reads
as two and pushes the card up the map. None of the three has a width anyone can
write down — the objective is a sentence per game per language, each game's own
face moves every width again, and the room itself changes with the column of
flames a wall's card hides — so they are `nowrap` and scaled DOWN to the room
they have by `Fit.box` (`packages/shell/shell.js`), the same measure-and-shrink
the intro and end titles ride on. The title row carries the size and its two
nodes are written in `em` of it, so the name and the band shrink together. Over
the thirteen games, both languages and every card, the fit bites at 26 → 23 px
at worst; a copy that needed more than that was shortened instead (`arcider`,
`blight`, `echomaze`). The endless card is the one exception: it is a paragraph
about what a perfect board just earned, not an objective, and a paragraph fitted
onto one line is unreadable long before it fits.

**Three stars makes a level burn**: gold rim, gold halo, a slow breath. The
map is read at a glance and a perfect level has to be findable in that glance,
which a change of border colour does not achieve.

**The stars beside a level are never clipped.** They sit left or right of the
circle depending on the room left in the *frame* — measured, not guessed from
the column — because they are the one thing on this screen that must always be
legible.

### Level 0 — the tutorial, off the climb

**The map opens on a lesson nobody is made to read.** Under level 1, one row
lower on the same grid, sits a node that starts no round: a smaller circle,
dashed, wearing a question mark instead of a number, joined to level 1 by a
*dotted* spur. It opens the **Help panel** — the game's own sentence with its
key words in colour, the shared finger acting the gesture out on the motor's
demo stage, and the keys that do the same thing.

Three properties, and each of them is the point:

- **It is optional.** Nothing is gated on it, no star comes from it, it is not
  in the graph (no edge, no place in the 90), and level 1 is open from the
  start whether it was read or not. A tutorial a player is *made* to walk
  through is a tutorial they skim.
- **It is where a player who does not know looks.** A board that has never
  been played opens on level 0 — the map scrolled to its foot, the card
  offering the lesson — and every later arrival lands on the level the player
  is actually at. Being first under the thumb is the whole of the nudge.
- **It is the same help screen, not a second one.** `menu.js` hands its Help
  panel to the level layer on mount (title, body, and `park`), so the copy,
  the FR/EN switch and the motor's demo stage — *moved* there and given back on
  the way out — can never drift from the menu's own HELP entry.

It opens **over** the map rather than under it: `#screen-intro` is a stacking
context of its own and the map sits above it, so the menu's panel cannot be
raised through — and sending the player back to the menu to read two lines
would lose the map they were standing on. ESCAPE closes the panel first, then
the map.

Once it has been read the ring goes solid and takes the accent, the way a
cleared level does — the only reward there is here. The flag lives beside the
levels in the same save (`h`), so erasing the progression forgets the lesson
too: a board back at zero is a player starting over.

### Ninety of ninety

A perfect board is its own state. Every road turns gold and glows — one filter
over the SVG, so no stroke has to know about it — the star counter in the HUD
burns with the same breath the levels do, and one more node appears above
level 30: **a star, not a circle, and it starts an endless run**. No
objective, no clock, no levels; there is nothing left to unlock, so the game
simply does not stop. It is the only thing on the map that is not a level, and
it only exists at 90/90.

**Tapping a wall opens the road's card**: which levels are down there, what
the other way is worth, and — if it is gated — where the missing stars are.
That last part names the cheapest levels to go back to (already cleared, short
of three stars, easiest first) as tappable chips, and says plainly when the
other road is open and waiting instead.

**Tapping the empty map closes the card**, and the road gets the whole frame
back. The card is docked and a third of the screen high, so a player who wants
to look at the climb they are on — or at the scene behind it — had nowhere to
put it. The target is tested rather than the coordinates: every node, wall and
read-out is a child of the canvas, so "the event stopped at the canvas" is
exactly "nothing was under the finger", and the road itself takes no pointer,
so the line between two levels counts as empty too. Tapping any node brings the
card back.

**How hot a level is, is five flames** and not a bar. The same `d` the tunables
are lerped with, spread over 1..5 rather than 0..5 — level 1 is a level, so it
owns one flame, and only level 30 owns all five. A flame is filled up to the
count, the one the remainder stops on is an outline, the rest are grey, and the
colour climbs green → gold → red with the position. They stand down the right
of the card, clear of a line that wraps. A bar said "42 %" of nothing in
particular; five icons say how hot the level is, which is the question the card
is actually asked.

### The objective, and the stars

A level's objective is one number on the same lerp, rounded to a step the
player can read (`600 m`, not `617 m`). Stars come off it:

| stars | score-shaped level   | clear-shaped level (escape, empty the board)              |
| ----- | -------------------- | --------------------------------------------------------- |
| ★     | the objective is met | cleared                                                   |
| ★★    | 1.5 × the objective  | cleared with the game's own spare counted (see the table) |
| ★★★   | 2.2 × the objective  | cleared with the spare above the level's bar              |

The second measure for a clear-shaped level is never invented: every one of
those games already counts it (`spareBonus`, `ballBonus`, lives left, time
left). This replaces the flat `score >= 3000 ? 3 : ...` thresholds the games
carry today, which become the level-15 row of the same formula.

**What is measured is the score, unless the game says otherwise.** A game whose
objective is not its score puts the measure in its `endRound` result as
`levelScore`, one field: `games/vipera` reports the metres, so a level asking
for `1 350 m` is not paid in gems. The playable ignores the field entirely.

**A level is cleared when the objective is met, not when it is attempted.** A
run that misses it is recorded — the try counts, and a better replay can still
take the stars — but it opens nothing, because a level you cannot fail is a
button, not a level.

### The round carries its own stars

Three thresholds on one number are worth nothing to a player who cannot see
where they stand against them — that is an endless run with a score to
remember. So the round wears a pill in the **bottom-left corner**: the level
number, the three stars lighting as they are crossed, the next threshold, and a
bar walking toward it. Not *in* the HUD: the top band is the game's, all of it,
and the thirteen fill it differently. `--hud-h` and `Layout` are untouched — the
pill is an overlay, the world runs under it.

It hung under the HUD, centred, until it was read against real frames of all
thirteen: that is the one place every game puts something (the first row of a
bubble wall, the ceiling of a shaft, an incoming rope), and being tucked there
also kept it small — 18 px against the HUD's own 28 px pills and its 78 px
score, so the number that says how the run is going was the smallest thing on
the screen. The bottom-left corner is free in twelve of the thirteen and
mirrors MENU / OPTIONS in the opposite one, which is what lets it be read at
size.

The two corners are therefore the SHELL's, and a game anchors no instrument and
no word in either. Two games had to answer for it:

| game             | what was in the corner                            | what moved                                                        |
| ---------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `games/arcider`  | the shield rail down the left flank, and the km/h | the game: both to the right flank, above MENU / OPTIONS           |
| `games/slipdeck` | the five-card hand, edge to edge, and its worth   | the pill: `--lv-hud-bottom:392px` in its SKIN, onto the free felt |

`--lv-hud-left` and `--lv-hud-bottom` are the escape, and they are a SKIN's to
set. Read the corner off a real frame before writing a number
(`assets/image/screen/<slug>-NN.jpg` is the web build, not the playable).

What it reads is `Game.levelProgress()` when the game has one and the HUD score
otherwise — **the same rule as `levelScore`**, so a level can never be scored on
one number and shown against another.

**A game may CAP what those bands pay**, with `Game.levelStars(stars, value)`.
The objective stays the measure and a level is still cleared by meeting it — the
hook only ever takes stars away, never hands one out that the value did not
reach. It is for a round whose result is not a quantity: arcider's board is a
race, so the flag has to be crossed before the distance pays in full (below),
and echomaze's is a door, so the gate has to be found (below too).
The cap runs on the live pill as well as on the result, so the stars a round
wears are the stars it will be paid; the bar under them keeps walking the raw
bands, because the distance to the next threshold is the same either way.

**The third star ends the round.** There is nothing left to earn, so the game
stops asking: a gold flash, the callout, then slow motion easing the world down
to 12 % over ~0.6 s, a beat of hold, and the end screen. Arriving there fast is
the point — a player who has maxed a level should not have to die to be told so.

The slow-down is `Loop.rate(k)`, one number in the motor: the frame keeps
rendering at 60 and the simulation is handed a shorter `dt`, so the world, the
round clock and the game's update ease off together — the same reason
`Loop.pause()` freezes all three at once. `Loop.start` resets it, so a rate left
behind by one round cannot leak into the next.

The round itself is ended by **`Game.levelWon()`** when the game has it, because
the end screen's stat rows are the game's own and a result built outside would
have none of them (`games/vipera` points it straight at its own `die()`).
Without the hook the level layer ends it with what it knows: the score and the
measure.

### The outro — the round's last word, before the end screen

A round used to cut straight from its last frame to the end screen, and the one
thing that cannot be played on either side of that cut is **the world itself
reacting to how the round went**: slow motion is `Loop.rate`, so it needs a loop
still turning, and the end screen has none.

`onOutro(fn)` is the motor's third addition (`packages/shell/shell.js`) and the
level layer is its only registrant. The clock is stopped — the round is over
whatever is drawn over it — the loop is left running, and the end screen waits
for the `done` the hook is handed. A playable registers none and keeps the cut
it always had.

| the round ended with | what the outro plays                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| **three stars**      | the shine has already played; the world is held at 14 % while the meta layer's BONUS is handed over        |
| **one or two stars** | slow motion down to 22 % over ~0.5 s, a beat of hold, and nothing else                                     |
| **none**             | the frame goes red, fire climbs it from the bottom edge, the world grinds down to 16 % — about 1.2 s of it |

The three-star case is where the meta layer's gift now opens (see
[META.md](META.md)): **over the round that earned it**, not on a score screen
two beats later. A game with no `web.meta` block holds the beat and goes on.

The shine itself is gold from end to end — a full-frame flash, two rings out of
the middle of the play area, and a glow on the edges for as long as the slow
motion lasts. There is no confetti: that canvas lives inside `#screen-end` and
is not over the round.

Only a LEVEL has an outro. A free round and the endless run end the way they
always did, because there is no objective to have missed.

### What the end screen says, and the two ways out of it

The title is the LEVEL's, not the game's: a round that met its objective reads
**SCORES** and a round that missed it reads **ALMOST**, in the red the motor
paints an untitled end screen with. "TORN APART" over a cleared level is a story
about a viper that has nothing to do with the level.

There are **three** buttons, drawn rather than written — **the map**, **the
level again** and **the way on**. The first two are the motor's own nodes,
moved into a row of their own; the third is the shell's, because a NEXT LEVEL
is a level-layer idea and the motor — which is also a playable's motor — must
not learn what one is. What the round earned decides which of the first two
shines:

| the round ended with | the map | the replay |
| -------------------- | ------- | ---------- |
| **three stars**      | lit     | a whisper  |
| **one or two stars** | plain   | plain      |
| **none**             | whisper | lit        |

**NEXT is never dressed** and never joins that argument: those two trade the lit
state because the round decides whether *go on* or *try again* is the offer, and
a third contender would make all three quieter. It is the same weight whatever
happened.

**All three are the same SIZE, at every star count.** The lit one used to grow
to 116 px and the quiet one to shrink to 84 — so the row of three was a
different row at 0, 1, 2 and 3 stars: three widths, three gaps, three positions
for the same button, and a control that grows moves the two beside it every
time the round changes its mind about which one is the offer. They are 104 px
throughout; `hero` is the fill, the halo and the slow breath, `dim` is the
colour turned down, and neither costs a pixel of layout. The one thing that
changes the row's width is NEXT being HIDDEN, which is a button that is not
there rather than a button of another size.

It is **`last.level + 1` and nothing cleverer** — the map is where a FORK is
chosen, and this is the button for the player who is not choosing. It is
**hidden**, not disabled, in the three cases where there is no way on: no level
was played (a free round, a mode), the round did not clear its objective so the
level ahead is still shut, or the level just finished was the last one. Level 31
is the endless star and it belongs to the map: a board finished at 90/90 is a
screen to be shown, not a round to be dropped into.

It rides the motor's own reveal rather than a timer of its own —
`#btn-replay.show ~ #btn-next` in `menu.css` — so it lights with the button the
motor lights last and, the half that matters, goes dark with it when `setState`
strips `.show` on the way out of "end". A button left invisible and clickable
over the next round is a bug this codebase has already paid for once.

All three carry `cursor:pointer`: `dress()` rewrites `className` on the motor's
two, which drops the `.btn` / `.link` that carried it, and on a desk they read
as decoration until the pointer changes over them. The reveal itself also runs at **twice the speed it was
authored at** (`PACE` in the motor's `EndScreen`) — it was tuned for a creative,
where the end screen is the last thing a viewer sees.

______________________________________________________________________

## 2. The thirteen games

**All thirteen ship.** Each one declares a `web.levels` block in its manifest
and nothing else; the ranges below are what the block carries.

### What the objective measures

Three games measure **metres** — they are distance runners whose stat rows
already show a distance, and paying for it with pickups would be a lie, so they
report it as `levelScore`. The other ten measure **the score**, which is what
the motor hands the filter by default: no per-game plumbing, and it is the one
number every one of them already tunes, displays and grades itself on.

That is a deliberate narrowing of the first draft, which gave each game a
flavour objective — *seat 64 balls*, *escape the maze*, *clear the wall*. Two
reasons it did not survive contact:

- **the third star now ENDS the round**, so the objective is not a ceiling a
  good run brushes, it is the length of the round. Calibrating thirteen
  different counters to a duration, blind, is thirteen guesses; calibrating one
  counter against a threshold each game already ships is one rule;
- a flavour counter that the game does not already grade itself on has no
  anchor at all. `escaped` is a boolean, not a ladder.

So every range below is derived the same way: **`objective(level 15) ≈ the game's own three-star threshold ÷ 2.2`**, with the ladder spread `L30 ≈ 6.5 × L1` around it. A level-15 three-star run is therefore worth about what a
three-star run is worth in the shipped game, which is the only honest anchor
available before a bench exists. The flavour objectives stay on the table for
when one does — the machinery takes them unchanged, through `levelProgress()`
and `levelScore`.

| game           | round shape          | measured on | the objective a level sets | what the thirty levels move (`L1 → L30`)                                                                                                                                                                                           |
| -------------- | -------------------- | ----------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **arcider**    | a race, to the arch  | metres      | `200 → 1 300 m`            | 27 knobs, and a table — the one game that uses `applyLevel`, below                                                                                                                                                                 |
| **blight**     | 60 s, bubble shooter | score       | `350 → 2 300`              | `startRows 4→11`, `blightInterval 3.4→1.2`, `addRowShots 8→3`, `shotSuperChance .20→.05`, `wallSuperChance .10→.03`                                                                                                                |
| **bouncetry**  | ends with the balls  | score       | `350 → 2 300`              | `rows 7→11`, `startBalls 8→4`, `multiBalls 3→2`, `bonusBricks 4→1`, `pullAfter 7→4`                                                                                                                                                |
| **chainring**  | timed, on the beat   | score       | `700 → 4 600`              | `gameSeconds 24→60`, `travelBeats 8→3.5`, `travelBeatsEnd 6→2.5`, `gapChance .02→.35`, `gapChanceEnd .35→.85`, `breakAfter 4→2`                                                                                                    |
| **echomaze**   | ends with the pulses | score       | `500 → 3 500`              | `cols 10→16`, `rows 7→13`, `startBalls 8→4`, `ballLife 14→8`, `revealSeconds 2.6→1.5`, `bounceJitter .03→.09`, `surgePeriod 1.15→0.85` — **and one rule per band**, below                                                          |
| **gearball**   | 45 s, fill the ring  | score       | `1 100 → 7 300`            | `ring.gears 6→12`, `ring.speed 240→420`, `ring.accel 3→9`, `ring.magSize 4→2`, `ring.reload .34→.60`, `ring.lives 5→2`                                                                                                             |
| **marshmelt**  | endless, rising lava | score       | `125 → 850`                | `riseSeconds 110→45`, `lavaEnd .22→.45`, `spawnEvery .9→.45`, `fastChance .2→.65`, `rampSeconds 90→40`, `airShots 2→1`                                                                                                             |
| **orbinity**   | 30 s, orbits         | score       | `250 → 1 700`              | `planet.start 4→2`, `planet.max 5→3`, `planet.rMax 70→48`, `planet.shrink .7→.42`, `comet.speed 440→760`, `comet.trapAfter 2.4→1.2`                                                                                                |
| **pawko**      | five waves of balls  | score       | `17 000 → 45 000`          | `play.balls 10→14`, `play.specials 8→2`, `play.malusGates 0→2`, `play.pegValue 10→20`, the four `play.gate.*` values ×3 — the board pays more as the level climbs, and opens poorer                                                |
| **radiam**     | 40 s dial / eclipse  | score       | `2 100 → 13 900`           | those four knobs, **and a table** — the second game to use `applyLevel`, below                                                                                                                                                     |
| **slipdeck**   | 30 s, poker swipe    | score       | `475 → 3 100`              | `play.chuteDepth 4→2`, `play.shoeBias .85→.40`, `play.fuse 4.6→2.2`, `play.fuseRamp .06→.18`, `play.fuseFloor 1.6→0.9`, `play.lives 4→2`                                                                                           |
| **spinshock**  | endless, top battle  | score       | `350 → 2 300`              | `spawnEvery 1.8→0.6`, `spawnEveryEnd .9→.32`, `maxFoes 3→7`, `drainBase .03→.07`, `drainRamp .035→.085`, `spinStart 1→.7`                                                                                                          |
| **stratideck** | a battle, turn-based | score       | `700 → 3 000`              | `play.cols 4→8`, `play.rows 3→6`, `play.traps 0→5`, `play.deckRatio 1.1→.6`, `play.enemyBias -1→1.2`, `play.deckBias .6→-.2` — the camp grows, the deck shrinks against it, and a lost battle is capped at one star (`levelStars`) |
| **triverse**   | endless, 3 lanes     | metres      | `180 → 1 200 m`            | `speedMin 440→680`, `speedMax 820→1250`, `ramp 26→12`, `diffFull 900→320`, `hazardMax .50→.95`, `gapNear 340→250`, `lives 4→2`                                                                                                     |
| **vipera**     | endless, the burrow  | metres      | `100 → 650 m`              | `speedMin 280→430`, `speedMax 480→680`, `diffFull 900→340`, `rowMax .55→.95`, `gapTight 240→165`, `lives 4→2`, `anchorHigh 400→540`                                                                                                |

The three distance ranges are calibrated on **duration**, not on a threshold:
their speed ramps are known, so a target in metres converts straight to a round
length. All three run from roughly 27 s at level 1 to 95 s at level 30.

### Check the direction of every knob

Two rows of this table were written backwards on the first pass and both would
have made level 1 *harder* than the shipped game:

- `rowMax` (vipera) is the share of spawn slots that become a thorn row, so it
  **rises** with the climb; the draft had `.95 → .52`;
- `hazardMax` (triverse) is the hazard chance at full difficulty — same shape,
  same slip, `.95 → .50` in the draft.

Nothing about a knob's direction is guessable from its name: `diffFull` falls
because it is *metres to full difficulty*, `lives` falls, `speedMin` rises.
Read what it does, then write the row.

### arcider — the first game to use `applyLevel`

A lerp says *harder*. It cannot say *different*, and thirty levels of the same
road driven faster is one level played thirty times. arcider is where the other
half was built, and the shape of it transfers to any game that wants it:

- **five biomes, one per stretch of the climb**, six levels apiece: DUSK, DAY,
  MIST, OVERCAST, NIGHT. A biome is a painted horizon out of
  `assets/image/master/` — `arcider-sky-night.png` reaches `CONFIG.art.skyNight`
  like any other picture, no manifest key — *and* the palette the canvas is
  painted with under it: the plain, the two tarmac tones, the kerbs, the grid,
  the stars. Swapping the picture alone would put a blue daylight sky over a
  violet dusk road, which reads as a bug.

  Two things the five taught. **A biome has to differ in HUE, not in
  brightness**: DAY and OVERCAST are both bright blue skies and were first
  given two blue roads, which made twelve levels look like one biome — they are
  deep cobalt with gold and pink kerbs against teal with orange and aqua now,
  and the skies read as different weather because the world under them does.
  And **the plain has to sit clear of the tarmac in value**, or the road's edge
  is carried by the kerbs alone and the whole mid-frame flattens into one
  sheet. MIST is the one that inverts it: the picture is a cool sky over an
  apricot horizon with the city dissolved in white, so its road is PALE and the
  plain around it dark — a near-black tarmac under that sky reads as a
  different scene rather than as the same weather.

- **thirty fixed traces**, `CONFIG.ladder.road`. The road's four sine phases
  were rolled at every `reset()` — right for an endless creative, wrong for a
  ladder, where a level has to be the same road twice. Each row carries the
  four phases and four weights saying what KIND of road it is (a sweeper, a
  slalom, a rollercoaster); `d` scales the weights, so the table owns the
  character and the climb owns the severity.

- **one new hazard at a time.** `CONFIG.ladder.unlock` forces a hazard's chance
  to zero below the level it is introduced on — walls at 3, mines at 5, ramps
  at 9, a ramp wall with no gate at 13 — and the manifest's lerp owns it above.
  A ladder that opens with the whole catalogue teaches none of it.

- **the road may never out-steer the craft.** A bend's amplitude times its
  frequency times the top speed is how fast the tarmac travels sideways, and a
  table that moves amplitude and frequency together reaches 964 px/s against a
  craft that steers at 720 — a road nobody can stay on. Both amplitudes are
  scaled down together until that fits a share of `steer` the climb decides
  (0.30 at the foot, 0.60 at the top, against the 0.42 the endless road sits
  at). It falls on the fast traces first, which is why a slalom comes out tight
  and shallow and a sweeper long and wide.

**The grid is laid out by when each pilot is caught.** The field used to be
stacked at a fixed gap — nineteen craft 300 progress px apart span 140 m of a
440 m race — so the player reeled in the whole pack in the opening seconds and
then drove alone to the flag. A race has to hand over an overtake every so
often, all the way in.

So a pilot's place is derived rather than spaced. The player closes on a pilot
at `1 - pace` of the base speed, so putting it `f * R * (1 - pace)` metres up
the road, `R` being the race and `f` the share of it that should be driven
first, has it caught at exactly `f`. The nineteen values of `f` are dealt
SECTION BY SECTION — each stretch between two gates gets its share of the pack
and the last one always gets two — so no section is a lonely cruise and none is
a wall of traffic, at every level and whatever the field size. The last of them
sits just past the flag because the schedule assumes a craft that never boosts,
and a booster is +72 % for three seconds: it closes on the leaders hardest,
which is what a booster is for.

Two consequences worth knowing:

- **the fastest pilots do not start furthest up the road.** A pilot the player
  barely out-paces cannot be far ahead and still be caught, so the grid order
  is not the pace order and it sorts itself out over the first seconds. The
  rank counts positions, so nothing downstream cares;
- **a gate can no longer be spaced evenly.** A gate asks for a share of the
  field to be behind the player, and spaced evenly the early ones land before
  the places they ask for exist — a clean drive eliminated by arithmetic. The
  gates now cut the race into sections that SHRINK into the run-in, and the
  grid is dealt into those sections, so the ordering is settled: gates first,
  field after. The playable's four moved with it — 280/520/780 became
  420/675/905 — for the same reason.

**And the checkpoints lost their arches.** Three lit gantries on a run is more
furniture than a road can carry, and a pair of coloured columns growing out of
the horizon reads as something to avoid rather than something to cross. A
checkpoint is a coloured line on the tarmac now, green or red like the arch
was; what it stopped saying is said twice already in the corner the eye is on —
the rank pill counts it down in metres and the board rail is green or red the
whole way in — and a third time by the vignette and the chime at `cutWarn`.
Only the finish keeps its arch, because it is the only one that ends the race.

**And the arch stands on the third star.** arcider's race ends at a chequered
gate, and the shipped one was nailed to 1020 m while the objective climbed to
1300 — the top third of the ladder asked for more metres than the track had.
The cuts are now built per level from the objective itself, the last of them at
`ceil(objective * 2.2)`: the race and the level end on the same metre, which is
the only way both can be true — what that metre pays is then the place it was
reached in (see the star table below). Two details that are not cosmetic:

- `200 * 2.2` is `440.00000000000006`, so an arch at 440 is crossed with the
  third band still unearned and a race won in first place pays two stars. The
  finish is **ceiled**;
- the measure had to become the distance actually driven. arcider's `travel`
  counts double under a booster — it is the score's distance — so a level
  asking for 900 m was met at 600 m of tarmac, and the third star fired well
  before the flag. `levelProgress()` and `levelScore` both report `dist`.

`levelWon` points at the game's own `win()` rather than `die()`: a shell-side
third star could only ever land at the flag with every cut behind it, so the
podium is the truthful ending.

**And the stars are the race, not the distance.** The flag standing on the
third star made a won race worth three stars whatever place it was won in —
twentieth past the post paid the same as first, which is not what a race says.
`Game.levelStars` caps the bands into the result the board actually reads:

| the run                              | stars |
| ------------------------------------ | ----- |
| the flag crossed in **first place**  | 3     |
| the flag crossed in any other place  | 2     |
| short of the flag, objective covered | 1     |
| short of the objective               | 0     |

The cap also holds the live pill to one star until the flag, which is why
arcider never plays the shell's three-star slow motion any more: nothing raises
the count before the flag, and the flag ends the round through `win()` on the
same frame.

Three things had to move with it, because a star table is only as true as the
race under it:

- **the flag eliminates nobody.** It used to ask for the podium like every
  other cut, so a run driven to the last metre outside the top three was told
  it had been ELIMINATED there — and under the table above that pays the same
  single star as a crash at a third of the distance. The culling belongs to the
  checkpoints; the finish ends the race for whoever reaches it, and its `rank`
  is now the place worth taking rather than a wall;
- **the field is dealt per section, two of them reserved for the run-in.** The
  grid used to spread its nineteen overtakes on one ramp from the line to just
  past the flag, which a boosted run walked through by four fifths of the way
  before cruising home alone. Each stretch between two gates now gets its own
  share of the pack, spread strictly inside it, and the last one always holds
  `lastFoes` = 2: one caught halfway down the run-in, one scheduled just past
  the flag. A clean drive finishes second; the win is what a booster buys;
- **the sections shrink** — `S + 3 - i` — so the race tightens as it is driven
  and the run-in is the shortest stretch of it. Even sections were tried and
  they pull the first gate to a quarter of the race, where the six overtakes it
  asks for land on a craft that has barely left `speedMin`.

Measured over twelve seeds a side, driven by a scripted pilot: reaching the
flag went from 5/12 to 12/12 at level 6 and from 4/12 to 9/12 at level 14,
while winning the race fell from 9/12 to 5/12 at level 22 and from 5/12 to 1/12
at level 30. Finishing got easier, the third star got dearer, which is the
whole point of separating them.

**The first biome opens on a run of boosters.** Levels 1 to 6, between the line
and the first checkpoint and nowhere else: `play.openBoost` puts a pad on four
slots in five and `play.openGap` lays them closer together, on a shallow weave
the craft can ride from one to the next rather than scattered across the
tarmac. That stretch is where a player meets the machine and it was the slowest
road in the game — the slots are at their widest down there and three in ten
carried a pad — so the race opened on a long quiet cruise. The same pilot
spends 26-42% of it boosted where it used to spend 7-16%, and a later biome, a
later section and the playable are all untouched.

### radiam — the second, and what it took from arcider

The same two halves, on a board rather than on a road, and it is worth reading
next to arcider because the pieces map one for one: `CONFIG.ladder.biomes` is
the same idea as arcider's, `CONFIG.ladder.levels` is its `road` table, and
`applyLevel` is the same hook doing the same job.

- **eight special beads where the dial shipped with two.** CHARGE unzipped a
  plate and NOVA took a colour off the board, and that was the whole catalogue
  for thirty levels. There are now six more — BOMB (the whole dial, and the
  supers it reaches go off in turn), FIRE (the two rays either side), LASER
  (through the hub and out the far side), SCORE (an x2 / x5 / x10 window on a
  clock), SLOW (the eclipse's ink held back) and ICE, the one hazard: it
  matches like any bead and freezes the plate it breaks on.

- **thirty rows naming which one or two are in play.** This is the part a lerp
  cannot say. Almost every row carries one or two of the eight and never the
  catalogue, so a level is *the one where you meet the laser* — and the six new
  ones each arrive alone on a level with nothing else new on it. A pool with no
  big special pays its big beats in small ones rather than reaching outside the
  level for something the player has not met, which is what lets levels 1 to 3
  be CHARGE and nothing else.

- **the bead is a PAINTED BALL, and it turns over every two levels.** Twenty
  designs, each painted in the five game colours plus a rainbow for the wild
  bead, out of six sheets in `assets/image/master/` and cut into
  `assets/image/object/`. Fifteen of the twenty ship:
  one per pair of levels, so thirty levels are fifteen boards, and the sixteenth
  — the star — is held back for the endless run a perfect board unlocks,
  because that node on the map is drawn as a star and nothing else is.

  The five left behind were not a shortlist, they were a collision. Every one of
  them paints a motif dead in the CENTRE of the ball — a star, a ringed planet,
  a four-point sparkle, a diamond, a bullseye — and the centre of a bead is
  exactly where a special's glyph is struck. A painted bullseye under the
  CHARGE's concentric rings is not a style, it is a bead the player reads twice.

  This replaced five bead MATERIALS the game painted itself, ported out of
  `lab/bubble.html` — sticker, soap, gem, ink, neon. They were good and they are
  gone: painted art beats a canvas pastiche of it, and keeping both would be two
  systems doing one job. The enamel bead survives as the fallback, so a build
  with no artwork still draws a legible dial.

- **five biomes of six levels, and a biome is the MACHINE now.** It was the
  bead as well, for one build. A bitmap cannot be retinted, so the five hues
  are fixed — *sampled off the paintings*, not chosen next to them, because
  everything drawn around a bead (the armed ray's bar and halo, the flare, the
  vignette, the HUD punch) has to agree with the marble it is drawn around — and
  a biome repaints the hall, the line work, the housing tracks and the hub. The
  room changes every six levels, the board every two.

- **the badge never touches the hue.** The colour of a bead *is* this
  gameplay, so every special is drawn OVER its own material: one gold breathing
  rim on every boon (*there is something here*, legible at 22 px on the inner
  plate) and one white glyph on a double pass of near-black ink inside it
  (*which one*), with the eight silhouettes picked to share no outline. ICE is
  the one exception and deliberately so — a frost crust and a cold rim, because
  gold on this dial means a reward.

- **two clocks, and both are capped by construction.** The score window takes
  the bigger of two faces rather than stacking them, because the combo already
  multiplies everything once; and the cold may hold two plates and never all
  three, with a seconds fallback under the ray counter, so a board that cannot
  pay can never leave a plate locked for the rest of the round.

- **the score window multiplies the RAYS, not the waves.** It multiplied
  everything on the first build, and the bench put a number on why that could
  not ship: level 28 (bomb + score) paid `1.37M` against level 27's `101k` —
  adjacent levels in the same band, thirteen times apart. The cause is
  arithmetic rather than tuning. A ray pays `rayScore * combo`; a bomb pays
  `blastScore * combo * ramp` across thirty-six beads, two orders of magnitude
  more before a multiplier touches it, so a window over the blast is a window
  over the whole round. Narrowed to the rays, the two powers also stop saying
  the same thing: a bomb is the board cleared, a window is a few seconds in
  which *finding* an alignment is worth ten of them.

  **It narrows the gap, it does not close it**: rerun per second of round, the
  same pair goes from 12.6x to 5.8x. What is left is the multiplier doing its
  job, and it is overstated by the pilot — a solver finds a ray almost every
  move, so a ray multiplier is worth more to it than to anyone. Closing the
  rest is a human-run question, like the objective itself.

**The objective did NOT move, and what that cost to find out is worth keeping.**
It was raised to `2 100 → 17 500` on the obvious reasoning — eight specials pay
more than two, and the third star *ends* the round, so an unchanged objective
would close the top of the ladder in seconds. Two scripted pilots then said
that the reasoning had nothing under it, and they disagreed by three orders of
magnitude:

- a **blind** pilot, turning plates at random, scores `33 000` on level 1 and
  `780` on level 30 — a *falling* curve, because what it measures is how long
  the eclipse tolerates someone who cannot find an alignment;
- a **greedy** pilot, reading all three plates and all twelve detents and
  always playing the best move, scores `600 000+` and never dies on 22 of the
  30\. That is not a tuning result either: in this mode one paid ray freezes the
  shadow for two seconds, so a solver that always finds a ray is **immortal by
  design** and its score is only "points per second times the bench ceiling".

Neither is a player, and a range they bracket 100× apart calibrates nothing. So
the shipped numbers stay, and radiam joins the other twelve in §5: the objective
is a table, and a human run is what settles it.

**The same bench did settle something else**, because that comparison is between
two levels rather than against a table — see the SCORE window above. It is the
finding the exercise was worth.

### The two that needed more than a table

**slipdeck — the tunables were in the wrong section.** `HAND_SIZE`,
`CHUTE_DEPTH`, `SHOE_BIAS`, `FUSE`, `FUSE_RAMP`, `FUSE_FLOOR` and `LIVES` were
`var`s local to section 6, so nothing outside could lerp them. They are now
`CONFIG.play`, and section 6 re-reads them on every `reset()` — which is the
pattern any game needs when it caches a knob in a local: **a value copied when
the file parsed never sees the lerp**. `games/blight` had the same problem with
three of its five (`addRowShots`, `wallSuperChance`, `shotSuperChance`) and got
the same `readTunables()` call. Every other game already held its knobs behind
a live object reference (`var T = CONFIG.play`, `var R = CONFIG.ring`).

**blight — the win condition did not have to change after all.** The first
draft wanted "clear the wall, however long it takes", which meant a new end
condition, `gameSeconds` at 0, and stars read off shots spent. Measuring the
score instead keeps its 60-second round exactly as it is, and the third star
ends it early when it is earned. The board-clear objective is still the better
one, and it is still one `levelProgress()` away whenever a bench can calibrate
it.

### echomaze — the stars are the gate, and the rack is the score

Its objective stays the score, but a run that empties the rack into five dead
ends was worth three stars for the walls it mapped — which is the same lie
arcider's distance told about its race. The board has one question, and it is
the door, so `Game.levelStars` caps the bands onto it:

| the run                                              | stars |
| ---------------------------------------------------- | ----- |
| the gate found for the **fewest pulses it can cost** | 3     |
| the gate found, whatever the rack cost               | 2     |
| no way out, objective covered                        | 1     |
| no way out, short of the objective                   | 0     |

The top band is `shotPar`, not a constant: one pulse on most boards, **two on a
board whose crystal stands in a dead end**, because the key is a whole shot
there and three stars has to keep meaning "as cheap as this board can be"
rather than "impossible".

The third band is a cap over a value the score has to reach anyway, so the
escape had to become worth reaching it with. **A pulse left in the rack pays
`spareBonus` (1500), and a pulse spent can never farm that much** — a whole
extra run through the maze is a few hundred points of walls, bounces and rows.
So the maximum score of a board *is* the first-shot escape, the two rules agree
by construction, and trying the six doors by elimination is paid for out of the
total. `escapeBonus` (3500) plus the rows a climb pays is the floor of an
escape: it clears 1.5x the objective at level 30, so finding the gate is worth
its two stars however long it took.

The cap holds the live pill to one star until the gate, so the shell's
three-star slow motion can only ever land on an escape — where the game was
already holding the frame for its own callout.

The playable has no objective to cover, so it reads the same ladder against
`CONFIG.parScore` instead. It is benched, not guessed: on the shipped board a
rack emptied into wrong doors scores 5 600-6 800 over six seeds and a single
pulse scores ~2 300, so **5 000** is a rack spent reading the maze rather than
one lucky shot. The same bench prices the rest of the ladder — a first-shot
escape is ~13 500 against a last-pulse escape's ~9 500, which is the 1 500 a
pulse is worth, five times over.

### echomaze — one rule per band, and the band comes off `d`

The lerped knobs above only ever make the same board bigger, darker and shorter
on pulses: a ramp of PERCEPTION, and by level 30 the player is doing nothing
new, only faster. So each of the five bands of `CONFIG.bands` now carries the
RULE that arrives with it, declared on the band and read through `applyLevel`:

| band        | rule               | what it adds to the read                                                                                                                                                                                                                                                                                 |
| ----------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Warm-up   | —                  | the board, and nothing else                                                                                                                                                                                                                                                                              |
| 2 Pressure  | `decoys: 2`        | three gates in the ceiling, one drawing at every moment of the round; the only tell is the beacon that pulses out of the true one while the board is powered up — a thing that HAPPENS on it, never a thing the other two lack; a pulse that climbs into a false one is eaten and takes the gate with it |
| 3 Squeeze   | `crystal: "split"` | the ceiling is barred until the crystal is shattered — in the bay (a ricochet) over the band's lower half, in a dead end (a whole pulse, and `shotPar` moves to 2) over its upper half                                                                                                                   |
| 4 Overdrive | `surge: true`      | an electric fence along the mouth row with ONE gap in it, and the gap tours the doors a step a beat, in an order that is random per board and then repeats; a pulse that meets the fence is destroyed on it, and the door it struck BURNS OUT — open for the rest of the round and out of the tour       |
| 5 Meltdown  | all three          | —                                                                                                                                                                                                                                                                                                        |

Two things make this hold together rather than being five special cases:

The fence is a TIMING instrument, not a second memory test. Nothing is shown up
front and no phase is paused for it: the gap is lit, the cycle turns from the
moment the lights go out, and what has to be worked out is the ORDER it tours
in — a pulse takes the better part of a beat to climb out of the bay, so the
shot is fired at the door the gap is about to reach and never at the one it is
standing on. Its first shape was the opposite (one door sealed, a cycle
rehearsed in a phase of its own before the round) and it was two memorisations
stacked on one board; inverting it made the same knob a skill.

A door only stops one pulse. It destroys that pulse and burns out: it stays
open for the rest of the round and leaves the tour, which keeps turning over
the doors that are left. So a mis-timed shot is paid for once and BUYS
something — the door it was aimed at is free from then on — instead of being a
toll the same door can charge again and again, and a board where the true
corridor sits behind an unlucky door cannot become a war of attrition against
the clock of the fence. The pulse dying on the wire is what holds the price up:
one thrown back would rattle round the bay and take two or three more doors
down on the ricochet, so a single bad shot would open the whole fence. One
pulse, one door. A shot that goes through the gap costs nothing and changes
nothing: the pulse is in the maze and the cycle turns on.

What it measures as, on the same headless pilot: band 4 escapes 8/8 on **2.9
shots** where the open board took 5.0, and scores ~35% more. That is not the
fence being kind — it is the fence spacing the shots out. A pilot that fires
whenever it is ready empties the rack into the same corridor; one that has to
wait for the gap fires once, watches, and keeps the rest of the rack, which is
what `spareBonus` pays for. The cost lands on a mis-timed shot instead.

- **The band is `min(4, floor(d * 5))`, off the same `d` the knobs are lerped
  with** — which is exactly what the map computes its own card from. Counting
  levels six at a time looks like the same thing and is not: the map FORKS, so
  a band is a stretch of rows and not six consecutive numbers, and the two
  disagree at two of the four seams. `Game.applyLevel(d)` is how the game gets
  it, which makes echomaze the third game to use that hook — for a board's
  RULES rather than for a table of knobs.
- **Nothing is placed on a cell a pulse cannot reach.** `carve()` is allowed to
  leave a pocket sealed behind the main path, and those cells are `dead` like
  any other — a key standing in one would be a board whose gate never opens. A
  flood fill from the doors filters both the crystal and the false gates.

The bar goes over **every** gate, not the true one alone: a bar on the real one
would be a sign saying which of the three it is, and the false gates of the last
band would stop being false.

Measured on a headless pilot that knows the true door but searches blind for the
crystal's corridor, 8 seeds a level: 8/8 escapes through bands 1, 2 and 4, 4-5/8
on band 3's dead-end crystal, 1-3/8 on band 5 with four pulses and all three
rules at once. A player reads both corridors off the reveal, which the pilot
cannot, so the last band is the one to watch on a real run.

### The name on the card

The five generic bands — Warm-up, Pressure, Squeeze, Overdrive, Meltdown —
describe a ladder and nothing else. A game names its own in
`web.levels.bands`, in both languages, and four do today:

| game      | the five                                                         | named after                      |
| --------- | ---------------------------------------------------------------- | -------------------------------- |
| arcider   | DUSK · DAY · MIST · OVERCAST · NIGHT                             | its skies                        |
| radiam    | ATELIER · LAGOON · RELIQUARY · SUMI · CIRCUIT                    | its biomes                       |
| blight    | MARSH · RUINS · GORGE · CASTLE · THRONE                          | the descent                      |
| echomaze  | DARK MAZE · FALSE EXITS · CRYSTAL LOCK · LIVE FENCE · FULL SURGE | the RULE each band brings        |
| spinshock | SPARK · INSULATED · SPLIT · GROUNDED · OVERCHARGE                | the IMMUNITY each band brings in |

`from` is what keeps the name honest, and it is not decoration. The map's own
bands are ROWS on a forking road, and four of the five turn their world over
on the LEVEL NUMBER instead — radiam and arcider both say why in as many words:
*two roads out of a fork have to be the same world, whatever they cost*. Those
four list `"from": [1, 7, 13, 19, 25]` and the card names the world the round
will actually build. echomaze reads its band off `d`, which is the map's own
number, so it leaves `from` out.

### Two constraints worth knowing before tuning

- **chainring cannot change tempo.** `bpm`, `beatOffset` and `loopBeats` belong
  to the embedded track, not to the difficulty — a level can only cut a denser
  chart against the same bed. A 60-second level loops the bed twice, which the
  crossfade already handles.

- **radiam's eclipse clock is not lerped, and a mode is not a level.** Its
  eclipse mode runs a Tetris level clock *inside* a round (`GROW`, `STEP`,
  `LINES`), but those three are locals of the eclipse module with a URL
  override on top, so the shipped block moves only its four `dial.*` knobs.
  Promoting them to `CONFIG.dial` is what a map level setting the clock's
  starting level would need, and it is not done.

  radiam is also the only game that declares `web.modes` at all, and it now
  declares **one**: `["eclipse"]` arms `CONFIG.mode` and adds nothing to the
  menu, so the map is the only way into a round. Its timed dial is still in the
  build and still reachable with `?mode=` for a bench — two ways into a game is
  one too many for a player, and the map is the better one.

  The machinery for a second mode stays, because a mode is not a level: an
  extra menu entry starts a *free* round, and the shell clears `CONFIG.level`
  and puts the base tuning back before it does, so a level armed by the last
  round cannot follow a mode launch.

______________________________________________________________________

## 3. Saving the stars and the scores

One key per game, through `Store` (`packages/engine/engine.js`), which is
localStorage with an in-memory map behind it.

```
key    prog:<slug>
value  { "v":1, "l":{ "7":{"s":3,"b":4210,"p":5} }, "h":1, "t":1757577600 }
```

| field | what it is                                                                  |
| ----- | --------------------------------------------------------------------------- |
| `v`   | schema version. Read it first; an unknown one is **reset**, not guessed     |
| `l`   | only the levels that were played — key is the level number                  |
| `l.s` | stars, 0..3                                                                 |
| `l.b` | best score on that level                                                    |
| `l.p` | plays, so a "hard level" can be spotted in the numbers later                |
| `h`   | level 0 was read. One flag — it earns nothing, so there is nothing to merge |
| `t`   | epoch seconds of the last write                                             |

Thirty entries is under 1 KB, and the thirteen share one origin on the site, so
the whole studio's progression is ~12 KB of a 5 MB budget.

**There is no "highest level unlocked" field**, and that is deliberate: with a
forking road one number cannot describe where a player is — after taking the
1-level road at the first fork, levels 5, 6 and 7 are open *and* unplayed
while 8 is cleared. It does not need to. What is open is derived from what
was cleared and from the graph:

```js
function open(n) {
  if (n === FIRST) return true;
  var rd = roadOf(n);                                   // the fork road it is on
  if (rd && rd.entry === n && rd.gate && totalStars() < rd.gate) return false;
  return preds(n).some(cleared);                        // any way in, walked
}
```

**Where the player is** is derived too — the successors of the furthest level
they finished. At a fork that is *two* nodes, and both are lit: the choice is
the state, and picking one for them would be a lie.

**Derived the same way, never stored**: total stars, which roads are open,
completion %, and which levels sit on a road not taken. A stored total is a total that can
disagree with the levels it sums.

**One write, on `endRound`, merge-max:**

```js
var rec = save.l[n] || { s: 0, b: 0, p: 0 };
rec.s = Math.max(rec.s, stars);      // a bad replay never takes a star away
rec.b = Math.max(rec.b, score);
rec.p++;
```

That is the whole write. Nothing records what got unlocked — clearing the
level is what unlocks its successors, and `reachable()` reads it back.

Never in `update()`. A round abandoned through the web MENU control writes
nothing, and that already holds: the webshell does not call `endRound` there.

### Four things this has to get right

- **The key is slug-scoped, and it is `Store` that scopes it.** The split site
  build serves the thirteen from **one origin** (`/games/<slug>/`), so the bare
  `bestScore` key was shared by all of them — a high score in vipera showed up
  in slipdeck. The rename lives in `Store` (`packages/engine/engine.js`) rather
  than in thirteen `game.js` files: **twelve games read `bestScore` directly**
  in their own section 6, so a rename anywhere else would have left them all
  reading zero. A game that knows its slug (`CONFIG.slug`, injected by the web
  build) reads and writes `best:<slug>` wherever it asks for `bestScore`; a
  playable is alone in its origin and keeps the bare key. The old shared key is
  adopted once, by whichever game is opened first, and then **dropped** —
  copying it into all thirteen would hand twelve of them a score they never
  made, and merge-max never takes it back. `webLang` and `webSettings` stay
  shared: one language and one sound choice for the whole site.
- **itch keeps nothing between sessions.** Inside a sandboxed iframe a browser
  that blocks third-party storage makes localStorage throw, and `Store` falls
  back to its in-memory map — which is why it has one. On itch the map is
  climbed and then forgotten when the tab closes. That is a property of the
  destination, not a bug to fix: say it on the itch page, or ship the map only
  on the site and the store builds.
- **android is its own island.** Each app is its own WebView with its own
  storage, so there is exactly one game's key in it, and an uninstall takes the
  progression with it. Play's auto-backup can carry it, which is a manifest
  decision, not a code one.
- **OPTIONS erases everything the player has.** One row, one wording whatever
  the game declares — *erase all game data* — asked twice, and it throws the
  best score, the thirty levels of stars and the meta layer's save (wallet,
  tickets, collection, daily road) away together: a best score with no stars
  behind it describes nothing, and a purse that outlived the climb that filled
  it describes less. The switches above it are settings, not data, so the
  music, the callouts and the language survive.

### FORCE — the map walked out of order, locally only

A level is tuned by playing it, and reaching level 27 through the gates it sits
behind is twenty-six rounds of warm-up. So the map carries a **FORCE switch**,
a dashed pill above the card, and it is three things and nothing more:

- **it only EXISTS locally.** `localhost`, a loopback address, a `.local` host
  or a `file://` build — anywhere else `levels.js` never builds the button, so
  there is no flag in a URL that can arm it on a deployed site and nothing for
  a player to find. It is not a cheat behind obscurity; on newrare.games the
  code does not run.
- **it never lies about the board.** `isOpen()` is untouched: the padlocks stay
  shut, a wall stays a wall, the card still reads *locked*, the band on a gated
  road still reads *Gated* and the goal still says how many stars it wants. All
  the force changes is whether the button at the bottom is **allowed** to start
  the round — `⚡ PLAY`, `⚡ GO THIS WAY` — and a shut wall lists the levels
  behind it instead of the cheapest stars to go back for.
- **it writes nothing of its own, and the round it starts is a real round.** A
  forced level is armed, lerped and recorded like any other, which is what
  makes it useful for tuning rather than a mode beside the game — and it also
  means a forced clear genuinely unlocks its successors. Wipe the progression
  in OPTIONS to get the gates back.

Off by default, remembered per machine under one key for the thirteen
(`dev:force` through `Store`) because it is a property of the desk and not of a
game. `?force=1` arms one load without writing anything — what a headless bench
passes — and `?force=0` disarms one load the same way.

______________________________________________________________________

## 4. Where it lands in the code

Nothing here belongs to the motor: a playable has no map, and the games know
nothing about levels beyond a number in `CONFIG`.

| piece                                  | what it is                                                                                                                                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/webshell/levels.js` / `.css` | the map's CONTENT — the road, the cards, the stars. It declares itself a VIEW (`View.define("map", …)`) and the view system owns the rest: the node's place in the stack, the class, the decor, the bed and the way back                                |
| `manifest.json` → `web.levels`         | where a game declares its objective, its copy and its ranges, next to `web.modes` and `web.copy`                                                                                                                                                        |
| `web.levels.bands`                     | optional: the five band names, `en` / `fr`, plus `from` when the game splits them on the LEVEL NUMBER (below)                                                                                                                                           |
| `CONFIG.web.levels`                    | that same block on the page — the existing `web` injection already carries it, so there is no second mechanism                                                                                                                                          |
| `CONFIG.slug`                          | injected by the web build; what scopes `prog:<slug>` and `best:<slug>`                                                                                                                                                                                  |
| `CONFIG.level`                         | the chosen level, written before `startGame()` — exactly how `CONFIG.mode` already works, and `0` for endless                                                                                                                                           |
| `Game.applyLevel(d)`                   | optional hook for what a lerp cannot express (a maze seed, a brick blueprint, a win condition); `null` = endless                                                                                                                                        |
| `Game.levelProgress()`                 | optional: what the objective is measured against while the round runs — the HUD score otherwise                                                                                                                                                         |
| `Game.levelStars(stars, value)`        | optional: a CAP over what the three bands pay, never a promotion — arcider's board is a race, echomaze's is a door                                                                                                                                      |
| `Game.levelWon()`                      | optional: how the game ends its own round on the third star, so the end screen keeps its stat rows                                                                                                                                                      |
| `Loop.rate(k)`                         | the second motor addition — a time scale on the simulation, which is what the three-star slow motion rides                                                                                                                                              |
| `onOutro(fn)` in the shell             | the third motor addition — the beat between the round and the end screen, with the loop still turning for it                                                                                                                                            |
| `onResult(fn)` in the shell            | the one motor addition — a filter over a round's result, so the stars become the level's and section 6 never changes                                                                                                                                    |
| the graph itself                       | one table for the thirteen — sections, forks and road gates are the studio's shape, not a game's                                                                                                                                                        |
| `menu.js` → `LV.mount({ help })`       | the way to the shell's one help CARD, so level 0 opens it instead of a second copy. The map used to build its own panel, because a panel of the title screen could not be raised over a map; help is a modal now and is over every view by construction |

A game declares the block and nothing else. This is vipera's, in full:

```json
"web": {
  "levels": {
    "objective": { "from": 100, "to": 650, "step": 25 },
    "copy": {
      "en": "Reach <b>{n} m</b> without being torn apart",
      "fr": "Atteins <b>{n} m</b> sans te faire déchiqueter"
    },
    "tune": {
      "play.speedMin": [280, 430],
      "play.diffFull":  [900, 340],
      "play.lives":     [4, 2]
    }
  }
}
```

A `tune` key is a dotted path into `CONFIG` and its two ends are lerped by `d`
**in place**, which is why a game holding `var T = CONFIG.play` at load sees the
change without a line of its own. A pair of whole numbers stays whole — `lives: [4, 2]` never becomes 3.4.

**What the menu does with it.** PLAY becomes the map: the motor's own
`#btn-start` loses its listener and opens the screen instead, and the map's own
PLAY button is the click that starts the round — still one click, so the audio
unlock still happens inside the gesture that asked for it. SPACE from the intro
opens the map for the same reason. Leaving a round through MENU lands back on
the map rather than on the menu, and so does the end screen's map icon; the
other icon plays the same level again (above). A game with no `web.levels` takes
none of these branches.

**Ninety of ninety reaches the title screen.** The map turns gold on its own,
but the menu has to say it too, or a player who finished the game comes back to
exactly the screen they left: `#screen-intro` takes a golden veil with a
highlight sweeping across it, and PLAY goes gold. It is two composited
properties and nothing per frame.

`packages/meta/` — the **online** leaderboard and cross-device progression — is
phase 5 and stays out of this. Everything above is local.

## 5. What is not decided yet

Two of the five are settled by the build: the path style is `zigzag` with the
slug as the seed, and **the map replaces PLAY** — there is no free endless run
outside the one a perfect board unlocks. What is left:

- Whether a fork should ever be one-way, so a road taken is a road committed
  to. Today both stay open and the player may come back, which is the safe
  default and matches "missing levels is fine".

- The two star gates (★14 and ★30) are placed by feel. Where they bite
  depends on how a real player stars the early levels, which is a bench
  question, not a table one.

- **Every objective in §2 is a table, not a measurement**, and so are the
  `1.5x` / `2.2x` star multipliers. A scripted pilot over a few levels per game
  is what settles them; until then a retune is one manifest line.

  vipera's have been re-scaled once already, and the reason is worth keeping:
  the first pass wrote `450 → 2 600 m`, which — now that the third star *ends*
  the round — meant a two-minute opening level and a nine-minute final one. The
  objective is no longer a ceiling a good run brushes, it is **the length of
  the round**, so it has to be read as a duration. At `100 → 650 m` the ladder
  runs from about 27 s to about 95 s of clean survival. Every other row in §2
  was written under the old reading and needs the same pass before it ships.
