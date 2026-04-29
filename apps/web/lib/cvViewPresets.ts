/**
 * Shared CvView presets.
 *
 * Two consumers:
 *   1. CvDemoTrigger — visual review via ?cv=<preset>.
 *   2. /api/chat placeholder — picks a preset based on keywords in the latest
 *      user message until the LangGraph agent (M5+) takes over.
 *
 * Indices and project keys must stay in sync with the JSON sources in
 * apps/web/content/. The Zod schema silently drops unknown keys at the
 * client boundary, but a wrong index here would just produce a no-op.
 */

import type { CvView } from './cvView';

export type PresetKey = 'rag' | 'founder' | 'iso';

export const PRESETS: Record<PresetKey, CvView> = {
  // RAG senior pitch — surfaces Amplyd + SpeedFlow with their narratives.
  rag: {
    reason:
      'Vous m\'avez parlé de RAG senior, voici ce qui colle dans le parcours de Vincent.',
    timeline: [
      {
        idx: 0, // BKSystèmes — SpeedFlow
        pinned: true,
        expand: true,
        show_anecdotes: [0],
        show_achievements: [0, 1, 2],
      },
    ],
    projects: [
      { key: 'amplyd', pinned: true, expand: true },
      { key: 'speedflow', pinned: true, expand: true, show_outcomes: [0, 1] },
    ],
    skills_pinned: ['LangGraph', 'LangChain', 'RAG hybride', 'pgvector', 'Cohere rerank'],
  },

  // Founder / 0-to-1 track.
  founder: {
    reason: 'Le parcours fondateur : Lisa.blue, Pipop, Vinland.',
    timeline: [
      { idx: 1, pinned: true, expand: true }, // Vinland
      { idx: 3, pinned: true, expand: true, show_anecdotes: [0] }, // Pipop
      { idx: 6, pinned: true, expand: true, show_achievements: [0] }, // Lisa.blue
    ],
    projects: [
      { key: 'lisa-blue', pinned: true, expand: true },
      { key: 'rdv-ophtalmo', pinned: true, expand: true },
    ],
  },

  // ISO 42001 / governance pitch.
  iso: {
    reason: 'Gouvernance IA et ISO 42001 — voici les preuves.',
    timeline: [
      {
        idx: 0,
        pinned: true,
        expand: true,
        show_anecdotes: [0],
        show_achievements: [0],
      },
    ],
    projects: [
      { key: 'speedflow', pinned: true, expand: true, show_outcomes: [0] },
    ],
    hidden_keys: [
      'timeline:7', // RDV Ophtalmo (older, less relevant for this pitch)
      'timeline:8', // Amadeus / Kelbillet
    ],
    skills_pinned: ['ISO 42001', 'LangFuse', 'Audit IA'],
  },
};

/**
 * Map a free-form user message to a preset, or null if no keywords match.
 * Word boundaries are enforced where the term is short enough that a
 * substring match would over-trigger (e.g. 'rag' inside 'fragile').
 */
export function pickPresetForMessage(message: string): CvView | null {
  const m = message.toLowerCase();

  // ISO 42001 / governance pitch wins over RAG when both terms appear,
  // because governance is a more specific intent.
  if (/iso[\s-]?42001|gouvernance|audit\s*ia/.test(m)) return PRESETS.iso;

  if (/\brag\b|retrieval|vectoriel|embedding/.test(m)) return PRESETS.rag;

  if (/\b(founder|fondateur|fondatrice|cto|ceo|0-to-1|0\s*à\s*1)\b/.test(m)) {
    return PRESETS.founder;
  }

  return null;
}
