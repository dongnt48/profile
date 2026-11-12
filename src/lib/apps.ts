import { UserRound, FolderOpen, BriefcaseBusiness, Layers3, Images, SquareTerminal, Mail, Settings2 } from 'lucide-react';
import type { AppId } from '@/types';
export const apps = [
  { id: 'about', title: 'About me', subtitle: 'A little introduction', icon: UserRound, color: 'sand' },
  { id: 'projects', title: 'Projects', subtitle: 'Things I build', icon: FolderOpen, color: 'amber' },
  { id: 'experience', title: 'Experience', subtitle: 'The journey so far', icon: BriefcaseBusiness, color: 'sage' },
  { id: 'skills', title: 'Tech stack', subtitle: 'Tools of the trade', icon: Layers3, color: 'clay' },
  { id: 'gallery', title: 'Gallery', subtitle: 'Outside the screen', icon: Images, color: 'sage' },
  { id: 'terminal', title: 'Terminal', subtitle: 'For the curious', icon: SquareTerminal, color: 'dark' },
  { id: 'contact', title: 'Contact', subtitle: 'Start a conversation', icon: Mail, color: 'sand' },
  { id: 'settings', title: 'Settings', subtitle: 'Make yourself at home', icon: Settings2, color: 'clay' },
] as const;
export const isAppId = (value: string | null): value is AppId => apps.some(app => app.id === value);
export const getApp = (id: AppId) => apps.find(app => app.id === id)!;
