# The barracks — cards the player owns, and what a battle costs

A round that deals a fresh random deck every time is a round with nothing at
stake: the cards are the game's, not the player's, and losing one costs the
length of a shuffle. The barracks makes them the player's — one roster, kept
between battles — and then gives a fight a price.

`packages/webshell/army.js` and `army.css` are the layer. It is **web target
only**, it is inert unless a game declares `web.army` in its manifest, and
today **`games/stratideck` is the one game that declares it**. The playable
keeps none of it: a creative is one round shown once, it has no tomorrow, and
so it has no infirmary.

```
        the VILLAGE (the hub)
   ┌────────┬────────┬────────┬────────┐
   ▼        ▼        ▼        ▼        ▼
 CARDS  INFIRMARY  PRISON  COMMAND    map ──► the round ──► end screen
   │        ▲         ▲   recruits ·     │                          │
   │        │         │   missions       │                          │
   │        │         │        │                                     │
   │        │         │        └── coins, cards away ◄── meta layer  │
   └────────┴─────────┴──────────── wounded, captives ◄──────────────┘
```

______________________________________________________________________

## 1. Two numbers on every card

A card is a **grade** and a **tier**, and they are read in that order.

| the grade | 1 to 10, the officer: spy, scout, sapper, sergeant … marshal |
| --------- | ------------------------------------------------------------ |
| the tier  | `E D C B A S` — the same rarity ladder the collection uses   |

The six steps are six families, the collection's own with one step added under
them: **E basic**, D common, C uncommon, B rare, A epic, S legendary. The
colours are the meta layer's four plus a bronze under (never a darker grey: E
and D side by side must read apart at a glance) and a green between (`army.css`, and the round paints the same six in `game.js`) —
and **none of them is the SKIN's**: a game whose accent happened to be gold
would flatten epic against legendary.

## 2. What a fight costs

The grade decides a fight. The tier decides it when two grades are equal, and
the tier **gap** decides what the fight cost:

| the two cards                | what happens                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------- |
| higher grade wins            | the cell is taken                                                                 |
| same grade, higher tier wins | the cell is taken, and it is the tightest win there is (`margin: 0`, paid double) |
| same grade **and** same tier | both fall — the one draw left in the game                                         |
| the LOSER's tier was higher  | the winner is **WOUNDED**                                                         |
| the WINNER's tier was higher | the loser is left **STANDING** — an enemy who can be taken prisoner               |
| the two tiers matched        | a clean fight, nothing is owed                                                    |

The three specials are **blind to the tier**, on purpose: a spy kills the
marshal because it is a spy, a sapper clears a trap because it is a sapper, a
scout reveals because it is a scout. Putting a letter in front of any of those
turns a rule the player can recite into a rule they have to look up.

**Every other grade has an object of its own to break**, so no card is merely a
weaker version of the one above it. A camp is also built of six OBJECTS, dealt
from the level their kind unlocks at (`OBJECTS` in `games/stratideck/game.js`,
`play.objects` in `web.levels.tune`: one at level 1, seven at level 30). An
object never fights and never moves; struck by its one grade it is destroyed,
struck by anything else it does its effect and stays:

| object       | unlocks | what it does to the card                                           | broken by  |
| ------------ | ------- | ------------------------------------------------------------------ | ---------- |
| straw man    | 1       | back to the bottom of the deck                                     | sergeant   |
| wooden fence | 1       | back to its hand slot — the turn is spent                          | lieutenant |
| rock         | 4       | back to its hand slot — the turn is spent                          | captain    |
| forest       | 8       | out of the battle, neither wounded nor dead                        | major      |
| skull        | 13      | back to its slot, stunned: it never leaves it again this battle    | colonel    |
| book         | 18      | turns round and fights one card of its own hand, by the same rules | general    |

The book's fight is a real one, read from both sides: the grade decides, the
tier settles equal grades, a winner whose tier was lower is wounded, and a
loser whose tier was lower is left standing — wounded rather than killed,
since an ally cannot be taken prisoner. The three objects that cost a card
never stand on the front row, and no object stands next to the flag: a flag
walled in by fences against a deck with no lieutenant would be a battle that
can be neither won nor lost. A hand of nothing but stunned cards is an army
spent — the deck behind it has no slot to be dealt into. The Marshal breaks
nothing: it is the highest grade, and that is its particularity.

**The army's cards wear what they are for**, in a round macaron on the left of
the card (`PERK`, Lucide pictograms from `assets/motor/lucide/`): a sword for
the spy, an eye for the scout, a bomb for the sapper, then the object each of
the next six breaks — wheat struck through, an axe, a pickaxe, a compass, a
fist, a padlocked book — and a crown for the marshal. The camp's red cards
wear none: the camp never strikes. The first time an object acts in a battle,
one `Notify` names the grade that breaks it, so the rule is learnt from the
mistake it answers.

**A wound is felt twice.** In the battle, the card takes the cell and then
stays in the hand slot it was sent from, bandaged and unplayable for one turn —
it does *not* go to the bottom of the deck, because a wound the player cannot
see is a rule nobody learns, and the slot it occupies is what the wound costs.
After the battle it goes to the **infirmary** for as long as the **tier gap**
that caused the wound says: `infirmaryHours` is a range, `[1, 24]`, read from a
gap of one letter (1 h) to the whole ladder (24 h). A failed mission's wound
reads the mission's difficulty (1 to 5) in place of the gap.

**The infirmary has two to nine beds and the prison two to nine cells** (`infirmaryBeds`,
`prisonCells`). The barracks tells the round how many are free
(`CONFIG.army.beds` / `cells`), and the round keeps to them on the spot: a card
of the player's own wounded when every bed is taken is **refused, and a wound
nobody can treat is a card lost** — it leaves the battle, the barracks strikes
it off the roster (`result.army.dead`), and a `Notify` says so as it happens. A
prisoner with no cell is not taken either (said once per battle), and the
end-of-battle offer does not open on a full prison. Both screens are ROOMS
rather than lists: every bed and every cell, taken or free, as the deck's
medium card three to a row, with a gauge of the wait under each card (green in
the infirmary, red turning blue in the prison, where a prisoner stands behind
bars until they turn), because a ceiling that only shows once it bites is a
card lost by surprise. A conscript has no id and never reaches a bed, so
it is always taken in.

One case is answered rather than allowed: a hand of nothing but bandages would
be a turn with no turn to wait through, since a turn IS a card being sent. The
round heals them on the spot and says so (`game.js`, `endTurn`).

## 3. The four screens

They are **views and not cards** ([docs/VIEWS.md](VIEWS.md)): every one of them
is a place with a list to manage, a purchase to make or a deck to finish, and a
screen a stray tap can close is not a screen anything is composed on. They
stack over the village like the album and the shop, they carry the wallet band,
and ESCAPE peels them. `tools/test/views.mjs` holds that contract for all four.

| the door  | what is on it                                                              |
| --------- | -------------------------------------------------------------------------- |
| CARDS     | three tabs: CAMP (7c), DECK (the next battle's cards), COLLECTION          |
| INFIRMARY | what the last battles cost, and how long until each card is back           |
| PRISON    | who was taken, how long until they turn, and the button that enlists them  |
| COMMAND   | four tabs: MANAGEMENT (7c), RECRUITS (the tent), MISSIONS (7b), REGISTER   |
| DEFENSE   | two tabs: STRATEGY (the camp built against a raid, 7e), REPORT (its duels) |

The two houses keep their view keys — `deck` for CARDS, `recruit` for COMMAND —
since the key is the save's and the manifest's, and the name is only a word.

**The cards screen has three tabs, and they are the same cards read three
ways**: CAMP is every card the army holds (7c), DECK the ones taken into the
next battle, COLLECTION every card of the war. DECK is the FORMATION and the one it always opens on
(`lab/stratideck-deck.html`, "two lists"): every slot the battle has, as
medium cards four a row, the empty ones included — one page, nothing to
scroll, no line under the title and none about the gaps (an empty slot says it
is empty). A tap on a card in a slot opens its file
at full size, and the red `−` on its corner sends it back to the reserve; an empty slot is a `+`, and it opens the
**picker** — a card over the screen listing the reserve that can fight today
(every card owned, not in the deck, neither wounded nor away on a mission) as
tokens five a row, in a region of one fixed height so the card never changes
size. Its one filter is the grade, since a spy, a scout or a sapper is looked
for by name; a grade with no card ready is greyed and does nothing. A tap on a
token reads its file, the `+` on its corner takes it into the first gap.
*Auto-fill* completes a short deck with the best fit cards in one tap; it
stays on screen, disabled, when the deck is full or no fit card is left.

COLLECTION is a **codex** (`lab/stratideck-collection.html`, "codex"): four
books behind one switch, each quarter of it also its progress — BLUE (sixty
officers, lit once OWNED: the first roster, the tent), RED (sixty, lit once MET
— turned over in a battle or held in the prison), TURNCOATS (the same sixty red
officers in the blue cloth, lit once one enlisted) and OBJECTS
(`web.army.objects`: the flag, the trap and the six pieces of scenery a camp is
built of — straw man, wooden fence, rock, forest, skull, book — cards with no
grade and no tier, lit once one has been turned over in battle). The screen
carries no line under its title, so the room goes to the card. One card at a
time, at full size, turned like a carousel (a swipe, the arrows, ← / →), and
who they are written under it: name, grade, tier, age, gender, their story —
or, for an object, what it does and what destroys it. What the grade breaks is
not repeated there: the card wears it as a pictogram and the file's back says
it. The three filters — all, had, missing — are pictograms with their count on
a tag, riding the seam between the carousel and that panel. The card in the
middle turns over to its file on a tap. A card never had is its **shadow** —
the piece as a white silhouette named ???, the way an unowned sticker is drawn
— and an officer's shadow keeps its grade and tier badges, in slate; its line
under the card says how it is earned. Tabs and not doors, because a building
each would turn the hub into a shelf of reference books.

**Every badge counts what the player would walk in and ACT on**: the deck badge
is how many slots are still EMPTY and the camp's is how many of the tent's
offers the wallet can actually pay for, plus every squad back from a mission
with a report to read. The infirmary and the prison count who is IN them
— the same list the screen behind the door draws — because both rooms have six
places and a room filling up is the news.

**The army's figures are in the band's fold** — the sword chip between the
level and the coins, which `web.meta.more: ["army"]` turns on
([docs/META.md](META.md)). Five rows, each a door: the missions brought home a
success (`save.ms.w`, to the camp's MISSIONS tab), the officers ever OWNED out
of the whole cast (both armies, 120, to the deck's COLLECTION tab), then the
cards on hand by kind — the army's own in the roster (the deck), the camp's in
the prison (the prison) and the turncoats who enlisted (the deck). The three
counts wear a small card in the side's colour (`--army`, `--camp`, split on
the diagonal for a turncoat) rather than a pictogram. `bandRows` in `army.js`
is the whole of it.

**The card on every screen is the game's own.** `games/stratideck` publishes
its card builder as `Game.cardNode(card, { fmt, w, side, ghost })` — a
`tier` of null is an object, `side: "none"` is a card of neither army, `ghost` is the
shadow — — the painted card
composed in `lab/stratideck-card.html`, which draws with the game's own SKIN
rather than a copy of it — and `cardTile` in `army.js` asks it for one at the size each
screen needs: the deck as a strip of tokens (the lab's `tiny`, 86 px, seven to a
row), the roster as full 5:7 cards four to a row, the infirmary and the prison
as medium cards three to a row, the tent and the prisoner offer as full cards. A game that publishes
no builder keeps the plain tile of `army.css`. The round deals the same nodes
(`game.js`, THE TABLE), so a card picked in the deck screen and the card that
lands on the grid are one object.

## 3b. The cast — every card is a person

`web.army.cast` names **one officer per army, grade and tier**: 2 × 10 × 6 =
120, so every combination is exactly one person and the identity is never
stored — the army a card was raised in, its grade and the tier it was RAISED
at ARE who it is. A promotion (§5b) moves the tier a card fights at and never
that one.

**Every officer is one person, so the camp never holds one twice.** The
roster and the prison together hold each identity at most once (`idKey` in
`army.js`, a turncoat under the camp's key, a promoted card under its base
tier), and `enrol` — the one way into the roster — refuses a second copy.
Every door keeps to it: the first roster takes the nearest free tier of a
grade the manifest asks twice for, the tent never shelves an officer already
held (and a shelf rolled before one joined by another door shows them as
already in the camp), a mission's `card` reward is drawn among the free faces
of its ranges — and paid in the officer's tent price when none is left, or when
the officer joined in the meantime — and a captive the camp already holds, in a
cell or enlisted, is not offered. A save written before the rule is repaired
on load: each copy after the first becomes the nearest free officer of its
grade UNDER its tier (so it reads as already promoted and keeps its strength),
or is bought back at the tent's price when there is none; a duplicate prisoner
is let go. Nothing of it reaches the register.

```json
{ "side": "red", "r": 7, "t": 3, "first": "Marga", "last": "Gellan",
  "age": 58, "gender": "female",
  "desc": "old dark-elf woman with white hair in a high bun…",
  "lore": { "en": "Major Marga Gellan has charted…", "fr": "La major Marga Gellan a cartographié…" } }
```

- `first`, `last`, `age`, `gender` and `lore` are what the player reads, on the
  **back of the card**: a tap on a face in the collection, or on the ID-card
  button hung on the corner of a roster card, opens it large and turns it over
  (`openFile`). The roster card itself keeps its tap for "take it / leave it".
- **A name is a proper noun and is never translated**, like a sticker's;
  `lore` carries both languages, `gender` is `man`/`woman` for the blue army
  (humans) and `male`/`female` for the red camp (creatures), labelled by the
  shell in the player's language.
- `desc` is for the IMAGE MODEL only: it is what `tools/lab/cast-sheets.mjs --prompts` writes each portrait's prompt from, and the builder strips it out
  of `CONFIG.web` (`shippedWeb`), so ~30 KB of prompts never ship.

**The portraits** are `CONFIG.art.cast<Blue|Red|Turn><NN><Tier>`
(`castBlue04C`), cut four to a sheet out of
`assets/image/master/stratideck-object-cast-<side>-NN.png` and adopted by
`node tools/lab/cast-sheets.mjs <sheet>`, which runs `cut-objects --grid 2x2`
and writes the four roles itself, since which cell is which officer is the
layout's and not an index to type. Two layouts, 45 sheets, 180 portraits:

| sheet                  | rows                                                         | columns   |
| ---------------------- | ------------------------------------------------------------ | --------- |
| `cast-blue-01` … `-15` | two grades of the blue army                                  | two tiers |
| `cast-red-01` … `-30`  | one red grade: the camp's uniform, then the same two in blue | two tiers |

They are **web-only** art (`WEB_ONLY_CAST`, build.mjs) and **never preloaded**
(`CONFIG.artLazy`, the motor's `preloadImages`): pictures only ever handed to
an `<img>`. A portrait not painted yet falls back — a turncoat on its red self,
anyone on the grade's face (`game.js`, `castArt`) — so every sheet that lands
fills its four cards and nothing else moves. `lab/stratideck-cards.html` is
every card of the game on one page — blue, red, turncoats, objects — in the
format picked (tiny, medium, big), drawn with the game's own `skin.css`;
served over HTTP (`python3 -m http.server` at the root) it also writes each
officer's name. `lab/stratideck-card.html` is the design bench: the same
`skin.css` linked, the game's `faceNode` and `sizeNode` ported (the cast
portrait at the card's tier), every width the game deals at on one shelf, and a
box that says whether its panel still matches `CONFIG.cards` in `game.js`.

**There are three cards and no more.** Full, mid and tiny are each composed
ONCE, in that bench, at a reference width (`CONFIG.cards.rfull` / `rmid` /
`rtiny`: 125, 112 and 58, the smallest place each is dealt at), and every place
— the hand, the duel, the grid, the token, every screen of the barracks — shows
that card as a whole at its own width. Every length on a card is in em (1% of
its width), so the width alone scales it; the text floors, the one thing in px,
are `calc(18px * var(--sk))` with `--sk` the width over the reference. The
grade badge, the tier badge and the macaron each take a size and an x/y offset
per format (`rankFull`, `rankFullX`, `rankFullY`…), and they are siblings of
`.c-body`, which clips to the card's outline, so they hang over the edge.

**A turncoat is painted twice.** A prisoner who enlists joins the roster with
`o: "red"`: the card is the player's in every rule of the round and wears the
blue army's frame, and its portrait is `castTurn…` — the SAME creature the
player captured, painted directly under its red self on the same sheet so the
face cannot drift, now in the blue uniform. TURNCOAT on the back of the card
says where that face came from.

**No crest on a face, and the same three corners on every format**: the grade
top-left, the tier bottom-right, the macaron bottom-left — the token of a list,
the medium card of the hand and the big card of a file read the same way. The
army is the cloth and the side of the table; a shield in the fourth corner was
one badge too many. **Every small card that answers no other tap opens the
officer's file** — the round's lists, the infirmary and the prison — and the
big card flies out of the small one, turning over and back on the way.

## 4. The deck the round is handed

The barracks says exactly one thing to the game, and it says it by writing a
field rather than by being called:

```js
CONFIG.army = { deck: [ { r: 10, t: 4, id: "7" }, … ], size: 14 };
```

`Game.reset()` reads it fresh on every round, so keeping it current on every
change is enough and there is no start hook to keep in step with the map, the
village and the end screen's PLAY AGAIN. A game that never sees the field
generates its own deck exactly as it always did — which is what a playable and
an endless run do.

**A wounded card is not in it**, whatever the deck screen shows: the deck is
the player's standing choice and the infirmary is a fact about today, so a card
that is healing stays in the deck and is left out of the battle. **What is
missing is made up with CONSCRIPTS** — the bottom of the ladder, with no `id`,
and therefore nothing a battle can wound or the infirmary ever sees. A battle
the player cannot start because their cards are in bandages is a game that
stops; a battle they start badly equipped is a game that costs them.

## 5. What the battle hands back

On the same `endRound` result the game already writes its stat rows into:

```js
army: { won: true, hurt: ["3", "11"], dead: ["7"], used: ["3", "5", "11"],
        met: [ { r: 6, t: 1 }, { r: 12, t: 5 }, … ], captives: [ { r: 8, t: 4 }, … ] }
```

`used` is every card of the barracks the battle PLAYED, by id — what a
promotion is earned with (§5b). A game that sends none has its whole deck
counted instead.

`met` is every enemy card the battle turned over, once each, won or lost — an
officer or an object (the flag is 12, a trap 11). It is what fills the
COLLECTION's camp half and the OBJECTS tab; a round abandoned with the house
button calls no `endRound` and records none of it.

The motor carries it without knowing what any of it is, and `army.js` reads it
in an `onResult` filter beside the level layer's and the meta layer's. The
wounds are written the moment they are known; **the wait starts when the battle
ENDS**, not when the wound landed, or a card hurt on the first turn of a long
round would come back sooner than one hurt on the last — a rule about the
length of a battle rather than about the wound.

**The prisoner is offered on the battle itself, before the end screen** — in
the motor's outro (`onOutro`), after the level layer's own outro, the
three-star gift included. The end screen then arrives with the prisoner already
in a cell or the spoils already in the wallet, and its reveal is not cut by a
card. A player who left the round while the outro played is offered it on the
next arrival at the hub instead. One function, two doors, and the offer is
never silently dropped.

It is **neither dismissed nor escaped** — the tiles are a choice and a choice
has no default, the same rule the three gift boxes are opened under. The way
past it is a line under them, not another control shaped like the tiles.

**It is always at least two tiles.** A battle that left two enemies standing
or more offers the best of them (`capturePick`, three); a battle that left ONE
offers that card **or the spoils** — coins sized on the prisoner
(`(80 + 18 × grade + 25 × tier)`, to the ten), one ticket, or one sticker off
the machine's own draw, dealt out of the meta layer's rewards and flown into
the chip that counts them (`Meta.fx`). A single card with a line under it was a
yes-or-no, not a decision. A build with no meta layer has nothing to pay the
spoils in and keeps the lone card.

**Two identical cards are one card.** The captives are kept one per grade and
tier before the pick is cut, so two sappers of the same tier are never offered
side by side; where that leaves a single prisoner out of several, the spoils
beside it are always the coins.

`fill` is handed the modal's `close`, and the tiles use THAT one: the handle
`MD.open` returns does not exist yet while `fill` runs, and a tile built with it
wrote its prisoner and then threw, leaving the card on screen and taking a
prisoner per tap. One tap is also the only one that counts — the card stays
in the document for its fade.

## 5b. Promotions — a card that serves climbs

**A service** is a battle a card was played in, a mission it was sent on, or a
battle fought while it held a post (`s` on the card, counted since its last
promotion). **A victory** — a battle won, a mission brought home — rolls every
card that served it for one step up the ladder, E to D, D to C… S has nowhere
left to go:

```
chance = min(max, base + step × (services − 1))      web.army.promotion: 0.15, 0.01, 0.30
```

A fresh card climbs one win in six or seven, a veteran of a dozen services one
in five, and the chance goes back to `base` once it has climbed — each rank is
earned again. A lost battle or a failed mission still counts the service and
rolls nothing; the dead roll nothing.

**The face climbs, the person does not.** The card keeps the tier it was
raised at in `b` (written the first time it climbs), and that is the tier its
name, its portrait and the BACK of its card are read at: the recto wears the
current tier — frame, badge, pips, plate — and the verso keeps its original
style, so turning a card over always shows where it started, with one fact
more on it (`Promotion : C`). The round gets both (`CONFIG.army.deck[i].b`,
`card.base` in `game.js`) and fights at `t`.

**Every promotion is told, on a card of its own** (`openPromos`): the officer
before and after at the medium size, the name, the step and what earned it. A
battle's are told on the battle itself, before the end screen (§5c); a
mission's follow its report the moment it is put away. Several are one card whose pages
a tap turns — neither the scrim nor a stray key skips a page nobody read.

## 5c. The battle tells what it cost before it shows the score

Between the last move and the end screen, over the frozen round (the motor's
`onOutro`, after the level layer's own outro), the barracks lays out what the
battle did to the army, one card per kind however many cards it tells of,
in this order: **IN MEMORIAM** (the cards lost), **WOUNDED** (the cards sent to
the infirmary, the wait on each and the beds left), **the prisoner** to pick
(§5), then **PROMOTION** (§5b). Losses before gains, and the choice before the
congratulations, so the last card before the scores is good news. Each card is
put away by a tap anywhere — except the prisoner, which is a choice — and a
card on them opens its officer's file; none of them leaves the round for a
screen of the camp. The end screen then arrives with everything already
written.

A player who leaves the round while those cards play gets the dead and the
promotions at the village instead (`announce`); a wound needs no second
telling, the infirmary shows it.

## 6. The two waits, and the way out of them

1 to 24 hours in the infirmary (by the tier gap), 4 to 48 in the prison (by
the prisoner's grade, `prisonHours: [4, 48]`: a spy talks soonest, a marshal
last). **Neither is bought out
with an ad**: the infirmary's "heal everyone" button is gone, and the prison
never had one — a prisoner is a bonus that blocks nothing, so the wait is
a reason to come back, like a squad on a mission. A wound still ends early
when the camp's own day says so (the `healAll` event).

**On a machine that is plainly not a player's the clock is moved by hand**, the
same fence the daily road keeps (`W.Dev`, `meta.js`): localhost or a LAN
address. An hour is always an hour; the band's DEV pill opens the DEV view
([VIEWS.md](VIEWS.md)), whose clock **advances** the hours with the player in
the camp or has them **reconnect** that much later (a reload, so the raid, the
camp's news and the returns are the boot's own), and whose events fire every
card of this layer on demand — a camp day by name, a raid on the validated
defense, a prisoner offer, a promotion. Nothing of it reaches a deployed site.

## 7. Recruiting

One formula rather than a table of sixty: the grade lifts the price gently and
the tier multiplies it, so an S is a decision and an E is pocket change. All
three numbers are the manifest's.

```
price = base × (1 + gradeStep × (grade − 1)) × tierStep ^ tier      (rounded to 5)
```

**The shelf is rolled on a clock, not on arrival.** A shelf that re-rolls every
time the player walks in is a shelf they re-roll instead of buying from, and
the price stops meaning anything. It turns over every twenty minutes
(`refreshMinutes`; a manifest may still write `refreshHours`). Nothing
re-rolls it early — the ad that did was removed in 0.15.0.

**The tent never rolls the three specials.** A spy, a scout and a sapper are
ANSWERS to something — the marshal, the fog, the traps — and a tent that sold
them would be selling the solution rather than the army.

**But a player is never stuck for a grade.** Every grade the roster holds none
of — the specials included — gets a place on the shelf at the lowest tier
nobody holds, for `recruit.needPrice` coins (20) whatever its grade: a camp
without a spy has no answer to a marshal, and that is a door shut rather than
a cost. It is checked every time the shelf is read, not only when it is
rolled, so a grade lost mid-shelf is answered at once; the place is taken from
an offer nobody bought, a fallen one last, and with none left the shelf grows
by one. A card wounded, away or at a post is still the camp's, so its grade is
not missing. The first roster holds all ten.

**The tent is also where the dead come back.** A shelf rolled while the
register holds an officer the camp no longer has keeps one place for one of
them `recruit.fallen` of the time (40 %), wearing the RESCUE ribbon (the NEW
one in green, in English in every language), at the tier they
were raised at — the rank they had earned died with the file — and a special
is no exception: that is buying back what the army had, not the answer to a
question. Recruited, the register's line stays and says they are back in
service.

A card bought goes **straight into the deck** if there is room: a purchase the
player then has to visit a second screen to use is a purchase they do not feel.

## 7b. Missions — a bet made with cards

The command's third tab. The board offers a few scenarios out of
`web.army.missions.list` (fifty in `games/stratideck`) — a pretext, a
difficulty from 1 to 5, a length of 20 minutes to 6 real hours (`minutes`), a squad of two to five
cards, what it pays and what a failure costs. On the board each is **one
line** and a door: the token of the grade it favours, the title and its pips,
then the length, the squad and the first reward — the pretext and the full
stakes are the briefing's. The player answers one with a squad picked on a
**briefing**, one level under the tab (the tab and CANCEL
lead back to the board). Its slots work as the deck's do: a `+` opens the
deck's own picker over the cards free to go (a token tagged with the mission's
favour), a card taken is a door to its file with a `−` on its
corner. The odds are printed live as each card is taken or left, drawn as a
shelf of the album draws its own — a track and the chance in a pill, the
notch where the squad stands on its own merits and the hatch what the favoured
grade adds past it:

```
power  = grade + tierWeight × tier   (+ favorBonus on the grade the mission favours)
chance = clamp(par × Σ power / need[difficulty], floor, ceil)
```

A squad worth exactly `need` reads `par` (70 %), and the odds never reach 0 or
100: a mission that cannot fail is a wait, one that cannot succeed is a trap.
**A mission may favour one grade** (`favor`), and the specials are what most of
them favour — a reconnaissance wants a scout, a stolen letter a spy, a
trapped bridge a sapper — which gives the three cards the tent never rolls a
use off the grid.

**The squad is away for the whole wait**: still in the deck, since the deck is
the player's standing choice, and out of every battle until it is back — the
rule a wound follows, and the deck screen tags it ON MISSION. The board is
rolled on a clock (`refreshHours`) like the tent's shelf, the missions run
least first and one per difficulty before a difficulty repeats. **No ad rolls it early and no ad
brings a squad home**: a board bought again is a board shopped for the easy
mission, and the wait is the reason to come back to the game later.

**A slot is one place on the board, whatever it holds.** The missions' post
opens `slots` of them (`[2, 6]`: two with nobody at the post, six under an S
who suits it), and each is in one state at a time: a MISSION offered, the
SQUAD sent on it (the squad leaves from its mission's own row), the REPORT it
came back with, then EMPTY until the clock rolls the board again, which fills
every slot holding no squad and no report — the missions nobody picked
included. So the board is also the ceiling on the squads away: six at most,
and there is no second limit. A slot past the gauge still shows the squad or
the report it holds (a post relieved never locks a squad out of its own
row).

**The tab is two sections and no subtitle.** THE BOARD draws all six rows —
the ones the gauge has not opened as a padlock and the word LOCKED, and a tap
on one names the post — at one height, so a slot changing state never moves
the rows under it. REPORTS is the history: every report collected, newest
first and at most twenty, each row stamped success or failure and re-opened
on a tap, as it was written and paying nothing.

**The outcome is drawn at the departure** (`z` in the save), so no reload
re-rolls it. The report is written when it is opened — a wound goes to the
infirmary (and a wound with no bed is a card lost, the round's rule), a loss
leaves the roster — and what it pays is granted on the tap that closes it, so
the chips count up in front of the player. The report is the scenario's own:
its `brief` first, the pretext the squad left on, then `win` or `lose`, with
`{leader}` replaced by the name of the squad's highest-ranking officer, then the squad as it came back and what it paid or
cost. The French texts never make a word agree with `{leader}`, who may be a
man or a woman.

| reward (`reward`)             | penalty (`fail`)                    |
| ----------------------------- | ----------------------------------- |
| `coins`, `xp`, `ticket` (`n`) | `wound` — n of the squad            |
| `super` — super tickets       | `lose` — n of the squad             |
| `sticker` — one machine draw  | `coins` — n coins, never below zero |
| `card` — `r` and `t` ranges   |                                     |

## 7c. The posts, the camp and the register

Three pages read the army as a whole, in two houses: the posts are the
command's first tab, the roll the cards' first tab, the register the
command's last.

**MANAGEMENT is the six posts** — camp, formation, missions, infirmary,
prison, kitchen, three a row — one officer each, filled with the deck's
own picker (`pickCard`, the same reserve, the same grade strip) and emptied
with the same `−`. **A post is exclusive**: the picker offers only a free card
out of the reserve, and a card at a post is out of the deck picker, the squads
and the round's deck (`free()` in `army.js`) until it is relieved.

**Every post is a gauge, 0 to 100 %, and the officer holding it fills it**
(`postPct`): the TIER sets the figure (`web.army.posts.tier`, 10 % at E to
90 % at S, 16 a step) and **a trade that suits the post adds `posts.match` (+10 %)** —
so a full gauge is an S doing the job they were born for, an empty post is
0 %. Every officer has one TRADE, printed on the back of the card and in the
codex (`job` on each cast entry, `web.army.jobs` for the thirty names, EN, FR
and the French feminine): five per post, and each suits one post and no
other — carpenter, postman, chaplain, archivist, governor for the camp;
instructor, master-at-arms, tactician, commando instructor, horse master for
the formation; cartographer, intelligence analyst, liaison officer,
signaller, expedition leader for the missions; surgeon, nurse,
stretcher-bearer, pharmacist, doctor for the infirmary; warden, interrogator,
guard, jailer, judge for the prison; cook, baker, butcher, dietitian, brewer
for the kitchen. Each trade is held by two blue and two red officers, spread
over the tiers, so every post has an S who suits it. The picker prints on
every token the gauge it would give at that post, gold where the trade suits;
the post's name, tapped, says which trades suit it.

What a gauge buys is a RANGE in the manifest, read at the gauge and rounded
(`postVal`) — a plain number is a range of one, so a manifest written before
the gauges keeps its figure:

| post      | reads                        | range                                 |
| --------- | ---------------------------- | ------------------------------------- |
| camp      | captives offered after a win | `capturePick` `[1, 3]`, + a straggler |
| formation | the deck's slots             | `deckSize` `[12, 20]`                 |
| missions  | the mission slots            | `missions.slots` `[2, 6]`             |
| infirmary | beds                         | `infirmaryBeds` `[2, 9]`              |
| prison    | cells                        | `prisonCells` `[2, 9]`                |
| kitchen   | the odds of a good day (§7d) | `events.good` `[0.3, 0.9]`            |

**The camp's straggler**: past `posts.spare` (50 %) the camp gauge is also a
chance, 0 at 50 % and 1 at 100 %, that a won battle offers one more captive
than it left standing — an officer the battle turned over, found hiding once
the fighting stopped — even when it left none (`straggler`, marked `sp`, and
the capture card says so).

**Every ceiling is drawn.** The deck, the beds, the cells and the mission
board draw every slot the range could ever open; the ones past the gauge are
LOCKED, a padlock and the gauge that opens them (`pctNeeded`), and a tap on
one names the post and its trades. A formation whose gauge falls (its officer
relieved or lost) cuts the deck back from the end, and says so; a board whose
gauge rises tops itself up at once (`ms.n`, the slots it was rolled with); a
room whose gauge falls keeps whoever is already inside.

**CAMP, on the cards house, is the roll**: every card the camp holds, the
prisoners included, four a row, each with what it is doing — at a post (its
role: in command, drill instructor, mission officer, infirmary manager,
prison warden, camp cook), in formation, on a mission,
wounded, in prison, or in reserve — with the wait under it where there is one.
The section's count is the number of cards listed.

**REGISTER is every card lost**, newest first: a wound the infirmary had no
bed for (in a battle or on a mission) or a squad member who did not come back.
A card leaves the roster through `retire()` and nowhere else, and `retire()`
writes the entry, so the list cannot miss one. It starts empty on a save
written before 0.15.0 — the losses before it were never kept. **Each cause
wears its pictogram**, on the card's corner and before the line that says it:
a sword for a battle, a compass for a squad that never came back, a heart for
a mission's wound with no bed to lay it in (`why`: `battle`, `mission`,
`wounds`).

**A death is told once, on a card that does not celebrate** (`openFallen`, IN
MEMORIAM): every death since the last one told, however many — one card, the
causes one line each, then the medium card for a single loss or the tokens for
several, each a door to this tab. It opens on the battle itself, before the end screen (§5c),
or after a mission's report when that is where the loss came from — and at
the village for a death nobody was shown, before any promotion; there its
cards are doors to this tab. An entry is `nw` until it has been shown.

## 7d. The camp's day — the kitchen

Every `events.everyHours` (2) real hours something happens in the camp.
`web.army.events.list` holds forty days, twenty good and twenty bad, each a
title, a line (`{c}` the officer it is about, `{m}` a squad's mission) and one
effect (`fx.kind`): coins or tickets won or lost, xp, a super ticket, a
sticker, a free recruit, an enemy defector in a cell, a deserter, wounds, the
infirmary emptied or slowed, a promotion, a prisoner escaped, turned or held
back, the tent refilled or flattened, the mission board redrawn, a squad home
early or late. **The kitchen decides the odds**: a day is good at
`events.good` read at the kitchen's gauge — 30 % with nobody at the stove, 90 %
with an S cook. A day is never one of the last six, never one with nothing to
act on (no fever with an empty infirmary, no desertion that would leave fewer
cards than the smallest deck), and never aimed at an officer holding a post.

A day is DRAWN the first time the village opens after its hour — the card it
is about included — and kept in `ev.q`, so no reload re-rolls it; at most
`events.stack` (3) wait, a week away is not a week of cards. It is TOLD at the
village only, on arrival in the game or back from a battle, after the dead and
the promotions (`announce`), one card per day; the tap that puts a card away
is what applies it, and the chips fly into the band. A deserter is written in
the register (`why: "desert"`) without a funeral — the day's card already said
it — and the tent may find them again like any lost card.

On a local machine an hour is a second, so a day falls due every four seconds;
`tools/test/views.mjs` holds them back (`__ARMY__.quietDays`) and draws one on
purpose (`__ARMY__.drawDay`).

## 7e. The defense — the camp the player builds

The DEFENSE house opens a grid of `cols × rows` (5 × 4) that the player fills
from the deck's own picker: **the flag first** — the picker offers it alone
until it stands — then their own cards and the objects the climb has handed
over, each object `perObject` (2) times at most and the flag once. The bottom
row is the FRONT, as a camp's bottom row is in a battle.

- **A card on guard stays in the deck.** The defense takes it out of the
  posts and the squads only (`onGuard`): a roster of seventeen cannot man a
  grid of twenty and a deck of twelve at once. A card wounded, away or posted
  since it was placed stays drawn, dimmed, and is not there when the camp is
  stormed.

- **Validating arms it.** The grid a raid storms is the one last validated
  (`df.v`), so a layout half rearranged is never what the attacker finds; the
  player may change it freely and validate again.

- **The objects are unlocked by biome.** `defense.unlock[b]` lists what
  clearing band `b` hands over — the band the map calls PASSED, the milestone
  the stickers are paid on. The objects are dealt in the enemy camps from the
  level `objects[].camp` names, inside the biome whose end hands them over, so
  each one is met in battle first and owned after:

  | end of the biome | objects                 | first dealt in a camp |
  | ---------------- | ----------------------- | --------------------- |
  | Outpost          | straw man, wooden fence | level 1               |
  | Palisade         | rock, forest            | levels 7, 8           |
  | Warcamp          | skull                   | level 13              |
  | Siege            | book                    | level 19              |
  | Citadel          | trap                    | (already in camps)    |

  One card tells them, at the village, the first time the band is passed —
  every new object on it at once. The collection's OBJECTS tab reads the same
  unlocks: an object is owned once it is handed over, and its shadow names the
  biome that hands it over.

**A raid comes with every return.** `seen` is the last moment the player was
here — every write moves it, and so does the tab going to the background — and
a session that starts, or a tab that comes back, after `attack.awayHours` (4)
of absence arms one raid, played at the village. There is no roll: the player
left, and the red army came while they were gone. A reload is not an absence,
so prisoners cannot be farmed by refreshing.

**How well a layout holds is played, not computed.** `Game.defense`
(games/stratideck) plays the assault `attack.runs` (200) times with the
battle's own rules — `judge`, every object's effect, the hand dealt afresh —
and one more run is the raid that happened. The attacker is the player's own
roster in a mirror, every grade and tier a step up, down or the same, so it is
as strong as the camp at every point of the climb. It takes a flag it can see,
sends the tightest card that beats one it has turned over, scouts the dark and
otherwise probes it, leaning toward the back. **A raid lasts `attack.turns`
(12) cards**: without a bound a winner going back under the deck wins forever
and every defense falls; with it, a layout buys time. On a 17-card roster the
bench reads 0 % for a flag left open, ~35 % for a flag on the front row, ~56 %
for a full grid, ~70 % with objects and ~89 % for a flag in a back corner
walled with fences and straw men.

The share held is the **solidity**, and it is shown in the REPORT only, never
while the layout is composed. Held: one or two of the attackers who fell are
taken prisoner (a prison with no cell takes nobody), plus coins and xp. Taken:
a nudge rather than a punishment — coins out of the wallet or one or two of
the cards the raid beat sent to the infirmary, never a card lost and never a
wound without a bed. Everything scales on the player's level over `levelSpan`:

```
defense.win   prisoners [1, 2], coins [40, 400], xp [30, 300]
defense.loss  coinShare [0.03, 0.12] of the wallet (coinCap 500),
              wounds [1, 2], woundHours [6, 24]
```

**The house has two tabs.** STRATEGY is the grid above, where the house
opens; REPORT is the last raid read back — whether the camp held, the
solidity, the tally, and the duels in the order the red army sent its cards
— one bout a line, the red attacker facing the camp's card (the very officer
on guard) at the deck's medium size, VS between them and the outcome under
it: the officer by their first and last name — `Sara Colt wins`, `Tom Reed is held back` against a fence. The winner's half of the
plate is tinted in its army's colour and the loser dimmed; a winner a
better-equipped loser wounded wears a wound badge and a *Wounded* line, and
the bout that took the flag is ringed in red.
`Game.defense` hands the duels back as `run.log`, and the report keeps them
as `log`, `{ a [grade, tier], d [grade, tier] or [object], k judge's kind, h 1 when the winner was wounded }` each. The village shows the report once
and pays it, and a tap on that card opens the defense straight on this tab (a
key only pays it: ESCAPE and ENTER put a card away rather than walk
somewhere); the tab only ever shows the report already read (`df.last`).

`__ARMY__.raid()` writes a report from the validated defense on demand and
tells it at the village — the test hook, and the way to see one in DEV.

## 8. Where the save lives

`save.ar`, inside the meta layer's own `meta:<slug>` key, written through
`MT.army()` / `MT.setArmy()` — the same arrangement the daily road has, and for
the same reason: it is bought with that wallet, and a second key would be a
second thing for OPTIONS to erase and a second thing to forget.

```
n  the next id to hand out — ids are NEVER reused, because the deck, the
   infirmary and a battle's wound list are three lists pointing at one card
r  the roster   { i id, g grade, t tier, w when its wound heals (0 = fit),
                 ws how long that stay is, for its gauge,
                 o "red" on a prisoner who enlisted — absent otherwise,
                 b the tier it was raised at, once promoted,
                 s services since its last promotion }
up promotions not yet told { i, g, o, b, f from, t to, why "battle" | "mission" | "post" }
d  the deck     ids, in the order the player put them in
p  the prison   { g, t, u when the prisoner turns }
po the posts    { post key → card id }: cmd, drill, ops, inf, pri, cook
ev the days     { t the hour the last one fell due, q drawn and not told,
                 h the last six drawn }
x  the register every card lost, newest first, 200 at most
                 { g, t, b, o, why "battle" | "mission" | "wounds" | "desert", m mission id, at,
                   nw not told yet, back when the tent found them alive }
k  the tent     { t when the shelf was rolled, o the offers { g, t, o, f fallen,
                 m a missing grade, sold at needPrice }, b the ones bought }
ms the missions { v 2, t when the board was rolled, o the mission offered
                 in each slot (by slot, null where none),
                 r the squads away { k slot, m, c card ids, e back at, p odds, z roll },
                 q reports written and not collected (each keeps its slot k),
                 l reports collected (newest first, 20 at most),
                 h mission → times run, n the slots the board was rolled with }
c  the collection, which only grows: { h officer → 1 once owned,
   m officer → 1 once met, o object → 1 once turned over }, an officer
   being the cast's key, "b4.2" = the blue sergeant at C — the OBJECTS tab
   now reads the defense's unlocks instead of `o` (7e)
df the defense  { g the grid being composed, 20 cells of null | { i id } | { r object },
                 v the grid last validated (what a raid storms), vt when,
                 seen the last moment the player was here, pend a raid to roll,
                 q the report not yet read, last the last one read,
                 an object → 1 once its unlock was told }
```

Every card that joins the roster goes through one function (`enrol`), so the
collection cannot miss one; a save written before the cast starts it from what
it can prove — the roster owned, the prisoners met, and the older per-grade
book (`b`, `r`: best tier had or met), one officer per grade.

## 9. Adding a game to it

A `web.army` block, and nothing else. The card model is entirely the
manifest's — this layer knows that a card is a grade and a tier, and nothing
about what either means.

```json
"army": {
  "deckSize": 14,
  "infirmaryHours": [1, 24],
  "prisonHours": [4, 48],
  "infirmaryBeds": 6,
  "prisonCells": 6,
  "capturePick": 3,
  "conscript": { "r": 4, "t": 0 },
  "tiers": ["E", "D", "C", "B", "A", "S"],
  "grades": [
    { "r": 1, "name": "Spy", "art": "cardBlueSpy", "foe": "cardRedSpy" }
  ],
  "recruit": { "slots": 4, "refreshMinutes": 20,
               "base": 90, "gradeStep": 0.22, "tierStep": 1.9, "fallen": 0.4,
               "needPrice": 20 },
  "promotion": { "base": 0.15, "step": 0.01, "max": 0.3 },
  "missions": { "slots": [2, 6], "refreshHours": 8,
                "need": [10, 20, 32, 46, 64], "par": 0.7,
                "tierWeight": 2, "favorBonus": 10,
                "list": [ { "id": "m01", "d": 1, "minutes": 20, "squad": [2, 3],
                            "favor": 2, "reward": [ { "kind": "coins", "n": 150 } ],
                            "fail": [ { "kind": "wound", "n": 1 } ],
                            "title": { "en": "…", "fr": "…" }, "brief": { … },
                            "win": { … }, "lose": { … } } ] },
  "start": [ { "r": 10, "t": 1 }, { "r": 7, "t": 1 }, { "r": 7, "t": 0 } ]
}
```

`art` is the player's painted face and `foe` the camp's — the same officer on
both sides of the same war, which is what makes the card offered on the end
screen visibly the card that was just fighting back. Both are keys of
`CONFIG.art`, so they come from a file name like every other piece of artwork
([docs/ASSETS.md](ASSETS.md)); a build with none of it falls back to the
grade's number.

`start` is the roster a first-time player is handed — one entry per officer,
since every officer is one person (an `n` above 1 takes the nearest free tier
of that grade for each copy) — and **their first deck is filled for them, best
first**: a player who opens a brand new game, walks past
a hub they have never seen and presses PLAY must not lose their first battle to
an empty deck screen they had no reason to open.

The game also needs **four more doors on its hub** — `deck`, `infirmary`,
`prison` and `recruit` roles in `web.village` — and a fifth, `defense`,
once it declares `web.army.defense` (7e) — and the word under each one is
this layer's, not the composition's ([docs/VIEWS.md](VIEWS.md)): the `recruit`
role is the CAMP, and a game with no `missions` block keeps the tent alone on
it, with no tab bar.

## 10. What it does not do

- **No online anything.** The roster is one device's, in `localStorage`, like
  every other save in this shell.
- **No trading, no packs, no second currency.** Recruiting spends the coins the
  score already pays; a currency that only buys cards would be a second economy
  to balance for one screen.
- **No bought levels.** A card climbs a tier by serving and winning (§5b), and
  by nothing else: no coins, no ad, no duplicate fed to it. A roster that could
  be upgraded at will is a roster where the tier stops meaning anything, and
  the tier is what the whole fight rule stands on.
