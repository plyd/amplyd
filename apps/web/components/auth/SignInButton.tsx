'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { LogIn, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * Optional sign-in chip in the header. Anonymous users see "Sign in",
 * authed users see their first name + sign-out.
 */
export function SignInButton({ className }: { className?: string }) {
  const t = useTranslations('auth');
  const { data, status } = useSession();

  const baseCls = cn(
    'inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs',
    'text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]',
    className,
  );

  if (status === 'loading') {
    return <span className={cn(baseCls, 'opacity-50')} aria-hidden>…</span>;
  }

  if (status === 'authenticated') {
    const first = data?.user?.name?.split(' ')[0] ?? data?.user?.email ?? '';
    return (
      <button type="button" className={baseCls} onClick={() => signOut({ callbackUrl: '/' })}>
        <LogOut size={12} />
        <span>
          {first ? `${first} · ` : ''}
          {t('signOut')}
        </span>
      </button>
    );
  }

  return (
    <button type="button" className={baseCls} onClick={() => signIn('google')}>
      <LogIn size={12} />
      <span>{t('signIn')}</span>
    </button>
  );
}
