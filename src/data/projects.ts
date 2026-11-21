import { cv, type Language } from './profile';
export type Category = 'AI' | 'CRM' | 'HRM' | '3D';
export type Project = { id: string; title: string; category: Category; description: string; stack: string[]; features: string[]; art: string; liveUrl?: string; previewImage?: string; featuresLabel?: string };
const ids = ['donbotify', 'logistics-crm', 'approvegram', 'edu-crm'];
const types: Category[] = ['AI', 'CRM', 'HRM', 'CRM'];
// Additional projects supplied separately from the two source CVs.
const templeContent = {
  vi: {
    title: 'Một Ngày Đi Chùa — Trải nghiệm chùa 3D',
    description: 'Không gian chùa 3D trên trình duyệt, nơi người ghé thăm chọn nhân vật và tìm một khoảng bình yên.',
    features: [
      'Khung cảnh chùa 3D với chánh điện, tháp, cây xanh và hồ sen.',
      'Luồng vào chùa cho phép đặt tên và chọn nhân vật nam hoặc nữ.',
      'Ghi nhớ danh tính khách trên trình duyệt để thuận tiện khi quay lại.',
      'Điều khiển bật/tắt âm thanh ngay trên giao diện.',
    ],
  },
  en: {
    title: 'Một Ngày Đi Chùa — 3D Temple Experience',
    description: 'A browser-based 3D temple experience where visitors choose a character and take a quiet break.',
    features: [
      'A 3D temple scene featuring a main hall, pagoda tower, trees, and lotus pond.',
      'An entry flow for choosing a guest name and a male or female character.',
      'Guest identity remembered in the browser for return visits.',
      'An interface control for turning ambient sound on or off.',
    ],
  },
};
export function getProjects(language: Language): Project[] {
  const cvProjects: Project[] = cv[language].projects.map((p, i) => ({ title: p.title, description: p.description, features: p.features, id: ids[i], category: types[i], stack: p.tech.split(', '), art: i === 0 ? 'ai' : 'crm', liveUrl: ids[i] === 'approvegram' ? 'https://approve.modoha.io.vn' : undefined, previewImage: ids[i] === 'approvegram' ? '/images/projects/approvegram-dashboard.png' : undefined }));
  return [...cvProjects, {
    id: 'mot-ngay-di-chua',
    ...templeContent[language],
    category: '3D',
    stack: [],
    art: '3d',
    featuresLabel: 'Features',
    liveUrl: 'https://1ngaydichua.modoha.io.vn/',
    previewImage: '/images/projects/mot-ngay-di-chua.jpg',
  }];
}
export const categories = ['All', 'AI', 'CRM', 'HRM', '3D'] as const;
