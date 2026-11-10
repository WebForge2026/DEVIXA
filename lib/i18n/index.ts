import 'server-only';
import { bg } from './dictionaries/bg';
import { de } from './dictionaries/de';
import { en } from './dictionaries/en';
import type { Locale } from './config';
import type { Dictionary } from './types';

const dictionaries: Record<Locale, Dictionary> = { en, de, bg };

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];
