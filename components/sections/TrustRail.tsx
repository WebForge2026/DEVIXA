import { BadgeCheck, Eye, Globe2, LifeBuoy, ShieldCheck } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n/types';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';

const ICONS = [BadgeCheck, Eye, Globe2, ShieldCheck, LifeBuoy];

/** The five operating guarantees, presented as engraved instrument plates. */
export const TrustRail = ({ trust }: { trust: Dictionary['trust'] }) => (
  <section aria-labelledby="trust-title" className="relative px-4 py-20 md:px-8">
    <div className="mx-auto max-w-[1600px]">
      <h2 id="trust-title" className="sr-only">
        {trust.label}
      </h2>
      <SectionLabel index="00">{trust.label}</SectionLabel>
      <Reveal className="mt-8 grid border-l border-t border-line/30 sm:grid-cols-2 lg:grid-cols-5">
        {trust.items.map((item, i) => {
          const Icon = ICONS[i] ?? BadgeCheck;
          return (
            <div key={item} data-reveal className="group relative flex min-h-[220px] flex-col justify-between border-b border-r border-line/30 bg-bg/50 p-5 backdrop-blur-sm transition-colors duration-300 hover:bg-fg hover:text-bg">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em]">
                <span>G-0{i + 1}</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-crimson shadow-[0_0_8px_#FF2A2A]" /> ON
                </span>
              </div>
              <Icon size={28} strokeWidth={1.25} className="my-6 text-crimson" />
              <p className="text-[15px] font-medium leading-snug">{item}</p>
              {/* Screw heads */}
              {['left-1.5 top-1.5', 'right-1.5 top-1.5', 'left-1.5 bottom-1.5', 'right-1.5 bottom-1.5'].map((pos) => (
                <span key={pos} aria-hidden className={`absolute ${pos} h-1 w-1 rounded-full bg-current opacity-30`} />
              ))}
            </div>
          );
        })}
      </Reveal>
      <div aria-hidden className="mt-10 overflow-hidden border-y border-line/30 py-3">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-mono text-xs uppercase tracking-[0.3em]">
          {[...trust.items, ...trust.items].map((item, i) => (
            <span key={i} className="flex items-center gap-10">
              {item}
              <span className="text-crimson">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
);
