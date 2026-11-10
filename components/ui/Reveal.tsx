'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

/** Staggers direct children ([data-reveal]) in when the block enters the viewport. */
export const Reveal = ({ children, className }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const items = node.querySelectorAll('[data-reveal]');
      gsap.from(items.length ? items : node, {
        y: 48,
        autoAlpha: 0,
        clipPath: 'inset(0 0 100% 0)',
        duration: 1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: node, start: 'top 82%', once: true },
        clearProps: 'clipPath',
      });
    }, node);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
};
