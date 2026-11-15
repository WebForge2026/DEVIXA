import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/types';
import { editablePaths, setStringAtPath } from './fields';
import { emptyContent, type ContentState } from './types';


const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

export const CMS_TAG = 'cms';

/**
 * Published CMS state for the static build. Reads an optional CMS_SNAPSHOT env var
 * (JSON produced by `php database/export-cms.php` during deploys — see
 * .github/workflows/rebuild-cms.yml); without it the built-in defaults are used.
 * Theme and media are additionally applied at runtime by components/providers/CmsRuntime.
 */
export const getPublishedContent = (): ContentState => {
  const snapshot = viteEnv.VITE_CMS_SNAPSHOT;
  if (snapshot) {
    try {
      return { ...emptyContent(), ...(JSON.parse(snapshot) as Partial<ContentState>) };
    } catch {
      console.error('[cms] CMS_SNAPSHOT is not valid JSON, using defaults');
    }
  }
  return emptyContent();
};

/** Dictionary with the admin's published text overrides applied (falls back to the built-in copy). */
export const getSiteDictionary = (locale: Locale): Dictionary => {
  const content = getPublishedContent();
  const overrides = content.texts[locale];
  const base = getDictionary(locale);
  if (!overrides || Object.keys(overrides).length === 0) return base;
  const dict = structuredClone(base);
  Object.entries(overrides).forEach(([path, value]) => {
    if (editablePaths.has(path) && value.trim()) setStringAtPath(dict, path, value);
  });
  return dict;
};
