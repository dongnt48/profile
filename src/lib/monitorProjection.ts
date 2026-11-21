/** Preserve screen placement while rasterizing HTML at the displayed resolution. */
export function scaleProjectionForLayout(matrix: number[], scale: number): number[] {
  const result = [...matrix];
  // CSS zoom scales projected X/Y; perspective terms stay in logical coordinates.
  for (const index of [0, 1, 4, 5, 12, 13]) result[index] /= scale;
  return result;
}
