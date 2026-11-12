import type { MetadataRoute } from 'next';
import { isIndexable } from '@/lib/seo';
import { site } from '@/lib/site';

/** /robots.txt — allows all crawlers on production, blocks Vercel preview deployments. */
const robots = (): MetadataRoute.Robots =>
  isIndexable
    ? {
        rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
        sitemap: `${site.url}/sitemap.xml`,
        host: site.url,
      }
    : { rules: [{ userAgent: '*', disallow: '/' }] };

export default robots;
