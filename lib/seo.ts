import type { Metadata } from 'next';
import { locales, type Locale } from './i18n/config';
import { site } from './site';

/** hreflang codes: language only, so a page targets all German/English/Bulgarian speakers. */
const hreflang: Record<Locale, string> = { de: 'de', en: 'en', bg: 'bg' };
const ogLocale: Record<Locale, string> = { de: 'de_DE', en: 'en_GB', bg: 'bg_BG' };

/** Production (Vercel "production" or any non-Vercel host). Preview deployments must not be indexed. */
export const isIndexable = process.env.VERCEL_ENV !== 'preview';

export const absoluteUrl = (path: string) => new URL(path, site.url).toString();

type PageSeo = {
  locale: Locale;
  /** Path after the locale, starting with "/" or "" for the home page. */
  path: string;
  title: string;
  description: string;
  type?: 'website' | 'article';
  /** Use the title as-is (home page) instead of appending "| Devixa". */
  absoluteTitle?: boolean;
  noindex?: boolean;
};

/**
 * Complete per-page metadata: title, description, canonical, hreflang alternates,
 * Open Graph and Twitter card. The OG/Twitter image comes from app/[locale]/opengraph-image.tsx.
 */
export const pageMetadata = ({ locale, path, title, description, type = 'website', absoluteTitle = false, noindex = false }: PageSeo): Metadata => {
  const url = `/${locale}${path}`;
  const fullTitle = absoluteTitle ? title : `${title} | Devixa`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(locales.map((l) => [hreflang[l], `/${l}${path}`])),
        'x-default': `/de${path}`,
      },
    },
    openGraph: {
      type,
      url,
      siteName: 'Devixa',
      title: fullTitle,
      description,
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      images: [{ url: `/${locale}/opengraph-image`, width: 1200, height: 630, alt: 'Devixa' }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [`/${locale}/twitter-image`] },
    robots: noindex || !isIndexable ? { index: false, follow: true } : { index: true, follow: true },
  };
};
