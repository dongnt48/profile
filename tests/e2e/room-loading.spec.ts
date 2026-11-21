import { expect, test } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { RoomLoader } from '../../src/components/RoomLoader';

test('loading fill stays synchronized with the displayed percentage without visual lag', async ({ page }) => {
  const css = readFileSync('src/app/globals.css', 'utf8').replace(/^@import[^;]*;/, '');
  await page.goto('/cv/NguyenThanhDong-EN.html');
  await page.setContent(`<style>${css}</style>${renderToStaticMarkup(createElement(RoomLoader, { progress: 0 }))}`);
  for (const progress of [16, 54, 99, 100]) {
    const markup = renderToStaticMarkup(createElement(RoomLoader, { progress }));
    const measured = await page.evaluate(markup => {
      const next = new DOMParser().parseFromString(markup, 'text/html');
      const currentFill = document.querySelector<HTMLElement>('.loading-fill')!;
      currentFill.style.cssText = next.querySelector<HTMLElement>('.loading-fill')!.style.cssText;
      document.querySelector('.loading-percent')!.textContent = next.querySelector('.loading-percent')!.textContent;
      document.querySelector('.loading-status')!.textContent = next.querySelector('.loading-status')!.textContent;
      const bar = document.querySelector('[role="progressbar"]')!;
      bar.setAttribute('aria-valuenow', next.querySelector('[role="progressbar"]')!.getAttribute('aria-valuenow')!);
      return {
        percent: Number(bar.getAttribute('aria-valuenow')),
        label: document.querySelector('.loading-percent')!.textContent,
        fraction: currentFill.getBoundingClientRect().width / document.querySelector('.loading-track')!.getBoundingClientRect().width,
      };
    }, markup);
    expect(measured.label).toBe(`${progress}%`);
    expect(measured.percent).toBe(progress);
    expect(measured.fraction).toBeCloseTo(progress / 100, 3);
    if (progress === 99) {
      await page.locator('.loading-room-img').evaluate(async image => {
        await (image as HTMLImageElement).decode();
        image.closest('.boot-loader')!.classList.add('is-img-ready');
      });
      await expect(page.locator('.loading-room-img')).toHaveCSS('opacity', '1');
      await page.screenshot({ path: 'docs/screenshots/loading-current-99.png' });
    }
  }
  const complete = renderToStaticMarkup(createElement(RoomLoader, { progress: 40, complete: true }));
  expect(complete).toContain('aria-valuenow="100"');
  expect(complete).toContain('100%');
  const unknown = renderToStaticMarkup(createElement(RoomLoader));
  expect(unknown).not.toContain('aria-valuenow');
});

test('desktop opens only the introduction by default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.experience')).toHaveClass(/page-ready/, { timeout: 30000 });
  await expect(page.locator('.model-progress')).toHaveCount(0);
  await expect(page.locator('.os-window')).toHaveCount(1);
  await expect(page.locator('[data-window="about"]')).toHaveCount(1);
  await expect(page.locator('[data-window="projects"]')).toHaveCount(0);
  await page.mouse.move(10, 850);
  await page.mouse.wheel(0, -1800);
  await expect(page.locator('.experience')).toHaveClass(/monitor-focused/);
  await page.getByRole('button', { name: 'Open Projects', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Projects', exact: true })).toBeVisible();
});
