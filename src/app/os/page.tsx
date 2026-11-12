import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Desktop — DongOS' };
export default function OSPage() { return <div className="sr-only"><h1>DongOS Desktop</h1><nav aria-label="Profile direct links"><a href="/os/?app=about">About me</a><a href="/os/?app=projects">Projects</a><a href="/os/?app=experience">Experience</a><a href="/os/?app=skills">Tech stack</a><a href="/os/?app=contact">Contact</a></nav></div>; }
