import { NextResponse } from 'next/server';
import { db } from '@/db';
import { savedJobs, vacancies, noticeVersions, outbox } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const demoUserId = 'user-1';

    // Fetch saved jobs joined with vacancies
    const userSavedJobs = await db
      .select({
        id: savedJobs.id,
        userId: savedJobs.userId,
        vacancyId: savedJobs.vacancyId,
        progress: savedJobs.progress,
        registrationNumber: savedJobs.registrationNumber,
        rollNumber: savedJobs.rollNumber,
        examDate: savedJobs.examDate,
        examCenter: savedJobs.examCenter,
        candidateNotes: savedJobs.candidateNotes,
        lastSeenVersionId: savedJobs.lastSeenVersionId,
        reminderOn: savedJobs.reminderOn,
        smsConsent: savedJobs.smsConsent,
        updatedAt: savedJobs.updatedAt,
        vacancyTitle: vacancies.title,
        vacancyOrgName: vacancies.orgName,
        vacancyArea: vacancies.area,
        vacancyLastDate: vacancies.lastDate,
        currentVersionId: vacancies.currentNoticeVersionId,
      })
      .from(savedJobs)
      .innerJoin(vacancies, eq(savedJobs.vacancyId, vacancies.id))
      .where(eq(savedJobs.userId, demoUserId));

    // For each saved job, check if current version is different from last seen version
    const enriched = await Promise.all(
      userSavedJobs.map(async (job) => {
        const hasNoticeChanged =
          Boolean(job.lastSeenVersionId) &&
          Boolean(job.currentVersionId) &&
          job.lastSeenVersionId !== job.currentVersionId;

        // Fetch version info if changed
        let previousVersion = null;
        let currentVersion = null;

        if (hasNoticeChanged) {
          if (job.lastSeenVersionId) {
            const [prev] = await db
              .select()
              .from(noticeVersions)
              .where(eq(noticeVersions.id, job.lastSeenVersionId));
            previousVersion = prev || null;
          }
          if (job.currentVersionId) {
            const [curr] = await db
              .select()
              .from(noticeVersions)
              .where(eq(noticeVersions.id, job.currentVersionId));
            currentVersion = curr || null;
          }
        }

        return {
          ...job,
          hasNoticeChanged,
          previousVersion,
          currentVersion,
        };
      })
    );

    // Fetch user's outbox messages (SMS / in-app stubs)
    const outboxMessages = await db
      .select()
      .from(outbox)
      .where(eq(outbox.userId, demoUserId))
      .orderBy(desc(outbox.createdAt));

    return NextResponse.json({
      savedJobs: enriched,
      outboxMessages,
    });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const demoUserId = 'user-1';
    const body = await request.json();
    const { vacancyId, progress = 'saved', reminderOn = '2026-11-05', smsConsent = false } = body;

    if (!vacancyId) {
      return NextResponse.json({ error: 'vacancyId is required' }, { status: 400 });
    }

    // Get vacancy's current version
    const [vac] = await db
      .select()
      .from(vacancies)
      .where(eq(vacancies.id, vacancyId));

    if (!vac) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }

    // Check if already saved
    const existing = await db
      .select()
      .from(savedJobs)
      .where(eq(savedJobs.vacancyId, vacancyId));

    const id = existing.length > 0 ? existing[0].id : `sj-${Date.now()}`;

    if (existing.length > 0) {
      await db
        .update(savedJobs)
        .set({
          progress,
          reminderOn,
          smsConsent,
          lastSeenVersionId: vac.currentNoticeVersionId,
        })
        .where(eq(savedJobs.id, id));
    } else {
      await db.insert(savedJobs).values({
        id,
        userId: demoUserId,
        vacancyId,
        progress,
        lastSeenVersionId: vac.currentNoticeVersionId,
        reminderOn,
        smsConsent,
      });
    }

    // If SMS consent was granted, write to outbox stub per AGENTS.md
    if (smsConsent) {
      await db.insert(outbox).values({
        id: `outbox-${Date.now()}`,
        userId: demoUserId,
        channel: 'sms',
        messageKey: `REMINDER_${vac.id.toUpperCase()}`,
        payloadJson: JSON.stringify({
          vacancyTitle: vac.title,
          reminderDate: reminderOn,
          deadline: vac.lastDate,
        }),
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json(
      { error: 'Failed to save job' },
      { status: 500 }
    );
  }
}
