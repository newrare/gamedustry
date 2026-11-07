# three.js, vendored for the lab

`three@0.170.0` from the npm registry (MIT, see `LICENSE`): `build/three.module.min.js`
and the closure of `examples/jsm/` the lab pages import — the GLTF loader, the orbit
controls and the post-processing passes (GTAO, bloom, output) and the glTF exporter. Copied as published, paths
kept, so the addons' relative imports resolve.

Lab pages load it through an import map (`"three"` and `"three/addons/"`), which is
why a page using it must be served over HTTP (`make lab`), not opened over
`file://`. Nothing under `games/` may import it: a game embeds what it ships.
