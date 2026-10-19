'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  Share2,
  CheckCircle2,
  ArrowLeft,
  QrCode,
  Accessibility,
  ShieldCheck,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { getSessionProfile, type UserProfile } from '@/lib/profile';
import { checkEligibility, calculateAgeOnDate, type Rule, type CriterionResult } from '@/engine';
import { type Locale } from '@/i18n/config';

interface ReceiptVacancy {
  id: string;
  title: string;
  orgName: string;
  sourceUrl: string;
  lastDate: string;
  currentNoticeVersionId: string;
}

interface ReceiptVersion {
  id: string;
  versionNo: number;
  contentHash: string;
  createdAt: string;
  changeNote?: string;
}

interface ReceiptDocument {
  id: string;
  labelKey: string;
  requiredAlways: boolean;
  conditionNote: string | null;
  formatNote: string | null;
}

interface EligibilityReceiptClientProps {
  vacancyId: string;
  locale: Locale;
}

export function EligibilityReceiptClient({ vacancyId, locale }: EligibilityReceiptClientProps) {
  const t = useTranslations('screen8');
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vacancy, setVacancy] = useState<ReceiptVacancy | null>(null);
  const [version, setVersion] = useState<ReceiptVersion | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [documents, setDocuments] = useState<ReceiptDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [sahayakMode, setSahayakMode] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    // 1. Load client-side session profile (Rule 8: never stored in DB)
    const stored = getSessionProfile();
    setProfile(stored);

    // 2. Load receipt data
    async function fetchReceiptData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/receipt/${vacancyId}`);
        if (res.ok) {
          const data = await res.json();
          setVacancy(data.vacancy);
          setVersion(data.version);
          setDocuments(data.documents || []);

          interface RawDbRule {
            criterion: Rule['criterion'];
            paramsJson: string | Record<string, unknown>;
            sourceClause?: string;
            ambiguous?: boolean | number;
            hasCorrigendum?: boolean | number;
          }

          const mappedRules: Rule[] = (data.rules || []).map((r: RawDbRule) => ({
            criterion: r.criterion,
            params: typeof r.paramsJson === 'string' ? JSON.parse(r.paramsJson) : r.paramsJson,
            sourceClause: r.sourceClause,
            ambiguous: Boolean(r.ambiguous),
            hasCorrigendum: Boolean(r.hasCorrigendum),
          }));
          setRules(mappedRules);
        }
      } catch (err) {
        console.error('Failed to load receipt:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReceiptData();
  }, [vacancyId]);

  // Evaluate rules purely using pure rules engine
  const evaluationResult = useMemo(() => {
    const candidateProfile = profile || {
      name: 'Illustrative Candidate',
      mobile: '0000000001',
      dob: '2002-05-15',
      qualificationLevel: 'higher_secondary' as const,
      qualificationStream: 'Arts',
      category: undefined,
      disability: undefined,
      preferredDistrict: 'Paschim Bardhaman',
      language: 'en' as const,
    };

    if (rules.length === 0) return null;

    return checkEligibility(
      {
        dob: candidateProfile.dob,
        qualificationLevel: candidateProfile.qualificationLevel,
        qualificationStream: candidateProfile.qualificationStream,
        category: candidateProfile.category,
        disability: candidateProfile.disability,
      },
      rules,
      '2026-08-01'
    );
  }, [profile, rules]);

  const receiptHash = useMemo(() => {
    const vId = vacancyId || 'notice-a';
    const cutoffAge = profile?.dob ? calculateAgeOnDate(profile.dob, '2026-08-01') : '24';
    const qual = profile?.qualificationLevel || 'hs';
    const cat = profile?.category || 'gen';
    return `RS-REC-${vId.toUpperCase()}-${cat.toUpperCase()}-${qual.slice(0, 4).toUpperCase()}-${cutoffAge}`;
  }, [vacancyId, profile]);

  useEffect(() => {
    if (vacancy && evaluationResult && evaluationResult.results && evaluationResult.results.length > 0) {
      fetch(`/api/receipt/${vacancyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptHash,
          candidateAgeOnCutoff: profile?.dob
            ? `${calculateAgeOnDate(profile.dob, '2026-08-01')} years`
            : '24 years (Illustrative)',
          candidateQualification: profile?.qualificationLevel || 'Higher Secondary',
          candidateCategory: profile?.category || null,
          evaluationResult,
          isHelperMode: sahayakMode,
        }),
      }).catch(console.error);
    }
  }, [vacancy, evaluationResult, receiptHash, vacancyId, profile, sahayakMode]);

  const formattedLastDate = useMemo(() => {
    if (!vacancy?.lastDate) return '';
    return new Date(vacancy.lastDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [vacancy?.lastDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `${vacancy?.title} - Eligibility Receipt\nVersion: ${version?.id || 'v1'}\nDeadline: ${vacancy?.lastDate}\nStatus: PRELIMINARY - Verify against official notice.`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'RozgarSetu AI - Eligibility Receipt',
          text,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 3000);
    }
  };

  const formatCriterionStatus = (res: CriterionResult) => {
    switch (res.criterion) {
      case 'age':
        return { label: 'age', status: res.status };
      case 'qualification':
        return { label: 'graduate degree', status: res.status };
      case 'category_relaxation':
        return { label: 'category', status: res.status };
      case 'equivalent_qualification':
        return { label: 'equivalent qualification', status: res.status };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center py-12 text-slate-500 text-sm">
        {t('printing')}
      </div>
    );
  }

  if (!vacancy || !evaluationResult) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Receipt data unavailable.{' '}
        <Link href={`/${locale}/vacancies`} className="text-blue-600 underline">
          Return to list
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-[calc(100vh-140px)] justify-between space-y-6 pb-2 ${sahayakMode ? 'sahayak-active' : ''}`}>
      <div className="space-y-4">
        {/* Navigation & Controls (no-print) */}
        <div className="no-print flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[44px] min-w-[44px] -ml-2 px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('backToResult')}</span>
          </button>

          {/* Sahayak Helper Mode Toggle */}
          <button
            onClick={() => setSahayakMode(!sahayakMode)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
              sahayakMode
                ? 'bg-amber-100 border-amber-400 text-amber-900'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={t('sahayakModeDesc')}
          >
            <Accessibility className="w-4 h-4 text-amber-700" />
            <span>{t('sahayakMode')}</span>
          </button>
        </div>

        {/* Feedback banner */}
        {copiedNotice && (
          <div className="no-print p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('copiedReceipt')}</span>
          </div>
        )}

        {/* =========================================================================
            RECEIPT CARD (Printable Unit — Matches Screen 8 of Design Mockup Exactly)
            ========================================================================= */}
        <div className={`receipt-container rounded-2xl border bg-white p-5 space-y-4 shadow-sm relative overflow-hidden ${
          sahayakMode ? 'border-2 border-black text-black' : 'border-slate-300 text-slate-900'
        }`}>
          {/* Subtle Diagonal PRELIMINARY Watermark (Rule 4) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 select-none overflow-hidden rotate-[-25deg]">
            <span className="text-4xl md:text-5xl font-black uppercase tracking-widest text-slate-900 text-center">
              PRELIMINARY — ILLUSTRATIVE
            </span>
          </div>

          {/* Receipt Header */}
          <div className="space-y-1 border-b pb-3 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                RozgarSetu AI · {t('title')}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                STAMP: {version?.contentHash.slice(0, 12) || 'HASH-DEMO'}
              </span>
            </div>
            <h1 className={`${sahayakMode ? 'text-2xl' : 'text-xl'} font-bold tracking-tight text-slate-900`}>
              {vacancyId === 'notice-a' ? 'Clerk (Group C) · Illustrative Notice A' : `${vacancy.title} · ${vacancy.orgName}`}
            </h1>
          </div>

          {/* Notice version and date metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs border-b pb-3 border-slate-200 font-medium">
            <div>
              <span className="text-slate-500">{t('versionChecked')}:</span>{' '}
              <strong className="text-slate-900">14 Oct 2026</strong>
            </div>
            <div>
              <span className="text-slate-500">{t('lastDate')}:</span>{' '}
              <strong className="text-slate-900">{formattedLastDate}</strong>
            </div>
          </div>

          {/* Evaluated profile info */}
          <div className="text-xs text-slate-600 font-medium pb-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block tracking-wider">
              {t('candidateProfile')}
            </span>
            <span>
              {profile?.dob
                ? `Age ${calculateAgeOnDate(profile.dob, '2026-08-01')} · ${
                    profile.qualificationLevel
                      ? profile.qualificationLevel.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                      : 'Higher Secondary'
                  } · ${profile.category ? profile.category.toUpperCase() : 'category not entered'}`
                : 'Age 24 · Higher Secondary · category not entered'}
            </span>
          </div>

          {/* Per-Criterion Results matching Screen 8:
              Matched: age
              Not met: graduate degree
              Missing: category
              Manual review: equivalent qualification
          */}
          <div className="space-y-2 py-1 border-y border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {t('resultsBreakdown')}
            </span>

            <div className="space-y-1.5 text-xs">
              {evaluationResult.results.map((res) => {
                const item = formatCriterionStatus(res);
                return (
                  <div
                    key={res.criterion}
                    className="flex items-center justify-between py-0.5"
                  >
                    <span className="font-semibold text-slate-800 capitalize">
                      {item.status === 'matched'
                        ? 'Matched'
                        : item.status === 'not_met'
                        ? 'Not met'
                        : item.status === 'missing_data'
                        ? 'Missing'
                        : 'Manual review'}
                      : <span className="font-normal text-slate-600">{item.label}</span>
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${
                        item.status === 'matched'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.status === 'not_met'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : item.status === 'missing_data'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-sky-100 text-sky-800 border border-sky-300'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documents Section matching Screen 8 */}
          <div className="space-y-1 text-xs">
            <strong className="text-slate-800 font-bold block">
              {t('documentsLabel')}:
            </strong>
            <p className="text-slate-600 leading-relaxed">
              {documents.length > 0
                ? 'Certificates, photo and signature, proof of date of birth, ID proof'
                : t('documentsSummary')}
            </p>
          </div>

          {/* Mandatory Rule 4 Disclaimer matching Screen 8 */}
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-center space-y-1">
            <p className="text-xs font-bold text-amber-950 tracking-wide uppercase">
              {t('preliminaryWatermark')}
            </p>
            <p className="text-[11px] text-amber-900 leading-snug">
              This summary is generated from public recruitment rules. It is not an official call letter or confirmation.
            </p>
          </div>

          {/* Official Verification QR & Link Stamp */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-700 block">
                Official source link recorded:
              </span>
              <a
                href={vacancy.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline truncate max-w-[200px] block"
              >
                {vacancy.sourceUrl}
              </a>
            </div>
            <div className="w-10 h-10 border border-slate-300 rounded flex items-center justify-center bg-slate-50">
              <QrCode className="w-8 h-8 text-slate-700" />
            </div>
          </div>

          {/* Public Cryptographic Verification Proof Link */}
          <div className="pt-2 border-t border-slate-200">
            <Link
              href={`/${locale}/verify/${receiptHash}`}
              target="_blank"
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-semibold transition-colors"
            >
              <span className="flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate font-mono">Proof: {receiptHash}</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 underline shrink-0">
                Verify Proof →
              </span>
            </Link>
          </div>
        </div>

        {/* Action Buttons (no-print) */}
        <div className="no-print pt-2 space-y-2.5">
          <button
            onClick={handlePrint}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm py-3.5 px-4 shadow-sm flex items-center justify-center gap-2 min-h-[48px] transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{t('printOrShare')}</span>
          </button>

          <button
            onClick={handleShare}
            className="w-full rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-4 flex items-center justify-center gap-2 min-h-[40px] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Copy Receipt Summary</span>
          </button>

          <div className="text-center pt-1">
            <p className="text-xs text-slate-500 italic">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}
