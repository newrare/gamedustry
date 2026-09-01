# tools/publish

The publishing scripts, one per destination — see
[docs/INDUSTRIALIZATION.md](../../docs/INDUSTRIALIZATION.md):

| script            | phase | what it does                                                                           |
| ----------------- | ----- | -------------------------------------------------------------------------------------- |
| `deploy-itch.mjs` | 4     | builds `dist/itch/<slug>/`, then `butler push` to `html5-dev`, or the channel you name |
| `store-meta.mjs`  | 4     | the itch (and later store) page copy, generated from the manifest                      |
| `gen-native.mjs`  | 8     | manifest → Capacitor project under `native/<slug>/`                                    |

```bash
node tools/publish/deploy-itch.mjs --game=vipera --dry-run   # print the command
node tools/publish/deploy-itch.mjs --game=vipera             # → html5-dev
node tools/publish/deploy-itch.mjs --game=vipera --channel=html5
node tools/publish/store-meta.mjs --all --out=dist/meta
```

Two things neither script will do. **butler cannot edit an itch page** — title,
description, tags, screenshots and the embed size have no public API, so
`store-meta.mjs` prints them and a human pastes them, once per game. And
**nothing here deploys the site**: `tools/build/build-site.mjs` only assembles
`dist/site/`, and Vercel does the deploying, from the repo.

`butler` itself is not vendored: install it from
<https://itch.io/docs/butler/> and run `butler login` once, or set
`BUTLER_API_KEY` in the environment, which is what CI does.
