'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Cable, Cpu, Globe, LifeBuoy, ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Dictionary } from '@/lib/i18n/types';
import { cn } from '@/lib/utils';
import { Keycap } from '@/components/ui/Keycap';
import { SectionLabel } from '@/components/ui/SectionLabel';

gsap.registerPlugin(ScrollTrigger);

const ICONS = [Globe, ShoppingCart, Cpu, Cable, LifeBuoy];

/** Scrollytelling: a pinned, horizontally travelling 5-stage pipeline (vertical stack on small screens). */
export const Journey = ({ journey }: { journey: Dictionary['journey'] }) => {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const node = section.current;
    const rail = track.current;
    if (!node || !rail) return;
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const distance = () => rail.scrollWidth - window.innerWidth;
      const steps = journey.steps.length;
      gsap.to(rail, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: node,
          pin: true,
          scrub: 0.8,
          start: 'top top',
          end: () => `+=${distance()}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(bar.current, { scaleX: self.progress });
            setActive(Math.min(steps - 1, Math.floor(self.progress * steps * 0.999)));
          },
        },
      });
    });

    mm.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
      gsap.utils.toArray<HTMLElement>('[data-step]', node).forEach((step, i) => {
        ScrollTrigger.create({ trigger: step, start: 'top 60%', onEnter: () => setActive(i), onEnterBack: () => setActive(i) });
      });
    });

    return () => mm.revert();
  }, [journey.steps.length]);

  return (
    <section id="journey" ref={section} aria-labelledby="journey-title" className="relative overflow-hidden lg:h-screen">
      <div className="flex h-full flex-col px-4 pt-24 md:px-8 lg:pt-20">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionLabel index="01">{journey.label}</SectionLabel>
            <h2 id="journey-title" className="type-display mt-5 max-w-[18ch] text-[clamp(1.8rem,3.6vw,3.6rem)]">
              {journey.title}
            </h2>
          </div>
          <p className="max-w-sm text-fg/70">{journey.intro}</p>
        </div>

        {/* Pipeline rail */}
        <div className="mx-auto mt-8 hidden w-full max-w-[1600px] lg:block" aria-hidden>
          <div className="relative h-px bg-line/20">
            <div ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-crimson shadow-[0_0_12px_#FF2A2A]" />
          </div>
          <div className="mt-3 grid grid-cols-5 font-mono text-[10px] uppercase tracking-[0.2em]">
            {journey.steps.map((step, i) => (
              <span key={step.title} className={cn('flex items-center gap-2 transition-colors', i <= active ? 'text-fg' : 'text-fg/35')}>
                <span className={cn('h-2 w-2 border transition-colors', i <= active ? 'border-crimson bg-crimson' : 'border-line/40')} />
                0{i + 1} {step.tag}
              </span>
            ))}
          </div>
        </div>

        <div ref={track} className="mt-10 flex flex-col gap-6 pb-16 lg:mt-8 lg:flex-1 lg:flex-row lg:gap-0 lg:pb-10 lg:pl-[max(2rem,calc((100vw-1600px)/2))]">
          {journey.steps.map((step, i) => {
            const Icon = ICONS[i] ?? Globe;
            const on = i === active;
            return (
              <article
                key={step.title}
                data-step
                className={cn(
                  'relative flex shrink-0 flex-col justify-between border border-line/20 bg-panel/70 p-6 backdrop-blur-md transition-[border-color,box-shadow] duration-500 md:p-10 lg:mr-6 lg:h-full lg:w-[min(72vw,980px)]',
                  on && 'border-crimson/70 shadow-[0_0_80px_-30px_#FF2A2A]',
                )}
                data-cursor="lens"
              >
                <header className="flex items-start justify-between gap-6">
                  <span className="chrome-text type-display text-[clamp(4.5rem,11vw,11rem)] leading-[0.8]">0{i + 1}</span>
                  <div className="flex flex-col items-end gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">
                    <span className="flex items-center gap-2">
                      <span className={cn('h-1.5 w-1.5 rounded-full', on ? 'animate-blink bg-crimson shadow-[0_0_8px_#FF2A2A]' : 'bg-fg/30')} />
                      Stage {i + 1}/5
                    </span>
                    <Keycap accent={on}>
                      <Icon size={16} strokeWidth={1.75} />
                    </Keycap>
                  </div>
                </header>
                {/* Stage meter: capacity lights up as the system grows */}
                <div aria-hidden className="mt-10 hidden flex-1 flex-col justify-center gap-4 lg:flex">
                  <div className="grid grid-cols-5 gap-2">
                    {journey.steps.map((_, s) => (
                      <span key={s} className={cn('h-10 border transition-colors duration-500', s <= i ? 'border-crimson bg-crimson/80 shadow-[0_0_24px_-6px_#FF2A2A]' : 'border-line/20')} />
                    ))}
                  </div>
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-fg/40">
                    <span>SYS.CAPACITY</span>
                    <span>{(i + 1) * 20}%</span>
                  </div>
                </div>
                <div className="mt-10 grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-end">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">{step.tag}</p>
                    <h3 className="type-display mt-3 text-[clamp(1.6rem,3.2vw,3.25rem)]">{step.title}</h3>
                  </div>
                  <p className="text-base leading-relaxed text-fg/80 md:text-lg">{step.body}</p>
                </div>
                {/* Connector to next stage */}
                {i < journey.steps.length - 1 ? (
                  <span aria-hidden className="absolute -right-6 top-1/2 hidden h-px w-6 bg-crimson/60 lg:block" />
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
