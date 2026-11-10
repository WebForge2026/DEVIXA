import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/i18n/config';

const preferredLocale = (request: NextRequest): Locale => {
  const header = request.headers.get('accept-language') ?? '';
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: (tag ?? '').slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((entry) => isLocale(entry.lang))?.lang as Locale | undefined ?? defaultLocale;
};

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const first = pathname.split('/')[1] ?? '';
  if (locales.some((locale) => locale === first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
};

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\..*).*)'],
};
