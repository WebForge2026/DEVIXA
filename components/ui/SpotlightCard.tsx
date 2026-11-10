'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Panel with a crimson spotlight that tracks the cursor and an optional rotating border beam. */
export const SpotlightCard = ({ children, className, beam = false }: { children: ReactNode; className?: string; beam?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    node.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} onPointerMove={onPointerMove} data-cursor="lens" className={cn('spotlight-card group relative isolate overflow-hidden border border-line/25 bg-panel/70 backdrop-blur-md', beam && 'border-beam', className)}>
      <div aria-hidden className="spotlight-glow pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {children}
    </div>
  );
};
