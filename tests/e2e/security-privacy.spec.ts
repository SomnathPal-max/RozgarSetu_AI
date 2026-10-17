import { test, expect } from '@playwright/test';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { count } from 'drizzle-orm';

test.describe.serial('Security & Privacy Enforcement Tests (AGENTS.md & Plan Requirements)', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('Privacy Rule: No-account eligibility check writes ZERO database rows', async ({ page }) => {
    // 1. Count existing users in DB before test
    const [initialUserCount] = await db.select({ count: count() }).from(users);

    // 2. Clear browser cookies and storage
    await page.context().clearCookies();
    await page.goto('/en');

    // 3. Open no-account check modal
    const noAccountBtn = page.getByRole('button', { name: /Check eligibility now/i });
    await expect(noAccountBtn).toBeVisible();
    await noAccountBtn.click();

    // 4. Fill in anonymous profile
    await expect(page.getByText('Quick Profile for Eligibility')).toBeVisible();
    await page.locator('#dob').fill('2002-05-15');
    await page.locator('#qualificationLevel').selectOption('higher_secondary');

    // 5. Submit anonymous profile
    const continueBtn = page.getByRole('button', { name: /Continue to vacancies/i });
    await continueBtn.click();

    // 6. Verify redirected to Vacancies and sessionStorage has anonymous profile
    await expect(page).toHaveURL(/\/en\/vacancies/);
    const anonProfile = await page.evaluate(() => sessionStorage.getItem('rozgarsetu_user_profile'));
    expect(anonProfile).not.toBeNull();
    const parsed = JSON.parse(anonProfile!);
    expect(parsed.dob).toBe('2002-05-15');

    // 7. Verify NO rozgarsetu_session cookie was set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === 'rozgarsetu_session');
    expect(sessionCookie).toBeUndefined();

    // 8. CRITICAL VERIFICATION: DB user count remains unchanged
    const [finalUserCount] = await db.select({ count: count() }).from(users);
    expect(finalUserCount.count).toBe(initialUserCount.count);
  });

  test('Access Control Rule: Unauthenticated users are blocked from Admin and Reviewer pages', async ({ page }) => {
    // 1. Clear any authentication cookies
    await page.context().clearCookies();

    // 2. Public bottom nav does NOT show the Admin tab to ordinary visitors
    await page.goto('/en');
    const adminNavLink = page.locator('nav a[href*="/admin"]');
    await expect(adminNavLink).toHaveCount(0);

    // 3. Attempt direct access to /en/admin
    await page.goto('/en/admin');
    // Must be redirected to /en/admin/login by server-side guard
    await expect(page).toHaveURL(/\/en\/admin\/login/);
    await expect(page.getByText('Reviewer & Curator Portal')).toBeVisible();

    // 4. Attempt direct access to /en/admin/notices
    await page.goto('/en/admin/notices');
    await expect(page).toHaveURL(/\/en\/admin\/login/);

    // 5. Log in via Reviewer portal demo button
    const reviewer1Btn = page.getByRole('button', { name: /Demo Reviewer 1/i });
    await reviewer1Btn.click();

    // 6. Now /en/admin is accessible
    await expect(page).toHaveURL(/\/en\/admin/);
    await expect(page.getByText('Reviewer Queue')).toBeVisible();

    // 7. And navigation now displays the Reviewer/Admin tab
    const reviewerNav = page.locator('nav a[href*="/admin"]');
    await expect(reviewerNav).toBeVisible();

    // 8. Exit portal / logout
    const exitBtn = page.getByRole('button', { name: /Exit Portal/i });
    await exitBtn.click();
    await expect(page).toHaveURL(/\/en/);
  });

  test('Scam Shield Rule: Two-reviewer rule strictly enforced on server (Self-approval blocked)', async ({ request }) => {
    // 1. Create a fresh high-risk report (asks_fee triggers two-reviewer rule)
    const createReportRes = await request.post('/api/reports', {
      data: {
        vacancyId: 'msme-delivery',
        reasons: ['asks_fee', 'personal_number_only'],
        note: 'Demanded ₹350 upfront registration fee',
      },
    });
    expect(createReportRes.ok()).toBeTruthy();
    const { report } = await createReportRes.json();
    const reportId = report.id;

    // 2. Reviewer 1 proposes listing suspension
    const proposeRes = await request.post(`/api/reports/${reportId}/action`, {
      data: {
        type: 'propose',
        action: 'suspend',
        reason: 'Illegal upfront registration fee demanded (Screen 9 reproduction)',
        reviewerId: 'reviewer-1',
      },
    });
    expect(proposeRes.ok()).toBeTruthy();
    const proposeData = await proposeRes.json();
    expect(proposeData.needsSecondReviewer).toBe(true);

    // 2. CRITICAL SERVER TEST: Reviewer 1 attempts self-approval -> MUST BE BLOCKED
    const selfApproveRes = await request.post(`/api/reports/${reportId}/action`, {
      data: {
        type: 'approve',
        reviewerId: 'reviewer-1', // Same reviewer who proposed
      },
    });

    // Server must reject with 400 Bad Request or 403 Forbidden
    expect([400, 403]).toContain(selfApproveRes.status());
    const errorData = await selfApproveRes.json();
    expect(errorData.error).toContain('Two-reviewer rule violation');

    // 3. Reviewer 2 (different reviewer) approves -> MUST SUCCEED
    const secondApproveRes = await request.post(`/api/reports/${reportId}/action`, {
      data: {
        type: 'approve',
        reviewerId: 'reviewer-2', // Different reviewer
      },
    });
    expect(secondApproveRes.ok()).toBeTruthy();
    const approveData = await secondApproveRes.json();
    expect(approveData.success).toBe(true);
    expect(approveData.approvedBy).toBe('rev-2');
  });

  test.afterAll(async ({ request }) => {
    // Restore demo database to pristine state after security tests
    await request.post('/api/admin/reset-demo');
  });
});
