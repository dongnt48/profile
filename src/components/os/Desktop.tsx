'use client';
import { useTranslation } from '@/lib/i18n';
import { useEffect, useRef } from 'react';
import { ArrowUpRight, Code2, House, LaptopMinimal, MapPin } from 'lucide-react';
import { getProfile } from '@/data/profile';
import { useWindowStore } from '@/stores/windowStore';
import { WindowFrame } from './WindowFrame';
import { apps, getApp } from '@/lib/apps';
import { getProjects } from '@/data/projects';
import { playOpenSound } from '@/lib/sound';
import { BrandMark } from '@/components/BrandMark';
export function Desktop({ visible, animateContent = false }: { visible: boolean; animateContent?: boolean }) {
  const { language, t } = useTranslation();
  const profile = getProfile(language);
  const nameParts = profile.name.split(' ');
  const givenName = nameParts.pop();
  const windows = useWindowStore(s => s.windows);
  const open = useWindowStore(s => s.open);
  const desktopRef = useRef<HTMLElement>(null);
  useEffect(() => { if (visible) desktopRef.current?.focus({ preventScroll: true }); }, [visible]);
  const activeZ = Math.max(0, ...windows.filter(w => !w.minimized).map(w => w.zIndex));
  const activeWindow = windows.find(w => !w.minimized && w.zIndex === activeZ);
  const activeTitle = activeWindow
    ? activeWindow.id.startsWith('project:')
      ? getProjects(language).find(project => project.id === activeWindow.id.slice(8))?.title ?? t('Projects')
      : t(getApp(activeWindow.appId).title)
    : t('Personal workspace');
  return <main className="desktop" ref={desktopRef} tabIndex={-1} aria-label={t('Personal workspace')} inert={!visible}>
    <div className="desktop-wallpaper" /><div className="wallpaper-shade" />
    <header className="desktop-menubar">
      <div className="desktop-identity"><BrandMark /><strong>Đông</strong><span className="desktop-header-context" title={activeTitle}>{activeTitle}</span></div>
    </header>
    <nav className="desktop-icons" aria-label={t("Applications")}>{apps.map(app => {
      const Icon = app.id === 'about' ? House : app.icon;
      const running = windows.some(w => w.appId === app.id);
      const active = activeWindow?.appId === app.id;
      return <button key={app.id} className="desktop-icon" data-app={app.id} data-running={running} data-active={active} aria-current={active ? 'true' : undefined} aria-label={`${t("Open")} ${t(app.title)}`} onClick={() => { open(app.id); playOpenSound(); }}>
        <span className={`app-icon ${app.color}`}><Icon strokeWidth={1.8} aria-hidden="true" /></span>
        <span>{t(app.title)}</span>
      </button>;
    })}</nav>
    {!activeWindow && <section className="desktop-greeting" aria-label={profile.name}>
      <div className="welcome-copy">
        <span className="welcome-role"><Code2 size={18} aria-hidden="true" />{profile.role}</span>
        <h1><span>{nameParts.join(' ')}</span>{' '}<em>{givenName}</em></h1>
        <ul className="welcome-specialties" aria-label={t('Technical Skills')}><li>Backend</li><li>CRM / HRM</li><li>AI & Automation</li></ul>
        <div className="welcome-details"><span><MapPin size={18} aria-hidden="true" />{profile.location}</span><span><LaptopMinimal size={18} aria-hidden="true" />{profile.availability}</span></div>
        <div className="welcome-actions"><button className="primary-button" onClick={() => { open('about'); playOpenSound(); }}>{t('About me')}<ArrowUpRight size={18} aria-hidden="true" /></button><button className="text-button" onClick={() => { open('projects'); playOpenSound(); }}>{t('Projects')}<ArrowUpRight size={18} aria-hidden="true" /></button></div>
      </div>
      <div className="welcome-art" aria-hidden="true"><img src="/images/desktop/blue-desk-reference.webp" alt="" width={1254} height={1254} /></div>
    </section>}
    {windows.map(w => <WindowFrame key={w.id} window={w} active={!w.minimized && w.zIndex === activeZ} animateContent={animateContent} />)}

  </main>;
}
