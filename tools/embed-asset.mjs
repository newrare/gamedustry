#!/usr/bin/env node
/**
 * embed-asset.mjs — turn a binary asset into an inlined data URI.
 *
 * Playable ads must be a single self-contained HTML file with no network
 * requests, so every image/sound/font is embedded as a base64 data URI in
 * the ASSETS registry. This helper prints the string to paste there.
 *
 * Usage:
 *   node tools/embed-asset.mjs path/to/logo.png
 *   node tools/embed-asset.mjs path/to/pop.mp3 --key pop
 *
 * Tip: prefer canvas/CSS drawing and WebAudio synth over binary assets.
 * Only embed what you truly need — the whole file must stay under 5 MB, and
 * base64 inflates size by ~33%.
 */
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";

const MIME = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav",
  ".m4a": "audio/mp4", ".woff2": "font/woff2", ".woff": "font/woff",
};

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const keyFlag = args.indexOf("--key");
if (!file) {
  console.error("Usage: node tools/embed-asset.mjs <file> [--key name]");
  process.exit(1);
}

const ext = extname(file).toLowerCase();
const mime = MIME[ext];
if (!mime) {
  console.error(`Unknown extension "${ext}". Supported: ${Object.keys(MIME).join(", ")}`);
  process.exit(1);
}

const buf = readFileSync(file);
const dataUri = `data:${mime};base64,${buf.toString("base64")}`;
const key = keyFlag !== -1 ? args[keyFlag + 1] : basename(file, ext);
const kb = (dataUri.length / 1024).toFixed(1);
const bucket = mime.startsWith("image") ? "images" : mime.startsWith("audio") ? "sounds" : "fonts";

console.error(`\n// ${file} -> ${bucket}.${key}  (~${kb} KB as data URI)`);
console.error(`// Paste this line inside the ASSETS.${bucket} object:\n`);
console.log(`"${key}": "${dataUri}",`);
