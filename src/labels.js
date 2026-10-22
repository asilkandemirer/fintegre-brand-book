// DOM labels pinned to points in the 3D world. Each label decodes in when it
// becomes visible and collapses on a hairline when it leaves.
import { Vector3 } from 'three';
import { TextFX } from './textfx.js';

export class Labels {
  constructor(root, world, fxm) {
    this.root = root;
    this.world = world;
    this.fxm = fxm;
    this.items = [];
    this.tmp = { x: 0, y: 0, z: 0 };
  }

  // html: label content; pos: () => Vector3 (world); opts: {cls, dx, dy, align}
  add(html, pos, opts = {}) {
    const el = document.createElement('div');
    el.className = 'lbl ' + (opts.cls || '');
    const inner = document.createElement('div');
    inner.className = 'lbl-in';
    inner.innerHTML = html;
    inner.dataset.fx = opts.fx || 'label';
    el.appendChild(inner);
    this.root.appendChild(el);
    const fx = new TextFX(inner);
    if (opts.silent) fx.silent = true;
    this.fxm.items.push(fx);
    const item = { el, fx, pos, want: false, dx: opts.dx || 0, dy: opts.dy || 0, v: new Vector3() };
    this.items.push(item);
    return item;
  }

  show(item, on) { item.want = on; }

  update(t) {
    const w = this.world;
    for (const it of this.items) {
      const st = it.fx.state;
      const active = it.want || st === 'in' || st === 'shown' || st === 'out';
      if (it.want && (st === 'hidden' || st === 'out')) it.fx.show(t, st === 'out');
      else if (!it.want && (st === 'in' || st === 'shown')) it.fx.hide(t);
      if (!active) { if (it.el.style.visibility !== 'hidden') it.el.style.visibility = 'hidden'; continue; }
      it.v.copy(typeof it.pos === 'function' ? it.pos() : it.pos);
      const p = w.project(it.v, this.tmp);
      const behind = p.z > 1;
      it.el.style.visibility = behind ? 'hidden' : 'visible';
      it.el.style.transform = `translate3d(${(p.x + it.dx).toFixed(1)}px,${(p.y + it.dy).toFixed(1)}px,0)`;
    }
  }

  measure() { for (const it of this.items) it.fx.measure(); }
}
