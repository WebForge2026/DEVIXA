import type { Dictionary } from '@/lib/i18n/types';

/**
 * Every text the admin can edit, grouped by page section. `path` addresses the dictionary
 * (lib/i18n/dictionaries/*.ts); unedited fields keep the built-in default.
 */
export type EditableField = { path: string; label: string; multiline?: boolean };
export type EditableSection = { id: string; label: string; fields: EditableField[] };

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export const editableSections: EditableSection[] = [
  {
    id: 'hero',
    label: 'Hero',
    fields: [
      { path: 'hero.eyebrow', label: 'Eyebrow' },
      { path: 'hero.headline.0', label: 'Headline line 1' },
      { path: 'hero.headline.1', label: 'Headline line 2 (outline)' },
      { path: 'hero.headline.2', label: 'Headline line 3 (last word red)' },
      { path: 'hero.sub', label: 'Subheadline', multiline: true },
      { path: 'hero.ctaPrimary', label: 'Primary button' },
      { path: 'hero.ctaSecondary', label: 'Secondary button' },
    ],
  },
  {
    id: 'trust',
    label: 'Commitments',
    fields: [{ path: 'trust.label', label: 'Label' }, ...range(5).map((i) => ({ path: `trust.items.${i}`, label: `Commitment ${i + 1}` }))],
  },
  {
    id: 'journey',
    label: 'Growth path',
    fields: [
      { path: 'journey.title', label: 'Title' },
      { path: 'journey.intro', label: 'Intro', multiline: true },
      ...range(5).flatMap((i) => [
        { path: `journey.steps.${i}.title`, label: `Stage ${i + 1} · title` },
        { path: `journey.steps.${i}.tag`, label: `Stage ${i + 1} · tag` },
        { path: `journey.steps.${i}.body`, label: `Stage ${i + 1} · text`, multiline: true },
      ]),
    ],
  },
  {
    id: 'services',
    label: 'Services',
    fields: [
      { path: 'services.title', label: 'Title' },
      { path: 'services.intro', label: 'Intro', multiline: true },
      ...range(3).flatMap((i) => [
        { path: `services.items.${i}.name`, label: `Service ${i + 1} · name` },
        { path: `services.items.${i}.subheadline`, label: `Service ${i + 1} · summary`, multiline: true },
      ]),
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    fields: [
      { path: 'projects.title', label: 'Title' },
      ...range(3).flatMap((i) => [
        { path: `projects.items.${i}.client`, label: `Project ${i + 1} · client`, multiline: true },
        { path: `projects.items.${i}.task`, label: `Project ${i + 1} · task`, multiline: true },
        { path: `projects.items.${i}.solution`, label: `Project ${i + 1} · solution`, multiline: true },
      ]),
    ],
  },
  {
    id: 'process',
    label: 'Process',
    fields: [
      { path: 'process.title', label: 'Title' },
      { path: 'process.intro', label: 'Intro', multiline: true },
      ...range(4).flatMap((i) => [
        { path: `process.steps.${i}.title`, label: `Step ${i + 1} · title` },
        { path: `process.steps.${i}.body`, label: `Step ${i + 1} · text`, multiline: true },
      ]),
    ],
  },
  {
    id: 'calculator',
    label: 'Calculator',
    fields: [
      { path: 'estimator.title', label: 'Title' },
      { path: 'estimator.intro', label: 'Intro', multiline: true },
      { path: 'estimator.disclaimer', label: 'Disclaimer', multiline: true },
      { path: 'estimator.submit', label: 'Submit button' },
      { path: 'estimator.success', label: 'Success message', multiline: true },
    ],
  },
  {
    id: 'faq',
    label: 'FAQ',
    fields: [
      { path: 'faq.title', label: 'Title' },
      ...range(6).flatMap((i) => [
        { path: `faq.items.${i}.q`, label: `Question ${i + 1}` },
        { path: `faq.items.${i}.a`, label: `Answer ${i + 1}`, multiline: true },
      ]),
    ],
  },
  {
    id: 'contact',
    label: 'Contact & footer',
    fields: [
      { path: 'contact.title', label: 'Contact title' },
      { path: 'contact.intro', label: 'Contact intro', multiline: true },
      { path: 'contact.submit', label: 'Submit button' },
      { path: 'contact.success', label: 'Success message', multiline: true },
      { path: 'footer.tagline', label: 'Footer tagline', multiline: true },
    ],
  },
];

export const editablePaths = new Set(editableSections.flatMap((s) => s.fields.map((f) => f.path)));

/** Media slots on the public site (project cards). Each slot holds up to MAX_SLOT_IMAGES images. */
export const mediaSlots = [
  { id: 'project-0', label: 'Project 1 · Snow-School.bg' },
  { id: 'project-1', label: 'Project 2 · Modelo MES' },
  { id: 'project-2', label: 'Project 3 · ManWalt' },
] as const;
export const MAX_SLOT_IMAGES = 4;

export const getPath = (source: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), source);

/** Writes a string at `path`, only if a string already exists there (protects the dictionary shape). */
export const setStringAtPath = (target: Dictionary, path: string, value: string) => {
  const keys = path.split('.');
  const last = keys.pop();
  const parent = keys.reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), target);
  if (!last || !parent || typeof parent !== 'object') return;
  const record = parent as Record<string, unknown>;
  if (typeof record[last] === 'string') record[last] = value;
};
