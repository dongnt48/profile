'use client';
import { apps } from '@/lib/apps';
import { useWindowStore } from '@/stores/windowStore';
import { playOpenSound } from '@/lib/sound';
export function Taskbar() {
  const windows = useWindowStore(s => s.windows); const open = useWindowStore(s => s.open);
  return <nav className="dock" aria-label="Application dock">{apps.map(app => { const Icon = app.icon; const running = windows.some(w => w.appId === app.id); return <button key={app.id} data-dock={app.id} aria-label={`Open ${app.title}`} className={`dock-item ${app.color} ${running ? 'running' : ''}`} onClick={() => { open(app.id); playOpenSound(); }}><Icon strokeWidth={1.5} /><span className="dock-tooltip">{app.title}</span><i /></button>; })}<span className="dock-divider" /><span className="dock-mark" aria-hidden="true">Đ</span></nav>;
}
