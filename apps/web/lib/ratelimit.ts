import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Sliding-window rate limits for the contact agent.
 *
 * - Anonymous visitors: 30 messages / 5 min, keyed by IP.
 * - Signed-in users:    200 messages / 1 h, keyed by email.
 *
 * Backed by Upstash (Vercel KV Marketplace integration). The Redis client
 * reads `KV_REST_API_URL` and `KV_REST_API_TOKEN` from the environment via
 * `Redis.fromEnv()`.
 *
 * If env vars are missing (e.g. local dev without KV), the limiter is a
 * no-op that always allows the request — keeps `pnpm dev` friction-free.
 */

type Decision = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const ALLOW_ALL: Decision = {
  success: true,
  limit: Number.POSITIVE_INFINITY,
  remaining: Number.POSITIVE_INFINITY,
  reset: 0,
};

function hasKv(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

let _anon: Ratelimit | null = null;
let _user: Ratelimit | null = null;

function anonLimiter(): Ratelimit | null {
  if (!hasKv()) return null;
  if (_anon) return _anon;
  _anon = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, '5 m'),
    analytics: true,
    prefix: 'amplyd:rl:anon',
  });
  return _anon;
}

function userLimiter(): Ratelimit | null {
  if (!hasKv()) return null;
  if (_user) return _user;
  _user = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(200, '1 h'),
    analytics: true,
    prefix: 'amplyd:rl:user',
  });
  return _user;
}

export async function checkRateLimit(opts: {
  identifier: string;
  authenticated: boolean;
}): Promise<Decision> {
  const limiter = opts.authenticated ? userLimiter() : anonLimiter();
  if (!limiter) return ALLOW_ALL;
  const { success, limit, remaining, reset } = await limiter.limit(opts.identifier);
  return { success, limit, remaining, reset };
}

/** Best-effort client IP extraction from common edge headers. */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return '0.0.0.0';
}
