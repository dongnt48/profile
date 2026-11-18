import en from './cv/en.json';
import vi from './cv/vi.json';
export type Language = 'en' | 'vi';
export const cv = { en, vi };
export const profile = { name: 'Nguyễn Thanh Đông', role: 'Software Developer', email: 'dongnt48@gmail.com', phone: '0847793939' };
export function getProfile(language: Language) {
  return { ...profile, summary: cv[language].summary,
    location: language === 'en' ? 'Cần Thơ / Ho Chi Minh City' : 'Cần Thơ / TP. Hồ Chí Minh',
    availability: language === 'en' ? 'Available for Remote or On-site Work' : 'Sẵn sàng làm việc Remote hoặc On-site',
    cvUrl: `/cv/NguyenThanhDong-${language.toUpperCase()}.html`,
  };
}
