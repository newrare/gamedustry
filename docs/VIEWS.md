# The view system — six screens, six cards, one band

*What a screen IS in the web shell, what a card is, and what neither of them
owns any more. Read this before adding a screen to `packages/webshell/`.*

The playable has one screen and three states. A finished game has a title
screen, a map, a collection, a shop, a ranking and a score screen, plus the
options, the help, the question that throws a round away, a daily reward, an ad
and a prize — and this front end grew all of them a screen at a time. Each one
brought its own mount, its own backdrop, its own back arrow, its own idea of who
was on top and its own music duck.

That is what this is: **two kinds of thing, and exactly two.**

______________________________________________________________________

## 1. A view, and a card

**A VIEW is a place the player goes.** One at a time is what they are looking
at, they stack, and BACK peels one off.

| view        | whose content it is            | carries the band              |
| ----------- | ------------------------------ | ----------------------------- |
| `title`     | the motor's `#screen-intro`    | no                            |
| `village`   | `packages/webshell/village.js` | yes, and it is the FLOOR      |
| `map`       | `packages/webshell/levels.js`  | yes                           |
| `sticker`   | `packages/webshell/album.js`   | yes, and no header of its own |
| `shop`      | `packages/webshell/album.js`   | yes                           |
| `ranking`   | `packages/webshell/menu.js`    | yes                           |
| `deck`      | `packages/webshell/army.js`    | yes                           |
| `infirmary` | `packages/webshell/army.js`    | yes                           |
| `prison`    | `packages/webshell/army.js`    | yes                           |
| `recruit`   | `packages/webshell/army.js`    | yes                           |
| `score`     | the motor's `#screen-end`      | while it is paid              |

**A CARD (a modal) is something that happens over wherever they are.** It never
replaces the screen under it, it is always on top of every view, and it is
dismissed rather than navigated.

| card    | opened from                         | tap closes | ESCAPE closes |
| ------- | ----------------------------------- | ---------- | ------------- |
| options | a house, the title menu, the corner | no         | yes           |
| help    | the title menu, the corner, L0      | no         | yes           |
| leave   | the round's corner control          | no         | yes           |
| daily   | a day of the strip, a house         | yes        | yes           |
| gift    | a perfect round, a daily gift       | no         | no            |
| prize   | a box that was opened               | yes        | yes           |
| ad      | the ×5 offer                        | no         | no            |
| sticker | a pull, a tile of the album         | varies     | varies        |
| captive | a won battle with an enemy standing | no         | no            |

**The barracks' four are views and the prisoner is a card, and the rule is the
one above rather than a judgement**: a deck being composed, a list of wounds and
a shelf of recruits are all places with something to finish, so a stray tap must
not take them away; a prisoner offered at the end of a battle is a CHOICE over
wherever the player happens to be, so it is a card — and, like the three gift
boxes, one that answers to neither a tap nor a key, because a choice has no
default. See [docs/ARMY.md](ARMY.md).

The two tables are the whole model. **The title screen and the score screen are
the floor**, not stacked views: they are the motor's own states, and the stack
lives over them. The ROUND is not a view at all.

**Where a game has a village, the title screen is a SPLASH**: no menu, no daily
strip — the logotype, the studio signature, two seconds of them, and then the
village opens itself (`packages/webshell/menu.js`, `splash` / `armSplash`). The
entries are hidden and not dropped, because `#btn-start` is the node the shell
binds the village to; the SPACE key opens it too, and `View.go` peels back to a
view already standing rather than stacking a second one, so the key and the
timer cannot disagree.

**And there is somebody standing on it.** One of the game's painted
characters — the happy or the neutral one — is drawn in the MIDDLE of that
screen, 100px under the centre, picked at random per load (`menu.js`,
`faceNode`): the logotype is a band at the top, the menu a column down the right
edge and the signature a corner, so the middle was the one part of this screen
with nothing in it. Random and not "the happy one", because a fixed picture
becomes part of the logotype and stops being looked at, two that take turns keep
the door a place with somebody in it; never the sad one, which is the END
SCREEN'S verdict on a lost round and a front door has no round behind it to
judge. The face stands STILL: the logotype above it already breathes, and a
second picture moving on one screen reads as one motion out of step. A game
with no painted character shows nothing, and the screen is exactly what it was.

______________________________________________________________________

## 2. What a screen no longer owns

A view owns its CONTENT — what it paints and what it says. Everything below
moved into `packages/webshell/view.js`, once, for all of them.

**The backdrop, and the ONE veil over it.** Every surface of this front end but
the round stands on the same picture — the village's own painted hub — and what
separates it from the picture is a veil. That was four veils: a flat scrim under
the cards, and a hand-tuned gradient apiece under the collection, the shop and
the ranking, each cut for the layout it was written with. Walking options → shop
→ collection → ranking therefore changed the strength of the picture four times
for no reason the player could name. It is now one number, `--web-veil` in
`view.css`, with exactly one declared exception: `--web-veil-strong` for the
COLLECTION, which asks the player to read twenty small pictures. Flat and not a
gradient, because a gradient is cut for one layout and these are four; the blur
is what a flat veil buys back — it takes the detail out of the picture instead
of the light.

**Mounting, and the stack.** `View.define(name, spec)` once; `View.go(name)`
appends the node to the frame and **writes its z-index from the depth**, so the
stack — not a stylesheet — decides what is on top. Both halves were bugs: the
album and the shop carried the SAME z-index, so which won was the order they had
first been BUILT in, and an album built before a shop could never be reopened
from it; the map, the ranking and the album carried THREE DIFFERENT ones (34, 35,
36), so the map reached from the album opened underneath it however it was
appended. Opening a view already in the stack PEELS back to it rather than
stacking a second copy.

**Getting out.** There is **no back arrow anywhere in this front end**. A back
arrow answers "where did I come from", and the player does not care — they care
where they are going. The band's four chips are the navigation, and **the LEVEL
CHIP is the way home**: first in the row, on every screen, where the player is
already looking. A view's header carries no button at all.

**And home is not always the title screen.** A game with a VILLAGE puts a place
between the title and the map, and that place is where the player lives:
`View.base("village")` declares it, and from then on `View.home()` peels the
stack back TO it rather than to nothing — the house chip, the end screen's first
button and the ESCAPE that walks all the way out all mean the village. A round
still clears everything (`View.clear()`, which is what `floor()` calls): a round
is not played under a village.

With one branch, and it is not cosmetic: a game with no `web.meta` has no band,
so a view of it would be a screen with no way off — twelve of the thirteen reach
their map from PLAY and would never see the title screen again. So there is
always exactly ONE way home, and it is the band's house chip where there is a
band and `View.homeButton()` where there is not (`View.banded()` is what a view
asks). `tools/test/views.mjs` walks every view, counts the ways home — it must
be one, never two — and clicks it.

`View.back()` still exists and is what ESCAPE walks, but nothing on screen is
drawn as it.

**ESCAPE.** One capture listener, in one order: the top card, then the top view,
then whatever the round wants. It used to mean five things in four files, each
guarding against the other four.

**The bed.** ONE factor (`DUCK`, 0.4), counted rather than toggled. `Music.duck`
is a single global level with no stack of its own, so two screens that both duck
and both unduck raise the bed the moment the FIRST closes — and on the end screen
the motor ducks it itself, so a gift card closing over it used to hand the player
a bed at full volume under a screen still being read. When the count reaches
zero the floor is read off the motor's state rather than assumed.

**The way out of a card.** A discreet cross in its top-left corner, and ESCAPE.
It was a back arrow at the head of the card, the same 64 px circle the map wore,
which made LEAVING the loudest thing on a card whose subject is a list of
switches — and said "back" about a card that came from nowhere. A card is
dismissed, not navigated.

**The corner controls.** Options, help and the way out — and they are the
ROUND'S, not a view's. Every other surface has somewhere of its own to say the
same things: the title screen lists OPTIONS and HELP as menu entries, the map's
level 0 opens the help card, and a view already carries four doors in the band
over it. Two more controls on top of those is a fifth and a sixth thing in a
corner nobody is looking at. In a round there is nothing else at all, which is
the whole difference between a playable — where the round IS the ad — and a game
the player owns.

**With one branch, and a VILLAGE is what added it.** A village is a view whose
content is six buildings, because six is what an image model returns on one
sheet — and the band over it is already the way to the ranking, the shop, the
collection and the map, while HELP is the map's own level 0. So a village that
skipped one of those skipped a duplicate; the one hole is OPTIONS, which nothing
else carries. `View.cornerOnView(name, names)` plugs it: this same bar comes up
on ONE named view carrying only what it is given, gated on the TOP of the stack
rather than on the motor's state, which stays `intro` under every view. A door
with a building AND a corner button would be the two ways to one place this file
exists to forbid, and `tools/test/views.mjs` asserts it is exactly one.

**The wallet band.** See below.

______________________________________________________________________

## 3. The band, and why it is the navigation

`#web-hud`, one node, over the top of the frame, **one line, and the order is
what the player learns**:

```
  ⌂   ·   ⚡   ·  1 240 coins  ·  3 tickets  ·  3/20 stickers  ·  12/90 stars
  ↓       ↓           ↓              ↓              ↓                ↓
HOME  ranking       shop        collection     collection           map
```

The way out first, then what is EARNED by playing, then what is SPENT, then
what those two buy, then what the board itself is worth.

Every chip is a door, every one leads to the same screen from every screen, and
the row never changes shape — so a player who has found the coins has found the
shop, on every screen they will ever see it. **A chip whose destination is the
screen it is standing on is INERT rather than missing**: a number that moved
between screens would be a number to find again, and the greyed chip is the one
thing on the row that says a tap will do nothing.

That is what makes back arrows unnecessary and then wrong. These six are the
whole of this front end's navigation, and they are the same everywhere the band
is up. Two of them lead to the collection — the tickets, which are spent there,
and the count, which is of it — so standing on it greys both; different numbers,
same destination, and neither is a better door than the other.

**The house is the only chip that is not a number.** The rest of the row is what
the player owns; this is the way out of wherever they own it.

**The count came off the album's header, and took the header with it.** That
screen carried a name and an `x / 20` over a band already saying what the player
owns: the name is what they tapped to get here, and the count is one of those
numbers. So the album has no header at all now, and the height it was taking
goes to the machine, the odds and the twenty tiles.

**Six chips on one line is a measurement, not a hope.** The worst case is every
number at its widest with the level chip OPEN —
`⌂ · LV 99 [bar] · 99 999 · 99 · 20/20 · 90/90` — and a game's own face is what
makes it tight (Orbitron's digits are 24% wider than the system stack's).
`tools/test/views.mjs` forces those strings and asserts the row still fits the
frame; if it ever fails, the fix is one padding in `view.css`.

**The row runs edge to edge, and the level chip is the spring.** The house is
glued to the left gutter, the counts to the right one, and the level chip —
the bolt, the level and the xp bar — takes every pixel between them, always
open. A band that was right-aligned left a strip of empty band in front of the
house; that room is the bar's now, which makes it long enough to read at a
glance.

The wallet COMPONENT was always one (`Meta.wallet`); the HOSTS were four — the
map's header, the album's, the shop's and a layer pinned to the end screen's
corner — so the same numbers sat in four places with four opinions about which
chips were doors, and the screens in between showed none of them.

A view declares what it carries:

```js
hud: true       // the standing row: level, coins, tickets, stars
hud: "auto"     // down, until something flies into it — the score screen
                // (View.hudShow / View.hudHide)
// nothing      // no band: the title screen
```

The level chip is first of the numbers because it is the one that is about the
player rather than about what they can spend.

Two rows are built and the class says which is up (`hud-full` / `hud-auto`).
Neither is thrown away between screens: a chip the coins are flying towards may
not be re-created mid-flight.

**The transient row is the score screen's**, and it carries three of the four —
a level, coins and tickets, which are what a round can pay into. (The stars are
the end screen's own three, and nothing flies to them.) Every chip of it holds
its place in the layout so a flight has a rect to aim at, and carries no ink
until a cascade lifts it: what the player sees is a chip that arrives with the
reward, writes its figure and goes. **The level chip is a chip for this
purpose** — xp was the one reward whose target was a bar rather than a
`.mt-chip`, so it had nowhere to land and the bar moved behind a blurred card.

**The band takes no room and has to be given some.** It is a layer over the
frame, so `--wh-band` is what every header and scroll band starts below — 0 on
a game with no wallet, where there is no band to clear.

**The round shows no band.** The top band is the game's, all of it, and the
thirteen fill it differently.

**A game with no `web.meta` has no band at all.** Its map keeps the star counter
in its own header, which is then the only place the count can be.

______________________________________________________________________

## 4. Adding a screen

```js
VW.define("whatever", {
  build: buildIt,                    // once, before the first open
  node: function () { return box; }, // yours; the system never writes it
  show: paintIt,                     // after it is on screen, so it measures
  hide: stopIt,                      // optional
  hud: true,                         // optional
  lift: 0,                           // optional: how far up the corner sits
  decor: { count: 2, spots: ["l", "r"], size: 130, opacity: 0.3, front: 0 }
});
VW.go("whatever");
```

And a card:

```js
MD.open({
  kind: "whatever",      // a class on the box, and what Modal.top() reports
  dismiss: false,        // a tap anywhere — false when the card asks something
  esc: true,             // the key; defaults to `dismiss`
  bed: true,             // whether it ducks the music
  fill: function (card, close) { /* your content */ },
  onHide: fn,            // as it starts to go, while its node is still in the
                         // document — for anything taken BACK out of the card
  onClose: fn            // after it is gone
});
```

`onHide` is not a nicety: the help card borrows the motor's demo stage, and
`getElementById` cannot find a node inside a card that has already been
detached. The stage would be lost for the rest of the session.

______________________________________________________________________

## 5. Where it lands in the code

| piece                        | what it is                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `packages/webshell/view.js`  | the stack, the modal layer, the band, the corner, ESCAPE, the bed                                                             |
| `packages/webshell/view.css` | the modal base, the band, the corner bar                                                                                      |
| `window.__VIEW__`            | `define · go · back · home · floor · escape · top · depth · isOpen · onChange · hudMount · hudShow · hudHide · corner · lift` |
| `window.__MODAL__`           | `open · closeTop · any · top · count`                                                                                         |
| `tools/test/views.mjs`       | the contract, asserted in a real build (`make test`)                                                                          |

**The class names of a card are unchanged.** A modal is `wm-modal` AND
`mt-modal`, its card is `wm-card` AND `mt-card`: the first pair is what
`view.css` styles, the second is what every rule already written against the
meta layer's cards still finds. Renaming them would have been a hundred
selectors of churn for nothing on screen.

**The motor knows nothing about any of it.** Everything is read through
`window.__WEB__`, the same plain list of references the menu and the map use. A
target adds its own layer; it never patches the motor — so the playable and the
android builds are untouched by all of this.

______________________________________________________________________

## 6. The test

`node tools/test/views.mjs [<slug>]`, or `make test`. There is no test runner in
this repo and this is not one: it is a headless Chrome driving a game built by
the real builder, over the DevTools protocol, with assertions where a lab page
would have a screenshot. What it checks cannot be checked any other way — a
stack, a z-order and a key are what the DOM does, not what a function returns.

It builds what it tests and serves it over HTTP, because the split build loads
its assets by XHR and `file://` breaks it silently. Every assertion in it is a
bug this shell has actually had.
