#!/usr/bin/env node
/*
  store-meta — the page copy for a game, generated from its manifest.

    node tools/publish/store-meta.mjs --game=vipera
    node tools/publish/store-meta.mjs --all
    node tools/publish/store-meta.mjs --game=vipera --out=dist/meta
    node tools/publish/store-meta.mjs --game=vipera --play    # the Play listing

  butler uploads a build; it cannot touch the page around it. Title, taglines,
  description, tags, the cover image, the screenshots, the embed size and the
  "mobile friendly" checkbox have no public API — they are filled in by hand,
  once per game, in the itch form.

  So this tool does not publish anything: it prints exactly what goes into that
  form, taken from games/<slug>/manifest.json, which is the single source of
  truth for it. Nobody rewrites a tagline in a second place, and two outlets
  cannot drift apart.

  --play prints the OTHER form the same manifest fills: the Google Play store
  listing, which asks for the same copy under different names and different
  hard limits (30 characters of title, 80 of short description, 4000 of full).
  It checks them, because the console refuses the field rather than trimming
  it, and it answers the two questionnaires — content rating and Data safety —
  from what the manifest says the app does: no ads, no account, no network,
  nothing collected. Those answers are a legal declaration, so read them
  against the game before ticking them.
*/

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* The studio's own address, and the only place it is written down. Every
   description ends with a line pointing back at it, so a visitor who lands on
   one itch page can find the other twelve — and so that line is never pasted
   into thirteen forms by hand. Vercel serves the site on the studio's own
   domain, bought at OVH and pointed at the existing project — so this string is
   the one that would change again if the domain ever moved.
   Left empty, the line is simply not printed. */
const SITE = { name: 'Newrare', url: 'https://newrare.app' };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const only = (argv.find((a) => a.startsWith('--game=')) || '').split('=')[1] || null;
const outDir = (argv.find((a) => a.startsWith('--out=')) || '').split('=')[1] || null;
const all = argv.includes('--all');
const play = argv.includes('--play');
/* Both stores hold one set of listing images per locale, and
   `tools/lab/shoot-store.mjs` shoots both — so which set this document names
   is a flag, not a guess. The copy itself is printed in both languages either
   way. */
const lang = (argv.find((a) => a.startsWith('--lang=')) || '').split('=')[1] || 'en';

if (!only && !all) {
  console.error('usage: store-meta.mjs --game=<slug> | --all   [--out=<dir>] [--lang=en|fr] [--play]');
  process.exit(1);
}

/* The long write-up, plus the one line that is the same on all thirteen pages.
   Markdown, because that is what itch's editor takes: it renders the link and
   keeps "Newrare" as its text. */
function description(m, plain) {
  const body = m.description || '';
  if (!SITE.url) return body;
  /* Play's description field is plain text — a markdown link would be printed
     as its own brackets — where itch's editor renders it. Same sentence, one
     shape each. */
  const line = plain
    ? `A ${SITE.name} game — more at ${SITE.url}`
    : `A ${SITE.name} game — more at [${SITE.name}](${SITE.url}).`;
  return [body, '', line].join('\n');
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
/* The dressed listing images: a real frame of play with the game's own
   character, objects and one punchline over it, shot by
   `tools/lab/shoot-store.mjs`. `kind` is which of the three it composes, and
   it is also where the file lives: the phone gallery and the wide `desk`
   pictures are cut to Play's specs and sit in assets/image/google/<lang>/,
   the 630x500 itch cover in assets/image/itch/<lang>/. itch reuses the phone
   gallery — Play is what dictates its size.

   Everything here falls back: a game whose store images have not been shot
   still gets a document, naming the raw captures and the command that dresses
   them. */
function dressed(slug, kind) {
  const store = kind === 'thumb' ? 'itch' : 'google';
  const dir = path.join(ROOT, 'assets', 'image', store, lang);
  if (!existsSync(dir)) return [];
  const re = kind === 'desk' ? new RegExp('^' + slug + '-desk-\\d+\\.(jpg|png)$')
    : kind === 'thumb' ? new RegExp('^' + slug + '-thumb\\.(jpg|png)$')
    : new RegExp('^' + slug + '-\\d+\\.(jpg|png)$');
  return readdirSync(dir).filter((f) => re.test(f)).sort()
    .map((f) => 'assets/image/' + store + '/' + lang + '/' + f);
}

function imageLine(rel, note) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return `\`${rel}\` — **missing**, ${note}`;
  return `\`${rel}\` — ${Math.round(statSync(abs).size / 1024)} KB`;
}

function images(slug) {
  const thumb = dressed(slug, 'thumb')[0];
  const dressedShots = dressed(slug, 'phone');
  const shots = dressedShots.length ? dressedShots
    : readdirSync(path.join(ROOT, 'assets', 'image', 'screen'))
        .filter((f) => f.startsWith(slug + '-') && f.endsWith('.jpg'))
        .sort()
        .map((f) => 'assets/image/screen/' + f);

  const out = [
    '**Cover image** (required, 630×500 — itch crops it to 315×250 in a grid)',
    imageLine(thumb || `assets/image/itch/cover/${slug}.png`,
      `shoot it with \`node tools/lab/shoot-cover.mjs ${slug}\``),
    '',
    '**Screenshots**, in this order — itch shows them in a gallery under the',
    'embed. Upload four or five, not ten.'
  ];
  if (!shots.length) {
    out.push(`No \`assets/image/screen/${slug}-NN.jpg\` yet — shoot them with`,
      `\`node tools/lab/shoot-screens.mjs ${slug}\`.`);
  } else {
    out.push('');
    shots.forEach((f) => out.push(`- ${imageLine(f, '')}`));
    if (!dressedShots.length) {
      out.push('', 'These are raw captures. Dress them with the game\'s own character,',
        `objects and punchline — \`node tools/lab/shoot-store.mjs ${slug}\`.`);
    }
  }
  out.push('',
    '**Icon** — itch has no icon field; the cover carries it. The square art is',
    `\`assets/image/icon/${slug}.png\`, and it becomes a listing asset again on Play.`);
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

/* A field the console will refuse. Play truncates nothing: it rejects the
   form, and the limit is per language, so the FR copy is checked too. */
function fits(label, text, max) {
  const n = (text || '').length;
  if (!text) return `**${label}** — missing`;
  return `${n} / ${max} characters${n > max ? '  \n**Over the limit — the console will refuse it.**' : ''}`;
}

function playImages(slug) {
  /* The dressed gallery if it has been shot — a real frame of play with the
     game's character, its own objects and one punchline over it — and the raw
     captures otherwise. A raw capture is the game's canvas and nothing else,
     which reads as nothing at the size a store card shows it.

     Play holds one graphics set per locale, so which language this document
     names is `--lang=`; the copy below is printed in both either way. */
  const phone = dressed(slug, 'phone');
  const desk = dressed(slug, 'desk');
  const shots = (phone.length
    ? phone
    : readdirSync(path.join(ROOT, 'assets', 'image', 'screen'))
        .filter((f) => f.startsWith(slug + '-') && f.endsWith('.jpg'))
        .sort()
        .map((f) => 'assets/image/screen/' + f)
  ).slice(0, 8);
  const out = [
    '**App icon**, 512×512 PNG — `native/' + slug + '/store/icon-512.png`',
    '(written by `node tools/publish/gen-native.mjs ' + slug + '`)',
    '',
    '**Feature graphic**, 1024×500 — ' + imageLine(`assets/image/google/feature/${slug}.png`,
      `shoot it with \`node tools/lab/shoot-cover.mjs ${slug} --play\``),
    '',
    `**Phone screenshots** (${lang}), 2 to 8, portrait 1080×1920 — Play shows them`,
    'in this order and the first two are what a listing card shows:'
  ];
  if (!shots.length) out.push(`No \`assets/image/screen/${slug}-NN.jpg\` — shoot them with \`node tools/lab/shoot-screens.mjs ${slug}\`.`);
  else {
    shots.forEach((f) => out.push(`- ${imageLine(f, '')}`));
    if (!phone.length) {
      out.push('', 'These are raw captures. Dress them with the game\'s own character,',
        `objects and punchline — \`node tools/lab/shoot-store.mjs ${slug}\` →`,
        `\`assets/image/google/${lang}/\`.`);
    }
  }
  /* The tablet slot. Play does not require it, but a listing that fills it is
     the only one that says the game runs on anything but a phone — and it is
     the same picture the web build makes on a wide window. */
  out.push('', '**Tablet screenshots** (7\" and 10\"), landscape 1920×1080 — optional,',
    'and the same two images fill both slots:');
  if (!desk.length) {
    out.push(`None yet — \`node tools/lab/shoot-store.mjs ${slug} --format desk\`.`);
  } else {
    desk.forEach((f) => out.push(`- ${imageLine(f, '')}`));
  }
  return out.join('  \n');
}

/*
  The Play listing, from the same manifest as the itch page.

  Everything here is typed into the console by hand, once per app: `fastlane
  supply` can update a listing but cannot create the app, and neither
  questionnaire has an API at all.
*/
function renderPlay(m) {
  const slug = m.slug;
  const a = m.android || {};
  const ads = a.ads || {};
  const monetized = !!(ads.rewarded || ads.interstitial);
  const en = (m.copy && m.copy.en) || {};
  const fr = (m.copy && m.copy.fr) || {};
  const shortEn = (a.copy && a.copy.en && a.copy.en.short) || en.tagline;
  const shortFr = (a.copy && a.copy.fr && a.copy.fr.short) || fr.tagline;
  const full = description(m, true);

  return [
    `# ${m.title || slug} — Google Play listing`,
    '',
    `Generated by \`node tools/publish/store-meta.mjs --game=${slug} --play\` from`,
    `games/${slug}/manifest.json. The console has no API for any of it.`,
    '',
    section('App', [
      `Application ID: \`${a.appId || '— missing android.appId —'}\``,
      `Version: **${a.versionName || '1.0.0'}** (${a.versionCode || 1})`,
      `Default language: **English (United States)**, second language **French (France)**`,
      `App or game: **Game**  ·  Free or paid: **Free**`,
      `Bundle: \`native/${slug}/android/app/build/outputs/bundle/release/app-release.aab\``,
      '(built by `make android GAME=' + slug + '`)'
    ].join('  \n')),
    section('App name (30 max)', `${m.title || slug}  \n${fits('App name', m.title || slug, 30)}`),
    section('Short description, EN (80 max)', `${shortEn}  \n${fits('Short description', shortEn, 80)}`),
    section('Short description, FR (80 max)', `${shortFr}  \n${fits('Short description FR', shortFr, 80)}`),
    section('Full description (4000 max)', `${full}\n\n${fits('Full description', full, 4000)}`),
    section('Graphics', playImages(slug)),
    section('Category and contact', [
      'Category: **Games → Puzzle** (or Casual — pick the one the game plays as)',
      `Store listing contact e-mail: **contact@${SITE.url.replace('https://', '')}**`,
      `Privacy policy: **${SITE.url}/privacy.html**`,
      `Website: **${SITE.url}**`
    ].join('  \n')),
    section('Content rating questionnaire', [
      'Category: **Game**',
      'Violence, sexuality, language, controlled substances, gambling: **no** to',
      'every question — the game is beads on a dial, it simulates no gambling and',
      'has no in-game currency bought with money.',
      'User-generated content, user interaction, location sharing: **no**.',
      `Ads: **${monetized ? 'yes' : 'no'}** (from \`android.ads\` in the manifest).`
    ].join('  \n')),
    section('Data safety', [
      '**No data collected, no data shared.** The app is offline: it embeds every',
      'asset, makes no network request, has no account, no analytics and no ad SDK.',
      'The best score is written to the WebView\'s own storage on the device and',
      'never leaves it, which Play does not count as collection.',
      '',
      'Data types: **none**. Data shared: **none**. Data collected: **none**.',
      'Data encrypted in transit: **not applicable** (nothing is transmitted).',
      'Deletion request mechanism: **not applicable**.',
      monetized ? '**This app serves ads — the answers above are wrong, redo the form.**' : ''
    ].filter(Boolean).join('  \n')),
    section('The other declarations', [
      'Target audience: **decide before the Data safety form** — declaring an',
      'under-13 audience puts the app under the Families policy.',
      'Ads: **' + (monetized ? 'contains ads' : 'no ads') + '**.',
      'In-app purchases: **none**.',
      'Government app: **no**  ·  Financial features: **none**.',
      'Content guidelines and US export laws: tick both.',
      'News app: **no**  ·  COVID-19 app: **no**.',
      'AI disclosure: the code, the name, the icon, the background art and the',
      'music bed are AI-generated; the sfx (ZapSplat), the pictograms (Lucide)',
      'and the type (OFL) are not — see docs/ASSETS.md.'
    ].join('  \n')),
    section('Release', [
      'Production access is granted **per account, not per app**, and the newrare',
      'account already has an app in production — so the 12-testers /',
      '14-consecutive-days closed test, which gates a personal account\'s *first*',
      'production release, does not apply again here. The console\'s *Production*',
      'page is the authority; check it before planning a closed test anyway.',
      'Internal testing first all the same: it is one upload and it proves the',
      'bundle installs before the listing is locked to a public track.',
      'The first `.aab` goes up by hand; every later one is',
      '`cd native/' + slug + ' && fastlane android beta`.'
    ].join('  \n'))
  ].join('\n');
}

async function main() {
  for (const slug of slugs()) {
    const m = await manifestOf(slug);
    const text = play ? renderPlay(m) : render(m);
    if (outDir) {
      const dir = path.join(ROOT, outDir);
      await mkdir(dir, { recursive: true });
      const file = path.join(dir, `${slug}${play ? '-play' : ''}.md`);
      await writeFile(file, text);
      console.log(`wrote ${path.relative(ROOT, file)}`);
    } else {
      process.stdout.write(text + '\n');
    }
  }
}

main().catch((err) => { console.error('store-meta failed:', err.message); process.exit(1); });
