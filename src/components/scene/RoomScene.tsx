'use client';
import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { AgXToneMapping, Object3D, PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useExperienceStore } from '@/stores/experienceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { RoomModel } from './RoomModel';
import { CameraController } from './CameraController';

class SceneBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch() { useExperienceStore.getState().setFailed(); }
  render() { return this.state.error ? <Fallback /> : this.props.children; }
}

function Fallback() {
  return (
    <div className="scene-fallback">
      <img src="/images/room-preview.png" alt="Phòng làm việc 3D với bể cá và bàn máy tính" />
      <p>3D isn’t available here. Your profile is one click away.</p>
      <a href="/os/">Open Profile →</a>
    </div>
  );
}

function LoadingProgress() {
  const { progress, active } = useProgress();
  const ready = useExperienceStore(s => s.ready);
  const failed = useExperienceStore(s => s.failed);
  const [displayProgress, setDisplayProgress] = useState(8);

  useEffect(() => {
    if (ready) {
      setDisplayProgress(100);
      return;
    }
    setDisplayProgress(prev => Math.max(prev, Math.min(96, Math.round(progress || 12))));
  }, [progress, ready]);

  if (ready || failed || (!active && ready)) return null;

  return (
    <div className="model-progress boot-loader" role="status" aria-live="polite">
      <div className="boot-loader-card">
        <div className="boot-loader-badge">
          <span className="brand-symbol">Đ</span>
        </div>
        <div className="boot-loader-brand">
          <strong>Đông</strong>
          <span> / workspace</span>
        </div>
        <p className="boot-loader-label">Đang tải không gian 3D &amp; dữ liệu…</p>
        <div className="boot-loader-bar-wrap">
          <progress max={100} value={displayProgress} />
          <div className="boot-loader-bar-fill" style={{ width: `${displayProgress}%` }} />
        </div>
        <div className="boot-loader-meta">
          <span>Preparing the room</span>
          <strong>{displayProgress}%</strong>
        </div>
      </div>
    </div>
  );
}

  function StudioEnvironment({ isNight }: { isNight: boolean }) {
    const { gl, scene } = useThree();
    useEffect(() => {
      const pmrem = new PMREMGenerator(gl);
      const envScene = new RoomEnvironment();
      const envTex = pmrem.fromScene(envScene, 0.04).texture;
      scene.environment = envTex;
      return () => {
        scene.environment = null;
        envTex.dispose();
        pmrem.dispose();
      };
    }, [gl, scene]);
    useEffect(() => {
      scene.environmentIntensity = isNight ? 0.18 : 1.0;
    }, [scene, isNight]);
    return null;
  }

  function PCInteriorLight({ isNight, shadows }: { isNight: boolean; shadows: boolean }) {
    const target = useMemo(() => {
      const object = new Object3D();
      object.position.set(1.35, .59, -1.36);
      return object;
    }, []);
    return <>
      <primitive object={target} />
      <spotLight position={[1.04, .75, -1.08]} target={target} color="#fff2df"
        intensity={isNight ? .26 : .17} angle={.95} penumbra={.65} distance={1.2} decay={2}
        castShadow={shadows} shadow-mapSize={[1024, 1024]} shadow-camera-near={.03}
        shadow-camera-far={1.2} shadow-bias={-.0001} shadow-normalBias={.0008} />
    </>;
  }

  export default function RoomScene({ onEnter }: { onEnter: () => void }) {
    const [supported, setSupported] = useState<boolean | null>(null);
    const quality = useSettingsStore(s => s.quality);
    const lighting = useSettingsStore(s => s.lighting);
    const isNight = lighting === 'night';

    useEffect(() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        setSupported(Boolean(gl));
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
        if (!gl) useExperienceStore.getState().setFailed();
      } catch {
        setSupported(false);
        useExperienceStore.getState().setFailed();
      }
    }, []);

    if (supported === false) return <Fallback />;
    if (supported === null) return <LoadingProgress />;

    return (
      <SceneBoundary>
        <div className="scene-canvas">
          <Canvas
            dpr={quality === 'low' ? 1 : [1, 1.75]}
            shadows={quality !== 'low'}
            frameloop="always"
            camera={{ position: [-6.63, 5.18, 7.31], fov: 35, near: 0.05, far: 60 }}
            gl={{ antialias: true, alpha: true, toneMapping: AgXToneMapping, toneMappingExposure: 1.0 }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener(
                'webglcontextlost',
                event => {
                  event.preventDefault();
                  useExperienceStore.getState().setFailed();
                  setSupported(false);
                },
                { once: true }
              );
            }}
          >
            <StudioEnvironment isNight={isNight} />
            {/* Ambient & Hemisphere bounce adapting between warm afternoon daylight and cozy evening */}
            <ambientLight intensity={isNight ? 0.06 : 0.36} color={isNight ? '#162238' : '#f0f4fa'} />
            <hemisphereLight
              color={isNight ? '#223558' : '#f4f7fc'}
              groundColor={isNight ? '#0d1420' : '#88929e'}
              intensity={isNight ? 0.12 : 0.46}
            />
            {/* 1. Key light: Warm afternoon sun in Day mode / Soft evening moonlight overhead in Night mode */}
            <directionalLight
              position={[1.0, 6.2, 2.5]}
              color={isNight ? '#3c548a' : '#ffdba6'}
              intensity={isNight ? 0.14 : 1.75}
              castShadow={quality !== 'low'}
              shadow-mapSize={[2048, 2048]}
              shadow-camera-near={1.0}
              shadow-camera-far={14.0}
              shadow-camera-left={-3.6}
              shadow-camera-right={3.6}
              shadow-camera-top={3.6}
              shadow-camera-bottom={-3.6}
              shadow-bias={-0.0002}
              shadow-normalBias={0.006}
              shadow-radius={3.0}
            />
            {/* 2. Window light: Daylight vs cool indigo moonlight streaming through window */}
            <directionalLight
              position={[4.2, 3.2, 2.4]}
              color={isNight ? '#5882db' : '#f4f6fa'}
              intensity={isNight ? 0.24 : 0.88}
              castShadow={quality !== 'low'}
              shadow-mapSize={[1024, 1024]}
              shadow-camera-near={1.0}
              shadow-camera-far={12.0}
              shadow-camera-left={-3.5}
              shadow-camera-right={3.5}
              shadow-camera-top={3.5}
              shadow-camera-bottom={-3.5}
              shadow-bias={-0.0003}
              shadow-normalBias={0.008}
              shadow-radius={3.5}
            />
            {/* 3. Soft front-left fill */}
            <directionalLight position={[-4.2, 4.2, 4.2]} color={isNight ? '#2a3b5c' : '#eaedf5'} intensity={isNight ? 0.06 : 0.42} />
            {/* Localized practical lamps & LEDs — glowing warmly in Night mode */}
            {/* Nature Aquarium WRGB glow shining down from fixture */}
            <pointLight position={[-1.68, 1.94, -1.26]} color={isNight ? '#68f8de' : '#d2faf4'} intensity={isNight ? 1.45 : 0.85} distance={isNight ? 2.2 : 2.0} decay={2} />
            {/* Local shadows separate the PC hardware from its enclosure. */}
            <PCInteriorLight isNight={isNight} shadows={quality !== 'low'} />
            {/* Architect Desk Lamp warm tungsten pool */}
            <pointLight position={[-0.62, 1.66, -1.32]} color="#ff9d3b" intensity={isNight ? 1.05 : 0.42} distance={isNight ? 1.95 : 1.8} decay={2} />
            {/* Floating Shelf Under-Cabinet Warm LED Strip */}
            <pointLight position={[-0.55, 2.32, -1.72]} color="#ff9838" intensity={isNight ? 0.55 : 0.32} distance={isNight ? 1.4 : 1.8} decay={2} />
            {/* Floating Shelf Mushroom Designer Lamp warm ambient pool */}
            <pointLight position={[0.82, 2.68, -1.86]} color="#ffad5c" intensity={isNight ? 0.85 : 0.36} distance={isNight ? 1.6 : 1.4} decay={2} />
            {isNight && (
              <>
                {/* Acoustic Wood Slat Wall Top Warm LED wash */}
                <pointLight position={[-1.85, 2.88, -1.82]} color="#ff9433" intensity={0.42} distance={1.35} decay={2} />
                {/* Window Sill Warm Lantern glow */}
                <pointLight position={[2.36, 1.22, 0.42]} color="#ff9433" intensity={0.48} distance={1.25} decay={2} />
              </>
            )}
            <Suspense fallback={null}>
              <RoomModel onEnter={onEnter} />
            </Suspense>
            <CameraController />
          </Canvas>
        </div>
        <LoadingProgress />
      </SceneBoundary>
    );
  }
