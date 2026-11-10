import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ActController } from '@/components/providers/ActController';
import { Footer } from '@/components/sections/Footer';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n';

export const generateMetadata = ({ params }: { params: { locale: string } }): Metadata =>
  isLocale(params.locale) ? { title: getDictionary(params.locale).privacy.title, robots: { index: false } } : {};

const Page = ({ params }: { params: { locale: string } }) => {
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const content = dict.privacy;

  return (
    <>
      <ActController initial="light" />
      <main id="main" className="px-4 pb-28 pt-32 md:px-8">
        <article className="mx-auto max-w-3xl">
          <h1 className="type-display text-[clamp(2.4rem,6vw,5rem)]">{content.title}</h1>
          <div className="mt-12 space-y-6 border-t border-line/20 pt-10 text-lg leading-relaxed">
            {content.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      </main>
      <Footer locale={params.locale} footer={dict.footer} nav={dict.nav} />
    </>
  );
};

export default Page;
