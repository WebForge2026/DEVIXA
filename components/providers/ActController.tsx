'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';
import { motion } from '@/lib/store';

type Act = 'light' | 'dark';

const applyAct = (act: Act, immediate = false) => {
  const root = document.documentElement;
  if (root.dataset.act === act && !immediate) return;
  root.dataset.act = act;
  gsap.to(motion, { dark: act === 'dark' ? 1 : 0, duration: immediate ? 0 : 0.9, ease: 'expo.inOut', overwrite: true });

  if (immediate || motion.reducedMotion) return;
  // Cinematic cut: a crimson scan line sweeps the viewport as the lights die.
  const wipe = document.getElementById('act-wipe');
  if (!wipe) return;
  gsap.fromTo(
    wipe,
    { yPercent: act === 'dark' ? -100 : 100, autoAlpha: 1 },
    { yPercent: act === 'dark' ? 100 : -100, duration: 0.85, ease: 'expo.inOut', onComplete: () => gsap.set(wipe, { autoAlpha: 0 }) },
  );
};

/**
 * Owns the Act I → Act II inversion.
 * - `initial`: the act on page load.
 * - `trigger`: optional selector; crossing it flips into the darkroom (and back on scroll up).
 * Also publishes hero progress (0..1) for the WebGL camera.
 */
export const ActController = ({ initial = 'light', trigger, hero, veil = false }: { initial?: Act; trigger?: string; hero?: string; veil?: boolean }) => {
  useEffect(() => {
    applyAct(initial, true);
    // Reading pages dim the 3D layer so long text stays legible.
    document.documentElement.dataset.veil = veil ? 'on' : 'off';
    const triggers: ScrollTrigger[] = [];

    if (trigger) {
      triggers.push(
        ScrollTrigger.create({
          trigger,
          start: 'top 55%',
          onEnter: () => applyAct('dark'),
          onLeaveBack: () => applyAct('light'),
        }),
      );
    }

    if (hero) {
      triggers.push(
        ScrollTrigger.create({
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          onUpdate: (self) => {
            motion.hero = self.progress;
          },
        }),
      );
    } else {
      motion.hero = 1;
    }

    return () => {
      triggers.forEach((t) => t.kill());
      motion.hero = 0;
    };
  }, [initial, trigger, hero, veil]);

  return null;
};
