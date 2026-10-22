import { logoSVGPaths, LOGO_W } from '../src/logo.js';
import fs from 'fs';
const H = 400, W = LOGO_W * H, pad = 60;
const paths = logoSVGPaths(H).map((d) => `<path d="${d}"/>`).join('');
const vb = `${(-W / 2 - pad).toFixed(1)} ${(-H / 2 - pad).toFixed(1)} ${(W + pad * 2).toFixed(1)} ${(H + pad * 2).toFixed(1)}`;
const grad = `<defs><linearGradient id="g" x1="${-W / 2}" y1="0" x2="${W / 2}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3047EC"/><stop offset="1" stop-color="#B7D7FF"/></linearGradient></defs>`;
const mk = (fill, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${defs}<g fill="${fill}">${paths}</g></svg>`;
fs.writeFileSync('pack/mark-gradient.svg', mk('url(#g)', grad));
fs.writeFileSync('pack/mark-white.svg', mk('#F5F7FA'));
fs.writeFileSync('pack/mark-graphite.svg', mk('#0F1115'));
// lockup: mark + wordmark
const d = fs.readFileSync('wordmark.d', 'utf8');
const bb = fs.readFileSync('wordmark_bbox.txt', 'utf8').replace(/[()]/g, '').split(',').map(Number);
const ww = bb[2] - bb[0], wh = bb[3] - bb[1];
const sc = (H * 0.62) / wh; // wordmark cap height relative to mark
const lock = (markFill, textFill, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(-W / 2 - pad).toFixed(1)} ${(-H / 2 - pad).toFixed(1)} ${(W + pad * 3 + ww * sc).toFixed(1)} ${(H + pad * 2).toFixed(1)}">${defs}<g fill="${markFill}">${paths}</g><g transform="translate(${(W / 2 + pad * 0.9).toFixed(1)} ${(-wh * sc / 2).toFixed(1)}) scale(${sc.toFixed(4)}) translate(${-bb[0]} ${-bb[1]})"><path fill="${textFill}" fill-rule="evenodd" d="${d}"/></g></svg>`;
fs.writeFileSync('pack/lockup-dark.svg', lock('url(#g)', '#0F1115', grad));
fs.writeFileSync('pack/lockup-white.svg', lock('#F5F7FA', '#F5F7FA'));
