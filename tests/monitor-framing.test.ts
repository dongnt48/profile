import { expect, test } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { monitorFieldOfView } from '../src/lib/roomZoom';

test('zoomed screen stays fully visible and fills the limiting viewport dimension', () => {
  for (const aspect of [390 / 844, 768 / 1024, 4 / 3, 16 / 9, 21 / 9]) {
    const distance = aspect < .8 ? 1.48 : Math.max(1.48, 2.52 / Math.max(1.2, aspect));
    const camera = new PerspectiveCamera(monitorFieldOfView(distance, aspect), aspect, .05, 60);
    camera.position.set(.1, 1.66, -.979 + distance);
    camera.lookAt(.1, 1.66, -.979); camera.updateMatrixWorld();
    const corner = new Vector3(.845, 1.99, -.979).project(camera);
    expect(corner.x).toBeLessThanOrEqual(.880001);
    expect(corner.y).toBeLessThanOrEqual(.820001);
    expect(Math.max(corner.x / .88, corner.y / .82)).toBeCloseTo(1, 5);
  }
});
