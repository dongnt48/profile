export type AppId = 'about' | 'projects' | 'experience' | 'skills' | 'contact';
export type WindowId = AppId | `project:${string}`;
export type Position = { x: number; y: number };
export type DesktopWindow = { id: WindowId; appId: AppId; minimized: boolean; maximized: boolean; zIndex: number; position: Position };
export type ExperienceMode = 'welcome' | 'room' | 'os';
