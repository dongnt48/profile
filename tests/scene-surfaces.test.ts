import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const bytes = readFileSync(new URL('../public/models/room.glb', import.meta.url));
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const binaryStart = 28 + bytes.readUInt32LE(12);

function surface(name: string) {
  const node = gltf.nodes.find((node: { name: string }) => node.name === name);
  if (!node) throw new Error(`Missing exported surface: ${name}`);
  const primitive = gltf.meshes[node.mesh].primitives[0];
  return { node, primitive, position: gltf.accessors[primitive.attributes.POSITION] };
}

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
