'use client';

import { gsap } from 'gsap';
import { useEffect } from 'react';
import { motion } from '@/lib/store';

/** Feeds normalised pointer position and velocity into the shared motion store. */
export const PointerBridge = () => {
  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastTime = performance.now();

    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -((event.clientY / window.innerHeight) * 2 - 1);
      const now = performance.now();
      const dt = Math.max(8, now - lastTime) / 1000;
      // Exponential smoothing keeps the velocity signal usable as "inertia".
      motion.pointerVelocity.x += ((x - lastX) / dt - motion.pointerVelocity.x) * 0.35;
      motion.pointerVelocity.y += ((y - lastY) / dt - motion.pointerVelocity.y) * 0.35;
      motion.pointer.x = x;
      motion.pointer.y = y;
      lastX = x;
      lastY = y;
      lastTime = now;
    };

    const decay = () => {
      motion.pointerVelocity.x *= 0.88;
      motion.pointerVelocity.y *= 0.88;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    gsap.ticker.add(decay);
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.ticker.remove(decay);
    };
  }, []);

  return null;
};
