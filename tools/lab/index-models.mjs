#!/usr/bin/env node
/**
 * tools/lab/index-models.mjs — the 3D model packs read back into
 * assets/model/index.json, which lab/models.html lists (a page cannot list a
 * folder).
 *
 *   node tools/lab/index-models.mjs        (or: make models)
 *
 * Every folder of assets/model/ is a pack; assets/model/sources.tsv says where
 * it comes from and under which licence. Every .gltf / .glb in it is a model:
 * its triangles and vertices, its size (the bounding box of its meshes, with
 * the nodes' own translation and scale) and a category read off its name — the
 * part before the first `_` or `-` (building_A → building, car_taxi → car).
 *
 * Like assets/audio/sfx/index.json, the index is an input and it is committed:
 * run this when a pack is added or changed. The models made in code are not on
 * disk and not in it: lab/models/library.js lists them itself.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const DIR = path.join(ROOT, "assets/model");

function sources() {
  const file = path.join(DIR, "sources.tsv");
  if (!fs.existsSync(file)) return {};
  const [head, ...rows] = fs.readFileSync(file, "utf8").trim().split("\n").map((l) => l.split("\t"));
  const out = {};
  for (const r of rows) out[r[0]] = Object.fromEntries(head.map((h, i) => [h, r[i] || ""]));
  return out;
}

// the JSON half and the binary half of a .gltf (external .bin) or a .glb
function readGltf(file) {
  if (file.endsWith(".glb")) {
    const b = fs.readFileSync(file);
    const jsonLen = b.readUInt32LE(12);
    const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString("utf8"));
    return { json };
  }
  return { json: JSON.parse(fs.readFileSync(file, "utf8")) };
}

function stats(json) {
  let tris = 0, verts = 0;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const meshNodes = (json.nodes || []).filter((n) => n.mesh !== undefined);
  for (const node of meshNodes) {
    const t = node.translation || [0, 0, 0], s = node.scale || [1, 1, 1];
    for (const prim of json.meshes[node.mesh].primitives) {
      const pos = json.accessors[prim.attributes.POSITION];
      verts += pos.count;
      tris += (prim.indices !== undefined ? json.accessors[prim.indices].count : pos.count) / 3;
      if (pos.min && pos.max) for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], pos.min[k] * s[k] + t[k]);
        max[k] = Math.max(max[k], pos.max[k] * s[k] + t[k]);
      }
    }
  }
  const size = min[0] === Infinity ? [0, 0, 0] : max.map((v, k) => +(v - min[k]).toFixed(3));
  return { tris: Math.round(tris), verts, size, materials: (json.materials || []).length, textures: (json.images || []).map((i) => i.uri || "(embedded)") };
}

const src = sources();
const packs = [];
for (const pack of fs.readdirSync(DIR).sort()) {
  const dir = path.join(DIR, pack);
  if (!fs.statSync(dir).isDirectory()) continue;
  const models = [];
  for (const f of fs.readdirSync(dir).sort()) {
    if (!/\.(gltf|glb)$/.test(f)) continue;
    const name = f.replace(/\.(gltf|glb)$/, "");
    const { json } = readGltf(path.join(dir, f));
    models.push({ name, file: pack + "/" + f, category: name.split(/[_-]/)[0], ...stats(json) });
  }
  const meta = src[pack] || {};
  packs.push({ pack, title: meta.pack || pack, author: meta.author || "", licence: meta.licence || "unknown", url: meta.url || "", notes: meta.notes || "", models });
}
fs.writeFileSync(path.join(DIR, "index.json"), JSON.stringify({ packs }, null, 1) + "\n");
console.log(packs.map((p) => `${p.pack}: ${p.models.length} models, ${p.licence}`).join("\n"));
