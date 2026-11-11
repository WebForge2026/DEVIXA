import type { Dictionary } from '@/lib/i18n/types';
import { Faq } from '@/components/ui/Faq';
import { SectionLabel } from '@/components/ui/SectionLabel';

export const FaqSection = ({ faq }: { faq: Dictionary['faq'] }) => (
  <section id="faq" aria-labelledby="faq-title" className="relative px-4 py-28 md:px-8">
    <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <SectionLabel index="07">{faq.label}</SectionLabel>
        <h2 id="faq-title" className="type-display mt-5 text-[clamp(1.8rem,3.4vw,3.4rem)]">
          {faq.title}
        </h2>
      </div>
      <div className="border border-line/20 bg-panel/80 px-6 backdrop-blur-md md:px-10 lg:col-span-8">
        <Faq items={faq.items} />
      </div>
    </div>
  </section>
);
