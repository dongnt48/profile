import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const bytes = readFileSync(new URL('../public/models/room.glb', import.meta.url));
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
type Node = { name: string; children?: number[]; mesh?: number; translation?: number[] };
const nodes: Node[] = gltf.nodes;
const named = (name: string) => {
  const node = nodes.find(node => node.name === name);
  if (!node) throw new Error(`Missing accessory: ${name}`);
  return node;
};
function vertices(node: Node) {
  const primitive = gltf.meshes[node.mesh!].primitives[0];
  const position = gltf.accessors[primitive.attributes.POSITION];
  const view = gltf.bufferViews[position.bufferView];
  const start = 28 + jsonLength + (view.byteOffset || 0) + (position.byteOffset || 0);
  return Array.from({ length: position.count }, (_, i) => {
    const offset = start + i * (view.byteStride || 12);
    return [bytes.readFloatLE(offset), bytes.readFloatLE(offset + 4), bytes.readFloatLE(offset + 8)];
  });
}

test('both speaker drivers stay aligned with their angled front baffle', () => {
  for (const name of ['SpeakerRoot_L', 'SpeakerRoot_R']) {
    const children = named(name).children!.map(index => nodes[index]);
    const get = (prefix: string) => children.find(node => node.name.startsWith(prefix))!;
    const baffle = get('Speaker front baffle');
    const woofer = get('Speaker recessed woofer cone');
    const tweeter = get('Speaker tweeter waveguide');
    expect(woofer).toBeDefined();
    expect(tweeter).toBeDefined();
    expect(woofer.translation![0]).toBeCloseTo(baffle.translation![0], 5);
    expect(tweeter.translation![0]).toBeCloseTo(baffle.translation![0], 5);
    expect(woofer.translation![2]).toBeGreaterThan(baffle.translation![2]);
    expect(tweeter.translation![2]).toBeGreaterThan(baffle.translation![2]);
  }
});

test('ear cushions have an open center instead of a solid ellipsoid', () => {
  for (const name of ['Headphone open ear cushion L', 'Headphone open ear cushion R']) {
    const points = vertices(named(name));
    const innerRadius = Math.min(...points.map(([, y, z]) => Math.hypot(y / .048, z / .035)));
    expect(innerRadius).toBeGreaterThan(.65);
    expect(innerRadius).toBeLessThan(.9);
  }
});

test('desk shade has a hollow opening with a recessed opal bulb and socket', () => {
  const shadeRoot = named('DeskLampShadeRoot');
  expect(named('DeskLampRoot').children).toContain(nodes.indexOf(shadeRoot));
  const shade = named('Desk lamp hollow metal shade');
  const opening = vertices(shade).filter(([, y]) => y < -.128);
  expect(opening.length).toBeGreaterThan(60);
  expect(opening.every(([x, , z]) => Math.hypot(x, z) > .11)).toBe(true);
  const bulb = named('Desk lamp opal bulb');
  expect(shadeRoot.children).toContain(nodes.indexOf(bulb));
  expect(shadeRoot.children).toContain(nodes.indexOf(named('Desk lamp bulb socket')));
  const primitive = gltf.meshes[bulb.mesh!].primitives[0];
  expect(gltf.materials[primitive.material].emissiveFactor || [0, 0, 0]).toEqual([0, 0, 0]);
});
