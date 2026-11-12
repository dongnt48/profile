import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';

const { outputFiles } = await build({
  stdin: {
    contents: `
      import * as THREE from 'three';
      import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
      import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
      window.inspectChair = async () => {
        const { scene: room } = await new GLTFLoader().loadAsync('/models/room.glb');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#c8d0d8');
        room.updateMatrixWorld(true);
        room.traverse(object => {
          if (!object.isMesh) return;
          const name = object.name + ' ' + object.material.name;
          const chairPart = /Chair|Headrest|Armrest|PostureFit|Seat_under|seat_mesh|back_mesh/.test(name);
          let clone;
          if (chairPart) {
            clone = object.clone();
            clone.applyMatrix4(object.parent.matrixWorld);
          } else {
            // The export batches the metal base and supports with other room
            // objects. Keep just their triangles inside the chair's bounds.
            if (!/Brushed aluminum|Graphite powder coat|Anodized slate/.test(name)) return;
            const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
            const positions = geometry.attributes.position;
            const indices = geometry.index;
            const kept = [];
            const inside = index => positions.getX(index) > -.52 && positions.getX(index) < .62
              && positions.getY(index) > .025 && positions.getY(index) < 1.85
              && positions.getZ(index) > -.12 && positions.getZ(index) < 1.02;
            for (let i = 0; i < (indices?.count || positions.count); i += 3) {
              const face = [0, 1, 2].map(offset => indices ? indices.getX(i + offset) : i + offset);
              if (face.every(inside)) kept.push(...face);
            }
            if (!kept.length) { geometry.dispose(); return; }
            geometry.setIndex(kept);
            clone = new THREE.Mesh(geometry, object.material);
          }
          if (/Pellicle/.test(name)) {
            clone.material = object.material.clone();
            clone.material.color.setRGB(1, 1, 1);
            clone.material.roughness = .88;
            clone.material.metalness = 0;
            clone.material.side = THREE.DoubleSide;
            clone.material.transparent = false;
            clone.material.alphaTest = .35;
            clone.material.alphaToCoverage = true;
            clone.material.depthWrite = true;
            clone.material.bumpMap = clone.material.map;
            clone.material.bumpScale = .00018;
          }
          scene.add(clone);
        });
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
        const center = new THREE.Vector3(.05, .98, .42);
        const camera = new THREE.PerspectiveCamera(35, 1200 / 900, .01, 20);
        window.chairView = (x, y, z) => {
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.on('pageerror', error => { throw error; });
  await page.goto('http://127.0.0.1:3000');
  await page.locator('.model-progress').waitFor({ state: 'hidden', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/screenshots/chair-monitor-after.png' });
  await page.getByRole('button', { name: 'Enter My Workspace', exact: true }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'docs/screenshots/chair-monitor-room-after.png' });
  await page.getByRole('button', { name: 'Zoom to screen', exact: true }).click();
  await page.locator('.monitor-focused').waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/screenshots/monitor-focus-after.png' });
  await page.goto('http://127.0.0.1:3000/textures/laptop-preview.png');
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.addScriptTag({ content: outputFiles[0].text });
  await page.evaluate(() => window.inspectChair());
  for (const [name, position] of [
    ['front', [-1.3, .65, -2.6]],
    ['back', [-1.3, .5, 2.6]],
  ]) {
    await page.evaluate(position => window.chairView(...position), position);
    await page.screenshot({ path: 'docs/screenshots/chair-' + name + '-after.png' });
  }
} finally {
  await browser.close();
}
