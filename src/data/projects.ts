import { cv, type Language } from './profile';
export type Category = 'AI' | 'CRM' | 'HRM';
export type Project = { id: string; title: string; category: Category; description: string; stack: string[]; features: string[]; art: string };
const ids = ['donbotify', 'logistics-crm', 'approvegram', 'edu-crm'];
const types: Category[] = ['AI', 'CRM', 'HRM', 'CRM'];
export const getProjects = (language: Language): Project[] => cv[language].projects.map((p, i) => ({ ...p, id: ids[i], category: types[i], stack: p.tech.split(', '), art: i === 0 ? 'ai' : 'crm' }));
export const categories = ['All', 'AI', 'CRM', 'HRM'] as const;
