# tools/publish

Nothing here yet. This is where the publishing scripts land, one per
destination — see [docs/INDUSTRIALIZATION.md](../../docs/INDUSTRIALIZATION.md):

| script            | phase | what it does                                    |
| ----------------- | ----- | ----------------------------------------------- |
| `deploy-itch.mjs` | 4     | wraps `butler push dist/itch/<slug> newrare/<slug>:html5` |
| `store-meta.mjs`  | 4     | itch and store page copy, generated from the manifest     |
| `gen-native.mjs`  | 8     | manifest → Capacitor project under `native/<slug>/`       |

`tools/build/build-site.mjs` is not here on purpose: it only assembles
`dist/site/`. Vercel does the deploying, from the repo.
