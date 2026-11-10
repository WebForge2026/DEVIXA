import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/types';
import { Keycap } from '@/components/ui/Keycap';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

export const Services = ({ locale, services }: { locale: Locale; services: Dictionary['services'] }) => (
  <section id="services" aria-labelledby="services-title" className="relative px-4 py-28 md:px-8">
    <div className="mx-auto max-w-[1600px]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SectionLabel index="02">{services.label}</SectionLabel>
          <h2 id="services-title" className="type-display mt-5 max-w-[20ch] text-[clamp(1.8rem,4vw,4rem)]">
            {services.title}
          </h2>
        </div>
        <p className="max-w-sm text-fg/70">{services.intro}</p>
      </div>

      <Reveal className="mt-14 grid gap-6 lg:grid-cols-3">
        {services.items.map((service, i) => (
          <div key={service.slug} data-reveal>
            <SpotlightCard beam className="flex h-full flex-col">
              <Link href={`/${locale}/services/${service.slug}`} className="flex h-full flex-col p-7 md:p-8" aria-label={`${services.open}: ${service.name}`}>
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">
                  <span>0{i + 1} · {service.category}</span>
                  <ArrowUpRight size={18} className="text-crimson transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
                <h3 className="type-display mt-10 text-[clamp(1.5rem,2.4vw,2.3rem)]">{service.name}</h3>
                <p className="mt-4 text-fg/75">{service.subheadline}</p>

                <ul className="mt-8 space-y-2 border-t border-line/15 pt-6">
                  {service.pains.map((pain) => (
                    <li key={pain.title} className="flex items-start gap-3 font-mono text-[12px] uppercase tracking-[0.08em]">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-crimson" />
                      <span className="text-fg/80">{pain.title}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-wrap gap-2 pt-10">
                  {service.stack.slice(0, 5).map((tech) => (
                    <Keycap key={tech}>{tech}</Keycap>
                  ))}
                </div>
                <span className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em]">
                  <span className="h-px w-8 bg-crimson transition-all duration-300 group-hover:w-14" /> {services.open}
                </span>
              </Link>
            </SpotlightCard>
          </div>
        ))}
      </Reveal>
    </div>
  </section>
);
