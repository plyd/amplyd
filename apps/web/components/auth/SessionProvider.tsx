'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

/**
 * Thin re-export of next-auth's React provider so server components in
 * `app/[locale]/layout.tsx` can wrap the tree without becoming client.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
