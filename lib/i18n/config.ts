export const locales = ['de', 'en', 'bg'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';

export const isLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

export const localeLabels: Record<Locale, string> = { en: 'EN', de: 'DE', bg: 'BG' };
export const localeNames: Record<Locale, string> = { en: 'English', de: 'Deutsch', bg: 'Български' };
export const htmlLang: Record<Locale, string> = { en: 'en', de: 'de-DE', bg: 'bg-BG' };
