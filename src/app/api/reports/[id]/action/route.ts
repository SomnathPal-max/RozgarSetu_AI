import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reports, vacancies, decisions, auditLog } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      type = 'propose', // 'propose' | 'approve' | 'reject'
      action, // 'suspend' | 'ask_correction' | 'close'
      reason,
      reviewerId: rawReviewerId = 'rev-1',
    } = body;

    // Normalize reviewer ID to foreign key in users table ('rev-1', 'rev-2', 'admin-1')
    const reviewerId =
      rawReviewerId === 'reviewer-1'
        ? 'rev-1'
        : rawReviewerId === 'reviewer-2'
        ? 'rev-2'
        : rawReviewerId;

    const [rep] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id));

    if (!rep) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    let reasons: string[] = [];
    try {
      reasons = JSON.parse(rep.reasonsJson);
    } catch {
      reasons = [rep.reasonsJson];
    }

    const isHighRisk = reasons.includes('asks_fee') || reasons.includes('personal_number_only');

    if (type === 'propose') {
      if (!action || !reason) {
        return NextResponse.json(
          { error: 'Action and mandatory reason are required' },
          { status: 400 }
        );
      }

      const decisionId = `dec-${Date.now()}`;
      const now = new Date().toISOString();

      if (isHighRisk) {
        // High risk requires two reviewers: record proposal and leave approvedBy null
        await db.insert(decisions).values({
          id: decisionId,
          reportId: rep.id,
          action,
          reason,
          proposedBy: reviewerId,
          approvedBy: null,
          appliedAt: null,
        });

        await db
          .update(reports)
          .set({ status: 'under_review' })
          .where(eq(reports.id, rep.id));

        // Audit log entry per AGENTS.md
        await db.insert(auditLog).values({
          id: `audit-${Date.now()}`,
          actor: reviewerId,
          action: 'propose_decision',
          entity: 'reports',
          entityId: rep.id,
          reason: `Proposed action '${action}': ${reason}. Pending second reviewer approval due to high risk.`,
          createdAt: now,
        });

        return NextResponse.json({
          success: true,
          status: 'under_review',
          needsSecondReviewer: true,
          decisionId,
        });
      } else {
        // Standard risk can be executed directly by one reviewer
        await db.insert(decisions).values({
          id: decisionId,
          reportId: rep.id,
          action,
          reason,
          proposedBy: reviewerId,
          approvedBy: reviewerId,
          appliedAt: now,
        });

        if (action === 'suspend') {
          await db
            .update(vacancies)
            .set({ status: 'suspended' })
            .where(eq(vacancies.id, rep.vacancyId));
        }

        await db
          .update(reports)
          .set({ status: 'closed' })
          .where(eq(reports.id, rep.id));

        await db.insert(auditLog).values({
          id: `audit-${Date.now()}`,
          actor: reviewerId,
          action: `execute_${action}`,
          entity: 'reports',
          entityId: rep.id,
          reason: `Standard risk decision executed: ${reason}`,
          createdAt: now,
        });

        return NextResponse.json({
          success: true,
          status: 'closed',
          needsSecondReviewer: false,
          decisionId,
        });
      }
    } else if (type === 'approve') {
      // Find the latest pending decision for this report
      const [pendingDecision] = await db
        .select()
        .from(decisions)
        .where(eq(decisions.reportId, rep.id))
        .orderBy(desc(decisions.id));

      if (!pendingDecision) {
        return NextResponse.json(
          { error: 'No pending decision found to approve' },
          { status: 404 }
        );
      }

      // CRITICAL RULE: Second reviewer must be a DIFFERENT reviewer
      if (isHighRisk && pendingDecision.proposedBy === reviewerId) {
        return NextResponse.json(
          {
            error:
              'Two-reviewer rule violation: High-risk listing decisions must be approved by a different reviewer than the proposer.',
          },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();

      await db
        .update(decisions)
        .set({
          approvedBy: reviewerId,
          appliedAt: now,
        })
        .where(eq(decisions.id, pendingDecision.id));

      if (pendingDecision.action === 'suspend') {
        await db
          .update(vacancies)
          .set({ status: 'suspended' })
          .where(eq(vacancies.id, rep.vacancyId));
      }

      await db
        .update(reports)
        .set({ status: 'closed' })
        .where(eq(reports.id, rep.id));

      // Audit log entry with both reviewers recorded
      await db.insert(auditLog).values({
        id: `audit-${Date.now()}`,
        actor: reviewerId,
        action: `approve_${pendingDecision.action}`,
        entity: 'reports',
        entityId: rep.id,
        reason: `Second reviewer approval for '${pendingDecision.action}'. Proposed by ${pendingDecision.proposedBy}, approved by ${reviewerId}. Original reason: ${pendingDecision.reason}`,
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        status: 'closed',
        action: pendingDecision.action,
        approvedBy: reviewerId,
      });
    } else if (type === 'reject') {
      const now = new Date().toISOString();

      await db
        .update(reports)
        .set({ status: 'received' })
        .where(eq(reports.id, rep.id));

      await db.insert(auditLog).values({
        id: `audit-${Date.now()}`,
        actor: reviewerId,
        action: 'reject_proposal',
        entity: 'reports',
        entityId: rep.id,
        reason: `Proposal rejected by ${reviewerId}: ${reason || 'Returned to queue'}`,
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        status: 'received',
      });
    }

    return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
  } catch (error) {
    console.error('Error processing reviewer action:', error);
    return NextResponse.json(
      { error: 'Failed to process reviewer action' },
      { status: 500 }
    );
  }
}
