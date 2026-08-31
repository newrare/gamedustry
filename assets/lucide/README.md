# Lucide icon pack

A curated slice of [Lucide](https://lucide.dev) (v1.30.0, ISC — see `LICENSE`),
kept in the repo so a playable never has to reach for a CDN.

These are the source files, **not** what ships. A game embeds only the icons it
actually draws, as base64 SVG data URIs inside its own `ASSETS.images`.

## Using an icon in a game

1. Pick one (`ls assets/lucide`) and encode it:

   ```bash
   node tools/embed-icon.mjs bomb --key icoBomb
   node tools/embed-icon.mjs arrow-left-right --key icoRow --stroke 2.6
   ```

   The tool rewrites the SVG so it is usable on canvas: white stroke instead of
   `currentColor` (nothing resolves `currentColor` inside an `<img>`), a bigger
   intrinsic size so it stays crisp, a thicker stroke so it survives on a
   42 px brick. Flags: `--size`, `--stroke`, `--color`, `--key`.

1. Paste the printed line into `ASSETS.images` (section 2), with a comment
   naming the source icon:

   ```js
   var ASSETS = {
     images: {
       // assets/lucide/bomb.svg
       "icoBomb": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0i…",
     },
   ```

1. Draw it through the motor's `Icon` helper (section 3), which tints and
   caches it — never `drawImage` the raw SVG, it would come out white:

   ```js
   Icon.draw(ctx, "icoBomb", cx, cy, 26, "#2a1400");   // centred, 26 px, tinted
   var cv = Icon.get("icoBomb", 26, "#ffffff");        // or the canvas itself
   ```

   The tinted canvas is cached per `key|size|colour`, so a brick sprite built
   once costs one rasterization for the whole run.

## Adding an icon to the pack

Grab it from the published package rather than hand-copying paths:

```bash
npm pack lucide-static           # inside a scratch folder
tar xzf lucide-static-*.tgz
cp package/icons/<name>.svg assets/lucide/
```

Keep the pack small and generic: it is a shared toolbox, not a per-game asset
folder. Anything drawn by only one game belongs in that game's own artwork.
