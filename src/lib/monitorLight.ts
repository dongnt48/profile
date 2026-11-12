import { Mesh, MeshStandardMaterial, Vector3 } from 'three';

export function makeMonitorLightPassive(material: MeshStandardMaterial) {
  material.color.setRGB(.9, .98, 1);
  material.emissive.setRGB(0, 0, 0);
  material.emissiveIntensity = 0;
  material.emissiveMap = null;
  material.roughness = .65;
  material.metalness = 0;
  return material;
}

// Older room exports batch the task light and aquarium LED together. Give
// only the task-light triangles their own material; leave the aquarium lit.
export function separateMonitorLight(mesh: Mesh, material: MeshStandardMaterial) {
  const position = mesh.geometry.attributes.position;
  const index = mesh.geometry.index;
  const other: number[] = [], bar: number[] = [];
  const point = new Vector3();
  const inBar = (vertex: number) => {
    point.fromBufferAttribute(position, vertex).applyMatrix4(mesh.matrixWorld);
    return point.x > -.295 && point.x < .495 && point.y > 2.006 && point.y < 2.016
      && point.z > -.952 && point.z < -.932;
  };
  for (let i = 0; i < (index?.count ?? position.count); i += 3) {
    const triangle = [0, 1, 2].map(offset => index ? index.getX(i + offset) : i + offset);
    (triangle.every(inBar) ? bar : other).push(...triangle);
  }
  if (!bar.length) return null;
  const geometry = mesh.geometry.clone();
  geometry.setIndex([...other, ...bar]);
  geometry.clearGroups();
  geometry.addGroup(0, other.length, 0);
  geometry.addGroup(other.length, bar.length, 1);
  const taskLight = makeMonitorLightPassive(material.clone());
  taskLight.name = 'Monitor task light';
  mesh.geometry = geometry;
  mesh.material = [material, taskLight];
  return taskLight;
}
