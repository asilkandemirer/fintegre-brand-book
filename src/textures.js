// Brand surfaces drawn in code: phone UI, touchpoint cards, the partner plaque.
// Everything is drawn into canvases so the page ships without image files.
import { CanvasTexture, SRGBColorSpace, LinearMipmapLinearFilter } from 'three';
import { drawLogo, LOGO_W } from './logo.js';

export const HEX = {
  graphite: '#0F1115', titanium: '#A7B0BE', indigo: '#3047EC', ice: '#B7D7FF', smoke: '#F5F7FA',
  ink2: '#5A6170', line: 'rgba(15,17,21,.12)', lineD: 'rgba(183,215,255,.16)',
};
const DISPLAY = 'Geologica, "Helvetica Neue", Arial, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';

function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
export function tex(canvas, renderer) {
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
  t.minFilter = LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function font(ctx, size, weight = 400, fam = DISPLAY) { ctx.font = `${weight} ${size}px ${fam}`; }
function mono(ctx, txt, x, y, size, col, ls = 0.14, align = 'left') {
  font(ctx, size, 500, MONO);
  ctx.fillStyle = col;
  ctx.textAlign = align;
  try { ctx.letterSpacing = `${size * ls}px`; } catch (e) { /* older engines */ }
  ctx.fillText(txt.toUpperCase(), x, y);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* */ }
}
function wrap(ctx, txt, x, y, maxW, lh) {
  const words = txt.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lh;
    } else line = test;
  }
  ctx.fillText(line, x, y);
  return y;
}
function grad(ctx, x0, y0, x1, y1, a = HEX.indigo, b = HEX.ice) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}
// Slanted bars at the brand angle (65°), used as a recurring graphic device.
function slantBars(ctx, x, y, w, h, n, col, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = col;
  const k = 1 / Math.tan((65 * Math.PI) / 180);
  for (let i = 0; i < n; i++) {
    const bw = w * (0.9 - i * 0.18);
    const by = y + i * (h / n);
    const bh = (h / n) * 0.62;
    ctx.beginPath();
    ctx.moveTo(x + bh * k, by);
    ctx.lineTo(x + bw + bh * k, by);
    ctx.lineTo(x + bw, by + bh);
    ctx.lineTo(x, by + bh);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function logoTile(size = 512, bg = HEX.graphite, fg = null) {
  const [c, ctx] = cv(size, size);
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size); }
  const h = size * 0.42;
  const g = fg || grad(ctx, size / 2 - (h * LOGO_W) / 2, 0, size / 2 + (h * LOGO_W) / 2, 0);
  drawLogo(ctx, size / 2, size / 2, h, g);
  return c;
}

export function phoneScreen() {
  const W = 620, H = 1340;
  const [c, ctx] = cv(W, H);
  ctx.fillStyle = HEX.graphite;
  ctx.fillRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W * 0.8, H * 0.1, 10, W * 0.8, H * 0.1, W * 1.1);
  bg.addColorStop(0, 'rgba(48,71,236,.42)');
  bg.addColorStop(1, 'rgba(48,71,236,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // status bar
  font(ctx, 26, 600);
  ctx.fillStyle = HEX.smoke;
  ctx.textAlign = 'left';
  ctx.fillText('9:41', 56, 70);
  ctx.fillRect(W - 120, 52, 52, 22);
  // header
  drawLogo(ctx, 76, 160, 34, grad(ctx, 50, 0, 100, 0));
  mono(ctx, 'Trade-in · Store 24', 112, 170, 20, HEX.titanium);
  // device row
  mono(ctx, 'Your device', 56, 290, 20, HEX.titanium);
  font(ctx, 40, 500);
  ctx.fillStyle = HEX.smoke;
  ctx.fillText('Smartphone · 256 GB', 56, 345);
  mono(ctx, 'Grade A · Battery 91%', 56, 392, 20, HEX.ice);
  // value
  mono(ctx, 'Estimated value', 56, 520, 20, HEX.titanium);
  font(ctx, 150, 300);
  ctx.fillStyle = HEX.smoke;
  ctx.fillText('€412', 48, 670);
  font(ctx, 26, 400);
  ctx.fillStyle = HEX.titanium;
  ctx.fillText('Applied to your new device today', 56, 722);
  // steps
  const steps = ['Assess', 'Value', 'Route', 'Transact', 'Recover'];
  steps.forEach((s, i) => {
    const y = 820 + i * 62;
    const done = i < 3;
    ctx.fillStyle = done ? HEX.indigo : 'rgba(167,176,190,.25)';
    ctx.beginPath();
    ctx.moveTo(56 + 8, y - 22); ctx.lineTo(56 + 30, y - 22); ctx.lineTo(56 + 22, y); ctx.lineTo(56, y); ctx.closePath();
    ctx.fill();
    font(ctx, 30, done ? 500 : 400);
    ctx.fillStyle = done ? HEX.smoke : HEX.titanium;
    ctx.fillText(s, 110, y);
    mono(ctx, done ? 'Done' : i === 3 ? 'Next' : '—', W - 56, y, 18, done ? HEX.ice : HEX.titanium, 0.12, 'right');
    ctx.textAlign = 'left';
  });
  // CTA
  rr(ctx, 48, H - 210, W - 96, 104, 52);
  ctx.fillStyle = grad(ctx, 48, 0, W - 48, 0);
  ctx.fill();
  font(ctx, 32, 600);
  ctx.fillStyle = HEX.graphite;
  ctx.textAlign = 'center';
  ctx.fillText('Accept offer', W / 2, H - 146);
  ctx.textAlign = 'left';
  return c;
}

function cardBase(w, h, dark = true) {
  const [c, ctx] = cv(w, h);
  ctx.fillStyle = dark ? HEX.graphite : HEX.smoke;
  ctx.fillRect(0, 0, w, h);
  return [c, ctx];
}

export function cardWebsite() {
  const W = 1280, H = 820;
  const [c, ctx] = cardBase(W, H, true);
  const g = ctx.createRadialGradient(W * 0.85, H * 0.3, 10, W * 0.85, H * 0.3, W * 0.7);
  g.addColorStop(0, 'rgba(48,71,236,.55)');
  g.addColorStop(1, 'rgba(48,71,236,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, 74, 60, 30, grad(ctx, 50, 0, 100, 0));
  font(ctx, 26, 500);
  ctx.fillStyle = HEX.smoke;
  ctx.fillText('Fintegre', 108, 70);
  const nav = ['Platform', 'Solutions', 'Intelligence', 'Customers', 'Insights', 'Company'];
  font(ctx, 20, 400);
  ctx.fillStyle = HEX.titanium;
  let x = 330;
  for (const n of nav) { ctx.fillText(n, x, 68); x += ctx.measureText(n).width + 34; }
  rr(ctx, W - 290, 38, 240, 48, 24);
  ctx.fillStyle = HEX.smoke;
  ctx.fill();
  font(ctx, 18, 600);
  ctx.fillStyle = HEX.graphite;
  ctx.textAlign = 'center';
  ctx.fillText('Design your program', W - 170, 69);
  ctx.textAlign = 'left';
  font(ctx, 96, 500);
  ctx.fillStyle = HEX.smoke;
  ctx.fillText('Make every device', 64, 330);
  ctx.fillText('worth more.', 64, 432);
  font(ctx, 26, 300);
  ctx.fillStyle = HEX.titanium;
  wrap(ctx, 'Intelligent trade-in programs for retailers, telecom operators and device ecosystems.', 66, 500, 640, 38);
  slantBars(ctx, 820, 420, 380, 300, 4, HEX.indigo, 0.9);
  mono(ctx, 'fintegre.com', 64, H - 50, 18, HEX.titanium);
  return c;
}

export function cardLinkedIn() {
  const W = 860, H = 1080;
  const [c, ctx] = cardBase(W, H, false);
  ctx.fillStyle = '#ffffff';
  rr(ctx, 0, 0, W, H, 0);
  ctx.fill();
  // header
  rr(ctx, 44, 44, 84, 84, 18);
  ctx.fillStyle = HEX.graphite;
  ctx.fill();
  drawLogo(ctx, 86, 86, 30, grad(ctx, 60, 0, 112, 0));
  font(ctx, 28, 600);
  ctx.fillStyle = HEX.graphite;
  ctx.fillText('Fintegre', 152, 80);
  font(ctx, 22, 400);
  ctx.fillStyle = HEX.ink2;
  ctx.fillText('Device Value Intelligence', 152, 116);
  font(ctx, 34, 500);
  ctx.fillStyle = HEX.graphite;
  wrap(ctx, 'iPhone 15 residual values across five European markets: what changed this quarter?', 44, 210, W - 88, 46);
  // chart
  const cx = 44, cy = 360, cw = W - 88, ch = 520;
  rr(ctx, cx, cy, cw, ch, 22);
  ctx.fillStyle = HEX.graphite;
  ctx.fill();
  mono(ctx, 'Residual value index · illustrative', cx + 34, cy + 56, 18, HEX.titanium);
  const vals = [0.82, 0.74, 0.69, 0.63, 0.55];
  const labels = ['Market A', 'Market B', 'Market C', 'Market D', 'Market E'];
  vals.forEach((v, i) => {
    const y = cy + 110 + i * 78;
    const bw = (cw - 300) * v;
    const k = 0.466; // 1/tan(65°)
    ctx.fillStyle = grad(ctx, cx + 200, 0, cx + 200 + bw, 0);
    ctx.beginPath();
    ctx.moveTo(cx + 200 + 40 * k, y);
    ctx.lineTo(cx + 200 + bw + 40 * k, y);
    ctx.lineTo(cx + 200 + bw, y + 40);
    ctx.lineTo(cx + 200, y + 40);
    ctx.closePath();
    ctx.fill();
    mono(ctx, labels[i], cx + 34, y + 28, 18, HEX.smoke);
  });
  font(ctx, 22, 400);
  ctx.fillStyle = HEX.ink2;
  ctx.fillText('Read the full index on fintegre.com', 44, H - 92);
  return c;
}

export function cardReport() {
  const W = 840, H = 1120;
  const [c, ctx] = cv(W, H);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#2537c9');
  g.addColorStop(0.55, HEX.indigo);
  g.addColorStop(1, '#7da1ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  slantBars(ctx, 360, 120, 520, 520, 4, 'rgba(245,247,250,.16)');
  mono(ctx, 'Fintegre Intelligence · Report', 60, 90, 20, HEX.smoke);
  font(ctx, 92, 500);
  ctx.fillStyle = HEX.smoke;
  ctx.fillText('European', 56, 760);
  ctx.fillText('Device Value', 56, 860);
  ctx.fillText('Index', 56, 960);
  mono(ctx, 'Q4 · 2026', 60, H - 60, 22, HEX.ice);
  drawLogo(ctx, W - 100, H - 70, 40, HEX.smoke);
  return c;
}

export function cardDesigner() {
  const W = 1280, H = 820;
  const [c, ctx] = cardBase(W, H, false);
  mono(ctx, 'Program Designer', 64, 80, 20, HEX.indigo);
  font(ctx, 44, 500);
  ctx.fillStyle = HEX.graphite;
  ctx.fillText('What do you want your trade-in program to achieve?', 64, 150);
  rr(ctx, 64, 190, W - 128, 210, 22);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = HEX.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  font(ctx, 26, 300);
  ctx.fillStyle = HEX.graphite;
  wrap(ctx, '“We are an electronics retailer operating 40 stores in Romania. We want customers buying new iPhones to trade their existing phones in-store and online. We need two local buyers and want payment applied against the new device.”', 96, 248, W - 200, 38);
  mono(ctx, 'Recommended journey', 64, 470, 20, HEX.ink2);
  const steps = ['Customer', 'Device ID', 'Assessment', 'Valuation', 'Offer', 'Trade-in', 'Vendor allocation', 'Settlement'];
  let x = 64, y = 520;
  font(ctx, 24, 500);
  steps.forEach((s, i) => {
    const w = ctx.measureText(s).width + 48;
    if (x + w > W - 64) { x = 64; y += 76; }
    rr(ctx, x, y, w, 54, 27);
    ctx.fillStyle = i < 4 ? HEX.indigo : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = i < 4 ? HEX.indigo : HEX.line;
    ctx.stroke();
    ctx.fillStyle = i < 4 ? HEX.smoke : HEX.graphite;
    ctx.fillText(s, x + 24, y + 36);
    x += w + 16;
  });
  rr(ctx, 64, H - 110, 400, 62, 31);
  ctx.fillStyle = HEX.graphite;
  ctx.fill();
  font(ctx, 22, 600);
  ctx.fillStyle = HEX.smoke;
  ctx.fillText('Talk to Fintegre about this program', 92, H - 70);
  return c;
}

export function cardBusiness() {
  const W = 1050, H = 600;
  const [c, ctx] = cardBase(W, H, true);
  const g = ctx.createLinearGradient(0, H, W, 0);
  g.addColorStop(0, 'rgba(48,71,236,.0)');
  g.addColorStop(1, 'rgba(48,71,236,.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, 120, 120, 70, grad(ctx, 70, 0, 170, 0));
  font(ctx, 44, 500);
  ctx.fillStyle = HEX.smoke;
  ctx.fillText('Firstname Lastname', 70, 400);
  mono(ctx, 'Partnerships · Fintegre', 72, 450, 20, HEX.titanium);
  mono(ctx, 'fintegre.com', 72, 520, 20, HEX.ice);
  return c;
}

export function cardBanner() {
  const W = 640, H = 1280;
  const [c, ctx] = cv(W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, HEX.graphite);
  g.addColorStop(1, '#1a2266');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, W / 2, 330, 200, grad(ctx, W / 2 - 140, 0, W / 2 + 140, 0));
  font(ctx, 62, 500);
  ctx.fillStyle = HEX.smoke;
  ctx.textAlign = 'center';
  ctx.fillText('Make every', W / 2, 700);
  ctx.fillText('device worth', W / 2, 776);
  ctx.fillText('more.', W / 2, 852);
  ctx.textAlign = 'left';
  mono(ctx, 'fintegre.com', W / 2, H - 90, 22, HEX.ice, 0.14, 'center');
  ctx.textAlign = 'left';
  return c;
}

export function plaque() {
  const W = 1000, H = 560;
  const [c, ctx] = cv(W, H);
  ctx.fillStyle = HEX.smoke;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, 150, H / 2, 140, grad(ctx, 50, 0, 250, 0));
  mono(ctx, 'Certified', 300, 210, 24, HEX.ink2);
  font(ctx, 60, 500);
  ctx.fillStyle = HEX.graphite;
  ctx.fillText('Trade-in partner', 296, 290);
  mono(ctx, 'Powered by Fintegre', 300, 360, 22, HEX.indigo);
  return c;
}

export const CARDS = [
  { id: 'web', name: 'Website', make: cardWebsite, w: 1.6, h: 1.025 },
  { id: 'li', name: 'LinkedIn · Device Value Intelligence', make: cardLinkedIn, w: 1.0, h: 1.256 },
  { id: 'report', name: 'Market report', make: cardReport, w: 1.0, h: 1.333 },
  { id: 'designer', name: 'Program Designer', make: cardDesigner, w: 1.6, h: 1.025 },
  { id: 'card', name: 'Business card', make: cardBusiness, w: 1.4, h: 0.8 },
  { id: 'banner', name: 'Event banner', make: cardBanner, w: 0.75, h: 1.5 },
];
