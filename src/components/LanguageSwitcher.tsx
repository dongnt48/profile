'use client';
import { useEffect } from 'react';
import { useLanguageStore } from '@/stores/languageStore';
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();
  useEffect(() => { try { const saved = localStorage.getItem('dongos-language'); if (saved === 'vi' || saved === 'en') setLanguage(saved); } catch { /* Use English by default. */ } }, [setLanguage]);
  return <div className="language-switcher" role="group" aria-label={language === 'en' ? 'Profile language' : 'Ngôn ngữ hồ sơ'}><button lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button><button lang="vi" aria-label="Tiếng Việt" aria-pressed={language === 'vi'} onClick={() => setLanguage('vi')}>VI</button></div>;
}
