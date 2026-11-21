'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, PerspectiveCamera, type Camera } from 'three';
import { useExperienceStore } from '@/stores/experienceStore';
import { useReducedMotion } from '@/hooks/usePreferences';
import { scaleProjectionForLayout } from '@/lib/monitorProjection';

import { WELCOME_ZOOM, MIN_ZOOM, INTERACTION_ZOOM, monitorFieldOfView } from '@/lib/roomZoom';

const BASE_POS = new Vector3(-7.8, 6.1, 8.6);

// MonitorScreen in Blender: center (0.1, 0.985, 1.66), size (1.49, 0.012, 0.66)
// Three.js world space: X = [-0.645, 0.845], Y = [1.33, 1.99], Z = -0.979
const MONITOR_CORNERS = [
  new Vector3(-0.645, 1.99, -0.979), // Top-Left
  new Vector3(0.845, 1.99, -0.979),  // Top-Right
  new Vector3(0.845, 1.33, -0.979),  // Bottom-Right
  new Vector3(-0.645, 1.33, -0.979), // Bottom-Left
];
const SCREEN_W = 1600;
const SCREEN_H = 709;

function updateMonitorProjection(camera: Camera, domElement: HTMLCanvasElement, layoutScale: number) {
  const el = document.getElementById('os-monitor-layer');
  if (!el || !el.classList.contains('in-monitor')) {
    if (el) { el.style.transform = ''; el.style.zoom = ''; }
    return;
  }
  const rect = domElement.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const pts = MONITOR_CORNERS.map(corner => {
    const v = corner.clone().project(camera);
    return {
      x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
    };
  });
  const [p0, p1, p2, p3] = pts;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const sx = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const sy = p0.y - p1.y + p2.y - p3.y;
  const det = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(det) < 1e-6) return;

  // Once front-facing, use an affine matrix instead of tiny perspective terms.
  // This avoids unstable compositing of the HTML plane at the end of the zoom.
  const affine = Math.abs(sx) + Math.abs(sy) < .25;
  const g = affine ? 0 : (sx * dy2 - dx2 * sy) / det;
  const h = affine ? 0 : (dx1 * sy - sx * dy1) / det;
  const a = p1.x - p0.x + g * p1.x;
  const b = p3.x - p0.x + h * p3.x;
  const c = p0.x;
  const d = p1.y - p0.y + g * p1.y;
  const e = p3.y - p0.y + h * p3.y;
  const f = p0.y;

  const m = [
    a / SCREEN_W, d / SCREEN_W, 0, g / SCREEN_W,
    b / SCREEN_H, e / SCREEN_H, 0, h / SCREEN_H,
    0, 0, 1, 0,
    c, f, 0, 1,
  ];
  // Keep layout resolution constant for the whole camera journey. Changing CSS
  // zoom per frame forces layout/paint of every window and stalls WebGL frames.
  if (el.style.zoom !== String(layoutScale)) el.style.zoom = String(layoutScale);
  if (affine && Math.abs(b) < .25 && Math.abs(d) < .25) {
    const scale = layoutScale;
    const pixelRatio = window.devicePixelRatio || 1;
    const x = Math.round(c * pixelRatio) / pixelRatio;
    const y = Math.round(f * pixelRatio) / pixelRatio;
    const scaleX = a / (SCREEN_W * scale);
    const scaleY = e / (SCREEN_H * scale);
    el.style.transform = `matrix(${scaleX}, 0, 0, ${scaleY}, ${x / scale}, ${y / scale})`;
    el.dataset.textRendering = 'native';
    return;
  }
  el.dataset.textRendering = 'projected';
  el.style.transform = `matrix3d(${scaleProjectionForLayout(m, layoutScale).join(',')})`;
}

export function CameraController() {
  const { camera, gl, size } = useThree();
  const reduced = useReducedMotion();
  const zoomCurrent = useRef(WELCOME_ZOOM * 1.08);
  const currentLook = useRef(new Vector3(-1.32, 1.12, 0));
  const pointer = useRef({ x: 0, y: 0 });
  const drag = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const pinch = useRef<number | null>(null);
  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (useExperienceStore.getState().monitorFocused || (e.target as HTMLElement)?.closest('button, a, input, select, .os-layer')) return;
      dragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      pointer.current = { x: e.clientX / innerWidth * 2 - 1, y: e.clientY / innerHeight * 2 - 1 };
      if (!dragging.current || useExperienceStore.getState().monitorFocused) return;
      drag.current.x = Math.max(-1.8, Math.min(1.8, drag.current.x - (e.clientX - lastPointer.current.x) / innerWidth * 3.2));
      drag.current.y = Math.max(-1.2, Math.min(1.2, drag.current.y + (e.clientY - lastPointer.current.y) / innerHeight * 2.4));
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => { dragging.current = false; };
    const wheel = (e: WheelEvent) => {
      // App content keeps its own scrolling, including at a scroll boundary.
      if ((e.target as HTMLElement)?.closest('.window-body, .reading-mode .os-layer')) return;
      const state = useExperienceStore.getState();
      if (state.mode === 'os') return;
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      state.setZoom(state.zoom + delta * .0007);
    };
    const touchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.closest('.reading-mode .os-layer')) return;
      if (e.touches.length !== 2) return;
      dragging.current = false;
      pinch.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    };
    const touchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinch.current === null) return;
      e.preventDefault();
      const distance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const state = useExperienceStore.getState();
      state.setZoom(state.zoom + (pinch.current - distance) * .003);
      pinch.current = distance;
    };
    const touchEnd = () => { pinch.current = null; dragging.current = false; };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented && useExperienceStore.getState().monitorFocused) useExperienceStore.getState().backToRoom();
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('wheel', wheel, { passive: true });
    window.addEventListener('touchstart', touchStart, { passive: true });
    window.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('touchend', touchEnd);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('touchend', touchEnd);
      window.removeEventListener('keydown', key);
    };
  }, []);
  useFrame((_, delta) => {
    const state = useExperienceStore.getState();
    if (state.mode === 'os') return;
    const damp = reduced ? 1 : 1 - Math.exp(-delta * 7);
    const targetZoom = state.ready || reduced ? state.zoom : WELCOME_ZOOM * 1.08;
    zoomCurrent.current += (targetZoom - zoomCurrent.current) * damp;
    const zoom = zoomCurrent.current;
    const closeup = Math.max(0, Math.min(1, (WELCOME_ZOOM - zoom) / (WELCOME_ZOOM - MIN_ZOOM)));
    const frontBlend = Math.pow(closeup, 1.35);
    const mobile = size.width < 700;
    const welcome = state.mode === 'welcome';
    const aspect = size.width / Math.max(1, size.height);
    const distance = mobile ? 1.48 : Math.max(1.48, 2.52 / Math.max(1.2, aspect));
    const nearFov = monitorFieldOfView(distance, aspect);
    // Rasterize once at the final screen size, even while viewing it from afar.
    const layoutScale = 1.49 * size.height / (2 * distance * Math.tan(nearFov * Math.PI / 360) * SCREEN_W);
    if (camera instanceof PerspectiveCamera) {
      // Magnify the screen optically; preserve the existing camera path and chair clearance.
      camera.fov += (35 + (nearFov - 35) * frontBlend - camera.fov) * damp;
      camera.updateProjectionMatrix();
    }
    const front = new Vector3(.1, 1.66, -.979 + distance);
    const monitor = new Vector3(.1, 1.66, -.979);
    const base = BASE_POS.clone().multiplyScalar((mobile ? 1.15 : 1) * zoom);
    const offsetScale = 1 - frontBlend;
    const parallax = reduced ? 0 : .22 * Math.max(0, 1 - closeup * 1.35);
    const target = base.lerp(front, frontBlend);
    target.x += (pointer.current.x * parallax + drag.current.x * .6) * offsetScale;
    target.y += (-pointer.current.y * parallax * .65 + drag.current.y * .6) * offsetScale;
    const look = new Vector3(mobile ? 0 : welcome ? -1.32 : -.85, welcome ? 1.12 : 1.2, welcome ? 0 : -.15).lerp(monitor, frontBlend);
    look.x += drag.current.x * offsetScale;
    look.y += drag.current.y * offsetScale;
    camera.position.lerp(target, damp);
    currentLook.current.lerp(look, damp);
    camera.lookAt(currentLook.current);
    camera.updateMatrixWorld();
    updateMonitorProjection(camera, gl.domElement, layoutScale);
    // Camera-owned attributes survive React updates to the shell's className.
    const shell = document.querySelector<HTMLElement>('.experience');
    const roomCloseup = String(closeup > .45);
    if (shell && shell.dataset.roomCloseup !== roomCloseup) {
      shell.dataset.roomCloseup = roomCloseup;
    }
    const focused = state.zoom <= INTERACTION_ZOOM && closeup > .97
      && camera.position.distanceTo(front) < .025 && currentLook.current.distanceTo(monitor) < .015;
    state.setMonitorFocused(focused);
    if (focused) { dragging.current = false; drag.current = { x: 0, y: 0 }; }
  });
  return null;
}
