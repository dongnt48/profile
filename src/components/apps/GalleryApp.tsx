'use client';
import { useEffect, useRef, useState } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
const photos = [{ title: 'A quiet corner', src: '/images/room-preview.png', caption: 'Ảnh render từ model Blender của workspace.' }, { title: 'The shape of quiet', src: '/images/wallpaper.svg', caption: 'Tranh phong cảnh vector được tạo cho DongOS.' }];
export function GalleryApp() {
  const [selected, setSelected] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { if (selected !== null) closeRef.current?.focus(); }, [selected]);
  function close() { setSelected(null); triggerRef.current?.focus(); }
  return <div className="app-padding"><span className="eyebrow">A FEW THINGS WORTH LOOKING AT</span><h1>Outside the screen<span className="accent">.</span></h1><p className="body-copy">Hình ảnh của workspace. Bạn có thể thay bằng ảnh và sở thích của mình.</p><div className="gallery-grid">{photos.map((p, i) => <button key={p.title} onClick={e => { triggerRef.current = e.currentTarget; setSelected(i); }}><img src={p.src} alt={p.title} /><span>{p.title}<ArrowUpRight size={16} /></span></button>)}</div>{selected !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label={photos[selected].title} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } if (e.key === 'Tab') { e.preventDefault(); closeRef.current?.focus(); } }}><button ref={closeRef} aria-label="Close image" onClick={close}><X /></button><img src={photos[selected].src} alt={photos[selected].title} /><p>{photos[selected].caption}</p></div>}</div>;
}
