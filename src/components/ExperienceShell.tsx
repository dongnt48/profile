'use client';
import { useTranslation } from '@/lib/i18n';
import { usePathname } from 'next/navigation';
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCompactViewport } from '@/hooks/useCompactViewport';
import { RoomLoader } from './RoomLoader';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BrandMark } from './BrandMark';
import { getProfile } from '@/data/profile';
import { Desktop } from '@/components/os/Desktop';
import { useExperienceStore } from '@/stores/experienceStore';
import { useWindowStore } from '@/stores/windowStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLoadPreferences, useReducedMotion } from '@/hooks/usePreferences';
const RoomScene = lazy(() => import('./scene/RoomScene'));
function Experience() {
  const { language } = useTranslation();
  const profile = getProfile(language);
  const compact = useCompactViewport();
  const pathname = usePathname();
  const { mode, ready, failed, monitorFocused, setMode, focusMonitor } = useExperienceStore();
  const lighting = useSettingsStore(s => s.lighting); const reduced = useReducedMotion();
  const seededDefaultWindows = useRef(false);
  const wasCompact = useRef(false);
  const [revealed, setRevealed] = useState(false);
  useLoadPreferences();
  useEffect(() => {
    if (compact) { wasCompact.current = true; return; }
    // Keep the active section when resizing a direct profile into the desktop room.
    if (compact === false && (wasCompact.current || mode === 'os') && !failed) {
      wasCompact.current = false;
      focusMonitor();
    }
  }, [compact, mode, failed, focusMonitor]);
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
  useLayoutEffect(() => {
    if (compact === null) return;
    if (compact) {
      if (useWindowStore.getState().windows.length === 0) useWindowStore.getState().open('about');
      return;
    }
    if (!ready || failed) return;
    if (!seededDefaultWindows.current && pathname === '/' && useWindowStore.getState().windows.length === 0) {
      seededDefaultWindows.current = true;
      useWindowStore.getState().open('about');
    } else {
      seededDefaultWindows.current = true;
    }
  }, [compact, pathname, ready, failed]);
  function openComputer() { if (failed) setMode('os'); else focusMonitor(); }
  const reading = compact === true;
  const inMonitor = !failed && !reading;
  const pageReady = reading || failed || revealed;
  const showOS = mode === 'os';
  const hideRoomLayer = reading || (showOS && !inMonitor);
  const osInteractive = reading || (inMonitor ? ready && monitorFocused : showOS);
  const screenVisible = reading || (inMonitor ? pageReady : showOS);
  if (compact === null) return <div className="profile-start" aria-busy="true"><BrandMark /></div>;
    return <div data-monitor-light="passive" className={`experience mode-${mode} lighting-${lighting} ${reading ? 'reading-mode' : ''} ${inMonitor ? 'in-monitor-mode' : ''} ${monitorFocused ? 'monitor-focused' : ''} ${pageReady ? 'page-ready' : 'page-loading'} ${reduced ? 'reduce-motion' : ''}`}>
      {reading && <header className="reading-toolbar"><div className="reading-identity"><BrandMark /><strong>Đông</strong></div></header>}
      <LanguageSwitcher />{!reading && <div className="room-layer" aria-hidden={hideRoomLayer} inert={hideRoomLayer}>
        <Suspense fallback={<RoomLoader />}><RoomScene onEnter={openComputer} /></Suspense>
        <header className="room-header" style={{ justifyContent: 'center' }}><span className="room-header-middle">{profile.role}</span></header>
      </div>}
      <div id="os-monitor-layer" className={`os-layer ${inMonitor ? 'in-monitor' : ''} ${screenVisible ? 'visible' : ''}`} aria-hidden={!osInteractive}><Desktop visible={osInteractive} animateContent={reading && !reduced} /></div>
    </div>;
}
export function ExperienceShell() { const pathname = usePathname(); return pathname === '/' ? <Experience /> : null; }
