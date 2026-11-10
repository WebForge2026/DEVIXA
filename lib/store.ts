/**
 * Frame-level shared state between the DOM (Lenis, pointer, GSAP) and the WebGL scene.
 * It is a plain mutable object on purpose: it is written every frame and must never
 * trigger React renders.
 */
export const motion = {
  /** Normalised pointer, -1..1 on both axes (y up). */
  pointer: { x: 0, y: 0 },
  /** Pointer velocity in normalised units per second. */
  pointerVelocity: { x: 0, y: 0 },
  /** Lenis scroll velocity (px per frame) and progress through the page. */
  scrollVelocity: 0,
  scroll: 0,
  scrollProgress: 0,
  /** Hero progress 0..1 (how far the hero has been scrolled out). */
  hero: 0,
  /** Act blend: 0 = Industrial Slate, 1 = Obsidian Darkroom. Tweened by GSAP. */
  dark: 0,
  /** Red optical flare energy, spiked on star click and decayed in the scene. */
  flare: 0,
  reducedMotion: false,
};
