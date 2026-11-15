'use client';

import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { track } from '@/lib/telemetry-client';

const HEARTBEAT_MS = 25_000;

/** Page views + presence heartbeat for the admin's live view. Cookieless; honours DNT/GPC server-side. */
export const Telemetry = () => {
  const pathname = useLocation().pathname;

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
