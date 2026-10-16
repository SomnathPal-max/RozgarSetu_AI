import { NextResponse } from 'next/server';
import { db } from '@/db';
import { vacancies, documentItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [vac] = await db
      .select()
      .from(vacancies)
      .where(eq(vacancies.id, id));

    if (!vac) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }

    const versionId = vac.currentNoticeVersionId;
    let items: Array<typeof documentItems.$inferSelect> = [];

    if (versionId) {
      items = await db
        .select()
        .from(documentItems)
        .where(eq(documentItems.noticeVersionId, versionId));
    }

    // If no specific documents found for this version, provide standard default documents
    if (items.length === 0) {
      items = [
        {
          id: 'doc-default-1',
          noticeVersionId: versionId || 'default',
          labelKey: 'educational_certificates',
          requiredAlways: true,
          conditionNote: null,
          formatNote: 'Self-attested copies of mark sheets and certificates',
        },
        {
          id: 'doc-default-2',
          noticeVersionId: versionId || 'default',
          labelKey: 'photo_signature',
          requiredAlways: true,
          conditionNote: null,
          formatNote: 'in the size the notice asks (3.5cm x 4.5cm, under 50KB)',
        },
        {
          id: 'doc-default-3',
          noticeVersionId: versionId || 'default',
          labelKey: 'dob_proof',
          requiredAlways: true,
          conditionNote: null,
          formatNote: 'Madhyamik or equivalent admit card / birth certificate',
        },
        {
          id: 'doc-default-4',
          noticeVersionId: versionId || 'default',
          labelKey: 'category_certificate',
          requiredAlways: false,
          conditionNote: 'only if claiming relaxation',
          formatNote: 'Issued by competent authority (SDO / District Magistrate)',
        },
        {
          id: 'doc-default-5',
          noticeVersionId: versionId || 'default',
          labelKey: 'id_proof',
          requiredAlways: true,
          conditionNote: null,
          formatNote: 'Aadhaar / Voter ID / Passport',
        },
      ];
    }

    return NextResponse.json({
      vacancy: {
        id: vac.id,
        title: vac.title,
        orgName: vac.orgName,
        sourceUrl: vac.sourceUrl,
        lastDate: vac.lastDate,
        currentNoticeVersionId: vac.currentNoticeVersionId,
      },
      documents: items,
    });
  } catch (error) {
    console.error('Error fetching vacancy documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
