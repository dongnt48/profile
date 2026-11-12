'use client';
import { useState } from 'react';
import { ArrowUpRight, Copy, Mail } from 'lucide-react';
import { profile } from '@/data/profile';
export function ContactApp() {
  const [status, setStatus] = useState('');
  return <div className="app-padding contact-app"><div className="contact-symbol"><Mail size={36} /></div><span className="eyebrow">GOOD THINGS START WITH A HELLO</span><h1>Let’s make<br />something <em>good.</em></h1><p className="body-copy">Một ý tưởng, một dự án, hay đơn giản là lời chào.<br />Mình rất vui khi được kết nối.</p>{profile.email ? <div className="contact-email"><a href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={20} /></a><button aria-label="Copy email address" onClick={async () => { try { await navigator.clipboard.writeText(profile.email); setStatus('Email copied.'); } catch { setStatus('Không thể sao chép. Bạn có thể chọn địa chỉ email và sao chép thủ công.'); } }}><Copy size={18} /></button></div> : <div className="notice"><Mail size={18} /><span>Email chưa được cung cấp.<br /><small>Cập nhật email trong dữ liệu profile để bật liên hệ.</small></span></div>}<p role="status">{status}</p><div className="social-links">{profile.links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={16} /></a>)}</div><p className="sample-note">Based in Vietnam · Available for collaboration & select opportunities.</p></div>;
}
