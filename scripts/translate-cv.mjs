// Preserve the source document's layout, links, emphasis, and every content block.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const en = JSON.parse(fs.readFileSync('src/data/cv/en.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
await page.route('**/*', r => r.abort());
await page.setContent(fs.readFileSync('CV_NguyenThanhDong_Senior_Backend.html', 'utf8'));
await page.evaluate(en => {
  document.documentElement.lang = 'en';
  const set = (el, value) => { if (el) el.textContent = value; };
  set(document.querySelector('.btn-print'), '🖨️ Print or Save as PDF (Ctrl + P)');
  set(document.querySelector('.contact-item a[href="#"]'), 'Profile Link (to be updated)');
  set(document.querySelector('.contact-item:last-child'), '📍 Cần Thơ / Ho Chi Minh City (Available for Remote or On-site Work)');
  document.querySelectorAll('.section-title').forEach((el, i) => set(el, ['Professional Summary', 'Technical Skills', 'Work Experience & Key Projects'][i]));
  document.querySelectorAll('.section:first-of-type p').forEach((el, i) => set(el, en.summary[i]));
  document.querySelectorAll('.skill-row').forEach((el, i) => { set(el.querySelector('.skill-cat'), en.skills[i].group + ':'); set(el.querySelector('.skill-val'), en.skills[i].text); });
  document.querySelectorAll('.project-card').forEach((el, i) => { set(el.querySelector('.project-title > span'), en.projects[i].title); set(el.querySelector('.project-title > span:last-child'), en.projects[i].description); el.querySelectorAll('li').forEach((li, j) => set(li, en.projects[i].features[j])); });
  document.querySelectorAll('.job-block').forEach((el, i) => {
    set(el.querySelector('.job-role'), en.experience[i].role); set(el.querySelector('.job-date'), en.experience[i].period);
    el.querySelectorAll(':scope > ul > li').forEach((li, j) => {
      const originalStrong = li.querySelector('strong'); const value = en.experience[i].achievements[j];
      set(li, value);
      if (originalStrong) {
        const phrase = value.startsWith('Technologies:') ? 'Technologies:' : value.match(/reducing .+?approximately [\d–]+%/)?.[0];
        if (phrase) { const at = value.indexOf(phrase); li.replaceChildren(document.createTextNode(value.slice(0, at))); const strong = document.createElement('strong'); strong.textContent = phrase; li.append(strong, document.createTextNode(value.slice(at + phrase.length))); }
      }
    });
  });
  document.querySelectorAll('.page-footer').forEach((el, i) => set(el.querySelector('span:last-child'), `Page ${i + 1} / 2`));
}, en);
const html = await page.content();
fs.writeFileSync('CV_NguyenThanhDong_Senior_Backend_EN.html', html);
fs.mkdirSync('public/cv', { recursive: true });
fs.writeFileSync('public/cv/NguyenThanhDong-EN.html', html);
fs.copyFileSync('CV_NguyenThanhDong_Senior_Backend.html', 'public/cv/NguyenThanhDong-VI.html');
await browser.close();
console.log('English CV created; original Vietnamese CV preserved.');
