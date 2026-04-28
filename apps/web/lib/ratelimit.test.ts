import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkRateLimit, getClientIp } from './ratelimit';

describe('ratelimit', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('checkRateLimit', () => {
    it('allows when KV is not configured (local dev fallback)', async () => {
      const decision = await checkRateLimit({
        identifier: '1.2.3.4',
        authenticated: false,
      });
      expect(decision.success).toBe(true);
      expect(decision.limit).toBe(Number.POSITIVE_INFINITY);
    });

    it('also allows authed traffic without KV', async () => {
      const decision = await checkRateLimit({
        identifier: 'someone@example.com',
        authenticated: true,
      });
      expect(decision.success).toBe(true);
    });
  });

  describe('getClientIp', () => {
    it('reads x-forwarded-for', () => {
      const req = new Request('https://amplyd.com/api/chat', {
        headers: { 'x-forwarded-for': '203.0.113.42, 70.41.3.18' },
      });
      expect(getClientIp(req)).toBe('203.0.113.42');
    });

    it('falls back to x-real-ip', () => {
      const req = new Request('https://amplyd.com/api/chat', {
        headers: { 'x-real-ip': '203.0.113.7' },
      });
      expect(getClientIp(req)).toBe('203.0.113.7');
    });

    it('returns 0.0.0.0 when no header is present', () => {
      const req = new Request('https://amplyd.com/api/chat');
      expect(getClientIp(req)).toBe('0.0.0.0');
    });
  });
});
