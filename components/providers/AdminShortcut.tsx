'use client';

import { useEffect } from 'react';

/**
 * Hidden entry to the admin panel: Ctrl/⌘ + Shift + A, or Alt + Shift + A
 * (fallback for browsers that reserve Ctrl + Shift + A, e.g. Chrome's tab search).
 */
export const AdminShortcut = () => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'KeyA' || !event.shiftKey) return;
      if (!(event.ctrlKey || event.metaKey || event.altKey)) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      window.location.href = '/admin';
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return null;
};
