import { expect, test } from '@playwright/test';

test.describe('CV overlay (CvView)', () => {
  test('?cv=rag preset pins the Amplyd project and shows the reason banner', async ({
    page,
  }) => {
    await page.goto('/fr?cv=rag');

    const cv = page.locator('#cv');
    await expect(cv).toHaveAttribute('data-cv-active', 'true', { timeout: 5_000 });
    // Reason banner is non-empty.
    const reason = cv.locator('[data-cv-reason]');
    const reasonText = await reason.getAttribute('data-cv-reason');
    expect(reasonText && reasonText.length).toBeGreaterThan(0);

    const amplyd = cv.locator('[data-cv-key="amplyd"]');
    await expect(amplyd).toHaveAttribute('data-pinned', 'true');

    // Reset returns the page to the default (no pinned entries).
    await cv.getByTestId('cv-reset').click();
    await expect(cv).toHaveAttribute('data-cv-active', 'false');
    await expect(amplyd).toHaveAttribute('data-pinned', 'false');
  });

  test('chat with a RAG-flavored prompt pins Amplyd via data-cv-view', async ({ page }) => {
    await page.goto('/fr');

    const cv = page.locator('#cv');
    const amplyd = cv.locator('[data-cv-key="amplyd"]');
    await expect(amplyd).toHaveAttribute('data-pinned', 'false');

    const panel = page.getByRole('complementary', { name: 'Contacter Vincent' });
    const textarea = panel.getByPlaceholder(/Décrivez votre mission/);
    await textarea.fill('Je cherche un dev RAG senior pour un POC.');
    await panel.getByRole('button', { name: 'Envoyer' }).click();

    // Wait for the overlay to be applied as soon as the data part lands.
    await expect(cv).toHaveAttribute('data-cv-active', 'true', { timeout: 15_000 });
    await expect(amplyd).toHaveAttribute('data-pinned', 'true');
  });

  test('POST /api/chat emits a data-cv-view part for a RAG prompt', async ({ request }) => {
    const res = await request.post('/api/chat', {
      data: {
        messages: [
          {
            id: 'u1',
            role: 'user',
            parts: [{ type: 'text', text: 'Je cherche un dev RAG senior' }],
          },
        ],
      },
    });
    expect(res.status()).toBe(200);

    const body = await res.text();
    // The data part lives in the SSE stream alongside the text-delta chunks.
    expect(body).toMatch(/data-cv-view/);

    // Find and parse the line carrying the CvView payload.
    let parsed: unknown = null;
    for (const line of body.split('\n')) {
      const m = line.match(/^data:\s*(\{.*\})\s*$/);
      if (!m) continue;
      try {
        const obj = JSON.parse(m[1]!) as { type?: string; data?: unknown };
        if (obj.type === 'data-cv-view') {
          parsed = obj.data;
          break;
        }
      } catch {
        // skip
      }
    }

    expect(parsed).not.toBeNull();
    const view = parsed as {
      reason: string;
      projects?: { key: string; pinned?: boolean }[];
    };
    expect(view.reason.length).toBeGreaterThan(0);
    expect(view.projects?.some((p) => p.key === 'amplyd' && p.pinned)).toBe(true);
  });

  test('POST /api/chat omits data-cv-view when no keywords match', async ({ request }) => {
    const res = await request.post('/api/chat', {
      data: {
        messages: [
          {
            id: 'u1',
            role: 'user',
            parts: [{ type: 'text', text: 'Bonjour' }],
          },
        ],
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).not.toMatch(/data-cv-view/);
  });
});
