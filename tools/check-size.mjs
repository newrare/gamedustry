#!/usr/bin/env node
/**
 * check-size.mjs — verify every game HTML file is under the size budget.
 *
 * Ad networks reject creatives above their limit (commonly 5 MB, some as low
 * as 2 MB). Run this before shipping.
 *
 * Usage:
 *   node tools/check-size.mjs                 # scan games/ (default 5 MB)
 *   node tools/check-size.mjs games/x/index.html
 *   node tools/check-size.mjs --limit 2       # 2 MB budget
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const limitFlag = args.indexOf("--limit");
const limitMB = limitFlag !== -1 ? parseFloat(args[limitFlag + 1]) : 5;
const limitBytes = limitMB * 1024 * 1024;
const explicit = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--limit");

function findHtml(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) findHtml(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
}

let files = explicit;
if (files.length === 0) {
  files = [];
  try { findHtml("games", files); } catch { /* no games dir */ }
}

if (files.length === 0) { console.log("No HTML files found."); process.exit(0); }

let failed = 0;
console.log(`Budget: ${limitMB} MB\n`);
for (const f of files) {
  const bytes = statSync(f).size;
  const mb = (bytes / 1024 / 1024).toFixed(2);
  const ok = bytes <= limitBytes;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${mb.padStart(6)} MB  ${f}`);
}
console.log(failed === 0 ? "\nAll files within budget." : `\n${failed} file(s) OVER budget.`);
process.exit(failed === 0 ? 0 : 1);
