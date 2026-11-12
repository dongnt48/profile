'use client';
import { useEffect, useRef } from 'react';
import { Minus, Maximize2, Minimize2, X } from 'lucide-react';
import type { DesktopWindow } from '@/types';
import { getApp } from '@/lib/apps';
import { clampPosition, useWindowStore } from '@/stores/windowStore';
import { AppContent } from '@/components/apps/AppContent';
export function WindowFrame({ window: w, active }: { window: DesktopWindow; active: boolean }) {
  const { focus, close, minimize, maximize, move } = useWindowStore();
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const app = getApp(w.appId); const Icon = app.icon;
  const getViewport = () => {
    const parent = ref.current?.parentElement;
    if (parent && parent.closest('.in-monitor')) {
      return { width: parent.clientWidth || 1600, height: parent.clientHeight || 709 };
    }
    return { width: innerWidth, height: innerHeight };
  };
  useEffect(() => { if (active && !w.minimized) ref.current?.focus({ preventScroll: true }); }, [active, w.minimized]);
  useEffect(() => { const resize = () => { const current = useWindowStore.getState().windows.find(item => item.id === w.id); if (current) move(w.id, clampPosition(current.position, getViewport())); }; resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, [w.id, move]);
  return <section ref={ref} role="dialog" aria-label={w.title || app.title} tabIndex={-1} hidden={w.minimized} data-window={w.id} className={`os-window ${active ? 'active' : ''} ${w.maximized ? 'maximized' : ''} ${w.appId === 'terminal' ? 'terminal-window' : ''}`} style={{ left: w.position.x, top: w.position.y, zIndex: 20 + w.zIndex }} onPointerDown={() => { if (!active) focus(w.id); }} onFocus={() => { if (!active) focus(w.id); }} onKeyDown={e => { if (e.key === 'Escape' && !e.defaultPrevented) { e.preventDefault(); minimize(w.id); document.querySelector<HTMLButtonElement>(`[data-dock="${w.appId}"]`)?.focus(); } }}>
    <header className="window-titlebar" onDoubleClick={() => maximize(w.id)} onPointerDown={e => { const inMonitor = Boolean(ref.current?.closest('.in-monitor')); if ((e.target as HTMLElement).closest('button') || w.maximized || (!inMonitor && matchMedia('(max-width: 700px)').matches)) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, startX: w.position.x, startY: w.position.y }; }} onPointerMove={e => { if (!drag.current) return; const parent = ref.current?.parentElement; const rect = parent?.getBoundingClientRect(); const scaleX = parent && rect && rect.width > 0 ? parent.clientWidth / rect.width : 1; const scaleY = parent && rect && rect.height > 0 ? parent.clientHeight / rect.height : 1; move(w.id, clampPosition({ x: drag.current.startX + (e.clientX - drag.current.x) * scaleX, y: drag.current.startY + (e.clientY - drag.current.y) * scaleY }, getViewport())); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <div className="window-title"><Icon size={16} /><span>{w.title || app.title}</span></div>
      <button className="move-window" aria-label="Move window with arrow keys" title="Use arrow keys to move" onKeyDown={e => { const delta = 24; if (!e.key.startsWith('Arrow') || w.maximized) return; e.preventDefault(); move(w.id, clampPosition({ x: w.position.x + (e.key === 'ArrowRight' ? delta : e.key === 'ArrowLeft' ? -delta : 0), y: w.position.y + (e.key === 'ArrowDown' ? delta : e.key === 'ArrowUp' ? -delta : 0) }, getViewport())); }}>⠿</button>
      <div className="window-controls"><button aria-label={`Minimize ${w.title || app.title}`} onClick={() => minimize(w.id)}><Minus size={15} /></button><button className="maximize-control" aria-label={`Maximize ${w.title || app.title}`} onClick={() => maximize(w.id)}>{w.maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button><button aria-label={`Close ${w.title || app.title}`} onClick={() => { close(w.id); document.querySelector<HTMLButtonElement>(`[data-dock="${w.appId}"]`)?.focus(); }}><X size={16} /></button></div>
    </header><div className="window-body"><AppContent window={w} /></div>
  </section>;
}
