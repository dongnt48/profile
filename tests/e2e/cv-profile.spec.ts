import { expect, test } from '@playwright/test';
async function openFallback(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl2') return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open profile', exact: true }).click();
}

test('English CV content switches to Vietnamese in existing windows and persists', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await openFallback(page);
  await page.getByRole('button', { name: 'Open About me', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const about = page.locator('[data-window="about"]');
  await expect(about).toContainText('Nguyễn Thanh Đông');
  await expect(about).toContainText('third-party platform integrations');
  await expect(about.getByRole('link', { name: 'View CV' })).toHaveAttribute('href', '/cv/NguyenThanhDong-EN.html');
  await page.getByRole('button', { name: 'Tiếng Việt', exact: true }).click();
  await expect(about).toHaveAttribute('aria-label', 'Giới thiệu');
  await expect(about).toContainText('Tóm tắt chuyên môn');
  await expect(about).toContainText('tích hợp các nền tảng bên thứ ba');
  await expect(about.getByRole('link', { name: 'Xem CV' })).toHaveAttribute('href', '/cv/NguyenThanhDong-VI.html');
  await page.reload();
  await page.getByRole('button', { name: 'Mở hồ sơ', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await page.getByRole('button', { name: 'Mở Dự án', exact: true }).click();
  await page.getByRole('button', { name: /AI Chatbot SaaS.*DonBotify/ }).click();
  const project = page.locator('[data-window="project:donbotify"]');
  await expect(project).toContainText('cấu hình, dữ liệu và kho kiến thức độc lập');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(project).toHaveAttribute('aria-label', /AI Virtual Assistant/);
  await expect(project).toContainText('independent configurations, data, and knowledge bases');
  await page.getByRole('button', { name: 'Open Contact', exact: true }).click();
  const contact = page.locator('[data-window="contact"]');
  await expect(contact.getByRole('link', { name: 'dongnt48@gmail.com' })).toHaveAttribute('href', 'mailto:dongnt48@gmail.com');
  await expect(contact.getByRole('link', { name: '0847793939' })).toHaveAttribute('href', 'tel:0847793939');
  await page.getByRole('button', { name: 'Open Experience', exact: true }).click();
  await expect(page.locator('[data-window="experience"]')).toContainText('Innocom');
  await expect(page.locator('[data-window="experience"]')).toContainText('approximately 60–70%');
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
  await expect(page.locator('.name')).toHaveText('Nguyễn Thanh Đông');
  await expect(page.locator('.project-card')).toHaveCount(4);
});
