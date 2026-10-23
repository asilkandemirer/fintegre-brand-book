// Builds the single-file brand book: dist/fintegre-brand-book.html.
// Fonts, images, logos, icons and illustrations are inlined at build time, so the page is
// complete before any script runs. Images come from assets/web (see scripts/web-images.py).
import { build } from 'esbuild';
import fs from 'fs';
import { logoSVG, logoSVGPaths, LOGO, LOGO_W } from './src/logo.js';
import { ICONS, iconSVG, ILLUS } from './src/icons.js';

const r = (p) => fs.readFileSync(p);
const b64 = (p) => r(p).toString('base64');

// ---- script bundle
const out = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', target: ['es2020'], write: false, legalComments: 'none' });
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// ---- fonts (latin + latin-ext, so Turkish text and ₺ render in the brand faces)
const ff = (fam, file, range, wght) =>
  `@font-face{font-family:"${fam}";font-style:normal;font-display:swap;font-weight:${wght};src:url(data:font/woff2;base64,${b64(file)}) format("woff2");unicode-range:${range};}`;
const LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
const G = 'node_modules/@fontsource-variable/geologica/files/geologica-';
const M = 'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-';
const fonts = [
  ff('Geologica', G + 'latin-full-normal.woff2', LAT, '100 900'),
  ff('Geologica', G + 'latin-ext-full-normal.woff2', EXT, '100 900'),
  ff('JetBrains Mono', M + 'latin-wght-normal.woff2', LAT, '100 800'),
  ff('JetBrains Mono', M + 'latin-ext-wght-normal.woff2', EXT, '100 800'),
].join('\n');

// ---- logo
const C = { indigo: '#3047EC', ice: '#B7D7FF', smoke: '#F5F7FA', graphite: '#0F1115', titanium: '#A7B0BE' };
const GRAD = [C.indigo, C.ice];
const wmD = fs.readFileSync('wordmark.d', 'utf8').trim();
const wbb = fs.readFileSync('wordmark_bbox.txt', 'utf8').replace(/[()]/g, '').split(',').map(Number);
const mark = (v, cls = 'mark') =>
  v === 'gradient' ? logoSVG({ h: 100, gradient: GRAD, cls }) : logoSVG({ h: 100, fill: C[v] || (/^[0-9a-f]{6}$/i.test(v) ? '#' + v : v), cls });

let lkid = 0;
// mark + wordmark in one SVG; wordmark cap height = 0.64 × mark height, gap = 0.135 × mark height
function lockup(markFill, textFill, cls = 'lockup') {
  const h = 100, w = LOGO_W * h, sc = (h * 0.64) / (wbb[3] - wbb[1]);
  const x0 = w / 2 + h * 0.135, ww = (wbb[2] - wbb[0]) * sc;
  const id = 'lk' + ++lkid;
  const grad = markFill === 'gradient'
    ? `<defs><linearGradient id="${id}" x1="${-w / 2}" y1="0" x2="${w / 2}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.indigo}"/><stop offset="1" stop-color="${C.ice}"/></linearGradient></defs>`
    : '';
  const mf = markFill === 'gradient' ? `url(#${id})` : markFill;
  const paths = logoSVGPaths(h).map((d) => `<path d="${d}"/>`).join('');
  return `<svg class="${cls}" viewBox="${(-w / 2 - 1).toFixed(1)} -51 ${(w + h * 0.135 + ww + 3).toFixed(1)} 102" role="img" aria-label="Fintegre">${grad}<g fill="${mf}">${paths}</g><g transform="translate(${x0.toFixed(2)} ${(-(h * 0.64) / 2).toFixed(2)}) scale(${sc.toFixed(4)}) translate(${-wbb[0]} ${-wbb[1]})"><path fill="${textFill}" fill-rule="evenodd" d="${wmD}"/></g></svg>`;
}

// construction drawing: the mark with its 65° edge guides and block baselines
function construction() {
  const h = 200, pad = 70, w = LOGO_W * h;
  const P = (p) => [p[0] * h, -p[1] * h];
  const lines = [];
  const ext = (a, b) => { // extend segment a→b across the drawing height
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t0 = (-h / 2 - pad + 10 - a[1]) / dy, t1 = (h / 2 + pad - 10 - a[1]) / dy;
    return [a[0] + dx * t0, a[1] + dy * t0, a[0] + dx * t1, a[1] + dy * t1];
  };
  for (const blk of LOGO) {
    const [tl, bl, br, tr] = blk.map(P);
    lines.push(ext(bl, tl), ext(br, tr));
  }
  const ys = [...new Set(LOGO.flatMap((blk) => [blk[0][1], blk[1][1]]))].map((y) => -y * h);
  const guides = lines.map((l) => `<line x1="${l[0].toFixed(1)}" y1="${l[1].toFixed(1)}" x2="${l[2].toFixed(1)}" y2="${l[3].toFixed(1)}"/>`).join('');
  const bases = ys.map((y) => `<line x1="${(-w / 2 - pad + 10).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(w / 2 + pad - 10).toFixed(1)}" y2="${y.toFixed(1)}"/>`).join('');
  const paths = logoSVGPaths(h).map((d) => `<path d="${d}"/>`).join('');
  // angle mark at the lowest block's bottom-left corner
  const [, bl, , ] = LOGO[2].map(P);
  const R = 46, a65 = (65 * Math.PI) / 180;
  const arc = `M${(bl[0] + R).toFixed(1)} ${bl[1].toFixed(1)}A${R} ${R} 0 0 0 ${(bl[0] + R * Math.cos(a65)).toFixed(1)} ${(bl[1] - R * Math.sin(a65)).toFixed(1)}`;
  return `<svg class="construct" viewBox="${(-w / 2 - pad).toFixed(1)} ${-h / 2 - pad} ${(w + pad * 2).toFixed(1)} ${h + pad * 2}" role="img" aria-label="Construction of the mark: every block edge runs at 65 degrees">
<g class="c-base" stroke="${C.titanium}" stroke-width="1" stroke-dasharray="3 5">${bases}</g>
<g fill="${C.indigo}" opacity=".9">${paths}</g>
<g class="c-guide" stroke="${C.indigo}" stroke-width="1.2" opacity=".55">${guides}</g>
<path d="${arc}" fill="none" stroke="${C.graphite}" stroke-width="1.6"/><line x1="${bl[0].toFixed(1)}" y1="${bl[1].toFixed(1)}" x2="${(bl[0] + 70).toFixed(1)}" y2="${bl[1].toFixed(1)}" stroke="${C.graphite}" stroke-width="1.2"/>
<text x="${(bl[0] + R + 10).toFixed(1)}" y="${(bl[1] - 16).toFixed(1)}" font-family="JetBrains Mono, monospace" font-size="17" fill="${C.graphite}">65°</text></svg>`;
}

// clear space: half the mark height on every side
function clearspace() {
  const h = 100, w = LOGO_W * h, x = h / 2, m = 40;
  const paths = logoSVGPaths(h).map((d) => `<path d="${d}"/>`).join('');
  const W = w + 2 * x, H = h + 2 * x;
  return `<svg class="clear" viewBox="${-W / 2 - m} ${-H / 2 - m} ${W + 2 * m} ${H + 2 * m}" role="img" aria-label="Clear space: half the mark height on every side">
<rect x="${-W / 2}" y="${-H / 2}" width="${W}" height="${H}" fill="none" stroke="${C.indigo}" stroke-width="1.2" stroke-dasharray="5 5"/>
<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${C.ice}" opacity=".35"/>
<g fill="${C.indigo}">${paths}</g>
<g font-family="JetBrains Mono, monospace" font-size="13" fill="${C.graphite}" text-anchor="middle">
<text x="0" y="${-h / 2 - x / 2 + 5}">x/2</text><text x="0" y="${h / 2 + x / 2 + 5}">x/2</text>
<text x="${-w / 2 - x / 2}" y="5">x/2</text><text x="${w / 2 + x / 2}" y="5">x/2</text>
<text x="${w / 2 + x + 22}" y="5">x</text></g>
<line x1="${w / 2 + x + 10}" y1="${-h / 2}" x2="${w / 2 + x + 10}" y2="${h / 2}" stroke="${C.graphite}" stroke-width="1.2"/></svg>`;
}

const icongrid = ICONS.map((ic) => `<li class="ig-item">${iconSVG(ic.id, { size: 32 })}<span>${ic.name}</span></li>`).join('');

// ---- images
const img = (id) => `data:image/webp;base64,${b64(`assets/web/${id}.webp`)}`;

const seen = new Set();
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

let html = fs.readFileSync('src/template.html', 'utf8');
html = html
  .replace('/*FONTS*/', fonts)
  // each image is embedded once; later uses point at it (main.js copies the source)
  .replace(/src="\{\{img:(\w+)\}\}"/g, (_, id) => {
    if (seen.has(id)) return `src="${BLANK}" data-ref="${id}"`;
    seen.add(id);
    return `src="${img(id)}" data-id="${id}"`;
  })
  .replace(/\{\{mark:(\w+)\}\}/g, (_, v) => mark(v))
  .replace(/\{\{lockup:(\w+)\}\}/g, (_, v) =>
    v === 'dark' ? lockup('gradient', C.graphite) : v === 'white' ? lockup(C.smoke, C.smoke) : lockup(C.graphite, C.graphite))
  .replace(/\{\{wordmark:(\w+)\}\}/g, (_, v) => `<svg class="wordmark" viewBox="${wbb[0] - 1} ${wbb[1] - 1} ${wbb[2] - wbb[0] + 2} ${wbb[3] - wbb[1] + 2}" role="img" aria-label="Fintegre"><path fill="${C[v] || v}" fill-rule="evenodd" d="${wmD}"/></svg>`)
  .replace(/\{\{icon:(\w+)\}\}/g, (_, id) => iconSVG(id))
  .replace('{{icongrid}}', icongrid)
  .replace(/\{\{illus:(\w+)\}\}/g, (_, id) => ILLUS[id].svg)
  .replace('{{construction}}', construction())
  .replace('{{clearspace}}', clearspace())
  // the brand film (scripts/web-film.sh): raw base64 in inert script tags, main.js turns one into a Blob
  .replace(/\{\{film:(mp4|webm)\}\}/g, (_, k) => b64(`assets/web/film.${k}`))
  .replace('{{film:poster}}', `data:image/webp;base64,${b64('assets/web/film-poster.webp')}`);

const left = html.match(/\{\{[^}]+\}\}/g);
if (left) throw new Error('Unresolved tokens: ' + left.join(', '));
const parts = html.split('/*BUNDLE*/');
html = parts[0] + js + parts[1];

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/fintegre-brand-book.html', html);
// local preview with a document shell (the artifact host adds its own)
const shell = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${html}</body></html>`;
fs.writeFileSync('dist/test.html', shell);
console.log('bytes', html.length, 'js', js.length);
