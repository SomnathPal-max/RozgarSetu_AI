import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { savedJobs, vacancies, noticeVersions, outbox } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('rozgarsetu_session')?.value;
    // Fall back to demo user-1 if unauthenticated so demo tests run smoothly
    const effectiveUserId = sessionUserId || 'user-1';

    // Fetch saved jobs joined with vacancies strictly for the current user
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
      .where(eq(savedJobs.userId, effectiveUserId));

    // For each saved job, check if current version is different from last seen version
    const enriched = await Promise.all(
      userSavedJobs.map(async (job) => {
        const hasNoticeChanged =
          Boolean(job.lastSeenVersionId) &&
          Boolean(job.currentVersionId) &&
          job.lastSeenVersionId !== job.currentVersionId;

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

    // Fetch user's own outbox messages (SMS / in-app stubs)
    const outboxMessages = await db
      .select()
      .from(outbox)
      .where(eq(outbox.userId, effectiveUserId))
      .orderBy(desc(outbox.createdAt));

    return NextResponse.json({
      userId: effectiveUserId,
      isDemoFallback: !sessionUserId,
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
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('rozgarsetu_session')?.value;
    const effectiveUserId = sessionUserId || 'user-1';

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

    // Check if already saved by THIS user
    const existing = await db
      .select()
      .from(savedJobs)
      .where(and(eq(savedJobs.vacancyId, vacancyId), eq(savedJobs.userId, effectiveUserId)));

    const id = existing.length > 0 ? existing[0].id : `sj-${Date.now()}`;

    if (existing.length > 0) {
      await db
        .update(savedJobs)
        .set({
          progress,
          reminderOn,
          smsConsent,
          lastSeenVersionId: vac.currentNoticeVersionId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(savedJobs.id, id));
    } else {
      await db.insert(savedJobs).values({
        id,
        userId: effectiveUserId,
        vacancyId,
        progress,
        lastSeenVersionId: vac.currentNoticeVersionId,
        reminderOn,
        smsConsent,
        updatedAt: new Date().toISOString(),
      });
    }

    // If SMS consent was granted, write to outbox stub for THIS user
    if (smsConsent) {
      await db.insert(outbox).values({
        id: `outbox-${Date.now()}`,
        userId: effectiveUserId,
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

    return NextResponse.json({ success: true, id, userId: effectiveUserId });
  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json(
      { error: 'Failed to save job' },
      { status: 500 }
    );
  }
}
