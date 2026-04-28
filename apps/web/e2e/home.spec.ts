import { expect, test } from '@playwright/test';

test.describe('home page (FR)', () => {
  test('renders hero with new location and remote line', async ({ page }) => {
    await page.goto('/fr');
    await expect(page.getByRole('heading', { name: 'Vincent Juhel', level: 1 })).toBeVisible();
    await expect(page.getByText('Rennes & Paris, France', { exact: false })).toBeVisible();
    await expect(page.getByText('Full remote ou hybride', { exact: false })).toBeVisible();
  });

  test('header brand is "VJ Vincent Juhel" (no "amplyd")', async ({ page }) => {
    await page.goto('/fr');
    const header = page.getByRole('banner');
    await expect(header.getByText('Vincent Juhel')).toBeVisible();
    // The word "amplyd" should not appear in the header navigation.
    await expect(header.getByText(/amplyd/i)).toHaveCount(0);
  });

  test('CV nav link is "CV" in French', async ({ page }) => {
    await page.goto('/fr');
    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'CV' })).toBeVisible();
  });

  test('contact panel header is "Contacter Vincent" (no upfront AI mention)', async ({ page }) => {
    await page.goto('/fr');
    const panel = page.getByRole('complementary', { name: 'Contacter Vincent' });
    await expect(panel.getByRole('heading', { name: 'Contacter Vincent' })).toBeVisible();
    // Empty state intro should not call out "agent IA"
    await expect(panel.getByText(/agent\s*ia/i)).toHaveCount(0);
  });

  test('resume sections are present', async ({ page }) => {
    await page.goto('/fr');
    await expect(page.getByRole('heading', { name: 'Expérience' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Formation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Compétences' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Projets sélectionnés' })).toBeVisible();
  });
});

test.describe('home page (EN)', () => {
  test('locale switch swaps copy', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByText('Rennes & Paris, France', { exact: false })).toBeVisible();
    await expect(page.getByText('Full remote or hybrid', { exact: false })).toBeVisible();
    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Resume' })).toBeVisible();
    await expect(
      page.getByRole('complementary', { name: 'Contact Vincent' }).getByRole('heading', {
        name: 'Contact Vincent',
      }),
    ).toBeVisible();
  });
});

test.describe('static legal pages', () => {
  test('privacy page renders', async ({ page }) => {
    const res = await page.goto('/fr/privacy');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { name: 'Confidentialité' })).toBeVisible();
  });

  test('AI disclosure renders', async ({ page }) => {
    const res = await page.goto('/fr/ai-disclosure');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { name: 'Mention IA' })).toBeVisible();
  });
});
