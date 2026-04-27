import { getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';

type Project = {
  key: string;
  href?: string;
  stack: string[];
};

const projects: Project[] = [
  { key: 'amplyd', href: 'https://github.com/plyd/amplyd', stack: ['Next.js', 'LangGraph', 'GCP'] },
  { key: 'rag', stack: ['BM25', 'Embeddings', 'litellm'] },
  { key: 'governance', stack: ['ISO 42001', 'LangFuse', 'Guardrails'] },
];

export async function ProjectGrid({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'projects' });

  return (
    <section id="projects" className="py-24">
      <Container className="flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
            {t('eyebrow')}
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            {t('title')}
          </h2>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {projects.map((p) => {
            const inner = (
              <Card className="flex h-full flex-col gap-4 transition hover:border-[var(--color-border-strong)]">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {t(`items.${p.key}.title`)}
                  </h3>
                  {p.href && (
                    <ArrowUpRight
                      size={18}
                      className="shrink-0 text-[var(--color-accent)]"
                    />
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {t(`items.${p.key}.blurb`)}
                </p>
                <ul className="mt-auto flex flex-wrap gap-2">
                  {p.stack.map((s) => (
                    <li
                      key={s}
                      className="rounded-md border border-[var(--color-border)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>
            );
            return p.href ? (
              <a
                key={p.key}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                {inner}
              </a>
            ) : (
              <div key={p.key}>{inner}</div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
