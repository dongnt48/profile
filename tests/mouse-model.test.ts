import { readFileSync } from 'node:fs';
import { Box3, Matrix4, Quaternion, Vector3 } from 'three';
import { expect, test } from 'vitest';

const bytes = readFileSync(new URL('../public/models/room.glb', import.meta.url));
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());

function part(name: string) {
  const node = gltf.nodes.find((node: { name: string }) => node.name === name);
  if (!node) throw new Error(`Missing exported mouse part: ${name}`);
  const primitive = gltf.meshes[node.mesh].primitives[0];
  const position = gltf.accessors[primitive.attributes.POSITION];
  const matrix = new Matrix4().compose(
    new Vector3().fromArray(node.translation || [0, 0, 0]),
    new Quaternion().fromArray(node.rotation || [0, 0, 0, 1]),
    new Vector3().fromArray(node.scale || [1, 1, 1]),
  );
  const box = new Box3(new Vector3().fromArray(position.min), new Vector3().fromArray(position.max));
  return { node, position, box: box.applyMatrix4(matrix) };
}

test('mouse has one smooth palm dome with a recognizable low oval silhouette', () => {
  const { position, box } = part('Mouse palm shell');
  const size = box.getSize(new Vector3());
  expect(position.count).toBeGreaterThan(1000);
  expect(size.z / size.x).toBeGreaterThan(1.5);
  expect(size.z / size.x).toBeLessThan(1.9);
  expect(size.y).toBeGreaterThan(.03);
  expect(size.y).toBeLessThan(.05);
  const root = gltf.nodes.find((node: { name: string }) => node.name === 'MouseRoot');
  expect(root).toBeDefined();
  const children = root.children.map((index: number) => gltf.nodes[index].name);
  expect(children).toEqual(expect.arrayContaining([
    'Mouse palm shell', 'Mouse curved base', 'Mouse left button', 'Mouse right button', 'Mouse scroll wheel',
  ]));
});

test('two click paddles stay separated and the centered wheel is exposed', () => {
  const left = part('Mouse left button').box;
  const right = part('Mouse right button').box;
  const wheel = part('Mouse scroll wheel');
  expect(left.max.x).toBeLessThan(-.005);
  expect(right.min.x).toBeGreaterThan(.005);
  expect(wheel.box.min.x).toBeGreaterThan(left.max.x);
  expect(wheel.box.max.x).toBeLessThan(right.min.x);

  const body = part('Mouse palm shell').position;
  const view = gltf.bufferViews[body.bufferView];
  const start = 28 + jsonLength + (view.byteOffset || 0) + (body.byteOffset || 0);
  const center = wheel.box.getCenter(new Vector3());
  const heights: number[] = [];
  for (let i = 0; i < body.count; i++) {
    const offset = start + i * (view.byteStride || 12);
    const x = bytes.readFloatLE(offset);
    const y = bytes.readFloatLE(offset + 4);
    const z = bytes.readFloatLE(offset + 8);
    if (Math.abs(x) < .003 && Math.abs(z - center.z) < .003) heights.push(y);
  }
  expect(heights.length).toBeGreaterThan(0);
  expect(wheel.box.max.y - Math.max(...heights)).toBeGreaterThan(.004);
});
