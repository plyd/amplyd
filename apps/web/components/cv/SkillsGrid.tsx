import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';

const groups: { key: string; items: string[] }[] = [
  {
    key: 'agents',
    items: ['LangGraph', 'MCP', 'Vercel AI SDK', 'Tool design', 'Eval harnesses'],
  },
  {
    key: 'rag',
    items: ['BM25', 'Embeddings', 'Hybrid search', 'Re-ranking', 'Chunking'],
  },
  {
    key: 'routing',
    items: ['litellm', 'Claude', 'GPT', 'Gemini', 'Cost/latency routing'],
  },
  {
    key: 'governance',
    items: ['ISO 42001', 'Guardrails', 'PII redaction', 'LangFuse', 'Audit trails'],
  },
  {
    key: 'platform',
    items: ['Next.js 15', 'FastAPI', 'GCP Cloud Run', 'Vercel', 'Terraform'],
  },
  {
    key: 'languages',
    items: ['Python', 'TypeScript', 'SQL', 'Bash'],
  },
];

export async function SkillsGrid({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'skills' });

  return (
    <section id="skills" className="py-24">
      <Container className="flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
            {t('eyebrow')}
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            {t('title')}
          </h2>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.key} className="flex flex-col gap-3">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
                {t(`groups.${g.key}`)}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {g.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1 font-mono text-xs text-[var(--color-text-secondary)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
