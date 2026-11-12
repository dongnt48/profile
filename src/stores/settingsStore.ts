import { create } from 'zustand';
  type Settings = {
    sound: boolean;
    reducedMotion: boolean;
    quality: 'low' | 'high';
    lighting: 'day' | 'night';
    setSound: (value: boolean) => void;
    setReducedMotion: (value: boolean) => void;
    setQuality: (value: 'low' | 'high') => void;
    setLighting: (value: 'day' | 'night') => void;
    toggleLighting: () => void;
  };
  function save(value: Partial<Settings>) {
  try {
    const previous = JSON.parse(localStorage.getItem('dongos-settings') || '{}');
    localStorage.setItem('dongos-settings', JSON.stringify({ ...previous, ...value }));
  } catch {
    /* Storage may be disabled. */
  }
}
export const useSettingsStore = create<Settings>((set, get) => ({
  sound: false,
  reducedMotion: false,
  quality: 'high',
  lighting: 'day',
  setSound: sound => { set({ sound }); save({ sound }); },
  setReducedMotion: reducedMotion => { set({ reducedMotion }); save({ reducedMotion }); },
  setQuality: quality => { set({ quality }); save({ quality }); },
  setLighting: lighting => { set({ lighting }); save({ lighting }); },
  toggleLighting: () => {
    const next = get().lighting === 'day' ? 'night' : 'day';
    set({ lighting: next });
    save({ lighting: next });
  },
}));
