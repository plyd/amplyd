'use client';

/**
 * CvDemoTrigger — visual harness for the CvView overlay.
 *
 * Reads `?cv=<preset>` on mount and dispatches one of a handful of hardcoded
 * CvViews into the CvViewContext. Lets us iterate on the overlay UX before the
 * LangGraph agent (M5/M6) is wired in.
 *
 * The presets reference real timeline indices and project keys from the JSON
 * sources (see content/timeline.*.json and content/projects.*.json). If those
 * sources are reordered, the demo presets must be updated — the runtime
 * validator will silently drop unknown keys, but the demo would then fall
 * flat.
 *
 * Renders nothing visually. Production builds keep this in the bundle since
 * it's tiny and useful for quick reviewer demos via URL.
 */

import { useEffect } from 'react';
import { useCvView } from '@/components/cv/CvViewContext';
import type { CvView } from '@/lib/cvView';

const PRESETS: Record<string, CvView> = {
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

export function CvDemoTrigger() {
  const { setView } = useCvView();

  useEffect(() => {
    // Read the search param directly. Avoids next/navigation's
    // useSearchParams(), which forces a Suspense boundary at prerender time —
    // and that's overkill for a demo trigger that's mount-only on the client.
    if (typeof window === 'undefined') return;
    const preset = new URLSearchParams(window.location.search).get('cv');
    if (!preset) return;
    const payload = PRESETS[preset];
    if (!payload) return;
    setView(payload);
  }, [setView]);

  return null;
}
