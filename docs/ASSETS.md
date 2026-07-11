# Assets & the size budget

Playable ads are a **single self-contained HTML file with no network
requests**, so every asset must be embedded directly in the file as a base64
`data:` URI. This doc covers how to embed assets and how to stay under the
**5 MB** budget (aim for < 2 MB).

## Rule #1: prefer drawing over embedding

Most playables need **zero binary assets**. Both example games ship with
`ASSETS = { images: {}, sounds: {} }` and look and sound complete:

- **Graphics** → draw with the Canvas 2D API (`ctx.fillRect`, `arc`, gradients,
  paths). Vector-style art is tiny and scales perfectly.
- **Sound** → synthesize with WebAudio via `Sound.beep(freq, dur, type)`. No
  files, works offline, instant.

Reach for embedded assets only when the creative genuinely needs a specific
logo, character art, or a recorded sound.

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
Sound.clip("pop");   // plays ASSETS.sounds.pop
```

## Size budget

| Concern | Guidance |
|---------|----------|
| Hard limit | Keep the whole `index.html` **< 5 MB**. Some networks cap at 2–3 MB — check the target. |
| base64 overhead | Encoding inflates binary size by ~**33%**. A 3 MB image becomes ~4 MB of text. |
| Verify | `node tools/check-size.mjs` (add `--limit 2` for a 2 MB budget). |

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
