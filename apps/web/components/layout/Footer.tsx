import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Container';

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const year = new Date().getFullYear();

  return (
    <footer className="mt-32 border-t border-[var(--color-border)] py-10 text-xs text-[var(--color-text-muted)]">
      <Container className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <span>© {year} Vincent Juhel · Vinland SASU. {t('rights')}</span>
        <div className="flex flex-wrap items-center gap-6">
          <a href={`/${locale}/privacy`} className="hover:text-[var(--color-text-primary)]">
            {t('privacy')}
          </a>
          <a href={`/${locale}/ai-disclosure`} className="hover:text-[var(--color-text-primary)]">
            {t('ai')}
          </a>
          <span className="text-[var(--color-text-muted)]">
            {t('builtWith')}{' '}
            <a
              href="https://github.com/plyd/amplyd"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[var(--color-accent)] hover:underline"
            >
              amplyd
            </a>
          </span>
        </div>
      </Container>
    </footer>
  );
}
