'use client';

/**
 * CvDemoTrigger — visual harness for the CvView overlay.
 *
 * Reads `?cv=<preset>` on mount and dispatches one of the shared presets
 * defined in lib/cvViewPresets.ts (also reused by the chat route to drive
 * the overlay from the conversation). Lets us iterate on the overlay UX
 * before the LangGraph agent (M6) is wired in.
 *
 * Renders nothing visually. Production builds keep this in the bundle since
 * it's tiny and useful for quick reviewer demos via URL.
 */

import { useEffect } from 'react';
import { useCvView } from '@/components/cv/CvViewContext';
import { PRESETS, type PresetKey } from '@/lib/cvViewPresets';

function isPresetKey(s: string): s is PresetKey {
  return s in PRESETS;
}

export function CvDemoTrigger() {
  const { setView } = useCvView();

  useEffect(() => {
    // Read the search param directly. Avoids next/navigation's
    // useSearchParams(), which forces a Suspense boundary at prerender time —
    // and that's overkill for a demo trigger that's mount-only on the client.
    if (typeof window === 'undefined') return;
    const preset = new URLSearchParams(window.location.search).get('cv');
    if (!preset || !isPresetKey(preset)) return;
    setView(PRESETS[preset]);
  }, [setView]);

  return null;
}
