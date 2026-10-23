// Fintegre icon set and spot illustrations.
// Icons: 24 × 24 grid, 2 px padding, 1.75 px stroke, round caps and joins, diagonals at 65°,
// one indigo accent element per icon. `s` = stroke paths, `a` = the accent (fill or stroke).

export const ICONS = [
  { id: 'trade', name: 'Trade-in',
    s: ['M4.01 9.09A8.5 8.5 0 0 1 19.36 7.75', 'M19.59 5.16L19.36 7.75L17 6.65',
      'M19.99 14.91A8.5 8.5 0 0 1 4.64 16.25', 'M4.41 18.84L4.64 16.25L7 17.35'],
    a: { t: 'fill', d: 'M10.5 7.5h3a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 15V9a1.5 1.5 0 0 1 1.5-1.5z' } },
  { id: 'value', name: 'Valuation',
    s: ['M3.5 12.6V5a1.5 1.5 0 0 1 1.5-1.5h7.6a1.5 1.5 0 0 1 1.06.44l6.9 6.9a1.5 1.5 0 0 1 0 2.12l-7.6 7.6a1.5 1.5 0 0 1-2.12 0l-6.9-6.9a1.5 1.5 0 0 1-.44-1.06z'],
    a: { t: 'stroke', d: 'M11.4 17l2.7-5.8' }, dot: [8, 8, 1.6] },
  { id: 'check', name: 'Device check',
    s: ['M8.5 3h7A2.5 2.5 0 0 1 18 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 6 18.5v-13A2.5 2.5 0 0 1 8.5 3z', 'M10.5 5.75h3'],
    a: { t: 'stroke', d: 'M9 12.2l2.1 2.2L15 10' } },
  { id: 'wipe', name: 'Data wipe',
    s: ['M12 3l7 2.8v5.4c0 4.4-2.9 8.1-7 9.8-4.1-1.7-7-5.4-7-9.8V5.8z', 'M9.6 15.6l2.2-4.7'],
    a: { t: 'stroke', d: 'M12.6 15.6l2.2-4.7' } },
  { id: 'pay', name: 'Instant payment',
    s: ['M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z', 'M3 10h18'],
    a: { t: 'fill', d: 'M6.5 13.25h3.5a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-.75.75H6.5a.75.75 0 0 1-.75-.75v-1a.75.75 0 0 1 .75-.75z' } },
  { id: 'plan', name: 'Instalments',
    s: ['M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M8.5 3v4', 'M15.5 3v4', 'M4 10h16', 'M7.5 13h3v3h-3z'],
    a: { t: 'fill', d: 'M13.5 13h3v3h-3z' } },
  { id: 'store', name: 'Store',
    s: ['M3.5 9.5L5 4.5h14l1.5 5', 'M3.5 9.5h17', 'M5 9.5V20h14V9.5'],
    a: { t: 'fill', d: 'M10 14.5h4V20h-4z' } },
  { id: 'pickup', name: 'Courier pickup',
    s: ['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M12 12v9', 'M4 7.5l8 4.5 8-4.5'],
    a: { t: 'fill', d: 'M4 7.5L12 3l8 4.5-8 4.5z' } },
  { id: 'upgrade', name: 'Upgrade',
    s: ['M8.6 20l5.02-10.79', 'M4.5 20.5h15'],
    a: { t: 'fill', d: 'M15.4 5.4L15.7 10.18L11.54 8.24z' } },
  { id: 'partner', name: 'Partner',
    s: ['M5.5 3.5h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M12.5 10.5h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z'],
    a: { t: 'fill', d: 'M10.5 10.5h3v3h-3z' } },
  { id: 'secure', name: 'Secure',
    s: ['M7 10.5h10a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6.5a2 2 0 0 1 2-2z', 'M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5', 'M12 16.6v1.6'],
    a: { t: 'fill', d: 'M12 13.8a1.4 1.4 0 1 1 0 2.8a1.4 1.4 0 1 1 0-2.8z' } },
  { id: 'support', name: 'Support',
    s: ['M6 4h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6l-4.5 3.8V16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
    a: { t: 'fill', d: 'M8.5 9a1 1 0 1 1 0 2a1 1 0 1 1 0-2zM12 9a1 1 0 1 1 0 2a1 1 0 1 1 0-2zM15.5 9a1 1 0 1 1 0 2a1 1 0 1 1 0-2z' } },
];

export const icon = (id) => ICONS.find((i) => i.id === id);

// Static SVG for one icon. `accent` colours the accent element; the rest follows currentColor.
export function iconSVG(id, { size = 24, accent = 'var(--acc-icon, #3047EC)', cls = 'ico', stroke = 1.75 } = {}) {
  const ic = icon(id);
  const s = ic.s.map((d) => `<path d="${d}"/>`).join('');
  const dot = ic.dot ? `<circle class="ia" cx="${ic.dot[0]}" cy="${ic.dot[1]}" r="${ic.dot[2]}" fill="${accent}" stroke="none"/>` : '';
  const a = ic.a.t === 'fill'
    ? `<path class="ia" d="${ic.a.d}" fill="${accent}" stroke="${accent}"/>`
    : `<path class="ia" d="${ic.a.d}" stroke="${accent}"/>`;
  return `<svg class="${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${ic.name}">${s}${a}${dot}</svg>`;
}

// ---------------------------------------------------------------------------
// Spot illustrations: the icon line × 4 with flat planes cut at 65°.
// A 65° plane of height h shifts sideways by h / tan(65°) ≈ 0.4663 h.
const K = 0.4663;
const plane = (x, yb, w, h, fill) => {
  const dx = h * K;
  return `<path d="M${x} ${yb}L${(x + dx).toFixed(1)} ${yb - h}H${(x + dx + w).toFixed(1)}L${x + w} ${yb}Z" fill="${fill}"/>`;
};
const L = 'fill="none" stroke="#0F1115" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';

export const ILLUS = {
  old: {
    title: 'Bring the old',
    text: 'The customer brings the device they already have.',
    svg: `<svg viewBox="0 0 320 240" role="img" aria-label="An older phone on its way to the counter">
${plane(36, 206, 150, 140, '#B7D7FF')}${plane(196, 206, 56, 64, '#3047EC')}
<g transform="rotate(-10 160 118)"><rect x="118" y="42" width="78" height="146" rx="16" ${L}/><rect x="128" y="56" width="58" height="104" rx="6" fill="#F5F7FA" stroke="#0F1115" stroke-width="2"/>
<path d="M150 56l-8 22 14 8-10 26 12 10-6 20" fill="none" stroke="#0F1115" stroke-width="1.6" stroke-linejoin="round"/><path d="M148 172h18" ${L}/></g>
<path d="M226 92l10-21M240 104l10-21M254 116l10-21" ${L} stroke="#3047EC"/></svg>`,
  },
  value: {
    title: 'See the value',
    text: 'Its value appears as one clear number, in seconds.',
    svg: `<svg viewBox="0 0 320 240" role="img" aria-label="A price tag above rising value bars">
${plane(48, 206, 120, 150, '#3047EC')}${plane(170, 206, 104, 70, '#B7D7FF')}
<path d="M70 108V66a6 6 0 0 1 6-6h42a6 6 0 0 1 4.2 1.8l38 38a6 6 0 0 1 0 8.5l-42 42a6 6 0 0 1-8.5 0l-38-38A6 6 0 0 1 70 108z" fill="#F5F7FA" ${L.replace('fill="none" ', '')}/>
<circle cx="92" cy="82" r="7" fill="#3047EC"/><path d="M112 132l12-26" ${L}/>
<path d="M188 196v-34h22v34M222 196v-58h22v58M256 196v-84h22v84" fill="#F5F7FA" stroke="#0F1115" stroke-width="3" stroke-linejoin="round"/>
<path d="M176 196h112" ${L}/><path d="M246 96l12-26 11 19" ${L} stroke="#3047EC"/></svg>`,
  },
  next: {
    title: 'Take the new',
    text: 'They leave with the new device. The old one is already counted toward it.',
    svg: `<svg viewBox="0 0 320 240" role="img" aria-label="A new phone rising from its open box">
${plane(40, 206, 96, 120, '#B7D7FF')}${plane(150, 206, 130, 150, '#3047EC')}
<path d="M98 206v-44h124v44z" fill="#F5F7FA" ${L.replace('fill="none" ', '')}/><path d="M98 162l-14-20h124l14 20" ${L}/>
<rect x="128" y="30" width="64" height="122" rx="14" fill="#F5F7FA" stroke="#0F1115" stroke-width="3"/><rect x="137" y="42" width="46" height="92" rx="6" fill="#B7D7FF"/>
<path d="M152 140h16" ${L}/><path d="M212 54l9-19M226 70l9-19M98 70l9-19" ${L} stroke="#3047EC"/></svg>`,
  },
};
