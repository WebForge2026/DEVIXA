import type { MetadataRoute } from 'next';
import { articleSlugs } from '@/lib/i18n/articles/types';
import { locales } from '@/lib/i18n/config';
import { serviceSlugs, site } from '@/lib/site';

/** Bump when content changes significantly; tells crawlers when to revisit. */
const LAST_CONTENT_UPDATE = new Date('2026-11-11');

const routes: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  ...serviceSlugs.map((slug) => ({ path: `/services/${slug}`, priority: 0.9, changeFrequency: 'monthly' as const })),
  ...articleSlugs.map((slug) => ({ path: `/insights/${slug}`, priority: 0.7, changeFrequency: 'monthly' as const })),
  { path: '/imprint', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
];

/** /sitemap.xml — every public route in every language, with hreflang alternates. */
const sitemap = (): MetadataRoute.Sitemap =>
  locales.flatMap((locale) =>
    routes.map(({ path, priority, changeFrequency }) => ({
      url: `${site.url}/${locale}${path}`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${path}`])),
      },
    })),
  );

export default sitemap;
