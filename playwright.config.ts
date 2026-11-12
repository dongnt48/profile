import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 45000, fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:3000', browserName: 'chromium', channel: 'chrome', headless: true, viewport: { width: 1440, height: 960 }, screenshot: 'only-on-failure', launchOptions: { args: ['--enable-webgl', '--ignore-gpu-blocklist'] } },
  reporter: 'list',
});
