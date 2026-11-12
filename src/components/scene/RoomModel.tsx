'use client';
import { useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor, useGLTF } from '@react-three/drei';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three';
import { useExperienceStore } from '@/stores/experienceStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useReducedMotion } from '@/hooks/usePreferences';
import { makeMonitorLightPassive, separateMonitorLight } from '@/lib/monitorLight';
import { configurePCMaterial } from '@/lib/pcMaterials';

function makeNightSkyTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      // Standard CanvasTexture (flipY=true): y=0 is top (fy=1), y=size-1 is bottom (fy=0)
      const fy = 1 - y / size;
      for (let x = 0; x < size; x++) {
        const fx = x / size;
        // Deep midnight indigo gradient
        let r = 0.045 + 0.055 * (1 - fy);
        let g = 0.08 + 0.085 * (1 - fy);
        let b = 0.19 + 0.14 * (1 - fy);

        // Glowing crescent moon & soft silver-blue halo in the left window pane (fx=0.34, fy=0.52)
        const moonD = Math.hypot((fx - 0.34) * 1.55, fy - 0.52);
        const craterD = Math.hypot((fx - 0.362) * 1.55, fy - 0.538);
        if (moonD < 0.058 && craterD > 0.046) {
          r = 0.98;
          g = 0.96;
          b = 0.86;
        } else if (moonD < 0.28) {
          const halo = Math.pow((0.28 - moonD) / 0.28, 2.2);
          r += 0.22 * halo;
          g += 0.28 * halo;
          b += 0.44 * halo;
        }

        // Crisp twinkling stars across the night sky band
        if (fy > 0.30) {
          const cellX = Math.floor(x / 3);
          const cellY = Math.floor(y / 3);
          const subX = x % 3;
          const subY = y % 3;
          const h = Math.sin(cellX * 127.1 + cellY * 311.7) * 43758.5453;
          const frac = h - Math.floor(h);
          if (frac > 0.986 && subX === 1 && subY === 1) {
            const br = 0.65 + 0.35 * ((frac - 0.986) / 0.014);
            r = Math.min(1, r + 0.85 * br);
            g = Math.min(1, g + 0.9 * br);
            b = Math.min(1, b + 1.0 * br);
          }
        }

        // Smooth moonlit mountain silhouettes in the lower pane
        const mFarBase = 0.36 + 0.045 * Math.sin(fx * 5.2 + 0.5) + 0.02 * Math.cos(fx * 13.0);
        const mMidBase = 0.25 + 0.038 * Math.sin(fx * 7.4 + 2.1) + 0.018 * Math.sin(fx * 18.0);
        const mNearBase = 0.15 + 0.028 * Math.cos(fx * 9.5 + 1.2) + 0.014 * Math.sin(fx * 29.0);

        if (fy < mFarBase) {
          const mist = Math.max(0, Math.min(1, (mFarBase - fy) / 0.14));
          r = 0.06 - 0.015 * mist;
          g = 0.095 - 0.02 * mist;
          b = 0.19 - 0.035 * mist;
        }
        if (fy < mMidBase) {
          const mist = Math.max(0, Math.min(1, (mMidBase - fy) / 0.12));
          r = 0.038 - 0.01 * mist;
          g = 0.06 - 0.015 * mist;
          b = 0.13 - 0.025 * mist;
        }
        if (fy < mNearBase) {
          r = 0.02;
          g = 0.032;
          b = 0.075;
        }

        const idx = (y * size + x) * 4;
        img.data[idx] = Math.round(Math.max(0, Math.min(1, r)) * 255);
        img.data[idx + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
        img.data[idx + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeSoftBoxAO(colorRgb = '18, 11, 5') {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      const ny = (y / (size - 1)) * 2 - 1;
      for (let x = 0; x < size; x++) {
        const nx = (x / (size - 1)) * 2 - 1;
        // Rounded super-ellipse distance for natural rectangular furniture shadow falloff
        const dx = Math.max(0, Math.abs(nx) - 0.32) / 0.68;
        const dy = Math.max(0, Math.abs(ny) - 0.32) / 0.68;
        const d = Math.min(1, Math.hypot(dx, dy));
        const alpha = Math.pow(0.5 * (1 + Math.cos(Math.PI * d)), 1.55);
        const idx = (y * size + x) * 4;
        const parts = colorRgb.split(',').map(Number);
        img.data[idx] = parts[0];
        img.data[idx + 1] = parts[1];
        img.data[idx + 2] = parts[2];
        img.data[idx + 3] = Math.round(alpha * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeRadialAO(colorRgb = '18, 11, 5') {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.06, size / 2, size / 2, size * 0.5);
    grad.addColorStop(0, `rgba(${colorRgb}, 1)`);
    grad.addColorStop(0.55, `rgba(${colorRgb}, 0.52)`);
    grad.addColorStop(1, `rgba(${colorRgb}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeCausticsTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      const ny = y / size;
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const w1 = Math.sin(nx * 14.0 + Math.cos(ny * 12.0) * 2.2);
        const w2 = Math.cos(ny * 15.0 - Math.sin(nx * 10.0) * 1.8);
        const w3 = Math.sin((nx + ny) * 18.0);
        const cVal = Math.pow(Math.max(0, 0.42 + 0.35 * w1 + 0.35 * w2 + 0.25 * w3), 3.0);
        const edgeFade = Math.sin(nx * Math.PI) * Math.sin(ny * Math.PI);
        const intensity = Math.min(1, cVal * edgeFade);

        const idx = (y * size + x) * 4;
        img.data[idx] = Math.round(90 + 130 * intensity);
        img.data[idx + 1] = Math.round(230 + 25 * intensity);
        img.data[idx + 2] = Math.round(220 + 35 * intensity);
        img.data[idx + 3] = Math.round(intensity * 180);
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}

function makeBubbleTexture() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
    grad.addColorStop(0.4, 'rgba(190, 250, 240, 0.75)');
    grad.addColorStop(0.8, 'rgba(130, 230, 220, 0.3)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 15, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function CO2Bubbles({ bubbleTex }: { bubbleTex: Texture }) {
  const count = 75;
  const [geometry] = useMemo(() => {
    const geom = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = -1.24 + (Math.random() - 0.5) * 0.025;
      pos[i * 3 + 1] = 1.415 + Math.random() * 0.42;
      pos[i * 3 + 2] = -1.48 + (Math.random() - 0.5) * 0.025;
    }
    geom.setAttribute('position', new BufferAttribute(pos, 3));
    return [geom];
  }, [count]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const positions = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const speed = 0.14 + (i % 8) * 0.016;
      positions[idx + 1] += speed * delta;
      positions[idx] = -1.24 + Math.sin(t * 7.5 + i * 1.4) * 0.006;
      positions[idx + 2] = -1.48 + Math.cos(t * 6.8 + i * 1.3) * 0.006;

      if (positions[idx + 1] > 1.835) {
        positions[idx + 1] = 1.415 + Math.random() * 0.018;
        positions[idx] = -1.24 + (Math.random() - 0.5) * 0.02;
        positions[idx + 2] = -1.48 + (Math.random() - 0.5) * 0.02;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        map={bubbleTex}
        size={0.018}
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

export function RoomModel({ onEnter }: { onEnter: () => void }) {
  const { scene } = useGLTF('/models/room.glb');
  const reduced = useReducedMotion();
  const mode = useExperienceStore(s => s.mode);
  const lighting = useSettingsStore(s => s.lighting);
  const [hover, setHover] = useState(false);
  useCursor(hover && (mode === 'room' || mode === 'welcome'));

  const aoTextures = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return {
      box: makeSoftBoxAO('18, 11, 5'),
      radial: makeRadialAO('18, 11, 5'),
      nightSky: makeNightSkyTexture(),
      caustics: makeCausticsTexture(),
      bubble: makeBubbleTexture(),
    };
  }, []);

  // Build the clone and its material references together. React Strict Mode
  // can evaluate a memo twice; neither evaluation may mutate the other's model.
  const { model, animated } = useMemo(() => {
    const model = scene.clone(true);
    const fish: { object: Object3D; tail: Object3D | null; x: number; y: number; z: number }[] = [];
    const fans: Object3D[] = [];
    const skyMaterials: { mat: MeshStandardMaterial; dayMap: Texture | null }[] = [];
    const ledMaterials: MeshStandardMaterial[] = [];
    const matCache = new Map<MeshStandardMaterial, MeshStandardMaterial>();

    model.updateMatrixWorld(true);
    model.traverse(object => {
      if (object instanceof Mesh) {
        const rawMat = Array.isArray(object.material) ? object.material[0] : object.material;
        if (rawMat instanceof MeshStandardMaterial) {
          let mat = matCache.get(rawMat);
          if (!mat) {
            mat = rawMat.clone();
            matCache.set(rawMat, mat);
            matCache.set(mat, mat);

            const name = `${mat.name} ${object.name}`;
            mat.envMapIntensity = 0.03;
            if (mat.map) {
              mat.map.anisotropy = 8;
              mat.map.needsUpdate = true;
            }
            if (name.includes('Sand_plaster') || name.includes('Sand plaster')) {
              // Crisp Pure White wall (Kim sinh Thủy)
              mat.color.setRGB(0.97, 0.97, 0.97);
              mat.roughness = 0.92;
              mat.envMapIntensity = 0.02;
            } else if (name.includes('Oak_grain') || name.includes('Oak grain')) {
              // Light Nordic Ash / White Oak plank flooring
              mat.color.setRGB(0.92, 0.90, 0.86);
              mat.roughness = 0.65;
              mat.envMapIntensity = 0.04;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.003;
              }
            } else if (name.includes('Walnut_grain') || name.includes('Walnut grain')) {
              // Light Nordic Ash wood (desk, shelves, acoustic slat wall)
              mat.color.setRGB(0.94, 0.92, 0.88);
              mat.roughness = 0.62;
              mat.envMapIntensity = 0.045;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.0028;
              }
            } else if (name.includes('Walnut_dark') || name.includes('Walnut dark')) {
              // Light Ash shadow trim & legs
              mat.color.setRGB(0.88, 0.86, 0.82);
              mat.roughness = 0.60;
              mat.envMapIntensity = 0.035;
            } else if (name.includes('Walnut_edges') || name.includes('Walnut edges')) {
              mat.color.setRGB(0.90, 0.88, 0.84);
              mat.roughness = 0.62;
              mat.envMapIntensity = 0.035;
            } else if (name.includes('Woven_wool') || name.includes('Woven wool')) {
              // Deep Oceanic Bauhaus geometric rug (Navy, Cobalt, Slate & White)
              mat.color.setRGB(0.95, 0.96, 0.98);
              mat.roughness = 0.85;
              mat.envMapIntensity = 0.02;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.008;
              }
            } else if (name.includes('Olive_upholstery') || name.includes('Olive upholstery')) {
              // Deep Oceanic Navy Blue upholstery (Chair seat cushion & headrest)
              mat.color.setRGB(0.10, 0.16, 0.28);
              mat.roughness = 0.80;
              mat.envMapIntensity = 0.05;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.007;
              }
            } else if (name.includes('Linen_curtain') || name.includes('Linen curtain')) {
              // Deep Oceanic Navy linen curtains
              mat.color.setRGB(0.11, 0.16, 0.26);
              mat.roughness = 0.80;
              mat.envMapIntensity = 0.03;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.007;
              }
            } else if (name.includes('Desk_felt_mat') || name.includes('Desk felt mat')) {
              // Deep Oceanic Navy Blue desk mat
              mat.color.setRGB(0.09, 0.14, 0.25);
              mat.roughness = 0.82;
              mat.envMapIntensity = 0.05;
            } else if (name.includes('Pellicle_mesh_') || name.includes('Pellicle mesh ')) {
              // The albedo already contains the fabric color. Alpha coverage keeps
              // the weave breathable without sorting two transparent box faces.
              mat.color.setRGB(1, 1, 1);
              mat.roughness = 0.88;
              mat.metalness = 0;
              mat.envMapIntensity = 0.15;
              mat.side = DoubleSide;
              mat.transparent = false;
              mat.alphaTest = 0.35;
              mat.alphaToCoverage = true;
              mat.depthWrite = true;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.00018;
              }
            } else if (name.includes('Mouse_wheel_steel') || name.includes('Mouse wheel steel')) {
              // MagSpeed knurled stainless steel scroll wheel
              mat.color.setRGB(0.85, 0.88, 0.90);
              mat.roughness = 0.18;
              mat.metalness = 0.92;
              mat.envMapIntensity = 1.35;
            } else if (name.includes('Mouse_grip_slate') || name.includes('Mouse grip slate')) {
              // Precision diamond tactile rubber grip
              mat.color.setRGB(0.14, 0.17, 0.22);
              mat.roughness = 0.78;
              mat.envMapIntensity = 0.15;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.004;
              }
            } else if (name.includes('Mouse_body_slate') || name.includes('Mouse body slate')) {
              // Sculpted matte slate mouse chassis
              mat.color.setRGB(0.075, 0.09, 0.12);
              mat.roughness = 0.65;
              mat.metalness = 0.02;
              mat.envMapIntensity = 0.3;
            } else if (name.includes('MacBook_aluminum') || name.includes('MacBook aluminum')) {
              // Precision CNC anodized aluminum unibody
              mat.color.setRGB(0.84, 0.86, 0.88);
              mat.roughness = 0.28;
              mat.metalness = 0.85;
              mat.envMapIntensity = 0.95;
            } else if (name.includes('Force_touch_trackpad') || name.includes('Force touch trackpad')) {
              // Matte etched glass Force Touch trackpad
              mat.color.setRGB(0.82, 0.84, 0.87);
              mat.roughness = 0.22;
              mat.metalness = 0.65;
              mat.envMapIntensity = 0.75;
            } else if (name.includes('Laptop_speaker_grille') || name.includes('Laptop speaker grille')) {
              // CNC laser-drilled acoustic micro-dot grille
              mat.color.setRGB(0.70, 0.72, 0.75);
              mat.roughness = 0.55;
              mat.metalness = 0.70;
              mat.envMapIntensity = 0.65;
              if (mat.map) {
                mat.bumpMap = mat.map;
                // Sub-millimeter relief stays stable when the laptop is small on screen.
                mat.bumpScale = 0.00025;
              }
            } else if (name.includes('Display_glass_bezel') || name.includes('Display glass bezel')) {
              // Glossy black glass border
              mat.color.setRGB(0.04, 0.05, 0.06);
              mat.roughness = 0.08;
              mat.metalness = 0.15;
              mat.envMapIntensity = 0.95;
            } else if (name.includes('ScreenBar anodized aluminum') || name.includes('ScreenBar_anodized_aluminum') || name.includes('ScreenBar machined end caps') || name.includes('ScreenBar_machined_end_caps')) {
              mat.roughness = .42;
              mat.metalness = .65;
              mat.envMapIntensity = .45;
            } else if (name.includes('Monitor_chassis_dark') || name.includes('Monitor chassis dark')) {
              // Matte graphite monitor housing
              mat.color.setRGB(0.12, 0.14, 0.18);
              mat.roughness = 0.45;
              mat.metalness = 0.22;
              mat.envMapIntensity = 0.35;
            } else if (name.includes('Chair_frame_white') || name.includes('Chair frame white')) {
              // Anodized Silver Grey / Platinum chair frame
              mat.color.setRGB(0.82, 0.84, 0.87);
              mat.roughness = 0.32;
              mat.metalness = 0.65;
              mat.envMapIntensity = 0.85;
            } else if (name.includes('Chair_mesh_grey') || name.includes('Chair mesh grey')) {
              // Breathable Smoke Silver mesh backrest
              mat.color.setRGB(0.68, 0.72, 0.76);
              mat.roughness = 0.68;
              mat.metalness = 0.15;
              mat.envMapIntensity = 0.35;
            } else if (name.includes('Keycap_matcha') || name.includes('Keycap matcha')) {
              // Deep Navy keycaps (Modifiers & Function)
              mat.color.setRGB(0.10, 0.16, 0.28);
              mat.roughness = 0.65;
            } else if (name.includes('Keycap_butter') || name.includes('Keycap butter')) {
              // Accent Cobalt Blue keycaps (Esc & Spacebar)
              mat.color.setRGB(0.18, 0.38, 0.65);
              mat.roughness = 0.65;
            } else if (name.includes('Keycap_cream') || name.includes('Keycap cream')) {
              // Crisp Ice White keycaps (Alphas)
              mat.color.setRGB(0.94, 0.95, 0.96);
              mat.roughness = 0.65;
            } else if (name.includes('Matte_ceramic') || name.includes('Matte ceramic')) {
              // Pure White / Pearl ceramic pot
              mat.color.setRGB(0.92, 0.94, 0.96);
              mat.roughness = 0.68;
              mat.envMapIntensity = 0.08;
            } else if (name.includes('Graphite_powder_coat') || name.includes('Graphite powder coat')) {
              // Slate Charcoal / Gunmetal
              mat.color.setRGB(0.18, 0.20, 0.24);
              mat.roughness = 0.55;
              mat.envMapIntensity = 0.12;
            } else if (name.includes('Leaf')) {
              mat.color.r *= 0.85;
              mat.color.g *= 0.85;
              mat.color.b *= 0.82;
              mat.roughness = 0.42;
              mat.envMapIntensity = 0.18;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.005;
              }
            } else if (
              name.includes('Brushed_brass') ||
              name.includes('Brushed brass') ||
              name.includes('Brushed_aluminum') ||
              name.includes('Brushed aluminum') ||
              name.includes('Burnished_copper') ||
              name.includes('Burnished copper')
            ) {
              mat.envMapIntensity = 1.15;
            } else if (name.includes('Seiryu_stone') || name.includes('Seiryu stone')) {
              mat.roughness = 0.82;
              mat.envMapIntensity = 0.04;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.006;
              }
            } else if (name.includes('Aquarium_substrate') || name.includes('Aquarium substrate')) {
              mat.roughness = 0.88;
              mat.envMapIntensity = 0.02;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.005;
              }
            } else if (name.includes('Aquarium_sand') || name.includes('Aquarium sand')) {
              mat.roughness = 0.78;
              mat.envMapIntensity = 0.04;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.003;
              }
            } else if (name.includes('Aquarium_moss') || name.includes('Aquarium moss')) {
              mat.roughness = 0.65;
              mat.envMapIntensity = 0.06;
            } else if (name.includes('Neon_tetra') || name.includes('Neon tetra')) {
              mat.roughness = 0.32;
              mat.metalness = 0.45;
              mat.envMapIntensity = 0.85;
              mat.emissiveIntensity = 0.35;
            } else if (name.includes('Translucent_fin') || name.includes('Translucent fin')) {
              mat.roughness = 0.15;
              mat.transparent = true;
              mat.opacity = 0.42;
              mat.depthWrite = false;
            } else if (name.includes('Fish_iris') || name.includes('Fish iris')) {
              mat.roughness = 0.18;
              mat.metalness = 0.85;
              mat.envMapIntensity = 1.1;
            } else if (name.includes('Mushroom_lamp') || name.includes('Mushroom lamp')) {
              mat.color.setRGB(0.10, 0.16, 0.28);
              mat.roughness = 0.32;
              mat.metalness = 0.25;
              mat.envMapIntensity = 0.85;
            } else if (name.includes('Camera_chrome') || name.includes('Camera chrome')) {
              mat.roughness = 0.18;
              mat.metalness = 0.88;
              mat.envMapIntensity = 1.25;
            } else if (name.includes('Camera_leatherette') || name.includes('Camera leatherette')) {
              mat.roughness = 0.86;
              mat.envMapIntensity = 0.04;
              if (mat.map) {
                mat.bumpMap = mat.map;
                mat.bumpScale = 0.004;
              }
            } else if (name.includes('Lens_glass') || name.includes('Lens glass')) {
              mat.roughness = 0.02;
              mat.metalness = 0.15;
              mat.envMapIntensity = 1.45;
              mat.transparent = true;
              mat.opacity = 0.35;
              mat.depthWrite = false;
            } else if (name.includes('Picture_glass') || name.includes('Picture glass')) {
              mat.roughness = 0.02;
              mat.envMapIntensity = 0.95;
              mat.transparent = true;
              mat.opacity = 0.12;
            } else if (name.includes('Gallery_print') || name.includes('Gallery print')) {
              mat.roughness = 0.82;
              mat.envMapIntensity = 0.04;
            } else if (name.includes('Book_pages') || name.includes('Book pages')) {
              mat.roughness = 0.92;
              mat.envMapIntensity = 0.02;
            } else if (name.includes('Foil_gold') || name.includes('Foil gold')) {
              mat.metalness = 0.88;
              mat.roughness = 0.26;
              mat.envMapIntensity = 1.25;
            } else if (name.includes('Foil_silver') || name.includes('Foil silver')) {
              mat.metalness = 0.92;
              mat.roughness = 0.22;
              mat.envMapIntensity = 1.35;
            } else if (name.includes('Aquarium_glass') || name.includes('Aquarium glass')) {
              mat.roughness = 0.02;
              mat.metalness = 0.05;
              mat.envMapIntensity = 1.45;
              mat.opacity = 0.14;
            } else if (name.includes('Water')) {
              mat.roughness = 0.04;
              mat.metalness = 0.02;
              mat.envMapIntensity = 1.35;
              mat.opacity = 0.24;
            } else if (name.includes('Window_glass') || name.includes('Window glass')) {
              mat.roughness = 0.04;
              mat.envMapIntensity = 0.85;
              mat.opacity = 0.1;
            } else if (name.includes('Monitor_glass') || name.includes('Monitor glass')) {
              // One persistent HTML desktop supplies the image at every zoom.
              // Keep only a dark backing here so an old preview cannot show through.
              mat.map = null;
              mat.emissiveMap = null;
              mat.color.setRGB(0.02, 0.03, 0.025);
              mat.emissive.setRGB(0, 0, 0);
              mat.emissiveIntensity = 0;
              mat.roughness = 0.95;
              mat.metalness = 0;
              mat.envMapIntensity = 0;
            } else if (name.includes('Afternoon_sky') || name.includes('Afternoon sky')) {
              skyMaterials.push({ mat, dayMap: mat.map });
            } else if (
              name.includes('Warm_LED') ||
              name.includes('Warm LED') ||
              name.includes('Aquarium_WRGB') ||
              name.includes('Aquarium WRGB') ||
              name.includes('VESA_bias_light') ||
              name.includes('VESA bias light')
            ) {
              ledMaterials.push(mat);
            } else if (name.includes('ceramic')) {
              mat.roughness = 0.32;
              mat.envMapIntensity = 0.55;
            }
          }
          configurePCMaterial(mat);
          object.material = mat;
        }

        const mat = Array.isArray(object.material) ? object.material[0] : object.material;
        const matName = mat instanceof MeshStandardMaterial ? mat.name : '';
        if (mat instanceof MeshStandardMaterial) {
          if (matName.includes('Aquarium WRGB') || matName.includes('Aquarium_WRGB')) {
            separateMonitorLight(object, mat);
          } else if (matName.includes('Monitor task light') || matName.includes('Monitor_task_light')) {
            makeMonitorLightPassive(mat);
          }
        }
        const isTransparent = Boolean(mat && mat.transparent && mat.opacity < 0.5);
        const isFloorOrRug =
          matName.includes('Oak') ||
          matName.includes('Woven') ||
          matName.includes('underpad') ||
          object.name.includes('Floor') ||
          object.name.includes('Rug');
        object.castShadow = !isTransparent && !isFloorOrRug;
        object.receiveShadow = !isTransparent;
      }
      if (object.name.startsWith('FishRoot')) {
        let tailObj: Object3D | null = null;
        object.traverse(child => {
          if (child.name.includes('tail') || child.name.includes('Tail')) tailObj = child;
        });
        fish.push({
          object,
          tail: tailObj,
          x: object.position.x,
          y: object.position.y,
          z: object.position.z,
        });
      }
      if (object.name.startsWith('FanRoot')) fans.push(object);
    });
    return { model, animated: { fish, fans, skyMaterials, ledMaterials } };
  }, [scene]);

  useEffect(() => {
    const isNight = lighting === 'night';
    animated.skyMaterials.forEach(({ mat, dayMap }) => {
      const targetMap = isNight && aoTextures?.nightSky ? aoTextures.nightSky : dayMap;
      mat.map = isNight ? null : dayMap;
      mat.emissiveMap = targetMap;
      mat.color.setRGB(isNight ? 0.02 : 1, isNight ? 0.03 : 1, isNight ? 0.06 : 1);
      mat.emissive.setRGB(isNight ? 1.0 : 0.38, isNight ? 1.0 : 0.38, isNight ? 1.0 : 0.38);
      mat.emissiveIntensity = isNight ? 1.25 : 0.38;
      mat.needsUpdate = true;
    });
    animated.ledMaterials.forEach(mat => {
      mat.emissiveIntensity = isNight ? 4.5 : 2.6;
      mat.needsUpdate = true;
    });
  }, [lighting, animated, aoTextures]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      useExperienceStore.getState().setReady(true);
    });
    return () => {
      cancelAnimationFrame(id);
      useExperienceStore.getState().setReady(false);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'room') setHover(false);
  }, [mode]);

  useFrame(({ clock }, delta) => {
    if (reduced || mode === 'os') return;
    const t = clock.elapsedTime;
    if (aoTextures?.caustics) {
      aoTextures.caustics.offset.x = (t * 0.035) % 1;
      aoTextures.caustics.offset.y = (t * 0.028) % 1;
    }
    animated.fish.forEach((fish, i) => {
      // Cohesive schooling kinematics: fish share a primary cruising path with flocking offsets
      const schoolPhase = t * 0.26;
      const lag = i * 0.12;
      const indPhase = schoolPhase - lag;

      const cruiseX = Math.sin(indPhase) * 0.08;
      const cruiseZ = Math.cos(indPhase * 0.85) * 0.035;
      const cruiseY = Math.sin(indPhase * 1.5) * 0.015;

      const microX = Math.sin(t * 0.9 + i * 1.6) * 0.010;
      const microZ = Math.cos(t * 0.8 + i * 2.2) * 0.008;
      const microY = Math.sin(t * 1.2 + i * 1.4) * 0.006;

      const targetX = fish.x + cruiseX + microX;
      const targetZ = fish.z + cruiseZ + microZ;
      const targetY = fish.y + cruiseY + microY;

      const vx = targetX - fish.object.position.x;
      const vz = targetZ - fish.object.position.z;
      const vy = targetY - fish.object.position.y;
      const horizDist = Math.hypot(vx, vz);

      fish.object.position.x = targetX;
      fish.object.position.y = targetY;
      fish.object.position.z = targetZ;

      if (horizDist > 0.00005) {
        const targetHeading = Math.atan2(-vz, vx);
        let diff = targetHeading - fish.object.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        fish.object.rotation.y += diff * Math.min(1, delta * 5.5);

        const turnRate = diff / Math.max(delta, 0.001);
        const targetRoll = Math.max(-0.25, Math.min(0.25, -turnRate * 0.03));
        fish.object.rotation.z += (targetRoll - fish.object.rotation.z) * Math.min(1, delta * 4.5);

        const targetPitch = Math.max(-0.18, Math.min(0.18, (vy / (horizDist + 0.001)) * 0.3));
        fish.object.rotation.x += (targetPitch - fish.object.rotation.x) * Math.min(1, delta * 4.5);
      }

      if (fish.tail) {
        const speed = horizDist / Math.max(delta, 0.001);
        const waggleFreq = 10.0 + Math.min(speed * 60.0, 7.0);
        const waggleAmp = 0.22 + Math.min(speed * 1.4, 0.14);
        fish.tail.rotation.y = Math.sin(t * waggleFreq + i * 1.85) * waggleAmp;
      }
    });
    animated.fans.forEach(fan => {
      fan.rotation.z += Math.min(delta, 0.05) * 2.6;
    });
  });

  return (
    <group>
      <primitive object={model} />
      {lighting === 'night' && aoTextures?.nightSky && (
        <mesh position={[2.76, 1.9, -0.24]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[2.65, 1.62]} />
          <meshBasicMaterial map={aoTextures.nightSky} />
        </mesh>
      )}
      {/* Dynamic Animated Aquarium Water Caustics Shimmering on Substrate */}
      {aoTextures?.caustics && (
        <mesh position={[-1.68, 1.312, -1.26]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
          <planeGeometry args={[0.94, 0.52]} />
          <meshBasicMaterial
            map={aoTextures.caustics}
            transparent
            opacity={lighting === 'night' ? 0.38 : 0.28}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* CO2 Micro-Bubble Stream rising from ceramic diffuser */}
      {aoTextures?.bubble && <CO2Bubbles bubbleTex={aoTextures.bubble} />}
      {aoTextures && (
        <group>
          {/* Floor cavity & furniture ambient occlusion (Y = 0.039) */}
          <mesh position={[-0.25, 0.039, -1.32]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[4.45, 1.48]} />
            <meshBasicMaterial map={aoTextures.box} transparent opacity={0.58} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[-1.95, 0.0395, -1.26]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[1.02, 1.32]} />
            <meshBasicMaterial map={aoTextures.box} transparent opacity={0.62} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
          <mesh position={[1.19, 0.0395, -1.33]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[0.76, 1.02]} />
            <meshBasicMaterial map={aoTextures.box} transparent opacity={0.56} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
          <mesh position={[2.08, 0.0395, 1.22]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[0.88, 0.88]} />
            <meshBasicMaterial map={aoTextures.radial} transparent opacity={0.48} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          {/* Chair ambient occlusion on woven wool rug (Y = 0.058) */}
          <mesh position={[0.05, 0.058, 0.42]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[1.15, 1.15]} />
            <meshBasicMaterial map={aoTextures.radial} transparent opacity={0.46} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          {/* Back wall shelf, clock & corner soft AO (Z = -2.042) */}
          <mesh position={[-0.38, 2.34, -2.042]} renderOrder={1}>
            <planeGeometry args={[3.65, 0.36]} />
            <meshBasicMaterial map={aoTextures.radial} transparent opacity={0.22} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[-1.22, 2.81, -2.042]} renderOrder={1}>
            <planeGeometry args={[1.65, 0.28]} />
            <meshBasicMaterial map={aoTextures.radial} transparent opacity={0.2} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[1.7, 2.61, -2.042]} renderOrder={1}>
            <planeGeometry args={[0.62, 0.62]} />
            <meshBasicMaterial map={aoTextures.radial} transparent opacity={0.22} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[2.52, 1.65, -2.042]} renderOrder={1}>
            <planeGeometry args={[0.65, 3.1]} />
            <meshBasicMaterial map={aoTextures.radial} transparent opacity={0.18} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          {/* Desktop & Desk Mat contact AO shadows (Y = 1.209 & Y = 1.218) */}
          <mesh position={[-1.68, 1.209, -1.26]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[1.22, 0.78]} />
            <meshBasicMaterial map={aoTextures.box} transparent opacity={0.52} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[0.1, 1.209, -1.28]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[1.52, 0.44]} />
            <meshBasicMaterial map={aoTextures.box} transparent opacity={0.48} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[-0.66, 1.209, -1.28]} rotation={[-Math.PI / 2, 0, 0.22]} renderOrder={1}>
            <planeGeometry args={[0.28, 0.3]} />
            <meshBasicMaterial map={aoTextures.box} transparent opacity={0.48} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[0.86, 1.209, -1.28]} rotation={[-Math.PI / 2, 0, -0.22]} renderOrder={1}>
            <planeGeometry args={[0.28, 0.3]} />
            <meshBasicMaterial map={aoTextures.box} transparent opacity={0.48} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[1.34, 1.209, -1.12]} rotation={[-Math.PI / 2, 0, -0.28]} renderOrder={1}>
            <planeGeometry args={[0.56, 0.46]} />
            <meshBasicMaterial map={aoTextures.box} transparent opacity={0.44} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[-0.88, 1.209, -0.92]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[0.24, 0.24]} />
            <meshBasicMaterial map={aoTextures.radial} transparent opacity={0.46} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[-0.82, 1.209, -1.56]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[0.34, 0.34]} />
            <meshBasicMaterial map={aoTextures.radial} transparent opacity={0.48} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[1.76, 1.209, -0.78]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[0.24, 0.24]} />
            <meshBasicMaterial map={aoTextures.radial} transparent opacity={0.44} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[0.02, 1.218, -0.76]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[0.92, 0.44]} />
            <meshBasicMaterial map={aoTextures.box} transparent opacity={0.5} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
          <mesh position={[0.66, 1.218, -0.79]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[0.16, 0.22]} />
            <meshBasicMaterial map={aoTextures.radial} transparent opacity={0.45} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
          </mesh>
        </group>
      )}
      {(mode === 'welcome' || mode === 'room') && (
        <mesh
          position={[0.1, 1.66, -0.965]}
          onPointerOver={e => {
            e.stopPropagation();
            setHover(true);
          }}
          onPointerOut={() => setHover(false)}
          onClick={e => {
            e.stopPropagation();
            onEnter();
          }}
        >
          <planeGeometry args={[1.5, 0.68]} />
          <meshBasicMaterial color="#e8ad63" transparent opacity={hover ? 0.18 : 0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
