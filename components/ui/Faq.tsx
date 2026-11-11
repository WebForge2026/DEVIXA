import { Plus } from 'lucide-react';

type FaqItem = { q: string; a: string };

/**
 * Accessible accordion built on native <details>/<summary> (keyboard + screen reader support,
 * works without JavaScript), plus FAQPage structured data for search engines.
 */
export const Faq = ({ items, headingLevel = 'h3' }: { items: FaqItem[]; headingLevel?: 'h3' | 'h4' }) => {
  const Heading = headingLevel;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <div className="border-t border-line/15">
      {items.map((item) => (
        <details key={item.q} className="group border-b border-line/15">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden" data-cursor="lens">
            <Heading className="text-xl font-medium tracking-tight md:text-2xl">{item.q}</Heading>
            <Plus size={20} aria-hidden className="shrink-0 text-crimson transition-transform duration-300 group-open:rotate-45" />
          </summary>
          <p className="max-w-3xl pb-8 text-fg/75">{item.a}</p>
        </details>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
};
