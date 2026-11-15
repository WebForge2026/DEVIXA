/**
 * Prerenders every public route into a real HTML file in dist/ (build-time SSR):
 * crawlers receive full content + per-page meta without executing JS, and the
 * same bundle hydrates the markup on load. Runs AFTER `vite build`.
 *
 *   dist/index.html        — generic SPA shell (fallback for /admin, unknown paths)
 *   dist/de.html           — prerendered home (BG, EN likewise)
 *   dist/de/services/web-systems.html, dist/de/insights/<slug>.html, …
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { renderToString } from 'react-dom/server';
import { createElement as h } from 'react';
import { StaticRouter } from 'react-router-dom/server';
import { App } from '../src/App';
import { getDictionary } from '../lib/i18n';
import { getLegal } from '../lib/i18n/legal';
import { getArticle } from '../lib/i18n/articles';
import { getSiteDictionary } from '../lib/admin/content';
import { locales } from '../lib/i18n/config';

const SITE_URL = process.env.VITE_SITE_URL ?? 'https://devixa.de';
const LAST_CONTENT_UPDATE = '2026-11-11';
const hreflang = { de: 'de', en: 'en', bg: 'bg' };
const ogLocale = { de: 'de_DE', en: 'en_GB', bg: 'bg_BG' };
const abs = (p: string) => `${SITE_URL}${p}`;

type Route = { path: string; locale: string; title: string; description: string; type?: 'website' | 'article'; absoluteTitle?: boolean; jsonLd?: object };

const routes: Route[] = [];
for (const locale of locales) {
  const dict = getSiteDictionary(locale);
  const base = getDictionary(locale);
  const after = (p: string) => `/${locale}${p}`;

  routes.push({
    path: after(''),
    locale,
    title: base.meta.title,
    description: dict.meta.description,
    absoluteTitle: true,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Devixa',
      legalName: 'Creative Solutions 88 EOOD',
      url: SITE_URL,
      email: 'office@devixa.de',
      address: { '@type': 'PostalAddress', addressCountry: 'BG' },
      areaServed: ['DE', 'BG', 'PL'],
    },
  });

  for (const service of dict.services.items) {
    routes.push({ path: after(`/services/${service.slug}`), locale, title: service.seoTitle, description: service.subheadline });
  }
  for (const article of [getArticle(locale, 'ai-agent-automation'), getArticle(locale, 'ai-document-processing'), getArticle(locale, 'ai-email-automation')]) {
    if (!article) continue;
    routes.push({
      path: after(`/insights/${article.slug}`),
      locale,
      title: article.title,
      description: article.metaDescription,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.lede,
        inLanguage: locale,
        publisher: { '@type': 'Organization', name: 'Devixa', legalName: 'Creative Solutions 88 EOOD' },
        mainEntityOfPage: abs(after(`/insights/${article.slug}`)),
      },
    });
  }
  routes.push({ path: after('/imprint'), locale, title: getLegal(locale).imprint.title, description: base.meta.imprint });
  routes.push({ path: after('/privacy'), locale, title: getLegal(locale).privacy.title, description: base.meta.privacy });
}

const template = readFileSync('dist/index.html', 'utf8');
const scriptTag = template.match(/<script type="module"[^>]*src="\/assets\/[^"]*"[^>]*><\/script>/)?.[0] ?? '';
const cssTag = template.match(/<link rel="stylesheet"[^>]*href="\/assets\/[^"]*"[^>]*>/)?.[0] ?? '';
const assetLinks = `${cssTag}\n    ${scriptTag}`;

const headFor = (route: Route) => {
  const url = route.path;
  const fullTitle = route.absoluteTitle ? route.title : `${route.title} | Devixa`;
  const pathAfterLocale = url.slice(`/${route.locale}`.length);
  return `    <title>${fullTitle}</title>
    <meta name="description" content="${route.description}" />
    <link rel="canonical" href="${abs(url)}" />
${locales.map((l) => `    <link rel="alternate" hreflang="${hreflang[l as keyof typeof hreflang]}" href="${abs(`/${l}${pathAfterLocale}`)}" />`).join('\n')}
    <link rel="alternate" hreflang="x-default" href="${abs(`/de${pathAfterLocale}`)}" />
    <meta property="og:type" content="${route.type ?? 'website'}" />
    <meta property="og:url" content="${abs(url)}" />
    <meta property="og:site_name" content="Devixa" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${route.description}" />
    <meta property="og:locale" content="${ogLocale[route.locale as keyof typeof ogLocale]}" />
    <meta property="og:image" content="${abs('/og.png')}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle}" />
    <meta name="twitter:description" content="${route.description}" />
    <meta name="twitter:image" content="${abs('/og.png')}" />
    <meta name="robots" content="index, follow" />
${assetLinks}`;
};

let written = 0;
for (const route of routes) {
  const appHtml = renderToString(h(StaticRouter, { location: route.path }, h(App)));
  // The page components render their own in-body JSON-LD (articles); only the
  // home-page Organization schema needs emitting here, tagged so the client effect skips it.
  const jsonLd = route.jsonLd && route.path === `/${route.locale}`
    ? `\n  <script type="application/ld+json" id="dx-jsonld">${JSON.stringify(route.jsonLd)}</script>`
    : '';
  const html = `<!doctype html>
<html lang="${route.locale}" translate="no" data-act="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${headFor(route)}${jsonLd}
  </head>
  <body>
    <div id="root">${appHtml}</div>
    ${scriptTag}
  </body>
</html>
`;
  const file = `dist${route.path}.html`;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  written += 1;
}

// Sitemap lastmod stays in sync with the prerendered set.
writeFileSync('dist/sitemap.xml', readFileSync('public/sitemap.xml', 'utf8'));
console.log(`prerender: ${written} pages → dist/**/*.html`);
if (!existsSync('dist/admin/index.html')) {
  console.log('note: /admin* is served by the SPA shell (noindex via robots.txt).');
}
