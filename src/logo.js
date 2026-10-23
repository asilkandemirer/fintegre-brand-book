// The Fintegre mark, measured from the client's master artwork.
// Four parallelograms, y-up, total height = 1, centred on the origin.
// Corners are listed TL, BL, BR, TR (counter-clockwise in y-up space).
import { Shape, ExtrudeGeometry, BufferAttribute } from 'three';

export const LOGO = [
  [[-0.28, 0.5], [-0.3936, 0.2499], [0.5868, 0.2499], [0.7104, 0.5]],
  [[-0.4478, 0.1245], [-0.5609, -0.1127], [0.2674, -0.1127], [0.3839, 0.1245]],
  [[-0.6044, -0.2424], [-0.7104, -0.5], [-0.4503, -0.5], [-0.3396, -0.2424]],
  [[-0.2355, -0.2269], [-0.338, -0.4495], [-0.069, -0.4495], [0.0356, -0.2269]],
];
export const LOGO_W = 1.4208; // width / height
export const SLANT_DEG = 65; // mean edge angle across the three supplied versions (64.5–65.6°)

export const centroid = (b) => [
  (b[0][0] + b[1][0] + b[2][0] + b[3][0]) / 4,
  (b[0][1] + b[1][1] + b[2][1] + b[3][1]) / 4,
];

// Trace a polygon with rounded corners onto anything with a canvas-like path API
// (CanvasRenderingContext2D, THREE.Shape, or our SVG recorder).
export function roundedPoly(target, pts, r, tx = (p) => p) {
  const n = pts.length;
  const P = pts.map(tx);
  const corners = [];
  for (let i = 0; i < n; i++) {
    const p = P[i];
    const a = P[(i - 1 + n) % n];
    const b = P[(i + 1) % n];
    const va = [a[0] - p[0], a[1] - p[1]];
    const vb = [b[0] - p[0], b[1] - p[1]];
    const la = Math.hypot(va[0], va[1]);
    const lb = Math.hypot(vb[0], vb[1]);
    va[0] /= la; va[1] /= la; vb[0] /= lb; vb[1] /= lb;
    const cos = Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1]));
    const theta = Math.acos(cos);
    let t = r / Math.tan(theta / 2);
    t = Math.min(t, la * 0.45, lb * 0.45);
    corners.push({
      p,
      s: [p[0] + va[0] * t, p[1] + va[1] * t],
      e: [p[0] + vb[0] * t, p[1] + vb[1] * t],
    });
  }
  target.moveTo(corners[0].e[0], corners[0].e[1]);
  for (let i = 1; i <= n; i++) {
    const c = corners[i % n];
    target.lineTo(c.s[0], c.s[1]);
    target.quadraticCurveTo(c.p[0], c.p[1], c.e[0], c.e[1]);
  }
  if (target.closePath) target.closePath();
}

// SVG path strings (y-down). Unit: logo height = h.
export function logoSVGPaths(h = 100, r = 0.03) {
  return LOGO.map((b) => {
    let d = '';
    const rec = {
      moveTo: (x, y) => (d += `M${x.toFixed(2)} ${y.toFixed(2)}`),
      lineTo: (x, y) => (d += `L${x.toFixed(2)} ${y.toFixed(2)}`),
      quadraticCurveTo: (cx, cy, x, y) =>
        (d += `Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`),
      closePath: () => (d += 'Z'),
    };
    roundedPoly(rec, b, r * h, (p) => [p[0] * h, -p[1] * h]);
    return d;
  });
}

let uid = 0;
export function logoSVG({ h = 100, fill = 'currentColor', gradient = null, cls = '' } = {}) {
  const w = LOGO_W * h;
  const paths = logoSVGPaths(h);
  const id = 'lg' + ++uid;
  const grad = gradient
    ? `<defs><linearGradient id="${id}" x1="${-w / 2}" y1="0" x2="${w / 2}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${gradient[0]}"/><stop offset="1" stop-color="${gradient[1]}"/></linearGradient></defs>`
    : '';
  const f = gradient ? `url(#${id})` : fill;
  return `<svg class="${cls}" viewBox="${(-w / 2 - 1).toFixed(1)} ${(-h / 2 - 1).toFixed(1)} ${(w + 2).toFixed(1)} ${(h + 2).toFixed(1)}" aria-hidden="true">${grad}<g fill="${f}">${paths
    .map((d) => `<path d="${d}"/>`)
    .join('')}</g></svg>`;
}

// Draw the mark into a 2D canvas, centred at (cx, cy), height h (pixels).
export function drawLogo(ctx, cx, cy, h, fill, r = 0.03) {
  ctx.save();
  ctx.fillStyle = fill;
  for (const b of LOGO) {
    ctx.beginPath();
    roundedPoly(ctx, b, r * h, (p) => [cx + p[0] * h, cy - p[1] * h]);
    ctx.fill();
  }
  ctx.restore();
}

// Extruded block geometries, each centred on its own centroid so blocks can move
// independently. Adds a `gx` attribute (0..1 across the full mark) for the
// signature left-to-right indigo→ice gradient.
export function buildBlockGeometries({ depth = 0.16, r = 0.026, bevel = 0.012 } = {}) {
  return LOGO.map((b) => {
    const c = centroid(b);
    const shape = new Shape();
    roundedPoly(shape, b, r, (p) => [p[0] - c[0], p[1] - c[1]]);
    const g = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel * 1.4,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 10,
    });
    g.translate(0, 0, -depth / 2);
    const pos = g.attributes.position;
    const gx = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) gx[i] = (pos.getX(i) + c[0] + LOGO_W / 2) / LOGO_W;
    g.setAttribute('gx', new BufferAttribute(gx, 1));
    return { geometry: g, centroid: c };
  });
}
