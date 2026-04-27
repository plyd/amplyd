import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Container';

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const year = new Date().getFullYear();

  return (
    <footer className="mt-32 border-t border-[var(--color-border)] py-12 text-sm text-[var(--color-text-muted)]">
      <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-accent)]">
            amplyd
          </span>
          <span>© {year} Vincent Juhel. {t('rights')}</span>
        </div>
        <div className="flex gap-6">
          <a href={`/${locale}/privacy`} className="hover:text-[var(--color-text-primary)]">
            {t('privacy')}
          </a>
          <a href={`/${locale}/ai-disclosure`} className="hover:text-[var(--color-text-primary)]">
            {t('ai')}
          </a>
        </div>
      </Container>
    </footer>
  );
}
