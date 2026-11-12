'use client';
import { useState } from 'react';
import { ArrowUpRight, Search, FolderOpen, ArrowLeft } from 'lucide-react';
import { categories, projects, type Project } from '@/data/projects';
import { useWindowStore } from '@/stores/windowStore';
function ProjectArt({ project }: { project: Project }) { return <div className={`project-art art-${project.art}`}><div className="art-orbit" /><div className="art-window"><i /><i /><i /><div className="art-lines" /></div><span>{project.category.toUpperCase()}</span></div>; }
export function ProjectsApp({ projectId }: { projectId?: string }) {
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const openProject = useWindowStore(s => s.openProject);
  const close = useWindowStore(s => s.close);
  if (projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return <div className="app-padding">Project not found.</div>;
    return <div className="project-detail app-padding"><button className="text-button" onClick={() => close(`project:${projectId}`)}><ArrowLeft size={16} /> Back to projects</button><ProjectArt project={project} /><span className="eyebrow">{project.sample ? 'PROTOTYPE' : (project.id === 'workspace' ? 'IN THIS REPOSITORY' : 'FEATURED PROJECT')}</span><h1>{project.title}</h1><p>{project.description}</p><div className="tags">{project.stack.map(s => <span key={s}>{s}</span>)}</div><h3>Role</h3><p>{project.role}</p><h3>Inside the project</h3><ul>{project.features.map(f => <li key={f}>{f}</li>)}</ul><div className="inline-actions">{project.demo && <a href={project.demo} target="_blank" rel="noreferrer">Live demo ↗</a>}{project.repository && <a href={project.repository} target="_blank" rel="noreferrer">Source code ↗</a>}</div></div>;
  }
  const filtered = projects.filter(p => (category === 'All' || p.category === category) && `${p.title} ${p.description} ${p.stack.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="projects-app"><div className="app-padding projects-header"><span className="eyebrow">SELECTED WORK & LITTLE EXPERIMENTS</span><h1>Things I’ve been building<span className="accent">.</span></h1><p>A collection of ideas, brought to life.</p><label className="search-box"><Search size={17} /><input aria-label="Search projects" placeholder="Find a project…" value={search} onChange={e => setSearch(e.target.value)} /><kbd>⌕</kbd></label><div className="filters" aria-label="Project categories">{categories.map(c => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div></div><div className="project-grid">{filtered.map(project => <button className="project-card" key={project.id} onClick={() => openProject(project.id, project.title)}><ProjectArt project={project} /><div className="project-card-body"><span className="card-meta">{project.sample ? 'PROTOTYPE' : (project.id === 'workspace' ? 'CURRENT PROJECT' : 'FEATURED')} <ArrowUpRight size={16} /></span><h2>{project.title}</h2><p>{project.description}</p><div className="tags">{project.stack.map(s => <span key={s}>{s}</span>)}</div></div></button>)}</div>{!filtered.length && <div className="empty-state"><FolderOpen /><h2>No projects here yet.</h2><p>Try another category or search term.</p><button className="text-button" onClick={() => { setCategory('All'); setSearch(''); }}>Reset filters</button></div>}<div className="app-status">{filtered.length} projects <span>Made with curiosity</span></div></div>;
}
