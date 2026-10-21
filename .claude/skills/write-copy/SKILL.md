---
name: write-copy
description: Write or rewrite a game's explanatory copy — guide pages, card and power descriptions, character lore, missions, camp events, notices — in plain player language, English and French together. Use when asked to rewrite, simplify, proofread or "fix the phrasing" of a game's rules, cards, characters or missions, or when a line reads like code turned into a sentence. vipera's guide is the reference.
---

# Write a game's copy for the player

A line of copy is right when a player who has never seen the code reads it
once, on a phone, and knows what to look at and what to do. The copy of this
repo was first written from the code, and it shows: the words of the
implementation (*bite*, *plated*, *gate*, *carves toward*), several rules
packed into one sentence with colons, the mechanism described instead of
what the player sees. This skill is the cure, and `games/vipera`'s guide is
the reference outcome — read its `Game.guide` (game.js, `var guide`) and its
`web.copy.fr.strings` before a pass.

It writes **both languages**. The English is the source the game ships and
the KEY of its French; the French follows [adapt-fr](../adapt-fr/SKILL.md)
for everything French (register, lexicon, typography, house rules), which
this file does not repeat.

## The rules

1. **Speak to the player, about what they see.** The subject is the thing on
   screen — the character by name (*Vipera*), the object (*the eagle's
   shadow*, *a ring*) — or the player, *you* / *tu*. Never a system: not
   "the body is plated", but "Vipera grows an armor".
1. **Never open a line on a pronoun.** A notice or a guide line is read
   alone — a chip that flies past, a line under a picture — so *Il*, *Elle*,
   *Ils*, *It*, *They*, *Its* at its start leaves the player asking who.
   Name the thing: "La brique arc-en-ciel clignote…", "Cette porte ne s'ouvre
   que de l'autre côté", "Fireballs throw you off after a beat". A pronoun
   later in the SAME line, once the thing is named, is fine — and only then:
   an object pronoun whose thing is named nowhere in the line is the same
   fault ("Tape-le seulement s'il se révèle clair" under a notice titled
   *Anneau fantôme* → "Tape un anneau fantôme seulement s'il se révèle
   clair"; "Break it and…" → "Break this brick and…"). The title of the
   notice or of the page does not count: the line is read on its own. A
   table label drops the subject instead ("Thrown off after", "Holds"). The
   impersonal *il* (*Il faut*, *Il n'y a personne*) is not a pronoun of
   anything.
1. **The player's words, never the code's.** A hit is a *hit* / *dégât*, not
   a *bite*; armour is *armor* / *armure*, not *plates*; a gap is *a way
   through* / *un passage*, not *a gate*. One word per thing for the whole
   game, the one its HUD and its callouts already use.
1. **One idea per sentence, in the order it is lived**: what warns you, then
   what to do. "A ring warns of the next lightning strike." — then the next
   sentence. No chain of colons; one colon at most, and only where a comma
   or a full stop would not do.
1. **Say what to DO when the rule allows it.** A warning reads as advice:
   "Quickly get clear of that side before you get bitten." / "Quitte vite ce
   côté pour ne pas te faire croquer." A bonus reads as an opportunity:
   "Now is the time to grab as many eggs as you can."
1. **A touch of character is welcome, one per page at most**, and never in
   place of the rule: "Remember, Vipera really doesn't like lava." It is the
   game's voice, not a joke for its own sake.
1. **Short.** A guide page: a title of one to three words, one or two lines,
   each under about 90 characters (two sentences on one line is fine when
   both are short). A card or power: one line, the effect first, its number
   in it. A notice word: three words at most, its sub about six.
1. **True to the game.** Read the code a line describes before rewording it
   (`node tools/lab/scan-text.mjs <slug>` gives `file:line` for every row).
   A simpler line may drop a detail the player does not need to decide
   (*one block short of full length* → *just short of full length*); it
   never states something false, and it keeps every figure a choice depends
   on.
1. **Grammar is checked, every time.** Agreement, conjugation (subjunctive
   after *avant que*), imperative without `s` (*cogne-toi*, *ne te cogne
   pas*), plurals, one register per game (*tu* everywhere, never *il faut*
   next to *tu*). A line typed in a hurry is where the faults hide: vipera's
   "Les murs repousse", "Les points comptes doubles", "avant que la lave
   jaillit" are the kind.
1. **Do not churn.** A line that already obeys all of this stays as it is,
   byte for byte. Names (a card's, an officer's, a sticker's) are proper
   nouns and are not touched.

## Reference — vipera, before and after

| before (from the code)                                                     | after                                                                                                                                         |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| The viper never stops: a tap flips the side it carves toward.              | Vipera never stops. A tap changes her direction. / Vipera avance sans arrêt. Un tap change sa direction.                                    |
| A bite costs a life, shrinks the body to 4 and ends every bonus.           | Each hit costs a life. Vipera shrinks back to her starting size and loses her bonuses. / Chaque dégât coûte une vie. Vipera reprend alors sa taille de départ et perd ses bonus. |
| At full length the viper is plated: the next bite only breaks the plates.  | At full length, Vipera grows an armor that takes one hit for her. / Arrivée à sa taille maximale, Vipera se couvre d'une armure qui encaisse un dégât. |
| Embers gather, then the lava bursts: only the burst bites.                 | Embers rise just before the lava bursts. And remember, Vipera really doesn't like lava.                                                      |
| Its shadow glides up one half of the screen, then the eagle dives down it. | The eagle's shadow tells you which side its next attack will come from. Quickly get clear of that side before you get bitten.               |
| Eggs and chains score double until the next bite, even a plated one.       | With this bonus, points count double. Now is the time to grab as many eggs as you can and complete full chains.                              |

## Narrative copy — lore, missions, events

Lore, a mission's briefing and report, a camp event are written, not
explained: a scene with a person in it. The rules above still hold where they
apply (one idea per sentence, plain words, grammar), plus:

- **Concrete and short**: one or two sentences of scene, a detail the reader
  can picture, no adjective stacking.
- **The placeholders are the people**: `{leader}`, `{c}`, `{n}` read as a
  name or a number in the sentence — read the assembled line.
- **The French is written as French fiction**, never as the English's syntax
  (adapt-fr, *Narrative text*).

## How a pass runs

1. `node tools/lab/scan-text.mjs <slug> --json` — every row, its `id`, its
   surface (*Help guide*, *Card*, *Character*, *Mission*…), its French and
   its marks in `lab/text-review.json`.
1. **A row the user CHECKED is theirs**: fix its faults (grammar, spelling,
   a false statement) and nothing else; it stays checked. Every other row is
   rewritten to the rules, and lands unchecked for the user to read on the
   copy desk (`make text`).
1. Write the English through `tools/lab/apply-text.mjs` (its `applyText` API
   or the copy desk), never by hand: a dictionary KEY is the English it
   translates, and the tool moves the key with it. Then the French, by the
   key's new id.
1. Bump the game's patch `version`, rebuild, and check that
   `node tools/lab/scan-text.mjs <slug>` still reads *fully translated*.
