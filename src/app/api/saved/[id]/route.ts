import { NextResponse } from 'next/server';
import { db } from '@/db';
import { savedJobs, vacancies, outbox, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      progress,
      reminderOn,
      smsConsent,
      restampVersion,
      registrationNumber,
      rollNumber,
      examDate,
      examCenter,
      candidateNotes,
    } = body;

    const [savedJob] = await db
      .select()
      .from(savedJobs)
      .where(eq(savedJobs.id, id));

    if (!savedJob) {
      return NextResponse.json({ error: 'Saved job not found' }, { status: 404 });
    }

    const updates: Partial<typeof savedJobs.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (progress !== undefined) {
      // AGENTS.md rule 5: Lifecycle stages set only by user
      updates.progress = progress;
    }

    if (registrationNumber !== undefined) {
      updates.registrationNumber = registrationNumber;
    }

    if (rollNumber !== undefined) {
      updates.rollNumber = rollNumber;
    }

    if (examDate !== undefined) {
      updates.examDate = examDate;
    }

    if (examCenter !== undefined) {
      updates.examCenter = examCenter;
    }

    if (candidateNotes !== undefined) {
      updates.candidateNotes = candidateNotes;
    }

    if (reminderOn !== undefined) {
      updates.reminderOn = reminderOn;
    }

    if (smsConsent !== undefined) {
      updates.smsConsent = smsConsent;
    }

    if (restampVersion) {
      // Find the vacancy's current version
      const [vac] = await db
        .select()
        .from(vacancies)
        .where(eq(vacancies.id, savedJob.vacancyId));

      if (vac && vac.currentNoticeVersionId) {
        updates.lastSeenVersionId = vac.currentNoticeVersionId;

        // Log to auditLog
        await db.insert(auditLog).values({
          id: `audit-${Date.now()}`,
          actor: 'user',
          action: 'restamp_eligibility_version',
          entity: 'saved_jobs',
          entityId: savedJob.id,
          reason: `Re-stamped to notice version ${vac.currentNoticeVersionId} following corrigendum`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await db
      .update(savedJobs)
      .set(updates)
      .where(eq(savedJobs.id, id));

    // If SMS consent was set to true, write an outbox entry
    if (smsConsent && !savedJob.smsConsent) {
      const [vac] = await db
        .select()
        .from(vacancies)
        .where(eq(vacancies.id, savedJob.vacancyId));

      await db.insert(outbox).values({
        id: `outbox-${Date.now()}`,
        userId: savedJob.userId,
        channel: 'sms',
        messageKey: `REMINDER_${savedJob.vacancyId.toUpperCase()}`,
        payloadJson: JSON.stringify({
          vacancyTitle: vac?.title || savedJob.vacancyId,
          reminderDate: reminderOn || savedJob.reminderOn,
        }),
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, updated: updates });
  } catch (error) {
    console.error('Error updating saved job:', error);
    return NextResponse.json(
      { error: 'Failed to update saved job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(savedJobs).where(eq(savedJobs.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved job:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved job' },
      { status: 500 }
    );
  }
}
