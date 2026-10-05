# assets/audio/sfx/ — where the sounds come from

Every file in this folder is named `<category>-<descriptor>-<NN>.<ext>` and
listed in `sources.tsv` beside it: the pack it came from, its licence and the
name the vendor gave it. `index.json` is the folder read back with durations
(`node tools/lab/index-sfx.mjs`, or `make sfx`); `docs/ASSETS.md` is the recipe
for cutting a clip out of one of them.

**Everything here is free of rights, and it has to be: CC0 1.0, or the public
domain with its reason written down.** This repository is public, and the raw
files in this folder are in it: a licence that allows a sound inside a finished
game but forbids handing out the file itself — ZapSplat's standard licence,
Sonniss, Pixabay, Mixkit — is broken the moment the file is pushed. The ZapSplat
"multimedia" set (120 files) and seven `hit-*` / `shoot-*` files of unknown
origin were removed on 2026-10-04 for that reason, and purged from the history
on 2026-10-05.

Two kinds of file are accepted, and `sources.tsv` says which in its licence
column:

- **`CC0 1.0`** — the author's waiver, which holds worldwide (with a fallback
  licence where a country does not let a right be waived).
- **`Public domain (<reason>)`**, and only with one of three reasons, read on
  the file's own page:
  - `dedication` — the author themself releases it into the public domain;
  - `US federal work` — made by an employee of the US federal government on
    the job (a military band's bugle call, a NASA recording): no copyright in
    the US by law (17 U.S.C. § 105). Abroad the US may in theory claim one; it
    is accepted anyway, and the reason says what it rests on;
  - `expired` — the composition AND the recording are past their term. A
    recording carries its own right, 70 years from publication in the EU, so an
    old tune recorded last year is not in the public domain.

Not accepted, even when a page calls it free: a "Public Domain Mark" stamped by
someone who is not the author and gives no reason, "royalty-free", "free for
commercial use", CC-BY and anything else that asks for a credit, CC-BY-SA, GPL,
and any licence that forbids redistributing the file. Before adding a pack,
read its licence on its own page. The author's name stays in `sources.tsv`
whatever the licence: in France the moral right to one's name outlives every
other right.

**archive.org sound-effect transfers are not in here**, though their items read
CC0: the Gold and Red Library tapes (Hollywood studio effects of the 1930s and
40s) and the Sunset Editorial library (1964–1987) were waived by the person who
digitised them, not by the studios and editors who made them — a waiver only
holds coming from whoever owns the right.

**The library holds what the games may use, not everything a pack shipped.**
On 2026-10-04 it was pruned to 880 files: the two Kenney voice-over packs
(138 English announcer and war call-outs, which a bilingual FR/EN game cannot
say), the phone-recorded noise, dishes, machine hums and "weird" takes of
`oga-100`, Kenney's computer hums, and the duplicates — two `step-carpet` takes
identical to the byte of audio and four micro-clicks indistinguishable from
`ui-click-02`. Variations of one sound (`impact-wood-heavy-01` to `-05`) are
kept on purpose: the kit alternates takes so a sound does not repeat.

| pack (`sources.tsv`) | source                                                                                                                                                                                                                                                                                   | licence                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `kenney-casino`      | Kenney, *Casino Audio*                                                                                                                                                                                                                                                                   | CC0 1.0                 |
| `kenney-digital`     | Kenney, *Digital Audio*                                                                                                                                                                                                                                                                  | CC0 1.0                 |
| `kenney-impact`      | Kenney, *Impact Sounds*                                                                                                                                                                                                                                                                  | CC0 1.0                 |
| `kenney-interface`   | Kenney, *Interface Sounds*                                                                                                                                                                                                                                                               | CC0 1.0                 |
| `kenney-jingles`     | Kenney, *Music Jingles*                                                                                                                                                                                                                                                                  | CC0 1.0                 |
| `kenney-rpg`         | Kenney, *RPG Audio*                                                                                                                                                                                                                                                                      | CC0 1.0                 |
| `kenney-scifi`       | Kenney, *Sci-Fi Sounds*                                                                                                                                                                                                                                                                  | CC0 1.0                 |
| `kenney-ui`          | Kenney, *UI Audio*                                                                                                                                                                                                                                                                       | CC0 1.0                 |
| `oga-rpg`            | rubberduck, [80 CC0 RPG SFX](https://opengameart.org/content/80-cc0-rpg-sfx)                                                                                                                                                                                                             | CC0 1.0                 |
| `oga-creature`       | rubberduck, [80 CC0 creature SFX](https://opengameart.org/content/80-cc0-creature-sfx)                                                                                                                                                                                                   | CC0 1.0                 |
| `oga-100`            | rubberduck, [100 CC0 SFX](https://opengameart.org/content/100-cc0-sfx)                                                                                                                                                                                                                   | CC0 1.0                 |
| `oga-coins`          | StarNinjas, [12 Coin Sound Effects](https://opengameart.org/content/12-coin-sound-effects)                                                                                                                                                                                               | CC0 1.0                 |
| `oga-swishes`        | artisticdude, [Swishes Sound Pack](https://opengameart.org/content/swishes-sound-pack)                                                                                                                                                                                                   | CC0 1.0                 |
| `oga-electricity`    | faxcorp, [Electricity Game Sound Pack](https://opengameart.org/content/electricity-game-sound-pack)                                                                                                                                                                                      | CC0 1.0                 |
| `oga-mechanical`     | BMacZero, [Mechanical Sounds](https://opengameart.org/content/mechanical-sounds)                                                                                                                                                                                                         | CC0 1.0                 |
| `oga-clock`          | antumdeluge, [Ticking Clock](https://opengameart.org/content/ticking-clock-0)                                                                                                                                                                                                            | CC0 1.0                 |
| `oga-fire`           | themightyglider, [Catching fire](https://opengameart.org/content/catching-fire); antumdeluge, [Fire Crackling](https://opengameart.org/content/fire-crackling)                                                                                                                           | CC0 1.0                 |
| `oga-well-done`      | qubodup, [Well Done](https://opengameart.org/content/well-done)                                                                                                                                                                                                                          | CC0 1.0                 |
| `oga-up-3x`          | qubodup, [Up (3x)](https://opengameart.org/content/up-3x)                                                                                                                                                                                                                                | CC0 1.0                 |
| `vcsl`               | Sam Gossner / Versilian Studios, [Versilian Community Sample Library](https://github.com/sgossner/VCSL)                                                                                                                                                                                  | CC0 1.0                 |
| `vsco2ce`            | Sam Gossner, Simon Dalzell, [VS Chamber Orchestra 2 Community Edition](https://github.com/sgossner/VSCO-2-CE)                                                                                                                                                                            | CC0 1.0                 |
| `oga-chimey-ui`      | MouseBYTE, [Chimey UI Sounds](https://opengameart.org/content/chimey-ui-sounds)                                                                                                                                                                                                          | CC0 1.0                 |
| `oga-ding-clicks`    | qubodup, [6 user interface ding clicks](https://opengameart.org/content/6-user-interface-ding-clicks)                                                                                                                                                                                    | CC0 1.0                 |
| `oga-metal-dings`    | StarNinjas, [4 Metal Dings/Rings](https://opengameart.org/content/4-metal-dingsrings)                                                                                                                                                                                                    | CC0 1.0                 |
| `oga-cure-magic`     | Someoneman, [Cure Magic](https://opengameart.org/content/cure-magic)                                                                                                                                                                                                                     | CC0 1.0                 |
| `oga-7-assorted`     | Joth, [7 Assorted Sound Effects](https://opengameart.org/content/7-assorted-sound-effects-menu-level-up)                                                                                                                                                                                 | CC0 1.0                 |
| `oga-gem-collect`    | Bobjt, [Gem collect SFX](https://opengameart.org/content/gem-collect-sfx)                                                                                                                                                                                                                | CC0 1.0                 |
| `oga-levelup-13`     | wobbleboxx, [Level up, power up, Coin get (13 Sounds)](https://opengameart.org/content/level-up-power-up-coin-get-13-sounds)                                                                                                                                                             | CC0 1.0                 |
| `oga-xylophone`      | AntumDeluge, [Children's Xylophone](https://opengameart.org/content/childrens-xylophone)                                                                                                                                                                                                 | CC0 1.0                 |
| `oga-ui-feedback`    | Robin Lamb, [UI Sound Effects](https://opengameart.org/content/ui-sound-effects-button-clicks-user-feedback-notifications)                                                                                                                                                               | CC0 1.0                 |
| `oga-gui-lokif`      | LokiF, [GUI Sound Effects](https://opengameart.org/content/gui-sound-effects)                                                                                                                                                                                                            | CC0 1.0                 |
| `oga-singles`        | one file or a few per page, each page named in `sources.tsv`: PWL, Fupi, Spring Spring, cynicmusic, railkill, fvcalderan, n4, mdkieran, congusbongus, Listener, EZduzziteh, Almitory, JaggedStone                                                                                        | CC0 1.0                 |
| `oga-<page>`         | 59 OpenGameArt pages added on 2026-10-05 for bubbles, balls, tension, racing, war, hisses, a gacha machine and ambient beds; the pack IS the page's slug (`oga-pop-sounds-0` → opengameart.org/content/pop-sounds-0), and `sources.tsv` names the page of every file                     | CC0 1.0                 |
| `bigsoundbank`       | Joseph Sardin, [BigSoundBank](https://bigsoundbank.com) — every sound page reads "CC0 (public domain)"; `sources.tsv` gives each file's page                                                                                                                                             | CC0 1.0                 |
| `wikimedia-commons`  | Wikimedia Commons file pages: US Army and US Marine Corps bugle calls, the US Air Force Band's drum cadence and two US Fish & Wildlife reptiles (US federal works), PDsounds.org recordings their authors released (dedication), two CC0 files; `sources.tsv` gives each page and author | CC0 1.0 / public domain |
| `nps`                | US National Park Service, [Sound Gallery](https://www.nps.gov/subjects/sound/gallery.htm) — a battle reenactment and a fife and drum corps (US federal works; the page asks for a credit as a courtesy, not as a licence term, and the credit is in `sources.tsv`)                       | public domain           |

Kenney's packs are published at <https://kenney.nl/assets> under CC0 1.0
(public domain; no attribution required). The Kenney downloads shipped no
licence file of their own, which is why the licence is written here and in
`sources.tsv` rather than copied from the packs. The OpenGameArt packs (`oga-*`)
were checked as CC0 on their pages on 2026-10-04; `sources.tsv` keeps each
file's page and original name, and a WAV among them was re-encoded to mp3 (this
machine's ffmpeg has no Vorbis encoder).
The 2026-10-05 imports (the `oga-*` rows below `oga-well-done`, BigSoundBank,
VCSL, VSCO 2 CE) were checked the same way, on each page or repository: a WAV,
AIFF or FLAC among them was encoded to mp3, a long take (an ambient bed, a
siren, a bugle) was cut to its first seconds — `sources.tsv` says so — and the
takes of the two sample banks were peak-normalised to −1 dB, because they are
recorded far below a game's level.

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
