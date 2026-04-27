import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('hero');

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
      <section className="min-h-[60vh] flex flex-col justify-center gap-8">
        <p className="font-mono text-sm uppercase tracking-widest text-[var(--color-accent)]">
          amplyd · v1.0
        </p>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-7xl">
          Vincent Juhel
        </h1>
        <p className="max-w-2xl text-xl text-[var(--color-text-secondary)] md:text-2xl">
          {t('tagline')}
        </p>
        <div className="flex gap-4">
          <button className="rounded-lg bg-[var(--color-accent)] px-6 py-3 font-medium text-black transition hover:bg-[var(--color-accent-glow)]">
            {t('ctaChat')}
          </button>
          <button className="rounded-lg border border-[var(--color-border-strong)] px-6 py-3 font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-bg-elevated)]">
            {t('ctaCV')}
          </button>
        </div>
      </section>

      <p className="mt-24 font-mono text-xs text-[var(--color-text-muted)]">
        — Scaffolding placeholder. M2 will replace this with the full hero +
        terminal backdrop, experience timeline, skills radar, and project grid.
      </p>
    </main>
  );
}
