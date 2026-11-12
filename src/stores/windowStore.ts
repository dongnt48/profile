import { create } from 'zustand';
import type { AppId, DesktopWindow, Position, WindowId } from '@/types';
export function clampPosition(position: Position, viewport: { width: number; height: number }): Position {
  return { x: Math.max(0, Math.min(position.x, Math.max(0, viewport.width - 120))), y: Math.max(52, Math.min(position.y, Math.max(52, viewport.height - 130))) };
}
type WindowStore = {
  windows: DesktopWindow[]; nextZ: number;
  open: (appId: AppId) => void; openProject: (projectId: string, title: string) => void;
  focus: (id: WindowId) => void; minimize: (id: WindowId) => void; maximize: (id: WindowId) => void; close: (id: WindowId) => void; move: (id: WindowId, position: Position) => void;
};
export const useWindowStore = create<WindowStore>((set, get) => {
  function openWindow(id: WindowId, appId: AppId, title?: string) {
    const { windows, nextZ } = get();
    if (windows.some(w => w.id === id)) { set({ windows: windows.map(w => w.id === id ? { ...w, minimized: false, zIndex: nextZ } : w), nextZ: nextZ + 1 }); return; }
    const monitorEl = typeof document !== 'undefined' ? document.querySelector<HTMLElement>('.os-layer.in-monitor .desktop') : null;
    const width = monitorEl ? monitorEl.clientWidth || 1600 : typeof window !== 'undefined' ? window.innerWidth : 1440;
    const offset = (windows.length % 5) * 26;
    const baseTop = monitorEl ? 62 : 88;
    set({ windows: [...windows, { id, appId, title, minimized: false, maximized: false, zIndex: nextZ, position: { x: Math.max(24, (width - 760) / 2 + offset), y: baseTop + offset } }], nextZ: nextZ + 1 });
  }
  return {
    windows: [], nextZ: 1,
    open: appId => openWindow(appId, appId),
    openProject: (id, title) => openWindow(`project:${id}`, 'projects', title),
    focus: id => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, zIndex: s.nextZ } : w), nextZ: s.nextZ + 1 })),
    minimize: id => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, minimized: true } : w) })),
    maximize: id => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, maximized: !w.maximized, zIndex: s.nextZ } : w), nextZ: s.nextZ + 1 })),
    close: id => set(s => ({ windows: s.windows.filter(w => w.id !== id) })),
    move: (id, position) => set(s => ({ windows: s.windows.map(w => w.id === id ? { ...w, position } : w) })),
  };
});
