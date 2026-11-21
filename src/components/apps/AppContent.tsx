import type { DesktopWindow } from '@/types';
import { AboutApp } from './AboutApp';
import { ProjectsApp } from './ProjectsApp';
import { ExperienceApp } from './ExperienceApp';
import { SkillsApp } from './SkillsApp';
import { ContactApp } from './ContactApp';
export function AppContent({ window }: { window: DesktopWindow }) {
  switch (window.appId) {
    case 'about': return <AboutApp />;
    case 'projects': return <ProjectsApp projectId={window.id.startsWith('project:') ? window.id.slice(8) : undefined} />;
    case 'experience': return <ExperienceApp />;
    case 'skills': return <SkillsApp />;
    case 'contact': return <ContactApp />;
  }
}
