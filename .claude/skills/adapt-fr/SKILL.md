---
name: adapt-fr
description: Adapt a game's English copy into natural French (not a word-for-word translation) — manifest taglines, tags, store lines, intro sentence, level objectives, band names, web.copy.fr.strings, lore, missions and events, and the web shell's own FR tables. Use when asked to translate, re-translate, proofread or "clean up the French" of a game in games/<slug>/, or when a French string reads like a calque of the English.
---

# Adapt a game's copy into French

The French of a game is written for a French player, not transcribed from the
English. A line is right when a French game designer could have written it
first: same intent, same tone, same length class — never the English syntax
with French words in it.

## Scope — where the French lives

A game's French is in `games/<slug>/manifest.json`; the screens every game
shares (menu, map, album, shop, daily road, codex, barracks) keep theirs in
the `fr` tables of `packages/webshell/*.js` — `army.js`'s `STRINGS` among
them. **Never run `mdformat` on this file**: it reads the front matter as a
heading and breaks the skill.

| field                     | what it is                                       | constraint                            |
| ------------------------- | ------------------------------------------------ | ------------------------------------- |
| `copy.fr.tagline`         | site card, one to three short sentences          | adapts `copy.en.tagline`              |
| `copy.fr.tags`            | three tags on the site card                      | 1–3 words each, adapts `copy.en.tags` |
| `store.copy.fr.lines[]`   | store card `kicker` + `line`                     | very short, keeps the `<b>` emphasis  |
| `web.copy.fr.tagline`     | the intro sentence (EN in `CONFIG.tagline`)      | ONE sentence, keeps every `<b class>` |
| `web.copy.fr.strings`     | every word the game writes, keyed by the English | see fragments below                   |
| `web.levels.copy.fr`      | level objective, `{n}` placeholder               | keep `{n}` and the `<b>`              |
| `web.levels.bands.fr`     | names of the five bands of the climb             | one or two words                      |
| `web.army.*` (stratideck) | lore, trades, missions, camp events              | narrative register, see below         |

`description` is English only (the developer gallery). Sticker `name`s are
proper nouns and are **never translated**.

## How to adapt

1. **Start from the intent, not the sentence.** Ask what the line does for the
   player (sell, instruct, reward, warn) and write the French that does that.
   Reorder, merge, cut, change the verb. "Move like a snake" is not
   "Déplace-toi comme un serpent".
1. **Register: tutoiement, imperative, short.** Mobile arcade tone. "Esquive",
   "Fonce", "Vise", never "Veuillez" or "vous" (and never mix tu/vous in one
   game).
1. **Use the word a French player uses for the thing**, not the dictionary
   equivalent: overtake → *doubler*, leader → *en tête*, race won → *victoire*,
   places taken (a stat) → *dépassements*.
1. **Callouts and labels are noun phrases or exclamations**, not sentences.
   "Shield down" → "Bouclier détruit", "Leader" → "En tête".
1. **Stay inside the length class.** A HUD label, a pill or a chip is not
   fitted: a French string much longer than its English overflows. Aim for
   ±30 % of the English characters; when the literal is long, find a shorter
   French idea rather than abbreviating.
1. **Do not add meaning the English does not have**, and do not drop a promise
   it makes (a mechanic, a number).
1. **Keep the English where French players keep it**: tap, swipe, combo,
   joker, bonus, score, top 10, boost — lowercase like any common noun. A
   GENRE is a proper noun and keeps its capitals: Battle Royale.
1. **No ", et" and no ", ou".** Either a comma or the conjunction, never both
   in a row. And never two "et" in one sentence: split it into two sentences
   rather than chaining ("Esquive pièges et rivaux. Choisis ta voie : vitesse
   ou bouclier.", not "Esquive les pièges et tes rivaux, et choisis…").
1. **A tag or a label must make sense on its own**, read by someone who has
   never played. A control tag names the gesture and what it does in plain
   words ("Appuie pour pencher"); a verb that needs the game to be understood
   ("Maintiens pour virer") is wrong.
1. **Narrative text (lore, missions, events) is written, not translated.**
   Keep the joke, the name, the rhythm; rewrite the sentence so it lands in
   French. Same facts, same length roughly, the tone of a French fantasy
   writer.
1. **Do not churn.** A line that already reads as natural French and breaks
   no rule stays as it is. Every change has a reason a reader would agree
   with.
1. **A map level is a STAGE, never a "niveau".** "Niveau" is reserved for what
   climbs: the player's level, xp, a card's or a character's level. So the 30
   levels of the climb are "30 stages", "Stage 12", "Stage suivant"
   (masculine: "le stage").

## House rules — never break these

- **Normal case.** A capital on the first letter and on a proper noun only.
  Never type a word in capitals ("Chaque TAP" is wrong): the motor's `upper()`
  shouts, and a capital loses its accent on screen.
- **A capital letter carries no accent, in the source too**: *Evite*,
  *Eliminé*, *Etoile*, *A toi* — accents only on lowercase letters
  (*Esquive les pièges*). Grammar is correct: *Trouve* (imperative, no `s`),
  agreement checked.
- **Markup is preserved one-to-one.** Every `<b>` / `<b class="w-…">` of the
  English is kept, on the French word that carries the same meaning (the
  intro's classes drive its colours and its demo).
- **Placeholders stay**: `{n}`, `×mult`, a unit glued to a number.
- **Fragments are concatenated by the code** — read the call site
  (`node tools/lab/scan-text.mjs <slug>` prints `file:line`) before adapting
  one. Keep the leading/trailing spaces of the key (`" in "` → `" dans "`), and
  check the assembled line reads as French: `"Top " + 10 + " in " + 84 + "M"`.
- **Typography as the file writes it**: a plain space before `! ? : ;`; a
  straight apostrophe `'` in a manifest, the curly `’` where the shell's
  tables already use it.
- **The English is not touched** unless the user asks; a wrong English line is
  reported, not fixed.

## Shared lexicon — the same word in every game

| English                  | French                       |
| ------------------------ | ---------------------------- |
| level (of the map)       | stage — "30 stages"          |
| level (player, xp, card) | niveau                       |
| challenge (kicker)       | défi                         |
| go for the best score    | vise le meilleur score       |
| best score / final score | meilleur score / score final |
| time's up!               | temps écoulé !               |
| install now              | installer                    |
| tap to play (start)      | tap pour jouer               |
| tap to close (card line) | touche pour fermer           |
| tap … (an instruction)   | touche …                     |
| shield                   | bouclier                     |
| battle royale            | Battle Royale (a genre)      |

A string the thirteen games share (`Play the full game`, `Install now`…) is
changed in all of them or in none — say so instead of changing one game.
Extend this table when a pass settles a new shared term.

## Workflow

1. `node tools/lab/scan-text.mjs <slug>` — the EN and FR side by side, grouped
   by screen, with the call sites of every fragment.
1. Read the call sites of every fragment and every HUD/pill label (length).
1. Edit `games/<slug>/manifest.json`. It is `JSON.stringify(m, null, 2)` + a
   newline, so a node script that parses, edits and re-dumps it keeps the
   diff to the changed lines (string `Edit`s fight the `\"` escapes).
1. Bump the game's patch `version` (copy is a source of the game).
1. `make check` (mdformat + `node tools/update.mjs`), then
   `node tools/lab/scan-text.mjs <slug>` must still read *fully translated*.
1. Report to the user a table **before → after → why**, one row per changed
   string, grouped by screen, plus what was deliberately left alone (shared
   strings, English issues) — so they can judge each adaptation.
