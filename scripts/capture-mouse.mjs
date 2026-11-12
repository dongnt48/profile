import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';

const asset = process.argv[2] || '/models/room.glb';
if (!/^\/models\/[a-z0-9-]+\.glb$/i.test(asset)) throw new Error('Expected a local model URL');
const { outputFiles } = await build({
  stdin: {
    contents: `
      import * as THREE from 'three';
      import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
      import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
      window.inspectMouse = async asset => {
        const { scene: room } = await new GLTFLoader().loadAsync(asset);
        const mouse = room.getObjectByName('MouseRoot');
        if (!mouse) throw new Error('Missing MouseRoot');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#cbd2d9');
        const model = mouse.clone(true);
        model.position.set(0, 0, 0);
        model.quaternion.identity();
        model.traverse(object => {
          if (object.isMesh && object.material.name === 'Mouse body slate') {
            object.material = object.material.clone();
            object.material.color.setRGB(.075, .09, .12);
            object.material.roughness = .65;
            object.material.metalness = .02;
          }
        });
        scene.add(model);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(1200, 900);
        renderer.toneMapping = THREE.AgXToneMapping;
        document.body.replaceChildren(renderer.domElement);
        document.body.style.margin = '0';
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
        scene.add(new THREE.HemisphereLight(0xffffff, 0x708090, 1.2));
        const light = new THREE.DirectionalLight(0xffffff, 2);
        light.position.set(-2, 5, 4);
        scene.add(light);
        const camera = new THREE.PerspectiveCamera(35, 1200 / 900, .001, 10);
        const center = new THREE.Vector3(0, .02, 0);
        window.mouseView = (x, y, z) => {
          camera.position.copy(center).add(new THREE.Vector3(x, y, z));
          camera.lookAt(center);
          renderer.render(scene, camera);
        };
      };
    `,
    resolveDir: process.cwd(),
  }, bundle: true, write: false, format: 'iife',
});
fs.mkdirSync('docs/screenshots', { recursive: true });
const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', error => { throw error; });
  await page.goto('http://127.0.0.1:3000/textures/laptop-preview.png');
  await page.addScriptTag({ content: outputFiles[0].text });
  await page.evaluate(asset => window.inspectMouse(asset), asset);
  for (const [name, position] of [
    ['front', [-.16, .16, -.22]],
    ['palm', [-.16, .14, .22]],
    ['top', [0, .31, .001]],
  ]) {
    await page.evaluate(position => window.mouseView(...position), position);
    await page.screenshot({ path: 'docs/screenshots/mouse-' + name + '-after.png' });
  }
  if (asset === '/models/room.glb') {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('http://127.0.0.1:3000');
    await page.locator('.model-progress').waitFor({ state: 'hidden', timeout: 30000 });
    await page.getByRole('button', { name: 'Enter My Workspace', exact: true }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'docs/screenshots/mouse-room-after.png' });
    await page.getByRole('button', { name: 'Zoom to screen', exact: true }).click();
    await page.locator('.monitor-focused').waitFor();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/screenshots/mouse-monitor-after.png' });
  }
} finally {
  await browser.close();
}
