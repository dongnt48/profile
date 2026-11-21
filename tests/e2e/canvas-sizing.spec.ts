import { expect, test } from '@playwright/test';

for (const reducedMotion of [false, true]) {
  test(`room canvas fills its layout after loading and resizing (reduced motion: ${reducedMotion})`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 920 });
    await page.addInitScript(value => localStorage.setItem('dongos-settings', JSON.stringify({ reducedMotion: value })), reducedMotion);
    await page.goto('/');
    await expect(page.locator('.experience')).toHaveClass(/page-ready/, { timeout: 30000 });
    await expect(page.locator('.model-progress')).toHaveCount(0);

    async function expectFullCanvas() {
      await expect(async () => {
        const bounds = await page.locator('canvas').evaluate(canvas => {
          const rect = canvas.getBoundingClientRect();
          const container = canvas.closest('.scene-canvas')!.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, expectedX: container.x, expectedY: container.y, expectedWidth: container.width, expectedHeight: container.height, viewportWidth: innerWidth, viewportHeight: innerHeight };
        });
        expect(Math.abs(bounds.x - bounds.expectedX)).toBeLessThan(1);
        expect(Math.abs(bounds.y - bounds.expectedY)).toBeLessThan(1);
        expect(Math.abs(bounds.width - bounds.expectedWidth)).toBeLessThan(1);
        expect(Math.abs(bounds.height - bounds.expectedHeight)).toBeLessThan(1);
        // Phones intentionally crop a larger room composition; desktop fills the viewport.
        if (bounds.viewportWidth > 700) {
          expect(Math.abs(bounds.width - bounds.viewportWidth)).toBeLessThan(1);
          expect(Math.abs(bounds.height - bounds.viewportHeight)).toBeLessThan(1);
        }
      }).toPass({ timeout: 4000 });
    }

    await expectFullCanvas();
    await page.mouse.move(10, 700);
    await page.mouse.wheel(0, -140);
    await expectFullCanvas();
    for (const viewport of [{ width: 1366, height: 768 }, { width: 2560, height: 1080 }]) {
      await page.setViewportSize(viewport);
      await expectFullCanvas();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.experience')).toHaveClass(/reading-mode/);
    await expect(page.locator('canvas')).toHaveCount(0);
    await page.setViewportSize({ width: 1366, height: 768 });
    await expect(page.locator('canvas')).toBeVisible();
    await expectFullCanvas();
  });
}
