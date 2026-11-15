import { locales, type Locale } from '@/lib/i18n/config';

/** Port of middleware.ts preferredLocale: cookie → Accept-Language → German. */
export const preferredLocale = (): Locale => {
  const saved = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([a-z]{2})/)?.[1];
  if (saved && (locales as readonly string[]).includes(saved)) return saved as Locale;
  const entries = (navigator.languages ?? [navigator.language])
    .flatMap((tag) => tag.split(','))
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: (tag ?? '').slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return (entries.map((e) => e.lang).find((l) => (locales as readonly string[]).includes(l)) as Locale | undefined) ?? 'de';
};
