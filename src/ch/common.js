// Helpers shared by chapter modules.
import { LOGO_W } from '../logo.js';
import { Shape, ShapeGeometry, BufferAttribute } from 'three';

export const HALF_H0 = Math.tan((15 * Math.PI) / 180) * 9; // visible half-height at the origin, base camera

// Logo scale so that it occupies at most wFrac of screen width and hFrac of height.
export function fitLogo(c, wFrac, hFrac = 0.5) {
  return Math.min((wFrac * 2 * c.halfW0) / LOGO_W, hFrac * 2 * HALF_H0);
}

// Did progress cross x since the last frame (in either direction)?
export const crossed = (prev, u, x) => (prev < x && u >= x) || (prev >= x && u < x);
export const crossedFwd = (prev, u, x) => prev < x && u >= x;

// A rounded rectangle plane with proper 0..1 UVs.
export function roundedRect(w, h, r) {
  const s = new Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new ShapeGeometry(s, 8);
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getX(i) - x) / w;
    uv[i * 2 + 1] = (p.getY(i) - y) / h;
  }
  g.setAttribute('uv', new BufferAttribute(uv, 2));
  return g;
}

// Toggle a CSS class on an element based on a threshold with direction awareness.
export function classAt(el, cls, on) {
  if (!el) return;
  if (on !== el.classList.contains(cls)) el.classList.toggle(cls, on);
}
