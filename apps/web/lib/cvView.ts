/**
 * CvView — the data part the agent emits to re-rank / expand / hide CV entries.
 *
 * The page renders the compact CV by default (no chat = no LLM cost). When the
 * agent decides the conversation has gone deep enough to justify it, it emits
 * a CvView and the page reorganizes:
 *
 *   - `pinned: true`        → "Match" badge, accent border, sorted to top
 *   - `expand: true`        → entry shows narrative + selected anecdotes
 *   - `show_anecdotes: [i]` → only those anecdote indices are revealed
 *   - `hidden_keys: [...]`  → entries dimmed but not removed
 *   - `reason: "..."`       → short italic banner above the CV
 *
 * The agent never invents text: it picks indices/keys into existing JSON.
 * This module validates incoming CvViews and silently drops invalid ones so
 * a malformed agent payload can never break the page.
 */

import { z } from 'zod';

const intIdx = z.number().int().nonnegative();

export const TimelineOverlaySchema = z.object({
  idx: intIdx, // index into the timeline[] array (loaded server-side)
  pinned: z.boolean().optional(),
  expand: z.boolean().optional(),
  show_anecdotes: z.array(intIdx).optional(),
  show_achievements: z.array(intIdx).optional(),
});

export const ProjectOverlaySchema = z.object({
  key: z.string().min(1), // matches ProjectEntry.key
  pinned: z.boolean().optional(),
  expand: z.boolean().optional(),
  show_anecdotes: z.array(intIdx).optional(),
  show_outcomes: z.array(intIdx).optional(),
  show_lessons: z.array(intIdx).optional(),
});

export const CvViewSchema = z.object({
  reason: z.string().min(1).max(280),
  timeline: z.array(TimelineOverlaySchema).default([]),
  projects: z.array(ProjectOverlaySchema).default([]),
  hidden_keys: z.array(z.string().min(1)).optional(),
  skills_pinned: z.array(z.string().min(1)).optional(),
});

export type TimelineOverlay = z.infer<typeof TimelineOverlaySchema>;
export type ProjectOverlay = z.infer<typeof ProjectOverlaySchema>;
export type CvView = z.infer<typeof CvViewSchema>;

/**
 * Parse an unknown payload into a CvView. Returns null on any validation
 * failure — never throws. The caller is expected to ignore null payloads.
 */
export function parseCvView(input: unknown): CvView | null {
  const result = CvViewSchema.safeParse(input);
  return result.success ? result.data : null;
}
