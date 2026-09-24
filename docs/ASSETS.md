# Assets & the size budget

Playable ads are a **single self-contained HTML file with no network
requests**, so every asset must be embedded directly in the file as a base64
`data:` URI. This doc covers how to embed assets and how to stay under the
**5 MB** budget (aim for < 2 MB).

## Rule #1: draw the graphics, embed the sound

- **Graphics** → draw with the Canvas 2D API (`ctx.fillRect`, `arc`, gradients,
  paths). Vector-style art is tiny and scales perfectly. Reach for an embedded
  image only when the creative genuinely needs a specific logo or character art.
- **Sound** → take the clips from **`assets/audio/sfx/`** (next section). A playable
  lives or dies on how it *feels*, and a real sample beats a synthesized beep
  every time; the whole library re-encodes to a few KB per event.

`Sound.beep` / `Sound.arp` are still there, as the fallback for an event that has
no clip yet (and as what `Sound.cue` degrades to). They are not the target.

## Where each asset comes from, and the AI disclosure

Every store now asks whether a project contains the output of a generative
model — itch.io enforces it and can delist a page that does not say so, and
Play asks the same question in its own form. The answer is not per game, it is
per *kind of asset*, and this table is the record of it. Keep it true: it is
what the disclosure on thirteen store pages is copied from.

| asset                                                | where it comes from               | generative AI |
| ---------------------------------------------------- | --------------------------------- | ------------- |
| the code, all of it                                  | written with an LLM               | **yes**       |
| the game names                                       | generated                         | **yes**       |
| app icons — `assets/image/icon/<slug>.png`           | an image model                    | **yes**       |
| painted artwork — `assets/image/master/<slug>-*.png` | an image model                    | **yes**       |
| background music — `ASSETS.sounds.music`             | a music model                     | **yes**       |
| sound effects — `assets/audio/sfx/`                  | ZapSplat (licensed), Kenney (CC0) | no            |
| pictograms — `assets/motor/lucide/`                  | Lucide, ISC                       | no            |
| type — `assets/motor/font/`                          | six OFL families                  | no            |

So the answer on a store form is **yes**, for all thirteen. What that costs is
a place on itch's *AI Assisted* browse page; what not saying it costs is the
page. `node tools/publish/store-meta.mjs --game=<slug>` prints the line with
the rest of the form.

## Sound effects always come from `assets/audio/sfx/`

`assets/audio/sfx/` is the shared sfx library of the repo: **871 files** from
two vendors — the ZapSplat "multimedia" set (UI chimes, mallets, clicks; standard
licence, PDF in the folder) and ten Kenney packs (impacts, footsteps, cards and
chips, lasers and power-ups, interface, RPG foley, jingles, two voice packs;
CC0). Every game picks from it, so the whole catalogue sounds like one product
instead of one synth per game. `LICENSES.md` in the folder is the record of the
packs and `sources.tsv` the record of every file: pack, licence, the vendor's
original name.

### The name is the classification

Every file is named

```
<category>-<descriptor>-<NN>.<ext>     impact-metal-heavy-01.ogg
                                       chime-ping-correct-01.mp3
                                       step-grass-03.ogg
                                       voice-female-level-up.ogg
```

kebab-case, the **category first** — what the sound IS: `impact`, `hit`, `step`,
`click`, `ui`, `chime`, `bell`, `mallet`, `harp`, `pop`, `error`, `success`,
`tone`, `beep`, `whoosh`, `card`, `chip`, `dice`, `laser`, `phaser`, `zap`,
`powerup`, `explosion`, `loop`, `door`, `book`, `cloth`, `knife`, `coins`,
`metal`, `leather`, `jingle`, `voice`… — then what describes it, then a
two-digit take where the vendor shipped several. A voice line carries its word
instead of a number. The vendor's order and marketing words are gone
(`zapsplat_multimedia_alert_ping_chime_correct_answer_check_positive_009_70198`
is `chime-ping-correct-01`), because a list of 871 names is grouped and searched
on nothing but the name, and a provenance comment is read by a person.

`tools/lab/rename-sfx.mjs` is the one-shot that did it, and the record of every
rule and every hand-picked ZapSplat name. A pack added later is named to the
scheme by hand and declared in `sources.tsv` before `make sfx` — see
`assets/audio/sfx/LICENSES.md`.

### Browsing it

- **`make events` → `http://localhost:8092/library`** — every file on one page,
  grouped by category, with its length, mono or stereo, its pack and which game
  already cuts a clip from it; search, facets; **hover plays, click copies the
  name**. The bench's own file menu (`make events`, a clip's file button) is the
  same list grouped the same way, cut to the clip's length on hover.
- **`node tools/lab/index-sfx.mjs --list metal heavy`** — the same list as text,
  AND of the terms over name, category and pack; `--json` for a tool.
- **`assets/audio/sfx/index.json`** is what both read: one entry per file —
  `file, stem, category, name, variant, ext, seconds, channels, rate, bytes, pack, license, source` — written by `node tools/lab/index-sfx.mjs`
  (`make sfx`, ~40 s of ffprobe). It is **committed**, like
  `assets/image/embed/`: an input the tools read, never a build output, so
  `tools/update.mjs` stays fast. Re-run it after adding, removing or renaming a
  file; it reports a file with no line in `sources.tsv` and two files that
  would share a name.

### The recipe per event

1. **Pick a clip**, by ear, from the library page or the bench. Check the
   useful length — most clips are mostly tail:
   ```bash
   node tools/lab/index-sfx.mjs --list chime ping         # what there is, with lengths
   ffmpeg -i assets/audio/sfx/chime-ping-correct-01.mp3 -af "silencedetect=noise=-42dB:d=0.04" -f null -
   ```
1. **Trim and re-encode small.** Mono, 32 kHz, 64 kbps, with a short fade so the
   cut does not click. An sfx costs ~8 KB per second at that setting. **The
   source format does not matter** — half the library is ogg, the other half
   mp3, and every clip ships as the same mono mp3:
   ```bash
   ffmpeg -i assets/audio/sfx/impact-metal-heavy-01.ogg -t 0.4 -af "afade=t=out:st=0.33:d=0.07" \
          -ac 1 -ar 32000 -b:a 64k gem.mp3
   ```
1. **Embed it** under a short game-side key, and **write the file's name above
   it, without its extension** — that comment is the only record `make events`
   has of where a clip came from, and what Apply rewrites when the clip is
   re-cut from another file:
   ```js
   sounds: {
     // gem: impact-metal-heavy-01   (pitched by the chain)
     gem: "data:audio/mpeg;base64,…",
   ```
   ```bash
   node tools/lab/embed-asset.mjs gem.mp3 --key gem
   ```
   Or skip the hand work: on the bench, the clip's file button opens the
   library, hovering auditions each file at the cut length, and **Apply**
   re-cuts, embeds and writes the comment in one go (`tools/lab/apply-events.mjs`).
1. **Pitch, don't duplicate.** One sample covers a whole family of events
   through `rate` — a rising chain, a direction, a weaker variant:
   ```js
   Sound.clip("gem", 0.6, 1 + Math.min(chain, 14) * 0.045);  // climbs with the chain
   Sound.clip("swipe", 0.6, dir > 0 ? 1.08 : 0.93);          // left / right
   Sound.clip("crash", 0.5, 1.45);                           // shrugged off by a shield
   ```

Triverse is the reference: eight events (gem, mega, chain, loop, power, swipe,
void, crash) for ~33 KB of mp3. Half of that came off when its pack was recast
out of the Kenney material: the cue that fires hardest is the one to cut short,
and a gem is 0.13 s.

## Icons come from `assets/motor/lucide/`

Pictograms — a bomb, a double arrow, a spark — are the one case where drawing
by hand is worse than embedding: a Lucide glyph is a few hundred bytes of SVG
and reads better than a path improvised in canvas. The repo keeps a curated
slice of the pack in `assets/motor/lucide/` (ISC licence in the folder):

```bash
ls assets/motor/lucide                                   # browse the pack
node tools/lab/embed-icon.mjs bomb --key icoBomb       # encode one
node tools/lab/embed-icon.mjs arrow-left-right --key icoRow --stroke 2.6
```

Paste the printed line into `ASSETS.images`, then draw it through the motor's
`Icon` helper, which tints and caches it:

```js
Icon.draw(ctx, "icoBomb", cx, cy, 26, "#2a1400");
```

Details and the reason icons are stored white: [assets/motor/lucide/README.md](../assets/motor/lucide/README.md).

## Painted artwork comes from `assets/image/master/`, re-encoded into `assets/image/embed/`

The one exception to Rule #1, and the reason it is an exception: a background, a
logotype and a character cannot be drawn in canvas. They come out of an image
model, and a game gets its six pieces by **file name alone** — no manifest key,
no `ASSETS` entry, no code:

| `assets/image/master/<slug>-…`       | used for                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `-background-phone.png`              | behind the intro and the end screen — and behind the round with `CONFIG.sceneArt` |
| `-background-phone-<name>.png`       | the same, ONE PER BAND of the climb — `games/echomaze`; see below                 |
| `-background-desk.png`               | the bands around the frame on a desktop window (**web target only**)              |
| `-background-home.png`               | the ground the VILLAGE stands on (**web target only**); see below                 |
| `-title.png`                         | the logotype: replaces the app icon and the CSS `#intro-title`                    |
| `-character-{sad,neutral,happy}.png` | the end screen's face, by star count (0 / 1–2 / 3)                                |
| `-object-<name>.png`                 | **a sheet to cut, never a role** — see below; `encode-art` leaves it alone        |
| `-sky.png` / `-sky.jpg`              | a panorama a GAME draws on the CANVAS behind its round — `games/arcider`          |
| anything else                        | `CONFIG.art.<camelName>`, for the game to use as it likes                         |

**An object a game cut out of a sheet is not in there** — it stays in
`assets/image/object/` and the game names it in `art.objects` of its
`manifest.json`, which is the [next section](#a-sheet-of-objects-assetsimagemasterslug-object-namepng).
The decor pool, the beads and the album's twenty stickers are all of that kind.

**A scene per band.** A game whose look turns over with the climb keeps one
painting per band instead of one for the whole game, and then there is no plain
`-background-phone.png` at all: `echomaze-background-phone-yellow.png` reaches
`CONFIG.art.backgroundPhoneYellow` like any other role, and the game names it on
the band it belongs to. Two rules come with it, both because a playable is ONE
round at level 0 and can only ever show one of them: the **first** variant
alphabetically is the one a playable ships (`tools/build/build.mjs`,
`SCENE_SET`) and the one the shell dresses the intro, the web menu and the level
map with, so a game puts that picture on its first band. The motor's side of it
is `Art.backdrop()`, in
[ENGINE.md](ENGINE.md#configart--the-painted-artwork).

`assets/image/master/` is the **master and ships nowhere**: PNG — or JPEG, for a
panorama that came out of an editor rather than the model — up to 2172 px, ~2 MB
apiece, 121 MB across thirteen games. One raw character would double a creative.
The shipping cut lives next to it:

```bash
node tools/lab/encode-art.mjs             # every game, skipping what is fresh
node tools/lab/encode-art.mjs slipdeck    # one game
node tools/lab/encode-art.mjs --force     # after changing a profile
```

That writes `assets/image/embed/<slug>-<role>.webp` — WebP, sized for the 720×1280
design space, alpha intact, **~35 KB a piece and ~270 KB of base64 per game**.
It is **committed**, exactly like `assets/motor/font/` and `assets/audio/sfx/`: a
shipping-ready input the build embeds, never a build output. The build itself
never encodes, because encoding needs headless Chrome and `tools/update.mjs`
runs on every change.

Two choices worth knowing, both in the tool's own header:

- **WebP, through headless Chrome.** The repo has no image library and is not
  going to grow one; Chrome resamples with a high-quality filter and encodes
  WebP with alpha through `canvas.toDataURL`. `sips` cannot write WebP at all,
  and its AVIF — smaller still — needs Safari 16.4, which a playable in an ad
  network's WebView cannot count on.
- **The sizes are the design space, not a guess.** A portrait background at
  720 px is 1:1 with its largest possible display. The court cards are the
  exception and stay near 560 px: they are the one piece a game draws on the
  **canvas**, which is sized in device pixels, so a 3× phone asks for ~640 real
  pixels where the DOM would have asked for 214.

The builder injects the result as `CONFIG.art` — base64 in the single-file
builds, hashed files in the split site build. See
[ENGINE.md](ENGINE.md#configart--the-painted-artwork).

### A sheet of objects: `assets/image/master/<slug>-object-<name>.png`

An image model does not draw *a* gear. Asked for one it draws a wall of them —
`radiam-object-gear.png` is sixteen at once, 1536×1024 — and every one of them
is usable while none of them is usable as it stands: a game draws ONE object,
with alpha, at the size its canvas asks for.

`object-` in the name marks that file as a **sheet**: material to cut, not a
role to ship. `encode-art.mjs` skips it — a 2 MB wall of gears has no business
in a 5 MB creative — and `tools/lab/cut-objects.mjs` takes it apart into
`assets/image/object/<slug>-<name>-NN.png`, one transparent PNG per object.

```bash
node tools/lab/cut-objects.mjs                     # every sheet of every game
node tools/lab/cut-objects.mjs radiam              # every sheet of one game
node tools/lab/cut-objects.mjs radiam-object-gear  # one sheet
node tools/lab/cut-objects.mjs --list              # what it would cut, and where

open dist/object/radiam-gear.png                   # the contact sheet: every cut, numbered

node tools/lab/cut-objects.mjs radiam-object-gear --adopt 1,4   # → art.objects
node tools/lab/encode-art.mjs radiam               # the adopted two become art
```

**Adopting moves no file.** A cut lives in `assets/image/object/` once, under
the neutral name its sheet gave it, and what a game *ships* is a line in that
game's `manifest.json`:

```json
"art": {
  "objects": {
    "gear01": "radiam-gear-01",
    "gear04": "radiam-gear-04"
  }
}
```

The key is the **role** — `CONFIG.art.gear01`, and
`assets/image/embed/radiam-gear01.webp` once `encode-art.mjs` has run, exactly
as a file name in `assets/image/master/` would have given. The value is the cut
it points at, extension implied.

It used to be a *copy* into `assets/image/master/`, and the copy was the
declaration. That wrote the same picture to disk twice under two names, and it
could not answer the one question a folder of cuts asks:
`radiam-ball-blue-01.png` ships and `radiam-ball-blue-09.png`, beside it, does
not — sixteen of the twenty beads were kept — and the two names are the same
shape, so nothing in them can say which. The game says it, once. Re-cutting the
sheet afterwards refreshes what ships with no second adoption, because a role
points at a cut and not at a copy.

| flag              | default | what it is                                                                 |
| ----------------- | ------- | -------------------------------------------------------------------------- |
| `--solid <alpha>` | `110`   | the alpha at which a pixel is the object rather than its glow — see below  |
| `--solid a,b,c,d` | —       | …one bar per equal horizontal BAND of the sheet, when its halves differ    |
| `--pad <px>`      | `20`    | the margin around a cut, and how far its own glow is followed              |
| `--min <px²>`     | `2500`  | the speck floor: below it, paint rather than an object                     |
| `--keep-partial`  | off     | keep the objects the sheet's own edge cuts in half                         |
| `--step <0-255>`  | `14`    | opaque sheets only: how far the border flood crosses in one pixel          |
| `--envelope <n>`  | `90`    | opaque sheets only: how far from the border colour the flood may ever go   |
| `--grid 5x4`      | —       | the sheet is a regular grid: the CELL is the index, not the blob's area    |
| `--grid 5,5,5,6`  | —       | …one column count PER ROW, when the rows are not all the same length       |
| `--adopt 1,4`     | —       | declare those cuts in the game's `art.objects` (one sheet at a time)       |
| `--as <role>`     | —       | name the role instead: `--as decor` → `decor-NN`, the decor pool           |
| `--seq`           | off     | number the adopted roles 01…N in the order given, not after their cut      |
| `--into <slug>`   | —       | which game adopts a SHARED `game-*` cut; meaningless on a game's own sheet |
| `--list`          | —       | name the sheets and stop                                                   |

#### `--grid` — when several sheets must be cut the same way

Without it the cuts come out ordered by **area**, which is right for a wall of
gears nobody has to index and wrong the moment a set of sheets is *the same
picture in several colours*. `radiam` has six: twenty bead designs painted in
red, yellow, blue, purple, green and rainbow, and design 7 has to be design 7 in
all six of them or a red marble and a blue one stop being the same bead. Area
cannot promise that — a halo a few pixels wider in one recolour reorders
everything after it, in silence, and the mistake only shows up on the dial.

`--grid COLSxROWS` makes the cell the identity. Each blob is filed by the cell
its centre falls in, the biggest one wins the cell, and the cuts come out in
reading order: cell (0,0) is object 1 whatever it weighs. **An empty cell is
reported, never closed over** — a missing object would shift every index after
it, which is the one failure the grid exists to prevent.

The mask is unchanged, alpha or flood exactly as above. The grid only decides
which blobs survive and in what order, which is also why it rescues a sheet the
flood struggles with: radiam's rainbow sheet breaks into 5 448 blobs because its
background is a coloured haze, and the grid still picks the right twenty.

**A blob across two cells is two objects, and the grid cuts it.** On a packed
sheet the model routinely lets one object's glow touch the next one's, and an
alpha mask then hands the pair back as a single component — which the cell
filing used to resolve by dropping one of them, leaving an EMPTY CELL and a cut
twice as tall as the rest. `radiam-object-sticker.png` did it three times over.
So a component carrying real weight (18%) in several cells is split along the
grid, one piece per cell, each filed on its own; the seam between two merged
objects lands halfway between the two cell centres. Spilling over the line is
NOT that — every object overflows its cell a little, and a piece under the bar
stays with the body it came from, so an object always keeps its own overflow.

**One bar per band when the sheet holds two kinds of picture.** A sticker
sheet is chibi faces on top and neon objects underneath, and they want opposite
bars: a face is ringed with an opaque white outline that welds to its
neighbour's unless the bar is nearly 255, while a neon object's interior is
genuinely semi-transparent and a bar that high shreds it into strips. So
`--solid` also takes one value per equal horizontal band —
`--solid 253,253,245,245`, which is `arcider-object-sticker.png` exactly: at a
single 245 its six faces per row came back welded in pairs, and at a single 253
its boost pad came back as three separate bars of light. **Raise `--pad` with
it**: the bar that separates two faces also throws away the white outline they
touch with, and the fringe pass is what gives each of them their own back — 28
on arcider, where 20 left the characters die-cut with no sticker border at all.

**A row is divided on its own when the rows differ.** `--grid 5,5,5,6` is one
column count per row, and the sticker sheets are why it exists: the model fills
the last row with whatever is left over, so six of the thirteen came back 5, 5,
5 and then 6 or 7. A uniform grid over that row puts two objects in one cell and
drops the loser — which the fringe pass then hands to the object ABOVE as a
satellite, so blight's witch came out with a slime ball glued under her hat. A
sheet holding one double-width piece is cut with no grid at all: echomaze's
logotype is two cells wide, and the grid saws it into `ECH` and `OMAZE`.

**`--keep-partial` is usually what a 5x4 of characters needs**, because the top
row's hair touches the sheet's own edge and is otherwise dropped as "cut by the
edge". Look at `dist/object/<slug>-<name>.png` before adopting: it is the
contact sheet, numbered, and it is the only way to see a cell went missing.

```bash
for c in red yellow blue purple green rainbow; do
  node tools/lab/cut-objects.mjs radiam-object-ball-$c --grid 5x4 \
    --adopt 1,2,3,4,5,6,7,8,11,12,14,15,16,17,19,20 --as ball-$c
done
node tools/lab/encode-art.mjs radiam
```

What the thirteen games' sheets gave, at the defaults — 383 objects out of
sixteen sheets:

| sheet                 | objects |     | sheet             | objects |
| --------------------- | ------- | --- | ----------------- | ------- |
| `arcider-race`        | 33      |     | `orbinity-planet` | 24      |
| `blight-ball`         | 23      |     | `radiam-ball`     | 27      |
| `bouncetry-ball`      | 40      |     | `radiam-gear`     | 9       |
| `bouncetry-brick`     | 34      |     | `slipdeck-card`   | 23      |
| `chainring-ring`      | 31      |     | `spinshock-spin`  | 12      |
| `echomaze-ball`       | 15      |     | `triverse-arrow`  | 34      |
| `echomaze-electrical` | 22      |     | `vipera-jungle`   | 21      |
| `gearball-gear`       | 10      |     | `marshmelt-rock`  | 25      |

The cut reads the sheet's **own alpha** when it has one — a model asked for
objects on no background returns them already separated, and the colour you see
in a viewer is the RGB left under that transparency. A sheet that is opaque
instead is flooded from its border by local colour difference, which is what
survives a painted ground whose lighting drifts. Either way the mask is
labelled into objects, the specks go, and so do the ones the sheet's own edge
cuts in half.

**`--solid` is the knob that matters** (default 110). Painted objects carry
tens of pixels of halo, and a halo that touches the next object welds the two:
chainring's 31 rings came back as *one* object before this existed, and
triverse's 34 arrows as 17 pairs. It is the alpha at which a pixel counts as
the object rather than its glow. The glow is kept — each object's halo is
followed out of it as far as `--pad` and never through another object's
label — so a ring keeps its own light and none of its neighbour's. Lower it
(`--solid 8`) for soft objects that come back in pieces.

**`assets/image/object/` is tracked (577 files) and ships nothing by itself.**
Tracked for the same reason `assets/image/master/` is — it is material, and
material that only exists on one laptop is material nobody else can build from.
Shipping nothing is the other half: everything under `assets/image/embed/` is
embedded in every build of its game, so 577 objects would be megabytes of
base64 in creatives capped at 5 MB.

`--adopt` is the step between the two, and it is deliberately manual: it writes
the two or three cuts that earn it into the game's `art.objects`, and from there
the usual pipeline names them `CONFIG.art.<name>NN` — `ArtImages.gear01` on the
canvas, or a piece of a store screenshot.

### The decor pool: `art.objects` roles named `decor-NN`

#### A style set: `<slug>-ball-<colour>-NN.png`

`radiam`'s bead is the one adopted role that is a **set** rather than a
picture. Sixteen designs times six colours is 96 files, each one reaching
`CONFIG.art.ballRed07` like any other art and read off `ArtImages` on the
canvas. Two things follow from the count, and both are written down because
neither is obvious:

- **the encode profile is the budget.** `BALL` is a 256 px box, the smallest of
  the set, and it is not a guess: radiam's biggest bead is the outer plate's,
  83 design px across, which a 3x device draws at 249. At ~15 KB a file the set
  is 1.4 MB, and every kilobyte here is paid ninety-six times.
- **the playable carries style 01 and nothing else.** The styles are what the
  LEVELS turn over, and a creative is one round with no map, so the other
  fifteen would be ~1.8 MB of base64 in a file capped at 5 MB, to draw a bead
  the ad never changes. `tools/build/build.mjs` holds them back with the same
  rule that already holds back `background-desk`, and style 01 ships everywhere
  so the ad is painted too.

#### The sticker album: `<slug>-stickerNN.png`

The second adopted set, and the same two facts as the beads for the same two
reasons. Twenty stickers cut from one 5x4 sheet fill the collection the META
layer counts `x/20` ([META.md](META.md)); `STICKER` is a 400 px box at q 0.82,
which covers the album's 128 px grid at a 3x device ratio and the 300 px reveal
a draw ends on, and the twenty come to ~730 KB. They are **web-only wholesale**
— not "everything past the first", the way the bead styles are: a playable has
no album, no machine and no map to earn one off, so all twenty would be ~975 KB
of base64 in a creative capped at 5 MB, to draw nothing at all.

An unowned sticker is drawn as its own **white silhouette** by the album
(`brightness(0) invert(1)`), so a game never ships a placeholder for one.

```bash
node tools/lab/cut-objects.mjs radiam-object-sticker --grid 5x4 --keep-partial --solid 245 \
  --adopt 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20 --seq
node tools/lab/encode-art.mjs radiam
```

The album reads `sticker01` to `sticker20` and a hole in that run is a tile with
no picture, so **`--seq` is what a sheet of more than twenty needs**: it numbers
the adopted roles in the order given instead of after the cut each one points
at, and twenty-five cuts minus five still land on a contiguous twenty. Which cut
a role points at is the value beside it, so nothing is lost by the role not
repeating it.

#### The village: `<slug>-background-home.png` + `<slug>-homeNN.png`

The third adopted set, and the first one that is a SCREEN rather than a
material. `-background-home.png` is a painted hub with empty pads on it — what
an image model returns when asked for one — and `-object-home.png` is the sheet
of buildings that stand on those pads: a shop, a podium, a globe, a garage, a
showroom, a crowned board, six on a 3x2. Each one is the door to a screen the
web shell already has, so the game's title screen becomes a PLACE instead of a
list of words.

```bash
node tools/lab/cut-objects.mjs arcider-object-home --grid 3x2 --adopt 1,2,3,4,5,6
node tools/lab/encode-art.mjs arcider
make village          # lab/village.html — place them, say what each one opens
```

`HOUSE` is a 420 px box at q 0.84 — a house is dropped on the 720x1280 frame at
between 150 and 280 design px wide, so 420 covers the biggest of them at a 3x
device ratio with nothing spare — and the six come to ~280 KB.
`background-home` takes the same 720x1280 box and the same q 0.72 as the intro
backdrop, for the same reason: it fills the frame and nothing past it is ever
shown.

**Both are web-only** (`tools/build/build.mjs`, `WEB_ONLY_ART` and
`WEB_ONLY_HOUSE`), and wholesale like the album rather than "everything past the
first" like the bead styles: a playable's intro IS the ad's first screen — one
title, one sentence and one button — and it has neither a map, nor a shop, nor a
collection to be the door to. Left in, the seven pieces would be ~590 KB of
base64 drawing nothing at all.

**The composition is not in the file names.** Where each house stands, how big
it is and what it opens is `web.village` in `games/<slug>/manifest.json`,
written by `make village` — the same place `web.levels` and `web.meta` are
written, for the same reason: it is what the game's front door IS, and the
builder injects it as `CONFIG.web`. A house is placed by the middle of its BASE
and the list is sorted by it, so a house whose feet are lower is drawn in front
and there is no z-order anywhere.

One adopted role is not a game's to draw: `--as decor` declares a cut under the
role `decor-NN`, and every `CONFIG.art.decor*` key is the pool the shell
scatters over the screens — the end screen, the round's corners, the web menu's
panels, the pause card, the level map. A game declares nothing and calls
nothing; see [ENGINE.md](ENGINE.md#decor--the-games-own-objects-on-the-screens).

```bash
node tools/lab/cut-objects.mjs vipera-object-jungle --adopt 2,3,14,17 --as decor
node tools/lab/encode-art.mjs vipera        # → assets/image/embed/vipera-decor-NN.webp
```

**Four is the number**, and it is a budget rather than a taste: everything under
`assets/image/embed/` is embedded in every build of its game, the pieces are ~20 KB
apiece at the `decor` profile (360 px, q .78) and three of them show on a screen
at most. Four picked across a sheet — a leaf, a flower, a vine, a second flower
— dress every screen of a game for ~110 KB of base64. The thirteen ship 52
between them.

A game whose objects come off two sheets keeps one role per sheet — `--as decor-ball`, `--as decor-brick` — because the numbering restarts with every
sheet and two `decor-01` would be the same file twice. The camel key follows:
`bouncetry-decor-ball-01.png` → `CONFIG.art.decorBall01`.

`dist/object/` holds one contact sheet per sheet — every cut on a checkerboard,
numbered, at a size where a fringe or a missing tooth shows. It is a build
output like the rest of `dist/`, regenerated on every run, and it is the only
honest way to check a cut: a list of pixel counts says nothing about whether a
gear lost a tooth.

### The shell's own artwork: `game-object-<name>.png` → `assets/image/shell/`

One prefix belongs to no game. `assets/image/master/game-object-gift-close.png`
and `game-object-gift-open.png` are a wall of three boxes each — red, blue,
green — and the **web shell** draws them for every game that declares
`web.meta`: the daily strip's live node, the seventh day's prize, and the three
boxes of the gift ceremony ([META.md](META.md)). They cannot live under a slug,
the way `assets/image/brand/newrare.webp` — the studio mark on all thirteen
title screens — cannot.

`game` is that prefix, and nothing may ever be called that. It cuts like any
other sheet, on a **3x1 grid** so the cell is the identity: box 2 is the same
blue box closed and open across the two sheets, which is the whole reason a lid
can be lifted by swapping one `src`.

```bash
node tools/lab/cut-objects.mjs game-object-gift-close --grid 3x1
node tools/lab/cut-objects.mjs game-object-gift-open  --grid 3x1
node tools/lab/encode-art.mjs          # → assets/image/shell/gift-{close,open}-NN.webp
```

**The sheets after them are the shell's INSTRUMENTS**, where the gifts are its
ceremony: `game-object-reward.png` is 24 rewards on a 6x4 grid — stars, coins,
gems, chests, medals, a crown, an XP shield, a bolt — `game-object-trophy.png`
is 10 trophies on a 5x2, `game-object-ticket.png` is 12 tickets on a 4x3, and
`game-object-multiplicator.png` is 6 multiplier plates on a 3x2 — x2, x5, x10,
x20, x50, x100.
The coin a wallet counts, the ticket it spends on a pull, the bolt an xp bar
fills with, the star a level is cleared with and the trophy a finished board
earns were stroked pictograms out of `assets/motor/lucide/`, and a stroked
pictogram reads as a tool's chrome. The web shell is a game.

```bash
node tools/lab/cut-objects.mjs game-object-reward --grid 6x4   # 24 cuts
node tools/lab/cut-objects.mjs game-object-trophy --grid 5x2   # 10 cuts
node tools/lab/cut-objects.mjs game-object-ticket --grid 4x3   # 12 cuts
node tools/lab/cut-objects.mjs game-object-multiplicator --grid 3x2  # 6 cuts
```

It **cannot be adopted**, because there is no manifest to write the choice
into: the shell names its own pieces in `SHELL_CUTS` of
`tools/lab/encode-art.mjs`, for exactly the reason a game names its own — a
folder of cuts cannot say which of two files ships. 360 px at q 0.82, ~26 KB
apiece, ~160 KB of base64 for the six boxes and ~150 KB for the six
instruments.

**A cut is RENAMED there, and the rename is the declaration.** `reward-08` says
nothing; `coin` is what the shell draws. Four of the roles are deliberately the
names `packages/webshell/menu.js` already calls its pictograms by, so
`icon("coin")` finds the painted piece with no table in between and falls back
to the stroke in a build that carries no artwork — one swap, in `icon()`, and
the wallet, the shop, the album, the daily road, the level map and the end
screen's three stars all turn painted together:

| cut                     | role         | what draws it                                        |
| ----------------------- | ------------ | ---------------------------------------------------- |
| `game-reward-01`        | `star`       | the level stars — map, round pill, end screen        |
| `game-reward-03`        | `star-burst` | the endless node, the seventh day's badge            |
| `game-reward-08`        | `coin`       | money, everywhere a wallet is shown                  |
| `game-ticket-02`        | `ticket`     | a pull at the machine — the wallet, the shop, DRAW   |
| `game-reward-18`        | `coin-pile`  | an AMOUNT of money — the reward card                 |
| `game-reward-24`        | `xp`         | the bolt the xp bar and its LV row are labelled with |
| `game-trophy-03`        | `trophy`     | the map's counter at ninety of ninety                |
| `game-multiplicator-02` | `mult-5`     | the seventh day of the daily road — strip and cards  |

The ticket is the BLUE one of the twelve, and the colour is the whole choice:
it sits next to the coin in every wallet, and a gold ticket beside a gold coin
is one number read twice. It is also the one piece whose tint no longer follows
the game's accent — what being painted costs.

**The multiplier is keyed by the NUMBER**, not by the place that draws it:
`Meta.multArt(5)` finds `mult-5` and a shell that one day pays double asks for
`2`. Only `mult-5` is shipped, because ×5 is the only multiplier the shell
states — the other five plates are cut and one line in `SHELL_CUTS` away. It
carries its own type, its own colour and its own stars, so a card that shows
the plate drops every word that said the same thing: the `×5` tag on the reward
name (`kindWord`), the line "every seventh day pays five times over" under the
locked card, and "star day — every gift is worth five times as much" over the
three boxes. What is left of the sentence is the answer to the tap — how far
away the day is — which no picture carries. Its box is `{ w: 480 }` rather than the shell's
360 — a plate across a modal's header, not a 26 px chip.

**The ad offer wears it too.** The reward card after a perfect round used to
multiply by three, which is a number nothing here can draw — the plates are x2,
x5, x10, x20, x50 and x100. It pays ×5 now and the button says so with the
plate: `WIN ×5` over `watch an ad`, the reward first and the price under it.
A sticker is redrawn rather than multiplied, so that one loses the plate and
reads *one more* — the whole reason the number is drawn rather than implied is
that it cannot then promise what the card will not hand over.

**There is no `ticket-pile` beside `coin-pile`.** A card hands over 148 coins
and one to five tickets: a pile says "an amount" where a single ticket says the
truth, and every file here is base64 in every build.

`tools/build/build.mjs` injects them as **`CONFIG.shellArt.<camelRole>`** —
`giftClose01`, `coinPile`, `starBurst` — on the **web target only, and only for a game
with a `web.meta` block**. The gate is the meta block and not merely the target
because the gift is that layer's ceremony: a game with no wallet never opens a
box, and 160 KB of base64 for a picture nothing draws is the one thing every
rule on this page exists to prevent. A build without it falls back to the CSS
boxes the ceremony was drawn with before the painting arrived.

### Shared material: `game-object-cloud-*.png` → the game's own `art.objects`

**Not everything under that prefix is the shell's.** The sheets above are the
shell's own pieces — it names them in `SHELL_CUTS`, encodes them into
`assets/image/shell/` and draws them for every game with a wallet. The second
kind is SHARED MATERIAL: scenery no game owns and any game may use, which the
three cloud sheets are the first of.

| sheet                        | grid      | cuts | what it is                    |
| ---------------------------- | --------- | ---- | ----------------------------- |
| `game-object-cloud-big.png`  | `4,3`     | 7    | one fat cumulus, seven tints  |
| `game-object-cloud-flat.png` | `2,2,2,1` | 7    | a long flat bank, seven tints |
| `game-object-cloud-haze.png` | `2x4`     | 8    | soft vapour, eight tints      |

```bash
node tools/lab/cut-objects.mjs game-object-cloud-big  --grid 4,3
node tools/lab/cut-objects.mjs game-object-cloud-flat --grid 2,2,2,1 --solid 30
node tools/lab/cut-objects.mjs game-object-cloud-haze --grid 2x4
```

The tints are the same seven in the three sheets and the grid is what keeps
them in step, exactly as it does for `radiam`'s beads: cell 1 is the palest in
all three. `--solid 30` on the flat sheet is the one knob that is not the
default — its first cloud is genuinely semi-transparent and the 110 bar cut it
down to the densest third of itself.

**A cloud is adopted by a GAME, not named by the shell**, and that is the whole
difference: it stands on ONE village, at a place that game chose, so it is
declared like any other cut and only the villages that place one carry the
bytes.

```bash
node tools/lab/cut-objects.mjs game-object-cloud-haze --adopt 3,6 --into chainring
make village          # …or click it in the SHARED CUTS palette, which does both
```

`--into` is which game, and it means nothing for a game's own sheet; a sheet
the shell names in `SHELL_CUTS` refuses to be adopted at all and says so.
**The role is the cut's own name with the prefix taken off** —
`game-cloud-haze-03` is `cloud-haze-03` — so it is the same word in all
thirteen, it camel-cases to `CONFIG.art.cloudHaze03` the way `ball-blue-01`
already does, and the dashes are what tell the encoder which box to use and the
builder that it is village material.

`CLOUD` is a **600x320 box at q 0.78**, ~17 KB a cut. It is wide and short
because the material is: a haze cloud is 1060x190, five and a half to one, and
the generic 320x400 portrait box would fit it to 320 px across — a quarter of
the width it is drawn at. 600 covers a cloud placed at up to 400 design px at
the same ~1.5x the houses and the stickers are cut at, and soft painted vapour
with nothing to read in it takes the decor pool's quality rather than a house's.

**Web-only** (`WEB_ONLY_CLOUD` in `tools/build/build.mjs`), for the same reason
the houses are: the village is the web menu's own view and a playable has no
screen to draw a sky on. In the composition it is a `decor` house like any
other — a door that opens nothing — and the village's z-sort by the foot of the
object puts a cloud dropped high behind every building without a z-index
anywhere.

## The listing images come from `assets/image/google/` and `assets/image/itch/`

A store page is not documentation: a raw capture is a dial on a dark background
next to twelve other dials on dark backgrounds, and it sells nothing. The
listing images are that capture **dressed** — the game's own character, two or
three of its own objects, its logotype, its typeface, and one punchline in the
player's language.

`lab/store-card.html` is the composition and `tools/lab/shoot-store.mjs` shoots
it, in four formats and two languages:

| format  | shipped         | where it goes                                     |
| ------- | --------------- | ------------------------------------------------- |
| `phone` | 1080 × 1920     | the Play phone slot, and the itch screenshots     |
| `desk`  | 1920 × 1080     | the Play tablet slot, and the desktop picture     |
| `thumb` | 630 × 500       | the itch cover, shown down to 315 × 250 in a grid |
| `multi` | 3 × 1080 × 1920 | the same phone slots, composed as one picture     |

`multi` is composed by hand only — `shoot-store.mjs` shoots the other three.

```bash
node tools/lab/shoot-store.mjs                    # 13 games, en + fr, all three
node tools/lab/shoot-store.mjs radiam --lang fr
node tools/lab/shoot-store.mjs radiam --format desk
node tools/lab/shoot-store.mjs --lines            # print the copy, shoot nothing
make store                                        # compose one by hand
```

### Composing one by hand: `make store`

`lab/store-card.html` is an editor, and the card in it is **two layers**:

1. **the ground** — one picture, picked on a reel: every capture the game has,
   then its painted backgrounds. The scrim over it comes with the layout.
1. **the elements** — everything the game owns, in four palettes: its objects
   (the adopted decor *and* every cut of every object sheet — 40 of them on
   `radiam`, narrowed with the *Show* filter), its three faces, its captures and
   its logotype, and **its taglines**, one tile per style (hero, banner, plate,
   outline, ribbon). Every one of them is **dragged out of the palette and
   dropped on the card**, then moved, turned, resized and deleted with the
   handles on the selection. **A picture never goes past 100 % of its own
   pixels** — the width is capped at the file's natural size, because a decor
   cut for 360 px blown up to 600 loses exactly the sharpness it was encoded
   for.

**A piece changes without being replaced.** Every element that comes out of a
pool carries a dropdown on the selection — *Capture* for a screenshot, *Face*
for the character, *Object* for anything the objects palette holds — so trying
the card with a later board, the neutral face or another gear is one menu, and
not a delete, a new drag and a position, a rotation and a size to find again.
The layout stores that index, which is what a walk across the thirteen
re-resolves.

The *Object* row is **one flat list of everything the game owns** — the adopted
decor first, then every cut of every sheet, forty of them on `radiam`. The
sheet a gear came out of is how the disk stores it, not how a card is composed,
so there is no category to pick before the objects are shown; an entry carries
the kind and the sheet itself, which is why the same row swaps an adopted decor
for a raw cut.

**A tagline is a line of `store.copy` and nothing else.** The style, the line's
number, its alignment and its size are chosen on the selection, where every
other property of a piece already lives; the text itself is never typed on the
page. The manifests are where the thirteen games' copy is written and
proofread, and a listing image is not where a punchline is drafted — so the
picker shows the English lines by number, with the French of that same number
under it, and a line that needs changing is changed in the manifest.

**There is no language to pick, because Save writes both.** One press prints
the same composition into `assets/image/<store>/en/` and `.../fr/`, the only
difference being the manifest line drawn on it. A card carrying no tagline
writes the same picture twice, which is what keeps each language folder a
complete upload on its own.

**The grid is magnetic** and it is what makes thirteen listings one family:
positions snap to its step (50 px) and rotation to 5°. A composition is saved as a
**layout** in `lab/store-presets.json`, keyed `<slug>/<format>`; saving one as
the **template** for its format is how it is duplicated — every game with no
layout of its own opens on it, because an element refers to its asset by role
and index ("the second decor", "the happy face", "the third capture") and never
by file name, so the same composition resolves against whichever game is
loaded. `tools/lab/shoot-store.mjs` reads that file too: a game with a layout is
shot with it, and the built-in layout is what the other twelve get.

#### `multi` — three slots, one picture

A store gallery shows the phone screenshots **side by side**, so the third
format is a card three slots wide (2160 × 1280 authored) that **Save cuts at
the seams**: one press writes three files on three consecutive free numbers —
`radiam-01`, `radiam-02`, `radiam-03`, the order the gallery sorts them in.

Nothing is clipped by hand and no piece is duplicated: each image is drawn from
the whole scene through its own window, which is exactly what makes a background,
an object or a beam laid **over a seam** come out as two halves that line up.
That is the point of the format — the motif carries from one screenshot to the
next instead of every image being its own little poster. The seams are dashed
on the card while it is being composed, each slot numbered in its corner, and
the editor is the only place they exist.

A panel of a `multi` is exactly a `phone`, so every number in a layout means the
same thing in both; the built-in composition is the landscape scene running
across all three, one punchline per slot out of `store.copy`, the logotype on
the first and the objects sitting on the seams. It is saved like any other
layout, keyed `<slug>/multi`.

**Save writes the image itself**, at shipped size, into `assets/image/<store>/en/`
**and** `.../fr/`, and saves the layout with it. A `multi` writes its three per
language, so six files.

**The name is not typed, and neither is the format.** A listing image is a
numbered slot of a store gallery, so the server hands out the next free numbers
— `<slug>-NN` for a phone or a `multi`, `<slug>-desk-NN`, `<slug>-thumb` for
the itch cover — and **refuses to write over a file that is already there**.
Both languages are allocated together, so `en/<slug>-05.jpg` and
`fr/<slug>-05.jpg` are always the same composition, and a `multi` takes its
three numbers in one go. A second press of Save is therefore a second picture,
never a lost one; the page shows the names it is about to take under the
button. The format is JPEG, always — see below.

**Save for all** writes the same composition once per game and per language —
twenty-six images, each into its own game's next free slots, with that game's
own pieces, its own punchline and its own typeface. That is
what the role-and-index references are for, and it is the whole point of the
tool: compose one card, print thirteen. It touches no layout, so a game that
has a composition of its own keeps it. That — and listing what a game owns, which a
`file://` page cannot do — is why the editor comes with a server:

```bash
make store                       # → http://localhost:8091/
node tools/lab/serve-store.mjs --port=4000
```

Opened straight off the disk (`open lab/store-card.html`) the page still
composes and previews, which is how the batch shoot drives it, and it probes for
the pictures it cannot list. But **a manifest cannot be read from there at all**,
so there is no tagline to pick and no other game's copy, only the line the URL
carries (which is how the batch shoot hands the copy over); and Save is off, because a canvas that drew a `file://` image is tainted
and cannot be exported. The page says so, in red, at the top of its panel.

Output is `assets/image/google/<lang>/<slug>-NN.jpg` and `-desk-NN.jpg`, and
`assets/image/itch/<lang>/<slug>-thumb.jpg`
— **JPEG like `assets/image/screen/`**, because 182 pictures of painted artwork over a
capture is 34 MB as JPEG and 450 MB as PNG. The composer writes nothing else;
`--png` is a flag of the batch shoot, for a piece that has to stay lossless. `node tools/publish/store-meta.mjs --game=<slug> --play --lang=fr` names the set it should be uploaded with.

Nothing is invented: a game missing a character, a logotype, a landscape scene
or the capture a shot is aimed at is **skipped and reported**, never shot with a
placeholder in the hole. The usual fix is `node tools/lab/encode-art.mjs` or
`node tools/lab/shoot-screens.mjs`.

### The punchline: `store.copy` in the manifest

The one thing on these images that is not a picture, and it lives where every
other string about a game lives — `games/<slug>/manifest.json`:

```json
"store": {
  "copy": {
    "en": { "lines": [
      { "kicker": "Twelve rays", "line": "Turn <b>one</b> ring" },
      { "kicker": "Three per ray", "line": "Line them up on a <b>ray</b>" }
    ] },
    "fr": { "lines": [
      { "kicker": "Douze rayons", "line": "Tourne <b>un</b> anneau" },
      { "kicker": "Trois par rayon", "line": "Aligne-les sur un <b>rayon</b>" }
    ] }
  }
}
```

- **A line is two to five words**, written in normal case and rendered in caps,
  in the game's own `web.font`. Like every string in the repo it is typed
  `Aim & fire`, never `AIM & FIRE`: the composer shouts it on the way to the
  card and takes the accents off with the capitals, so `Les écailles deviennent armure` prints LES ECAILLES DEVIENNENT ARMURE (see
  [ENGINE.md](ENGINE.md#upper--capitals-are-a-look-not-a-spelling)). It is
  auto-fitted, so nothing is hand-tuned per game or per language. Past ~44 % of
  the design size the fit gives up — a line that long is not a punchline and
  should be rewritten, not shrunk.
- **One word wrapped in `<b>`** takes the game's accent and a glow. `<b>` is the
  only markup that survives; everything else is stripped.
- `kicker` is the small spaced line above it, in the accent. It may be empty.
- **The number of lines is the number of phone screenshots** (2 to 8, what Play
  accepts): a gallery says as many things as the copy has to say. The shots are
  spread from an early board to a late one, the character rotates through the
  three faces the game ships — never opening on the sad one — and the punchline
  alternates between the top and the bottom band so four images do not read as
  one layout printed four times.
- A game that writes no block falls back to its `copy.<lang>.tags`, which every
  manifest already carries. Writing `store.copy` is how a game gets *better*
  copy, not how it gets any.

The block reaches no build: `store` is listing copy, so a game's `version` does
not move when it changes.

## Type comes from `assets/motor/font/` — web target only

Six families, all **SIL Open Font License 1.1**, so they can be embedded and
shipped. A game names one in its `manifest.json` and nothing else:

```json
"web": { "font": "bungee" }
```

`tools/build/build.mjs --target=web` embeds that family as a base64
`@font-face` in front of the game's SKIN (a file next to the other assets in the
split site build) and writes two tokens the webshell reads — `--web-font` and
`--web-fw`, the weight to ask a single-weight face for. **A playable ships no
font**: the pack belongs to the web front end, and a 20-second creative does not
spend 30 KB on type.

The rule is the same as everywhere else — embedded, never fetched. No `<link>`
to Google Fonts, no CDN. Pack, licences and how to add a family:
[assets/motor/font/README.md](../assets/motor/font/README.md).

## Decoration comes from `assets/image/gear/` — it never ships

Transparent PNG cogs to lay **over a screenshot** — a store gallery shot, an
itch cover, a site header — in whatever tool does the composing. Nothing reads
them at build time and no target embeds them: they are furniture for a picture,
not an asset of a game.

```bash
node tools/lab/shoot-gears.mjs                 # 6 shapes x 3 finishes -> assets/image/gear/
node tools/lab/shoot-gears.mjs spur-24 stack   # only these shapes
node tools/lab/shoot-gears.mjs --finish light --size 1024
```

| shape         | what it is                                   |
| ------------- | -------------------------------------------- |
| `spur-24`     | the classic cog, fine teeth                  |
| `spur-16`     | the same, chunkier                           |
| `spoke-12`    | five lightening holes cut out of the web     |
| `sprocket-36` | a thin rim with many small teeth             |
| `ring-20`     | a wide bore: a frame to put something inside |
| `stack`       | a 20-tooth wheel meshing a 13-tooth pinion   |

Three finishes: `steel` (dark metal, self-shaded), `light` (pale, for a dark
shot) and `outline` (stroke only, for a busy frame a solid disc would smother).

**Grey on purpose.** A decoration tinted for one game cannot be dropped on
another's screenshot, and any colour comes back from a blend mode over a
neutral plate. Do not add a per-game palette here.

The shapes are a formula, not a picture: [lab/gear-decor.html](../lab/gear-decor.html)
draws them as SVG from a tooth count and three radii, which is why re-shooting
at another size is a flag rather than a new render. They are **not** artwork in
the sense of [the painted artwork](#painted-artwork-comes-from-assetsimagemaster-re-encoded-into-assetsimageembed)
— that is the user's and is never generated.

## Embedding an asset

Use the helper to convert a file into a data URI:

```bash
node tools/lab/embed-asset.mjs path/to/logo.png
node tools/lab/embed-asset.mjs path/to/pop.mp3 --key pop
```

It prints a line to paste into the `ASSETS` registry (section 2 of the game):

```js
var ASSETS = {
  images: {
    "logo": "data:image/png;base64,iVBORw0KGgoAAA…"
  },
  sounds: {
    "pop": "data:audio/mpeg;base64,SUQzBAAAAAA…"
  }
};
```

### Using embedded images

Images are decoded before the game starts by `preloadImages` and exposed on
`Images`:

```js
// inside Game.render()
ctx.drawImage(Images.logo, x, y, w, h);
```

### Using embedded sounds

```js
Sound.clip("pop");             // plays ASSETS.sounds.pop
Sound.clip("pop", 0.6);        // …at 60% volume
Sound.clip("pop", 0.6, 1.35);  // …and pitched up 35% (rate 0.5–4)
```

Clips are decoded into WebAudio buffers inside `Sound.unlock()` — i.e. in the
start gesture, which is what iOS requires. Each call plays its own buffer
source, so rapid repeats overlap instead of cutting each other off, and `rate`
is the cheap way to make one sample climb with a combo. Until a buffer is ready
the call falls back to an `<audio>` element, so no cue is ever dropped.

Orbinity is a second reference: seven mp3s (launch, boom, grab, wall, lost,
milestone, evolve) re-encoded mono 32 kHz, ~80 KB total.

### Background music: the reserved `music` key

One clip under the key `music` turns into a looping background bed, driven by
the engine's `Music` module (see [ENGINE.md](ENGINE.md)):

```js
CONFIG.music = { volume: 0.10, fade: 2.0 };   // discreet, 2 s fades
ASSETS.sounds.music = "data:audio/mpeg;base64,…";
```

`startGame()` starts it, `endRound()` ducks it, `visibilitychange` and MRAID
pause it. The track does **not** need to be a seamless loop: every pass fades in
and out over `CONFIG.music.fade` and overlaps the next one, so the seam is a
crossfade instead of a click.

Music is the single heaviest thing a playable embeds, so encode it small — the
bed sits far under the sfx, mono 64 kbps is plenty:

```bash
ffmpeg -i track.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3   # ~30 s ≈ 240 KB
node tools/lab/embed-asset.mjs music.mp3 --key music
```

Orbinity and Chainring both ship a ~30 s bed at 321 KB as a data URI.

#### One track, several beds

What loops is a **section** of the track, and by default that section is the
whole file. `Music.play({ from, length, rate, gain })` names another one, so a
long track is several beds at no extra cost: one stretch per biome or level
band, plus a quiet, slower window for the menus. **The procedure is
[MUSIC.md](MUSIC.md)** — read it before cutting a track into sections; the API
is in [ENGINE.md](ENGINE.md#music--the-background-bed).

#### A long track: `assets/audio/music/embed/` and `web.music`

A playable is one file an ad network downloads before it can show anything, so a
three-minute bed has no business in it — and no use either, having neither
levels nor a menu. So the two targets ship different amounts of the same track:

| target                    | what ships                                                  |
| ------------------------- | ----------------------------------------------------------- |
| playable                  | the **short cut** embedded in `ASSETS.sounds.music`         |
| web (site, itch), android | the whole track, from `assets/audio/music/embed/<name>.mp3` |

The web one is a manifest key and nothing else:

```json
"web": { "music": "arcider.mp3" }
```

`assets/audio/music/embed/` is the **shipping cut** and the build never encodes
it — the same contract as `assets/image/embed/`, `assets/motor/font/` and
`assets/audio/sfx/`. `assets/audio/music/` itself holds the masters (192 kbps
stereo), which ship nowhere. One ffmpeg line makes each cut:

```bash
# the web target's bed — the whole track, mono 64 kbps
ffmpeg -i assets/audio/music/arcider.mp3 -t 177.75 -ac 1 -ar 44100 -b:a 64k \
       assets/audio/music/embed/arcider.mp3

# the playable's — the one stretch it plays
ffmpeg -ss 12 -t 36 -i assets/audio/music/arcider.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3
node tools/lab/embed-asset.mjs music.mp3 --key music
```

The builder swaps the entry for the web target rather than adding a second one,
so the site never carries a music file nothing fetches. A game that names no
`web.music` keeps its embedded cut on every target, which is the twelve others.

### The three end-screen keys

The template already ships `uiScore`, `uiStar` and `uiRow` (~22 KB) — the shared
end-screen reveal plays them through `Sound.cue`, so keep the keys and swap the
clips to re-theme it. Removing them is safe: `Sound.cue` falls back to the
synthesized beeps.

## Size budget

| Concern         | Guidance                                                                                |
| --------------- | --------------------------------------------------------------------------------------- |
| Hard limit      | Keep the whole `index.html` **< 5 MB**. Some networks cap at 2–3 MB — check the target. |
| base64 overhead | Encoding inflates binary size by ~**33%**. A 3 MB image becomes ~4 MB of text.          |
| Verify          | `node tools/build/check-size.mjs` (add `--limit 2` for a 2 MB budget).                  |

### Keeping assets small

- **Images**: export at the *displayed* size (don't embed a 2048px image shown
  at 200px). Use **WebP** or optimized **PNG**; crush with `pngquant` /
  `oxipng` / `cwebp` before embedding. Use SVG for flat/vector art — it's text
  and often tiny.
- **Audio**: short mono clips, low bitrate (e.g. 64–96 kbps MP3). Or skip files
  entirely and use `Sound.beep`.
- **Fonts**: avoid embedding web fonts (often 50–300 KB each). Use the system
  font stack already in the template. If you must, subset to only the glyphs
  used.
- **Sprites**: prefer one small spritesheet over many separate images.

## Checklist before shipping

- [ ] `node tools/build/check-size.mjs` passes.
- [ ] Browser **Network** tab is empty when the game runs (no external fetches).
- [ ] No `http(s)://` asset URLs remain in the file (only `data:` URIs).
- [ ] Images are sized for display; audio is short and low-bitrate.
