'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CONSENT_EVENT, CONSENT_STORAGE_KEY, analyticsNeedsConsent, type ConsentChoice } from '@/lib/analytics';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/types';

export const OPEN_CONSENT_EVENT = 'devixa:open-consent';

const store = (choice: ConsentChoice) => {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_EVENT, { detail: choice }));
};

/**
 * Minimal opt-in banner. Only rendered when a cookie-setting analytics tool is configured
 * (lib/analytics.ts). Accept and decline are equally prominent, as German regulators require.
 */
export const CookieConsent = ({ locale, consent, privacyLabel }: { locale: Locale; consent: Dictionary['consent']; privacyLabel: string }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!analyticsNeedsConsent) return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch {
      stored = null;
    }
    setOpen(stored !== 'granted' && stored !== 'denied');
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!analyticsNeedsConsent || !open) return null;

  const choose = (choice: ConsentChoice) => {
    store(choice);
    setOpen(false);
  };

  return (
    <div role="dialog" aria-live="polite" aria-label={consent.settings} className="fixed inset-x-4 bottom-4 z-[120] mx-auto max-w-xl border border-line/25 bg-bg/95 p-5 text-fg shadow-2xl backdrop-blur-xl md:inset-x-auto md:right-6">
      <p className="text-sm leading-relaxed">
        {consent.text}{' '}
        <Link href={`/${locale}/privacy`} className="underline decoration-crimson underline-offset-4">
          {privacyLabel}
        </Link>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em]">
        <button type="button" onClick={() => choose('denied')} className="border border-fg px-4 py-3 transition-colors hover:bg-fg hover:text-bg">
          {consent.decline}
        </button>
        <button type="button" onClick={() => choose('granted')} className="border border-fg bg-fg px-4 py-3 text-bg transition-colors hover:border-crimson hover:bg-crimson hover:text-obsidian">
          {consent.accept}
        </button>
      </div>
    </div>
  );
};

/** Footer link to change the consent choice; only shown when a banner exists at all. */
export const ConsentSettingsLink = ({ label, className }: { label: string; className?: string }) =>
  analyticsNeedsConsent ? (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      {label}
    </button>
  ) : null;
