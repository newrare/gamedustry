#!/usr/bin/env node
/*
  gen-native — the manifest turned into a Capacitor project.

    node tools/publish/gen-native.mjs radiam
    node tools/publish/gen-native.mjs radiam --clean      # from scratch
    node tools/publish/gen-native.mjs radiam --no-install # patches only

  It writes `native/<slug>/`, which is a BUILD OUTPUT the way
  `games/<slug>/index.html` is: everything in it is derived from
  `games/<slug>/manifest.json`, from `assets/image/icon/<slug>.png` and from the
  android build, so it is gitignored and can be deleted at any time. Nothing
  is ever edited in there by hand — a change that has to survive belongs in
  the manifest or in this file.

  What it does, in order:

    1. `build.mjs --target=android` → dist/android/<slug>/index.html, the one
       self-contained document Capacitor wraps
    2. package.json + capacitor.config.json, from the manifest
    3. `npm install`, then `npx cap add android` the first time
    4. the launcher icons, from assets/image/icon/<slug>.png through
       @capacitor/assets (and the 512x512 the Play listing asks for, which no
       tool in this repo produced before)
    5. `npx cap sync android` — the web directory into the app
    6. the patches Capacitor's own scaffold cannot know about: the app label,
       portrait lock, the version pair, and the release signing config

  SIGNING — one keystore for the studio, one key per game.

  The thirteen apps share `~/keys/newrare.keystore` and take one alias each
  (the slug, or `android.keyAlias` in the manifest): one file to back up
  instead of thirteen, and a key that leaks is replaced for its own app alone.
  Where it is and what unlocks it is written ONCE, outside this repo, in a
  file this tool reads and copies into each generated project:

      ~/.newrare/signing.properties         (or $NEWRARE_SIGNING, or
                                             ./signing.properties, gitignored)
        storeFile=/Users/you/keys/newrare.keystore
        storePassword=…
        keyPassword=…                       # optional, defaults to the store's

  That indirection is not decoration: `native/<slug>/` is a build output and
  `--clean` deletes it, so the passwords cannot live in there. Absent the file,
  the release build stays unsigned and says so.

  What this tool deliberately does NOT do: create the keystore (it is the one
  secret whose loss is unrecoverable — you make it, you back it up), and upload
  anything. `make android GAME=<slug>` builds the .aab from here; the first
  one goes up through the Play Console by hand, because `fastlane supply`
  cannot create an app.
*/

import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const CLEAN = argv.includes('--clean');
const NO_INSTALL = argv.includes('--no-install');
const slug = (argv.find((a) => a.startsWith('--game=')) || '').split('=')[1] ||
             argv.find((a) => !a.startsWith('-')) || null;

if (!slug) {
  console.error('usage: gen-native.mjs <slug> [--clean] [--no-install]');
  process.exit(1);
}

/* The Capacitor line this generator was written against. Pinned, because a
   major bump changes the scaffold the patches below reach into — read them
   before moving it. */
const CAP = '^7.0.0';
const DEPS = {
  '@capacitor/core': CAP,
  '@capacitor/android': CAP,
  '@capacitor/app': CAP        // the hardware back button and appStateChange,
                               // which packages/platform/capacitor.js reads
};
const DEV_DEPS = { '@capacitor/cli': CAP, '@capacitor/assets': '^3.0.5' };

/* The API level Play demands of a new app, and the Android Gradle Plugin that
   can compile against it. Capacitor 7 scaffolds 35 with AGP 8.7.2, which is a
   year behind the store rule and refuses compileSdk 36; AGP 8.9 is the first
   that takes it, and it runs on the Gradle 8.11.1 the scaffold's wrapper
   already pins, so the wrapper is left alone. A game overrides the level with
   `android.targetSdk` in its manifest. */
const SDK = 36;
const AGP = '8.9.1';

const NATIVE = path.join(ROOT, 'native', slug);
const WEB_DIR = path.join(ROOT, 'dist', 'android', slug);

function run(cmd, args, opts) {
  const label = [cmd, ...args].join(' ');
  console.log(`\n$ ${label}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: NATIVE, ...opts });
  if (r.status !== 0) throw new Error(`${label} failed (${r.status === null ? r.signal : 'exit ' + r.status})`);
}

/*
  Where the Android SDK is. Gradle reads it from local.properties, and this
  machine has it under Homebrew rather than in Android Studio's own place, so
  guessing is better than a wall of setup instructions. An explicit
  ANDROID_HOME always wins.
*/
function androidSdk() {
  const guesses = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(process.env.HOME || '', 'Library/Android/sdk'),
    '/opt/homebrew/share/android-commandlinetools',
    '/usr/local/share/android-commandlinetools'
  ].filter(Boolean);
  return guesses.find((d) => existsSync(path.join(d, 'platform-tools')) || existsSync(path.join(d, 'platforms'))) || null;
}

// --- the two generated files ---------------------------------------------

function packageJson(m, a) {
  return {
    name: `newrare-${slug}`,
    version: a.versionName,
    private: true,
    description: `${m.title} — the Android wrapper. Generated by tools/publish/gen-native.mjs; do not edit by hand.`,
    dependencies: DEPS,
    devDependencies: DEV_DEPS
  };
}

function capacitorConfig(m, a) {
  return {
    appId: a.appId,
    appName: m.title || slug,
    webDir: 'www',
    /* The app is offline and self-contained: no cleartext, no allowed hosts,
       nothing to reach. `androidScheme: https` is Capacitor's own default and
       is what keeps localStorage — the motor's Store — on a stable origin
       across updates. */
    server: { androidScheme: 'https' },
    android: {
      backgroundColor: (m.theme && m.theme.bg) || '#0a0a1c',
      /* A game is a canvas under a finger: the WebView must not offer to
         zoom it, select it or bounce it. */
      allowMixedContent: false,
      webContentsDebuggingEnabled: false
    }
  };
}

// --- the patches on Capacitor's scaffold ----------------------------------

/* Every patch is marked and idempotent: the marker is how a second run knows
   it already happened, and how anyone reading the generated project knows
   which lines are not Capacitor's. */
const MARK = 'newrare:generated';

function patch(file, fn) {
  const abs = path.join(NATIVE, file);
  if (!existsSync(abs)) throw new Error(`${file} is missing — did \`cap add android\` run?`);
  const before = readFileSync(abs, 'utf8');
  if (before.includes(MARK)) return `kept   ${file} (already patched)`;
  const after = fn(before);
  if (after === before) return `kept   ${file} (nothing to change)`;
  writeFileSync(abs, after);
  return `patch  ${file}`;
}

function need(text, needle, file) {
  if (!text.includes(needle)) throw new Error(`${file}: cannot find ${JSON.stringify(needle)} — the Capacitor scaffold moved, read tools/publish/gen-native.mjs`);
}

/*
  Portrait, and nothing else. The games are authored at 720x1280 and the motor
  has no landscape layout at all, so the lock belongs in the manifest rather
  than in a hope that nobody rotates the phone.
*/
function patchAndroidManifest(m) {
  return patch('android/app/src/main/AndroidManifest.xml', (xml) => {
    need(xml, 'android:name="android.intent.action.MAIN"', 'AndroidManifest.xml');
    need(xml, '<activity', 'AndroidManifest.xml');
    return xml.replace(
      /<activity([\s\S]*?)>/,
      (mm, body) => `<!-- ${MARK}: portrait only — the motor has no landscape layout -->\n        <activity${body}\n            android:screenOrientation="portrait">`
    );
  });
}

/*
  The SDK level and the plugin that compiles it. Play refuses a new app below
  its current target-API rule, and the scaffold is written a year earlier than
  whatever it is used in — so this is a patch and not a hope.
*/
function patchSdkVersions(a) {
  const sdk = a.targetSdk || SDK;
  const vars = patch('android/variables.gradle', (g) => {
    need(g, 'compileSdkVersion', 'variables.gradle');
    return g
      .replace('ext {', `ext {\n    // ${MARK}: Play's target-API rule, see tools/publish/gen-native.mjs`)
      .replace(/compileSdkVersion = \d+/, `compileSdkVersion = ${sdk}`)
      .replace(/targetSdkVersion = \d+/, `targetSdkVersion = ${sdk}`);
  });
  const agp = patch('android/build.gradle', (g) => {
    need(g, 'com.android.tools.build:gradle:', 'build.gradle');
    return g.replace(/classpath 'com\.android\.tools\.build:gradle:[^']+'/,
      `classpath 'com.android.tools.build:gradle:${AGP}'   // ${MARK}: compileSdk ${sdk} needs AGP 8.9+`);
  });
  return `${vars.startsWith('patch') ? 'sdk    ' : 'kept   '}API ${sdk}, AGP ${AGP} (${vars.trim()}, ${agp.trim()})`;
}

function patchStrings(m, a) {
  return patch('android/app/src/main/res/values/strings.xml', (xml) => {
    const title = (m.title || slug).replace(/[<>&]/g, '');
    return `<?xml version='1.0' encoding='utf-8'?>\n<!-- ${MARK} from games/${slug}/manifest.json -->\n<resources>\n    <string name="app_name">${title}</string>\n    <string name="title_activity_main">${title}</string>\n    <string name="package_name">${a.appId}</string>\n    <string name="custom_url_scheme">${a.appId}</string>\n</resources>\n`;
  });
}

/*
  The version pair and the release signing config.

  The version is read off the manifest, so bumping a release is editing the
  one file that describes the game — never a generated Gradle script.

  The signing config reads `native/<slug>/android/keystore.properties`, which
  IS generated — out of the studio's signing.properties, with this game's own
  key alias — and is never committed. Absent, the release build stays unsigned
  and Gradle says so instead of failing three minutes in.
*/
function patchAppGradle(m, a) {
  return patch('android/app/build.gradle', (g) => {
    need(g, 'versionCode', 'app/build.gradle');
    need(g, 'buildTypes {', 'app/build.gradle');

    let out = g
      .replace(/versionCode \d+/, `versionCode ${a.versionCode}`)
      .replace(/versionName "[^"]*"/, `versionName "${a.versionName}"`);

    const signing = `    /* ${MARK} — release signing.
       android/keystore.properties is written by tools/publish/gen-native.mjs
       out of the studio's own signing.properties (see its header): one
       keystore for all the games, one key alias per game. It is never
       committed, and it is regenerated with the project — the passwords live
       in the one file outside the repo, not here.
       Losing that keystore means never being able to update the app again. */
    signingConfigs {
        release {
            def propsFile = rootProject.file("keystore.properties")
            if (propsFile.exists()) {
                def props = new Properties()
                propsFile.withInputStream { props.load(it) }
                storeFile file(props['storeFile'])
                storePassword props['storePassword']
                keyAlias props['keyAlias']
                keyPassword props['keyPassword']
            }
        }
    }

`;
    out = out.replace('    buildTypes {', signing + '    buildTypes {');
    out = out.replace(/(buildTypes \{\s*\n\s*release \{)/,
      `$1\n            if (rootProject.file("keystore.properties").exists()) {\n                signingConfig signingConfigs.release\n            } else {\n                logger.lifecycle("newrare: no android/keystore.properties — the release build will be UNSIGNED")\n            }`);
    return out;
  });
}

// --- the launcher icon ----------------------------------------------------

/*
  A flat PNG of one colour, written here rather than pulled in.

  The adaptive icon needs a background layer as a real image — @capacitor/assets
  writes an <adaptive-icon> pointing at @mipmap/ic_launcher_background, and
  its colour flags do not produce that file. sips can resize but not create,
  and the repo has no image library on purpose, so: eleven lines of zlib. A
  solid square is the one case where writing the format by hand is shorter
  than the dependency that would avoid it.
*/
function solidPng(hex, size) {
  const c = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0, o = 0; y < size; y++) {
    raw[o++] = 0;                                  // filter: none
    for (let x = 0; x < size; x++) { raw[o++] = rgb[0]; raw[o++] = rgb[1]; raw[o++] = rgb[2]; }
  }
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(Buffer.concat([head.subarray(4), data])), 0);
    return Buffer.concat([head, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;                        // 8-bit, truecolour
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function sips(args) {
  const r = spawnSync('sips', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) throw new Error(`sips failed: ${r.stderr}`);
}

/*
  The icon pack, from the one square painting the user made.

  `icon-only.png` is the full-bleed square (the legacy launcher icon and the
  Play listing's 512). `icon-foreground.png` is that same square at 66% on the
  theme's own background, because an adaptive icon is masked to a circle and a
  full-bleed foreground loses its corners on every recent launcher.

  sips does the resizing: it ships with macOS, and the repo has stayed free of
  an image library on purpose.
*/
async function icons(m) {
  const src = path.join(ROOT, 'assets', 'image', 'icon', `${slug}.png`);
  if (!existsSync(src)) {
    return [`SKIP   no assets/image/icon/${slug}.png — the launcher icon is the user's, see CLAUDE.md`];
  }
  const bg = ((m.theme && m.theme.bg) || '#0a0a1c').replace('#', '').toUpperCase();
  const dir = path.join(NATIVE, 'assets');
  const store = path.join(NATIVE, 'store');
  await mkdir(dir, { recursive: true });
  await mkdir(store, { recursive: true });

  const only = path.join(dir, 'icon-only.png');
  const fg = path.join(dir, 'icon-foreground.png');

  sips(['-Z', '1024', src, '--out', only]);
  sips(['-Z', '676', src, '--out', fg]);
  sips(['-p', '1024', '1024', '--padColor', bg, fg, '--out', fg]);
  await writeFile(path.join(dir, 'icon-background.png'), solidPng('#' + bg, 1024));

  /* NO splash source, on purpose. @capacitor/assets answers one to 56 files
     and 17 MB of upscaled PNG — twelve densities times portrait, landscape
     and night — for a game whose whole bundle is 1.4 MB, and Android 12 and
     up ignore every one of them: the system splash is the adaptive icon on a
     colour. So the launch screen is that colour (patchSplashTheme below) and
     the pack is icons only. */

  // The Play listing's own asset, which nothing in this repo produced before.
  sips(['-Z', '512', src, '--out', path.join(store, 'icon-512.png')]);

  return [`icons  from assets/image/icon/${slug}.png (foreground at 66%, ground ${'#' + bg})`,
          `store  native/${slug}/store/icon-512.png — the Play listing's icon`];
}

/*
  The launch screen: the theme's own colour, and nothing to decode.

  Capacitor's scaffold points AppTheme.NoActionBarLaunch at @drawable/splash,
  a full-screen bitmap per density. On Android 12 and up that drawable is not
  even shown — the system draws the adaptive icon on a colour — and below it a
  flat ground under the icon is exactly what the game's own intro fades in
  from. So the reference becomes a colour, and the bitmaps go.
*/
function patchSplashTheme(m) {
  const bg = (m.theme && m.theme.bg) || '#0a0a1c';
  /* The scaffold ships no colors.xml at all — the colours AppTheme names come
     from the capacitor-android library — so this file is ours entirely. */
  const colors = path.join(NATIVE, 'android/app/src/main/res/values/colors.xml');
  if (!existsSync(colors) || !readFileSync(colors, 'utf8').includes(MARK)) {
    writeFileSync(colors, `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${MARK} from games/${slug}/manifest.json -->\n<resources>\n    <color name="splashBackground">${bg}</color>\n</resources>\n`);
  }
  return patch('android/app/src/main/res/values/styles.xml', (xml) => {
    need(xml, '@drawable/splash', 'styles.xml');
    return xml
      .replace('<resources>', `<resources>\n    <!-- ${MARK}: the launch screen is the theme's ground, not a bitmap -->`)
      .replace('<item name="android:background">@drawable/splash</item>',
        '<item name="android:background">@color/splashBackground</item>');
  });
}

/*
  Whatever produced a `splash.png` under res/drawable-anything — the scaffold
  or a previous run of @capacitor/assets — is dead weight once the theme no longer
  points at it. Removed here rather than left for the packager to compress
  into the bundle.
*/
function dropSplashDrawables() {
  const res = path.join(NATIVE, 'android/app/src/main/res');
  let gone = 0, bytes = 0;
  for (const dir of readdirSync(res)) {
    if (!dir.startsWith('drawable')) continue;
    const file = path.join(res, dir, 'splash.png');
    if (!existsSync(file)) continue;
    bytes += readFileSync(file).length;
    rmSync(file);
    gone++;
    if (readdirSync(path.join(res, dir)).length === 0) rmSync(path.join(res, dir), { recursive: true });
  }
  return gone ? `splash dropped ${gone} splash bitmaps (${(bytes / 1048576).toFixed(1)} MB)` : 'splash none to drop';
}

// --- signing ---------------------------------------------------------------

/*
  Where the studio's signing secrets are. One file, outside the repo, read
  here and never committed anywhere: the generated project gets a copy with
  this game's own alias in it.
*/
function signingSource() {
  return [
    process.env.NEWRARE_SIGNING,
    path.join(ROOT, 'signing.properties'),
    path.join(process.env.HOME || '', '.newrare', 'signing.properties')
  ].filter(Boolean).find(existsSync) || null;
}

function readProps(file) {
  const out = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

/*
  The per-app keystore.properties Gradle reads, written from the studio file
  plus this game's alias. Regenerated on every run, so rotating a password is
  editing one file; deleted along with the project by --clean, which is the
  whole reason the secrets do not live there.
*/
function signing(a) {
  const src = signingSource();
  const out = path.join(NATIVE, 'android', 'keystore.properties');
  const alias = a.keyAlias;

  if (!src) {
    if (existsSync(out)) return `sign   android/keystore.properties (kept, written by hand)`;
    return `SIGN   no signing.properties — the bundle will be UNSIGNED (alias would be "${alias}")`;
  }

  const p = readProps(src);
  for (const k of ['storeFile', 'storePassword']) {
    if (!p[k]) throw new Error(`${src}: ${k} is missing`);
  }
  const store = p.storeFile.replace(/^~/, process.env.HOME || '~');
  if (!existsSync(store)) throw new Error(`${src}: storeFile ${store} does not exist`);

  writeFileSync(out, `# ${MARK} from ${src} — do not edit, do not commit.\n` +
    `storeFile=${store}\n` +
    `storePassword=${p.storePassword}\n` +
    `keyAlias=${alias}\n` +
    `keyPassword=${p.keyPassword || p.storePassword}\n`);

  return `sign   ${path.basename(store)}, key "${alias}"  (from ${src.replace(process.env.HOME || '~', '~')})`;
}

// --- fastlane -------------------------------------------------------------

/*
  Creating the app is manual and always will be; everything after it is not.
  These two files are what makes `fastlane android beta` work once the Play
  service-account JSON exists — they are text, and cost nothing to carry
  before fastlane is installed.
*/
function fastlane(a) {
  const appfile = `# ${MARK} — do not edit; see tools/publish/gen-native.mjs\njson_key_file(ENV["PLAY_JSON_KEY"] || "../play-service-account.json")\npackage_name("${a.appId}")\n`;

  const fastfile = `# ${MARK} — do not edit; see tools/publish/gen-native.mjs\n#\n#   fastlane android beta      build a signed .aab and upload it to the\n#                              internal track (the app must already exist —\n#                              supply cannot create it)\n#   fastlane android promote   internal → closed testing, the cycle the\n#                              12-testers / 14-days rule is run on\n\ndefault_platform(:android)\n\nplatform :android do\n  desc "Build the signed bundle and upload it to the internal track"\n  lane :beta do\n    gradle(task: "clean", project_dir: "android/")\n    gradle(task: "bundle", build_type: "Release", project_dir: "android/")\n    upload_to_play_store(\n      track: "internal",\n      release_status: "draft",\n      skip_upload_apk: true,\n      skip_upload_metadata: true,\n      skip_upload_images: true,\n      skip_upload_screenshots: true\n    )\n  end\n\n  desc "Promote the internal build to closed testing"\n  lane :promote do\n    upload_to_play_store(\n      track: "internal",\n      track_promote_to: "alpha",\n      skip_upload_changelogs: true\n    )\n  end\nend\n`;

  return { appfile, fastfile };
}

// --- run ------------------------------------------------------------------

async function main() {
  const mFile = path.join(ROOT, 'games', slug, 'manifest.json');
  if (!existsSync(mFile)) throw new Error(`games/${slug}/manifest.json does not exist`);
  const m = JSON.parse(await readFile(mFile, 'utf8'));

  if (!Array.isArray(m.targets) || !m.targets.includes('android')) {
    throw new Error(`${slug} does not list the "android" target in its manifest`);
  }
  const a = m.android || {};
  if (!a.appId) throw new Error(`games/${slug}/manifest.json: android.appId is required`);
  const app = {
    appId: a.appId,
    versionName: a.versionName || '1.0.0',
    versionCode: a.versionCode || 1,
    targetSdk: a.targetSdk || SDK,
    /* One key per game inside the one studio keystore, named after the game
       unless the manifest says otherwise. */
    keyAlias: a.keyAlias || slug
  };

  const notes = [];

  if (CLEAN) {
    await rm(NATIVE, { recursive: true, force: true, maxRetries: 5 });
    notes.push(`clean  removed native/${slug}/`);
  }

  // 1. the web directory Capacitor wraps
  run(process.execPath, [path.join(ROOT, 'tools/build/build.mjs'), '--target=android', `--game=${slug}`], { cwd: ROOT });
  if (!existsSync(path.join(WEB_DIR, 'index.html'))) {
    throw new Error(`dist/android/${slug}/index.html was not produced`);
  }

  // 2. the project, from the manifest
  await mkdir(NATIVE, { recursive: true });
  await writeFile(path.join(NATIVE, 'package.json'), JSON.stringify(packageJson(m, app), null, 2) + '\n');
  await writeFile(path.join(NATIVE, 'capacitor.config.json'), JSON.stringify(capacitorConfig(m, app), null, 2) + '\n');
  await rm(path.join(NATIVE, 'www'), { recursive: true, force: true });
  await cp(WEB_DIR, path.join(NATIVE, 'www'), { recursive: true });
  notes.push(`www    dist/android/${slug}/ → native/${slug}/www/`);

  const fl = fastlane(app);
  await mkdir(path.join(NATIVE, 'fastlane'), { recursive: true });
  await writeFile(path.join(NATIVE, 'fastlane', 'Appfile'), fl.appfile);
  await writeFile(path.join(NATIVE, 'fastlane', 'Fastfile'), fl.fastfile);

  if (NO_INSTALL && !existsSync(path.join(NATIVE, 'node_modules'))) {
    console.log(`\n--no-install, and native/${slug}/node_modules is not there: stopping after the sources.`);
    notes.forEach((n) => console.log('  ' + n));
    return;
  }

  // 3. the toolchain, then the android project itself
  if (!NO_INSTALL) run('npm', ['install', '--no-audit', '--no-fund']);
  if (!existsSync(path.join(NATIVE, 'android'))) {
    run('npx', ['--no', 'cap', 'add', 'android']);
    notes.push(`cap    native/${slug}/android/ created`);
  }

  // where Gradle finds the SDK
  const sdk = androidSdk();
  if (sdk) {
    await writeFile(path.join(NATIVE, 'android', 'local.properties'), `# ${MARK}\nsdk.dir=${sdk}\n`);
    notes.push(`sdk    ${sdk}`);
  } else {
    notes.push('SDK    not found — set ANDROID_HOME, or Gradle will not build');
  }

  // 4. the icons, 5. the web directory into the app
  notes.push(...await icons(m));
  if (existsSync(path.join(NATIVE, 'assets', 'icon-only.png'))) {
    run('npx', ['--no', 'capacitor-assets', 'generate', '--android']);
  }
  notes.push(dropSplashDrawables());
  run('npx', ['--no', 'cap', 'sync', 'android']);

  // 6. the patches
  notes.push(patchSdkVersions(app));
  notes.push(patchSplashTheme(m));
  notes.push(patchStrings(m, app));
  notes.push(patchAndroidManifest(m));
  notes.push(patchAppGradle(m, app));

  const signed = signing(app);
  notes.push(signed);

  console.log(`\nnative/${slug}/  —  ${app.appId}  v${app.versionName} (${app.versionCode})`);
  notes.forEach((n) => console.log('  ' + n));

  if (signed.startsWith('SIGN')) {
    console.log(`\n  NO SIGNING KEY. One keystore for the studio, one key per game:`);
    console.log(`      keytool -genkeypair -v -keystore ~/keys/newrare.keystore \\`);
    console.log(`        -alias ${app.keyAlias} -keyalg RSA -keysize 4096 -validity 10000`);
    console.log(`  then write ~/.newrare/signing.properties (storeFile, storePassword) and`);
    console.log(`  back the keystore up off this machine — losing it costs the app's updates.`);
  }
  console.log(`\n  Build the bundle with:  make android GAME=${slug}`);
}

main().catch((err) => { console.error('\ngen-native failed:', err.message); process.exit(1); });
