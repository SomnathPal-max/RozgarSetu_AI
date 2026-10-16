import { NextResponse } from 'next/server';
import { db } from '@/db';
import { vacancies, noticeVersions, rules, documentItems, sources } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vacancyId: string }> }
) {
  try {
    const { vacancyId } = await params;

    const [vac] = await db
      .select({
        vacancy: vacancies,
        source: sources,
      })
      .from(vacancies)
      .leftJoin(sources, eq(vacancies.sourceId, sources.id))
      .where(eq(vacancies.id, vacancyId));

    if (!vac) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }

    const versionId = vac.vacancy.currentNoticeVersionId;
    let version = null;
    let versionRules: Array<typeof rules.$inferSelect> = [];
    let items: Array<typeof documentItems.$inferSelect> = [];

    if (versionId) {
      const [ver] = await db
        .select()
        .from(noticeVersions)
        .where(eq(noticeVersions.id, versionId));
      version = ver || null;

      versionRules = await db
        .select()
        .from(rules)
        .where(eq(rules.noticeVersionId, versionId));

      items = await db
        .select()
        .from(documentItems)
        .where(eq(documentItems.noticeVersionId, versionId));
    }

    return NextResponse.json({
      vacancy: vac.vacancy,
      source: vac.source,
      version,
      rules: versionRules,
      documents: items,
    });
  } catch (error) {
    console.error('Error fetching receipt data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt data' },
      { status: 500 }
    );
  }
}
