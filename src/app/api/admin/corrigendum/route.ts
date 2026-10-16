import { NextResponse } from 'next/server';
import { db } from '@/db';
import { vacancies, noticeVersions, auditLog, savedJobs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const vacancyId = 'notice-a';

    const [vac] = await db
      .select()
      .from(vacancies)
      .where(eq(vacancies.id, vacancyId));

    const versions = await db
      .select()
      .from(noticeVersions)
      .where(eq(noticeVersions.vacancyId, vacancyId))
      .orderBy(desc(noticeVersions.versionNo));

    const audits = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, vacancyId))
      .orderBy(desc(auditLog.createdAt));

    return NextResponse.json({
      vacancy: vac,
      versions,
      audits,
    });
  } catch (error) {
    console.error('Error fetching corrigendum status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const vacancyId = body.vacancyId || 'notice-a';

    const [vac] = await db
      .select()
      .from(vacancies)
      .where(eq(vacancies.id, vacancyId));

    if (!vac) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }

    const newVersionId = `ver-${vacancyId}-2`;
    const newDeadline = '2026-11-20';
    const changeNote = 'Corrigendum 1: Deadline extended to 20 Nov 2026. Clause 4(b) equivalent qualifications clarified.';

    // Check if version 2 already exists
    const [existingVer2] = await db
      .select()
      .from(noticeVersions)
      .where(eq(noticeVersions.id, newVersionId));

    if (!existingVer2) {
      await db.insert(noticeVersions).values({
        id: newVersionId,
        vacancyId,
        versionNo: 2,
        contentHash: 'hash-notice-a-v2-corrigendum',
        snapshotJson: JSON.stringify({
          deadline: newDeadline,
          corrigendum: true,
          amendedClause: '4(b)',
          originalDeadline: '2026-11-12',
          newDeadline: newDeadline,
          changeNote,
        }),
        createdAt: new Date().toISOString(),
        changeNote,
      });
    }

    // Update vacancy's active version and deadline
    await db
      .update(vacancies)
      .set({
        currentNoticeVersionId: newVersionId,
        lastDate: newDeadline,
        lastCheckedAt: '2026-10-15 16:30 IST',
      })
      .where(eq(vacancies.id, vacancyId));

    // Mandatory AGENTS.md rule: Every state-changing admin action writes a row to audit_log
    await db.insert(auditLog).values({
      id: `audit-${Date.now()}`,
      actor: 'admin',
      action: 'publish_corrigendum',
      entity: 'vacancies',
      entityId: vacancyId,
      reason: 'Deadline extended to 20 Nov 2026 and clause 4(b) clarification issued by Recruiting Body',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Corrigendum published',
      versionId: newVersionId,
      newDeadline,
    });
  } catch (error) {
    console.error('Error simulating corrigendum:', error);
    return NextResponse.json(
      { error: 'Failed to simulate corrigendum' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const vacancyId = 'notice-a';
    const originalVersionId = 'ver-notice-a-1';
    const originalDeadline = '2026-11-12';

    // Reset vacancy back to original version
    await db
      .update(vacancies)
      .set({
        currentNoticeVersionId: originalVersionId,
        lastDate: originalDeadline,
        lastCheckedAt: '2026-10-14 09:30 IST',
      })
      .where(eq(vacancies.id, vacancyId));

    // Reset demo user saved job last seen version back to original
    await db
      .update(savedJobs)
      .set({
        lastSeenVersionId: originalVersionId,
      })
      .where(eq(savedJobs.vacancyId, vacancyId));

    // Delete version 2 if present
    await db
      .delete(noticeVersions)
      .where(eq(noticeVersions.id, `ver-${vacancyId}-2`));

    // Log to auditLog
    await db.insert(auditLog).values({
      id: `audit-${Date.now()}`,
      actor: 'admin',
      action: 'reset_corrigendum',
      entity: 'vacancies',
      entityId: vacancyId,
      reason: 'Reset notice to version 1 for demo repeatability',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Reset to original version',
    });
  } catch (error) {
    console.error('Error resetting corrigendum:', error);
    return NextResponse.json(
      { error: 'Failed to reset corrigendum' },
      { status: 500 }
    );
  }
}
