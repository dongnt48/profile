import { cv, type Language } from './profile';
export const getExperience = (language: Language) => cv[language].experience;
