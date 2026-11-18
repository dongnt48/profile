'use client';
import { useTranslation } from '@/lib/i18n';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, Volume2, VolumeX } from 'lucide-react';
import { RoomLoader } from './RoomLoader';
import { LanguageSwitcher } from './LanguageSwitcher';
import { getProfile } from '@/data/profile';
import { Desktop } from '@/components/os/Desktop';
import { useExperienceStore } from '@/stores/experienceStore';
import { useWindowStore } from '@/stores/windowStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLoadPreferences, useReducedMotion } from '@/hooks/usePreferences';
const RoomScene = dynamic(() => import('./scene/RoomScene'), {
  ssr: false,
  loading: () => <RoomLoader />,
});
function Experience() {
  const { language, t } = useTranslation();
  const profile = getProfile(language);
  const pathname = usePathname();
  const { mode, ready, failed, monitorFocused, setMode, focusMonitor } = useExperienceStore();
  const { sound, lighting, setSound } = useSettingsStore(); const reduced = useReducedMotion();
  const seededDefaultWindows = useRef(false);
  const [revealed, setRevealed] = useState(false);
  useLoadPreferences();
  useEffect(() => {
    if (!ready) {
      setRevealed(false);
      return;
    }
    if (reduced) {
      setRevealed(true);
      return;
    }
    const timer = setTimeout(() => setRevealed(true), 220);
    return () => clearTimeout(timer);
  }, [ready, reduced]);
  useEffect(() => {
    if (!ready || failed) return;
    if (!seededDefaultWindows.current && pathname === '/' && useWindowStore.getState().windows.length === 0) {
      seededDefaultWindows.current = true;
      useWindowStore.getState().open('projects');
      useWindowStore.getState().open('about');
    } else {
      seededDefaultWindows.current = true;
    }
  }, [pathname, ready, failed]);
  function openComputer() { if (failed) setMode('os'); else focusMonitor(); }
  const inMonitor = !failed;
  const pageReady = failed || revealed;
  const showOS = mode === 'os';
  const hideRoomLayer = showOS && !inMonitor;
  const osInteractive = inMonitor ? ready && monitorFocused : showOS;
  const screenVisible = inMonitor ? pageReady : showOS;
    return <div data-monitor-light="passive" className={`experience mode-${mode} lighting-${lighting} ${inMonitor ? 'in-monitor-mode' : ''} ${monitorFocused ? 'monitor-focused' : ''} ${pageReady ? 'page-ready' : 'page-loading'} ${reduced ? 'reduce-motion' : ''}`}>
      <LanguageSwitcher /><div className="room-layer" aria-hidden={hideRoomLayer} inert={hideRoomLayer}>
        <RoomScene onEnter={openComputer} />
        <header className="room-header" style={{ justifyContent: 'center' }}><span className="room-header-middle">{profile.role}</span></header>
        <footer className="room-footer"><span><span className="live-dot" /> {profile.email}</span><span className="room-scroll"><ArrowDownRight size={15} /> {t("Scroll to zoom · Click screen to focus")}</span><div className="room-footer-actions"><button className="sound-pill" onClick={() => setSound(!sound)}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />} {t('Sound')} {sound ? t('on') : t('off')}</button></div></footer>
      </div>
      <div id="os-monitor-layer" className={`os-layer ${inMonitor ? 'in-monitor' : ''} ${screenVisible ? 'visible' : ''}`} aria-hidden={!osInteractive}><Desktop visible={osInteractive} /></div>
    </div>;
}
export function ExperienceShell() { const pathname = usePathname(); return pathname === '/' ? <Experience /> : null; }
