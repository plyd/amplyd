'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Right-side chat panel placeholder. Wired to the LangGraph agent in M3/M5.
 * For now: static disclosure + suggestion chips + non-functional input.
 */
export function ChatPanel() {
  const t = useTranslations('chat');
  const [draft, setDraft] = useState('');

  const suggestions = [
    t('suggestions.matchJD'),
    t('suggestions.strongestProject'),
    t('suggestions.reachHim'),
  ];

  return (
    <aside
      className="hidden lg:flex lg:w-[380px] lg:shrink-0 lg:flex-col lg:border-l lg:border-[var(--color-border)] lg:bg-[var(--color-bg-elevated)]"
      aria-label={t('title')}
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col">
        <header className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-4">
          <Sparkles size={16} className="text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold tracking-wide">{t('title')}</h2>
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
          <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs text-[var(--color-text-muted)]">
            {t('disclosure')}
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled
                className={cn(
                  'rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-left text-xs',
                  'text-[var(--color-text-secondary)] transition',
                  'hover:border-[var(--color-border-strong)] disabled:cursor-not-allowed disabled:opacity-60',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <form
          className="border-t border-[var(--color-border)] p-3"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="flex items-end gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('placeholder')}
              rows={2}
              disabled
              className="flex-1 resize-none bg-transparent px-2 py-1 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled
              aria-label={t('send')}
              className="rounded-md bg-[var(--color-accent)] p-2 text-black transition hover:bg-[var(--color-accent-glow)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
