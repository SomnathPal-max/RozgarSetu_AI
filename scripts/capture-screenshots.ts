import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function capture() {
  const screenshotsDir = path.join(process.cwd(), 'docs', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('📸 Capturing mobile screenshots at 360px width...');

  // 1. Screen 1: Home
  await page.goto('http://localhost:3000/en');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'screen-1-home.png'), fullPage: false });
  console.log('✓ Captured screen-1-home.png');

  // 2. Screen 2: Vacancies
  await page.goto('http://localhost:3000/en/vacancies');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'screen-2-vacancies.png'), fullPage: false });
  console.log('✓ Captured screen-2-vacancies.png');

  // 3. Screen 3: Vacancy Detail
  await page.goto('http://localhost:3000/en/vacancies/notice-a');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'screen-3-detail.png'), fullPage: false });
  console.log('✓ Captured screen-3-detail.png');

  // 4. Screen 4: Eligibility Check & Gap Coach
  await page.goto('http://localhost:3000/en/vacancies/notice-a/check');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'screen-4-eligibility.png'), fullPage: false });
  console.log('✓ Captured screen-4-eligibility.png');

  // 5. Screen 6: Application Tracker with Notice Watch
  // Trigger corrigendum so amendment banner shows
  await page.request.post('http://localhost:3000/api/admin/corrigendum', { data: { vacancyId: 'notice-a' } });
  await page.goto('http://localhost:3000/en/saved');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'screen-6-tracker.png'), fullPage: false });
  console.log('✓ Captured screen-6-tracker.png');

  // 6. Screen 9: Reviewer Queue & Access Control
  await page.goto('http://localhost:3000/en/admin/login');
  await page.getByRole('button', { name: /Demo Reviewer 1/i }).click();
  await page.waitForURL('**/en/admin');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'screen-9-reviewer.png'), fullPage: false });
  console.log('✓ Captured screen-9-reviewer.png');

  // Clean up corrigendum
  await page.request.delete('http://localhost:3000/api/admin/corrigendum');

  await browser.close();
  console.log('🎉 All 6 mobile screenshots saved in docs/screenshots/');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
