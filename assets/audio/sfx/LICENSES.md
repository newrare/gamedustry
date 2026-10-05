# assets/audio/sfx/ — where the sounds come from

Every file in this folder is named `<category>-<descriptor>-<NN>.<ext>` and
listed in `sources.tsv` beside it: the pack it came from, its licence and the
name the vendor gave it. `index.json` is the folder read back with durations
(`node tools/lab/index-sfx.mjs`, or `make sfx`); `docs/ASSETS.md` is the recipe
for cutting a clip out of one of them.

**Everything here is CC0 1.0, and it has to be.** This repository is public,
and the raw files in this folder are in it: a licence that allows a sound
inside a finished game but forbids handing out the file itself — ZapSplat's
standard licence, Sonniss, Pixabay, Mixkit — is broken the moment the file is
pushed. The ZapSplat "multimedia" set (120 files) and seven `hit-*` /
`shoot-*` files of unknown origin were removed on 2026-10-04 for that reason.
Before adding a pack, read its licence on its own page; CC0 is the one to look
for.

**The library holds what the games may use, not everything a pack shipped.**
On 2026-10-04 it was pruned to 880 files: the two Kenney voice-over packs
(138 English announcer and war call-outs, which a bilingual FR/EN game cannot
say), the phone-recorded noise, dishes, machine hums and "weird" takes of
`oga-100`, Kenney's computer hums, and the duplicates — two `step-carpet` takes
identical to the byte of audio and four micro-clicks indistinguishable from
`ui-click-02`. Variations of one sound (`impact-wood-heavy-01` to `-05`) are
kept on purpose: the kit alternates takes so a sound does not repeat.

| pack (`sources.tsv`) | source                                                                                                                                                         | licence |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `kenney-casino`      | Kenney, *Casino Audio*                                                                                                                                         | CC0 1.0 |
| `kenney-digital`     | Kenney, *Digital Audio*                                                                                                                                        | CC0 1.0 |
| `kenney-impact`      | Kenney, *Impact Sounds*                                                                                                                                        | CC0 1.0 |
| `kenney-interface`   | Kenney, *Interface Sounds*                                                                                                                                     | CC0 1.0 |
| `kenney-jingles`     | Kenney, *Music Jingles*                                                                                                                                        | CC0 1.0 |
| `kenney-rpg`         | Kenney, *RPG Audio*                                                                                                                                            | CC0 1.0 |
| `kenney-scifi`       | Kenney, *Sci-Fi Sounds*                                                                                                                                        | CC0 1.0 |
| `kenney-ui`          | Kenney, *UI Audio*                                                                                                                                             | CC0 1.0 |
| `oga-rpg`            | rubberduck, [80 CC0 RPG SFX](https://opengameart.org/content/80-cc0-rpg-sfx)                                                                                   | CC0 1.0 |
| `oga-creature`       | rubberduck, [80 CC0 creature SFX](https://opengameart.org/content/80-cc0-creature-sfx)                                                                         | CC0 1.0 |
| `oga-100`            | rubberduck, [100 CC0 SFX](https://opengameart.org/content/100-cc0-sfx)                                                                                         | CC0 1.0 |
| `oga-coins`          | StarNinjas, [12 Coin Sound Effects](https://opengameart.org/content/12-coin-sound-effects)                                                                     | CC0 1.0 |
| `oga-swishes`        | artisticdude, [Swishes Sound Pack](https://opengameart.org/content/swishes-sound-pack)                                                                         | CC0 1.0 |
| `oga-electricity`    | faxcorp, [Electricity Game Sound Pack](https://opengameart.org/content/electricity-game-sound-pack)                                                            | CC0 1.0 |
| `oga-mechanical`     | BMacZero, [Mechanical Sounds](https://opengameart.org/content/mechanical-sounds)                                                                               | CC0 1.0 |
| `oga-clock`          | antumdeluge, [Ticking Clock](https://opengameart.org/content/ticking-clock-0)                                                                                  | CC0 1.0 |
| `oga-fire`           | themightyglider, [Catching fire](https://opengameart.org/content/catching-fire); antumdeluge, [Fire Crackling](https://opengameart.org/content/fire-crackling) | CC0 1.0 |
| `oga-well-done`      | qubodup, [Well Done](https://opengameart.org/content/well-done)                                                                                                | CC0 1.0 |
| `oga-up-3x`          | qubodup, [Up (3x)](https://opengameart.org/content/up-3x)                                                                                                      | CC0 1.0 |
| `vcsl`               | Sam Gossner / Versilian Studios, [Versilian Community Sample Library](https://github.com/sgossner/VCSL)                                                        | CC0 1.0 |
| `vsco2ce`            | Sam Gossner, Simon Dalzell, [VS Chamber Orchestra 2 Community Edition](https://github.com/sgossner/VSCO-2-CE)                                                  | CC0 1.0 |

Kenney's packs are published at <https://kenney.nl/assets> under CC0 1.0
(public domain; no attribution required). The Kenney downloads shipped no
licence file of their own, which is why the licence is written here and in
`sources.tsv` rather than copied from the packs. The OpenGameArt packs (`oga-*`)
were checked as CC0 on their pages on 2026-10-04; `sources.tsv` keeps each
file's page and original name, and a WAV among them was re-encoded to mp3 (this
machine's ffmpeg has no Vorbis encoder).

**Fifteen files are BUILT, not downloaded** — `harp-*`, `marimba-*`,
`glock-*`, `vibe-arpeggio-01` and `whistle-rise-01`. VCSL and VSCO 2 CE are
instrument sample banks (single notes, checked as CC0 on their GitHub
repositories on 2026-10-05), and nothing CC0 shipped a harp run, a mallet error
or a slide whistle, so those were assembled out of the notes — re-pitched and
placed in time — to stand in for the ZapSplat clips the games used to embed.
`sources.tsv` writes each one's recipe in its `source` column. A CC0 work stays
CC0 when it is cut and rearranged.

**No game embeds a ZapSplat clip any more** (2026-10-05): every clip cut from a
removed file was re-cut from a CC0 one, and the removed files were purged from
the git history.

## Adding a pack

1. Name every file to the scheme before it lands here — the category first
   (what the sound IS: `impact`, `click`, `creature`, `step`, `card`…), then what
   describes it, then a two-digit take where the pack shipped several. Nothing
   else in the repo groups or searches on anything but the name.
1. Add one line per file to `sources.tsv`: `file`, `pack`, `license`, `source`
   (the vendor's original name).
1. `make sfx` — `index-sfx.mjs` reports any file it cannot find in
   `sources.tsv`, and any two files that would share a name.
1. Add the pack to the table above.

`tools/lab/rename-sfx.mjs` is the record of how the first 871 were named (the
ZapSplat ones among them are gone).
