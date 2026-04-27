import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Container';

const SECTION_KEYS = [
  ['privacyPage', ['data', 'purpose', 'where', 'retention', 'rights', 'contact']],
  ['aiPage', ['what', 'guardrails', 'limits', 'transparency', 'human']],
] as const;

type Namespace = (typeof SECTION_KEYS)[number][0];

export async function LegalPage({
  locale,
  namespace,
}: {
  locale: string;
  namespace: Namespace;
}) {
  const t = await getTranslations({ locale, namespace });
  const sectionKeys =
    SECTION_KEYS.find(([ns]) => ns === namespace)?.[1] ?? [];

  return (
    <Container className="flex max-w-3xl flex-col gap-10 py-24">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          {t('title')}
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
          {t('lastUpdated')}
        </p>
        <p className="text-lg leading-relaxed text-[var(--color-text-secondary)]">
          {t('intro')}
        </p>
      </header>
      <div className="flex flex-col gap-8">
        {sectionKeys.map((k) => (
          <section key={k} className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {t(`sections.${k}.title`)}
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              {t(`sections.${k}.body`)}
            </p>
          </section>
        ))}
      </div>
    </Container>
  );
}
