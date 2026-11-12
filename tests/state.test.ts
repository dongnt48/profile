import { beforeEach, expect, test } from 'vitest';
import { useWindowStore, clampPosition } from '../src/stores/windowStore';
import { useExperienceStore } from '../src/stores/experienceStore';
import { parseCommand } from '../src/lib/terminal';

beforeEach(() => { useWindowStore.setState({ windows: [], nextZ: 1 }); useExperienceStore.setState({ mode: 'room', zoom: .72, monitorFocused: false }); });
test('reopening an app restores and focuses one instance', () => {
  const s = useWindowStore.getState(); s.open('about'); s.minimize('about'); s.open('projects'); s.open('about');
  const windows = useWindowStore.getState().windows;
  expect(windows).toHaveLength(2);
  expect(windows.find(w => w.id === 'about')?.minimized).toBe(false);
  expect(windows.find(w => w.id === 'about')!.zIndex).toBeGreaterThan(windows.find(w => w.id === 'projects')!.zIndex);
});
test('maximize preserves position and close removes only the chosen app', () => {
  const s = useWindowStore.getState(); s.open('about'); s.open('terminal'); s.move('about', { x: 130, y: 90 }); s.maximize('about'); s.maximize('about'); s.close('terminal');
  expect(useWindowStore.getState().windows).toHaveLength(1);
  expect(useWindowStore.getState().windows[0].position).toEqual({ x: 130, y: 90 });
  expect(useWindowStore.getState().windows[0].maximized).toBe(false);
});
test('dragged windows remain reachable after viewport shrinks', () => {
  expect(clampPosition({ x: 2000, y: -200 }, { width: 800, height: 600 })).toEqual({ x: 680, y: 52 });
});
test('focusing and zooming out keep the room mode and preserve apps', () => {
  const s = useExperienceStore.getState();
  useWindowStore.getState().open('about');
  s.focusMonitor();
  expect(useExperienceStore.getState()).toMatchObject({ mode: 'room', zoom: .25 });
  s.setMonitorFocused(true);
  s.setZoom(.5);
  expect(useExperienceStore.getState().monitorFocused).toBe(false);
  s.backToRoom();
  expect(useExperienceStore.getState()).toMatchObject({ mode: 'room', zoom: .72, monitorFocused: false });
  expect(useWindowStore.getState().windows).toHaveLength(1);
  s.setZoom(-100); expect(useExperienceStore.getState().zoom).toBe(.25);
  s.setZoom(100); expect(useExperienceStore.getState().zoom).toBe(1.25);
});
test('terminal normalizes commands and never evaluates arbitrary input', () => {
  expect(parseCommand('  PROJECTS  ')).toEqual({ type: 'open', app: 'projects' });
  expect(parseCommand('clear')).toEqual({ type: 'clear' });
  expect(parseCommand('alert(1)').type).toBe('unknown');
});
