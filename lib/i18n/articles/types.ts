export const articleSlugs = ['ai-agent-automation', 'ai-document-processing', 'ai-email-automation'] as const;
export type ArticleSlug = (typeof articleSlugs)[number];

export type Article = {
  slug: ArticleSlug;
  title: string;
  category: string;
  lede: string;
  readMinutes: number;
  sections: { heading: string; body: string[] }[];
  takeaway: string;
};
