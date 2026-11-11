import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ActController } from '@/components/providers/ActController';
import { Footer } from '@/components/sections/Footer';
import { LegalPage } from '@/components/sections/LegalPage';
import { getDictionary } from '@/lib/i18n';
import { isLocale } from '@/lib/i18n/config';
import { pageMetadata } from '@/lib/seo';
import { getLegal } from '@/lib/i18n/legal';

export const generateMetadata = ({ params }: { params: { locale: string } }): Metadata => {
  if (!isLocale(params.locale)) return {};
  const { meta } = getDictionary(params.locale);
  return pageMetadata({ locale: params.locale, path: '/privacy', title: getLegal(params.locale).privacy.title, description: meta.privacy });
};

const Page = ({ params }: { params: { locale: string } }) => {
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);

  return (
    <>
      <ActController initial="light" veil />
      <main id="main" className="px-4 pb-28 pt-32 md:px-8">
        <LegalPage doc={getLegal(params.locale).privacy} />
      </main>
      <Footer locale={params.locale} footer={dict.footer} nav={dict.nav} consentLabel={dict.consent.settings} />
    </>
  );
};

export default Page;
