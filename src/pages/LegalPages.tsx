import { ActController } from '@/components/providers/ActController';
import { Footer } from '@/components/sections/Footer';
import { LegalPage } from '@/components/sections/LegalPage';
import { getSiteDictionary } from '@/lib/admin/content';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/config';
import { Seo } from '@/src/lib/seo';
import { getLegal } from '@/lib/i18n/legal';

export const ImprintPage = ({ locale }: { locale: Locale }) => {
  const dict = getSiteDictionary(locale);
  return (
    <>
      <Seo locale={locale} path="/imprint" title={getLegal(locale).imprint.title} description={getDictionary(locale).meta.imprint} />
      <ActController initial="light" veil />
      <main id="main" className="px-4 pb-28 pt-32 md:px-8">
        <LegalPage doc={getLegal(locale).imprint} />
      </main>
      <Footer locale={locale} footer={dict.footer} nav={dict.nav} consentLabel={dict.consent.settings} />
    </>
  );
};

export const PrivacyPage = ({ locale }: { locale: Locale }) => {
  const dict = getSiteDictionary(locale);
  return (
    <>
      <Seo locale={locale} path="/privacy" title={getLegal(locale).privacy.title} description={getDictionary(locale).meta.privacy} />
      <ActController initial="light" veil />
      <main id="main" className="px-4 pb-28 pt-32 md:px-8">
        <LegalPage doc={getLegal(locale).privacy} />
      </main>
      <Footer locale={locale} footer={dict.footer} nav={dict.nav} consentLabel={dict.consent.settings} />
    </>
  );
};
