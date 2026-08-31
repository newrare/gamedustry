/*
  parts.mjs — the one place that knows how a playable HTML file is cut up.

  A game file is a fixed sequence of regions (see docs/ARCHITECTURE.md). Some are
  shared by every game (the motor), some belong to the game. Both the extractor
  and the builder read this module, so there is a single definition of the
  boundaries.

  splitPlayable(html) returns every region in document order; concatenating them
  in that order reproduces the input byte for byte. That property is what makes
  `build.mjs --check` a meaningful assertion.
*/

// Section banners, exactly as they appear in the file.
export const BANNER_HEAD =
  '  /* ===================================================================\n     ';

export const SECTIONS = {
  1: '1. CONFIG',
  2: '2. ASSETS',
  3: '3. ENGINE',
  4: '4. AD NETWORK GLUE',
  5: '5. SHELL',
  6: '6. GAME',
  7: '7. BOOTSTRAP'
};

export const SCRIPT_END = '})();\n</script>';
export const SKIN_MARK = '     SKIN — ';

// The regions, in document order. `shared` ones must be identical across games.
export const REGIONS = [
  { key: 'head',        shared: false },  // doctype → <style>, carries <title>
  { key: 'cssMotor',    shared: true  },  // the motor stylesheet
  { key: 'cssSkin',     shared: false },  // the game's SKIN block
  { key: 'markup',      shared: false },  // </style> → <script>
  { key: 'scriptOpen',  shared: true  },  // <script> "use strict" (function () {
  { key: 'jsConfig',    shared: false },  // sections 1 + 2
  { key: 'jsEngine',    shared: true  },  // section 3
  { key: 'jsPlatform',  shared: true  },  // section 4
  { key: 'jsShell',     shared: true  },  // section 5
  { key: 'jsGame',      shared: false },  // section 6
  { key: 'jsBootstrap', shared: true  },  // section 7
  { key: 'scriptClose', shared: true  }   // })(); </script> </body> </html>
];

function bannerAt(html, n, where) {
  const i = html.indexOf(BANNER_HEAD + SECTIONS[n]);
  if (i < 0) throw new Error(`${where}: section ${n} banner (${SECTIONS[n]}) not found`);
  return i;
}

export function splitPlayable(html, where = 'file') {
  const styleOpen = html.indexOf('<style>');
  const styleClose = html.indexOf('</style>');
  if (styleOpen < 0 || styleClose < 0) throw new Error(`${where}: no <style> block`);

  const cssStart = styleOpen + '<style>'.length;
  const css = html.slice(cssStart, styleClose);

  // The SKIN block opens at the comment that introduces the "SKIN —" marker.
  const skinMark = css.indexOf(SKIN_MARK);
  const skinStart = skinMark < 0 ? css.length : css.lastIndexOf('/*', skinMark);

  const scriptOpenAt = html.indexOf('<script>', styleClose);
  if (scriptOpenAt < 0) throw new Error(`${where}: no <script> after the stylesheet`);

  const m = {};
  for (const n of [1, 3, 4, 5, 6, 7]) m[n] = bannerAt(html, n, where);
  const endAt = html.indexOf(SCRIPT_END);
  if (endAt < 0) throw new Error(`${where}: script end marker not found`);

  const out = {
    head:        html.slice(0, cssStart),
    cssMotor:    css.slice(0, skinStart),
    cssSkin:     css.slice(skinStart),
    markup:      html.slice(styleClose, scriptOpenAt),
    scriptOpen:  html.slice(scriptOpenAt, m[1]),
    jsConfig:    html.slice(m[1], m[3]),
    jsEngine:    html.slice(m[3], m[4]),
    jsPlatform:  html.slice(m[4], m[5]),
    jsShell:     html.slice(m[5], m[6]),
    jsGame:      html.slice(m[6], m[7]),
    jsBootstrap: html.slice(m[7], endAt),
    scriptClose: html.slice(endAt)
  };

  const rebuilt = REGIONS.map((r) => out[r.key]).join('');
  if (rebuilt !== html) throw new Error(`${where}: split is not lossless — the file layout changed`);
  return out;
}

// Split a game.js (sections 1, 2 then 6) back into its two halves.
export function splitGameJs(js, where = 'game.js') {
  const at = js.indexOf(BANNER_HEAD + SECTIONS[6]);
  if (at < 0) throw new Error(`${where}: section 6 banner not found`);
  return { config: js.slice(0, at), game: js.slice(at) };
}
