# ADR-0003 — Fumadocs for MDX content + llms.txt

- Status: Accepted
- Date: 2026-04-27

## Context

The site is content-heavy (profile, articles, projects). We need the same
files to serve humans (MDX rendered) and AI agents (`llms.txt`,
`llms-full.txt`, content negotiation).

## Decision

Use **Fumadocs** (`fumadocs-mdx` + `fumadocs-ui`) as the content layer.

## Why

- Auto-generates `llms.txt` and `llms-full.txt`.
- First-class content negotiation for AI fetchers.
- MDX with React components gives us interactive elements (FitScoreCard,
  ExperienceTimeline) right in the article body.
- Plays well with App Router and TypeScript strict mode.

## Consequences

- We adopt Fumadocs' source/route conventions.
- `fumadocs-mdx` config sits alongside `next.config.ts`; build step runs a
  one-shot codegen pass.
