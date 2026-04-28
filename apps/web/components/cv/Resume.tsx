import { getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { loadEducation, loadProjects, loadTimeline } from '@/lib/content';

const SKILL_GROUPS: { key: string; items: string[] }[] = [
  { key: 'agents', items: ['LangGraph', 'MCP', 'Vercel AI SDK', 'Tool design', 'Eval harnesses'] },
  { key: 'rag', items: ['BM25', 'Embeddings', 'Hybrid search', 'Re-ranking', 'Chunking'] },
  { key: 'routing', items: ['litellm', 'Claude', 'GPT', 'Gemini', 'Cost/latency routing'] },
  {
    key: 'governance',
    items: ['ISO 42001', 'Guardrails', 'PII redaction', 'LangFuse', 'Audit trails'],
  },
  { key: 'platform', items: ['Next.js 15', 'FastAPI', 'GCP Cloud Run', 'Vercel', 'Terraform'] },
  { key: 'languages', items: ['Python', 'TypeScript', 'SQL', 'Bash'] },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--color-accent)]">
      {children}
    </h2>
  );
}

export async function Resume({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'resume' });
  const tSkills = await getTranslations({ locale, namespace: 'skills' });

  const [roles, projects, education] = await Promise.all([
    loadTimeline(locale),
    loadProjects(locale),
    loadEducation(locale),
  ]);

  return (
    <section id="cv" className="scroll-mt-20 py-14 md:py-16">
      <Container>
        <div className="grid gap-12 md:grid-cols-3 md:gap-x-12 md:gap-y-12">
          {/* MAIN COLUMN */}
          <div className="flex flex-col gap-12 md:col-span-2">
            {/* Experience */}
            <div className="flex flex-col gap-5">
              <SectionTitle>{t('sections.experience')}</SectionTitle>
              <ol className="flex flex-col gap-5 border-l border-[var(--color-border)] pl-5">
                {roles.map((r) => (
                  <li key={`${r.period}-${r.company}`} className="relative">
                    <span className="absolute -left-[27px] top-[7px] h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                      {r.period}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold leading-snug text-[var(--color-text-primary)]">
                      {r.title}
                      <span className="text-[var(--color-text-muted)]"> · </span>
                      <span className="font-normal text-[var(--color-text-secondary)]">
                        {r.company}
                      </span>
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {r.blurb}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Projects */}
            {projects.length > 0 && (
              <div className="flex flex-col gap-5">
                <SectionTitle>{t('sections.projects')}</SectionTitle>
                <ul className="flex flex-col">
                  {projects.map((p) => {
                    const inner = (
                      <div className="flex flex-col gap-1.5 border-b border-[var(--color-border)] py-3 first:pt-0 last:border-b-0 last:pb-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {p.title}
                            {p.href && (
                              <ArrowUpRight
                                size={12}
                                className="ml-1 inline align-baseline text-[var(--color-accent)]"
                              />
                            )}
                          </h3>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                            {p.stack.slice(0, 4).join(' · ')}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                          {p.blurb}
                        </p>
                      </div>
                    );
                    return p.href ? (
                      <li key={p.key}>
                        <a
                          href={p.href}
                          target="_blank"
                          rel="noreferrer"
                          className="block transition hover:opacity-80"
                        >
                          {inner}
                        </a>
                      </li>
                    ) : (
                      <li key={p.key}>{inner}</li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* SIDE COLUMN */}
          <aside className="flex flex-col gap-10">
            {/* Education */}
            {education.length > 0 && (
              <div className="flex flex-col gap-4">
                <SectionTitle>{t('sections.education')}</SectionTitle>
                <ul className="flex flex-col gap-3">
                  {education.map((e) => (
                    <li
                      key={`${e.year}-${e.institution}`}
                      className="flex flex-col gap-0.5"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {e.institution}
                        </h3>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                          {e.year}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                        {e.title}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            <div className="flex flex-col gap-4">
              <SectionTitle>{t('sections.skills')}</SectionTitle>
              <ul className="flex flex-col gap-3">
                {SKILL_GROUPS.map((g) => (
                  <li key={g.key} className="flex flex-col gap-1">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                      {tSkills(`groups.${g.key}`)}
                    </p>
                    <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                      {g.items.join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Languages */}
            <div className="flex flex-col gap-4">
              <SectionTitle>{t('sections.languages')}</SectionTitle>
              <p className="whitespace-pre-line text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {t('languagesList')}
              </p>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-4">
              <SectionTitle>{t('sections.contact')}</SectionTitle>
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {t('contactBody')}
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
