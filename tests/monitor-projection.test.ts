import { expect, test } from 'vitest';
import { scaleProjectionForLayout } from '../src/lib/monitorProjection';

test('layout zoom preserves the projected corners while the camera is still moving', () => {
  const matrix = [1.1,.02,0,.0001, .01,1.05,0,.00002, 0,0,1,0, 120,80,0,1];
  for (const scale of [.3,.75,1.2,2]) {
    const adjusted = scaleProjectionForLayout(matrix, scale);
    for (const [x,y] of [[0,0],[1600,0],[1600,709],[0,709]]) {
      const project = (m: number[]) => {
        const w=m[3]*x+m[7]*y+m[15];
        return [(m[0]*x+m[4]*y+m[12])/w,(m[1]*x+m[5]*y+m[13])/w];
      };
      const expected = project(matrix), actual = project(adjusted);
      expect(actual[0]*scale).toBeCloseTo(expected[0], 8);
      expect(actual[1]*scale).toBeCloseTo(expected[1], 8);
    }
  }
});
