import type { Metadata } from 'next';
import { ExperienceShell } from '@/components/ExperienceShell';
import './globals.css';
export const metadata: Metadata = { metadataBase: new URL('https://dongos.dev'), title: 'DongOS — A personal workspace', description: 'Step into a quiet 3D workspace and explore a personal portfolio through DongOS.', robots: { index: false, follow: false }, openGraph: { title: 'DongOS — A personal workspace', description: 'A little space for big ideas.', images: [{ url: '/images/room-preview.png', width: 1400, height: 1000 }] } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="vi"><body><ExperienceShell />{children}</body></html>; }
