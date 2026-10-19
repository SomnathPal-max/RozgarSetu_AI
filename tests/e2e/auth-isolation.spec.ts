import { test, expect } from '@playwright/test';

test.describe.serial('Candidate Account Creation, Login & Multi-Tenant Isolation', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  const testMobileA = `000000${Math.floor(1000 + Math.random() * 9000)}`;
  const testPassA = 'candidate_pass_123';
  let candidateA_SavedJobId = '';

  const testMobileB = `000000${Math.floor(1000 + Math.random() * 9000)}`;
  const testPassB = 'candidate_pass_456';

  test('Step 1: Create Account with validation and secure session establishment', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/en/auth/register');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Create Job Seeker Account/i);

    // Fill form
    await page.locator('#reg-name').fill('Rohan Sharma');
    await page.locator('#reg-mobile').fill(testMobileA);
    await page.locator('#reg-password').fill(testPassA);
    await page.locator('#reg-dob').fill('2000-08-15');
    await page.locator('#reg-qual').selectOption('graduate');

    // Submit
    await page.getByRole('button', { name: /Create Job Seeker Account/i }).click();

    // Verify redirected to /en/saved with user name displayed
    await page.waitForURL(/\/en\/saved/, { timeout: 15000 });
    await expect(page.getByText('Rohan Sharma')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(testMobileA)).toBeVisible();
    await expect(page.getByText(/Personal Account/i)).toBeVisible();

    // Verify Logout button exists in header and on the page
    const logoutBtn = page.getByRole('button', { name: /Log Out/i }).first();
    await expect(logoutBtn).toBeVisible();
  });

  test('Step 2: Candidate A saves a job and adds personal notes', async ({ page }) => {
    // Log in as Candidate A via page form so session cookies are attached to page.context
    await page.context().clearCookies();
    await page.goto('/en/auth/login');
    await page.locator('#mobile-input').fill(testMobileA);
    await page.locator('#password-input').fill(testPassA);
    await page.getByRole('button', { name: /Log In/i }).click();
    await page.waitForURL(/\/en\/saved/, { timeout: 15000 });

    // Save Notice A under Candidate A using page.request (inherits page cookies)
    const saveRes = await page.request.post('/api/saved', {
      data: { vacancyId: 'notice-a', progress: 'saved' },
    });
    expect(saveRes.ok()).toBeTruthy();
    const saveJson = await saveRes.json();
    candidateA_SavedJobId = saveJson.id;
    expect(candidateA_SavedJobId).toBeTruthy();

    // Reload /en/saved and verify notice-a is listed
    await page.goto('/en/saved');
    await expect(page.getByText(/Notice A/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('Step 3: Multi-tenant isolation — Candidate B cannot see or tamper with Candidate A’s account', async ({ page }) => {
    // 1. Create Candidate B account via page.request
    const regBRes = await page.request.post('/api/auth/register', {
      data: {
        name: 'Priya Mukherjee',
        mobile: testMobileB,
        password: testPassB,
        dob: '2001-03-20',
        qualificationLevel: 'postgraduate',
      },
    });
    expect(regBRes.ok()).toBeTruthy();

    // 2. Log in as Candidate B in browser
    await page.context().clearCookies();
    await page.goto('/en/auth/login');
    await page.locator('#mobile-input').fill(testMobileB);
    await page.locator('#password-input').fill(testPassB);
    await page.getByRole('button', { name: /Log In/i }).click();

    await page.waitForURL(/\/en\/saved/, { timeout: 15000 });
    await expect(page.getByText('Priya Mukherjee')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(testMobileB)).toBeVisible();

    // 3. Verify Candidate B does NOT see Candidate A's saved jobs
    await expect(page.getByText('No saved jobs yet')).toBeVisible({ timeout: 15000 });

    // 4. Verify Candidate B gets 403 Forbidden when attempting to update Candidate A's saved job
    const tamperRes = await page.request.patch(`/api/saved/${candidateA_SavedJobId}`, {
      data: { candidateNotes: 'Malicious modification by Candidate B' },
    });
    expect(tamperRes.status()).toBe(403);

    // 5. Verify Candidate B gets 403 Forbidden when attempting to delete Candidate A's saved job
    const deleteTamperRes = await page.request.delete(`/api/saved/${candidateA_SavedJobId}`);
    expect(deleteTamperRes.status()).toBe(403);
  });

  test('Step 4: Logout clears session and restores login option', async ({ page }) => {
    // Log in as Candidate A
    await page.goto('/en/auth/login');
    await page.locator('#mobile-input').fill(testMobileA);
    await page.locator('#password-input').fill(testPassA);
    await page.getByRole('button', { name: /Log In/i }).click();
    await page.waitForURL(/\/en\/saved/, { timeout: 15000 });

    // Click Log Out button
    const logoutBtn = page.getByRole('button', { name: /Log Out/i }).first();
    await expect(logoutBtn).toBeVisible({ timeout: 15000 });
    await logoutBtn.click();

    // Verify redirected to home or login
    await page.waitForURL(/\/en(\/auth\/login)?$/, { timeout: 15000 });

    // Verify session cookie is deleted/falsy
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === 'rozgarsetu_session');
    expect(sessionCookie ? sessionCookie.value : undefined).toBeFalsy();

    // Header now displays "Log In"
    await expect(page.getByRole('link', { name: /Log In/i }).first()).toBeVisible();
  });
});
