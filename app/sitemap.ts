import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/config';
import { articleSlugs } from '@/lib/i18n/articles/types';
import { serviceSlugs, site } from '@/lib/site';

const sitemap = (): MetadataRoute.Sitemap => {
  const paths = ['', ...serviceSlugs.map((slug) => `/services/${slug}`), ...articleSlugs.map((slug) => `/insights/${slug}`), '/imprint', '/privacy'];
  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${site.url}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
  );
};

export default sitemap;
