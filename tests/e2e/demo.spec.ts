import { test, expect } from '@playwright/test';

test.describe('Phase 0 — Scaffold smoke test', () => {
  test('renders the welcome page in English', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('h1')).toContainText('RozgarSetu');
  });

  test('renders the welcome page in Bengali', async ({ page }) => {
    await page.goto('/bn');
    await expect(page.locator('h1')).toContainText('রোজগারসেতু');
  });

  test('renders the welcome page in Hindi', async ({ page }) => {
    await page.goto('/hi');
    await expect(page.locator('h1')).toContainText('रोज़गारसेतु');
  });
});
