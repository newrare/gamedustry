# prototype/

One **raw HTML page per idea**. This folder is outside the motor on purpose.

```bash
open prototype/<slug>.html      # that is the whole loop
```

A prototype answers one question — *is this mechanic fun?* — and nothing else.

**The rules, all of them:**

- One self-contained file. No build, no server: `file://` must be enough.
- No motor. Do not copy `template/`, do not read from `packages/`, do not write a
  `manifest.json`, do not create anything under `games/`. A `<canvas>`, a
  `requestAnimationFrame` loop and a pointer handler are the whole scaffolding.
- No ceremony: no intro, no CTA, no end screen, no sfx, no icon, no FR/EN copy,
  no catalogue entry, no `TODO.md` line.
- Keep the tunable numbers as plain `var`s at the top of the file, and print
  debug text onto the canvas rather than building a panel.
- It may be ugly. Placeholder colours, no juice. What has to be right is how the
  mechanic feels under a finger.
- English in the file, like everywhere else in the repo.

**Nothing here ships.** No target builds this folder, and no page in it is
allowed to become the source of a game: converting a validated idea means
writing the four sources in `games/<slug>/` and porting the gameplay functions
into the `Game` module. See `CLAUDE.md`, *Prototypes — a raw page, outside the
motor*.

Pages stay here after conversion, as the record of where an idea came from.
