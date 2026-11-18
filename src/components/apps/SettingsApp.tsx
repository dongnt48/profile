'use client';
import { useTranslation } from '@/lib/i18n';
import { Volume2, Accessibility, Monitor } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
export function SettingsApp() {
  const { t } = useTranslation();
  const { sound, reducedMotion, quality, setSound, setReducedMotion, setQuality } = useSettingsStore();
  return <div className="app-padding"><h1>{t("Settings")}</h1><div className="settings-list"><div><Volume2 /><span><strong>{t("Interface sounds")}</strong><small>{t("A soft tone when you open an app. Off by default.")}</small></span><button className="switch" role="switch" aria-label={t("Interface sounds")} aria-checked={sound} onClick={() => setSound(!sound)}><i /></button></div><div><Accessibility /><span><strong>{t("Reduce motion")}</strong><small>{t("Skip camera travel and decorative animation.")}</small></span><button className="switch" role="switch" aria-label={t("Reduce motion")} aria-checked={reducedMotion} onClick={() => setReducedMotion(!reducedMotion)}><i /></button></div><div><Monitor /><span><strong>{t("Room quality")}</strong><small>{t("Low uses fewer pixels and disables shadows.")}</small></span><select aria-label={t("Room quality")} value={quality} onChange={e => setQuality(e.target.value as 'low' | 'high')}><option value="high">{t("High")}</option><option value="low">{t("Low")}</option></select></div></div><p className="sample-note">{t("Motion also follows your system accessibility preference. Settings are saved on this device.")}</p><div className="system-info"><strong>DongOS</strong><span>{t("Personal workspace")} · 1.0</span></div></div>;
}
