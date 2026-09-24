#!/usr/bin/env node
/*
  rename-sfx — the one-shot that turned assets/audio/sfx/ from ten vendor drops
  into one flat, self-describing library.

    node tools/lab/rename-sfx.mjs --dry     # print the plan, write nothing
    node tools/lab/rename-sfx.mjs           # move, rename, rewrite, bump

  Before it ran the folder held 127 ZapSplat mp3s at the root, named the way
  the vendor names them ("zapsplat_multimedia_alert_ping_chime_correct_answer_
  check_positive_009_70198.mp3"), and ten Kenney packs dropped as they were
  downloaded ("sfx/kenney_impact-sounds/Audio/impactMetal_heavy_000.ogg") with
  44 basenames colliding across packs ("1.ogg" three times). Nothing in tools/
  descends into a subfolder, so the 744 new files were invisible to
  `make events`.

  After: every file sits at the root and is named

      <category>-<descriptor>-<NN>.<ext>       impact-metal-heavy-01.ogg
                                               chime-ping-correct-01.mp3
                                               voice-female-level-up.ogg

  kebab-case, the CATEGORY first because it is what a list groups by, a
  two-digit variant where the pack shipped several takes, and none on a voice
  line (its word is its identity). The original name of every file is kept in
  `sources.tsv` beside them, with the pack and the licence, so a file's origin
  is one lookup and never a guess. `index-sfx.mjs` then reads the folder back
  into `index.json` — categories, durations, packs — for the bench, the library
  page and anyone asking `--list`.

  The one thing that could break: a game's provenance comment names the file
  its clip was cut from ("// hit: ui_mallet_tone_single_plink_generic_002"),
  and that is the ONLY record of it (tools/lab/scan-events.mjs). So this script
  rewrites those notes in every games/<slug>/game.js — the label swapped in
  place, the remark in brackets kept — and bumps the game's patch version,
  because a source file changed (CLAUDE.md, "bump the game's version"). Four
  notes that were cut short and never resolved are mapped by hand in ALIASES,
  one of them from a byte-for-byte re-cut match, one on the balance of the
  evidence (see the comment there).

  Run twice, the second run finds nothing to move and nothing to rewrite: a
  root file that sources.tsv already lists is carried through as it is. It
  exists as a record, like tools/build/extract.mjs, and should not need
  running again: a pack added later is named to the scheme by hand and
  declared in sources.tsv, and `make sfx` does the rest.
*/
import { readdir, readFile, writeFile, rename, rm, rmdir, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeMask, argsOf } from './scan-events.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SFX = path.join(ROOT, 'assets', 'audio', 'sfx');
const DRY = process.argv.includes('--dry');
const AUDIO = /\.(mp3|ogg|wav|m4a)$/i;

/* ── the packs ─────────────────────────────────────────────────────────────
   Keyed by the folder each Kenney pack was dropped as. All ten are CC0
   (kenney.nl/assets); the ZapSplat set ships under the standard licence whose
   PDF sits in the folder; seven "sfx_*" files predate the ZapSplat drop and
   carry no record of where they came from. */
const KENNEY = {
  'kenney_casino-audio': 'kenney-casino',
  'kenney_digital-audio': 'kenney-digital',
  'kenney_impact-sounds': 'kenney-impact',
  'kenney_interface-sounds': 'kenney-interface',
  'kenney_music-jingles': 'kenney-jingles',
  'kenney_rpg-audio': 'kenney-rpg',
  'kenney_sci-fi-sounds': 'kenney-scifi',
  'kenney_ui-audio': 'kenney-ui',
  'kenney_voiceover-pack': 'kenney-voice',
  'kenney_voiceover-pack-fighter': 'kenney-voice-fighter'
};
const LICENSE = {
  kenney: 'CC0 1.0',
  zapsplat: 'ZapSplat standard licence (LICENSE-zapsplat.pdf)',
  legacy: 'unknown — predates the ZapSplat drop, no record'
};

function packOf(rel) {
  const m = /^sfx\/(kenney_[^/]+)\//.exec(rel);
  if (m && KENNEY[m[1]]) return { key: m[1], pack: KENNEY[m[1]], license: LICENSE.kenney };
  if (/^zapsplat_/.test(rel)) return { key: 'zapsplat', pack: 'zapsplat', license: LICENSE.zapsplat };
  if (!rel.includes('/')) return { key: 'legacy', pack: 'legacy', license: LICENSE.legacy };
  throw new Error(`no pack for ${rel}`);
}

/* ── Kenney: rules per pack ────────────────────────────────────────────────
   Kenney names are regular, so a pack is a rule plus a small table of stems.
   A rule returns the FAMILY a file belongs to and its ordinal in the pack;
   the ordinals are then renumbered densely per (pack, family), 01 upward, so
   `tick_001, tick_002, tick_004` come out as tick 01, 02, 03. A voice line
   returns its whole stem instead: its word is its identity, and a number on it
   would say nothing. */
const pad2 = (n) => String(n).padStart(2, '0');
const camel = (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

const CASINO = {
  'cards-pack-open': 'card-pack-open', 'cards-pack-take-out': 'card-pack-takeout',
  'chips-collide': 'chip-collide', 'chips-handle': 'chip-handle', 'chips-stack': 'chip-stack',
  'die-throw': 'dice-throw-single'
};
const DIGITAL = {
  highDown: 'tone-high-down', highUp: 'tone-high-up', lowDown: 'tone-low-down', lowRandom: 'tone-low-random',
  lowThreeTone: 'tone-low-triple', threeTone: 'tone-triple', twoTone: 'tone-double', tone: 'tone-single',
  pepSound: 'tone-pep', laser: 'laser-digital', phaseJump: 'phaser-jump', phaserDown: 'phaser-down',
  phaserUp: 'phaser-up', powerUp: 'powerup', spaceTrash: 'explosion-digital', zap: 'zap',
  zapThreeToneDown: 'zap-triple-down', zapThreeToneUp: 'zap-triple-up', zapTwoTone: 'zap-double'
};
const IFACE = { error: 'error-ui', confirmation: 'ui-confirm' };
const JINGLE = { NES: 'nes', HIT: 'hit', PIZZI: 'pizzicato', SAX: 'sax', STEEL: 'steel' };
const RPG = {
  beltHandle: 'leather-belt', bookClose: 'book-close', bookFlip: 'book-flip', bookOpen: 'book-open',
  bookPlace: 'book-place', chop: 'chop', cloth: 'cloth', clothBelt: 'cloth-belt', creak: 'creak',
  doorClose: 'door-close', doorOpen: 'door-open', drawKnife: 'knife-draw', dropLeather: 'leather-drop',
  footstep: 'step-generic', handleCoins: 'coins-handle', handleSmallLeather: 'leather-handle',
  knifeSlice: 'knife-slice', metalClick: 'metal-click', metalLatch: 'metal-latch', metalPot: 'metal-pot'
};
const SCIFI = {
  computerNoise: 'loop-computer', doorClose: 'door-scifi-close', doorOpen: 'door-scifi-open',
  engineCircular: 'loop-engine-circular', explosionCrunch: 'explosion-crunch', forceField: 'forcefield',
  impactMetal: 'impact-metal-scifi', laserLarge: 'laser-large', laserRetro: 'laser-retro',
  laserSmall: 'laser-small', lowFrequency_explosion: 'explosion-low', slime: 'slime',
  spaceEngineLarge: 'loop-engine-large', spaceEngineLow: 'loop-engine-low',
  spaceEngineSmall: 'loop-engine-small', spaceEngine: 'loop-engine', thrusterFire: 'loop-thruster'
};
const UIAUDIO = {
  click: 'click', mouseclick: 'click-mouse-down', mouserelease: 'click-mouse-up',
  rollover: 'ui-rollover', switch: 'click-switch'
};
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

function kenney(rel, key, base) {
  let m;
  const need = (table, stem) => {
    if (!table[stem]) throw new Error(`no rule for ${rel}`);
    return table[stem];
  };
  switch (key) {
    case 'kenney_casino-audio':
      m = /^(.*?)(?:-(\d+))?$/.exec(base);
      return { family: CASINO[m[1]] || m[1], n: m[2] ? +m[2] : 1 };
    case 'kenney_digital-audio':
      m = /^([A-Za-z]+?)(\d*)$/.exec(base);
      return { family: need(DIGITAL, m[1]), n: m[2] ? +m[2] : 1 };
    case 'kenney_impact-sounds':
      m = /^([A-Za-z]+)((?:_[a-z]+)*)_(\d+)$/.exec(base);
      return { family: (m[1] === 'footstep' ? 'step' : camel(m[1])) + m[2].replace(/_/g, '-'), n: +m[3] + 1 };
    case 'kenney_interface-sounds':
      m = /^([a-z]+)_(\d+)$/.exec(base);
      return { family: IFACE[m[1]] || 'ui-' + m[1], n: +m[2] };
    case 'kenney_music-jingles':
      m = /^jingles_([A-Z]+)(\d+)$/.exec(base);
      return { family: 'jingle-' + need(JINGLE, m[1]), n: +m[2] + 1 };
    case 'kenney_rpg-audio':
      m = /^([A-Za-z]+?)_?(\d*)$/.exec(base);
      return { family: need(RPG, m[1]), n: m[2] ? +m[2] : 1 };
    case 'kenney_sci-fi-sounds':
      m = /^(.*?)_(\d+)$/.exec(base);
      return { family: need(SCIFI, m[1]), n: +m[2] + 1 };
    case 'kenney_ui-audio':
      m = /^([a-z]+?)(\d*)$/.exec(base);
      return { family: need(UIAUDIO, m[1]), n: m[2] ? +m[2] : 1 };
    case 'kenney_voiceover-pack':
    case 'kenney_voiceover-pack-fighter': {
      const who = key.endsWith('fighter') ? 'fighter' : rel.split('/')[2].toLowerCase();
      const word = /^\d+$/.test(base) ? WORDS[+base]
        : base.replace(/'/g, '').replace(/_/g, '-').replace('supressing', 'suppressing');
      return { stem: `voice-${who}-${word}` };
    }
  }
  throw new Error(`no rule for ${rel}`);
}

/* ── ZapSplat: one line per file ───────────────────────────────────────────
   Vendor names are long strings of marketing words ("alert", "notification",
   "positive", "generic", "new message") around two or three that describe the
   sound. Too irregular for a rule, few enough for a table: the key is the
   vendor name without its prefix, extension and trailing id, the value the
   new stem — what the sound IS first, then how it sounds, then the take. */
const ZAP = {
  alert_bell_ping_wooden_004: 'bell-ping-wooden-01',
  alert_bright_warm_system_positive_002: 'chime-warm-bright-01',
  alert_chime_bright_airy_positive_002: 'chime-bright-airy-01',
  alert_chime_bright_keys_positive_002: 'chime-bright-keys-01',
  alert_chime_ping_high_pitched_005: 'chime-ping-high-01',
  alert_clicks_fast_pop_up_004: 'click-popup-fast-01',
  alert_clicks_taps_notification_002: 'click-taps-01',
  alert_clicks_wooden_very_fast_notification_high_pitched: 'click-wooden-fast-high-01',
  alert_clicks_x4_wooden_fast_notification: 'click-wooden-x4-01',
  alert_clicks_x4_wooden_fast_notification_high_pitched: 'click-wooden-x4-high-01',
  alert_cute_ping_bell_ring_004: 'bell-ping-cute-01',
  alert_dreamy_soft_warm_drippy_delayed_bells_finish_end_002: 'bell-dreamy-finish-01',
  alert_dreamy_soft_warm_drippy_delayed_bells_positive_002: 'bell-dreamy-positive-01',
  alert_dreamy_soft_warm_drippy_delayed_bells_positive_003: 'bell-dreamy-positive-02',
  alert_finished_taps_dark_with_bright_ringing_001: 'click-taps-dark-ringing-01',
  alert_harp_musical_tone_finish_complete: 'harp-finish-01',
  alert_harp_positive_ascending_tone_musical: 'harp-ascending-01',
  alert_mallet_chime_ring_notification_001: 'mallet-chime-ring-01',
  alert_mallet_chime_ring_notification_002: 'mallet-chime-ring-02',
  alert_mallet_wooden_chime_ring_002: 'mallet-wooden-ring-01',
  alert_menu_select_item_beep_click_003: 'beep-select-01',
  alert_menu_toggle_clicks_001: 'click-toggle-01',
  alert_musical_finish_complete: 'success-musical-finish-01',
  alert_musical_harp_and_warm_pad_positive_success_complete: 'harp-pad-success-01',
  alert_musical_harp_and_warm_pad_positive_successful_complete: 'harp-pad-success-02',
  alert_musical_harp_roll_completed_finished: 'harp-roll-01',
  alert_musical_mallets_bright_warm_positive: 'mallet-bright-warm-01',
  alert_musical_warm_finish_complete_001: 'success-warm-finish-01',
  alert_musical_warm_finish_complete_002: 'success-warm-finish-02',
  alert_musical_warm_finish_complete_success_002: 'success-warm-finish-03',
  alert_negative_hit_delayed: 'error-hit-delayed-01',
  alert_notification_clicks_fast_ascending_001: 'click-ascending-01',
  alert_notification_mallet_bell_warm_stop: 'mallet-bell-warm-stop-01',
  alert_notification_mallet_musical_short_positive_002: 'mallet-short-positive-01',
  alert_notification_musical_short_marimba_positive_feedback_002: 'mallet-marimba-positive-01',
  alert_notification_positive_chime_mallet_complete_finished: 'mallet-chime-complete-01',
  alert_ping_chime_correct_answer_check_positive_009: 'chime-ping-correct-01',
  alert_ping_chime_x3: 'chime-ping-x3-01',
  alert_ping_chine_ring: 'chime-ping-ring-01',
  alert_prompt_keys_warm_bright_short_generic_002: 'chime-keys-short-01',
  alert_prompt_mallet_marimba_warning_or_error: 'error-marimba-warning-01',
  alert_prompt_mallet_marimba_warning_subtle: 'error-marimba-subtle-01',
  alert_prompt_positive_plucked: 'tone-plucked-positive-01',
  alert_prompt_ui_mallet_notification_end_complete_finished_001: 'mallet-end-complete-01',
  alert_ui_computer_software_update_or_file_transfer_complete_001: 'success-transfer-complete-01',
  alert_ui_marimba_warm_short_musical_tone_notify_complete_success_finish: 'mallet-marimba-success-01',
  alert_ui_software_game_error_issue: 'error-game-issue-01',
  alert_ui_software_game_success_completed_finished: 'success-game-completed-01',
  alert_ui_software_game_success_loading_complete: 'success-game-loading-01',
  alert_ui_software_game_success_open: 'success-game-open-01',
  alert_ui_synth_app_notification_dry_notify_error_001: 'error-synth-dry-01',
  alert_wooden_mallet_fast_positive_two_tone_004: 'mallet-wooden-two-tone-01',
  bell_ping_new_alert_notification_002: 'bell-ping-01',
  bell_ping_new_alert_notification_simple_timer_style_medium_pitched: 'bell-ping-timer-01',
  bell_ping_new_alert_notification_triple_ping: 'bell-ping-triple-01',
  bell_ping_notification_high_pitched_005: 'bell-ping-high-01',
  game_sound_mallets_negative_error_001: 'error-mallet-01',
  game_sound_mallets_negative_error_002: 'error-mallet-02',
  game_sound_mallets_negative_error_003: 'error-mallet-03',
  game_sound_mallets_nudge_reminder_005: 'mallet-nudge-01',
  gameshow_correct_answer_ping_ring_chime_006: 'chime-ring-correct-01',
  new_message_or_general_alert_clicks_wooden_x3_fast_002: 'click-wooden-x3-01',
  new_message_whizz_into_clicks: 'whoosh-whizz-clicks-01',
  notification_alert_clicks_pops_x3_low_pitched: 'pop-x3-low-01',
  notification_alert_clicks_pops_x3_new_message: 'pop-x3-01',
  notification_alert_layered_warm_negative_006: 'error-warm-layered-01',
  notification_alert_ping_bright_chime_001: 'chime-ping-bright-01',
  notification_alert_ping_bright_chime_004: 'chime-ping-bright-02',
  notification_alert_pop_up_001: 'pop-up-01',
  notification_alert_wooden_mallet_attention_process_complete_001: 'mallet-wooden-attention-01',
  notification_bell_chime_ping_tone_003: 'bell-chime-ping-01',
  notification_clinks_taps_fast_001: 'click-clinks-fast-01',
  notification_digital_bell_warm_generic_005: 'bell-digital-warm-01',
  notification_digital_bell_warm_positive_003: 'bell-digital-warm-02',
  notification_digital_bell_warm_positive_004: 'bell-digital-warm-03',
  notification_error_buzzy_fat_001: 'error-buzzy-01',
  notification_harp_positive_final: 'harp-final-01',
  notification_mallet_3_taps_attention: 'mallet-taps-attention-01',
  notification_mallet_bright_3_taps_attention: 'mallet-taps-attention-02',
  notification_pops_fast_clicks_001: 'pop-fast-clicks-01',
  notification_pops_fast_clicks_002: 'pop-fast-clicks-02',
  notification_short_digital_futuristic_beep_generic_004: 'beep-digital-01',
  notification_short_digital_futuristic_beep_generic_010: 'beep-digital-02',
  notification_wooden_clicks_new_message_002: 'click-wooden-message-01',
  pop_up_close_002: 'pop-close-01',
  pop_up_pop_002: 'pop-01',
  pop_up_pop_high_pitched_003: 'pop-high-01',
  ui_alert_software_app_simple_mallet_notify_action_required: 'mallet-action-required-01',
  ui_app_refresh_pop: 'pop-refresh-01',
  ui_app_tone_delete_close_loud_001: 'tone-delete-close-01',
  ui_bell_ping_with_simple_pad_musical_002: 'bell-ping-pad-01',
  ui_chime_alert_notification_simple_ping_2_tone_higher_pitched: 'chime-ping-two-tone-high-01',
  ui_end_complete_tone_mallet: 'mallet-end-tone-01',
  ui_mallet_tone_single_plink_generic_002: 'mallet-plink-01',
  ui_mallet_tone_turn_on_start: 'mallet-turn-on-01',
  ui_menu_digital_beep_select_001: 'beep-menu-select-01',
  ui_mobile_touch_screen_pull_down_refresh_trill_flutter_percussive_bold_002: 'whoosh-trill-flutter-01',
  ui_new_message_clicks_004: 'click-message-01',
  ui_notification_chime_positive_bright_005: 'chime-positive-bright-01',
  ui_notification_organic_harp_001: 'harp-organic-01',
  ui_notification_organic_harp_002: 'harp-organic-02',
  ui_nudge_reminder_tone_mallet_002: 'mallet-nudge-tone-01',
  ui_organic_bell_ping_chime_notification_003: 'bell-organic-chime-01',
  ui_percussive_clicks_002: 'click-percussive-01',
  ui_percussive_sent: 'click-percussive-sent-01',
  ui_ping_chime_bell_ding_notification_001: 'bell-ding-01',
  ui_ping_ding_dong_high_pitched_thin: 'bell-ding-dong-01',
  ui_prompt_alert_mellow_calm_positive_chime_002: 'chime-mellow-calm-01',
  ui_prompt_alert_mellow_calm_positive_playful_mallet_key_004: 'mallet-mellow-playful-01',
  ui_prompt_complete_or_soft_error_002: 'tone-soft-complete-01',
  ui_refresh_smartphone_app_short_sine_whistle_ascending_001: 'whoosh-whistle-ascending-01',
  ui_refresh_smartphone_app_short_sine_whistle_ascending_003: 'whoosh-whistle-ascending-02',
  ui_software_warm_soft_tone_completed_chime: 'success-soft-completed-01',
  ui_software_warm_soft_tone_error_002: 'error-soft-tone-01',
  ui_software_warm_soft_tone_successfully_completed: 'success-soft-completed-02',
  ui_software_warm_soft_tone_successfully_shut_down_004: 'tone-soft-shutdown-01',
  ui_switch_or_menu_item_metallic_click: 'click-metallic-01',
  ui_tone_short_thin_clicky_positive_correct: 'tone-clicky-correct-01',
  ui_tone_thin_plucked_end_complete_001: 'tone-plucked-end-01',
  ui_tone_thin_plucked_positive_002: 'tone-plucked-positive-02',
  // the seven that predate the ZapSplat drop
  sfx_hit_01_sport: 'hit-sport-01',
  sfx_hit_02_sport: 'hit-sport-02',
  sfx_hit_03_sport: 'hit-sport-03',
  sfx_hitwall_sport_01: 'hit-wall-01',
  sfx_shoot_pool: 'shoot-pool-01',
  'sfx_shoot_pool-v3': 'shoot-pool-02',
  sfx_shoot_sport_01: 'shoot-sport-01'
};

/* The label a game's provenance note used to write: the vendor name without
   its prefix and its trailing id, which is what the old sfxLabel produced. */
function oldLabel(base) {
  return base.replace(/^zapsplat_multimedia_/, '').replace(/^zapsplat_/, '').replace(/_\d{4,}$/, '');
}

/* Four notes were cut short by hand and never resolved to a file. */
const ALIASES = {
  // bouncetry `line`: a re-cut of _001 at the clip's own 0.42 s reproduces
  // the embedded bytes exactly, so this one is a fact.
  ui_refresh_smartphone_app_short_sine_whistle_asc: 'whoosh-whistle-ascending-01',
  // gearball `ship`: the note stops before "_complete", which both 113863 and
  // 113866 continue, and neither re-cut reproduces the bytes. Every other clip
  // of this family in the repo (radiam multi, slipdeck pay) is 113863 and
  // nothing uses 113866 — the balance of the evidence, not a proof.
  alert_musical_harp_and_warm_pad_positive_success: 'harp-pad-success-01',
  // orbinity `grab` and `milestone`: cut short, but only one file continues each.
  ui_mallet_tone_single_plink: 'mallet-plink-01',
  alert_harp_positive_ascending_tone: 'harp-ascending-01'
};

/* ── the plan ──────────────────────────────────────────────────────────────── */
async function walk(dir, rel = '') {
  const out = [];
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const r = rel ? rel + '/' + d.name : d.name;
    if (d.isDirectory()) out.push(...await walk(path.join(dir, d.name), r));
    else out.push(r);
  }
  return out;
}

/* sources.tsv as it stands, when it does: a root file it lists is DONE — named,
   declared — and is carried through untouched, which is what lets the script
   run again on a folder it has already been through, or on one a pack has been
   added to by hand. */
async function priorSources() {
  const map = {};
  try {
    for (const line of (await readFile(path.join(SFX, 'sources.tsv'), 'utf8')).split('\n').slice(1)) {
      if (!line.trim()) continue;
      const [file, pack, license, source] = line.split('\t');
      map[file] = { pack, license, source: source || '' };
    }
  } catch {}
  return map;
}

function plan(files, prior) {
  const rows = [];
  for (const rel of files) {
    const base = path.basename(rel).replace(/\.[^.]+$/, '');
    const ext = path.extname(rel).toLowerCase();
    if (!rel.includes('/') && prior[rel]) {
      rows.push({ rel, base, ext, pack: prior[rel].pack, license: prior[rel].license, source: prior[rel].source,
        group: null, family: null, n: null, stem: base });
      continue;
    }
    const p = packOf(rel);
    let stem, family = null, n = null;
    if (p.key === 'zapsplat' || p.key === 'legacy') {
      stem = ZAP[oldLabel(base)];
      if (!stem) throw new Error(`no entry in ZAP for ${rel}`);
    } else {
      const k = kenney(rel, p.key, base);
      if (k.stem) stem = k.stem; else { family = k.family; n = k.n; }
    }
    rows.push({ rel, base, ext, pack: p.pack, license: p.license, source: rel, group: p.key + '|' + family, family, n, stem });
  }
  // Dense renumbering per (pack, family), in the pack's own order.
  const groups = {};
  for (const r of rows) if (r.family) (groups[r.group] = groups[r.group] || []).push(r);
  for (const g of Object.values(groups)) {
    g.sort((a, b) => a.n - b.n || a.base.localeCompare(b.base));
    g.forEach((r, i) => { r.stem = r.family + '-' + pad2(i + 1); });
  }
  for (const r of rows) r.file = r.stem + r.ext;
  // Every stem once, whatever its extension: a provenance note carries no extension.
  const seen = {};
  for (const r of rows) {
    const k = r.stem.toLowerCase();
    if (seen[k]) throw new Error(`two files would be "${r.stem}": ${seen[k].rel} and ${r.rel}`);
    seen[k] = r;
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(r.stem)) throw new Error(`"${r.stem}" is not kebab-case (${r.rel})`);
  }
  return rows.sort((a, b) => a.file.localeCompare(b.file));
}

/* ── the games' provenance notes ───────────────────────────────────────────
   Same region soundPack reads: the ASSETS.sounds block and the comments above
   it. Longest label first, on a token boundary, the vendor id tolerated after
   it, so "…_success" can never eat "…_success_complete". */
function noteRewrites(rows) {
  const map = {};
  for (const r of rows) if (r.pack === 'zapsplat' || r.pack === 'legacy') map[oldLabel(r.base)] = r.stem;
  Object.assign(map, ALIASES);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Object.keys(map).sort((a, b) => b.length - a.length)
    .map((old) => ({ old, re: new RegExp('(^|[^\\w])' + esc(old) + '(?:_\\d{4,})?(?![\\w])', 'g'), stem: map[old] }));
}

function rewriteGame(src, rewrites) {
  const at = src.indexOf('sounds:');
  if (at < 0) return { src, count: 0 };
  const mask = codeMask(src);
  const open = src.indexOf('{', at);
  const block = argsOf(src, mask, open);
  const from = Math.max(0, at - 4000), to = block.end + 1;
  let region = src.slice(from, to), count = 0;
  // Two notes on one line ("// launch: a      boom: b") hide the second from
  // the scanner, which keeps the first key of a line: give each its line.
  region = region.replace(/^([ \t]*\/\/[ \t]*)(\w+):[ \t]+(\S+)[ \t]{2,}(\w+):[ \t]+(\S+)[ \t]*$/gm, '$1$2: $3\n$1$4: $5');
  for (const r of rewrites) region = region.replace(r.re, (m, pre) => { count++; return pre + r.stem; });
  region = region.split('assets/audio/sfx/*.mp3').join('assets/audio/sfx/*.{mp3,ogg}');
  return { src: src.slice(0, from) + region + src.slice(to), count };
}

function bumpManifest(text) {
  let out = text.replace(/("version":\s*")(\d+)\.(\d+)\.(\d+)(")/, (_, a, x, y, z, b) => `${a}${x}.${y}.${+z + 1}${b}`);
  if (/"versionName"/.test(out)) {
    out = out.replace(/("versionName":\s*")(\d+)\.(\d+)\.(\d+)(")/, (_, a, x, y, z, b) => `${a}${x}.${y}.${+z + 1}${b}`);
    out = out.replace(/("versionCode":\s*)(\d+)/, (_, a, n) => a + (+n + 1));
  }
  return out;
}

/* ── run ─────────────────────────────────────────────────────────────────── */
const all = await walk(SFX);
const files = all.filter((f) => AUDIO.test(f) && !/^(sources\.tsv|index\.json|LICENSE)/.test(f));
const rows = plan(files, await priorSources());
const moves = rows.filter((r) => r.rel !== r.file);

/* Before the first move: every directory a file leaves, and the one they all
   land in, has to be writable — a rename fails on the DIRECTORY's permission,
   and a pack unzipped by a browser can arrive read-only. Half a migration is
   worse than none, so this is asked first, of all of them. */
if (!DRY && moves.length) {
  const dirs = new Set([SFX, ...moves.map((r) => path.dirname(path.join(SFX, r.rel)))]);
  const denied = [];
  for (const d of dirs) { try { await access(d, FS.W_OK); } catch { denied.push(path.relative(SFX, d) || '.'); } }
  if (denied.length) {
    console.error(`cannot write in ${denied.length} director${denied.length > 1 ? 'ies' : 'y'} — fix the permissions first (chmod -R u+w):\n  ` + denied.join('\n  '));
    process.exit(1);
  }
}

console.log(`${rows.length} audio files, ${moves.length} to move`);
if (DRY) {
  for (const r of moves) console.log(`  ${r.rel.padEnd(88)} → ${r.file}`);
} else if (moves.length) {
  const tracked = new Set(execFileSync('git', ['ls-files', '-z', 'assets/audio/sfx'], { cwd: ROOT })
    .toString().split('\0').filter(Boolean).map((p) => p.slice('assets/audio/sfx/'.length)));
  for (const r of moves) {
    const to = path.join(SFX, r.file);
    if (existsSync(to)) throw new Error(`${r.file} already exists — refusing to overwrite`);
    if (tracked.has(r.rel)) execFileSync('git', ['mv', path.join(SFX, r.rel), to], { cwd: ROOT });
    else await rename(path.join(SFX, r.rel), to);
  }
  const pdf = path.join(SFX, 'ZapSplat-License-Agreement.pdf');
  if (existsSync(pdf)) execFileSync('git', ['mv', pdf, path.join(SFX, 'LICENSE-zapsplat.pdf')], { cwd: ROOT });
  // Vendor cruft, then every directory the moves emptied, deepest first.
  for (const f of all) if (/(^|\/)(desktop\.ini|\.DS_Store)$/.test(f)) await rm(path.join(SFX, f), { force: true });
  const dirs = [...new Set(all.filter((f) => f.includes('/')).map((f) => path.dirname(f)))];
  const parents = new Set();
  for (const d of dirs) { let p = d; while (p && p !== '.') { parents.add(p); p = path.dirname(p); } }
  for (const d of [...parents].sort((a, b) => b.split('/').length - a.split('/').length)) {
    try { await rmdir(path.join(SFX, d)); } catch (e) { console.log(`  left ${d}: ${e.code}`); }
  }
  console.log(`  moved ${moves.length} files`);
}

// sources.tsv — the record of where every file came from.
const tsv = ['file\tpack\tlicense\tsource']
  .concat(rows.map((r) => `${r.file}\t${r.pack}\t${r.license}\t${r.source === r.file ? '' : r.source}`)).join('\n') + '\n';
if (!DRY) await writeFile(path.join(SFX, 'sources.tsv'), tsv);
else console.log(`\nsources.tsv: ${rows.length} rows`);

// The games.
const rewrites = noteRewrites(rows);
const gamesDir = path.join(ROOT, 'games');
console.log('');
for (const slug of (await readdir(gamesDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  const file = path.join(gamesDir, slug, 'game.js');
  if (!existsSync(file)) continue;
  const src = await readFile(file, 'utf8');
  const out = rewriteGame(src, rewrites);
  if (out.src === src) { console.log(`  ${slug.padEnd(11)} unchanged`); continue; }
  const mf = path.join(gamesDir, slug, 'manifest.json');
  const manifest = await readFile(mf, 'utf8');
  const bumped = bumpManifest(manifest);
  const v = (t) => (/"version":\s*"([^"]+)"/.exec(t) || [])[1];
  console.log(`  ${slug.padEnd(11)} ${String(out.count).padStart(2)} labels rewritten   v${v(manifest)} → v${v(bumped)}` +
    (/"versionCode"/.test(bumped) ? `   android ${/"versionCode":\s*(\d+)/.exec(manifest)[1]} → ${/"versionCode":\s*(\d+)/.exec(bumped)[1]}` : ''));
  if (!DRY) { await writeFile(file, out.src); await writeFile(mf, bumped); }
}
const legacy = rows.filter((r) => r.pack === 'legacy');
if (legacy.length) console.log(`\n! ${legacy.length} files carry no licence record: ${legacy.map((r) => r.file).join(', ')}`);
if (!DRY) console.log('\nnext: node tools/lab/index-sfx.mjs && node tools/build/build.mjs');
