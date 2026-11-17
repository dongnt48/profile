import type { Metadata } from 'next';
import { ExperienceShell } from '@/components/ExperienceShell';
import './globals.css';
export const metadata: Metadata = { metadataBase: new URL('https://dongos.dev'), title: 'Nguyễn Thanh Đông — Software Developer', description: 'Nguyễn Thanh Đông — Software Developer.', robots: { index: false, follow: false }, openGraph: { title: 'Nguyễn Thanh Đông — Software Developer', description: 'Nguyễn Thanh Đông — Software Developer.', images: [{ url: '/images/room-preview.png', width: 1400, height: 1000 }] } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><ExperienceShell />{children}</body></html>; }
