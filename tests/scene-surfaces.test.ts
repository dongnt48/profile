import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { Matrix4, Quaternion, Vector3 } from 'three';

const bytes = readFileSync(new URL('../public/models/room.glb', import.meta.url));
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const binaryStart = 28 + bytes.readUInt32LE(12);

function surface(name: string) {
  const node = gltf.nodes.find((node: { name: string }) => node.name === name);
  if (!node) throw new Error(`Missing exported surface: ${name}`);
  const primitive = gltf.meshes[node.mesh].primitives[0];
  return { node, primitive, position: gltf.accessors[primitive.attributes.POSITION] };
}

test('curtains are continuous cloth, supported by rings and clear of floor, wall and plant', () => {
  const panels = ['Curtain panel front', 'Curtain panel back'].map(surface);
  expect(gltf.nodes.filter((node: { name: string }) => node.name.startsWith('Curtain ring '))).toHaveLength(14);
  for (const { primitive, position } of panels) {
    expect(position.count).toBeGreaterThan(3000);
    expect(gltf.accessors[primitive.attributes.TEXCOORD_0].count).toBe(position.count);
    expect(position.min[1]).toBeGreaterThan(.07);
    expect(position.min[1]).toBeLessThan(.09);
    expect(position.max[1]).toBeCloseTo(2.863, 3);
    expect(position.max[0]).toBeLessThan(2.675); // Interior face of the window wall.
  }
  const clothMinX = Math.min(...panels.map(panel => panel.position.min[0]));
  // glTF Z is Blender -Y: neither panel can pass through the deep sill.
  expect(panels[0].position.min[2]).toBeGreaterThan(1.23);
  expect(panels[1].position.max[2]).toBeLessThan(-1.72);
  let plantMaxX = -Infinity;
  for (const node of gltf.nodes.filter((node: { name: string }) => node.name.startsWith('Room_Leaf_'))) {
    const { position } = surface(node.name);
    const view = gltf.bufferViews[position.bufferView];
    const start = binaryStart + (view.byteOffset || 0) + (position.byteOffset || 0);
    const matrix = new Matrix4().compose(new Vector3().fromArray(node.translation ?? [0, 0, 0]), new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]), new Vector3().fromArray(node.scale ?? [1, 1, 1]));
    for (let i = 0; i < position.count; i++) {
      const offset = start + i * (view.byteStride || 12);
      const point = new Vector3(bytes.readFloatLE(offset), bytes.readFloatLE(offset + 4), bytes.readFloatLE(offset + 8)).applyMatrix4(matrix);
      if (point.x > .8 && point.y > .1 && point.y < 1.5 && point.z > .3) plantMaxX = Math.max(plantMaxX, point.x);
    }
  }
  expect(plantMaxX).toBeGreaterThan(2);
  expect(clothMinX - plantMaxX).toBeGreaterThan(.04);
});

test('book ribbons stay with shelf books and the desk journal, away from the rug', () => {
  for (const name of ['Room_Book_ribbon_gold', 'Room_Book_ribbon_burgundy']) {
    const { node, position } = surface(name);
    const baseY = node.translation?.[1] ?? 0;
    // Gold includes the journal at desk height; both contain a shelf bookmark.
    expect(position.min[1] + baseY).toBeGreaterThan(name.endsWith('gold') ? 1.2 : 2.4);
    expect(position.max[1] + baseY).toBeGreaterThan(2.6);
  }
});

test('chair membranes are curved UV-mapped surfaces with an alpha weave', () => {
  for (const name of ['Chair seat mesh membrane', 'Chair back mesh membrane', 'Headrest mesh membrane']) {
    const { primitive, position } = surface(name);
    // A sampled tensioned surface replaces the old closed eight-corner box.
    expect(position.count).toBeGreaterThan(200);
    const uv = gltf.accessors[primitive.attributes.TEXCOORD_0];
    expect(uv.count).toBe(position.count);
    const view = gltf.bufferViews[uv.bufferView];
    const start = binaryStart + (view.byteOffset || 0) + (uv.byteOffset || 0);
    expect(uv.componentType).toBe(5126); // glTF FLOAT
    for (let i = 0; i < uv.count; i++) {
      for (let component = 0; component < 2; component++) {
        const value = bytes.readFloatLE(start + i * (view.byteStride || 8) + component * 4);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
    const material = gltf.materials[primitive.material];
    expect(material.doubleSided).toBe(true);
    expect(['MASK', 'BLEND']).toContain(material.alphaMode);
    expect(material.pbrMetallicRoughness.baseColorTexture).toBeDefined();
  }
});

test('monitor is a single quad matching the projected desktop bounds', () => {
  const { node, primitive, position } = surface('Room_Monitor_glass');
  expect(position.count).toBe(4);
  expect(gltf.accessors[primitive.indices].count).toBe(6);
  // Blender's -Y is +Z in glTF; the panel faces the camera at z = -0.979.
  for (const [axis, expected] of [[0, .1], [1, 1.66], [2, -.979]]) {
    expect(node.translation[axis]).toBeCloseTo(expected, 5);
  }
  expect(position.max[0] - position.min[0]).toBeCloseTo(1.49, 5);
  expect(position.max[1] - position.min[1]).toBeCloseTo(.66, 5);
  expect(position.max[2] - position.min[2]).toBeLessThan(.00001);
  const material = gltf.materials[primitive.material];
  const texture = gltf.textures[material.pbrMetallicRoughness.baseColorTexture.index];
  const image = gltf.images[texture.source];
  expect(image.mimeType).toBe('image/png');
  const view = gltf.bufferViews[image.bufferView];
  const png = bytes.subarray(binaryStart + (view.byteOffset || 0));
  expect(png.readUInt32BE(16) / png.readUInt32BE(20)).toBeCloseTo(1.49 / .66, 2);
});
