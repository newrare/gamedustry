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
 DECK   INFIRMARY  PRISON    CAMP     map ──► the round ──► end screen
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
After the battle it goes to the **infirmary** for two real days.

**The infirmary has six beds and the prison six cells** (`infirmaryBeds`,
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

| the door  | what is on it                                                             |
| --------- | ------------------------------------------------------------------------- |
| DECK      | the next battle's cards, slot by slot — plus a COLLECTION tab             |
| INFIRMARY | what the last battles cost, and how long until each card is back          |
| PRISON    | who was taken, how long until they turn, and the button that enlists them |
| CAMP      | four tabs: RECRUITS (the tent), MISSIONS (7b), CAMP and REGISTER (7c)     |

**The deck screen has two tabs, and the second is the same cards read another
way.** DECK is the FORMATION and the one it always opens on
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
composed in `lab/stratideck-card.html`, whose stylesheet is pasted verbatim into
the game's SKIN — and `cardTile` in `army.js` asks it for one at the size each
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
officer's name. `lab/stratideck-card.html`, THE CAST, is the design bench.

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
battle's promotions wait for the next arrival at the village; a mission's
follow its report the moment it is put away. Several are one card whose pages
a tap turns — neither the scrim nor a stray key skips a page nobody read.

## 6. The two waits, and the way out of them

Two real days in the infirmary, five in the prison. **Only the first can be
bought out**, with the shell's **rewarded-ad placeholder** (`Meta.ad`,
[docs/META.md](META.md)) — one button for all the bandages at once, and none per
bed, because an ad per wound is four ads for one battle and a price nobody pays
twice. The prison has no ad at all: a prisoner is a bonus that blocks nothing,
so the five days are a reason to come back, like a squad on a mission.

Without that button a player whose three best cards are in bandages has nothing
to do for two days, which is not a mechanic, it is a closed door.

**On a machine that is plainly not a player's an hour is a second**, the same
fence the daily road keeps (`army.js`, `DEV`): localhost, a LAN address or a
`file://` page. The band's DEV pill ([VIEWS.md](VIEWS.md)) says so, so a
screenshot can never be mistaken for the real thing, and nothing of it reaches
a deployed site.

## 7. Recruiting

One formula rather than a table of sixty: the grade lifts the price gently and
the tier multiplies it, so an S is a decision and an E is pocket change. All
three numbers are the manifest's.

```
price = base × (1 + gradeStep × (grade − 1)) × tierStep ^ tier      (rounded to 5)
```

**The shelf is rolled on a clock, not on arrival.** A shelf that re-rolls every
time the player walks in is a shelf they re-roll instead of buying from, and
the price stops meaning anything. Nothing re-rolls it early — the ad that
did was removed in 0.15.0.

**The tent never sells the three specials.** A spy, a scout and a sapper are
ANSWERS to something — the marshal, the fog, the traps — and a tent that sold
them would be selling the solution rather than the army.

**The tent is also where the dead come back.** A shelf rolled while the
register holds an officer the camp no longer has keeps one place for one of
them `recruit.fallen` of the time (40 %), tagged BACK ALIVE, at the tier they
were raised at — the rank they had earned died with the file — and a special
is no exception: that is buying back what the army had, not the answer to a
question. Recruited, the register's line stays and says they are back in
service.

A card bought goes **straight into the deck** if there is room: a purchase the
player then has to visit a second screen to use is a purchase they do not feel.

## 7b. Missions — a bet made with cards

The camp's second tab. The board offers a few scenarios out of
`web.army.missions.list` (fifty in `games/stratideck`) — a pretext, a
difficulty from 1 to 5, a length of 4 to 48 real hours, a squad of two to five
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
trapped bridge a sapper — which gives the three cards the tent never sells a
use off the grid.

**The squad is away for the whole wait**: still in the deck, since the deck is
the player's standing choice, and out of every battle until it is back — the
rule a wound follows, and the deck screen tags it ON MISSION. At most
`running` squads are out at once, and the board is rolled on a clock
(`refreshHours`) like the tent's shelf, the missions run least first and one
per difficulty before a difficulty repeats. **No ad rolls it early and no ad
brings a squad home**: a board bought again is a board shopped for the easy
mission, and the wait is the reason to come back to the game later.

**The tab is three sections and no subtitle**, in the order they are read.
THE BOARD first, `offers` slots, and a mission sent leaves its slot empty
until the clock rolls the board again. UNDER WAY is `running` slots — the
squads away, a report not yet collected, and a dashed slot per squad the camp
could still send. REPORTS is the history: every report collected, newest
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

## 7c. The camp and the register

The camp's third and fourth tabs read the army as a whole.

**CAMP is two halves on one page.** First the **five posts** — infirmary,
prison, formation, missions, camp — one officer each, filled with the deck's
own picker (`pickCard`, the same reserve, the same grade strip) and emptied
with the same `−`. **A post is exclusive**: the picker offers only a free card
out of the reserve, and a card at a post is out of the deck picker, the squads
and the round's deck (`free()` in `army.js`) until it is relieved. A post has
**no effect yet** — it is the slot and the lock, nothing reads it. Then the
**roll**: every card the camp holds, the prisoners included, four a row, each
with what it is doing — at a post (its role: infirmary manager, prison warden,
drill instructor, mission officer, in command), in formation, on a mission,
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
several, each a door to this tab. It opens on the next arrival at the village,
before any promotion, and after a mission's report when that is where the loss
came from. An entry is `nw` until it has been shown.

## 8. Where the save lives

`save.ar`, inside the meta layer's own `meta:<slug>` key, written through
`MT.army()` / `MT.setArmy()` — the same arrangement the daily road has, and for
the same reason: it is bought with that wallet, and a second key would be a
second thing for OPTIONS to erase and a second thing to forget.

```
n  the next id to hand out — ids are NEVER reused, because the deck, the
   infirmary and a battle's wound list are three lists pointing at one card
r  the roster   { i id, g grade, t tier, w when its wound heals (0 = fit),
                 o "red" on a prisoner who enlisted — absent otherwise,
                 b the tier it was raised at, once promoted,
                 s services since its last promotion }
up promotions not yet told { i, g, o, b, f from, t to, why "battle" | "mission" | "post" }
d  the deck     ids, in the order the player put them in
p  the prison   { g, t, u when the prisoner turns }
po the posts    { post key → card id }: inf, pri, drill, ops, cmd
x  the register every card lost, newest first, 200 at most
                 { g, t, b, o, why "battle" | "mission" | "wounds", m mission id, at,
                   nw not told yet, back when the tent found them alive }
k  the tent     { t when the shelf was rolled, o the offers, b the ones bought }
ms the missions { t when the board was rolled, o its mission ids,
                 r the squads away { m, c card ids, e back at, p odds, z roll },
                 q reports written and not collected, l reports collected
                 (newest first, 20 at most), h mission → times run }
c  the collection, which only grows: { h officer → 1 once owned,
   m officer → 1 once met, o object → 1 once turned over }, an officer
   being the cast's key, "b4.2" = the blue sergeant at C
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
  "infirmaryHours": 48,
  "prisonHours": 120,
  "infirmaryBeds": 6,
  "prisonCells": 6,
  "capturePick": 3,
  "conscript": { "r": 4, "t": 0 },
  "tiers": ["E", "D", "C", "B", "A", "S"],
  "grades": [
    { "r": 1, "name": "Spy", "art": "cardBlueSpy", "foe": "cardRedSpy" }
  ],
  "recruit": { "slots": 3, "refreshHours": 6,
               "base": 90, "gradeStep": 0.22, "tierStep": 1.9, "fallen": 0.4 },
  "promotion": { "base": 0.15, "step": 0.01, "max": 0.3 },
  "missions": { "offers": 3, "running": 3, "refreshHours": 8,
                "need": [10, 20, 32, 46, 64], "par": 0.7,
                "tierWeight": 2, "favorBonus": 10,
                "list": [ { "id": "m01", "d": 1, "hours": 4, "squad": [2, 3],
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
`prison` and `recruit` roles in `web.village` — and the word under each one is
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
