import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import {
  vacancies,
  noticeVersions,
  rules,
  documentItems,
  verificationChecks,
  sources,
  auditLog,
} from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get('rozgarsetu_role')?.value;

    if (!role || (role !== 'reviewer' && role !== 'reviewer2' && role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const allNotices = await db
      .select()
      .from(vacancies)
      .orderBy(desc(vacancies.publishedOn));

    return NextResponse.json({ notices: allNotices });
  } catch (error) {
    console.error('Error fetching admin notices:', error);
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get('rozgarsetu_role')?.value;

    if (!role || (role !== 'reviewer' && role !== 'reviewer2' && role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      orgName,
      area = 'All India',
      type = 'government',
      noticeNumber,
      sourceUrl,
      gazettePdfUrl,
      officialWebsiteUrl,
      applicationPortalUrl,
      feeGeneral = 0,
      feeVaivedFor = 'SC / ST / PwBD / Female',
      publishedOn,
      lastDate,
      examDateTentative,
      totalVacancies,
      payMin,
      payMax,
      minAge = 18,
      maxAge = 30,
      cutoffDate,
      requiredQualification = 'graduate',
      requiredStream,
      scRelaxation = 5,
      stRelaxation = 5,
      obcRelaxation = 3,
      documents = [],
    } = body;

    if (!title || !orgName || !sourceUrl || !publishedOn || !lastDate) {
      return NextResponse.json(
        { error: 'Mandatory fields missing: title, orgName, sourceUrl, publishedOn, lastDate' },
        { status: 400 }
      );
    }

    // Official link validation guardrail per AGENTS.md rule 6
    if (!sourceUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Source URL must use secure HTTPS protocol' },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const vacancyId = `notice-${slug.slice(0, 24)}-${Date.now().toString().slice(-4)}`;
    const versionId = `ver-${vacancyId}-1`;
    const sourceId = `src-${vacancyId}`;

    // 1. Create Source entry
    await db.insert(sources).values({
      id: sourceId,
      bodyName: orgName,
      url: officialWebsiteUrl || sourceUrl,
      format: 'web',
      updateFrequency: 'daily',
      permittedUseNote: 'Official public recruitment circular',
    });

    // 2. Insert Vacancy in under_review status (Two-reviewer rule applies before publication)
    await db.insert(vacancies).values({
      id: vacancyId,
      type,
      title,
      orgName,
      area,
      sourceId,
      sourceUrl,
      publishedOn,
      lastDate,
      lastCheckedAt: `${publishedOn} 10:00 IST`,
      status: 'under_review',
      advertisedPayMin: payMin ? parseInt(payMin, 10) : null,
      advertisedPayMax: payMax ? parseInt(payMax, 10) : null,
      currentNoticeVersionId: versionId,
      noticeNumber: noticeNumber || `NOT-${Date.now().toString().slice(-6)}`,
      gazettePdfUrl: gazettePdfUrl || sourceUrl,
      officialWebsiteUrl: officialWebsiteUrl || sourceUrl,
      applicationPortalUrl: applicationPortalUrl || sourceUrl,
      feeGeneral: feeGeneral ? parseInt(feeGeneral, 10) : 0,
      feeVaivedFor,
      examDateTentative: examDateTentative || null,
      totalVacancies: totalVacancies ? parseInt(totalVacancies, 10) : null,
      firstReviewerId: null,
      firstReviewedAt: null,
      secondReviewerId: null,
      secondReviewedAt: null,
      isSourceChecked: false,
    });

    // 3. Create initial Notice Version
    await db.insert(noticeVersions).values({
      id: versionId,
      vacancyId,
      versionNo: 1,
      contentHash: `hash-${vacancyId}-v1`,
      snapshotJson: JSON.stringify({
        deadline: lastDate,
        cutoffDate: cutoffDate || publishedOn,
        requirements: {
          minAge: parseInt(minAge, 10),
          maxAge: parseInt(maxAge, 10),
          qualification: requiredQualification,
          stream: requiredStream,
        },
        documents,
      }),
      createdAt: new Date().toISOString(),
      changeNote: 'Initial notice ingestion by curator',
    });

    // 4. Create Statutory Rules (Age, Qualification, Category Relaxation)
    await db.insert(rules).values([
      {
        id: `rule-${vacancyId}-age`,
        noticeVersionId: versionId,
        criterion: 'age',
        paramsJson: JSON.stringify({
          minAge: parseInt(minAge, 10),
          maxAge: parseInt(maxAge, 10),
          cutoffDate: cutoffDate || publishedOn,
          relaxationTable: {
            SC: parseInt(scRelaxation, 10),
            ST: parseInt(stRelaxation, 10),
            OBC: parseInt(obcRelaxation, 10),
          },
        }),
        sourceClause: 'Clause 3(a)',
        ambiguous: false,
        hasCorrigendum: false,
      },
      {
        id: `rule-${vacancyId}-qual`,
        noticeVersionId: versionId,
        criterion: 'qualification',
        paramsJson: JSON.stringify({
          requiredLevel: requiredQualification,
          requiredStream: requiredStream || undefined,
        }),
        sourceClause: 'Clause 4(a)',
        ambiguous: false,
        hasCorrigendum: false,
      },
      {
        id: `rule-${vacancyId}-cat`,
        noticeVersionId: versionId,
        criterion: 'category_relaxation',
        paramsJson: JSON.stringify({
          relaxationTable: {
            SC: parseInt(scRelaxation, 10),
            ST: parseInt(stRelaxation, 10),
            OBC: parseInt(obcRelaxation, 10),
          },
        }),
        sourceClause: 'Clause 3(b)',
        ambiguous: false,
        hasCorrigendum: false,
      },
    ]);

    // 5. Seed standard Verification Checks (all incomplete until reviewers sign off)
    await db.insert(verificationChecks).values([
      {
        id: `vc-${vacancyId}-link`,
        vacancyId,
        checkKey: 'official_link_recorded',
        completed: false,
      },
      {
        id: `vc-${vacancyId}-dates`,
        vacancyId,
        checkKey: 'dates_checked',
        completed: false,
      },
      {
        id: `vc-${vacancyId}-rules`,
        vacancyId,
        checkKey: 'rules_entered',
        completed: false,
      },
    ]);

    // 6. Seed statutory Document Items
    const defaultDocItems = [
      {
        id: `doc-${vacancyId}-edu`,
        noticeVersionId: versionId,
        labelKey: 'educational_certificates',
        requiredAlways: true,
        conditionNote: null,
        formatNote: 'Self-attested mark sheets and provisional / final degree certificate',
        issuingAuthority: 'Recognized Board / University',
      },
      {
        id: `doc-${vacancyId}-dob`,
        noticeVersionId: versionId,
        labelKey: 'dob_proof',
        requiredAlways: true,
        conditionNote: null,
        formatNote: 'Secondary / 10th standard Admit Card or Birth Certificate',
        issuingAuthority: 'State Board or Municipal Registrar',
      },
      {
        id: `doc-${vacancyId}-id`,
        noticeVersionId: versionId,
        labelKey: 'id_proof',
        requiredAlways: true,
        conditionNote: null,
        formatNote: 'Aadhaar / Voter ID / Passport',
        issuingAuthority: 'Government of India',
      },
      {
        id: `doc-${vacancyId}-cat`,
        noticeVersionId: versionId,
        labelKey: 'category_certificate',
        requiredAlways: false,
        conditionNote: 'Only if claiming SC / ST / OBC / EWS statutory relaxation',
        formatNote: 'Prescribed central or state format with financial year validity for OBC-NCL / EWS',
        issuingAuthority: 'Sub-Divisional Officer (SDO) / District Magistrate / Tehsildar',
      },
    ];

    for (const doc of defaultDocItems) {
      await db.insert(documentItems).values(doc);
    }

    // 7. Audit Log per AGENTS.md engineering rules
    await db.insert(auditLog).values({
      id: `audit-${Date.now()}`,
      actor: role,
      action: 'ingest_recruitment_notice',
      entity: 'vacancies',
      entityId: vacancyId,
      reason: `New notice '${title}' ingested by ${role}. Placed in 'under_review' pending Two-Reviewer verification.`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      vacancyId,
      status: 'under_review',
      message: 'Notice ingested successfully. Requires Two-Reviewer sign-off to publish.',
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 });
  }
}
