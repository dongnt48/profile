import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';

const label = process.argv[2] || 'after';
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error('Use an alphanumeric screenshot label');
// Inspect the exported asset at a useful scale without changing the app camera.
const { outputFiles } = await build({
  stdin: {
    contents: `
      import * as THREE from 'three';
      import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
      import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
      window.inspectLaptop = async () => {
        const { scene: room } = await new GLTFLoader().loadAsync('/models/room.glb');
        const laptop = room.getObjectByName('MacBookRoot');
        if (!laptop) throw new Error('Missing MacBookRoot');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#d7dce2');
        scene.add(laptop.clone(true));
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(1200, 900);
        renderer.setPixelRatio(1);
        renderer.toneMapping = THREE.AgXToneMapping;
        document.body.replaceChildren(renderer.domElement);
        document.body.style.margin = '0';
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
        scene.add(new THREE.HemisphereLight(0xffffff, 0x708090, 2));
        const key = new THREE.DirectionalLight(0xffffff, 3);
        key.position.set(-2, 5, 4);
        scene.add(key);
        const center = new THREE.Box3().setFromObject(laptop).getCenter(new THREE.Vector3());
        const camera = new THREE.PerspectiveCamera(35, 1200 / 900, .01, 10);
        window.laptopView = (x, y, z) => {
          camera.position.copy(center).add(new THREE.Vector3(x, y, z));
          camera.lookAt(center);
          renderer.render(scene, camera);
        };
        window.laptopView(-.75, .7, 1.1);
      };
    `,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: 'iife',
});
fs.mkdirSync('docs/screenshots', { recursive: true });
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', error => { throw error; });
  await page.goto('http://127.0.0.1:3000');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'docs/screenshots/laptop-room-' + label + '.png' });
  await page.goto('http://127.0.0.1:3000/textures/laptop-preview.png');
  await page.addScriptTag({ content: outputFiles[0].text });
  await page.evaluate(() => window.inspectLaptop());
  for (const [name, position] of [
    ['front', [0, .45, 1.3]],
    ['angle', [-.75, .7, 1.1]],
    ['side', [-1.2, .25, .3]],
  ]) {
    await page.evaluate(position => window.laptopView(...position), position);
    await page.screenshot({ path: 'docs/screenshots/laptop-' + name + '-' + label + '.png' });
  }
} finally {
  await browser.close();
}
