import { chromium } from '@playwright/test';
import fs from 'node:fs';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
await page.route('**/*', r => r.abort());
await page.setContent(fs.readFileSync('CV_NguyenThanhDong_Senior_Backend.html', 'utf8'));
const data = await page.evaluate(() => {
  const text = el => el?.textContent.replace(/\s+/g, ' ').trim() || '';
  return {
    summary: [...document.querySelectorAll('.section:first-of-type p')].map(text),
    skills: [...document.querySelectorAll('.skill-row')].map(el => ({ group: text(el.querySelector('.skill-cat')).replace(/:$/, ''), text: text(el.querySelector('.skill-val')) })),
    projects: [...document.querySelectorAll('.project-card')].map(el => ({ title: text(el.querySelector('.project-title > span')), description: text(el.querySelector('.project-title > span:last-child')), tech: text(el.querySelector('.project-tech')), features: [...el.querySelectorAll('li')].map(text) })),
    experience: [...document.querySelectorAll('.job-block')].map(el => ({ role: text(el.querySelector('.job-role')), company: text(el.querySelector('.job-company')), period: text(el.querySelector('.job-date')), achievements: [...el.querySelectorAll(':scope > ul > li')].map(text) })),
  };
});
fs.mkdirSync('src/data/cv', { recursive: true });
fs.writeFileSync('src/data/cv/vi.json', JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify(data, null, 2));
await browser.close();
