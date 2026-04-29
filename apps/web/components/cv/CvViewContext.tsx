'use client';

/**
 * CvViewContext — client-side state for the agent-driven CV overlay.
 *
 * Everything in this module is purely presentational state: the actual CV
 * data is loaded server-side in Resume.tsx. This context only carries the
 * agent's *instructions* about which entries to pin / expand / hide and the
 * short reason banner.
 *
 * Set / reset is dispatched from anywhere in the tree. Invalid payloads are
 * silently dropped (parseCvView returns null).
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type CvView, parseCvView } from '@/lib/cvView';

type CvViewContextValue = {
  view: CvView | null;
  setView: (raw: unknown) => boolean; // returns true if accepted
  reset: () => void;
};

const CvViewContext = createContext<CvViewContextValue | null>(null);

export function CvViewProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<CvView | null>(null);

  const setView = useCallback((raw: unknown): boolean => {
    const parsed = parseCvView(raw);
    if (parsed === null) {
      // Drop invalid payloads silently — never crash the page on a bad agent output.
      return false;
    }
    setViewState(parsed);
    return true;
  }, []);

  const reset = useCallback(() => setViewState(null), []);

  const value = useMemo(() => ({ view, setView, reset }), [view, setView, reset]);

  return <CvViewContext.Provider value={value}>{children}</CvViewContext.Provider>;
}

export function useCvView(): CvViewContextValue {
  const ctx = useContext(CvViewContext);
  if (ctx === null) {
    throw new Error('useCvView must be used inside a <CvViewProvider>');
  }
  return ctx;
}
