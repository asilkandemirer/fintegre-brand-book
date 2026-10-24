// Renders video/blockout.js to PNG frames with headless Chromium, then to MP4 with ffmpeg.
// usage: node video/render.mjs <outDir> [from] [to]   (frames are numbered 0000.png …)
//        ENTRY=video/devices.js node video/render.mjs … renders another scene
//        node video/render.mjs <outDir> 30,120,410        (just these frames, for a quick look)
import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright')); }

const [out = 'video/out', from = '0', to = '599'] = process.argv.slice(2);
fs.mkdirSync(path.join(out, 'frames'), { recursive: true });
const js = (await build({ entryPoints: [process.env.ENTRY || 'video/blockout.js'], bundle: true, format: 'iife', write: false, minify: true })).outputFiles[0].text;
const html = path.resolve(out, 'blockout.html');
fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#000}canvas{display:block;width:1920px;height:1080px}</style><canvas width="1920" height="1080"></canvas><script>${js}</script>`);

const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.error('pageerror', e.message));
await p.goto('file://' + html);
await p.waitForFunction(() => window.renderAt);
const t0 = Date.now();
const list = from.includes(',') ? from.split(',').map(Number) : Array.from({ length: +to - +from + 1 }, (_, i) => +from + i);
for (const f of list) {
  await p.evaluate((f) => window.renderAt(f), f);
  await p.locator('canvas').screenshot({ path: path.join(out, 'frames', String(f).padStart(4, '0') + '.png') });
  if (f % 50 === 0) console.log('frame', f, ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
await b.close();
console.log('done', list.length, 'frames in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
