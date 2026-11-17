'use client';
import { useState } from 'react';
import { ArrowUpRight, Search, FolderOpen, ArrowLeft } from 'lucide-react';
import { categories, getProjects, type Project } from '@/data/projects';
import { useWindowStore } from '@/stores/windowStore';
import { useTranslation } from '@/lib/i18n';
function ProjectArt({ project }: { project: Project }) { return <div className={`project-art art-${project.art}`} aria-hidden="true"><div className="art-orbit" /><div className="art-window"><i /><i /><i /><div className="art-lines" /></div><span>{project.category}</span></div>; }
export function ProjectsApp({ projectId }: { projectId?: string }) {
  const [category, setCategory] = useState('All'); const [search, setSearch] = useState(''); const { language, t } = useTranslation(); const projects = getProjects(language);
  const openProject = useWindowStore(s => s.openProject); const close = useWindowStore(s => s.close);
  if (projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return <div className="app-padding">{t('Project not found.')}</div>;
    return <div className="project-detail app-padding"><button className="text-button" onClick={() => close(`project:${projectId}`)}><ArrowLeft size={16} />{t('Back to projects')}</button><ProjectArt project={project} /><h1>{project.title}</h1><p>{project.description}</p><div className="tags">{project.stack.map(s => <span key={s}>{s}</span>)}</div><h3>{t('Responsibilities')}</h3><ul>{project.features.map(f => <li key={f}>{f}</li>)}</ul></div>;
  }
  const filtered = projects.filter(p => (category === 'All' || p.category === category) && `${p.title} ${p.description} ${p.stack.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="projects-app"><div className="app-padding projects-header"><h1>{t('Key Projects')}</h1><label className="search-box"><Search size={17} /><input aria-label={t('Search projects')} placeholder={t('Find a project…')} value={search} onChange={e => setSearch(e.target.value)} /></label><div className="filters">{categories.map(c => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>{t(c)}</button>)}</div></div><div className="project-grid">{filtered.map(project => <button className="project-card" key={project.id} onClick={() => openProject(project.id, project.title)}><ProjectArt project={project} /><div className="project-card-body"><span className="card-meta">{project.description}<ArrowUpRight size={16} /></span><h2>{project.title}</h2><div className="tags">{project.stack.map(s => <span key={s}>{s}</span>)}</div></div></button>)}</div>{!filtered.length && <div className="empty-state"><FolderOpen /><h2>{t('No matching projects.')}</h2><button className="text-button" onClick={() => { setCategory('All'); setSearch(''); }}>{t('Reset filters')}</button></div>}<div className="app-status">{filtered.length} {t('projects')}</div></div>;
}
