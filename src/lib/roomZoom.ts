export const WELCOME_ZOOM = 0.87;
export const ROOM_ZOOM = 0.72;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 1.25;
export const INTERACTION_ZOOM = 0.275;

export const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

// Fit the full active screen with a small bezel margin, without moving the camera.
export function monitorFieldOfView(distance: number, aspect: number): number {
  const halfHeight = Math.max(.33 / .82, .745 / (aspect * .88));
  return 2 * Math.atan(halfHeight / distance) * 180 / Math.PI;
}
