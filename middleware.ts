import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/i18n/config';

const COOKIE = 'NEXT_LOCALE';
const ONE_YEAR = 60 * 60 * 24 * 365;

const fromAcceptLanguage = (header: string): Locale | undefined =>
  header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: (tag ?? '').slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.lang)
    .find(isLocale);

/** Saved choice first, then the browser language, then German. */
const preferredLocale = (request: NextRequest): Locale => {
  const saved = request.cookies.get(COOKIE)?.value;
  if (saved && isLocale(saved)) return saved;
  return fromAcceptLanguage(request.headers.get('accept-language') ?? '') ?? defaultLocale;
};

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const first = pathname.split('/')[1] ?? '';

  if (locales.some((locale) => locale === first)) {
    const response = NextResponse.next();
    // Remember the language the visitor is reading in (strictly necessary, no tracking).
    if (request.cookies.get(COOKIE)?.value !== first) {
      response.cookies.set(COOKIE, first, { maxAge: ONE_YEAR, sameSite: 'lax', path: '/' });
    }
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
};

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\..*).*)'],
};
