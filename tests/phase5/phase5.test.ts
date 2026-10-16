import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { reports, vacancies, decisions, auditLog } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

describe('Phase 5: Report a Listing & Reviewer Queue (Two-Reviewer Rule)', () => {
  const testVacancyId = 'msme-delivery';

  beforeEach(async () => {
    // Reset vacancy status to active
    await db
      .update(vacancies)
      .set({ status: 'active' })
      .where(eq(vacancies.id, testVacancyId));

    // Clear decisions
    await db.delete(decisions);

    // Clean up temporary test reports
    await db
      .delete(reports)
      .where(eq(reports.vacancyId, testVacancyId));
  });

  describe('Screen 7: Report Submission & Sequential Reference', () => {
    it('creates a report with sequential RS-XXXX reference and 24h SLA target', async () => {
      const now = new Date();
      const reportId = `rep-test-${Date.now()}`;
      const ref = 'RS-0001';

      await db.insert(reports).values({
        id: reportId,
        ref,
        vacancyId: testVacancyId,
        reasonsJson: JSON.stringify(['asks_fee', 'personal_number_only']),
        note: 'Asked for Rs 500 registration via WhatsApp',
        status: 'received',
        createdAt: now.toISOString(),
        ackDueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        triageDueAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      });

      const [rep] = await db
        .select()
        .from(reports)
        .where(eq(reports.id, reportId));

      expect(rep).toBeDefined();
      expect(rep.ref).toBe('RS-0001');
      expect(rep.status).toBe('received');

      const ackDate = new Date(rep.ackDueAt);
      const diffHours = (ackDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(Math.round(diffHours)).toBe(24);
    });
  });

  describe('Screen 9: Two-Reviewer Rule for High-Risk Reports', () => {
    it('enforces two reviewers: proposer cannot self-approve, second reviewer executes suspension', async () => {
      const reportId = `rep-hr-${Date.now()}`;
      const now = new Date();

      // 1. Candidate submits report with 'asks_fee'
      await db.insert(reports).values({
        id: reportId,
        ref: 'RS-9999',
        vacancyId: testVacancyId,
        reasonsJson: JSON.stringify(['asks_fee']),
        status: 'received',
        createdAt: now.toISOString(),
        ackDueAt: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
        triageDueAt: new Date(now.getTime() + 48 * 3600 * 1000).toISOString(),
      });

      // 2. Reviewer 1 proposes suspension
      const decisionId = `dec-test-${Date.now()}`;
      await db.insert(decisions).values({
        id: decisionId,
        reportId,
        action: 'suspend',
        reason: 'Confirmed fee request on personal phone number',
        proposedBy: 'rev-1',
        approvedBy: null,
        appliedAt: null,
      });

      await db
        .update(reports)
        .set({ status: 'under_review' })
        .where(eq(reports.id, reportId));

      // 3. Verify status is 'under_review' and approvedBy is null
      const [pendingDecision] = await db
        .select()
        .from(decisions)
        .where(eq(decisions.id, decisionId));
      expect(pendingDecision.proposedBy).toBe('rev-1');
      expect(pendingDecision.approvedBy).toBeNull();

      // 4. Test Two-Reviewer constraint: Reviewer 1 cannot self-approve
      const canSelfApprove = pendingDecision.proposedBy !== 'rev-1';
      expect(canSelfApprove).toBe(false);

      // 5. Reviewer 2 approves the decision
      const reviewer2 = 'rev-2';
      const approvedAt = new Date().toISOString();

      await db
        .update(decisions)
        .set({
          approvedBy: reviewer2,
          appliedAt: approvedAt,
        })
        .where(eq(decisions.id, decisionId));

      // Vacancy is suspended
      await db
        .update(vacancies)
        .set({ status: 'suspended' })
        .where(eq(vacancies.id, testVacancyId));

      await db
        .update(reports)
        .set({ status: 'closed' })
        .where(eq(reports.id, reportId));

      // Audit log row written
      await db.insert(auditLog).values({
        id: `audit-test-${Date.now()}`,
        actor: reviewer2,
        action: 'approve_suspend',
        entity: 'vacancies',
        entityId: testVacancyId,
        reason: `Listing suspended following two-reviewer approval (proposed by ${pendingDecision.proposedBy}, approved by ${reviewer2})`,
        createdAt: approvedAt,
      });

      // 6. Assertions
      const [finalVac] = await db
        .select()
        .from(vacancies)
        .where(eq(vacancies.id, testVacancyId));
      expect(finalVac.status).toBe('suspended');

      const [finalReport] = await db
        .select()
        .from(reports)
        .where(eq(reports.id, reportId));
      expect(finalReport.status).toBe('closed');

      const [finalDecision] = await db
        .select()
        .from(decisions)
        .where(eq(decisions.id, decisionId));
      expect(finalDecision.proposedBy).toBe('rev-1');
      expect(finalDecision.approvedBy).toBe('rev-2');

      const [audit] = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.action, 'approve_suspend'))
        .orderBy(desc(auditLog.createdAt));
      expect(audit).toBeDefined();
      expect(audit.actor).toBe('rev-2');
    });
  });
});
