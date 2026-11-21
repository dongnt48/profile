import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 844, height: 390 }]) {
  test(`readable profile and app navigation at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    const sceneRequests: string[] = [];
    // Next may register a tiny async-loader stub; the scene runtime and assets must stay unloaded.
    page.on('request', request => { if (/\.(glb|gltf|hdr|exr)(\?|$)|three_build|react-three|\/models\//i.test(request.url())) sceneRequests.push(request.url()); });
    await page.addInitScript(() => {
      const metrics = window as typeof window & { webglProbes: number };
      metrics.webglProbes = 0;
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        if (type.startsWith('webgl')) metrics.webglProbes++;
        return original.apply(this, [type, ...args] as Parameters<typeof original>);
      } as typeof original;
    });
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.experience')).toHaveClass(/reading-mode/);
    await expect(page.getByRole('dialog', { name: 'About me', exact: true })).toBeVisible();
    await expect(page.locator('canvas, .room-layer, .scene-fallback, .model-progress')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Back to room|Open profile/ })).toHaveCount(0);
    await expect(page.locator('#os-monitor-layer')).not.toHaveClass(/in-monitor/);
    await expect(page.locator('[data-window="about"] .body-copy').first()).toHaveCSS('font-size', '16px');
    for (const app of ['Projects', 'Experience', 'Tech stack', 'Contact', 'About me']) {
      await page.getByRole('button', { name: `Open ${app}`, exact: true }).click();
      const dialog = page.getByRole('dialog', { name: app, exact: true });
      await expect(dialog).toBeVisible();
      const box = (await dialog.boundingBox())!;
      const rail = viewport.width >= 1000 ? 104 : viewport.width >= 700 ? 88 : 0;
      expect(box.x).toBe(rail); expect(box.width).toBe(viewport.width - rail);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - (rail ? 0 : 70));
      expect(await dialog.locator('.window-body').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    const nav = page.locator('.desktop-icons');
    expect(await nav.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    for (const button of await nav.getByRole('button').all()) {
      const box = (await button.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    await page.getByRole('button', { name: 'Tiếng Việt', exact: true }).click();
    await expect(page.locator('[data-window="about"]')).toContainText('Nguyễn Thành Đông');
    for (const app of ['about', 'projects', 'experience', 'skills', 'contact']) {
      await page.locator(`[data-app="${app}"]`).click();
      expect(await page.locator(`[data-window="${app}"] .window-body`).evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    await page.locator('[data-app="about"]').click();
    await page.screenshot({ path: `docs/screenshots/reading-${viewport.width}.png` });
    expect(sceneRequests).toEqual([]);
    expect(await page.evaluate(() => (window as typeof window & { webglProbes: number }).webglProbes)).toBe(0);
    await expect(page).toHaveURL('http://127.0.0.1:3000/');
  });
}

test('phone opens directly and preserves search when switching sections', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.experience')).toHaveClass(/page-ready/, { timeout: 30000 });
  await expect(page.locator('.experience')).toHaveClass(/reading-mode/);
  await page.getByRole('button', { name: 'Open Projects', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search projects' }).fill('DonBotify');
  await page.getByRole('textbox', { name: 'Search projects' }).press('Escape');
  await expect(page.getByRole('dialog', { name: 'Projects', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open Contact', exact: true }).click();
  await page.getByRole('button', { name: 'Open Projects', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search projects' })).toHaveValue('DonBotify');
});

test('app state and copy actions survive phone and tablet rotation', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Projects', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search projects' }).fill('DonBotify');
  for (const viewport of [{ width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 390, height: 440 }]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('dialog', { name: 'Projects', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Search projects' })).toHaveValue('DonBotify');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
  }
  await page.getByRole('button', { name: 'Open Contact', exact: true }).click();
  await page.getByRole('button', { name: 'Copy phone number', exact: true }).click();
  await expect(page.locator('[data-window="contact"] [role="status"]')).toHaveText('Phone number copied.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('0847793939');
});

test.describe('large touch tablet', () => {
  test.use({ hasTouch: true, viewport: { width: 1376, height: 1024 } });
  test('uses the tablet layout with three skill columns', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.experience')).toHaveClass(/reading-mode/);
    await page.getByRole('button', { name: 'Open Tech stack', exact: true }).click();
    const box = (await page.getByRole('dialog', { name: 'Tech stack', exact: true }).boundingBox())!;
    expect(box.x).toBe(104); expect(box.width).toBe(1272);
    expect(await page.locator('.skills-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(3);
  });
});

test('desktop profile stays inside the monitor without a separate fullscreen action', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.locator('.experience')).toHaveClass(/page-ready/, { timeout: 30000 });
  await page.mouse.move(10, 700); await page.mouse.wheel(0, -1800);
  await expect(page.locator('.experience')).toHaveClass(/monitor-focused/);
  await expect(page.locator('.expand-profile')).toHaveCount(0);
  await expect(page.locator('.reading-toolbar')).toHaveCount(0);
  await expect(page.locator('#os-monitor-layer')).toHaveClass(/in-monitor/);
  await page.getByRole('button', { name: 'Open About me', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'About me', exact: true })).toBeVisible();
  await expect(page.locator('.experience')).not.toHaveClass(/reading-mode/);
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
});

test('landscape phone opens directly even if WebGL is unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      return type === 'webgl2' ? null : original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.locator('.experience')).toHaveClass(/reading-mode/);
  await expect(page.getByRole('dialog', { name: 'About me', exact: true })).toBeVisible();
  await expect(page.locator('canvas, .scene-fallback, .room-footer')).toHaveCount(0);
});
