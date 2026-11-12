'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { track } from '@/lib/telemetry-client';

const HEARTBEAT_MS = 25_000;

/** Page views + presence heartbeat for the admin's live view. Cookieless; honours DNT/GPC server-side. */
export const Telemetry = () => {
  const pathname = usePathname();

  useEffect(() => {
    track('pageview', pathname);
  }, [pathname]);

  useEffect(() => {
    const beat = () => document.visibilityState === 'visible' && track('heartbeat');
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', beat);
    };
  }, []);

  return null;
};
