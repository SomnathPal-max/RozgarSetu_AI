import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { vacancies, noticeVersions, documentItems, savedJobs, outbox, auditLog } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

describe('Phase 4: Document Checklist, Tracker & Notice Watch', () => {
  const testUserId = 'user-1';
  const testVacancyId = 'notice-a';

  beforeEach(async () => {
    // Ensure clean initial state for Notice A
    await db
      .update(vacancies)
      .set({
        currentNoticeVersionId: 'ver-notice-a-1',
        lastDate: '2026-11-12',
      })
      .where(eq(vacancies.id, testVacancyId));

    // Ensure saved job is set to version 1
    const [existing] = await db
      .select()
      .from(savedJobs)
      .where(eq(savedJobs.vacancyId, testVacancyId));

    if (existing) {
      await db
        .update(savedJobs)
        .set({
          progress: 'saved',
          lastSeenVersionId: 'ver-notice-a-1',
          reminderOn: '2026-11-05',
          smsConsent: false,
        })
        .where(eq(savedJobs.id, existing.id));
    } else {
      await db.insert(savedJobs).values({
        id: 'sj-test-1',
        userId: testUserId,
        vacancyId: testVacancyId,
        progress: 'saved',
        lastSeenVersionId: 'ver-notice-a-1',
        reminderOn: '2026-11-05',
        smsConsent: false,
      });
    }

    // Clean up temporary versions
    await db
      .delete(noticeVersions)
      .where(eq(noticeVersions.id, 'ver-notice-a-2'));
  });

  describe('Screen 5: Document Checklist', () => {
    it('retrieves the 5 specific documents seeded for Notice A', async () => {
      const items = await db
        .select()
        .from(documentItems)
        .where(eq(documentItems.noticeVersionId, 'ver-notice-a-1'));

      expect(items.length).toBe(5);

      const labelKeys = items.map((i) => i.labelKey);
      expect(labelKeys).toContain('educational_certificates');
      expect(labelKeys).toContain('photo_signature');
      expect(labelKeys).toContain('dob_proof');
      expect(labelKeys).toContain('category_certificate');
      expect(labelKeys).toContain('id_proof');

      // Category certificate is conditional (requiredAlways = false)
      const catDoc = items.find((i) => i.labelKey === 'category_certificate');
      expect(catDoc?.requiredAlways).toBe(false);
      expect(catDoc?.conditionNote).toContain('only if claiming relaxation');
    });
  });

  describe('Screen 6: Tracker & User-set Progress (AGENTS.md Rule 5)', () => {
    it('allows user to progress from saved -> applied -> interview', async () => {
      const [job] = await db
        .select()
        .from(savedJobs)
        .where(eq(savedJobs.vacancyId, testVacancyId));

      expect(job.progress).toBe('saved');

      // Update to applied
      await db
        .update(savedJobs)
        .set({ progress: 'applied' })
        .where(eq(savedJobs.id, job.id));

      const [appliedJob] = await db
        .select()
        .from(savedJobs)
        .where(eq(savedJobs.id, job.id));
      expect(appliedJob.progress).toBe('applied');

      // Update to interview
      await db
        .update(savedJobs)
        .set({ progress: 'interview' })
        .where(eq(savedJobs.id, job.id));

      const [interviewJob] = await db
        .select()
        .from(savedJobs)
        .where(eq(savedJobs.id, job.id));
      expect(interviewJob.progress).toBe('interview');
    });

    it('writes to outbox table when SMS reminder is queued', async () => {
      const outboxId = `outbox-test-${Date.now()}`;
      await db.insert(outbox).values({
        id: outboxId,
        userId: testUserId,
        channel: 'sms',
        messageKey: 'REMINDER_NOTICE-A',
        payloadJson: JSON.stringify({
          vacancyTitle: 'Clerk (Group C)',
          reminderDate: '2026-11-05',
        }),
        createdAt: new Date().toISOString(),
      });

      const [entry] = await db
        .select()
        .from(outbox)
        .where(eq(outbox.id, outboxId));

      expect(entry).toBeDefined();
      expect(entry.channel).toBe('sms');
      expect(entry.messageKey).toBe('REMINDER_NOTICE-A');
    });
  });

  describe('Notice Watch: Corrigendum Simulation & Re-stamping (Demo Step 5)', () => {
    it('detects notice version change when corrigendum is published', async () => {
      // 1. Initially version matches
      const [initialJob] = await db
        .select()
        .from(savedJobs)
        .where(eq(savedJobs.vacancyId, testVacancyId));

      const [initialVac] = await db
        .select()
        .from(vacancies)
        .where(eq(vacancies.id, testVacancyId));

      expect(initialJob.lastSeenVersionId).toBe(initialVac.currentNoticeVersionId);

      // 2. Publish Corrigendum: create version 2 and update vacancy
      const newVersionId = 'ver-notice-a-2';
      const newDeadline = '2026-11-20';

      await db.insert(noticeVersions).values({
        id: newVersionId,
        vacancyId: testVacancyId,
        versionNo: 2,
        contentHash: 'hash-notice-a-v2-test',
        snapshotJson: JSON.stringify({ deadline: newDeadline }),
        changeNote: 'Corrigendum 1: Deadline extended to 20 Nov 2026',
        createdAt: new Date().toISOString(),
      });

      await db
        .update(vacancies)
        .set({
          currentNoticeVersionId: newVersionId,
          lastDate: newDeadline,
        })
        .where(eq(vacancies.id, testVacancyId));

      // 3. Notice Watch condition: version mismatch triggers alert
      const [updatedVac] = await db
        .select()
        .from(vacancies)
        .where(eq(vacancies.id, testVacancyId));

      const hasNoticeChanged = initialJob.lastSeenVersionId !== updatedVac.currentNoticeVersionId;
      expect(hasNoticeChanged).toBe(true);

      // 4. Re-stamp result to current version
      await db
        .update(savedJobs)
        .set({ lastSeenVersionId: updatedVac.currentNoticeVersionId })
        .where(eq(savedJobs.id, initialJob.id));

      // Audit log entry per AGENTS.md rule
      await db.insert(auditLog).values({
        id: `audit-test-${Date.now()}`,
        actor: 'user',
        action: 'restamp_eligibility_version',
        entity: 'saved_jobs',
        entityId: initialJob.id,
        reason: 'Re-stamped following corrigendum',
        createdAt: new Date().toISOString(),
      });

      // 5. Verify re-stamped status
      const [restampedJob] = await db
        .select()
        .from(savedJobs)
        .where(eq(savedJobs.id, initialJob.id));

      expect(restampedJob.lastSeenVersionId).toBe(newVersionId);
      expect(restampedJob.lastSeenVersionId === updatedVac.currentNoticeVersionId).toBe(true);

      const [audit] = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.action, 'restamp_eligibility_version'))
        .orderBy(desc(auditLog.createdAt));

      expect(audit).toBeDefined();
      expect(audit.actor).toBe('user');

      // Cleanup: restore Notice A to version 1
      await db
        .update(vacancies)
        .set({
          currentNoticeVersionId: 'ver-notice-a-1',
          lastDate: '2026-11-12',
        })
        .where(eq(vacancies.id, testVacancyId));
      await db
        .delete(noticeVersions)
        .where(eq(noticeVersions.id, newVersionId));
    });
  });
});
