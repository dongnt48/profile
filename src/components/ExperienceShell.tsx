'use client';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Monitor, Moon, MoveUpRight, Sun, Volume2, VolumeX } from 'lucide-react';
import { Desktop } from '@/components/os/Desktop';
import { useExperienceStore } from '@/stores/experienceStore';
import { useWindowStore } from '@/stores/windowStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLoadPreferences, useReducedMotion } from '@/hooks/usePreferences';
import { isAppId } from '@/lib/apps';
const RoomScene = dynamic(() => import('./scene/RoomScene'), {
  ssr: false,
  loading: () => (
    <div className="model-progress boot-loader" role="status">
      <div className="boot-loader-card">
        <div className="boot-loader-badge"><span className="brand-symbol">Đ</span></div>
        <div className="boot-loader-brand"><strong>Đông</strong><span> / workspace</span></div>
        <p className="boot-loader-label">Đang khởi tạo không gian 3D…</p>
        <div className="boot-loader-bar-wrap"><div className="boot-loader-bar-fill" style={{ width: '8%' }} /></div>
        <div className="boot-loader-meta"><span>Preparing your workspace</span><strong>8%</strong></div>
      </div>
    </div>
  ),
});
function Experience() {
  const pathname = usePathname(); const search = useSearchParams(); const router = useRouter();
  const { mode, ready, failed, monitorFocused, setMode, focusMonitor, backToRoom: zoomOut } = useExperienceStore();
  const [loadRoom, setLoadRoom] = useState(pathname !== '/os' && pathname !== '/os/');
  const { sound, lighting, setSound, toggleLighting } = useSettingsStore(); const reduced = useReducedMotion();
  const previousPath = useRef<string | null>(null);
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
  useEffect(() => {
    const isOS = pathname.startsWith('/os');
    if (isOS) { setMode('os'); const app = search.get('app'); if (isAppId(app)) useWindowStore.getState().open(app); }
    else { setLoadRoom(true); if (previousPath.current !== null && previousPath.current.startsWith('/os')) setMode('room'); else if (previousPath.current === null) setMode('welcome'); }
    previousPath.current = pathname;
  }, [pathname, search, setMode]);
  function openComputer() { if (failed) { setMode('os'); router.push('/os', { scroll: false }); } else focusMonitor(); }
  function backToRoom() { setLoadRoom(true); zoomOut(); if (pathname !== '/') router.push('/', { scroll: false }); }
  const inMonitor = loadRoom && !failed;
  const pageReady = !loadRoom || ready || failed;
  const showOS = mode === 'os'; const showWelcome = mode === 'welcome';
  const hideRoomLayer = showOS && !inMonitor;
  const osInteractive = inMonitor ? ready && monitorFocused : showOS;
  const screenVisible = inMonitor ? ready : showOS;
    return <div data-monitor-light="passive" className={`experience mode-${mode} lighting-${lighting} ${inMonitor ? 'in-monitor-mode' : ''} ${monitorFocused ? 'monitor-focused' : ''} ${pageReady ? 'page-ready' : 'page-loading'} ${reduced ? 'reduce-motion' : ''}`}>
      <div className="room-layer" aria-hidden={hideRoomLayer} inert={hideRoomLayer}>
        {loadRoom && <RoomScene onEnter={openComputer} />}
        <header className="room-header"><a href="/" aria-label="DongOS home" className="room-brand"><span className="brand-symbol">Đ</span><strong>Đông<span> / workspace</span></strong></a><span className="room-header-middle">A PERSONAL SPACE ON THE INTERNET</span><button className="text-button" onClick={openComputer}>Open profile <ArrowUpRight size={16} /></button></header>
        <div className={`welcome-copy ${showWelcome ? '' : 'room-copy'}`}><div className="eyebrow"><span className="live-dot" /> {showWelcome ? 'COME ON IN. MAKE YOURSELF AT HOME.' : 'THE WORKSPACE / 01'}</div><h1>{showWelcome ? <>Good things<br />start in a<br /><em>little space.</em></> : <>A place to<br /><em>make things.</em></>}</h1><p>A desk. A few ideas. A world of possibilities.<br />Welcome to my corner of the internet.</p>{showWelcome ? <><button className="primary-button room-cta" onClick={() => setMode('room')}>Enter My Workspace <ArrowRight size={19} /></button><button className="skip-button" onClick={openComputer}>Or, zoom straight to the screen <ArrowUpRight size={14} /></button></> : <button className="primary-button room-cta" onClick={openComputer}>Zoom to screen <Monitor size={18} /></button>}</div>
        {!showWelcome && <div className="monitor-hint"><MoveUpRight size={20} /><span>Your next rabbit hole.<br /><strong>Zoom in to use the screen.</strong></span></div>}
        <div className="room-index"><span>01 — THE WORKSPACE</span><span>Designed for a slower kind of browsing.</span></div>
        <footer className="room-footer"><span><span className="live-dot" /> Built with care & a little curiosity.</span><span className="room-scroll"><ArrowDownRight size={15} /> Scroll to zoom · Click screen to focus</span><div className="room-footer-actions"><button className="sound-pill light-pill" onClick={toggleLighting}>{lighting === 'day' ? <Sun size={16} /> : <Moon size={16} />} {lighting === 'day' ? 'Morning' : 'Night'}</button><button className="sound-pill" onClick={() => setSound(!sound)}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />} Sound {sound ? 'on' : 'off'}</button></div></footer>
      </div>
      <div id="os-monitor-layer" className={`os-layer ${inMonitor ? 'in-monitor' : ''} ${screenVisible ? 'visible' : ''}`} aria-hidden={!osInteractive}><Desktop visible={osInteractive} onBack={backToRoom} /></div>
    </div>;
}
    export function ExperienceShell() { return <Suspense fallback={<div className="boot-screen">Đ<span>Opening your workspace…</span><a href="/os/">Open profile</a></div>}><Experience /></Suspense>; }
