import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { listArticles } from '@/lib/content';

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'articles' });
  const articles = await listArticles(locale);

  return (
    <Container className="flex flex-col gap-10 py-24">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
          {t('title')}
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)]">
          {t('subtitle')}
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link href={`/${locale}/articles/${a.slug}`} className="block">
              <Card className="flex h-full flex-col gap-3 transition hover:border-[var(--color-border-strong)]">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {a.title}
                </h2>
                <span className="mt-auto inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-[var(--color-accent)]">
                  {t('readMore')}
                  <ArrowRight size={12} />
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
