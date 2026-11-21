import { expect, test, type Page } from '@playwright/test';

async function openProfile(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      return type === 'webgl2' ? null : original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto('/');
  if (width > 1100 && height > 600) await page.getByRole('button', { name: /^Open profile/ }).click();
  else await expect(page.getByRole('dialog', { name: 'About me', exact: true })).toBeVisible();
}

test('phone reveals experience on scroll and preserves position when reopening', async ({ page }) => {
  await openProfile(page, 390, 844);
  await page.locator('[data-app="experience"]').click();
  const app = page.locator('[data-window="experience"]');
  const body = app.locator('.window-body');
  await expect(body).toHaveAttribute('data-reveal-active', 'true');
  const first = app.locator('.experience-project-heading').first();
  await expect(first).toHaveAttribute('data-scroll-reveal', 'shown');
  const nextJob = app.locator('.experience-entry').nth(1).locator('.experience-job-heading');
  await expect(nextJob).toHaveAttribute('data-scroll-reveal', 'pending');
  await expect(nextJob).toHaveCSS('opacity', '0');
  await nextJob.scrollIntoViewIfNeeded();
  await expect(nextJob).toHaveAttribute('data-scroll-reveal', 'shown');
  await expect(nextJob).toHaveCSS('opacity', '1');
  const position = await body.evaluate(el => el.scrollTop);
  await page.locator('[data-app="skills"]').click();
  await page.locator('[data-app="experience"]').click();
  await expect(nextJob).toHaveAttribute('data-scroll-reveal', 'shown');
  expect(await body.evaluate(el => el.scrollTop)).toBe(position);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  test(`text animation replays when returning or tapping the active tab at ${viewport.width}px`, async ({ page }) => {
    await openProfile(page, viewport.width, viewport.height);
    const about = page.locator('[data-window="about"]');
    const summary = about.locator('.cv-summary');
    const word = summary.locator('.text-word').last();
    await expect(word).toHaveCSS('opacity', '1');
    for (const returnFromOtherTab of [false, true]) {
      if (returnFromOtherTab) await page.locator('[data-app="contact"]').click();
      await page.locator('[data-app="about"]').click();
      await expect(summary).toHaveAttribute('data-scroll-reveal', 'shown');
      await expect.poll(() => word.evaluate(el => el.getAnimations().some(animation =>
        animation instanceof CSSTransition && animation.transitionProperty === 'opacity' && animation.playState === 'running',
      ))).toBe(true);
      await expect(word).toHaveCSS('opacity', '1');
    }
  });
}

test('tablet staggers reading units and reveals newly filtered project cards', async ({ page }) => {
  await openProfile(page, 768, 1024);
  await page.locator('[data-app="skills"]').click();
  const skills = page.locator('[data-window="skills"]');
  await expect(skills.locator('.skills-heading')).toHaveAttribute('data-scroll-reveal', 'shown');
  await expect.poll(() => skills.locator('[data-scroll-reveal="shown"]').evaluateAll(elements =>
    elements.some(el => parseFloat((el as HTMLElement).style.getPropertyValue('--reveal-delay')) > 0),
  )).toBe(true);
  await page.locator('[data-app="projects"]').click();
  await page.getByRole('textbox', { name: 'Search projects' }).fill('ApproveGram');
  const card = page.locator('[data-window="projects"] .project-card');
  await expect(card).toHaveCount(1);
  await expect(card).toHaveAttribute('data-scroll-reveal', 'shown');
  await expect(card).toHaveCSS('opacity', '1');
  await card.click();
  const detail = page.locator('[data-window="project:approvegram"]');
  await expect(detail.locator('.window-body')).toHaveAttribute('data-reveal-active', 'true');
  await expect(detail.locator('.project-detail > button')).toHaveAttribute('data-scroll-reveal', 'shown');
});

test('reduced motion reveals all content immediately and responds to preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openProfile(page, 390, 844);
  await page.locator('[data-app="experience"]').click();
  const app = page.locator('[data-window="experience"]');
  const body = app.locator('.window-body');
  await expect(body).not.toHaveAttribute('data-reveal-active');
  await expect(app.locator('[data-scroll-reveal]')).toHaveCount(0);
  await expect(app.locator('.experience-bullets > li').last()).toHaveCSS('opacity', '1');
  await expect(app.locator('.experience-heading .text-word').first()).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(body).toHaveAttribute('data-reveal-active', 'true');
  await expect(app.locator('.experience-bullets > li').last()).toHaveAttribute('data-scroll-reveal', 'pending');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(body).not.toHaveAttribute('data-reveal-active');
  await expect(app.locator('.experience-bullets > li').last()).toHaveCSS('opacity', '1');
});

test('intro text reveals word by word while retaining the full readable text', async ({ page }) => {
  await openProfile(page, 375, 667);
  const about = page.locator('[data-window="about"]');
  const summary = about.locator('.cv-summary');
  await expect(summary).toHaveAttribute('data-scroll-reveal', 'shown');
  const words = summary.locator('.text-word');
  expect(await words.count()).toBeGreaterThan(20);
  const delays = await words.evaluateAll(elements => elements.slice(0, 4).map(el => parseFloat(getComputedStyle(el).transitionDelay)));
  expect(delays[1]).toBeGreaterThan(delays[0]);
  expect(delays[2]).toBeGreaterThan(delays[1]);
  await expect(words.last()).toHaveCSS('opacity', '1');
  await expect(about.getByRole('heading', { name: 'Nguyen Thanh Dong', exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(words.first()).toHaveCSS('opacity', '1');
  await expect(words.first()).toHaveCSS('transition-duration', '0s');
});

test('desktop is fully visible and resize safely enables and removes scroll reveal', async ({ page }) => {
  await openProfile(page, 1440, 900);
  await page.locator('[data-app="experience"]').click();
  const body = page.locator('[data-window="experience"] .window-body');
  await expect(body).not.toHaveAttribute('data-reveal-active');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(body).toHaveAttribute('data-reveal-active', 'true');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(body).not.toHaveAttribute('data-reveal-active');
  await expect(body.locator('[data-scroll-reveal]')).toHaveCount(0);
});
