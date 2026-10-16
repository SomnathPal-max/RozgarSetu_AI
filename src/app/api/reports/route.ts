import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reports, vacancies, decisions, auditLog } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allReports = await db
      .select({
        id: reports.id,
        ref: reports.ref,
        vacancyId: reports.vacancyId,
        reasonsJson: reports.reasonsJson,
        note: reports.note,
        status: reports.status,
        acknowledgedBy: reports.acknowledgedBy,
        createdAt: reports.createdAt,
        ackDueAt: reports.ackDueAt,
        triageDueAt: reports.triageDueAt,
        vacancyTitle: vacancies.title,
        vacancyOrgName: vacancies.orgName,
        vacancyArea: vacancies.area,
        vacancyStatus: vacancies.status,
      })
      .from(reports)
      .innerJoin(vacancies, eq(reports.vacancyId, vacancies.id))
      .orderBy(desc(reports.createdAt));

    // Enrich with latest decision if any
    const enriched = await Promise.all(
      allReports.map(async (rep) => {
        const reportDecisions = await db
          .select()
          .from(decisions)
          .where(eq(decisions.reportId, rep.id))
          .orderBy(desc(decisions.appliedAt));

        let reasons: string[] = [];
        try {
          reasons = JSON.parse(rep.reasonsJson);
        } catch {
          reasons = [rep.reasonsJson];
        }

        // High risk if asks for fee or personal messaging number only
        const isHighRisk = reasons.includes('asks_fee') || reasons.includes('personal_number_only');

        return {
          ...rep,
          reasons,
          isHighRisk,
          latestDecision: reportDecisions[0] || null,
        };
      })
    );

    const audits = await db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(10);

    return NextResponse.json({ reports: enriched, audits });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vacancyId, reasons = [], note = '' } = body;

    if (!vacancyId) {
      return NextResponse.json({ error: 'vacancyId is required' }, { status: 400 });
    }

    if (!Array.isArray(reasons) || reasons.length === 0) {
      return NextResponse.json({ error: 'At least one reason is required' }, { status: 400 });
    }

    // Determine sequential reference number (RS-0001, RS-0002, etc.)
    const existingReports = await db
      .select({ ref: reports.ref })
      .from(reports);

    let nextNum = existingReports.length + 1;
    let nextRef = `RS-${String(nextNum).padStart(4, '0')}`;
    while (existingReports.some((r) => r.ref === nextRef)) {
      nextNum++;
      nextRef = `RS-${String(nextNum).padStart(4, '0')}`;
    }

    const reportId = `rep-${Date.now()}`;
    const now = new Date();
    const ackDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours SLA
    const triageDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours SLA

    await db.insert(reports).values({
      id: reportId,
      ref: nextRef,
      vacancyId,
      reasonsJson: JSON.stringify(reasons),
      note,
      status: 'received',
      createdAt: now.toISOString(),
      ackDueAt: ackDate.toISOString(),
      triageDueAt: triageDate.toISOString(),
    });

    // Write audit log entry
    await db.insert(auditLog).values({
      id: `audit-${Date.now()}`,
      actor: 'candidate',
      action: 'create_report',
      entity: 'reports',
      entityId: reportId,
      reason: `User submitted report ${nextRef} for vacancy ${vacancyId} (reasons: ${reasons.join(', ')})`,
      createdAt: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      report: {
        id: reportId,
        ref: nextRef,
        status: 'received',
        ackDueAt: ackDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}
