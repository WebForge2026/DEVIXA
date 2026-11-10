'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { locales, localeLabels, type Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/types';
import { cn } from '@/lib/utils';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { Wordmark } from '@/components/ui/Wordmark';

export const Header = ({ locale, nav }: { locale: Locale; nav: Dictionary['nav'] }) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHome = pathname === `/${locale}`;
  const anchor = (id: string) => (isHome ? `#${id}` : `/${locale}#${id}`);
  const swapLocale = (target: Locale) => pathname.replace(/^\/(en|de|bg)(?=\/|$)/, `/${target}`);

  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { id: 'journey', label: nav.journey },
    { id: 'services', label: nav.services },
    { id: 'work', label: nav.work },
    { id: 'estimate', label: nav.estimate },
    { id: 'insights', label: nav.insights },
    { id: 'contact', label: nav.contact },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/15 bg-bg/60 backdrop-blur-xl transition-colors duration-700">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-6 px-4 md:px-8">
        <Link href={`/${locale}`} aria-label="Devixa — home" className="shrink-0" data-cursor="lens">
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden items-center xl:flex">
          {links.map((link, i) => (
            <a
              key={link.id}
              href={anchor(link.id)}
              className="group relative whitespace-nowrap px-2.5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-fg/70 transition-colors hover:text-fg 2xl:px-3"
            >
              <span className="mr-1.5 text-crimson">0{i + 1}</span>
              {link.label}
              <span className="absolute inset-x-2.5 bottom-1 h-px origin-left scale-x-0 bg-crimson transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex border border-line/25 font-mono text-[10px] tracking-[0.15em]" role="group" aria-label="Language">
            {locales.map((l) => (
              <Link
                key={l}
                href={swapLocale(l)}
                hrefLang={l}
                aria-current={l === locale ? 'true' : undefined}
                className={cn('px-2.5 py-1.5 transition-colors', l === locale ? 'bg-fg text-bg' : 'text-fg/60 hover:text-fg')}
              >
                {localeLabels[l]}
              </Link>
            ))}
          </div>
          <div className="hidden md:block xl:hidden 2xl:block">
            <MagneticButton href={anchor('contact')} variant="solid" className="whitespace-nowrap px-5 py-3">
              {nav.cta}
            </MagneticButton>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center border border-line/25 xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Mobile"
        className={cn('grid overflow-hidden border-t border-line/15 bg-bg/95 transition-[grid-template-rows] duration-500 xl:hidden', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] border-transparent')}
      >
        <div className="min-h-0">
          {links.map((link, i) => (
            <a key={link.id} href={anchor(link.id)} onClick={() => setOpen(false)} className="flex items-baseline gap-4 border-b border-line/10 px-4 py-4">
              <span className="font-mono text-xs text-crimson">0{i + 1}</span>
              <span className="type-display text-3xl">{link.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
};
