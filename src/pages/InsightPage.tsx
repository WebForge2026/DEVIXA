import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react';
import Link from '@/components/ui/Link';
import { useParams } from 'react-router-dom';
import { ActController } from '@/components/providers/ActController';
import { Footer } from '@/components/sections/Footer';
import { Insights } from '@/components/sections/Insights';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { getSiteDictionary } from '@/lib/admin/content';
import { getArticle, getArticles } from '@/lib/i18n/articles';
import { htmlLang, type Locale } from '@/lib/i18n/config';
import { Seo } from '@/src/lib/seo';
import { site } from '@/lib/site';
import { NotFound } from '@/src/NotFound';

/** /:locale/insights/:slug — exact port of the former app/[locale]/insights/[slug]/page.tsx. */
export const InsightPage = ({ locale }: { locale: Locale }) => {
  const { slug } = useParams();
  const article = getArticle(locale, slug ?? '');
  if (!article) return <NotFound />;
  const dict = getSiteDictionary(locale);
  const others = getArticles(locale).filter((a) => a.slug !== article.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.lede,
    inLanguage: htmlLang[locale],
    publisher: { '@type': 'Organization', name: site.brand, legalName: site.legalEntity },
    mainEntityOfPage: `${site.url}/${locale}/insights/${article.slug}`,
  };

  return (
    <>
      <Seo locale={locale} path={`/insights/${article.slug}`} title={article.title} description={article.metaDescription} type="article" />
      <ActController initial="dark" veil />
      <main id="main" className="px-4 pb-10 pt-28 md:px-8">
        <article className="mx-auto max-w-[1600px]">
          <Link href={`/${locale}#insights`} className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-fg/60 hover:text-crimson">
            <ArrowLeft size={14} /> {dict.insights.back}
          </Link>

          <header className="mt-10 grid gap-10 border-b border-line/15 pb-14 lg:grid-cols-12">
            <div className="lg:col-span-9">
              <SectionLabel index="INS">{article.category}</SectionLabel>
              <h1 className="type-display mt-6 text-[clamp(1.9rem,4.6vw,4.75rem)]">{article.title}</h1>
            </div>
            <p className="flex items-end gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-fg/60 lg:col-span-3 lg:justify-end">
              <Clock size={14} className="text-crimson" /> {article.readMinutes} {dict.insights.minutes}
            </p>
          </header>

          <div className="grid gap-12 py-16 lg:grid-cols-12">
            <aside className="lg:col-span-3">
              <nav aria-label={article.title} className="sticky top-28 hidden space-y-3 font-mono text-[11px] uppercase tracking-[0.15em] text-fg/60 lg:block">
                {article.sections.map((section, i) => (
                  <a key={section.heading} href={`#s${i + 1}`} className="flex gap-3 hover:text-crimson">
                    <span className="text-crimson">{String(i + 1).padStart(2, '0')}</span>
                    <span>{section.heading}</span>
                  </a>
                ))}
              </nav>
            </aside>
            <div className="max-w-[68ch] lg:col-span-7">
              <p className="text-xl leading-relaxed text-fg md:text-2xl">{article.lede}</p>
              {article.sections.map((section, i) => (
                <section key={section.heading} id={`s${i + 1}`} className="mt-14 scroll-mt-28">
                  <h2 className="flex items-baseline gap-4 text-2xl font-semibold tracking-tight md:text-3xl">
                    <span className="font-mono text-sm text-crimson">{String(i + 1).padStart(2, '0')}</span>
                    {section.heading}
                  </h2>
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)} className="mt-5 text-lg leading-relaxed text-fg/80">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
              <div className="mt-16 border-l-2 border-crimson bg-panel/70 p-6 backdrop-blur-md md:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">{dict.insights.takeaway}</p>
                <p className="mt-3 text-xl font-medium leading-snug">{article.takeaway}</p>
              </div>
              <div className="mt-12">
                <MagneticButton href={`/${locale}#contact`} variant="crimson">
                  {dict.nav.cta} <ArrowUpRight size={14} />
                </MagneticButton>
              </div>
            </div>
          </div>
        </article>
        <Insights locale={locale} insights={dict.insights} articles={others} index="+" heading={dict.insights.more} />
      </main>
      <Footer locale={locale} footer={dict.footer} nav={dict.nav} consentLabel={dict.consent.settings} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
};
