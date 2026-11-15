'use client';

import { useEffect, useState } from 'react';
import {
  CONSENT_EVENT,
  CONSENT_STORAGE_KEY,
  analytics,
  analyticsEnabled,
  analyticsNeedsConsent,
  type ConsentChoice,
} from '@/lib/analytics';

const readConsent = (): ConsentChoice | null => {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
};

/** Injects a script tag once; removes it on cleanup. */
const useScript = (build: (() => HTMLScriptElement) | null) => {
  useEffect(() => {
    if (!build) return;
    const script = build();
    document.body.appendChild(script);
    return () => script.remove();
  }, [build]);
};

/** Loads the configured analytics tool. Cookie-setting tools wait for opt-in. See lib/analytics.ts. */
export const Analytics = () => {
  const [consent, setConsent] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    if (!analyticsNeedsConsent) return;
    setConsent(readConsent());
    const onChange = (event: Event) => setConsent((event as CustomEvent<ConsentChoice>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  const { provider, id } = analytics;
  const external = provider === 'plausible' ? `https://plausible.io/js/script.js` : provider === 'ga4' ? `https://www.googletagmanager.com/gtag/js?id=${id}` : null;
  const inline =
    provider === 'ga4'
      ? `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`
      : provider === 'gtm'
        ? `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`
        : null;

  const loadExternal = analyticsEnabled && (provider === 'plausible' || consent === 'granted') ? external : null;
  const loadInline = analyticsEnabled && inline && (provider === 'gtm' ? consent === 'granted' : consent === 'granted') ? inline : null;

  useScript(
    loadExternal
      ? () => {
          const script = document.createElement('script');
          script.src = loadExternal;
          script.defer = true;
          if (provider === 'plausible') script.dataset.domain = id;
          return script;
        }
      : null,
  );
  useScript(
    loadInline
      ? () => {
          const script = document.createElement('script');
          script.text = loadInline;
          return script;
        }
      : null,
  );

  return null;
};
