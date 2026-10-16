import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reports, vacancies, decisions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rep] = await db
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
      .where(eq(reports.id, id));

    if (!rep) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

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

    const isHighRisk = reasons.includes('asks_fee') || reasons.includes('personal_number_only');

    return NextResponse.json({
      report: {
        ...rep,
        reasons,
        isHighRisk,
        decisions: reportDecisions,
      },
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}
