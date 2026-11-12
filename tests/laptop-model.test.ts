import { readFileSync } from 'node:fs';
import { Box3, Matrix4, Object3D, Vector3 } from 'three';
import { expect, test } from 'vitest';

// Inspect the shipped GLB, including its exported transforms, without WebGL.
const bytes = readFileSync(new URL('../public/models/room.glb', import.meta.url));
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const nodes: Object3D[] = gltf.nodes.map((node: {
  name: string; translation?: number[]; rotation?: number[]; scale?: number[]; matrix?: number[];
}) => {
  const object = new Object3D();
  object.name = node.name;
  if (node.translation) object.position.fromArray(node.translation);
  if (node.rotation) object.quaternion.fromArray(node.rotation);
  if (node.scale) object.scale.fromArray(node.scale);
  if (node.matrix) new Matrix4().fromArray(node.matrix).decompose(object.position, object.quaternion, object.scale);
  return object;
});
gltf.nodes.forEach((node: { children?: number[] }, i: number) => {
  node.children?.forEach(child => nodes[i].add(nodes[child]));
});
nodes.filter(node => !node.parent).forEach(node => node.updateMatrixWorld(true));

function named(name: string) {
  const node = nodes.find(node => node.name === name);
  if (!node) throw new Error(`Missing exported laptop part: ${name}`);
  return node;
}

function bounds(name: string, frame: Object3D) {
  const node = named(name);
  const mesh = gltf.meshes[gltf.nodes[nodes.indexOf(node)].mesh];
  const box = new Box3();
  for (const primitive of mesh.primitives) {
    const accessor = gltf.accessors[primitive.attributes.POSITION];
    box.union(new Box3(new Vector3().fromArray(accessor.min), new Vector3().fromArray(accessor.max)));
  }
  return box.applyMatrix4(new Matrix4().copy(frame.matrixWorld).invert().multiply(node.matrixWorld));
}

test('lid layers share a pivot at the hinge and open toward the rear', () => {
  const lid = named('LaptopLidRoot');
  const base = named('MacBookRoot');
  expect(lid.parent).toBe(base);
  expect(lid.position.distanceTo(named('Laptop hinge barrel').position)).toBeLessThan(.00001);
  for (const name of ['Laptop lid chassis', 'Laptop display glass', 'LaptopDisplay', 'Laptop camera notch']) {
    expect(named(name).parent).toBe(lid);
  }
  const top = new Vector3(0, .38, 0).applyQuaternion(lid.quaternion).add(lid.position);
  expect(top.y).toBeGreaterThan(lid.position.y);
  expect(top.z).toBeLessThan(lid.position.z);
});

test('visible lid surfaces have physical separation to prevent depth fighting', () => {
  const lid = named('LaptopLidRoot');
  const chassis = bounds('Laptop lid chassis', lid);
  const bezel = bounds('Laptop display glass', lid);
  const screen = bounds('LaptopDisplay', lid);
  const notch = bounds('Laptop camera notch', lid);
  expect(bezel.max.z - chassis.max.z).toBeGreaterThan(.001);
  expect(screen.min.z - bezel.max.z).toBeGreaterThan(.001);
  expect(notch.min.z - screen.max.z).toBeGreaterThan(.0005);
});

test('keycaps clear the keyboard well and adjacent keys do not intersect', () => {
  const base = named('MacBookRoot');
  const well = bounds('Laptop keyboard well', base);
  const keys = nodes.filter(node => node.name.startsWith('LapKey_')).map(node => bounds(node.name, base));
  expect(keys.length).toBeGreaterThan(70);
  keys.forEach((key, i) => {
    expect(key.min.y - well.max.y).toBeGreaterThan(.0004);
    for (const other of keys.slice(i + 1)) expect(key.intersectsBox(other)).toBe(false);
  });
  const trackpad = bounds('Laptop trackpad', base);
  expect(trackpad.min.y).toBeGreaterThan(bounds('Laptop trackpad border', base).max.y);
  expect(trackpad.min.z).toBeGreaterThan(well.max.z);
});
