import { AlertTriangle, ArrowLeft, ArrowUpRight, CalendarClock, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActController } from '@/components/providers/ActController';
import { Footer } from '@/components/sections/Footer';
import { Keycap } from '@/components/ui/Keycap';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { htmlLang, isLocale, locales, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n';
import { serviceSlugs } from '@/lib/site';

type Params = { locale: string; slug: string };

export const dynamicParams = false;

export const generateStaticParams = () => locales.flatMap((locale) => serviceSlugs.map((slug) => ({ locale, slug })));

const findService = ({ locale, slug }: Params) => {
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale);
  const service = dict.services.items.find((item) => item.slug === slug);
  return service ? { dict, service, locale } : null;
};

export const generateMetadata = ({ params }: { params: Params }): Metadata => {
  const found = findService(params);
  if (!found) return {};
  return {
    title: found.service.name,
    description: found.service.subheadline,
    alternates: {
      canonical: `/${params.locale}/services/${params.slug}`,
      languages: Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}/services/${params.slug}`])),
    },
  };
};

const ServicePage = ({ params }: { params: Params }) => {
  const found = findService(params);
  if (!found) notFound();
  const { dict, service, locale } = found;
  const t = dict.servicePage;
  const index = dict.services.items.findIndex((item) => item.slug === service.slug);
  const others = dict.services.items.filter((item) => item.slug !== service.slug);

  return (
    <>
      <ActController initial="dark" veil />
      <main id="main" className="px-4 pb-28 pt-28 md:px-8">
        <div className="mx-auto max-w-[1600px]">
          <Link href={`/${locale as Locale}#services`} className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-fg/60 hover:text-crimson">
            <ArrowLeft size={14} /> {t.back}
          </Link>

          <header className="mt-10 grid gap-10 border-b border-line/15 pb-16 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <SectionLabel index={`0${index + 1}`}>{service.category}</SectionLabel>
              <h1 className="type-display mt-6 text-[clamp(1.7rem,4vw,4.5rem)]">{service.headline}</h1>
            </div>
            <div className="flex flex-col justify-end gap-8 lg:col-span-4">
              <p className="text-lg leading-relaxed text-fg/80">{service.subheadline}</p>
              <MagneticButton href={`/${locale}#contact`} variant="crimson">
                {t.cta} <ArrowUpRight size={14} />
              </MagneticButton>
            </div>
          </header>

          {/* Fault indicators */}
          <section aria-labelledby="pains" className="py-20">
            <h2 id="pains" className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">{t.pains}</h2>
            <Reveal className="mt-8 grid gap-px border border-line/15 bg-line/15 md:grid-cols-3">
              {service.pains.map((pain, i) => (
                <div key={pain.title} data-reveal className="relative bg-panel p-8">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-fg/50">0{i + 1}</span>
                  <AlertTriangle size={30} strokeWidth={1.25} className="mt-8 text-crimson" />
                  <h3 className="mt-6 text-2xl font-semibold tracking-tight">{pain.title}</h3>
                  <p className="mt-3 text-fg/70">{pain.body}</p>
                </div>
              ))}
            </Reveal>
          </section>

          {service.approach ? (
            <section aria-labelledby="approach" className="grid gap-8 border-t border-line/15 py-20 lg:grid-cols-12">
              <h2 id="approach" className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson lg:col-span-3">{t.approach}</h2>
              <p className="type-display text-[clamp(1.4rem,2.6vw,2.6rem)] leading-tight lg:col-span-9">{service.approach}</p>
            </section>
          ) : null}

          <section aria-labelledby="included" className="border-t border-line/15 py-20">
            <h2 id="included" className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">{t.included}</h2>
            <Reveal className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {service.included.map((item, i) => (
                <div key={item} data-reveal>
                  <SpotlightCard className="flex h-full items-start gap-5 p-6">
                    <span className="font-mono text-xs text-crimson">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-lg font-medium leading-snug">{item}</span>
                  </SpotlightCard>
                </div>
              ))}
            </Reveal>
          </section>

          <section className="grid gap-12 border-t border-line/15 py-20 lg:grid-cols-2">
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">{t.stack}</h2>
              <div className="mt-8 flex flex-wrap gap-3">
                {service.stack.map((tech, i) => (
                  <Keycap key={tech} accent={i === 0}>{tech}</Keycap>
                ))}
              </div>
              {service.timeline ? (
                <div className="mt-12">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">{t.timeline}</h3>
                  <div className="mt-6 flex items-center gap-4">
                    <CalendarClock size={22} className="text-crimson" />
                    <p className="text-lg">{service.timeline}</p>
                  </div>
                  <div aria-hidden className="mt-6 grid gap-1" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                    {Array.from({ length: 16 }, (_, w) => (
                      <span key={w} className={`h-6 ${w < 8 ? 'bg-crimson' : w < 16 ? 'bg-crimson/30' : ''}`} />
                    ))}
                  </div>
                  <div aria-hidden className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-fg/50">
                    <span>W01</span>
                    <span>W08</span>
                    <span>W16</span>
                  </div>
                </div>
              ) : null}
            </div>
            {service.caseStudy ? (
              <SpotlightCard beam className="p-8 md:p-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">{t.caseStudy}</p>
                <h3 className="type-display mt-8 text-[clamp(2rem,4vw,3.75rem)]">{service.caseStudy.name}</h3>
                <p className="mt-6 text-lg text-fg/80">{service.caseStudy.body}</p>
              </SpotlightCard>
            ) : null}
          </section>

          {service.faq ? (
            <section aria-labelledby="faq" className="border-t border-line/15 py-20">
              <h2 id="faq" className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">{t.faq}</h2>
              <div className="mt-8 border-t border-line/15">
                {service.faq.map((item) => (
                  <details key={item.q} className="group border-b border-line/15">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-xl font-medium tracking-tight md:text-2xl [&::-webkit-details-marker]:hidden" data-cursor="lens">
                      {item.q}
                      <Plus size={20} className="shrink-0 text-crimson transition-transform duration-300 group-open:rotate-45" />
                    </summary>
                    <p className="max-w-3xl pb-8 text-fg/75">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-8 border-t border-line/15 pt-20 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="type-display text-[clamp(1.6rem,3vw,3rem)]">{t.ctaBody}</p>
              <div className="mt-8">
                <MagneticButton href={`/${locale}#contact`} variant="crimson">
                  {t.cta} <ArrowUpRight size={14} />
                </MagneticButton>
              </div>
            </div>
            <div className="grid gap-4 lg:col-span-6">
              {others.map((other) => (
                <Link key={other.slug} href={`/${locale}/services/${other.slug}`} className="group flex items-center justify-between border border-line/15 p-6 transition-colors hover:border-crimson" data-cursor="lens">
                  <span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-fg/50">{other.category}</span>
                    <span className="mt-2 block text-xl font-semibold">{other.name}</span>
                  </span>
                  <ArrowUpRight className="text-crimson transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer locale={locale} footer={dict.footer} nav={dict.nav} />
    </>
  );
};

export default ServicePage;
