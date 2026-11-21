import { UserRound, FolderOpen, BriefcaseBusiness, Layers3, Mail } from 'lucide-react';
import type { AppId } from '@/types';
export const apps = [
  { id: 'about', title: 'About me', icon: UserRound, color: 'sand' },
  { id: 'skills', title: 'Tech stack', icon: Layers3, color: 'clay' },
  { id: 'experience', title: 'Experience', icon: BriefcaseBusiness, color: 'sage' },
  { id: 'projects', title: 'Projects', icon: FolderOpen, color: 'sand' },
  { id: 'contact', title: 'Contact', icon: Mail, color: 'sand' },
] as const;
export const getApp = (id: AppId) => apps.find(app => app.id === id)!;
