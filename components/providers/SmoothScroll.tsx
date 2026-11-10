'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { motion } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/**
 * Lenis drives the scroll; GSAP's ticker drives Lenis. One clock for scroll,
 * ScrollTrigger and every tween, so nothing drifts out of sync.
 */
export const SmoothScroll = ({ children }: { children: ReactNode }) => {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    motion.reducedMotion = reduced;

    const instance = new Lenis({
      duration: reduced ? 0 : 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduced,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
      anchors: { offset: -72 },
    });

    instance.on('scroll', ScrollTrigger.update);
    instance.on('scroll', (l: Lenis) => {
      motion.scroll = l.scroll;
      motion.scrollVelocity = l.velocity;
      motion.scrollProgress = l.progress;
    });

    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);

    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // Route change: jump to top (or hash) and re-measure triggers.
  useEffect(() => {
    if (!lenis) return;
    const hash = window.location.hash;
    if (hash) lenis.scrollTo(hash, { immediate: true, offset: -80 });
    else lenis.scrollTo(0, { immediate: true });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname, lenis]);

  // Velocity decays to zero when scrolling stops (Lenis stops emitting events).
  useEffect(() => {
    const decay = () => {
      motion.scrollVelocity *= 0.9;
    };
    gsap.ticker.add(decay);
    return () => gsap.ticker.remove(decay);
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
};
