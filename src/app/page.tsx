import { profile } from '@/data/profile';
export default function HomePage() { return <div className="sr-only"><h1>{profile.name} — {profile.role}</h1><p>Profile · Projects · Experience · Skills · Contact</p></div>; }
