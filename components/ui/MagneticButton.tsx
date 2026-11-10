'use client';

import { gsap } from 'gsap';
import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  type?: 'button' | 'submit';
  variant?: 'solid' | 'ghost' | 'crimson';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  strength?: number;
};

const variants = {
  solid: 'bg-fg text-bg',
  ghost: 'border border-fg/80 text-fg bg-bg/60 backdrop-blur-md',
  crimson: 'bg-crimson text-obsidian shadow-[0_0_40px_-8px_#FF2A2A]',
} as const;

/** CTA that is pulled toward the cursor and snaps back with a fast elastic release. */
export const MagneticButton = ({ children, href, type = 'button', variant = 'solid', className, disabled, onClick, strength = 0.4 }: MagneticButtonProps) => {
  const shell = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = shell.current;
    if (!node || !window.matchMedia('(pointer: fine)').matches) return;

    const move = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      gsap.to(node, { x: dx * strength, y: dy * strength, duration: 0.35, ease: 'power3.out' });
      gsap.to(label.current, { x: dx * strength * 0.35, y: dy * strength * 0.35, duration: 0.35, ease: 'power3.out' });
    };
    const leave = () => {
      gsap.to([node, label.current], { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1.2, 0.28)' });
    };

    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', leave);
    return () => {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', leave);
    };
  }, [strength]);

  const classes = cn(
    'group relative inline-flex select-none items-center gap-3 overflow-hidden px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.22em] transition-[transform,box-shadow,background-color] duration-200 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    className,
  );

  const inner = (
    <>
      <span aria-hidden className="absolute inset-0 -translate-x-[101%] bg-crimson transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:translate-x-0" />
      <span ref={label} className="relative z-10 inline-flex items-center gap-3 transition-colors duration-300 group-hover:text-obsidian">
        {children}
      </span>
    </>
  );

  return (
    <span ref={shell} className="inline-block p-2 -m-2" data-cursor="lens">
      {href ? (
        <Link href={href} className={classes} onClick={onClick}>
          {inner}
        </Link>
      ) : (
        <button type={type} className={classes} disabled={disabled} onClick={onClick}>
          {inner}
        </button>
      )}
    </span>
  );
};
