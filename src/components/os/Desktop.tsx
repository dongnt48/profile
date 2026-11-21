'use client';
import { useTranslation } from '@/lib/i18n';
import { useEffect, useRef } from 'react';
import { House } from 'lucide-react';
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
    <div className="desktop-greeting"><span className="eyebrow">{profile.role}</span><h1>{nameParts.join(' ')}<br /><em>{givenName}</em></h1><p>{profile.location}<br />{profile.availability}</p></div>
    {windows.map(w => <WindowFrame key={w.id} window={w} active={!w.minimized && w.zIndex === activeZ} animateContent={animateContent} />)}

  </main>;
}
