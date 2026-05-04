'use client';

/**
 * Client view: same compact layout as before, but reactive to a CvView from
 * the agent (or the demo trigger). Sort order, expansion state, dimming and
 * the "reason" banner all derive from `useCvView()`.
 *
 * Invariant: when no CvView is dispatched, the rendered HTML is identical to
 * the pre-Phase-C output (modulo the data-* attributes used for tests).
 */

import { useMemo } from 'react';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import type { SkillGroupKey, EducationEntry, ProjectEntry, TimelineEntry } from '@/lib/content';
import { useCvView } from '@/components/cv/CvViewContext';
import { CvDemoTrigger } from '@/components/cv/CvDemoTrigger';

export type ResumeStrings = {
  sections: {
    experience: string;
    projects: string;
    education: string;
    skills: string;
    languages: string;
    contact: string;
  };
  languagesList: string;
  contactBody: string;
  matchBadge: string;
  resetLabel: string;
  skillGroupNames: Record<SkillGroupKey, string>;
};

type SkillGroupSummary = { key: SkillGroupKey; items: string[] };

type Props = {
  timeline: TimelineEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  skillGroups: SkillGroupSummary[];
  strings: ResumeStrings;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--color-accent)]">
      {children}
    </h2>
  );
}

function pickByIndices<T>(arr: T[] | undefined, idx: number[] | undefined): T[] | undefined {
  if (!arr || !idx?.length) return undefined;
  const out: T[] = [];
  for (const i of idx) {
    if (i >= 0 && i < arr.length) out.push(arr[i]!);
  }
  return out.length > 0 ? out : undefined;
}

export function ResumeView({ timeline, projects, education, skillGroups, strings }: Props) {
  const { view, reset } = useCvView();

  // Build lookup maps from the view payload.
  const timelineOverlayByIdx = useMemo(() => {
    const m = new Map<number, NonNullable<typeof view>['timeline'][number]>();
    view?.timeline.forEach((o) => m.set(o.idx, o));
    return m;
  }, [view]);

  const projectOverlayByKey = useMemo(() => {
    const m = new Map<string, NonNullable<typeof view>['projects'][number]>();
    view?.projects.forEach((o) => m.set(o.key, o));
    return m;
  }, [view]);

  const hiddenKeys = useMemo(() => new Set(view?.hidden_keys ?? []), [view]);
  const skillsPinned = useMemo(() => new Set(view?.skills_pinned ?? []), [view]);

  // Sort: pinned entries first (stable), then the rest in their original order.
  const orderedTimeline = useMemo(() => {
    const indexed = timeline.map((entry, idx) => ({ entry, idx }));
    indexed.sort((a, b) => {
      const ap = timelineOverlayByIdx.get(a.idx)?.pinned ? 0 : 1;
      const bp = timelineOverlayByIdx.get(b.idx)?.pinned ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.idx - b.idx;
    });
    return indexed;
  }, [timeline, timelineOverlayByIdx]);

  const orderedProjects = useMemo(() => {
    const indexed = projects.map((entry, idx) => ({ entry, idx }));
    indexed.sort((a, b) => {
      const ap = projectOverlayByKey.get(a.entry.key)?.pinned ? 0 : 1;
      const bp = projectOverlayByKey.get(b.entry.key)?.pinned ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.idx - b.idx;
    });
    return indexed;
  }, [projects, projectOverlayByKey]);

  return (
    <section
      id="cv"
      className="scroll-mt-20 py-14 md:py-16"
      data-cv-active={view !== null ? 'true' : 'false'}
    >
      <Container>
        {/* Reason banner + reset, shown only when an overlay is active. */}
        {view && (
          <div
            className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-4 py-3"
            data-cv-reason={view.reason}
          >
            <p className="text-xs italic leading-relaxed text-[var(--color-text-secondary)]">
              {view.reason}
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
              data-testid="cv-reset"
            >
              <RotateCcw size={12} />
              {strings.resetLabel}
            </button>
          </div>
        )}

        <div className="grid gap-12 md:grid-cols-3 md:gap-x-12 md:gap-y-12">
          {/* MAIN COLUMN */}
          <div className="flex flex-col gap-12 md:col-span-2">
            {/* Experience */}
            <div className="flex flex-col gap-5">
              <SectionTitle>{strings.sections.experience}</SectionTitle>
              <ol className="flex flex-col gap-5 border-l border-[var(--color-border)] pl-5">
                {orderedTimeline.map(({ entry: r, idx }) => {
                  const overlay = timelineOverlayByIdx.get(idx);
                  const pinned = overlay?.pinned ?? false;
                  const expand = overlay?.expand ?? false;
                  const dimmed = hiddenKeys.has(`timeline:${idx}`);
                  const anecdotes = pickByIndices(r.anecdotes, overlay?.show_anecdotes);
                  const achievements = pickByIndices(
                    r.achievements,
                    overlay?.show_achievements,
                  );
                  return (
                    <li
                      key={`${r.period}-${r.company}`}
                      className={`relative ${dimmed ? 'opacity-40' : ''} ${
                        pinned
                          ? '-ml-3 rounded-md border-l-2 border-[var(--color-accent)] bg-[var(--color-bg-elev)] pl-3'
                          : ''
                      }`}
                      data-pinned={pinned ? 'true' : 'false'}
                      data-cv-key={`timeline:${idx}`}
                    >
                      <span className="absolute -left-[27px] top-[7px] h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                          {r.period}
                        </p>
                        {pinned && (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-accent)]">
                            {strings.matchBadge}
                          </span>
                        )}
                      </div>
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

                      {expand && r.narrative && (
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">
                          {r.narrative}
                        </p>
                      )}

                      {achievements && (
                        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-[var(--color-text-secondary)]">
                          {achievements.map((a, i) => (
                            <li key={i} className="leading-relaxed">
                              ✓ {a}
                            </li>
                          ))}
                        </ul>
                      )}

                      {anecdotes && (
                        <ul className="mt-3 flex flex-col gap-2 text-sm italic text-[var(--color-text-secondary)]">
                          {anecdotes.map((a, i) => (
                            <li
                              key={i}
                              className="border-l border-[var(--color-border)] pl-3 leading-relaxed"
                            >
                              {a}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Projects */}
            {projects.length > 0 && (
              <div className="flex flex-col gap-5">
                <SectionTitle>{strings.sections.projects}</SectionTitle>
                <ul className="flex flex-col">
                  {orderedProjects.map(({ entry: p }) => {
                    const overlay = projectOverlayByKey.get(p.key);
                    const pinned = overlay?.pinned ?? false;
                    const expand = overlay?.expand ?? false;
                    const dimmed = hiddenKeys.has(p.key);
                    const anecdotes = pickByIndices(p.anecdotes, overlay?.show_anecdotes);
                    const outcomes = pickByIndices(p.outcomes, overlay?.show_outcomes);
                    const lessons = pickByIndices(p.lessons, overlay?.show_lessons);
                    const inner = (
                      <div
                        className={`flex flex-col gap-1.5 border-b border-[var(--color-border)] py-3 first:pt-0 last:border-b-0 last:pb-0 ${
                          dimmed ? 'opacity-40' : ''
                        } ${pinned ? '-mx-3 rounded-md bg-[var(--color-bg-elev)] px-3' : ''}`}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {p.title}
                            {p.href && (
                              <ArrowUpRight
                                size={12}
                                className="ml-1 inline align-baseline text-[var(--color-accent)]"
                              />
                            )}
                            {pinned && (
                              <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-accent)]">
                                {strings.matchBadge}
                              </span>
                            )}
                          </h3>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                            {p.stack.slice(0, 4).join(' · ')}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                          {p.blurb}
                        </p>

                        {expand && p.narrative && (
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">
                            {p.narrative}
                          </p>
                        )}

                        {outcomes && (
                          <ul className="mt-2 flex flex-col gap-1 text-sm text-[var(--color-text-secondary)]">
                            {outcomes.map((o, i) => (
                              <li key={i} className="leading-relaxed">
                                ✓ {o}
                              </li>
                            ))}
                          </ul>
                        )}

                        {anecdotes && (
                          <ul className="mt-2 flex flex-col gap-2 text-sm italic text-[var(--color-text-secondary)]">
                            {anecdotes.map((a, i) => (
                              <li
                                key={i}
                                className="border-l border-[var(--color-border)] pl-3 leading-relaxed"
                              >
                                {a}
                              </li>
                            ))}
                          </ul>
                        )}

                        {lessons && (
                          <ul className="mt-2 flex flex-col gap-1 text-sm text-[var(--color-text-secondary)]">
                            {lessons.map((l, i) => (
                              <li key={i} className="leading-relaxed">
                                → {l}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                    return p.href ? (
                      <li key={p.key} data-pinned={pinned ? 'true' : 'false'} data-cv-key={p.key}>
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
                      <li key={p.key} data-pinned={pinned ? 'true' : 'false'} data-cv-key={p.key}>
                        {inner}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* SIDE COLUMN */}
          <aside className="flex flex-col gap-10">
            {/* Portrait */}
            <div className="flex justify-center md:justify-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/og-photo.jpeg"
                alt="Vincent Juhel"
                width={224}
                height={224}
                loading="lazy"
                decoding="async"
                className="aspect-square w-40 rounded-lg border border-[var(--color-border)] object-cover md:w-56"
              />
            </div>

            {/* Education */}
            {education.length > 0 && (
              <div className="flex flex-col gap-4">
                <SectionTitle>{strings.sections.education}</SectionTitle>
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
            {skillGroups.length > 0 && (
              <div className="flex flex-col gap-4">
                <SectionTitle>{strings.sections.skills}</SectionTitle>
                <ul className="flex flex-col gap-3">
                  {skillGroups.map((g) => {
                    const pinnedItems = g.items.filter((n) => skillsPinned.has(n));
                    const otherItems = g.items.filter((n) => !skillsPinned.has(n));
                    return (
                      <li key={g.key} className="flex flex-col gap-1">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                          {strings.skillGroupNames[g.key]}
                        </p>
                        <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                          {pinnedItems.length > 0 && (
                            <span className="text-[var(--color-accent)]">
                              {pinnedItems.join(' · ')}
                            </span>
                          )}
                          {pinnedItems.length > 0 && otherItems.length > 0 && (
                            <span className="text-[var(--color-text-muted)]"> · </span>
                          )}
                          {otherItems.join(' · ')}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Languages */}
            <div className="flex flex-col gap-4">
              <SectionTitle>{strings.sections.languages}</SectionTitle>
              <p className="whitespace-pre-line text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {strings.languagesList}
              </p>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-4">
              <SectionTitle>{strings.sections.contact}</SectionTitle>
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {strings.contactBody}
              </p>
            </div>
          </aside>
        </div>

        <CvDemoTrigger />
      </Container>
    </section>
  );
}
