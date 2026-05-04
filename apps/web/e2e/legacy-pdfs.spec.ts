import { expect, test } from '@playwright/test';

/**
 * Migration safety net for `amplyd.vercel.app` → `www.amplyd.com`.
 *
 * The legacy site (OVHcloud) currently serves two PDFs of Vincent's 2012
 * memoir on Wikipedia volunteering. They have been re-shared in academic
 * contexts over the years and we do NOT know who linked them externally,
 * so we promise the URLs keep responding 200 + application/pdf after the
 * DNS swap. This test pins both files and breaks CI if anyone moves or
 * renames them.
 */
test.describe('Legacy PDF URLs (must remain accessible after www.amplyd.com migration)', () => {
  const pdfs = [
    '/these/Valorisation du bénévolat sur Wikipédia - FEB2012 - Vincent Juhel.pdf',
    '/these/Valorisation du bénévolat sur Wikipédia - AGWMFR 27MAI2012.pdf',
  ];

  for (const pdf of pdfs) {
    test(`${pdf} returns 200 with application/pdf`, async ({ request }) => {
      const r = await request.get(encodeURI(pdf));
      expect(r.status()).toBe(200);
      expect(r.headers()['content-type']).toContain('application/pdf');
      expect(Number(r.headers()['content-length'])).toBeGreaterThan(1_000_000);
    });
  }
});
