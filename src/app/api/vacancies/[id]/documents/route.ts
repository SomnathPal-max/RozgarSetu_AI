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

    let items: Array<typeof documentItems.$inferSelect> = [];

    if (vac.currentNoticeVersionId) {
      items = await db
        .select()
        .from(documentItems)
        .where(eq(documentItems.noticeVersionId, vac.currentNoticeVersionId));
    }

    // If no document items configured yet, provide standard statutory defaults
    if (items.length === 0) {
      items = [
        {
          id: `doc-${vac.id}-1`,
          noticeVersionId: vac.currentNoticeVersionId || 'v1',
          labelKey: 'educational_certificates',
          requiredAlways: true,
          conditionNote: null,
          formatNote: 'Self-attested mark sheets and pass certificates',
          issuingAuthority: 'Recognized Board / University',
          validityNotes: null,
        },
        {
          id: `doc-${vac.id}-2`,
          noticeVersionId: vac.currentNoticeVersionId || 'v1',
          labelKey: 'photo_signature',
          requiredAlways: true,
          conditionNote: null,
          formatNote: 'Recent passport photo and scanned signature',
          issuingAuthority: 'Candidate',
          validityNotes: 'Under 50 KB',
        },
        {
          id: `doc-${vac.id}-3`,
          noticeVersionId: vac.currentNoticeVersionId || 'v1',
          labelKey: 'dob_proof',
          requiredAlways: true,
          conditionNote: null,
          formatNote: 'Secondary / 10th Admit Card or Birth Certificate',
          issuingAuthority: 'State Board or Municipal Authority',
          validityNotes: null,
        },
        {
          id: `doc-${vac.id}-4`,
          noticeVersionId: vac.currentNoticeVersionId || 'v1',
          labelKey: 'category_certificate',
          requiredAlways: false,
          conditionNote: 'Only if claiming statutory SC / ST / OBC / EWS relaxation',
          formatNote: 'Prescribed format with current financial year validity for OBC-NCL / EWS',
          issuingAuthority: 'SDO / District Magistrate / Tehsildar',
          validityNotes: 'Current Financial Year',
        },
        {
          id: `doc-${vac.id}-5`,
          noticeVersionId: vac.currentNoticeVersionId || 'v1',
          labelKey: 'id_proof',
          requiredAlways: true,
          conditionNote: null,
          formatNote: 'Aadhaar / Voter ID / Passport / Driving Licence',
          issuingAuthority: 'Government of India',
          validityNotes: null,
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
      },
      documents: items,
    });
  } catch (error) {
    console.error('Error fetching vacancy documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vacancy documents' },
      { status: 500 }
    );
  }
}
