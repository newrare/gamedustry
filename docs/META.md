# The meta layer — what a player owns, and what brings them back

The **web** and **android** targets are games people come back to. Thirty
levels and ninety stars gave them somewhere to *be*
([docs/LEVELS.md](LEVELS.md)); this layer gives them something to come back
*for* once a level is cleared — a wallet the score pays into, a collection with
holes in it, a machine that fills them, and a reason to open the game tomorrow.

The playable keeps none of it. A creative is one round shown once: it has no
wallet, no album and no tomorrow, which is why none of this is in the motor.

**All thirteen games declare it.** A game gets the layer by carrying a
`web.meta` block and a sheet of twenty stickers, and nothing else — see
[Adding a game to it](#adding-a-game-to-it). The numbers a game writes there
are scaled to what it scores: `coinsPer` is about a fourteenth of the top
objective of its climb, `xpPer` a tenth of that and `ticketPrice` a quarter, so
a maxed level pays ~14 coins and ~140 xp in every one of the thirteen and the
shop's own prices — which are coins, and shared — mean the same thing
everywhere.

```
title screen ──► LEVEL MAP ──► the round ──► end screen
   │  daily          │  wallet                   │  coins fly
   │  strip          │  album / shop             │  gift boxes
   ▼                 ▼                           ▼
   └──────────────► THE ALBUM ◄── the machine ◄── THE SHOP
```

______________________________________________________________________

## 1. The five things it holds

One save, `meta:<slug>`, beside the map's own `prog:<slug>` and apart from it
because the two are read and written on different screens and at different
rates — not because one outlives the other: OPTIONS erases all of a game's data
in one row, this save and the climb together.

| what      | where it comes from                                                                    | what it is for                            |
| --------- | -------------------------------------------------------------------------------------- | ----------------------------------------- |
| coins     | the round's score, converted AT the player's level — 14 800 pts → 14 coins, ×the level | buying tickets                            |
| tickets   | bought, given by the daily strip, dropped by a player level-up                         | one draw at the machine, 1 to 5 at a time |
| xp        | the same score on the flat rate, one hundred points an xp                              | the player's own level                    |
| stickers  | twelve off the map, eight out of the machine, doubles from both                        | the collection, and the shop's stock      |
| the daily | the device's own date, and a run of seven                                              | a reason to open the game                 |

**The player's level is the rate the game pays at.** A round is worth
`score / coinsPer` coins **per level**: 14 565 points is 14 coins at level 1
and 140 at level 10. The level used to be a bar that handed out a ticket and
nothing else — a number with no consequence is a number nobody watches — and it
is now the one term in the payout the player owns.

**So the end screen writes the sum, not the total.** `+145` is a figure handed
down; `+14 × Lv 3 = +42` is a figure with a lever in the middle of it. The
three parts arrive one at a time (`gainLine` in `packages/webshell/meta.js`),
because a sum that appears whole is read as one number, and the multiplier is
written **even at level 1** — that is the only place a player ever learns the
lever is there.

**XP is deliberately NOT on that rate.** It is the flat conversion of the same
score, one hundred points an xp (`xpPer`), so one run moves the bar by the same
amount at level 1 and at level 10. A climb that also multiplied itself would
run away from the curve underneath it, and the curve is what the whole payout
now hangs off.

**A player level hands out a ticket.** It is the one thing that stops a player
who never buys one from staring at a machine they cannot use. The curve is
`350 · level^1.3` — level 2 about three rounds in, level 10 about forty: a
season, not an afternoon.

### The xp of a round is read on the MAP, not where it is added

`addXp` moves the state and says nothing. It used to fire a callout from inside
itself, which is the moment the arithmetic happens and never the moment the
player is looking: a round's xp is added on the **end screen**, whose wallet
carries no level bar at all, under a cascade of coins that is still running.
The line landed over a reveal, about a bar nobody could see, and it announced a
reward that arrived before the screen that holds it.

So the gain is granted at once — it has to be, the end screen's own arithmetic
reads it back — and the **reading** waits, exactly the way a coin chip's figure
waits for its piece to land. `levels.js` calls `Meta.arrive()` from `show()`,
beside `sweep()`, and the map plays it in the one order that reads:

1. **the bar runs**, and it comes up EMPTY and fills to where the player now
   stands rather than sliding from the old figure to the new one. After a round
   the question is *how far am I*, and an empty bar filling answers it in one
   movement — forty points inside a level three hundred long is a twitch nobody
   reads as progress.
1. **`+N` is printed under it**, in the green every xp reward is drawn in,
   because a bar says how far along the player is and never how much just
   arrived. It **falls** where every other figure in this layer rises: rising
   is what a chip's figure does when it is earned, but xp has no chip — it has
   a bar, and a figure climbing off the level row crosses the bar it is
   explaining and lands on the header. It is also larger and held longer than
   the others (2.1 s against 1.3), because a coin chip counts up beside its own
   label and this IS the reading. It is cleared before the card opens: a number
   left under a blurred backdrop is a number nobody reads.
1. **then the card**, and only then. A level crossed is handed over the way
   every other reward in this layer is — its own title says what happened
   (*Level 2!*), its eyebrow says what it pays, and the ticket flies into the
   chip. It carries `granted: true`, because `addXp` already paid it: the card
   reads the state, it does not move it a second time.

**A level crossed is still played in two**: the bar runs to the end of the
level that was left, then again from nothing at the new one. Without that the
second half is a bar jumping backwards, which reads as a loss. Measured on a
42 000-point round from level 1: 0 → full as LV 1 over ~500 ms, then LV 2 from
nothing to the remainder, and the card at ~1.1 s.

______________________________________________________________________

## 2. The album — twenty stickers, twelve of them earned

The collection is twenty per game, counted `x/20`, and an unowned one is drawn
as **its own silhouette** — the same picture through `brightness(0) invert(1)`.
No second asset to cut, no placeholder to draw, and the shape is exactly the
tease a collection needs: there is something here and you do not know what.

Twelve come off the map and nothing else:

| milestone                 | pays                             |
| ------------------------- | -------------------------------- |
| band 0…4 **passed**       | `awards[0…4]`                    |
| band 0…4 **passed clean** | `awards[5…9]`                    |
| all 30 levels cleared     | `awards[10]`                     |
| ninety of ninety          | `awards[11]` — **the shiny one** |

**PASSED** is the climb having gone past the band: a cleared level in a higher
band, or level 30 itself for the top one. It is deliberately *not* "every level
of the band cleared" — a fork's two roads share a band and missing the road not
taken is a choice the map protects, so a rule that demanded both roads would
make five of the twelve unreachable for a player who chose.

**CLEAN** is the same band with every level the player *played* in it standing
at three stars: the road they walked, walked perfectly. A band nobody touched
is never clean by vacancy.

Milestones are paid **once, ever**, and the key stored is the milestone and not
the sticker — so renumbering a game's album later never re-pays a climb already
rewarded. They are swept on the end screen *and* on every arrival at the map: a
milestone crossed by a run the player walked away from is still crossed.

**A milestone sticker cannot drop from the machine until it has been earned.**
Otherwise the machine pays out the album's spine and the map's twelve rewards
stop meaning anything. Once earned it joins the pool like any other — as a
double, which is what the shop buys.

______________________________________________________________________

## 3. The machine, and the odds

Sixteen spheres in a glass globe, under gravity, colliding with each other and
with the curved wall, on a canvas. It is a **gumball machine and not a slot
reel**: no reels, no spin blur, nothing that reads as a bet — the player is not
gambling, they are collecting.

**The album is one screen and it does not scroll.** The machine takes the left
column at four fifths of its drawn size, what it costs and what it pays takes
the right one, and the twenty tiles take everything under both — a collection
the player has to scroll is a collection they see half of, and the machine
standing over it is what the whole screen is for.

### What a draw eats, and what that buys

**The bet is the player's, from one ticket to five** (`web.meta.maxBet`), plus
the **super ticket** on the end of the row (below).

**The top tier is a dial and not a weight.** One ticket is one percent of a
legendary, five tickets are five, *exactly* — `web.meta.legendaryPer` is that
percent per ticket (1). A player counting tickets is doing arithmetic, and a
number they can do in their head is the only kind they can decide on. It is
taken off the top of the probability; the rest of the pool shares what is left.

Everything under it stays weighted: each extra ticket multiplies every tier
above common by `web.meta.luck` (1.7), which takes mass off common **without
ever reordering the ladder**. Boosting by `luck^rarity` instead — the first
shape this took — had epic overtake rare at four tickets, and a ladder that
inverts at the top of the price list is a ladder the player stops reading. On
radiam's pool:

| bet | common | rare  | epic  | legendary |
| --- | ------ | ----- | ----- | --------- |
| 1   | 88.1%  | 7.3%  | 3.5%  | 1.0%      |
| 2   | 81.0%  | 11.5% | 5.5%  | 2.0%      |
| 3   | 71.5%  | 17.2% | 8.3%  | 3.0%      |
| 4   | 59.8%  | 24.5% | 11.7% | 4.0%      |
| 5   | 46.8%  | 32.6% | 15.6% | 5.0%      |

Those five rows are a POOL being shared out, so they move with the board: once
the map has paid its milestone stickers in, the same five tickets read
32.9 / 52.1 / 10 / 5 — epic collapses and rare swells, because the bag it is
weighing changed.

### The super ticket

**Fifteen ordinary tickets' worth of coins for one pull**
(`web.meta.superPrice`, `ticketPrice * 15`, so 3 750), and **four numbers that
never move**:

| tier          | super ticket |
| ------------- | ------------ |
| **legendary** | 30%          |
| **epic**      | 25%          |
| **rare**      | 20%          |
| common        | the rest     |

**Its tiers are PINNED, not weighted**, and that is what it is sold on. A
premium pull may not drift with the board the way the five rows above it do: it
promises the same four numbers every time it is bought, and a promise that
changes when a milestone is paid out is not one. `web.meta.superOdds` is the
three tiers above common, in rarity order — `[20, 25, 30]` — and **common takes
whatever is left** (25%). Each tier then splits its share evenly between the
stickers it actually has in the pool.

**A tier with nothing in it hands its share back.** The pool excludes a
milestone sticker until the map has paid it, so a board with no legendary left
to roll would otherwise be carrying 30% of probability that belongs to nobody —
and `roll()` walks the list subtracting until it goes under zero, so that slice
would land silently on the last sticker in the bag. The shares are renormalised
over the tiers that have members.

**It branches inside `chances()`**, the one function the readout and the roll
both go through — so the bars the player reads before they spend stay the bars
the machine rolls. That rule is what the whole machine is built on.

`SUPER_BET` is a **sentinel, not a quantity**: it is what `bet` is set to while
the super pill is armed, and the only thing it has to be is a value no count of
tickets can take (`-1`). It was 30 for one afternoon — a number that meant 30%
through the ordinary dial — which read as thirty tickets on a row of 1 2 3 4 5
and would have gone quietly wrong the day the odds changed. They did.

**It has no chip in the wallet.** The wallet is what can be spent anywhere; this
is spent in exactly one place. So the count lives where it is bought (the shop's
second card) and where it is spent (the sixth pill on the bet row, which carries
the painted ticket and the number beside it) — and nowhere else. `save.st` is
the pocket, added to the save as a FIELD rather than a version bump: a board
with a climb and a collection in it must not be thrown away to make room for a
counter that starts at zero.

The piece is `assets/image/shell/ticket-super.webp` — the rainbow one of the
twelve on `game-object-ticket.png`, and the brightest on the sheet on purpose.
It sits beside the blue ordinary ticket on a shop card, on a bet pill and in a
draw button, and a colour is what tells two tickets apart at those three sizes;
a size cannot.

**A game must leave the machine at least one legendary.** The pool excludes a
milestone sticker until the map has paid it, so a game whose every legendary is
a milestone shows a permanent 0% on its top row and the dial has nothing to
turn — which is exactly where radiam started (`awards` ended `20, 17`, its two
legendaries). `awards[10]` moved to 19 *Gearhead*, which put *The Orbit* back in
the bag and left *Radiam!* as the 90/90 trophy.

**The odds are shown before they are rolled, and they are the same numbers.**
`Meta.odds(bet)` and `Meta.roll(bet)` read one `chances()` — a readout computed
from a second formula is a readout that will one day be a lie. They are read off
the pool that is actually left, so a tier the machine genuinely cannot roll
shows 0% and dims rather than vanishing, which would read as a bug.

**A bet the wallet cannot pay for is still selectable**, and only the DRAW
button refuses it. A player who can never *see* what five tickets would do has
no reason to save five.

**The wallet is the way to the shop**, here as on the map — and it is the same
NODE on both, the band the view system puts over every screen that carries one
(`packages/webshell/view.js`, section 5). Every chip of it is a door and every
one leads to the same screen from every screen: the house home, the level to the
ranking, the coins to the shop, the tickets to the collection, the stars to the
map. A chip standing on its own screen goes inert rather than missing. There
used to be a GET TICKETS button
under the machine, and it only existed when the wallet was empty — so the one
screen that had to teach the player where tickets come from was the one they
reached *before* running out. The number they are short of is the thing to tap.

The first version was twelve `<i>` tags jiggling on a CSS keyframe, and that is
what it looked like — nothing had weight, nothing fell, nothing ever left the
glass, so the modal that pays out could have opened without any of it. The
pleasure of a gumball machine is a pile of heavy things sloshing and then ONE of
them dropping, which is a simulation and not a transition. The draw is three
beats and each is the physics doing it:

1. **the slosh** — the globe itself moves, and the balls are thrown by a wall
   moving into them. That is how you shake a box; an impulse applied to each
   ball looks like sixteen balls deciding to move at once.
1. **the drop** — a hatch opens and exactly ONE ball can use it. The winner is
   the ball nearest the mouth, so the eye agrees with the choice, and it is the
   only one whose wall constraint has a gap in it: nothing else can leak out
   without a rule about it, which is why it is written that way round and not
   "the hole is small enough that probably only one will".
1. **the landing** — it falls down the chute and bounces into the tray, and the
   reveal opens on the landing rather than on a timer.

**And the glass refills**, at the start of the *next* draw rather than the end
of this one — so the ball that was taken is still in the tray while the reveal
is open, which is where the eye left it. A machine one ball lighter per draw is
empty by the fortieth, and the player who gets there is the one who played most.

Two things it is written to do that a keyframe cannot: it **sleeps** when the
pile settles (an album is a screen the player scrolls and leaves open, and a
frame loop that draws a motionless pile forever costs battery to do nothing),
and it reads its six ball colours off the frame's own theme tokens, so a SKIN
re-dresses it with no rule per game.

A trap worth keeping written down: **"this is the drawn ball" and "the flap is
open right now" are two different questions.** The gap in the glass is the
second; the chute and the tray below are the first. Gating them both on the flap
meant that the instant it shut behind the ball — which is what it is supposed to
do — the ball lost every wall it had and fell out of the world at 2 800 px/s. It
showed only as "the draw hangs", because the safety timeout was the thing that
ended it.

[`lab/gacha.html`](../lab/gacha.html) is where the ceremony was chosen and where
it is tuned: the gumball with its physics knobs, and the ten candidates beside it
in the album's own chrome — the five it beat (gashapon capsule, chest, foil pack,
wheel, orb) and five proposed after them against a fourth criterion, *a draw that
plays the same keyframe every time stops being watched*: `peel` (the sticker
leaves a backing sheet that keeps the hole), `blister` (a 5x4 sheet that IS the
album, one dome pushed through), `claw` (the cabinet, and the only one with a
travel in it), `hatch` (three procedural cracks, then the shell comes apart into
wedges of itself) and `press` (one heavy hit, a second flat). A candidate swaps in by replacing `buildMachine` and the
body of `onDraw`; nothing else in this layer moves, because the draw already
hands the reveal a sticker that was decided before it started.

**The sticker is decided before the balls move.** An animation that reads a
result is theatre; an animation that decides it while the player watches is a
machine they cannot trust. The three gift boxes work the same way: the three
rewards are rolled before the boxes are drawn, and the pick is an index.

### The two reveals, and they do not look alike

A sticker the player has never had is the reason the machine exists: it lands on
a white flash, throws two shockwaves, sparks off the frame, wears the reward
badge's turning sunburst in its own rarity colour, carries a **plated gold NEW
tag with a shine running across it**, and waits to be dismissed.

A double is not news, so it **burns off**: embers climbing the card out of a
lava glow at its foot, and a tag that is an outline and a whisper. A card that
celebrates a double teaches the player to stop reading the card.

**Neither of them closes itself, and neither carries a SELL.** The double used
to burn out after two seconds, which put a clock on a picture the player might
want to look at and made the card race the hand reaching for it — the hand
cancelled the clock, which is a rule nobody can see. Both cards now wait, and a
tap anywhere puts them away (ENTER, SPACE and ESCAPE for a keyboard), which is
how every card of this layer is dismissed. The price the shop would pay went
with the countdown: a till on a reveal is the wrong screen for that decision,
and the shop sells doubles two taps away, all of them at once, with the total in
front of the player.

**One control is left, and only while it can be used**: DRAW AGAIN, wearing the
ticket and what a pull costs in the machine's own sunken chip — the bet is a
standing choice made on a slider the player cannot see from here, so it is shown
leaving. A wallet with fewer tickets than the bet gets **no button at all**: a
control that cannot act is a wall, and the tap that closes the card is already
the way on.

Both effects are nodes the card is built with, animated by `meta.css`: no frame
loop for a card that holds still. Under `prefers-reduced-motion` the whole
`.al-fx` layer is *hidden* rather than frozen — every one of those nodes is
invisible only because its animation holds it at zero, so `animation:none` would
park a white disc and twenty-six embers on the card.

### The card a tile opens

A tap on a tile opens that sticker at size, and it is a card the player came to
**look** at: the picture, the rank, where it comes from, and how many they have
as a chip on the corner — a number alone, the way a count is written everywhere
else in this layer, instead of *OWNED x3* spelled out as a caption under the
picture.

**A sticker's name is never translated.** It is a proper noun — the title the
artwork was drawn under — and it reads the same on every board, which is what
lets a player say "I got Starstruck" to someone playing in the other language.
Every other word this layer writes goes through `Lang.t`; `Meta.name` does not.

**An unowned one is titled `???`**, not *NOT YET*. Its picture is already a
silhouette and its tile already reads `???`: the three marks ARE the name it
does not have, and a sentence at the top saying so takes the line where the
answer belongs.

**Where it comes from names what the player did**, not that something happened:
*REWARD EARNED* said only that the map had paid, which they already knew, and
the useful half is WHICH climb it was — that is the one the collection can send
them back to. The milestone is read off the sticker's own position in `awards`
and the band's name off `Levels.bandTitle`, so a game that renames a band or
re-points an award has no second table to keep in step:

| the sticker came from | the line reads                            |
| --------------------- | ----------------------------------------- |
| the machine           | WON FROM A DRAW                           |
| `awards[0…4]`         | EARNED BY CLEARING *Reliquary*            |
| `awards[5…9]`         | EARNED BY A CLEAN RUN THROUGH *Reliquary* |
| `awards[10]`          | EARNED BY CLEARING ALL 30 LEVELS          |
| `awards[11]`          | EARNED WITH A PERFECT 90/90               |

**And it has two tenses.** A sticker in the album says what was DONE; one still
missing says what to DO — the same milestone in the imperative, which turns a
page of the collection into a list of things to go and try:

| the sticker      | owned                       | still missing                   |
| ---------------- | --------------------------- | ------------------------------- |
| from the machine | WON FROM A DRAW             | WILL COME FROM A DRAW           |
| `awards[0…4]`    | EARNED BY CLEARING *Sumi*   | CLEAR *Sumi*                    |
| `awards[5…9]`    | EARNED BY A CLEAN RUN…      | MAKE A CLEAN RUN THROUGH *Sumi* |
| `awards[10]`     | EARNED BY CLEARING ALL 30…  | CLEAR ALL 30 LEVELS             |
| `awards[11]`     | EARNED WITH A PERFECT 90/90 | GET A PERFECT 90/90             |

A build with `web.meta` and no `web.levels` has no band to name, so
`Meta.milestoneLabel` returns null and the card falls back to the plain *REWARD
EARNED* — inventing a band name is worse than saying less.

### The grid wears the ranks

**The grid is sorted by rank**, commons first and the legendaries last, and
within a rank the sheet's own order. Up the ladder and not down it, because the
four odds bars stand directly over the grid and are written the same way round,
and the last row being the one worth drawing for is the better page to end on.
The order is worked out once and never moves: the album is a shape the player
learns and then fills, so a tile changes place because the ladder says where it
belongs and never because something was just drawn.

**A tile's border is its rarity**, dimmer on one not owned yet. Twenty tiles in
one grid were twenty identical grey frames, so the only way to find out that
cell 20 holds a legendary was to open it — and the rank is the one thing a
collection is read for. It is on the border and not the fill, because the
sticker is painted artwork and the tile is its frame. An unowned tile carries it
too: it gives away nothing the card it opens did not already print, and a
silhouette in a gold frame is the best line this album has for *keep drawing*.

**The card takes the rank's colour**, poured down it from the top: twenty tiles
used to open twenty cards of the same near-black, with the one thing the player
came to read written as a line of text. It is a wash and not a fill — the
sticker is painted artwork and has to stay the brightest thing on the card — and
the title drops the motor's accent for the frame's plain text, because a cyan
line on a purple card is two palettes arguing.

**It carries no buttons, and a tap anywhere closes it.** It had a SELL and a
KEEP, and both were wrong here: KEEP decided nothing (a close button wearing a
verb) and SELL turned a page of the collection into a till. Doubles are traded
in the shop, in one gesture, and the reveal card still offers the one that just
landed. With no button left there is no target to miss.

**The rarity is a badge, not a caption**, everywhere this layer prints one: a
pill with a pip either side, lit by how far up the ladder it is — flat and quiet
for a common, plated and breathing for a legendary. Its four colours are the one
thing in this layer that does *not* move with the SKIN (`--rar-0…3` on `#frame`):
grey → blue → purple → gold is a ladder the player reads as a ladder, and a game
whose accent happened to be gold would flatten rare against legendary. Same
reasoning as `Pop.text`, where the colour is data and the rest is style.

### The three boxes, and the badge

The boxes are painted — `assets/image/shell/gift-{close,open}-NN.webp`, red,
blue and green, cut out of two sheets the shell owns (`docs/ASSETS.md`, *the
shell's own artwork*). The pick is one cut between two frames rather than a lid
lifted by a transform: the open picture has its own lid, its own ribbons flying
and its own light coming out of it, so animating the closed one would be a
worse version of a thing the artwork already does. The two frames land 180 ms
apart **under a white flash that covers the cut** — a straight swap reads as a
glitch, a swap inside a flash reads as the box bursting — and a sunburst is
thrown out from behind the lid at the same moment. The two boxes not picked
fade; what was in them is never shown.

What the box paid then arrives inside a **badge**: a sunburst turning behind the
reward and a ring around it, in the reward's own colour — gold for coins, the
accent for a ticket, green for xp, and for a sticker the rarity the album
already prints under it. A number or an icon on its own lands looking like a
line of a receipt; the badge is the frame that makes it a prize, and it is not a
second piece of artwork — it is the same reward node with a lit backing, so a
sticker, a coin and an xp bolt all land inside one shape.

A build carrying none of the shell's artwork falls back to the CSS boxes this
ceremony was made of before the painting arrived: three coloured nodes with a
lid and a bow, and a lid that lifts.

**Three boxes that are not the same box.** They were identical but for a
colour, bobbing on one keyframe with two delays, under a line reading *three
gifts, one choice* — which is one object printed three times with a caption
describing it, and a choice between three copies is not a choice. The sentence
is gone (the title says it, and the boxes ARE the instruction), the row took the
width it freed plus the card's own side padding, and each box now has:

| box   | size (art build) | idle                                         |
| ----- | ---------------- | -------------------------------------------- |
| red   | 204 px           | floats, slow and even — 2.6 s                |
| blue  | 174 px           | rocks on its foot, impatient — 1.9 s         |
| green | 190 px           | still, then one thump from inside it — 3.1 s |

They stand on **one floor**, so a taller box is taller and not merely higher up,
and the three periods share no multiple, so they never fall into step.

**It leaks nothing, and it is not a dice roll either.** The differences are
fixed to the POSITION and are the same on every card ever drawn, while the three
rewards are rolled per index and independently — so the big one is not the good
one, the quiet one is not the empty one, and a player who decides otherwise has
invented a superstition rather than read a tell. A box that MOVES ON ITS OWN is
a box with something in it, which is the whole trick; taking that look from the
reward instead would turn the ceremony into a label.

Rarity is per sticker, in the manifest, and it drives two numbers:

| rarity    | drop weight  | a double sells for |
| --------- | ------------ | ------------------ |
| common    | 60           | 60                 |
| rare      | 25           | 110                |
| epic      | 12           | 200                |
| legendary | *pinned* (3) | 420                |

They are **weights, not percentages**, so a game can add a fifth tier without
redoing the other four. The legendary weight is the one exception: its tier's
share is `bet * legendaryPer` (above), so 3 only ever splits that share between
several legendaries. A ticket costs 250, so four common doubles buy one draw:
selling doubles is what keeps a dry streak moving, never an income.

### The shop is one product, and the product is the subject

**Two columns, not three rows.** The piece down the left at the size of the
thing being sold, and beside it a column read top to bottom: the name, the
sentence, the price. The piece is what grew — 86 px of pictogram in a row of
text is an icon, 158 px of its own is the product — and the words moved beside
it because three full-width rows left a hole to the right of a short title and
a second one between the piece and its button. A column the height of the piece
has neither, and name / sentence / price is the order a shelf is read in anyway.
The sentence is turned right down: someone who has been here twice is not
reading it again.

**The button is the width of its own price**, at the foot of its column and
against the outer edge — the last thing read and the only thing tapped.
`margin-top:auto` is what holds it there whether the sentence runs to one line
or three, so the card with a count on it and the card without still line their
buttons up.

**There is no "not enough coins" line.** The price is on the button, the wallet
is one row above it, and a card that tells the player off for being poor says
nothing those two numbers do not. The dead button is the whole message.

**Selling doubles is a transfer, so it is the cascade.** It used to print a
`+280 coins` pill in the callout layer, which is the wrong half of the point:
the money is not a message, it is a number in a chip two inches away. The coins
fly out of the button that was tapped and into the chip that counts them — the
same `Meta.fx` the end screen uses, `burst` and all.

**Only the ticket chip is a door here.** Both chips are doors everywhere else in
this layer, and on the shop the coin one has nowhere to go: its door is the
screen it is standing on. So the blue one opens the album, which is where a
ticket is spent, and the gold one is an inert `div` — a button that does nothing
is a tap the player learns to stop making. Which chip is a door is the SCREEN's
business (`opts.doors`: `true` · `"shop"` · `"album"` · nothing at all).

**A player with no doubles gets no second card.** An empty frame explaining its
own emptiness is a second product on a screen that sells one, and it is the
first thing a new player sees here.

**A purchase is two movements and the shop used to show neither.** Tapping BUY
rewrote two numbers in a header: the money left without being seen to leave and
the ticket arrived without arriving. Now the price is taken **off the coin
chip** — a red `-250` falling from where the money is, and the figure running
down to what is left — and the ticket is thrown from the button into the chip
that holds it, at reward size, landing on a `+🎟` and a count.

**Stacking is the point.** Five taps are five labels, five tickets in the air
and two counters being retargeted under them: nothing queues and nothing waits
its turn. Three things make that work rather than smear —

- `countTo` is **interruptible**: a second call takes over from where the first
  one had got to, not from the figure it was handed, so the number never jumps
  backwards between taps;
- a chip that is counting **owns its own text** (`mtRun`), so the repaint every
  purchase triggers cannot write the final figure over a count in progress —
  and the ticket chip is *held* at what the player last saw until its ticket
  lands, or the count would have nothing left to pay for;
- every label and every launch is **jittered**, because five identical figures
  drawn on one point read as one smeared number.

The rect the ticket is thrown from is measured **before** the transaction:
paying moves the wallet, every wallet repaints its screen, and the button is
one of the nodes that repaint replaces — a detached node measures zero.

______________________________________________________________________

## 4. The daily road

**A line of the title screen's menu, between the map and the collection.** Not a
banner over the title: the top of that screen belongs to the logotype and the
painted scene, and a strip parked there is a second thing competing with the one
thing that sells the game. Down here it reads as what it is — a place to go,
like the two lines it sits between — and it is within a thumb's reach of them.

**Where the game has a VILLAGE the road is a BUILDING instead**: the title screen
is a splash with no menu on it ([docs/VIEWS.md](VIEWS.md)), and the hub is where
every door of this shell stands. That door opens **the strip itself, as a card
over the hub** (`DL.openRoad()`), and the tap on a day inside it is the tap the
road has always answered — pay it, say it was already collected, or say it was
missed — so nothing of what follows changes.

It opens the ROAD and not today's reward for the reason the road exists at all:
a door straight to the gift showed the player none of the week, none of where
they are inside it and none of what tomorrow pays, on the one game shape that
has a building dedicated to them. `DL.openToday()` is still what that door did
before, and it is the fallback for a build with no card system to open one on.
Every game that ships a village today is in that case.

**The road is the calendar, and it only ever counts up.** Day 7 is followed by
day 8, not by day 1: the first day the strip was seen is day one and every day
since has its own node, opened or not. It used to be a run of seven that wrapped,
and a missed day threw the player back to the first cell — so the road forgot a
fortnight of coming back because of one Sunday. Now **a day nobody opened stays
where it was**, behind them, drained of its colour and struck through, still
showing what it would have paid. The punishment in this layer is still only ever
the absence of a reward and never the loss of one — but now the player can SEE
the one they walked past, which is the only thing on this strip that argues for
opening a day on the day it opens.

Seven is still the **week**: every seventh day is the starred one, and what it
starred is below.

### The ladder — what each day pays, printed on the road

Every day ahead used to wear a **question mark**, which said the same nothing
seven times over. Now it wears the thing it will hand across, and the only
mystery left is **how much** of it:

| day of the week | pays                                 |
| --------------- | ------------------------------------ |
| 1               | experience                           |
| 2               | coins                                |
| 3               | a ticket                             |
| 4               | experience                           |
| 5               | coins                                |
| 6               | a gift — the three boxes             |
| 7               | **a starred gift — ×5 on all three** |

It is meant to be read as a ladder, because a player who can see Saturday from
Tuesday has a reason to be there on Saturday and that is the entire job of this
strip. What is promised is the KIND; what is kept back is the size, and the size
grows across the week on its own (`Meta.dayReward` scales it by the day) so the
sixth day's coins are worth more than the first's without the road printing
either figure.

The three small days open the prize card **straight onto their reward** — a
choice between three things that are all the same thing is not a choice. The two
gift days open the three boxes, and the starred one multiplies all three rolls
by five **before a box is drawn**, like every other number in this layer: a
multiplier applied after the tap would be a figure decided while the player
watched. A sticker is re-rolled rather than multiplied — five copies of one
picture is not five times a prize.

The ladder is `LADDER` in `packages/webshell/daily.js`, one line, and the road
reads the kinds straight off it.

### The road has no ends

What is drawn is not a week from a left edge to a right one. **Today sits in
the second column**, every day still to come is laid out to its right — past the
seventh and into the week after — and the road is **cut by the frame at both
sides**. A week drawn edge to edge is a thing with an end, and the end is three
days away; a road cut by the frame is a thing that carries on, and what the
player reads off it is how much is still ahead.

The second column and not the first, because of **the one node to its left**:
that node keeps the gift the last claim actually paid (see below). A road that
starts on today throws yesterday off the edge the moment it is claimed, and what
it throws away is the only thing on this strip that ever says the gift is worth
taking. Day one is the exception — there is nothing behind it, so it takes the
first column rather than leaving a third of the frame empty; the road then stays
put for one day and starts sliding on the second.

A day passing therefore **slides** the window by exactly one pitch: the past
runs off the left, the future arrives from the right, and nothing is repainted —
the whole track is one `translateX`.

- the rail is **solid and gold behind**, **dotted in front**, with a dot per day;
  the first dot is where the road starts, and the gold ends at today's and not
  one step further
- the days stand **on** the rail, never through it — a road is a line with
  things on it; a line drawn through a row of discs is a progress bar wearing
  beads
- a day still to come wears **its own reward, drained of colour** — it keeps
  the shape, which is what says a ticket is coming on Thursday, and gives up the
  colour, which is what a road of seven lit pictograms was spending to say
  nothing; four coloured icons ahead of today competed with today, and today is
  the only node here a finger is meant to find. The gold star on every seventh
  is the one accent left in front of the player, which is what the eye lands on
  when it looks down the road. One already taken wears a tick —
  except the last one claimed, which wears **what it paid**; one that went by
  unopened keeps its reward, greyed, with its number struck through
- **the painted box is a gift day and nothing else** — days 6 and 7 of each
  week, with the seventh behind a gold star. The starred day is therefore
  visible from day one without being touchable, and it comes back into view
  seven days later, which is what says the week comes round even though the
  numbering does not.
- the window is a window at **both ends**: two days are kept behind today and
  ten ahead, and the rest are let go. A road that only ever appended was fine
  while it wrapped every seven days and is a slow leak now that it counts to
  four hundred.

### The last gift stays in view

The day the last claim landed on does not wear a tick — it wears the reward
itself, greyed: the sticker's own picture, or the coin / ticket / xp pictogram.
It is a **receipt**, and it sits beside the box about to be opened because that
is what makes the box worth opening. The strip has exactly one of these at a
time: the reward is saved next to the day in `meta:<slug>`'s daily block (`r`
beside `d` and `k`, written on the way out of the card, which is the first
moment it is known), and once the run wraps past it the day is ahead of today
again and the node drops it on its own.

### Every day answers

Each day is its own button, and which of three answers it gives is the only
thing its position on the road decides. A day a finger lands on that does
nothing reads as a broken control, and the road is nothing *but* days a finger
can reach.

| the day tapped | what opens                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| today          | the map, then the reward (the boxes on a gift day)                                                      |
| ahead          | **NEXT GIFT** — what it will hand over, at full size and padlocked, named, and how many days away it is |
| behind, opened | **ALREADY COLLECTED** — the reward it paid, greyed, and the figure. No sentence.                        |
| behind, missed | **MISSED** — what it would have paid, greyed, and that it does not come back                            |

The locked card names the reward and **never the amount**: the answer to *what
is in there* is a ticket, and the answer to *how many* is the reason to be there
when it opens. A starred day says `×5` in the same line, because "a gift" and "a
gift worth five of them" are not the same promise and the road can only draw one
star. A day behind that is older than the one remembered shows a tick and says
it is behind the player — saying more would be inventing a reward nobody stored.

**The collected card carries no sentence.** "Already collected", the thing
itself greyed out and the figure it paid are three readings of the same fact;
a fourth line saying the next gift is tomorrow is the road's own job, and the
road is one tap behind the card. The line survives only where there is nothing
else on the card — a day taken before the save started remembering what it
paid, which is a title and a tick.

Only today's is in the **tab order**. Seventeen keyboard stops between two menu
lines is a menu nobody can walk down, so the rest carry `tabindex="-1"`: reachable
by finger, skipped by the tab key.

### Collecting moves the reward, visibly

A card that pays and then closes leaves the player to find the number that
moved. The wallet is behind a blur while they read the reward, and by the time
it is legible again it has already changed — so **the reward itself flies out of
the card and into the chip that holds it**, and the chip counts up when it
lands.

**One engine does all of it: `Meta.fx`.** Every screen that pays, charges or
hands something over calls it, and nothing else in this front end animates a
chip. There used to be four near-copies of the same twenty lines — the end
screen's coin cascade, the reward card's token, the shop's purchase and the
shop's price — each with its own idea of when the chip should be held back,
when it should count and whether the figure was written over it. Four copies is
four places a fix lands in three of.

```js
Meta.fx({
  kind,    // which chip, and what flies: coins | ticket | xp | sticker
  n,       // what moved, SIGNED: -250 charged, +280 earned
  from,    // a node or a rect the pieces leave; without one nothing flies
  rw,      // a reward object to draw instead of the kind's own piece
  before,  // what the chip READ before the state moved (default: save - n)
  burst,   // eighteen pieces instead of one, counting THROUGH the cascade
  big,     // the single piece arrives at reward size
  tag,     // write the figure over the chip on the landing (default: on)
  spread,  // scatter the figure and the launch — for a spree
  done
})
```

`flyReward`, `spendFx` and `buyFx` are three named shorthands over it and carry
no behaviour of their own — a call site reads better saying what it is doing
than filling in a bag of options.

**A rect is as good as a node for `from`,** and for a card it is better: the
card is already closing when this runs and a closing card is mid-transform, so
the caller measures first and closes second. The same trap catches any screen
that repaints on the transaction — the shop's buy and sell buttons are both
replaced by the repaint their own click triggers, so both measure first.

| reward  | where it lands                                     |
| ------- | -------------------------------------------------- |
| coins   | the coins chip, counting up                        |
| ticket  | the tickets chip, counting up                      |
| xp      | the level bar, filling — and `+N` printed under it |
| sticker | the tickets chip — the album's own door            |

**Every landing writes its figure.** The reward-card path used to turn the tag
off, on the grounds that the card had already said the amount twice — but the
card is GONE by then: collecting closes it and the piece takes 620 ms to land,
so what the figure would have overlapped stopped existing 400 ms earlier. What
was left was a chip climbing on its own, which is the one thing this layer
exists to stop. A **sticker** is the exception and keeps it off: its `n` is an
index, not an amount, so the tag could only ever read `+`.

The count is the point, and it is why the figure is **held back**. `grant()`
already ran at the reveal (the sticker has to be owned for the card to know
whether to say NEW or DOUBLE), so the chip behind the blur is showing the new
number before the player ever sees it. The flight puts it back to what it was —
invisibly, under the card — and counts it up on the landing. Nothing about the
state is a lie; only the reading of it waits.

**XP is held the same way, and it is the BAR that holds it.** Its chip has no
number, but it has a width, and a width that moved behind a blurred card moved
where nobody was looking — so the bar is put back to where the player last saw
it (without a transition: the rewind itself must not be seen while the card
fades out) and runs on the landing. The amount is printed **under the bar** as
it goes, because a bar says how far along the player is and never how much just
arrived: a coin chip counts up in front of its figure, this one has no figure
to count.

**A level crossed is played in two.** The honest width goes backwards there,
and a bar that jumps back reads as a loss — so it runs to the end of the level
it was in, resets to nothing without a transition, and starts again at the new
one. Measured: held at 0 for the 620 ms of the flight, 0 → full over ~440 ms
still reading LV 1, then LV 2 from nothing to the remainder.

**One object flies, or eighteen, and the difference is the question.** A
*transfer* being read — a score becoming coins, a shelf of doubles becoming
coins — is the cascade, and the chip counts THROUGH it because the eighteen
pieces are the reading. One thing changing hands is one piece, and the number
it is worth belongs to the moment it arrives; one thing is what
the card just showed. The target is taken off whichever wallet is actually on
screen — the band holds two, the standing one and the end screen's transient
one, and only one of them is up at a time — so a measured rect is the test. A
screen with no wallet at all skips the flight rather than inventing a
destination.

### A reward card is dismissed by tapping it, and carries no button

Anywhere on the card, and **there is no collect button at all**. Collecting is
not a decision — `grant()` ran before the card was drawn, so the reward is
already the player's — and a pill at the foot of it is a step asked for
nothing, with a thumb that misses it reading as a card that will not close. One
small line says what the tap does (*tap to collect*), ENTER, SPACE and ESCAPE
do the same thing for a keyboard, and the target is the whole card.

The card is one object saying one thing and there is one way out of it, so
asking a thumb to find a pill at the bottom of it is asking for a precision the
moment does not deserve.

Two exceptions, and both are the same rule: **a tap must never stand in for a
choice**. The three boxes do not dismiss (a choice has no default), and the
rewarded ad does not (it has a countdown). A real control inside a card — WATCH
AN AD — keeps its own click and is never what a thumb lands on by missing; the
one card that still shows a pair of buttons is the one offering it, because
refusing an offer is a real answer and needs a control beside the one it
refuses.

### The title names the gift, and the figure is plated

The card's heading is the CALLER's word for it — the daily road passes *Daily
gift*, so the eyebrow over it drops the same words and keeps only what the
title does not say: which day of the run this is, and the DEV pill. A line
repeating the title over the title is one word said twice.

What the gift PAID is set in gold with a light sweeping across it
(`.mt-rw-name.shine`). In the same white as every other caption in this layer
the figure reads as a line of a receipt under the picture, and the figure is
the prize. The plating is a treatment and not information — the reward's own
colour is still the ring's, which is where a kind is read.

### It carries no words

Not a title, not a note, not a state line. It sits between two lines of a menu,
and a heading over it would read as a third entry; the gift box lit on a dotted
road says *daily gift* without one. Every word it might have carried is in the
card the tap opens, as an **eyebrow** over the title — what this is, which day
of the run it is, and the DEV pill when one applies. There is room for them
there, and a player is already reading.

### It plays where a wallet is on screen

Because the gift pays into the **wallet**, and the title screen is the one
surface that carries no band: it is the game's front door, and a front door
sells the game rather than counting the money. A reward granted there lands on a
number the player cannot see, so the coins fly out of the box into nothing.

**On a village that screen is the hub itself.** The band is over it, the road
was a card standing on it, and the player asked for the gift from there — so
nothing is navigated: the road card steps aside and the boxes take its place.

**Without one**, the strip is a line of the title menu and one tap does what
PLAY does: the boxes open over the level map, which is the first screen that
shows what they paid.

### The day, and the dev machine

The day is **the device's own**, in its own timezone, as a plain `YYYY-MM-DD`.
There is no server and there is nothing to defend: a player who moves their
clock to claim twice has cheated themselves out of a sticker's worth of
anticipation, which is the whole stake.

**On a dev machine there is no day at all.** A ceremony that fires once every
twenty-four hours takes a week to look at seven times, and the alternative —
moving the machine's clock — is worse than no test. So on `localhost`, a LAN
address or a `file://` page the date stops being a gate: the run still advances
a node per claim and the save is still written, and only *you have had today's*
is lifted. The card then carries a red **DEV** pill, so a screenshot of a dev
machine can never pass for the real thing, and a deployed site — whose hostname
is none of those — is untouched.

______________________________________________________________________

## 5. The end screen — the score becomes something owned

A score is an abstraction until the player owns it, so the end screen converts
it in the open: **the score stays** — it is the number the player just spent a
round making — and what it is worth is written under it in the coin's own gold.

**It is written as the sum and not as the total**: `+14 × Lv 3 = +42`, in three
beats about a third of a second apart, because the level in the middle is the
one term the player owns and a total hides it. The multiplier is written at
level 1 too — that is the only place a player ever learns the lever is there.

Eighteen coins then fly out of *that* line and into the wallet, which counts up
by exactly what the line said; the line fades as they leave, and the same figure
is written once more **under the coin chip itself** when the last one lands — on
the chip that was paid and not on the wallet's edge, which is the ticket chip
and the one number the round never moved. Three readings of one number, none of
them arithmetic to trust.

(It used to be the SCORE that drained to zero. It read beautifully and it cost
the player the one number the round was about: by the time the wallet had
finished counting, nothing on the screen said what the run was worth.)

**The wallet is only there while it is being paid.** On the map, the album and
the shop the two chips are furniture — they are what the screen is about. On the
end screen they are not: the player is reading a score, and a coin chip parked
in the corner before a single coin has left says nothing while holding a corner
of the frame for the whole reveal. So that one wallet is built `transient`
(`Meta.wallet`, `opts.transient`): every chip is in the layout — a flight is
aimed at its rect and needs one — and veiled, `fx` lifts the veil off the chip
it is about to pay into on its way in and puts it back a beat after the figure
over it has been read. A chip therefore arrives with its own cascade, counts,
writes its figure and goes; the ticket chip is only ever seen on a round that
won one, and a round that pays nothing shows an empty corner. The two are
counted, not toggled: a round that pays the same chip twice — the cascade, then
a gift — is put away by the last transfer to finish.

**And the coins are paid BEFORE they are animated**, which is the contract every
other caller of `fx` keeps: a chip counts up to what the save holds, so a payout
still owed counted from its old figure to the same old figure and the wallet was
left reading the round before. `addCoins` runs on the frame the cascade leaves
and `fx` holds the chip back to the figure before it on the next line, so
nothing of the payment is seen ahead of the coins carrying it.

**The column is laid out before the reveal, not during it.** Everything the
motor writes on this screen is in the DOM at full size from the first frame and
only fades in; this layer writes two more things — the conversion under the
score and the offer under the rows — and both used to ARRIVE. That pushed a
column mid-cascade: the stars dropped while they were still slamming in, the
rows moved under a finger, and the buttons landed somewhere other than where
they had been announced. `reserveEnd` opens both slots on the frame the round
ends, empty and at the height they will need — including the conversion line's
fixed 52 px, which holds through its three sizes (34 px arriving, 21 px as the
footnote). **The only thing on the end screen that changes size is the
character**, which is what it is for.

**The player's level is a TAG in that sum**, in the pill the wallet already
writes it in: it is the one term here they own, and as plain text between two
coins it read as a third operand.

**The sum then STAYS, as a footnote under the score.** It used to fade out with
the coins it paid, which put the one lever a player owns — their level, and what
it multiplies — on screen for about a second. It shrinks instead: the glow off,
the gold turned down, `.mt-gain.kept`. And it is read before it is spent — the
figure lands, then a beat of nothing, then the coins leave; 260 ms was the sum
arriving and being emptied in the same breath.

Eighteen coins whatever the score — the cascade is a *reading* of the transfer,
not a count of it. A 40 000-point round would otherwise be four hundred DOM
nodes for the same half-second.

Then, in order: the xp, whatever the map now owes the collection (one card per
sticker), and one offer:

- **three stars** → nothing here: the gift was already handed over, on the
  round itself (below).
  The offer **arrives with the navigation** and not at the end of the transfer:
  `endRun` runs on the frame the motor lights the map, the replay and the arrow
  (see `watchEnd`), so the three ways out and the one reason to stay are offered
  together. Held back until the coins, the stickers and the xp had all landed, it
  appeared seconds after the player had read the row of buttons and decided —
  a fourth control arriving under a thumb already on its way somewhere.

- **one or two stars** → the three boxes *for* an ad, as **one button**:
  ▷ WATCH AN AD 🎁 — the price, the words, then what it pays, with the gift as
  the shell's own PAINTED box rather than a stroked pictogram (a stroked gift
  on a gold button reads as the button's chrome; the thing handed over should
  look like the thing the ceremony opens). It was a gold label beside a button,
  which reads as a claim followed by a price with the claim sitting outside the
  only thing that could be tapped, and the plate that grouped the two is gone
  with it — a pill inside a pill reads as two controls where there is one. It
  stands 22 px clear of the stat rows: the rows are what the run WAS, this asks
  for the next one, and against them it read as a fifth row of the column.

- **no star** → nothing at all. A player who just failed is the last person to
  sell to.

### The three-star bonus opens on the round that earned it

The boxes used to be the end screen's last beat, three screens' worth of reveal
after the third star lit. They are now the **outro's** (see
[LEVELS.md](LEVELS.md)): the world is still there, crawling in slow motion under
a blur, the card reads BONUS THREE STARS, and the end screen arrives with the
prize already in the wallet.

The wallet comes with it — a reward that flies has to have somewhere to fly to,
and `flyReward` measures a *visible* chip and gives up without one — so the
corner wallet the end screen shows is built and shown for the ceremony, which is
exactly the chip the gift lands in.

**The outro's `done` fires the moment the card closes, with the reward still in
the air.** It used to wait out the flight plus a beat, and what the player
watched for that second was the frozen ROUND: the card they had just dismissed
was gone and nothing had replaced it. Nothing needed the wait — the wallet is a
layer over `#frame` and not a child of the end screen, so the token flies over
whatever is underneath it, and the score cascade that counts into the same chip
does not start until the install CTA lands, seconds later.

**The ad offer names what it multiplies.** `WIN` beside a ×5 plate was a number
with no noun on it, on a card that pays xp, coins or tickets from one ceremony:
the shouted line is the verb and the thing — `MULTIPLY YOUR COINS` — the plate
finishes the sentence, and `watch an ad` sits under it at the size a price is
read at. There is no play pictogram: it said "this is a video", the line under
it says exactly that in words, and what it cost was 36px of a line that has a
verb, a noun and a plate to fit on it. A sticker is redrawn rather than
multiplied, so that one reads *one more* and wears no plate.

**The way past it is the end screen's own button**, sharing its rule in
`menu.css` rather than restating it: the way on is one control in this front
end, and a player meets it on the reward card and again on the end screen a
beat later.

**The beat it hangs off is the motor's own.** The install CTA taking its
`.show` class is the signal that `EndScreen`'s cascade is done — watched for,
never scheduled against a copy of the motor's timings, which would drift the
first time a game shipped a fifth stat row.

______________________________________________________________________

## 6. The rewarded ad is a stub, and it says so

The web target has no ad SDK at all: `packages/platform/web.js` drops MRAID
outright, because a creative's network has nothing to do with a site. So
`Meta.ad(cb)` plays a placeholder card with a real countdown, a dashed slot and
a line that reads *"No ad network is wired in yet — this is a placeholder."*

Everything around it is finished: the offer, the odds, the ×5, what it
pays. Wiring a network in is **replacing the body of that one function** —
`cb(true)` when the view completed, `cb(false)` when it did not. Nothing else
in the layer moves. See [INDUSTRIALIZATION.md](INDUSTRIALIZATION.md) for where
ads sit in the plan (android first, and only for a game that earned it).

______________________________________________________________________

## 7. The files

Six files, and the **order they load in is the contract**, because each one
publishes the handle the next reads:

| file                          | publishes                            | what it is                                                  |
| ----------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| `packages/webshell/view.js`   | `window.__VIEW__` `window.__MODAL__` | what a view is, what a card is, and the stack both live in  |
| `packages/webshell/levels.js` | `window.__LEVELS__`                  | the map, and `bands()` — what a band is worth               |
| `packages/webshell/meta.js`   | `window.__META__`                    | the state, the wallet band, the gift, the ad                |
| `packages/webshell/album.js`  | `window.__ALBUM__`                   | the collection, the machine, the shop                       |
| `packages/webshell/daily.js`  | `window.__DAILY__`                   | the daily road: a house of the village, a strip without one |
| `packages/webshell/menu.js`   | —                                    | mounts all five                                             |

`view.css` is loaded **first** because it holds the base every card and every
band of this front end is drawn on, and `meta.css` **after** `levels.css`
because it re-cuts the map: doing that after rather than louder is what keeps
the whole layer free of `!important`.

Three rules hold the shape:

- **The motor knows nothing about any of it.** Everything is read through
  `window.__WEB__`, the same plain list of references the menu and the map use.
  A target adds its own layer; it never patches the motor.

- **The bands belong to the map.** `levels.js` exposes `bands()` and meta.js
  reads it — the alternative was a second file re-deriving `bandOf` and the
  save, which is two places to be wrong about the same thing.

- **The wallet is ONE BAND, and it is the navigation.** The component was
  always one (`Meta.wallet`); the hosts were four — the map's header, the
  album's, the shop's and a layer pinned to the end screen's corner — so the
  same numbers sat in four places and the screens in between showed none of
  them. The band is `#web-hud` now: one node, filled once by `View.hudMount`,
  and **one line, whose order is what the player learns** —
  `⌂ · ⚡ · 1 240 · 3 · 3/20 · 12/90`, and each chip is the door to the screen
  it is the number of: home, the ranking, the shop, the collection, the
  collection, the map. The order is the order it is read in — the way out
  first, then what is earned by playing, then what is spent, then what those
  two buy, then what the board itself is worth. The row never changes shape, and a chip standing
  on its own screen goes inert rather than missing, so a number never has to be
  found again. That is what made back arrows unnecessary and then wrong: these
  six are the whole of it. **The house is the only chip that is not a number** —
  the rest of the row is what the player owns, this is the way out of wherever
  they own it — and a game with no band keeps a home button in its headers
  instead, so there is always exactly one way home.

  **The collection's count wears the four-leaf clover**, cut from
  `assets/image/master/game-object-sticker.png` and adopted in `SHELL_CUTS` —
  the one piece of that sheet the shell draws, and the only one on it that says
  "a thing worth collecting" without being a star, a coin, a trophy or a
  ticket, all four of which are already a chip of the same band.

  **The count is on the band, and the album has no header left.** That
  screen carried a name and an `x / 20` over a row already saying what the
  player owns: the name is what they tapped to get here, and the count is one
  of those numbers. The height the header was taking goes to the machine, the
  odds and the twenty tiles.

  **The level chip is an icon until it has something to say.** A bar standing
  open on every screen is one nobody reads: it moves once a round, and the rest
  of the time it is the widest thing on the band saying the number it said
  yesterday. So it is the bolt alone, and `openXp` opens it for a few seconds
  whenever the xp moves. Its figure (`120 / 350`) is on the ranking, which is
  the screen that reads it properly.
  **The shop is not a title entry**: it is opened from the coins, and from the
  album where a missing sticker is the reason to want a ticket.

  **The band holds a second row**, the end screen's, and the class on the band
  says which is up (`hud-full` against `hud-auto`). It carries three of the
  four — a level, coins and tickets, which are what a round can pay into — and
  each of them holds its place in the layout (every flight aims at their rect)
  while carrying no ink until a cascade lifts it. What the player sees on the
  score screen is a chip that arrives with the reward, writes its figure and
  goes. **The level chip is one of them**: xp was the one reward whose target
  was a bar rather than a `.mt-chip`, so it had nowhere to land and the bar
  moved behind a blurred card. **The title screen carries no band at all** —
  it is the front door, and a front door sells the game rather than counting
  the money.

- **Every card this layer opens is a modal of the view system.** The note, the
  three gift boxes, the prize, the ad and the two sticker reveals were five
  builders that each made their own box, added their own `.on` on the next
  frame and removed themselves on their own timer. They declare what they are
  now — `dismiss` for a tap anywhere, `esc` for the key, `bed` for the music —
  and `View` owns the scrim, the stack, the fade and the order a key is
  answered in. The class names are unchanged: a card carries `wm-modal` AND
  `mt-modal`, so every rule already written against these cards still finds
  them.

**One motor rule worth knowing about**, because it cost a round of debugging:
`#screen-end > *:not(#confetti):not(.screen-art):not(#eo-char):not(.decor-layer)`
forces `position:relative` on everything the end screen holds, at three ids and
two classes of specificity. An id of your own cannot outweigh it, and that
exclusion list is the *motor's* business. So the end screen's wallet lives in
`#frame` and not in `#screen-end` — which is where a layer over the frame
belongs anyway, and where the band is.

______________________________________________________________________

## 8. Adding a game to it

Two things: a sheet of twenty stickers, and one manifest block.

```bash
# 1. the sheet — one grid of stickers out of the image model
#    assets/image/master/<slug>-object-sticker.png
node tools/lab/cut-objects.mjs <slug>-object-sticker --grid 5x4 --keep-partial --solid 245
open dist/object/<slug>-sticker.png          # ALWAYS look, then pick the twenty
node tools/lab/cut-objects.mjs <slug>-object-sticker --grid 5x4 --keep-partial --solid 245 \
  --adopt 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20 --seq
node tools/lab/encode-art.mjs <slug>
```

**A sheet of twenty stickers is rarely twenty objects.** Six of the thirteen
came back with twenty-one, twenty-two, twenty-four and twenty-five, because the
model fills the last row with whatever is left over and draws a logotype twice
as wide as a face. So the cut is read, not assumed, and three flags carry it:

- **`--grid`** makes the CELL the identity rather than the blob's area, and it
  takes one column count PER ROW when the rows are not all equal — `--grid 5,5,5,6`. That is not cosmetic: a uniform grid over a six-object row puts two
  stickers in one cell, drops one of them, and the fringe pass then hands the
  loser to the object above as a satellite, which is how blight's witch came
  back with a slime ball glued under her hat. A sheet holding one double-width
  piece (echomaze's logotype, slipdeck's suits) is cut with NO grid instead —
  the grid would saw the wide one in half, and area order is fine when only one
  sheet has to be indexed.
- **`--solid 245`** is where two stickers come apart. These sheets are drawn
  with the pieces overlapping outline on outline, and the default 110 welds
  whole rows together. It also takes **one bar per horizontal band** when the
  sheet's halves disagree — `--solid 253,253,245,245` on arcider, whose six
  faces to a row need nearly 255 and whose neon objects shred above 245 — and
  a bar that high has to be paid for with a wider `--pad` (28 there), because
  what separates two faces is the white outline they touch with and the fringe
  pass is what hands each of them their own back.
- **`--seq`** numbers the adopted roles 01…20 in the order given instead of
  after the cut each one points at. The album reads `sticker01` to `sticker20`
  and a hole in that run is a tile with no picture, so twenty-four cuts minus
  four still has to land on a contiguous twenty.

`--adopt` writes the roles into `art.objects` of `games/<slug>/manifest.json`;
it moves no file, the cuts stay in `assets/image/object/`.

The twenty adopted cuts become `CONFIG.art.sticker01…20`, and they are
**web-only art** (`tools/build/build.mjs`, `WEB_ONLY_STICKER`): ~730 KB of
WebP, ~975 KB of base64, and a playable has no collection to put them in.

```jsonc
// games/<slug>/manifest.json — inside "web", after "levels"
"meta": {
  "coinsPer": 1000,         // points per coin, PER PLAYER LEVEL
  "xpPer": 100,             // points per xp, flat
  "ticketPrice": 250,       // coins per draw
  "superPrice": 3750,       // the super ticket — default: ticketPrice * 15
  "superOdds": [20, 25, 30],// …its rare / epic / legendary, pinned; common takes the rest
  "awards": [1,2,3,4,5,6,7,8,9,10,20,17],   // the twelve milestones, in order
  "stickers": [
    { "name": "Nice One", "rarity": "common" },
    …twenty of them, in the sheet's own reading order
  ]
}
```

`awards` exists because a sheet's reading order is the painter's: the game's
logotype and its trophy piece are wherever they were drawn, and ninety of
ninety should pay in one of *those* rather than in whatever landed in cell
twelve. Leave it out and the first twelve are used in order. **The three rates are the one thing that is not a default**, because a point
is worth a different amount in each of the thirteen: vipera's climb tops out at
650 and gearball's at 7 300, and the same `coinsPer` over both would pay one
player a coin a round and the other a hundred. They are read off the game's own
`web.levels.objective.to` — `coinsPer` ≈ a fourteenth of it, rounded to
something legible, `xpPer` a tenth of that and `ticketPrice` a quarter of it —
so a maxed level pays ~14 coins and ~140 xp everywhere and the shop's shared
coin prices mean one thing. `superPrice`, `superOdds`, `sell`, `drop`,
`maxBet`, `luck` and `legendaryPer` all have
defaults — a second game is the two required lines and nothing else, as long as
**one legendary is left out of `awards`** (above).

**The names are not translated.** A sticker's name is a proper noun — the title
the artwork was drawn under — and it reads the same on every board, which is
what lets a player say *I got Starstruck* to someone playing in the other
language (`nameOf` in `packages/webshell/meta.js`). Everything around it is
already translated by the shell, so a game that ships an album adds no line to
`web.copy.fr.strings`; `node tools/lab/scan-text.mjs <slug>` still has to read
*fully translated* afterwards.

______________________________________________________________________

## 9. What is deliberately not here

- **No real money.** The shop has two trades and neither of them is a purchase.
  IAP is a different conversation and a different file.
- **No timer, no bundle, no offer.** The shop is the sink the coins need in
  order to mean anything, and nothing else.
- **No energy, no lives, no wall.** Nothing in this layer stops a player from
  playing; every piece of it only pays.
- **No account.** All of it is `Store`, which is localStorage with an in-memory
  fallback — so on itch (a sandboxed iframe where localStorage may throw) a
  collection lasts the session and then forgets. That is a property of the
  destination, not a bug to fix. An online leaderboard and progression are
  still `packages/meta`, phase 5.
