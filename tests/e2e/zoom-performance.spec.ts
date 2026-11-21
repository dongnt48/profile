import { expect, test } from '@playwright/test';

test('zoom moves the projected screen without repeatedly laying out its text', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.experience')).toHaveClass(/page-ready/, { timeout: 30000 });
  await page.evaluate(() => {
    const screen = document.getElementById('os-monitor-layer')!;
    const changes: string[] = [];
    let previous = screen.style.zoom;
    Object.assign(window, { monitorZoomChanges: changes });
    new MutationObserver(() => {
      if (screen.style.zoom !== previous) {
        previous = screen.style.zoom;
        changes.push(previous);
      }
    }).observe(screen, { attributes: true, attributeFilter: ['style'] });
  });
  await page.mouse.move(10, 850);
  await page.mouse.wheel(0, -1800);
  await expect(page.locator('.experience')).toHaveClass(/monitor-focused/);
  await expect(page.locator('#os-monitor-layer')).toHaveAttribute('data-text-rendering', 'native');
  await page.getByRole('button', { name: 'Open Projects', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Projects', exact: true })).toBeVisible();
  await page.mouse.move(10, 850);
  await page.mouse.wheel(0, 700);
  await expect(page.locator('#os-monitor-layer .desktop')).toHaveAttribute('inert', '');
  const changes = await page.evaluate(() => (window as typeof window & { monitorZoomChanges: string[] }).monitorZoomChanges);
  expect(changes.length).toBeLessThanOrEqual(2);
});
