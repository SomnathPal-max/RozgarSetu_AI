import { test, expect } from '@playwright/test';

test.describe.serial('RozgarSetu AI: 3-Minute Demo Flow (Section 12 & Screens 1-9)', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test.beforeAll(async ({ request }) => {
    // Reset database to pristine seed state so demo flow is 100% reproducible
    await request.post('/api/admin/reset-demo');
  });

  test('Step 1: Start and Language (Screen 1)', async ({ page }) => {
    // 1. Open home page in English
    await page.goto('/en');
    await expect(page.locator('header')).toContainText('RozgarSetu AI');
    await expect(page.locator('h1')).toContainText('Welcome to RozgarSetu');

    // Verify footer disclaimer per AGENTS.md honesty rule
    await expect(page.locator('footer')).toContainText('working demonstration on invented data');

    // 2. Test language switching to Bengali and Hindi
    await page.goto('/bn');
    await expect(page.locator('header')).toContainText('রোজগারসেতু AI');
    // Footer shows draft translation indicator for unreviewed locales
    await expect(page.locator('footer')).toContainText('খসড়া অনুবাদ');

    await page.goto('/hi');
    await expect(page.locator('header')).toContainText('रोज़गारसेतु AI');
    await expect(page.locator('footer')).toContainText('ड्राफ्ट अनुवाद');

    // 3. Return to English and open no-account eligibility check modal
    await page.goto('/en');
    const noAccountBtn = page.getByRole('button', { name: /Check eligibility now/i });
    await expect(noAccountBtn).toBeVisible();
    await noAccountBtn.click();

    // Fill minimal profile: DOB: 2002-05-15 (Age 24), Higher Secondary, category omitted
    await expect(page.getByText('Quick Profile for Eligibility')).toBeVisible();
    await page.locator('#dob').fill('2002-05-15');
    await page.locator('#qualificationLevel').selectOption('higher_secondary');

    // Submit profile modal (stored in sessionStorage only per Rule 8)
    const continueBtn = page.getByRole('button', { name: /Continue to vacancies/i });
    await continueBtn.click();

    // Redirects to Vacancy Finder
    await expect(page).toHaveURL(/\/en\/vacancies/);
  });

  test('Step 2: Vacancy Finder & Detail (Screens 2 & 3)', async ({ page }) => {
    await page.goto('/en/vacancies');

    // Search and filter headers
    await expect(page.locator('h1')).toContainText('Find Vacancies');
    await expect(page.getByRole('button', { name: /Government/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Local MSME/i })).toBeVisible();

    // Verify Scam Shield red flag is visibly displayed on Delivery helper
    await expect(page.getByText('Delivery helper')).toBeVisible();
    await expect(page.getByText(/Scam Shield: \d+ red flag/i)).toBeVisible();

    // Open Notice A (Clerk Group C)
    const noticeACard = page.locator('a[href*="/en/vacancies/notice-a"]').first();
    await noticeACard.click();
    await expect(page).toHaveURL(/\/en\/vacancies\/notice-a/);

    // Verify dates and details on Screen 3
    await expect(page.getByText('Clerk (Group C)')).toBeVisible();
    await expect(page.getByText(/12 Nov 2026/)).toBeVisible();

    // Verify exactly 3 completed checks and mandatory badge disclaimer
    await expect(page.getByText('Official notice link recorded')).toBeVisible();
    await expect(page.getByText('Dates checked by a reviewer')).toBeVisible();
    await expect(page.getByText('Rules entered from the notice')).toBeVisible();
    await expect(
      page.getByText('This badge does not guarantee a listing is safe.')
    ).toBeVisible();
  });

  test('Step 3: Eligibility Result, Gap Coach & Audio (Screen 4)', async ({ page }) => {
    // Set demo profile in sessionStorage
    await page.goto('/en');
    await page.evaluate(() => {
      sessionStorage.setItem(
        'rozgarsetu_profile',
        JSON.stringify({
          dob: '2002-05-15',
          qualificationLevel: 'higher_secondary',
          qualificationStream: 'Arts',
          category: undefined,
        })
      );
    });

    await page.goto('/en/vacancies/notice-a/check');

    // Verify Profile Summary
    await expect(page.getByText(/Age 24/)).toBeVisible();
    await expect(page.getByText(/Higher Secondary/)).toBeVisible();
    await expect(page.getByText(/category not entered/)).toBeVisible();

    // Verify the 4 distinct criteria statuses (Rule 2 & Screen 4 mock)
    await expect(page.getByText('Age limit 30 on the cut-off date')).toBeVisible();
    await expect(page.getByText('Matched').first()).toBeVisible();

    await expect(page.getByText('Graduate degree required')).toBeVisible();
    await expect(page.getByText('Not met').first()).toBeVisible();

    await expect(page.getByText('Category relaxation')).toBeVisible();
    await expect(page.getByText('Missing data').first()).toBeVisible();

    await expect(page.getByText('Equivalent qualification clause')).toBeVisible();
    await expect(page.getByText('Needs manual review').first()).toBeVisible();

    // Verify Gap Coach callout
    await expect(page.getByText('Gap Coach')).toBeVisible();
    await expect(page.getByText(/clause 4\(b\)/i)).toBeVisible();

    // Verify Audio playback button
    await expect(page.getByRole('button', { name: /Listen to this result/i })).toBeVisible();

    // Verify mandatory Rule 4 preliminary disclaimer and link
    await expect(
      page.getByText('This is a preliminary check. Always verify against the full official notice.')
    ).toBeVisible();
    await expect(page.getByText('View the full official notice')).toBeVisible();
  });

  test('Step 4: Document Checklist (Screen 5)', async ({ page }) => {
    await page.goto('/en/vacancies/notice-a/documents');

    // Verify title and subtitle matching Screen 5 mock
    await expect(page.locator('h1')).toContainText('Documents to prepare');
    await expect(page.getByText('Illustrative list. Real lists come from each notice.')).toBeVisible();

    // Verify documents list
    await expect(page.getByText('Educational certificates')).toBeVisible();
    await expect(page.getByText('Photo and signature in the size the notice asks')).toBeVisible();
    await expect(page.getByText('Proof of date of birth')).toBeVisible();
    await expect(page.getByText('Category certificate (only if claiming relaxation)')).toBeVisible();
    await expect(page.getByText('ID proof')).toBeVisible();

    // Save checklist
    const saveBtn = page.getByRole('button', { name: /Save checklist/i });
    await saveBtn.click();
    await expect(page.getByText('Checklist saved')).toBeVisible();

    // Verify footnote
    await expect(page.getByText(/Many applications fail on paperwork/i)).toBeVisible();
  });

  test('Step 5: Tracker, Outbox Reminders & Notice Watch Corrigendum (Screen 6)', async ({ page }) => {
    // 1. Visit Saved Jobs
    await page.goto('/en/saved');
    await expect(page.locator('h1')).toContainText(/saved jobs/i);

    // Verify AGENTS.md Rule 5 note
    await expect(
      page.getByText('Applied and Interview are set by you. RozgarSetu AI never submits for you.')
    ).toBeVisible();

    // 2. Test user-set progress: change to "Applied"
    const appliedRadio = page.getByRole('radio', { name: 'Applied' }).first();
    await appliedRadio.click();
    await expect(appliedRadio).toHaveAttribute('aria-checked', 'true');

    // 3. Test SMS Reminder toggle (queues to outbox table)
    const smsConsentCheck = page.locator('input[type="checkbox"]').first();
    if (!(await smsConsentCheck.isChecked())) {
      await smsConsentCheck.check();
      await expect(page.getByText(/SMS active|SMS queued/i)).toBeVisible();
    }

    // 4. Admin simulates corrigendum
    await page.request.post('/api/admin/corrigendum', {
      data: { vacancyId: 'notice-a' },
    });

    // 5. Reload saved jobs: Notice Watch banner appears!
    await page.reload();
    await expect(
      page.getByText('Notice changed since you last checked. Review the update before you apply.')
    ).toBeVisible();

    // 6. Review change in modal
    const reviewBtn = page.getByRole('button', { name: /Review the change/i });
    await reviewBtn.click();
    await expect(page.getByText('Notice Corrigendum Update')).toBeVisible();
    await expect(page.getByText(/Corrigendum 1: Deadline extended to 20 Nov 2026/i)).toBeVisible();

    // 7. Click Re-stamp eligibility result
    const restampBtn = page.getByRole('button', { name: /Re-stamp eligibility result/i });
    await restampBtn.click();

    // Alert dismisses and success feedback is shown
    await expect(page.getByText('Result re-stamped with the new notice version')).toBeVisible();

    // Clean up: reset corrigendum for demo repeatability
    await page.request.delete('/api/admin/corrigendum');
  });

  test('Step 6: Report a Listing & Reviewer Queue Two-Reviewer Rule (Screens 7 & 9)', async ({ page }) => {
    // Reset reports queue first
    await page.request.post('/api/reports/reset');

    // 1. Candidate reports Delivery helper listing
    await page.goto('/en/report/msme-delivery');
    await expect(page.locator('h1')).toContainText('Report a listing');
    await expect(page.getByText('Delivery helper')).toBeVisible();

    // Check "Asks for a fee" and "Only a personal messaging number"
    const feeCheck = page.getByLabel('Asks for a fee');
    if (!(await feeCheck.isChecked())) {
      await feeCheck.check();
    }
    const phoneCheck = page.getByLabel('Only a personal messaging number');
    if (!(await phoneCheck.isChecked())) {
      await phoneCheck.check();
    }

    // Submit report
    const submitBtn = page.getByRole('button', { name: /Submit report/i });
    await submitBtn.click();

    // Confirmation shows Reference RS-0001 (or sequential) and 24h SLA target
    await expect(page.getByText('Report submitted')).toBeVisible();
    await expect(page.getByText(/RS-\d+/)).toBeVisible();
    await expect(page.getByText(/Acknowledgement target 24 hours/i)).toBeVisible();

    // 2. Open Reviewer Portal and authenticate as Demo Reviewer 1
    await page.goto('/en/admin');
    await expect(page).toHaveURL(/\/en\/admin\/login/);
    await page.getByRole('button', { name: /Demo Reviewer 1/i }).click();
    await expect(page).toHaveURL(/\/en\/admin/);
    await expect(page.locator('h1')).toContainText(/reviewer queue/i);

    // Verify High risk badge and reasons
    await expect(page.getByText(/Delivery helper/i).first()).toBeVisible();
    await expect(page.getByText('High risk').first()).toBeVisible();

    // 3. Reviewer 1 proposes suspension
    const suspendBtn = page.getByRole('button', { name: 'Suspend listing' }).first();
    await suspendBtn.click();
    const reasonInput = page.locator('input[placeholder*="Enter reason"]').first();
    await reasonInput.fill('Confirmed illegal registration fee via WhatsApp chat.');

    const proposeBtn = page.getByRole('button', { name: /Propose action/i }).first();
    await proposeBtn.click();

    // Status updates to Under Review, requiring second reviewer
    await expect(
      page.getByText(/A second reviewer must approve a decision/i)
    ).toBeVisible();

    // 4. Verify Two-Reviewer rule: Reviewer 1 is locked from self-approving
    await expect(
      page.getByText('Two-reviewer rule active')
    ).toBeVisible();

    // 5. Switch to Reviewer 2
    const reviewer2Persona = page.getByRole('button', { name: /Reviewer 2 \(Approver\)/i });
    await reviewer2Persona.click();

    // 6. Reviewer 2 approves
    const approveBtn = page.getByRole('button', { name: /Approve & Execute/i }).first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Listing status becomes suspended, report closed, audit trail updated
    await expect(page.getByText(/Listing is suspended|Status: Closed/i)).toBeVisible();
    await expect(page.getByText(/live audit_log table/i)).toBeVisible();
    await expect(page.getByText(/approve_suspend/i)).toBeVisible();

    // Reset reviewer queue for demo replayability
    await page.request.post('/api/reports/reset');
  });

  test('Step 7: Eligibility Receipt & Sahayak Mode (Screen 8)', async ({ page }) => {
    await page.goto('/en/receipt/notice-a');

    // Title and notice header matching Screen 8
    await expect(page.locator('h1')).toContainText('Clerk (Group C) · Illustrative Notice A');

    // Stamped version and date
    await expect(page.getByText('14 Oct 2026')).toBeVisible();
    await expect(page.getByText('12 Nov 2026')).toBeVisible();

    // Per-criterion results
    await expect(page.getByText(/Matched.*age/i)).toBeVisible();
    await expect(page.getByText(/Not met.*graduate degree/i)).toBeVisible();
    await expect(page.getByText(/Missing.*category/i)).toBeVisible();
    await expect(page.getByText(/Manual review.*equivalent qualification/i)).toBeVisible();

    // Documents summary
    await expect(page.getByText(/Certificates, photo and signature/i)).toBeVisible();

    // Mandatory preliminary disclaimer
    await expect(
      page.getByText('PRELIMINARY. Verify against the official notice before you act.')
    ).toBeVisible();

    // Actions
    await expect(page.getByRole('button', { name: /Print or share/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sahayak/i })).toBeVisible();

    // Toggle Sahayak (Helper) Mode
    const sahayakToggle = page.getByRole('button', { name: /Sahayak/i });
    await sahayakToggle.click();
    await expect(page.locator('.sahayak-active')).toBeVisible();
  });
});
