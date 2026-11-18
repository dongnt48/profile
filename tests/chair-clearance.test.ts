import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { Vector3 } from 'three';
import { WELCOME_ZOOM, MIN_ZOOM } from '../src/lib/roomZoom';

test('static headrest clears the original camera approach throughout zoom', () => {
  const bytes = readFileSync(new URL('../public/models/room.glb', import.meta.url));
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  const node = gltf.nodes.find((n: { name: string }) => n.name === 'Headrest frame');
  expect(node.translation).toBeUndefined();
  expect(node.rotation).toBeUndefined();
  const bounds = gltf.accessors[gltf.meshes[node.mesh].primitives[0].attributes.POSITION];
  // Preserve the old base.lerp(front, blend) path; test against exported geometry.
  for (const mobile of [false, true]) {
    for (let i = 0; i <= 1000; i++) {
      const progress = i / 1000;
      const zoom = WELCOME_ZOOM - progress * (WELCOME_ZOOM - MIN_ZOOM);
      const position = new Vector3(-7.8, 6.1, 8.6)
        .multiplyScalar(zoom * (mobile ? 1.15 : 1))
        .lerp(new Vector3(.1, 1.66, .501), progress ** 1.35);
      const intersects = ['x', 'y', 'z'].every((axis, index) => {
        const value = position[axis as 'x' | 'y' | 'z'];
        return value > bounds.min[index] - .10 && value < bounds.max[index] + .10;
      });
      expect(intersects, `zoom=${zoom}, mobile=${mobile}`).toBe(false);
    }
  }
});
