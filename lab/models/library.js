/* ===========================================================================
   lab/models/library.js — the 3D objects made in code, one list for every page.

   A kit downloaded off the web is a folder of files (assets/model/<pack>/,
   listed by assets/model/index.json). What the kits have not got is made here,
   in code, so it can be seeded, re-proportioned and re-coloured — and it lives
   in ONE module so the look bench (lowpoly-look.html), the model catalogue
   (models.html) and whatever page comes next build the same tree.

   Every ITEM is { id, name, category, biome, tags, notes, build(ctx, opts) }:
     - id is `<category>-<descriptor>`, the sfx library's rule: the category
       first because it is what a list groups by;
     - biome says where it belongs ("city", "park", "forest"…), "any" when it
       belongs everywhere — a forest set is a biome of this list, not a new file;
     - build returns an Object3D standing on y = 0, centred on x / z, in the
       kit's units (a road tile is 2 x 2, a car about 1 long). A house or a
       building faces +z, like the kit's; the dozer drives along +x.
   ctx is what the page lends: mesh(geo, hex, opts) makes a mesh in that page's
   materials (painted with the palette texture, or flat), glow(key) the
   emissive material of a light source the page drives, rnd() its seeded random.

   Colours are written as hand-picked hexes, and PAL says which swatch of the
   kit's palette texture (citybits_texture.png, 8 x 4 vertical gradients) each
   one stands for: paint() points the geometry's UVs into that swatch, top to
   bottom, so a code-made tree carries the same gradient as a kit building.

   No build step: ES module, three.js through the page's import map.
   =========================================================================== */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const TAU = Math.PI * 2;

// hand-picked colour -> [column, row, height] of its swatch in the palette texture
export const PAL = {
  0x2f7a4a: [3, 2, 0.25], 0x2d6e48: [3, 2, 0.5], 0x3b8a4f: [2, 2, 0.45], 0x4a9a5c: [2, 2, 0.25],
  0x6aa84f: [0, 2, 0.45], 0x7db552: [0, 2, 0.3], 0x5c9c48: [2, 2, 0.35], 0x8cbf5a: [0, 2, 0.15],
  0x7a5236: [6, 0, 0.6], 0x9a948a: [6, 1, 0.3], 0xa9a297: [6, 1, 0.12], 0x8c877f: [7, 1, 0.45], 0xb5aea2: [6, 1, 0.02],
  0xd9d2c4: [1, 0, 0.6], 0xc9ced4: [1, 0, 0.8], 0x55595f: [3, 0, 0.5], 0x4c5a48: [3, 2, 0.85],
  0xdcc8a0: [5, 1, 0.2], 0xd8c49a: [5, 1, 0.25], 0x5d5a48: [7, 1, 0.8], 0x6b4a33: [6, 0, 0.9],
  0x4fa9cc: [0, 1, 0.55], 0xe7e1d5: [1, 0, 0.35], 0xb9b3a8: [2, 0, 0.15], 0x8e8a83: [2, 0, 0.6], 0xd2ccc1: [1, 0, 0.5],
  0x2a2a2e: [4, 0, 0.45], 0xf2b22a: [3, 1, 0.12], 0xe0a020: [3, 1, 0.35], 0x37475a: [2, 1, 0.75], 0x333333: [4, 0, 0.3],
  0x8a8f96: [2, 0, 0.45], 0x555a60: [3, 0, 0.6], 0x1d1d1d: [4, 0, 0.7], 0xece2cc: [5, 2, 0.05],
  // the house kit (C below): walls, roofs, trims, glass
  0xf1e1d2: [5, 2, 0.3], 0xe0b98a: [5, 1, 0.3], 0xe6eaec: [1, 0, 0.3], 0xbd7a59: [5, 0, 0.3], 0xa7654c: [6, 0, 0.3],
  0x82cbe7: [0, 1, 0.12], 0xf5cb60: [3, 1, 0.12], 0xbcbcbb: [4, 2, 0.3], 0xec7262: [7, 2, 0.12], 0xa09992: [6, 1, 0.3],
  0xdf4043: [4, 1, 0.3], 0xd76f34: [7, 0, 0.3], 0xdf6359: [7, 2, 0.3], 0x577893: [2, 1, 0.3], 0x52595d: [3, 0, 0.3],
  0x00847d: [1, 2, 0.3], 0x77675c: [7, 1, 0.3], 0x009a58: [2, 2, 0.3], 0xf7f8f9: [1, 0, 0.08], 0x404040: [4, 0, 0.3],
  0x8c4b38: [6, 0, 0.7], 0x9b5a45: [6, 0, 0.5], 0x2799d3: [1, 1, 0.3], 0x215a9e: [1, 1, 0.7], 0x257ebc: [1, 1, 0.5]
};

export function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// a box with every edge chamfered: the edge catches the light, which is the
// first thing that separates a modelled object from a primitive
export function bevelBox(w, h, d, r) {
  r = Math.min(r, 0.3 * Math.min(w, h, d));
  const hw = w / 2 - r, hd = d / 2 - r, c = Math.min(r * 0.9, 0.45 * Math.min(hw, hd));
  const sh = new THREE.Shape();
  sh.moveTo(-hw + c, -hd); sh.lineTo(hw - c, -hd); sh.lineTo(hw, -hd + c); sh.lineTo(hw, hd - c);
  sh.lineTo(hw - c, hd); sh.lineTo(-hw + c, hd); sh.lineTo(-hw, hd - c); sh.lineTo(-hw, -hd + c); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: h - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r,
    bevelSegments: 1, steps: 1, curveSegments: 1 });
  g.rotateX(-Math.PI / 2); g.translate(0, r - h / 2, 0);
  return g;
}

// moves every vertex by a hash of where it stands, so the copies of one vertex
// along a seam move together and no crack opens. Halved: the code-made shapes
// stay regular, the way the kit's are.
export const WOBBLE = 0.5;
export function jitter(g, amt, seed) {
  amt *= WOBBLE;
  const p = g.attributes.position;
  const h = (x, y, z, k) => { const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + (seed + k) * 19.19) * 43758.5453; return (n - Math.floor(n)) * 2 - 1; };
  for (let i = 0; i < p.count; i++) {
    const x = +p.getX(i).toFixed(4), y = +p.getY(i).toFixed(4), z = +p.getZ(i).toFixed(4);
    p.setXYZ(i, x + amt * h(x, y, z, 1), y + amt * h(x, y, z, 2), z + amt * h(x, y, z, 3));
  }
  g.computeVertexNormals();
  // a cone's tip sits in triangles of no area: its normal comes out zero, and a
  // zero normal is a NaN in an occlusion pass, which a blur spreads into a box
  const nr = g.attributes.normal;
  for (let i = 0; i < nr.count; i++) if (!(Math.hypot(nr.getX(i), nr.getY(i), nr.getZ(i)) > 0.01)) nr.setXYZ(i, 0, 1, 0);
  return g;
}

// the geometry's UVs pointed into its colour's swatch, top of the object at
// the light end of the gradient
export function paint(geo, hex, spread = 0.3) {
  const pal = PAL[hex];
  if (!pal) return geo;
  const [col, row, v] = pal, p = geo.attributes.position;
  geo.computeBoundingBox();
  const y0 = geo.boundingBox.min.y, y1 = geo.boundingBox.max.y, span = Math.max(1e-4, y1 - y0);
  const clamp = (x) => Math.min(0.97, Math.max(0.03, x));
  const vt = clamp(v - spread), vb = clamp(v + spread), u = (col + 0.38) / 8;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const t = (y1 - p.getY(i)) / span; uv[2 * i] = u; uv[2 * i + 1] = (row + vt + (vb - vt) * t) / 4; }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

export const puffGeometry = () => paint(new THREE.IcosahedronGeometry(1, 0), 0xece2cc);

const rr = (ctx, a, b) => a + (b - a) * ctx.rnd();
const pick = (ctx, arr) => arr[Math.floor(ctx.rnd() * arr.length)];

// =============================================================================
// THE HOUSE KIT — what every house and building is assembled from
// =============================================================================
// The trees and the dozer read as one family because they share three rules: a
// chamfer on every edge, parts that stay regular, and one palette texture. A
// building keeps them and adds the kit's own density: a plinth, a frame and a
// sill on every window, a band at every floor, courses on a roof, a cornice.
// Its parts are merged by colour once it is built, so a building of a thousand
// triangles is still a handful of draw calls.

// the house kit's colours, each the swatch of the palette texture it samples (PAL)
export const C = {
  cream: 0xf1e1d2, sand: 0xe0b98a, white: 0xe6eaec, terra: 0xbd7a59, brick: 0xa7654c,
  sky: 0x82cbe7, yellow: 0xf5cb60, grey: 0xbcbcbb, coral: 0xec7262, stone: 0xa09992,
  red: 0xdf4043, orange: 0xd76f34, salmon: 0xdf6359, slate: 0x577893, dark: 0x52595d,
  teal: 0x00847d, brown: 0x77675c, moss: 0x009a58, trim: 0xf7f8f9, ink: 0x404040,
  wood: 0x8c4b38, log: 0x9b5a45, glass: 0x2799d3, glassDark: 0x215a9e, blue: 0x257ebc
};

const EDGE = 0.025;                               // the chamfer of a wall or a slab
const BAR = 0.03;                                 // a window frame's bar
const PLINTH = 0.07;                              // the stone course under every wall
const GLASS = { roughness: 0.2, metalness: 0.15 };

// A building is written with its front at +x (face 0) and baked turned a
// quarter, so it comes out facing +z, the way the kit's buildings and cars do:
// a code-made building stands in for a kit one without being turned.
class Shell {
  constructor(ctx) { this.ctx = ctx; this.bins = new Map(); this.m = new THREE.Matrix4().makeRotationY(-Math.PI / 2); }
  // run fn with the origin moved to (x, y, z) and turned by ry about y
  at(x, y, z, ry, fn) {
    const keep = this.m;
    this.m = keep.clone().multiply(new THREE.Matrix4().makeRotationY(ry || 0).setPosition(x, y, z));
    fn(); this.m = keep;
  }
  // a geometry in the current frame, binned by colour
  add(g, hex, opts) {
    if (g.index) g = g.toNonIndexed();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k);
    g.clearGroups(); g.applyMatrix4(this.m);
    const key = hex + "|" + JSON.stringify(opts || {});
    if (!this.bins.has(key)) this.bins.set(key, { hex, opts, geos: [] });
    this.bins.get(key).geos.push(g);
  }
  // a block standing on y, centred on x / z; r = 0 is a plain box, for the small parts
  box(w, h, d, x, y, z, hex, opts, r = EDGE) {
    const g = r > 0 ? bevelBox(w, h, d, r) : new THREE.BoxGeometry(w, h, d);
    g.translate(x, y + h / 2, z); this.add(g, hex, opts);
  }
  cyl(rt, rb, h, seg, x, y, z, hex, opts) {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(x, y + h / 2, z); this.add(g, hex, opts);
  }
  // a 2D outline (x, y) pushed `depth` along z, centred on z
  prism(pts, depth, x, y, z, hex, opts) {
    const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 1 });
    g.translate(x, y, z - depth / 2); this.add(g, hex, opts);
  }
  // run fn on one face of a block w (x) by d (z): 0 front (+x), 1 right (+z), 2 back, 3 left.
  // Inside, x runs along the face as seen from outside, z points out of it, y up;
  // fn gets the face's width.
  face(side, w, d, fn, cx = 0, cz = 0) {
    const rot = [Math.PI / 2, 0, -Math.PI / 2, Math.PI][side], half = side % 2 ? d / 2 : w / 2;
    this.at(cx + Math.sin(rot) * half, 0, cz + Math.cos(rot) * half, rot, () => fn(side % 2 ? w : d));
  }
  // n windows spread evenly over a face, centred at height y; skip lists the gaps
  row(side, w, d, n, y, ww, wh, o = {}, skip = [], cx = 0, cz = 0) {
    this.face(side, w, d, (span) => {
      const used = o.span || span;
      for (let i = 0; i < n; i++) if (!skip.includes(i)) this.win(((i + 0.5) / n - 0.5) * used, y, ww, wh, o);
    }, cx, cz);
  }
  // ---- on a face (z out of the wall) -------------------------------------------------
  // a window centred at (u, y): glass, a frame proud of it, a sill, and on request a
  // cross, shutters and a lintel
  win(u, y, w, h, o = {}) {
    const f = o.frame || C.trim, t = BAR, b = y - h / 2;
    this.box(w, h, 0.02, u, b, 0, o.glass || C.glass, GLASS, 0);
    this.box(w + 2 * t, t, 0.05, u, y + h / 2, 0, f, null, 0);
    this.box(t, h, 0.05, u - w / 2 - t / 2, b, 0, f, null, 0);
    this.box(t, h, 0.05, u + w / 2 + t / 2, b, 0, f, null, 0);
    if (o.cross) {
      this.box(t * 0.6, h, 0.035, u, b, 0, f, null, 0);
      this.box(w, t * 0.6, 0.035, u, b + h * 0.6, 0, f, null, 0);
    }
    this.box(w + 2 * t + 0.05, 0.03, 0.08, u, b - 0.03, 0.02, o.sill || f, null, 0);
    if (o.shutters) for (const s of [-1, 1]) {
      const sw = w * 0.5;
      this.box(sw, h + 0.02, 0.02, u + s * (w / 2 + t + sw / 2 + 0.006), b - 0.01, 0.012, o.shutters, null, 0.005);
      this.box(sw * 0.7, 0.012, 0.01, u + s * (w / 2 + t + sw / 2 + 0.006), b + h * 0.5, 0.025, o.shutters, null, 0);
    }
    if (o.lintel) {
      this.box(w + 2 * t + 0.06, 0.05, 0.05, u, y + h / 2 + t, 0.008, o.lintel, null, 0);
      if (o.key) this.box(0.05, 0.07, 0.06, u, y + h / 2 + t - 0.01, 0.012, o.lintel, null, 0);
    }
  }
  // a door standing at the face's u, its threshold at o.y, with a step for every
  // 7 cm between o.base (the ground) and it
  door(u, w, h, o = {}) {
    const t = BAR, f = o.frame || C.trim, y = o.y === undefined ? PLINTH : o.y, leaf = o.leaf || C.wood, base = o.base || 0;
    if (o.glassy) {
      this.box(w, h, 0.02, u, y, 0, C.glass, GLASS, 0);
      this.box(t * 0.7, h, 0.035, u, y, 0, f, null, 0);
      this.box(w, t, 0.035, u, y + h * 0.48, 0, f, null, 0);
    } else {
      this.box(w, h, 0.03, u, y, 0, leaf, null, 0.006);
      this.box(w * 0.62, h * 0.32, 0.012, u, y + h * 0.1, 0.018, leaf, null, 0);
      this.box(w * 0.62, h * 0.32, 0.012, u, y + h * 0.54, 0.018, leaf, null, 0);
      this.box(0.025, 0.025, 0.025, u + w * 0.32, y + h * 0.45, 0.025, C.yellow, null, 0);
    }
    this.box(w + 2 * t, t, 0.05, u, y + h, 0, f, null, 0);
    this.box(t, h, 0.05, u - w / 2 - t / 2, y, 0, f, null, 0);
    this.box(t, h, 0.05, u + w / 2 + t / 2, y, 0, f, null, 0);
    const rise = y - base, n = Math.max(1, Math.round(rise / 0.07));
    if (rise > 0.01) for (let i = 0; i < n; i++) this.box(w + 0.16, rise * (n - i) / n, 0.1, u, base, 0.05 + i * 0.1, o.step || C.stone, null, 0.01);
    if (o.canopy) {
      this.box(w + 0.24, 0.035, 0.22, u, y + h + t + 0.04, 0.11, o.canopy, null, 0.01);
      for (const s of [-1, 1]) this.box(0.025, 0.07, 0.14, u + s * (w / 2 + 0.06), y + h + t - 0.03, 0.07, f, null, 0);
    }
  }
  // a round window, a disc of glass behind a cross, at (u, y)
  oculus(u, y, r, f = C.trim) {
    const g = new THREE.CylinderGeometry(r + 0.03, r + 0.03, 0.03, 10); g.rotateX(Math.PI / 2); g.translate(u, y, 0); this.add(g, f);
    const gl = new THREE.CylinderGeometry(r, r, 0.02, 10); gl.rotateX(Math.PI / 2); gl.translate(u, y, 0.012); this.add(gl, C.glass, GLASS);
    this.box(2 * r, 0.015, 0.012, u, y - 0.0075, 0.024, f, null, 0);
    this.box(0.015, 2 * r, 0.012, u, y - r, 0.024, f, null, 0);
  }
  // ---- roofs (in the block's frame, eaves at y) ------------------------------------
  // two sloping slabs with courses of tiles, the gable walls filled in `wall`;
  // the ridge runs along z over a block w wide (x) and d deep (z)
  gable(w, d, h, y, roof, wall, o = {}) {
    const ov = o.over === undefined ? 0.08 : o.over, ovd = o.overD === undefined ? ov : o.overD;
    const t = 0.05, a = Math.atan2(h, w / 2), run = w / 2 + ov, len = run / Math.cos(a), dd = d + 2 * ovd;
    const sn = Math.sin(a), cs = Math.cos(a), n = o.rows || 4;
    if (wall) this.prism([[-w / 2, 0], [w / 2, 0], [0, h]], d, 0, y, 0, wall);
    for (const s of [-1, 1]) {
      const g = bevelBox(len, t, dd, 0.012);
      g.rotateZ(-s * a); g.translate(s * run / 2 + s * sn * t / 2, y + h - run * Math.tan(a) / 2 + cs * t / 2, 0);
      this.add(g, roof);
      for (let i = 1; i < n; i++) {
        const f = i / n, tg = new THREE.BoxGeometry(0.03, 0.02, dd);
        tg.rotateZ(-s * a); tg.translate(s * run * f + s * sn * (t + 0.008), y + h - run * f * Math.tan(a) + cs * (t + 0.008), 0);
        this.add(tg, roof);
      }
    }
    this.box(0.08, t / cs + 0.03, dd + 0.02, 0, y + h - 0.01, 0, o.ridge || roof, null, 0.012);
  }
  // a pyramid on a fascia, the eaves all round
  hip(w, d, h, y, roof, o = {}) {
    const ov = o.over === undefined ? 0.08 : o.over;
    this.box(w + 2 * ov, 0.05, d + 2 * ov, 0, y, 0, o.fascia || roof, null, 0.015);
    const g = new THREE.ConeGeometry(Math.SQRT1_2, h, 4, 1);
    g.rotateY(Math.PI / 4); g.scale(w + 2 * ov, 1, d + 2 * ov); g.translate(0, y + 0.05 + h / 2, 0);
    this.add(g, roof);
  }
  // a roof deck behind a parapet, a cornice under it
  flat(w, d, y, o = {}) {
    const c = o.color || C.trim, p = o.parapet === undefined ? 0.1 : o.parapet, t = 0.05;
    this.box(w + 0.08, 0.05, d + 0.08, 0, y - 0.05, 0, c, null, 0.015);
    this.box(w - 0.02, 0.03, d - 0.02, 0, y, 0, o.deck || C.dark, null, 0);
    if (p > 0) {
      for (const s of [-1, 1]) {
        this.box(w + 0.04, p, t, 0, y, s * (d / 2 - t / 2 + 0.02), c, null, 0.012);
        this.box(t, p, d - 2 * t + 0.04, s * (w / 2 - t / 2 + 0.02), y, 0, c, null, 0.012);
      }
    }
  }
  // a row of small blocks under a cornice, along a face
  dentils(span, y, n, hex) { for (let i = 0; i < n; i++) this.box(0.03, 0.035, 0.03, ((i + 0.5) / n - 0.5) * span, y, 0.015, hex, null, 0); }
  chimney(x, y, z, h, hex) {
    this.box(0.16, h, 0.16, x, y, z, hex, null, 0.015);
    this.box(0.21, 0.04, 0.21, x, y + h, z, hex, null, 0.01);
    this.cyl(0.03, 0.03, 0.07, 6, x + 0.03, y + h + 0.04, z, C.terra);
  }
  // ---- what stands on a flat roof --------------------------------------------------
  ac(x, y, z) {
    this.box(0.22, 0.13, 0.18, x, y, z, C.grey, null, 0.015);
    this.cyl(0.065, 0.065, 0.02, 8, x, y + 0.13, z, C.ink);
  }
  tank(x, y, z) {
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this.box(0.02, 0.16, 0.02, x + a * 0.08, y, z + b * 0.08, C.ink, null, 0);
    this.cyl(0.13, 0.13, 0.22, 8, x, y + 0.16, z, C.log);
    const g = new THREE.ConeGeometry(0.15, 0.09, 8); g.translate(x, y + 0.425, z); this.add(g, C.dark);
  }
  railing(len, y, z, hex, n = Math.max(3, Math.round(len / 0.1))) {
    for (let i = 0; i <= n; i++) this.box(0.02, 0.15, 0.02, (i / n - 0.5) * len, y, z, hex, null, 0);
    this.box(len + 0.03, 0.025, 0.035, 0, y + 0.15, z, hex, null, 0);
  }
  done() {
    const g = new THREE.Group();
    for (const b of this.bins.values()) g.add(this.ctx.mesh(mergeGeometries(b.geos), b.hex, b.opts));
    return g;
  }
}

// a block on its plinth
function body(k, w, h, d, wall, x = 0, z = 0, y = 0) {
  k.box(w + 0.04, PLINTH, d + 0.04, x, y, z, C.stone, null, 0.015);
  k.box(w, h, d, x, y, z, wall);
}
// a band round a block at height y
const band = (k, w, d, y, hex, x = 0, z = 0) => k.box(w + 0.03, 0.04, d + 0.03, x, y - 0.02, z, hex, null, 0.012);

const HOUSE = { category: "house", biome: "city", tags: ["house", "building"] };
const BUILDING = { category: "building", biome: "city", tags: ["building"] };

// =============================================================================
// TEN HOUSES — written front at +x (face 0), the door on it; out facing +z
// =============================================================================
const HOUSES = [
  {
    ...HOUSE, id: "house-cottage", name: "Cottage",
    notes: "One storey under a tiled gable, shutters, a canopy over the door, a chimney.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.cream, C.white, C.sand, C.sky]);
      const roof = pick(ctx, [C.red, C.orange, C.slate, C.salmon]), sh = pick(ctx, [C.teal, C.moss, C.slate, C.wood]);
      const W = 1.0, D = 1.3, H = 0.62;
      body(k, W, H, D, wall);
      k.face(0, W, D, () => { k.door(-0.3, 0.2, 0.34, { canopy: roof }); k.win(0.28, 0.36, 0.24, 0.22, { shutters: sh, cross: true }); });
      k.face(2, W, D, () => { k.win(-0.3, 0.36, 0.2, 0.2, { shutters: sh, cross: true }); k.win(0.3, 0.36, 0.2, 0.2, { shutters: sh, cross: true }); });
      for (const s of [1, 3]) k.face(s, W, D, () => { k.win(0, 0.36, 0.2, 0.2, { shutters: sh, cross: true }); k.oculus(0, H + 0.17, 0.06); });
      k.gable(W, D, 0.5, H, roof, wall, { rows: 4 });
      k.chimney(-0.2, H, D * 0.28, 0.52, C.brick);
      return k.done();
    }
  },
  {
    ...HOUSE, id: "house-narrow", name: "Narrow house",
    notes: "Two storeys with the gable to the street and a round window in it.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.white, C.cream, C.sky, C.yellow]), roof = pick(ctx, [C.slate, C.dark, C.red, C.teal]);
      const W = 1.25, D = 0.9, H = 1.0;
      body(k, W, H, D, wall);
      band(k, W, D, 0.52, C.trim);
      k.face(0, W, D, () => {
        k.door(-0.2, 0.2, 0.34, { canopy: roof, leaf: roof });
        k.win(0.2, 0.33, 0.2, 0.24, { cross: true });
        k.win(-0.2, 0.78, 0.18, 0.24, { cross: true }); k.win(0.2, 0.78, 0.18, 0.24, { cross: true });
        k.oculus(0, H + 0.2, 0.08);
      });
      for (const s of [1, 3]) { k.row(s, W, D, 2, 0.33, 0.18, 0.22, { cross: true }); k.row(s, W, D, 2, 0.78, 0.18, 0.22, { cross: true }); }
      k.face(2, W, D, () => { k.win(0, 0.33, 0.2, 0.22, { cross: true }); k.win(0, 0.78, 0.2, 0.22, { cross: true }); });
      k.at(0, 0, 0, Math.PI / 2, () => k.gable(D, W, 0.55, H, roof, wall, { rows: 5 }));
      k.chimney(-0.3, H, 0.22, 0.5, C.brick);
      return k.done();
    }
  },
  {
    ...HOUSE, id: "house-bungalow", name: "Bungalow",
    notes: "Wide and low under a hipped roof, a porch on two posts.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.sand, C.cream, C.sky, C.white]), roof = pick(ctx, [C.orange, C.red, C.brown, C.slate]);
      const W = 1.1, D = 1.6, H = 0.56;
      body(k, W, H, D, wall);
      k.face(0, W, D, () => {
        k.door(0, 0.22, 0.34, { leaf: roof });
        k.win(-0.5, 0.33, 0.32, 0.24, { cross: true }); k.win(0.5, 0.33, 0.32, 0.24, { cross: true });
        k.box(1.0, PLINTH, 0.34, 0, 0, 0.17, C.wood, null, 0.012);            // the porch deck
        for (const s of [-1, 1]) k.box(0.05, H - PLINTH, 0.05, s * 0.46, PLINTH, 0.3, C.trim, null, 0.01);
        k.box(1.08, 0.04, 0.38, 0, H - 0.02, 0.17, roof, null, 0.012);
      });
      for (const s of [1, 3]) k.row(s, W, D, 2, 0.33, 0.2, 0.22, { cross: true });
      k.row(2, W, D, 3, 0.33, 0.2, 0.22, { cross: true });
      k.hip(W, D, 0.42, H, roof);
      k.chimney(-0.15, H, 0.4, 0.5, C.brick);
      return k.done();
    }
  },
  {
    ...HOUSE, id: "house-cabin", name: "Log cabin",
    notes: "Walls of stacked logs whose ends cross at the corners, a stone chimney up the side.",
    build(ctx) {
      const k = new Shell(ctx), roof = pick(ctx, [C.moss, C.dark, C.brown, C.slate]);
      const W = 1.0, D = 1.2, rows = 6, L = 0.1, H = PLINTH + rows * L;
      k.box(W + 0.06, PLINTH, D + 0.06, 0, 0, 0, C.stone, null, 0.015);
      for (let i = 0; i < rows; i++) {
        const y = PLINTH + i * L, log = i % 2 ? C.log : C.wood;
        k.box(W, L, D, 0, y, 0, log, null, 0.03);
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.box(0.07, L * 0.85, 0.07, a * (W / 2 + 0.02), y, b * (D / 2 + 0.02), log, null, 0.015);
      }
      const o = { frame: C.sand, cross: true };
      k.face(0, W, D, () => { k.door(0.3, 0.2, 0.34, { frame: C.sand, leaf: C.wood }); k.win(-0.25, 0.4, 0.2, 0.2, o); });
      k.face(1, W, D, () => k.win(0, 0.4, 0.2, 0.2, o));
      k.row(2, W, D, 2, 0.4, 0.18, 0.2, o);
      k.gable(W, D, 0.55, H, roof, C.log, { rows: 5, over: 0.12, overD: 0.05 });
      k.box(0.3, 0.36, 0.2, -0.15, 0, -D / 2 - 0.1, C.stone, null, 0.02);     // the stone chimney, outside
      k.box(0.18, 0.95, 0.15, -0.15, 0.36, -D / 2 - 0.09, C.stone, null, 0.015);
      k.box(0.22, 0.04, 0.19, -0.15, 1.31, -D / 2 - 0.09, C.stone, null, 0.01);
      return k.done();
    }
  },
  {
    ...HOUSE, id: "house-townhouse", name: "Townhouse",
    notes: "Three narrow storeys: a stoop, a bay window, quoins and a dentilled cornice.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.brick, C.terra, C.coral, C.sand, C.sky]), leaf = pick(ctx, [C.teal, C.dark, C.red, C.slate]);
      const W = 1.0, D = 0.75, H = 1.46;
      body(k, W, H, D, wall);
      band(k, W, D, 0.5, C.trim); band(k, W, D, 0.98, C.trim);
      k.face(0, W, D, () => {
        k.door(-0.18, 0.18, 0.32, { y: 0.21, leaf, canopy: C.trim });
        k.win(0.17, 0.4, 0.2, 0.24, { lintel: C.trim, key: true });
        k.box(0.42, 0.05, 0.18, 0, 0.5, 0.09, C.trim, null, 0.012);          // the bay window
        k.box(0.36, 0.42, 0.16, 0, 0.55, 0.08, wall, null, 0.012);
        k.at(0, 0, 0.16, 0, () => k.win(0, 0.76, 0.24, 0.26, { cross: true }));
        k.box(0.44, 0.04, 0.2, 0, 0.97, 0.09, C.trim, null, 0.012);
        k.win(-0.17, 1.22, 0.18, 0.24, { lintel: C.trim, key: true }); k.win(0.17, 1.22, 0.18, 0.24, { lintel: C.trim, key: true });
        for (let i = 0; i < 8; i++) for (const s of [-1, 1]) k.box(i % 2 ? 0.06 : 0.09, 0.1, 0.02, s * (D / 2 - (i % 2 ? 0.03 : 0.045)), PLINTH + i * 0.17, 0.01, C.trim, null, 0);
        k.dentils(D, H - 0.09, 9, C.trim);
      });
      k.row(2, W, D, 2, 0.32, 0.18, 0.22, {}); k.row(2, W, D, 2, 0.76, 0.18, 0.22, {}); k.row(2, W, D, 2, 1.22, 0.18, 0.22, {});
      k.face(1, W, D, () => k.win(0, 1.22, 0.16, 0.2));
      k.flat(W, D, H, { color: C.trim });
      k.chimney(-0.3, H, -0.2, 0.25, wall);
      return k.done();
    }
  },
  {
    ...HOUSE, id: "house-farmhouse", name: "Farmhouse",
    notes: "An L of two gabled blocks and a lean-to porch along the front.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.yellow, C.white, C.sand, C.cream]), roof = pick(ctx, [C.red, C.brown, C.salmon, C.slate]);
      const W = 0.9, D = 1.4, H = 0.8, X = 0.2, W2 = 0.75, D2 = 0.55, H2 = 0.6, X2 = -0.48, Z2 = -0.38;
      body(k, W, H, D, wall, X);
      body(k, W2, H2, D2, wall, X2, Z2);
      k.face(0, W, D, () => {
        k.door(0, 0.2, 0.34, { leaf: C.wood });
        k.win(-0.42, 0.33, 0.2, 0.22, { cross: true }); k.win(0.42, 0.33, 0.2, 0.22, { cross: true });
        for (const u of [-0.42, 0, 0.42]) k.win(u, 0.66, 0.14, 0.12, {});
        k.box(1.2, PLINTH, 0.3, 0, 0, 0.15, C.wood, null, 0.012);
        for (const u of [-0.55, 0, 0.55]) k.box(0.045, 0.5, 0.045, u, PLINTH, 0.27, C.trim, null, 0.01);
        const g = bevelBox(1.28, 0.035, 0.34, 0.01); g.rotateX(0.3); g.translate(0, 0.6, 0.16); k.add(g, roof);
      }, X);
      for (const s of [1, 3]) k.face(s, W, D, () => { k.win(0, 0.33, 0.2, 0.22, { cross: true }); k.win(0, H + 0.15, 0.14, 0.14, {}); }, X);
      k.row(2, W2, D2, 1, 0.33, 0.2, 0.22, { cross: true }, [], X2, Z2);
      k.row(3, W2, D2, 2, 0.33, 0.18, 0.22, { cross: true }, [], X2, Z2);
      k.row(1, W2, D2, 1, 0.33, 0.18, 0.22, { cross: true, span: 0.3 }, [], X2, Z2);
      k.at(X, 0, 0, 0, () => k.gable(W, D, 0.5, H, roof, wall, { rows: 4 }));
      k.at(X2, 0, Z2, Math.PI / 2, () => k.gable(D2, W2, 0.36, H2, roof, wall, { rows: 3, overD: 0.04 }));
      k.chimney(X - 0.15, H, 0.45, 0.45, C.brick);
      return k.done();
    }
  },
  {
    ...HOUSE, id: "house-modern", name: "Modern house",
    notes: "Two flat-roofed boxes offset, a clad upper floor, wide glass and a glass rail on the terrace.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.white, C.grey, C.cream]), clad = pick(ctx, [C.wood, C.dark, C.log, C.slate]);
      const W = 1.2, D = 1.4, H = 0.5, W2 = 0.95, D2 = 0.95, X2 = -0.1, Z2 = 0.2, H2 = 0.45;
      body(k, W, H, D, wall);
      k.box(W + 0.1, 0.05, D + 0.1, 0, H, 0, C.dark, null, 0.012);
      k.box(W2, H2, D2, X2, H + 0.05, Z2, clad);
      k.box(W2 + 0.14, 0.05, D2 + 0.12, X2, H + 0.05 + H2, Z2, C.dark, null, 0.012);
      const o = { frame: C.dark };
      k.face(0, W, D, () => { k.door(0.45, 0.2, 0.36, { frame: C.dark, leaf: C.dark }); k.win(-0.15, 0.3, 0.6, 0.34, o); });
      k.row(1, W, D, 1, 0.3, 0.5, 0.3, o); k.row(3, W, D, 2, 0.3, 0.3, 0.26, o); k.row(2, W, D, 2, 0.3, 0.3, 0.26, o);
      k.face(0, W2, D2, () => k.win(0, H + 0.27, 0.7, 0.2, o), X2, Z2);
      k.face(2, W2, D2, () => k.win(0, H + 0.27, 0.4, 0.2, o), X2, Z2);
      k.face(1, W2, D2, (span) => { for (let i = 0; i < 12; i++) k.box(0.025, H2 - 0.04, 0.02, ((i + 0.5) / 12 - 0.5) * span, H + 0.07, 0.01, clad, null, 0); }, X2, Z2);
      k.face(3, W2, D2, () => k.win(0, H + 0.27, 0.3, 0.2, o), X2, Z2);
      k.box(0.02, 0.16, 0.42, W / 2 - 0.03, H + 0.05, -0.48, C.glass, GLASS, 0);    // the glass rail of the terrace
      k.box(0.03, 0.02, 0.44, W / 2 - 0.03, H + 0.21, -0.48, C.dark, null, 0);
      k.box(0.42, 0.16, 0.02, 0.37, H + 0.05, -D / 2 + 0.03, C.glass, GLASS, 0);
      k.box(0.44, 0.02, 0.03, 0.37, H + 0.21, -D / 2 + 0.03, C.dark, null, 0);
      return k.done();
    }
  },
  {
    ...HOUSE, id: "house-chalet", name: "Chalet",
    notes: "A steep gable almost to the ground, a timber gable end with a balcony across it.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.cream, C.white, C.sand]), roof = pick(ctx, [C.dark, C.slate, C.red, C.moss]);
      const W = 1.2, D = 1.1, H = 0.38;
      body(k, W, H, D, wall);
      k.at(0, 0, 0, Math.PI / 2, () => k.gable(D, W, 0.85, H, roof, C.log, { rows: 6, over: 0.1 }));
      for (const s of [0, 2]) k.face(s, W, D, () => {
        if (s === 0) k.door(-0.22, 0.2, 0.34, { leaf: C.wood, frame: C.sand }); else k.win(-0.22, 0.24, 0.18, 0.18, { frame: C.sand, cross: true });
        k.win(0.22, 0.24, 0.18, 0.18, { frame: C.sand, cross: true });
        k.win(0, 0.76, 0.28, 0.28, { frame: C.sand, cross: true });
        k.box(D * 0.6, 0.04, 0.22, 0, 0.5, 0.11, C.wood, null, 0.01);
        k.railing(D * 0.6, 0.54, 0.2, C.wood, 6);
        for (const u of [-0.26, 0.26]) k.box(0.04, 0.1, 0.16, u, 0.4, 0.08, C.wood, null, 0);
      });
      for (const s of [1, 3]) k.row(s, W, D, 2, 0.22, 0.16, 0.14, { frame: C.sand });
      return k.done();
    }
  },
  {
    ...HOUSE, id: "house-turret", name: "Turret house",
    notes: "Two storeys and a round tower on the corner under a cone roof.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.coral, C.cream, C.sky, C.sand]), roof = pick(ctx, [C.slate, C.teal, C.dark, C.red]);
      const W = 1.0, D = 1.1, H = 1.0, tx = 0.42, tz = 0.5, r = 0.27, TH = 1.25;
      body(k, W, H, D, wall);
      band(k, W, D, 0.52, C.trim);
      k.face(0, W, D, () => {
        k.door(0.15, 0.2, 0.34, { canopy: roof, leaf: roof });
        k.win(0.15, 0.78, 0.2, 0.24, { cross: true });
      });
      k.face(1, W, D, () => { k.win(-0.22, 0.33, 0.18, 0.22, { cross: true }); k.win(-0.22, 0.78, 0.18, 0.22, { cross: true }); });
      k.row(3, W, D, 2, 0.33, 0.18, 0.22, { cross: true }); k.row(3, W, D, 2, 0.78, 0.18, 0.22, { cross: true });
      k.row(2, W, D, 2, 0.33, 0.2, 0.22, { cross: true }); k.row(2, W, D, 2, 0.78, 0.2, 0.22, { cross: true });
      k.gable(W, D, 0.5, H, roof, wall, { rows: 4 });
      k.cyl(r + 0.03, r + 0.03, PLINTH, 8, tx, 0, tz, C.stone);
      k.cyl(r, r, TH, 8, tx, 0, tz, wall);
      k.cyl(r + 0.02, r + 0.02, 0.04, 8, tx, 0.5, tz, C.trim);
      k.cyl(r + 0.04, r + 0.04, 0.05, 8, tx, TH, tz, C.trim);
      const cone = new THREE.ConeGeometry(r + 0.08, 0.62, 8); cone.translate(tx, TH + 0.05 + 0.31, tz); k.add(cone, roof);
      k.cyl(0.012, 0.012, 0.14, 4, tx, TH + 0.67, tz, C.ink);
      const ap = r * Math.cos(Math.PI / 8);
      for (const j of [0, 1, 2]) {
        const th = (j + 0.5) * Math.PI / 4;
        k.at(tx + ap * Math.sin(th), 0, tz + ap * Math.cos(th), th, () => { k.win(0, 0.33, 0.12, 0.2, {}); k.win(0, 0.8, 0.12, 0.2, {}); });
      }
      return k.done();
    }
  },
  {
    ...HOUSE, id: "house-stilts", name: "Stilt house",
    notes: "A clapboard house on a deck raised on posts, a railing and stairs down the side.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.sky, C.yellow, C.white, C.coral]), roof = pick(ctx, [C.salmon, C.teal, C.slate, C.orange]);
      const W = 1.3, D = 1.4, Y = 0.34, w = 0.85, d = 1.1, X = -0.2, H = 0.55;
      for (const a of [-0.55, 0.55]) for (const b of [-0.6, 0, 0.6]) k.box(0.07, Y, 0.07, a, 0, b, C.wood, null, 0.012);
      k.box(W, 0.06, D, 0, Y - 0.06, 0, C.log, null, 0.015);
      for (let i = 1; i < 14; i++) k.box(W - 0.02, 0.008, 0.012, 0, Y, (i / 14 - 0.5) * D, C.wood, null, 0);   // planks
      k.box(w, H, d, X, Y, 0, wall);
      for (let i = 1; i < 5; i++) k.box(w + 0.012, 0.012, d + 0.012, X, Y + i * 0.11, 0, wall, null, 0);   // clapboard
      k.face(0, w, d, () => {
        k.door(-0.2, 0.2, 0.34, { y: Y, base: Y, leaf: roof });
        k.win(0.25, Y + 0.3, 0.24, 0.2, { shutters: roof });
      }, X);
      k.row(2, w, d, 2, Y + 0.3, 0.2, 0.2, {}, [], X); k.row(1, w, d, 1, Y + 0.3, 0.24, 0.2, {}, [], X); k.row(3, w, d, 1, Y + 0.3, 0.24, 0.2, {}, [], X);
      k.at(W / 2 - 0.03, 0, 0, Math.PI / 2, () => k.railing(D - 0.04, Y, 0, C.trim, 10));
      k.at(0.43, 0, -D / 2 + 0.03, 0, () => k.railing(0.44, Y, 0, C.trim, 4));
      for (let i = 0; i < 4; i++) k.box(0.28, Y - 0.06 - i * 0.075, 0.1, 0.4, 0, D / 2 + 0.05 + i * 0.1, C.log, null, 0.01);
      k.at(X, 0, 0, 0, () => k.hip(w, d, 0.38, Y + H, roof));
      return k.done();
    }
  }
];

// =============================================================================
// TEN BUILDINGS — written front at +x, out facing +z; a road tile (2 x 2) at most
// =============================================================================
const BUILDINGS = [
  {
    ...BUILDING, id: "building-apartment", name: "Apartment block",
    notes: "Three to five floors over a ground floor, a balcony per floor, a water tank and a stair hut on the roof.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.cream, C.sand, C.terra, C.sky, C.grey]), acc = pick(ctx, [C.teal, C.slate, C.red, C.orange]);
      const W = 1.4, D = 1.6, G = 0.52, F = 0.46, n = 3 + Math.floor(ctx.rnd() * 3), H = G + n * F;
      body(k, W, H, D, wall);
      for (let i = 0; i < n; i++) band(k, W, D, G + i * F, C.trim);
      k.face(0, W, D, () => { k.door(0, 0.26, 0.36, { glassy: true, canopy: acc }); k.win(-0.5, 0.3, 0.26, 0.26, {}); k.win(0.5, 0.3, 0.26, 0.26, {}); });
      for (const s of [1, 2, 3]) k.row(s, W, D, 3, 0.3, 0.22, 0.26, {});
      for (let i = 0; i < n; i++) {
        const y0 = G + i * F, y = y0 + F * 0.5;
        k.face(0, W, D, () => {
          k.win(-0.5, y, 0.24, 0.26, {}); k.win(0.5, y, 0.24, 0.26, {});
          k.win(0, y0 + 0.21, 0.22, 0.34, { sill: C.grey });
          k.box(0.52, 0.04, 0.22, 0, y0, 0.11, C.grey, null, 0.01);
          k.box(0.52, 0.13, 0.02, 0, y0 + 0.04, 0.21, acc, null, 0.005);
          for (const s of [-1, 1]) k.box(0.02, 0.13, 0.2, s * 0.25, y0 + 0.04, 0.11, acc, null, 0);
          k.box(0.54, 0.02, 0.03, 0, y0 + 0.17, 0.21, C.trim, null, 0);
        });
        for (const s of [1, 2, 3]) k.row(s, W, D, 3, y, 0.22, 0.26, {});
      }
      k.flat(W, D, H, { color: C.trim });
      k.tank(-0.35, H, 0.4); k.ac(0.3, H, -0.4); k.ac(0.3, H, 0.1);
      k.box(0.36, 0.3, 0.36, -0.3, H, -0.3, wall, null, 0.015);
      k.box(0.42, 0.04, 0.42, -0.3, H + 0.3, -0.3, C.trim, null, 0.01);
      k.face(0, 0.36, 0.36, () => k.door(0, 0.14, 0.24, { y: H, base: H, leaf: acc }), -0.3, -0.3);
      return k.done();
    }
  },
  {
    ...BUILDING, id: "building-office", name: "Office tower",
    notes: "A glass curtain wall between corner piers, a slab at every floor, mullions, a crown and a mast.",
    build(ctx) {
      const k = new Shell(ctx), frame = pick(ctx, [C.grey, C.trim, C.dark, C.stone]), glass = pick(ctx, [C.glassDark, C.glass]);
      const W = 1.4, D = 1.4, G = 0.55, F = 0.4, n = 5 + Math.floor(ctx.rnd() * 3), H = G + n * F;
      k.box(W + 0.04, PLINTH, D + 0.04, 0, 0, 0, C.stone, null, 0.015);
      k.box(W - 0.06, H, D - 0.06, 0, 0, 0, glass, GLASS, 0.01);
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.box(0.12, H, 0.12, a * (W / 2 - 0.06), 0, b * (D / 2 - 0.06), frame, null, 0.015);
      for (let i = 0; i <= n; i++) k.box(W, 0.05, D, 0, G + i * F - 0.05, 0, frame, null, 0.012);
      for (const s of [0, 1, 2, 3]) k.face(s, W, D, (span) => {
        for (let j = 1; j < 5; j++) k.box(0.025, H - G, 0.03, (j / 5 - 0.5) * (span - 0.12), G, -0.025, frame, null, 0);
      });
      k.face(0, W, D, () => {
        k.door(0, 0.36, 0.38, { glassy: true, frame, y: PLINTH });
        k.box(0.7, 0.05, 0.34, 0, 0.47, 0.14, frame, null, 0.012);
        for (const s of [-1, 1]) k.box(0.03, 0.4, 0.03, s * 0.32, PLINTH, 0.28, frame, null, 0);
      });
      k.box(W * 0.7, 0.3, D * 0.7, 0, H, 0, frame, null, 0.02);
      k.flat(W * 0.7, D * 0.7, H + 0.3, { color: frame, parapet: 0.06 });
      k.cyl(0.012, 0.02, 0.6, 5, 0.1, H + 0.33, -0.1, C.ink);
      k.box(0.06, 0.04, 0.06, 0.1, H + 0.9, -0.1, C.red, null, 0);
      k.ac(-0.25, H + 0.33, 0.15);
      return k.done();
    }
  },
  {
    ...BUILDING, id: "building-shop", name: "Corner shop",
    notes: "A shopfront between pilasters under a striped awning and a sign, one or two floors above.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.cream, C.sky, C.yellow, C.coral, C.sand]), stripe = pick(ctx, [C.red, C.teal, C.orange, C.moss]);
      const W = 1.2, D = 1.4, G = 0.62, F = 0.5, n = 1 + Math.floor(ctx.rnd() * 2), H = G + n * F;
      body(k, W, H, D, wall);
      for (let i = 0; i < n; i++) band(k, W, D, G + i * F, C.trim);
      k.face(0, W, D, () => {
        for (const u of [-0.66, -0.2, 0.2, 0.66]) k.box(0.08, G - 0.04, 0.05, u, 0, 0.01, C.trim, null, 0.01);
        k.win(-0.43, 0.3, 0.34, 0.36, {}); k.win(0.43, 0.3, 0.34, 0.36, {});
        k.door(0, 0.24, 0.4, { glassy: true });
        const a = 0.42, sw = 1.3 / 10;
        for (let i = 0; i < 10; i++) {
          const u = -0.65 + (i + 0.5) * sw, hex = i % 2 ? C.trim : stripe;
          const g = new THREE.BoxGeometry(sw, 0.025, 0.32); g.rotateX(a); g.translate(u, G - 0.1, 0.15); k.add(g, hex);
          k.box(sw, 0.07, 0.015, u, G - 0.1 - 0.16 * Math.sin(a) - 0.07, 0.15 + 0.16 * Math.cos(a), hex, null, 0);
        }
        k.box(0.9, 0.13, 0.04, 0, G + 0.01, 0.02, stripe, null, 0.01);
        for (let i = 0; i < 5; i++) k.box(0.06, 0.06, 0.012, (i - 2) * 0.13, G + 0.045, 0.045, C.trim, null, 0);
      });
      for (const s of [1, 3]) k.row(s, W, D, 2, 0.32, 0.22, 0.26, {});
      k.row(2, W, D, 2, 0.32, 0.22, 0.26, {});
      for (let i = 0; i < n; i++) {
        const y = G + i * F + 0.3;
        k.row(0, W, D, 3, y, 0.22, 0.24, { lintel: C.trim });
        for (const s of [1, 2, 3]) k.row(s, W, D, 2, y, 0.22, 0.24, { lintel: C.trim });
      }
      k.flat(W, D, H, { color: C.trim });
      k.face(0, W, D, (span) => k.dentils(span, H - 0.09, 14, C.trim));
      k.ac(-0.2, H, 0.3);
      return k.done();
    }
  },
  {
    ...BUILDING, id: "building-mansard", name: "Mansard building",
    notes: "Rusticated ground floor, pilasters, keystones, a dentilled cornice and dormers in a mansard roof.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.stone, C.sand, C.cream]), roof = pick(ctx, [C.slate, C.dark, C.teal]);
      const W = 1.6, D = 1.6, G = 0.6, F = 0.46, H = G + 2 * F;
      body(k, W, H, D, wall);
      for (let y = PLINTH + 0.1; y < G - 0.02; y += 0.1) k.box(W + 0.014, 0.014, D + 0.014, 0, y, 0, wall, null, 0);
      band(k, W, D, G, C.trim);
      for (const s of [0, 1, 2, 3]) k.face(s, W, D, () => {
        if (s === 0) k.door(0, 0.26, 0.4, { leaf: roof, canopy: C.trim });
        else k.win(0, 0.32, 0.26, 0.36, { cross: true });
        k.win(-0.5, 0.32, 0.26, 0.36, { cross: true }); k.win(0.5, 0.32, 0.26, 0.36, { cross: true });
        for (const u of [-0.75, -0.25, 0.25, 0.75]) k.box(0.07, 2 * F, 0.03, u, G, 0.01, C.trim, null, 0);
        for (let i = 0; i < 2; i++) for (const u of [-0.5, 0, 0.5]) k.win(u, G + i * F + 0.24, 0.2, 0.26, { lintel: C.trim, key: true });
        k.dentils(W, H - 0.1, 12, C.trim);
      });
      k.box(W + 0.12, 0.07, D + 0.12, 0, H - 0.05, 0, C.trim, null, 0.015);
      const rb = (W + 0.04) / Math.SQRT2, rt = (W - 0.5) / Math.SQRT2, mh = 0.45;
      const g = new THREE.CylinderGeometry(rt, rb, mh, 4, 1); g.rotateY(Math.PI / 4); g.translate(0, H + 0.02 + mh / 2, 0); k.add(g, roof);
      k.box(W - 0.48, 0.04, D - 0.48, 0, H + 0.02 + mh, 0, roof, null, 0.012);
      for (const s of [0, 1, 2, 3]) k.face(s, W, D, () => {
        for (const u of [-0.35, 0.35]) {
          k.box(0.18, 0.2, 0.2, u, H + 0.04, -0.1, wall, null, 0.01);
          k.win(u, H + 0.15, 0.09, 0.11, {});
          k.at(u, 0, -0.1, 0, () => k.gable(0.18, 0.2, 0.08, H + 0.24, roof, wall, { rows: 1, over: 0.02, overD: 0.01 }));
        }
      });
      k.chimney(0.3, H + 0.3, -0.2, 0.3, wall);
      return k.done();
    }
  },
  {
    ...BUILDING, id: "building-setback", name: "Setback tower",
    notes: "Three tiers stepping back, a terrace behind a parapet on each step, a spire.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.white, C.grey, C.sky, C.sand]), acc = pick(ctx, [C.slate, C.teal, C.dark, C.brown]);
      const tiers = [[1.6, 2, 0.48, 3], [1.25, 3, 0.44, 2], [0.9, 2, 0.44, 2]];
      let y = 0;
      k.box(1.64, PLINTH, 1.64, 0, 0, 0, C.stone, null, 0.015);
      tiers.forEach(([s, n, F, per], t) => {
        const h = n * F;
        k.box(s, h, s, 0, y, 0, wall);
        for (let i = 1; i < n; i++) band(k, s, s, y + i * F, acc);
        for (let i = 0; i < n; i++) for (const f of [0, 1, 2, 3]) {
          if (t === 0 && i === 0 && f === 0) continue;
          k.row(f, s, s, per, y + i * F + F * 0.52, 0.2, 0.26, {});
        }
        y += h;
        k.flat(s, s, y, { color: acc, parapet: t < 2 ? 0.08 : 0.12 });
      });
      k.face(0, 1.6, 1.6, () => { k.door(0, 0.3, 0.36, { glassy: true, canopy: acc }); k.win(-0.5, 0.28, 0.28, 0.26, {}); k.win(0.5, 0.28, 0.28, 0.26, {}); });
      k.cyl(0.02, 0.08, 0.7, 6, 0, y, 0, acc);
      k.cyl(0.03, 0.03, 0.05, 6, 0, y + 0.7, 0, C.trim);
      k.ac(-0.2, y, 0.2); k.ac(0.2, y, -0.22);
      return k.done();
    }
  },
  {
    ...BUILDING, id: "building-factory", name: "Brick factory",
    notes: "Buttressed brick, tall gridded windows, a roller door, a sawtooth roof of north lights and a stack.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.brick, C.terra, C.stone]), roof = pick(ctx, [C.dark, C.slate, C.brown]);
      const W = 1.6, D = 1.8, H = 1.1, teeth = 3, wt = W / teeth;
      body(k, W, H, D, wall);
      band(k, W, D, 0.55, wall);
      for (const s of [0, 1, 2, 3]) k.face(s, W, D, (span) => {
        const n = Math.round(span / 0.45);
        for (let i = 0; i <= n; i++) k.box(0.08, H - 0.05, 0.05, (i / n - 0.5) * (span - 0.08), 0, 0.015, wall, null, 0.012);
        for (let i = 0; i < n; i++) {
          const u = ((i + 0.5) / n - 0.5) * (span - 0.08);
          if (!(s === 0 && i === Math.floor(n / 2))) k.win(u, 0.3, 0.22, 0.3, { cross: true, frame: C.dark, sill: C.stone });
          k.win(u, 0.82, 0.22, 0.34, { cross: true, frame: C.dark, sill: C.stone, lintel: C.stone });
        }
      });
      k.face(0, W, D, (span) => {
        const n = Math.round(span / 0.45), u = ((Math.floor(n / 2) + 0.5) / n - 0.5) * (span - 0.08), dw = 0.27, dh = 0.46;
        for (let i = 0; i < 7; i++) k.box(dw, dh / 7 - 0.006, 0.025, u, PLINTH + i * dh / 7, 0, i % 2 ? C.grey : C.stone, null, 0);
        k.box(dw + 0.06, 0.05, 0.06, u, PLINTH + dh, 0, C.dark, null, 0);
        for (const s of [-1, 1]) k.box(0.03, dh, 0.06, u + s * (dw / 2 + 0.015), PLINTH, 0, C.dark, null, 0);
        k.box(dw + 0.1, 0.02, 0.3, u, 0, 0.15, C.stone, null, 0);
      });
      k.flat(W, D, H, { color: wall, parapet: 0.0 });
      for (let i = 0; i < teeth; i++) {
        const x0 = -W / 2 + i * wt;
        k.prism([[x0, 0], [x0 + wt, 0], [x0 + wt, 0.3]], D - 0.04, 0, H + 0.02, 0, roof);
        k.box(0.02, 0.24, D - 0.12, x0 + wt + 0.01, H + 0.04, 0, C.glass, GLASS, 0);
        for (let j = 1; j < 6; j++) k.box(0.03, 0.24, 0.02, x0 + wt + 0.015, H + 0.04, (j / 6 - 0.5) * (D - 0.12), C.dark, null, 0);
      }
      k.cyl(0.09, 0.13, 1.7, 8, -0.55, 0, 0.75, wall);
      k.cyl(0.11, 0.11, 0.05, 8, -0.55, 1.5, 0.75, C.stone);
      k.cyl(0.1, 0.1, 0.06, 8, -0.55, 1.66, 0.75, C.dark);
      return k.done();
    }
  },
  {
    ...BUILDING, id: "building-hotel", name: "Hotel",
    notes: "Four or five floors, a long entrance canopy on posts, a blade sign down the corner and a sign on the roof.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.coral, C.sky, C.cream, C.yellow]), acc = pick(ctx, [C.red, C.teal, C.slate, C.orange]);
      const W = 1.2, D = 1.8, G = 0.55, F = 0.42, n = 4 + Math.floor(ctx.rnd() * 2), H = G + n * F;
      body(k, W, H, D, wall);
      for (let i = 0; i < n; i++) band(k, W, D, G + i * F, C.trim);
      k.box(W + 0.03, 0.12, D + 0.03, 0, H - 0.14, 0, acc, null, 0.012);
      k.face(0, W, D, () => {
        k.door(-0.13, 0.22, 0.38, { glassy: true }); k.door(0.13, 0.22, 0.38, { glassy: true });
        k.win(-0.6, 0.3, 0.3, 0.3, {}); k.win(0.6, 0.3, 0.3, 0.3, {});
        k.box(0.9, 0.05, 0.38, 0, 0.5, 0.19, acc, null, 0.012);
        for (const s of [-1, 1]) k.box(0.03, 0.43, 0.03, s * 0.42, PLINTH, 0.35, C.trim, null, 0);
        const sh = n * F * 0.75;
        k.box(0.06, sh, 0.22, -0.86, G + 0.08, 0.11, acc, null, 0.01);
        for (let i = 0; i < 5; i++) k.box(0.075, 0.08, 0.1, -0.86, G + 0.14 + i * sh / 5, 0.12, C.trim, null, 0);
      });
      for (const s of [1, 2, 3]) k.row(s, W, D, s % 2 ? 3 : 5, 0.3, 0.2, 0.26, {});
      for (let i = 0; i < n; i++) {
        const y = G + i * F + F * 0.48;
        k.row(0, W, D, 4, y, 0.2, 0.24, {});
        k.row(2, W, D, 5, y, 0.2, 0.24, {});
        for (const s of [1, 3]) k.row(s, W, D, 3, y, 0.2, 0.24, {});
      }
      k.flat(W, D, H, { color: C.trim });
      for (const z of [-0.45, 0.45]) k.box(0.03, 0.12, 0.03, W / 2 - 0.2, H, z, C.ink, null, 0);
      k.box(0.05, 0.2, 1.0, W / 2 - 0.2, H + 0.12, 0, acc, null, 0.01);
      for (let i = 0; i < 5; i++) k.box(0.02, 0.1, 0.12, W / 2 - 0.17, H + 0.17, (i - 2) * 0.18, C.trim, null, 0);
      k.ac(-0.2, H, 0.4);
      return k.done();
    }
  },
  {
    ...BUILDING, id: "building-school", name: "School",
    notes: "Two long floors, a central bay rising into a pediment with a clock, steps to a double door, a flagpole.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.brick, C.terra, C.sand]), roof = pick(ctx, [C.dark, C.slate, C.teal]), flag = pick(ctx, [C.red, C.blue, C.yellow]);
      const W = 1.1, D = 1.9, F = 0.5, H = 2 * F + 0.02;
      body(k, W, H, D, wall);
      band(k, W, D, 0.52, C.trim);
      k.row(0, W, D, 5, 0.3, 0.2, 0.26, { cross: true }, [2]);
      k.row(0, W, D, 5, 0.78, 0.2, 0.26, { cross: true }, [2]);
      for (const s of [1, 3]) { k.row(s, W, D, 2, 0.3, 0.2, 0.26, { cross: true }); k.row(s, W, D, 2, 0.78, 0.2, 0.26, { cross: true }); }
      k.row(2, W, D, 5, 0.3, 0.2, 0.26, { cross: true }); k.row(2, W, D, 5, 0.78, 0.2, 0.26, { cross: true });
      k.flat(W, D, H, { color: C.trim });
      k.face(0, W, D, () => {
        k.box(0.5, H + 0.25, 0.08, 0, 0, 0.04, wall, null, 0.015);
        k.at(0, 0, 0.08, 0, () => {
          k.door(-0.07, 0.13, 0.38, { y: 0.14, leaf: roof }); k.door(0.07, 0.13, 0.38, { y: 0.14, leaf: roof });
          k.win(0, 0.78, 0.28, 0.26, { cross: true });
          const rim = new THREE.CylinderGeometry(0.11, 0.11, 0.03, 12); rim.rotateX(Math.PI / 2); rim.translate(0, H + 0.1, 0); k.add(rim, C.ink);
          const dial = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 12); dial.rotateX(Math.PI / 2); dial.translate(0, H + 0.1, 0.012); k.add(dial, C.trim);
          for (const [w, a] of [[0.06, 0.4], [0.075, -0.5]]) { const g = new THREE.BoxGeometry(0.012, w, 0.008); g.translate(0, w / 2, 0); g.rotateZ(a); g.translate(0, H + 0.1, 0.035); k.add(g, C.ink); }
        });
        k.box(0.56, 0.05, 0.12, 0, H + 0.25, 0.04, C.trim, null, 0.01);
        k.prism([[-0.3, 0], [0.3, 0], [0, 0.22]], 0.1, 0, H + 0.3, 0.04, roof);
      });
      k.cyl(0.012, 0.016, 1.3, 5, W / 2 + 0.25, 0, -0.75, C.grey);
      k.box(0.008, 0.14, 0.24, W / 2 + 0.25, 1.1, -0.75 + 0.13, flag, null, 0);
      k.cyl(0.05, 0.06, 0.05, 6, W / 2 + 0.25, 0, -0.75, C.stone);
      return k.done();
    }
  },
  {
    ...BUILDING, id: "building-firestation", name: "Fire station",
    notes: "Two engine doors under a sign, a floor above and a hose tower with a hipped cap.",
    build(ctx) {
      const k = new Shell(ctx), wall = pick(ctx, [C.red, C.brick, C.coral]), roof = pick(ctx, [C.dark, C.slate]);
      const W = 1.4, D = 1.6, G = 0.66, F = 0.46, H = G + F, TX = -0.5, TZ = -0.6, TH = 2.1;
      body(k, W, H, D, wall);
      band(k, W, D, G, C.trim);
      k.face(0, W, D, () => {
        for (const u of [-0.32, 0.32]) {
          const dw = 0.5, dh = 0.5;
          for (let i = 0; i < 6; i++) k.box(dw, dh / 6 - 0.006, 0.025, u, PLINTH + i * dh / 6, 0, i === 4 ? C.glass : i % 2 ? C.grey : C.trim, i === 4 ? GLASS : null, 0);
          k.box(dw + 0.08, 0.05, 0.06, u, PLINTH + dh, 0, C.trim, null, 0);
          for (const s of [-1, 1]) k.box(0.04, dh, 0.06, u + s * (dw / 2 + 0.02), PLINTH, 0, C.trim, null, 0);
          k.box(dw + 0.1, 0.02, 0.3, u, 0, 0.15, C.grey, null, 0);
        }
        k.box(0.5, 0.08, 0.03, 0, G - 0.09, 0.015, C.trim, null, 0.008);
        k.cyl(0.04, 0.04, 0.02, 8, 0, G - 0.12, 0.03, C.yellow);
      });
      k.row(0, W, D, 4, G + 0.24, 0.2, 0.24, {});
      for (const s of [1, 2]) { k.row(s, W, D, 3, 0.32, 0.2, 0.26, {}); k.row(s, W, D, 3, G + 0.24, 0.2, 0.24, {}); }
      k.flat(W, D, H, { color: C.trim });
      k.box(0.4, TH, 0.4, TX, 0, TZ, wall);
      for (let y = 0.6; y < TH; y += 0.46) band(k, 0.4, 0.4, y, C.trim, TX, TZ);
      for (const s of [0, 3]) k.face(s, 0.4, 0.4, () => { for (let y = 1.4; y < TH - 0.1; y += 0.46) k.win(0, y, 0.12, 0.24, {}); }, TX, TZ);
      k.at(TX, 0, TZ, 0, () => k.hip(0.4, 0.4, 0.22, TH, roof, { over: 0.05 }));
      k.cyl(0.05, 0.05, 0.06, 8, 0.3, H, 0.3, C.red);
      return k.done();
    }
  },
  {
    ...BUILDING, id: "building-parking", name: "Parking garage",
    notes: "Open decks on a grid of columns, a striped parapet on each level and a stair core carrying the P.",
    build(ctx) {
      const k = new Shell(ctx), acc = pick(ctx, [C.yellow, C.orange, C.teal, C.red]), core = pick(ctx, [C.sky, C.grey, C.sand]);
      const W = 1.6, D = 1.6, L = 0.42, levels = 4;
      for (let i = 0; i <= levels; i++) {
        k.box(W, 0.06, D, 0, i * L, 0, C.grey, null, 0.012);
        if (i > 0) for (const s of [-1, 1]) {
          k.box(W, 0.12, 0.04, 0, i * L + 0.06, s * (D / 2 - 0.02), C.grey, null, 0);
          k.box(0.04, 0.12, D, s * (W / 2 - 0.02), i * L + 0.06, 0, C.grey, null, 0);
          k.box(W + 0.005, 0.025, 0.045, 0, i * L + 0.12, s * (D / 2 - 0.02), acc, null, 0);
          k.box(0.045, 0.025, D + 0.005, s * (W / 2 - 0.02), i * L + 0.12, 0, acc, null, 0);
        }
        if (i < levels) for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) k.box(0.08, L - 0.06, 0.08, a * (W / 2 - 0.08), i * L + 0.06, b * (D / 2 - 0.08), C.grey, null, 0);
      }
      const cx = -0.6, cz = -0.6, ch = levels * L + 0.35;
      k.box(0.4, ch, 0.4, cx, 0, cz, core, null, 0.015);
      k.box(0.46, 0.04, 0.46, cx, ch, cz, C.trim, null, 0.01);
      for (const s of [2, 3]) k.face(s, 0.4, 0.4, () => { k.box(0.1, ch - 0.3, 0.02, 0, 0.1, 0, C.glass, GLASS, 0); }, cx, cz);
      k.face(0, 0.4, 0.4, () => {
        k.box(0.26, 0.26, 0.03, 0, ch - 0.32, 0.015, C.blue, null, 0.008);
        k.box(0.04, 0.17, 0.012, -0.045, ch - 0.275, 0.035, C.trim, null, 0);
        k.box(0.08, 0.035, 0.012, -0.005, ch - 0.14, 0.035, C.trim, null, 0);
        k.box(0.08, 0.035, 0.012, -0.005, ch - 0.205, 0.035, C.trim, null, 0);
        k.box(0.035, 0.1, 0.012, 0.035, ch - 0.205, 0.035, C.trim, null, 0);
        k.door(0, 0.16, 0.28, { y: 0.06, leaf: acc, step: C.grey });
      }, cx, cz);
      k.face(0, W, D, () => { k.box(0.24, 0.3, 0.2, 0.45, 0.06, -0.1, core, null, 0.012); k.win(0.45, 0.24, 0.18, 0.1, {}); k.box(0.02, 0.02, 0.4, 0.15, 0.3, 0.1, acc, null, 0); });
      return k.done();
    }
  }
];


// =============================================================================
// THE HERO DOZER — the art-direction bench's model (lowpoly-direction.html)
// =============================================================================
// The same machine as vehicle-dozer, with a silhouette worth judging: rounded
// tracks with cleats, a curved blade on push arms, a cab of pillars under an
// overhanging roof. Two knobs are the bench's questions:
//   toy    0 = the proportions of a real machine, 1 = a toy's (short chunky
//          tracks, a big cab, a big blade), past 1 a caricature;
//   detail 0, 1, 2 = what is modelled at all, so a part that costs triangles
//          and adds nothing to the silhouette is seen doing so.
// Every mesh carries userData.role (body, trim, dark, metal, glass, accent,
// light): a page that recolours by role reads it, and a page that does not
// still gets the kit's swatches through the hexes below.
const DOZER_ROLE = { body: 0xf2b22a, trim: 0xe0a020, dark: 0x2a2a2e, metal: 0x8a8f96, glass: 0x37475a, accent: 0x1d1d1d, light: 0xf7f8f9 };
const DOZER_REAL = { trackL: 4.6, trackH: 1.0, trackW: 0.9, gap: 1.25, hoodH: 0.8, cabL: 1.5, cabH: 1.5, cabW: 1.9,
  bladeH: 1.35, bladeW: 3.8, bladeT: 0.2, bladeC: 0.22, exhH: 0.9, exhR: 0.11, lamp: 0.22 };
const DOZER_TOY = { trackL: 3.7, trackH: 1.35, trackW: 1.15, gap: 1.3, hoodH: 0.95, cabL: 1.9, cabH: 2.1, cabW: 2.3,
  bladeH: 2.0, bladeW: 4.6, bladeT: 0.28, bladeC: 0.34, exhH: 1.3, exhR: 0.18, lamp: 0.36 };

// a track: a slot shape (two half circles and two runs), extruded across
function trackGeo(L, H, W, seg) {
  const bev = Math.min(0.07, W * 0.12), h = H - 2 * bev, r = h / 2, hl = L / 2 - bev - r;
  const s = new THREE.Shape();
  s.moveTo(-hl, -r); s.lineTo(hl, -r); s.absarc(hl, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-hl, r); s.absarc(-hl, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  const g = new THREE.ExtrudeGeometry(s, { depth: W - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev,
    bevelSegments: 1, curveSegments: seg });
  g.translate(0, 0, -(W - 2 * bev) / 2);
  return g;
}
// a blade: a curved plate, concave forward (+x), its back's middle at x = 0
function bladeGeo(H, W, T, C, n) {
  const s = new THREE.Shape(), bev = 0.03, bx = (i) => C * Math.pow(2 * i / n - 1, 2);
  s.moveTo(bx(0), 0);
  for (let i = 1; i <= n; i++) s.lineTo(bx(i), H * i / n);
  for (let i = n; i >= 0; i--) s.lineTo(bx(i) + T, H * i / n);
  const g = new THREE.ExtrudeGeometry(s, { depth: W - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 1 });
  g.translate(0, 0, -(W - 2 * bev) / 2);
  return g;
}

// opts.rig = true builds the same machine ARTICULATED, for the animation bench
// (dozer-anim.html): the blade on a lifting arm, wheels that turn, a track
// made of links that run round its loop. The
// groups exist either way (at rest they move nothing); what only a rig needs
// — the wheel bolts, the links — is built behind the flag.
// g.userData.rig.set({ lift, tilt, spinX, spinY, spinZ, reach, trackL, trackR })
// poses it: lift / tilt / spin in radians, reach in body units, the tracks
// as the distance each one has run, in world units (+ forward).
function buildHeroDozer(ctx, opts = {}) {
  const t = opts.toy == null ? 0.6 : opts.toy, det = opts.detail == null ? 2 : opts.detail, k = 0.27, rig = !!opts.rig;
  const D = {};
  for (const key in DOZER_REAL) D[key] = DOZER_REAL[key] + (DOZER_TOY[key] - DOZER_REAL[key]) * t;
  const g = new THREE.Group(), inner = new THREE.Group();
  inner.name = "body"; inner.scale.setScalar(k); g.add(inner); g.userData.k = k;
  inner.userData.o = new THREE.Vector3();
  // a part is placed in the body's coordinates whatever group it goes into:
  // every group records where its origin stands in the body (userData.o)
  const add = (geo, role, x, y, z, opt, par = inner) => {
    const m = ctx.mesh(geo, DOZER_ROLE[role], opt), o = par.userData.o;
    m.userData.role = role; m.position.set(x - o.x, y - o.y, z - o.z); par.add(m); return m;
  };
  const box = (w, h, d, role, x, y, z, r = 0.06, opt, par) => add(bevelBox(w, h, d, r), role, x, y, z, opt, par);
  const cyl = (r, h, role, x, y, z, axis, seg = 8, opt, par) => {
    const geo = new THREE.CylinderGeometry(r, r, h, seg);
    if (axis === "z") geo.rotateX(Math.PI / 2); else if (axis === "x") geo.rotateZ(Math.PI / 2);
    return add(geo, role, x, y, z, opt, par);
  };
  const group = (name, par, o) => {
    const q = new THREE.Group(); q.name = name; q.userData.o = o.clone();
    q.position.copy(o).sub(par.userData.o); par.add(q); return q;
  };
  const seg = [2, 3, 5][det], metal = { roughness: 0.4, metalness: 0.5 }, paintOpt = { roughness: 0.55 };
  const L = D.trackL, TH = D.trackH, span = D.gap;
  const wheels = [], links = [[], []], tracks = [];

  // ---- the tracks, their wheels, rollers and cleats
  const deckFront = -L / 2 + D.cabL + 0.35;
  for (const s of [-1, 1]) {
    tracks.push(add(trackGeo(L, TH, D.trackW, seg), "dark", 0, TH / 2, s * span));
    const ox = L / 2 - TH / 2, zf = s * (span + D.trackW / 2 + 0.02);
    // a wheel turns about z; rig: bolts on its face, so the turn is seen
    const wheel = (r, x, y, n, sides) => {
      const w = cyl(r, 0.12, "metal", x, y, zf, "z", sides, metal);
      if (!rig) return w;
      wheels.push({ m: w, r, side: s });
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU, b = add(bevelBox(r * 0.26, r * 0.26, 0.04, 0.01), "dark", 0, 0, 0);
        w.add(b); b.position.set(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, s * 0.07); b.rotation.z = a;
      }
      const bar = add(bevelBox(r * 1.5, r * 0.22, 0.03, 0.01), "dark", 0, 0, 0);
      w.add(bar); bar.position.z = s * 0.075;
      return w;
    };
    if (det >= 1) {
      wheel(TH * 0.36, -ox, TH / 2, 5, seg * 3);       // sprocket
      wheel(TH * 0.3, ox, TH / 2, 4, seg * 3);       // idler
    }
    if (det >= 2) {
      for (let i = 0; i < 4; i++) wheel(TH * 0.15, -ox + (i + 1) * 2 * ox / 5, TH * 0.22, 2, 6);
      if (!rig) for (let i = 0; i < 7; i++) {
        const x = deckFront + 0.1 + i * (ox - deckFront - 0.1) / 6;
        box(0.12, 0.1, D.trackW, "dark", x, TH + 0.02, s * span, 0.02);
      }
    }
    // rig: the cleats all round the loop, every one a link that runs on it
    if (rig && det >= 1) {
      const R = TH / 2, perim = 4 * ox + TAU * R, n = Math.round(perim / (det >= 2 ? 0.3 : 0.45));
      for (let i = 0; i < n; i++) links[(s + 1) / 2].push(box(0.12, 0.1, D.trackW, "dark", 0, 0, s * span, 0.02));
      links[(s + 1) / 2].ox = ox; links[(s + 1) / 2].R = R; links[(s + 1) / 2].perim = perim;
    }
  }

  // ---- the deck over the tracks at the back, the hood between them at the front
  const deckY = TH + 0.1, deckTop = deckY + 0.08, deckW = 2 * span + D.trackW + 0.12;
  box(deckFront + L / 2, 0.16, deckW, "body", (deckFront - L / 2) / 2, deckY, 0, 0.04, paintOpt);
  const hoodW = 2 * span - D.trackW * 0.6, hoodBot = TH * 0.4, hoodTop = TH + D.hoodH;
  const hoodBack = deckFront - 0.2, hoodFront = L / 2 - 0.1, hoodL = hoodFront - hoodBack, hoodX = (hoodFront + hoodBack) / 2;
  box(hoodL, hoodTop - hoodBot, hoodW, "body", hoodX, (hoodTop + hoodBot) / 2, 0, 0.08, paintOpt);
  if (det >= 1) {
    box(hoodL * 0.86, 0.08, hoodW * 0.78, "trim", hoodX - 0.04, hoodTop + 0.03, 0, 0.02, paintOpt);
    box(0.06, (hoodTop - hoodBot) * 0.55, hoodW * 0.7, "dark", hoodFront + 0.02, hoodBot + (hoodTop - hoodBot) * 0.42, 0, 0.02);
    for (const s of [-1, 1]) cyl(D.lamp / 2, 0.1, "light", hoodFront + 0.05, hoodTop - D.lamp * 0.7, s * hoodW * 0.36, "x", seg * 3);
  }
  if (det >= 2) {
    for (let i = 0; i < 3; i++) box(0.05, 0.05, hoodW * 0.66, "metal", hoodFront + 0.06, hoodBot + (hoodTop - hoodBot) * (0.25 + i * 0.17), 0, 0.01, metal);
    for (const s of [-1, 1]) box(0.08, D.lamp * 1.1, D.lamp * 1.1, "dark", hoodFront + 0.01, hoodTop - D.lamp * 0.7, s * hoodW * 0.36, 0.02);
  }
  // the exhaust
  if (det >= 1) {
    const ex = hoodBack + hoodL * 0.3, ez = hoodW * 0.25;
    const pipe = cyl(D.exhR, D.exhH, "dark", ex, hoodTop + D.exhH / 2, ez, null, seg * 3);
    pipe.userData.part = "exhaust";
    g.userData.exhaust = new THREE.Vector3(ex, hoodTop + D.exhH + 0.05, ez).multiplyScalar(k);
    if (det >= 2) cyl(D.exhR * 1.3, 0.07, "dark", ex, hoodTop + D.exhH, ez, null, seg * 3);
  }

  // ---- the cab: one box at detail 0, pillars, glass and an overhanging roof above
  const cabX = -L / 2 + 0.15 + D.cabL / 2, cb = deckTop, CH = D.cabH, CL = D.cabL, CW = D.cabW;
  if (det === 0) {
    box(CL, CH, CW, "trim", cabX, cb + CH / 2, 0, 0.08, paintOpt);
    box(CL + 0.04, CH * 0.42, CW + 0.04, "glass", cabX, cb + CH * 0.64, 0, 0.03, { roughness: 0.15, metalness: 0.3 });
  } else {
    box(CL, CH * 0.38, CW, "trim", cabX, cb + CH * 0.19, 0, 0.06, paintOpt);
    box(CL * 0.92, CH * 0.52, CW * 0.92, "glass", cabX, cb + CH * 0.38 + CH * 0.26, 0, 0.03, { roughness: 0.15, metalness: 0.3 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(0.13, CH * 0.54, 0.13, "trim", cabX + sx * (CL / 2 - 0.07), cb + CH * 0.38 + CH * 0.26, sz * (CW / 2 - 0.07), 0.03, paintOpt);
    }
    box(CL + 0.26, 0.18, CW + 0.26, "body", cabX, cb + CH - 0.07, 0, 0.05, paintOpt);
  }
  if (det >= 2) {
    const beacon = cyl(0.12, 0.2, "accent", cabX - CL * 0.2, cb + CH + 0.12, 0, null, 8);       // the beacon
    beacon.userData.part = "beacon";
    for (const s of [-1, 1]) cyl(D.lamp * 0.35, 0.08, "light", cabX + CL / 2 + 0.12, cb + CH - 0.22, s * CW * 0.3, "x", 8);
    box(0.5, 0.06, 0.25, "dark", cabX + CL * 0.1, deckTop - 0.25, (CW / 2 + 0.25), 0.015);   // the step
  }

  // ---- the blade and its push arms (no pistons: two bars from the hood to the
  // blade stood in the way of every lift and spin). The arm turns about its pivot at
  // the back of the push arms (lift); the mount is the blade's middle (tilt,
  // reach); the spin group under it turns the blade on any axis.
  const x0 = L / 2 + 0.32, BH = D.bladeH, BW = D.bladeW, BT = D.bladeT, BC = D.bladeC, a0 = -0.4;
  const P0 = new THREE.Vector3(a0, TH * 0.5, 0), M0 = new THREE.Vector3(x0 + (BC + BT) / 2, 0.03 + BH / 2, 0);
  const arm = group("arm", inner, P0), mount = group("mount", arm, M0), spin = group("spin", mount, M0);
  add(bladeGeo(BH, BW, BT, BC, seg), "body", x0, 0.03, 0, paintOpt, spin);
  g.userData.bladeFront = (x0 + BC + BT) * k;
  const arms = [];
  if (det >= 1) {
    box(BT + 0.12, 0.14, BW * 0.98, "metal", x0 + BC + BT / 2, 0.09, 0, 0.02, metal, spin);       // the cutting edge
    const yy = 0.82, sx = x0 + BT + BC * Math.pow(2 * yy - 1, 2) + 0.03;
    box(0.04, 0.13, BW * 0.9, "accent", sx, 0.03 + BH * yy, 0, 0.01, undefined, spin);            // the hazard band
    for (const s of [-1, 1]) {
      box(BC + BT + 0.1, BH * 0.92, 0.09, "body", x0 + (BC + BT) / 2, 0.03 + BH * 0.46, s * (BW / 2 - 0.02), 0.02, paintOpt, spin);
      const az = s * (span + D.trackW / 2 + 0.14);
      arms.push(box(x0 - a0, 0.24, 0.18, "metal", (x0 + a0) / 2, TH * 0.5, az, 0.04, metal, arm)); // the push arm
    }
  }
  if (det >= 2) {
    // the ripper at the back
    box(0.3, 0.26, 2 * span * 0.7, "body", -L / 2 - 0.2, TH * 0.75, 0, 0.04, paintOpt);
    const tooth = box(0.16, TH * 0.95, 0.18, "metal", -L / 2 - 0.36, TH * 0.42, 0, 0.03, metal);
    tooth.rotation.z = -0.2;
  }

  if (rig) {
    const span0 = x0 - a0;
    // a link at distance u along its loop: top run forward, front arc down,
    // bottom run back, rear arc up (the loop seen from +z turns clockwise)
    const onLoop = (m, u, ox, R, perim) => {
      u = ((u % perim) + perim) % perim;
      let cx, th;
      if (u < 2 * ox) { cx = -ox + u; th = Math.PI / 2; }
      else if ((u -= 2 * ox) < Math.PI * R) { cx = ox; th = Math.PI / 2 - u / R; }
      else if ((u -= Math.PI * R) < 2 * ox) { cx = ox - u; th = -Math.PI / 2; }
      else { u -= 2 * ox; cx = -ox; th = -Math.PI / 2 - u / R; }
      const rr = R - 0.01;
      m.position.x = cx + rr * Math.cos(th); m.position.y = TH / 2 + rr * Math.sin(th);
      m.rotation.z = th - Math.PI / 2;
    };
    const st = { lift: 0, tilt: 0, spinX: 0, spinY: 0, spinZ: 0, reach: 0, trackL: 0, trackR: 0 };
    const set = (o) => {
      Object.assign(st, o);
      arm.rotation.z = st.lift;
      mount.position.set(M0.x - P0.x + st.reach, M0.y - P0.y, 0);
      mount.rotation.z = st.tilt;
      spin.rotation.set(st.spinX, st.spinY, st.spinZ, "XYZ");
      for (const m of arms) { m.scale.x = (span0 + st.reach) / span0; m.position.x = (span0 + st.reach) / 2; }
      const dist = [st.trackL / k, st.trackR / k];
      for (const w of wheels) w.m.rotation.z = -dist[(w.side + 1) / 2] / w.r;
      for (let s = 0; s < 2; s++) {
        const ls = links[s]; if (!ls.length) continue;
        for (let i = 0; i < ls.length; i++) onLoop(ls[i], i * ls.perim / ls.length + dist[s], ls.ox, ls.R, ls.perim);
      }
    };
    set({});
    // what touches the ground: the track outlines and the cab roof (body
    // coordinates), the blade's eight corners (the spin group's)
    const bodyPts = [], bladePts = [], ox = L / 2 - TH / 2, hb = (BC + BT) / 2 + 0.06;
    for (const s of [-1, 1]) for (let i = 0; i < 16; i++) {
      const th = i / 16 * TAU, c = Math.cos(th);
      bodyPts.push(new THREE.Vector3((c >= 0 ? ox : -ox) + TH / 2 * c, TH / 2 + TH / 2 * Math.sin(th), s * (span + D.trackW / 2)));
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bodyPts.push(new THREE.Vector3(cabX + sx * (CL + 0.26) / 2, cb + CH + 0.02, sz * (CW + 0.26) / 2));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) bladePts.push(new THREE.Vector3(sx * hb, sy * BH / 2, sz * BW / 2));
    // world anchors for an effect between the arm and the blade (matrices must be current)
    const armZ = span + D.trackW / 2 + 0.14;
    const armTip = (s, out) => arm.localToWorld(out.set(span0 + st.reach, 0, s * armZ));
    const bladePoint = (u, v, out) => spin.localToWorld(out.set(-(BC + BT) / 2 + BC * v * v + 0.02, v * BH / 2, u * BW / 2));
    const bladeCentre = (out) => spin.localToWorld(out.set(0, 0, 0));
    g.userData.rig = { inner, arm, mount, spin, wheels, links, tracks, set, state: st, bodyPts, bladePts,
      armTip, bladePoint, bladeCentre, bladeHalfW: BW / 2 * k, bladeHalfH: BH / 2 * k,
      halfTrack: span * k, trackH: TH * k };
  }
  return g;
}

// =============================================================================
// THE ITEMS
// =============================================================================
export const ITEMS = [
  {
    id: "tree-conifer", name: "Conifer", category: "tree", biome: "park", tags: ["vegetation"],
    notes: "Three stacked cones on a five-sided trunk, two greens.",
    build(ctx) {
      const g = new THREE.Group(), seed = ctx.rnd() * 100;
      const dark = pick(ctx, [0x2f7a4a, 0x2d6e48]), light = pick(ctx, [0x3b8a4f, 0x4a9a5c]);
      const trunk = ctx.mesh(jitter(new THREE.CylinderGeometry(0.07, 0.1, 0.45, 5), 0.01, seed), 0x7a5236);
      trunk.position.y = 0.22; g.add(trunk);
      [[0.55, 0.75, 0.35], [0.44, 0.65, 0.78], [0.31, 0.55, 1.16]].forEach((c, k) => {
        const cone = ctx.mesh(jitter(new THREE.ConeGeometry(c[0], c[1], 7), 0.05, seed * 7 + k), k ? light : dark);
        cone.position.y = c[2]; cone.rotation.y = rr(ctx, 0, TAU); g.add(cone);
      });
      return g;
    }
  },
  {
    id: "tree-round", name: "Round tree", category: "tree", biome: "park", tags: ["vegetation"],
    notes: "A faceted crown and a smaller one on its shoulder.",
    build(ctx) {
      const g = new THREE.Group(), seed = ctx.rnd() * 100, col = pick(ctx, [0x6aa84f, 0x7db552, 0x5c9c48, 0x8cbf5a]);
      const trunk = ctx.mesh(jitter(new THREE.CylinderGeometry(0.06, 0.09, 0.6, 5), 0.01, seed), 0x7a5236);
      trunk.position.y = 0.3; g.add(trunk);
      const crown = ctx.mesh(jitter(new THREE.IcosahedronGeometry(0.42, 1), 0.06, seed + 3), col);
      crown.position.y = 0.85; crown.scale.y = 0.92; g.add(crown);
      const crown2 = ctx.mesh(jitter(new THREE.IcosahedronGeometry(0.28, 0), 0.04, seed * 5), col === 0x8cbf5a ? 0x7db552 : 0x8cbf5a);
      crown2.position.set(0.22, 1.08, 0.1); g.add(crown2);
      return g;
    }
  },
  {
    id: "rock-single", name: "Rock", category: "rock", biome: "any", tags: ["mineral"],
    notes: "A flattened dodecahedron, one of four greys.",
    build(ctx) {
      const m = ctx.mesh(jitter(new THREE.DodecahedronGeometry(0.3, 0), 0.07, ctx.rnd() * 100), pick(ctx, [0x9a948a, 0xa9a297, 0x8c877f, 0xb5aea2]));
      m.scale.set(1, rr(ctx, 0.55, 0.8), rr(ctx, 0.8, 1.1)); m.position.y = 0.08;
      const g = new THREE.Group(); g.add(m); return g;
    }
  },
  {
    id: "crystal-cluster", name: "Crystal cluster", category: "crystal", biome: "park", tags: ["light source"],
    notes: "Stretched octahedra round a big one; emissive, so the page decides its colour (glow A or B).",
    build(ctx, opts = {}) {
      const g = new THREE.Group(), n = opts.n || 7, mat = ctx.glow(opts.key || "A"), seed = ctx.rnd() * 100;
      for (let i = 0; i < n; i++) {
        const s = i ? rr(ctx, 0.1, 0.22) : 0.3, m = new THREE.Mesh(jitter(new THREE.OctahedronGeometry(1, 0), 0.08, seed + i), mat);
        const a = i * 2.4, d = i ? rr(ctx, 0.15, 0.45) : 0;
        m.scale.set(s, s * rr(ctx, 2, 2.8), s); m.position.set(Math.cos(a) * d, s * 1.6, Math.sin(a) * d);
        m.rotation.set(Math.sin(a) * 0.4 * (i ? 1 : 0.2), rr(ctx, 0, TAU), Math.cos(a) * 0.4 * (i ? 1 : 0.2));
        g.add(m);
      }
      return g;
    }
  },
  {
    id: "vehicle-dozer", name: "Bulldozer", category: "vehicle", biome: "city", tags: ["hero", "dozerflip"],
    notes: "The prototype's chamfered parts at the kit's scale. Its body is the child named \"body\"; userData.k is the part scale.",
    build(ctx) {
      const g = new THREE.Group(), k = 0.27, inner = new THREE.Group();
      inner.name = "body"; g.userData.k = k;
      const part = (w, h, d, x, y, z, hex, opts) => {
        const m = ctx.mesh(bevelBox(w * k, h * k, d * k, 0.035), hex, opts);
        m.position.set(x * k, y * k, z * k); inner.add(m); return m;
      };
      part(4.4, 1.0, 0.9, -0.2, 0.5, 1.25, 0x2a2a2e);
      part(4.4, 1.0, 0.9, -0.2, 0.5, -1.25, 0x2a2a2e);
      part(3.4, 1.3, 2.2, -0.3, 1.4, 0, 0xf2b22a, { roughness: 0.55 });
      part(1.5, 1.3, 1.7, -0.9, 2.7, 0, 0xe0a020, { roughness: 0.55 });
      part(1.2, 0.7, 1.75, -0.6, 2.75, 0, 0x37475a, { roughness: 0.15, metalness: 0.3 });
      part(0.3, 1.0, 0.3, 0.6, 2.4, 0.6, 0x333333);
      part(0.45, 1.4, 3.9, 2.55, 0.8, 0, 0x8a8f96, { roughness: 0.4, metalness: 0.5 });
      part(1.2, 0.3, 0.3, 1.8, 0.9, 0.9, 0x555a60);
      part(1.2, 0.3, 0.3, 1.8, 0.9, -0.9, 0x555a60);
      const stripe = ctx.mesh(bevelBox(0.03, 0.06, 3.7 * k, 0.01), 0x1d1d1d);   // the hazard stripe on the blade
      stripe.position.set(2.8 * k, 1.15 * k, 0); inner.add(stripe);
      g.add(inner);
      return g;
    }
  },
  {
    id: "vehicle-dozer-hero", name: "Bulldozer (hero)", category: "vehicle", biome: "city", tags: ["hero", "dozerflip"],
    notes: "The art-direction bench's dozer: slot tracks, a curved blade, a pillared cab. opts.toy (0 real, 1 toy, 1.5 caricature) and opts.detail (0–2); every mesh has userData.role. opts.rig articulates it (userData.rig, see dozer-anim.html).",
    build: buildHeroDozer
  },
  {
    id: "rubble-heap", name: "Rubble heap", category: "rubble", biome: "city", tags: ["destruction", "dozerflip"],
    notes: "What a block leaves: chunks in its tier colour and in concrete, and a broken stump of wall.",
    build(ctx, opts = {}) {
      const g = new THREE.Group(), tier = opts.color || 0xe0433a;
      for (let k = 0; k < 46; k++) {
        const a = rr(ctx, 0, TAU), d = Math.pow(ctx.rnd(), 0.7) * 0.85, s = rr(ctx, 0.08, 0.24);
        const col = ctx.rnd() < 0.5 ? tier : pick(ctx, [0xb9b3a8, 0x8e8a83, 0xd2ccc1]);
        const m = ctx.mesh(bevelBox(s * rr(ctx, 0.8, 1.6), s, s * rr(ctx, 0.8, 1.4), s * 0.12), col);
        m.position.set(Math.cos(a) * d, (1 - d) * rr(ctx, 0.05, 0.35), Math.sin(a) * d);
        m.rotation.set(rr(ctx, -0.6, 0.6), rr(ctx, 0, TAU), rr(ctx, -0.6, 0.6));
        g.add(m);
      }
      const stump = ctx.mesh(bevelBox(0.9, 0.35, 0.18, 0.04), tier);
      stump.position.set(-0.35, 0.17, 0.62); stump.rotation.y = 0.1; g.add(stump);
      return g;
    }
  },
  {
    id: "rubble-embers", name: "Embers", category: "rubble", biome: "city", tags: ["light source", "destruction"],
    notes: "A dozen small burning chunks; emissive (glow \"ember\").",
    build(ctx) {
      const g = new THREE.Group(), mat = ctx.glow("ember");
      for (let k = 0; k < 12; k++) {
        const a = rr(ctx, 0, TAU), d = Math.pow(ctx.rnd(), 0.8) * 0.6, s = rr(ctx, 0.05, 0.12);
        const m = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(s, 0), s * 0.2, k + ctx.rnd() * 10), mat);
        m.position.set(Math.cos(a) * d, 0.02 + (1 - d) * rr(ctx, 0.05, 0.3), Math.sin(a) * d); g.add(m);
      }
      return g;
    }
  },
  {
    id: "fx-dust", name: "Dust puff", category: "fx", biome: "any", tags: ["effect"],
    notes: "One faceted puff; a page scales it up and away.",
    build(ctx) {
      const m = new THREE.Mesh(puffGeometry(), ctx.mat ? ctx.mat(0xece2cc, { roughness: 1 }) : undefined);
      m.scale.setScalar(0.25); m.position.y = 0.25;
      const g = new THREE.Group(); g.add(m); return g;
    }
  },
  // ---- the village set: the ground a hub's doors stand on (lab/village-3d.html) ----
  {
    id: "village-pad", name: "Plaza pad", category: "village", biome: "any", tags: ["ground", "hub"],
    notes: "A round paved pad with a stone rim, the 3D village's answer to the painted pads a 2D hub stands its houses on. opts.r is its radius.",
    build(ctx, opts = {}) {
      const g = new THREE.Group(), r = opts.r || 1.3;
      const rim = ctx.mesh(new THREE.CylinderGeometry(r + 0.08, r + 0.12, 0.07, 28), 0xb9b3a8);
      rim.position.y = 0.035; g.add(rim);
      const top = ctx.mesh(new THREE.CylinderGeometry(r, r, 0.09, 28), 0xd2ccc1);
      top.position.y = 0.045; g.add(top);
      // a ring of flagstones inside the rim, so the pad reads as laid rather than poured
      const n = Math.max(10, Math.round(r * 10));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU, s = ctx.mesh(bevelBox(0.22, 0.03, 0.14, 0.01), 0xe7e1d5);
        s.position.set(Math.cos(a) * (r - 0.16), 0.095, Math.sin(a) * (r - 0.16)); s.rotation.y = -a; g.add(s);
      }
      return g;
    }
  },
  {
    id: "village-path", name: "Flagstone path", category: "village", biome: "any", tags: ["ground", "hub"],
    notes: "Five uneven flat stones along z, 2 long: laid end to end, they lead from one door to the next.",
    build(ctx) {
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const w = rr(ctx, 0.42, 0.6), d = rr(ctx, 0.28, 0.36);
        const s = ctx.mesh(bevelBox(w, 0.05, d, 0.015), pick(ctx, [0xd2ccc1, 0xb9b3a8, 0xe7e1d5]));
        s.position.set(rr(ctx, -0.08, 0.08), 0.025, -0.8 + i * 0.4); s.rotation.y = rr(ctx, -0.25, 0.25); g.add(s);
      }
      return g;
    }
  },
  {
    id: "village-lamp", name: "Lamp post", category: "village", biome: "any", tags: ["hub", "light source"],
    notes: "A post, an arm and a lantern; the lantern is emissive (glow \"lamp\"), so the page lights it by night.",
    build(ctx) {
      const g = new THREE.Group();
      const base = ctx.mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.12, 8), 0x52595d); base.position.y = 0.06; g.add(base);
      const post = ctx.mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.3, 8), 0x52595d); post.position.y = 0.77; g.add(post);
      const cap = ctx.mesh(new THREE.ConeGeometry(0.13, 0.12, 6), 0x404040); cap.position.y = 1.62; g.add(cap);
      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.18, 6), ctx.glow("lamp"));
      lantern.position.y = 1.48; g.add(lantern);
      const frame = ctx.mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 6), 0x404040); frame.position.y = 1.4; g.add(frame);
      return g;
    }
  },
  {
    id: "village-fence", name: "Wooden fence", category: "village", biome: "any", tags: ["hub", "border"],
    notes: "Three posts and two rails, 2 long along x: the edge of a garden or of the island.",
    build(ctx) {
      const g = new THREE.Group(), seed = ctx.rnd() * 100;
      for (const x of [-0.95, 0, 0.95]) {
        const p = ctx.mesh(jitter(bevelBox(0.09, 0.55, 0.09, 0.015), 0.01, seed + x), 0x8c4b38);
        p.position.set(x, 0.275, 0); p.rotation.z = rr(ctx, -0.05, 0.05); g.add(p);
      }
      for (const y of [0.22, 0.42]) {
        const r = ctx.mesh(bevelBox(2.05, 0.06, 0.04, 0.012), 0x9b5a45);
        r.position.set(0, y, 0.05); r.rotation.z = rr(ctx, -0.02, 0.02); g.add(r);
      }
      return g;
    }
  },
  {
    id: "village-flag", name: "Banner pole", category: "village", biome: "any", tags: ["hub"],
    notes: "A pole with a swallow-tailed banner; opts.color is the banner's colour (the game's accent on a page that has one).",
    build(ctx, opts = {}) {
      const g = new THREE.Group();
      const pole = ctx.mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.2, 8), 0xe7e1d5); pole.position.y = 1.1; g.add(pole);
      const knob = ctx.mesh(new THREE.SphereGeometry(0.06, 8, 6), 0xf5cb60); knob.position.y = 2.24; g.add(knob);
      const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.75, 0); s.lineTo(0.55, -0.22); s.lineTo(0.75, -0.44); s.lineTo(0, -0.44); s.closePath();
      const banner = ctx.mesh(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }), opts.color || 0xdf4043);
      banner.position.set(0.03, 2.1, -0.01); g.add(banner);
      return g;
    }
  },
  ...HOUSES,
  ...BUILDINGS
];
export const item = (id) => ITEMS.find((i) => i.id === id);

// =============================================================================
// THE BIOME — one weathering pass for any object, the kit's as much as ours
// =============================================================================
// What makes a set of objects read as ONE place is less their shapes than what
// the place has done to them: moss on every ledge, snow on every roof, dust
// up every wall. That is a rule about surfaces, not about models, so it is
// written once and laid over everything a scene shows — a downloaded model and
// a code-made one alike, which is what unifies the two.
//
// Two halves that agree:
//  - weather(material) patches a MeshStandardMaterial's shader: in the frame
//    the page names (WEATHER.uWFrame — the world, or a turntable), the faces
//    turned up take the biome's top colour, the walls take its side colour
//    from the ground up, the foot of everything its grime, all of it cut by
//    one noise into patches with crisp edges;
//  - tufts(root, biome, ctx) adds the relief the shader cannot: clumps of moss,
//    lumps of snow, pebbles — placed where that same noise lets the patches be,
//    since the noise is an integer hash both GLSL and JS compute bit for bit.
// A biome is a row of BIOMES; setBiome(name, amount) is the only switch.
export const BIOMES = {
  none: null,
  moss: { top: 0x5a7a34, topCover: 0.5, ground: 0.2, topUp: 0.5, side: 0x3f6230, sideCover: 0.3, sideH: 0.6,
    base: 0x4a4632, baseAmt: 0.35, baseH: 0.45, scale: 3, tuft: "moss", density: 70 },
  snow: { top: 0xf2f6fb, topCover: 0.9, ground: 0.8, topUp: 0.3, side: 0xe6edf5, sideCover: 0.3, sideH: 0.16,
    base: 0x9fb3c8, baseAmt: 0.12, baseH: 0.3, scale: 2.8, tuft: "snow", density: 30 },
  dust: { top: 0xd9c08f, topCover: 0.35, ground: 0.15, topUp: 0.6, side: 0xc7a571, sideCover: 0.28, sideH: 0.3,
    base: 0xb08a5a, baseAmt: 0.6, baseH: 0.7, scale: 4, tuft: "pebble", density: 30 }
};
export const WEATHER = {
  uWAmount: { value: 0 }, uWScale: { value: 2.5 }, uWFrame: { value: new THREE.Matrix4() },
  uWTop: { value: new THREE.Color() }, uWTopCover: { value: 0 }, uWTopUp: { value: 0.5 }, uWGround: { value: 1 },
  uWSide: { value: new THREE.Color() }, uWSideCover: { value: 0 }, uWSideH: { value: 1 },
  uWBase: { value: new THREE.Color() }, uWBaseAmt: { value: 0 }, uWBaseH: { value: 0.5 }
};
export function setBiome(name, amount = 1) {
  const b = BIOMES[name], W = WEATHER;
  W.uWAmount.value = b ? amount : 0;
  if (!b) return;
  W.uWScale.value = b.scale; W.uWTop.value.set(b.top); W.uWTopCover.value = b.topCover; W.uWTopUp.value = b.topUp; W.uWGround.value = b.ground;
  W.uWSide.value.set(b.side); W.uWSideCover.value = b.sideCover; W.uWSideH.value = b.sideH;
  W.uWBase.value.set(b.base); W.uWBaseAmt.value = b.baseAmt; W.uWBaseH.value = b.baseH;
}

const W_GLSL = `
uniform float uWAmount, uWScale, uWTopCover, uWTopUp, uWGround, uWSideCover, uWSideH, uWBaseAmt, uWBaseH;
uniform vec3 uWTop, uWSide, uWBase;
varying vec3 vWPos; varying vec3 vWNrm;
uvec3 wPcg(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
float wHash(vec3 c) { return float(wPcg(uvec3(ivec3(c))).x) / 4294967295.0; }
float wNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wHash(i), wHash(i + vec3(1, 0, 0)), f.x), mix(wHash(i + vec3(0, 1, 0)), wHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(wHash(i + vec3(0, 0, 1)), wHash(i + vec3(1, 0, 1)), f.x), mix(wHash(i + vec3(0, 1, 1)), wHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float wFbm(vec3 p) { return 0.55 * wNoise(p) + 0.3 * wNoise(p * 2.13 + 17.0) + 0.15 * wNoise(p * 4.31 + 41.0); }
`;
// the shader half: call it from a material's onBeforeCompile (weather() does)
export function weatherShader(sh) {
  Object.assign(sh.uniforms, WEATHER);
  sh.vertexShader = sh.vertexShader
    .replace("#include <common>", "#include <common>\nuniform mat4 uWFrame; varying vec3 vWPos; varying vec3 vWNrm;")
    .replace("#include <begin_vertex>", [
      "#include <begin_vertex>",
      "{ vec4 wq = vec4(transformed, 1.0); vec3 wn = objectNormal;",
      "#ifdef USE_INSTANCING",
      "  wq = instanceMatrix * wq; wn = mat3(instanceMatrix) * wn;",
      "#endif",
      "  vWPos = (uWFrame * modelMatrix * wq).xyz; vWNrm = mat3(uWFrame) * mat3(modelMatrix) * wn; }"].join("\n"));
  sh.fragmentShader = sh.fragmentShader
    .replace("#include <common>", "#include <common>\n" + W_GLSL)
    .replace("#include <map_fragment>", [
      "#include <map_fragment>",
      "if (uWAmount > 0.0) {",
      "  float wn = wFbm(vWPos * uWScale), wup = normalize(vWNrm).y, wy = vWPos.y;",
      "  float wg = uWBaseAmt * uWAmount * (1.0 - smoothstep(0.0, uWBaseH, wy)) * (0.55 + 0.45 * wn);",
      "  diffuseColor.rgb = mix(diffuseColor.rgb, uWBase, wg);",
      "  float wsc = uWSideCover * uWAmount, wv = 0.5 * wn + 0.5 * clamp(1.0 - wy / uWSideH, 0.0, 1.0);",
      "  float wsm = smoothstep(1.0 - wsc - 0.025, 1.0 - wsc + 0.025, wv) * (1.0 - smoothstep(0.5, 0.7, abs(wup)));",
      "  diffuseColor.rgb = mix(diffuseColor.rgb, uWSide, wsm);",
      "  float wtc = uWTopCover * uWAmount * mix(uWGround, 1.0, smoothstep(0.15, 0.35, wy));   // the ground takes less than a roof",
      "  float wtm = smoothstep(uWTopUp, uWTopUp + 0.12, wup) * smoothstep(1.0 - wtc - 0.025, 1.0 - wtc + 0.025, wn);",
      "  diffuseColor.rgb = mix(diffuseColor.rgb, uWTop, wtm);",
      "}"].join("\n"));
}
// patch a material, keeping whatever onBeforeCompile it already had
export function weather(m) {
  if (!m || !m.isMeshStandardMaterial || m.userData.weather || m.userData.noWeather) return m;
  m.userData.weather = true;
  const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
  m.onBeforeCompile = function (sh, r) { if (prev) prev.call(this, sh, r); weatherShader(sh); };
  m.customProgramCacheKey = function () { return key.call(this) + "|weather"; };
  m.needsUpdate = true;
  return m;
}

// ---- the same noise in JS, bit for bit (uint32 arithmetic) ------------------------
function wHash(x, y, z) {
  x = (Math.imul(x, 1664525) + 1013904223) >>> 0; y = (Math.imul(y, 1664525) + 1013904223) >>> 0; z = (Math.imul(z, 1664525) + 1013904223) >>> 0;
  x = (x + Math.imul(y, z)) >>> 0; y = (y + Math.imul(z, x)) >>> 0; z = (z + Math.imul(x, y)) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0; y = (y ^ (y >>> 16)) >>> 0; z = (z ^ (z >>> 16)) >>> 0;
  x = (x + Math.imul(y, z)) >>> 0;
  return x / 4294967295;
}
function wNoise(px, py, pz) {
  const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
  let fx = px - ix, fy = py - iy, fz = pz - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const h = (a, b, c) => wHash(ix + a, iy + b, iz + c), mix = (a, b, t) => a + (b - a) * t;
  return mix(mix(mix(h(0, 0, 0), h(1, 0, 0), fx), mix(h(0, 1, 0), h(1, 1, 0), fx), fy),
             mix(mix(h(0, 0, 1), h(1, 0, 1), fx), mix(h(0, 1, 1), h(1, 1, 1), fx), fy), fz);
}
export function wFbm(x, y, z) {
  return 0.55 * wNoise(x, y, z) + 0.3 * wNoise(x * 2.13 + 17, y * 2.13 + 17, z * 2.13 + 17) + 0.15 * wNoise(x * 4.31 + 41, y * 4.31 + 41, z * 4.31 + 41);
}

// ---- the relief: tufts where the patches are ---------------------------------------
// root: the object (already placed); frame: the matrix the shader's uWFrame holds
// (identity for a scene in world space); ctx.mesh paints with the page's palette.
// Returns a group to add to root, or null.
const TUFT_MAX = 500;
export function tufts(root, name, ctx, amount = 1, frame = new THREE.Matrix4()) {
  const b = BIOMES[name];
  if (!b || !b.tuft || amount <= 0) return null;
  root.updateMatrixWorld(true);
  const toLocal = new THREE.Matrix4().multiplyMatrices(frame, root.matrixWorld).invert();
  const rel = new THREE.Matrix4(), bins = new Map(), rnd = mulberry(7);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), Cv = new THREE.Vector3(), N = new THREE.Vector3(), P = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  const sideC = b.sideCover * amount;
  let count = 0;
  const put = (geo, hex) => { if (!bins.has(hex)) bins.set(hex, []); bins.get(hex).push(geo.index ? geo.toNonIndexed() : geo); count++; };
  // one tuft at P (frame space) on a face of normal N
  let foot = 0;
  const tuft = (top) => {
    const s = 0.5 + rnd(), g = new THREE.Group();
    let geo, hex;
    if (b.tuft === "moss" && top) { geo = jitter(new THREE.IcosahedronGeometry(0.035 * s, 0), 0.01, rnd() * 100); geo.scale(1.3, 0.5, 1.3); hex = 0x6aa84f; }
    else if (b.tuft === "moss") {
      const parts = [];
      for (let k = 0; k < 3; k++) { const c = new THREE.ConeGeometry(0.018, 0.06 * s, 4); c.translate((rnd() - 0.5) * 0.04, 0.03 * s, (rnd() - 0.5) * 0.04); parts.push(c.toNonIndexed()); }
      geo = mergeGeometries(parts); hex = 0x5c9c48;
    }
    else if (b.tuft === "snow") { geo = jitter(new THREE.IcosahedronGeometry(0.05 * s, 0), 0.012, rnd() * 100); geo.scale(1.4, top ? 0.35 : 0.5, 1.4); hex = 0xf7f8f9; }
    else { geo = jitter(new THREE.DodecahedronGeometry(0.022 * s, 0), 0.006, rnd() * 100); geo.scale(1, 0.6, 1); hex = rnd() < 0.5 ? 0xa9a297 : 0xe0b98a; }
    geo.rotateY(rnd() * TAU);
    if (top) geo.translate(P.x, P.y, P.z);
    else geo.translate(P.x + N.x * 0.03, foot, P.z + N.z * 0.03);
    geo.applyMatrix4(toLocal);
    put(geo, hex);
  };
  root.traverse((m) => {
    if (!m.isMesh || m.userData.tuft || count >= TUFT_MAX) return;
    rel.multiplyMatrices(frame, m.matrixWorld);
    const pos = m.geometry.attributes.position, idx = m.geometry.index, n = idx ? idx.count : pos.count;
    for (let t = 0; t < n && count < TUFT_MAX; t += 3) {
      A.fromBufferAttribute(pos, idx ? idx.getX(t) : t).applyMatrix4(rel);
      B.fromBufferAttribute(pos, idx ? idx.getX(t + 1) : t + 1).applyMatrix4(rel);
      Cv.fromBufferAttribute(pos, idx ? idx.getX(t + 2) : t + 2).applyMatrix4(rel);
      e1.subVectors(B, A); e2.subVectors(Cv, A); N.crossVectors(e1, e2);
      const area = N.length() / 2; if (area < 1e-5) continue;
      N.normalize();
      foot = Math.min(A.y, B.y, Cv.y);
      const top = N.y > b.topUp + 0.15, low = Math.abs(N.y) < 0.3 && foot < 0.15;
      if (!top && !low) continue;
      let k = area * b.density * amount * (top ? 1 : 0.6);
      while (k > 0 && count < TUFT_MAX) {
        if (k < 1 && rnd() > k) break;
        k -= 1;
        let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
        P.copy(A).addScaledVector(e1, u).addScaledVector(e2, v);
        const nz = wFbm(P.x * b.scale, P.y * b.scale, P.z * b.scale);
        const gk = b.ground + (1 - b.ground) * Math.min(1, Math.max(0, (P.y - 0.15) / 0.2));
        if (top ? nz < 1 - b.topCover * amount * gk + 0.04 : (P.y - foot > 0.08 || 0.5 * nz + 0.5 * Math.max(0, 1 - P.y / b.sideH) < 1 - sideC)) continue;
        tuft(top);
      }
    }
  });
  if (!count) return null;
  const g = new THREE.Group(); g.userData.tuft = true;
  for (const [hex, geos] of bins) { const mesh = ctx.mesh(mergeGeometries(geos), hex); mesh.userData.tuft = true; mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); }
  return g;
}
