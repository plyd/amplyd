import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { loadTimeline } from '@/lib/content';

export async function ExperienceTimeline({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'experience' });
  const roles = await loadTimeline(locale);

  return (
    <section id="cv" className="scroll-mt-20 py-24">
      <Container className="flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
            {t('eyebrow')}
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            {t('title')}
          </h2>
        </header>
        <ol className="relative flex flex-col gap-8 border-l border-[var(--color-border)] pl-6">
          {roles.map((r) => (
            <li key={`${r.period}-${r.company}`} className="relative">
              <span className="absolute -left-[33px] top-2 h-3 w-3 rounded-full border border-[var(--color-accent)] bg-[var(--color-bg)]" />
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
                {r.period}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
                {r.title} ·{' '}
                <span className="text-[var(--color-text-secondary)]">{r.company}</span>
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-secondary)]">
                {r.blurb}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
