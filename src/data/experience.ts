import { cv, type Language } from './profile';
// The CV's freelance section spans both pages and contains all four CV projects.
export const getExperience = (language: Language) => cv[language].experience.map((item, index) => ({
  ...item,
  projects: index === 0 ? cv[language].projects : [],
}));
