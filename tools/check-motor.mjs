#!/usr/bin/env node
/**
 * check-motor.mjs — verify every game still shares the same motor.
 *
 * The repo's core invariant (see docs/ENGINE.md): a game owns only its CONFIG,
 * its ASSETS, its SKIN block and its GAME module. The shared parts must be
 * byte-identical to template/game-template.html:
 *
 *   - script sections 3 (ENGINE), 4 (AD GLUE) and 5 (SHELL)
 *   - script section 7 (BOOTSTRAP)
 *   - the whole stylesheet up to the game's "SKIN —" comment block
 *
 * Usage:
 *   node tools/check-motor.mjs           # report drift, exit 1 if any
 *   node tools/check-motor.mjs --fix     # rewrite the games from the template
 *
 * Run it after touching the template, and after any change to a game that
 * strayed outside its own sections.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const TEMPLATE = "template/game-template.html";
const fix = process.argv.includes("--fix");

const banner = (n, title) =>
  `  /* ===================================================================\n     ${n}. ${title}`;
const M3 = banner(3, "ENGINE");
const M6 = banner(6, "GAME");
const M7 = banner(7, "BOOTSTRAP");
const SCRIPT_END = "})();\n</script>";
const SKIN_MARK = "     SKIN — ";

function slice(html, from, to, what, file) {
  const a = html.indexOf(from), b = html.indexOf(to);
  if (a < 0 || b < 0 || b < a) throw new Error(`${file}: cannot locate ${what}`);
  return { pre: html.slice(0, a), mid: html.slice(a, b), post: html.slice(b) };
}

function styleBlock(html, file) {
  const a = html.indexOf("<style>");
  const b = html.indexOf("</style>");
  if (a < 0 || b < 0) throw new Error(`${file}: no <style> block`);
  return { pre: html.slice(0, a + 7), css: html.slice(a + 7, b), post: html.slice(b) };
}

const tpl = readFileSync(TEMPLATE, "utf8");
const wantMotor = slice(tpl, M3, M6, "sections 3-5", TEMPLATE).mid;
const wantBoot = slice(tpl, M7, SCRIPT_END, "section 7", TEMPLATE).mid;
const wantCss = styleBlock(tpl, TEMPLATE).css;

const games = existsSync("games")
  ? readdirSync("games", { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => join("games", d.name, "index.html"))
      .filter(existsSync)
  : [];

if (games.length === 0) { console.log("No games found."); process.exit(0); }

let drift = 0;
for (const file of games) {
  let html = readFileSync(file, "utf8");
  const problems = [];

  const motor = slice(html, M3, M6, "sections 3-5", file);
  if (motor.mid !== wantMotor) problems.push("ENGINE/AD GLUE/SHELL");
  const boot = slice(html, M7, SCRIPT_END, "section 7", file);
  if (boot.mid !== wantBoot) problems.push("BOOTSTRAP");

  const st = styleBlock(html, file);
  const skinAt = st.css.indexOf(SKIN_MARK);
  if (skinAt < 0) problems.push('stylesheet (no "SKIN —" block)');
  else {
    // the skin block starts at the comment opener that precedes the marker
    const start = st.css.lastIndexOf("/*", skinAt);
    const shared = st.css.slice(0, start).replace(/\s+$/, "");
    if (shared !== wantCss.replace(/\s+$/, "")) problems.push("stylesheet");
  }

  if (problems.length === 0) { console.log(`OK    ${file}`); continue; }
  drift++;
  console.log(`DRIFT ${file}  →  ${problems.join(", ")}`);

  if (!fix) continue;
  if (skinAt < 0) { console.log(`      cannot fix the stylesheet without a SKIN block`); }
  else {
    const start = st.css.lastIndexOf("/*", skinAt);
    const skin = st.css.slice(start).replace(/\s+$/, "");
    html = st.pre + wantCss + "\n  " + skin + "\n" + st.post;
  }
  let a = slice(html, M3, M6, "sections 3-5", file);
  html = a.pre + wantMotor + a.post;
  let b = slice(html, M7, SCRIPT_END, "section 7", file);
  html = b.pre + wantBoot + b.post;
  writeFileSync(file, html);
  console.log(`      fixed from ${TEMPLATE}`);
}

if (drift === 0) console.log("\nEvery game shares the template motor.");
else if (fix) console.log(`\n${drift} game(s) rewritten — re-test them in a browser.`);
else console.log(`\n${drift} game(s) drifted. Re-run with --fix, or move the change into the template.`);
process.exit(drift && !fix ? 1 : 0);
