import { useSettingsStore } from '@/stores/settingsStore';
let context: AudioContext | undefined;
export function playOpenSound() {
  if (!useSettingsStore.getState().sound) return;
  try { context ??= new AudioContext(); void context.resume(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(520, context.currentTime); oscillator.frequency.exponentialRampToValueAtTime(780, context.currentTime + 0.09); gain.gain.setValueAtTime(0.025, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.14); oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.15); } catch { /* Sound is optional. */ }
}
