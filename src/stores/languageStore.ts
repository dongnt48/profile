'use client';
import { create } from 'zustand';
import type { Language } from '@/data/profile';
export const useLanguageStore = create<{ language: Language; setLanguage: (language: Language) => void }>(set => ({
  language: 'en',
  setLanguage: language => {
    set({ language }); document.documentElement.lang = language;
    try { localStorage.setItem('dongos-language', language); } catch { /* Storage is optional. */ }
  },
}));
