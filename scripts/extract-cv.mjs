import { chromium } from '@playwright/test';
import fs from 'node:fs';
const sources = {
 en: ['CV_NguyenThanhDong_Senior_Backend_EN.html', 'NguyenThanhDong-EN.html'],
 vi: ['CV_NguyenThanhDong_Senior_Backend.html', 'NguyenThanhDong-VI.html'],
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
 const page = await browser.newPage();
 await page.route('**/*', route => route.abort());
 for (const [language, [source, publicName]] of Object.entries(sources)) {
  await page.setContent(fs.readFileSync(source, 'utf8'));
  const data = await page.evaluate(() => {
   const text = el => el?.textContent.replace(/\s+/g, ' ').trim() || '';
   const contact = document.querySelector('.contact-grid');
   const location = text(contact.querySelector('.contact-row:first-child .contact-item:last-child')).replace(/^[^\p{L}]+/u, '');
   const title = text(document.querySelector('.header .title'));
   return {
    profile: {
     name: text(document.querySelector('.name')),
     role: title === 'SOFTWARE DEVELOPER' ? 'Software Developer' : title,
     email: text(contact.querySelector('a[href^="mailto:"]')),
     phone: text(contact.querySelector('strong')),
     location: location.replace(/\s*\([^)]*\)\s*$/, ''),
     availability: location.match(/\(([^)]*)\)\s*$/)?.[1] || '',
     links: [...contact.querySelectorAll('a[href^="https://"]')].map(a => ({ label: a.href.includes('tiktok.com') ? 'TikTok' : 'Profile', url: a.getAttribute('href') })),
    },
    summary: [...document.querySelectorAll('.section:first-of-type > p')].map(text),
    skills: [...document.querySelectorAll('.skill-row')].map(el => ({ group: text(el.querySelector('.skill-cat')).replace(/:$/, ''), text: text(el.querySelector('.skill-val')) })),
    projects: [...document.querySelectorAll('.project-card')].map(el => {
     const bullets = [...el.querySelectorAll('li')];
     const tech = bullets.find(li => /^(Tech Stack|C\u00f4ng ngh\u1ec7):/u.test(text(li)));
     const features = bullets.filter(li => li !== tech).map(text);
     return { title: text(el.querySelector('.project-title > span')), description: features[0] || '', tech: text(tech).replace(/^(Tech Stack|C\u00f4ng ngh\u1ec7):\s*/u, '').replace(/\.$/, ''), features };
    }),
    experience: [...document.querySelectorAll('.job-block, .job-entry')].map(el => ({ role: text(el.querySelector('.job-role')), company: text(el.querySelector('.job-company')), period: text(el.querySelector('.job-date')), achievements: [...el.querySelectorAll(':scope > ul > li')].map(text) })),
   };
  });
  if (!data.profile.name || !data.summary.length || data.skills.length !== 6 || data.projects.length !== 4 || data.experience.length !== 5 || data.projects.some(p => !p.tech)) throw new Error(`Incomplete CV extraction: ${source}`);
  fs.mkdirSync('src/data/cv', { recursive: true });
  fs.mkdirSync('public/cv', { recursive: true });
  fs.writeFileSync(`src/data/cv/${language}.json`, JSON.stringify(data, null, 2) + '\n');
  fs.copyFileSync(source, `public/cv/${publicName}`);
  console.log(`${language}: ${data.summary.length} summary, ${data.skills.length} skills, ${data.projects.length} projects, ${data.experience.length} jobs. Public CV copied exactly.`);
 }
} finally { await browser.close(); }
