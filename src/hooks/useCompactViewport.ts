'use client';
import { useEffect, useState } from 'react';
export function useCompactViewport() {
  // Wait for the client viewport before deciding whether to mount the 3D scene.
  const [compact, setCompact] = useState<boolean | null>(null);
  useEffect(() => {
    const media = matchMedia('(max-width: 1100px), (max-height: 600px), (pointer: coarse) and (max-width: 1440px)');
    const update = () => setCompact(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return compact;
}
