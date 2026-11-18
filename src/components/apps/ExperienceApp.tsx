'use client';
import { getExperience } from '@/data/experience';
import { getProjects } from '@/data/projects';
import { useTranslation } from '@/lib/i18n';
import { useWindowStore } from '@/stores/windowStore';
export function ExperienceApp() {
  const { language, t } = useTranslation(); const openProject = useWindowStore(s => s.openProject);
  return <div className="app-padding"><h1>{t('Work Experience & Key Projects')}</h1><ol className="timeline">{getExperience(language).map((item, i) => <li key={i}><small>{item.period}</small><h2>{item.role}</h2>{item.company && <p>{item.company}</p>}<ul>{item.achievements.map(a => <li key={a}>{a}</li>)}</ul>{i === 0 && <div className="cv-project-links">{getProjects(language).map(p => <button className="text-button" key={p.id} onClick={() => openProject(p.id)}>{p.title} ↗</button>)}</div>}</li>)}</ol></div>;
}
