'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpLeft, BatteryFull, Command, Moon, Sun, Wifi, Volume2, VolumeX } from 'lucide-react';
import { apps } from '@/lib/apps';
import { profile } from '@/data/profile';
import { useWindowStore } from '@/stores/windowStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { playOpenSound } from '@/lib/sound';
import { WindowFrame } from './WindowFrame';
import { Taskbar } from './Taskbar';
export function Desktop({ onBack, visible }: { onBack: () => void; visible: boolean }) {
  const windows = useWindowStore(s => s.windows); const open = useWindowStore(s => s.open); const { sound, lighting, setSound, toggleLighting } = useSettingsStore();
  const [now, setNow] = useState<Date | null>(null); const desktopRef = useRef<HTMLElement>(null);
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);
  useEffect(() => { if (visible) desktopRef.current?.focus({ preventScroll: true }); }, [visible]);
  const activeZ = Math.max(0, ...windows.filter(w => !w.minimized).map(w => w.zIndex));
  return <main className="desktop" ref={desktopRef} tabIndex={-1} aria-label="DongOS desktop" inert={!visible}>
    <div className="desktop-wallpaper" /><div className="wallpaper-shade" />
    <header className="os-topbar"><div className="os-brand"><span className="brand-symbol">Đ</span><strong>DongOS</strong><span className="topbar-separator" /><span className="workspace-label">Personal workspace</span></div><div className="topbar-center">A little space for big ideas.</div><div className="os-status"><button onClick={onBack} className="back-room"><ArrowUpLeft size={15} /><span>Back to room</span></button><button className="sound-control light-control" aria-label={lighting === 'day' ? 'Switch to night mode' : 'Switch to morning mode'} title={lighting === 'day' ? 'Morning light (click for Night)' : 'Night mode (click for Morning)'} onClick={toggleLighting}>{lighting === 'day' ? <Sun size={15} /> : <Moon size={15} />}</button><button className="sound-control" aria-label={sound ? 'Mute sounds' : 'Enable sounds'} onClick={() => setSound(!sound)}>{sound ? <Volume2 size={15} /> : <VolumeX size={15} />}</button><Wifi className="status-decoration" size={15} aria-label="Local workspace" /><BatteryFull className="status-decoration" size={18} /><time>{now?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) ?? '—:—'}</time></div></header>
    <div className="desktop-icons">{apps.filter(app => app.id !== 'settings').map(app => { const Icon = app.icon; return <button key={app.id} className="desktop-icon" onClick={() => { open(app.id); playOpenSound(); }}><span className={`app-icon ${app.color}`}><Icon strokeWidth={1.4} /></span><span>{app.title}</span></button>; })}</div>
    <div className="desktop-greeting"><span className="eyebrow">WELCOME TO MY CORNER OF THE INTERNET</span><h1>Make yourself<br /><em>at home.</em></h1><p>Explore a little. Open a window.<br />There’s a story behind every icon.</p><span className="desktop-signature">— {profile.name}</span></div>
    <aside className="desktop-note"><span className="note-pin" /><span className="eyebrow">A SMALL REMINDER</span><p>Stay curious.<br />Build something<br /><em>you care about.</em></p><span className="note-footer">one little idea at a time ↗</span></aside>
    <div className="desktop-bottom"><span><i /> All systems feeling good</span><span><Command size={12} /> Click an icon to explore <span className="desktop-build">DONGOS / 1.0</span></span></div>
    {windows.map(w => <WindowFrame key={w.id} window={w} active={!w.minimized && w.zIndex === activeZ} />)}
    <Taskbar />
  </main>;
}
