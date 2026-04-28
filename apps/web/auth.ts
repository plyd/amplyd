import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Auth.js v5 — Google OAuth with JWT session strategy.
 *
 * Sign-in is optional: anonymous visitors can use the site, but signed-in
 * users get a higher chat rate-limit and the agent can address them by name.
 *
 * Env precedence: AUTH_GOOGLE_ID / GOOGLE_CLIENT_ID (same for SECRET).
 * AUTH_SECRET is required in prod (used to sign the JWT).
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  trustHost: true,
});
