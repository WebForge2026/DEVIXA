import { useEffect, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { SceneMount } from '@/components/canvas/SceneMount';
import { PointerBridge } from '@/components/providers/PointerBridge';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { Header } from '@/components/sections/Header';
import { Cursor } from '@/components/ui/Cursor';
import { Grain } from '@/components/ui/Grain';
import { htmlLang, isLocale } from '@/lib/i18n/config';
import { getSiteDictionary } from '@/lib/admin/content';
import { AdminShortcut } from '@/components/providers/AdminShortcut';
import { Telemetry } from '@/components/providers/Telemetry';
import { Analytics } from '@/components/providers/Analytics';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { CmsRuntime } from '@/components/providers/CmsRuntime';
import { defaultTheme } from '@/lib/admin/types';
import { GOOGLE_SITE_VERIFICATION, site } from '@/lib/site';
import { NotFound } from './NotFound';

/**
 * Public-site wrapper (port of the former app/[locale]/layout.tsx): 3D scene,
 * header, providers, consent, telemetry, runtime CMS. Per-page SEO is rendered
 * by each page's <Seo> component; this sets the document-level attributes and
 * the Organization/WebSite structured data.
 */
export const Site = ({ children }: { children: ReactNode }) => {
  const params = useParams();
  const locale = isLocale(params.locale) ? params.locale : null;

  useEffect(() => {
    if (!locale) return;
    document.documentElement.lang = htmlLang[locale];
    document.documentElement.setAttribute('translate', 'no');
    if (!document.documentElement.dataset.sphereRed) {
      document.documentElement.dataset.sphereRed = String(defaultTheme.sphereRed);
    }
  }, [locale]);

  useEffect(() => {
    if (!GOOGLE_SITE_VERIFICATION) return;
    const el = document.createElement('meta');
    el.name = 'google-site-verification';
    el.content = GOOGLE_SITE_VERIFICATION;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    if (document.getElementById('dx-jsonld')) return;
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
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'dx-jsonld';
    script.text = JSON.stringify(organization);
    document.body.appendChild(script);
  }, []);

  if (!locale) return <NotFound />;
  const dict = getSiteDictionary(locale);

  return (
    <>
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
        <Header locale={locale} nav={dict.nav} />
        <div className="relative z-10">{children}</div>
        <Cursor />
        <Grain />
      </SmoothScroll>
      <CookieConsent locale={locale} consent={dict.consent} privacyLabel={dict.footer.privacy} />
      <Analytics />
      <Telemetry />
      <AdminShortcut />
      <CmsRuntime />
    </>
  );
};
