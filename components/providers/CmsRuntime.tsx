'use client';

import { useEffect } from 'react';
import { defaultTheme, type ContentState, type MediaItem } from '@/lib/admin/types';

const SLOT_IDS = ['project-0', 'project-1', 'project-2'];

const hexToRgb = (hex: string) => {
  const value = /^#([0-9a-f]{6})$/i.exec(hex)?.[1] ?? 'FF2A2A';
  const n = parseInt(value, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

const clamp = (v: number, min: number, max: number, fallback: number) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback);

/** Renders CMS media for one slot (same markup the server produces at build time). */
const renderSlot = (host: HTMLElement, items: MediaItem[]) => {
  host.textContent = '';
  items.forEach((m, index) => {
    const img = document.createElement('img');
    img.setAttribute('src', m.src);
    img.setAttribute('alt', m.alt);
    img.setAttribute('loading', 'lazy');
    img.className = `aspect-video w-full border border-line/20 object-cover${index === 0 ? ' lg:col-span-4' : ''}`;
    host.appendChild(img);
  });
  host.classList.remove('hidden');
};

/**
 * Applies the published CMS state at runtime (PHP backend serves it at /api/content):
 * design theme (CSS variables + sphere share) and project media. Text overrides stay
 * build-time — see .github/workflows/rebuild-cms.yml.
 */
export const CmsRuntime = () => {
  useEffect(() => {
    let cancelled = false;
    fetch('/api/content', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { content?: ContentState };
      })
      .then((body) => {
        if (cancelled || !body?.content) return;
        const content = { ...defaultTheme, ...body.content.theme };

        let style = document.querySelector<HTMLStyleElement>('style[data-cms-theme]');
        if (!style) {
          style = document.createElement('style');
          style.dataset.cmsTheme = '';
          document.head.appendChild(style);
        }
        const radius = clamp(content.cardRadius, 0, 24, defaultTheme.cardRadius);
        const glow = clamp(content.glow, 0, 0.4, defaultTheme.glow);
        const sphereRed = clamp(content.sphereRed, 0.05, 0.45, defaultTheme.sphereRed);
        style.textContent = `:root{--accent-rgb:${hexToRgb(content.accent)};--card-radius:${radius}px;--glow-alpha:${glow}}`;
        document.documentElement.dataset.sphereRed = String(sphereRed);

        SLOT_IDS.forEach((slot) => {
          const host = document.querySelector<HTMLElement>(`[data-cms-slot="${slot}"]`);
          if (!host) return;
          const items = (body.content?.media ?? []).filter((m) => m.slot === slot);
          if (items.length > 0) renderSlot(host, items);
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
};
