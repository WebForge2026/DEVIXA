import Link from 'next/link';
import { LanyardMount } from '@/components/canvas/LanyardMount';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/types';
import { site } from '@/lib/site';
import { StarGlyph } from '@/components/ui/Wordmark';

export const Footer = ({ locale, footer, nav }: { locale: Locale; footer: Dictionary['footer']; nav: Dictionary['nav'] }) => (
  <footer className="relative isolate min-h-[100svh] overflow-hidden border-t border-crimson/30 bg-obsidian text-[#EEEEF2]">
    <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_75%_20%,rgba(255,42,42,0.22),transparent_70%),radial-gradient(40%_50%_at_0%_100%,rgba(153,0,0,0.3),transparent_70%)]" />

    {/* Lanyard stage — right half on desktop, top band on mobile */}
    <div className="absolute inset-x-0 top-0 z-20 h-[60vh] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-1/2">
      <LanyardMount />
      <p className="pointer-events-none absolute bottom-6 right-6 font-mono text-[10px] uppercase tracking-[0.25em] text-[#EEEEF2]/50 lg:bottom-auto lg:top-24">
        ↓ {footer.badgeHint}
      </p>
    </div>

    <div className="pointer-events-none relative mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-end px-4 pb-8 pt-[62vh] md:px-8 lg:pt-32">
      <div className="pointer-events-auto grid gap-10 lg:w-1/2">
        <p className="max-w-md text-xl leading-snug">{footer.tagline}</p>
        <div className="grid grid-cols-2 gap-8 font-mono text-[11px] uppercase tracking-[0.2em] sm:grid-cols-3">
          <div>
            <p className="text-crimson">{nav.contact}</p>
            <ul className="mt-3 space-y-2 normal-case tracking-normal text-[#EEEEF2]/80">
              <li><a className="hover:text-crimson" href={`mailto:${site.contact.office}`}>{site.contact.office}</a></li>
              <li><a className="hover:text-crimson" href={`mailto:${site.contact.support}`}>{site.contact.support}</a></li>
              <li><a className="hover:text-crimson" href={site.contact.phoneDE.href}>{site.contact.phoneDE.display}</a></li>
              <li><a className="hover:text-crimson" href={site.contact.phoneBG.href}>{site.contact.phoneBG.display}</a></li>
            </ul>
          </div>
          <div>
            <p className="text-crimson">{footer.markets}</p>
            <ul className="mt-3 space-y-2 text-[#EEEEF2]/80">
              <li>Deutschland — DE</li>
              <li>България — BG</li>
              <li>Polska — PL</li>
              <li>International</li>
            </ul>
          </div>
          <div>
            <p className="text-crimson">{footer.legal}</p>
            <ul className="mt-3 space-y-2 text-[#EEEEF2]/80">
              <li><Link className="hover:text-crimson" href={`/${locale}/imprint`}>{footer.imprint}</Link></li>
              <li><Link className="hover:text-crimson" href={`/${locale}/privacy`}>{footer.privacy}</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-16 flex items-end gap-3 lg:gap-6">
        <StarGlyph className="mb-[1vw] h-[6vw] w-[6vw] shrink-0 text-crimson" />
        <p aria-hidden className="type-display text-[14vw] leading-[0.8] text-[#EEEEF2]">Devixa</p>
      </div>
      <div className="mt-6 flex flex-col justify-between gap-2 border-t border-white/15 pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#EEEEF2]/50 sm:flex-row">
        <span>© {new Date().getFullYear()} {site.legalEntity} · {site.location}</span>
        <span>{footer.rights}</span>
      </div>
    </div>
  </footer>
);
