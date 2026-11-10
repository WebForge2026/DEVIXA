import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/** Tactile mechanical keycap, used for tech stacks and step glyphs. */
export const Keycap = ({ children, className, accent = false }: { children: ReactNode; className?: string; accent?: boolean }) => (
  <span className={cn('keycap', accent && 'keycap-accent', className)}>
    <span className="keycap-top">{children}</span>
  </span>
);
