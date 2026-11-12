export const WELCOME_ZOOM = 0.87;
export const ROOM_ZOOM = 0.72;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 1.25;
export const INTERACTION_ZOOM = 0.275;

export const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
