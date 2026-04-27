'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { routing, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    // pathname looks like /en/foo/bar -> swap leading segment
    const rest = pathname.replace(/^\/(en|fr)/, '') || '/';
    start(() => router.replace(`/${next}${rest === '/' ? '' : rest}`));
  };

  return (
    <div
      className="inline-flex items-center gap-0 rounded-lg border border-[var(--color-border)] p-0.5 font-mono text-xs"
      aria-label="Language switcher"
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          disabled={pending}
          className={cn(
            'rounded-md px-2 py-1 uppercase transition',
            l === locale
              ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
          )}
          aria-pressed={l === locale}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
