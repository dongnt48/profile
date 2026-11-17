'use client';
import { useTranslation } from '@/lib/i18n';
import { useEffect, useRef, useState } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
const photos = [{ title: 'A quiet corner', src: '/images/room-preview.png', caption: 'Rendered from the workspace Blender model.' }, { title: 'The shape of quiet', src: '/images/wallpaper.svg', caption: 'Landscape vector artwork created for DongOS.' }];
export function GalleryApp() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { if (selected !== null) closeRef.current?.focus(); }, [selected]);
  function close() { setSelected(null); triggerRef.current?.focus(); }
  return <div className="app-padding"><h1>{t("Workspace images")}</h1><div className="gallery-grid">{photos.map((p, i) => <button key={t(p.title)} onClick={e => { triggerRef.current = e.currentTarget; setSelected(i); }}><img src={p.src} alt={t(p.title)} /><span>{t(p.title)}<ArrowUpRight size={16} /></span></button>)}</div>{selected !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label={t(photos[selected].title)} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } if (e.key === 'Tab') { e.preventDefault(); closeRef.current?.focus(); } }}><button ref={closeRef} aria-label={t("Close image")} onClick={close}><X /></button><img src={photos[selected].src} alt={t(photos[selected].title)} /><p>{t(photos[selected].caption)}</p></div>}</div>;
}
