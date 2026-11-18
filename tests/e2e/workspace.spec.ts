import { expect, test } from '@playwright/test';

test('removed desktop route returns 404 without mounting the workspace', async ({ page }) => {
  const response = await page.goto('/os/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('.experience')).toHaveCount(0);
});
async function zoomToMonitor(page: import('@playwright/test').Page) {
  await page.mouse.move(10, 850);
  await page.mouse.wheel(0, -1800);
  await expect(page.locator('.experience')).toHaveClass(/monitor-focused/);
}
async function openFallback(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl2') return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^Open profile/ }).click();
}


test('fallback stays on root, windows restore and project filters work', async ({ page }) => {
  const modelRequests: string[] = []; page.on('request', r => { if (r.url().endsWith('.glb')) modelRequests.push(r.url()); });
  await openFallback(page);
  await expect(page.getByRole('main', { name: 'DongOS desktop' })).toBeVisible();
  await page.getByRole('button', { name: 'Open About me', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'About me', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Minimize About me' }).click();
  await expect(page.getByRole('dialog', { name: 'About me', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Open About me', exact: true }).click();
  await expect(page.locator('[data-window="about"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Close About me' }).click();
  await page.getByRole('button', { name: 'Open Projects', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search projects' }).fill('no-such-project');
  await expect(page.getByText('No matching projects.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await page.getByRole('button', { name: /AI Chatbot SaaS.*DonBotify/ }).click();
  await expect(page.getByRole('dialog', { name: /DonBotify/ })).toBeVisible();
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
});

test('settings persist after reload', async ({ page }) => {
  await openFallback(page);
  await page.getByRole('button', { name: 'Open Settings', exact: true }).click();
  await page.getByRole('switch', { name: 'Reduce motion' }).click();
  await expect(page.getByRole('switch', { name: 'Reduce motion' })).toBeChecked();
  await page.reload();
  await page.getByRole('button', { name: /^Open profile/ }).click();
  await page.getByRole('button', { name: 'Open Settings', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Reduce motion' })).toBeChecked();
});

test('scroll zoom stays in the room and preserves opened apps', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.model-progress')).toHaveCount(0, { timeout: 30000 });
  await zoomToMonitor(page);
  await expect(page.locator('#os-monitor-layer')).toBeVisible();
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
  await page.getByRole('button', { name: 'Open About me', exact: true }).click();
  await page.mouse.move(10, 850);
  await page.mouse.wheel(0, 700);
  await expect(page.locator('#os-monitor-layer .desktop')).toHaveAttribute('inert', '');
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
  await zoomToMonitor(page);
  await expect(page.getByRole('dialog', { name: 'About me', exact: true })).toBeVisible();
  await page.mouse.move(10, 850);
  await page.mouse.wheel(0, 700);
  await expect(page.locator('#os-monitor-layer .desktop')).toHaveAttribute('inert', '');
  await expect(page.locator('#os-monitor-layer .desktop')).toHaveAttribute('inert', '');
});

test('mobile windows fit screen and all apps are reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFallback(page);
  for (const title of ['About me', 'Projects', 'Experience', 'Tech stack', 'Gallery', 'Contact', 'Settings']) {
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

test('foreground scene paints above the live desktop while zooming', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.model-progress')).toHaveCount(0, { timeout: 30000 });
  const foregroundFirst = await page.evaluate(() => {
    const screen = document.getElementById('os-monitor-layer')!;
    const canvas = document.querySelector('canvas')!;
    const rect = screen.getBoundingClientRect();
    // Include the inert desktop in hit testing just to inspect browser paint order.
    const desktop = screen.querySelector('.desktop')!;
    desktop.removeAttribute('inert');
    screen.style.pointerEvents = 'auto';
    const layers = document.elementsFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    const canvasIndex = layers.indexOf(canvas);
    const desktopIndex = layers.findIndex(element => screen.contains(element));
    screen.style.removeProperty('pointer-events');
    desktop.setAttribute('inert', '');
    return canvasIndex >= 0 && desktopIndex >= 0 && canvasIndex < desktopIndex;
  });
  expect(foregroundFirst).toBe(true);
  await zoomToMonitor(page);
  await page.getByRole('button', { name: 'Open Settings', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
});

test('room overlays stay hidden while the monitor becomes interactive', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.model-progress')).toHaveCount(0, { timeout: 30000 });
  await page.evaluate(() => {
    const shell = document.querySelector('.experience')!;
    const glitches: string[] = [];
    const observer = new MutationObserver(() => {
      if (!shell.classList.contains('monitor-focused')) return;
      if (shell.getAttribute('data-room-closeup') !== 'true') glitches.push('closeup lost');
      for (const selector of ['.room-header', '.room-footer']) {
        const element = shell.querySelector(selector)!;
        if (getComputedStyle(element).opacity !== '0') glitches.push(selector);
      }
    });
    observer.observe(shell, { attributes: true });
    Object.assign(window, { zoomOverlayGlitches: glitches, zoomOverlayObserver: observer });
  });
  await zoomToMonitor(page);
  await expect(page.locator('.experience')).toHaveAttribute('data-room-closeup', 'true');
  const glitches = await page.evaluate(() => {
    const probe = window as typeof window & { zoomOverlayGlitches: string[]; zoomOverlayObserver: MutationObserver };
    probe.zoomOverlayObserver.disconnect();
    return probe.zoomOverlayGlitches;
  });
  expect(glitches).toEqual([]);
});

test('focused monitor stays still with reduced motion and pointer movement', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dongos-settings', JSON.stringify({ reducedMotion: true })));
  await page.goto('/');
  await expect(page.locator('.model-progress')).toHaveCount(0, { timeout: 30000 });
  await zoomToMonitor(page);
  const screen = page.locator('#os-monitor-layer');
  await expect(screen).toBeVisible();
  await expect(screen).toHaveAttribute('data-text-rendering', 'native');
  await expect(page.locator('[data-window="about"]')).toHaveCSS('background-color', 'rgb(32, 41, 54)');
  await page.waitForTimeout(300);
  const before = await screen.boundingBox();
  await page.mouse.move(30, 900);
  await page.waitForTimeout(300);
  const after = await screen.boundingBox();
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(.05);
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(.05);
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
  await page.mouse.move(10, 850);
  await page.mouse.wheel(0, 700);
  await expect(page.locator('#os-monitor-layer .desktop')).toHaveAttribute('inert', '');
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

test('the same project window and search remain visible through zoom out and in', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.model-progress')).toHaveCount(0, { timeout: 30000 });
  const screen = page.locator('#os-monitor-layer');
  await expect(screen).toBeVisible();
  await expect(screen.locator('.desktop')).toHaveAttribute('inert', '');
  await zoomToMonitor(page);
  await page.getByRole('button', { name: 'Open Projects', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Search projects' });
  await input.fill('DonBotify');
  const projectWindow = screen.locator('[data-window="projects"]');
  const instance = await projectWindow.elementHandle();
  await expect(projectWindow.locator('input')).toHaveValue('DonBotify');
  await page.mouse.move(10, 850);
  await page.mouse.wheel(0, 700);
  await expect(page.locator('#os-monitor-layer .desktop')).toHaveAttribute('inert', '');
  await expect(screen.locator('.desktop')).toHaveAttribute('inert', '');
  await expect(screen).toBeVisible();
  await expect(projectWindow).toBeVisible();
  await expect(projectWindow.locator('input')).toHaveValue('DonBotify');
  await expect(page.locator('#os-monitor-layer .desktop')).toHaveAttribute('inert', '');
  await zoomToMonitor(page);
  await expect(screen.locator('.desktop')).not.toHaveAttribute('inert', '');
  expect(await instance!.evaluate(element => element.isConnected)).toBe(true);
  await expect(projectWindow.locator('input')).toHaveValue('DonBotify');
  await expect(page).toHaveURL('http://127.0.0.1:3000/');
});

test('WebGL and model failure have direct profile fallback', async ({ page }) => {
  await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: string, ...args: unknown[]) { if (type === 'webgl2') return null; return original.apply(this, [type, ...args] as Parameters<typeof original>); } as typeof original; });
  await page.goto('/');
  await expect(page.getByText('3D isn’t available here.')).toBeVisible();
  await page.getByRole('button', { name: /^Open profile/ }).click();
  await expect(page.getByRole('main', { name: 'DongOS desktop' })).toBeVisible();
});
