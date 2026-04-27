import { getTranslations } from 'next-intl/server';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { TerminalBackdrop } from './TerminalBackdrop';

export async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'hero' });

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)]">
      <TerminalBackdrop />
      <Container className="relative flex min-h-[80vh] flex-col justify-center gap-8 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
          amplyd · v1.0
        </p>
        <h1 className="font-display max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
          Vincent Juhel
        </h1>
        <p className="max-w-2xl text-xl text-[var(--color-text-secondary)] md:text-2xl">
          {t('tagline')}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button size="lg">
            <MessageSquare size={18} />
            {t('ctaChat')}
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a href="#cv">
              {t('ctaCV')}
              <ArrowRight size={16} />
            </a>
          </Button>
        </div>
      </Container>
    </section>
  );
}
