import { expect, test } from '@playwright/test';

test.describe('contact panel chat', () => {
  test('sends a message and streams an AI placeholder reply that introduces the agent', async ({
    page,
  }) => {
    await page.goto('/fr');

    const panel = page.getByRole('complementary', { name: 'Contacter Vincent' });
    const textarea = panel.getByPlaceholder(/Décrivez votre mission/);
    await expect(textarea).toBeVisible();

    await textarea.fill('Bonjour, je vous contacte pour une mission Architecte IA.');
    await panel.getByRole('button', { name: 'Envoyer' }).click();

    // First user bubble shows "Vous"
    await expect(panel.getByText('Vous', { exact: true }).first()).toBeVisible({ timeout: 10_000 });

    // The AI identity must appear inline on the assistant bubble
    await expect(panel.getByText('Agent IA', { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });

    // The placeholder reply should mention being an AI
    await expect(panel.getByText(/c'est bien une IA/i)).toBeVisible({ timeout: 15_000 });
  });

  test('POST /api/chat returns a UI message stream with text deltas', async ({ request }) => {
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
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/text\/event-stream|text\/plain/);

    const body = await res.text();
    // Stream chunks include text-delta events.
    expect(body).toMatch(/text-delta/);

    // Reassemble the streamed text by concatenating every `delta` payload.
    const deltas: string[] = [];
    for (const line of body.split('\n')) {
      const m = line.match(/^data:\s*(\{.*\})\s*$/);
      if (!m) continue;
      try {
        const obj = JSON.parse(m[1]!) as { type?: string; delta?: string };
        if (obj.type === 'text-delta' && typeof obj.delta === 'string') {
          deltas.push(obj.delta);
        }
      } catch {
        // ignore non-JSON sentinel lines (e.g. `[DONE]`)
      }
    }
    const reassembled = deltas.join('').toLowerCase();
    expect(reassembled).toMatch(/(agent ia|ai agent)/);
  });

  test('POST /api/chat rejects an invalid payload', async ({ request }) => {
    const res = await request.post('/api/chat', {
      data: { not: 'valid' },
    });
    expect(res.status()).toBe(400);
  });
});
