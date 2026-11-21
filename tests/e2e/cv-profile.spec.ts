import { expect, test } from '@playwright/test';
import en from '../../src/data/cv/en.json';
import vi from '../../src/data/cv/vi.json';
async function openFallback(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl2') return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto('/');
  if ((page.viewportSize()?.width ?? 1440) > 1100) await page.getByRole('button', { name: /^Open profile/ }).click();
  else await expect(page.getByRole('dialog', { name: 'About me', exact: true })).toBeVisible();
}

test('English CV content switches to Vietnamese in existing windows and persists', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await openFallback(page);
  await page.getByRole('button', { name: 'Open About me', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const about = page.locator('[data-window="about"]');
  await expect(about).toContainText(en.profile.name);
  await expect(about).toContainText(en.summary[0]);
  await expect(about).toContainText('An Giang / Ho Chi Minh City');
  await expect(page.getByRole('link', { name: 'View CV' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tiếng Việt', exact: true }).click();
  await expect(about).toHaveAttribute('aria-label', 'Giới thiệu');
  await expect(about).toContainText(vi.profile.name);
  await expect(about).toContainText(vi.summary[0]);
  await expect(about).toContainText('An Giang / TP. Hồ Chí Minh');
  await expect(page.getByRole('link', { name: 'Xem CV' })).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: /^Mở hồ sơ/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await page.getByRole('button', { name: 'Mở Dự án', exact: true }).click();
  await page.locator('.project-card').filter({ has: page.getByRole('heading', { name: vi.projects[0].title, exact: true }) }).click();
  const project = page.locator('[data-window="project:donbotify"]');
  await expect(project).toContainText('cấu hình, dữ liệu và kho kiến thức độc lập');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(project).toHaveAttribute('aria-label', en.projects[0].title);
  await expect(project).toContainText(en.projects[0].features[0]);
  await page.getByRole('button', { name: 'Open Contact', exact: true }).click();
  const contact = page.locator('[data-window="contact"]');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await contact.getByRole('button', { name: 'Copy email address', exact: true }).click();
  await expect(contact.getByRole('status')).toHaveText('Email copied.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('dongnt48@gmail.com');
  await contact.getByRole('button', { name: 'Copy phone number', exact: true }).click();
  await expect(contact.getByRole('status')).toHaveText('Phone number copied.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('0847793939');
  await expect(contact.locator('a[href^="mailto:"], a[href^="tel:"]')).toHaveCount(0);
  await expect(contact.getByRole('link', { name: 'Profile', exact: true })).toHaveCount(0);
  await expect(contact.getByRole('heading', { name: 'Let’s connect.', exact: true })).toHaveCount(0);
  await expect(contact.getByRole('link', { name: 'TikTok', exact: true })).toHaveAttribute('href', en.profile.links[1].url);
  await page.getByRole('button', { name: 'Open Experience', exact: true }).click();
  const experience = page.locator('[data-window="experience"]');
  await expect(experience.locator('.experience-project')).toHaveCount(4);
  await expect(experience.locator('a, .experience-app button')).toHaveCount(0);
  for (const project of en.projects) {
    await expect(experience.getByRole('heading', { name: project.title, exact: true })).toBeVisible();
    for (const feature of project.features) await expect(experience).toContainText(feature);
  }
  for (const job of en.experience) {
    if (job.company) await expect(experience).toContainText(job.company);
    await expect(experience).toContainText(job.period);
    for (const achievement of job.achievements.filter(text => !text.startsWith('Tech Stack:'))) await expect(experience).toContainText(achievement);
  }
  await page.getByRole('button', { name: 'Tiếng Việt', exact: true }).click();
  for (const project of vi.projects) {
    await expect(experience.getByRole('heading', { name: project.title, exact: true })).toBeVisible();
    for (const feature of project.features) await expect(experience).toContainText(feature);
  }
  expect(errors).toEqual([]);
});
test('language controls and CV remain usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFallback(page);
  await page.getByRole('button', { name: 'Open Tech stack', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếng Việt', exact: true }).click();
  await expect(page.locator('[data-window="skills"]')).toContainText('Cơ sở dữ liệu');
  await expect(page.locator('[data-window="skills"]')).toContainText('PHP (Laravel, CodeIgniter, Vtiger Core)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: 'docs/screenshots/profile-vi-mobile.png' });
  await page.goto('/cv/NguyenThanhDong-EN.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.name')).toHaveText(en.profile.name);
  await expect(page.locator('.project-card')).toHaveCount(4);
});
