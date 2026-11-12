import { DoubleSide, type MeshStandardMaterial } from 'three';

// Keep the room and close-up inspector on the same PC material calibration.
export function configurePCMaterial(mat: MeshStandardMaterial) {
  const name = mat.name.replaceAll('_', ' ');
  if (!name.startsWith('PC ')) return;
  mat.envMapIntensity = .35;
  if (name === 'PC tempered glass') {
    mat.color.setRGB(.25, .31, .38);
    mat.roughness = .085;
    mat.metalness = 0;
    mat.envMapIntensity = .95;
    mat.transparent = true;
    mat.opacity = .26;
    mat.depthWrite = false;
    mat.side = DoubleSide;
  } else if (name === 'PC case white') {
    mat.color.setRGB(.78, .80, .82);
    mat.roughness = .42;
    mat.metalness = .12;
    mat.envMapIntensity = .65;
  } else if (name === 'PC natural oak') {
    mat.color.setRGB(1, 1, 1);
    mat.roughness = .52;
    mat.metalness = 0;
    mat.bumpMap = mat.map;
    mat.bumpScale = .00035;
  } else if (name === 'PC dark steel chassis') {
    mat.color.setRGB(.008, .012, .018);
    mat.roughness = .52;
    mat.metalness = .18;
  } else if (name === 'PC graphite fan rotor') {
    mat.color.setRGB(.012, .017, .025);
    mat.roughness = .60;
    mat.metalness = .02;
    mat.envMapIntensity = .25;
  } else if (name === 'PC heatsink aluminum') {
    mat.color.setRGB(.28, .31, .35);
    mat.roughness = .35;
    mat.metalness = .85;
    mat.envMapIntensity = .75;
  } else if (name === 'PC GPU anodized metal') {
    mat.roughness = .34;
    mat.metalness = .7;
    mat.envMapIntensity = .7;
  } else if (name === 'PC rubber and cable sleeves') {
    mat.roughness = .85;
    mat.envMapIntensity = .08;
  }
}
