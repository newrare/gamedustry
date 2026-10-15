#!/usr/bin/env node
/*
  translate-en — the English a French correction leaves behind, written again.

    node tools/lab/translate-en.mjs "Old FR" "New FR" "Current EN"   # one line, to try it

  A game is written in English and translated into French, but a proofreading
  pass happens in French: the copy desk (lab/game-text.html) opens on FR, and a
  French string corrected there is a question about the English it was made
  from. serve-text.mjs used to leave that question open (TO UPDATE); it now
  asks this module, on the same APPLY, and writes the answer.

  The translator is the local Claude Code CLI (`claude -p`), headless, no tools,
  run from a scratch directory so the repository's CLAUDE.md is not loaded into
  a prompt that only wants a few lines translated. No API key lives in the repo:
  the CLI uses the machine's own login, and on a machine without it the call
  fails and the desk falls back to the TO UPDATE action.

  The brief is an ADAPTATION, not a re-translation: the current English is
  kept when it already says what the new French says, and otherwise moved as
  little as the meaning needs — same markup, same {placeholders}, same spaces
  at either end (a fragment is glued to an expression), normal case.
*/

import { execFile } from 'node:child_process';
import os from 'node:os';

const MODEL = 'sonnet';
const TIMEOUT_MS = 90 * 1000;

const SYSTEM = `You adapt short video game copy from French back into English for a game studio.
Each item gives the English currently shipped, the French it was translated into, and the French as just corrected.
Write the English the corrected French calls for.
Rules:
- If the current English already says what the corrected French says, return it unchanged, byte for byte.
- Otherwise change as little as the meaning requires; keep the tone, the length and the punctuation style.
- Keep every HTML tag and its attributes exactly (<b class="w-...">, <br>), and every {placeholder}.
- Keep leading and trailing spaces exactly: some strings are glued to a number or another string.
- Normal case: a capital on the first letter and on proper nouns only, never a word in capitals.
- One line, no line breaks, no French.
Output ONLY a JSON array of strings, one per item, in the same order. No prose, no code fence.`;

function claude(prompt) {
  return new Promise((resolve, reject) => {
    const child = execFile('claude',
      ['-p', '--model', MODEL, '--tools', '', '--no-session-persistence', '--system-prompt', SYSTEM],
      { cwd: os.tmpdir(), timeout: TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout, stderr) => (err ? reject(new Error(String(stderr || err.message).trim().split('\n')[0])) : resolve(stdout)));
    child.stdin.end(prompt);
  });
}

/**
 * @param {string} game  the game's title, for tone
 * @param {Array<{en:string, frOld:string, frNew:string, where?:string}>} items
 * @returns {Promise<string[]>} the English for each item, same order
 */
export async function translateToEnglish(game, items) {
  if (!items.length) return [];
  const prompt = `Game: ${game}\n\n` + items.map((it, i) =>
    `Item ${i + 1}${it.where ? ` (shown on: ${it.where})` : ''}\n` +
    `  current English: ${JSON.stringify(it.en)}\n` +
    `  French before:   ${JSON.stringify(it.frOld)}\n` +
    `  French now:      ${JSON.stringify(it.frNew)}`).join('\n\n');
  const raw = await claude(prompt);
  const m = /\[[\s\S]*\]/.exec(raw);
  if (!m) throw new Error('the translator returned no JSON array');
  const out = JSON.parse(m[0]);
  if (!Array.isArray(out) || out.length !== items.length || out.some((s) => typeof s !== 'string')) {
    throw new Error(`the translator returned ${Array.isArray(out) ? out.length : 'no'} strings for ${items.length}`);
  }
  // A line break would be refused by apply-text; a break in game copy is <br>.
  return out.map((s) => s.replace(/[\r\n]+/g, ' '));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [frOld, frNew, en] = process.argv.slice(2);
  if (!frNew || en == null) {
    console.log('usage: node tools/lab/translate-en.mjs "<old FR>" "<new FR>" "<current EN>"');
    process.exit(1);
  }
  console.log((await translateToEnglish('a game', [{ en, frOld, frNew }]))[0]);
}
