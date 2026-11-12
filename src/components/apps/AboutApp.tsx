import { ArrowUpRight, Coffee, Code2, Sprout } from 'lucide-react';
import { profile } from '@/data/profile';
import { useWindowStore } from '@/stores/windowStore';
export function AboutApp() {
  const open = useWindowStore(s => s.open);
  return <div className="about-app app-padding">
    <div className="eyebrow">THE PERSON BEHIND THE PIXELS</div>
    <div className="about-heading"><div><h1>Hi, I’m {profile.name}<span className="accent">.</span></h1><p className="role">{profile.role}</p></div><div className="avatar" aria-label={`Ảnh đại diện của ${profile.name}`}>{profile.initials}<span>hello.</span></div></div>
    <p className="intro">I like making things<br />that feel <em>thoughtful.</em></p>
    <p className="body-copy">{profile.bio}</p>
    <div className="interests"><span><Code2 size={17} /> Building for the web</span><span><Sprout size={17} /> Always growing</span><span><Coffee size={17} /> Slow mornings</span></div>
    <div className="about-bottom"><button className="primary-button" onClick={() => open('projects')}>Explore my projects <ArrowUpRight size={17} /></button><button className="text-button" onClick={() => open('contact')}>Say hello <span>↗</span></button></div>
    {profile.cvUrl && <a className="text-button" href={profile.cvUrl} target="_blank" rel="noreferrer">View CV ↗</a>}
    <p className="sample-note">{profile.note}</p>
  </div>;
}
