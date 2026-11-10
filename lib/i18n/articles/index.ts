import 'server-only';
import type { Locale } from '../config';
import { bg } from './bg';
import { de } from './de';
import { en } from './en';
import type { Article } from './types';

const articles: Record<Locale, Article[]> = { en, de, bg };

export const getArticles = (locale: Locale): Article[] => articles[locale];
export const getArticle = (locale: Locale, slug: string) => articles[locale].find((a) => a.slug === slug);
