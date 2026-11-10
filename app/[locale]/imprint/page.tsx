import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ActController } from '@/components/providers/ActController';
import { Footer } from '@/components/sections/Footer';
import { LegalPage } from '@/components/sections/LegalPage';
import { getDictionary } from '@/lib/i18n';
import { htmlLang, isLocale, locales } from '@/lib/i18n/config';
import { getLegal } from '@/lib/i18n/legal';

export const generateMetadata = ({ params }: { params: { locale: string } }): Metadata =>
  isLocale(params.locale)
    ? {
        title: getLegal(params.locale).imprint.title,
        alternates: {
          canonical: `/${params.locale}/imprint`,
          languages: Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}/imprint`])),
        },
      }
    : {};

const Page = ({ params }: { params: { locale: string } }) => {
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  return (
    <>
      <ActController initial="light" veil />
      <main id="main" className="px-4 pb-28 pt-32 md:px-8">
        <LegalPage doc={getLegal(params.locale).imprint} />
      </main>
      <Footer locale={params.locale} footer={dict.footer} nav={dict.nav} />
    </>
  );
};

export default Page;
