import type { Metadata, Viewport } from 'next';
import { ExperienceShell } from '@/components/ExperienceShell';
import { profile } from '@/data/profile';
import './globals.css';
import './clay-desktop.css';
import './responsive.css';
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', interactiveWidget: 'resizes-content' };
export const metadata: Metadata = { metadataBase: new URL(profile.links.find(link => link.label === 'Profile')!.url), title: `${profile.name} — ${profile.role}`, description: `${profile.name} — ${profile.role}.`, robots: { index: false, follow: false }, openGraph: { title: `${profile.name} — ${profile.role}`, description: `${profile.name} — ${profile.role}.`, images: [{ url: '/images/room-preview.png', width: 1400, height: 1000 }] } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><ExperienceShell />{children}</body></html>; }
