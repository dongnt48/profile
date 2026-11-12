import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const bytes = readFileSync(new URL('../public/models/room.glb', import.meta.url));
const length = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.subarray(20, 20 + length).toString());
type Node = { name: string; mesh?: number; children?: number[]; translation?: number[] };
const nodes: Node[] = gltf.nodes;
function part(name: string) {
  const node = nodes.find(node => node.name === name);
  if (!node) throw new Error(`Missing PC component: ${name}`);
  const primitive = node.mesh === undefined ? null : gltf.meshes[node.mesh].primitives[0];
  return { node, primitive, position: primitive ? gltf.accessors[primitive.attributes.POSITION] : null };
}
function values(id: number, components: number) {
  const accessor = gltf.accessors[id], view = gltf.bufferViews[accessor.bufferView];
  const width = [5126, 5125].includes(accessor.componentType) ? 4 : 2;
  const start = 28 + length + (view.byteOffset || 0) + (accessor.byteOffset || 0);
  return Array.from({ length: accessor.count * components }, (_, i) => {
    const offset = start + Math.floor(i / components) * (view.byteStride || width * components) + i % components * width;
    return accessor.componentType === 5126 ? bytes.readFloatLE(offset) : width === 4 ? bytes.readUInt32LE(offset) : bytes.readUInt16LE(offset);
  });
}

test('PC uses an open chassis and a single transparent glass pane', () => {
  const pane = part('PC single tempered side pane');
  expect(pane.position.count).toBe(4);
  expect(gltf.accessors[pane.primitive.indices].count).toBe(6);
  const material = gltf.materials[pane.primitive.material];
  expect(material.alphaMode).toBe('BLEND');
  expect(material.pbrMetallicRoughness.baseColorFactor[3]).toBeLessThan(.3);
  const solidBlocks = part('PCTowerRoot').node.children!.map(index => nodes[index]).filter(node => {
    if (node.mesh === undefined) return false;
    const primitive = gltf.meshes[node.mesh].primitives[0];
    const bounds = gltf.accessors[primitive.attributes.POSITION];
    const size = bounds.max.map((value: number, i: number) => value - bounds.min[i]);
    return size[0] > .40 && size[1] > .60 && size[2] > .60;
  });
  expect(solidBlocks).toHaveLength(0);
});

test('seven fans animate only their hubs and blades, leaving frames fixed', () => {
  const rotors = nodes.filter(node => node.name.startsWith('FanRoot_PC_'));
  expect(rotors).toHaveLength(7);
  for (const rotor of rotors) {
    const children = rotor.children!.map(index => nodes[index].name);
    expect(children).toHaveLength(2);
    expect(children.some(name => name.startsWith('PC swept fan blades'))).toBe(true);
    expect(children.some(name => name.startsWith('PC fan rotor hub'))).toBe(true);
    const parent = nodes.find(node => node.children?.includes(nodes.indexOf(rotor)))!;
    expect(parent.children!.some(index => nodes[index].name.startsWith('PC open fan frame'))).toBe(true);
  }
});

test('fan mounting frame has an actual opening instead of a plate over the blades', () => {
  const { primitive } = part('PC open fan frame intake_lower');
  const positions = values(primitive.attributes.POSITION, 3);
  const indices = values(primitive.indices, 1);
  let covered = false;
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = indices.slice(i, i + 3).map(index => [positions[index * 3], positions[index * 3 + 1]]);
    const [[ax, ay], [bx, by], [cx, cy]] = triangle;
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-9) continue;
    const edges = triangle.map(([x, y], j) => {
      const [nx, ny] = triangle[(j + 1) % 3];
      return (nx - x) * -y - (ny - y) * -x;
    });
    if (edges.every(value => value >= -1e-9) || edges.every(value => value <= 1e-9)) covered = true;
  }
  expect(covered).toBe(false);
});

test('intake lighting stays behind the wood slats with a physical air gap', () => {
  const fan = part('PC fan assembly intake_lower').node;
  const light = part('PC intake light diffuser intake_lower');
  const slat = part('PC wood intake slat');
  const frontOfLight = fan.translation![2] + light.node.translation![2] + light.position.max[2];
  const backOfSlat = slat.node.translation![2] + slat.position.min[2];
  expect(backOfSlat - frontOfLight).toBeGreaterThan(.02);
  for (const node of nodes.filter(node => node.name.startsWith('PC braided coolant hose'))) {
    const bounds = gltf.accessors[gltf.meshes[node.mesh!].primitives[0].attributes.POSITION];
    expect(bounds.min[0]).toBeGreaterThan(-.217);
  }
});
