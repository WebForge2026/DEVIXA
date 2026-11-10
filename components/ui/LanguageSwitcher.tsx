'use client';

import { Globe } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeNames, locales, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

/** Full-name language links that keep the visitor on the same page. */
export const LanguageSwitcher = ({ locale, label }: { locale: Locale; label: string }) => {
  const pathname = usePathname();
  const swap = (target: Locale) => pathname.replace(/^\/(en|de|bg)(?=\/|$)/, `/${target}`);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label={label}>
      <span className="flex items-center gap-2 text-crimson">
        <Globe size={13} /> {label}
      </span>
      {locales.map((l) => (
        <Link
          key={l}
          href={swap(l)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? 'true' : undefined}
          className={cn('normal-case tracking-normal transition-colors', l === locale ? 'text-[#EEEEF2] underline decoration-crimson underline-offset-4' : 'text-[#EEEEF2]/55 hover:text-[#EEEEF2]')}
        >
          {localeNames[l]}
        </Link>
      ))}
    </div>
  );
};
