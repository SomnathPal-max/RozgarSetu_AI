import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reports, vacancies, decisions, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Reset vacancies status for msme-delivery
    await db
      .update(vacancies)
      .set({ status: 'active' })
      .where(eq(vacancies.id, 'msme-delivery'));

    // Clear decisions
    await db.delete(decisions);

    // Reset report-1 to 'received'
    await db
      .update(reports)
      .set({
        status: 'received',
      })
      .where(eq(reports.id, 'rep-1'));

    // Write audit log entry
    await db.insert(auditLog).values({
      id: `audit-${Date.now()}`,
      actor: 'admin',
      action: 'reset_reports_queue',
      entity: 'reports',
      entityId: 'all',
      reason: 'Reset reviewer queue to initial seed state for demo replayability',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Queue reset' });
  } catch (error) {
    console.error('Error resetting reports:', error);
    return NextResponse.json(
      { error: 'Failed to reset reports' },
      { status: 500 }
    );
  }
}
