import { useEffect } from 'react';
import { locales, type Locale } from '@/lib/i18n/config';
import { site } from '@/lib/site';

/** hreflang codes: language only, so a page targets all German/English/Bulgarian speakers. */
const hreflang: Record<Locale, string> = { de: 'de', en: 'en', bg: 'bg' };
const ogLocale: Record<Locale, string> = { de: 'de_DE', en: 'en_GB', bg: 'bg_BG' };

export const absoluteUrl = (path: string) => new URL(path, site.url).toString();

type SeoProps = {
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

const upsert = (selector: string, create: () => HTMLElement, mutate: (el: HTMLElement) => void) => {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  mutate(el);
};

const setMeta = (attr: 'name' | 'property', key: string, content: string) =>
  upsert(`meta[${attr}="${key}"]`, () => {
    const el = document.createElement('meta');
    el.setAttribute(attr, key);
    return el;
  }, (el) => el.setAttribute('content', content));

const setLink = (rel: string, href: string, extra?: Record<string, string>) =>
  upsert(`link[rel="${rel}"]${extra?.hreflang ? `[hreflang="${extra.hreflang}"]` : ''}`, () => {
    const el = document.createElement('link');
    el.setAttribute('rel', rel);
    return el;
  }, (el) => {
    el.setAttribute('href', href);
    Object.entries(extra ?? {}).forEach(([k, v]) => el.setAttribute(k, v));
  });

/**
 * Runtime equivalent of the old Next.js generateMetadata/pageMetadata:
 * title, description, canonical, hreflang, Open Graph, Twitter card, robots.
 * Applied on every route change by the SPA.
 */
export const Seo = ({ locale, path, title, description, type = 'website', absoluteTitle = false, noindex = false }: SeoProps) => {
  useEffect(() => {
    const url = `/${locale}${path}`;
    const fullTitle = absoluteTitle ? title : `${title} | Devixa`;
    document.title = fullTitle;
    setMeta('name', 'description', description);
    setLink('canonical', absoluteUrl(url));
    locales.forEach((l) => setLink('alternate', absoluteUrl(`/${l}${path}`), { hreflang: hreflang[l] }));
    setLink('alternate', absoluteUrl(`/de${path}`), { hreflang: 'x-default' });
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', absoluteUrl(url));
    setMeta('property', 'og:site_name', 'Devixa');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:locale', ogLocale[locale]);
    setMeta('property', 'og:image', absoluteUrl('/og.png'));
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', absoluteUrl('/og.png'));
    setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');
  }, [locale, path, title, description, type, absoluteTitle, noindex]);
  return null;
};
