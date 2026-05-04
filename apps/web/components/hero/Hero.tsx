import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { OpenChatButton } from './OpenChatButton';
import { BookCallButton } from './BookCallButton';
import { TerminalBackdrop } from './TerminalBackdrop';

export async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'hero' });

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)]">
      <TerminalBackdrop />
      <Container className="relative flex flex-col gap-4 py-12 md:py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Vincent Juhel
          </h1>
          <div className="flex flex-col items-end gap-0.5 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-muted)] md:text-xs">
            <span>{t('location')}</span>
            <span>{t('remote')}</span>
          </div>
        </div>
        <p className="text-base text-[var(--color-text-secondary)] md:text-lg">
          <span className="text-[var(--color-text-primary)]">{t('role')}</span>
          <span className="mx-2 text-[var(--color-text-muted)]">·</span>
          <span className="font-mono text-sm text-[var(--color-text-muted)]">{t('facts')}</span>
        </p>
        <p className="max-w-2xl text-sm text-[var(--color-text-secondary)]">{t('tagline')}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <OpenChatButton label={t('ctaChat')} />
          <Button variant="secondary" asChild>
            <a href="#cv">
              {t('ctaCV')}
              <ArrowRight size={14} />
            </a>
          </Button>
          <BookCallButton label={t('ctaBook')} ariaLabel={t('ctaBookAria')} />
        </div>
      </Container>
    </section>
  );
}
