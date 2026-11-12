import { expect, test } from '@playwright/test';

test('direct desktop needs no model, windows restore and project filters work', async ({ page }) => {
  const modelRequests: string[] = []; page.on('request', r => { if (r.url().endsWith('.glb')) modelRequests.push(r.url()); });
  await page.goto('/os/');
  await expect(page.getByRole('main', { name: 'DongOS desktop' })).toBeVisible();
  await page.getByRole('button', { name: 'Open About me', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'About me', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Minimize About me' }).click();
  await expect(page.getByRole('dialog', { name: 'About me', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Open About me', exact: true }).click();
  await expect(page.locator('[data-window="about"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Close About me' }).click();
  await page.getByRole('button', { name: 'Open Projects', exact: true }).click();
  await page.getByRole('button', { name: 'Game', exact: true }).click();
  await expect(page.getByText('No projects here yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await page.getByRole('button', { name: /CURRENT PROJECT.*Personal Workspace/ }).click();
  await expect(page.getByRole('dialog', { name: 'Personal Workspace' })).toBeVisible();
  expect(modelRequests).toHaveLength(0);
});

test('terminal, settings and deep links survive direct navigation', async ({ page }) => {
  await page.goto('/os/?app=terminal');
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill('help'); await input.press('Enter');
  await expect(page.getByText('Available commands:', { exact: false })).toBeVisible();
  await input.fill('projects'); await input.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Projects', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open Settings', exact: true }).click();
  await page.getByRole('switch', { name: 'Reduce motion' }).click();
  await expect(page.getByRole('switch', { name: 'Reduce motion' })).toBeChecked();
  await page.reload();
  await page.getByRole('button', { name: 'Open Settings', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Reduce motion' })).toBeChecked();
});

test('zoom shortcut stays in the room and preserves opened apps', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter My Workspace' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.model-progress')).toHaveCount(0, { timeout: 30000 });
  await page.getByRole('button', { name: 'Zoom to screen', exact: true }).click();
  await expect(page.locator('#os-monitor-layer')).toBeVisible();
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
  await page.getByRole('button', { name: 'Open About me', exact: true }).click();
  await page.getByRole('button', { name: 'Back to room' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
  await page.getByRole('button', { name: 'Zoom to screen', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'About me', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to room' }).click();
  await expect(page.getByRole('button', { name: 'Zoom to screen', exact: true })).toBeVisible();
});

test('mobile windows fit screen and all apps are reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/os/');
  for (const title of ['About me', 'Projects', 'Experience', 'Tech stack', 'Gallery', 'Terminal', 'Contact', 'Settings']) {
    await page.getByRole('button', { name: `Open ${title}`, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: title, exact: true }); await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox(); expect(box!.x).toBe(0); expect(box!.width).toBeLessThanOrEqual(390);
    await page.getByRole('button', { name: `Close ${title}`, exact: true }).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('scroll zoom enables the monitor, keeps its lamp passive and app scrolling local', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.model-progress')).toHaveCount(0, { timeout: 30000 });
  await page.getByRole('button', { name: 'Enter My Workspace', exact: true }).click();
  const screen = page.locator('#os-monitor-layer');
  await expect(screen).toBeVisible();
  await expect(screen.locator('.desktop')).toHaveAttribute('inert', '');
  await expect(screen).toHaveCSS('transform', /matrix3d/);
  await page.mouse.move(1400, 850);
  await page.mouse.wheel(0, -1200);
  await expect(page.locator('.experience')).toHaveClass(/monitor-focused/);
  await expect(screen.locator('.desktop')).not.toHaveAttribute('inert', '');
  await expect(page.locator('.experience')).toHaveAttribute('data-monitor-light', 'passive');
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
  await page.getByRole('button', { name: 'Open About me', exact: true }).click();
  await page.getByRole('dialog', { name: 'About me', exact: true }).locator('.window-body').hover();
  await page.mouse.wheel(0, 450);
  await expect(screen).toBeVisible();
  await expect(page.locator('.experience')).toHaveAttribute('data-monitor-light', 'passive');
  await page.mouse.move(10, 850);
  await page.mouse.wheel(0, 1100);
  await expect(screen).toBeVisible();
  await expect(screen.locator('.desktop')).toHaveAttribute('inert', '');
  await expect(page.locator('.experience')).toHaveAttribute('data-monitor-light', 'passive');
});

test('focused monitor stays still with reduced motion and pointer movement', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dongos-settings', JSON.stringify({ reducedMotion: true })));
  await page.goto('/');
  await expect(page.locator('.model-progress')).toHaveCount(0, { timeout: 30000 });
  await page.getByRole('button', { name: 'Open profile', exact: true }).click();
  const screen = page.locator('#os-monitor-layer');
  await expect(screen).toBeVisible();
  await page.waitForTimeout(300);
  const before = await screen.boundingBox();
  await page.mouse.move(30, 900);
  await page.waitForTimeout(300);
  const after = await screen.boundingBox();
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(.05);
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(.05);
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
  await page.getByRole('button', { name: 'Back to room' }).click();
  await expect(screen).toBeVisible();
  await expect(screen.locator('.desktop')).toHaveAttribute('inert', '');
});

test('two-finger zoom reaches the monitor on phones without browser zoom', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.model-progress')).toHaveCount(0, { timeout: 30000 });
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 140, y: 400 }, { x: 240, y: 400 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 20, y: 400 }, { x: 370, y: 400 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const screen = page.locator('#os-monitor-layer');
  await expect(page.locator('.experience')).toHaveClass(/monitor-focused/, { timeout: 15000 });
  const box = await screen.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(391);
  expect(await page.evaluate(() => window.visualViewport?.scale)).toBe(1);
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
});

test('the same live screen and terminal output remain visible through zoom out and in', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.model-progress')).toHaveCount(0, { timeout: 30000 });
  const screen = page.locator('#os-monitor-layer');
  await expect(screen).toBeVisible();
  await expect(screen.locator('.desktop')).toHaveAttribute('inert', '');
  await page.getByRole('button', { name: 'Open profile', exact: true }).click();
  await page.getByRole('button', { name: 'Open Terminal', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Terminal command' });
  await input.fill('help');
  await input.press('Enter');
  const terminal = screen.locator('[data-window="terminal"]');
  const instance = await terminal.elementHandle();
  await expect(terminal).toContainText('Available commands:');
  await page.getByRole('button', { name: 'Back to room' }).click();
  await expect(screen.locator('.desktop')).toHaveAttribute('inert', '');
  await expect(screen).toBeVisible();
  await expect(terminal).toBeVisible();
  await expect(terminal).toContainText('Available commands:');
  await expect(page.getByRole('button', { name: 'Zoom to screen', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Zoom to screen', exact: true }).click();
  await expect(screen.locator('.desktop')).not.toHaveAttribute('inert', '');
  expect(await instance!.evaluate(element => element.isConnected)).toBe(true);
  await expect(terminal).toContainText('Available commands:');
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
});

test('WebGL and model failure have direct profile fallback', async ({ page }) => {
  await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: string, ...args: unknown[]) { if (type === 'webgl2') return null; return original.apply(this, [type, ...args] as Parameters<typeof original>); } as typeof original; });
  await page.goto('/');
  await expect(page.getByText('3D isn’t available here.')).toBeVisible();
  await page.getByRole('link', { name: 'Open Profile →' }).click();
  await expect(page.getByRole('main', { name: 'DongOS desktop' })).toBeVisible();
});
