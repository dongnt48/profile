'use client';
import { useTranslation } from '@/lib/i18n';
import { useEffect, useRef } from 'react';
import { getProfile } from '@/data/profile';
import { useWindowStore } from '@/stores/windowStore';
import { WindowFrame } from './WindowFrame';
import { apps } from '@/lib/apps';
import { playOpenSound } from '@/lib/sound';
export function Desktop({ visible }: { visible: boolean }) {
  const { language, t } = useTranslation();
  const profile = getProfile(language);
  const windows = useWindowStore(s => s.windows);
  const open = useWindowStore(s => s.open);
  const desktopRef = useRef<HTMLElement>(null);
  useEffect(() => { if (visible) desktopRef.current?.focus({ preventScroll: true }); }, [visible]);
  const activeZ = Math.max(0, ...windows.filter(w => !w.minimized).map(w => w.zIndex));
  return <main className="desktop" ref={desktopRef} tabIndex={-1} aria-label="DongOS desktop" inert={!visible}>
    <div className="desktop-wallpaper" /><div className="wallpaper-shade" />
    <nav className="desktop-icons" aria-label={t("Applications")}>{apps.map(app => {
      const Icon = app.icon;
      const running = windows.some(w => w.appId === app.id);
      return <button key={app.id} className="desktop-icon" data-app={app.id} aria-label={`${t("Open")} ${t(app.title)}`} onClick={() => { open(app.id); playOpenSound(); }}>
        <span className={`app-icon ${app.color}`}><Icon strokeWidth={1.4} /></span>
        <span>{t(app.title)}{running && <span aria-hidden="true"> ·</span>}</span>
      </button>;
    })}</nav>
    <div className="desktop-greeting"><span className="eyebrow">{profile.role}</span><h1>Nguyễn Thanh<br /><em>Đông</em></h1><p>{profile.location}<br />{profile.availability}</p></div>
    {windows.map(w => <WindowFrame key={w.id} window={w} active={!w.minimized && w.zIndex === activeZ} />)}

  </main>;
}
