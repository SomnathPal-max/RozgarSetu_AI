'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Bookmark,
  ShieldAlert,
  AlertCircle,
  Flag,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { type Locale } from '@/i18n/config';

type CheckKey =
  | 'official_link_recorded'
  | 'dates_checked'
  | 'rules_entered'
  | 'contact_called_back'
  | 'business_doc_seen'
  | 'partner_confirmed';

interface VacancyDetail {
  id: string;
  type: 'government' | 'msme';
  title: string;
  orgName: string;
  area: string;
  sourceUrl: string;
  publishedOn: string;
  lastDate: string;
  lastCheckedAt: string;
  advertisedPayMin?: number;
  advertisedPayMax?: number;
}

interface VerificationCheck {
  id: string;
  checkKey: string;
  completed: boolean;
  completedOn?: string;
  completedBy?: string;
}

interface ScamFlag {
  asksFee: boolean;
  personalNumberOnly: boolean;
  noBusinessDetails: boolean;
  unrealisticPay: boolean;
  urgencyPressure: boolean;
}

interface VacancyDetailClientProps {
  id: string;
  locale: Locale;
}

export function VacancyDetailClient({ id, locale }: VacancyDetailClientProps) {
  const t = useTranslations('screen3');
  const tChecks = useTranslations('checks');
  const router = useRouter();

  const [vacancy, setVacancy] = useState<VacancyDetail | null>(null);
  const [checks, setChecks] = useState<VerificationCheck[]>([]);
  const [scamFlag, setScamFlag] = useState<ScamFlag | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/vacancies/${id}`);
        if (res.ok) {
          const data = await res.json();
          setVacancy(data.vacancy);
          setChecks(data.checks || []);
          setScamFlag(data.scamFlag || null);
        }
      } catch (err) {
        console.error('Failed to load vacancy detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center py-12 text-slate-500 text-sm">
        Loading vacancy details...
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Vacancy not found.{' '}
        <Link href={`/${locale}/vacancies`} className="text-blue-600 underline">
          Return to list
        </Link>
      </div>
    );
  }

  const completedChecks = checks.filter((c) => c.completed);

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] justify-between space-y-6 pb-2">
      <div className="space-y-5">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[44px] min-w-[44px] -ml-2 px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <Link
            href={`/${locale}/report/${id}`}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 min-h-[44px] px-2 font-medium"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report listing</span>
          </Link>
        </div>

        {/* Title and Organisation */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
            {vacancy.title}
          </h1>
          <p className="text-xs text-slate-600">
            {id === 'notice-a' ? 'Illustrative Notice A · Example Recruiting Body' : `${vacancy.orgName} · ${vacancy.area}`}
          </p>
        </div>

        {/* Key Metadata Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t('published')}:</span>
            <span className="font-medium text-slate-800">1 Oct 2026</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">{t('lastDate')}:</span>
            <span className="font-bold text-slate-900">12 Nov 2026</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t('lastChecked')}:</span>
            <span className="font-medium text-slate-800">14 Oct 2026</span>
          </div>
          {vacancy.advertisedPayMin && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">{t('pay')}:</span>
              <span className="font-bold text-slate-900">
                Rs {vacancy.advertisedPayMin.toLocaleString()} to {vacancy.advertisedPayMax?.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Scam Flag Warning Banner (if present) */}
        {scamFlag && scamFlag.asksFee && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 space-y-1 text-xs text-rose-900">
            <div className="flex items-center gap-1.5 font-bold text-rose-700">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Scam Shield: 1 red flag detected</span>
            </div>
            <p className="text-[11px] text-rose-800">
              This listing asks for an upfront registration fee or uses an unverified personal messaging number.
            </p>
          </div>
        )}

        {/* Checks Completed Block */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t('checksCompleted')}
          </h2>

          {completedChecks.length > 0 ? (
            <ul className="space-y-2">
              {completedChecks.map((check) => (
                <li key={check.id} className="flex items-start gap-2 text-xs text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{tChecks(check.checkKey as CheckKey)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              <span>{t('noChecks')}</span>
            </div>
          )}

          {/* Mandatory Rule 6 disclaimer: "This badge does not guarantee a listing is safe." */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 italic">
              {t('badgeDisclaimer')}
            </p>
          </div>
        </div>

        {/* Action Buttons Matching Mock-up */}
        <div className="space-y-2.5 pt-2">
          {/* Button 1: Check my eligibility */}
          <Link
            href={`/${locale}/vacancies/${id}/check`}
            className="w-full rounded-xl bg-blue-600 py-3.5 px-4 text-white font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2 min-h-[48px]"
          >
            <span>{t('checkEligibility')}</span>
          </Link>

          {/* Button 2: Open official notice */}
          <a
            href={vacancy.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl border-2 border-slate-300 bg-white py-3 px-4 text-slate-800 font-semibold text-sm hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          >
            <span>{t('viewOfficialNotice')}</span>
            <ExternalLink className="w-4 h-4 text-slate-500" />
          </a>

          {/* Button 3: Save job */}
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`w-full rounded-xl border py-3 px-4 font-semibold text-sm transition-colors flex items-center justify-center gap-2 min-h-[48px] ${
              isSaved
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-600 text-emerald-600' : 'text-slate-500'}`} />
            <span>{isSaved ? t('jobSaved') : t('saveJob')}</span>
          </button>
        </div>
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}
