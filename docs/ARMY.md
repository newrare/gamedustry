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
 DECK   INFIRMARY  PRISON  RECRUITS   map ──► the round ──► end screen
   │        ▲         ▲        │                                │
   │        │         │        └── coins ◄── the meta layer     │
   └────────┴─────────┴──────────── wounded, captives ◄─────────┘
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
end-of-battle offer does not open on a full prison. Both screens draw every bed
and every cell, taken or free, because a ceiling that only shows once it bites
is a card lost by surprise. A conscript has no id and never reaches a bed, so
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
| DECK      | the roster and the next battle's cards — plus COLLECTION and OBJECTS tabs |
| INFIRMARY | what the last battles cost, and how long until each card is back          |
| PRISON    | who was taken, how long until they turn, and the button that enlists them |
| RECRUITS  | what the tent is offering, and what each one costs in coins               |

**The deck screen has three tabs, and the other two are the same cards read
another way.** DECK is the screen as it was and the one it always opens on.
COLLECTION is the whole CAST (section 3b): sixty officers a side, one line per
grade and the six tiers along it, the player's army first. A blue officer is
lit once OWNED (the first roster, the tent), a red one once MET — turned over
in a battle or held in the prison. OBJECTS is `web.army.objects`: the flag, the trap and the six
pieces of scenery a camp is built of (straw man, wooden fence, rock, forest,
skull, book), cards with no grade and no tier, lit once one has been turned
over in battle. A card never had is its **shadow** — the piece as a white
silhouette named ???, the way an unowned sticker is drawn — and an officer's
shadow keeps its grade and tier badges, in slate: the grade names the slot, the
tier is E, the floor a first copy starts from. The six pieces
of scenery light up the way the flag and the trap do, the first time a camp
deals one and the player turns it over (section 2). Tabs and not doors,
because a building each would turn the hub into a shelf of reference books.

**Every badge counts what the player would walk in and ACT on**: the deck badge
is how many slots are still EMPTY and the tent's is how many of its offers the
wallet can actually pay for. The infirmary and the prison count who is IN them
— the same list the screen behind the door draws — because both rooms have six
places and a room filling up is the news.

**The card on every screen is the game's own.** `games/stratideck` publishes
its card builder as `Game.cardNode(card, { fmt, w, side, ghost })` — a
`tier` of null is an object, `side: "none"` is a card of neither army, `ghost` is the
shadow — — the painted card
composed in `lab/stratideck-card.html`, whose stylesheet is pasted verbatim into
the game's SKIN — and `cardTile` in `army.js` asks it for one at the size each
screen needs: the deck as a strip of tokens (the lab's `tiny`, 86 px, seven to a
row), the roster as full 5:7 cards four to a row, the infirmary and the prison
as tokens, the tent and the prisoner offer as full cards. A game that publishes
no builder keeps the plain tile of `army.css`. The round deals the same nodes
(`game.js`, THE TABLE), so a card picked in the deck screen and the card that
lands on the grid are one object.

## 3b. The cast — every card is a person

`web.army.cast` names **one officer per army, grade and tier**: 2 × 10 × 6 =
120, so every combination is exactly one person and the identity is never
stored — the army a card was raised in, its grade and its tier ARE who it is.

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
army: { won: true, hurt: ["3", "11"], met: [ { r: 6, t: 1 }, { r: 12, t: 5 }, … ],
        captives: [ { r: 8, t: 4 }, … ] }
```

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

**The prisoner is offered on the end screen**, but the end screen is a busy
place: the motor is still revealing it, the meta layer is counting coins into a
wallet on it, and a round that earned a star is being offered an ad. So the
card waits for the install CTA to land and for the modal layer to be empty, and
if the player has walked off by then it is offered on the next arrival at the
hub instead. One function, two doors, and the offer is never silently dropped.

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

`fill` is handed the modal's `close`, and the tiles use THAT one: the handle
`MD.open` returns does not exist yet while `fill` runs, and a tile built with it
wrote its prisoner and then threw, leaving the card on screen and taking a
prisoner per tap. One tap is also the only one that counts — the card stays
in the document for its fade.

## 6. The two waits, and the way out of them

Two real days in the infirmary, five in the prison. Both can be bought out with
the shell's **rewarded-ad placeholder** (`Meta.ad`, [docs/META.md](META.md)) —
one button for all the bandages at once, because an ad per wound is four ads
for one battle and a price nobody pays twice.

Without that button a player whose three best cards are in bandages has nothing
to do for two days, which is not a mechanic, it is a closed door.

**On a machine that is plainly not a player's an hour is a second**, the same
fence the daily road keeps (`army.js`, `DEV`): localhost, a LAN address or a
`file://` page. The screens wear a DEV pill so a screenshot can never be
mistaken for the real thing, and nothing of it reaches a deployed site.

## 7. Recruiting

One formula rather than a table of sixty: the grade lifts the price gently and
the tier multiplies it, so an S is a decision and an E is pocket change. All
three numbers are the manifest's.

```
price = base × (1 + gradeStep × (grade − 1)) × tierStep ^ tier      (rounded to 5)
```

**The shelf is rolled on a clock, not on arrival.** A shelf that re-rolls every
time the player walks in is a shelf they re-roll instead of buying from, and
the price stops meaning anything. It can be re-rolled early for an ad.

**The tent never sells the three specials.** A spy, a scout and a sapper are
ANSWERS to something — the marshal, the fog, the traps — and a tent that sold
them would be selling the solution rather than the army.

A card bought goes **straight into the deck** if there is room: a purchase the
player then has to visit a second screen to use is a purchase they do not feel.

## 8. Where the save lives

`save.ar`, inside the meta layer's own `meta:<slug>` key, written through
`MT.army()` / `MT.setArmy()` — the same arrangement the daily road has, and for
the same reason: it is bought with that wallet, and a second key would be a
second thing for OPTIONS to erase and a second thing to forget.

```
n  the next id to hand out — ids are NEVER reused, because the deck, the
   infirmary and a battle's wound list are three lists pointing at one card
r  the roster   { i id, g grade, t tier, w when its wound heals (0 = fit),
                 o "red" on a prisoner who enlisted — absent otherwise }
d  the deck     ids, in the order the player put them in
p  the prison   { g, t, u when the prisoner turns }
k  the tent     { t when the shelf was rolled, o the offers, b the ones bought }
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
               "base": 90, "gradeStep": 0.22, "tierStep": 1.9 },
  "start": [ { "r": 10, "t": 1, "n": 1 } ]
}
```

`art` is the player's painted face and `foe` the camp's — the same officer on
both sides of the same war, which is what makes the card offered on the end
screen visibly the card that was just fighting back. Both are keys of
`CONFIG.art`, so they come from a file name like every other piece of artwork
([docs/ASSETS.md](ASSETS.md)); a build with none of it falls back to the
grade's number.

`start` is the roster a first-time player is handed, and **their first deck is
filled for them, best first**: a player who opens a brand new game, walks past
a hub they have never seen and presses PLAY must not lose their first battle to
an empty deck screen they had no reason to open.

The game also needs **four more doors on its hub** — `deck`, `infirmary`,
`prison` and `recruit` roles in `web.village` — and the word under each one is
this layer's, not the composition's ([docs/VIEWS.md](VIEWS.md)).

## 10. What it does not do

- **No online anything.** The roster is one device's, in `localStorage`, like
  every other save in this shell.
- **No trading, no packs, no second currency.** Recruiting spends the coins the
  score already pays; a currency that only buys cards would be a second economy
  to balance for one screen.
- **No card levels.** A card is a grade and a tier and it never changes: a
  roster that can be upgraded is a roster where the tier stops meaning anything,
  and the tier is what the whole fight rule stands on.
