'use client';
import { useState } from 'react';
import { ArrowUpRight, Check, Copy, LaptopMinimal, Mail, MapPin, Music2, Phone } from 'lucide-react';
import { getProfile } from '@/data/profile';
import { useTranslation } from '@/lib/i18n';
import { BrandMark } from '@/components/BrandMark';
import { AnimatedText } from '@/components/AnimatedText';
export function ContactApp() {
  const [status, setStatus] = useState(''); const { language, t } = useTranslation(); const profile = getProfile(language);
  const socialLinks = profile.links.filter(link => link.label !== 'Profile');
  async function copyContact(value: string, field: 'email' | 'phone') {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(field === 'email' ? 'Email copied.' : 'Phone number copied.');
    } catch {
      setStatus('Copy failed. Please copy the value manually.');
    }
  }
  return <div className="app-padding contact-app">
    <header className="contact-identity">
      <div className="contact-logo"><BrandMark /></div>
      <div className="contact-person">
        <h1><AnimatedText text={profile.name} /></h1>
        <p className="contact-role">{profile.role}</p>
        <div className="contact-details body-copy"><span><MapPin size={18} aria-hidden="true" />{profile.location}</span><span><LaptopMinimal size={18} aria-hidden="true" />{profile.availability}</span></div>
      </div>
    </header>
    <section className="contact-channels" aria-label={t('Contact details')}>
      <button type="button" className="contact-email contact-channel contact-copyable" aria-label={t('Copy email address')} onClick={() => copyContact(profile.email, 'email')}>
        <span className="contact-channel-icon"><Mail size={25} aria-hidden="true" /></span>
        <span className="contact-channel-content"><span className="contact-channel-label">Email</span><span className="contact-value">{profile.email}</span></span>
        <span className="contact-copy" aria-hidden="true">{status === 'Email copied.' ? <Check size={19} /> : <Copy size={19} />}</span>
      </button>
      <button type="button" className="contact-channel contact-phone contact-copyable" aria-label={t('Copy phone number')} onClick={() => copyContact(profile.phone, 'phone')}><span className="contact-channel-icon"><Phone size={23} aria-hidden="true" /></span><span className="contact-channel-content"><span className="contact-channel-label">{t('Phone')}</span><span className="contact-value">{profile.phone}</span></span><span className="contact-copy" aria-hidden="true">{status === 'Phone number copied.' ? <Check size={19} /> : <Copy size={19} />}</span></button>
      {socialLinks.map(link => <a className="contact-channel contact-social" key={link.url} href={link.url} target="_blank" rel="noreferrer" aria-label={t(link.label)}><span className="contact-channel-icon"><Music2 size={23} aria-hidden="true" /></span><span className="contact-channel-content"><span className="contact-channel-label">{t(link.label)}</span><span className="contact-social-handle">{new URL(link.url).pathname.split('/').filter(Boolean).at(-1)}<ArrowUpRight size={20} aria-hidden="true" /></span></span></a>)}
    </section>
    <p className="contact-status" role="status">{t(status)}</p>
  </div>;
}
