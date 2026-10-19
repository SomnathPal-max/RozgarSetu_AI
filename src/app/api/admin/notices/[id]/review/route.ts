import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { vacancies, verificationChecks, auditLog } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vacancyId } = await params;
    const cookieStore = await cookies();
    const role = cookieStore.get('rozgarsetu_role')?.value;

    if (!role || (role !== 'reviewer' && role !== 'reviewer2' && role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { step, reviewerPersona = role, reason = 'Verification review conducted' } = body;

    const [vac] = await db
      .select()
      .from(vacancies)
      .where(eq(vacancies.id, vacancyId));

    if (!vac) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (step === 'step1_source_validation') {
      // Step 1: First reviewer validates official domain, links, and dates
      await db
        .update(vacancies)
        .set({
          firstReviewerId: reviewerPersona,
          firstReviewedAt: now,
        })
        .where(eq(vacancies.id, vacancyId));

      // Mark first 2 verification checks completed
      await db
        .update(verificationChecks)
        .set({
          completed: true,
          completedOn: now.split('T')[0],
          completedBy: reviewerPersona,
        })
        .where(
          and(
            eq(verificationChecks.vacancyId, vacancyId),
            eq(verificationChecks.checkKey, 'official_link_recorded')
          )
        );

      await db
        .update(verificationChecks)
        .set({
          completed: true,
          completedOn: now.split('T')[0],
          completedBy: reviewerPersona,
        })
        .where(
          and(
            eq(verificationChecks.vacancyId, vacancyId),
            eq(verificationChecks.checkKey, 'dates_checked')
          )
        );

      await db.insert(auditLog).values({
        id: `audit-${Date.now()}`,
        actor: reviewerPersona,
        action: 'reviewer_step1_source_validated',
        entity: 'vacancies',
        entityId: vacancyId,
        reason: `Source domain and circular dates verified by ${reviewerPersona}. Reason: ${reason}`,
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        step: 1,
        message: 'Step 1 complete. A different second reviewer must now audit rules and approve publication.',
      });
    } else if (step === 'step2_rules_audit') {
      // Non-negotiable Two-Reviewer Rule Enforcement per AGENTS.md
      if (!vac.firstReviewerId) {
        return NextResponse.json(
          { error: 'Cannot execute Step 2: Step 1 (source validation) has not yet been completed.' },
          { status: 400 }
        );
      }

      if (vac.firstReviewerId === reviewerPersona) {
        return NextResponse.json(
          {
            error:
              'Two-reviewer rule violation: The second reviewer must be an independent, different person from the first reviewer.',
            firstReviewerId: vac.firstReviewerId,
            attemptedSecondReviewerId: reviewerPersona,
          },
          { status: 403 }
        );
      }

      // Mark rules verified and activate notice
      await db
        .update(vacancies)
        .set({
          secondReviewerId: reviewerPersona,
          secondReviewedAt: now,
          status: 'active',
          isSourceChecked: true,
        })
        .where(eq(vacancies.id, vacancyId));

      await db
        .update(verificationChecks)
        .set({
          completed: true,
          completedOn: now.split('T')[0],
          completedBy: reviewerPersona,
        })
        .where(
          and(
            eq(verificationChecks.vacancyId, vacancyId),
            eq(verificationChecks.checkKey, 'rules_entered')
          )
        );

      await db.insert(auditLog).values({
        id: `audit-${Date.now()}`,
        actor: reviewerPersona,
        action: 'reviewer_step2_published',
        entity: 'vacancies',
        entityId: vacancyId,
        reason: `Statutory eligibility rules audited against official circular by independent second reviewer ${reviewerPersona}. Notice published. Reason: ${reason}`,
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        step: 2,
        status: 'active',
        message: 'Two-reviewer sign-off successfully completed. Notice is now PUBLISHED and live.',
      });
    }

    return NextResponse.json({ error: 'Invalid review step' }, { status: 400 });
  } catch (error) {
    console.error('Error conducting reviewer sign-off:', error);
    return NextResponse.json({ error: 'Failed to process review' }, { status: 500 });
  }
}
