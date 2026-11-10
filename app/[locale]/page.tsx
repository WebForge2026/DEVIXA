import { ActController } from '@/components/providers/ActController';
import { Contact } from '@/components/sections/Contact';
import { Estimator } from '@/components/sections/Estimator';
import { Footer } from '@/components/sections/Footer';
import { Hero } from '@/components/sections/Hero';
import { Insights } from '@/components/sections/Insights';
import { Journey } from '@/components/sections/Journey';
import { Projects } from '@/components/sections/Projects';
import { Services } from '@/components/sections/Services';
import { TrustRail } from '@/components/sections/TrustRail';
import { htmlLang, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n';
import { getArticles } from '@/lib/i18n/articles';

const HomePage = ({ params }: { params: { locale: Locale } }) => {
  const dict = getDictionary(params.locale);

  return (
    <>
      <ActController initial="light" trigger="#journey" hero="#hero" />
      <main id="main">
        <Hero hero={dict.hero} />
        <TrustRail trust={dict.trust} />
        <Journey journey={dict.journey} />
        <Services locale={params.locale} services={dict.services} />
        <Projects projects={dict.projects} />
        <Estimator estimator={dict.estimator} contact={dict.contact} intlLocale={htmlLang[params.locale]} />
        <Insights locale={params.locale} insights={dict.insights} articles={getArticles(params.locale)} />
        <Contact locale={params.locale} contact={dict.contact} />
      </main>
      <Footer locale={params.locale} footer={dict.footer} nav={dict.nav} />
    </>
  );
};

export default HomePage;
