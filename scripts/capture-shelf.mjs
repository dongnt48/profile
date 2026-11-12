import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();
  console.log('Navigating to http://127.0.0.1:3000...');
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);

  await page.screenshot({ path: 'docs/screenshots/room-final.png' });
  await page.screenshot({
    path: 'docs/screenshots/shelf-lamp-webgl.png',
    clip: { x: 450, y: 80, width: 500, height: 350 },
  });
  await page.screenshot({
    path: 'docs/screenshots/camera-books-webgl.png',
    clip: { x: 380, y: 100, width: 450, height: 320 },
  });
  await page.screenshot({
    path: 'docs/screenshots/aquarium-close.png',
    clip: { x: 440, y: 220, width: 300, height: 220 },
  });
  console.log('Screenshots saved!');
  await browser.close();
})();

