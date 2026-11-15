/* ===========================================================================

   ANALYTICS — Vorbereitung
   ---------------------------------------------------------------------------
   Anbieter und ID als Umgebungsvariablen (z. B. zum Build-Zeitpunkt (VITE_*)) setzen:
     VITE_ANALYTICS_PROVIDER = 'plausible' | 'ga4' | 'gtm'   (Standard: 'none')
     VITE_ANALYTICS_ID       = Domain (Plausible, z. B. devixa.de),
                                      Mess-ID (GA4, z. B. G-XXXXXXX) oder
                                      Container-ID (GTM, z. B. GTM-XXXXXXX)
   - plausible: cookielos, ohne Einwilligung → kein Cookie-Banner
   - ga4 / gtm: setzen Cookies → Skript lädt erst nach Einwilligung im Cookie-Banner
   Bei 'none' wird nichts geladen und kein Banner angezeigt.
   =========================================================================== */
const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
export type AnalyticsProvider = 'none' | 'plausible' | 'ga4' | 'gtm';

const providers: readonly AnalyticsProvider[] = ['none', 'plausible', 'ga4', 'gtm'];
const configured = viteEnv.VITE_ANALYTICS_PROVIDER ?? 'none';

export const analytics = {
  provider: (providers as readonly string[]).includes(configured) ? (configured as AnalyticsProvider) : 'none',
  id: viteEnv.VITE_ANALYTICS_ID ?? '',
};

export const analyticsEnabled = analytics.provider !== 'none' && analytics.id !== '';

/** Cookie-setting tools may only load after opt-in (TDDDG § 25 / ePrivacy). */
export const analyticsNeedsConsent = analyticsEnabled && (analytics.provider === 'ga4' || analytics.provider === 'gtm');

export const CONSENT_STORAGE_KEY = 'devixa-consent';
export const CONSENT_EVENT = 'devixa:consent';
export type ConsentChoice = 'granted' | 'denied';
