import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { loadEducation } from '@/lib/content';

export async function EducationGrid({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'education' });
  const items = await loadEducation(locale);

  if (items.length === 0) return null;

  return (
    <section id="education" className="scroll-mt-20 py-24">
      <Container className="flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
            {t('eyebrow')}
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            {t('title')}
          </h2>
        </header>
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((e) => (
            <li
              key={`${e.year}-${e.institution}`}
              className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {e.institution}
                </h3>
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
                  {e.year}
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">{e.title}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{e.blurb}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
