import { UserRound, FolderOpen, BriefcaseBusiness, Layers3, Images, Mail, Settings2 } from 'lucide-react';
import type { AppId } from '@/types';
export const apps = [
  { id: 'about', title: 'About me', icon: UserRound, color: 'sand' },
  { id: 'projects', title: 'Projects', icon: FolderOpen, color: 'amber' },
  { id: 'experience', title: 'Experience', icon: BriefcaseBusiness, color: 'sage' },
  { id: 'skills', title: 'Tech stack', icon: Layers3, color: 'clay' },
  { id: 'gallery', title: 'Gallery', icon: Images, color: 'sage' },
  { id: 'contact', title: 'Contact', icon: Mail, color: 'sand' },
  { id: 'settings', title: 'Settings', icon: Settings2, color: 'clay' },
] as const;
export const getApp = (id: AppId) => apps.find(app => app.id === id)!;
