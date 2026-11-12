import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const bytes = readFileSync(new URL('../public/models/room.glb', import.meta.url));
const length = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.subarray(20, 20 + length).toString());

function part(name: string) {
  const node = gltf.nodes.find((node: { name: string }) => node.name === name);
  if (!node) throw new Error(`Missing monitor component: ${name}`);
  const primitive = node.mesh === undefined ? null : gltf.meshes[node.mesh].primitives[0];
  const position = primitive ? gltf.accessors[primitive.attributes.POSITION] : null;
  const translation: number[] = node.translation || [0, 0, 0];
  return { node, primitive, position,
    bottom: position ? position.min[1] + translation[1] : null,
    top: position ? position.max[1] + translation[1] : null };
}

test('monitor enclosure keeps slim edges and a deeper electronics pod', () => {
  const { position } = part('Monitor tapered rear enclosure');
  const view = gltf.bufferViews[position.bufferView];
  const start = 28 + length + (view.byteOffset || 0) + (position.byteOffset || 0);
  const edges: number[] = [], all: number[] = [];
  for (let i = 0; i < position.count; i++) {
    const offset = start + i * (view.byteStride || 12);
    const x = bytes.readFloatLE(offset), y = bytes.readFloatLE(offset + 4), z = bytes.readFloatLE(offset + 8);
    all.push(-z);
    if (Math.abs(x) > .70 || Math.abs(y) > .30) edges.push(-z);
  }
  expect(edges.length).toBeGreaterThan(0);
  expect(Math.max(...edges)).toBeLessThan(.044);
  expect(Math.max(...all)).toBeGreaterThan(.08);
  expect(part('Monitor continuous front bezel').position.max[0]).toBeGreaterThan(.745);
});

test('screenbar clamp rests on the casing above the active image', () => {
  const body = part('Monitor tapered rear enclosure');
  const pad = part('ScreenBar monitor contact pad');
  expect(pad.bottom).toBeGreaterThan(.33);
  expect(pad.bottom! - body.top!).toBeGreaterThan(-.004);
  expect(pad.bottom! - body.top!).toBeLessThan(.002);
  const monitor = part('MonitorHardwareRoot').node;
  const bar = part('ScreenBarRoot').node;
  expect(monitor.children).toContain(gltf.nodes.indexOf(bar));
});

test('white diffuser is seated under its housing and has no emitted light', () => {
  const lens = part('ScreenBar recessed white diffuser');
  const housing = part('ScreenBar D-section housing');
  expect(Math.abs(lens.top! - housing.bottom!)).toBeLessThan(.0001);
  const material = gltf.materials[lens.primitive.material];
  expect(material.emissiveFactor || [0, 0, 0]).toEqual([0, 0, 0]);
  expect(material.pbrMetallicRoughness.baseColorFactor[0]).toBeGreaterThan(.8);
  expect(part('ScreenBarRoot').node.children).toContain(gltf.nodes.indexOf(lens.node));
});
