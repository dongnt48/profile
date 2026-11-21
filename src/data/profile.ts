import en from './cv/en.json';
import vi from './cv/vi.json';
export type Language = 'en' | 'vi';
export const cv = { en, vi };
export const profile = en.profile;
export function getProfile(language: Language) {
  return { ...cv[language].profile, summary: cv[language].summary };
}
