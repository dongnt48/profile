'use client';
import { getSkills } from '@/data/skills';
import { useTranslation } from '@/lib/i18n';
export function SkillsApp() { const { language, t } = useTranslation(); return <div className="app-padding"><h1>{t('Technical Skills')}</h1><div className="skill-groups">{getSkills(language).map((s, i) => <section key={i}><span className="skill-number">0{i + 1}</span><div><h2>{s.group}</h2><p>{s.text}</p></div></section>)}</div></div>; }
