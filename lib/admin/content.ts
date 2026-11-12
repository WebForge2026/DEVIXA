import 'server-only';
import { unstable_cache } from 'next/cache';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/types';
import { editablePaths, setStringAtPath } from './fields';
import { getStore } from './store';
import { emptyContent, type ContentState } from './types';

export const CMS_TAG = 'cms';

/** Published CMS state, cached and tagged; publishing calls revalidateTag(CMS_TAG). */
export const getPublishedContent = unstable_cache(
  async (): Promise<ContentState> => {
    try {
      return await getStore().getContent();
    } catch (error) {
      console.error('[cms] could not load content, using defaults', error);
      return emptyContent();
    }
  },
  ['cms-content'],
  { tags: [CMS_TAG] },
);

/** Dictionary with the admin's published text overrides applied (falls back to the built-in copy). */
export const getSiteDictionary = async (locale: Locale): Promise<Dictionary> => {
  const content = await getPublishedContent();
  const overrides = content.texts[locale];
  const base = getDictionary(locale);
  if (!overrides || Object.keys(overrides).length === 0) return base;
  const dict = structuredClone(base);
  Object.entries(overrides).forEach(([path, value]) => {
    if (editablePaths.has(path) && value.trim()) setStringAtPath(dict, path, value);
  });
  return dict;
};
