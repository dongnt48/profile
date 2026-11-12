import { readFileSync } from 'node:fs';
import { BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial } from 'three';
import { expect, test } from 'vitest';
import { makeMonitorLightPassive, separateMonitorLight } from '../src/lib/monitorLight';

test('the task light stays passive independently of the aquarium LED', () => {
  const bytes = readFileSync(new URL('../public/models/room.glb', import.meta.url));
  const size = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + size).toString());
  const node = gltf.nodes.find((node: { name: string }) => node.name === 'Room_Aquarium_WRGB');
  const dedicated = gltf.nodes.find((node: { mesh?: number }) => node.mesh !== undefined
    && gltf.meshes[node.mesh].primitives.some((primitive: { material: number }) => gltf.materials[primitive.material].name === 'Monitor task light'));
  if (dedicated) {
    // Newly authored rooms already export the two lights separately.
    const task = gltf.meshes[dedicated.mesh].primitives[0].material;
    const aquarium = gltf.meshes[node.mesh].primitives[0].material;
    expect(task).not.toBe(aquarium);
    const passive = makeMonitorLightPassive(new MeshStandardMaterial({ emissiveIntensity: 3.4 }));
    expect(passive.emissiveIntensity).toBe(0);
    return;
  }
  const primitive = gltf.meshes[node.mesh].primitives[0];
  const values = (id: number, components: number) => {
    const accessor = gltf.accessors[id], view = gltf.bufferViews[accessor.bufferView];
    const start = 28 + size + (view.byteOffset || 0) + (accessor.byteOffset || 0);
    const width = accessor.componentType === 5126 || accessor.componentType === 5125 ? 4 : 2;
    return Array.from({ length: accessor.count * components }, (_, i) => {
      const offset = start + Math.floor(i / components) * (view.byteStride || components * width) + i % components * width;
      return accessor.componentType === 5126 ? bytes.readFloatLE(offset) : width === 4 ? bytes.readUInt32LE(offset) : bytes.readUInt16LE(offset);
    });
  };
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(values(primitive.attributes.POSITION, 3), 3));
  geometry.setIndex(values(primitive.indices, 1));
  const material = new MeshStandardMaterial({ emissiveIntensity: 3.4 });
  const mesh = new Mesh(geometry, material);
  if (node.translation) mesh.position.fromArray(node.translation);
  if (node.rotation) mesh.quaternion.fromArray(node.rotation);
  if (node.scale) mesh.scale.fromArray(node.scale);
  mesh.updateMatrixWorld(true);
  const taskLight = separateMonitorLight(mesh, material);
  expect(taskLight).not.toBeNull();
  expect(mesh.geometry.groups).toHaveLength(2);
  expect(mesh.geometry.groups.every(group => group.count > 0)).toBe(true);
  expect(taskLight!.emissiveIntensity).toBe(0);
  expect(taskLight!.emissive.getHex()).toBe(0);
  expect(taskLight!.color.r).toBeCloseTo(.9);
  expect(material.emissiveIntensity).toBe(3.4);
});
