'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Cross-tab live sync between open admin tabs (status changes, publishes, …). */
const CHANNEL = 'devixa-admin';
export type AdminSignal = 'leads' | 'content';

export const broadcast = (signal: AdminSignal) => {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(signal);
    channel.close();
  } catch {
    // BroadcastChannel unsupported: other tabs catch up on their next poll.
  }
};

export class UnauthorizedError extends Error {}

export const api = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, cache: 'no-store' });
  if (response.status === 401) {
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    throw new UnauthorizedError('unauthorized');
  }
  if (!response.ok) throw new Error(`${response.status}`);
  return (await response.json()) as T;
};

/**
 * Fetches `url`, re-polls every `pollMs` while the tab is visible and refetches immediately
 * when another admin tab broadcasts one of `signals`.
 */
export const useAdminData = <T,>(url: string | null, { pollMs = 0, signals = [] as AdminSignal[] } = {}) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const signalKey = signals.join(',');
  const urlRef = useRef(url);
  urlRef.current = url;

  const load = useCallback(async () => {
    if (!urlRef.current) return;
    try {
      const result = await api<T>(urlRef.current);
      setData(result);
      setError(null);
    } catch (e) {
      if (!(e instanceof UnauthorizedError)) setError(e instanceof Error ? e.message : 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [url, load]);

  useEffect(() => {
    if (!pollMs) return;
    const timer = window.setInterval(() => document.visibilityState === 'visible' && void load(), pollMs);
    return () => window.clearInterval(timer);
  }, [pollMs, load]);

  useEffect(() => {
    if (!signalKey) return;
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = (event) => signalKey.split(',').includes(String(event.data)) && void load();
    } catch {
      channel = null;
    }
    return () => channel?.close();
  }, [signalKey, load]);

  return { data, error, loading, reload: load, setData };
};
