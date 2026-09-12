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

| asset                                                | where it comes from            | generative AI |
| ---------------------------------------------------- | ------------------------------ | ------------- |
| the code, all of it                                  | written with an LLM            | **yes**       |
| the game names                                       | generated                      | **yes**       |
| app icons — `assets/image/icon/<slug>.png`           | an image model                 | **yes**       |
| painted artwork — `assets/image/master/<slug>-*.png` | an image model                 | **yes**       |
| background music — `ASSETS.sounds.music`             | a music model                  | **yes**       |
| sound effects — `assets/audio/sfx/`                  | the ZapSplat library, licensed | no            |
| pictograms — `assets/motor/lucide/`                  | Lucide, ISC                    | no            |
| type — `assets/motor/font/`                          | six OFL families               | no            |

So the answer on a store form is **yes**, for all thirteen. What that costs is
a place on itch's *AI Assisted* browse page; what not saying it costs is the
page. `node tools/publish/store-meta.mjs --game=<slug>` prints the line with
the rest of the form.

## Sound effects always come from `assets/audio/sfx/`

`assets/audio/sfx/` is the shared sfx library of the repo (~125 clips, ZapSplat
licence in the folder). Every game picks from it, so the whole catalogue sounds
like one product instead of one synth per game.

The recipe per event:

1. **Pick a clip.** The file names describe the sound (`..._alert_ping_chime_…`,
   `..._game_sound_mallets_negative_error_…`, `..._ui_percussive_clicks_…`).
   Check the useful length first — most clips are mostly tail:
   ```bash
   ffprobe -v error -show_entries format=duration -of csv=p=0 assets/audio/sfx/<clip>.mp3
   ffmpeg -i assets/audio/sfx/<clip>.mp3 -af "silencedetect=noise=-42dB:d=0.04" -f null -
   ```
1. **Trim and re-encode small.** Mono, 32 kHz, 64 kbps, with a short fade so the
   cut does not click. An sfx costs ~8 KB per second at that setting:
   ```bash
   ffmpeg -i assets/audio/sfx/<clip>.mp3 -t 0.4 -af "afade=t=out:st=0.33:d=0.07" \
          -ac 1 -ar 32000 -b:a 64k gem.mp3
   ```
1. **Embed it** under a short game-side key, and keep a comment naming the
   source clip so the choice can be revisited:
   ```bash
   node tools/lab/embed-asset.mjs gem.mp3 --key gem
   ```
1. **Pitch, don't duplicate.** One sample covers a whole family of events
   through `rate` — a rising chain, a direction, a weaker variant:
   ```js
   Sound.clip("gem", 0.6, 1 + Math.min(chain, 14) * 0.045);  // climbs with the chain
   Sound.clip("swipe", 0.6, dir > 0 ? 1.08 : 0.93);          // left / right
   Sound.clip("crash", 0.5, 1.45);                           // shrugged off by a shield
   ```

Triverse is the reference: eight events (gem, mega, chain, loop, power, swipe,
void, crash) for ~58 KB of mp3.

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
| `-background-desk.png`               | the bands around the frame on a desktop window (**web target only**)              |
| `-title.png`                         | the logotype: replaces the app icon and the CSS `#intro-title`                    |
| `-character-{sad,neutral,happy}.png` | the end screen's face, by star count (0–1 / 2 / 3)                                |
| `-object-<name>.png`                 | **a sheet to cut, never a role** — see below; `encode-art` leaves it alone        |
| `-decor-NN.png`                      | the decor pool: objects the shell scatters over the screens — see below           |
| anything else                        | `CONFIG.art.<camelName>`, for the game to use as it likes                         |

`assets/image/master/` is the **master and ships nowhere**: PNG, up to 2172 px, ~2 MB
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

node tools/lab/cut-objects.mjs radiam-object-gear --adopt 1,4   # → assets/image/master/
node tools/lab/encode-art.mjs radiam               # the adopted two become art
```

| flag              | default | what it is                                                                   |
| ----------------- | ------- | ---------------------------------------------------------------------------- |
| `--solid <alpha>` | `110`   | the alpha at which a pixel is the object rather than its glow — see below    |
| `--pad <px>`      | `20`    | the margin around a cut, and how far its own glow is followed                |
| `--min <px²>`     | `2500`  | the speck floor: below it, paint rather than an object                       |
| `--keep-partial`  | off     | keep the objects the sheet's own edge cuts in half                           |
| `--step <0-255>`  | `14`    | opaque sheets only: how far the border flood crosses in one pixel            |
| `--envelope <n>`  | `90`    | opaque sheets only: how far from the border colour the flood may ever go     |
| `--adopt 1,4`     | —       | copy those cuts into `assets/image/master/` as masters (one sheet at a time) |
| `--as <role>`     | —       | rename them on the way in: `--as decor` → `<slug>-decor-NN.png`              |
| `--list`          | —       | name the sheets and stop                                                     |

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

**`assets/image/object/` is tracked (35 MB, 383 files) and ships nothing.** Tracked
for the same reason `assets/image/master/` is — it is material, and material that only
exists on one laptop is material nobody else can build from. Shipping nothing
is the other half: everything under `assets/image/embed/` is embedded in every build of
its game, so 383 objects would be megabytes of base64 in creatives capped at
5 MB.

`--adopt` is the step between the two, and it is deliberately manual: it copies
the two or three cuts that earn it into `assets/image/master/` as masters like any
other, and from there the usual pipeline names them `CONFIG.art.<name>NN` —
`ArtImages.gear01` on the canvas, or a piece of a store screenshot.

### The decor pool: `assets/image/master/<slug>-decor-NN.png`

One adopted role is not a game's to draw: `--as decor` renames a cut on its way
into `assets/image/master/`, and every `CONFIG.art.decor*` key is the pool the shell
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

## The listing images come from `assets/image/google/` and `assets/image/itch/`

A store page is not documentation: a raw capture is a dial on a dark background
next to twelve other dials on dark backgrounds, and it sells nothing. The
listing images are that capture **dressed** — the game's own character, two or
three of its own objects, its logotype, its typeface, and one punchline in the
player's language.

`lab/store-card.html` is the composition and `tools/lab/shoot-store.mjs` shoots
it, in three formats and two languages:

| format  | shipped     | where it goes                                     |
| ------- | ----------- | ------------------------------------------------- |
| `phone` | 1080 × 1920 | the Play phone slot, and the itch screenshots     |
| `desk`  | 1920 × 1080 | the Play tablet slot, and the desktop picture     |
| `thumb` | 630 × 500   | the itch cover, shown down to 315 × 250 in a grid |

```bash
node tools/lab/shoot-store.mjs                    # 13 games, en + fr, all three
node tools/lab/shoot-store.mjs radiam --lang fr
node tools/lab/shoot-store.mjs radiam --format desk
node tools/lab/shoot-store.mjs --lines            # print the copy, shoot nothing
make store                                        # compose one by hand
```

### Composing one by hand: `make store`

`lab/store-card.html` is an editor, and the card in it is **three layers**:

1. **the ground** — one picture, picked on a reel: every capture the game has,
   then its painted backgrounds. The scrim over it comes with the layout.
1. **the elements** — everything the game owns, in three palettes: its objects
   (the adopted decor *and* every cut of every object sheet — 40 of them on
   `radiam`, narrowed with the *Show* filter), its three faces, its captures and
   its logotype. Every one of them is **dragged out of the palette and dropped
   on the card**, then moved, turned, resized and deleted with the handles on
   the selection. **A picture never goes past 100 % of its own pixels** — the
   width is capped at the file's natural size, because a decor cut for 360 px
   blown up to 600 loses exactly the sharpness it was encoded for.
1. **the tagline** — one button adds it; the style (hero, banner, plate,
   outline, ribbon), the line of `store.copy` it shows, its alignment and its
   size are then chosen on the selection, where every other property of a piece
   already lives.

**The grid is magnetic** and it is what makes thirteen listings one family:
positions snap to its step (50 px) and rotation to 5°. A composition is saved as a
**layout** in `lab/store-presets.json`, keyed `<slug>/<format>`; saving one as
the **template** for its format is how it is duplicated — every game with no
layout of its own opens on it, because an element refers to its asset by role
and index ("the second decor", "the happy face", "the third capture") and never
by file name, so the same composition resolves against whichever game is
loaded. `tools/lab/shoot-store.mjs` reads that file too: a game with a layout is
shot with it, and the built-in layout is what the other twelve get.

**Save writes the image itself**, at shipped size, into `assets/image/<store>/<lang>/`,
and saves the layout with it. **Save for all** writes the same composition once
per game — thirteen images, each with that game's own pieces, its own punchline
and its own typeface, the file name keeping everything but the slug. That is
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
so there is no tagline to pick and no other game's copy, only the game the URL
names; and Save is off, because a canvas that drew a `file://` image is tainted
and cannot be exported. The page says so, in red, at the top of its panel.

Output is `assets/image/google/<lang>/<slug>-NN.jpg` and `-desk-NN.jpg`, and
`assets/image/itch/<lang>/<slug>-thumb.jpg`
— **JPEG like `assets/image/screen/`**, because 182 pictures of painted artwork over a
capture is 34 MB as JPEG and 450 MB as PNG. `--png` is there for a piece that
has to stay lossless. `node tools/publish/store-meta.mjs --game=<slug> --play --lang=fr` names the set it should be uploaded with.

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
      { "kicker": "TWELVE RAYS", "line": "Turn <b>one</b> ring" },
      { "kicker": "THREE PER RAY", "line": "Line them up on a <b>ray</b>" }
    ] },
    "fr": { "lines": [
      { "kicker": "DOUZE RAYONS", "line": "Tourne <b>un</b> anneau" },
      { "kicker": "TROIS PAR RAYON", "line": "Aligne-les sur un <b>rayon</b>" }
    ] }
  }
}
```

- **A line is two to five words**, rendered in caps, in the game's own
  `web.font`. It is auto-fitted: the same band holds `AIM & FIRE` and
  `LES ÉCAILLES DEVIENNENT ARMURE`, so nothing is hand-tuned per game or per
  language. Past ~44 % of the design size the fit gives up — a line that long is
  not a punchline and should be rewritten, not shrunk.
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
