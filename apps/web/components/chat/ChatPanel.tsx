'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useChat } from '@ai-sdk/react';
import { Send, Sparkles, User, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { useCvView } from '@/components/cv/CvViewContext';

/**
 * Contact panel.
 *
 * Layout:
 *   - lg+: pinned 380px aside on the right of the page.
 *   - <lg: slide-up bottom sheet with backdrop, opened by the Hero CTA via
 *     a `amplyd:open-chat` window event (see OpenChatButton).
 *
 * Per the brief, the AI agent identity is NOT advertised upfront — it
 * reveals itself on the first reply via a Sparkles badge on the bubble.
 *
 * Wired to `/api/chat`, which either proxies to the LangGraph agent
 * (when AGENT_BASE_URL is set) or falls back to the keyword placeholder.
 */
export function ChatPanel() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [draft, setDraft] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat();
  const { setView } = useCvView();
  // Track which message id we last dispatched so we don't re-set the view on
  // every render while a stream is in progress.
  const lastDispatchedRef = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  // Open/close the mobile sheet from anywhere via a custom window event.
  // Also close on Escape and lock body scroll while open.
  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener('amplyd:open-chat', open);
    return () => window.removeEventListener('amplyd:open-chat', open);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  // When a new assistant message carries a data-cv-view part, dispatch it to
  // the shared CvViewContext so the Resume reorganizes itself.
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]!;
      if (m.role !== 'assistant') continue;
      const part = m.parts.find((p) => p.type === 'data-cv-view');
      if (!part) continue;
      if (lastDispatchedRef.current === m.id) return;
      // AI SDK v6 data parts carry the payload under `data`.
      const payload = (part as { data?: unknown }).data;
      const accepted = setView(payload);
      if (accepted) lastDispatchedRef.current = m.id;
      return;
    }
  }, [messages, setView]);

  const isBusy = status === 'streaming' || status === 'submitted';
  const hasMessages = messages.length > 0;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setDraft('');
  }

  const panelBody = (
    <>
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="text-sm font-semibold tracking-wide">{t('title')}</h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
            {t('status')}
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label={t('close')}
            className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)] lg:hidden"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
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
                    'max-w-[90%] rounded-lg border px-3 py-2 text-xs leading-relaxed',
                    isUser
                      ? 'whitespace-pre-wrap border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-text-primary)]'
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)]',
                  )}
                >
                  {isUser ? (
                    text || ''
                  ) : text ? (
                    <div className="chat-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                    </div>
                  ) : isBusy ? (
                    '…'
                  ) : (
                    ''
                  )}
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
    </>
  );

  return (
    <>
      {/* Desktop: pinned right-side aside */}
      <aside
        className="hidden lg:flex lg:w-[380px] lg:shrink-0 lg:flex-col lg:border-l lg:border-[var(--color-border)] lg:bg-[var(--color-bg-elevated)]"
        aria-label={t('title')}
      >
        <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col">{panelBody}</div>
      </aside>

      {/* Mobile: slide-up bottom sheet, opened via the Hero CTA */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            'absolute inset-0 bg-black/60 transition-opacity',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('title')}
          className={cn(
            'absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-2xl transition-transform duration-200 ease-out',
            mobileOpen ? 'translate-y-0' : 'translate-y-full',
          )}
        >
          {panelBody}
        </div>
      </div>
    </>
  );
}
