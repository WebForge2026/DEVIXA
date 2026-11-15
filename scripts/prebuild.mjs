/**
 * Generates the static files the host serves directly (no PHP needed for them):
 *   public/robots.txt · public/sitemap.xml · public/manifest.webmanifest
 * Mirrors the former app/robots.ts, app/sitemap.ts and app/manifest.ts.
 */
import { writeFileSync } from 'node:fs';

const SITE_URL = process.env.VITE_SITE_URL ?? 'https://devixa.de';
const locales = ['de', 'en', 'bg'];
const serviceSlugs = ['web-systems', 'automation-integration', 'maintenance-support'];
const articleSlugs = ['ai-agent-automation', 'ai-document-processing', 'ai-email-automation'];
const LAST_CONTENT_UPDATE = '2026-11-11';

const routes = [
  { path: '', priority: '1.0', changeFrequency: 'weekly' },
  ...serviceSlugs.map((slug) => ({ path: `/services/${slug}`, priority: '0.9', changeFrequency: 'monthly' })),
  ...articleSlugs.map((slug) => ({ path: `/insights/${slug}`, priority: '0.7', changeFrequency: 'monthly' })),
  { path: '/imprint', priority: '0.2', changeFrequency: 'yearly' },
  { path: '/privacy', priority: '0.2', changeFrequency: 'yearly' },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/sitemap/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${locales
  .flatMap((locale) =>
    routes.map(
      ({ path, priority, changeFrequency }) => `  <url>
    <loc>${SITE_URL}/${locale}${path}</loc>
${locales.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}${path}" />`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/de${path}" />
    <lastmod>${LAST_CONTENT_UPDATE}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    ),
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
Host: ${SITE_URL}
`;

const manifest = {
  name: 'Devixa — Digital Engineering',
  short_name: 'Devixa',
  description: 'Websites, webshops and business systems — EU-hosted, fixed price.',
  start_url: '/',
  display: 'standalone',
  background_color: '#050507',
  theme_color: '#050507',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
};

writeFileSync('public/sitemap.xml', sitemap);
writeFileSync('public/robots.txt', robots);
writeFileSync('public/manifest.webmanifest', JSON.stringify(manifest, null, 2));
console.log('prebuild: sitemap.xml, robots.txt, manifest.webmanifest → public/');
