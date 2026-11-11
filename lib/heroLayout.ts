/**
 * Shared hero layout for the desktop keycap sphere, used by the 3D scene (placement)
 * and by the hero headline (so the longest line always ends before the sphere).
 */
/** Desktop breakpoint from which the sphere is shown (Tailwind lg). */
export const SPHERE_MIN_WIDTH = 1024;
/** Sphere centre: this fraction of the viewport width to the right of the centre. */
export const SPHERE_OFFSET_X = 0.31;
/** Sphere diameter as a fraction of the viewport height. */
export const SPHERE_HEIGHT = 0.48;

/** Left edge of the sphere in CSS pixels for the given viewport. */
export const sphereLeftEdge = (width: number, height: number) =>
  width / 2 + SPHERE_OFFSET_X * width - (SPHERE_HEIGHT * height) / 2;
