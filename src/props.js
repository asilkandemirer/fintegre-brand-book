// Reusable 3D props: a titanium phone with a live trade-in screen, slanted nodes.
import { Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial, Color } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { roundedRect } from './ch/common.js';
import { tex, phoneScreen, logoTile } from './textures.js';

let screenTex = null, tileTex = null;

export function makePhone(renderer) {
  const g = new Group();
  const body = new Mesh(
    new RoundedBoxGeometry(0.78, 1.62, 0.085, 6, 0.11),
    new MeshPhysicalMaterial({ color: new Color('#A7B0BE'), metalness: 1, roughness: 0.24, clearcoat: 0.6, envMapIntensity: 1.2 })
  );
  g.add(body);
  if (!screenTex) screenTex = tex(phoneScreen(), renderer);
  const screen = new Mesh(roundedRect(0.72, 1.555, 0.085), new MeshBasicMaterial({ map: screenTex }));
  screen.position.z = 0.0435;
  g.add(screen);
  // glossy glass over the screen catches the studio reflections
  const glass = new Mesh(
    roundedRect(0.72, 1.555, 0.085),
    new MeshPhysicalMaterial({ color: 0x000000, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.18, clearcoat: 1, envMapIntensity: 1.6 })
  );
  glass.position.z = 0.045;
  g.add(glass);
  if (!tileTex) tileTex = tex(logoTile(256, null, '#2a2f38'), renderer);
  const back = new Mesh(roundedRect(0.26, 0.26, 0.06), new MeshBasicMaterial({ map: tileTex, transparent: true }));
  back.position.z = -0.0435;
  back.rotation.y = Math.PI;
  back.position.y = 0.42;
  g.add(back);
  return g;
}
