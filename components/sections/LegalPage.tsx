import { Fragment } from 'react';
import type { LegalDoc } from '@/lib/legal';

/** Highlights "[…]" placeholders so missing company data is impossible to overlook. */
const withPlaceholders = (text: string) =>
  text.split(/(\[[^\]]+\])/g).map((part, i) =>
    part.startsWith('[') && part.endsWith(']') ? (
      <mark key={i} className="border border-dashed border-crimson bg-crimson/10 px-1 text-crimson">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );

export const LegalPage = ({ doc }: { doc: LegalDoc }) => (
  <article className="mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-12">
    <header className="lg:col-span-12">
      <h1 className="type-display text-[clamp(2.2rem,5.5vw,4.75rem)]">{doc.title}</h1>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-fg/60">{doc.updatedLabel}</p>
    </header>
    <nav aria-label={doc.title} className="hidden lg:col-span-3 lg:block">
      <ol className="sticky top-28 space-y-2.5 border-l border-line/20 pl-5 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/60">
        {doc.sections.map((section, i) => (
          <li key={section.heading}>
            <a href={`#l${i + 1}`} className="transition-colors hover:text-crimson">
              {section.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
    <div className="max-w-[72ch] space-y-12 lg:col-span-8 lg:col-start-5">
      {doc.sections.map((section, i) => (
        <section key={section.heading} id={`l${i + 1}`} className="scroll-mt-28 border-t border-line/15 pt-8">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{section.heading}</h2>
          <div className="mt-4 space-y-3 text-[17px] leading-relaxed text-fg/80">
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{withPlaceholders(paragraph)}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  </article>
);
