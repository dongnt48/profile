'use client';
import { useState } from 'react';
import { ArrowUpRight, Copy, Mail } from 'lucide-react';
import { getProfile } from '@/data/profile';
import { useTranslation } from '@/lib/i18n';
export function ContactApp() {
  const [status, setStatus] = useState(''); const { language, t } = useTranslation(); const profile = getProfile(language);
  return <div className="app-padding contact-app"><div className="contact-symbol"><Mail size={36} /></div><h1>{t('Contact')}</h1><h2>{profile.name}</h2><p className="body-copy">{profile.role}<br />{profile.location}<br />{profile.availability}</p><div className="contact-email"><a href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={20} /></a><button aria-label={t('Copy email address')} onClick={async () => { try { await navigator.clipboard.writeText(profile.email); setStatus('Email copied.'); } catch { setStatus('Copy failed. Please copy the email address manually.'); } }}><Copy size={18} /></button></div><a className="text-button" href={`tel:${profile.phone}`}>{profile.phone}</a><p role="status">{t(status)}</p><a className="text-button" href={profile.cvUrl} target="_blank" rel="noreferrer">{t('View CV')} ↗</a></div>;
}
