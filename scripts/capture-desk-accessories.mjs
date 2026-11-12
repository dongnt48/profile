import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';

const asset = process.argv[2] || '/models/room.glb';
const monitorOnly = process.argv[3] === 'monitor';
const pcOnly = process.argv[3] === 'pc';
if (!/^\/models\/[a-z0-9-]+\.glb$/i.test(asset)) throw new Error('Expected a local model URL');
const { outputFiles } = await build({
  stdin: {
    contents: `
      import * as THREE from 'three';
      import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
      import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
      import { configurePCMaterial } from './src/lib/pcMaterials.ts';
      window.inspectAccessories = async asset => {
        const { scene: room } = await new GLTFLoader().loadAsync(asset);
        const preview = await new THREE.TextureLoader().loadAsync('/textures/monitor-preview.png');
        preview.colorSpace = THREE.SRGBColorSpace;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#cbd2d9');
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(1200, 900);
        renderer.toneMapping = THREE.AgXToneMapping;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.replaceChildren(renderer.domElement);
        document.body.style.margin = '0';
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
        scene.add(new THREE.HemisphereLight(0xffffff, 0x708090, 1));
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(-2, 5, 4);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.left = key.shadow.camera.bottom = -1.4;
        key.shadow.camera.right = key.shadow.camera.top = 1.4;
        key.shadow.normalBias = .001;
        scene.add(key);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#bdc3c8', roughness: .9 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -.001;
        floor.receiveShadow = true;
        floor.visible = false;
        scene.add(floor);
        const camera = new THREE.PerspectiveCamera(35, 1200 / 900, .001, 20);
        let current;
        window.accessoryView = (name, direction) => {
          if (current) scene.remove(current);
          const original = room.getObjectByName(name);
          if (!original) throw new Error('Missing assembly: ' + name);
          current = original.clone(true);
          current.position.set(0, 0, 0);
          current.quaternion.identity();
          current.traverse(object => {
            if (object.isMesh && name === 'PCTowerRoot') {
              object.material = object.material.clone();
              configurePCMaterial(object.material);
              object.castShadow = !object.material.transparent;
              object.receiveShadow = !object.material.transparent;
            }
          });
          if (name === 'MonitorHardwareRoot') {
            current.add(new THREE.Mesh(new THREE.PlaneGeometry(1.49, .66), new THREE.MeshBasicMaterial({ map: preview })));
          }
          scene.add(current);
          floor.visible = name === 'PCTowerRoot';
          const bounds = new THREE.Box3().setFromObject(current);
          const center = bounds.getCenter(new THREE.Vector3());
          const size = bounds.getSize(new THREE.Vector3());
          const distance = Math.max(size.x, size.y, size.z) * (name === 'MonitorHardwareRoot' ? 1.8 : name === 'ScreenBarRoot' ? 1.9 : name === 'PCTowerRoot' ? 2.1 : 2.4);
          camera.position.copy(center).add(new THREE.Vector3(...direction).normalize().multiplyScalar(distance));
          camera.lookAt(center);
          renderer.render(scene, camera);
        };
      };
    `,
    resolveDir: process.cwd(),
  }, bundle: true, write: false, format: 'iife',
});
fs.mkdirSync('docs/screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', error => { throw error; });
  await page.goto('http://127.0.0.1:3000/textures/laptop-preview.png');
  await page.addScriptTag({ content: outputFiles[0].text });
  await page.evaluate(asset => window.inspectAccessories(asset), asset);
  const views = pcOnly ? [
    ['pc-front', 'PCTowerRoot', [-1, .30, 1.3]],
    ['pc-glass-side', 'PCTowerRoot', [-1.5, .20, -.1]],
    ['pc-rear', 'PCTowerRoot', [1, .35, -1.3]],
  ] : monitorOnly ? [
    ['monitor-front', 'MonitorHardwareRoot', [-.7, .3, 1.5]],
    ['monitor-rear', 'MonitorHardwareRoot', [.7, .25, -1.5]],
    ['screenbar-front', 'ScreenBarRoot', [-.7, .3, 1.5]],
    ['screenbar-rear', 'ScreenBarRoot', [.7, .25, -1.5]],
  ] : [
    ['speaker', 'SpeakerRoot_L', [-.9, .5, 1.5]],
    ['headphones', 'HeadphonesRoot', [-1, .3, 1]],
    ['desk-lamp', 'DeskLampRoot', [-1, .4, 1.5]],
    ['lamp-shade', 'DeskLampShadeRoot', [-.5, -.8, 1]],
  ];
  for (const [label, name, direction] of views) {
    await page.evaluate(({ name, direction }) => window.accessoryView(name, direction), { name, direction });
    await page.screenshot({ path: 'docs/screenshots/' + label + '-realistic.png' });
  }
  if (asset === '/models/room.glb') {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('http://127.0.0.1:3000');
    await page.locator('.model-progress').waitFor({ state: 'hidden', timeout: 30000 });
    await page.getByRole('button', { name: 'Enter My Workspace', exact: true }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'docs/screenshots/audio-lamp-room.png' });
  }
} finally { await browser.close(); }
