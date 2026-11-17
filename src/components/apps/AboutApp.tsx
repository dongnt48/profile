'use client';
import { ArrowUpRight } from 'lucide-react';
import { getProfile } from '@/data/profile';
import { useTranslation } from '@/lib/i18n';
import { useWindowStore } from '@/stores/windowStore';
export function AboutApp() {
  const { language, t } = useTranslation(); const profile = getProfile(language); const open = useWindowStore(s => s.open);
  return <div className="about-app app-padding"><div className="eyebrow">{t('Professional Summary')}</div><div className="about-heading"><div><h1>{profile.name}</h1><p className="role">{profile.role}</p></div></div>{profile.summary.map(paragraph => <p className="body-copy cv-summary" key={paragraph}>{paragraph}</p>)}<p className="body-copy">{profile.location}<br />{profile.availability}</p><div className="about-bottom"><button className="primary-button" onClick={() => open('projects')}>{t('Projects')} <ArrowUpRight size={17} /></button><button className="text-button" onClick={() => open('contact')}>{t('Contact')} ↗</button><a className="text-button" href={profile.cvUrl} target="_blank" rel="noreferrer">{t('View CV')} ↗</a></div></div>;
}
