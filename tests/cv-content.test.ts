import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { cv, getProfile } from '../src/data/profile';
import { getProjects } from '../src/data/projects';
test('bilingual CV keeps all sections, dates, technologies and bullet counts aligned', () => {
  expect(cv.en.summary).toHaveLength(1); expect(cv.vi.summary).toHaveLength(1);
  expect(cv.en.skills).toHaveLength(6); expect(cv.en.projects).toHaveLength(4); expect(cv.en.experience).toHaveLength(5);
  cv.vi.projects.forEach((p, i) => { expect(cv.en.projects[i].tech).toBe(p.tech); expect(cv.en.projects[i].features).toHaveLength(p.features.length); });
  cv.vi.experience.forEach((job, i) => { expect(cv.en.experience[i].company).toBe(job.company); expect(cv.en.experience[i].period).toBe(job.period.replace('Hiện tại', 'Present')); expect(cv.en.experience[i].achievements).toHaveLength(job.achievements.length); });
  for (const number of ['60–70%', '90%', '80%']) expect(cv.en.experience[1].achievements.join(' ')).toContain(`approximately ${number}`);
});
test('contact and CV projects retain source details alongside the supplied online project', () => {
  expect(getProfile('en').role).toBe('Software Developer'); expect(getProfile('en').email).toBe('dongnt48@gmail.com'); expect(getProfile('en').phone).toBe('0847793939');
  expect(getProfile('en').name).toBe('Nguyen Thanh Dong'); expect(getProfile('vi').name).toBe('Nguyễn Thành Đông');
  expect(getProfile('en').links.map(link => link.url)).toEqual(['https://profile.modoha.io.vn', 'https://www.tiktok.com/@thanhdong0430']);
  for (const language of ['en', 'vi'] as const) {
    expect(cv[language].projects.filter(project => project.title.includes('(R&D)'))).toHaveLength(2);
    expect(cv[language].projects[0].tech).toBe('NestJS REST API, Next.js, PostgreSQL, Redis, Socket.IO');
    expect(cv[language].projects[2].tech).not.toContain('Vitest');
    expect(cv[language].projects[3].tech).not.toContain('Vitest');
  }
  expect(getProjects('en').map(p => p.id)).toEqual(['donbotify', 'logistics-crm', 'approvegram', 'edu-crm', 'mot-ngay-di-chua']);
  for (const language of ['en', 'vi'] as const) {
    const temple = getProjects(language).find(project => project.id === 'mot-ngay-di-chua')!;
    expect(temple.category).toBe('3D');
    expect(temple.liveUrl).toBe('https://1ngaydichua.modoha.io.vn/');
    expect(readFileSync(`public${temple.previewImage}`).byteLength).toBeGreaterThan(1000);
  }
  expect(getProfile('vi').location).toBe('An Giang / TP. Hồ Chí Minh');
  expect(getProfile('en').location).toBe('An Giang / Ho Chi Minh City');
});
test('Vietnamese public CV is unchanged and English export has matching content blocks', () => {
  const original = readFileSync('CV_NguyenThanhDong_Senior_Backend.html', 'utf8');
  expect(readFileSync('public/cv/NguyenThanhDong-VI.html', 'utf8')).toBe(original);
  const english = readFileSync('CV_NguyenThanhDong_Senior_Backend_EN.html', 'utf8');
  expect(readFileSync('public/cv/NguyenThanhDong-EN.html', 'utf8')).toBe(english);
  expect(english).toContain('lang="en"');
  expect(english.match(/<li>/g)?.length).toBe(original.match(/<li>/g)?.length);
  expect(english.match(/class="project-card"/g)).toHaveLength(4);
  expect(english.replace(/<!--[\s\S]*?-->/g, '')).not.toContain('Tóm tắt chuyên môn');
});
