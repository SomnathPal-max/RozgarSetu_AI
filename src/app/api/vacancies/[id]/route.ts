import { NextResponse } from 'next/server';
import { db } from '@/db';
import { vacancies, sources, noticeVersions, verificationChecks, scamFlags, rules } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [vac] = await db
      .select({
        vacancy: vacancies,
        source: sources,
      })
      .from(vacancies)
      .leftJoin(sources, eq(vacancies.sourceId, sources.id))
      .where(eq(vacancies.id, id));

    if (!vac) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }

    // Get current version
    const version = vac.vacancy.currentNoticeVersionId
      ? (
          await db
            .select()
            .from(noticeVersions)
            .where(eq(noticeVersions.id, vac.vacancy.currentNoticeVersionId))
        )[0]
      : null;

    // Get verification checks
    const checks = await db
      .select()
      .from(verificationChecks)
      .where(eq(verificationChecks.vacancyId, id));

    // Get scam flags
    const [scamFlag] = await db
      .select()
      .from(scamFlags)
      .where(eq(scamFlags.vacancyId, id));

    // Get rules for this version
    const vacancyRules = version
      ? await db
          .select()
          .from(rules)
          .where(eq(rules.noticeVersionId, version.id))
      : [];

    return NextResponse.json({
      vacancy: vac.vacancy,
      source: vac.source,
      version,
      checks,
      scamFlag: scamFlag ?? null,
      rules: vacancyRules,
    });
  } catch (err) {
    console.error('Failed to get vacancy detail:', err);
    return NextResponse.json({ error: 'Failed to get vacancy detail' }, { status: 500 });
  }
}
