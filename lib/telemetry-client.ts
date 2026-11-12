'use client';

import type { EventType } from '@/lib/admin/types';

/** Sends one anonymous telemetry signal (no cookies, no device storage). Fire-and-forget. */
export const track = (type: EventType | 'heartbeat', path = window.location.pathname) => {
  try {
    const locale = path.split('/')[1] ?? 'de';
    const body = JSON.stringify({ type, path, locale });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/t', new Blob([body], { type: 'application/json' }));
    else void fetch('/api/t', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } });
  } catch {
    // Telemetry must never break the page.
  }
};
