import { create } from 'zustand';
import type { ExperienceMode } from '@/types';
import { clampZoom, INTERACTION_ZOOM, MIN_ZOOM, ROOM_ZOOM, WELCOME_ZOOM } from '@/lib/roomZoom';
type ExperienceStore = {
  mode: ExperienceMode; ready: boolean; failed: boolean;
  zoom: number; monitorFocused: boolean;
  setReady: (ready: boolean) => void; setFailed: () => void;
  setMode: (mode: ExperienceMode) => void; setZoom: (zoom: number) => void;
  setMonitorFocused: (focused: boolean) => void;
  focusMonitor: () => void; backToRoom: () => void;
};
export const useExperienceStore = create<ExperienceStore>((set, get) => ({
  mode: 'welcome', ready: false, failed: false, zoom: WELCOME_ZOOM, monitorFocused: false,
  setReady: ready => set({ ready }),
  setFailed: () => set({ failed: true, monitorFocused: false }),
  setMode: mode => set({ mode, monitorFocused: false, zoom: mode === 'welcome' ? WELCOME_ZOOM : ROOM_ZOOM }),
  setZoom: value => {
    const zoom = clampZoom(value);
    set({ zoom, ...(zoom > INTERACTION_ZOOM ? { monitorFocused: false } : {}) });
  },
  setMonitorFocused: monitorFocused => {
    if (monitorFocused !== get().monitorFocused) set({ monitorFocused });
  },
  focusMonitor: () => set({ mode: 'room', zoom: MIN_ZOOM }),
  backToRoom: () => set({ mode: 'room', zoom: ROOM_ZOOM, monitorFocused: false }),
}));
