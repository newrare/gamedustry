#!/usr/bin/env node
/*
  apply-text — write a corrected string back where the game keeps it.

    node tools/lab/apply-text.mjs vipera --set 'game.js:config.copy.replay=Slither again'
    node tools/lab/apply-text.mjs vipera --set 'manifest.json:copy.fr.tags.1=Sans fin' --dry

  lab/game-text.html is where a game's copy is read as copy; this is the half
  that makes a correction stick. One row is one string, and a row knows every
  place that string is written:

    manifest.json   the value's span in the raw JSON, spliced — never
                    re-serialized, so the file keeps its own formatting
    game.js         the STRING LITERAL's own span, so a ternary, a
                    concatenation, the comments and the indentation around it
                    come back exactly as they were
    page.html       the intro title and the intro tagline ride on their CONFIG
                    row and are written WITH it. The shell rewrites both from
                    CONFIG at boot, so page.html is a mirror: writing one and
                    not the other is the desync CLAUDE.md asks to avoid, and it
                    is the one thing a proofreading pass would never notice.

  A row whose text appears at several call sites — "Length", the HUD's left
  label, written at three — is written at all of them, which is the reason
  scan-text merges them into one row in the first place.

  Two guards, and they are what makes a tool allowed to write into a game:

    - **The page's value has to still be the file's value.** Every edit carries
      the string the page READ (`was`); if the file has moved since, the edit is
      refused by name rather than spliced over something else.
    - **One line, always.** A game's copy is a single line of source; a break is
      `<br>`, which is what the taglines already use. A newline is refused.

  The version moves with the source (CLAUDE.md: touching a game's sources means
  moving its version in the same change), which is what `--no-bump` turns off.
  Nothing here rebuilds: `node tools/update.mjs` does, and serve-text.mjs runs
  the one game's build itself right after a write.
*/

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, scanText, games, htmlEscape } from './scan-text.mjs';
import { splice, bumpPatch } from './apply-events.mjs';

/* How a string is written back, per file. The span a row carries already sits
   where the value is, quotes included for the two source languages. */
function encode(target, text) {
  if (target.kind === 'html') return target.escape ? htmlEscape(text) : text;
  return JSON.stringify(text);                      // valid for both JSON and ES5
}

/**
 * @param {string} slug
 * @param {{edits?: Array<{id:string, was?:string, text:string}>, bump?: boolean, dry?: boolean}} plan
 */
export async function applyText(slug, plan) {
  const { edits = [], bump = true, dry = false } = plan || {};
  const dir = path.join(ROOT, 'games', slug);
  const scan = await scanText(slug);
  const byId = new Map(scan.rows.map((r) => [r.id, r]));

  const applied = [], skipped = [];
  const perFile = new Map();                         // file → [{start,end,text,what}]

  for (const edit of edits) {
    const row = byId.get(edit.id);
    const label = row ? `${row.context} (${row.lang.toUpperCase()})` : edit.id;
    if (!row) { skipped.push(`${edit.id}: no such string — the sources moved under the tool`); continue; }
    if (edit.was != null && edit.was !== row.text) {
      skipped.push(`${label}: the file now reads "${row.text}" — not overwritten`);
      continue;
    }
    /* Nothing to do — unless page.html has drifted from CONFIG, in which case
       writing the CONFIG value everywhere is exactly the repair. */
    if (edit.text === row.text && row.desync == null) continue;
    if (/[\r\n]/.test(edit.text)) {
      skipped.push(`${label}: a game's copy is one line — write a break as <br>`);
      continue;
    }
    for (const t of row.targets) {
      if (!perFile.has(t.file)) perFile.set(t.file, []);
      perFile.get(t.file).push({ start: t.start, end: t.end, text: encode(t, edit.text), what: label });
    }
    applied.push({ what: label, where: row.targets.map((t) => (t.line ? `${t.file}:${t.line}` : t.file)).join(' '),
      from: row.text, to: edit.text });
  }

  /* One splice per file, back to front, with overlaps refused and named —
     the same pass tools/lab/apply-events.mjs writes a call argument with. */
  const written = [];
  for (const [file, list] of perFile) {
    const full = path.join(dir, file);
    const src = await readFile(full, 'utf8');
    const out = splice(src, list, skipped);
    if (out === src) continue;
    if (!dry) await writeFile(full, out);
    written.push(file);
  }

  let version = null;
  if (written.length && !dry && bump) {
    const mf = path.join(dir, 'manifest.json');
    try {
      const raw = await readFile(mf, 'utf8');
      const next = bumpPatch(JSON.parse(raw).version);
      if (next) { await writeFile(mf, raw.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${next}"`)); version = next; }
    } catch { skipped.push('manifest.json: version not moved'); }
  }

  return { slug, applied, skipped, written, version };
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const slug = argv.find((a) => !a.startsWith('-'));
  const all = (name) => argv.map((a, i) => (a === '--' + name ? argv[i + 1] : null)).filter(Boolean);

  if (!slug || !(await games()).includes(slug)) {
    console.log("usage: node tools/lab/apply-text.mjs <slug> --set '<id>=<text>' [--no-bump] [--dry]");
    console.log('       the ids are what `node tools/lab/scan-text.mjs <slug> --json` prints');
    console.log('       games: ' + (await games()).join(' '));
    process.exit(1);
  }

  const edits = [];
  for (const spec of all('set')) {
    const at = spec.indexOf('=');
    if (at < 0) { console.error(`  ? cannot read "${spec}" — expected <id>=<text>`); continue; }
    edits.push({ id: spec.slice(0, at), text: spec.slice(at + 1) });
  }

  const res = await applyText(slug, { edits, bump: !argv.includes('--no-bump'), dry: argv.includes('--dry') });
  for (const a of res.applied) console.log(`  ✓ ${a.what}\n      "${a.from}"\n   →  "${a.to}"   ${a.where}`);
  for (const s of res.skipped) console.log('  ! ' + s);
  if (res.version) console.log(`  version → ${res.version}`);
  if (!res.applied.length) console.log('  nothing to apply');
  else if (res.written.length) console.log(`  written ${res.written.join(', ')} — rebuild with: node tools/build/build.mjs --game=${slug}`);
}
