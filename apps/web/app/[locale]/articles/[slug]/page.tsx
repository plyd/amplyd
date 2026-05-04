import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { readArticle } from '@/lib/content';
import { JsonLd } from '@/components/seo/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await readArticle(locale, slug);
  if (!article) return {};
  const title = article.meta.title;
  // Article frontmatter optionally exposes `description` / `summary`. Fall
  // back to the first non-empty body line so we never ship a bare title.
  const firstLine = article.body
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#') && !l.startsWith('---'));
  const description = article.meta.description ?? firstLine ?? title;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/articles/${slug}`,
      languages: {
        en: `/en/articles/${slug}`,
        fr: `/fr/articles/${slug}`,
        'x-default': `/en/articles/${slug}`,
      },
    },
    openGraph: {
      type: 'article',
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      title,
      description,
      url: `/${locale}/articles/${slug}`,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'articles' });
  const article = await readArticle(locale, slug);
  if (!article) notFound();

  const datePublished = article.meta.datePublished;
  const articleSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: article.meta.title,
    author: { '@type': 'Person', name: 'Vincent Juhel' },
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
  };
  if (datePublished) articleSchema.datePublished = datePublished;

  return (
    <Container className="flex max-w-3xl flex-col gap-8 py-24">
      <JsonLd data={articleSchema} />
      <Link
        href={`/${locale}/articles`}
        className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]"
      >
        <ArrowLeft size={12} />
        {t('title')}
      </Link>
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
        {article.meta.title}
      </h1>
      <article className="prose prose-invert max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {article.body}
      </article>
    </Container>
  );
}
