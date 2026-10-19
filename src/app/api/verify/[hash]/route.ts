import { NextResponse } from 'next/server';
import { db } from '@/db';
import { verificationReceipts, vacancies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    const [rec] = await db
      .select({
        receipt: verificationReceipts,
        vacancy: vacancies,
      })
      .from(verificationReceipts)
      .leftJoin(vacancies, eq(verificationReceipts.vacancyId, vacancies.id))
      .where(eq(verificationReceipts.receiptHash, hash));

    if (!rec) {
      // Check if it's a seed or fallback demo hash
      if (hash.startsWith('demo-receipt-') || hash.includes('notice-a')) {
        return NextResponse.json({
          receipt: {
            receiptHash: hash,
            vacancyTitle: 'Clerk (Group C) · Notice A',
            candidateAgeOnCutoff: '24 years (DOB: 15 May 2002)',
            candidateQualification: 'Higher Secondary',
            candidateCategory: 'General (Category unentered)',
            evaluationResult: [
              { criterion: 'age', status: 'matched', reasonKey: 'AGE_WITHIN_LIMIT' },
              { criterion: 'qualification', status: 'not_met', reasonKey: 'QUAL_BELOW_REQUIRED' },
              { criterion: 'category_relaxation', status: 'missing_data', reasonKey: 'CATEGORY_NOT_ENTERED' },
              { criterion: 'equivalent_qualification', status: 'manual_review', reasonKey: 'EQUIV_CLAUSE_AMBIGUOUS' },
            ],
            rulesVersion: 'ver-notice-a-1',
            generatedAt: new Date().toISOString(),
            isHelperMode: true,
          },
          officialNoticeUrl: 'https://example-recruiting.internal.gov/notices/2026/notice-a',
          isPreliminary: true,
          verified: true,
        });
      }

      return NextResponse.json({ error: 'Receipt record not found' }, { status: 404 });
    }

    let parsedResult = [];
    try {
      parsedResult = JSON.parse(rec.receipt.evaluationResultJson);
    } catch {
      parsedResult = [];
    }

    return NextResponse.json({
      receipt: {
        receiptHash: rec.receipt.receiptHash,
        vacancyTitle: rec.receipt.vacancyTitle,
        candidateAgeOnCutoff: rec.receipt.candidateAgeOnCutoff,
        candidateQualification: rec.receipt.candidateQualification,
        candidateCategory: rec.receipt.candidateCategory || 'Not specified',
        evaluationResult: parsedResult,
        rulesVersion: rec.receipt.rulesVersion,
        generatedAt: rec.receipt.generatedAt,
        isHelperMode: rec.receipt.isHelperMode,
      },
      officialNoticeUrl: rec.vacancy?.sourceUrl || '#',
      isPreliminary: true,
      verified: true,
    });
  } catch (error) {
    console.error('Error verifying receipt:', error);
    return NextResponse.json({ error: 'Failed to verify receipt' }, { status: 500 });
  }
}
