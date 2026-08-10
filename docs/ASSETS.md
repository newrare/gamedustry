# Assets & the size budget

Playable ads are a **single self-contained HTML file with no network
requests**, so every asset must be embedded directly in the file as a base64
`data:` URI. This doc covers how to embed assets and how to stay under the
**5 MB** budget (aim for < 2 MB).

## Rule #1: draw the graphics, embed the sound

- **Graphics** → draw with the Canvas 2D API (`ctx.fillRect`, `arc`, gradients,
  paths). Vector-style art is tiny and scales perfectly. Reach for an embedded
  image only when the creative genuinely needs a specific logo or character art.
- **Sound** → take the clips from **`assets/sfx/`** (next section). A playable
  lives or dies on how it *feels*, and a real sample beats a synthesized beep
  every time; the whole library re-encodes to a few KB per event.

`Sound.beep` / `Sound.arp` are still there, as the fallback for an event that has
no clip yet (and as what `Sound.cue` degrades to). They are not the target.

## Sound effects always come from `assets/sfx/`

`assets/sfx/` is the shared sfx library of the repo (~125 clips, ZapSplat
licence in the folder). Every game picks from it, so the whole catalogue sounds
like one product instead of one synth per game.

The recipe per event:

1. **Pick a clip.** The file names describe the sound (`..._alert_ping_chime_…`,
   `..._game_sound_mallets_negative_error_…`, `..._ui_percussive_clicks_…`).
   Check the useful length first — most clips are mostly tail:
   ```bash
   ffprobe -v error -show_entries format=duration -of csv=p=0 assets/sfx/<clip>.mp3
   ffmpeg -i assets/sfx/<clip>.mp3 -af "silencedetect=noise=-42dB:d=0.04" -f null -
   ```
1. **Trim and re-encode small.** Mono, 32 kHz, 64 kbps, with a short fade so the
   cut does not click. An sfx costs ~8 KB per second at that setting:
   ```bash
   ffmpeg -i assets/sfx/<clip>.mp3 -t 0.4 -af "afade=t=out:st=0.33:d=0.07" \
          -ac 1 -ar 32000 -b:a 64k gem.mp3
   ```
1. **Embed it** under a short game-side key, and keep a comment naming the
   source clip so the choice can be revisited:
   ```bash
   node tools/embed-asset.mjs gem.mp3 --key gem
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

## Icons come from `assets/lucide/`

Pictograms — a bomb, a double arrow, a spark — are the one case where drawing
by hand is worse than embedding: a Lucide glyph is a few hundred bytes of SVG
and reads better than a path improvised in canvas. The repo keeps a curated
slice of the pack in `assets/lucide/` (ISC licence in the folder):

```bash
ls assets/lucide                                   # browse the pack
node tools/embed-icon.mjs bomb --key icoBomb       # encode one
node tools/embed-icon.mjs arrow-left-right --key icoRow --stroke 2.6
```

Paste the printed line into `ASSETS.images`, then draw it through the motor's
`Icon` helper, which tints and caches it:

```js
Icon.draw(ctx, "icoBomb", cx, cy, 26, "#2a1400");
```

Details and the reason icons are stored white: [assets/lucide/README.md](../assets/lucide/README.md).

## Embedding an asset

Use the helper to convert a file into a data URI:

```bash
node tools/embed-asset.mjs path/to/logo.png
node tools/embed-asset.mjs path/to/pop.mp3 --key pop
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
node tools/embed-asset.mjs music.mp3 --key music
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
| Verify          | `node tools/check-size.mjs` (add `--limit 2` for a 2 MB budget).                        |

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

- [ ] `node tools/check-size.mjs` passes.
- [ ] Browser **Network** tab is empty when the game runs (no external fetches).
- [ ] No `http(s)://` asset URLs remain in the file (only `data:` URIs).
- [ ] Images are sized for display; audio is short and low-bitrate.
