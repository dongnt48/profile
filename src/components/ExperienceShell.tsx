'use client';
import { useTranslation } from '@/lib/i18n';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Monitor, Moon, MoveUpRight, Sun, Volume2, VolumeX } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { getProfile } from '@/data/profile';
import { Desktop } from '@/components/os/Desktop';
import { useExperienceStore } from '@/stores/experienceStore';
import { useWindowStore } from '@/stores/windowStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLoadPreferences, useReducedMotion } from '@/hooks/usePreferences';
const RoomScene = dynamic(() => import('./scene/RoomScene'), {
  ssr: false,
  loading: function RoomLoading() { const { t } = useTranslation(); return (
    <div className="model-progress boot-loader" role="status">
      <div className="boot-loader-card">
        <div className="boot-loader-badge"><span className="brand-symbol">Đ</span></div>
        <div className="boot-loader-brand"><strong>Đông</strong><span> / workspace</span></div>
        <p className="boot-loader-label">{t('Preparing your workspace…')}</p>
        <div className="boot-loader-bar-wrap"><div className="boot-loader-bar-fill" style={{ width: '8%' }} /></div>
        <div className="boot-loader-meta"><span>{t("Preparing your workspace")}</span><strong>8%</strong></div>
      </div>
    </div>
  ); },
});
function Experience() {
  const { language, t } = useTranslation();
  const profile = getProfile(language);
  const pathname = usePathname();
  const { mode, ready, failed, monitorFocused, setMode, focusMonitor, backToRoom: zoomOut } = useExperienceStore();
  const { sound, lighting, setSound, toggleLighting } = useSettingsStore(); const reduced = useReducedMotion();
  const seededDefaultWindows = useRef(false);
  useLoadPreferences();
  useEffect(() => {
    if (!seededDefaultWindows.current && pathname === '/' && useWindowStore.getState().windows.length === 0) {
      seededDefaultWindows.current = true;
      useWindowStore.getState().open('projects');
      useWindowStore.getState().open('about');
    } else {
      seededDefaultWindows.current = true;
    }
  }, [pathname]);
  function openComputer() { if (failed) setMode('os'); else focusMonitor(); }
  function backToRoom() { zoomOut(); }
  const inMonitor = !failed;
  const pageReady = ready || failed;
  const showOS = mode === 'os'; const showWelcome = mode === 'welcome';
  const hideRoomLayer = showOS && !inMonitor;
  const osInteractive = inMonitor ? ready && monitorFocused : showOS;
  const screenVisible = inMonitor ? ready : showOS;
    return <div data-monitor-light="passive" className={`experience mode-${mode} lighting-${lighting} ${inMonitor ? 'in-monitor-mode' : ''} ${monitorFocused ? 'monitor-focused' : ''} ${pageReady ? 'page-ready' : 'page-loading'} ${reduced ? 'reduce-motion' : ''}`}>
      <LanguageSwitcher /><div className="room-layer" aria-hidden={hideRoomLayer} inert={hideRoomLayer}>
        <RoomScene onEnter={openComputer} />
        <header className="room-header"><a href="/" aria-label="DongOS home" className="room-brand"><span className="brand-symbol">Đ</span><strong>Đông<span> / workspace</span></strong></a><span className="room-header-middle">{profile.role}</span><button className="text-button" onClick={openComputer}>{t("Open profile")} <ArrowUpRight size={16} /></button></header>
        <div className={`welcome-copy ${showWelcome ? '' : 'room-copy'}`}><div className="eyebrow"><span className="live-dot" /> {profile.role}</div><h1>Nguyễn Thanh<br /><em>Đông</em></h1><p>{profile.location}<br />{profile.availability}</p>{showWelcome ? <><button className="primary-button room-cta" onClick={() => setMode('room')}>{t("Enter My Workspace")} <ArrowRight size={19} /></button><button className="skip-button" onClick={openComputer}>{t("Or, zoom straight to the screen")} <ArrowUpRight size={14} /></button></> : <button className="primary-button room-cta" onClick={openComputer}>{t("Zoom to screen")} <Monitor size={18} /></button>}</div>
        {!showWelcome && <div className="monitor-hint"><MoveUpRight size={20} /><span>{t("Open profile")}<br /><strong>{t("Zoom in to use the screen.")}</strong></span></div>}
        <div className="room-index"><span>{profile.name}</span><span>{profile.role}</span></div>
        <footer className="room-footer"><span><span className="live-dot" /> {profile.email}</span><span className="room-scroll"><ArrowDownRight size={15} /> {t("Scroll to zoom · Click screen to focus")}</span><div className="room-footer-actions"><button className="sound-pill light-pill" onClick={toggleLighting}>{lighting === 'day' ? <Sun size={16} /> : <Moon size={16} />} {lighting === 'day' ? t('Morning') : t('Night')}</button><button className="sound-pill" onClick={() => setSound(!sound)}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />} {t('Sound')} {sound ? t('on') : t('off')}</button></div></footer>
      </div>
      <div id="os-monitor-layer" className={`os-layer ${inMonitor ? 'in-monitor' : ''} ${screenVisible ? 'visible' : ''}`} aria-hidden={!osInteractive}><Desktop visible={osInteractive} onBack={backToRoom} /></div>
    </div>;
}
export function ExperienceShell() { const pathname = usePathname(); return pathname === '/' ? <Experience /> : null; }
