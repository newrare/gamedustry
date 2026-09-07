# The font pack

Six families, all **SIL Open Font License 1.1**, so they can be embedded in a
build and shipped. Each one is here twice: the `latin` `woff2` cut and the
`OFL.txt` the licence requires to travel with it.

| key         | family     | weights | size    | for                                  |
| ----------- | ---------- | ------- | ------- | ------------------------------------ |
| `orbitron`  | Orbitron   | 400–900 | 11.5 KB | squarish sci-fi, neon                |
| `exo2`      | Exo 2      | 300–800 | 40.0 KB | technical but humanist, the neutral  |
| `baloo2`    | Baloo 2    | 400–800 | 32.3 KB | rounded and warm, cartoon            |
| `bungee`    | Bungee     | 400     | 14.0 KB | arcade signage, already ultra bold   |
| `bebasneue` | Bebas Neue | 400     | 8.4 KB  | tall condensed caps, poster / casino |
| `russoone`  | Russo One  | 400     | 7.2 KB  | industrial, machined                 |

## How a game gets one

One line in its `manifest.json`, and only the **web** target reads it:

```json
"web": { "font": "orbitron" }
```

`tools/build/build.mjs --target=web` then embeds that family as a base64
`@font-face` in front of the game's SKIN and writes two tokens the webshell
stylesheet uses:

```css
:root { --web-font: "Orbitron", "Arial Black", sans-serif; --web-fw: 800; }
```

`--web-fw` is the weight to use where the design wants a heavy face. A
single-weight family keeps it at 400: asking a 400-only face for 900 makes the
browser synthesize the bold, which smears an already-fat face.

## Rules

- **Embedded, never fetched.** No `<link>` to Google Fonts, no CDN: the bytes
  are base64 in the page, so a game still works over `file://` and inside a
  sandboxed iframe. That is the same rule the images and the sounds obey
  (see [docs/ASSETS.md](../../docs/ASSETS.md)).
- **Playables get no font.** The pack is part of the web front end
  (`packages/webshell`), which a playable build does not include — a 20-second
  creative does not spend 30 KB on type.
- **A new family comes with its licence.** Drop `<key>.woff2` and
  `<key>.OFL.txt` here and add the entry to `fonts.json`. Take the `latin` cut
  of the `woff2` (the Google Fonts CSS API serves it per unicode-range), not the
  full file.
