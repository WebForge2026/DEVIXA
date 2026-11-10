import 'server-only';
import type { LegalDocs } from '@/lib/legal';
import type { Locale } from '../config';
import { bg } from './bg';
import { de } from './de';
import { en } from './en';

const docs: Record<Locale, LegalDocs> = { en, de, bg };

export const getLegal = (locale: Locale): LegalDocs => docs[locale];
