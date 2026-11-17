import { cv, type Language } from './profile';
export const getSkills = (language: Language) => cv[language].skills;
