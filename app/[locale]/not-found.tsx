import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ActController } from '@/components/providers/ActController';
import { DxMark } from '@/components/ui/Wordmark';

const COPY = [
  { lang: 'de', title: 'Seite nicht gefunden.', body: 'Diese Adresse gibt es nicht (mehr).', home: 'Zur Startseite', services: 'Leistungen', contact: 'Kontakt' },
  { lang: 'en', title: 'Page not found.', body: 'This address does not exist (anymore).', home: 'Go to homepage', services: 'Services', contact: 'Contact' },
  { lang: 'bg', title: 'Страницата не е намерена.', body: 'Този адрес не съществува (вече).', home: 'Към началото', services: 'Услуги', contact: 'Контакт' },
] as const;

/**
 * 404 for every localized route. Next.js renders it without the URL's locale,
 * so it speaks all three languages and links into each one. Responds with HTTP 404 + noindex.
 */
const NotFound = () => (
  <>
  {/* No hero here: tells the 3D scene to hide the keycap sphere. */}
  <ActController initial="light" />
  <main id="main" className="grid min-h-[100svh] place-items-center px-4 pb-16 pt-28 md:px-8">
    <div className="w-full max-w-5xl">
      <div className="flex items-end justify-between gap-6 border-b border-line/20 pb-8">
        <h1 className="type-display text-[clamp(5rem,18vw,13rem)] leading-[0.8]">404</h1>
        <DxMark id="dx-404" className="mb-3 h-[clamp(2.5rem,6vw,4.5rem)]" />
      </div>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-crimson">ERR-404</p>
      <div className="mt-8 grid gap-px border border-line/20 bg-line/20 md:grid-cols-3">
        {COPY.map((c) => (
          <section key={c.lang} lang={c.lang} className="flex flex-col gap-4 bg-panel/90 p-6 backdrop-blur-md">
            <h2 className="text-xl font-semibold tracking-tight">{c.title}</h2>
            <p className="text-fg/70">{c.body}</p>
            <Link
              href={`/${c.lang}`}
              className="mt-auto inline-flex items-center justify-between gap-3 bg-fg px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-bg transition-colors hover:bg-crimson hover:text-obsidian"
            >
              {c.home} <ArrowRight size={14} aria-hidden />
            </Link>
            <div className="flex gap-5 font-mono text-[11px] uppercase tracking-[0.15em] text-fg/70">
              <Link href={`/${c.lang}#services`} className="hover:text-crimson">
                {c.services}
              </Link>
              <Link href={`/${c.lang}#contact`} className="hover:text-crimson">
                {c.contact}
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  </main>
  </>
);

export default NotFound;
