import { notFound } from 'next/navigation';
import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { readArticle } from '@/lib/content';

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

  return (
    <Container className="flex max-w-3xl flex-col gap-8 py-24">
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
