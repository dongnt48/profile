'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from '@/lib/i18n';

function getStatusKey(value: number | undefined, complete: boolean) {
  if (complete) return 'Welcome to my corner.';
  if (value === undefined || value < 25) return 'Opening your workspace…';
  if (value < 55) return 'Turning on the desk lamp';
  if (value < 80) return 'Lighting up Đông’s little corner.';
  if (value < 95) return 'Waking up the screen';
  return 'Finishing the details';
}

export function RoomLoader({ progress = null, complete = false }: { progress?: number | null; complete?: boolean }) {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setImgLoaded(true);
  }, []);

  const value = progress === null ? undefined : Math.max(0, Math.min(100, Math.round(progress)));
  const ratio = complete ? 1 : value === undefined ? 0.14 : value / 100;
  const statusText = t(getStatusKey(value, complete));

  const stageClasses = [
    'model-progress',
    'boot-loader',
    complete ? 'is-complete' : '',
    value === undefined ? 'is-indeterminate' : '',
    imgLoaded ? 'is-img-ready' : '',
  ].filter(Boolean).join(' ');

  const lightStyle = {
    '--load-ratio': ratio.toFixed(3),
    '--light-spread': `${Math.round(18 + ratio * 126)}%`,
  } as CSSProperties;

  return (
    <div className={stageClasses} style={lightStyle}>
      <div className="loading-backdrop" aria-hidden="true" />
      <div
        className="loading-desk"
        role="progressbar"
        aria-label={t('Preparing your workspace')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className="loading-stage" aria-hidden="true">
          <div className="loading-lamp-halo" />
          <img
            ref={imgRef}
            src="/images/room-preview.png"
            alt=""
            className="loading-room-img loading-room-dim"
            decoding="async"
            fetchPriority="high"
            onLoad={() => setImgLoaded(true)}
          />
          <img
            src="/images/room-preview.png"
            alt=""
            className="loading-room-img loading-room-lit"
            decoding="async"
          />
          <div className="loading-lamp-flare" />
        </div>

        <div className="loading-hud">
          <div className="loading-meta">
            <span className="loading-status">{statusText}</span>
            {value !== undefined && <span className="loading-percent">{value}%</span>}
          </div>
          <div className="loading-track">
            <div className="loading-fill" style={value !== undefined ? { width: `${value}%` } : undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}
