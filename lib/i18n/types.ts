import type { ServiceSlug } from '@/lib/site';

export type PainPoint = { title: string; body: string };
export type Faq = { q: string; a: string };

export type Service = {
  slug: ServiceSlug;
  name: string;
  /** Search result title, max ~60 characters (" | Devixa" is appended). */
  seoTitle: string;
  category: string;
  headline: string;
  subheadline: string;
  pains: PainPoint[];
  approach?: string;
  stack: string[];
  timeline?: string;
  included: string[];
  caseStudy?: { name: string; body: string };
  faq?: Faq[];
};

export type Project = {
  name: string;
  sector: string;
  client: string;
  task: string;
  solution: string;
  tech: string[];
  url?: string;
};

export type Dictionary = {
  meta: { title: string; description: string; imprint: string; privacy: string; notFound: string };
  nav: { services: string; journey: string; work: string; estimate: string; insights: string; contact: string; cta: string };
  hero: {
    eyebrow: string;
    headline: [string, string, string];
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scroll: string;
    coreHint: string;
  };
  trust: { label: string; items: string[] };
  journey: {
    label: string;
    title: string;
    intro: string;
    steps: { title: string; tag: string; body: string }[];
  };
  services: { label: string; title: string; intro: string; open: string; items: Service[] };
  servicePage: {
    back: string;
    pains: string;
    approach: string;
    included: string;
    stack: string;
    timeline: string;
    caseStudy: string;
    faq: string;
    cta: string;
    ctaBody: string;
  };
  projects: {
    label: string;
    title: string;
    fields: { client: string; task: string; solution: string; tech: string; live: string };
    items: Project[];
  };
  estimator: {
    label: string;
    title: string;
    intro: string;
    systemType: string;
    systems: { id: string; label: string }[];
    features: string;
    featureOptions: { id: string; label: string }[];
    timeline: string;
    timelines: { id: string; label: string }[];
    result: string;
    market: string;
    vat: string;
    disclaimer: string;
    email: string;
    submit: string;
    success: string;
  };
  process: { label: string; title: string; intro: string; steps: { title: string; body: string }[] };
  faq: { label: string; title: string; items: { q: string; a: string }[] };
  consent: { text: string; accept: string; decline: string; settings: string };
  insights: { label: string; title: string; read: string; minutes: string; back: string; takeaway: string; more: string };
  contact: {
    label: string;
    title: string;
    intro: string;
    fields: {
      fullName: string;
      email: string;
      company: string;
      projectType: string;
      budget: string;
      message: string;
      consent: string;
      privacyLink: string;
    };
    projectTypes: string[];
    budgets: string[];
    submit: string;
    sending: string;
    success: string;
    errorGeneric: string;
    errorConfig: string;
    errors: { name: string; email: string; message: string; consent: string; rate: string };
  };
  footer: {
    tagline: string;
    badgeHint: string;
    markets: string;
    legal: string;
    imprint: string;
    privacy: string;
    rights: string;
    language: string;
  };
};
