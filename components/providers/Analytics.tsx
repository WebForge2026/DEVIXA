'use client';

import Script from 'next/script';
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

  if (!analyticsEnabled) return null;
  const { provider, id } = analytics;

  if (provider === 'plausible') {
    return <Script defer data-domain={id} src="https://plausible.io/js/script.js" strategy="afterInteractive" />;
  }
  if (consent !== 'granted') return null;

  if (provider === 'ga4') {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
        </Script>
      </>
    );
  }
  // provider === 'gtm'
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`}
    </Script>
  );
};
