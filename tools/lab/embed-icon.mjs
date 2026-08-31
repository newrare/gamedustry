#!/usr/bin/env node
/**
 * embed-icon.mjs — turn a Lucide icon into an inlined, tintable data URI.
 *
 * The repo ships a curated slice of the Lucide pack in assets/lucide/ (see
 * assets/lucide/README.md). A game embeds only the handful of icons it needs,
 * as base64 SVG data URIs in ASSETS.images, and draws them through the motor's
 * `Icon` helper (section 3), which tints them at any colour.
 *
 * What this does to the raw Lucide file:
 *   - drops the licence comment, the class attribute and every newline;
 *   - rewrites width/height to --size, keeping the 24x24 viewBox, so the SVG
 *     rasterizes crisply at the size the game actually draws it (an <img>
 *     scaled up from its 24 px intrinsic size is blurry in some WebViews);
 *   - replaces stroke="currentColor" with --color (white by default), because
 *     currentColor has nothing to resolve against inside an <img>. Keep it
 *     white and let Icon.get(key, size, colour) tint it per use;
 *   - bumps stroke-width to --stroke, since a hairline vanishes on a 42 px
 *     brick.
 *
 * Usage:
 *   node tools/lab/embed-icon.mjs bomb                       # from assets/lucide
 *   node tools/lab/embed-icon.mjs arrow-left-right --key icoRow
 *   node tools/lab/embed-icon.mjs bomb --size 128 --stroke 2.6 --color "#ffd43b"
 *   node tools/lab/embed-icon.mjs path/to/custom.svg --key icoThing
 */
import { readFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";

const PACK = "assets/lucide";

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
const flag = (f, dflt) => {
  const i = args.indexOf("--" + f);
  return i !== -1 && args[i + 1] ? args[i + 1] : dflt;
};
if (!name) {
  console.error("Usage: node tools/lab/embed-icon.mjs <lucide-name|file.svg> [--key k] [--size 96] [--stroke 2.2] [--color '#ffffff']");
  process.exit(1);
}

const file = name.endsWith(".svg") ? name : join(PACK, name + ".svg");
if (!existsSync(file)) {
  console.error(`No such icon: ${file}\nBrowse the pack with: ls ${PACK}`);
  process.exit(1);
}

const size = flag("size", "96");
const stroke = flag("stroke", "2.2");
const color = flag("color", "#ffffff");
// camelCase the key so it reads as an ASSETS.images entry: bomb -> icoBomb.
const stem = basename(file, ".svg");
const key = flag("key", "ico" + stem.replace(/(^|-)([a-z0-9])/g, (m, d, c) => c.toUpperCase()));

const svg = readFileSync(file, "utf8")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/\s*class="[^"]*"/, "")
  .replace(/width="24"/, `width="${size}"`)
  .replace(/height="24"/, `height="${size}"`)
  .replace(/stroke="currentColor"/, `stroke="${color}"`)
  .replace(/stroke-width="2"/, `stroke-width="${stroke}"`)
  .replace(/\s*\n\s*/g, " ")
  .trim();

const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
const kb = (dataUri.length / 1024).toFixed(1);

console.error(`\n// ${file} -> images.${key}  (${size}px, stroke ${stroke}, ~${kb} KB as data URI)`);
console.error(`// Paste this line inside the ASSETS.images object:\n`);
console.log(`"${key}": "${dataUri}",`);
