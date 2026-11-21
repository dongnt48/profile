'use client';
import { getExperience } from '@/data/experience';
import { BriefcaseBusiness, Building2, CalendarDays, Code2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { AnimatedText } from '@/components/AnimatedText';

function Technologies({ value, label }: { value: string; label: string }) {
  return <div className="experience-tech"><span><Code2 size={16} aria-hidden="true" />{label}</span><div className="tags">{value.replace(/\.$/, '').split(',').map(tech => <span key={tech}>{tech.trim()}</span>)}</div></div>;
}

export function ExperienceApp() {
  const { language, t } = useTranslation();
  return <div className="app-padding experience-app">
    <header className="experience-heading"><span className="experience-heading-icon"><BriefcaseBusiness size={25} aria-hidden="true" /></span><h1><AnimatedText text={t('Work Experience')} /></h1></header>
    <ol className="experience-timeline">{getExperience(language).map(item => {
      const technology = item.achievements.find(text => /^(Công nghệ|Tech Stack):/.test(text));
      const achievements = item.achievements.filter(text => text !== technology);
      return <li className="experience-entry" key={`${item.company}-${item.period}`}>
        <div className="experience-period"><CalendarDays size={16} aria-hidden="true" /><span>{item.period}</span></div>
        <article className="experience-card">
          <header className="experience-job-heading">{item.company && <p className="experience-company"><Building2 size={18} aria-hidden="true" />{item.company}</p>}<h2><AnimatedText text={item.role} /></h2></header>
          {achievements.length > 0 && <ul className="experience-bullets">{achievements.map(text => <li key={text}>{text}</li>)}</ul>}
          {technology && <Technologies label={t('Technologies')} value={technology.replace(/^(Công nghệ|Tech Stack):\s*/, '')} />}
          {item.projects.length > 0 && <div className="experience-projects">{item.projects.map((project, index) => <section className="experience-project" key={project.title}>
            <header className="experience-project-heading"><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h3><AnimatedText text={project.title} /></h3></header>
            <ul className="experience-bullets">{project.features.map(text => <li key={text}>{text}</li>)}</ul>
            <Technologies label={t('Technologies')} value={project.tech} />
          </section>)}</div>}
        </article>
      </li>;
    })}</ol>
  </div>;
}
