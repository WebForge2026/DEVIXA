import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Unbounded } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { SceneMount } from '@/components/canvas/SceneMount';
import { PointerBridge } from '@/components/providers/PointerBridge';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { Header } from '@/components/sections/Header';
import { Cursor } from '@/components/ui/Cursor';
import { Grain } from '@/components/ui/Grain';
import { htmlLang, isLocale, locales } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n';
import { GOOGLE_SITE_VERIFICATION, site } from '@/lib/site';
import { isIndexable } from '@/lib/seo';
import { Analytics } from '@/components/providers/Analytics';
import { CookieConsent } from '@/components/ui/CookieConsent';
import '../globals.css';

const display = Unbounded({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '700', '900'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-mono',
  display: 'swap',
});

export const generateStaticParams = () => locales.map((locale) => ({ locale }));

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E2E4E9' },
    { media: '(prefers-color-scheme: dark)', color: '#050507' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const generateMetadata = ({ params }: { params: { locale: string } }): Metadata => {
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  return {
    metadataBase: new URL(site.url),
    title: { default: dict.meta.title, template: '%s | Devixa' },
    description: dict.meta.description,
    applicationName: 'Devixa',
    authors: [{ name: site.legalEntity, url: site.url }],
    creator: site.legalEntity,
    publisher: site.legalEntity,
    formatDetection: { telephone: true, email: true, address: false },
    robots: isIndexable ? { index: true, follow: true } : { index: false, follow: true },
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      ],
      shortcut: '/favicon.ico',
      apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
    },
    manifest: '/manifest.webmanifest',
    // Google Search Console: the code lives in lib/site.ts (GOOGLE_SITE_VERIFICATION).
    verification: GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : undefined,
  };
};

const RootLayout = ({ children, params }: { children: ReactNode; params: { locale: string } }) => {
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.brand,
    legalName: site.legalEntity,
    url: site.url,
    email: site.contact.office,
    address: { '@type': 'PostalAddress', addressCountry: 'BG' },
    areaServed: ['DE', 'BG', 'PL'],
    contactPoint: [
      { '@type': 'ContactPoint', telephone: site.contact.phoneDE.display, contactType: 'sales', areaServed: 'DE', availableLanguage: ['en', 'de'] },
      { '@type': 'ContactPoint', telephone: site.contact.phoneBG.display, contactType: 'sales', areaServed: 'BG', availableLanguage: ['en', 'bg'] },
    ],
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Devixa',
    url: `${site.url}/${params.locale}`,
    inLanguage: htmlLang[params.locale],
    publisher: { '@type': 'Organization', name: site.legalEntity },
  };

  return (
    <html lang={htmlLang[params.locale]} data-act="light" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-crimson focus:px-4 focus:py-2 focus:text-obsidian">
          Skip to content
        </a>
        <SmoothScroll>
          <PointerBridge />
          <SceneMount />
          <div aria-hidden className="atmosphere pointer-events-none fixed inset-0 z-[1]" />
          <div aria-hidden className="veil pointer-events-none fixed inset-0 z-[2]" />
          <div id="act-wipe" aria-hidden className="pointer-events-none invisible fixed inset-x-0 top-0 z-[95] h-screen">
            <div className="absolute inset-x-0 bottom-0 h-px bg-crimson shadow-[0_0_30px_6px_#FF2A2A]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-crimson/25 to-transparent" />
          </div>
          <Header locale={params.locale} nav={dict.nav} />
          <div className="relative z-10">{children}</div>
          <Cursor />
          <Grain />
        </SmoothScroll>
        <CookieConsent locale={params.locale} consent={dict.consent} privacyLabel={dict.footer.privacy} />
        <Analytics />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([organization, website]) }} />
      </body>
    </html>
  );
};

export default RootLayout;
