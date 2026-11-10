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
import { site } from '@/lib/site';
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
    title: { default: dict.meta.title, template: `%s — Devixa` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${params.locale}`,
      languages: Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}`])),
    },
    openGraph: {
      type: 'website',
      siteName: 'Devixa',
      title: dict.meta.title,
      description: dict.meta.description,
      locale: htmlLang[params.locale].replace('-', '_'),
    },
    icons: { icon: '/icon.svg' },
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
          <div id="act-wipe" aria-hidden className="pointer-events-none invisible fixed inset-x-0 top-0 z-[95] h-screen">
            <div className="absolute inset-x-0 bottom-0 h-px bg-crimson shadow-[0_0_30px_6px_#FF2A2A]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-crimson/25 to-transparent" />
          </div>
          <Header locale={params.locale} nav={dict.nav} />
          <div className="relative z-10">{children}</div>
          <Cursor />
          <Grain />
        </SmoothScroll>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      </body>
    </html>
  );
};

export default RootLayout;
