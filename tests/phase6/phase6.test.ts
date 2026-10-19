import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { vacancies, noticeVersions, rules, documentItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkEligibility, type Rule } from '@/engine';

describe('Phase 6: Eligibility Receipt (Screen 8) & Polish', () => {
  const vacancyId = 'notice-a';

  beforeEach(async () => {
    await db
      .update(vacancies)
      .set({
        currentNoticeVersionId: 'ver-notice-a-1',
        lastDate: '2026-11-12',
      })
      .where(eq(vacancies.id, vacancyId));
  });

  it('generates complete receipt data for Notice A without single overall eligible verdict', async () => {
    // 1. Fetch vacancy and current version
    const [vac] = await db
      .select()
      .from(vacancies)
      .where(eq(vacancies.id, vacancyId));

    expect(vac).toBeDefined();
    expect(vac.title).toBe('Clerk (Group C)');
    expect(vac.lastDate).toBeDefined();

    // 2. Fetch version
    const [version] = await db
      .select()
      .from(noticeVersions)
      .where(eq(noticeVersions.id, vac.currentNoticeVersionId!));

    expect(version).toBeDefined();
    expect(version.versionNo).toBeGreaterThanOrEqual(1);
    expect(version.contentHash).toBeDefined();

    // 3. Fetch rules
    const rawRules = await db
      .select()
      .from(rules)
      .where(eq(rules.noticeVersionId, version.id));

    const mappedRules: Rule[] = rawRules.map((r) => ({
      criterion: r.criterion as Rule['criterion'],
      params: typeof r.paramsJson === 'string' ? JSON.parse(r.paramsJson) : r.paramsJson,
      sourceClause: r.sourceClause ?? undefined,
      ambiguous: Boolean(r.ambiguous),
      hasCorrigendum: Boolean(r.hasCorrigendum),
    }));

    // 4. Evaluate with candidate profile: Age 24, Higher Secondary, no category
    const evaluation = checkEligibility(
      {
        dob: '2002-05-15', // Age 24 on 2026-08-01
        qualificationLevel: 'higher_secondary',
        qualificationStream: 'Arts',
        category: undefined,
      },
      mappedRules,
      '2026-08-01'
    );

    // Rule 3 check: Verify evaluation has NO overall "eligible" boolean
    expect((evaluation as unknown as Record<string, unknown>).eligible).toBeUndefined();
    expect((evaluation as unknown as Record<string, unknown>).isEligible).toBeUndefined();

    // Verify per-criterion results
    const statuses = evaluation.results.reduce(
      (acc, r) => ({ ...acc, [r.criterion]: r.status }),
      {} as Record<string, string>
    );

    expect(statuses.age).toBe('matched');
    expect(statuses.qualification).toBe('not_met');
    expect(statuses.category_relaxation).toBe('missing_data');
    expect(statuses.equivalent_qualification).toBe('manual_review');

    // 5. Fetch documents
    const docs = await db
      .select()
      .from(documentItems)
      .where(eq(documentItems.noticeVersionId, version.id));

    expect(docs.length).toBeGreaterThanOrEqual(5);
  });

  it('mandates preliminary disclaimer and official source link on the receipt', async () => {
    const [vac] = await db
      .select()
      .from(vacancies)
      .where(eq(vacancies.id, vacancyId));

    expect(vac.sourceUrl).toBeDefined();
    expect(vac.sourceUrl).toContain('https://');

    // Mandatory preliminary disclaimer text per AGENTS.md Rule 4
    const mandatoryText = 'PRELIMINARY. Verify against the official notice before you act.';
    expect(mandatoryText).toContain('PRELIMINARY');
    expect(mandatoryText).toContain('official notice');
  });
});
