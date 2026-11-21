'use client';
import { getSkills } from '@/data/skills';
import { useTranslation } from '@/lib/i18n';
import { AnimatedText } from '@/components/AnimatedText';
import { Database, Layers3, Network, PanelsTopLeft, Server, TerminalSquare, Workflow } from 'lucide-react';

const groupIcons = [Server, PanelsTopLeft, Database, Workflow, Network, TerminalSquare];

export function SkillsApp() {
  const { language, t } = useTranslation();
  return <div className="app-padding skills-app">
    <header className="skills-heading"><span className="skills-heading-icon"><Layers3 size={25} aria-hidden="true" /></span><h1><AnimatedText text={t('Technical Skills')} /></h1></header>
    <div className="skills-grid">{getSkills(language).map((skill, index) => {
      const Icon = groupIcons[index] ?? Layers3;
      // Keep framework families together, including the commas inside PHP (...).
      const technologies = skill.text.replace(/\.$/, '').split(/,\s*(?![^()]*\))/);
      return <section className="skills-card" data-primary={index === 0} key={index}>
        <header><span className="skills-card-icon"><Icon size={23} strokeWidth={1.7} aria-hidden="true" /></span><h2><AnimatedText text={skill.group} /></h2></header>
        <ul className="skill-items">{technologies.map(technology => <li key={technology}>{technology}</li>)}</ul>
      </section>;
    })}</div>
  </div>;
}
