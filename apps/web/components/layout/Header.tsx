import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Github } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { LocaleSwitcher } from './LocaleSwitcher';

export async function Header({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href={`/${locale}`}
          className="font-mono text-sm font-semibold tracking-widest text-[var(--color-accent)]"
        >
          amplyd
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href={`/${locale}`}
            className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
          >
            {t('home')}
          </Link>
          <Link
            href={`/${locale}/articles`}
            className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
          >
            {t('articles')}
          </Link>
          <a
            href="https://github.com/plyd/amplyd"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
          >
            <Github size={14} />
            <span>{t('github')}</span>
          </a>
        </nav>

        <LocaleSwitcher />
      </Container>
    </header>
  );
}
