'use client';

import { useEffect, useRef, useState } from 'react';

const lines = [
  { prompt: '$ vincent --intro', body: 'Senior AI architect, freelance, 20 yrs, ISO 42001 certified.' },
  { prompt: '$ vincent --skills --year 2026', body: 'LangGraph · MCP · RAG · multi-LLM routing · governance · …' },
  { prompt: '$ vincent --availability', body: 'Open to freelance (remote FR/EU) and senior CDI roles.' },
];

/** Animated typing terminal in the hero backdrop. Decorative only. */
export function TerminalBackdrop() {
  const [text, setText] = useState('');
  const [reduced, setReduced] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reduced) {
      setText(lines.map((l) => `${l.prompt}\n${l.body}\n`).join('\n'));
      return;
    }

    let lineIdx = 0;
    let charIdx = 0;
    let phase: 'typing-prompt' | 'typing-body' | 'pause' = 'typing-prompt';
    let pauseUntil = 0;

    const tick = () => {
      const now = Date.now();
      if (phase === 'pause') {
        if (now < pauseUntil) return;
        lineIdx = (lineIdx + 1) % lines.length;
        if (lineIdx === 0) setText('');
        charIdx = 0;
        phase = 'typing-prompt';
        return;
      }
      const current = lines[lineIdx];
      if (phase === 'typing-prompt') {
        charIdx++;
        if (charIdx > current.prompt.length) {
          phase = 'typing-body';
          charIdx = 0;
          setText((t) => t + '\n');
          return;
        }
        setText((t) => {
          const trimmed = t.replace(/(.*\n)?[^\n]*$/s, (m) => m.includes('\n') ? m.slice(0, m.lastIndexOf('\n') + 1) : '');
          return trimmed + current.prompt.slice(0, charIdx);
        });
      } else if (phase === 'typing-body') {
        charIdx++;
        if (charIdx > current.body.length) {
          phase = 'pause';
          pauseUntil = now + 1800;
          setText((t) => t + '\n');
          return;
        }
        setText((t) => {
          const trimmed = t.replace(/(.*\n)?[^\n]*$/s, (m) => m.includes('\n') ? m.slice(0, m.lastIndexOf('\n') + 1) : '');
          return trimmed + current.body.slice(0, charIdx);
        });
      }
    };

    intervalRef.current = setInterval(tick, 50);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reduced]);

  return (
    <pre
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-pre-wrap p-12 font-mono text-base leading-relaxed text-[var(--color-text-primary)] opacity-[0.08]"
    >
      {text}
      {!reduced && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-[var(--color-accent)]" />}
    </pre>
  );
}
