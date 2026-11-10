'use client';

import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { onCursorMode, type CursorMode } from './cursorBus';

/**
 * Precision reticle. Over [data-cursor="lens"] it expands into a refractive glass lens;
 * over the WebGL core it locks on in crimson.
 */
export const Cursor = () => {
  const reticle = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<CursorMode>('default');
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || !reticle.current || !dot.current) return;
    document.documentElement.classList.add('has-custom-cursor');

    const xRing = gsap.quickTo(reticle.current, 'x', { duration: 0.35, ease: 'power3.out' });
    const yRing = gsap.quickTo(reticle.current, 'y', { duration: 0.35, ease: 'power3.out' });
    const xDot = gsap.quickTo(dot.current, 'x', { duration: 0.06, ease: 'none' });
    const yDot = gsap.quickTo(dot.current, 'y', { duration: 0.06, ease: 'none' });

    const move = (event: PointerEvent) => {
      setActive(true);
      xRing(event.clientX);
      yRing(event.clientY);
      xDot(event.clientX);
      yDot(event.clientY);
    };
    const over = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cursor]') : null;
      if (target) setMode((target.dataset.cursor as CursorMode) ?? 'default');
      else if (event.target instanceof Element && event.target.closest('a,button,input,select,textarea,label')) setMode('lens');
      else setMode((current) => (current === 'core' || current === 'drag' ? current : 'default'));
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    const unsubscribe = onCursorMode(setMode);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      unsubscribe();
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <>
      <div ref={reticle} aria-hidden className={cn('pointer-events-none fixed left-0 top-0 z-[100] transition-opacity duration-300', active ? 'opacity-100' : 'opacity-0')}>
        <div
          className={cn(
            'cursor-reticle -translate-x-1/2 -translate-y-1/2 transition-[width,height,border-color,background-color,backdrop-filter,border-radius] duration-300 ease-[cubic-bezier(.2,.9,.2,1)]',
            mode === 'default' && 'h-9 w-9',
            mode === 'lens' && 'cursor-lens h-24 w-24',
            mode === 'core' && 'h-16 w-16 rotate-45 !rounded-none !border-crimson',
            mode === 'drag' && 'h-20 w-20 !border-crimson',
            pressed && 'scale-90',
          )}
        >
          <span className="cursor-tick left-1/2 top-0 h-2 w-px -translate-x-1/2 -translate-y-full" />
          <span className="cursor-tick bottom-0 left-1/2 h-2 w-px -translate-x-1/2 translate-y-full" />
          <span className="cursor-tick left-0 top-1/2 h-px w-2 -translate-x-full -translate-y-1/2" />
          <span className="cursor-tick right-0 top-1/2 h-px w-2 -translate-y-1/2 translate-x-full" />
          {mode === 'drag' ? (
            <span className="absolute inset-0 grid place-items-center font-mono text-[9px] uppercase tracking-[0.2em] text-crimson">drag</span>
          ) : null}
        </div>
      </div>
      <div ref={dot} aria-hidden className={cn('pointer-events-none fixed left-0 top-0 z-[101]', active ? 'opacity-100' : 'opacity-0')}>
        <div className="h-1 w-1 -translate-x-1/2 -translate-y-1/2 bg-crimson" />
      </div>
    </>
  );
};
