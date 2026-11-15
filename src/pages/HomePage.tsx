import { ActController } from '@/components/providers/ActController';
import { Contact } from '@/components/sections/Contact';
import { Estimator } from '@/components/sections/Estimator';
import { FaqSection } from '@/components/sections/FaqSection';
import { Footer } from '@/components/sections/Footer';
import { Hero } from '@/components/sections/Hero';
import { Insights } from '@/components/sections/Insights';
import { Journey } from '@/components/sections/Journey';
import { Process } from '@/components/sections/Process';
import { Projects } from '@/components/sections/Projects';
import { Services } from '@/components/sections/Services';
import { TrustRail } from '@/components/sections/TrustRail';
import { htmlLang, type Locale } from '@/lib/i18n/config';
import { Seo } from '@/src/lib/seo';
import { getPublishedContent, getSiteDictionary } from '@/lib/admin/content';
import { getDictionary } from '@/lib/i18n';
import { getArticles } from '@/lib/i18n/articles';

export const HomePage = ({ locale }: { locale: Locale }) => {
  const dict = getSiteDictionary(locale);
  const content = getPublishedContent();

  return (
    <>
      <Seo locale={locale} path="" title={getDictionary(locale).meta.title} description={dict.meta.description} absoluteTitle />
      <ActController initial="light" trigger="#journey" hero="#hero" />
      <main id="main">
        <Hero hero={dict.hero} />
        <TrustRail trust={dict.trust} />
        <Journey journey={dict.journey} />
        <Services locale={locale} services={dict.services} />
        <Projects projects={dict.projects} media={content.media} />
        <Process process={dict.process} />
        <Estimator estimator={dict.estimator} contact={dict.contact} intlLocale={htmlLang[locale]} />
        <Insights locale={locale} insights={dict.insights} articles={getArticles(locale)} />
        <FaqSection faq={dict.faq} />
        <Contact locale={locale} contact={dict.contact} />
      </main>
      <Footer locale={locale} footer={dict.footer} nav={dict.nav} consentLabel={dict.consent.settings} />
    </>
  );
};
