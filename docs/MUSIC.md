# MUSIC — one track, several beds

How a game gets more than one bed out of a single music file: a different
stretch of it per biome, per level band or per mode, and a quiet, slower window
of the same track under the menus.

`games/arcider` is the reference and the only game on it today. This document
is the procedure for the other twelve — read it before touching a game's music,
and update the state table at the bottom when one lands.

The API itself is in [ENGINE.md](ENGINE.md#music--the-background-bed); the asset
pipeline is in [ASSETS.md](ASSETS.md#a-long-track-assetsaudiomusicembed-and-webmusic).
This is the *why* and the *order of operations*.

______________________________________________________________________

## The problem it solves

A bed is the one asset a player hears for the whole session, and until arcider
every game had exactly one: a ~30 s loop, embedded once, played identically in
every round of every level. Two things are wrong with that once a game is a
*game* rather than a creative:

- **thirty levels on one loop wears out.** The climb changes sky, palette and
  difficulty every six levels and the music did not move at all.
- **the menus were silent.** A playable's music starts with the round because
  there is nothing in front of it but an ad's title card. A finished game has a
  menu, a level map, three panels and a pause card in front of that round, and
  silence over all of them reads as a build with its audio broken.

The obvious fix — one file per biome plus one for the menu — is six files where
there was one, in a creative with a 5 MB budget. So instead: **one file, and
the motor loops a window of it.** Six beds, zero extra bytes.

## The model

What loops is a **section**: `{ from, length, rate, gain }`, seconds into the
file and how many of them. The default section is the whole file at speed,
which is what the twelve other games play and why nothing changed for them.

```js
Music.play({ from: 76, length: 36 });                       // a stretch of it
Music.play({ from: 0, length: 40, rate: 0.85, gain: 0.5 }); // quiet and slower
```

Three properties make this usable rather than a toy:

- **the section is what loops.** Reaching its end *is* the seam, and it fades
  out and back in over `fade` like any other pass — the same crossfade the
  motor has always used, so no window has to be cut to a bar.
- **switching section crossfades.** A biome change is not a restart: the passes
  in flight fade out under the new one. A player replaying a level never hears
  the music start again, because asking for the section already playing does
  nothing at all.
- **a window past the end of the file is clamped** to what is there, so `from`
  alone is a valid section.

Volume lives in two places on purpose: `CONFIG.music.volume` is the bed's level
and the master gain owns it (that is what `duck` and `pause` move), while a
section's `gain` multiplies it on the **pass**. That is what makes a switch
between a loud round bed and a quiet menu bed one crossfade instead of a ramp
across both.

## Two targets, two amounts of the same track

A playable is one file an ad network downloads before it can show anything, and
it has neither biomes nor menus — `CONFIG.level` is 0 there and the web shell
does not exist. A three-minute bed in it would be ~1.9 MB of base64 for
material it can never reach. So the two targets ship different amounts of the
same track:

| target                    | what ships                                                  |
| ------------------------- | ----------------------------------------------------------- |
| playable                  | the **short cut** embedded in `ASSETS.sounds.music`         |
| web (site, itch), android | the whole track, from `assets/audio/music/embed/<name>.mp3` |

The web one is a manifest key and nothing else — `"web": { "music": "arcider.mp3" }` — and the builder *swaps* the game's own ASSETS entry for
it rather than adding a second, so the site never carries a music file nothing
fetches. Three folders, three jobs:

| folder                      | what it is                                                      |
| --------------------------- | --------------------------------------------------------------- |
| `assets/audio/music/`       | the **masters** (192 kbps stereo) — they ship nowhere           |
| `assets/audio/music/embed/` | the **shipping cut** — committed, never re-encoded by the build |
| `ASSETS.sounds.music`       | the playable's cut, base64 in `game.js`                         |

`assets/audio/music/embed/` follows the same contract as `assets/image/embed/`,
`assets/motor/font/` and `assets/audio/sfx/`: a ready-to-ship input rather than
a build output, so `tools/update.mjs` stays fast and a rebuild can never
silently re-compress the music.

______________________________________________________________________

## The procedure, per game

### 1. Check there is a track to cut

The strategy needs a master longer than one loop. Ten of the thirteen masters
are ~30 s, which is one bed and nothing else — those games need a **longer
track from the music model first**, and that is a separate request.

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 assets/audio/music/<slug>.mp3
```

Rule of thumb: **~30 s per section**, so five sections want ≥ 150 s plus the
menu's window. Under ~90 s, cut two or three sections rather than five —
windows shorter than ~20 s loop too tightly to sit under a round.

### 2. Find the structure, don't guess it

The entry points want to land on the track's own seams — where the arrangement
changes — and the menu's window wants its calmest stretch. Both are measurable.
Per-second RMS, printed as a profile:

```bash
ffmpeg -v error -i assets/audio/music/<slug>.mp3 -ac 1 \
  -af "asetnsamples=44100,astats=metadata=1:reset=1,\
ametadata=print:key=lavfi.astats.Overall.RMS_level:file=/tmp/rms.txt" -f null -
```

Read it in 5 s buckets and the shape of the track is on the page: the quiet
intro, the breakdowns (a bucket 2–3 dB under its neighbours), the last full bar
and the fade-out. For arcider that was: intro 0–12, body from 12, breaks at
64–75 and 120/127, music proper ending at 177.7 with a tail to 179.5.

Then, at 0.25 s resolution over the last few seconds, find where the fade
begins — **the section must not include it**, or every loop dips before the
seam:

```bash
ffmpeg -v error -ss <end-8> -i assets/audio/music/<slug>.mp3 -ac 1 \
  -af "asetnsamples=11025,astats=metadata=1:reset=1,\
ametadata=print:key=lavfi.astats.Overall.RMS_level:file=/tmp/tail.txt" -f null -
```

Three rules for laying out the windows:

- **one per look the game already has** — biome, level band, mode. Never invent
  a musical structure the player cannot see.
- **the windows climb with the game.** arcider's five walk up the track as the
  map walks up the climb: DUSK enters at 12 s, NIGHT at 142 s.
- **the menu gets the track's own opening.** It is the calmest stretch of
  almost every track, it is written to start gently, and it is the one section
  the player hears before anything else.

These numbers are picked by measurement and then **checked by ear** — the
analysis says where the seams are, not whether a section is pleasant.

### 3. Cut the two files

```bash
# the web target's bed: the whole track, trimmed before the fade-out
ffmpeg -i assets/audio/music/<slug>.mp3 -t <end> -ac 1 -ar 44100 -b:a 64k \
       assets/audio/music/embed/<slug>.mp3

# the playable's: the one stretch it plays — the first biome's window
ffmpeg -ss <from> -t <length> -i assets/audio/music/<slug>.mp3 \
       -ac 1 -ar 44100 -b:a 64k /tmp/music.mp3
node tools/lab/embed-asset.mjs /tmp/music.mp3 --key music
```

Mono 64 kbps is the house recipe and it is plenty: the bed plays at ~0.11 under
the sfx. Budget ~8 KB a second, ×1.33 as base64 for the playable.

### 4. Write it down in the game

`CONFIG.music` gains the menu's section; the round's sections live next to
whatever already varies:

```js
music: {
  volume: 0.11, fade: 1.8,
  menu: { from: 0, length: 40, rate: 0.85, gain: 0.5 }
},
```

`rate: 0.85` is ~2.8 semitones down, which is what makes the menu bed read as
*other* rather than as the round's music playing quietly; `gain: 0.5` is half
the level. Those two numbers are the whole "discreet menu" effect.

Then the round's own. In arcider it is a field on the biome, because a biome is
already one whole look:

```js
biomes: [
  { name: "DUSK", sky: "skySunset", music: { from: 12, length: 36 }, /* … */ },
  // …
]
```

and one line in `reset()` picks it:

```js
Music.play(CONFIG.level ? BIO.music : null);
```

**The `CONFIG.level` guard is not optional.** Without a level there is one
biome and only the short cut is embedded, so a window at `from: 76` would be
clamped into a 2 s loop. `null` means "the whole of what this build ships",
which is exactly right for a playable.

A game whose round always plays the same window needs no code at all:
`CONFIG.music.round` is armed by `startGame()` before `Game.reset()`.

### 5. Name the web track and bump the version

```json
"web": { "font": "orbitron", "music": "<slug>.mp3", "levels": { … } }
```

Touching a game's sources means moving its `version` in the same change — a new
bed and a menu that now plays is a **minor**, not a patch.

### 6. Build, then listen

```bash
node tools/update.mjs                 # artifacts, catalogues, size budget
node tools/lab/serve-site.mjs         # and play it
```

**Serve it — do not open the split build over `file://`.** Its assets load by
XHR, which Chrome refuses on `file://`, so every clip stays undecoded and the
bed reports itself as playing while scheduling nothing. Single-file builds
(`games/<slug>/index.html`, `dist/itch/`) embed data URIs and are fine.

What to check, in order: the menu has a bed and it is *quiet*; PLAY crossfades
into the round's without a restart; two levels in different biomes are audibly
different stretches; MENU from the end screen goes back to the menu bed; a
replay of the same level does not restart the music.

______________________________________________________________________

## Where the bed is ducked, and by how much

One place, for all thirteen: `endRound` in `packages/shell/shell.js` ducks to
**30 %** of the level over 0.8 s. The end screen is a reveal read in silence —
the title, then the score counting up, then a star and a stat row at a time,
each with a cue of its own — and the bed has to sit under all of it. It was
55 % and that was too loud.

Nothing has to put it back: `startGame()` and the web shell's MENU both
`unduck()`. Inside a round a game ducks its own moments (`spinshock` 0.25 under
a blast, `vipera` 0.3 for the beat), and the web shell's pause card ducks to
0.35 — the bed stays, quietly, because coming back is not a restart.

## Traps

- **A game on the beat cannot have sections.** `Beat` rides the audio clock
  through `Music.beatOrigin()`, which is 0 for any section that is not the
  whole file at speed — an offset or a rate moves every beat of the track. The
  clock then runs off `dt`, which is correct and drift-free but no longer
  locked to what is audible. `chainring` is the one game concerned
  (`bpm: 128, loopBeats: 64`): leave its bed alone.
- **The menu bed cannot start before a gesture.** No browser lets it. The web
  shell arms it on the first `pointerdown`/`keydown` on the page; the fade-in
  covers the delay. Do not try to start it on load.
- **`assets/audio/music/embed/` is committed.** It is not in `.gitignore` and
  it must not be: the build reads it and never writes it.
- **The size budget is the playable's, not the web build's.** `node tools/build/check-size.mjs` only scans `games/`, where the short cut
  lives. The web build's track is a cached file and the itch single-file build
  has no network limit to respect.

## Where each game stands

| game        | master  | embedded cut | sections                                 |
| ----------- | ------- | ------------ | ---------------------------------------- |
| `arcider`   | 182.5 s | 36.1 s       | **5 biomes + menu**                      |
| `slipdeck`  | 115.8 s | 46.9 s       | none yet — the master is long enough     |
| `marshmelt` | 54.0 s  | 35.0 s       | none yet — enough for two, plus the menu |
| `blight`    | 30.8 s  | 30.8 s       | needs a longer master first              |
| `bouncetry` | 30.7 s  | 30.8 s       | needs a longer master first              |
| `chainring` | 30.8 s  | 30.8 s       | **no** — it is beat-locked (see Traps)   |
| `echomaze`  | 30.8 s  | 30.8 s       | needs a longer master first              |
| `gearball`  | 30.5 s  | 30.6 s       | needs a longer master first              |
| `orbinity`  | 27.0 s  | 27.0 s       | needs a longer master first              |
| `radiam`    | 30.8 s  | 30.8 s       | needs a longer master first              |
| `spinshock` | 30.8 s  | 30.8 s       | needs a longer master first              |
| `triverse`  | 30.8 s  | 30.8 s       | needs a longer master first              |
| `vipera`    | 30.8 s  | 30.8 s       | needs a longer master first              |

A game with no `menu` section keeps silent menus and a single whole-file bed,
which is what the twelve do today. Nothing about them changed when the sections
landed, and nothing has to change all at once.
