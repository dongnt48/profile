'use client';
import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
export function useReducedMotion() {
  const preference = useSettingsStore(s => s.reducedMotion); const [system, setSystem] = useState(false);
  useEffect(() => { const media = matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setSystem(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  return system || preference;
}
export function useLoadPreferences() {
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem('dongos-settings') || '{}');
      useSettingsStore.setState({
        sound: value.sound === true,
        reducedMotion: value.reducedMotion === true,
        quality: value.quality === 'low' ? 'low' : 'high',
        lighting: value.lighting === 'night' ? 'night' : 'day',
      });
    } catch {
      /* Use defaults when storage is unavailable. */
    }
  }, []);
}
