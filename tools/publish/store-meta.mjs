#!/usr/bin/env node
/*
  store-meta — the page copy for a game, generated from its manifest.

    node tools/publish/store-meta.mjs --game=vipera
    node tools/publish/store-meta.mjs --all
    node tools/publish/store-meta.mjs --game=vipera --out=dist/meta

  butler uploads a build; it cannot touch the page around it. Title, taglines,
  description, tags, the cover image, the screenshots, the embed size and the
  "mobile friendly" checkbox have no public API — they are filled in by hand,
  once per game, in the itch form.

  So this tool does not publish anything: it prints exactly what goes into that
  form, taken from games/<slug>/manifest.json, which is the single source of
  truth for it. Nobody rewrites a tagline in a second place, and two outlets
  cannot drift apart.

  The same text is what a store listing needs later (phase 8), which is why
  this lives in tools/publish/ and not in the itch script.
*/

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* The studio's own address, and the only place it is written down. Every
   description ends with a line pointing back at it, so a visitor who lands on
   one itch page can find the other twelve — and so that line is never pasted
   into thirteen forms by hand. Vercel serves the site; the domain is deferred
   (see TODO.md, phase 3), and replacing this string is the whole migration.
   Left empty, the line is simply not printed. */
const SITE = { name: 'Newrare', url: 'https://newrare-website.vercel.app' };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const only = (argv.find((a) => a.startsWith('--game=')) || '').split('=')[1] || null;
const outDir = (argv.find((a) => a.startsWith('--out=')) || '').split('=')[1] || null;
const all = argv.includes('--all');

if (!only && !all) {
  console.error('usage: store-meta.mjs --game=<slug> | --all   [--out=<dir>]');
  process.exit(1);
}

/* The long write-up, plus the one line that is the same on all thirteen pages.
   Markdown, because that is what itch's editor takes: it renders the link and
   keeps "Newrare" as its text. */
function description(m) {
  const body = m.description || '';
  if (!SITE.url) return body;
  return [body, '', `A ${SITE.name} game — more at [${SITE.name}](${SITE.url}).`].join('\n');
}

function slugs() {
  if (only) return [only];
  return readdirSync(path.join(ROOT, 'games'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((s) => existsSync(path.join(ROOT, 'games', s, 'manifest.json')))
    .sort();
}

async function manifestOf(slug) {
  const file = path.join(ROOT, 'games', slug, 'manifest.json');
  if (!existsSync(file)) throw new Error(`${slug}: no manifest.json`);
  return JSON.parse(await readFile(file, 'utf8'));
}

/* The tags for the itch form, from `itch.tags` in the manifest.

   NOT `copy.<lang>.tags`, which this used to print: those three phrases per
   language are the site's card copy ("Tap to swerve", "Armour") and there is
   no field on itch that wants them. An itch tag only earns its place if it
   matches one itch already has, because what a tag does is put the page on a
   browse list — so the form's autocomplete is the check: type a tag, and if
   nothing is proposed, drop it.

   Two kinds of tag do not belong here at all: the genre and the platform,
   which the form asks for in their own fields. */
function tagLine(m) {
  const tags = (m.itch && m.itch.tags) || [];
  if (!tags.length) {
    return `No \`itch.tags\` in games/${m.slug}/manifest.json — add them there, once.`;
  }
  return tags.join(', ') + (tags.length > 10 ? '  \n**Over itch\'s limit of 10.**' : '');
}

function section(title, body) {
  return `## ${title}\n\n${body || '—'}\n`;
}

/* The images the itch form asks for, named as files on disk rather than
   described: the cover is required, and a project with no screenshots is a
   page nobody clicks. Both are generated — the copy in this document is
   useless without them, which is why they are part of it.

   itch has no icon field: an HTML project is identified by its cover, and the
   icon is what the cover is built out of. The square icon becomes a listing
   asset again on Play (phase 8). */
function imageLine(rel, note) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return `\`${rel}\` — **missing**, ${note}`;
  return `\`${rel}\` — ${Math.round(statSync(abs).size / 1024)} KB`;
}

function images(slug) {
  const shots = readdirSync(path.join(ROOT, 'assets', 'screen'))
    .filter((f) => f.startsWith(slug + '-') && f.endsWith('.jpg'))
    .sort();

  const out = [
    '**Cover image** (required, 630×500 — itch crops it to 315×250 in a grid)',
    imageLine(`assets/cover/${slug}.png`,
      `shoot it with \`node tools/lab/shoot-cover.mjs ${slug}\``),
    '',
    '**Screenshots**, in this order — they are portrait 720×1280, and itch shows',
    'them in a gallery under the embed. Upload four or five, not ten: the last',
    'one is the end screen.'
  ];
  if (!shots.length) {
    out.push(`No \`assets/screen/${slug}-NN.jpg\` yet — shoot them with`,
      `\`node tools/lab/shoot-screens.mjs ${slug}\`.`);
  } else {
    out.push('');
    shots.forEach((f) => out.push(`- ${imageLine('assets/screen/' + f, '')}`));
  }
  out.push('',
    '**Icon** — itch has no icon field; the cover carries it. The square art is',
    `\`assets/icon/${slug}.png\`, and it becomes a listing asset again on Play.`);
  return out.join('  \n');
}

function render(m) {
  const slug = m.slug;
  const itch = m.itch || {};
  const vp = Array.isArray(itch.viewport) ? itch.viewport : [450, 800];
  const en = (m.copy && m.copy.en) || {};
  const fr = (m.copy && m.copy.fr) || {};
  const project = itch.project || m.slug;
  const user = itch.user || 'newrare';
  const channel = itch.channel || 'html5';

  /* The two fields itch itself calls "short description" and "description".
     The long one is the manifest's `description`, written in English, which is
     the same text the site's gallery shows. */
  return [
    `# ${m.title || m.slug} — itch.io page`,
    '',
    `Generated by \`node tools/publish/store-meta.mjs --game=${m.slug}\` from`,
    `games/${m.slug}/manifest.json. Paste it into the itch form; nothing here is`,
    'pushed automatically, because itch has no public API for a page.',
    '',
    section('Title', m.title || m.slug),
    section('Short description (EN)', en.tagline || m.tagline),
    section('Short description (FR)', fr.tagline),
    section('Description', description(m)),
    section('Tags', tagLine(m)),
    section('Images', images(slug)),
    section('Embed', [
      'Kind of project: **HTML**',
      'Embed in page, with a fullscreen button',
      `Viewport: **${vp[0]} × ${vp[1]}** (portrait, the game is authored at 720×1280)`,
      `Mobile friendly: **${itch.mobileFriendly === false ? 'no' : 'yes'}**`,
      'Automatically start on page load: **no** (the menu is the first screen)',
      'Enable scrollbars: **no**'
    ].join('  \n')),
    section('Colours', [
      `Background: \`${(m.theme && m.theme.bg) || '#0a0a1c'}\``,
      `Accent: \`${(m.theme && m.theme.accent) || '—'}\``
    ].join('  \n')),
    section('Build', [
      '```bash',
      `node tools/build/build.mjs --target=web --dest=itch --game=${m.slug}`,
      `node tools/publish/deploy-itch.mjs --game=${m.slug}     # → ${user}/${project}:${channel}`,
      '```'
    ].join('\n')),
    section('Classification', [
      'Release status: **Released**',
      'Pricing: **free**, no payments',
      'Genre: **Action**',
      'Input: touch, mouse, keyboard',
      /* Not a per-game field, because the answer is per kind of asset and it
         is the same for all thirteen: see the provenance table in
         docs/ASSETS.md, which is the record this line is read off. itch
         enforces the disclosure and can delist a page that omits it. */
      'AI disclosure: **Yes** — the code, the name, the icon, the background art'
        + ' and the music bed; not the sfx (ZapSplat), the pictograms (Lucide)'
        + ' or the type (OFL)'
    ].join('  \n'))
  ].join('\n');
}

async function main() {
  for (const slug of slugs()) {
    const m = await manifestOf(slug);
    const text = render(m);
    if (outDir) {
      const dir = path.join(ROOT, outDir);
      await mkdir(dir, { recursive: true });
      const file = path.join(dir, `${slug}.md`);
      await writeFile(file, text);
      console.log(`wrote ${path.relative(ROOT, file)}`);
    } else {
      process.stdout.write(text + '\n');
    }
  }
}

main().catch((err) => { console.error('store-meta failed:', err.message); process.exit(1); });
