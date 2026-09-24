# assets/audio/sfx/ — where the sounds come from

Every file in this folder is named `<category>-<descriptor>-<NN>.<ext>` and
listed in `sources.tsv` beside it: the pack it came from, its licence and the
name the vendor gave it. `index.json` is the folder read back with durations
(`node tools/lab/index-sfx.mjs`, or `make sfx`); `docs/ASSETS.md` is the recipe
for cutting a clip out of one of them.

| pack (`sources.tsv`)   | vendor                                        | licence                                                                                        |
| ---------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `zapsplat`             | ZapSplat, "multimedia" category               | ZapSplat standard licence — `LICENSE-zapsplat.pdf` in this folder                              |
| `kenney-casino`        | Kenney, *Casino Audio*                        | CC0 1.0                                                                                        |
| `kenney-digital`       | Kenney, *Digital Audio*                       | CC0 1.0                                                                                        |
| `kenney-impact`        | Kenney, *Impact Sounds*                       | CC0 1.0                                                                                        |
| `kenney-interface`     | Kenney, *Interface Sounds*                    | CC0 1.0                                                                                        |
| `kenney-jingles`       | Kenney, *Music Jingles*                       | CC0 1.0                                                                                        |
| `kenney-rpg`           | Kenney, *RPG Audio*                           | CC0 1.0                                                                                        |
| `kenney-scifi`         | Kenney, *Sci-Fi Sounds*                       | CC0 1.0                                                                                        |
| `kenney-ui`            | Kenney, *UI Audio*                            | CC0 1.0                                                                                        |
| `kenney-voice`         | Kenney, *Voiceover Pack* (female, male)       | CC0 1.0                                                                                        |
| `kenney-voice-fighter` | Kenney, *Voiceover Pack: Fighter*             | CC0 1.0                                                                                        |
| `legacy`               | seven `hit-*` / `shoot-*` files, origin unknown | no record — they predate the ZapSplat drop; treat as unlicensed until someone says otherwise |

Kenney's packs are published at <https://kenney.nl/assets> under CC0 1.0
(public domain; no attribution required). The Kenney downloads shipped no
licence file of their own, which is why the licence is written here and in
`sources.tsv` rather than copied from the packs.

## Adding a pack

1. Name every file to the scheme before it lands here — the category first
   (what the sound IS: `impact`, `click`, `chime`, `step`, `card`…), then what
   describes it, then a two-digit take where the pack shipped several. Nothing
   else in the repo groups or searches on anything but the name.
1. Add one line per file to `sources.tsv`: `file`, `pack`, `license`, `source`
   (the vendor's original name).
1. `make sfx` — `index-sfx.mjs` reports any file it cannot find in
   `sources.tsv`, and any two files that would share a name.
1. Add the pack to the table above.

`tools/lab/rename-sfx.mjs` is the record of how the first 871 were named.
