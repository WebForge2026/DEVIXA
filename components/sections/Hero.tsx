'use client';

import { gsap } from 'gsap';
import { ArrowDownRight, ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Dictionary } from '@/lib/i18n/types';
import { MagneticButton } from '@/components/ui/MagneticButton';

const SPECS = [
  ['LOC', 'BG · EU'],
  ['MKT', 'DE · BG · PL'],
  ['LANG', 'EN / DE / BG'],
  ['HOST', 'EU-ONLY'],
] as const;

export const Hero = ({ hero }: { hero: Dictionary['hero'] }) => {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('[data-line] > span', { yPercent: 115, rotate: 2, duration: 1.4, stagger: 0.09 }, 0.15)
        .from('[data-fade]', { autoAlpha: 0, y: 24, duration: 1, stagger: 0.06 }, 0.55)
        .from('[data-rule]', { scaleX: 0, transformOrigin: 'left', duration: 1.4, ease: 'expo.inOut' }, 0);
      // Headline drifts apart as the hero scrolls out.
      gsap.to('[data-line]', {
        xPercent: (i) => (i % 2 === 0 ? -6 : 6),
        ease: 'none',
        scrollTrigger: { trigger: node, start: 'top top', end: 'bottom top', scrub: true },
      });
    }, node);
    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" ref={root} className="relative flex min-h-[100svh] flex-col justify-between px-4 pb-8 pt-24 md:px-8 md:pt-28">
      <div className="mx-auto flex w-full max-w-[1600px] items-start justify-between gap-6 font-mono text-[10px] uppercase tracking-[0.25em] text-fg/70 md:text-[11px]">
        <p data-fade className="max-w-[28ch]">{hero.eyebrow}</p>
        <p data-fade className="hidden text-right md:block">
          N 42.6977° / E 23.3219°
          <br />
          Sofia · <span className="text-crimson">EU / GDPR</span>
        </p>
      </div>

      <div className="mx-auto w-full max-w-[1600px]">
        <div data-rule className="mb-6 h-px w-full bg-fg" />
        <h1 className="type-display text-[clamp(2.3rem,7.4vw,8.75rem)]">
          {hero.headline.map((line, i) => (
            <span key={line} data-line className="block overflow-hidden pb-[0.04em]">
              <span className={i === 1 ? 'inline-block type-outline' : 'inline-block'}>{line}</span>
            </span>
          ))}
        </h1>
        <div data-rule className="mt-6 h-px w-full bg-fg" />
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] gap-8 pt-8 md:grid-cols-12 md:items-end">
        <p data-fade className="max-w-xl self-end bg-bg/70 p-3 text-lg leading-snug text-fg backdrop-blur-md md:col-span-5 md:-ml-3 md:text-xl">
          {hero.sub}
        </p>
        <div data-fade className="flex flex-wrap gap-4 md:col-span-4">
          <MagneticButton href="#contact" variant="solid">
            {hero.ctaPrimary} <ArrowRight size={14} />
          </MagneticButton>
          <MagneticButton href="#estimate" variant="ghost">
            {hero.ctaSecondary}
          </MagneticButton>
        </div>
        <dl data-fade className="grid grid-cols-2 border-l border-t border-line/30 font-mono text-[10px] uppercase tracking-[0.2em] md:col-span-3">
          {SPECS.map(([k, v]) => (
            <div key={k} className="border-b border-r border-line/30 px-3 py-2">
              <dt className="text-fg/50">{k}</dt>
              <dd className="text-fg">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-[1600px] items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">
        <span data-fade className="flex items-center gap-2">
          <ArrowDownRight size={14} className="text-crimson" /> {hero.scroll}
        </span>
        <span data-fade className="hidden md:inline">Creative Solutions 88 EOOD · EU</span>
      </div>
    </section>
  );
};
