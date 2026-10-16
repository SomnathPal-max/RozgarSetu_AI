'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  FileCheck2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  CheckCircle,
  Compass,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { AudioPlaybackButton } from '@/components/AudioPlaybackButton';
import { getSessionProfile, type UserProfile } from '@/lib/profile';
import { checkEligibility, calculateAgeOnDate, type Rule, type CriterionResult, type EligibilityStatus } from '@/engine';
import { getExplanation, getGapCoachText } from '@/explain';
import { type Locale } from '@/i18n/config';

interface VacancyData {
  id: string;
  title: string;
  orgName: string;
  sourceUrl: string;
  lastDate: string;
}

interface EligibilityCheckClientProps {
  id: string;
  locale: Locale;
}

export function EligibilityCheckClient({ id, locale }: EligibilityCheckClientProps) {
  const t = useTranslations('screen4');
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vacancy, setVacancy] = useState<VacancyData | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Load client-side session profile (Rule 8: never sent to persist in DB)
    const stored = getSessionProfile();
    setProfile(stored);

    // 2. Load vacancy rules
    async function fetchVacancyRules() {
      try {
        setLoading(true);
        const res = await fetch(`/api/vacancies/${id}`);
        if (res.ok) {
          const data = await res.json();
          setVacancy(data.vacancy);

          interface RawDbRule {
            criterion: Rule['criterion'];
            paramsJson: string | Record<string, unknown>;
            sourceClause?: string;
            ambiguous?: boolean | number;
            hasCorrigendum?: boolean | number;
          }

          // Map database rules to engine Rule format
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
        console.error('Failed to load rules:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVacancyRules();
  }, [id]);

  // Evaluate rules deterministically using pure rules engine
  const evaluationResult = useMemo(() => {
    if (!profile || rules.length === 0) return null;
    return checkEligibility(
      {
        dob: profile.dob,
        qualificationLevel: profile.qualificationLevel,
        qualificationStream: profile.qualificationStream,
        category: profile.category,
        disability: profile.disability,
      },
      rules,
      '2026-08-01'
    );
  }, [profile, rules]);

  // Construct speech text for Web Speech API
  const audioTranscript = useMemo(() => {
    if (!evaluationResult || !vacancy) return '';
    let speech = `${vacancy.title}. `;
    for (const res of evaluationResult.results) {
      const expl = getExplanation(res.reasonCode, locale, res.params);
      speech += `${expl} `;
      if (res.gap && res.gap.type !== 'none') {
        const gapText = getGapCoachText(res.gap, locale);
        if (gapText) speech += `${gapText} `;
      }
    }
    return speech;
  }, [evaluationResult, vacancy, locale]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center py-12 text-slate-500 text-sm">
        {t('summary')}...
      </div>
    );
  }

  if (!vacancy || !evaluationResult) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        No rule data available.{' '}
        <Link href={`/${locale}/vacancies`} className="text-blue-600 underline">
          Return to list
        </Link>
      </div>
    );
  }

  // Find Gap Coach items from results (if any not_met has gap)
  const gapCoachItems = evaluationResult.results.filter(
    (r) => r.status === 'not_met' && r.gap && r.gap.type !== 'none'
  );

  // Status badge styling and text helper
  const renderStatusBadge = (status: EligibilityStatus) => {
    switch (status) {
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 text-white px-2.5 py-1 text-xs font-bold tracking-wide">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{t('matched')}</span>
          </span>
        );
      case 'not_met':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 text-white px-2.5 py-1 text-xs font-bold tracking-wide">
            <XCircle className="w-3.5 h-3.5" />
            <span>{t('notMet')}</span>
          </span>
        );
      case 'missing_data':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-600 text-white px-2.5 py-1 text-xs font-bold tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('missingData')}</span>
          </span>
        );
      case 'manual_review':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-600 text-white px-2.5 py-1 text-xs font-bold tracking-wide">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t('manualReview')}</span>
          </span>
        );
    }
  };

  // Criterion title helper matching Screen 4 mock-up exactly
  const getCriterionTitle = (res: CriterionResult) => {
    switch (res.criterion) {
      case 'age':
        return 'Age limit 30 on the cut-off date';
      case 'qualification':
        return 'Graduate degree required';
      case 'category_relaxation':
        return 'Category relaxation';
      case 'equivalent_qualification':
        return 'Equivalent qualification clause';
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] justify-between space-y-6 pb-2">
      <div className="space-y-4">
        {/* Back navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 min-h-[44px] min-w-[44px] -ml-2 px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Heading & Profile Summary matching Screen 4 */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Your result: {id === 'notice-a' ? 'Notice A' : vacancy.title}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {profile?.dob
              ? `Age ${calculateAgeOnDate(profile.dob, '2026-08-01')} · ${
                  profile.qualificationLevel
                    ? profile.qualificationLevel.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                    : 'Higher Secondary'
                } · ${profile.category ? profile.category.toUpperCase() : 'category not entered'}`
              : 'Age 24 · Higher Secondary · category not entered'}
          </p>
        </div>

        {/* Per-Criterion Cards matching Screen 4 */}
        <div className="space-y-3">
          {evaluationResult.results.map((res) => {
            const explanation = getExplanation(res.reasonCode, locale, res.params);

            return (
              <div
                key={res.criterion}
                className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {getCriterionTitle(res)}
                  </h2>
                </div>
                <div>{renderStatusBadge(res.status)}</div>
                <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                  {explanation}
                </p>
              </div>
            );
          })}
        </div>

        {/* Gap Coach Callout Card matching Screen 4 */}
        {gapCoachItems.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
              <Compass className="w-4 h-4 text-amber-700" />
              <span>{t('gapCoach')}</span>
            </div>
            {gapCoachItems.map((item, idx) => {
              const gapText = getGapCoachText(item.gap, locale);
              return (
                <p key={idx} className="text-xs text-amber-900/90 leading-relaxed font-medium">
                  {gapText}
                </p>
              );
            })}
          </div>
        )}

        {/* Audio Playback Button */}
        <div className="pt-1">
          <AudioPlaybackButton textToSpeak={audioTranscript} locale={locale} />
        </div>

        {/* Mandatory Rule 4 disclaimer: Preliminary. Check the full official notice. */}
        <div className="text-center pt-2 space-y-2">
          <p className="text-xs font-semibold text-slate-600 tracking-wide">
            {t('preliminaryNotice')}
          </p>
          <a
            href={vacancy.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 underline font-medium min-h-[44px] py-1"
          >
            <span>{t('viewOfficialNotice')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Next Step Action Button -> Documents to prepare (Screen 5) */}
        <div className="pt-2">
          <Link
            href={`/${locale}/vacancies/${id}/documents`}
            className="w-full rounded-xl bg-blue-600 py-3.5 px-4 text-white font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2 min-h-[48px]"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Documents to prepare</span>
          </Link>
        </div>
      </div>

      <BottomNav locale={locale} />
    </div>
  );
}
