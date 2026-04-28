'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useChat } from '@ai-sdk/react';
import { Send, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Right-side panel: "Contact Vincent". Per the brief, the AI agent identity
 * is NOT advertised upfront — it reveals itself on the first reply, where
 * a small badge marks the bubble as coming from the AI.
 *
 * Wired to `/api/chat` (placeholder in M3, real LangGraph agent in M5).
 */
export function ChatPanel() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  const isBusy = status === 'streaming' || status === 'submitted';
  const hasMessages = messages.length > 0;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setDraft('');
  }

  return (
    <aside
      className="hidden lg:flex lg:w-[380px] lg:shrink-0 lg:flex-col lg:border-l lg:border-[var(--color-border)] lg:bg-[var(--color-bg-elevated)]"
      aria-label={t('title')}
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold tracking-wide">{t('title')}</h2>
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
            {t('status')}
          </span>
        </header>

        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
          {!hasMessages && (
            <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {t('intro')}
            </p>
          )}

          {messages.map((m) => {
            const text = m.parts
              .filter((p) => p.type === 'text')
              .map((p) => ('text' in p ? p.text : ''))
              .join('');
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col gap-1',
                  isUser ? 'items-end' : 'items-start',
                )}
              >
                {!isUser && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                    <Sparkles size={10} className="text-[var(--color-accent)]" />
                    {t('agentLabel')}
                  </span>
                )}
                <div
                  className={cn(
                    'max-w-[90%] whitespace-pre-wrap rounded-lg border px-3 py-2 text-xs leading-relaxed',
                    isUser
                      ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-text-primary)]'
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)]',
                  )}
                >
                  {text || (isBusy && !isUser ? '…' : '')}
                </div>
                {isUser && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                    <User size={10} />
                    {t('youLabel')}
                  </span>
                )}
              </div>
            );
          })}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
              {t('error')}
            </p>
          )}

          {!hasMessages && (
            <p className="mt-2 text-[10px] leading-relaxed text-[var(--color-text-muted)]">
              {t('legalHint')}{' '}
              <a
                href={`/${locale}/ai-disclosure`}
                className="text-[var(--color-accent)] hover:underline"
              >
                {t('learnMore')}
              </a>
            </p>
          )}
        </div>

        <form className="border-t border-[var(--color-border)] p-3" onSubmit={onSubmit}>
          <div className="flex items-end gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2 focus-within:border-[var(--color-border-strong)]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder={t('placeholder')}
              rows={2}
              disabled={isBusy}
              className="flex-1 resize-none bg-transparent px-2 py-1 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isBusy || draft.trim().length === 0}
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
