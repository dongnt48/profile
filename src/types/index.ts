export type AppId = 'about' | 'projects' | 'experience' | 'skills' | 'gallery' | 'terminal' | 'contact' | 'settings';
export type WindowId = AppId | `project:${string}`;
export type Position = { x: number; y: number };
export type DesktopWindow = { id: WindowId; appId: AppId; title?: string; minimized: boolean; maximized: boolean; zIndex: number; position: Position };
export type ExperienceMode = 'welcome' | 'room' | 'os';
