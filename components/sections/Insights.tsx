import { ArrowUpRight, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import type { Article } from '@/lib/i18n/articles/types';
import type { Dictionary } from '@/lib/i18n/types';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

type InsightsProps = {
  locale: Locale;
  insights: Dictionary['insights'];
  articles: Article[];
  index?: string;
  heading?: string;
};

export const Insights = ({ locale, insights, articles, index = '06', heading = insights.title }: InsightsProps) => (
  <section id="insights" aria-labelledby="insights-title" className="relative px-4 py-28 md:px-8">
    <div className="mx-auto max-w-[1600px]">
      <SectionLabel index={index}>{insights.label}</SectionLabel>
      <h2 id="insights-title" className="type-display mt-5 text-[clamp(1.8rem,4vw,4rem)]">
        {heading}
      </h2>
      <Reveal className="mt-12 grid gap-6 md:grid-cols-3">
        {articles.map((article, i) => (
          <article key={article.slug} data-reveal>
            <SpotlightCard className="h-full">
              <Link href={`/${locale}/insights/${article.slug}`} className="flex h-full min-h-[300px] flex-col justify-between p-7">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">
                  <span className="text-crimson">{article.category}</span>
                  <span>N°{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-10 text-2xl font-semibold leading-tight tracking-tight">{article.title}</h3>
                <div className="mt-8 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">
                  <span className="flex items-center gap-2">
                    <Clock size={12} /> {article.readMinutes} {insights.minutes}
                  </span>
                  <span className="flex items-center gap-1.5 text-fg transition-colors group-hover:text-crimson">
                    {insights.read} <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            </SpotlightCard>
          </article>
        ))}
      </Reveal>
    </div>
  </section>
);
