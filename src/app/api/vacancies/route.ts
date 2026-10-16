import { NextResponse } from 'next/server';
import { db } from '@/db';
import { vacancies, sources, verificationChecks, scamFlags } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type'); // 'government' | 'msme'
    const query = searchParams.get('q')?.toLowerCase();

    // Query active vacancies (suspended vacancies are hidden from finder per section 5/7)
    const allVacancies = await db
      .select({
        vacancy: vacancies,
        source: sources,
      })
      .from(vacancies)
      .leftJoin(sources, eq(vacancies.sourceId, sources.id))
      .where(eq(vacancies.status, 'active'));

    // Fetch verification checks and scam flags for each vacancy
    const results = await Promise.all(
      allVacancies.map(async ({ vacancy, source }) => {
        const checks = await db
          .select()
          .from(verificationChecks)
          .where(eq(verificationChecks.vacancyId, vacancy.id));

        const flags = await db
          .select()
          .from(scamFlags)
          .where(eq(scamFlags.vacancyId, vacancy.id));

        const completedChecks = checks.filter((c) => c.completed);
        const scamFlag = flags[0];

        let redFlagCount = 0;
        if (scamFlag) {
          if (scamFlag.asksFee) redFlagCount++;
          if (scamFlag.personalNumberOnly) redFlagCount++;
          if (scamFlag.noBusinessDetails) redFlagCount++;
          if (scamFlag.unrealisticPay) redFlagCount++;
          if (scamFlag.urgencyPressure) redFlagCount++;
        }

        return {
          ...vacancy,
          sourceName: source?.bodyName ?? vacancy.orgName,
          completedChecksCount: completedChecks.length,
          totalChecksCount: checks.length,
          hasContactVerified: completedChecks.some((c) => c.checkKey === 'contact_called_back'),
          redFlagCount,
          isHighRisk: redFlagCount > 0,
        };
      })
    );

    // Apply filtering in memory
    let filtered = results;
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((v) => v.type === typeFilter);
    }
    if (query) {
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.orgName.toLowerCase().includes(query) ||
          v.area.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ vacancies: filtered });
  } catch (err) {
    console.error('Failed to list vacancies:', err);
    return NextResponse.json({ error: 'Failed to list vacancies' }, { status: 500 });
  }
}
