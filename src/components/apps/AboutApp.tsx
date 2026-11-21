'use client';
import { ArrowUpRight, Code2, LaptopMinimal, Mail, MapPin } from 'lucide-react';
import { getProfile } from '@/data/profile';
import { useTranslation } from '@/lib/i18n';
import { useWindowStore } from '@/stores/windowStore';
import { AnimatedText } from '@/components/AnimatedText';
export function AboutApp() {
  const { language, t } = useTranslation(); const profile = getProfile(language); const open = useWindowStore(s => s.open);
  return <div className="about-app app-padding">
    <div className="about-copy">
      <div className="about-heading"><div><h1><AnimatedText text={profile.name} /></h1><p className="role"><Code2 size={20} aria-hidden="true" /><span><AnimatedText text={profile.role} /></span></p></div></div>
      {profile.summary.map(paragraph => <p className="body-copy cv-summary" key={paragraph}><AnimatedText text={paragraph} /></p>)}
      <div className="about-meta body-copy"><span><MapPin size={23} aria-hidden="true" />{profile.location}</span><span><LaptopMinimal size={23} aria-hidden="true" />{profile.availability}</span></div>
      <div className="about-bottom"><button className="primary-button" onClick={() => open('projects')}>{t('Projects')} <ArrowUpRight size={19} /></button><button className="text-button" onClick={() => open('contact')}>{t('Contact')} <Mail size={20} aria-hidden="true" /></button></div>
    </div>
    {/* Decorative artwork stays separate from the accessible, interactive content. */}
    <div className="about-illustration" aria-hidden="true"><img src="/images/desktop/blue-desk-reference.webp" alt="" width={1254} height={1254} /></div>
  </div>;
}
